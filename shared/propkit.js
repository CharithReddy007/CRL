// Reusable office/industrial prop assemblies built from primitive boxes, for
// enterable interior rooms in the non-residential maps (Iron Yard, Neon
// District, Desert Relay). Kind names here are generic ("desk_top",
// "locker", ...) rather than material-specific -- each map's own client
// palette gives them a look matching that map's theme (metal grey for
// industrial, dark plastic/neon for urban, sun-bleached for desert).
import { box } from './mapkit.js';

function rot(x, z, cx, cz, rotY) {
  const dx = x - cx, dz = z - cz;
  const c = Math.cos(rotY), s = Math.sin(rotY);
  return [cx + dx * c - dz * s, cz + dx * s + dz * c];
}

export function desk(x, z, rotY = 0, length = 1.3) {
  const out = [];
  out.push(box(x, 0.75, z, length, 0.05, 0.65, 'desk_top', true, { rotY }));
  for (const [lx, lz] of [[-length / 2 + 0.08, -0.28], [length / 2 - 0.08, -0.28], [-length / 2 + 0.08, 0.28], [length / 2 - 0.08, 0.28]]) {
    const [px, pz] = rot(x + lx, z + lz, x, z, rotY);
    out.push(box(px, 0.375, pz, 0.05, 0.75, 0.05, 'desk_leg', true, { rotY }));
  }
  return out;
}

export function officeChair(x, z, rotY = 0) {
  const out = [];
  out.push(box(x, 0.45, z, 0.45, 0.06, 0.45, 'chair', true, { rotY }));
  const [bx, bz] = rot(x, z - 0.22, x, z, rotY);
  out.push(box(bx, 0.75, bz, 0.45, 0.55, 0.06, 'chair', true, { rotY }));
  out.push(box(x, 0.22, z, 0.32, 0.44, 0.32, 'chair', true, { rotY }));
  return out;
}

export function locker(x, z, rotY = 0, width = 0.6) {
  const out = [];
  out.push(box(x, 0.95, z, width, 1.9, 0.5, 'locker', true, { rotY }));
  const [dx, dz] = rot(x, z - 0.26, x, z, rotY);
  out.push(box(dx, 0.95, dz, width * 0.85, 1.7, 0.02, 'locker_door', false, { rotY }));
  return out;
}

export function lockerRow(x, z, rotY = 0, count = 3, width = 0.6) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const ox = (i - (count - 1) / 2) * width;
    const [lx, lz] = rot(x + ox, z, x, z, rotY);
    out.push(...locker(lx, lz, rotY, width * 0.94));
  }
  return out;
}

export function filingCabinet(x, z, rotY = 0) {
  const out = [];
  out.push(box(x, 0.65, z, 0.5, 1.3, 0.6, 'locker', true, { rotY }));
  for (const dy of [0.35, 0.75, 1.15]) {
    const [fx, fz] = rot(x, z - 0.31, x, z, rotY);
    out.push(box(fx, dy, fz, 0.44, 0.28, 0.02, 'locker_door', false, { rotY }));
  }
  return out;
}

export function monitorOnDesk(x, z, rotY = 0) {
  const out = [];
  const [sx, sz] = rot(x, z + 0.08, x, z, rotY);
  out.push(box(sx, 0.98, sz, 0.42, 0.28, 0.03, 'monitor_screen', false, { rotY }));
  out.push(box(x, 0.83, z + 0.02, 0.06, 0.16, 0.06, 'desk_leg', true, { rotY }));
  return out;
}

export function shelfUnit(x, z, rotY = 0, width = 1.4, shelves = 3) {
  const out = [];
  out.push(box(x, 1.0, z, width, 2.0, 0.45, 'shelf_unit', true, { rotY }));
  for (let i = 0; i < shelves; i++) {
    const dy = 0.4 + i * 0.55;
    const [sx, sz] = rot(x, z + 0.2, x, z, rotY);
    out.push(box(sx, dy, sz, width * 0.88, 0.04, 0.4, 'shelf_item', false, { rotY }));
  }
  return out;
}

export function workbench(x, z, rotY = 0, length = 2.0) {
  const out = [];
  out.push(box(x, 0.42, z, length, 0.08, 0.8, 'desk_top', true, { rotY }));
  for (const side of [-1, 1]) {
    const [lx, lz] = rot(x + side * (length / 2 - 0.15), z, x, z, rotY);
    out.push(box(lx, 0.19, lz, 0.1, 0.38, 0.7, 'desk_leg', true, { rotY }));
  }
  return out;
}

export function bench(x, z, rotY = 0, length = 1.6) {
  const out = [];
  out.push(box(x, 0.42, z, length, 0.06, 0.4, 'bench', true, { rotY }));
  for (const side of [-1, 1]) {
    const [lx, lz] = rot(x + side * (length / 2 - 0.1), z, x, z, rotY);
    out.push(box(lx, 0.2, lz, 0.06, 0.4, 0.36, 'bench', true, { rotY }));
  }
  return out;
}

export function barrel(x, z, kind = 'barrel') {
  return [box(x, 0.5, z, 0.55, 1.0, 0.55, kind, true)];
}

export function windowFrame(x1, z1, x2, z2, h, y0, thickness, sillH = 0.9, kind = 'window_glass') {
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  const len = Math.hypot(x2 - x1, z2 - z1);
  const angle = Math.atan2(z2 - z1, x2 - x1);
  return [box(cx, y0 + sillH + (h - sillH) / 2, cz, len, h - sillH, thickness, kind, false, { rotY: angle })];
}
