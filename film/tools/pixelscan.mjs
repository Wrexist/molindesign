// Shape-level safe-area check (boundscheck.mjs only measures glyphs): renders every frame (default 15 per second) in the
// page and reports any pixel that differs from the background outside the safe rect x 90–930, y 300–1430.
//   node pixelscan.mjs --film gta-lucia [--step 0.0667] [--x0 90 --x1 930 --y0 300 --y1 1430 --tol 24]
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
const FILMDIR = opt('film', ''), step = +opt('step', 1 / 15);
const R = { x0: +opt('x0', 90), x1: +opt('x1', 930), y0: +opt('y0', 300), y1: +opt('y1', 1430), tol: +opt('tol', 24) };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = await new Promise(res => { const s = http.createServer((req, rsp) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(rsp); }).listen(0, () => res(s)); });
const flags = ['--no-sandbox', '--force-color-profile=srgb'];
let browser; try { browser = await chromium.launch({ args: flags }); } catch { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: flags }); }
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${srv.address().port}/${FILMDIR}/index.html?render`);
await page.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
const res = await page.evaluate(([step, R]) => {
  const cv = document.getElementById('film'), g = cv.getContext('2d', { willReadFrequently: true }), out = [];
  const bg = g.getImageData(5, 5, 1, 1).data;
  for (let t = 0; t <= window.DUR + 1e-6; t += step) {
    window.FILM.frame(g, t);
    const d = g.getImageData(0, 0, 1080, 1920).data; let n = 0, bx = [1e9, -1, 1e9, -1];
    const b0 = [d[0], d[1], d[2]];
    for (let y = 0; y < 1920; y += 2) for (let x = 0; x < 1080; x += 2) {
      if (x >= R.x0 && x <= R.x1 && y >= R.y0 && y <= R.y1) continue;
      const i = (y * 1080 + x) * 4; if (Math.abs(d[i] - b0[0]) + Math.abs(d[i + 1] - b0[1]) + Math.abs(d[i + 2] - b0[2]) > R.tol) { n++; bx = [Math.min(bx[0], x), Math.max(bx[1], x), Math.min(bx[2], y), Math.max(bx[3], y)]; }
    }
    if (n) out.push({ t: +t.toFixed(3), n, bx });
  }
  return out;
}, [step, R]);
await browser.close(); srv.close();
console.log(`PIXEL SCAN  (non-background pixels outside x ${R.x0}–${R.x1}, y ${R.y0}–${R.y1}; frames every ${step.toFixed(3)} s)`);
if (!res.length) console.log('ok    nothing outside the safe rect');
res.forEach(r => console.log(`FAIL  ${r.t.toFixed(2)} s  ${r.n * 4} px  x ${r.bx[0]}…${r.bx[1]}  y ${r.bx[2]}…${r.bx[3]}`));
process.exit(res.length ? 1 : 0);
