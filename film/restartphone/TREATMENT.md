# Treatment · Should you restart your phone every week?

Factory #39 (`restartphone`), the director's plan. Script and sources: `BRIEF.md`, `vo/script.json` (Ming US_James, seed 7, no music, no AI tag). The engine, gates and sound come from `../trackeralert/` (#38, r2 7.6 / Truth 9.0): `CLIP_RUN`, `LABELS_RUN`, the safe box, the peel and slap patterns, the torn-paper roll, captions keyed to the frame time, the SFX gate from `vo/heard.js`, the loop seam at t = 1/60. The look is this film's own: a dim paper week planner is the wallpaper, and a giant cream paper power button with a coral ring is the thread from frame 0 to the end card.

## Two benchmarks
- **Learn from `trackeralert` (#38, r2 7.6 / Truth 9.0).** A twist that is a picture, not a sentence: there the trail kept drawing past the switch; here the spyware bug crawls back on after the second restart. Setup lines get chips only, the hero stamp inks on its key word and peels before the next caption, and the pause after the twist is planned so the stamp can be big. **Don't take:** its tag, trail, map wallpaper, banner, backpack or street.
- **Learn from `wifibattery` (#37, r2 7.6 / Truth 9.0).** The hook follows the source's strength ("The NSA says", its own words), one maker's credit only on its own card, every prop paid off, and the hero over 700 px at frame 0. **Don't take:** its Control Center button, hills, moon or the paper hand.

## Three structures
1. **The power cycle, three times (chosen).** One generic phone, one paper bug, one paper crack in the screen. Restart 1 wipes the bug off (the promise). Restart 2 runs the same move and the bug crawls back in through the crack (Kaspersky's "may be reinfected"). Restart 3 shows the crack is still there. Then a paper patch closes the crack (the update). The NSA sheet bookends it: page 1 for the advice, the page 2 chart for "sometimes", page 1 again for the answer.
2. **The week calendar.** Seven day cards flip, one restart a week. Clear, but the "sometimes" twist has nowhere to show on screen.
3. **Two phones side by side** (restarted vs updated). Fair, but it locks one layout for 35 s and makes the hero small.

## The native move: the power cycle
The phone's screen collapses to a coral line, goes black, the small power glyph's coral ring sweeps 360° on the black screen, and the screen blooms back. The same move runs on "wipe it out" (bug torn off), on "reinfected" (bug crawls back) and on "doesn't close the hole" (the crack stays).

## Layouts
- **A (0–9.9 s), the button and the sheet.** Frame 0: the 712 px power button glides up into place, its coral ring already sweeping, RESTART WEEKLY? above it (2 words). An NSA chip lands on "NSA". On "every week" seven day tabs pop round the ring and the search bar (RE-CREATED) types the question. On "guide" the NSA sheet (page 1, OCT 2020 · REV 1.1, the real footer) slides in; the POWER bullet prints on "power".
- **Change 1 at `why` (9.9–15.9 s): inside the phone.** A torn-paper wipe to a big generic phone with a paper bug on its screen and a small crack in the corner. JUNE 2023 · KASPERSKY card, the "…DOES NOT SUPPORT PERSISTENCE…" plate. The first power cycle wipes the bug; CAN chip.
- **Change 2 at `twist` (15.9–19.5 s): the chart.** The NSA's page 2 chart: practices are the columns, threats the rows. The TURN DEVICE OFF & ON WEEKLY column lights; its two cells (SPEARPHISHING, ZERO-CLICK EXPLOITS) are empty slots until "sometimes", when the half-disc marks print and SOMETIMES / PREVENTS stamps (the one coral stamp).
- **The return (19.5–29 s).** Back to the phone. Restart 2: the bug crawls back through the crack ("…MAY BE REINFECTED AFTER REBOOTING."). Restart 3: THE WAY IN label beside the crack, the crack stays. Then UPDATE and the paper patch slaps over the crack; Apple's iOS 16.5.1 card (its only appearance).
- **C (29–35 s).** The NSA sheet again, both bullets printed (updates, power). Then a re-created Samsung settings screen: Settings › Device care › Auto optimization › Auto restart › Restart on schedule, ending on a chevron (no switch drawn ON or OFF).
- **End.** Back to frame 0's button, THIS WEEK?, YES / NO; they shrink away and the button glides to its frame-0 place.

## Rules for this film
- Frame 0 ≤ 4 words (RESTART WEEKLY?), no UI, the hero 712 px.
- Coral only on the button's ring, the power-cycle line and the one SOMETIMES / PREVENTS stamp. YES / NO are cream.
- The NSA strings live in one constant block in `film.js` (`NSA`), verified against the PDF on 2026-11-22.
- "Can", never "stops hackers". No STOPS HACKERS, PROTECTS YOUR PHONE or NSA-APPROVED anywhere.
- Kaspersky is one 2023 iPhone case: ONE 2023 iPHONE CASE on its card. The bug is a cut-paper beetle, no skull, no people.
- Apple's credit only on the iOS 16.5.1 card; Samsung's only on its settings screen. Generic phones, no logos.
- Re-created UI (search bar, Samsung settings) is tagged RE-CREATED.
- Chips print on or after their word; the chart's marks print on "sometimes".

## Line → picture
| Line | Picture |
|---|---|
| hook "The NSA says restart weekly." | Frame 0: the giant power button glides up, ring sweeping, RESTART WEEKLY? above. NSA chip on "NSA"; the ring flashes round on "weekly". A tick in the gap. |
| ask "So should you restart your phone every week?" | The button eases down and shrinks; the search bar types SHOULD I RESTART MY PHONE EVERY WEEK? (RE-CREATED); on "every" seven day tabs pop round the ring, one per word. |
| quote "Their guide says: power the device off and on weekly." | A torn wipe to the NSA sheet: MOBILE DEVICE BEST PRACTICES, NSA, the real footer and OCT 2020. The SOFTWARE UPDATES and POWER headings; on "power" the POWER bullet prints and is underlined. |
| why "Why? Some spyware can't survive a restart." | A torn wipe into the phone: the paper bug wobbling on the screen, the crack in the corner. JUNE 2023 · KASPERSKY on "spyware"; the quote plate on "survive". |
| wipe "So a reboot can wipe it out." | CAN on "can"; power cycle 1 on "wipe": the screen collapses to a coral line, the bug tears off and falls, the ring sweeps, the screen blooms clean. A rip in the gap. |
| twist "But the NSA's own chart says: sometimes." | A torn wipe to the chart, its column lit, two empty slots. On "sometimes" the marks print and SOMETIMES / PREVENTS stamps; NSA CHART; a slap in the pause punches it. It peels as "In" starts. |
| dip "In 2023, Kaspersky said phones may get reinfected." | Back to the phone, clean. Power cycle 2 on "Kaspersky"; after the bloom the bug crawls back in through the crack on "reinfected". Quote plate "…MAY BE REINFECTED AFTER REBOOTING." |
| hole "A restart doesn't close the hole." | Push to the crack; THE WAY IN beside it on "hole"; power cycle 3, the crack stays. |
| update "An update can. Apple fixed one that June." | UPDATE chip on "update", the paper patch slaps over the crack on "can" and the bug is shut out. Apple's card on "Apple": iOS 16.5.1 · JUNE 21, 2023 (date on "June"). A pop in the gap. |
| answer "So update it, and restart weekly." | A torn wipe to the NSA sheet: on "update" the updates bullet prints, on "restart" the power bullet lights; ✓ marks on each. |
| samsung "Samsung Galaxy phones can restart on a schedule." | A torn wipe to the re-created Samsung settings screen; rows print one by one, RESTART ON SCHEDULE lights on "schedule", chevron, fine print MENU NAMES… MAY VARY · SAMSUNG US SUPPORT. |
| end "Did you restart this week? Yes or no." | A wipe back to frame 0's button: THIS WEEK?, YES / NO (cream, 112 px). They shrink away and the button glides to its frame-0 place within 0.25 s of "no". |

## Jury r1 fixes (round 1: 6.9 overall, Truth 8.0)

Applied in the coordinator's order; every time is keyed with `at()`/`wend()` to the r1 voice (dur 35.13 s).

1. **Stamp vs "In 2023," (18.30–18.45).** The stamp peels over dip+.12→dip+.26; the "sometimes." caption is held to dip+.3 and "In 2023," only fades in after that (`capStart`). The stamp and the next caption never share a frame.
2. **Truth, Kaspersky scope.** Line now reads "In 2023, Kaspersky said those iPhones may get reinfected." (say: "In twenty twenty-three, …"). The scope label under the Kaspersky card is two cream lines at 46 px, ONE iPHONE SPYWARE / CASE · 2023. The dip caption is split [2],[2,2],[3] so no card wraps onto the Kaspersky card.
3. **Truth, empty cells.** Chart cells are truly empty until the half marks print; the dashed placeholder circles are gone. Legend: "DOES NOT PREVENT (NO ICON)" with no glyph, then the half mark with "SOMETIMES PREVENTS", then the full disc with "ALMOST ALWAYS PREVENTS", each on its own row at 36 px.
4. **Frame 0.** A paper bug sits on the power button at frame 0 (hero still more than 700 px wide, still two words plus "?"); the progress ring flicks it off at "weekly" + .15 s (~1.9 s) and it drops out of frame. On the end card the bug crawls back onto the button, so the loop seam matches.
5. **Hook re-roll.** "The N S A says restart weekly." with no comma; solo Whisper WER 0.
6. **Lower third, 14.3–16.4.** The chart moved down and grew (y 470–1120); a dashed stamp outline waits at the slot (410, 1278) from the scene's start, and the stamp prints into it on "sometimes".
7. **Sound.** The twist hit is a thump keyed to the stamp's punch at K.TW; at gain .08 it measured 2.4 dB LOUDER than the voice, so it ships at .018 (4.8 dB under, gate ok); a slap is keyed to the patch landing on the phone (K.PT = "can." end + .3).
8. **Stamp.** No hyphen: SOMETIMES on one line, PREVENTS under it, with an "NSA CHART" chip (46 px) beside it. Readcheck time comes from a twist pause of 1.6 s in the script (measured silence 1.21 s, under the 1.3 s cap), with the stamp landing at "sometimes" − .12.
9. **NSA sheet, 5.5–7.3.** The sheet body is the real content: the POWER heading and the quote "POWER THE DEVICE OFF AND ON WEEKLY." with a highlighter run keyed to power/off/weekly. The search bar's RE-CREATED tag fades out before the sheet's tag arrives, so only one tag shows per frame.
10. **Answer, 27.2–29.5.** The Kaspersky card peels on "So"; only two ticks remain: UPDATE ✓ and RESTART WEEKLY ✓ with an NSA chip.

Also: the NSA CHART chip moved to (822, 1168) so it clears the stamp, and the answer's RESTART WEEKLY card was widened so its tick does not touch the text.

## Jury r2 polish (round 2: 7.6 overall, Truth 9.0, posts)

Timings and peels only; no re-voice, so vo.js and heard.js are unchanged.

1. **Stamp on "sometimes".** The first ink, the half marks and the slot outline's hand-off now key to `at('twist','sometimes.')` (16.28 s) instead of 0.12 s before it. The punch at K.TW (17.16 s) and its thump are where they were. To keep SOMETIMES / PREVENTS readable for 2.1 s, its peel moved to dip+.26 → dip+.40, the back scene's tear to dip+.31 (scene t0 dip+.66), and "In 2023," to dip+.44. The stamp and the next caption still never share a frame.
2. **Apple card peels on "So".** It peels the same way the Kaspersky card does (K.ans − .1 → + .16), so the takeaway holds only UPDATE ✓ and RESTART WEEKLY ✓ · NSA. To stay readable before it goes, the card arrives on "update" (not "Apple"), its date arrives with it (not on "June"), and the credit line is shortened to CREDIT: KASPERSKY.
3. **Captions clear at a tear.** A caption card now fades out by tear start + .06 s whenever a scene's tear starts during it (generic rule in `captions()`), so "So update it…" is gone before the Samsung screen and "can restart on a schedule." is gone before the end card.
4. **YES / NO on "this".** The chips print over `at('end','this')` − .16 → + .02 (about 32.9 s), not at the end card's tear.
5. **Bug at the ring's edge.** `bugOnBtn` now puts the bug on the ring (x + .6r, y + .56r), clear of the power glyph, on frame 0 and on the end card alike, so the seam still matches.
6. **Freeze the polish made, and its fix.** With the Apple card and its date arriving on "update", 25.77–26.97 s froze for 1.2 s (pacecheck FAIL). On "fixed" a highlighter now runs under FIXED: ONE KERNEL FLAW, and on "June" the date chip pulses. pacecheck is OK again.
7. **"hole" / "whole".** The final mix's listen check heard "close the whole" (same audio that earlier passed as "hole"). The two words sound the same, so `film/tools/voiceover.py` SAME now maps whole → hole, the way it already maps their → there. All 12 lines are at WER 0. The caption on screen says "hole".
