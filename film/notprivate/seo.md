# notprivate: SEO and packaging (Factory #30)

Written 2026-11-13 by the video-seo agent while the film may still get jury fixes (only film.js and out/ change; nothing here depends on frame times beyond cover_time 0.0). Voice lines as final: "On a banking site, never click through." and "Have you ever clicked through? Yes, or no?" (captions: "Yes or no."). YouTube Shorts ("Tech, explained") only; TikTok is on hold. **No AI tag anywhere** (Isac, 2026-11-03). **Never "it's safe":** every piece of copy keeps "not always" and says a real attack is possible; no "false alarm", "harmless" or "ignore it" claims. The 2016–17 study figure always carries its scope (Chrome on Windows, Apr 2016–Mar 2017).

## YouTube

**Title:** Why Your Connection Is Not Private 🤔
Chose "Why Your Connection Is Not Private": it is Chrome's own heading word for word, the thing ("Your Connection") sits in words 2-3, and the top Google US suggestion for the phrase is "why does it say your connection is not private" (also "why is my connection not private", checked Nov 13, 2026). It matches the poster ("Why it says not private") and the spoken line at about 3 s. 6 words, Title Case, one emoji at the end, the why-shape that started fastest (coldbattery 772 in 6 h, deletephoto 757 in 12 h), not a definition, no #Shorts. Truth: it promises the why, which the film gives (clock, Wi-Fi, the site, or someone pretending), and says nothing about safety. "That Warning Doesn't Mean You're Hacked" repeats the spoken hook, so it stays an A/B alternative; on its own it could read as "it's safe", which the film doesn't say.

**Alternatives:** That Warning Doesn't Mean You're Hacked 😱 · Why Chrome Says Not Private 🤔

**Playlist:** How tech works · **Series:** How tech works, part 13 (unlimiteddata was part 12) · **Altered content:** No

**Post time:** YouTube Shorts: 13:00 ET (EST) Fri Nov 13, 2026 = 18:00 UTC. The day's filler posts at 09:00 ET (14:00 UTC), so the new film lands 4 h later in the US lunch slot that deletephoto, forceclose, airplanemode and unlimiteddata used, when people check their phones on a break; it's also 24 h after unlimiteddata's primary slot (18 h after its fallback). Fallback: 19:00 ET Fri Nov 13 = 00:00 UTC Sat Nov 14, if the film isn't uploaded and checked by about 12:30 ET (10 h after the filler). No hard deadline: the voice has no dates, and the description's 'checked Nov 13, 2026' dates the facts. Pick the time from YouTube Studio's dropdown and check the saved UTC time. Run python3 factory/repost.py check before scheduling. TikTok: on hold.
**Stockholm:** 19:00 Fri Nov 13 (Sweden CET, US EST, 6 h apart; filler at 15:00). Fallback 01:00 Sat Nov 14.

**Tags** (405 characters, under the 500 cap): your connection is not private, why does it say your connection is not private, your connection is not private meaning, your connection is not private fix, your connection is not private chrome, why is my connection not private, is your connection is not private dangerous, net::err_cert_date_invalid, your clock is behind, ssl certificate error, privacy error chrome, wifi sign in page, how tech works, tech explained
(No browser or company names except "chrome", which is in the phrases people search; "net::err_cert_date_invalid" is Chrome Help's own code for the clock case.)

**Description** (4360 characters, under the 4,500 cap; no angle brackets anywhere; opens with the answer and the "not always"; every quote word for word; fine print says a real attack is possible, names the other causes, the re-creations and not-affiliated). Paste it in full:

```
Why does your browser say "Your connection is not private"? The warning on its own doesn't mean you've been hacked. It means your browser stopped before loading the page. Every secure site shows your browser a certificate, a dated ID card. Your browser checks it, dates included, against your device's own clock; if it can't verify it, you get this warning instead of the site. Often the cause is boring: your date and time are off, a Wi-Fi sign-in page got in the way, or the site's certificate is expired or set up wrong. But not always. Sometimes someone really is pretending to be the site, and the warning can't tell you which.

What Chrome says. Chrome Help: if you get a full-page error message saying "Your connection is not private," then "there's a problem with the site, the network, or your device." Chrome's warning itself: "Attackers might be trying to steal your information from" the site "(for example, passwords, messages, or credit cards)." Chrome's details text on some of these warnings: "the website sent back unusual and incorrect credentials. This may happen when an attacker is trying to pretend to be" the site, "or a Wi-Fi sign-in screen has interrupted the connection." And: "Chrome stopped the connection before any data was exchanged."

The clock. Chrome: "the certificates that websites use to identify themselves are only valid for specific periods of time. Since your device's clock is incorrect, Chrome cannot verify these certificates." Firefox: "Websites prove their identity via certificates, which are valid for a set time period."

The study. Google researchers (Acer et al., ACM CCS 2017) studied Chrome's certificate error reports "from April 2016 through March 2017." They found that "a wide range of non-attack circumstances trigger hundreds of millions of spurious browser warnings per month," and: "For Windows, client clock errors account for more than 30% of all certificate warnings." (33.5% of Windows reports in the paper's Table 1.) That figure is Chrome on Windows, Apr 2016 to Mar 2017, before the paper's improved clock check reached Chrome in May 2017. It is not today's share.

Wi-Fi. Chrome Help, "Step 1: Sign in to the portal": "You need to sign in to Wi-Fi networks at places like cafes or airports."

What to do. Chrome Help: "To fix this error, open your device's clock. Make sure the time and date are correct." Firefox: "If your clock is already set to the right time, the website is likely misconfigured, and there is nothing you can do to resolve the issue." Apple's Safari guide uses banking as its example: "When you visit an encrypted website—for instance, to do online banking—Safari checks if the website's certificate is legitimate. If it's not, you get a warning message." On a banking, shopping or login site, don't press "Proceed" or "Accept the Risk and Continue." Go "Back to safety."

So, have you ever clicked through? Yes or no.

Fine print: A boring cause is common, not certain. This video does not say any one warning is safe; a real attack is possible, and the warning can look the same. Chrome Help also names antivirus "HTTPS scanning" and some work computers that perform "HTTPS interceptions" as causes. The warning screens, ID card, door and quotes on screen are re-created by hand; no real browser interface or logo is shown. Not affiliated with Google, Apple, Mozilla or Microsoft.

Sources (all read Nov 13, 2026):
- Google Chrome Help, "Check if a site's connection is secure": https://support.google.com/chrome/answer/95617
- Google Chrome Help, "Get help with common error messages in Chrome": https://support.google.com/chrome/answer/95669
- Chromium, Chrome's warning text: https://chromium.googlesource.com/chromium/src/+/refs/heads/main/components/security_interstitials_strings.grdp
- Firefox, warning text: https://github.com/mozilla-firefox/firefox/tree/main/toolkit/locales/en-US/toolkit/neterror
- Apple, Safari User Guide, "Avoid fraud by using encrypted websites in Safari on Mac": https://support.apple.com/guide/safari/avoid-fraud-by-using-encrypted-websites-sfri40697/mac
- Acer et al., "Where the Wild Warnings Are: Root Causes of Chrome HTTPS Certificate Errors," ACM CCS 2017: https://research.google/pubs/where-the-wild-warnings-are-root-causes-of-chrome-certificate-errors/

How tech works, part 13.

#techexplained #cybersecurity #internetsafety
```

**Pinned comment** (post after the video is live; the yes/no matches the end line "Have you ever clicked through? Yes or no."):

> Not every one is a false alarm, so check before you click. Chrome Help's first fixes: "Make sure the time and date are correct," and sign in to the Wi-Fi portal "at places like cafes or airports." On a banking site, go back instead. Have you ever clicked through? Yes or no.

**Ready replies for the first hour:**
- **If:** So it's safe to click through?
  **Reply:** No, not on its own say-so. The screen looks the same for a wrong clock and for a real attack. Chrome's own warning: "Attackers might be trying to steal your information from" the site "(for example, passwords, messages, or credit cards)." Fix your clock and sign in to the Wi-Fi first; if it still shows on a bank, shopping or login site, go back.
- **If:** My clock is right and it still shows.
  **Reply:** Then it's likely the site, the network, or something on your device. Firefox's own text: "If your clock is already set to the right time, the website is likely misconfigured, and there is nothing you can do to resolve the issue." Chrome Help also names antivirus "HTTPS scanning" and work computers that perform "HTTPS interceptions." Try later or on another network, and don't log in until it's gone.
- **If:** Is a third still true today?
  **Reply:** We don't know today's share. The one third is from Google's study of Chrome error reports "from April 2016 through March 2017," Windows only: "For Windows, client clock errors account for more than 30% of all certificate warnings." Chrome added a better clock check in May 2017 and now often shows "Your clock is behind" instead.

### Quote check (2026-11-13: every source downloaded with curl, the PDF through pdftotext, Chromium's strings file decoded from base64; every quoted passage in the description, pinned comment and ready replies matched by script against today's text after curly quotes and whitespace were straightened: 37 of 37 found)
- Chrome Help 95617: "Your connection is not private," + "there's a problem with the site, the network, or your device."
- Chrome Help 95669: "Step 1: Sign in to the portal", "You need to sign in to Wi-Fi networks at places like cafes or airports.", "To fix this error, open your device's clock. Make sure the time and date are correct.", "HTTPS scanning", "HTTPS interceptions".
- Chromium security_interstitials_strings.grdp (main, today): IDS_SSL_V2_HEADING, IDS_SSL_V2_PRIMARY_PARAGRAPH ("Attackers might be trying …"), IDS_SSL_NONOVERRIDABLE_MORE ("… pretend to be …", "Chrome stopped the connection before any data was exchanged."), IDS_CLOCK_ERROR_EXPLANATION, IDS_SSL_OVERRIDABLE_SAFETY_BUTTON ("Back to safety"), "Proceed to [site] (unsafe)", "Your clock is behind".
- Firefox netError.ftl / certError.ftl (main, today): "Websites prove their identity via certificates, which are valid for a set time period.", "If your clock is already set to the right time …", "Accept the Risk and Continue". support.mozilla.org still returns a "Client Challenge" page today, so it's not cited.
- Apple Safari User Guide: the online-banking sentence (em dashes as on the page).
- Acer et al., CCS 2017 (PDF): "from April 2016 through March 2017", "a wide range of non-attack circumstances …", "For Windows, client clock errors account for more than 30% …"; 33.5% read from Table 1. §10.1: the secure time clock check "launched to Chrome stable in May 2017" (a build-time clock warning already existed during the sample, so the copy says "improved clock check", not "added").
- **Kept out:** "usually harmless", "most warnings are false alarms" or any share for today (no source gives one); "just fix your clock and proceed"; the 200-day certificate limit (true per CA/B Forum BR 2.3.1, read today, but a second idea and the description needed the room); any real bank or store name; Safari's own warning-screen text (not read).

## TikTok (for later, when the hold clears)

**Caption** (254 characters; line 1 = the search phrase + the hook):
```
Why does it say your connection is not private? That warning doesn't mean you're hacked.
Your browser checks the site's dated ID card against your own clock, and stops if it fails. Usually boring, but not always.
Have you ever clicked through? Yes or no.
```
**Hashtags:** #techexplained #cybersecurity #internetsafety #googlechrome #techtips
**Keywords:** your connection is not private, why does it say your connection is not private, your connection is not private meaning, what does your connection is not private mean, your connection is not private fix, your connection is not private chrome, why is my connection not private, net::err_cert_date_invalid (main phrase "your connection is not private": spoken in `ask` at about 2.5–5 s, typed search bar YOUR CONNECTION IS NOT PRIVATE on screen by about 1.5–3 s; Google US suggests "your connection is not private meaning", "… fix", "… chrome", "why does it say your connection is not private" and "why is my connection not private", checked Nov 13, 2026)
**Cover text:** Not private. Hacked? (cover_time 0.0: the re-created warning with NOT PRIVATE and HACKED?; the YouTube poster out/poster.jpg is the YOUR BANK door with the coral chain under "Why it says not private")
**Sounds:** Not checked this pass: TikTok is on hold and a trending-sound pick goes stale in days (same call as unlimiteddata, airplanemode, coldbattery, deletephoto and forceclose). When TikTok resumes, run Higgsfield tiktok_music_trending (US, 7DAY) on the post day and pick a calm instrumental at 5-10 % under out/notprivate-voice-only.mp4 (the cut runs about 34 s; the sound must be at least 35 s). YouTube Shorts goes out with the film's own mix, no music added.

## Two alternative hooks for an A/B repost
1. "Your own clock can make a real website look fake." (the DM-able beat as the opener, calendar flipping back on frame 0; follow at once with "That's one reason it says your connection is not private" so the search phrase stays in the first 5 s, and keep the scope: "can", not "does")
2. "Airport Wi-Fi can make your phone say your connection is not private." (holiday-travel version for Thanksgiving week; frame 0 the Wi-Fi clerk at the peephole; `dip` and `bank` unchanged so the real-attack line stays)

## Three US-growth actions after posting
1. **Reply to the first US commenters within the hour.** Use the ready replies above; answer each "yes" or "no" with one sourced line and a question back (what site was it?). Expect "so it's safe to click through?": the answer is always no on a bank, shopping or login site, with Chrome's own "Attackers might be trying …" line. Never call a viewer's warning a false alarm. Never claim the voice is a person's; if asked, answer honestly.
2. **One US creator to stitch, duet or react.** A US online-safety or "tech tips for parents/grandparents" creator (scam-awareness explainers) is the natural partner: "Have you ever clicked through?" is a confession their audience answers. On YouTube, comment on or reply with a Short to their scam-warning post rather than asking for a shoutout; on TikTok, a stitch when the hold clears.
3. **Promote boost?** Not on day one. Wait 24 h: if views and the yes/no thread beat coldbattery's first day (772 in 6 h), a small US-targeted boost in Thanksgiving travel and Black Friday week (Wed Nov 25 to Mon Nov 30, 2026: airport Wi-Fi sign-ins and checkout pages) is worth it. Re-check the quoted Chrome Help lines before boosting; if one has changed, pin a correction instead of boosting.
