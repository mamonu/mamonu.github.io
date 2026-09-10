import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHAIN_KINDS, LAB_SIGNALS, assertValidCatalogue, getActiveSignals } from '../src/labs-signals.js';

test('catalogue contains ten unique destinations', () => {
  assert.equal(assertValidCatalogue(LAB_SIGNALS), true);
  assert.equal(LAB_SIGNALS.length, 10);
  assert.equal(new Set(LAB_SIGNALS.map(({ id }) => id)).size, 10);
  assert.deepEqual(
    LAB_SIGNALS.filter(({ kind }) => kind === 'plugin').map(({ title }) => title),
    ['RandoNoteAndHold', 'ProbDropoutMidi', 'ChaosMouse', 'DataHell'],
  );
  assert.deepEqual(
    LAB_SIGNALS.filter(({ kind }) => kind === 'infobit').map(({ title }) => title),
    ['Wiard Noisering', 'NLC Sloth', 'Wogglebug', 'Bananalogue VCS'],
  );
  assert.equal(LAB_SIGNALS.filter(({ kind }) => kind === 'infobits-index').length, 1);

  for (const signal of LAB_SIGNALS) {
    assert.match(signal.url, /^https:\/\/mamonulabs\.github\.io\//);
    assert.ok(getActiveSignals(signal.depth).some(({ id }) => id === signal.id));
  }
  assert.deepEqual(getActiveSignals(0), []);
});

test('the labs itself is the deepest point of the journey', () => {
  const deepest = [...LAB_SIGNALS].sort((a, b) => b.depth - a.depth)[0];
  assert.equal(deepest.id, 'mamonulabs');
  assert.equal(deepest.kind, 'labs-index');
  assert.equal(deepest.url, 'https://mamonulabs.github.io/');
  assert.equal(LAB_SIGNALS.filter(({ kind }) => kind === 'labs-index').length, 1);
  // Reachable before the scroll bottoms out, and still lit when it does.
  assert.ok(deepest.depth < 1);
  assert.ok(getActiveSignals(1).some(({ id }) => id === 'mamonulabs'));
});

test('the infobit strand is unbroken from first infobit to the labs door', () => {
  const chain = LAB_SIGNALS.filter(({ kind }) => CHAIN_KINDS.has(kind)).sort((a, b) => a.depth - b.depth);
  assert.deepEqual(chain.map(({ id }) => id), ['noisering', 'nlc-sloth', 'wogglebug', 'bananalogue-vcs', 'all-infobits', 'mamonulabs']);
  // Consecutive links must stay close, or the thread reads as gaps.
  for (let i = 1; i < chain.length; i += 1) {
    const gap = chain[i].depth - chain[i - 1].depth;
    assert.ok(gap > 0, `${chain[i].id} must sit deeper than ${chain[i - 1].id}`);
    assert.ok(gap <= 0.15, `${chain[i - 1].id} → ${chain[i].id} gap ${gap} breaks the strand`);
  }
});

test('invalid or out-of-range progress activates no signals', () => {
  assert.deepEqual(getActiveSignals(Number.NaN), []);
  assert.deepEqual(getActiveSignals(-0.1), []);
  assert.deepEqual(getActiveSignals(1.1), []);
});

test('visible mamonu branding is lowercase', () => {
  const files = ['index.html', 'src/main.js', 'src/content.js'];
  for (const file of files) {
    const visibleText = readFileSync(file, 'utf8').replaceAll(/https?:\/\/[^"'\s<]+/g, '');
    assert.doesNotMatch(visibleText, /MAMONU(?:LABS)?|Mamonu(?:Labs)?/, file);
  }
});
