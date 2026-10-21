# Molin Design

Static website published by GitHub Pages from `main` at the repository root.

## Singha Thai demo

URL: https://wrexist.github.io/molindesign/singha-thai/

The standalone `singha-thai/` directory contains plain HTML, CSS, JavaScript and local assets. No build step, environment variables or backend are required. Relative asset paths support the GitHub Pages project prefix and later migration to a customer domain. Existing Molin Design pages are unchanged.

The design, full 11-category menu, illustrative image and favicon were migrated from the owner's existing Singha Thai preview on 2026-09-13. Hosting-injected scripts were removed. Google Fonts remains an external stylesheet dependency; system fonts provide a fallback. The image is illustrative, not a photo of the restaurant's food.

The preview includes `noindex, nofollow`, Molin Design attribution and a notice that menu, prices and hours need restaurant approval. It has no ordering or payment backend. Telephone and map links point to the restaurant. Do not treat ingredient tags as a complete allergen declaration.

Before customer launch: confirm all menu entries (including dish 37's price), opening hours, address, phone, image approval and domain availability with the restaurant. Register the approved domain before promising it, connect it, update sharing metadata and remove the demo notice/noindex only for the approved production site.

To update the preview, edit files under `singha-thai/`, review and push to `main`. GitHub Pages publishes automatically. Sales material is kept outside this public repository.

## Maya Haglund PT

Live website: https://mayahaglund.com (Netlify project `maya-haglund-admin`, built from `_maya-source/` on every push to `main`)

GitHub Pages copy: https://wrexist.github.io/molindesign/maya-haglund/ (kept `noindex`; the live build has a canonical link to mayahaglund.com instead)

Admin: https://wrexist.github.io/molindesign/maya-haglund/admin/

The Vite React frontend in `maya-haglund/` uses the Netlify API at https://maya-haglund-admin.netlify.app for authenticated administration, published content, recurring classes and image storage. Source and maintenance instructions are in `_maya-source/`. Existing Molin Design and Singha Thai pages are preserved.

The admin supports searchable content, PT and online packages, draft previews and publication. Changes are loaded on the next page visit without rebuilding GitHub Pages. The former ChatGPT Site is a separate copy; its unpublished drafts were not migrated. No credentials are committed.

The demo includes professional icons, reduced-motion-aware animations, an illustrative 3D fitness asset and a white transparent fitness logo, which also marks the contact card. A branded loading screen paints before the app bundle: the kettlebell, ball and band from the 3D asset drop in, a counter runs to 100 % while content loads, and the equipment then flies into its place in the hero. Booking links contact Maya or open the configured booking URL; payments are not processed here.

The page is kept deliberately short (October 2026, at Maya's request): hero with one sentence and one button, training cards without tags or extra links, the schedule only when classes are published, prices one category at a time behind sliding tabs, a two-line about section, three step titles and the contact card. Fields the page no longer shows are hidden in the admin but kept in the stored content. Motion is limited to masked headline reveals, a soft photo settle on the cards, the gliding price-tab pill and button press feedback; all of it is skipped with reduced motion.

## Motion Library

Website: https://wrexist.github.io/molindesign/skills-library/

A static showcase of every design skill in `.claude/skills/`: each technique has a live demo, the numbers worth reusing, a link to its `SKILL.md`, the source it was learned from, and a "Copy prompt" button that produces a ready-made instruction for Claude. Plain HTML, CSS and JavaScript in `skills-library/`; no build step or external libraries (Google Fonts only).

- `skills-library/skills-data.js` lists the techniques shown (id, category, title, summary, source). Add an entry there when a new skill gets a demo.
- `skills-library/demos/<skill-id>.js` holds one demo each, written against the contract in `skills-library/demos/README.md` (mount lazily, start/stop with visibility, reduced-motion fallback, no global side effects).
- `skills-library/core.js` runs the page: loader, index and filters, lazy demo mounting, progress rail, reticle cursor, sound toggle, About drawer and copy buttons.

The page is `noindex` like the other demos. The demos are dependency-free reimplementations for learning; they are not affiliated with the studios, brands or libraries credited as sources.

## Starting a new site

New sites start from `templates/site/` (plain HTML, CSS and JavaScript, no build): `tools/new-site.sh <slug> "Site name" "one sentence"` creates `<slug>/` with a starter page (tokens, text reveals, reduced motion, `noindex` preview), a `BRIEF.md` to fill in and approve before building, and a per-site `CLAUDE.md`. The template folder itself is published by GitHub Pages too; it is a placeholder page marked `noindex`.

Before pushing a site, run `node tools/check-site.mjs <slug>`. It serves the repository under `/molindesign/` like GitHub Pages and loads the page on desktop, on a phone and with reduced motion, then reports errors, missing files, sideways scrolling, small tap targets, unnamed controls, text that never appears and missing metadata. `--static` skips the browser. Playwright comes from `npm i` in `tools/` or a global install. `node tools/check-skills.mjs` checks that every skill in `.claude/skills/` is listed in `CLAUDE.md` and has a Motion Library entry and demo.
