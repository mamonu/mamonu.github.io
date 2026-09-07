import { activateSignal, createSignalState, dismissSignal, placePreview } from './signal-state.js';

const escapeHtml = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const kindLabel = kind => kind === 'infobits-index' ? 'knowledge base' : kind;

export function createSignalMarkup(signal) {
  const title = escapeHtml(signal.title);
  const kind = escapeHtml(kindLabel(signal.kind));
  const phase = (-signal.depth * 6).toFixed(2);
  return `<a class="deep-signal" data-signal="${escapeHtml(signal.id)}" href="${escapeHtml(signal.url)}" target="_blank" rel="noopener noreferrer" aria-label="${title}, ${kind}" style="--signal-phase:${phase}s" hidden tabindex="-1"><span class="signal-halo" aria-hidden="true"></span><span class="signal-ping" aria-hidden="true"></span><span class="signal-core" aria-hidden="true"></span><span class="signal-copy"><small>${kind}</small><strong>${title}</strong><span>${escapeHtml(signal.summary)}</span><i>open ↗</i></span></a>`;
}

export function createFallbackMarkup(intro, signals) {
  return `<section class="labs-fallback"><small>${escapeHtml(intro.eyebrow)}</small><h2>${escapeHtml(intro.heading)}</h2><p>${escapeHtml(intro.summary)}</p><a href="${escapeHtml(intro.url)}" target="_blank" rel="noopener noreferrer">visit mamonulabs ↗</a><ul>${signals.map(signal => `<li><a href="${escapeHtml(signal.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(signal.title)} ↗</a></li>`).join('')}</ul></section>`;
}

export function createIntroMarkup(intro, signals) {
  const plugins = signals.filter(signal => signal.kind === 'plugin');
  return `<small>${escapeHtml(intro.eyebrow)}</small><h2>${escapeHtml(intro.heading)}</h2><p>${escapeHtml(intro.summary)}</p><div class="labs-plugin-names">${plugins.map(signal => `<span>${escapeHtml(signal.title)}</span>`).join('')}</div><a href="${escapeHtml(intro.url)}" target="_blank" rel="noopener noreferrer">enter mamonulabs ↗</a>`;
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

export function transmissionOpacity(progress) {
  if (!Number.isFinite(progress) || progress <= 0.28 || progress >= 0.43) return 0;
  if (progress === 0.35) return 1;
  if (progress <= 0.35) return (progress - 0.28) / 0.07;
  return (0.43 - progress) / 0.08;
}

export function getLayerMode({ enabled, calm, failed }) {
  if (!enabled) return 'hidden';
  if (failed) return 'fallback';
  if (calm) return 'list';
  return 'signals';
}

export function createSignalLayer({ root, transmission, fallback, intro, signals, coarsePointer = () => false, openUrl = url => window.open(url, '_blank', 'noopener,noreferrer') }) {
  root.innerHTML = `${signals.map(createSignalMarkup).join('')}<div class="signal-preview" role="status" hidden></div>`;
  transmission.innerHTML = createIntroMarkup(intro, signals);
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
    update(projected, progress, enabled = true, { calm = false } = {}) {
      const mode = getLayerMode({ enabled, calm, failed });
      const positions = new Map(projected.map(item => [item.id, item]));
      for (const [id, link] of links) applyProjectedPosition(link, positions.get(id), mode === 'signals');
      root.hidden = mode !== 'signals';
      transmission.style.opacity = String(mode === 'signals' ? transmissionOpacity(progress) : 0);
      transmission.hidden = mode !== 'signals' || transmissionOpacity(progress) === 0;
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
      transmission.hidden = true;
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
