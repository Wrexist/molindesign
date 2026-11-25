# Treatment · Is public Wi-Fi safe?

Factory #42 (`publicwifi`), the director's plan. Script and sources are in `BRIEF.md` and `vo/script.json` (Ming US_James, seed 7, no music, no AI tag). The engine, gates and sound come from `../findableoff/` (#41, r2 7.4 / Truth 8.5): the safe box with `CLIP_RUN` and `LABELS_RUN`, the peel and slap patterns, the torn-paper roll, captions keyed to the frame time, the SFX gate from `vo/heard.js`, and the loop seam at t = 1/60.

The look is this film's own. It is all cut paper. A sealed paper capsule carries YOUR LOGIN along a kraft pneumatic track, from a generic phone, past an airport router, to a site.

## Two benchmarks
- **Learn from `findableoff` (#41, 7.4 / Truth 8.5).**
  - One hand-made object in motion on frame 0 that is back on the end card.
  - A scope plate at ≥ 44 px by 0.8 s.
  - The source's page as a re-created card that prints on its words.
  - One coral stamp.
  - Flat paper grounds per act.
  - **Don't take:** its sofa, rings-as-beacon, city pull-back or Settings screen.
- **Learn from `juicejacking` (#36, 7.8 / Truth 9.0).** A myth-versus-record story: a common fear, a primary source that says less than people think, and a concrete check. **Don't take:** its charger, cable or lab arm. This film has no people and no hands.

## Three structures
1. **The list, the track, the fake shop, the test (chosen).**
   - Frame 0 is a re-created Wi-Fi list with FREE_AIRPORT_WIFI: the doubt everyone has had.
   - Pull back to a side-on pneumatic track: in the early internet an open slip gets read by a periscope; today the capsule is sealed.
   - The FTC stamp lands, USUALLY SAFE.
   - Push in on one shop: the sealed capsule arrives intact at a fake bank and is opened inside.
   - The viewer's own test: two made-up addresses, left or right.
2. **Before/after split screen** (early internet versus today). Clear, but it ends at "safe" and has no room for the twist.
3. **Start on the fake shop.** That puts the answer on frame 0 and loses the turned belief.

## The native move: the pneumatic run
A capsule leaves the phone, rides the kraft track past the router and lands in a site's slot with a thunk.
- **Early internet:** an open paper slip, and the router's periscope reads it.
- **Today:** the coral wax seal stamps on, and the periscope sees only scribble.
- **The dip:** the same perfect run lands in the fake bank.

## Layouts
- **A (0 – `then`), the airport.**
  - Frame 0 is a landscape paper phone (840 × 440) showing the re-created Wi-Fi list, with FREE_AIRPORT_WIFI (open, no lock) as one big row. SAFE? sits above it, and the RE-CREATED tag is on the phone. That makes 3 words.
  - The phone glides up about 200 px and settles. Cream Wi-Fi rings radiate from its fan icon. A paper plane crosses the terminal window, and empty gate seats fill the lower third.
  - At 0.6–0.8 s SAFE? peels. The scope plate FTC · PUBLIC WI-FI · FEB 2023 (56 px) prints at 0.8 s. USUALLY slaps onto the Wi-Fi row on "usually".
  - IS PUBLIC WIFI SAFE (RE-CREATED) types from 1.5 s.
- **Change 1 at `then`, the track.** The phone turns upright and shrinks to the left end of a kraft track. A paper router stands in the middle with a periscope, and a site storefront sits at the right. EARLY INTERNET is on "Early".
  - `snoop`: the open slip run. The periscope swivels, and a copy of the dots inks into its notepad.
  - `now`: TODAY. Twelve shop tiles fan out above the track and nine seals go coral on "most" (MOST SITES · FTC). The slip rolls into the capsule, and the seal stamps on "encryption". The periscope reads scribble.
- **Hero on `hero`.** The FTC article card (RE-CREATED, FEB 2023) drops over the shops, and its quote inks on "usually". The hero plate rises over the track. USUALLY / SAFE (coral, two lines, about 150 px) inks on "usually" and slams in the 1.1 s pause. PUBLIC WI-FI · FTC · FEB 2023 sits under it at 44 px, and the sealed capsule sits beside it. The stamp peels before "Except".
- **Change 2 at `dip`, the fake shop.** A torn wipe to one big storefront: a crooked BANK sign, FICTIONAL BANK, and the same coral seal on its door. The FTC quote "THEY ALSO CREATE FAKE WEBSITES AND ENCRYPT THEM…" prints on "fake".
  - `sealed`: IF YOU VISIT A SCAMMER'S SITE (scope, 44 px). The big capsule (about 440 px) makes a perfect run into the door slot with its seal intact. The shutter drops in the pause with a thud, and the shadow of the capsule opening shows on the blind. The FTC plate (A11) prints on "scammer".
  - `honest`: the shutter lifts a little. The seal swings on the door, still whole, next to the open capsule. SEALED ≠ HONEST slams on "honest".
- **C at `check`, the test.**
  - A big re-created address bar (generic icon, never a padlock) reads https:// lumenbank.example (the real one). Its tiles flip one by one on "letter by letter". Tags: RE-CREATED and MADE-UP ADDRESSES. The Chrome Help quote sits above it.
  - `apple`: a second bar, lumembank.example (the fake), slides in under it on "fakes". Apple's quote prints on "letters". No tile is tinted.
- **End.** The two bars swing apart into two cards (the top, real one goes left; the bottom, fake one right), labeled LEFT / RIGHT (112 px), with neither highlighted. In the tail the cards fly off sideways, the phone glides up into frame 0's pose and SAFE? drops in, so the loop seam holds.

## Rules for this film
- "Usually" goes on every safety claim. Never SAFE alone, never a check mark on the Wi-Fi list, no 100 % and no NO RISK.
- "Most", not "all": 9 of 12 shops are sealed and 3 stay grey.
- No padlock anywhere. The capsule carries a wax seal. The address bars show https:// and a generic tune icon.
- No people: no hands, no hacker. The snooper is a paper periscope, and the opening happens as a shadow on a blind.
- RE-CREATED goes on the Wi-Fi list, the search bar, the FTC card and both address bars. FICTIONAL BANK and MADE-UP ADDRESSES are 36 px tags. The addresses are RFC 2606 reserved names (`.example`). The voice never reads them.
- Coral goes only on the wax seals and the USUALLY SAFE stamp.
- Every FTC string lives in one `FTC` block in `film.js` (browser confirmation pending), so a correction is one edit.

## Line → picture
| Line | Picture |
|---|---|
| hook | Frame 0: Wi-Fi list phone gliding up, rings radiating, SAFE?. Scope plate at 0.8 s; USUALLY slaps on the row on "usually"; the search bar types from 1.5 s. |
| ask | The scope plate nudges on "FTC"; the Wi-Fi row pulses on "safe?". |
| then | Phone turns upright and slides to the left of the track; router and site appear; EARLY INTERNET on "Early". |
| snoop | Open slip YOUR LOGIN •••••• rides the track; periscope swivels and copies it on "scramble". |
| now | TODAY on "today"; 12 shop tiles, 9 seals coral on "most" (MOST SITES · FTC); seal stamps on the capsule on "encryption"; periscope reads scribble. |
| hero | FTC card drops; quote inks on "usually"; USUALLY / SAFE stamp, PUBLIC WI-FI · FTC · FEB 2023; thump in the pause. |
| dip | Wipe to the fake shop; sign wobbles on "fake"; FTC quote A10. |
| sealed | Scope chip; perfect sealed run into the slot; shutter thud; shadow opens the capsule; FTC plate A11 on "scammer". |
| honest | Seal swings intact next to the open capsule; SEALED ≠ HONEST. |
| check | Address bar lumenbank.example (real); tiles flip letter by letter; Chrome Help quote. |
| apple | Second bar lumembank.example (fake) slides in on "fakes"; Apple quote on "letters". |
| end | Bars swing to LEFT / RIGHT cards; in the tail they fly off and frame 0 returns. |

## Jury r1 fixes (r1: 6.75 overall, Truth 8.0; report in `out/jury-r1.md`)
Applied in the jury's order. Every beat is still keyed with `at()`/`wend()`; the hits are placed by `place()` in heard voice gaps.

1. **≠ from the first frame (24.0 s).** SEALED ≠ HONEST now prints whole, ≠ at full opacity, on "can't" (24.00), so the plate never reads "SEALED HONEST". The slap at 25.42 is only a pulse on the ≠. It holds 2.3 s (readcheck) and peels at 26.34–26.46, before the test wipe (now 26.38–26.70, on "name,") reaches the middle of the frame (fix 8).
2. **End test order.** The REAL `lumenbank.example` bar appears first, as the test wipes in on "name,". The FAKE `lumembank.example` slides in under it on "fakes" (29.61). On the click they swing apart: real LEFT, fake RIGHT. That matches the pinned answer RIGHT and the word "fakes". One MADE-UP ADDRESSES tag (36 px) and RE-CREATED sit side by side as a pair centred under both cards.
3. **FTC strings.** They are unchanged in the one `FTC` block in `film.js`, and the BROWSER CONFIRMATION PENDING marker stays. The PC confirms the strings before posting.
4. **Sound.**
   - Every hit carries a 1–3 kHz paper layer (1.8 kHz and 2.6 kHz noise bands).
   - New pop (`pp`): the capsule's wax seal snaps on in the gap after "encryption." (13.25 s). The gap after "do." holds only 0.28 s of voice ring-out, so no gap-safe hit fits there. The seal itself is now keyed to the pop.
   - New slam (`sl`): LEFT/RIGHT lift and slam down in the gap after "fake?" (33.15 s).
   - The level against the voice is set with `duck.smr_db` (the SFX track is peak-normalised).
   - `osc()`/`band()` gains start at 0 (they had leaked a full-scale one-sample click).
5. **No empty stage under the 17.5 s wipe.** The FTC card and the hero plate are held until the shop wipe takes them off. The phone is hidden once the plate is up. The bank scene is built in full under the tear.
6. **The run.**
   - The shop opens at 0.8× and pushes to 1.0× over "sealed" → "honest" (a 1.25× push), anchored at the storefront's bottom-right so the final frame is the layout the label checks were built on.
   - The tube now comes in from off-frame. The capsule has a 330-unit body: about 465 px on screen during the run.
   - The shutter still slams on the 23.16 knock, and the cap-off shadow on the blind is bigger.
   - On the 8–13 s track the slip and capsule are at scale 1.0 (220 × 92 px). The sealed capsule rolls and seals in the open between the phone and the router.
7. **Hero plate.** A 20 % ghost of USUALLY SAFE sits on the plate from its rise; the real stamp inks over it on "usually". The phone no longer peeks over the plate.
9. **Hook.**
   - From 1.0 s frame 0's SAFE? flies into the end of a search bar while IS PUBLIC WIFI types in front of it, so the query IS PUBLIC WIFI SAFE? is complete by 1.85 s and SAFE? never leaves the screen.
   - Frame 0 gains a wordless danger cue: a paper periscope head peeking over the phone's top-right edge, its lens sweeping. It ducks behind the phone as the phone glides up and is back for the loop.
   - Frame 0 still has 3 words.
10. **End hold.** The end tear runs 34.27–34.42 (0.15 s). The clean LEFT/RIGHT card holds past 34.25; the last frame is frame 0.

Optional, done:
- A quiet floor (a darker torn band with faint drifting lines) fills y 1452–1920 in every scene, with no glyphs.
- The COPIED chip is gone; the copy card stays.

Line → picture changes: `now` = the sealed capsule rolls in the open and seals on the pop after "encryption."; `hero` = ghost stamp from the plate's rise; `check` = the real address first; `apple` = the fake slides in on "fakes"; `end` = real LEFT, fake RIGHT, the slam after "fake?".

## Jury r2 polish (r2: 7.4 overall, Truth 8.5, passed; report in `out/jury-r2.md`)
Applied in the coordinator's order. The FTC block and its BROWSER CONFIRMATION PENDING marker are unchanged; the PC confirms the strings before posting.

2. **The payoff letter is readable.** The LEFT/RIGHT cards are 400 px wide (centres x 300 and 720). The names `lumenbank` / `lumembank` run at 66 px mono (40 px tiles), with `.example` on a 36 px second line. Before the split, the stacked bars still show each address on one line at 62 px.
3. **The names are seeded.**
   - The green real site on the 8–13 s track has a LUMEN BANK sign (32 px).
   - The red fake shop's sign reads LUMEM BANK. Its last M hangs 12° off (0.21 rad) and sits low: a tell with the sound off.
   - FICTIONAL BANK moved onto the awning.
   - Both names are made-up, and the addresses stay `.example`.
4. **The hero run can be seen.**
   - The shop opens at 0.78× and pushes to 1.155× over "Your data arrives sealed" (20.14–21.14 s). The bank is then about 700 px wide and stays that size to "name,", easing to 1.145×. The push is anchored at the storefront's bottom-right, inside the safe box.
   - The trip quote drops to 42 px and the scope chip moves up to y 794 to make room.
   - The capsule run lasts 20.04–21.17 s, a 1.45 s eased run, on screen for over 1 s.
   - The window grows to fill the space between the sign and the door. Before the blind drops, it shows dark glass.
   - On the 23.16 knock the light comes on behind the blind. The capsule shows as a crisp silhouette: the body upright, the cap popping up and right in 0.16 s, the spiked seal flying to the top-left corner. Seal top to body foot is about 300 px at this zoom. Then the slip is pulled out.
5. **Sound.** The six hits are levelled against each other: GAIN pp .025, tw .0037, sh .0075, ne .016, ap .009, sl .024. `duck.smr_db` 27.4 puts them all at −18.5 to −18.7 dB RMS in the mix. Each sits 9.5–11.7 dB under the voice on RMS and 4.4–7.8 dB under it on peak, with Whisper word edges 0.18–0.32 s clear.
6. **The end card holds.**
   - The Apple quote now comes in just after "fakes" and peels right after the slam (33.23–33.43 s), so the clean LEFT/RIGHT card holds about 0.85 s before the tear at 34.27 s.
   - To keep readcheck, the Chrome quote comes in with the test wipe and leaves on "fakes".
7. **Frame 0 has stopping power.**
   - The periscope head is 1.6× (about 170 px), with a coral lens glint and a 3 px coral dashed sight line to the FREE_AIRPORT_WIFI row. The line fades as the glide hides the periscope (0.3–0.55 s) and is back on the end frame.
   - The warm accent is a wordless departures board over the window, with one coral flap that flips.
   - Frame 0 still has 3 words.
   - Coral is now used for the lens, the sight line and that flap too.
8. **No sliver at 14.2–14.5 s.** The track and the phone fade out as the hero plate completes (plate progress 0.45 → 0.9), so nothing shows in the gap between the FTC card and the plate.
9. **No static red stretch.**
   - The fake sign flickers once on "Right" (21.86).
   - The blind starts down on "the" (22.28) and is down by 22.83.
   - The scope chip nudges on "scammer".
   - The shutter slams on the knock (23.16), with the light and the silhouette right after.
