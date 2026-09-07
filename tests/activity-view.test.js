import test from 'node:test';
import assert from 'node:assert/strict';
import { routeFromHash } from '../src/content.js';
import { createActivityController } from '../src/activity-state.js';

const archive = { schemaVersion: 1, login: 'mamonu', source: 'github-contribution-calendar', visibility: 'aggregate-counts', updatedAt: '2026-09-06T12:00:00Z', days: [{ date: '2024-02-29', count: 2 }, { date: '2026-09-03', count: 14 }, { date: '2026-09-05', count: 0 }] };

test('GitHub activity has its own route while the old archive link still opens writings', () => {
  assert.equal(routeFromHash('#activity'), 'activity');
  assert.equal(routeFromHash('#/activity'), 'activity');
  assert.equal(routeFromHash('#archive'), 'writings');
  assert.equal(routeFromHash('#writings'), 'writings');
  assert.equal(routeFromHash('#home'), null);
});

test('controller selects observed dates and years, keeps hover separate from a pinned date', async () => {
  const controller = createActivityController({ loadArchive: async () => archive });
  await controller.enter();
  assert.equal(controller.state.year, 2026);
  assert.equal(controller.state.date, '2026-09-05');
  controller.selectDate('2026-09-04');
  assert.equal(controller.state.date, '2026-09-05', 'unknown days cannot be selected');
  controller.step(-1);
  assert.equal(controller.state.date, '2026-09-03');
  assert.equal(controller.state.pinned, true);
  controller.previewDate('2026-09-05');
  assert.equal(controller.state.date, '2026-09-03');
  assert.equal(controller.clearSelection(), true);
  assert.equal(controller.clearSelection(), false);
  controller.selectYear(2024);
  assert.equal(controller.state.date, '2024-02-29');
  controller.selectYear(2025);
  assert.equal(controller.state.year, 2024);
});

test('late loading caches data without reopening a departed view, and reentry uses one request', async () => {
  let finish, loads = 0;
  const controller = createActivityController({ loadArchive: () => { loads++; return new Promise(resolve => { finish = resolve; }); } });
  const entering = controller.enter();
  controller.leave();
  finish(archive);
  await entering;
  assert.equal(controller.state.active, false);
  await controller.enter();
  assert.equal(controller.state.status, 'ready');
  assert.equal(loads, 1);
});

test('failed loading can retry and disposal prevents subsequent updates', async () => {
  let fail = true, changes = 0;
  const controller = createActivityController({ loadArchive: async () => { if (fail) throw new Error('network'); return archive; }, onChange: () => changes++ });
  await controller.enter();
  assert.equal(controller.state.status, 'error');
  fail = false;
  await controller.enter();
  assert.equal(controller.state.status, 'ready');
  controller.dispose();
  const before = changes;
  await controller.enter();
  controller.selectYear(2024);
  assert.equal(changes, before);
});

test('empty and malformed archives produce distinct usable states', async () => {
  const empty = createActivityController({ loadArchive: async () => ({ ...archive, days: [] }) });
  await empty.enter();
  assert.equal(empty.state.status, 'empty');
  const invalid = createActivityController({ loadArchive: async () => ({ token: 'bad' }) });
  await invalid.enter();
  assert.equal(invalid.state.status, 'error');
});
