# Channel identity (TikTok)

The account the factory posts to. TikTok's API can't change a profile, so Isac sets these in the app (Profile → Edit profile).

Isac's rule (2026-10-23): the channel is about **tech and AI in general**, and the profile must not look like an AI channel or AI-made. So no "AI" in the name, username or picture, no robot/brain/sparkle imagery, no glow or gradients.

## Profile picture
`avatar.png` (1080×1080): a mouse pointer mid-click, cream on coral with an ink outline. Centred for TikTok's round crop.
- The house palette: ink #15131b, cream #f4ede0, coral #ff5b3d.
- Re-render after a change with `node factory/brand/render-avatar.mjs`.

## Name, username, bio
- **Name:** Tech, explained
- **Username, first choice:** @techexplained.daily. Fallbacks: @howtechworks.daily, @plaintech, @techin60.
- **Bio** (80 characters max): `How the tech you use every day actually works. One a day.`
- **Link:** none for now. TikTok only allows a bio link from 1,000 followers.

## Why this identity
- **The name says the search phrase.** "Tech explained" is what Americans type, and TikTok reads names and bios as text. It covers AI topics too without saying so.
- **A plain, human mark.** A cursor reads as "tech" at 40 px and looks drawn by a person, not generated.
- **One palette.** The avatar uses the videos' colours, so the grid and the profile look like one series.
