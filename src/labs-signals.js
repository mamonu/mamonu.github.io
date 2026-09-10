export const LAB_INTRO = Object.freeze({
  eyebrow: 'mamonulabs · signal source',
  heading: 'Generative MIDI. Controlled chaos.',
  summary: 'Experimental MIDI and audio tools where probability, data and music systems meet.',
  url: 'https://mamonulabs.github.io/',
});

const records = [
  { id: 'randonoteandhold', kind: 'plugin', title: 'RandoNoteAndHold', summary: 'A generative MIDI sequencer with 17 noise algorithms, Euclidean gating and deterministic chaos.', url: 'https://mamonulabs.github.io/plugins/randonoteandhold', depth: 0.36, position: [-0.62, 0.34, -0.18], pulse: 0.84 },
  { id: 'probdropoutmidi', kind: 'plugin', title: 'ProbDropoutMidi', summary: 'A MIDI note mangler for probabilistic, grid-synced or per-note dropouts.', url: 'https://mamonulabs.github.io/plugins/probdropoutmidi', depth: 0.43, position: [0.48, -0.42, 0.12], pulse: 1.08 },
  { id: 'chaosmouse', kind: 'plugin', title: 'ChaosMouse', summary: 'Five evolving MIDI CC modulation streams derived from a Sloth chaos circuit.', url: 'https://mamonulabs.github.io/plugins/chaosmouse', depth: 0.50, position: [-0.18, -0.66, -0.08], pulse: 0.76 },
  { id: 'datahell', kind: 'plugin', title: 'DataHell', summary: 'A data-sonification instrument that turns almost anything into MIDI sequences.', url: 'https://mamonulabs.github.io/plugins/datahell', depth: 0.57, position: [0.68, 0.28, 0.18], pulse: 1.18 },
  // The infobit strand is choreographed as a single sweeping arc that converges
  // on the labs door: consecutive positions stay close in screen space so the
  // connecting thread in scene.js reads as a path being followed, not a scribble.
  { id: 'noisering', kind: 'infobit', title: 'Wiard Noisering', summary: 'Module information and history for a landmark source of musical uncertainty.', url: 'https://mamonulabs.github.io/infobits/noisering', depth: 0.64, position: [-0.62, 0.30, 0.14], pulse: 0.92 },
  { id: 'nlc-sloth', kind: 'infobit', title: 'NLC Sloth', summary: 'Ultra-slow chaos generators whose voltages evolve over minutes and hours.', url: 'https://mamonulabs.github.io/infobits/nlc-sloth', depth: 0.70, position: [-0.30, 0.52, -0.16], pulse: 0.80 },
  { id: 'wogglebug', kind: 'infobit', title: 'Wogglebug', summary: 'A history of random voltage generation from Wiard to modern interpretations.', url: 'https://mamonulabs.github.io/infobits/wogglebug', depth: 0.76, position: [0.16, 0.44, 0.08], pulse: 1.12 },
  { id: 'bananalogue-vcs', kind: 'infobit', title: 'Bananalogue VCS', summary: 'Voltage-controlled slopes, patch ideas and sounds descended from the Serge DUSG.', url: 'https://mamonulabs.github.io/infobits/bananalogue-vcs', depth: 0.82, position: [0.44, 0.12, 0.16], pulse: 0.88 },
  { id: 'all-infobits', kind: 'infobits-index', title: 'All Infobits', summary: 'Deep dives into synthesizer modules, music technology and gear history.', url: 'https://mamonulabs.github.io/infobits', depth: 0.88, position: [0.30, -0.26, -0.12], pulse: 1.22 },
  // The deepest point of the journey is the door itself.
  { id: 'mamonulabs', kind: 'labs-index', title: 'mamonulabs', summary: 'Generative MIDI and audio tools where probability, data and music systems meet.', url: 'https://mamonulabs.github.io/', depth: 0.95, position: [0.02, -0.06, 0.04], pulse: 1.00 },
];

// Signals threaded together in the scene, deepest last.
export const CHAIN_KINDS = Object.freeze(new Set(['infobit', 'infobits-index', 'labs-index']));

export const LAB_SIGNALS = Object.freeze(records.map(record => Object.freeze({
  ...record,
  position: Object.freeze(record.position),
})));

export function assertValidCatalogue(signals) {
  const ids = new Set();
  const kinds = new Set(['plugin', 'infobit', 'infobits-index', 'labs-index']);
  for (const signal of signals) {
    if (!signal?.id || ids.has(signal.id)) throw new Error(`Invalid or duplicate signal id: ${signal?.id}`);
    ids.add(signal.id);
    if (!kinds.has(signal.kind)) throw new Error(`Invalid signal kind: ${signal.kind}`);
    if (!signal.title || !signal.summary) throw new Error(`Missing signal copy: ${signal.id}`);
    if (!/^https:\/\/mamonulabs\.github\.io\//.test(signal.url)) throw new Error(`Invalid signal URL: ${signal.id}`);
    if (!Number.isFinite(signal.depth) || signal.depth < 0 || signal.depth > 1) throw new Error(`Invalid signal depth: ${signal.id}`);
    if (!Array.isArray(signal.position) || signal.position.length !== 3 || signal.position.some(value => !Number.isFinite(value) || value < -1 || value > 1)) throw new Error(`Invalid signal position: ${signal.id}`);
    if (!Number.isFinite(signal.pulse) || signal.pulse < 0.75 || signal.pulse > 1.25) throw new Error(`Invalid signal pulse: ${signal.id}`);
  }
  return true;
}

export function getActiveSignals(progress, radius = 0.075) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) return [];
  return LAB_SIGNALS.filter(signal => Math.abs(signal.depth - progress) <= radius);
}

assertValidCatalogue(LAB_SIGNALS);
