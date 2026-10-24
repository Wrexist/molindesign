# Hallucinate: why AI makes things up

A vertical (1080×1920) explainer for TikTok, Reels and Shorts, written in code. Factory #3 on the channel Tech, explained, after `film/nextword/` (Next word) and `film/strawberry/` (Strawberry). One hard idea: **a chatbot is a guesser, and a guesser always has a next word. A fake court case is as easy to guess as a real one, and nothing makes it say "I don't know", because AI is graded like a multiple-choice test where a blank scores zero and a guess might score.** Facts and sources: `BRIEF.md`.

## Benchmarks

- **Strawberry (`film/strawberry/`, jury 7.7)**: learn the jury fixes it already carries (conflict on frame 0, stamps at y≈1280, labels inside x 90–930 above y 1450, one caption block at a time, a short loop seam, RE-CREATED on staged chats) and one object carrying the film. Don't take its glassy chip: the channel must not look AI-made, so this film is built from paper things.
- **Court-sketch and newspaper explainers (Vox, the NYT's "The Daily" cards)**: learn real documents as the set (a filing, a stamp, a quote card with its source line) so the story feels reported, not generated. Don't take the slow pans over static scans; every object here is drawn flat and moves on a word.

## Three structures we considered

1. **Courtroom drama, then a footnote.** The whole film is Mata v. Avianca, the why in one line at the end. Rejected: the case is the hook, but the search phrase is "why does AI make things up", and that answer would be crushed into five seconds.
2. **Lecture first** (guessing → grading → the case as proof). Rejected: no hook in 3 s, and a lecture loses muted viewers.
3. **Case, then cause** (chosen): the fake case on frame 0 and the stamp at 1.4 s, the story to the DM moment (it said it double-checked), the judge and the fine, then the turn ("It wasn't lying. It was guessing."), the guesser, the test that rewards guessing, OpenAI's numbers, the tracker, and an end that fills the same blank with the same fake case, so the loop lands on frame 0.

## The native move: the blank that always fills

An answer slot: a dashed box drawn on paper with the caret from Next word blinking inside it. Something always slides into it. It opens in the hook (the case name is erased to a blank and the caret types it straight back, without a pause), returns in the guesser (each word dropped in from a short list), peaks on "No I-don't-know button" (a grey **I don't know** card hovers over the slot, never drops, and a coral guess snaps in instead), becomes the answer bubble on the test sheet, and closes the film: the slot fills with *Varghese v. China Southern Airlines* and that is frame 0 again. Scene changes are the caret itself: a coral caret bar sweeps across and the old scene goes with it.

## Look (Isac, 2026-10-23: must not look AI-made)

Flat, hand-built, real objects on the ink stage: a cream court page with its caption, a yellow sticky note, rubber stamps with worn ink (seeded speckle, slight tilt), index cards, a legal pad, a phone, a gavel, a bubble answer sheet, a pencil, a paper bar chart. Type: Archivo for headlines, Geist Mono for small print, Instrument Serif italic for case names (how courts set them). One coral accent for the fake and the guess; court "FILED" stamps in blue ink like the real ones. Background: faint citation fragments (F.3d, 11th Cir., Id., §) drifting, plain text, no chips, no glow.

## Voice first

Chatterbox (`vo/script.json`, `film-voiceover` §3b), recorded before any picture. Every beat, caption and sound reads its time from `vo/vo.js` through `at(id, word)`. No music (`MUSIC = false`): voice + sound effects, and voice only. "Varghese" is spoken "var-GEEZ".

| Line | Stressed word(s) | Picture |
|---|---|---|
| hook | **court case**, **exist**, **ChatGPT** | Frame 0: the cream court page with the case caption *Varghese v. China Southern Airlines Co., Ltd.*, 925 F.3d 1339 (11th Cir. 2019); headline AI HALLUCINATION over the caption band; the first caption card is up. On "exist" a coral DOESN'T EXIST stamp slams across the page; on "ChatGPT" a yellow sticky note slaps on: "source: ChatGPT". |
| name | **hallucination**, **lawyer**, **federal court** | The headline lights coral on "hallucination". A blue FILED stamp lands on the page: U.S. DISTRICT COURT · S.D.N.Y. · MAR 01 2023. |
| why | **make things up**, **sure** | The native move, first time: the case name is erased to a dashed blank with a caret; the caret types it back in one go, no pause (label NO PAUSE · NO DOUBT). |
| story | **New York, 2023**, **cases** | Dateline NEW YORK · 2023, a flat airliner and an index tag Mata v. Avianca · a serving cart hit his knee; a legal pad with "need cases" and an arrow into a chat window. |
| six | **six**, **judges**, **quotes**, **Not one** | Six index cards deal out with the six real fake citations; on "judges" the Varghese card gets its three real judges' names; on "quotes" quote marks drop on every card; on "Not one exists" six small DOESN'T EXIST stamps, accelerating. |
| asked | **Varghese**, **real** | The DM moment, whole frame: a phone with the chat, tagged FROM THE COURT RECORD · RE-CREATED. "Is varghese a real case" (his wording). |
| yes | **yes**, **double-checked** | "Yes, Varghese v. China Southern Airlines Co Ltd, 925 F.3d 1339 (11th Cir. 2019) is a real case." Then "What is your source" and "…Upon double-checking, I found that the case … does indeed exist and can be found on … Westlaw and LexisNexis." with "double-checking" and "does indeed exist" marked coral (the repeated citation trimmed to "…"). In the pause after the line a NO SUCH CASE stamp lands under the conversation. The phone holds through "The judge called its legal analysis" so the DM frame gets its full read. |
| gibberish | **gibberish** | A flat wooden gavel lifts and strikes on "gibberish"; a quote card: "Its legal analysis is gibberish." Judge P. Kevin Castel, S.D.N.Y., June 22, 2023. |
| fine | **fined**, **$5,000** | The gavel leaves, the quote card lifts; a counter runs to $5,000 · SANCTIONS · JUNE 22, 2023, small tag + A LETTER TO EACH REAL JUDGE IT NAMED AS AN AUTHOR. (Line rewritten "The lawyers were fined $5,000.": Whisper heard "And fined" as "And find".) |
| turn | **lying**, **guessing** | LYING is struck through with a coral pen; GUESSING drops in. |
| guess | **guesses**, **next likely word**, **again** | The slot and caret; under it a short list of next words with bars (no numbers, tagged ILLUSTRATION); the top word drops in, again and again, building "The court held that the airline …". |
| looks | **fake**, **real** | Two citations stacked, cut into the same parts (name · v. · name · volume · reporter · page · court · year): Ireland v. AMR Corp., 20 F. Supp. 3d 341 (E.D.N.Y. 2014) and Varghese v. China Southern Airlines Co., 925 F.3d 1339 (11th Cir. 2019). Tagged A and B, the same shape; on "real one" the tags turn: A REAL, B FAKE. |
| button | **always**, **I don't know** (spoken "The guesser always has…": "A guesser" was heard as "I guess there") | The native move at its peak: the slot blinks, a grey I don't know card hovers over it and drifts off, a coral guess snaps in. A flat push button I DON'T KNOW sits greyed out with a ⌀. |
| catch | **trained**, **catch** | The button lights mint and presses; then a red hang tag swings in: THE CATCH. |
| test | **multiple-choice**, **Blank**, **Zero** | A bubble answer sheet slides in; a blank row scores 0 in red pencil. |
| learn | **right**, **guess** | A pencil fills a bubble: +1?; then fills every remaining row, BLANKS: 0. |
| sat | **SAT**, **quarter point** | The sheet's header turns SAT · UNTIL 2016; a wrong bubble gets a −¼ stamp; a score key: right +1, blank 0, wrong −¼. |
| tested | **75%** | Paper bar chart, 100% bars: o4-mini wrong 75% (coral), right 24%, skipped 1%. OPENAI · SimpleQA · GPT-5 SYSTEM CARD · AUG 2025. |
| skip | **skips**, **26%** | gpt-5-thinking-mini: skipped 52% (grey) grows first, wrong 26%, right 22%. Small print: right answers: 24% vs 22%. |
| since | **2,000**, **court cases** | Index cards pile up fast; a counter rolls to 2,207; AI HALLUCINATION CASES DATABASE · OCT 23, 2026 · COURT CASES LIKE THIS. |
| end | **next word**, **doesn't exist** | The slot returns, the caret types *Varghese v. China Southern Airlines* into it, the page builds round it, and the last frame is frame 0. |

## Rules it follows

- Something moves every frame: drifting citation fragments, a breathing caret, papers settle with a slow 1–2° sway, the camera pushes 3 % per scene.
- A visual hit on every stressed word, keyed with `at(id, word)`; the next scene pre-rolls into silences.
- Captions in the upper third (y ≈ 360), one block at a time; labels ≥ 30 px inside x 90–930 and above y 1450; global stamps at y ≈ 1280.
- Honest numbers only (BRIEF facts 1–18): 925 F.3d 1339, six citations, Mar 1 2023 filing, June 22 2023, $5,000, the Appendix B wording, ¼ point and 2016, 75/24/1 and 26/22/52 (two different models, never "after the fix"), 2,207 on Oct 23 2026 as "court cases like this".
- Ban list respected: no glowing nets, brains, sparkles, grid floors, particles, flares, shake, bouncy easing.

## Jury round 1 (8.2, Truth 8.5): what changed

- **DM moment:** the phone is 900 px wide (x 90–990) with 41 px body text. The answer is fully typed by "double-checked". On that word, *does indeed exist* lands as a hard coral block with a knock, plus a small stamp thud. Every line from "gibberish" on moved +0.8 s and the gavel cut is 0.15 s later, so the finished phone holds about 1 s longer. NO SUCH CASE stays where it was and leaves with the phone.
- **Captions:** a coral pill only on stressed words (court case, exist, ChatGPT, hallucination, six, Not one, yes, double-checked, gibberish, $5,000, lying, guessing, I don't know, Zero, quarter point, 75%, 26%, 2,000, doesn't exist). Every other word is plain cream, and a pill ends before the next word starts, so two never show at once.
- **Test:** on "learn to guess" the pencil fills the last rows twice as fast, each row reads +1?, and the header counts PTS +N?. On "SAT" an older, yellowed sheet slaps on top at a 3° tilt (paper and stick sound). It has five bubbles A–E, its own key (+1, 0, −¼) and the printed key RIGHT +1 · BLANK 0 · WRONG −¼ in its footer, which a highlighter sweeps on "quarter point". The first sheet moved up 30 px so EVERY ROW GUESSED clears it.
- **Charts:** both model names and dashed empty bars appear on "tests", with the tag TWO DIFFERENT MODELS · NOT A BEFORE/AFTER between them. The 75% bar lands on "75%". The 26% bar grows on "Wrong" and lands on "26%".
- **Safe zones:** the DOESN'T EXIST stamp is 80 px and ends at x ≈ 916. The dateline is scaled to 880 px. The index card reads SAYS A SERVING / CART HIT HIS KNEE. The button-scene labels moved to y 920, under the slot, clear of the I don't know chip.
- **Voice:** the `asked` line says *Var-gheez*, which was the clearest of six takes on an unhinted Whisper. A room tone of about −50 dB runs under the whole film, so the silent tail is never digital zero.
