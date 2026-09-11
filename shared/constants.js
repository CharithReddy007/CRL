// Core tuning constants shared by server sim and client prediction.

export const TICK_RATE = 30;
export const TICK_MS = 1000 / TICK_RATE;

export const MAX_PLAYERS = 10;
export const MIN_PLAYERS = 2;

export const PLAYER_MAX_HP = 100;
export const PLAYER_RADIUS = 0.4;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_CROUCH_HEIGHT = 1.1;
export const PLAYER_EYE_HEIGHT = 1.62;
export const PLAYER_CROUCH_EYE_HEIGHT = 0.95;

export const WALK_SPEED = 5.4;
export const CROUCH_SPEED = 2.7;
export const GRAVITY = 24;
export const JUMP_SPEED = 8.2;

export const ARMOR_LIGHT = { cost: 400, absorb: 0.5, max: 50 };
export const ARMOR_HEAVY = { cost: 900, absorb: 0.66, max: 100 };

export const ROUND_TIME_SEC = 100;
export const BUY_TIME_SEC = 30;
export const POST_PLANT_TIME_SEC = 45;
export const ROUND_END_TIME_SEC = 6;
export const PLANT_TIME_SEC = 3.5;
export const DEFUSE_TIME_SEC = 6.5;
export const DEFUSE_TIME_HALF_SEC = 3.5; // with defuse kit (future-proof, unused v1)

export const ROUNDS_TO_WIN = 7;
export const MAX_ROUNDS = 13;
export const SIDE_SWAP_ROUND = 6;
export const OVERTIME_ROUNDS_TO_WIN = 2;

export const START_CREDITS = 800;
export const MAX_CREDITS = 9000;
export const CREDIT_ROUND_WIN = 3000;
export const CREDIT_ROUND_LOSS_BASE = 1400;
export const CREDIT_LOSS_STREAK_BONUS = 500;
export const CREDIT_KILL = 200;
export const CREDIT_PLANT = 300;
export const CREDIT_DEFUSE = 300;

export const TEAM_A = 'A'; // Attackers
export const TEAM_B = 'B'; // Defenders

export const MATCH_SIZES = [1, 2, 3, 4, 5];

export const MAPS = ['iron_yard', 'neon_district', 'desert_relay'];

export const HITBOX = {
  HEAD: 'head',
  BODY: 'body',
  LIMB: 'limb',
};

export const HEADSHOT_MULTIPLIER_DEFAULT = 2.0;
export const LIMB_MULTIPLIER_DEFAULT = 0.8;
