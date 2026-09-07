import test from 'node:test';
import assert from 'node:assert/strict';
import { isSignalActive, ndcToViewport } from '../src/signal-projection.js';

test('normalised centre and corners project into viewport pixels', () => {
  assert.deepEqual(ndcToViewport({ x: 0, y: 0, z: 0 }, { width: 1200, height: 800 }), { x: 600, y: 400, visible: true });
  assert.deepEqual(ndcToViewport({ x: -1, y: 1, z: 0 }, { width: 1200, height: 800 }), { x: 0, y: 0, visible: true });
  assert.deepEqual(ndcToViewport({ x: 1, y: -1, z: 0 }, { width: 1200, height: 800 }), { x: 1200, y: 800, visible: true });
});

test('points outside the clip volume are not visible', () => {
  assert.equal(ndcToViewport({ x: 0, y: 0, z: 1.01 }, { width: 100, height: 100 }).visible, false);
  assert.equal(ndcToViewport({ x: -1.01, y: 0, z: 0 }, { width: 100, height: 100 }).visible, false);
});

test('signal activation includes exact depth-radius boundaries', () => {
  assert.equal(isSignalActive(0.5, 0.425, 0.075), true);
  assert.equal(isSignalActive(0.5, 0.575, 0.075), true);
  assert.equal(isSignalActive(0.5, 0.6, 0.075), false);
});
