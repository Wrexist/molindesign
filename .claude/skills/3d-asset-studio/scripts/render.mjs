#!/usr/bin/env node
// Render a scene module with three.js in headless Chromium: layered web sprites, finished stills, icon sets or
// animation sequences, plus GLB/USDZ/STL/OBJ exports and previews. Run with --help for options.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {SKILL, THREE_VERSION, ORIGIN, fail, loadPlaywright, launch, resolveDeps, importMap, toUrl, serve, parseArgs} from './browser.mjs';
import {writeSnippet} from './snippet.mjs';
import {animatedWebP, encodeVideo} from './anim.mjs';

const HELP = `usage: node render.mjs <scene.js> --out <dir> [options]

  --mode <m>          layers (web sprites, default) | still | icons | sequence | none (only --export)
  --look <l>          photoreal | clay | mono | toon | lowpoly | lineart | wireframe (overrides the scene)
  --out <dir>         where the files go
  --name <name>       asset name / file prefix (default: settings.name or the scene file name)
  --width <px>        output width (height follows the content)      --size <w>x<h>  exact size (still/sequence)
  --ss <n>            supersampling 1-3 on top of MSAA (default 2)    --quality <0-1> WebP/JPEG quality (0.9)
  --ao                bake ambient occlusion (--no-ao to turn it off)
  --pathtrace [n]     path-trace a still with n samples (default 128; needs a GPU — refused in software rendering)
  --gpu               render on the machine's GPU when available (default: software rendering, same everywhere)
  --frames <n>        sequence length          --turntable <n>  n-frame turntable (implies --mode sequence)
  --video <f,f>       sequence containers: webp (animated, default), webm, mp4 (needs system ffmpeg)
  --export <f,f>      model files: glb, usdz, stl, obj            --glb   same as --export glb
  --draft             fast look at the beauty only (≤ 640 px, no supersampling, nothing written to --out)
  --set <path=value>  override a setting for this run, repeatable: --set camera.elevation=24 --set studio=bright
  --png               also write lossless PNGs
  --base <url>        URL prefix used in snippet.html (default: guessed from a public/ or static/ folder)
  --previews <dir>    where previews go (default: <scene dir>/<name>.preview)
  --browser <path>    Chrome/Chromium to use     --three <dir>  a three.js package instead of the pinned ${THREE_VERSION}
  --timeout <s>       give up after this many seconds (default 900)`;

// --pathtrace takes an optional sample count
const argv = process.argv.slice(2);
let pathtrace = null;
const pti = argv.indexOf('--pathtrace');
if (pti >= 0) { const n = Number(argv[pti + 1]); pathtrace = Number.isFinite(n) && n > 0 ? n : true; argv.splice(pti, Number.isFinite(n) && n > 0 ? 2 : 1); }
const args = parseArgs(argv, ['draft', 'png', 'glb', 'help', 'ao', 'no-ao', 'gpu']);
if (pathtrace) args.pathtrace = pathtrace;
if (args.help || !args._[0]) { console.log(HELP); process.exit(args.help ? 0 : 1); }
const scenePath = path.resolve(args._[0]);
if (!fs.existsSync(scenePath)) fail(`scene not found: ${scenePath}`);
if (!args.out && !args.draft) fail('--out <dir> is required (or use --draft for a quick preview)');
const sceneName = path.basename(scenePath).replace(/\.(scene\.)?m?js$/, '');
const outDir = args.out ? path.resolve(args.out) : null;
const size = args.size ? args.size.split(/[x×,]/).map(Number) : null;
if (size && (size.length !== 2 || size.some(v => !(v > 0)))) fail('--size wants WIDTHxHEIGHT, e.g. --size 1200x630');

const deps = resolveDeps(args.three);
const chromium = loadPlaywright();
const stageHtml = `<!doctype html><html><head><meta charset="utf-8"><script type="importmap">${JSON.stringify(importMap(deps))}</script></head>
<body style="margin:0;background:transparent"><script type="module" src="${toUrl(path.join(SKILL, 'scripts/stage/stage.js'))}"></script></body></html>`;

const browser = await launch(chromium, {browser: args.browser, gpu: !!(args.gpu || pathtrace)});
if (browser.w3dGPU !== 'SwiftShader') console.log(`  GPU: ${browser.w3dGPU}`);
else if (pathtrace && !process.env.W3D_PATHTRACE_SOFTWARE && !process.env.W3D_PATHTRACE_MOCK) {
  await browser.close();
  fail('path tracing needs a GPU, and this machine renders WebGL in software (SwiftShader), where the path tracer does not finish even one sample in 15 minutes.\n' +
    'Render the still without --pathtrace (studio "glass" handles glass and liquids well), or run it where a GPU is available (a Mac or PC with a graphics card).\n' +
    'To try anyway: W3D_PATHTRACE_SOFTWARE=1');
}
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'w3d-'));
let exitCode = 0;
try {
  const context = await browser.newContext({viewport: {width: 800, height: 600}, deviceScaleFactor: 1});
  await serve(context, {'/stage.html': stageHtml});
  const page = await context.newPage();
  // an error before the stage module ran (a syntax error in the kit, a module that cannot load) would otherwise
  // wait for the full timeout: stop at once
  let stageFailed;
  const stageBroken = new Promise(resolve => { stageFailed = resolve; });
  page.on('pageerror', async e => {
    console.error('page error:', e.message);
    if (!(await page.evaluate(() => !!window.__w3d).catch(() => true))) stageFailed(e);
  });
  const seen = new Set();
  page.on('console', m => {
    const text = m.text().replace(new RegExp(ORIGIN + '/fs', 'g'), '');
    if (m.type() === 'error') console.error('console:', text);
    // three's exporters and loaders report lossy conversions only as warnings: pass those on (once each)
    else if (m.type() === 'warning' && /THREE\.\w*(Exporter|Loader)/.test(text) && !seen.has(text)) { seen.add(text); console.log('  three: ' + text); }
  });

  let assetName = sceneName;
  const previewDirFor = name => (args.previews ? path.resolve(args.previews) : path.join(path.dirname(scenePath), `${name}.preview`));
  await page.exposeFunction('w3dLog', msg => console.log('  ' + msg));
  await page.exposeFunction('w3dName', name => { assetName = name; });
  await page.exposeFunction('w3dSave', (target, b64) => {
    const [root, ...rest] = target.split('/');
    const dir = root === 'out' ? outDir : root === 'tmp' ? tmpDir : previewDirFor(assetName);
    if (!dir) return;
    const file = path.join(dir, ...rest);
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  });
  await page.addInitScript(a => { window.W3D_ARGS = a; }, {
    scene: toUrl(scenePath) + '?v=' + Date.now(), sceneName, name: args.name, mode: args.mode, look: args.look,
    width: args.width && +args.width, size, ss: args.ss && +args.ss, quality: args.quality && +args.quality,
    draft: !!args.draft, png: !!args.png, glb: !!args.glb, export: args.export, pathtrace: args.pathtrace, pathtraceMock: !!process.env.W3D_PATHTRACE_MOCK, set: args.set,
    frames: args.frames && +args.frames, turntable: args.turntable ? +args.turntable : 0, ao: args['no-ao'] ? false : args.ao ? true : null,
  });

  console.log(`rendering ${path.relative(process.cwd(), scenePath) || scenePath}${args.draft ? ' (draft)' : ''}`);
  await page.goto(ORIGIN + '/stage.html');
  const broken = await Promise.race([page.waitForFunction(() => window.__w3d?.done, null, {timeout: (+args.timeout || 900) * 1000, polling: 250}).then(() => null), stageBroken]);
  if (broken) throw new Error('the stage did not start (' + broken.message + ')');
  const {report, error} = await page.evaluate(() => ({report: window.__w3d.report, error: window.__w3d.error}));
  if (error) {
    console.error('\nscene failed:\n' + error.replace(new RegExp(ORIGIN + '/fs', 'g'), ''));
    exitCode = 1;
  } else {
    const previewDir = previewDirFor(report.name);
    const kb = list => (list.reduce((sum, f) => sum + (fs.existsSync(path.join(outDir, f)) ? fs.statSync(path.join(outDir, f)).size : 0), 0) / 1024).toFixed(0);
    if (!args.draft) {
      fs.mkdirSync(outDir, {recursive: true});
      const meta = {name: report.name, generator: '3d-asset-studio', mode: report.mode, look: report.look, frame: report.frame};
      if (report.scene && Object.keys(report.scene).length) meta.scene = report.scene;
      if (report.mode === 'layers') Object.assign(meta, {order: report.order, layers: report.layers, verify: report.verify});
      if (report.mode === 'icons') meta.icons = report.layers;
      if (report.mode === 'still') meta.files = report.files.filter(f => !/\.(glb|usdz|stl|obj)$/.test(f));
      if (report.mode === 'sequence') {
        const Q = report.sequence, frames = report.files.filter(f => f.startsWith('frames/')).sort();
        meta.sequence = Q;
        const wants = (args.video ? String(args.video).split(',') : ['webp']).map(s => s.trim()).filter(Boolean);
        for (const fmt of wants) {
          if (fmt === 'webp') {
            const buf = animatedWebP(frames.map(f => path.join(outDir, f)), {width: report.frame.width, height: report.frame.height, duration: 1000 / Q.fps, loop: Q.loop ? 0 : 1});
            fs.writeFileSync(path.join(outDir, `${report.name}.webp`), buf);
            meta.animatedWebp = `${report.name}.webp`;
            console.log(`  animated WebP: ${(buf.length / 1024).toFixed(0)} kB`);
          } else if (fmt === 'webm' || fmt === 'mp4') {
            const r = encodeVideo(path.join(tmpDir, 'frames'), path.join(outDir, `${report.name}.${fmt}`), {fps: Q.fps, format: fmt, pad: Q.pad, width: report.frame.width, height: report.frame.height, background: report.background ?? '#ffffff'});
            if (r.ok) { meta[fmt] = `${report.name}.${fmt}`; if (fmt === 'webm') meta.webmAlpha = r.alpha; console.log(`  ${fmt}: ${(r.bytes / 1024).toFixed(0)} kB (${r.encoder})`); }
            else report.warnings.push(`${fmt} not written: ${r.reason}`);
          }
        }
      }
      for (const f of report.files) if (/\.(glb|usdz|stl|obj)$/.test(f)) (meta.models ??= []).push(f);
      fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta, null, 1) + '\n');
      if (report.mode === 'layers') {
        const snippetFile = writeSnippet(meta, {outDir, previewDir, base: args.base});
        const sprites = report.files.filter(f => f.endsWith('.webp'));
        console.log(`\n${report.name}: ${report.layers.length} layers, frame ${report.frame.width}×${report.frame.height}, ${kb(sprites)} kB of sprites in ${path.relative(process.cwd(), outDir) || outDir}`);
        for (const L of report.layers) console.log(`  ${String(L.z).padStart(2)} ${L.name.padEnd(18)} ${L.object.width}×${L.object.height}${L.shadow ? `  shadow ${L.shadow.width}×${L.shadow.height}` : '  (no shadow)'}`);
        console.log(`  rebuild check: layers vs render mean ${report.verify.mean}/255 (p99 ${report.verify.p99}); after WebP mean ${report.verify.webp.mean} (p99 ${report.verify.webp.p99})`);
        console.log(`snippet: ${snippetFile}`);
      } else if (report.mode === 'none') {
        console.log(`\n${report.name}: models only (no render) in ${path.relative(process.cwd(), outDir) || outDir}`);
      } else {
        const listed = [...report.files.filter(f => !f.startsWith('frames/')), ...['animatedWebp', 'webm', 'mp4'].map(k => meta[k]).filter(Boolean)];
        if (report.files.some(f => f.startsWith('frames/'))) listed.push(`frames/ (${report.files.filter(f => f.startsWith('frames/')).length})`);
        const total = kb([...report.files, ...['animatedWebp', 'webm', 'mp4'].map(k => meta[k]).filter(Boolean)]);
        console.log(`\n${report.name} (${report.mode}, ${report.look}): ${report.frame.width}×${report.frame.height} → ${listed.slice(0, 8).join(', ')}${listed.length > 8 ? ` … +${listed.length - 8}` : ''} (${total} kB) in ${path.relative(process.cwd(), outDir) || outDir}`);
        writeSnippet(meta, {outDir, previewDir, base: args.base});
      }
      for (const f of report.files.filter(f => /\.(glb|usdz|stl|obj)$/.test(f))) console.log(`  ${f}: ${kb([f])} kB`);
    }
    if (report.mode !== 'none') console.log(`previews: ${path.join(previewDir, 'sheet.png')} and beauty.png`);
    if (report.warnings.length) { console.log('\nwarnings:'); for (const w of report.warnings) console.log('  - ' + w); }
    console.log(`done in ${report.renderSeconds}s`);
  }
} catch (e) {
  console.error('error:', e.message);
  exitCode = 1;
} finally {
  await browser.close();
  if (!process.env.W3D_KEEP_TMP) fs.rmSync(tmpDir, {recursive: true, force: true}); else console.log("kept", tmpDir);
}
process.exit(exitCode);
