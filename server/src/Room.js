import { C2S, S2C, MIN_PLAYERS, MAX_PLAYERS, TEAM_A, TEAM_B, MAPS_BY_ID } from '@crl/shared';
import { Match } from './Match.js';

function send(conn, type, payload) {
  if (conn.socket.readyState !== conn.socket.OPEN) return;
  conn.socket.send(JSON.stringify({ t: type, ...payload }));
}

export class Room {
  constructor(code) {
    this.code = code;
    this.members = new Map(); // id -> { conn, name, team, ready }
    this.hostId = null;
    this.mapId = 'iron_yard';
    this.state = 'lobby';
    this.match = null;
  }

  get size() { return this.members.size; }

  broadcast(type, payload) {
    for (const m of this.members.values()) send(m.conn, type, payload);
  }

  sendTo(id, type, payload) {
    const m = this.members.get(id);
    if (m) send(m.conn, type, payload);
  }

  lobbyStatePayload() {
    return {
      code: this.code,
      hostId: this.hostId,
      mapId: this.mapId,
      state: this.state,
      players: [...this.members.values()].map(m => ({ id: m.conn.id, name: m.name, team: m.team, ready: m.ready })),
    };
  }

  broadcastLobbyState() {
    this.broadcast(S2C.ROOM_STATE, this.lobbyStatePayload());
  }

  join(conn, name) {
    if (this.members.size >= MAX_PLAYERS) {
      send(conn, S2C.ERROR, { message: 'Room is full' });
      return false;
    }
    if (this.state !== 'lobby') {
      send(conn, S2C.ERROR, { message: 'Match already in progress' });
      return false;
    }
    const countA = [...this.members.values()].filter(m => m.team === TEAM_A).length;
    const countB = [...this.members.values()].filter(m => m.team === TEAM_B).length;
    const team = countA <= countB ? TEAM_A : TEAM_B;
    this.members.set(conn.id, { conn, name: name || `Player${this.members.size + 1}`, team, ready: false });
    if (!this.hostId) this.hostId = conn.id;
    this.broadcastLobbyState();
    return true;
  }

  leave(id) {
    if (!this.members.has(id)) return;
    this.members.delete(id);
    if (this.match) this.match.removePlayer(id);
    if (this.hostId === id) {
      const next = this.members.keys().next();
      this.hostId = next.done ? null : next.value;
    }
    this.broadcastLobbyState();
  }

  handle(conn, msg) {
    const member = this.members.get(conn.id);
    if (!member) return;
    switch (msg.t) {
      case C2S.SET_NAME:
        member.name = String(msg.name || member.name).slice(0, 20);
        this.broadcastLobbyState();
        break;
      case C2S.SET_TEAM:
        if (this.state !== 'lobby') return;
        if (msg.team === TEAM_A || msg.team === TEAM_B) {
          member.team = msg.team;
          member.ready = false;
          this.broadcastLobbyState();
        }
        break;
      case C2S.SET_MAP:
        if (this.state !== 'lobby' || conn.id !== this.hostId) return;
        if (MAPS_BY_ID[msg.mapId]) {
          this.mapId = msg.mapId;
          this.broadcastLobbyState();
        }
        break;
      case C2S.SET_READY:
        if (this.state !== 'lobby') return;
        member.ready = !!msg.ready;
        this.broadcastLobbyState();
        break;
      case C2S.START_MATCH:
        this.tryStartMatch(conn.id);
        break;
      case C2S.INPUT:
        if (this.match) this.match.handleInput(conn.id, msg.input);
        break;
      case C2S.FIRE:
        if (this.match) this.match.handleFire(conn.id);
        break;
      case C2S.RELOAD:
        if (this.match) this.match.handleReload(conn.id);
        break;
      case C2S.SWITCH_WEAPON:
        if (this.match) this.match.handleSwitchWeapon(conn.id, msg.slot);
        break;
      case C2S.INTERACT_START:
        if (this.match) this.match.handleInteractStart(conn.id, msg.type);
        break;
      case C2S.INTERACT_STOP:
        if (this.match) this.match.handleInteractStop(conn.id);
        break;
      case C2S.BUY:
        if (this.match) this.match.handleBuy(conn.id, msg.slot, msg.itemId);
        break;
      case C2S.SPECTATE_TARGET:
        if (this.match) this.match.handleSpectateTarget(conn.id, msg.targetId);
        break;
      case C2S.CHAT:
        this.broadcast(S2C.CHAT, { id: conn.id, name: member.name, text: String(msg.text || '').slice(0, 200) });
        break;
      default:
        break;
    }
  }

  tryStartMatch(byId) {
    if (byId !== this.hostId || this.state !== 'lobby') return;
    const countA = [...this.members.values()].filter(m => m.team === TEAM_A).length;
    const countB = [...this.members.values()].filter(m => m.team === TEAM_B).length;
    if (this.members.size < MIN_PLAYERS || countA === 0 || countB === 0) {
      this.sendTo(byId, S2C.ERROR, { message: 'Need at least one player on each team' });
      return;
    }
    const notReady = [...this.members.values()].some(m => m.conn.id !== this.hostId && !m.ready);
    if (notReady) {
      this.sendTo(byId, S2C.ERROR, { message: 'All players must be ready' });
      return;
    }
    const mapData = MAPS_BY_ID[this.mapId];
    this.state = 'in_match';
    this.match = new Match(this, mapData);
    for (const m of this.members.values()) this.match.addPlayer(m.conn, m.team, m.name);
    this.broadcast(S2C.MATCH_START, { mapId: this.mapId, players: [...this.members.values()].map(m => ({ id: m.conn.id, name: m.name, team: m.team })) });
    this.match.start();
  }
}
