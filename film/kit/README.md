# Motion kit

Shared animation pieces for every code-rendered film: the factory Shorts, the long-form stickman episodes and the GTA Shorts. One file, `kit.js`, defines `window.KIT`. Everything in it is a pure function of time, so it works with `render(t)`, motion blur and the parallel renderer without changes. Nothing assumes 9:16 or 16:9.

**See it:** `film/motionkit/` is a 40 s reel with every piece on screen once (`out/motion-kit-reel.mp4`, `out/sheet.jpg`). Each scene's top chip names the pieces it uses, so you can ask for one by name ("the freeze frame from the reel").

```html
<script src="../kit/kit.js"></script>
<script src="film.js"></script>
```

## What's in it

| Group | Call | Pieces |
|---|---|---|
| Rig | `KIT.guy(g, x, y, s, P, o, t)` | Hoodie stickman (`o.style` default) or classic line stickman (`o.style: 'stick'`). IK arms and legs, line boil at 8 fps, squash (`P.sq`), whole-body spin (`P.spin`), hops (`P.jump`), shoulders up (`P.shr`). Eyes: dot wide tiny happy shut x spiral heart star. Mouths: smile grin o O frown wavy talk flat scream teeth. Hats: cap beanie crown. |
| Moves | `KIT.actor(g, x, y, s, name, u, o, t)` | walk run panic sneak jump wave point present shrug facepalm think confused celebrate dance takeback mindblown fall dizzy (+ idle). Each comes with its own emote; `o.emote: false` turns it off. `KIT.ACT[name].pose(u)` gives the bare pose to change. |
| Emotes | `KIT.emote(g, type, x, y, sc, u, t)` | `!` `?` sweat anger heart bulb sparkle stars zzz notes dots |
| Effects | `KIT.speedLines` `streaks` `burst` `impact` `dust` `confetti` `scribble` `arrow` `marker` `flash` `freezeFX` | Focus lines, motion streaks, comic burst with a word, hit rings, landing dust, confetti, hand-drawn circle and arrow, highlighter, white flash, freeze-frame grade |
| Camera | `KIT.shake` `punch` `snap` `applyCam` | Seeded decaying shake, zoom punch, snap zoom that holds, a camera transform for any of them |
| Transitions | `KIT.tr(g, type, k, W, H, prev, next, o)` | iris (circle, star or heart), whip, bars, splat, zoom, slam, spin |
| Text | `KIT.slam` `popWords` `typeOn` `wobble` `stretch` `counter` `caption` `sticker` `chip` | All in sticker type: thick ink outline and drop shadow, so it reads on any background. `'*word'` marks a stressed word (yellow, bigger, it keeps wiggling). |
| Sound | `KIT.score(ac, EV, DUR)` | whoosh swish pop boing thud slam ding scratch tick key squeak sparkle splat zip ratchet rise shutter cheer. Synthesised, so there are no samples to license. No music: Isac adds the platform sound. |
| Timeline | `KIT.film({ W, H, scenes })` | Scenes with `dur`, `draw(g, t, u)` and `tr` / `trDur` / `trOpt`; it joins them with transitions centred on each cut and does the motion-blur blend. |

## Hooks for the first three seconds
From the stats so far, viewers leave at 0:01 when the first frame is a still title card. Each recipe below starts with something already moving on frame 0, puts at most five words on screen and lands its hit before 1 s.

1. **Run-in + slam** (reel 0:00): `actor('run')` crossing on `speedLines` and `streaks`, a skid with `dust`, then `slam` the first word at 0.12 s and `popWords` the payoff with a `burst`, `punch`, `shake` and `flash` on the stressed word. The figure does a `takeback` at the words. Sounds: whoosh, slam, squeak, boing.
2. **Freeze frame** (reel 0:03): play the action, then hold `u` while the clock keeps going. `freezeFX`, letterbox bars, a slow push and `popWords(['yep.', "that's", '*me.'])`, with scratch + shutter sounds. Stop the line boil too: pass the frozen time as `t`.
3. **Zoom punch + circle** (reel 0:06): `toScreen` finds the prop in the hand; `applyCam` snaps to it in 0.2 s, `scribble` circles the detail, then the camera snaps back to a reaction move (`panic`).
4. **Number roll + head pop** (reel 0:10): `counter` up to a huge number with `ratchet` ticks, landing on the same frame as `mindblown`'s BOOM, with a `flash`, `shake` and gold `speedLines`.

## Rules that keep it from looking templated
- Offset the phases: two figures doing the same move should never be in sync (`o.seed`, start times).
- One hit per stressed word, not per word. Bursts, shakes and flashes are spice: at most one every 2–3 s.
- Keep the figure moving: every move breathes and boils, and the backgrounds drift (`bg` stripes in the reel).
- Body space is fixed: feet at y 0, hips −150, head centre about −328. `s = 1` is about 384 px tall.
- Reduced motion does not apply to a rendered MP4. The live player (`index.html`) never autoplays.
