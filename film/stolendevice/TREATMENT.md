# Treatment: stolendevice (Factory #43)

"They watched you type your passcode." A thief who has seen your passcode can do more than unlock the phone. Stolen Device Protection changes that, but only if it was turned on before the theft.

## Benchmarks

| | Learn | Don't take |
|---|---|---|
| `film/publicwifi/` (#42) | A scope plate readable by 0.8 s; one prop per claim; hits keyed to words, about −19 dB RMS. | Navy text on a navy plate, props under 160 px, and empty stage under the wipes (all flagged by jury r1/r2). |
| `film/nextword/` (pilot) | Captions highlight one word at a time; scenes change with the caret wipe; the loop is seamless. | The title card at frame 0. Most viewers leave at 0:01 on a dark, text-heavy opener. |

## Three structures

1. **Countdown.** A big 1:00:00 timer runs the whole film. Rejected: Apple's delay is not a fixed countdown. It is scan, then one hour, then a second scan, so a running timer would misstate it.
2. **Two phones side by side**, protection OFF on one and ON on the other, for the whole film. Rejected: each half of a split frame is too small at phone size, and props would drop under 160 px.
3. **One key, many locks (chosen).** The passcode becomes a flat paper key. With the setting off it turns every lock (saved passwords, then your Apple Account). With the setting on, the lock's keyhole turns into a face/fingerprint scan, and the key bounces off. Then come the exceptions (Apple Pay still takes the passcode) and the check path.

## Native move

The paper key in a tumbler. It turns when the setting is off and refuses when it is on. The film's whole argument is the same key behaving differently.

## Line → picture

| Line | Picture |
|---|---|
| They watched you type your passcode. | Frame 0: a phone on a café table, the pad typing itself under a coral sight-ring, and PASSCODE SEEN. PASSCODE flies into the search bar (THIEF KNOWS MY IPHONE PASSCODE, complete by 1.3 s), and SEEN becomes a coral tag on the sight line. |
| Then they took your iPhone. | The camera pans 1080 px and the phone slides off the table by itself. A 2 SECONDS LATER card appears. |
| Can a thief with your passcode lock you out? | The WITH STOLEN DEVICE PROTECTION OFF plate peels in at the top. The YOUR APPLE ACCOUNT lock pops a "?". |
| With one setting off, it opens your saved passwords. | The key is born from the pad dots and turns the SAVED PASSWORDS lock. Password cards spill out. |
| It can even change your Apple Account password. | The key turns the Apple Account lock and the password field rewrites. A YOU tag greys and drops off. |
| But not with Stolen Device Protection on. | Paper ground change. A big switch flips to ON, version card iOS 17.3 · JAN 2024. |
| Away from home or work, those need your face or fingerprint. | A map card with a dashed HOME / WORK circle, plus AWAY FROM FAMILIAR LOCATIONS (Apple). The keyhole morphs into a scan glyph and the key bounces off. FACE ID OR TOUCH ID and NO PASSCODE FALLBACK chips. |
| Changing that password takes a scan, an hour, another scan. | Hero padlock (740 × 380): SCAN, an hour dial, SCAN AGAIN, each printed on its word. The 1 HOUR stamp slams down (coral). |
| That hour lets you mark it as lost. | Laptop map with a pin drop, a +1 HOUR card, a clock, and a LOST chip landing on the phone. |
| Apple Pay still takes your passcode, though. | The APPLE PAY lock opens to the key, with Apple's sentence quoted in full (A8). |
| Check yours: Settings, Face ID and Passcode. | Re-created Settings screen: rows print on their words, OR TOUCH ID & PASSCODE chip, passcode dots, and the switch turns on. MIGHT BE ON BY DEFAULT (Apple). |
| It must be on before the theft. Is yours? | YES / NO chips. The end card is frame 0 again, so the loop cuts clean. |

## Truth notes

- Every exact Apple string is in the `APPLE` block at the top of `film.js`, sourced to BRIEF §3a. Our own labels are in `OURS`.
- No people, no crime figures and nothing from the WSJ on screen. Coral appears only on the sight-ring (and its dashed sight line) and the 1 HOUR stamp; SEEN is highlighter yellow.

## Jury r1 fixes (7.375, Truth 8.5)

1. **Sound.**
   - The hits were re-levelled to about −16 dB on rmsgate's sliding 50 ms RMS, which is about −19 dB on the jury's 50 ms meter (the two meters read about 3 dB apart). `duck.smr_db` went back to 33 so the hit-to-voice ratio scales linearly again.
   - 1 HOUR now inks on its own knock in the breath after "hour,", instead of 1.8 s late.
   - New hits:
     - the tumbler clack when the key is refused,
     - the shackle lifting,
     - LOST slamming onto the phone (replacing the pin),
     - the Settings switch at about 33.4 s,
     - a slap when YES is tapped at about 36.0 s.

     The tightest gaps are placed against the heard voice (`placeV`), not the padded word edges.
2. **Away scope.** AWAY FROM FAMILIAR LOCATIONS · APPLE (44 px) prints under the switch on "on.", then rides up onto the map card.
3. **Closing row.**
   - MIGHT BE ON / BY DEFAULT · APPLE is its own 46 px chip at y 1336, from "Check yours:".
   - MUST BE ON / BEFORE IT'S STOLEN · APPLE (A9, in the APPLE block) takes its place on "It must…" and pulses on "before".
4. **End card.**
   - YES / NO and MUST hold on the frame-0 end card for about 1 s, lift off 0.3 s before the loop, and leave about 0.2 s of clean frame 0.
   - YES / NO sit at x 632 / 828, clear of the cup, which moved up-left on both ends.
   - The end card keeps frame 0's two filled dots.
5. **The native move, mirrored.** The keychain lock is now 380 px with a 200 px keyhole. The same 360 px PASSCODE key drives in on "work,", the tumbler refuses it (two-frame shake, clack) and the key rebounds 120 px. The keyhole then turns into the face/fingerprint scan on "face". This is the mirror of 9.5 s, where the key turned.
6. **Poster.** "A thief knows your passcode? / Away from home, they still need your face." with the FACE ID OR TOUCH ID chip.
7. **Chips.** FACE ID OR TOUCH ID and NO PASSCODE FALLBACK start above the keychain lock, then stack under the hero lock (y 1292 / 1366) before it settles, and leave before "scan,". The map card peels off before the hero lock grows.
8. **25–28 s.** A 520 px laptop drops its pin on "mark". The 150 px LOST tag rises out of it, hangs over a bigger phone on "lost." and slams down on the hit. The small clock is gone.
9. **Caption.** It is forced to two lines, "Can a thief with your passcode / lock you out?", with the type shrinking to fit rather than orphaning "out?". It now clears the plate by more than 24 px.
10. **Quote card and version card.** The Apple quote card has no RE-CREATED tag; the tag sits under the pay-scene phone instead. The version card is on the paper from the moment the wipe opens (about 13.3 s).

**Also fixed:**
- The paper roll in the wipes is the outgoing act's paper, not a slate strip.
- The Settings screen opens on a big turning gear that drops into row 1 on "Settings,".
- The hero lock and stamp drift slightly so the hero holds never freeze.

## Jury r2 polish (7.69, Truth 9.0)

1. **Plate spacing.** The OFF plate is now WITH STOLEN DEVICE PROTECTION plus a separate OFF chip, with 24 px clear of the label. The chip lights on "off," and stays lit; before that it only looked lit because of a sin(π) ≈ 1e-16 bug. On the ON plate the label slides 22 px left, so "ON" clears both the label and the toggle by more than 20 px (film and poster).
2. **The refused key, mirroring 9.5 s.** The lock and key grow 1.15× for the beat. The key drives in on "work,", sits four frames while the tumbler tries, the lock flinches ±6 px for two frames on the clack, and the key kicks back 160 px with a 10° twist and settles over 0.25 s. Meanwhile the keyhole irises into the scan glyph, landing on "face". The keychain labels moved to the right of the lock.
3. **Switch.** It starts at 760 × 320, about 1.5× the old one, and grows 1 % per second. The knob flips from "on." and lands on the click at 15.85 s.
4. **Sound.**
   - The st knock is at 22.70 s (0.24 s before the next voice onset).
   - The yn slap is at 36.12 s, and YES dips to 0.92 and springs back over four frames on it.
   - `duck.smr_db` 25.6 → 26.1 lowers every hit 0.5 dB, so each sits at least 3 dB under the voice on the jury's meter (50 ms windows stepped every 5 ms, voice = median where voice-only is within 25 dB of its peak).
5. **Poster.** "A thief knows your passcode? / Away from home or work, they still need your face."
6. **Map card.** HOME / WORK sits inside the dashed circle, and the AWAY chip now rides onto the top edge of the map card, so they no longer overlap.
7. **Settings switch.** Its ON track fills with #F2D27A.
8. **Chip rename.** "2 SECONDS LATER" is now "PHONE GONE". The voice is unchanged, and the key already carries PASSCODE as "it opens" plays.
9. **Frame-0 tension.** Four paper drag marks trail the phone toward the lower right, as if it is being slid away; there are no people and no extra words. They fade as the phone settles, and the end card keeps them, so the loop matches.
10. **Apple Pay.** The tap waves pulse twice and the lock pops 1.1× on "passcode,".
