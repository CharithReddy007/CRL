// Renders active grenades from the snapshot's `grenades` list: a small
// spinning sphere while in flight, and a soft expanding translucent cloud
// once a smoke grenade settles and pops. Explosions are one-shot events
// handled separately via the SOUND broadcast (see Game.js#onSound).
import * as THREE from 'three';
import { GRENADES, GRENADE_CLASSES } from '@crl/shared';

const FLYING_COLOR = { [GRENADE_CLASSES.FRAG]: 0x3a3f2e, [GRENADE_CLASSES.SMOKE]: 0x8a8f94 };

export class GrenadeView {
  constructor(scene) {
    this.scene = scene;
    this.entries = new Map(); // id -> { group, kind }
    this.flyingGeo = new THREE.SphereGeometry(0.09, 10, 10);
  }

  buildFlying(type) {
    const cfg = GRENADES[type];
    const mat = new THREE.MeshStandardMaterial({ color: FLYING_COLOR[cfg?.class] ?? 0x555555, roughness: 0.5, metalness: 0.3 });
    return new THREE.Mesh(this.flyingGeo, mat);
  }

  buildSmoke() {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xd8dbe0, transparent: true, opacity: 0.5, depthWrite: false });
    for (let i = 0; i < 6; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(1.6 + Math.random() * 0.8, 12, 12), mat);
      puff.position.set((Math.random() - 0.5) * 2.5, Math.random() * 1.5, (Math.random() - 0.5) * 2.5);
      group.add(puff);
    }
    group.userData.growT = 0;
    return group;
  }

  update(grenadeList, dt) {
    const seen = new Set();
    for (const g of grenadeList) {
      seen.add(g.id);
      let entry = this.entries.get(g.id);
      if (!entry || entry.kind !== g.state) {
        if (entry) this.scene.remove(entry.group);
        const group = g.state === 'smoke' ? this.buildSmoke() : this.buildFlying(g.type);
        this.scene.add(group);
        entry = { group, kind: g.state };
        this.entries.set(g.id, entry);
      }
      if (g.state === 'smoke') {
        entry.group.userData.growT = Math.min(1, entry.group.userData.growT + dt * 0.8);
        const s = 0.3 + entry.group.userData.growT * 0.7;
        entry.group.position.set(g.pos[0], g.pos[1] + 0.3, g.pos[2]);
        entry.group.scale.setScalar(s);
      } else {
        entry.group.position.set(g.pos[0], g.pos[1], g.pos[2]);
        entry.group.rotation.x += dt * 6;
        entry.group.rotation.y += dt * 4;
      }
    }
    for (const [id, entry] of this.entries) {
      if (!seen.has(id)) {
        this.scene.remove(entry.group);
        this.entries.delete(id);
      }
    }
  }
}
