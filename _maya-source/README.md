# Maya Haglund: prepared GitHub admin migration

Status: source builds and ten tests pass. The Netlify API is deployed, but login returns 503 because its production password and signing key are unavailable. The static GitHub frontend has deliberately NOT been replaced. Do not switch it until authenticated integration tests and browser checks pass.

The GitHub Pages frontend lives at `/molindesign/maya-haglund/` and `/molindesign/maya-haglund/admin/`. The Netlify project `maya-haglund-admin` handles API requests, authentication and persistent storage. The former ChatGPT Site remains the active admin until cutover.

## Maintain

Run `npm ci`, `npm test`, `npx tsc --noEmit`, and `npm run build` here. Copy `dist/` into the repository's `maya-haglund/` directory to update GitHub Pages. Preserve root Molin Design and Singha Thai files. This source directory is prefixed with `_` in the repository so Jekyll does not publish it.

Deploy this source directory to Netlify project ID `7f39c838-5d0d-48f5-ba7a-aa9ad1f72fdd` using its existing project connection. `netlify.toml` builds the frontend and functions. Set `ADMIN_PASSWORD` and a random `SESSION_SECRET` as secret production function environment variables. Never commit their values. Rotating SESSION_SECRET invalidates every session.

Published content and the two public classes were migrated on 2026-09-25. Netlify Blobs stores drafts, publication and classes together with conditional writes to prevent silent overwrites. Uploaded JPEG, PNG and WebP images are served by the media API. Drafts are authenticated. Public content updates become visible on the next page load, without a GitHub deploy. Old unpublished drafts remain only on the old Site.

Sessions expire after eight hours. Login attempts are rate limited by IP. CORS permits only the GitHub owner origin and the Netlify site. Login credentials are validated only on the server. Access on GitHub Pages is shared across a single owner origin, so avoid running untrusted apps under the same GitHub Pages origin.

Tests cover signed-session validation, origin restrictions, fuzzy text search and recurrence across daylight saving changes. `tests/live-check.py` additionally validates authenticated save/readback, conflicts and private recurring drafts against the production API with a password supplied on hidden stdin. It removes the temporary drafts it creates.
