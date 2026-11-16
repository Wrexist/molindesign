/* "Is GTA 6 too expensive?": GTA 6's $79.99 against GTA 5's $59.99 from September 2013, Delta (pillar 1, numbers and money).
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). Frame 0: the GTA 6 price tag swinging on its string and TOO MUCH?. The older GTA 5 tag swings in; both hook
   onto a brass balance scale that tips toward GTA 6 ("on paper", $20 more). A hand-built CPI-U bicycle pump flips the
   years 2013 → 2026 (BLS CPI-U, Sept 2013 234.149 → Sept 2026 336.940, +43.9%) and pumps up a round "today's money"
   disc beside the GTA 5 tag: $59.99 → $86.33, stamp OVER $85 TODAY. Back on the scale the disc hangs under GTA 5 and
   the scale slams its way; CHEAPER* IN TODAY'S $, the fine print (US launch list prices, standard editions), the
   NOV 19 calendar, and the vote. Engine from film/gta-ranked (paper pieces, VAD gate, fontStretch re-apply, rail scan).
   Our own flat props: no Rockstar footage, logo, key art or box art, no console logos; no music. */
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



  BODY.tear = .1; BODY.land = .1; BODY.thock = .12; BODY.pop = .1; BODY.ding = .2; BODY.clank = .2; BODY.pump = .18;

  /* =====================================================================================================
     THE SET. A deep-ink paper wall with a cut-paper striped sun (screen space, bleeds to the full frame), two pale
     spotlight beams and drifting paper flecks, a teal paper floor. On it: two hand-cut price tags on strings, a brass
     balance scale, a CPI-U bicycle pump and the round "today's money" disc it pumps up. Our own flat props only:
     no Rockstar logo, key art, box art or footage, no console logos.
     ===================================================================================================== */
  var FLOOR = 1400, GOLD = '#ffc83d', BRASS = '#d6a043', BRASS2 = '#8f611c', OLDP = '#ecd9a6', SHELF = '#137f7a', INK2 = '#2a1850';
  var TW = 420, TH = 520, HOLE = 58;
  var SPX = 510, SPY = 740, BL = 258;
  var FLECK = [];
  function rect(x0, y0, x1, y1) { return function (g) { g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); }; }
  function wordsOf(pc, rec) { pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; }); return pc; }

  /* condensed sticker type (thick ink outline + drop shadow), the kit's sticker in our condensed face */
  function stk(g, s, x, y, px, o) {
    o = o || {}; px = Math.max(36, px);
    g.save(); cond(g, o.st || 'condensed'); font(g, px, 900); ls(g, o.ls == null ? 1 : o.ls);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
    var lw = o.lw == null ? Math.max(5, px * .13) : o.lw, ink = o.ink || INK;
    g.translate(x, y); if (o.rot) g.rotate(o.rot);
    if (o.shadow !== false) { g.lineWidth = lw; g.strokeStyle = ink; g.fillStyle = ink; g.strokeText(s, px * .05, px * .08); g.fillText(s, px * .05, px * .08); }
    if (lw) { g.lineWidth = lw; g.strokeStyle = ink; g.strokeText(s, 0, 0); }
    g.fillStyle = o.col || CREAM; g.fillText(s, 0, 0);
    var w = g.measureText(s).width; g.restore(); unst(g); return w;
  }
  /* slam: lands from big in 0.14 s with a small recoil; u = seconds since it started; o.out = seconds until it leaves */
  function slam(g, s, x, y, px, u, o) {
    if (u < 0) return; o = o || {};
    var k = eo(clamp(u / .14, 0, 1)), ok = o.out != null ? 1 - eio(seg(u, o.out, o.out + .2)) : 1; if (ok <= 0) return;
    var sc = (lerp(o.from || 1.45, 1, k) - .1 * Math.sin(Math.PI * seg(u, .12, .3))) * ok;
    g.save(); g.globalAlpha *= clamp(u / .05, 0, 1); g.translate(x, y); g.rotate((o.rot == null ? -.04 : o.rot) * (1 + (1 - k) * 3)); g.scale(sc, sc);
    var nr = NOREC; NOREC = nr || k < 1 || ok < 1; stk(g, s, 0, 0, px, o); NOREC = nr; g.restore();
  }

  /* ---------- the price tag: punched hole, clipped corners, a coloured name band, hand-inked price ---------- */
  function tagPath(g) { var w = TW, h = TH, c = 86; g.beginPath(); g.moveTo(-w / 2 + c, -h / 2); g.lineTo(w / 2 - c, -h / 2); g.lineTo(w / 2, -h / 2 + c); g.lineTo(w / 2, h / 2 - 16); g.quadraticCurveTo(w / 2, h / 2, w / 2 - 16, h / 2); g.lineTo(-w / 2 + 16, h / 2); g.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - 16); g.lineTo(-w / 2, -h / 2 + c); g.closePath(); }
  function tagPiece(name, price, band, card, seed, aged) {
    var w = TW, h = TH, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], tagPath, card, { sx: 7, sy: 14, blur: 20, extra: function (g) {
      g.fillStyle = 'rgba(29,18,51,.045)'; for (var y = -h / 2; y < h / 2; y += 14) g.fillRect(-w / 2, y, w, 1.5);
      if (aged) { var gr = g.createRadialGradient(0, 0, 140, 0, 0, 380); gr.addColorStop(0, 'rgba(150,95,20,0)'); gr.addColorStop(1, 'rgba(150,95,20,.32)'); g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h);
        var r = mulberry(seed); for (var i = 0; i < 9; i++) { g.fillStyle = 'rgba(140,90,30,' + (.05 + r() * .07).toFixed(3) + ')'; g.beginPath(); g.arc(-w / 2 + r() * w, -h / 2 + r() * h, 10 + r() * 30, 0, TAU); g.fill(); } }
      g.fillStyle = band; g.fillRect(-w / 2, -h / 2 + 114, w, 118);
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(-w / 2, -h / 2 + 114, w, 8); g.fillStyle = 'rgba(29,18,51,.15)'; g.fillRect(-w / 2, -h / 2 + 226, w, 6);
      cond(g, 'condensed'); font(g, 100, 900); ls(g, 4); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(name, 0, -h / 2 + 176); var mm = g.measureText(name); rec.push([-mm.width / 2, -h / 2 + 176 - 50, mm.width / 2, -h / 2 + 176 + 40, name]); unst(g);
      var px = 176, m = mk(4, 4).getContext('2d'); cond(m); font(m, px, 900); var pw = m.measureText(price).width; if (pw > w - 56) px = Math.floor(px * (w - 56) / pw); unst(m);
      var tw = inkText(g, price, 0, 76, px, INK, seed * 13 + 1, { dense: 80, big: 1.1 });
      rec.push([-tw / 2, 76 - px * .5, tw / 2, 76 + px * .45, price]);
      g.strokeStyle = band; g.lineWidth = 11; g.lineCap = 'round'; g.beginPath(); g.moveTo(-tw / 2 + 6, 76 + px * .52); g.quadraticCurveTo(0, 76 + px * .64, tw / 2 - 6, 76 + px * .5); g.stroke();
      g.fillStyle = 'rgba(29,18,51,.35)'; for (var x = -w / 2 + 24; x < w / 2 - 20; x += 22) g.fillRect(x, h / 2 - 54, 12, 3);
      g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(0, -h / 2 + HOLE, 33, 0, TAU); g.fill(); g.strokeStyle = band; g.lineWidth = 7; g.stroke();
    }, after: function (g) { g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, -h / 2 + HOLE, 17, 0, TAU); g.fill(); } });
    return wordsOf(pc, rec);
  }
  /* st = { x, y (the pin), len (string), s (scale), a (swing angle) }; the tag hangs from its hole */
  function hang(g, pc, st, nr) {
    if (!st || st.s <= 0) return;
    g.save(); g.translate(st.x, st.y); g.rotate(st.a || 0);
    g.strokeStyle = '#efe2c4'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, st.len + 4); g.stroke();
    g.translate(0, st.len); g.scale(st.s, st.s);
    var o = NOREC; NOREC = o || !!nr; putW(g, pc, 0, TH / 2 - HOLE); NOREC = o;
    g.strokeStyle = '#efe2c4'; g.lineWidth = 4 / st.s; g.beginPath(); g.ellipse(0, -4, 9, 15, 0, 0, TAU); g.stroke();
    g.restore();
    put(g, P.pin, st.x, st.y);
  }
  function tagPt(st, d) { var L = st.len + d * st.s; return [st.x - Math.sin(st.a || 0) * L, st.y + Math.cos(st.a || 0) * L]; }
  function lerpSt(a, b, k) { return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), len: lerp(a.len, b.len, k), s: lerp(a.s, b.s, k), a: lerp(a.a || 0, b.a || 0, k) }; }

  function cardTile(text, w, band, px) {
    return cardPiece(w, 130, CREAM, [[text, px || 62, INK, 18]], { r: 8, before: function (g) { g.fillStyle = band; g.fillRect(-w / 2, -65, w, 30); [-w / 4, w / 4].forEach(function (x) { g.fillStyle = INK2; g.beginPath(); g.arc(x, -50, 7, 0, TAU); g.fill(); }); } });
  }
  function voteTag(word, w, px) { return cardPiece(w, 130, CREAM, [[word, px, INK, 6, null, 14]], { r: 8, ring: 'rgba(29,18,51,.25)', path: function (g) { g.beginPath(); g.moveTo(-w / 2 + 34, -65); g.lineTo(w / 2, -65); g.lineTo(w / 2, 65); g.lineTo(-w / 2 + 34, 65); g.lineTo(-w / 2, 34); g.lineTo(-w / 2, -34); g.closePath(); }, after: function (g) { g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(-w / 2 + 22, 0, 8, 0, TAU); g.fill(); } }); }
  /* a till receipt: zigzag bottom edge, faint ruling; lines = [[text, px, colour, dy]] */
  function receipt(w, h, lines) {
    var zz = []; for (var x = -w / 2; x <= w / 2 + .1; x += 18) zz.push([x, h / 2 - ((Math.round((x + w / 2) / 18)) % 2 ? 12 : 0)]);
    return cardPiece(w, h, NEWS, lines, { r: 0, sy: 10, path: function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2); zz.slice().reverse().forEach(function (p) { g.lineTo(p[0], p[1]); }); g.closePath(); }, before: function (g) {
      g.fillStyle = 'rgba(29,18,51,.05)'; for (var y = -h / 2 + 8; y < h / 2; y += 9) g.fillRect(-w / 2, y, w, 1);
      g.strokeStyle = 'rgba(29,18,51,.3)'; g.lineWidth = 3; g.setLineDash([6, 8]); g.beginPath(); g.moveTo(-w / 2 + 20, -h / 2 + 16); g.lineTo(w / 2 - 20, -h / 2 + 16); g.stroke(); g.setLineDash([]);
    } });
  }

  function buildTextures() {
    GRAIN = buildGrain();
    P.wall = piece([-60, -60, 1140, 1980], rect(-60, -60, 1140, 1980), '#1c0f3d', { shadow: false, edge: false, grain: .9, ps: .5, extra: function (g) {
      var gr = g.createLinearGradient(0, 0, 0, 1980); gr.addColorStop(0, '#120a2c'); gr.addColorStop(1, '#2d1655'); g.fillStyle = gr; g.fillRect(-60, -60, 1200, 2100);
      g.save(); g.beginPath(); g.arc(510, 860, 470, 0, TAU); g.clip();
      var sg = g.createLinearGradient(0, 390, 0, 1330); sg.addColorStop(0, 'rgba(255,176,103,.2)'); sg.addColorStop(.55, 'rgba(255,79,163,.15)'); sg.addColorStop(1, 'rgba(255,79,163,.07)'); g.fillStyle = sg; g.fillRect(0, 380, 1080, 960);
      g.fillStyle = '#1f1043'; for (var i = 0; i < 9; i++) { var y = 880 + i * 50 + i * i * 2; g.fillRect(0, y, 1080, 8 + i * 3); }
      g.restore();
    } });
    var r = mulberry(77), cols = [HOT, TEAL, ORG, CREAM, GOLD];
    for (var i = 0; i < 26; i++) FLECK.push({ x: 110 + r() * 800, y: r() * 1500, w: 10 + r() * 14, sp: 1 + Math.floor(r() * 2), ph: r() * TAU, rs: 1 + Math.floor(r() * 3), col: cols[i % cols.length], dx: r() * 40 });

    P.tag6 = tagPiece('GTA 6', '$79.99', TEAL, '#fbf3e4', 6, false);
    P.tag5 = tagPiece('GTA 5', '$59.99', HOT, OLDP, 5, true);
    P.pin = piece([-16, -16, 16, 16], function (g) { g.beginPath(); g.arc(0, 0, 14, 0, TAU); }, TEAL, { sx: 3, sy: 5, blur: 5, edge: 1.5, after: function (g) { g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(-4, -4, 4, 0, TAU); g.fill(); } });
    P.coin = piece([-30, -30, 30, 30], function (g) { g.beginPath(); g.arc(0, 0, 28, 0, TAU); }, GOLD, { sx: 3, sy: 5, blur: 6, edge: 2, extra: function (g) { g.strokeStyle = 'rgba(140,80,0,.5)'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 19, 0, TAU); g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(-8, -9, 7, 0, TAU); g.fill(); } });

    /* dated cards and the controller doodle (generic, ours) */
    P.c2013 = cardTile('SEPT 2013', 250, HOT); P.c2026 = cardTile('NOV 2026', 250, TEAL);
    P.pad = piece([-125, -70, 125, 80], function (g) { g.beginPath(); g.moveTo(-70, -55); g.lineTo(70, -55); g.bezierCurveTo(120, -55, 128, 0, 118, 50); g.bezierCurveTo(110, 82, 78, 82, 62, 52); g.lineTo(40, 22); g.lineTo(-40, 22); g.lineTo(-62, 52); g.bezierCurveTo(-78, 82, -110, 82, -118, 50); g.bezierCurveTo(-128, 0, -120, -55, -70, -55); g.closePath(); }, CREAM, { sx: 4, sy: 8, blur: 10, extra: function (g) {
      g.fillStyle = INK; g.fillRect(-88, -18, 46, 14); g.fillRect(-72, -34, 14, 46);
      [[78, -32, TEAL], [100, -12, HOT], [56, -12, ORG], [78, 8, GOLD]].forEach(function (b) { g.fillStyle = b[2]; g.beginPath(); g.arc(b[0], b[1], 10, 0, TAU); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke(); });
      [[-30, 12], [30, 12]].forEach(function (p) { g.fillStyle = INK2; g.beginPath(); g.arc(p[0], p[1], 15, 0, TAU); g.fill(); });
      g.fillStyle = 'rgba(29,18,51,.25)'; g.fillRect(-14, -30, 28, 8);
    } });

    /* the brass scale */
    P.sFoot = piece([-190, -40, 190, 20], function (g) { g.beginPath(); g.moveTo(-130, -40); g.lineTo(130, -40); g.lineTo(190, 20); g.lineTo(-190, 20); g.closePath(); }, BRASS2, { sx: 5, sy: 9, blur: 12, extra: function (g) { g.fillStyle = 'rgba(255,220,150,.25)'; g.fillRect(-190, -40, 380, 8); g.fillStyle = BRASS; g.fillRect(-150, -24, 300, 12); } });
    var postH = FLOOR - 40 - SPY;
    P.sPost = piece([-20, 0, 20, postH], rect(-20, 0, 20, postH), BRASS, { sx: 4, sy: 6, blur: 8, extra: function (g) { g.fillStyle = 'rgba(255,240,200,.35)'; g.fillRect(-12, 0, 6, postH); g.fillStyle = 'rgba(90,50,0,.3)'; g.fillRect(10, 0, 10, postH); for (var y = 60; y < postH; y += 120) { g.fillStyle = BRASS2; g.fillRect(-20, y, 40, 10); } } });
    P.sBeam = piece([-BL - 26, -15, BL + 26, 15], function (g) { rr(g, -BL - 26, -15, 2 * BL + 52, 30, 15); }, BRASS, { sx: 4, sy: 8, blur: 10, extra: function (g) { g.fillStyle = 'rgba(255,240,200,.4)'; g.fillRect(-BL - 26, -12, 2 * BL + 52, 6); g.fillStyle = 'rgba(90,50,0,.25)'; for (var x = -BL + 30; x < BL; x += 40) g.fillRect(x, -2, 3, 12); [-BL, BL].forEach(function (x) { g.fillStyle = BRASS2; g.beginPath(); g.arc(x, 0, 11, 0, TAU); g.fill(); }); } });
    P.sCap = piece([-34, -34, 34, 34], function (g) { g.beginPath(); g.arc(0, 0, 32, 0, TAU); }, GOLD, { sx: 3, sy: 6, blur: 6, extra: function (g) { g.strokeStyle = BRASS2; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 20, 0, TAU); g.stroke(); g.fillStyle = BRASS2; g.beginPath(); g.arc(0, 0, 8, 0, TAU); g.fill(); } });
    P.sDial = piece([-120, 0, 120, 70], function (g) { g.beginPath(); g.moveTo(-120, 6); g.quadraticCurveTo(0, 70, 120, 6); g.lineTo(104, 62); g.quadraticCurveTo(0, 104, -104, 62); g.closePath(); }, CREAM, { sx: 3, sy: 6, blur: 8, extra: function (g) { g.strokeStyle = INK; g.lineWidth = 3; for (var i = -5; i <= 5; i++) { var a = Math.PI / 2 + i * .11, r0 = i === 0 ? 150 : 160; g.beginPath(); g.moveTo(Math.cos(a) * r0, -128 + Math.sin(a) * r0); g.lineTo(Math.cos(a) * 178, -128 + Math.sin(a) * 178); g.stroke(); } } });

    /* the pump (CPI-U), the disc it inflates, the grocery stickers */
    P.pFoot = piece([-150, -18, 150, 18], function (g) { rr(g, -150, -18, 300, 36, 10); }, INK2, { sx: 4, sy: 8, blur: 10, edgeCol: 'rgba(251,240,234,.7)' });
    P.pBarrel = piece([-74, 0, 74, 560], function (g) { rr(g, -74, 0, 148, 560, 18); }, TEAL, { sx: 6, sy: 10, blur: 14, extra: function (g) { g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(-54, 10, 16, 540); g.fillStyle = 'rgba(0,40,40,.25)'; g.fillRect(40, 10, 26, 540); g.fillStyle = 'rgba(29,18,51,.3)'; [60, 500].forEach(function (y) { g.fillRect(-74, y, 148, 10); }); } });
    P.pCap = piece([-86, -20, 86, 20], function (g) { rr(g, -86, -20, 172, 40, 12); }, INK2, { sx: 3, sy: 6, blur: 8, edgeCol: 'rgba(251,240,234,.7)' });
    P.pHandle = piece([-160, -26, 160, 26], function (g) { rr(g, -160, -26, 320, 52, 26); }, ORG, { sx: 4, sy: 8, blur: 10, extra: function (g) { g.fillStyle = 'rgba(29,18,51,.3)'; [-128, -100, 100, 128].forEach(function (x) { g.fillRect(x - 3, -26, 6, 52); }); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-160, -20, 320, 8); } });
    P.disc = piece([-200, -200, 200, 200], function (g) { g.beginPath(); g.arc(0, 0, 198, 0, TAU); }, CREAM, { sx: 8, sy: 14, blur: 22, extra: function (g) { g.strokeStyle = ORG; g.lineWidth = 26; g.beginPath(); g.arc(0, 0, 184, 0, TAU); g.stroke(); g.strokeStyle = 'rgba(29,18,51,.25)'; g.lineWidth = 3; g.setLineDash([10, 10]); g.beginPath(); g.arc(0, 0, 160, 0, TAU); g.stroke(); g.setLineDash([]); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-80, -110, 60, 26, -.5, 0, TAU); g.fill(); } });
    P.milk = piece([-55, -95, 55, 80], function (g) { g.beginPath(); g.moveTo(-55, -40); g.lineTo(-30, -80); g.lineTo(-30, -95); g.lineTo(30, -95); g.lineTo(30, -80); g.lineTo(55, -40); g.lineTo(55, 80); g.lineTo(-55, 80); g.closePath(); }, CREAM, { sx: 4, sy: 8, blur: 10, extra: function (g) { g.fillStyle = TEAL; g.fillRect(-55, -10, 110, 56); g.fillStyle = CREAM; g.beginPath(); g.moveTo(0, -2); g.quadraticCurveTo(20, 24, 0, 36); g.quadraticCurveTo(-20, 24, 0, -2); g.fill(); g.fillStyle = 'rgba(29,18,51,.15)'; g.fillRect(-55, -42, 110, 6); } });
    P.gas = piece([-60, -90, 75, 85], function (g) { rr(g, -60, -90, 100, 175, 12); }, ORG, { sx: 4, sy: 8, blur: 10, after: function (g) { g.fillStyle = CREAM; rr(g, -46, -74, 72, 50, 6); g.fill(); g.fillStyle = INK; g.fillRect(-36, -58, 52, 8); g.strokeStyle = INK; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(40, -40); g.quadraticCurveTo(70, -40, 66, 10); g.lineTo(66, 50); g.stroke(); g.fillStyle = INK2; g.fillRect(-68, 76, 116, 12); } });
    P.burger = piece([-80, -60, 80, 60], function (g) { g.beginPath(); g.moveTo(-78, -6); g.bezierCurveTo(-78, -66, 78, -66, 78, -6); g.lineTo(78, 0); g.lineTo(-78, 0); g.closePath(); g.rect(-80, 6, 160, 18); g.moveTo(-76, 30); g.lineTo(76, 30); g.quadraticCurveTo(76, 58, 56, 58); g.lineTo(-56, 58); g.quadraticCurveTo(-76, 58, -76, 30); }, ORG, { sx: 4, sy: 8, blur: 10, extra: function (g) { g.fillStyle = '#5a2a1a'; g.fillRect(-80, 6, 160, 18); g.fillStyle = TEAL; g.beginPath(); for (var x = -80; x <= 80; x += 20) g.lineTo(x, 2 + (x / 20 % 2 ? 8 : 0)); g.lineTo(80, -2); g.lineTo(-80, -2); g.fill(); g.fillStyle = CREAM; [[-40, -36], [-10, -46], [24, -40], [48, -26]].forEach(function (p) { g.beginPath(); g.ellipse(p[0], p[1], 6, 3, .3, 0, TAU); g.fill(); }); } });

    /* receipts */
    P.rcPaper = receipt(620, 180, [['ON PAPER', 46, HOT, -36], ['$79.99 − $59.99 = $20', 66, INK, 34]]);
    P.rcFine = receipt(640, 220, [['* US LAUNCH LIST PRICES', 46, INK, -54], ['STANDARD EDITIONS', 46, INK, 2], ['NO SALES, NO REGIONS', 46, HOT, 58]]);
    P.stampH = buildStamp(['OVER $85', 'TODAY'], 108, 400);

    /* the calendar (six): a tear-off day calendar, orange binding */
    var PAD_W = 340, PAD_H = 330; P.PAD_W = PAD_W; P.PAD_H = PAD_H;
    P.padBack = piece([-PAD_W / 2, -PAD_H / 2, PAD_W / 2, PAD_H / 2], function (g) { rr(g, -PAD_W / 2, -PAD_H / 2, PAD_W, PAD_H, 12); }, '#e7d6bd', { sx: 6, sy: 12, blur: 18, extra: function (g) {
      g.fillStyle = 'rgba(29,18,51,.12)'; for (var i = 0; i < 6; i++) g.fillRect(-PAD_W / 2 + 6, PAD_H / 2 - 8 - i * 4, PAD_W - 12, 1.5);
    } });
    P.binding = piece([-PAD_W / 2 - 6, -PAD_H / 2 - 10, PAD_W / 2 + 6, -PAD_H / 2 + 52], function (g) { rr(g, -PAD_W / 2 - 6, -PAD_H / 2 - 10, PAD_W + 12, 62, 10); }, ORG, { sx: 3, sy: 6, blur: 8, extra: function (g) {
      g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(-PAD_W / 2 - 6, -PAD_H / 2 - 10, PAD_W + 12, 8);
      [-90, 90].forEach(function (x) { g.fillStyle = INK2; g.beginPath(); g.arc(x, -PAD_H / 2 + 22, 12, 0, TAU); g.fill(); g.strokeStyle = '#d9dce6'; g.lineWidth = 6; g.beginPath(); g.arc(x, -PAD_H / 2 + 8, 16, Math.PI * .1, Math.PI * .9, true); g.stroke(); });
    } });
    P.nov19 = cardPiece(PAD_W - 24, PAD_H - 70, CREAM, [['NOV', 54, HOT, -96], ['19', 150, INK, 4], ['2026', 46, INK, 100]], { r: 6, sy: 3 });
    P.blankPg = cardPiece(PAD_W - 24, PAD_H - 70, CREAM, [], { r: 6, sy: 3 });
    P.pill6 = cardPiece(300, 96, TEAL, [['GTA 6', 74, INK, 3]], { r: 48, ring: 'rgba(255,240,234,.9)' });
    P.yes = voteTag('YES', 210, 84); P.no = voteTag('NO', 210, 84);

    /* the wipe band: one long torn strip of pink paper */
    var tp = jag(301, 1100, 10), bt = jag(302, 1100, 10);
    P.band = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp[0][1]); tp.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(bt[i][0], 1560 + bt[i][1]); g.closePath(); }, HOT, { sx: 0, sy: 10, blur: 20, ps: .75, extra: function (g) { g.fillStyle = 'rgba(80,0,40,.12)'; for (var y = 30; y < 1560; y += 46) g.fillRect(0, y, 1100, 3); } });
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
     TIME AND STATE. T holds every beat time (set in initTimes from the voice). Phases are cut by paper wipes:
     0 the tags and the scale (hook → paper), 1 the CPI-U pump (prices, hero), 2 the scale again (more, fine),
     3 the calendar (six), 4 the frame-0 tag with the vote (end); after the last wipe frame 0 itself (t − DUR).
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function sm(t, a, d) { return eio(seg(t, a, a + (d || .5))); }
  function phase(t) { return t < T.W1 ? 0 : t < T.W2 ? 1 : t < T.W3 ? 2 : t < T.W4 ? 3 : t < T.W5 ? 4 : 5; }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }

  /* ---------- shared pieces of the stage ---------- */
  function floorBg(g, y) {
    g.fillStyle = SHELF; g.fillRect(-20, y, W + 40, H - y + 40);
    var dg = g.createLinearGradient(0, y, 0, y + 500); dg.addColorStop(0, 'rgba(0,0,0,0)'); dg.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = dg; g.fillRect(-20, y, W + 40, H - y + 40);
    g.fillStyle = CREAM; g.fillRect(-20, y - 4, W + 40, 10); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-20, y + 6, W + 40, 8);
    g.save(); g.globalAlpha = .55; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(-20, y, W + 40, H - y + 40); g.restore();
  }
  function coins(g, t, a) {
    if (a <= 0) return;
    [[190, FLOOR - 22, 0], [842, FLOOR - 18, 1.7], [716, FLOOR - 14, 3.1]].forEach(function (c, i) {
      var sx = .35 + .65 * Math.abs(Math.cos(TAU * (3 + i) * t / DUR + c[2])), hop = Math.max(0, Math.sin(TAU * (5 + i) * t / DUR + c[2])) * 10;
      g.save(); g.globalAlpha *= a; g.translate(c[0], c[1] - hop); g.scale(sx, 1); put(g, P.coin, 0, 0); g.restore();
    });
  }
  /* the hook swing: big on frame 0, settling, never still */
  function swingHook(t, t0) { var u = Math.max(0, t - t0); return .2 * Math.cos(TAU * u / 1.25) * Math.exp(-u * .32) + .03 * osc(t, 7, .4); }
  var HOOK = { x: 510, y: 300, len: 196, s: 1.12 };
  function tooMuch(g, t, x, y, px, kt) {
    var k = kn(t, kt[0], .12) * kn(t, kt[1] || -9, .08);
    g.save(); g.translate(x, y + 4 * osc(t, 9, 1)); g.rotate(-.035 + .012 * osc(t, 6, 2)); g.scale(k, k); stk(g, 'TOO MUCH?', 0, 0, px, { col: HOT, lw: 12 }); g.restore();
  }
  function chipAt(g, t, text, x, y, tin, tout, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .3) return;
    var k = cd(t, tin, 14), nr = NOREC; NOREC = nr || k < .98 || t > tout;
    chip(g, text, x, y + (1 - k) * (o.from || -40), { px: o.px || 40, bg: o.bg || ORG, fg: o.fg || INK, a: fin(t, tin, .08) * (1 - seg(t, tout, tout + .25)), rot: o.rot || 0, s: kn(t, tin + .1, .05) });
    NOREC = nr;
  }
  function tileAt(g, t, pc, x, y, tin, tout, rot, kt) {
    if (t < tin - .02 || t > tout + .4) return;
    var k = cd(t, tin, 16), o = seg(t, tout, tout + .3);
    g.save(); g.globalAlpha *= fin(t, tin, .08) * (1 - o); g.translate(x, lerp(y - 160, y, k) + o * 60); g.rotate(rot + sw(t, tin + .08, .08, 8, 3)); var s = kn(t, tin + .12, .06) * kn(t, kt || -9, .08); g.scale(s, s);
    var nr = NOREC; NOREC = nr || k < .98 || o > 0; putW(g, pc, 0, 0); NOREC = nr; put(g, P.pin, 0, -44); g.restore();
  }
  function popIn(g, t, pc, x, y, tin, tout, rot, s0) {
    if (t < tin - .02 || t > tout + .35) return;
    var u = t - tin, k = eo(clamp(u / .16, 0, 1)), o = sm(t, tout, .3), sc = lerp(.2, 1, k) * (s0 || 1) * (1 - o * .6) * kn(t, tin + .16, .06);
    g.save(); g.globalAlpha *= clamp(u / .06, 0, 1) * (1 - o); g.translate(x, y - o * 120); g.rotate((rot || 0) + .04 * osc(t, 8, x) + (1 - k) * .4); g.scale(sc, sc); put(g, pc, 0, 0); g.restore();
  }

  /* ---------- the scale ---------- */
  function scaleTh(t, ph) {
    if (ph === 2) return lerp(.13, -.14, cd(t, T.slam, 10)) + sw(t, T.slam + .22, .035, 7, 3) + sw(t, T.bnc1, -.045, 8, 3.2) + sw(t, T.bnc2, .035, 8, 3.2) + .006 * osc(t, 7, 1);
    return .13 * cd(t, T.tip, 9) + sw(t, T.tip + .25, .03, 7, 3) + sw(t, T.hookOn + .5, .03, 6, 2.6) + (sw(t, T.wob1, .1, 7, 2.4) + sw(t, T.wob2, -.09, 7, 2.4)) * (1 - seg(t, T.tip - .3, T.tip)) + .006 * osc(t, 7, 1);
  }
  function beamEnd(th, side) { return { x: SPX + side * BL * Math.cos(th), y: SPY + side * BL * Math.sin(th) + 14 }; }
  function drawScale(g, t, th, rise) {
    if (rise <= 0) return;
    g.save(); g.translate(0, (1 - rise) * 1050);
    put(g, P.sFoot, SPX, FLOOR - 20);
    put(g, P.sPost, SPX, SPY);
    put(g, P.sDial, SPX, SPY + 128);
    /* the needle hangs from the pivot and turns with the beam */
    g.save(); g.translate(SPX, SPY); g.rotate(th); g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 170); g.stroke(); g.fillStyle = HOT; g.beginPath(); g.moveTo(-9, 150); g.lineTo(9, 150); g.lineTo(0, 182); g.closePath(); g.fill(); g.restore();
    g.save(); g.translate(SPX, SPY); g.rotate(th); put(g, P.sBeam, 0, 0); g.restore();
    put(g, P.sCap, SPX, SPY);
    g.restore();
  }

  /* ---------- phase 0: frame 0's tag, the GTA 5 tag, the scale, ON PAPER ---------- */
  function tag6P0(t) {
    var k1 = sm(t, T.thenIn, .6), k2 = sm(t, T.hookOn, .5), th = scaleTh(t, 0), e = beamEnd(th, 1);
    var st = lerpSt(HOOK, { x: 735, y: 572, len: 40, s: .7 }, k1);
    st = lerpSt(st, { x: e.x, y: e.y, len: 30, s: .7 }, k2);
    var aH = swingHook(t, 0), aT = sw(t, T.thenIn + .25, -.14, 6, 2.2) + .03 * osc(t, 8, 1), aS = sw(t, T.hookOn + .45, .1, 7, 2.6) - sw(t, T.tip, .05, 6, 2.4) + .02 * osc(t, 8, 2);
    st.a = aH * (1 - k1) + aT * k1 * (1 - k2) + aS * k2;
    st.moving = (k1 > 0 && k1 < 1) || (k2 > 0 && k2 < 1);
    return st;
  }
  function tag5P(t, ph) {
    var th = scaleTh(t, ph), e = beamEnd(th, -1);
    if (ph === 2) return { x: e.x, y: e.y, len: 30, s: .7, a: sw(t, T.slam, .1, 6, 2.4) + .02 * osc(t, 8, 3) };
    var k0 = sm(t, T.t5In, .55), k2 = sm(t, T.hookOn, .5);
    var st = lerpSt({ x: -240, y: 572, len: 40, s: .7 }, { x: 285, y: 572, len: 40, s: .7 }, k0);
    st = lerpSt(st, { x: e.x, y: e.y, len: 30, s: .7 }, k2);
    st.a = (sw(t, T.t5In + .45, .14, 6, 2.2) + .03 * osc(t, 8, 3)) * (1 - k2) + (sw(t, T.hookOn + .45, -.1, 7, 2.6) + sw(t, T.tip, .05, 6, 2.4) + .02 * osc(t, 8, 4)) * k2;
    st.moving = (k0 > 0 && k0 < 1) || (k2 > 0 && k2 < 1);
    return st;
  }
  function phase0(g, t) {
    var rise = sm(t, T.scaleIn, .6), th = scaleTh(t, 0);
    coins(g, t, 1 - sm(t, T.thenIn, .4));
    drawScale(g, t, th, rise);
    var s6 = tag6P0(t), s5 = t >= T.t5In - .05 ? tag5P(t, 0) : null;
    if (s5) hang(g, P.tag5, s5, s5.moving || t < T.t5In + .6);
    hang(g, P.tag6, s6, s6.moving);
    /* hook: TOO MUCH? printed on frame 0, knocks on the words; the scope chip after "$80" lands */
    var to = sm(t, T.thenIn, .35);
    if (to < 1) { g.save(); g.globalAlpha *= 1 - to; g.translate(0, to * 160); var nr = NOREC; NOREC = nr || to > 0; tooMuch(g, t, 510, 1170, 132, [T.tooK]); NOREC = nr; g.restore(); }
    chipAt(g, t, 'US LAUNCH PRICE · STANDARD', 510, 1338, T.usChip, T.cardsOut, { px: 40, bg: CREAM, fg: INK });
    if (t >= T.usChip && t < T.usChip + .45) KIT.impact(g, 510, 620, t - T.usChip, .9, TEAL);
    /* then: dated cards under each tag, the source, the controller doodle */
    tileAt(g, t, P.c2013, 285, 1010, T.card5, T.cardsOut, -.03, T.k2013);
    tileAt(g, t, P.c2026, 735, 1010, T.card6, T.cardsOut, .03);
    chipAt(g, t, 'KOTAKU · MAY 2013', 285, 1118, T.src5, T.cardsOut, { px: 38, bg: HOT });
    chipAt(g, t, 'PS + XBOX STORE · US', 735, 1118, T.src6, T.cardsOut, { px: 38, bg: TEAL });
    popIn(g, t, P.pad, 510, 1222, T.padIn, T.scaleIn - .15, -.08, 1);
    /* paper: a +$20 brass weight drops onto the GTA 6 end of the beam: why that side sinks */
    if (t >= T.tip - .3 && t < T.W1 + .1) {
      var wk = cd(t, T.tip - .3, 13), e6w = beamEnd(th, 1), wy = lerp(e6w.y - 520, e6w.y - 50, Math.min(1, (t - T.tip + .3) / .3) * Math.min(1, (t - T.tip + .3) / .3)), nrw = NOREC;
      if (t >= T.tip) wy = e6w.y - 50;
      g.save(); g.translate(e6w.x, wy); g.rotate(th); var wkk = kn(t, T.tip, .1); g.scale(wkk, wkk);
      g.beginPath(); g.moveTo(-62, 28); g.lineTo(62, 28); g.lineTo(46, -28); g.lineTo(-46, -28); g.closePath(); g.fillStyle = 'rgba(6,3,18,.4)'; g.save(); g.translate(4, 7); g.fill(); g.restore(); g.fillStyle = BRASS; g.fill(); g.strokeStyle = BRASS2; g.lineWidth = 4; g.stroke();
      g.fillStyle = BRASS2; g.fillRect(-14, -40, 28, 14);
      NOREC = nrw || t < T.tip; txt(g, '+$20', 0, 2, { px: 44, align: 'center', col: INK, ls: 1 }); NOREC = nrw; g.restore();
    }
    /* ask: a big ? on the post */
    if (t >= T.q && t < T.qOut + .3) { g.save(); var qk = kn(t, T.qK, .12); g.translate(SPX, 1020); g.scale(qk, qk); slam(g, '?', 0, 0, 230, t - T.q, { col: HOT, rot: .05, out: T.qOut - T.q, lw: 14 }); g.restore(); }
    /* paper: the receipt slides up; the sum prints on "twenty" */
    if (t >= T.rcIn - .02) {
      var rk = cd(t, T.rcIn, 12), ry = lerp(1640, 1318, rk), rw = sm(t, T.W1 - .3, .3);
      g.save(); g.translate(510, ry + rw * 300); g.rotate(-.02 + .006 * osc(t, 6));
      var reveal = sm(t, T.rcLine, .45), pc = P.rcPaper;
      /* the sum is hidden under a paper flap until it prints, left to right */
      var nr2 = NOREC; NOREC = nr2 || rk < .98 || rw > 0 || reveal < 1; putW(g, pc, 0, 0); NOREC = nr2;
      if (reveal < 1) { g.fillStyle = NEWS; g.fillRect(-290 + 580 * reveal, -2, 580 * (1 - reveal) + 2, 74); g.fillStyle = 'rgba(29,18,51,.05)'; for (var yy = 4; yy < 72; yy += 9) g.fillRect(-290 + 580 * reveal, yy, 580 * (1 - reveal), 1); }
      g.restore();
      if (t >= T.k20 && t < T.k20 + .45) KIT.impact(g, 690, 1352, t - T.k20, .4, HOT);
    }
  }

  /* ---------- phase 1: the CPI-U pump ---------- */
  var PX = 278;
  function strokeK(t) { var v = 0; T.strokes.forEach(function (s) { v = Math.max(v, Math.sin(Math.PI * seg(t, s, s + .38))); }); return v; }
  function yearAt(t) { var k = seg(t, T.yr0, T.yr1); return 2013 + Math.min(13, Math.floor(13 * k * k + 1e-6)); }
  function discR(t) {
    var r0 = 70, r1 = 188, k = eio(seg(tq(t), T.rollA, T.rollB)), grow = lerp(r0, r1, k);
    var pre = lerp(0, r0, cd(t, T.discIn, 12));
    return t < T.rollA ? pre : grow;
  }
  function discPos(t) { var e = sm(t, T.discIn, .3); return [lerp(760, 718, e), 1096 + 4 * osc(t, 7, 2)]; }
  function phase1(g, t) {
    var sk = strokeK(t), hy = 668 + sk * 128, nr = NOREC;
    /* hose (behind the barrel): from the foot to the disc */
    var dp = discPos(t), dr = discR(t);
    if (t >= T.discIn - .05) {
      var k = cd(t, T.discIn, 10), ex = lerp(PX + 120, dp[0] - dr * .92, k), ey = lerp(1330, dp[1] + dr * .3, k);
      g.save(); g.lineCap = 'round'; g.strokeStyle = INK2; g.lineWidth = 22; g.beginPath(); g.moveTo(PX + 60, 1360); g.bezierCurveTo(PX + 220, 1420, ex - 160, ey + 120, ex, ey); g.stroke();
      g.strokeStyle = 'rgba(251,240,234,.35)'; g.lineWidth = 5; g.stroke(); g.restore();
    }
    /* rod, handle, barrel, cap, foot */
    g.fillStyle = '#d9dce6'; g.fillRect(PX - 8, hy, 16, 840 - hy);
    put(g, P.pHandle, PX, hy);
    put(g, P.pBarrel, PX, 830);
    put(g, P.pCap, PX, 840);
    put(g, P.pFoot, PX, FLOOR - 18);
    /* the year box on the barrel: CPI-U header, the year flips 2013 → 2026, a tick per year, speeding up */
    var y = yearAt(tq(t)), yk = seg(tq(t), T.yr0, T.yr1), moving = yk > 0 && yk < 1, flipU = 1;
    for (var i = 0; i < T.flips.length; i++) if (tq(t) >= T.flips[i]) flipU = clamp((tq(t) - T.flips[i]) / .06, 0, 1);
    g.save(); g.translate(PX, 1000); g.rotate(-.02); var bk = kn(t, T.k2013b, .08) * kn(t, T.yr1, .1); g.scale(bk, bk);
    rr(g, -128 + 5, -86 + 9, 256, 172, 12); g.fillStyle = 'rgba(6,3,18,.45)'; g.fill();
    rr(g, -128, -86, 256, 172, 12); g.fillStyle = CREAM; g.fill();
    g.save(); g.clip(); g.globalAlpha *= .55; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(-128, -86, 256, 172); g.restore();
    g.fillStyle = HOT; g.fillRect(-128, -86, 256, 64);
    NOREC = nr; txt(g, 'PRICES', 0, -53, { px: 54, align: 'center', col: INK, ls: 4 });
    g.save(); g.scale(1, flipU < 1 && moving ? Math.max(.2, flipU) : 1); NOREC = nr || moving; txt(g, String(y), 0, 34, { px: 104, align: 'center', col: moving ? INK2 : INK, ls: 2 }); NOREC = nr; g.restore();
    g.restore();
    /* prices: grocery stickers pop with rising arrows */
    [[P.milk, 600, 700, T.ic0], [P.gas, 800, 800, T.ic1], [P.burger, 640, 935, T.ic2]].forEach(function (q, i) {
      popIn(g, t, q[0], q[1], q[2], q[3], T.icOut, (i - 1) * .08, 1.05);
      if (t >= q[3] + .1 && t < T.icOut + .2) { g.save(); g.globalAlpha *= 1 - sm(t, T.icOut, .25); var ak = sm(t, q[3] + .1, .3), lift = 14 * osc(t, 11, i); KIT.arrow(g, q[1] + 62, q[2] + 40 + lift, q[1] + 66, q[2] - 50 + lift, ak, HOT, 10, .05); g.restore(); }
    });
    if (t >= T.pct && t < T.W2 + .3) slam(g, '+43.9%', 300, 566, 120, t - T.pct, { col: HOT, rot: -.04, lw: 12 });
    chipAt(g, t, 'BLS CPI-U · SEPT 2013 → SEPT 2026', 620, 1290, T.pctChip, T.blsOut, { px: 38, bg: CREAM, fg: INK });
    /* hero: the GTA 5 tag swings in at the right, the disc swells and rolls $59.99 → $86.33 */
    if (t >= T.t5H - .05) {
      var k5 = sm(t, T.t5H, .5), st = { x: lerp(1180, 716, k5), y: 560, len: 36, s: .62, a: sw(t, T.t5H + .4, .22, 6, 2.2) + .02 * osc(t, 8, 5) };
      hang(g, P.tag5, st, k5 < 1);
    }
    if (dr > 1) {
      var landed = tq(t) >= T.rollB, v = 59.99 + (86.33 - 59.99) * eio(seg(tq(t), T.rollA, T.rollB));
      var str = '$' + (landed ? '86.33' : v.toFixed(2)), dk = kn(t, T.rollB, .08) * (1 + .03 * strokeK(t));
      g.save(); g.translate(dp[0], dp[1]); g.rotate(.02 * osc(t, 6, 1)); g.scale(dr / 200 * dk, dr / 200 * dk);
      put(g, P.disc, 0, 0);
      var px = 118; NOREC = nr || !landed || dr < 150;
      txt(g, str, 0, landed ? -14 : 10, { px: px, align: 'center', col: landed ? INK : '#8c7f99', ls: 1 });
      if (landed) txt(g, 'TODAY', 0, 84, { px: 52, align: 'center', col: HOT, ls: 4 });
      NOREC = nr; g.restore();
      if (t >= T.rollB && t < T.rollB + .45) KIT.impact(g, dp[0], dp[1], t - T.rollB, .75, CREAM);
    }
    chipAt(g, t, 'CPI-U · SEPT 2026', 742, 1356, T.cpiTag, T.W2 + .2, { px: 40, bg: ORG });
    /* the hero stamp lands in the pause, over the pump's foot (not on the disc) */
    if (t >= T.stampT - .02) {
      var sk2 = cd(t, T.stampT, 30); g.save(); g.globalAlpha *= clamp((t - T.stampT) * 14, 0, 1); g.translate(338, 1290); g.rotate(-.07); var ss = lerp(1.08, 1, sk2); g.scale(ss, ss); NOREC = nr || sk2 < .98; putW(g, P.stampH, 0, 0); NOREC = nr; g.restore();
    }
  }

  /* ---------- phase 2: back on the scale; the disc hangs under GTA 5 and the scale slams its way ---------- */
  function cam2(t) { var k = sm(t, T.camUp, .6); return { s: lerp(1, .86, k), dy: lerp(0, -70, k), k: k }; }
  function phase2(g, t) {
    var c = cam2(t), th = scaleTh(t, 2), nr = NOREC, cm = c.k > 0 && c.k < 1;
    g.save(); g.translate(SPX, 700 + c.dy); g.scale(c.s, c.s); g.translate(-SPX, -700);
    NOREC = nr || cm;
    drawScale(g, t, th, 1);
    var s5 = tag5P(t, 2), e6 = beamEnd(th, 1), s6 = { x: e6.x, y: e6.y, len: 30, s: .7 * kn(t, T.k6, .05) * kn(t, T.k79, .05), a: -sw(t, T.slam, .1, 6, 2.4) + .02 * osc(t, 8, 6) };
    hang(g, P.tag5, s5, cm); hang(g, P.tag6, s6, cm);
    if (t >= T.k79 && t < T.k79 + .45) { var ip = tagPt(s6, 300); KIT.impact(g, ip[0], ip[1], t - T.k79, .42, TEAL); }
    /* the disc hangs from the GTA 5 tag on a short string: the extra weight */
    var bp = tagPt(s5, TH - HOLE - 20), dx = bp[0] - 14, dy = bp[1] + 112 + 6 * osc(t, 8, 1);
    g.strokeStyle = '#efe2c4'; g.lineWidth = 4; g.beginPath(); g.moveTo(bp[0], bp[1]); g.lineTo(dx, dy - 92); g.stroke();
    g.save(); g.translate(dx, dy); g.rotate(.03 * osc(t, 6, 2)); var dk = kn(t, T.slam, .08); g.scale(.48 * dk, .48 * dk); put(g, P.disc, 0, 0);
    txt(g, '$86.33', 0, -14, { px: 118, align: 'center', col: INK, ls: 1 }); txt(g, 'TODAY', 0, 84, { px: 52, align: 'center', col: HOT, ls: 4 }); g.restore();
    if (t >= T.slam + .05 && t < T.slam + .6) KIT.dust(g, SPX, FLOOR - 10, t - T.slam - .05, .8);
    NOREC = nr;
    g.restore();
    chipAt(g, t, 'CPI-U · SEPT 2026', 290, 600, T.W2 + .1, T.rcIn2 - .1, { px: 38, bg: ORG });
    /* the hero stamp stays pasted on the floor until the fine print covers it */
    if (t < T.rcIn2 + .3) { var so = sm(t, T.rcIn2 - .1, .3); g.save(); g.globalAlpha *= 1 - so; g.translate(462, 1340 + so * 80); g.rotate(-.06); g.scale(.55, .55); NOREC = nr || so > 0; putW(g, P.stampH, 0, 0); NOREC = nr; g.restore(); }
    /* on "more": the comparison, in today's dollars */
    if (t >= T.cmp - .02 && t < T.rcIn2 + .3) { var ck = cd(t, T.cmp, 14), co = sm(t, T.rcIn2 - .1, .25); var nrc = NOREC; NOREC = nrc || ck < .98 || co > 0;
      chip(g, '$86.33 > $79.99', 640, 652 - (1 - ck) * 40, { px: 46, bg: HOT, fg: INK, a: fin(t, T.cmp, .08) * (1 - co), rot: -.02, s: kn(t, T.cmp + .1, .05) * kn(t, T.bnc1, .04) * kn(t, T.bnc2, .04) }); NOREC = nrc; }
    /* CHEAPER*, always with its condition, under the GTA 6 tag */
    if (t >= T.cheap - .02) {
      var cy = lerp(1128, 1040, c.k);
      slam(g, 'CHEAPER*', 712, cy, 76, t - T.cheap, { col: TEAL, rot: -.04, lw: 12 });
      slam(g, "IN TODAY'S $", 712, cy + 70, 46, t - T.cheap - .12, { col: CREAM, rot: -.02 });
    }
    /* fine: the fine-print receipt prints up from the bottom edge in the pause, then each line gets a check on its words */
    if (t >= T.rcIn2 - .02) {
      var k = Math.max(.42 * sm(t, T.rcIn2, .2), .66 * sm(t, T.rcL2, .2), .9 * sm(t, T.rcL3, .2), sm(t, T.rcL3 + .22, .2));
      var ry = lerp(1430 + 120, 1312, k);
      g.save(); g.translate(510, ry); g.rotate(.015); NOREC = nr || k < .999; putW(g, P.rcFine, 0, 0); NOREC = nr;
      [[T.ck1, -54], [T.ck2, 2], [T.ck3, 58]].forEach(function (q) { var ck = sm(t, q[0], .22); if (ck <= 0) return; g.strokeStyle = TEAL; g.lineWidth = 9; g.lineCap = g.lineJoin = 'round'; g.beginPath(); var x0 = -296, y0 = q[1]; g.moveTo(x0, y0); g.lineTo(x0 + 10 * Math.min(1, ck * 2), y0 + 12 * Math.min(1, ck * 2)); if (ck > .5) g.lineTo(x0 + 10 + 18 * (ck - .5) * 2, y0 + 12 - 30 * (ck - .5) * 2); g.stroke(); });
      g.restore();
    }
    chipAt(g, t, 'SEPT 2026 = LATEST BLS MONTH', 510, 592, T.blsChip, T.W3 + .2, { px: 40, bg: CREAM, fg: INK });
  }

  /* ---------- phase 3: the calendar (six) ---------- */
  function calendar(g, t) {
    var k = cd(t, T.W3 - .05, 12), x = 510, y = 960 + (1 - k) * 800, s = 1.55 * kn(t, T.kNov, .04), rot = -.02 + .012 * osc(t, 5) + (1 - k) * .2;
    var nr = NOREC;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    put(g, P.padBack, 0, 0);
    var tk = seg(t, T.tearCal, T.tearCal + .45), PH2 = (P.PAD_H - 70) / 2;
    NOREC = nr || k < .98; putW(g, P.nov19, 0, 26); NOREC = nr;
    if (tk < 1) { g.save(); g.translate(0, 26 - PH2); g.translate(-40 * tk, -1300 * tk * tk); g.rotate(-.35 * tk); g.globalAlpha *= 1 - seg(tk, .7, 1); NOREC = true; putW(g, P.blankPg, 0, PH2); NOREC = nr; g.restore(); }
    put(g, P.binding, 0, 0);
    g.restore();
    var pk = cd(t, T.pill6, 15);
    if (t >= T.pill6 - .02) { g.save(); g.translate(510, 625 - (1 - pk) * 60); var ps = 1.2 * kn(t, T.pill6 + .05, .06); g.scale(ps, ps); g.globalAlpha *= fin(t, T.pill6, .08); NOREC = nr || pk < .98; putW(g, P.pill6, 0, 0); NOREC = nr; g.restore(); }
    chipAt(g, t, 'PS5', 270, 1372, T.plat, T.W4 + .3, { px: 52, bg: TEAL, rot: -.03 });
    chipAt(g, t, 'XBOX SERIES X|S', 640, 1372, T.platX, T.W4 + .3, { px: 52, bg: TEAL, rot: .02 });
    if (t >= T.k19) { g.save(); g.globalAlpha *= 1 - seg(t, T.W4 - .1, T.W4); KIT.scribble(g, 510, 1010, 165, 120, eio(seg(t, T.k19, T.k19 + .35)), HOT, 11, 3); g.restore(); }
    if (t >= T.kNov && t < T.kNov + .5) KIT.impact(g, 700, 780, t - T.kNov, .6, CREAM);
  }

  /* ---------- phase 4: the frame-0 tag again, with two identical vote tags ---------- */
  function phase4(g, t) {
    coins(g, t, 1);
    var st = { x: HOOK.x, y: HOOK.y, len: HOOK.len, s: HOOK.s, a: swingHook(t, T.W4 - .4) };
    hang(g, P.tag6, st, false);
    tooMuch(g, t, 510, 1170, 132, [T.tooK2]);
    [[P.yes, 330, T.kYes], [P.no, 690, T.kNo]].forEach(function (q, i) {
      var tin = T.vote; if (t < tin - .02) return;
      var k = cd(t, tin, 15), yy = lerp(1100, 1320, k), rot = (i ? .03 : -.03) + sw(t, tin + .08, .08, 8, 2.8) + sw(t, q[2], .05, 10, 3), s = kn(t, q[2], .08);
      g.save(); g.globalAlpha *= fin(t, tin, .08); g.translate(q[1], yy); g.rotate(rot); g.scale(s, s);
      var nr = NOREC; NOREC = nr || k < .98; putW(g, q[0], 0, 0); NOREC = nr; put(g, P.pin, -q[0].w / 2 + 58, 0); g.restore();
    });
  }
  /* frame 0 (and the loop's last frame): drawn at t − DUR, which is frame 0's state exactly */
  function phase5(g, t) { phase0(g, t - DUR); }

  function wipe(g, t, tm) {
    var k = seg(t, tm - .28, tm + .28); if (k <= 0 || k >= 1) return;
    var y = lerp(1500, -1650, eio(k));
    g.save(); g.translate(-10, y); g.rotate(-.04); put(g, P.band, 0, 0); g.restore();
  }

  /* ---------- background life: spotlights and paper flecks, periodic in the film's length ---------- */
  function bgLife(g, t) {
    if (!LIVE2.bg) return;
    [[230, .9, 0], [850, -.9, 2.1]].forEach(function (L) {
      var s0 = t < DUR / 2 ? t : t - DUR, e = s0 > 0 ? Math.sin(Math.PI * clamp(s0 / 1.2, 0, 1)) : 0;
      var a = L[1] * (.28 + .2 * osc(t, 7, L[2])) + .05 * osc(t, 13, L[2]) - L[1] * .26 * e;
      g.save(); g.translate(L[0], -40); g.rotate(a); g.globalAlpha = .1; g.fillStyle = '#fff3d6';
      g.beginPath(); g.moveTo(-30, 0); g.lineTo(30, 0); g.lineTo(260, 1500); g.lineTo(-260, 1500); g.closePath(); g.fill(); g.restore();
    });
    FLECK.forEach(function (f) {
      var y = ((f.y + 1500 * f.sp * t / DUR) % 1500) - 40, x = f.x + f.dx * osc(t, 3 * f.sp, f.ph);
      g.save(); g.translate(x, y); g.rotate(TAU * f.rs * t / DUR + f.ph); g.scale(1, Math.cos(TAU * 5 * f.sp * t / DUR + f.ph)); g.globalAlpha = .55; g.fillStyle = f.col; g.fillRect(-f.w / 2, -f.w * .3, f.w, f.w * .6); g.restore();
    });
  }

  /* ---------- captions (the voice, phrase by phrase; the hook line is carried by the picture) ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'end') return;
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { outc.push(cur); cur = []; } });
      if (cur.length) outc.push(cur);
    });
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
  var CAPY = 440;
  function captions(g, t) {
    if (t >= T.W4 - .1 && t < T.W4 + .9) return;
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .06), outk = 1 - seg(t, o0, o1);
    if (fi * outk <= 0) return;
    var CY = CAPY, k = cd(t, card0.t0 - .04, 16);
    g.save(); cond(g); var cpx = 74; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var lines, lw, maxw = 720, CXc = CX;
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
      var tw = lw[li] - gap, x = CXc - tw / 2, y = y0 + li * lh + (1 - k) * 30, seed = Math.round(card0.t0 * 100) + li * 7;
      var r = mulberry(seed), x0 = x - 22, x1 = x + tw + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CXc, y); g.rotate(rot); g.translate(-CXc, -y);
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

  var NOISE, POSTERMODE = false, VIG = null;
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function vignette(g) {
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 880, 460, 510, 900, 1250); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.45)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) put(g, P.wall, 0, 0);
    bgLife(g, t);
    var ph = phase(t);
    if (LIVE2.bg) {
      if (ph === 2) { var c = cam2(t); floorBg(g, 700 + c.dy + (FLOOR - 700) * c.s); }
      else floorBg(g, FLOOR);
      vignette(g);
    }
    g.save(); railClip(g);
    /* a slow breathing push, periodic in the film's length, so no beat ever holds dead still */
    var bs = 1 + .012 * osc(t, 9, .7); g.translate(510, 880); g.scale(bs, bs); g.translate(-510, -880);
    if (ph === 0) phase0(g, t); else if (ph === 1) phase1(g, t); else if (ph === 2) phase2(g, t); else if (ph === 3) calendar(g, t); else if (ph === 4) phase4(g, t); else phase5(g, t);
    g.restore();
    g.save(); railClip(g); [T.W1, T.W2, T.W3, T.W4, T.W5].forEach(function (w) { wipe(g, t, w); }); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    /* frame 0 and the loop */
    Tx('t6', 'GTA 6', 0, T.W1); Tx('t6', 'GTA 6', T.W2, T.W3); Tx('t6', 'GTA 6', T.W4, DUR + 1);
    Tx('p79', '$79.99', 0, T.W1); Tx('p79', '$79.99', T.W2, T.W3); Tx('p79', '$79.99', T.W4, DUR + 1);
    Tx('too', 'TOO MUCH?', 0, T.thenIn + .1); Tx('too', 'TOO MUCH?', T.W4, DUR + 1);
    Tx('us', 'US LAUNCH PRICE · STANDARD', T.usChip + .1, T.cardsOut + .05);
    /* then, ask, paper */
    Tx('t5', 'GTA 5', T.t5In + .3, T.W1); Tx('t5', 'GTA 5', T.t5H + .4, T.W3);
    Tx('p59', '$59.99', T.t5In + .3, T.W1); Tx('p59', '$59.99', T.t5H + .4, T.W3);
    Tx('c13', 'SEPT 2013', T.card5 + .15, T.cardsOut + .05); Tx('c26', 'NOV 2026', T.card6 + .15, T.cardsOut + .05);
    Tx('src5', 'KOTAKU · MAY 2013', T.src5 + .1, T.cardsOut + .05); Tx('src6', 'PS + XBOX STORE · US', T.src6 + .1, T.cardsOut + .05);
    Tx('q', '?', T.q + .1, T.qOut + .05); Tx('w20', '+$20', T.tip, T.W1);
    Tx('onp', 'ON PAPER', T.rcIn + .2, T.W1); Tx('sum', '$79.99 − $59.99 = $20', T.rcLine + .45, T.W1);
    /* prices, hero */
    Tx('cpi', 'PRICES', T.W1 + .1, T.W2);
    Tx('y13', '2013', T.W1 + .1, T.flips[0]); Tx('y26', '2026', T.yr1 + .05, T.W2);
    Tx('pct', '+43.9%', T.pct + .15, T.W2); Tx('bls', 'BLS CPI-U · SEPT 2013 → SEPT 2026', T.pctChip + .1, T.blsOut + .05);
    Tx('d86', '$86.33', T.rollB, T.W3); Tx('today', 'TODAY', T.rollB, T.W3);
    Tx('cpiS', 'CPI-U · SEPT 2026', T.cpiTag + .1, T.W2); Tx('cpiS', 'CPI-U · SEPT 2026', T.W2 + .2, T.rcIn2 - .05);
    Tx('stamp', 'OVER $85 TODAY', T.stampT + .05, T.W2); Tx('stamp', 'OVER $85 TODAY', T.W2 + .05, T.rcIn2 - .05);
    /* more, fine */
    Tx('cheap', 'CHEAPER*', T.cheap + .1, T.W3); Tx('cmp', '$86.33 > $79.99', T.cmp + .1, T.rcIn2 - .05); Tx('itd', "IN TODAY'S $", T.cheap + .25, T.W3);
    Tx('f1', '* US LAUNCH LIST PRICES', T.rcIn2 + .2, T.W3); Tx('f2', 'STANDARD EDITIONS', T.rcL2 + .2, T.W3); Tx('f3', 'NO SALES, NO REGIONS', T.rcL3 + .2, T.W3);
    Tx('latest', 'SEPT 2026 = LATEST BLS MONTH', T.blsChip + .05, T.W3);
    /* six, end */
    Tx('nov', 'NOV 19 2026', T.W3 + .2, T.W4); Tx('pill6', 'GTA 6', T.pill6 + .1, T.W4); Tx('ps5', 'PS5', T.plat + .15, T.W4); Tx('xbox', 'XBOX SERIES X|S', T.platX + .15, T.W4);
    Tx('yes', 'YES', T.vote + .2, T.W5); Tx('no', 'NO', T.vote + .2, T.W5);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    G('pop0', .02, 'pop', .05, .7);
    /* hook */
    T.usChip = wend('hook', '$80') + .08; T.tooK = at('hook', 'too');
    G('ding', after('hook'), 'ding', .35, 1);
    T.thenIn = lastw('hook') + .05;
    /* then */
    T.t5In = at('then', 'gta') - .12;
    T.card5 = at('then', 'was'); T.card6 = T.card5 + .3; T.src5 = T.card5 + .35; T.src6 = T.card6 + .35;
    T.k2013 = at('then', '2013'); T.padIn = T.k2013 + .1;
    T.scaleIn = after('then') - .05;
    G('rise', T.scaleIn, 'swish', .3, .8);
    T.hookOn = T.scaleIn + .5; T.cardsOut = T.hookOn;
    G('hookC', T.hookOn + .45, 'clank', .3, 1);
    /* ask */
    T.wob1 = at('ask', 'which'); T.wob2 = at('ask', 'really'); T.q = at('ask', 'more'); T.qK = G('popQ', after('ask'), 'pop', .35, 1);
    T.qOut = start('paper') + .55;
    /* paper */
    T.rcIn = start('paper') - .3; T.rcLine = T.rcIn + .15;
    T.tip = at('paper', '6') + .05; T.k20 = at('paper', 'twenty');
    T.W1 = Math.min(start('prices') - .15, vadEndBefore(start('prices') + .3, lastw('paper') - .6) + .4);
    G('w1', T.W1 - .22, 'swish', .3, .9);
    /* prices: the year box knocks on "2013", the pump strokes on the words, the years flip (speeding up) into the pause */
    T.k2013b = at('prices', '2013'); T.yr0 = wend('prices', '2013');
    T.ic0 = at('prices', 'since'); T.ic1 = wend('prices', '2013') - .1; T.ic2 = at('prices', 'us');
    var pEnd = after('prices');
    T.yr1 = pEnd + .38; T.flips = [];
    for (var n = 1; n <= 13; n++) { var tf = T.yr0 + (T.yr1 - T.yr0) * Math.sqrt(n / 13); T.flips.push(Math.round(tf * 30) / 30); G('yt' + n, tf, 'tick', .03, .55 + n * .03); }
    T.yr1 = T.flips[12];
    T.pct = T.yr1 + .1; G('pctS', T.pct, 'pop', .2, 1.1);
    T.pctChip = T.pct + .2;
    T.strokes = [];
    for (var s = at('prices', 'us'); s < T.yr1 - .2; s += .44) T.strokes.push(s);
    /* hero */
    T.icOut = start('hero') - .1;
    T.t5H = at('hero', 'gta') - .2; T.discIn = at('hero', '5s');
    T.rollA = at('hero', 'is'); T.rollB = Math.round((wend('hero', 'today') - .08) * 30) / 30;
    for (s = T.discIn + .1; s < T.rollB - .2; s += .48) T.strokes.push(s);
    T.blsOut = Math.max(T.pctChip + 3.4, T.rollA + .4);
    T.cpiTag = T.rollB + .15;
    T.stampT = G('hero', after('hero'), 'stamp', .4, 1.2, { heavy: true });
    T.W2 = start('more') - .24;
    G('w2', T.W2 - .12, 'tear', .3, .9);
    /* more */
    T.slam = at('more', 'more'); T.k6 = at('more', '6'); T.k79 = at('more', '$79.99');
    T.cheap = at('more', '$79.99') + .2; T.bnc1 = T.slam + .5; T.bnc2 = T.slam + 1.0; T.cmp = T.slam + .1;
    T.rcBase = G('cheapC', after('more'), 'clank', .3, 1.1);
    /* fine: the receipt prints in the pause after the line, ticks off each line on its words */
    T.camUp = T.rcBase + .4; T.rcIn2 = T.rcBase + .45; T.rcL2 = T.rcIn2 + .2; T.rcL3 = T.rcL2 + .2;
    G('prn', T.rcIn2 + .05, 'tick', .2, .8); G('prn2', T.rcL3 + .02, 'tick', .2, .8);
    T.blsChip = T.rcIn2 + .2;
    T.ck1 = at('fine', 'us'); T.ck2 = at('fine', 'standard'); T.ck3 = at('fine', 'edition') + .1;
    T.W3 = Math.min(start('six') - .12, vadEndBefore(start('six') + .3, lastw('fine') - .6) + .45);
    G('w3', T.W3 - .12, 'tear', .3, .9);
    /* six */
    T.tearCal = T.W3 + .25; T.kNov = at('six', 'november'); T.pill6 = at('six', 'gta'); T.plat = T.W3 + .2; T.platX = T.W3 + .22; T.k19 = at('six', '19th');
    T.W4 = start('end') - .15;
    G('w4', T.W4 - .08, 'tick', .3, 1);
    /* end */
    T.tooK2 = at('end', 'too'); T.vote = T.W4 + .4; T.kYes = at('end', 'yes'); T.kNo = at('end', 'no');
    T.W5 = DUR - .3;
    G('w5', T.W5 - .25, 'swish', .3, .8);
    STRESS = [['then', '$59.99'], ['then', '2013'], ['paper', 'paper'], ['prices', 'forty'], ['hero', '$85'], ['hero', 'today'], ['more', 'more'], ['six', 'november'], ['end', 'yes'], ['end', 'no']].map(function (p) { return at(p[0], p[1]); });
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

  /* ---------- sound: paper foley written into the pauses; no music (Isac adds a TikTok sound) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .8;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -8; comp.ratio.value = 2; comp.attack.value = .004; comp.release.value = .15;
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
    function stamp(t, g, heavy) { tick(t, 1.6 * g, 2400); thump(t, .7 * g); if (heavy) { boom(t + .01, .6 * g, 110, 38, .62); band(t, t + .5, 900, 200, .12 * g, .02 * g, .7, 0, 'lowpass'); } var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    function swish(t, g) { band(t, t + .26, 600, 3600, .09 * g, .02 * g, 1.3, -.2); }
    function tear(t, g) { for (var j = 0; j < 8; j++) tick(t + .012 * j + rnd() * .006, (.35 + rnd() * .4) * g, 1800 + rnd() * 2400); band(t, t + .1, 1400, 4200, .07 * g, .02 * g, 1.4, .15); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); }
    function pop(t, g) { thump(t, .3 * g, 320); tick(t, 1.1 * g, 2600); band(t, t + .06, 2400, 1200, .06 * g, .01 * g, 1.2); }
    function ding(t, g) { osc2('sine', 2093, t, t + .5, [[t, 0], [t + .003, .22 * g], [t + .16, .05 * g], [t + .45, 0]]); osc2('sine', 3136, t + .01, t + .4, [[t + .01, 0], [t + .014, .1 * g], [t + .12, .02 * g], [t + .35, 0]]); tick(t, 1.2 * g, 3000); thump(t, .18 * g, 260); }
    function clank(t, g) { osc2('triangle', 523, t, t + .3, [[t, 0], [t + .003, .2 * g], [t + .2, 0]]); osc2('triangle', 811, t, t + .25, [[t, 0], [t + .003, .12 * g], [t + .16, 0]]); thump(t, .45 * g, 170); tick(t, 1.4 * g, 2200); }
    var LEVEL = { stamp: 1, swish: 14, tick: 2.4, tear: 9, thock: 2, pop: 4.6, rise: 7, ding: 3.2, clank: 2.4 };
    var TRIM = window.SFX_TRIM || {};
    /* jury r1: every hit at least 3 dB under the voice, the hero stamp the loudest hit (dB per type, on top of LEVEL) */
    var TYPE_DB = window.SFX_TYPE_DB || { stamp: 0, swish: -1, tick: -6, tear: -5, pop: -8, clank: -8, ding: -5 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'stamp') stamp(e.t, g, e.heavy);
      else if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'tear') tear(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'pop') pop(e.t, g);
      else if (e.type === 'ding') ding(e.t, g);
      else if (e.type === 'clank') clank(e.t, g);
      else if (e.type === 'rise') { band(e.t, e.t + e.dur, 500, 4200, .12 * g, .06 * g, 1.1, .1); for (var j = 0; j < 8; j++) tick(e.t + j * .018, .5 * g, 2600); }
      else if (e.type === 'tick') { tick(e.t, 1.2 * g, 2200); thump(e.t, .12 * g, 400); }
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”’·→…#?‹|~$+—½'); })).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures();
      window.READY = true;
    });
  }

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-price', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.rcBase + .3) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'Too much?', t0: 0, t1: start('then') }, { id: 'scale', name: 'GTA 5 vs GTA 6', t0: start('then'), t1: T.W1 }, { id: 'pump', name: 'Inflation', t0: T.W1, t1: T.W2 }, { id: 'more', name: 'In today\'s $', t0: T.W2, t1: T.W3 }, { id: 'six', name: 'Nov 19', t0: T.W3, t1: T.W4 }, { id: 'vote', name: 'Yes or no?', t0: T.W4, t1: DUR }]; };

  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the bleed wall/shelf off and no clip, every shape and glyph must stay inside x 90-930 and above y 1450 */
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
