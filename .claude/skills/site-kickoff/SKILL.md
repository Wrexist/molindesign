---
name: site-kickoff
description: Start every new website here — turn one sentence into a written, approved plan before any code (the one hard idea, motion personality, story-ordered sections, the few skills that earn a place with a reason each, budgets, facts to confirm), then scaffold it with tools/new-site.sh from templates/site/. Use when someone asks for a new site, landing page, demo for a client or a redesign. Adapted from ECC (github.com/affaan-m/ECC, MIT) "plan before code" and "load only what you use this week", read in source Oct 2026.
---

# Site kickoff: plan before code

The factory's failure mode is not a lack of techniques, it is using too many of them. ECC's rule for its 286 skills applies to our 50: **if you can't say what a skill is for on this site, the site doesn't need it.** So the first deliverable of every site is a short plan the person approves, and the only code before approval is the starter page.

Marked **verified** = read in ECC's source (`/plan` command, planner agent, project-guidelines template, README); **inferred** = our adaptation.

## 1. One sentence in, one brief out
Ask for, or infer, one sentence: who it's for and the one action we want. Then write `<slug>/BRIEF.md` (the template is `templates/site/BRIEF.md`; `tools/new-site.sh` creates it). Fill every heading; write "unknown, ask X" rather than inventing.

- **The one hard idea** (from `immersive-site-playbook`): one sentence. It gets the budget; everything else is quiet. Examples: "the camera assembles as you scroll", "the menu is a hand-drawn map", "one-take product film". A restaurant can have the hard idea "the menu reads like a printed card", that's allowed and often right.
- **Motion personality** (inferred, from LottieFiles' motion-design-skill, see team memory `agent-motion-tooling`): calm/editorial, precise/instrument, playful/physical or cinematic/film. It sets durations and how much moves. Calm: reveals only, nothing loops. Cinematic: a loader and a scrubbed story are fair game.
- **Sections in story order**, one line each about what it *says*, then the skill that builds it.
- **Skills used, and why**: one line per skill naming its job here. Always `ui-motion-principles` (read before any animation) and `premium-micro-details` (final pass). Typical counts: a small business site 3 to 6, a launch page 6 to 10. More than 10 needs a reason in the brief.
- **Budgets**: JS KB, image weight, loader length (or none), WebGL yes/no with a tier-0 fallback. Budgets are what make "one hard idea" real.
- **Facts to confirm**: prices, hours, addresses, claims, image rights. Never invent these (see `singha-thai/`'s README notes for how strict this is).

## 2. Approval gate (verified in ECC's `/plan` command: "WAIT for user CONFIRM before touching any code")
Post the brief and ask for a yes or edits. Planning is cheap; a wrong hard idea costs the whole build. If the person is away and the brief is unambiguous, scaffold and build the starter (reversible) but stop before the hard idea's expensive work, and say so. Record the approval in the brief's status line and decisions log.

## 3. Scaffold
```bash
tools/new-site.sh <slug> "<Site name>" "<the one sentence>"
```
It copies `templates/site/` to `<slug>/` and fills name, sentence, slug and date. What you get:
- `index.html`: lang, viewport, title, description, `noindex` (preview), OG tags, skip link, one `<h1>`, masked headline lines, kicker sections, footer with the preview notice.
- `site.css`: tokens in `:root` (one accent, `--ease-out .23,1,.32,1`, `--ease-io`, `--ease-drawer`, UI ≤ 300 ms), viewport rem (10px phones, `100vw/144` from 768), 44 px nav targets, `.mask/.line` and `.rise` reveals that only hide when JS runs, a reduced-motion block.
- `site.js`: reduced/fine flags, staggered IntersectionObserver reveals, no dependencies.
- `BRIEF.md` and a per-site `CLAUDE.md` (ECC's project-guidelines idea, verified: architecture, file map, rules, how to verify, decisions).

Then build only what the brief lists, reading each listed skill's SKILL.md when you reach its section, not all up front (context is the budget the agent spends; ECC keeps rules always-on and skills on demand, verified).

## 4. When the build is done
Run `site-verification-loop`: `node tools/check-site.mjs <slug>`, then the `site-reviewer` agent for a fresh read, then fix, then record what you learned. Add the site to `README.md` when it ships.

## Pitfalls
- Picking skills because they exist. Start from the story, not from the library.
- A plan with no budgets: everything gets added "because there's room".
- Writing the brief after the build to justify it. If it changes mid-build, update it and log the decision.
- Removing `noindex` or the preview footer before the client approves the production site and domain.
