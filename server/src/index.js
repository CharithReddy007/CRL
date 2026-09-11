import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer } from 'ws';
import { C2S, S2C } from '@crl/shared';
import { RoomManager } from './RoomManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

const app = express();
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/ws')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => { if (err) next(); });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const rooms = new RoomManager();

let nextId = 1;

wss.on('connection', (socket) => {
  const conn = { id: `p${nextId++}`, socket, roomCode: null };

  socket.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!msg || typeof msg.t !== 'string') return;

    if (msg.t === C2S.CREATE_ROOM) {
      const room = rooms.createRoom();
      conn.roomCode = room.code;
      room.join(conn, msg.name);
      return;
    }
    if (msg.t === C2S.JOIN_ROOM) {
      const room = rooms.getRoom(msg.code);
      if (!room) { socket.send(JSON.stringify({ t: S2C.ERROR, message: 'Room not found' })); return; }
      if (room.join(conn, msg.name)) conn.roomCode = room.code;
      return;
    }
    if (msg.t === C2S.LEAVE) {
      if (conn.roomCode) {
        const room = rooms.getRoom(conn.roomCode);
        if (room) { room.leave(conn.id); rooms.removeIfEmpty(room); }
        conn.roomCode = null;
      }
      return;
    }
    if (conn.roomCode) {
      const room = rooms.getRoom(conn.roomCode);
      if (room) room.handle(conn, msg);
    }
  });

  socket.on('close', () => {
    if (conn.roomCode) {
      const room = rooms.getRoom(conn.roomCode);
      if (room) { room.leave(conn.id); rooms.removeIfEmpty(room); }
    }
  });
});

server.listen(PORT, () => {
  console.log(`CRL server listening on :${PORT}`);
});
