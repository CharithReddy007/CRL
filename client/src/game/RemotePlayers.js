import * as THREE from 'three';
import { PLAYER_RADIUS, PLAYER_HEIGHT, PLAYER_CROUCH_HEIGHT } from '@crl/shared';

const TEAM_COLOR = { A: 0xff9d42, B: 0x3ecfd6 };
const HIP_Y = PLAYER_HEIGHT * 0.46;
const TORSO_H = PLAYER_HEIGHT * 0.32;
const HEAD_R = PLAYER_HEIGHT * 0.095;
const LEG_LEN = HIP_Y;
const ARM_LEN = TORSO_H * 0.95;
const MAX_SWING = 0.7; // radians

function limb(mat, w, h, d, pivotY, x) {
  const pivot = new THREE.Group();
  pivot.position.set(x, pivotY, 0);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.y = -h / 2;
  mesh.castShadow = true;
  pivot.add(mesh);
  return pivot;
}

function buildAvatar(team) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: TEAM_COLOR[team] || 0xcccccc, roughness: 0.6, metalness: 0.1 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, TORSO_H, 0.24), mat);
  torso.position.y = HIP_Y + TORSO_H / 2;
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 12, 8), mat);
  head.position.y = HIP_Y + TORSO_H + HEAD_R * 0.85;
  head.castShadow = true;
  group.add(head);

  const legL = limb(mat, 0.15, LEG_LEN, 0.15, HIP_Y, -0.12);
  const legR = limb(mat, 0.15, LEG_LEN, 0.15, HIP_Y, 0.12);
  const shoulderY = HIP_Y + TORSO_H - 0.04;
  const armL = limb(mat, 0.12, ARM_LEN, 0.12, shoulderY, -0.28);
  const armR = limb(mat, 0.12, ARM_LEN, 0.12, shoulderY, 0.28);
  group.add(legL, legR, armL, armR);

  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.46), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
  gun.position.set(0.22, shoulderY - 0.18, -0.32);
  group.add(gun);

  group.userData = { torso, head, legL, legR, armL, armR, mat, phase: 0 };
  return group;
}

export class RemotePlayers {
  constructor(scene) {
    this.scene = scene;
    this.avatars = new Map(); // id -> { group, target, team, phase }
  }

  sync(players, localId) {
    const seen = new Set();
    for (const p of players) {
      if (p.id === localId) continue;
      seen.add(p.id);
      let entry = this.avatars.get(p.id);
      if (!entry) {
        const group = buildAvatar(p.team);
        this.scene.add(group);
        entry = { group, team: p.team };
        this.avatars.set(p.id, entry);
      }
      if (entry.team !== p.team) {
        entry.group.userData.mat.color.setHex(TEAM_COLOR[p.team] || 0xcccccc);
        entry.team = p.team;
      }
      entry.target = { pos: p.pos, vel: p.vel, yaw: p.yaw, crouched: p.crouched, alive: p.alive };
    }
    for (const [id, entry] of this.avatars) {
      if (!seen.has(id)) { this.scene.remove(entry.group); this.avatars.delete(id); }
    }
  }

  update(dt) {
    const smoothing = Math.min(1, dt * 18);
    for (const entry of this.avatars.values()) {
      if (!entry.target) continue;
      entry.group.visible = entry.target.alive;
      if (!entry.target.alive) continue;
      const [tx, ty, tz] = entry.target.pos;
      entry.group.position.x += (tx - entry.group.position.x) * smoothing;
      entry.group.position.y += (ty - entry.group.position.y) * smoothing;
      entry.group.position.z += (tz - entry.group.position.z) * smoothing;
      let dyaw = entry.target.yaw - entry.group.rotation.y;
      dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
      entry.group.rotation.y += dyaw * smoothing;

      const crouched = entry.target.crouched;
      const heightScale = (crouched ? PLAYER_CROUCH_HEIGHT : PLAYER_HEIGHT) / PLAYER_HEIGHT;
      entry.group.scale.y += (heightScale - entry.group.scale.y) * smoothing;

      const speed = Math.hypot(entry.target.vel?.[0] || 0, entry.target.vel?.[2] || 0);
      const ud = entry.group.userData;
      const moving = speed > 0.5;
      if (moving) ud.phase = (ud.phase || 0) + dt * speed * 1.8;
      const swing = moving ? Math.sin(ud.phase) * MAX_SWING * Math.min(1, speed / 5.4) : 0;
      const legSwing = moving ? swing : 0;
      const armSwing = moving ? -swing * 0.8 : 0;
      ud.legL.rotation.x += (legSwing - ud.legL.rotation.x) * smoothing;
      ud.legR.rotation.x += (-legSwing - ud.legR.rotation.x) * smoothing;
      ud.armL.rotation.x += (-armSwing - ud.armL.rotation.x) * smoothing;
      ud.armR.rotation.x += (armSwing * 0.3 - ud.armR.rotation.x) * smoothing; // gun arm stays mostly raised
    }
  }
}
