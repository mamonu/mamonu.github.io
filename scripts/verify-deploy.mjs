import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAB_SIGNALS, assertValidCatalogue } from '../src/labs-signals.js';

// Exercise the publishing CLI without using the project's origin or GitHub.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const content = readFileSync(join(root, 'src', 'content.js'), 'utf8');
assert.match(content, /CURRENT BUILDS · FINOPS/, 'About panel must identify the current FinOps builds');
assert.match(content, /moj-copilot-ai-credits-dashboard[\s\S]*Lead contributor/, 'Dashboard must describe Theodore as lead contributor');
assert.match(content, /coat-copilot-usage-pipeline[\s\S]*Lead contributor/, 'Usage pipeline must describe Theodore as lead contributor');
assert.equal(assertValidCatalogue(LAB_SIGNALS), true, 'mamonulabs catalogue must be valid');
assert.equal(LAB_SIGNALS.length, 9, 'All curated mamonulabs destinations must ship');
const assets = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"?#]+)"/g)].map(match => match[1]);
assert.ok(assets.length >= 2, 'Built HTML must reference local bundled JS and CSS');
assert.ok(!/(?:src|href)="\/assets\//.test(html), 'Asset paths must support a repository subpath');

const tempRoot = realpathSync(tmpdir());
const fixture = realpathSync(mkdtempSync(join(tempRoot, 'mamonu-pages-check-')));
assert.equal(dirname(fixture), tempRoot, 'Fixture must be an immediate child of the temporary directory');
const remote = join(fixture, 'remote.git');
const work = join(fixture, 'work');
mkdirSync(work);
const env = { ...process.env, CACHE_DIR: join(fixture, 'cache'), GIT_TERMINAL_PROMPT: '0' };
const git = (...args) => execFileSync('git', args, { cwd: work, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

try {
  git('init', '--bare', remote);
  execFileSync(process.execPath, [
    join(root, 'node_modules', 'gh-pages', 'bin', 'gh-pages.js'),
    '-d', dist, '--nojekyll',
    '--repo', remote,
    '--user', 'Local deployment test <deployment-test@example.invalid>',
  ], { cwd: work, env, stdio: 'pipe' });

  const tree = git('--git-dir', remote, 'ls-tree', '-r', '--name-only', 'gh-pages').trim().split('\n');
  assert.ok(tree.includes('.nojekyll'), 'Published branch must bypass Jekyll');
  const sceneSource = readFileSync(join(root, 'src', 'scene.js'), 'utf8');
  const notice = sceneSource.match(/^\/\*![\s\S]*?\*\//)?.[0];
  assert.ok(notice, 'The graphics licence must remain in the source comment');
  const noticeText = notice.slice(3, -2).replace(/\s+/g, ' ').trim();
  const publishedScripts = tree.filter(path => path.endsWith('.js')).map(path =>
    git('--git-dir', remote, 'show', `gh-pages:${path}`)).join('\n');
  assert.ok(publishedScripts.replace(/\s+/g, ' ').includes(noticeText),
    'The complete source licence comment must survive bundling and publishing');
  assert.ok(!tree.includes('package.json'), 'Source files must not be published');
  const expected = readdirSync(dist, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => relative(dist, join(entry.parentPath, entry.name)).split(sep).join('/'));
  for (const path of expected) {
    assert.ok(tree.includes(path), `Missing published file: ${path}`);
    const committed = execFileSync('git', ['--git-dir', remote, 'show', `gh-pages:${path}`], { cwd: work, env });
    assert.deepEqual(committed, readFileSync(join(dist, path)), `Published content differs: ${path}`);
  }
  for (const asset of assets) assert.ok(tree.includes(asset.slice(2)), `Broken asset reference: ${asset}`);
  console.log(`PASS: gh-pages published ${expected.length} built files plus .nojekyll to an isolated local repository.`);
  console.log('PASS: published content and root/subpath asset references verified. No GitHub changes.');
} finally {
  // Delete only the exact fixture created above, after checking its resolved parent.
  assert.equal(dirname(realpathSync(fixture)), tempRoot);
  rmSync(fixture, { recursive: true, force: true });
}
