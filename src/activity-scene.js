import * as THREE from 'three';
import { layoutActivityYear, layoutActivityMonths, connectActivityDays } from './activity-layout.js';

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => value * value * (3 - 2 * value);

export function frameActivityCamera(camera, { width, height }) {
  camera.clearViewOffset(); camera.zoom = 1; camera.aspect = width / height;
  camera.fov = 42;
  const distance = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  camera.position.set(0, 0, distance); camera.up.set(0, 1, 0); camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  return distance;
}

function starMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, calm: { value: 0 }, selected: { value: -1 }, pixelRatio: { value: 1 }, opacity: { value: 1 }, starScale: { value: 1 } },
    vertexShader: `attribute float intensity; attribute float dayIndex;
      uniform float selected; uniform float pixelRatio; uniform float starScale;
      varying float energy; varying float chosen;
      void main() {
        chosen = abs(dayIndex - selected) < .1 ? 1.0 : 0.0;
        energy = intensity;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (5.0 + intensity * 9.0 + chosen * 6.0) * pixelRatio * starScale;
      }`,
    fragmentShader: `uniform float opacity; uniform float time; uniform float calm;
      varying float energy; varying float chosen;
      void main() {
        float r = length(gl_PointCoord - .5) * 2.0;
        if (r > 1.0) discard;
        float core = exp(-r*r*22.0);
        float breathing = 1.0 + (1.0-calm) * .16 * sin(time * .65);
        float halo = exp(-r*r*4.0) * .22 * breathing;
        vec3 violet = mix(vec3(.43,.19,.82), vec3(.94,.82,1.0), core);
        float alpha = (core+halo) * (energy * .88 + .12 + chosen * .45) * opacity;
        gl_FragColor = vec4(violet, alpha);
      }`,
  });
}

function starGeometry(records) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(records.length * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('intensity', new THREE.Float32BufferAttribute(records.map(day => day.intensity), 1));
  geometry.setAttribute('dayIndex', new THREE.Float32BufferAttribute(records.map((_, i) => i), 1));
  return geometry;
}

export function createActivityScene() {
  const group = new THREE.Group(); group.visible = false;
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 10000);
  const material = starMaterial(), ghostMaterial = starMaterial();
  const points = new THREE.Points(starGeometry([]), material);
  const ghosts = new THREE.Points(starGeometry([]), ghostMaterial);
  points.frustumCulled = ghosts.frustumCulled = false;
  ghosts.visible = false;
  group.add(ghosts, points);

  const lineMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, calm: { value: 0 }, opacity: { value: 1 }, focusedMonth: { value: -1 } },
    vertexShader: `attribute float phase; attribute float month;
      uniform float focusedMonth; varying float trail; varying float focus;
      void main() {
        trail = phase; focus = abs(month-focusedMonth) < .1 ? 1.0 : 0.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `uniform float time; uniform float calm; uniform float opacity;
      varying float trail; varying float focus;
      void main() {
        float wave = pow(max(0.0, cos(trail * 6.28318 - time * .9)), 22.0) * (1.0-calm);
        vec3 color = mix(vec3(.40,.25,.67), vec3(.80,.71,1.0), wave);
        gl_FragColor = vec4(color, (.2 + wave * .55 + focus * .16) * opacity);
      }`,
  });
  const lines = new THREE.LineSegments(new THREE.BufferGeometry(), lineMaterial);
  lines.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(), 3));
  lines.frustumCulled = false; group.add(lines);

  const atmosphereMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, opacity: { value: 1 }, centers: { value: Array.from({ length: 12 }, () => new THREE.Vector2()) }, cell: { value: new THREE.Vector2(1, 1) } },
    vertexShader: `varying vec2 uvScreen; void main() { uvScreen = position.xy * .5 + .5; gl_Position = vec4(position.xy, .999, 1.0); }`,
    fragmentShader: `uniform float time; uniform float opacity; uniform vec2 centers[12]; uniform vec2 cell; varying vec2 uvScreen;
      void main() {
        vec3 color = vec3(0.0);
        for (int i = 0; i < 12; i++) {
          vec2 p = (uvScreen-centers[i])/cell;
          float mist = .6 + .2 * sin(p.x*7.0 + time*.12 + float(i)) * cos(p.y*6.0-time*.1);
          float glow = exp(-dot(p,p)*10.0) * mist;
          color += vec3(.18,.055,.31) * glow;
        }
        gl_FragColor = vec4(color, .22 * opacity);
      }`,
  });
  const atmosphere = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), atmosphereMaterial);
  atmosphere.frustumCulled = false; atmosphere.renderOrder = -1; group.add(atmosphere);

  let records = [], connections = [], projected = [], months = [], oldPositions = new Float32Array();
  let selectedDate = null, viewportKey = '', distance = 1, pendingReform = false, reformStart = -Infinity;
  let lastTime = null;
  const pointerOffset = new THREE.Vector2();
  const focus = new Float32Array(12);
  const transforms = Array.from({ length: 12 }, () => ({ x: 0, y: 0, angle: 0, depth: 0, scale: 1 }));
  const projection = new THREE.Vector3();

  function setSelection(date) {
    selectedDate = date;
    material.uniforms.selected.value = records.findIndex(day => day.date === date);
  }

  return {
    group, camera,
    setDays(days, year) {
      oldPositions = points.geometry.attributes.position.array.slice();
      ghosts.geometry.dispose(); ghosts.geometry = points.geometry.clone();
      points.geometry.dispose();
      records = layoutActivityYear(days, year);
      points.geometry = starGeometry(records);
      connections = connectActivityDays(records);
      lines.geometry.dispose(); lines.geometry = new THREE.BufferGeometry();
      lines.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(connections.length * 6), 3).setUsage(THREE.DynamicDrawUsage));
      lines.geometry.setAttribute('phase', new THREE.Float32BufferAttribute(connections.flatMap(pair => pair.map(i => records[i].day / 31 + records[i].month * .17)), 1));
      lines.geometry.setAttribute('month', new THREE.Float32BufferAttribute(connections.flatMap(pair => pair.map(i => records[i].month)), 1));
      projected = records.map(day => ({ date: day.date, x: 0, y: 0, visible: false }));
      projected.push(...Array.from({ length: 12 }, (_, i) => ({ kind: 'month', month: i + 1, hasData: records.some(day => day.month === i + 1), x: 0, y: 0, visible: false })));
      pendingReform = true;
      setSelection(selectedDate);
    },
    setSelection,
    update({ time, calm, viewport, pointer, pixelRatio = 1, opacity = 1 }) {
      const { width, height } = viewport;
      const key = `${width}:${height}`;
      if (key !== viewportKey) {
        if (viewportKey) { pendingReform = false; reformStart = -Infinity; }
        distance = frameActivityCamera(camera, viewport);
        months = layoutActivityMonths(viewport); viewportKey = key;
      }
      if (pendingReform) { reformStart = time; pendingReform = false; }
      if (calm) reformStart = -Infinity;
      const progress = clamp((time - reformStart) / 1.35);
      const arrival = smooth(progress), scatter = 1 - arrival;
      const dt = lastTime === null ? 1 / 60 : Math.min(.05, Math.max(0, time - lastTime));
      lastTime = time;
      const easing = 1 - Math.exp(-dt * 5);
      const pointerActive = Boolean(!calm && pointer && Math.abs(pointer.x) <= 1 && Math.abs(pointer.y) <= 1);
      const px = pointerActive ? pointer.x : 0, py = pointerActive ? pointer.y : 0;
      if (calm) pointerOffset.set(0, 0);
      else { pointerOffset.x += (px-pointerOffset.x) * easing; pointerOffset.y += (py-pointerOffset.y) * easing; }
      const pointerX = (px + 1) * width / 2, pointerY = (1 - py) * height / 2;
      let focusedMonth = -1;
      for (let i = 0; i < 12; i++) {
        const month = months[i], transform = transforms[i];
        const hovered = pointerActive && Math.abs(pointerX-month.x) < month.width * .44 && Math.abs(pointerY-month.y) < month.height * .42;
        if (hovered) focusedMonth = i + 1;
        focus[i] = calm ? 0 : focus[i] + (Number(hovered)-focus[i]) * easing;
        const phase = i * 2.39996;
        transform.x = month.x + (calm ? 0 : Math.sin(time * .19 + phase) * month.width * .018 + pointerOffset.x * (5 + Math.sin(phase) * 3));
        transform.y = month.y + (calm ? 0 : Math.cos(time * .16 + phase) * month.height * .023 - pointerOffset.y * (5 + Math.cos(phase) * 3));
        transform.angle = calm ? 0 : Math.sin(time * .13 + phase) * .055;
        transform.depth = distance * (.02 * Math.sin(phase) + focus[i] * .035);
        transform.scale = 1 + focus[i] * .10;
        const label = projected[records.length + i];
        if (label) { label.x = month.x - month.width * .34; label.y = month.y - month.height * .36; label.visible = true; }
        atmosphereMaterial.uniforms.centers.value[i].set(transform.x / width, 1 - transform.y / height);
      }
      atmosphereMaterial.uniforms.cell.value.set(months[0].width / width, months[0].height / height);
      atmosphereMaterial.uniforms.time.value = calm ? 0 : time;
      atmosphereMaterial.uniforms.opacity.value = opacity;

      const positions = points.geometry.attributes.position.array;
      for (let i = 0; i < records.length; i++) {
        const day = records[i], month = months[day.month - 1], transform = transforms[day.month - 1];
        const [lx, ly, lz] = day.position;
        const localX = lx * month.width, localY = ly * month.height;
        const angle = transform.angle + scatter * (Math.PI * 1.1 + day.day * .035);
        const scale = transform.scale * (1 + scatter * 1.2);
        const x = transform.x + (localX * Math.cos(angle) - localY * Math.sin(angle)) * scale;
        const y = transform.y + (localX * Math.sin(angle) + localY * Math.cos(angle)) * scale;
        const z = transform.depth + lz * distance * .03 + scatter * distance * .2;
        // Compensate perspective at rest: depth is atmosphere, never a count scale.
        positions[i * 3] = (x - width / 2) * (1 - z / distance);
        positions[i * 3 + 1] = (height / 2 - y) * (1 - z / distance);
        positions[i * 3 + 2] = z;
        projection.fromArray(positions, i * 3).project(camera);
        projected[i].x = (projection.x + 1) * width / 2;
        projected[i].y = (1 - projection.y) * height / 2;
        projected[i].visible = progress === 1 && Math.abs(projection.x) <= 1 && Math.abs(projection.y) <= 1 && Math.abs(projection.z) <= 1;
      }
      points.geometry.attributes.position.needsUpdate = true;
      const linePositions = lines.geometry.attributes.position.array;
      for (let i = 0; i < connections.length; i++) {
        const [a, b] = connections[i];
        for (let axis = 0; axis < 3; axis++) { linePositions[i * 6 + axis] = positions[a * 3 + axis]; linePositions[i * 6 + 3 + axis] = positions[b * 3 + axis]; }
      }
      lines.geometry.attributes.position.needsUpdate = true;
      lineMaterial.uniforms.time.value = time; lineMaterial.uniforms.calm.value = Number(calm);
      lineMaterial.uniforms.focusedMonth.value = focusedMonth;
      lineMaterial.uniforms.opacity.value = opacity * arrival * arrival;
      for (const mat of [material, ghostMaterial]) {
        mat.uniforms.time.value = time; mat.uniforms.calm.value = Number(calm);
        mat.uniforms.pixelRatio.value = pixelRatio;
        mat.uniforms.starScale.value = width <= 700 ? .78 : 1.15;
      }
      material.uniforms.opacity.value = opacity * arrival;
      ghosts.visible = !calm && progress < 1 && oldPositions.length > 0;
      if (ghosts.visible) {
        const ghostPositions = ghosts.geometry.attributes.position.array;
        for (let i = 0; i < oldPositions.length / 3; i++) {
          ghostPositions[i * 3] = oldPositions[i * 3] + Math.sin(i * 2.4) * width * .22 * arrival;
          ghostPositions[i * 3 + 1] = oldPositions[i * 3 + 1] + Math.cos(i * 2.4) * height * .22 * arrival;
          ghostPositions[i * 3 + 2] = oldPositions[i * 3 + 2] + distance * .5 * arrival;
        }
        ghosts.geometry.attributes.position.needsUpdate = true;
        ghostMaterial.uniforms.opacity.value = opacity * scatter * .7;
      }
      return projected;
    },
    dispose() {
      for (const object of [points, ghosts, lines, atmosphere]) { object.geometry.dispose(); object.material.dispose(); }
      group.clear();
    },
  };
}
