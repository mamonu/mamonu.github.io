import test from 'node:test';
import assert from 'node:assert/strict';
import { LAB_INTRO, LAB_SIGNALS } from '../src/labs-signals.js';
import { applyProjectedPosition, createFallbackMarkup, createSignalMarkup, getLayerMode } from '../src/signal-layer.js';

test('signal markup is a safe labelled external link', () => {
  const signal = LAB_SIGNALS[0];
  const html = createSignalMarkup(signal);
  assert.match(html, /<a/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, new RegExp(signal.title));
  assert.match(html, new RegExp(signal.summary));
  assert.match(html, /aria-label="RandoNoteAndHold, plugin"/);
});

test('information signals render a hidden breathing halo and radar ping', () => {
  const html = createSignalMarkup(LAB_SIGNALS[0]);
  assert.match(html, /class="signal-halo" aria-hidden="true"/);
  assert.match(html, /class="signal-ping" aria-hidden="true"/);
  assert.match(html, /--signal-phase:/);
});

test('fallback markup exposes the introduction and every destination', () => {
  const html = createFallbackMarkup(LAB_INTRO, LAB_SIGNALS);
  assert.match(html, /Generative MIDI\. Controlled chaos\./);
  for (const signal of LAB_SIGNALS) assert.match(html, new RegExp(signal.url));
});

test('nothing announces the labs before the journey reaches them', async () => {
  const layer = await import('../src/signal-layer.js');
  assert.equal(layer.createIntroMarkup, undefined);
  assert.equal(layer.transmissionOpacity, undefined);
  const markup = LAB_SIGNALS.map(layer.createSignalMarkup).join('');
  assert.doesNotMatch(markup, /labs-transmission|labs-plugin-names/);
});

test('projection application exposes visible links and hides inactive ones', () => {
  const element = { hidden: false, tabIndex: 0, style: { setProperty(name, value) { this[name] = value; } } };
  applyProjectedPosition(element, { x: 321, y: 123, visible: true }, true);
  assert.equal(element.hidden, false);
  assert.equal(element.tabIndex, 0);
  assert.equal(element.style.display, 'grid');
  assert.equal(element.style['--signal-x'], '321px');
  assert.equal(element.style['--signal-y'], '123px');

  applyProjectedPosition(element, { x: 0, y: 0, visible: false }, true);
  assert.equal(element.hidden, true);
  assert.equal(element.tabIndex, -1);
  assert.equal(element.style.display, 'none');
});

test('a still scene shows no panel, however it came to be still', () => {
  assert.equal(getLayerMode({ enabled: true, calm: false, failed: false }), 'signals');
  // Pause, or a reduced-motion preference: either way, nothing replaces the signals.
  assert.equal(getLayerMode({ enabled: true, calm: true, failed: false }), 'hidden');
  // Losing WebGL is the one case that still needs the list, as there is no scene.
  assert.equal(getLayerMode({ enabled: true, calm: false, failed: true }), 'fallback');
  assert.equal(getLayerMode({ enabled: true, calm: true, failed: true }), 'fallback');
  assert.equal(getLayerMode({ enabled: false, calm: true, failed: false }), 'hidden');
});

test('disabled layers remove visible signals from keyboard navigation', () => {
  const element = { hidden: false, tabIndex: 0, style: { setProperty() {} } };
  applyProjectedPosition(element, { x: 10, y: 10, visible: true }, false);
  assert.equal(element.hidden, true);
  assert.equal(element.tabIndex, -1);
});
