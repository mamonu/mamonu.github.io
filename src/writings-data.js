// Shape and merge rules for the writings archive. The Hashnode feed only ever
// carries the most recent handful of posts, so the archive is the record and
// the feed is a partial refresh of it: entries absent from a fetch are kept.
const SCHEMA_VERSION = 1;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const POST_URL = /^https:\/\/mamonu\.hashnode\.dev\/[\w-]+$/;

export function validateWritings(archive) {
  if (!archive || typeof archive !== 'object') throw new Error('Writings archive must be an object.');
  if (archive.schemaVersion !== SCHEMA_VERSION) throw new Error(`Unsupported writings schema: ${archive.schemaVersion}`);
  if (typeof archive.updatedAt !== 'string' || Number.isNaN(Date.parse(archive.updatedAt))) throw new Error('Invalid writings updatedAt.');
  if (!Array.isArray(archive.posts)) throw new Error('Writings archive must carry a posts array.');
  const urls = new Set();
  for (const post of archive.posts) {
    if (!post || typeof post !== 'object') throw new Error('Invalid writings entry.');
    if (typeof post.url !== 'string' || !POST_URL.test(post.url)) throw new Error(`Invalid post url: ${post?.url}`);
    if (urls.has(post.url)) throw new Error(`Duplicate post url: ${post.url}`);
    urls.add(post.url);
    if (typeof post.title !== 'string' || !post.title.trim()) throw new Error(`Missing title: ${post.url}`);
    if (typeof post.date !== 'string' || !ISO_DATE.test(post.date) || Number.isNaN(Date.parse(post.date))) throw new Error(`Invalid date: ${post.url}`);
    if (typeof post.published !== 'string' || Number.isNaN(Date.parse(post.published))) throw new Error(`Invalid published time: ${post.url}`);
    // The displayed date must be the day the timestamp actually falls on.
    if (new Date(post.published).toISOString().slice(0, 10) !== post.date) throw new Error(`Date and published time disagree: ${post.url}`);
    if (!Array.isArray(post.tags) || post.tags.some(tag => typeof tag !== 'string' || !tag.trim())) throw new Error(`Invalid tags: ${post.url}`);
  }
  return archive;
}

// Newest first by full publication time, so two posts on the same day keep the
// order they were actually published in. Title breaks an exact tie, so the
// result never depends on input order.
export function sortPosts(posts) {
  return [...posts].sort((a, b) => {
    const byTime = Date.parse(b.published) - Date.parse(a.published);
    return byTime || a.title.localeCompare(b.title);
  });
}

export function mergeWritings(existing, incoming, updatedAt) {
  const byUrl = new Map(existing.posts.map(post => [post.url, post]));
  for (const post of incoming) byUrl.set(post.url, { ...byUrl.get(post.url), ...post });
  return validateWritings({ ...existing, schemaVersion: SCHEMA_VERSION, updatedAt, posts: sortPosts([...byUrl.values()]) });
}

export function formatWritingDate(date) {
  if (typeof date !== 'string' || !ISO_DATE.test(date)) throw new Error(`Invalid date: ${date}`);
  const [year, month, day] = date.split('-');
  const name = MONTHS[Number(month) - 1];
  if (!name) throw new Error(`Invalid month: ${date}`);
  return `${day} ${name} ${year}`;
}

export { SCHEMA_VERSION };
