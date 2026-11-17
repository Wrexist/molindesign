/* "GTA is a real crime.": Delta, pillar 3 (GTA history). Why is it called Grand Theft Auto?
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). Sources (BRIEF.md): Cornell LII Wex "grand theft"; California Penal Code 487(d)(1) "An automobile.";
   Shouse Law Group (grand theft auto = PC 487(d)(1)); Dave Jones, Gamasutra 2006 ("The original name we came up with
   was Race-n-Chase", "the name was changed soon after, to Grand Theft Auto"); GTA VI Nov 19, 2026 (Rockstar).
   The set is a night-shift desk with a manual typewriter; the native move is the platen roll and the strike-through,
   held at 1.3x. The camera travels down the desk twice (the statute page, the 1995 design folder).
   Engine helpers from film/gta-firsts. No logos, box art, characters, footage or music. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0b100e', CREAM = '#fbf0ea';
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
     THE SET: a night-shift desk. Green steel desk top, a lamp pool, a black manual typewriter, and further down the
     desk the paperwork: the statute page and the 1995 design folder. Three sheets go through the platen: sheet A
     (the law) is ripped out on "at first", sheet B (the name) is struck through and rolled out before the vote,
     sheet C is blank (frame 0 and the end). The camera moves three ways: down the desk to the paper, back up to
     the platen, and in to 1.3x for the strike-through. All our own drawing: no logos, badges, real form layouts,
     box art, footage or music.
     ===================================================================================================== */
  var DESK = '#1f3b35', DESK2 = '#152a26', MANILA = '#d8b26e', TW = '#17181c', RIB = '#c8262e', SHEET = '#f3ead6', CARBON = '#2b4aa0';
  var MONO = '"Geist Mono"', RED = '#c8262e', INK2 = '#24304f';
  function shade(hex, k) { var n = parseInt(hex.slice(1), 16), r0 = n >> 16, g0 = n >> 8 & 255, b0 = n & 255; return 'rgb(' + Math.round(r0 * k) + ',' + Math.round(g0 * k) + ',' + Math.round(b0 * k) + ')'; }
  var SX = 510, SW = 720, TYPEY = 1030, PLATY = 1086;
  /* typed lines: { t0, text, px, col, cps, gap (space above), x (left offset in sheet), sh (sheet 0 = A, 1 = B) } */
  var LINES = [], STRIKE = null, CHW = .6;
  function typed(L, t) { if (t < L.t0) return 0; return Math.min(L.text.length, Math.floor((t - L.t0) * L.cps) + 1); }
  function lineDone(L) { return L.t0 + (L.text.length - 1) / L.cps; }
  function sheetLines(sh) { return LINES.filter(function (L) { return L.sh === sh; }); }
  var SCMAX = [0, 0, 0];
  /* each sheet's lines stack downward; every new line rolls the platen by its height at its feed time */
  function layoutLines() {
    [0, 1].forEach(function (sh) { var y = 0; sheetLines(sh).forEach(function (L, i) { y += (i ? (L.gap || 0) : 0) + L.px * 1.25; L.y = y; L.x = L.x == null ? 50 : L.x; L.feed = i ? (L.feedT == null ? L.t0 - .32 : L.feedT) : null; }); var Ls = sheetLines(sh); SCMAX[sh] = Ls[Ls.length - 1].y - Ls[0].y; });
  }
  function scrollAt(sh, t) {
    var Ls = sheetLines(sh); if (!Ls.length) return 0; var s = 0, prev = Ls[0].y;
    Ls.forEach(function (L, i) { if (!i) return; s += (L.y - prev) * eio(seg(t, L.feed, L.feed + .3)); prev = L.y; });
    return s;
  }
  /* the carriage: creeps left while a line types, slides back on the next feed */
  function carriage(t) {
    var off = 0;
    LINES.forEach(function (L, li) {
      if (t < L.t0) return;
      var k = clamp(typed(L, t) / Math.max(1, L.text.length), 0, 1), back = 0, nx = LINES[li + 1];
      if (nx) { var f = nx.feed == null ? nx.t0 - .3 : nx.feed; back = eio(seg(t, f, f + .28)); }
      off += -26 * k * (1 - back);
    });
    if (STRIKE && t >= STRIKE.t0) off += -26 * clamp((t - STRIKE.t0) * STRIKE.cps / STRIKE.n, 0, 1) * (1 - eio(seg(t, STRIKE.back, STRIKE.back + .25)));
    return Math.max(-34, off);
  }
  /* which sheets are in the machine: A rips out upward, B feeds up out of the platen and is rolled out before the vote, C is blank */
  function sheetsAt(t) {
    var o = [];
    if (t < 0) { o.push({ sh: 2, lift: 0 }); return o; }
    if (t < T.rip + .5) o.push({ sh: 0, lift: 1900 * eio(seg(t, T.rip, T.rip + .4)) });
    if (t >= T.rip + .1 && t < T.ej2 + .5) o.push({ sh: 1, lift: -1100 * (1 - eio(seg(t, T.rip + .1, T.rip + .55))) + 1900 * eio(seg(t, T.ej2, T.ej2 + .45)) });
    if (t >= T.ej2 + .1) o.push({ sh: 2, lift: -1100 * (1 - eio(seg(t, T.ej2 + .1, T.ej2 + .55))) });
    return o;
  }
  function typeChar(g, ch, x, y, px, col, seed, a) {
    if (ch === ' ') return;
    var r = hash(seed), r2 = hash(seed + 7.7);
    g.save(); g.globalAlpha *= a * (.8 + .2 * r); g.fillStyle = col; font(g, px, 800, MONO); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillText(ch, x + (r2 - .5) * 2, y + (r - .5) * 3); g.restore();
  }
  function lineY(L, t) { var Ls = sheetLines(L.sh); return TYPEY - scrollAt(L.sh, t) + L.y - Ls[0].y; }
  function drawPaper(g, t, S, cx, dim) {
    var sc = S.sh < 2 ? scrollAt(S.sh, t) : 0, top = TYPEY - sc - 900 - S.lift, bot = PLATY + 20, x0 = cx - SW / 2;
    var pb = Math.min(bot, top + 1400 + SCMAX[S.sh]);
    if (pb <= top) return;
    g.save(); g.beginPath(); g.rect(-400, -3000, W + 800, bot + 3000); g.clip();
    g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 24; g.shadowOffsetX = 8; g.shadowOffsetY = 10;
    g.fillStyle = shade(SHEET, dim); g.fillRect(x0, top, SW, Math.min(bot + 40, top + 1400 + SCMAX[S.sh]) - top); g.restore();
    g.save(); g.globalAlpha *= .5; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0, top, SW, pb - top); g.restore();
    g.strokeStyle = 'rgba(43,74,160,' + (.16 * dim).toFixed(3) + ')'; g.lineWidth = 2;
    for (var yy = top + 60; yy < pb; yy += 40) { g.beginPath(); g.moveTo(x0 + 30, yy); g.lineTo(x0 + SW - 30, yy); g.stroke(); }
    g.strokeStyle = 'rgba(200,38,46,' + (.35 * dim).toFixed(3) + ')'; g.beginPath(); g.moveTo(x0 + 34, top); g.lineTo(x0 + 34, pb); g.stroke();
    if (S.sh < 2) {
      LINES.forEach(function (L, li) {
        if (L.sh !== S.sh) return; var n = typed(L, t); if (!n) return;
        var y = lineY(L, t) - S.lift; if (y < -300 || y > bot + 80) return;
        for (var i = 0; i < n; i++) typeChar(g, L.text[i], x0 + L.x + i * L.px * CHW, y, L.px, L.col, li * 97 + i, dim);
      });
      if (STRIKE && S.sh === LINES[STRIKE.line].sh && t >= STRIKE.t0) {
        var SL = LINES[STRIKE.line], ys = lineY(SL, t) - S.lift, ns = Math.min(STRIKE.n, Math.floor((t - STRIKE.t0) * STRIKE.cps) + 1);
        for (var j = 0; j < ns; j++) { typeChar(g, '-', x0 + SL.x + (j - .25) * SL.px * CHW, ys - SL.px * .1, SL.px * 1.1, RIB, 900 + j, dim); typeChar(g, '-', x0 + SL.x + (j + .2) * SL.px * CHW, ys - SL.px * .12, SL.px * 1.1, RIB, 950 + j, dim); }
      }
    }
    g.restore();
  }
  function drawSheets(g, t, dim) {
    var cx = SX + carriage(t);
    sheetsAt(t).forEach(function (S) { drawPaper(g, t, S, cx, dim); });
    return cx;
  }
  /* the typewriter, seen from the typist's chair, high: platen, paper bail, ribbon window, three rows of keys */
  var KEYS = [];
  (function () { var rows = [[10, 1300], [9, 1352], [8, 1402]]; rows.forEach(function (rw, ri) { for (var i = 0; i < rw[0]; i++) KEYS.push({ x: 510 + (i - (rw[0] - 1) / 2) * 74 + ri * 10, y: rw[1], r: 25 - ri * 1.5 }); }); })();
  function activeKey(t) {
    var best = -1;
    LINES.forEach(function (L, li) { if (t < L.t0 || t > lineDone(L) + .09) return; var i = Math.floor((t - L.t0) * L.cps); var u = (t - L.t0) * L.cps - i; if (u < .55 && L.text[i] && L.text[i] !== ' ') best = Math.floor(hash(li * 31 + i) * KEYS.length); });
    if (STRIKE && t >= STRIKE.t0 && t < STRIKE.t0 + STRIKE.n / STRIKE.cps) { var u2 = ((t - STRIKE.t0) * STRIKE.cps) % 1; if (u2 < .6) best = 14; }
    return best;
  }
  function typewriter(g, t, cx, dim) {
    var off = cx - SX;
    g.save();
    g.beginPath(); g.moveTo(150, 1150); g.lineTo(870, 1150); g.lineTo(915, 1440); g.lineTo(105, 1440); g.closePath();
    var bg = g.createLinearGradient(0, 1150, 0, 1440); bg.addColorStop(0, shade('#2c2f37', dim)); bg.addColorStop(1, shade('#101114', dim));
    g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30; g.shadowOffsetY = 14; g.fillStyle = bg; g.fill(); g.restore();
    g.strokeStyle = 'rgba(255,248,232,' + (.25 * dim).toFixed(2) + ')'; g.lineWidth = 2; g.stroke();
    rr(g, 440, 1162, 140, 40, 8); g.fillStyle = shade('#0b0b0d', dim); g.fill();
    g.fillStyle = shade('#111111', dim); g.fillRect(452, 1170, 116, 12); g.fillStyle = shade(RIB, dim); g.fillRect(452, 1182, 116, 12);
    g.fillStyle = shade('#c9cdd6', dim); g.beginPath(); g.moveTo(498, 1160); g.lineTo(522, 1160); g.lineTo(510, 1146); g.closePath(); g.fill();
    var ak = activeKey(t);
    KEYS.forEach(function (k, i) {
      var d = i === ak ? 6 : 0;
      g.beginPath(); g.arc(k.x, k.y + 4, k.r + 3, 0, TAU); g.fillStyle = 'rgba(0,0,0,.5)'; g.fill();
      g.beginPath(); g.arc(k.x, k.y + d, k.r + 3, 0, TAU); g.fillStyle = shade('#9aa0ab', dim); g.fill();
      g.beginPath(); g.arc(k.x, k.y + d, k.r - 1, 0, TAU); g.fillStyle = shade(i === ak ? '#fff6dc' : '#ece2c8', dim); g.fill();
      g.beginPath(); g.arc(k.x - 5, k.y + d - 6, k.r * .4, 0, TAU); g.fillStyle = 'rgba(255,255,255,' + (.35 * dim).toFixed(2) + ')'; g.fill();
    });
    g.save(); g.translate(off, 0);
    rr(g, 150, 1080, 720, 70, 30); var pg = g.createLinearGradient(0, 1080, 0, 1150); pg.addColorStop(0, shade('#3a3d45', dim)); pg.addColorStop(.35, shade('#15161a', dim)); pg.addColorStop(1, shade('#060607', dim)); g.fillStyle = pg; g.fill();
    g.fillStyle = 'rgba(255,255,255,' + (.18 * dim).toFixed(2) + ')'; g.fillRect(170, 1092, 680, 5);
    g.fillStyle = shade('#c9cdd6', dim); g.fillRect(170, 1066, 680, 8);
    [330, 690].forEach(function (x) { rr(g, x - 24, 1060, 48, 20, 8); g.fillStyle = shade('#1b1c20', dim); g.fill(); });
    [140, 880].forEach(function (x) { g.beginPath(); g.arc(x, 1115, 28, 0, TAU); g.fillStyle = shade('#0d0d10', dim); g.fill(); g.strokeStyle = shade('#c9cdd6', dim); g.lineWidth = 3; g.stroke(); });
    g.strokeStyle = shade('#c9cdd6', dim); g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(170, 1090); g.lineTo(125, 1040); g.stroke();
    g.restore();
    g.restore();
  }
  /* the camera: keys [time, scale, focus x, focus y, screen y of the focus, duration]. DESKY is the paperwork further
     down the desk: with the focus there, the typewriter is out of frame above. */
  var DESKY = 2740;
  function camAt(t) {
    var c = { s: 1, fx: 510, fy: 1040, sy: 1040 };
    (T.CAM || []).forEach(function (k) { if (t < k[0]) return; var e = eio(seg(t, k[0], k[0] + k[5])); c.s = lerp(c.s, k[1], e); c.fx = lerp(c.fx, k[2], e); c.fy = lerp(c.fy, k[3], e); c.sy = lerp(c.sy, k[4], e); });
    c.s *= 1 + .012 * Math.sin(TAU * t / DUR);
    return c;
  }
  function camMoving(t) { return (T.CAM || []).some(function (k) { return t > k[0] - .01 && t < k[0] + k[5] + .01; }); }
  /* the desk (screen space): green steel streaks that slide as the camera travels, the lamp pool */
  function desk(g, t, dim, c) {
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, shade(DESK2, dim)); gr.addColorStop(.5, shade(DESK, dim)); gr.addColorStop(1, shade('#10201d', dim));
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    var dy = (c.fy - 1040) * c.s * .35;
    g.save(); var r = mulberry(17); g.strokeStyle = 'rgba(255,255,255,.03)'; g.lineWidth = 2; for (var i = 0; i < 90; i++) { var y = ((r() * H - dy) % H + H) % H, s0 = (r() - .5) * 20; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + s0); g.stroke(); } g.restore();
    var lx = 360 + 50 * osc(t, 2, 1), lg = g.createRadialGradient(lx, 760, 80, lx, 760, 900); lg.addColorStop(0, 'rgba(255,214,140,' + (.32 * dim).toFixed(3) + ')'); lg.addColorStop(1, 'rgba(255,214,140,0)'); g.fillStyle = lg; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = .45; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.restore();
  }
  function world(g, t) {
    var dim = 1 - .25 * bump2(t, T.dip0, T.dip1), c = camAt(t);
    desk(g, t, dim, c);
    var nr = NOREC; NOREC = nr || camMoving(t);
    g.save(); g.translate(510, c.sy); g.scale(c.s, c.s); g.translate(-c.fx, -c.fy);
    var cx = drawSheets(g, t, dim);
    typewriter(g, t, cx, dim);
    if (c.fy > 1250) { g.save(); g.translate(0, DESKY - 1040); paperwork(g, t); g.restore(); }
    g.restore();
    NOREC = nr;
  }
  function bump2(t, a, b) { return seg(t, a, a + .35) * (1 - seg(t, b, b + .4)); }

  /* ---------- printed pieces ---------- */
  function buildTextures() { GRAIN = buildGrain(); buildSet(); }
  function chipP(s, w) { return cardPiece(w, 66, INK2, [[s, 38, CREAM, 2]], { r: 6, ring: 'rgba(251,240,234,.5)' }); }
  function buildSet() {
    /* the evidence bag: clear plastic with a red zip strip and a GTA evidence label, a cut-paper car inside (top view) */
    P.bag = piece([-170, -130, 170, 130], function (g) { rr(g, -170, -130, 340, 260, 14); }, 'rgba(225,238,240,.30)', { sx: 6, sy: 12, blur: 18, grain: .25, edgeCol: 'rgba(255,255,255,.7)', extra: function (g) {
      g.fillStyle = RIB; g.fillRect(-170, -130, 340, 22); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-170, -104, 340, 3);
      g.save(); g.rotate(-.18);
      rr(g, -95, -40, 190, 92, 26); g.fillStyle = '#e34b3c'; g.fill(); g.strokeStyle = '#fff4e2'; g.lineWidth = 3; g.stroke();
      rr(g, -40, -30, 92, 72, 14); g.fillStyle = '#9c2a22'; g.fill();
      rr(g, -30, -24, 30, 60, 8); g.fillStyle = '#bfe0ea'; g.fill(); rr(g, 22, -22, 22, 56, 8); g.fillStyle = '#bfe0ea'; g.fill();
      [[-70, -48], [50, -48], [-70, 46], [50, 46]].forEach(function (p) { rr(g, p[0], p[1], 30, 14, 5); g.fillStyle = '#111'; g.fill(); });
      g.restore();
      /* the evidence label: white, the case name in marker */
      g.save(); g.translate(-92, 86); g.rotate(-.05); g.fillStyle = 'rgba(255,255,255,.92)'; g.fillRect(-62, -26, 124, 52); g.strokeStyle = RIB; g.lineWidth = 3; g.strokeRect(-56, -20, 112, 40); g.restore();
      inkText(g, 'GTA', -92, 87, 36, INK, 61, { rot: -.05, dense: 90 });
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(-140, -80); g.lineTo(-60, -95); g.stroke(); g.beginPath(); g.moveTo(110, 90); g.lineTo(150, 40); g.stroke();
    } });
    P.petty = cardPiece(300, 120, INK2, [['PETTY THEFT', 46, CREAM, 3]], { r: 8, ring: 'rgba(251,240,234,.5)' });
    P.grandC = cardPiece(380, 200, SHEET, [['GRAND', 96, RIB, -30], ['THEFT', 60, INK, 52]], { r: 10, ring: RIB });
    P.wex = chipP('MORE SEVERE · CORNELL WEX', 560);
    /* the statute page, re-created: the statute's own words only, set as a page that fills the frame */
    P.stat = (function () {
      var w = 820, h = 720, rec = [];
      var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { g.beginPath(); g.rect(-w / 2, -h / 2, w, h); }, '#f7f2e4', { extra: function (g) {
        g.strokeStyle = 'rgba(43,74,160,.16)'; g.lineWidth = 2; for (var y = -h / 2 + 200; y < h / 2 - 20; y += 52) { g.beginPath(); g.moveTo(-w / 2 + 30, y); g.lineTo(w / 2 - 30, y); g.stroke(); }
        function L(s, px, col, y, x, wt, fam) { font(g, px, wt || 800, fam); g.fillStyle = col; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(s, x, y); var mm = g.measureText(s); rec.push([x, y - px * .55, x + mm.width, y + px * .45, s]); }
        cond(g, 'condensed'); L('CALIFORNIA', 46, INK, -305, -370, 900); L('PENAL CODE § 487', 78, INK, -232, -370, 900); unst(g);
        g.fillStyle = INK; g.fillRect(-370, -184, 740, 4);
        L('Grand theft is theft committed in any', 40, '#3a3f4c', -128, -370, 600, 'Instrument Serif');
        L('of the following cases: …', 40, '#3a3f4c', -76, -370, 600, 'Instrument Serif');
        L('(d) When the property taken is any', 40, '#3a3f4c', -24, -370, 600, 'Instrument Serif');
        L('of the following:', 40, '#3a3f4c', 28, -370, 600, 'Instrument Serif');
        L('(1) An automobile.', 74, INK, 150, -300, 600, 'Instrument Serif');
      } });
      return wordsOf(pc, rec);
    })();
    P.recr = cardPiece(250, 58, RIB, [['RE-CREATED', 38, CREAM, 2]], { r: 6 });
    P.shouse = chipP('SHOUSE · CALIFORNIA LAW FIRM · 2023', 640);
    /* the manila folder, opened across the frame: back with its tab, a cover that swings open, a ruled insert */
    P.folder = (function () {
      var w = 840, h = 800, rec = [];
      var pc = piece([-w / 2, -h / 2 - 52, w / 2, h / 2], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(-w / 2 + 30, -h / 2); g.lineTo(-w / 2 + 50, -h / 2 - 52); g.lineTo(-w / 2 + 330, -h / 2 - 52); g.lineTo(-w / 2 + 350, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); }, MANILA, { extra: function (g) {
        cond(g, 'condensed'); font(g, 40, 900); ls(g, 1); g.fillStyle = '#4a300c'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('DMA DESIGN', -w / 2 + 70, -h / 2 - 24); var mm = g.measureText('DMA DESIGN'); rec.push([-w / 2 + 70, -h / 2 - 46, -w / 2 + 70 + mm.width, -h / 2 - 4, 'DMA DESIGN']); unst(g); ls(g, 0);
        g.fillStyle = SHEET; g.fillRect(-w / 2 + 30, -h / 2 + 30, w - 60, h - 60);
        g.strokeStyle = 'rgba(43,74,160,.14)'; g.lineWidth = 2; for (var y = -h / 2 + 90; y < h / 2 - 40; y += 44) { g.beginPath(); g.moveTo(-w / 2 + 50, y); g.lineTo(w / 2 - 50, y); g.stroke(); }
      } });
      return wordsOf(pc, rec);
    })();
    P.cover = piece([-420, -400, 420, 400], function (g) { g.beginPath(); g.rect(-420, -400, 840, 800); }, '#c9a25e', { extra: function (g) { g.strokeStyle = 'rgba(90,59,18,.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-420, -340); g.lineTo(420, -340); g.stroke(); } });
    P.q1 = buildStrip('“The original name we came up with was Race-n-Chase…”', 760, 54, 21);
    P.jones = chipP('DAVE JONES, DMA FOUNDER · GAMASUTRA 2006', 740);
    P.bmg = cardPiece(400, 170, MANILA, [['PUBLISHER', 44, '#4a300c', -38], ['BMG', 86, INK, 30]], { r: 10, ring: '#5a3b12' });
    P.y97 = cardPiece(400, 200, INK2, [['1997', 110, CREAM, -30], ['FIRST RELEASE · PC', 40, CREAM, 62]], { r: 10, ring: 'rgba(251,240,234,.55)' });
    P.g6 = cardPiece(470, 200, RIB, [['GTA 6', 84, CREAM, -42], ['NOV 19, 2026', 44, CREAM, 26], ['ROCKSTAR GAMES', 36, CREAM, 72]], { r: 10, ring: 'rgba(255,240,234,.9)' });
    /* the vote: two identical full-width tags, an empty box on each */
    function tag(s) {
      var w = 800, h = 190, rec = [];
      var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { rr(g, -w / 2, -h / 2, w, h, 12); }, SHEET, { extra: function (g) {
        g.strokeStyle = CARBON; g.lineWidth = 4; rr(g, -w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 8); g.stroke();
        g.strokeStyle = INK; g.lineWidth = 8; g.strokeRect(-w / 2 + 48, -44, 88, 88);
        cond(g); var px = 116; font(g, px, 900); ls(g, 1); while (g.measureText(s).width > w - 240 && px > 110) { px -= 2; font(g, px, 900); }
        g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(s, -w / 2 + 180, 6); var mm = g.measureText(s); rec.push([-w / 2 + 180, 6 - px * .55, -w / 2 + 180 + mm.width, 6 + px * .45, s]); unst(g); ls(g, 0);
      } });
      return wordsOf(pc, rec);
    }
    P.aR = tag("RACE'N'CHASE"); P.aG = tag('GTA');
  }

  /* =====================================================================================================
     TIME AND STATE
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function taped(g, pc, x, y, rot0, tin, tout, t, o) {
    o = o || {}; var od = o.od || .4; if (t < tin - .02 || t > tout + od + .05) return;
    var k = cd(t, tin, o.w || 14), ko = eio(seg(t, tout, tout + od)), s = (o.s || 1) * (o.slam ? lerp(1.4, 1, eo(seg(t, tin, tin + .14))) * kn(t, tin + .12, .05) : 1) * (o.kick ? kn(t, o.kick, .08) : 1);
    var nr = NOREC; NOREC = nr || k < .97 || ko > 0 || (o.slam && t < tin + .16);
    g.save(); g.globalAlpha *= fin(t, tin, .06); g.translate(x + (o.dir || 1) * 1100 * ko + (1 - k) * (o.fromX || 0), y - 200 * ko + (1 - k) * (o.fromY == null ? -120 : o.fromY)); g.rotate(rot0 + (o.dir || 1) * .5 * ko + .2 * (1 - k) * (o.spin == null ? 1 : o.spin)); g.scale(s, s);
    putW(g, pc, 0, 0);
    if (o.draw) o.draw(g, k, ko);
    if (o.tape) tape(g, 0, -pc.h / 2 + 34, 90, 26, .05);
    g.restore(); NOREC = nr;
  }

  /* ---------- the paperwork down the desk (drawn in the world, so it travels with the camera) ---------- */
  function paperwork(g, t) {
    if (t < 14) {
      /* law: the statute page; the red pencil circles its own words in the pause */
      putW(g, P.stat, 510, 930, -.008);
      g.save(); g.translate(510, 930); g.rotate(-.008);
      if (t >= T.circ) {
        var k = eo(seg(t, T.circ, T.circ + .4)), cx0 = -28, cy0 = 128;
        g.strokeStyle = RIB; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath();
        for (var q = 0; q <= 48 * k; q++) { var a = -2.6 + q / 48 * TAU * 1.08; var px = cx0 + Math.cos(a) * (322 + 8 * Math.sin(q * .7)), py = cy0 + Math.sin(a) * (62 + 5 * Math.cos(q)); if (q) g.lineTo(px, py); else g.moveTo(px, py); }
        g.stroke();
      }
      g.restore();
      putW(g, P.recr, 775, 612, .045);
    } else {
      /* race + pub: the 1995 design folder, opened across the frame; Jones's own words; BMG on "publisher" */
      putW(g, P.folder, 510, 975, .004);
      putW(g, P.q1, 510 - P.q1.sw / 2, 760 - P.q1.sh / 2, -.012);
      putW(g, P.jones, 510, 905 + 30, .006);
      taped(g, P.bmg, 655, 1170, -.05 + sw(t, T.bmg + .14, .11, 5.5, .9), T.bmg, 1e9, t, { slam: true, tape: true, dir: 1 });
      var kc = eio(seg(t, T.cov, T.cov + .38));
      if (kc < 1) { g.save(); g.translate(90, 975); g.scale(1 - kc, 1); put(g, P.cover, 420, 0); g.fillStyle = 'rgba(30,18,4,' + (.45 * kc).toFixed(3) + ')'; g.fillRect(0, -400, 840, 800); g.restore(); }
    }
  }

  /* ---------- the prop layer (screen space, clipped to the rail) ---------- */
  function bagPos(t) {
    var ki = eo(seg(t, -.45, -.02)), ko = eio(seg(t, T.bagO, T.bagO + .4));
    return { x: lerp(1320, 680, ki) + 900 * ko - 18 * Math.sin(Math.PI * seg(t, 0, 2.2)), y: 690 - 100 * ko + 14 * Math.sin(Math.PI * seg(t, 0, 2.2)), r: lerp(.35, .06, ki) + .4 * ko - .05 * Math.sin(Math.PI * seg(t, 0, 2.2)) };
  }
  function props(g, t, rt) {
    /* hook: the evidence bag, in place on frame 0; it knocks down in the pause after "crime" */
    if (t < T.bagO + .5) { var b = bagPos(t), kk = T.bagK != null ? kn(t, T.bagK, .06) : 1, nr = NOREC; NOREC = true; g.save(); g.translate(b.x, b.y); g.rotate(b.r); g.scale(1.4 * kk, 1.4 * kk); put(g, P.bag, 0, 0); g.restore(); NOREC = nr; }
    /* grand: petty vs grand on the key bed, under the typed lines; the source under them */
    taped(g, P.petty, 285, 1228, -.05, T.pet, T.cardO, t, { fromX: -200, fromY: 0, dir: -1 });
    taped(g, P.grandC, 668, 1212, .04, T.grd, T.cardO, t, { slam: true, dir: 1 });
    taped(g, P.wex, 510, 1385, -.01, T.wex, T.wexO, t, { fromY: 40, dir: -1 });
    /* called: the law firm that names it, on the key bed while the law is typed */
    taped(g, P.shouse, 510, 1385, .008, T.sho, T.shoO, t, { fromY: 40, dir: -1 });
    /* ship: the year, beside the struck name, never on it */
    taped(g, P.y97, 510, 1272, -.03, T.y97, T.y97O, t, { slam: true, tape: true, dir: -1 });
    /* gta6: the plate takes the year's place */
    taped(g, P.g6, 510, 1272, .02, T.g6, T.g6O, t, { slam: true, dir: 1 });
    /* end: two identical tags over a blank sheet, neither marked (real time, so they leave across the seam) */
    taped(g, P.aR, 510, 690, -.012 + .008 * osc(rt, 9, 0), T.aR, T.tagO, rt, { slam: true, dir: -1 });
    taped(g, P.aG, 510, 935, .012 + .008 * osc(rt, 9, 2), T.aG, T.tagO, rt, { slam: true, dir: 1 });
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
    var hook = card0 === CAPS[0];
    var nx = ci >= 0 ? CAPS[ci + 1] : null, ns = nx ? nx.s : T.loopCap, end = ci === 0 ? ns : Math.min(card0.t1 + .55, ns);
    if (ci >= 0 && t >= end) return;
    var k = ci === -1 ? cd(t, T.loopCap, 16) : (ci === 0 ? 1 : cd(t, card0.s, 16));
    g.save(); cond(g); var cpx = hook ? 124 : 76; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var lines, lw, maxw = 740, CXc = 510;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var Ln = lines.length - 1; if (lw[Ln] + ws[i] > maxw && lines[Ln].length) { lines.push([]); lw.push(0); Ln++; } lines[Ln].push(i); lw[Ln] += ws[i] + gap; }); }
    function fixLines() {
      for (var Ln = 0; Ln < lines.length - 1; Ln++) { var last = lines[Ln][lines[Ln].length - 1]; while (lines[Ln].length > 1 && GLUE[norm(words[last].w)]) { lines[Ln].pop(); lines[Ln + 1].unshift(last); last = lines[Ln][lines[Ln].length - 1]; } }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    function widest() { return Math.max.apply(null, lw) - gap; }
    if (hook) {
      /* the hook: one line, as wide as the frame allows (about 800 px) */
      var all = words.map(function (w, i) { return i; });
      function one() { lines = [all]; lw = [0]; ws.forEach(function (x) { lw[0] += x + gap; }); }
      one(); while (widest() > 792 && cpx > 80) { cpx -= 2; font(g, cpx, 900); ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; one(); }
    } else {
      lay2(); fixLines();
      while ((lines.length > 2 || widest() > maxw) && cpx > 56) { cpx -= 4; font(g, cpx, 900); ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; lay2(); fixLines(); }
    }
    var lh = cpx * 1.32, y0 = CAPY - (lines.length - 1) * lh / 2 + cpx * .36;
    lines.forEach(function (ln, li) {
      var tw = lw[li] - gap, x = CXc - tw / 2, y = y0 + li * lh + (1 - k) * 30, seed = Math.round(card0.t0 * 100) + li * 7;
      var r = mulberry(seed), pad = hook ? 18 : 22, x0 = x - pad, x1 = x + tw + pad, yt = y - cpx * .86, yb = y + cpx * .24, rot = hook ? 0 : (r() - .5) * .025;
      g.save(); g.translate(CXc, y); g.rotate(rot); g.translate(-CXc, -y);
      g.beginPath(); g.moveTo(x0, yt); for (var xx = x0; xx < x1; xx += 9) g.lineTo(xx, yt + (r() - .5) * 4); g.lineTo(x1, yt); g.lineTo(x1 + (r() - .5) * 6, (yt + yb) / 2); g.lineTo(x1, yb); for (xx = x1; xx > x0; xx -= 9) g.lineTo(xx, yb + (r() - .5) * 4); g.lineTo(x0, yb); g.lineTo(x0 + (r() - .5) * 6, (yt + yb) / 2); g.closePath();
      g.save(); g.shadowColor = 'rgba(6,3,18,.55)'; g.shadowBlur = 12; g.shadowOffsetX = 4; g.shadowOffsetY = 8; g.fillStyle = NEWS; g.fill(); g.restore();
      g.save(); g.clip(); g.globalAlpha *= .6; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0, yt - 4, x1 - x0, yb - yt + 8); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1];
        var cur = hook ? norm(w.w) === 'crime' : (stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .2);
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
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 900, 520, 510, 920, 1300); gr.addColorStop(0, 'rgba(4,10,8,0)'); gr.addColorStop(1, 'rgba(4,10,8,.6)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  /* the loop: from the seam on, the picture is the hook's run-up (t - DUR), so the last frame leads into frame 0 */
  function sceneT(t) { return t >= T.seamC ? t - DUR : t; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var st = sceneT(t);
    if (LIVE2.bg) { world(g, st); vignette(g); }
    g.save(); railClip(g); props(g, st, t); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

  function TEXTS(t) {
    var o = [], st = sceneT(t);
    function Tx(id, text, a, b) { if (st >= a && st < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    /* typed lines: counted only while fully typed, their sheet seated, on camera and clear of the captions */
    if (st >= 0) {
      var c = camAt(st), sh = sheetsAt(st);
      LINES.forEach(function (L, i) {
        var S = sh.filter(function (s) { return s.sh === L.sh; })[0]; if (!S || Math.abs(S.lift) > 1) return;
        if (st < lineDone(L) + .04) return;
        var y = (lineY(L, st) - c.fy) * c.s + c.sy;
        if (y >= 560 && y <= 1180) o.push({ id: 'ln' + i, text: L.text, x0: 0, y0: 0, x1: 0, y1: 0 });
      });
    }
    Tx('bag', 'GTA', -1, T.bagO);
    Tx('pet', 'PETTY THEFT', T.pet + .2, T.cardO); Tx('grd', 'GRAND THEFT', T.grd + .16, T.cardO); Tx('wex', 'MORE SEVERE · CORNELL WEX', T.wex + .2, T.wexO);
    Tx('cal', 'CALIFORNIA', T.down1 + .35, T.up1 + .1); Tx('pc', 'PENAL CODE § 487', T.down1 + .35, T.up1 + .1); Tx('auto', '(1) An automobile.', T.down1 + .35, T.up1 + .1); Tx('recr', 'RE-CREATED', T.down1 + .35, T.up1 + .1);
    Tx('sho', 'SHOUSE · CALIFORNIA LAW FIRM · 2023', T.sho + .2, T.shoO);
    Tx('tab', 'DMA DESIGN', T.down2 + .35, T.up2 + .1);
    Tx('q1', '“The original name we came up with was Race-n-Chase…”', T.cov + .3, T.up2 + .1); Tx('j1', 'DAVE JONES, DMA FOUNDER · GAMASUTRA 2006', T.cov + .3, T.up2 + .1);
    Tx('bmg', 'PUBLISHER BMG', T.bmg + .16, T.up2 + .1);
    Tx('y97', '1997', T.y97 + .16, T.y97O); Tx('y97b', 'FIRST RELEASE · PC', T.y97 + .16, T.y97O);
    Tx('g6', 'GTA 6', T.g6 + .16, T.g6O); Tx('g6b', 'NOV 19, 2026', T.g6 + .16, T.g6O); Tx('g6c', 'ROCKSTAR GAMES', T.g6 + .16, T.g6O);
    if (t >= T.aR + .14 && t < T.tagO) o.push({ id: 'aR', text: "RACE'N'CHASE", x0: 0, y0: 0, x1: 0, y1: 0 });
    if (t >= T.aG + .14 && t < T.tagO) o.push({ id: 'aG', text: 'GTA', x0: 0, y0: 0, x1: 0, y1: 0 });
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    T.seamC = DUR - .45; T.loopCap = DUR - .15; T.tagO = DUR - .45;
    function F(id, t, type, gain) { GT[id] = t; EV.push({ t: t, type: type, g: gain == null ? 1 : gain, id: id }); return t; }
    function Ln(t0, text, px, col, tEnd, o) { o = o || {}; var L = { t0: t0, text: text, px: px, col: col || TW, cps: Math.max(6, (text.length - 1) / Math.max(.2, tEnd - t0)), gap: o.gap || 0, x: o.x, sh: o.sh || 0, feedT: o.feedT }; LINES.push(L); return LINES.length - 1; }
    /* the camera's travels */
    T.down1 = after('grand'); T.circ = G('circS', after('law') + .02, 'scratch', .3, 1) - .08; T.up1 = T.circ + .38;
    T.rip = G('ripS', after('but'), 'rip', .3, 1) - .05;
    T.down2 = 0; /* set below, after the race line */
    /* sheet A: the law */
    Ln(at('hook', 'gta') + .02, 'GTA', 130, TW, wend('hook', 'gta'), { x: 60 });
    Ln(at('mean', 'grand'), 'GRAND THEFT AUTO', 60, TW, wend('mean', 'auto'), { gap: 20 });
    Ln(at('mean', 'stealing') - .05, '= STEALING A CAR', 60, RIB, lastw('mean') + .1);
    Ln(T.up1 + .45, 'CALIF. PC 487(d)(1)', 56, TW, wend('called', 'call') + .3, { gap: 40 });
    Ln(at('called', 'grand'), '= GRAND THEFT AUTO', 56, TW, lastw('called') + .05);
    /* sheet B: the name */
    Ln(T.rip + .5, 'TITLE:', 54, TW, T.rip + .72, { sh: 1 });
    T.lnRace = Ln(T.rip + .76, "RACE'N'CHASE", 76, TW, at('race', 'racenchase') - .02, { sh: 1, gap: 10 });
    T.lnRed = Ln(at('ship', 'grand') - .05, 'GRAND THEFT AUTO', 60, RIB, lastw('ship') + .1, { sh: 1, feedT: at('ship', 'as') + .05 });
    layoutLines();
    T.down2 = lineDone(LINES[T.lnRace]) + .06; T.cov = T.down2 + .12;
    T.up2 = start('soon') + .65;
    /* the strike-through: in the pause after "changed", with the camera in at 1.3x on the old name */
    T.strk = after('soon') + .02; STRIKE = { t0: T.strk, cps: 30, n: 12, line: T.lnRace, back: T.strk + .6 };
    for (var i = 0; i < 12; i += 2) G('x' + i, T.strk + i / 30, 'strike', .03, 1);
    T.ej2 = after('gta6') + .02;
    T.CAM = [
      [T.down1, 1, 510, DESKY, 1040, .55],
      [T.down1 + .56, 1.05, 510, DESKY + 20, 1060, T.up1 - T.down1 - .58],
      [T.up1, 1, 510, 1040, 1040, .5],
      [start('but') + .05, 1.12, 510, 1000, 1000, 1.6],
      [T.rip - .05, 1, 510, 1040, 1040, .45],
      [T.down2, 1, 510, DESKY, 1040, .5],
      [T.up2, 1.3, 465, 990, 900, .6],
      [T.ej2 - .1, 1, 510, 1040, 1040, .5]
    ];
    /* key clacks only where the voice leaves room; a carriage return on each feed that lands in a pause */
    LINES.forEach(function (L, li) { for (var c = 0; c < L.text.length; c += 2) if (L.text[c] !== ' ') G('k' + li + '_' + c, L.t0 + c / L.cps, 'key', .02, .6); });
    LINES.forEach(function (L, li) { if (L.feed != null) G('f' + li, L.feed, 'ret', .12, .7); });
    /* hook: the bag knocks down in the pause after "crime", leaves before the next line is typed */
    T.bagK = G('bagS', after('hook'), 'thock', .4, 1.4); T.bagO = start('mean') - .15;
    /* grand: petty slides in, GRAND slams in the pause before the line, the Wex chip under them */
    T.pet = lastw('mean') + .12; T.grd = G('grdS', after('mean') + .1, 'slap', .3, 1) - .12; T.wex = lastw('mean') + .4;
    T.cardO = T.down1 - .05; T.wexO = T.down1 + .4;
    /* called: Shouse on the key bed until the sheet is ripped */
    T.sho = T.up1 + .45; T.shoO = T.rip - .1;
    T.dip0 = start('but'); T.dip1 = T.rip;
    /* pub: BMG slams in the pause before "Then a publisher" */
    T.bmg = G('bmgS', start('pub') - .12, 'slap', .3, 1) - .12;
    /* ship: 1997 lands on the year, its thock under the end of the word */
    T.y97 = at('ship', '1997') + .38; F('y97S', T.y97 + .13, 'thock', .9);
    /* gta6: the plate takes the year's place, slapped down in the pause before "GTA 6" */
    T.g6 = G('g6S', start('gta6') - .18, 'slap', .3, 1.1) - .13; T.y97O = T.g6 - .08; T.g6O = T.ej2 - .1;
    /* end: sheet B rolls out, blank sheet C feeds in, then two identical tags */
    G('ej', T.ej2, 'ret', .3, 1.1);
    T.aR = T.ej2 + .3; T.aG = T.aR + .14; G('tA', T.aR + .1, 'slap', .2, .5); G('tB', T.aG + .1, 'slap', .2, .5);
    STRESS = [['mean', 'stealing'], ['grand', 'serious'], ['law', 'automobile'], ['but', 'wasnt'], ['race', 'racenchase'], ['soon', 'changed'], ['gta6', 'charge']].map(function (p) { return at(p[0], p[1]); });
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
  /* ---------- sound: desk foley written into the pauses; no music (Isac adds a platform sound) ---------- */
  BODY.key = .06; BODY.ret = .3; BODY.ding = .3; BODY.scratch = .35; BODY.thock = .12; BODY.slap = .1; BODY.snap = .14; BODY.strike = .05; BODY.rip = .17;
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
    function key(t, g) { tick(t, 1.6 * g, 1500 + rnd() * 600); tick(t + .008, .8 * g, 3200); thump(t, .22 * g, 380); }
    /* the strike: a heavy type-bar clack and a paper bite (1-3 kHz), the loudest hit of the film */
    function strike(t, g) { tick(t, 2.2 * g, 1300); tick(t + .006, 1.2 * g, 2600); thump(t, .5 * g, 300); band(t, t + .05, 1200, 2800, .3 * g, .03 * g, 1.4); }
    /* the sheet ripped out of the platen: a torn-paper zip over a ratchet */
    function rip(t, g) { band(t, t + .16, 900, 3200, .16 * g, .06 * g, .9, .15); for (var j = 0; j < 6; j++) tick(t + j * .026, (.5 + .4 * rnd()) * g, 2200); }
    function ret(t, g) { for (var j = 0; j < 6; j++) tick(t + j * .022, (.6 + .3 * rnd()) * g, 2400); band(t, t + .26, 900, 2600, .07 * g, .02 * g, 1.2, -.2); thump(t + .25, .3 * g, 260); }
    function ding(t, g) { osc2('sine', 2093, t, t + .3, [[t, 0], [t + .003, .1 * g], [t + .25, 0]]); osc2('sine', 3140, t, t + .2, [[t, 0], [t + .003, .04 * g], [t + .16, 0]]); tick(t, .6 * g, 3000); }
    function scratch(t, g) { band(t, t + .34, 2200, 3400, .09 * g, .05 * g, 2.5, .1); for (var j = 0; j < 5; j++) tick(t + j * .065, .4 * g, 2600); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); }
    function slap(t, g) { thump(t, .3 * g, 260); band(t, t + .06, 3000, 1500, .12 * g, .01 * g, .9); tick(t, 1.2 * g, 2000); }
    function snapS(t, g) { tick(t, 2 * g, 2200); thump(t, .5 * g, 240); band(t, t + .07, 3600, 1800, .1 * g, .01 * g, 1.2); tick(t + .05, .6 * g, 3000); }
    var LEVEL = { key: 4, ret: 5, ding: 4, scratch: 8, thock: 5, slap: 3, snap: 4, strike: 6, rip: 5 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = window.SFX_TYPE_DB || { key: -22, ret: -22, ding: -12, scratch: -14, thock: -27, slap: -20, snap: -25, strike: -27, rip: -18 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      ({ key: key, ret: ret, ding: ding, scratch: scratch, thock: thock, slap: slap, snap: snapS, strike: strike, rip: rip })[e.type](e.t, g);
    });
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '800 58px "Geist Mono"', '400 50px "Instrument Serif"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”’·→…#?‹|~$+—½@&!§()'); })).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures();
      window.READY = true;
    });
  }

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-name', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; LINES.length = 0; initTimes(); window.FILM.POSTER = Math.round(((lineDone(LINES[T.lnRed]) + T.g6) / 2) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'A real crime', t0: 0, t1: T.down1 }, { id: 'law', name: 'The statute', t0: T.down1, t1: T.rip }, { id: 'race', name: "Race'n'Chase", t0: T.rip, t1: T.up2 }, { id: 'strike', name: 'The new name', t0: T.up2, t1: T.g6 }, { id: 'gta6', name: 'GTA 6', t0: T.g6, t1: DUR }];  };

  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the world off and no clip, every prop shape and glyph must stay inside x 90-930 and above y 1450 */
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 3; var bad = [], n = Math.round(DUR * fps), span = .5 / fps;
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false; var lt = LIVE.text; LIVE.text = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0b) + Math.abs(d[i + 1] - 0x10) + Math.abs(d[i + 2] - 0x0e) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
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
