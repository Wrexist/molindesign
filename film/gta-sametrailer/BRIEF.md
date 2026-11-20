# Same trailer, 12 years apart (Delta, VIDEO-PLAN A1)

Slug `gta-sametrailer` · backlog row 52 · made 2026-11-20 (day 2 after launch) as the test video for `delta/VIDEO-PLAN.md` · channel **Delta** (never Tech, explained). American English, Ming US_James seed 7, no music, trailer mode (SAFE-EDIT rule 7).

## Why this one first
The plan's research (VIDEO-PLAN.md §1) found **GTA 5 vs GTA 6 comparison** is the strongest Short format this week (5.1M, 469k "Trailer vs Gameplay", 42k), and GTA 5 nostalgia travels (1.9M). It's the best format we can make **today without Isac's own captures**. Rockstar hosts its old GTA V trailers on its own site (rockstargames.com/videos), so both sides are official footage.

## One hard idea
GTA 6's first trailer hits the same six beats as GTA 5's first trailer: sunset → beach → ROCKSTAR GAMES PRESENTS over the skyline → a vehicle across the water (this order holds in both), then the cops and a giant city sign (VINEWOOD; VICE). Six matches, 12 years apart.

Frame 0 (r3): `SAME TRAILER?` plus the years `2011` / `2023` only (4 tokens), over both sunsets already playing and sliding in from opposite sides; GTA 5 / GTA 6 chips and the rest of the chrome land on "Twelve" (1.0 s). Spoken hook (5 words): "Same trailer? Twelve years apart." The comparison itself is the payoff and is on screen from frame 0.

## Packaging score: 5/6
| Mark | | Why |
|---|---|---|
| Mine | 1 | Everyone watching GTA 6 content saw both trailers. |
| Myth or threat | 0 | Not a myth. |
| Frame-0 test | 1 | Two stacked sunsets with years, readable muted in under a second. |
| Takeaway | 1 | A vote: which trailer wins. |
| Title | 1 | "GTA 6's First Trailer Is GTA 5's, 12 Years Later 🤯" |
| Searched | 1 | "gta 5 vs gta 6", "gta 6 trailer", "gta 5 trailer". |

## Facts (all checked 2026-11-20)
| # | Fact | Where | Source |
|---|---|---|---|
| F1 | GTA V "Trailer", Rockstar Games, dated **November 2, 2011** | years, card | rockstargames.com/videos/s6c5c8co (GET_VIDEO_DATA: createdFormatted "November 2, 2011"); file videos-rockstargames-com.akamaized.net/v4/s6c5c8co/flv/en-us-720p.mp4 |
| F2 | GTA VI Trailer 1, posted by @RockstarGames on X on **Dec 4, 2023** (US time; 2023-12-05 UTC in the post metadata), released early after it leaked | years, card | x.com/RockstarGames/status/1732149328779571313 (clipkit provenance: upload_date 20231205 UTC) |
| F3 | Nov 2011 → Dec 2023 = **12 years** (and one month) | "Twelve years apart" | OUR MATH from F1, F2 |
| F4 | Trailer 1: **"over 93 million views in 24 hours"**, the record for a 24-hour non-music debut | "over 90 million views in a day", chip "YOUTUBE: 93 MILLION+ IN 24 H" | YouTube Official Blog, blog.youtube/culture-and-trends/grand-theft-auto-breaks-record/ (read 2026-11-20) |
| F5 | The six matches are what each trailer shows (see clips table): both open on a sunset after the rating card; both put "ROCKSTAR GAMES PRESENTS" over a city skyline; both show a beach crowd, a vehicle across the water (jet ski / speedboat), the cops, and a giant city sign (VINEWOOD / VICE) | pairs | the two trailers themselves (contact sheets in /mnt/project-files/delta/sources/) |

**Order (checked r1):** sunset → beach → ROCKSTAR GAMES PRESENTS → water is the true order in both (GTA V 6.4/9.1/12.0/18.8 s; GTA VI 2.7/11.6/14.6/23.3 s), so the voice says "Then" only there. Cops and the sign come in different orders (GTA VI shows VICE at 39.8 s before police), so those lines carry no "then".

**Not claimed:** that the cops/sign shots are in the same order, that Rockstar copied anything on purpose ("same formula, or coincidence?" is left as the viewer's question), any GTA V trailer view count.

## Clips (14 uses, 48% of 30.5 s; lint OK)
| Pair | GTA V Trailer (2011) | GTA VI Trailer 1 (2023) |
|---|---|---|
| SUNSET | 6.40–9.00 lifeguard tower | 2.68–4.95 causeway at sunset |
| SKYLINE | 12.00–15.60 palms + "ROCKSTAR GAMES PRESENTS" | 14.60–16.90 aerial skyline + "ROCKSTAR GAMES PRESENTS" |
| BEACH | 9.10–11.55 pier crowd | 11.60–14.30 aerial beach |
| WATER | 18.75–19.85 jet ski | 23.27–24.78 speedboat |
| COPS | 64.40–65.95 police chase | 48.62–49.84 police bodycam, POLICE vest visible (r1 jury: the aerial crash shot showed no police) |
| BIG SIGN | 69.47–70.60 VINEWOOD (ends on the cut before the plane shot) | 39.80–41.28 VICE |
Each use sits under a pair label and the 6-slot match counter; an own typographic card (#n LABEL, or VINEWOOD / VICE) sits between pairs, so footage never runs over 5 s.

## Log
- 2026-11-20: built. Voice r1; hook moved sun/pres/beach lines 0.3–0.45 s later to fit. Guinness's 90,421,491 page returned 404 today, so the chip uses YouTube's own 93M+ figure.
- 2026-11-20 jury r1: 6.2 / Truth 7.5, don't post (jury-r1.md). Applied all 10 fixes: frame 0 shows only SAME TRAILER? + the two year chips (all other chrome fades in at 1.0–1.3 s, hook 80 px inside the rail); pairs reordered to the true order with a new pres line ("Then Rockstar Games Presents over the skyline"); GTA VI cops shot replaced with the bodycam shot; MATCH! now stamps the pair that is playing and 6/6 lands on "Vice" with a 1.1× punch-in and the loudest slam (poster at 6/6); typographic #n cards replace the clip-art icons; cards 510 px tall, ticks and captions above y 1450; 12 YEARS APART lands at the cut with ghost years behind; tag hidden until 90 lands; last 0.6 s returns to the frame-0 sunsets + hook (loop seam, whoosh); duck.smr_db 32 → 24; runtime 30.5 s.
- 2026-11-20 render r2: clip lint ok (48 %), -13.9 LUFS, motion 0–3 s 0.433, readcheck 0 FAIL. Listen check flags the hook (wer 0.29) only because Whisper writes "GTA VI's … GTA V's" for "GTA 6's … GTA 5's": the words are right.
- 2026-11-20 jury r2: 6.2 / Truth 8.5, don't post (jury-r2.md). Truth now passes; Hook 5 and Craft 5 hold it back. Gate is 2 rounds, so the film is **held** (not queued). The next step is a rebuild, not a patch: r2 fixes 1–5 (a fast six-pair replay montage in place of the 22–30 s play-button and vote tail, real motion from frame 0 with only 4 tokens, a hook of 6 words or fewer without "mirrors", every element inside x 90–930, end 0.4 s after "wins?"), then a fresh jury. pace.txt in out/ is from the 30.0 s render; final MP4: motion 0–3 s 0.256. script.json `about` and the seo title were corrected to the honest wording.
- 2026-11-20 **r3 rebuild** (Isac doesn't own GTA 6 yet, so no captures; the coordinator asked to keep fixing this one). Built from jury-r2.md fixes 1–10, not patched: hook "Same trailer? Twelve years apart." (5 words, no "mirrors"); "Then" openers varied; "Vinewood." and "Vice!" are separate lines with a beat between; cards slide in 170 px from opposite sides over 0–0.9 s and the loop seam flies them back to that offset (frame 0 = last frame); cards 800 px (x 110–910), 6/6 punch 1.03× + clip zoom, all chips top-left so the bodycam's BODY 3 stamp stays visible; GTA 6 cops clip starts .45 s in so the POLICE vest is on screen; between pairs the top card shows #n and the bottom the word (no duplicate text); the years beat and the play-button card are gone; the tail is a moving 93M counter ring over a drifting VICE ghost, then SAME FORMULA? / OR COINCIDENCE? with GTA 5 vs GTA 6 sliding in from opposite edges; runtime 30.5 → 21.8 s, ends .4 s after "wins?". Seo title is now the honest "GTA 5 vs GTA 6: The Same Trailer?". Bottom ~470 px stay clear on purpose: YouTube's title/channel overlay sits there.
- 2026-11-20 jury r3 (rebuild): 6.3 / Truth 8.5, don't post (jury-r3.md). Hook mechanics fixed (frame 0 4 tokens, motion 0–3 s 0.636, POLICE readable) but Craft 4: the two-window "dashboard" layout itself is the ceiling. **Parked.** Reopen only as a new layout: two full-width 1080×608 plates, 6/6 VINEWOOD/VICE held ≥ 1.2 s with no flash, a 0.25 s six-pair replay in place of the counter ring, phrase-only captions (jury-r3 fixes 1–5).
- 2026-11-20 **v4 full-width** (Isac asked to see test Shorts): two full-width 1080×608 plates (no window frames), chips 44 px, counter n/6 in the band (after the hook), no GTA 6 pill, no ticks, no flash; 6/6 VINEWOOD/VICE freezes .2 s after "Vice" and holds ~1 s; vote cards build under the transition; phrase captions; "Then the beach." (no "crowd"). 22.5 s, footage 49 %, −14.0 LUFS, motion 0–3 s 0.656. v3 kept as sametrailer-v3-windows.mp4 in the factory folder.
