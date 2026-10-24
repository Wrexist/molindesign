#!/usr/bin/env node
// check-site: the verification loop for one static site in this repo (skill: site-verification-loop).
//
//   node tools/check-site.mjs <site-dir> [--page about.html] [--wait 2500] [--out dir] [--static]
//
// Static pass (no browser): root-absolute paths, reduced-motion coverage, page metadata,
// secrets, external scripts. Browser pass: serves the repo under /molindesign/ exactly like
// GitHub Pages, then loads the page at desktop, phone and desktop+reduced-motion, scrolls it
// end to end and reports errors, failed requests, sideways scroll, tiny tap targets, unnamed
// controls and text still invisible after the scroll. Screenshots go to --out.
// Exit 1 when anything FAILs. WARN is advice; read it, fix it or say why not.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PREFIX = '/molindesign/'; // GitHub Pages project prefix: a "/x.css" path 404s here just as it would live
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i > -1 ? args[i + 1] : d; };
const flag = k => args.includes('--' + k);
const VALUED = ['--page', '--wait', '--out'];
const dirArg = args.find((a, i) => !a.startsWith('--') && !VALUED.includes(args[i - 1]));
if (!dirArg) { console.error('usage: node tools/check-site.mjs <site-dir> [--page file.html] [--wait ms] [--out dir] [--static]'); process.exit(2); }
const SITE = path.resolve(ROOT, dirArg);
if (!SITE.startsWith(ROOT) || !fs.existsSync(SITE)) { console.error('no such site dir inside the repo: ' + dirArg); process.exit(2); }
const REL = path.relative(ROOT, SITE).split(path.sep).join('/');
const PAGE = opt('page', 'index.html');
const WAIT = +opt('wait', 2500);
const OUT = path.resolve(opt('out', path.join(os.tmpdir(), 'site-check', REL.replace(/\//g, '_') || 'root')));

const rows = [];
const add = (st, area, msg) => rows.push([st, area, msg]);

/* ---------------- static pass ---------------- */
const SKIP = new Set(['node_modules', '.git', 'out', 'dist', 'fonts', 'assets']);
function walk(d, acc = []) {
  for (const n of fs.readdirSync(d, { withFileTypes: true })) {
    if (n.name.startsWith('.') || SKIP.has(n.name)) continue;
    const p = path.join(d, n.name);
    if (n.isDirectory()) { if (REL !== '') walk(p, acc); } // repo root: top-level files only
    else if (/\.(html|css|js|mjs)$/.test(n.name) && fs.statSync(p).size < 2e6) acc.push(p);
  }
  return acc;
}
const files = walk(SITE);
const rel = p => path.relative(ROOT, p);
const lineOf = (s, i) => s.slice(0, i).split('\n').length;

const ROOT_ABS = {
  html: /\b(?:src|href|poster|action|data-src)\s*=\s*["']\/(?!\/)[^"']*/g,
  css: /url\(\s*["']?\/(?!\/)[^)"']*/g,
  js: /["'`]\/(?!\/)[\w./-]+\.(?:png|jpe?g|webp|avif|gif|svg|css|js|json|mp4|webm|mp3|ogg|wav|woff2?|glb|gltf|hdr|ktx2)["'`]/g
};
const SECRET = /(?:sk-(?:ant-)?[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[abp]-[A-Za-z0-9-]{20,})/;
const MOTION = /@keyframes|\btransition\s*:|\banimation\s*:|requestAnimationFrame|\.animate\(|gsap\.|ScrollTrigger/;
let rootAbs = 0, hasMotion = false, hasReduced = false;
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8'), ext = path.extname(f).slice(1);
  const re = ROOT_ABS[ext === 'mjs' ? 'js' : ext];
  if (re) for (const m of s.matchAll(re)) {
    if (/\/(?:admin|api|\.netlify)\//.test(m[0])) continue; // server routes, not static assets
    if (rootAbs++ < 6) add('FAIL', 'Paths', `${rel(f)}:${lineOf(s, m.index)} root-absolute ${m[0].trim().slice(0, 70)} (breaks under ${PREFIX}; use a relative path)`);
  }
  const sm = s.match(SECRET);
  if (sm) add('FAIL', 'Secrets', `${rel(f)}:${lineOf(s, sm.index)} looks like a credential (${sm[0].slice(0, 8)}…). Remove it and rotate it.`);
  if (MOTION.test(s)) hasMotion = true;
  if (/prefers-reduced-motion/.test(s)) hasReduced = true;
}
if (rootAbs > 6) add('FAIL', 'Paths', `…and ${rootAbs - 6} more root-absolute paths`);
if (!rootAbs) add('PASS', 'Paths', 'every local URL is relative');
if (hasMotion && !hasReduced) add('FAIL', 'Motion', 'the site animates but nothing checks prefers-reduced-motion');
else if (hasMotion) add('PASS', 'Motion', 'animates, and prefers-reduced-motion is handled somewhere in the code (the reduced run below shows how well)');

const pagePath = path.join(SITE, PAGE);
if (!fs.existsSync(pagePath)) { add('FAIL', 'Page', `${REL}/${PAGE} does not exist`); finish(); }
const html = fs.readFileSync(pagePath, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const has = re => re.test(html);
if (!has(/<html[^>]*\blang=/i)) add('FAIL', 'Meta', '<html> has no lang attribute');
if (!has(/<meta[^>]+name=["']viewport["']/i)) add('FAIL', 'Meta', 'no viewport meta');
if (!has(/<title>[^<]{3,}<\/title>/i)) add('FAIL', 'Meta', 'no <title>');
if (!has(/<meta[^>]+name=["']description["']/i)) add('WARN', 'Meta', 'no meta description');
if (!has(/<meta[^>]+property=["']og:image["']/i)) add('WARN', 'Meta', 'no og:image (link previews will be blank)');
const robots = (html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)/i) || [])[1];
add('INFO', 'Meta', robots ? `robots: ${robots}` : 'no robots meta: the page is indexable');
const ALLOWED_SCRIPT = /^(?:https?:)?\/\/(?:cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com)\//;
for (const m of html.matchAll(/<script[^>]+src=["']((?:https?:)?\/\/[^"']+)/gi))
  if (!ALLOWED_SCRIPT.test(m[1])) add('WARN', 'Scripts', `third-party script ${m[1].slice(0, 80)}: pin a version and keep it only if the site needs it`);
  else if (!/@\d|\/\d+\.\d+/.test(m[1])) add('WARN', 'Scripts', `CDN script without a pinned version: ${m[1].slice(0, 80)}`);

if (flag('static')) finish();

/* ---------------- browser pass ---------------- */
async function loadChromium() {
  for (const name of ['playwright-core', 'playwright']) {
    try { return (await import(name)).chromium; } catch {}
  }
  try { // fall back to a global install (the cloud container ships one)
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return createRequire(path.join(g, 'x.js'))('playwright').chromium;
  } catch {}
  return null;
}
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.glb': 'model/gltf-binary', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml' };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let u = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      if (!u.startsWith(PREFIX)) { rsp.writeHead(404); rsp.end(); return; }
      let p = path.join(ROOT, u.slice(PREFIX.length));
      if (p.startsWith(ROOT) && fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!p.startsWith(ROOT) || !fs.existsSync(p)) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

const MODES = [
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
  { name: 'phone', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'reduced', viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }
];

// Runs in the page after the full scroll.
function audit(isPhone) {
  const vis = el => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const desc = el => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '')).slice(0, 60);
  const out = {};
  const de = document.documentElement;
  out.overflow = Math.max(de.scrollWidth, document.body ? document.body.scrollWidth : 0) - innerWidth;
  if (out.overflow > 1) {
    out.wide = [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0 && vis(el); })
      .slice(0, 4).map(el => desc(el) + ' → ' + Math.round(el.getBoundingClientRect().right) + 'px');
  }
  const ctrls = [...document.querySelectorAll('a[href], button, [role=button], input:not([type=hidden]), select, textarea, summary, [tabindex="0"]')].filter(el => vis(el) && !el.closest('[inert], [aria-hidden="true"], [hidden]'));
  out.unnamed = ctrls.filter(el => {
    const name = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || el.getAttribute('placeholder') || el.getAttribute('value') || '').trim();
    const lab = el.getAttribute('aria-labelledby') || (el.id && document.querySelector('label[for="' + el.id + '"]')) || el.closest('label') || el.querySelector('img[alt]:not([alt=""]), svg[aria-label], [aria-label]');
    return !name && !lab;
  }).slice(0, 5).map(desc);
  if (isPhone) {
    const small = ctrls.filter(el => {
      if (el.closest('p') && el.tagName === 'A') return false; // inline links in running text are exempt (WCAG 2.5.8)
      const r = el.getBoundingClientRect();
      if (r.width <= 2 && r.height <= 2) return false; // visually hidden input; its label is the target
      return r.width < 24 || r.height < 24;
    });
    out.small = small.length; out.smallEx = small.slice(0, 4).map(el => { const r = el.getBoundingClientRect(); return desc(el) + ' ' + Math.round(r.width) + '×' + Math.round(r.height); });
  }
  // text inside a scroll reveal that is still invisible after the visitor scrolled past it: a reveal that never fired.
  // Only reveal-looking wrappers count, so tabs, menus and game states that are hidden on purpose stay out of it.
  const REVEAL = /(?:^|[\s_-])(?:rise|reveal|fade|appear|aos|in-?view|animate|split|mask|line|lines|stagger)(?:$|[\s_-])/i;
  const hiddenBy = el => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (+cs.opacity < 0.05 || cs.visibility === 'hidden') return (REVEAL.test(n.className && n.className.baseVal == null ? n.className : '') || n.hasAttribute('data-reveal') || n.hasAttribute('data-aos')) ? n : null;
    }
    return null;
  };
  const hiddenText = [...document.querySelectorAll('h1, h2, h3, p, li')].filter(el => {
    if (!el.textContent.trim() || el.closest('[hidden], [inert], [aria-hidden="true"], dialog:not([open]), [role=dialog], [role=menu], [role=tabpanel], template')) return false;
    const r = el.getBoundingClientRect(); return r.width && r.height && hiddenBy(el);
  });
  hiddenText.forEach((el, i) => el.setAttribute('data-check-hidden', i));
  out.hiddenText = hiddenText.length;
  out.imgNoAlt = [...document.images].filter(i => !i.hasAttribute('alt')).length;
  out.h1 = document.querySelectorAll('h1').length;
  return out;
}

const chromium = await loadChromium();
if (!chromium) { add('WARN', 'Browser', 'Playwright not found: run `npm i` in tools/ (or pass --static). Browser checks skipped.'); finish(); }
fs.mkdirSync(OUT, { recursive: true });
const srv = await serve();
const base = `http://127.0.0.1:${srv.address().port}${PREFIX}${REL ? REL + '/' : ''}${PAGE === 'index.html' ? '' : PAGE}`;
let browser;
try { browser = await chromium.launch({ args: ['--no-sandbox'] }); }
catch { browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); }

for (const m of MODES) {
  const ctx = await browser.newContext({ viewport: m.viewport, isMobile: !!m.isMobile, hasTouch: !!m.hasTouch, deviceScaleFactor: m.deviceScaleFactor || 1, reducedMotion: m.reducedMotion || 'no-preference' });
  const page = await ctx.newPage();
  const errs = [], fails = [], ext = [];
  const local = u => u.startsWith(`http://127.0.0.1:${srv.address().port}/`);
  page.on('pageerror', e => errs.push(e.message.split('\n')[0]));
  page.on('console', c => { // the page's own errors only; embeds (maps, video players) log their own noise
    if (c.type() === 'error' && !/Failed to load resource/.test(c.text()) && (!c.location()?.url || local(c.location().url))) errs.push(c.text().split('\n')[0]);
  });
  page.on('response', r => { if (r.status() >= 400) (local(r.url()) ? fails : ext).push(r.status() + ' ' + r.url().replace(/^http:\/\/127\.0\.0\.1:\d+/, '')); });
  page.on('requestfailed', r => { if (!/ERR_ABORTED/.test(r.failure()?.errorText || '')) (local(r.url()) ? fails : ext).push((r.failure()?.errorText || 'failed') + ' ' + r.url().replace(/^http:\/\/127\.0\.0\.1:\d+/, '')); });
  try { await page.goto(base, { waitUntil: 'load', timeout: 30000 }); }
  catch (e) { add('FAIL', m.name, 'page did not load: ' + e.message.split('\n')[0]); await ctx.close(); continue; }
  await page.waitForTimeout(WAIT);
  try { // a loader or intro covering the page: wait for it to lift (cinematic-loader sites take a few seconds)
    await page.waitForFunction(() => {
      const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      for (let n = el; n; n = n.parentElement) if (/loader|preload|splash|intro-?cover/i.test((n.id || '') + ' ' + (typeof n.className === 'string' ? n.className : ''))) return false;
      return true;
    }, null, { timeout: 15000, polling: 250 });
  } catch { add('WARN', m.name, `a loader still covers the page ${WAIT / 1000 + 15} s after load`); }
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, `${m.name}-top.png`) });
  // scroll end to end like a visitor, so lazy sections mount and reveals fire
  for (let i = 0; i < 60; i++) {
    const done = await page.evaluate(() => { const y = scrollY; scrollBy(0, innerHeight * 0.7); return scrollY === y; });
    await page.waitForTimeout(220);
    if (done) break;
  }
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `${m.name}-end.png`) });
  const a = await page.evaluate(audit, m.name === 'phone');
  if (a.hiddenText) { // give each suspect a fair chance: bring it into view, wait for its reveal, test again
    const still = [];
    for (let i = 0; i < Math.min(a.hiddenText, 12); i++) {
      const sel = `[data-check-hidden="${i}"]`;
      await page.evaluate(s => document.querySelector(s)?.scrollIntoView({ block: 'center' }), sel);
      await page.waitForTimeout(1200);
      const r = await page.evaluate(s => { const el = document.querySelector(s); if (!el) return null; for (let n = el; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if (+cs.opacity < 0.05 || cs.visibility === 'hidden') return (el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '')) + ' in .' + String(n.className).split(' ').slice(0, 2).join('.'); } return null; }, sel);
      if (r) still.push(r);
    }
    a.hiddenText = still.length; a.hiddenEx = [...new Set(still)].slice(0, 4);
  }
  const tag = m.name;
  if (errs.length) add('FAIL', tag, `${errs.length} JS error(s): ${[...new Set(errs)].slice(0, 3).join(' | ').slice(0, 300)}`);
  if (fails.length) add('FAIL', tag, `${fails.length} local request(s) failed: ${[...new Set(fails)].slice(0, 4).join(', ').slice(0, 300)}`);
  if (ext.length) add('WARN', tag, `${ext.length} external request(s) failed (offline or blocked?): ${[...new Set(ext)].slice(0, 2).join(', ').slice(0, 200)}`);
  if (a.overflow > 1) add('FAIL', tag, `page scrolls sideways by ${a.overflow}px; widest: ${(a.wide || []).join('; ')}`);
  if (a.unnamed.length) add('WARN', tag, `controls without an accessible name: ${a.unnamed.join(', ')}`);
  if (a.small) add('WARN', tag, `${a.small} tap target(s) under 24px: ${a.smallEx.join(', ')} (aim for 44px on touch)`);
  if (a.hiddenText) add(m.name === 'reduced' ? 'FAIL' : 'WARN', tag, `${a.hiddenText} text block(s) still invisible after scrolling past them: ${a.hiddenEx.join(', ')}`);
  if (a.imgNoAlt) add('WARN', tag, `${a.imgNoAlt} <img> without alt`);
  if (m.name === 'desktop' && a.h1 !== 1) add('WARN', tag, `${a.h1} <h1> elements (expected 1)`);
  if (!errs.length && !fails.length && !(a.overflow > 1) && !(m.name === 'reduced' && a.hiddenText)) add('PASS', tag, 'loads, scrolls end to end, no errors' + (m.name === 'phone' ? ', no sideways scroll' : ''));
  await ctx.close();
}
await browser.close();
srv.close();
add('INFO', 'Shots', path.relative(process.cwd(), OUT) || OUT);
finish();

function finish() {
  const order = { FAIL: 0, WARN: 1, PASS: 2, INFO: 3 };
  rows.sort((a, b) => order[a[0]] - order[b[0]]);
  const color = { FAIL: '\x1b[31m', WARN: '\x1b[33m', PASS: '\x1b[32m', INFO: '\x1b[2m' };
  const tty = process.stdout.isTTY;
  console.log(`\nSITE CHECK  ${REL || '.'}/${PAGE}   (served at ${PREFIX}${REL ? REL + '/' : ''})\n`);
  for (const [st, area, msg] of rows) console.log(`${tty ? color[st] : ''}${st.padEnd(4)}${tty ? '\x1b[0m' : ''}  ${area.padEnd(8)} ${msg}`);
  const f = rows.filter(r => r[0] === 'FAIL').length, w = rows.filter(r => r[0] === 'WARN').length;
  console.log(`\nOverall: ${f ? 'NOT READY' : 'READY'}  (${f} fail, ${w} warn)\n`);
  process.exit(f ? 1 : 0);
}
