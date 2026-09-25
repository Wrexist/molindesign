# Maya Haglund website and admin

The GitHub Pages frontend lives at `/molindesign/maya-haglund/` and `/molindesign/maya-haglund/admin/`. The Netlify project `maya-haglund-admin` handles API requests, authentication and persistent storage. The former ChatGPT Site remains a separate copy.

Production integration checks passed: authentication, origin restrictions, draft save/readback, conflict protection, publication isolation and recurring private classes. Ten unit tests and TypeScript checks also pass.

## Loading screen

`index.html` contains the loading screen as static markup with inline CSS and a small inline script, so it paints before the app bundle arrives. `app/boot.ts` reports progress from `main.tsx`, shows load errors with a retry button inside the loader, and hands the equipment over to the hero: once content has rendered, the kit flies onto `.equipment-art` and dissolves into `fitness-sculpture.webp`. When that spot is off screen (phones, links with a `#section`) or reduced motion is preferred, the loader fades out instead. The admin skips the loader. Repeat visits in the same browser session play it faster.

`public/assets/loader/` holds the kettlebell, ball and band as separate layers cut from `fitness-sculpture.webp`, with the hidden parts rebuilt so each object can move on its own, plus two contact-shadow layers that belong to the kettlebell and the band. Their positions in `index.html` are percentages of the 1000×833 sculpture frame, so they recompose to the original image. If the sculpture changes, regenerate the layers as well. Web fonts load from `index.html` without blocking the first paint. The service cards reuse the same layers (`CardKit` in `app/website.tsx`): the kettlebell for PT, kettlebell and ball for PT Duo, and the full set for groups, each landing once when the card scrolls into view. The layers are keyed by service id (`pt`, `duo`, `group`), so a new service simply shows no equipment. The schedule shows the small bouncing ball while classes load.

## Maintain

Run `npm ci`, `npm test`, `npx tsc --noEmit`, and `npm run build` here. Copy `dist/` into the repository's `maya-haglund/` directory to update GitHub Pages. Preserve root Molin Design and Singha Thai files. This source directory is prefixed with `_` in the repository so Jekyll does not publish it.

Deploy this source directory to Netlify project ID `7f39c838-5d0d-48f5-ba7a-aa9ad1f72fdd` using its existing project connection. `netlify.toml` builds the frontend and functions. Set `MAYA_PASSWORD_HASH` and a random `SESSION_SECRET` as encrypted production environment variables. The password verifier format is `saltHex:scryptHex`, using Node scrypt with N=65536, r=8, p=1, output length 64 bytes, maxmem=134217728 and a random salt. Never commit their values. Rotating SESSION_SECRET invalidates every session.

Published content and the two public classes were migrated on 2026-09-25. Netlify Blobs stores drafts, publication and classes together with conditional writes to prevent silent overwrites. Uploaded JPEG, PNG and WebP images are served by the media API. Drafts are authenticated. Public content updates become visible on the next page load, without a GitHub deploy. Old unpublished drafts remain only on the old Site.

Sessions expire after eight hours. Login attempts are rate limited by IP. CORS permits only the GitHub owner origin and the Netlify site. Login credentials are validated only on the server. Access on GitHub Pages is shared across a single owner origin, so avoid running untrusted apps under the same GitHub Pages origin.

Tests cover signed-session validation, origin restrictions, fuzzy text search and recurrence across daylight saving changes. `tests/live-check.py` additionally validates authenticated save/readback, conflicts and private recurring drafts against the production API with a password supplied on hidden stdin. It removes the temporary drafts it creates.
