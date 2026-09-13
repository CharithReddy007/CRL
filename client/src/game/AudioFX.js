// Procedural sound effects via Web Audio API - no external audio assets.
export class AudioFX {
  constructor() {
    this.ctx = null;
  }

  ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  noiseBurst({ duration = 0.08, freq = 1800, q = 0.8, gain = 0.5, decay = 0.06 } = {}) {
    const ctx = this.ensure();
    const len = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + duration);
  }

  tone({ freq = 440, duration = 0.12, type = 'sine', gain = 0.3, glideTo } = {}) {
    const ctx = this.ensure();
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, ctx.currentTime + duration);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  gunshot(weaponClass) {
    const presets = {
      pistol: { freq: 2200, duration: 0.07, gain: 0.35, decay: 0.05 },
      smg: { freq: 2000, duration: 0.06, gain: 0.32, decay: 0.04 },
      rifle: { freq: 1500, duration: 0.09, gain: 0.42, decay: 0.06 },
      shotgun: { freq: 900, duration: 0.14, gain: 0.5, decay: 0.1 },
      sniper: { freq: 700, duration: 0.18, gain: 0.55, decay: 0.14 },
      heavy: { freq: 1300, duration: 0.08, gain: 0.4, decay: 0.05 },
    };
    this.noiseBurst(presets[weaponClass] || presets.rifle);
  }

  meleeSwing() { this.noiseBurst({ freq: 3200, duration: 0.05, gain: 0.15, decay: 0.04 }); }
  hitmarker() { this.tone({ freq: 1400, duration: 0.05, type: 'square', gain: 0.15 }); }
  reload() { this.tone({ freq: 300, duration: 0.08, type: 'square', gain: 0.1 }); }
  interactTick() { this.tone({ freq: 900, duration: 0.03, type: 'sine', gain: 0.08 }); }
  planted() { this.tone({ freq: 220, duration: 0.5, type: 'sawtooth', gain: 0.2, glideTo: 110 }); }
  defused() { this.tone({ freq: 500, duration: 0.35, type: 'sine', gain: 0.25, glideTo: 900 }); }
  roundWin() { this.tone({ freq: 440, duration: 0.4, type: 'triangle', gain: 0.2, glideTo: 660 }); }
  roundLose() { this.tone({ freq: 300, duration: 0.4, type: 'sawtooth', gain: 0.15, glideTo: 150 }); }
  death() { this.noiseBurst({ freq: 300, duration: 0.3, gain: 0.3, decay: 0.25, q: 0.4 }); }
  jump() { this.tone({ freq: 200, duration: 0.05, type: 'sine', gain: 0.05, glideTo: 300 }); }
  grenadeThrow() { this.tone({ freq: 500, duration: 0.08, type: 'sine', gain: 0.1, glideTo: 350 }); }
  explosion() { this.noiseBurst({ freq: 180, duration: 0.5, gain: 0.6, decay: 0.4, q: 0.3 }); }
  smokePop() { this.noiseBurst({ freq: 700, duration: 0.15, gain: 0.25, decay: 0.12, q: 0.6 }); }
}

export const audio = new AudioFX();
