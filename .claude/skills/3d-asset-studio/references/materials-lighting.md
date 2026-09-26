# Materials, light and shadow

## Contents
- Material presets
- Physically based values for real materials
- Grain (solid noise)
- Textures: canvas, images, labels, screens
- Colour: brand colours, blacks, whites
- Studios: presets, key/fill/rim, softness
- Environments and HDRIs
- Lighting recipes by subject
- Shadows
- Glass and liquids
- Metals
- Emissive, neon and bloom
- Matching the page
- Troubleshooting the look

## Material presets

```js
import * as M from 'w3d/materials.js';
const m = M.rubber({color: 0x252625}, {roughness: 0.5}); // (preset options, then any MeshPhysicalMaterial overrides)
```

| preset | looks like | use for |
|---|---|---|
| `rubber` | matte rubber, fine grain | plates, grips, bumpers, soles |
| `powderCoat` | textured cast iron / powder coat with sparse pits | kettlebells, dumbbells, tools, outdoor furniture |
| `plastic` | matte moulded plastic, or `glossy: true` | toys, casings, caps, containers, puffy icons |
| `stone` | speckled matte mineral | concrete, terrazzo, bisque, plaster |
| `marble` | white stone with soft veins (`veinColor`, `veins`) | countertops, trays, luxury props |
| `cork`, `foam`, `felt` | cellular cork; closed-cell foam; fuzzy felt | yoga blocks, mats, tennis balls, pin boards |
| `terracotta` | unglazed clay | pots, tiles |
| `wax`, `paper`, `leather`, `linen` | soft translucent wax; paper; grained leather; woven linen | candles; labels, books; bags, straps; book cloth, shades, cushions |
| `dough`, `icing` | baked dough; glossy icing | bakery, food |
| `ceramic` | glazed ceramic (clearcoat) | cups, plates, vases, tiles |
| `paint` | satin (default) or matte (`satin: false`) paint | brand-coloured objects, lacquered metal, furniture |
| `fabric` | knit textile with sheen (uses UVs along bands) | bands, straps, webbing |
| `wood` | oiled wood with solid growth rings | boards, handles, blocks, furniture |
| `brushedSteel`, `chrome` | anisotropic brushed metal; mirror metal | hubs, handles, cutlery; taps, trims |
| `gold`, `brass`, `copper` | warm metals | logos, jewellery, hardware |
| `glass` | clear/tinted/frosted glass (`frost`) | bottles, jars, glasses, lenses (see Glass below) |
| `glow` | emissive (`intensity`) | flames, bulbs, screens, neon: pair with `post: {bloom: true}` |

`withGrain(material, opts)` puts the seamless surface of those presets on any material.

## Physically based values for real materials

Base colour in sRGB (the hex you type), roughness and metalness. Start here and adjust by eye in the render.

| material | base colour | roughness | metal | notes |
|---|---|---|---|---|
| charcoal, black rubber | `#2e2f2f`–`#3a3a3a` | 0.5–0.7 | 0 | real blacks are dark greys |
| white paint, porcelain | `#e8e6e1`–`#f1eee8` | 0.35 (satin) / 0.15 + clearcoat (glaze) | 0 | pure white blows out |
| concrete, plaster | `#a9a7a2`–`#c9c5bd` | 0.8–0.95 | 0 | + stone grain |
| raw / oiled wood (oak) | `#b88a5a` | 0.8 / 0.45 | 0 | + growth rings |
| cork | `#b88a5c` | 0.85 | 0 | cellular grain |
| terracotta | `#c0694a` | 0.85 | 0 | |
| leather | `#6b3b24` (tan `#9a6a45`) | 0.45–0.6 | 0 | sheen 0.2 |
| cotton, linen | fabric colour, a shade darker | 0.85–1 | 0 | sheen 0.4–0.8 |
| glossy plastic / matte plastic | any | 0.12–0.25 / 0.45–0.6 | 0 | clearcoat for toy gloss |
| car paint | any | 0.3 + clearcoat 1 (0.03) | 0 | |
| skin | `#e0ac8a` … `#6b4430` | 0.45 | 0 | three.js has no true subsurface; keep lighting soft |
| gold (measured F0) | `#ffdb93` | 0.1–0.3 | 1 | the `gold` preset uses a deeper `#e2b55c`, which reads richer on screen |
| silver / aluminium | `#fcfaf5` / `#f5f6f6` | 0.05–0.35 | 1 | |
| copper / brass | `#fad0c0` / `#e8c77a` | 0.2–0.35 | 1 | |
| iron, steel / chrome | `#c4c6c7` / `#d9dadb` | 0.25–0.45 / 0.02–0.08 | 1 | brushed: anisotropy 0.6–0.8 |
| glass / water / diamond / ice | white base + tint | 0–0.05 | 0 | ior 1.5 / 1.33 / 2.42 / 1.31, transmission 1 |

Metals have no diffuse colour: their base colour *is* their reflection tint, so they look only as good as what
they reflect (the environment). Non-metals keep `metalness: 0`, never 0.5.

## Grain (solid noise)

Most presets get their surface from `withGrain`: 3D simplex noise computed in the shader from the object-space
position. It needs no UVs, so it never seams on spheres or streaks across lathe faces. It has the same density on
every shape, stays glued to the object as it turns, and fades out below a pixel instead of sparkling.

```js
M.withGrain(material, {scale: 260, bump: 1, roughVar: 0.05, tintVar: 0.04, speckle: 1.6, pits: 0, cells: 0, veins: 0, seed: 7})
```
- `scale`: features per scene unit (1 unit = 10 cm): 90 coarse stone, 260 rubber, 400 fine plastic.
- `bump`: relief. Keep it ≤ 0.15 on metals (satin finish) and use 1–1.5 on iron.
- `roughVar`, `tintVar`: roughness and colour variation. `pits`: sparse dents (cast iron, citrus skin).
  `cells`: cellular granules (cork, foam, felt). `veins`: marble veins.
- It is a render-time shader: other viewers show the plain base material. Its parameters travel in the GLB's
  extras, so `loadModel` rebuilds the same surface.

Judge grain at final resolution, not in drafts.

## Textures: canvas, images, labels, screens

- `canvasTexture(w, h, (ctx, w, h) => {...})` draws labels, prints, packaging art, latte art or app screens with
  the Canvas 2D API. Use `rng(seed)` for randomness.
- `imageTexture(new URL('./label.png', import.meta.url))` loads a file next to the scene. Wrap it in try/catch
  and fall back to a drawn placeholder.
- Brand fonts in canvas text: `await new FontFace('Brand', 'url(' + new URL('./brand.woff2', import.meta.url) +
  ')').load().then(f => document.fonts.add(f))`.
- Screens: put the texture on `emissiveMap` with `emissive: 0xffffff`, `color: 0x000000` and `clearcoat: 1`, so
  it reads bright under any light and still reflects.

## Colour: brand colours, blacks, whites

- Hex colours are sRGB, as in CSS. The renderer uses Neutral tone mapping (Khronos PBR Neutral), which keeps hues
  honest. Lit faces still come out 1.3–1.8× brighter than the albedo, so **a swatch used as is renders pale**.
  Start from `M.swatch('#c66b4d')` (≈ 0.62× in linear light) and compare the lit side with the brand colour in
  the preview. Saturated colours may also need a touch less saturation.
- Real "black" products are dark greys (`0x252625`–`0x2e2f2f`). Pure black renders as a flat hole with no form.
- Whites: `0xf1eee8`–`0xf5f3ee` read as white ceramic; `0xffffff` blows out.
- A set of objects: pick 3–5 colours from the brand plus one neutral, and vary the lightness more than the hue.

## Studios: presets, key/fill/rim, softness

| preset | key light | env | floor / contact | for |
|---|---|---|---|---|
| `soft` | upper left, 2.1, softness 1 | room | 0.5 / 0.45 | the default; products on light pages |
| `bright` | high front-left, 1.55, softness 1.5; strong fill | room ×1.25 | 0.34 / 0.4 | white/pastel products, e-commerce |
| `dramatic` | low side light, 3.3; rim behind; weak fill | room ×0.4 | 0.62 / 0.55 | dark pages, premium, moody |
| `top` | almost overhead | room | 0.42 / 0.5 | flat lays, top-down cameras, hovering objects |
| `clay` | big soft light, softness 2.4 | overcast | 0.32 / 0.5 | clay and mono looks, illustrations |
| `golden` | warm, low from the side | sunset | 0.5 / 0.45 | lifestyle, outdoors |
| `night` | dim cool key, bright rim | dark | 0.55 / 0.5 | neon, emissive, bloom |
| `glass` | upper left, softness 1.4 | strips | 0.4 / 0.42 | glass, liquids, perfume, chrome, jewellery |

Override any part:
```js
studio: {preset: 'soft', key: {dir: [-3, 5.5, 2.6], intensity: 2.4, softness: 3}, fill: {color: 0xf3f6ec}, rim: {dir: [2.6, 3.2, -4.2], intensity: 1.5}, envMap: 'softbox', exposure: 1, env: 0.9, toneMapping: 'agx'}
```
- `key.dir`: where the light comes from, for a camera at +z (turns with `camera.azimuth`). Upper left matches
  reading direction and most UI shadows. Keep one light story across a page or a set.
- `key.softness` is the penumbra: **1 = crisp product shadows** (blur ≈ 2.7% of the scene radius), 3 = soft,
  6 = overcast, 10+ = barely there.
- `fill`: lifts the shadow side. Tint it toward the page colour to tie the object into the palette.
- `rim`: a back light that outlines the silhouette. Use it on dark pages and for dark objects.
- `hemi: {sky, ground, intensity}`: an optional hemisphere light for a cheap sky/ground bounce.
- `exposure`, `env` (environment intensity) and `toneMapping` (`'neutral'` default, `'agx'` softer highlights,
  `'aces'` punchier): adjust these last.

## Environments and HDRIs

`envMap` sets what reflections see (and adds soft ambient light):

| envMap | what it is | for |
|---|---|---|
| `room` | three.js RoomEnvironment: a grey room with bright panels | matte things, general use (default) |
| `softbox` | photo studio: dark floor, bright top, big softbox, strip lights | metals, glossy plastics, ceramics, gold logos |
| `strips` | dark-field studio: near black, two tall strips, a top light | glass, liquids, chrome, jewellery |
| `sweep` | a lit seamless sweep in the backdrop colour behind and below, darker toward the camera, two strips, a top light, black flags | glass and metal on light or pastel sets (it takes its colour from `backdrop`) |
| `overcast` | even bright sky | clay, matte, architecture |
| `sunset` | warm horizon, blue zenith, low sun | golden hour, lifestyle |
| `dark` | near black with rim strips | dark pages, neon |
| `neutral` | plain grey gradient | colour-critical, technical |
| a URL | any equirectangular `.hdr`, `.exr`, `.jpg` or `.png` | a real place (Poly Haven has hundreds of free CC0 HDRIs) |

`envRotation` (radians) turns the environment to place highlights. Per material:
- `material.envMapIntensity = 0.3` dims its reflections (a dark liquid that should not mirror the studio, a matte
  label), and `> 1` strengthens them (glass reflects only ~4%, so its strips may need 2–3).
- `material.userData.w3dEnvMap = 'softbox'` gives one material its own environment (any name above, or an HDRI
  URL). Mixed subjects need it: a gold cap wants `softbox` while the frosted glass under it wants `sweep`.

For HDRI files, keep them next to the scene and pass `new URL('./studio_small_08_2k.hdr', import.meta.url).href`.
1–2k HDRIs are plenty for reflections.

## Lighting recipes by subject

- **Product on white / e-commerce**: `bright`, `camera.elevation` 12–20, floor shadow 0.3, contact 0.4, and
  `backdrop: '#ffffff'` for webshops (painted backdrops come out exactly as given, 255 stays 255).
- **Hero on a light page**: `soft` with the fill tinted to the page, and shadows at about the page's own UI
  shadow strength.
- **Dark premium**: `dramatic`, rim on, object colours a little lighter than on light pages, floor shadow 0.7
  (shadows need more opacity to register on dark), `backdrop` a dark radial gradient for stills.
- **Floating / hovering objects**: `top`, or raise the key (`dir: [-1, 7, 1.5]`). A side key gives two separate
  shadow blobs (the cast shadow offset, the contact shadow under it). Keep the contact shadow soft or off
  (`contact: false`) when the object is high.
- **Metal (logos, jewellery, cutlery)**: `envMap: 'softbox'` (or `strips` for jewellery), and rotate the object or
  `envRotation` until a softbox runs along the main face. A metal that reflects nothing looks grey or brown.
- **Glass, drinks, perfume**: studio `glass` on its final backdrop (below); on light or pastel backdrops with
  `envMap: 'sweep'`, and metal parts (caps, pumps) on `softbox` through `userData.w3dEnvMap`.
- **Food**: `soft` or `golden`, key from behind-left (`dir: [-3, 4, -1.5]`: backlight makes food glisten), a
  warm fill, camera 25–45° or top-down (`top`) for flat lays.
- **Clay illustrations**: look `clay` (brings the `clay` studio and AO), a pastel backdrop, elevation 25–35.
- **Neon / emissive**: `night`, `glow` materials, `post: {bloom: true}`, a dark backdrop.

## Shadows

Three shadows are layered, all baked into the output:
1. the key light's soft shadow (VSM), with direction and softness from the studio;
2. a contact shadow (blurred depth from below) where objects meet the floor, which is what makes them sit;
3. shadows between objects (plate on plate), handled by the layer order.

Strength: `floor: {shadow: 0.35}` and `contact: {opacity: 0.35, blur: 1.3}`. `contact: false` suits floating
objects. Coloured pages: `shadowColor: '#1c281e'` (a very dark shade of the page colour) sits better than black,
and the layer rebuild handles tints exactly. Glass casts lighter shadows automatically, dark glass darker ones.

The shadow sprite of an object includes the dark area *under* it. That is correct at rest (the object covers it),
and it is why entrances fade shadows in on impact.

## Glass and liquids

Transmission refracts what is in the render: the backdrop, the floor and its shadows, opaque objects. It never
sees other glass or the web page behind a transparent sprite.
- **Best**: render glass on its final background: a still or sequence with `backdrop` set to the page colour or
  gradient, and `studio: 'glass'`. On dark and neutral backdrops keep its `strips` environment (dark edges, long
  highlights). On light and pastel sets use `studio: {preset: 'glass', envMap: 'sweep'}`: the glass then reflects
  a lit sweep in the backdrop colour, as on a real set, instead of a dark room that makes it look muddy. Place the
  image on the same colour.
- **Transparent layers**: glass then refracts a white studio, which is fine on light pages. Tint it
  (`glass({color})`), frost it a little (`frost: 0.1–0.2`) and put something inside (liquid, a candle, a stem) so
  it reads.

`M.glass({color, frost, liquid, edges}, {thickness, ior, attenuationDistance})`:
- `color` is the tint after one pass through `thickness`. Hollow ware wants a thin `thickness` (0.05–0.3), solid
  glass the full depth.
- `frost` is the roughness as it looks at 2048 px wide. three blurs rough transmission by about
  width^roughness pixels, so the kit rescales it for each render size: a 640 px draft, a 900 px turntable and a
  3200 px hero show the same frosting. (A plain `MeshPhysicalMaterial` is rescaled from its `roughness` too.)
- `liquid: {color, top, base, soft}` fills the container up to the height `top`, in the glass mesh's own
  coordinates (for the kit's bottles and glasses, scene units above the base: `top: 0.95` fills the 13.8 cm
  cosmetic bottle to 9.5 cm). `base` starts the liquid above a thick glass bottom; `soft` blurs the fill line. A
  second glass object inside cannot work, because glass never sees glass; `liquid` tints the container's own
  transmitted light instead: perfume, water, oil, wine, cocktails.
- `edges: 0–1` darkens the glass where it turns away from the camera. On a real set thick glass picks up the dark
  studio around it at the silhouette; screen-space transmission only sees the backdrop, so solid glass on a light
  set needs `edges: 0.4–0.6` to keep its outline.
- Opaque liquids (milk, coffee, juice, paint): a slightly smaller solid inside, with an opaque glossy material.
- Glass casts lighter shadows, both the key shadow and the contact shadow (tinted glass darker, by its tint).
- Caustics (the bright spot inside a glass object's shadow) need `--pathtrace`. To fake one in raster: an additive,
  soft-edged decal on the floor inside the shadow. Put it at y ≈ −0.015 (1.5 mm below the floor): anything at
  y ≥ 0 counts as an object for the contact shadow and darkens it.
- Path tracing (`--pathtrace`, GPU only) gives true refraction between glass objects and caustics.

## Metals

Metals reflect, so the environment *is* their colour pattern. Use `softbox` for broad, readable highlights and
`strips` for crisp lines; rotate the object ~10–30° so a highlight runs along the main face. Brushed metal needs
anisotropy (`brushedSteel`), and grain bump stays ≤ 0.15. Gold that looks brown or green means it reflects
dark walls, so change the environment instead of the colour.

## Emissive, neon and bloom

`M.glow({color, intensity})` or any material with `emissive` + `emissiveIntensity` > 1. `post: {bloom: true}`
(or `{strength: 0.8, radius: 1.4}`) makes emissive parts glow in stills, icons and sequences; the glow comes from
an emissive-only pass, so lit white surfaces do not bloom. Neon tubes: a `tube` with `glow`, the dark `night`
studio and a dark backdrop. Candles: `candle()` includes a flame and a warm point light.

## Matching the page

- Set `background` to the page colour, so previews show the real result.
- Tint the fill toward the page colour; on strongly coloured pages tint `shadowColor` too.
- Dark pages: `dramatic`, lighter object colours, stronger shadows.
- The frame is transparent: let objects overlap cards, images and edges. That overlap makes them part of the page.

## Troubleshooting the look

| symptom | fix |
|---|---|
| plasticky, CG | round the edges more; add grain; add imperfection |
| flat, no form | colour too dark or saturated; add fill or rim; lower `exposure`; check the key is not behind the object |
| colour too light vs the brand | start from `M.swatch(hex)`; lower saturation slightly |
| metal looks brown or grey | `envMap: 'softbox'`; lower roughness; turn it so a face catches the softbox |
| glass looks like milky plastic | render it on its backdrop with `studio: 'glass'` (`envMap: 'sweep'` on light sets); lower `frost`; `edges: 0.5` |
| glass on a pastel backdrop looks muddy, a gold cap olive | the dark `strips` environment: `envMap: 'sweep'` for the glass, `userData.w3dEnvMap = 'softbox'` on the metal |
| a liquid inside glass reads as a painted block | use `glass({liquid: {color, top}})` instead of a second object |
| grain sparkles | lower `bump` (metals), raise `scale` slightly, or `ss: 3` |
| grain invisible | judge at final size; raise `bump`/`tintVar`; lower `scale` |
| banding on curved walls | build the profile with `spline()` |
| shadow too heavy | `floor.shadow` 0.3–0.4, `contact.opacity` 0.3 |
| floating look | the object is not touching the floor (`onFloor`), or the contact shadow is off |
| two shadows under a hovering object | `studio: 'top'`, or `contact: false` |
| pale or dotted patches on thin parts (leaves, fabric) | shadow acne: give the part a little thickness, or set `shadowSide: THREE.BackSide` on its material |
