#!/usr/bin/env node
// check-skills: keeps the skill library in step (our take on ECC's skill-stocktake).
//   node tools/check-skills.mjs
// Every .claude/skills/<id>/SKILL.md must have: valid frontmatter (name = folder, a "Use when/for/as/at"
// trigger in the description), a line in CLAUDE.md, an entry in skills-library/skills-data.js and a demo
// in skills-library/demos/<id>.js. Skills not yet used in the showcase are listed as a to-do, not a failure.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const skillsDir = path.join(ROOT, '.claude/skills');
const ids = fs.readdirSync(skillsDir).filter(d => fs.existsSync(path.join(skillsDir, d, 'SKILL.md'))).sort();
const claude = read('CLAUDE.md');
const data = read('skills-library/skills-data.js');
const dataIds = [...data.matchAll(/"id":\s*"([^"]+)"/g)].map(m => m[1]);
const showcase = fs.readdirSync(path.join(ROOT, 'showcase')).filter(f => f.endsWith('.html')).map(f => read('showcase/' + f)).join('\n') + read('showcase/site.js');
const used = new Set([...showcase.matchAll(/data-skills="([^"]+)"/g)].flatMap(m => m[1].split(',').map(s => s.trim())));
for (const m of read('showcase/site.js').matchAll(/'([a-z0-9-]+)':\s*'[^']+'/g)) used.add(m[1]); // SHELL map

const problems = [], todo = [];
for (const id of ids) {
  const md = read(`.claude/skills/${id}/SKILL.md`);
  const fm = md.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) { problems.push(`${id}: SKILL.md has no frontmatter`); continue; }
  const name = (fm[1].match(/^name:\s*(.+)$/m) || [])[1]?.trim();
  const desc = (fm[1].match(/^description:\s*(.+)$/m) || [])[1]?.trim() || '';
  if (name !== id) problems.push(`${id}: frontmatter name is "${name}"`);
  if (!desc) problems.push(`${id}: no description`);
  else {
    if (!/\b(use|start)\b[^.]*\b(when|for|as|at|with|whenever|after|before|here)\b/i.test(desc)) problems.push(`${id}: description never says when to use it`);
    if (desc.length > 1024) problems.push(`${id}: description is ${desc.length} chars (keep ≤ 1024)`);
  }
  if (!claude.includes('`' + id + '`')) problems.push(`${id}: not listed in CLAUDE.md`);
  if (!dataIds.includes(id)) problems.push(`${id}: no entry in skills-library/skills-data.js`);
  if (!fs.existsSync(path.join(ROOT, 'skills-library/demos', id + '.js'))) problems.push(`${id}: no demo at skills-library/demos/${id}.js`);
  if (!used.has(id)) todo.push(id);
}
for (const id of dataIds) if (!ids.includes(id)) problems.push(`skills-data.js lists "${id}" but .claude/skills/${id}/ does not exist`);
for (const id of used) if (!ids.includes(id) && !['a', 'b', 'c'].includes(id)) problems.push(`showcase uses "${id}" but no such skill exists`);

console.log(`\nSKILL LIBRARY  ${ids.length} skills, ${dataIds.length} in the Motion Library, ${ids.length - todo.length} used in the showcase\n`);
problems.forEach(p => console.log('FAIL  ' + p));
if (todo.length) console.log(`TODO  not used in the showcase yet: ${todo.join(', ')}`);
console.log(problems.length ? `\n${problems.length} problem(s)\n` : '\nAll skills are listed, have a demo and a library entry.\n');
process.exit(problems.length ? 1 : 0);
