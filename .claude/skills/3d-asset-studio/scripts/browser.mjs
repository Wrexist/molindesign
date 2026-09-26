// Shared by render.mjs, preview.mjs and check-env.mjs: find Playwright and a Chromium, launch it with
// software WebGL, and serve local files to the page from a fake origin (no localhost server, no file://).
import fs from 'node:fs';
import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const THREE_VERSION = '0.170.0';
export const ORIGIN = 'http://w3d.local';

export function fail(msg) { console.error('error: ' + msg); process.exit(1); }

let npmRoot;
function globalRoot() {
  if (npmRoot !== undefined) return npmRoot;
  try { npmRoot = execSync('npm root -g', {stdio: ['ignore', 'pipe', 'ignore']}).toString().trim(); } catch { npmRoot = null; }
  return npmRoot;
}

/** require() a package from the project, the skill, or the global npm root. */
export function requireFrom(name, extraBases = []) {
  for (const base of [process.cwd(), ...extraBases, SKILL, globalRoot()].filter(Boolean)) {
    try { return {mod: createRequire(path.join(base, 'noop.js'))(name), from: base}; } catch { /* next */ }
  }
  return null;
}

export function loadPlaywright({quiet = false} = {}) {
  for (const name of ['playwright', 'playwright-core', '@playwright/test']) {
    const hit = requireFrom(name);
    if (hit?.mod?.chromium) return hit.mod.chromium;
  }
  if (quiet) return null;
  fail(`Playwright is not installed. Install it once, then rerun:
  npm i -D playwright-core        (drives your installed Chrome)   or
  npm i -D playwright && npx playwright install chromium`);
}

export function chromeCandidates() {
  const found = [];
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers', path.join(os.homedir(), '.cache/ms-playwright'), path.join(os.homedir(), 'Library/Caches/ms-playwright'), process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'ms-playwright')].filter(Boolean);
  const inner = ['chrome-linux/chrome', 'chrome-linux64/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium', 'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', 'chrome-win/chrome.exe', 'chrome-win64/chrome.exe', 'chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell'];
  for (const root of roots) {
    let dirs = [];
    try { dirs = fs.readdirSync(root).filter(d => d.startsWith('chromium')).sort().reverse(); } catch { continue; }
    for (const d of dirs) for (const i of inner) { const p = path.join(root, d, i); if (fs.existsSync(p)) found.push(p); }
  }
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe']) if (fs.existsSync(p)) found.push(p);
  return [...new Set(found)];
}

/** Launch headless Chromium with SwiftShader WebGL: identical pixels on every machine, no GPU needed. */
/** Name of the WebGL2 renderer a browser gives pages ('' when WebGL2 is unavailable). */
async function webglName(b) {
  const page = await b.newPage();
  try {
    return await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2'); if (!gl) return '';
      const x = gl.getExtension('WEBGL_debug_renderer_info');
      return String(x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    });
  } finally { await page.close(); }
}

/**
 * Headless Chromium with WebGL2. By default SwiftShader (software: identical everywhere, fine for most renders).
 * gpu: try the machine's GPU first — much faster for path tracing and large renders — and fall back to SwiftShader.
 */
export async function launch(chromium, {browser: explicit, quiet = false, gpu = false} = {}) {
  if (gpu) {
    const tries = [explicit ? {executablePath: explicit} : {}, {channel: 'chrome'}];
    for (const t of tries) {
      try {
        const b = await chromium.launch({headless: true, args: ['--ignore-gpu-blocklist', '--enable-webgl', '--enable-gpu'], ...t});
        const name = await webglName(b);
        if (name && !/swiftshader|llvmpipe|software/i.test(name)) { b.w3dExecutable = t.executablePath ?? t.channel ?? 'playwright default'; b.w3dGPU = name; return b; }
        await b.close();
      } catch { /* no such browser or no GPU: next */ }
    }
    if (!quiet) console.log('  no GPU available to the browser: rendering in software (SwiftShader)');
  }
  const args = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist', '--enable-webgl'];
  const tries = [];
  if (explicit) tries.push({executablePath: explicit});
  tries.push({});
  for (const exe of chromeCandidates()) tries.push({executablePath: exe});
  tries.push({channel: 'chrome'});
  const errors = [];
  for (const t of tries) {
    try { const b = await chromium.launch({headless: true, args, ...t}); b.w3dExecutable = t.executablePath ?? t.channel ?? 'playwright default'; b.w3dGPU = 'SwiftShader'; return b; }
    catch (e) { errors.push(`${t.executablePath ?? t.channel ?? 'playwright default'}: ${String(e.message).split('\n')[0]}`); }
  }
  if (quiet) return null;
  fail('could not start Chromium:\n  ' + errors.join('\n  ') + '\nInstall one with: npx playwright install chromium   (or pass --browser <path to chrome>)');
}

/**
 * three.js and the add-ons the kit uses, pinned and cached once per machine (~35 MB):
 * three-mesh-bvh (fast raycasts: baked AO, CSG), three-bvh-csg (booleans), three-gpu-pathtracer (path-traced stills).
 * Returns {three, bvh, csg, pathtracer} package directories. Override three with --three <dir>.
 */
export const DEPS = {'three': THREE_VERSION, 'three-mesh-bvh': '0.8.3', 'three-bvh-csg': '0.0.17', 'three-gpu-pathtracer': '0.0.23'};
export function resolveDeps(explicitThree, {install = true} = {}) {
  const key = Object.entries(DEPS).map(([k, v]) => `${k}@${v}`).join(',');
  const cache = path.join(process.env.W3D_CACHE || path.join(os.homedir(), '.cache', '3d-asset-studio'), 'deps-' + crypto.createHash('sha1').update(key).digest('hex').slice(0, 12));
  const nm = path.join(cache, 'node_modules');
  const have = () => Object.keys(DEPS).every(p => fs.existsSync(path.join(nm, p, 'package.json')));
  if (!have()) {
    if (!install) return null;
    console.log(`one-time setup: installing ${Object.entries(DEPS).map(([k, v]) => `${k}@${v}`).join(' ')} into ${cache}`);
    fs.mkdirSync(cache, {recursive: true});
    if (!fs.existsSync(path.join(cache, 'package.json'))) fs.writeFileSync(path.join(cache, 'package.json'), '{"private": true}\n');
    const r = spawnSync('npm', ['install', ...Object.entries(DEPS).map(([k, v]) => `${k}@${v}`), '--no-audit', '--no-fund', '--loglevel=error'], {cwd: cache, stdio: 'inherit', shell: process.platform === 'win32'});
    if (r.status !== 0 || !have()) fail(`could not install the three.js packages into ${cache}. Check network access to the npm registry, or install them yourself there: npm i ${Object.entries(DEPS).map(([k, v]) => `${k}@${v}`).join(' ')}`);
  }
  const dir = p => path.join(nm, p);
  return {three: explicitThree ? path.resolve(explicitThree) : dir('three'), bvh: dir('three-mesh-bvh'), csg: dir('three-bvh-csg'), pathtracer: dir('three-gpu-pathtracer')};
}

/** Import map for pages that run scene modules: three, its add-ons, and this skill's library as w3d/. */
export function importMap(deps) {
  const three = deps.three;
  return {imports: {
    'three': toUrl(path.join(three, 'build/three.module.js')),
    'three/addons/': toUrl(path.join(three, 'examples/jsm')) + '/',
    'three/examples/jsm/': toUrl(path.join(three, 'examples/jsm')) + '/',
    'three/examples/jsm/postprocessing/Pass': toUrl(path.join(three, 'examples/jsm/postprocessing/Pass.js')),
    'three-mesh-bvh': toUrl(path.join(deps.bvh, 'src/index.js')),
    'three-bvh-csg': toUrl(path.join(deps.csg, 'src/index.js')),
    'three-gpu-pathtracer': toUrl(path.join(deps.pathtracer, 'src/index.js')),
    'w3d/': toUrl(path.join(SKILL, 'scripts/lib')) + '/',
  }};
}

/** Back-compat: just the three.js directory. */
export function resolveThree(explicit, opts) { const d = resolveDeps(explicit, opts); return d && d.three; }

const TYPES = {'.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.hdr': 'application/octet-stream', '.exr': 'application/octet-stream', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.html': 'text/html', '.css': 'text/css', '.txt': 'text/plain', '.wasm': 'application/wasm', '.bin': 'application/octet-stream', '.ktx2': 'image/ktx2', '.usdz': 'model/vnd.usdz+zip', '.stl': 'model/stl', '.obj': 'text/plain', '.mtl': 'text/plain'};

/** URL under which the page can load a local file. */
export const toUrl = file => ORIGIN + '/fs' + encodeURI(path.resolve(file).split(path.sep).join('/').replace(/^([A-Za-z]):/, '/$1:'));
const fromUrl = pathname => { let p = decodeURIComponent(pathname.slice(3)); if (/^\/[A-Za-z]:/.test(p)) p = p.slice(1); return path.normalize(p); };

/** Serve /fs/<absolute path> from disk and a few in-memory pages ({'/stage.html': html}). */
export async function serve(context, pages = {}) {
  await context.route(ORIGIN + '/**', async route => {
    const url = new URL(route.request().url());
    if (pages[url.pathname] != null) return route.fulfill({status: 200, contentType: 'text/html', body: pages[url.pathname]});
    // /fs/<absolute path>; bare absolute paths (an import written as '/Users/…/x.js') work too
    const file = url.pathname.startsWith('/fs/') ? fromUrl(url.pathname) : path.normalize(decodeURIComponent(url.pathname));
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return route.fulfill({status: 404, body: 'not found: ' + file});
    return route.fulfill({status: 200, contentType: TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream', body: fs.readFileSync(file), headers: {'cache-control': 'no-store'}});
  });
}

export function parseArgs(argv, flags = []) {
  const a = {_: []};
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (!t.startsWith('--')) { a._.push(t); continue; }
    const k = t.slice(2);
    if (flags.includes(k)) a[k] = true;
    else if (k === 'set') (a.set ??= []).push(argv[++i]); // repeatable
    else a[k] = argv[++i];
  }
  return a;
}
