# mamonu.github.io

Personal website for Theodore Manassis, built with Three.js and Vite.

[Visit the site](https://mamonu.github.io/)

## Development

Requires Node.js 22.12+ and pnpm 10.30.3.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The development server runs at http://127.0.0.1:5173/.
On Windows, `preview-site.bat` installs dependencies if needed and opens
the local preview.

## Checks

```sh
pnpm test
pnpm check:deploy
```

The deployment check builds the site and verifies the published files in
a temporary local Git repository without contacting GitHub.

## Publishing

Source lives on `main`. GitHub Pages serves the built files from
`gh-pages`, at the branch root.

```sh
pnpm deploy
```

This builds the site and publishes it to https://mamonu.github.io/ using
your GitHub credentials. Check the Pages deployment status after publishing.

## GitHub activity

The activity view uses `public/data/github-activity.json`. To refresh it,
sign in with GitHub CLI, then run:

```sh
pnpm activity:update -- --dry-run
pnpm activity:update
```

Review and commit the updated data before deploying. Use `--backfill` to
refresh all available years. Existing historical dates are preserved.

