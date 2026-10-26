# QR code: why a torn QR code still scans

A vertical (1080×1920) explainer for TikTok, Reels and Shorts, written in code. Factory #9 on Tech, explained, How tech works part 4, after `film/memory/`. One hard idea: **part of every QR code is backup; at level H about 30% of its codewords can be rebuilt, but only if the three corner squares survive.** Facts and sources: `BRIEF.md`.

Built to the stats rules: no title card. Frame 0 is one huge paper QR code (830 px, cream paper and ink modules on the ink stage) with its bottom-right corner already torn off and the piece falling; five words on screen (TORN QR CODE / STILL SCANS.) plus the condition LEVEL H · CORNERS INTACT. The piece visibly falls by 0.3 s.

## The code is real, and the scan is tested

`qr/make_qr.py` (segno, ZXing-cpp, zbar) makes a real **version 3, level H** QR code for the text `TECH, EXPLAINED` and writes `qr.js`: the 29×29 matrix and the two tear polygons the film draws, module for module. It renders the torn paper exactly as the film shows it (torn-off paper shows the dark stage) and decodes it:

- **Hook tear** (bottom-right, 10.1 % of the symbol's modules, clear of the three corner squares, their separators, both format strips and the timing lines): decoded as `TECH, EXPLAINED` by **ZXing-cpp and zbar**, as drawn and at 50 %, 35 %, blurred, rotated 4°, −7° and 180°. The next bigger tear (`a=10 b=12`) fails some variants, so the film uses one with a step of margin.
- **Corner tear** (the `corners` shot: a bite through the top-left corner square): **neither decoder reads it**, alone or with the hook tear. A smaller nick (the bite edge 2 modules shallower) still decoded, so the film's tear goes through half of the square.
- The rendered film frame itself is decoded too (`out/check/scan-frame.txt`). Proof files: `out/check/qr-proof.json`, `qr-torn.png`, `qr-torn-corner.png`. Not tested on a phone camera (no phone in this container).
- Honest scale: the torn area is about 10 % of the symbol, not 30 %. A torn-off area reads as black modules, so half its modules are wrong, and Reed–Solomon's 30 % is codewords, not area. The film never says how much was torn.

## Benchmarks

- **Memory (`film/memory/`, jury 8.0)**: learn one object the whole way through (the name tag); the condition in big type in the number's frame; the torn-paper cut. Don't take its long chat scroll: here the object is the code itself, and every scene re-uses it.
- **Zack D. Films "How Pencil Sharpeners Work 🤔" (2.7M)**: learn one everyday object, one fact, one twist. Don't take the 3D-render look: flat paper here.

## Three structures we considered

1. **History first** ("In 1994, a car-parts maker…"). Rejected: a date with no stakes opens weak.
2. **The 30 % number first** ("You can rip 30 % off a QR code"). Rejected: false as worded (codewords, not area) and needs two conditions first.
3. **The torn code scans → how? → backup (CD math) → 30 % of bytes at level H → only if the corners survive → why corners → the rarest pattern → 1994 factories → most carry 15 % → which corner is empty?** (chosen): a contradiction the viewer sees, one turn (the corners), a DM-able story beat, and a question they answer with the code nearest them.

## The native move: the tear, and the rebuild

The paper code tears along a jagged edge; the torn piece falls. At `thirty` the missing modules ghost back in coral, codeword by codeword (8-module chunks), while a meter fills to ≈30 %. At `corners` the move runs in reverse: a second tear bites through the top-left square and nothing rebuilds (✕ NO SCAN). Scene changes are a torn paper edge rising from the bottom, the next scene drawn under it.

## Look

Flat, hand-built things on the ink stage: the paper QR code (ours, real), a generic drawn phone (round punch-hole, no logo, no real scanner UI) with viewfinder brackets, a paper CD with a scratch, a meter, paper props (flier, magazine page, box flap), a paper car-part tag with a grease smudge, a menu card, a parking sign and a ticket. Archivo for headlines, Geist Mono for readouts. One coral accent.

## Line → picture

| Line | Stressed word(s) | Picture |
|---|---|---|
| hook "This torn QR code still scans." | **torn**, **scans** | Frame 0: huge torn code, piece falling; a drawn phone slides up, brackets lock on the code, SCANNED ✓ chip snaps on "scans". TORN QR CODE. / STILL SCANS. + LEVEL H · CORNERS INTACT. |
| ask "So how does it read what's gone?" | **gone** | Push in on the tear; coral dashed outline of the missing area; ? stamp. |
| trick "Here's the trick: part of every code is backup." | **trick**, **backup** | Torn-edge cut; the code's modules split by colour: cream DATA, coral BACKUP; EVERY CODE stamp. |
| cd "That's Reed-Solomon math, the fix that music CDs use." | **Reed-Solomon**, **CDs** | A paper CD rolls in with a scratch; chip REED–SOLOMON, SAME FIX AS CDs; credit DENSO WAVE, QRCODE.COM; the backup modules flash with the scratch. |
| thirty "At its top level, up to 30% of its bytes can be rebuilt." | **top**, **30%**, **rebuilt** | Torn code back; missing modules ghost back in coral, chunk by chunk; meter to ≈30 %; LEVEL H, ≈30 % OF CODEWORDS (BYTES), L 7 · M 15 · Q 25 · H 30, DENSO WAVE · ISO/IEC 18004. |
| corners "But only if the three corner squares survive." | **only**, **corner squares** | A second tear bites the top-left square; brackets hunt; ✕ NO SCAN; ONLY IF THE CORNERS SURVIVE. |
| where "Those squares tell your camera where the code is." | **camera**, **where** | Clean code; the three squares light coral; brackets snap to them; a coral outline joins them. |
| up "With three, it knows which way is up." | **three**, **up** | The code turns 90°, 180°, 270°; a coral UP arrow stays locked to it; the empty corner gets a dashed circle, no label. |
| rare "Its inventors searched magazines and boxes for the rarest pattern." | **magazines**, **boxes**, **rarest** | Torn-edge cut; a magazine page and a box flap slap in with a ruler sweeping; then the corner square with its cross-section as bars 1 1 3 1 1; DENSO WAVE: FLIERS, MAGAZINES, BOXES. |
| factory "Built in 1994, for dirty car-parts factories." | **1994**, **dirty** | A paper car-part tag with a code and a grease smudge; 1994 stamp; DENSO WAVE, JAPAN. |
| most "But its maker says most codes carry less, about 15%." | **most**, **15%** | Menu card, parking sign, ticket, each with a code; LEVEL M ≈ 15 %; "MOST FREQUENTLY SELECTED" · DENSO WAVE. |
| end "Find a QR code. Which corner is empty?" | **empty** | Back to the torn code, its three squares coral, the fourth corner dashed; comment box "corner: __"; sources line; grows back into frame 0. |

## Rules it follows

- Every beat keyed with `at(id, word)`; sound effects in real gaps between words (`gapT` loops over the hit's whole body); short thumps next to speech; frame-0 hit quieter than the first word.
- No still frame near 5 s; no dead air after a payoff (stamps fill the beat); generic UI only; sources line under the captions, below y 300; boundscheck clean.

## Voice notes
- "Level H" was heard as "level age" by Whisper twice (solo and in the mix, WER 8 %): reworded to "At its top level" (the brief's fallback); the LEVEL H chip carries the letter.
- "It's Reed-Solomon" was heard as "Its … the fixed music": now "That's Reed-Solomon math, the fix that music CDs use."
- `where` reads at 3.81 w/s at the slowest fit (0.92); takes 1 and 2 were faster (4.08, 4.11), so take 0 stays. Whisper hears it word-perfect in the mix.

## Jury round 1 (7.2, Truth 8.0) → fixes applied
1. Frame 0 shows only TORN QR CODE. (3 words); STILL SCANS. and LEVEL H · CORNERS INTACT pop together on "still scans" and glide under the ask caption.
2. The greased car-part tag is tested: `qr/make_qr.py` draws the tag's code (4-module margin) with the film's exact smudge ellipses and requires ZXing **and** zbar across all seven variants. Full size 1.0 and 0.9 failed, 0.8 passed; the film uses 0.7 for margin (`QR.smudge`, `QR.tagok`), so the chip stays STILL SCANS. Proof: `out/check/qr-proof.json` → `greased_tag`, `qr-greased-tag.png`, and the rendered frames in `scan-frame.txt`.
3. The rebuild frame counts what this tear really cost, computed in film.js from `qr.js`'s codeword map: THIS TEAR: 11 OF 70 BYTES, SPARE USED: 6/11 + 5/11 (version 3-H: two blocks of 22 Reed–Solomon bytes, each fixes 11).
4. Levels row at 40 px, M 15% and H 30% in coral, above the code.
5. The end card is the clean code with three coral squares; no dashed circle anywhere (also gone from `up`). It tears only as it grows back into frame 0.
7. `most`: "…carry less, about fifteen percent." (comma): no 1 s hole.
8. `thirty` starts 0.1 s earlier at speed 1.0 (was squeezed to 1.10); later lines moved 0.3 s.
9. The phone's screen is a viewfinder (the code through the glass, brackets) and shows SCANNED ✓ / TECH, EXPLAINED on the screen.
10. Ticket code moved and shrunk: ADMIT ONE reads whole.
11. `where`: the code slides in tilted and the camera finds it; `up`: quarter turn, half turn, a flip over (paper back), upright.

## Jury round 2 (8.0, Truth 9.0: post) → polish applied
1. The phone's viewfinder shows the whole torn code (all three squares) inside its brackets; SCANNED ✓ at 40 px, TECH, EXPLAINED at 36 px.
2. On "So" the code drops 200 px as it pushes in, so STILL SCANS. / LEVEL H · CORNERS INTACT sit above the paper, never on its squares.
3. The readout says HALF THE SPARE USED (44 px; 11 of 22 correctable, 6/11 + 5/11 kept for the pinned comment). The levels row and its credit fade when THIS TEAR arrives; the levels row now pays off in `most`, above LEVEL M ≈ 15%.
4. Ticket code at w/2 − 66, 116 px: ADMIT ONE whole.
6. End card: a slow push 1.00 → 1.06, and the "corner: __" box drops in on "Which". The box is a prompt, so it is left out of the dwell check.
