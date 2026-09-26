#!/usr/bin/env node
// See the choreography before it ships: plays a rendered asset with w3d.css, freezes the animations at
// evenly spaced moments (Web Animations API, so frames are exact and repeatable) and saves a contact sheet.
// Optionally records a real-time video too.
import fs from 'node:fs';
import path from 'node:path';
import {SKILL, ORIGIN, fail, loadPlaywright, launch, toUrl, serve, parseArgs} from './browser.mjs';
import {snippetHtml} from './snippet.mjs';

const HELP = `usage: node preview.mjs <meta.json> [options]

  --out <png>         contact sheet to write (default: ./<name>.motion.png)
  --width <px>        stage width on the page (default 360)
  --frames <n>        frames on the sheet (default 16)
  --bg <colour>       page background (default #f2f2ee)
  --motion <name>     try another entrance on every layer (drop, bounce, pop, rise, snap, roll, fade)
  --idle <name>       try an idle loop (hop, float, sway, breathe), or none to drop it
  --idle-cycles <n>   also cover n idle loops (default 0: the sheet shows the entrances)
  --stagger <ms>      delay between layers (overrides meta)
  --css <file>        extra stylesheet to apply (your page's overrides)
  --video <webm>      also record the entrance in real time
  --browser <path>    Chrome/Chromium executable to use`;

const args = parseArgs(process.argv.slice(2), ['help']);
if (args.help || !args._[0]) { console.log(HELP); process.exit(args.help ? 0 : 1); }
const metaPath = path.resolve(args._[0]);
if (!fs.existsSync(metaPath)) fail(`meta.json not found: ${metaPath}`);
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const width = +args.width || 360, frames = Math.max(2, +args.frames || 16), bg = args.bg || '#f2f2ee';
const out = path.resolve(args.out || `${meta.name}.motion.png`);

for (const L of meta.layers) {
  if (args.motion) L.motion = args.motion;
  if (args.idle === 'none') delete L.idle; else if (args.idle) L.idle = args.idle;
  if (args.stagger != null) L.delay = Math.round(L.index * +args.stagger);
}
const idleCycles = args['idle-cycles'] != null ? +args['idle-cycles'] : 0;
const motions = new Set(meta.layers.map(L => L.motion));
const top = motions.has('drop') || motions.has('bounce') ? Math.round(width * 0.46) : Math.round(width * 0.08);
const left = motions.has('roll') ? Math.round(width * 0.5) : Math.round(width * 0.08);
const markup = snippetHtml(meta, toUrl(path.dirname(metaPath)) + '/', {play: 'manual'});
const page0 = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${toUrl(path.join(SKILL, 'assets/w3d.css'))}">
${args.css ? `<link rel="stylesheet" href="${toUrl(path.resolve(args.css))}">` : ''}
<style>html,body{margin:0;background:${bg}}#pad{display:inline-block;padding:${top}px ${Math.round(width * 0.08)}px ${Math.round(width * 0.06)}px ${left}px}#pad>.w3d{width:${width}px}</style></head>
<body><div id="pad">${markup}</div></body></html>`;

const chromium = loadPlaywright();
const browser = await launch(chromium, {browser: args.browser});
try {
  const context = await browser.newContext({viewport: {width: width + left + 200, height: width + top + 200}, deviceScaleFactor: 2, reducedMotion: 'no-preference'});
  await serve(context, {'/preview.html': page0});
  const page = await context.newPage();
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(ORIGIN + '/preview.html');
  const timing = await page.evaluate(async () => {
    const el = document.querySelector('.w3d');
    await Promise.all([...el.querySelectorAll('img')].map(i => (i.loading = 'eager', i.decode().catch(() => undefined))));
    el.classList.add('is-armed', 'is-in');
    const anims = document.getAnimations();
    anims.forEach(a => a.pause());
    let end = 0, idleEnd = 0, idleStart = 0, idleDur = 0;
    for (const a of anims) {
      const t = a.effect.getComputedTiming();
      if (t.iterations === Infinity) { idleEnd = Math.max(idleEnd, t.delay + t.duration); idleStart = Math.max(idleStart, t.delay); idleDur = Math.max(idleDur, t.duration); }
      else end = Math.max(end, t.endTime);
    }
    return {end, idleEnd, idleStart, idleDur, count: anims.length};
  });
  if (!timing.count) fail('no animations found: check data-motion values and that w3d.css loaded');
  // entrances by default; idle loops only when asked for (--idle-cycles n), so the entrance gets the frames
  const total = (idleCycles > 0 && timing.idleEnd ? Math.max(timing.end, timing.idleStart + timing.idleDur * idleCycles) : timing.end || timing.idleStart + timing.idleDur) + 80;
  const box = await page.locator('#pad').boundingBox();
  const shots = [];
  for (let i = 0; i < frames; i++) {
    const t = Math.round((total * i) / (frames - 1));
    await page.evaluate(t => document.getAnimations().forEach(a => { a.currentTime = t; }), t);
    shots.push({t, png: (await page.screenshot({clip: box})).toString('base64')});
  }
  // contact sheet
  const cols = Math.min(4, frames), cellW = Math.round(box.width), cellH = Math.round(box.height);
  const sheet = `<!doctype html><html><body style="margin:0;background:#fff;font:600 13px system-ui,sans-serif;color:#333">
<div style="padding:10px 12px">${meta.name} — ${[...new Set(meta.layers.map(L => L.motion))].join(', ')}${meta.layers.some(L => L.idle) ? ' + idle ' + [...new Set(meta.layers.map(L => L.idle).filter(Boolean))].join(', ') : ''} — ${Math.round(total)} ms, ${frames} frames</div>
<div style="display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:8px;padding:0 12px 12px">${shots.map(s => `<figure style="margin:0"><img src="data:image/png;base64,${s.png}" style="width:${cellW}px;height:${cellH}px;display:block;border:1px solid #e5e5e5"><figcaption style="padding:3px 2px;font-weight:500">${s.t} ms</figcaption></figure>`).join('')}</div></body></html>`;
  const sheetPage = await context.newPage();
  await sheetPage.setViewportSize({width: cols * (cellW + 8) + 24, height: 400});
  await sheetPage.setContent(sheet, {waitUntil: 'load'});
  fs.mkdirSync(path.dirname(out), {recursive: true});
  await sheetPage.screenshot({path: out, fullPage: true});
  console.log(`motion sheet: ${out} (${frames} frames over ${Math.round(total)} ms)`);

  if (args.video) {
    const dir = path.dirname(path.resolve(args.video));
    const vctx = await browser.newContext({viewport: {width: Math.ceil(box.width), height: Math.ceil(box.height)}, recordVideo: {dir, size: {width: Math.ceil(box.width), height: Math.ceil(box.height)}}});
    await serve(vctx, {'/preview.html': page0.replace('display:inline-block', 'display:block')});
    const vp = await vctx.newPage();
    await vp.goto(ORIGIN + '/preview.html');
    await vp.evaluate(async () => { const el = document.querySelector('.w3d'); await Promise.all([...el.querySelectorAll('img')].map(i => (i.loading = 'eager', i.decode().catch(() => undefined)))); el.classList.add('is-armed'); });
    await vp.waitForTimeout(400);
    await vp.evaluate(() => document.querySelector('.w3d').classList.add('is-in'));
    await vp.waitForTimeout(total + 700);
    const video = vp.video();
    await vctx.close();
    fs.renameSync(await video.path(), path.resolve(args.video));
    console.log(`video: ${path.resolve(args.video)}`);
  }
} finally {
  await browser.close();
}
