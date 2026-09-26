#!/usr/bin/env node
// Is this machine ready to render? Checks Node, Playwright, a Chromium with WebGL, and three.js,
// and says exactly what to install when something is missing. Renders one tiny frame to prove it.
import {SKILL, THREE_VERSION, ORIGIN, DEPS, loadPlaywright, launch, resolveThree, toUrl, serve} from './browser.mjs';
import {findFFmpeg} from './anim.mjs';
import path from 'node:path';

const ok = (m) => console.log('  ok   ' + m), bad = (m) => console.log('  FIX  ' + m), note = (m) => console.log('  --   ' + m);
let ready = true;
console.log('3d-asset-studio environment check');

const major = +process.versions.node.split('.')[0];
if (major >= 18) ok(`node ${process.versions.node}`); else { bad(`node ${process.versions.node}: needs 18 or newer`); ready = false; }

const chromium = loadPlaywright({quiet: true});
if (chromium) ok('playwright found'); else { bad('playwright missing: npm i -D playwright-core   (or: npm i -D playwright && npx playwright install chromium)'); ready = false; }

const pkgs = Object.entries(DEPS).map(([k, v]) => `${k}@${v}`).join(', ');
let three = resolveThree(undefined, {install: false});
if (three) ok(`three.js packages cached (${pkgs})`);
else { console.log(`  ..   three.js packages not cached yet; installing now (one time): ${pkgs}`); three = resolveThree(); ok(`three.js packages at ${path.dirname(three)}`); }

if (chromium) {
  const browser = await launch(chromium, {quiet: true});
  if (!browser) { bad('no Chromium could start: npx playwright install chromium   (or pass --browser <path to chrome> to render.mjs)'); ready = false; }
  else {
    ok(`chromium: ${browser.w3dExecutable}`);
    const html = `<!doctype html><script type="importmap">{"imports":{"three":"${toUrl(path.join(three, 'build/three.module.js'))}"}}</script>
<script type="module">
import * as THREE from 'three';
try {
  const r = new THREE.WebGLRenderer({alpha: true, preserveDrawingBuffer: true}); r.setSize(64, 64);
  const s = new THREE.Scene(), c = new THREE.PerspectiveCamera(40, 1, 0.1, 10); c.position.z = 3;
  s.add(new THREE.Mesh(new THREE.SphereGeometry(1), new THREE.MeshPhysicalMaterial({color: 0x88aa44, clearcoat: 1})), new THREE.DirectionalLight(0xffffff, 2));
  r.render(s, c);
  const px = new Uint8Array(4); const gl = r.getContext(); gl.readPixels(32, 32, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  window.result = {ok: px[3] > 0, renderer: gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER)};
} catch (e) { window.result = {ok: false, error: String(e)}; }
</script>`;
    try {
      const context = await browser.newContext();
      await serve(context, {'/check.html': html});
      const page = await context.newPage();
      await page.goto(ORIGIN + '/check.html');
      await page.waitForFunction(() => window.result, null, {timeout: 60000});
      const res = await page.evaluate(() => window.result);
      if (res.ok) ok(`WebGL renders (${res.renderer})`); else { bad(`WebGL failed: ${res.error ?? 'blank frame'}`); ready = false; }
    } catch (e) { bad('WebGL test failed: ' + e.message); ready = false; }
    await browser.close();
    // optional extras: a GPU (for --gpu and --pathtrace) and ffmpeg (for --video webm/mp4)
    const gpu = await launch(chromium, {gpu: true, quiet: true});
    if (gpu && gpu.w3dGPU !== 'SwiftShader') ok(`GPU available: ${gpu.w3dGPU} (--gpu, --pathtrace)`);
    else note('no GPU for the browser: software rendering (fine for everything except --pathtrace)');
    await gpu?.close();
  }
}
const ff = findFFmpeg();
if (ff?.full) ok('ffmpeg: WebM with alpha and MP4 (--video webm,mp4)');
else if (ff) note("ffmpeg: Playwright's (WebM without alpha); install ffmpeg for alpha WebM and MP4");
else note('no ffmpeg: animated WebP only (install ffmpeg for WebM/MP4)');
console.log(ready ? `\nready. Try: node ${path.relative(process.cwd(), path.join(SKILL, 'scripts/render.mjs'))} ${path.relative(process.cwd(), path.join(SKILL, 'assets/examples/weight-plates.scene.js'))} --draft` : '\nnot ready: fix the lines marked FIX and run this again.');
process.exit(ready ? 0 : 1);
