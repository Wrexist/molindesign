# Four locks, one bag (GTA 6, Delta, commentary mode)

Slug `gta-lootrun` · made 2026-11-20 in the thread "Make Delta videos from TikTok link" (Isac sent https://vm.tiktok.com/ZN8m2kHB4/) · channel **Delta** (never Tech, explained). American English, Ming US_James seed 7, no AI tag, no music. GTA 6 launched **November 19, 2026**.

## 1. One hard idea
GTA 6 loot works like an escape room: one cash bag sits behind a chain of four locks (power → PC password → safe code → shed code). We show the chain as our own graphic, a row of four padlocks that pop open one by one, with the creator's footage as proof at three links. The commentary point is ours ("loot is an escape room now"), not a re-read of his guide. We do **not** say the codes out loud or on screen (curiosity, and it keeps it from being a copy of his guide).

## 2. Source and footage (SAFE-EDIT rule 10, commentary mode)
- Source: TikTok by **@diez.gg**, "INSANE LOOT RUN ON GTA6, TO GET 100K IN CASH", posted 2026-11-20, 62 s, 1080x1920 (`clipkit.py fetch`, key `tiktok-7710193743843921185`, verdict THIRD_PARTY → cut with `--commentary`).
- Clean check: no watermark, logo or channel tag burned in. The creator's facecam (top third, 0–15 s) and his word captions (y 680–795) are **cropped out** with `--crop 1080:1110:0:810` (Isac 2026-11-20: "just remove or block the facecam"). Real game footage: continuous third-person play with the GTA VI HUD, Leonida water and swamp; nothing real-world or AI-looking seen on the contact sheets.
- Clips cut (muted, each annotated; `airboat` 56.0–58.5 is cut but not used): `boat` 11.5–14.0, `keypad` 35.4–37.9 (ENTER CODE → keypad → safe opens), `bag` 51.0–53.0 (the bag on his shoulder), `smg` 53.6–55.6 (CRABSHACK VF5 SMG pickup label).
- Uses in the film (r2, as shipped to jury r2): boat 2.07 s, keypad ×2 (1.81 s frozen before any digit + 1.50 s safe opening), bag 1.19 s, smg 1.97 s = about 8.5 s of 34.1 s, 25 % (cap: a third). r3 adds a darkened, blurred boat still behind the frame-0 bag (1.6 s, plus 0.45 s at the loop seam); `out/clips-used.json` holds the exact totals.
- Credit: description only ("Gameplay clips: @diez.gg on TikTok, used for commentary."), never on screen.

## 3. Facts
All from the creator's own narration (faster-whisper small, 2026-11-20) and what his footage shows. He is the only source, so amounts are said as "he says".
| # | Fact | Line | Source |
|---|---|---|---|
| 1 | One cash bag at the end of a chain: boat to a compound, turn the power on at the back of the main building, PC password found in the bedroom, PC gives the safe code, inside the safe another code that opens a shed by the water. | hook, lock1–lock4, twist | @diez.gg narration 14.6–47.3 s; footage 11–49 s |
| 2 | Safe holds "a little bit of cash", "nothing compared to" the shed. | twist | narration 35.4–41.9 s |
| 3 | The shed bag is worth "anywhere from 10 to 30K"; his run showed $30,000. | lock4 | narration 47.3–52.7 s; his on-screen counter 51–53 s |
| 4 | A "super rare SMG" in the shed. | smg | narration 52.7–55.8 s (HUD shows "CRABSHACK VFS SMG" at 54 s) |
| 5 | The bag is taken to Brian to get paid. | smg ("sell the bag") | narration 55.8–58 s |
| 6 | Posted 2026-11-20, a day after the Nov 19 launch. | found | TikTok upload date (yt-dlp); launch date: Rockstar launch trailer post x.com/RockstarGames/status/2110717537964953810 |

Not claimed: his "$100K" total (includes a separate warehouse run), the codes, that it is the best money method.

## 4. Visual plan (director decides details)
Frame 0: the four padlocks in a row with **4 LOCKS. 1 BAG.** big, GTA 6 pill, moving. Each lock line pops its padlock with a stamp on the stressed word. Clips sit inside a card with a pink annotation (circle on the boat, the keypad, the airboat) and our lock counter beside them. Lock 2: our drawn bedroom wall with a blurred scrawl + PC login box with dots. Twist: safe door swings, a tiny cash stack + a sticky note with a blurred code. Lock 4: shed door + duffel bag with "$10K–$30K · HE SAYS". End: escape-room door with all four locks open, question card.

## 5. Description closing line
Gameplay clips: @diez.gg on TikTok, used for commentary. Made with our own graphics. Not affiliated with Rockstar Games or Take-Two.

## Log
- 2026-11-20: brief, script and clips by the thread session.
- 2026-11-20: jury r1 6.8 (FAIL, Truth 8.5) → r2: full-bleed clips, bag + SMG clips, stake on screen by 2 s, 96 px phrase captions, our take line (puzzle box), truth wording (posted, he says), bigger props, end question card.
- 2026-11-20: jury r2 7.0 PASS (Truth 8.5) → r3: blurred game still behind the frame-0 bag; "found" line and calendar cut (chip POSTED A DAY AFTER LAUNCH on the boat clip); SMG ring and bag circle track their targets, lock counter steps off every clip; 3 LOCKS, 1 SAFE (voice: "Three locks for one safe"); shed snaps in on a door hit with a water slosh before it; SOLVE IT? card about 2.1 s; twist reworded to his "a little bit of cash" at speed 1.0. Fix 4 (full relayout) skipped by the coordinator.
