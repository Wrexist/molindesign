/* "Don't copy these settings": Delta, launch week. A viral four-tip GTA 6 settings list (topic only, no footage), checked
   against BRIEF.md section 3: motion blur (default 3, max 10; GTA 6 targets 30 fps on consoles; a PC Gamer editor picked 1),
   the three effects sliders (taste: KEEP), HDR numbers (max brightness should match your TV: FIX), Brightness Reduction
   (off by default; our pick: leave it off: SKIP). Every menu is our own drawing and says so; illustrations say so.
   A vertical film written in code, narrated first and cut to the voice: every beat is keyed to a word time from vo/vo.js
   (window.VO) with at(id, word); every hit sits in a pause the voice track really leaves (vo/vad.js). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Engine from gta-heroes; set and moves new. */
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
    free(m || (window.VAD ? .1 : .2)).forEach(function (f) {
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
      lines.forEach(function (L, i) { y += lh[i] / 2; var ww = inkText(g, L[0], 0, y + 2, L[1], col, 93 + i * 7, i ? { dense: 90, big: 1.1, ls: 2, wt: 900 } : { dense: 24, big: 2.2, ls: 3 }); rec.push([-ww / 2, y - L[1] * .5, ww / 2, y + L[1] * .45, L[0]]); y += lh[i] / 2; });
      var r = mulberry(91); g.globalCompositeOperation = 'destination-out';
      for (var i = 0; i < 380; i++) { g.globalAlpha = .15 + r() * .4; g.beginPath(); g.arc(-w / 2 + r() * w, -h / 2 + r() * h, .5 + r() * 2.2, 0, TAU); g.fill(); }
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
     THE SET: a plum cut-paper wall lit by a TV-glow wash that changes colour per tip, two sunset paper bands
     drifting behind. Every menu is a cream paper card in our own type with an OUR DRAWING tag; illustrations
     carry ILLUSTRATION. Native move: the slider slam (a knob ratchets notch by notch, then a verdict stamp drops).
     ===================================================================================================== */
  var CRM = '#fbf3e2', RED2 = '#cf2a33', PINKG = '#e0287a', CORAL = '#e8402f', CORALD = '#b9271d', TEALD = '#0f6e6a';
  var NOTE = '#ffd84a', NOTE2 = '#f2c22e', MASK = '#e6d6a6', PLUM = '#2a1238', LAB = '#5a4a6a', TRACK = '#d9ccb4';
  INK = '#1d1424';
  var MONO = '"Geist Mono"';
  var D = {};
  function mono(g, rec, s, x, y, px, col, o) {
    o = o || {}; g.save(); font(g, px, o.wt || 700, MONO); ls(g, o.ls == null ? 2 : o.ls);
    g.fillStyle = col; g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.fillText(s, x, y);
    var w = g.measureText(s).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    if (rec) rec.push([x0, y - px * .55, x0 + w, y + px * .45, s]); g.restore(); return w;
  }
  function prow(g, rec, parts, x, y, px, max, align) {
    var all = parts.map(function (p) { return p[0]; }).join('');
    while (tw(all, px) > max && px > 36) px -= 2;
    var wt = tw(all, px), x0 = align === 'center' ? x - wt / 2 : align === 'right' ? x - wt : x, xx = x0;
    parts.forEach(function (p) { ptxt(g, null, p[0], xx, y, px, p[1], { align: 'left' }); xx += tw(p[0], px); });
    var b = [x0, y - px * .55, x0 + wt, y + px * .45, all]; if (rec) rec.push(b); return b;
  }
  /* the OUR DRAWING / ILLUSTRATION tag: a small coral chip, drawn into a piece */
  function tagIn(g, rec, s, x, y, o) {
    o = o || {}; g.save(); font(g, 36, 700, MONO); ls(g, 2); var w = g.measureText(s).width + 30; g.restore();
    var x0 = o.align === 'right' ? x - w : x;
    rr(g, x0, y - 26, w, 52, 6); g.fillStyle = o.bg || CORAL; g.fill();
    mono(g, rec, s, x0 + 15, y + 1, 36, o.fg || CRM, { ls: 2 }); return w;
  }
  /* a cream menu card with a plum header band, title and the OUR DRAWING tag */
  function menuCard(w, h, title, o) {
    o = o || {}; var rec = [];
    var pc = piece([-w / 2, -h / 2 - 60, w / 2, h / 2 + 60], rectP(w, h, 18), CRM, { sy: 14, sx: 6, blur: 20, sc: 'rgba(8,2,14,.6)', after: function (g) {
      if (o.foot) tagIn(g, rec, 'OUR DRAWING', 150, h / 2 + 4, { align: 'right' }); else tagIn(g, rec, 'OUR DRAWING', w / 2 - 24, -h / 2 - 22, { align: 'right' });
    }, extra: function (g) {
      g.fillStyle = PLUM; g.fillRect(-w / 2, -h / 2, w, o.hb || 96);
      /* a gear cut from the band colour */
      if (o.gear !== false) gear(g, -w / 2 + 56, -h / 2 + (o.hb || 96) / 2, 26, CRM);
      if (title) ptxt(g, rec, title, -w / 2 + (o.gear === false ? 34 : 96), -h / 2 + (o.hb || 96) / 2 + 2, o.tpx || 56, CRM, { align: 'left', ls: 1, max: w - 96 - 40 });
      if (o.body) o.body(g, rec);
    } });
    return wordsOf(pc, rec);
  }
  function gear(g, x, y, r, col) {
    g.save(); g.translate(x, y); g.fillStyle = col; g.beginPath();
    for (var i = 0; i < 16; i++) { var a = i / 16 * TAU, rr0 = i % 2 ? r * .78 : r; g.lineTo(Math.cos(a) * rr0, Math.sin(a) * rr0); }
    g.closePath(); g.fill(); g.beginPath(); g.arc(0, 0, r * .36, 0, TAU); g.fillStyle = PLUM; g.fill(); g.restore();
  }
  /* sticky notes: the viral tip's numbers, hand-lettered on yellow */
  function notePiece(lines, w, h, seed) {
    var rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2, h / 2 - 22); g.lineTo(w / 2 - 26, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); }, NOTE, { sy: 10, sx: 4, blur: 12, sc: 'rgba(8,2,14,.45)', edgeCol: 'rgba(255,250,215,.9)', extra: function (g) {
      g.fillStyle = 'rgba(160,110,0,.12)'; g.fillRect(-w / 2, -h / 2, w, 30);
      var y = -h / 2 + 30;
      lines.forEach(function (L) { y += L[1] * .62; if (L[2] === 'arrow') arrowTxt(g, rec, L[0], L[3], 0, y, L[1]); else ptxt(g, rec, L[0], 0, y, L[1], L[2] || INK, { ls: 1, max: w - 24 }); y += L[1] * .5; });
    }, after: function (g) { g.fillStyle = NOTE2; g.beginPath(); g.moveTo(w / 2, h / 2 - 22); g.lineTo(w / 2 - 26, h / 2); g.lineTo(w / 2 - 22, h / 2 - 20); g.closePath(); g.fill(); } });
    return wordsOf(pc, rec);
  }
  /* "5 [arrow] 2" with a drawn arrow (the font subset has no arrow glyph) */
  function arrowTxt(g, rec, a, b, x, y, px) {
    var wa = tw(a, px), wb = tw(b, px), aw = px * .8, tot = wa + aw + wb, x0 = x - tot / 2;
    ptxt(g, null, a, x0, y, px, INK, { align: 'left' }); ptxt(g, null, b, x0 + wa + aw, y, px, CORALD, { align: 'left' });
    g.save(); g.strokeStyle = INK; g.lineWidth = px * .09; g.lineCap = 'round'; g.lineJoin = 'round';
    var ax0 = x0 + wa + aw * .16, ax1 = x0 + wa + aw * .84, ay = y - px * .06;
    g.beginPath(); g.moveTo(ax0, ay); g.lineTo(ax1, ay); g.moveTo(ax1 - px * .2, ay - px * .18); g.lineTo(ax1, ay); g.lineTo(ax1 - px * .2, ay + px * .18); g.stroke(); g.restore();
    if (rec) rec.push([x0, y - px * .55, x0 + tot, y + px * .45, a + ' to ' + b]);
  }
  function maskPiece(w, h, seed) {
    var tp = jag(seed, w, 3), bt = jag(seed + 3, w, 3);
    return piece([-w / 2, -h / 2 - 6, w / 2, h / 2 + 6], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + q[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(-w / 2 + bt[i][0], h / 2 + bt[i][1]); g.closePath(); }, MASK, { sy: 5, sx: 3, blur: 6, sc: 'rgba(8,2,14,.35)', edge: 1.5, extra: function (g) {
      ptxt(g, null, '?', 0, 4, 84, CORALD, { ls: 0 });
    } });
  }
  /* the red tape across frame 0: DON'T COPY / THESE SETTINGS */
  function buildTape() {
    var w = 800, h = 250, tp = jag(71, w, 5), bt = jag(72, w, 5), rec = [];
    D.tape = piece([-w / 2, -h / 2 - 8, w / 2, h / 2 + 8], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + q[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(-w / 2 + bt[i][0], h / 2 + bt[i][1]); g.closePath(); }, '#d8232f', { sy: 14, sx: 6, blur: 18, sc: 'rgba(8,2,14,.6)', edgeCol: 'rgba(255,220,220,.6)', extra: function (g) {
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(-w / 2, -h / 2 + 10, w, 10);
      ptxt(g, rec, "DON'T COPY", 0, -52, 122, CRM, { ls: 3, max: w - 60 });
      ptxt(g, rec, 'THESE SETTINGS', 0, 64, 112, CRM, { ls: 3, max: w - 60 });
    } });
    wordsOf(D.tape, rec);
  }
  /* ---------- live widgets ---------- */
  function trackDraw(g, x0, x1, y, th, n, o) {
    o = o || {};
    rr(g, x0, y - th / 2, x1 - x0, th, th / 2); g.fillStyle = o.col || TRACK; g.fill();
    if (o.fill != null) { rr(g, x0, y - th / 2, Math.max(th, o.fill - x0), th, th / 2); g.fillStyle = o.fcol || CORAL; g.fill(); }
    for (var i = 0; i < n; i++) { var x = lerp(x0 + th * .5, x1 - th * .5, i / (n - 1)); g.fillStyle = 'rgba(29,20,36,.55)'; g.fillRect(x - 2, y + th / 2 + 6, 4, o.tick || 16); }
  }
  function knob(g, x, y, r, o) {
    o = o || {};
    g.save(); g.shadowColor = 'rgba(8,2,14,.45)'; g.shadowBlur = r * .3; g.shadowOffsetY = r * .14;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = o.col || INK; g.fill(); g.restore();
    g.beginPath(); g.arc(x, y, r * .62, 0, TAU); g.fillStyle = o.inner || CRM; g.fill();
    g.beginPath(); g.arc(x, y, r * .2, 0, TAU); g.fillStyle = o.dot || CORAL; g.fill();
  }
  /* a stepped value: holds `a` until ts, then ratchets one notch per step to `b` (the slam) */
  function ratchet(t, ts, a, b, step) { if (t < ts) return a; var n = Math.abs(b - a), s = step || .05, k = Math.min(n, Math.floor((t - ts) / s) + 1), base = a + Math.sign(b - a) * k, frac = n ? clamp((t - ts - (k - 1) * s) / s, 0, 1) : 1; return k >= n ? b : lerp(base - Math.sign(b - a), base, eo(frac)); }
  function toggleDraw(g, x, y, w, h, on, o) {
    o = o || {};
    g.save(); g.shadowColor = 'rgba(8,2,14,.4)'; g.shadowBlur = 10; g.shadowOffsetY = 6;
    rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fillStyle = lerpCol('#8c8496', '#1fa37a', on); g.fill(); g.restore();
    var kx = lerp(x - w / 2 + h / 2, x + w / 2 - h / 2, on);
    if (o.labels !== false) {
      ptxt(g, null, 'OFF', x + w / 4 - (h * .1), y + 2, o.lpx || Math.max(36, h * .34), 'rgba(251,243,226,' + (1 - on).toFixed(2) + ')', { ls: 2 });
      ptxt(g, null, 'ON', x - w / 4 + (h * .1), y + 2, o.lpx || Math.max(36, h * .34), 'rgba(251,243,226,' + on.toFixed(2) + ')', { ls: 2 });
    }
    knob(g, kx, y, h * .42, { col: '#fbf3e2', inner: '#fbf3e2', dot: on > .5 ? '#1fa37a' : '#8c8496' });
  }
  function lerpCol(a, b, k) { var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); }), pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); }); return 'rgb(' + pa.map(function (v, i) { return Math.round(lerp(v, pb[i], clamp(k, 0, 1))); }).join(',') + ')'; }
  /* a cut-paper car, side view (illustration) */
  function car(g, x, y, s, col, a) {
    g.save(); g.globalAlpha *= a == null ? 1 : a; g.translate(x, y); g.scale(s, s);
    g.fillStyle = col || PINKG; rr(g, -90, -34, 180, 44, 14); g.fill();
    g.beginPath(); g.moveTo(-52, -32); g.lineTo(-30, -66); g.lineTo(34, -66); g.lineTo(60, -32); g.closePath(); g.fill();
    g.fillStyle = '#bfe6ff'; g.beginPath(); g.moveTo(-40, -36); g.lineTo(-25, -58); g.lineTo(-2, -58); g.lineTo(-2, -36); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(6, -36); g.lineTo(6, -58); g.lineTo(29, -58); g.lineTo(48, -36); g.closePath(); g.fill();
    [-52, 52].forEach(function (wx) { g.beginPath(); g.arc(wx, 12, 22, 0, TAU); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(wx, 12, 9, 0, TAU); g.fillStyle = '#c9c2d0'; g.fill(); });
    g.fillStyle = '#ffe9a0'; g.fillRect(80, -24, 12, 12);
    g.restore();
  }
  function sun(g, x, y, r, t) {
    g.save(); g.translate(x, y); g.rotate(TAU * 2 * t / DUR);
    g.fillStyle = '#ffb02e'; for (var i = 0; i < 12; i++) { g.save(); g.rotate(i / 12 * TAU); g.beginPath(); g.moveTo(r * 1.12, -r * .16); g.lineTo(r * 1.6, 0); g.lineTo(r * 1.12, r * .16); g.closePath(); g.fill(); g.restore(); }
    g.restore(); g.save(); g.shadowColor = 'rgba(8,2,14,.4)'; g.shadowBlur = 12; g.shadowOffsetY = 6; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = '#ffd34d'; g.fill(); g.restore();
    g.beginPath(); g.arc(x - r * .25, y - r * .25, r * .45, 0, TAU); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill();
  }

  /* ---------- the scorecard sheet (frame 0, the q beat, the end, the seam) ---------- */
  var SW = 790, SH = 1040, SY = 872, ROWY = [-330, -158, 14, 186], SLOTX = 240, AMBER = '#b8650f';
  var ROWS = [
    { tip: 'TIP 1', name: 'MOTION BLUR', verdict: 'TEST', sub: '0 OR 1', vcol: AMBER },
    { tip: 'TIP 2', name: 'EFFECTS SLIDERS', verdict: 'KEEP', sub: 'YOUR CALL', vcol: TEALD },
    { tip: 'TIP 3', name: 'HDR NUMBERS', verdict: 'FIX', sub: 'YOUR TV', vcol: CORALD },
    { tip: 'TIP 4', name: 'BRIGHTNESS REDUCTION', verdict: 'SKIP', sub: 'OUR PICK', vcol: CORALD }
  ];
  function buildSheet() {
    D.sheet = menuCard(SW, SH, null, { tpx: 54, foot: true, body: function (g) {
      ROWY.forEach(function (y, i) { if (i) { g.fillStyle = 'rgba(90,74,106,.35)'; g.fillRect(-SW / 2 + 30, y - 92, SW - 60, 3); }
        rr(g, SLOTX - 130, y - 68, 260, 136, 10); g.setLineDash([12, 9]); g.strokeStyle = 'rgba(90,74,106,.5)'; g.lineWidth = 3; g.stroke(); g.setLineDash([]); });
      g.fillStyle = 'rgba(90,74,106,.35)'; g.fillRect(-SW / 2 + 30, ROWY[3] + 92, SW - 60, 3);
    } });
    D.masks = ROWY.map(function (y, i) { return maskPiece(220, 120, 80 + i * 5); });
    D.notes = [
      notePiece([['VIRAL TIP', 36, LAB], ['0', 92]], 190, 170),
      notePiece([['VIRAL TIP', 36, LAB], ['5', 84, 'arrow', '2']], 190, 170),
      notePiece([['VIRAL TIP', 36, LAB], ['600', 70], ['50 · 50', 50]], 190, 196),
      notePiece([['VIRAL TIP', 36, LAB], ['ON', 92]], 190, 170)
    ];
    D.sStamps = ROWS.map(function (r) { return stampPiece([[r.verdict, 66], [r.sub, 42]], r.vcol, 262); });
    var rec = [];
    D.plate = piece([-350, -88, 350, 88], rectP(700, 176, 12), CRM, { sy: 10, blur: 14, sc: 'rgba(8,2,14,.55)', extra: function (g) {
      rr(g, -340, -78, 680, 156, 8); stroke(g, CORALD, 6);
      prow(g, rec, [['1 OF 4 ', CORALD], ['SURVIVES', INK]], 0, -18, 92, 640, 'center');
      rr(g, -200, 28, 400, 52, 6); g.fillStyle = PLUM; g.fill(); mono(g, rec, 'OUR VERDICTS', 0, 55, 44, CRM, { align: 'center', ls: 2 });
    } });
    wordsOf(D.plate, rec);
    D.verd = chipPiece([['OUR VERDICTS', 40, CRM, 2]], 300, PLUM, CRM, { lh: 48, pad: 16 });
  }
  /* row labels and widgets, live (sheet-local coordinates) */
  function rowLabel(g, t, st, i) {
    var y = ROWY[i];
      var lk = st.labels ? st.labels[i] : 0, wy = y + (lk > 0 ? 34 : 0) * eo(lk);
      if (lk > 0) {
        g.save(); g.globalAlpha *= clamp(lk * 3, 0, 1);
        ptxt(g, null, ROWS[i].tip, -SW / 2 + 40, y - 46, 40, CORAL, { align: 'left', ls: 2 });
        ptxt(g, null, ROWS[i].name, -SW / 2 + 40 + tw(ROWS[i].tip, 40) + 18, y - 46, 44, INK, { align: 'left', ls: 1, max: 330 });
        g.restore();
      }
      var x0 = -SW / 2 + 44, x1 = 120;
      if (st.end >= 1) return;
      g.save(); g.globalAlpha *= 1 - (st.end || 0);
      if (i === 0) { var v = st.v0 == null ? 3 : st.v0; trackDraw(g, x0, x1, wy, 20, 11, { fill: lerp(x0 + 10, x1 - 10, v / 10) });
        if (st.trail && !st.end) st.trail.forEach(function (tv0, j) { if (Math.abs(tv0 - v) < .05) return; g.save(); g.globalAlpha *= .42 - j * .09; g.beginPath(); g.arc(lerp(x0 + 10, x1 - 10, tv0 / 10), wy, 28, 0, TAU); g.fillStyle = CORAL; g.fill(); g.restore(); });
        knob(g, lerp(x0 + 10, x1 - 10, v / 10), wy, 28); }
      if (i === 1) { var v1 = st.v1 == null ? 5 : st.v1; for (var j = 0; j < 3; j++) { var yy = wy - 26 + j * 30; trackDraw(g, x0, x1, yy, 10, 5, { tick: 0, fill: lerp(x0 + 5, x1 - 5, (v1 - 1) / 4) }); knob(g, lerp(x0 + 5, x1 - 5, (v1 - 1) / 4), yy, 13); } }
      if (i === 2) { var hv = [.72, .5, .5]; for (var j2 = 0; j2 < 3; j2++) { var y2 = wy - 26 + j2 * 30, hx = lerp(x0 + 5, x1 - 5, hv[j2] + .08 * osc(t, 3 + j2, j2)); trackDraw(g, x0, x1, y2, 10, 2, { tick: 0, fill: hx, fcol: '#7a5cff' }); knob(g, hx, y2, 13); } }
      if (i === 3) toggleDraw(g, x0 + 110, wy, 200, 76, st.on == null ? 0 : st.on, { labels: false });
      g.restore();
  }
  /* the whole sheet in sheet-local coordinates; st: labels[], notes[], masks[], stamps[], tape, plate, hiKeep */
  function sheetBody(g, t, st) {
    putW(g, D.sheet, 0, 0);
    ROWY.forEach(function (y, i) {
      g.save();
      if (i === 1 && st.lift > 0) { g.translate(0, y); g.scale(1 + .08 * st.lift, 1 + .08 * st.lift); g.translate(0, -y); g.save(); g.shadowColor = 'rgba(8,2,14,' + (.45 * st.lift).toFixed(3) + ')'; g.shadowBlur = 30; g.shadowOffsetY = 14; rr(g, -SW / 2 + 22, y - 90, SW - 44, 182, 12); g.fillStyle = CRM; g.fill(); g.restore(); }
      if (i === 1 && st.hiKeep > 0) hilite(g, -SW / 2 + 30, y - 86, lerp(-SW / 2 + 30, SW / 2 - 30, st.hiKeep), y + 84, 1);
      rowLabel(g, t, st, i);
      var nX = lerp(70, -236, st.end || 0), nY = lerp(40, 44, st.end || 0), nS = lerp(.78, .7, st.end || 0);
      var sk = st.stamps ? st.stamps[i] : -1;
      if (sk >= 0) { var k = eo(clamp(sk / .14, 0, 1)), s = lerp(1.4, 1, k), nr = NOREC; NOREC = nr || k < 1; g.save(); g.globalAlpha *= clamp(sk / .05, 0, 1); g.translate(SLOTX, y); g.rotate(-.06 * (1 + (1 - k) * 2)); g.scale(s, s); putW(g, D.sStamps[i], 0, 0); g.restore(); NOREC = nr; }
      var mk0 = st.masks ? st.masks[i] : 1;
      if (mk0 > 0) { var off = 1 - mk0, nr2 = NOREC; NOREC = nr2 || off > 0; g.save(); g.translate(SLOTX - 60 * eio(off), y - 1300 * eio(off) * eio(off)); g.rotate(.04 * (i % 2 ? -1 : 1) - .3 * off); put(g, D.masks[i], 0, 0); g.restore(); NOREC = nr2; }
      var nk = st.notes ? st.notes[i] : 0;
      if (nk > 0) { var kk = eo(clamp(nk / .14, 0, 1)), s2 = lerp(1.35, 1, kk), nr3 = NOREC; NOREC = nr3 || kk < 1 || (st.end > 0 && st.end < 1); g.save(); g.globalAlpha *= clamp(nk / .05, 0, 1); g.translate(nX, y + nY); g.rotate((i % 2 ? .07 : -.06) * (1 + (1 - kk) * 2)); g.scale(s2 * nS, s2 * nS); putW(g, D.notes[i], 0, 0); g.restore(); NOREC = nr3; }
      g.restore();
    });
    if (st.plate >= 0) { var pk = eo(clamp(st.plate / .3, 0, 1)), ps2 = kn(st.plateHit == null ? -1 : st.plateHit, 0, .05), nr4 = NOREC; NOREC = nr4 || pk < 1; g.save(); g.translate(900 * (1 - pk), SH / 2 - 114); g.rotate(-.015 + .12 * (1 - pk)); g.scale(ps2, ps2); putW(g, D.plate, 0, 0); g.restore(); NOREC = nr4; }
    if (false && st.verd >= 0) { var vk = eo(clamp(st.verd / .14, 0, 1)), nr5 = NOREC; NOREC = nr5 || vk < 1; g.save(); g.globalAlpha *= clamp(st.verd / .05, 0, 1); g.translate(-20, SH / 2 - 172); g.rotate(-.04); g.scale(lerp(1.3, 1, vk), lerp(1.3, 1, vk)); putW(g, D.verd, 0, 0); g.restore(); NOREC = nr5; }
    if (st.tape != null && st.tape < 1.4) {
      var tk = st.tape, ko = clamp(tk, 0, 1), nr6 = NOREC; NOREC = nr6 || ko > 0 || st.tapeIn < 1;
      var ti = st.tapeIn == null ? 1 : st.tapeIn, tsc = lerp(1.25, 1, eo(ti));
      g.save(); g.globalAlpha *= clamp(ti * 4, 0, 1); g.translate(0 + 900 * eio(ko), -530 - 700 * eio(ko) * eio(ko)); g.rotate(-.055 + .5 * eio(ko)); g.scale(tsc, tsc); putW(g, D.tape, 0, 0); g.restore(); NOREC = nr6;
    }
  }

  /* ---------- the close-up cards ---------- */
  var BW = 790, BH = 560, BX = 510, BYc = 985;
  function buildBlur() {
    D.blur = menuCard(BW, BH, 'MOTION BLUR STRENGTH', { tpx: 54, body: function (g, rec) {
      for (var i = 0; i <= 10; i++) ptxt(g, rec, String(i), lerp(-BW / 2 + 70, BW / 2 - 70, i / 10), 150, 40, i === 3 ? CORALD : LAB, { ls: 0 });
      /* the DEFAULT flag hangs under the 3 */
      var dx = lerp(-BW / 2 + 70, BW / 2 - 70, .3);
      rr(g, dx - 84, 186, 168, 52, 8); g.fillStyle = PLUM; g.fill(); mono(g, rec, 'DEFAULT', dx, 213, 36, CRM, { align: 'center', ls: 1 });
      mono(g, rec, 'MAX 10', BW / 2 - 40, 213, 36, LAB, { align: 'right', ls: 1 });
    } });
    D.noteBlur = notePiece([['VIRAL TIP', 36, LAB], ['0', 96]], 190, 170);
    D.fix1 = stampPiece([['TEST', 116], ['0 OR 1', 64]], AMBER, 320);
    D.fps30 = cardPiece(440, 200, PLUM, [['30 FPS', 134, NOTE, 6]], { r: 14, ring: 'rgba(255,216,74,.6)' });
    D.gb = chipPiece([['GAMERBOLT:', 48, CRM, 1.5], ['0 CAN JUDDER', 48, NOTE, 1.5]], 520, PLUM, CRM, { lh: 58, pad: 22 });
    D.ps5 = chipPiece([['HIS PICK ON A STANDARD PS5,', 40, CRM, 1.5], ['NOT A JUDDER FIX', 40, NOTE, 1.5]], 700, PLUM, CRM, { lh: 50, pad: 16 });
    D.rock = chipPiece([['ROCKSTAR: TARGETING', 44, INK, 1.5], ['30 FPS ON CONSOLES', 44, INK, 1.5]], 560, CRM, INK, { lh: 54, pad: 22, ring: 'rgba(29,20,36,.25)' });
    D.quote = buildStrip('“…FEELS THE CLEANEST…”', 700, 64, 31, { credit: 'JACOB RIDLEY · PC GAMER' });
    D.strip = piece([-395, -55, 395, 55], rectP(790, 110, 14), CRM, { sy: 8, blur: 12, sc: 'rgba(8,2,14,.5)' });
    D.illus = chipPiece([['ILLUSTRATION', 30, CRM, 2]], 260, PLUM, CRM, { lh: 38, pad: 12 });
    D.keep = stampPiece([['KEEP', 100], ['YOUR CALL', 50]], TEALD, 330);
    D.fx = menuCard(BW, 640, 'VISUAL EFFECTS', { tpx: 54, body: function (g, rec) {
      ['PLAYER STATUS', 'HIT', 'AWARENESS'].forEach(function (n, i) { ptxt(g, rec, n, -BW / 2 + 40, -320 + 96 + 52 + i * 168, 46, INK, { align: 'left', ls: 1 }); });
    } });
    D.noteFx = notePiece([['VIRAL TIP', 40, LAB], ['5', 80, 'arrow', '2']], 220, 170);
    D.hdr = menuCard(640, 640, 'HDR CALIBRATION', { tpx: 46, body: function (g, rec) {
      ['MAX BRIGHTNESS', 'BLACK LEVELS', 'PAPER WHITE'].forEach(function (n, i) { ptxt(g, rec, n, -320 + 36, -320 + 96 + 60 + i * 168, 44, INK, { align: 'left', ls: 1 }); });
    } });
    D.noteHdr = notePiece([['VIRAL TIP', 40, LAB], ['600', 104], ['50 · 50', 76]], 300, 330);
    D.fix2 = stampPiece([['FIX', 110], ['MATCH YOUR TV', 50]], CORALD, 380);
    D.br = menuCard(BW, 250, 'BRIGHTNESS REDUCTION', { tpx: 52, body: function (g, rec) {
      mono(g, rec, 'DEFAULT: OFF', -BW / 2 + 44, 62, 44, PLUM, { ls: 2 });
    } });
    D.noteBr = notePiece([['VIRAL TIP', 40, LAB], ['ON', 120]], 250, 220);
    D.skip = stampPiece([['SKIP', 120], ['OUR PICK', 56]], CORALD, 330);
    D.comfort = chipPiece([['ONLY IF BRIGHT', 46, INK, 1.5], ['LIGHT BOTHERS YOU', 46, INK, 1.5]], 430, CRM, INK, { lh: 56, pad: 22, ring: 'rgba(29,20,36,.25)' });
    D.src = chipPiece([['GAMERBOLT: MATCH', 42, CRM, 1.5], ["YOUR TV'S MAX", 42, NOTE, 1.5]], 520, PLUM, CRM, { lh: 50, pad: 16 });
    D.tvNote = notePiece([['VIRAL TIP', 36, LAB], ['600', 84]], 210, 170);
  }
  function buildBackdrop() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(23);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2b0f3c'); gr.addColorStop(.6, '#22102f'); gr.addColorStop(1, '#170a20'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (var i = 0; i < 7000; i++) { g.fillStyle = r() < .5 ? 'rgba(255,220,255,' + (.01 + r() * .03).toFixed(3) + ')' : 'rgba(5,0,10,' + (.05 + r() * .08).toFixed(3) + ')'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    g.globalAlpha = .22; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    return c;
  }
  /* two sunset paper bands, cut with a wavy top edge */
  function buildBands() {
    D.bands = [['#c2265f', 61, 220], ['#e8692a', 62, 160]].map(function (b) {
      var w = 1500, h = b[2], top = jag(b[1], w, 14);
      return piece([0, -40, w, h], function (g) { g.beginPath(); g.moveTo(0, 0); for (var x = 0; x <= w; x += 10) g.lineTo(x, 22 * Math.sin(x * .006 + b[1]) + 9 * Math.sin(x * .021 + b[1] * 2)); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); }, b[0], { sy: -6, blur: 16, sc: 'rgba(8,2,14,.45)', grain: .6, edge: 2, edgeCol: 'rgba(255,230,210,.35)' });
    });
  }
  function buildPieces() { buildTape(); buildSheet(); buildBlur(); buildBands(); }
  function buildTextures() { GRAIN = buildGrain(); buildPieces(); D.bg = buildBackdrop(); }

  /* ---------- entrances / exits (rigid paper moves; everything enters through the top or the sides) ---------- */
  function sweepX(t, a, dir) { return (dir || -1) * 1150 * eio(seg(t, a, a + .4)); }
  function dropY(t, tl, d) { var k = seg(t, tl - (d || .32), tl); return -(1 - k * k) * 1500; }
  function growK(t, a) { return eo(seg(t, a, a + .45)); }

  /* =====================================================================================================
     THE PROP LAYER (screen space, clipped to the rail). Beats in story order.
     ===================================================================================================== */
  function sheetState(t) {
    var st = { labels: [0, 0, 0, 0], notes: [0, 0, 0, 0], masks: [1, 1, 1, 1], stamps: [-1, -1, -1, -1], plate: t - T.plate, plateHit: t - T.plateHit, verd: -1, hiKeep: 0, v0: 3, v1: 5, on: 0, tape: (t - T.tapeOff) / .45, tapeIn: 1, end: 0, lift: 0 };
    /* frame 0: the copying is already happening: blur ratchets to 0, the effects knobs to 2, the toggle flips ON */
    st.v0 = ratchet(t, -.06, 3, 0, .07); st.trail = [1, 2, 3, 4].map(function (j) { return ratchet(t - j * .03, -.06, 3, 0, .07); }); st.v1 = ratchet(t, .42, 5, 2, .07); st.on = eo(seg(t, .78, .92));
    for (var i = 0; i < 4; i++) { st.labels[i] = clamp((t - T.tapeOff - .1 - i * .05) / .25, 0, 1); st.notes[i] = t - T.notes[i]; }
    if (t >= T.endIn - .5) {
      st.tape = null; st.plate = t - T.endIn + 1; st.plateHit = null; st.v0 = 0; st.v1 = 2; st.on = 1;
      for (i = 0; i < 4; i++) { st.labels[i] = 1; st.notes[i] = 1; st.masks[i] = 1 - clamp((t - T.stamps[i] + .1) / .3, 0, 1); st.stamps[i] = t - T.stamps[i]; }
      st.verd = t - T.verd; st.hiKeep = eio(seg(t, T.hiKeep, T.hiKeep + .3));
      /* the scorecard drops its sliders: each row reads TIP n NAME, the viral value, our stamp */
      st.end = eio(seg(t, T.endIn + .05, T.endIn + .35));
      st.lift = eio(seg(t, T.lift, T.lift + .16)) * (1 - eio(seg(t, T.lift + .6, T.lift + .8)));
    }
    return st;
  }
  function moving(t) {
    if (t < .12 || t > T.seamUp - .02) return true;
    var A = [[T.stamps[0], .6], [T.plate, .32], [T.tapeOff, .45], [T.dive1, .47], [T.fpsIn, .47], [T.choppyIn, .7], [T.fxIn, .47], [T.hdrIn, .47], [T.tvIn, .55], [T.brIn, .47], [T.endIn - .45, .75], [T.rip, .75], [T.peel, .5], [T.blurSlam, .5], [T.tvMatch, .5], [T.gb, .2], [T.gbOut, .4], [T.lift, .85], [0, 1.55]];
    for (var i = 0; i < A.length; i++) if (t >= A[i][0] - .34 && t < A[i][0] + A[i][1]) return true;
    return false;
  }
  function props(g, t) {
    var nr0 = NOREC; NOREC = nr0 || moving(t); props0(g, t); NOREC = nr0;
  }
  function props0(g, t) {
    var x, y, k, s, nr;
    /* ---- the scorecard sheet: frame 0 to the first dive ---- */
    if (t < T.dive1 + .45) {
      var sx = sweepX(t, T.dive1, -1), dy = seamDrop(t);
      nr = NOREC; NOREC = nr || sx !== 0 || dy !== 0;
      g.save(); hookPush(g, t); g.translate(510 + sx, SY + dy); g.rotate(-.006 + sw(t, 0, .004, 9, 3)); var kk0 = kn(t, seamLand(t), .02); g.scale(kk0, kk0);
      sheetBody(g, t, sheetState(t)); g.restore(); NOREC = nr;
    }
    /* the GTA 6 pill hangs over the sheet's corner and swings (frame 0 to the first dive, and from the seam) */
    if (t < T.dive1 + .45) { g.save(); hookPush(g, t); pillAt(g, t, sweepX(t, T.dive1, -1), seamDrop(t)); g.restore(); }

    /* ---- 1. motion blur: the row lifts into a full-width slider card; the knob slams 3 -> 0 ---- */
    if (t >= T.dive1 && t < T.choppyIn + .45) {
      var gk = growK(t, T.dive1), cx = lerp(372, BX, gk), cy = lerp(SY + ROWY[0], BYc, gk), cs = lerp(.36, 1, gk);
      /* fps: it rises and shrinks to a strip at the top of the flipbook */
      var up = eio(seg(t, T.fpsIn, T.fpsIn + .4)), ex = sweepX(t, T.choppyIn, -1);
      cx = lerp(cx, 510, up); cy = lerp(cy, 688, up); cs = lerp(cs, .55, up);
      nr = NOREC; NOREC = nr || gk < 1 || (up > 0 && up < 1) || ex !== 0;
      g.save(); g.translate(cx + ex, cy); g.rotate(lerp(-.03, .004, gk) + sw(t, T.blurSlam, .01, 14, 4)); g.scale(cs * kn(t, T.blurSlam, .025), cs * kn(t, T.blurSlam, .025));
      putW(g, D.blur, 0, 0);
      var v = ratchet(t, T.blurSlam, 3, 0, .05), x0 = -BW / 2 + 70, x1 = BW / 2 - 70, kx = lerp(x0, x1, v / 10);
      trackDraw(g, x0 - 20, x1 + 20, 70, 34, 11, { fill: kx, tick: 0 });
      knob(g, kx, 70, 66);
      /* the big readout: the value it is set to */
      var rv = Math.round(v), slamU = t - T.blurSlam;
      g.save(); g.translate(0, -80); if (slamU >= 0) { var sk = eo(clamp(slamU / .14, 0, 1)); g.scale(lerp(1.5, 1, sk), lerp(1.5, 1, sk)); }
      stk(g, String(rv), 0, 0, 170, { col: rv === 0 ? CORAL : CRM, ink: INK }); g.restore();
      g.restore(); NOREC = nr;
      /* the viral note on the card's corner */
      slapOn(g, D.noteBlur, 205, 1300, -.08, T.noteBlur, T.fpsIn - .05, t, { tape: true, od: .3 });
    }
    /* ---- 2. 30 fps: a paper flipbook riffles a drawn car ---- */
    if (t >= T.fpsIn - .3 && t < T.choppyIn + .7) {
      var fy = 1105 + dropY(t, T.fpsIn + .15), fx2 = 510 + sweepX(t, T.choppyIn, 1);
      nr = NOREC; NOREC = nr || fy !== 1105 || fx2 !== 510;
      flipbook(g, fx2, fy, t); NOREC = nr;
      slapOn(g, D.fps30, 700 + sweepX(t, T.choppyIn + .25, 1), 705, .04, T.fps30, null, t);
    }
    /* the Rockstar chip prints after "30" and rides up under the panels until the effects card */
    if (t >= T.rock - .05 && t < T.choppyIn + .5) {
      var rcy = lerp(1318, 1104, eio(seg(t, T.choppyIn, T.choppyIn + .4)));
      nr = NOREC; NOREC = nr || (rcy !== 1318 && rcy !== 1104);
      slapOn(g, D.rock, 510, rcy, -.02, T.rock, T.choppyIn + .1, t, { tape: true }); NOREC = nr;
    }
    /* ---- 3. choppy: two illustration panels, 0 (hard steps) and 1 (soft trail); the knob moves 0 -> 1 ---- */
    if (t >= T.choppyIn - .3 && t < T.fxIn + .45) {
      var ox = sweepX(t, T.fxIn, -1);
      panel(g, 318 + ox, 760 + dropY(t, T.choppyIn + .1), 0, t);
      panel(g, 698 + ox + 1150 * (1 - eo(seg(t, T.choppyIn, T.choppyIn + .4))), 760, 1, t);
      slapOn(g, D.illus, 510 + ox, 996, 0, T.choppyIn + .5, null, t);
      slapOn(g, D.gb, 510 + ox, 1170, .015, T.gb, T.gbOut, t, { tape: true });
      stripOn(g, D.quote, 510 + ox, 1130, -.012, T.quote, null, t);
      slapOn(g, D.ps5, 510 + ox, 1330, .012, T.quote + .3, null, t);
      slapOn(g, D.fix1, 735 + ox, 880, -.09, T.fix1, null, t);
    }
    /* ---- 4. effects: three stacked sliders slam 5 -> 2 together ---- */
    if (t >= T.fxIn - .1 && t < T.hdrIn + .45) {
      var fk = eo(seg(t, T.fxIn, T.fxIn + .4)), fsx = sweepX(t, T.hdrIn, 1) * 0, fup = -1700 * eio(seg(t, T.hdrIn, T.hdrIn + .42)) * eio(seg(t, T.hdrIn, T.hdrIn + .42));
      nr = NOREC; NOREC = nr || fk < 1 || fup !== 0;
      g.save(); g.translate(510 + fsx, 930 + fup); g.rotate(lerp(.12, -.07, fk)); var fs = lerp(.55, .95, fk) * kn(t, T.fxSlam, .006); g.scale(fs, fs);
      putW(g, D.fx, 0, 0);
      var v3 = ratchet(t, T.fxSlam, 5, 2, .06);
      for (var i = 0; i < 3; i++) {
        var ty = -320 + 96 + 112 + i * 168, tx0 = -BW / 2 + 44, tx1 = BW / 2 - 170, kx3 = lerp(tx0 + 12, tx1 - 12, (v3 - 1) / 4);
        trackDraw(g, tx0, tx1, ty, 24, 5, { fill: kx3, tick: 12 }); knob(g, kx3, ty, 40);
        var rv3 = Math.round(v3); g.save(); g.translate(BW / 2 - 85, ty - 30); if (t >= T.fxSlam) { var k3 = eo(clamp((t - T.fxSlam - .12) / .14, 0, 1)); g.scale(lerp(1.4, 1, k3), lerp(1.4, 1, k3)); } stk(g, String(rv3), 0, 0, 104, { col: rv3 === 2 ? NOTE : CRM }); g.restore();
      }
      g.restore(); NOREC = nr;
      slapOn(g, D.noteFx, 222, 1335 + fup, -.07, T.noteFx, null, t, { tape: true });
      slapOn(g, D.keep, 680, 1318 + fup, -.06, T.keep, null, t);
    }
    /* ---- 5. HDR: card left, the copied note right; the note rips off on "Don't" ---- */
    if (t >= T.hdrIn - .1 && t < T.tvIn + .45) {
      if (t >= T.tvIn + .2 && t >= T.rip + .8) { /* gone */ } else {
      var hx = 430 - 1150 * (1 - eo(seg(t, T.hdrIn, T.hdrIn + .4))) + sweepX(t, T.tvIn - .25, -1);
      nr = NOREC; NOREC = nr || hx !== 430;
      g.save(); g.translate(hx, 980); g.rotate(.018); putW(g, D.hdr, 0, 0);
      [.72, .45, .52].forEach(function (p, i) { var ty = -320 + 96 + 120 + i * 168, a0 = -284, a1 = 284, kx = lerp(a0 + 10, a1 - 10, p + .05 * osc(t, 4 + i, i)); trackDraw(g, a0, a1, ty, 22, 2, { tick: 0, fill: kx, fcol: '#7a5cff' }); knob(g, kx, ty, 36); });
      g.restore(); NOREC = nr;
      /* the note: slapped on, then ripped off up and right */
      if (t >= T.noteHdr - .02 && t < T.rip + .8) {
        var nk = eo(seg(t, T.noteHdr, T.noteHdr + .14)), tk = eo(seg(t, T.rip, T.rip + .25)), fk2 = seg(t, T.rip + .12, T.rip + .7);
        nr = NOREC; NOREC = nr || nk < 1 || tk > 0;
        [-1, 1].forEach(function (sd) {
          g.save(); g.globalAlpha *= fin(t, T.noteHdr, .05);
          g.translate(712 + sd * 26 * tk + (sd < 0 ? 180 : 330) * fk2, 780 + 900 * fk2 * fk2 + (sd < 0 ? 0 : -30) * tk); g.rotate(.09 + sd * .2 * tk + (sd < 0 ? .7 : 1.2) * fk2);
          var ns = lerp(1.4, 1, nk) * (1 + .06 * bump(t, T.rip - .12, .14)); g.scale(ns, ns);
          var J = jag(140, 330, 9); g.beginPath();
          if (sd < 0) { g.moveTo(-200, -200); J.forEach(function (q) { g.lineTo(q[1], -165 + q[0]); }); g.lineTo(-200, 200); }
          else { g.moveTo(200, -200); J.forEach(function (q) { g.lineTo(q[1], -165 + q[0]); }); g.lineTo(200, 200); }
          g.closePath(); g.clip(); putW(g, D.noteHdr, 0, 0); g.restore();
        });
        NOREC = nr;
      }
    }
    }
    /* ---- 6. the DM frame: two equal TVs, each bar stops at its own MAX; the copied 600 punches through TV B's line ---- */
    if (t >= T.tvIn - .05 && t < T.brIn + .45) {
      var tox = sweepX(t, T.brIn, 1), ek = eo(seg(t, T.tvIn, T.tvIn + .2));
      nr = NOREC; NOREC = nr || ek < 1 || tox !== 0;
      g.save(); g.globalAlpha *= ek; g.translate(510, 900); g.scale(lerp(1.05, 1, ek), lerp(1.05, 1, ek)); g.translate(-510, -900);
      tv(g, 300 + tox, 900, 380, 280, .85, 'BRIGHT HDR TV', t, 0);
      tv(g, 720 + tox, 900, 380, 280, .45, 'ENTRY HDR TV', t, 1);
      tagIn(g, null, 'ILLUSTRATION', 910 + tox, 726, { align: 'right', bg: PLUM });
      g.restore(); NOREC = nr;
      slapOn(g, D.src, 510 + tox, 600, -.012, T.src, null, t, { tape: true });
      /* the copied note: printed on "brightness" under the sets, slammed onto TV B on "match" */
      if (t >= T.tvNote - .02) {
        var mk = eio(seg(t, T.tvMatch, T.tvMatch + .22)), nk3 = eo(seg(t, T.tvNote, T.tvNote + .14));
        var nx3 = lerp(510, 822, mk) + tox, ny3 = lerp(1265, 972, mk);
        nr = NOREC; NOREC = nr || nk3 < 1 || (mk > 0 && mk < 1) || tox !== 0;
        g.save(); g.globalAlpha *= fin(t, T.tvNote, .05); g.translate(nx3, ny3); g.rotate(lerp(-.05, .06, mk)); var s3 = lerp(1.4, 1, nk3) * lerp(1, .74, mk) * kn(t, T.tvMatch + .22, .06); g.scale(s3, s3);
        putW(g, D.tvNote, 0, 0); g.restore(); NOREC = nr;
      }
      slapOn(g, D.fix2, 510 + tox, 1290, -.05, T.fix2, null, t);
    }
    /* ---- 7/8. Brightness Reduction: a giant toggle stays OFF; the ON note slaps on, then peels off ---- */
    if (t >= T.brIn - .35 && t < T.endIn) {
      var bx = sweepX(t, T.endIn - .32, -1), dyb = dropY(t, T.brIn + .05), by = 690 + dyb;
      nr = NOREC; NOREC = nr || dyb !== 0 || bx !== 0;
      g.save(); g.translate(510 + bx, by); g.rotate(-.012); putW(g, D.br, 0, 0);
      /* "It ships off": the DEFAULT: OFF line gets a highlighter swipe */
      hilite(g, -BW / 2 + 36, 62 - 30, -BW / 2 + 36 + 330, 62 + 28, eio(seg(t, T.ships, T.ships + .22)));
      g.restore();
      var tgy = 1215 + dropY(t, T.brIn + .15);
      g.save(); g.translate(510 + bx, tgy); g.rotate(.01); toggleDraw(g, 0, 0, 720, 270, 0, { lpx: 96 }); g.restore(); NOREC = nr;
      if (t >= T.noteBr - .02 && t < T.peel + .5) {
        var pk = eio(seg(t, T.peel, T.peel + .45)), nk2 = eo(seg(t, T.noteBr, T.noteBr + .14));
        nr = NOREC; NOREC = nr || nk2 < 1 || pk > 0;
        g.save(); g.globalAlpha *= fin(t, T.noteBr, .05); g.translate(600 + 420 * pk + bx, 1170 - 1300 * pk * pk); g.rotate(-.06 + .8 * pk); g.scale(lerp(1.4, 1, nk2), lerp(1.4, 1, nk2)); putW(g, D.noteBr, 0, 0); g.restore(); NOREC = nr;
      }
      if (t >= T.sunIn - .4) {
        var sy = 950 + dropY(t, T.sunIn) * .6; sun(g, 800 + bx, sy, 66, t);
        slapOn(g, D.comfort, 360 + bx, 950, -.03, T.comfort, null, t, { tape: true });
      }
      slapOn(g, D.skip, 700 + bx, 1300, -.08, T.skip, null, t);
    }
    /* ---- the end: the sheet returns, the verdicts land; at the seam it lifts away and frame 0's sheet drops in ---- */
    if (t >= T.endIn - .35) {
      var ey = dropY(t, T.endIn) - 1700 * Math.pow(eio(seg(t, T.seamUp, T.seamUp + .2)), 2);
      if (t < T.seamUp + .22) {
        nr = NOREC; NOREC = nr || ey !== 0;
        g.save(); g.translate(510, SY + ey); g.rotate(-.006); var ke = kn(t, T.endIn, .02); g.scale(ke, ke); sheetBody(g, t, sheetState(t)); g.restore(); NOREC = nr;
      }
      if (t >= DUR - .45) {
        nr = NOREC; NOREC = true;
        g.save(); hookPush(g, t - DUR); g.translate(510, SY + seamDrop(t)); g.rotate(-.006); sheetBody(g, t, sheetState(t - DUR)); g.restore();
        g.save(); hookPush(g, t - DUR); pillAt(g, t - DUR, 0, seamDrop(t)); g.restore(); NOREC = nr;
      }
    }
  }
  /* frame 0 is pushed in on the sheet (1.15, pivot at its foot, so the tape and rows fill the frame); eases to 1 by 1.5 s */
  function hookScale(u) { return 1 + .12 * (1 - eio(seg(u, .7, 1.5))); }
  function hookPush(g, u) { var k = hookScale(u); g.translate(510, 1392); g.scale(k, k); g.translate(-510, -1392); }
  /* the frame-0 sheet falls in from above at the seam and lands just after frame 0 */
  function seamLand() { return -.14; }
  function seamDrop(t) { var u = t < 2 ? t : t - DUR; if (u < -.45 || u > seamLand()) return 0; var k = seg(u, -.45, seamLand()); return -(1 - k) * (1 - k) * 1500; }
  function pillAt(g, t, dx, dy) {
    var k = eio(seg(t, T.tapeOff, T.tapeOff + .4)); if (k >= 1) return;
    var nr = NOREC; NOREC = nr || k > 0 || dx !== 0 || dy !== 0;
    g.save(); g.translate(-500 * k, -900 * k * k); pill(g, 300 + dx, 205 + dy, t); g.restore(); NOREC = nr;
  }
  function pill(g, x, y, t) {
    var a = -.12 + sw(t + .6, 0, .1, 6, 1.1) + .03 * osc(t, 7, .5);
    g.save(); g.translate(x, y); g.rotate(a);
    g.save(); g.shadowColor = 'rgba(8,2,14,.5)'; g.shadowBlur = 12; g.shadowOffsetY = 8; rr(g, -110, -50, 220, 100, 50); g.fillStyle = PINKG; g.fill(); g.restore();
    rr(g, -100, -40, 200, 80, 40); g.strokeStyle = 'rgba(255,240,245,.6)'; g.lineWidth = 3; g.stroke();
    ptxt(g, null, 'GTA 6', 0, 3, 76, CRM, { ls: 2 }); g.restore();
  }
  function flipbook(g, x, y, t) {
    var w = 780, h = 540;
    g.save(); g.translate(x, y); g.rotate(-.015);
    /* page edges under the top page */
    for (var i = 4; i >= 1; i--) { rr(g, -w / 2 + i * 5, -h / 2 + i * 7, w, h, 10); g.fillStyle = i % 2 ? '#efe6d2' : '#e2d7bf'; g.fill(); }
    g.save(); g.shadowColor = 'rgba(8,2,14,.5)'; g.shadowBlur = 18; g.shadowOffsetY = 10; rr(g, -w / 2, -h / 2, w, h, 10); g.fillStyle = CRM; g.fill(); g.restore();
    /* the road and the car, one position per page: pages turn 12 times a second */
    g.fillStyle = 'rgba(90,74,106,.25)'; g.fillRect(-w / 2 + 30, 120, w - 60, 6);
    var ph = t * 12 + 16 * clamp(t - T.riffle, 0, .5), pg = Math.floor(ph), u = (pg % 14) / 13; car(g, lerp(-w / 2 + 140, w / 2 - 140, u), 60, 1.45, PINKG);
    mono(g, null, 'PAGE ' + (pg % 14 + 1) + ' / 14', -w / 2 + 34, -h / 2 + 46, 36, LAB, { ls: 1 });
    /* the page turning over at the bottom-right corner */
    var c = ph % 1, cs = 170 * (1 - c);
    if (cs > 8) { g.beginPath(); g.moveTo(w / 2 - cs, h / 2); g.lineTo(w / 2, h / 2 - cs); g.lineTo(w / 2 - cs * .8, h / 2 - cs * .8); g.closePath(); g.fillStyle = '#e9dfc8'; g.fill(); g.strokeStyle = 'rgba(29,20,36,.2)'; g.lineWidth = 2; g.stroke(); }
    /* spiral rings */
    for (var r = 0; r < 9; r++) { var rx = -w / 2 + 60 + r * (w - 120) / 8; g.beginPath(); g.ellipse(rx, -h / 2 - 2, 12, 24, 0, 0, TAU); g.strokeStyle = '#9a93a6'; g.lineWidth = 6; g.stroke(); }
    tagIn(g, null, 'ILLUSTRATION', w / 2 - 24, -h / 2 + 46, { align: 'right', bg: PLUM });
    g.restore();
  }
  /* one illustration panel: mode 0 = separate hard frames (stepped motion), 1 = one soft trail */
  function panel(g, x, y, mode, t) {
    var w = 400, h = 430, pk = mode ? eo(seg(t, T.knob1, T.knob1 + .2)) : 0;
    g.save(); g.translate(x, y); g.rotate(mode ? .012 : -.012); var ps0 = (1 + .015 * pk) * (mode ? kn(t, T.knob1, .05) : kn(t, T.choppyHit, .05)); g.scale(ps0, ps0);
    g.save(); g.shadowColor = 'rgba(8,2,14,.5)'; g.shadowBlur = 16; g.shadowOffsetY = 10; rr(g, -w / 2, -h / 2, w, h, 14); g.fillStyle = mode ? '#e9f6f1' : '#fbeee9'; g.fill(); g.restore();
    rr(g, -w / 2, -h / 2, w, 96, 14); g.fillStyle = mode ? '#1fa37a' : CORAL; g.fill(); g.fillRect(-w / 2, -h / 2 + 60, w, 36);
    ptxt(g, null, mode ? 'BLUR 1' : 'BLUR 0', 0, -h / 2 + 50, 64, CRM, { ls: 2 });
    if (pk > 0) { g.save(); g.globalAlpha *= pk; rr(g, -w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 20); g.strokeStyle = '#1fa37a'; g.lineWidth = 10; g.stroke(); g.restore(); }
    g.fillStyle = 'rgba(90,74,106,.25)'; g.fillRect(-w / 2 + 20, 150, w - 40, 5);
    var cyc = ((t * .9) % 1);
    if (!mode) { var st = Math.floor(cyc * 4) / 3; car(g, lerp(-110, 110, st), 110, .85, PINKG); for (var i = 0; i < 4; i++) { g.save(); g.setLineDash([8, 8]); g.strokeStyle = 'rgba(29,20,36,.22)'; g.lineWidth = 3; rr(g, lerp(-110, 110, i / 3) - 82, 40, 164, 100, 8); g.stroke(); g.restore(); } }
    else { var cxm = lerp(-110, 110, eio(cyc)); for (var j = 5; j >= 1; j--) car(g, cxm - j * 14, 110, .85, '#e0287a', .1); car(g, cxm, 110, .85, PINKG); }
    g.restore();
  }
  function tv(g, x, y, w, h, peak, label, t, idx) {
    g.save(); g.translate(x, y);
    g.fillStyle = '#3a3346'; g.fillRect(-w * .05, h / 2, w * .1, 30); rr(g, -w * .22, h / 2 + 26, w * .44, 14, 6); g.fill();
    g.save(); g.shadowColor = 'rgba(8,2,14,.55)'; g.shadowBlur = 18; g.shadowOffsetY = 10; rr(g, -w / 2, -h / 2, w, h, 18); g.fillStyle = '#16121c'; g.fill(); g.restore();
    var sw0 = w - 36, sh0 = h - 36; rr(g, -sw0 / 2, -sh0 / 2, sw0, sh0, 8); g.fillStyle = '#1d2a4a'; g.fill();
    /* a cream glow bar fills up to this set's own MAX line */
    var colx = -sw0 / 2 + 62, colw = 74, top = sh0 / 2 - 18, bot = -sh0 / 2 + 18;
    var ky = lerp(top, bot, peak), fk = eo(seg(t, T.tvIn + .25 + idx * .12, T.tvIn + .6 + idx * .12));
    var gr = g.createLinearGradient(0, top, 0, ky); gr.addColorStop(0, '#e9dcc0'); gr.addColorStop(1, '#fffbe8');
    var by = lerp(top, ky, fk); rr(g, colx - colw / 2, by, colw, top - by, 6); g.fillStyle = gr; g.fill();
    /* TV B: the copied 600 asks for more than its MAX, so the bar punches through the line and clips */
    var pu = idx ? eo(seg(t, T.tvMatch + .22, T.tvMatch + .36)) : 0;
    if (pu > 0) {
      var fl = .55 + .45 * Math.abs(Math.cos((t - T.tvMatch - .22) * TAU * 2.5)) * (1 - seg(t, T.tvMatch + 1.1, T.tvMatch + 1.5));
      var py = lerp(ky, lerp(top, bot, .93), pu); g.fillStyle = 'rgba(232,64,47,' + fl.toFixed(3) + ')'; rr(g, colx - colw / 2, py, colw, ky - py + 4, 6); g.fill();
      g.save(); g.globalAlpha *= pu; ptxt(g, null, 'CLIPS', colx + colw / 2 + 16, lerp(top, bot, .8), 48, 'rgba(255,120,100,' + fl.toFixed(3) + ')', { align: 'left', ls: 2 }); g.restore();
    }
    g.setLineDash([12, 9]); g.strokeStyle = CRM; g.lineWidth = 5; g.beginPath(); g.moveTo(colx - colw / 2 - 8, ky); g.lineTo(sw0 / 2 - 14, ky); g.stroke(); g.setLineDash([]);
    ptxt(g, null, 'MAX', colx + colw / 2 + 16, ky + 30, 38, CRM, { align: 'left', ls: 2 });
    /* the set's name on a cream label under it */
    rr(g, -w / 2 + 10, h / 2 + 52, w - 20, 54, 8); g.fillStyle = idx ? NOTE : CRM; g.fill();
    mono(g, null, label, 0, h / 2 + 80, 36, INK, { align: 'center', ls: 1 });
    g.restore();
  }

  /* ---------- captions: cream label tape in the upper third, 2-4 word cards at 96 px (the hook's words are the frame-0 props) ---------- */
  /* word counts per card, per line: each card ends on a strong word */
  var CHUNK = { q: [3], blur: [3, 2], fps: [3, 2, 3], choppy: [3, 3, 2, 4, 2], fx: [3, 3], hdr: [4, 1], tv: [2, 4], br: [4, 3], off: [3, 3, 2], end: [2, 4, 3, 2] };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
      var n = CHUNK[l.id] || [l.words.length], i = 0;
      n.forEach(function (c) { var ws = l.words.slice(i, i + c); i += c; if (ws.length) { ws.id = l.id; outc.push(ws); } });
      if (i < l.words.length) { var rest = l.words.slice(i); rest.id = l.id; outc.push(rest); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 400, TAPE = '#f6ecd0';
  function captions(g, t) {
    t = tq(t);
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s : T.capEnd, end = Math.min(card0.t1 + .5, ns);
    if (t >= end) return;
    var k = cd(t, card0.s, 16), ko = 1 - seg(t, end - .06, end);
    g.save(); g.globalAlpha *= ko; cond(g); var cpx = 100; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var lines, lw, maxw = 740, CXc = 510;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var Ln = lines.length - 1; if (lw[Ln] + ws[i] > maxw && lines[Ln].length) { lines.push([]); lw.push(0); Ln++; } lines[Ln].push(i); lw[Ln] += ws[i] + gap; }); }
    lay2();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw) && cpx > 96) { cpx -= 2; font(g, cpx, 900); ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; lay2(); }
    var cy0 = card0.id === 'q' || card0.id === 'end' ? 290 : CAPY, lh = cpx * 1.18, y0 = cy0 - (lines.length - 1) * lh / 2 + cpx * .36;
    lines.forEach(function (ln, li) {
      var tw0 = lw[li] - gap, x = CXc - tw0 / 2, y = y0 + li * lh + (1 - k) * 30, seed = Math.round(card0.t0 * 100) + li * 7;
      var r = mulberry(seed), x0 = x - 22, x1 = x + tw0 + 22, yt = y - cpx * .86, yb = y + cpx * .2, rot = (r() - .5) * .025;
      g.save(); g.translate(CXc, y); g.rotate(rot); g.translate(-CXc, -y);
      g.beginPath(); g.moveTo(x0, yt); for (var xx = x0; xx < x1; xx += 9) g.lineTo(xx, yt + (r() - .5) * 3); g.lineTo(x1, yt); for (var zz = 0; zz < 6; zz++) g.lineTo(x1 + (zz % 2 ? 7 : 0), yt + (yb - yt) * (zz + 1) / 6); for (xx = x1; xx > x0; xx -= 9) g.lineTo(xx, yb + (r() - .5) * 3); g.lineTo(x0, yb); for (zz = 0; zz < 6; zz++) g.lineTo(x0 - (zz % 2 ? 0 : 7), yb - (yb - yt) * (zz + 1) / 6); g.closePath();
      g.save(); g.shadowColor = 'rgba(8,2,14,.55)'; g.shadowBlur = 10; g.shadowOffsetX = 3; g.shadowOffsetY = 6; g.fillStyle = TAPE; g.fill(); g.restore();
      g.save(); g.clip(); g.globalAlpha *= .45; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0 - 8, yt - 4, x1 - x0 + 16, yb - yt + 8); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .25;
        if (cur) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ffd84a'; g.fillRect(x - 6, y - cpx * .78, ws[i] + 12, cpx * .98); g.restore(); }
        var isG = /^GTA$/.test(up[i]) || (/^[456]\.?,?$/.test(up[i]) && i > 0 && up[i - 1] === 'GTA');
        g.fillStyle = isG ? PINKG : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }

  var NOISE, POSTERMODE = false;
  var STAGEC = '#0a1430';
  function stage(g) { g.fillStyle = STAGEC; g.fillRect(0, 0, W, H); }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  /* a slow push on each held close-up (never on the full-width sheet), relaxed under every move */
  function push(t) {
    var p = 1, H0 = [[T.dive1 + .45, T.fpsIn], [T.fxIn + .4, T.hdrIn], [T.brIn + .3, T.endIn - .45]];
    H0.forEach(function (h) { if (t >= h[0] && t < h[1] + .4) p = 1 + .028 * eio(seg(t, h[0], h[1])) * (1 - eio(seg(t, h[1], h[1] + .4))); });
    return p * kn(t, T.blurSlam + .15, .075);
  }
  /* the TV glow on the wall: its colour follows the tip */
  var GLOW = [[0, [255, 120, 170]]];
  function glowFill() { [['blur', [120, 170, 255]], ['fx', [255, 150, 90]], ['hdr', [150, 120, 255]], ['tv', [120, 200, 255]], ['br', [255, 210, 120]], ['end', [255, 120, 170]]].forEach(function (k) { GLOW.push([start(k[0]) - .2, k[1]]); }); }
  function glowCol(t) { var c = GLOW[0][1]; for (var i = 1; i < GLOW.length; i++) { var k = seg(t, GLOW[i][0] - .2, GLOW[i][0] + .4); c = [0, 1, 2].map(function (j) { return lerp(c[j], GLOW[i][1][j], k); }); } return c; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) {
      g.drawImage(D.bg, 0, 0);
      var gc = glowCol(t), lx = 520 + 120 * osc(t, 2, .4), ly = 900 + 110 * osc(t, 3, 1.3), gl = g.createRadialGradient(lx, ly, 60, lx, ly, 950);
      gl.addColorStop(0, 'rgba(' + gc.map(Math.round).join(',') + ',.26)'); gl.addColorStop(.6, 'rgba(' + gc.map(Math.round).join(',') + ',.07)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
      /* the two sunset bands drift (periodic in DUR, so the loop is exact) */
      put(g, D.bands[0], -260 + 90 * osc(t, 1, .2), 1500 + 14 * osc(t, 3, 1));
      put(g, D.bands[1], -340 + 120 * osc(t, 1, 2.2), 1640 + 12 * osc(t, 4, .3));
    }
    var ddx = 3 * osc(t, 17, .3) + 2 * osc(t, 29, 1.1), ddy = 3 * osc(t, 13, 2.1) + 2 * osc(t, 31, .7), ps = push(t);
    g.save(); railClip(g); g.translate(510 + ddx, 960 + ddy); g.scale(ps, ps); g.translate(-510, -960);
    props(g, t); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    var S0 = T.dive1, E0 = T.endIn + .1, E1 = T.seamUp + .1, F0 = DUR - .42;
    ["DON'T COPY", 'THESE SETTINGS'].forEach(function (x, i) { Tx('tape' + i, x, 0, T.tapeOff + .1); Tx('tape' + i, x, F0, DUR + 1); });
    Tx('pill', 'GTA 6', 0, T.tapeOff + .1); Tx('pill', 'GTA 6', F0, DUR + 1);
    Tx('od', 'OUR DRAWING', 0, S0 + .1);
    Tx('plate', '1 OF 4 SURVIVES', T.plate + .25, S0 + .1); Tx('plate', '1 OF 4 SURVIVES', E0, E1);
    Tx('verd', 'OUR VERDICTS', T.plate + .25, S0 + .1); Tx('verd', 'OUR VERDICTS', E0, E1);
    ROWS.forEach(function (r, i) {
      Tx('lab' + i, r.name, T.tapeOff + .3, S0 + .1); Tx('lab' + i, r.name, E0, E1 + .15);
      Tx('v' + i, r.verdict + ' ' + r.sub, T.stamps[i] + .12, E1 + .1);
    });
    Tx('n0', 'VIRAL TIP 0', T.notes[0] + .1, S0 + .1); Tx('n0', 'VIRAL TIP 0', T.noteBlur + .1, T.fpsIn); Tx('n0', 'VIRAL TIP 0', E0, E1);
    Tx('n1', 'VIRAL TIP 5 TO 2', T.notes[1] + .1, S0 + .1); Tx('n1', 'VIRAL TIP 5 TO 2', T.noteFx + .1, T.hdrIn + .1); Tx('n1', 'VIRAL TIP 5 TO 2', E0, E1);
    Tx('n2', 'VIRAL TIP 600 50 50', T.notes[2] + .1, S0 + .1); Tx('n2', 'VIRAL TIP 600 50 50', T.noteHdr + .1, T.rip + .1); Tx('n2', 'VIRAL TIP 600 50 50', E0, E1);
    Tx('n3', 'VIRAL TIP ON', T.notes[3] + .1, S0 + .1); Tx('n3', 'VIRAL TIP ON', T.noteBr + .1, T.peel + .1); Tx('n3', 'VIRAL TIP ON', E0, E1);
    Tx('blurT', 'MOTION BLUR STRENGTH', T.dive1 + .25, T.choppyIn + .1);
    Tx('def', 'DEFAULT 3 · MAX 10', T.dive1 + .25, T.choppyIn + .1);
    Tx('fps', '30 FPS', T.fps30 + .08, T.choppyIn + .42);
    Tx('rock1', 'ROCKSTAR: TARGETING', T.rock + .1, T.gb); Tx('rock2', '30 FPS ON CONSOLES', T.rock + .1, T.gb);
    Tx('gb1', 'GAMERBOLT:', T.gb + .05, T.gbOut + .1); Tx('gb2', '0 CAN JUDDER', T.gb + .05, T.gbOut + .1);
    ['HIS PICK ON A', 'STANDARD PS5,', 'NOT A JUDDER FIX'].forEach(function (x, i) { Tx('pk' + i, x, T.quote + .25, T.fxIn + .15); });
    Tx('ill', 'ILLUSTRATION', T.fpsIn + .3, T.fxIn + .1);
    Tx('pan', 'BLUR 0 BLUR 1', T.choppyIn + .4, T.fxIn + .1);
    Tx('q1', 'FEELS THE CLEANEST', T.quote + .04, T.fxIn + .15); Tx('q2', 'JACOB RIDLEY · PC GAMER', T.quote + .04, T.fxIn + .18);
    Tx('v0', 'TEST 0 OR 1', T.fix1 + .15, T.fxIn + .1);
    Tx('fxT', 'VISUAL EFFECTS', T.fxIn + .12, T.hdrIn + .16); ['PLAYER STATUS', 'HIT', 'AWARENESS'].forEach(function (n, i) { Tx('fxN' + i, n, T.fxIn + .12, T.hdrIn + .16); });
    Tx('v1', 'KEEP YOUR CALL', T.keep + .1, T.hdrIn + .15);
    Tx('hdrT', 'HDR CALIBRATION', T.hdrIn + .3, T.tvIn + .1); ['MAX BRIGHTNESS', 'BLACK LEVELS', 'PAPER WHITE'].forEach(function (n, i) { Tx('hdrN' + i, n, T.hdrIn + .3, T.tvIn + .1); });
    ['BRIGHT HDR TV', 'ENTRY HDR TV', 'MAX'].forEach(function (n, i) { Tx('tv' + i, n, T.tvIn + .2, T.brIn + .1); }); Tx('till', 'ILLUSTRATION', T.tvIn + .2, T.brIn + .1);
    Tx('clips', 'CLIPS', T.tvMatch + .3, T.brIn + .25);
    Tx('tvn', 'VIRAL TIP 600', T.tvNote + .1, T.brIn + .1); Tx('src1', 'GAMERBOLT: MATCH', T.src + .1, T.brIn + .1); Tx('src2', "YOUR TV'S MAX", T.src + .1, T.brIn + .1);
    Tx('v2', 'FIX MATCH YOUR TV', T.fix2 + .15, T.brIn + .1);
    Tx('brT', 'BRIGHTNESS REDUCTION', T.brIn + .3, T.endIn - .2); Tx('brD', 'DEFAULT: OFF', T.brIn + .3, T.endIn - .2);
    Tx('cf1', 'ONLY IF BRIGHT', T.comfort + .1, T.endIn - .1); Tx('cf2', 'LIGHT BOTHERS YOU', T.comfort + .1, T.endIn - .1);
    Tx('v3', 'SKIP OUR PICK', T.skip + .15, T.endIn - .2);

    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    /* hook: the sheet lands just after frame 0; the knobs are already being "copied"; 1 OF 4 SURVIVES slides in by 1.9 s */
    T.plate = 1.55; T.plateHit = G('plateHit', 2.2, 'stamp', .25, 1.1);
    /* the tape rips off in the pause before "Four viral tips", so the caption never lands on it */
    T.tapeOff = G('tapeOff', 1.98, 'tear', .12, 1.2);
    T.notes = [at('q', 'four'), at('q', 'viral'), at('q', 'tips') - .05, wend('q', 'tips') + .1];
    G('n3s', T.notes[3], 'slap', .15, .8);
    T.dive1 = G('dive1', start('blur') - .22, 'swish', .2, 1);
    T.noteBlur = at('blur', 'motion') - .1;
    /* the slam starts on "to" and ratchets 3 -> 0 in three notches, landing on the onset of "zero" (ticks are dry clicks above the voice band) */
    T.blurSlam = at('blur', 'to'); EV.push({ t: T.blurSlam, type: 'tick', g: .9, id: 'rb' });
    /* the flipbook drops in the pause before "But" and riffles 14 pages in 0.5 s */
    T.fpsIn = start('fps') - .32; T.riffle = T.fpsIn + .14; EV.push({ t: T.riffle - .02, type: 'riffle', g: 1, id: 'riffle' });
    T.fps30 = at('fps', '30') - .24; G('fps30', T.fps30, 'stamp', .1, 1);
    T.rock = start('fps') - .1;
    T.choppyIn = G('choppyIn', start('choppy') + .02, 'swish', .2, .9);
    T.knob1 = at('choppy', 'one', 1); T.choppyHit = at('choppy', 'sharp');
    /* one read at a time: Gamerbolt's caveat with "Zero is sharp, but can judder", then the PC Gamer pick from "PC Gamer" */
    T.gb = T.choppyIn; T.quote = at('choppy', 'pc') - .12; T.gbOut = T.quote - .1;
    T.fix1 = G('fix1', after('choppy'), 'stamp', .25, 1.2);
    T.fxIn = start('fx') - .2; /* silent: a swish here masked "Two" in the mix (heard "Act 2") */
    T.noteFx = at('fx', 'sliders');
        T.fxSlam = Math.min(G('rf', wend('fx', 'two', 1) + .1, 'tick', .45, 1.2), wend('fx', 'two', 1) + .3);
    T.keep = G('keep', after('fx'), 'stamp', .25, 1.2);
    T.hdrIn = G('hdrIn', start('hdr') + .06, 'swish', .2, .9);
    T.noteHdr = at('hdr', 'hdr'); G('nHdr', T.noteHdr, 'slap', .1, .9);
    T.rip = G('rip', at('hdr', "don't") - .2, 'tear', .2, 1.3);
    T.tvIn = start('tv') - .1;
    T.tvNote = at('tv', 'brightness'); T.tvMatch = at('tv', 'match');
    T.src = start('tv');
    T.fix2 = G('fix2', after('tv'), 'stamp', .25, 1.2);
    T.brIn = G('brIn', at('br', 'brightness') + .06, 'swish', .2, .9);
    T.noteBr = at('br', 'on') - .02; G('nBr', T.noteBr, 'slap', .25, 1);
    T.ships = at('br', 'ships');
    T.peel = G('peel', start('off') - .2, 'tear', .2, 1);
    T.sunIn = T.peel - .1; T.comfort = T.peel - .1;
    T.skip = G('skip', at('off', 'unless') - .05, 'stamp', .25, 1.2);
    T.endIn = G('endIn', start('end') - .05, 'slap', .25, 1);
    T.stamps = [0, 1, 2, 3].map(function (j) { return at('end', 'one') + .1 + j * .11; });
    T.verd = T.endIn - .05; T.lift = at('end', 'one') + .3;
    T.hiKeep = G('hiKeep', wend('end', 'copy') + .18, 'thock', .25, 1);
    T.seamUp = DUR - .45; G('seamUp', T.seamUp, 'swish', .2, .8);
    G('seamLand', DUR - .14, 'slap', .3, .9);
    T.capEnd = T.seamUp;
    STRESS = [['q', 'four'], ['blur', 'zero'], ['fps', '30'], ['choppy', 'sharp'], ['choppy', 'judder'], ['choppy', 'one', 1], ['fx', 'two', 1], ['hdr', "don't"], ['tv', 'match'], ['br', 'off'], ['off', 'off'], ['end', 'one'], ['end', 'safe']].map(function (p) { return at(p[0], p[1], p[2]); });
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

  BODY.tear = .16; BODY.slap = .08; BODY.stamp = .14; BODY.swish = .16; BODY.thock = .1; BODY.tick = .14;
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
    function nband(t0, t1, f0, f1, g0, g1, q, pan, type) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = type || 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g, f) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = f || 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc2('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function boom(t, g, f0, f1, dur) { var o = osc2('sine', f0, t, t + dur + .05, [[t, 0], [t + .006, g], [t + dur * .35, g * .55], [t + dur, 0]]); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .8); }
    function stamp(t, g) { tick(t, 1.6 * g, 2400); thump(t, .8 * g, 170); boom(t, .35 * g, 130, 60, .18); var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); nband(t, t + .07, 2600, 1300, .08 * g, .01 * g, 1); }
    function slap(t, g) { thump(t, .3 * g, 240); nband(t, t + .07, 2600, 1200, .14 * g, .01 * g, .9); tick(t, 1.1 * g, 2000); nband(t, t + .04, 2000, 1300, .16 * g, .02 * g, 1.4); }
    /* tape ripping off paper: a fast run of crackles over a rising band of noise */
    function tear(t, g) { for (var j = 0; j < 11; j++) tick(t + j * .015 + rnd() * .006, (.5 + rnd() * .7) * g, 1800 + rnd() * 3200); nband(t, t + .18, 1300, 4600, .22 * g, .06 * g, 1.1); nband(t + .02, t + .14, 600, 1100, .1 * g, .02 * g, .8); }
    /* one notch of the slider's ratchet: a dry plastic click */
    function rtick(t, g) { for (var j = 0; j < 3; j++) { tick(t + j * .05, 1.3 * g, 2800); thump(t + j * .05, .1 * g, 900); } }
    function swish(t, g) { nband(t, t + .2, 900, 3600, .2 * g, .03 * g, .8); }
    /* a flipbook riffle: fourteen paper flicks in 0.22 s, high and dry */
    function riffle(t, g) { for (var j = 0; j < 14; j++) tick(t + j * .016 + rnd() * .004, (.45 + rnd() * .4) * g, 3000 + rnd() * 2500); nband(t, t + .22, 2400, 5200, .08 * g, .02 * g, 1.2, 0, 'highpass'); }
    var LEVEL = { tick: 3, stamp: 1, thock: 5, slap: 3, tear: 3, swish: 3, riffle: 3 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = window.SFX_TYPE_DB || { tick: -16, stamp: -12, thock: -16, slap: -14, tear: -14, swish: -16, riffle: -16 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'stamp') stamp(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'tear') tear(e.t, g);
      else if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'tick') rtick(e.t, g);
      else if (e.type === 'riffle') riffle(e.t, g);
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '700 40px "Geist Mono"', '800 58px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹|~$+—½@&!§'); })).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures(); EV.length = 0; initTimes(); glowFill();
      window.FILM.POSTER = Math.round((T.hiKeep + .5) * 30) / 30 + 1 / 60;
      window.FILM.SHOTS = [{ id: 'hook', name: "Don't copy", t0: 0, t1: start('blur') }, { id: 'blur', name: 'Motion blur', t0: start('blur'), t1: start('fx') }, { id: 'fx', name: 'Effects', t0: start('fx'), t1: start('hdr') }, { id: 'hdr', name: 'HDR', t0: start('hdr'), t1: start('br') }, { id: 'br', name: 'Brightness Reduction', t0: start('br'), t1: start('end') }, { id: 'end', name: 'Scorecard', t0: start('end'), t1: DUR }];
      window.READY = true;
    });
  }
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-settings', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the backdrop and the clip off, every prop shape and glyph must stay inside x 90-930 and above y 1450 */
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 1; var bad = [], n = Math.round(DUR * fps);
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false; var lt = LIVE.text; LIVE.text = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0a) + Math.abs(d[i + 1] - 0x14) + Math.abs(d[i + 2] - 0x30) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
    for (var i = 0; i < n; i++) {
      var t = (i + .5) / fps; if (moving(t)) continue; frame(ctx, clamp(t, 0, DUR));
      var L0 = dirty(0, 0, 90, H), R0 = dirty(930, 0, 150, H), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0.c + B0.c > 0) bad.push({ f: i, t: +t.toFixed(3), left: L0.c && [L0.c, L0.x0, L0.y0, L0.y1], right: R0.c && [R0.c, R0.x1 + 930, R0.y0, R0.y1], bottom: B0.c && [B0.c, B0.y1, B0.x0 + 90, B0.x1 + 90] });
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; LIVE.text = lt; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
