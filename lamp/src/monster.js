import * as THREE from 'three';

export function makeCrackEmissiveTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, 512, 512);
  // glowing cracks: random branching orange lines on black
  for (let i = 0; i < 46; i++) {
    let x = Math.random() * 512, y = Math.random() * 512;
    let a = Math.random() * Math.PI * 2;
    g.strokeStyle = `rgba(255,${90 + Math.random() * 90 | 0},10,${0.5 + Math.random() * 0.5})`;
    g.lineWidth = 1 + Math.random() * 3;
    g.beginPath();
    g.moveTo(x, y);
    for (let s = 0; s < 8; s++) {
      a += (Math.random() - 0.5) * 1.1;
      x += Math.cos(a) * (12 + Math.random() * 26);
      y += Math.sin(a) * (12 + Math.random() * 26);
      g.lineTo(x, y);
    }
    g.stroke();
  }
  // hot blotches
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 512, y = Math.random() * 512, r = 8 + Math.random() * 26;
    const gr = g.createRadialGradient(x, y, 1, x, y, r);
    gr.addColorStop(0, 'rgba(255,200,60,0.85)');
    gr.addColorStop(0.4, 'rgba(255,110,10,0.4)');
    gr.addColorStop(1, 'rgba(255,80,0,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Builds the molten creature. Returns { group, refs }.
// Height ~1.9 units ≈ 40% of chamber (5.2).
export function createMonster() {
  const crackTex = makeCrackEmissiveTexture();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x2a0a08,
    roughness: 0.62,
    metalness: 0.08,
    emissive: 0xffffff,
    emissiveMap: crackTex,
    emissiveIntensity: 1.1
  });
  const crustMat = new THREE.MeshStandardMaterial({
    color: 0x1c0605, roughness: 0.85, metalness: 0.05,
    emissive: 0xff3300, emissiveIntensity: 0.25
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xffcc44, emissive: 0xffb300, emissiveIntensity: 3.2, roughness: 0.2
  });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x080303, roughness: 0.25 });
  const mouthMat = new THREE.MeshStandardMaterial({
    color: 0x180404, emissive: 0xff6600, emissiveIntensity: 1.6, roughness: 0.4
  });

  const group = new THREE.Group();
  const body = new THREE.Group(); // deformable core anchor
  group.add(body);

  // torso: broad upper, compact rounded
  const torsoGeo = new THREE.SphereGeometry(0.62, 48, 32);
  const torso = new THREE.Mesh(torsoGeo, bodyMat);
  torso.scale.set(1.12, 1.0, 0.92);
  torso.position.y = 0.1;
  torso.castShadow = true;
  body.add(torso);
  torsoGeo.userData.base = torsoGeo.attributes.position.array.slice();

  // belly (slightly lighter hot area near joints — separate glow patch)
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 16), new THREE.MeshStandardMaterial({
    color: 0x531006, emissive: 0xff5a00, emissiveIntensity: 1.4, roughness: 0.5
  }));
  belly.position.set(0, -0.18, 0.38);
  belly.scale.set(1, 1.1, 0.55);
  body.add(belly);

  // head: oversized
  const headG = new THREE.Group();
  headG.position.set(0, 0.86, 0.05);
  body.add(headG);
  const headGeo = new THREE.SphereGeometry(0.5, 48, 32);
  const head = new THREE.Mesh(headGeo, bodyMat);
  head.scale.set(1.05, 0.95, 0.95);
  head.castShadow = true;
  headG.add(head);
  headGeo.userData.base = headGeo.attributes.position.array.slice();

  // horns: lava protrusions
  const hornGeo = new THREE.ConeGeometry(0.11, 0.34, 16);
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x330b06, emissive: 0xff4400, emissiveIntensity: 1.8, roughness: 0.5 });
  const hornL = new THREE.Mesh(hornGeo, hornMat);
  hornL.position.set(-0.28, 0.5, -0.02);
  hornL.rotation.z = 0.5;
  const hornR = hornL.clone();
  hornR.position.x = 0.28;
  hornR.rotation.z = -0.5;
  headG.add(hornL, hornR);

  // brows: thick dark crust slabs
  const browGeo = new THREE.BoxGeometry(0.26, 0.09, 0.12);
  const browL = new THREE.Mesh(browGeo, crustMat);
  browL.position.set(-0.2, 0.28, 0.4);
  const browR = new THREE.Mesh(browGeo, crustMat);
  browR.position.set(0.2, 0.28, 0.4);
  headG.add(browL, browR);

  // eyes: glowing + dark pupils + eyelids
  const eyeGeo = new THREE.SphereGeometry(0.13, 24, 18);
  const eyeL = new THREE.Mesh(eyeGeo, glowMat.clone());
  eyeL.position.set(-0.2, 0.05, 0.42);
  eyeL.scale.set(1, 1.15, 0.6);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.2;
  headG.add(eyeL, eyeR);

  const pupilGeo = new THREE.SphereGeometry(0.05, 16, 12);
  const pupilL = new THREE.Mesh(pupilGeo, pupilMat);
  pupilL.position.set(-0.2, 0.05, 0.52);
  const pupilR = pupilL.clone();
  pupilR.position.x = 0.2;
  headG.add(pupilL, pupilR);

  const lidGeo = new THREE.SphereGeometry(0.145, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const lidL = new THREE.Mesh(lidGeo, crustMat);
  lidL.position.set(-0.2, 0.09, 0.42);
  lidL.rotation.x = -0.5;
  lidL.scale.set(1, 1, 0.7);
  const lidR = lidL.clone();
  lidR.position.x = 0.2;
  headG.add(lidL, lidR);

  // cheeks
  const cheekGeo = new THREE.SphereGeometry(0.09, 14, 10);
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0x3a0d06, emissive: 0xff4400, emissiveIntensity: 1.2 });
  const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
  cheekL.position.set(-0.3, -0.18, 0.35);
  cheekL.scale.set(1, 0.7, 0.6);
  const cheekR = cheekL.clone(); cheekR.position.x = 0.3;
  headG.add(cheekL, cheekR);

  // mouth group (jaw): torus arc + teeth
  const mouthG = new THREE.Group();
  mouthG.position.set(0, -0.28, 0.4);
  headG.add(mouthG);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 10, 28, Math.PI), mouthMat);
  mouth.rotation.z = Math.PI; // smile arc opening upward? tuned in face.js
  mouthG.add(mouth);
  const teethG = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 8), new THREE.MeshStandardMaterial({ color: 0x140505, roughness: 0.7 }));
    t.position.set(-0.09 + i * 0.06, 0.02, 0.02);
    t.rotation.x = Math.PI;
    teethG.add(t);
  }
  teethG.visible = false;
  mouthG.add(teethG);

  // arms: short capsules with paw spheres
  const armGeo = new THREE.CapsuleGeometry(0.13, 0.34, 6, 14);
  const armL = new THREE.Group();
  armL.position.set(-0.66, 0.28, 0.05);
  const armLM = new THREE.Mesh(armGeo, bodyMat);
  armLM.position.y = -0.2;
  armLM.rotation.z = 0.25;
  const pawL = new THREE.Mesh(new THREE.SphereGeometry(0.14, 18, 14), bodyMat);
  pawL.position.set(-0.1, -0.42, 0.02);
  armL.add(armLM, pawL);
  const armR = new THREE.Group();
  armR.position.set(0.66, 0.28, 0.05);
  const armRM = new THREE.Mesh(armGeo, bodyMat);
  armRM.position.y = -0.2;
  armRM.rotation.z = -0.25;
  const pawR = pawL.clone();
  pawR.position.set(0.1, -0.42, 0.02);
  armR.add(armRM, pawR);
  body.add(armL, armR);

  // legs: small partially-formed floating nubs
  const legGeo = new THREE.SphereGeometry(0.17, 18, 14);
  const legL = new THREE.Mesh(legGeo, bodyMat);
  legL.position.set(-0.28, -0.55, 0);
  legL.scale.set(1, 1.25, 1);
  const legR = legL.clone(); legR.position.x = 0.28;
  body.add(legL, legR);

  group.position.set(0, 4.0, 0);

  return {
    group, body,
    refs: {
      torso, torsoGeo, headG, head, headGeo, hornL, hornR, browL, browR,
      eyeL, eyeR, pupilL, pupilR, lidL, lidR, cheekL, cheekR,
      mouthG, mouth, teethG, armL, armR, pawL, legL, legR,
      bodyMat, glowEyeL: eyeL.material, glowEyeR: eyeR.material,
      hornMat, mouthMat, crackTex
    }
  };
}
