import * as THREE from 'three';

// Monster body animation, locomotion, gestures, random idle behaviors,
// body deformation (viscous lava), max-anger cinematic.
export class MonsterAnimator {
  constructor(monster, face, emotion, bounds, hooks) {
    this.m = monster;
    this.face = face;
    this.em = emotion;
    this.bounds = bounds;
    this.hooks = hooks; // { lava, lamp, rig, sound, particles }
    this.r = monster.refs;

    this.baseY = 3.9;
    this.pos = new THREE.Vector3(0, this.baseY, 0);
    this.vel = new THREE.Vector3();
    this.swimTarget = new THREE.Vector3(0, this.baseY, 0);
    this.swimT = 0;

    this.blinkT = 2;
    this.behaviorT = 5;
    this.behavior = null; // { name, t, dur }
    this.headLook = new THREE.Vector3();
    this.cursorGlass = new THREE.Vector3(0, 4, 1);

    this.punchT = -10; // time of last punch
    this.punchSide = 1;
    this.pointT = -10;
    this.shakeHeadT = -10;
    this.crossed = 0; // 0..1 arm-cross blend
    this.holdingGlass = 0; // friendship touch blend

    this.seqT = 0; // max-event timeline
    this.roarT = 0;
    this.spin = 0;
  }

  pokeReaction() {
    const c = this.em.clicks;
    if (c === 1) {
      this.startBehavior('notice', 1.6);
    } else if (c <= 3) {
      this.startBehavior('tapglass', 2.2);
    } else if (this.em.anger < 0.55) {
      if (Math.random() < 0.4) this.startBehavior('headshake', 1.4);
      else this.lightPunch();
    } else {
      this.hardPunch();
    }
  }

  lightPunch() {
    this.punchT = this.em.time;
    this.punchSide = Math.random() < 0.5 ? -1 : 1;
    const lamp = this.hooks.lamp;
    lamp.shockwave(this.pos.y, 0.4);
    this.hooks.rig.impulse(0.18);
    this.hooks.sound.tap(0.5);
    this.hooks.lava.burst(6);
    this.hooks.particles.burst(14);
  }

  hardPunch() {
    this.punchT = this.em.time;
    this.punchSide = Math.random() < 0.5 ? -1 : 1;
    const lamp = this.hooks.lamp;
    lamp.shockwave(this.pos.y, 1.0);
    this.hooks.rig.impulse(0.45);
    this.hooks.sound.impact(0.7);
    this.hooks.lava.burst(16);
    this.hooks.particles.burst(40);
  }

  startBehavior(name, dur) {
    this.behavior = { name, t: 0, dur };
    if (name === 'point') this.pointT = this.em.time;
    if (name === 'headshake') this.shakeHeadT = this.em.time;
  }

  startMaxEvent() {
    this.em.lock = 'MAXFREEZE';
    this.em.lockT = 0;
    this.seqT = 0;
    this.hooks.sound.rumble();
  }

  update(dt, time, cursor) {
    const em = this.em, r = this.r, hooks = this.hooks;
    const anger = em.anger;

    // ---- face state routing ----
    if (em.lock === 'MAXFREEZE') this.face.tgt && this.face.setTargetsFor('SURPRISED', 1);
    else if (em.lock === 'MAXGRIN') this.face.setTargetsFor('GRIN', 1);
    else if (em.lock === 'SORRY') this.face.setTargetsFor('EMBARRASSED', 0);
    else if (this.holdingGlass > 0.5) this.face.setTargetsFor('HAPPY', anger);
    else this.face.setTargetsFor(em.faceState, anger);

    // cursor -> glass projection for look target
    this.cursorGlass.set(cursor.nx * 1.0, 4.1 + -cursor.ny * 1.6, 0.9);
    const lookAmt = anger > 0.6 ? 1.0 : 0.45;
    this.face.lookTgt.set(cursor.nx * lookAmt, -cursor.ny * lookAmt * 0.7);

    // ---- locomotion ----
    const swimSpeed = 0.5 + anger * 4.2;
    if (em.lock) {
      // frozen, then lunge handled by timeline
      this.updateMaxTimeline(dt);
    } else if (anger > 0.62) {
      // swim rapidly around lamp, chase cursor
      this.swimT -= dt;
      if (this.swimT <= 0) {
        this.swimT = 0.9 + Math.random() * 1.2;
        const a = Math.random() * Math.PI * 2;
        // bias toward cursor side when furious
        const bx = THREE.MathUtils.clamp(cursor.nx * 0.8 + Math.cos(a) * 0.5, -0.6, 0.6);
        this.swimTarget.set(bx, this.baseY + (Math.random() - 0.5) * 2.2, Math.sin(a) * 0.45);
        this.clampTarget();
      }
      // chase cursor aggressively: pull target toward cursor
      this.swimTarget.x += (THREE.MathUtils.clamp(cursor.nx, -1, 1) * 0.6 - this.swimTarget.x) * dt * 1.2;
      this.swimTarget.y += ((4.1 - cursor.ny * 1.6) - this.swimTarget.y) * dt * 1.2;
      this.pos.lerp(this.swimTarget, 1 - Math.exp(-dt * swimSpeed));
    } else {
      // calm float: sine rise/sink + drift toward center + behavior offsets
      const floatY = this.baseY + Math.sin(time * 0.7) * 0.55 + Math.sin(time * 1.7) * 0.08;
      const driftX = Math.sin(time * 0.4) * 0.18;
      const want = new THREE.Vector3(driftX, floatY, Math.cos(time * 0.3) * 0.1);
      if (this.behavior?.name === 'chasbubble') want.x += Math.sin(time * 3) * 0.3;
      if (this.behavior?.name === 'tapglass' || this.behavior?.name === 'pokeout') {
        want.x += this.punchSide * 0.45; want.z = 0.45;
      }
      if (this.holdingGlass > 0.02) { want.x += (this.cursorGlass.x * 0.5 - want.x) * this.holdingGlass; want.z = 0.5 * this.holdingGlass; }
      this.pos.lerp(want, 1 - Math.exp(-dt * (1.6 + anger)));
    }

    // breathing
    const breathRate = 1.6 + anger * 4.5;
    const breath = Math.sin(time * breathRate) * (0.03 + anger * 0.05);
    // growth with anger
    const grow = 1 + anger * 0.22 + (em.lock === 'MAXGRIN' ? 0.25 : 0);
    this.m.group.position.copy(this.pos);
    // face glass when interacting: yaw toward camera/cursor
    let yawT = Math.sin(time * 0.5) * 0.2 + cursor.nx * 0.35;
    if (em.lock === 'MAXFREEZE' || em.lock === 'MAXGRIN') yawT = 0;
    if (this.behavior?.name === 'turnaway') yawT = 2.4;
    if (anger > 0.6) yawT = cursor.nx * 0.6;
    this.m.group.rotation.y += (yawT - this.m.group.rotation.y) * (1 - Math.exp(-dt * 3));
    // idle spin behavior
    if (this.behavior?.name === 'spin') this.m.group.rotation.y += dt * 2.2;
    this.m.group.rotation.z = Math.sin(time * 0.8) * 0.05;
    this.m.body.scale.set(grow * (1 + breath), grow * (1 - breath * 0.7), grow);

    // horns grow with anger
    const hornS = 1 + anger * 1.1 + (em.lock === 'MAXGRIN' ? 0.6 : 0);
    r.hornL.scale.setScalar(hornS);
    r.hornR.scale.setScalar(hornS);

    // body glow
    r.bodyMat.emissiveIntensity = 0.9 + anger * 2.2 + Math.sin(time * 3.2) * 0.15 + (em.lock === 'MAXGRIN' ? 1.2 : 0);
    r.hornMat.emissiveIntensity = 1.4 + anger * 3;
    r.mouthMat.emissiveIntensity = 1.2 + anger * 2.4;

    // head look toward cursor
    const hx = THREE.MathUtils.clamp(cursor.nx * (0.3 + anger * 0.4), -0.5, 0.5);
    const hy = THREE.MathUtils.clamp(-cursor.ny * 0.25, -0.3, 0.3);
    r.headG.rotation.y += (hx - r.headG.rotation.y) * (1 - Math.exp(-dt * 4));
    r.headG.rotation.x += (hy - r.headG.rotation.x) * (1 - Math.exp(-dt * 4));
    if (this.behavior?.name === 'headshake' || (em.state === 'ANNOYED' && Math.sin(time * 0.9) > 0.7)) {
      r.headG.rotation.y += Math.sin(time * 9) * 0.18;
    }

    // arms
    this.updateArms(dt, time, anger);

    // legs drift
    r.legL.position.y = -0.55 + Math.sin(time * 2.1) * 0.06;
    r.legR.position.y = -0.55 + Math.sin(time * 2.1 + 1.4) * 0.06;

    // blink
    this.blinkT -= dt * (1 + anger * 0.8);
    if (this.blinkT <= 0) { this.blinkT = 1.8 + Math.random() * 3.2; this.face.blink = 1; }
    this.face.blink = Math.max(0, this.face.blink - dt * 6);
    // yawn keeps eyes closed
    if (this.behavior?.name === 'yawn') this.face.blink = Math.max(this.face.blink, 0.7);

    // random idle behaviors
    this.behaviorT -= dt;
    if (!this.behavior && this.behaviorT <= 0 && !em.lock) {
      this.behaviorT = 4 + Math.random() * 6 - anger * 2;
      const pool = em.anger < 0.3
        ? ['chasbubble', 'pokeout', 'yawn', 'stretch', 'spin', 'lookbored']
        : em.anger < 0.6 ? ['headshake', 'point', 'pushlava'] : ['point', 'pushlava', 'headshake'];
      this.startBehavior(pool[Math.floor(Math.random() * pool.length)], 2.2);
    }
    if (this.behavior) {
      this.behavior.t += dt;
      if (this.behavior.name === 'pushlava' && Math.random() < dt * 8) hooks.lava.burst(3);
      if (this.behavior.t > this.behavior.dur) this.behavior = null;
    }

    // viscous deformation of torso + head vertices
    this.deform(r.torsoGeo, time, 0.035 + anger * 0.03, 1.6 + anger * 2);
    this.deform(r.headGeo, time * 1.2 + 5, 0.02 + anger * 0.015, 2.0 + anger * 2);

    // lava gather during max event
    hooks.lava.gather += (((em.lock === 'MAXGRIN') ? 1 : anger > 0.8 ? 0.6 : 0) - hooks.lava.gather) * (1 - Math.exp(-dt * 2));

    this.face.update(dt, time);
  }

  updateArms(dt, time, anger) {
    const r = this.r;
    const sincePunch = this.em.time - this.punchT;
    const punching = sincePunch < 0.55;
    // crossed-arms target when annoyed/angry idle
    const wantCross = (!this.em.lock && (this.em.state === 'ANNOYED' || this.em.state === 'ANGRY') && !punching) ? 1 : 0;
    this.crossed += (wantCross - this.crossed) * (1 - Math.exp(-dt * 4));

    // default relaxed pose
    const sw = Math.sin(time * 1.8) * 0.08;
    let lPos = new THREE.Vector3(-0.66, 0.28 + sw * 0.3, 0.05);
    let rPos = new THREE.Vector3(0.66, 0.28 - sw * 0.3, 0.05);
    let lRot = new THREE.Euler(0, 0, 0.35 + sw);
    let rRot = new THREE.Euler(0, 0, -0.35 - sw);

    if (this.behavior?.name === 'stretch') {
      lPos.y += 0.35; rPos.y += 0.35;
      lRot.z = 2.4; rRot.z = -2.4;
    }
    if (this.crossed > 0.02) {
      const c = this.crossed;
      lPos.lerp(new THREE.Vector3(-0.15, 0.05, 0.55), c);
      rPos.lerp(new THREE.Vector3(0.15, 0.0, 0.55), c);
      lRot.z += c * -0.9; rRot.z += c * 0.9;
    }
    if (this.behavior?.name === 'point' || (this.em.state === 'ANGRY' && Math.sin(time * 0.7) > 0.4)) {
      rPos.set(0.5, 0.4, 0.6); rRot.set(-1.2, 0, -0.2); // point at player
    }
    if (this.holdingGlass > 0.02) {
      const h = this.holdingGlass;
      rPos.lerp(new THREE.Vector3(0.3, 0.2, 0.62), h);
      rRot.set(-0.6 * h, 0, -0.3 * h);
    }
    if (this.behavior?.name === 'turnaway') { lRot.z = 1.2; rRot.z = -1.2; }
    if (punching) {
      // elastic stretch punch toward glass
      const ph = Math.sin(Math.min(1, sincePunch / 0.55) * Math.PI);
      const side = this.punchSide;
      if (side < 0) { lPos.set(-0.5, 0.3, 0.75); lPos.x -= ph * 0.15; lRot.set(-1.3, 0.4, 0.2); r.armL.scale.set(1, 1 + ph * 0.9, 1); }
      else { rPos.set(0.5, 0.3, 0.75); rPos.x += ph * 0.15; rRot.set(-1.3, -0.4, -0.2); r.armR.scale.set(1, 1 + ph * 0.9, 1); }
    } else {
      r.armL.scale.set(1, 1, 1); r.armR.scale.set(1, 1, 1);
    }
    // fist shake when furious
    if (this.em.state === 'FURIOUS' && !this.em.lock) {
      lPos.y += Math.abs(Math.sin(time * 10)) * 0.15;
      rPos.y += Math.abs(Math.cos(time * 10)) * 0.15;
    }
    // max-event windup: pull right arm back
    if (this.em.lock === 'MAXGRIN') {
      rPos.set(0.9, 0.5, -0.3); rRot.set(0.6, 0, -1.4);
      r.armR.scale.set(1.2, 1.4, 1.2);
    }
    if (this.em.lock === 'MAXPUNCH') {
      const k = 1 - Math.exp(-dt * 18);
      rPos.lerp(new THREE.Vector3(0.1, 0.3, 0.85), k);
    }

    r.armL.position.lerp(lPos, 1 - Math.exp(-dt * 8));
    r.armR.position.lerp(rPos, 1 - Math.exp(-dt * 8));
    r.armL.rotation.set(lRot.x, lRot.y, lRot.z);
    r.armR.rotation.set(rRot.x, rRot.y, rRot.z);
  }

  updateMaxTimeline(dt) {
    const em = this.em, hooks = this.hooks;
    this.seqT += dt;
    const t = this.seqT;
    if (em.lock === 'MAXFREEZE') {
      // 1s stillness, staring at camera
      this.face.lookTgt.set(0, 0);
      if (t > 1.0) { em.lock = 'MAXGRIN'; this.seqT = 0; hooks.sound.growl(1); }
    } else if (em.lock === 'MAXGRIN') {
      hooks.lava.gather = Math.min(1, hooks.lava.gather + dt);
      if (t > 1.6) {
        em.lock = 'MAXPUNCH'; this.seqT = 0;
        // impact!
        const lamp = hooks.lamp;
        lamp.setCracks(1);
        lamp.flash.material.opacity = 0.85;
        lamp.shockwave(this.pos.y, 2.2);
        hooks.rig.impulse(1.0);
        hooks.sound.impact(1.4);
        hooks.lava.burst(40);
        hooks.particles.burst(120);
        hooks.postAberrate?.(1.0);
        this.hardPunchAtGlass();
      }
    } else if (em.lock === 'MAXPUNCH') {
      if (t > 1.1) {
        hooks.lamp.setCracks(0.85);
        em.lock = 'SORRY'; this.seqT = 0;
        this.startBehavior('noticedcracks', 3.2);
        hooks.sound.squeak?.();
      }
    } else if (em.lock === 'SORRY') {
      // cracks fade, monster repairs + turns away, anger resets
      const k = Math.max(0, 1 - t / 2.5);
      hooks.lamp.setCracks(k * 0.85);
      if (t > 1.2 && !this._turned) { this._turned = true; this.startBehavior('turnaway', 2.6); }
      if (t > 3.4) {
        this._turned = false;
        em.lock = null; em.lockT = 0;
        em.anger = 0.12; em.clicks = 0;
        em.lastHit = em.time;
        em.maxDoneCooldown = 6;
        this.behavior = null;
      }
    }
  }

  hardPunchAtGlass() {
    this.punchT = this.em.time;
    this.punchSide = 1;
  }

  deform(geo, time, amp, freq) {
    const pos = geo.attributes.position;
    const base = geo.userData.base;
    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const bx = base[ix], by = base[ix + 1], bz = base[ix + 2];
      const n = Math.sin(bx * 4 + time * freq) * Math.cos(by * 3.4 + time * freq * 0.8) * Math.sin(bz * 5 + time * freq * 1.2);
      const d = 1 + n * amp;
      pos.array[ix] = bx * d;
      pos.array[ix + 1] = by * d;
      pos.array[ix + 2] = bz * d;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  clampTarget() {
    this.swimTarget.x = THREE.MathUtils.clamp(this.swimTarget.x, -0.55, 0.55);
    this.swimTarget.y = THREE.MathUtils.clamp(this.swimTarget.y, this.bounds.bottom + 0.75, this.bounds.top - 0.55);
    this.swimTarget.z = THREE.MathUtils.clamp(this.swimTarget.z, -0.45, 0.45);
  }
}
