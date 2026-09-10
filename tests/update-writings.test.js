import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFeed, runUpdate } from '../scripts/update-writings.mjs';

const feed = items => `<?xml version="1.0"?><rss version="2.0"><channel>${items}</channel></rss>`;
const item = ({ title = 'A post', slug = 'a-post', date = 'Thu, 10 Sep 2026 13:18:00 GMT', body = '<p>one two three</p>', tags = ['ai'] } = {}) =>
  `<item><title><![CDATA[${title}]]></title><link>https://mamonu.hashnode.dev/${slug}</link><pubDate>${date}</pubDate>${tags.map(tag => `<category><![CDATA[${tag}]]></category>`).join('')}<content:encoded><![CDATA[${body}]]></content:encoded></item>`;

async function archiveIn(posts) {
  const dir = await mkdtemp(join(tmpdir(), 'writings-'));
  const path = join(dir, 'writings.json');
  if (posts) await writeFile(path, JSON.stringify({ schemaVersion: 1, source: 'feed', updatedAt: '2026-01-01T00:00:00.000Z', posts }, null, 2));
  return path;
}

test('a feed item becomes a post', () => {
  const [post] = parseFeed(feed(item()));
  assert.equal(post.title, 'A post');
  assert.equal(post.url, 'https://mamonu.hashnode.dev/a-post');
  assert.equal(post.date, '2026-09-10');
  assert.equal(post.published, '2026-09-10T13:18:00.000Z');
  assert.deepEqual(post.tags, ['ai']);
});

test('entities and CDATA survive parsing, and link noise does not split a post', () => {
  const [post] = parseFeed(feed(`<item><title>Cats &amp; dogs</title><link>https://mamonu.hashnode.dev/a-post/?utm_source=rss</link><pubDate>Thu, 10 Sep 2026 13:18:00 GMT</pubDate><description>hi</description></item>`));
  assert.equal(post.title, 'Cats & dogs');
  assert.equal(post.url, 'https://mamonu.hashnode.dev/a-post');
});

test('a broken feed leaves the archive alone', async () => {
  const path = await archiveIn([]);
  assert.throws(() => parseFeed('<html>not a feed</html>'), /not RSS/);
  assert.throws(() => parseFeed(feed('')), /no posts/);
  assert.throws(() => parseFeed(feed('<item><title>x</title><link>https://mamonu.hashnode.dev/x</link><pubDate>whenever</pubDate></item>')), /unreadable date/);
  await assert.rejects(runUpdate({ archivePath: path, fetchFeed: async () => { throw new Error('offline'); } }), /offline/);
});

test('an update adds new posts and keeps ones the feed no longer carries', async () => {
  const path = await archiveIn([{
    url: 'https://mamonu.hashnode.dev/ancient', title: 'Ancient', date: '2025-01-01',
    published: '2025-01-01T00:00:00.000Z', tags: [],
  }]);
  const summary = await runUpdate({
    archivePath: path,
    now: new Date('2026-09-11T00:00:00.000Z'),
    fetchFeed: async () => feed(item({ title: 'Fresh', slug: 'fresh' })),
  });
  assert.deepEqual({ added: summary.added, retained: summary.retained }, { added: 1, retained: 1 });
  const saved = JSON.parse(await readFile(path, 'utf8'));
  assert.deepEqual(saved.posts.map(post => post.title), ['Fresh', 'Ancient']);
  assert.equal(saved.updatedAt, '2026-09-11T00:00:00.000Z');
});

test('a dry run reports what would change and writes nothing', async () => {
  const path = await archiveIn([]);
  const before = await readFile(path, 'utf8');
  const summary = await runUpdate({ archivePath: path, dryRun: true, fetchFeed: async () => feed(item()) });
  assert.equal(summary.added, 1);
  assert.equal(await readFile(path, 'utf8'), before);
});

test('a second identical run changes nothing', async () => {
  const path = await archiveIn([]);
  const fetchFeed = async () => feed(item());
  await runUpdate({ archivePath: path, fetchFeed });
  const first = await readFile(path, 'utf8');
  const summary = await runUpdate({ archivePath: path, fetchFeed, now: new Date('2026-09-12T00:00:00.000Z') });
  assert.deepEqual({ added: summary.added, unchanged: summary.unchanged }, { added: 0, unchanged: 1 });
  assert.deepEqual(JSON.parse(first).posts, JSON.parse(await readFile(path, 'utf8')).posts);
});

test('the real Hashnode feed shape parses, whitespace quirks and all', async () => {
  const xml = await readFile(new URL('./fixtures/hashnode-feed.xml', import.meta.url), 'utf8');
  const posts = parseFeed(xml);
  assert.equal(posts.length, 3);
  // Hashnode ships double spaces inside titles and trailing spaces on titles and tags.
  assert.equal(posts[1].title, 'Running Large MoE LLMs on Modest Hardware with FreeToken');
  assert.equal(posts[2].title, 'Using a mac mini (2012) for LLM inference with KoboldCpp');
  assert.deepEqual(posts[2].tags, ['MacMini2012', 'Local LLM']);
  // Two posts on the same day must stay in true publication order.
  assert.deepEqual(posts.map(post => post.published).slice(0, 2), ['2026-09-10T13:53:40.000Z', '2026-09-10T12:44:00.000Z']);
  assert.ok(posts.every(post => post.url.startsWith('https://mamonu.hashnode.dev/')));
});

test('a dry run names each post it would change and how', async () => {
  const path = await archiveIn([{
    url: 'https://mamonu.hashnode.dev/a-post', title: 'Old title', date: '2026-09-10',
    published: '2026-09-10T13:18:00.000Z', tags: [],
  }]);
  const summary = await runUpdate({ archivePath: path, dryRun: true, fetchFeed: async () => feed(item({ title: 'New title' })) });
  assert.deepEqual(summary.changes, [{
    kind: 'updated',
    title: 'New title',
    fields: [{ field: 'title', from: 'Old title', to: 'New title' }],
  }]);
});

test('a re-slugged post is dropped by name, not guessed at', async () => {
  const path = await archiveIn([
    { url: 'https://mamonu.hashnode.dev/old-slug', title: 'Typo Title', date: '2026-08-22', published: '2026-08-22T22:46:36.000Z', tags: [] },
    { url: 'https://mamonu.hashnode.dev/keep-me', title: 'Keep', date: '2025-01-01', published: '2025-01-01T00:00:00.000Z', tags: [] },
  ]);
  const summary = await runUpdate({
    archivePath: path,
    forget: ['https://mamonu.hashnode.dev/old-slug'],
    fetchFeed: async () => feed(item({ title: 'Fixed Title', slug: 'new-slug' })),
  });
  const saved = JSON.parse(await readFile(path, 'utf8'));
  assert.deepEqual(saved.posts.map(post => post.url), ['https://mamonu.hashnode.dev/new-slug', 'https://mamonu.hashnode.dev/keep-me']);
  assert.equal(summary.forgotten, 1);
});

test('forgetting a post the archive never held is refused', async () => {
  const path = await archiveIn([]);
  await assert.rejects(
    runUpdate({ archivePath: path, forget: ['https://mamonu.hashnode.dev/never'], fetchFeed: async () => feed(item()) }),
    /cannot forget/,
  );
});
