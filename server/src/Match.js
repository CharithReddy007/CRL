import {
  TICK_RATE, TICK_MS, PLAYER_MAX_HP, PLAYER_HEIGHT, PLAYER_CROUCH_HEIGHT,
  PLAYER_EYE_HEIGHT, PLAYER_CROUCH_EYE_HEIGHT,
  ROUND_TIME_SEC, BUY_TIME_SEC, POST_PLANT_TIME_SEC, ROUND_END_TIME_SEC,
  PLANT_TIME_SEC, DEFUSE_TIME_SEC, ROUNDS_TO_WIN, SIDE_SWAP_ROUND,
  OVERTIME_ROUNDS_TO_WIN, START_CREDITS, MAX_CREDITS, CREDIT_ROUND_WIN,
  CREDIT_ROUND_LOSS_BASE, CREDIT_LOSS_STREAK_BONUS, CREDIT_KILL, CREDIT_PLANT, CREDIT_DEFUSE,
  TEAM_A, TEAM_B, ARMOR_LIGHT, ARMOR_HEAVY,
  simulateMove, rayGeometry, rayPlayer,
  getWeapon, computeDamage, DEFAULT_LOADOUT,
  ROUND_PHASE, S2C,
} from '@crl/shared';

function dist2(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}
function normalize(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function addScaled(base, a, sa, b, sb) {
  return [base[0] + a[0] * sa + b[0] * sb, base[1] + a[1] * sa + b[1] * sb, base[2] + a[2] * sa + b[2] * sb];
}

function initAmmo(state) {
  for (const slot of ['primary', 'secondary', 'melee']) {
    const id = state.weapons[slot];
    const weapon = id && getWeapon(id);
    state.ammo[slot] = weapon && weapon.magSize ? { mag: weapon.magSize, reserve: weapon.reserveMax } : null;
  }
}

let uidCounter = 1;
const ASSIST_WINDOW_TICKS = 5 * TICK_RATE;

export class Match {
  constructor(room, mapData) {
    this.room = room;
    this.map = mapData;
    this.solids = mapData.geometry.filter(o => o.solid);
    this.players = new Map();
    this.round = 0;
    this.scoreA = 0;
    this.scoreB = 0;
    this.lossStreakA = 0;
    this.lossStreakB = 0;
    this.attackTeam = TEAM_A;
    this.defendTeam = TEAM_B;
    this.ot = false;
    this.otStartA = 0;
    this.otStartB = 0;
    this.phase = ROUND_PHASE.WARMUP;
    this.phaseEndsAtTick = 0;
    this.tick = 0;
    this.core = { state: 'none', carrierId: null, pos: null, siteId: null };
    this.interval = null;
    this.ended = false;
  }

  addPlayer(conn, team, name) {
    const state = {
      id: conn.id, name, team, conn,
      pos: [0, 0, 0], vel: [0, 0, 0], grounded: true, crouched: false,
      yaw: 0, pitch: 0, ads: false,
      hp: PLAYER_MAX_HP, armorType: null, armorValue: 0,
      alive: true,
      weapons: { ...DEFAULT_LOADOUT },
      ammo: {}, active: 'secondary',
      reloading: false, reloadEndTick: 0,
      credits: START_CREDITS,
      kills: 0, deaths: 0, assists: 0,
      lastFireTick: -9999,
      hasCore: false,
      interacting: null,
      lastDamager: null,
      pendingInput: null,
      lastInputSeq: 0,
      spectating: null,
      connected: true,
    };
    initAmmo(state);
    this.players.set(conn.id, state);
    return state;
  }

  removePlayer(id) {
    const p = this.players.get(id);
    if (!p) return;
    p.connected = false;
    if (p.alive) this.killPlayer(p, null, 'disconnect');
  }

  physicalSideFor(p) {
    return p.team === this.attackTeam ? 'A' : 'B';
  }

  pickSpawn(p) {
    const points = this.map.spawns[this.physicalSideFor(p)];
    const idx = [...this.players.values()].filter(q => this.physicalSideFor(q) === this.physicalSideFor(p)).indexOf(p);
    const pt = points[idx % points.length] || points[0];
    return pt;
  }

  broadcast(type, payload) {
    this.room.broadcast(type, payload);
  }

  // ---- Match lifecycle ----
  start() {
    this.round = 1;
    this.tick = 0;
    this.resetForRound();
    this.phase = ROUND_PHASE.BUY;
    this.phaseEndsAtTick = this.tick + BUY_TIME_SEC * TICK_RATE;
    this.interval = setInterval(() => this.step(), TICK_MS);
    this.broadcastRoundState();
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  resetForRound() {
    for (const p of this.players.values()) {
      const spawn = this.pickSpawn(p);
      p.pos = spawn.pos.slice();
      p.vel = [0, 0, 0];
      p.grounded = true;
      p.crouched = false;
      p.yaw = spawn.yaw;
      p.pitch = 0;
      p.hp = PLAYER_MAX_HP;
      p.alive = p.connected;
      initAmmo(p);
      p.reloading = false;
      p.hasCore = false;
      p.interacting = null;
      p.spectating = null;
      p.lastDamager = null;
    }
    this.core = { state: 'none', carrierId: null, pos: null, siteId: null };
    const attackers = [...this.players.values()].filter(p => p.team === this.attackTeam && p.alive);
    if (attackers.length) {
      const carrier = attackers[0];
      carrier.hasCore = true;
      this.core = { state: 'carried', carrierId: carrier.id, pos: null, siteId: null };
    }
  }

  // ---- Input handlers (called from Room on C2S messages) ----
  handleInput(playerId, input) {
    const p = this.players.get(playerId);
    if (p) p.pendingInput = input;
  }

  handleFire(playerId) {
    const p = this.players.get(playerId);
    if (!p || !p.alive) return;
    if (this.phase !== ROUND_PHASE.COMBAT && this.phase !== ROUND_PHASE.POST_PLANT) return;
    const weaponId = p.weapons[p.active];
    if (!weaponId) return;
    const weapon = getWeapon(weaponId);
    if (!weapon || p.reloading) return;
    const ammoState = p.ammo[p.active];
    const fireIntervalTicks = Math.max(1, Math.round((TICK_RATE * 60) / weapon.fireRateRpm));
    if (this.tick - p.lastFireTick < fireIntervalTicks) return;
    if (ammoState && ammoState.mag <= 0) return;
    p.lastFireTick = this.tick;
    if (ammoState) ammoState.mag -= 1;

    const eyeY = p.pos[1] + (p.crouched ? PLAYER_CROUCH_EYE_HEIGHT : PLAYER_EYE_HEIGHT);
    const origin = [p.pos[0], eyeY, p.pos[2]];
    const shots = weapon.pellets || 1;
    for (let s = 0; s < shots; s++) {
      const dir = this.aimDirWithSpread(p, weapon);
      this.resolveShot(p, weapon, origin, dir);
    }
    this.broadcast(S2C.SOUND, { type: 'gunshot', weapon: weaponId, pos: p.pos, shooterId: p.id, id: uidCounter++ });
  }

  aimDirWithSpread(p, weapon) {
    const moving = Math.hypot(p.vel[0], p.vel[2]) > 0.5;
    const spreadDeg = !p.grounded ? weapon.spread.jumping : p.ads ? weapon.spread.ads : moving ? weapon.spread.moving : weapon.spread.base;
    const spreadRad = (spreadDeg * Math.PI) / 180;
    const cy = Math.cos(p.yaw), sy = Math.sin(p.yaw);
    const cp = Math.cos(p.pitch), sp = Math.sin(p.pitch);
    const dir = [sy * cp, sp, cy * cp];
    const up = Math.abs(dir[1]) < 0.99 ? [0, 1, 0] : [1, 0, 0];
    const right = normalize(cross(dir, up));
    const trueUp = cross(right, dir);
    const theta = Math.random() * Math.PI * 2;
    const r = Math.random() * spreadRad;
    return normalize(addScaled(dir, right, Math.cos(theta) * r, trueUp, Math.sin(theta) * r));
  }

  resolveShot(shooter, weapon, origin, dir) {
    const maxRange = weapon.range || 50;
    const geomHit = rayGeometry(origin, dir, this.solids, maxRange);
    let nearestT = geomHit ? geomHit.t : maxRange;
    let nearestPlayer = null, hitZone = null;
    for (const target of this.players.values()) {
      if (target.id === shooter.id || !target.alive) continue;
      const height = target.crouched ? PLAYER_CROUCH_HEIGHT : PLAYER_HEIGHT;
      const res = rayPlayer(origin, dir, target.pos, height, nearestT);
      if (res && res.t < nearestT) {
        nearestT = res.t;
        nearestPlayer = target;
        hitZone = res.zone;
      }
    }
    if (!nearestPlayer) return;
    const absorb = nearestPlayer.armorType === 'heavy' ? ARMOR_HEAVY.absorb : nearestPlayer.armorType === 'light' ? ARMOR_LIGHT.absorb : 0;
    const { damage, armorDamage } = computeDamage(weapon, nearestT, hitZone, nearestPlayer.armorValue, absorb);
    nearestPlayer.armorValue = Math.max(0, nearestPlayer.armorValue - armorDamage);
    nearestPlayer.hp -= damage;
    this.broadcast(S2C.DAMAGE, { shooterId: shooter.id, targetId: nearestPlayer.id, zone: hitZone, damage, hp: Math.max(0, nearestPlayer.hp) });
    if (nearestPlayer.hp <= 0) {
      this.killPlayer(nearestPlayer, shooter, hitZone);
    } else {
      nearestPlayer.lastDamager = { id: shooter.id, tick: this.tick };
    }
  }

  handleReload(playerId) {
    const p = this.players.get(playerId);
    if (!p || !p.alive || p.reloading) return;
    const weaponId = p.weapons[p.active];
    const weapon = weaponId && getWeapon(weaponId);
    const ammoState = p.ammo[p.active];
    if (!weapon || !ammoState || ammoState.mag >= weapon.magSize || ammoState.reserve <= 0) return;
    p.reloading = true;
    p.reloadEndTick = this.tick + Math.round((weapon.reloadMs / 1000) * TICK_RATE);
  }

  handleSwitchWeapon(playerId, slot) {
    const p = this.players.get(playerId);
    if (!p || !p.alive || !['primary', 'secondary', 'melee'].includes(slot)) return;
    if (slot !== 'melee' && !p.weapons[slot]) return;
    p.active = slot;
    p.reloading = false;
  }

  handleInteractStart(playerId, type) {
    const p = this.players.get(playerId);
    if (!p || !p.alive) return;
    if (type === 'plant') {
      if (p.team !== this.attackTeam || !p.hasCore) return;
      const site = this.nearestSite(p.pos);
      if (!site) return;
      p.interacting = { type: 'plant', startTick: this.tick, startPos: p.pos.slice(), siteId: site.siteId };
    } else if (type === 'defuse') {
      if (p.team !== this.defendTeam || this.core.state !== 'planted') return;
      if (dist2(p.pos, this.core.pos) > 16) return;
      p.interacting = { type: 'defuse', startTick: this.tick, startPos: p.pos.slice() };
    }
    this.broadcast(S2C.CORE_STATE, this.coreStatePayload());
  }

  handleInteractStop(playerId) {
    const p = this.players.get(playerId);
    if (p) p.interacting = null;
    this.broadcast(S2C.CORE_STATE, this.coreStatePayload());
  }

  handleBuy(playerId, slot, itemId) {
    const p = this.players.get(playerId);
    if (!p || !p.alive || this.phase !== ROUND_PHASE.BUY) return;
    if (slot === 'armor') {
      const cfg = itemId === 'heavy' ? ARMOR_HEAVY : ARMOR_LIGHT;
      if (p.credits < cfg.cost) return;
      p.credits -= cfg.cost;
      p.armorType = itemId;
      p.armorValue = cfg.max;
    } else if (slot === 'primary' || slot === 'secondary') {
      const weapon = getWeapon(itemId);
      if (!weapon || weapon.class === 'melee') return;
      if (p.credits < weapon.cost) return;
      p.credits -= weapon.cost;
      p.weapons[slot] = itemId;
      p.ammo[slot] = { mag: weapon.magSize, reserve: weapon.reserveMax };
    } else {
      return;
    }
    this.room.sendTo(playerId, S2C.ECONOMY, { credits: p.credits, weapons: p.weapons, armorType: p.armorType, armorValue: p.armorValue });
  }

  handleSpectateTarget(playerId, targetId) {
    const p = this.players.get(playerId);
    if (!p || p.alive) return;
    const target = this.players.get(targetId);
    if (target && target.team === p.team && target.alive) p.spectating = targetId;
  }

  // ---- Core / kill helpers ----
  nearestSite(pos) {
    for (const site of this.map.sites) {
      const dx = pos[0] - site.center[0], dz = pos[1] - site.center[1];
      if (Math.hypot(dx, dz) <= site.radius && Math.abs(pos[1] - site.y) <= site.yTolerance) return site;
    }
    return null;
  }

  killPlayer(target, killer, cause) {
    if (!target.alive) return;
    target.alive = false;
    target.hp = 0;
    target.deaths += 1;
    target.interacting = null;
    if (killer && killer.id !== target.id) {
      killer.kills += 1;
      killer.credits = Math.min(MAX_CREDITS, killer.credits + CREDIT_KILL);
    }
    const lastDamager = target.lastDamager;
    if (lastDamager && lastDamager.id !== killer?.id && this.tick - lastDamager.tick <= ASSIST_WINDOW_TICKS) {
      const assister = this.players.get(lastDamager.id);
      if (assister) assister.assists += 1;
    }
    target.lastDamager = null;
    if (target.hasCore) {
      target.hasCore = false;
      this.core = { state: 'dropped', carrierId: null, pos: target.pos.slice(), siteId: null };
      this.broadcast(S2C.CORE_STATE, this.coreStatePayload());
    }
    const teammate = [...this.players.values()].find(q => q.team === target.team && q.alive);
    target.spectating = teammate ? teammate.id : null;
    this.broadcast(S2C.KILL, { killerId: killer ? killer.id : null, targetId: target.id, cause: cause || 'unknown' });
  }

  // ---- Per-tick simulation ----
  step() {
    this.tick++;
    if (this.phase !== ROUND_PHASE.ROUND_END && this.phase !== ROUND_PHASE.MATCH_END) {
      for (const p of this.players.values()) this.simulatePlayer(p);
      this.processReloads();
      this.processCorePickup();
      this.processInteractions();
    }
    if (this.phase === ROUND_PHASE.BUY && this.tick >= this.phaseEndsAtTick) {
      this.phase = ROUND_PHASE.COMBAT;
      this.phaseEndsAtTick = this.tick + ROUND_TIME_SEC * TICK_RATE;
      this.broadcastRoundState();
    } else if (this.phase === ROUND_PHASE.COMBAT || this.phase === ROUND_PHASE.POST_PLANT) {
      this.checkWinConditions();
    } else if (this.phase === ROUND_PHASE.ROUND_END && this.tick >= this.phaseEndsAtTick) {
      this.proceedAfterRoundEnd();
    }
    this.broadcastSnapshot();
  }

  simulatePlayer(p) {
    if (!p.alive) return;
    const input = p.pendingInput || { moveX: 0, moveZ: 0, yaw: p.yaw, pitch: p.pitch, jump: false, crouch: p.crouched };
    const result = simulateMove({ pos: p.pos, vel: p.vel, grounded: p.grounded, crouched: p.crouched }, input, TICK_MS / 1000, this.solids);
    p.pos = result.pos;
    p.vel = result.vel;
    p.grounded = result.grounded;
    p.crouched = result.crouched;
    p.yaw = input.yaw;
    p.pitch = input.pitch || 0;
    p.ads = !!input.ads;
    if (input.seq) p.lastInputSeq = input.seq;
  }

  processReloads() {
    for (const p of this.players.values()) {
      if (!p.reloading || this.tick < p.reloadEndTick) continue;
      const weapon = getWeapon(p.weapons[p.active]);
      const ammoState = p.ammo[p.active];
      if (weapon && ammoState) {
        const need = weapon.magSize - ammoState.mag;
        const take = Math.min(need, ammoState.reserve);
        ammoState.mag += take;
        ammoState.reserve -= take;
      }
      p.reloading = false;
    }
  }

  processCorePickup() {
    if (this.core.state !== 'dropped') return;
    for (const p of this.players.values()) {
      if (!p.alive || p.team !== this.attackTeam) continue;
      if (dist2(p.pos, this.core.pos) <= 2.25) {
        p.hasCore = true;
        this.core = { state: 'carried', carrierId: p.id, pos: null, siteId: null };
        this.broadcast(S2C.CORE_STATE, this.coreStatePayload());
        return;
      }
    }
  }

  processInteractions() {
    for (const p of this.players.values()) {
      if (!p.interacting) continue;
      if (!p.alive) { p.interacting = null; continue; }
      if (dist2(p.pos, p.interacting.startPos) > 0.04) { p.interacting = null; continue; }
      const elapsed = (this.tick - p.interacting.startTick) / TICK_RATE;
      if (p.interacting.type === 'plant') {
        if (elapsed >= PLANT_TIME_SEC) this.completePlant(p);
      } else if (p.interacting.type === 'defuse') {
        if (this.core.state !== 'planted') { p.interacting = null; continue; }
        if (elapsed >= DEFUSE_TIME_SEC) this.completeDefuse(p);
      }
    }
  }

  completePlant(p) {
    const siteId = p.interacting.siteId;
    p.hasCore = false;
    p.interacting = null;
    p.credits = Math.min(MAX_CREDITS, p.credits + CREDIT_PLANT);
    this.core = { state: 'planted', carrierId: null, pos: p.pos.slice(), siteId };
    this.phase = ROUND_PHASE.POST_PLANT;
    this.phaseEndsAtTick = this.tick + POST_PLANT_TIME_SEC * TICK_RATE;
    this.broadcast(S2C.CORE_STATE, this.coreStatePayload());
    this.broadcastRoundState();
  }

  completeDefuse(p) {
    p.interacting = null;
    p.credits = Math.min(MAX_CREDITS, p.credits + CREDIT_DEFUSE);
    this.core.state = 'defused';
    this.broadcast(S2C.CORE_STATE, this.coreStatePayload());
    this.endRound(this.defendTeam, 'defuse');
  }

  checkWinConditions() {
    const aliveA = [...this.players.values()].filter(p => p.team === this.attackTeam && p.alive).length;
    const aliveB = [...this.players.values()].filter(p => p.team === this.defendTeam && p.alive).length;
    if (this.phase === ROUND_PHASE.COMBAT) {
      if (aliveA === 0) return this.endRound(this.defendTeam, 'elimination');
      if (this.tick >= this.phaseEndsAtTick) return this.endRound(this.defendTeam, 'timeout');
    } else if (this.phase === ROUND_PHASE.POST_PLANT) {
      if (aliveB === 0) return this.endRound(this.attackTeam, 'elimination');
      if (this.tick >= this.phaseEndsAtTick) {
        this.core.state = 'detonated';
        this.broadcast(S2C.CORE_STATE, this.coreStatePayload());
        return this.endRound(this.attackTeam, 'detonation');
      }
    }
  }

  endRound(winningTeam, reason) {
    if (this.phase === ROUND_PHASE.ROUND_END || this.phase === ROUND_PHASE.MATCH_END) return;
    const losingTeam = winningTeam === TEAM_A ? TEAM_B : TEAM_A;
    if (winningTeam === TEAM_A) this.scoreA++; else this.scoreB++;
    if (winningTeam === TEAM_A) { this.lossStreakB++; this.lossStreakA = 0; }
    else { this.lossStreakA++; this.lossStreakB = 0; }
    const losingStreak = losingTeam === TEAM_A ? this.lossStreakA : this.lossStreakB;
    const lossBonus = CREDIT_ROUND_LOSS_BASE + Math.min(losingStreak - 1, 3) * CREDIT_LOSS_STREAK_BONUS;
    for (const p of this.players.values()) {
      if (p.team === winningTeam) p.credits = Math.min(MAX_CREDITS, p.credits + CREDIT_ROUND_WIN);
      else p.credits = Math.min(MAX_CREDITS, p.credits + lossBonus);
    }
    this.phase = ROUND_PHASE.ROUND_END;
    this.phaseEndsAtTick = this.tick + ROUND_END_TIME_SEC * TICK_RATE;
    this.broadcast(S2C.ROUND_END, { winner: winningTeam, reason, scoreA: this.scoreA, scoreB: this.scoreB, round: this.round });
    this.broadcastRoundState();
  }

  proceedAfterRoundEnd() {
    if (this.scoreA >= ROUNDS_TO_WIN) return this.endMatch(TEAM_A);
    if (this.scoreB >= ROUNDS_TO_WIN) return this.endMatch(TEAM_B);
    if (this.ot) {
      const diffA = (this.scoreA - this.otStartA) - (this.scoreB - this.otStartB);
      if (diffA >= OVERTIME_ROUNDS_TO_WIN) return this.endMatch(TEAM_A);
      if (-diffA >= OVERTIME_ROUNDS_TO_WIN) return this.endMatch(TEAM_B);
    } else if (this.scoreA === 6 && this.scoreB === 6) {
      this.ot = true;
      this.otStartA = 6;
      this.otStartB = 6;
    }
    this.round++;
    if (!this.ot && this.round === SIDE_SWAP_ROUND + 1) {
      [this.attackTeam, this.defendTeam] = [this.defendTeam, this.attackTeam];
    } else if (this.ot) {
      [this.attackTeam, this.defendTeam] = [this.defendTeam, this.attackTeam];
    }
    this.resetForRound();
    this.phase = ROUND_PHASE.BUY;
    this.phaseEndsAtTick = this.tick + BUY_TIME_SEC * TICK_RATE;
    this.broadcastRoundState();
  }

  endMatch(winningTeam) {
    this.phase = ROUND_PHASE.MATCH_END;
    this.ended = true;
    this.stop();
    this.broadcast(S2C.MATCH_END, { winner: winningTeam, scoreA: this.scoreA, scoreB: this.scoreB });
  }

  // ---- Broadcast payload builders ----
  coreStatePayload() {
    return {
      state: this.core.state,
      carrierId: this.core.carrierId,
      pos: this.core.pos,
      interactors: [...this.players.values()].filter(p => p.interacting).map(p => ({
        id: p.id, type: p.interacting.type, progress: Math.min(1, (this.tick - p.interacting.startTick) / TICK_RATE / (p.interacting.type === 'plant' ? PLANT_TIME_SEC : DEFUSE_TIME_SEC)),
      })),
    };
  }

  roundStatePayload() {
    const secLeft = Math.max(0, Math.ceil((this.phaseEndsAtTick - this.tick) / TICK_RATE));
    return {
      phase: this.phase, round: this.round, scoreA: this.scoreA, scoreB: this.scoreB,
      attackTeam: this.attackTeam, defendTeam: this.defendTeam, secLeft, ot: this.ot,
    };
  }

  broadcastRoundState() {
    this.broadcast(S2C.ROUND_STATE, this.roundStatePayload());
  }

  buildSnapshot() {
    return {
      tick: this.tick,
      round: this.roundStatePayload(),
      core: this.coreStatePayload(),
      players: [...this.players.values()].map(p => ({
        id: p.id, name: p.name, team: p.team, pos: p.pos, vel: p.vel, grounded: p.grounded,
        yaw: p.yaw, pitch: p.pitch,
        hp: p.hp, armorType: p.armorType, armorValue: p.armorValue, alive: p.alive,
        crouched: p.crouched, active: p.active, weapons: p.weapons,
        ammo: p.ammo[p.active] || null, reloading: p.reloading, hasCore: p.hasCore,
        kills: p.kills, deaths: p.deaths, assists: p.assists, credits: p.credits,
        spectating: p.spectating,
      })),
    };
  }

  broadcastSnapshot() {
    const base = this.buildSnapshot();
    for (const p of this.players.values()) {
      if (!p.connected) continue;
      this.room.sendTo(p.id, S2C.SNAPSHOT, { ...base, you: { seq: p.lastInputSeq } });
    }
  }
}
