// Live in-match minimap: a small north-locked corner radar (cropped/zoomed
// around the local player) plus a full-map view on hold. Shows bomb sites,
// the Core, and only the local player's own team (no enemy radar).
import { TEAM_A } from '@crl/shared';

const BG_SIZE = 640;
const CORNER_RADIUS = 34; // world units shown around the player in the corner view

const TEAM_COLOR = { A: '#ff9d42', B: '#3ecfd6' };

function fitProjection(mapData, canvasW, canvasH, pad) {
  const { minX, maxX, minZ, maxZ } = mapData.bounds;
  const sx = (canvasW - pad * 2) / (maxX - minX);
  const sz = (canvasH - pad * 2) / (maxZ - minZ);
  const s = Math.min(sx, sz);
  const ox = pad + (canvasW - pad * 2 - (maxX - minX) * s) / 2;
  const oz = pad + (canvasH - pad * 2 - (maxZ - minZ) * s) / 2;
  // world (x,z) -> canvas pixel; +Z is drawn as "up" (north), like a real map
  const project = (x, z) => [ox + (x - minX) * s, canvasH - (oz + (z - minZ) * s)];
  return { project, scale: s };
}

function drawTriangleMarker(ctx, px, py, dirX, dirY, color, size) {
  const len = Math.hypot(dirX, dirY) || 1;
  const dx = dirX / len, dy = dirY / len;
  const perpX = -dy, perpY = dx;
  const tipX = px + dx * size, tipY = py + dy * size;
  const backX = px - dx * size * 0.7, backY = py - dy * size * 0.7;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(backX + perpX * size * 0.6, backY + perpY * size * 0.6);
  ctx.lineTo(backX - perpX * size * 0.6, backY - perpY * size * 0.6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

export class Minimap {
  constructor(root, mapData) {
    this.mapData = mapData;
    this.projection = fitProjection(mapData, BG_SIZE, BG_SIZE, 16);

    this.bg = document.createElement('canvas');
    this.bg.width = BG_SIZE;
    this.bg.height = BG_SIZE;
    this.drawBackground();

    this.el = document.createElement('div');
    this.el.className = 'minimap-root';
    root.appendChild(this.el);
    this.el.innerHTML = `
      <canvas class="minimap-corner" width="190" height="190"></canvas>
      <div class="minimap-hint">Hold M for full map</div>
      <div class="minimap-full hidden">
        <div class="minimap-full-panel panel">
          <canvas class="minimap-full-canvas" width="${BG_SIZE}" height="${BG_SIZE}"></canvas>
        </div>
      </div>`;
    this.cornerCanvas = this.el.querySelector('.minimap-corner');
    this.fullPanel = this.el.querySelector('.minimap-full');
    this.fullCanvas = this.el.querySelector('.minimap-full-canvas');
  }

  drawBackground() {
    const ctx = this.bg.getContext('2d');
    const { project, scale } = this.projection;
    ctx.clearRect(0, 0, BG_SIZE, BG_SIZE);
    ctx.fillStyle = '#0c1119';
    ctx.fillRect(0, 0, BG_SIZE, BG_SIZE);

    for (const o of this.mapData.geometry) {
      if (o.kind === 'site' || !o.solid) continue;
      const hw = o.size[0] / 2, hd = o.size[2] / 2;
      const [x1, y1] = project(o.pos[0] - hw, o.pos[2] - hd);
      const [x2, y2] = project(o.pos[0] + hw, o.pos[2] + hd);
      ctx.fillStyle = 'rgba(150,168,190,0.38)';
      ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.max(1, Math.abs(x2 - x1)), Math.max(1, Math.abs(y2 - y1)));
    }

    for (const site of this.mapData.sites) {
      const [cx, cy] = project(site.center[0], site.center[1]);
      const r = site.radius * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff5050';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ff5050';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(site.siteId, cx, cy);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  showFull(show) {
    this.fullPanel.classList.toggle('hidden', !show);
  }

  drawMarkers(ctx, players, selfId, core, project) {
    if (core && core.pos && (core.state === 'planted' || core.state === 'dropped')) {
      const [px, py] = project(core.pos[0], core.pos[2]);
      ctx.fillStyle = core.state === 'planted' ? '#ff4d4d' : '#ffcc4d';
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    const me = players.find((p) => p.id === selfId);
    const myTeam = me?.team;
    for (const p of players) {
      if (!p.alive || p.team !== myTeam) continue;
      const [px, py] = project(p.pos[0], p.pos[2]);
      if (p.id === selfId) {
        drawTriangleMarker(ctx, px, py, -Math.sin(p.yaw), Math.cos(p.yaw), '#ffffff', 8);
      } else {
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = TEAM_COLOR[p.team] || '#cccccc';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  update(players, selfId, core) {
    const me = players.find((p) => p.id === selfId);
    if (!me) return;

    // corner radar: crop+zoom the cached background around the player
    const cx = me.pos[0], cz = me.pos[2];
    const corners = [
      [cx - CORNER_RADIUS, cz - CORNER_RADIUS], [cx - CORNER_RADIUS, cz + CORNER_RADIUS],
      [cx + CORNER_RADIUS, cz - CORNER_RADIUS], [cx + CORNER_RADIUS, cz + CORNER_RADIUS],
    ].map(([x, z]) => this.projection.project(x, z));
    const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
    const sx = Math.min(...xs), sy = Math.min(...ys);
    const sw = Math.max(...xs) - sx, sh = Math.max(...ys) - sy;
    const cctx = this.cornerCanvas.getContext('2d');
    const cw = this.cornerCanvas.width, ch = this.cornerCanvas.height;
    cctx.clearRect(0, 0, cw, ch);
    cctx.save();
    cctx.beginPath();
    cctx.arc(cw / 2, ch / 2, cw / 2 - 1, 0, Math.PI * 2);
    cctx.clip();
    cctx.drawImage(this.bg, sx, sy, sw, sh, 0, 0, cw, ch);
    const cornerScale = cw / (2 * CORNER_RADIUS);
    this.drawMarkers(cctx, players, selfId, core, (x, z) => [cw / 2 + (x - cx) * cornerScale, ch / 2 - (z - cz) * cornerScale]);
    cctx.restore();

    // full map: reuse the cached background 1:1
    if (!this.fullPanel.classList.contains('hidden')) {
      const fctx = this.fullCanvas.getContext('2d');
      fctx.clearRect(0, 0, BG_SIZE, BG_SIZE);
      fctx.drawImage(this.bg, 0, 0);
      this.drawMarkers(fctx, players, selfId, core, this.projection.project);
    }
  }
}
