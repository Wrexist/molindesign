// Animation containers from rendered frames: animated WebP (pure JS, keeps transparency, plays in an <img>
// everywhere) and WebM/MP4 through ffmpeg when one is available (Playwright ships a VP8-only ffmpeg).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync, execSync} from 'node:child_process';

function chunks(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') throw new Error('not a WebP file');
  const out = [];
  for (let o = 12; o + 8 <= buf.length;) {
    const id = buf.toString('ascii', o, o + 4), size = buf.readUInt32LE(o + 4);
    out.push({id, data: buf.subarray(o + 8, o + 8 + size)});
    o += 8 + size + (size & 1);
  }
  return out;
}
const chunk = (id, data) => { const pad = data.length & 1; const b = Buffer.alloc(8 + data.length + pad); b.write(id, 0, 'ascii'); b.writeUInt32LE(data.length, 4); data.copy(b, 8); return b; };
const u24 = (b, o, v) => { b[o] = v & 255; b[o + 1] = (v >> 8) & 255; b[o + 2] = (v >> 16) & 255; };

/** Mux still WebP frames (same size) into one animated WebP. durations: ms per frame (number or array). */
export function animatedWebP(frameFiles, {width, height, duration = 42, loop = 0} = {}) {
  const frames = frameFiles.map(f => chunks(fs.readFileSync(f)));
  let alpha = false;
  const anmf = frames.map((cs, i) => {
    const data = cs.filter(c => c.id === 'ALPH' || c.id === 'VP8 ' || c.id === 'VP8L');
    if (data.some(c => c.id === 'ALPH' || c.id === 'VP8L')) alpha = true;
    const head = Buffer.alloc(16);
    u24(head, 0, 0); u24(head, 3, 0); u24(head, 6, width - 1); u24(head, 9, height - 1);
    u24(head, 12, Math.round(Array.isArray(duration) ? duration[i] : duration));
    head[15] = 0b10; // no blending (each frame replaces the canvas, alpha included), no disposal
    return chunk('ANMF', Buffer.concat([head, ...data.map(c => chunk(c.id, c.data))]));
  });
  const vp8x = Buffer.alloc(10);
  vp8x[0] = 0x02 | (alpha ? 0x10 : 0); u24(vp8x, 4, width - 1); u24(vp8x, 7, height - 1);
  const anim = Buffer.alloc(6); anim.writeUInt32LE(0, 0); anim.writeUInt16LE(loop, 4);
  const body = Buffer.concat([Buffer.from('WEBP'), chunk('VP8X', vp8x), chunk('ANIM', anim), ...anmf]);
  const riff = Buffer.alloc(8); riff.write('RIFF', 0, 'ascii'); riff.writeUInt32LE(body.length, 4);
  return Buffer.concat([riff, body]);
}

/** An ffmpeg to encode with: the system one (full codecs) or Playwright's bundled VP8-only build. */
export function findFFmpeg() {
  for (const cmd of ['ffmpeg']) { try { execSync(`${cmd} -version`, {stdio: 'ignore'}); return {bin: cmd, full: true}; } catch { /* next */ } }
  const roots = [process.env.PLAYWRIGHT_BROWSERS_PATH, '/opt/pw-browsers', path.join(os.homedir(), '.cache/ms-playwright'), path.join(os.homedir(), 'Library/Caches/ms-playwright'), process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'ms-playwright')].filter(Boolean);
  for (const r of roots) {
    let dirs = []; try { dirs = fs.readdirSync(r).filter(d => d.startsWith('ffmpeg')); } catch { continue; }
    for (const d of dirs) for (const f of ['ffmpeg-linux', 'ffmpeg-mac', 'ffmpeg-win64.exe']) { const p = path.join(r, d, f); if (fs.existsSync(p)) return {bin: p, full: false}; }
  }
  return null;
}

/**
 * WebM and MP4 from the frames in `dir` (000.png with alpha, 000.jpg flattened on the background).
 * A system ffmpeg gives VP9 WebM with alpha and H.264 MP4; Playwright's bundled ffmpeg (MJPEG in, VP8 out)
 * gives a WebM without alpha, on the background colour.
 */
export function encodeVideo(dir, out, {fps = 24, format = 'webm', width, height, background = '#ffffff', pad = 3, ff = findFFmpeg()} = {}) {
  if (!ff) return {ok: false, reason: 'no ffmpeg found (install ffmpeg; Playwright also ships one for WebM)'};
  const png = path.join(dir, `%0${pad}d.png`);
  // Colour: frames are sRGB. Encode with the BT.601 matrix into limited ("tv") range and say so in the stream, or
  // browsers guess and the video plays lighter and more saturated than the frames (full-range JPEG read as limited).
  const tags = ['-colorspace', 'smpte170m', '-color_primaries', 'bt709', '-color_trc', 'iec61966-2-1', '-color_range', 'tv'];
  let args, input = null;
  if (format === 'webm' && ff.full) {
    args = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', png, '-vf', 'scale=out_color_matrix=bt601:out_range=tv,format=yuva420p', ...tags, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '28', '-row-mt', '1', '-auto-alt-ref', '0', out];
  } else if (format === 'webm') {
    const jpgs = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();
    if (!jpgs.length) return {ok: false, reason: 'no JPEG frames to encode'};
    input = Buffer.concat(jpgs.map(f => fs.readFileSync(path.join(dir, f))));
    // JPEG frames are full range (yuvj420p): convert to limited range explicitly (Playwright's ffmpeg has scale)
    args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', 'pipe:0', '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p', ...tags,
      '-c:v', 'libvpx', '-b:v', '1500k', '-crf', '8', '-qmin', '0', '-qmax', '26', '-auto-alt-ref', '0', '-g', String(Math.max(1, jpgs.length)), out];
  } else if (format === 'mp4') {
    if (!ff.full) return {ok: false, reason: 'MP4 needs a full ffmpeg with libx264 (brew install ffmpeg / apt install ffmpeg); the WebM and animated WebP were written'};
    args = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', png, '-f', 'lavfi', '-i', `color=c=${background.replace('#', '0x')}:s=${width}x${height}:r=${fps}`,
      '-filter_complex', '[1:v][0:v]overlay=shortest=1,scale=out_color_matrix=bt601:out_range=tv,format=yuv420p', ...tags, '-c:v', 'libx264', '-crf', '18', '-preset', 'slow', '-movflags', '+faststart', out];
  } else return {ok: false, reason: 'unknown video format ' + format};
  const r = spawnSync(ff.bin, args, {encoding: 'utf8', input: input ?? undefined, maxBuffer: 1 << 30});
  if (r.status !== 0) return {ok: false, reason: (r.stderr || '').split('\n').filter(Boolean).slice(-3).join(' ')};
  return {ok: true, bytes: fs.statSync(out).size, alpha: format === 'webm' && ff.full, encoder: ff.full ? 'system ffmpeg' : 'Playwright ffmpeg (VP8, no alpha)'};
}
