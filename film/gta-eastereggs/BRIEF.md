# GTA 6 hid an actual egg (GTA 6, Delta, commentary mode)

Slug `gta-eastereggs` · researched 2026-11-20 in the thread "Make Delta videos from TikTok link" (Isac sent @blockay's "Top 5 Coolest GTA 6 Easter Eggs", https://vm.tiktok.com/ZN8mjqLBy/, "This is perfect content") · channel **Delta**. American English, Ming US_James seed 7, no AI tag, no music. GTA 6 launched **November 19, 2026**. Launch-week rules apply (delta/RUN.md): frame-0 hook in 5 words or fewer, payoff on screen by 2.0 s.

## 0. Packaging score: 5/6
| Mark | | Why |
|---|---|---|
| Mine | 1 | The game the viewer bought this week; all five spots are in their copy. |
| Myth or threat | 0 | Nothing broken or at stake. Curiosity only ("an actual egg"). Honest 0. |
| Frame-0 test | 1 | The egg itself is on screen by 1 s (the thrown egg in the air, from the egg clip), with `A REAL EASTER EGG?` (4 words). |
| Takeaway | 1 | Five places they can go check tonight (Jason's place, open sea, the HAD YOU car, Trinity Apartments, the tower). |
| Title | 1 | "GTA 6 Hid an Actual Easter Egg 🥚" (7 tokens, GTA 6 in words 1–2, verb "Hid"). |
| Searched | 1 | "GTA 6 easter eggs" is the phrase; @blockay's own description is a list of these searches. |

What would lift it: none needed; it is the format Isac asked for. Search phrase for the director and SEO: **GTA 6 Easter eggs** (spoken at about 2.4 s, line `five`; also on screen).

## 1. Topic and one hard idea
A GTA 6 Easter-egg countdown that ends on a **literal** Easter egg, and loops: Atari named hidden secrets "Easter eggs" in 1980, and "forty-six years later…" GTA 6 hid an actual egg. It is ours, not a re-read of his video: our own order (his #3 is our #5, his #5 is our #2, his #4 is our #3), one real-world fact per item where one exists (2013's GTA 5, 2001's The Fast and the Furious, Dexter's 2009 villain, Atari 1980), and the loop. Game-side facts are his: "he shows" / "in his clip", proven by one clip each.

## 2. Hook options
1. **"GTA 6 hid an actual egg."** (chosen) 6 words, a contradiction (an Easter egg that is an egg), picturable, the payoff (the egg) can be on screen by 1 s, and the last line loops into it.
2. "Top 5 GTA 6 Easter eggs." The search phrase, but a list label: the flat opener our stats punish.
3. "Dexter is in GTA 6." Strong name, but it overclaims (it is a building name and a nod, not the character) and spends the best item first.

## 3. Source and footage (SAFE-EDIT rule 10, commentary mode)
- Source: TikTok by **@blockay**, "Top 5 Coolest GTA 6 Easter Eggs🔥", posted 2026-11-20, 62 s, 1080x1920, key `tiktok-7710081070519176479` (verdict THIRD_PARTY → cut with `--commentary`). Cached at /mnt/project-files/delta/sources/tiktok-7710081070519176479/.
- Clean check (coordinator + me, 2026-11-20): no watermark, logo or channel tag burned in. His facecam (0–2.9 s) is not used. His gameplay sits in a letterboxed band (about y 507–1415, some shots full-frame); his single-word captions sit at about y 1180–1260 (y ~920 in the GPS shot, with his corner-bracket focus box at y ~830–1090), his "#N title" labels at about y 450–470. Every crop below stays clear of all three; checked on the first, middle and last frame of each cut.
- Real game footage: continuous third-person GTA 6 play, GTA 6 HUD ("EASTER EGG" pickup label in the nest shot), Vice City skyline; no real-world footage or AI artifacts seen. The in-game car's rear badge reads **PENUMBRA** (a GTA make), so it is a look-alike of Brian's Eclipse, never "the Eclipse".
- Not used: his facecam, his GTA 5 flashback at 25–27 s (GTA 5 footage), the seafloor bodies (11–15 s, advertiser safety), the 53–60 s cutscene (another character; let the viewer go find it).
- Credit: description only ("Gameplay clips: @blockay on TikTok, used for commentary."), never on screen.

### Clip cuts (run 2026-11-20, all OK)
```
cd /home/user/molindesign
K=tiktok-7710081070519176479
CH="TikTok post by @blockay 2026-11-20 (day after launch): continuous GTA 6 gameplay (Trinity Apartments sign, the green Eclipse with HAD YOU plate, boat GPS, jet-ski dog, EASTER EGG HUD pickup in a tower nest); no real-world footage or AI artifacts seen on the contact sheets. No watermark, logo or channel tag burned in; his facecam (0-2.9 s, not used), #N title labels and word captions are cropped out of every clip with --crop."
c(){ python3 delta/clips/clipkit.py cut $K --film gta-eastereggs --as blockay --commentary --credit "@blockay" --checked "$CH" --clip "$1" --crop "$2"; }
c trinity=6.30-7.62  1080:1150:0:0      # full-frame shot: triquetra knot + TRINITY APARTMENTS lettering (+ the green car's roof at the bottom)
c plate=60.15-61.95  1080:560:0:1290    # night, car from behind, plate HAD YOU, PENUMBRA badge; below his caption line
c gps=32.00-33.12    720:330:360:1095   # boat dash GPS screen showing a Los Santos coastline map; below his caption + focus brackets
c dog=35.10-37.08    1080:650:0:520     # dog in a life vest on a jet ski pulls up, he climbs on (ends before the 37.12 s cut)
c egg=49.75-52.25    1080:560:0:610     # pink egg in his hands at the nest → he throws it off the tower, egg in the air
```
| Clip | Source in–out | Cut length | Proves | Planned use |
|---|---|---|---|---|
| trinity | 6.30–7.62 | 1.32 s | the building is named TRINITY APARTMENTS, knot logo | line `trinity`, ~1.3 s |
| plate | 60.15–61.95 | 1.80 s | plate reads HAD YOU, green body, PENUMBRA badge | line `plate`, ~1.6 s |
| gps | 32.00–33.12 | 1.12 s | GPS screen on the boat | line `gps`, ~1.1 s |
| dog | 35.10–37.08 | 1.98 s | dog on a jet ski picks him up at sea | line `dog`, ~2.0 s |
| egg | 49.75–52.25 | 2.50 s | a real egg in a nest at the top; thrown | frame 0 teaser (last ~0.8 s, egg in air) + line `nest`, ~2.3 s |

Total on screen ≈ 9.1 s of ≈ 33.7 s ≈ 27 % (cap: a third). Each use < 2.5 s, all muted, each annotated. No boat-deck shot (the GPS alone carries #5; the director can show Jason's place as our own graphic).

## 4. Facts used
Game-side facts rest on his narration (transcript.txt, faster-whisper) and the footage. Outside facts were read 2026-11-20.
| # | Fact | Line | Source |
|---|---|---|---|
| 1 | Michael's boat, "stolen all the way back in GTA V", is at Jason's safehouse; on its GPS "you can still see it's stuck in Los Santos". | boat, gps | @blockay narration 24.5–33.1 s; GPS footage 32.0–33.1 s |
| 2 | GTA 5: in the mission "Father/Son", Jimmy tries to sell Michael's yacht and it is stolen (towed away on the freeway); Michael and Franklin chase it. GTA 5 released September 2013. | boat ("from GTA 5") | https://gtabase.com/grand-theft-auto-v/missions/father-son ; https://en.wikipedia.org/wiki/Grand_Theft_Auto_V (released September 2013) |
| 3 | Stranded far out at sea, a dog pulls up on a jet ski; you get on, it takes you to a dog island (wallet, fetch). We say only "picks you up". | dog | narration 33.1–44.4 s; dog clip 35.1–37.1 s |
| 4 | In The Fast and the Furious (2001, US release June 22, 2001), Brian O'Conner (Paul Walker) drives a green Mitsubishi Eclipse. | car (2001 card on screen, not spoken) | https://en.wikipedia.org/wiki/The_Fast_and_the_Furious_(2001_film) (Dodger Stadium scene, "Brian tests his Eclipse"; release date); https://www.hotcars.com/brians-mitsubishi-eclipse-fast-and-furious/ (green, 1995) |
| 5 | The in-game car is a look-alike: rear badge PENUMBRA, Brian-style green and blue livery, plate "HAD YOU". He says it is in a villa garage on Vespucci Island. | car, plate | plate clip 60.15–61.95 s; narration 15.0–24.5 s |
| 6 | The building is called Trinity Apartments, with a triquetra (trinity knot) logo. | trinity | trinity clip 6.30–7.62 s; narration 2.9–7.3 s |
| 7 | Trinity: the "Trinity Killer" (Arthur Mitchell, John Lithgow) is the villain of Dexter season 4, aired Sept 27 – Dec 13, 2009; the show is set in Miami (Vice City's real-world model). We say "villain", not "killer". | trinity | https://en.wikipedia.org/wiki/Dexter_season_4 |
| 8 | Climbing the tallest tower in Vice City takes "over five minutes" (his claim; not voiced); at the top a literal Easter egg; throw it and you get a cutscene. | tower, nest | narration 44.4–52.4 s; egg clip 49.75–52.25 s (HUD "EASTER EGG" on pickup at ~48.7 s) |
| 9 | Atari's Adventure (released March 1980) hid a room reading "Created by Warren Robinett"; Atari "dubbed such hidden features 'Easter eggs'" (Steve Wright: "like Easter eggs for players to find"). | atari | https://en.wikipedia.org/wiki/Adventure_(1980_video_game) ; atari.com's own post (https://atari.com/blogs/atari/so-let-s-talk-about-that-easter-egg) returned 403 from the container ; https://en.wikipedia.org/wiki/Easter_egg_(media) (the term "coined around 1980" by Atari's Steve Wright, so the narration says "around 1980") |
| 10 | 2026 − 1980 = 46 ("Forty-six years later…"). | loop | arithmetic |
| 11 | Posted 2026-11-20, a day after the Nov 19 launch. | (description) | TikTok upload date (provenance.json) |

Not claimed: that Dexter himself is in the game or that the apartment is "his" (we say only the name), that the boat is the exact GTA 5 yacht model, the tower's height, the dog island and wallet, the bodies, that Rockstar confirmed any of these, that Adventure's was the very first Easter egg (we say Atari *named* them).

## 5. Arc (tension 1–5 per line)
| Line | at | Text | Tension |
|---|---|---|---|
| hook | 0.2 | GTA 6 hid an actual egg. | 4 |
| five | 2.4 | First, four more GTA 6 Easter eggs. | 3 |
| boat | 4.9 | Five: Michael's boat from GTA 5 is at Jason's place. | 3 |
| gps | 8.3 | Its GPS still thinks it's in Los Santos. | 4 |
| dog | 11.1 | Four: stranded at sea? A dog on a jet ski picks you up. | 4 |
| car | 15.4 | Three: a copy of Brian's Fast and Furious car. | 3 |
| plate | 18.6 | The plate says HAD YOU. | 4 |
| trinity | 20.4 | Two: Trinity Apartments. Trinity was Dexter's villain in 2009. | 3 |
| tower | 24.2 | One: the tallest tower in Vice City. | 2 (the dip: a five-minute climb, nothing yet) |
| nest | 26.7 | Up top, in a nest: an actual Easter egg. | 5 |
| atari | 29.8 | Atari named them around 1980. | 4 |
| loop | 31.9 | Forty-six years later… | 5 → loops into "GTA 6 hid an actual egg." |

Row: **4 3 3 4 4 3 4 3 2 5 4 5**. ~33.7 s estimated (99 words, ~3.0 w/s). Launch-week RUN.md says 20–30 s; the coordinator asked ~30–35 s for a 5-item list. If the director needs to cut, drop line `five` and put GTA 6 EASTER EGGS on screen under the hook instead.
- DM-able moment: the dog on a jet ski (line `dog`).
- Turns: "First", "But"-free countdown beats every ~3–4 s (Five / Four / Three / Two / One), the dip, then "Up top".
- Time cards on screen: `2013` (boat), `2001` (car), `2009` (Trinity), `1980` (Atari), `2026` (loop).
- scriptlint: OK, no warnings.

## 6. Shot ideas per line (director decides)
Our own set: a countdown **egg carton** (six cups, five filled with item tokens; the sixth cup empty and glowing until the nest line drops the real egg in). Each item = a numbered cup lifts, a clip card pops out of it with a coral annotation, a dated stamp.
- hook (frame 0): `A REAL EASTER EGG?` big, GTA 6 pill, the empty glowing cup; egg clip's last ~0.8 s (egg in the air) from ~1.0 s = payoff by 2.0 s.
- five: carton fills with five numbered tokens; caption chip **GTA 6 EASTER EGGS** (search phrase).
- boat: cup 5, our drawn sailboat on a trailer + `2013 · GTA 5` stamp.
- gps: gps clip in a card, coral ring on the screen, chip `STILL LOS SANTOS · IN HIS CLIP`.
- dog: cup 4, dog clip full-width card; coral circle on the dog's life vest; this is the share beat.
- car: cup 3, `2001` card, chip `LOOK-ALIKE` (never the word Eclipse on the car itself).
- plate: plate clip, coral box on the plate, stamp `HAD YOU`.
- trinity: cup 2, trinity clip, coral circle on the knot logo, `2009 · DEXTER S4` card. No bodies, no knives.
- tower: cup 1, a tall drawn tower with a climbing dot and a `5+ MIN` timer (his claim, "HE SAYS").
- nest: egg clip; the real egg drops into the empty sixth cup.
- atari: `1980` card, a chunky pixel square (Adventure's dot) slides into a hidden room, label `ATARI NAMED THEM`.
- loop: `+46 YEARS` counter slams to `2026`, cut straight to frame 0.

## 7. Open questions for the director
- Length: 33.7 s estimate vs launch-week 20–30 s. Keep, or drop line `five` (–2.5 s)?
- The `plate` clip is night and dark at the bottom; lift exposure in the card or crop tighter in-film to the plate (about x 330–750 of the cut).
- The `gps` screen is small and soft at 720 px source width; it is proof of the screen, not a readable "Los Santos" label. Our chip carries the claim with "IN HIS CLIP".
- Ming and "HAD YOU": `say` is "had you" with a comma; listen-check it is heard as two words.

## 8. Description closing line
Gameplay clips: @blockay on TikTok, used for commentary. Made with our own graphics. Not affiliated with Rockstar Games or Take-Two.

## Log
- 2026-11-20: brief, script and clips by the video-researcher (5 clips cut and frame-checked).
- 2026-11-20 jury r1 (7.1, Truth 8.5): real green car clip replaces the drawn coupé; Atari line hedged to "around 1980" per Wikipedia "Easter egg (media)"; HE SAYS on the 2013 card and on TALLEST; boat redrawn as a yacht on a trailer.
