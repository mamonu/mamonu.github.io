import test from 'node:test';
import assert from 'node:assert/strict';
import { pages } from '../src/content.js';

test('writings prioritise blog posts, then the Iceberg article, then newest academic work', () => {
  const html = pages.writings.html;
  const blogPosts = html.indexOf('LATEST ON mamonu DEV BLOG');
  const iceberg = html.indexOf('Building a transaction data lake');
  const academic = html.indexOf('RESEARCH & PROCEEDINGS');
  const splink2022 = html.indexOf('Splink: Free software');
  const graphDatabases2016 = html.indexOf('Use of Graph Databases');

  assert.ok(blogPosts < iceberg, 'blog posts should appear before the Iceberg article');
  assert.ok(iceberg < academic, 'the Iceberg article should appear before academic work');
  assert.ok(splink2022 < graphDatabases2016, 'academic work should be newest first');
});
