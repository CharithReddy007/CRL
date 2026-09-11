import {
  simulateMove, initialMoveState, TICK_RATE,
  PLAYER_EYE_HEIGHT, PLAYER_CROUCH_EYE_HEIGHT, C2S,
} from '@crl/shared';
import { net } from '../net.js';

const TICK_SEC = 1 / TICK_RATE;
const MOUSE_SENS = 0.0022;
const PITCH_LIMIT = Math.PI / 2 - 0.02;

export class Controller {
  constructor(canvas, getSolids) {
    this.canvas = canvas;
    this.getSolids = getSolids;
    this.keys = new Set();
    this.yaw = 0;
    this.pitch = 0;
    this.moveState = null;
    this.prevMoveState = null;
    this.accumulator = 0;
    this.seq = 0;
    this.inputHistory = [];
    this.locked = false;
    this.enabled = false;
    this.sensitivity = 1;
    this.jumpQueued = false;
    this.onInteractStart = null;
    this.onInteractStop = null;
    this.onReload = null;
    this.onSwitchWeapon = null;
    this.onToggleScoreboard = null;
    this.onToggleMenu = null;
    this.firingHeld = false;
    this.fireEdge = false;
    this.interactHeld = false;
    this.adsHeld = false;

    canvas.addEventListener('mousedown', (e) => {
      if (!this.locked) { canvas.requestPointerLock(); return; }
      if (e.button === 0) { this.firingHeld = true; this.fireEdge = true; }
      if (e.button === 2) this.adsHeld = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.firingHeld = false;
      if (e.button === 2) this.adsHeld = false;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === canvas; });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.yaw -= e.movementX * MOUSE_SENS * this.sensitivity;
      this.pitch -= e.movementY * MOUSE_SENS * this.sensitivity;
      this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
    });
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'Space') this.jumpQueued = true;
      if (e.code === 'KeyR' && this.onReload) this.onReload();
      if (e.code === 'Digit1' && this.onSwitchWeapon) this.onSwitchWeapon('primary');
      if (e.code === 'Digit2' && this.onSwitchWeapon) this.onSwitchWeapon('secondary');
      if (e.code === 'Digit3' && this.onSwitchWeapon) this.onSwitchWeapon('melee');
      if (e.code === 'KeyF') { this.interactHeld = true; if (this.onInteractStart) this.onInteractStart(); }
      if (e.code === 'Tab') { e.preventDefault(); if (this.onToggleScoreboard) this.onToggleScoreboard(true); }
      if (e.code === 'Escape' && this.onToggleMenu) this.onToggleMenu();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'KeyF') { this.interactHeld = false; if (this.onInteractStop) this.onInteractStop(); }
      if (e.code === 'Tab' && this.onToggleScoreboard) this.onToggleScoreboard(false);
    });
  }

  lock() { if (!this.locked) this.canvas.requestPointerLock(); }
  unlock() { if (this.locked) document.exitPointerLock(); }

  spawn(pos, yaw) {
    this.moveState = initialMoveState(pos);
    this.prevMoveState = this.moveState;
    this.yaw = yaw || 0;
    this.pitch = 0;
    this.accumulator = 0;
    this.inputHistory = [];
  }

  currentInput() {
    const forward = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0);
    const strafe = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0);
    const crouch = this.keys.has('KeyC') || this.keys.has('ControlLeft') || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const jump = this.jumpQueued;
    this.jumpQueued = false;
    return { moveX: strafe, moveZ: forward, yaw: this.yaw, pitch: this.pitch, jump, crouch, ads: this.adsHeld };
  }

  update(dtSec) {
    if (!this.moveState) return;
    this.accumulator += dtSec;
    let stepped = false;
    while (this.accumulator >= TICK_SEC) {
      this.accumulator -= TICK_SEC;
      this.prevMoveState = this.moveState;
      const input = this.currentInput();
      this.seq += 1;
      input.seq = this.seq;
      this.moveState = simulateMove(this.moveState, input, TICK_SEC, this.getSolids());
      this.inputHistory.push({ seq: this.seq, input });
      if (this.inputHistory.length > 240) this.inputHistory.shift();
      if (this.enabled) net.send(C2S.INPUT, { input });
      stepped = true;
    }
    return stepped;
  }

  consumeFireEdge() {
    const v = this.fireEdge;
    this.fireEdge = false;
    return v;
  }

  reconcile(serverPos, serverVel, serverGrounded, serverCrouched, ackedSeq) {
    this.inputHistory = this.inputHistory.filter((h) => h.seq > ackedSeq);
    let state = { pos: serverPos.slice(), vel: serverVel.slice(), grounded: serverGrounded, crouched: serverCrouched };
    for (const h of this.inputHistory) state = simulateMove(state, h.input, TICK_SEC, this.getSolids());
    this.moveState = state;
    this.prevMoveState = state;
  }

  renderPosition(alpha) {
    if (!this.prevMoveState || !this.moveState) return this.moveState ? this.moveState.pos : [0, 0, 0];
    const a = this.prevMoveState.pos, b = this.moveState.pos;
    return [a[0] + (b[0] - a[0]) * alpha, a[1] + (b[1] - a[1]) * alpha, a[2] + (b[2] - a[2]) * alpha];
  }

  eyeHeight() {
    return this.moveState?.crouched ? PLAYER_CROUCH_EYE_HEIGHT : PLAYER_EYE_HEIGHT;
  }

  applyToCamera(camera, alpha) {
    if (!this.moveState) return;
    const pos = this.renderPosition(alpha);
    camera.position.set(pos[0], pos[1] + this.eyeHeight(), pos[2]);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = this.yaw;
    camera.rotation.x = this.pitch;
    camera.rotation.z = 0;
  }
}
