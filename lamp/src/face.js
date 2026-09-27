import * as THREE from 'three';

// Procedural face: blends brow angle/height, eyelid openness, pupil,
// mouth corners (smile/frown), jaw open, teeth.
export class Face {
  constructor(refs) {
    this.r = refs;
    this.cur = { browAngle: 0, browY: 0, eyeOpen: 1, mouthSmile: 0.6, mouthOpen: 0.12, pupilS: 1, eyeBright: 1 };
    this.tgt = { ...this.cur };
    this.blink = 0; // 0..1 lid closure impulse
    this.look = new THREE.Vector2(0, 0);
    this.lookTgt = new THREE.Vector2(0, 0);
  }

  setTargetsFor(state, anger) {
    const t = this.tgt;
    switch (state) {
      case 'CALM':
        Object.assign(t, { browAngle: 0, browY: 0, eyeOpen: 0.85, mouthSmile: 0.55, mouthOpen: 0.12, pupilS: 1, eyeBright: 1 }); break;
      case 'CURIOUS':
        Object.assign(t, { browAngle: 0.05, browY: 0.02, eyeOpen: 1.15, mouthSmile: 0.35, mouthOpen: 0.18, pupilS: 1.25, eyeBright: 1.2 }); break;
      case 'CONFUSED':
        Object.assign(t, { browAngle: 0.35, browY: -0.01, eyeOpen: 0.9, mouthSmile: -0.1, mouthOpen: 0.15, pupilS: 0.95, eyeBright: 1.1 }); break;
      case 'ANNOYED':
        Object.assign(t, { browAngle: -0.55, browY: -0.03, eyeOpen: 0.62, mouthSmile: -0.55, mouthOpen: 0.1, pupilS: 0.85, eyeBright: 1.3 }); break;
      case 'ANGRY':
        Object.assign(t, { browAngle: -0.9, browY: -0.05, eyeOpen: 0.5, mouthSmile: -0.8, mouthOpen: 0.3, pupilS: 0.75, eyeBright: 1.8 }); break;
      case 'FURIOUS':
        Object.assign(t, { browAngle: -1.1, browY: -0.07, eyeOpen: 0.55, mouthSmile: -0.4, mouthOpen: 0.75, pupilS: 0.7, eyeBright: 2.6 }); break;
      case 'GRIN': // max-event exaggerated angry grin
        Object.assign(t, { browAngle: -1.0, browY: -0.06, eyeOpen: 0.9, mouthSmile: -0.9, mouthOpen: 0.85, pupilS: 0.6, eyeBright: 3.4 }); break;
      case 'SURPRISED':
        Object.assign(t, { browAngle: 0.5, browY: 0.06, eyeOpen: 1.4, mouthSmile: 0.0, mouthOpen: 0.5, pupilS: 0.7, eyeBright: 1.6 }); break;
      case 'EMBARRASSED':
        Object.assign(t, { browAngle: 0.45, browY: 0.03, eyeOpen: 0.8, mouthSmile: 0.7, mouthOpen: 0.2, pupilS: 1.1, eyeBright: 0.9 }); break;
      case 'HAPPY': // friendship hold
        Object.assign(t, { browAngle: 0.25, browY: 0.02, eyeOpen: 0.7, mouthSmile: 1.0, mouthOpen: 0.25, pupilS: 1.15, eyeBright: 1.3 }); break;
      default:
        Object.assign(t, { browAngle: 0, browY: 0, eyeOpen: 0.85, mouthSmile: 0.55, mouthOpen: 0.12, pupilS: 1, eyeBright: 1 });
    }
    // anger adds edge even within state
    t.eyeBright += anger * 0.8;
  }

  update(dt, time) {
    const k = 1 - Math.exp(-dt * 5);
    for (const key of Object.keys(this.cur)) this.cur[key] += (this.tgt[key] - this.cur[key]) * k;
    const c = this.cur;
    const r = this.r;

    // brows: rotation.z mirrored + height
    r.browL.rotation.z = c.browAngle * 0.55;
    r.browR.rotation.z = -c.browAngle * 0.55;
    // confused asymmetry handled by caller via extra offset if needed
    r.browL.position.y = 0.28 + c.browY;
    r.browR.position.y = 0.28 + c.browY;
    r.browL.position.z = r.browR.position.z = 0.4 - Math.abs(c.browAngle) * 0.03;

    // eyelids: scale eye + drop lid
    const open = THREE.MathUtils.clamp(c.eyeOpen - this.blink * 1.2, 0.06, 1.5);
    r.eyeL.scale.set(1, 1.15 * open, 0.6);
    r.eyeR.scale.set(1, 1.15 * open, 0.6);
    r.lidL.position.y = 0.09 + (1 - open) * 0.1;
    r.lidR.position.y = 0.09 + (1 - open) * 0.1;
    r.lidL.scale.set(1, 0.4 + (1 - open) * 1.3, 0.7);
    r.lidR.scale.set(1, 0.4 + (1 - open) * 1.3, 0.7);

    // pupils track look + scale
    const lk = this.look;
    lk.lerp(this.lookTgt, 1 - Math.exp(-dt * 6));
    r.pupilL.position.set(-0.2 + lk.x * 0.05, 0.05 + lk.y * 0.04, 0.52);
    r.pupilR.position.set(0.2 + lk.x * 0.05, 0.05 + lk.y * 0.04, 0.52);
    r.pupilL.scale.setScalar(c.pupilS);
    r.pupilR.scale.setScalar(c.pupilS);

    // eye glow
    const flicker = 1 + Math.sin(time * 7.3) * 0.06;
    r.glowEyeL.emissiveIntensity = 3.0 * c.eyeBright * flicker;
    r.glowEyeR.emissiveIntensity = 3.0 * c.eyeBright * flicker;

    // mouth: smile (+) vs frown (−); jaw open scales mouth + drops jaw
    const m = r.mouth;
    if (c.mouthSmile >= 0) {
      m.rotation.z = Math.PI + c.mouthSmile * 0.0; // keep arc, morph scale instead
      m.scale.set(0.8 + c.mouthSmile * 0.5, 0.7 + c.mouthOpen * 1.6 + c.mouthSmile * 0.2, 1);
      r.mouthG.position.y = -0.28 - c.mouthOpen * 0.06;
    } else {
      m.rotation.z = 0; // flipped arc = frown
      m.scale.set(0.8 + Math.abs(c.mouthSmile) * 0.3, 0.6 + c.mouthOpen * 1.6, 1);
      r.mouthG.position.y = -0.26 - c.mouthOpen * 0.06;
    }
    r.teethG.visible = c.mouthOpen > 0.4;
  }
}
