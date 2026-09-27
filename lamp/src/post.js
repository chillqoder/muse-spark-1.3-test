import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    aberration: { value: 0 },
    vignette: { value: 0.42 }
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    varying vec2 vUv; uniform sampler2D tDiffuse; uniform float aberration; uniform float vignette;
    void main(){
      vec2 d = vUv - 0.5;
      float r2 = dot(d,d);
      float ab = aberration * (0.0015 + r2 * 0.006);
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + d * ab * 8.0).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - d * ab * 8.0).b;
      float vig = smoothstep(0.95, 0.35, r2 * (1.6 + vignette));
      col *= mix(0.55, 1.0, vig);
      // subtle warm grade
      col = pow(col, vec3(0.98, 1.0, 1.04));
      gl_FragColor = vec4(col, 1.0);
    }`
};

export function createPost(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.75, 0.55, 0.78);
  composer.addPass(bloom);
  const grade = new ShaderPass(GradeShader);
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  let abBoost = 0;
  function aberrate(v) { abBoost = Math.min(1.5, abBoost + v); }

  function update(dt, time, anger) {
    abBoost = Math.max(0, abBoost - dt * 1.8);
    grade.uniforms.time.value = time;
    grade.uniforms.aberration.value = abBoost + anger * 0.12;
    bloom.strength = 0.65 + anger * 0.5 + abBoost * 0.6;
  }

  function resize() { composer.setSize(window.innerWidth, window.innerHeight); }

  return { composer, update, aberrate, resize };
}
