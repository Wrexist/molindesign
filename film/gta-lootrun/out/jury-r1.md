# Jury r1: gta-lootrun ("Four locks, one bag"), Delta

Judged: `/mnt/project-files/factory/gta-lootrun/gta-lootrun-vo.mp4` (30.77 s, 1080x1920, 30 fps). The repo copy `film/gta-lootrun/out/gta-lootrun-vo.mp4` has a different md5 but the same duration and streams (a remux), and the frames match.
Fresh jury that did not make the film. Frames pulled with ffmpeg at 0.0, 0.5, 1.0, 2.0, 2.5, 3.4, 6.3–9.2, 12.8–15.5, 20.5, 23.7–28.0 and 30.7 s. Every clip use was checked, along with the cut clip frames (`film/gta-lootrun/clips/*`, frames 1/25/34/37/40/50/62/64/75).

## Scores
| Criterion | Score | Why |
|---|---|---|
| Hook | 6.5 | Frame 0 has 4 words ("4 LOCKS. 1 BAG.") and moves (motion 0–1 s 0.61, 0–3 s 0.36). CASH stamps on at about 2.0 s, which is a weak payoff: there is no number and no real-game picture until 6.2 s. A drawn bag on dark stripes is not a strong still. The GTA 6 pill is about 40 px tall. |
| Retention | 7.0 | pacecheck OK, no frozen stretches, re-hook at 15.6 s ("Barely any cash"). Soft spots: 16.5–19.0 s (small drawn safe, little travel), 19.5–23.5 s (the shed holds almost the same frame for 4 s), 26.3–26.6 s (a tiny bag alone on an empty stage). |
| Clarity | 6.5 | The chain idea lands, but captions flash single words ("A" 7.0 s, "THE" 10.5 s, "IS" 11.5 s, "GTA" 26.5 s, "IS" 27.5 s) at about 60 px. This repeats LESSONS (captions break after the/a; per-word captions look like stock auto-captions), so −1. Lock 3 says "the PC gives you the safe code" over a safe keypad. |
| Truth | 8.5 | Amounts are framed as "he says" in both voice and picture. No code is readable anywhere. Small overstatements: "A player **found** the chain, a day after launch" / NOV 20 FOUND IT (we only know he posted then); "RARE SMG" is his claim with no "he says"; "GTA 6 loot is an escape room now" turns one location into a rule. |
| Motion and design craft | 6.0 | The bag-and-lock rail carries over well and the padlocks popping is a real native move. But the clips sit in an 833 px window (x 93–926), which repeats LESSONS 291 ("the hard 840 px box reads as a small window; bleed to the full frame"), so −1. The drawn props are about 520 px. The chip smears into an unreadable yellow band across the airboat clip at 23.6–23.8 s. The RARE SMG text overlaps its gun art. Safe zones are OK (right edge ≤ 926, nothing below y 1440). |
| Voice and sound | 7.0 | "GTA 6" is in the first words, 2.8–3.8 w/s, the Whisper in-context check is clean, −14.1 LUFS / −2.7 dBTP, SFX hits are present, there is no music bed (room tone at −44 dB), and blackdetect found no black frames. lock4 is a 17-word sentence (the voice tool warned). |
| Loop and ending | 7.0 | The last frame returns to frame 0 at full opacity and the locks snap shut, and "Could you solve it?" leads into "In GTA 6, one cash bag…". But the question is never on screen big: only a small "SOLVE IT?" pill (28.5–29.7 s). |
| Shareability | 6.0 | "Loot is an escape room" is a decent idea, but there is no money shot: the $10K–$30K is a small chip on a clip-art shed, and his real $30,000 counter or bag is never shown. |

**Overall 6.8** (54.5 / 8) · **Truth 8.5** · Verdict: **don't post** (FAIL; below 7.0). Fix and re-jury. Previous Delta passes: gta-99 7.4, gta-streampeak 7.06. This first cut is below both.

## SAFE-EDIT rule 10 checklist (creator clips, commentary mode)
| Check | Result |
|---|---|
| Each use < 5 s | PASS: boat 6.23–8.43 (2.2 s), keypad 12.73–15.55 (2.82 s across two adjacent uses), airboat 23.58–26.28 (2.7 s) |
| Muted | PASS: the clips are image sequences, and the audio is voice plus our SFX only |
| Creator clips ≤ a third, non-own ≤ half | PASS: 7.72 s / 30.77 s = 25 % |
| No creator credit on screen | PASS: no @diez.gg anywhere (credit is in the description per BRIEF §5) |
| Our voice makes a point about each clip | WEAK: boat and keypad are narrated as steps of his route (description, not a point). On the airboat, the voice talks about the SMG and selling the bag, and the clip shows neither. Most of the commentary point ("escape room") arrives only at 26.4 s. |
| No watermark/logo/tag | PASS: none on any used frame |
| Facecam and creator captions not visible | PASS: crop 1080:1110:0:810 removes them; there is no face or burned-in word captions in any used or cut frame |
| No code digits readable | PASS: keypad frozen at "----" (cut frame 37–40); clip frame 50 shows "00--" but is skipped (use 2a ends at src 1.2 s, use 2b starts at 2.07 s); safe-open frames show a tiny keypad with no digits; the sticky-note code is bars |
| Launch-week frame-0 hook (≤5 words, payoff by 2.0 s) | PASS on the letter (4 words; CASH by 2.0 s), but the payoff is weak; see fix 1 |

## Fixes, ranked by impact
1. **0.0–2.0 s, hook payoff (Hook, Share).** CASH by 2.0 s does not pay off "4 locks"; the stake is the money. Keep "4 LOCKS. 1 BAG." on frame 0. At 1.3–1.9 s, stamp "$10K–$30K · HE SAYS" at 90 px or more under the bag (y 1280–1400). Then the number is on screen by 2.0 s and its condition is in the same frame. Raise the GTA 6 pill to 64 px or more, or set "GTA 6" in the hook type, since it is the search phrase.
2. **6.2–8.4, 12.7–15.6 and 23.6–26.3 s, full-bleed footage (wow).** The 833 px clip windows read as small (LESSONS 291, repeated). Bleed every clip to the full 1080 width, about y 330–1440 (the crop is already 1080x1110), and keep the circle and labels on top. Wow move: add one 2.0 s clip at lock4 (about 20.5–22.5 s) of the shed bag or his $30,000 counter (source 51–53 s). Re-check that the crop hides any facecam or captions there. Creator share goes from 25 % to 31.6 %, still under a third. This is the shot people would send.
3. **Captions throughout (Clarity, LESSONS repeat).** Single-word flashes such as "A", "THE", "IS" and "GTA", at about 60 px. Use phrase cards of 2–4 words, at least 96 px, that break on phrase boundaries (BOAT OUT / TO A COMPOUND, LOCK ONE: / POWER ON). Highlight only the stressed word.
4. **Rule 10 commentary on each clip (risk).** At 23.6–26.3 s, the voice talks about the SMG and selling while the clip shows an airboat. Either cut to his SMG pickup (HUD "CRABSHACK VFS SMG" at source 54 s, if it is clean after the crop) or rewrite the line to the clip: "He's out by airboat with the bag, plus a rare SMG, he says." Put one opinion beat on the boat or keypad clip ("three puzzles for one safe", "this is a video game escape room"), so the clip is used to make a point and not to re-read his guide.
5. **Truth wording (Truth).** "A player found the chain, a day after launch" → "A player posted it a day after launch"; the calendar label FOUND IT → POSTED. RARE SMG → "RARE SMG · HE SAYS". "GTA 6 loot is an escape room now" → "This GTA 6 loot is an escape room".
6. **16.5–19.0 s and 19.5–23.5 s, soft holds (Retention).** The drawn safe and shed are about 520 px wide and nearly still. Scale the props to at least 800 px. Push the camera 1.0→1.15 over each hold. On "thirty grand", slide the bag out of the shed at least 250 px. Fill 26.3–26.6 s (a tiny bag alone): start the bag's scale-up 0.3 s earlier, so the stage is never just a 300 px bag.
7. **28.5–30.0 s, end question (Loop).** "COULD YOU SOLVE IT?" only appears as a small pill. Hold a 110 px question card for at least 1.2 s before the locks snap shut, then let frame 0 return.
8. **12.7–15.6 s, lock 3 picture (Clarity).** The voice says the PC gives the code, but the picture is the safe keypad. Before the keypad, show our PC screen printing "SAFE CODE: ████" for 0.6 s. The safe-open footage (14.6–15.5 s) is dark and the door swing is hard to read: lift its exposure about +15 % and zoom toward the door edge.
9. **23.6–23.8 s and 24–26 s, craft glitches.** The $10K–$30K chip's motion blur crosses the airboat clip as an unreadable yellow band, so move it above the card or cut the blur. The RARE SMG text overlaps the gun drawing, so give the text its own line under the gun.
10. **lock4 line (Voice).** 17 words in one sentence. Split it: "Lock four: a shed by the water. Inside, a bag worth ten to thirty grand, he says."

## Generic / AI-made look
- The diagonal-stripe dark-purple stage, top pills (GTA 6 / LOOT RUN), mono "· OUR DRAWING" tags and yellow stressed-word captions are now the Delta house template. They read as a template, not as this film's world.
- The power switch, safe and shed are flat clip-art boxes centred on a dark stage. The duffel bag with padlocks is the one prop with character; give it more of the frame.
