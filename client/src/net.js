export class Net {
  constructor() {
    this.socket = null;
    this.handlers = new Map();
    this.connected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const url = `${proto}://${location.host}/ws`;
      this.socket = new WebSocket(url);
      this.socket.addEventListener('open', () => { this.connected = true; resolve(); });
      this.socket.addEventListener('error', (e) => reject(e));
      this.socket.addEventListener('close', () => {
        this.connected = false;
        this.emit('_close', {});
      });
      this.socket.addEventListener('message', (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (msg && typeof msg.t === 'string') this.emit(msg.t, msg);
      });
    });
  }

  on(type, fn) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(fn);
    return () => this.handlers.get(type)?.delete(fn);
  }

  emit(type, msg) {
    const set = this.handlers.get(type);
    if (set) for (const fn of set) fn(msg);
  }

  send(type, payload = {}) {
    if (!this.connected) return;
    this.socket.send(JSON.stringify({ t: type, ...payload }));
  }
}

export const net = new Net();
