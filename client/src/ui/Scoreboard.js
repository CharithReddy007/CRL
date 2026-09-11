import { TEAM_A, TEAM_B } from '@crl/shared';

export class Scoreboard {
  constructor(root) {
    this.root = document.createElement('div');
    this.root.className = 'scoreboard hidden';
    root.appendChild(this.root);
  }

  show() { this.root.classList.remove('hidden'); }
  hide() { this.root.classList.add('hidden'); }

  update(players) {
    const teamA = players.filter((p) => p.team === TEAM_A);
    const teamB = players.filter((p) => p.team === TEAM_B);
    const rows = (list) => list.map((p) => `
      <tr class="${p.alive ? '' : 'dead-row'}">
        <td>${p.name}</td><td>${p.kills}</td><td>${p.deaths}</td><td>${p.assists}</td><td>¤${p.credits}</td>
      </tr>`).join('');
    this.root.innerHTML = `
      <div class="scoreboard-panel panel">
        <table>
          <thead><tr><th colspan="5" class="team-head team-a-head">Team A — Attackers</th></tr>
          <tr><th>Player</th><th>K</th><th>D</th><th>A</th><th>Credits</th></tr></thead>
          <tbody>${rows(teamA)}</tbody>
        </table>
        <table>
          <thead><tr><th colspan="5" class="team-head team-b-head">Team B — Defenders</th></tr>
          <tr><th>Player</th><th>K</th><th>D</th><th>A</th><th>Credits</th></tr></thead>
          <tbody>${rows(teamB)}</tbody>
        </table>
      </div>`;
  }
}
