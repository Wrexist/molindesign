// node render-avatar.mjs → avatar.png (1080×1080; TikTok crops it to a circle, so keep the mark inside the middle 70 %)
import { chromium } from '../../film/tools/node_modules/playwright-core/index.mjs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 1080, height: 1080 } });
await p.goto('file://' + path.join(here, 'avatar.html')); await p.evaluate(() => document.fonts.ready);
await p.locator('#c').screenshot({ path: path.join(here, 'avatar.png') });
await b.close();
