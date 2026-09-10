import { activateSignal, createSignalState, dismissSignal, placePreview } from './signal-state.js';

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const KIND_LABELS = { 'infobits-index': 'knowledge base', 'labs-index': 'the labs' };
const kindLabel = kind => KIND_LABELS[kind] ?? kind;

export function createSignalMarkup(signal) {
  const title = escapeHtml(signal.title);
  const kind = escapeHtml(kindLabel(signal.kind));
  const phase = (-signal.depth * 6).toFixed(2);
  return `<a class="deep-signal" data-signal="${escapeHtml(signal.id)}" href="${escapeHtml(signal.url)}" target="_blank" rel="noopener noreferrer" aria-label="${title}, ${kind}" style="--signal-phase:${phase}s" hidden tabindex="-1"><span class="signal-halo" aria-hidden="true"></span><span class="signal-ping" aria-hidden="true"></span><span class="signal-core" aria-hidden="true"></span><span class="signal-copy"><small>${kind}</small><strong>${title}</strong><span>${escapeHtml(signal.summary)}</span><i>open ↗</i></span></a>`;
}

export function createFallbackMarkup(intro, signals) {
  // The labs itself is the introduction's own call to action, so it is not
  // repeated in the list of destinations below it.
  const destinations = signals.filter(signal => signal.kind !== 'labs-index');
  return `<section class="labs-fallback"><small>${escapeHtml(intro.eyebrow)}</small><h2>${escapeHtml(intro.heading)}</h2><p>${escapeHtml(intro.summary)}</p><a href="${escapeHtml(intro.url)}" target="_blank" rel="noopener noreferrer">visit mamonulabs ↗</a><ul>${destinations.map(signal => `<li><a href="${escapeHtml(signal.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(signal.title)} ↗</a></li>`).join('')}</ul></section>`;
}

export function applyProjectedPosition(element, projected, enabled) {
  const visible = Boolean(enabled && projected?.visible);
  element.hidden = !visible;
  element.tabIndex = visible ? 0 : -1;
  element.style.display = visible ? 'grid' : 'none';
  if (visible) {
    element.style.setProperty('--signal-x', `${Math.round(projected.x)}px`);
    element.style.setProperty('--signal-y', `${Math.round(projected.y)}px`);
  }
}

// Stillness has two causes and they deserve different answers. Someone who
// asked their system for reduced motion still needs a way to reach the labs,
// so they get the plain list. Someone who pressed Pause asked for a quiet
// scene, not a panel of links — they get nothing, and resuming brings the
// signals back.
export function getLayerMode({ enabled, calm, failed, calmByPreference = false }) {
  if (!enabled) return 'hidden';
  if (failed) return 'fallback';
  if (calm) return calmByPreference ? 'list' : 'hidden';
  return 'signals';
}

export function createSignalLayer({ root, fallback, intro, signals, coarsePointer = () => false, openUrl = url => window.open(url, '_blank', 'noopener,noreferrer') }) {
  root.innerHTML = `${signals.map(createSignalMarkup).join('')}<div class="signal-preview" role="status" hidden></div>`;
  const preview = root.querySelector('.signal-preview');
  const links = new Map([...root.querySelectorAll('[data-signal]')].map(link => [link.dataset.signal, link]));
  const byId = new Map(signals.map(signal => [signal.id, signal]));
  let state = createSignalState(coarsePointer() ? 'coarse' : 'fine');
  let failed = false;

  function hidePreview() {
    state = dismissSignal(state);
    preview.hidden = true;
    for (const link of links.values()) link.removeAttribute('aria-expanded');
  }

  function showPreview(id) {
    const link = links.get(id);
    const signal = byId.get(id);
    if (!link || link.hidden || !signal) return;
    preview.innerHTML = `<small>${escapeHtml(kindLabel(signal.kind))}</small><strong>${escapeHtml(signal.title)}</strong><span>${escapeHtml(signal.summary)}</span><i>open ↗</i>`;
    preview.hidden = false;
    link.setAttribute('aria-expanded', 'true');
    const rect = link.getBoundingClientRect();
    const size = { width: preview.offsetWidth, height: preview.offsetHeight };
    const placed = placePreview(rect, size, { width: innerWidth, height: innerHeight }, { top: 120, right: 12, bottom: 12, left: 12 });
    preview.style.left = `${placed.left}px`;
    preview.style.top = `${placed.top}px`;
    preview.dataset.side = placed.side;
  }

  function onClick(event) {
    const link = event.target.closest('[data-signal]');
    if (!link || link.hidden) return;
    const pointerMode = coarsePointer() && event.detail !== 0 ? 'coarse' : 'fine';
    state = { ...state, pointerMode };
    const result = activateSignal(state, link.dataset.signal);
    state = result.state;
    if (result.action === 'preview') {
      event.preventDefault();
      showPreview(link.dataset.signal);
    } else if (pointerMode === 'coarse') {
      event.preventDefault();
      openUrl(byId.get(link.dataset.signal).url);
    }
  }

  function onPointerOver(event) {
    if (coarsePointer()) return;
    const link = event.target.closest('[data-signal]');
    if (link && !link.hidden) showPreview(link.dataset.signal);
  }

  function onFocusIn(event) {
    const link = event.target.closest('[data-signal]');
    if (link && !link.hidden) showPreview(link.dataset.signal);
  }

  function onOutside(event) {
    if (!event.target.closest('[data-signal]') && !event.target.closest('.signal-preview')) hidePreview();
  }

  function onKey(event) {
    if (event.key === 'Escape' && !preview.hidden) hidePreview();
  }

  root.addEventListener('click', onClick);
  root.addEventListener('pointerover', onPointerOver);
  root.addEventListener('focusin', onFocusIn);
  root.addEventListener('pointerleave', event => { if (!coarsePointer() && !root.contains(event.relatedTarget)) hidePreview(); });
  document.addEventListener('pointerdown', onOutside);
  document.addEventListener('keydown', onKey);

  return {
    update(projected, enabled = true, { calm = false, calmByPreference = false } = {}) {
      const mode = getLayerMode({ enabled, calm, failed, calmByPreference });
      const positions = new Map(projected.map(item => [item.id, item]));
      for (const [id, link] of links) applyProjectedPosition(link, positions.get(id), mode === 'signals');
      root.hidden = mode !== 'signals';
      fallback.hidden = mode !== 'list' && mode !== 'fallback';
      if (mode === 'list' && !fallback.innerHTML) fallback.innerHTML = createFallbackMarkup(intro, signals);
      fallback.classList.toggle('is-calm-list', mode === 'list');
      if (mode !== 'signals' || (state.selectedId && links.get(state.selectedId)?.hidden)) hidePreview();
    },
    dismiss: hidePreview,
    exposeFallback() {
      failed = true;
      hidePreview();
      root.hidden = true;
      fallback.innerHTML = createFallbackMarkup(intro, signals);
      fallback.hidden = false;
    },
    dispose() {
      root.removeEventListener('click', onClick);
      root.removeEventListener('pointerover', onPointerOver);
      root.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('keydown', onKey);
    },
  };
}
