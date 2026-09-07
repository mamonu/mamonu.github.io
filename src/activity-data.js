const ARCHIVE_KEYS = ['schemaVersion', 'login', 'source', 'visibility', 'updatedAt', 'days'];

export function isCalendarDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function validateDays(days, latest) {
  if (!Array.isArray(days)) throw new TypeError('Archive days must be an array');
  const seen = new Set();
  for (const day of days) {
    if (!day || Object.keys(day).some(key => !['date', 'count'].includes(key))
      || !isCalendarDate(day.date) || day.date > latest || seen.has(day.date)
      || !Number.isSafeInteger(day.count) || day.count < 0) throw new TypeError(`Invalid or duplicate activity day: ${day?.date}`);
    seen.add(day.date);
  }
}

export function validateArchive(value) {
  if (!value || Object.keys(value).some(key => !ARCHIVE_KEYS.includes(key))
    || value.schemaVersion !== 1 || value.login !== 'mamonu'
    || value.source !== 'github-contribution-calendar' || !['public-profile', 'aggregate-counts'].includes(value.visibility)
    || typeof value.updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value.updatedAt)
    || !Number.isFinite(Date.parse(value.updatedAt)) || !isCalendarDate(value.updatedAt.slice(0, 10))) {
    throw new TypeError('Invalid activity archive metadata');
  }
  validateDays(value.days, value.updatedAt.slice(0, 10));
  return { ...value, days: value.days.map(day => ({ ...day })).sort((a, b) => a.date.localeCompare(b.date)) };
}

export function mergeArchive(existing, incomingDays, updatedAt) {
  const previous = validateArchive(existing);
  validateDays(incomingDays, updatedAt.slice(0, 10));
  const byDate = new Map(previous.days.map(day => [day.date, day]));
  for (const day of incomingDays) byDate.set(day.date, { ...day });
  return validateArchive({ ...previous, updatedAt, days: [...byDate.values()] });
}

export function getYears(archive) {
  return [...new Set(archive.days.map(day => Number(day.date.slice(0, 4))))].sort((a, b) => b - a);
}

export function getYearDays(archive, year) {
  return archive.days.filter(day => day.date.startsWith(`${year}-`));
}
