import test from 'node:test';
import assert from 'node:assert/strict';
import { validateArchive, mergeArchive, getYears, getYearDays } from '../src/activity-data.js';

const archive = (days = []) => ({ schemaVersion: 1, login: 'mamonu', source: 'github-contribution-calendar', visibility: 'public-profile', updatedAt: '2026-09-06T12:00:00Z', days });

test('merge preserves old years, replaces overlaps, and keeps observed zero days', () => {
  const previous = archive([{ date: '2024-01-01', count: 2 }, { date: '2026-09-03', count: 10 }]);
  const incoming = [{ date: '2026-09-04', count: 0 }, { date: '2026-09-03', count: 14 }];
  const next = mergeArchive(previous, incoming, previous.updatedAt);
  assert.deepEqual(next.days, [{ date: '2024-01-01', count: 2 }, { date: '2026-09-03', count: 14 }, { date: '2026-09-04', count: 0 }]);
  assert.deepEqual(mergeArchive(next, incoming, next.updatedAt), next);
  assert.equal(previous.days[1].count, 10);
  assert.deepEqual(getYears(next), [2026, 2024]);
  assert.deepEqual(getYearDays(next, 2026), next.days.slice(1));
});

test('validation accepts leap days and never fills unknown dates', () => {
  assert.equal(validateArchive({ ...archive(), visibility: 'aggregate-counts' }).visibility, 'aggregate-counts');
  assert.deepEqual(validateArchive(archive([{ date: '2024-02-29', count: 0 }])).days, [{ date: '2024-02-29', count: 0 }]);
  assert.deepEqual(getYears(archive()), []);
});

test('validation rejects impossible dates, duplicates, invalid counts and future days', () => {
  for (const day of [{ date: '2023-02-29', count: 1 }, { date: '2026-04-31', count: 1 }, { date: '2026-1-01', count: 1 }, { date: '2026-01-01', count: -1 }, { date: '2026-01-01', count: 1.5 }, { date: '2026-09-07', count: 1 }]) {
    assert.throws(() => validateArchive(archive([day])));
  }
  assert.throws(() => validateArchive(archive([{ date: '2026-01-01', count: 1 }, { date: '2026-01-01', count: 2 }])));
});

test('validation rejects incompatible identity, metadata and unexpected private fields', () => {
  for (const changes of [{ login: 'someone-else' }, { schemaVersion: 2 }, { visibility: 'private' }, { source: 'events' }, { updatedAt: 'yesterday' }, { repositories: ['secret'] }]) {
    assert.throws(() => validateArchive({ ...archive(), ...changes }));
  }
  assert.throws(() => validateArchive(archive([{ date: '2026-01-01', count: 1, repository: 'secret' }])));
});
