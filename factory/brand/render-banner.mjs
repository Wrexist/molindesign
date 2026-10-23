// node render-banner.mjs → banner.png (2560×1440 YouTube channel art)
import { chromium } from '../../film/tools/node_modules/playwright-core/index.mjs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 2560, height: 1440 } });
await p.goto('file://' + path.join(here, 'banner.html')); await p.evaluate(() => document.fonts.ready);
await p.locator('#c').screenshot({ path: path.join(here, 'banner.png') });
await b.close();
