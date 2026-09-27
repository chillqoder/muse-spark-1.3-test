import * as THREE from 'three';

// Clicks on glass raise anger; holding (>1s) calms (friendship).
// Tracks cursor NDC + glass hit point.
export function setupInteraction({ renderer, camera, lamp, emotion, animator, sound, rig, lava, particles, toast }) {
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  const cursor = { nx: 0, ny: 0 };
  let downAt = 0;
  let downPos = null;
  let holding = false;
  let holdFired = false;

  function setPtr(e) {
    ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
    ptr.y = -(e.clientY / window.innerHeight) * 2 + 1;
    cursor.nx = ptr.x;
    cursor.ny = -ptr.y;
  }
  window.addEventListener('pointermove', setPtr);

  function hitGlass(e) {
    setPtr(e);
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObject(lamp.glass, false);
    return hits.length ? hits[0] : null;
  }

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 1600);
  }

  renderer.domElement.addEventListener('pointerdown', (e) => {
    sound.ensure();
    const hit = hitGlass(e);
    if (!hit) return;
    downAt = performance.now();
    downPos = { x: e.clientX, y: e.clientY };
    holding = true;
    holdFired = false;
  });

  window.addEventListener('pointerup', (e) => {
    if (!holding) return;
    holding = false;
    const held = (performance.now() - downAt) / 1000;
    if (holdFired) return; // was a calming hold, not a click
    const hit = hitGlass(e);
    if (hit) registerClick(hit, held);
  });

  function registerClick(hit, held) {
    const now = emotion.time;
    emotion.poke(now);
    animator.pokeReaction();
    // glass vibration: quick scale pulse
    pulseGlass(0.12 + emotion.anger * 0.2);
    lava.burst(4 + Math.floor(emotion.anger * 10));
    particles.burst(8 + Math.floor(emotion.anger * 20));
    sound.tap(0.5 + emotion.anger);
    if (emotion.anger > 0.3 && emotion.anger < 0.6) sound.growl(0.3);
    if (emotion.anger >= 0.6) sound.growl(emotion.anger);

    const c = emotion.clicks;
    if (c === 1) showToast('it noticed you');
    else if (c === 3) showToast('it\'s confused…');
    else if (emotion.anger > 0.4 && emotion.anger < 0.55) showToast('it\'s getting annoyed');
    else if (emotion.anger >= 0.8 && emotion.anger < 1) showToast('it\'s FURIOUS — careful');

    void held;
  }

  // hold-to-calm watcher
  setInterval(() => {
    if (!holding || holdFired) return;
    if ((performance.now() - downAt) / 1000 > 1.0) {
      holdFired = true;
      showToast('it leans into your touch…');
      sound.splash();
    }
  }, 120);

  function updateHold(dt) {
    const target = (holding && holdFired) ? 1 : 0;
    animator.holdingGlass += (target - animator.holdingGlass) * (1 - Math.exp(-dt * 3));
    if (animator.holdingGlass > 0.5) {
      emotion.soothe(dt, 0.22);
      if (Math.random() < dt * 2) particles.burst(1);
    }
  }

  let glassPulse = 0;
  function pulseGlass(v) { glassPulse = Math.min(0.6, glassPulse + v); }
  function updateGlassPulse(dt) {
    if (glassPulse > 0.001) {
      glassPulse *= Math.exp(-dt * 5);
      const s = 1 + Math.sin(performance.now() * 0.05) * glassPulse * 0.03;
      lamp.glass.scale.set(s, 1, s);
    } else lamp.glass.scale.set(1, 1, 1);
  }

  return { cursor, updateHold, updateGlassPulse };
}
