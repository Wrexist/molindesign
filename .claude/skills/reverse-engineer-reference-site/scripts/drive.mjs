#!/usr/bin/env node
// Perform a gesture on a page in an already-running Chrome-family browser (CDP).
// REA observes passively and its scenario actions have no wheel, scroll or hover,
// so this is the "hand" that performs the interaction while REA watches.
//
//   node drive.mjs <cdp-endpoint> <url-substring> <gesture> [--nm <node_modules dir with playwright-core>]
//
// Gestures (combine with "+", e.g. "top+wheel:30x300@120+sweep"):
//   top                      jump to scroll 0 and wait 800 ms
//   wheel:<n>x<dy>@<ms>      n wheel ticks of dy px, ms apart (real wheel events, so custom smooth-scroll runs)
//   keys:<Key>x<n>@<ms>      e.g. keys:PageDownx4@1200 (for sites that block the wheel)
//   sweep                    pointer figure-eight across the viewport for ~4 s (cursor, parallax, tilt effects)
//   hover:<css>              move the pointer onto the first match and hold 1.5 s
//   drag:<x1>,<y1>,<x2>,<y2> press, move in 30 steps, release (drag sliders, orbit reveals)
//   wait:<ms>
import { createRequire } from 'module';
import path from 'path';

const args = process.argv.slice(2);
const nmIdx = args.indexOf('--nm');
const nm = nmIdx >= 0 ? args.splice(nmIdx, 2)[1] : process.env.REA_NODE_MODULES;
const [endpoint, urlPart, gesture = 'wheel:20x400@150'] = args;
if (!endpoint || !urlPart) { console.error('usage: drive.mjs <cdp-endpoint> <url-substring> <gesture> [--nm dir]'); process.exit(64); }
const require = createRequire(path.join(nm || process.cwd(), 'noop.js'));
const { chromium } = require('playwright-core');

const browser = await chromium.connectOverCDP(endpoint);
const page = browser.contexts().flatMap(c => c.pages()).find(p => p.url().includes(urlPart));
if (!page) { console.error(`no page whose URL contains ${urlPart}`); process.exit(2); }
const vp = await page.evaluate(() => ({ w: innerWidth, h: innerHeight }));
const log = [];
await page.mouse.move(vp.w / 2, vp.h / 2);

for (const g of gesture.split('+')) {
  const [kind, spec = ''] = g.split(/:(.*)/s);
  const t0 = Date.now();
  if (kind === 'top') {
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(800);
  } else if (kind === 'wheel') {
    const [, n, dy, ms] = spec.match(/(\d+)x(-?\d+)@(\d+)/);
    for (let i = 0; i < +n; i++) { await page.mouse.wheel(0, +dy); await page.waitForTimeout(+ms); }
  } else if (kind === 'keys') {
    const [, key, n, ms] = spec.match(/(\w+)x(\d+)@(\d+)/);
    for (let i = 0; i < +n; i++) { await page.keyboard.press(key); await page.waitForTimeout(+ms); }
  } else if (kind === 'sweep') {
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI * 2;
      await page.mouse.move(vp.w / 2 + Math.sin(a) * vp.w * 0.4, vp.h / 2 + Math.sin(a * 2) * vp.h * 0.3);
      await page.waitForTimeout(33);
    }
  } else if (kind === 'hover') {
    const box = await page.locator(spec).first().boundingBox();
    if (box) { await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 20 }); await page.waitForTimeout(1500); }
    else log.push({ warn: `hover target not found: ${spec}` });
  } else if (kind === 'drag') {
    const [x1, y1, x2, y2] = spec.split(',').map(Number);
    await page.mouse.move(x1, y1); await page.mouse.down();
    await page.mouse.move(x2, y2, { steps: 30 }); await page.mouse.up(); await page.waitForTimeout(800);
  } else if (kind === 'wait') {
    await page.waitForTimeout(+spec);
  } else { console.error(`unknown gesture ${kind}`); process.exit(64); }
  log.push({ gesture: g, ms: Date.now() - t0 });
}
const state = await page.evaluate(() => ({ url: location.href, scrollY: Math.round(scrollY), docH: document.documentElement.scrollHeight }));
if (state.docH <= vp.h + 2 && /wheel|keys/.test(gesture)) log.push({ warn: 'document does not scroll natively: a virtual-scroll site (check hot path for wheel handlers) or a non-scrolling page (pick a deeper URL)' });
console.log(JSON.stringify({ ...state, viewport: vp, steps: log }));
// Disconnect only; the browser belongs to the caller.
await browser.close().catch(() => {});
