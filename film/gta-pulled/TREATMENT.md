# Pulled · treatment (Delta, GTA San Andreas 2005 → GTA 6, pillar 7)

## Benchmarks
- **film/gta-money/** (held at 7.2 / Truth 8.5): same engine (voice-first `at(id, word)`, `vo/vad.js` SFX gate, paper pieces, desk lip at y 1440, rail scan, paper-tape captions). Its two juries are applied up front (list below).
- **film/qrcode/** (passed 8.0): one physical prop that changes state. Here the store shelf opens and closes the loop (empty slot + PULLED → full → emptied).

## Three structures
1. Courtroom/timeline 2005 → 2006. Rejected: a list of dates, and the brief keeps the settlements out.
2. One case that collects stickers all film. Rejected: too much text on one object, so more than 2 reads at once.
3. **One hero object per beat, each rising from behind the desk lip** (chosen): shelf → case + 2005 → locked box → close-up (AO over M) → store sign + emptied shelf → scissors + new case → NOV 19 page → vote.

## Rules from the gta-money juries, applied up front
- Key word at hero size by 1.5 s: PULLED (138 px) is on screen from frame 0 and knocks on "pulled". Frame 0 has 2 words: PULLED, GTA.
- No pill. Captions only where no prop carries the line (found first half, fixed). Hook, year, rating, pulled, six and end lines have no caption, so a caption can never be read against a tag.
- At most 2 reads at once; each old card sinks before the next rises (chip sinks as the sticker lands; NOV page sinks as YES/NO drop).
- No label moves while it is read: the AO sticker is only drawn for its last 0.22 s of fall; tags are excluded from the bounds check until they settle.
- Every read ≥ 44 px (smallest: chip 46 px, ADULTS ONLY ≈ 70 px). One hero stamp: AO over the M in the written pause after "Only." (poster).
- Plain letter tiles of our own (M, AO), not the ratings board's icon design; store names as plain text; the box never opens; never "banned"; the end does not answer.

## Line → picture
| Line | Picture | Sound (pauses only) |
|---|---|---|
| hook | shelf, plain cases, one empty slot over a GTA label, PULLED tag swinging through the loop point | — |
| year | plain case GTA: SAN ANDREAS; 2005 tile pops on "2005" | tick as the shelf sinks |
| found | kraft box HIDDEN SCENE / LOCKED ON THE DISC; key with FAN-MADE MOD tag slides in on "and a fan-made", turns on "unlocked"; shackle pops | tick, thock (pop) |
| rating | close-up of the case corner, M tile knocks on "M"; chip RATINGS BOARD (ESRB), JULY 20, 2005; AO · ADULTS ONLY sticker slaps over the M | tick, heavy stamp |
| pulled | sign WALMART / TARGET / BEST BUY drops over the AO close-up; a full shelf rises and every case drops away on "every copy" | tick, land |
| fixed | the locked box returns, scissors cut it away on "cut"; a new case rises, chip SCENE REMOVED, the M slaps back on "new" | — |
| six | page GTA 6 / NOV 19; the question card SHOULD A MOD CHANGE A RATING? rises under it | thock |
| end | page sinks, identical YES / NO tags drop (same knock on both); all sink, the shelf with PULLED rises back to frame 0 | tick, land |

## Log
- 2026-11-02 (director, first cut): line "end" split into "six" (GTA 6 is out November 19th.) and "end" (Should a mod change a game's rating?) with the same words, so the date page and the question each get their read time. Re-timed: rating 12.0, pulled 17.2, fixed 20.45, six 24.4, end 27.48 (speed 0.84, was rushed at 3.85 w/s), dur 29.8. smr_db 39. Chip shortened to SCENE REMOVED (the caption says "the new version") to fit its read time.
- Jury r1 (7.1 / Truth 8.0) fixes: question is now "Should hidden content change a game's rating?" (voice and card; ESRB re-rated over content on the final discs, not over the mod). Frame 0: PULLED hangs above the top row; a 275 px gap under a 100 px GTA label; the last GTA case slides out at 0.4–0.9 s. Hero: smr_db 33 so the AO slap is louder, plus a 1.06 punch-in and paper dust; the M tile reads M / MATURE 17+. Key tag reads “HOT COFFEE” MOD. Case at 1.6× (640 px, 59 % of the width), 2005 tile flips in; box at 1.2×; the question card rises under NOV 19 at about 25.5 s. Source and version notes are two-line cards in 58 px type (≈ 42 px cap height). The second fixed caption is dropped, so there are never more than 2 reads. end at 27.3, dur 30.0.
