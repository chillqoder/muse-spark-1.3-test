import * as THREE from 'three';

// Glowing particles inside the lamp: sparks, bubbles, dust.
export class ParticleSystem {
  constructor(scene, bounds) {
    this.bounds = bounds;
    const N = 260;
    this.N = N;
    this.pos = new Float32Array(N * 3);
    this.vel = new Float32Array(N * 3);
    this.seed = new Float32Array(N);
    for (let i = 0; i < N; i++) this.respawn(i, true);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mat = new THREE.PointsMaterial({
      color: 0xff8830, size: 0.055, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  respawn(i, randomY = false) {
    const b = this.bounds;
    this.pos[i * 3] = (Math.random() - 0.5) * 1.6;
    this.pos[i * 3 + 1] = randomY ? b.bottom + Math.random() * (b.top - b.bottom) : b.bottom + Math.random() * 0.4;
    this.pos[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
    this.vel[i * 3] = (Math.random() - 0.5) * 0.1;
    this.vel[i * 3 + 1] = 0.25 + Math.random() * 0.5;
    this.vel[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    this.seed[i] = Math.random();
  }

  burst(n) {
    for (let k = 0; k < n; k++) {
      const i = Math.floor(Math.random() * this.N);
      this.respawn(i);
      this.vel[i * 3 + 1] *= 3;
      this.vel[i * 3] *= 4;
      this.vel[i * 3 + 2] *= 4;
    }
  }

  update(dt, anger, time) {
    const b = this.bounds;
    const rise = 0.5 + anger * 2.2;
    for (let i = 0; i < this.N; i++) {
      const s = this.seed[i];
      this.pos[i * 3] += (this.vel[i * 3] + Math.sin(time * 2 + s * 9) * 0.08) * dt * (1 + anger * 2);
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt * rise;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      // keep inside chamber radius
      const r = Math.hypot(this.pos[i * 3], this.pos[i * 3 + 2]);
      if (r > 0.95) {
        this.pos[i * 3] *= 0.9; this.pos[i * 3 + 2] *= 0.9;
      }
      if (this.pos[i * 3 + 1] > b.top) this.respawn(i);
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.mat.opacity = 0.45 + anger * 0.5;
    this.mat.size = 0.045 + anger * 0.035;
  }
}
