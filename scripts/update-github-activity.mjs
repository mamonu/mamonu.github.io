import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { validateArchive, mergeArchive } from '../src/activity-data.js';

const DISCOVERY = 'query { user(login: "mamonu") { login contributionsCollection { contributionYears } } }';
const CALENDAR = `query Activity($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) { login contributionsCollection(from: $from, to: $to) {
    contributionCalendar { weeks { contributionDays { date contributionCount } } }
  } }
}`;

export function queryGithub(query, variables = {}) {
  return new Promise((resolveResult, reject) => {
    const child = spawn('gh', ['api', 'graphql', '--input', '-'], { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '', error = '';
    const timeout = setTimeout(() => { child.kill(); reject(new Error('GitHub request timed out; archive unchanged.')); }, 60000);
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { error += chunk; });
    child.stdin.on('error', () => {});
    child.on('error', err => { clearTimeout(timeout); reject(new Error(`Cannot run gh: ${err.message}`)); });
    child.on('close', code => {
      clearTimeout(timeout);
      if (code !== 0) return reject(new Error(`GitHub request failed: ${error.trim() || `exit ${code}`}`));
      try { resolveResult(JSON.parse(output)); } catch { reject(new Error('GitHub returned invalid JSON.')); }
    });
    child.stdin.end(JSON.stringify({ query, variables }));
  });
}

function checkedUser(envelope) {
  if (envelope?.errors?.length) throw new Error(`GitHub GraphQL error: ${envelope.errors.map(error => error.message).join('; ')}`);
  if (envelope?.data?.user?.login !== 'mamonu') throw new Error('GitHub returned a missing or incorrect account.');
  return envelope.data.user;
}

function nextDay(day) { return new Date(Date.parse(`${day}T00:00:00Z`) + 86400000).toISOString().slice(0, 10); }

function requestedRanges(start, today) {
  const ranges = [];
  while (start <= today) {
    const end = `${start.slice(0, 4)}-12-31` < today ? `${start.slice(0, 4)}-12-31` : today;
    ranges.push({ start, end });
    start = nextDay(end);
  }
  return ranges;
}

export async function runUpdate({ archivePath, now = new Date(), backfill = false, dryRun = false, queryGithub: query = queryGithub, onProgress = () => {} }) {
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid update time.');
  const updatedAt = now.toISOString(), today = updatedAt.slice(0, 10);
  let existing;
  try { existing = validateArchive(JSON.parse(await readFile(archivePath, 'utf8'))); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  existing ??= { schemaVersion: 1, login: 'mamonu', source: 'github-contribution-calendar', visibility: 'aggregate-counts', updatedAt, days: [] };
  if (existing.updatedAt > updatedAt) throw new Error('Local clock predates the archive.');

  const discovery = checkedUser(await query(DISCOVERY, {}));
  const years = discovery.contributionsCollection?.contributionYears;
  if (!Array.isArray(years) || years.some(year => !Number.isInteger(year) || year < 2008 || year > now.getUTCFullYear())) throw new Error('Invalid contribution years.');
  const earliest = years.length ? `${Math.min(...years)}-01-01` : `${now.getUTCFullYear()}-01-01`;
  let start = earliest;
  if (existing.days.length && !backfill) {
    // Clamp Feb 29 to Feb 28 in the preceding year.
    const priorYear = now.getUTCFullYear() - 1;
    const month = now.getUTCMonth();
    const day = Math.min(now.getUTCDate(), new Date(Date.UTC(priorYear, month + 1, 0)).getUTCDate());
    const trailing = new Date(Date.UTC(priorYear, month, day)).toISOString().slice(0, 10);
    // Refresh the previous observed day as well when updates have been missed.
    start = trailing < existing.days.at(-1).date ? trailing : existing.days.at(-1).date;
    if (start < earliest) start = earliest;
  }
  const incoming = [];
  for (const { start: fromDay, end } of requestedRanges(start, today)) {
    onProgress(`Reading ${fromDay} to ${end}…`);
    const variables = { login: 'mamonu', from: `${fromDay}T00:00:00Z`, to: end === today ? updatedAt : `${end}T23:59:59Z` };
    const user = checkedUser(await query(CALENDAR, variables));
    const weeks = user.contributionsCollection?.contributionCalendar?.weeks;
    if (!Array.isArray(weeks) || weeks.some(week => !Array.isArray(week.contributionDays))) throw new Error('Invalid contribution calendar.');
    const days = weeks.flatMap(week => week.contributionDays).map(day => ({ date: day.date, count: day.contributionCount }));
    // Validate records before trimming the calendar's week padding.
    const checked = validateArchive({ ...existing, updatedAt, days }).days.filter(day => day.date >= fromDay && day.date <= end);
    const byDate = new Map(checked.map(day => [day.date, day]));
    for (let day = fromDay; day <= end; day = nextDay(day)) {
      if (!byDate.has(day)) throw new Error(`Incomplete GitHub coverage: missing ${day}. Archive unchanged.`);
    }
    incoming.push(...checked);
  }
  const archive = mergeArchive({ ...existing, visibility: 'aggregate-counts' }, incoming, updatedAt);
  const old = new Map(existing.days.map(day => [day.date, day.count]));
  const summary = { archive, added: 0, corrected: 0, unchanged: 0, gaps: 0 };
  for (const day of incoming) {
    if (!old.has(day.date)) summary.added++;
    else if (old.get(day.date) !== day.count) summary.corrected++;
    else summary.unchanged++;
  }
  for (let i = 1; i < archive.days.length; i++) summary.gaps += Math.round((Date.parse(archive.days[i].date) - Date.parse(archive.days[i - 1].date)) / 86400000) - 1;
  if (!dryRun) {
    await mkdir(dirname(archivePath), { recursive: true });
    const temp = `${archivePath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temp, JSON.stringify(archive, null, 2) + '\n', { flag: 'wx' });
      await rename(temp, archivePath);
    } finally { await rm(temp, { force: true }); }
  }
  return summary;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  try {
    if (args.some(arg => !['--dry-run', '--backfill'].includes(arg))) throw new Error('Usage: node scripts/update-github-activity.mjs [--dry-run] [--backfill]');
    const result = await runUpdate({ archivePath: fileURLToPath(new URL('../public/data/github-activity.json', import.meta.url)), dryRun: args.includes('--dry-run'), backfill: args.includes('--backfill'), onProgress: console.log });
    console.log(`${args.includes('--dry-run') ? 'Dry run' : 'Archive saved'}: ${result.added} added, ${result.corrected} corrected, ${result.unchanged} unchanged.`);
    console.log(`Coverage: ${result.archive.days[0]?.date ?? 'empty'} to ${result.archive.days.at(-1)?.date ?? 'empty'}; ${result.gaps} unobserved days.`);
    console.log('Only daily counts are stored, including private aggregates available to this account. No activity details are requested.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
