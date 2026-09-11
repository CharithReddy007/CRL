// Visible 3D representation of the Core (the plantable objective device) --
// carried on a player, sitting dropped on the ground, or planted at a site.
// Without this the Core has no presence in the 3D world at all: carrying,
// dropping and planting are all real server-side state (see Match.js), but
// nothing ever rendered it, so picking it up was invisible/felt broken.
import * as THREE from 'three';

const CARRY_HEIGHT = 0.95; // rides at roughly hip/back height on the carrier

export class CoreView {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.visible = false;

    const caseMat = new THREE.MeshStandardMaterial({ color: 0x24262c, metalness: 0.65, roughness: 0.35 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x4a4e58, metalness: 0.6, roughness: 0.4 });
    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0xff3b30, emissive: 0xff3b30, emissiveIntensity: 1.4, metalness: 0.1, roughness: 0.25,
    });

    const caseMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.5), caseMat);
    const trimMesh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.52), trimMat);
    trimMesh.position.y = 0.1;
    const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), this.coreMat);
    coreMesh.position.set(0, 0.14, 0);
    this.coreMesh = coreMesh;

    this.light = new THREE.PointLight(0xff3b30, 0, 4.5);
    this.light.position.set(0, 0.2, 0);

    this.group.add(caseMesh, trimMesh, coreMesh, this.light);
    this.group.castShadow = true;
    caseMesh.castShadow = true;
    scene.add(this.group);

    this.blinkT = 0;
  }

  update(core, playersById, selfId, selfPos, dt) {
    this.blinkT += dt;
    if (!core || core.state === 'none' || core.state === 'defused') { this.group.visible = false; return; }

    let pos = null;
    let carried = false;
    if (core.state === 'carried') {
      carried = true;
      if (core.carrierId === selfId) pos = selfPos;
      else pos = playersById.get(core.carrierId)?.pos;
    } else {
      pos = core.pos;
    }
    if (!pos) { this.group.visible = false; return; }

    this.group.visible = true;
    this.group.position.set(pos[0], pos[1] + (carried ? CARRY_HEIGHT : 0.12), pos[2]);

    // idle blink while carried/dropped; faster and brighter once planted so
    // it reads as the active, ticking objective
    const planted = core.state === 'planted';
    const rate = planted ? 3.2 : 1.2;
    const on = Math.sin(this.blinkT * Math.PI * rate) > 0;
    this.coreMat.emissiveIntensity = on ? (planted ? 2.6 : 1.3) : 0.35;
    this.light.intensity = planted ? (on ? 2.4 : 0.5) : (on ? 0.6 : 0.15);
  }
}
