import test from 'node:test';
import assert from 'node:assert/strict';
import writings from '../src/data/writings.json' with { type: 'json' };
import { formatWritingDate, mergeWritings, sortPosts, validateWritings } from '../src/writings-data.js';

const post = (url, published, extra = {}) => ({
  url: `https://mamonu.hashnode.dev/${url}`,
  title: url,
  date: published.slice(0, 10),
  published,
  tags: [],
  ...extra,
});

test('the shipped archive is valid and newest first', () => {
  assert.equal(validateWritings(writings), writings);
  // A count, not a floor: posts get unpublished sometimes.
  assert.ok(writings.posts.length > 0);
  assert.deepEqual(writings.posts, sortPosts(writings.posts));
});

test('a rejected archive names what is wrong with it', () => {
  assert.throws(() => validateWritings({ ...writings, schemaVersion: 99 }), /Unsupported writings schema/);
  assert.throws(() => validateWritings({ ...writings, posts: [post('a', '2026-01-01T00:00:00.000Z'), post('a', '2026-01-02T00:00:00.000Z')] }), /Duplicate post url/);
  assert.throws(() => validateWritings({ ...writings, posts: [{ ...post('a', '2026-01-01T00:00:00.000Z'), date: '2026-01-09' }] }), /disagree/);
  assert.throws(() => validateWritings({ ...writings, posts: [{ ...post('a', '2026-01-01T00:00:00.000Z'), url: 'https://example.com/x' }] }), /Invalid post url/);
});

test('posts the feed has aged out survive a merge', () => {
  const existing = { schemaVersion: 1, source: 'feed', updatedAt: '2026-01-01T00:00:00.000Z', posts: [post('old', '2025-01-01T00:00:00.000Z'), post('kept', '2025-06-01T00:00:00.000Z')] };
  const merged = mergeWritings(existing, [post('fresh', '2026-02-01T00:00:00.000Z')], '2026-02-02T00:00:00.000Z');
  assert.deepEqual(merged.posts.map(entry => entry.title), ['fresh', 'kept', 'old']);
  assert.equal(merged.updatedAt, '2026-02-02T00:00:00.000Z');
});

test('a merge corrects a post already held without duplicating it', () => {
  const existing = { schemaVersion: 1, source: 'feed', updatedAt: '2026-01-01T00:00:00.000Z', posts: [post('same', '2026-01-01T00:00:00.000Z', { title: 'Old title' })] };
  const merged = mergeWritings(existing, [post('same', '2026-01-01T00:00:00.000Z', { title: 'New title' })], '2026-01-02T00:00:00.000Z');
  assert.equal(merged.posts.length, 1);
  assert.equal(merged.posts[0].title, 'New title');
});

test('same-day posts keep their true publication order', () => {
  const earlier = post('earlier', '2026-03-01T08:00:00.000Z');
  const later = post('later', '2026-03-01T20:00:00.000Z');
  assert.deepEqual(sortPosts([earlier, later]).map(entry => entry.title), ['later', 'earlier']);
  assert.deepEqual(sortPosts([later, earlier]).map(entry => entry.title), ['later', 'earlier']);
});

test('dates render the way the panel shows them', () => {
  assert.equal(formatWritingDate('2026-09-03'), '03 SEP 2026');
  assert.equal(formatWritingDate('2026-12-31'), '31 DEC 2026');
  assert.throws(() => formatWritingDate('03/09/2026'), /Invalid date/);
});
