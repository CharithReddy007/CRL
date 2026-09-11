// IRON YARD — abandoned industrial manufacturing complex.
// Layout (Z runs south→north, attackers spawn south, defenders north):
//   Z -70..-55  Attacker Spawn (warehouse shell, 3 exit lanes)
//   Z -55..-15  Mid Yard (containers spine, crane, catwalk above)
//   Z -15.. +15 Site row: Site B (west, Loading Bay) / Site A (east, Assembly Floor)
//   Z +15..+35  Back Hall (rotation corridor behind both sites)
//   Z +35..+55  Defender Spawn
// Elevated flank: a catwalk at y=6.4 (clears the 6m walls below) runs from the
// spawn-roof staircase, east across Mid Yard, then south and down inside
// Site A's open-top footprint — a true aerial flank route.
import { box, wallSeg, floor, crate, container, pillar, stairs, stairsRise, siteZone, spawnPoint, callout } from '../mapkit.js';

const g = [];
const push = (...items) => { for (const it of items) g.push(it); };
const CW_Y = 6.4; // catwalk walking height (wall tops are at y=6)

// ---- Ground ----
push(floor(0, 0, 0, 92, 152, 'ground'));

// ---- Attacker Spawn (south, warehouse shell) ----
push(floor(0, 0.01, -63, 60, 18, 'spawn_pad', false));
push(wallSeg(-30, -72, 30, -72, 6, 0, 1, 'wall')); // back wall
push(wallSeg(-30, -72, -30, -55, 6, 0, 1, 'wall')); // west wall
push(wallSeg(30, -72, 30, -55, 6, 0, 1, 'wall')); // east wall
// front wall with 3 gaps: B-lane door (west), mid open (wide), A-lane door (east)
push(wallSeg(-30, -55, -20, -55, 6, 0, 1, 'wall'));
push(wallSeg(-14, -55, -7, -55, 6, 0, 1, 'wall'));
push(wallSeg(7, -55, 14, -55, 6, 0, 1, 'wall'));
push(wallSeg(20, -55, 30, -55, 6, 0, 1, 'wall'));
push(crate(-25, 0, -68, 1.8), crate(-22, 0, -65, 1.6), crate(24, 0, -67, 1.8), crate(21, 0, -64, 1.6));

// staircase up to spawn rooftop, then the catwalk chain across Mid Yard and
// down inside Site A. Each leg starts exactly where the previous ends.
const stair1 = stairsRise(-27, -68, 0, 1, CW_Y, 12, 3, 'stair', 0);
push(...stair1.boxes);
push(box(-27, CW_Y - 0.15, -50.5, 6, 0.3, 11, 'roof', true)); // z -56..-45
push(box(-27, CW_Y - 0.15, -39, 3, 0.3, 12, 'catwalk', true)); // z -45..-33, NS riser
push(box(0, CW_Y - 0.15, -34, 56, 0.3, 3, 'catwalk', true)); // x -28..28, EW bridge over Mid Yard
push(box(25, CW_Y - 0.15, -20, 3, 0.3, 28, 'catwalk', true)); // x 25, z -34..-6, NS riser turning toward Site A
const descentA = stairsRise(25, 4, 0, -1, CW_Y, 10, 3, 'stair', 0); // lands inside Site A interior, top meets the riser at z=-6
push(...descentA.boxes);

// ---- Mid Yard (containers spine + crane) ----
push(floor(0, 0.01, -34, 70, 34, 'yard', false));
// central container spine, staggered for cover & broken sightlines
push(container(-14, -40, 0), container(-14, -30, Math.PI / 2), container(0, -36, 0.3),
     container(14, -30, 0), container(14, -20, Math.PI / 2), container(-2, -22, -0.2));
push(crate(-24, 0, -24, 1.8), crate(-20, 0, -18, 1.6), crate(22, 0, -26, 1.8), crate(18, 0, -16, 1.6));
push(crate(-6, 0, -16, 1.6), crate(6, 0, -14, 1.6));
// crane landmark: solid base clears the catwalk overhead (y=6.4), rest is decorative
push(pillar(0, -34, 6, 0.8, 'crane_leg'));
push(box(0, 10, -34, 1.2, 8, 1.2, 'crane_mast', false));
push(box(0, 13.5, -34, 1, 1, 26, 'crane_boom', false));

// ---- Site B: Loading Bay (west, hybrid interior/exterior) ----
push(floor(-30, 0.01, 0, 30, 34, 'site_floor', false));
push(wallSeg(-45, -15, -45, 17, 6, 0, 1, 'wall')); // west outer wall
// north wall: gap x -45..-33 links to Back Hall / long flank loop
push(wallSeg(-33, 17, -16, 17, 6, 0, 1, 'wall'));
// east wall (mid-facing): one wide Main gap z -9..9
push(box(-16, 3, -12, 1, 6, 6, 'wall', true));
push(box(-16, 3, 13, 1, 6, 8, 'wall', true));
// south wall: gap x -34..-26 is the Garage entry (from attacker spawn B-lane)
push(wallSeg(-45, -15, -34, -15, 6, 0, 1, 'wall'));
push(wallSeg(-26, -15, -16, -15, 6, 0, 1, 'wall'));
push(box(-30, 2.5, -15, 6, 5, 0.6, 'garage_frame', true)); // garage door frame accent
push(container(-38, -4, 0.15), container(-38, 8, -0.2), crate(-28, 0, 12, 1.8), crate(-24, 0, 6, 1.6));
push(crate(-40, 0, 14, 1.8), crate(-36, 0, -8, 1.6));
push(pillar(-22, -2, 5, 0.5), pillar(-22, 10, 5, 0.5));
push(siteZone(-28, 2, 9, 'B', 'Loading Bay'));

// ---- Site A: Assembly Floor (east, indoor manufacturing, open-top) ----
push(floor(30, 0.01, 0, 30, 34, 'site_floor', false));
push(wallSeg(45, -15, 45, 17, 6, 0, 1, 'wall')); // east outer wall
// north wall: gap x 24..36 links to Back Hall (defender rotate)
push(wallSeg(16, 17, 24, 17, 6, 0, 1, 'wall'));
push(wallSeg(36, 17, 45, 17, 6, 0, 1, 'wall'));
// west wall (mid-facing): Main gap z -11..-3
push(box(16, 3, -13, 1, 6, 4, 'wall', true));
push(box(16, 3, 7, 1, 6, 20, 'wall', true));
// south wall: gap x 24..32 is the Warehouse secondary entry
push(wallSeg(16, -15, 24, -15, 6, 0, 1, 'wall'));
push(wallSeg(32, -15, 45, -15, 6, 0, 1, 'wall'));
push(crate(38, 0, 8, 1.8, 'machine'), crate(34, 0, -6, 1.8, 'machine'), crate(24, 0, 2, 1.6, 'machine'));
push(box(32, 1.2, 10, 8, 2.4, 5, 'machine_block', true));
push(box(24, 1.2, -8, 6, 2.4, 4, 'machine_block', true));
push(pillar(38, -2, 5, 0.5), pillar(24, 10, 5, 0.5));
push(siteZone(30, 2, 9, 'A', 'Assembly Floor'));

// ---- Back Hall (rotation corridor behind both sites) ----
push(floor(0, 0.01, 26, 92, 12, 'backhall', false));
push(wallSeg(-46, 32, -3, 32, 6, 0, 1, 'wall'));
push(wallSeg(3, 32, 46, 32, 6, 0, 1, 'wall'));
push(crate(-10, 0, 26, 1.6), crate(10, 0, 26, 1.6));

// ---- Defender Spawn (north) ----
push(floor(0, 0.01, 46, 50, 18, 'spawn_pad', false));
push(wallSeg(-25, 55, 25, 55, 6, 0, 1, 'wall'));
push(wallSeg(-25, 37, -25, 55, 6, 0, 1, 'wall'));
push(wallSeg(25, 37, 25, 55, 6, 0, 1, 'wall'));
push(wallSeg(-25, 37, -4, 37, 6, 0, 1, 'wall'));
push(wallSeg(4, 37, 25, 37, 6, 0, 1, 'wall'));

export const IRON_YARD = {
  id: 'iron_yard',
  name: 'Iron Yard',
  theme: 'Industrial complex',
  bounds: { minX: -46, maxX: 46, minZ: -73, maxZ: 56 },
  geometry: g,
  sites: g.filter(o => o.kind === 'site'),
  spawns: {
    A: [spawnPoint(-18, -66, 0), spawnPoint(-6, -66, 0), spawnPoint(6, -66, 0), spawnPoint(18, -66, 0), spawnPoint(0, -70, 0)],
    B: [spawnPoint(-14, 50, Math.PI), spawnPoint(-4, 50, Math.PI), spawnPoint(4, 50, Math.PI), spawnPoint(14, 50, Math.PI), spawnPoint(0, 53, Math.PI)],
  },
  callouts: [
    callout(-27, -66, 'Spawn Roof'), callout(0, -34, 'Crane'), callout(-20, -34, 'Container Spine'),
    callout(0, -35, 'Catwalk'), callout(-28, 2, 'Loading Bay'), callout(-30, -12, 'Garage'),
    callout(-24, 12, 'Containers'), callout(30, 2, 'Assembly Floor'), callout(38, 8, 'Machine Row'),
    callout(28, -10, 'Warehouse'), callout(0, 26, 'Back Hall'),
  ],
};
