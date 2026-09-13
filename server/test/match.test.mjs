import { Match } from '../src/Match.js';
import { IRON_YARD, MAPLE_HOLLOW } from '../../shared/maps/index.js';
import { TICK_RATE, TEAM_A, TEAM_B, ROUND_PHASE, START_CREDITS, CREDIT_ROUND_WIN, WEAPONS, GRENADES } from '../../shared/index.js';

let failures = 0;
function assert(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); failures++; }
  else console.log('ok:', msg);
}

function mockConn(id) {
  const sent = [];
  return { id, sent, socket: { OPEN: 1, readyState: 1, send: (raw) => sent.push(JSON.parse(raw)) } };
}

const broadcasts = [];
const mockRoom = {
  broadcast: (t, payload) => broadcasts.push({ t, payload }),
  sendTo: () => {},
};

const connA = mockConn('a1');
const connB = mockConn('b1');

const match = new Match(mockRoom, IRON_YARD);
const pA = match.addPlayer(connA, TEAM_A, 'Attacker1');
const pB = match.addPlayer(connB, TEAM_B, 'Defender1');

// ---- Start match without real timers: replicate start() manually ----
match.round = 1;
match.tick = 0;
match.resetForRound();
match.phase = ROUND_PHASE.BUY;
match.phaseEndsAtTick = match.tick + 5; // fast-forward buy phase to 5 ticks for test speed

assert(pA.credits === START_CREDITS, 'attacker starts with correct credits');
assert(pA.hasCore === true, 'an attacker holds the core at round start');
assert(pA.team === TEAM_A && match.attackTeam === TEAM_A, 'attack team assigned correctly');

// ---- Buy ----
pA.credits = 9000; // enough for any weapon, isolates the buy logic from starting economy
match.handleBuy(connA.id, 'primary', 'AR7');
assert(pA.weapons.primary === 'AR7', 'buy sets weapon');
assert(pA.credits === 9000 - WEAPONS.AR7.cost, 'buy deducts credits');
assert(pA.ammo.primary.mag === WEAPONS.AR7.magSize, 'buy refills magazine');

// ---- Sell (refund) ----
const creditsBeforeSell = pA.credits;
match.handleSell(connA.id, 'primary');
assert(pA.weapons.primary === null, 'selling a weapon bought this buy phase clears the slot');
assert(pA.credits === creditsBeforeSell + WEAPONS.AR7.cost, 'sell refunds the full purchase price');
assert(pA.boughtThisBuy.primary === false, 'sold slot no longer marked as bought this buy phase');

// exploit guard: the free starting secondary was never bought this buy
// phase, so it must not be sellable for free credits
const startingSecondary = pB.weapons.secondary;
const creditsBeforeExploit = pB.credits;
match.handleSell(connB.id, 'secondary');
assert(pB.weapons.secondary === startingSecondary && pB.credits === creditsBeforeExploit, 'cannot sell the free starting loadout for credits');

pA.credits = 500; // restore a plausible mid-round economy state for the rest of the test

// ---- Advance through buy -> combat ----
for (let i = 0; i < 10; i++) match.step();
assert(match.phase === ROUND_PHASE.COMBAT, 'phase transitions from buy to combat: got ' + match.phase);

// Per spec, killing all defenders before the core is planted is NOT a win
// condition for attackers (only "all defenders eliminated AFTER planting" is)
// -- so the round must still be live.
match.killPlayer(pB, pA, 'test');
match.step();
assert(match.phase === ROUND_PHASE.COMBAT, 'eliminating defenders pre-plant does not end the round: got ' + match.phase);

// The real condition: all attackers eliminated before planting -> defenders win.
const creditsBeforeWin = pB.credits;
match.killPlayer(pA, pB, 'test');
match.step();
assert(match.phase === ROUND_PHASE.ROUND_END, 'round ends when all attackers die before planting');
assert(match.scoreB === 1, 'defender team scored the round');
assert(pB.credits > creditsBeforeWin, 'winning team credited for round win');

// fast-forward round_end -> next round buy phase
match.phaseEndsAtTick = match.tick + 1;
match.step();
assert(match.phase === ROUND_PHASE.BUY, 'next round starts in buy phase: got ' + match.phase);
assert(match.round === 2, 'round number incremented');
assert(pB.hp === 100 && pB.alive === true, 'players reset to alive/full hp next round');
assert(pA.hp === 100 && pA.alive === true, 'dead player also reset to alive/full hp next round');

// ---- Side swap after round 6 ----
match.round = 6;
match.scoreA = 4; match.scoreB = 1;
match.phase = ROUND_PHASE.ROUND_END;
const beforeAttack = match.attackTeam;
match.proceedAfterRoundEnd();
assert(match.attackTeam !== beforeAttack, 'teams swap sides after round 6');
assert(match.round === 7, 'round advanced to 7 after swap');

// ---- nearestSite axis regression ----
// nearestSite() must compare a player's (x, z) ground position against a
// site's (x, z) center -- a prior bug compared pos[1] (height) against the
// site's z instead of pos[2], so plant/defuse silently failed at any site
// whose z coordinate wasn't coincidentally close to 0. Iron Yard's own
// sites happen to sit at z=2, which is small enough that the bug still
// passed there and went unnoticed; Maple Hollow's site A (z=-8) does not.
{
  const mhMatch = new Match(mockRoom, MAPLE_HOLLOW);
  const mhSite = MAPLE_HOLLOW.sites.find((s) => s.siteId === 'A');
  const onSite = mhMatch.nearestSite([mhSite.center[0], 3, mhSite.center[1]]);
  assert(onSite && onSite.siteId === 'A', 'nearestSite compares ground (x,z), not (x,height)');
}

// ---- Plant / detonation flow ----
match.round = 8; match.phase = ROUND_PHASE.COMBAT; match.phaseEndsAtTick = match.tick + 100000;
match.resetForRound();
const attacker = [...match.players.values()].find(p => p.team === match.attackTeam);
const defender = [...match.players.values()].find(p => p.team === match.defendTeam);
const site = IRON_YARD.sites[0];
attacker.pos = [site.center[0], site.y, site.center[1]];
attacker.hasCore = true;
match.handleInteractStart(attacker.id === connA.id ? connA.id : connB.id, 'plant');
assert(attacker.interacting && attacker.interacting.type === 'plant', 'plant interaction started');
const plantTicks = Math.ceil(3.6 * TICK_RATE);
for (let i = 0; i < plantTicks; i++) match.step();
assert(match.core.state === 'planted', 'core planted after hold duration: state=' + match.core.state);
assert(match.phase === ROUND_PHASE.POST_PLANT, 'phase moves to post_plant after planting');

// defuse
defender.pos = match.core.pos.slice();
match.handleInteractStart(defender.id, 'defuse');
assert(defender.interacting && defender.interacting.type === 'defuse', 'defuse interaction started');
const defuseTicks = Math.ceil(6.6 * TICK_RATE);
for (let i = 0; i < defuseTicks; i++) match.step();
assert(match.core.state === 'defused', 'core defused after hold duration');
assert(match.phase === ROUND_PHASE.ROUND_END, 'round ends after defuse');

// ---- Grenades: buy, throw, frag damage/kill, smoke lifecycle ----
{
  const gMatch = new Match(mockRoom, IRON_YARD);
  const gConnA = mockConn('ga1'), gConnB = mockConn('gb1');
  const gA = gMatch.addPlayer(gConnA, TEAM_A, 'GA');
  const gB = gMatch.addPlayer(gConnB, TEAM_B, 'GB');
  gMatch.round = 1; gMatch.tick = 0;
  gMatch.resetForRound();
  gMatch.phase = ROUND_PHASE.BUY;
  gMatch.phaseEndsAtTick = gMatch.tick + 100000;

  // buy: increments count, respects maxCarry and cost
  gA.credits = 9000;
  gMatch.handleBuy(gConnA.id, 'grenade', 'FRAG1');
  assert(gA.grenades.FRAG1 === 1, 'buying a grenade increments owned count');
  assert(gA.credits === 9000 - GRENADES.FRAG1.cost, 'buying a grenade deducts its cost');
  gMatch.handleBuy(gConnA.id, 'grenade', 'FRAG1');
  assert(gA.grenades.FRAG1 === GRENADES.FRAG1.maxCarry, 'grenade count caps at maxCarry: got ' + gA.grenades.FRAG1);
  const creditsAtCap = gA.credits;
  gMatch.handleBuy(gConnA.id, 'grenade', 'FRAG1');
  assert(gA.credits === creditsAtCap, 'buying past maxCarry does not charge credits');

  // switching to an owned grenade works; switching to one you don't own is rejected
  gMatch.handleSwitchWeapon(gConnA.id, 'FRAG1');
  assert(gA.active === 'FRAG1', 'can switch active weapon to an owned grenade');
  gMatch.handleSwitchWeapon(gConnA.id, 'SMOKE1');
  assert(gA.active === 'FRAG1', 'cannot switch to a grenade type not owned');

  gMatch.phase = ROUND_PHASE.COMBAT; // throwing (via handleFire) requires COMBAT/POST_PLANT
  // throw: consumes one, spawns a projectile, and falls back to an owned weapon slot once out
  gA.pos = [0, 0, 0]; gA.yaw = 0; gA.pitch = 0;
  gB.pos = [0, 0, 3]; // within FRAG1's blast radius (5.5)
  const hpBefore = gB.hp;
  const ownedBefore = gA.grenades.FRAG1;
  gMatch.handleFire(gConnA.id);
  assert(gA.grenades.FRAG1 === ownedBefore - 1, 'throwing a grenade consumes one from the owned count');
  assert(gMatch.grenades.length === 1 && gMatch.grenades[0].type === 'FRAG1', 'a flying grenade is tracked in match state');

  // fast-forward past the fuse to force detonation regardless of where physics settled it
  gMatch.grenades[0].spawnTick = gMatch.tick - Math.round((GRENADES.FRAG1.fuseMs / 1000) * TICK_RATE) - 1;
  gMatch.grenades[0].pos = [0, 0, 3]; // pin next to the target so damage is deterministic for the test
  gMatch.processGrenades();
  assert(gB.hp < hpBefore, 'frag detonation damages a player within its blast radius: hp ' + hpBefore + ' -> ' + gB.hp);
  assert(gA.hp < 100, 'the thrower is not exempt from their own frag\'s blast radius');
  assert(gMatch.grenades.length === 0, 'a frag grenade is removed from active state after detonating');

  // a frag with enough damage kills -- reset both to a clean, alive state
  // first (the thrower stands within their own blast radius above, so gA
  // takes damage too each throw)
  gA.hp = 100; gA.alive = true;
  gB.hp = 10; gB.alive = true;
  gA.grenades.FRAG1 = 1;
  gMatch.handleFire(gConnA.id);
  gMatch.grenades[0].spawnTick = gMatch.tick - Math.round((GRENADES.FRAG1.fuseMs / 1000) * TICK_RATE) - 1;
  gMatch.grenades[0].pos = [0, 0, 3];
  gMatch.processGrenades();
  assert(gB.alive === false, 'lethal frag damage kills the target');

  // smoke: transitions to a lingering 'smoke' state instead of being removed, then expires later
  gA.hp = 100; gA.alive = true;
  gA.grenades.SMOKE1 = 1;
  gMatch.handleSwitchWeapon(gConnA.id, 'SMOKE1');
  gMatch.handleFire(gConnA.id);
  assert(gMatch.grenades.length === 1 && gMatch.grenades[0].type === 'SMOKE1', 'a thrown smoke grenade is tracked in match state');
  gMatch.grenades[0].spawnTick = gMatch.tick - Math.round((GRENADES.SMOKE1.fuseMs / 1000) * TICK_RATE) - 1;
  gMatch.processGrenades();
  assert(gMatch.grenades.length === 1 && gMatch.grenades[0].state === 'smoke', 'smoke grenade lingers as a smoke cloud after its fuse instead of disappearing');
  gMatch.grenades[0].smokeEndTick = gMatch.tick - 1;
  gMatch.processGrenades();
  assert(gMatch.grenades.length === 0, 'smoke cloud is removed once its duration elapses');
}

console.log(failures === 0 ? '\nALL MATCH LOGIC TESTS PASSED' : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
