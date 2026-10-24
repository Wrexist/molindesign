# Treatment · "Cut" (What if every undersea internet cable was cut?)

**Format:** the long-form Tech, explained episode. It's 16:9 and about five minutes long, made for YouTube. It uses a stickman cast, second person ("you text a friend in London"), and an escalating clock (second, minute, hour, day, week, month) slammed on screen as a yellow time card that then parks in the top-left corner. The voice is Ming US_James. Captions are burned in, with stressed words in yellow, and an SRT goes up for YouTube CC. There is no music; the foley is cut to the word times.

**Benchmark:** the "What if…" stickman channels (Jeremy Bearimy). From them we take the second person, escalating consequences, one recurring character, constant small motion and a big readable number per beat. We don't take their character design, a voice nobody discloses, or invented consequences presented as fact. Every number here is sourced (BRIEF.md), the real events are told as real, and the scenario is worded as a scenario.

**Hook (0–6 s):** no title card. Frame 0 is already in motion: you on the couch, typing "Landed yet?" to Sam in London. The send fires a dot of light out the window, London wipes in, and the message lands in under a second. The title card comes only after the snap (about 0:28).

**Signature shot:** the dive. The message is a pulse of light. The camera follows it out of the phone, down the wall, through a conduit, under the beach and two miles down to the Atlantic floor, then rides it along the cable.

**Native move:** the snap. Five cables at five depths break one after another on "snaps", "All", "them" and "same", and all the light dies on "second".

**The cast:** one rig (`guy()` in film.js) dressed per role:
- you: coral hoodie
- Sam in London: green hoodie and cap
- family abroad: bun and glasses
- a tourist: sun hat
- a trader: tie and glasses
- the repair crew: hard hats and hi-vis
- an islander

The rig's arms and legs are 2-bone IK to hand and foot targets. Poses are keyframed with `poseAt(t, [[t, partial pose]])`. The line boils at 8 fps (a small seeded jitter on every joint). It blinks every 3.7 s, breathes and sways, so nobody is ever frozen.

**Structure:** 30 scenes, each starting on its first line and arriving by an ink-and-yellow wipe or an iris. Every scene also has a slow push. YouTube chapters come from `FILM.CHAPTERS`.

**Checks:** a contact sheet each second, strips around the dive and the snap, readcheck on the time cards, the Whisper listen check in context, loudness at −14 LUFS and a blackdetect pass.
