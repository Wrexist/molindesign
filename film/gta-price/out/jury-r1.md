# Jury r1: gta-price (fresh and independent: I did not see it being made)

**Overall 7.4 · Truth 8.5 · Verdict: fix then post. Gate: PASS** (the Delta gate is 7.0+ with Truth 8.5+; this clears both, and it beats gta-ranked's 7.1, the previous Delta factory film). It does not reach 8.0, so the jury verdict is "fix then post", not "post". Fixes 1 and 2 are quick and should go in before upload.

I judged `out/gta-price-vo.mp4`: 39.2 s, 1080x1920, 30 fps, -14.0 LUFS integrated, true peak -2.3 dBTP, no black frames (blackdetect: 0). `pacecheck`: 0 hard cuts, motion 1.38 over 0-1 s and 1.12 over 0-3 s, no frozen stretches.

I looked at sheet.jpg, the poster, and frames I pulled myself:
- every whole second from 0 to 39, plus 0.5, 1.5, 2.5, 31.6, 31.9, 32.2, 34.8, 35.2, 37, 38.6 and 39.15 s;
- a crop of the disc every 0.4 s from 21.0 to 23.6 s.

I also measured:
- on-screen change at 10 fps (share of pixels changing per frame);
- the peak level every 100 ms, on the final mix and on `vo/voice-only.wav`.

Whisper isn't installed in this container, so for the words I used the director's in-mix pass (`mix.log`: 10/10 lines at WER 0) and `vo/heard.json`. I checked those word times against the voice track's energy. heard.json lists "40%." and then "percent." in `prices`, but the voice track carries one unbroken word from 17.05 to 17.9 s, so I don't hear a doubled "percent". The final in-mix text is clean.

## Fact re-check at the sources (2026-11-07, by me)
| Claim | Source re-fetched | Result |
|---|---|---|
| GTA 6 Standard US $79.99 | PS Store US EP1004-PPSA01547_00-GTAVISTANDARD001 (curl) | ✓ JSON-LD `"price":79.99,"priceCurrency":"USD"`; the page also shows $99.99 (Ultimate) |
| Same on Xbox | Xbox Store US 9P3H4968GRSM (curl) | ✓ `"listPrice":79.99,"msrp":79.99`, USD (also 99.99 and 20 for Ultimate and the upgrade) |
| GTA 5 US launch $59.99, Sept 17 2013 | Kotaku, May 23 2013 | ✓ "Come September 17 there'll be three ways… the $59.99 regular version, a $79.99 special edition, and the $149.99 collector's edition" |
| (second source) | 9to5Toys, May 23 2013 | ✓ "standard $59.99 version of GTA V" |
| CPI-U Sept 2013 = 234.149 | data.bls.gov CUUR0000SA0, 2013 row | ✓ 234.149 |
| CPI-U Sept 2026 = 336.940, latest | data.bls.gov CUUR0000SA0, 2026 row ("Data extracted on: November 7, 2026") | ✓ 336.940; Oct-Dec blank, so Sept is the latest month. (The BLS API had hit its daily key-less limit, and FRED reset the connection, so the data page is my one check.) |
| Ratio, +43.9 % | 336.940 / 234.149 | ✓ 1.43900 → +43.90 % ("over forty percent" is true) |
| $86.33, "over $85" | 59.99 × 1.43900 = 86.3255 | ✓ rounds to $86.33; "over $85" is true by $1.33 |
| GTA 5 costs more in real terms | needs ratio > 79.99/59.99 = 1.3334 | ✓ 1.4390; "over $85" fails only if CPI were under 331.77 |
| $20 on paper | 79.99 − 59.99 | ✓ $20.00 exactly |
| Nov 19 2026, PS5 + Xbox Series X\|S | BRIEF fact 3 (Rockstar, rockstargames.com/VI) | ✓ matches what earlier Delta juries re-checked; I did not re-fetch it |

**Scope is honest.** The voice says "US launch prices, standard edition", and the receipt says `US LAUNCH LIST PRICES · STANDARD EDITIONS · NO SALES, NO REGIONS`. `CHEAPER*` always appears with `IN TODAY'S $`, and `BLS CPI-U · SEPT 2013 → SEPT 2026` and `SEPT 2026 = LATEST BLS MONTH` scope the index. Ultimate ($99.99) is never in frame, so "cheaper" can't be read against it.

**The one Truth problem is in the picture, not the facts.** From 21.42 to 23.3 s the disc's rolling counter shows `TODAY` under in-between values: `$61.38 TODAY` (21.8), `$71.23 TODAY` (22.2), `$83.82 TODAY` (22.6) and `$86.32 TODAY` (23.0). Meanwhile the caption above reads `IS OVER $85 TODAY.` Sound off, that prints wrong "today" prices, including $86.32 instead of $86.33. This is the repeated LESSONS mistake from gta-vicecity r1 ("never show a tag on a [number] that is still moving"), so it costs a full point. The cause is `film.js` line 580: `TODAY` is drawn with `a: t >= T.rollA ? 1 : 0`, so it appears as soon as the roll starts.

## SAFE-EDIT jury checklist (any yes = don't post)
| Condition | Result |
|---|---|
| Footage we don't own over 5 s unannotated | No. All of it is our own paper graphics: no Rockstar footage, logo, key art or box art, and no console logos (platforms are text pills). |
| Rumor stated as fact | No. Every claim is a store price, a 2013 press price or BLS data. |
| Leak or ending shown | No |
| Trailer or radio music audible | No. `MUSIC = false` (film.js line 922): voice plus factory SFX only. |
| A number without a source in BRIEF.md | No. $79.99, $59.99, $80 (spoken rounding of $79.99), $20, +43.9 %, $86.33, $85, Sept 2013, Sept 2026 and Nov 19 2026 are all in BRIEF.md facts 1-6 or the derived list. The disc's in-between roll values aren't facts, but they are labelled as if they were (see above). |

**Result: passes.** SAFE-EDIT rule 6 is met: "GTA 6" is the first spoken words and on screen at frame 0. The title ("GTA 5 Cost More Than GTA 6 💸") contains "GTA 6".

## LESSONS checks I ran on the render
| Check | Result |
|---|---|
| Frame 0 ≤ 5 words, fully printed | ✓ `GTA 6`, `$79.99`, `TOO MUCH?` (5 tokens), printed from frame 0 |
| Frame 0 moves | ✓ the tag swings about 100 px; motion over 0-1 s is 1.38 |
| One hero number, on the poster | ✓ $86.33 / OVER $85 TODAY, with both tags and the tipped scale |
| No GTA 6 pill over a GTA 5-only beat | ✓ the tags carry their own names; the pump scene shows only GTA 5 |
| Negation and claim on one card | ✓ the caption phrases stay whole |
| End vote neutral | ✓ YES and NO are identical, and neither is highlighted |
| Tag only once a number lands | ✗ `TODAY` shows on the rolling disc for 1.9 s (repeated, gta-vicecity r1) |
| Hits ≥ 3 dB under the neighbouring words | ✗ several hits peak at or above the voice (see Voice; repeated, gta-vicecity r1 and the gta-ranked jury) |
| Rail x 90-930 / above y 1450 | ✓ on every frame I pulled. The lowest text, the receipt's last line at 29-31 s, sits at about y 1420. |
| A change every 1.2-2 s | ✗ **26.0-28.0 s** changes 0.9-1.8 % of pixels per frame, the stillest stretch in the film, and it falls on the payoff line `more`. Weaker holds at 9.0-11.0 (about 2 %) and 13.0-14.0 (1.8 %). |
| Next scene drawn under the wipe | ~ At 32.2 the calendar is still blank under the wipe; NOV / 19 / 2026 and the PS5 and XBOX chips print in about 0.4 s later. |
| End within 0.5 s of the last word | ~ "no?" ends at 38.24 and the film at 39.2. The 0.96 s tail isn't still (it is the swish back to frame 0, 15.6 % change), so I took no penalty. |

## Scores
| Criterion | Score | Why |
|---|---|---|
| Hook | 7.5 | "GTA 6 costs $80. Too much?" is 6 words, GTA 6 comes first, and it asks the viewer for an opinion they already hold. That is the strongest Delta packaging yet (5/6). The swinging tag gives a big, readable still. Against it: frame 0 shows a fact every buyer already knows ($79.99), so only the question carries the stop. It sits on the same stock synthwave sun with spotlights and confetti that gta-ranked's jury called an outrun template. The searched phrase `GTA 6 PRICE` from the brief is not on screen, though `GTA 6` + `$79.99` covers it. |
| Retention | 7.0 | Re-hooks land well: the scale rises at 8.6, tips at 11-13, the pump wipe comes at 14.4, +43.9 % at 18.9, the roll runs 21.4-23.3, the stamp lands at 24, the scale slams at 25, then CHEAPER* at 28.1, the calendar at 32 and the loop at 35. But 26.0-28.0 is a dead 2 s on the payoff line (scale settled, nothing new until CHEAPER* at 28.1), and 9.0-11.0 holds the `?` scale for 2 s with only confetti moving. The 4-8 s tag scene builds by small chip pops right at the 5 s drop-off. |
| Clarity | 7.5 | One idea a 14-year-old gets: the old price, pumped up by everything getting pricier, now outweighs the new one. The pump with milk, gas and burger stickers explains inflation without the word. But the pump and year card are labelled `CPI-U`, which is jargon, and nothing says "everyday prices" on screen. The scale's "heavier side costs more" logic is never set up, and on paper the GTA 6 side sinks (13 s) without a label saying why. The disc labelled `TODAY` while rolling muddies the payoff. |
| Truth | 8.5 | Every fact re-verified at the source, and the arithmetic holds with margin. The scope is the best-hedged in a Delta film (US, launch list, standard, latest BLS month, IN TODAY'S $). From 9.5, **-1 for a repeated LESSONS mistake**: a tag on a moving number prints `$71.23 TODAY` and `$86.32 TODAY` under "IS OVER $85 TODAY" (21.4-23.3). |
| Motion and design craft | 6.5 | The paper tags, brass scale, receipt, calendar and disc read as hand-made, and the rail holds. Against it: the synthwave sun, striped horizon, sweeping spotlights and confetti are in every frame and read as a generic "Vice" template. The top 20-25 % of almost every frame (y 0-400) is empty sky. The tags are only about 300 px wide from 4 s on, so the hero props never fill ≥ 700 px (LESSONS vision). Smaller craft flaws: the scale post rises through the controller doodle at 7.8-8.2; the `GTA 6 COMES OUT NOVEMBER 19TH.` caption ghosts over the end card at 34.9-35.3; the source chips render at about 30 px under the 29-31 s pull-back. The wipes are flat pink rectangles clipped to the rail. |
| Voice and sound | 6.5 | Clean Ming read. The hook is in the first words, and the written pauses after each number work. But the hits sit on top of the voice. The voice-span median peak is about -3 dBFS, while hits in the gaps peak at **+0.2 (8.3 s, scale rise)**, **+0.1 (10.4, `?` pop)**, **-0.4 (18.5, year ticks)** and **+0.2 (28.1, CHEAPER clank)**. The hero stamp at 23.6 is only -2.2, so it is no louder than the minor clanks. **-1 for a repeated LESSONS mistake** (gta-vicecity r1: hits ≥ 3 dB under the neighbouring words; gta-ranked jury: the minor hit was louder than the hero). "So" opens three lines (ask, hero, end). |
| Loop and ending | 8.0 | "So, is $80 too much? Yes or no?" echoes the hook, and the last frame is the same as frame 0 (the swinging GTA 6 tag with TOO MUCH?). The vote is neutral and invites comments. The 0.96 s tail is a moving swish, not dead air. |
| Shareability | 8.0 | "GTA 5 cost more than GTA 6" is argument fodder people will send and dispute in the comments. The poster (two tags, tipped scale, $86.33, CHEAPER* IN TODAY'S $) works as a still. The backup "in 2013 money GTA 6 is about $55" isn't used, which is right (one hero number). |

Mean: (7.5 + 7.0 + 7.5 + 8.5 + 6.5 + 6.5 + 8.0 + 8.0) / 8 = 59.5 / 8 = 7.4375, which rounds down to **7.4**. That is above gta-ranked (7.1) and gta-money (7.2), so it is better than the last film. Packaging is 5/6.

## Fixes, ranked by impact
1. **21.42-23.3: `TODAY` shows on a rolling number (Truth, repeated mistake).**
   - Change: in `film.js` line 580 set the alpha to `landed ? 1 : 0`, so `TODAY` pops only at `T.rollB` (about 23.3) with the $86.33 landing.
   - While rolling, draw the digits in neutral cream (as LESSONS gta-vicecity r1 says) and optionally show a small `2013 → 2026` under them instead.
   - Re-check frames 21.4-23.4 every 0.1 s. Nothing may read "$xx.xx TODAY" except $86.33.
2. **Hit levels: 8.3, 10.4, 18.0-18.6, 28.1 against the hero stamp at 23.6 (Voice, repeated mistake).**
   - Bring the scale-rise swish and clank (8.3), the `?` pop (10.4), the year ticks (18.0-18.6) and the CHEAPER clank (28.1) down to about -8 dBFS on the final mix, 5 dB under the voice.
   - Make the hero stamp plus thud at 23.6 the loudest hit, at about -5 dBFS, 2 dB under the voice.
   - Fill the 24.2-24.4 hole with the stamp's tail.
   - Per LESSONS gta-lucia r2: lower the loud hits' LEVEL first, then re-check `duck.smr_db` (28 now). Re-measure each hit against the neighbouring words on the final mix, not the score.
3. **26.0-28.0: dead 2 s on the payoff line `more` (Retention).**
   - Land `CHEAPER*` / `IN TODAY'S $` on "79.99" (26.61) instead of after the line (28.1).
   - Draw a pink `$86.33 > $79.99` comparison bar or arrow on "more" (25.03), from the disc to the GTA 6 tag, with one tick.
   - Let the scale bounce twice after the slam (25.5, 26.0).
   - Target: a visible change at least every 1.2 s across 24.8-28.6 (no second under 4 % changed pixels).
4. **Wow: make the pump actually inflate the GTA 5 price (18.9-23.4).**
   - Right now the pump and the disc are two props joined by a thin hose, and the disc grows from 140 to 320 px off to one side.
   - Pin the disc to the GTA 5 tag's string from the start and let each stroke (every 0.48 s) visibly puff it. Add a +2-3 % squash on every stroke and a hiss.
   - Have it grow to ≥ 420 px so it overlaps the GTA 5 tag and dwarfs it. That is the one image to send, and it puts a hero prop ≥ 700 px wide (tag plus disc) on screen.
   - Move the poster to that frame if it reads better than the scale.
5. **9.0-11.0 and 13.0-14.0: two 2 s holds on the scale.**
   - Ask (9.0-11.0): let the beam wobble level ±6° on "which" (8.81) and "really" (9.19), and slam the `?` on "more" (9.75) instead of having it already there.
   - Paper (13.0-14.0): on "$20" (13.09) drop a tiny `+$20` weight onto the GTA 6 pan, which explains why that side sinks. Keep the receipt.
6. **Clarity of the pump label (14.4-23.4).**
   - Swap `CPI-U` on the pump and year card for `PRICES` (≥ 52 px). Keep `BLS CPI-U · SEPT 2013 → SEPT 2026` as the source chip.
   - A 14-year-old should read "prices pump" without knowing the index's name.
7. **The backdrop, from 0 to 39.2 (Craft and Hook).**
   - The synthwave sun, stripes, spotlights and confetti are the same generic outrun stage the gta-ranked jury flagged. Add that to LESSONS as a rule for the next film.
   - For a fix round, kill the sweeping spotlights and the striped sun.
   - Put a paper shop counter or price-gun wall behind the tags (hand-made, on topic) and fill y 150-400 with it, so the top quarter isn't empty sky.
   - LESSONS says a fix round must not add beats; this changes the backdrop only, not the story. If it is too big for this round, take it to the next film.
8. **Small craft.**
   - 7.8-8.2: rise the scale post behind the controller doodle, or remove the doodle before 7.8.
   - 34.9-35.3: fade the `six` caption out by 34.9, before the end card shows.
   - 32.0-32.4: print `NOV 19 2026` and the platform chips on the calendar before the wipe uncovers it (LESSONS: build the next scene in full under the wipe).
   - Under the 29-31 s pull-back: scale the source chips so they render at ≥ 36 px on the frame.
9. **Before posting.**
   - Re-check the PS Store and Xbox Store $79.99 the day before upload (a pre-launch sale would make "costs $80" stale).
   - If it posts after BLS publishes October CPI (mid-November), re-pull it and update `SEPT 2026`, `$86.33` and `+43.9%`. "Over $85" holds unless CPI is under 331.77.

## Generic or AI-looking
- The synthwave sun with horizontal stripes, the sweeping spotlights and the confetti: the stock "Vice / outrun" thumbnail template, in every frame, for the second Delta film running.
- The flat pink rectangle wipes look like a preset transition, not torn paper.
- What reads as hand-made: the paper price tags with punched holes and strings, the brass scale with its dial, the torn receipt with ticks, and the tear-off calendar. Keep these; they're the best props Delta has had.
