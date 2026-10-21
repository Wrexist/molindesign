# Halden LF‑1: “Held” (treatment)

A 34‑second launch film for the made‑up Halden LF‑1 field camera, written entirely in code: picture, motion, score and sound design. One page draws any frame for any time `t`; the same page plays it live as a website and renders it to MP4.

## Benchmark

- **Night‑mode launch films** (phone makers' “shot in the dark” spots): learn the one‑claim‑per‑shot rhythm and letting the dark sit on screen before lifting it. Don't take: their scenes, the hands‑holding‑phone shot, any type or music.
- **Long‑exposure seascape photography** (silk water, lighthouse sweeps, star points): learn what a long shutter does to water vs. stars, and use that as an explanation, not decoration. Don't take: any specific photograph or composition.

## Three structures considered

1. **Dusk to dawn**, one night in five chapters. Rejected: it's what the showcase page already does, and it's the cliché of every night camera.
2. **A spec list that turns**: each spec gets a shot, the last spec is the price. Rejected: a list, not a story; nothing changes.
3. **Time is the subject (chosen).** The shutter is the storyteller. We start at 1/8000 s where the world is frozen, slow the shutter until time runs, let the light run out, then lift the night with ISO and finish on a fifteen‑second exposure where water turns to silk but the stars stay points. The camera is only revealed at the end, through the point of light it captured. It changes from “a camera stops time” to “a camera gathers time”.

## Logline and arc

A camera that can freeze a raindrop can also hold fifteen seconds of night. Setup: frozen rain (control). Turn: the shutter opens up and the light runs out (loss). Ending: a long exposure where the darkness becomes the picture, and the one star collapses into the shutter button we press.

**Native move:** the 9‑blade aperture iris is the only transition grammar. It snaps open on the first click, closes to end the day, and closes onto the brightest star at the peak so the star becomes the shutter button (match cut).

**Ending echoes the opening:** an orange dot breathes in black, a shutter click, the iris. First time it opens; last time it closes.

## Shot list (120 BPM, 1 bar = 2 s, 17 bars = 34 s)

| # | Time | Shot | Framing / camera | Why |
|---|---|---|---|---|
| 1 | 0.0–1.0 | Black. Orange dot breathes, tick on beat 2. | Locked, centre | Hook: a held breath, the shutter button before we know it is one. |
| 2 | 1.0–6.0 | Iris snaps open on a shutter click: rain frozen mid‑air, backlit by a street lamp. | Slow push‑in, focus pull near → far | 1/8000 s, shown not told. “Light moves fast.” |
| 3 | 6.0–10.0 | Shutter ticker rolls 1/8000 → 1/15 on the beats; the same drops stretch into streaks, rain sound arrives with them. | Locked, slight drift | The exposure length is the visual: streak = velocity × time. “Or let it run.” |
| 4 | 10.0–11.5 | Iris closes to black. Near silence. | Locked | The breath. “Then the light runs out.” |
| 5 | 11.5–18.0 | ISO rolls 50 → 12 800 (11.5–15.0); a night coast lifts out of the black: rocks, sea glints, a lighthouse sweeping. | Continuous lateral truck (never stops, so no freeze before the exposure) | Sensitivity shown as exposure lifting. “ISO 12 800. Hand‑held.” |
| 6 | 18.0–24.0 | 15‑second exposure: a ring timer sweeps, the sea smooths to silk, the beam paints a fan, stars stay points. Silence before the peak; the iris closes onto the brightest star. | Crane / tilt up to the sky, then iris‑in | Signature shot. “Fifteen seconds.” |
| 7 | 24.0–26.0 | The star turns orange and is the shutter button; pull back as the LF‑1 draws itself in line. | Pull‑back reveal | Match cut: what it captured is how you capture. |
| 8 | 26.0–34.0 | The shaded body draws itself in, a light sweep crosses it, specs as one read, then the end card. Final click, the iris closes onto the shutter button and the orange dot is left breathing, then fades. | Locked, lens rings turn | “Halden LF‑1. See in the dark.” Price and origin. Bookend. |

## Cue map

- Bars 1: room tone only. Shutter click lands on t = 1.0 (beat 3) and is the first real sound.
- Bars 2–3: frozen world: a suspended glass chord, soft pulse starts at 2.0, no rain.
- Bars 4–5: ticker clicks on every beat 6.0–8.0; rain fades in with streak length; plucked arpeggio enters.
- Bar 6: silence 10.2–11.4 except room tone and the iris blades at 10.0; the sea fades in under the black (J‑cut).
- Bars 7–9: sub swell and sea; ISO clicks 12.0–15.0; lighthouse hum on each beam pass; pad returns in a lower voicing.
- Bars 10–12: 6–10 kHz air rises through the exposure; bell motif at 19.0 and 21.0; the whole mix (reverb included) ducks 22.66–23.15; iris swish 23.2.
- Bar 13: the shutter‑button press at 24.0 is the first sound after the silence; the sea tail runs over the cut (L‑cut).
- Bars 14–17: resolve to D major‑ish colour; spec ticks at 26.0 / 26.5 / 27.0; final shutter at 33.0; master fades 33.5–33.95, no hard cut.

## Sound design table

| Section | Bed | Foley | Music |
|---|---|---|---|
| Hook | room tone | tick, shutter click | none |
| Frozen | room tone, very high glass air | — | glass chord, soft pulse |
| Streak | rain (grows) | ticker clicks | pulse + pluck arp |
| Breath | room tone | iris blades | out |
| Night | sea swell, low wind | ISO clicks, lighthouse hum | low pad, bass |
| Long exposure | sea → smooth wash | iris swish | shimmer, bell motif |
| Match cut | sea tail (L‑cut) | button press | pad hits |
| Product / end | room tone | spec ticks, final shutter | resolve chord, tail |

## Type and titles

Archivo at 125 % width for display, Instrument Serif italic for one line per beat of feeling, Geist Mono for every number. Masked word reveals, readouts as rolling digits. One accent, signal orange `#ff4d1f`, reserved for the dot / shutter button and nothing else. Ink `#0d0d0c`, paper `#ece8df`. No voice‑over in this cut: the text and the readouts carry it, and every line is held at least letters ÷ 15 + 1.5 s (checked by `tools/readcheck.mjs`).

Banned (high‑end minimal): shockwave rings, particle bursts, RGB split, camera shake, lens flares, neon glow, grid floors, bouncy easing.
