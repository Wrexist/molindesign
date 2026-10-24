---
name: site-verification-loop
description: Prove a static site works before it ships — run tools/check-site.mjs (GitHub Pages /molindesign/ prefix, desktop, phone and reduced-motion runs, JS errors, 404s, sideways scroll, tap targets, unnamed controls, reveals that never fire, metadata, secrets), then a fresh-context review by the site-reviewer agent, fix with evidence, and record what generalises. Use after building or changing any site in this repo and before every PR. Adapted from ECC's verification-loop, code-reviewer and continuous-learning (github.com/affaan-m/ECC, MIT), read in source Oct 2026.
---

# Site verification loop

ECC's loop is `plan → test → implement → review → verify → remember → improve`. The parts that transfer to a motion-site factory: **checks a script runs the same way every time**, **a reviewer that never saw the code being written**, and **evidence in the PR instead of "looks good"**. Marked **verified** = read in ECC's source; **inferred** = ours.

## 1. Machine checks (inferred; modelled on ECC's six-phase verification-loop, verified)
```bash
node tools/check-site.mjs <site-dir>              # full run, ~30–60 s
node tools/check-site.mjs <site-dir> --static     # no browser, instant
node tools/check-site.mjs <site-dir> --page specs.html --wait 4000
```
It serves the whole repo under `/molindesign/`, exactly like GitHub Pages, so a root-absolute path (`/img/a.jpg`) 404s here just as it would live. Then:

| Area | FAIL when | WARN when |
|---|---|---|
| Paths | a local URL starts with `/` | |
| Secrets | something looks like a key or private key | |
| Motion | the site animates and nothing mentions `prefers-reduced-motion` | |
| Meta | no `lang`, viewport or `<title>` | no description or `og:image` |
| desktop / phone / reduced | JS errors from the page itself, local 404s, sideways scroll, (reduced only) text inside a reveal still invisible after scrolling to it | external requests failed, controls with no accessible name, phone tap targets under 24 px, text inside a reveal still invisible, not exactly one `<h1>` |

Each run waits for a loader to lift (anything with loader/preload/splash in its id or class covering the centre), scrolls end to end like a visitor, then audits. Screenshots of top and end for each run land in `/tmp/site-check/<site>/` (or `--out`): **look at them**, especially `phone-top.png` and `reduced-end.png`. Exit code 1 on any FAIL.

What it can't see (inferred): taste, copy, whether the hard idea lands, jank, a line stuck behind a `translateY` mask (opacity stays 1), audio. That's what the review is for.

## 2. Fresh-context review (verified: ECC "every change is reviewed by a context that hasn't seen how it was written")
Run the `site-reviewer` agent (`.claude/agents/site-reviewer.md`) on the diff. Give it the site dir, the brief and the check output, not your reasoning: a reviewer handed your conclusion tends to confirm it. It reads the code cold against `ui-motion-principles`, `premium-micro-details`, the brief and the per-site `CLAUDE.md`, and reports only findings it can pin to a line with a concrete failure (ECC's pre-report gate, verified).

## 3. Fix with evidence
- Fix every FAIL. Fix a WARN or write one line in the PR saying why it stays (e.g. "inline footer link, exempt from target size").
- Re-run the check; paste the final table into the PR description. A result is the trail: brief, check output, review findings, final check (verified, ECC README).

## 4. Remember and improve (verified idea: ECC distils sessions into instincts and skills; inferred mechanics)
- Site-specific decisions → the site's `BRIEF.md` decisions log or its `CLAUDE.md`.
- A lesson that applies to every site (a pattern, a pitfall, a number) → the relevant skill's SKILL.md, under its Pitfalls, labelled verified or inferred. A new check that a script can do → `tools/check-site.mjs`.
- A durable fact about the person, a client or the project → team memory.
- Then `node tools/check-skills.mjs` so the library, CLAUDE.md and showcase stay in step.

## Report format
```
SITE CHECK  <site>/index.html   (served at /molindesign/<site>/)
FAIL  phone    page scrolls sideways by 38px; widest: div.marquee → 428px
WARN  phone    2 tap target(s) under 24px: a.f-skip.label 130×12 …
PASS  desktop  loads, scrolls end to end, no errors
Overall: NOT READY  (1 fail, 1 warn)
```

## Pitfalls
- Running the check before the loader finished: it waits up to 15 s; for longer intros pass `--wait`.
- Treating "READY" as done. It means the floor is clean, not that the site is good.
- Asking the agent that wrote the code to review it in the same context. Use the agent.
- Adding WARN-level noise to the script. A check earns its place by catching a real bug in one of our sites first.
