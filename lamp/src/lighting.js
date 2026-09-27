import * as THREE from 'three';

export function createLights(scene) {
  const lavaLight = new THREE.PointLight(0xff4d00, 60, 14, 1.8);
  lavaLight.position.set(0, 3.6, 0);
  scene.add(lavaLight);

  const monsterLight = new THREE.PointLight(0xff7a22, 12, 7, 1.9);
  monsterLight.position.set(0, 4.2, 1.2);
  scene.add(monsterLight);

  const rim = new THREE.DirectionalLight(0x4d7dff, 2.2);
  rim.position.set(-6, 7, -6);
  scene.add(rim);

  const key = new THREE.DirectionalLight(0xfff1dd, 0.55);
  key.position.set(4, 9, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const amb = new THREE.AmbientLight(0x1a2340, 1.1);
  scene.add(amb);

  const topGlow = new THREE.PointLight(0x334466, 8, 30, 2);
  topGlow.position.set(0, 10, -4);
  scene.add(topGlow);

  function update(anger, time) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 2.2);
    lavaLight.intensity = 42 + anger * 90 + pulse * (6 + anger * 22);
    lavaLight.color.setHSL(0.045 - anger * 0.03, 1.0, 0.5 + anger * 0.06);
    monsterLight.intensity = 8 + anger * 30 + Math.sin(time * 5.1) * 2;
    rim.intensity = 2.2 + anger * 0.6;
  }

  return { lavaLight, monsterLight, rim, key, update };
}
