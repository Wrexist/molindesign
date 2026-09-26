// Static HTML for a rendered asset: works without JavaScript (everything at rest), animated by
// assets/w3d.css + assets/w3d.js. Every layer is positioned in % of the frame, so the whole stage
// scales with the width you give .w3d.
import fs from 'node:fs';
import path from 'node:path';

/** URL prefix for the files: the part after public/ or static/ when the output lives there. */
export function guessBase(outDir) {
  const parts = path.resolve(outDir).split(path.sep);
  for (const root of ['public', 'static']) {
    const i = parts.lastIndexOf(root);
    if (i >= 0) return '/' + parts.slice(i + 1).join('/') + '/';
  }
  return path.relative(process.cwd(), outDir).split(path.sep).join('/') + '/';
}

const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

export function snippetHtml(meta, base, {play = 'view'} = {}) {
  const img = (cls, s) => `<img class="${cls}" src="${attr(base + s.src)}" width="${s.width}" height="${s.height}" style="--l:${s.left}%;--t:${s.top}%;--w:${s.w}%;--ox:${s.origin[0]}%;--oy:${s.origin[1]}%" alt="" loading="lazy" decoding="async">`;
  const items = meta.layers.map(L => {
    const vars = [`--delay:${L.delay}ms`, ...Object.entries(L.style ?? {}).map(([k, v]) => `${k}:${v}`)].join(';');
    const data = [`data-layer="${attr(L.name)}"`, `data-motion="${attr(L.motion)}"`, L.idle ? `data-idle="${attr(L.idle)}"` : null, `style="${attr(vars)}"`].filter(Boolean).join(' ');
    return [`  <div class="w3d-item" ${data}>`, L.shadow ? '    ' + img('w3d-shadow', L.shadow) : null, '    ' + img('w3d-obj', L.object), '  </div>'].filter(Boolean).join('\n');
  });
  return `<div class="w3d" data-play="${play}" style="--w3d-ar:${meta.frame.width}/${meta.frame.height}" aria-hidden="true">\n${items.join('\n')}\n</div>`;
}

/** Markup for the other modes: a still, an icon set, an animation. */
function otherSnippet(meta, url) {
  const f = meta.frame ?? {};
  if (meta.mode === 'still') {
    const files = meta.files ?? [], main = files.find(x => x.endsWith('.webp')) ?? files.find(x => x.endsWith('.png')) ?? files.find(x => x.endsWith('.jpg'));
    return [`<!-- ${meta.name}: still ${f.width}×${f.height}. Decorative: alt=""; if it shows the product, describe it in alt.
     Above the fold (a hero, LCP image): loading="eager" fetchpriority="high" instead of lazy. -->`,
      `<img src="${attr(url + main)}" width="${f.width}" height="${f.height}" alt="" loading="lazy" decoding="async">`, ''].join('\n');
  }
  if (meta.mode === 'icons') {
    return [`<!-- ${meta.name}: ${meta.icons.length} icons, ${f.width}×${f.height} each. Size them with CSS (width: 64px; height: auto). -->`,
      ...meta.icons.map(i => `<img src="${attr(url + i.src)}" width="${i.width}" height="${i.height}" alt="${attr(i.name.replace(/-/g, ' '))}" loading="lazy" decoding="async">`), ''].join('\n');
  }
  if (meta.mode === 'sequence') {
    const Q = meta.sequence, lines = [`<!-- ${meta.name}: ${Q.frames} frames at ${Q.fps} fps, ${f.width}×${f.height}${Q.turntable ? ', turntable' : ''} -->`];
    if (meta.animatedWebp) lines.push('<!-- plays by itself, keeps transparency, works in every modern browser -->', `<img src="${attr(url + meta.animatedWebp)}" width="${f.width}" height="${f.height}" alt="" loading="lazy" decoding="async">`);
    const poster = `${url}frames/${'0'.repeat(Q.pad)}.webp`;
    if (meta.webm) lines.push(meta.webmAlpha ? '<!-- video with alpha (Chrome, Edge, Firefox); Safari shows no alpha in WebM: give it the animated WebP or an MP4 -->' : `<!-- video on the page colour (no alpha: encoded without a system ffmpeg); Chrome, Edge, Firefox and recent Safari -->`,
      `<video src="${attr(url + meta.webm)}" poster="${attr(poster)}" width="${f.width}" height="${f.height}" autoplay muted loop playsinline preload="none"></video>`);
    if (meta.mp4) lines.push('<!-- MP4 (H.264): universal, social platforms; on the page colour -->', `<video src="${attr(url + meta.mp4)}" poster="${attr(poster)}" width="${f.width}" height="${f.height}" autoplay muted loop playsinline preload="none"></video>`);
    lines.push('<!-- drag or scroll through the frames (w3d.css + w3d.js spin player) -->', `<div class="w3d-spin" data-src="${attr(url)}frames/{i}.webp" data-frames="${Q.frames}" data-pad="${Q.pad}"${Q.turntable ? ' data-auto="12"' : ' data-scrub'} style="--w3d-ar:${f.width}/${f.height};width:min(${Math.round(f.width / 2)}px,100%)" role="img" aria-label="${attr(meta.name)}"></div>`, '');
    return lines.join('\n');
  }
  return '';
}

export function writeSnippet(meta, {outDir, previewDir, base}) {
  const url = base ?? guessBase(outDir);
  if (meta.mode && meta.mode !== 'layers') {
    fs.mkdirSync(previewDir, {recursive: true});
    const file = path.join(previewDir, 'snippet.html');
    fs.writeFileSync(file, otherSnippet(meta, url));
    return file;
  }
  const sharp = Math.round(meta.frame.width / 2);
  const body = `<!-- ${meta.name}: ${meta.layers.length} layers, frame ${meta.frame.width}×${meta.frame.height} (sharp up to ~${sharp}px wide on 2x screens)
     1. once per project: add w3d.css and w3d.js from the 3d-asset-studio skill (assets/)
     2. paste the markup below and give .w3d a width, e.g. style="width:min(${Math.min(sharp, 420)}px,100%)"; the height follows the frame
     3. start it: <script src="/path/to/w3d.js" defer data-auto></script>   (bundlers: import './w3d.js'; window.w3d.init())
     data-play: view (plays once when scrolled into view) | load | manual   ·   data-motion per item: ${['drop', 'bounce', 'pop', 'rise', 'snap', 'roll', 'fade', 'none'].join(' | ')}
     --delay per item staggers the entrance; data-idle="hop|float|sway|breathe" adds a loop afterwards -->
${snippetHtml(meta, url)}
`;
  fs.mkdirSync(previewDir, {recursive: true});
  const file = path.join(previewDir, 'snippet.html');
  fs.writeFileSync(file, body);
  return file;
}
