import { PLAYER_RADIUS } from './constants.js';
import { colliderAABB } from './movement.js';
import { HITBOX } from './constants.js';

// Slab-method ray vs AABB. Returns entry t (>=0) or null.
export function rayAABB(origin, dir, box) {
  let tmin = 0, tmax = Infinity;
  for (let i = 0; i < 3; i++) {
    const o = origin[i], d = dir[i] || 1e-12;
    let t1 = (box.min[i] - o) / d;
    let t2 = (box.max[i] - o) / d;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}

// Nearest solid geometry hit along the ray, up to maxDist.
export function rayGeometry(origin, dir, solids, maxDist) {
  let best = null;
  for (const o of solids) {
    const box = colliderAABB(o);
    const t = rayAABB(origin, dir, box);
    if (t !== null && t <= maxDist && (!best || t < best.t)) best = { t, object: o };
  }
  return best;
}

// Ray vs a standing/crouched player capsule (approximated as an AABB split
// into head/body/limb vertical bands for hit location).
export function rayPlayer(origin, dir, feetPos, height, maxDist) {
  const box = {
    min: [feetPos[0] - PLAYER_RADIUS, feetPos[1], feetPos[2] - PLAYER_RADIUS],
    max: [feetPos[0] + PLAYER_RADIUS, feetPos[1] + height, feetPos[2] + PLAYER_RADIUS],
  };
  const t = rayAABB(origin, dir, box);
  if (t === null || t > maxDist) return null;
  const hitY = origin[1] + dir[1] * t;
  const frac = (hitY - feetPos[1]) / height;
  let zone = HITBOX.BODY;
  if (frac >= 0.88) zone = HITBOX.HEAD;
  else if (frac <= 0.2) zone = HITBOX.LIMB;
  return { t, zone };
}
