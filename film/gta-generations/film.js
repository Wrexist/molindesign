/* "GTA 5 came before the PS4.": Delta, pillar 3 (GTA history).
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). Take-Two (SEC filings): GTA V launched Sept 17 2013 on PS3 / Xbox 360; PS4 / Xbox One Nov 18 2014; PC
   planned Jan 27 2015, then Mar 24 2015, launched Apr 14 2015; launched digitally on PS5 / Xbox Series X|S Mar 15 2022;
   GTA VI on PS5, Xbox Series X|S, Nov 19 2026. Sony: PS4 launched in the US and Canada Nov 15 2013.
   The set is a living-room media shelf at night: a walnut bookcase with three shelves (oldest at the bottom), generic
   console slabs with paper labels, and one plain GTA 5 case that hops up a shelf per generation (the native move).
   No logos, no real console shapes, no box art, no footage, no music. Engine helpers from film/gta-firsts. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0b1119', CREAM = '#f6ead8';
  var HOT = '#ffcf5a', TEAL = '#4fb3a9', ORG = '#e8743b', CORAL = '#ff6b4a';
  var INK = '#151a26', PAPER = '#f2e5cd', NEWS = '#efe5cf', INK2 = '#20283b', RED = '#e23d3d';
  var DISP = 'Archivo';
  /* the safe box: every prop stays whole inside x 90-930 and above y 1430 (checked by RAIL_SCAN on rendered frames) */
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
    var L = lines.map(function (q) { return typeof q === 'string' ? [q, px] : q; });
    var m = mk(4, 4).getContext('2d');
    function wOf(q, k) { cond(m); font(m, q[1] * k, 900); ls(m, 2); var ww = m.measureText(q[0]).width; unst(m); return ww; }
    var k = 1, w1 = Math.max.apply(null, L.map(function (q) { return wOf(q, 1); }));
    if (w1 > maxw) { k = maxw / w1; w1 = Math.max.apply(null, L.map(function (q) { return wOf(q, k); })); }
    L = L.map(function (q) { return [q[0], Math.floor(q[1] * k)]; });
    var hs = L.map(function (q) { return q[1] * 1.04; }), w = w1 + 56, h = hs.reduce(function (a1, b1) { return a1 + b1; }, 0) + 56, tp = jag(95, w, 4), bt = jag(96, w, 4), rec = [];
    var pc = piece([-w / 2, -h / 2 - 8, w / 2, h / 2 + 8], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + q[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(-w / 2 + bt[i][0], h / 2 + bt[i][1]); g.closePath(); }, NEWS, { sx: 6, sy: 12, blur: 16, extra: function (g) {
      var r = mulberry(91), yy = -h / 2 + 28;
      g.strokeStyle = col; g.lineWidth = 9; g.strokeRect(-w / 2 + 12, -h / 2 + 14, w - 24, h - 28);
      L.forEach(function (q, i) { var y = yy + hs[i] / 2; yy += hs[i]; inkText(g, q[0], 0, y + 2, q[1], col, 93 + i, { dense: 26, big: 2.2, ls: 2 }); var lw = wOf(q, 1); rec.push([-lw / 2, y - q[1] * .5, lw / 2, y + q[1] * .45, q[0]]); });
      g.globalCompositeOperation = 'destination-out';
      for (var i = 0; i < 260; i++) { g.globalAlpha = .2 + r() * .5; g.beginPath(); g.arc(-w / 2 + 16 + r() * (w - 32), -h / 2 + 14 + r() * (h - 28), .5 + r() * 1.8, 0, TAU); g.fill(); }
    } });
    wordsOf(pc, rec); pc.sw = w; pc.sh = h; return pc;
  }

  BODY.tear = .1; BODY.thock = .12; BODY.pop = .1; BODY.stamp = .18; BODY.swish = .26; BODY.slap = .1;

  /* =====================================================================================================
     THE SET: a living room at night. A walnut bookcase with three shelves fills the frame (bottom = oldest
     console generation, top = newest), a desk to its right for the PC beat. World coordinates; one 2D camera
     (scale + pan) frames it. The GTA 5 case hops up a shelf per generation: the film's native move.
     ===================================================================================================== */
  var WAL = '#5a3520', WAL2 = '#3b2214', WALD = '#24140b', BACK = '#1f130c';
  var BK = { x0: 130, x1: 890, top: 470, post: 34 }, IN0 = 164, IN1 = 856;
  var FLOOR = [1410, 1100, 790], BOARD = 26;                    /* top surface of each shelf: 0 bottom, 1 mid, 2 top */
  var SL = { x: 206, w: 320, h: 120 };                          /* console slab: front face, left x */
  var C5 = { x: 546, w: 150, h: 220 }, C6 = { x: 704, w: 150, h: 220 };
  var SLAB = [
    { front: '#232429', top: '#4a4c57', n1: 'PS3', n2: 'XBOX 360' },
    { front: '#1d2333', top: '#2d3549', n1: 'PS4', n2: 'XBOX ONE' },
    { front: '#aeb4bf', top: '#dfe3ea', n1: 'PS5', n2: 'XBOX SERIES X|S' }];

  /* ---------- the camera: scale s and pan cx; the bottom shelf never drops under y 1428 ---------- */
  var CAM = { s: 1, cx: 510, cy: 950 };
  function camAt(t) {
    var s = stepv(t, 1.2, T.CS) * (1 + .006 * osc(t, 3, .7)), cx = stepv(t, 510, T.CX);
    return { s: s, cx: cx, cy: 1410 - (1428 - 950) / s - stepv(t, 0, T.CYO) };
  }
  function toCam(g) { g.translate(510, 950); g.scale(CAM.s, CAM.s); g.translate(-CAM.cx, -CAM.cy); }
  function sx(x) { return (x - CAM.cx) * CAM.s + 510; }
  function sy(y) { return (y - CAM.cy) * CAM.s + 950; }

  /* ---------- pre-cut pieces ---------- */
  function buildBookcase() {
    var x0 = BK.x0, x1 = BK.x1, y0 = BK.top, y1 = FLOOR[0] + BOARD + 44;
    return piece([x0, y0, x1, y1], rect(x0, y0, x1, y1), WAL, { ps: 1.3, grain: .5, edge: 1.4, edgeCol: 'rgba(255,214,170,.35)', blur: 24, sx: 0, sy: 16, sc: 'rgba(0,0,0,.6)', extra: function (g) {
      var r = mulberry(88), i, k;
      /* back panel of each compartment: dark planks, a soft shadow under each board and down each side */
      [[FLOOR[2], BK.top + 30], [FLOOR[1], FLOOR[2] + BOARD], [FLOOR[0], FLOOR[1] + BOARD]].forEach(function (c) {
        var yb = c[0], yt = c[1];
        g.fillStyle = BACK; g.fillRect(IN0, yt, IN1 - IN0, yb - yt);
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; for (var x = IN0 + 86; x < IN1; x += 86) { g.beginPath(); g.moveTo(x, yt); g.lineTo(x, yb); g.stroke(); }
        g.globalAlpha = .5; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(IN0, yt, IN1 - IN0, yb - yt); g.globalAlpha = 1;
        var sg = g.createLinearGradient(0, yt, 0, yt + 70); sg.addColorStop(0, 'rgba(0,0,0,.6)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(IN0, yt, IN1 - IN0, 70);
        var lg = g.createLinearGradient(IN0, 0, IN0 + 40, 0); lg.addColorStop(0, 'rgba(0,0,0,.45)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = lg; g.fillRect(IN0, yt, 40, yb - yt);
        var rg = g.createLinearGradient(IN1, 0, IN1 - 40, 0); rg.addColorStop(0, 'rgba(0,0,0,.45)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(IN1 - 40, yt, 40, yb - yt);
      });
      /* boards: a lit front edge, a darker underside */
      [BK.top, FLOOR[2], FLOOR[1], FLOOR[0]].forEach(function (yb, j) {
        var h = j === 0 ? 30 : BOARD;
        var bg2 = g.createLinearGradient(0, yb, 0, yb + h); bg2.addColorStop(0, '#7a4a2b'); bg2.addColorStop(.25, WAL); bg2.addColorStop(1, WAL2); g.fillStyle = bg2; g.fillRect(x0, yb, x1 - x0, h);
        g.fillStyle = 'rgba(255,220,180,.25)'; g.fillRect(x0, yb, x1 - x0, 2);
      });
      /* plinth */
      g.fillStyle = WALD; g.fillRect(x0 + 10, FLOOR[0] + BOARD, x1 - x0 - 20, 44);
      /* posts with grain */
      [[x0, x0 + BK.post], [x1 - BK.post, x1]].forEach(function (p) {
        var pg = g.createLinearGradient(p[0], 0, p[1], 0); pg.addColorStop(0, WAL2); pg.addColorStop(.5, WAL); pg.addColorStop(1, WAL2); g.fillStyle = pg; g.fillRect(p[0], y0, p[1] - p[0], FLOOR[0] + BOARD - y0);
      });
      g.lineWidth = 1.2;
      for (i = 0; i < 70; i++) {
        var post = r() < .5, px = post ? (r() < .5 ? x0 + 4 + r() * 26 : x1 - 30 + r() * 26) : x0 + r() * (x1 - x0);
        var py = post ? y0 + r() * (FLOOR[0] - y0) : [BK.top, FLOOR[2], FLOOR[1], FLOOR[0]][Math.floor(r() * 4)] + 4 + r() * 18;
        g.strokeStyle = 'rgba(30,14,6,' + (.2 + r() * .25).toFixed(2) + ')'; g.beginPath();
        if (post) { g.moveTo(px, py); for (k = 1; k < 8; k++) g.lineTo(px + Math.sin(k * 1.3 + i) * 1.5, py + k * 22); }
        else { g.moveTo(px, py); for (k = 1; k < 8; k++) g.lineTo(px + k * 26, py + Math.sin(k * 1.1 + i) * 1.2); }
        g.stroke();
      }
    } });
  }
  function buildDesk() {
    return piece([1210, 1238, 2010, 1470], function (g) {
      g.beginPath(); g.rect(1210, 1238, 800, 30); g.rect(1226, 1268, 768, 46); g.rect(1240, 1314, 30, 160); g.rect(1950, 1314, 30, 160);
    }, function (g) { var gr = g.createLinearGradient(0, 1238, 0, 1470); gr.addColorStop(0, '#80522f'); gr.addColorStop(.12, '#5c3a22'); gr.addColorStop(1, '#2a180d'); return gr; }, { ps: 1, edge: 1.2, edgeCol: 'rgba(255,214,170,.3)', blur: 20, sy: 14 });
  }
  function slabPiece(i) {
    var S = SLAB[i], w = SL.w, h = SL.h;
    return piece([0, -20, w + 4, h], function (g) {
      g.beginPath(); if (i === 0) { g.moveTo(0, 10); g.quadraticCurveTo(w / 2, -30, w, 10); } else if (i === 1) { g.moveTo(6, -18); g.lineTo(w - 2, -18); g.lineTo(w, 0); } else { g.moveTo(12, -18); g.lineTo(w - 6, -18); g.lineTo(w, 0); }
      g.lineTo(w, h - 10); g.quadraticCurveTo(w, h, w - 10, h); g.lineTo(10, h); g.quadraticCurveTo(0, h, 0, h - 10); g.lineTo(0, 0); g.closePath();
    }, S.front, { ps: 1.5, edge: 1.6, edgeCol: 'rgba(255,255,255,.22)', sy: 6, blur: 10, extra: function (g) {
      /* top face, a sheen on the front, the disc slot and a vent groove */
      g.fillStyle = S.top; g.beginPath(); if (i === 0) { g.moveTo(0, 10); g.quadraticCurveTo(w / 2, -30, w, 10); g.lineTo(w, 14); g.quadraticCurveTo(w / 2, -12, 0, 14); } else { g.moveTo(12, -18); g.lineTo(w - 6, -18); g.lineTo(w, 0); g.lineTo(0, 0); } g.closePath(); g.fill();
      var sh = g.createLinearGradient(0, 0, 0, h);
      /* each generation its own finish: 2013 glossy and curved, 2014 flat matte, 2022 pale with a dark band */
      if (i === 0) { sh.addColorStop(0, 'rgba(255,255,255,.34)'); sh.addColorStop(.18, 'rgba(255,255,255,.06)'); sh.addColorStop(.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.4)'); }
      else if (i === 1) { sh.addColorStop(0, 'rgba(255,255,255,.04)'); sh.addColorStop(1, 'rgba(0,0,0,.18)'); }
      else { sh.addColorStop(0, 'rgba(255,255,255,.25)'); sh.addColorStop(.4, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.22)'); }
      g.fillStyle = sh; g.fillRect(0, 0, w, h);
      if (i === 0) { g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, 4); g.quadraticCurveTo(w / 2, -2, w - 8, 4); g.stroke(); }
      if (i === 2) { g.fillStyle = '#1b1e25'; g.fillRect(w * .5 - 14, 0, 28, h); }
      g.fillStyle = 'rgba(0,0,0,.7)'; rr(g, 246, 36, 60, 7, 3); g.fill();
      g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2;
      if (i === 0) { g.beginPath(); g.moveTo(0, 60); g.lineTo(w, 60); g.stroke(); }
      if (i === 1) { g.beginPath(); g.moveTo(232, 0); g.lineTo(262, h); g.stroke(); }
      if (i === 2) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, h - 22, w, 22); }
      for (var v = 0; v < 7; v++) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(40 + v * 34, -12, 22, 4); }
    } });
  }
  function casePiece(n, body, spine, type) {
    var w = C5.w, h = C5.h, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { rr(g, -w / 2, -h / 2, w, h, 9); }, body, { ps: 1.6, sy: 8, blur: 12, extra: function (g) {
      g.fillStyle = spine; g.fillRect(-w / 2, -h / 2, 18, h);
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; rr(g, -w / 2 + 26, -h / 2 + 10, w - 36, h - 20, 5); g.stroke();
      var sh = g.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); sh.addColorStop(0, 'rgba(255,255,255,.16)'); sh.addColorStop(.4, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(-w / 2, -h / 2, w, h);
      cond(g); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = type;
      font(g, 58, 900); ls(g, 2); g.fillText('GTA', 9, -48); var m1 = g.measureText('GTA'); rec.push([9 - m1.width / 2, -78, 9 + m1.width / 2, -20, 'GTA']);
      font(g, 124, 900); ls(g, 0); g.fillText(n, 9, 40); var m2 = g.measureText(n); rec.push([9 - m2.width / 2, -14, 9 + m2.width / 2, 88, n]);
      unst(g);
    } });
    return wordsOf(pc, rec);
  }
  function buildBox() {
    var rec = [];
    var pc = piece([0, 0, 300, 200], function (g) { g.beginPath(); g.rect(0, 0, 300, 200); }, '#b98a55', { ps: 1.4, sy: 8, blur: 12, extra: function (g) {
      g.fillStyle = 'rgba(90,55,25,.25)'; g.fillRect(0, 0, 300, 10);
      g.fillStyle = 'rgba(240,226,190,.55)'; g.fillRect(132, 0, 36, 200);
      g.strokeStyle = 'rgba(90,55,25,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 12); g.lineTo(300, 12); g.stroke();
      inkText(g, 'PS4', 70, 54, 64, '#1d1208', 404, { dense: 30, big: 1.6 });
      var m = mk(4, 4).getContext('2d'); cond(m); font(m, 64, 900); var tw = m.measureText('PS4').width; unst(m); rec.push([70 - tw / 2, 24, 70 + tw / 2, 84, 'PS4']);
      /* "this side up" arrows, no brand */
      g.strokeStyle = '#1d1208'; g.lineWidth = 5; [222, 254].forEach(function (x) { g.beginPath(); g.moveTo(x, 80); g.lineTo(x, 34); g.moveTo(x - 12, 48); g.lineTo(x, 34); g.lineTo(x + 12, 48); g.stroke(); });
    } });
    return wordsOf(pc, rec);
  }
  function buildCalendar() {
    var w = 600, h = 400;
    return piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { g.beginPath(); g.rect(-w / 2, -h / 2, w, h); }, '#f7efdf', { ps: 1.3, sy: 10, blur: 16, extra: function (g) {
      g.fillStyle = INK2; g.fillRect(-w / 2, -h / 2, w, 76);
      g.strokeStyle = 'rgba(21,26,38,.12)'; g.lineWidth = 2; for (var y = -h / 2 + 128; y < h / 2; y += 90) { g.beginPath(); g.moveTo(-w / 2 + 20, y + 40); g.lineTo(w / 2 - 20, y + 40); g.stroke(); }
    }, after: function (g) {
      /* the ring binding */
      for (var i = 0; i < 9; i++) { var x = -w / 2 + 50 + i * 62.5; g.fillStyle = '#0b1119'; g.beginPath(); g.arc(x, -h / 2 + 14, 6, 0, TAU); g.fill(); g.strokeStyle = '#b9bfc9'; g.lineWidth = 4; g.beginPath(); g.arc(x, -h / 2 + 2, 12, Math.PI * .9, Math.PI * 2.1); g.stroke(); }
    } });
  }
  function buildDoor() {
    return piece([0, 0, 1320, 1960], rect(0, 0, 1320, 1960), WAL, { ps: .5, shadow: false, edge: 0, extra: function (g) {
      var r = mulberry(61); g.lineWidth = 3;
      for (var i = 0; i < 90; i++) { var x = r() * 1320; g.strokeStyle = 'rgba(30,14,6,' + (.15 + r() * .2).toFixed(2) + ')'; g.beginPath(); g.moveTo(x, 0); for (var y = 0; y <= 1960; y += 140) g.lineTo(x + Math.sin(y * .01 + i) * 6, y); g.stroke(); }
      g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 14; g.strokeRect(90, 120, 1140, 1720);
      g.strokeStyle = 'rgba(255,214,170,.25)'; g.lineWidth = 4; g.strokeRect(104, 134, 1112, 1692);
      g.fillStyle = '#c9a46a'; rr(g, 140, 900, 26, 160, 13); g.fill();
    } });
  }

  function buildTextures() { GRAIN = buildGrain(); buildSet(); }
  function buildSet() {
    P.bk = buildBookcase(); P.desk = buildDesk(); P.door = buildDoor();
    P.slab = [0, 1, 2].map(slabPiece);
    P.lab = SLAB.map(function (S, i) { return cardPiece(i === 2 ? 286 : 220, 92, '#f4e8cf', [[S.n1, 42, INK, -21, 'condensed'], [S.n2, 36, INK, 23]], { r: 5, ring: 'rgba(21,26,38,.2)', sy: 3 }); });
    P.c5 = casePiece('5', '#1a2133', TEAL, '#f6ead8');
    P.c6 = casePiece('6', CORAL, '#1a2133', '#fff6ea');
    P.box = buildBox();
    P.cA = cardPiece(300, 124, CREAM, [['SEP 17, 2013', 54, INK, -20], ['GTA 5 · TAKE-TWO', 36, RED, 32]], { r: 8, ring: TEAL });
    P.cB = cardPiece(250, 104, '#fbf6ea', [['NOV 15, 2013', 48, INK, -20], ['PS4 · SONY (US)', 36, RED, 26]], { r: 4, ring: 'rgba(21,26,38,.35)', sy: 4 });
    P.c2 = cardPiece(300, 124, CREAM, [['NOV 18, 2014', 54, INK, -20], ['TAKE-TWO', 36, RED, 32]], { r: 8, ring: TEAL });
    P.c3 = cardPiece(330, 124, CREAM, [['MAR 15, 2022', 54, INK, -20], ['TAKE-TWO · DIGITAL', 36, RED, 32]], { r: 8, ring: TEAL });
    P.cal = buildCalendar();
    P.calH = cardPiece(560, 64, INK2, [['GTA 5 · PC VERSION', 44, CREAM, 2]], { r: 0, shadow: false, sy: 0, edge: 0 });
    P.dJan = cardPiece(330, 80, '#fffaf0', [['JAN 27, 2015', 58, INK, 3]], { r: 4, sy: 4 });
    P.dMar = cardPiece(330, 80, '#fffaf0', [['MAR 24, 2015', 58, INK, 3]], { r: 4, sy: 4 });
    P.dApr = cardPiece(420, 104, '#fffaf0', [['APR 14, 2015', 78, INK, 3]], { r: 4, sy: 5 });
    P.tt = cardPiece(220, 64, INK2, [['TAKE-TWO', 38, CREAM, 2]], { r: 6, ring: 'rgba(246,234,216,.5)' });
    P.mon = cardPiece(436, 156, '#14284a', [['PC', 70, CREAM, -28], ['NOT A CONSOLE GENERATION', 36, '#bcd6ff', 40]], { r: 4, sy: 0, shadow: false, edge: 0, before: function (g) { var gr = g.createRadialGradient(0, -20, 20, 0, 0, 260); gr.addColorStop(0, 'rgba(90,150,230,.55)'); gr.addColorStop(1, 'rgba(20,40,74,0)'); g.fillStyle = gr; g.fillRect(-218, -78, 436, 156); } });
    P.st = buildStamp([['3 GENERATIONS · 1 GAME', 64]], 64, 740, CORAL);
    P.tP = cardPiece(170, 74, CREAM, [['PS5', 52, INK, 3]], { r: 8, ring: TEAL });
    P.tX = cardPiece(310, 74, CREAM, [['XBOX SERIES X|S', 46, INK, 3]], { r: 8, ring: TEAL });
    P.ra = cardPiece(400, 56, INK2, [['ROCKSTAR · ANNOUNCED', 38, CREAM, 2]], { r: 6, ring: 'rgba(246,234,216,.5)' });
    P.c6d = cardPiece(318, 140, CREAM, [['NOV 19, 2026', 62, INK, -22], ['ROCKSTAR', 40, RED, 38]], { r: 8, ring: CORAL });
    P.v = ['PS3 / 360', 'PS4 / ONE', 'PS5 / SERIES', 'PC'].map(function (s) { var m = mk(4, 4).getContext('2d'); cond(m); font(m, 54, 900); ls(m, 1); var tw = m.measureText(s).width; unst(m); var w = Math.ceil(tw + 44 + 20); return cardPiece(w, 96, CREAM, [[s, 54, INK, 3, null, 12]], { r: 10, ring: INK2, after: function (g) { g.fillStyle = BG; g.beginPath(); g.arc(-w / 2 + 22, 0, 8, 0, TAU); g.fill(); } }); });
  }

  /* ---------- drawing helpers ---------- */
  /* a dashed chalk outline that draws on along its perimeter (k 0..1) */
  function chalk(g, x, y, w, h, k, a, col) {
    if (k <= 0 || a <= 0) return;
    var per = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], L = 4 * clamp(k, 0, 1);
    g.save(); g.globalAlpha *= a; g.setLineDash([16, 12]); g.lineDashOffset = 0; g.strokeStyle = col || 'rgba(246,234,216,.85)'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y);
    for (var e = 0; e < 4 && e < L; e++) { var A = per[e], B = per[e + 1], f = Math.min(1, L - e); g.lineTo(lerp(A[0], B[0], f), lerp(A[1], B[1], f)); }
    g.stroke(); g.restore();
  }
  /* a card that lands (slam or drop) and later leaves sideways; draws in world space */
  function card(g, pc, x, y, rot, tin, tout, t, o) {
    o = o || {}; var od = o.od || .35; if (t < tin - .02 || t > tout + od + .05) return;
    var k = cd(t, tin, o.w || 14), ko = eio(seg(t, tout, tout + od));
    var s = (o.s || 1) * (o.slam ? lerp(1.45, 1, eo(seg(t, tin, tin + .14))) * kn(t, tin + .12, .05) : 1);
    var nr = NOREC; NOREC = nr || k < .97 || ko > 0 || (o.slam && t < tin + .16);
    g.save(); g.globalAlpha *= fin(t, tin, .06);
    g.translate(x + (o.dir || 1) * 1100 * ko + (o.slam ? 0 : (1 - k) * (o.fromX || 0)), y - 160 * ko + (o.slam ? 0 : (1 - k) * (o.fromY == null ? -120 : o.fromY)));
    g.rotate(rot + (o.dir || 1) * .45 * ko + (o.slam ? .06 * (1 - eo(seg(t, tin, tin + .14))) : .15 * (1 - k)));
    g.scale(s, s); putW(g, pc, 0, 0);
    if (o.tape) tape(g, 0, -pc.h / 2 + 40, 90, 26, .05);
    g.restore(); NOREC = nr;
  }
  function led(g, x, y, on, t, ph, pulse) {
    g.save(); if (pulse > 0) { g.save(); g.fillStyle = 'rgba(125,255,176,' + (.35 * pulse).toFixed(3) + ')'; g.shadowColor = 'rgba(125,255,176,1)'; g.shadowBlur = 40 * pulse; g.beginPath(); g.arc(x, y, 6 + 16 * pulse, 0, TAU); g.fill(); g.restore(); }
    if (on > 0) { g.shadowColor = 'rgba(125,255,176,.9)'; g.shadowBlur = 18 * on; g.fillStyle = 'rgba(125,255,176,' + (.35 + .65 * on).toFixed(2) + ')'; }
    else { var b = .45 + .4 * Math.max(0, osc(t, 24, ph || 0)); g.shadowColor = 'rgba(255,70,60,.8)'; g.shadowBlur = 8; g.fillStyle = 'rgba(255,70,60,' + b.toFixed(2) + ')'; }
    g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); g.restore();
  }
  function disc(g, x, y, r, sy0, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(1, sy0);
    var gr = g.createLinearGradient(-r, -r, r, r); gr.addColorStop(0, '#f6f1e6'); gr.addColorStop(.45, '#d9d4cb'); gr.addColorStop(.55, '#fff9ee'); gr.addColorStop(1, '#bfb9ae');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(21,26,38,.35)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(21,26,38,.2)'; g.beginPath(); g.arc(0, 0, r * .36, 0, TAU); g.fill();
    g.fillStyle = BG; g.beginPath(); g.arc(0, 0, r * .14, 0, TAU); g.fill();
    g.restore();
  }

  /* ---------- the hero: where the GTA 5 case is ---------- */
  function caseAt(t) {
    var x = C5.x + C5.w / 2, yb = FLOOR[0], rot = 0, sc = 1;
    if (t < .6) x += 150 * (1 - cd(t, -.45, 5.5));
    [[T.hop1L, T.hop1, 0, 1], [T.hop2L, T.hop2, 1, 2]].forEach(function (h) {
      if (t >= h[0]) { var u = seg(t, h[0], h[1]); yb = lerp(FLOOR[h[2]], FLOOR[h[3]], eio(u)) - 90 * Math.sin(Math.PI * u); rot = -.14 * Math.sin(Math.PI * u); sc = kn(t, h[1], .06); }
    });
    return { x: x, yb: yb, rot: rot, sc: sc };
  }
  function drawCase(g, pc, x, yb, rot, sc, glow) {
    g.save(); g.translate(x, yb - C5.h / 2); g.rotate(rot); g.scale(sc, sc);
    if (glow > 0) { g.save(); g.shadowColor = 'rgba(255,207,90,' + (.9 * glow).toFixed(2) + ')'; g.shadowBlur = 50 * glow; g.fillStyle = 'rgba(255,207,90,' + (.5 * glow).toFixed(2) + ')'; rr(g, -C5.w / 2, -C5.h / 2, C5.w, C5.h, 9); g.fill(); g.restore(); }
    putW(g, pc, 0, 0); g.restore();
  }

  /* ---------- the room: wall, lamp, TV glow, bookcase, desk (bleeds the frame) ---------- */
  var MOTES = (function () { var r = mulberry(12), o = []; for (var i = 0; i < 46; i++) o.push({ x: -60 + r() * 520, y: 380 + r() * 980, r: 1.2 + r() * 2.2, k: 1 + Math.floor(r() * 3), ph: r() * TAU, a: .12 + r() * .25 }); return o; })();
  function room(g, t) {
    var lampK = 1 - .45 * bump2(t, T.panA, T.panB);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0d1722'); gr.addColorStop(.5, '#142230'); gr.addColorStop(1, '#0a1018'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.save(); toCam(g);
    /* wallpaper stripes */
    g.fillStyle = 'rgba(160,190,220,.035)'; for (var x = -700; x < 2700; x += 64) g.fillRect(x, -400, 22, 2400);
    /* warm lamp pool on the wall, left of the bookcase; cool TV glow on the right */
    var fl = 1 + .05 * osc(t, 13, .3) + .03 * osc(t, 29, 1.1);
    var lg = g.createRadialGradient(-40, 640, 40, -40, 640, 900); lg.addColorStop(0, 'rgba(255,186,110,' + (.38 * lampK * fl).toFixed(3) + ')'); lg.addColorStop(1, 'rgba(255,186,110,0)'); g.fillStyle = lg; g.fillRect(-1000, -400, 2200, 2400);
    var hit = 0; EV.forEach(function (e) { if (t >= e.t && t < e.t + .6) hit = Math.max(hit, Math.exp(-(t - e.t) * 7)); });
    var tv = .5 + .5 * osc(t, 17, .9), tg = g.createRadialGradient(1060, 820, 30, 1060, 820, 760); tg.addColorStop(0, 'rgba(90,150,255,' + (.16 + .08 * tv + .2 * hit).toFixed(3) + ')'); tg.addColorStop(1, 'rgba(90,150,255,0)'); g.fillStyle = tg; g.fillRect(300, -400, 1600, 2400);
    /* floor */
    floorAndLamp(g, t, lampK, fl, hit);
    put(g, P.bk, 0, 0);
    /* the desk to the right, for the PC beat */
    put(g, P.desk, 0, 0);
    /* desk lamp pool on the desk wall */
    var dg = g.createRadialGradient(1610, 760, 40, 1610, 760, 620); dg.addColorStop(0, 'rgba(255,200,140,' + (.16 * lampK).toFixed(3) + ')'); dg.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = dg; g.fillRect(1000, 100, 1300, 1400);
    /* the lamp's light washes the bookcase from the left */
    g.save(); g.globalCompositeOperation = 'soft-light'; var wg = g.createLinearGradient(BK.x0, 0, BK.x1, 0); wg.addColorStop(0, 'rgba(255,190,120,' + (.5 * lampK).toFixed(2) + ')'); wg.addColorStop(1, 'rgba(255,190,120,0)'); g.fillStyle = wg; g.fillRect(BK.x0, BK.top, BK.x1 - BK.x0, FLOOR[0] + 70 - BK.top); g.restore();
    /* dust in the lamp light */
    MOTES.forEach(function (m) { var mx = m.x + 30 * osc(t, m.k, m.ph), my = m.y - 40 * osc(t, m.k + 1, m.ph * 1.3); g.fillStyle = 'rgba(255,230,190,' + (m.a * lampK).toFixed(3) + ')'; g.beginPath(); g.arc(mx, my, m.r, 0, TAU); g.fill(); });
    g.restore();
  }

  /* the room around the bookcase: a floor lamp on the left wall, a TV's edge on the right, floorboards, a rug, a plant and a stack of books */
  var FLOORY = FLOOR[0] + BOARD + 40;
  function floorAndLamp(g, t, lampK, fl, hit) {
    var fg = g.createLinearGradient(0, FLOORY, 0, FLOORY + 700); fg.addColorStop(0, '#2a180d'); fg.addColorStop(1, '#0c0705'); g.fillStyle = fg; g.fillRect(-1200, FLOORY, 4400, 900);
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 3; for (var y = FLOORY + 30, k = 0; y < FLOORY + 700; y += 34 + k * 6, k++) { g.beginPath(); g.moveTo(-1200, y); g.lineTo(3200, y); g.stroke(); }
    var pool = g.createRadialGradient(80, FLOORY + 120, 20, 80, FLOORY + 120, 700); pool.addColorStop(0, 'rgba(255,186,110,' + (.32 * lampK * fl).toFixed(3) + ')'); pool.addColorStop(1, 'rgba(255,186,110,0)'); g.fillStyle = pool; g.fillRect(-700, FLOORY, 1600, 800);
    /* the bookcase's soft reflection and shadow on the boards */
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(510, FLOORY + 8, 430, 26, 0, 0, TAU); g.fill();
    /* rug: woven stripes in front of the shelf */
    g.save(); g.translate(510, FLOORY + 150); g.transform(1, 0, -.35, 1, 0, 0);
    g.fillStyle = '#5b2a26'; g.fillRect(-420, -70, 840, 300); g.fillStyle = '#c99a5a'; for (var i = 0; i < 6; i++) g.fillRect(-420, -50 + i * 50, 840, 8); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-420, -70, 840, 300);
    g.restore();
    /* floor lamp: pole, shade glowing */
    g.fillStyle = '#1a120c'; g.fillRect(36, 600, 10, FLOORY - 600); rr(g, -4, FLOORY - 12, 90, 14, 6); g.fill();
    g.save(); g.shadowColor = 'rgba(255,190,110,' + (.9 * lampK).toFixed(2) + ')'; g.shadowBlur = 60; g.fillStyle = 'rgba(255,214,150,' + (.9 * lampK * fl).toFixed(2) + ')';
    g.beginPath(); g.moveTo(-10, 520); g.lineTo(92, 520); g.lineTo(118, 620); g.lineTo(-36, 620); g.closePath(); g.fill(); g.restore();
    /* plant in a pot on the left, books on the right */
    g.fillStyle = '#7a4b2e'; g.beginPath(); g.moveTo(-60, FLOORY - 120); g.lineTo(80, FLOORY - 120); g.lineTo(62, FLOORY + 10); g.lineTo(-42, FLOORY + 10); g.closePath(); g.fill();
    var lr = mulberry(31); for (i = 0; i < 9; i++) { var a = -1.9 + i * .22 + (lr() - .5) * .2, L = 140 + lr() * 120, sw2 = .04 * osc(t, 2 + (i % 3), i); g.save(); g.translate(10, FLOORY - 118); g.rotate(a + Math.PI / 2 + sw2); g.fillStyle = i % 2 ? '#3f6b3a' : '#4f8248'; g.beginPath(); g.ellipse(0, -L / 2, 18, L / 2, 0, 0, TAU); g.fill(); g.restore(); }
    [['#3d5a80', 210], ['#b5523b', 180], ['#d9c49a', 230], ['#2f3b52', 200]].forEach(function (b, j) { g.fillStyle = b[0]; g.fillRect(960 - b[1] / 2 + j * 6, FLOORY - 28 * (j + 1), b[1], 26); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(960 - b[1] / 2 + j * 6, FLOORY - 28 * (j + 1), b[1], 3); });
    /* the TV's dark edge on the right wall, its screen light pulsing on every hit */
    g.fillStyle = '#05070b'; rr(g, 960, 640, 420, 260, 8); g.fill(); var sg = g.createLinearGradient(960, 0, 1100, 0); sg.addColorStop(0, 'rgba(110,170,255,' + (.25 + .35 * hit).toFixed(3) + ')'); sg.addColorStop(1, 'rgba(110,170,255,0)'); g.fillStyle = sg; g.fillRect(964, 646, 140, 248);
  }

  /* ---------- the shelf layer: slabs, discs, ghosts, the cases (world space) ---------- */
  function slabX(i, t) { var tin = i === 0 ? -9 : T.slabIn[i]; return SL.x + 760 * (1 - cd(t, tin, 9)); }
  function shelves(g, t) {
    var i, lights = [0, 1, 2].map(function (j) { return seg(t, T.L[j], T.L[j] + .18) * (1 - offK(t, j)); });
    hookLight(g, t);
    /* strip lights under each board (bottom, mid, top) for "three console generations" */
    lights.forEach(function (lk, j) {
      if (lk <= 0) return; var yt = j === 2 ? BK.top + 30 : FLOOR[j + 1] + BOARD;
      var gg = g.createLinearGradient(0, yt, 0, FLOOR[j]); gg.addColorStop(0, 'rgba(255,214,150,' + (.42 * lk).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(255,214,150,0)'); g.fillStyle = gg; g.fillRect(IN0, yt, IN1 - IN0, FLOOR[j] - yt);
      g.fillStyle = 'rgba(255,236,200,' + (.95 * lk).toFixed(3) + ')'; g.fillRect(IN0 + 10, yt, IN1 - IN0 - 20, 5);
    });
    /* chalk outlines where the next consoles and the case will stand */
    [1, 2].forEach(function (j) {
      var k = seg(t, T.chalk[j], T.chalk[j] + .75), aS = 1 - seg(t, T.slabIn[j] + .2, T.slabIn[j] + .5), aC = 1 - seg(t, j === 1 ? T.hop1 - .1 : T.hop2 - .1, j === 1 ? T.hop1 + .15 : T.hop2 + .15);
      chalk(g, SL.x, FLOOR[j] - SL.h, SL.w, SL.h, k, aS);
      chalk(g, C5.x, FLOOR[j] - C5.h, C5.w, C5.h, seg(t, T.chalk[j] + .3, T.chalk[j] + 1.0), aC);
    });
    /* GTA 6 is planted on the top shelf at frame 0, under its own small spot; it lifts out as the story starts */
    var p6 = 1 - seg(t, T.lift6, T.lift6 + .3);
    if (p6 > 0) { var sp6 = g.createRadialGradient(C6.x + 75, FLOOR[2] - 60, 10, C6.x + 75, FLOOR[2] - 60, 230); sp6.addColorStop(0, 'rgba(255,170,130,' + (.34 * p6).toFixed(3) + ')'); sp6.addColorStop(1, 'rgba(255,170,130,0)'); g.fillStyle = sp6; g.fillRect(C6.x - 160, BK.top + 30, 470, FLOOR[2] - BK.top - 30);
      g.fillStyle = 'rgba(255,190,150,' + (.22 * p6).toFixed(3) + ')'; g.beginPath(); g.ellipse(C6.x + 75, FLOOR[2] - 2, 110, 10, 0, 0, TAU); g.fill(); }
    /* the 2013 disc, half into the PS3-era slab's top slot from frame 0 (the game is being played); it drops home on "Xbox 360" */
    var dk = eio(seg(t, T.disc0, T.disc0 + .3));
    if (dk < 1) { g.save(); g.beginPath(); g.rect(SL.x, BK.top, SL.w, FLOOR[0] - SL.h - 4 - BK.top); g.clip(); disc(g, SL.x + 240, FLOOR[0] - SL.h - 6 + 64 * dk, 48, 1, 1); g.restore(); }
    /* slabs, their LEDs and a glow on the back panel when they are on */
    for (i = 0; i < 3; i++) {
      if (i > 0 && t < T.slabIn[i] - .02) continue;
      var x = slabX(i, t), yb = FLOOR[i], on = i === 0 ? 1 : (t >= T.on[i] ? seg(t, T.on[i], T.on[i] + .2) : 0);
      if (i < 2) on *= 1 - offK(t, i);
      if (on > 0) { var bg = g.createRadialGradient(x + 160, yb - 60, 10, x + 160, yb - 60, 330); bg.addColorStop(0, 'rgba(125,255,176,' + (.12 * on).toFixed(3) + ')'); bg.addColorStop(1, 'rgba(125,255,176,0)'); g.fillStyle = bg; g.fillRect(Math.max(IN0, x - 200), yb - 300, Math.min(IN1, x + 520) - Math.max(IN0, x - 200), 300); }
      put(g, P.slab[i], x, yb - SL.h);
      if (t >= T.lab[i] - .02 && sy(yb) < 1440) {
        var lk = eo(seg(t, T.lab[i], T.lab[i] + .14)), ls0 = lerp(1.4, 1, lk) * kn(t, T.lab[i] + .12, .05), nr = NOREC; NOREC = nr || lk < 1;
        var hideK = (i === 2 ? 1 - seg(t, T.tg1 - .1, T.tg1 + .1) * (1 - seg(t, T.undim, T.undim + .25)) : 1) * (1 - seg(t, T.v[i] - .1, T.v[i] + .1)); if (hideK < 1) NOREC = true;
        var big = 1 + .25 * bigK(t);
        g.save(); g.globalAlpha *= fin(t, T.lab[i], .05) * hideK; g.translate(x + (i === 2 ? 8 + 143 : 16 + 110), yb - SL.h + 58 - 6 * (big - 1) / .25); g.rotate(-.015 + .05 * (1 - lk)); g.scale(ls0 * big, ls0 * big); putW(g, P.lab[i], 0, 0); g.restore(); NOREC = nr;
      }
      led(g, x + 306, yb - 24, on, t, i * 1.7, Math.max(bump(t, T.first + i * .15, .35), i === 0 ? bump(t, T.disc0 + .28, .45) : 0));
    }
    /* ghosts: where the case stood before each hop */
    [[T.hop1L, 0], [T.hop2L, 1]].forEach(function (h) {
      if (t < h[0] + .1) return; var lit = seg(t, T.L[h[1]], T.L[h[1]] + .15) * (1 - offK(t, h[1]));
      chalk(g, C5.x, FLOOR[h[1]] - C5.h, C5.w, C5.h, 1, .45 * seg(t, h[0] + .1, h[0] + .4) * (1 - lit), 'rgba(246,234,216,.6)');
      /* lit: the clean patch the case left in the dust on the back panel and the board (something stood here) */
      if (lit > 0) { var fb = 1 + .5 * bump(t, T.L[h[1]], .5); g.save(); g.globalAlpha *= lit;
        g.fillStyle = 'rgba(110,68,40,.42)'; rr(g, C5.x, FLOOR[h[1]] - C5.h, C5.w, C5.h, 6); g.fill();
        g.globalAlpha *= .5; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fill(); g.globalAlpha /= .5;
        g.fillStyle = 'rgba(255,214,160,' + (.16 * fb).toFixed(3) + ')'; g.fill();
        g.fillStyle = 'rgba(176,120,78,.9)'; g.fillRect(C5.x - 4, FLOOR[h[1]] - 3, C5.w + 8, 6);
        g.strokeStyle = 'rgba(30,16,8,.55)'; g.lineWidth = 2; g.setLineDash([3, 5]); rr(g, C5.x, FLOOR[h[1]] - C5.h, C5.w, C5.h, 6); g.stroke(); g.restore(); }
    });
    /* the 2022 copy: a disc rises out of the case, flips into a download arrow, a bar fills: digital */
    if (t >= T.disc3 && t < T.pull3 + .4) {
      var a3 = 1 - seg(t, T.pull3, T.pull3 + .35), p = eio(seg(t, T.disc3, T.disc3 + .5)), ax = lerp(621, 236, p), ay = lerp(FLOOR[2] - 120, FLOOR[2] + 13, p) - 70 * Math.sin(Math.PI * p), bs = lerp(1, .5, p);
      var fl = seg(t, T.disc3 + .5, T.disc3 + .75), cs = Math.abs(Math.cos(Math.PI * fl));
      g.save(); g.globalAlpha *= a3;
      if (fl < .5) { g.save(); g.translate(ax, ay); g.scale(cs * bs, bs); disc(g, 0, 0, 46, 1, 1); g.restore(); }
      else {
        g.save(); g.translate(ax, ay); g.scale(cs * bs, bs); g.fillStyle = TEAL; g.beginPath(); g.arc(0, 0, 46, 0, TAU); g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
        var bob = 5 * Math.sin(Math.max(0, t - T.disc3 - .75) * 9) * (1 - seg(t, T.done - .1, T.done));
        g.strokeStyle = CREAM; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(0, -24 + bob); g.lineTo(0, 18 + bob); g.moveTo(-15, 4 + bob); g.lineTo(0, 19 + bob); g.lineTo(15, 4 + bob); g.stroke(); g.restore();
        var bk = seg(t, T.disc3 + .75, T.disc3 + .95), fillK = eio(seg(t, T.disc3 + .8, T.done)), done = t >= T.done;
        g.globalAlpha *= bk; rr(g, 266, FLOOR[2] + 3, 240, 20, 10); g.fillStyle = 'rgba(11,17,25,.85)'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 3; g.stroke();
        rr(g, 269, FLOOR[2] + 6, 234 * fillK, 14, 7); g.fillStyle = done ? TEAL : HOT; g.fill();
      }
      g.restore();
    }
    /* the GTA 5 case, and GTA 6 dropping onto the top shelf */
    var c = caseAt(t), glow = Math.max(bump(t, T.glow, 1.6) * .9, seg(t, T.L[2], T.L[2] + .15) * (1 - seg(t, T.dim, T.dim + .4)) * .8);
    drawCase(g, P.c5, c.x, c.yb, c.rot, c.sc, glow);
    if (t < T.lift6 + .4) {
      var q6 = seg(t, T.lift6, T.lift6 + .36), nq = NOREC; NOREC = nq || q6 > 0;
      g.save(); g.globalAlpha *= 1 - seg(t, T.lift6 + .2, T.lift6 + .36);
      drawCase(g, P.c6, C6.x + C6.w / 2, lerp(FLOOR[2], FLOOR[2] - 470, q6 * q6), -.05 * q6, 1, .32 * (1 - q6));
      g.restore(); NOREC = nq;
    }
    if (t >= T.land6 - .4) {
      var u6 = seg(t, T.land6 - .36, T.land6), y6 = lerp(FLOOR[2] - 470, FLOOR[2], u6 * u6), nr6 = NOREC; NOREC = nr6 || u6 < 1;
      drawCase(g, P.c6, C6.x + C6.w / 2, y6, .05 * (1 - u6), kn(t, T.land6, .06), .7 * bump(t, T.date6, 1.4));
      NOREC = nr6;
    }
  }
  /* the lower two shelves go dark for "just one" */
  /* "just one": the bottom compartment's light clicks off, then the middle one's, 0.25 s apart; back on for the vote */
  function offK(t, j) { if (j > 1) return 0; var a = j === 0 ? T.off0 : T.off1; return seg(t, a, a + .05) * (1 - seg(t, T.undim, T.undim + .5)); }
  function dimLower(g, t) {
    [0, 1].forEach(function (j) { var k = offK(t, j); if (k <= 0) return;
      g.fillStyle = 'rgba(5,8,13,' + (.74 * k).toFixed(3) + ')'; g.fillRect(IN0 - 2, FLOOR[j + 1] + BOARD, IN1 - IN0 + 4, FLOOR[j] - FLOOR[j + 1] + (j === 0 ? 10 : 0)); });
    /* the hook: the PS4 shelf sits unlit while the PS3-era shelf plays */
    var hk = hookK(t) * (1 - seg(t, T.boxO - .3, T.boxO + .2));
    if (hk > 0) { g.fillStyle = 'rgba(5,8,13,' + (.4 * hk).toFixed(3) + ')'; g.fillRect(IN0 - 2, FLOOR[2] + BOARD, IN1 - IN0 + 4, FLOOR[1] - FLOOR[2] - BOARD); }
  }
  /* 1 through the hook and "when" (and the loop's run-up), fading as the camera pulls back on "So how many" */
  function hookK(t) { return 1 - seg(t, T.pullQ, T.pullQ + .9); }
  /* playing GTA 5 on the bottom shelf: the compartment brighter, a spot pool on the case, a flickering screen spill */
  function hookLight(g, t) {
    var k = hookK(t); if (k <= 0) return;
    var yt = FLOOR[1] + BOARD, yb = FLOOR[0];
    g.save(); g.beginPath(); g.rect(IN0, yt, IN1 - IN0, yb - yt); g.clip();
    var ex = g.createLinearGradient(0, yt, 0, yb); ex.addColorStop(0, 'rgba(255,214,160,' + (.2 * k).toFixed(3) + ')'); ex.addColorStop(1, 'rgba(255,214,160,' + (.07 * k).toFixed(3) + ')'); g.fillStyle = ex; g.fillRect(IN0, yt, IN1 - IN0, yb - yt);
    var cx5 = C5.x + C5.w / 2, sp = g.createRadialGradient(cx5, yb - 80, 10, cx5, yb - 80, 260); sp.addColorStop(0, 'rgba(255,226,170,' + (.42 * k).toFixed(3) + ')'); sp.addColorStop(1, 'rgba(255,226,170,0)'); g.fillStyle = sp; g.fillRect(IN0, yt, IN1 - IN0, yb - yt);
    var fl = .7 + .18 * osc(t, 53, .4) + .12 * osc(t, 97, 1.9) * osc(t, 31, .2);
    var tv = g.createRadialGradient(IN1 + 40, yb - 40, 20, IN1 + 40, yb - 40, 640); tv.addColorStop(0, 'rgba(150,200,255,' + (.36 * k * fl).toFixed(3) + ')'); tv.addColorStop(.5, 'rgba(255,190,140,' + (.12 * k * fl).toFixed(3) + ')'); tv.addColorStop(1, 'rgba(150,200,255,0)'); g.fillStyle = tv; g.fillRect(IN0, yt, IN1 - IN0, yb - yt);
    g.restore();
    /* the spill on the board in front */
    g.fillStyle = 'rgba(255,220,170,' + (.22 * k * fl).toFixed(3) + ')'; g.beginPath(); g.ellipse(cx5 - 60, yb + 6, 300, 12, 0, 0, TAU); g.fill();
  }
  /* the slab labels grow in the two wide shots ("how many generations", "three console generations") */
  function bigK(t) { return Math.max(seg(t, T.pullQ, T.pullQ + .6) * (1 - seg(t, start('gen2') - .3, start('gen2') + .2)), seg(t, T.pull3, T.pull3 + .6) * (1 - seg(t, T.off0 - .2, T.off0))); }
  /* the desk props: monitor and the wall calendar with its static date slips */
  function desk(g, t) {
    if (t < T.panA - .1 || t > T.panB + .6) return;
    var nr = NOREC; NOREC = nr || (t < T.panA + .5) || (t > T.panB);
    /* monitor: bezel, stand, screen */
    g.fillStyle = '#0c0f15'; rr(g, 1382, 1060, 456, 176, 12); g.fill(); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#1a1e27'; g.fillRect(1594, 1236, 32, 16); rr(g, 1530, 1248, 160, 10, 5); g.fill();
    put(g, P.mon, 1610, 1148);
    g.fillStyle = '#262b36'; rr(g, 1450, 1255, 320, 12, 4); g.fill();
    /* calendar */
    g.save(); g.translate(1610, 760); g.scale(1.25, 1.25); g.translate(-1610, -690);
    put(g, P.cal, 1610, 690); put(g, P.calH, 1610, 528);
    card(g, P.dJan, 1530, 618, -.02, T.jan, 1e9, t, { slam: true });
    card(g, P.dMar, 1530, 706, .015, T.mar, 1e9, t, { slam: true });
    card(g, P.dApr, 1610, 812, -.01, T.apr, 1e9, t, { slam: true });
    /* red marker strikes through the two moved dates, then circles the real one */
    g.save(); g.strokeStyle = RED; g.lineCap = 'round'; g.lineWidth = 9;
    [[T.janX, 618, 1530], [T.marX, 706, 1530]].forEach(function (s) { var k = eio(seg(t, s[0], s[0] + .22)); if (k <= 0) return; g.beginPath(); g.moveTo(s[2] - 168, s[1] + 8); g.lineTo(s[2] - 168 + 336 * k, s[1] - 6 + 4 * k); g.stroke(); });
    var ck = eio(seg(t, T.aprC, T.aprC + .3)); if (ck > 0) { g.lineWidth = 7; g.beginPath(); g.ellipse(1610, 812, 236, 66, -.03, -Math.PI * .6, -Math.PI * .6 + TAU * 1.05 * ck); g.stroke(); }
    g.restore();
    card(g, P.tt, 1822, 902, .05, T.tt, 1e9, t, { fromY: 40 });
    g.restore();
    NOREC = nr;
  }
  /* the cards and tags that carry dates and names, over everything on the shelves */
  function cards(g, t) {
    /* hook: the sealed PS4 box glides onto the mid shelf; its shipping label and GTA 5's date land in the pause */
    var bx = 300 + 260 * (1 - cd(t, -.6, 3.5)) + 1100 * eio(seg(t, T.boxO, T.boxO + .45));
    if (t < T.boxO + .5) { var nb = NOREC; NOREC = nb || t > T.boxO; put(g, P.box, bx, FLOOR[1] - 200 + 0, 0);
      var bd = .3 * hookK(t) * (1 - seg(t, T.cB - .1, T.cB + .1)); if (bd > 0) { g.fillStyle = 'rgba(5,8,13,' + bd.toFixed(3) + ')'; g.fillRect(bx, FLOOR[1] - 200, 300, 200); }
      card(g, P.cB, bx + 150, FLOOR[1] - 62, -.02, T.cB, 1e9, t, { slam: true }); NOREC = nb; }
    card(g, P.cA, 380, 1214, -.03, T.cA, T.cAO, t, { slam: true, tape: true, dir: -1 });
    card(g, P.c2, 380, 894, -.025, T.c2, T.panA - .05, t, { slam: true, tape: true, dir: -1, od: .3 });
    card(g, P.c3, 380, 586, .02, T.c3, T.pull3, t, { slam: true, tape: true, dir: -1, s: .85 });
    /* the hero stamp on the full bookcase */

    /* GTA 6's platforms: two tags swing down on strings from the top shelf, and the owner */
    [[P.tP, 296, T.tg1, -20], [P.tX, 372, T.tg2, 60]].forEach(function (q) {
      if (t < q[2] - .02 || t > T.plO + .45) return;
      var k = cd(t, q[2], 11), ko = eio(seg(t, T.plO, T.plO + .4)), ang = sw(t, q[2] + .1, .12, 6.5, 2.4) * (1 - ko), L = q[3] + 70 * k, nr = NOREC; NOREC = nr || k < .97 || ko > 0;
      g.save(); g.globalAlpha *= fin(t, q[2], .06) * (1 - ko); g.translate(q[1], BK.top + 30); g.rotate(ang);
      g.strokeStyle = 'rgba(246,234,216,.8)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, L - 10); g.stroke();
      putW(g, q[0], 0, L + q[0].h / 2 - 36 - 160 * ko); g.restore(); NOREC = nr;
    });
    card(g, P.ra, 420, FLOOR[2] + 16, -.01, T.ra, T.plO, t, { fromY: 40, dir: -1 });
    /* GTA 6's date */
    card(g, P.c6d, 366, 592, -.02, T.dc, T.dcO, t, { slam: true, tape: true, dir: -1 });
    /* the vote: four identical tags fan out of the GTA 5 case */
    P.v.forEach(function (pc, i) {
      var tin = T.v[i]; if (t < tin - .02) return;
      var tx = [366, 366, 366, 936][i], ty = [FLOOR[0] - 186, FLOOR[1] - 186, FLOOR[2] - 186, FLOOR[1] - 110][i], k = cd(t, tin, 12), nr = NOREC; NOREC = nr || k < .97;
      g.save(); g.globalAlpha *= fin(t, tin, .05); g.translate(lerp(621, tx, k), lerp(FLOOR[2] - 120, ty, k)); g.rotate((i % 2 ? .03 : -.03) * k + (i % 2 ? .6 : -.6) * (1 - k) + .012 * osc(t, 9, i)); g.scale(lerp(.3, 1, k), lerp(.3, 1, k));
      putW(g, pc, 0, 0); g.restore(); NOREC = nr;
    });
  }

  /* =====================================================================================================
     TIME AND STATE
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function stepv(t, v0, L) { var v = v0; for (var i = 0; i < (L || []).length; i++) { var s = L[i]; if (t < s[0]) break; v = lerp(v, s[1], eio(seg(t, s[0], s[0] + (s[2] || .5)))); } return v; }
  function bump2(t, a, b) { return seg(t, a, a + .35) * (1 - seg(t, b, b + .4)); }

  /* ---------- captions: paper tape in the upper third, phrase by phrase; the hook card is frame 0 and the last frame ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1, was: 1, will: 1, most: 1, has: 1, is: 1, did: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!]["”]?$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 400, CAPY_HOOK = 330;
  function capWord(w) { return w.w.toUpperCase().replace(/\.$/, ''); }
  function captions(g, t) {
    t = tq(t);
    var card0 = null, ci = -1;
    if (t >= T.loopCap) { card0 = CAPS[0]; ci = -1; }
    else CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = ci >= 0 ? CAPS[ci + 1] : null, ns = nx ? nx.s : T.loopCap, end = ci === 0 ? ns : Math.min(card0.t1 + .55, ns);
    if (ci >= 0 && t >= end) return;
    if (card0.id === 'three' && t >= T.st - .02) return;
    var k = ci === -1 ? cd(t, T.loopCap, 16) : (ci === 0 ? 1 : cd(t, card0.s, 16));
    g.save(); cond(g); var cpx = 76; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(capWord), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var lines, lw, maxw = 740, CXc = 510;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var Ln = lines.length - 1; if ((lw[Ln] + ws[i] > maxw || (card0.id === 'date' && i > 0 && /:$/.test(words[i - 1].w))) && lines[Ln].length) { lines.push([]); lw.push(0); Ln++; } lines[Ln].push(i); lw[Ln] += ws[i] + gap; }); }
    function fixLines() {
      for (var Ln = 0; Ln < lines.length - 1; Ln++) { var last = lines[Ln][lines[Ln].length - 1]; while (lines[Ln].length > 1 && GLUE[norm(words[last].w)]) { lines[Ln].pop(); lines[Ln + 1].unshift(last); last = lines[Ln][lines[Ln].length - 1]; } }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay2(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw) && cpx > 56) { cpx -= 4; font(g, cpx, 900); ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; lay2(); fixLines(); }
    var lh = cpx * 1.32, y0 = (card0.id === 'hook' ? CAPY_HOOK : CAPY) - (lines.length - 1) * lh / 2 + cpx * .36;
    lines.forEach(function (ln, li) {
      var tw = lw[li] - gap, x = CXc - tw / 2, y = y0 + li * lh + (1 - k) * 30, seed = Math.round(card0.t0 * 100) + li * 7;
      var r = mulberry(seed), x0 = x - 22, x1 = x + tw + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CXc, y); g.rotate(rot); g.translate(-CXc, -y);
      g.beginPath(); g.moveTo(x0, yt); for (var xx = x0; xx < x1; xx += 9) g.lineTo(xx, yt + (r() - .5) * 4); g.lineTo(x1, yt); g.lineTo(x1 + (r() - .5) * 6, (yt + yb) / 2); g.lineTo(x1, yb); for (xx = x1; xx > x0; xx -= 9) g.lineTo(xx, yb + (r() - .5) * 4); g.lineTo(x0, yb); g.lineTo(x0 + (r() - .5) * 6, (yt + yb) / 2); g.closePath();
      g.save(); g.shadowColor = 'rgba(6,3,18,.55)'; g.shadowBlur = 12; g.shadowOffsetX = 4; g.shadowOffsetY = 8; g.fillStyle = NEWS; g.fill(); g.restore();
      g.save(); g.clip(); g.globalAlpha *= .6; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0, yt - 4, x1 - x0, yb - yt + 8); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = ci >= 0 && stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .2;
        if (cur) { g.fillStyle = RED; g.fillRect(x - 6, y + cpx * .06, ws[i] + 12, cpx * .12); }
        g.fillStyle = cur ? RED : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }

  var NOISE, POSTERMODE = false, VIG = null;
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function vignette(g) {
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 900, 520, 510, 920, 1300); gr.addColorStop(0, 'rgba(4,6,12,0)'); gr.addColorStop(1, 'rgba(4,6,12,.6)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  /* the seam: a walnut cabinet door slides across the whole frame, and frame 0 is behind it */
  function door(g, t) {
    var sp = .2, k = seg(t, T.seamC - sp, T.seamC + sp); if (k <= 0 || k >= 1) return;
    var x = lerp(1090, -1340, eio(k));
    g.save(); g.translate(x, -20); put(g, P.door, 0, 0);
    var sg = g.createLinearGradient(-40, 0, 0, 0); sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,.5)'); g.fillStyle = sg; g.fillRect(-40, 0, 40, 1960);
    g.restore();
  }
  /* the payoff stamp in the caption slot, over the full bookcase, so every shelf stays visible */
  function stampTop(g, t) {
    if (t < T.st - .02 || t > T.stO + .4) return;
    var k = eo(seg(t, T.st, T.st + .14)), ko = eio(seg(t, T.stO, T.stO + .3)), sc = lerp(1.5, 1, k) * kn(t, T.st + .12, .05) * kn(t, T.bounce, .05), nr = NOREC; NOREC = nr || k < 1 || ko > 0;
    if (t >= T.st && t < T.st + .5) { g.save(); g.translate(510, 395); g.scale(1, .36); KIT.impact(g, 0, 0, t - T.st, 1.0, CORAL); g.restore(); }
    g.save(); g.globalAlpha *= fin(t, T.st, .05) * (1 - ko); g.translate(510 + 900 * ko, 395); g.rotate(-.03 + .08 * (1 - k)); g.scale(sc, sc); putW(g, P.st, 0, 0); g.restore(); NOREC = nr;
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(0, 0, W, H); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  /* the loop: from the seam on, the picture is the hook's run-up (t - DUR), so the last frame leads into frame 0 */
  function sceneT(t) { return t >= T.seamC ? t - DUR : t; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var st = sceneT(t); CAM = camAt(st);
    var nrF = NOREC; if ((st > T.panA - .05 && st < T.panA + .55) || (st > T.panB - .05 && st < T.panB + .5)) NOREC = true;
    if (LIVE2.bg) room(g, st);
    g.save(); railClip(g); toCam(g); shelves(g, st); dimLower(g, st); desk(g, st); cards(g, st); g.restore();
    if (LIVE2.bg) vignette(g);
    if (POSTERMODE) captions(g, .05); else if (LIVE.text) captions(g, t);
    stampTop(g, st);
    NOREC = nrF; door(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('cA', 'SEP 17, 2013', T.cA + .16, T.cAO); Tx('cA2', 'GTA 5 · TAKE-TWO', T.cA + .16, T.cAO);
    Tx('box', 'PS4', T.box + .55, T.boxO); Tx('cB', 'NOV 15, 2013', T.cB + .16, T.boxO); Tx('cB2', 'PS4 · SONY (US)', T.cB + .16, T.boxO);
    SLAB.forEach(function (S, i) { var e = i === 2 ? T.tg1 - .1 : (i === 0 ? T.off0 : T.off1); Tx('l' + i + 'a', S.n1, T.lab[i] + .14, e); Tx('l' + i + 'b', S.n2, T.lab[i] + .14, e); });
    Tx('c2', 'NOV 18, 2014', T.c2 + .16, T.panA); Tx('c22', 'TAKE-TWO', T.c2 + .16, T.panA);
    Tx('mon', 'PC', T.panA + .5, T.panB); Tx('mon2', 'NOT A CONSOLE GENERATION', T.panA + .5, T.panB); Tx('calH', 'GTA 5 · PC VERSION', T.panA + .5, T.panB);
    Tx('jan', 'JAN 27, 2015', Math.max(T.jan + .16, T.panA + .5), T.panB); Tx('mar', 'MAR 24, 2015', T.mar + .16, T.panB); Tx('apr', 'APR 14, 2015', T.apr + .16, T.panB); Tx('tt', 'TAKE-TWO', T.tt + .2, T.panB);
    Tx('c3', 'MAR 15, 2022', T.c3 + .16, T.pull3); Tx('c32', 'TAKE-TWO · DIGITAL', T.c3 + .16, T.pull3);
    Tx('st1', '3 GENERATIONS · 1 GAME', T.st + .16, T.stO);
    Tx('tP', 'PS5', T.tg1 + .25, T.plO); Tx('tX', 'XBOX SERIES X|S', T.tg2 + .25, T.plO); Tx('ra', 'ROCKSTAR · ANNOUNCED', T.ra + .25, T.plO);
    Tx('dc', 'NOV 19, 2026', T.dc + .16, T.dcO); Tx('dc2', 'ROCKSTAR', T.dc + .16, T.dcO);
    ['PS3 / 360', 'PS4 / ONE', 'PS5 / SERIES', 'PC'].forEach(function (s, i) { Tx('v' + i, s, T.v[i] + .25, T.seamC); });
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    T.seamC = DUR - .45; T.loopCap = DUR - .15;
    function F(id, t, type, gain) { GT[id] = t; EV.push({ t: t, type: type, g: gain == null ? 1 : gain, id: id }); return t; }
    /* hook: frame 0 = the case sliding into the bottom shelf; the sealed PS4 box glides onto the shelf above */
    T.box = .12; G('boxS', .02, 'swish', .1, .7);
    /* the pause after "PS4.": GTA 5's date slams on the bottom shelf, then the box's shipping label */
    T.cA = G('cA', after('hook'), 'slam', .3, 1.6); T.cB = G('cB', T.cA + .3, 'pin', .12, 1.3);
    /* when: the box leaves, the bottom slab gets its label and light, a disc slides in; it chirps in the pause */
    T.lab = []; T.on = []; T.slabIn = [-9, 0, 0]; T.chalk = [0, 0, 0];
    T.lab[0] = at('when', 'ps3') - .05; T.on[0] = T.lab[0] + .1;
    T.boxO = at('when', 'xbox') + .02; T.cAO = T.boxO;
    T.disc0 = at('when', 'xbox') - .05; T.lift6 = start('when') - .5;
    T.chirp0 = G('chirp0', after('when'), 'chirp', .3, 1.4);
    /* q: pull back to the whole bookcase; chalk outlines on the two empty shelves; the PS4-era slab slides into its outline in the pause */
    T.chalk[1] = at('q', 'how') - .05; T.chalk[2] = at('q', 'generations');
    T.slabIn[1] = G('slab1', after('q') + .05, 'thock', .3, 1.4) - .32;
    /* gen2: the date card on "November", label and light on "PS4"; the case hops up a shelf in the pause */
    T.c2 = at('gen2', 'november') - .05;
    T.lab[1] = at('gen2', 'ps4') - .05; T.on[1] = T.lab[1] + .1;
    T.hop1 = G('hop1', after('gen2') + .1, 'hop', .3, 1.8); T.hop1L = T.hop1 - .42;
    /* pc: whip pan to the desk; two dates stamped and struck, the real one slammed, circled in the pause */
    T.panA = Math.max(start('pc') - .02, T.hop1 + .25); G('panA', T.panA - .05, 'swish', .15, 1.2);
    T.tt = T.panA + .45;
    /* "It kept slipping": the two dates Take-Two's tables moved, each stamped with a thud in the short gaps, struck as it slips */
    T.jan = G('jan', at('pc', 'it') - .12, 'pin', .2, 2.2, { m: .05 }); T.janX = at('pc', 'kept') + .02;
    T.mar = G('mar', wend('pc', 'slipping') + .14, 'thock', .25, 2.2, { m: .08 }); T.marX = T.mar + .12;
    T.apr = at('pc', 'april') - .04; T.aprC = G('aprC', after('pc'), 'stamp', .35, 4.5);
    /* gen3: pan back on "March"; the top slab slides in, the card on "2022", the case hops up, the label on "PS5", the disc turns into a download */
    T.panB = Math.max(at('gen3', 'march') - .2, T.apr + .16 + 2.2);
    T.slabIn[2] = T.panB + .3;
    T.hop2 = G('hop2', wend('gen3', '2022') + .5, 'hop', .4, 1.8, { m: .04 }); T.hop2L = T.hop2 - .42;
    T.c3 = T.hop2 + .3;
    T.lab[2] = at('gen3', 'ps5') - .05; T.on[2] = T.lab[2] + .1;
    T.disc3 = at('gen3', 'and') - .05;
    T.done = G('done', after('gen3') - .1, 'blip', .3, 1.5, { m: .03 });
    /* three: pull back, the strip lights come on shelf by shelf, the case glows on "One game", the hero stamp in the pause */
    T.pull3 = start('three') - .1;
    T.L = [at('three', 'three') - .03, at('three', 'console') - .03, at('three', 'generations') - .03];
    T.glow = at('three', 'one') - .05;
    /* the hero stamp takes the caption slot just before "Three" and carries the line; the case hops in place in the pause after "One game" */
    T.st = G('st', start('three') - .2, 'stamp', .3, 2.2, { m: .03 }); T.bounce = G('bounce', after('three'), 'hop', .3, 1.0);
    /* but: GTA 6's spot is chalked on the top shelf; the lower shelves go dark on "just one"; the stamp peels; GTA 6 drops in the pause */
    T.out6 = at('but', 'gta') - .05; T.dim = at('but', 'just') - .05;
    /* GTA 6 drops back onto the top shelf on its own name; the lower lights click off in the pause, each with a relay tick */
    T.land6 = wend('but', '6') - .25;
    T.off0 = G('off0', wend('but', 'one') + .22, 'relay', .2, 1, { m: .04 }); T.off1 = G('off1', T.off0 + .25, 'relay', .12, .8, { m: .04 }); T.stO = Math.max(T.st + .16 + 2.75, start('but') - .2);
    /* plat: the owner, then the two platform tags swing down on their names */
    T.ra = at('plat', 'announced') - .12; T.tg1 = at('plat', 'ps5') - .05; T.tg2 = at('plat', 'xbox') - .05;
    G('tgS', wend('plat', 's') + .2, 'pin', .35, 3, { m: .04 });
    /* date: tags leave before "November"; the date card lands on it; GTA 6 glows */
    T.dc = G('dc', wend('date', '6') + .1, 'thock', .25, 2.4, { m: .03 }); T.plO = T.dc - .3; T.date6 = T.dc;
    T.dcO = Math.max(after('date') - .05, T.dc + .16 + 2.27);
    /* end: four identical vote tags fan out of the GTA 5 case */
    T.v = [0, 1, 2, 3].map(function (i) { return T.dcO + .06 + i * .1 + (i === 3 ? .45 : 0); }); G('vS', T.v[0] + .08, 'thock', .3, 2.4, { m: .03 });
    T.undim = start('end') - .3; T.first = at('end', 'first') - .05;
    G('seam', T.seamC - .14, 'door', .3, 12);
    /* camera keys: [time, value, duration] */
    T.pullQ = lastw('when') + .1;
    T.CS = [[0, 1.23, 2.6], [start('when') - .1, 1.53, 2.4], [T.pullQ, 1.15, 1.0], [T.slabIn[1] - .1, 1.2, 1.0], [T.panA, 1.0, .5], [T.panB, 1.08, .45], [T.pull3, 1.15, .8], [start('but'), 1.2, 2.0], [start('plat') - .3, 1.25, 1.1], [T.dc - .3, 1.1, 1.3], [at('date', '2026'), 1.06, 1.2], [start('end') - .3, 1.0, 1.2]];
    T.CYO = [[T.panB, 30, .45], [T.pull3, 0, .8], [start('plat') - .3, 262, 1.1], [T.dc - .3, 140, 1.3], [at('date', '2026'), 110, 1.2], [start('end') - .3, 0, 1.2]];
    T.CX = [[0, 548, 2.9], [start('when') - .1, 470, 2.4], [T.pullQ, 510, 1.0], [T.panA, 1610, .5], [T.panB, 510, .45], [start('plat') - .3, 530, 1.1], [start('end') - .3, 610, 1.2]];
    STRESS = [['hook', 'before'], ['when', '2013'], ['q', 'generations'], ['gen2', '2014'], ['pc', 'slipping'], ['gen3', '2022'], ['three', 'three'], ['but', 'one'], ['plat', 'announced'], ['date', 'november'], ['end', 'first']].map(function (p) { return at(p[0], p[1]); });
    CAPS[0].s = -1; CAPS[0].words = CAPS[0].words.filter(function (w) { return norm(w.w) !== 'came'; });
    CAPS.forEach(function (c) { if (c.id === 'but') { var L = c.words[c.words.length - 1]; L.w = L.w.replace(/\.$/, ''); c.words.push({ w: 'generation.', t0: L.t0, t1: L.t1 }); } });
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
  /* ---------- sound: room foley written into the pauses; no music (Isac adds a platform sound) ---------- */
  BODY.slam = .3; BODY.click = .08; BODY.pin = .1; BODY.snap = .14; BODY.tick = .04; BODY.hop = .16; BODY.chirp = .2; BODY.blip = .24; BODY.scrawl = .28; BODY.door = .3; BODY.relay = .05; BODY.thock = .12; BODY.stamp = .18; BODY.swish = .26;
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
    function stamp(t, g) { tick(t, 1.6 * g, 2400); thump(t, .7 * g); var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    function slamS(t, g) { thump(t, .7 * g, 210); tick(t, 1.6 * g, 1900); band(t, t + .07, 3200, 1500, .12 * g, .01 * g, .9); }
    function swish(t, g) { band(t, t + .26, 600, 3600, .09 * g, .02 * g, 1.3, -.2); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); }
    function pin(t, g) { tick(t, 1.4 * g, 2800); thump(t, .25 * g, 420); }
    /* the case hop: a hollow plastic case landing on wood (a knock, a box resonance, a click) */
    function hop(t, g) { thump(t, .55 * g, 180); band(t, t + .09, 900, 500, .16 * g, .02 * g, 2.5); tick(t, 1.2 * g, 2200); tick(t + .035, .5 * g, 2600); }
    /* a console power-on chirp: two short rising sine notes */
    function chirp(t, g) { osc2('sine', 1180, t, t + .09, [[t, 0], [t + .005, .09 * g], [t + .07, 0]]); osc2('sine', 1770, t + .08, t + .2, [[t + .08, 0], [t + .085, .08 * g], [t + .18, 0]]); }
    /* download complete: a soft rising triad blip */
    function blip(t, g) { [[880, 0], [1108, .06], [1320, .12]].forEach(function (n) { osc2('triangle', n[0], t + n[1], t + n[1] + .14, [[t + n[1], 0], [t + n[1] + .004, .09 * g], [t + n[1] + .12, 0]]); }); }
    /* a marker circling a date */
    function scrawl(t, g) { band(t, t + .28, 2600, 4200, .05 * g, .03 * g, 3, .2); tick(t, .5 * g, 3000); }
    /* the cabinet door: a wooden slide and a soft stop */
    /* a relay: a dry click with a small body */
    function relay(t, g) { tick(t, 1.3 * g, 1700); thump(t, .18 * g, 340); }
    function doorS(t, g) { band(t, t + .3, 300, 1400, .1 * g, .03 * g, .8, -.3, 'lowpass'); thump(t + .26, .3 * g, 160); }
    var LEVEL = { stamp: 1, slam: 1, swish: 22, thock: 5, pin: 4, hop: 3, chirp: 6, blip: 6, scrawl: 10, door: 6, relay: 4 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = window.SFX_TYPE_DB || { stamp: -20, slam: -16, swish: -17.5, thock: -21, pin: -21, hop: -16, chirp: -12, blip: -12, scrawl: -16, door: -16, relay: -21 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'stamp') stamp(e.t, g);
      else if (e.type === 'slam') slamS(e.t, g);
      else if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'pin') pin(e.t, g);
      else if (e.type === 'hop') hop(e.t, g);
      else if (e.type === 'chirp') chirp(e.t, g);
      else if (e.type === 'blip') blip(e.t, g);
      else if (e.type === 'scrawl') scrawl(e.t, g);
      else if (e.type === 'door') doorS(e.t, g);
      else if (e.type === 'relay') relay(e.t, g);
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”’·→…#?‹|~$+—½@&!'); })).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures();
      window.READY = true;
    });
  }

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-generations', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.L[2] + .45) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'Before the PS4', t0: 0, t1: start('when') }, { id: 'gen1', name: '2013', t0: start('when'), t1: start('q') }, { id: 'gen2', name: '2014', t0: start('q'), t1: start('pc') }, { id: 'pc', name: 'PC', t0: start('pc'), t1: start('gen3') }, { id: 'gen3', name: '2022', t0: start('gen3'), t1: start('three') }, { id: 'three', name: 'Three generations', t0: start('three'), t1: start('but') }, { id: 'gta6', name: 'GTA 6', t0: start('but'), t1: start('end') }, { id: 'end', name: 'Vote', t0: start('end'), t1: DUR }]; };

  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the room off and no clip, every prop shape and glyph must stay inside x 90-930 and above y 1450.
     The two whip pans and the seam door are camera moves across the frame and are skipped. */
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 1; var bad = [], n = Math.round(DUR * fps);
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false; var lt = LIVE.text; LIVE.text = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0b) + Math.abs(d[i + 1] - 0x11) + Math.abs(d[i + 2] - 0x19) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
    for (var i = 0; i < n; i++) {
      var t = (i + .5) / fps, st = sceneT(t);
      if ((st > T.panA - .05 && st < T.panA + .55) || (st > T.panB - .05 && st < T.panB + .5) || (t > T.seamC - .25 && t < T.seamC + .25)) continue;
      frame(ctx, t);
      var L0 = dirty(0, 0, 90, H), R0 = dirty(930, 0, 150, H), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0.c + B0.c > 0) bad.push({ f: i, t: +t.toFixed(3), left: L0.c && [L0.c, L0.x0, L0.y0, L0.y1], right: R0.c && [R0.c, R0.x1 + 930, R0.y0, R0.y1], bottom: B0.c && [B0.c, B0.y1, B0.x0 + 90, B0.x1 + 90] });
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; LIVE.text = lt; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
