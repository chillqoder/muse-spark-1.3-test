// Procedural WebAudio sound: no external files.
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.ambientNodes = null;
  }

  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.startAmbient();
  }

  setEnabled(v) { this.enabled = v; if (this.master) this.master.gain.value = v ? 0.5 : 0; }

  startAmbient() {
    const ctx = this.ctx;
    // bubbling: filtered noise with random LFO gurgles
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 2;
    const g = ctx.createGain(); g.gain.value = 0.05;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.7;
    const lfoG = ctx.createGain(); lfoG.gain.value = 120;
    lfo.connect(lfoG); lfoG.connect(lp.frequency);
    noise.connect(lp); lp.connect(g); g.connect(this.master);
    noise.start(); lfo.start();
    // electrical hum
    const hum = ctx.createOscillator(); hum.type = 'sine'; hum.frequency.value = 55;
    const humG = ctx.createGain(); humG.gain.value = 0.012;
    hum.connect(humG); humG.connect(this.master);
    hum.start();
    this.ambientNodes = { noise, hum };
  }

  blip(freq, dur, vol, type = 'sine', slideTo = null) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(ctx.currentTime + dur + 0.02);
  }

  tap(v = 0.4) {
    // glass tap: short high sine + click noise
    this.blip(1400 + Math.random() * 600, 0.09, 0.12 * v, 'sine', 900);
    this.blip(220, 0.12, 0.1 * v, 'triangle', 90);
  }

  splash() { this.blip(400 + Math.random() * 300, 0.25, 0.08, 'sine', 120); }

  growl(anger) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(55, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(38, ctx.currentTime + 0.9);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 9;
    const lg = ctx.createGain(); lg.gain.value = 18;
    lfo.connect(lg); lg.connect(o.frequency);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22 * anger + 0.1, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
    o.connect(f); f.connect(g); g.connect(this.master);
    o.start(); lfo.start();
    o.stop(ctx.currentTime + 1.2); lfo.stop(ctx.currentTime + 1.2);
  }

  rumble() {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(30, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(65, ctx.currentTime + 1.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(ctx.currentTime + 2);
  }

  impact(power = 1) {
    if (!this.ctx || !this.enabled) return;
    this.blip(90, 0.5, 0.5 * Math.min(1.4, power), 'sine', 28);
    this.blip(2400, 0.06, 0.1 * power, 'square', 500);
  }

  squeak() { this.blip(700, 0.18, 0.1, 'sine', 1200); setTimeout(() => this.blip(900, 0.15, 0.08, 'sine', 500), 140); }
}
