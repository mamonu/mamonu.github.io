/*!
MIT License

Copyright (c) 2026 Ayush Shekhar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { LAB_SIGNALS } from './labs-signals.js';
import { isSignalActive, projectSignal } from './signal-projection.js';
import { createActivityScene } from './activity-scene.js';


export function createScene({ onPage, onTransition, onSettled, onProgress, onSignals, onActivity = () => {}, onError, initiallyCalm = false }) {
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.domElement.setAttribute('aria-hidden', 'true');
document.body.appendChild(renderer.domElement);
renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); onError(); });
renderer.domElement.addEventListener('webglcontextrestored', () => location.reload());

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05060d, 0.05);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 0.2, 8.4);

// ── BIG BRAIN — seen from outside first ──
const group = new THREE.Group();
scene.add(group);
const COUNT = 22000;
const home = new Float32Array(COUNT * 3);
const pos = new Float32Array(COUNT * 3);
const vel = new Float32Array(COUNT * 3);
const colors = new Float32Array(COUNT * 3);
const cbase = new Float32Array(COUNT * 3);
const c = new THREE.Color();
for (let i = 0; i < COUNT; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = Math.cbrt(Math.random());
  let x = Math.sin(phi) * Math.cos(theta) * 12.5 * r;
  let y = Math.cos(phi) * 8.75 * r;
  let z = Math.sin(phi) * Math.sin(theta) * 10.25 * r;
  x += x > 0 ? 1.4 : -1.4;
  x += (Math.random() - 0.5) * 1.4; y += (Math.random() - 0.5) * 1.4; z += (Math.random() - 0.5) * 1.4;
  home[i*3] = pos[i*3] = x; home[i*3+1] = pos[i*3+1] = y; home[i*3+2] = pos[i*3+2] = z;
  c.setHSL(0.72 - Math.random() * 0.14, 0.78, 0.52 + Math.random() * 0.18);
  colors[i*3] = cbase[i*3] = c.r; colors[i*3+1] = cbase[i*3+1] = c.g; colors[i*3+2] = cbase[i*3+2] = c.b;
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
const cloudMat = new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
const cloud = new THREE.Points(geo, cloudMat); cloud.frustumCulled = false; group.add(cloud);
const seg = [];
for (let i = 0; i < 260; i++) {
  const a = (Math.random() * COUNT) | 0; let best = -1, bd = 1e9;
  for (let k = 0; k < 6; k++) {
    const b = (Math.random() * COUNT) | 0;
    const dx = home[a*3]-home[b*3], dy = home[a*3+1]-home[b*3+1], dz = home[a*3+2]-home[b*3+2];
    const d = dx*dx+dy*dy+dz*dz; if (d < bd && b !== a) { bd = d; best = b; }
  }
  if (best >= 0) seg.push(home[a*3],home[a*3+1],home[a*3+2], home[best*3],home[best*3+1],home[best*3+2]);
}
const lgeo = new THREE.BufferGeometry();
lgeo.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
const lines = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending }));
group.add(lines);

// ── HERO BRAIN — pretty exterior view ──
const heroGroup = new THREE.Group(); scene.add(heroGroup);
const HCOUNT = 4600;
const hpos = new Float32Array(HCOUNT * 3), hcol = new Float32Array(HCOUNT * 3);
const hhome = new Float32Array(HCOUNT * 3), hvel = new Float32Array(HCOUNT * 3);
for (let i = 0; i < HCOUNT; i++) {
  const theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1);
  const r = 0.82 + Math.random() * 0.18;
  let x = Math.sin(phi) * Math.cos(theta) * 2.5 * r;
  let y = Math.cos(phi) * 1.75 * r;
  let z = Math.sin(phi) * Math.sin(theta) * 2.05 * r;
  x += x > 0 ? 0.28 : -0.28;
  x += (Math.random() - 0.5) * 0.28; y += (Math.random() - 0.5) * 0.28; z += (Math.random() - 0.5) * 0.28;
  hpos[i*3]=hhome[i*3]=x; hpos[i*3+1]=hhome[i*3+1]=y; hpos[i*3+2]=hhome[i*3+2]=z;
  c.setHSL(0.72 - Math.random() * 0.14, 0.78, 0.52 + Math.random() * 0.18);
  hcol[i*3]=c.r; hcol[i*3+1]=c.g; hcol[i*3+2]=c.b;
}
const hgeo = new THREE.BufferGeometry();
hgeo.setAttribute('position', new THREE.BufferAttribute(hpos, 3));
hgeo.setAttribute('color', new THREE.BufferAttribute(hcol, 3));
const heroCloudMat = new THREE.PointsMaterial({ size: 0.055, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const heroCloud = new THREE.Points(hgeo, heroCloudMat); heroCloud.frustumCulled = false; heroGroup.add(heroCloud);
const hseg = [];
for (let i = 0; i < 260; i++) {
  const a = (Math.random() * HCOUNT) | 0; let best = -1, bd = 1e9;
  for (let k = 0; k < 6; k++) {
    const b = (Math.random() * HCOUNT) | 0;
    const dx = hpos[a*3]-hpos[b*3], dy = hpos[a*3+1]-hpos[b*3+1], dz = hpos[a*3+2]-hpos[b*3+2];
    const d = dx*dx+dy*dy+dz*dz; if (d < bd && b !== a) { bd = d; best = b; }
  }
  if (best >= 0) hseg.push(hpos[a*3],hpos[a*3+1],hpos[a*3+2], hpos[best*3],hpos[best*3+1],hpos[best*3+2]);
}
const hlgeo = new THREE.BufferGeometry();
hlgeo.setAttribute('position', new THREE.Float32BufferAttribute(hseg, 3));
const heroLines = new THREE.LineSegments(hlgeo, new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending }));
heroGroup.add(heroLines);

// ── TRAVEL streaks (light-speed warp) ──
const WN = 1700, DISK = 13, ZBACK = -70, ZFRONT = 8, RANGE = 78;
const sx = new Float32Array(WN), sy = new Float32Array(WN), sz = new Float32Array(WN);
const wp = new Float32Array(WN * 2 * 3);
const wc = new Float32Array(WN * 2 * 3);
for (let i = 0; i < WN; i++) {
  const ang = Math.random() * Math.PI * 2, rad = Math.sqrt(Math.random()) * DISK;
  sx[i] = Math.cos(ang) * rad; sy[i] = Math.sin(ang) * rad;
  sz[i] = ZBACK + Math.random() * (ZFRONT - ZBACK);
  c.setHSL(0.70, 0.85, 0.85); wc[i*6]=c.r; wc[i*6+1]=c.g; wc[i*6+2]=c.b;
  c.setHSL(0.73, 0.85, 0.5);  wc[i*6+3]=c.r; wc[i*6+4]=c.g; wc[i*6+5]=c.b;
}
const wgeo = new THREE.BufferGeometry();
wgeo.setAttribute('position', new THREE.BufferAttribute(wp, 3));
wgeo.setAttribute('color', new THREE.BufferAttribute(wc, 3));
const wmat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const warp = new THREE.LineSegments(wgeo, wmat); warp.frustumCulled = false; scene.add(warp);

// Curated mamonulabs destinations: visually part of the field, semantically
// represented by the projected HTML links managed in main.js.
const signalStars = LAB_SIGNALS.map((signal, index) => {
  const [nx, ny, nz] = signal.position;
  const depthZ = -8 - signal.depth * 8;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([nx * 6, ny * 4.2, depthZ + nz * 2], 3));
  const material = new THREE.PointsMaterial({
    color: index % 3 === 0 ? 0xf2ddff : 0xc49aff,
    size: 0.24 + (index % 3) * 0.03,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const point = new THREE.Points(geometry, material);
  point.frustumCulled = false;
  scene.add(point);
  return { signal, point, position: new THREE.Vector3(nx * 6, ny * 4.2, depthZ + nz * 2) };
});

// ── Post-processing ──
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const activityScene = createActivityScene();
scene.add(activityScene.group);
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 1.1, 0.7, 0.1);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ── Pointer ──
const ray = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const mouse = new THREE.Vector2(-10, -10);
const pWorld = new THREE.Vector3(999, 999, 999);
const pLocal = new THREE.Vector3(999, 999, 999);
addEventListener('pointermove', e => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = -(e.clientY / innerHeight) * 2 + 1; });

// Personal navigation; the particle construction and travel animation above
// are adapted directly from the supplied ScreenMind script.
const docEl = document.getElementById('doc');
const docNavEl = null;
const flashEl = document.getElementById('flash');
const strandEl = document.getElementById('strand');
let pageState = 'home';
let transitioning = false, tStart = 0, toPage = 'home', pendingKey = 'about', swapped = false;
const DUR = 900, PEAK = 165, LENF = 0.2;
const CORNER = {
  about: { start: [-1, -1], end: [-1, 0.7] },
  writings: { start: [1, 1], end: [1, -0.7] },
  home: { start: [0, 0], end: [0, 0] },
};
let curCorner = CORNER.home;
const camLean = { x: 0, y: 0 };
let currentDocKey = null, swapT = 0, queued = null;
let calm = initiallyCalm, dirty = true, disposed = false, frameId = 0, sceneTime = 0;

function fitHero() {
  heroGroup.scale.setScalar(Math.min(1, innerWidth / innerHeight * 1.25));
}
fitHero();
function commitPage(target, key) {
  pageState = target;
  currentDocKey = target === 'home' ? null : key;
  document.body.classList.toggle('is-doc', target === 'doc');
  document.body.classList.toggle('is-home', target === 'home');
  document.body.classList.toggle('is-activity', target === 'activity');
  document.body.style.overflow = target === 'home' ? '' : 'hidden';
  if (target === 'home') scrollTo(0, 0);
  onPage(currentDocKey);
  dirty = true;
}
function navigate(key) {
  const target = key === 'activity' ? 'activity' : key ? 'doc' : 'home';
  if (transitioning) { queued = { key }; return; }
  if (target === pageState && (target === 'home' || key === currentDocKey)) {
    if (target === 'home') { scrollTo({ top: 0, behavior: calm ? 'instant' : 'smooth' }); }
    return;
  }
  curCorner = CORNER[key] || CORNER.home;
  if (calm) {
    commitPage(target, key);
    camLean.x = curCorner.end[0]; camLean.y = curCorner.end[1];
    onSettled(key);
    refresh();
    return;
  }
  if (target === 'doc' && pageState === 'doc') {
    swapT = performance.now();
    commitPage('doc', key);
    onSettled(key);
    return;
  }
  onTransition();
  transitioning = true; tStart = performance.now();
  toPage = target; pendingKey = key; swapped = false;
}
function setCalm(value) {
  calm = value; dirty = true;
  if (transitioning) {
    commitPage(toPage, pendingKey);
    transitioning = false;
    onSettled(currentDocKey);
  }
  swapT = 0;
  if (queued) { const next = queued; queued = null; navigate(next.key); }
  refresh();
}
addEventListener('pointerout', event => {
  if (!event.relatedTarget) mouse.set(-10, -10);
});

// ── Scroll ──
const smooth = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
let last = performance.now();
const tmpV = new THREE.Vector3();
const lookAtV = new THREE.Vector3();
const camLocalV = new THREE.Vector3();
let progress = 0;

function refresh() {
  const max = document.body.scrollHeight - innerHeight;
  progress = !calm && max > 0 ? Math.min(Math.max(scrollY / max, 0), 1) : 0;
  onProgress(progress);
  dirty = true;
}
addEventListener('scroll', refresh, { passive: true });
refresh();

function animate() {
  if (disposed) return;
  frameId = requestAnimationFrame(animate);
  const now = performance.now();
  if (document.hidden || (calm && !dirty)) { last = now; return; }
  dirty = false;
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (!calm) sceneTime += dt;
  const time = sceneTime;
  let swapMW = 0;
  if (swapT) { const e = (now - swapT) / 480; if (e >= 1) swapT = 0; else swapMW = Math.sin(e * Math.PI) * 0.35; }

  let w = 0, ov = 0;
  const total = DUR;
  const A = total * 0.45, D = total * 0.55;
  if (transitioning) {
    // Always commit the view even if the browser skipped the midpoint frame.
    const el = !swapped ? Math.min(now - tStart, total - 1) : now - tStart;
    ov = Math.min(el / total, 1);
    if (el < A) w = smooth(el / A);
    else if (el < A + D) {
      if (!swapped) {
        swapped = true;
        commitPage(toPage, pendingKey);
      }
      w = smooth(1 - (el - A) / D);
    } else {
      w = 0; transitioning = false;
      if (pageState === 'home') refresh();
      onSettled(currentDocKey);
      if (queued) { const next = queued; queued = null; navigate(next.key); }
    }
  }

  docEl.style.opacity = pageState === 'doc' ? (1 - w) : 0;
  docEl.style.pointerEvents = (!transitioning && pageState === 'doc') ? 'auto' : 'none';
  if (docNavEl) { docNavEl.style.opacity = pageState === 'doc' ? 1 : 0; docNavEl.style.pointerEvents = (!transitioning && pageState === 'doc') ? 'auto' : 'none'; }
  strandEl.style.opacity = pageState === 'doc' ? 0.5 * (1 - w) : 0;

  flashEl.style.opacity = Math.pow(Math.max(0, (w - 0.55) / 0.45), 2) * 0.9;


  const homeVis = (pageState === 'home') ? (1 - w) : 0;
  const enterFade = Math.min(Math.max((progress - 0.06) / 0.14, 0), 1);

  heroCloudMat.opacity = 0.92 * homeVis * (1 - enterFade);
  heroCloud.visible = heroCloudMat.opacity > 0.01;
  heroLines.material.opacity = heroCloud.visible ? (0.12 + Math.sin(time * 1.6) * 0.06) * homeVis * (1 - enterFade) : 0;
  heroGroup.visible = heroCloud.visible;
  heroGroup.rotation.y = time * 0.05;

  const docVis = (pageState === 'doc') ? (1 - w) : 0;
  cloudMat.opacity = 0.85 * homeVis * enterFade + 0.42 * docVis;
  cloud.visible = cloudMat.opacity > 0.01;
  lines.material.opacity = cloud.visible ? (0.10 + Math.sin(time * 1.6) * 0.05) * homeVis * enterFade : 0;
  group.visible = cloud.visible;

  const spd = lerp(0, PEAK, w) + swapMW * 80;
  wmat.opacity = Math.max(w, swapMW);
  const streak = Math.min(0.2 + spd * LENF, 42);
  for (let i = 0; i < WN; i++) {
    sz[i] += spd * dt;
    if (sz[i] > ZFRONT) sz[i] -= RANGE;
    const o = i * 6;
    wp[o]   = sx[i]; wp[o+1] = sy[i]; wp[o+2] = sz[i];
    wp[o+3] = sx[i]; wp[o+4] = sy[i]; wp[o+5] = sz[i] - streak;
  }
  wgeo.attributes.position.needsUpdate = true;

  ray.setFromCamera(mouse, camera);
  if (heroCloud.visible && !calm) {
    if (ray.ray.intersectPlane(plane, pWorld)) { pLocal.copy(pWorld); heroGroup.worldToLocal(pLocal); }
    else pLocal.set(999, 999, 999);
    for (let i = 0; i < HCOUNT; i++) {
      const ix = i*3, iy = ix+1, iz = ix+2;
      const dx = hpos[ix]-pLocal.x, dy = hpos[iy]-pLocal.y, dz = hpos[iz]-pLocal.z;
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (d < 1.7 && d > 1e-4) { const f = (1.7-d)*0.075/d; hvel[ix]+=dx*f; hvel[iy]+=dy*f; hvel[iz]+=dz*f; }
      hvel[ix]+=(hhome[ix]-hpos[ix])*0.035; hvel[iy]+=(hhome[iy]-hpos[iy])*0.035; hvel[iz]+=(hhome[iz]-hpos[iz])*0.035;
      hvel[ix]*=0.85; hvel[iy]*=0.85; hvel[iz]*=0.85;
      hpos[ix]+=hvel[ix]; hpos[iy]+=hvel[iy]; hpos[iz]+=hvel[iz];
    }
    hgeo.attributes.position.needsUpdate = true;
  }
  if (cloud.visible && !calm) {
    pLocal.copy(ray.ray.origin).addScaledVector(ray.ray.direction, 6);
    group.worldToLocal(pLocal);
    camLocalV.copy(camera.position); group.worldToLocal(camLocalV);
    for (let i = 0; i < COUNT; i++) {
      const ix = i*3, iy = ix+1, iz = ix+2;
      const dx = pos[ix]-pLocal.x, dy = pos[iy]-pLocal.y, dz = pos[iz]-pLocal.z;
      const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (d < 1.8 && d > 1e-4) { const f = (1.8-d)*0.05/d; vel[ix]+=dx*f; vel[iy]+=dy*f; vel[iz]+=dz*f; }
      vel[ix]+=(home[ix]-pos[ix])*0.035; vel[iy]+=(home[iy]-pos[iy])*0.035; vel[iz]+=(home[iz]-pos[iz])*0.035;
      vel[ix]*=0.85; vel[iy]*=0.85; vel[iz]*=0.85;
      pos[ix]+=vel[ix]; pos[iy]+=vel[iy]; pos[iz]+=vel[iz];
      const cdx = pos[ix]-camLocalV.x, cdy = pos[iy]-camLocalV.y, cdz = pos[iz]-camLocalV.z;
      const cd = Math.sqrt(cdx*cdx + cdy*cdy + cdz*cdz);
      const a = Math.min(Math.max((cd - 1.5) / 2.5, 0), 1);
      colors[ix]=cbase[ix]*a; colors[ix+1]=cbase[ix+1]*a; colors[ix+2]=cbase[ix+2]*a;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  }

  if (!transitioning && pageState === 'home') {
    const p = progress;
    const cz = p < 0.2 ? lerp(8.4, -2, smooth(p / 0.2)) : lerp(-2, -8, (p - 0.2) / 0.8);
    const wIn = smooth(Math.min(Math.max((p - 0.2) / 0.18, 0), 1));
    const wx = (Math.sin(p * 6.0 + 0.6) * 4.0 + Math.sin(time * 0.15) * 0.4) * wIn;
    const wy = (Math.cos(p * 5.0) * 3.0 + Math.cos(time * 0.13) * 0.3) * wIn;
    camera.position.lerp(tmpV.set(wx, wy, cz), calm ? 1 : 0.12);
    camera.up.set(0, 1, 0);
    const lx = Math.sin((p + 0.06) * 6.0 + 0.6) * 4.0 * wIn;
    const ly = Math.cos((p + 0.06) * 5.0) * 3.0 * wIn;
    camera.lookAt(lx, ly, cz - 8);
    camera.rotateZ(Math.sin(time * 0.08) * 0.05 * wIn);
  } else {
    const targetLean = transitioning ? (ov < 0.5 ? curCorner.start : curCorner.end) : curCorner.end;
    const es = transitioning ? 0.14 : (swapMW > 0.01 ? 0.11 : 0.05);
    camLean.x += (targetLean[0] - camLean.x) * es;
    camLean.y += (targetLean[1] - camLean.y) * es;
    const cxo = camLean.x * 5.0, cyo = camLean.y * 3.5;
    const wz = transitioning ? (-1 - 5 * Math.sin(Math.min(ov, 1) * Math.PI)) : -1;
    camera.position.lerp(tmpV.set(cxo + Math.sin(time * 0.13) * 0.3, cyo + 0.2 + Math.cos(time * 0.11) * 0.2, wz), calm ? 1 : 0.15);
    camera.up.set(0, 1, 0);
    camera.lookAt(lookAtV.set(cxo * 0.6, cyo * 0.6, wz - 8));
    camera.rotateZ(-camLean.x * 0.08);
  }
  group.rotation.y = time * 0.05 + progress * 1.4;
  camera.fov = 60 + w * 18 + swapMW * 8; camera.updateProjectionMatrix();
  bloom.strength = (pageState === 'doc' && !transitioning ? 0.7 : 1.1) + w * 1.3 + swapMW * 0.5;

  const signalProjection = signalStars.map(({ signal, point, position }) => {
    const active = pageState === 'home' && !transitioning && isSignalActive(signal.depth, progress);
    const pulse = calm ? 1 : 0.86 + Math.sin(time * signal.pulse * 2 + signal.depth * 19) * 0.14;
    point.material.opacity = active ? pulse : 0;
    const projected = projectSignal(position, camera, { width: innerWidth, height: innerHeight });
    return { id: signal.id, ...projected, visible: active && projected.visible };
  });
  onSignals(signalProjection);

  activityScene.group.visible = pageState === 'activity';
  renderPass.camera = activityScene.group.visible ? activityScene.camera : camera;
  if (activityScene.group.visible) {
    bloom.strength = .9 + w;
    onActivity(activityScene.update({ time, calm, viewport: { width: innerWidth, height: innerHeight }, pointer: mouse, pixelRatio: renderer.getPixelRatio(), opacity: 1 - w }), !transitioning);
  } else onActivity([], false);

  composer.render();
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  fitHero(); refresh();
});
return { navigate, setCalm,
  setActivityDays(days, year) { activityScene.setDays(days, year); dirty = true; },
  setActivitySelection(date) { activityScene.setSelection(date); dirty = true; },
  dispose() {
  disposed = true; cancelAnimationFrame(frameId);
  for (const { point } of signalStars) { point.geometry.dispose(); point.material.dispose(); }
  activityScene.dispose();
  composer.dispose(); renderer.dispose(); renderer.domElement.remove();
} };

}
