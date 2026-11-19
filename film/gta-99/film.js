/* "GTA 6 scored 99": Delta launch-week news Short. Metacritic, read 2026-11-19: GTA VI 99 (PS5 card 156 critic reviews,
   hero block 150; Xbox Series X 99 from 14) ties The Legend of Zelda: Ocarina of Time (1998, N64, 99 from 22 critics) at
   the top of Metacritic's all-time game list; GTA IV (98) is 5th and GTA V (97) is 7th. Sources in BRIEF.md.
   A vertical film written in code, narrated first and cut to the voice: every beat is keyed to a word time from vo/vo.js
   (window.VO) with at(id, word); every hit sits in a pause the voice track really leaves (vo/vad.js). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Set: the trophy table (plum velvet, gold paper
   medals on satin ribbons, glass jars of critic slips, a cream score board, red-ink stamps). No Metacritic logo (typed
   word only), no Zelda/Nintendo art, no Rockstar art, no music. Engine from gta-lawsuit. */

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
    var lh = px * 1.2, h = lines.length * lh + 64 + (o.credit ? 52 : 0), top = jag(seed, w, 5), bot = jag(seed + 9, w, 5);
    function path(g) { g.beginPath(); g.moveTo(0, top[0][1]); top.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bot.length - 1; i >= 0; i--) g.lineTo(bot[i][0], h + bot[i][1]); g.closePath(); }
    var rec = [];
    var pc = piece([0, -10, w, h + 10], path, NEWS, { sx: 6, sy: 12, blur: 16, extra: function (g) {
      /* faint newsprint ruling and a column line printed through the back */
      g.fillStyle = 'rgba(29,18,51,.05)'; for (var y = 18; y < h; y += 9) g.fillRect(0, y, w, 1);
      cond(g, 'condensed'); font(g, px, 800); ls(g, 0); g.fillStyle = INK; g.textBaseline = 'middle'; g.textAlign = 'left';
      lines.forEach(function (L, i) { var y = 32 + lh * (i + .5); g.fillText(L, 36, y); var mm = g.measureText(L); rec.push([36, y - px * .62, 36 + mm.width, y + px * .3, L]); });
      unst(g);
      if (o.credit) { g.fillStyle = 'rgba(22,32,58,.35)'; g.fillRect(36, 32 + lh * lines.length + 6, w - 72, 2); ptxt(g, rec, o.credit, 36, 32 + lh * lines.length + 34, 38, '#4a5674', { align: 'left', ls: 2, max: w - 72 }); }
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


  /* =====================================================================================================
     THE SET: the trophy table. A plum velvet drape bleeds the whole frame, a dark wood table edge with a velvet
     cloth runs across the bottom (texture only outside the rail), slow cut-paper rays turn behind the hero.
     Gold paper medals hang on long satin ribbons from above the frame and swing as damped pendulums (the native
     move); glass jars of cream critic slips; a cream score board; red-ink stamps on newsprint. No Metacritic logo
     (the word is typed in our font), no Zelda or Nintendo art, no Rockstar art, no music.
     ===================================================================================================== */
  var PLUM = '#2a1236', GOLD = '#e9b949', GOLD2 = '#f7d57a', GOLD3 = '#b9862a', GOLDD = '#7a5212';
  var PINK = '#ff3d8b', PINK2 = '#c2185b', TEALR = '#1c9c93', TEALR2 = '#106760', CRM = '#fbf5e6', OXI = '#a3202c';
  var BRASS = '#d6a842', BRASS2 = '#f2d27a', GREY = '#8c8a94', GREY2 = '#6c6a76', RED2 = '#cf2a33';
  INK = '#1d1430';
  var D = {};
  var MR = 240;               /* medal radius at scale 1 */

  /* ---------- pieces ---------- */
  function buildMedal(key, tagFn, ribbon, ribbon2, num) {
    var rec = [];
    D[key + 'Disc'] = piece([-MR, -MR, MR, MR], function (g) {
      g.beginPath(); var N = 64;
      for (var i = 0; i <= N; i++) { var a = i / N * TAU, r = MR - (i % 2 ? 10 : 0); g.lineTo(r * Math.cos(a), r * Math.sin(a)); }
      g.closePath();
    }, function (g) { var gr = g.createRadialGradient(-70, -80, 20, 0, 0, MR); gr.addColorStop(0, GOLD2); gr.addColorStop(.55, GOLD); gr.addColorStop(1, GOLD3); return gr; },
    { sy: 14, blur: 22, sc: 'rgba(8,0,14,.55)', edgeCol: 'rgba(255,240,190,.9)', extra: function (g) {
      g.beginPath(); g.arc(0, 0, MR - 34, 0, TAU); g.strokeStyle = GOLDD; g.lineWidth = 7; g.stroke();
      g.beginPath(); g.arc(0, 0, MR - 46, 0, TAU); g.strokeStyle = 'rgba(255,240,190,.55)'; g.lineWidth = 3; g.stroke();
      for (var i = 0; i < 40; i++) { var a = i / 40 * TAU; g.beginPath(); g.arc((MR - 20) * Math.cos(a), (MR - 20) * Math.sin(a), 4, 0, TAU); g.fillStyle = 'rgba(122,82,18,.55)'; g.fill(); }
      g.save(); g.shadowColor = 'rgba(255,240,200,.6)'; g.shadowOffsetY = 4; ptxt(g, rec, num, 0, 22, 280, INK, { ls: 0 }); g.restore();
    } });
    wordsOf(D[key + 'Disc'], rec);
    var rec2 = [];
    D[key + 'Tag'] = piece([-260, -78, 260, 78], rectP(520, 156, 10), CRM, { sy: 10, blur: 14, extra: function (g) {
      g.beginPath(); g.arc(0, -56, 10, 0, TAU); g.fillStyle = '#3a2a40'; g.fill();
      tagFn(g, rec2);
    } });
    wordsOf(D[key + 'Tag'], rec2);
    D[key + 'Rib'] = [ribbon, ribbon2];
  }
  /* a medal: centre (x, y), tilt th (it hangs from a ribbon that runs up and off the frame), scale s */
  function medal(g, key, x, y, th, s, o) {
    o = o || {};
    var nr = NOREC; NOREC = nr || !!o.norec;
    g.save(); g.translate(x, y); g.rotate(th); g.scale(s, s);
    var rb = D[key + 'Rib'];
    /* the satin ribbon: two straps in a V from far above to the medal's ring */
    [[-1, rb[0]], [1, rb[1]]].forEach(function (q) {
      g.beginPath(); g.moveTo(q[0] * 8, -MR + 6); g.lineTo(q[0] * 96, -2400); g.lineTo(q[0] * 196, -2400); g.lineTo(q[0] * 64, -MR + 6); g.closePath();
      g.fillStyle = q[1]; g.fill();
      g.beginPath(); g.moveTo(q[0] * 36, -MR); g.lineTo(q[0] * 146, -2400); g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 8; g.stroke();
    });
    g.beginPath(); g.arc(0, -MR - 8, 24, 0, TAU); g.strokeStyle = BRASS; g.lineWidth = 12; g.stroke();
    putW(g, D[key + 'Tag'], 0, -MR - 112, .0);
    putW(g, D[key + 'Disc'], 0, 0);
    g.restore(); NOREC = nr;
  }
  function buildPieces() {
    buildMedal('G', function (g, rec) { ptxt2(g, rec, 'GTA 6 ', 'SCORED', 0, 6, 104, PINK2, INK, 470); }, PINK, PINK2, '99');
    buildMedal('O', function (g, rec) { ptxt(g, rec, 'ZELDA:', 0, -30, 70, '#3b4566', { ls: 3 }); ptxt(g, rec, 'OCARINA OF TIME', 0, 40, 72, INK, { ls: 1, max: 480 }); }, TEALR, TEALR2, '99');
    D.mc = chipPiece([['METACRITIC', 92, INK, 6]], 640, CRM, INK, { lh: 104, pad: 34, ring: 'rgba(29,20,48,.35)' });
    D.high = chipPiece([['HIGHEST ON METACRITIC’S', 60, INK, 2], ['ALL-TIME LIST', 60, INK, 2]], 720, CRM, INK, { lh: 70, pad: 30 });
    D.tied = buildStamp(['TIED', 'TOP SCORE'], 104, 520, OXI);
    D.plaque = (function () { var rec = []; var pc = piece([-300, -110, 300, 110], rectP(600, 220, 14), function (g) { var gr = g.createLinearGradient(0, -110, 0, 110); gr.addColorStop(0, BRASS2); gr.addColorStop(1, '#b8892c'); return gr; }, { sy: 12, blur: 18, extra: function (g) {
      rr(g, -284, -94, 568, 188, 8); stroke(g, 'rgba(90,60,10,.6)', 4);
      [[-270, -82], [270, -82], [-270, 82], [270, 82]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 8, 0, TAU); g.fillStyle = '#8a6118'; g.fill(); });
      ptxt(g, rec, 'ONLY 2 GAMES', 0, -36, 74, '#3a2508', { ls: 3 }); ptxt(g, rec, 'AT 99', 0, 46, 74, '#3a2508', { ls: 3 });
    } }); return wordsOf(pc, rec); })();
    /* a generic grey cartridge: plain plastic, ridges, a typed label (no art, no logo) */
    D.cart = (function () { var rec = []; var w = 420, h = 320; var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) {
      g.beginPath(); g.moveTo(-w / 2 + 30, -h / 2); g.lineTo(w / 2 - 30, -h / 2); g.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + 30); g.lineTo(w / 2, h / 2 - 12); g.lineTo(w / 2 - 22, h / 2); g.lineTo(-w / 2 + 22, h / 2); g.lineTo(-w / 2, h / 2 - 12); g.lineTo(-w / 2, -h / 2 + 30); g.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + 30, -h / 2); g.closePath();
    }, GREY, { sy: 14, blur: 20, sc: 'rgba(8,0,14,.55)', edgeCol: 'rgba(230,230,240,.7)', extra: function (g) {
      g.fillStyle = 'rgba(0,0,0,.18)'; for (var i = 0; i < 9; i++) g.fillRect(-w / 2 + 24, -h / 2 + 20 + i * 12, 40, 5);
      for (i = 0; i < 9; i++) g.fillRect(w / 2 - 64, -h / 2 + 20 + i * 12, 40, 5);
      g.fillStyle = GREY2; g.fillRect(-w / 2 + 10, h / 2 - 40, w - 20, 26);
      rr(g, -136, -128, 272, 200, 6); g.fillStyle = CRM; g.fill(); rr(g, -136, -128, 272, 200, 6); stroke(g, 'rgba(0,0,0,.25)', 3);
      ptxt(g, rec, 'OCARINA', 0, -80, 60, INK, { ls: 2 }); ptxt(g, rec, 'OF TIME', 0, -20, 60, INK, { ls: 2 });
      g.fillStyle = TEALR2; g.fillRect(-120, 16, 240, 46); ptxt(g, rec, 'N64', 0, 40, 44, CRM, { ls: 4 });
    } }); return wordsOf(pc, rec); })();
    D.y1998 = datePiece('RELEASED', '1998', 260, TEALR2);
    /* the glass jar: back wall + front glass drawn separately so the slips sit inside */
    var JW = 300, JH = 350; D.JW = JW; D.JH = JH;
    function jarPath(g) { g.beginPath(); g.moveTo(-JW / 2 + 16, -JH / 2); g.lineTo(JW / 2 - 16, -JH / 2); g.quadraticCurveTo(JW / 2 - 4, -JH / 2 + 6, JW / 2, -JH / 2 + 40); g.lineTo(JW / 2, JH / 2 - 30); g.quadraticCurveTo(JW / 2, JH / 2, JW / 2 - 30, JH / 2); g.lineTo(-JW / 2 + 30, JH / 2); g.quadraticCurveTo(-JW / 2, JH / 2, -JW / 2, JH / 2 - 30); g.lineTo(-JW / 2, -JH / 2 + 40); g.quadraticCurveTo(-JW / 2 + 4, -JH / 2 + 6, -JW / 2 + 16, -JH / 2); g.closePath(); }
    D.jarBack = piece([-JW / 2, -JH / 2, JW / 2, JH / 2], jarPath, 'rgba(170,215,230,.16)', { sy: 12, blur: 18, sc: 'rgba(0,0,0,.35)', grain: 0, edge: 3, edgeCol: 'rgba(220,245,255,.55)' });
    D.jarFront = piece([-JW / 2, -JH / 2, JW / 2, JH / 2], jarPath, 'rgba(200,235,250,.06)', { shadow: false, grain: 0, edge: 4, edgeCol: 'rgba(235,250,255,.75)', extra: function (g) {
      g.fillStyle = 'rgba(255,255,255,.28)'; rr(g, -JW / 2 + 22, -JH / 2 + 50, 26, JH - 110, 13); g.fill();
      g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, JW / 2 - 48, -JH / 2 + 70, 14, JH - 160, 7); g.fill();
      g.fillStyle = 'rgba(220,245,255,.35)'; g.fillRect(-JW / 2 + 10, -JH / 2 + 2, JW - 20, 8);
    } });
    D.slip = piece([-30, -11, 30, 11], rectP(60, 22, 3), CRM, { sy: 2, blur: 3, sc: 'rgba(0,0,0,.3)', pad: 8, extra: function (g) { g.fillStyle = 'rgba(29,20,48,.45)'; g.fillRect(-22, -5, 30, 3); g.fillRect(-22, 2, 40, 3); } });
    D.crit = chipPiece([['CRITICS', 52, INK, 4]], 230, CRM, INK, { lh: 58, pad: 20, ring: 'rgba(29,20,48,.35)' });
    D.n64 = chipPiece([['N64 · 1998', 40, CRM, 2]], 260, TEALR2, CRM, { lh: 46, pad: 20 });
    D.ps5 = chipPiece([['PS5 · READ NOV 19 2026', 40, INK, 1.5]], 380, CRM, INK, { lh: 46, pad: 20 });
    /* the score board: seven tickets as Metacritic prints its all-time list (read Nov 19 2026) */
    D.ROWS = [['1', 'GRAND THEFT AUTO VI', '99', 1], ['2', 'ZELDA: OCARINA OF TIME', '99', 0], ['3', 'SOULCALIBUR', '98', 0], ['4', 'SUPER MARIO GALAXY 2', '98', 0], ['5', 'GRAND THEFT AUTO IV', '98', 1], ['6', 'SUPER MARIO GALAXY', '97', 0], ['7', 'GRAND THEFT AUTO V', '97', 1]];
    D.board = (function () { var rec = []; var pc = piece([-410, -480, 410, 480], rectP(820, 960, 12), '#f3e8cf', { sy: 16, blur: 24, sc: 'rgba(8,0,14,.6)', extra: function (g) {
      g.fillStyle = INK; g.fillRect(-410, -480, 820, 112);
      ptxt(g, rec, 'METACRITIC · ALL-TIME TOP 7', 0, -424, 60, CRM, { ls: 3, max: 760 });
      g.fillStyle = 'rgba(29,20,48,.06)'; for (var y = -350; y < 480; y += 18) g.fillRect(-410, y, 820, 1);
    } }); return wordsOf(pc, rec); })();
    D.ticket = D.ROWS.map(function (R, i) { return [ticket(R, false, i), ticket(R, true, i)]; });
    D.tiedS = buildStamp(['TIED'], 52, 200, OXI);
    D.three = buildStamp(['3 GTAs IN THE TOP 7'], 64, 640, OXI);
    D.deserve = chipPiece([['DESERVE THE 99?', 92, INK, 3]], 700, CRM, INK, { lh: 104, pad: 34, ring: 'rgba(29,20,48,.35)' });
    D.yes = chipPiece([['YES', 88, INK, 4]], 250, CRM, INK, { lh: 96, pad: 24, ring: 'rgba(29,20,48,.4)' });
    D.no = chipPiece([['NO', 88, INK, 4]], 250, CRM, INK, { lh: 96, pad: 24, ring: 'rgba(29,20,48,.4)' });
  }
  var TKW = 780, TKH = 100;
  function ticket(R, hot, i) {
    var rec = [], bg = hot ? PINK2 : CRM, fg = hot ? CRM : INK;
    var pc = piece([-TKW / 2, -TKH / 2, TKW / 2, TKH / 2], rectP(TKW, TKH, 6), bg, { sy: 6, blur: 8, sc: 'rgba(40,20,10,.35)', extra: function (g) {
      g.beginPath(); g.arc(-TKW / 2 + 50, 0, 32, 0, TAU); g.fillStyle = hot ? CRM : INK; g.fill();
      ptxt(g, rec, R[0], -TKW / 2 + 50, 3, 46, hot ? PINK2 : CRM, { ls: 0 });
      ptxt(g, rec, R[1], -TKW / 2 + 102, 3, 48, fg, { align: 'left', ls: 1, max: 520 });
      rr(g, TKW / 2 - 104, -38, 88, 76, 6); g.fillStyle = hot ? CRM : INK; g.fill();
      ptxt(g, rec, R[2], TKW / 2 - 60, 3, 56, hot ? PINK2 : CRM, { ls: 0 });
      g.fillStyle = 'rgba(0,0,0,.12)'; for (var x = -TKW / 2 + 8; x < TKW / 2; x += 16) { g.beginPath(); g.arc(x, -TKH / 2, 3, 0, TAU); g.fill(); }
    } });
    return wordsOf(pc, rec);
  }
  function buildBackdrop() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(19);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1d0a27'); gr.addColorStop(.45, PLUM); gr.addColorStop(1, '#170820'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    /* velvet drape folds */
    for (var i = 0; i < 16; i++) { var x = i * 72 - 20, fg = g.createLinearGradient(x, 0, x + 72, 0); fg.addColorStop(0, 'rgba(0,0,0,.22)'); fg.addColorStop(.45, 'rgba(255,140,200,.06)'); fg.addColorStop(1, 'rgba(0,0,0,.22)'); g.fillStyle = fg; g.fillRect(x, 0, 72, 1300); }
    for (i = 0; i < 9000; i++) { g.fillStyle = r() < .5 ? 'rgba(255,200,240,' + (.015 + r() * .03).toFixed(3) + ')' : 'rgba(0,0,0,' + (.05 + r() * .08).toFixed(3) + ')'; g.fillRect(r() * W, r() * 1300, 1 + r() * 2, 2 + r() * 6); }
    /* the table: a dark wood edge with a gold trim line, a velvet cloth below with a gold fringe */
    g.fillStyle = '#3a1d12'; g.fillRect(0, 1250, W, 70); g.fillStyle = 'rgba(255,200,140,.12)'; g.fillRect(0, 1250, W, 8);
    g.fillStyle = GOLD3; g.fillRect(0, 1316, W, 6);
    var cg = g.createLinearGradient(0, 1322, 0, H); cg.addColorStop(0, '#4a1a52'); cg.addColorStop(1, '#22092a'); g.fillStyle = cg; g.fillRect(0, 1322, W, H - 1322);
    for (i = 0; i < 12; i++) { var x2 = i * 96, fg2 = g.createLinearGradient(x2, 0, x2 + 96, 0); fg2.addColorStop(0, 'rgba(0,0,0,.25)'); fg2.addColorStop(.5, 'rgba(255,150,220,.05)'); fg2.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = fg2; g.fillRect(x2, 1322, 96, H - 1322); }
    g.fillStyle = GOLD3; for (x = 0; x < W; x += 14) g.fillRect(x, 1850, 6, 50 + (x * 7 % 13));
    /* a velvet swag with gold piping and tassels across the cloth front (texture only) */
    for (var sx = -60; sx < W; sx += 240) { g.beginPath(); g.moveTo(sx, 1330); g.quadraticCurveTo(sx + 120, 1500, sx + 240, 1330); g.lineTo(sx + 240, 1322); g.quadraticCurveTo(sx + 120, 1460, sx, 1322); g.closePath(); g.fillStyle = '#5d2266'; g.fill(); g.strokeStyle = GOLD3; g.lineWidth = 5; g.stroke();
      g.fillStyle = GOLD3; g.beginPath(); g.arc(sx, 1336, 11, 0, TAU); g.fill(); g.fillRect(sx - 7, 1345, 14, 60); g.beginPath(); g.moveTo(sx - 14, 1400); g.lineTo(sx + 14, 1400); g.lineTo(sx + 9, 1440); g.lineTo(sx - 9, 1440); g.closePath(); g.fill(); }
    g.globalAlpha = .3; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    var vg = g.createRadialGradient(540, 900, 300, 540, 900, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,0,10,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }
  function buildTextures() { GRAIN = buildGrain(); buildPieces(); D.bg = buildBackdrop(); }

  /* =====================================================================================================
     MOVES
     ===================================================================================================== */
  /* a damped pendulum swing (cosine start: at u = 0 the medal is at its widest, at rest) */
  function pend(u, A, d, w) { if (u < 0) return A; return A * Math.exp(-u * (d || .9)) * Math.cos(u * (w || 3)); }
  var LP = 1030;              /* the ribbon length: the swing's pivot is this far above the medal */
  /* where the GTA 6 medal is: [x, y, tilt, scale] */
  function posG(t) {
    var x, y, th, s, ex;
    /* end + loop: the frame-0 layout (swing phase matches t = 0 at t = DUR) */
    if (t >= T.endIn) {
      th = .2 * Math.exp(.7 * (t - DUR)) * Math.cos(3 * (t - DUR)); s = .92; x = 450 + LP * Math.sin(th); y = 899 - LP * (1 - Math.cos(th));
      y -= 1500 * (1 - eo(seg(t, T.endIn, T.endIn + .55)));
      return [x, y, th * .35, s];
    }
    th = pend(t, .2, .7, 3);
    x = 450 + LP * Math.sin(th); y = 899 - LP * (1 - Math.cos(th)); s = .92;
    var k = eio(seg(t, T.swap, T.swap + .55));
    if (k > 0) { var thB = pend(t - T.swap - .55, .05, 1.4, 4.2); x = lerp(x, 300 + 520 * Math.sin(thB), k); y = lerp(y, 770, k); s = lerp(s, .7, k); th = lerp(th, thB, k); }
    ex = eio(seg(t, T.oot, T.oot + .5)); if (ex > 0) { x -= 900 * ex; th += .15 * ex; }
    if (t >= T.split - .05) {
      var ki = eo(seg(t, T.split, T.split + .6)), thS = pend(t - T.split, .12, 1.3, 3.6) + .012 * osc(t, 9, .4);
      x = lerp(-400, 300 + 600 * Math.sin(thS), ki); y = 700; s = .62; th = thS;
      y -= 1700 * eio(seg(t, T.board - .15, T.board + .3));
    }
    return [x, y, th * .35, s];
  }
  function posO(t) {
    var x, y, th, s;
    if (t < T.oIn - .5) return null;
    var ki = eo(seg(t, T.oIn - .45, T.oIn)), thI = pend(t - T.oIn, -.1, 1.2, 3.8) + .01 * osc(t, 7, 1.2);
    x = lerp(1400, 720 + 520 * Math.sin(thI), ki); y = 770; s = .7; th = thI;
    var k = eio(seg(t, T.oot, T.oot + .6));
    if (k > 0) { var thC = pend(t - T.oot - .6, .05, 1.2, 4) + .012 * osc(t, 9, 2); x = lerp(x, 510 + 520 * Math.sin(thC), k); y = lerp(y, 720, k); th = lerp(th, thC, k); }
    var k2 = eio(seg(t, T.split, T.split + .6));
    if (k2 > 0) { var thL = .012 * osc(t, 9, 2) + pend(t - T.split - .6, .03, 1.3, 4); x = lerp(x, 720 + 520 * Math.sin(thL), k2); y = lerp(y, 700, k2); s = lerp(s, .62, k2); th = lerp(th, thL, k2); }
    y -= 1700 * eio(seg(t, T.board - .2, T.board + .25));
    if (y < -400) return null;
    return [x, y, th * .35, s];
  }
  /* slips falling into a jar: n slips land between t0 and t1; rows above the rim heap up and narrow */
  function slipPos(i, cap) {
    var cols = 4, r = Math.floor(i / cols), c = i % cols, iw = D.JW - 56;
    var y = D.JH / 2 - 26 - r * 15, x = -iw / 2 + (c + .5) * iw / cols, w2;
    if (r >= cap) { var j = i - cap * cols;
      if (j < 30) { var hr = Math.floor(j / 5), cj = j % 5; w2 = iw * (1.05 - hr / 9); x = -w2 / 2 + (cj + .5) * w2 / 5; y = D.JH / 2 - 26 - cap * 15 - hr * 11; }
      else { var m = j - 30, row = 0, cnt = 8; while (m >= cnt) { m -= cnt; row++; cnt = Math.max(1, cnt - 1); } x = D.JW / 2 + 30 + (m + .5) * 21 + row * 10; y = 196 - row * 14; }
    }
    return [x + (hash(i * 7 + 1) - .5) * 26, y + (hash(i * 3 + 5) - .5) * 8, (hash(i * 11 + 2) - .5) * .9];
  }
  function slips(g, n, t, t0, t1, top) {
    for (var i = 0; i < n; i++) {
      var ti = lerp(t0, t1, Math.pow(i / Math.max(1, n - 1), .9)), k = seg(t, ti - .24, ti); if (k <= 0) continue;
      var p = slipPos(i, 20), fall = (1 - k * k) * Math.max(60, Math.min(520, p[1] - (top == null ? -9999 : top)));
      put(g, D.slip, p[0], p[1] - fall, p[2] + (1 - k) * 1.4);
    }
  }
  function jar(g, x, y, s, n, t, t0, t1) {
    g.save(); g.translate(x, y); g.scale(s, s);
    var top = (930 - y) / s;    /* slips never start above screen y 930: they fall from under the medal, never across it */
    put(g, D.jarBack, 0, 0); slips(g, Math.min(n, 110), t, t0, t1, top); put(g, D.jarFront, 0, 0);
    if (n > 110) { g.save(); for (var i = 110; i < n; i++) { var ti = lerp(t0, t1, Math.pow(i / (n - 1), .9)), k = seg(t, ti - .24, ti); if (k <= 0) continue; var p = slipPos(i, 20); put(g, D.slip, p[0], p[1] - (1 - k * k) * Math.max(60, Math.min(420, p[1] - top)), p[2] + (1 - k) * 1.4); } g.restore(); }
    g.restore();
  }
  /* turning cut-paper rays behind the hero (periodic in DUR) */
  function rays(g, t, x, y, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(TAU * 2 * t / DUR);
    for (var i = 0; i < 24; i++) { g.beginPath(); g.moveTo(0, 0); var a0 = i / 24 * TAU, a1 = a0 + TAU / 48; g.arc(0, 0, 1500, a0, a1); g.closePath(); g.fillStyle = i % 2 ? 'rgba(255,170,220,.045)' : 'rgba(255,225,150,.05)'; g.fill(); }
    g.restore();
  }
  /* a red-ink stamp on newsprint slammed on (no tool; the slam is the move) */
  function stampOn(g, pc, x, y, rot, tl, tout, t) { slapOn(g, pc, x, y, rot, tl, tout, t, { from: 1.6 }); }

  /* =====================================================================================================
     THE PROP LAYER (screen space, clipped to the rail). Beats in story order; later pieces land on top.
     ===================================================================================================== */
  function props(g, t) {
    var p;
    /* hook + tie: the GTA 6 medal (frame 0), the METACRITIC plate, then the Ocarina medal and the TIED stamp */
    if (t < T.high + .5) { var km = eio(seg(t, T.swap, T.swap + .5)); drop(g, 510, 1215 + 115 * km, -.01, -10, T.high - .1, t, function (q) { putW(q, D.mc, 0, 0); }, { od: .4 }); }
    p = posO(t); if (p) medal(g, 'O', p[0], p[1], p[2], p[3], { norec: t < T.oIn || (t > T.board - .25 && t < T.board + .3) });
    if (t < T.oot + .6 || t >= T.split - .1) { p = posG(t); if (p[1] > -500 && p[0] < 1500) medal(g, 'G', p[0], p[1], p[2], p[3], { norec: (t > T.swap && t < T.swap + .55) || (t > T.oot && t < T.oot + .6) || (t > T.split - .1 && t < T.split + .6) || (t > T.board - .2 && t < T.board + .35) || (t > T.endIn && t < T.endIn + .55) }); }
    stampOn(g, D.tied, 510, 1085, -.05, T.tiedV, T.tiedO, t);
    slapOn(g, D.high, 510, 1310, .01, T.high, T.oot, t);
    /* alone: the brass plaque */
    drop(g, 510, 1085, .015, T.plq, T.oot + .25, t, function (q) { putW(q, D.plaque, 0, 0); }, { fd: .26 });
    /* oot: the cartridge, the 1998 card */
    drop(g, 400, 1110, -.03, T.cart, T.jarIn - .1, t, function (q) { putW(q, D.cart, 0, 0); }, { fd: .3 });
    slapOn(g, D.y1998, 790, 1180, .04, T.y98, T.split, t);
    /* crit: the jar under the Ocarina medal; 22 slips; then it glides left for the split */
    if (t >= T.jarIn - .35 && t < T.board + .5) {
      var kj = seg(t, T.jarIn - .32, T.jarIn), fall = (1 - kj * kj) * 1400, ks = eio(seg(t, T.split, T.split + .6));
      var jx = lerp(510, 720, ks), jy = lerp(1070, 1100, ks) - fall - 1700 * eio(seg(t, T.board - .25, T.board + .2)), js = lerp(1, .85, ks);
      var nr = NOREC; NOREC = nr || kj < 1 || (ks > 0 && ks < 1) || t > T.board - .25;
      jar(g, jx, jy, js, 22, t, T.sl1a, T.sl1b);
      g.save(); g.translate(jx, jy); g.scale(js, js); putW(g, D.crit, 0, 110, -.02); if (t >= T.n22) slam(g, '22', 0, -20, 150, t - T.n22, { col: CRM, rot: -.04 }); g.restore();
      NOREC = nr;
    }
    /* gta: the second jar under the GTA 6 medal (left); about 150 slips pour in, heap over the rim and spill onto the shelf */
    if (t >= T.jar2 - .35 && t < T.board + .5) {
      var k2 = seg(t, T.jar2 - .32, T.jar2), f2 = (1 - k2 * k2) * 1400, jy2 = 1100 - f2 - 1700 * eio(seg(t, T.board + .05, T.board + .45));
      var nr2 = NOREC; NOREC = nr2 || k2 < 1 || t > T.board + .05;
      jar(g, 300, jy2, .85, 150, t, T.sl2a, T.sl2b);
      g.save(); g.translate(300, jy2); g.scale(.85, .85); putW(g, D.crit, 0, 110, .02); if (t >= T.n150) slam(g, '150+', 0, -20, 150, t - T.n150, { col: PINK, rot: .04 }); g.restore();
      NOREC = nr2;
    }
    slapOn(g, D.n64, 720, 1330, -.02, T.n64, T.board - .2, t);
    slapOn(g, D.ps5, 300, 1330, .015, T.ps5, T.board - .2, t);
    /* list: the board drops; tickets; TIED on rows 1-2; GTA rows turn pink on their words; the three pop forward */
    drop(g, 510, 840, -.006, T.board, T.endIn - .3, t, function (q) {
      putW(q, D.board, 0, 0);
      var dim = eo(seg(t, T.st3 - .5, T.st3 - .2));
      D.ROWS.forEach(function (R, i) {
        var y = -330 + i * 113, ti = T.board + .12 + i * .06, kt = eo(seg(t, ti, ti + .2)); if (kt <= 0) return;
        var hot = R[3] && t >= T.hot[i], pop = R[3] ? 1 + .035 * eo(seg(t, T.pop + i * .05, T.pop + i * .05 + .2)) : 1;
        if (R[3] && i > 0) { var kp = eo(seg(t, T.hot[i], T.hot[i] + .12)); pop = Math.max(pop, 1 + kp * (.07 - .035 * eio(seg(t, T.hot[i] + .12, T.hot[i] + .6)))); }
        var nr = NOREC; NOREC = nr || kt < 1;
        q.save(); q.translate(0, y + (1 - kt) * 60); q.globalAlpha *= kt; q.scale(pop, pop);
        putW(q, D.ticket[i][hot ? 1 : 0], 0, 0);
        if (!R[3] && dim > 0) { q.globalAlpha *= .55 * dim; q.fillStyle = PLUM; rr(q, -TKW / 2, -TKH / 2, TKW, TKH, 6); q.fill(); }
        q.restore(); NOREC = nr;
      });
      if (t >= T.tiedB) { var kb = eo(seg(t, T.tiedB, T.tiedB + .25)); q.save(); q.strokeStyle = RED2; q.lineWidth = 12; q.lineCap = 'round'; q.beginPath(); var bx = TKW / 2 + 8, y0 = -330 - 34, y1 = -330 + 113 + 34, ym = lerp((y0 + y1) / 2, y1, kb), yn = lerp((y0 + y1) / 2, y0, kb); q.moveTo(bx - 10, yn); q.lineTo(bx, yn); q.lineTo(bx, ym); q.lineTo(bx - 10, ym); q.stroke(); q.restore(); }
    }, { fall: 1500 });
    stampOn(g, D.three, 510, 1362, -.06, T.st3, T.endIn - .3, t);
    /* end: DESERVE THE 99? YES / NO (equal); they peel off before the loop so the last frame is frame 0 */
    if (t >= T.des - .05) slapOn(g, D.deserve, 510, 1215, -.01, T.des, T.seamL, t);
    if (t >= T.yes - .05) slapOn(g, D.yes, 370, 1350, -.02, T.yes, T.seamL, t);
    if (t >= T.no - .05) slapOn(g, D.no, 650, 1350, .02, T.no, T.seamL, t);
    if (t >= T.seamL - .3) drop(g, 510, 1215, -.01, DUR - .04, null, t, function (q) { putW(q, D.mc, 0, 0); }, { fd: .22, knock: false, spin: 0 });
  }

  /* ---------- captions: cream label tape in the upper third, phrase by phrase (the hook's words are the frame-0 medal) ---------- */

  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1, was: 1, will: 1, most: 1, his: 1, is: 1, her: 1, new: 1, from: 1, as: 1, can: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) { cur.push(w); if ((w.split || /[.?!]["”]?$/.test(w.w)) && !/^N\.Y\.$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 392, TAPE = '#f6ecd0';
  function capHidden(t) { return (t >= T.tiedV - .05 && t < T.oot) || (t >= T.board - .1 && t < T.endIn + .3) || t >= T.des - .05; }
  function captions(g, t) {
    t = tq(t); if (capHidden(t)) return;
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
        var isG = /^GTA$/.test(up[i]) || (/^[456]\.?,?$/.test(up[i]) && i > 0 && up[i - 1] === 'GTA');
        g.fillStyle = isG ? '#d81b6a' : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }


  var NOISE, POSTERMODE = false;
  var STAGEC = '#2a1236';
  function stage(g) { g.fillStyle = STAGEC; g.fillRect(0, 0, W, H); }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) {
      g.drawImage(D.bg, 0, 0);
      rays(g, t, 510, 820, 1);
      /* a warm spotlight pool drifts (periodic in DUR, so the loop is exact) */
      var lx = 520 + 80 * osc(t, 3, .4), ly = 860 + 60 * osc(t, 2, 1.3), gl = g.createRadialGradient(lx, ly, 60, lx, ly, 820);
      gl.addColorStop(0, 'rgba(255,214,150,.16)'); gl.addColorStop(.6, 'rgba(255,190,160,.05)'); gl.addColorStop(1, 'rgba(255,190,160,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
    }
    var ddx = 4 * osc(t, 17, .3) + 2 * osc(t, 29, 1.1), ddy = 3 * osc(t, 13, 2.1) + 2 * osc(t, 31, .7);
    g.save(); railClip(g); g.translate(ddx, ddy); props(g, t); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('gt', 'GTA 6 SCORED', 0, T.oot + .2); Tx('g99', '99', 0, T.oot + .2); Tx('gt', 'GTA 6 SCORED', T.split + .3, T.board); Tx('g99', '99', T.split + .3, T.board); Tx('gt', 'GTA 6 SCORED', T.endIn + .3, DUR + 1); Tx('g99', '99', T.endIn + .3, DUR + 1);
    Tx('mc', 'METACRITIC', 0, T.high); Tx('mc', 'METACRITIC', DUR - .1, DUR + 1);
    Tx('ot', 'ZELDA: OCARINA OF TIME', T.oIn, T.board); Tx('o99', '99', T.oIn, T.board);
    Tx('tie', 'TIED TOP SCORE', T.tiedV + .1, T.tiedO);
    Tx('hi', 'HIGHEST ON METACRITIC’S ALL-TIME LIST', T.high + .1, T.oot);
    Tx('plq', 'ONLY 2 GAMES AT 99', T.plq + .1, T.oot + .25);
    Tx('crt', 'OCARINA OF TIME N64', T.cart, T.jarIn - .1); Tx('y98', 'RELEASED 1998', T.y98 + .1, T.split);
    Tx('c1', 'CRITICS', T.jarIn, T.board - .25); Tx('n22', '22', T.n22 + .1, T.board - .25);
    Tx('c2', 'CRITICS', T.jar2, T.board + .05); Tx('n150', '150+', T.n150 + .05, T.board + .05);
    Tx('n64', 'N64 · 1998', T.n64 + .1, T.board - .2); Tx('ps5', 'PS5 · READ NOV 19 2026', T.ps5 + .1, T.board - .2);
    Tx('bt', 'METACRITIC · ALL-TIME TOP 7', T.board, T.endIn - .25);
    D.ROWS.forEach(function (R, i) { Tx('r' + i, R[0] + ' ' + R[1] + ' ' + R[2], T.board + .3 + i * .06, T.endIn - .25); });
    Tx('st3', '3 GTAs IN THE TOP 7', T.st3 + .1, T.endIn - .25);
    Tx('des', 'DESERVE THE 99?', T.des + .1, T.seamL); Tx('yes', 'YES', T.yes + .1, T.seamL); Tx('no', 'NO', T.no + .1, T.seamL);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    /* hook: the GTA 6 medal swings on frame 0; the Ocarina medal swings in on "99"; TIED is on screen by 2.0 s
       and its stamp sound sits in the pause after the hook */
    T.swap = at('hook', '99') - .22;
    T.oIn = T.swap + .5;
    var ts = G('tied', lastw('hook') + .02, 'stamp', .45, 1.4, { m: .05 });
    T.tiedV = Math.min(ts - .12, 1.9);
    T.high = at('tie', 'metacritic') - .05;
    T.tiedO = at('alone', 'but') - .05;
    G('plq', wend('alone', 'alone') + .12, 'thock', .35, 1.2); T.plq = at('alone', 'not') - .02;
    T.oot = start('oot') - .32;
    T.cart = G('cart', start('oot') - .12, 'thock', .3, 1);
    T.y98 = at('oot', '1998') - .02;
    T.jarIn = G('jar1', after('oot') + .04, 'thock', .35, 1.2);
    T.sl1a = at('crit', 'its'); T.sl1b = at('crit', '22') + .2; T.n22 = at('crit', '22') - .02;
    G('pat1', after('crit') - .02, 'patter', .3, 1);
    T.split = start('gta') - .25; T.jar2 = T.split + .35; T.n64 = T.split + .7; T.ps5 = T.jar2 + .25;
    T.sl2a = at('gta', 'got') - .1; T.n150 = at('gta', '150') - .02;
    T.sl2b = G('heap', after('gta') + .05, 'thunk', .35, 1.2);
    T.board = G('board', at('list', 'alltime') - .1, 'thock', .3, 1.2);
    T.tiedB = T.board + .75;
    T.hot = [T.board, 0, 0, 0, at('gtas', '4') - .02, 0, at('gtas', '5') - .02];
    T.st3 = G('st3', after('gtas') + .01, 'stamp', .35, 1.4);
    T.pop = at('three', 'three') - .02;
    T.endIn = at('end', 'deserve') - .9;
    G('endIn', T.endIn + .5, 'thock', .3, 1);
    T.des = T.endIn + .35; T.yes = T.des + .14; T.no = T.yes + .1;
    T.seamL = DUR - .34; T.capEnd = DUR - .3;
    G('seam', DUR - .06, 'thock', .25, .8);
    STRESS = [['tie', 'ties'], ['tie', 'metacritic'], ['alone', 'alone'], ['oot', '1998'], ['crit', '22'], ['gta', '150'], ['list', 'seven'], ['gtas', '98'], ['gtas', '97'], ['three', 'three'], ['end', 'deserve']].map(function (p) { return at(p[0], p[1]); });
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

    var LEVEL = { stamp: 1, click: 4, thock: 5, slap: 3, pin: 4, tick: 6, thunk: 4, patter: 4 };
    var TRIM = window.SFX_TRIM || { tied: 0, st3: 0, heap: 0, board: 1, plq: 1, cart: 1, jar1: 1, endIn: 1, seam: 0, pat1: 2 };
    var TYPE_DB = window.SFX_TYPE_DB || { stamp: -12, click: -12, thock: -18, slap: -14, pin: -14, tick: -18, thunk: -14, patter: -16 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'stamp') stamp(e.t, g);
      else if (e.type === 'click') click(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'pin') pin(e.t, g);
      else if (e.type === 'tick') caseT(e.t, g);
      else if (e.type === 'thunk') thunk(e.t, g);
      else if (e.type === 'patter') patter(e.t, g);
    });
    /* no music: Isac adds a platform sound; the film ships voice + sound effects */
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
      buildTextures(); EV.length = 0; initTimes();
      window.FILM.POSTER = Math.round((T.sl2b + .45) * 30) / 30 + 1 / 60;
      window.FILM.SHOTS = [{ id: 'hook', name: '99', t0: 0, t1: start('alone') }, { id: 'alone', name: 'Tied', t0: start('alone'), t1: start('crit') }, { id: 'crit', name: '22 vs 150+', t0: start('crit'), t1: start('list') }, { id: 'list', name: 'Top 7', t0: start('list'), t1: start('end') }, { id: 'end', name: 'Deserve it?', t0: start('end'), t1: DUR }];
      window.READY = true;
    });
  }

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-99', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };

  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the backdrop and the clip off, every prop shape and glyph must stay inside x 90-930 and above y 1450 */
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 3; var bad = [], n = Math.round(DUR * fps), span = .5 / fps;
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false; var lt = LIVE.text; LIVE.text = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x2a) + Math.abs(d[i + 1] - 0x12) + Math.abs(d[i + 2] - 0x36) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
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
