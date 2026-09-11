// MAPLE HOLLOW — a quiet suburban block at dusk. Two furnished homes serve
// as bomb sites instead of industrial/military structures, for a map that
// reads as "real rooms with furniture" rather than abstract geometry.
// Z runs south (attackers, a cul-de-sac park) -> north (defenders).
//   Z -78..-58  Attacker Spawn (park, 3 exit lanes)
//   Z -58..-15  Mid Street (decorative houses for cover, side alleys)
//   Z -15.. +15 Site row: Site A Oak House (east, indoor+loft) / Site B Birch House + Patio (west)
//   Z +15..+35  Back Alley (rotation corridor behind both sites)
//   Z +35..+58  Defender Spawn (cul-de-sac garages)
import { box, wallSeg, floor, groundPlane, pillar, stairsRise, siteZone, spawnPoint, callout } from '../mapkit.js';
import {
  bed, nightstand, wardrobe, bookshelf, couch, coffeeTable, tvStand, diningTable,
  kitchenCounter, kitchenIsland, fridge, stove, car, fenceRun, hedgeRun, mailbox,
  patioTable, bbqGrill,
} from '../furniturekit.js';

const g = [];
const push = (...items) => { for (const it of items) g.push(it); };
const WALL_H = 3.0;
const LOFT_Y = 3.0;

// base ground -- a single solid plane under everything at y=0; all zone
// pads placed on top are decorative (non-solid), per the established
// pattern (duplicate solid floors at the same height cause false collisions)
push(groundPlane(0, 0, -12, 106, 148, 'grass'));

// ---- Attacker Spawn (park) ----
push(floor(0, 0.01, -68, 50, 20, 'park_floor', false));
push(...hedgeRun(-25, -78, 25, -78));
push(...hedgeRun(-25, -78, -25, -58));
push(...hedgeRun(25, -78, 25, -58));
push(...hedgeRun(-25, -58, -20, -58));
push(...hedgeRun(-13, -58, -6, -58));
push(...hedgeRun(6, -58, 13, -58));
push(...hedgeRun(20, -58, 25, -58));
push(pillar(-15, -70, 3.4, 0.35, 'tree_trunk'));
push(box(-15, 4.2, -70, 2.6, 1.8, 2.6, 'tree_canopy', false));
push(pillar(15, -73, 3.2, 0.35, 'tree_trunk'));
push(box(15, 3.9, -73, 2.4, 1.6, 2.4, 'tree_canopy', false));
push(box(-6, 0.24, -74, 1.8, 0.48, 0.5, 'park_bench', true));
push(box(6, 0.24, -63, 1.8, 0.48, 0.5, 'park_bench', true));

// ---- Mid Street ----
push(floor(0, 0.01, -36, 100, 44, 'street', false));
push(floor(0, 0.02, -36, 16, 44, 'road', false));
// Yellow House (decorative shell, not enterable) -- west side cover
push(box(-25, 1.8, -36, 16, 3.6, 20, 'house_yellow', true));
push(box(-25, 3.9, -36, 17, 0.5, 21, 'roof_dark', false));
push(...hedgeRun(-33, -25, -33, -47));
push(...fenceRun(-33, -25, -17, -25));
push(...car(-20, -30, Math.PI / 2, 'vehicle'));
push(...mailbox(-16, -24));
// Grey House (decorative shell, not enterable) -- east side cover
push(box(25, 1.8, -36, 16, 3.6, 20, 'house_grey', true));
push(box(25, 3.9, -36, 17, 0.5, 21, 'roof_dark', false));
push(...hedgeRun(33, -25, 33, -47));
push(...fenceRun(33, -25, 17, -25));
push(...car(20, -30, -Math.PI / 2, 'vehicle_alt'));
push(...mailbox(16, -24));
// long flank corridors along the outer edges, spawn to back alley
push(floor(-45, 0.01, -20, 8, 108, 'sidewalk', false));
push(floor(45, 0.01, -20, 8, 108, 'sidewalk', false));

// ---- Site A: Oak House (east, indoor + loft) ----
const OH = { x0: 18, x1: 44, z0: -13, z1: 13 };
push(floor((OH.x0 + OH.x1) / 2, 0.01, (OH.z0 + OH.z1) / 2, OH.x1 - OH.x0, OH.z1 - OH.z0, 'floor_wood', false));
push(box((OH.x0 + OH.x1) / 2, 3.6, (OH.z0 + OH.z1) / 2, (OH.x1 - OH.x0) + 1, 0.5, (OH.z1 - OH.z0) + 1, 'roof_dark', false));
// perimeter: south wall (front door gap 22..27), east wall (garage gap z8..13), north wall (flank gap x20..25), west wall solid
push(wallSeg(18, -13, 22, -13, WALL_H, 0, 0.3, 'house_wall'));
push(wallSeg(27, -13, 44, -13, WALL_H, 0, 0.3, 'house_wall'));
push(wallSeg(44, -13, 44, 8, WALL_H, 0, 0.3, 'house_wall'));
push(wallSeg(44, 13, 44, 13, WALL_H, 0, 0.3, 'house_wall')); // corner stub (kept tiny; real gap is the 8..13 span left open)
push(wallSeg(18, 13, 20, 13, WALL_H, 0, 0.3, 'house_wall'));
push(wallSeg(25, 13, 44, 13, WALL_H, 0, 0.3, 'house_wall'));
push(wallSeg(18, -13, 18, 13, WALL_H, 0, 0.3, 'house_wall'));
// interior dividers
push(wallSeg(32, -13, 32, -9, WALL_H, 0, 0.2, 'house_wall_int')); // living/kitchen divider, gap z-9..-3
push(wallSeg(32, -3, 32, 3, WALL_H, 0, 0.2, 'house_wall_int'));
push(wallSeg(18, 3, 20, 3, WALL_H, 0, 0.2, 'house_wall_int')); // hallway divider, gaps x20-26 & x36-42
push(wallSeg(26, 3, 36, 3, WALL_H, 0, 0.2, 'house_wall_int'));
push(wallSeg(42, 3, 44, 3, WALL_H, 0, 0.2, 'house_wall_int'));
push(wallSeg(18, 6, 20, 6, WALL_H, 0, 0.2, 'house_wall_int')); // back divider, gaps x20-26 & x34-40
push(wallSeg(26, 6, 34, 6, WALL_H, 0, 0.2, 'house_wall_int'));
push(wallSeg(40, 6, 44, 6, WALL_H, 0, 0.2, 'house_wall_int'));
// furniture -- living room (plant zone)
push(...couch(23, -10, Math.PI));
push(...coffeeTable(23, -7.5));
push(...tvStand(29.5, -12.3));
push(...bookshelf(19.3, -3.5, Math.PI / 2, 2.2));
// kitchen
push(...kitchenCounter(43, -3.5, 6, Math.PI / 2));
push(...kitchenIsland(37, -8));
push(...fridge(43, -11.5));
push(...stove(38.5, -11.7));
push(...diningTable(37, -3.5));
// back room -- bedroom (west) + garage (east), one open space
push(...bed(22, 9.5));
push(...nightstand(19.5, 11.5));
push(...wardrobe(29, 12.3));
push(...car(37, 9.5, 0, 'vehicle_garage'));
push(box(43.9, 1.1, 9.5, 0.2, 2.2, 5, 'garage_door', false));
// loft over the west half of the living room, reached from the hallway
const loftStair = stairsRise(22, 4, 0, -1, LOFT_Y, 8, 1.2, 'stair', 0);
push(...loftStair.boxes);
push(floor(24, LOFT_Y, -8, 12, 10, 'loft_floor', true));
push(...bed(21, -6, Math.PI / 2));
push(box(24, LOFT_Y + 0.55, -3.1, 12, 1.1, 0.15, 'railing', false));
push(siteZone(23, -8, 8, 'A', 'Oak House'));

// ---- Site B: Birch House + Patio (west) ----
const BH = { x0: -42, x1: -26, z0: -13, z1: 7 };
push(floor((BH.x0 + BH.x1) / 2, 0.01, (BH.z0 + BH.z1) / 2, BH.x1 - BH.x0, BH.z1 - BH.z0, 'floor_wood', false));
push(box((BH.x0 + BH.x1) / 2, 3.6, (BH.z0 + BH.z1) / 2, (BH.x1 - BH.x0) + 1, 0.5, (BH.z1 - BH.z0) + 1, 'roof_dark', false));
push(box(-34, 2.6, -14.5, 18, 0.15, 3, 'porch_roof', false));
push(pillar(-40.5, -14.5, 2.6, 0.15, 'porch_post'));
push(pillar(-27.5, -14.5, 2.6, 0.15, 'porch_post'));
// perimeter: south (front door gap -36..-31), north (patio door gap -36..-31), east & west solid
push(wallSeg(-42, -13, -36, -13, WALL_H, 0, 0.3, 'house_wall'));
push(wallSeg(-31, -13, -26, -13, WALL_H, 0, 0.3, 'house_wall'));
push(wallSeg(-26, -13, -26, 7, WALL_H, 0, 0.3, 'house_wall'));
push(wallSeg(-42, -13, -42, 7, WALL_H, 0, 0.3, 'house_wall'));
push(wallSeg(-42, 7, -36, 7, WALL_H, 0, 0.3, 'house_wall'));
push(wallSeg(-31, 7, -26, 7, WALL_H, 0, 0.3, 'house_wall'));
// interior divider: living/dining (front) vs bedroom (back), doorway gap x-38..-33
push(wallSeg(-42, -3, -38, -3, WALL_H, 0, 0.2, 'house_wall_int'));
push(wallSeg(-33, -3, -26, -3, WALL_H, 0, 0.2, 'house_wall_int'));
push(...couch(-38, -9, 0));
push(...coffeeTable(-38, -6.8));
push(...tvStand(-38, -12.2));
push(...kitchenCounter(-28.5, -9, 5, Math.PI / 2));
push(...diningTable(-32, -5.5));
push(...bed(-33, 2, Math.PI / 2));
push(...wardrobe(-40, 4.5));
// patio (outdoor, the actual plant zone)
push(floor(-30, 0.01, 11, 24, 8, 'patio_floor', false));
push(...fenceRun(-42, 7, -42, 9)); push(...fenceRun(-42, 14, -42, 15)); // west fence, gate gap z9..14
push(...fenceRun(-42, 15, -32, 15)); push(...fenceRun(-27, 15, -18, 15)); // north fence, gate gap x-32..-27
push(...fenceRun(-18, 7, -18, 15)); // east fence (open toward mid-corridor otherwise)
push(...patioTable(-34, 11));
push(...bbqGrill(-22, 9, Math.PI / 4));
push(...hedgeRun(-18, 7, -26, 7)); // low hedge softening the house/patio seam, non-blocking gap kept at door
push(siteZone(-30, 11, 8, 'B', 'Backyard Patio'));

// west alley: long flank corridor from spawn through mid street up into the
// patio's west gate, continuing to the back alley
push(floor(-42, 0.01, -20, 8, 4, 'sidewalk', false));

// ---- Back Alley (rotation corridor behind both sites) ----
push(floor(0, 0.01, 25, 100, 20, 'street', false));
push(...fenceRun(-50, 34, -8, 34));
push(...fenceRun(8, 34, 50, 34));

// ---- Defender Spawn (cul-de-sac) ----
push(floor(0, 0.01, 47, 46, 18, 'road', false));
push(...hedgeRun(-23, 56, 23, 56));
push(...hedgeRun(-23, 38, -23, 56));
push(...hedgeRun(23, 38, 23, 56));
push(...hedgeRun(-23, 38, -5, 38));
push(...hedgeRun(5, 38, 23, 38));
push(box(-15, 1.6, 50, 6, 3.2, 8, 'house_grey', true));
push(box(15, 1.6, 50, 6, 3.2, 8, 'house_yellow', true));

// Full perimeter enclosure -- prevents players from wandering off the
// playable area's edges (sidewalks/hedges only cover parts of the
// perimeter; without this a player can walk past them into open void).
push(...fenceRun(-52, -80, 52, -80, 6));
push(...fenceRun(-52, 60, 52, 60, 6));
push(...fenceRun(-52, -80, -52, 60, 6));
push(...fenceRun(52, -80, 52, 60, 6));

export const MAPLE_HOLLOW = {
  id: 'maple_hollow',
  name: 'Maple Hollow',
  theme: 'Suburban neighborhood',
  bounds: { minX: -52, maxX: 52, minZ: -80, maxZ: 60 },
  geometry: g,
  sites: g.filter((o) => o.kind === 'site'),
  spawns: {
    A: [spawnPoint(-16, -70, Math.PI), spawnPoint(-6, -70, Math.PI), spawnPoint(6, -70, Math.PI), spawnPoint(16, -70, Math.PI), spawnPoint(0, -74, Math.PI)],
    B: [spawnPoint(-12, 51, 0), spawnPoint(-4, 51, 0), spawnPoint(4, 51, 0), spawnPoint(12, 51, 0), spawnPoint(0, 54, 0)],
  },
  callouts: [
    callout(0, -68, 'Park'), callout(-25, -36, 'Yellow House'), callout(25, -36, 'Grey House'),
    callout(-45, -20, 'West Alley'), callout(45, -20, 'East Alley'), callout(23, -8, 'Oak House Living Room'),
    callout(37, -6, 'Oak House Kitchen'), callout(35, 9.5, 'Garage'), callout(24, -8, 'Loft'),
    callout(-38, -9, 'Birch House'), callout(-30, 11, 'Backyard Patio'), callout(0, 25, 'Back Alley'),
  ],
};
