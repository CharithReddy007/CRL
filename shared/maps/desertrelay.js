// DESERT RELAY — remote communications facility in open desert.
// Large & spacious but never empty: rock formations, trenches and bunkers
// give constant cover options. Z runs south (attackers) -> north (defenders).
//   Z -80..-62  Attacker Spawn (canyon entrance)
//   Z -62..-18  Open desert mid (rocks, trench, radar landmark, tunnel branch)
//   Z -18.. +16 Site row: Site A Communications Core (west) / Site B Solar Array (east)
//   Z +16..+36  Rotation trenches
//   Z +36..+58  Defender Spawn
import { box, wallSeg, floor, groundPlane, crate, pillar, stairsRise, siteZone, spawnPoint, callout } from '../mapkit.js';

const g = [];
const push = (...items) => { for (const it of items) g.push(it); };
const TUNNEL_Y = -3.5;

// base ground, tiled around the tunnel corridor (x -41..-35, z -59..-9) so
// it's a real underground passage rather than covered by a solid ceiling
push(groundPlane(-48, 0, -10, 14, 150, 'sand')); // west of tunnel
push(groundPlane(10, 0, -10, 90, 150, 'sand')); // east of tunnel
push(floor(-38, 0, 27, 6, 76, 'sand')); // north of tunnel (within its x-range), overlaps stair top at z=-10
push(floor(-38, 0, -71, 6, 28, 'sand')); // south of tunnel (within its x-range), overlaps stair top at z=-58

// ---- Attacker Spawn (canyon) ----
push(floor(0, 0.01, -70, 46, 16, 'spawn_pad', false));
push(box(-26, 4, -74, 6, 8, 20, 'rock', true, { rotY: 0.3 }));
push(box(26, 4, -74, 6, 8, 20, 'rock', true, { rotY: -0.25 }));
push(box(-30, 3, -60, 5, 6, 10, 'rock', true));
push(box(30, 3, -60, 5, 6, 10, 'rock', true));
// tunnel entrance down, west flank: deep end near the tunnel body, climbing
// south to the street-level entrance close to spawn
const tunnelEntrance = stairsRise(-38, -51, 0, -1, -TUNNEL_Y, 7, 4, 'stair_down', TUNNEL_Y);
push(...tunnelEntrance.boxes);

// ---- Open Desert Mid ----
push(floor(0, 0.01, -40, 90, 46, 'sand', false));
push(box(-14, 2.5, -50, 6, 5, 6, 'rock', true)); push(box(16, 2, -46, 7, 4, 7, 'rock', true));
push(box(-22, 1.8, -32, 6, 3.6, 10, 'rock', true)); push(box(24, 1.8, -30, 6, 3.6, 10, 'rock', true));
push(box(0, 2.2, -38, 5, 4.4, 5, 'rock', true, { rotY: 0.6 }));
push(box(-4, 1, -22, 30, 2, 3, 'trench', true)); push(box(-4, 1, -18, 30, 2, 3, 'trench', true));
push(pillar(0, -46, 11, 1, 'radar_mast'));
push(box(0, 8, -46, 8, 0.4, 0.4, 'radar_dish', false));
push(box(8, 1.2, -24, 5, 2.4, 5, 'bunker_small', true)); push(box(-10, 1.2, -46, 5, 2.4, 5, 'bunker_small', true));
// tunnel body, resurfacing inside Site A's back interior
push(floor(-38, TUNNEL_Y - 0.01, -34, 6, 46, 'tunnel_floor'));
push(wallSeg(-41, -50, -41, -22, 4, TUNNEL_Y, 0.6, 'tunnel_wall'));
push(wallSeg(-35, -50, -35, -22, 4, TUNNEL_Y, 0.6, 'tunnel_wall'));
const tunnelExit = stairsRise(-38, -24, 0, 1, -TUNNEL_Y, 14, 4, 'stair_down', TUNNEL_Y);
push(...tunnelExit.boxes);

// ---- Site A: Communications Core (west, fortified bunker) ----
push(floor(-32, 0.01, -2, 30, 30, 'site_floor', false));
push(wallSeg(-47, -16, -47, 12, 6, 0, 1, 'bunker_wall'));
push(wallSeg(-17, -16, -17, 12, 6, 0, 1, 'bunker_wall'));
// south wall: gap x -40..-36 is the tunnel flank's exit into the site
push(wallSeg(-47, -16, -40, -16, 6, 0, 1, 'bunker_wall'));
push(wallSeg(-36, -16, -17, -16, 6, 0, 1, 'bunker_wall'));
push(wallSeg(-47, 12, -30, 12, 6, 0, 1, 'bunker_wall')); // north wall part, gap for rotation link
push(box(-32, 1.2, -2, 8, 2.4, 8, 'server_block', true)); // interior server racks (plant cover, mid-room)
push(crate(-40, 0, -10, 1.8), crate(-24, 0, 4, 1.6), crate(-40, 0, 6, 1.8));
push(pillar(-38, -8, 5, 0.5), pillar(-26, 8, 5, 0.5));
push(siteZone(-32, -2, 10, 'A', 'Communications Core'));

// ---- Site B: Solar Array (east, open outdoor facility) ----
push(floor(32, 0.01, -2, 32, 30, 'sand', false));
push(box(18, 0.9, -14, 10, 0.15, 6, 'solarpanel', true)); push(box(30, 0.9, -14, 10, 0.15, 6, 'solarpanel', true));
push(box(18, 0.9, -2, 10, 0.15, 6, 'solarpanel', true)); push(box(30, 0.9, -2, 10, 0.15, 6, 'solarpanel', true));
push(box(18, 0.9, 10, 10, 0.15, 6, 'solarpanel', true)); push(box(30, 0.9, 10, 10, 0.15, 6, 'solarpanel', true));
push(wallSeg(46, -16, 46, 12, 4, 0, 0.6, 'fence')); // east outer boundary
push(box(24, 1.2, -16, 14, 2.4, 3, 'equipment', true)); // control equipment wall (south entry funnel)
push(box(40, 1.4, 2, 4, 2.8, 8, 'bunker_small', true)); // small equipment bunker cover, east side
push(box(18, 2, 14, 6, 4, 6, 'rock', true)); // rock formation flank cover (north-east route)
push(siteZone(30, -2, 11, 'B', 'Solar Array'));

// ---- Rotation trenches ----
push(floor(0, 0.01, 24, 100, 18, 'sand', false));
push(box(-10, 1, 20, 26, 2, 3, 'trench', true)); push(box(14, 1, 28, 26, 2, 3, 'trench', true));
push(box(-30, 1.6, 22, 5, 3.2, 8, 'rock', true)); push(box(30, 1.6, 26, 5, 3.2, 8, 'rock', true));

// ---- Defender Spawn ----
push(floor(0, 0.01, 48, 46, 18, 'spawn_pad', false));
push(wallSeg(-24, 58, 24, 58, 6, 0, 1, 'wall'));
push(wallSeg(-24, 38, -24, 58, 6, 0, 1, 'wall'));
push(wallSeg(24, 38, 24, 58, 6, 0, 1, 'wall'));
push(wallSeg(-24, 38, -6, 38, 6, 0, 1, 'wall'));
push(wallSeg(6, 38, 24, 38, 6, 0, 1, 'wall'));

// Full perimeter enclosure -- see the matching comment in ironyard.js.
push(wallSeg(-55, -82, 55, -82, 6, 0, 1, 'wall'));
push(wallSeg(-55, 60, 55, 60, 6, 0, 1, 'wall'));
push(wallSeg(-55, -82, -55, 60, 6, 0, 1, 'wall'));
push(wallSeg(55, -82, 55, 60, 6, 0, 1, 'wall'));

export const DESERT_RELAY = {
  id: 'desert_relay',
  name: 'Desert Relay',
  theme: 'Desert communications facility',
  bounds: { minX: -55, maxX: 55, minZ: -82, maxZ: 60 },
  geometry: g,
  sites: g.filter(o => o.kind === 'site'),
  spawns: {
    A: [spawnPoint(-16, -66, Math.PI), spawnPoint(-6, -66, Math.PI), spawnPoint(6, -66, Math.PI), spawnPoint(16, -66, Math.PI), spawnPoint(0, -70, Math.PI)],
    B: [spawnPoint(-14, 52, 0), spawnPoint(-4, 52, 0), spawnPoint(4, 52, 0), spawnPoint(14, 52, 0), spawnPoint(0, 55, 0)],
  },
  callouts: [
    callout(-38, -58, 'Tunnel'), callout(0, -46, 'Radar'), callout(-22, -32, 'West Rocks'),
    callout(24, -30, 'East Rocks'), callout(-4, -20, 'Trench'), callout(-32, -2, 'Comms Core'),
    callout(-40, -10, 'Server Room'), callout(30, -2, 'Solar Array'), callout(18, 14, 'North Rocks'),
    callout(0, 24, 'Back Trench'),
  ],
};
