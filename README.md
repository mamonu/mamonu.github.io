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

## Writings

The writings panel is generated from `src/data/writings.json`, refreshed from the
Hashnode RSS feed:

```sh
pnpm writings:update -- --dry-run
pnpm writings:update
```

The feed is the source of truth for titles, dates and tags. Posts the feed has
aged out are kept, never dropped, so the archive only ever grows.

Renaming a post on Hashnode changes its slug and the old URL stops resolving.
The update cannot tell that from a post that has simply aged out, so it reports
the new one as added and keeps the stale entry. Drop that entry by name:

```sh
pnpm writings:update -- --forget https://mamonu.hashnode.dev/old-slug
``` Review and commit the updated data before
deploying.

## GitHub activity

The activity view uses `public/data/github-activity.json`. To refresh it,
sign in with GitHub CLI, then run:

```sh
pnpm activity:update -- --dry-run
pnpm activity:update
```

Review and commit the updated data before deploying. Use `--backfill` to
refresh all available years. Existing historical dates are preserved.

