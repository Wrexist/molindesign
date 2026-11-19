# GTA 6 scored 99 on Metacritic (Delta, launch-week news Short)

Slug `gta-99` · researched and scripted 2026-11-19 (launch day) · channel **Delta** (YouTube Shorts @deltaisac, never Tech, explained). American English, US audience, Ming US_James (seed 7, engine/duck block copied from film/gta-lawsuit), own flat hand-built paper graphics, **no music**, no footage, no screenshots, **no Metacritic logo** (the word is typed in our own font), **no Zelda or Nintendo art**, no Rockstar logo, key art or footage, no "AI" anywhere. News Short under delta/RUN.md "Launch week": 20-30 s, the number as the hero, frame-0 hook rule.

**Truth-proofing (read first).**
- **Which 99.** Metacritic's GTA VI page (https://www.metacritic.com/game/grand-theft-auto-vi/) defaults to the **PlayStation 5** version. Its hero block reads "Metascore · Universal Acclaim · Based on 150 Critic Reviews · 99" and "100% Positive 150 Reviews". The page's "All Platforms" cards read **PlayStation 5: "Based on 156 Critic Reviews" 99** and **Xbox Series X: "Based on 14 Critic Reviews" 99**. The JSON-LD `aggregateRating` (name "Metascore") is `ratingValue 99, reviewCount 156`. So the 99 is the PS5 Metascore, and the Xbox Series X version is also 99. The two counts on one page (150 / 156) differ because the page caches them separately; the film therefore says **"about 150"** in the voice and **`150+ CRITICS`** on screen, with `PS5 · READ NOV 19 2026` under it. On screen elsewhere just `METACRITIC 99` (the game's headline score, true on both platforms).
- **"Ties the best Metacritic score ever"** = ties the highest Metascore on Metacritic's all-time game list (https://www.metacritic.com/browse/game/all/all/all-time/metascore/), where the only two 99s are GTA VI and Ocarina of Time and nothing is higher. The screen scopes it: `HIGHEST ON METACRITIC'S ALL-TIME LIST`. Never "best game ever", never "beat", never "#1 alone": the list prints GTA VI first, but both are 99, so the picture shows them **tied** (red bracket joining the two 99 rows (after the `TIED · TOP SCORE` stamp)). No claim about any other aggregator (OpenCritic is not used).
- **"One other game has 99"** is the present state of that list (rows 1-2 at 99, row 3 at 98). Not "in history" or "ever got": a game that once had 99 and dropped would not show; we did not check history.
- **22 vs 150.** Ocarina's page: Metascore 99 "based on 22 critic reviews" (JSON-LD reviewCount 22). It is a count of reviews, not a quality judgement; the voice never says "only" or "just" about Ocarina's critics.
- **Top seven** is the order Metacritic prints on the all-time list today (positions 1-7). GTA IV is 5th at 98, GTA V is 7th at 97. "Three GTAs in the top seven" is counted from that list. No "no other series" claim (Mario has two in the top 7, which is true but off-spine; left out).
- **No review quotes**, no "30 fps" or any criticism, no review outlet named in the film. No sales, no players, no rumors.
- **Dates.** Embargo lifted Nov 18 2026 (the earliest critic review on the page is dated "Nov 18, 2026"); launch Nov 19 2026 (rockstargames.com/VI and Metacritic "Released On: Nov 19, 2026"). The voice uses no date words ("today", "yesterday"); posting any day this week stays true, but **re-read both Metacritic numbers before posting**: a Metascore can move as reviews come in. If GTA VI drops to 98, hold the film.

## 0. Packaging score: 5/6
| Mark | | Why |
|---|---|---|
| Mine | 1 | GTA 6 is out this week; every GTA player wants to know how it scored. |
| Myth or threat | 1 | Breaks "GTA 6 is the new number one, alone": it ties a 1998 Zelda, and a far bigger jury (150+ critics vs 22) gave it the same 99. |
| Frame-0 test | 1 | `GTA 6 SCORED 99` on frame 0: the viewer asks "is that a record?" and gets `TIED · TOP SCORE` with the Ocarina card by 2.0 s. |
| Takeaway | 0 | A record, not an action. The vote ("Does GTA 6 deserve the 99?") is a comment prompt. |
| Title | 1 | "GTA 6 Got 99 on Metacritic. Only One Other Game Has That 🤯" (number and GTA 6 first; jury r1 fix, no "ever"). |
| Searched | 1 | "gta 6 metacritic", "gta 6 review score", "gta 6 99", "gta 6 reviews", "highest metacritic score". |

## 1. One hard idea
**GTA 6 scored 99 on Metacritic, which ties a 1998 Zelda for the highest score on the site's all-time list, and it did it with about seven times as many critics (150+ vs 22).** Then a kicker: three GTAs sit in Metacritic's all-time top seven.

Main search phrase: `GTA 6 Metacritic` ("GTA 6" spoken 0.2-1.0 s, "Metacritic" by ~3.5 s; frame 0 shows `GTA 6 SCORED 99` + `METACRITIC`). Second: `GTA 6 review score`, `GTA 6 99`.

DM-able moment: two jars of critic slips side by side, **22** for Ocarina and **150+** for GTA 6, both stamped 99.

## 2. Hook options
1. **"GTA 6 scored 99."** **Chosen.** 4 words, GTA 6 in the first second, the number is the news (RUN.md launch week: the number as the hero). Frame 0 asks "is that a record?" and the tie lands by 2.0 s.
2. "Only two games ever scored 99." Rejected: GTA 6 not in the first words; "ever" overclaims history (we read today's list only).
3. "GTA 6 tied a 1998 Zelda." Rejected as the spoken hook: gives the twist away before the number; kept as an alt title.

## 3. Facts used (all read 2026-11-19, 07:20 UTC, `curl -A "Mozilla/5.0"`; saved copies outside the repo)
| # | Fact (source words) | Line | Source |
|---|---|---|---|
| 1 | GTA VI Metascore **99**, "Universal Acclaim". Platform cards: PlayStation 5 "Based on 156 Critic Reviews" 99; Xbox Series X "Based on 14 Critic Reviews" 99. Hero block (PS5 default): "Based on 150 Critic Reviews", "100% Positive 150 Reviews". JSON-LD: `"name":"Metascore" … "ratingValue":99,"reviewCount":156`. "Released On: Nov 19, 2026". | hook, tie, gta | https://www.metacritic.com/game/grand-theft-auto-vi/ |
| 2 | The Legend of Zelda: Ocarina of Time (1998): Metascore **99**, "based on 22 critic reviews" (JSON-LD ratingValue 99, reviewCount 22), datePublished 1998-11-23, platform Nintendo 64. | alone, oot, crit | https://www.metacritic.com/game/the-legend-of-zelda-ocarina-of-time/ |
| 3 | Best Games of All Time (sorted by Metascore), positions 1-8: 1 Grand Theft Auto VI 99 · 2 The Legend of Zelda: Ocarina of Time (1998) 99, Nintendo 64 · 3 SoulCalibur 98 · 4 Super Mario Galaxy 2 98 · 5 Grand Theft Auto IV 98 · 6 Super Mario Galaxy 97 · 7 Grand Theft Auto V 97 · 8 The Legend of Zelda: Breath of the Wild 97. | tie, alone, list, gtas, three | https://www.metacritic.com/browse/game/all/all/all-time/metascore/ |
| 4 | Launch: "November 19, 2026". | description only | https://www.rockstargames.com/VI (curl 2026-11-19) |

**Derived:** "about seven times as many critics" = 156 / 22 = 7.1 (150 / 22 = 6.8). Description only ("about seven times"), never on screen. "Three GTAs in the top seven" = positions 1, 5, 7 of fact 3.

**Not used / could not verify.**
- The caller's saved copy `/tmp/claude-0/delta/mc-gta6.html` is **OpenCritic's home page**, not Metacritic (its title is "OpenCritic - Video Game Reviews from the Top Critics in Gaming"; it shows GTA VI "topCriticScore 99"). I re-fetched the real Metacritic page myself (fact 1). OpenCritic is not cited anywhere.
- Whether any game other than Ocarina ever held 99 on Metacritic in the past (we only read today's list).
- Review quotes, the 30 fps criticism, user score (not yet open: "Available after 4 ratings"), sales.

## 4. Script (10 lines, 66 words, 29.17 s as voiced)
| id | Line | Tension | Shot (one hero per beat; a new thing every 1-2 s) |
|---|---|---|---|
| hook | GTA 6 scored 99. (say "G T A six scored ninety-nine") | 4 | Frame 0: a huge gold paper medal hangs on a pink ribbon, already swinging; ribbon tag `GTA 6`, medal `SCORED` / `99`, under it a typed plate `METACRITIC` (5 words). |
| tie | That ties the best Metacritic score ever. | 4 | By 1.8 s (in the pause): the GTA medal swings left and shrinks; a second gold medal on a teal ribbon swings in right, tag `OCARINA OF TIME`, `99`; a red stamp `TIED · TOP SCORE` slams between them. On "Metacritic": plate `HIGHEST ON METACRITIC'S ALL-TIME LIST`. |
| alone | But it's not alone. One other game has 99. | 2 (low) | The GTA medal's "alone" moment: a podium top step slides in under both medals; it holds two; chip `ONLY 2 GAMES AT 99`. |
| oot | Zelda: Ocarina of Time, back in 1998. | 4 | Layout change: the Ocarina medal comes to the centre; a grey generic cartridge (no art) drops with a typed label `OCARINA OF TIME · N64`; dated card `1998` slams. |
| crit | Its 99 came from 22 critics. | 3 | A glass jar lands under the Ocarina medal; 22 cream critic slips drop in; tag `22 CRITICS` slams. |
| gta | GTA 6 got it from about 150. | 4 | Split frame: a second jar under the GTA 6 medal; slips pour in fast and heap over the rim; `150+` slams on the word over its `CRITICS` label, small `PS5 · READ NOV 19 2026`. Hold (DM frame). |
| list | And the all-time top seven? | 3 | Jars swept off; a tall cream board drops: `METACRITIC · ALL-TIME TOP 7`, seven score tickets with positions, names and scores, `TIED` bracket on rows 1-2. |
| gtas | GTA 4 at 98. GTA 5 at 97. | 4 | Rows 5 and 7 turn Delta pink on their words (row 1 is already pink). |
| three | Three GTA games in the top seven. (Whisper heard "Three GTAs" as "3GTA's") | 5 | The three pink tickets pop forward; stamp `3 GTAs IN THE TOP 7`. |
| end | Does GTA 6 deserve the 99? Yes or no? | 5 | The GTA 6 medal swings back to centre; `DESERVE IT?` with `YES` / `NO` equal chips; in the last 0.3 s the frame-0 layout returns for the loop. |

Arc: 4 4 2 4 3 4 3 4 5 5 (dips at "not alone", ends highest).
Time jumps on screen: `1998`, `READ NOV 19 2026`.
Turn words: "But" (4.9 s), "And" (~17 s).
scriptlint: OK (no FAIL, no WARN).

## 5. Look: a new set
**The trophy table.** A deep plum velvet backdrop bleeding the full frame with slow cut-paper sunburst rays behind the hero; gold paper medals with scalloped rims on satin ribbons (Delta pink for GTA, teal for Ocarina), glass jars of cream critic slips, a cream score board with tickets, an oxblood stamp. Native move: **the medal swing** (pendulum on its ribbon, damped, never bouncy) and the stamp slam as the hero sound. Not used before: no felt desk, folder, paper courtroom, ? tower, palms, case towers or calendar pads.

## 6. Open questions for the director
- If the take runs over 30 s, cut "back" from `oot` first, then the `list` pause.
- Ming and "Ocarina": if Whisper mishears, re-roll `take: 1` before re-wording.
- Planned hit pauses: hook stamp (0.55), 1998 card (0.6), 150+ slam (0.7), 3 GTAs stamp (0.7).

## Log
- 2026-11-19: researched, scripted and built (maker run). Topic correction: the caller's saved `mc-gta6.html` was OpenCritic, not Metacritic; re-fetched Metacritic directly (same 99; PS5 156 / hero 150; Xbox 14).
- 2026-11-19 build: voice laid out with `voiceover.py layout` (29.17 s, every line ok in the solo listen check). The `three` line was re-worded to "Three GTA games…" after Whisper merged "Three GTAs" into "3GTA's". The board's tie is a red bracket (a TIED stamp there covered "GRAND THEFT AUTO VI"). Frame 0 / end medal lowered 40 px so the end-question caption clears its tag.
- 2026-11-19 jury r1: PASS 7.4 / Truth 8.5 (JURY.md). All 8 fixes applied: SEO title scoped ("Only One Other Game Has That"); stamp `TIED · TOP SCORE`; slips never start above screen y 930, so they no longer cross the GTA 6 medal; GTA 6 medal stays left all film (Ocarina and its 22 jar glide right in the split); heroes 1.13x (medals .62 → .7), shelf raised to y 1250 with a velvet swag below; board raised, 12 px red bracket on the two 99 rows, `3 GTAs IN THE TOP 7` stamp under row 7, punch-in on rows 5 and 7; 150 slips fill the jar, heap over the rim and spill onto the shelf, `150+` slams on the word; burned-in captions hidden while a stamp, plate or the board is up.
