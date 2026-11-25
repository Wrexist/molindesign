# GTA 6 has iguanas (Delta, "It has X, shown" + real Florida)

Slug `gta-iguana` · backlog row 73 · researched 2026-11-25 (day 6 after launch) by the video-researcher · channel **Delta** (YouTube Shorts @deltaisac, never Tech, explained). American English, US audience, Ming US_James seed 7, **no music**, no AI tag, own graphics plus official Rockstar media (SAFE-EDIT rules 3, 7 and 11). No Rockstar logo or key art (the Launch Trailer's logo starts ≈22.07 s: our cut ends at 22.03 s). Launch-week rules (delta/RUN.md): frame 0 ≤ 5 words with GTA 6 early, payoff on screen by 2.0 s, 20–30 s, end on a binary pinned-comment question. VIDEO-PLAN §3 format 5 ("It has X, shown").

## ⚠ Read first: the trailer iguana is already in a posted Delta film
`film/gta-everytrailer/clips.json` clip `iguana` = Launch Trailer **20.5–21.9 s** (the whole iguana shot except its first and last frames). gta-everytrailer is **live** (YouTube UQkQoiIdOBg, scheduled 2026-11-24 17:00 UTC). SAFE-EDIT rule 7 says never the same clip in two films, and `clipkit.py lint` FAILs any overlap > 0.25 s (`OVERLAP` in delta/clips/clipkit.py). So the shot the topic was picked for **cannot be cut as planned**. What this brief does about it:
1. **New hero (no conflict): Rockstar's own screenshot with Rockstar's own words.** The Only in Leonida page has a 3840×2160 screenshot whose alt text is *"An iguana walks in front of a mobility scooter in the Leonida Keys as people pass by in the background."* It is a still, not a trailer excerpt, no Delta film uses it, and it puts the claim in Rockstar's own words. It carries frame 0, the caption beat and the end vote.
2. ~~The trailer iguana, lint-clean edges only (`lt_head` 20.47–20.74, `lt_pass` 21.66–22.03)~~ **Dropped by the orchestrator on 2026-11-25** (rule 7: no shot in two films, tolerance or not). The screenshot carries beat 3.

No other iguana exists in the cached official video (checked 2026-11-25 on contact sheets, 1 fps unless noted): Trailer 1 (twitter-1731998653743517697, 0–90 s; plus 2 fps 29–40 s and 3 fps 18.5–21.5 s), Trailer 2 (twitter-1919733318217576448, 0–166 s), An Extended Look (generic-v4-rk721912…, all 41 sheets, 0–1608 s), Out Now spot and Extended Look teaser (lib-*, 2 fps). Wildlife seen and its status: Trailer 1 flamingos 20.8–21.7 (used by gta-everytrailer 19.2–21.65, so out), Trailer 1 airboat in swamp 19.13–20.7 (used, so out), Extended Look 455–470 deer and nature footage (**in-game TV**, so never usable, SAFE-EDIT Never), Extended Look 1566–1567.9 airboat fan close-up (free; src.mp4 not cached, so fetch first).

## 0. Packaging score (PERFORMANCE §7): 4/6
| Mark | | Why |
|---|---|---|
| Mine | 1 | Every player drives Leonida's roads; every Floridian knows the iguanas. |
| Myth or threat | 1 | "It's a cute background detail" breaks: in real Florida the animal is an invasive species the state collects by the thousand. |
| Frame-0 test | 1 | `GTA 6 HAS IGUANAS` (4 words) over Rockstar's screenshot, the iguana ringed: readable muted in under a second. |
| Takeaway | 0 | A fact to share, not an action. |
| Title | 1 | "GTA 6 Has Iguanas 🦎" (GTA 6 first, 4 words). Alt: "GTA 6 Has Iguanas. Florida Has 5,195". |
| Searched | 0 | "gta 6 iguana" had a launch-trailer moment in October, but it isn't a big search now. Honest 0. |
Lift: the real-Florida payoff is the share (a weather service forecasting falling lizards; over 5,000 turned in in two days).

## 1. Topic and one hard idea
**Rockstar put iguanas on GTA 6's roads, and the animal it picked is one real Florida treats as an invasion: its weather service once forecast falling iguanas, and last winter people turned in over 5,000 in two days.** One picture: Rockstar's iguana (screenshot) beside our REAL FLORIDA card, `5,195 · FEB 1–2, 2026 · FWC`.

**Bridge (gta-kalaga lesson: no unsourced Leonida = Florida link):** the film never says Leonida is Florida. The link is the animal: the in-game iguana shows the features FWC lists for the green iguana (row of spikes down neck and back, throat fan, dark rings on the tail), labeled OUR ID, and the voice says only "in real Florida, green iguanas are invasive." No GTA 6 pill, no game footage and no game plates on any REAL FLORIDA beat (11.3–24.0 s).

Main search phrase: **`GTA 6 iguana`** (spoken "GTA 6 has iguanas" from 0.12 s; on screen frame 0). Second: `GTA 6 launch trailer iguana`, `falling iguanas`. DM-able moment: NWS Miami's own tweet, "don't be surprised if you see Iguanas falling from the trees tonight", next to the 5,195 count.

## 2. Hook options
1. **"GTA 6 has iguanas."** **Chosen.** 4 words, the search phrase, and the proof is the same frame (Rockstar's screenshot, ringed) with Rockstar's caption landing by 1.9 s.
2. "GTA 6 has Florida's worst pest." Overclaims twice: Rockstar never says Florida, and "worst" is ours.
3. "Watch the iguana, not the car." A good sound-off test, but it needs the trailer shot as frame 0, which is the rule-7 problem above.

End: "Would you brake for one? Yes or no." (vote card `BRAKE? YES / NO`, neither highlighted), then the loop runs back into "GTA 6 has iguanas." Pinned question: **"Would you brake for an iguana in GTA 6? Yes or no?"**

## 3. Facts used (all read 2026-11-25)
| # | Fact | Line | Source |
|---|---|---|---|
| F1 | Rockstar screenshot `Leonida_Keys_02` (3840×2160) on the Only in Leonida page, Leonida Keys section, alt text exactly: **"An iguana walks in front of a mobility scooter in the Leonida Keys as people pass by in the background."** Picture: a green iguana bottom left on cracked asphalt, a woman on a blue mobility scooter, a man cycling with a dog, a "Wonder Whale" roadside attraction, a shuttle bus. Copy kept at /mnt/project-files/delta/sources/rockstar-shot-leonida-keys-02/ (provenance.json). | hook, caption, end | https://www.rockstargames.com/VI/only-in-leonida (page JSON read by curl); image https://www.rockstargames.com/VI/_next/static/media/Leonida_Keys_02.0~ptk-53gl0lq.jpg |
| F2 | **GTA VI Launch Trailer**, posted by @RockstarGames on X on **Oct 15, 2026** (clipkit OFFICIAL). Shot **20.467–≈22.05 s**: a low close-up of a green iguana on a road under an overpass (green road sign, palms, a red car behind); from ≈21.3 s it walks right to left across the lane, the ringed tail trailing; the red car comes toward the camera and fills the frame by ≈21.95 s; the GTA VI logo starts ≈22.07 s. Whether the car hits it is **not shown** and never claimed. | (not used: shot dropped, rule 7) | https://x.com/RockstarGames/status/2110717537964953810; src.mp4 in /mnt/project-files/delta/sources/twitter-2110704990339678208/ (30 fps frames 20.40–20.77 and 21.60–22.07 checked) |
| F3 | FWC green iguana profile: **"Green iguanas are not native to Florida and are considered an invasive species due to their impacts to native wildlife."** "Effective April 29, 2021 Green iguanas were added to Florida's Prohibited species list." First reported in Florida "in the 1960s in Hialeah, Coral Gables and Key Biscayne"; established in "Broward, Martin, Miami-Dade, Monroe and Palm Beach Counties" and "Collier and Lee". "iguanas are not cold hardy." | turn | https://myfwc.com/wildlifehabitats/profiles/reptiles/lizards/green-iguana/ |
| F3b | Same page, the ID features: "a row of spikes down the center of the neck, back, and upper portion of the tail, and have dark black rings on the tail"; males have "a throat fan (or dewlap)". Males "can grow to over five feet in length and weigh up to 17 pounds." | turn (OUR ID card) | same |
| F4 | NWS Miami on X, **Jan 21, 2020** (18:42 UTC): **"Jan 21 - This isn't something we usually forecast, but don't be surprised if you see Iguanas falling from the trees tonight as lows drop into the 30s and 40s. Brrrr! #flwx #miami"** | nws | https://x.com/NWSMiami/status/1219691736412246016 (text read via X's syndication endpoint; also quoted by NPR) |
| F4b | NWS Miami, **Jan 22, 2020**: "Verified the iguana warning and the wind chill advisory! … Miami had a low of 30 and Fort Lauderdale had a low of 29." Optional chip `MIAMI LOW: 30°F · NWS`. | nws (optional) | https://x.com/NWSMiami/status/1219975697390698496 |
| F5 | FWC news release, **Feb 4, 2026**, "Over 5,000 invasive green iguanas removed from Florida's ecosystems": **5,195** green iguanas removed under **Executive Order 26-03**; the EO let people "remove live, cold-stunned green iguanas from the wild without a permit and bring them to select FWC offices on **Feb. 1–2**, during a period of extended cold temperatures in South Florida." By site: Sunrise 3,882, Tequesta 1,075, Marathon 215, Fort Myers 23 (sum 5,195). | cold, count | https://myfwc.com/news/all-news/green-iguanas-removed/ |
| F6 | GTA VI released November 19, 2026. | (present tense) | https://www.rockstargames.com/VI |

**Derived / said carefully**
- "Rockstar's own caption: an iguana, in the Leonida Keys." Contiguous words from F1 ("An iguana", "in the Leonida Keys"); the strip on screen shows the whole alt text with "ALT TEXT · ROCKSTARGAMES.COM/VI".
- "green iguanas": the voice names the species only in the REAL FLORIDA line. On screen the link is an OUR ID card: the trailer/screenshot iguana's spikes, throat fan and ringed tail beside FWC's description (F3b). Rockstar itself only says "iguana".
- "Miami's weather service once forecast falling iguanas" = NWS Miami's own word "forecast" (F4). Chip `NWS MIAMI · JAN 21, 2020`.
- "Last winter, a cold snap stunned them" = FWC's "cold-stunned" and "extended cold temperatures in South Florida" in Feb 2026 (F5). Chip `FEB 1–2, 2026`.
- "over 5,000 in two days" = FWC's headline "Over 5,000" and the Feb. 1–2 window (F5); the card shows the exact 5,195. "turned in" = brought to FWC drop-off sites.
- **Never claimed:** that iguanas fall, freeze, get cold or get hit by cars in GTA 6; that Leonida is Florida; what GTA 6's iguanas do; that GTA 5 had none; that FWC's 5,195 were all killed (some went to permit holders).

**Not used / unverified:** the "below 40 °F / 50 °F" sluggishness thresholds (only in news copy, sources disagree); UF/IFAS 1966 first-record date (FWC says "1960s"); iguana counts statewide (no primary number found).

## 4. Script (9 lines, 66 words, ≈27.6 s; `scriptlint` OK)
| id | at | Line (`say` where respelled) | Tension |
|---|---|---|---|
| hook | 0.12 | GTA 6 has iguanas. ("G T A six…") | 4 |
| caption | 2.22 | Rockstar's own caption calls it an iguana, in the Leonida Keys. ("Lee-oh-nee-dah"; reworded from "caption: an iguana", which Whisper heard as "and iguana" three takes running) | 3 |
| street | 6.04 | Right in the street, in front of a mobility scooter. (replaces the trailer line; "in front of a mobility scooter" is Rockstar's alt text, the street is the asphalt with road reflectors in the screenshot) | 4 |
| dip | 9.1 | Just a cute background detail? | **2 (dip)** |
| turn | 11.3 | Except in real Florida, green iguanas are invasive. | 4 |
| nws | 14.6 | Miami's weather service once forecast falling iguanas. | 5 |
| cold | 17.5 | Last winter, a cold snap stunned them. | 4 |
| count | 20.4 | People turned in over 5,000 in two days. ("five thousand") | 5 |
| end | 24.0 | Would you brake for one? Yes or no. (loops into the hook) | 5 |

Arc: `4 3 4 2 4 5 4 5 5`. Turn words: "And" 5.5, "Except" 11.3, "Last winter" 17.5. Time jumps carded: `JAN 21, 2020`, `FEB 1–2, 2026`.

## 5. Footage and shot plan
**Orchestrator decision (2026-11-25): both Launch Trailer iguana cuts (`lt_head` 20.47–20.74, `lt_pass` 21.66–22.03) are DROPPED.** They are the two ends of a shot the published gta-everytrailer already uses, and SAFE-EDIT rule 7 means no shot in two films, tolerance or not. The iguana hero is Rockstar's screenshot alone; script line 3 no longer mentions the trailer.

Sources: `shot` = the F1 screenshot, registered with clipkit as `lib-rockstar-shot-leonida-keys-02` (a 1 s still MP4 made from Leonida_Keys_02.jpg, `--origin https://www.rockstargames.com/VI/only-in-leonida`, verdict OFFICIAL; cut at full 3840 px so the crops stay sharp), `lt` = twitter-2110704990339678208 (Launch Trailer, crop `1920:960:0:60`), `t1` = twitter-1731998653743517697 (Trailer 1). The screenshot is now counted by `clipkit.py lint` like any clip.

**Foreground (evidence, each use < 5 s, annotated)** — the screenshot as a paper photo print:
| Use | Film time | Shows | Beat |
|---|---|---|---|
| s1 | 0 → ≈2.54 s | Pushed in on the iguana (≈ 800 px), pulling back; red ring from 0.2 s; `ROCKSTAR SCREENSHOT` stamp at 1.75 s; then the print flips | hook |
| (back of the print, ours) | ≈2.54 → ≈5.8 s | Rockstar's alt text, verbatim excerpt “An iguana walks in front of a mobility scooter in the Leonida Keys…”, `ALT TEXT · ROCKSTARGAMES.COM/VI`, highlights on "an iguana" / "in the Leonida Keys" | caption |
| s2 | ≈5.8 → ≈9.3 s | Close on the iguana, `IN THE STREET` tag on the asphalt, then out to the woman on the blue mobility scooter (yellow ring), iguana ringed; the same alt excerpt rides above as a strip, "in front of a mobility scooter" highlighted | street |
| s3 | ≈24.2 → 27.2 s | The print returns and pushes back to frame 0's crop; `BRAKE?` + `YES` / `NO` (neither highlighted) | end |

**Plates (rule 11; muted, dimmed ≥ 35 %, under our cards, GTA beats only, never under REAL FLORIDA)** — all checked free against every film/*/clips.json on 2026-11-25:
| Key | Source range (s) | Shows | Beat |
|---|---|---|---|
| p_marina (cut as `pmarina`) | lt 9.30–11.15 | boat in a hazy marina, Keys light | dip, first half |
| p_beach (cut as `pbeach`) | t1 21.80–23.20 | packed beach, umbrellas, skyline | dip, second half |
| spare | t2 38.40–41.40 | Muscle-beach style outdoor gym, palms | if the director needs one more GTA plate |
| spare | t1 32.60–34.05 | neon street at dusk, parked cars | — |
| spare | lt 38.35–39.70 | plane low over a road | — |

**Our own graphics (11.3–24.0 s all ours, no game picture):** REAL FLORIDA header card (cream on ink, coral accent), FWC chip `NOT NATIVE · INVASIVE · FWC`; OUR ID card (three hairline leaders to spikes / throat fan / ringed tail on our flat redraw of the iguana, beside FWC's quoted description); the NWS tweet re-created as a weather-forecast tile (tag `RE-CREATED`), the quote verbatim, `NWS MIAMI · JAN 21, 2020`; a drawn palm with a flat cut-paper iguana that tips off a branch **only inside the REAL FLORIDA frame**; a thermometer chip `MIAMI LOW: 30°F` (F4b, optional); the hero number `5,195` landing on "five thousand" with `FEB 1–2, 2026 · FWC` and four small drop-off pins (Sunrise 3,882 · Tequesta 1,075 · Marathon 215 · Fort Myers 23).

**Shares (clipkit lint on the final 27.2 s cut, after jury round 1):** Rockstar foreground (the screenshot) **45 %**, background plates 9 %, all real Rockstar picture on screen **52 %** (caps 50 % / 85 %). The real-Florida half (≈11.2–24.2 s) is ours except one small labelled crop of Rockstar's iguana (IN GAME, 11.7–14.8 s) beside our FWC field-guide marks, as a comparison; nothing of Rockstar's sits under the forecast, cold or count beats, so nothing implies the game does them (RUN.md "Default format").

## 6. Open questions for the director / orchestrator
1. ~~Rule 7 call on `lt_head` / `lt_pass`~~ Decided 2026-11-25: dropped (see §5).
2. The screenshot is a still held about 9 s in total: give it a push, the ring, the crop-in for OUR ID, and a cut-away so no 3 s passes without a change (LESSONS: stillness cost Delta films).
3. Frame 0 alternative if the trailer edges are approved: freeze 20.60 s, but the screenshot is safer (Rockstar's own words, no reuse).
4. Keep the falling-iguana drawing clearly real-world (REAL FLORIDA header, NWS chip, no GTA 6 pill on that frame) so nobody reads it as a game feature.

## 7. Packaging (for video-seo)
Title "GTA 6 Has Iguanas 🦎". Pinned question "Would you brake for an iguana in GTA 6? Yes or no?". Hashtags e.g. #gta6 #gtavi #florida #iguana #gaming. Description sources: F1, F2, F3, F4, F5 URLs. Closing line: "Clips: Rockstar Games (GTA VI Launch Trailer; Only in Leonida screenshot), used for commentary. Not affiliated with Rockstar Games or Take-Two."

## 8. Log
- 2026-11-25 research (video-researcher): found the trailer iguana already used by gta-everytrailer (posted); added Rockstar's Leonida Keys screenshot as the hero; checked every cached official source for more iguanas (none); real-world facts from FWC (profile + Feb 4 2026 release) and NWS Miami's two Jan 2020 tweets. Script 66 words, scriptlint OK.
- 2026-11-25 director: orchestrator dropped both Launch Trailer iguana cuts (rule 7: the shot belongs to gta-everytrailer); hero is Rockstar's Leonida_Keys_02 screenshot as a photo print that flips to show its alt text. Script line 3 → "Right in the street, in front of a mobility scooter." Caption line reworded to "…caption calls it an iguana…" (Whisper heard "and iguana"). Lines re-timed for fit (caption 2.22, street 6.04, nws pause 0.7, cold 18.05, count 20.95, end 24.55, dur 27.2). NWS quote on screen is the excerpt “IGUANAS FALLING FROM THE TREES” (readcheck); thermometer `LOW 30°F · MIAMI · NWS` (F4b). Count beat: drop-off bars build first, 5,195 slams on "five thousand". Lint: Rockstar 33 %, plates 9 %, real picture 41 %. voiceover.py SAME gained brake→break (homophone).
- 2026-11-25 director, jury round 1 (7.4, PASS) fixes: fall beat rebuilt (full-height palm right, forecast tile high-left at −3°, one 700 px iguana drops from above the frame in 0.35 s on "falling" with squash, a thud under the voice and a 1.04 punch, then three smaller ones 0.15 s apart); layouts broken up (ID diagonal with leaders in a right column, cold row on its backs along a frost line at y 1350, count 5,195 left at 260 px with 52 icons = 1 per 100 by drop-off site filling from the beat's first frame, plus a stacked ratio bar below the UI line); ground bands fill y 1440–1920 (shapes only); flip 0.1 s per side with a visible edge, CAPTION header full before the turn; label now "OUR ID · MARKS FROM FWC" with an IN GAME crop of Rockstar's iguana (4th screenshot use, 45 %); dip iguana unclipped, mouth closed; end pill moved to the print's lower corner. Caption line re-rolled to take 3 (Leonida p 0.06 → 0.28, WER 0); count line re-rolled to take 1 (through the mix Whisper had heard "over 5,002 days"). Not applied: the "REAL FLORIDA: 5,195" teaser at 1.5 s, because on the game frame it reads as a GTA 6 number (kalaga lesson).
