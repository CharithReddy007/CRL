// Reusable furniture/prop assemblies built from primitive boxes, for
// interior maps. Each helper returns an array of box() objects (same shape
// mapkit's stairs() uses) so callers can just `push(...bed(...))`.
import { box } from './mapkit.js';

function rot(x, z, cx, cz, rotY) {
  const dx = x - cx, dz = z - cz;
  const c = Math.cos(rotY), s = Math.sin(rotY);
  return [cx + dx * c - dz * s, cz + dx * s + dz * c];
}

export function bed(x, z, rotY = 0, kind = 'furn_wood') {
  const out = [];
  const [fx, fz] = [x, z];
  out.push(box(fx, 0.22, fz, 1.5, 0.44, 2.1, kind, true, { rotY }));
  out.push(box(fx, 0.55, fz, 1.42, 0.22, 2.0, 'furn_fabric_bed', true, { rotY }));
  const [px, pz] = rot(x, z - 0.85, x, z, rotY);
  out.push(box(px, 0.72, pz, 1.3, 0.16, 0.45, 'furn_fabric_light', true, { rotY }));
  return out;
}

export function nightstand(x, z, rotY = 0) {
  return [box(x, 0.3, z, 0.45, 0.6, 0.45, 'furn_wood', true, { rotY })];
}

export function wardrobe(x, z, rotY = 0) {
  return [box(x, 1.0, z, 1.1, 2.0, 0.55, 'furn_wood', true, { rotY })];
}

export function bookshelf(x, z, rotY = 0, width = 1.0) {
  const out = [];
  out.push(box(x, 1.0, z, width, 2.0, 0.32, 'furn_wood', true, { rotY }));
  for (const dy of [0.5, 1.0, 1.5]) {
    const [sx, sz] = rot(x, z + 0.18, x, z, rotY);
    out.push(box(sx, dy, sz, width * 0.9, 0.04, 0.3, 'furn_wood_dark', false, { rotY }));
  }
  return out;
}

export function couch(x, z, rotY = 0, length = 2.0) {
  const out = [];
  out.push(box(x, 0.24, z, length, 0.48, 0.85, 'furn_fabric', true, { rotY }));
  const [bx, bz] = rot(x, z - 0.32, x, z, rotY);
  out.push(box(bx, 0.55, bz, length, 0.6, 0.2, 'furn_fabric', true, { rotY }));
  for (const side of [-1, 1]) {
    const [ax, az] = rot(x + side * (length / 2 - 0.1), z, x, z, rotY);
    out.push(box(ax, 0.42, az, 0.2, 0.36, 0.85, 'furn_fabric_dark', true, { rotY }));
  }
  return out;
}

export function coffeeTable(x, z, rotY = 0) {
  return [box(x, 0.2, z, 1.1, 0.4, 0.6, 'furn_wood', true, { rotY })];
}

export function tvStand(x, z, rotY = 0) {
  const out = [];
  out.push(box(x, 0.28, z, 1.4, 0.5, 0.4, 'furn_wood', true, { rotY }));
  const [tx, tz] = rot(x, z - 0.08, x, z, rotY);
  out.push(box(tx, 0.95, tz, 1.15, 0.65, 0.06, 'appliance_dark', false, { rotY }));
  return out;
}

export function diningTable(x, z, rotY = 0, chairs = 4) {
  const out = [];
  out.push(box(x, 0.42, z, 1.5, 0.06, 0.9, 'furn_wood', true, { rotY }));
  for (const [lx, lz] of [[-0.68, -0.38], [0.68, -0.38], [-0.68, 0.38], [0.68, 0.38]]) {
    const [px, pz] = rot(x + lx, z + lz, x, z, rotY);
    out.push(box(px, 0.21, pz, 0.06, 0.42, 0.06, 'furn_wood_dark', true, { rotY }));
  }
  const seatOffsets = chairs >= 4 ? [[-0.85, 0], [0.85, 0], [0, -0.65], [0, 0.65]] : [[-0.85, 0], [0.85, 0]];
  for (const [ox, oz] of seatOffsets) {
    const [cx2, cz2] = rot(x + ox, z + oz, x, z, rotY);
    out.push(box(cx2, 0.24, cz2, 0.42, 0.06, 0.42, 'furn_wood', true, { rotY }));
    const [bx, bz] = rot(x + ox * 1.18, z + oz * 1.18, x, z, rotY);
    out.push(box(bx, 0.5, bz, 0.42, 0.55, 0.06, 'furn_wood', true, { rotY }));
  }
  return out;
}

export function kitchenCounter(x, z, length, rotY = 0) {
  const out = [];
  out.push(box(x, 0.45, z, length, 0.9, 0.62, 'furn_counter', true, { rotY }));
  const [tx, tz] = rot(x, z, x, z, rotY);
  out.push(box(tx, 0.92, tz, length, 0.04, 0.66, 'furn_counter_top', true, { rotY }));
  return out;
}

export function kitchenIsland(x, z, rotY = 0) {
  return kitchenCounter(x, z, 1.8, rotY);
}

export function fridge(x, z, rotY = 0) {
  return [box(x, 0.95, z, 0.75, 1.9, 0.7, 'appliance', true, { rotY })];
}

export function stove(x, z, rotY = 0) {
  const out = [];
  out.push(box(x, 0.45, z, 0.7, 0.9, 0.62, 'appliance', true, { rotY }));
  const [tx, tz] = rot(x, z, x, z, rotY);
  out.push(box(tx, 0.91, tz, 0.7, 0.03, 0.62, 'appliance_dark', false, { rotY }));
  return out;
}

export function kitchenTable(x, z, rotY = 0) {
  return diningTable(x, z, rotY, 4);
}

export function car(x, z, rotY = 0, color = 'vehicle') {
  const out = [];
  out.push(box(x, 0.42, z, 1.85, 0.85, 4.3, color, true, { rotY }));
  const [cx, cz] = rot(x, z - 0.3, x, z, rotY);
  out.push(box(cx, 1.05, cz, 1.7, 0.55, 2.0, 'vehicle_glass', true, { rotY }));
  return out;
}

export function fenceRun(x1, z1, x2, z2, h = 1.5) {
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  const len = Math.hypot(x2 - x1, z2 - z1);
  const angle = Math.atan2(z2 - z1, x2 - x1);
  return [box(cx, h / 2, cz, len, h, 0.12, 'fence', true, { rotY: angle })];
}

export function hedgeRun(x1, z1, x2, z2, h = 1.1) {
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  const len = Math.hypot(x2 - x1, z2 - z1);
  const angle = Math.atan2(z2 - z1, x2 - x1);
  return [box(cx, h / 2, cz, len, h, 0.6, 'hedge', true, { rotY: angle })];
}

export function mailbox(x, z) {
  return [box(x, 0.55, z, 0.1, 1.1, 0.1, 'furn_wood_dark', true), box(x, 1.15, z, 0.35, 0.2, 0.16, 'mailbox_top', true)];
}

export function patioTable(x, z) {
  const out = [];
  out.push(box(x, 0.7, z, 0.9, 0.06, 0.9, 'patio_metal', true));
  out.push(box(x, 0.35, z, 0.1, 0.7, 0.1, 'patio_metal', true));
  for (const [ox, oz] of [[-0.7, 0], [0.7, 0], [0, -0.7], [0, 0.7]]) {
    out.push(box(x + ox, 0.24, z + oz, 0.4, 0.48, 0.4, 'patio_chair', true));
  }
  return out;
}

export function bbqGrill(x, z, rotY = 0) {
  const out = [];
  out.push(box(x, 0.55, z, 0.6, 0.5, 0.6, 'appliance_dark', true, { rotY }));
  const [lx, lz] = rot(x, z, x, z, rotY);
  out.push(box(lx, 0.4, lz, 0.55, 0.04, 0.55, 'appliance', true, { rotY }));
  return out;
}

export function porchSteps(x, z, dirX, dirZ, count = 3, stepH = 0.2, stepD = 0.35, stepW = 1.6) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const cx = x + dirX * stepD * (i + 0.5);
    const cz = z + dirZ * stepD * (i + 0.5);
    const riserHeight = stepH * (i + 1);
    out.push(box(cx, riserHeight / 2, cz, stepW, riserHeight, stepD, 'porch_step', true));
  }
  return out;
}
