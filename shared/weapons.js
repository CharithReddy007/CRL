// Original weapon roster for CRL. All names/stats are original designs.
// damage: base damage to unarmored body at close range
// falloff: [{ range, damage }] piecewise falloff, range in meters
// fireRateRpm: rounds per minute (full auto) or per-burst timing for burst weapons
// magSize / reserveMax: ammo
// reloadMs: full reload time
// recoil: { vertical, horizontal, recover } arbitrary units used by client recoil pattern
// spread: { base, moving, jumping, ads } hip/ads bloom in degrees
// headMult / limbMult: damage multipliers
// wallPen: bullet penetration power through thin cover (0-1)
// fireMode: 'auto' | 'semi' | 'burst'
// burstCount: shots per burst for burst weapons

export const WEAPON_CLASSES = {
  PISTOL: 'pistol',
  SMG: 'smg',
  RIFLE: 'rifle',
  SHOTGUN: 'shotgun',
  SNIPER: 'sniper',
  HEAVY: 'heavy',
  MELEE: 'melee',
};

export const WEAPONS = {
  // ---- Pistols ----
  P10: {
    id: 'P10', name: 'Wisp', class: WEAPON_CLASSES.PISTOL, cost: 0,
    damage: 26, falloff: [{ range: 15, damage: 22 }, { range: 30, damage: 18 }],
    fireRateRpm: 420, fireMode: 'semi', magSize: 12, reserveMax: 36, reloadMs: 1400,
    headMult: 2.0, limbMult: 0.75, spread: { base: 1.6, moving: 3.2, jumping: 6, ads: 0.7 },
    recoil: { vertical: 1.1, horizontal: 0.3, recover: 8 }, range: 40, wallPen: 0.2,
  },
  P25: {
    id: 'P25', name: 'Halberd', class: WEAPON_CLASSES.PISTOL, cost: 300,
    damage: 42, falloff: [{ range: 12, damage: 34 }, { range: 25, damage: 26 }],
    fireRateRpm: 300, fireMode: 'semi', magSize: 7, reserveMax: 28, reloadMs: 1550,
    headMult: 2.3, limbMult: 0.75, spread: { base: 2.0, moving: 4.0, jumping: 7, ads: 0.9 },
    recoil: { vertical: 2.2, horizontal: 0.6, recover: 6 }, range: 40, wallPen: 0.35,
  },
  P50B: {
    id: 'P50B', name: 'Skiff', class: WEAPON_CLASSES.PISTOL, cost: 200,
    damage: 22, falloff: [{ range: 15, damage: 18 }],
    fireRateRpm: 600, fireMode: 'burst', burstCount: 3, magSize: 15, reserveMax: 45, reloadMs: 1450,
    headMult: 2.0, limbMult: 0.75, spread: { base: 1.8, moving: 3.6, jumping: 6.5, ads: 0.8 },
    recoil: { vertical: 1.4, horizontal: 0.5, recover: 9 }, range: 35, wallPen: 0.2,
  },

  // ---- SMGs ----
  R9C: {
    id: 'R9C', name: 'Ferret', class: WEAPON_CLASSES.SMG, cost: 1000,
    damage: 24, falloff: [{ range: 10, damage: 20 }, { range: 20, damage: 15 }],
    fireRateRpm: 900, fireMode: 'auto', magSize: 30, reserveMax: 90, reloadMs: 1900,
    headMult: 2.0, limbMult: 0.75, spread: { base: 1.4, moving: 2.4, jumping: 5.5, ads: 0.6 },
    recoil: { vertical: 1.0, horizontal: 0.5, recover: 11 }, range: 30, wallPen: 0.25,
  },
  T14: {
    id: 'T14', name: 'Vantage-SM', class: WEAPON_CLASSES.SMG, cost: 1500,
    damage: 27, falloff: [{ range: 12, damage: 22 }, { range: 24, damage: 17 }],
    fireRateRpm: 800, fireMode: 'auto', magSize: 25, reserveMax: 75, reloadMs: 2000,
    headMult: 2.0, limbMult: 0.75, spread: { base: 1.2, moving: 2.0, jumping: 5, ads: 0.5 },
    recoil: { vertical: 1.2, horizontal: 0.4, recover: 10 }, range: 32, wallPen: 0.3,
  },

  // ---- Rifles ----
  AR7: {
    id: 'AR7', name: 'Sentinel', class: WEAPON_CLASSES.RIFLE, cost: 2500,
    damage: 39, falloff: [{ range: 20, damage: 33 }, { range: 40, damage: 27 }],
    fireRateRpm: 660, fireMode: 'auto', magSize: 30, reserveMax: 90, reloadMs: 2300,
    headMult: 2.0, limbMult: 0.75, spread: { base: 0.9, moving: 3.5, jumping: 7, ads: 0.25 },
    recoil: { vertical: 2.0, horizontal: 0.5, recover: 9 }, range: 60, wallPen: 0.45,
  },
  BR3: {
    id: 'BR3', name: 'Cadence', class: WEAPON_CLASSES.RIFLE, cost: 2900,
    damage: 35, falloff: [{ range: 20, damage: 30 }, { range: 40, damage: 25 }],
    fireRateRpm: 630, fireMode: 'burst', burstCount: 3, magSize: 30, reserveMax: 90, reloadMs: 2200,
    headMult: 2.1, limbMult: 0.75, spread: { base: 0.7, moving: 3.2, jumping: 6.5, ads: 0.2 },
    recoil: { vertical: 1.6, horizontal: 0.4, recover: 10 }, range: 60, wallPen: 0.45,
  },
  MR8: {
    id: 'MR8', name: 'Longshore', class: WEAPON_CLASSES.RIFLE, cost: 3300,
    damage: 48, falloff: [{ range: 25, damage: 42 }, { range: 50, damage: 34 }],
    fireRateRpm: 480, fireMode: 'semi', magSize: 25, reserveMax: 75, reloadMs: 2500,
    headMult: 2.3, limbMult: 0.75, spread: { base: 0.5, moving: 3.6, jumping: 7.5, ads: 0.15 },
    recoil: { vertical: 2.6, horizontal: 0.5, recover: 8 }, range: 70, wallPen: 0.55,
  },

  // ---- Shotguns ----
  SG2: {
    id: 'SG2', name: 'Bastion-12', class: WEAPON_CLASSES.SHOTGUN, cost: 1100,
    damage: 13, pellets: 9, falloff: [{ range: 6, damage: 9 }, { range: 12, damage: 4 }],
    fireRateRpm: 70, fireMode: 'semi', magSize: 7, reserveMax: 21, reloadMs: 500, reloadPerShell: true,
    headMult: 2.0, limbMult: 0.8, spread: { base: 6, moving: 8, jumping: 12, ads: 4.5 },
    recoil: { vertical: 3.5, horizontal: 1.0, recover: 6 }, range: 15, wallPen: 0.1,
  },
  SG9A: {
    id: 'SG9A', name: 'Riptide', class: WEAPON_CLASSES.SHOTGUN, cost: 2000,
    damage: 11, pellets: 8, falloff: [{ range: 5, damage: 8 }, { range: 10, damage: 4 }],
    fireRateRpm: 220, fireMode: 'auto', magSize: 12, reserveMax: 36, reloadMs: 2600,
    headMult: 2.0, limbMult: 0.8, spread: { base: 7, moving: 9, jumping: 13, ads: 5.5 },
    recoil: { vertical: 2.6, horizontal: 0.9, recover: 7 }, range: 13, wallPen: 0.1,
  },

  // ---- Snipers ----
  DR5: {
    id: 'DR5', name: 'Marksman-5', class: WEAPON_CLASSES.SNIPER, cost: 2050,
    damage: 78, falloff: [{ range: 40, damage: 68 }, { range: 80, damage: 58 }],
    fireRateRpm: 200, fireMode: 'semi', magSize: 5, reserveMax: 20, reloadMs: 2600,
    headMult: 2.8, limbMult: 0.8, spread: { base: 0.4, moving: 5, jumping: 9, ads: 0.02 },
    recoil: { vertical: 4.5, horizontal: 0.6, recover: 5 }, range: 100, wallPen: 0.6, scoped: true, zoomFov: 35,
  },
  AM50: {
    id: 'AM50', name: 'Executor', class: WEAPON_CLASSES.SNIPER, cost: 4700,
    damage: 148, falloff: [],
    fireRateRpm: 75, fireMode: 'semi', magSize: 5, reserveMax: 15, reloadMs: 3200,
    headMult: 1.5, limbMult: 0.85, spread: { base: 0.2, moving: 6, jumping: 10, ads: 0.01 },
    recoil: { vertical: 7, horizontal: 1.2, recover: 4 }, range: 120, wallPen: 0.85, scoped: true, zoomFov: 22, oneShotBody: true,
  },

  // ---- Heavy ----
  LM6: {
    id: 'LM6', name: 'Foreman', class: WEAPON_CLASSES.HEAVY, cost: 3400,
    damage: 38, falloff: [{ range: 25, damage: 32 }, { range: 50, damage: 28 }],
    fireRateRpm: 720, fireMode: 'auto', magSize: 60, reserveMax: 120, reloadMs: 3800,
    headMult: 2.0, limbMult: 0.75, spread: { base: 1.4, moving: 4.5, jumping: 8, ads: 0.5 },
    recoil: { vertical: 2.4, horizontal: 0.8, recover: 7 }, range: 55, wallPen: 0.5,
  },

  // ---- Melee ----
  BLADE: {
    id: 'BLADE', name: 'Fieldknife', class: WEAPON_CLASSES.MELEE, cost: 0,
    damage: 50, range: 1.6, fireRateRpm: 150, fireMode: 'semi',
    headMult: 2.0, limbMult: 1.0, backstabMult: 3.0,
  },
};

export const DEFAULT_LOADOUT = { primary: null, secondary: 'P10', melee: 'BLADE' };

export function getWeapon(id) {
  return WEAPONS[id] || null;
}

export function damageAtRange(weapon, distance) {
  if (!weapon.falloff || weapon.falloff.length === 0) return weapon.damage;
  let dmg = weapon.damage;
  for (const step of weapon.falloff) {
    if (distance >= step.range) dmg = step.damage;
  }
  return dmg;
}
