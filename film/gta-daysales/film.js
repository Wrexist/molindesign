/* "GTA 6 made $3.79 billion in one day": Delta launch-week news Short. Take-Two (Nov 20 2026, read 2026-11-21):
   "Grand Theft Auto VI day one retail sales* reached $3.79 billion … the biggest entertainment launch in history";
   "*based on company estimates through end of day November 19th worldwide". Same company, same measure, 2013:
   GTA V "first day sell-through of more than $800 million worldwide" (excluding Japan and Brazil) and "worldwide
   retail sales of more than $1 billion during its first three days" (SEC 8-K exhibits). Nominal dollars. No ratio
   on screen or in the voice. Sources in BRIEF.md.
   A vertical film written in code, narrated first and cut to the voice: every beat is keyed to a word time from vo/vo.js
   (window.VO) with at(id, word); every hit sits in a pause the voice track really leaves (vo/vad.js). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Set: the checkout counter (teal cut-paper
   wall, pendant lamps, a cream counter, a pink cash register as the hero, a grey 2013 register, receipt tape).
   No Rockstar or Take-Two logos or art (names typed in our font), no footage, no music. Engine from gta-streampeak. */
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
     THE SET: the checkout counter. A deep teal cut-paper shop wall bleeds the whole frame, three paper pendant
     lamps sway at the top, a cream counter top runs across at y 1230 over a kraft front panel. The hero prop is
     a pink cut-paper cash register (GTA 6) with a pop-up display reading $3.79B (slammed, never rolled); a boxy
     grey 2013 register stands for GTA 5. Native move: the tape run (receipt paper feeds out of the slot: slow
     and ticking for GTA 5, one continuous pour for GTA 6 that arcs over and runs off the counter). Oxblood stamps.
     ===================================================================================================== */
  var TEAL = '#0f4a4c', TEAL2 = '#08302f', TEALL = '#1d6a66';
  var PINK = '#ff3d8b', PINK2 = '#c2185b', PINKD = '#7d0c3d', PINKF = '#ff6aa6';
  var CRM = '#fbf5e6', OXI = '#a3202c', RED2 = '#cf2a33';
  var GREYF = '#d9d7e0', GREY = '#a4a2b0', GREY2 = '#6f6d7c', GREYD = '#3f3d4c';
  var MINT = '#8dffc4', AMBER = '#ffc24a', PAPERW = '#fbf8ef', PRINT = '#2b2b3a', SAGE = '#7fb38a';
  var MUST = '#e7b23a';
  INK = '#16182e';
  var D = {};
  var CTOP = 1280;
  /* pink register, local coordinates: origin at the bottom centre, on the counter top */
  var P_SX = -165, P_SY = -412, P_TW = 180;        /* printer slot centre and tape width */
  var G_SX = 135, G_SY = -382, G_TW = 250;         /* grey register slot */

  /* ---------- pieces ---------- */
  function pinkV(g, y0, y1) { var gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, PINKF); gr.addColorStop(.5, PINK); gr.addColorStop(1, PINK2); return gr; }
  function greyV(g, y0, y1) { var gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#e9e7ee'); gr.addColorStop(.5, GREYF); gr.addColorStop(1, GREY); return gr; }
  function key(g, x, y, w, h, top, side) { rr(g, x, y + 5, w, h, 9); g.fillStyle = side; g.fill(); rr(g, x, y, w, h - 4, 9); g.fillStyle = top; g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; rr(g, x + 6, y + 4, w - 12, 6, 3); g.fill(); }
  function buildRegisters() {
    var rec = [];
    D.pBody = piece([-322, -606, 322, -108], function (g) {
      g.beginPath();
      g.moveTo(-320, -108); g.lineTo(320, -108); g.lineTo(284, -332); g.lineTo(-284, -332); g.closePath();
      g.rect(-302, -354, 604, 26);
      g.roundRect(-302, -430, 274, 82, 14);
      g.rect(150, -478, 42, 130);
      g.roundRect(18, -606, 304, 136, 16);
    }, function (g) { return pinkV(g, -606, -108); }, { sy: 16, sx: 7, blur: 26, sc: 'rgba(0,10,10,.55)', edge: 3, edgeCol: 'rgba(255,235,245,.9)', extra: function (g) {
      /* deck lip and shading */
      g.fillStyle = 'rgba(125,12,61,.35)'; g.fillRect(-302, -332, 604, 6);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(-300, -352, 600, 5);
      /* the sloped key face */
      g.fillStyle = 'rgba(125,12,61,.16)'; g.beginPath(); g.moveTo(-320, -108); g.lineTo(320, -108); g.lineTo(306, -190); g.lineTo(-306, -190); g.closePath(); g.fill();
      for (var r = 0; r < 3; r++) for (var c = 0; c < 6; c++) key(g, -250 + c * 64 + r * -6, -306 + r * 60, 52, 46, CRM, '#c9b9a0');
      key(g, 150, -306, 96, 166, RED2, PINKD);
      key(g, 150, -306, 96, 72, '#ffd2e2', '#c98aa3');
      /* printer housing: the slot */
      g.fillStyle = 'rgba(125,12,61,.3)'; rr(g, -294, -424, 258, 20, 8); g.fill();
      rr(g, P_SX - P_TW / 2 - 14, P_SY - 6, P_TW + 28, 14, 6); g.fillStyle = '#3a0a20'; g.fill();
      g.fillStyle = 'rgba(255,255,255,.25)'; rr(g, -290, -372, 250, 8, 4); g.fill();
      /* display: post and the screen */
      g.fillStyle = 'rgba(125,12,61,.35)'; g.fillRect(150, -470, 12, 122);
      rr(g, 34, -592, 272, 108, 10); g.fillStyle = '#0c1816'; g.fill();
      g.fillStyle = 'rgba(141,255,196,.08)'; for (var y = -588; y < -486; y += 6) g.fillRect(36, y, 268, 2);
      g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(34, -592); g.lineTo(130, -592); g.lineTo(80, -484); g.lineTo(34, -484); g.closePath(); g.fill();
    } });
    wordsOf(D.pBody, rec);
    D.pDrw = piece([-330, -110, 330, 0], function (g) { rr(g, -330, -110, 660, 110, 10); }, function (g) { var gr = g.createLinearGradient(0, -110, 0, 0); gr.addColorStop(0, PINK); gr.addColorStop(1, PINK2); return gr; }, { sy: 10, sx: 4, blur: 14, sc: 'rgba(0,10,10,.45)', edge: 2.6, edgeCol: 'rgba(255,235,245,.85)', extra: function (g) {
      rr(g, -70, -66, 140, 26, 12); g.fillStyle = PINKD; g.fill();
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-326, -106, 652, 5);
    } });
    D.pGap = piece([-316, -40, 316, 0], function (g) { g.beginPath(); g.rect(-316, -40, 632, 40); }, '#2a0f1c', { shadow: false, edge: false, extra: function (g) {
      var r = mulberry(17);
      for (var i = 0; i < 9; i++) { var x = -290 + i * 66 + r() * 10; g.save(); g.translate(x, -14 - r() * 10); g.rotate((r() - .5) * .2); rr(g, 0, 0, 56, 40, 3); g.fillStyle = SAGE; g.fill(); g.strokeStyle = '#e8f2dc'; g.lineWidth = 3; g.stroke(); g.restore(); }
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-316, -40, 632, 8);
    } });
    D.n6 = cardPiece(230, 86, CRM, [['GTA 6', 66, PINK2, 4]], { r: 8 });
    function pdisp(s0, px) { var r0 = []; var pc = piece([-136, -50, 136, 50], function (g) { g.beginPath(); g.rect(-136, -50, 272, 100); }, 'rgba(0,0,0,0)', { shadow: false, grain: 0, edge: false, extra: function (g) { ptxt(g, r0, s0, 0, 2, px, MINT, { st: 'extra-condensed', ls: 2 }); } }); return wordsOf(pc, r0); }
    D.pdA = pdisp('DAY 1 SALES', 50); D.pdB = pdisp('$3.79B', 96);

    rec = [];
    D.gBody = piece([-272, -486, 272, -88], function (g) {
      g.beginPath(); g.roundRect(-262, -366, 524, 280, 12);
      g.roundRect(0, -400, 262, 46, 10);
      g.rect(-150, -392, 40, 40);
      g.roundRect(-262, -486, 250, 112, 10);
    }, function (g) { return greyV(g, -486, -88); }, { sy: 14, sx: 6, blur: 22, sc: 'rgba(0,10,10,.5)', edge: 3, edgeCol: 'rgba(255,255,255,.85)', extra: function (g) {
      g.fillStyle = 'rgba(63,61,76,.18)'; g.fillRect(-262, -120, 524, 34);
      /* nameplate */
      rr(g, -236, -340, 214, 92, 8); g.fillStyle = CRM; g.fill(); rr(g, -228, -332, 198, 76, 6); g.strokeStyle = 'rgba(63,61,76,.35)'; g.lineWidth = 3; g.stroke();
      ptxt(g, rec, 'GTA 5', -129, -292, 62, PINK2, { ls: 4 });
      /* chunky square keys */
      for (var r = 0; r < 3; r++) for (var c = 0; c < 4; c++) key(g, 12 + c * 60, -336 + r * 62, 50, 50, '#f3f1f6', '#8d8b99');
      for (c = 0; c < 3; c++) key(g, -236 + c * 72, -230, 60, 50, '#f3f1f6', '#8d8b99');
      key(g, -236, -168, 204, 44, AMBER, '#a8781e');
      /* slot */
      rr(g, G_SX - G_TW / 2 - 10, G_SY - 6, G_TW + 20, 14, 6); g.fillStyle = '#26242f'; g.fill();
      /* display screen */
      rr(g, -248, -474, 222, 88, 8); g.fillStyle = '#17120a'; g.fill();
      g.fillStyle = 'rgba(255,194,74,.07)'; for (var y = -470; y < -388; y += 6) g.fillRect(-246, y, 218, 2);
    } });
    wordsOf(D.gBody, rec);
    D.gDrw = piece([-272, -90, 272, 0], function (g) { rr(g, -272, -90, 544, 90, 8); }, function (g) { var gr = g.createLinearGradient(0, -90, 0, 0); gr.addColorStop(0, GREYF); gr.addColorStop(1, GREY2); return gr; }, { sy: 8, blur: 12, edge: 2.4, extra: function (g) { rr(g, -60, -56, 120, 22, 10); g.fillStyle = GREYD; g.fill(); } });
    function disp(s) { var r0 = []; var pc = piece([-110, -40, 110, 40], function (g) { g.beginPath(); g.rect(-110, -40, 220, 80); }, 'rgba(0,0,0,0)', { shadow: false, grain: 0, edge: false, extra: function (g) { ptxt(g, r0, s, 0, 2, 56, AMBER, { st: 'extra-condensed', ls: 2 }); } }); return wordsOf(pc, r0); }
    D.g800 = disp('$800M+'); D.g1b = disp('$1B+');
  }
  /* a register drawn at (x, CTOP) in screen space with scale s. o: { drawer 0..1, plate a, tape fn(g) } */
  function pinkReg(g, x, s, o) {
    o = o || {}; var dr = o.drawer || 0;
    g.save(); g.translate(x, CTOP + (o.dy || 0)); g.scale(s, s);
    if (o.tape) o.tape(g, 'back');
    if (dr > 0) put(g, D.pGap, 0, -110 + 36 * dr);
    putW(g, D.pBody, 0, 0);
    if (o.disp) { g.save(); g.globalAlpha *= o.da == null ? 1 : o.da; g.translate(170, -536); g.scale(o.dk || 1, o.dk || 1); putW(g, o.disp, 0, 0); g.restore(); }
    g.save(); g.translate(0, 30 * dr); g.scale(1 + .035 * dr, 1 + .035 * dr); put(g, D.pDrw, 0, 0);
    if (o.plate > 0) { g.globalAlpha *= o.plate; putW(g, D.n6, 170, -55); }
    g.restore();
    if (o.tape) o.tape(g, 'front');
    g.restore();
  }
  function greyReg(g, x, s, o) {
    o = o || {};
    g.save(); g.translate(x, CTOP + (o.dy || 0)); g.scale(s, s);
    putW(g, D.gBody, 0, 0); put(g, D.gDrw, 0, 0);
    if (o.disp) { var dk = o.dk == null ? 1 : o.dk; g.save(); g.translate(-137, -430); g.scale(dk, dk); putW(g, o.disp, 0, 0); g.restore(); }
    if (o.tape) o.tape(g);
    g.restore();
  }

  function band(text, w, px, bg, fg, ls0) { return chipPiece([[text, px, fg, ls0 == null ? 2 : ls0]], w, bg, fg, { lh: px + 8, pad: 20 }); }
  function buildPieces() {
    buildRegisters();
    D.oneday = buildStamp(['IN ONE DAY'], 104, 620, OXI);
    D.est0 = chipPiece([['TAKE-TWO ESTIMATE', 50, INK, 3], ['WORLDWIDE · THRU NOV 19, 2026', 36, '#3b3f5e', 2]], 600, CRM, INK, { lh: 54, pad: 22 });
    D.q = cardPiece(260, 260, INK, [['?', 214, CRM, 6]], { ring: 'rgba(251,245,230,.35)' });
    D.y2013 = datePiece('SEPT', '2013', 250, GREY2);
    D.fine5 = chipPiece([['TAKE-TWO ESTIMATE', 38, INK, 1, 'extra-condensed'], ['EXCL. JAPAN & BRAZIL', 38, '#3b3f5e', 1, 'extra-condensed'], ['2013 DOLLARS', 38, '#3b3f5e', 1, 'extra-condensed']], 360, CRM, INK, { lh: 44, pad: 20 });
    D.days3 = chipPiece([['3 DAYS', 60, CRM, 3]], 200, GREYD, CRM, { lh: 66, pad: 20, ring: 'rgba(255,255,255,.3)' });
    D.day1 = chipPiece([['1 DAY', 60, CRM, 3], ['$3.79B', 76, MINT, 2], ['TAKE-TWO', 36, CRM, 2], ['ESTIMATE', 36, CRM, 2]], 250, PINKD, CRM, { lh: 62, pad: 24, ring: 'rgba(255,220,235,.45)' });
    D.past3 = buildStamp(['PAST $3B'], 110, 232, OXI);
    D.nts = band('NOT TO SCALE', 250, 38, INK, CRM, 2);
    D.quote = chipPiece([['“BIGGEST ENTERTAINMENT', 66, CRM, 2], ['LAUNCH IN HISTORY”', 66, CRM, 2], ['— TAKE-TWO', 44, MUST, 3]], 800, INK, CRM, { lh: 78, pad: 36, ring: 'rgba(231,178,58,.55)' });
    D.yes = band('YES · DAY ONE', 350, 50, CRM, INK, 2); D.no = band('NOT YET', 350, 50, CRM, INK, 2);
  }
  function buildBackdrop() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(23);
    var gr = g.createLinearGradient(0, 0, 0, CTOP); gr.addColorStop(0, TEAL2); gr.addColorStop(.45, TEAL); gr.addColorStop(1, '#0c3d3e'); g.fillStyle = gr; g.fillRect(0, 0, W, CTOP);
    /* cut-paper wall: wide vertical boards with pale cut edges, a chair rail */
    for (var i = 0; i < 8; i++) { var x = i * 150 - 30 + r() * 24, wv = 162; g.fillStyle = 'rgba(' + (12 + r() * 14 | 0) + ',' + (70 + r() * 18 | 0) + ',' + (70 + r() * 16 | 0) + ',.5)'; g.fillRect(x, 0, wv, CTOP); g.fillStyle = 'rgba(200,255,240,.06)'; g.fillRect(x, 0, 2, CTOP); g.fillStyle = 'rgba(0,10,10,.2)'; g.fillRect(x + wv - 6, 0, 6, CTOP); }
    g.fillStyle = 'rgba(0,12,12,.35)'; g.fillRect(0, 880, W, 16); g.fillStyle = 'rgba(200,255,240,.08)'; g.fillRect(0, 880, W, 3);
    for (i = 0; i < 7000; i++) { g.fillStyle = r() < .5 ? 'rgba(180,255,235,' + (.012 + r() * .025).toFixed(3) + ')' : 'rgba(0,10,10,' + (.04 + r() * .07).toFixed(3) + ')'; g.fillRect(r() * W, r() * CTOP, 1 + r() * 2, 1 + r() * 4); }
    /* the counter: cream top, its rounded front edge, the kraft front panel and a kick plate */
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, CTOP - 12, W, 12);
    g.fillStyle = '#f3e6c8'; g.fillRect(0, CTOP - 6, W, 30); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(0, CTOP - 6, W, 5); g.fillStyle = '#d6c094'; g.fillRect(0, CTOP + 18, W, 8);
    var fg = g.createLinearGradient(0, CTOP + 26, 0, H); fg.addColorStop(0, '#b8834b'); fg.addColorStop(1, '#7a4f27'); g.fillStyle = fg; g.fillRect(0, CTOP + 26, W, H - CTOP - 26);
    grainLines(g, 0, CTOP + 30, W, H, 'rgba(60,30,10,.16)', 13, 4);
    for (i = 0; i < 6; i++) { g.fillStyle = 'rgba(60,30,10,.22)'; g.fillRect(i * 190 + 60, CTOP + 26, 4, H); g.fillStyle = 'rgba(255,230,190,.12)'; g.fillRect(i * 190 + 64, CTOP + 26, 2, H); }
    g.globalAlpha = .28; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    var vg = g.createRadialGradient(510, 860, 300, 510, 860, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,10,10,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }
  function buildLamp() {
    D.shade = piece([-74, 0, 74, 70], function (g) { g.beginPath(); g.moveTo(-26, 0); g.lineTo(26, 0); g.lineTo(74, 66); g.quadraticCurveTo(0, 78, -74, 66); g.closePath(); }, function (g) { var gr = g.createLinearGradient(-74, 0, 74, 0); gr.addColorStop(0, '#b8862a'); gr.addColorStop(.4, MUST); gr.addColorStop(1, '#a67520'); return gr; }, { sy: 8, blur: 12, sc: 'rgba(0,10,10,.45)' });
  }
  function buildTextures() { GRAIN = buildGrain(); buildPieces(); buildLamp(); D.bg = buildBackdrop(); }

  /* =====================================================================================================
     THE TAPE
     ===================================================================================================== */
  var ROWS = [], GROWS = [], STUB = []; for (var si = 14; si < 400; si += 30) STUB.push({ s: si, bars: true, a: 30 + 60 * hash(si + 3), b: 20 + 24 * hash(si + 7) });
  /* hook and est (pink register, tape rising; past the cap it rolls back over a curl) */
  function rowsUp(g, Lt, cap, rows, sx, sy, tw, t, curlTop) {
    var vis = Math.min(Lt, cap), y0 = sy - vis;
    if (vis <= 0) return;
    g.save();
    g.fillStyle = 'rgba(0,10,10,.28)'; g.fillRect(sx - tw / 2 + 6, y0 + 8, tw, vis);
    g.beginPath(); g.rect(sx - tw / 2, y0, tw, vis); g.fillStyle = PAPERW; g.fill();
    g.fillStyle = 'rgba(80,60,30,.07)'; g.fillRect(sx + tw / 2 - 14, y0, 14, vis);
    g.save(); g.beginPath(); g.rect(sx - tw / 2, y0 + 2, tw, vis - 2); g.clip();
    rows.forEach(function (r0) {
      var y = sy - Lt + r0.s; if (y < y0 - 40 || y > sy + 40) return;
      if (r0.bars) { g.fillStyle = 'rgba(43,43,58,.55)'; g.fillRect(sx - tw / 2 + 16, y - 6, r0.a, 12); g.fillRect(sx + tw / 2 - 16 - r0.b, y - 6, r0.b, 12); }
      else if (r0.rule) { g.fillStyle = 'rgba(43,43,58,.6)'; for (var x = sx - tw / 2 + 12; x < sx + tw / 2 - 16; x += 16) g.fillRect(x, y - 2, 9, 4); }
      else { var nr = NOREC; NOREC = nr || y < y0 + r0.px * .6 || y > sy - r0.px * .5; txt(g, r0.text, sx, y, { px: r0.px, col: r0.col || PRINT, align: 'center', st: 'extra-condensed', ls: 1.5 }); NOREC = nr; }
    });
    g.restore();
    if (Lt > cap) {
      /* the curl: the tape rolls back over itself; its stripes turn with the feed */
      g.save(); g.translate(sx, y0); var R = 20;
      rr(g, -tw / 2, -R * 1.6, tw, R * 1.7, R * .8); g.fillStyle = '#ece6d6'; g.fill();
      g.save(); rr(g, -tw / 2, -R * 1.6, tw, R * 1.7, R * .8); g.clip();
      var ph = (Lt % 24) / 24; g.fillStyle = 'rgba(43,43,58,.18)'; for (var k = -1; k < 3; k++) g.fillRect(-tw / 2, -R * 1.6 + (k + ph) * 12, tw, 3);
      g.restore(); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(-tw / 2 + 8, -R * 1.3, tw - 16, 3); g.restore();
    } else {
      /* a torn leading edge */
      var jj = jag(61, tw, 3); g.beginPath(); g.moveTo(sx - tw / 2, y0); jj.forEach(function (p) { g.lineTo(sx - tw / 2 + p[0], y0 - 3 + p[1] * .5); }); g.lineTo(sx + tw / 2, y0 + 4); g.closePath(); g.fillStyle = PAPERW; g.fill();
    }
    g.restore();
  }
  /* fast..end: the pour. One path from the slot up, over an arch and down past the counter; drawn up to length Lp */
  var ARCH_R = 80, PW = 150;
  function pourPath(g, yA, yE) { g.beginPath(); g.moveTo(P_SX, P_SY); g.lineTo(P_SX, yA); g.arc(P_SX - ARCH_R, yA, ARCH_R, 0, Math.PI, true); g.lineTo(P_SX - 2 * ARCH_R, yE); }
  function pour(g, Lp, flow, yA, yE) {
    if (Lp <= 0) return;
    var total = (P_SY - yA) + Math.PI * ARCH_R + (yE - yA), len = Math.min(Lp, total);
    g.save(); g.lineCap = 'butt'; g.lineJoin = 'round'; g.lineWidth = PW; g.setLineDash([len, 1e5]);
    g.save(); g.translate(10, 14); pourPath(g, yA, yE); g.strokeStyle = 'rgba(0,10,10,.3)'; g.stroke(); g.restore();
    pourPath(g, yA, yE); g.strokeStyle = PAPERW; g.stroke();
    stripes(g, len - 14, flow, yA, yE);
    g.restore();
  }
  /* printed rows streaming along the drawn part of the path: a hand-built dash pattern, period 50, moving with flow */
  function stripes(g, len, flow, yA, yE) {
    if (len <= 0) return;
    var off = ((flow % 50) + 50) % 50, iv = [], pat = [], pos = 0, p;
    for (p = off - 50; p < len; p += 50) { var a0 = Math.max(0, p), b0 = Math.min(len, p + 16); if (b0 > a0) iv.push([a0, b0]); }
    if (!iv.length) return;
    iv.forEach(function (q, i) { if (i === 0) { if (q[0] > 0) pat.push(0, q[0]); } else pat.push(q[0] - pos); pat.push(q[1] - q[0]); pos = q[1]; });
    pat.push(1e5);
    g.setLineDash(pat); g.lineDashOffset = 0; g.lineWidth = PW - 40; g.strokeStyle = 'rgba(43,43,58,.3)';
    pourPath(g, yA, yE); g.stroke();
  }
  /* the pile of folded tape where the pour lands (screen bottom of the rail) */
  function pile(g, n, x, base) {
    for (var i = 0; i < n; i++) {
      var y = base - i * 22, w = 230 + 30 * hash(i * 3 + 1), dx = (hash(i * 7 + 2) - .5) * 40;
      g.save(); g.translate(x + dx, y); g.rotate((hash(i * 11 + 3) - .5) * .12);
      rr(g, -w / 2, -14, w, 30, 15); g.fillStyle = 'rgba(0,10,10,.25)'; g.fill();
      rr(g, -w / 2, -18, w, 28, 14); g.fillStyle = i % 2 ? PAPERW : '#efe9da'; g.fill();
      g.fillStyle = 'rgba(43,43,58,.25)'; for (var k = -w / 2 + 18; k < w / 2 - 18; k += 40) g.fillRect(k, -8, 18, 4);
      g.restore();
    }
  }

  /* =====================================================================================================
     TIMELINE HELPERS (filled in initTimes)
     ===================================================================================================== */
  var L0 = 104, HOOKV = 55, CAP0 = 150, CAP1 = 284;
  var FEED = [];
  function pinkLt(t) {
    if (t >= T.endIn) { return Math.max(0, L0 - HOOKV * (DUR - t)); }
    if (t >= T.tear) return 22 * eio(seg(t, T.tear + .3, T.tear + .7));
    var tb = Math.min(t, T.p0), L = L0 + HOOKV * tb;
    if (t > T.p0) L += 6 * (t - T.p0);
    FEED.forEach(function (f) { L += f.a * eio(seg(t, f.t, f.t + .24)); });
    return L;
  }
  function capAt(t) { return lerp(CAP0, CAP1, eio(seg(t, T.out1, T.out1 + .5))); }
  var GFEED = [];
  function greyLt(t) { var L = 0; GFEED.forEach(function (f) { L += f.a * eio(seg(t, f.t, f.t + (f.d || .3))); }); return L; }

  /* the pink register's place: centre 1.05 (hook, est, end) or right .58 (ask..rec) */
  var BIGS = 1.1, SMS = .62, SMX = 716, GX = 280, GS = .68;
  function pinkPose(t) {
    var k = eio(seg(t, T.ask, T.ask + .5)), k2 = eio(seg(t, T.gDrop - .5, T.gDrop - .1)), kb = eio(seg(t, T.endIn, T.endIn + .5));
    var m = k * (1 - kb), mv = (k > 0 && k < 1) || (k2 > 0 && k2 < 1) || (kb > 0 && kb < 1);
    return { x: lerp(510, lerp(676, SMX, k2), m), s: lerp(BIGS, lerp(.76, SMS, k2), m), m: mv ? .5 : 0 };
  }
  function drawerAt(t) { var d = 0; (T.drw || []).forEach(function (p) { var u = t - p[0]; if (u >= 0 && u < p[1] + .3) d = Math.max(d, u < .1 ? eo(u / .1) : 1 - eio(seg(u, p[1], p[1] + .3))); }); return d; }

  /* =====================================================================================================
     THE PROP LAYER (screen space, clipped to the rail). Beats in story order; later pieces land on top.
     ===================================================================================================== */
  function lamps(g, t) {
    var nr = NOREC; NOREC = true;
    [[230, 150, 0], [510, 120, 1.7], [790, 160, 3.1]].forEach(function (L) {
      var a = .028 * osc(t, 7, L[2]) + .012 * osc(t, 13, L[2] * 2);
      g.save(); g.translate(L[0], 0); g.rotate(a);
      g.fillStyle = '#1b1410'; g.fillRect(-2, 0, 4, L[1]);
      put(g, D.shade, 0, L[1]);
      var gl = g.createRadialGradient(0, L[1] + 74, 4, 0, L[1] + 74, 60); gl.addColorStop(0, 'rgba(255,240,190,.95)'); gl.addColorStop(.3, 'rgba(255,220,140,.35)'); gl.addColorStop(1, 'rgba(255,220,140,0)');
      g.fillStyle = gl; g.beginPath(); g.ellipse(0, L[1] + 74, 60, 26, 0, 0, TAU); g.fill();
      g.restore();
    });
    NOREC = nr;
  }
  function props(g, t) {
    var k, nr;
    lamps(g, t);
    var pp = pinkPose(t), moving = pp.m > 0 && pp.m < 1;
    var dim = dimA(t);
    /* ---- the grey 2013 register (old .. end) ---- */
    if (t >= T.gDrop - .35 && t < T.endIn + .6) {
      var kg = seg(t, T.gDrop - .3, T.gDrop), fall = (1 - kg * kg) * 1400, go = eio(seg(t, T.endIn, T.endIn + .5));
      nr = NOREC; NOREC = nr || kg < 1 || go > 0;
      g.save(); g.translate(-700 * go, -fall);
      var gd = t >= T.g1b ? D.g1b : t >= T.g800 ? D.g800 : null, gdk = t >= T.g1b ? kn(t, T.g1b, .1) : kn(t, T.g800, .1);
      greyReg(g, GX, GS * kn(t, T.gDrop, .02), { disp: gd, dk: gdk, tape: function (q) { rowsUp(q, greyLt(t), 900, GROWS, G_SX, G_SY, G_TW, t); } });
      g.restore(); NOREC = nr;
    }
    /* ---- ask: the dashed outline of a register to come, with a ? ---- */
    if (t >= T.ask + .2 && t < T.gDrop + .05) {
      var ka = fin(t, T.ask + .25, .2) * (1 - seg(t, T.gDrop - .25, T.gDrop));
      g.save(); g.globalAlpha *= ka; g.setLineDash([16, 12]); g.strokeStyle = 'rgba(251,245,230,.75)'; g.lineWidth = 4;
      g.beginPath(); g.rect(GX - 272 * GS, CTOP - 366 * GS, 544 * GS, 366 * GS); g.rect(GX - 262 * GS, CTOP - 486 * GS, 250 * GS, 112 * GS); g.stroke(); g.setLineDash([]);
      /* an empty GTA 5 receipt stub prints into the slot */
      g.save(); g.translate(GX, CTOP); g.scale(GS, GS); g.fillStyle = 'rgba(251,245,230,.5)'; g.fillRect(G_SX - G_TW / 2 - 10, G_SY - 6, G_TW + 20, 12);
      var nrs = NOREC; NOREC = true; rowsUp(g, 30 + 110 * eio(seg(t, T.ask + .7, T.ask + 1.5)) + 14 * Math.max(0, t - T.ask - 1.5), 900, STUB, G_SX, G_SY, G_TW, t); NOREC = nrs; g.restore();
      g.restore();
    }
    g.save(); var kq = kn(t, GT.q || 1e9, .06); g.translate(GX, CTOP - 560); g.scale(kq, kq); g.translate(-GX, -(CTOP - 560)); slapOn(g, D.q, GX, CTOP - 560, .04, T.q, T.gDrop - .3, t); g.restore();
    stampOnP(g, D.y2013, 232, 720, -.04, T.y13, T.slowIn, t);
    /* ---- the pink register ---- */
    nr = NOREC; NOREC = nr || moving;
    var pr = pp;
    g.save();
    if (dim > 0) g.globalAlpha *= 1 - .45 * dim;
    var dsw = T.ask + .3, dB = t >= dsw && t < T.endIn + .35, fl = Math.sin(TAU * 5 * t / DUR + .7) > .994 ? .4 : 1;
    pinkReg(g, pr.x, pr.s, { disp: dB ? D.pdB : D.pdA, dk: dB ? kn(t, dsw, .12) : kn(t, T.endIn + .35, .12), da: fl, drawer: drawerAt(t), plate: fin(t, T.ask + .4, .2) * (1 - seg(t, T.endIn, T.endIn + .2)), tape: function (q, layer) { pinkTape(q, t, layer); } });
    g.restore();
    NOREC = nr;
    loops(g, t);
    /* the torn est receipt flies off (ask) */
    if (t >= T.tear && t < T.tear + .6) {
      var kt = eio(seg(t, T.tear, T.tear + .55)), Lf = pinkLt(T.tear - .001);
      nr = NOREC; NOREC = true;
      g.save(); g.translate(510 + 260 * kt, CTOP - 1500 * kt); g.rotate(.5 * kt); g.scale(BIGS, BIGS);
      rowsUp(g, Lf, CAP1, ROWS, P_SX, P_SY, P_TW, t);
      g.restore(); NOREC = nr;
    }
    /* ---- hook: IN ONE DAY stamp; TAKE-TWO ESTIMATE chip (hook, est) ---- */
    stampOnP(g, D.oneday, 510, 1050, -.06, T.oneday, T.out1, t);
    if (t < T.ask + .5) { slapOn(g, D.est0, 510, 1360, .01, T.est0, T.ask, t); if (t >= T.hl && t < T.ask) hilite(g, 290, 1314, 742, 1356, eo(seg(t, T.hl, T.hl + .35))); }
    /* ---- old: fine print under the grey register ---- */
    if (t < T.endIn + .5) slapOn(g, D.fine5, GX - 8, 1352, -.01, T.fine5, T.endIn, t);
    slapOn(g, D.days3, 196, 664, -.05, T.days3, T.quote, t);
    /* ---- fast: the GTA 6 receipt chip; PAST $3B ---- */
    slapOn(g, D.day1, 790, 712, .03, T.day1, T.endIn, t);
    stampOnP(g, D.past3, 770, 1334, -.07, T.past3, T.endIn, t);
    slapOn(g, D.nts, 548, 1200, -.06, T.nts, T.endIn, t);
    /* ---- rec: the quote plate ---- */
    slapOn(g, D.quote, 510, 452, -.012, T.quote, T.endIn - .05, t, { tape: true });
    /* ---- end: equal chips; they peel off before the loop ---- */
    slapOn(g, D.yes, 296, 1368, -.02, T.vote, T.seamL, t, { od: .24 });
    slapOn(g, D.no, 724, 1368, .02, T.vote + .07, T.seamL, t, { od: .24 });
    /* ---- the hook type (frame 0; drops back for the loop) ---- */
    if (t < T.out1 + .6) { var ty = -700 * eio(seg(t, T.out1, T.out1 + .45)); hookType(g, ty, t > T.out1); }
    if (t >= DUR - .32) { k = seg(t, DUR - .3, DUR - .04); hookType(g, -700 * (1 - k * k), k < 1); }
  }
  /* the pink register's tape, in the register's local coordinates */
  function pinkTape(g, t, layer) {
    if (layer === 'back') return;
    if (t < T.pour) { rowsUp(g, pinkLt(t), t < T.tear ? capAt(t) : CAP0, ROWS, P_SX, P_SY, P_TW, t); return; }
    if (t < T.endIn + .6) {
      /* the pour: shoots up out of the slot, folds over the top, runs down the counter front (the loops are drawn in screen space) */
      var u = t - T.pour, yA = -(CTOP - 640) / SMS, yE = (1336 - CTOP) / SMS;
      var total = (P_SY - yA) + Math.PI * ARCH_R + (yE - yA), Lp = total * eo(seg(u, 0, .8)), flow = 1100 * Math.min(u, 1.1) + 60 * Math.max(0, u - 1.1);
      var drop = eio(seg(t, T.endIn, T.endIn + .45));
      g.save(); g.translate(0, 1400 * drop / SMS);
      pour(g, Lp, flow, yA, yE);
      g.restore();
      if (t >= T.endIn) rowsUp(g, pinkLt(t), CAP0, ROWS, P_SX, P_SY, P_TW, t);
      return;
    }
    rowsUp(g, pinkLt(t), CAP0, ROWS, P_SX, P_SY, P_TW, t);
  }
  var LOOPS = [[548, 1384], [594, 1378], [640, 1386], [686, 1380], [732, 1386], [778, 1379], [822, 1385], [858, 1380], [572, 1346], [652, 1342], [732, 1346], [810, 1342]];
  function loops(g, t) {
    if (t < T.pour + .5 || t > T.endIn + .6) return;
    var drop = eio(seg(t, T.endIn, T.endIn + .45)), nr = NOREC; NOREC = true;
    g.save(); g.translate(0, 900 * drop);
    LOOPS.forEach(function (L, i) {
      var tl = T.pour + .62 + i * .045; if (t < tl - .12) return; var k = cd(t, tl - .12, 18);
      g.save(); g.translate(L[0], L[1] - 50 * (1 - k)); g.rotate((hash(i * 5 + 1) - .5) * .5); g.globalAlpha *= clamp(k * 3, 0, 1);
      g.beginPath(); g.ellipse(0, 0, 50, 24, 0, 0, TAU); g.lineWidth = 28;
      g.save(); g.translate(4, 6); g.strokeStyle = 'rgba(0,10,10,.28)'; g.stroke(); g.restore();
      g.strokeStyle = i % 2 ? PAPERW : '#f1ebdc'; g.stroke();
      g.setLineDash([8, 14]); g.lineWidth = 16; g.strokeStyle = 'rgba(43,43,58,.28)'; g.stroke(); g.setLineDash([]);
      g.restore();
    });
    g.restore(); NOREC = nr;
  }
  function dimA(t) { return seg(t, T.slowIn, T.slowIn + .3) * (1 - seg(t, T.pour - .1, T.pour + .15)); }
  function stampOnP(g, pc, x, y, rot, tl, tout, t) { slapOn(g, pc, x, y, rot, tl, tout, t, { from: 1.6 }); }
  /* GTA 6: / $3.79 BILLION in sticker type (the frame-0 words) */
  var HT = null;
  function hookType(g, dy, norec) {
    var nr = NOREC; NOREC = nr || !!norec;
    if (!HT) { var w = stkW('$3.79 BILLION', 150); HT = Math.min(150, Math.floor(150 * 740 / w)); }
    g.save(); g.translate(0, dy);
    stk(g, 'GTA 6:', 510, 372, 124, { col: PINK, st: 'condensed', ls: 4 });
    stk(g, '$3.79 BILLION', 510, 500, HT, { col: CRM, st: 'condensed', ls: 2 });
    g.restore(); NOREC = nr;
  }

  /* ---------- captions: cream label tape in the upper third, phrase by phrase (the hook's words are the frame-0 props) ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1, was: 1, will: 1, most: 1, his: 1, is: 1, her: 1, new: 1, from: 1, as: 1, can: 1, over: 1 };
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
  function capHidden(t) { return t >= T.quote - .05 && t < T.endIn; }
  function captions(g, t) {
    t = tq(t); if (capHidden(t)) return;
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0) return;
    if (card0.id === 'rec') return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s : T.capEnd, end = Math.min(card0.t1 + .55, ns, card0.id === 'fast' ? T.quote - .06 : 1e9, T.capEnd);
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
      g.save(); g.shadowColor = 'rgba(0,10,10,.55)'; g.shadowBlur = 10; g.shadowOffsetX = 3; g.shadowOffsetY = 6; g.fillStyle = TAPE; g.fill(); g.restore();
      g.save(); g.clip(); g.globalAlpha *= .45; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(x0 - 8, yt - 4, x1 - x0 + 16, yb - yt + 8); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .25;
        if (cur) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#ffd84a'; g.fillRect(x - 6, y - cpx * .78, ws[i] + 12, cpx * .98); g.restore(); }
        var isG = /^GTA\??$/.test(up[i]) || (/^[56]\.?,?$/.test(up[i]) && i > 0 && up[i - 1] === 'GTA');
        g.fillStyle = isG ? '#d81b6a' : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }

  var NOISE, POSTERMODE = false;
  var STAGEC = '#08302f';
  function stage(g) { g.fillStyle = STAGEC; g.fillRect(0, 0, W, H); }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  /* the hook and the end sit slightly pushed in (1.04); a 1.05 punch-in on the pour; never over 1.1 together */
  function push(t) { if (t < 3.4) return 1 + .04 * (1 - eio(seg(t, 0, 3.4))); if (t >= T.endIn) return 1 + .04 * eio(seg(t, T.endIn + .5, DUR)); return 1; }
  function punch(t) { return 1 + 0 * eio(seg(t, T.pour, T.pour + .9)) * (1 - eio(seg(t, T.quote - .3, T.quote + .3))); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) {
      g.drawImage(D.bg, 0, 0);
      /* warm lamp light drifts on the wall and the counter (periodic in DUR, so the loop is exact) */
      var lx = 510 + 110 * osc(t, 3, .4), ly = 900 + 70 * osc(t, 2, 1.3), gl = g.createRadialGradient(lx, ly, 60, lx, ly, 780);
      gl.addColorStop(0, 'rgba(255,214,150,.16)'); gl.addColorStop(.6, 'rgba(255,120,170,.05)'); gl.addColorStop(1, 'rgba(255,120,170,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
      var dm = dimA(t); if (dm > 0) { g.fillStyle = 'rgba(0,14,14,' + (.35 * dm).toFixed(3) + ')'; g.fillRect(0, 0, W, H); }
    }
    var ddx = 4 * osc(t, 17, .3) + 2 * osc(t, 29, 1.1), ddy = 3 * osc(t, 13, 2.1) + 2 * osc(t, 31, .7), ps = push(t) * punch(t);
    g.save(); railClip(g); g.translate(510 + ddx, 960 + ddy); g.scale(ps, ps); g.translate(-510, -960);
    props(g, t); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('big', 'GTA 6: $3.79 BILLION', 0, T.out1); Tx('big', 'GTA 6: $3.79 BILLION', DUR - .1, DUR + 1);
    Tx('dispA', 'DAY 1 SALES', 0, T.ask + .3); Tx('dispA', 'DAY 1 SALES', T.endIn + .45, DUR + 1); Tx('dispB', '$3.79B', T.ask + .4, T.endIn + .35); Tx('nts', 'NOT TO SCALE', T.nts + .1, T.endIn);
    Tx('oneday', 'IN ONE DAY', T.oneday + .1, T.out1);
    Tx('est0a', 'TAKE-TWO ESTIMATE', T.est0 + .1, T.ask); Tx('est0b', 'WORLDWIDE · THRU NOV 19, 2026', T.est0 + .1, T.ask);
    ROWS.forEach(function (r0, i) { if (r0.text) Tx('row' + i, r0.text, r0.tp + .25, T.tear); });
    Tx('q', '?', T.q + .1, T.gDrop - .3);
    Tx('n6', 'GTA 6', T.ask + .6, T.endIn);
    Tx('y13', 'SEPT 2013', T.y13 + .1, T.slowIn);
    Tx('g5', 'GTA 5', T.gDrop + .1, T.endIn);
    Tx('g800', '$800M+', T.g800 + .1, T.g1b); Tx('g1b', '$1B+', T.g1b + .1, T.endIn);
    GROWS.forEach(function (r0, i) { if (r0.text) Tx('grow' + i, r0.text, r0.tp + .3, T.endIn); });
    Tx('fine1', 'TAKE-TWO ESTIMATE', T.fine5 + .1, T.endIn); Tx('fine2', 'EXCL. JAPAN & BRAZIL', T.fine5 + .1, T.endIn); Tx('fine3', '2013 DOLLARS', T.fine5 + .1, T.endIn);
    Tx('days3', '3 DAYS', T.days3 + .1, T.endIn);
    Tx('day1', '1 DAY $3.79B TAKE-TWO ESTIMATE', T.day1 + .1, T.endIn);
    Tx('past3', 'PAST $3B', T.past3 + .1, T.endIn);
    Tx('quote1', '“BIGGEST ENTERTAINMENT', T.quote + .1, T.endIn - .05); Tx('quote2', 'LAUNCH IN HISTORY”', T.quote + .1, T.endIn - .05); Tx('quote3', '— TAKE-TWO', T.quote + .1, T.endIn - .05);
    Tx('yes', 'YES · DAY ONE', T.vote + .1, T.seamL); Tx('no', 'NOT YET', T.vote + .17, T.seamL);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    /* hook: the register on frame 0 with $3.79B up and the tape already printing; IN ONE DAY stamps with the
       ka-ching and a drawer pop in the breath after "G T A six" (payoff on screen by 2.0 s); the estimate chip
       lands during "billion"; type and stamp lift in the pause before est */
    G('key0', .1, 'tick', .12, .7, { m: .03 });
    T.oneday = G('oneday', wend('hook', '6') + .03, 'pin', .3, 1.3, { m: .03, dur: .09 }); T.oneday = Math.min(T.oneday, 1.1);
    T.est0 = at('hook', 'billion') + .05;
    T.ching0 = G('ching0', lastw('hook') + .1, 'pin', .35, .8, { m: .1 });
    T.drw = [[T.oneday, 1.0]];
    EV.push({ t: T.oneday, type: 'ching', g: 1.3, id: 'ching1' });
    T.out1 = G('out1', T.ching0 + .45, 'swish', .3, .9, { m: .05 });
    /* est: the receipt prints its header as the words land */
    T.p0 = at('est', 'day') - .06;
    var pts = [[at('est', 'day') - .02, 'DAY ONE', 48], [at('est', 'sales') - .02, 'RETAIL', 50], [at('est', 'sales') + .14, 'SALES', 50], [at('est', 'by') + .1, '$3.79B', 56]];
    ROWS.length = 0; FEED.length = 0;
    for (var s = 16; s < L0 + HOOKV * T.p0 - 4; s += 30) ROWS.push({ s: s, bars: true, a: 40 + 70 * hash(s), b: 26 + 26 * hash(s + 9) });
    var Lrun = L0 + HOOKV * T.p0;
    pts.forEach(function (p, i) {
      var a = p[2] + 6; FEED.push({ t: p[0], a: a }); Lrun += a;
      ROWS.push({ s: Lrun - a / 2, text: p[1], px: p[2], tp: p[0], col: i === 3 ? '#0b0b14' : PRINT });
    });
    T.hl = at('est', 'taketwos');
    /* creep compensation: rows were placed on the feed alone; the 10/s creep moves them all up together, which is right */
    G('print1', after('est') - .05, 'print', .4, .9, { dur: .3 });
    /* ask: the receipt tears off, the register slides right, a dashed slot with a ? */
    T.ask = at('ask', 'a') - .02; T.tear = T.ask;
    G('tear', T.ask - .12, 'tear', .08, 1.1, { m: .04 });
    G('q', after('ask') + .02, 'thock', .35, 1.1, { m: .05 }); T.q = at('ask', 'gta') - .02;
    /* old: SEPT 2013 slams; the grey register drops on "GTA 5"; $800M+ on "800"; day 1 prints on "day one" */
    T.y13 = G('y13', at('old', '2013') + .05, 'slap', .3, 1.1, { m: .04 }); T.y13 = at('old', '2013') + .02;
    T.gDrop = G('gdrop', wend('old', '2013') + .1, 'thock', .3, 1.3, { m: .04 }); T.gDrop = Math.min(T.gDrop, at('old', 'gta'));
    T.g800 = at('old', '800') - .02;
    T.fine5 = at('old', 'million') + .1;
    GROWS.length = 0; GFEED.length = 0;
    var gl = 0;
    function gfeed(tt, a, txt0, px, d) { GFEED.push({ t: tt, a: a, d: d }); gl += a; if (txt0 === '-') GROWS.push({ s: gl - a / 2, rule: true }); else if (txt0) GROWS.push({ s: gl - 30, text: txt0, px: px, tp: tt }); }
    gfeed(at('old', 'day') - .02, 70, 'DAY 1', 56); gfeed(at('old', 'one') - .02, 70, '$800M+', 56);
    G('gp1', after('old'), 'print', .4, .8, { dur: .22 });
    /* slow: the pink side dims; DAY 2 (no number: unknown); DAY 3; TOTAL $1B+ with the display on "days" */
    T.slowIn = start('slow') - .15;
    gfeed(at('slow', 'hit') - .02, 34, '-', 0, .25); gfeed(at('slow', 'hit') + .08, 70, 'DAY 2', 56, .3);
    gfeed(at('slow', 'three') - .1, 34, '-', 0, .25); gfeed(at('slow', 'three'), 70, 'DAY 3', 56, .3);
    gfeed(at('slow', 'days') - .02, 76, 'TOTAL $1B+', 56, .3);
    T.days3 = G('days3', after('slow') - .05, 'stamp', .35, 1.1, { m: .05 }); T.g1b = T.days3;
    EV.push({ t: T.g800, type: 'slap', g: .9, id: 'g800' });
    EV.push({ t: at('slow', 'hit') + .08, type: 'print', g: .7, dur: .14, id: 'pd2' }); EV.push({ t: at('slow', 'three'), type: 'print', g: .7, dur: .14, id: 'pd3' });
    /* fast: the pink tape pours, pre-rolled into the pause before the line, with the ka-ching and a drawer pop */
    T.pour = G('pour', start('fast') - .25, 'tear', .35, 1, { m: .04 });
    T.drw.push([T.pour, 1.0]);
    EV.push({ t: T.pour + .04, type: 'pour', g: .6, dur: 1.15, id: 'chatter' });
    T.nts = T.pour + 1.3;
    T.day1 = at('fast', 'single') - .02;
    T.past3 = G('past3', after('fast') + .02, 'stamp', .35, 1.1, { m: .05 });
    EV.push({ t: T.past3, type: 'ching', g: 1.1, id: 'ching6' });
    /* rec: the quote plate drops (captions off; the plate is the line) */
    T.quote = G('quote', start('rec') - .4, 'slap', .3, 1.2, { m: .04 }); T.quote = Math.min(T.quote, start('rec') - .3);
    /* end: everything drops away; the pink register returns to the frame-0 place; YES / NOT YET (equal) */
    T.endIn = G('endIn', after('rec') - .05, 'tear', .3, 1, { m: .04 });
    G('chips', wend('end', 'it') + .12, 'pin', .45, .9, { m: .03 });
    T.vote = T.endIn + .03;
    T.seamL = DUR - .31; T.capEnd = DUR - .34;
    G('seam', DUR - .06, 'thock', .25, .8);
    STRESS = [['est', 'day'], ['est', 'estimate'], ['ask', 'lot'], ['old', '2013'], ['old', '800'], ['slow', 'billion'], ['slow', 'three'], ['fast', 'three'], ['fast', 'single'], ['end', 'buy'], ['end', 'day']].map(function (p) { return at(p[0], p[1]); });
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

  BODY.thunk = .16; BODY.thock = .12; BODY.stamp = .2; BODY.slap = .1; BODY.pin = .1; BODY.tick = .05; BODY.swish = .22; BODY.ching = .18; BODY.print = .22; BODY.tear = .14; BODY.pour = .3;
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
    function tear(t, g) { nband(t, t + .16, 1600, 4800, .3 * g, .05 * g, .8); for (var j = 0; j < 6; j++) tick(t + j * .02, (1 - j * .1) * g, 2600 + j * 200); }
    function swish(t, g) { nband(t, t + .2, 900, 3600, .2 * g, .03 * g, .8); }
    var LEVEL = { stamp: 1, ching: 2.4, thock: 5, slap: 3, pin: 4, tick: 6, print: 4, tear: 3, pour: 3, swish: 3 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = window.SFX_TYPE_DB || { stamp: -12, ching: -12, thock: -18, slap: -14, pin: -14, tick: -18, print: -18, tear: -15, pour: -20, swish: -16 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'stamp') stamp(e.t, g);
      else if (e.type === 'ching') ching(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'pin') pin(e.t, g);
      else if (e.type === 'tick') keyT(e.t, g);
      else if (e.type === 'print') printer(e.t, g, e.dur);
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
      buildTextures(); EV.length = 0; initTimes();
      window.FILM.POSTER = Math.round((T.past3 + .5) * 30) / 30 + 1 / 60;
      window.FILM.SHOTS = [{ id: 'hook', name: '$3.79B', t0: 0, t1: start('ask') }, { id: 'ask', name: 'GTA 5', t0: start('ask'), t1: start('fast') }, { id: 'fast', name: 'One day', t0: start('fast'), t1: start('rec') }, { id: 'rec', name: 'Record', t0: start('rec'), t1: start('end') }, { id: 'end', name: 'Day one?', t0: start('end'), t1: DUR }];
      window.READY = true;
    });
  }

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-daysales', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
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
