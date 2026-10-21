# {{NAME}}: working notes

Read `BRIEF.md` first. It holds the one hard idea, the chosen skills and the budgets. This file holds how the site is built and what not to break.

## Shape
- Static site in `{{SLUG}}/`, served by GitHub Pages at https://wrexist.github.io/molindesign/{{SLUG}}/. No build step.
- `index.html` markup and real text · `site.css` tokens → base → sections · `site.js` boot and section behaviour.
- Relative paths only (`site.css`, `img/hero.jpg`). A path starting with `/` breaks under the `/molindesign/` prefix.
- Tokens live in `:root` in `site.css`: one accent, easing `--ease-out` / `--ease-io` / `--ease-drawer`, sizes in rem (1rem = 10px on phones, 10px at 1440 wide).

## Rules for this site
- Only the skills listed in `BRIEF.md`. Adding one means adding a line there that says what it does here.
- Every animation has a `prefers-reduced-motion` path with the same information.
- Touch targets ≥ 44 px, visible focus, Esc closes anything that opens.
- Keep `noindex` and the preview footer until the client approves the production site and domain.

## Verify before every push
```
node tools/check-site.mjs {{SLUG}}
```
Then run the `site-reviewer` agent on the diff for a fresh read. Fix FAILs; fix WARNs or note why not in the PR. See `.claude/skills/site-verification-loop/SKILL.md`.

## Facts and content
Facts that need client approval are listed in `BRIEF.md`. Don't invent prices, hours, addresses or claims.

## Decisions
Append dated lines to the decisions log in `BRIEF.md` when the client or Isac decides something a later session would otherwise ask again.
