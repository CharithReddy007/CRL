import * as THREE from 'three';
import { getWeapon, WEAPON_CLASSES, GRENADES, GRENADE_CLASSES } from '@crl/shared';

const CLASS_PROPORTIONS = {
  [WEAPON_CLASSES.PISTOL]: { body: [0.1, 0.16, 0.32], barrel: [0.05, 0.05, 0.16], scale: 0.85 },
  [WEAPON_CLASSES.SMG]: { body: [0.1, 0.16, 0.42], barrel: [0.05, 0.05, 0.2], scale: 0.95 },
  [WEAPON_CLASSES.RIFLE]: { body: [0.1, 0.17, 0.62], barrel: [0.045, 0.045, 0.3], scale: 1 },
  [WEAPON_CLASSES.SHOTGUN]: { body: [0.12, 0.18, 0.55], barrel: [0.07, 0.07, 0.28], scale: 1 },
  [WEAPON_CLASSES.SNIPER]: { body: [0.1, 0.16, 0.78], barrel: [0.045, 0.045, 0.4], scale: 1.05 },
  [WEAPON_CLASSES.HEAVY]: { body: [0.13, 0.2, 0.7], barrel: [0.06, 0.06, 0.34], scale: 1.05 },
  [WEAPON_CLASSES.MELEE]: { body: [0.05, 0.05, 0.32], barrel: null, scale: 0.8 },
};

function buildGrenadeViewmodel(grenade) {
  const group = new THREE.Group();
  const color = grenade.class === GRENADE_CLASSES.SMOKE ? 0x8a8f94 : 0x3a3f2e;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.3 }));
  group.add(body);
  const pin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), new THREE.MeshStandardMaterial({ color: 0xc9c2b0, metalness: 0.6, roughness: 0.3 }));
  pin.position.set(0.06, 0.06, 0);
  group.add(pin);
  group.scale.setScalar(0.85);
  group.userData.muzzleZ = -0.1;
  return group;
}

function buildViewmodel(weaponId) {
  if (GRENADES[weaponId]) return buildGrenadeViewmodel(GRENADES[weaponId]);
  const weapon = getWeapon(weaponId);
  const props = CLASS_PROPORTIONS[weapon?.class] || CLASS_PROPORTIONS[WEAPON_CLASSES.RIFLE];
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x24262b, roughness: 0.4, metalness: 0.6 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.7, metalness: 0.2 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(...props.body), metal);
  group.add(body);
  if (props.barrel) {
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(...props.barrel), metal);
    barrel.position.z = -(props.body[2] / 2 + props.barrel[2] / 2);
    group.add(barrel);
  }
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.09), grip);
  handle.position.set(0, -props.body[1] * 0.9, props.body[2] * 0.25);
  group.add(handle);
  if (weapon?.class === WEAPON_CLASSES.SNIPER) {
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 10), metal);
    scope.rotation.z = Math.PI / 2;
    scope.position.set(0, props.body[1] / 2 + 0.04, -0.05);
    group.add(scope);
  }
  if (weapon?.class === WEAPON_CLASSES.MELEE) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.34), new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.15 }));
    blade.position.z = -0.3;
    group.add(blade);
  }
  group.scale.setScalar(props.scale);
  group.userData.muzzleZ = -(props.body[2] / 2 + (props.barrel ? props.barrel[2] : 0));
  return group;
}

export class WeaponsView {
  constructor(camera) {
    this.camera = camera;
    this.rig = new THREE.Group();
    this.rig.position.set(0.28, -0.24, -0.5);
    camera.add(this.rig);
    this.currentId = null;
    this.mesh = null;
    this.kick = 0;
    this.bobPhase = 0;
    this.muzzle = new THREE.PointLight(0xffcf80, 0, 4);
    this.rig.add(this.muzzle);
    this.muzzleFlash = null;
  }

  setWeapon(weaponId) {
    if (weaponId === this.currentId) return;
    this.currentId = weaponId;
    if (this.mesh) this.rig.remove(this.mesh);
    this.mesh = buildViewmodel(weaponId);
    this.rig.add(this.mesh);
  }

  playFire() {
    this.kick = 1;
    this.muzzle.intensity = 6;
    setTimeout(() => { this.muzzle.intensity = 0; }, 40);
  }

  update(dt, moving) {
    this.kick = Math.max(0, this.kick - dt * 10);
    if (this.mesh) {
      this.mesh.position.z = this.kick * 0.12;
      this.mesh.rotation.x = -this.kick * 0.25;
    }
    this.bobPhase += dt * (moving ? 9 : 2.2);
    const bobAmt = moving ? 0.012 : 0.004;
    this.rig.position.x = 0.28 + Math.sin(this.bobPhase) * bobAmt;
    this.rig.position.y = -0.24 + Math.abs(Math.cos(this.bobPhase)) * bobAmt * 0.7;
  }
}

export class FireGate {
  constructor() {
    this.lastFireAt = -Infinity;
  }

  canFire(weapon, nowMs) {
    const interval = (60000 / weapon.fireRateRpm);
    return nowMs - this.lastFireAt >= interval;
  }

  markFired(nowMs) {
    this.lastFireAt = nowMs;
  }
}
