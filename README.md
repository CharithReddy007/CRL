# CRL

A browser-based multiplayer tactical FPS — original attack/defend gunplay
inspired by the genre, built from scratch with no ability system: gunplay,
movement, positioning, teamwork, and map strategy carry the game.

- **Server-authoritative** Node.js + `ws` backend (movement, hit detection,
  economy, round/objective state).
- **Three.js** browser client with client-side prediction and server
  reconciliation for responsive movement.
- **3 original maps** (Iron Yard, Neon District, Desert Relay), each with two
  bomb sites, multiple attack routes, verticality, and real collision.
- **14 original weapons** across pistols/SMGs/rifles/shotguns/snipers/LMG,
  plus a melee weapon.

## Running it

Requires Node.js 20+.

```bash
npm install        # installs the server, client, and shared workspaces
npm run dev:server # terminal 1 — game server on :8080
npm run dev:client # terminal 2 — Vite dev server on :5173 (proxies /ws to :8080)
```

Open `http://localhost:5173` in two or more browser tabs/machines to play.
For a production build, run `npm run build:client`; the server (`npm run
dev:server` or `node server/src/index.js`) serves `client/dist` directly, so
a single deployed server is enough — no separate static host needed.

## How to play

1. Enter a callsign and **Create Room**, or enter a room code to **Join**.
2. Pick a team, **Ready Up**. The host can also pick the map.
3. Host clicks **Start Match** once everyone is ready (1v1 up to 5v5, up to
   10 players).
4. Attackers carry the Core into the enemy-held site and plant it; defenders
   stop them or defuse it after planting.

### Controls

| Key | Action |
| --- | --- |
| WASD | Move |
| Mouse | Look |
| Left click | Fire |
| Right click | Aim down sights |
| R | Reload |
| 1 / 2 / 3 | Primary / Secondary / Melee |
| F (hold) | Plant / defuse the Core |
| C | Crouch |
| Space | Jump |
| B | Buy menu (buy phase only) |
| Tab | Scoreboard |
| Q / E | Cycle spectate target (while dead) |
| Esc | Pause menu / sensitivity |

## Project layout

```
shared/   game rules, weapon/map data, and the movement+collision code
          used identically by both the server and the client
server/   authoritative Node.js game server (lobby, rounds, combat, economy)
client/   Vite + Three.js browser client (rendering, input, UI)
```

## Tests

```bash
npm run test -w server   # round/economy/plant-defuse state machine tests
```

The shared movement/collision code and all three maps were additionally
validated with a large simulated-movement sweep (thousands of walk paths
across every map, including every stairway/catwalk/tunnel) during
development to catch collision and connectivity bugs; see git history for
the scripts used.

## Scope notes

This is a from-scratch build covering the full spec: lobby/rooms, teams,
rounds, the Core plant/defuse objective, economy, a full weapon roster, three
distinct maps, HUD/scoreboard/spectator, and procedural sound (no external
audio/art assets). A few deliberate simplifications given scope: hit
detection is not lag-compensated (server resolves shots against its current
authoritative state rather than rewinding for the shooter's latency); burst
weapons currently fire like semi-auto rather than a true 3-round burst; and
bullets stop at the first surface they hit rather than penetrating thin
cover (the per-weapon penetration stat exists for future use).
