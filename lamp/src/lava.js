import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

// Organic lava via marching cubes: blobs rise, merge, stretch, sink.
export class LavaSim {
  constructor(scene, bounds) {
    this.bounds = bounds;
    this.material = new THREE.MeshStandardMaterial({
      color: 0xb81e00,
      emissive: 0xff4400,
      emissiveIntensity: 1.6,
      roughness: 0.35,
      metalness: 0.1
    });
    this.mc = new MarchingCubes(42, this.material, false, false, 60000);
    this.mc.isolation = 32;
    this.mc.frustumCulled = false;
    // Field 0..1 maps to local -1..1, so position/scale fit the chamber:
    // world y = pos.y ± scale.y  ->  1.8 .. 6.6 (chamber interior + reservoir)
    this.mc.scale.set(1.0, 2.4, 1.0);
    this.mc.position.y = 4.2;
    scene.add(this.mc);

    const N = 13;
    this.blobs = [];
    for (let i = 0; i < N; i++) {
      this.blobs.push({
        x: (Math.random() - 0.5) * 0.9,
        z: (Math.random() - 0.5) * 0.9,
        y: Math.random(),
        speed: 0.05 + Math.random() * 0.09,
        size: 0.09 + Math.random() * 0.09,
        wob: Math.random() * Math.PI * 2,
        stretch: 0.7 + Math.random() * 0.8
      });
    }
    this.orbiters = [];
    const orbGeo = new THREE.SphereGeometry(0.14, 20, 14);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0xcc2200, emissive: 0xff5500, emissiveIntensity: 2.0, roughness: 0.3
    });
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(orbGeo, orbMat.clone());
      m.visible = false;
      scene.add(m);
      this.orbiters.push({ mesh: m, a: (i / 6) * Math.PI * 2, r: 1.1, s: 1.2 + Math.random(), y: 0 });
    }
    this.gather = 0; // 0..1 lava gathering around monster (max event)
    this.monsterPos = new THREE.Vector3(0, 4, 0);
    this.energy = 0;
  }

  burst(n = 10) {
    for (let i = 0; i < n; i++) {
      const b = this.blobs[Math.floor(Math.random() * this.blobs.length)];
      b.y = Math.min(1, b.y + Math.random() * 0.1);
      b.wob += Math.random() * 2;
    }
  }

  update(dt, time, anger, monsterPos) {
    this.monsterPos.copy(monsterPos);
    this.energy += ((anger) - this.energy) * (1 - Math.exp(-dt * 2));
    const speedMul = 0.6 + this.energy * 2.6 + this.gather * 3.0;
    this.mc.reset();

    for (const b of this.blobs) {
      b.y += b.speed * speedMul * dt * 2.2;
      b.wob += dt * (1 + this.energy * 3);
      if (b.y > 1.05) {
        b.y = -0.05;
        b.x = (Math.random() - 0.5) * 0.9;
        b.z = (Math.random() - 0.5) * 0.9;
      }
      // convection sway grows toward middle
      const sway = Math.sin(b.y * 6 + time * 0.8) * 0.12 * (0.4 + this.energy);
      const bx = 0.5 + (b.x + sway) * 0.32;
      const bz = 0.5 + (b.z + Math.cos(b.wob) * 0.08) * 0.32;
      const by = THREE.MathUtils.clamp(b.y, 0.02, 0.98);
      // strength/subtract tuned so radius = size*sqrt(strength/subtract)
      // lands at ~4-6 cells with isolation 32 (see MarchingCubes field eq.)
      const str = 0.32 + this.energy * 0.35 + b.size * 0.9;
      const sub = 8;
      this.mc.addBall(bx, by, bz, str, sub);
      // stretched satellite for elongation while rising
      this.mc.addBall(bx, THREE.MathUtils.clamp(by + 0.028 * b.stretch, 0, 1), bz, str * 0.55, sub);
    }

    // floor reservoir of lava
    this.mc.addBall(0.5, 0.045, 0.5, 0.55, 6.5);

    // gather: extra mass around monster
    if (this.gather > 0.01) {
      const mp = this.worldToField(monsterPos);
      for (let i = 0; i < 5; i++) {
        const a = time * 4 + (i / 5) * Math.PI * 2;
        this.mc.addBall(
          mp.x + Math.cos(a) * 0.06, mp.y + Math.sin(a * 1.3) * 0.05, mp.z + Math.sin(a) * 0.06,
          0.1 + 0.3 * this.gather, 7
        );
      }
    }
    this.mc.update();

    this.material.emissiveIntensity = 1.3 + this.energy * 2.2 + this.gather * 2.0;
    this.material.emissive.setHSL(0.045 - this.energy * 0.025, 1, 0.5);

    // orbiters appear with anger
    const showOrbit = anger > 0.55 ? Math.min(1, (anger - 0.55) * 3) : 0;
    for (const o of this.orbiters) {
      o.mesh.visible = showOrbit > 0.02;
      if (!o.mesh.visible) continue;
      o.a += dt * o.s * (1 + anger * 3);
      const r = 1.0 + Math.sin(time * 2 + o.a) * 0.15;
      o.mesh.position.set(
        monsterPos.x + Math.cos(o.a) * r * 0.9,
        monsterPos.y + Math.sin(o.a * 1.4) * 0.7,
        monsterPos.z + Math.sin(o.a) * r * 0.9
      );
      o.mesh.material.emissiveIntensity = 1.5 + anger * 3;
      const s = 0.7 + showOrbit * 0.7;
      o.mesh.scale.setScalar(s);
      o.mesh.material.opacity = showOrbit;
      o.mesh.material.transparent = true;
    }
  }

  worldToField(p) {
    // field 0..1 -> local -1..1 -> world pos.y ± scale
    const y = THREE.MathUtils.clamp((p.y - (4.2 - 2.4)) / 4.8, 0, 1);
    return { x: 0.5 + p.x / 2.0, y, z: 0.5 + p.z / 2.0 };
  }
}
