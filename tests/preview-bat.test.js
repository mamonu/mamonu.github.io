import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';

test('Windows preview launcher validates prerequisites without starting a server', () => {
  const root = resolve(import.meta.dirname, '..');
  const result = spawnSync('cmd.exe', ['/d', '/c', 'preview-site.bat', '--check'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${dirname(process.execPath)};${process.env.PATH}` },
    timeout: 10_000,
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /PREVIEW CHECK OK/);
  assert.doesNotMatch(result.stdout, /Local:/);
});
