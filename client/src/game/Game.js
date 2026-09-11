import * as THREE from 'three';
import { createScene } from './Scene.js';
import { buildMapMeshes, addLighting } from './MapBuilder.js';
import { Controller } from './Controller.js';
import { RemotePlayers } from './RemotePlayers.js';
import { WeaponsView, FireGate } from './Weapons.js';
import { Effects } from './Effects.js';
import { Minimap } from './Minimap.js';
import { audio } from './AudioFX.js';
import { net } from '../net.js';
import { HUD } from '../ui/HUD.js';
import { BuyMenu } from '../ui/BuyMenu.js';
import { Scoreboard } from '../ui/Scoreboard.js';
import { PauseMenu } from '../ui/PauseMenu.js';
import {
  C2S, S2C, ROUND_PHASE, MAPS_BY_ID, getWeapon, rayGeometry, rayPlayer,
  PLAYER_HEIGHT, PLAYER_CROUCH_HEIGHT, TEAM_A, TICK_RATE,
} from '@crl/shared';

const BASE_FOV = 90;

export class Game {
  constructor(root) {
    const { renderer, scene, camera, canvas, composer } = createScene();
    this.renderer = renderer;
    this.composer = composer;
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;

    this.hud = new HUD(root);
    this.buyMenu = new BuyMenu(root);
    this.scoreboard = new Scoreboard(root);
    this.pauseMenu = new PauseMenu(root, {
      onResume: () => { this.pauseMenu.hide(); this.controller.lock(); },
      onLeave: () => this.leaveMatch(),
      onSensitivity: (v) => { this.controller.sensitivity = v; localStorage.setItem('crl.sens', v); },
      getSensitivity: () => parseFloat(localStorage.getItem('crl.sens') || '1'),
    });

    this.effects = new Effects(this.scene);
    this.mapData = null;
    this.mapGroup = null;
    this.solids = [];
    this.selfId = null;
    this.playerNames = new Map();
    this.players = new Map();
    this.latestCore = { state: 'none' };
    this.latestRound = null;
    this.fireGate = new FireGate();
    this.controller = new Controller(canvas, () => this.solids);
    this.weaponsView = new WeaponsView(this.camera);
    this.remotePlayers = null;
    this.minimap = null;
    this.root = root;
    this.running = false;
    this.lastFrame = 0;
    this.adsAmount = 0;

    this.controller.sensitivity = parseFloat(localStorage.getItem('crl.sens') || '1');
    this.controller.onReload = () => net.send(C2S.RELOAD);
    this.controller.onSwitchWeapon = (slot) => net.send(C2S.SWITCH_WEAPON, { slot });
    this.controller.onInteractStart = () => this.tryInteract();
    this.controller.onInteractStop = () => net.send(C2S.INTERACT_STOP);
    this.controller.onToggleScoreboard = (show) => { show ? this.scoreboard.show() : this.scoreboard.hide(); };
    this.controller.onToggleMenu = () => {
      if (this.buyMenu.open) { this.buyMenu.hide(); this.controller.lock(); return; }
      this.pauseMenu.toggle();
      if (this.pauseMenu.open) this.controller.unlock(); else this.controller.lock();
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyB' && this.latestRound?.phase === ROUND_PHASE.BUY) {
        this.buyMenu.toggle();
        if (this.buyMenu.open) this.controller.unlock(); else this.controller.lock();
      }
      const me = this.players.get(this.selfId);
      if (me && !me.alive && (e.code === 'KeyE' || e.code === 'KeyQ')) {
        this.cycleSpectate(e.code === 'KeyE' ? 1 : -1);
      }
      if (e.code === 'KeyM' && !e.repeat) this.minimap?.showFull(true);
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyM') this.minimap?.showFull(false);
    });

    net.on(S2C.SNAPSHOT, (msg) => this.onSnapshot(msg));
    net.on(S2C.ROUND_STATE, (msg) => this.onRoundState(msg));
    net.on(S2C.ROUND_END, (msg) => this.onRoundEnd(msg));
    net.on(S2C.MATCH_END, (msg) => this.onMatchEnd(msg));
    net.on(S2C.DAMAGE, (msg) => this.onDamage(msg));
    net.on(S2C.KILL, (msg) => this.onKill(msg));
    net.on(S2C.SOUND, (msg) => this.onSound(msg));
    net.on(S2C.CORE_STATE, (msg) => this.onCoreState(msg));
    net.on(S2C.ECONOMY, (msg) => this.onEconomy(msg));
  }

  start(matchStart) {
    this.selfId = matchStart.selfId;
    this.mapData = MAPS_BY_ID[matchStart.mapId];
    this.solids = this.mapData.geometry.filter((o) => o.solid);
    if (this.mapGroup) this.scene.remove(this.mapGroup);
    this.mapGroup = buildMapMeshes(this.mapData);
    this.scene.add(this.mapGroup);
    addLighting(this.scene, this.mapData.id);
    this.remotePlayers = new RemotePlayers(this.scene);
    if (this.minimap) this.minimap.el.remove();
    this.minimap = new Minimap(this.root, this.mapData);
    this.playerNames = new Map(matchStart.players.map((p) => [p.id, p.name]));

    const me = matchStart.players.find((p) => p.id === this.selfId);
    const role = me?.team === TEAM_A ? 'A' : 'B';
    const spawn = this.mapData.spawns[role][0];
    this.controller.spawn(spawn.pos, spawn.yaw);
    this.controller.enabled = true;

    this.hud.show();
    this.buyMenu.hide();
    this.scoreboard.hide();
    this.pauseMenu.hide();
    this.hud.hideMatchBanner();
    this.controller.lock();

    if (!this.running) {
      this.running = true;
      this.lastFrame = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    }
  }

  leaveMatch() {
    net.send(C2S.LEAVE);
    location.reload();
  }

  // ---- Network event handlers ----
  onSnapshot(msg) {
    this.selfId = msg.selfId;
    this.latestCore = msg.core;
    this.players = new Map(msg.players.map((p) => [p.id, p]));
    const me = this.players.get(this.selfId);
    if (me) {
      this.controller.reconcile(me.pos, me.vel, me.grounded, me.crouched, msg.you.seq);
      this.hud.setDead(!me.alive, me.spectating ? this.playerNames.get(me.spectating) : null);
      if (me.alive) {
        this.hud.setPlayer(me);
        this.buyMenu.setCredits(me.credits);
        this.buyMenu.setOwned(me.weapons, me.armorType);
        this.weaponsView.setWeapon(me.weapons[me.active]);
        this.updateInteractPrompt(me);
      } else {
        this.hud.hideInteract();
      }
    }
    this.remotePlayers?.sync(msg.players, this.selfId);
    this.minimap?.update(msg.players, this.selfId, this.latestCore);
    this.hud.setCoreState(this.latestCore);
    // snapshots carry round info every tick, giving a smooth live countdown
    // (the round_state broadcast only fires on phase transitions)
    if (msg.round) this.hud.setRoundState(msg.round);
    if (this.scoreboard && !this.scoreboard.root.classList.contains('hidden')) {
      this.scoreboard.update(msg.players.map((p) => ({ ...p, name: this.playerNames.get(p.id) || p.name })));
    }
  }

  onRoundState(msg) {
    const leavingBuy = msg.phase !== ROUND_PHASE.BUY && this.latestRound?.phase === ROUND_PHASE.BUY;
    this.latestRound = msg;
    this.hud.setRoundState(msg);
    if (leavingBuy && this.buyMenu.open) { this.buyMenu.hide(); this.controller.lock(); }
  }

  onRoundEnd(msg) {
    const winnerLabel = msg.winner === TEAM_A ? 'ATTACKERS' : 'DEFENDERS';
    const reasonLabel = { elimination: 'Elimination', timeout: 'Time Expired', defuse: 'Core Defused', detonation: 'Core Detonated' }[msg.reason] || msg.reason;
    this.hud.showRoundBanner(`${winnerLabel} WIN — ${reasonLabel}`, msg.winner === TEAM_A ? 'win-a' : 'win-b');
    const me = this.players.get(this.selfId);
    if (me) (me.team === msg.winner ? audio.roundWin() : audio.roundLose());
  }

  onMatchEnd(msg) {
    const winnerLabel = msg.winner === TEAM_A ? 'ATTACKERS' : 'DEFENDERS';
    this.hud.showMatchBanner(`${winnerLabel} WIN THE MATCH  ${msg.scoreA} – ${msg.scoreB}`);
    this.controller.unlock();
    setTimeout(() => this.leaveMatch(), 6000);
  }

  onDamage(msg) {
    if (msg.targetId === this.selfId) this.hud.flashDamage();
    if (msg.shooterId === this.selfId) { this.hud.flashHit(false); audio.hitmarker(); }
  }

  onKill(msg) {
    const killer = this.playerNames.get(msg.killerId) || 'World';
    const target = this.playerNames.get(msg.targetId) || '?';
    const meKiller = msg.killerId === this.selfId;
    const meTarget = msg.targetId === this.selfId;
    if (meKiller) { this.hud.flashHit(true); audio.hitmarker(); }
    this.hud.addKillFeed(`${killer}  ⚔  ${target}`, meKiller ? 'me-kill' : meTarget ? 'me-death' : '');
    if (meTarget) { this.controller.unlock(); audio.death(); }
  }

  onSound(msg) {
    if (msg.type !== 'gunshot' || msg.shooterId === this.selfId) return;
    const me = this.players.get(this.selfId);
    if (me) {
      const d = Math.hypot(me.pos[0] - msg.pos[0], me.pos[1] - msg.pos[1], me.pos[2] - msg.pos[2]);
      if (d > 65) return;
    }
    const weapon = getWeapon(msg.weapon);
    audio.gunshot(weapon?.class);
  }

  onCoreState(msg) {
    const prevState = this.latestCore?.state;
    this.latestCore = msg;
    this.hud.setCoreState(msg);
    if (msg.state === 'planted' && prevState !== 'planted') audio.planted();
    if (msg.state === 'defused' && prevState !== 'defused') audio.defused();
  }

  onEconomy(msg) {
    this.buyMenu.setCredits(msg.credits);
    this.buyMenu.setOwned(msg.weapons, msg.armorType);
  }

  // ---- Objective interaction ----
  nearestSite(pos) {
    for (const site of this.mapData.sites) {
      const dx = pos[0] - site.center[0], dz = pos[2] - site.center[1];
      if (Math.hypot(dx, dz) <= site.radius && Math.abs(pos[1] - site.y) <= site.yTolerance) return site;
    }
    return null;
  }

  nearPoint(pos, target, r) {
    if (!target) return false;
    const dx = pos[0] - target[0], dy = pos[1] - target[1], dz = pos[2] - target[2];
    return dx * dx + dy * dy + dz * dz <= r * r;
  }

  updateInteractPrompt(me) {
    if (!this.latestRound) { this.hud.hideInteract(); return; }
    const interactor = this.latestCore.interactors?.find((i) => i.id === me.id);
    if (interactor) {
      this.hud.showInteract(interactor.type === 'plant' ? 'Planting Core...' : 'Defusing Core...', interactor.progress);
      return;
    }
    const canPlant = me.team === this.latestRound.attackTeam && me.hasCore
      && this.latestRound.phase === ROUND_PHASE.COMBAT && this.nearestSite(me.pos);
    const canDefuse = me.team === this.latestRound.defendTeam
      && this.latestCore.state === 'planted' && this.nearPoint(me.pos, this.latestCore.pos, 4);
    if (canPlant) this.hud.showInteract('Hold F to Plant Core', 0);
    else if (canDefuse) this.hud.showInteract('Hold F to Defuse Core', 0);
    else this.hud.hideInteract();
  }

  tryInteract() {
    const me = this.players.get(this.selfId);
    if (!me || !this.latestRound || !me.alive) return;
    if (me.team === this.latestRound.attackTeam && me.hasCore && this.nearestSite(me.pos)) {
      net.send(C2S.INTERACT_START, { type: 'plant' });
    } else if (me.team === this.latestRound.defendTeam && this.latestCore.state === 'planted' && this.nearPoint(me.pos, this.latestCore.pos, 4)) {
      net.send(C2S.INTERACT_START, { type: 'defuse' });
    }
  }

  // ---- Spectator ----
  cycleSpectate(dir) {
    const me = this.players.get(this.selfId);
    if (!me) return;
    const teammates = [...this.players.values()].filter((p) => p.team === me.team && p.alive && p.id !== me.id);
    if (teammates.length === 0) return;
    const curIdx = teammates.findIndex((p) => p.id === me.spectating);
    const next = teammates[(((curIdx < 0 ? 0 : curIdx) + dir) % teammates.length + teammates.length) % teammates.length];
    net.send(C2S.SPECTATE_TARGET, { targetId: next.id });
  }

  updateSpectatorCamera(me) {
    const target = me.spectating && this.players.get(me.spectating);
    if (!target) return;
    const eyeY = target.crouched ? 0.95 : 1.62;
    this.camera.position.set(target.pos[0], target.pos[1] + eyeY, target.pos[2]);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.set(target.pitch, target.yaw, 0);
  }

  // ---- Firing ----
  tryFire(me) {
    if (!me || !me.alive) return;
    if (this.latestRound?.phase !== ROUND_PHASE.COMBAT && this.latestRound?.phase !== ROUND_PHASE.POST_PLANT) {
      this.controller.consumeFireEdge();
      return;
    }
    const weaponId = me.weapons[me.active];
    const weapon = weaponId && getWeapon(weaponId);
    if (!weapon) return;
    const isAuto = weapon.fireMode === 'auto';
    const wantsFire = isAuto ? this.controller.firingHeld : this.controller.consumeFireEdge();
    if (!wantsFire) return;
    if (me.reloading) return;
    if (weapon.class !== 'melee' && (!me.ammo || me.ammo.mag <= 0)) return;
    const now = performance.now();
    if (!this.fireGate.canFire(weapon, now)) return;
    this.fireGate.markFired(now);

    net.send(C2S.FIRE);
    this.weaponsView.playFire();
    if (weapon.class === 'melee') audio.meleeSwing(); else audio.gunshot(weapon.class);
    this.localTracer(weapon);

    const vertKick = (weapon.recoil?.vertical || 0) * 0.0045;
    const horizKick = (weapon.recoil?.horizontal || 0) * 0.0025;
    this.controller.pitch = Math.max(-Math.PI / 2 + 0.02, this.controller.pitch - vertKick);
    this.controller.yaw += (Math.random() * 2 - 1) * horizKick;
  }

  localTracer(weapon) {
    const origin = this.camera.getWorldPosition(new THREE.Vector3()).toArray();
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion).toArray();
    const maxRange = weapon.range || 50;
    const geomHit = rayGeometry(origin, dir, this.solids, maxRange);
    let nearestT = geomHit ? geomHit.t : maxRange;
    let hitPlayer = false;
    for (const [id, p] of this.players) {
      if (id === this.selfId || !p.alive) continue;
      const height = p.crouched ? PLAYER_CROUCH_HEIGHT : PLAYER_HEIGHT;
      const res = rayPlayer(origin, dir, p.pos, height, nearestT);
      if (res && res.t < nearestT) { nearestT = res.t; hitPlayer = true; }
    }
    const hitPoint = [origin[0] + dir[0] * nearestT, origin[1] + dir[1] * nearestT, origin[2] + dir[2] * nearestT];
    const muzzle = this.weaponsView.mesh
      ? this.weaponsView.mesh.getWorldPosition(new THREE.Vector3()).toArray()
      : origin;
    this.effects.spawnTracer(muzzle, hitPoint);
    if (hitPlayer) this.effects.spawnBloodImpact(hitPoint); else this.effects.spawnImpact(hitPoint);
  }

  // ---- Main loop ----
  loop(t) {
    if (!this.running) return;
    const dt = Math.min(0.05, (t - this.lastFrame) / 1000);
    this.lastFrame = t;

    this.controller.update(dt);
    const me = this.players.get(this.selfId);
    const dead = me && !me.alive;
    const uiBlocking = this.pauseMenu.open || this.buyMenu.open || !this.controller.enabled || dead;
    if (!uiBlocking) this.tryFire(me);

    if (dead) {
      this.updateSpectatorCamera(me);
      this.weaponsView.rig.visible = false;
    } else {
      this.weaponsView.rig.visible = true;
      const alpha = Math.min(1, this.controller.accumulator / (1 / TICK_RATE));
      this.controller.applyToCamera(this.camera, alpha);
    }

    const targetAds = !uiBlocking && this.controller.adsHeld ? 1 : 0;
    this.adsAmount += (targetAds - this.adsAmount) * Math.min(1, dt * 12);
    this.camera.fov = BASE_FOV - this.adsAmount * (BASE_FOV * 0.35);
    this.camera.updateProjectionMatrix();

    const vel = this.controller.moveState?.vel;
    const moving = vel ? Math.hypot(vel[0], vel[2]) > 0.5 : false;
    this.weaponsView.update(dt, moving);
    this.remotePlayers?.update(dt);
    this.effects.update(dt);

    this.composer.render();
    requestAnimationFrame((t2) => this.loop(t2));
  }
}
