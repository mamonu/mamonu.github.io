import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LAB_SIGNALS, assertValidCatalogue, getActiveSignals } from '../src/labs-signals.js';

test('catalogue contains nine unique destinations', () => {
  assert.equal(assertValidCatalogue(LAB_SIGNALS), true);
  assert.equal(LAB_SIGNALS.length, 9);
  assert.equal(new Set(LAB_SIGNALS.map(({ id }) => id)).size, 9);
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
