# Channel identity (TikTok)

The account the factory posts to. TikTok's API can't change a profile, so Isac sets these in the app (Profile → Edit profile).

## Profile picture
`avatar.png` (1080×1080): the letters AI followed by the coral caret from "Next word", over the three odds bars.
- The house palette: ink #15131b, cream #f4ede0, coral #ff5b3d, in Archivo 900.
- Re-render after a change with `node factory/brand/render-avatar.mjs`.

## Name, username, bio
- **Name:** AI, explained
- **Username, first choice:** @nextword.ai. Fallbacks: @ai.explained.daily, @onetokenatatime, @tokenbytoken.
- **Bio** (80 characters max): `How AI actually works, in 60 seconds. A new one every day.`
- **Link:** none for now. TikTok only allows a bio link from 1,000 followers.

## Why this identity
- **The name says the search phrase.** "AI explained" is what Americans type, and TikTok reads names and bios as text.
- **The username ties to the series.** It points back to part 1, "Next word", and to the caret that every video shares.
- **One mark, one palette.** The avatar uses the same mark and colours as the videos' first frames, so the grid and the profile look like one series.
