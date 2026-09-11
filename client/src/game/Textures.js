// Procedural canvas textures -- no external image assets. Cheap to generate
// once and reuse; gives surfaces a material "read" instead of flat color.
import * as THREE from 'three';

const cache = new Map();

function canvas(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return c;
}

function toTexture(c, repeatX = 4, repeatY = 4) {
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function memo(key, build) {
  if (!cache.has(key)) cache.set(key, build());
  return cache.get(key);
}

// Mottled noise -- concrete, dirt, sand, asphalt.
export function noiseTexture(base, variance, size = 128, repeat = 4) {
  return memo(`noise:${base}:${variance}:${size}:${repeat}`, () => {
    const c = canvas(size);
    const ctx = c.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    const [r, g, b] = hexToRgb(base);
    const img = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * variance;
      img.data[i] = clamp(r + n);
      img.data[i + 1] = clamp(g + n);
      img.data[i + 2] = clamp(b + n);
    }
    ctx.putImageData(img, 0, 0);
    return toTexture(c, repeat, repeat);
  });
}

// Horizontal wood-grain planks.
export function woodTexture(base, dark, size = 128, repeat = 3) {
  return memo(`wood:${base}:${dark}:${size}:${repeat}`, () => {
    const c = canvas(size);
    const ctx = c.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = dark;
    for (let y = 0; y < size; y += size / 8) {
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 80; i++) {
      ctx.beginPath();
      const y = Math.random() * size;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.3, y + (Math.random() - 0.5) * 6, size * 0.7, y + (Math.random() - 0.5) * 6, size, y);
      ctx.strokeStyle = dark; ctx.lineWidth = 0.6; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return toTexture(c, repeat, repeat);
  });
}

// Brick coursing with mortar lines.
export function brickTexture(brick, mortar, size = 128, repeat = 4) {
  return memo(`brick:${brick}:${mortar}:${size}:${repeat}`, () => {
    const c = canvas(size);
    const ctx = c.getContext('2d');
    ctx.fillStyle = mortar;
    ctx.fillRect(0, 0, size, size);
    const bw = size / 4, bh = size / 8;
    ctx.fillStyle = brick;
    let row = 0;
    for (let y = 0; y < size; y += bh) {
      const offset = (row % 2) * (bw / 2);
      for (let x = -bw; x < size; x += bw) {
        ctx.fillRect(x + offset + 1, y + 1, bw - 2, bh - 2);
      }
      row++;
    }
    return toTexture(c, repeat, repeat);
  });
}

// Woven fabric -- couches, carpet, rugs.
export function fabricTexture(base, size = 64, repeat = 4) {
  return memo(`fabric:${base}:${size}:${repeat}`, () => {
    const c = canvas(size);
    const ctx = c.getContext('2d');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    const [r, g, b] = hexToRgb(base);
    ctx.globalAlpha = 0.4;
    for (let y = 0; y < size; y += 2) {
      ctx.fillStyle = ((y / 2) % 2 === 0) ? rgbStr(r + 10, g + 10, b + 10) : rgbStr(r - 10, g - 10, b - 10);
      ctx.fillRect(0, y, size, 2);
    }
    ctx.globalAlpha = 1;
    return toTexture(c, repeat, repeat);
  });
}

// Diffuse grass with subtle blade streaks.
export function grassTexture(size = 128, repeat = 10) {
  return memo(`grass:${size}:${repeat}`, () => {
    const c = canvas(size);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#3c6b34';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * size, y = Math.random() * size;
      ctx.strokeStyle = Math.random() > 0.5 ? '#2f5a29' : '#4d8043';
      ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (Math.random() - 0.5) * 3, y - 3 - Math.random() * 3); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return toTexture(c, repeat, repeat);
  });
}

function hexToRgb(hex) {
  const n = typeof hex === 'number' ? hex : parseInt(String(hex).replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function clamp(v) { return Math.max(0, Math.min(255, v)); }
function rgbStr(r, g, b) { return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`; }
