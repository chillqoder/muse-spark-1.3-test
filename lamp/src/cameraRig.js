import * as THREE from 'three';

// Parallax rig: limited orbit ±20° horiz, ±10° vert + trauma shake with damping.
export class CameraRig {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.targetYaw = 0;
    this.targetPitch = 0.06;
    this.yaw = 0;
    this.pitch = 0.06;
    this.trauma = 0;
    this.shakeOffset = new THREE.Vector3();
    this.basePos = new THREE.Vector3(0, 4.6, 11.4);
    this.lookAt = new THREE.Vector3(0, 3.9, 0);
    this.t = 0;

    const maxYaw = THREE.MathUtils.degToRad(20);
    const maxPitch = THREE.MathUtils.degToRad(10);
    window.addEventListener('pointermove', (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      this.targetYaw = THREE.MathUtils.clamp(-nx * maxYaw, -maxYaw, maxYaw);
      this.targetPitch = THREE.MathUtils.clamp(0.06 - ny * maxPitch * 0.9, -0.08, 0.24);
    });
  }

  impulse(amount) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  update(dt) {
    this.t += dt;
    const k = 1 - Math.exp(-dt * 3.2);
    this.yaw += (this.targetYaw - this.yaw) * k;
    this.pitch += (this.targetPitch - this.pitch) * k;
    this.trauma = Math.max(0, this.trauma - dt * 1.4);

    const sh = this.trauma * this.trauma;
    const t = this.t * 34;
    this.shakeOffset.set(
      Math.sin(t * 1.1) * 0.35 * sh,
      Math.cos(t * 1.7) * 0.28 * sh,
      Math.sin(t * 0.7) * 0.15 * sh
    );

    const r = this.basePos.length();
    const cx = Math.sin(this.yaw) * Math.cos(this.pitch) * r;
    const cz = Math.cos(this.yaw) * Math.cos(this.pitch) * r;
    const cy = this.basePos.y + Math.sin(this.pitch) * r * 0.6;
    this.camera.position.set(cx, cy, cz).add(this.shakeOffset);
    const look = this.lookAt.clone().addScaledVector(this.shakeOffset, 0.6);
    this.camera.lookAt(look);
  }
}
