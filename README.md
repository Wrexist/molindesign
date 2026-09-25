# Molin Design

Static website published by GitHub Pages from `main` at the repository root.

## Singha Thai demo

URL: https://wrexist.github.io/molindesign/singha-thai/

The standalone `singha-thai/` directory contains plain HTML, CSS, JavaScript and local assets. No build step, environment variables or backend are required. Relative asset paths support the GitHub Pages project prefix and later migration to a customer domain. Existing Molin Design pages are unchanged.

The design, full 11-category menu, illustrative image and favicon were migrated from the owner's existing Singha Thai preview on 2026-09-13. Hosting-injected scripts were removed. Google Fonts remains an external stylesheet dependency; system fonts provide a fallback. The image is illustrative, not a photo of the restaurant's food.

The preview includes `noindex, nofollow`, Molin Design attribution and a notice that menu, prices and hours need restaurant approval. It has no ordering or payment backend. Telephone and map links point to the restaurant. Do not treat ingredient tags as a complete allergen declaration.

Before customer launch: confirm all menu entries (including dish 37's price), opening hours, address, phone, image approval and domain availability with the restaurant. Register the approved domain before promising it, connect it, update sharing metadata and remove the demo notice/noindex only for the approved production site.

To update the preview, edit files under `singha-thai/`, review and push to `main`. GitHub Pages publishes automatically. Sales material is kept outside this public repository.

## Maya Haglund PT demo

URL: https://wrexist.github.io/molindesign/maya-haglund/

The standalone `maya-haglund/` directory contains plain HTML, CSS, JavaScript and local assets. No build step, environment variables or backend are required. Relative asset paths support the GitHub Pages project prefix. Existing Molin Design and Singha Thai pages are unchanged.

Exported on 2026-09-25 from the owner's Maya Haglund PT website, including package prices, contact links, professional SVG icons, motion effects and an illustrative 3D fitness asset. Google Fonts is an external stylesheet dependency with system fallbacks. Motion respects reduced-motion preferences.

This is a static demo with `noindex, nofollow`. The schedule in `classes.json` and package prices are snapshots; changes in the original admin do not automatically sync here. The Admin link opens the original authenticated website. No admin credentials, private records, database or authentication backend are included. Booking links contact Maya or use the event's booking URL; the demo does not process bookings or payments.

To update, edit files under `maya-haglund/`, review and push to `main`. GitHub Pages publishes automatically. Confirm current prices, classes, content and image approval before a customer launch.
