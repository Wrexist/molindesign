# Jury round 1 · gta-moneymachine (Delta, YouTube long-form 16:9, 4:06)

Fresh-eyes jury, 2026-11-08. Judged against `.claude/agents/video-jury.md`, `delta/SAFE-EDIT.md` jury checklist and `film/LONGFORM.md` (long-form rules replace Short-length caps).

Looked at: sheet.jpg, frames at 0, 1, 2.5, 4.5, 9, 13, 28, 35.5, 39, 61, 64.5, 71, 95, 99, 122.6, 123.5, 126, 180, 184, 187.5, 192, 196.5, 200.5, 203.5, 213.5, 217.5, 220, 223.5, 229.5, 234, 238, 245.9 s (tiles in this folder: open.jpg, midA.jpg, midB.jpg, ch5.jpg, ch6.jpg); pace.txt (OK, 0 frozen, motion 0-3 s 0.97); mix.log (in-mix 0 FIX); ebur128 −14.1 LUFS, −2.0 dBTP, LRA 4.1; blackdetect none.

## Primary-source spot checks (sec.gov, fetched today)
| Claim | Source text | Verdict |
|---|---|---|
| $1B in 3 days, "fastest" | Sept 20 2013 8-K: "worldwide retail sales of more than $1 billion during its first three days … We believe this marks the fastest…" | OK (attributed as Take-Two's claim) |
| −$1.3B in FY2015 | FY2015 10-K: "decrease of approximately $1,315.3 million in sales from our Grand Theft Auto franchise, as the prior year's results included the release of GTA V…" | OK |
| "PS4 money booked later" | FY2015 10-K: deferred revenue from GTA V on PS4/Xbox One; GTA V updates made online a more-than-inconsequential deliverable, revenue "recognized ratably over … 24 months" | OK |
| FY2014 68.9%, $2,350.6M; FY2026 12.4%, $6,656.4M | FY2014 and FY2026 10-Ks | OK |
| $1.6B launch year / $10B+ | Our math re-run: sum FY14-FY26 = $10,651.5M, FY14 = $1,619.6M (15.2%) | OK, labeled OUR MATH on screen and in voice (c5b, c5h) |
| 230M units, Aug 2026 | Q1 FY27 10-Q: "has sold-in over 230 million units worldwide" | OK, dated |
| RCS 25.8% FY2017 → 78.1% FY2026 | FY2019 10-K table ($458.9M, 25.8%); FY2026 10-K ($5,196.6M, 78.1%) | Numbers OK, **framing misleads** (see fix 1): FY2026 mobile = 50.1% of net revenue; the jump is mostly Zynga mobile, not GTA Online |
| Shark Cards | Rockstar support article titles (BRIEF F16) | OK, name only |

SAFE-EDIT checklist: no foreign footage, no trailer/radio music, no rumor stated as fact, no leak/ending, every number in BRIEF.md. Passes the hard fails.

## Scores
| # | Dimension | Score | Why |
|---|---|---|---|
| 1 | Hook | 7.0 | Promise "still selling" by 3.5 s, search chip by 2.5 s, question by 8 s. But frame 0 is a motion-blurred case with an unreadable SEPT 2013 tag: as a still it says nothing. |
| 2 | Retention | 7.0 | Something changes every 2-4 s, six quests each closed with a payoff. Losses for strangers: chapter 2 stacks three accounting lines (fiscal year, 10-K quote, deferred revenue) at 0:53-1:13; the 13-row table (2:58-3:05) is a read wall; the right-edge tape is a dead 15 % of frame for ~3 min. |
| 3 | Clarity | 7.0 | The one idea lands at c5x. The pie chapter and "booked later" are hard for a 14-year-old; on-screen numbers lag the voice, so frame and ear disagree. |
| 4 | Truth | **8.0** | Every number checks at source and our math is labeled. But the RCS pie sits in the GTA Online chapter and the c3x quotable "GTA ONLINE WAS FREE. THE MONEY INSIDE IT WASN'T." is laid over the 78.1 % pie, reading as "GTA Online = 78 %"; the tape headed `GTA 5 LEDGER` prints company-wide `IN-GAME 78.1%` and franchise-wide `−$1.3B` (repeat of LESSONS "a label names the whole group", −1). Base 9 → 8.0. |
| 5 | Motion and design craft | 6.5 | Flat paper look is own and consistent, not template. Clipped `TAKE-TWO GOT BIGGE` under the tape and `GTA 5 GOT OLDER` covering `GTA 12.4%` at 3:40 (repeat of LESSONS "check every label's box", −1). |
| 6 | Voice and sound | 7.5 | Clean Ming read, 0 mishears in mix, −14.1 LUFS, clunks on cards, no music. Even pace for 4 min with no bed change between chapters (LONGFORM §5 deferred). |
| 7 | Loop and ending | 7.5 | Day-3 strip callback, key hand-off, next video said aloud, 11 s end card. |
| 8 | Shareability | 7.5 | The split-screen and "less than a sixth of the money" is a real screenshot. |

**Overall 7.3 · Truth 8.0 · FAIL (gate needs 7.0+ and Truth 8.5+). Verdict: don't post (fix then re-jury).**

## Fixes, by impact
1. **1:55-2:09 (c3g-c3x), Truth.** The 25.8 % → 78.1 % jump is mostly Take-Two's 2022 Zynga mobile games (mobile = 50.1 % of FY2026 revenue). Either cut c3h-c3i and the pie, or add a voice clause and a ≥ 40 px chip: "mostly from mobile games it bought in 2022" (cite FY2026 10-K mobile 50.1 %). Move the c3x tiles off the pie onto the FREE tag vs cash stack.
2. **Tape, whole film, Truth.** Rename `GTA 5 LEDGER` to `THE LEDGER` and scope each print: `FY2015 · GTA FRANCHISE −$1.3B`; drop `IN-GAME 78.1%` from the tape (or `ALL TAKE-TWO 78.1%`).
3. **Number sync.** Counters must show the number when it is said: 0:28 `DAY 1 $0` while "800 million"; 3:07.5 `$0.2B` while "1.6 billion"; 2:02.6 label `FY2017 · 25.8%` while "over three quarters". Land each counter ≥ 0.2 s before its word.
4. **3:38-3:41 (c6c), craft.** Move `TAKE-TWO GOT BIGGER` left so it ends before x 1500 (clear of the tape); put `GTA 5 GOT OLDER` below the bars so `GTA 12.4%` stays readable.
5. **0:00-0:30, hook.** Frame 0: case sharp at rest and `13 YEARS.` already printed; glide the calendar in instead of blurring the case.
6. **0:53-1:13, chapter 2.** Cut c2a (keep the ruler picture silently under c2b) and shorten c2f to "Some of it was booked later." Saves ~3 s from the slowest stretch.
7. **2:58-3:05, c5a-c5b.** Don't show the 13-row × 4-column table whole; show FY2014 and FY2026 rows only, the others as a fast scroll with the `= GTA $` column rolling.
8. **Wow.** Make the tape the native move it was meant to be: in chapter 5 the right-edge tape unspools across the frame into the yearly lines, then tears in two at c5c to become the split-screen (pink stub = launch year, long teal = years after).
