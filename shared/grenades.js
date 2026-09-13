// Throwable utility: frag (damage) and smoke (vision-blocking). Kept in
// their own table rather than WEAPONS since they're consumable (owned as a
// count, not a single equipped item) and thrown rather than fired.
export const GRENADE_CLASSES = { FRAG: 'frag', SMOKE: 'smoke' };

export const GRENADES = {
  FRAG1: {
    id: 'FRAG1', name: 'Ember', class: GRENADE_CLASSES.FRAG, cost: 400, maxCarry: 2,
    fuseMs: 1600, throwSpeed: 22, damage: 110, radius: 5.5,
  },
  SMOKE1: {
    id: 'SMOKE1', name: 'Haze', class: GRENADE_CLASSES.SMOKE, cost: 300, maxCarry: 1,
    fuseMs: 1200, throwSpeed: 20, smokeDurationMs: 14000, radius: 4.5,
  },
};

export function getGrenade(id) {
  return GRENADES[id] || null;
}

// Linear falloff from full damage at the epicenter to ~15% at the edge of
// the radius; no wall/line-of-sight occlusion check in this first pass.
export function fragDamageAt(grenade, distance) {
  if (distance >= grenade.radius) return 0;
  const falloff = 1 - (distance / grenade.radius) * 0.85;
  return Math.round(grenade.damage * Math.max(0, falloff));
}
