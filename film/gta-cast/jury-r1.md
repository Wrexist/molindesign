# Jury r1: gta-cast ("GTA 6: Who do you trust?")

Fresh-eyes jury, 2026-11-24. I did not make this film. Checked against `.claude/agents/video-jury.md`, the jury checklist in `delta/SAFE-EDIT.md` and the launch-week frame-0 rule in `delta/RUN.md`.

**Verdict: FAIL (don't post).** Overall **6.7**, below the 7.0 gate. Truth is **8.5**, which meets the 8.5 gate but has no margin.

## What I checked
- **Frames:** `out/check/sheet.jpg` and `hook.jpg`, plus my own ffmpeg grabs at 0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.4, 6.9, 10.2, 12.5, 14.0, 16.6, 17.4, 19.6, 20.4, 22.4, 24.5, 28.0 and 29.7 s.
- **Audio:** my own faster-whisper (small.en) transcription of the final mix (`gta-cast-vo.mp4`), and ebur128 (−14.0 LUFS integrated, −2.5 dBTP true peak, LRA 3.1).
- **Black frames:** blackdetect found none.
- **Pace:** `pace.txt` passes (motion 0–1 s 0.437, 0–3 s 0.738, no frozen stretches). The runtime is 29.8 s, inside 20–30 s.
- **Clip lint:** `clipkit.py lint gta-cast` passes. Rockstar footage is 43 %, creator clips 0 %, plates 23 % and real footage on screen 49 %. Each use is under 5 s, and the lint warns that 43 % is close to the 50 % cap.
- **Truth:** I fetched all 8 pages at `rockstargames.com/VI/only-in-leonida/<name>` with curl on 2026-11-24 (HTTP 200, server-rendered) and checked every quote below against them.

## SAFE-EDIT jury checklist
| Check | Result |
|---|---|
| Footage we don't own over 5 s unannotated | None. Every clip is under 2.1 s and sits in a labeled card (CLIP · ROCKSTAR · source). |
| Rumor stated as fact | None. Every line comes from Rockstar's own bio text. |
| Leak or ending shown | None. |
| Trailer or radio music audible | None heard. The clips are muted, and the mix is our voice plus the factory score and SFX. |
| Number without a source | None. The only numbers are the card numbers 1–8, which follow Rockstar's People menu order. |
| Rockstar logo or key art as branding | None seen. The Out Now plates avoid the logo, PS5 and PRE-LOAD ranges, and the Extended Look key art is not used. |
| **Frame-0 rule (RUN.md)** | **Partial fail.** Frame 0 is `WHO DO YOU TRUST?` (4 words) with a `GTA 6` chip, so it is readable with the sound off. But it is a text-only title card, and at 2.0 s the screen shows an unnamed face under a "?" tile. Jason's name and number do not land until about 3.1 s. **Hook is capped at 6.** |

## Truth audit (Rockstar's words vs the film)
| Card | Rockstar (verified by curl) | On screen | Voice | Judgment |
|---|---|---|---|---|
| Jason | "Jason wants an easy life, but things just keep getting harder." | "…JUST KEEP GETTING HARDER." | "Jason wants an easy life. It just gets harder." | Faithful. |
| Lucia | "Lucia's father taught her to fight as soon as she could walk." | "…TAUGHT HER TO FIGHT…" | "Lucia learned to fight as soon as she could walk." | Faithful. Dropping "her father" changes nothing about the claim. |
| Cal | "…Cal feels safest hanging at home, snooping on Coast Guard comms…" | "…COAST GUARD COMMS…" | "Cal snoops on the Coast Guard from home." | Faithful. |
| Boobie | "…Boobie's all smiles until it's time to talk business." | "…TALK BUSINESS." | "Boobie's all smiles, until it's business." | Faithful. |
| Dre'Quan | "Dre'Quan was always more of a hustler than a gangster." | "MORE OF A HUSTLER…" | "Dre'Quan's more hustler than gangster." | Faithful. |
| Real Dimez | "Bae-Luxe and Roxy aka Real Dimez have been friends since high school…" and the tagline "Viral videos. Viral hooks." | "…VIRAL HOOKS." | "Real Dimez: two friends, viral hooks." | Faithful. The duo is handled correctly in the voice ("two friends") and in the clip (two women). The film never says "8 faces" or "8 people", only cards 1–8. But the Dimez card's name bar says only REAL DIMEZ; BRIEF.md asked for `REAL DIMEZ · BAE-LUXE & ROXY`, and the names appear only as tiny fine print on the end ballot (fix 5). |
| Raul | "Confidence, charm, and cunning — Raul's a seasoned bank robber always on the hunt for talent ready to take the risks…" | "…HUNT FOR TALENT." | "Raul's a bank robber, hunting talent." | **Faithful.** "Hunting talent" is a fair compression of "always on the hunt for talent". Losing "seasoned" removes a detail but does not overstate or change the claim, and the card prints Rockstar's exact words. No deduction. |
| Brian | "…Brian's been around long enough to let others do his dirty work." | "…LET OTHERS DO HIS DIRTY WORK." | "And Brian? He lets others do his dirty work." | Faithful. |

The People menu order matches the cards. The spellings match Rockstar's (Dre'Quan, Real Dimez, Raul Bautista, Brian Heder). No role words Rockstar doesn't use appear ("protagonist", "villain" and so on). I could not independently confirm the faces in the Jason (Extended Look 182.65 s) and Lucia (209.1 s) ranges. Both look like the characters, but the director should note in BRIEF.md how the identity was checked.

**Truth deduction (−1, LESSONS repeat #306, "a quote left beside a new subject reads as a claim about it"):** at 20.0–20.6 s the Dimez caption `TWO FRIENDS, VIRAL HOOKS.` sits over Raul's card. Raul's face (holding a gun) and his quote `…HUNT FOR TALENT.` are already printed under it. At 17.4 s Dimez's card and quote are up while the voice is still finishing Dre'Quan.

Truth: 9.5 base − 1 = **8.5**.

## Scores
| Dimension | Score | Why |
|---|---|---|
| Hook | **5.5** | Capped at 6. Frame 0 is a text-only flap-board title card with no game image, which the jury rule caps by itself. The payoff (a named person) arrives at about 3.1 s, not by 2.0 s. The `GTA 6 CHARACTERS` chip BRIEF.md planned for 1.0 s is missing, so the main search phrase isn't on screen by 2 s. GTA 6 is spoken at 0.0 s, which is good. The voice has a dead gap from 1.95 to 3.1 s. |
| Retention | **6.5** | Something changes about every 1.5 s, and pace passes. But it is the same deal-card template eight times with no re-hook between Lucia and "And Brian?" (about 6–23 s). The middle reads as a list. |
| Clarity | **6.5** | The one idea (8 people, pick one) lands. But each face shares the screen with its name for only about 0.5 s: the clip plays under a "?" tile, then a clip-art icon replaces the face the moment the name lands. The end ballot shows icons, not faces, so the viewer votes on symbols. The quote strips are 2–4-word fragments. Quote strips print before their line (lesson #410 repeat, also scored under Craft). |
| Truth | **8.5** | Every quote is exact and every paraphrase is faithful (Raul included), with no role inflation. −1 for the caption over the next person's card (#306 repeat). |
| Motion and design craft | **6.5** | Clean, consistent and inside the safe zones; the type is bold and readable. The icons (vault, sunset boat, two phones, scanner) read as stock clip art next to real game footage. −1 for the LESSONS #410/#455 repeat: Boobie's `…TALK BUSINESS.` is printed at 12.5 s, before "business" at about 13.6 s, and Raul's quote prints during the Dimez line. |
| Voice and sound | **6.5** | The hook is in the first words, loudness is right and there's no music bed. My independent Whisper hears "**Dre wants** more hustler than gangster" (the director's in-context check heard "Dre 'Quan's"), so the name is not intelligible to a cold ear. The voice is silent for 1.15 s inside the first 3 s. |
| Loop and ending | **8.0** | "So who do you trust? Drop the number." leads back into the frame-0 board, and the last frame matches frame 0 visually. |
| Shareability | **6.0** | The "drop the number" vote drives comments, but there is no DM moment. The best one, Rockstar's line about Brian's "third wife, Lori", was left out, and the ballot of icons is not a screenshot anyone sends. |

**Overall: (5.5 + 6.5 + 6.5 + 8.5 + 6.5 + 6.5 + 8.0 + 6.0) / 8 = 6.75, scored 6.7** (the jury rule is never round up). For comparison, gta-heroes r2 scored 7.1. This catalog is the weaker of the two at r1.

## Fixes, ranked by impact
1. **Hook, 0.0–2.0 s (Hook cap).** Frame 0 is a text-only title card, and at 2.0 s the screen shows a nameless face under "?".
   - Put game footage on frame 0: run the dimmed Out Now street plate (18.0–18.9) behind the board from t = 0, or show the eight number tiles as tiny live clip thumbnails.
   - Keep `WHO DO YOU TRUST?` at 4 words.
   - Add the `GTA 6 CHARACTERS` chip at 1.0 s.
   - Lift the board at 1.2 s, deal card 1 at 1.3 s, and flip the tile to 1 and slam `JASON DUVAL` by **1.8 s**.
   - Move the `jason` voice line from 3.1 s to **2.1 s** to close the 1.15 s silence, and shift the later lines about 0.6–1.0 s earlier (the film may end near 29 s).
2. **Face and name together, every card (6–26 s).** Today the clip plays under "?" and is gone by the time the name lands.
   - Deal each card on its spoken name, so the tile flip and name bar hit while the clip is still playing. This needs no extra footage seconds.
   - Then hold the clip's last frame as a small inset of at least 260 px in the card's top-left corner while the icon plays. If the lint goes over 50 %, trim Jason (2.0 s) and Lucia (1.75 s) to 1.3 s each.
3. **Caption and quote timing, 12.5 / 17.4 / 20.0–20.6 s (LESSONS #306 and #410 repeats; Truth and Craft).**
   - Peel each top caption at least 0.15 s before the next card deals.
   - Print each quote strip on its key spoken word: Boobie on "business" (about 13.6 s), Raul on "talent", Dimez on "viral".
   - Never show Raul's face under the Dimez caption.
4. **End ballot, 27–29.5 s (Clarity and Shareability; this one is a wow fix).**
   - Make it a real lineup: eight face tiles, each from that person's own clip frame, at least 200 px each, with names at 36 px or more and the numbers at 48 px or more.
   - The Dimez tile reads `REAL DIMEZ · BAE-LUXE & ROXY`, in at least 28 px for the second part.
   - Fund the footage seconds from fix 2's trims and keep the lint at or under 50 %.
5. **Real Dimez card, 18.0–20.0 s (Truth hardening).** Add the subline `BAE-LUXE & ROXY` (at least 32 px, cream on ink) under `REAL DIMEZ`, as BRIEF.md requires. Right now only the 14 px ballot fine print names both.
6. **Dre'Quan pronunciation, 15.15 s.** A cold Whisper pass hears "Dre wants".
   - Respell it with `say` "Dray-kwon's" or "Druh-kwahn's", or put a 0.1 s gap before "more".
   - Re-run the listen check with a different model (small.en) as well as the in-context one.
7. **Wow: Brian card, 23.2–26.5 s.** It is the payoff, but it's a flat sunset icon.
   - Add Rockstar's own line as a fine-print sticker that pops on "dirty work": `"…WITH HIS THIRD WIFE, LORI"` (exact text, with "…" at the cut). It is true, it is the DM moment BRIEF.md offered, and it gives the strongest card a laugh.
   - Hold Brian's face inset at 1.1× while it lands.
8. **Quote strips everywhere.** Fragments like `…VIRAL HOOKS.` and `…TALK BUSINESS.` add little at about 40 px.
   - Use each person's full Rockstar tagline at 44 px or more instead ("Experience counts.", "Nothing better than a Mudslide at sunset.", "Only Raw... Records", "It's all about heart — the Jack of Hearts.").
   - Or cut the strip and grow the name bar.
9. **Middle re-hook, around 14–15 s.** Eight identical deals make the middle read as a list.
   - At card 4 or 5, add one text beat of 5 words or fewer (`HALFWAY. PICKED ONE YET?`) or a tile-rail pulse.
   - Change one card's entrance (a flip instead of a slide) to break the template.

## Generic or AI-made tells
- The icon set (vault dial, sunset boat, radio scanner, two phones with play buttons) is generic flat clip art that reads as template next to Rockstar footage.
- The flap board, the coral number tiles and the ink cards are well made and specific to this film. Keep them.
