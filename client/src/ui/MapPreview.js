// Draws a small top-down schematic of a map onto a canvas: walls, sites,
// and spawns. Used for the lobby's map-select preview.
export function drawMapPreview(canvas, mapData) {
  const ctx = canvas.getContext('2d');
  const { minX, maxX, minZ, maxZ } = mapData.bounds;
  const w = canvas.width, h = canvas.height;
  const pad = 6;
  const sx = (w - pad * 2) / (maxX - minX);
  const sz = (h - pad * 2) / (maxZ - minZ);
  const s = Math.min(sx, sz);
  const ox = pad + (w - pad * 2 - (maxX - minX) * s) / 2;
  const oz = pad + (h - pad * 2 - (maxZ - minZ) * s) / 2;
  const px = (x) => ox + (x - minX) * s;
  const pz = (z) => oz + (z - minZ) * s;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#12161d';
  ctx.fillRect(0, 0, w, h);

  for (const o of mapData.geometry) {
    if (o.kind === 'site' || !o.solid) continue;
    const hw = o.size[0] / 2, hd = o.size[2] / 2;
    ctx.fillStyle = 'rgba(140,160,180,0.35)';
    ctx.fillRect(px(o.pos[0] - hw), pz(o.pos[2] - hd), Math.max(1, hw * 2 * s), Math.max(1, hd * 2 * s));
  }

  for (const site of mapData.sites) {
    ctx.beginPath();
    ctx.arc(px(site.center[0]), pz(site.center[1]), site.radius * s, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff5050';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ff5050';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(site.siteId, px(site.center[0]) - 3, pz(site.center[1]) + 3);
  }

  ctx.fillStyle = '#ff9d42';
  for (const sp of mapData.spawns.A) { ctx.beginPath(); ctx.arc(px(sp.pos[0]), pz(sp.pos[2]), 2, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#3ecfd6';
  for (const sp of mapData.spawns.B) { ctx.beginPath(); ctx.arc(px(sp.pos[0]), pz(sp.pos[2]), 2, 0, Math.PI * 2); ctx.fill(); }
}
