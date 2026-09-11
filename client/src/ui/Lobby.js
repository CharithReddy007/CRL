import { net } from '../net.js';
import { C2S, S2C, TEAM_A, TEAM_B, MAP_LIST } from '@crl/shared';
import { drawMapPreview } from './MapPreview.js';

const STORAGE_KEY = 'crl.playerName';

export class Lobby {
  constructor(root, { onMatchStart }) {
    this.root = root;
    this.onMatchStart = onMatchStart;
    this.el = document.createElement('div');
    this.el.className = 'lobby-root';
    root.appendChild(this.el);
    this.state = null;
    this.selfId = null;

    net.on(S2C.ROOM_STATE, (msg) => this.handleRoomState(msg));
    net.on(S2C.ERROR, (msg) => this.showError(msg.message));
    net.on(S2C.MATCH_START, () => { this.hide(); });

    this.renderHome();
  }

  show() { this.el.classList.remove('hidden'); }
  hide() { this.el.classList.add('hidden'); }

  showError(text) {
    let bar = this.el.querySelector('.error-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'error-bar';
      this.el.prepend(bar);
    }
    bar.textContent = text;
    bar.classList.add('show');
    clearTimeout(this._errTimer);
    this._errTimer = setTimeout(() => bar.classList.remove('show'), 3500);
  }

  savedName() {
    return localStorage.getItem(STORAGE_KEY) || `Player${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  renderHome() {
    this.el.innerHTML = `
      <div class="home-panel panel">
        <h1 class="crl-title">CRL</h1>
        <p class="crl-subtitle">Tactical multiplayer FPS</p>
        <label class="field-label">Callsign</label>
        <input id="name-input" maxlength="20" value="${this.savedName()}" />
        <div class="home-actions">
          <button id="create-btn" class="primary">Create Room</button>
          <div class="join-row">
            <input id="code-input" placeholder="ROOM CODE" maxlength="5" style="text-transform:uppercase" />
            <button id="join-btn">Join</button>
          </div>
        </div>
      </div>`;
    this.el.querySelector('#create-btn').onclick = () => {
      const name = this.readName();
      net.send(C2S.CREATE_ROOM, { name });
    };
    this.el.querySelector('#join-btn').onclick = () => {
      const name = this.readName();
      const code = this.el.querySelector('#code-input').value.trim().toUpperCase();
      if (code) net.send(C2S.JOIN_ROOM, { code, name });
    };
  }

  readName() {
    const name = this.el.querySelector('#name-input').value.trim().slice(0, 20) || this.savedName();
    localStorage.setItem(STORAGE_KEY, name);
    return name;
  }

  handleRoomState(msg) {
    this.state = msg;
    this.selfId = msg.selfId;
    this.renderLobby();
  }

  renderLobby() {
    if (this.el.querySelector('.home-panel')) this.el.innerHTML = '';
    const s = this.state;
    const teamA = s.players.filter((p) => p.team === TEAM_A);
    const teamB = s.players.filter((p) => p.team === TEAM_B);
    const isHost = s.hostId === this.selfId;
    const mapData = MAP_LIST.find((m) => m.id === s.mapId) || MAP_LIST[0];

    if (!this.el.querySelector('.lobby-panel')) {
      this.el.innerHTML = `
        <div class="lobby-panel panel">
          <div class="lobby-header">
            <div>ROOM <span class="room-code"></span></div>
            <button id="leave-btn" class="danger">Leave</button>
          </div>
          <div class="lobby-body">
            <div class="teams-col">
              <div class="team-box team-a">
                <h3>Team A — Attackers</h3>
                <ul class="player-list" data-team="A"></ul>
                <button class="switch-team" data-team="A">Join Team A</button>
              </div>
              <div class="team-box team-b">
                <h3>Team B — Defenders</h3>
                <ul class="player-list" data-team="B"></ul>
                <button class="switch-team" data-team="B">Join Team B</button>
              </div>
            </div>
            <div class="map-col">
              <h3>Map</h3>
              <div class="map-grid"></div>
            </div>
          </div>
          <div class="lobby-footer">
            <button id="ready-btn"></button>
            <button id="start-btn" class="primary">Start Match</button>
          </div>
        </div>`;
      this.el.querySelector('#leave-btn').onclick = () => { net.send(C2S.LEAVE); location.reload(); };
      this.el.querySelectorAll('.switch-team').forEach((btn) => {
        btn.onclick = () => net.send(C2S.SET_TEAM, { team: btn.dataset.team });
      });
      this.el.querySelector('#ready-btn').onclick = () => {
        const me = this.state.players.find((p) => p.id === this.selfId);
        net.send(C2S.SET_READY, { ready: !me?.ready });
      };
      this.el.querySelector('#start-btn').onclick = () => net.send(C2S.START_MATCH);
      const grid = this.el.querySelector('.map-grid');
      for (const m of MAP_LIST) {
        const card = document.createElement('div');
        card.className = 'map-card';
        card.dataset.mapId = m.id;
        const canvas = document.createElement('canvas');
        canvas.width = 120; canvas.height = 84;
        drawMapPreview(canvas, m);
        card.appendChild(canvas);
        const label = document.createElement('div');
        label.textContent = m.name;
        card.appendChild(label);
        // re-check host status at click time, not at card-creation time --
        // this DOM is only built once, but who's host can change later
        card.onclick = () => {
          if (this.state?.hostId === this.selfId) net.send(C2S.SET_MAP, { mapId: m.id });
        };
        grid.appendChild(card);
      }
    }

    this.el.querySelector('.room-code').textContent = s.code;
    this.renderTeamList('A', teamA);
    this.renderTeamList('B', teamB);
    this.el.querySelectorAll('.map-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.mapId === s.mapId);
      card.classList.toggle('locked', !isHost);
    });
    const me = s.players.find((p) => p.id === this.selfId);
    const readyBtn = this.el.querySelector('#ready-btn');
    readyBtn.textContent = me?.ready ? 'Ready ✓' : 'Ready Up';
    readyBtn.classList.toggle('primary', !!me?.ready);
    const startBtn = this.el.querySelector('#start-btn');
    startBtn.classList.toggle('hidden', !isHost);
    startBtn.disabled = teamA.length === 0 || teamB.length === 0 || s.players.some((p) => p.id !== s.hostId && !p.ready);
  }

  renderTeamList(team, players) {
    const ul = this.el.querySelector(`.player-list[data-team="${team}"]`);
    ul.innerHTML = players.map((p) => `<li class="${p.ready ? 'ready' : ''}">${p.name}${p.id === this.state.hostId ? ' <span class="host-tag">HOST</span>' : ''}</li>`).join('');
  }
}
