const POINTER_MODES = new Set(['fine', 'coarse']);

export function createSignalState(pointerMode = 'fine') {
  if (!POINTER_MODES.has(pointerMode)) throw new TypeError(`Unknown pointer mode: ${pointerMode}`);
  return { selectedId: null, pointerMode };
}

export function activateSignal(state, id) {
  if (!id) throw new TypeError('A signal id is required');
  if (state.pointerMode === 'fine') return { state: { ...state, selectedId: null }, action: 'open' };
  if (state.selectedId === id) return { state, action: 'open' };
  return { state: { ...state, selectedId: id }, action: 'preview' };
}

export function dismissSignal(state) {
  return state.selectedId === null ? state : { ...state, selectedId: null };
}

export function placePreview(anchorRect, previewSize, viewport, margin = 12) {
  const edges = typeof margin === 'number'
    ? { top: margin, right: margin, bottom: margin, left: margin }
    : margin;
  const gap = 16;
  const fitsRight = anchorRect.right + gap + previewSize.width <= viewport.width - edges.right;
  const side = fitsRight ? 'right' : 'left';
  const preferredLeft = fitsRight
    ? anchorRect.right + gap
    : anchorRect.left - gap - previewSize.width;
  const preferredTop = anchorRect.top + anchorRect.height / 2 - previewSize.height / 2;
  const maxLeft = Math.max(edges.left, viewport.width - edges.right - previewSize.width);
  const maxTop = Math.max(edges.top, viewport.height - edges.bottom - previewSize.height);

  return {
    left: Math.round(Math.min(Math.max(preferredLeft, edges.left), maxLeft)),
    top: Math.round(Math.min(Math.max(preferredTop, edges.top), maxTop)),
    side,
  };
}
