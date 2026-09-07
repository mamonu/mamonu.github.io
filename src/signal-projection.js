export function ndcToViewport(point, viewport) {
  const visible = [point.x, point.y, point.z].every(value => Number.isFinite(value) && value >= -1 && value <= 1);
  return {
    x: Math.round((point.x + 1) * viewport.width / 2),
    y: Math.round((1 - point.y) * viewport.height / 2),
    visible,
  };
}

export function isSignalActive(depth, progress, radius = 0.075) {
  return Number.isFinite(depth) && Number.isFinite(progress) && Math.abs(depth - progress) <= radius + Number.EPSILON;
}

export function projectSignal(position, camera, viewport) {
  return ndcToViewport(position.clone().project(camera), viewport);
}
