import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runUpdate } from '../scripts/update-github-activity.mjs';

const now = new Date('2026-01-03T12:00:00Z');
const base = { schemaVersion: 1, login: 'mamonu', source: 'github-contribution-calendar', visibility: 'public-profile', updatedAt: '2025-01-01T12:00:00Z', days: [{ date: '2024-02-29', count: 8 }, { date: '2025-01-01', count: 2 }] };
function daysBetween(from, to) {
  const days = [];
  for (let time = Date.parse(from.slice(0, 10)); time <= Date.parse(to.slice(0, 10)); time += 86400000) days.push({ date: new Date(time).toISOString().slice(0, 10), count: 3 });
  return days;
}
const queryGithub = async (query, variables) => ({ data: { user: { login: 'mamonu', contributionsCollection: query.includes('contributionYears')
  ? { contributionYears: [2026, 2024] }
  : { contributionCalendar: { weeks: [{ contributionDays: daysBetween(variables.from, variables.to).map(day => ({ date: day.date, contributionCount: day.count })) }] } } } } });
async function workspace(t, existing = base) {
  const dir = await mkdtemp(join(tmpdir(), 'activity-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const archivePath = join(dir, 'activity.json');
  if (existing) await writeFile(archivePath, JSON.stringify(existing));
  return { dir, archivePath, now, queryGithub };
}

test('updater retains history and refreshes missed dates without double counting', async t => {
  const options = await workspace(t);
  const result = await runUpdate(options);
  const archive = JSON.parse(await readFile(options.archivePath));
  assert.deepEqual(archive.days[0], { date: '2024-02-29', count: 8 });
  assert.deepEqual(archive.days[1], { date: '2025-01-01', count: 3 });
  assert.deepEqual(archive.days.at(-1), { date: '2026-01-03', count: 3 });
  assert.equal(result.corrected, 1);
  const second = await runUpdate(options);
  assert.equal(second.added, 0);
  assert.equal(second.corrected, 0);
});

test('first backfill includes leap and intervening quiet years', async t => {
  const options = await workspace(t, null);
  const result = await runUpdate(options);
  assert.equal(result.archive.days.length, 366 + 365 + 3);
  assert.equal(result.archive.days[0].date, '2024-01-01');
});

test('dry run does not create or replace files', async t => {
  const options = await workspace(t, null);
  await runUpdate({ ...options, dryRun: true });
  assert.deepEqual(await readdir(options.dir), []);
});

test('API and coverage failures preserve the last valid bytes', async t => {
  const options = await workspace(t);
  const before = await readFile(options.archivePath, 'utf8');
  const invalidQueries = [
    async () => ({ errors: [{ message: 'Rate limit' }] }),
    async () => ({ data: { user: null } }),
    async () => ({ data: { user: { login: 'wrong' } } }),
    async (query, variables) => { if (query.includes('contributionYears')) return queryGithub(query, variables); const r = await queryGithub(query, variables); r.data.user.contributionsCollection.contributionCalendar.weeks[0].contributionDays.pop(); return r; },
    async (query, variables) => { if (variables.from?.startsWith('2026')) throw new Error('Network failure'); return queryGithub(query, variables); },
  ];
  for (const replacement of invalidQueries) {
    await assert.rejects(runUpdate({ ...options, queryGithub: replacement }));
    assert.equal(await readFile(options.archivePath, 'utf8'), before);
  }
  assert.deepEqual(await readdir(options.dir), ['activity.json']);
});

test('accepted private aggregates persist only date and count', async t => {
  const options = await workspace(t, null);
  const { archive } = await runUpdate(options);
  assert.equal(archive.visibility, 'aggregate-counts');
  assert.deepEqual(Object.keys(archive.days[0]), ['date', 'count']);
});
