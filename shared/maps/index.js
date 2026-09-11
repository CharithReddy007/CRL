import { IRON_YARD } from './ironyard.js';
import { NEON_DISTRICT } from './neondistrict.js';
import { DESERT_RELAY } from './desertrelay.js';
import { MAPLE_HOLLOW } from './maplehollow.js';

export const MAP_LIST = [IRON_YARD, NEON_DISTRICT, DESERT_RELAY, MAPLE_HOLLOW];

export const MAPS_BY_ID = Object.fromEntries(MAP_LIST.map(m => [m.id, m]));

export { IRON_YARD, NEON_DISTRICT, DESERT_RELAY, MAPLE_HOLLOW };
