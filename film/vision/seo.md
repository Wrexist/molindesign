# SEO: Why Claude Shrinks Your Photos (vision)

Factory #20 · How AI works, part 9 · film 30.7 s (out/vision.mp4, script dur 30.71 s) · packaged 2026-11-03

**YouTube Shorts only for now** (channel "Tech, explained"; TikTok paused under the account-level hold). The TikTok pack below is for when it resumes.

**No AI tag (Isac, 2026-11-03), overrides video-seo.md:** no "AI voice", "AI-generated" or narration-disclosure line in the title, description, captions or comments; no #ai; YouTube **Altered content: No**. TikTok's is_aigc toggle is handled separately. Scope rule: the film is about Claude only, so nothing here says "AI shrinks your photo" (OpenAI's guide says its newest models keep a photo's dimensions by default).

## YouTube Shorts

**Title:** Why Claude Shrinks Your Photos 🤔 (32 characters)
- Alternatives: What Claude Does to Your Photo First 😮 · Your Photo Is 4,740 Squares to Claude 🤔
- Why this one: PERFORMANCE §7 packaging score. Mine (your photos), threat (something happens to them before Claude reads them), Title Case, 5 words, names the thing in the first two, consequence verb "Shrinks", mirroring battery's "Why Your Phone Battery Is Shrinking 🤔" (455) and incognito's personal stake. It matches the hook and the poster ("Your photo? Claude shrinks it"). Not "AI" in the title: false for OpenAI's newest models.

**Playlist:** How AI works · **Altered content:** No

**Tags** (266 characters): how ai sees images, claude image upload, claude image size limit, claude image resize, does claude resize images, claude vision, claude visual tokens, image tokens, image patches, an image is worth 16x16 words, small text in photos, anthropic, how ai works, tech explained, shorts. No bare "ai" tag; "how ai sees images" stays as the main search phrase (BRIEF §1) and "how ai works" as the series name.

**Slot:** YouTube Shorts: the first free slot after stepbystep. If 19:00 ET (EST) Tue Nov 3 is still open after the queue (incognito/voiceclone/stepbystep), that is 00:00 UTC Wed Nov 4; otherwise 13:00 ET Wed Nov 4 = 18:00 UTC. Pick the time from YouTube Studio's dropdown and check the saved UTC time. Both slots have produced winners (PERFORMANCE 4). Post only on a jury pass. TikTok: on hold (account-level hold); when it resumes, the first 19:00 ET slot.

**Stockholm:** 01:00 Wed Nov 4 (19:00 ET slot) or 19:00 Wed Nov 4 (13:00 ET slot). Sweden CET, US EST, 6 h apart. TikTok later: 19:00 ET = 01:00 Stockholm the next day.

Switch YouTube Studio to "Tech, explained" (not "Delta") and verify before uploading.

**Pinned comment** (245 characters; post and pin after the Short is live):

> On older Claude models (before 4.7, the docs' standard tier) the cap is 1,568 squares. The same 12 MP photo is cut to 1270 × 952 by the docs' resize code: 46 × 34 = 1,564 squares, just 9.9% of its pixels. Which Claude do you send your photos to?

Backup replies:
- "Does ChatGPT do this too?" We didn't test the ChatGPT app. OpenAI's API guide says that for its newest models (gpt-6-astra and the gpt-5.6 family), "original" detail "preserves the image's dimensions" up to 65,535 px a side, and "auto" uses the same sizing. That's why the film says Claude, not every chatbot.
- "Can I stop it from shrinking my photo?" Send one that already fits: on Claude 4.7 and later that's up to 4,784 squares and 2,576 px a side (2212 × 1659 for a 4:3 photo). Developers can also set "oversized_image": "error" on an image block to get an error instead of a resize (Claude's resize guide, read Nov 3, 2026). For fine print, getting closer still helps most.

**Description** (3850 characters, under YouTube's 5,000; paste it in full). No < or > characters (checked by script). Sources pasted with URLs; it says the before/after receipt is our own test.

```
Your photo? Claude shrinks it first. This is how AI sees images in Claude's case, and what it means for the small text in your photos.

Claude's vision docs: "Claude processes images in patches instead of pixels. Each patch is a 28×28-pixel block of the image, referred to as a visual token." Every model has a cap, and "Images larger than either limit are downscaled before processing."

The numbers for a 12-megapixel photo (4032 × 3024 = 12,192,768 pixels):
- At full size it would be 144 × 108 = 15,552 squares, over every Claude cap.
- Claude 4.7 and later (high-resolution tier: 2,576 px long edge, 4,784 visual tokens): resized to 2212 × 1659 = 79 × 60 = 4,740 squares, 30.1% of the pixels.
- All other Claude models (standard tier: 1,568 px, 1,568 tokens): resized to 1270 × 952 = 46 × 34 = 1,564 squares, 9.9% of the pixels.
Either way, under a third of the pixels are left. These sizes are our math with the reference resize code in Claude's docs. The same code gives the docs' own examples: 1920 × 1080 → 1456 × 819, and 3840 × 2160 → 2576 × 1449 on the newer models.

Why squares: each square is one visual token, and images are priced by tokens like the words you type. The docs: "To estimate cost, multiply the token count by the per-token price of the model you're using." A cap on squares is a cap on cost.

What it can do to small text. The docs: "Take into account that your image might be resized if it is too large…; this might, for example, make text less legible." And: "If the image contains important text, make sure it's legible and not too small."

The tip: reading fine print? Get closer first. A closer shot makes the text bigger in the frame, so more of it survives the resize. The docs also say: "Avoid cropping out key visual context solely to enlarge the text." Developers can pre-resize or crop images themselves before sending them, as the docs suggest.

Did you know it shrinks your photos? Yes or no.

Fine print: this is about Claude only. Other services handle photos differently; OpenAI's images guide, for example, says its newest models keep a photo's dimensions by default. Photos already inside Claude's limits aren't resized (a 1000 × 1000 image isn't). The before/after receipt in the film is our own test: our hand-made table photo, rendered at 4032 × 3024 and resized to 2212 × 1659 with a standard area-average resample. It is not Claude's own resize code and not a real Claude run. The "closer" shot is the same table 2.2× closer, resized the same way. 4,740 squares is our math for a 4032 × 3024 photo on Claude 4.7 and later; the voice rounds it to "about forty-seven hundred". The docs describe Claude's models and developer API; we didn't test the claude.ai app. The photo, receipt, grid, gauge and docs cards are hand-made re-creations; no real app or logo is shown. The square-patch idea is older than Claude: a 2020 Google paper, "An Image is Worth 16x16 Words", treated image patches "the same way as tokens (words)". That is background, not a claim about how Claude is built.

Sources:
- Claude Docs, "Vision", sections "Resolution and token cost" and "Image quality guidance", read Nov 3, 2026: https://platform.claude.com/docs/en/build-with-claude/vision
- Claude Docs, "Coordinates and bounding boxes", section "How Claude resizes and pads images" and its reference resize code, read Nov 3, 2026: https://platform.claude.com/docs/en/build-with-claude/vision-coordinates
- OpenAI, "Images and vision" guide, "Model sizing behavior", read Nov 3, 2026: https://developers.openai.com/api/docs/guides/images-vision
- Background: Dosovitskiy et al. (Google Research, Brain Team), "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale", arXiv 2010.11929, submitted Oct 22, 2020 (ICLR 2021): https://arxiv.org/abs/2010.11929

How AI works, part 9.

#shorts #claude #anthropic
```

### Number check (re-run 2026-11-03 with the docs' own `resized_size` / `count_image_tokens`, copied from the resize guide)
- 4032 × 3024 = 12,192,768 px. Unresized: ⌈4032/28⌉ × ⌈3024/28⌉ = 144 × 108 = **15,552** squares.
- High-resolution tier (max_edge 2576, max_tokens 4784): **2212 × 1659**, 79 × 60 = **4,740** tokens (cap 4,784), 3,669,708 px = **30.10 %**.
- Standard tier (1568, 1568): **1270 × 952**, 46 × 34 = **1,564** tokens (cap 1,568), 1,209,040 px = **9.92 %**.
- Code sanity checks, all match the docs: 1075 × 1520 → 924 × 1307; 1920 × 1080 → 1456 × 819 (standard); 3840 × 2160 → 2576 × 1449, 4,784 tokens (high-res).
- One thing to know: the docs' table prints **1269 × 952** for a 2000 × 1500 photo (the same 4:3 shape), while the docs' own code gives 1270 × 952 for both that photo and ours. Tokens are 1,564 either way and 9.9 % either way, so the pinned comment says "by the docs' resize code". If a commenter points to the table, that's the answer.
- "Under a third" holds on both tiers (30.1 % and 9.9 %).

### Quote check (Claude docs fetched as Markdown 2026-11-03, HTTP 200)
- Vision, "Resolution and token cost": "Claude processes images in patches instead of pixels. Each patch is a 28×28-pixel block of the image, referred to as a visual token." · "Images larger than either limit are downscaled before processing" · tier table High-resolution "Claude 4.7 and later models" 2,576 px / 4,784; Standard "All other models" 1,568 px / 1,568 · "To estimate cost, multiply the token count by the per-token price of the model you're using." · 1000 × 1000 "Not resized" on both tiers.
- Vision, "Image quality guidance": "If the image contains important text, make sure it's legible and not too small. Avoid cropping out key visual context solely to enlarge the text." · "Take into account that your image might be resized if it is too large (see …); this might, for example, make text less legible. Consider pre-resizing your images, cropping them, or both." (the description cuts the link in the parenthesis with "…").
- Coordinates and bounding boxes, "How Claude resizes and pads images": "Claude finds the largest aspect-preserving size that satisfies both of the model's image limits" and the reference code; `"transformations": { "oversized_image": "error" }` rejects instead of resizing ("downsize" is the default), used in backup reply 2.
- OpenAI "Images and vision" (Markdown read 2026-11-03): for `gpt-6-astra` and `gpt-5.6-sol/terra/luna`, "`original` preserves the image's dimensions, except that images larger than 65,535 pixels on either side are scaled down", and "`auto` uses the same sizing behavior as `original`." A 12 MP photo is 126 × 95 = 11,970 of its 32-px patches, under its 30,000-patch rejection limit, so it isn't resized there. Used in backup reply 1, scoped to the API ("We didn't test the ChatGPT app").
- arXiv 2010.11929 abstract page (HTTP 200): title "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale", submitted 22 Oct 2020. PDF text: "Image patches are treated the same way as tokens (words) in an NLP application." Background only, never Claude's design.

## TikTok (for later, when the hold clears)

**Title / search phrase:** How AI sees images: Claude shrinks your photo first

**Caption** (249 characters):

```
How does AI see your photo? Claude shrinks it first: a 12 MP photo keeps under a third of its pixels, about 4,740 squares of 28 px each.
Small text can get harder to read, so get closer for fine print.
Did you know it shrinks your photos? Yes or no.
```

**Hashtags:** #claude #anthropic #phonephotography #techtips #learnontiktok (no #ai, no #chatgpt: the film is Claude-only; no #fyp spam)

**Keywords** (the first, "how ai sees images", isn't spoken verbatim; "photo" and "Claude" are spoken in the first 2 s, and the caption's first line carries the phrase; volumes not checked): how ai sees images; claude image upload; claude image size limit; claude image tokens; why can't ai read small text; does claude resize images; image patches; an image is worth 16x16 words

**Cover:** "12 MILLION PIXELS" at 0.0 s (frame 0). The YouTube poster (out/poster.jpg) is the hero: "Your photo? Claude shrinks it" over the gridded print and the coral 4,740 SQUARES stamp with CAP 4,784 and CLAUDE 4.7 AND LATER.

**Sounds:** Not checked this pass: TikTok is on hold, and a trending-sound pick goes stale in days. When TikTok resumes, run Higgsfield tiktok_music_trending (US, 7DAY) on the post day and pick an instrumental bed at 5-10 % under the voice-only cut (out/vision-voice-only.mp4, 30.7 s). Skip Self Aware and Espresso Soul (retired) and the last three posts' sounds. YouTube Shorts goes out with the film's own mix (voice, room tone, four paper hits), no music added.

## Two alternative hooks (an A/B on caption, cover or YouTube title, never a re-upload)

1. **"Your photo keeps under a third."** Caption line 1: "Send Claude a 12 MP photo and under a third of its pixels are left." YouTube title: *What Claude Does to Your Photo First 😮*. Cover: *12 MP → UNDER 1/3*. Keep "Claude"; never "AI keeps a third".
2. **"Your photo is 4,740 squares."** Caption line 1: "To Claude 4.7 and later, your 12 MP photo is 4,740 squares of 28 pixels, each one a token." YouTube title: *Your Photo Is 4,740 Squares to Claude 🤔*. Cover: *YOUR PHOTO = 4,740 SQUARES*. Keep "4.7 and later" in the caption (the standard tier is 1,564).

## US growth actions for Isac after posting

1. **First hour:** reply to the first US commenters within the hour with a sourced extra fact (the standard-tier 1,564 squares, or the "oversized_image" setting). If someone says "ChatGPT does this too", use backup reply 1: OpenAI's guide says its newest models keep the full size by default; don't claim what the ChatGPT app does. If someone asks about the claude.ai app, say the numbers are from Claude's developer docs and we didn't test the app.
2. **One US creator to stitch or duet (TikTok, after it resumes):** a US "Claude tips" or productivity creator who shows receipt, document or screenshot uploads; the "get closer" tip invites a "here's my test" stitch. Check they're US-based and on-topic first. Under 60 s, so stitch and duet are on.
3. **Promote boost:** not now. TikTok is on hold, and BRIEF scored this topic 3/6 before the stake was added; wait for 24 h and 72 h views. Candidate later only if it beats incognito's first-day pace: small, US, interest "Technology", adults 25-44.
