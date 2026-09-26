#!/usr/bin/env node
// Look at a 3D model before using it: what it is (triangles, materials, textures, animations, real size, compression)
// and a sheet of four views in the studio (front, three-quarter, side, back). Run with --help for options.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {SKILL, fail, parseArgs} from './browser.mjs';

const HELP = `usage: node inspect.mjs <model.glb|gltf|obj|fbx|stl|ply|3mf|dae|usdz|vox> [options]

  --out <dir>        where the sheet and info.json go (default: <model>.inspect/ next to the model)
  --height <len>     treat the model as this tall (78cm, 1.2m, …) instead of the file's units
  --size <len>       … or this long on its longest side
  --by <pattern>     measure --height/--size on the parts whose names match (e.g. 'pot|leaf')
  --units <u>        mm | cm | m | in: what the file's numbers mean (default: glTF m, STL/3MF mm, FBX cm)
  --up z             the file is Z-up (default for STL/3MF)
  --look <l>         render the views as clay, lineart, … instead of the model's own materials
  --smooth <deg>     recompute smooth normals with this crease angle (faceted scans)`;

const args = parseArgs(process.argv.slice(2), ['help']);
if (args.help || !args._[0]) { console.log(HELP); process.exit(args.help ? 0 : 1); }
const model = path.resolve(args._[0]);
if (!fs.existsSync(model)) fail(`model not found: ${model}`);
const base = path.basename(model).replace(/\.[^.]+$/, '');
const out = path.resolve(args.out ?? path.join(path.dirname(model), `${base}.inspect`));
const opts = {};
for (const k of ['height', 'size', 'units', 'up', 'by']) if (args[k]) opts[k] = args[k];
if (args.smooth) opts.smooth = +args.smooth;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'w3d-inspect-'));
const scene = path.join(dir, `${base}.scene.js`);
fs.writeFileSync(scene, `import {loadModel, copyModel, describe} from 'w3d/models.js';
export const settings = {name: ${JSON.stringify(base)}, mode: 'icons', icons: {size: [420, 420], margin: 0.08, uniform: true}, studio: 'soft', camera: {elevation: 20}, contact: {opacity: 0.5}};
export default async function build(ctx) {
  const m = await loadModel(${JSON.stringify(model)}, ${JSON.stringify(opts)});
  ctx.meta.model = m.userData.w3dModel;
  ctx.log(describe(m));
  if (m.userData.w3dModel.note) ctx.warn(m.userData.w3dModel.note);
  return [['front', 0], ['three-quarter', -40], ['side', -90], ['back', 180]].map(([name, yaw]) => {
    const c = copyModel(m); c.rotation.y += yaw * Math.PI / 180; return {name, object: c};
  });
}
`);
const r = spawnSync(process.execPath, [path.join(SKILL, 'scripts/render.mjs'), scene, '--out', out, '--previews', out, ...(args.look ? ['--look', args.look] : [])], {stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8'});
fs.rmSync(dir, {recursive: true, force: true});
const log = r.stdout ?? '';
if (r.status !== 0) { process.stdout.write(log); process.exit(r.status ?? 1); }
const meta = JSON.parse(fs.readFileSync(path.join(out, 'meta.json'), 'utf8'));
const s = meta.scene?.model ?? {};
fs.writeFileSync(path.join(out, 'info.json'), JSON.stringify(s, null, 1) + '\n');
const kb = (fs.statSync(model).size / 1024).toFixed(0);
const lines = [
  `${path.basename(model)} · ${kb} kB · ${s.format}`,
  `  size        ${s.sizeCm?.join(' × ')} cm (w × h × d)${s.note ? `  — ${s.note}` : ''}`,
  `  geometry    ${s.meshes} meshes, ${s.triangles?.toLocaleString('en')} triangles, ${s.vertices?.toLocaleString('en')} vertices${s.skinned ? ', skinned' : ''}${s.morphs ? ', morph targets' : ''}`,
  `  materials   ${s.materials} (${(s.materialTypes ?? []).join(', ')})`,
  `  textures    ${s.textures}${s.maxTexture ? `, largest ${s.maxTexture}px` : ''}`,
  `  animations  ${s.animations?.length ? s.animations.map(a => `${a.name || '(unnamed)'} ${a.seconds}s`).join(', ') : 'none'}`,
];
if (s.extensions?.length) lines.push(`  extensions  ${s.extensions.join(', ')}`);
if (s.parts?.length > 1) {
  const rows = [...s.parts].sort((a, b) => b.sizeCm[1] - a.sizeCm[1]).slice(0, 16);
  const w = Math.max(...rows.map(p => (p.name + (p.count > 1 ? ` ×${p.count}` : '')).length));
  lines.push('  parts       w × h × d cm (measure one with loadModel {by} or measure(model, by))');
  for (const p of rows) lines.push(`    ${(p.name + (p.count > 1 ? ` ×${p.count}` : '')).padEnd(w)}  ${p.sizeCm.join(' × ')}  ${p.triangles.toLocaleString('en')} tris`);
  if (s.parts.length > rows.length) lines.push(`    … ${s.parts.length - rows.length} more in info.json`);
}
// advice for the web
const tips = [];
if (s.triangles > 300000) tips.push(`heavy for the web (${Math.round(s.triangles / 1000)}k triangles): simplify, or ship a rendered image instead of the model`);
if (s.maxTexture > 2048) tips.push(`textures up to ${s.maxTexture}px: resize to 1024–2048 and compress (gltf-transform optimize … --texture-compress webp)`);
if (+kb > 5000 && !(s.extensions ?? []).some(e => /meshopt|draco/i.test(e))) tips.push('large and uncompressed: gltf-transform optimize in.glb out.glb --compress meshopt');
if (s.geometryOnly) tips.push('geometry only (no materials): give it one with loadModel(url, {material: M.…})');
if (tips.length) lines.push('  for the web', ...tips.map(t => '    - ' + t));
lines.push(`  views       ${path.join(out, 'sheet.png')}`);
console.log(lines.join('\n'));
const warns = log.split('\n').filter(l => /^\s*- /.test(l) || /warning:/.test(l));
if (warns.length) console.log(warns.join('\n'));
