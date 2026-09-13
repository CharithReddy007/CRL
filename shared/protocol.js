// WebSocket message type constants shared by client and server.
// Every message is JSON: { t: TYPE, ...payload }

export const C2S = {
  CREATE_ROOM: 'create_room',
  JOIN_ROOM: 'join_room',
  SET_TEAM: 'set_team',
  SET_NAME: 'set_name',
  SET_READY: 'set_ready',
  SET_MAP: 'set_map',
  START_MATCH: 'start_match',
  INPUT: 'input',
  FIRE: 'fire',
  RELOAD: 'reload',
  SWITCH_WEAPON: 'switch_weapon',
  INTERACT_START: 'interact_start',
  INTERACT_STOP: 'interact_stop',
  BUY: 'buy',
  SELL: 'sell',
  SPECTATE_TARGET: 'spectate_target',
  CHAT: 'chat',
  LEAVE: 'leave',
};

export const S2C = {
  ROOM_STATE: 'room_state',
  ERROR: 'error',
  MATCH_START: 'match_start',
  SNAPSHOT: 'snapshot',
  HIT: 'hit',
  KILL: 'kill',
  DAMAGE: 'damage',
  ROUND_STATE: 'round_state',
  ROUND_END: 'round_end',
  MATCH_END: 'match_end',
  CORE_STATE: 'core_state',
  ECONOMY: 'economy',
  CHAT: 'chat',
  SOUND: 'sound',
  PONG: 'pong',
};

export const ROUND_PHASE = {
  WARMUP: 'warmup',
  BUY: 'buy',
  COMBAT: 'combat',
  POST_PLANT: 'post_plant',
  ROUND_END: 'round_end',
  MATCH_END: 'match_end',
};
