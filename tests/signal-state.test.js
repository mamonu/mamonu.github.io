import test from 'node:test';
import assert from 'node:assert/strict';
import { activateSignal, createSignalState, dismissSignal, placePreview } from '../src/signal-state.js';

test('fine pointers open a signal immediately', () => {
  const result = activateSignal(createSignalState('fine'), 'datahell');
  assert.equal(result.action, 'open');
  assert.equal(result.state.selectedId, null);
});

test('coarse pointers preview first and open on the second tap', () => {
  const initial = createSignalState('coarse');
  const first = activateSignal(initial, 'nlc-sloth');
  assert.equal(first.action, 'preview');
  assert.equal(first.state.selectedId, 'nlc-sloth');

  const second = activateSignal(first.state, 'nlc-sloth');
  assert.equal(second.action, 'open');
  assert.equal(second.state.selectedId, 'nlc-sloth');
});

test('coarse activation replaces the previously previewed signal', () => {
  const first = activateSignal(createSignalState('coarse'), 'noisering');
  const second = activateSignal(first.state, 'wogglebug');
  assert.equal(second.action, 'preview');
  assert.equal(second.state.selectedId, 'wogglebug');
});

test('dismissal clears the selected signal without changing pointer mode', () => {
  const selected = activateSignal(createSignalState('coarse'), 'noisering').state;
  assert.deepEqual(dismissSignal(selected), { selectedId: null, pointerMode: 'coarse' });
});

test('preview placement prefers the right and remains inside the viewport', () => {
  assert.deepEqual(
    placePreview(
      { left: 100, right: 108, top: 100, bottom: 108, width: 8, height: 8 },
      { width: 180, height: 90 },
      { width: 390, height: 844 },
    ),
    { left: 124, top: 59, side: 'right' },
  );

  const edge = placePreview(
    { left: 370, right: 378, top: 10, bottom: 18, width: 8, height: 8 },
    { width: 180, height: 90 },
    { width: 390, height: 844 },
  );
  assert.equal(edge.side, 'left');
  assert.ok(edge.left >= 12 && edge.left + 180 <= 378);
  assert.ok(edge.top >= 12 && edge.top + 90 <= 832);
});

test('preview placement respects a protected header margin', () => {
  const result = placePreview(
    { left: 80, right: 88, top: 20, bottom: 28, width: 8, height: 8 },
    { width: 250, height: 145 },
    { width: 390, height: 844 },
    { top: 120, right: 12, bottom: 12, left: 12 },
  );
  assert.equal(result.top, 120);
  assert.ok(result.top + 145 <= 832);
});
