# SEO: How AI clones your voice from 3 seconds (voiceclone)

Factory #18 · How AI works, part 7 · film about 31.9 s (script dur 31.89 s; out/ was being re-rendered while this was written, so the cut wasn't read) · jury result not passed to this step · packaged 2026-11-01

**This one goes to YouTube Shorts only** (channel "Tech, explained", @techexplained.daily1; TikTok uploads are paused under the suspected account-level hold, LESSONS Posting). The TikTok pack below is ready for when it resumes.

## YouTube Shorts (posts now)

**Title:** How AI Clones Your Voice From 3 Seconds 😱
- Alternatives: Why Your Family Needs A Secret Word 😱 · Your Voice Is Just Numbers 🤔
- "From 3 Seconds", not the brief's "In 3 Seconds": the paper used a 3-second recording; "in 3 seconds" reads as the cloning taking 3 seconds, which nothing here shows.

**Playlist:** How AI works · **Tags:** ai voice cloning, how does ai voice cloning work, ai voice clone scam, family safe word, secret word scam, fbi ai voice warning, vall-e, microsoft vall-e 3 seconds, grandparent scam, how ai works, tech explained, shorts · **Altered content:** No

**Slot:** YouTube Shorts: 13:00 ET (EST), Mon Nov 2, 2026 = 18:00 UTC. It's the next channel slot: packaged Sun Nov 1 at 23:17 UTC (18:17 EST), so today's 13:00 and 19:00 ET slots have passed. The US left daylight time today, so ET is now UTC-5; pick 1:00 PM from YouTube Studio's dropdown and check the saved time reads 18:00 UTC / 19:00 Stockholm (LESSONS clock-change rule). If incognito (passed Oct 31) is still unposted, it takes this slot first and voiceclone moves to 19:00 ET Mon Nov 2 = 00:00 UTC Tue. Post only if the jury passes the final cut (gate 7.4 + Truth 8.5); out/ was being re-rendered while this was written (the last mix flagged `tip` as heard "It's tip"). TikTok (paused, account-level hold): when Isac's Settings › Account status check clears it, post in the first 19:00 ET slot (LESSONS evening rule) = 00:00 UTC the next day.

**Stockholm:** 19:00 Mon Nov 2 (Sweden CET, US EST: the gap is back to 6 h from today). Incognito-first fallback: 01:00 Tue Nov 3 Stockholm. TikTok later: 19:00 ET = 01:00 Stockholm the next day.

Switch YouTube Studio to "Tech, explained" (not "Delta") and verify before uploading.

**Pinned comment** (post and pin after the Short is live; scheduled videos can't take comments before):

> A second tip, from the FTC's alert of Mar 20, 2023: "Call the person who supposedly contacted you and verify the story." "Use a phone number you know is theirs." Its short version: "Don't trust the voice." Who would you set up a secret word with first?

Backup reply for "can anyone do this now?": Microsoft hasn't released it. Its VALL-E 2 page says "VALL-E 2 is purely a research project. Currently, we have no plans to incorporate VALL-E 2 into a product or expand access to the public." (read Nov 1, 2026: https://www.microsoft.com/en-us/research/project/vall-e-x/vall-e-2/). Don't name or compare other cloning tools.

**Description** (2983 characters, under YouTube's 5,000; paste it in full, the PC can't read repo files). No < or > characters (checked by script):

```
Only three seconds of your voice. So how does AI voice cloning work?

It's in Microsoft's own 2023 paper. The VALL-E paper says the model "can be used to synthesize high-quality personalized speech with only a 3-second enrolled recording of an unseen speaker as an acoustic prompt."

Here's how. A neural audio codec turns the recording into "discrete codes", which are just numbers: three seconds becomes about 1,800 of them. Then the model predicts new numbers for words you never said, and the codec turns those numbers back into sound. To the model, your voice is just numbers. Microsoft's own page adds the condition: "the similarity, and naturalness depend on the length and quality of the speech prompt". And it says: "This page is for research demonstration purposes only."

On Dec 3, 2024, the FBI warned: "Criminals generate short audio clips containing a loved one's voice to impersonate a close relative in a crisis situation, asking for immediate financial assistance or demanding a ransom." Its first tip on the same page: "Create a secret word or phrase with your family to verify their identity." A copy has your sound, not your secret.

So, does your family have one? Yes or no.

Fine print: "1,800 numbers" is our math from the paper, not a figure it prints: its codec makes 75 slices a second with 8 codes each ("given a 10-second waveform, the discrete representation is a matrix with 750 × 8 entries"), so 3 seconds = 225 × 8 = 1,800. The paper card, the number tape, the FBI folder and the phone in the video are hand-made re-creations; the tape's digits are illustrative, not real codes from anyone's voice, and no real app or logo is shown. VALL-E is a Microsoft research model, not a product; this video names no cloning tool and doesn't say what any commercial tool needs. The FBI notice is a warning, not a study; this video gives no case counts or dollar figures. "A copy has your sound, not your secret" is our plain wording for why the tip works; it says nothing about detecting a fake.

Sources:
- Wang et al. (Microsoft), "Neural Codec Language Models are Zero-Shot Text to Speech Synthesizers", arXiv 2301.02111, submitted Jan 5, 2023, read Nov 1, 2026: https://arxiv.org/abs/2301.02111
- Microsoft Research, VALL-E project page, read Nov 1, 2026: https://www.microsoft.com/en-us/research/project/vall-e-x/vall-e/
- FBI (IC3) Public Service Announcement I-120324-PSA, "Criminals Use Generative Artificial Intelligence to Facilitate Financial Fraud", Dec 3, 2024, read Nov 1, 2026: https://www.ic3.gov/PSA/2024/PSA241203
- FTC Consumer Alert, "Scammers use AI to enhance their family emergency schemes", Alvaro Puig, Mar 20, 2023, read Nov 1, 2026: https://consumer.ftc.gov/consumer-alerts/2023/03/scammers-use-ai-enhance-their-family-emergency-schemes

How AI works, part 7. The research, script and hand-built animation are made for this channel.

#shorts #voicecloning
```

### Quote check (all re-read 2026-11-01)
- arXiv 2301.02111 abstract and PDF v1: "can be used to synthesize … as an acoustic prompt." and "given a 10-second waveform, the discrete representation is a matrix with 750 × 8 entries" (PDF text, §4.1 area, with "75 Hz" and "eight hierarchy quantizers with 1024 entries each"). Submitted Thu Jan 5, 2023.
- Microsoft VALL-E page: "This page is for research demonstration purposes only." and "the similarity, and naturalness depend on the length and quality of the speech prompt" (via fetch; curl got 403).
- FBI PSA241203 (curl, full page text): number I-120324-PSA, December 3, 2024, title as quoted; the "Criminals generate short audio clips…" sentence and "Create a secret word or phrase with your family to verify their identity." are word for word. The FBI's hang-up tip on that page is about a "bank or organization purporting to call you", so it is not used for family calls.
- FTC alert (Alvaro Puig, March 20, 2023): title, "Call the person who supposedly contacted you and verify the story.", "Use a phone number you know is theirs." and "Don't trust the voice." confirmed via a fetch tool (curl got a 404 page, as for the researcher). The URL loads in a browser through that tool; open it once before pinning.

## TikTok (for later, when the hold clears)

**Title / search phrase:** How does AI voice cloning work?

**Caption** (225 chars):

```
How does AI voice cloning work? Microsoft's VALL-E research turned a 3-second recording into numbers, then predicted new ones in that voice.
The FBI's tip: a secret word with your family.
Does your family have one? Yes or no.
```

**Hashtags:** #voicecloning #aivoice #scamalert #learnontiktok (no #safeword: on TikTok it mostly means something else; "family safe word" stays in the keywords)

**Keywords** (the first, "ai voice cloning", is spoken in `ask` at about 2.2-4.4 s and shown as HOW DOES AI VOICE CLONING WORK? from about 2.2 s; volumes not checked; "family safe word" is the phrase US news and safety pages use for the FBI's "secret word", searched 2026-11-01): ai voice cloning; how does ai voice cloning work; ai voice clone scam; family safe word; secret word scam call; fbi ai voice warning; vall-e 3 seconds; grandparent scam ai voice

**Cover:** "Your voice: 3 seconds" at 0.0 s (frame 0 per TREATMENT: YOUR VOICE: / 3 SECONDS, the paper mic and the 3 s strip gliding to the speaker). The YouTube poster (out/poster.jpg, last render) is the hero tape with JUST NUMBERS under "How AI clones your voice".

**Post time:** first 19:00 ET slot after the hold clears (see slot note above).

**Disclosure:** No AI label (Isac 2026-11-03): YouTube Altered content: No. Stock narrator voice over hand-made animation, nothing realistic or impersonated. TikTok label: see factory/TIKTOK-PLAYBOOK.md row 14.

### Sounds (checked 2026-11-01, Higgsfield tiktok_music_trending, US, 7DAY)

1. **Final Game Showdown - ProdByLucK (first pick, keep near 5 %)**: Low tension bed under 'criminals fake loved ones' voices' without turning the explainer into horror. Checked 2026-11-01: #4 on Higgsfield tiktok_music_trending (US, ALL, 7DAY); track 114 s, covers the ~32 s film. Never the sound on a posted video (it was a backup on agent, phonephoto, qrcode and memory). Vocals not checked: preview it in the app first.
2. **Suspicious News / Investigative Journalism / Report / ... (1135704) - Ney**: A newsroom/investigation library bed, which suits the FBI folder and the paper card. Checked 2026-11-01: #63 on the same Higgsfield US 7DAY chart; 299 s. Instrumental by its library title (not listened to). Lower in the chart, so it's the pick only if #1 sounds wrong in the app.
3. **Time Back - Sinny & 7vvch (third pick)**: Checked 2026-11-01: #5 on Higgsfield US 7DAY; 180 s. A slow, moody beat that can sit under a voice; vocals and mood not checked, so preview it first and skip it if there's singing.

Checked by rule with the Higgsfield call on 2026-11-01 (US, 7DAY, top 100). Skipped from the same chart: Sunset in Girona (#1, phonephoto's sound, 0-view post), Self Aware (#2, retired), Hidden Truth Revealed (#3, agent's first pick, 0-view post; the last three posts' sounds are off limits), Espresso Soul (#66, retired). No separate web chart was read this pass. YouTube Shorts goes out with the film's own mix (voice, room tone, the thump and the folder slap), no music added. TikTok later: Isac adds the sound in the app at about 5-10 % under the voice-only cut in out/ (film about 31.9 s by the script; the clip must run at least 0:32). It can't be changed after posting.

## Two alternative hooks (an A/B on caption/cover or YouTube title, never a re-upload)

1. **"The FBI says your family needs a secret word."** The DM line from the brief, the one people send their parents. Caption line 1: "The FBI says to make a secret word with your family. Here's how AI voice cloning works, and why that word beats it." Cover: *Your family needs a word*. Keep "warned" and "secret word or phrase"; never "the FBI found" or a number of victims.
2. **"To AI, your voice is just numbers."** The hero stamp. Caption line 1: "To an AI voice cloning model, your voice is just numbers. Microsoft's VALL-E paper used a 3-second clip." YouTube title: *Your Voice Is Just Numbers 🤔*. Cover: *Your voice = numbers*. Keep "research" and "3-second clip"; never "any app can" or "perfect copy".

## US growth actions for Isac after posting

1. **First hour:** reply to the first US commenters within the hour with a sourced extra fact (the FTC's "Use a phone number you know is theirs."; Microsoft says VALL-E 2 isn't a product). If someone asks which app clones voices or how to do it, don't name one; say the video sticks to the paper. If someone shares a scam story, thank them and point to the FBI page, never add numbers. Answer a "this is AI" comment with the source links, what we made by hand, and that the narrator is a stock voice, not a clone of anyone.
2. **One US creator to stitch or duet (TikTok, after it resumes):** a US scam-awareness or "protect your parents" creator who already covers grandparent or family-emergency scams. Check they're US-based and on-topic first. Under 60 s, so stitch and duet are on.
3. **Promote boost:** not now. TikTok is on hold and YouTube views per Short fell to 12-17 in late October, so a boost can't tell us whether the hold or the content is the problem. This topic is the best boost candidate so far once TikTok serves posts again (it's shareable to parents): boost small, US, interest "Technology" and adults 35+, only if completion beats Hallucinate's 9.1 % and average watch is over 15 s.
