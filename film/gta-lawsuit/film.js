/* "Lindsay Lohan sued GTA 5": Delta, pillar 7 (pop culture). Lohan v Take-Two Interactive Software, 2018 NY Slip Op 02208.
   A vertical film written in code, narrated first and cut to the voice: every beat is keyed to a word time from vo/vo.js
   (window.VO) with at(id, word); every hit sits in a pause the voice track really leaves (vo/vad.js). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Set: the paper courtroom (navy felt desk, a
   manila case folder, a green 1903 statute book, a brass gavel, an oxblood DISMISSED stamp, a gilt frame of plain pixel
   tiles, a calendar pad). Names appear only as typed cards: no likeness of anyone, no Rockstar art, no logos, no music.
   Engine from gta-losantos. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0e2a24', CREAM = '#fbf6ea';
  var HOT = '#e0283c', TEAL = '#2347c8', ORG = '#ff6a1f';
  var INK = '#14213d', PAPER = '#f2e5cd', NEWS = '#efe5cf', KRAFT = '#b8834b', KRAFT2 = '#8a5a2e', BENCH = '#1c1042';
  var DISP = 'Archivo';
  /* the frame: everything in the picture is clipped to it, so no push, dip or dolly can cross the x 90-930 / y 300-1430 rail */
  var BX0 = 90, BX1 = 930, BY0 = 300, BY1 = 1430, TAU = Math.PI * 2;

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* critically damped settle: 0 -> 1, never overshoots */
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function fin(t, a, d) { return seg(t, a, a + (d || .14)); }
  function out(t, a, d) { return 1 - seg(t, a - (d || .25), a); }
  /* a monotonic knock: rises fast, decays, never goes under 1 */
  function kn(t, a, amt) { if (t < a) return 1; var u = t - a; return 1 + (amt || .08) * (1 - Math.exp(-u * 40)) * Math.exp(-u * 7); }
  /* a damped swing kick (pendulum), 0 before a */
  function sw(t, a, amp, f, d) { if (t < a) return 0; var u = t - a; return amp * Math.exp(-u * (d || 2.6)) * Math.sin(u * (f || 7)); }
  function bump(t, a, d) { return Math.sin(Math.PI * seg(t, a, a + d)); }
  /* every ambient motion is periodic in the film's length, so the last frame is frame 0 exactly */
  function osc(t, k, ph) { return Math.sin(TAU * k * t / DUR + (ph || 0)); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}, ORDER = []; VO.lines.forEach(function (l) { LINE[l.id] = l; ORDER.push(l.id); });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function wend(id, word, nth) { return find(id, word, nth).t1; }
  function start(id) { return LINE[id].t0; }
  function lastw(id) { var w = LINE[id].words; return w[w.length - 1].t1; }

  /* ---------- the SFX gate: hits sit in pauses, clear of where the voice really sounds (vo/vad.js) ---------- */
  var EDGES = [], VOICED = [];
  if (window.VAD) window.VAD.forEach(function (v) { VOICED.push({ t0: v[0], t1: v[1] }); EDGES.push(v[0], v[1]); });
  else VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  if (!window.VAD) (window.HEARD || []).forEach(function (w) { if (w[1] < .15) return; VOICED.push({ t0: w[0], t1: w[1] }); EDGES.push(w[0], w[1]); });
  function free(m) {
    var B = [], M = [], F = [], p = 0;
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { snip: .16, pin: .1, creak: .24, pop: .12, stab: .1, stamp: .27, swish: .26, slap: .14, snap: .16, door: .12, chime: .5, click: .08, tick: .05, fold: .3 };
  function nearGap(t, type, m, body) {
    var bd = body || BODY[type] || .12, best = null;
    free(m || (window.VAD ? .15 : .2)).forEach(function (f) {
      var lo = f[0], hi = f[1] - bd; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  var GT = {}, EV = [];
  function G(id, t, type, tol, gain, extra) {
    var n = nearGap(t, type, extra && extra.m, extra && extra.dur);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .35 : tol)) { GT[id] = n; var e = { t: n, type: type, g: gain == null ? 1 : gain, id: id }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
    else GT[id] = t;
    return GT[id];
  }
  function vadEndBefore(t, from) { var ve = from; (window.VAD || []).forEach(function (v) { if (v[0] < t - .2 && v[1] > ve) ve = v[1]; }); return ve; }
  function after(id) { var i = ORDER.indexOf(id), nx = ORDER[i + 1]; return vadEndBefore(nx ? start(nx) : DUR, lastw(id) - .6) + .155; }

  /* ---------- canvas + safe-area check ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  var BOUNDS = null, NOREC = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || NOREC || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys), d = Math.min.apply(null, ys);
    /* wholly outside the clipped rail (off camera, behind the clip): not drawn, nothing to check */
    if (d > BY1 || b < SAFE.x0 || a > SAFE.x1) return;
    if (a < SAFE.x0 - .5 || b > SAFE.x1 + .5 || c > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
  }
  function watch(g) {
    var orig = g.fillText, oimg = g.drawImage;
    g.fillText = function (str, x, y) {
      if (BOUNDS) { var mm = this.measureText(str); recBox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent, str); }
      return orig.apply(this, arguments);
    };
    /* pre-printed paper (strips, tags, the stamp) carries its words in a canvas: record those boxes too */
    g.drawImage = function (img) {
      if (BOUNDS && img && img.words && arguments.length >= 5) { var x = arguments[1], y = arguments[2], w = arguments[3], h = arguments[4], sx = w / img.pw, sy = h / img.ph; img.words.forEach(function (b) { recBox(g, x + b[0] * sx, y + b[1] * sy, x + b[2] * sx, y + b[3] * sy, b[4]); }); }
      return oimg.apply(this, arguments);
    };
  }

  /* ---------- primitives (setting ctx.font resets fontStretch: font() re-applies it) ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); if (g.__st) try { g.fontStretch = g.__st; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function cond(g, st) { g.__st = st || 'extra-condensed'; try { g.fontStretch = g.__st; } catch (e) {} }
  function unst(g) { g.__st = null; try { g.fontStretch = 'normal'; } catch (e) {} }
  function txt(g, text, x, y, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    var px = Math.max(36, o.px || 40);
    g.save(); g.globalAlpha *= clamp(a, 0, 1); if (o.cond !== false) cond(g, o.st); font(g, px, o.wt || 900); ls(g, o.ls == null ? 1 : o.ls);
    g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.fillStyle = o.col || CREAM;
    g.fillText(text, x, y); g.restore(); unst(g);
  }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 56, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    g.save(); if (o.cond !== false) cond(g); font(g, px, o.wt || 900); ls(g, o.ls || 1);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .34 : o.pad, w = o.w || tw + pad * 2, h = o.h || px * 1.3;
    g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.shadow !== false) { rr(g, -w / 2 + 5, -h / 2 + 8, w, h, 8); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); }
    rr(g, -w / 2, -h / 2, w, h, 8); g.fillStyle = o.bg || CREAM; g.fill();
    if (o.line) { g.strokeStyle = o.line; g.lineWidth = 3; g.stroke(); }
    g.fillStyle = o.fg || INK; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore(); unst(g);
    return w;
  }

  /* =====================================================================================================
     PAPER. Every piece is cut once into its own canvas: flat color, seeded tooth and fibres, a pale cut edge
     (the white core of cardstock), and a soft cast shadow baked in. Pieces then only move as rigid bodies,
     the way paper does: nothing morphs.
     ===================================================================================================== */
  var PS = 1.5, GRAIN = null, P = {};
  function buildGrain() {
    var c = mk(300, 300), g = c.getContext('2d'), r = mulberry(41), i;
    for (i = 0; i < 4600; i++) { var d = r(); g.fillStyle = d < .55 ? 'rgba(60,35,10,' + (.05 + r() * .1).toFixed(3) + ')' : 'rgba(255,255,255,' + (.06 + r() * .15).toFixed(3) + ')'; g.fillRect(r() * 300, r() * 300, .6 + r() * 1.5, .6 + r() * 1.5); }
    g.lineWidth = .8;
    for (i = 0; i < 120; i++) { var x = r() * 300, y = r() * 300, a = r() * 6.28, L = 6 + r() * 16; g.strokeStyle = 'rgba(70,45,20,' + (.07 + r() * .09).toFixed(3) + ')'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * L * .5, y + Math.sin(a + .6) * L * .5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
    return c;
  }
  /* b = [x0, y0, x1, y1] in the piece's own coordinates; path(g) traces the outline; fill is a color or fn(g) */
  function piece(b, path, fill, o) {
    o = o || {};
    var ps = o.ps || PS, pad = o.pad == null ? 36 : o.pad, w = b[2] - b[0] + 2 * pad, h = b[3] - b[1] + 2 * pad;
    var c = mk(w * ps, h * ps), g = c.getContext('2d');
    g.scale(ps, ps); g.translate(pad - b[0], pad - b[1]);
    var fs = function () { return typeof fill === 'function' ? fill(g) : fill; };
    g.save();
    if (o.filter) g.filter = o.filter;
    if (o.shadow !== false) { g.shadowColor = o.sc || 'rgba(6,3,18,.5)'; g.shadowBlur = (o.blur || 12) * ps; g.shadowOffsetX = (o.sx == null ? 5 : o.sx) * ps; g.shadowOffsetY = (o.sy == null ? 9 : o.sy) * ps; }
    path(g); g.fillStyle = fs(); g.fill(); g.restore();
    if (o.grain !== 0) { g.save(); path(g); g.clip(); g.globalAlpha = o.grain || 1; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(b[0] - pad, b[1] - pad, w, h); g.restore(); }
    if (o.extra) { g.save(); if (!o.noclip) { path(g); g.clip(); } o.extra(g); g.restore(); }
    if (o.edge !== false) { g.save(); path(g); g.strokeStyle = o.edgeCol || 'rgba(255,247,228,.85)'; g.lineWidth = o.edge || 2.4; g.lineJoin = 'round'; g.stroke(); g.restore(); }
    if (o.after) { g.save(); o.after(g); g.restore(); }
    return { c: c, x0: b[0] - pad, y0: b[1] - pad, w: w, h: h };
  }
  function put(g, Pc, x, y, rot, sx, sy) {
    g.save(); g.translate(x || 0, y || 0); if (rot) g.rotate(rot); if (sx != null) g.scale(sx, sy == null ? sx : sy);
    g.drawImage(Pc.c, Pc.x0, Pc.y0, Pc.w, Pc.h); g.restore();
  }
  /* ink: text drawn, then speckled out, so it reads printed by a worn stamp or hand-lettered with a marker */
  function inkText(g, text, x, y, px, col, seed, o) {
    o = o || {};
    var m = mk(4, 4).getContext('2d'); cond(m, o.st); font(m, px, o.wt || 900); ls(m, o.ls || 0);
    var tw = m.measureText(text).width, cw = Math.ceil(tw + px), ch = Math.ceil(px * 1.5), c = mk(cw * 2, ch * 2), q = c.getContext('2d');
    q.scale(2, 2); cond(q, o.st); font(q, px, o.wt || 900); ls(q, o.ls || 0); q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillStyle = col;
    q.fillText(text, cw / 2, ch / 2 + px * .04); unst(q);
    var r = mulberry(seed || 7); q.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < cw * ch / (o.dense || 55); i++) { q.globalAlpha = .25 + r() * .7; q.beginPath(); q.arc(r() * cw, r() * ch, .35 + r() * (o.big || 1.4), 0, 6.283); q.fill(); }
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.drawImage(c, -cw / 2, -ch / 2, cw, ch); g.restore();
    return tw;
  }
  /* a jagged torn edge along x from 0 to w */
  function jag(seed, w, amp) { var r = mulberry(seed), p = []; for (var x = 0; x <= w; x += 7 + r() * 6) p.push([x, (amp || 6) * Math.sin(x * .07 + seed) + (r() - .5) * (amp || 6) * 1.6]); p.push([w, (r() - .5) * 6]); return p; }
  /* a torn newsprint strip carrying an exact quote (words wrapped to width); records its word boxes for the rail check */
  function buildStrip(text, w, px, seed, o) {
    o = o || {};
    var m = mk(4, 4).getContext('2d'); cond(m, 'condensed'); font(m, px, 800); ls(m, 0);
    var words = text.split(' '), lines = [''], maxw = w - 70;
    words.forEach(function (wd) { var L = lines.length - 1, tryL = lines[L] ? lines[L] + ' ' + wd : wd; if (m.measureText(tryL).width > maxw && lines[L]) lines.push(wd); else lines[L] = tryL; });
    var lh = px * 1.2, h = lines.length * lh + 64, top = jag(seed, w, 5), bot = jag(seed + 9, w, 5);
    function path(g) { g.beginPath(); g.moveTo(0, top[0][1]); top.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i][0], h + bot[i][1]); g.closePath(); }
    var rec = [];
    var pc = piece([0, -10, w, h + 10], path, NEWS, { sx: 6, sy: 12, blur: 16, extra: function (g) {
      /* faint newsprint ruling and a column line printed through the back */
      g.fillStyle = 'rgba(29,18,51,.05)'; for (var y = 18; y < h; y += 9) g.fillRect(0, y, w, 1);
      cond(g, 'condensed'); font(g, px, 800); ls(g, 0); g.fillStyle = INK; g.textBaseline = 'middle'; g.textAlign = 'left';
      lines.forEach(function (L, i) { var y = 32 + lh * (i + .5); g.fillText(L, 36, y); var mm = g.measureText(L); rec.push([36, y - px * .62, 36 + mm.width, y + px * .3, L]); });
      unst(g);
    }, edgeCol: 'rgba(255,253,245,.95)', edge: 2 });
    /* store word boxes relative to the canvas draw rect */
    pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; });
    pc.lines = lines; pc.sw = w; pc.sh = h;
    return pc;
  }
  /* draw a piece that carries words (so recBox sees them) */
  function putW(g, Pc, x, y, rot, s) {
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (s != null && s !== 1) g.scale(s, s);
    Pc.c.words = Pc.words || null; Pc.c.pw = Pc.w; Pc.c.ph = Pc.h;
    g.drawImage(Pc.c, Pc.x0, Pc.y0, Pc.w, Pc.h); Pc.c.words = null;
    g.restore();
  }
  function tape(g, x, y, w, h, rot) { g.save(); g.translate(x, y); g.rotate(rot || 0); g.fillStyle = 'rgba(255,250,232,.55)'; g.fillRect(-w / 2, -h / 2, w, h); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-w / 2, -h / 2, w, 4); g.restore(); }


  /* ---------- shapes ---------- */
  function rect(x0, y0, x1, y1) { return function (g) { g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); }; }
  function grad(y0, y1, stops) { return function (g) { var gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); return gr; }; }
  /* a printed card that carries words: lines = [[text, px, color, dy]] centred; bg color; returns a piece with word boxes */
  function cardPiece(w, h, bg, lines, o) {
    o = o || {}; var rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], o.path || function (g) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? 10 : o.r); }, bg, { sy: o.sy == null ? 9 : o.sy, blur: 12, extra: function (g) {
      if (o.before) o.before(g);
      if (o.ring) { g.strokeStyle = o.ring; g.lineWidth = 4; rr(g, -w / 2 + 9, -h / 2 + 9, w - 18, h - 18, 6); g.stroke(); }
      lines.forEach(function (L) { cond(g, L[4]); font(g, L[1], 900); ls(g, 1); g.fillStyle = L[2]; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(L[0], L[5] || 0, L[3]); var mm = g.measureText(L[0]); rec.push([(L[5] || 0) - mm.width / 2, L[3] - L[1] * .55, (L[5] || 0) + mm.width / 2, L[3] + L[1] * .45, L[0]]); unst(g); });
      if (o.after) o.after(g);
    } });
    pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; });
    return pc;
  }

  function wordsOf(pc, rec) { pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; }); return pc; }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  /* condensed sticker type (thick ink outline + drop shadow) */
  function stk(g, s, x, y, px, o) {
    o = o || {}; px = Math.max(36, px);
    g.save(); cond(g, o.st || 'condensed'); font(g, px, 900); ls(g, o.ls == null ? 1 : o.ls);
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
    var lw = o.lw == null ? Math.max(5, px * .13) : o.lw, ink = o.ink || INK;
    g.translate(x, y); if (o.rot) g.rotate(o.rot);
    if (o.shadow !== false) { g.lineWidth = lw; g.strokeStyle = ink; g.fillStyle = ink; g.strokeText(s, px * .05, px * .08); g.fillText(s, px * .05, px * .08); }
    if (lw) { g.lineWidth = lw; g.strokeStyle = ink; g.strokeText(s, 0, 0); }
    g.fillStyle = o.col || CREAM; g.fillText(s, 0, 0);
    var w = g.measureText(s).width; g.restore(); unst(g); return w;
  }
  function stkW(s, px, st) { var m = mk(4, 4).getContext('2d'); cond(m, st || 'condensed'); font(m, px, 900); ls(m, 1); var w = m.measureText(s).width; unst(m); return w; }
  /* slam: lands from big in 0.14 s with a small recoil; u = seconds since it started; o.out = seconds until it leaves */
  function slam(g, s, x, y, px, u, o) {
    if (u < 0) return; o = o || {};
    var k = eo(clamp(u / .14, 0, 1)), ok = o.out != null ? 1 - eio(seg(u, o.out, o.out + .2)) : 1; if (ok <= 0) return;
    var sc = (lerp(o.from || 1.45, 1, k) - .1 * Math.sin(Math.PI * seg(u, .12, .3))) * ok;
    g.save(); g.globalAlpha *= clamp(u / .05, 0, 1); g.translate(x, y); g.rotate((o.rot == null ? -.04 : o.rot) * (1 + (1 - k) * 3)); g.scale(sc, sc);
    var nr = NOREC; NOREC = nr || k < 1 || ok < 1; stk(g, s, 0, 0, px, o); NOREC = nr; g.restore();
  }
  function buildStamp(lines, px, maxw, col) {
    col = col || HOT;
    var m = mk(4, 4).getContext('2d'); cond(m); font(m, px, 900); ls(m, 2); var w1 = Math.max.apply(null, lines.map(function (L) { return m.measureText(L).width; })); unst(m);
    if (w1 > maxw) { px = Math.floor(px * maxw / w1); cond(m); font(m, px, 900); ls(m, 2); w1 = Math.max.apply(null, lines.map(function (L) { return m.measureText(L).width; })); unst(m); }
    var lh = px * 1.02, w = w1 + 56, h = lines.length * lh + 56, tp = jag(95, w, 4), bt = jag(96, w, 4), rec = [];
    var pc = piece([-w / 2, -h / 2 - 8, w / 2, h / 2 + 8], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + q[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(-w / 2 + bt[i][0], h / 2 + bt[i][1]); g.closePath(); }, NEWS, { sx: 6, sy: 12, blur: 16, extra: function (g) {
      var r = mulberry(91);
      g.strokeStyle = col; g.lineWidth = 9; g.strokeRect(-w / 2 + 12, -h / 2 + 14, w - 24, h - 28);
      lines.forEach(function (L, i) { var y = -h / 2 + 28 + lh * (i + .5); inkText(g, L, 0, y + 2, px, col, 93 + i, { dense: 26, big: 2.2, ls: 2 }); var lw = (function () { var q = mk(4, 4).getContext('2d'); cond(q); font(q, px, 900); ls(q, 2); var ww = q.measureText(L).width; unst(q); return ww; })(); rec.push([-lw / 2, y - px * .5, lw / 2, y + px * .45, L]); });
      g.globalCompositeOperation = 'destination-out';
      for (var i = 0; i < 520; i++) { g.globalAlpha = .2 + r() * .5; g.beginPath(); g.arc(-w / 2 + 16 + r() * (w - 32), -h / 2 + 14 + r() * (h - 28), .5 + r() * 1.8, 0, TAU); g.fill(); }
    } });
    wordsOf(pc, rec); pc.sw = w; pc.sh = h; return pc;
  }
  BODY.tear = .1; BODY.thock = .12; BODY.pop = .1; BODY.clank = .32; BODY.stamp = .18; BODY.swish = .26; BODY.skid = .18; BODY.buzz = .14; BODY.siren = .11; BODY.slap = .1; BODY.crawl = .15;


  /* =====================================================================================================
     THE SET: the paper courtroom. A navy felt desk top bleeds the whole frame (texture only outside the rail);
     every beat drops a new piece of paper onto the pile from above (folder, complaint, alley, the green statute
     book, the courthouse, the ruling page), covers lift off upward, and the oxblood rubber stamp is the native move.
     No likeness of anyone: Lohan and Lacey Jonas are typed names only; the loading screens are empty frames.
     ===================================================================================================== */
  var FELT = '#1c2a4c', MAN = '#e7c47e', MAN2 = '#d3a95e', MAN3 = '#b98c45', CRM = '#fbf5e6', LEG = '#fff6d8';
  var PINK = '#ff3d8b', OX = '#7e1d26', OXI = '#8f1f2b', GRN = '#2f6a42', GRN2 = '#244f33', GOLD = '#e2bd5c';
  var BRASS = '#d6a842', BRASS2 = '#f2d27a', BRASS3 = '#a87a26', WOOD = '#8a5228', WOOD2 = '#6a3c1b', VIO = '#4a3c9c';
  var RED2 = '#cf2a33', YEL = 'rgba(255,214,40,.55)', SKY = '#22355f', STONE = '#efe6d2', STONE2 = '#d8ccb2';
  var PADC = CRM, INK2 = '#1b2a4a';
  INK = '#16203a';
  var FX = 510, FY = 1010;              /* the folder's centre */
  var D = {};

  function stroke(g, col, w) { g.strokeStyle = col; g.lineWidth = w || 6; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
  /* text inside a piece: draws and records its box (piece coordinates) for the rail check */
  function ptxt(g, rec, s, x, y, px, col, o) {
    o = o || {}; cond(g, o.st || 'condensed'); font(g, px, o.wt || 900); ls(g, o.ls == null ? 1 : o.ls);
    if (o.max) while (g.measureText(s).width > o.max && px > 36) { px -= 2; font(g, px, o.wt || 900); }
    g.fillStyle = col; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y);
    var w = g.measureText(s).width, x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
    if (rec) rec.push([x0, y - px * .55, x0 + w, y + px * .45, s]); unst(g); return w;
  }
  function tw(s, px, st) { var m = mk(4, 4).getContext('2d'); cond(m, st || 'condensed'); font(m, px, 900); ls(m, 1); var w = m.measureText(s).width; unst(m); return w; }
  /* "GTA 5" in Delta pink followed by ink type, centred on x */
  function ptxt2(g, rec, a, b, x, y, px, ca, cb, max) {
    if (max) while (tw(a + b, px) > max && px > 36) px -= 2;
    var wa = tw(a, px), wb = tw(b, px), x0 = x - (wa + wb) / 2;
    ptxt(g, null, a, x0, y, px, ca, { align: 'left' }); ptxt(g, null, b, x0 + wa, y, px, cb, { align: 'left' });
    if (rec) rec.push([x0, y - px * .55, x0 + wa + wb, y + px * .45, a + b]);
  }
  function rectP(w, h, r) { return function (g) { rr(g, -w / 2, -h / 2, w, h, r || 6); }; }
  function grainLines(g, x0, y0, x1, y1, col, step, seed) { var r = mulberry(seed || 5); g.strokeStyle = col; g.lineWidth = 1.4; for (var y = y0 + 6; y < y1; y += step) { g.beginPath(); g.moveTo(x0, y + r() * 3); for (var x = x0; x < x1; x += 40) g.lineTo(x, y + (r() - .5) * 3); g.stroke(); } }

  /* ---------- the manila folder ---------- */
  function buildFolder() {
    var w = 800, h = 820;
    D.fBack = piece([-w / 2, -h / 2 - 64, w / 2, h / 2], function (g) {
      g.beginPath(); g.moveTo(-w / 2, -h / 2 + 10); g.lineTo(-w / 2 + 12, -h / 2 - 50); g.quadraticCurveTo(-w / 2 + 16, -h / 2 - 62, -w / 2 + 30, -h / 2 - 62);
      g.lineTo(-90, -h / 2 - 62); g.quadraticCurveTo(-74, -h / 2 - 62, -68, -h / 2 - 50); g.lineTo(-56, -h / 2); g.lineTo(w / 2 - 12, -h / 2); g.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + 12); g.lineTo(w / 2, h / 2 - 10); g.quadraticCurveTo(w / 2, h / 2, w / 2 - 10, h / 2); g.lineTo(-w / 2 + 10, h / 2); g.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - 10); g.closePath();
    }, MAN2, { sy: 14, blur: 22, sc: 'rgba(4,8,22,.55)', extra: function (g) { g.fillStyle = 'rgba(120,80,20,.12)'; g.fillRect(-w / 2, -h / 2 - 70, w, 60); } });
    /* the cover: same sheet, a crease line, a typed label plate */
    var rec = [];
    D.fCover = piece([-w / 2, -h / 2, w / 2, h / 2], rectP(w, h, 10), MAN, { sy: 6, blur: 10, sc: 'rgba(60,30,0,.35)', extra: function (g) {
      g.fillStyle = 'rgba(150,100,30,.18)'; g.fillRect(-w / 2, -h / 2 + 64, w, 4);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-w / 2, -h / 2 + 68, w, 3);
      /* the label plate */
      g.save(); g.shadowColor = 'rgba(80,50,10,.3)'; g.shadowBlur = 6; g.shadowOffsetY = 3; rr(g, -370, -250, 740, 420, 10); g.fillStyle = CRM; g.fill(); g.restore();
      rr(g, -352, -232, 704, 384, 6); stroke(g, 'rgba(22,32,58,.55)', 4);
      ptxt(g, rec, 'LOHAN', 0, -112, 200, INK, { ls: 3, max: 640 });
      ptxt2(g, rec, 'VS. ', 'GTA 5', 0, 70, 176, INK, PINK, 640);
    } });
    wordsOf(D.fCover, rec);
    /* the verdict sheet (inside) */
    function sheetP(fill) { return piece([-360, -380, 360, 380], rectP(720, 760, 4), LEG, { sy: 4, blur: 6, sc: 'rgba(80,50,10,.3)', extra: fill }); }
    var r2 = [];
    D.verdict = sheetP(function (g) {
      g.fillStyle = 'rgba(220,60,70,.45)'; g.fillRect(-300, -380, 3, 760); g.fillRect(-292, -380, 3, 760);
      g.fillStyle = 'rgba(60,110,200,.16)'; for (var y = -300; y < 380; y += 46) g.fillRect(-360, y, 720, 2);
      ptxt2(g, r2, 'LOHAN VS. ', 'GTA 5', 20, -316, 84, INK, PINK, 540);
      ptxt(g, r2, 'THE VERDICT:', 20, -236, 50, '#4a5674', { ls: 4 });
      [-100, 80].forEach(function (y, i) {
        rr(g, -250, y - 62, 124, 124, 10); g.fillStyle = '#fffdf3'; g.fill(); stroke(g, INK, 9);
        ptxt(g, r2, i ? 'LOST' : 'WON', -88, y + 4, 132, INK, { align: 'left', ls: 3, max: 400 });
      });
    });
    wordsOf(D.verdict, r2);
    var r3 = [];
    D.endSheet = sheetP(function (g) {
      g.fillStyle = 'rgba(220,60,70,.45)'; g.fillRect(-300, -380, 3, 760); g.fillRect(-292, -380, 3, 760);
      g.fillStyle = 'rgba(60,110,200,.16)'; for (var y = -300; y < 380; y += 46) g.fillRect(-360, y, 720, 2);
      ptxt(g, r3, 'FAIR RULING?', 20, -290, 108, INK, { ls: 2, max: 540 });
      ptxt(g, r3, 'YOUR VOTE:', 20, -186, 50, '#4a5674', { ls: 4 });
      [-40, 160].forEach(function (y, i) {
        rr(g, -250, y - 62, 124, 124, 10); g.fillStyle = '#fffdf3'; g.fill(); stroke(g, INK, 9);
        ptxt(g, r3, i ? 'NO' : 'YES', -88, y + 4, 132, INK, { align: 'left', ls: 3 });
      });
    });
    wordsOf(D.endSheet, r3);
    /* the sound block the gavel strikes (rides on the cover) */
    D.block = piece([-104, -60, 104, 60], function (g) { g.beginPath(); g.ellipse(0, -14, 100, 38, 0, 0, TAU); g.rect(-100, -14, 200, 40); g.ellipse(0, 26, 100, 38, 0, 0, TAU); }, WOOD2, { sy: 10, blur: 10, sc: 'rgba(30,15,0,.45)', grain: .4, extra: function (g) { g.beginPath(); g.ellipse(0, -14, 100, 38, 0, 0, TAU); g.fillStyle = WOOD; g.fill(); g.beginPath(); g.ellipse(0, -14, 64, 22, 0, 0, TAU); stroke(g, 'rgba(255,220,170,.25)', 3); g.beginPath(); g.ellipse(0, -14, 34, 11, 0, 0, TAU); stroke(g, 'rgba(255,220,170,.2)', 3); }, edge: 1.5 });
  }

  /* ---------- the brass gavel: (x, y) is the head's centre, ang the direction the handle points ---------- */
  function gavel(g, x, y, ang) {
    g.save(); g.translate(x, y); g.rotate(ang + Math.PI / 2); g.scale(.88, .88);
    for (var pass = 0; pass < 2; pass++) {
      g.save();
      if (!pass) { g.translate(10, 22); g.globalAlpha *= .35; }
      var sh = !pass;
      rr(g, -17, -420, 34, 380, 15); g.fillStyle = sh ? '#000' : WOOD; g.fill();
      g.beginPath(); g.ellipse(0, -424, 30, 22, 0, 0, TAU); g.fillStyle = sh ? '#000' : WOOD2; g.fill();
      if (!sh) { g.fillStyle = 'rgba(255,220,170,.22)'; g.fillRect(-9, -400, 5, 340); g.fillStyle = BRASS; g.fillRect(-19, -70, 38, 16); }
      rr(g, -126, -54, 252, 108, 24); g.fillStyle = sh ? '#000' : BRASS; g.fill();
      if (!sh) {
        g.save(); rr(g, -126, -54, 252, 108, 24); g.clip();
        g.fillStyle = BRASS2; g.fillRect(-126, -54, 252, 30); g.fillStyle = BRASS3; g.fillRect(-126, 30, 252, 24);
        g.fillStyle = WOOD2; g.fillRect(-92, -54, 18, 108); g.fillRect(74, -54, 18, 108);
        g.restore();
        rr(g, -126, -54, 252, 108, 24); stroke(g, 'rgba(255,240,200,.7)', 2.5);
      }
      g.restore();
    }
    g.restore();
  }
  /* ---------- a yellow pencil: tip at (x, y), body along ang ---------- */
  function pencil(g, x, y, ang) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.save(); g.translate(8, 16); g.globalAlpha *= .3; g.beginPath(); g.moveTo(0, 0); g.lineTo(70, -18); g.lineTo(440, -18); g.lineTo(440, 18); g.lineTo(70, 18); g.closePath(); g.fillStyle = '#000'; g.fill(); g.restore();
    g.beginPath(); g.moveTo(0, 0); g.lineTo(70, -18); g.lineTo(70, 18); g.closePath(); g.fillStyle = '#ecc996'; g.fill();
    g.beginPath(); g.moveTo(0, 0); g.lineTo(22, -6); g.lineTo(22, 6); g.closePath(); g.fillStyle = '#2b2b30'; g.fill();
    g.fillStyle = '#f3c227'; g.fillRect(70, -18, 300, 36); g.fillStyle = '#d9a514'; g.fillRect(70, 6, 300, 12); g.fillStyle = '#ffe07a'; g.fillRect(70, -18, 300, 8);
    g.fillStyle = '#b9bcc4'; g.fillRect(370, -19, 34, 38); g.fillStyle = '#8f939c'; g.fillRect(378, -19, 4, 38); g.fillRect(392, -19, 4, 38);
    rr(g, 404, -18, 40, 36, 8); g.fillStyle = '#f2899b'; g.fill();
    g.restore();
  }

  /* ---------- pieces for the beats ---------- */
  function datePiece(top, main, w, band) {
    w = w || 330; var h = 200, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], rectP(w, h, 8), CRM, { sy: 10, blur: 14, extra: function (g) {
      g.fillStyle = band || RED2; g.fillRect(-w / 2, -h / 2, w, 46);
      [-w / 4, w / 4].forEach(function (x) { g.beginPath(); g.arc(x, -h / 2 + 23, 8, 0, TAU); g.fillStyle = '#2a1416'; g.fill(); });
      ptxt(g, rec, top, 0, -h / 2 + 76, 40, '#3b4566', { ls: 4 });
      ptxt(g, rec, main, 0, 46, 96, INK, { ls: 2 });
    } });
    return wordsOf(pc, rec);
  }
  function chipPiece(lines, w, bg, fg, o) {
    o = o || {}; var lh = o.lh || 64, h = (o.pad || 34) + lines.length * lh, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], rectP(w, h, 8), bg, { sy: 8, blur: 10, extra: function (g) {
      if (o.ring) { rr(g, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 5); stroke(g, o.ring, 3); }
      lines.forEach(function (L, i) { ptxt(g, rec, L[0], 0, -h / 2 + (o.pad || 34) / 2 + lh * (i + .5) + 2, L[1], L[2] || fg, { ls: L[3] == null ? 1.5 : L[3], max: w - 36 }); });
    } });
    return wordsOf(pc, rec);
  }
  /* a rubber-stamp imprint: bled ink in a double border */
  function stampPiece(lines, col, w) {
    var lh = lines.map(function (L) { return L[1] * 1.08; }), h = lh.reduce(function (a, b) { return a + b; }, 0) + 70, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { g.beginPath(); g.rect(-w / 2, -h / 2, w, h); }, 'rgba(0,0,0,0)', { shadow: false, grain: 0, edge: false, noclip: true, extra: function (g) {
      g.strokeStyle = col; g.lineWidth = 11; g.strokeRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16); g.lineWidth = 4; g.strokeRect(-w / 2 + 24, -h / 2 + 24, w - 48, h - 48);
      var y = -h / 2 + 35;
      lines.forEach(function (L, i) { y += lh[i] / 2; var ww = inkText(g, L[0], 0, y + 2, L[1], col, 93 + i * 7, { dense: 24, big: 2.2, ls: 3 }); rec.push([-ww / 2, y - L[1] * .5, ww / 2, y + L[1] * .45, L[0]]); y += lh[i] / 2; });
      var r = mulberry(91); g.globalCompositeOperation = 'destination-out';
      for (var i = 0; i < 700; i++) { g.globalAlpha = .2 + r() * .55; g.beginPath(); g.arc(-w / 2 + r() * w, -h / 2 + r() * h, .5 + r() * 2.2, 0, TAU); g.fill(); }
    } });
    pc.sw = w; pc.sh = h; return wordsOf(pc, rec);
  }
  function buildBeats() {
    /* y2014: the re-created complaint, already date-stamped by the clerk */
    var rc = [];
    D.complaint = piece([-350, -360, 350, 360], rectP(700, 720, 4), CRM, { sy: 12, blur: 18, extra: function (g) {
      g.fillStyle = 'rgba(220,60,70,.4)'; g.fillRect(-282, -360, 3, 720); g.fillRect(-274, -360, 3, 720);
      ptxt(g, rc, 'COMPLAINT', 20, -290, 100, INK, { ls: 6, max: 580 });
      ptxt(g, rc, 'LOHAN v. TAKE-TWO', 20, -200, 54, '#33405f', { ls: 2 });
      ptxt(g, rc, 'AND ROCKSTAR GAMES', 20, -148, 44, '#33405f', { ls: 2 });
      g.fillStyle = 'rgba(22,32,58,.4)'; g.fillRect(-230, -110, 500, 3);
      ptxt2(g, rc, 'CLAIM: A ', 'GTA 5', 20, -40, 62, INK, PINK);
      ptxt(g, rc, 'CHARACTER IS HER', 20, 26, 62, INK, {});
      ptxt(g, rc, '“LOOK-A-LIKE”', 20, 132, 118, INK, { ls: 2, max: 580 });
    } });
    wordsOf(D.complaint, rc);
    D.filed = stampPiece([['FILED · MANHATTAN', 50], ['JUL 2 2014', 50]], VIO, 470);
    D.jul = datePiece('JULY', '2014');
    D.claim = chipPiece([['HER CLAIM', 60, CRM, 3]], 290, INK, CRM);
    D.rec1 = chipPiece([['RE-CREATED', 38, CRM, 3]], 250, '#3b4566', CRM, { lh: 46, pad: 24 });
    /* lacey: a dark paper alley, a typed name card, flashes */
    D.alley = piece([-390, -400, 390, 400], rectP(780, 800, 6), '#2a2340', { sy: 14, blur: 20, sc: 'rgba(0,0,10,.55)', extra: function (g) {
      g.fillStyle = '#231d36'; for (var y = -400; y < 400; y += 44) for (var x = -390 + ((y / 44) & 1) * 50; x < 390; x += 100) { rr(g, x + 4, y + 4, 92, 36, 3); g.fill(); }
      g.beginPath(); g.moveTo(-390, -400); g.lineTo(-250, -260); g.lineTo(-250, 300); g.lineTo(-390, 400); g.closePath(); g.fillStyle = '#1a1529'; g.fill();
      g.beginPath(); g.moveTo(390, -400); g.lineTo(250, -260); g.lineTo(250, 300); g.lineTo(390, 400); g.closePath(); g.fillStyle = '#1a1529'; g.fill();
      g.beginPath(); g.moveTo(-250, 300); g.lineTo(250, 300); g.lineTo(390, 400); g.lineTo(-390, 400); g.closePath(); g.fillStyle = '#3a3150'; g.fill();
    } });
    var rl = [];
    D.name = piece([-310, -130, 310, 130], rectP(620, 260, 8), CRM, { sy: 10, blur: 14, extra: function (g) {
      ptxt(g, rl, 'LACEY JONAS', 0, -38, 118, INK, { ls: 3, max: 560 });
      ptxt2(g, rl, 'GTA 5', ' CHARACTER', 0, 70, 56, PINK, '#33405f');
    } });
    wordsOf(D.name, rl);
    D.actress = buildStrip('“ACTRESS SLASH SINGER”', 560, 54, 61);
    D.lsFrame = (function () { var rec = []; var pc = piece([-170, -105, 170, 105], rectP(340, 210, 6), '#3a3150', { sy: 10, blur: 12, extra: function (g) {
      rr(g, -150, -85, 300, 170, 4); g.fillStyle = '#16122a'; g.fill(); g.save(); g.setLineDash([14, 10]); rr(g, -136, -72, 272, 144, 4); stroke(g, 'rgba(251,245,230,.55)', 3); g.restore();
      ptxt(g, rec, 'LOADING SCREEN', 0, -24, 40, CRM, { ls: 2 }); ptxt(g, rec, 'ART NOT SHOWN', 0, 30, 40, '#f2b84b', { ls: 2 });
    }, edgeCol: 'rgba(242,184,75,.9)', edge: 4 }); return wordsOf(pc, rec); })();
    D.cited = chipPiece([['+ 2 LOADING SCREENS SHE CITED', 42, INK, 2]], 640, '#f2b84b', INK, { lh: 50, pad: 22 });
    /* law: the green statute book and its first page */
    var rb = [];
    D.bookBase = piece([-320, -380, 320, 380], rectP(640, 760, 10), GRN2, { sy: 16, blur: 22, sc: 'rgba(0,6,0,.55)', extra: function (g) {
      g.fillStyle = '#efe5cc'; g.fillRect(-300, -364, 600, 732);
      g.fillStyle = 'rgba(80,60,20,.12)'; for (var x = 286; x < 300; x += 3) g.fillRect(x, -364, 1, 732);
    } });
    var rp = [];
    D.page51 = piece([-290, -354, 290, 354], rectP(580, 708, 3), '#fbf3dc', { sy: 3, blur: 4, sc: 'rgba(60,40,0,.25)', extra: function (g) {
      ptxt(g, rp, 'CIVIL RIGHTS LAW § 51', 0, -300, 48, INK, { ls: 2 });
      g.fillStyle = 'rgba(22,32,58,.35)'; g.fillRect(-240, -262, 480, 3);
    } });
    wordsOf(D.page51, rp);
    D.bookCover = piece([-320, -380, 320, 380], rectP(640, 760, 10), GRN, { sy: 4, blur: 8, sc: 'rgba(0,10,0,.35)', extra: function (g) {
      g.fillStyle = GRN2; g.fillRect(-320, -380, 70, 760);
      g.fillStyle = GOLD; [-300, -240, 240, 300].forEach(function (y) { g.fillRect(-316, y, 62, 6); });
      g.strokeStyle = GOLD; g.lineWidth = 4; g.strokeRect(-218, -336, 500, 672); g.lineWidth = 2; g.strokeRect(-204, -322, 472, 644);
      ptxt(g, rb, 'N.Y.', 32, -222, 68, GOLD, { ls: 6 });
      ptxt(g, rb, 'CIVIL RIGHTS', 32, -138, 78, GOLD, { ls: 3 });
      ptxt(g, rb, 'LAW', 32, -62, 78, GOLD, { ls: 6 });
      ptxt(g, rb, '§ 51', 32, 118, 210, GOLD, { ls: 2 });
      g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(-250, -380, 40, 760);
    }, edgeCol: 'rgba(226,189,92,.5)' });
    wordsOf(D.bookCover, rb);
    D.y1903 = datePiece('ENACTED', '1903', 300, GRN);
    D.consent = (function () { var rec = []; var pc = piece([-370, -50, 370, 50], rectP(740, 100, 3), RED2, { sy: 8, blur: 10, extra: function (g) { ptxt(g, rec, 'WITHOUT WRITTEN CONSENT', 0, 3, 60, CRM, { ls: 3, max: 690 }); } }); return wordsOf(pc, rec); })();
    D.sue = (function () { var rec = []; var pc = piece([-300, -95, 300, 95], rectP(600, 190, 6), CRM, { sy: 12, blur: 16, extra: function (g) {
      g.fillStyle = '#3b6fb6'; g.fillRect(-300, -95, 600, 30);
      ptxt(g, rec, 'YOU CAN SUE', 0, 22, 128, INK, { ls: 3, max: 540 });
    } }); return wordsOf(pc, rec); })();
    /* y2018: the courthouse, in cut paper on a night-blue sheet */
    D.sky = piece([-440, -580, 440, 580], rectP(880, 1160, 6), SKY, { sy: 14, blur: 20, sc: 'rgba(0,0,10,.5)', extra: function (g) {
      var r = mulberry(17); g.fillStyle = 'rgba(251,245,230,.55)'; for (var i = 0; i < 46; i++) { g.beginPath(); g.arc(-420 + r() * 840, -560 + r() * 420, 1.5 + r() * 2.8, 0, TAU); g.fill(); }
      g.beginPath(); g.arc(300, -330, 54, 0, TAU); g.fillStyle = '#f3ead2'; g.fill(); g.beginPath(); g.arc(322, -342, 48, 0, TAU); g.fillStyle = SKY; g.fill();
      g.fillStyle = '#16244a'; [[-440, 40, 120, 320], [-300, 120, 90, 240], [330, 60, 110, 300], [220, 150, 80, 210]].forEach(function (b) { g.fillRect(b[0], b[1], b[2], b[3]); });
      g.fillStyle = 'rgba(242,184,75,.35)'; for (var j = 0; j < 14; j++) g.fillRect(-420 + (j % 4) * 26 + (j > 7 ? 760 : 0), 70 + Math.floor(j / 4) * 46, 12, 18);
      g.fillStyle = '#1a2a4c'; g.fillRect(-440, 440, 880, 140);
    } });
    var rcp = [];
    D.ped = piece([-350, -150, 350, 80], function (g) { g.beginPath(); g.moveTo(-350, 0); g.lineTo(0, -150); g.lineTo(350, 0); g.lineTo(350, 80); g.lineTo(-350, 80); g.closePath(); }, STONE, { sy: 8, blur: 10, extra: function (g) {
      g.beginPath(); g.moveTo(-290, -10); g.lineTo(0, -128); g.lineTo(290, -10); g.closePath(); stroke(g, STONE2, 5);
      g.fillStyle = STONE2; g.fillRect(-350, 0, 700, 6);
      ptxt(g, rcp, 'NY COURT OF APPEALS', 0, 42, 52, INK, { ls: 4, max: 600 });
    } });
    wordsOf(D.ped, rcp);
    D.col = piece([-34, -160, 34, 160], function (g) { g.beginPath(); g.rect(-34, -160, 68, 320); }, STONE, { sy: 6, blur: 8, extra: function (g) {
      g.fillStyle = STONE2; g.fillRect(-34, -160, 68, 22); g.fillRect(-34, 138, 68, 22); for (var x = -20; x <= 20; x += 13) g.fillRect(x, -134, 3, 268);
    } });
    D.steps = piece([-380, -50, 380, 50], function (g) { g.beginPath(); g.rect(-330, -50, 660, 30); g.rect(-355, -20, 710, 34); g.rect(-380, 14, 760, 36); }, STONE, { sy: 6, blur: 8, extra: function (g) { g.fillStyle = STONE2; g.fillRect(-380, -22, 760, 4); g.fillRect(-380, 12, 760, 4); } });
    D.mar = datePiece('MARCH 29', '2018', 320, '#3b6fb6');
    D.nopart = chipPiece([['TOOK NO PART', 40, CRM, 2]], 270, '#3a3550', CRM, { lh: 46, pad: 16, ring: 'rgba(251,245,230,.4)' });
    /* nother / generic */
    var rn = [];
    D.nameBig = piece([-340, -150, 340, 150], rectP(680, 300, 8), CRM, { sy: 12, blur: 16, extra: function (g) {
      ptxt(g, rn, 'LACEY JONAS', 0, -42, 134, INK, { ls: 3, max: 620 });
      ptxt2(g, rn, 'GTA 5', ' CHARACTER', 0, 82, 60, PINK, '#33405f');
    } });
    wordsOf(D.nameBig, rn);
    (function () { var wa = tw('GTA 5', 60), wb = tw(' CHARACTER', 60), cx = -(wa + wb) / 2 + wa / 2; D.gtaTile = -1; void cx; })();
    D.notrec = chipPiece([['THE COURT:', 46, '#c9cfe0', 4], ['“NOT RECOGNIZABLE”', 76, CRM, 2]], 680, INK, CRM, { lh: 74, pad: 30 });
    D.generic = buildStrip('“…A GENERIC … ‘TWENTY SOMETHING’ WOMAN…”', 760, 56, 71);
    D.coa = chipPiece([['NY COURT OF APPEALS · 2018', 40, CRM, 2]], 540, '#3b4566', CRM, { lh: 50, pad: 22 });
    /* vote: the stamp */
    D.dismissed = stampPiece([['DISMISSED', 150], ['AFFIRMED 6-0 · 2018', 54]], OXI, 700);
    /* twist / payoff: the re-created ruling page, the gilt frame */
    var rr0 = [];
    D.ruling = piece([-360, -220, 360, 220], rectP(720, 440, 4), CRM, { sy: 12, blur: 18, extra: function (g) {
      ptxt(g, rr0, 'LOHAN v. TAKE-TWO', -110, -164, 60, INK, { ls: 3, max: 440 });
      ptxt(g, rr0, 'COURT OF APPEALS', 0, -108, 40, '#33405f', { ls: 3, max: 660 });
      g.fillStyle = 'rgba(22,32,58,.4)'; g.fillRect(-300, -82, 600, 3);
      ptxt(g, rr0, '“…AN AVATAR …', 0, -30, 66, INK, { ls: 2 });
      ptxt(g, rr0, 'MAY CONSTITUTE', 0, 42, 66, INK, { ls: 2 });
      cond(g, 'condensed'); font(g, 66, 900); ls(g, 2); var wa = g.measureText('A ‘PORTRAIT’').width, wb = g.measureText('…”').width; unst(g);
      ptxt(g, rr0, 'A ‘PORTRAIT’', -(wa + wb) / 2, 114, 66, INK, { ls: 2, align: 'left' });
      ptxt(g, rr0, '…”', -(wa + wb) / 2 + wa, 114, 66, INK, { ls: 2, align: 'left' });
    } });
    D.rulingBox = {}; rr0.forEach(function (b) { D.rulingBox[b[4]] = b.slice(0, 4); });
    wordsOf(D.ruling, rr0);
    D.rec2 = chipPiece([['RE-CREATED', 38, CRM, 3]], 250, '#3b4566', CRM, { lh: 46, pad: 24 });
    var rg = [];
    D.gilt = piece([-380, -230, 380, 230], function (g) { g.beginPath(); g.rect(-380, -230, 760, 460); g.rect(306, -180, -612, 270); }, BRASS, { sy: 16, blur: 22, sc: 'rgba(10,6,0,.55)', extra: function (g) {
      g.fillStyle = BRASS2; g.fillRect(-380, -230, 760, 22); g.fillRect(-380, -230, 22, 460);
      g.fillStyle = BRASS3; g.fillRect(-380, 208, 760, 22); g.fillRect(358, -230, 22, 460);
      g.strokeStyle = '#8a6118'; g.lineWidth = 5; g.strokeRect(-350, -206, 700, 418); g.strokeRect(-322, -194, 644, 298);
      for (var i = 0; i < 22; i++) { var a = (i + .5) / 22; [[-380 + 760 * a, -218]].concat(i < 14 ? [[-368, -230 + 460 * (i + .5) / 14], [368, -230 + 460 * (i + .5) / 14]] : []).forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 5, 0, TAU); g.fillStyle = i % 2 ? BRASS2 : '#b98a2c'; g.fill(); }); }
      [[-350, -206], [350, -206], [-350, 212], [350, 212]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 20, 0, TAU); g.fillStyle = BRASS2; g.fill(); stroke(g, '#8a6118', 4); });
      /* the brass plate on the bottom rail */
      rr(g, -300, 102, 600, 114, 6); g.fillStyle = '#f6dc92'; g.fill(); stroke(g, '#8a6118', 3);
      ptxt(g, rg, 'CAN BE A “PORTRAIT”', 0, 136, 46, INK, { ls: 2, max: 560 });
      ptxt(g, rg, 'IF RECOGNIZABLE · NEW YORK LAW', 0, 186, 38, '#5a3d10', { ls: 2, max: 560 });
    }, edgeCol: 'rgba(255,240,190,.8)' });
    wordsOf(D.gilt, rg);
    /* gta6: the calendar pad */
    D.calBack = piece([-300, -330, 300, 330], rectP(600, 660, 8), '#3a3550', { sy: 14, blur: 20, extra: function (g) { g.fillStyle = RED2; g.fillRect(-300, -330, 600, 70); [-180, -60, 60, 180].forEach(function (x) { g.beginPath(); g.arc(x, -295, 12, 0, TAU); g.fillStyle = '#2a1416'; g.fill(); }); } });
    D.calPage = (function () { var rec = []; var pc = piece([-280, -270, 280, 270], rectP(560, 540, 4), CRM, { sy: 4, blur: 6, sc: 'rgba(0,0,0,.25)', extra: function (g) {
      ptxt(g, rec, 'NOVEMBER', 0, -190, 76, RED2, { ls: 6 }); ptxt(g, rec, '19', 0, 20, 330, INK, { ls: 2 }); ptxt(g, rec, '2026', 0, 210, 76, INK, { ls: 8 });
    } }); return wordsOf(pc, rec); })();
    D.gta6 = chipPiece([['GTA 6', 92, CRM, 3]], 290, PINK, CRM, { lh: 92, pad: 28 });
    D.rsurl = chipPiece([['ROCKSTAR GAMES', 44, CRM, 2]], 470, INK, CRM, { lh: 54, pad: 22 });
    D.pile = buildPile();
    D.desk = buildDesk();
  }
  /* the evidence pile: each beat's paper, seen from its blank back edge, slides in at the bottom of the desk when the
     beat leaves, and the pile is cleared during the end card (frame 0 has none). No type: the platform covers y 1450-1750. */
  function buildPile() {
    function ruled(w, h, col, line, margin) { return function (g) { g.fillStyle = line; for (var y = -h / 2 + 50; y < h / 2; y += 34) g.fillRect(-w / 2, y, w, 2); if (margin) { g.fillStyle = margin; g.fillRect(-w / 2 + 64, -h / 2, 3, h); } }; }
    function bars(w, seed, col) { return function (g) { var r = mulberry(seed); g.fillStyle = col; for (var i = 0; i < 6; i++) { var y = -110 + i * 34, L = 120 + r() * (w - 260); g.fillRect(-w / 2 + 90, y, L, 12); } }; }
    var P = [];
    P.push({ key: 'aly', x: 330, top: 1488, rot: -.06, pc: piece([-320, -210, 320, 210], rectP(640, 420, 4), CRM, { sy: -6, blur: 14, sc: 'rgba(4,8,22,.5)', extra: function (g) { ruled(640, 420, CRM, 'rgba(60,110,200,.14)', 'rgba(220,60,70,.4)')(g); bars(640, 3, 'rgba(22,32,58,.18)')(g); } }) });
    P.push({ key: 'book', x: 770, top: 1520, rot: .055, pc: piece([-290, -200, 290, 200], rectP(580, 400, 6), '#2a2340', { sy: -6, blur: 14, extra: function (g) { g.fillStyle = '#231d36'; for (var y = -200; y < 200; y += 44) for (var x = -290 + ((y / 44) & 1) * 50; x < 290; x += 100) { rr(g, x + 4, y + 4, 92, 36, 3); g.fill(); } } }) });
    P.push({ key: 'court', x: 560, top: 1470, rot: -.025, pc: piece([-270, -200, 270, 200], rectP(540, 400, 10), GRN, { sy: -6, blur: 14, sc: 'rgba(0,6,0,.5)', extra: function (g) { g.fillStyle = GRN2; g.fillRect(-270, -200, 60, 400); g.fillStyle = GOLD; [-170, -130].forEach(function (y) { g.fillRect(-266, y, 52, 6); }); g.strokeStyle = GOLD; g.lineWidth = 3; g.strokeRect(-180, -170, 420, 340); } }) });
    P.push({ key: 'nc', x: 290, top: 1540, rot: .07, pc: piece([-280, -190, 280, 190], rectP(560, 380, 6), SKY, { sy: -6, blur: 14, extra: function (g) { var r = mulberry(5); g.fillStyle = 'rgba(251,245,230,.5)'; for (var i = 0; i < 18; i++) { g.beginPath(); g.arc(-270 + r() * 540, -180 + r() * 200, 1.5 + r() * 2.5, 0, TAU); g.fill(); } g.fillStyle = STONE; g.beginPath(); g.moveTo(-200, -40); g.lineTo(0, -120); g.lineTo(200, -40); g.closePath(); g.fill(); for (var c = 0; c < 5; c++) g.fillRect(-180 + c * 85, -30, 40, 220); } }) });
    P.push({ key: 'f2', x: 800, top: 1505, rot: -.08, pc: piece([-220, -150, 220, 150], rectP(440, 300, 8), CRM, { sy: -6, blur: 14, extra: function (g) { g.fillStyle = 'rgba(22,32,58,.16)'; g.fillRect(-160, -90, 320, 30); g.fillStyle = 'rgba(255,61,139,.35)'; g.fillRect(-120, -30, 90, 18); } }) });
    P.push({ key: 'cal', x: 520, top: 1560, rot: .035, pc: piece([-230, -190, 230, 190], rectP(460, 380, 4), BRASS, { sy: -6, blur: 14, sc: 'rgba(10,6,0,.5)', extra: function (g) { g.fillStyle = BRASS2; g.fillRect(-230, -190, 460, 20); g.strokeStyle = '#8a6118'; g.lineWidth = 4; g.strokeRect(-200, -160, 400, 320); g.fillStyle = '#16122a'; g.fillRect(-170, -130, 340, 260); } }) });
    return P;
  }
  function buildDesk() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(12);
    /* walnut desk top */
    g.fillStyle = '#3b2617'; g.fillRect(0, 0, W, H);
    for (var pl = 0; pl < 7; pl++) { var x0 = pl * 170 - 40; g.fillStyle = pl % 2 ? 'rgba(255,200,140,.035)' : 'rgba(0,0,0,.08)'; g.fillRect(x0, 0, 170, H); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0, 0, 2, H); }
    g.save(); g.rotate(Math.PI / 2); grainLines(g, 0, -W, H, 0, 'rgba(20,10,4,.22)', 13, 31); g.restore();
    /* the felt blotter in its leather frame */
    g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 26; g.shadowOffsetY = 10; rr(g, 28, 168, 1024, 1650, 18); g.fillStyle = FELT; g.fill(); g.restore();
    g.save(); rr(g, 28, 168, 1024, 1650, 18); g.clip();
    for (var i = 0; i < 14000; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,' + (.025 + r() * .045).toFixed(3) + ')' : 'rgba(0,0,20,' + (.06 + r() * .09).toFixed(3) + ')'; var x = r() * W, y = r() * H, a = r() * 6.28, L = 3 + r() * 9; g.save(); g.translate(x, y); g.rotate(a); g.fillRect(0, 0, L, 1.1); g.restore(); }
    g.globalAlpha = .35; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    /* leather corners */
    g.fillStyle = '#5a2a20'; [[28, 168, 1, 1], [1052, 168, -1, 1], [28, 1818, 1, -1], [1052, 1818, -1, -1]].forEach(function (k) { g.beginPath(); g.moveTo(k[0], k[1]); g.lineTo(k[0] + 190 * k[2], k[1]); g.lineTo(k[0], k[1] + 190 * k[3]); g.closePath(); g.fill(); });
    g.restore();
    g.save(); g.setLineDash([16, 11]); rr(g, 46, 186, 988, 1614, 12); stroke(g, 'rgba(226,189,92,.5)', 3); g.restore();
    rr(g, 28, 168, 1024, 1650, 18); stroke(g, 'rgba(0,0,0,.45)', 4);
    /* desk things around the edge (no type): a wooden ruler, two brass clips, the oxblood ink pad, a pen */
    g.save(); g.translate(310, 232); g.rotate(-.06); g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 10; g.shadowOffsetY = 6; rr(g, -260, -30, 520, 60, 4); g.fillStyle = '#d9b46a'; g.fill(); g.restore();
    g.fillStyle = 'rgba(80,50,10,.6)'; for (var tk = 0; tk < 52; tk++) g.fillRect(-250 + tk * 10, -30, 2, tk % 5 ? 12 : 22); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-260, -30, 520, 6); g.restore();
    [[820, 238, .3], [895, 262, -.2]].forEach(function (q) { g.save(); g.translate(q[0], q[1]); g.rotate(q[2]); g.strokeStyle = '#e2bd5c'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-34, 8); g.lineTo(26, 8); g.arc(26, 0, 8, Math.PI / 2, -Math.PI / 2, true); g.lineTo(-30, -8); g.arc(-30, 0, 8, -Math.PI / 2, Math.PI / 2, true); g.lineTo(14, 8); g.stroke(); g.restore(); });
    g.save(); g.translate(220, 1660); g.rotate(-.05); g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 14; g.shadowOffsetY = 8; rr(g, -150, -90, 300, 180, 14); g.fillStyle = '#2b2b33'; g.fill(); g.restore();
    rr(g, -126, -66, 252, 132, 8); g.fillStyle = OX; g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; for (var z = 0; z < 40; z++) g.fillRect(-120 + r() * 240, -60 + r() * 120, 3, 3); rr(g, -150, -90, 300, 180, 14); stroke(g, '#4a4a55', 4); g.restore();
    g.save(); g.translate(820, 1700); g.rotate(-.5); g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 10; g.shadowOffsetY = 6; rr(g, -190, -16, 380, 32, 16); g.fillStyle = '#17161c'; g.fill(); g.restore();
    g.fillStyle = BRASS; g.fillRect(40, -17, 18, 34); g.fillRect(-130, -20, 120, 6); g.beginPath(); g.moveTo(-190, 0); g.lineTo(-240, -6); g.lineTo(-240, 6); g.closePath(); g.fillStyle = BRASS2; g.fill(); g.restore();
    var gr = g.createRadialGradient(540, 980, 300, 540, 980, 1250); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(2,6,18,.55)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    return c;
  }
  function buildTextures() { GRAIN = buildGrain(); buildFolder(); buildBeats(); }

  /* =====================================================================================================
     MOVES
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  /* a piece of paper dropped onto the pile: falls from above the frame (ease-in) and lands at tl; at tout it is
     pulled out upward from under whatever covers it. body(g) draws in the piece's own coordinates. */
  function drop(g, x, y, rot, tl, tout, t, body, o) {
    o = o || {}; var fd = o.fd || .32; if (t < tl - fd) return false;
    var od = o.od || .42; if (tout != null && t > tout + od) return false;
    var k = seg(t, tl - fd, tl), fall = (1 - k * k) * (o.fall || 1350), ko = tout != null ? eio(seg(t, tout, tout + od)) : 0;
    var s = (o.s || 1) * (o.knock === false ? 1 : kn(t, tl, .018));
    var nr = NOREC; NOREC = nr || k < 1 || ko > 0;
    g.save(); g.translate(x + (o.dx || 0) * (1 - k) + (o.ox || 0) * ko, y - fall - 1700 * ko); g.rotate(rot + (1 - k) * (o.spin == null ? .03 : o.spin) + (o.ospin == null ? .04 : o.ospin) * ko); g.scale(s, s);
    body(g, k, ko); g.restore(); NOREC = nr; return true;
  }
  /* a cover lifted off upward (grows a little as it comes toward the camera) */
  function lift(g, x, y, rot, tl, t, body, o) {
    o = o || {}; var d = o.d || .45; if (t > tl + d) return;
    var k = eio(seg(t, tl, tl + d)), s = 1 + .015 * Math.sin(Math.PI * Math.min(1, k * 1.6));
    var nr = NOREC; NOREC = nr || k > 0;
    g.save(); g.translate(x + (o.dx || 0) * k, y - 1700 * k); g.rotate(rot + (o.r || -.14) * k); g.scale(s, s); body(g); g.restore(); NOREC = nr;
  }
  /* a label slammed on: lands from big in 0.14 s with a small recoil (no bounce); leaves upward at tout */
  function slapOn(g, pc, x, y, rot, tl, tout, t, o) {
    o = o || {}; if (t < tl - .02) return; var od = o.od || .35; if (tout != null && t > tout + od) return;
    var fmax = Math.max(1, Math.min(o.from || 1.5, 2 * Math.min(x - 100, 920 - x) / (pc.w - 72 + 30))), k = eo(seg(t, tl, tl + .14)), ko = tout != null ? eio(seg(t, tout, tout + od)) : 0, s = lerp(fmax, 1, k) * Math.min(kn(t, tl + .12, .04), fmax > 1.04 ? 1.04 : 1);
    var nr = NOREC; NOREC = nr || k < 1 || ko > 0;
    g.save(); g.globalAlpha *= fin(t, tl, .05); g.translate(x, y - 1600 * ko); g.rotate(rot * (1 + (1 - k) * 2) + .3 * ko); g.scale(s, s); putW(g, pc, 0, 0);
    if (o.tape) { g.save(); g.translate(0, -pc.h / 2 + 34); g.rotate(.05); g.fillStyle = 'rgba(239,217,154,.85)'; g.fillRect(-45, -13, 90, 26); g.restore(); }
    g.restore(); NOREC = nr;
  }
  function stripOn(g, pc, x, y, rot, tl, tout, t) {
    if (t < tl - .02) return; if (tout != null && t > tout + .4) return;
    var k = cd(t, tl, 15), ko = tout != null ? eio(seg(t, tout, tout + .38)) : 0;
    var nr = NOREC; NOREC = nr || k < .97 || ko > 0;
    g.save(); g.globalAlpha *= fin(t, tl, .06); g.translate(x, y + (1 - k) * 40 - 1600 * ko); g.rotate(rot + .3 * ko);
    putW(g, pc, -pc.sw / 2, -pc.sh / 2, 0, 1);
    g.save(); g.translate(-pc.sw / 2 + 60, -pc.sh / 2 + 2); g.rotate(-.2); g.fillStyle = 'rgba(239,217,154,.85)'; g.fillRect(-40, -12, 80, 24); g.restore();
    NOREC = nr; g.restore();
  }
  /* yellow highlighter swiped across a box in local coordinates */
  function hilite(g, x0, y0, x1, y1, k) { if (k <= 0) return; g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ffe14d'; g.beginPath(); var xe = lerp(x0, x1, k); g.moveTo(x0, y0 + 4); g.lineTo(xe, y0); g.lineTo(xe + 6, y1); g.lineTo(x0 - 4, y1 - 3); g.closePath(); g.fill(); g.restore(); }
  /* a hand-drawn tick, drawn on with k */
  function tickMark(g, x, y, k, col) {
    if (k <= 0) return; g.save(); g.strokeStyle = col; g.lineWidth = 22; g.lineCap = 'round'; g.lineJoin = 'round';
    var a = [x - 50, y - 4], b = [x - 12, y + 40], c = [x + 70, y - 70], L1 = 55, L2 = 140, L = (L1 + L2) * k;
    g.beginPath(); g.moveTo(a[0], a[1]); if (L <= L1) g.lineTo(lerp(a[0], b[0], L / L1), lerp(a[1], b[1], L / L1)); else { g.lineTo(b[0], b[1]); g.lineTo(lerp(b[0], c[0], (L - L1) / L2), lerp(b[1], c[1], (L - L1) / L2)); }
    g.stroke(); g.restore();
  }
  /* a camera flash: a flat white star with a cream ring, 0.3 s */
  function flash(g, x, y, u, s) {
    if (u < 0 || u > .34) return; var k = eo(seg(u, 0, .08)), f = 1 - seg(u, .1, .34), R = 120 * s * k;
    g.save(); g.globalAlpha *= f; g.translate(x, y); g.rotate(.3);
    g.beginPath(); for (var i = 0; i < 16; i++) { var a = i * TAU / 16, r = i % 2 ? R * .38 : R; g.lineTo(r * Math.cos(a), r * Math.sin(a)); } g.closePath(); g.fillStyle = '#fffdf2'; g.fill();
    g.beginPath(); g.arc(0, 0, R * 1.25, 0, TAU); g.strokeStyle = 'rgba(255,240,190,.7)'; g.lineWidth = 6; g.stroke();
    g.restore();
  }
  /* a lit or dark high-backed chair */
  function chair(g, x, y, lit, k) {
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -40, -64, 92, 140, 30); g.fill();
    rr(g, -46, -72, 92, 140, 34); g.fillStyle = lit ? lerpC('#3a3550', '#f2b84b', k) : '#3a3550'; g.fill();
    rr(g, -30, -56, 60, 70, 22); g.fillStyle = lit ? lerpC('#2c2842', '#ffd98a', k) : '#2c2842'; g.fill();
    g.fillStyle = lit ? lerpC('#2a2540', '#c98b2a', k) : '#2a2540'; g.fillRect(-50, 30, 100, 26);
    g.restore();
  }
  function lerpC(a, b, k) { var A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); function ch(s) { return Math.round(lerp(A >> s & 255, B >> s & 255, k)); } return 'rgb(' + ch(16) + ',' + ch(8) + ',' + ch(0) + ')'; }
  /* a brass magnifier: lens centre (x, y); inside it the card underneath, enlarged */
  function magnifier(g, x, y, inner) {
    var R = 150;
    g.save(); g.translate(x, y);
    g.save(); g.translate(14, 22); g.globalAlpha *= .3; g.beginPath(); g.arc(0, 0, R + 18, 0, TAU); g.fillStyle = '#000'; g.fill(); g.restore();
    g.save(); g.rotate(1.5708); rr(g, R + 6, -22, 230, 44, 18); g.fillStyle = WOOD; g.fill(); g.fillStyle = BRASS; g.fillRect(R + 6, -24, 30, 48); g.restore();
    g.save(); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip(); g.fillStyle = '#fffdf3'; g.fillRect(-R, -R, 2 * R, 2 * R); inner(g); g.fillStyle = 'rgba(200,230,255,.12)'; g.fillRect(-R, -R, 2 * R, 2 * R);
    g.beginPath(); g.ellipse(-60, -70, 50, 22, -.6, 0, TAU); g.fillStyle = 'rgba(255,255,255,.35)'; g.fill(); g.restore();
    g.beginPath(); g.arc(0, 0, R + 9, 0, TAU); g.strokeStyle = BRASS; g.lineWidth = 20; g.stroke();
    g.beginPath(); g.arc(0, 0, R + 9, -2.6, -1.2); g.strokeStyle = BRASS2; g.lineWidth = 7; g.stroke();
    g.restore();
  }
  /* the rubber stamp tool: comes down, contacts at tc, lifts away */
  function stampTool(g, x, y, rot, tc, t) {
    var dn = seg(t, tc - .2, tc), up = eio(seg(t, tc + .08, tc + .45)); if (t < tc - .2 || up >= 1) return;
    var dy = -1400 * (1 - dn * dn) - 1500 * up;
    g.save(); g.translate(x, y + dy); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, -340, -40, 700, 110, 16); g.fill();
    rr(g, -360, -10, 720, 56, 10); g.fillStyle = OX; g.fill();
    rr(g, -330, -120, 660, 116, 12); g.fillStyle = WOOD; g.fill(); g.fillStyle = 'rgba(255,220,170,.2)'; g.fillRect(-320, -112, 640, 14);
    rr(g, -60, -320, 120, 210, 40); g.fillStyle = WOOD2; g.fill(); g.beginPath(); g.ellipse(0, -330, 110, 70, 0, 0, TAU); g.fillStyle = WOOD; g.fill();
    g.restore();
  }
  /* pixel tiles: an 8 x 8 grid of plain colours (no figure), each tile flips in at its own time */
  var TILE = ['#ff3d8b', '#22355f', '#f2b84b', '#3b6fb6', '#e8d7b0', '#7e1d26', '#4fb39a', '#16203a', '#ffd23f', '#9b6fd6'];
  function tiles(g, t, t0, t1) {
    var nx = 9, ny = 7, s = 40, r = mulberry(33), cols = [];
    for (var i = 0; i < nx * ny; i++) cols.push(TILE[Math.floor(r() * TILE.length)]);
    g.fillStyle = '#16122a'; g.fillRect(-184, -174, 368, 308);
    for (var j = 0; j < ny; j++) for (var i2 = 0; i2 < nx; i2++) {
      var idx = j * nx + i2, ti = lerp(t0, t1, ((i2 + j) / (nx + ny - 2)) * .8 + hash(idx) * .2), k = eo(seg(t, ti, ti + .18));
      if (k <= 0) continue;
      var cx = -180 + (i2 + .5) * s, cy = -160 + (j + .5) * s;
      g.save(); g.translate(cx, cy); g.scale(1, k); g.fillStyle = cols[idx]; g.fillRect(-s / 2 + 2, -s / 2 + 2, s - 4, s - 4); g.restore();
    }
  }

  /* =====================================================================================================
     THE PROP LAYER (screen space, clipped to the rail). Beats in story order; later pieces land on top.
     ===================================================================================================== */
  var FLASH = [[300, 700, 1], [740, 690, .95], [290, 1050, .95], [740, 1040, 1], [520, 650, .92], [340, 1180, .92], [700, 1170, .95], [295, 870, .95], [735, 870, .92]];
  var AX = 525, NX = 470, BKX = 570, CALX = 560, GX = 510, GY = 700, RY = 1185;
  /* the hook gavel: hovers above the folder's top edge, strikes the block that rides on the cover (never over the label) */
  function gavHook(u) {
    var A0 = -.9, A1 = .95, x, y, a;
    if (u < A0) return null;
    var k = eio(seg(u, A0, A1)); x = 790; y = lerp(-320, 470, k); a = lerp(-2.45, -2.1, k);
    if (u > A1) y += 10 * Math.sin((u - A1) * 4.2);
    var s0 = T.gav1 - .5, s1 = T.gav1 - .12;
    if (u > s0) { var w = eio(seg(u, s0, s1)); y = lerp(y, 440, w); a = lerp(a, -2.25, w); }
    if (u > s1) { var st = seg(u, s1, T.gav1); st = st * st; x = lerp(790, 786, st); y = lerp(440, 584, st); a = lerp(-2.25, -1.55, st); }
    if (u > T.gav1) { var rb = eo(seg(u, T.gav1, T.gav1 + .4)); x = lerp(786, 790, rb); y = lerp(584, 470, rb) + 8 * Math.sin((u - T.gav1) * 3) * rb; a = lerp(-1.55, -2.0, rb); }
    var ex = eio(seg(u, T.lift + .04, T.lift + .5)); y -= 1700 * ex;
    return ex >= 1 ? null : [x, y, a];
  }
  /* the court gavel: comes down right of the columns, handle up and to the right, clear of the court's name */
  function gavCourt(t) {
    var g0 = T.gav2;
    if (t < g0 - .75 || t > T.nc + .5) return null;
    var k = eio(seg(t, g0 - .75, g0 - .2)), x = 820, y = lerp(-300, 975, k), a = lerp(-1.1, -1.0, k);
    if (t > g0 - .12) { var st = seg(t, g0 - .12, g0); st *= st; x = lerp(820, 806, st); y = lerp(975, 1062, st); a = lerp(-1.0, -1.45, st); }
    if (t > g0) { var rb = eo(seg(t, g0, g0 + .4)); x = lerp(806, 816, rb); y = lerp(1062, 990, rb); a = lerp(-1.45, -1.15, rb); }
    y -= 1700 * eio(seg(t, T.nc, T.nc + .45));
    return [x, y, a];
  }
  function folderBody(g, sheet, t, extra) { put(g, D.fBack, 0, 0); putW(g, sheet, 0, 20, .004); if (extra) extra(g); }
  function coverBody(g) { putW(g, D.fCover, 0, 0); put(g, D.block, 290, -330); }
  /* the card's 32 tiles (8 x 4): where each starts on the card and where it lands in the gilt window */
  function tileSrc(i) { return [-340 + (i % 8) * 85, -150 + Math.floor(i / 8) * 75]; }
  function tileDst(i) { return [-306 + (i % 8 + .5) * 76.5, -180 + (Math.floor(i / 8) + .5) * 67.5]; }
  function drawTile(g, i, x, y, rot, s, lift) {
    var pc = D.nameBig, sx = tileSrc(i);
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    if (lift > 0) { g.fillStyle = 'rgba(2,4,14,' + (.3 * lift).toFixed(3) + ')'; g.fillRect(-42.5 + 8 * lift, -37.5 + 14 * lift, 85, 75); }
    g.drawImage(pc.c, (sx[0] - pc.x0) * PS, (sx[1] - pc.y0) * PS, 85 * PS, 75 * PS, -42.5, -37.5, 85, 75);
    g.strokeStyle = 'rgba(255,247,228,.7)'; g.lineWidth = 1.6; g.strokeRect(-42.5, -37.5, 85, 75);
    g.restore();
  }
  function tileTimes(i) { var c = i % 8, r = Math.floor(i / 8); return T.shred + .1 + .03 * c + .04 * r + .1 * hash(i + 3); }
  function gScale(t) { return 1 + .1 * eio(seg(t, T.punch, T.punch + .35)); }
  /* the evidence pile at the foot of the desk */
  function pile(g, t) {
    var P = D.pile, n = P.length;
    P.forEach(function (p, i) {
      var tin = T[p.key]; if (t < tin) return;
      var tout = lerp(T.f3 + .25, T.seamL - .55, (n - 1 - i) / Math.max(1, n - 1)), ki = eo(seg(t, tin, tin + .4)), ko = eio(seg(t, tout, tout + .4));
      if (ko >= 1) return;
      var y = p.top + p.pc.h / 2 - 36 + 520 * (1 - ki) + 560 * ko;
      put(g, p.pc, p.x, y, p.rot + .05 * (1 - ki));
    });
  }

  function props(g, t) {
    var k;
    /* ---- hook + ask: the folder; the cover lifts off on "Did" ---- */
    drop(g, FX, FY, 0, -10, T.cmp, t, function (q) { folderBody(q, D.verdict, t); });
    if (t < T.lift + .5) lift(g, FX, FY + 5, 0, T.lift, t, coverBody, { dx: -20, r: -.035 });
    var gp = gavHook(t); if (gp) gavel(g, gp[0], gp[1], gp[2]);
    if (t >= T.lift + .25 && t < T.cmp + .45) {
      var pe = eio(seg(t, T.lift + .25, T.lift + .6)), pu = eio(seg(t, T.cmp, T.cmp + .42));
      var py = 1020 + 88 * Math.sin((t - T.lift) * (t > T.gs ? 9 : 5.2)), dip = bump(t, T.tap1 - .06, .2);
      pencil(g, 772 - 30 * dip, py - (1 - pe) * 600 - 1700 * pu + 10 * dip, -1.32);
    }
    /* ---- y2014: the complaint lands on the folder ---- */
    drop(g, 462, 1060, -.02, T.cmp, T.aly, t, function (q) {
      putW(q, D.complaint, 0, 0);
      hilite(q, -262, 82, 302, 178, eo(seg(t, T.hl1, T.hl1 + .35)));
      q.save(); q.globalCompositeOperation = 'multiply'; putW(q, D.filed, 100, 262, .07); q.restore();
      putW(q, D.rec1, 210, -372, .03);
    });
    slapOn(g, D.jul, 270, 612, -.05, T.jul, T.aly, t);
    slapOn(g, D.claim, 755, 612, .04, T.claim, T.aly, t, { tape: true });
    /* ---- lacey: the alley, the name card, the flashes, two empty frames ---- */
    drop(g, AX, 1030, .01, T.aly, T.book, t, function (q) { put(q, D.alley, 0, 0); });
    if (t > T.fl0 - .1 && t < T.book + .1) {
      FLASH.forEach(function (f, i) { for (var j = 0; j < 3; j++) flash(g, f[0], f[1], t - (T.fl0 + i * .19 + j * 1.1), f[2]); });
      [[310, 760, 1.15], [720, 800, 1.15], [525, 1185, 1.05]].forEach(function (f, i) { flash(g, f[0], f[1], t - (T.pap + i * .06), f[2]); });
    }
    slapOn(g, D.name, AX, 860, -.025, T.lj, T.book, t);
    var tilt = .02 - .075 * eo(seg(t, T.pap, T.pap + .2)) + sw(t, T.pap + .2, .012, 18, 6);
    stripOn(g, D.actress, AX, 1062, tilt, T.act, T.book, t);
    slapOn(g, D.cited, AX, 1168, .012, T.cit, T.book, t);
    slapOn(g, D.lsFrame, 340, 1312, -.04, T.frm1, T.book, t);
    slapOn(g, D.lsFrame, 745, 1312, .035, T.frm2, T.book, t);
    /* ---- law: the green book thuds down; 1903; the cover lifts off to § 51 ---- */
    drop(g, BKX, 1040, -.012, T.book, T.court, t, function (q) {
      put(q, D.bookBase, 0, 0); putW(q, D.page51, 0, 4);
      var W4 = ['NAME', 'PORTRAIT', 'PICTURE', 'VOICE'];
      W4.forEach(function (w, i) {
        var ti = T.w4[i]; if (t < ti) return; var s = lerp(1.4, 1, eo(seg(t, ti, ti + .14)));
        var nr = NOREC; NOREC = nr || s > 1.001;
        q.save(); q.translate(0, -215 + i * 76); q.scale(s, s);
        if (i === 1) hilite(q, -160, -40, 160, 34, eo(seg(t, T.w4[1] + .05, T.w4[1] + .35)));
        txt(q, w, 0, 0, { px: 76, col: INK, align: 'center', ls: 4, a: fin(t, ti, .05) }); q.restore(); NOREC = nr;
      });
      if (t >= T.sell) txt(q, 'FOR ADVERTISING OR TRADE', 0, 84, { px: 40, col: '#5a4a2a', align: 'center', ls: 2, a: fin(t, T.sell, .15) });
      if (t < T.cov2) putW(q, D.bookCover, 0, 0);
    }, { fall: 1450, ospin: 0 });
    if (t >= T.book && t < T.book + .5) [[-1, BKX - 180], [1, BKX + 180]].forEach(function (d) { var u = t - T.book, kk = eo(seg(u, 0, .45)); g.save(); g.globalAlpha *= .55 * (1 - seg(u, .15, .5)); g.fillStyle = '#efe4cf'; for (var j = 0; j < 3; j++) { g.beginPath(); g.ellipse(d[1] + d[0] * (10 + 30 * kk) + j * 18 * d[0], 1400 - j * 26 - 30 * kk, 26 + 40 * kk, 14 + 16 * kk, 0, 0, TAU); g.fill(); } g.restore(); });
    if (t >= T.cov2 && t < T.court) lift(g, BKX, 1040, -.012, T.cov2, t, function (q) { putW(q, D.bookCover, 0, 0); }, { dx: 0, r: .03 });
    slapOn(g, D.y1903, 300, 610, -.05, T.y1903, T.court, t);
    if (t >= T.cons - .02 && t < T.court + .45) drop(g, 530, 1205, -.035, T.cons, T.court, t, function (q) { putW(q, D.consent, 0, 0); }, { fd: .16, fall: 260, spin: -.05 });
    drop(g, BKX - 20, 1330, -.03, T.sue, T.court, t, function (q) { putW(q, D.sue, 0, 0); }, { fd: .26 });
    /* ---- y2018: a real layout change - the night sky fills the whole stage, the courthouse rises; seven chairs; the gavel ---- */
    drop(g, FX, 1010, 0, T.court, T.nc, t, function (q) {
      put(q, D.sky, 0, -145);
      q.save(); q.beginPath(); q.rect(-440, -730, 880, 892); q.clip();
      for (var i = 0; i < 6; i++) { var kc = eo(seg(t, T.cols + i * .07, T.cols + i * .07 + .32)); put(q, D.col, -300 + i * 120, 0 + (1 - kc) * 340); }
      q.restore();
      put(q, D.steps, 0, 190);
      var kp = seg(t, T.ped - .26, T.ped); if (kp > 0) { var nr = NOREC; NOREC = nr || kp < 1; putW(q, D.ped, 0, -235 - (1 - kp * kp) * 900); NOREC = nr; }
      put(q, D.block, 290, 150);
      for (var c = 0; c < 7; c++) chair(q, -360 + c * 120, 280, c !== 5, eo(seg(t, T.ch + c * .07, T.ch + c * .07 + .2)));
      if (t >= T.np) { var kn2 = eo(seg(t, T.np, T.np + .14)); q.save(); q.globalAlpha *= fin(t, T.np, .05); q.translate(240, 372); q.scale(lerp(1.3, 1, kn2), lerp(1.3, 1, kn2)); var nr3 = NOREC; NOREC = nr3 || kn2 < 1; putW(q, D.nopart, 0, 0); NOREC = nr3; q.restore(); }
    }, { fall: 1650 });
    slapOn(g, D.mar, 270, 600, -.05, T.mar, T.nc, t);
    var gc = gavCourt(t); if (gc) gavel(g, gc[0], gc[1], gc[2]);
    /* ---- nother + generic: the name card under the magnifier; the court's words ---- */
    drop(g, NX, 950, -.02, T.nc, T.f2, t, function (q) { putW(q, D.nameBig, 0, 0); });
    stripOn(g, D.generic, 510, 666, -.015, T.gen, T.f2, t);
    if (t >= T.gen + .05) slapOn(g, D.coa, 650, 815, .03, T.gen + .25, T.f2, t);
    slapOn(g, D.notrec, NX + 20, 1250, .015, T.nr, T.f2, t);
    if (t >= T.nc && t < T.magO + .5) {
      var mk2 = eio(seg(t, T.nc + .05, T.mag1)), mx = lerp(NX - 195, NX + 195, mk2), my = 960 - 60 * Math.sin(mk2 * Math.PI), mo = eio(seg(t, T.magO, T.magO + .45));
      var ein = eo(seg(t, T.nc - .05, T.nc + .3));
      my += (1 - ein) * -900 - 1700 * mo;
      var nr4 = NOREC; NOREC = true;
      magnifier(g, mx, my, function (q) { q.scale(1.45, 1.45); q.translate(NX - mx, 950 - my); q.rotate(-.02); put(q, D.nameBig, 0, 0); });
      NOREC = nr4;
    }
    /* ---- vote: the folder comes back; 6 tallies, 0, a tick in LOST; the cover drops; the stamp ---- */
    drop(g, FX, FY, .008, T.f2, T.cal, t, function (q) {
      folderBody(q, D.verdict, t, function (q2) {
        q2.save(); q2.translate(0, 20);
        q2.strokeStyle = INK; q2.lineWidth = 13; q2.lineCap = 'round';
        for (var i = 0; i < 6; i++) {
          var kt = eo(seg(t, T.tal[i], T.tal[i] + .1)); if (kt <= 0) continue;
          var a0 = i === 4 ? [-142, 300] : [i < 4 ? -110 + i * 34 : 50, 222], a1 = i === 4 ? [30, 222] : [a0[0] + 6, 304];
          q2.beginPath(); q2.moveTo(a0[0], a0[1]); q2.lineTo(lerp(a0[0], a1[0], kt), lerp(a0[1], a1[1], kt)); q2.stroke();
        }
        if (t >= T.zero) { var kz = eo(seg(t, T.zero, T.zero + .22)); q2.save(); q2.lineWidth = 13; q2.beginPath(); q2.moveTo(96, 262); q2.lineTo(lerp(96, 140, Math.min(1, kz * 3)), 262); q2.stroke(); if (kz > .3) { q2.beginPath(); q2.ellipse(210, 262, 32, 44, 0, -Math.PI / 2, -Math.PI / 2 + TAU * (kz - .3) / .7); q2.stroke(); } q2.restore(); }
        tickMark(q2, -188, 80, eo(seg(t, T.tick, T.tick + .22)), OXI);
        q2.restore();
        if (t >= T.close - .3) drop(q2, 0, 5, 0, T.close, null, t, function (q3) {
          coverBody2(q3);
          if (t >= T.stamp) { var ks = 1 + .02 * (1 - eo(seg(t, T.stamp, T.stamp + .2))); q3.save(); q3.globalCompositeOperation = 'multiply'; q3.translate(0, 236); q3.rotate(-.07); q3.scale(ks * .95, ks * .95); putW(q3, D.dismissed, 0, 0); q3.restore(); }
        }, { fd: .24, fall: 1300, knock: false });
      });
    });
    stampTool(g, 510, FY + 236 - 46, -.07, T.stamp, t);
    /* ---- twist: the LACEY JONAS card lands with an empty gilt frame; on "same" it is cut into tiles that fly into the frame ---- */
    /* the thunk: the framed portrait is set down hard (a short lift, then the knock) and a glare runs across its glass */
    var S = gScale(t), kth = kn(t, T.thk, .035), setY = -22 * Math.sin(Math.PI * seg(t, T.thk - .3, T.thk)) * (t < T.thk ? 1 : 0);
    drop(g, GX, GY + setY, -.008, T.shred - .02, T.cal, t, function (q) {
      q.scale(.96 * S * kth, .96 * S * kth);
      q.fillStyle = '#121a33'; q.fillRect(-306, -180, 612, 270);
      q.strokeStyle = 'rgba(251,245,230,.07)'; q.lineWidth = 2; for (var gx = 1; gx < 8; gx++) { q.beginPath(); q.moveTo(-306 + gx * 76.5, -180); q.lineTo(-306 + gx * 76.5, 90); q.stroke(); } for (var gy = 1; gy < 4; gy++) { q.beginPath(); q.moveTo(-306, -180 + gy * 67.5); q.lineTo(306, -180 + gy * 67.5); q.stroke(); }
      for (var i = 0; i < 32; i++) { var land = tileTimes(i) + .55; if (t < land) continue; var d = tileDst(i), kl = kn(t, land, .06); drawTile(q, i, d[0], d[1], 0, .9 * kl, 0); }
      var gl = seg(t, T.thk, T.thk + .45);
      if (gl > 0 && gl < 1) { q.save(); q.beginPath(); q.rect(-306, -180, 612, 270); q.clip(); q.globalCompositeOperation = 'screen'; var gx0 = lerp(-520, 520, eio(gl)); q.fillStyle = 'rgba(255,248,225,.45)'; q.beginPath(); q.moveTo(gx0 - 60, -190); q.lineTo(gx0 + 40, -190); q.lineTo(gx0 - 60, 100); q.lineTo(gx0 - 160, 100); q.closePath(); q.fill(); q.restore(); }
      putW(q, D.gilt, 0, 0);
    }, { fall: 1500 });
    /* the card, then its tiles in flight (on top of everything) */
    if (t < T.shred) drop(g, FX, GY - 45, 0, T.tw0, null, t, function (q) { putW(q, D.nameBig, 0, 0); }, { fd: .26 });
    else if (t < T.cal + .5) {
      var ko3 = eio(seg(t, T.cal, T.cal + .42));
      for (var i3 = 0; i3 < 32; i3++) {
        var src = tileSrc(i3), p0 = [FX + src[0] + 42.5, GY - 45 + src[1] + 37.5], dst = tileDst(i3);
        if (i3 === D.gtaTile) {
          var hv = [818, 900 + 8 * Math.sin((t - T.shred) * 5)], kf = eio(seg(t, T.shred + .1, T.shred + .6)), ks2 = seg(t, T.thk - .14, T.thk); ks2 *= ks2;
          if (t >= T.thk) continue;
          var Sg = .96 * gScale(t), pd = [GX + dst[0] * Sg, GY + dst[1] * Sg];
          var hx = lerp(p0[0], hv[0], kf), hy = lerp(p0[1], hv[1], kf) - 90 * Math.sin(Math.PI * kf);
          drawTile(g, i3, lerp(hx, pd[0], ks2), lerp(hy, pd[1], ks2) - 1700 * ko3, (.25 * Math.sin((t - T.shred) * 3)) * (1 - ks2), lerp(1.12, .9 * Sg, ks2), 1 - ks2);
          continue;
        }
        var ts = tileTimes(i3), u = seg(t, ts, ts + .55); if (u >= 1) continue;
        var kk = eio(u), p1 = [GX + .96 * dst[0], GY + .96 * dst[1]], h = hash(i3 + 11), cx = lerp(p0[0], p1[0], .5) + (h - .5) * 420, cy = Math.min(p0[1], p1[1]) - 200 - 200 * hash(i3 + 5);
        var x = (1 - kk) * (1 - kk) * p0[0] + 2 * (1 - kk) * kk * cx + kk * kk * p1[0], y = (1 - kk) * (1 - kk) * p0[1] + 2 * (1 - kk) * kk * cy + kk * kk * p1[1];
        var nr5 = NOREC; NOREC = true; drawTile(g, i3, x, y, (h - .5) * 1.4 * Math.sin(Math.PI * kk), lerp(1, .864, kk) + .1 * Math.sin(Math.PI * kk), Math.sin(Math.PI * kk)); NOREC = nr5;
      }
    }
    /* the re-created ruling page lands over the stamp once the stamp has had its reading time */
    drop(g, FX, RY, .012, T.page, T.cal, t, function (q) {
      putW(q, D.ruling, 0, 0);
      var b1 = D.rulingBox['MAY CONSTITUTE'], b2 = D.rulingBox['A ‘PORTRAIT’'];
      hilite(q, b1[0] - 8, b1[1] + 2, b1[2] + 8, b1[3] + 2, eo(seg(t, T.hl2, T.hl2 + .4)));
      hilite(q, b2[0] - 8, b2[1] + 2, b2[2] + 8, b2[3] + 2, eo(seg(t, T.hl3, T.hl3 + .35)));
      putW(q, D.rec2, 236, -238, .03);
    });
    /* ---- gta6: a fresh calendar page slams down: NOVEMBER 19 2026; its chips only after it lands ---- */
    drop(g, CALX, 1080, -.012, T.cal, T.f3, t, function (q) { put(q, D.calBack, 0, 0); putW(q, D.calPage, 0, 40); }, { fd: .26 });
    slapOn(g, D.gta6, 345, 800, -.06, T.g6, T.f3, t);
    slapOn(g, D.rsurl, CALX + 60, 1388, .015, T.url, T.f3, t);
    /* ---- end: FAIR RULING? YES / NO, equal; the pencil waits between the boxes, off the headline ---- */
    drop(g, FX, FY, 0, T.f3, null, t, function (q) { folderBody(q, D.endSheet, t); });
    if (t >= T.f3 + .2 && t < T.seamL) {
      var pe2 = eio(seg(t, T.f3 + .2, T.f3 + .55)), pu2 = eio(seg(t, T.seamL - .5, T.seamL - .12));
      pencil(g, 872, 1090 + 14 * Math.sin((t - T.f3) * 4.2) - (1 - pe2) * 600 - 1700 * pu2, -Math.PI / 2);
    }
    drop(g, FX, FY + 5, 0, T.seamL, null, t, coverBody, { knock: false, spin: 0, fd: .3 });
    if (t > DUR - 1.2) { var gp2 = gavHook(t - DUR); if (gp2) gavel(g, gp2[0], gp2[1], gp2[2]); }
  }
  function coverBody2(g) { putW(g, D.fCover, 0, 0); }

  /* ---------- captions: cream label tape in the upper third, phrase by phrase ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1, was: 1, will: 1, most: 1, his: 1, is: 1, her: 1, new: 1, from: 1, as: 1, can: 1 };
  var NYT = [];
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      var cur = [], ws = l.words;
      if (l.id === 'payoff') { var lw0 = ws[ws.length - 1], e = lw0.t1; ws = ws.slice(0, -1).concat([{ w: lw0.w.replace(/\.$/, ','), t0: lw0.t0, t1: lw0.t1, split: 1 }, { w: 'in', t0: e + .04, t1: e + .1 }, { w: 'New', t0: e + .1, t1: e + .2 }, { w: 'York.', t0: e + .2, t1: e + .32 }]); NYT = [e + .1, e + .2]; }
      ws.forEach(function (w, i) { cur.push(w); if ((w.split || /[.?!:]["”]?$/.test(w.w)) && !/^N\.Y\.$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 410, TAPE = '#f6ecd0';
  function captions(g, t) {
    t = tq(t);
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s : T.capEnd, end = Math.min(card0.t1 + .55, ns);
    if (t >= end) return;
    var k = cd(t, card0.s, 16), ko = 1 - seg(t, end - .06, end);
    g.save(); g.globalAlpha *= ko; cond(g); var cpx = 76; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var lines, lw, maxw = 740, CXc = 510;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var Ln = lines.length - 1; if (lw[Ln] + ws[i] > maxw && lines[Ln].length) { lines.push([]); lw.push(0); Ln++; } lines[Ln].push(i); lw[Ln] += ws[i] + gap; }); }
    function fixLines() {
      for (var Ln = 0; Ln < lines.length - 1; Ln++) { var last = lines[Ln][lines[Ln].length - 1]; while (lines[Ln].length > 1 && GLUE[norm(words[last].w)]) { lines[Ln].pop(); lines[Ln + 1].unshift(last); last = lines[Ln][lines[Ln].length - 1]; } }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2 && !stressed(words[lines[n - 1][0]])) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay2(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw) && cpx > 56) { cpx -= 4; font(g, cpx, 900); ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; lay2(); fixLines(); }
    var lh = cpx * 1.32, y0 = CAPY - (lines.length - 1) * lh / 2 + cpx * .36;
    lines.forEach(function (ln, li) {
      var tw0 = lw[li] - gap, x = CXc - tw0 / 2, y = y0 + li * lh + (1 - k) * 30, seed = Math.round(card0.t0 * 100) + li * 7;
      var r = mulberry(seed), x0 = x - 22, x1 = x + tw0 + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CXc, y); g.rotate(rot); g.translate(-CXc, -y);
      g.beginPath(); g.moveTo(x0, yt); for (var xx = x0; xx < x1; xx += 9) g.lineTo(xx, yt + (r() - .5) * 3); g.lineTo(x1, yt); for (var zz = 0; zz < 6; zz++) g.lineTo(x1 + (zz % 2 ? 7 : 0), yt + (yb - yt) * (zz + 1) / 6); for (xx = x1; xx > x0; xx -= 9) g.lineTo(xx, yb + (r() - .5) * 3); g.lineTo(x0, yb); for (zz = 0; zz < 6; zz++) g.lineTo(x0 - (zz % 2 ? 0 : 7), yb - (yb - yt) * (zz + 1) / 6); g.closePath();
      g.save(); g.shadowColor = 'rgba(0,4,20,.55)'; g.shadowBlur = 10; g.shadowOffsetX = 3; g.shadowOffsetY = 6; g.fillStyle = TAPE; g.fill(); g.restore();
      g.save(); g.clip(); g.globalAlpha *= .45; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0 - 8, yt - 4, x1 - x0 + 16, yb - yt + 8); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .25;
        if (cur) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ffd84a'; g.fillRect(x - 6, y - cpx * .78, ws[i] + 12, cpx * .98); g.restore(); }
        var isG = /^GTA$/.test(up[i]) || (/^[56]\.?,?$/.test(up[i]) && i > 0 && up[i - 1] === 'GTA');
        g.fillStyle = isG ? '#d81b6a' : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }

  var NOISE, POSTERMODE = false, VIG = null;
  function stage(g) { g.fillStyle = FELT; g.fillRect(0, 0, W, H); }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) {
      g.drawImage(D.desk, 0, 0);
      /* the desk lamp's warm pool drifts (periodic in DUR, so the loop is exact) */
      var lx = 540 + 90 * osc(t, 3, .4), ly = 960 + 70 * osc(t, 2, 1.3), gl = g.createRadialGradient(lx, ly, 60, lx, ly, 900);
      gl.addColorStop(0, 'rgba(255,214,150,.20)'); gl.addColorStop(.6, 'rgba(255,200,130,.07)'); gl.addColorStop(1, 'rgba(255,200,130,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
    }
    /* a slow hand-held drift of the whole desk (periodic in DUR): nothing ever sits frozen */
    var ddx = 5 * osc(t, 17, .3) + 2 * osc(t, 29, 1.1), ddy = 4 * osc(t, 13, 2.1) + 2 * osc(t, 31, .7), drr = .0025 * osc(t, 11, .9);
    if (LIVE2.bg) { g.save(); g.translate(510 + ddx, 990 + ddy); g.rotate(drr); g.translate(-510, -990); pile(g, t); g.restore(); }
    g.save(); railClip(g); g.translate(510 + ddx, 990 + ddy); g.rotate(drr); g.translate(-510, -990); props(g, t); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    function cover(a, b) { Tx('cv1', 'LOHAN', a, b); Tx('cv2', 'VS. GTA 5', a, b); }
    cover(0, T.lift + .1); cover(T.close, T.tw0); cover(T.seamL - .02, DUR + 1);
    function verd(a, b) { Tx('vd1', 'LOHAN VS. GTA 5', a, b); Tx('vd2', 'THE VERDICT:', a, b); Tx('vd3', 'WON', a, b); Tx('vd4', 'LOST', a, b); }
    verd(T.lift + .15, T.cmp); verd(T.f2, T.close - .1);
    Tx('cp1', 'COMPLAINT', T.cmp, T.aly); Tx('cp2', 'LOHAN v. TAKE-TWO', T.cmp, T.aly); Tx('cp3', 'AND ROCKSTAR GAMES', T.cmp, T.aly);
    Tx('cp4', 'CLAIM: A GTA 5', T.cmp, T.aly); Tx('cp5', 'CHARACTER IS HER', T.cmp, T.aly); Tx('cp6', '“LOOK-A-LIKE”', T.cmp, T.aly);
    Tx('cp7', 'FILED · MANHATTAN', T.cmp, T.aly); Tx('cp8', 'JUL 2 2014', T.cmp, T.aly); Tx('rc1', 'RE-CREATED', T.cmp, T.aly);
    Tx('jul', 'JULY 2014', T.jul + .1, T.aly); Tx('clm', 'HER CLAIM', T.claim + .1, T.aly);
    Tx('lj1', 'LACEY JONAS', T.lj + .1, T.book); Tx('lj2', 'GTA 5 CHARACTER', T.lj + .1, T.book); Tx('act', '“ACTRESS SLASH SINGER”', T.act + .05, T.book);
    Tx('cit', '+ 2 LOADING SCREENS SHE CITED', T.cit + .1, T.book);
    Tx('ls1', 'LOADING SCREEN', T.frm1 + .1, T.book); Tx('ls2', 'ART NOT SHOWN', T.frm1 + .1, T.book);
    Tx('bk1', 'N.Y.', T.book, T.cov2); Tx('bk2', 'CIVIL RIGHTS', T.book, T.cov2); Tx('bk3', 'LAW', T.book, T.cov2); Tx('bk4', '§ 51', T.book, T.cov2);
    Tx('y03', 'ENACTED 1903', T.y1903 + .1, T.court);
    Tx('pg1', 'CIVIL RIGHTS LAW § 51', T.cov2 + .2, T.court);
    ['NAME', 'PORTRAIT', 'PICTURE', 'VOICE'].forEach(function (w, i) { Tx('w' + i, w, T.w4[i] + .1, T.court); });
    Tx('adv', 'FOR ADVERTISING OR TRADE', T.sell + .1, T.court); Tx('cns', 'WITHOUT WRITTEN CONSENT', T.cons + .05, T.court); Tx('sue', 'YOU CAN SUE', T.sue, T.court);
    Tx('mar', 'MARCH 29 2018', T.mar + .1, T.nc);
    Tx('coa1', 'NY COURT OF APPEALS', T.ped, T.nc); Tx('np', 'TOOK NO PART', T.np + .1, T.nc);
    Tx('nb1', 'LACEY JONAS', T.nc, T.f2); Tx('nb2', 'GTA 5 CHARACTER', T.nc, T.f2);
    Tx('gen', '“…A GENERIC … ‘TWENTY SOMETHING’ WOMAN…”', T.gen + .05, T.f2); Tx('coa2', 'NY COURT OF APPEALS · 2018', T.gen + .35, T.f2);
    Tx('nr1', 'THE COURT:', T.nr + .1, T.f2); Tx('nr2', '“NOT RECOGNIZABLE”', T.nr + .1, T.f2);
        Tx('dis', 'DISMISSED', T.stamp + .05, T.fOut); Tx('aff', 'AFFIRMED 6-0 · 2018', T.stamp + .05, T.fOut);
    Tx('rl1', 'LOHAN v. TAKE-TWO', T.page, T.cal); Tx('rl2', 'COURT OF APPEALS', T.page, T.cal); Tx('rc2', 'RE-CREATED', T.page, T.cal);
    Tx('rq1', '“…AN AVATAR …', T.page, T.cal); Tx('rq2', 'MAY CONSTITUTE', T.page, T.cal); Tx('rq3', 'A ‘PORTRAIT’…”', T.page, T.cal);
    Tx('pl1', 'CAN BE A “PORTRAIT”', T.shred, T.cal); Tx('pl2', 'IF RECOGNIZABLE · NEW YORK LAW', T.shred, T.cal);
    Tx('cl1', 'NOVEMBER', T.cal, T.f3); Tx('cl2', '19', T.cal, T.f3); Tx('cl3', '2026', T.cal, T.f3);
    Tx('g6', 'GTA 6', T.g6 + .1, T.f3); Tx('url', 'ROCKSTAR GAMES', T.url + .1, T.f3);
    Tx('en1', 'FAIR RULING?', T.f3, T.seamL - .1); Tx('en2', 'YOUR VOTE:', T.f3, T.seamL - .1); Tx('en3', 'YES', T.f3, T.seamL - .1); Tx('en4', 'NO', T.f3, T.seamL - .1);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    function F(id, t, type, gain) { GT[id] = t; EV.push({ t: t, type: type, g: gain == null ? 1 : gain, id: id }); return t; }
    /* hook: the gavel glides in on frame 0 and strikes its block in the pause after "GTA 5." */
    T.gav1 = G('gav1', after('hook') + .02, 'gavel', .35, 1);
    T.lift = at('ask', 'did') - .06;
    T.gs = at('ask', 'guess') - .1;
    T.tap1 = G('tap1', after('ask') + .05, 'tick', .3, 1);
    T.cmp = G('cmp', start('y2014') - .14, 'thock', .35, 1);
    T.jul = at('y2014', '2014') - .02; T.claim = at('y2014', 'called'); T.hl1 = at('y2014', 'lookalike');
    T.aly = G('aly', start('lacey') - .1, 'thock', .35, 1);
    T.lj = at('lacey', 'lacey') + .04; T.act = wend('lacey', 'jonas') - .1; T.frm1 = T.lj + .35; T.frm2 = T.frm1 + .14; T.cit = T.frm1 + .24; T.fl0 = at('lacey', 'hiding'); T.pap = at('lacey', 'paparazzi');
    G('shut', after('lacey'), 'click', .3, 1);
    T.book = G('book', wend('law', 'weapon') + .2, 'thock', .3, 1.3, { m: .1 });
    T.y1903 = G('y1903', after('law'), 'slap', .35, 1);
    T.cov2 = at('rule', 'use') - .05;
    T.w4 = [at('rule', 'someones'), at('rule', 'portrait'), at('rule', 'portrait') + .14, at('rule', 'portrait') + .28];
    T.sell = at('rule', 'sell'); T.cons = at('rule', 'without') - .04;
    T.sue = G('sue', at('rule2', 'they') - .12, 'slap', .35, 1);
    T.mar = G('mar', start('y2018') - .3, 'slap', .3, 1);
    T.court = wend('y2018', '2018') + .08; T.cols = at('y2018', 'new') - .05; T.ped = T.court + .12; T.ch = at('y2018', 'decides'); T.np = T.court + .45;
    T.gav2 = G('gav2', after('y2018') + .02, 'gavel', .35, 1.1);
    T.nc = at('nother', 'wasnt') - .02; T.gen = T.nc + .14; T.nr = at('nother', 'recognizable') + .1;
    T.mag1 = wend('nother', 'her'); T.magO = start('generic') + .2;
    G('genp', after('nother') + .02, 'pin', .3, .9);
    T.f2 = G('f2', start('vote') - .12, 'thock', .35, 1.1);
    var s6 = at('vote', 'six'), sv = wend('vote', 'votes'); T.tal = []; for (var i = 0; i < 6; i++) T.tal.push(s6 + (sv - s6) * i / 6);
    T.zero = at('vote', 'zero'); T.tick = at('vote', 'lost');
    T.close = wend('vote', 'lost') + .1;
    T.stamp = G('stamp', T.close + .26, 'stamp', .35, 1.7);
    /* twist: the stamped folder leaves; the name card and an empty gilt frame land in the pause; on "same" the card is cut into tiles */
    T.fOut = T.stamp + .05 + 2.56;
    T.tw0 = G('tw0', start('twist') - .1, 'thock', .3, 1.1);
    T.shred = at('twist', 'same'); T.page = T.fOut; T.hl2 = T.page + .25; T.hl3 = at('payoff', 'count');
    T.punch = at('payoff', 'count');
    T.thk = G('thk', after('payoff') - .02, 'thunk', .3, 1);
    T.cal = G('cal', start('gta6') - .06, 'thock', .35, 1);
    T.g6 = Math.max(at('gta6', 'gta') + .02, T.cal + .1); T.url = T.cal + .12;
    T.f3 = G('f3', start('end') - .45, 'thock', .35, 1.1);
    T.seamL = DUR - .1; T.capEnd = DUR - .45;
    G('seam', T.seamL, 'thock', .25, .9);
    STRESS = [['hook', 'sued'], ['ask', 'guess'], ['y2014', 'lookalike'], ['lacey', 'paparazzi'], ['law', '1903'], ['rule', 'portrait'], ['rule2', 'sue'], ['y2018', 'top'], ['nother', 'recognizable'], ['generic', 'generic'], ['vote', 'lost'], ['twist', 'same'], ['payoff', 'portrait'], ['gta6', '19'], ['end', 'fair']].map(function (p) { return at(p[0], p[1]); }).concat(NYT);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { POSTERMODE = t === window.FILM.POSTER; frame(ctx, t); POSTERMODE = false; return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }
  /* ---------- sound: desk foley written into the pauses; no music (Isac adds a platform sound) ---------- */
  BODY.thunk = .16; BODY.patter = .12; BODY.gavel = .28; BODY.thock = .12; BODY.stamp = .2; BODY.slap = .1; BODY.pin = .1; BODY.tick = .05; BODY.click = .08;
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
    function band(t0, t1, f0, f1, g0, g1, q, pan, type) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = type || 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g, f) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = f || 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc2('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function boom(t, g, f0, f1, dur) { var o = osc2('sine', f0, t, t + dur + .05, [[t, 0], [t + .006, g], [t + dur * .35, g * .55], [t + dur, 0]]); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .8); }
    /* the gavel: a hard wooden knock with a short body and a bright crack */
    function gavelS(t, g) { boom(t, .8 * g, 260, 90, .22); thump(t, .7 * g, 420); tick(t, 2.2 * g, 1400); band(t, t + .09, 2600, 900, .16 * g, .02 * g, 1.1); tick(t + .012, 1.1 * g, 2600); }
    function stamp(t, g) { tick(t, 1.6 * g, 2400); thump(t, .8 * g, 170); boom(t, .35 * g, 130, 60, .18); var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    function click(t, g) { tick(t, 1.3 * g, 3000); thump(t, .15 * g, 600); tick(t + .04, .6 * g, 3600); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); band(t, t + .07, 2600, 1300, .08 * g, .01 * g, 1); }
    function slap(t, g) { thump(t, .3 * g, 260); band(t, t + .06, 3000, 1500, .12 * g, .01 * g, .9); tick(t, 1.2 * g, 2000); band(t, t + .035, 2200, 1400, .18 * g, .02 * g, 1.4); }
    function pin(t, g) { tick(t, 1.4 * g, 2800); thump(t, .25 * g, 420); }
    function caseT(t, g) { tick(t, .9 * g, 1500); thump(t, .14 * g, 360); band(t, t + .035, 2400, 1500, .22 * g, .02 * g, 1.4); }
    /* the gilt frame's last tile: a wooden thunk with a 1-3 kHz slap on top */
    function thunk(t, g) { thump(t, .55 * g, 150); boom(t, .25 * g, 110, 55, .16); band(t, t + .05, 2600, 1300, .2 * g, .02 * g, 1.2); tick(t, 1.1 * g, 1800); }
    function patter(t, g) { for (var j = 0; j < 3; j++) { tick(t + j * .035, (1 - j * .2) * g, 2600); thump(t + j * .035, .08 * g, 520); } }
    var LEVEL = { gavel: 1, stamp: 1, click: 4, thock: 5, slap: 3, pin: 4, tick: 6, thunk: 4, patter: 4 };
    var TRIM = window.SFX_TRIM || { aly: 7, sue: 7.7, f3: 7, shut: 5, book: 6, tap1: 4.8, cmp: 1, mar: 1.6, thk: -7 };
    var TYPE_DB = window.SFX_TYPE_DB || { gavel: -10, stamp: -12, click: -12, thock: -18, slap: -14, pin: -14, tick: -18, thunk: -14, patter: -16 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'gavel') gavelS(e.t, g);
      else if (e.type === 'stamp') stamp(e.t, g);
      else if (e.type === 'click') click(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'pin') pin(e.t, g);
      else if (e.type === 'tick') caseT(e.t, g);
      else if (e.type === 'thunk') thunk(e.t, g);
      else if (e.type === 'patter') patter(e.t, g);
    });
    /* no music: Isac adds a trending sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    (function () { var o = bus(1), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = window.ROOM_GAIN || .03; })();
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '800 58px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹|~$+—½@&!§'); })).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures();
      window.READY = true;
    });
  }

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-lawsuit', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.stamp + .4) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'Sued', t0: 0, t1: start('y2014') }, { id: 'y2014', name: 'Her claim', t0: start('y2014'), t1: start('law') }, { id: 'law', name: '1903 law', t0: start('law'), t1: start('y2018') }, { id: 'y2018', name: 'The court', t0: start('y2018'), t1: start('vote') }, { id: 'vote', name: '6-0', t0: start('vote'), t1: start('twist') }, { id: 'twist', name: 'Portrait', t0: start('twist'), t1: start('gta6') }, { id: 'end', name: 'Fair?', t0: start('gta6'), t1: DUR }]; };

  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the desk and the clip off, every prop shape and glyph must stay inside x 90-930 and above y 1450 */
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 3; var bad = [], n = Math.round(DUR * fps), span = .5 / fps;
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false; var lt = LIVE.text; LIVE.text = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x1c) + Math.abs(d[i + 1] - 0x2a) + Math.abs(d[i + 2] - 0x4c) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
    for (var i = 0; i < n; i++) for (var s = 0; s < subs; s++) {
      var t = (i + .5) / fps - span / 2 + span * (s + .5) / subs; frame(ctx, clamp(t, 0, DUR));
      var L0 = dirty(0, 300, 90, H - 300), R0 = dirty(930, 300, 150, H - 300), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0.c + B0.c > 0) { bad.push({ f: i, t: +t.toFixed(3), left: L0.c && [L0.c, L0.x0, L0.y0, L0.y1], right: R0.c && [R0.c, R0.x1 + 930, R0.y0, R0.y1], bottom: B0.c && [B0.c, B0.y1, B0.x0 + 90, B0.x1 + 90] }); break; }
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; LIVE.text = lt; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
