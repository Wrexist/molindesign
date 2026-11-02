/* "The original kingpin": GTA 6, Delta. A vertical film written in code, narrated first and cut to the voice:
   every visual beat is keyed to a word time from vo/vo.js (window.VO) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Hero prop: ONE hand-built cut-paper palm tree button-up on a wooden hanger, nobody in it, hanging from a closet rod
   in front of a paper wallpaper wall and a cork board that bleed to the full frame. Its print is our own drawing in the
   colours of Rockstar's own Weapon Pattern image (pale blue-teal ground, deep teal palm leaves; their image is never
   used). A garment tag reads TOMMY VERCETTI. Native move: the snip. Paper scissors cut once round the pocket palm; in
   the written pause the swatch flies onto a generic flat paper pistol of our own design and wraps it in the print, and
   the one hero stamp, INSPIRED BY HIS SHIRT, lands. Rockstar's words on torn strips, byte-exact, never highlighted.
   Ends on identical YES / NO tags while the swatch flies home, so the last frame is frame 0. Engine from
   film/gta-kalaga (paper pieces, VAD gate, fontStretch re-apply). No Rockstar footage, logo, key art, screenshots or
   likeness, no real gun model, no music. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0b0820', CREAM = '#fbf0ea';
  var HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d';
  var INK = '#1d1233', PAPER = '#f2e5cd', NEWS = '#efe5cf', KRAFT = '#b8834b', KRAFT2 = '#8a5a2e', BENCH = '#1c1042';
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
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys);
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

  /* =====================================================================================================
     THE SET. A paper wallpaper wall and a cork board below it bleed to the full frame (the only things outside
     the x 90-930 rail). One wooden closet rod. On it, the hero: a cut-paper palm tree button-up on a wooden
     hanger, nobody in it. Its print is our own: teal palms and orange sun dots on pink, on its own layer so it
     can scroll. A garment tag on a string reads TOMMY VERCETTI. Shirt coordinates are local: (0, 0) is the top
     of the hook on the rod at world (510, ROD).
     ===================================================================================================== */
  var ROD = 640, HX = 510, HC = { x: -120, y: 286 }, HR = 112, TILE = 220;
  var PRINT = null, P = {};
  /* the shirt's colours, matched by eye to Rockstar's Weapon Pattern image (cited in BRIEF.md); drawn by us */
  var SH = '#6cc3cd', SH2 = '#4fb0bc', LEAF = '#2c7f8b', LEAF2 = '#3d97a2';
  function palm(g, x, y, s, col, lean) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round';
    var lx = lean || 14;
    g.lineWidth = 9; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(lx * .2, -50, lx, -96); g.stroke();
    g.translate(lx, -96);
    [[-2.75, 58], [-2.2, 62], [-1.55, 50], [-.95, 62], [-.4, 58], [-1.25, 34]].forEach(function (f) {
      var a = f[0], L = f[1]; g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * .5, -15, L, 7); g.quadraticCurveTo(L * .45, 5, 0, 0); g.fill(); g.restore();
    });
    g.beginPath(); g.arc(-3, 4, 5, 0, TAU); g.arc(5, 6, 5, 0, TAU); g.fill();
    g.restore();
  }
  function buildPrint() {
    var c = mk(TILE, TILE), g = c.getContext('2d');
    g.fillStyle = SH; g.fillRect(0, 0, TILE, TILE);
    /* pale leaf flecks, then deep teal palms, all wrapped so the tile repeats seamlessly */
    function wrap(fn) { [-TILE, 0, TILE].forEach(function (dx) { [-TILE, 0, TILE].forEach(function (dy) { g.save(); g.translate(dx, dy); fn(); g.restore(); }); }); }
    wrap(function () {
      g.fillStyle = 'rgba(214,244,244,.55)'; [[40, 40, 15], [160, 92, 11], [96, 178, 13], [196, 196, 8]].forEach(function (d) { g.save(); g.translate(d[0], d[1]); g.rotate(d[0] * .03); g.beginPath(); g.ellipse(0, 0, d[2] * 1.3, d[2] * .45, 0, 0, TAU); g.fill(); g.restore(); });
      g.fillStyle = 'rgba(240,252,250,.85)'; [[130, 30, .5], [24, 132, -.6]].forEach(function (d) { g.save(); g.translate(d[0], d[1]); g.rotate(d[2]); g.beginPath(); g.ellipse(0, 0, 14, 5, 0, 0, TAU); g.fill(); g.restore(); });
      palm(g, 70, 128, .78, LEAF, 12); palm(g, 176, 214, .62, LEAF2, -12);
    });
    return c;
  }
  /* the shirt outline, local coordinates */
  function shirtPath(g) {
    g.beginPath(); g.moveTo(-60, 62); g.lineTo(-250, 118); g.lineTo(-336, 300); g.lineTo(-250, 346); g.lineTo(-212, 264); g.lineTo(-220, 612);
    g.quadraticCurveTo(0, 642, 220, 612); g.lineTo(212, 264); g.lineTo(250, 346); g.lineTo(336, 300); g.lineTo(250, 118); g.lineTo(60, 62);
    g.quadraticCurveTo(0, 98, -60, 62); g.closePath();
  }
  /* a generic pistol outline (slide, frame, trigger guard hole, grip): our own flat shape, no real model's details */
  function gunPath(g) {
    g.beginPath(); g.moveTo(-290, -150); g.lineTo(250, -150); g.lineTo(250, -58); g.lineTo(220, -58); g.lineTo(220, -18); g.lineTo(-30, -18);
    g.quadraticCurveTo(-30, 58, -100, 58); g.lineTo(-190, 58); g.lineTo(-215, 180); g.lineTo(-330, 165); g.quadraticCurveTo(-322, 40, -290, -58); g.closePath();
    g.moveTo(-52, 18); g.ellipse(-92, 18, 40, 24, 0, 0, TAU, true);
  }
  function zig(g, cx, cy, r, n, d) { g.beginPath(); for (var i = 0; i <= n * 2; i++) { var a = i / (n * 2) * TAU, rr0 = r + (i % 2 ? d : -d); var x = cx + Math.cos(a) * rr0, y = cy + Math.sin(a) * rr0; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); }
  /* the shirt's front: fabric + print (offset ox, oy) + pocket + placket. Used for the shirt and, once, for the swatch */
  function shirtFront(g, ox, oy, collarK) {
    var pat = g.createPattern(PRINT, 'repeat'); pat.setTransform(new DOMMatrix().translate(ox, oy));
    g.save(); shirtPath(g); g.clip();
    g.fillStyle = pat; g.fillRect(-340, 40, 680, 620);
    /* folds and side shade, baked as soft cut planes */
    g.fillStyle = 'rgba(0,50,60,.2)'; g.beginPath(); g.moveTo(-220, 264); g.lineTo(-150, 270); g.lineTo(-170, 640); g.lineTo(-230, 640); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(220, 264); g.lineTo(160, 270); g.lineTo(178, 640); g.lineTo(230, 640); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,240,250,.08)'; g.beginPath(); g.moveTo(-60, 260); g.lineTo(-10, 260); g.lineTo(-30, 640); g.lineTo(-90, 640); g.closePath(); g.fill();
    /* sleeve seams */
    g.strokeStyle = 'rgba(0,50,60,.35)'; g.lineWidth = 3; g.setLineDash([9, 7]);
    g.beginPath(); g.moveTo(-212, 264); g.lineTo(-250, 118); g.moveTo(212, 264); g.lineTo(250, 118); g.moveTo(-322, 292); g.lineTo(-238, 336); g.moveTo(322, 292); g.lineTo(238, 336); g.stroke(); g.setLineDash([]);
    /* the breast pocket with its own palm */
    var pp = g.createPattern(PRINT, 'repeat'); pp.setTransform(new DOMMatrix().translate(ox + 63, oy + 41));
    g.save(); g.shadowColor = 'rgba(0,40,50,.45)'; g.shadowBlur = 6; g.shadowOffsetY = 4; g.fillStyle = pp; rr(g, -190, 212, 140, 148, 6); g.fill(); g.restore();
    g.fillStyle = SH2; g.fillRect(-190, 212, 140, 22); g.fillStyle = 'rgba(255,240,234,.55)'; g.fillRect(-190, 232, 140, 3);
    g.save(); rr(g, -190, 236, 140, 124, 6); g.clip(); g.fillStyle = SH; g.globalAlpha = .9; g.fillRect(-190, 236, 140, 124); g.globalAlpha = 1; g.fillStyle = 'rgba(214,244,244,.6)'; g.beginPath(); g.ellipse(-82, 268, 16, 6, .4, 0, TAU); g.fill(); palm(g, -128, 356, .95, LEAF, 16); g.restore();
    g.strokeStyle = 'rgba(255,240,234,.75)'; g.lineWidth = 2; g.setLineDash([6, 5]); rr(g, -184, 218, 128, 136, 5); g.stroke(); g.setLineDash([]);
    /* the placket and its buttons */
    g.fillStyle = 'rgba(0,50,60,.2)'; g.fillRect(14, 92, 4, 540); g.fillStyle = 'rgba(255,240,250,.18)'; g.fillRect(-16, 92, 3, 540);
    [150, 240, 330, 420, 510].forEach(function (y) { g.fillStyle = 'rgba(0,40,50,.35)'; g.beginPath(); g.arc(2, y + 3, 10, 0, TAU); g.fill(); g.fillStyle = CREAM; g.beginPath(); g.arc(0, y, 10, 0, TAU); g.fill(); g.fillStyle = 'rgba(29,18,51,.5)'; g.fillRect(-4, y - 1, 2, 2); g.fillRect(2, y - 1, 2, 2); });
    g.restore();
  }
  function collar(g, k) {
    /* two collar points, folded down (k = 1) or popped up (k < 0) */
    [-1, 1].forEach(function (sd) {
      g.save(); g.translate(0, 62); g.scale(1, k); g.translate(0, -62);
      g.beginPath(); g.moveTo(sd * -2, 66); g.lineTo(sd * 66, 56); g.lineTo(sd * 100, 122); g.lineTo(sd * 30, 156); g.closePath();
      g.save(); g.shadowColor = 'rgba(0,30,40,.5)'; g.shadowBlur = 8; g.shadowOffsetY = 6 * k; g.fillStyle = SH2; g.fill(); g.restore();
      g.strokeStyle = 'rgba(255,240,234,.8)'; g.lineWidth = 2.4; g.stroke();
      g.fillStyle = 'rgba(255,240,234,.12)'; g.beginPath(); g.moveTo(sd * 10, 70); g.lineTo(sd * 60, 62); g.lineTo(sd * 30, 120); g.closePath(); g.fill();
      g.restore();
    });
  }
  function buildTextures() {
    GRAIN = buildGrain(); PRINT = buildPrint();
    /* wall + cork, one bleed sheet (drawn under the camera at parallax .5, bigger than the frame) */
    P.wall = piece([-460, -460, 1560, 2500], rect(-460, -460, 1560, 2500), '#231445', { shadow: false, edge: false, grain: .9, ps: .5, extra: function (g) {
      for (var x = -460; x < 1560; x += 120) { g.fillStyle = 'rgba(160,110,255,.07)'; g.fillRect(x, -460, 60, 1860); g.fillStyle = 'rgba(255,79,163,.07)'; g.fillRect(x + 58, -460, 4, 1860); }
      var r = mulberry(8); g.fillStyle = 'rgba(25,211,197,.13)';
      for (var y = -440; y < 1380; y += 120) for (var x2 = -470; x2 < 1560; x2 += 120) { g.save(); g.translate(x2 + ((y / 120) % 2 ? 60 : 0) + 30, y); g.rotate(.8); g.fillRect(-5, -5, 10, 10); g.restore(); }
      var gr = g.createRadialGradient(510, 860, 80, 510, 860, 700); gr.addColorStop(0, 'rgba(255,170,120,.2)'); gr.addColorStop(1, 'rgba(255,170,120,0)'); g.fillStyle = gr; g.fillRect(-460, -460, 2020, 1840);
      /* baseboard and cork */
      g.fillStyle = '#7d4f28'; g.fillRect(-460, 1378, 2020, 1130);
      for (var i = 0; i < 4200; i++) { var cx = -460 + r() * 2020, cy = 1400 + r() * 1100; g.fillStyle = r() < .5 ? 'rgba(40,20,5,.22)' : 'rgba(230,180,120,.18)'; g.fillRect(cx, cy, 2 + r() * 4, 2 + r() * 3); }
      g.fillStyle = '#e6b866'; g.fillRect(-460, 1368, 2020, 22); g.fillStyle = 'rgba(40,20,5,.45)'; g.fillRect(-460, 1390, 2020, 10);
    } });
    /* the closet rod and its two brackets */
    P.rod = piece([196, ROD - 11, 824, ROD + 11], function (g) { rr(g, 196, ROD - 11, 628, 22, 11); }, grad(ROD - 11, ROD + 11, [[0, '#f0c27e'], [.5, '#c98a4b'], [1, '#8a5a2e']]), { sx: 4, sy: 10, blur: 12, edge: 1.4 });
    P.bracket = piece([-26, -40, 26, 40], function (g) { rr(g, -26, -40, 52, 80, 6); }, KRAFT2, { sx: 3, sy: 7, blur: 8, extra: function (g) { g.fillStyle = '#c9ccd8'; g.beginPath(); g.arc(0, -24, 4, 0, TAU); g.arc(0, 24, 4, 0, TAU); g.fill(); } });
    /* the shirt: outline, shadow and grain baked once; the print is drawn live over it */
    P.shirt = piece([-340, 56, 340, 645], shirtPath, SH, { sx: 10, sy: 18, blur: 26, sc: 'rgba(6,3,18,.55)', grain: 0, edge: false });
    P.shirtTop = piece([-340, 56, 340, 645], shirtPath, 'rgba(0,0,0,0)', { shadow: false, grain: .55, edge: 2.4 });
    /* the wooden hanger bar (seen inside the neck) */
    P.bar = piece([-70, 54, 70, 80], function (g) { g.beginPath(); g.moveTo(-70, 78); g.quadraticCurveTo(0, 50, 70, 78); g.lineTo(70, 80); g.quadraticCurveTo(0, 62, -70, 80); g.closePath(); }, '#c98a4b', { shadow: false, edge: 1.2 });
    /* the swatch: our cut, a pinking-shears circle around the pocket palm */
    P.swatch = piece([HC.x - HR - 8, HC.y - HR - 8, HC.x + HR + 8, HC.y + HR + 8], function (g) { zig(g, HC.x, HC.y, HR, 40, 5); }, SH, { sx: 6, sy: 10, blur: 14, grain: .7, edge: 3, edgeCol: 'rgba(255,250,240,.95)', extra: function (g) { shirtFront(g, 0, 0, 1); } });
    /* the garment tag */
    P.tag = cardPiece(330, 184, CREAM, [['TOMMY', 72, INK, -36, null, 18], ['VERCETTI', 72, INK, 40, null, 18]], { r: 8, ring: null, path: function (g) { g.beginPath(); g.moveTo(-165, -60); g.lineTo(-120, -92); g.lineTo(165, -92); g.lineTo(165, 92); g.lineTo(-120, 92); g.lineTo(-165, 60); g.closePath(); }, after: function (g) { g.fillStyle = '#2a1850'; g.beginPath(); g.arc(-138, 0, 9, 0, TAU); g.fill(); g.strokeStyle = '#e6b866'; g.lineWidth = 3; g.beginPath(); g.arc(-138, 0, 13, 0, TAU); g.stroke(); g.fillStyle = TEAL; g.fillRect(-122, -92, 7, 184); } });
    /* the tag's back: blank care-label lines, no words */
    P.tagBack = piece([-165, -92, 165, 92], function (g) { g.beginPath(); g.moveTo(165, -60); g.lineTo(120, -92); g.lineTo(-165, -92); g.lineTo(-165, 92); g.lineTo(120, 92); g.lineTo(165, 60); g.closePath(); }, '#efe2d4', { sy: 9, blur: 12, extra: function (g) { g.fillStyle = 'rgba(29,18,51,.28)'; [-50, -18, 14, 46].forEach(function (y, i) { g.fillRect(-120, y, 200 - i * 34, 10); }); g.fillStyle = '#2a1850'; g.beginPath(); g.arc(138, 0, 9, 0, TAU); g.fill(); g.fillStyle = TEAL; g.fillRect(115, -92, 7, 184); } });
    /* the ? tag on the hook */
    P.qtag = cardPiece(200, 230, PAPER, [['?', 180, HOT, 14]], { r: 10, sy: 9 });
    /* the Vice City postcard: our own drawing (sky, sun, sea, palms, low blocks), no logo, no key art */
    P.post = (function () {
      var w = 470, h = 320, rec = [];
      var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { rr(g, -w / 2, -h / 2, w, h, 8); }, CREAM, { sx: 6, sy: 12, blur: 16, extra: function (g) {
        var x0 = -w / 2 + 16, y0 = -h / 2 + 16, iw = w - 32, ih = h - 112;
        g.save(); g.beginPath(); g.rect(x0, y0, iw, ih); g.clip();
        var gr = g.createLinearGradient(0, y0, 0, y0 + ih); gr.addColorStop(0, '#ff7cbd'); gr.addColorStop(.6, '#ffb067'); gr.addColorStop(1, '#ffd27e'); g.fillStyle = gr; g.fillRect(x0, y0, iw, ih);
        g.fillStyle = '#fff1c2'; g.beginPath(); g.arc(30, y0 + ih - 40, 54, 0, TAU); g.fill();
        g.fillStyle = '#5a2a7a'; var bx = [[-150, 70], [-118, 110], [-80, 84], [-44, 128], [-6, 96], [60, 120], [96, 78], [130, 104]];
        bx.forEach(function (b) { g.fillRect(b[0], y0 + ih - 30 - b[1], 34, b[1]); });
        g.fillStyle = '#19b9ad'; g.fillRect(x0, y0 + ih - 32, iw, 32); g.fillStyle = 'rgba(255,255,255,.5)'; for (var i = 0; i < 6; i++) g.fillRect(x0 + 20 + i * 70, y0 + ih - 20, 36, 3);
        palm(g, -176, y0 + ih - 4, 1.3, INK, 20); palm(g, 182, y0 + ih - 4, 1.15, INK, -18);
        g.restore();
        cond(g); font(g, 54, 900); ls(g, 1); g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = INK; g.fillText('GTA VICE CITY', -w / 2 + 22, h / 2 - 48); var m1 = g.measureText('GTA VICE CITY');
        rec.push([-w / 2 + 22, h / 2 - 48 - 34, -w / 2 + 22 + m1.width, h / 2 - 48 + 28, 'GTA VICE CITY']);
        font(g, 60, 900); g.textAlign = 'right'; g.fillStyle = HOT; g.fillText('2002', w / 2 - 22, h / 2 - 48); var m2 = g.measureText('2002'); rec.push([w / 2 - 22 - m2.width, h / 2 - 48 - 34, w / 2 - 22, h / 2 - 48 + 28, '2002']); unst(g);
      } });
      pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; });
      return pc;
    })();
    P.pin = piece([-16, -16, 16, 16], function (g) { g.beginPath(); g.arc(0, 0, 14, 0, TAU); }, TEAL, { sx: 3, sy: 5, blur: 5, edge: 1.5, after: function (g) { g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(-4, -4, 4, 0, TAU); g.fill(); } });
    /* the scissors: two cut halves on a brass pivot; blades point along +x */
    P.blade = piece([-120, -16, 150, 16], function (g) { g.beginPath(); g.moveTo(-10, -9); g.lineTo(150, -1); g.lineTo(148, 3); g.lineTo(-10, 10); g.closePath(); g.moveTo(-14, -6); g.lineTo(-58, -10); g.lineTo(-62, 4); g.lineTo(-14, 6); g.closePath(); }, '#dfe3ea', { sx: 4, sy: 7, blur: 8, edge: 1.6, extra: function (g) { g.fillStyle = 'rgba(120,130,150,.35)'; g.beginPath(); g.moveTo(-10, 1); g.lineTo(150, 1); g.lineTo(-10, 10); g.closePath(); g.fill(); } });
    P.handle = piece([-125, -36, -50, 36], function (g) { g.beginPath(); g.ellipse(-88, 0, 36, 26, 0, 0, TAU); g.ellipse(-88, 0, 22, 14, 0, 0, TAU, true); }, ORG, { sx: 4, sy: 7, blur: 8, edge: 1.6 });
    /* the sample card and the one hero stamp */
    P.stamp = buildStamp(['INSPIRED', 'BY HIS', 'SHIRT'], 110, 290);
    /* the paper pistol: a generic flat silhouette of our own (no real model), ink paper */
    P.gun = piece([-332, -152, 252, 182], gunPath, '#2a1850', { sx: 8, sy: 14, blur: 20, edge: 2.4, extra: function (g) { g.fillStyle = 'rgba(255,240,234,.1)'; g.fillRect(-290, -150, 540, 12); g.fillStyle = 'rgba(0,0,0,.25)'; for (var x = 120; x < 220; x += 18) g.fillRect(x, -146, 7, 80); g.fillStyle = 'rgba(255,240,234,.14)'; g.beginPath(); g.moveTo(-200, 0); g.lineTo(-230, 150); g.lineTo(-300, 142); g.lineTo(-282, 0); g.closePath(); g.fill(); g.fillStyle = '#140b2c'; g.beginPath(); g.moveTo(-92, 2); g.quadraticCurveTo(-70, 20, -84, 40); g.lineTo(-96, 38); g.quadraticCurveTo(-86, 20, -102, 4); g.closePath(); g.fill(); } });
    /* the two edition tags, identical but for the word; the end vote, identical */
    function tagPiece(word, w, px) { return cardPiece(w, 150, CREAM, [[word, px, INK, 8, null, 14]], { r: 8, ring: 'rgba(29,18,51,.25)', path: function (g) { g.beginPath(); g.moveTo(-w / 2 + 34, -75); g.lineTo(w / 2, -75); g.lineTo(w / 2, 75); g.lineTo(-w / 2 + 34, 75); g.lineTo(-w / 2, 40); g.lineTo(-w / 2, -40); g.closePath(); }, after: function (g) { g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(-w / 2 + 24, 0, 8, 0, TAU); g.fill(); } }); }
    P.std = tagPiece('STANDARD', 280, 58); P.ult = tagPiece('ULTIMATE', 280, 58);
    P.yes = tagPiece('YES', 300, 96); P.no = tagPiece('NO', 300, 96);
    P.nameOnly = cardPiece(560, 200, CREAM, [['PAGE:', 60, INK, -42], ['NAME ONLY', 86, INK, 36]], { r: 10, ring: TEAL });
    /* the GTA 6 sticker, scoped to the page */
    P.pill = cardPiece(330, 82, HOT, [['GTA 6’S PAGE', 60, INK, 3]], { r: 41, ring: 'rgba(255,240,234,.9)' });
    /* Rockstar's words, exactly as printed on rockstargames.com/VI (straight ' in Vercetti's), cut with … */
    P.s1 = buildStrip('“Channel the Original Kingpin”', 800, 54, 61);
    P.s2 = buildStrip('“…inspired by Tommy Vercetti\'s iconic palm tree button-up.”', 780, 52, 63);
  }
  function buildStamp(lines, px, maxw) {
    var m = mk(4, 4).getContext('2d'); cond(m); font(m, px, 900); ls(m, 2); var w1 = Math.max.apply(null, lines.map(function (L) { return m.measureText(L).width; })); unst(m);
    if (w1 > maxw) { px = Math.floor(px * maxw / w1); cond(m); font(m, px, 900); ls(m, 2); w1 = Math.max.apply(null, lines.map(function (L) { return m.measureText(L).width; })); unst(m); }
    var lh = px * 1.02, w = w1 + 56, h = lines.length * lh + 56, tp = jag(95, w, 4), bt = jag(96, w, 4), rec = [];
    var pc = piece([-w / 2, -h / 2 - 8, w / 2, h / 2 + 8], function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + q[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(-w / 2 + bt[i][0], h / 2 + bt[i][1]); g.closePath(); }, NEWS, { sx: 6, sy: 12, blur: 16, extra: function (g) {
      var r = mulberry(91);
      g.strokeStyle = HOT; g.lineWidth = 9; g.strokeRect(-w / 2 + 12, -h / 2 + 14, w - 24, h - 28);
      lines.forEach(function (L, i) { var y = -h / 2 + 28 + lh * (i + .5); inkText(g, L, 0, y + 2, px, HOT, 93 + i, { dense: 26, big: 2.2, ls: 2 }); rec.push([-w1 / 2, y - px * .5, w1 / 2, y + px * .45, L]); });
      g.globalCompositeOperation = 'destination-out';
      for (var i = 0; i < 520; i++) { g.globalAlpha = .2 + r() * .5; g.beginPath(); g.arc(-w / 2 + 16 + r() * (w - 32), -h / 2 + 14 + r() * (h - 28), .5 + r() * 1.8, 0, TAU); g.fill(); }
    } });
    pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; });
    pc.sw = w; pc.sh = h; return pc;
  }

  /* =====================================================================================================
     THE CAMERA: a slow push on "So why"; on the snip the frame changes shape (the shirt steps up and left, small,
     so the paper pistol and the stamp get the room); a 1.15 push onto the name tag on "never"; home for the loop.
     Keyframes are mixed in order. The wall rides at parallax .5.
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true }, BASE = 1.0;
  var CAM_HOME = { s: 1, cx: 510, cy: 880 }, CAM_PUSH = { s: 1.06, cx: 510, cy: 900 }, CAM_HERO = { s: .62, cx: 800, cy: 1092 }, CAM_TAG = { s: 1.15, cx: 520, cy: 900 };
  /* mixed in screen space (s and s*c are linear), so every world point moves on a straight line between keyframes */
  function mixc(a, b, k) { var s = lerp(a.s, b.s, k); return { s: s, cx: lerp(a.s * a.cx, b.s * b.cx, k) / s, cy: lerp(a.s * a.cy, b.s * b.cy, k) / s }; }
  function cam(t) {
    var k1 = eio(seg(t, T.push0, T.push0 + 1.6)), k2 = eio(seg(t, T.lift, T.lift + .55)), k3 = eio(seg(t, T.tagPush0, T.tagPush0 + 1.0)), k4 = eio(seg(t, T.home0, T.home0 + 1.1));
    var c = mixc(mixc(mixc(mixc(CAM_HOME, CAM_PUSH, k1), CAM_HERO, k2), CAM_TAG, k3), CAM_HOME, k4);
    c.s *= (1 + .008 * osc(t, 3)) * kn(t, T.stamp, .012);
    c.moving = [k1, k2, k3, k4].some(function (k) { return k > .001 && k < .999; });
    return c;
  }
  function L(g, C, p) { var zz = 1 + (C.s * BASE - 1) * p; g.translate(510, 880); g.scale(zz, zz); g.translate(-(510 + (C.cx - 510) * p), -(880 + (C.cy - 880) * p)); }
  function toScreen(C, x, y) { return { x: 510 + (x - C.cx) * C.s * BASE, y: 880 + (y - C.cy) * C.s * BASE }; }

  /* the shirt's swing: frame 0 is mid-swing, a big swing that runs through the loop point and settles; slow sway; kicks */
  function seamS(t) { return t < DUR / 2 ? t : t - DUR; }
  function swing(t) {
    var s = seamS(t), env = Math.exp(-Math.pow(s / 1.25, 2));
    var a = .17 * Math.sin(TAU * s / 1.35) * env + .016 * osc(t, 8, .5);
    a += sw(t, T.kStory, .035, 6, 2.2) + sw(t, T.kWhy, .03, 6, 2.2) + sw(t, T.collar, .03, 7, 2.6) + sw(t, T.cutEnd, .05, 6, 2.0) + sw(t, T.spin, .03, 6, 2.4) + sw(t, T.kPalms, .05, 6, 2.2) + sw(t, T.kGuns, .05, 6, 2.2);
    return a;
  }
  /* the name tag's turn: a full turn that runs through the loop point and lands on "names", and one on "never" */
  function tagTurn(t) { var s = seamS(t); return TAU * eio(seg(s, -.7, T.kNames)) + TAU * eio(seg(t, T.spin, T.spin + .9)); }
  function printOff(t) { var k = eio(seg(t, T.scroll0, T.scroll0 + 1.3)); return { x: 0, y: TILE * k }; }
  function collarK(t) { var up = cd(t, T.collar, 16), dn = eio(seg(t, T.collarDn, T.collarDn + .45)); return 1 - 1.55 * up * (1 - dn); }
  /* where the scissors are on the cut (angle around the swatch circle), and how much is cut */
  function cutK(t) { return eio(seg(t, T.cut0, T.cutEnd)); }
  function hookTag(g, t, C) {
    /* the ? tag hangs on the hook between "So why" and "Rockstar's words" */
    var k = cd(t, T.q, 18), out = eio(seg(t, T.qOut, T.qOut + .4));
    if (t < T.q - .02 || out >= 1) return;
    var y = lerp(-260, 0, k) - out * 340, rot = sw(t, T.q + .1, .25, 8, 2.6) + .05 * osc(t, 7);
    g.save(); g.globalAlpha *= 1 - out; g.translate(-12, 20 + y); g.rotate(rot);
    g.strokeStyle = '#e9d6bd'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(-96, 64); g.stroke();
    g.translate(-110, 64); g.rotate(-.12); NOREC = k < .98 || out > 0 || C.moving; putW(g, P.qtag, 0, 112); NOREC = false;
    g.fillStyle = '#2a1850'; g.beginPath(); g.arc(0, 14, 8, 0, TAU); g.fill(); g.restore();
  }
  function shirtSet(g, t, C) {
    var a = swing(t), po = printOff(t), ck = collarK(t);
    /* rod and brackets */
    put(g, P.bracket, 220, ROD); put(g, P.bracket, 800, ROD); put(g, P.rod, 0, 0);
    g.save(); g.translate(HX, ROD); g.rotate(a);
    /* the hook over the rod */
    g.save(); g.strokeStyle = 'rgba(6,3,18,.45)'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(3, 72); g.lineTo(3, 18); g.arc(-12, 6, 15, 0, Math.PI * 1.15, true); g.stroke();
    g.strokeStyle = '#c9ccd8'; g.lineWidth = 7; g.beginPath(); g.moveTo(0, 70); g.lineTo(0, 14); g.arc(-15, 2, 15, 0, Math.PI * 1.15, true); g.stroke(); g.restore();
    put(g, P.shirt, 0, 0);
    shirtFront(g, po.x, po.y, ck);
    /* the cut: dashed guide drawn on "Look", the slit opening behind the scissors, then the hole */
    var dk = eio(seg(t, T.dash0, T.dash0 + 1.0)), ckk = cutK(t), lifted = t >= T.lift && t < T.seat;
    if (lifted) {
      g.save(); zig(g, HC.x, HC.y, HR, 40, 5); g.fillStyle = '#140b2c'; g.fill(); g.clip();
      g.fillStyle = 'rgba(160,110,255,.08)'; g.fillRect(HC.x - 40, HC.y - HR - 10, 60, 2 * HR + 20);
      /* the cloth's thickness: a lit lower lip and a dark inner shadow under the top edge */
      var ig = g.createLinearGradient(0, HC.y - HR, 0, HC.y + HR); ig.addColorStop(0, 'rgba(0,0,0,.75)'); ig.addColorStop(.45, 'rgba(0,0,0,.1)'); ig.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = ig; g.fillRect(HC.x - HR - 10, HC.y - HR - 10, 2 * HR + 20, 2 * HR + 20);
      g.strokeStyle = 'rgba(111,195,205,.9)'; g.lineWidth = 10; g.beginPath(); g.arc(HC.x, HC.y + 8, HR - 2, .15 * Math.PI, .85 * Math.PI); g.stroke();
      g.restore();
      g.save(); zig(g, HC.x, HC.y, HR, 40, 5); g.strokeStyle = 'rgba(255,250,240,.95)'; g.lineWidth = 3; g.stroke(); g.restore();
    } else if (dk > 0 && t < T.seat) {
      g.save(); g.lineCap = 'round';
      var a0 = 0, aCut = TAU * ckk, aDash = TAU * dk;
      if (aCut > .01) { g.strokeStyle = '#140b2c'; g.lineWidth = 4; g.beginPath(); g.arc(HC.x, HC.y, HR, a0, a0 + aCut); g.stroke(); }
      if (aDash > aCut) { g.strokeStyle = CREAM; g.lineWidth = 4; g.setLineDash([14, 10]); g.beginPath(); g.arc(HC.x, HC.y, HR, a0 + aCut, a0 + aDash); g.stroke(); g.setLineDash([]); }
      g.restore();
    }
    put(g, P.shirtTop, 0, 0);
    put(g, P.bar, 0, 0);
    collar(g, ck);
    /* the garment tag on its string: turns (through the loop) and lands on "names", turns again on "never" */
    var tsw = .06 * osc(t, 6, 1) + sw(t, T.kNames, .12, 8, 2.6) + sw(t, T.spin + .6, .1, 8, 2.6) - .3 * a;
    var spin = Math.cos(tagTurn(t));
    var tx = 158, ty = 318, hole = { x: -138, y: 0 };
    var ca = Math.cos(.1 + tsw), sa = Math.sin(.1 + tsw), hx = tx + ca * hole.x * spin - sa * hole.y, hy = ty + sa * hole.x * spin + ca * hole.y;
    g.save(); g.strokeStyle = 'rgba(6,3,18,.4)'; g.lineWidth = 3; g.beginPath(); g.moveTo(10, 84); g.quadraticCurveTo(60, 140, hx + 3, hy + 5); g.stroke();
    g.strokeStyle = '#e9d6bd'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(8, 80); g.quadraticCurveTo(58, 136, hx, hy); g.stroke(); g.restore();
    g.save(); g.translate(tx, ty); g.rotate(.1 + tsw); g.scale(Math.max(.02, Math.abs(spin)), 1); g.scale(kn(t, T.kNames, .08), kn(t, T.kNames, .08));
    NOREC = Math.abs(spin) < .98 || C.moving; if (spin >= 0) putW(g, P.tag, 0, 0); else put(g, P.tagBack, 0, 0); NOREC = false; g.restore();
    hookTag(g, t, C);
    /* the swatch seated back in the hole at the end of the loop */
    if (t >= T.seat0 && t < T.seat) {
      var sk = eio(seg(t, T.seat0, T.seat)), s0 = SW_FROM;
      var lx = lerp(s0.x, 0, sk), ly = lerp(s0.y, 0, sk);
      g.save(); g.translate(lx, ly); g.translate(HC.x, HC.y); g.rotate((1 - sk) * -.5); g.scale(lerp(.7, 1, sk), lerp(.7, 1, sk)); g.translate(-HC.x, -HC.y); g.globalAlpha *= seg(t, T.seat0, T.seat0 + .2); put(g, P.swatch, 0, 0); g.restore();
    }
    g.restore();
  }
  var SW_FROM = { x: 40, y: 250 };
  /* the scissors: come in from the right, cut once round the circle, leave in the pause */
  function scissors(g, t, C) {
    if (t < T.sc0 - .02 || t > T.scOut + .5) return;
    var a = swing(t), inK = eio(seg(t, T.sc0, T.cut0)), outK = eio(seg(t, T.scOut, T.scOut + .45)), ck = cutK(t);
    var ang = TAU * ck, px = HC.x + Math.cos(ang) * HR, py = HC.y + Math.sin(ang) * HR;
    var wx = HX + Math.cos(a) * px - Math.sin(a) * py, wy = ROD + Math.sin(a) * px + Math.cos(a) * py;
    var dir = ang + Math.PI / 2 + a;
    var sx = lerp(720, wx, inK), sy = lerp(1060, wy, inK), sd = lerp(-2.3, dir, inK);
    sx = lerp(sx, 700, outK); sy = lerp(sy, 1060, outK); sd = lerp(sd, -2.3, outK);
    var open = .05 + .32 * (.5 + .5 * Math.sin((t - T.sc0) * 22)) * (t > T.cut0 && t < T.cutEnd ? 1 : .35);
    g.save(); g.globalAlpha *= seg(t, T.sc0, T.sc0 + .15) * (1 - seg(t, T.scOut + .25, T.scOut + .5));
    g.translate(sx, sy); g.rotate(sd); g.scale(.72, .72); g.translate(-118, 0);
    [-1, 1].forEach(function (k) { g.save(); g.rotate(k * open / 2); g.scale(1, k); put(g, P.handle, 0, 10); put(g, P.blade, 0, 0); g.restore(); });
    g.fillStyle = '#e6b866'; g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fill(); g.fillStyle = '#7a4d27'; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
    g.restore();
  }
  function world(g, t, C) {
    g.save(); L(g, C, .5); if (LIVE2.bg) put(g, P.wall, 0, 0); else { g.fillStyle = BG; g.fillRect(-300, -300, 1700, 2600); } g.restore();
    g.save(); if (LIVE2.clip) { g.beginPath(); g.rect(BX0, 0, BX1 - BX0, 1450); g.clip(); }
    g.save(); L(g, C, 1); shirtSet(g, t, C); scissors(g, t, C); g.restore();
    g.restore();
  }

  /* =====================================================================================================
     THE GLASS: strips, cards, chips, the stamp. Nothing here crosses y 1450: cards flap down from their top
     edge, tags drop from above, chips come in from above.
     ===================================================================================================== */
  function stripAt(g, t, Pc, x, y, tin, tout, o) {
    o = o || {};
    if (t < tin - .02 || t > tout + .5) return;
    var k = cd(t, tin, 15), peel = eio(seg(t, tout, tout + .45)), dir = o.dir || 1;
    var yy = lerp(y + (o.from || -260), y, k) - peel * (o.up || 0), rot = (o.rot || -.012) + (1 - k) * .06 * dir + peel * .12 * dir, s = kn(t, tin + .12, .03) * (1 - .15 * peel);
    NOREC = k < .98 || peel > 0;
    g.save(); g.globalAlpha *= fin(t, tin, .1) * (1 - peel); g.translate(x, yy); g.rotate(rot); g.scale(s, s);
    putW(g, Pc, -Pc.sw / 2, -Pc.sh / 2);
    tape(g, -Pc.sw / 2 + 40, -Pc.sh / 2 + 4, 90, 30, -.3); tape(g, Pc.sw / 2 - 40, -Pc.sh / 2 + 4, 90, 30, .28);
    g.restore(); NOREC = false;
  }
  function chipAt(g, t, text, x, y, tin, tout, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .3) return;
    var k = cd(t, tin, 14); NOREC = k < .98 || t > tout;
    chip(g, text, x, y + (1 - k) * (o.from || -40), { px: o.px || 36, bg: o.bg || ORG, fg: INK, a: fin(t, tin, .08) * (1 - seg(t, tout, tout + .25)), rot: o.rot || 0, s: kn(t, tin + .1, .05) });
    NOREC = false;
  }
  /* a card that flaps down from its top edge (k 0..1) and flaps back up on its way out */
  function flap(g, t, Pc, x, y, tin, tout, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .5) return 0;
    var k = cd(t, tin, o.w || 15) * (1 - eio(seg(t, tout, tout + .4))); if (k < .01) return 0;
    var hh = (Pc.h - 72) / 2;
    g.save(); g.translate(x, y - hh); g.rotate((o.rot || 0) + sw(t, tin + .1, .04, 8, 3)); g.scale(1, k); g.translate(0, hh);
    NOREC = k < .98; putW(g, Pc, 0, 0); if (o.after) o.after(g, k); NOREC = false; g.restore();
    return k;
  }
  /* a tag that drops from above on a pin, swings and settles */
  function dropTag(g, t, Pc, x, y, tin, tout, knock, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .5) return;
    var k = cd(t, tin, 16), out = eio(seg(t, tout, tout + .4)), w2 = (Pc.w - 72) / 2;
    var yy = lerp(y - (o.from || 220), y, k) - out * 160, rot = (o.rot || 0) + sw(t, tin + .08, .08, 8, 2.8) + .015 * osc(t, 7, x) + (knock ? sw(t, knock, .05, 10, 3) : 0), s = knock ? kn(t, knock, .08) : 1;
    g.save(); g.globalAlpha *= fin(t, tin, .08) * (1 - out); g.translate(x - w2 + 24, yy); g.rotate(rot); g.scale(s, s); g.translate(w2 - 24, 0);
    NOREC = k < .98 || out > 0; putW(g, Pc, 0, 0); NOREC = false;
    if (o.extra) o.extra(g);
    put(g, P.pin, -w2 + 24, 0);
    g.restore();
  }
  /* the paper pistol (our own generic flat silhouette, no real model), in screen space; k = how much of its skin wears the print */
  var GUN = { x: 410, y: 1190, s: .85 }, GUN_SKIN = { x: 40, y: -95 };
  function gunSkinPath(g) { g.beginPath(); rr(g, -290, -150, 540, 92, 10); g.rect(-280, -62, 500, 44); }
  function gunAt(g, t, a, wrapK, ghost) {
    g.save(); g.translate(GUN.x, GUN.y); g.scale(GUN.s, GUN.s); g.rotate(-.03);
    if (ghost) {
      g.globalAlpha *= a; g.setLineDash([16, 12]); g.lineWidth = 5; g.strokeStyle = CREAM; gunPath(g); g.stroke(); g.setLineDash([]);
    } else {
      g.globalAlpha *= a; put(g, P.gun, 0, 0);
      if (wrapK > 0) {
        g.save(); gunPath(g); g.clip(); gunSkinPath(g); g.clip(); g.beginPath(); g.arc(GUN_SKIN.x, GUN_SKIN.y, 620 * wrapK, 0, TAU); g.clip();
        var pat = g.createPattern(PRINT, 'repeat'); pat.setTransform(new DOMMatrix().translate(30, 12)); g.fillStyle = pat; g.fillRect(-300, -160, 560, 150);
        g.fillStyle = 'rgba(0,30,40,.18)'; g.fillRect(-300, -66, 560, 50); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-290, -150, 540, 10);
        g.restore();
        g.save(); gunSkinPath(g); g.strokeStyle = 'rgba(255,250,240,.9)'; g.lineWidth = 2.4; g.stroke(); g.restore();
      }
    }
    g.restore();
  }
  var TAGX = 770, TAGY = [1062, 1236];
  function glass(g, t, C) {
    /* the hook's source chip, after frame 0 */
    chipAt(g, t, 'ROCKSTARGAMES.COM/VI', CX, 1350, T.srcIn, T.srcOut, { px: 40, bg: ORG });
    /* who: the Vice City postcard and its chips */
    if (t >= T.post - .02 && t < T.postOut + .5) {
      var pk = cd(t, T.post, 14), po = eio(seg(t, T.postOut, T.postOut + .4));
      g.save(); g.globalAlpha *= fin(t, T.post, .1) * (1 - po); g.translate(350, lerp(1000, 1236, pk) - po * 220); g.rotate(lerp(-.1, -.045, pk) + sw(t, T.post + .15, .02, 8, 3)); g.scale(kn(t, T.kVice, .02), kn(t, T.kVice, .02));
      NOREC = pk < .98 || po > 0; putW(g, P.post, 0, 0); NOREC = false; put(g, P.pin, 0, -140); g.restore();
    }
    chipAt(g, t, 'OCT 2002 · PS2', 735, 1180, T.octIn, T.octOut, { px: 44, bg: CREAM, rot: .02 });
    chipAt(g, t, 'SOURCE: TAKE-TWO', 735, 1262, T.ttIn, T.octOut, { px: 36, rot: -.015 });
    /* kingpin: Rockstar's heading on a strip, low, landing on "Channel" */
    stripAt(g, t, P.s1, CX, 1250, T.s1In, T.s1Out, { rot: -.01, from: -200 });
    chipAt(g, t, 'ROCKSTARGAMES.COM/VI · WEAPON PATTERN', CX, 1250 - P.s1.sh / 2 - 30, T.s1src, T.s1Out, { rot: .008, bg: ORG });
    /* look: "guns" is seen before the cut: a dashed pistol outline, our own shape, and Rockstar's two words */
    if (t >= T.ghost - .02 && t < T.lift + .3) gunAt(g, t, fin(t, T.ghost, .25) * (1 - seg(t, T.lift, T.lift + .3)) * .85, 0, true);
    chipAt(g, t, 'ROCKSTAR: “most guns”', CX, 1405, T.mostIn, T.mostOut, { px: 44, bg: CREAM, rot: .01 });
    /* shirt: Rockstar's sentence comes in low over the cut, then rises to the caption band as the frame changes shape */
    if (t >= T.s2In - .02 && t < T.s2Out + .5) {
      var rk = eio(seg(t, T.lift, T.lift + .55)), k2 = cd(t, T.s2In, 15), peel = eio(seg(t, T.s2Out, T.s2Out + .45));
      var yy = lerp(lerp(1060, 1255, k2), 432, rk) - 60 * peel;
      NOREC = k2 < .98 || (rk > .001 && rk < .999) || peel > 0;
      g.save(); g.globalAlpha *= fin(t, T.s2In, .1) * (1 - peel); g.translate(CX, yy); g.rotate(.006 - .03 * bump(t, T.lift, .55) - .1 * peel); g.scale(kn(t, T.s2In + .12, .03), kn(t, T.s2In + .12, .03));
      putW(g, P.s2, -P.s2.sw / 2, -P.s2.sh / 2); tape(g, -P.s2.sw / 2 + 40, -P.s2.sh / 2 + 4, 90, 30, -.3); tape(g, P.s2.sw / 2 - 40, -P.s2.sh / 2 + 4, 90, 30, .28);
      if (t >= T.s2src - .02) chip(g, 'ROCKSTARGAMES.COM/VI · WEAPON PATTERN', 0, -P.s2.sh / 2 - 26, { px: 36, bg: ORG, fg: INK, a: fin(t, T.s2src, .1), rot: -.01 });
      g.restore(); NOREC = false;
    }
    /* the hero: the swatch leaves the shirt and wraps the paper pistol in its print; the stamp */
    var gunOut = eio(seg(t, T.gunOut, T.gunOut + .4));
    if (t >= T.lift && gunOut < 1) {
      var ga = fin(t, T.lift, .3) * (1 - gunOut), wk = eio(seg(t, T.land, T.land + .25));
      /* strings from both edition tags to the pistol's trigger guard (behind the pistol) */
      [[T.tags, TAGY[0]], [T.tags2, TAGY[1]]].forEach(function (q) { if (t < q[0]) return; var k = cd(t, q[0], 16), ty = lerp(q[1] - 40, q[1], k) - 160 * eio(seg(t, T.tagsOut, T.tagsOut + .4)); g.save(); g.globalAlpha *= fin(t, q[0], .08) * (1 - gunOut) * (1 - eio(seg(t, T.tagsOut, T.tagsOut + .4))); g.strokeStyle = '#e9d6bd'; g.lineWidth = 3; g.beginPath(); g.moveTo(TAGX - 116, ty); g.quadraticCurveTo(560, ty + 60, GUN.x - 92 * GUN.s, GUN.y + 30 * GUN.s); g.stroke(); g.restore(); });
      g.save(); g.translate(GUN.x, GUN.y); g.scale(1 - .25 * gunOut, 1 - .25 * gunOut); g.scale(kn(t, T.land, .05), kn(t, T.land, .05)); g.translate(-GUN.x, -GUN.y); gunAt(g, t, ga, wk, false); g.restore();
    }
    if (t >= T.lift && t < T.land + .3) {
      var a = swing(t), lx = HC.x, ly = HC.y, wx = HX + Math.cos(a) * lx - Math.sin(a) * ly, wy = ROD + Math.sin(a) * lx + Math.cos(a) * ly, sp = toScreen(C, wx, wy);
      var fk = eio(seg(t, T.lift, T.land)), lift = bump(t, T.lift, T.land - T.lift), tx = GUN.x + GUN_SKIN.x * GUN.s, ty = GUN.y + GUN_SKIN.y * GUN.s;
      var x = lerp(sp.x, tx, fk), y = lerp(sp.y, ty, fk) - 70 * lift, s = lerp(C.s, .6, fk) * (1 + .15 * lift), r = lerp(a, -.03, fk);
      g.save(); g.globalAlpha *= 1 - seg(t, T.land, T.land + .25); g.translate(x, y); g.rotate(r); g.scale(s, s); put(g, P.swatch, -HC.x, -HC.y); g.restore();
    }
    if (t >= T.stamp - .02 && t < T.stampOut + .5) {
      var sk = cd(t, T.stamp, 30), ss = lerp(1.1, 1, sk), so = eio(seg(t, T.stampOut, T.stampOut + .4));
      g.save(); g.globalAlpha *= clamp((t - T.stamp) * 14, 0, 1) * (1 - so); g.translate(722, 790 - so * 40); g.rotate(-.05); g.scale(ss * (1 - so * .2), ss * (1 - so * .2));
      NOREC = sk < .98 || so > 0; putW(g, P.stamp, 0, 0); NOREC = false; g.restore();
    }
    /* any: both editions, the same tag, both tied to the same pistol */
    dropTag(g, t, P.std, TAGX, TAGY[0], T.tags, T.tagsOut, null, { rot: -.02, from: 40 });
    dropTag(g, t, P.ult, TAGX, TAGY[1], T.tags2, T.tagsOut, null, { rot: .02, from: 40 });
    chipAt(g, t, 'PRE-ORDER BONUS', 330, 1402, T.pre, T.preOut, { px: 40 });
    /* never: the scope, said plainly */
    flap(g, t, P.nameOnly, CX, 1290, T.noIn, T.noOut, { rot: .01 });
    /* end: the vote, two identical tags */
    dropTag(g, t, P.yes, 300, 1236, T.vote, T.voteOut, T.kYes, { rot: -.02 });
    dropTag(g, t, P.no, 720, 1236, T.vote, T.voteOut, T.kNo, { rot: .02 });
    chipAt(g, t, 'GTA 6 · NOV 19, 2026 · PS5 · XBOX SERIES X|S', CX, 1398, T.dateIn, HOME - .12, { bg: CREAM });
  }

  /* ---------- captions (the voice, phrase by phrase; the hook line is carried by the picture) ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { outc.push(cur); cur = []; } });
      if (cur.length) outc.push(cur);
    });
    /* long cards split in two: at a comma, else nearest the middle, never after a glue word */
    var o2 = [];
    outc.forEach(function (ws) {
      if (ws.length <= 6) { o2.push(ws); return; }
      var cut = -1;
      for (var i = 1; i < ws.length - 2; i++) if (/,$/.test(ws[i].w)) { cut = i; break; }
      if (cut < 0) { var best = 1e9; for (i = 2; i < ws.length - 2; i++) { if (GLUE[norm(ws[i].w)]) continue; var d = Math.abs(i + 1 - ws.length / 2); if (d < best) { best = d; cut = i; } } }
      if (cut < 0) { o2.push(ws); return; }
      o2.push(ws.slice(0, cut + 1)); o2.push(ws.slice(cut + 1));
    });
    return o2.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 470;
  function strWords(Pc) { var o = {}; Pc.lines.join(' ').split(/\s+/).forEach(function (w) { o[norm(w)] = 1; }); return o; }
  var SW = null;
  function onStrip(card, t) {
    if (!SW) SW = [[P.s1, T.s1In, T.s1Out], [P.s2, T.s2In, T.s2Out]].map(function (q) { return { w: strWords(q[0]), a: q[1], b: q[2] }; });
    for (var i = 0; i < SW.length; i++) { var S = SW[i]; if (t < S.a - .45 || t > S.b) continue; var miss = card.words.filter(function (w) { return !S.w[norm(w.w)]; }).length; if (miss === 0 || (miss === 1 && card.words.length >= 3 && !S.w[norm(card.words[0].w)])) return true; }
    return false;
  }
  function captions(g, t) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .06), outk = 1 - seg(t, o0, o1);
    if (fi * outk <= 0) return;
    /* the same words never show twice: a card whose words are all on a readable quote strip stays off */
    if (onStrip(card0, t)) return;
    /* while Rockstar's sentence sits in the caption band, it is the caption */
    if (t > T.s2In - .1 && t < T.s2Out + .35) return;
    var CY = CAPY;
    var k = cd(t, card0.t0 - .04, 16);
    /* paper-label captions: the film's condensed face in ink, on torn cream tape, one strip per line */
    g.save(); cond(g); var cpx = 74; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var lines, lw, maxw = 720;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var Ln = lines.length - 1; if (lw[Ln] + ws[i] > maxw && lines[Ln].length) { lines.push([]); lw.push(0); Ln++; } lines[Ln].push(i); lw[Ln] += ws[i] + gap; }); }
    function fixLines() {
      for (var Ln = 0; Ln < lines.length - 1; Ln++) { var last = lines[Ln][lines[Ln].length - 1]; while (lines[Ln].length > 1 && GLUE[norm(words[last].w)]) { lines[Ln].pop(); lines[Ln + 1].unshift(last); last = lines[Ln][lines[Ln].length - 1]; } }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay2(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw || (lines.length > 1 && (lines[lines.length - 1].length < 2 || lines[0].length < 2))) && cpx > 56) { cpx -= 4; font(g, cpx, 900); ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; lay2(); fixLines(); }
    var lh = cpx * 1.32, y0 = CY - (lines.length - 1) * lh / 2 + cpx * .36;
    g.globalAlpha = fi * outk;
    lines.forEach(function (ln, li) {
      var tw = lw[li] - gap, x = CX - tw / 2, y = y0 + li * lh + (1 - k) * 30, seed = Math.round(card0.t0 * 100) + li * 7;
      var r = mulberry(seed), x0 = x - 22, x1 = x + tw + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CX, y); g.rotate(rot); g.translate(-CX, -y);
      g.beginPath(); g.moveTo(x0, yt); for (var xx = x0; xx < x1; xx += 9) g.lineTo(xx, yt + (r() - .5) * 4); g.lineTo(x1, yt); g.lineTo(x1 + (r() - .5) * 6, (yt + yb) / 2); g.lineTo(x1, yb); for (xx = x1; xx > x0; xx -= 9) g.lineTo(xx, yb + (r() - .5) * 4); g.lineTo(x0, yb); g.lineTo(x0 + (r() - .5) * 6, (yt + yb) / 2); g.closePath();
      g.save(); g.shadowColor = 'rgba(6,3,18,.55)'; g.shadowBlur = 12; g.shadowOffsetX = 4; g.shadowOffsetY = 8; g.fillStyle = NEWS; g.fill(); g.restore();
      g.save(); g.clip(); g.globalAlpha *= .6; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0, yt - 4, x1 - x0, yb - yt + 8); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = HOT; g.fillRect(x - 6, y + cpx * .06, ws[i] + 12, cpx * .12); }
        g.fillStyle = cur ? HOT : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }

  var NOISE, HOME, POSTERMODE = false, VIG = null;
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function vignette(g) {
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 860, 420, 510, 900, 1250); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.5)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function pillA(t) { return 1 - seg(t, T.pillOut, T.pillOut + .3) + seg(t, T.pillIn, T.pillIn + .2) }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var C = cam(t);
    world(g, t, C);
    if (LIVE2.bg) vignette(g);
    g.save(); if (LIVE2.clip) { g.beginPath(); g.rect(BX0, 0, BX1 - BX0, 1450); g.clip(); }
    glass(g, t, C);
    /* the GTA 6 sticker, scoped to the page; it knocks on both "GTA"s and steps out while the voice is on Vice City */
    var pa = clamp(pillA(t), 0, 1);
    /* in the hero frame the sticker glides down under the pistol, so the poster still carries GTA 6; it glides back once the pistol has gone */
    var pm = eio(seg(t, T.lift, T.lift + .55)) * (1 - eio(seg(t, T.pill2, T.pill2 + .5))), pmv = pm > .001 && pm < .999;
    if (pa > 0) { g.save(); g.globalAlpha = pa; NOREC = pa < .98 || pmv; putW(g, P.pill, lerp(CX, 735, pm), lerp(340, 1394, pm), -.02, kn(t, at('hook', 'gta'), .08) * kn(t, T.pillIn + .05, .08)); NOREC = false; g.restore(); }
    g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('pill', 'GTA 6’S PAGE', 0, T.pillOut + .05); Tx('pill', 'GTA 6’S PAGE', T.pillIn + .15, DUR + 1);
    Tx('tag', 'TOMMY VERCETTI', 0, T.spin); Tx('tag', 'TOMMY VERCETTI', T.spin + 1, DUR + 1);
    Tx('src', 'ROCKSTARGAMES.COM/VI', T.srcIn + .15, T.srcOut + .05);
    Tx('post', 'GTA VICE CITY 2002', T.post + .2, T.postOut + .05);
    Tx('oct', 'OCT 2002 · PS2', T.octIn + .15, T.octOut + .05);
    Tx('tt', 'SOURCE: TAKE-TWO', T.ttIn + .15, T.octOut + .05);
    Tx('qtag', '?', T.q + .2, T.qOut + .05);
    Tx('s1', P.s1.lines.join(' '), T.s1In + .15, T.s1Out + .05);
    Tx('s1src', 'ROCKSTARGAMES.COM/VI · WEAPON PATTERN', T.s1src + .15, T.s1Out + .05);
    Tx('most', 'ROCKSTAR: “most guns”', T.mostIn + .15, T.mostOut + .05);
    Tx('s2', P.s2.lines.join(' '), T.s2In + .15, T.s2Out + .05);
    Tx('s2src', 'ROCKSTARGAMES.COM/VI · WEAPON PATTERN', T.s2src + .15, T.s2Out + .05);
    Tx('stamp', 'INSPIRED BY HIS SHIRT', T.stamp + .05, T.stampOut + .05);
    Tx('std', 'STANDARD', T.tags + .2, T.tagsOut + .05); Tx('ult', 'ULTIMATE', T.tags2 + .2, T.tagsOut + .05);
    Tx('pre', 'PRE-ORDER BONUS', T.pre + .15, T.preOut + .05);
    Tx('name', 'PAGE: NAME ONLY', T.noIn + .2, T.noOut + .05);
    Tx('yes', 'YES', T.vote + .2, T.voteOut + .05); Tx('no', 'NO', T.vote + .2, T.voteOut + .05);
    Tx('date', 'GTA 6 · NOV 19, 2026 · PS5 · XBOX SERIES X|S', T.dateIn + .15, HOME - .07);
    return o;
  }
  /* how long a text must stay up (render.mjs readcheck: letters / 15 + 1.5 s, at least 1.8 s), plus the fade margins */
  function need(text) { return Math.max(1.8, text.replace(/\s/g, '').length / 15 + 1.5) + .25; }

  /* ---------- events: hits placed in real pauses of the voice (vo/vad.js); beats with no free pause stay silent ---------- */
  function initTimes() {
    HOME = DUR - .2;
    /* hook: frame 0 is mid-swing (the shirt swinging in on its hook); a hanger clack before the first word; the tag lands on "names" */
    G('clack', .02, 'click', .25, 1);
    T.kNames = at('hook', 'names');
    T.srcIn = .8; T.srcOut = T.srcIn + need('ROCKSTARGAMES.COM/VI');
    /* who: the pill steps out; the shirt sways on "story"; the postcard drops on "Vice"; its chips */
    T.pillOut = start('who') - .15; T.kStory = at('who', 'story');
    T.post = at('who', 'vice') - .25; T.kVice = at('who', '2002');
    G('postS', T.post, 'swish', .3, .7);
    T.octIn = at('who', 'vice') + .3; T.ttIn = T.octIn + .3;
    T.srcOut = Math.min(T.srcOut, T.post - .1);
    T.postOut = Math.max(T.post + need('GTA VICE CITY 2002'), start('ask') + .15);
    T.octOut = Math.max(T.octIn + need('OCT 2002 · PS2'), T.ttIn + need('SOURCE: TAKE-TWO'), T.postOut);
    /* ask: the ? tag drops onto the hook in the pause before "So"; the pill returns on "GTA"; slow push in */
    T.q = G('qdrop', after('who'), 'tick', .4, 1);
    T.kWhy = at('ask', 'why'); T.pillIn = at('ask', 'gta') - .1; T.push0 = start('ask');
    /* words / kingpin: the source chip on "Rockstar's", a held beat on the colon, the strip lands on "Channel";
       the collar pops in the pause after "Kingpin." */
    T.qOut = Math.max(T.q + need('?'), start('words') - .1);
    T.s1src = at('words', 'rockstars') - .05;
    T.s1In = at('kingpin', 'channel') - .06;
    T.collar = G('collar', after('kingpin'), 'pop', .35, .9);
    T.s1Out = Math.max(T.s1In + need(P.s1.lines.join(' ')), T.s1src + need('ROCKSTARGAMES.COM/VI · WEAPON PATTERN'));
    /* look: the dashed guide draws itself round the pocket palm; the print slides one repeat on "pattern";
       on "guns" a dashed pistol outline (our own shape) waits below */
    T.dash0 = at('look', 'look');
    T.scroll0 = at('look', 'pattern') - .1; T.collarDn = T.scroll0 + .1;
    T.mostIn = Math.max(at('look', 'most') - .05, T.s1Out + .05); T.mostOut = T.mostIn + need('ROCKSTAR: “most guns”');
    T.ghost = Math.max(at('look', 'guns') - .1, T.s1Out + .1);
    /* shirt: Rockstar's sentence comes in low; scissors cut once round the circle from "iconic" to "button-up";
       the hero beat in the written pause: snip, snip, the frame changes shape, the swatch wraps the pistol, the stamp */
    T.s2In = at('shirt', 'inspired') - .08; T.s2src = T.s2In + .4; T.sc0 = T.s2In + .15;
    T.cut0 = at('shirt', 'iconic'); T.cutEnd = wend('shirt', 'buttonup');
    T.scOut = T.cutEnd + .05;
    var sn = G('snip', after('shirt'), 'snip', .3, 1);
    G('snip2', sn + .2, 'snip', .2, .9);
    T.lift = Math.max(T.cutEnd + .06, sn - .02);
    T.stamp = G('stamp', T.lift + .44, 'stamp', .3, 1.2, { heavy: true });
    T.land = Math.min(T.lift + .4, T.stamp - .05);
    T.s2Out = T.s2In + need(P.s2.lines.join(' '));
    T.stampOut = T.stamp + need('INSPIRED BY HIS SHIRT');
    /* any: both editions tied to the same pistol, each dropping on its word; the pre-order chip, low */
    T.pre = at('any', 'preorder') - .05;
    T.tags = Math.max(T.pre + .1, at('any', 'standard') - .9); T.tags2 = T.tags + .35;
    T.tagsOut = Math.max(T.tags + need('STANDARD'), T.tags2 + need('ULTIMATE'));
    T.preOut = Math.max(T.pre + need('PRE-ORDER BONUS'), T.tagsOut);
    T.gunOut = T.tagsOut + .05;
    /* never: push in onto the name tag; it turns on "never"; the scope card flaps down */
    T.tagPush0 = Math.max(T.gunOut + .1, start('never') - .3);
    T.spin = at('never', 'never') - .05;
    T.pill2 = T.gunOut + .1;
    T.noIn = at('never', 'page') - .05;
    T.noOut = T.noIn + need('PAGE: NAME ONLY') + .15;
    /* end: home; YES and NO pinned together in the pause before "So"; each knocks on its word; the swatch flies home */
    T.vote = G('pins', start('end') - .3, 'pin', .3, 1);
    T.home0 = T.vote - .2;
    T.kYes = at('end', 'yes'); T.kNo = at('end', 'no'); T.kPalms = at('end', 'palms'); T.kGuns = at('end', 'guns');
    T.voteOut = DUR - 1.0;
    T.dateIn = Math.min(at('end', 'palms'), HOME - .12 - need('GTA 6 · NOV 19, 2026 · PS5 · XBOX SERIES X|S'));
    T.seat0 = DUR - 1.15; T.seat = DUR - .3;
    G('seatS', T.seat - .02, 'pop', .3, .6);
    /* two pink highlights in the whole film: the year and the scope */
    STRESS = [['who', '2002'], ['never', 'never']].map(function (p) { return at(p[0], p[1]); });
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

  /* ---------- sound: paper and closet foley, written into the pauses; no music (Isac adds a TikTok sound) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .8;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc2(type, f, t0, t1, pts, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function band(t0, t1, f0, f1, g0, g1, q, pan, type) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = type || 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g, f) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = f || 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc2('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function boom(t, g, f0, f1, dur) { var o = osc2('sine', f0, t, t + dur + .05, [[t, 0], [t + .006, g], [t + dur * .35, g * .55], [t + dur, 0]]); o.frequency.exponentialRampToValueAtTime(f1, t + dur * .8); }
    function stamp(t, g, heavy) { tick(t, 1.6 * g, 2400); thump(t, .7 * g); if (heavy) boom(t + .01, .55 * g, 110, 42, .25); var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    /* the wooden hanger creaking on the rod: a slowing train of fibre ticks over a soft band */
    function creak(t, g) { for (var j = 0; j < 14; j++) tick(t + .012 * j + .0009 * j * j, (.25 + rnd() * .3) * g, 1500 + rnd() * 900); band(t, t + .22, 700, 1300, .035 * g, .01 * g, 2); }
    function pop(t, g) { band(t, t + .07, 3000, 1800, .1 * g, .02 * g, 1.2); tick(t + .01, .8 * g, 2400); thump(t + .02, .3 * g, 190); }
    function slap(t, g) { band(t, t + .1, 1800, 900, .14 * g, .02 * g, .9); thump(t + .005, .26 * g, 140); for (var j = 0; j < 4; j++) tick(t + .03 + j * .025, (.2 + rnd() * .2) * g); }
    function swish(t, g) { band(t, t + .26, 600, 3600, .09 * g, .02 * g, 1.3, -.2); }
    /* a metal hook on a wooden rod */
    function click(t, g) { tick(t, 1.1 * g); osc2('sine', 2900, t, t + .07, [[t, 0], [t + .002, .06 * g], [t + .05, 0]]); thump(t, .06 * g, 500); }
    /* scissors: two blade closes, metal on metal */
    function snip(t, g) { [0, .075].forEach(function (d, j) { var t0 = t + d; tick(t0, (1.2 - j * .2) * g, 4200); osc2('triangle', 3400 - j * 300, t0, t0 + .05, [[t0, 0], [t0 + .002, .035 * g], [t0 + .045, 0]]); band(t0, t0 + .04, 6000, 3000, .05 * g, 0, 2); }); }
    function pin(t, g) { tick(t, 1 * g, 2600); thump(t, .12 * g, 420); tick(t + .05, .8 * g, 2600); thump(t + .05, .1 * g, 400); }
    var LEVEL = { creak: 1.4, pop: 1.2, stamp: .5, swish: 1.6, slap: 1.4, click: 1.6, tick: 1.6, snip: 1.5, pin: 1.4 };
    /* per-hit trims from the final-mix measurement: each hit 3 dB or more under its neighbouring words */
    var TRIM = window.SFX_TRIM || { clack: 9.5, snip: 13, snip2: 12 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, (TRIM[e.id] || 0) / 20);
      if (e.type === 'creak') creak(e.t, g);
      else if (e.type === 'pop') pop(e.t, g);
      else if (e.type === 'stamp') stamp(e.t, g, e.heavy);
      else if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'click') click(e.t, g);
      else if (e.type === 'snip') snip(e.t, g);
      else if (e.type === 'pin') pin(e.t, g);
      else if (e.type === 'tick') { tick(e.t, 1.2 * g, 2200); thump(e.t, .12 * g, 400); }
    });
    /* no music: Isac adds a trending sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    /* room tone: a quiet room, so the loop seam is never digital zero */
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”’·→…#?‹|~$+—'); })).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures();
      window.READY = true;
    });
  }

  var POSTER_T = 0;
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-vercetti', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  /* strip lengths are known only once the fonts load; the times that depend on them are set then */
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); POSTER_T = Math.round((Math.min(T.stamp + .35, start('any') - .1)) * 30) / 30 + 1 / 60; window.FILM.POSTER = POSTER_T;
    window.FILM.SHOTS = [{ id: 'name', name: 'The name', t0: 0, t1: start('words') }, { id: 'words', name: 'Rockstar’s words', t0: start('words'), t1: T.lift }, { id: 'cut', name: 'Inspired by his shirt', t0: T.lift, t1: start('never') }, { id: 'vote', name: 'Yes or no?', t0: start('never'), t1: DUR }]; };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: every shape and glyph, with the bleed wall off and no safety clip, must stay inside x 90-930 and above
     y 1450. Scans t at each rendered frame's sub-samples; returns the frames that break it. */
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 3; var bad = [], n = Math.round(DUR * fps), span = .5 / fps;
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0b) + Math.abs(d[i + 1] - 0x08) + Math.abs(d[i + 2] - 0x20) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
    for (var i = 0; i < n; i++) for (var s = 0; s < subs; s++) {
      var t = (i + .5) / fps - span / 2 + span * (s + .5) / subs; frame(ctx, clamp(t, 0, DUR));
      var L0 = dirty(0, 0, 90, H), R0 = dirty(930, 0, 150, H), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0.c + B0.c > 0) { bad.push({ f: i, t: +t.toFixed(3), left: L0.c && [L0.c, L0.x0, L0.y0, L0.y1], right: R0.c && [R0.c, R0.x1 + 930, R0.y0, R0.y1], bottom: B0.c && [B0.c, B0.y1, B0.x0 + 90, B0.x1 + 90] }); break; }
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
