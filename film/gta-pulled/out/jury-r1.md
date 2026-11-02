# Jury r1 · gta-pulled (Delta, pillar 7)

Judged: `out/gta-pulled-vo.mp4` (29.8 s, 1080x1920, -14.1 LUFS, true peak -2.6 dBFS, no black frames). Frames pulled every 1 s plus 0.0 / 0.5 / 1.0 / 1.5 / 2.5 / last; transcript from faster-whisper base.en matches script.json word for word.

| Criterion | Score | Why |
|---|---|---|
| Hook | 7.0 | 2 words on frame 0 (PULLED, GTA), hook spoken in 7 words. But the shelf on frame 0 is **full**: the empty slot is hidden behind the tag, so sound-off it reads "PULLED" over a stocked shelf. GTA tile is small (~45 px cap). |
| Retention | 6.5 | 29.8 s is right. Dead stretches: 3.5–6.5 s (case + 2005 drifting), 12.3–15.0 s (M tile close-up barely moves), 24.5–27.3 s (NOV 19 page alone in an empty frame), 27.5–29.5 s (static vote). |
| Clarity | 7.5 | One clean story. But M is never explained (wide audience doesn't know M = Mature 17+), "Hot Coffee", the name everyone searches, never appears, and the end question muddles the cause (see Truth). |
| Truth | 8.0 | Every spoken line matches BRIEF.md sources (ESRB July 20 2005, AP/CNN on Walmart/Target/Best Buy, FTC/Game Developer on the new version, 8-K for Nov 19). Docked: the closing question "Should a mod change a game's rating?" presupposes that the mod changed the rating. ESRB says the opposite: it re-rated because the content was "in a fully rendered, unmodified form on the final discs". The film's own "found" line says so, and the last line contradicts it. |
| Motion/design craft | 7.0 | The paper props read as hand-made, and the ghost shelf with falling cases (18 s) is the best shot. Props are small (case ≈ 25 % of width at 3–6 s, box ≈ 40 %), y 0–300 and the desk band are empty, and the source chips are about 30 px cap (thin on a phone). NOV 19 page sits high with nothing under it (LESSONS gta-songs r2 repeat: card scenes leave y 1000–1430 empty). |
| Voice/sound | 7.0 | Hook in the first word, 3.3 w/s, no music bed. The hero AO stamp in the pause after "Only." peaks at -12.7 dBFS, ~10 dB under the voice, so the one hero sound is weak (LESSONS gta-songs r2 / gta-lucia r2 repeat). |
| Loop/ending | 7.5 | The PULLED shelf comes back in the last frames, so the picture loops. The last line ("…rating?") does not lead into "Walmart once pulled…". |
| Shareability | 6.5 | Nothing you would send a friend. AO over M is a decent poster, but without "Hot Coffee" or a number (Take-Two's forecast cut, $205M → $160M) there's no punch. |

**Overall 7.1 · Truth 8.0 · Verdict: don't post** (Truth < 8.5. Fix 1 alone is cheap and lifts Truth. Then re-jury.)

SAFE-EDIT checklist: no footage we don't own, no rumor, no leak, no trailer or radio music. Every number (2005, July 20, Nov 19) is in BRIEF.md. Pass.

## Fixes ranked by impact
1. **27.5–29.5 s, Truth/Clarity.** Change the question to one the sources support: "Should hidden content change a game's rating?" (card: SHOULD HIDDEN CONTENT CHANGE A RATING?), with YES / NO identical as now. This removes the false premise that the mod changed the rating.
2. **0.0–1.5 s, Hook.** Make the pull visible on frame 0. Move the PULLED tag above the shelf and show a real gap of 2–3 missing cases under the GTA label, the slot ≥ 220 px wide. Have the last GTA case slide out at 0.4–0.9 s so frame 0 shows the conflict while it happens.
3. **12.0–16.9 s, Sound/wow.** Make the AO slap the hero. Raise the stamp to about -5 dBFS peak (3 dB under the voice, lower `duck.smr_db` as gta-lucia r2), add a 6-frame 1.06 punch-in and paper-dust specks on impact. Speak or chip "M = MATURE 17+" on the M knock so a non-gamer knows what was lost.
4. **6.8–11.2 s, Clarity/Share.** Name it. Put a chip `FANS CALLED IT "HOT COFFEE"` on the key tag, or replace FAN-MADE MOD with `"HOT COFFEE" MOD`. It's the search phrase and the meme people share.
5. **3.5–6.5 s and 24.5–27.3 s, Retention/fill.** Scale the case to ≥ 60 % width and give the 2005 tile a flip-in. Put the question card under the NOV 19 page at 25.6 s (not 27.3 s), or add a second change (a GTA 6 case sliding onto the restocked shelf) so nothing holds for more than 1.2 s.
6. **Wow, 17.2–20.4 s.** Add Take-Two's cost on the emptied shelf: a receipt tag "FORECAST $205M → $160M" (fact #4, Game Developer). It's one hard number to share. Optional: end on the restocked shelf with the GTA 6 case in the gap, so the last frame flows into frame 0's empty slot.

Also: source chips up to ≥ 40 px cap. Nothing reads as AI-template; the risk is the empty purple field around small props, which still looks like a dashboard.
