// Every sound effect's whole body vs the spoken words (vo/vo.js): lists any hit that overlaps a word.
//   node film/qrcode/qr/sfxcheck.mjs
import fs from 'node:fs'; import vm from 'node:vm'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const win = { document: { createElement: () => ({ getContext: () => ({}) }) } }; win.window = win;
vm.createContext(win);
for (const f of ['vo/vo.js', 'qr.js', 'film.js']) vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), win);
const BODY = { stamp: .2, stampS: .16, slap: .16, clack: .2, thump: .16, rip: .22, scratch: .24, paper: .17, peel: .3, swish: .28, pop: .12, tick: .03, key: .04, rise: 0 };
const words = win.VO.lines.flatMap(l => l.words.map(w => ({ ...w, id: l.id })));
let bad = 0;
for (const e of win.EV) {
  const a = e.t;
  const b = e.t1 != null ? e.t1 + .03 : e.t + (BODY[e.type] ?? .15);
  const hit = words.filter(w => a < w.t1 && b > w.t0);
  if (hit.length) { bad++; console.log(`OVERLAP ${e.type.padEnd(8)} ${a.toFixed(2)}–${b.toFixed(2)}  on ${hit.map(w => `"${w.w}" ${w.t0.toFixed(2)}–${w.t1.toFixed(2)}`).join(', ')}`); }
}
console.log(`${win.EV.length} hits checked against ${words.length} words: ${bad ? bad + ' overlap' : 'none on a word'}`);
console.log(`first hit ${win.EV[0].type} at ${win.EV[0].t.toFixed(2)} s, first word at ${words[0].t0.toFixed(2)} s`);
process.exit(bad ? 1 : 0);
