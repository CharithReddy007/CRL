import * as THREE from 'three';
import { noiseTexture, woodTexture, brickTexture, grassTexture } from './Textures.js';

// Per-map, per-kind visual styling. Distinct palettes give each map its own
// identity while kind-based tinting keeps zones readable within a map.
// `texture` is a factory (kind, palette-independent) that returns a
// CanvasTexture to use as the diffuse map, for surfaces large enough that a
// flat color reads as plastic-y.
const PALETTES = {
  iron_yard: {
    default: { color: 0x4a4640 },
    ground: { color: 0x36322b, texture: () => noiseTexture('#36322b', 22, 128, 16) },
    spawn_pad: { color: 0x413b30, texture: () => noiseTexture('#413b30', 18, 128, 6) },
    yard: { color: 0x3a352d, texture: () => noiseTexture('#3a352d', 18, 128, 10) },
    site_floor: { color: 0x46403a, texture: () => noiseTexture('#46403a', 16, 128, 6) },
    backhall: { color: 0x3a352e, texture: () => noiseTexture('#3a352e', 16, 128, 8) },
    wall: { color: 0x5b5850, roughness: 0.9, texture: () => noiseTexture('#5b5850', 20, 96, 3) },
    wall_top: { color: 0x5b5850, roughness: 0.9 },
    garage_frame: { color: 0x6b4a2e },
    crate: { color: 0x8a5a2b, roughness: 0.8 },
    container: { color: 0x7a4a24, roughness: 0.7, metalness: 0.2 },
    machine: { color: 0x2f2d2a, metalness: 0.4 },
    machine_block: { color: 0x413d36, metalness: 0.3 },
    pillar: { color: 0x57534a },
    roof: { color: 0x4a4a52, metalness: 0.5, roughness: 0.5 },
    catwalk: { color: 0x4a4a52, metalness: 0.5, roughness: 0.5 },
    stair: { color: 0x484844, metalness: 0.4 },
    rail: { color: 0x8a8a86, metalness: 0.6, roughness: 0.3 },
    crane_leg: { color: 0xd9791f, metalness: 0.4 },
    crane_mast: { color: 0xd9791f, metalness: 0.4 },
    crane_boom: { color: 0xb8660f, metalness: 0.4 },
  },
  neon_district: {
    default: { color: 0x262a33 },
    ground: { color: 0x15171d, texture: () => noiseTexture('#15171d', 12, 128, 18) },
    spawn_pad: { color: 0x1b1e25, texture: () => noiseTexture('#1b1e25', 10, 128, 6) },
    street: { color: 0x191b21, texture: () => noiseTexture('#191b21', 12, 128, 10) },
    building: { color: 0x24272f, metalness: 0.2, roughness: 0.7, texture: () => brickTexture('#262a33', '#1a1c22', 96, 3) },
    building_block: { color: 0x1f222a },
    alley_wall: { color: 0x2a2d36 },
    rooftop: { color: 0x272a33 },
    rooftop_plaza: { color: 0x2a2e38 },
    platform: { color: 0x181a20 },
    track: { color: 0x2c2c2c, metalness: 0.3 },
    pillar: { color: 0x2e323c },
    ledge: { color: 0x30343e },
    stair: { color: 0x2e323c },
    stair_down: { color: 0x2e323c },
    stair_fire_escape: { color: 0x3a3f4a, metalness: 0.5 },
    catwalk: { color: 0x33373f, metalness: 0.4 },
    hvac: { color: 0x22252c, metalness: 0.3 },
    wall: { color: 0x262930 },
    wall_low: { color: 0x262930 },
    tunnel_wall: { color: 0x1f2127 },
    neon_sign: { color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 2.2, transparent: true, opacity: 0.9 },
  },
  desert_relay: {
    default: { color: 0x9c8863 },
    sand: { color: 0xc2a875, roughness: 1, texture: () => noiseTexture('#c2a875', 20, 128, 20) },
    spawn_pad: { color: 0xb89c6e, texture: () => noiseTexture('#b89c6e', 16, 128, 8) },
    rock: { color: 0x8a7860, roughness: 1, texture: () => noiseTexture('#8a7860', 26, 96, 2) },
    trench: { color: 0xa88f63, roughness: 1, texture: () => noiseTexture('#a88f63', 18, 96, 6) },
    bunker_wall: { color: 0x6e6a5c, roughness: 0.9, texture: () => noiseTexture('#6e6a5c', 14, 96, 3) },
    bunker_small: { color: 0x6e6a5c, roughness: 0.9 },
    tunnel_wall: { color: 0x635e50 },
    tunnel_floor: { color: 0x5c5648 },
    site_floor: { color: 0xc9b183 },
    server_block: { color: 0x4a4f52, metalness: 0.3 },
    equipment: { color: 0x4a4f52, metalness: 0.3 },
    solarpanel: { color: 0x16273a, metalness: 0.6, roughness: 0.2, emissive: 0x0e2a4a, emissiveIntensity: 0.3 },
    fence: { color: 0x7a7568, metalness: 0.4 },
    pillar: { color: 0x736c5a },
    radar_mast: { color: 0x55524a, metalness: 0.5 },
    radar_dish: { color: 0xd6d0c0, metalness: 0.5 },
  },
};

const NON_SOLID_TWO_SIDED = new Set(['neon_sign', 'crane_boom', 'crane_mast', 'radar_dish']);

function materialFor(mapId, kind) {
  const palette = PALETTES[mapId] || {};
  const style = palette[kind] || palette.default || { color: 0x808080 };
  const mat = new THREE.MeshStandardMaterial({
    color: style.texture ? 0xffffff : style.color,
    map: style.texture ? style.texture() : null,
    roughness: style.roughness ?? 0.85,
    metalness: style.metalness ?? 0.1,
    emissive: style.emissive ?? 0x000000,
    emissiveIntensity: style.emissiveIntensity ?? 0,
    transparent: !!style.transparent,
    opacity: style.opacity ?? 1,
    side: NON_SOLID_TWO_SIDED.has(kind) ? THREE.DoubleSide : THREE.FrontSide,
  });
  return mat;
}

const unitBox = new THREE.BoxGeometry(1, 1, 1);

export function buildMapMeshes(mapData) {
  const group = new THREE.Group();
  const materialCache = new Map();
  for (const obj of mapData.geometry) {
    if (obj.kind === 'site') continue;
    const key = obj.kind;
    let mat = materialCache.get(key);
    if (!mat) { mat = materialFor(mapData.id, key); materialCache.set(key, mat); }
    const mesh = new THREE.Mesh(unitBox, mat);
    mesh.position.set(obj.pos[0], obj.pos[1], obj.pos[2]);
    mesh.scale.set(Math.max(obj.size[0], 0.02), Math.max(obj.size[1], 0.02), Math.max(obj.size[2], 0.02));
    if (obj.rotY) mesh.rotation.y = obj.rotY;
    mesh.castShadow = obj.solid;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  addSiteMarkers(group, mapData);
  return group;
}

function addSiteMarkers(group, mapData) {
  for (const site of mapData.sites) {
    const geo = new THREE.RingGeometry(site.radius - 0.15, site.radius, 48);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff5050, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(site.center[0], site.y + 0.05, site.center[1]);
    group.add(ring);
  }
}

export function buildSkyAndFog(scene, mapId) {
  const skyColors = {
    iron_yard: { sky: 0x8a8f96, fog: 0x74777c, ambient: 0x9aa2ab },
    neon_district: { sky: 0x0a0c14, fog: 0x0d0f18, ambient: 0x1a2035 },
    desert_relay: { sky: 0xcfd9e8, fog: 0xd8c9a0, ambient: 0xd6c9a5 },
  };
  const c = skyColors[mapId] || skyColors.iron_yard;
  scene.background = new THREE.Color(c.sky);
  scene.fog = new THREE.Fog(c.fog, 35, mapId === 'desert_relay' ? 130 : 95);
  return c;
}

export function addLighting(scene, mapId) {
  const c = buildSkyAndFog(scene, mapId);
  const hemi = new THREE.HemisphereLight(0xffffff, c.ambient, mapId === 'neon_district' ? 0.5 : 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, mapId === 'neon_district' ? 0.4 : 1.1);
  sun.position.set(40, 60, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -80;
  sun.shadow.camera.right = 80;
  sun.shadow.camera.top = 80;
  sun.shadow.camera.bottom = -80;
  sun.shadow.camera.far = 200;
  scene.add(sun);
  if (mapId === 'neon_district') {
    const fill = new THREE.PointLight(0x00e5ff, 0.6, 60);
    fill.position.set(0, 10, 0);
    scene.add(fill);
  }
  return { hemi, sun };
}
