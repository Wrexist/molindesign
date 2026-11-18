/* "GTA Online outlived its launch consoles.": Delta, GTA history.
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). Facts (BRIEF.md): Rockstar Newswire, Sept 2013: "working around the clock to buy and add more servers",
   "the first few days even more temperamental than such things usually are". Take-Two: GTA Online launched Oct 1 2013
   on PS3 and Xbox 360. NBC News, Oct 1 2013: "suffered from lags and complete outages". Rockstar shut the PS3 and Xbox
   360 versions on Dec 16 2021 (VGC). Strauss Zelnick, Feb 2026: "I have every reason to believe we'll continue to
   support GTA Online." The set is a paper server closet; the native move is the unplug. Engine helpers from
   film/gta-firsts. No logos, console likenesses, footage or music. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0b0820', CREAM = '#fbf0ea';
  var HOT = '#ffcf33', TEAL = '#5fa8d3', ORG = '#e8743b';
  var INK = '#1a2036', PAPER = '#f2e5cd', NEWS = '#efe5cf', KRAFT = '#b8834b', KRAFT2 = '#8a5a2e', BENCH = '#1c1042';
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

  BODY.tear = .1; BODY.thock = .12; BODY.pop = .1; BODY.stamp = .18; BODY.swish = .26; BODY.slap = .1;

  /* =====================================================================================================
     THE SET: a paper server closet. A slate-green pegboard wall, one cut-card server rack with blinking
     LEDs, and two generic launch consoles on a metal cabinet, cabled into the rack. The native move is
     the unplug: in 2021 both cables yank out of the rack, the consoles go dark and sink behind the
     cabinet lip, then newer boxes rise and plug in while the rack keeps blinking. No logos, no console
     likenesses, no footage, no music.
     ===================================================================================================== */
  var INK2 = '#24304f', RED = '#e23d3d', AMBER = '#ffb547';
  var PEG = '#1f3d40', RACKC = '#1b1f25', UNITC = '#2b323b', CAB = '#39424b', LIP = '#7d8994';
  var LEDG = '#62f59c', LEDR = '#ff4a3d';
  var RX0 = 330, RX1 = 690, RTOP = 560, SLOT0 = 620, SLOTH = 72, NSLOT = 8, RBOT = SLOT0 + NSLOT * SLOTH + 40;
  var EMPTY = [1, 2, 4], SHELFY = 1290;
  var PEGC = null;
  function buildPeg() {
    var w = 1400, h = 2700, c = mk(w, h), g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a3336'); gr.addColorStop(.5, PEG); gr.addColorStop(1, '#173032'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.globalAlpha = .55; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, w, h); g.restore();
    for (var y = 24; y < h; y += 48) for (var x = 24; x < w; x += 48) {
      g.fillStyle = 'rgba(8,16,18,.85)'; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(190,230,220,.14)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y + 1, 8, .2, Math.PI - .2); g.stroke();
    }
    return c;
  }
  /* the camera: the whole closet at S0 about the shelf, then zoom z, a screen offset ox, a screen y for the shelf (sy),
     the pegboard's own drift (pg) and a focus blur (bl) for the beats where a card is the hero */
  var S0 = 1.205;
  function camAt(t) {
    var k0 = eio(seg(t, 0, 1.7));
    return { z: stepv(t, lerp(1.045, 1, k0), T.Z), sy: stepv(t, lerp(1430, 1400, k0), T.SY), ox: stepv(t, 0, T.OX), bl: stepv(t, 0, T.BL), pg: stepv(t, lerp(-330, 0, eio(seg(t, 0, 1.25))), T.PG) };
  }
  function camApply(g, c) { g.translate(510 + c.ox, c.sy); g.scale(S0 * c.z, S0 * c.z); g.translate(-510, -SHELFY); }
  function ledOn(t, a, b) { var q = Math.floor((t + 40) * 7 + a * 3.7); return hash(a * 31 + b * 7 + q) > .28; }
  function drawUnit(g, x0, y0, w, h, t, si, dim, red) {
    rr(g, x0, y0, w, h, 4); g.fillStyle = shade(UNITC, dim); g.fill(); g.strokeStyle = 'rgba(220,235,240,' + (.35 * dim).toFixed(2) + ')'; g.lineWidth = 2; g.stroke();
    g.save(); rr(g, x0, y0, w, h, 4); g.clip(); g.globalAlpha *= .35; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0, y0, w, h); g.restore();
    /* vent slits and two drive bays */
    g.fillStyle = 'rgba(8,10,14,.75)';
    for (var i = 0; i < 7; i++) g.fillRect(x0 + 18 + i * 13, y0 + 16, 6, h - 32);
    rr(g, x0 + 130, y0 + 14, 70, h - 28, 3); g.fillStyle = shade('#3a434e', dim); g.fill();
    rr(g, x0 + 208, y0 + 14, 70, h - 28, 3); g.fill();
    /* LEDs */
    for (var k = 0; k < 4; k++) {
      var on = ledOn(t, si, k), col = red ? (hash(si * 13 + k + Math.floor((t + 40) * 11)) > .55 ? LEDR : '#5a1a16') : (on ? LEDG : '#1d4a33');
      var lx = x0 + w - 60 + (k % 2) * 24, ly = y0 + h / 2 - 12 + Math.floor(k / 2) * 24;
      g.fillStyle = col; g.beginPath(); g.arc(lx, ly, 6.5, 0, TAU); g.fill();
      if ((red && col === LEDR) || (!red && on)) { g.save(); g.globalAlpha *= .35 * dim; g.fillStyle = col; g.beginPath(); g.arc(lx, ly, 15, 0, TAU); g.fill(); g.restore(); }
    }
  }
  function unitIn(t, si) {
    var j = EMPTY.indexOf(si); if (j < 0) return 1;
    return T.uIn ? clamp(cd(t, T.uIn[j], 13), 0, 1) : 0;
  }
  function rack(g, t, dim, red) {
    /* shadow and body */
    g.save(); g.shadowColor = 'rgba(2,6,8,.6)'; g.shadowBlur = 30; g.shadowOffsetX = 10; g.shadowOffsetY = 16;
    rr(g, RX0, RTOP, RX1 - RX0, RBOT - RTOP, 10); g.fillStyle = shade(RACKC, dim); g.fill(); g.restore();
    rr(g, RX0, RTOP, RX1 - RX0, RBOT - RTOP, 10); g.strokeStyle = 'rgba(230,240,245,.5)'; g.lineWidth = 2.4; g.stroke();
    g.save(); rr(g, RX0, RTOP, RX1 - RX0, RBOT - RTOP, 10); g.clip(); g.globalAlpha *= .45; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(RX0, RTOP, RX1 - RX0, RBOT - RTOP); g.restore();
    /* rails with screw holes */
    g.fillStyle = shade('#2e353e', dim); g.fillRect(RX0 + 12, SLOT0 - 6, 16, NSLOT * SLOTH + 12); g.fillRect(RX1 - 28, SLOT0 - 6, 16, NSLOT * SLOTH + 12);
    g.fillStyle = 'rgba(6,8,10,.8)'; for (var s = 0; s < NSLOT * 3; s++) { g.beginPath(); g.arc(RX0 + 20, SLOT0 + 12 + s * SLOTH / 3, 3, 0, TAU); g.arc(RX1 - 20, SLOT0 + 12 + s * SLOTH / 3, 3, 0, TAU); g.fill(); }
    /* the units; the empty slots get theirs pushed in on "adding servers" */
    g.save(); g.beginPath(); g.rect(RX0 + 4, SLOT0 - 4, RX1 - RX0 - 8, NSLOT * SLOTH + 8); g.clip();
    for (var i = 0; i < NSLOT; i++) {
      var k = unitIn(t, i); if (k <= 0) continue;
      var y0 = SLOT0 + i * SLOTH + 4, sc = lerp(1.35, 1, k);
      g.save(); g.globalAlpha *= clamp(k * 3, 0, 1); g.translate(510, y0 + 32); g.scale(sc, sc); g.translate(-510, -(y0 + 32));
      drawUnit(g, RX0 + 34, y0, RX1 - RX0 - 68, SLOTH - 8, t, i, dim, red && EMPTY.indexOf(i) < 0);
      g.restore();
    }
    g.restore();
    /* side ports for the console cables */
    PORTS.forEach(function (p) { rr(g, p[0] - 16, p[1] - 14, 32, 28, 5); g.fillStyle = shade('#11151a', dim); g.fill(); g.strokeStyle = 'rgba(220,235,240,.4)'; g.lineWidth = 2; g.stroke(); });
  }
  /* consoles: generic boxes (no likeness) on the shelf in front of the rack: one dark slab and one pale box at
     launch, each with its paper name tag; later two newer generic boxes and a small PC tower */
  var CONS = [{ x0: 262, x1: 420, side: -1 }, { x0: 600, x1: 758, side: 1 }];
  var PORTS = [[372, 1100], [648, 1100]];
  function consoleBox(g, c, kind, lit, dim, sink, i, t) {
    var x0 = c.x0, x1 = c.x1, w = x1 - x0, h = kind === 'old' ? 120 : 104, y1 = SHELFY + sink, y0 = y1 - h;
    var body = kind === 'old' ? (c.side < 0 ? '#16171b' : '#e6e3da') : (c.side < 0 ? '#f0efe9' : '#22252b');
    var trim = kind === 'old' ? (c.side < 0 ? '#3b3e46' : '#b9b4a6') : (c.side < 0 ? '#c9ccd2' : '#3a3f48');
    g.save(); g.shadowColor = 'rgba(2,6,8,.55)'; g.shadowBlur = 18; g.shadowOffsetX = 6; g.shadowOffsetY = 8;
    rr(g, x0, y0, w, h, kind === 'old' ? 14 : 8); g.fillStyle = shade(body, dim); g.fill(); g.restore();
    rr(g, x0, y0, w, h, kind === 'old' ? 14 : 8); g.strokeStyle = 'rgba(240,245,248,.55)'; g.lineWidth = 2; g.stroke();
    g.save(); rr(g, x0, y0, w, h, 14); g.clip(); g.globalAlpha *= .4; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0, y0, w, h); g.restore();
    g.fillStyle = shade(trim, dim);
    if (kind === 'old') g.fillRect(x0 + 14, y0 + 16, w - 28, 6);
    else if (c.side < 0) {
      /* a pale upright-style box: vent grille up top and a thin light bar */
      for (var v = 0; v < 6; v++) g.fillRect(x0 + 16 + v * 12, y0 + 12, 6, 30);
      g.fillStyle = lit > 0 ? shade('#7fd8ff', dim) : shade('#55606b', dim); g.fillRect(x0 + 14, y0 + 50, w - 28, 5);
    } else {
      /* a dark box: horizontal vents and a disc slot */
      for (var v2 = 0; v2 < 3; v2++) g.fillRect(x0 + 14, y0 + 12 + v2 * 9, w - 60, 4);
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x0 + 18, y0 + 52, w - 50, 5);
    }
    var lx = c.side < 0 ? x1 - 20 : x0 + 20, ly = y1 - 16;
    g.fillStyle = lit > 0 ? LEDG : '#2a2e33'; g.beginPath(); g.arc(lx, ly, 6, 0, TAU); g.fill();
    if (lit > 0) { g.save(); g.globalAlpha *= .4 * lit; g.fillStyle = LEDG; g.beginPath(); g.arc(lx, ly, 15, 0, TAU); g.fill(); g.restore(); }
    /* the launch consoles carry their names on taped paper tags; each jolts on its spoken name */
    if (kind === 'old' && T.tagIn != null) {
      var pc = i ? P.tX : P.tP, ji = i ? T.jX : T.jP, jolt = 0;
      (ji || []).forEach(function (j) { if (t >= j && t < j + .5) jolt += -6 * Math.sin(Math.PI * seg(t, j, j + .22)); });
      var k = clamp(cd(t, T.tagIn + i * .12, 14), 0, 1); if (k <= 0) return;
      var nr = NOREC; NOREC = nr || k < .97;
      g.save(); g.globalAlpha *= fin(t, T.tagIn + i * .12, .06); g.translate((x0 + x1) / 2, y1 - 52 + jolt + (1 - k) * 30); g.rotate(i ? .03 : -.03); g.scale(1 / S0, 1 / S0); var nrT = NOREC; NOREC = nrT || sink > 0 || k < .97; putW(g, pc, 0, 0); NOREC = nrT; tape(g, 0, -28, 60, 18, .04); g.restore();
      NOREC = nr;
    }
  }
  function pcTower(g, t, dim, rise) {
    var x0 = 772, x1 = 846, y1 = SHELFY + rise, y0 = y1 - 176;
    g.save(); g.shadowColor = 'rgba(2,6,8,.55)'; g.shadowBlur = 16; g.shadowOffsetX = 6; g.shadowOffsetY = 8;
    rr(g, x0, y0, x1 - x0, y1 - y0, 6); g.fillStyle = shade('#2a2f37', dim); g.fill(); g.restore();
    rr(g, x0, y0, x1 - x0, y1 - y0, 6); g.strokeStyle = 'rgba(240,245,248,.5)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = shade('#151920', dim); for (var v = 0; v < 7; v++) g.fillRect(x0 + 12, y0 + 40 + v * 12, x1 - x0 - 24, 5);
    g.fillStyle = shade('#3c4350', dim); g.fillRect(x0 + 12, y0 + 14, x1 - x0 - 24, 12);
    g.fillStyle = LEDG; g.beginPath(); g.arc(x0 + 18, y1 - 18, 5, 0, TAU); g.fill();
  }
  /* a cable from a console's top to its rack port; the plug can be pulled (k 0..1): it whips up and out in an arc, then lies in front of the box */
  function cable(g, c, t, dim, plugK, sink, sway, i) {
    var port = PORTS[i], rest = c.side < 0 ? [c.x0 + 26, SHELFY - 128 + sink] : [c.x1 - 26, SHELFY - 128 + sink];
    var k = clamp(plugK, 0, 1), px = lerp(port[0], rest[0], k) + c.side * 34 * Math.sin(Math.PI * k), py = lerp(port[1], rest[1], k) - 175 * Math.sin(Math.PI * k);
    var sx = (c.x0 + c.x1) / 2 + c.side * -10, sy = SHELFY - 116 + sink;
    var mx = (sx + px) / 2, my = (sy + py) / 2, cx1 = lerp(mx + c.side * 40 + sway, mx + c.side * 30, k), cy1 = lerp(my - 10, sy - 60, k);
    g.save(); g.lineCap = 'round';
    g.strokeStyle = shade('#3a1d05', dim); g.lineWidth = 17; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(cx1, cy1, px, py); g.stroke();
    g.strokeStyle = shade('#ff9f1c', dim); g.lineWidth = 11; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(cx1, cy1, px, py); g.stroke();
    g.strokeStyle = 'rgba(255,240,200,' + (.45 * dim).toFixed(2) + ')'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx - 3, sy - 3); g.quadraticCurveTo(cx1 - 3, cy1 - 3, px - 3, py - 3); g.stroke();
    var ang = k < .02 ? -Math.PI / 2 : Math.atan2(py - cy1, px - cx1);
    g.translate(px, py); g.rotate(ang);
    rr(g, -30, -15, 36, 30, 6); g.fillStyle = shade('#2d333b', dim); g.fill(); g.strokeStyle = 'rgba(230,240,245,.7)'; g.lineWidth = 2.4; g.stroke();
    g.fillStyle = shade('#e8cf7a', dim); g.fillRect(6, -10, 11, 6); g.fillRect(6, 4, 11, 6);
    g.restore();
  }
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16), rr0 = n >> 16, gg = n >> 8 & 255, bb = n & 255;
    return 'rgb(' + Math.round(rr0 * k) + ',' + Math.round(gg * k) + ',' + Math.round(bb * k) + ')';
  }
  function bump2(t, a, b) { return seg(t, a, a + .35) * (1 - seg(t, b, b + .5)); }

  /* ---------- the world: the closet, through the camera; it bleeds the frame ---------- */
  function world(g, t) {
    var c = camAt(t), dim = 1 - .45 * bump2(t, T.dip0, T.dip1), red = t >= T.dip0 && t < T.dip1 + .3;
    var pz = lerp(1, c.z, .6);
    g.save(); g.translate(510, 960); g.scale(pz, pz); g.translate(-510 + c.ox * .6, -960);
    g.drawImage(PEGC, -160, -380 + c.pg); g.restore();
    g.save(); g.fillStyle = 'rgba(4,10,12,' + ((1 - dim) * .9).toFixed(3) + ')'; g.fillRect(0, 0, W, H); g.restore();
    var fl = .22 + .03 * Math.sin(t * 9) * (red ? 4 : 1); var lg = g.createRadialGradient(510, 520, 40, 510, 640, 900); lg.addColorStop(0, 'rgba(200,255,240,' + (fl * dim).toFixed(3) + ')'); lg.addColorStop(1, 'rgba(200,255,240,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
    g.save(); /* r2: no canvas blur filter (per-draw blur stalled the 16-sample render); the closet is dimmed behind the date card instead */
    camApply(g, c);
    rack(g, t, dim, red);
    var sp = g.createRadialGradient(510, 1250, 20, 510, 1250, 420); sp.addColorStop(0, red ? 'rgba(255,74,61,.22)' : 'rgba(98,245,156,.14)'); sp.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sp; g.fillRect(-200, 900, 1500, 700);
    if (T.nIn != null && t >= T.nIn + .3) pcTower(g, t, dim, 190 * (1 - clamp(cd(t, T.nIn + .3, 12), 0, 1)));
    CONS.forEach(function (cn, i) {
      var sway = 5 * Math.sin(t * 2.1 + i * 2);
      var yk = T.yank != null ? clamp(eo(seg(t, T.yank + i * .12, T.yank + i * .12 + .45)), 0, 1) : 0;
      var sink = T.sink != null ? 200 * eio(seg(t, T.sink + i * .1, T.sink + i * .1 + .55)) : 0;
      var lit = t < (T.yank || 1e9) + .2 + i * .12 ? 1 : 0;
      if (sink < 199) { cable(g, cn, t, dim * (lit ? 1 : .75), yk, sink, sway, i); consoleBox(g, cn, 'old', lit, dim * (lit ? 1 : .55), sink, i, t); }
      if (T.nIn != null && t >= T.nIn + i * .14) {
        var rise = 200 * (1 - clamp(cd(t, T.nIn + i * .14, 12), 0, 1)), pk = 1 - eio(seg(t, T.nPlug + i * .14, T.nPlug + i * .14 + .35));
        cable(g, cn, t, dim, pk, rise, sway, i); consoleBox(g, cn, 'new', t > T.nPlug + i * .14 + .35 ? 1 : 0, dim, rise, i, t);
      }
    });
    g.fillStyle = shade(LIP, dim); g.fillRect(-400, SHELFY, 1900, 22);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-400, SHELFY, 1900, 4);
    g.fillStyle = shade(CAB, dim); g.fillRect(-400, SHELFY + 22, 1900, 900);
    g.save(); g.globalAlpha *= .5; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(-400, SHELFY, 1900, 900); g.restore();
    g.fillStyle = 'rgba(10,14,18,.45)'; g.fillRect(-400, SHELFY + 150, 1900, 4);
    g.restore();
    if (c.bl > .01) { g.fillStyle = 'rgba(4,10,12,' + (.38 * c.bl).toFixed(3) + ')'; g.fillRect(0, 0, W, H); }
  }

  /* =====================================================================================================
     TIME AND STATE
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function stepv(t, v0, L) { var v = v0; for (var i = 0; i < (L || []).length; i++) { var s = L[i]; if (t < s[0]) break; v = lerp(v, s[1], eio(seg(t, s[0], s[0] + (s[2] || .5)))); } return v; }
  function taped(g, pc, x, y, rot0, tin, tout, t, o) {
    o = o || {}; var od = o.od || .4; if (t < tin - .02 || t > tout + od + .05) return;
    var k = cd(t, tin, o.w || 14), ko = eio(seg(t, tout, tout + od)), s = (o.s || 1) * (o.slam ? lerp(1.4, 1, eo(seg(t, tin, tin + .14))) * kn(t, tin + .12, .05) : 1) * (o.kick ? kn(t, o.kick, .08) : 1);
    var nr = NOREC; NOREC = nr || k < .97 || ko > 0 || (o.slam && t < tin + .16);
    g.save(); g.globalAlpha *= fin(t, tin, .06); g.translate(x + (o.dir || 1) * 1100 * ko + (1 - k) * (o.fromX || 0), y - 200 * ko + (1 - k) * (o.fromY == null ? -120 : o.fromY)); g.rotate(rot0 + (o.dir || 1) * .5 * ko + .2 * (1 - k)); g.scale(s, s);
    putW(g, pc, 0, 0);
    if (o.draw) o.draw(g, k, ko);
    if (o.tape !== false) tape(g, 0, -pc.h / 2 + 34, 90, 26, .05);
    g.restore(); NOREC = nr;
  }


  /* ---------- printed pieces ---------- */
  function buildTextures() { GRAIN = buildGrain(); PEGC = buildPeg(); buildSet(); }
  function credC(text, w) { return cardPiece(w, 66, INK2, [[text, 36, CREAM, 2]], { r: 6, ring: 'rgba(251,240,234,.5)' }); }
  function buildSet() {
    P.plate = cardPiece(300, 64, AMBER, [['GTA ONLINE', 44, INK, 3]], { r: 8, ring: 'rgba(29,18,51,.3)' });
    P.d13 = cardPiece(760, 360, CREAM, [['OCT 1, 2013', 150, INK, -50], ['WENT LIVE · PS3 · XBOX 360', 54, RED, 96]], { r: 10, ring: '#3aa58a' });
    P.tt = credC('TAKE-TWO', 260);
    P.tP = cardPiece(200, 80, CREAM, [['PS3', 58, INK, 3]], { r: 6, ring: '#3aa58a' });
    P.tX = cardPiece(232, 80, CREAM, [['XBOX 360', 54, INK, 3]], { r: 6, ring: '#3aa58a' });
    P.qW = buildStrip('“…even more temperamental…”', 700, 56, 21);
    P.cW = credC('ROCKSTAR NEWSWIRE · SEPT 2013', 560);
    P.qN = buildStrip('“…lags and complete outages.”', 700, 56, 33);
    P.cN = credC('NBC NEWS · OCT 1, 2013', 440);
    P.qS = buildStrip('“…buy and add more servers…”', 640, 54, 45);
    P.d21 = cardPiece(560, 220, CREAM, [['DEC 16, 2021', 82, INK, -40], ['PS3 + XBOX 360 VERSIONS', 40, RED, 32], ['SHUT DOWN', 40, RED, 76]], { r: 8, ring: '#3aa58a' });
    P.c21 = credC('ROCKSTAR, ANNOUNCED JUNE 2021 · VIA VGC', 680);
    P.tN = cardPiece(470, 66, CREAM, [['NEWER CONSOLES + PC', 44, INK, 3]], { r: 6, ring: '#3aa58a' });
    P.yr = cardPiece(420, 180, CREAM, [], { r: 10, ring: '#3aa58a' });
    P.yrL = cardPiece(330, 60, RED, [['SINCE OCT 2013', 42, CREAM, 3]], { r: 6, ring: 'rgba(255,240,234,.8)' });
    P.stR = buildStamp(['STILL RUNNING', '13 YEARS LATER'], 80, 540, RED);
    P.qZ = buildStrip('“…every reason to believe we’ll continue to support GTA Online.”', 310, 42, 57);
    P.cZ = cardPiece(310, 160, INK2, [['STRAUSS ZELNICK', 38, CREAM, -46], ['TAKE-TWO CEO', 38, CREAM, 2], ['FEB 2026', 38, CREAM, 50]], { r: 6, ring: 'rgba(251,240,234,.5)' });
    P.a6 = cardPiece(260, 130, CREAM, [['GTA 6', 72, INK, 4]], { r: 12, ring: '#3aa58a' });
    P.aO = cardPiece(330, 130, CREAM, [['GTA ONLINE', 64, INK, 4]], { r: 12, ring: '#3aa58a' });
    var tp3 = jag(311, 1100, 10), bt3 = jag(312, 1100, 10);
    P.sweepK = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp3[0][1]); tp3.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt3.length - 1; i >= 0; i--) g.lineTo(bt3[i][0], 1560 + bt3[i][1]); g.closePath(); }, PEG, { sx: 0, sy: 10, blur: 20, ps: .6, extra: function (g) { for (var y = 24; y < 1560; y += 48) for (var x = 24; x < 1100; x += 48) { g.fillStyle = 'rgba(8,16,18,.85)'; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); } } });
  }
  function w2s(c, x, y) { var S = S0 * c.z; return { x: 510 + c.ox + (x - 510) * S, y: c.sy + (y - SHELFY) * S, s: c.z }; }

  /* ---------- set-attached paper (moves with the camera): the rack plate, the newer-hardware tag ---------- */
  function setTags(g, t) {
    var c = camAt(t); g.save(); camApply(g, c);
    if (t >= T.plate - .02) { var k = cd(t, T.plate, 14), nr = NOREC; NOREC = nr || k < .97; g.save(); g.globalAlpha *= fin(t, T.plate, .06) * (1 - bump2(t, T.dip0, T.pb)) * (1 - bump2(t, T.pc0, T.pc1)); g.translate(510, 590 - (1 - k) * 60); g.rotate(-.02); putW(g, P.plate, 0, 0); g.restore(); NOREC = nr; }
    if (t >= T.tN - .02) { var k2 = cd(t, T.tN, 14), nr2 = NOREC; NOREC = nr2 || k2 < .97; g.save(); g.globalAlpha *= fin(t, T.tN, .06); g.translate(510, 1128 + (1 - k2) * 40); g.rotate(-.01); g.scale(1 / S0, 1 / S0); putW(g, P.tN, 0, 0); g.restore(); NOREC = nr2; }
    g.restore();
  }

  /* ---------- the prop layer (screen space, clipped to the rail) ---------- */
  function props(g, t) {
    var c = camAt(t);
    setTags(g, t);
    /* before launch: Rockstar's own words about servers, low on the rack while units go in */
    stripAt(g, P.qS, 510, 1060, -.015, T.qS, T.qSO, t, { from: -100, dur: .24 });
    taped(g, P.cW, 510, 1190, .01, T.qS + .25, T.qSO, t, { fromY: 30, tape: false, dir: -1, od: .24 });
    /* the warning */
    stripAt(g, P.qW, 510, 660, .015, T.qW, T.qWO, t, { from: 100, dir: 1, dur: .24 });
    /* launch day: the date card full width over the blurred closet, and its owner */
    taped(g, P.d13, 510, 860, -.02, T.d13, T.d13O, t, { slam: true, dir: -1 });
    taped(g, P.tt, 510, 1095, .01, T.d13 + .2, T.d13O, t, { fromY: 30, tape: false, dir: -1 });
    /* day one: the camera pushes into the red rack; NBC's words */
    stripAt(g, P.qN, 510, 590, -.02, T.qN, T.qNO, t, { from: -100 });
    taped(g, P.cN, 510, 700, .01, T.cN, T.qNO, t, { fromY: 30, tape: false, dir: -1 });
    /* 2021: the shutdown card high; the camera pushes onto the shelf; the plugs come out in the pause */
    taped(g, P.d21, 510, 690, .02, T.d21, T.d21O, t, { slam: true, dir: 1 });
    taped(g, P.c21, 510, 845, -.01, T.d21 + .2, T.d21O, t, { fromY: 30, tape: false, dir: 1 });
    /* thirteen years: digits roll with no label; the label pops when 2026 lands; both ride with the rack */
    var py = w2s(c, 510, 759);
    taped(g, P.yr, py.x, py.y, -.02, T.yr, T.yrO, t, { s: py.s, kick: T.yrL, dir: -1, draw: function (q, k) {
      var u = clamp(seg(tq(t), T.yr + .15, T.yrL), 0, 1), y = Math.round(lerp(2013, 2026, eio(u)));
      var nr = NOREC; NOREC = true; txt(q, String(y), 0, 8, { px: 120, col: u >= 1 ? INK : '#8b949c', align: 'center', ls: 2 }); NOREC = nr;
    } });
    taped(g, P.yrL, py.x, py.y - 100 * py.s, .03, T.yrL, T.yrO, t, { s: py.s, slam: true, tape: false, dir: -1 });
    var ps = w2s(c, 510, 1000);
    taped(g, P.stR, ps.x, ps.y, -.06, T.stR, T.stRO, t, { s: ps.s, slam: true, tape: false, dir: 1 });
    if (t >= T.stR && t < T.stR + .5) KIT.impact(g, ps.x, ps.y, t - T.stR, 1.4, RED);
    /* Take-Two's boss: the rack moves left, his sentence runs down the right */
    stripAt(g, P.qZ, 770, 740, .012, T.qZ, T.qZO, t, { from: 100, dir: 1 });
    taped(g, P.cZ, 770, 1010, -.01, T.qZ + .25, T.qZO, t, { fromY: 30, tape: false, dir: 1 });
    /* end: two identical answers, spread wide, neither highlighted */
    taped(g, P.a6, 235, 980, -.03 + .02 * osc(t, 9, 0), T.a6, T.seamC, t, { slam: true, tape: false, dir: -1 });
    taped(g, P.aO, 755, 980, .03 + .02 * osc(t, 9, 2), T.aO, T.seamC, t, { slam: true, tape: false, dir: 1 });
  }
  function pieceIn(g, pc, x, y, rot, s, tin, tout, t, o) {
    o = o || {}; if (t < tin - .02 || t > tout + (o.od || .4)) return;
    var k = o.slam ? eo(seg(t, tin, tin + .14)) : cd(t, tin, o.w || 13), ko = eio(seg(t, tout, tout + (o.od || .4)));
    var dx = (o.dir || -1) * 1100 * ko, dy = (o.dy == null ? -140 : o.dy) * ko;
    var fx = o.fromX == null ? 0 : o.fromX, fy = o.fromY == null ? -60 : o.fromY;
    var sc = s * (o.slam ? lerp(1.5, 1, k) * kn(t, tin + .12, .05) : 1);
    var nr = NOREC; NOREC = nr || k < .995 || ko > 0;
    g.save(); g.globalAlpha *= fin(t, tin, .06); g.translate(x + dx + (1 - k) * fx, y + dy + (1 - k) * fy); g.rotate(rot + (o.dir || -1) * .5 * ko + (o.slam ? .08 * (1 - k) : 0)); g.scale(sc, sc);
    putW(g, pc, 0, 0);
    g.restore(); NOREC = nr;
  }
  function stripAt(g, pc, x, y, rot, tin, tout, t, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .4) return;
    var k = cd(t, tin, 15), ko = eio(seg(t, tout, tout + (o.dur || .38)));
    var dx = (o.dir || -1) * 1200 * ko, dy = -120 * ko, rr0 = rot + (o.dir || -1) * .5 * ko;
    var nr = NOREC; NOREC = nr || k < .97 || ko > 0;
    g.save(); g.globalAlpha *= fin(t, tin, .06); g.translate(x + dx + (1 - k) * (o.from || 0), y + dy + (1 - k) * 40); g.rotate(rr0);
    putW(g, pc, -pc.sw / 2, -pc.sh / 2, 0, 1);
    NOREC = nr; g.restore();
  }
  function credit(g, text, x, y, tin, tout, t, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .3) return;
    var k = cd(t, tin, 15), nr = NOREC; NOREC = nr || k < .97 || t > tout;
    chip(g, text, x, y + (1 - k) * 30, { px: o.px || 38, bg: o.bg || INK2, fg: o.fg || CREAM, a: fin(t, tin, .08) * (1 - seg(t, tout, tout + .25)), rot: o.rot || 0, line: 'rgba(251,240,234,.5)' });
    NOREC = nr;
  }
  /* ---------- captions: paper tape in the upper third, phrase by phrase; the hook card is frame 0 and the last frame ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1, was: 1, will: 1, most: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]["”]?$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 400;
  function captions(g, t) {
    t = tq(t);
    var card0 = null, ci = -1;
    if (t >= T.loopCap) { card0 = CAPS[0]; ci = -1; }
    else CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = ci >= 0 ? CAPS[ci + 1] : null, ns = nx ? nx.s : T.loopCap, end = ci === 0 ? ns : Math.min(card0.t1 + .55, ns);
    if (ci >= 0 && t >= end) return;
    var k = ci === -1 ? cd(t, T.loopCap, 16) : (ci === 0 ? 1 : cd(t, card0.s, 16));
    g.save(); cond(g); var cpx = 76; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var lines, lw, maxw = 740, CXc = 510;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var Ln = lines.length - 1; if (lw[Ln] + ws[i] > maxw && lines[Ln].length) { lines.push([]); lw.push(0); Ln++; } lines[Ln].push(i); lw[Ln] += ws[i] + gap; }); }
    function fixLines() {
      for (var Ln = 0; Ln < lines.length - 1; Ln++) { var last = lines[Ln][lines[Ln].length - 1]; while (lines[Ln].length > 1 && GLUE[norm(words[last].w)]) { lines[Ln].pop(); lines[Ln + 1].unshift(last); last = lines[Ln][lines[Ln].length - 1]; } }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay2(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw) && cpx > 56) { cpx -= 4; font(g, cpx, 900); ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; lay2(); fixLines(); }
    var lh = cpx * 1.32, y0 = CAPY - (lines.length - 1) * lh / 2 + cpx * .36;
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
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 900, 520, 510, 920, 1300); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.6)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function sweep(g, t, tm, pc, sp) {
    sp = sp || .27; var k = seg(t, tm - sp, tm + sp); if (k <= 0 || k >= 1) return;
    var y = lerp(1980, -2150, eio(k));
    g.save(); g.translate(-10, y); g.rotate(-.03); g.scale(1, 1.32); put(g, pc || P.sweep, 0, 0); g.restore();
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  /* the loop: from the seam on, the picture is the hook's run-up (t - DUR), so the last frame leads into frame 0 */
  function sceneT(t) { return t >= T.seamC ? t - DUR : t; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var st = sceneT(t);
    if (LIVE2.bg) { world(g, st); vignette(g); }
    g.save(); railClip(g); props(g, st); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    g.save(); sweep(g, t, T.seamC, P.sweepK, .17); g.restore();
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('plate', 'GTA ONLINE', T.plate + .2, T.dip0); Tx('plate2', 'GTA ONLINE', T.pb + .4, T.pc0); Tx('plate3', 'GTA ONLINE', T.pc1 + .4, DUR - .5);
    Tx('tP', 'PS3', T.tagIn + .2, T.sink); Tx('tX', 'XBOX 360', T.tagIn + .32, T.sink);
    Tx('qS', '“…buy and add more servers…”', T.qS + .2, T.qSO); Tx('cW1', 'ROCKSTAR NEWSWIRE · SEPT 2013', T.qS + .45, T.qSO);
    Tx('qW', '“…even more temperamental…”', T.qW + .2, T.qWO);
    Tx('d13', 'OCT 1, 2013', T.d13 + .16, T.d13O); Tx('d13b', 'WENT LIVE · PS3 · XBOX 360', T.d13 + .16, T.d13O); Tx('tt', 'TAKE-TWO', T.d13 + .45, T.d13O);
    Tx('qN', '“…lags and complete outages.”', T.qN + .2, T.qNO); Tx('cN', 'NBC NEWS · OCT 1, 2013', T.cN + .25, T.qNO);
    Tx('d21', 'DEC 16, 2021', T.d21 + .16, T.d21O); Tx('d21b', 'PS3 + XBOX 360 VERSIONS SHUT DOWN', T.d21 + .16, T.d21O); Tx('c21', 'ROCKSTAR, ANNOUNCED JUNE 2021 · VIA VGC', T.d21 + .45, T.d21O);
    Tx('tN', 'NEWER CONSOLES + PC', T.tN + .2, T.seamC);
    Tx('yr', '2026', T.yrL, T.yrO); Tx('yrL', 'SINCE OCT 2013', T.yrL + .16, T.yrO);
    Tx('stR', 'STILL RUNNING 13 YEARS LATER', T.stR + .16, T.stRO);
    Tx('qZ', '“…every reason to believe we’ll continue to support GTA Online.”', T.qZ + .2, T.qZO); Tx('cZ', 'STRAUSS ZELNICK TAKE-TWO CEO FEB 2026', T.qZ + .45, T.qZO);
    Tx('a6', 'GTA 6', T.a6 + .14, T.seamC); Tx('aO', 'GTA ONLINE', T.aO + .14, T.seamC);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    T.seamC = DUR - .45; T.loopCap = DUR - .15;
    function F(id, t, type, gain) { GT[id] = t; EV.push({ t: t, type: type, g: gain == null ? 1 : gain, id: id }); return t; }
    G('h0', .02, 'swish', .1, .8);
    /* hook: the console name tags are on from frame 0 */
    T.tagIn = -1; /* r2: the PS3 / XBOX 360 tags sit on the consoles from frame 0 (and on the loop frame) */
    T.jP = [at('day1', 'ps3'), at('cut', 'ps3')]; T.jX = [at('day1', 'xbox'), at('cut', 'xbox')];
    /* servers: three units are pushed into the empty slots, Rockstar's words go up low */
    T.uIn = [at('servers', 'adding') - .05, at('servers', 'servers') - .05, 0];
    T.uIn[2] = G('u2', after('servers'), 'slap', .4, 1.4) - .12;
    T.qS = at('servers', 'rockstar') - .1;
    /* warn: the Newswire line; both Rockstar strips are torn off before the date lands */
    T.qW = lastw('servers') - .25; G('qWS', T.qW + .05, 'snap', .3, 1);
    T.qWO = vadEndBefore(start('day1'), lastw('warn') - .6); G('trW', T.qWO + .04, 'tear', .1, 1.2); T.qSO = T.qWO; /* r2: both strips gone before the date card lands */
    /* day1: the date card full width over the blurred closet; the rack plate */
    T.d13 = Math.max(G('d13S', start('day1') - .1, 'thock', .2, 1.4) - .05, T.qWO + .22);
    T.plate = at('day1', 'live') - .05;
    T.d13O = at('day1', '360') - .1; /* r2: the date card leaves as NBC's strip arrives (one read at a time) */
    /* day1b: the push into the red rack; NBC's words */
    T.dip0 = start('day1b') - .05; T.qN = at('day1', '360') - .05; G('qNS', T.qN + .05, 'snap', .3, 1);
    T.cN = T.d13O;
    G('spk', after('day1b'), 'crack', .4, 1.4);
    T.dip1 = start('cut') + .1;
    /* r2: the rack plate steps aside wherever a camera move would run it under the caption band */
    T.pb = at('cut', 'xbox') - .3; T.pc0 = start('still1') - .05; T.pc1 = start('still1') + .8;
    /* cut: the shutdown card; the camera pushes onto the shelf; plugs out in the pause, a power-down, the old consoles sink */
    T.d21 = G('d21S', start('cut') - .3, 'thock', .3, 1.4) - .05; T.qNO = T.d21 - .3;
    T.yank = G('yank', after('cut'), 'pop', .35, 1.6); G('yank2', T.yank + .14, 'pop', .2, 1.6);
    G('pdn', T.yank + .26, 'pdown', .25, 1);
    T.sink = T.yank + .55;
    T.d21O = start('still1') - .05;
    /* still1: newer boxes rise and plug in; the year rolls with no label */
    T.nIn = at('still1', 'kept') - .3; T.nPlug = T.nIn + .45; T.tN = T.nIn + .3;
    T.yr = start('still1') + .2; T.yrL = start('still') - .06; T.yrK = T.yrL;
    G('yrS', after('still1'), 'thock', .2, 1.2);
    G('nP', T.nPlug + .3, 'click', .3, 1.2);
    /* still: the stamp in the pause */
    T.stR = G('stR', after('still'), 'stamp', .45, 2.2);
    /* zel: the rack moves left, Zelnick's sentence on the right; torn off before the vote */
    T.qZ = start('still') + .1; G('qZS', T.qZ + .05, 'snap', .3, 1);
    T.qZO = G('trZ', after('zel'), 'tear', .2, 1.2) - .04; /* r2: torn off in the pause after "supporting it.", before the vote tags */
    T.stRO = T.qZO; T.yrO = T.qZO;
    /* end: two identical tags, spread wide */
    T.a6 = G('tA', T.qZO + .36, 'slap', .15, .8) - .12; T.aO = G('tB', T.a6 + .12 + .28, 'slap', .15, .8) - .12;
    G('seam', T.seamC - .12, 'swish', .3, 1.8);
    /* camera keys: [time, value, duration] */
    T.Z = [[2.6, 1.02, 3], [T.dip0, 1.2, 1.0], [start('cut') - .2, 1.0, .7], [at('cut', 'shut'), 1.3, 2.2], [T.yank + .02, 1.33, .12], [T.yank + .2, 1.3, .3], [start('still1') + .05, 1.0, .9], [start('still') - .1, .85, 1.0], [T.qZO + .1, 1.0, .7]];
    T.SY = [[T.dip0, 1440, 1.0], [start('cut') - .2, 1400, .7], [at('cut', 'shut'), 1230, 2.2], [start('still1') + .05, 1400, .9]];
    T.OX = [[start('still') - .1, -160, 1.0], [T.qZO + .1, 0, .7]];
    T.BL = [[T.d13 - .08, 1, .3], [T.d13O, 0, .4]];
    T.PG = [[1.3, -70, 3], [start('warn'), 30, 3], [T.dip0, -30, 2], [start('cut'), 70, 3], [start('still'), -50, 4], [start('zel'), 20, 4]];
    STRESS = [['hook', 'outlived'], ['servers', 'clock'], ['warn', 'temperamental'], ['day1b', 'outages'], ['cut', 'shut'], ['still', 'running'], ['zel', 'every'], ['end', 'longer']].map(function (p) { return at(p[0], p[1]); });
    CAPS[0].s = -1;
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
  /* ---------- sound: paper foley written into the pauses; no music (Isac adds a platform sound) ---------- */
  BODY.slam = .3; BODY.crack = .1; BODY.click = .08; BODY.pin = .1; BODY.riffle = .32; BODY.snap = .14; BODY.tick = .04; BODY.tear = .12; BODY.pdown = .38;
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
    /* the door slam: a wooden boom, a latch click and a short rattle of the frame */
    function slamS(t, g) { boom(t, .9 * g, 120, 42, .55); thump(t, .8 * g, 200); band(t, t + .35, 1100, 180, .2 * g, .03 * g, .7, 0, 'lowpass'); tick(t + .01, 1.8 * g, 1800); for (var j = 1; j < 5; j++) { tick(t + .05 + j * .045, .5 * g / j, 2400); thump(t + .05 + j * .045, .15 * g / j, 300); } }
    function crack(t, g) { for (var j = 0; j < 6; j++) tick(t + j * .011 + rnd() * .004, (.9 - j * .1) * g, 2600 + rnd() * 2000); band(t, t + .08, 3000, 1500, .08 * g, .01 * g, 1.5, .2); }
    function click(t, g) { tick(t, 1.3 * g, 3000); thump(t, .15 * g, 600); }
    function swish(t, g) { band(t, t + .26, 600, 3600, .09 * g, .02 * g, 1.3, -.2); }
    function tear(t, g) { for (var j = 0; j < 8; j++) tick(t + .012 * j + rnd() * .006, (.35 + rnd() * .4) * g, 1800 + rnd() * 2400); band(t, t + .1, 1400, 4200, .07 * g, .02 * g, 1.4, .15); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); }
    function pop(t, g) { thump(t, .3 * g, 320); tick(t, 1.1 * g, 2600); band(t, t + .06, 2400, 1200, .06 * g, .01 * g, 1.2); }
    function clank(t, g) { osc2('triangle', 1046, t, t + .2, [[t, 0], [t + .003, .14 * g], [t + .12, 0]]); osc2('triangle', 1568, t, t + .16, [[t, 0], [t + .003, .08 * g], [t + .1, 0]]); tick(t, 1.2 * g, 2600); tick(t + .07, .7 * g, 2600); osc2('triangle', 1175, t + .07, t + .2, [[t + .07, 0], [t + .073, .08 * g], [t + .16, 0]]); }
    function slap(t, g) { thump(t, .3 * g, 260); band(t, t + .06, 3000, 1500, .12 * g, .01 * g, .9); tick(t, 1.2 * g, 2000); }
    function pin(t, g) { tick(t, 1.4 * g, 2800); thump(t, .25 * g, 420); }
    function riffle(t, g) { for (var j = 0; j < 8; j++) { var tj = t + j * .018; tick(tj, (.5 + .5 * rnd()) * g, 2000 + rnd() * 1800); thump(tj, .06 * g, 500); } }
    function snapS(t, g) { tick(t, 2 * g, 2200); thump(t, .5 * g, 240); band(t, t + .07, 3600, 1800, .1 * g, .01 * g, 1.2); tick(t + .05, .6 * g, 3000); }
    function pdown(t, g) { var o = osc2('sine', 560, t, t + .42, [[t, 0], [t + .01, .3 * g], [t + .2, .18 * g], [t + .38, 0]]); o.frequency.exponentialRampToValueAtTime(70, t + .38); var o2 = osc2('triangle', 1120, t, t + .3, [[t, 0], [t + .01, .06 * g], [t + .25, 0]]); o2.frequency.exponentialRampToValueAtTime(140, t + .25); }
    function caseT(t, g) { tick(t, .9 * g, 1500); thump(t, .14 * g, 360); }
    var LEVEL = { stamp: 1, slam: 1, crack: 4, click: 4, swish: 22, tear: 18, thock: 5, pop: 11, clank: 6, slap: 3, pin: 4, riffle: 6, snap: 4, tick: 6, pdown: 1 };
    var TRIM = window.SFX_TRIM || { yank: 6, yank2: 8, pdn: 25 }; /* r2: the unplug is the hero sound (pops to about -8.5 dBFS, an audible power-down) */
    var TYPE_DB = window.SFX_TYPE_DB || { stamp: -16.5, slam: -6, crack: -14, click: -10.5, swish: -17.5, tear: -24, pop: -29.5, clank: -16, thock: -24.5, slap: -14, pin: -16, riffle: -16, snap: -24.5, tick: -20, pdown: -20 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'stamp') stamp(e.t, g);
      else if (e.type === 'slam') slamS(e.t, g);
      else if (e.type === 'crack') crack(e.t, g);
      else if (e.type === 'click') click(e.t, g);
      else if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'tear') tear(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'pop') pop(e.t, g);
      else if (e.type === 'clank') clank(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'pin') pin(e.t, g);
      else if (e.type === 'riffle') riffle(e.t, g);
      else if (e.type === 'snap') snapS(e.t, g);
      else if (e.type === 'tick') caseT(e.t, g);
      else if (e.type === 'pdown') pdown(e.t, g);
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

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-online', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.stR + .7) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'Outlived', t0: 0, t1: start('servers') }, { id: 'pre', name: 'Before launch', t0: start('servers'), t1: start('day1') }, { id: 'day1', name: 'Day one', t0: start('day1'), t1: start('cut') }, { id: 'cut', name: '2021 shutdown', t0: start('cut'), t1: start('still1') }, { id: 'still', name: 'Still running', t0: start('still1'), t1: start('zel') }, { id: 'zel', name: 'Take-Two', t0: start('zel'), t1: start('end') }, { id: 'end', name: 'Which lasts', t0: start('end'), t1: DUR }]; };

  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the bleed corridor and the world off and no clip, every prop shape and glyph must stay inside x 90-930 and above y 1450 */
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 3; var bad = [], n = Math.round(DUR * fps), span = .5 / fps;
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false; var lt = LIVE.text; LIVE.text = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0b) + Math.abs(d[i + 1] - 0x08) + Math.abs(d[i + 2] - 0x20) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
    for (var i = 0; i < n; i++) for (var s = 0; s < subs; s++) {
      var t = (i + .5) / fps - span / 2 + span * (s + .5) / subs; frame(ctx, clamp(t, 0, DUR));
      var L0 = dirty(0, 0, 90, H), R0 = dirty(930, 0, 150, H), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0.c + B0.c > 0) { bad.push({ f: i, t: +t.toFixed(3), left: L0.c && [L0.c, L0.x0, L0.y0, L0.y1], right: R0.c && [R0.c, R0.x1 + 930, R0.y0, R0.y1], bottom: B0.c && [B0.c, B0.y1, B0.x0 + 90, B0.x1 + 90] }); break; }
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; LIVE.text = lt; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
