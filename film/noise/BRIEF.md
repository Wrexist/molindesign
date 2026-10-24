# Noise: how AI turns static into pictures

Factory #5 · slug `noise` · researched 2026-10-24 · follows `film/gps/`. Channel: Tech, explained (not named in the script). American English, US audience, AI voice Ming US_James (seed 7), disclosed in the post. Built to the new hard rules from the first stats review: 30–45 s, 8–13 lines, a hook of 6 words or fewer from 0.2 s, a puzzle the viewer can try, and an ending that asks for a one-word answer.

## 1. Topic and one hard idea

**The picture is never hidden in the static. The AI paints it in, one small step at a time.** The tool learns by guessing the noise that was added to real pictures. To make an image it runs that backwards, wiping a little noise away about 50 times, and the prompt steers every step.

The film is a **puzzle the viewer can try**: "Find the cat in this static." They can't, because there's no cat in it. The film then shows how the machine "finds" one, and pays it off with the DM-able twist: **same static, type "dog" instead, and you get a dog.** The cat was never in there. The last line asks the viewer what they'd pull out of the static (a one-word comment) and loops back to line 1.

**Main search phrase: `AI image generator`.** It's spoken at about 2.7 s in line `can`. Show it on screen in the first 2 s and put it in the first line of the caption. Secondary phrases for the SEO agent: `how do AI image generators work`, `how does AI make images`, `diffusion model explained`, `stable diffusion how it works`. I didn't check search volumes.

**DM-able moment:** lines `dog` and `never`: "Same static, type dog instead? You get a dog. The cat was never hiding. It was painted in." Someone would send this to a friend who thinks AI "finds" pictures somewhere.

**Proposed YouTube title (viral style: 4–8 words, Title Case, one emoji):** **"How AI Pulls a Cat Out of Static 🤔"**. Alternatives: "There's a Cat Hiding in This Static 😮" and "Why AI Pictures Start as TV Static 🤔". Don't use "Every AI Picture…" (see §3, kept out).

## 2. Hook options

1. **"Find the cat in this static."** (chosen, 6 words) A puzzle the viewer actually tries. Strawberry, our puzzle film, got the most views. It's spoken from 0.2 s, and frame 0 shows the conflict, a full screen of static with a challenge, not the answer. It also sets up the loop: the last line, "So what's hiding in this static?", leads straight back into it.
2. "Every AI image starts as pure TV static." (the backlog hook, rejected) It's 8 words, over the 6-word limit, and **"every" isn't true**. GPT-4o's image generator is widely reported as autoregressive rather than diffusion (OpenAI hasn't published the architecture), and Stable Diffusion starts from noise in a compressed "latent" grid, not from screen pixels. It's also an abstract "how X works" opening, the shape that did worst.
3. "Type dog. Same static. Now it's a dog." (kept as line `dog`, 33 s) It's the strongest reveal, but on frame 0 it would give away the answer (strawberry r1 lesson).

## 3. Facts used

All checked 2026-10-24, primary sources first.

| # | Fact | Line | Source |
|---|---|---|---|
| 1 | DDPM (Ho, Jain, Abbeel; arXiv 19 Jun 2020, NeurIPS 2020). Training (Algorithm 1) takes a real image x₀, picks a step t, draws noise ε, and takes a gradient step on ‖ε − ε_θ(…)‖²: the network ε_θ is "intended to predict ε from x_t", **it guesses the noise that was added**. The forward process adds a little Gaussian noise per step (β from 10⁻⁴ to 0.02), "T = 1000 for all experiments". Sampling (Algorithm 2) starts from x_T ∼ N(0, I) (pure noise) and loops t = T…1, removing predicted noise each step. | photo, more, guess, flip | https://arxiv.org/abs/2006.11239 (PDF read via pdftotext, §3.2, §4, Algorithms 1–2) |
| 2 | Diffusion as a generative model goes back to Sohl-Dickstein et al., 2015, "inspired by non-equilibrium thermodynamics". Quanta: the forward process "turns complex images … into simple noise", and the trained network turns "essentially just static" into an image. Ink-drop-in-water analogy. | background only; trick | https://arxiv.org/abs/1503.03585 ; Quanta, Anil Ananthaswamy, Jan 5, 2023: https://www.quantamagazine.org/the-physics-principle-that-inspired-modern-ai-art-20230105/ |
| 3 | Stable Diffusion = latent diffusion (Rombach et al., arXiv 20 Dec 2021, CVPR 2022). It runs diffusion "in the latent space of powerful pretrained autoencoders" and conditions on text through "cross-attention layers". | steer; screen small print | https://arxiv.org/abs/2112.10752 |
| 4 | **About 50 steps:** the Hugging Face diffusers `StableDiffusionPipeline` has `num_inference_steps` "defaults to 50" ("More denoising steps usually lead to a higher quality image"). The SD v1-4 model card evaluates with "50 PLMS sampling steps". `guidance_scale` defaults to 7.5: "A higher guidance scale value encourages the model to generate images closely linked to the text prompt". | steps, steer | https://huggingface.co/docs/diffusers/api/pipelines/stable_diffusion/text2img ; https://huggingface.co/CompVis/stable-diffusion-v1-4 |
| 5 | **Same static, different prompt:** the `latents` parameter: "Pre-generated noisy latents … Can be used to tweak the same generation with different prompts." Same seed, same prompt, same settings gives the same image ("within a certain tolerance range", not guaranteed across hardware). | dog | text2img docs above; https://huggingface.co/docs/diffusers/using-diffusers/reusing_seeds |
| 6 | **Training scale:** SD v1-4 was trained on LAION-2B (en) and subsets. Its last stage alone ran 225,000 steps at batch 2,048, which is about 461 million picture-views (my arithmetic). Earlier stages add more. "Hundreds of millions of pictures" is a safe floor. The images include art and graphics, not only photos, so the line says "pictures". | good | https://huggingface.co/CompVis/stable-diffusion-v1-4 |
| 7 | Text encoder: frozen CLIP ViT-L/14 (SD v1). Screen-only if wanted. | steer (screen) | text2img docs above |

**Kept out of the narration on purpose**
- **"Every AI image starts as static."** Not every generator is diffusion: GPT-4o image generation is reported as autoregressive (secondary, e.g. https://www.infoq.com/news/2025/04/gpt-4o-images; OpenAI hasn't disclosed details). Newer models (SD3, Flux) use flow matching, a close cousin that also starts from noise. The voice says "AI image generators" in general for the puzzle and gives no universal claim. Screen credits for the numbers name **Stable Diffusion**.
- **"TV static" literally.** Stable Diffusion's starting noise is a 64×64×4 grid of random numbers (for a 512×512 image; autoencoder downsampling factor 8), decoded into pixels at the end. Showing it as static is a fair picture of it. Small print on the `flip` beat: "Stable Diffusion starts from random noise in a compressed grid, decoded at the end".
- **"Exactly 50 steps."** 50 is the Stable Diffusion default. DDPM used 1,000; turbo models use 1–4. The voice says "about 50", and the screen chip says "Stable Diffusion default · 50 steps".
- **"The exact same cat every time."** Reproducibility holds only within a tolerance, so the voice never says "exact". The `dog` line only claims the dog. "Same static, same words → same cat" can go in a pinned comment with the caveat.
- **Copyright and training-data lawsuits.** A real story with dates, but it's a second idea. Skip it here; it could be its own film.
- **Sohl-Dickstein's 2015 ink-drop origin.** True and sourced, but it's a second story in a 40 s film. Possible pinned comment (below).

## 4. Shot ideas per line

House look: ink-dark stage, cream type, one hot coral accent, chips, labels, stamps. **No AI imagery anywhere** (Isac's rule, and the anti-slop lesson). Every "image" coming out of the noise is **hand-built**: a cream paper-cut or line-drawn cat (and dog) revealed through procedural static. Tag the denoise sequence "ILLUSTRATION · not real model output" in small print once.

**Proposed native move: the static wipe.** A field of procedural cream-on-ink static. Each "step" is a visible wipe (a squeegee or a horizontal scan bar) that clears a little noise. A step counter in a chip ticks up (`STEP 12/50`). The same move runs forwards (adding noise to a photo) and backwards (clearing it), so the viewer reads the reversal at a glance. The caret from Next word doesn't fit here.

Pacing (hallucinate lesson): a new object every 3–4 s, and no hold over 4 s. Frame 0 must not be a dark text card (the GPS lesson, 1.2 s average watch): it's one huge moving object.

| id | at | Line | Picture |
|---|---|---|---|
| hook | 0.2 | "Find the cat in this static." | **Frame 0:** full-bleed live static (bright, moving, not dark), with a coral magnifier ring drifting over it. Headline ≤ 5 words, ≥ 64 px, upper third: **FIND THE CAT**. No cat visible. |
| can | 2.74 | "You can't. But AI image generators can. How?" | Magnifier shrugs off. Chip: **AI IMAGE GENERATOR** (search phrase). A big coral **?** stamp on "How". |
| trick | 6.0 | "Here's the trick: they learned it backwards." | A rewind icon (◀◀) slams in, and the static runs in reverse for a beat. Label "BACKWARDS". |
| photo | 8.9 | "Take a real photo. Sprinkle in a little static." | A paper photo print (drawn: a cat on a porch) drops onto the stage. A salt-shaker of static sprinkles grain onto it. Chip `STEP 1`. |
| more | 12.51 | "Then more, and more, until it's pure noise." | Fast wipes add noise: `STEP 1 → 250 → 600 → 1,000`. The photo dissolves to full static. Small print "DDPM 2020: 1,000 steps". |
| guess | 15.77 | "Its one job: guess which static you added." | Two static tiles side by side: **ADDED** vs **GUESS**. A coral check stamp on the match. |
| good | 19.03 | "After hundreds of millions of pictures, it gets really good." | A counter spins to **461,000,000+** with a tiny stack of cards flicking past. Small print "SD v1-4 final stage: 225k steps × 2,048". |
| flip | 23.0 | "Now flip it. Start from pure static." | The whole stage card flips 180°. Fresh static (the same field as frame 0, the payoff). Small print about the latent grid (§3). |
| steps | 25.9 | "Wipe away a little noise. Then again. About 50 times." | **Native move:** the scan-bar wipe runs at speed, with `STEP 1/50 → 50/50` in the chip and soft cat shapes condensing. Chip "Stable Diffusion default · 50 steps". |
| steer | 29.87 | "Your prompt steers every step toward a cat." | A prompt bar at the top: `a cat`. On each wipe a coral arrow from the prompt nudges the shapes, and the cat sharpens (hand-drawn). |
| dog | 33.13 | "Same static, type dog instead? You get a dog." | Rewind to the frame-0 static (label "SAME STATIC"). Retype the prompt `a cat` → `a dog`. The wipes run and a drawn dog appears. **DM-able frame:** cat and dog side by side over the same static thumbnail, ≥ 40 px labels, hold ≥ 3 s. |
| never | 36.74 | "The cat was never hiding. It was painted in." | The magnifier from frame 0 returns over the raw static and finds nothing. A coral stamp: **NEVER IN THERE**. |
| end | 40.36 | "So what's hiding in this static? One word. Go." | Back to the frame-0 static with a blinking empty prompt box `type one word_` (it pulls comments). On "Go" it cuts to frame 0, and the loop replays. |

## 5. Open questions for the director

1. **Length.** 13 lines (the cap), 108 spoken words. The chained `at` puts `end` at 40.4 s and `dur` at 44.2 s. Ming James usually reads a little faster, so expect about 38–42 s, inside 30–45. If it runs long, cut `trick` first (`can` → `photo` still flows).
2. **Hand-built cat and dog.** They must read instantly at phone size while half buried in static. A bold cream silhouette with one coral detail (an eye, a collar) will read better than a detailed drawing. Use the same pose for cat and dog so the swap is obviously "same static, other word".
3. **Making the static honest.** If you can, seed one deterministic noise field and reuse it on frame 0, `flip`, `dog` and `end`. Then "same static" is literally true on screen, and an attentive rewatcher can check it.
4. **Sources on screen.** End-card or small-print credits: "Ho et al. 2020 (DDPM) · Rombach et al. 2022 (Stable Diffusion) · Hugging Face diffusers docs". Every number on screen carries its condition (SD default, DDPM setting).
5. **"Its one job"** sounds like "it's" when spoken, which is fine for the ear. The caption must spell it "Its".
6. **Pinned comment idea for the SEO agent:** "The idea came from physics: a 2015 paper by Jascha Sohl-Dickstein modeled it on things like a drop of ink spreading in water, then learned to run that backwards. (Quanta, Jan 2023)". **Comment bait:** the last line asks for one word, so reply to the first answers with "Here's what [word] looks like coming out of that static" only if we can show it without AI imagery. Otherwise answer with the source.
