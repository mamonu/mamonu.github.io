import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutActivityYear, pickActivityDay, connectActivityDays } from '../src/activity-layout.js';
import { createActivityScene } from '../src/activity-scene.js';

test('days keep their month and day positions across years and contribution counts', () => {
  const days = [{ date: '2024-01-01', count: 0 }, { date: '2024-02-29', count: 3 }, { date: '2024-12-31', count: 30 }];
  const points = layoutActivityYear(days, 2024);
  assert.deepEqual(points, layoutActivityYear(days, 2024));
  assert.equal(points.length, 3);
  assert.deepEqual(points.map(day => day.month), [1, 2, 12]);
  assert.equal(points[1].date, '2024-02-29');
  const nextYear = layoutActivityYear([{ date: '2025-01-01', count: 50 }], 2025);
  assert.deepEqual(points[0].position, nextYear[0].position);
  assert.ok(points[0].intensity < points[1].intensity);
  assert.ok(points[1].intensity < points[2].intensity);
  assert.deepEqual(layoutActivityYear([], 2024), []);
});

test('count scale is comparable across years and saturates extreme counts', () => {
  const a = layoutActivityYear([{ date: '2024-01-01', count: 10 }], 2024)[0];
  const b = layoutActivityYear([{ date: '2025-01-01', count: 10 }, { date: '2025-01-02', count: 10000 }], 2025);
  assert.equal(a.intensity, b[0].intensity);
  assert.equal(b[1].intensity, 1);
  assert.ok([...a.position, a.intensity].every(Number.isFinite));
});

test('connections represent consecutive active days and stop at quiet days, unknown gaps and month boundaries', () => {
  const records = layoutActivityYear([
    { date: '2024-02-28', count: 4 }, { date: '2024-02-29', count: 2 },
    { date: '2024-03-01', count: 8 }, { date: '2024-03-02', count: 0 },
    { date: '2024-03-03', count: 3 }, { date: '2024-03-05', count: 1 },
    { date: '2024-03-06', count: 5 },
  ], 2024);
  assert.deepEqual(connectActivityDays(records), [[0, 1], [5, 6]]);
});

test('picking finds the nearest visible point in CSS pixels and resolves ties deterministically', () => {
  const points = [{ date: '2026-01-01', x: 100, y: 100, visible: false }, { date: '2026-01-02', x: 108, y: 100, visible: true }, { date: '2026-01-03', x: 113, y: 100, visible: true }];
  assert.equal(pickActivityDay(points, { x: 100, y: 100 }, 12), '2026-01-02');
  assert.equal(pickActivityDay(points, { x: 113, y: 100 }, 12), '2026-01-03');
  assert.equal(pickActivityDay(points, { x: 200, y: 100 }, 12), null);
  assert.equal(pickActivityDay([...points, { date: '2026-01-04', x: 108, y: 100, visible: true }], { x: 108, y: 100 }, 12), '2026-01-02');
});

test('monthly constellations fill the scene, preserve empty months, and stay between controls', () => {
  const days = Array.from({ length: 365 }, (_, index) => ({ date: new Date(Date.UTC(2025, 0, index + 1)).toISOString().slice(0, 10), count: 4 }));
  const scene = createActivityScene();
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 375, height: 667 }]) {
    for (const observed of [days, days.slice(0, 249)]) {
      scene.setDays(observed, 2025);
      const points = scene.update({ time: 0, calm: true, viewport });
      const dates = points.filter(point => point.date);
      const months = points.filter(point => point.kind === 'month');
      assert.equal(dates.length, observed.length, 'unobserved dates must not become quiet stars');
      assert.equal(months.length, 12, 'all month positions remain visible in incomplete years');
      assert.equal(months.at(-1).hasData, observed.length === 365);
      const xs = dates.map(point => point.x), ys = dates.map(point => point.y);
      assert.ok(Math.max(...xs) - Math.min(...xs) > viewport.width * .75, 'even an incomplete year should fill the screen width');
      assert.ok(points.every(point => point.visible));
      assert.ok(Math.min(...ys) >= (viewport.width > 700 ? 120 : 160));
      assert.ok(Math.max(...ys) <= viewport.height - (viewport.width > 700 ? 80 : 130));
    }
  }
  scene.dispose();
});

test('motion and pointer depth move stars while calm mode is stable and picking follows the rendered position', () => {
  const scene = createActivityScene();
  scene.setDays([{ date: '2025-04-01', count: 10 }, { date: '2025-04-02', count: 2 }], 2025);
  const viewport = { width: 1280, height: 800 };
  const snapshot = (time, calm, pointer) => structuredClone(scene.update({ time, calm, viewport, pointer }));
  snapshot(0, false);
  const moving = snapshot(3, false, { x: .5, y: -.4 });
  assert.notDeepEqual(moving, snapshot(5, false, { x: -.5, y: .4 }));
  const still = snapshot(6, true, { x: .5, y: -.4 });
  assert.deepEqual(still, snapshot(60, true, { x: -.5, y: .4 }));
  const star = still.find(point => point.date === '2025-04-01');
  assert.equal(pickActivityDay(still, star, 1), '2025-04-01');
  scene.dispose();
});

test('year changes reform the stars, prevent selecting in-flight stars, and settle on the new data', () => {
  const scene = createActivityScene();
  const viewport = { width: 1280, height: 800 };
  scene.setDays([{ date: '2025-01-01', count: 10 }], 2025);
  scene.update({ time: 0, calm: false, viewport });
  scene.update({ time: 2, calm: false, viewport });
  scene.setDays([{ date: '2026-01-01', count: 3 }], 2026);
  const changing = scene.update({ time: 3, calm: false, viewport });
  assert.equal(changing.find(point => point.date).visible, false);
  const settled = scene.update({ time: 5, calm: false, viewport });
  assert.equal(settled.find(point => point.date).date, '2026-01-01');
  assert.equal(settled.find(point => point.date).visible, true);
  scene.dispose();
});

test('the activity scene can render while the archive is still loading', () => {
  const scene = createActivityScene();
  const points = scene.update({ time: 0, calm: false, viewport: { width: 1280, height: 800 } });
  assert.equal(points.length, 0);
  scene.dispose();
});
