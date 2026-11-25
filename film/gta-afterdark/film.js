/* "GTA 6. Last to second.": Delta, Extended Look deep dive (slug gta-afterdark), r2. Sources in BRIEF.md.
   Rockstar's An Extended Look ("Captured entirely from in-game footage on the PlayStation 5"): in the race shot at
   20:21 the HUD reads 6 / 6 at 00:04.79 and 2 / 6 at 00:08.26, PROGRESS 5% -> 10%. The shot sits in a run of night
   scenes, 20:14-20:34. Footage (muted, each use under 5 s): race 1221.45-1225.58 (hook sped up ×3.3, labelled, count, seam,
   and a dimmed plate under the source card), tower, pool, dance, balcony 1229.05-1231.3; plates selfie
   1215.85-1217.7, pool 1220.1-1221.35, dance 1225.65-1226.75. Nothing from 1235 s on.
   Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Engine from gta-fridge. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var INK = '#0b0a1c', CREAM = '#f7f1e6', PINK = '#f67bb2', HOT = '#ff3d8b', CYAN = '#5fe3f0', SUN = '#ffb347', BOX = '#0e0d14', BOX2 = '#2b2a33';
  var DISP = 'Archivo', MONO = '"Geist Mono"';
  var BX0 = 90, BX1 = 930, BY1 = 1430, TAU = Math.PI * 2;

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function kn(t, a, amt) { if (t < a) return 1; var u = t - a; return 1 + (amt || .08) * (1 - Math.exp(-u * 40)) * Math.exp(-u * 7); }
  function osc(t, k, ph) { return Math.sin(TAU * k * t / DUR + (ph || 0)); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w).indexOf(norm(word)) === 0 && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function start(id) { return LINE[id].t0; }
  function lastw(id) { var w = LINE[id].words; return w[w.length - 1].t1; }

  /* ---------- the SFX gate: hits sit in pauses (vo/vad.js) ---------- */
  var EDGES = [], VOICED = [];
  if (window.VAD) window.VAD.forEach(function (v) { VOICED.push({ t0: v[0], t1: v[1] }); EDGES.push(v[0], v[1]); });
  else VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  function free(m) {
    var B = [], M = [], F = [], p = 0;
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { slap: .1, tock: .06, pop: .1, sweep: .25, beep: .08, ctick: .05, thump: .15 };
  function nearGap(t, type, m) {
    var bd = BODY[type] || .12, best = null;
    free(m || .1).forEach(function (f) { var lo = f[0], hi = f[1] - bd; if (hi < lo) return; var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c; });
    return best;
  }
  var GT = {}, EV = [];
  /* a hit snapped into the nearest pause within tol; `under: true` keeps it on the word (soft, under the voice) */
  /* tol < 0 forces the hit onto t (a low hit under the word); m narrows the margin around voice edges */
  function G(id, t, type, tol, gain, m) {
    if (tol != null && tol < 0) { GT[id] = t; EV.push({ t: t, type: type, g: gain == null ? 1 : gain, id: id }); return t; }
    var n = nearGap(t, type, m);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .3 : tol)) { GT[id] = n; EV.push({ t: n, type: type, g: gain == null ? 1 : gain, id: id }); }
    else GT[id] = t;
    return t;
  }

  /* ---------- canvas + safe-area check ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true }, LIVE2 = { bg: true, clip: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  var BOUNDS = null, NOREC = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || NOREC || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys), d = Math.min.apply(null, ys);
    if (d > BY1 || b < SAFE.x0 || a > SAFE.x1) return;
    if (a < SAFE.x0 - .5 || b > SAFE.x1 + .5 || c > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
  }
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS) { var mm = this.measureText(str); recBox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent, str); }
      return orig.apply(this, arguments);
    };
  }

  /* ---------- type ---------- */
  function cond(g, st) { g.__st = st || 'extra-condensed'; try { g.fontStretch = g.__st; } catch (e) {} }
  function unst(g) { g.__st = null; try { g.fontStretch = 'normal'; } catch (e) {} }
  function font(g, px, wt, fam) { g.font = (wt || 900) + ' ' + px + 'px ' + (fam || DISP); if (g.__st) try { g.fontStretch = g.__st; } catch (e) {} }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function T2(g, s, x, y, px, o) {
    o = o || {}; px = Math.max(36, px);
    g.save(); cond(g, o.st || 'condensed'); font(g, px, o.wt || 900); ls(g, o.ls == null ? 1 : o.ls);
    if (o.max) while (g.measureText(s).width > o.max && px > 36) { px -= 2; font(g, px, o.wt || 900); }
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.fillStyle = o.col || CREAM;
    if (o.a != null) g.globalAlpha *= clamp(o.a, 0, 1);
    g.fillText(s, x, y + px * .04); var w = g.measureText(s).width; g.restore(); unst(g); return w;
  }
  function M2(g, s, x, y, px, o) {
    o = o || {}; g.save(); font(g, Math.max(30, px), o.wt || 700, MONO); ls(g, o.ls == null ? 2 : o.ls);
    g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.fillStyle = o.col || CREAM; g.fillText(s, x, y); var w = g.measureText(s).width; g.restore(); return w;
  }
  function tw(s, px, st, wt) { var m = mk(4, 4).getContext('2d'); cond(m, st || 'condensed'); font(m, px, wt || 900); ls(m, 1); var w = m.measureText(s).width; unst(m); return w; }
  function chip(g, s, x, y, px, bg, fg, o) {
    o = o || {}; var w = tw(s, px) + px * .8, h = px * 1.3;
    g.save(); if (o.rot) { g.translate(x, y); g.rotate(o.rot); g.translate(-x, -y); }
    rr(g, x - w / 2 + 5, y - h / 2 + 7, w, h, 10); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, x - w / 2, y - h / 2, w, h, 10); g.fillStyle = bg; g.fill();
    T2(g, s, x, y, px, { col: fg }); g.restore(); return w;
  }
  function disc(g, x, y, r, c) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = c; g.fill(); }


  /* =====================================================================================================
     THE SET: Vice City at night. The race HUD's own look is our UI language: dark checkered boxes with a pink
     edge bar (#f67bb2, sampled from the HUD at 1225.4 s), white condensed numbers. The footage is the hero and
     bleeds full frame; the HUD itself is zoomed ×5.4 (Rockstar's pixels) so its numbers read big.
     Native move: the LEADERBOARD SWAP, our six-slot board where the player's row climbs one slot on each HUD
     place change and the passed car swings out of the stack. Scene changes: a checkered band sweeping across.
     ===================================================================================================== */
  var T = {}, U = {}, BG, NOISE, WIPES = [], FL = [], HF = [];
  var CARD_HUD = { x: 100, y: 470, w: 500, h: 400 }, LB = { x: 630, y: 470, w: 290, rh: 82, gap: 8 }, ZH = 5.4;
  var CARD_C = { x: 100, y: 455, w: 820, h: 461 }, CARD_CL = { x: 100, y: 965, w: 820, h: 455 };
  var HUD_POS = [.955, .88], HUD_ALL = [.92, .885], PROMPT = [.956, .918];
  /* the night run in the Extended Look, read frame by frame (BRIEF F5): label, in, out (s) */
  var SEGS = [['TOWER', 1214.0, 1215.75], ['SELFIE', 1215.8, 1217.75], ['POOL', 1217.8, 1221.4], ['RACE', 1221.44, 1225.6], ['DANCE', 1225.6, 1228.95], ['BALCONY', 1229.0, 1231.35], ['SKYLINE', 1231.4, 1232.75], ['TOWER', 1232.8, 1234.75]];

  function buildBG() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(29);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#171135'); gr.addColorStop(.5, '#0d0b22'); gr.addColorStop(1, '#07060f'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    var a = g.createRadialGradient(860, 300, 10, 860, 300, 760); a.addColorStop(0, 'rgba(246,123,178,.20)'); a.addColorStop(1, 'rgba(246,123,178,0)'); g.fillStyle = a; g.fillRect(0, 0, W, H);
    var b = g.createRadialGradient(160, 1500, 10, 160, 1500, 820); b.addColorStop(0, 'rgba(95,227,240,.13)'); b.addColorStop(1, 'rgba(95,227,240,0)'); g.fillStyle = b; g.fillRect(0, 0, W, H);
    for (var y = 0; y < H; y += 120) for (var x = (y / 120) % 2 ? 120 : 0; x < W; x += 240) { g.fillStyle = 'rgba(255,255,255,.018)'; g.fillRect(x, y, 120, 120); }
    for (var k = 0; k < 5000; k++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.07)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    var vg = g.createRadialGradient(510, 900, 300, 510, 900, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }

  /* ---------- the HUD box: dark checker, pink edge bar (our redraw of Rockstar's position box) ---------- */
  function hudBox(g, x, y, w, h, o) {
    o = o || {}; var cs = o.cell || h / 2;
    g.save(); rr(g, x + 8, y + 12, w, h, 6); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, x, y, w, h, 6); g.clip(); g.fillStyle = BOX; g.fillRect(x, y, w, h);
    for (var j = 0; j * cs < h; j++) for (var i = 0; i * cs < w; i++) if ((i + j) % 2) { g.fillStyle = BOX2; g.globalAlpha = .55; g.fillRect(x + i * cs, y + j * cs, cs, cs); g.globalAlpha = 1; }
    g.restore();
    if (o.barW !== 0) { g.fillStyle = o.bar || PINK; g.fillRect(x + w - (o.barW || 12), y, o.barW || 12, h); }
  }
  function posBox(g, cx, cy, h, n, tot, kflip) {
    var w = h * 2.1, x = cx - w / 2, y = cy - h / 2;
    hudBox(g, x, y, w, h, { cell: h / 2.2, barW: Math.max(8, h * .07) });
    var s = 1 + .25 * (1 - eo(kflip == null ? 1 : kflip));
    g.save(); g.translate(cx - h * .1, cy); g.scale(s, s);
    T2(g, String(n), -h * .5, 0, h * .7, { col: '#fff' }); T2(g, '/', 0, 0, h * .62, { col: '#cfcfd6' }); T2(g, String(tot), h * .5, 0, h * .7, { col: '#d9d9de' });
    g.restore();
  }

  /* ---------- the footage card: a framed picture, the pink edge bar ---------- */
  function card(g, box, t, u, o) {
    o = o || {};
    var X = box.x, Y = box.y, w = box.w, h = box.h;
    g.save();
    rr(g, X + 10, Y + 16, w, h, 16); g.fillStyle = 'rgba(0,0,0,.55)'; g.fill();
    rr(g, X - 6, Y - 6, w + 12, h + 12, 18); g.fillStyle = '#1a1726'; g.fill();
    g.save(); rr(g, X, Y, w, h, 12); g.clip(); g.fillStyle = '#050309'; g.fillRect(X, Y, w, h);
    var tt = Math.min(t, u.t1 - 1e-3), uu = u;
    if (o.zoom) uu = Object.assign({}, u, { zoom: o.zoom, focus: o.focus || u.focus });
    g.filter = 'brightness(' + (o.bright || 1.12) + ') contrast(1.05) saturate(1.08)'; CLIP.draw(g, tt, X, Y, w, h, uu); g.filter = 'none';
    if (o.after) o.after(g, X, Y, w, h, tt, uu);
    if (!o.nocredit) CLIP.credit(g, u, X + 22, Y + h - 22, '700 36px "Geist Mono", monospace');
    g.restore();
    g.fillStyle = PINK; g.fillRect(X + w - 2, Y + 14, 8, h - 28);
    g.restore();
  }
  function ring(g, x, y, r, k, col, lw) {
    if (k <= 0) return; g.save(); g.strokeStyle = col || PINK; g.lineWidth = lw || 9; g.lineCap = 'round';
    g.beginPath(); g.arc(x, y, r * (1 + .25 * (1 - eo(k))), -Math.PI / 2, -Math.PI / 2 + TAU * eo(k)); g.stroke(); g.restore();
  }
  function boxRing(g, x, y, w, h, k, col) {
    if (k <= 0) return; var e = eo(k), P = 2 * (w + h);
    g.save(); g.strokeStyle = col || PINK; g.lineWidth = 8; g.lineCap = 'round'; g.setLineDash([P * e, P]); rr(g, x - w / 2, y - h / 2, w, h, 16); g.stroke(); g.restore();
  }
  function sticker(g, s, x, y, px, k, lx, ly, o) {
    if (k <= 0) return; o = o || {}; var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.globalAlpha *= clamp(k * 3, 0, 1);
    if (lx != null) { g.strokeStyle = o.bg || CREAM; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(lerp(x, lx, eo(k)), lerp(y, ly, eo(k))); g.stroke(); disc(g, lx, ly, 9 * eo(k), o.bg || CREAM); }
    g.translate(x, y); var s2 = lerp(1.3, 1, eo(k)) * (o.knock ? kn(o.t, o.knock, .1) : 1); g.scale(s2, s2); chip(g, s, 0, 0, px, o.bg || CREAM, o.fg || INK, { rot: o.rot == null ? -.03 : o.rot }); g.restore(); NOREC = nr;
  }
  /* a plain timecode chip: white, no checker (never read as a race position) */
  function tcChip(g, s, x, y, k) {
    if (k <= 0) return; var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.globalAlpha *= clamp(k * 3, 0, 1); g.translate(x, y); var sc = lerp(1.2, 1, eo(k)); g.scale(sc, sc);
    var w = M2w(s, 44) + 40; rr(g, -w / 2 + 5, -32, w, 64, 10); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, -w / 2, -37, w, 64, 10); g.fillStyle = '#fff'; g.fill();
    M2(g, s, 0, -4, 44, { align: 'center', col: INK, ls: 2 }); g.restore(); NOREC = nr;
  }
  function M2w(s, px) { var m = mk(4, 4).getContext('2d'); font(m, px, 700, MONO); ls(m, 2); return m.measureText(s).width; }

  /* ---------- the checkered sweep (scene change): old scene held under the band, new one live behind it ---------- */
  var HW = .16;
  function wipeAt(t) { for (var i = 0; i < WIPES.length; i++) if (t > WIPES[i] - HW && t < WIPES[i] + HW) return WIPES[i]; return null; }
  function band(g, ex) {
    var bw = 150;
    g.save(); g.beginPath(); g.rect(ex - bw, 0, bw, H); g.clip();
    var cs = 50; for (var j = 0; j * cs < H; j++) for (var i = 0; i * cs < bw + cs; i++) { g.fillStyle = (i + j) % 2 ? '#f4f1ea' : '#111018'; g.fillRect(ex - bw + i * cs, j * cs, cs, cs); }
    g.restore();
    g.fillStyle = PINK; g.fillRect(ex, 0, 14, H);
    var sh = g.createLinearGradient(ex - bw - 60, 0, ex - bw, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = sh; g.fillRect(ex - bw - 60, 0, 60, H);
  }

  /* =====================================================================================================
     BEATS
     ===================================================================================================== */
  /* the hook title: GTA 6 chip, LAST -> ? (the ? flips to 2ND on "second") */
  function hookTitle(g, t, two) {
    chip(g, 'GTA 6', 230, 205, 60, HOT, '#fff', { rot: -.04 });
    var y = 365, wl = tw('LAST', 168), w2 = tw('2ND', 168), gap = 150, tot = wl + gap + w2, x0 = CX - tot / 2;
    g.save(); g.translate(CX, y); g.rotate(-.015); rr(g, -tot / 2 - 34, -96, tot + 68, 192, 12); g.fillStyle = 'rgba(8,7,18,.78)'; g.fill(); g.restore();
    T2(g, 'LAST', x0 + wl / 2, y, 168, { col: CREAM });
    g.save(); g.fillStyle = PINK; var ax = x0 + wl + 22, aw = gap - 44; g.fillRect(ax, y - 11, aw - 34, 22); g.beginPath(); g.moveTo(ax + aw, y); g.lineTo(ax + aw - 46, y - 40); g.lineTo(ax + aw - 46, y + 40); g.closePath(); g.fill(); g.restore();
    var cx2 = x0 + wl + gap + w2 / 2;
    if (!two) T2(g, '?', cx2, y, 168, { col: CREAM });
    else { var k = seg(t, T.hookB - .02, T.hookB + .12), nr = NOREC; NOREC = nr || k < .999; g.save(); g.translate(cx2, y); var s = lerp(1.5, 1, eo(k)) * kn(t, T.hookB + .12, .08); g.scale(s, s); T2(g, '2ND', 0, 0, 168, { col: PINK }); g.restore(); NOREC = nr; }
  }
  /* the real HUD, zoomed ×5.4 from the race shot; `mask` hides PROGRESS and the timer (frame 0 reads in 5 words) */
  function hudCard(g, t, u, o) {
    o = o || {};
    card(g, CARD_HUD, t, u, { zoom: [ZH, ZH], focus: HUD_ALL, nocredit: true, bright: 1.25, after: function (gg, x, y, w, h, tt, uu) {
      var q = CLIP.toScreen(uu, tt, HUD_POS[0], HUD_POS[1], x, y, w, h), m = o.mask || 0;
      if (m > 0) { gg.save(); gg.globalAlpha *= m; gg.fillStyle = BOX; gg.fillRect(x, y, w, q[1] - 48 - y); gg.fillRect(x, q[1] + 46, w, y + h - q[1] - 46); gg.restore(); }
      boxRing(gg, q[0] - 4, q[1], 280, 116, o.kr == null ? 1 : o.kr, PINK);
    } });
    var kt = o.tag == null ? 1 : o.tag;
    if (kt > 0) { var nr = NOREC; NOREC = nr || kt < .999; g.save(); g.globalAlpha *= clamp(kt, 0, 1); chip(g, 'HUD · ZOOM ×' + ZH + (o.ff ? ' · ' + o.ff : ''), CARD_HUD.x + 20 + tw('HUD · ZOOM ×' + ZH + (o.ff ? ' · ' + o.ff : ''), 36) / 2 + 14, CARD_HUD.y + CARD_HUD.h + 4, 36, PINK, INK, { rot: -.02 }); g.restore(); NOREC = nr; }
  }
  /* the leaderboard: six fixed place cells, the cars' rows move; ours climbs one slot per flip, the passed car swings out */
  var ORDERS = (function () { var o = [['a', 'b', 'c', 'd', 'e', 'u']]; for (var i = 0; i < 4; i++) { var p = o[i].slice(), j = p.indexOf('u'); p[j] = p[j - 1]; p[j - 1] = 'u'; o.push(p); } return o; })();
  function carGlyph(g, x, y, col) { g.save(); g.fillStyle = col; rr(g, x - 46, y - 12, 92, 26, 10); g.fill(); rr(g, x - 26, y - 26, 50, 18, 8); g.fill(); disc(g, x - 26, y + 15, 9, col); disc(g, x + 26, y + 15, 9, col); g.restore(); }
  function board(g, t, fl, kin) {
    if (kin <= 0) return; var nr = NOREC; NOREC = nr || kin < .999;
    var n = 0; fl.forEach(function (f) { if (t >= f) n++; });
    var k = n ? eo(seg(t, fl[n - 1], fl[n - 1] + .24)) : 1, A = ORDERS[Math.max(0, n - 1)], B = ORDERS[n], step = LB.rh + LB.gap;
    g.save(); g.globalAlpha *= clamp(kin * 2, 0, 1); g.translate(lerp(420, 0, eo(kin)), 0);
    for (var i = 0; i < 6; i++) { var y = LB.y + i * step; hudBox(g, LB.x, y, 84, LB.rh, { cell: 20.5, barW: 0 }); T2(g, String(i + 1), LB.x + 42, y + LB.rh / 2, 52, { col: '#fff' }); }
    var bx = LB.x + 92, bw = LB.w - 92;
    ['a', 'b', 'c', 'd', 'e', 'u'].forEach(function (id) {
      var sA = A.indexOf(id), sB = B.indexOf(id), s = lerp(sA, sB, k), y = LB.y + s * step, dx = sB > sA ? 80 * Math.sin(Math.PI * k) : 0, me = id === 'u';
      g.save(); g.translate(dx, 0);
      rr(g, bx + 6, y + 8, bw, LB.rh, 8); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
      rr(g, bx, y, bw, LB.rh, 8); g.fillStyle = me ? HOT : 'rgba(20,18,32,.9)'; g.fill();
      if (me) { T2(g, 'YOU', bx + 58, y + LB.rh / 2, 44, { col: '#fff' }); carGlyph(g, bx + 140, y + LB.rh / 2 + 2, '#fff'); }
      else carGlyph(g, bx + bw / 2, y + LB.rh / 2 + 2, 'rgba(255,255,255,.35)');
      g.restore();
    });
    g.restore(); NOREC = nr;
  }
  /* the hero stamp: 3.47 S over 4 PLACES */
  function stamp(g, t, x, y, t0) {
    var k = seg(t, t0 - .02, t0 + .14); if (k <= 0) return; var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.translate(x, y); var s = lerp(1.7, 1, eo(k)) * kn(t, t0 + .14, .06); g.scale(s, s); g.globalAlpha *= clamp(k * 3, 0, 1);
    chip(g, '3.47 S', 0, 0, 120, HOT, '#fff', { rot: -.05 }); chip(g, '4 PLACES', 0, 118, 56, CREAM, INK, { rot: -.03 });
    g.restore(); NOREC = nr;
  }
  function hookBeat(g, t) {
    var u = useAt(t), on = seg(t, .6, .8);
    hudCard(g, t, u, { mask: 1 - on, tag: seg(t, .45, .6), ff: '×' + T.spd.toFixed(1) + ' SPEED' });
    board(g, t, HF, seg(t, .35, .6));
    stamp(g, t, 330, 1010, T.hookB);
    hookTitle(g, t, t >= T.hookB);
  }
  function seamBeat(g, t) {
    hudCard(g, 0, U.seam, { mask: 1, tag: 0 });
    hookTitle(g, 0, false);
  }

  /* ---------- timer: our redraw of the two HUD readings, and the difference ---------- */
  function timerBeat(g, t) {
    var X = 100, Y = 470, w = 820;
    hudBox(g, X, Y, w, 950, { cell: 95, barW: 14 });
    var k1 = eo(seg(t, T.timerIn - .05, T.timerIn + .25)), k2 = eo(seg(t, T.row2W - .05, T.row2W + .2));
    function row(y, lab, n, time, k, lit) {
      g.save(); g.globalAlpha *= lerp(.35, 1, k);
      T2(g, lab, X + 120, y, 64, { col: lit ? PINK : '#cfcfd6' });
      posBox(g, X + 360, y, 110, n, 6, k);
      T2(g, time, X + 640, y, 96, { col: '#fff', st: 'condensed', wt: 800 });
      g.restore();
    }
    row(Y + 130, 'START', 6, '00:04.79', k1, false);
    row(Y + 320, '2ND', 2, '00:08.26', k2, true);
    g.save(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(X + 40, Y + 440); g.lineTo(X + w - 60, Y + 440); g.stroke(); g.restore();
    g.save(); g.translate(CX, Y + 610); var s = kn(t, T.bigW, .08); g.scale(s, s); T2(g, '3.47 S', 0, 0, 230, { col: HOT }); g.restore();
    chip(g, '4 PLACES', CX, Y + 770, 60, CREAM, INK, { rot: -.02 });
    M2(g, 'HUD TIMER · 20:21 → 20:25', CX, Y + 885, 36, { align: 'center', col: '#cfcfd6', ls: 1 });
  }

  /* ---------- race: the real shot behind (plate), Rockstar's own words on the source card ---------- */
  function raceBeat(g, t) {
    sticker(g, 'SUNSET', 690, 520, 72, seg(t, T.sunW, T.sunW + .2), 800, 660, { bg: SUN, fg: INK, rot: .04 });
    var X = 100, Y = 860, w = 820, h = 560;
    hudBox(g, X, Y, w, h, { cell: 70, barW: 14 });
    T2(g, 'AN EXTENDED LOOK', CX - 6, Y + 72, 84, { col: '#fff', max: 760 });
    M2(g, 'ROCKSTAR GAMES', CX - 6, Y + 146, 36, { align: 'center', col: PINK, ls: 4 });
    var kc = seg(t, T.capW - .05, T.capW + .2);
    g.save(); rr(g, X + 40, Y + 190, w - 94, 170, 10); g.fillStyle = lerp(0, 1, kc) > .5 ? 'rgba(246,123,178,.22)' : 'rgba(255,255,255,.06)'; g.fill(); g.restore();
    T2(g, '“…CAPTURED ENTIRELY', CX - 6, Y + 238, 62, { col: CREAM, wt: 800, max: 740 });
    T2(g, 'FROM IN-GAME FOOTAGE…”', CX - 6, Y + 312, 62, { col: CREAM, wt: 800, max: 740 });
    var sy0 = Y + 400, x0 = X + 40, x1 = X + w - 60, kp = eio(seg(t, T.elW - .3, T.elW + .5)), mx = lerp(x0, lerp(x0, x1, 1221.45 / 1608), kp);
    g.save(); g.fillStyle = 'rgba(255,255,255,.25)'; rr(g, x0, sy0 + 20, x1 - x0, 14, 7); g.fill();
    var w0 = lerp(x0, x1, 1214 / 1608), w1 = lerp(x0, x1, 1234.75 / 1608); g.fillStyle = PINK; rr(g, w0, sy0 + 14, Math.max(10, w1 - w0), 26, 6); g.fill();
    g.fillStyle = '#fff'; rr(g, x0, sy0 + 20, mx - x0, 14, 7); g.fill(); disc(g, mx, sy0 + 27, 22, '#fff'); g.restore();
    M2(g, '0:00', x0, sy0 + 92, 36, { col: '#cfcfd6', ls: 1 }); M2(g, '26:48', x1, sy0 + 92, 36, { col: '#cfcfd6', ls: 1, align: 'right' });
    if (kp > .2) M2(g, '20:21', mx, sy0 + 92, 36, { col: PINK, ls: 1, align: 'center' });
  }

  /* ---------- the count: the HUD's position, place by place, and our board swapping on each beep ---------- */
  function countBeat(g, t) {
    hudCard(g, t, useAt(t), { kr: seg(t, T.countIn, T.countIn + .4), tag: 1 });
    board(g, t, FL, 1);
  }

  /* ---------- progress: 5% -> 10% ---------- */
  function progBeat(g, t) {
    var X = 100, Y = 520, w = 820;
    hudBox(g, X, Y, w, 300, { cell: 75, barW: 14 });
    T2(g, 'PROGRESS', X + 215, Y + 150, 96, { col: '#fff', max: 360 });
    var kt = seg(t, T.tenW - .04, T.tenW + .14), pct = t >= T.tenW ? 10 : 5;
    g.save(); g.translate(X + 610, Y + 150); var s = lerp(1.5, 1, eo(kt)) * kn(t, T.tenW + .14, .07); g.scale(s, s); T2(g, pct + '%', 0, 0, 160, { col: t >= T.tenW ? HOT : '#fff' }); g.restore();
    var tx0 = X + 30, tx1 = X + w - 50, ty = Y + 470, f = lerp(.05, .10, eio(seg(t, T.tenW - .1, T.tenW + .35)));
    g.save(); rr(g, tx0, ty - 40, tx1 - tx0, 80, 12); g.fillStyle = 'rgba(14,13,20,.85)'; g.fill();
    g.setLineDash([24, 18]); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 4; g.beginPath(); g.moveTo(tx0 + 20, ty); g.lineTo(tx1 - 70, ty); g.stroke(); g.setLineDash([]);
    rr(g, tx0, ty - 40, (tx1 - tx0) * f, 80, 12); g.fillStyle = HOT; g.fill();
    for (var j = 0; j < 4; j++) for (var i = 0; i < 2; i++) { g.fillStyle = (i + j) % 2 ? '#111' : '#fff'; g.fillRect(tx1 - 60 + i * 30, ty - 40 + j * 20, 30, 20); }
    g.restore();
    var cx = tx0 + (tx1 - tx0) * f; g.save(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx + 36, ty); g.lineTo(cx - 6, ty - 30); g.lineTo(cx - 6, ty + 30); g.closePath(); g.fill(); g.restore();
    M2(g, '0', tx0, ty + 80, 36, { col: '#cfcfd6' }); M2(g, '100%', tx1, ty + 80, 36, { col: '#cfcfd6', align: 'right' });
    M2(g, 'START 5%', tx0 + (tx1 - tx0) * .05 - 10, ty - 78, 36, { col: '#cfcfd6', ls: 1 });
    var kb = eo(seg(t, T.progIn + .1, T.progIn + .4));
    g.save(); g.globalAlpha *= kb; T2(g, 'POSITION', X + 250, 1275, 76, { col: '#cfcfd6' }); posBox(g, X + 600, 1275, 150, 2, 6, kb); g.restore();
  }

  /* ---------- the night run: 20:14 -> 20:34 in the Extended Look, to scale; the race lit ---------- */
  var SX0 = 110, SX1 = 910, STOT = SEGS[SEGS.length - 1][2] - SEGS[0][1];
  function segX(i) { return [lerp(SX0, SX1, (SEGS[i][1] - SEGS[0][1]) / STOT), lerp(SX0, SX1, (SEGS[i][2] - SEGS[0][1]) / STOT)]; }
  function stripBig(g, y, h, lit, hi, scan) {
    for (var i = 0; i < SEGS.length; i++) {
      var p = segX(i), on = scan == null ? 1 : clamp((scan - i * .09) / .12, 0, 1); if (on <= 0) continue;
      g.save(); g.globalAlpha *= on; var yy = y + 20 * (1 - eo(on));
      rr(g, p[0] + 2, yy, Math.max(4, p[1] - p[0] - 6), h, 8); g.fillStyle = i === 3 ? HOT : (i === hi ? '#fff' : (i % 2 ? '#8a86a8' : '#cfcbe6')); g.fill();
      if (i === lit) { g.strokeStyle = '#fff'; g.lineWidth = 6; rr(g, p[0] - 4, yy - 6, p[1] - p[0] + 6, h + 12, 10); g.stroke(); }
      g.restore();
    }
    M2(g, '20:14', SX0, y + h + 46, 36, { col: '#cfcfd6', ls: 1 }); M2(g, '20:34', SX1, y + h + 46, 36, { col: '#cfcfd6', ls: 1, align: 'right' });
  }
  function runBeat(g, t) {
    var sc = (t - T.runIn) / .12 + 0;
    stripBig(g, 820, 130, -1, -1, sc);
    var p = segX(3), kr = seg(t, T.runIn + .45, T.runIn + .7);
    sticker(g, 'RACE', (p[0] + p[1]) / 2, 700, 60, kr, (p[0] + p[1]) / 2, 812, { bg: HOT, fg: '#fff', rot: -.03 });
  }
  /* ---------- the tour: full-frame hard cuts, a plain timecode chip, the strip with the shot lit ---------- */
  var TOURSEG = { tower: [0, '20:14'], pool: [2, '20:18'], dance: [4, '20:27'] };
  function tourBeat(g, t) {
    var u = useAt(t); if (!u) return; var s = TOURSEG[u.clip];
    tcChip(g, s[1], 200, 470, seg(t, u.t0, u.t0 + .12));
    g.save(); rr(g, 96, 1312, 828, 116, 12); g.fillStyle = 'rgba(8,7,18,.72)'; g.fill(); g.restore();
    stripBig(g, 1326, 34, s[0], -1, null);
  }
  function bridgeBeat(g, t) {
    stripBig(g, 820, 130, 5, -1, null);
    var p = segX(5); tcChip(g, '20:29', clamp((p[0] + p[1]) / 2, 200, 820), 720, seg(t, T.tourOut, T.tourOut + .12));
  }

  /* ---------- the balcony: DRINK / DROP ---------- */
  function drinkBeat(g, t) {
    var u = U.balc;
    card(g, CARD_C, t, u, { after: function (gg, x, y, w, h, tt, uu) {
      var q = CLIP.toScreen(uu, tt, PROMPT[0], PROMPT[1], x, y, w, h); ring(gg, q[0] - 4, q[1], 52, seg(t, T.promptW - .1, T.promptW + .25), PINK, 6);
      var gq = CLIP.toScreen(uu, tt, .17, .56, x, y, w, h); ring(gg, gq[0], gq[1], 70, seg(t, T.balcW - .05, T.balcW + .3), CYAN, 7);
    } });
    card(g, CARD_CL, t, u, { zoom: [5.2, 5.4], focus: PROMPT, nocredit: true, bright: 1.25, after: function (gg, x, y, w, h, tt, uu) {
      var q = CLIP.toScreen(uu, tt, PROMPT[0] - .02, PROMPT[1] - .025, x, y, w, h);
      var k = seg(t, T.drinkW - .08, T.drinkW + .2); if (k > 0) { gg.save(); gg.globalAlpha *= clamp(k * 3, 0, 1); gg.strokeStyle = PINK; gg.lineWidth = 8; rr(gg, q[0] - 250 - 20 * (1 - k), q[1] - 70, 500 + 40 * (1 - k), 140, 20); gg.stroke(); gg.restore(); }
    } });
    chip(g, 'PROMPT · ZOOM ×5', 260, CARD_CL.y + 46, 36, PINK, INK, { rot: -.02 });
    tcChip(g, '20:29', 790, CARD_C.y + 62, seg(t, u.t0, u.t0 + .12));
  }

  /* ---------- the vote: pool party, dance floor or the race (all three equal) ---------- */
  function flagIcon(g) { for (var j = 0; j < 4; j++) for (var i = 0; i < 5; i++) { g.fillStyle = (i + j) % 2 ? '#111' : '#fff'; g.fillRect(-60 + i * 24, -48 + j * 24, 24, 24); } g.fillStyle = '#ddd'; g.fillRect(-68, -52, 8, 110); }
  function waveIcon(g) { g.strokeStyle = CYAN; g.lineWidth = 11; g.lineCap = 'round'; for (var j = 0; j < 3; j++) { g.beginPath(); for (var x = -60; x <= 60; x += 4) { var y = -30 + j * 30 + 9 * Math.sin(x / 12); if (x === -60) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); } }
  function ballIcon(g, t) { disc(g, 0, 0, 52, '#cfd2e6'); g.save(); g.beginPath(); g.arc(0, 0, 52, 0, TAU); g.clip(); for (var j = -3; j < 3; j++) for (var i = -3; i < 3; i++) { if ((i + j + Math.floor(t * 6)) % 3 === 0) { g.fillStyle = '#fff'; g.fillRect(i * 18 + 2, j * 18 + 2, 14, 14); } else { g.fillStyle = 'rgba(80,70,140,.5)'; g.fillRect(i * 18 + 2, j * 18 + 2, 14, 14); } } g.restore(); g.fillStyle = '#ddd'; g.fillRect(-3, -80, 6, 30); }
  function endBeat(g, t) {
    var kq = eo(seg(t, T.endIn, T.endIn + .3));
    g.save(); g.globalAlpha *= kq; g.translate(0, -80 * (1 - kq));
    T2(g, 'FIRST NIGHT OUT?', CX, 340, 120, { col: '#fff', max: 800 });
    g.restore();
    var B = [['POOL PARTY', T.poolE, waveIcon], ['DANCE FLOOR', T.danceE, ballIcon], ['RACE', T.raceE, flagIcon]];
    B.forEach(function (b, i) {
      var k = eo(seg(t, b[1] - .05, b[1] + .2)); if (k <= 0) return;
      var y = 520 + i * 255, nr = NOREC; NOREC = nr || k < .999;
      g.save(); g.globalAlpha *= clamp(k * 2, 0, 1); g.translate(lerp(-700, 0, k), 0);
      var p = kn(t, b[1] + .2, .05);
      g.translate(CX, y + 100); g.scale(p, p); g.translate(-CX, -y - 100);
      hudBox(g, 100, y, 820, 200, { cell: 50, barW: 14 });
      g.save(); g.translate(230, y + 100); b[2](g, t); g.restore();
      T2(g, b[0], 600, y + 100, 110, { col: '#fff', max: 560 });
      g.restore(); NOREC = nr;
    });
    T2(g, 'PICK ONE ↓', CX, 1345, 60, { col: '#cfcfd6', a: seg(t, T.endIn + .3, T.endIn + .5) });
  }

  function propsAt(g, t) {
    if (t < T.timerIn) hookBeat(g, t);
    else if (t < T.raceIn) timerBeat(g, t);
    else if (t < T.countIn) raceBeat(g, t);
    else if (t < T.progIn) countBeat(g, t);
    else if (t < T.runIn) progBeat(g, t);
    else if (t < T.tourIn) runBeat(g, t);
    else if (t < T.tourOut) tourBeat(g, t);
    else if (t < T.drinkIn) bridgeBeat(g, t);
    else if (t < T.endIn) drinkBeat(g, t);
    else if (t < T.seamIn) endBeat(g, t);
    else seamBeat(g, t);
  }
  /* the foreground use on screen at t (the bleed and the HUD card share it) */
  function useAt(t) { return CLIP.active(t); }

  /* ---------- the back layer: footage full frame (bleed), blurred same-clip behind cards, or a plate ---------- */
  var PLATEOPT = { race: { dim: .35, blur: 0 }, pselfie: { dim: .5, blur: 5 }, ppool: { dim: .55, blur: 16 }, pdance: { dim: .55, blur: 16 } };
  function fgBeat(t) { return t < T.timerIn || (t >= T.countIn && t < T.progIn) || (t >= T.tourIn && t < T.tourOut) || (t >= T.drinkIn && t < T.endIn) || t >= T.seamIn; }
  function backAt(g, t) {
    var p = CLIP.activePlate(t);
    if (p) { var k = seg(t, p.t0, p.t0 + .2) * (1 - seg(t, p.t1 - .2, p.t1)); g.save(); g.globalAlpha = k; CLIP.plate(g, t, 0, 0, W, H, PLATEOPT[p.clip] || { dim: .5, blur: 3 }); g.restore(); }
    var u = CLIP.active(t); if (!u || !fgBeat(t)) return;
    g.save();
    if (u.clip === 'balc') { g.filter = 'blur(30px) brightness(.38) saturate(1.2)'; CLIP.draw(g, t, -80, -80, W + 160, H + 160, u); }
    else { g.filter = 'brightness(1.05) contrast(1.05) saturate(1.1)'; CLIP.draw(g, t, 0, 0, W, H, u); }
    g.filter = 'none';
    var tg = g.createLinearGradient(0, 0, 0, 1050); tg.addColorStop(0, 'rgba(6,5,14,.62)'); tg.addColorStop(1, 'rgba(6,5,14,0)'); g.fillStyle = tg; g.fillRect(0, 0, W, 1050);
    g.restore();
    if (u.clip !== 'balc' && seg(t, .6, .8) > 0 && !(t >= T.seamIn)) { g.save(); g.globalAlpha *= t < T.timerIn ? seg(t, .6, .8) : 1; CLIP.credit(g, u, 110, (t >= T.tourIn && t < T.tourOut) ? 1280 : 1430, '700 36px "Geist Mono", monospace'); g.restore(); }
  }

  /* =====================================================================================================
     CAPTIONS: a HUD box near the top of the safe box, white condensed type, the stressed word in pink
     ===================================================================================================== */
  var NOCAP = { hook: 1, end: 1 }, WHOLE = {};
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (NOCAP[l.id]) return;
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) { cur.push(w); if (!WHOLE[l.id] && /[.?!]["”]?$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS = [], CAPY = 300;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function captions(g, t) {
    t = tq(t);
    var c0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { c0 = c; ci = i; } });
    if (!c0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s : T.endIn;
    var end = Math.min(c0.t1 + .55, ns, T.endIn - .2);
    var s0 = c0.s; for (var bj = 0; bj < WIPES.length; bj++) if (WIPES[bj] > c0.s - .02 && WIPES[bj] < c0.s + .5) s0 = WIPES[bj] + HW;
    if (t < s0) return;
    for (var bi = 0; bi < WIPES.length; bi++) if (WIPES[bi] > s0 + .2) { end = Math.min(end, WIPES[bi] - HW); break; }
    if (t >= end) return;
    var k = cd(t, s0, 16), ko = 1 - seg(t, end - .06, end);
    g.save(); g.globalAlpha *= ko; cond(g, 'condensed'); var cpx = 72; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = c0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws, gap, lines, lw, maxw = 760;
    function meas() { ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; }
    function lay() {
      lines = [[]]; var cw = 0;
      words.forEach(function (w, i) { var ww = ws[i] + gap; if (cw + ws[i] > maxw && lines[lines.length - 1].length) { lines.push([]); cw = 0; } lines[lines.length - 1].push(i); cw += ww; });
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    meas(); lay();
    while (lines.length > 2 && cpx > 52) { cpx -= 4; font(g, cpx, 900); meas(); lay(); }
    var lh = cpx * 1.22, y0 = CAPY - (lines.length - 1) * lh / 2 + cpx * .36;
    var bwm = Math.max.apply(null, lw) - gap + 56, top = y0 - cpx * .9, bh = (lines.length - 1) * lh + cpx * 1.2;
    g.save(); g.translate(0, (1 - k) * 22); rr(g, CX - bwm / 2 + 6, top + 9, bwm, bh, 8); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, CX - bwm / 2, top, bwm, bh, 8); g.fillStyle = 'rgba(14,13,20,.92)'; g.fill(); g.fillStyle = PINK; g.fillRect(CX + bwm / 2 - 10, top, 10, bh); g.restore();
    lines.forEach(function (ln, li) {
      var tw0 = lw[li] - gap, x = CX - tw0 / 2, y = y0 + li * lh + (1 - k) * 22;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .25;
        if (cur) { g.save(); g.fillStyle = HOT; g.fillRect(x - 6, y - cpx * .8, ws[i] + 12, cpx * 1.0); g.restore(); }
        var isG = /^GTA$/.test(up[i]); g.fillStyle = isG ? PINK : '#fff'; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
    });
    g.restore(); unst(g); ls(g, 0);
  }

  /* =====================================================================================================
     FRAME
     ===================================================================================================== */
  var POSTERMODE = false;
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1 + 20); else g.rect(-500, -500, 2080, BY1 + 520); g.clip(); }
  function scene(g, t) {
    g.drawImage(BG, 0, 0); backAt(g, t);
    var dw = seg(t, 0, .6) * (1 - seg(t, DUR - .6, DUR - .05));
    var ddx = 3 * osc(t, 13, .3) * dw, ddy = 3 * osc(t, 11, 2.1) * dw;
    var ps = 1 + .012 * Math.sin(TAU * t / 3.1) * dw;
    g.save(); railClip(g); g.translate(510 + ddx, 900 + ddy); g.scale(ps, ps); g.translate(-510, -900);
    propsAt(g, t); g.restore();
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = INK; g.fillRect(0, 0, W, H);
    var c = LIVE2.bg ? wipeAt(t) : null;
    if (c === null) scene(g, t);
    else {
      var ex = lerp(-20, W + 170, eio(seg(t, c - HW, c + HW)));
      g.save(); g.beginPath(); g.rect(ex, 0, W - ex + 10, H); g.clip(); scene(g, Math.min(t, c - 1e-3)); g.restore();
      g.save(); g.beginPath(); g.rect(0, 0, Math.max(0, ex), H); g.clip(); scene(g, Math.max(t, c)); g.restore();
      band(g, ex);
    }
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('gta6', 'GTA 6', 0, T.timerIn + .1); Tx('gta6', 'GTA 6', T.seamIn, DUR + 1);
    Tx('last', 'LAST', 0, T.timerIn + .1); Tx('last', 'LAST', T.seamIn, DUR + 1);
    Tx('2nd', '2ND', T.hookB, T.raceIn);
    Tx('347', '3.47 S', T.hookB, T.raceIn); Tx('places', '4 PLACES', T.hookB, T.raceIn);
    Tx('zoom', 'HUD ZOOM 5.4', .5, T.timerIn); Tx('zoom', 'HUD ZOOM 5.4', T.countIn, T.progIn);
    Tx('start', 'START', T.timerIn, T.raceIn); Tx('t1', '00:04.79', T.timerIn, T.raceIn); Tx('t2', '00:08.26', T.timerIn, T.raceIn);
    Tx('sunset', 'SUNSET', T.sunW + .05, T.countIn);
    Tx('el', 'AN EXTENDED LOOK', T.raceIn, T.countIn);
    Tx('quote', 'CAPTURED ENTIRELY FROM IN-GAME FOOTAGE', T.raceIn, T.countIn + .1);
    Tx('prog', 'PROGRESS', T.progIn, T.runIn);
    Tx('10', '10%', T.tenW, T.runIn);
    Tx('pos', 'POSITION 2/6', T.progIn + .2, T.runIn);
    Tx('strip', '20:14 20:34', T.runIn, T.drinkIn);
    Tx('raceseg', 'RACE', T.runIn + .5, T.tourIn);
    Tx('tc', '20:14', T.tourIn, T.endIn);
    Tx('q', 'FIRST NIGHT OUT?', T.endIn + .1, T.seamIn);
    Tx('poolb', 'POOL PARTY', T.poolE + .1, T.seamIn); Tx('danceb', 'DANCE FLOOR', T.danceE + .1, T.seamIn); Tx('raceb', 'RACE', T.raceE, T.seamIn + .1);
    return o;
  }

  /* ---------- times, clips and sound events, all from the voice ---------- */
  function initTimes() {
    T.hookB = at('hook', '2nd') - .03;
    T.timerIn = 2.3; T.row2W = at('timer', '3.5') + .1; T.bigW = at('timer', '3.5') - .08;
    T.raceIn = 4.4; T.sunW = at('race', 'sunset'); T.elW = at('race', 'extended'); T.capW = at('race', 'captured');
    T.countIn = 8.45;
    T.progIn = 12.88; T.tenW = at('prog', 'says');
    T.runIn = 15.55; T.nightW = at('run', 'night');
    T.tourIn = 17.9; T.poolC = at('tour', 'a', 1) - .04; T.danceC = at('tour', 'a', 2) - .04; T.tourOut = lastw('tour') + .2;
    T.drinkIn = T.tourOut + .45; T.balcW = at('drink', 'balcony'); T.promptW = at('drink', 'prompt'); T.drinkW = at('drink', 'drink');
    T.endIn = 24.25; T.poolE = at('end', 'pool'); T.danceE = at('end', 'dance'); T.raceE = at('end', 'race');
    T.seamIn = T.raceE + 1.85;
    WIPES = [T.timerIn, T.raceIn, T.countIn, T.progIn, T.runIn, T.endIn, T.seamIn];
    CLIP.reset();
    /* hook: the race shot from its first frame (6/6, 00:04.79) to 2/6 (00:08.26), played about ×3.3 so all four place changes fit */
    var spd = T.spd = 4.01 / (T.hookB - .3), F = { foc: [.5, .62] };
    HF = [.3 + .52 / spd, .3 + 1.64 / spd, .3 + 2.24 / spd, T.hookB];
    U.hold = CLIP.use('race', 0, .3, { from: 0, speed: .001, zoom: [1, 1], focus: F.foc, note: 'hook: frame 0 holds the race at 6/6 (HUD zoomed and ringed), GTA 6 LAST -> ?' });
    U.hookA = CLIP.use('race', .3, T.hookB, { from: 0, speed: spd, zoom: [1, 1.03], focus: F.foc, note: 'hook: the race sped up (labelled on the HUD tag), HUD 6/6 -> 3/6, our board swaps on each place' });
    U.hookB = CLIP.use('race', T.hookB, T.timerIn + HW, { from: 4.01, speed: .1, zoom: [1.03, 1.04], focus: F.foc, note: 'hook payoff: HUD 2/6 (00:08.26), 2ND, stamp 3.47 S / 4 PLACES' });
    /* the count: a beep in each pause, the place flips on the beep, each use from the first frame that shows it (BRIEF F3) */
    var cl = ['c6', 'c5', 'c4', 'c3', 'c2'];
    for (var i = 0; i < 4; i++) { G('b' + i, (lastw(cl[i]) + start(cl[i + 1])) / 2, 'beep', .4, [1, 2.8, 2.8, 1][i], .03);   /* short pauses sit in the duck: those beeps get more gain (measured on the mix) */ FL.push(GT['b' + i]); }
    var src = [0, .52, 1.65, 2.25, 4.01], ed = [FL[0], FL[1], FL[2], FL[3], T.progIn + HW], st0 = [T.countIn - HW, FL[0], FL[1], FL[2], FL[3]];
    for (var j = 0; j < 5; j++) U['c' + (6 - j)] = CLIP.use('race', st0[j], ed[j], { from: src[j], speed: j === 4 ? Math.min(.3, .09 / (ed[j] - st0[j])) : .28, zoom: [1, 1.03], focus: F.foc, note: 'count: HUD ' + (6 - j) + '/6 zoomed and ringed, our board' });
    /* the race beat: the same shot as a dimmed full-frame plate under Rockstar's own words */
    CLIP.use('race', T.raceIn - HW, T.countIn - HW, { plate: true, from: .55, speed: Math.min(1, 3.35 / (T.countIn - T.raceIn)), zoom: [1.0, 1.06], focus: [.5, .4], note: 'plate: the race at sunset under the source card' });
    /* the night run: the selfie shot as a plate under our strip */
    CLIP.use('pselfie', T.runIn - HW, T.tourIn, { plate: true, from: 0, speed: Math.min(1, 1.8 / (T.tourIn - T.runIn + HW)), zoom: [1.05, 1.12], focus: [.55, .5], note: 'plate: the selfie by the red car, under the strip' });
    /* the tour: full frame, hard cuts */
    U.tower = CLIP.use('tower', T.tourIn, T.poolC, { from: .2, speed: Math.min(.9, 1.4 / (T.poolC - T.tourIn)), zoom: [1.0, 1.06], focus: [.47, .45], note: 'tour: the tower lit purple, 20:14' });
    U.pool = CLIP.use('pool', T.poolC, T.danceC, { from: .4, speed: .8, zoom: [1.0, 1.05], focus: [.56, .55], note: 'tour: the pool party, 20:18' });
    U.dance = CLIP.use('dance', T.danceC, T.tourOut, { from: .3, speed: Math.min(.9, 1.45 / (T.tourOut - T.danceC)), zoom: [1.0, 1.05], focus: [.5, .5], note: 'tour: the packed dance floor, 20:27' });
    U.balc = CLIP.use('balc', T.drinkIn, T.endIn + HW, { from: .3, speed: Math.min(1, (2.2 - .3) / (T.endIn + HW - T.drinkIn)), zoom: [1.0, 1.05], focus: [.5, .6], note: 'balcony: she holds a drink; ring on the prompt, zoom on DRINK (R1) / DROP, 20:29' });
    U.seam = CLIP.use('race', T.seamIn - HW, DUR + .02, { from: 0, speed: .001, zoom: [1, 1], focus: F.foc, note: 'loop seam: the frame-0 layout returns (race at 6/6, LAST -> ?)' });
    var mid = (T.endIn + T.seamIn) / 2;
    CLIP.use('ppool', T.endIn - HW, mid, { plate: true, from: 0, speed: Math.min(1, 1.2 / (mid - T.endIn + HW)), zoom: [1.1, 1.0], focus: [.5, .5], note: 'plate' });
    CLIP.use('pdance', mid, T.seamIn - HW, { plate: true, from: 0, speed: Math.min(1, 1.05 / (T.seamIn - HW - mid)), zoom: [1.1, 1.0], focus: [.5, .5], note: 'plate' });
    /* sound */
    G('f0', .02, 'slap', .05, .7);
    HF.slice(0, 3).forEach(function (x, i) { G('h' + i, x, 'ctick', .15, .8, .03); });
    G('flip0', T.hookB, 'thump', -1, .25); G('pay', lastw('hook') + .05, 'slap', .3, .4, .03);
    WIPES.forEach(function (c, i) { G('w' + i, c - .1, 'sweep', .45, c === T.endIn ? .9 : i === 0 ? .5 : c === T.seamIn ? 2 : 1.8); });   /* the sweep right before "Pool party" stays soft: Whisper heard it as a word */
    G('cut1', T.tourIn, 'tock', .2, 1); G('cut2', T.poolC, 'tock', .2, 1); G('cut3', T.danceC, 'tock', .2, 1); G('cut4', T.tourOut, 'tock', .2, 1); G('cut5', T.drinkIn, 'tock', .2, 1);
    G('r1', T.timerIn + .1, 'ctick', .3, .45); G('r2', T.row2W, 'ctick', .35, .9); G('big', T.bigW, 'slap', .35, .5);
    G('sun', T.sunW, 'pop', .35, .8); G('el', T.elW, 'ctick', .35, .8); G('cap', T.capW, 'tock', .35, .9);
    G('ten', T.tenW, 'slap', .35, 1);
    G('race', T.runIn + .5, 'pop', .35, .9);
    G('prompt', T.promptW, 'tock', .35, .9); G('drink', T.drinkW, 'pop', .35, .9);
    G('e2', T.danceE, 'tock', .35, .8); G('e3', T.raceE, 'tock', .35, .8);
    STRESS = [at('timer', '3.5'), at('timer', 'seconds'), at('race', 'sunset'), at('race', 'extended'), at('race', 'captured'), at('c6', 'six'), at('c5', 'five'), at('c4', 'four'), at('c3', 'three'), at('c2', 'two'), at('prog', 'ten'), at('run', 'night'), at('tour', 'tower'), at('tour', 'party'), at('tour', 'dance'), at('drink', 'balcony'), at('drink', 'drink')];
    EV.sort(function (a, b) { return a.t - b.t; });
  }
  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (wipeAt(t) !== null) samples = 1;
    if (samples === 1) { POSTERMODE = t === window.FILM.POSTER; frame(ctx, t); POSTERMODE = false; return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) { frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR)); actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0); }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .8;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -8; comp.ratio.value = 2; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); return o; }
    function env(pm, pts) { pm.value = pts[0][1]; pm.setValueAtTime(pts[0][1], 0); pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc2(type, f, t0, t1, pts, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function nband(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g, f) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = f || 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc2('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    /* a 1-3 kHz body so a hit reads on a phone speaker */
    function mid(t, g, d) { nband(t, t + (d || .08), 1400, 2600, .12 * g, .02 * g, 1.6); }
    function slap(t, g) { thump(t, .3 * g, 240); nband(t, t + .07, 2600, 1200, .14 * g, .01 * g, .9); tick(t, 1.1 * g, 2000); mid(t, .6 * g); }
    function tock(t, g) { tick(t, .7 * g, 2600); thump(t, .12 * g, 520); mid(t, .5 * g, .06); }
    function pop(t, g) { var o = osc2('sine', 520, t, t + .12, [[t, 0], [t + .004, .18 * g], [t + .1, 0]]); o.frequency.exponentialRampToValueAtTime(880, t + .08); tick(t, .5 * g, 3000); mid(t, .4 * g, .06); }
    /* the checkered band passing: an air sweep with a mid layer */
    function sweep(t, g) { nband(t, t + .24, 700, 3800, .1 * g, .02 * g, 1.1, -.3); nband(t + .02, t + .2, 1300, 2800, .09 * g, .02 * g, 1.5, .3); }
    /* the race HUD's place change: a short two-tone beep */
    function beep(t, g) { osc2('square', 988, t, t + .08, [[t, 0], [t + .004, .05 * g], [t + .07, 0]]); osc2('sine', 1976, t, t + .07, [[t, 0], [t + .004, .04 * g], [t + .06, 0]]); }
    function ctick(t, g) { tick(t, .5 * g, 4200); osc2('sine', 1250, t, t + .05, [[t, 0], [t + .003, .06 * g], [t + .04, 0]]); }
    function thumpH(t, g) { thump(t, .45 * g, 110); tick(t, .6 * g, 1800); mid(t, .5 * g); }
    var LEVEL = { tock: 2.5, slap: 3, pop: 2.5, sweep: 4, beep: 3, ctick: 2.5, thump: 3 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = { tock: -13, slap: -11, pop: -12, sweep: -11, beep: -9, ctick: -15, thump: -9 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      ({ slap: slap, tock: tock, pop: pop, sweep: sweep, beep: beep, ctick: ctick, thump: thumpH })[e.type](e.t, g);
    });
    /* no music: Isac adds a platform sound; the film ships voice + sound effects */
    (function () { var o = bus(1), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = .5; var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = window.ROOM_GAIN || .03; })();
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 40px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0?“”…↓→×%:\''); }))).then(function () { return document.fonts.ready; }).then(function () {
      BG = buildBG(); EV.length = 0; FL.length = 0; initTimes();
      window.FILM.POSTER = 2.0 + 1 / 60; /* the payoff: LAST -> 2ND, the real HUD at 2 / 6, the board swapped, 3.47 S */
      window.FILM.SHOTS = [
        { id: 'hook', name: 'Last to 2nd', t0: 0, t1: T.timerIn },
        { id: 'timer', name: '3.47 seconds', t0: T.timerIn, t1: T.raceIn },
        { id: 'race', name: 'Extended Look', t0: T.raceIn, t1: T.countIn },
        { id: 'count', name: '6, 5, 4, 3, 2', t0: T.countIn, t1: T.progIn },
        { id: 'prog', name: 'Progress 10%', t0: T.progIn, t1: T.runIn },
        { id: 'run', name: 'A run of night scenes', t0: T.runIn, t1: T.tourIn },
        { id: 'tour', name: 'Tower, pool, dance floor', t0: T.tourIn, t1: T.drinkIn },
        { id: 'drink', name: 'The balcony', t0: T.drinkIn, t1: T.endIn },
        { id: 'end', name: 'First night out?', t0: T.endIn, t1: DUR }];
      window.READY = true;
    });
  }
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-afterdark', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
