import * as THREE from 'three';

export function createScene(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070e);
  scene.fog = new THREE.FogExp2(0x05070e, 0.055);

  // backdrop gradient dome
  const domeGeo = new THREE.SphereGeometry(40, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.6);
  const domeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color(0x0a1226) },
      mid: { value: new THREE.Color(0x070a16) },
      bot: { value: new THREE.Color(0x120705) }
    },
    vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec3 vP; uniform vec3 top,mid,bot;
      void main(){ float h=normalize(vP).y*0.5+0.5;
        vec3 c=mix(bot,mix(mid,top,smoothstep(0.35,0.9,h)),smoothstep(0.0,0.45,h));
        gl_FragColor=vec4(c,1.0); }`
  });
  scene.add(new THREE.Mesh(domeGeo, domeMat));

  // floor: dark reflective
  const floorGeo = new THREE.CircleGeometry(24, 64);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0d16, metalness: 0.85, roughness: 0.32,
    envMapIntensity: 0.7
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // fake glow pool under lamp
  const glowTex = makeRadialTexture();
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xff5a1a })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.02;
  scene.add(pool);

  // pedestal disc
  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.7, 0.22, 64),
    new THREE.MeshStandardMaterial({ color: 0x11141d, metalness: 0.7, roughness: 0.4 })
  );
  ped.position.y = 0.11;
  ped.receiveShadow = true;
  scene.add(ped);

  return { scene, glowPool: pool };
}

function makeRadialTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 4, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  return t;
}
