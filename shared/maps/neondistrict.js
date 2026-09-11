// NEON DISTRICT — dense futuristic urban district at night.
// Vertical & close-to-medium range. Z runs south (attackers) -> north (defenders).
//   Z -65..-52  Attacker Spawn (street plaza)
//   Z -52..-14  Main Street + side alleys + rooftop route
//   Z -14.. +12 Site row: Site A Transit Hub (underground, west) / Site B Skyline Plaza (rooftop, east)
//   Z +12..+30  Back streets (rotation)
//   Z +30..+50  Defender Spawn
import { box, wallSeg, floor, groundPlane, crate, pillar, stairs, stairsRise, siteZone, spawnPoint, callout } from '../mapkit.js';
import { desk, officeChair, lockerRow, monitorOnDesk, shelfUnit } from '../propkit.js';

const g = [];
const push = (...items) => { for (const it of items) g.push(it); };
const ROOF_Y = 8.0; // west rooftop-run height
const PLAZA_Y = 6.2; // Skyline Plaza rooftop height
const PLATFORM_Y = -4.0; // Transit Hub underground platform depth

// base ground, tiled around the Transit Hub pit (x -38..-10, z -6..24) so the
// underground station is a real hole rather than covered by a solid ceiling
push(groundPlane(-40, 0, -10, 4, 130, 'ground')); // west strip
push(groundPlane(16, 0, -10, 52, 130, 'ground')); // east strip
push(groundPlane(-24, 0, -40.5, 28, 69, 'ground')); // south strip (of pit's x-range)
push(groundPlane(-24, 0, 39.5, 28, 31, 'ground')); // north strip (of pit's x-range)

// ---- Attacker Spawn ----
push(floor(0, 0.01, -58, 44, 16, 'spawn_pad', false));
push(wallSeg(-22, -66, 22, -66, 6, 0, 1, 'wall'));
push(wallSeg(-22, -66, -22, -52, 6, 0, 1, 'wall'));
push(wallSeg(22, -66, 22, -52, 6, 0, 1, 'wall'));
push(wallSeg(-22, -52, -8, -52, 6, 0, 1, 'wall'));
push(wallSeg(8, -52, 22, -52, 6, 0, 1, 'wall'));
push(box(-16, 3, -60, 0.6, 6, 8, 'neon_sign', false), box(16, 3, -60, 0.6, 6, 8, 'neon_sign', false));

// ---- Main Street + alleys ----
push(floor(0, 0.01, -32, 40, 40, 'street', false));
// street-front buildings (west row / east row) leaving street open through middle, alleys behind
push(box(-16, 4, -46, 8, 8, 6, 'building', true));
push(box(16, 4, -44, 8, 8, 8, 'building', true)); push(box(16, 4, -20, 8, 8, 8, 'building', true));
// enterable corner shop (was a solid decorative building) -- x -20..-12, z -29..-19
push(wallSeg(-20, -29, -20, -19, 3, 5, 0.4, 'building')); // west wall (upper 3m; the alley_wall below already covers y0-5 at this x)
push(wallSeg(-20, -29, -12, -29, 8, 0, 0.4, 'building')); // north wall
push(wallSeg(-20, -19, -12, -19, 8, 0, 0.4, 'building')); // south wall
push(wallSeg(-12, -29, -12, -25, 8, 0, 0.4, 'building')); // east wall, door gap z-25..-22
push(wallSeg(-12, -22, -12, -19, 8, 0, 0.4, 'building'));
push(box(-16, 7.85, -24, 9, 0.3, 11, 'rooftop', false));
push(floor(-16, 0.01, -24, 8, 10, 'building_block', false));
push(...shelfUnit(-18, -28.7, 0, 3, 3));
push(...shelfUnit(-14, -28.7, 0, 3, 3));
push(...desk(-14.5, -22, Math.PI));
push(...officeChair(-14.5, -23.3, 0));
push(wallSeg(-20, -52, -20, -14, 5, 0, 0.6, 'alley_wall')); // west alley outer wall
push(wallSeg(20, -52, 20, -14, 5, 0, 0.6, 'alley_wall')); // east alley outer wall
push(crate(-10, 0, -40, 1.4), crate(9, 0, -36, 1.4), crate(-6, 0, -20, 1.4), crate(6, 0, -26, 1.4));
push(pillar(-3, -32, 5, 0.4), pillar(3, -32, 5, 0.4));

// rooftop route: a west-side elevated flank/sniper perch overlooking the
// street and alley (single-access dead end, reached via its own stair).
// offset from x=-20 so it clears the street-front building at x -20..-12.
const roofStair = stairsRise(-23, -50, 0, 1, ROOF_Y, 13, 3, 'stair', 0);
push(...roofStair.boxes);
push(box(-23.5, ROOF_Y - 0.15, -26, 13, 0.3, 24, 'rooftop', true)); // x -30..-17, z -38..-14, meets stair top with margin

// underground entrance down to Transit Hub, from street
const stationStair = stairsRise(-24, -5, 0, -1, -PLATFORM_Y, 13, 4, 'stair_down', PLATFORM_Y);
push(...stationStair.boxes);

// ---- Site A: Transit Hub (underground, west) ----
push(floor(-24, PLATFORM_Y - 0.01, 10, 28, 30, 'platform'));
push(wallSeg(-38, -6, -38, 24, 6, PLATFORM_Y, 1, 'wall'));
push(wallSeg(-10, -6, -10, 24, 6, PLATFORM_Y, 1, 'wall'));
// south wall: gap x -26..-22 is the main stair entrance
push(wallSeg(-38, -6, -26, -6, 6, PLATFORM_Y, 1, 'wall'));
push(wallSeg(-22, -6, -10, -6, 6, PLATFORM_Y, 1, 'wall'));
push(wallSeg(-38, 24, -20, 24, 6, PLATFORM_Y, 1, 'wall')); // north wall part; gap x -20..-10 is the back-street entrance
push(box(-24, PLATFORM_Y + 1.2, 10, 22, 1.4, 3, 'track', true)); // track/platform edge cover
push(crate(-32, PLATFORM_Y, 4, 1.6), crate(-16, PLATFORM_Y, 16, 1.6), crate(-30, PLATFORM_Y, 18, 1.6));
push(box(-24, PLATFORM_Y + 3, 4, 0.8, 6, 0.8, 'pillar', true), box(-24, PLATFORM_Y + 3, 16, 0.8, 6, 0.8, 'pillar', true));
// second entrance from back streets
const stationStair2 = stairsRise(-16, 20, 0, 1, -PLATFORM_Y, 10, 4, 'stair_down', PLATFORM_Y);
push(...stationStair2.boxes);
push(siteZone(-24, 10, 10, 'A', 'Transit Hub', PLATFORM_Y, 3));

// ---- Site B: Skyline Plaza (rooftop, east) ----
// building mass supporting the roof, split into two tiles leaving an open
// stairwell shaft (x 11..27, z -9..-3) for the interior stairs below.
const BLOCK_H = PLAZA_Y - 0.15;
push(box(24, BLOCK_H / 2, 7, 26, BLOCK_H, 20, 'building_block', true)); // north tile, z -3..17
push(box(32, BLOCK_H / 2, -6, 10, BLOCK_H, 6, 'building_block', true)); // south-east tile, z -9..-3
// rooftop_plaza floor, tiled with a matching hole above the stairwell shaft
// so there's real headroom climbing out of it (not just a blocked ceiling)
push(floor(24, PLAZA_Y, 7.5, 28, 21, 'rooftop_plaza')); // north tile, z -3..18
push(floor(32.5, PLAZA_Y, -6.5, 11, 7, 'rooftop_plaza')); // south-east tile, z -10..-3
push(wallSeg(10, -8, 10, 18, 3, PLAZA_Y, 0.4, 'ledge'));
push(wallSeg(38, -8, 38, 8, 3, PLAZA_Y, 0.4, 'ledge')); // east ledge, gap z 8..16 for fire escape landing
push(wallSeg(38, 16, 38, 18, 3, PLAZA_Y, 0.4, 'ledge'));
push(wallSeg(10, 18, 38, 18, 3, PLAZA_Y, 0.4, 'ledge'));
push(crate(18, PLAZA_Y, 10, 1.6), crate(30, PLAZA_Y, -2, 1.6), crate(32, PLAZA_Y, 14, 1.6));
push(box(24, PLAZA_Y + 1.35, 4, 4, 2.4, 4, 'hvac', true));
// main interior stairwell up from street, through the open shaft (inside building, south side)
const lobbyStair = stairsRise(10, -6, 1, 0, PLAZA_Y, 16, 3, 'stair', 0);
push(...lobbyStair.boxes);
// exterior fire escape (flank): climbs outside the building's east face, then
// a short landing bridges through the ledge gap onto the roof.
const fireEscape = stairsRise(40, -8, 0, 1, PLAZA_Y, 20, 3, 'stair_fire_escape', 0);
push(...fireEscape.boxes);
push(box(39, PLAZA_Y - 0.15, 12, 3, 0.3, 4, 'catwalk', true)); // landing bridge x 37.5..40.5, z 10..14
push(siteZone(24, 4, 11, 'B', 'Skyline Plaza', PLAZA_Y, 3));

// ---- Back streets (rotation) ----
push(floor(0, 0.01, 28, 84, 18, 'street', false));
push(wallSeg(-42, 20, -20, 20, 5, 0, 0.6, 'wall'));
push(wallSeg(-2, 20, 2, 20, 5, 0, 0.6, 'wall_low', false));
push(wallSeg(20, 20, 42, 20, 5, 0, 0.6, 'wall'));
push(wallSeg(-42, 36, 42, 36, 5, 0, 0.6, 'wall'));
push(box(0, 1.5, 28, 4, 3, 4, 'building', true));
push(crate(-12, 0, 30, 1.4), crate(12, 0, 26, 1.4));

// ---- Defender Spawn ----
push(floor(0, 0.01, 45, 40, 16, 'spawn_pad', false));
push(wallSeg(-20, 53, 20, 53, 6, 0, 1, 'wall'));
push(wallSeg(-20, 37, -20, 53, 6, 0, 1, 'wall'));
push(wallSeg(20, 37, 20, 53, 6, 0, 1, 'wall'));
push(wallSeg(-20, 37, -6, 37, 6, 0, 1, 'wall'));
push(wallSeg(6, 37, 20, 37, 6, 0, 1, 'wall'));
// guard booth, tucked against the existing west outer wall (x=-20)
push(wallSeg(-14, 39, -14, 41.5, 3, 0, 0.2, 'office_wall')); // east wall, door gap z41.5..44.5
push(wallSeg(-14, 44.5, -14, 46, 3, 0, 0.2, 'office_wall'));
push(wallSeg(-20, 39, -14, 39, 3, 0, 0.2, 'office_wall'));
push(wallSeg(-20, 46, -14, 46, 3, 0, 0.2, 'office_wall'));
push(floor(-17, 0.01, 42.5, 6, 7, 'office_floor', false));
push(...desk(-17, 45, 0));
push(...monitorOnDesk(-17, 45, 0));
push(...officeChair(-17, 43.7, 0));
push(...lockerRow(-17, 39.7, 0, 3, 0.6));

// Full perimeter enclosure -- see the matching comment in ironyard.js.
push(wallSeg(-42, -68, 42, -68, 6, 0, 1, 'wall'));
push(wallSeg(-42, 55, 42, 55, 6, 0, 1, 'wall'));
push(wallSeg(-42, -68, -42, 55, 6, 0, 1, 'wall'));
push(wallSeg(42, -68, 42, 55, 6, 0, 1, 'wall'));

export const NEON_DISTRICT = {
  id: 'neon_district',
  name: 'Neon District',
  theme: 'Futuristic urban night city',
  bounds: { minX: -42, maxX: 42, minZ: -68, maxZ: 55 },
  geometry: g,
  sites: g.filter(o => o.kind === 'site'),
  spawns: {
    A: [spawnPoint(-14, -60, Math.PI), spawnPoint(-4, -60, Math.PI), spawnPoint(4, -60, Math.PI), spawnPoint(14, -60, Math.PI), spawnPoint(0, -64, Math.PI)],
    B: [spawnPoint(-12, 48, 0), spawnPoint(-4, 48, 0), spawnPoint(4, 48, 0), spawnPoint(12, 48, 0), spawnPoint(0, 51, 0)],
  },
  callouts: [
    callout(-16, -35, 'West Alley'), callout(16, -32, 'East Alley'), callout(-14, -25, 'Rooftop Run'),
    callout(-24, -8, 'Station Stairs'), callout(-24, 10, 'Transit Hub'), callout(-24, 4, 'Track'),
    callout(24, 4, 'Skyline Plaza'), callout(38, 4, 'Fire Escape'), callout(10, -6, 'Lobby Stairs'),
    callout(0, 28, 'Back Street'),
  ],
};
