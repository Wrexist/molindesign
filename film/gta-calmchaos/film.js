/* "GTA 6: small talk to shootout in under a minute": Delta, "It has X, shown" / timer Short (slug gta-calmchaos). Sources in BRIEF.md.
   Rockstar's An Extended Look (Aug 27 2026, "captured entirely from in-game footage on the PlayStation 5"), one run from 13:10
   (790 s, two people in a car, texting, arguing whether a contact is a cop) to 14:09 (849.5 s, a police truck flips in a
   street shootout). Footage (all An Extended Look, muted, each use under 5 s): 790.3-793.x, 821.1-823.x, 828.25-829.6,
   837.9-839.6, 848.8-849.9 (+ hook/seam 849.45-850.0); plates 786-789.6, 794-797, 832.4-836.4. Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Engine from gta-fridge. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var INK = '#10141a', CREAM = '#fbf3e4', RED = '#e0303a', PINK = '#ff4a3d', SUN = '#ffc94a';
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
  function bump(t, a, d) { return Math.sin(Math.PI * seg(t, a, a + d)); }
  function osc(t, k, ph) { return Math.sin(TAU * k * t / DUR + (ph || 0)); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}, ORDER = []; VO.lines.forEach(function (l) { LINE[l.id] = l; ORDER.push(l.id); });
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
  var BODY = { slap: .1, tock: .06, pop: .1, whip: .3, ctick: .05, tick2: .1, crash: .35 };
  function nearGap(t, type, m) {
    var bd = BODY[type] || .12, best = null;
    free(m || .12).forEach(function (f) { var lo = f[0], hi = f[1] - bd; if (hi < lo) return; var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c; });
    return best;
  }
  var GT = {}, EV = [];
  /* a hit: snapped into the nearest pause within tol; the picture keeps its own time (the hit is sound only) */
  function G(id, t, type, tol, gain) {
    var n = nearGap(t, type);
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
  /* condensed display text; returns its width. o: align, col, st, wt, ls, max (shrinks to fit, never under 36 px) */
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
    rr(g, x - w / 2 + 5, y - h / 2 + 7, w, h, 10); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    rr(g, x - w / 2, y - h / 2, w, h, 10); g.fillStyle = bg; g.fill();
    T2(g, s, x, y, px, { col: fg }); g.restore(); return w;
  }


  /* =====================================================================================================
     THE SET: asphalt night ink, one accent (stopwatch yellow). The hero is a running STOPWATCH chip, top right, that
     shows Rockstar's own video clock minus 13:10 (790 s), so every number we say is the gap in An Extended Look.
     Footage cards are Rockstar's frames (muted, credited), our marks on top. Native move: the CLOCK SWEEP, a dark
     sector that sweeps round the screen like a stopwatch hand between beats.
     ===================================================================================================== */
  var CARDH = { x: 100, y: 600, w: 820, h: 800 }, CARDT = { x: 100, y: 520, w: 820, h: 620 }, CARDB = { x: 100, y: 540, w: 820, h: 760 }, CARDC = { x: 96, y: 500, w: 828, h: 900 };
  var SPL = [], T = {}, U = {}, BG, NOISE, WIPES = [], SRC0 = 790.0;
  var DOORC = '#efe8dc', ASH = '#0f1318', COPR = '#ff4a3d', COPB = '#3d8bff';

  function buildBG() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(29);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#161b22'); gr.addColorStop(.55, '#0f1318'); gr.addColorStop(1, '#080a0d'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    var a = g.createRadialGradient(860, 300, 10, 860, 300, 700); a.addColorStop(0, 'rgba(255,201,74,.14)'); a.addColorStop(1, 'rgba(255,201,74,0)'); g.fillStyle = a; g.fillRect(0, 0, W, H);
    var b = g.createRadialGradient(160, 1400, 10, 160, 1400, 760); b.addColorStop(0, 'rgba(61,139,255,.10)'); b.addColorStop(1, 'rgba(61,139,255,0)'); g.fillStyle = b; g.fillRect(0, 0, W, H);
    /* road lane dashes, very faint */
    g.fillStyle = 'rgba(255,255,255,.03)'; for (var y = 0; y < H; y += 160) { g.fillRect(70, y, 10, 90); g.fillRect(1000, y + 80, 10, 90); }
    for (var k = 0; k < 5000; k++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.07)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    var vg = g.createRadialGradient(510, 900, 300, 510, 900, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }
  function disc(g, x, y, r, c) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = c; g.fill(); }

  /* ---------- the footage card: a framed picture, our credit chip inside it ---------- */
  function card(g, box, t, u, o) {
    o = o || {};
    var X = box.x, Y = box.y, w = box.w, h = box.h;
    g.save(); if (o.rot) { g.translate(X + w / 2, Y + h / 2); g.rotate(o.rot); g.translate(-X - w / 2, -Y - h / 2); }
    rr(g, X + 10, Y + 16, w, h, 22); g.fillStyle = 'rgba(0,0,0,.5)'; g.fill();
    rr(g, X - 8, Y - 8, w + 16, h + 16, 26); g.fillStyle = DOORC; g.fill();
    g.save(); rr(g, X, Y, w, h, 18); g.clip(); g.fillStyle = '#050309'; g.fillRect(X, Y, w, h);
    var tt = Math.min(t, u.t1 - 1e-3);
    g.filter = 'brightness(1.06) contrast(1.05) saturate(1.06)'; CLIP.draw(g, tt, X, Y, w, h, u); g.filter = 'none';
    if (o.after) o.after(g, X, Y, w, h, tt);
    CLIP.credit(g, u, X + 22, Y + h - 22, '700 30px "Geist Mono", monospace');
    g.restore(); g.restore();
  }
  function ring(g, x, y, r, k, col) {
    if (k <= 0) return; g.save(); g.strokeStyle = col || SUN; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.arc(x, y, r * (1 + .25 * (1 - eo(k))), -Math.PI / 2, -Math.PI / 2 + TAU * eo(k)); g.stroke(); g.restore();
  }
  /* a rounded-rect ring drawn on like a pen stroke (for the list) */
  function boxRing(g, x, y, w, h, k, col) {
    if (k <= 0) return; var e = eo(k), r = 30, P = 2 * (w + h);
    g.save(); g.strokeStyle = col || SUN; g.lineWidth = 9; g.lineCap = 'round'; g.setLineDash([P * e, P]); rr(g, x - w / 2, y - h / 2, w, h, r); g.stroke(); g.restore();
  }
  function srcAt(u, t) { var l = t - u.t0; if (u.freeze != null) l = Math.min(l, u.freeze); return u.from + l * u.speed; }
  function track(u, t, pts) {
    var s = srcAt(u, t), i = 0; while (i < pts.length - 2 && s > pts[i + 1][0]) i++;
    var a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)], k = b[0] === a[0] ? 0 : clamp((s - a[0]) / (b[0] - a[0]), 0, 1);
    return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  }
  /* cream sticker with an optional leader line to what it reads */
  function sticker(g, s, x, y, px, k, lx, ly, o) {
    if (k <= 0) return; o = o || {}; var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.globalAlpha *= clamp(k * 3, 0, 1);
    if (lx != null) { g.strokeStyle = CREAM; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(lerp(x, lx, eo(k)), lerp(y, ly, eo(k))); g.stroke(); disc(g, lx, ly, 9 * eo(k), CREAM); }
    g.translate(x, y); var s2 = lerp(1.3, 1, eo(k)) * (o.knock ? kn(o.t, o.knock, .1) : 1); g.scale(s2, s2); chip(g, s, 0, 0, px, o.bg || CREAM, o.fg || INK, { rot: o.rot == null ? -.03 : o.rot }); g.restore(); NOREC = nr;
  }

  /* ---------- the stopwatch (the hero): source clock minus 13:10, digits roll on change ---------- */
  function clockVal(t) {
    var u = CLIP.active(t); if (t >= T.seamIn || t < T.talkIn) return 59;
    if (t >= T.endIn) return null;
    for (var si = 0; si < SPL.length; si++) if (t >= SPL[si][0] && t < SPL[si][1]) return SPL[si][2];
    if (u) { var c = CLIP.manifest().clips[u.clip]; return Math.floor(c.in + srcAt(u, Math.min(t, u.t1 - 1e-3)) - SRC0); }
    var pu = CLIP.activePlate(t); if (pu && pu.clip === 'talk') { var pc = CLIP.manifest().clips.talk; return Math.floor(pc.in + srcAt(pu, t) - SRC0); }
    return null;
  }
  var CW = { x: 790, y: 300 };
  function stopwatch(g, t) {
    var v = clockVal(t); if (v == null) return;
    var km = t >= T.seamIn ? 1 : 1 - eio(seg(t, T.titleOut, T.titleOut + .3)), s = '0:' + String(Math.max(0, Math.min(59, v))).padStart(2, '0');
    var hot = v >= 38, col = hot ? COPR : SUN;
    var nr = NOREC; var ks = 0; for (var sj = 0; sj < SPL.length; sj++) { var a0 = SPL[sj][0], a1 = SPL[sj][1]; if (t >= a0 - .05 && t < a1 + .25) ks = Math.max(ks, eo(seg(t, a0 - .05, a0 + .12)) * (1 - eio(seg(t, a1 - .05, a1 + .25)))); }
    var nrS = NOREC; if (ks > 0 && ks < .999) NOREC = true;
    g.save(); g.translate(lerp(lerp(CX, 800, km), CX, ks), lerp(lerp(215, 600, km), 860, ks)); var ssc = lerp(1, 2.7, ks); g.scale(ssc, ssc); g.rotate(.03 * (1 - ks));
    var w = 220, h = 130; rr(g, -w / 2 + 8, -h / 2 + 10, w, h, 22); g.fillStyle = 'rgba(0,0,0,.5)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 22); g.fillStyle = col; g.fill();
    /* crown on top, like a stopwatch */
    rr(g, -20, -h / 2 - 26, 40, 22, 6); g.fill(); rr(g, -34, -h / 2 - 36, 68, 14, 6); g.fill();
    var lastChange = 0; for (var q = t; q > t - .3; q -= 1 / 30) { if (clockVal(q) !== v) { lastChange = q + 1 / 30; break; } }
    var kk = lastChange ? eo(seg(t, lastChange, lastChange + .18)) : 1;
    g.save(); rr(g, -w / 2, -h / 2, w, h, 22); g.clip(); g.translate(0, 40 * (1 - kk)); g.globalAlpha *= clamp(.3 + kk, 0, 1);
    NOREC = nr || kk < .999; T2(g, s, 0, 4, 104, { col: INK, ls: 2 }); g.restore();
    g.restore(); NOREC = nrS;
  }


  /* ---------- the source ruler (bottom band): Rockstar's clock 13:10 → 14:09, the five beats, a playhead ---------- */
  var MARKS = [[0, 'TEXTING'], [31, 'BACK SEAT'], [38, 'MASKS'], [50, 'SHOTS'], [59, 'FLIP']];
  function ruler(g, t) {
    var v = clockVal(t); if (v == null) v = 59;
    var x0 = 150, x1 = 870, y = 1560, nr = NOREC; NOREC = true;
    function X(s) { return x0 + (x1 - x0) * s / 59; }
    g.save();
    M2(g, '13:10', x0, y - 52, 30, { col: 'rgba(251,243,228,.7)', align: 'center', ls: 1 });
    M2(g, '14:09', x1, y - 52, 30, { col: 'rgba(251,243,228,.7)', align: 'center', ls: 1 });
    M2(g, 'AN EXTENDED LOOK', CX, y - 52, 26, { col: 'rgba(251,243,228,.45)', align: 'center', ls: 3 });
    g.strokeStyle = 'rgba(251,243,228,.25)'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    g.strokeStyle = v >= 38 ? COPR : SUN; g.beginPath(); g.moveTo(x0, y); g.lineTo(X(v), y); g.stroke();
    MARKS.forEach(function (m) {
      var on = v >= m[0], here = v === m[0] || (m[0] === 59 && v >= 59);
      disc(g, X(m[0]), y, on ? 14 : 10, on ? (m[0] >= 38 ? COPR : SUN) : 'rgba(251,243,228,.35)');
      if (here) M2(g, m[1], clamp(X(m[0]), x0 + 60, x1 - 60), y + 48, 28, { col: CREAM, align: 'center', ls: 2 });
    });
    /* playhead */
    var px = X(v); g.fillStyle = CREAM; g.beginPath(); g.moveTo(px, y - 22); g.lineTo(px - 13, y - 40); g.lineTo(px + 13, y - 40); g.closePath(); g.fill();
    g.restore(); NOREC = nr;
  }

  /* ---------- the clock sweep (native move): a dark sector sweeps round like a stopwatch hand ---------- */
  function sweepWipe(g, t) {
    for (var i = 0; i < WIPES.length; i++) {
      var c = WIPES[i], a0 = -Math.PI / 2, a1;
      if (t >= c - .26 && t < c) { a1 = a0 + TAU * eio(seg(t, c - .26, c)); g.save(); g.beginPath(); g.moveTo(W / 2, H / 2); g.arc(W / 2, H / 2, 1300, a0, a1); g.closePath(); g.fillStyle = ASH; g.fill(); hand(g, a1); g.restore(); }
      else if (t >= c && t < c + .3) { var a2 = a0 + TAU * eio(seg(t, c, c + .3)); g.save(); g.beginPath(); g.moveTo(W / 2, H / 2); g.arc(W / 2, H / 2, 1300, a2, a0 + TAU); g.closePath(); g.fillStyle = ASH; g.fill(); hand(g, a2); g.restore(); }
    }
    function hand(gg, a) { gg.strokeStyle = SUN; gg.lineWidth = 14; gg.lineCap = 'round'; gg.beginPath(); gg.moveTo(W / 2, H / 2); gg.lineTo(W / 2 + Math.cos(a) * 1300, H / 2 + Math.sin(a) * 1300); gg.stroke(); disc(gg, W / 2, H / 2, 26, SUN); }
  }
  function wiping(t) { for (var i = 0; i < WIPES.length; i++) if (t > WIPES[i] - .3 && t < WIPES[i] + .34) return true; return false; }

  /* ---------- frame 0 / seam: the hook title ---------- */
  function hookTitle(g, t, k) {
    if (k <= 0) return;
    var nr = NOREC; NOREC = nr || k < .999; var dy = -620 * (1 - k);
    g.save(); g.translate(0, dy);
    chip(g, 'GTA 6', 200, 262, 64, COPR, CREAM, { rot: -.05 });
    var w1 = tw('SMALL TALK TO', 96) + 56;
    g.save(); g.translate(CX, 380); g.rotate(-.02); rr(g, -w1 / 2 + 6, -60 + 9, w1, 120, 12); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, -w1 / 2, -60, w1, 120, 12); g.fillStyle = CREAM; g.fill(); g.restore();
    T2(g, 'SMALL TALK TO', CX, 380, 96, { col: INK, max: 740 });
    var w2 = tw('SHOOTOUT', 128) + 56;
    g.save(); g.translate(CX - 115, 512); g.rotate(.015); rr(g, -w2 / 2 + 6, -72 + 9, w2, 144, 12); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, -w2 / 2, -72, w2, 144, 12); g.fillStyle = COPR; g.fill(); g.restore();
    T2(g, 'SHOOTOUT', CX - 115, 512, 128, { col: CREAM });
    g.restore(); NOREC = nr;
  }
  /* the police truck in the cops cut (0..1 of the frame) */
  var TRUCK = [[0, .5, .3], [.8, .52, .3], [1.3, .55, .34], [2.2, .6, .36]];
  function hookBeat(g, t, seam) {
    var u = seam ? U.seam : U.hook;
    card(g, CARDH, t, u, { rot: -.012, after: function (gg, x, y, w, h, tt) {
      if (seam) return;
      var p = track(u, tt, TRUCK), q = CLIP.toScreen(u, tt, p[0], p[1], x, y, w, h);
      ring(gg, q[0], q[1], 170, seg(t, T.ringA, T.ringA + .45), COPR);
    } });
    /* payoff: 0:00 CALM sticker at 1.0 s, so the gap reads by 2 s */
    if (!seam) sticker(g, 'FROM 0:00 CALM', 380, 1320, 56, seg(t, T.payW, T.payW + .2), null, null, { bg: CREAM, fg: INK, rot: -.03 });
  }

  /* ---------- 0:00: the calm car, texting ---------- */
  var PHONE = [[0, .2, .7], [3.8, .2, .66]];
  function talkBeat(g, t) {
    var u = U.talk; if (t < u.t0 - .02 || t >= u.t1) return;
    card(g, CARDT, t, u, { after: function (gg, x, y, w, h, tt) {
      var p = track(u, tt, PHONE), q = CLIP.toScreen(u, tt, p[0], p[1], x, y, w, h);
      ring(gg, q[0], q[1], 90, seg(t, T.textW - .2, T.textW + .15));
    } });
    sticker(g, 'CALM. TEXTING.', 360, 1080, 64, seg(t, T.talkCard - .02, T.talkCard + .15), null, null, { knock: T.talkCard + .15, t: t });
  }
  /* the cop question: our type over the plate of the same conversation */
  function bubble(g, s1, s2, x, y, k, col, fg, tail) {
    if (k <= 0) return; var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.globalAlpha *= clamp(k * 3, 0, 1); g.translate(x, y); var sc = lerp(1.25, 1, eo(k)); g.scale(sc, sc);
    var w = Math.max(tw(s1, 76), tw(s2, 76)) + 90, h = 230;
    rr(g, -w / 2 + 8, -h / 2 + 12, w, h, 40); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 40); g.fillStyle = col; g.fill();
    T2(g, s1, 0, -44, 76, { col: fg }); T2(g, s2, 0, 46, 76, { col: fg });
    g.restore(); NOREC = nr;
  }
  function copBeat(g, t) {
    if (t < T.copIn || t >= T.backCard) return;
    var kc = seg(t, T.argW - .05, T.argW + .2), kco = seg(t, T.backIn - .15, T.backIn);
    if (kc > 0 && kco < 1) { var nr = NOREC; NOREC = nr || kc < .999 || kco > 0; g.save(); g.translate(CX, 590); var sc = lerp(1.6, 1, eo(kc)) * kn(t, T.copW, .12); g.scale(sc, sc); g.globalAlpha *= clamp(kc * 3, 0, 1) * (1 - kco); chip(g, 'A COP?', 0, 0, 140, COPR, CREAM, { rot: -.03 }); g.restore(); NOREC = nr; }
    if (t >= T.quoteIn - .1) {
      if (t < T.backIn) bubble(g, '“COULD BE', 'A COP…”', 360, 840, seg(t, T.couldW - .1, T.couldW + .12), CREAM, INK, -1);
      if (t < T.backIn + .35) bubble(g, '“HE’S JUST', 'CAUTIOUS.”', 640, 1170, seg(t, T.otherW - .2, T.otherW + .02), SUN, INK, 1);
      var kt = seg(t, T.quoteIn + .2, T.quoteIn + .4); if (kt > 0 && t < T.backIn) { g.save(); g.globalAlpha *= kt; chip(g, 'SAID IN THIS SCENE · 13:14', CX, 1390, 40, INK, CREAM, { rot: .01 }); g.restore(); }
    }
  }

  /* ---------- the escalation cards, each with its tag ---------- */
  function escCard(g, t, u, box, pts, r, tag, tagW, col, rot) {
    if (t < u.t0 - .02 || t >= u.t1) return;
    card(g, box, t, u, { rot: rot || 0, after: function (gg, x, y, w, h, tt) {
      if (!pts) return; var p = track(u, tt, pts), q = CLIP.toScreen(u, tt, p[0], p[1], x, y, w, h);
      ring(gg, q[0], q[1], r, seg(t, tagW - .25, tagW + .1), col);
    } });
  }
  function escTag(g, t, a, b, box, tag, col) {
    if (t < a || t >= b) return; var ko = seg(t, b - .12, b);
    g.save(); g.globalAlpha *= 1 - ko;
    sticker(g, tag, CX, box.y + box.h - 10, 76, seg(t, a, a + .18), null, null, { knock: a + .18, t: t, bg: col === COPR ? COPR : CREAM, fg: col === COPR ? CREAM : INK, rot: -.025 });
    g.restore();
  }

  /* ---------- the end: calm vs chaos, then the vote ---------- */
  function endBeat(g, t) {
    var k = eo(seg(t, T.endIn - .05, T.endIn + .25)); if (k <= 0 || t >= T.seamIn) return;
    var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.translate(0, 1400 * (1 - k));
    var kv = eo(seg(t, T.smallW - .12, T.smallW + .1));
    var w1 = tw('CALM → CHAOS', 120) + 70; g.save(); g.translate(CX, 600); g.rotate(-.02); rr(g, -w1 / 2, -76, w1, 152, 14); g.fillStyle = CREAM; g.fill(); g.restore(); T2(g, 'CALM → CHAOS', CX, 600, 120, { col: INK });
    var w2 = tw('IN 59 SECONDS', 96) + 60; g.save(); g.translate(CX, 760); g.rotate(.015); rr(g, -w2 / 2, -60, w2, 120, 14); g.fillStyle = COPR; g.fill(); g.restore(); T2(g, 'IN 59 SECONDS', CX, 760, 96, { col: CREAM });
    if (kv > 0) {
      var nrv = NOREC; NOREC = nrv || kv < .999; g.save(); g.globalAlpha *= kv; chip(g, 'WHICH ONE?', CX, 930, 72, CREAM, INK, { rot: -.015 }); g.restore(); NOREC = nrv;
      function btn(x, w, s1, s2, kk, col) {
        if (kk <= 0) return; g.save(); g.translate(x, 1180); var sc = lerp(.6, 1, kk) * kn(t, T.hereW, .08) * (1 + .035 * Math.sin(TAU * (t - T.smallW) / .9 + (x > CX ? Math.PI : 0))); g.scale(sc, sc); g.rotate(.03 * Math.sin(TAU * (t - T.smallW) / 1.8 + (x > CX ? 1.5 : 0))); g.globalAlpha *= clamp(kk * 2, 0, 1);
        rr(g, -w / 2 + 8, -150 + 10, w, 300, 30); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, -w / 2, -150, w, 300, 30); g.fillStyle = col; g.fill();
        T2(g, s1, 0, -46, 88, { col: col === SUN ? INK : CREAM, max: w - 40 }); T2(g, s2, 0, 46, 88, { col: col === SUN ? INK : CREAM, max: w - 40 }); g.restore();
      }
      btn(300, 370, 'SMALL', 'TALK', eo(seg(t, T.smallW, T.smallW + .2)), SUN);
      btn(720, 370, 'SHOOT', 'OUT', eo(seg(t, T.shootW, T.shootW + .2)), COPR);
    }
    g.restore(); NOREC = nr;
  }

  function props(g, t) {
    if (t < T.talkIn + .02) hookBeat(g, t, false);
    talkBeat(g, t);
    copBeat(g, t);
    escCard(g, t, U.back, CARDB, [[0, .5, .35], [2, .5, .35]], 150, 'BACK SEAT', T.backW, SUN, -.008);
    escCard(g, t, U.masks, CARDB, [[0, .64, .47], [1.5, .66, .47]], 110, 'MASKS ON', T.masksW, COPR, .008);
    escCard(g, t, U.rifle, CARDB, [[0, .47, .55], [.43, .37, .55]], 130, 'SHOOTING', T.rifleW, COPR, -.008);
    escCard(g, t, U.cops, CARDC, TRUCK, 210, 'POLICE TRUCK', T.truckW, COPR, .008);
    escTag(g, t, T.backIn + .35, T.masksIn, CARDB, 'BACK SEAT', SUN);
    escTag(g, t, T.masksIn - .1, T.rifleIn + .16, CARDB, 'MASKS ON', COPR);
    escTag(g, t, T.rifleIn + .14, T.copsIn + .05, CARDB, 'SHOOTING', COPR);
    escTag(g, t, T.copsIn + .05, T.endIn, CARDC, 'POLICE TRUCK', COPR);
    endBeat(g, t);
    if (t >= T.seamIn - .02) hookBeat(g, t, true);
    if (t < T.seamIn) hookTitle(g, t, 1 - eio(seg(t, T.titleOut, T.titleOut + .3)));
    else hookTitle(g, t, 1);
    stopwatch(g, t);
  }

  /* =====================================================================================================
     CAPTIONS: cream tape near the top of the safe box, phrase by phrase (hook, items and end have their own boards)
     ===================================================================================================== */
  var BREAK = { talk: ['arguing'], quote: [], back: ['yelling'] };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'end' || l.id === 'loop') return;
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!]["”]?$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS = [], CAPY = 395, CUTS = [];
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function captions(g, t) {
    t = tq(t);
    var c0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { c0 = c; ci = i; } });
    if (!c0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s : T.endIn;
    var end = Math.min(c0.t1 + .55, ns, T.endIn - .2);
    /* a caption that starts just before a door wipe comes in after it (the walk line starts 0.3 s before the 2.5 s wipe) */
    var s0 = c0.s; for (var bj = 0; bj < CUTS.length; bj++) if (CUTS[bj] > c0.s && CUTS[bj] < c0.s + .6) s0 = CUTS[bj] + .3;
    if (t < s0) return;
    for (var bi = 0; bi < CUTS.length; bi++) if (CUTS[bi] > s0 + .2) { end = Math.min(end, CUTS[bi] - .3); break; }
    if (t >= end) return;
    var k = cd(t, s0, 16), ko = 1 - seg(t, end - .06, end);
    g.save(); g.globalAlpha *= ko; cond(g, 'condensed'); var cpx = 72; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = c0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws, gap, lines, lw, maxw = 780, br = BREAK[c0.id] || [];
    function meas() { ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; }
    function lay() {
      lines = [[]];
      words.forEach(function (w, i) { lines[lines.length - 1].push(i); if (br.indexOf(w.w.toLowerCase()) >= 0 && i < words.length - 1) lines.push([]); });
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    meas(); lay();
    while (Math.max.apply(null, lw) - gap > maxw && cpx > 52) { cpx -= 4; font(g, cpx, 900); meas(); lay(); }
    var lh = cpx * 1.3, y0 = CAPY - (lines.length - 1) * lh / 2 + cpx * .36;
    lines.forEach(function (ln, li) {
      var tw0 = lw[li] - gap, x = CX - tw0 / 2, y = y0 + li * lh + (1 - k) * 26, r = mulberry(Math.round(c0.t0 * 100) + li * 7);
      var x0 = x - 22, x1 = x + tw0 + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CX, y); g.rotate(rot); g.translate(-CX, -y);
      g.save(); g.shadowColor = 'rgba(0,4,20,.55)'; g.shadowBlur = 10; g.shadowOffsetX = 3; g.shadowOffsetY = 6; g.fillStyle = CREAM; rr(g, x0, yt, x1 - x0, yb - yt, 6); g.fill(); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .25;
        if (cur) { g.save(); g.fillStyle = SUN; g.fillRect(x - 6, y - cpx * .78, ws[i] + 12, cpx * .98); g.restore(); }
        var isG = /^GTA$/.test(up[i]); g.fillStyle = isG ? COPR : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }


  /* =====================================================================================================
     FRAME
     ===================================================================================================== */
  var POSTERMODE = false, STAGEC = '#080a0d';
  function stage(g) { g.fillStyle = STAGEC; g.fillRect(0, 0, W, H); }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1 + 20); else g.rect(-500, -500, 2080, BY1 + 520); g.clip(); }
  function plateLayer(g, t) {
    var u = CLIP.activePlate(t); if (!u) return;
    var k = seg(t, u.t0, u.t0 + .25) * (1 - seg(t, u.t1 - .25, u.t1));
    g.save(); g.globalAlpha = k; CLIP.plate(g, t, 0, 0, W, H, { dim: .55, blur: 3 }); g.restore();
  }
  function push(t) { if (t < 1.4) return 1 + .035 * (1 - eio(seg(t, .3, 1.4))); if (t >= T.seamIn) return 1 + .035 * eio(seg(t, T.seamIn + .3, DUR)); return 1 + .012 * Math.sin(TAU * t / 3.1); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) { g.drawImage(BG, 0, 0); plateLayer(g, t); }
    var dw = seg(t, 0, .6) * (1 - seg(t, DUR - .6, DUR - .05));
    var ddx = 3 * osc(t, 13, .3) * dw, ddy = 3 * osc(t, 11, 2.1) * dw, ps = push(t);
    g.save(); railClip(g); g.translate(510 + ddx, 900 + ddy); g.scale(ps, ps); g.translate(-510, -900);
    props(g, t); g.restore();
    if (!POSTERMODE && LIVE.text) { captions(g, t); }
    ruler(g, t);
    if (LIVE2.bg) sweepWipe(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('title', 'SMALL TALK TO SHOOTOUT', 0, T.titleOut + .15); Tx('title', 'SMALL TALK TO SHOOTOUT', T.seamIn + .3, DUR + 1);
    Tx('gta6', 'GTA 6', 0, T.titleOut + .15);
    Tx('clock', '0:59', 0, T.titleOut + .15);
    Tx('calm', 'FROM 0:00 CALM', T.payW + .05, T.talkIn - .08);
    Tx('texting', 'CALM. TEXTING.', T.talkCard + .06, U.talk.t1 - .05);
    Tx('cop', 'A COP?', T.argW + .2, T.backIn - .15);
    Tx('could', 'COULD BE A COP', T.couldW + .1, T.backIn - .05);
    Tx('caut', 'HE’S JUST CAUTIOUS', T.otherW, T.backIn + .33);
    Tx('back', 'BACK SEAT', T.backIn + .5, T.masksIn - .1);
    Tx('masks', 'MASKS ON', T.masksIn - .02, T.rifleIn + .1);
    Tx('rifle', 'SHOOTING', T.rifleIn + .2, T.copsIn - .05);
    Tx('truck', 'POLICE TRUCK', T.copsIn + .15, T.endIn - .1);
    Tx('chaos', 'CALM → CHAOS IN 59 SECONDS', T.endIn + .2, T.seamIn - .1);
    Tx('which', 'WHICH ONE?', T.smallW + .15, T.seamIn - .1);
    return o;
  }

  /* ---------- times, clips and sound events, all from the voice ---------- */
  function initTimes() {
    T.ringA = .25; T.payW = .35;
    T.talkIn = start('talk') - .15; T.titleOut = T.talkIn - .32;
    T.textW = at('talk', 'texting'); T.carW = at('talk', 'car'); T.copIn = at('talk', 'arguing') - .3; T.copW = at('talk', 'cop'); T.argW = at('talk', 'arguing');
    T.quoteIn = start('quote') - .2; T.couldW = at('quote', 'could'); T.cautW = at('quote', 'cautious'); T.otherW = at('quote', 'other');
    T.backIn = start('back') - .2; T.backW = at('back', 'back');
    T.masksIn = start('masks') - .2; T.masksW = at('masks', 'masks');
    T.rifleIn = start('rifle') - .2; T.rifleW = at('rifle', 'shooting');
    T.copsIn = start('cops') - .2; T.truckW = at('cops', 'truck'); T.flipW = at('cops', 'flipping');
    T.endIn = at('end', 'calm') - .25; T.smallW = at('end', 'small'); T.shootW = at('end', 'shootout'); T.hereW = at('end', 'here');
    T.seamIn = at('loop', 'because');
    CLIP.reset();
    /* hook: the police truck mid-flip (849.5-850.2 s) held, then the same cut returns at the seam */
    U.hook = CLIP.use('cops', 0, T.talkIn, { from: .95, speed: .35, freeze: 1.6, zoom: [1.25, 1.35], focus: [.5, .36], note: 'hook: the police truck flipping at 14:09, ringed; GTA 6 SMALL TALK TO SHOOTOUT, stopwatch 0:59, FROM 0:00 CALM' });
    T.talkCard = at('talk', 'two') - .1; T.backCard = at('back', 'guy') - .3; T.masksCard = T.masksW - .1; T.rifleCard = at('rifle', 'shooting') - .1; T.copsCard = at('cops', 'a') - .1;
    SPL = [[T.talkIn + .2, T.talkCard, 0], [T.backIn, T.backCard, 31], [T.masksIn, T.masksCard, 38], [T.rifleIn, T.rifleCard, 50], [T.copsIn, T.copsCard, 59]];
    U.talk = CLIP.use('sign', T.talkCard, T.copW - .4, { from: .3, speed: 1, zoom: [1.15, 1.25], focus: [.3, .5], note: '0:00 the calm car (13:10): ring on the phone in hand, CALM. TEXTING., stopwatch from 0:00' });
    U.back = CLIP.use('back', T.backCard, T.masksIn, { from: .1, speed: .95, zoom: [1.2, 1.3], focus: [.5, .4], note: '0:31 a man yelling in the back seat (13:41), ring + BACK SEAT, stopwatch 0:31' });
    U.masks = CLIP.use('masks', T.masksCard, T.rifleIn, { from: .25, speed: .7, zoom: [1.3, 1.4], focus: [.62, .45], note: '0:38 bandana mask on at the wheel (13:48), ring + MASKS ON, stopwatch 0:38' });
    U.rifle = CLIP.use('shoot', T.rifleCard, T.copsIn, { from: 0, speed: .43 / (T.copsIn - T.rifleCard), zoom: [1.2, 1.35], focus: [.45, .55], note: '0:50 shooting out of the car window, police truck ahead (14:00), ring + SHOOTING, stopwatch 0:50' });
    U.cops = CLIP.use('cops', T.copsCard, T.endIn, { from: .75, speed: .7, zoom: [1.05, 1.4], focus: [.5, .36], note: '0:59 the police truck flips (14:09), ring + POLICE TRUCK, stopwatch 0:58/0:59' });
    U.seam = CLIP.use('cops', T.seamIn, DUR + .02, { from: .95, speed: .35, freeze: 1.6, zoom: [1.25, 1.25], focus: [.5, .36], note: 'loop seam: the frame-0 layout returns' });
    function plate(name, t0, t1, from) { var c = CLIP.manifest().clips[name], span = c.frames / 30 - .04 - (from || 0); return CLIP.use(name, t0, t1, { plate: true, from: from || 0, speed: Math.min(1, span / (t1 - t0)), zoom: [1.1, 1.0], focus: [.5, .5], note: 'background plate' }); }
    plate('talk', U.talk.t1, Math.min(T.backIn, U.talk.t1 + 4.8));
    plate('pmask', T.endIn, T.smallW - .2);
    /* sound: hits sit in the voice's pauses */
    G('f0', 0, 'slap', .05, .78);
    G('ring', T.ringA, 'tock', .3, .9);
    G('calm', T.payW, 'pop', .35, .9);
    WIPES = [T.talkIn, T.backIn, T.endIn, T.seamIn];
    WIPES.forEach(function (c, i) { G('sw' + i, c - .05, 'whip', .25, 1); });
    G('text', T.textW, 'ctick', .35, 1);
    G('cop', T.copW, 'slap', .35, 1);
    G('could', T.couldW, 'pop', .35, .9); G('caut', T.cautW, 'pop', .35, .9);
    G('back', T.backW, 'tock', .35, 1);
    G('bcut', T.backIn + .1, 'tick2', .3, 1); G('mcut', T.masksIn, 'tick2', .3, 1); G('masks', T.masksW, 'tock', .35, 1);
    G('rcut', T.rifleIn, 'tick2', .3, 1); G('rifle', T.rifleW, 'slap', .35, 1);
    G('ccut', T.copsIn, 'tick2', .3, 1); G('flip', T.flipW + .3, 'crash', .4, 1);
    G('small', T.smallW, 'pop', .35, .9); G('shoot', T.shootW, 'pop', .35, .9); G('here', T.hereW, 'tock', .35, .8);
    CUTS = WIPES.concat([T.talkCard, U.talk.t1, T.quoteIn, T.backCard, T.masksIn, T.masksCard, T.rifleIn, T.rifleCard, T.copsIn, T.copsCard]).sort(function (a, b) { return a - b; });
    STRESS = [at('talk', 'clock'), at('talk', 'texting'), at('talk', 'cop'), at('quote', 'could'), at('quote', 'cautious'), at('back', '31'), at('back', 'yelling'), at('masks', 'masks'), at('rifle', 'shooting'), at('cops', 'flipping')];
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (wiping(t)) samples = 1;
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
    function slap(t, g) { thump(t, .3 * g, 240); nband(t, t + .07, 2600, 1200, .14 * g, .01 * g, .9); tick(t, 1.1 * g, 2000); }
    function tock(t, g) { tick(t, .7 * g, 2600); thump(t, .12 * g, 520); }
    function pop(t, g) { var o = osc2('sine', 520, t, t + .12, [[t, 0], [t + .004, .18 * g], [t + .1, 0]]); o.frequency.exponentialRampToValueAtTime(880, t + .08); tick(t, .5 * g, 3000); }
    /* the clock sweep: an airy whoosh */
    function whip(t, g) { nband(t, t + .28, 600, 3200, .12 * g, .02 * g, .9); }
    function ctick(t, g) { tick(t, .5 * g, 4200); osc2('sine', 1250, t, t + .05, [[t, 0], [t + .003, .06 * g], [t + .04, 0]]); }
    /* a stopwatch tick when the clock jumps */
    function tick2(t, g) { tick(t, .8 * g, 5200); tick(t + .06, .5 * g, 4600); }
    /* the truck: a low metal crunch */
    function crash(t, g) { thump(t, .45 * g, 110); nband(t, t + .35, 1400, 300, .16 * g, .02 * g, .7); tick(t + .02, .9 * g, 1800); }
    var LEVEL = { tock: 2, slap: 3, pop: 2, whip: 2.5, ctick: 2, tick2: 2, crash: 3 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = { tock: -18, slap: -14, pop: -16, whip: -17, ctick: -21, tick2: -9, crash: -14 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      ({ slap: slap, tock: tock, pop: pop, whip: whip, ctick: ctick, tick2: tick2, crash: crash })[e.type](e.t, g);
    });
    /* no music: Isac adds a platform sound; the film ships voice + sound effects */
    var MUSIC = false; if (MUSIC) { /* intentionally empty */ }
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
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0?“…↑&\''); }))).then(function () { return document.fonts.ready; }).then(function () {
      BG = buildBG(); EV.length = 0; initTimes();
      window.FILM.POSTER = 1.5 + 1 / 60; /* the hook card with the truck ringed and FROM 0:00 CALM */
      window.FILM.SHOTS = [
        { id: 'hook', name: 'Small talk to shootout', t0: 0, t1: start('talk') },
        { id: 'talk', name: '0:00 calm, texting', t0: start('talk'), t1: start('quote') },
        { id: 'quote', name: 'Cop or cautious', t0: start('quote'), t1: start('back') },
        { id: 'back', name: '0:31 back seat', t0: start('back'), t1: start('masks') },
        { id: 'masks', name: '0:38 masks', t0: start('masks'), t1: start('rifle') },
        { id: 'rifle', name: '0:50 shooting', t0: start('rifle'), t1: start('cops') },
        { id: 'cops', name: '0:59 police truck', t0: start('cops'), t1: start('end') },
        { id: 'end', name: 'Which one?', t0: start('end'), t1: DUR }];
      window.READY = true;
    });
  }
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-calmchaos', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();

