# GTA 6: last to second (Delta, "Extended Look deep dive" Short)

Slug `gta-afterdark` · researched and directed 2026-11-25 (day 6 after launch) · channel **Delta** (YouTube Shorts @deltaisac). American English, Ming US_James seed 7, **no music**, own graphics plus official Rockstar footage (SAFE-EDIT rules 3, 7 and 11). No Rockstar logo or key art. No "AI" anywhere. Launch-week rules (delta/RUN.md): frame-0 hook in 5 words or fewer, payoff on screen by 2.0 s, 20–30 s.

## Why this topic (the run's choice)
- **Format:** VIDEO-PLAN §3 format 7, "Extended Look deep dive": one thing from Rockstar's 26-minute official video, official footage only. The thing: the race shot at 20:21 inside the **run of night shots at 20:14–20:34** that no Delta film has cut.
- **The angle (so it isn't footage-as-wallpaper):** the race shot in that montage carries a live race HUD. Read frame by frame, it goes **6 / 6 to 2 / 6** (last to second) while its own timer moves **00:04.79 to 00:08.26** (3.47 s), and **PROGRESS** goes from **5 %** to only **10 %**. That is a checkable number on Rockstar's own screen, and the hook. The rest of the montage is then counted the same way (shot 1/6 … 6/6), so every footage frame is the subject of the line over it.
- **Not used before:** no film/*/clips.json touches 1213.9–1231.4 of An Extended Look (checked 2026-11-25; nearest used ranges: gta-wildfinds 1208.0–1212.0, gta-texts 1381.5+). The montage's last two shots (1231.4–1234.75, a skyline with a MEGAMUNDO sign and a rainbow-lit tower) and everything from 1234.8 s on lead into a story scene and are **not used**.

## 0. Packaging score (PERFORMANCE §7): 4/6
| Mark | | Why |
|---|---|---|
| Mine | 1 | The game every viewer is playing this week; races and nightlife are what they'll try first. |
| Myth or threat | 0 | A surprise (four places in 3.47 s), not a broken belief. |
| Frame-0 test | 1 | Rockstar's own HUD, zoomed, reading `6 / 6` under `LAST → 2ND`: checkable in one second, and it flips to `2 / 6` at 1.78 s. |
| Takeaway | 0 | No action. |
| Title | 1 | "GTA 6: Last to 2nd in 3.47 Seconds 🏁" (GTA 6 first, ≤ 7 words, a number). |
| Searched | 1 | "gta 6 racing", "gta 6 street race", "gta 6 extended look", "gta 6 nightlife". |

What lifts it: the end question hands viewers a choice (race, pool or dance floor), which is the comment bait.

## 1. One hard idea
**In Rockstar's Extended Look, a race at sunset goes from last to second in under three and a half seconds of its own timer, and it sits in a run of night shots (tower, pool party, dance floor, balcony).** One picture (the poster): Rockstar's HUD zoomed ×5.4 at `2 / 6`, our leaderboard with YOU in slot 2, `3.47 S · 4 PLACES`, under `LAST → 2ND`.

Main search phrase: `GTA 6 race` / `GTA 6 Extended Look` (`GTA 6` spoken at 0.12 s, `GTA 6` chip on frame 0). DM-able moment: the HUD flipping 6 → 5 → 4 → 3 → 2 in the zoom, one beep per place.

## 2. Hook options
1. **"GTA 6. Last to second."** **Chosen.** Frame 0: `GTA 6` chip + `LAST → 2ND` (3 words) over the real race shot, with the real HUD zoomed below it reading `6 / 6` and ringed; at 1.75 s (on "second") the zoom cuts to the shot's last frames, where the HUD reads `2 / 6`, and our `2ND` sticker lands. Payoff on screen at 1.78 s.
2. "Six night scenes in 17 seconds." Dropped: the run of night shots goes on past 1231.4 s (jury r1), and a count of shots is a list, not a stake.
3. "GTA 6 has street races." Overclaims: Rockstar hasn't said whether this is a mode, a mission or an activity.

End line: "Race, pool or dance floor? Where's your first night out?" (three buttons, each lit on its word, none favoured). Pinned question: "Race, pool party or dance floor: where are you spending your first night in Vice City?"

## 3. Facts used (all checked 2026-11-25 on full-res frames, `ffmpeg -ss T -i src.mp4 -frames:v 1`)
| # | Fact | Line | Source |
|---|---|---|---|
| F1 | **"Grand Theft Auto VI: An Extended Look", August 27, 2026**: "Captured entirely from in-game footage on the PlayStation 5, this extended look at Grand Theft Auto VI showcases the biggest, most immersive evolution of the series yet." 26:48. | race (`"IN-GAME FOOTAGE"` · ROCKSTAR chip) | https://www.rockstargames.com/VI/an-extended-look (fetched with curl 2026-11-25, sentence present); file https://videos-rockstargames-com.akamaized.net/v4/rk721912/flv/en-us-1080p.mp4 (1608 s), clipkit key `generic-v4-rk721912-flv-en-us-1080p-mp4`, verdict OFFICIAL |
| F2 | **The montage, 1214.0–1231.35 s (20:14–20:31), six hard cuts, 17.35 s:** (1) 1214.0–1215.75 a tower lit purple at night, from below; (2) 1215.8–1217.75 a woman in sunglasses and a fur coat taking a selfie from a red car with its door open, a `HOTEL DIXON` sign behind; (3) 1217.8–1221.4 a pool party at night, people dancing by a glowing pool; (4) 1221.45–1225.6 a race at sunset (HUD, F3); (5) 1225.6–1228.95 a packed dance floor under purple lights; (6) 1229.0–1231.35 a woman holding a drink on a balcony above a lit dance floor, prompt bottom right (F5). At 1231.4 a skyline shot follows (MEGAMUNDO sign; not used). | six, tour | 5 fps contact sheet 1213–1235.5 s; full frames 1214.8, 1216.0, 1217.2, 1219.0, 1227.6, 1230.0 s |
| F3 | **Race HUD, bottom right, read frame by frame** (crops at 1221.44–1225.58 s): `PROGRESS 5%`, `6 / 6` in a checkered box with a pink edge bar, timer `00:04.79` on the first frame of the shot (1221.44). Position changes: `5 / 6` from ≈1221.95 (timer ≈00:05.2), `4 / 6` from 1223.08 (00:06.22), `3 / 6` from 1223.68 (00:06.74), `2 / 6` from 1225.42 (00:08.26). Last frame of the shot 1225.58: `2 / 6`, `PROGRESS 10%`, `00:08.40`. PROGRESS reads 6 % at 1222.0, 7 % at 1223.0, 8 % at 1223.62, 9 % at 1225.32, 10 % from 1225.45. | hook, timer, count, prog | full-res crops x 1620–1920, y 860–1060 at 1221.42, .44, .47, .50, 1221.98, 1222.02, 1223.02, 1223.08, 1223.62, 1223.68, 1225.32, .38, .42, .45, .48, .52, .55, .58; 10 fps crop sheet 1221.3–1225.6 |
| F4 | The race shot is at sunset/dusk (orange and purple sky, street lights on). | race | frames 1222.2–1225.4 |
| F5 | Balcony shot prompt, bottom right: **`DRINK (R1)`** over **`DROP (◯)`**; she holds a glass. | drink | crop x 1620–1920, y 880–1080 at 1230.05 s |
| F6 | GTA VI released November 19, 2026. | (present tense) | https://www.rockstargames.com/VI |

**Derived / said carefully:**
- **"Last to second":** `6 / 6` read as 6th of 6 (the box is the race-position box: checkered-flag pattern, x / total). "Last" = 6 of 6.
- **"Under three and a half seconds" / `3.47 S`:** 00:08.26 (first frame showing 2 / 6) − 00:04.79 (first frame of the shot, already 6 / 6) = 3.47 s on the HUD timer. Said as "under three and a half", printed as 3.47. It is **HUD timer** time; the shot itself runs 4.13 s of video (the timer runs a little slower than the video, so we never say "in four seconds of footage").
- **"Progress says just ten percent, so far":** the HUD's own label and number at the end of the shot. We never say what PROGRESS measures beyond that, and never say how the race ends.
- **"Part of a run of night scenes" (r2; replaces r1's "one of six shots in a seventeen-second montage"):** the race shot (1221.44–1225.6) sits in a run of hard-cut night shots from 1214.0 to 1234.75 s: tower, selfie, pool party, race, dance floor, balcony, the MEGAMUNDO skyline (1231.4) and a lit tower (1232.8); a story scene starts at 1234.8. The strip draws all eight to scale as `20:14 → 20:34`; we no longer count them or give the run a length as if it were Rockstar's structure. Megamundo itself is never named or called a club.
- **`4 PLACES`:** 6 / 6 → 2 / 6 on the HUD is four places gained. The leaderboard is our illustration of the HUD's position number (rows of other cars are generic, unnamed); the hook plays the race shot at ×3.3 so the four HUD flips fit by 1.53 s, labelled `×3.3 SPEED` on the HUD tag.
- **"Captured in-game, they say" / `“…CAPTURED ENTIRELY FROM IN-GAME FOOTAGE…”`:** Rockstar's sentence on the Extended Look page (F1), quoted with both ellipses on the source card, over the real race shot (plate), never over our drawings.
- **Not claimed:** that racing, pool parties or clubs are playable activities, modes or missions; who drives the car or who the women are (no character names); that any place is a club (the Megamundo shot is out); where any of it is on the map.

## 4. Script (r2: 13 lines, voiced 0.12–27.33 s, film 28.5 s; solo listen check 13/13 ok)
| id | at | Line (`say` where respelled) | Tension |
|---|---|---|---|
| hook | 0.12 | GTA 6. Last to 2nd. (say "GTA six. Last to second."; r2 dropped the spelled "G T A", which Whisper scored as a miss in the mix) | 4 |
| timer | 2.45 | Under 3.5 seconds. (say "Under three and a half seconds.") | 4 |
| race | 4.5 | A race at sunset, in Rockstar's Extended Look. Captured in-game, they say. | 2 (the dip: context) |
| c6 | 8.6 | Six of six. | 5 |
| c5 / c4 / c3 / c2 | 10.05 / 10.8 / 11.45 / 12.4 | Five. / Four. / Three. / Two. (a beep and a board swap in each pause) | 5 |
| prog | 13.0 | And progress says just ten percent, so far. | 4 |
| run | 15.65 | Part of a run of night scenes. ("Part of a run, of night scenes.") | 3 |
| tour | 18.05 | A purple tower. A pool party. A packed dance floor. | 4 |
| drink | 21.5 | And up on a balcony, the prompt says: drink. | 4 |
| end | 24.4 | Pool party, dance floor, or the race in last place? (loops into "Last to second.") | 5 |

r1 notes kept: "And progress says just ten percent, so far." was "…ten percent." until Whisper twice heard "10%. percent."; "so far" fixed it and is true (the shot ends at 10 %). r2: single-word count lines need their own takes (c3 take 1, c5 take 3 at speed 1.2) to stay inside 1.8–3.3 w/s.

## 5. Beat plan (see TREATMENT.md for the line → picture table)
r2 footage (all An Extended Look, muted, each use under 5 s): race 1221.45–1225.58 full frame (hook 0–2.46 s at ×3.3, the count 8.29–13.04 s, the loop seam 27.9–28.5 s), tower 1214.05–1215.7, pool 1218.0–1220.0, dance 1226.8–1228.6 (tour 17.9–21.05 s, hard cuts), balcony 1229.05–1231.3 (card + zoom over the same clip blurred full frame). Plates (dimmed under our graphics): the race shot again under the source card (4.24–8.29 s, dim .35), pselfie 1215.85–1217.7 (run beat), ppool 1220.1–1221.35, pdance 1225.65–1226.75 (end). Dropped from r1: pdrive2 and the selfie tile.

## 6. Open questions
1. `4 PLACES` is the HUD's position change (6 → 2); we never say how many cars the player physically overtook on camera.
2. Whether this race is a side activity or a story mission is unknown; the film never says.

## 7. Packaging (see seo.md)
Title "GTA 6: Last to 2nd in 3.47 Seconds 🏁"; closing line "Clips: Rockstar Games (Grand Theft Auto VI: An Extended Look), used for commentary. Not affiliated with Rockstar Games or Take-Two."

## 8. Log
- 2026-11-25 (research + direction, one agent): read every HUD value on full-res crops (F3). The montage window was handed over as 1214–1231; cut points measured at 1214.0 / 1215.8 / 1217.8 / 1221.45 / 1225.6 / 1229.0 / 1231.4. The "woman dancing on a boat/terrace" in the hand-over is a woman taking a selfie from a red car (F2). The balcony prompt is DRINK / DROP (F5). 1200–1206.5 (people by a car on a dock) is a story scene and is not used as a plate.
- Build (`WORKERS=2 factory/make.sh gta-afterdark`, voice under the Ming flock): film 26.95 s (MP4 27.0 s, 809 frames). Clip lint ok: Rockstar foreground 48 % (WARN, under the 50 % cap), plates 30 %, all real footage 75 %, every use < 5 s and annotated, no unbroken run > 5 s, no range shared with another film. Readcheck all ok (first pass failed 10%, 3.47 S, the two timer rows and the quote; fixed by moving the sweeps at 4.5 / 7.15 / 13.32 s and splitting the rows). Boundscheck: nothing out of bounds. In-mix listen check 9/9, WER 0. Master −14.0 LUFS, true peak −2.6 dBTP; voice-only −15.0 LUFS. Pacecheck OK (motion 0–1 s 0.374, 0–3 s 1.075, 0.2 % still, no frozen stretch). No black stretches. Loop seam: first vs last encoded frame mean difference 1.13. Frames 0.0 / 1.0 / 2.0 s checked: `LAST → 2ND` + real HUD `6 / 6` from frame 0, `2 / 6` + `2ND` at 2.0 s. Poster = 2.0 s.
- 2026-11-25 r2 (jury r1 HOLD 6.5 / Truth 8.0, fixes 1–9 applied): (1) the drawn sunset slab is gone: the real race shot runs full frame as a dimmed plate under a source card quoting `“…CAPTURED ENTIRELY FROM IN-GAME FOOTAGE…”` (62 px, both ellipses) under `AN EXTENDED LOOK · ROCKSTAR GAMES`; the voice adds "Captured in-game, they say." (2) "six shots / seventeen seconds" is gone from voice, picture and description: the strip now draws all eight night shots 20:14–20:34 to scale, uncounted; description says "the shot opens at 6 of 6…" and "a run of night shots". (3) Hook: race full frame, frame 0 = `GTA 6` + `LAST → ?` + the real HUD `6 / 6` (PROGRESS, timer, zoom tag, credit and board hidden until 0.35–0.6 s); the shot plays ×3.3 (labelled) so the HUD flips 6→2 by 1.53 s while our leaderboard swaps on each flip; one stamp `3.47 S · 4 PLACES` on "2nd". (4) Count re-voiced as five lines with pauses; a beep in each pause, the board swaps and the HUD flips on the beep. (5) No N / 6 boxes outside the race: shots carry white timecode chips. (6) No grid. (7) Footage full frame or over the same clip blurred (balcony), plates under the race, run and end beats. (8) Last line "Pool party, dance floor, or the race in last place?" loops into "Last to 2nd." (9) `duck.smr_db` 23 → 15, a 1–3 kHz layer on every hit, sweeps and beeps raised; quiet-gap beeps get more gain, the hits right before speech were trimmed after Whisper heard them as words.
- r2 build: film 28.5 s (855 frames). Clip lint ok: Rockstar foreground 49 % (WARN, under 50 %), plates 36 %, real footage on screen 84 % (cap 85 %); every use < 5 s, no unbroken run > 5 s. Readcheck all ok; boundscheck nothing out of bounds; in-mix listen check 13/13 ok. Master −14.1 LUFS, true peak −2.6 dBTP. Pacecheck OK (motion 0–1 s 4.68, 0–3 s 2.97, 1.6 % still). No black stretches. Loop seam mean difference 1.46. Frames 0 / 1.0 / 1.6 / 2.0 s checked: frame 0 reads `GTA 6`, `LAST → ?`, `6 / 6`; `2ND`, HUD `2 / 6` and the stamp are up by 1.6 s. Whisper is not deterministic on numbers: the hook is written "Last to 2nd." and the timer line "Under 3.5 seconds." (spoken as words via `say`) so both spellings pass.
