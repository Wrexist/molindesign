# SEO: Your Password Length Changes Everything (whatif-password)

Factory #23 · How tech works, part 7 · film about 37 s (Ming US_James, 36.87 s) · packaged 2026-11-06

**YouTube Shorts only for now** (channel "Tech, explained"; TikTok paused under the account-level hold). The TikTok pack below is for when it resumes.

**No AI tag (Isac, 2026-11-03), overrides video-seo.md:** no "AI voice", "AI-generated" or narration-disclosure line in the title, description, captions or comments; no #ai; YouTube **Altered content: No**. The fine print says the props are hand-drawn by us; that's a note about the picture, not an AI disclosure. TikTok's is_aigc toggle is handled separately.

**Truth rules (jury notes, applied everywhere):**
- Every crack time is **Hive Systems' 2026 table** for a **random, lowercase** password whose **bcrypt (cost 10) hash was stolen and cracked offline on 16 RTX 5090s** ("two 8x RTX 5090 setups running at a measured 138,675 hashes per second combined"). The description says so in its second paragraph and again in the fine print; the TikTok caption names the table, the stolen hash and the rig.
- **"Over four quadrillion years" for 20 letters is our math** (26^20 ÷ 138,675 per s ≈ 4.55 quadrillion years, 365.25-day years); Hive's table stops at 18. Every copy that uses it says "our math". Re-checked today: the same sum gives Hive's cells back (8 → 17.4 days, 9 → 1.24 years, 12 → 21,806 years, 18 → 6.74 trillion years).
- **NIST SP 800-63B-4's 15 characters** applies to federal and NIST-following logins where the password is used with no second factor ("single-factor"), never "every site"; with a second factor NIST allows a minimum of eight.
- **CISA** is quoted exactly, with both ellipses, from the MFA topic page's **Wayback Machine snapshot of 2026-10-23** (20261023204225), because the live page returned 403: "…unauthorized users will be unable to meet the second authentication requirement…". Checked against the snapshot text today. The page's "99% less likely to be hacked" line is not used (BRIEF kept it out).
- **Defensive only:** no tool, wordlist, method or hash string anywhere in the copy; the "how do they crack it" reply declines on purpose.
- Quotes were matched today against the live Hive page, the live NIST page and the CISA snapshot (downloaded and searched by script). YouTube rejects < and >; none in the description (checked by script).

**Playlist:** How tech works (BRIEF.md and script.json say How tech works; the earlier security film, incognito, is How tech works, part 6, and no How tech works Short has been posted since, so this is **part 7**; the parked `password` film never got a part number). **Altered content:** No (every prop is hand-drawn and plainly illustrated; no real person, place, event, account or app screen is shown).

## YouTube Shorts

**Title:** Your Password Length Changes Everything 😱 (5 words, 42 characters)
- **Why not the brief's "What If Your Password Had 20 Letters? 😮":** picked by the packaging rules (PERFORMANCE.md §7, mark 5). The what-if title puts the thing in words 3-4, not 1-3, and has no consequence verb, so it gives up the title point; the channel's only what-if title so far (cables, long-form) got 21 views. "Your Password Length Changes Everything 😱" has the thing in words 1-3, a consequence verb, 5 words, Title Case and the danger emoji, and it's true at every level of the film (length moves the crack time from 2 weeks to over 4 quadrillion years by our math, and reuse drops it to instantly). It's vaguer, so the description's first line carries the numbers. The what-if still runs inside the film (line 3, "What if it were twenty letters?").
- Alternatives: *What If Your Password Had 20 Letters? 😮* (the format test, for a 24 h title swap if the first title stalls) · *Why Reused Passwords Crack Instantly 😱* (Hive's second table; the swap if the comments are all about reuse)
- The search phrase **how long should your password be** is spoken word for word in line 2 (`ask`, from about 2.7 s), shown on screen from `ask`, the first tag, and the description's first words.

**Tags** (359 characters): how long should your password be, how long should a password be, how long to crack a password, password crack time, hive systems password table 2026, is a 20 character password safe, password length, nist password guidelines, nist 15 character password, two-step verification, 2fa, multifactor authentication, password security, how tech works, tech explained. No bare "ai" tag, no "shorts", no tool names.

**Slot:** YouTube Shorts: the first free Tech, explained slot after energy (the orchestrator confirms which is free). 19:00 ET (EST) Fri Nov 6 = 00:00 UTC Sat Nov 7 if free; otherwise 13:00 ET Sat Nov 7 = 18:00 UTC. Both slots have produced winners (incognito 13:00, voiceclone 19:00). Pick the time from YouTube Studio's dropdown and check the saved UTC time. Post only on a jury pass. TikTok: on hold (account-level hold); when it resumes, the first 19:00 ET slot.

**Stockholm:** 01:00 Sat Nov 7 (19:00 ET slot) or 19:00 Sat Nov 7 (13:00 ET slot). Sweden CET, US EST, 6 h apart.

Switch YouTube Studio to "Tech, explained" (not "Delta") and verify before uploading.

**Pinned comment** (273 characters; post and pin after the Short is live):

> One more from the same NIST rules (SP 800-63B-4, July 2025): logins that follow them "…SHALL NOT require subscribers to change passwords periodically", but must force a change if there's evidence it was compromised. Does a site still make you change yours every few months?

The new fact isn't in the film: NIST SP 800-63B-4 §3.1.1.2, the same section as the 15-character rule, read live today: "Verifiers and CSPs SHALL NOT require subscribers to change passwords periodically. However, verifiers SHALL force a change if there is evidence that the authenticator has been compromised." Scoped to "logins that follow them", the quote is cut with an ellipsis at the front, and the question asks for a yes/no plus a story (everyone has a work login that makes them do it).

**First-hour reply plan** (Isac, or the orchestrator's drafts for Isac): reply to the first US commenters within the hour with a sourced extra fact. Ready replies:
- "Mine has symbols and numbers, so I'm fine." Only if it's random and long. Hive's 2026 FAQ: a random 8-character password using numbers, upper- and lowercase letters and symbols "would take a hacker about 132 years" offline. Length adds more: "Each additional character multiplies the number of possible combinations far more than adding another symbol type does". And if it's reused or real words, it's "Instantly" either way.
- "Should I use a password manager?" NIST's rules (SP 800-63B-4) say logins that follow them "SHALL allow the use of password managers and autofill functionality." A manager makes long, random and never-reused easy. Then turn on two-step for your email.
- "Why bcrypt? What if a site stores passwords badly?" Hive picked bcrypt because "it's the hashing method most commonly found in real-world breaches". Every time in the video assumes it. That's also why the video ends on two-step: Hive's table assumes MFA "isn't used or has been bypassed".
- "Four quadrillion? Hive's table says that?" No, and the video says "by our math". Hive's table stops at 18 letters. We took Hive's measured 138,675 guesses a second and did 26^20 ÷ 138,675 ≈ 4.55 quadrillion years. The same sum gives back Hive's own cells (17.4 days for 8 letters, 21,806 years for 12).
- "So every site has to allow 15?" No. NIST SP 800-63B-4 binds federal systems and logins that choose to follow it, and the 15 is for a password used with no second step; with two-step NIST allows a minimum of eight. Most sites set their own rules.
- "How do they actually crack it?" We don't show that, on purpose. This one is about how long and what to do: go long, never reuse, turn on two-step.
- If a viewer asks whether this video is AI: answer honestly. The props are hand-drawn by us. Never claim the voice is a human's.
- "This is AI slop" copypasta: no argument; reply once with the Hive table link and "every prop here is hand-drawn by us", or leave it.

**Description** (4073 characters, 4087 bytes, under YouTube's 5,000; paste it in full). No < or > characters (checked by script). Sources with URLs, all read Nov 6, 2026.

```
How long should your password be? On Hive Systems' 2026 rig, with the hash already stolen, eight random lowercase letters can be cracked in about two weeks. Twenty would take over four quadrillion years, by our math. But a reused password, or one made of real words, falls instantly at any length.

The table. Hive Systems' 2026 Password Table (July 14, 2026) times how long it takes to crack a password after its hash was stolen, offline, on 16 RTX 5090 graphics cards: "two 8x RTX 5090 setups running at a measured 138,675 hashes per second combined", against a bcrypt (cost 10) hash. Its Lowercase Letters column, for random passwords: 8 letters, 2 weeks. 9 letters, 1 year. 12 letters, 21k years. 18 letters, 6tn years. The table stops at 18.

Each letter multiplies. Hive: "Each additional character multiplies the number of possible combinations far more than adding another symbol type does…" With lowercase letters, every extra random letter multiplies the possible passwords by 26.

Twenty letters is our math, not Hive's. 26^20 possible passwords ÷ 138,675 guesses a second ≈ 4.55 quadrillion years (365.25-day years). The same sum gives back Hive's own cells: 17.4 days for 8 letters, 1.24 years for 9, 21,806 years for 12, 6.7 trillion years for 18.

Reused or real words? Instantly. Hive's second table, "Password table if your password has been previously stolen, uses dictionary words, or if you reuse it between websites.", says "Instantly" in every cell, from 4 to 18 characters.

So how long? NIST SP 800-63B-4 (July 2025): "Verifiers and CSPs SHALL require passwords that are used as a single-factor authentication mechanism to be a minimum of 15 characters in length." That's for federal systems and logins that follow NIST, when the password is the only step; it isn't a rule for every site.

Turn on two-step. CISA: "…unauthorized users will be unable to meet the second authentication requirement…"

Is it on for your email? Yes or no.

Fine print: every crack time in this video comes from Hive Systems' 2026 table for a RANDOM, LOWERCASE password whose bcrypt (cost 10) hash was stolen and cracked offline on 16 RTX 5090 cards at 138,675 hashes a second. Hive's own limits: "These metrics assume passwords are randomly generated." "Non-random passwords are much easier and faster to crack…" "These metrics assume a password that hasn't been part of a past breach." "The implied attack assumes MFA isn't used or has been bypassed." The 20-letter "over four quadrillion years" is our arithmetic at Hive's measured speed (26^20 ÷ 138,675 per second ≈ 4.55 quadrillion years); Hive's table ends at 18 characters. NIST's 15 characters applies to federal and NIST-following logins where the password is used with no second factor; with a second factor NIST allows a minimum of eight. The CISA quote is from its Multifactor Authentication page as saved by the Wayback Machine on Oct 23, 2026, because the live page refused our download (403); the ellipses mark where the sentence goes on. This video says how long and what to do, never how: no tools or methods are shown. The passwords on screen are made-up examples. Every prop (the paper password field, the letter tiles, the crack-time tag, the torn table strips, the guideline card, the phone and the envelope) is hand-drawn by us; no real app screen or account is shown.

Sources (all read Nov 6, 2026):
- Hive Systems (Corey Neskey), "Are Your Passwords in the Green?", 2026 Password Table, published July 14, 2026, updated July 21, 2026: https://www.hivesystems.com/blog/are-your-passwords-in-the-green
- NIST SP 800-63B-4, "Digital Identity Guidelines: Authentication and Authenticator Management", July 2025: https://pages.nist.gov/800-63-4/sp800-63b.html (status page: https://csrc.nist.gov/pubs/sp/800/63/b/4/final)
- CISA, "Multifactor Authentication" (undated page), Wayback Machine snapshot of Oct 23, 2026: https://web.archive.org/web/20261023204225/https://www.cisa.gov/topics/cybersecurity-best-practices/multifactor-authentication

How tech works, part 7.

#passwords #cybersecurity #2fa
```

### Quote check (2026-11-06; matched by script against the downloaded text)
- **Hive Systems**, "Are Your Passwords in the Green?" (Corey Neskey; `datePublished` 2026-07-14, `dateModified` 2026-07-21): "two 8x RTX 5090 setups running at a measured 138,675 hashes per second combined"; "Each additional character multiplies the number of possible combinations far more than adding another symbol type does"; "Password table if your password has been previously stolen, uses dictionary words, or if you reuse it between websites."; "These metrics assume passwords are randomly generated."; "Non-random passwords are much easier and faster to crack"; "These metrics assume a password that hasn't been part of a past breach."; "The implied attack assumes MFA isn't used or has been bypassed."; replies: "would take a hacker about 132 years" (random 8-character full mix), "it's the hashing method most commonly found in real-world breaches". Table cells (8 = 2 weeks, 9 = 1 year, 12 = 21k years, 18 = 6tn years, second table all "Instantly") as BRIEF.md read them off the images today.
- **NIST SP 800-63B-4** (CSRC: Date Published July 2025): "Verifiers and CSPs SHALL require passwords that are used as a single-factor authentication mechanism to be a minimum of 15 characters in length. Verifiers and CSPs MAY allow passwords that are only used as part of multi-factor authentication processes to be shorter but SHALL require them to be a minimum of eight characters in length."; pinned: "Verifiers and CSPs SHALL NOT require subscribers to change passwords periodically."; reply: "Verifiers SHALL allow the use of password managers and autofill functionality."
- **CISA**, Multifactor Authentication, Wayback snapshot 20261023204225: "MFA increases security because even if one credential becomes compromised, unauthorized users will be unable to meet the second authentication requirement and will not be able to access the targeted physical space, computing device, network, or database." Quoted as "…unauthorized users will be unable to meet the second authentication requirement…".

## TikTok (for later, when the hold clears)

**Title field / search phrase** (126 characters, under 150): How long should your password be? 8 random lowercase letters: about 2 weeks to crack. 20: over 4 quadrillion years (our math).

**Caption** (260 characters):

```
How long should your password be? 8 random lowercase letters: about 2 weeks to crack. 20: over 4 quadrillion years (our math).
Hive Systems 2026 table, stolen bcrypt hash, 16 RTX 5090s. Reused or real words? Instantly.
Is two-step on for your email? Yes or no.
```

**Hashtags:** #techexplained #passwords #cybersecurity #passwordsecurity #2fa (one broad tag plus four precise ones; no #ai, no #fyp spam)

**Keywords** (the first is spoken word for word in line 2 and on screen from then; volumes not checked): how long should your password be; how long to crack a password; password crack time 2026; hive systems password table 2026; is a 20 character password safe; nist password length 15; turn on two step verification; how long should a password be

**Cover:** "HOW LONG IS YOURS?" at 0.0 s (frame 0: the masked 8-dot paper field, the viewer's own test). The YouTube poster is out/poster.jpg.

**Sounds:** Not checked this pass: TikTok is on hold, and a trending-sound pick goes stale in days. When TikTok resumes, run Higgsfield tiktok_music_trending (US, 7DAY) on the post day and pick an instrumental bed at 5-10 % under the voice-only cut (about 37 s; the sound must be at least that long). Skip Self Aware and Espresso Soul (retired) and the last three posts' sounds. YouTube Shorts goes out with the film's own mix, no music added.

## Two alternative hooks (an A/B on caption, cover or YouTube title, never a re-upload)

1. **"What if it were twenty letters?"** Caption line 1: "What if your password had 20 letters? Over 4 quadrillion years to crack, by our math at Hive Systems' 2026 speed." YouTube title: *What If Your Password Had 20 Letters? 😮*. Cover: *20 LETTERS?* Always "by our math"; never "uncrackable" or "forever".
2. **"Reused? Instantly."** Caption line 1: "A long password doesn't help if it's reused: Hive Systems' 2026 table says 'Instantly' at every length." YouTube title: *Why Reused Passwords Crack Instantly 😱*. Cover: *REUSED = INSTANT?* Keep "Hive Systems' 2026 table"; never "every password is cracked instantly".

## US growth actions for Isac after posting

1. **First hour:** reply to the first US commenters within the hour with a sourced extra fact (ready replies above). "Mine has symbols" gets the 132-years reply; "password manager?" gets the NIST autofill reply; "is 4 quadrillion from Hive?" gets the our-math reply. Never explain a method, even when asked.
2. **One US creator to stitch or duet (TikTok, after it resumes):** a US cybersecurity explainer who already does password and two-step tips (check they're US-based and on-topic first). The INSTANTLY flip ("reused or real words?") invites a "here's how to check if yours was in a breach" stitch. Under 60 s, so stitch and duet are on.
3. **Promote boost:** not yet. It's the first what-if format test and the title gave up the what-if wording, so read it at 24 h first (voiceclone slept 6 h before taking off). Boost only if it beats incognito's first-day pace: small, US, interest "Technology", adults 25-44. TikTok stays on hold until the account check clears.
