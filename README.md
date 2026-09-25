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

Website: https://wrexist.github.io/molindesign/maya-haglund/

Admin: https://wrexist.github.io/molindesign/maya-haglund/admin/

The Vite React frontend in `maya-haglund/` uses the Netlify API at https://maya-haglund-admin.netlify.app for authenticated administration, published content, recurring classes and image storage. Source and maintenance instructions are in `_maya-source/`. Existing Molin Design and Singha Thai pages are preserved.

The admin supports searchable content, PT and online packages, draft previews and publication. Changes are loaded on the next page visit without rebuilding GitHub Pages. The former ChatGPT Site is a separate copy; its unpublished drafts were not migrated. No credentials are committed.

The demo includes professional icons, reduced-motion-aware animations, an illustrative 3D fitness asset and a white transparent fitness logo, which also marks the contact card. A branded loading screen paints before the app bundle: the kettlebell, ball and band from the 3D asset drop in, a counter runs to 100 % while content loads, and the equipment then flies into its place in the hero. Booking links contact Maya or open the configured booking URL; payments are not processed here.
