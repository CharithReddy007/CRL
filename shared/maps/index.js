import { IRON_YARD } from './ironyard.js';
import { NEON_DISTRICT } from './neondistrict.js';
import { DESERT_RELAY } from './desertrelay.js';

export const MAP_LIST = [IRON_YARD, NEON_DISTRICT, DESERT_RELAY];

export const MAPS_BY_ID = Object.fromEntries(MAP_LIST.map(m => [m.id, m]));

export { IRON_YARD, NEON_DISTRICT, DESERT_RELAY };
