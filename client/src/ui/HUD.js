import { getWeapon, ROUND_PHASE, TEAM_A } from '@crl/shared';

const PHASE_LABEL = {
  [ROUND_PHASE.WARMUP]: 'WARMUP',
  [ROUND_PHASE.BUY]: 'BUY PHASE',
  [ROUND_PHASE.COMBAT]: '',
  [ROUND_PHASE.POST_PLANT]: 'CORE ARMED',
  [ROUND_PHASE.ROUND_END]: 'ROUND OVER',
  [ROUND_PHASE.MATCH_END]: 'MATCH OVER',
};

export class HUD {
  constructor(root) {
    this.root = document.createElement('div');
    this.root.className = 'hud-root hidden';
    root.appendChild(this.root);
    this.root.innerHTML = `
      <div class="hud-top">
        <div class="score score-a"><span class="score-num" id="score-a">0</span><span class="score-label">ATK</span></div>
        <div class="timer-wrap">
          <div id="phase-label" class="phase-label"></div>
          <div id="timer" class="timer">0:00</div>
        </div>
        <div class="score score-b"><span class="score-label">DEF</span><span class="score-num" id="score-b">0</span></div>
      </div>
      <div id="core-status" class="core-status hidden"></div>
      <div id="killfeed" class="killfeed"></div>
      <div class="crosshair" id="crosshair">
        <div class="ch-line ch-top"></div><div class="ch-line ch-bottom"></div>
        <div class="ch-line ch-left"></div><div class="ch-line ch-right"></div>
        <div class="ch-dot"></div>
      </div>
      <div id="hitmarker" class="hitmarker hidden"></div>
      <div id="damage-flash" class="damage-flash"></div>
      <div id="interact-prompt" class="interact-prompt hidden">
        <div class="interact-bar"><div id="interact-fill" class="interact-fill"></div></div>
        <div id="interact-text"></div>
      </div>
      <div id="death-overlay" class="death-overlay hidden">
        <div class="death-text">YOU DIED</div>
        <div class="spectate-text" id="spectate-text"></div>
      </div>
      <div class="hud-bottom">
        <div class="bottom-left">
          <div class="stat armor"><span id="armor-val">0</span></div>
          <div class="stat hp"><span id="hp-val">100</span></div>
        </div>
        <div class="bottom-right">
          <div class="weapon-name" id="weapon-name"></div>
          <div class="ammo-row"><span id="ammo-mag">--</span><span class="ammo-sep">/</span><span id="ammo-reserve">--</span></div>
        </div>
        <div class="credits-box"><span class="credits-icon">¤</span><span id="credits-val">800</span></div>
      </div>
      <div id="round-banner" class="round-banner hidden"></div>
      <div id="match-banner" class="match-banner hidden"></div>
      <div id="buy-hint" class="buy-hint hidden">Press <b>B</b> to buy</div>
    `;
    this.els = {};
    for (const id of ['score-a', 'score-b', 'phase-label', 'timer', 'core-status', 'killfeed', 'crosshair',
      'hitmarker', 'damage-flash', 'interact-prompt', 'interact-fill', 'interact-text', 'death-overlay',
      'spectate-text', 'armor-val', 'hp-val', 'weapon-name', 'ammo-mag', 'ammo-reserve', 'credits-val',
      'round-banner', 'match-banner', 'buy-hint']) {
      this.els[id] = this.root.querySelector('#' + id);
    }
    this.killfeedTimers = [];
  }

  show() { this.root.classList.remove('hidden'); }
  hide() { this.root.classList.add('hidden'); }

  setRoundState(rs) {
    this.els['score-a'].textContent = rs.scoreA;
    this.els['score-b'].textContent = rs.scoreB;
    const mins = Math.floor(rs.secLeft / 60), secs = rs.secLeft % 60;
    this.els['timer'].textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    this.els['timer'].classList.toggle('urgent', rs.secLeft <= 10 && (rs.phase === ROUND_PHASE.COMBAT || rs.phase === ROUND_PHASE.POST_PLANT));
    this.els['phase-label'].textContent = rs.ot ? `OT · ${PHASE_LABEL[rs.phase] || ''}` : (PHASE_LABEL[rs.phase] || '');
    this.els['buy-hint'].classList.toggle('hidden', rs.phase !== ROUND_PHASE.BUY);
  }

  setCoreState(core, myTeam) {
    const el = this.els['core-status'];
    if (core.state === 'planted') { el.textContent = 'CORE ARMED'; el.className = 'core-status armed'; }
    else if (core.state === 'defused') { el.textContent = 'CORE DEFUSED'; el.className = 'core-status defused'; }
    else if (core.state === 'detonated') { el.textContent = 'CORE DETONATED'; el.className = 'core-status armed'; }
    else if (core.state === 'dropped') { el.textContent = 'CORE DROPPED'; el.className = 'core-status'; }
    else { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
  }

  setPlayer(p) {
    this.els['hp-val'].textContent = Math.max(0, Math.round(p.hp));
    this.els['armor-val'].textContent = Math.round(p.armorValue || 0);
    const weaponId = p.weapons[p.active];
    const weapon = weaponId && getWeapon(weaponId);
    this.els['weapon-name'].textContent = weapon ? weapon.name : '';
    if (p.ammo) {
      this.els['ammo-mag'].textContent = p.reloading ? '...' : p.ammo.mag;
      this.els['ammo-reserve'].textContent = p.ammo.reserve;
    } else {
      this.els['ammo-mag'].textContent = '--';
      this.els['ammo-reserve'].textContent = '';
    }
    this.els['credits-val'].textContent = p.credits;
  }

  flashHit(isKill) {
    const hm = this.els['hitmarker'];
    hm.classList.remove('hidden');
    hm.classList.toggle('kill', !!isKill);
    void hm.offsetWidth;
    hm.classList.add('show');
    clearTimeout(this._hitTimer);
    this._hitTimer = setTimeout(() => { hm.classList.remove('show'); hm.classList.add('hidden'); }, 220);
  }

  flashDamage() {
    const el = this.els['damage-flash'];
    el.classList.add('show');
    clearTimeout(this._dmgTimer);
    this._dmgTimer = setTimeout(() => el.classList.remove('show'), 260);
  }

  addKillFeed(text, teamClass) {
    const row = document.createElement('div');
    row.className = 'kf-row ' + (teamClass || '');
    row.textContent = text;
    this.els['killfeed'].prepend(row);
    setTimeout(() => row.remove(), 6000);
    while (this.els['killfeed'].children.length > 6) this.els['killfeed'].lastChild.remove();
  }

  showInteract(text, progress) {
    this.els['interact-prompt'].classList.remove('hidden');
    this.els['interact-text'].textContent = text;
    this.els['interact-fill'].style.width = `${Math.round((progress || 0) * 100)}%`;
  }

  hideInteract() { this.els['interact-prompt'].classList.add('hidden'); }

  setDead(dead, spectatingName) {
    this.els['death-overlay'].classList.toggle('hidden', !dead);
    this.els['crosshair'].classList.toggle('hidden', dead);
    this.els['spectate-text'].textContent = spectatingName
      ? `Spectating ${spectatingName}  ·  Q/E to switch`
      : 'No teammates alive';
  }

  showRoundBanner(text, cls) {
    const el = this.els['round-banner'];
    el.textContent = text;
    el.className = 'round-banner ' + (cls || '');
    el.classList.remove('hidden');
    clearTimeout(this._roundBannerTimer);
    this._roundBannerTimer = setTimeout(() => el.classList.add('hidden'), 4500);
  }

  showMatchBanner(text) {
    const el = this.els['match-banner'];
    el.textContent = text;
    el.classList.remove('hidden');
  }

  hideMatchBanner() { this.els['match-banner'].classList.add('hidden'); }
}
