// Offline renderer for film/. Headless Chromium draws render(t) frame by frame; ffmpeg joins, adds grain and masters.
//   node render.mjs sheet  [--from 0 --to 34 --step 1 --cols 6 --w 320 --out ../out/check/sheet.jpg]
//   node render.mjs strip  --from 23 --to 24.2 [--step 0.1 ...]           (same as sheet with a fine step)
//   node render.mjs sheet  --times 3.2,9.5,12 (exact times; e.g. one per shot)
//   node render.mjs thumb  [--out ../out/thumbnail.jpg]   (FILM.thumb() at 1280×720)
//   node render.mjs still  --t 29.9 [--out ../out/poster.jpg]
//   node render.mjs video  [--fps 30 --samples 4 --shutter 0.5 --workers 3]
//   node render.mjs audio                                                 (renders SCORE offline → out/mix.wav)
//   node render.mjs readcheck                                             (every text stays on screen long enough to read)
//   node render.mjs events                                                (exports DUR + EV → out/events.json)
//   node render.mjs encode                                                (re-encode existing frames + master)
//   node render.mjs all                                                   (audio, video, master, poster, checks)
// Any mode takes --film <dir> to render another film in film/<dir>/ (its own index.html and out/); size, length,
// poster time and file name come from the page's window.FILM { W, H, DUR, POSTER, SLUG }.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const args = process.argv.slice(2);
const mode = args[0] || 'sheet';
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
const FILMDIR = opt('film', '');
const OUT = path.join(ROOT, FILMDIR, 'out');
const PAGE = (FILMDIR ? FILMDIR + '/' : '') + 'index.html';
let SPEC = { W: 1920, H: 1080, DUR: 34, POSTER: 29.9, SLUG: 'halden-lf1-held' };
fs.mkdirSync(path.join(OUT, 'check'), { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.md': 'text/plain' };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    }).listen(0, () => res(srv));
  });
}
async function launch() {
  const flags = ['--no-sandbox', '--disable-gpu-vsync', '--force-color-profile=srgb', '--autoplay-policy=no-user-gesture-required'];
  try { return await chromium.launch({ args: flags }); }
  catch { return await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: flags }); }
}
async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: SPEC.W, height: SPEC.H }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => { errors.push(e.message); console.error('[pageerror]', e.message); });
  await page.goto(`http://127.0.0.1:${port}/${PAGE}?render`);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
  const f = await page.evaluate(() => { const F = window.FILM || {}; return { W: F.W, H: F.H, DUR: window.DUR, POSTER: F.POSTER, SLUG: F.SLUG }; });
  for (const k in f) if (f[k] != null) SPEC[k] = f[k];
  page._errors = errors;
  return page;
}
const ff = (a) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
function run(cmd, a) { const r = spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 64 << 20 }); return (r.stdout || '') + (r.stderr || ''); }

async function sheet(page, times, cols, w, out, label = true) {
  const data = await page.evaluate(async ({ times, cols, w, label }) => {
    const src = document.getElementById('film'), h = Math.round(w * src.height / src.width), rows = Math.ceil(times.length / cols), pad = label ? 22 : 0;
    const c = document.createElement('canvas'); c.width = cols * w; c.height = rows * (h + pad);
    const g = c.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, c.width, c.height);
    times.forEach((t, i) => {
      window.render(t);
      const x = (i % cols) * w, y = Math.floor(i / cols) * (h + pad);
      g.drawImage(src, x, y, w, h);
      if (label) { g.fillStyle = '#ece8df'; g.font = '13px monospace'; g.fillText(t.toFixed(2) + 's', x + 6, y + h + 16); }
    });
    return c.toDataURL('image/jpeg', .9);
  }, { times, cols, w, label });
  fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
  console.log('wrote', path.relative(ROOT, out));
}

async function audio(page) {
  const b64 = await page.evaluate(async () => {
    const sr = 48000, off = new OfflineAudioContext(2, Math.ceil(sr * window.DUR), sr);
    window.SCORE(off);
    const buf = await off.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
    let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
    const k = peak > 0 ? 0.89 / peak : 1;
    const pcm = new Int16Array(n * 2);
    for (let i = 0; i < n; i++) { pcm[2 * i] = Math.max(-1, Math.min(1, L[i] * k)) * 32767; pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i] * k)) * 32767; }
    const bytes = new Uint8Array(pcm.buffer); let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  });
  const pcm = Buffer.from(b64, 'base64');
  const hdr = Buffer.alloc(44);
  hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12);
  hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(48000, 24);
  hdr.writeUInt32LE(48000 * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(path.join(OUT, 'mix.wav'), Buffer.concat([hdr, pcm]));
  console.log('wrote out/mix.wav');
}

async function video(browser, port) {
  const fps = +opt('fps', 30), samples = +opt('samples', 4), shutter = +opt('shutter', .5), workers = +opt('workers', 3);
  const dur = SPEC.DUR, n = Math.round(dur * fps);
  const dir = path.join(OUT, 'frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const pages = await Promise.all(Array.from({ length: workers }, () => openPage(browser, port)));
  let next = 0, done = 0; const t0 = Date.now();
  await Promise.all(pages.map(async page => {
    for (;;) {
      const i = next++; if (i >= n) break;
      const t = (i + .5) / fps;            // sample at the centre of each frame's time slot
      const data = await page.evaluate(({ t, samples, shutter, fps }) => { window.render(t, samples, shutter, fps); return document.getElementById('film').toDataURL('image/jpeg', .95); }, { t, samples, shutter, fps });
      fs.writeFileSync(path.join(dir, String(i).padStart(5, '0') + '.jpg'), Buffer.from(data.split(',')[1], 'base64'));
      if (++done % 60 === 0) console.log(`frame ${done}/${n}  ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
    }
  }));
  for (const p of pages) { if (p._errors.length) throw new Error('page errors during render'); await p.close(); }
  encode(fps);
}
function encode(fps = +opt('fps', 30)) {
  // grain belongs in the encoder, not the page: drawn grain makes every frame incompressible
  ff(['-framerate', String(fps), '-i', path.join(OUT, 'frames', '%05d.jpg'), '-vf', 'noise=alls=3:allf=t,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-movflags', '+faststart', path.join(OUT, 'video.mp4')]);
  console.log('wrote out/video.mp4');
}

function master() {
  const wav = path.join(OUT, 'mix.wav'), vid = path.join(OUT, 'video.mp4'), out = path.join(OUT, SPEC.SLUG + '.mp4');
  const m = run('ffmpeg', ['-hide_banner', '-nostats', '-i', wav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']);
  const j = JSON.parse(m.slice(m.lastIndexOf('{'), m.lastIndexOf('}') + 1));
  const ln = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  ff(['-i', vid, '-i', wav, '-af', ln + ',aresample=192000,alimiter=limit=0.72:level=false:attack=1:release=60,aresample=48000', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out]);
  console.log('wrote', path.relative(ROOT, out));
  checks(out);
}
function checks(file) {
  const r128 = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
  const I = (r128.match(/I:\s+(-?[\d.]+) LUFS/g) || []).pop(), TP = (r128.match(/Peak:\s+(-?[\d.]+) dBFS/g) || []).pop();
  const bd = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-vf', 'blackdetect=d=0.4:pix_th=0.02', '-an', '-f', 'null', '-']);
  const blacks = (bd.match(/black_start:[\d.]+ black_end:[\d.]+/g) || []);
  const probe = run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height,r_frame_rate,codec_name', '-of', 'compact', file]);
  console.log('\nCHECKS\n' + probe.trim() + '\nintegrated ' + I + '   true peak ' + TP + '\nblack spans ≥0.4 s: ' + (blacks.join('  ') || 'none'));
}

async function readcheck(page) {
  const res = await page.evaluate(() => {
    const seen = {};
    for (let f = 0; f < Math.round(window.DUR * 24); f++) {
      const t = f / 24;
      window.TEXTS(t).forEach(x => { (seen[x.id] = seen[x.id] || { text: x.text, frames: 0 }).frames++; });
    }
    return seen;
  });
  let ok = true;
  console.log('\nREADCHECK  (need ≥ letters/15 + 1.5 s, and ≥ 1.8 s)');
  for (const [id, v] of Object.entries(res)) {
    const letters = v.text.replace(/\s/g, '').length, need = Math.max(1.8, letters / 15 + 1.5), have = v.frames / 24;
    const pass = have + 1e-6 >= need; ok = ok && pass;
    console.log(`${pass ? 'ok  ' : 'FAIL'}  ${id.padEnd(6)} ${have.toFixed(2)}s / ${need.toFixed(2)}s  "${v.text}"`);
  }
  if (!ok) process.exitCode = 2;
}

const srv = await serve(); const port = srv.address().port;
const browser = await launch();
if (mode === 'master' || mode === 'encode' || mode === 'video') { const p = await openPage(browser, port); await p.close(); }   // read the film's spec
try {
  if (mode === 'video') await video(browser, port);
  else if (mode === 'master') master();
  else if (mode === 'encode') { encode(); master(); }
  else if (mode === 'all') {
    const page = await openPage(browser, port);
    await audio(page); await readcheck(page);
    await sheet(page, Array.from({ length: Math.ceil(SPEC.DUR) }, (_, i) => i + .5), SPEC.H > SPEC.W ? 10 : 6, SPEC.H > SPEC.W ? 216 : 320, path.join(OUT, 'check', 'sheet.jpg'));
    await sheet(page, [SPEC.POSTER], 1, SPEC.W, path.join(OUT, 'poster.jpg'), false);
    await page.close();
    await video(browser, port); master();
  } else {
    const page = await openPage(browser, port);
    if (mode === 'sheet' || mode === 'strip') {
      const from = +opt('from', 0), to = +opt('to', SPEC.DUR), step = +opt('step', mode === 'strip' ? .1 : 1);
      const times = []; if (opt('times')) opt('times').split(',').forEach((v) => times.push(+v)); else for (let t = from; t <= to + 1e-9; t += step) times.push(+t.toFixed(4));
      await sheet(page, times, +opt('cols', 6), +opt('w', 320), path.resolve(opt('out', path.join(OUT, 'check', mode + '.jpg'))));
    } else if (mode === 'still') {
      await sheet(page, [+opt('t', SPEC.POSTER)], 1, +opt('w', SPEC.W), path.resolve(opt('out', path.join(OUT, 'check', 'still.jpg'))), false);
    } else if (mode === 'thumb') {
      const data = await page.evaluate(() => { window.FILM.thumb(); const src = document.getElementById('film'), c = document.createElement('canvas'); c.width = 1280; c.height = 720; c.getContext('2d').drawImage(src, 0, 0, 1280, 720); return c.toDataURL('image/jpeg', .92); });
      const out = path.resolve(opt('out', path.join(OUT, 'thumbnail.jpg'))); fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64')); console.log('wrote', path.relative(ROOT, out));
    } else if (mode === 'audio') await audio(page);
    else if (mode === 'readcheck') await readcheck(page);
    else if (mode === 'events') {
      const ev = await page.evaluate(() => ({ DUR: window.DUR, EV: window.EV }));
      fs.writeFileSync(path.join(OUT, 'events.json'), JSON.stringify(ev, null, 1)); console.log('wrote out/events.json');
    }
    if (page._errors.length) process.exitCode = 1;
  }
} finally { await browser.close(); srv.close(); }
