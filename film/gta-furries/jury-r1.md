# Jury round 1: gta-furries ("GTA 6 Made Furries Illegal 🦊")

I'm a fresh jury and I didn't make this film. I reviewed it on 2026-11-25. I scored `out/gta-furries-vo.mp4` cold: 25.57 s, 1080x1920, 30 fps. I used `.claude/agents/video-jury.md`, the SAFE-EDIT jury checklist and hook rule, and rules 3, 7, 10 and 11.

**What I looked at:**
- **Stills:** 0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.3, 14.2, 15.0, 15.8, 16.6, 17.4, 18.2, 19.2, 20.0, 20.8, 21.6, 22.4, 23.2, 24.0, 24.8 and 25.4 s.
- **Zoom crops:** the reward prompt at 19.6 s and the van clip's top-right corner at 12.5 s.
- **Motion:** I measured motion per third of a second (YDIF) over 8.4–12.2, 15.0–17.6 and 22.0–25.6 s.
- **Sound:** loudness (ebur128), and peak level per 0.25 s to find silent gaps and hits. I also read the Whisper results in `mix.log` and `voice.log`.
- **Rules:** I ran `clipkit.py lint gta-furries` and checked every film's `clips.json` for range overlaps.
- **Sources:** I read Dexerto, PinkNews and EarlyGame myself on 2026-11-25.

## Verdict: **PASS, fix then post** (overall 7.5, Truth 8.5)

| Criterion | Score | Why |
|---|---|---|
| Hook | **7.5** | **Frame-0 rule passes.** Frame 0 reads `FURRIES` / `ARE ILLEGAL` (red slab) plus a `GTA 6` chip: 5 words, readable with the sound off. The red prohibition slash is on the TV by 0.5 s. The re-created `ANTI-FURRY ASSOCIATION` card is up at 1.5 s, so the payoff (the ad says so) is on screen before 2.0 s. pacecheck: motion 1.21 over 0–1 s and 1.59 over 0–3 s. The spoken hook carries "GTA 6" in its first second. What holds it back: the moving thing on frame 0 is the dimmed Trailer 1 plate, not our hero. The fox head is a ~300 px flat icon on a ~780 px TV, and it sits still until the slash. By 1.5 s the screen is a 4-line quote in ~44 px caps, which reads as a text card. The topic broke on Nov 18–19 (Dexerto, PinkNews, EarlyGame), so some viewers have seen it. |
| Retention | **7.0** | Re-hooks land at 1.5 (ad), 4.5 (speech bubbles), 6.2 (light bar), 8.6 (helicopter and fox), 11.5 (barricades), 12.2 (footage), 15.2 (garage door), 18.2 (envelope), 20.8 ($15,000 slam) and 22.4 (vote). Soft spots: (a) **23.0–24.7 s** is a near-still end card (YDIF 0.27 flat for ~1.7 s) after "Gun or cash?". (b) The plates are slowed hard. `pheli` is 0.96 s of source stretched over 3.8 s (≈25 % speed); `praid` is 1.16 s over 3.17 s (≈37 %); `pnight` is 1.56 s over 2.78 s. The 8.6–12 s aerial reads as a frozen, smeared backdrop (9.5 and 10.5 s look identical). (c) At 15.0 s there's a shut grey garage door with no caption. At 17.4 s the frame is near-empty while a blurred envelope flies in. |
| Clarity | **8.0** | One story in order: law → ad → hunt → reviewer encounter → escape → hideout → reward → vote. A 14-year-old gets it. Weak points: "in this player's run, the thank-you" is a mouthful on first hearing. The 1.5–5.9 s ad card asks for two reads at once (a quote block plus a red quote block), and then three bubbles arrive. |
| Truth | **8.5** | The core facts check out against the sources. **F1:** PinkNews quotes "Furry activity of any kind is illegal in the state of Leonida, and all citizens are required to report any suspicious activity," paid for by the "Anti-Furry Association", with "Uwu, Rawr xD, Or hewwo". The card's two excerpts and ellipses are exact. **F3:** Dexerto has the CNET helicopter, fox suit, blockade and compound account. **F4:** the 19.6 s zoom shows `GUN` / `CASH ($15,000)` in the game's own prompt, and every on-screen $15,000 traces to it. The reward is scoped `IN THIS PLAYER'S RUN` in both voice and caption. The ad is re-created and tagged `RE-CREATED · IN-GAME TV AD`, so we don't show in-game TV footage (SAFE-EDIT "Never"). Flags: **(a)** "Reviewers met a guy **in a fox suit**, under a police helicopter" under the chip `CNET · GQ REVIEWS`. Only CNET's account (via Dexerto) is a fox suit; Dexerto's GQ account is "a fursuited character under a helicopter spotlight", and it ended with armed police taking them down. The chip makes GQ claim the fox suit too. This is the LESSONS pill-against-caption pattern (gta-money r1). **(b)** "Break the blockade, and you help the furries escape" is stated as the mechanic. Dexerto's GQ account and EarlyGame ("not everyone managed to save the character") show it can fail. A conditional is fine; the outcome isn't guaranteed. **(c)** The hook "being a furry is illegal" is wider than the ad's "furry activity of any kind is illegal in the state of Leonida". The Vice City Horn headline "Governor declares Leonida furry-free" (Dexerto) backs the spirit, so this is acceptable but at the edge. **(d)** "Their hideout" and the "thank-you" framing are our reading of the creator clip's subtitles (BRIEF: sources say "compound"). That's fair, but no outside source backs it. |
| Motion and design craft | **7.0** | It's a new hand-built set per LESSONS: a wood CRT with dials and antennas, a police light bar, a helicopter searchlight, sawhorse barricades that snap, a roll-up garage door with a paw, a paw-sealed envelope, and gun/cash vote cards. That isn't template-generic. Problems: **(1)** From 12.0 s to the end, every beat uses the same layout: caption top-centre, a ~820 px cream footage card centred, police tape at y≈1530, an empty navy field. That's half the film on one composition, close to the LESSONS "identical centred composition" repeat (gta-longestwait). I'm taking half a point, not a full one, because the first half varies. **(2)** The footage is small: the van and hideout clips are ~820x780 px, and the hero prompt is a ~100 px HUD item inside it. Our enlarged prompt panel saves it. **(3)** The fox mascot (8.6–12 s) reads as a teddy or dog more than a fox; only the tail says fox. **(4)** The end header box `GUN OR CASH?` runs to x≈1052, past the x 930 rail; the text ends at about x 912, so the edge sits under the Shorts buttons. **(5)** The smeared slow-motion plates look like a low-res still. |
| Voice and sound | **7.0** | Ming US_James. Whisper WER is 0 on all 8 lines through the mix, 2.3–3.6 w/s. Loudness is −13.9 LUFS, −2.7 dBTP, LRA 2.7 LU, with no music bed and no black frames. There are hits at 12.0 s (break, −10 dBFS) and in the 21.75–22.1 s gap (−15). The film's own moves are **silent**: the set knocked off at 5.75–6.1 s (−33 to −35 dBFS), the helicopter arrival at 8.0–8.4 s (−31), the envelope at 17.25 s (−32), and the garage door at 15.0 s is quiet (−23). LESSONS (gta-longestwait, gta-money) say juries dock quiet hero sounds. There are soft words in the dry check, "report" 0.31 and "Thank" 0.20. Whisper heard "They're hideout"; it's a homophone, so fine on screen. |
| Loop and ending | **7.5** | "Which one are you taking?" over two equal cards, neither highlighted, then the TV and title drop back in over a seam plate cut from the same Trailer 1 shot. The picture loop is seamless. The words don't loop, though: "…are you taking?" → "In GTA 6, being a furry is illegal" is a restart, not a continuation. The last ~1 s is silent (−34 to −36 dBFS). |
| Shareability | **8.0** | Highest-ceiling topic in a while: an absurd in-game law, the `UWU · RAWR XD · HEWWO` bubbles, and a "gun or $15,000" vote people can answer in one word. The screenshot frame is the 20.8 s prompt with `$15,000` slammed. What holds it back: the funniest sourced line, hunters "authorised to shoot any furry on sight", was dropped as too dark (a defensible call). The news is 6 days old. |

**Mean:** (7.5 + 7.0 + 8.0 + 8.5 + 7.0 + 7.0 + 7.5 + 8.0) / 8 = 60.5 / 8 = 7.56, recorded as **7.5** (never rounded up).

**Gate:** overall ≥ 7.0 and Truth ≥ 8.5, so it **PASSES**. It's under 8.0, so the verdict is **fix then post**.

**Comparison:** level with gta-iguana r1 (7.4, its benchmark) and just under gta-holdup r2 (7.6). It's above the 6.7–7.2 band of the held Delta films. One LESSONS pattern recurs: a pill/chip read against its caption (fix 2), docked in Truth. The centred composition (fix 4) is docked half a point in Craft.

## SAFE-EDIT jury checklist
- **Footage we don't own over 5 s, unannotated: pass.**
  - Creator clips: van 2.75 s (ring and escape arrow), arsenal 2.4 s (HIDEOUT chip, brackets, push-in), choice 2.75 s (ring, enlarged prompt panel, slam). Each is under 5 s, muted, and annotated.
  - The garage door breaks the van → hideout run.
  - The plates sit under our own cards at dim 0.40–0.50 (≥ 35 %), and each is under 5 s of screen time.
- **Rumor stated as fact: pass.** None; the reward is scoped to one player's run.
- **Leak or ending shown: pass.** None.
- **Trailer or radio music audible: pass.** Clips and plates are muted; the audio is voice, SFX and room tone.
- **Number without a source: pass.** $15,000 comes from F4, the prompt itself, which I verified in the 19.6 s zoom.
- **Hook rule: pass.** Frame 0 has 5 words, readable muted (`FURRIES ARE ILLEGAL` + `GTA 6`). The payoff (ad card) is on screen at 1.5 s, before 2.0 s.
- **Rule 3 (trailer excerpts under 5 s, annotated, used as evidence): pass.** Rockstar footage appears only as rule-11 plates: pnight 1.56 s src, praid 1.16, pcops 2.36, pheli 0.96, pseam 0.33. None is foreground; foreground Rockstar footage is 0 %.
- **Rule 7 (no clip reused across films): pass.** I checked every `film/*/clips.json`; no range from t1, t2 or Out Now overlaps another film's. pseam (24.95–25.3) and pnight (25.3–26.9) touch but don't overlap, and they're inside this film (the loop).
- **Rule 10 (creator clips): pass, with one thing to confirm.**
  - Creator time is 31 % (cap 33 %), all footage 31 % (cap 50 %), per `clipkit lint ok`.
  - The facecam and burned-in TikTok captions are cropped out (`1080:1040:0:880`). No creator face appears in any frame I pulled.
  - The credit "@nerpah" goes in the description only (BRIEF §5); make sure video-seo copies it.
  - The in-game subtitles kept are clean ("Good job not getting shot, Chase. Who's the human?").
  - Our voice makes a point about each clip.
  - Confirm: a ~12 px white glyph sits in the van clip's top-right corner (about x 1000, y 1290 in frame at 12.5 s). It looks like a game HUD icon, not a channel mark. If it's a TikTok or creator mark, crop it.
- **Rule 11 (plates): pass.** Plates are 50 % and real footage on screen is 80 % (≤ 85 %). They're dimmed and always under our cards, and they never sit under creator clips.

## Fixes, ranked by impact
1. **Scope the reviewer line and chip (8.6–12.0 s, Truth +0.5).**
   - Change the chip to `CNET REVIEW` (only CNET had the fox suit and helicopter).
   - Or keep both outlets and say "Reviewers met a furry under a police helicopter," with the chip `CNET · GQ REVIEWS`. That fits both accounts and keeps the fox mascot.
   - Change "Break the blockade, and you help the furries escape" to "Break the blockade, and **you can** help them escape" (GQ and EarlyGame: not everyone saves them).
2. **Wow: put sound on our own moves (Voice +0.5, Retention).** These are the film's own set pieces and they're silent now. Fit hits into the existing gaps:
   - A TV knock-off whoosh at 5.8 s (gap at −33 dBFS).
   - A rotor thump and searchlight "clunk" at 8.1 s (gap at −31).
   - A garage-door rattle at 15.0 s, up from −23 to about −10.
   - A paper whoosh plus a wax-seal crack at 17.3 s (−32).
   - A cash-register "ka-ching" at 20.8 s on the $15,000 slam if it isn't already there.
   - Target −8 to −12 dBFS each.
3. **Make frame 0's hero move, not just the plate (0–1.5 s, Hook).**
   - Grow the TV so the fox head is ≥ 450 px and the cabinet ≥ 900 px wide, filling the empty floor below y 1000.
   - Add a 2-frame screen flicker or roll band from frame 0.
   - Bring the slash in at 0.15 s with a hit.
   - Cut the 1.5 s ad card to a single read: `"FURRY ACTIVITY OF ANY KIND IS ILLEGAL…"` big (≥ 60 px). Hold the red "…REPORT ANY SUSPICIOUS ACTIVITY." until "report" at about 4.3 s.
4. **Break the centred-card stack in the second half (12–25 s, Craft +0.5).**
   - Tilt the van card −4° and pin it left (x 60–880).
   - Push the hideout card full-bleed (≥ 1000 px wide) for the gun-wall beat.
   - Drop the choice card low (y 900–1450) with the envelope flap above it.
   - Use the empty y 1000–1450 band: the barricades and tape can live there instead of a fixed strip at 1530.
5. **Kill the near-still end (23.0–24.7 s, Retention).**
   - Give the vote cards a slow 1.0 → 1.08 push.
   - Add an alternating wobble on "Which one" and "taking".
   - Add a pulsing `COMMENT 👇` style arrow under the cards (or a GUN/CASH tally ticking up, not favouring either).
   - Put a hit on the TV drop-in at 25.0 s so the loop has sound.
6. **Stop slowing the plates (0–12.2 s, Craft and Retention).**
   - Use each plate at ≥ 0.75× speed and cut to a new unused range instead of stretching.
   - The 8.6–12.2 s helicopter beat needs 3–4 s of source: two 1.8 s aerial-night ranges from Trailer 1 or the Extended Look, never reused.
   - The `pheli` smear at 25 % speed reads as a broken video.
7. **Fix the fox mascot's read (8.6–12 s, Clarity).** Sharpen the muzzle (a longer snout, white chin triangle), make the ears longer, add a white tail tip, and add a darker orange mask around the eyes. Right now it reads as a teddy bear.
8. **Keep the vote header inside the rail (22.2–25.0 s, Craft).** Make the `GUN OR CASH?` box 140–930 (790 px wide) at its rest position.
9. **Lighter fix to the reward line (17.55 s, Clarity).** Try "In this player's run, they paid him back: a gun, or fifteen thousand dollars." Or keep the line and cut "the thank-you" from the caption to `THIS PLAYER'S REWARD:`. "Thank" was a 0.20 confidence word.
10. **Housekeeping, not scored.**
    - `film/gta-furries/vo/` holds `gta-iguana-vo.mp3`, another film's voice, which isn't gitignored. Meanwhile `index.html` loads `vo/gta-furries-vo.mp3`, which doesn't exist, so the live web page plays no voice.
    - Copy the right mp3 in (or export it from `out/vo/`) and delete the iguana file before the PR.

## Anything generic or AI-made
- The props are hand-built and specific to this film; I saw no stock-template look.
- The second-half "caption on top + centred card + tape strip" layout is the closest thing to a template (fix 4).
- The slowed plates look like an AI frame-interpolation smear even though they aren't (fix 6).
