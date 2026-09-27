// Explicit emotion state machine + ANGER_LEVEL 0..1
export class Emotion {
  constructor() {
    this.anger = 0;
    this.clicks = 0;
    this.state = 'CALM';
    this.faceState = 'CALM';
    this.lastHit = -100;
    this.time = 0;
    this.lock = null; // special sequence lock: 'MAXFREEZE' | 'MAXPUNCH' | 'SORRY'
    this.lockT = 0;
    this.maxDoneCooldown = 0;
  }

  poke(now) {
    this.clicks++;
    this.lastHit = now;
    this.maxDoneCooldown = Math.max(0, this.maxDoneCooldown);
    // gradual: early clicks small, later clicks bigger
    const step = 0.09 + Math.min(0.08, this.clicks * 0.006) + this.anger * 0.05;
    this.anger = Math.min(1, this.anger + step);
  }

  soothe(dt, amount = 0.25) {
    this.anger = Math.max(0, this.anger - dt * amount);
  }

  get shouldTriggerMax() {
    return this.anger >= 0.999 && this.lock === null && this.maxDoneCooldown <= 0;
  }

  update(dt, now) {
    this.time = now;
    this.maxDoneCooldown = Math.max(0, this.maxDoneCooldown - dt);
    if (this.lock) {
      this.lockT += dt;
      return;
    }
    // decay over ~15-25s: full drain in ~20s
    const sinceHit = now - this.lastHit;
    if (sinceHit > 2.5 && this.anger > 0) {
      this.anger = Math.max(0, this.anger - dt / 20);
    }
    const a = this.anger;
    let s = 'CALM', f = 'CALM';
    if (a < 0.12) { s = 'CALM'; f = this.clicks === 0 ? 'CALM' : 'HAPPY'; if (this.clicks===0) f='CALM'; }
    else if (a < 0.3) { s = 'CURIOUS'; f = this.clicks <= 3 ? 'CURIOUS' : 'CONFUSED'; }
    else if (a < 0.55) { s = 'ANNOYED'; f = 'ANNOYED'; }
    else if (a < 0.8) { s = 'ANGRY'; f = 'ANGRY'; }
    else { s = 'FURIOUS'; f = 'FURIOUS'; }
    // returning-to-calm flavor when decaying from high
    if (sinceHit > 4 && a > 0.05 && a < 0.3 && this.clicks > 4) { s = 'RETURNING_TO_CALM'; f = 'EMBARRASSED'; }
    this.state = s;
    this.faceState = (s === 'RETURNING_TO_CALM') ? 'EMBARRASSED' : f;
  }
}
