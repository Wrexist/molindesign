/* "GTA 6 sold 32.5 million before launch": Delta launch-week news Short. Rockstar Games (Business Wire, Nov 20 2026,
   on Take-Two IR, read 2026-11-21): "Grand Theft Auto VI sold 32.5 million units pre-release, a new record across all
   platforms." Comparison, same company's own unit count, a different measure (labeled on screen): GTA V "already has
   sold-in nearly 29 million units ... in less than six weeks after launch" (Take-Two, Oct 29 2013, SEC 8-K Ex 99.1);
   launched Sept 17 2013. Sold-in = shipped to stores. No ratio, no difference, no dollars. Sources in BRIEF.md.
   A vertical film written in code, narrated first and cut to the voice: every beat is keyed to a word time from vo/vo.js
   (window.VO) with at(id, word); every hit sits in a pause the voice track really leaves (vo/vad.js). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Set: split-flap counters and a tear-off desk
   calendar on an ink shelf, over official Rockstar gameplay plates (SAFE-EDIT rule 11, film/kit/clip.js).
   No Rockstar or Take-Two logos or key art (names typed in our font), no music. Engine from gta-daysales. */
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
      lines.forEach(function (L, i) { ptxt(g, rec, L[0], 0, -h / 2 + (o.pad || 34) / 2 + lh * (i + .5) + 2, L[1], L[2] || fg, { ls: L[3] == null ? 1.5 : L[3], max: w - 36, st: L[4] }); });
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
     THE SET: the split-flap board over live Vice City. Official Rockstar gameplay plays full-bleed behind
     (SAFE-EDIT rule 11: muted, dimmed, under our graphics, a new range each beat). Over it: an ink shelf that
     bleeds the full width at y 1300, a hand-built split-flap counter (cream flaps with a hinge line, ink digits,
     an ink housing with pink trim) for GTA 6, a grey one for GTA 5, and a tear-off desk calendar. Native move:
     the flap slam (blank flaps clatter, then every cell lands on its final character; never a visible roll
     through other numbers). Oxblood stamp. No Rockstar or Take-Two logo or key art; names typed in our font.
     ===================================================================================================== */
  var PINK = '#ff3d8b', PINK2 = '#c2185b', PINKD = '#7d0c3d';
  var CRM = '#fbf5e6', OXI = '#a3202c', RED2 = '#cf2a33';
  var GREYF = '#d9d7e0', GREY = '#a4a2b0', GREY2 = '#6f6d7c', GREYD = '#3f3d4c';
  var MUST = '#e7b23a', FLAP = '#f4ecda', FLAPG = '#e4e1ea', HOUSE = '#101120';
  INK = '#16182e';
  var D = {}, SHY = 1300;

  /* ---------- the backdrop (frames with no plate) and the shelf ---------- */
  function buildBackdrop() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(23);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0d0e1f'); gr.addColorStop(.5, '#17193a'); gr.addColorStop(1, '#0b0c1a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    /* cut-paper boards behind the board: wide vertical strips with pale cut edges */
    for (var i = 0; i < 8; i++) { var x = i * 150 - 30 + r() * 24, wv = 160; g.fillStyle = 'rgba(' + (24 + r() * 14 | 0) + ',' + (26 + r() * 12 | 0) + ',' + (60 + r() * 20 | 0) + ',.45)'; g.fillRect(x, 0, wv, H); g.fillStyle = 'rgba(220,220,255,.05)'; g.fillRect(x, 0, 2, H); g.fillStyle = 'rgba(0,0,10,.25)'; g.fillRect(x + wv - 6, 0, 6, H); }
    for (i = 0; i < 6000; i++) { g.fillStyle = r() < .5 ? 'rgba(200,200,255,' + (.01 + r() * .025).toFixed(3) + ')' : 'rgba(0,0,10,' + (.04 + r() * .07).toFixed(3) + ')'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 4); }
    g.globalAlpha = .22; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    return c;
  }
  function buildShelf() {
    var c = mk(W, 200), g = c.getContext('2d'), y0 = 30;
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, W, y0);
    var gr = g.createLinearGradient(0, y0, 0, c.height); gr.addColorStop(0, '#1d1f3c'); gr.addColorStop(.5, '#14152b'); gr.addColorStop(1, '#0a0b16'); g.fillStyle = gr; g.fillRect(0, y0, W, 150);
    g.fillStyle = 'rgba(255,61,139,.55)'; g.fillRect(0, y0 + 148, W, 3); var sh = g.createLinearGradient(0, y0 + 151, 0, 200); sh.addColorStop(0, 'rgba(0,0,8,.55)'); sh.addColorStop(1, 'rgba(0,0,8,0)'); g.fillStyle = sh; g.fillRect(0, y0 + 151, W, 200 - y0 - 151);
    g.fillStyle = PINK; g.fillRect(0, y0, W, 6); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, y0, W, 2);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y0 + 6, W, 10);
    grainLines(g, 0, y0 + 20, W, y0 + 148, 'rgba(180,180,255,.05)', 14, 4);
    g.globalAlpha = .3; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, y0, W, 148); g.globalAlpha = 1;
    return c;
  }

  /* ---------- the split-flap board ----------
     cells: [{ch, w}] widths in px at scale 1; a board has events [{t, chars}]: from t - CLAT the cells flip blank
     flaps (period FP), then cell i lands its char at t + i*STAG. Frame 0 sits inside the loop's last slam. */
  var CW = 136, CH = 228, CG = 14, CPAD = 34, FP = .065, FD = .075, STAG = .06, CLAT = .34;
  function cellW(ch) { return ch === '.' ? 70 : CW; }
  function boardW(n) { var w = 0; n.forEach(function (ch) { w += cellW(ch) + CG; }); return w - CG + 2 * CPAD; }
  function halfFlap(g, x, y, w, h, ch, top, col, shade) {
    g.save(); g.beginPath(); if (top) g.rect(x, y, w, h / 2 - 3); else g.rect(x, y + h / 2 + 3, w, h / 2 - 3); g.clip();
    rr(g, x, y, w, h, 12); g.fillStyle = col; g.fill();
    var gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(.49, 'rgba(0,0,0,.06)'); gr.addColorStop(.51, 'rgba(0,0,0,.16)'); gr.addColorStop(1, 'rgba(0,0,0,.02)'); g.fillStyle = gr; g.fillRect(x, y, w, h);
    if (ch === '~') { g.beginPath(); for (var q = 0; q <= 24; q++) { var xx = x + w * (.16 + .68 * q / 24), yy = y + h / 2 + h * .07 * Math.sin(q / 24 * TAU + Math.PI); if (q) g.lineTo(xx, yy); else g.moveTo(xx, yy); } g.strokeStyle = INK; g.lineWidth = w * .17; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
    else if (ch && ch !== ' ') { cond(g, 'extra-condensed'); font(g, Math.round(h * .86), 900); ls(g, 0); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; var nr = NOREC; NOREC = true; g.fillText(ch, x + w / 2, y + h / 2 + h * .05); NOREC = nr; unst(g); }
    if (shade) { g.fillStyle = 'rgba(10,8,24,' + shade.toFixed(3) + ')'; g.fillRect(x, y, w, h); }
    g.restore();
  }
  /* one cell: prev -> next, k 0..1 (1 settled) */
  function cell(g, x, y, w, h, prev, next, k, col) {
    var hy = y + h / 2;
    if (k >= 1) { halfFlap(g, x, y, w, h, next, true, col); halfFlap(g, x, y, w, h, next, false, col); }
    else if (k < .5) {
      halfFlap(g, x, y, w, h, next, true, col, .12); halfFlap(g, x, y, w, h, prev, false, col);
      var sy = 1 - 2 * k; g.save(); g.translate(0, hy); g.scale(1, Math.max(.001, sy)); g.translate(0, -hy); halfFlap(g, x, y, w, h, prev, true, col, .35 * (1 - sy)); g.restore();
    } else {
      halfFlap(g, x, y, w, h, next, true, col); halfFlap(g, x, y, w, h, prev, false, col, .15);
      var sy2 = 2 * k - 1; g.save(); g.translate(0, hy); g.scale(1, Math.max(.001, sy2)); g.translate(0, -hy); halfFlap(g, x, y, w, h, next, false, col, .3 * (1 - sy2)); g.restore();
    }
    /* hinge pins and the hinge line */
    g.fillStyle = '#0a0a14'; g.fillRect(x - 4, hy - 3, w + 8, 6);
    g.fillStyle = '#5a5b70'; g.fillRect(x - 8, hy - 9, 10, 18); g.fillRect(x + w - 2, hy - 9, 10, 18);
  }
  /* the state of cell i of board B at t: { prev, next, k } */
  function cellState(B, i, t) {
    var ev = null, pv = null; B.ev.forEach(function (e) { if (t >= e.t - CLAT) { pv = ev; ev = e; } });
    var base = function (e) { return e ? (e.chars[i] == null ? ' ' : e.chars[i]) : ' '; };
    if (!ev) return { prev: ' ', next: base(B.ev0), k: 1 };
    var land = ev.t + i * STAG, from = base(pv || B.ev0), to = base(ev);
    if (ev.slow) {
      /* slow: one blank flap per tick time in ev.ticks, then the landing */
      var lastTick = null; ev.ticks.forEach(function (tt) { if (t >= tt + i * .02) lastTick = tt + i * .02; });
      if (t < land - FD) { if (lastTick == null) return { prev: from, next: from, k: 1 }; return { prev: ' ', next: ' ', k: clamp((t - lastTick) / (FD * 1.6), 0, 1) }; }
      return { prev: ' ', next: to, k: clamp((t - (land - FD)) / FD, 0, 1) };
    }
    if (t >= land) return { prev: ' ', next: to, k: 1 };
    var c0 = ev.t - CLAT;
    if (t >= land - FD) return { prev: ' ', next: to, k: (t - (land - FD)) / FD };
    var u = t - c0, n = Math.floor(u / FP), kk = (u - n * FP) / FD;
    return { prev: n === 0 ? from : ' ', next: ' ', k: clamp(kk, 0, 1) };
  }
  function board(g, B, cx, cy, s, t, o) {
    o = o || {}; var chars = B.ev0.chars, w = boardW(chars), h = CH + 2 * CPAD;
    g.save(); g.translate(cx, cy); g.scale(s, s);
    /* housing */
    rr(g, -w / 2 + 8, -h / 2 + 14, w, h, 22); g.fillStyle = 'rgba(0,0,8,.5)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 22); g.fillStyle = HOUSE; g.fill();
    g.lineWidth = 7; g.strokeStyle = B.trim; rr(g, -w / 2 + 3.5, -h / 2 + 3.5, w - 7, h - 7, 19); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.07)'; rr(g, -w / 2 + 12, -h / 2 + 10, w - 24, 8, 4); g.fill();
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { g.beginPath(); g.arc(p[0] * (w / 2 - 17), p[1] * (h / 2 - 17), 5, 0, TAU); g.fillStyle = '#6b6c82'; g.fill(); });
    var x = -w / 2 + CPAD;
    chars.forEach(function (ch, i) {
      var cw = cellW(ch), st = cellState(B, i, t);
      rr(g, x - 3, -CH / 2 - 3, cw + 6, CH + 6, 14); g.fillStyle = '#05050c'; g.fill();
      cell(g, x, -CH / 2, cw, CH, st.prev, st.next, st.k, B.col);
      x += cw + CG;
    });
    /* glint: a soft sheen crosses the flaps (periodic in DUR) */
    if (o.glint != null && o.glint > 0 && o.glint < 1) { var gx = lerp(-w / 2 - 120, w / 2 + 120, o.glint); var sg = g.createLinearGradient(gx - 90, 0, gx + 90, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.22)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.save(); rr(g, -w / 2 + CPAD - 4, -CH / 2, w - 2 * CPAD + 8, CH, 12); g.clip(); g.fillStyle = sg; g.fillRect(-w / 2, -h / 2, w, h); g.restore(); }
    g.restore();
    /* the board's words for the rail check (its final characters) */
    if (BOUNDS && !NOREC) recBox(g, cx - (w / 2 - CPAD) * s, cy - CH / 2 * s, cx + (w / 2 - CPAD) * s, cy + CH / 2 * s, chars.join(''));
    return { w: w * s, h: h * s };
  }
  var B6 = { trim: PINK, col: FLAP, ev0: { chars: ['3', '2', '.', '5', 'M'] }, ev: [] };
  var B5 = { trim: GREY, col: FLAPG, ev0: { chars: [' ', ' ', ' ', ' '] }, ev: [] };
  var GREYP = 1;

  /* ---------- the tear-off desk calendar ---------- */
  function calPiece(w, h, top, big, foot, band, bigpx) {
    var rec = [];
    var pc = piece([-w / 2, -h / 2 - 20, w / 2, h / 2], function (g) { g.beginPath(); g.rect(-w / 2, -h / 2, w, h); }, CRM, { sy: 12, blur: 16, extra: function (g) {
      /* the stack of pages under the top one */
      g.fillStyle = band || RED2; g.fillRect(-w / 2, -h / 2, w, 62);
      if (top) ptxt(g, rec, top, 0, -h / 2 + 33, 40, CRM, { ls: 4 });
      ptxt(g, rec, big, 0, foot ? (-h / 2 + 62 + h / 2 - 74) / 2 + 4 : 31, bigpx || 120, INK, { ls: 2, max: w - 30 });
      if (foot) { g.fillStyle = 'rgba(22,24,46,.18)'; g.fillRect(-w / 2 + 20, h / 2 - 74, w - 40, 3); ptxt(g, rec, foot, 0, h / 2 - 40, 38, '#3b3f5e', { ls: 2, max: w - 30 }); }
    }, after: function (g) {
      /* binding: an ink bar with two rings */
      g.fillStyle = HOUSE; rr(g, -w / 2 - 6, -h / 2 - 20, w + 12, 26, 8); g.fill();
      [-w / 4, w / 4].forEach(function (x) { g.beginPath(); g.arc(x, -h / 2 - 7, 9, 0, TAU); g.fillStyle = '#8d8fa8'; g.fill(); g.beginPath(); g.arc(x, -h / 2 - 7, 4, 0, TAU); g.fillStyle = HOUSE; g.fill(); });
    } });
    return wordsOf(pc, rec);
  }
  /* page edges under the calendar's top page */
  function calStack(g, x, y, w, h) { for (var i = 3; i >= 1; i--) { g.fillStyle = i % 2 ? '#e9dfc6' : '#f3ead4'; g.fillRect(x - w / 2 + i * 3, y - h / 2 + i * 5, w, h); } }

  function band(text, w, px, bg, fg, ls0) { return chipPiece([[text, px, fg, ls0 == null ? 2 : ls0]], w, bg, fg, { lh: px + 8, pad: 20 }); }
  function buildPieces() {
    D.cal0 = calPiece(250, 200, 'LAUNCH', 'DAY 0', null, RED2, 96);
    D.cal13 = calPiece(560, 400, '', '2013', null, GREY2, 240);
    D.tag6 = band('ROCKSTAR · NOV 20 2026', 600, 48, INK, CRM, 3);
    D.copies = chipPiece([['COPIES SOLD', 72, INK, 3], ['“PRE-RELEASE”', 40, PINKD, 3]], 520, CRM, INK, { lh: 70, pad: 30, ring: 'rgba(194,24,91,.55)' });
    D.prerel = band('PRE-RELEASE', 330, 48, PINKD, CRM, 3);
    D.q = cardPiece(170, 170, PINK, [['?', 150, CRM, 6]], { ring: 'rgba(255,255,255,.4)' });
    D.c5 = band('GTA 5', 190, 56, GREYD, CRM, 3);
    D.c6 = band('GTA 6 · SOLD', 290, 52, PINK2, CRM, 2);
    D.zero = chipPiece([['0 DAYS', 56, CRM, 3]], 250, RED2, CRM, { lh: 64, pad: 20, ring: 'rgba(255,255,255,.4)' });
    D.ship = chipPiece([['NEARLY 29M · SHIPPED TO STORES', 50, INK, 1], ['TAKE-TWO · OCT 29 2013', 38, '#3b3f5e', 1]], 790, CRM, INK, { lh: 54, pad: 14 });
    D.sold = chipPiece([['SOLD BEFORE LAUNCH · ROCKSTAR · NOV 20 2026', 40, CRM, 1]], 820, PINKD, CRM, { lh: 48, pad: 16 });
    D.stamp = buildStamp(['BEFORE DAY ONE'], 92, 660, OXI);
    D.quote = chipPiece([['“…A NEW RECORD', 80, CRM, 2], ['ACROSS ALL PLATFORMS”', 80, CRM, 2], ['— ROCKSTAR · NOV 20 2026', 46, MUST, 3]], 820, INK, CRM, { lh: 92, pad: 46, ring: 'rgba(231,178,58,.55)' });
    D.yes = band('YES', 360, 84, CRM, INK, 4); D.no = band('NOT YET', 360, 84, CRM, INK, 4);
    D.wk = []; for (var wi = 0; wi < 6; wi++) D.wk.push(cardPiece(88, 104, CRM, [['WK', 32, '#3b3f5e', -22], [String(wi + 1), 52, INK, 22]], { r: 4, before: function (g) { g.fillStyle = GREY2; g.fillRect(-44, -52, 88, 14); } }));
    D.f5 = band('FOOTAGE: GTA 5 (2013)', 420, 36, 'rgba(0,0,0,0)', GREYF, 3);
    D.f6 = band('FOOTAGE: GTA 6', 300, 36, 'rgba(0,0,0,0)', '#ffb3d1', 3);
  }
  function buildTextures() { GRAIN = buildGrain(); buildPieces(); D.bg = buildBackdrop(); D.shelf = buildShelf(); }

  /* ---------- poses ---------- */
  var HOOK = { x: 510, y: 730, s: 1.08 }, ROW6 = { x: 510, y: 1190, s: .8 }, ROW5 = { x: 510, y: 735, s: .8 }, TOPH = 565, TOPT = 900, BOTH = 1035, DSW = 470;
  /* the swap on "beat": the GTA 6 row flips up over the GTA 5 row (same board sizes, rank change only) */
  function swp(t) { return t >= T.qOut ? 0 : eio(seg(t, T.fastSlam - .05, T.fastSlam + .22)); }
  /* the hook slam: the board rises 320 px into place over 0.42 s; it starts 0.12 s before the loop point */
  function slamU(t) { if (t >= DUR - .12) return t - (DUR - .12); if (t < 1) return t + .12; return 9; }
  /* the GTA 6 row's drop: off the bottom during the 2013 page and the GTA 5 count, back on "But"; out again for the quote */
  function off6(t) {
    var a = eio(seg(t, T.y13 - .12, T.y13 + .18)) * (1 - eo(seg(t, T.fastUp, T.fastUp + .38)));
    var b = eio(seg(t, T.out5, T.out5 + .35)) * (1 - eo(seg(t, T.qOut, T.qOut + .38)));
    return Math.max(760 * a, 1400 * b);
  }
  function pose6(t) {
    var k = eio(seg(t, T.ask, T.ask + .55)), m = t >= T.qOut ? 0 : k;
    var p = { x: lerp(HOOK.x, ROW6.x, m), y: lerp(HOOK.y, ROW6.y, m), s: lerp(HOOK.s, ROW6.s, m), mv: k > 0 && k < 1 };
    var o = off6(t) - DSW * swp(t); p.y += o; if (o !== 0) p.mv = true; if (o !== 0) p.s *= 1 + .06 * Math.sin(Math.PI * swp(t));
    var u = slamU(t); if (u < .42) { p.y += 320 * (1 - eo(u / .42)); p.mv = true; }
    p.hide = t >= T.cut && t < DUR - .12;
    return p;
  }

  var T_UNUSED = 0;
  function dimA(t) { return seg(t, T.slowIn, T.slowIn + .3) * (1 - seg(t, T.fastUp - .1, T.fastUp + .15)); }
  function stampOnP(g, pc, x, y, rot, tl, tout, t) { slapOn(g, pc, x, y, rot, tl, tout, t, { from: 1.6 }); }
  /* the week flap: WEEK + one cell that flips 1..6 on the week ticks (time, not the value) */
  function hookType(g, t) {
    var nr = NOREC; NOREC = nr || false;
    var w1 = stkW('GTA 6', 140) + 46, w2 = stkW('SOLD', 140), x0 = 510 - (w1 + w2) / 2;
    stk(g, 'GTA 6', x0, 455, 140, { col: PINK, st: 'condensed', ls: 4, align: 'left' });
    stk(g, 'SOLD', x0 + w1, 455, 140, { col: CRM, st: 'condensed', ls: 4, align: 'left' });
    stk(g, 'BEFORE LAUNCH', 510, 975, 104, { col: CRM, st: 'condensed', ls: 2 });
    NOREC = nr;
  }
  function wkPos(wi, t) {
    var f = eio(seg(t, T.fastUp - .2, T.fastUp + .25));
    return { x: lerp(510 + (wi - 2.5) * 125, 400 + wi * 90, f), y: lerp(1185, TOPH, f), s: lerp(1.25, 1, f), mv: f > 0 && f < 1 };
  }
  function props(g, t) {
    var nr, k, p6 = pose6(t), sw = swp(t), d5 = DSW * sw, d6 = off6(t) - DSW * sw;
    /* ---- GTA 5 row: chip, week pages, grey board, NEARLY 29M · SHIPPED tag (ask .. rec); moves down on the swap ---- */
    if (t >= T.gDrop - .35 && t < T.out5 + .6) {
      var kg = seg(t, T.gDrop - .3, T.gDrop), fall = (1 - kg * kg) * 1300, go = eio(seg(t, T.out5, T.out5 + .5));
      nr = NOREC; NOREC = nr || kg < 1 || go > 0 || (sw > 0 && sw < 1);
      g.save(); g.translate(-1100 * go, -fall + d5);
      board(g, B5, ROW5.x, ROW5.y, ROW5.s * kn(t, T.gDrop, .02) * kn(t, T.s29, .05), t);
      g.restore(); NOREC = nr;
      nr = NOREC; NOREC = nr || go > 0 || (sw > 0 && sw < 1); g.save(); g.translate(-1100 * go, d5);
      slapOn(g, D.c5, 250, TOPH, -.02, T.gDrop + .1, null, t);
      /* six empty week slots appear when the 2013 page tears off; a torn page drops into each on its tick */
      var ea = fin(t, T.y13out + .1, .3) * (1 - seg(t, T.fastUp - .2, T.fastUp));
      if (ea > 0) { g.save(); g.globalAlpha *= ea * .8; g.setLineDash([12, 9]); g.lineWidth = 4; g.strokeStyle = 'rgba(251,245,230,.75)'; for (var si = 0; si < 6; si++) { var sp = wkPos(si, T.y13out); rr(g, sp.x - 55, sp.y - 65, 110, 130, 6); g.stroke(); } g.setLineDash([]); g.restore(); }
      for (var wi = 0; wi < 6; wi++) {
        var tw0 = T.wk[wi]; if (t < tw0 - .25) continue; var wp = wkPos(wi, t), rot = (hash(wi * 3 + 1) - .5) * .12;
        var nr2 = NOREC; NOREC = nr2 || wp.mv;
        drop(g, wp.x, wp.y, rot, tw0, null, t, function (q) { putW(q, D.wk[wi], 0, 0, 0, wp.s); }, { fd: .22, fall: 600, spin: .2 });
        NOREC = nr2;
      }
      g.save(); g.translate(0, -25 * sw); slapOn(g, D.ship, 510, TOPT, .005, T.ship, null, t); g.restore();
      g.restore(); NOREC = nr;
    }
    /* the ? on the empty GTA 5 board */
    slapOn(g, D.q, 510, ROW5.y, .05, T.q, T.y13 - .05, t);
    /* ---- the GTA 6 board and its row (drawn after GTA 5, so it passes over it on the swap) ---- */
    if (!p6.hide) {
      nr = NOREC; NOREC = nr || p6.mv;
      var gl = (t % (DUR / 3)) / 1.1;
      board(g, B6, p6.x, p6.y, p6.s * kn(t, T.cal, .015) * kn(t, T.fastUp + .38, .04), t, { glint: gl });
      NOREC = nr;
    }
    nr = NOREC; NOREC = nr || d6 !== 0 && !(sw >= 1 && off6(t) === 0); g.save(); g.translate(0, d6);
    slapOn(g, D.c6, 250, BOTH, -.02, T.ask + .45, T.qOut, t);
    g.restore(); NOREC = nr;
    /* BEFORE DAY ONE: the hero imprint across the GTA 6 counter (top row after the swap); it stays, lower, under the quote */
    if (t >= T.stamp - .05 && t < T.qOut + .4) {
      var sd = eio(seg(t, T.out5, T.out5 + .4)), sy = lerp(ROW5.y + 168, 1262, sd);
      nr = NOREC; NOREC = nr || (sd > 0 && sd < 1);
      slapOn(g, D.stamp, 510, sy, -.04, T.stamp, T.qOut, t, { from: 1.25 });
      NOREC = nr;
    }
    /* ---- hook: Rockstar tag (0.6 s), calendar (2.0 s); est: COPIES SOLD ---- */
    if (t >= T.cal - .05 && t < T.ask + .5) {
      var ko = eio(seg(t, T.ask, T.ask + .45));
      nr = NOREC; NOREC = nr || ko > 0; g.save(); g.translate(700 * ko, 0);
      g.save(); g.globalAlpha *= fin(t, T.cal, .06); calStack(g, 800, 1280, 250, 200); g.restore();
      slapOn(g, D.cal0, 800, 1280, .02, T.cal, null, t);
      if (t >= T.hl) { g.save(); g.translate(800, 1280); g.rotate(.02); hilite(g, -106, -16, 106, 76, eo(seg(t, T.hl, T.hl + .35))); g.restore(); }
      g.restore(); NOREC = nr;
    }
    slapOn(g, D.tag6, 420, 1120, -.012, T.tag, T.ask, t);
    slapOn(g, D.copies, 510, 985, -.02, T.copies, T.ask, t);
    /* ---- old: SEPT 17 / 2013, a big tear-off page (plate cut to ink; the GTA 6 row is off the bottom) ---- */
    if (t >= T.y13 - .05 && t < T.y13out + .5) {
      var kt = seg(t, T.y13out, T.y13out + .45);
      nr = NOREC; NOREC = nr || kt > 0;
      g.save(); g.translate(510, 1040); g.rotate(-.4 * kt * kt); g.translate(320 * kt, -1500 * kt * kt);
      g.save(); g.globalAlpha *= fin(t, T.y13, .06); calStack(g, 0, 0, 560, 400); g.restore();
      slapOn(g, D.cal13, 0, 0, -.015, T.y13, null, t);
      g.restore(); NOREC = nr;
    }
    /* ---- rec: the rows leave; the full quote, centred, over a dimmer plate ---- */
    slapOn(g, D.quote, 510, 790, -.01, T.quote, T.qOut, t, { tape: true });
    /* ---- end: equal chips, held to the cut ---- */
    if (t < T.cut) { slapOn(g, D.yes, 300, 1150, -.02, T.vote, null, t); slapOn(g, D.no, 720, 1150, .02, T.vote + .05, null, t); }
    /* ---- the hook type (frame 0 .. est; back at the cut) ---- */
    if (t < T.out1 + .6) { var ty = -900 * eio(seg(t, T.out1, T.out1 + .45)); g.save(); g.translate(0, ty); nr = NOREC; NOREC = nr || ty < 0; hookType(g, t); NOREC = nr; g.restore(); }
    if (t >= T.cut) hookType(g, t);
  }

  /* ---------- the plates: official Rockstar gameplay behind everything (rule 11) ---------- */
  var GTA5P = { ls5: 1, hwy5: 1 }, BASE = { keys: .45, drift: .36 };
  function plates(g, t) {
    var u = CLIP.activePlate(t); if (!u) return null;
    var base = BASE[u.clip] || (GTA5P[u.clip] ? .42 : .38), fade = u.t0 < .05 || u.freeze != null ? 0 : 1 - seg(t, u.t0, u.t0 + .14), dim = base + (1 - base) * Math.max(fade, u.freeze != null ? 0 : seg(t, u.t1 - .08, u.t1));
    CLIP.plate(g, t, 0, 0, W, H, { dim: Math.min(1, dim) });
    if (GTA5P[u.clip]) { g.save(); g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,.85)'; g.fillRect(0, 0, W, H); g.restore(); }
    /* ink at the top (captions) and toward the shelf, so type stays readable */
    var gr = g.createLinearGradient(0, 0, 0, 560); gr.addColorStop(0, 'rgba(8,8,20,.62)'); gr.addColorStop(1, 'rgba(8,8,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 560);
    return u;
  }
  function plateLabel(g, t, u) {
    if (!u || !LIVE.text) return;
    var a = (u.t0 < .05 || u.freeze != null ? 1 : fin(t, u.t0 + .1, .2)) * (u.freeze != null ? 1 : 1 - seg(t, u.t1 - .15, u.t1)); if (a <= 0) return;
    var pc = GTA5P[u.clip] ? D.f5 : D.f6; g.save(); g.globalAlpha *= a; putW(g, pc, 930 - pc.w / 2 + 36, 1430); g.restore();
  }

  /* ---------- captions: cream label tape in the upper third, phrase by phrase (the hook's words are the frame-0 props) ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1, was: 1, will: 1, most: 1, his: 1, is: 1, her: 1, new: 1, from: 1, as: 1, can: 1, over: 1, gta: 1, did: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) { cur.push(w); if ((w.split || /[.?!]["”]?$/.test(w.w)) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 392, TAPE = '#f6ecd0';
  function capHidden(t) { return t >= T.stamp - .06 && t < T.out5 + .1; }
  function captions(g, t) {
    t = tq(t); if (capHidden(t)) return;
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s : T.capEnd, end = Math.min(card0.t1 + .55, ns, card0.id === 'fast' ? T.stamp - .06 : 1e9, T.capEnd);
    if (t >= end) return;
    var k = cd(t, card0.s, 16), ko = 1 - seg(t, end - .06, end);
    g.save(); g.globalAlpha *= ko; cond(g); var cpx = 76; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = card0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws = up.map(function (u) { return g.measureText(u).width; }), gap = cpx * .26;
    var lines, lw, maxw = 740, CXc = 510;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var Ln = lines.length - 1; if (lw[Ln] + ws[i] > maxw && lines[Ln].length) { lines.push([]); lw.push(0); Ln++; } lines[Ln].push(i); lw[Ln] += ws[i] + gap; }); }
    function fixLines() {
      for (var Ln = 0; Ln < lines.length - 1; Ln++) { var last = lines[Ln][lines[Ln].length - 1]; while (lines[Ln].length > 1 && GLUE[norm(words[last].w)]) { lines[Ln].pop(); lines[Ln + 1].unshift(last); last = lines[Ln][lines[Ln].length - 1]; } }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2 && !stressed(words[lines[n - 1][0]])) lines[n - 1].unshift(lines[n - 2].pop());
      for (Ln = 0; Ln < lines.length - 1; Ln++) { last = lines[Ln][lines[Ln].length - 1]; while (lines[Ln].length > 1 && GLUE[norm(words[last].w)]) { lines[Ln].pop(); lines[Ln + 1].unshift(last); last = lines[Ln][lines[Ln].length - 1]; } }
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
      g.save(); g.shadowColor = 'rgba(0,10,10,.55)'; g.shadowBlur = 10; g.shadowOffsetX = 3; g.shadowOffsetY = 6; g.fillStyle = TAPE; g.fill(); g.restore();
      g.save(); g.clip(); g.globalAlpha *= .45; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0 - 8, yt - 4, x1 - x0 + 16, yb - yt + 8); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .25;
        if (cur) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ffd84a'; g.fillRect(x - 6, y - cpx * .78, ws[i] + 12, cpx * .98); g.restore(); }
        g.fillStyle = INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }



  var NOISE, POSTERMODE = false;
  var STAGEC = '#08302f';
  function stage(g) { g.fillStyle = STAGEC; g.fillRect(0, 0, W, H); }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  /* a slow 1.04 push on the hook that releases, and again into the loop */
  function push(t) { if (t < 3.4) return 1 + .04 * (1 - eio(seg(t, 0, 3.4))); if (t >= T.qOut) return 1 + .04 * eio(seg(t, T.qOut + .3, DUR)); return 1; }
  function push5(t) { return 1 + .05 * eio(seg(t, T.slowIn + .2, T.fastUp - .25)) * (1 - eio(seg(t, T.fastUp - .25, T.fastUp + .15))); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var pu = null;
    if (LIVE2.bg) {
      g.drawImage(D.bg, 0, 0);
      pu = plates(g, t);
      g.drawImage(D.shelf, 0, SHY - 30);
    }
    var pk = kn(t, T.fastSlam + .12, .07), dw = .25 + .75 * seg(t, 0, 1) * (1 - seg(t, DUR - 1, DUR)), ddx = dw * (3 * osc(t, 17, .3) + 2 * osc(t, 29, 1.1)), ddy = dw * (3 * osc(t, 13, 2.1) + 2 * osc(t, 31, .7)), ps = push(t);
    var p5 = push5(t);
    g.save(); railClip(g); g.translate(510 + ddx, 960 + ddy); g.scale(ps * pk, ps * pk); g.translate(-510, -960);
    if (p5 > 1) { g.translate(510, ROW5.y); g.scale(p5, p5); g.translate(-510, -ROW5.y); }
    props(g, t); g.restore();
    if (LIVE2.bg && !POSTERMODE) plateLabel(g, t, pu);
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('h1', 'GTA 6 SOLD', 0, T.out1); Tx('h1', 'GTA 6 SOLD', T.cut, DUR + 1);
    Tx('h2', 'BEFORE LAUNCH', 0, T.out1); Tx('h2', 'BEFORE LAUNCH', T.cut, DUR + 1);
    Tx('b6', '32.5M', 0, T.y13); Tx('b6', '32.5M', T.fastUp + .3, T.out5); Tx('b6', '32.5M', T.qOut + .3, T.cut); Tx('b6', '32.5M', DUR - .05, DUR + 1);
    Tx('cal0', 'LAUNCH DAY 0', T.cal + .1, T.ask);
    Tx('tag6', 'ROCKSTAR · NOV 20 2026', T.tag + .1, T.ask);
    Tx('copies', 'COPIES SOLD', T.copies + .1, T.ask); Tx('prerel', '“PRE-RELEASE”', T.copies + .1, T.ask);
    Tx('q', '?', T.q + .1, T.y13 - .05);
    Tx('c5', 'GTA 5', T.gDrop + .2, T.out5); Tx('c6', 'GTA 6 · SOLD', T.ask + .55, T.y13); Tx('c6', 'GTA 6 · SOLD', T.fastUp + .3, T.out5);
    Tx('y13', '2013', T.y13 + .05, T.y13out + .1);
    Tx('wk', 'WK 1 2 3 4 5 6', T.wk[5] + .1, T.out5);
    Tx('b5', '~29M', T.s29 + .3, T.out5);
    Tx('ship', 'NEARLY 29M · SHIPPED TO STORES · TAKE-TWO · OCT 29 2013', T.ship + .1, T.out5);
   
    Tx('stamp', 'BEFORE DAY ONE', T.stamp + .04, T.qOut);
    Tx('q1', '“…A NEW RECORD', T.quote + .03, T.qOut); Tx('q2', 'ACROSS ALL PLATFORMS”', T.quote + .03, T.qOut); Tx('qa', '— ROCKSTAR · NOV 20 2026', T.quote + .03, T.qOut);
    Tx('yes', 'YES', T.vote + .1, T.cut); Tx('no', 'NOT YET', T.vote + .1, T.cut);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    CLIP.reset();
    /* hook: frame 0 is the GTA 6 board slamming up into place over the mural plate (the slam starts 0.12 s before
       the loop point, so the last frame and frame 0 are one move). The Rockstar tag lands by 1.5 s; the day-0
       calendar page waits until 2.0 s so the first two seconds carry one date */
    EV.push({ t: 0, type: 'clat', g: .55, dur: .2, id: 'clat0' }); EV.push({ t: .29, type: 'thock', g: 1.1, id: 'land0' });
    T.tag = Math.min(.9, G('tag', .62, 'pin', .3, .8, { m: .03 }));
    T.cal = Math.max(2.0, G('cal', Math.max(2.0, wend('hook', 'copies') + .04), 'slap', .3, 1.1, { m: .03 }));
    T.out1 = G('out1', lastw('hook') + .12, 'swish', .3, .8, { m: .05 });
    /* est */
    T.copies = start('est') - .04; G('copies', T.copies, 'slap', .35, 1, { m: .04 });
    T.prerel = at('est', 'copies') - .02; T.hl = at('est', 'release') - .02;
    /* ask: the GTA 6 board moves to the lower row; the empty grey board drops; ? on it */
    T.ask = start('ask') + .3;
    G('askw', T.ask - .05, 'swish', .2, .8, { m: .04 });
    T.gDrop = at('ask', 'gta'); G('gdrop', T.gDrop, 'thock', .35, 1.1, { m: .04 });
    G('q', after('ask'), 'slap', .35, 1.1, { m: .05 }); T.q = at('ask', 'gta') + .05;
    /* old: the 2013 page slams on "5" (the plate cuts to ink; the GTA 6 row drops off the bottom) */
    T.y13 = at('old', '5') - .02; G('y13', T.y13, 'slap', .4, 1.1, { m: .04 });
    G('drop6', T.y13 - .1, 'swish', .3, .7, { m: .04 });
    T.slowIn = start('slow') - .15; T.y13out = Math.min(start('slow') + .5, T.y13 + 1.75); G('y13out', T.y13out, 'tear', .3, .9, { m: .04 });
    /* slow: a torn week page per tick, the grey board lands <29M; push in on it */
    var a = start('slow'), b = at('slow', 'nearly'); T.wk = [];
    for (var i = 0; i < 6; i++) { T.wk.push(a + (b - a) * i / 5.4); EV.push({ t: T.wk[i], type: 'tick', g: .5, id: 'wk' + i }); }
    T.s29 = at('slow', '29') - .1;
    B5.ev = [{ t: T.s29, chars: ['~', '2', '9', 'M'], slow: true, ticks: T.wk.slice() }];
    G('ship', after('slow'), 'clack', .35, 1.1, { m: .05 }); T.ship = at('slow', 'shipped') - .02;
    EV.push({ t: T.s29 - .02, type: 'clat', g: .5, dur: .3, id: 'clat5' });
    /* fast: the GTA 6 row comes back up on "But" (the re-hook) and re-slams on "beat"; 0 DAYS, SOLD; the
       BEFORE DAY ONE stamp lands in the pause and the DM frame holds plate-free */
    T.fastUp = start('fast') - .15; T.fastSlam = at('fast', 'beat');
    G('up6', T.fastUp + .36, 'thock', .25, 1, { m: .03 });
    EV.push({ t: T.fastSlam - .06, type: 'clat', g: .6, dur: .3, id: 'clat6' }); EV.push({ t: T.fastSlam + .18, type: 'thock', g: 1.1, id: 'swap6' });
    T.day0 = at('fast', 'day') - .02; T.sold = at('fast', 'before') - .02;
    T.stamp = G('stamp', after('fast') + .02, 'stamp', .35, 1.4, { m: .05 });
    T.out5 = T.stamp + 1.5;
    G('out5', T.out5, 'swish', .3, .8, { m: .04 });
    /* rec: both rows leave; the quote plate sits low over the marina (captions off; the plate is the line) */
    T.quote = T.out5 + .1; G('quote', T.quote, 'slap', .3, 1.1, { m: .04 });
    T.qOut = start('end');
    /* end: the board comes back to the hook pose; equal chips held to the cut; then a hard cut to frame 0 */
    T.endIn = T.qOut;
    T.vote = T.qOut + .05; G('chips', T.vote, 'pin', .45, .8, { m: .03 });
    T.cut = DUR - .25; T.seamL = T.cut; T.capEnd = T.cut - .02;
    B6.ev = [];
    EV.push({ t: DUR - .12, type: 'clat', g: .55, dur: .12, id: 'clatEnd' });
    STRESS = [['est', 'sold'], ['ask', 'fast'], ['old', '2013'], ['slow', '29'], ['fast', 'beat'], ['end', 'buy']].map(function (p) { return at(p[0], p[1]); });
    /* plates (SAFE-EDIT rule 11): a new official range each beat; frames with no plate stay all ours */
    function P(name, t0, t1, from, speed, note, zoom) { var c = CLIP.manifest().clips[name], L = c.out - c.in - .04; speed = Math.min(speed || 1, L / (t1 - t0)); CLIP.use(name, t0, t1, { plate: true, from: from || 0, speed: speed, zoom: zoom || [1.04, 1.12], note: note }); }
    P('mural', 0, start('est') - .05, 0, 1, 'plate under the hook board (frame 0)');
    P('boat', start('est') - .05, Math.min(start('ask') - .12, start('est') + 2.2), 0, .7, 'plate under COPIES SOLD');
    P('drive', start('ask') - .12, T.y13, 0, 1, 'plate under the two boards');
    P('hwy5', start('slow') - .1, T.fastUp, 0, 1, 'GTA 5 plate under the week pages, labeled');
    P('drift', T.fastUp, T.stamp, 0, .75, 'GTA 6 plate under the return and re-slam');
    P('keys', T.stamp + 1.1, T.qOut, 0, .7, 'GTA 6 plate under the Rockstar quote');
    P('pool', T.qOut, Math.min(T.cut - .55, T.qOut + 2.2), 0, .85, 'GTA 6 plate under the vote');
    CLIP.use('mural', T.cut, DUR + .01, { plate: true, from: 0, freeze: 0, zoom: [1.04, 1.04], note: 'frame-0 plate held for the loop cut' });
    EV.sort(function (x, y) { return x.t - y.t; });
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



  BODY.thunk = .16; BODY.thock = .12; BODY.stamp = .2; BODY.slap = .1; BODY.pin = .1; BODY.tick = .05; BODY.swish = .22; BODY.ching = .18; BODY.print = .22; BODY.tear = .14; BODY.pour = .3; BODY.clat = .3; BODY.clack = .14;
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
    /* the register ka-ching: a lever ratchet, two bright bells, then the drawer thunk */
    function ching(t, g) {
      tick(t, 1.4 * g, 3000); tick(t + .03, 1.2 * g, 3600);
      [[2637, .12], [3951, .07], [5274, .035]].forEach(function (b, j) { var o = osc2('sine', b[0], t + .05, t + 1.1, [[t + .05, 0], [t + .056, b[1] * g], [t + .35, b[1] * .4 * g], [t + 1.05, 0]], j ? .25 : -.1); o.detune.value = j * 6; });
      thump(t + .12, .55 * g, 140); nband(t + .1, t + .26, 900, 400, .14 * g, .02 * g, .9);
    }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); nband(t, t + .07, 2600, 1300, .08 * g, .01 * g, 1); }
    function slap(t, g) { thump(t, .3 * g, 260); nband(t, t + .06, 3000, 1500, .12 * g, .01 * g, .9); tick(t, 1.2 * g, 2000); nband(t, t + .035, 2200, 1400, .18 * g, .02 * g, 1.4); }
    function pin(t, g) { tick(t, 1.4 * g, 2800); thump(t, .25 * g, 420); }
    function keyT(t, g) { tick(t, .9 * g, 1500); thump(t, .14 * g, 360); nband(t, t + .035, 2400, 1500, .22 * g, .02 * g, 1.4); }
    /* thermal printer: a fast train of head ticks over a thin feed buzz */
    function printer(t, g, dur) { dur = dur || .25; for (var u = 0; u < dur; u += .018) tick(t + u, (.55 + .3 * rnd()) * g, 3800 + 600 * rnd()); nband(t, t + dur, 2600, 2900, .05 * g, .04 * g, 3); }
    /* split-flap clatter: a rattle of flap hits, slowing into the last few */
    function clatter(t, g, dur) { dur = dur || .3; for (var u = 0; u < dur; u += .022 + .03 * Math.max(0, u - dur + .12)) { tick(t + u, (.6 + .35 * rnd()) * g, 1500 + 900 * rnd()); thump(t + u, .05 * g, 300 + 120 * rnd()); } }
    function tear(t, g) { nband(t, t + .16, 1600, 4800, .3 * g, .05 * g, .8); for (var j = 0; j < 6; j++) tick(t + j * .02, (1 - j * .1) * g, 2600 + j * 200); }
    function swish(t, g) { nband(t, t + .2, 900, 3600, .2 * g, .03 * g, .8); }
    var LEVEL = { clat: 4, clack: 5, stamp: 1, ching: 2.4, thock: 5, slap: 3, pin: 4, tick: 6, print: 4, tear: 3, pour: 3, swish: 3 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = window.SFX_TYPE_DB || { clat: -17, clack: -16, stamp: -7, ching: -12, thock: -18, slap: -14, pin: -14, tick: -18, print: -18, tear: -15, pour: -20, swish: -16 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'stamp') stamp(e.t, g);
      else if (e.type === 'ching') ching(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'pin') pin(e.t, g);
      else if (e.type === 'tick') keyT(e.t, g);
      else if (e.type === 'print') printer(e.t, g, e.dur);
      else if (e.type === 'clat') clatter(e.t, g, e.dur);
      else if (e.type === 'clack') { clatter(e.t, g * .7, .12); thock(e.t + .1, g); }
      else if (e.type === 'pour') printer(e.t, g, e.dur);
      else if (e.type === 'tear') tear(e.t, g);
      else if (e.type === 'swish') swish(e.t, g);
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
      buildTextures(); EV.length = 0; return CLIP.load('clips.json'); }).then(function () { initTimes();
      window.FILM.POSTER = Math.round(Math.min(T.stamp + .4, T.out5 - .02) * 30) / 30 + 1 / 60;
      window.FILM.SHOTS = [{ id: 'hook', name: '32.5M', t0: 0, t1: start('ask') }, { id: 'ask', name: 'GTA 5', t0: start('ask'), t1: start('fast') }, { id: 'fast', name: 'Day one', t0: start('fast'), t1: start('rec') }, { id: 'rec', name: 'Record', t0: start('rec'), t1: start('end') }, { id: 'end', name: 'Before launch?', t0: start('end'), t1: DUR }];
      window.READY = true;
    });
  }

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-preorders', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
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
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x08) + Math.abs(d[i + 1] - 0x30) + Math.abs(d[i + 2] - 0x2f) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
    for (var i = 0; i < n; i++) for (var s = 0; s < subs; s++) {
      var t = (i + .5) / fps - span / 2 + span * (s + .5) / subs; frame(ctx, clamp(t, 0, DUR));
      var L0b = dirty(0, 300, 90, H - 300), R0 = dirty(930, 300, 150, H - 300), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0b.c + R0.c + B0.c > 0) { bad.push({ f: i, t: +t.toFixed(3), left: L0b.c && [L0b.c, L0b.x0, L0b.y0, L0b.y1], right: R0.c && [R0.c, R0.x1 + 930, R0.y0, R0.y1], bottom: B0.c && [B0.c, B0.y1, B0.x0 + 90, B0.x1 + 90] }); break; }
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; LIVE.text = lt; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
