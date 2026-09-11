import * as THREE from 'three';
import { PLAYER_RADIUS, PLAYER_HEIGHT, PLAYER_CROUCH_HEIGHT } from '@crl/shared';

const TEAM_COLOR = { A: 0xff9d42, B: 0x3ecfd6 };

function buildAvatar(team) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: TEAM_COLOR[team] || 0xcccccc, roughness: 0.6, metalness: 0.1 });
  const bodyHeight = PLAYER_HEIGHT - PLAYER_RADIUS * 2;
  const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(PLAYER_RADIUS, Math.max(0.1, bodyHeight), 4, 8), mat);
  capsule.castShadow = true;
  capsule.position.y = PLAYER_HEIGHT / 2;
  group.add(capsule);
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.5), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
  gun.position.set(PLAYER_RADIUS * 0.6, PLAYER_HEIGHT * 0.6, 0.35);
  group.add(gun);
  group.userData.capsule = capsule;
  group.userData.gun = gun;
  return group;
}

export class RemotePlayers {
  constructor(scene) {
    this.scene = scene;
    this.avatars = new Map(); // id -> { group, target: {pos,yaw,crouched}, team }
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
        entry.group.userData.capsule.material.color.setHex(TEAM_COLOR[p.team] || 0xcccccc);
        entry.team = p.team;
      }
      entry.target = { pos: p.pos, yaw: p.yaw, crouched: p.crouched, alive: p.alive };
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
      const height = entry.target.crouched ? PLAYER_CROUCH_HEIGHT : PLAYER_HEIGHT;
      entry.group.userData.capsule.scale.y = height / PLAYER_HEIGHT;
      entry.group.userData.capsule.position.y = height / 2;
    }
  }
}
