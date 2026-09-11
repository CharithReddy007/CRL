// Small helper library for building map geometry as lists of boxes.
// Every map is just an array of boxes tagged with a `kind` (drives client
// material/color) and `solid` (drives server collision + bullet blocking).
// Non-solid boxes are purely decorative (neon signs, glass, foliage).

let uid = 0;
function nextId() { uid += 1; return uid; }

export function box(x, y, z, w, h, d, kind, solid = true, extra = {}) {
  return { id: nextId(), pos: [x, y, z], size: [w, h, d], kind, solid, ...extra };
}

// Wall centered between two floor-level endpoints, full height from y0.
export function wallSeg(x1, z1, x2, z2, h, y0, thickness, kind = 'wall', solid = true) {
  const cx = (x1 + x2) / 2;
  const cz = (z1 + z2) / 2;
  const len = Math.hypot(x2 - x1, z2 - z1);
  const angle = Math.atan2(z2 - z1, x2 - x1);
  return box(cx, y0 + h / 2, cz, len, h, thickness, kind, solid, { rotY: angle });
}

// solid=false for a decorative zone pad drawn over a map's single solid
// ground plane (avoids duplicate overlapping floor colliders); solid=true
// only for a floor that is a real walking surface at its own elevation
// (rooftops, underground platforms/tunnels) not covered by that ground plane.
export function floor(x, y, z, w, d, kind = 'floor', solid = true) {
  return box(x, y - 0.15, z, w, 0.3, d, kind, solid);
}

// A ground plane specifically (not an elevated platform/rooftop): much
// thicker than floor()'s thin slab, since a long freefall from a tall
// rooftop can build enough velocity to cross a thin collider within a
// single physics tick and tunnel through undetected (collision is only
// checked at each tick's end position). The extra thickness goes downward
// from the same walkable top surface, so it's otherwise identical to floor().
export function groundPlane(x, y, z, w, d, kind = 'floor') {
  return box(x, y - 2, z, w, 4, d, kind, true);
}

export function stairs(x, z, dirX, dirZ, count, stepW, stepH, stepD, kind = 'stair', y0 = 0) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const cx = x + dirX * stepD * (i + 0.5);
    const cz = z + dirZ * stepD * (i + 0.5);
    const riserHeight = stepH * (i + 1);
    const cy = y0 + riserHeight / 2; // box spans y0..y0+riserHeight, solid down to the ground
    out.push(box(cx, cy, cz, stepW, riserHeight, stepD, kind, true));
  }
  return out;
}

// Auto-sized staircase: picks step count/depth so each riser stays under the
// player's auto-step allowance, and reports the exact top position reached
// so the caller can wire up a connecting floor without guessing coordinates.
export function stairsRise(x, z, dirX, dirZ, riseTotal, runAvailable, stepW, kind = 'stair', y0 = 0, maxStepH = 0.45) {
  const count = Math.max(1, Math.ceil(riseTotal / maxStepH));
  const stepD = runAvailable / count;
  const stepH = riseTotal / count;
  const boxes = stairs(x, z, dirX, dirZ, count, stepW, stepH, stepD, kind, y0);
  return { boxes, top: [x + dirX * stepD * count, y0 + riseTotal, z + dirZ * stepD * count], run: stepD * count };
}

export function crate(x, y, z, size = 1.6, kind = 'crate') {
  return box(x, y + size / 2, z, size, size, size, kind, true);
}

export function container(x, z, rotY, kind = 'container') {
  return box(x, 1.3, z, 2.5, 2.6, 6, kind, true, { rotY });
}

export function pillar(x, z, h, r = 0.5, kind = 'pillar') {
  return box(x, h / 2, z, r * 2, h, r * 2, kind, true);
}

export function siteZone(x, z, radius, id, name, y = 0, yTolerance = 4) {
  return { id: `site_${id}`, kind: 'site', center: [x, z], radius, siteId: id, name, y, yTolerance };
}

export function spawnPoint(x, z, yaw = 0, y = 0) {
  return { pos: [x, y, z], yaw };
}

export function callout(x, z, name) {
  return { pos: [x, z], name };
}
