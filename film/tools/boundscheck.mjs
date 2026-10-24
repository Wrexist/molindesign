// Safe-area check for vertical factory films: renders every frame (default 15 per second) and lists every text glyph box
// (and stamp) drawn outside x 90–930 or below y 1450. The page must expose window.BOUNDS_RUN(step) (see film/noise/film.js).
//   node boundscheck.mjs --film noise [--step 0.0667]
// Exit code 1 when anything is out of bounds.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
const FILMDIR = opt('film', '');
const step = +opt('step', 1 / 15);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = await new Promise(res => {
  const s = http.createServer((req, rsp) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
    rsp.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(rsp);
  }).listen(0, () => res(s));
});
const flags = ['--no-sandbox', '--force-color-profile=srgb'];
let browser;
try { browser = await chromium.launch({ args: flags }); } catch { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: flags }); }
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${srv.address().port}/${FILMDIR}/index.html?render`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
const res = await page.evaluate(s => window.BOUNDS_RUN ? window.BOUNDS_RUN(s) : null, step);
await browser.close(); srv.close();
if (!res) { console.log('page has no BOUNDS_RUN'); process.exit(2); }
console.log(`BOUNDS CHECK  (every glyph box inside x 90–930, above y 1450; frames every ${step.toFixed(3)} s)`);
if (!res.length) console.log('ok    nothing out of bounds');
res.forEach(r => console.log(`FAIL  ${r.from.toFixed(2)}–${r.to.toFixed(2)} s  x ${r.x0}…${r.x1}  bottom ${r.y1}  "${r.text}"`));
process.exit(res.length ? 1 : 0);
