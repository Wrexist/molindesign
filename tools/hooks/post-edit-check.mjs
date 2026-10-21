#!/usr/bin/env node
// PostToolUse hook (Edit|Write|MultiEdit): fast, deterministic checks on the file that was just written,
// so they don't depend on anyone remembering them (ECC: "hooks enforce checks outside the prompt").
// Exit 2 sends stderr back to Claude as feedback; exit 0 stays silent. Never blocks anything else.
import fs from 'node:fs';
import path from 'node:path';

let input = '';
process.stdin.on('data', c => (input += c));
process.stdin.on('end', () => {
  let file;
  try { file = JSON.parse(input).tool_input?.file_path; } catch { process.exit(0); }
  if (!file || !/\.(html|css|js|mjs)$/.test(file) || !fs.existsSync(file)) process.exit(0);
  const rel = path.relative(process.cwd(), file);
  if (rel.startsWith('..') || /(^|\/)(node_modules|_maya-source|maya-haglund|\.claude|tools|film\/tools)\//.test(rel)) process.exit(0);
  const s = fs.readFileSync(file, 'utf8');
  const out = [];
  const line = i => s.slice(0, i).split('\n').length;
  const ext = path.extname(file);
  const re = ext === '.html' ? /\b(?:src|href|poster|action)\s*=\s*["']\/(?!\/)[^"']*/g
    : ext === '.css' ? /url\(\s*["']?\/(?!\/)[^)"']*/g
    : /["'`]\/(?!\/)[\w./-]+\.(?:png|jpe?g|webp|avif|gif|svg|css|js|json|mp4|webm|mp3|woff2?|glb)["'`]/g;
  for (const m of s.matchAll(re)) out.push(`${rel}:${line(m.index)} root-absolute path ${m[0].slice(0, 60)}: breaks under /molindesign/ on GitHub Pages, make it relative`);
  const key = s.match(/(?:sk-(?:ant-)?[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/);
  if (key) out.push(`${rel}:${line(key.index)} looks like a credential: remove it, never commit keys`);
  if (ext === '.html') {
    for (const m of s.matchAll(/<script[^>]+src=["']((?:https?:)?\/\/[^"']+)/gi))
      if (!/@\d|\/\d+\.\d+/.test(m[1])) out.push(`${rel}:${line(m.index)} CDN script without a pinned version: ${m[1].slice(0, 70)}`);
  }
  if (out.length) { console.error(out.slice(0, 8).join('\n')); process.exit(2); }
  process.exit(0);
});
