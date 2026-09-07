export function layoutActivityYear(days, year) {
  return days.map(day => {
    const month = Number(day.date.slice(5, 7)), date = Number(day.date.slice(8));
    const row = Math.floor((date - 1) / 6);
    const column = row % 2 ? 5 - (date - 1) % 6 : (date - 1) % 6;
    // The same day always has the same local position, independent of activity.
    const position = [(column - 2.5) * .12 + Math.sin(date * 2.3) * .038,
      (row - 2.3) * .105 + Math.cos(date * 1.7) * .055 + .08,
      Math.sin(date * 1.9) * .12];
    return { ...day, month, day: date, position, intensity: day.count === 0 ? 0.06 : 0.2 + 0.8 * Math.min(1, Math.log1p(day.count) / Math.log1p(30)) };
  });
}

export function connectActivityDays(records) {
  const links = [];
  for (let i = 1; i < records.length; i++) {
    const previous = records[i - 1], current = records[i];
    if (previous.count > 0 && current.count > 0 && previous.month === current.month &&
      Date.parse(current.date) - Date.parse(previous.date) === 86400000) links.push([i - 1, i]);
  }
  return links;
}

export function layoutActivityMonths({ width, height }) {
  const mobile = width <= 700;
  const columns = mobile ? (height >= 760 ? 2 : 3) : 4;
  const rows = 12 / columns;
  const rect = { x: width * .035, y: mobile ? 190 : 126, width: width * .93, height: Math.max(150, height - (mobile ? 334 : 228)) };
  const cellWidth = rect.width / columns, cellHeight = rect.height / rows;
  return Array.from({ length: 12 }, (_, i) => ({ month: i + 1,
    x: rect.x + (i % columns + .5) * cellWidth,
    y: rect.y + (Math.floor(i / columns) + .5) * cellHeight,
    width: cellWidth, height: cellHeight,
  }));
}

export function pickActivityDay(projected, pointer, radiusPx = 12) {
  let result = null, closest = radiusPx * radiusPx;
  for (const point of projected) {
    if (!point.visible || !point.date) continue;
    const distance = (point.x - pointer.x) ** 2 + (point.y - pointer.y) ** 2;
    if (distance <= closest && (result === null || distance < closest)) { closest = distance; result = point.date; }
  }
  return result;
}
