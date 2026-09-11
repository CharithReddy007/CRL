// Deterministic player movement + collision, shared by server (authority)
// and client (local prediction) so reconciliation stays close.
import {
  PLAYER_RADIUS, PLAYER_HEIGHT, PLAYER_CROUCH_HEIGHT,
  WALK_SPEED, CROUCH_SPEED, GRAVITY, JUMP_SPEED,
} from './constants.js';

const STEP_HEIGHT = 0.5;
const SKIN = 0.002;

function playerHeight(crouched) { return crouched ? PLAYER_CROUCH_HEIGHT : PLAYER_HEIGHT; }

function playerBox(pos, crouched) {
  const h = playerHeight(crouched);
  return {
    min: [pos[0] - PLAYER_RADIUS, pos[1], pos[2] - PLAYER_RADIUS],
    max: [pos[0] + PLAYER_RADIUS, pos[1] + h, pos[2] + PLAYER_RADIUS],
  };
}

export function colliderAABB(o) {
  const hx = o.size[0] / 2, hy = o.size[1] / 2, hz = o.size[2] / 2;
  if (o.rotY) {
    const c = Math.abs(Math.cos(o.rotY)), s = Math.abs(Math.sin(o.rotY));
    const ex = hx * c + hz * s, ez = hx * s + hz * c;
    return { min: [o.pos[0] - ex, o.pos[1] - hy, o.pos[2] - ez], max: [o.pos[0] + ex, o.pos[1] + hy, o.pos[2] + ez] };
  }
  return { min: [o.pos[0] - hx, o.pos[1] - hy, o.pos[2] - hz], max: [o.pos[0] + hx, o.pos[1] + hy, o.pos[2] + hz] };
}

function overlaps(a, b) {
  return a.min[0] < b.max[0] && a.max[0] > b.min[0]
    && a.min[1] < b.max[1] && a.max[1] > b.min[1]
    && a.min[2] < b.max[2] && a.max[2] > b.min[2];
}

function findBlocker(pos, crouched, solids) {
  const box = playerBox(pos, crouched);
  for (const o of solids) {
    const cb = colliderAABB(o);
    if (overlaps(box, cb)) return cb;
  }
  return null;
}

// Move a single axis (0=x,1=y,2=z), resolving collision by push-out.
// Returns { pos, collided }.
function moveAxis(pos, crouched, solids, axis, amount) {
  if (amount === 0) return { pos, collided: false };
  const next = pos.slice();
  next[axis] += amount;
  const cb = findBlocker(next, crouched, solids);
  if (!cb) return { pos: next, collided: false };
  if (axis === 1) {
    next[1] = amount > 0 ? cb.min[1] - playerHeight(crouched) - SKIN : cb.max[1] + SKIN;
  } else {
    next[axis] = amount > 0 ? cb.min[axis] - PLAYER_RADIUS - SKIN : cb.max[axis] + PLAYER_RADIUS + SKIN;
  }
  return { pos: next, collided: true };
}

// Horizontal axis move with a step-up allowance for stairs/curbs.
function moveHorizontalAxis(pos, crouched, solids, axis, amount, grounded) {
  const flat = moveAxis(pos, crouched, solids, axis, amount);
  if (!flat.collided || !grounded) return flat.pos;
  // try lifting by STEP_HEIGHT and re-attempting the same move
  const lifted = pos.slice();
  lifted[1] += STEP_HEIGHT;
  if (findBlocker(lifted, crouched, solids)) return flat.pos; // no room to stand up there
  const steppedMove = lifted.slice();
  steppedMove[axis] += amount;
  if (findBlocker(steppedMove, crouched, solids)) return flat.pos; // still blocked ahead
  // settle back down toward original height (gravity will finish the job next ticks)
  const settle = moveAxis(steppedMove, crouched, solids, 1, -STEP_HEIGHT);
  return settle.pos;
}

export function simulateMove(state, input, dt, geometry) {
  const solids = geometry;
  let pos = state.pos.slice();
  let vel = state.vel.slice();
  let grounded = state.grounded;
  const crouched = !!input.crouch;

  const yaw = input.yaw || 0;
  // Three.js cameras look down -Z by default, so at yaw=0 "forward" is -Z,
  // not +Z. This must match camera.rotation.y exactly (verified against
  // THREE.Object3D's actual quaternion) or movement drifts from where the
  // player is looking.
  const fwd = [-Math.sin(yaw), -Math.cos(yaw)];
  const right = [Math.cos(yaw), -Math.sin(yaw)];
  let wishX = right[0] * input.moveX + fwd[0] * input.moveZ;
  let wishZ = right[1] * input.moveX + fwd[1] * input.moveZ;
  const wishLen = Math.hypot(wishX, wishZ);
  if (wishLen > 1) { wishX /= wishLen; wishZ /= wishLen; }
  const speed = crouched ? CROUCH_SPEED : WALK_SPEED;

  vel[0] = wishX * speed;
  vel[2] = wishZ * speed;

  vel[1] -= GRAVITY * dt;
  if (grounded && input.jump) {
    vel[1] = JUMP_SPEED;
    grounded = false;
  }

  pos = moveHorizontalAxis(pos, crouched, solids, 0, vel[0] * dt, grounded);
  pos = moveHorizontalAxis(pos, crouched, solids, 2, vel[2] * dt, grounded);

  const yMove = moveAxis(pos, crouched, solids, 1, vel[1] * dt);
  pos = yMove.pos;
  if (yMove.collided) {
    if (vel[1] < 0) grounded = true;
    vel[1] = 0;
  } else {
    grounded = false;
  }

  return { pos, vel, grounded, crouched };
}

export function initialMoveState(pos) {
  return { pos: pos.slice(), vel: [0, 0, 0], grounded: true, crouched: false };
}
