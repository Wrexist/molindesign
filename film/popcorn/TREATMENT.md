# Pop: why popcorn explodes

A 36-second vertical (1080×1920) science clip for TikTok, Reels and Shorts, written in code like the other films here. One hard idea: **a kernel is a pressure cooker**, and we watch the pressure build until it can't.

## Voice first

The narration was recorded before any picture existed (`vo/script.json`, Chatterbox engine, see the `film-voiceover` skill §3b). Every visual beat, caption and sound effect reads its time from `vo/vo.js`, the word times Whisper heard in the final takes, so nothing can drift out of sync. Change a line and re-run `voiceover.py synth`, and the picture follows.

| Time | Words | Picture |
|---|---|---|
| 0.5 | "Popcorn doesn't crack open. **It explodes.**" | A kernel trembles; on *explodes* it pops (a preview), then rewinds. |
| 3.3 | "Every kernel is a tiny **pressure** cooker." | A pressure gauge appears on *pressure*. |
| 5.9 | "Inside, there's a little **water**. About **14%**." | The kernel is cut open; water drops appear on *water*; a 14% stamp lands on the number. |
| 9.3 | "Now **heat** it, and that water turns to **steam**." | Heat rises from below on *heat*; the drops boil into steam on *steam*. Thermometer climbs. |
| 12.1 | "But the shell is **tough**. The steam is **trapped**." | The hull outlines red on *tough*; steam knocks against the wall. |
| 15.0 | "The pressure **climbs**. **Nine** times the air around you." | The gauge sweeps on *climbs*; 9× stamps on *nine*; arrows push on the shell. |
| 18.1 | "At **180** degrees, the shell **gives** up." | 180°C; cracks run down the hull on *gives*. |
| 20.5 | (silence) | **POP.** The only quiet moment in the film; the music drops out for it. |
| 21.7 | "The steam rushes out, and the soft starch puffs up **40** times bigger." | The flake blooms; 40× and a dotted outline of the kernel it came from. |
| 25.9 | "That **pop** you hear? It's not the **shell**. It's the **steam** escaping." | Shell shard crossed out; steam with sound rings. |
| 29.9 | "And the ones that never pop? Their shell **leaked**." | An old maid rolls in and leaks steam. |
| 33.0 | "So every bowl is a few hundred **tiny** explosions." | 42 kernels pop in an accelerating cascade, then fold back into one kernel: frame 0, so it loops. |

## Rules it follows

- Captions sit in the upper third on the paper, highlight each word as it is spoken, and stay out of the TikTok UI zones (labels left of x≈930, above y≈1450).
- Drawn to look like the real thing: a glossy kernel with its germ and tip cap; cut open, its real anatomy (hull, glassy and floury starch, germ); water beads that boil into vapour bubbles while the starch turns glassy; the hull splitting, the starch foaming out into a lobed flake and the kernel jumping off a cast-iron pan.
- One palette: warm paper, ink, one red for pressure, blue only for water.
- The music is a light marimba groove kept under the voice (ducked from the word times, and the whole score a further 3 dB down). It stops for the pop and returns for the payoff.
- Sound effects are cut to the same word times as the picture: drips, sizzle, hiss, the gauge ticking, creaks, pops.

## Make it

```
cd film/tools
node render.mjs audio --film popcorn          # score + sfx → popcorn/out/mix.wav
node render.mjs video --film popcorn          # frames → popcorn/out/video.mp4
python voiceover.py mix ../popcorn/vo/script.json --score ../popcorn/out/mix.wav \
  --video ../popcorn/out/video.mp4 --out ../popcorn/out/pop-vo.mp4
```
