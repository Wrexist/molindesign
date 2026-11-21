# Nine things to do in GTA 6 (GTA 6, Delta, trailer mode)

Slug `gta-thingstodo` · VIDEO-PLAN format 5 ("It has X", shown) + A3 (Extended Look, unused by any Delta film until now) · researched 2026-11-20 in the thread "Plan GTA 6 videos and make the best one", after Isac said "continue do amazing content and post" · channel **Delta**. American English, Ming US_James seed 7, no AI tag, no music, English captions. GTA 6 launched **November 19, 2026**. Launch-week rules (delta/RUN.md): frame-0 hook in 5 words or fewer, payoff on screen by 2.0 s.

## 0. Packaging score: 5/6
| Mark | | Why |
|---|---|---|
| Mine | 1 | The game they bought this week; all nine are things they can go do tonight. |
| Myth or threat | 0 | Nothing at stake. Curiosity + a checklist. Honest 0. |
| Frame-0 test | 1 | Frame 0: the BASE-jump clip mid-air (teaser, 0.8 s) under `9 THINGS TO DO` (4 words). |
| Takeaway | 1 | A nine-item to-do list; the grid on the last frame is screenshot-able. |
| Title | 1 | "9 Things to Do in GTA 6 (Rockstar Showed Them All)" |
| Searched | 1 | "things to do in GTA 6" / "GTA 6 activities" are the launch-week searches. |

## 1. One hard idea
A **to-do grid that fills itself**. Nine empty pictogram slots (3×3, our own vector icons) sit on screen from frame 0 at 0/9. Each item: the clip proves it full-width (about 1.2 s), then the picture collapses into its slot and the icon stamps in with a tick and the counter rolls (1/9 … 9/9). Goal-gradient: the viewer wants to see the grid finish. The ninth slot is the big one (BASE jump), held longest; the last frame is the full grid + "WHICH FIRST?". Loop: last frame's full grid → frame 0's empty grid reads as "again".

## 2. Hook options
1. **"Nine things to do in GTA 6. Count along."** (chosen) the search phrase in the first five words, a task for the viewer, the grid makes "count along" literal.
2. "Rockstar showed all this in one video." Curiosity, but no search phrase and "all this" needs the picture to land.
3. "GTA 6 has scuba diving." One item spent up front; weaker than the full list.

## 3. Source and footage (SAFE-EDIT rule 7, trailer mode, official only)
- Source: Rockstar Games, GTA VI **"An Extended Look"**, rockstargames.com/videos/rk721912, file https://videos-rockstargames-com.akamaized.net/v4/rk721912/flv/en-us-1080p.mp4 (Rockstar's CDN, verdict OFFICIAL; 1608 s = 26:48). The activity montage runs 1026–1143 s, right after a character asks "Wanna take a look around?" (1024 s, faster-whisper). Gameplay HUD visible in most shots (minimap, LAP 1/2, positions).
- All clips muted, cut at 1920 wide, no crop needed. Frame-checked first/middle/last on 2026-11-20 (grid in /tmp, see the thread).
- Cut with clipkit (2026-11-20; cache_root pointed at a local copy because the project mount can't hold symlinks):

| Clip | Source in–out | What it proves (checked on frames) | Line |
|---|---|---|---|
| airboat | 1030.0–1032.8 | fan airboat across a green swamp channel, minimap | airboat |
| hoops | 1033.1–1035.9 | man in a tank top shoots a basketball at a hoop under a stilt house; SHOOT prompt | hoops |
| dive | 1036.1–1038.6 | scuba diver swims through an underwater cave arch, rays above; oxygen bar | dive |
| gym | 1038.8–1041.6 | Lucia on a bench press (GAINZ plates), top-down | gym |
| jetski | 1045.05–1046.85 | two jet skis at sunset, minimap | jetski |
| kayak | 1049.0–1050.95 | green kayak paddled in front of the downtown skyline | kayak |
| race | 1062.0–1064.8 | circuit race, LAP 1/2, position 11/16 → 9/16, timer | race |
| dirtbike | 1114.9–1117.8 | dirt bike race, LAP 1/2, 11/12 → 9/12 | dirtbike |
| basejump | 1128.2–1133.9 | runs off a high-rise roof edge over the city, freefall arms out | base (+ frame-0 teaser) |
| chute | 1133.5–1137.6 | orange parachute opens over the skyline | base |

Budget: aim ≈ 1.1–1.3 s per item use, the BASE jump ≈ 2.4 s (jump 1.3 + chute 1.1 with our graphic between or a hard cut… keep under 4.9 s), frame-0 teaser ≤ 0.8 s. Total ≈ 13 s of ≈ 27 s ≈ 48 %: right at the 50 % cap, so the grid beats between clips are required (they also satisfy the no-5-s-unbroken rule). If lint fails, shorten the item uses, never the grid beats.

## 4. Facts (what we may say)
| Claim | Proof |
|---|---|
| Rockstar showed every one of the nine. | All nine clips are from rk721912 on Rockstar's own site/CDN. |
| "Extended Look" is Rockstar's own GTA 6 video, 26:48. | provenance.json duration 1608.07 s; VIDEO-PLAN §8 (rockstargames.com/videos/rk721912). |
| Track race / dirt-bike race | LAP 1/2 and position HUD on the clips. |
| BASE jump off a tower | she runs off a high-rise roof edge and opens a parachute (1128–1137 s). Say "a tower", not a named building. |
| "kayak past the skyline" | downtown towers behind the kayak. |
Do NOT say: "only in the Extended Look", "new in GTA 6", any price, any location name we can't read on screen, "minigame". "Things to do" = shown being done in gameplay.

## 5. Script (vo/script.json, dur ≈ 27 s, 11 lines)
hook "Nine things to do in GTA 6. Count along." → one line per item ("One: airboat the swamps." … "Nine: BASE jump off a tower.") about 2.05 s apart → end "All from Rockstar's own Extended Look. Which one are you doing first?". The `at` times are a first guess: the director retimes from the takes.

## 6. Picture notes for the director
- Look: Delta's dark set, one accent (Vice pink/sunset orange), big numerals. Full-width plates (jury lesson from gta-sametrailer: split/two-window "dashboard" layouts cap Craft at ~4).
- Pictograms: simple bold strokes, one per item (airboat fan cage, hoop + ball, diver + bubbles, barbell, jet ski, kayak + paddle, checkered flag, dirt bike, parachute). Drawn in code; ticked slot turns accent.
- Annotate each clip (CLIP.use note is required): the item label as a chip, plus one detail the clip proves where it fits (LAP 1/2 circle on race/dirtbike, oxygen bar on dive).
- Captions: whole phrases, inside safe area, never over the HUD minimap corner of the clip.
- Sound: one stamp/tick per slot, whoosh into each clip, a bigger hit + wind on the BASE jump. No music.
- Ending: full grid 9/9, `WHICH FIRST?` + comment prompt, hold ≥ 1.5 s.

## Log
- 2026-11-20: researched, clips cut, script drafted (this thread). Next: director build → jury (7.0, Truth 8.5) → seo → queue next free slot.
- 2026-11-21: director build. Two script edits for the listen check, both inside §4: "kayak past the skyline" → "kayak in front of the skyline" (Whisper heard "pass" on three takes) and "jet ski" → "ride a jet ski" (heard "Jetsky" + an SFX as "See you" in the mix). Lines retimed from the takes; dur 30.25 s. Footage 47 % (clip lint ok), readcheck ok, boundscheck ok, in-mix Whisper WER 0 on all 11 lines, −14.1 LUFS, pace OK (no frozen stretches). "COMMENT YOUR PICK" chip dropped (failed the read time; the voice asks the question); the source tag ROCKSTAR · AN EXTENDED LOOK holds under WHICH FIRST? instead. Next: jury.
