#!/usr/bin/env node
// Convert a model between formats through three.js: FBX/OBJ/STL/DAE/3MF → GLB for the web, GLB → USDZ for iOS AR
// Quick Look, anything → STL for 3D printing. Sizes are real-world (glTF/USDZ/OBJ in metres, STL in millimetres).
// For shrinking a GLB for the web (mesh compression, WebP/KTX2 textures) use gltf-transform — see references/importing.md.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {SKILL, fail, parseArgs} from './browser.mjs';

const HELP = `usage: node convert.mjs <model> --to glb,usdz,stl,obj [options]

  --out <dir>        output folder (default: next to the model)
  --name <name>      output file name (default: the model's)
  --height <len>     scale so it is this tall (78cm, 1.2m, …)      --size <len>  … or this long on its longest side
  --by <pattern>     measure that on the parts whose names match (e.g. 'pot|leaf')
  --units <u>        mm | cm | m | in: what the input's numbers mean (default: glTF m, STL/3MF mm, FBX cm)
  --up z             the input is Z-up (default for STL/3MF)
  --smooth <deg>     recompute smooth normals with this crease angle`;

const args = parseArgs(process.argv.slice(2), ['help']);
if (args.help || !args._[0] || !args.to) { console.log(HELP); process.exit(args.help ? 0 : 1); }
const model = path.resolve(args._[0]);
if (!fs.existsSync(model)) fail(`model not found: ${model}`);
const base = args.name ?? path.basename(model).replace(/\.[^.]+$/, '');
const out = path.resolve(args.out ?? path.dirname(model));
const opts = {};
for (const k of ['height', 'size', 'units', 'up', 'by']) if (args[k]) opts[k] = args[k];
if (args.smooth) opts.smooth = +args.smooth;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'w3d-convert-'));
const scene = path.join(dir, `${base}.scene.js`);
fs.writeFileSync(scene, `import {loadModel, describe} from 'w3d/models.js';
export const settings = {name: ${JSON.stringify(base)}, mode: 'none'};
export default async function build(ctx) {
  const m = await loadModel(${JSON.stringify(model)}, ${JSON.stringify(opts)});
  ctx.log(describe(m));
  if (m.userData.w3dModel.note) ctx.warn(m.userData.w3dModel.note);
  return [{name: ${JSON.stringify(base)}, object: m}];
}
`);
const tmpOut = path.join(dir, 'out');
const r = spawnSync(process.execPath, [path.join(SKILL, 'scripts/render.mjs'), scene, '--out', tmpOut, '--export', String(args.to)], {stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8'});
process.stdout.write((r.stdout ?? '').split('\n').filter(l => !/models only|^rendering |^\s*$/.test(l) && !l.includes(tmpOut)).join('\n') + '\n');
if (r.status === 0) {
  fs.mkdirSync(out, {recursive: true});
  for (const f of fs.readdirSync(tmpOut).filter(f => /\.(glb|usdz|stl|obj)$/.test(f))) {
    fs.copyFileSync(path.join(tmpOut, f), path.join(out, f));
    console.log(`wrote ${path.join(out, f)}`);
  }
}
fs.rmSync(dir, {recursive: true, force: true});
process.exit(r.status ?? 1);
