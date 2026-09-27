import * as THREE from 'three';

// Classic lava lamp silhouette: brushed-metal base, glass chamber, tapered cap.
export function createLamp(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x2a2e38, metalness: 0.95, roughness: 0.34, envMapIntensity: 1.0
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x14161c, metalness: 0.85, roughness: 0.45
  });

  // wide metallic base (lathe for rounded premium profile)
  const basePts = [];
  basePts.push(new THREE.Vector2(0.0, 0.0));
  basePts.push(new THREE.Vector2(1.75, 0.0));
  basePts.push(new THREE.Vector2(1.8, 0.18));
  basePts.push(new THREE.Vector2(1.55, 0.55));
  basePts.push(new THREE.Vector2(1.0, 0.85));
  basePts.push(new THREE.Vector2(0.55, 1.0));
  basePts.push(new THREE.Vector2(0.42, 1.15));
  const base = new THREE.Mesh(new THREE.LatheGeometry(basePts, 64), metalMat);
  base.position.y = 0.22;
  base.castShadow = true;
  group.add(base);

  // glowing power ring on base
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.62, 0.03, 12, 96),
    new THREE.MeshBasicMaterial({ color: 0xff5a00 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.5;
  group.add(ring);

  // narrow lower connection
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.5, 48), darkMetal);
  neck.position.y = 1.45;
  group.add(neck);

  // ---- glass chamber ----
  const CHAMBER_H = 5.2;
  const chamberY = 1.7 + CHAMBER_H / 2; // bottom at y=1.7
  const glassGeo = new THREE.CylinderGeometry(1.02, 1.22, CHAMBER_H, 64, 1, true);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.06,
    transmission: 1.0, thickness: 0.35, ior: 1.45,
    transparent: true, opacity: 1.0,
    clearcoat: 1, clearcoatRoughness: 0.08,
    side: THREE.DoubleSide, depthWrite: false
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.y = chamberY;
  glass.renderOrder = 10;
  group.add(glass);

  // glass bottom + top seals
  const sealMat = darkMetal;
  const bottomSeal = new THREE.Mesh(new THREE.CylinderGeometry(1.24, 1.24, 0.16, 64), sealMat);
  bottomSeal.position.y = 1.68;
  group.add(bottomSeal);
  const topSeal = new THREE.Mesh(new THREE.CylinderGeometry(1.04, 1.04, 0.16, 64), sealMat);
  topSeal.position.y = 1.7 + CHAMBER_H;
  group.add(topSeal);

  // dark transparent liquid inside
  const liquid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.96, 1.14, CHAMBER_H - 0.15, 48, 1, false),
    new THREE.MeshPhysicalMaterial({
      color: 0x1a0508, transparent: true, opacity: 0.62,
      roughness: 0.15, metalness: 0, transmission: 0.4, thickness: 1.2,
      emissive: 0x300802, emissiveIntensity: 0.5, depthWrite: false
    })
  );
  liquid.position.y = chamberY;
  liquid.renderOrder = 2;
  group.add(liquid);

  // tapered metallic cap (lathe)
  const capPts = [];
  capPts.push(new THREE.Vector2(1.06, 0));
  capPts.push(new THREE.Vector2(1.0, 0.35));
  capPts.push(new THREE.Vector2(0.62, 0.8));
  capPts.push(new THREE.Vector2(0.34, 1.05));
  capPts.push(new THREE.Vector2(0.0, 1.12));
  const cap = new THREE.Mesh(new THREE.LatheGeometry(capPts, 64), metalMat);
  cap.position.y = 1.7 + CHAMBER_H + 0.08;
  cap.castShadow = true;
  group.add(cap);

  // crack overlay (for max-anger event) — curved plane hugging glass
  const crackTex = makeCrackTexture();
  const cracks = new THREE.Mesh(
    new THREE.CylinderGeometry(1.04, 1.24, CHAMBER_H * 0.95, 32, 1, true),
    new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })
  );
  cracks.position.y = chamberY;
  cracks.renderOrder = 11;
  group.add(cracks);

  // shockwave ring (expands on punch)
  const shock = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.05, 10, 64),
    new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  shock.rotation.x = Math.PI / 2;
  shock.renderOrder = 12;
  group.add(shock);

  // flash plane for impact
  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffcc88, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  flash.position.set(0, chamberY, 0);
  flash.renderOrder = 20;
  group.add(flash);

  const bounds = { bottom: 1.95, top: 1.7 + CHAMBER_H - 0.45, radius: 0.78, centerY: chamberY };

  return {
    group, glass, liquid, cap, base, ring, cracks, shock, flash, bounds, chamberY,
    setCracks(v) { cracks.material.opacity = v; },
    shockwave(y, strength = 1) {
      shock.position.y = y;
      shock.scale.setScalar(0.3);
      shock.material.opacity = 0.9 * strength;
      shock.userData.expand = strength;
    },
    updateShock(dt) {
      if (shock.material.opacity > 0.01) {
        const s = shock.scale.x + dt * 6 * (shock.userData.expand || 1);
        shock.scale.setScalar(s);
        shock.material.opacity *= Math.exp(-dt * 3.2);
      }
      if (flash.material.opacity > 0.01) flash.material.opacity *= Math.exp(-dt * 6);
    }
  };
}

function makeCrackTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(255,240,220,0.95)';
  g.lineWidth = 2;
  // radial cracks from a few impact centers
  const centers = [[256, 260], [150, 330], [360, 180]];
  for (const [cx, cy] of centers) {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
      g.beginPath();
      g.moveTo(cx, cy);
      let x = cx, y = cy;
      for (let s = 0; s < 6; s++) {
        x += Math.cos(a + (Math.random() - 0.5) * 0.5) * (18 + Math.random() * 30);
        y += Math.sin(a + (Math.random() - 0.5) * 0.5) * (18 + Math.random() * 30);
        g.lineTo(x, y);
      }
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  return t;
}
