import * as THREE from 'three';

function lookAtSegment(mesh, a, b) {
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  mesh.position.copy(mid);
  mesh.scale.set(1, 1, Math.max(0.001, len));
  mesh.lookAt(b);
}

export class Effects {
  constructor(scene) {
    this.scene = scene;
    this.active = [];
    this.tracerGeo = new THREE.CylinderGeometry(0.006, 0.006, 1, 5);
    this.tracerGeo.rotateX(Math.PI / 2);
    this.impactGeo = new THREE.IcosahedronGeometry(0.05, 0);
  }

  spawnTracer(a, b) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(this.tracerGeo, mat);
    lookAtSegment(mesh, new THREE.Vector3(...a), new THREE.Vector3(...b));
    this.scene.add(mesh);
    this.active.push({ mesh, mat, life: 0.08, maxLife: 0.08, kind: 'tracer' });
  }

  spawnImpact(point, color = 0xffcf80) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(this.impactGeo, mat);
    mesh.position.set(point[0], point[1], point[2]);
    this.scene.add(mesh);
    this.active.push({ mesh, mat, life: 0.22, maxLife: 0.22, kind: 'impact' });
  }

  spawnBloodImpact(point) {
    this.spawnImpact(point, 0xd6394a);
  }

  spawnExplosion(point) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(this.impactGeo, mat);
    mesh.position.set(point[0], point[1] + 0.1, point[2]);
    this.scene.add(mesh);
    this.active.push({ mesh, mat, life: 0.4, maxLife: 0.4, kind: 'explosion' });

    const light = new THREE.PointLight(0xffb347, 6, 12);
    light.position.set(point[0], point[1] + 0.6, point[2]);
    this.scene.add(light);
    this.active.push({ mesh: light, mat: null, life: 0.25, maxLife: 0.25, kind: 'flash' });
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const fx = this.active[i];
      fx.life -= dt;
      const t = Math.max(0, fx.life / fx.maxLife);
      if (fx.kind === 'tracer') {
        fx.mat.opacity = t * 0.85;
      } else if (fx.kind === 'flash') {
        fx.mesh.intensity = t * 6;
      } else if (fx.kind === 'explosion') {
        fx.mat.opacity = t;
        fx.mesh.scale.setScalar(1 + (1 - t) * 26);
      } else {
        fx.mat.opacity = t;
        fx.mesh.scale.setScalar(1 + (1 - t) * 1.8);
      }
      if (fx.life <= 0) {
        this.scene.remove(fx.mesh);
        if (fx.mat) fx.mat.dispose();
        this.active.splice(i, 1);
      }
    }
  }
}
