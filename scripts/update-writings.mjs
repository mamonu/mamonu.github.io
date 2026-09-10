import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { mergeWritings, validateWritings } from '../src/writings-data.js';

const FEED_URL = 'https://mamonu.hashnode.dev/rss.xml';

const decodeEntities = value => String(value)
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'")
  .replaceAll('&apos;', "'")
  .replaceAll('&amp;', '&');

// Pull one element's contents, CDATA or plain text, without an XML dependency.
function tagText(item, tag) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!match) return null;
  const cdata = match[1].match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return decodeEntities((cdata ? cdata[1] : match[1]).trim());
}

function tagTextAll(item, tag) {
  return [...item.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'gi'))]
    .map(match => {
      const cdata = match[1].match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
      return decodeEntities((cdata ? cdata[1] : match[1]).trim());
    })
    .filter(Boolean);
}

export function parseFeed(xml) {
  if (typeof xml !== 'string' || !/<rss[\s>]/i.test(xml)) throw new Error('Feed is not RSS; archive unchanged.');
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map(match => match[0]);
  if (!items.length) throw new Error('Feed carried no posts; archive unchanged.');
  return items.map(item => {
    const title = tagText(item, 'title');
    const link = tagText(item, 'link') ?? tagText(item, 'guid');
    const pubDate = tagText(item, 'pubDate');
    if (!title) throw new Error('Feed item is missing a title.');
    if (!link) throw new Error(`Feed item is missing a link: ${title}`);
    const published = Date.parse(pubDate ?? '');
    if (Number.isNaN(published)) throw new Error(`Feed item has an unreadable date: ${title}`);
    return {
      // Feed titles carry stray double spaces and trailing whitespace.
      title: title.replace(/\s+/g, ' ').trim(),
      // Trailing slashes and query strings would read as different posts on merge.
      url: link.split(/[?#]/)[0].replace(/\/+$/, ''),
      date: new Date(published).toISOString().slice(0, 10),
      published: new Date(published).toISOString(),
      tags: tagTextAll(item, 'category').map(tag => tag.trim()).filter(Boolean),
    };
  });
}

export async function fetchFeed(url = FEED_URL) {
  const response = await fetch(url, { headers: { accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8' } });
  if (!response.ok) throw new Error(`Feed request failed: ${response.status} ${response.statusText}`);
  return response.text();
}

export async function runUpdate({ archivePath, now = new Date(), dryRun = false, forget = [], fetchFeed: readFeed = fetchFeed, onProgress = () => {} }) {
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid update time.');
  const updatedAt = now.toISOString();
  let existing;
  try { existing = validateWritings(JSON.parse(await readFile(archivePath, 'utf8'))); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  existing ??= { schemaVersion: 1, source: FEED_URL, updatedAt, posts: [] };
  if (existing.updatedAt > updatedAt) throw new Error('Local clock predates the archive.');

  // Renaming a post on Hashnode changes its slug, and the old URL 404s. The
  // merge cannot tell that from a post the feed has simply aged out, so a
  // re-slugged entry is dropped by hand rather than guessed at.
  if (forget.length) {
    const held = new Set(existing.posts.map(post => post.url));
    const unknown = forget.filter(url => !held.has(url));
    if (unknown.length) throw new Error(`Not in the archive, so cannot forget: ${unknown.join(', ')}`);
    existing = { ...existing, posts: existing.posts.filter(post => !forget.includes(post.url)) };
  }

  onProgress(`Reading ${FEED_URL}…`);
  const incoming = parseFeed(await readFeed(FEED_URL));
  const known = new Map(existing.posts.map(post => [post.url, post]));
  const summary = { added: 0, changed: 0, unchanged: 0, retained: 0, forgotten: forget.length, changes: [] };
  for (const post of incoming) {
    const before = known.get(post.url);
    if (!before) {
      summary.added++;
      summary.changes.push({ kind: 'added', title: post.title, fields: [] });
      continue;
    }
    // Report exactly what moved, so a dry run is reviewable without a diff.
    const fields = ['title', 'published']
      .filter(field => before[field] !== post[field])
      .map(field => ({ field, from: before[field], to: post[field] }));
    if (fields.length) summary.changes.push({ kind: 'updated', title: post.title, fields });
    if (fields.length) summary.changed++;
    else summary.unchanged++;
  }
  // Posts the feed has aged out are the whole reason this merges rather than replaces.
  const seen = new Set(incoming.map(post => post.url));
  summary.retained = existing.posts.filter(post => !seen.has(post.url)).length;

  const archive = mergeWritings({ ...existing, source: FEED_URL }, incoming, updatedAt);
  summary.archive = archive;
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
    const forget = args.flatMap((arg, index) => (arg === '--forget' ? [args[index + 1]] : []));
    if (forget.some(url => !url || url.startsWith('--'))) throw new Error('--forget needs a post url.');
    const flags = args.filter(arg => arg.startsWith('--'));
    if (flags.some(flag => !['--dry-run', '--forget'].includes(flag))) throw new Error('Usage: node scripts/update-writings.mjs [--dry-run] [--forget <url>]');
    const result = await runUpdate({ archivePath: fileURLToPath(new URL('../src/data/writings.json', import.meta.url)), dryRun: args.includes('--dry-run'), forget, onProgress: console.log });
    console.log(`${args.includes('--dry-run') ? 'Dry run' : 'Writings saved'}: ${result.added} added, ${result.changed} updated, ${result.unchanged} unchanged, ${result.retained} kept beyond the feed${result.forgotten ? `, ${result.forgotten} forgotten` : ''}.`);
    for (const change of result.changes) {
      console.log(`  ${change.kind}: ${change.title}`);
      for (const { field, from, to } of change.fields) console.log(`    ${field}: ${from} → ${to}`);
    }
    console.log(`Archive holds ${result.archive.posts.length} posts, newest ${result.archive.posts[0]?.date ?? 'none'}.`);
    console.log('The feed carries only the most recent posts; older entries are preserved, never dropped.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
