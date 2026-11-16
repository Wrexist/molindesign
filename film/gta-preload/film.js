/* "GTA 6 Needs Up To 212 GB": Delta, pillar 6 (practical and launch week).
   A vertical film written in code, narrated first and cut to the voice: every beat is keyed to a word time from
   vo/vo.js with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the storage bar: a cardboard tube of grey "other games" blocks with a teal free gap, and one pink
   paper brick printed 212 GB that tries to fit it. Facts: Rockstar Newswire (Nov 3 2026) and PlayStation's GTA VI
   support page (BRIEF.md). Engine from film/gta-secrets (paper pieces, VAD gate, env() click fix, fontStretch, captions).
   Our own drawings only: no footage, logos, key art or box art; no music. */
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
    free(m || (window.VAD ? .08 : .2)).forEach(function (f) {
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

  BODY.scrape = .4; BODY.ting = .22; BODY.crack = .25; BODY.whoosh = .45; BODY.brush = .34; BODY.flap = .14; BODY.pop = .1; BODY.thock = .12; BODY.swish = .26; BODY.clank = .3;
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

  /* =====================================================================================================
     THE WORLDS. Each secret is its own full-bleed paper world (bg layer: bleeds to the frame edge; fg layer: props,
     clipped to the x 90-930 rail). A silver foil sheet printed SECRET n drops over the old world, a coin scrapes it
     off in three zigzag strokes and the new world is under it. Every secret drawn here is our own drawing.
     ===================================================================================================== */

  /* =====================================================================================================
     THE SET. One paper brick printed 212 GB and one cardboard storage bar stay in every scene (the native move).
     The bar: grey "other games" blocks and a teal free gap. Background: a cut-paper Vice City dusk that bleeds
     to the frame edge; every prop is clipped to the x 90-930 rail.
     ===================================================================================================== */
  var GREY = '#8d8aa0', GREY2 = '#6f6c84', DEEP = '#2a1850', GOLD = '#ffc83d', RED = '#d7262e';
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function sm(t, a, d) { return eio(seg(t, a, a + (d || .5))); }
  var T = {}, LIVE2 = { bg: true, clip: true };
  function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
  function wordsOf(pc, rec) { pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; }); return pc; }
  BODY.thud = .2; BODY.slide = .3; BODY.ratchet = .4; BODY.rattle = .35; BODY.flap = .16; BODY.stamp = .27; BODY.thock = .12; BODY.pop = .1; BODY.swish = .26; BODY.clank = .3; BODY.peel = .2;

  /* ---------- the bar: outer x 110-900, y 1200-1400; inner x 126-884 ---------- */
  var BAR = { x0: 110, x1: 900, y0: 1200, y1: 1400, ix0: 126, ix1: 884, iy0: 1216, iy1: 1384 };
  var BLK = [150, 110, 130, 90, 80], POPPED = { 1: 0, 3: 1 }, BGAP = 6;
  /* brick: base face 760 x 420; at bar scale it is 150 tall */
  var BW = 760, BH = 420, BS = 150 / BH;
  /* how hard the big brick pushes its nose into the gap (the grey blocks squeeze left) */
  function press(t) {
    if (t < T.c0) return 1 - seg(t, -.35, -.12);
    if (t < T.bb) return cd(t, T.c0, 25);
    if (t < T.rej) return 1 - sm(t, T.bb, .14);
    if (t < T.fit0) return cd(t, T.rej, 25);
    if (t < T.E0) return 1 - sm(t, T.fit0, .35);
    return 1;
  }
  function squeeze(t) { return press(t) + .7 * bump(t, T.c0, .3) + .6 * bump(t, T.rej, .3) + .6 * bump(t, T.nudge, .35); }
  function blockLayout(t) {
    /* x of each block: full layout (squeezed by the brick), or (room) the popped ones fly out and the rest slide left */
    var out = [], x = BAR.ix0, rk = sm(t, T.reflow, .45), x2 = BAR.ix0, room = t >= T.room0 && t < T.E0, q = room ? 0 : .045 * squeeze(t);
    BLK.forEach(function (w, i) {
      var full = x; x += w + BGAP;
      var popped = POPPED[i] != null, after = x2; if (!popped) x2 += w + BGAP;
      var o = { i: i, w: w, x: BAR.ix0 + (full - BAR.ix0) * (1 - q), sx: 1 - q, y: 0, rot: 0, a: 1 };
      if (room) {
        if (popped) { var tp = T.pops[POPPED[i]], u = t - tp; if (u > 0) { var fu = eo(seg(u, 0, .9)); o.y = -330 * fu + 20 * Math.sin(u * 3); o.x += (i === 1 ? -70 : 230) * fu; o.rot = (i === 1 ? -.5 : .45) * fu + .05 * Math.sin(u * 4); o.sc = 1 + .3 * fu; o.a = 1 - seg(u, .75, 1.0); } }
        else o.x = lerp(full, after, rk);
      }
      out.push(o);
    });
    return out;
  }
  function gapX(t) { var L = blockLayout(t), e = BAR.ix0, room = t >= T.room0 && t < T.E0; L.forEach(function (o) { if (POPPED[o.i] == null || !room) e = Math.max(e, o.x + o.w * o.sx); }); return e + BGAP; }
  function drawBar(g, t) {
    var bk = 1 + .012 * bump(t, T.c0, .3) + .012 * bump(t, T.rej, .3) + .02 * bump(t, T.jam, .25) + .02 * bump(t, T.jam2, .25);
    g.save(); g.translate(505, 1300); g.scale(bk, 1 / bk); g.translate(-505, -1300);
    put(g, P.bar, 0, 0);
    /* the free gap: teal paper; flashes pink when something jams it, bright teal when the brick bounces off */
    var gx = gapX(t), fl = clamp(bump(t, T.c0, .45) + bump(t, T.rej, .4) + bump(t, T.jam, .4) + bump(t, T.nudge, .4), 0, 1), ft = bump(t, T.bb, .6);
    var pulse = t >= T.free && t < T.sw1 ? .5 + .5 * Math.sin((t - T.free) * 9) : t >= T.yours && t < T.W5 ? (.5 + .5 * Math.sin((t - T.yours) * 9)) * (1 - seg(t, T.yours + 1.1, T.yours + 1.5)) : 0;
    g.fillStyle = fl > .02 ? mixc('#19d3c5', '#ff4fa3', fl) : ft > .02 ? mixc('#19d3c5', '#b8fff8', ft) : TEAL; g.globalAlpha = .85 + .15 * ft; g.fillRect(gx, BAR.iy0, BAR.ix1 - gx, BAR.iy1 - BAR.iy0); g.globalAlpha = 1;
    if (pulse > 0) { g.strokeStyle = CREAM; g.lineWidth = 8 + 6 * pulse; g.strokeRect(gx + 4, BAR.iy0 + 4, BAR.ix1 - gx - 8, BAR.iy1 - BAR.iy0 - 8); }
    g.fillStyle = 'rgba(255,255,255,.18)'; for (var s = gx + 14; s < BAR.ix1 - 10; s += 26) g.fillRect(s, BAR.iy0, 8, BAR.iy1 - BAR.iy0);
    var rat = 9 * bump(t, T.ul, .5) + 4 * bump(t, T.rej, .3);
    blockLayout(t).forEach(function (o) {
      if (o.a <= 0) return; var jig = 2 * osc(t, 11 + o.i * 2, o.i) + rat * Math.sin(t * 70 + o.i * 2.1);
      g.save(); g.globalAlpha *= o.a; g.translate(o.x + o.w * o.sx / 2, (BAR.iy0 + BAR.iy1) / 2 + o.y + jig); g.rotate(o.rot + rat * .004 * Math.sin(t * 50 + o.i)); g.scale(o.sx * (o.sc || 1), o.sc || 1); put(g, P.blk[o.i], 0, 0); g.restore();
    });
    g.restore();
  }
  /* "FREE" in the gap, only while the gap is the subject (fit, check) */
  function freeLabel(g, t) {
    if (t < T.freeIn - .02 || t >= T.sw1) return;
    var gx = gapX(t), a = fin(t, T.freeIn, .12) * (1 - seg(t, T.sw1 - .25, T.sw1)), nr = NOREC; NOREC = nr || t < T.freeIn + .15 || t > T.sw1 - .25;
    txt(g, 'FREE', (gx + BAR.ix1) / 2, 1330, { px: 44, col: INK, align: 'center', a: a, wt: 900 }); NOREC = nr;
  }

  /* ---------- the brick ---------- */
  /* frame 0: big (722 px), tilted, its nose already shoved into the gap; it hops in from the upper right across the loop seam */
  var J0 = { x: 498, y: 1012, s: .95, rot: .1 };
  function frame0Brick(t) {
    var p = press(t), x = J0.x - 14 * p, y = J0.y + 3 * p, rot = J0.rot, s = J0.s;
    if (t < T.c0) { var h = Math.sin(Math.PI * seg(t, -.35, T.c0)); x += 22 * h; y -= 70 * h; rot -= .04 * h; }
    else if (t >= T.bb && t < T.rej) { var kb = cd(t, T.bb, 9) * (1 - eio(seg(t, T.rej - .26, T.rej))); x += 12 * kb; y -= 80 * kb + 7 * Math.sin((t - T.bb) * 5) * kb; rot -= .05 * kb; }
    if (t >= T.E0) x -= 10 * bump(t, T.nudge, .35);
    return { x: x, y: y + 3 * osc(t, 5, 1), s: s * kn(t, T.k212, .04), rot: rot + .004 * osc(t, 6, 2) };
  }
  var JAM = { x: 766, y: BAR.y0 - BH * BS / 2 + 14, s: BS, rot: .1 };
  function brickState(t) {
    var c = { a: 1, prog: 0, upto: 1 };
    if (t >= T.E0 || t < T.fit0) {
      var f = frame0Brick(t); c.x = f.x; c.y = f.y; c.s = f.s; c.rot = f.rot;
      c.prog = t >= 0 && t < T.fit0 ? .34 * sm(t, T.arrLand, 1.2) : 0;
      return c;
    }
    if (t < T.sw1) {
      var h0 = frame0Brick(T.fit0 - 1e-4), k = sm(t, T.fit0, .55), arc = Math.sin(Math.PI * k) * -120;
      c.x = lerp(h0.x, JAM.x, k); c.y = lerp(h0.y, JAM.y, k) + arc; c.s = lerp(h0.s, JAM.s, k); c.rot = lerp(h0.rot, JAM.rot, k) + sw(t, T.jam, .05, 22, 6);
      c.x += -10 * bump(t, T.jam, .2); c.prog = .34; c.upto = 1 - seg(k, 0, .4);
      return c;
    }
    if (t < T.drop2) return null;
    /* all: drops out of the download code onto the gap, still too wide */
    var k2 = cd(t, T.drop2, 11), sc = lerp(.12, JAM.s, sm(t, T.drop2, .3));
    c.x = lerp(T.SLIPX, JAM.x, k2); c.y = lerp(T.SLIPY, JAM.y, k2); c.s = sc; c.rot = JAM.rot * k2 + sw(t, T.jam2, .05, 22, 6); c.upto = 0; c.prog = 1;
    if (t >= T.slideIn) {
      var k3 = sm(t, T.slideIn, .55), gx = BAR.ix0 + 378 + BGAP, FIT = { x: gx + BW * BS / 2 + 2, y: (BAR.iy0 + BAR.iy1) / 2 };
      c.x = lerp(JAM.x, FIT.x, k3); c.y = lerp(JAM.y, FIT.y, k3) - 60 * Math.sin(Math.PI * k3); c.rot = lerp(JAM.rot, 0, k3);
    }
    return c;
  }
  function drawBrick(g, t) {
    var c = brickState(t); if (!c || c.a <= 0) return;
    var nr = NOREC;
    g.save(); g.translate(c.x, c.y); g.rotate(c.rot); g.scale(c.s, c.s);
    put(g, P.brick, 0, 0);
    /* the download stripe along the bottom */
    if (c.prog > 0) { g.fillStyle = TEAL; g.fillRect(-BW / 2 + 22, BH / 2 - 62, (BW - 44) * c.prog, 40); g.fillStyle = 'rgba(255,255,255,.35)'; for (var s = -BW / 2 + 30; s < -BW / 2 + 22 + (BW - 44) * c.prog - 10; s += 30) g.fillRect(s, BH / 2 - 62, 10, 40); }
    NOREC = nr || c.s < .5 || Math.abs(c.rot) > .06;
    if (c.upto > 0) { g.save(); g.globalAlpha *= c.upto; stk(g, 'UP TO', 0, -140, 76, { col: INK, lw: 0, shadow: false }); g.restore(); }
    stk(g, '212 GB', 0, 18, 236, { col: CREAM, lw: 20 });
    /* 2.4 s: a cream underline swipes under the number */
    if (t >= T.ul && t < T.fit0 + .3) { var uk = sm(t, T.ul, .3), uo = seg(t, T.fit0, T.fit0 + .3); g.fillStyle = CREAM; g.globalAlpha *= 1 - uo; g.fillRect(-300, 116, 600 * uk, 14); }
    NOREC = nr; g.restore();
  }

  /* ---------- hook: the GTA 6 pill slams in under the spoken "G T A six" ---------- */
  function pill(g, t) {
    if (t < T.pill - .01 || t > T.pillOut + .35) return;
    var k = eo(seg(t, T.pill, T.pill + .14)), o = sm(t, T.pillOut, .3), s = (lerp(1.6, 1, k) - .08 * Math.sin(Math.PI * seg(t, T.pill + .12, T.pill + .3))) * (1 - .3 * o);
    var nr = NOREC; NOREC = nr || k < 1 || o > 0;
    chip(g, 'GTA 6', 510, 600 - 90 * o, { px: 110, bg: HOT, fg: CREAM, a: fin(t, T.pill, .05) * (1 - o), rot: -.03 * (1 + 3 * (1 - k)) + .008 * osc(t, 7, 1), s: s });
    NOREC = nr;
  }

  /* ---------- open: the paper download arrow rides the brick's stripe; the credit chip ---------- */
  function drawArrow(g, x, y, s, a, rot) {
    if (a <= 0) return; g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot || 0); g.scale(s, s); put(g, P.arrow, 0, 0); g.restore();
  }
  function openBeat(g, t) {
    chipIn(g, t, 'PRE-LOAD · ROCKSTAR', 510, 640, T.cred, T.credOut, { bg: CREAM, px: 44, rot: -.02, from: 30 });
  }
  function rideArrow(g, t) {
    if (t < T.arr0 - .02 || t > T.fit0 + .35) return;
    var c = brickState(t); if (!c) return;
    var k = cd(t, T.arr0, 12), o = sm(t, T.fit0 - .15, .3);
    g.save(); g.translate(c.x, c.y); g.rotate(c.rot); g.scale(c.s, c.s);
    var lx = -BW / 2 + 22 + (BW - 44) * Math.max(c.prog, .02), ly = BH / 2 - 42 - 34 + 10 * Math.sin((t - T.arr0) * 7) * seg(t, T.arrLand, T.arrLand + .2);
    drawArrow(g, lx, lerp(-BH / 2 - 260, ly, k), .36, fin(t, T.arr0, .08) * (1 - o), 0);
    g.restore();
  }

  /* ---------- check: the re-created storage screen (our drawing, not a screenshot); its usage bar rhymes the hero bar ---------- */
  function checkBeat(g, t) {
    if (t < T.card0 - .02 || t >= T.sw1) return;
    var k = cd(t, T.card0, 11), nr = NOREC, pulse = t >= T.free ? .5 + .5 * Math.sin((t - T.free) * 9) : 0;
    g.save(); g.translate(510, lerp(-300, 790, k)); g.rotate(-.02 + (1 - k) * .3 + .005 * osc(t, 7, 2)); NOREC = nr || k < .98;
    putW(g, P.settings, 0, 0);
    if (pulse > 0) { g.strokeStyle = HOT; g.lineWidth = 6 + 5 * pulse; rr(g, 196, -14, 142, 80, 8); g.stroke(); }
    NOREC = nr; g.restore();
  }

  /* ---------- the box: a flat game case that opens on "Inside" onto an empty tray ---------- */
  var CY = 860;
  function caseGroup(t) { var ks = sm(t, T.all0, .5); return { x: lerp(510, 310, ks), y: lerp(CY, 800, ks), s: lerp(1, .62, ks), k: ks }; }
  function scribble(g, x, y, r, k) {
    if (k <= 0) return; var n = 64, end = Math.floor(n * 1.18 * k);
    g.save(); g.strokeStyle = HOT; g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
    for (var i = 0; i <= end; i++) { var a = -2.2 + i / n * TAU, rad = r * (1 + .05 * Math.sin(i * .6) + .06 * i / n); var px = x + Math.cos(a) * rad * 1.06, py = y + Math.sin(a) * rad; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
    g.stroke(); g.restore();
  }
  function drawCase(g, t) {
    if (t < T.box0 - .02 || t >= T.room0 + .5) return;
    var k = cd(t, T.box0, 12), sh = t >= T.bad ? 14 * Math.exp(-(t - T.bad) * 5) * Math.sin((t - T.bad) * 38) : 0, outk = sm(t, T.room0, .45);
    var G0 = caseGroup(t), ko = eio(seg(t, T.lid, T.lid + .4)), xh = lerp(340, 510, ko), c = Math.cos(Math.PI * ko), bs = G0.s * (1 + .05 * bump(t, T.bad, .5));
    var nr = NOREC; NOREC = nr || k < .98 || outk > 0 || (G0.k > 0 && G0.k < 1);
    g.save(); g.globalAlpha *= 1 - outk;
    g.translate(G0.x + sh, G0.y + lerp(-1300, 0, k) + 200 * outk); g.rotate(sh * .004 + .008 * osc(t, 6, 1)); g.scale(bs, bs); g.translate(-510, -CY);
    /* the tray: dark, empty, an empty disc hub */
    if (ko > 0) put(g, P.tray, xh, CY);
    if (t >= T.just && t < T.fly0 + .2) { g.save(); g.globalAlpha *= 1 - seg(t, T.fly0, T.fly0 + .2); scribble(g, xh + 170, CY, 94, sm(t, T.just, .4)); g.restore(); }
    /* NO DISC lands on the empty tray (PS5 page, BRIEF fact 7) and peels off before "Make" */
    if (t >= T.nod - .02 && t < T.peel + .35) {
      var po = sm(t, T.peel, .3);
      g.save(); g.translate(po * 140, -po * 200); g.rotate(po * .4); g.globalAlpha *= 1 - po;
      stampAt(g, t, P.noDisc, xh + 170, CY + 10, T.nod, T.peel + 5, -.12, .85);
      g.restore();
    }
    /* the cover: hinged on the spine; front (our own GTA 6 type) then its inside face as it swings open */
    g.save(); g.translate(xh, CY); g.scale(Math.abs(c) < .02 ? .02 : c, 1); put(g, c >= 0 ? P.caseFront : P.caseIn, 0, 0);
    if (c > .05) { var nr2 = NOREC; NOREC = nr2 || ko > 0; stk(g, 'GTA 6', 170, -50, 130, { col: CREAM, lw: 14 }); NOREC = nr2; }
    g.restore();
    /* the one slip pops up out of the tray */
    if (t >= T.slip0 - .02 && t < T.fly0) {
      var ks = cd(t, T.slip0, 13), nr3 = NOREC; NOREC = nr3 || ks < .98;
      g.save(); g.translate(lerp(xh + 170, 510, ks), lerp(CY, 590, ks)); g.rotate(-.04 * ks + .01 * osc(t, 8, 2)); g.scale(lerp(.4, 1, ks), lerp(.4, 1, ks)); putW(g, P.slip, 0, 0); g.restore();
      NOREC = nr3;
    }
    NOREC = nr; g.restore();
  }
  /* labels for the box beat: who sells it, then (only after that chip is gone) which console the stamp is about */
  function boxLabels(g, t) {
    chipIn(g, t, 'CODE IN BOX · ROCKSTAR', 510, 1150, T.cib, T.cibOut, { bg: ORG, px: 40, rot: -.015, from: 30 });
    chipIn(g, t, 'PS5 · PLAYSTATION.COM', 400, 1150, T.nodC, T.peel, { bg: CREAM, px: 38, rot: .015, from: 30 });
  }
  /* the slip leaves the case and shrinks into the brick's drop point (screen space) */
  function slipFly(g, t) {
    if (t < T.fly0 || t > T.drop2 + .3) return;
    var k = sm(t, T.fly0, .3), G0 = caseGroup(t), x0 = G0.x, y0 = G0.y + (590 - CY) * G0.s, nr = NOREC; NOREC = true;
    g.save(); g.translate(lerp(x0, T.SLIPX, k), lerp(y0, T.SLIPY, k) - 90 * Math.sin(Math.PI * k)); g.rotate(-.04 + .3 * k); var s = lerp(G0.s, .2, k); g.scale(s, s); g.globalAlpha *= 1 - seg(t, T.drop2, T.drop2 + .12); putW(g, P.slip, 0, 0); g.restore();
    NOREC = nr;
  }

  /* ---------- room: the calendar, top left ---------- */
  function roomBeat(g, t) {
    if (t < T.cal - .02 || t >= T.E0) return;
    var k = cd(t, T.cal, 11), nr = NOREC, s = kn(t, T.n19, .05) * .8, CXL = 320, CYL = 770;
    g.save(); g.translate(CXL, lerp(-400, CYL, k)); g.rotate(-.04 + (1 - k) * .2 + .008 * osc(t, 6, 1)); g.scale(s, s); NOREC = nr || k < .98; putW(g, P.cal, 0, 0); NOREC = nr; g.restore();
    if (k > .9) { put(g, P.pin, CXL - 160, CYL - 210); put(g, P.pin, CXL + 160, CYL - 210); }
    chipIn(g, t, 'FITS', 720, 1110, T.fits, T.E0, { bg: TEAL, px: 48, rot: .04, from: 20 });
  }

  /* ---------- end: the frame-0 composition again; YES / NO above the brick, both cream ---------- */
  function endBeat(g, t) {
    if (t < T.E0) return;
    var b = 6 * Math.sin((t - T.yes) * 4);
    chipIn(g, t, 'YES', 390, 640 + b, T.yes, T.ynOut, { bg: CREAM, px: 80, rot: -.04, from: 30 });
    chipIn(g, t, 'NO', 630, 640 - b, T.no, T.ynOut, { bg: CREAM, px: 80, rot: .04, from: 30, ph: 2 });
  }

  /* ---------- background: a cut-paper living-room wall, a generic paper console on a TV bench (shapes only) ---------- */
  var WALL = ['#2a1a4c', '#1d2a4a', '#183a40'];
  function mixc(a, b, k) { var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), r = Math.round(lerp(pa >> 16, pb >> 16, k)), gg = Math.round(lerp(pa >> 8 & 255, pb >> 8 & 255, k)), bb = Math.round(lerp(pa & 255, pb & 255, k)); return 'rgb(' + r + ',' + gg + ',' + bb + ')'; }
  function wallAt(t) {
    if (t >= T.E0 || t < T.sw1 - .1) return WALL[0];
    if (t < T.room0) return mixc(WALL[0], WALL[1], sm(t, T.sw1 - .1, .3));
    return mixc(WALL[1], WALL[2], sm(t, T.room0, .5));
  }
  function bgDraw(g, t) {
    g.fillStyle = wallAt(t); g.fillRect(-300, -300, 1680, 2620);
    /* wallpaper: broad pale stripes, a paper dado rail */
    g.fillStyle = 'rgba(255,240,230,.035)'; for (var x = -40; x < 1140; x += 170) g.fillRect(x, -300, 70, 1420);
    g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(-300, 1086, 1680, 10); g.fillStyle = 'rgba(255,240,230,.08)'; g.fillRect(-300, 1080, 1680, 6);
    /* the console: a pale hand-cut slab; the storage bar sits in its dark face */
    g.fillStyle = 'rgba(6,3,18,.35)'; rr(g, 62, 1134, 976, 336, 40); g.fill();
    g.fillStyle = '#e6dff0'; rr(g, 50, 1120, 980, 336, 40); g.fill();
    g.fillStyle = '#cfc6de'; rr(g, 50, 1404, 980, 52, 20); g.fill();
    g.fillStyle = '#1b1430'; rr(g, 92, 1160, 896, 262, 22); g.fill();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(80, 1130, 920, 5);
    var lt = .55 + .45 * Math.sin(TAU * 6 * t / DUR); g.fillStyle = 'rgba(25,211,197,' + lt.toFixed(3) + ')'; circle(g, 1000, 1432, 7); g.fill();
    /* the TV bench: kraft top, an open cubby with a controller in it, a cable to the console */
    g.fillStyle = '#6b4424'; g.fillRect(-300, 1456, 1680, 24); g.fillStyle = '#9a6a3a'; g.fillRect(-300, 1480, 1680, 640);
    g.fillStyle = '#3a2412'; rr(g, 120, 1540, 840, 300, 14); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(120, 1540, 840, 18);
    g.fillStyle = 'rgba(60,30,10,.3)'; g.fillRect(-300, 1880, 1680, 6);
    g.strokeStyle = '#26203a'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(560, 1700); g.quadraticCurveTo(760 + 30 * osc(t, 2, .5), 1640 + 20 * osc(t, 3, 1), 900, 1456); g.stroke();
    controller(g, 400, 1720, -.06 + .01 * osc(t, 2, 2));
  }
  function controller(g, x, y, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(8, 70, 200, 26, 0, 0, TAU); g.fill();
    g.fillStyle = '#ece6f4'; circle(g, -120, 20, 72); g.fill(); circle(g, 120, 20, 72); g.fill(); rr(g, -150, -60, 300, 120, 50); g.fill();
    g.fillStyle = '#2a2440'; circle(g, -60, 22, 26); g.fill(); circle(g, 60, 22, 26); g.fill();
    g.fillStyle = '#4a4266'; g.fillRect(-142, -12, 40, 13); g.fillRect(-128, -26, 13, 40);
    g.fillStyle = '#4a4266'; [[120, -26], [100, -6], [140, -6], [120, 14]].forEach(function (p) { circle(g, p[0], p[1] - 4, 8); g.fill(); });
    g.restore();
  }

  /* torn page sweeping up: the scene change (covers the old props, uncovers the new) */
  function pageSweep(g, t, tm) {
    var k = seg(t, tm - .27, tm + .27); if (k <= 0 || k >= 1) return;
    var y = lerp(1980, -2150, eio(k)); g.save(); g.translate(-10, y); g.rotate(-.03); g.scale(1, 1.32); put(g, P.sweep, 0, 0); g.restore();
  }

  /* ---------- textures ---------- */
  function buildTextures() {
    GRAIN = buildGrain();
    /* the bar: a cardboard tube with end caps */
    P.bar = piece([BAR.x0, BAR.y0, BAR.x1, BAR.y1], function (g) { rr(g, BAR.x0, BAR.y0, BAR.x1 - BAR.x0, BAR.y1 - BAR.y0, 26); }, '#c9a06a', { sx: 6, sy: 12, blur: 16, extra: function (g) {
      g.fillStyle = '#2b1a3f'; rr(g, BAR.ix0, BAR.iy0, BAR.ix1 - BAR.ix0, BAR.iy1 - BAR.iy0, 12); g.fill();
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(BAR.x0 + 20, BAR.y0 + 4, BAR.x1 - BAR.x0 - 40, 6);
      g.strokeStyle = 'rgba(90,55,20,.35)'; g.lineWidth = 3; for (var x = BAR.x0 + 30; x < BAR.x1; x += 52) { g.beginPath(); g.moveTo(x, BAR.y0 + 2); g.lineTo(x + 10, BAR.iy0 - 2); g.stroke(); }
    } });
    P.blk = BLK.map(function (w, i) { var h = BAR.iy1 - BAR.iy0 - 12; return piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { rr(g, -w / 2, -h / 2, w, h, 8); }, i % 2 ? GREY : GREY2, { sx: 3, sy: 5, blur: 6, extra: function (g) { g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(-w / 2 + 10, -h / 2 + 12, w - 20, 10); g.fillStyle = 'rgba(29,18,51,.22)'; g.fillRect(-w / 2 + 10, -h / 2 + 34, w * .5, 8); g.fillRect(-w / 2 + 10, -h / 2 + 52, w * .35, 8); g.fillStyle = 'rgba(255,250,232,.5)'; g.fillRect(-14, -h / 2 - 2, 28, 34); } }); });
    /* the brick: thick pink paper with a darker cut side */
    P.brick = piece([-BW / 2, -BH / 2, BW / 2 + 26, BH / 2 + 30], function (g) { g.beginPath(); g.moveTo(-BW / 2, -BH / 2); g.lineTo(BW / 2, -BH / 2); g.lineTo(BW / 2 + 26, -BH / 2 + 30); g.lineTo(BW / 2 + 26, BH / 2 + 30); g.lineTo(-BW / 2 + 26, BH / 2 + 30); g.lineTo(-BW / 2, BH / 2); g.closePath(); }, '#b8246f', { sx: 10, sy: 16, blur: 22, extra: function (g) {
      g.fillStyle = HOT; rr(g, -BW / 2, -BH / 2, BW, BH, 14); g.fill();
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-BW / 2 + 16, -BH / 2 + 12, BW - 32, 10);
      g.fillStyle = 'rgba(29,18,51,.28)'; g.fillRect(-BW / 2 + 22, BH / 2 - 62, BW - 44, 40);
      g.strokeStyle = 'rgba(255,247,228,.6)'; g.lineWidth = 3; rr(g, -BW / 2, -BH / 2, BW, BH, 14); g.stroke();
    } });
    P.arrow = piece([-90, -120, 90, 120], function (g) { g.beginPath(); g.moveTo(-46, -120); g.lineTo(46, -120); g.lineTo(46, 0); g.lineTo(90, 0); g.lineTo(0, 120); g.lineTo(-90, 0); g.lineTo(-46, 0); g.closePath(); }, TEAL, { sx: 6, sy: 10, blur: 12 });
    /* re-created storage screen: header band, FREE SPACE over a usage bar (grey games, teal free), credit inside */
    P.settings = cardPiece(760, 480, '#efe5cf', [['SETTINGS  >  STORAGE', 60, CREAM, -186], ['FREE SPACE', 46, INK, -76, null, -190], ['RE-CREATED', 38, '#7a2b5c', 124, null, -200], ['PS5 · PLAYSTATION.COM', 40, INK, 182]], { r: 14, ring: 'rgba(29,18,51,.25)', before: function (g) {
      g.fillStyle = DEEP; rr(g, -380, -240, 760, 116, 14); g.fill(); g.fillRect(-380, -180, 760, 56);
      g.fillStyle = '#2b1a3f'; rr(g, -336, -18, 680, 88, 10); g.fill();
      [[-328, 150, GREY2], [-172, 110, GREY], [-56, 120, GREY2], [70, 120, GREY]].forEach(function (b) { g.fillStyle = b[2]; rr(g, b[0], -10, b[1], 72, 6); g.fill(); });
      g.fillStyle = TEAL; rr(g, 198, -10, 138, 72, 6); g.fill();
      g.fillStyle = 'rgba(29,18,51,.12)'; g.fillRect(-340, 94, 680, 3);
    } });
    /* the game case: our own plain cover (no key art), its inside face, and the empty tray */
    P.caseFront = piece([0, -240, 340, 240], function (g) { rr(g, 0, -240, 340, 480, 10); }, '#2e1a52', { sx: 8, sy: 14, blur: 18, extra: function (g) {
      g.fillStyle = '#20123c'; g.fillRect(0, -240, 18, 480);
      g.fillStyle = HOT; g.fillRect(18, 120, 322, 26); g.fillStyle = ORG; g.fillRect(18, 152, 322, 10);
      g.strokeStyle = 'rgba(255,247,228,.25)'; g.lineWidth = 3; g.strokeRect(34, -222, 290, 444);
    } });
    P.caseIn = piece([0, -240, 340, 240], function (g) { rr(g, 0, -240, 340, 480, 10); }, '#3a2766', { sx: 4, sy: 8, blur: 10, extra: function (g) {
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(22, -218, 296, 436);
      g.fillStyle = 'rgba(255,247,228,.35)'; g.fillRect(150, -228, 40, 14); g.fillRect(150, 214, 40, 14);
    } });
    P.tray = piece([0, -240, 340, 240], function (g) { rr(g, 0, -240, 340, 480, 10); }, '#3a2766', { sx: 6, sy: 10, blur: 14, extra: function (g) {
      g.fillStyle = '#120a26'; rr(g, 20, -220, 300, 440, 8); g.fill();
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(20, -220, 300, 16);
      g.strokeStyle = 'rgba(255,247,228,.28)'; g.lineWidth = 4; g.beginPath(); g.arc(170, 0, 64, 0, TAU); g.stroke();
      g.fillStyle = '#24163f'; g.beginPath(); g.arc(170, 0, 30, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,247,228,.35)'; for (var i = 0; i < 8; i++) { var a = i / 8 * TAU; g.beginPath(); g.arc(170 + Math.cos(a) * 30, Math.sin(a) * 30, 4, 0, TAU); g.fill(); }
      g.fillStyle = '#05030c'; g.beginPath(); g.arc(170, 0, 13, 0, TAU); g.fill();
    } });
    P.slip = cardPiece(520, 180, NEWS, [['DOWNLOAD CODE', 42, '#7a2b5c', -38], ['XXXX-XXXX', 66, INK, 32, 'condensed']], { r: 4, ring: 'rgba(29,18,51,.2)' });
    P.noDisc = buildStamp(['NO', 'DISC'], 120, 240);
    P.pin = piece([-16, -16, 16, 16], function (g) { g.beginPath(); g.arc(0, 0, 14, 0, TAU); }, TEAL, { sx: 3, sy: 5, blur: 5, edge: 1.5, after: function (g) { g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(-4, -4, 4, 0, TAU); g.fill(); } });
    var PADC = '#f4ead6';
    P.cal = cardPiece(480, 560, PADC, [['GTA 6', 52, CREAM, -232], ['NOV', 96, HOT, -128], ['19', 230, INK, 36], ['2026', 84, INK, 192], ['ROCKSTAR', 36, '#7a2b5c', 250]], { r: 10, sy: 14, before: function (g) {
      g.fillStyle = DEEP; g.fillRect(-240, -280, 480, 92); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(-240, -280, 480, 6);
    } });
    var tp2 = jag(301, 1100, 10), bt2 = jag(302, 1100, 10);
    P.sweep = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp2[0][1]); tp2.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt2.length - 1; i >= 0; i--) g.lineTo(bt2[i][0], 1560 + bt2[i][1]); g.closePath(); }, PADC, { sx: 0, sy: 10, blur: 20, ps: .6, extra: function (g) {
      g.fillStyle = HOT; g.fillRect(0, -20, 1100, 120); g.fillStyle = TEAL; g.fillRect(0, 1420, 1100, 160);
      g.fillStyle = 'rgba(29,18,51,.06)'; for (var y = 120; y < 1420; y += 14) g.fillRect(0, y, 1100, 2);
    } });
  }

  function chipIn(g, t, text, x, y, tin, tout, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .3) return;
    var k = cd(t, tin, 14), nr = NOREC; NOREC = nr || k < .98 || t > tout;
    chip(g, text, x + (o.dx || 0) * (1 - k), y + (1 - k) * (o.from == null ? -40 : o.from), { px: o.px || 44, bg: o.bg || ORG, fg: o.fg || INK, a: fin(t, tin, .08) * (1 - seg(t, tout, tout + .25)), rot: (o.rot || 0) + .01 * osc(t, 7, o.ph || 0), s: kn(t, tin + .1, .05) });
    NOREC = nr;
  }
  function stampAt(g, t, pc, x, y, tin, tout, rot, sc) {
    if (t < tin - .02 || t > tout + .3) return;
    var k = cd(t, tin, 30), o = sm(t, tout, .2), nr = NOREC;
    g.save(); g.globalAlpha *= clamp((t - tin) * 14, 0, 1) * (1 - o); g.translate(x, y + o * 60); g.rotate(rot || -.05); var s = lerp(1.15, 1, k) * (sc || 1); g.scale(s, s);
    NOREC = nr || k < .98 || o > 0; putW(g, pc, 0, 0); NOREC = nr; g.restore();
    if (t >= tin && t < tin + .45) KIT.impact(g, x, y, t - tin, .5, CREAM);
  }

  /* ---------- the frame ---------- */
  var NOISE, POSTERMODE = false, VIG = null;
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function vignette(g) {
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 860, 520, 510, 900, 1300); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.45)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  function applyCam(g, t) { var bs = 1 + .006 * osc(t, 9, .7); g.translate(510, 900); g.scale(bs, bs); g.translate(-510, -900); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    /* the last .35 s replay frame 0's approach: the brick hops off and comes back into the gap */
    var tt = t >= T.W5 ? t - DUR : t;
    if (LIVE2.bg) { g.save(); applyCam(g, t); bgDraw(g, tt); g.restore(); vignette(g); }
    g.save(); railClip(g); applyCam(g, t);
    drawBar(g, tt); freeLabel(g, tt);
    checkBeat(g, tt);
    drawCase(g, tt); boxLabels(g, tt); slipFly(g, tt);
    roomBeat(g, tt);
    drawBrick(g, tt); rideArrow(g, tt);
    openBeat(g, tt); pill(g, tt); endBeat(g, tt);
    g.restore();
    if (LIVE2.bg) { g.save(); pageSweep(g, t, T.sw1); pageSweep(g, t, T.E0); g.restore(); }
    if (!POSTERMODE && LIVE.text && t < T.W5 - .1) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

  /* ---------- captions (the voice, phrase by phrase; the hook is carried by the picture) ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1, is: 1 };
  var NOCAP = { hook: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (NOCAP[l.id]) return;
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  /* a caption never shows over the page wipe: the first card after a wipe waits until the page has cleared */
  function capS(c) { var s = c.s; if (c.id === 'box') s = Math.max(s, T.sw1 + .28); if (c.id === 'end') s = Math.max(s, T.E0 + .28); return s; }
  var STRESS = [];
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 400;
  function captions(g, t) {
    t = tq(t);
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= capS(c)) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? capS(nx) : 1e9, end = Math.min(card0.t1 + .5, ns);
    if (t >= end) return;
    var CY = CAPY, k = cd(t, capS(card0), 16);
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


  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('upto', 'UP TO', 0, T.fit0 + .2); Tx('212', '212 GB', 0, T.sw1);
    Tx('gta6', 'GTA 6', T.pill + .1, T.pillOut);
    Tx('cred', 'PRE-LOAD · ROCKSTAR', T.cred + .08, T.credOut);
    Tx('free', 'FREE', T.freeIn + .15, T.sw1 - .25);
    Tx('set', 'SETTINGS > STORAGE', T.card0 + .25, T.sw1); Tx('fs', 'FREE SPACE', T.card0 + .25, T.sw1); Tx('rec', 'RE-CREATED', T.card0 + .25, T.sw1);
    Tx('psn', 'PS5 · PLAYSTATION.COM', T.card0 + .25, T.sw1);
    Tx('box6', 'GTA 6', T.box0 + .3, T.lid);
    Tx('cib', 'CODE IN BOX · ROCKSTAR', T.cib + .08, T.cibOut);
    Tx('dl', 'DOWNLOAD CODE', T.slip0 + .3, T.fly0); Tx('xx', 'XXXX-XXXX', T.slip0 + .3, T.fly0);
    Tx('nod', 'NO DISC', T.nod + .1, T.peel); Tx('nodc', 'PS5 · PLAYSTATION.COM', T.nodC + .08, T.peel);
    Tx('212b', '212 GB', T.drop2 + .3, T.E0);
    Tx('cal', 'GTA 6 NOV 19 2026', T.cal + .3, T.E0); Tx('calc', 'ROCKSTAR', T.cal + .3, T.E0);
    Tx('fits', 'FITS', T.fits + .05, T.E0);
    Tx('212c', '212 GB', T.E0 + .2, DUR + 1); Tx('upto2', 'UP TO', T.E0 + .2, DUR + 1);
    Tx('yes', 'YES', T.no + .06, T.ynOut); Tx('nope', 'NO', T.no + .06, T.ynOut);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    /* hook: frame 0 is the jam. The brick hits the gap at 0.08 s with a heavy thud before the voice starts (outside the gate,
       on purpose: the loop restarts on it); the GTA 6 pill slams in on "G T A"; the brick bounces off at 1.2 s (the gap flashes),
       the underline swipes and the blocks rattle at 2.4 s, and it re-jams with a second thud in the pause */
    T.c0 = .08; EV.push({ t: .035, type: 'thud', g: 1, id: 'thud0', trim: window.THUD0_TRIM == null ? 8 : window.THUD0_TRIM });
    T.pill = .25; T.k212 = at('hook', '212'); T.bb = 1.2; T.ul = 2.4;
    T.rej = G('rej', 2.95, 'thud', .4, 1, { trim: 4 }); T.pillOut = T.rej - .2;
    /* open: the credit chip as the line starts; the arrow drops onto the stripe on "is"; a ratchet as it fills */
    T.open0 = start('open'); T.cred = start('open') - .15; T.arr0 = at('open', 'is') - .1; T.arrLand = T.arr0 + .25;
    G('rat', after('open'), 'ratchet', .3, .8, { dur: .18 });
    /* fit: the brick shrinks to bar scale and jams the gap (too wide); the storage card drops on "on your console" */
    T.fit0 = start('fit') - .2; T.freeIn = T.fit0 + .75; T.card0 = at('fit', 'on'); T.credOut = T.card0 - .05;
    T.jam = G('jam', after('fit'), 'clank', .4, .9, { dur: .15 });
    T.free = at('check', 'free');
    /* box: torn page sweep, the case drops, shakes on "Bad news", opens on the gap before "Inside" */
    T.sw1 = start('box') + .12; G('sw1', T.sw1 - .15, 'swish', .3, 1);
    T.box0 = T.sw1 + .02; T.cib = T.box0 + .3; T.bad = at('box', 'bad'); G('rattle', T.bad - .35, 'rattle', .3, 1, { dur: .2 });
    T.lid = G('lid', start('code') - .25, 'flap', .2, 1); T.slip0 = T.lid + .15; T.just = at('code', 'just');
    /* NO DISC only after the code-in-box chip has gone (they never share a frame) */
    T.nod = (at('code', 'download') + at('code', 'code')) / 2; T.nodC = T.nod + .04; T.cibOut = T.nod - .28;
    /* all: the case slides left, the slip flies right and the brick drops out of it onto the gap */
    T.all0 = start('all') - .05; T.SLIPX = 766; T.SLIPY = 960; T.fly0 = at('all', 'all') - .08; T.drop2 = T.fly0 + .2;
    T.jam2 = G('jam2', after('all'), 'thud', .4, 1);
    /* room: the stamp peels, two blocks pop out on "make room", the rest slide over, the brick slides in, the calendar */
    T.peel = start('room') - .39; G('peel', T.peel - .05, 'peel', .25, .7);
    T.room0 = start('room') - .3;
    T.pops = [G('p1', at('room', 'make') - .05, 'pop', .12, .7), G('p2', at('room', 'room'), 'pop', .12, .7)];
    T.reflow = T.pops[1] + .2; T.slideIn = T.reflow + .05; T.fits = T.slideIn + .35;
    T.cal = T.room0; T.n19 = at('room', '19'); G('cal', after('room'), 'thock', .4, 1);
    /* end: the page sweeps back to the frame-0 jam; YES and NO on "fit", the gap pulses on "yours", the brick nudges */
    T.E0 = start('end') - .05; G('sw2', T.E0 - .15, 'swish', .3, 1);
    T.yes = at('end', 'fit'); T.no = T.yes + .04; T.yours = at('end', 'yours');
    T.nudge = G('nudge', wend('end', 'yours') + .2, 'thock', .3, .8);
    T.W5 = DUR - .35; T.ynOut = T.W5 - .3;
    STRESS = [['check', 'free'], ['code', 'code.'], ['all', 'all'], ['room', '19.']].map(function (p) { return at(p[0], p[1]); });
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

  /* ---------- sound: paper and cardboard foley written into the pauses; no music (Isac adds a TikTok sound) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .8;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -8; comp.ratio.value = 2; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); return o; }
    /* env holds the first value until the first point (a hit that starts off the 128-sample grid does not click) */
    function env(pm, pts) { pm.value = pts[0][1]; pm.setValueAtTime(pts[0][1], 0); pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc2(type, f, t0, t1, pts, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function band(t0, t1, f0, f1, g0, g1, q, pan, type) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = type || 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g, f) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = f || 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc2('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function swish(t, g) { band(t, t + .26, 600, 3600, .09 * g, .02 * g, 1.3, -.2); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); }
    function pop(t, g) { thump(t, .3 * g, 320); tick(t, 1.1 * g, 2600); band(t, t + .06, 2400, 1200, .06 * g, .01 * g, 1.2); }
    function clank(t, g) { thump(t, .5 * g, 140); band(t, t + .18, 900, 400, .12 * g, .02 * g, 1.4); for (var j = 0; j < 3; j++) { tick(t + j * .05, .7 * g, 1600); thump(t + j * .05, .15 * g, 240); } }
    /* a heavy paper brick landing on cardboard */
    function thud(t, g) { thump(t, .6 * g, 120); band(t, t + .16, 700, 200, .1 * g, .01 * g, 1, 0, 'lowpass'); tick(t, .5 * g, 1400); }
    /* paper sliding over paper */
    function slide(t, g) { band(t, t + .3, 1400, 2600, .08 * g, .03 * g, .9, .2); band(t, t + .28, 300, 500, .05 * g, .01 * g, 1, 0, 'lowpass'); }
    /* a download ratchet: ticks that speed up */
    function ratchet(t, g) { for (var j = 0; j < 9; j++) { var tj = t + .4 * (1 - Math.pow(1 - j / 9, 1.6)); tick(tj, (.7 + .05 * j) * g, 2200); thump(tj, .06 * g, 400); } }
    /* a box shaken once: two thumps and a loose rattle inside (nothing heavy in it) */
    function rattle(t, g) { thump(t, .35 * g, 170); thump(t + .14, .25 * g, 160); for (var j = 0; j < 6; j++) tick(t + .02 + j * .045 + rnd() * .01, (.5 + rnd() * .3) * g, 2400); }
    function flap(t, g) { thump(t, .3 * g, 180); band(t, t + .14, 1200, 600, .1 * g, .01 * g, 1); }
    function stamp(t, g) { thump(t, .55 * g, 110); band(t, t + .1, 800, 300, .12 * g, .01 * g, 1); tick(t, .8 * g, 1500); }
    function peel(t, g) { band(t, t + .2, 2000, 5200, .05 * g, .02 * g, 1.6, .2); }
    var LEVEL = { swish: 14, thock: 2, pop: 4.6, clank: 2.4, thud: 2.2, slide: 6, ratchet: 3, rattle: 3, flap: 4, stamp: 2.2, peel: 8 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = window.SFX_TYPE_DB || { swish: -8, thock: -6, pop: -14, clank: -13, thud: -12, slide: 0, ratchet: -6, rattle: -11, flap: -13, stamp: -11, peel: -6 };
    var FN = { swish: swish, thock: thock, pop: pop, clank: clank, thud: thud, slide: slide, ratchet: ratchet, rattle: rattle, flap: flap, stamp: stamp, peel: peel };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (e.trim || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (FN[e.type]) FN[e.type](e.t, g);
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

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-preload', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.nod + .7) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: '212 GB', t0: 0, t1: T.fit0 }, { id: 'fit', name: 'Will it fit?', t0: T.fit0, t1: T.sw1 }, { id: 'box', name: 'The box', t0: T.sw1, t1: T.room0 }, { id: 'room', name: 'Make room', t0: T.room0, t1: T.E0 }, { id: 'end', name: 'Yours?', t0: T.E0, t1: DUR }]; };

  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the bleed backgrounds off and no clip, every shape and glyph must stay inside x 90-930 and above y 1450 */
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; var bad = [], n = Math.round(DUR * fps);
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false; var lt = LIVE.text; LIVE.text = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0b) + Math.abs(d[i + 1] - 0x08) + Math.abs(d[i + 2] - 0x20) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
    for (var i = 0; i < n; i++) {
      var t = (i + .5) / fps; frame(ctx, clamp(t, 0, DUR));
      var L0 = dirty(0, 0, 90, H), R0 = dirty(930, 0, 150, H), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0.c + B0.c > 0) bad.push({ t: +t.toFixed(2), left: L0.c && [L0.c, L0.y0, L0.y1], right: R0.c && [R0.c, R0.x1 + 930, R0.y0, R0.y1], bottom: B0.c && [B0.c, B0.y1, B0.x0 + 90, B0.x1 + 90] });
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; LIVE.text = lt; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
