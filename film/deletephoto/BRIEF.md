# Delete photo: deleting a photo doesn't delete it

Factory #26 · slug `deletephoto` · backlog row 30 · researched 2026-11-09. Channel: Tech, explained (not named in the script). American English, US audience, Ming US_James (seed 7, `"engine": "ming"`), no music, **no AI tag** (LESSONS, Not slop, 2026-11-03). Target 30–40 s; 11 lines, 90 words, chained `at` gives 39.3 s, expect about 36–38 s (forceclose: formula 41.9 s, real 39.7 s).

## 0. Packaging score: 6/6 (PERFORMANCE.md §7)

| # | Mark | Score | Why |
|---|---|---|---|
| 1 | Mine | 1 | Everyone deletes photos from the phone in their hand, usually this week. |
| 2 | Myth / threat | 1 | Breaks "delete = gone": the photo sits in a locked album for a month, and a friend's saved copy stays no matter what you do. Not an already-fixed myth: Apple's page was republished Mar 31, 2026 and Google changed its own window in Sep 2026. |
| 3 | Frame-0 test | 1 | The viewer can open Photos › swipe up › Recently Deleted right now and see their own "deleted" photos. Frame 0 is that album with a lock on it. |
| 4 | Takeaway | 1 | Empty Recently Deleted (iPhone) or Trash (Google Photos) to really delete; or, the other way round, recover an accident within 30 days. |
| 5 | Title | 1 | **"Deleted Photos Aren't Really Gone 🤔"**: the thing in the first two words, 5 words, Title Case, one emoji, consequence verb "Aren't Really Gone". Alt: "Deleting a Photo Doesn't Delete It 😮". |
| 6 | Searched | 1 | "how to permanently delete photos on iPhone", "recover deleted photos iPhone", "where do deleted photos go" are long-running questions with their own Apple and Google help pages. I did **not** check search volume (no Semrush run); the score assumes it. |

Same shape as incognito (6) and forceclose (6): the hook is close to the maker's own sentence ("When you delete a photo or video, it goes to the Recently Deleted album") and the proof is the maker's own page. Risk to the score: many iPhone users already know Recently Deleted exists; the Face ID lock (they may never have opened it), the friend's copy and the "how to really delete" step carry the film for them.

**Main search phrase: `deleted photos`** (spoken in line 1 at 0.2 s) and **`recently deleted`** (line 2, about 3.5 s). Show **DELETED PHOTOS** on frame 0. Secondary for SEO: `recently deleted photos iphone`, `how to permanently delete photos on iphone`, `where do deleted photos go`, `google photos trash 30 days`, `recover deleted photos`.

**DM-able moment:** `theirs`: "Their copy stays, even if you delete the album." It's the line people send to the friend who has the embarrassing photo. Second one: the locked album full of photos you thought were gone.

## 1. Topic and one hard idea

**Deleting a photo only moves it: on iPhone it waits 30 days in Recently Deleted (locked by default), Google Photos keeps it in Trash for 30 days, and a copy a friend saved from your shared album stays with them. It's gone only when you empty Recently Deleted or Trash, and then Apple and Google both say you can't get it back.**

**Changes to the orchestrator's claim (checked on the live pages 2026-11-09):**
- **Google Photos is 30 days, not 60.** Google's help page now says 30 days for everything: "Photos and videos that you delete will stay in your trash for 30 days before they are permanently deleted." and "If you delete a photo or video that's backed up in Google Photos, it will stay in your trash for 30 days." No "60" appears on the page. 9to5Google reports the cut from 60 to 30 was effective about Sep 4, 2026 (fact 7). Older search snippets still say 60; they are stale. The voice says only "thirty days too".
- **"Open Albums › Recently Deleted" is the old path.** Apple's current pages say "Open the Photos app, swipe up, then tap Recently Deleted in the Utilities section" (124460) and "Open Photos, then tap Collections at the bottom. Swipe up, then tap the Recently Deleted album under Utilities" (104967). The voice says "Open Photos. Swipe up to Recently Deleted." Frame 0 shows the album itself, not a path.
- **Messages copies are out.** I found no Apple or Google page that says a photo you texted stays on the other phone after you delete yours. The only primary "copy stays" sentence is Apple's shared-album one, so the voice scopes the friend line to **a shared album**.
- **Hook changed** from "You deleted that photo. It's still on your phone." (9 words, two sentences, over the 6-word hook rule) to "Your deleted photos are still here." (6 words, same belief turned over, carries the search phrase).

## 2. Hook options

1. **"Your deleted photos are still here."** (chosen, 6 words) Says the search phrase at 0.2 s, turns the belief over, and "here" points at the album on frame 0. True as stated for any photo deleted in the last 30 days and not purged.
2. "You deleted that photo. It's still on your phone." (working hook, rejected as line 1) 9 words across two sentences; the stake lands after 1.5 s. "On your phone" is also only true without iCloud-only storage tricks; "here" avoids that.
3. "Deleting a photo doesn't delete it." (backup, 6 words) Strong as a title variant, but it misses the plural search phrase and gives no "here" to look at.

## 3. Facts used

All read 2026-11-09 with curl of the live page (US English). Quotes are word for word.

| # | Fact | Line | Source |
|---|---|---|---|
| 1 | "When you delete photos and videos, they go to your Recently Deleted album for 30 days. After 30 days, they'll be permanently deleted." / "When you use iCloud Photos and delete a photo or video on one device, it gets deleted on all other devices where you're signed in with the same Apple Account." / "If you use iCloud Photos, and delete photos and videos from one device, the photos and videos will be deleted on your other devices." | moves, days | Apple Support, "Delete photos on your iPhone or iPad", **Published Date: March 31, 2026**: https://support.apple.com/en-us/104967 |
| 2 | Lock: "In iOS 16, iPadOS 16.1, or later, Face ID or Touch ID is required to view the Hidden and Recently Deleted albums by default." To turn it off: "Open the Settings app. Tap Apps, then tap Photos. Turn off Use Face ID." | days | same page (fact 1) |
| 3 | Really delete: "Open Photos, then tap Collections at the bottom. Swipe up, then tap the Recently Deleted album under Utilities." … "Tap the More button, then tap Delete or Delete All." "Tap Delete from All Devices or Delete Photos I Added to confirm." "When you delete a photo or video from this album, you can't get it back." | test, really, gone | same page (fact 1) |
| 4 | "When you delete a photo or video, it goes to the Recently Deleted album. Anything in your Recently Deleted album stays there for 30 days. After 30 days, it's permanently deleted and you can't get it back." / "Open the Photos app, swipe up, then tap Recently Deleted in the Utilities section." / "Tap View Album, then use Face ID or Touch ID to unlock your Recently Deleted album." | test, moves, days | Apple Support, "How to recover deleted photos on your iPhone, iPad, Mac, or Apple Vision Pro", **Published Date: September 15, 2025**: https://support.apple.com/en-us/124460 |
| 5 | "Any photos that you saved or downloaded from a shared album to your Photos library stay in your library even if the shared album is deleted or the person who created it stops sharing it." / "Anything you delete is automatically deleted from the album on all your devices and the devices of subscribers." / "Deleting a shared album permanently deletes all of its photos." | friend, theirs | Apple Support, "How to use Shared Albums in Photos on your iPhone, iPad, and Mac", **Published Date: October 06, 2026**: https://support.apple.com/en-us/108314 |
| 6 | "Photos and videos that you delete will stay in your trash for 30 days before they are permanently deleted. Photos and videos that were permanently deleted can't be restored." / "If you delete a photo or video that's backed up in Google Photos, it will stay in your trash for 30 days." / Android: "If you delete a photo or video from your Android 11 and up device without it being backed up, it will stay in your trash for 30 days." / iPhone: "If you permanently delete a photo or video from your iPhone or iPad without it being backed up in Google Photos, it will stay in your trash for 30 days, then be deleted forever." / "When you empty your trash, you permanently delete any photos and videos in your trash, and they can't be restored." / "Items you delete aren't automatically removed from: Blogger Drive Gmail YouTube" / "Tip: Deleted photos and videos might stay on a removable memory card." | google, really, gone | Google Photos Help, "Delete photos & videos" (undated; page says "This article details the current retention policy."): https://support.google.com/photos/answer/6128858?hl=en&co=GENIE.Platform%3DAndroid and the iPhone & iPad version https://support.google.com/photos/answer/6128858?hl=en&co=GENIE.Platform%3DiOS |
| 7 | "You can only restore photos and videos if they're still in your trash." / "Photos and videos in the trash are permanently deleted after 30 days." | google, gone | Google Photos Help, "Restore recently deleted photos & videos" (undated): https://support.google.com/photos/answer/9343482?hl=en&co=GENIE.Platform%3DAndroid |
| 8 | **As reported (not in the voice):** "Google Photos has updated its trash bin timeline, cutting the time from 60 days to 30 days as of September 2026." / "That previously read as 60 days, with the change apparently being effective as of September 4, 2026" (from archived copies of the help page). | optional chip only | 9to5Google, Ben Schoon, Sep 8, 2026: https://9to5google.com/2026/09/08/google-photos-trash-bin-now-deletes-media-after-30-days-down-from-60-days/ · Conflict: Analytics Insight (secondary, not opened) says the cut applies to items deleted on or after Dec 5, 2026: https://www.analyticsinsight.net/news/google-photos-tightens-trash-rules-recovery-period-falls-to-30-days |

**Wording choices tied to sources**
- `hook` "still here": true for anything deleted in the last 30 days and not purged (facts 1, 4). The super on frame 0 must not say "forever" or "always".
- `test` "Swipe up to Recently Deleted" is Apple's current path (fact 4). On screen, the breadcrumb chip **PHOTOS › SWIPE UP › UTILITIES › RECENTLY DELETED**. Don't draw a tab bar (Apple's two pages name it differently: "Collections" vs no tab).
- `moves` says **"your iPhone just moves it there"**: Apple's "it goes to the Recently Deleted album". Never "hides" or "keeps a copy".
- `days` says **"locked by default"**, Apple's own scope ("by default"); chip **FACE ID OR TOUCH ID · iOS 16+**. Don't say "you never look" (not sourced).
- `google` says "Google Photos" (the app), not "Android": Samsung Gallery and other gallery apps aren't sourced. Chip **GOOGLE PHOTOS HELP · 30 DAYS**. No "60" in the voice. If the director wants the cut, it goes on a small chip **WAS 60 DAYS UNTIL SEPT 2026 · AS REPORTED BY 9TO5GOOGLE** (my advice: leave it off; see risk 2).
- `friend` / `theirs`: scoped to **a shared album**, Apple's sentence (fact 5). "Their copy stays, even if you delete the album" is Apple's "stay in your library even if the shared album is deleted", said from the friend's side. On screen: **SAVED FROM A SHARED ALBUM · APPLE SUPPORT · OCT 6, 2026**. Never extend it to texts, AirDrop, screenshots or social media.
- `really` "empty Recently Deleted or Trash": Apple's "Delete All" and Google's "Empty Trash" (facts 3, 6). The Apple confirm button in the picture reads **Delete from All Devices**, Apple's own label (fact 3), with **RE-CREATED**.
- `gone` "Apple and Google say, you can't get it back": Apple "you can't get it back", Google "can't be restored" (facts 3, 6). The attribution stays in the voice so it isn't a forensic claim.

**Kept out on purpose**
- **Forensic recovery** (data-recovery apps, flash storage, police tools). No Apple or Google page says either way; not in the film.
- **Messages / iMessage / WhatsApp copies.** Common sense, but no primary source found; not in the voice.
- **iCloud sync** in the voice. Verified (fact 1) but it's a second idea; it shows only as the **Delete from All Devices** button text on `really`.
- **Storage numbers** (does Recently Deleted count against iCloud storage?). Not sourced.
- **The Google 60 → 30 change** in the voice: one secondary source gives a different effective date (Dec 5, 2026).
- **Removable memory cards** (Google's tip, fact 6): true but niche; pinned-comment material.

## 4. Tension arc and shot ideas per line

Tension row: **4 4 3 3 3 3 2 1 4 5 5**. The dip is `theirs` (whatever you delete, the friend's copy stays: the viewer loses control); it climbs to the payoff `gone` and the end question.

House look: ink-dark stage, cream type, one hot coral accent, chips, labels, one hero stamp. **Native move for this film: the tear-off day calendar.** A paper day-calendar is clipped to the Recently Deleted bin; days tear off and flutter away ("DAY 1" … "DAY 30"), which doubles as the time-jump card a sound-off viewer can follow. Generic drawn phone (round punch-hole, no notch, no logos); every phone screen is a re-created, simplified album with a **RE-CREATED** tag ≥ 36 px. Photos in the grid are hand-drawn paper snapshots (a dog, a beach, a blurry selfie), never AI images or real people.

| id | at | tension | Line | Shot |
|---|---|---|---|---|
| hook | 0.2 | 4 | "Your deleted photos are still here." | Frame 0, moving from frame 1: a big paper photo grid (≥ 700 px) behind a paper padlock, gliding left ≥ 300 px; one snapshot with a coral "deleted" X slides back into the grid. Super ≤ 4 words: **DELETED PHOTOS: STILL HERE**. |
| test | 3.24 | 4 | "Open Photos. Swipe up to Recently Deleted." | The viewer's test: a thumb swipes up a generic phone; breadcrumb chip **PHOTOS › SWIPE UP › RECENTLY DELETED** (≥ 40 px). The album title card **RECENTLY DELETED** lands. |
| ask | 6.14 | 3 | "So when is a photo really gone?" | A big coral **?** tag clips onto the padlock. |
| moves | 9.04 | 3 | "Hit delete, and your iPhone just moves it there." | A trash button pressed; the snapshot doesn't vanish, it slides across into a paper bin labelled RECENTLY DELETED. Credit **APPLE SUPPORT · MAR 31, 2026**. |
| days | 12.66 | 3 | "It waits there thirty days, locked by default." | The tear-off calendar clips to the bin: **DAY 1** card, then pages tear fast to **DAY 30**; the padlock snaps shut on "locked". Chip **FACE ID OR TOUCH ID · BY DEFAULT · iOS 16+**. |
| google | 16.41 | 3 | "Google Photos keeps its trash thirty days too." | A second bin (TRASH) slides beside it with its own calendar on **30 DAYS**. Credit **GOOGLE PHOTOS HELP · READ NOV 9, 2026**. |
| friend | 19.67 | 2 | "But a friend who saved it from your shared album?" | A shared-album card with two avatars (hand-drawn); a copy of the snapshot drops into the friend's paper phone. Label next to it: **SAVED FROM A SHARED ALBUM**. |
| theirs | 23.64 | 1 | "Their copy stays, even if you delete the album." | The shared album tears in half and falls; the friend's copy stays put. Stamp (quiet, cream, not the hero): **THEIRS STAYS**. 0.8 s silence after for its slap. Credit **APPLE SUPPORT · OCT 6, 2026**. Peel the friend's phone before `really`. |
| really | 28.06 | 4 | "To really delete it, empty Recently Deleted or Trash." | Back to the two bins; re-created confirm sheet **Delete from All Devices** (Apple's button text, RE-CREATED) and **Empty Trash** (Google). Thumb taps both. |
| gone | 31.67 | 5 | "Then, Apple and Google say, you can't get it back." | Bins empty with a paper shred; the calendar is torn off whole. Hero coral stamp **CAN'T GET IT BACK** lands in the 1.0 s silence after the line; credits **APPLE SUPPORT · GOOGLE PHOTOS HELP**. **Screenshot hold ≥ 1.2 s.** |
| end | 36.64 | 5 | "So, is yours empty? Yes or no." | The locked grid from frame 0 returns at full opacity with **YES / NO** chips ≥ 110 px, neither highlighted; on "no" it is frame 0 again so the loop replays into "Your deleted photos are still here." |

Pacing: a new object every 3 s or less; no still stretch over 1.0 s while the voice runs. Fill y 1000–1430 in every scene (bins, calendar and phones sit low). Coral only on the hook's X, the **?** tag, the **CAN'T GET IT BACK** stamp and YES / NO.

## 5. Open questions and truth risks for the director

**Truth risks (keep these scoped)**
1. **"Still here" for iCloud users who already purged / devices that sync from a computer.** Apple: photos synced from a computer can't be deleted on the device at all. The hook stays true (they're "still here" even more), but don't say "every photo you ever deleted".
2. **Google 60 → 30 timing.** The live help page says 30 days (read 2026-11-09). 9to5Google says live from about Sep 4, 2026; Analytics Insight says for items deleted on or after Dec 5, 2026. A viewer who deleted a backed-up item in August might still see a 60-day item. That's why "60" is not in the voice; if it goes on a chip, it is "AS REPORTED".
3. **The friend line is shared albums only.** Apple's sentence covers photos saved from a shared album. Nothing primary covers texts, AirDrop or screenshots; the picture must show a shared album, not a chat bubble.
4. **"Swipe up" path.** From Apple's Sep 2025 and Mar 2026 pages; on iOS 17 and earlier it was the Albums tab. Not checked on a device. The chip shows Apple's current wording only.
5. **"Locked by default"** is iOS 16+ and users can turn it off; keep the iOS 16+ chip.
6. **"Can't get it back"** is attributed to Apple and Google in the voice. Don't add any claim about recovery tools or forensics either way.
7. **Search volume** for the "Searched" mark wasn't checked.

**Other questions**
8. **Length.** Formula 39.3 s; expect about 36–38 s. If it runs over 40 s, shorten `friend` to "A friend saved it from your shared album?" and `really` to "To really delete, empty Recently Deleted."
9. **Planned silences.** 0.8 s after `theirs` (dip stamp slap), 1.0 s after `gone` (hero stamp thump). Keep them through re-timing; the SFX gate needs them.
10. **Ming risks.** "Recently Deleted" is listed in `names`; check it with unhinted Whisper. `test` has a `say` comma ("Swipe up, to Recently Deleted") so "up to" isn't read as one phrase; drop the comma if it sounds odd. "Face ID" isn't spoken. "Then, Apple and Google say," has commas around an aside, not between a verb and its object (fyp lesson); if Ming drops to sentence-end pitch, reword to "Apple and Google say you can't get it back then." "thirty" is written out.
11. **Logos and UI.** No Apple, Google or Photos logos and no real UI; generic phone, re-created album and confirm sheets with RE-CREATED tags ≥ 36 px.
12. **Pinned comment idea (SEO agent):** "Apple Support (Mar 31, 2026): deleted photos 'go to your Recently Deleted album for 30 days.' Google Photos Help: trash keeps them '30 days before they are permanently deleted.' To really delete: Photos › Recently Deleted › Select › Delete All; Google Photos › Collections › Trash › Empty Trash." Keep "›", no angle brackets.
13. **End card sources:** "Apple Support Mar 2026, Sep 2025, Oct 2026 · Google Photos Help, read Nov 9, 2026".
14. **Backup topic** (only if this one is dropped): why your phone dies faster in the cold. Not researched this run.

## Log
- 2026-11-09: researched and scripted. Google's trash is now 30 days for backed-up items (not 60); Apple's path is "swipe up", not the Albums tab; friend line scoped to shared albums; working hook shortened to 6 words. scriptlint: OK, no FAILs or WARNs.
- 2026-11-09 (director): built and rendered, 34.5 s (out/deletephoto-vo.mp4, 7.6 MB; voice-only 7.3 MB). Voice: `vo/script.json` re-laid out with `voiceover.py layout` (the researcher's `at` times left 1.3–2.1 s gaps and made `test` overrun into `ask`); `end` moved to 32.2 s (gap 1.35 s) so YES / NO get their 1.8 s; `ask` say "So, when is a photo really gone?" (solo Whisper heard "when has"); `friend` say "But, a friend who saved it…" (rushed at 4.07 w/s); `really` say "…empty Recently Deleted, or Trash." (small.en heard "trashed", then "tracked" with a tail fade); text unchanged on screen and in captions. "Recently Deleted" and "Then, Apple and Google say," heard right by unhinted base.en and small.en (0 % WER). No "60" anywhere; friend beat is a SHARED ALBUM card (RE-CREATED) and a friend's phone, no chat; the lock carries FACE ID OR TOUCH ID / BY DEFAULT · iOS 16+ / CAN BE TURNED OFF; CAN'T GET IT BACK sits under APPLE SUPPORT · GOOGLE PHOTOS HELP; Delete from All Devices and Empty Trash are re-created sheets tagged RE-CREATED; no quote strips. Coral only on the hero stamp and YES / NO. Mix at duck.smr_db 32; heard.js = merged gate passes (voice-only pre-pass + first mix). Gates in the director's report.
- 2026-11-09 (director, jury round 1 fixes; 7.0 / Truth 8.5): no re-voice, no re-time. Truth: the confirm-scene calendars now read DAY 12 (mid-window, never DAY 30 on a full bin) and drop away whole on "say", so only the emptied bins sit under CAN'T GET IT BACK; the hovering "CAN'T GET" shadow is gone. Google credit is now GOOGLE PHOTOS HELP / SAYS 30 DAYS · NOV 9, 2026 (38–40 px); no "60" anywhere. **Date note:** Analytics Insight (Nov 5, 2026) says the 30-day trash applies to items deleted on or after Dec 5, 2026; Google's live help page (read Nov 9, 2026) says 30 days, so the film quotes the page and dates the credit. Polish: frame 0 carries a 132 px ink trash badge on the tilted snapshot (ink, not coral), settling into its slot by 1.4 s, mirrored at the loop end; captions are explicit phrase cards ("and your iPhone / just moves it there.", "Swipe up / to Recently Deleted.", "So when is a photo / really gone?"); ratcheting flap ticks that speed up close each calendar flurry (14.22–14.53 and 17.50–17.75; each tick turns a page); hits re-levelled (duck.smr_db 32 → 26: paper −23.3 / −22.5, pop −21.0 dB RMS, hero −19.5 dB RMS and peak −8.1 vs voice −3.0 dBFS); THEIRS STAYS inks in on "stays" and slams with a quiet slap at 23.89 in the gap; the torn album falls behind the friend's phone, which rises into y 450–1000; the padlock drops full size (300 px body) and snaps shut on "locked" with the knock; scope chip 42 px; CAN'T GET IT BACK inks in cream on "can't" and the coral stamp slams on the thump at 31.05 in the silence, holding 1.2 s; the end card dims the grid to 60 % behind YES / NO and clears it for the loop's last frames. SFX gate 17 hits, 0 FAIL (heard.js = merge of three gate passes on this round's mixes).
