# Safe-edit rules for GTA 6 content

Sources: Rockstar's [video policy](https://support.rockstargames.com/articles/200153756/rockstar-games-video-policy), YouTube's [reused content policy](https://support.google.com/youtube/answer/1311392). Neither is a licence; Take-Two can remove any video. These rules lower the risk, they do not remove it.

## Always
1. Own voiceover carrying our own claim on at least 80% of the runtime.
2. Own graphics or own capture on at least half of the screen time.
3. A Rockstar trailer excerpt is under 5 s, annotated (freeze, zoom, arrow, label, split-screen), and used as evidence for a point. Never a whole trailer, never an unbroken stretch, never "just to show it".
4. No trailer or radio music. Our own sound only (the factory SFX). Trending sounds are added at upload on TikTok, quietly.
5. Anything Rockstar has not confirmed is labeled Rumor or Theory on screen, with the source.
6. "GTA 6" in the title and in the first spoken second.
7. **Trailer mode (Isac, 2026-11-03: "use pieces of trailers, animate other things yourself or extend things from the trailers, use everything interesting for viewers").** Rockstar's official trailers (1, 2, launch) are now a normal source, under rule 3: each excerpt muted, under 5 s, annotated, at most about half of the runtime in total (Isac 2026-11-12: "use GTA media, it's allowed"; was a third), and never the same clip in two different films (a filler remix of the same film may reuse its own clips). "Extending" a trailer shot means our own drawn graphics (map, diagram, reconstruction, what-is-just-off-frame) in our flat style, never realistic AI-generated game footage. That keeps Altered content = No. If a film ever uses realistic generated footage, it must be labeled FAN ANIMATION on screen and Altered content = Yes. Trailer files live outside the repo (the PC: delta/trailers/, not committed). Description closing line for films with trailer clips: "Trailer clips: Rockstar Games (Trailer N), used for commentary. Not affiliated with Rockstar Games or Take-Two." Start with 2 Shorts and check Studio for Content ID claims before making more. Tooling: skill `gta-clip-short` (`delta/clips/clipkit.py` refuses non-official sources and lints rules 3 and 7 on what the film really shows; source accounts in `delta/clips/OFFICIAL.json`).
8. **Own gameplay capture after launch (Nov 19)** is the main source from then on. Rockstar's video policy explicitly allows uploading gameplay, but frames it as non-commercial (no money made *through the footage*). A monetized channel earns from the commentary and edit, not the footage, so keep our own voice and graphics on every video (rules 1-2) and never post raw, uncommented gameplay. Rockstar removes leaks, endings, edited story compilations and isolated cinematics.
9. Spoiler videos (after launch): own capture, "SPOILERS" in the title and the first second, no unbroken story cutscenes, no ending, no edited cutscene compilations.

10. **Creator clips, commentary mode (Isac 2026-11-20, decision card "Commentary mode (short, credited)").** Another creator's GTA 6 clip may be used as footage only like this: each use under 5 s, muted, credited by @handle in the video description (Isac 2026-11-20: not on screen; `CLIP.credit` skips creator clips), our voice making a point about that exact clip (reaction, test, "is this real?", ranking), creator clips at most a third of the runtime and all non-own footage at most half. **Pick clean clips only (Isac 2026-11-20):** no watermark, logo or channel tag burned in. A clip with a watermark is skipped; never crop, blur or cover a watermark to hide where it came from. **Facecam (Isac 2026-11-20, later: "Just remove or block the facecam"):** a creator's facecam (or burned-in word captions) does not rule a clip out: crop it out of frame (`clipkit.py cut ... --crop W:H:X:Y`) or cover it with our own graphics, so no creator face shows in our video. Never AI fakes or real-world footage passed off as GTA 6: a suspected fake may only appear in a film that calls it fake. Tooling: `clipkit.py cut <key> --commentary --credit "@handle" --checked "<why it is real game footage and clean>"`, and `clipkit.py lint` enforces the caps. Remove the clip at once if the creator objects or a claim lands.

## Never
- Leaked footage or builds, however obtained.
- Other creators' clips outside rule 10 (not credited in the description, over 5 s, uncommented, watermarked, a facecam left visible, or more than a third of a video).
- In-game TV shows and comedy sets; mod menus, cheats or money exploits; unauthorized mods.
- Rockstar logo or key art used as our channel branding.
- The same video reuploaded, or the same clip across many videos.

## Jury checklist (added to the video-jury's scoring)
Fail the video ("don't post") if any of these is true: it contains footage we do not own that is longer than 5 s unannotated; a rumor is stated as fact; a leak or ending is shown; music from a trailer or radio is audible; a number has no source in BRIEF.md.

Hook rule (Isac 2026-11-18): frame 0 shows the question or the number in 5 words or fewer, readable with the sound off, and the answer or payoff is on screen by 2.0 s. Look at frames 0.0, 1.0 and 2.0 s. If either part fails, cap Hook at 6 and list the fix first.
