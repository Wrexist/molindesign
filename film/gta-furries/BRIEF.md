# GTA 6 made furries illegal (Delta, "It has X, shown", commentary mode)

Slug `gta-furries` · backlog row 74 · researched 2026-11-25 (day 6 after launch) by the run orchestrator (Delta GTA extra runs) · channel **Delta** (YouTube Shorts @deltaisac). American English, Ming US_James seed 7, **no music**, no AI tag. Footage: three creator clips in commentary mode (SAFE-EDIT rule 10, @nerpah, facecam cropped) + official Rockstar plates behind our cards (rule 11). VIDEO-PLAN §3 format 5 ("It has X, shown"). Launch-week rules: frame 0 ≤ 5 words, payoff by 2.0 s, 20–30 s, binary pinned question.

News check at run start (2026-11-25 ~10:20 UTC): no new official Take-Two/Rockstar number since gta-daysales/gta-preorders, so no news Short.

## 0. Packaging score: 5/6
| Mark | | Why |
|---|---|---|
| Mine | 1 | Every player can meet this event in Leonida. |
| Myth or threat | 1 | A whole state law against furries: absurd, shareable, true in-game. |
| Frame-0 test | 1 | `FURRIES ARE ILLEGAL` + `GTA 6` chip: 3 words, readable muted. |
| Takeaway | 1 | Do the event: the reward choice (gun or $15,000). |
| Title | 1 | "GTA 6 Made Furries Illegal 🦊" |
| Searched | 0 | "gta 6 furry" was a launch-week news topic (Dexerto, PinkNews, EarlyGame); not a big search now. |

## 1. One hard idea
**Leonida bans furries on TV, then the game lets you break a police blockade to save them, and they pay you.** One picture: the reward prompt `GUN / CASH ($15,000)` over the furry in the driver's seat.

## 2. Facts (all read 2026-11-25)
| # | Fact | Line | Source |
|---|---|---|---|
| F1 | In-game TV ad paid for by the "Anti-Furry Association": **"Furry activity of any kind is illegal in the state of Leonida, and all citizens are required to report any suspicious activity."** It lists the phrases "uwu", "rawr xD", "hewwo". | hook, ad | PinkNews, Jasmine Walter, Nov 19 2026: https://www.thepinknews.com/2026/11/19/gta-6-furry-law/ ; Dexerto, Zackerie Fairfax, Nov 18 2026: https://www.dexerto.com/gta/gta-6-outlaws-furries-and-lets-you-help-them-escape-the-cops-3429724/ ; EarlyGame, Ivan Shahran, Nov 19 2026: https://earlygame.com/news/gaming/gta-6-makes-being-a-furry-illegal |
| F2 | In-game Vice City Horn headline "Governor declares Leonida furry-free" (optional chip). | (optional) | Dexerto (screenshot), EarlyGame |
| F3 | CNET reviewer David Lumb, playing Lucia at night, saw a police helicopter light up a man in a fox suit; he broke through the police blockade, freed him, the man met other furries and they escaped to a compound. GQ's reviewer met a fursuited character under a helicopter spotlight. | fox, free | Dexerto and PinkNews (both cite Lumb's CNET review); Dexerto (GQ) |
| F4 | @nerpah's run (TikTok, posted 2026-11-19, 1080×1920): Lucia meets "Chase" (fox suit) and a second furry at a white van in a parking lot (src 1.2–4.2 s, subtitle "Good job not getting shot, Chase. Who's the human?"); the hideout garage with a gun wall (42.0–45.0, subtitle "Thanks for keeping the cops busy"); in the van, the prompt **GUN / CASH ($15,000)** (56.0–59.0). | free, wall, pay | https://www.tiktok.com/@nerpah/video/7710008941240962335 (frames checked 2026-11-25) |
| F5 | GTA VI released November 19, 2026. | present tense | https://www.rockstargames.com/VI |

**Said carefully:** the reward is only "in this player's run" (no article states it); "hideout" = the garage in F4 (Dexerto/PinkNews: "compound"); "you help the furries escape" = Lumb's account (F3). **Never claimed:** that you can wear a fursuit (Dexerto: unconfirmed); the "hunters may shoot on sight" line (true per PinkNews/EarlyGame but dark, not used); the "Furverts" group; how often the event appears.

## 3. Script (8 lines; scriptlint OK)
| id | at | Line | Tension |
|---|---|---|---|
| hook | 0.12 | In GTA 6, being a furry is illegal. ("G T A six") | 5 |
| ad | 2.4 | An in-game TV ad says: report any furry activity. | 4 |
| dip | 5.6 | So what happens when the cops find one? | 2 (dip) |
| fox | 8.0 | Reviewers met a guy in a fox suit, under a police helicopter. | 4 |
| free | 11.6 | Break the blockade, and you help the furries escape. | 4 |
| wall | 14.6 | Their hideout? A whole wall of guns. | 5 |
| pay | 17.4 | In this player's run, the thank-you: a gun, or fifteen thousand dollars. | 5 |
| end | 22.4 | Gun or cash? Which one are you taking? | 5 |

Pinned question: **"Gun or $15,000: which one are you taking?"**

## 4. Footage plan
**Creator clips (rule 10; cut, muted, `film/gta-furries/clips.json`, credit @nerpah in the description only, never on screen):** source `fur` = tiktok-7710008941240962335. The top half of the TikTok is nerpah's facecam plus burned-in captions: cropped out with `1080:1040:0:880` (gameplay pane only; no watermark or logo there). Note: `restore` in a fresh container re-fetches at 576p by default; fetch the 1080p format by id first (`yt-dlp -f bytevc1_1080p_857135-0`) or the crop fails.
| Clip | Src range | Shows | Beat |
|---|---|---|---|
| van | 1.2–4.2 | Lucia walks up to the white van; fox and a second furry by the open door | free |
| arsenal | 42.0–45.0 | hideout garage, gun wall behind the fox | wall |
| choice | 56.0–59.0 | the furry in the driver's seat, prompt GUN / CASH ($15,000) top right | pay (hero) |
Avoid src 4.5–7.0 and 34.5–35.5 (profanity in the game's subtitles). Creator share 9.0 s of ≈26.5 s = 34 %: at the cap, so don't hold any clip longer; if the film runs shorter, trim each clip.

**Official plates (rule 11, dimmed ≥ 35 %, each < 5 s, unused ranges only, check every film/*/clips.json):** night Vice City / police beats from Trailer 1 (twitter-1731998653743517697), Trailer 2 (twitter-1919733318217576448), Launch Trailer (twitter-2110704990339678208), Out Now spot (lib-20261110-grand-theft-auto-vi-out-now-off) or An Extended Look (generic-v4-rk721912…, src.mp4 must be re-fetched). Under hook/ad/dip/fox only; never under the creator clips.

**Our graphics:** an old CRT TV set (flat, hand-built) playing our re-created PSA card: `ANTI-FURRY ASSOCIATION` header, the F1 quote excerpt, three "report if you hear" chips `UWU · RAWR XD · HEWWO`, tag `RE-CREATED · IN-GAME TV AD`; a police helicopter silhouette with a spotlight cone sweeping onto a flat fox-ear silhouette (ours) for "fox"; a blockade of flat barrier stripes that snaps apart on "Break"; the reward prompt card enlarged and ringed on the choice clip; end vote `GUN / $15,000` (neither highlighted), looping into frame 0.

## 5. Packaging (for video-seo)
Title "GTA 6 Made Furries Illegal 🦊". Description sources: F1, F3, F4 URLs. Clip credit: "Gameplay clips: @nerpah (TikTok), used for commentary." Closing: "Background clips: Rockstar Games trailers, used for commentary. Not affiliated with Rockstar Games or Take-Two."

## 6. Log
- 2026-11-25 research (orchestrator): topic from the unused cached @nerpah clip; facts from Dexerto/PinkNews/EarlyGame; 1080p re-fetched; three clips cut avoiding profane subtitles.
- 2026-11-25 director: set = Leonida night broadcast (hand-built CRT TV playing our re-created Anti-Furry Association PSA, police light bar, helicopter searchlight on our fox-suit mascot, sawhorse blockade that snaps on "Break", roll-up garage door, paw-sealed thank-you envelope, police tape floor). Frame 0 `FURRIES` / `ARE ILLEGAL` + `GTA 6` chip over the TV (slash slams at 0.15 s), ad card on screen at 1.34 s. Voice re-laid (hook ran 0.4 s long): ad 2.8, dip 6.15, fox 8.6, free 12.2, wall 15.2, pay 17.55, end 22.2, dur 25.55 (seam silence 1.2 s); pay text now "…a gun, or $15,000." with `say` "fifteen thousand dollars" (Whisper wrote $15,000). Creator clips trimmed to van 2.75 s (src 1.4–4.0), arsenal 2.4 s (42.3–44.7), choice 2.75 s (56.22–57.62, freeze on the prompt); the garage door breaks the van→hideout run (lint: unbroken footage ≤ 5 s). Plates (rule 11): Trailer 1 25.30–26.90 (hook, night highway) + 24.95–25.30 (seam, same shot, so the loop is continuous), Out Now 13.50–14.70 (ad), Trailer 2 45.60–48.00 (dip, police car), Trailer 1 45.48–46.47 (fox, aerial night). Lint: creator 31 %, all footage 31 %, plates 50 %, real picture 80 %. Checks: boundscheck ok, readcheck ok, pacecheck OK (0–3 s motion 1.59), in-mix Whisper all lines WER 0, −13.9 LUFS (voice-only −14.9), no black.
- 2026-11-25 director r1 fixes (jury 7.5 / Truth 8.5): fox line → "Reviewers met a furry, under a police helicopter.", free line → "Break the blockade, and you can help them escape.", pay "thank-you" → "reward" (new Ming takes, 24.05 s); own sounds on the TV knock-off, helicopter rotor, garage door rattle (both ways), envelope, $15,000 knock, till ka-ching after the pay line and the loop drop-in, all types lifted toward −10 dBFS; bigger TV with flicker from frame 0, one-read ad card with a red REPORT IT stamp on "report"; second half off-centre (van card left/tilted, door morphs into a full-bleed hideout card with HIDEOUT low left, choice card up-right, prompt panel low-left, slam left); vote header 120 px inside x 140–930, vote cards push and wobble; plates re-chained at ≥0.75× (new unused T2 ranges ppolice 107.78–109.2 and ptruck 120.75–122.85); fox mascot with longer snout, ears, white chin and tail tip; van top-right glyph is a wall lantern in the scene (no recut); gta-iguana-vo.mp3 removed. Mix: smr_db 23 → 14 so the gap hits peak at about −12 dBFS (median −12.5, range −7 to −16.6); hits with no pause near their move now play on the move at 0.35× under the voice; in-mix WER 0 on every line, −14.0 LUFS, 24.07 s.
