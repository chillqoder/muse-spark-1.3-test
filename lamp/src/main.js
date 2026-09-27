import * as THREE from 'three';
import { createScene } from './scene.js';
import { CameraRig } from './cameraRig.js';
import { createLights } from './lighting.js';
import { createLamp } from './lamp.js';
import { LavaSim } from './lava.js';
import { createMonster } from './monster.js';
import { Face } from './face.js';
import { Emotion } from './emotion.js';
import { MonsterAnimator } from './animation.js';
import { ParticleSystem } from './particles.js';
import { SoundEngine } from './sound.js';
import { createPost } from './post.js';
import { setupInteraction } from './interaction.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);

const { scene, glowPool } = createScene(renderer);
const rig = new CameraRig(camera, canvas);
const lights = createLights(scene);
const lamp = createLamp(scene);
const lava = new LavaSim(scene, lamp.bounds);
const monster = createMonster();
scene.add(monster.group);
const face = new Face(monster.refs);
const emotion = new Emotion();
const particles = new ParticleSystem(scene, lamp.bounds);
const sound = new SoundEngine();
const post = createPost(renderer, scene, camera);

const animator = new MonsterAnimator(monster, face, emotion, lamp.bounds, {
  lava, lamp, rig, sound, particles,
  postAberrate: (v) => post.aberrate(v)
});

const toast = document.getElementById('toast');
const inter = setupInteraction({
  renderer, camera, lamp, emotion, animator, sound, rig, lava, particles, toast
});

const soundBtn = document.getElementById('soundBtn');
soundBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  sound.ensure();
  sound.setEnabled(!sound.enabled);
  soundBtn.classList.toggle('off', !sound.enabled);
});

// environment reflections for metals/glass
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x0a0d18);
  const top = new THREE.Mesh(
    new THREE.SphereGeometry(5, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x8899ff })
  );
  top.position.set(-4, 6, -4);
  envScene.add(top);
  const warm = new THREE.Mesh(
    new THREE.SphereGeometry(3, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xff6611 })
  );
  warm.position.set(0, 2, 3);
  envScene.add(warm);
  scene.environment = pmrem.fromScene(envScene, 0.06).texture;
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  post.resize();
});

const clock = new THREE.Clock();
let elapsed = 0;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  emotion.time = elapsed;

  emotion.update(dt, elapsed);

  // max-anger trigger
  if (emotion.shouldTriggerMax) animator.startMaxEvent();

  animator.update(dt, elapsed, inter.cursor);
  lava.update(dt, elapsed, emotion.anger, animator.pos);
  particles.update(dt, emotion.anger, elapsed);
  lights.update(emotion.anger, elapsed);
  lights.monsterLight.position.copy(animator.pos).add(new THREE.Vector3(0, 0.4, 0.8));
  lights.lavaLight.position.set(animator.pos.x * 0.3, animator.pos.y, animator.pos.z * 0.3);

  inter.updateHold(dt);
  inter.updateGlassPulse(dt);
  lamp.updateShock(dt);
  // lamp shake at high anger
  const shake = emotion.anger > 0.7 ? (emotion.anger - 0.7) * 0.06 : 0;
  lamp.group.position.x = Math.sin(elapsed * 40) * shake;
  lamp.group.position.z = Math.cos(elapsed * 33) * shake;
  lamp.ring.material.color.setHSL(0.05 - emotion.anger * 0.03, 1, 0.5 + Math.sin(elapsed * 3) * 0.08);

  // glow pool breathes with anger
  glowPool.material.opacity = 0.35 + emotion.anger * 0.4 + Math.sin(elapsed * 2.2) * 0.06;

  rig.update(dt);
  post.update(dt, elapsed, emotion.anger);
  post.composer.render();
}
frame();
