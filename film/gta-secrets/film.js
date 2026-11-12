/* "GTA 5 Still Hides These 3 Secrets": Delta, pillar 2 (GTA 5 and Online for everyone).
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). The native move is a scratch-off: each secret sits under a full-bleed silver foil printed SECRET n, a coin
   scrapes it off in three strokes and the secret's own paper world is under it: the alien under the ice in the first
   mission (North Yankton), the mural in the Mount Chiliad cable car station (as PC Gamer describes it), the ghost on
   Mount Gordo at 11 PM over JOCK, her husband's name. Ends on GTA 6, Nov 19 2026 (rockstargames.com/VI).
   Engine from film/gta-longestwait (paper pieces, VAD gate, fontStretch re-apply, captions, rail scan).
   Every secret is our own drawing: no footage, screenshots, logos, key art or in-game art; no music. */
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
  var NAVY = '#101a3d', NAVY2 = '#1b2a5c', ICE = '#bfe3ef', ICE2 = '#93c9de', SNOW = '#eef6fb', RUST = '#7a3b2a', PINE = '#123c45', RED = '#d7262e', GOLD = '#ffc83d', INK2 = '#2a1850', STONE = '#d9cfbf';
  function wordsOf(pc, rec) { pc.words = rec.map(function (r0) { return [r0[0] - pc.x0, r0[1] - pc.y0, r0[2] - pc.x0, r0[3] - pc.y0, r0[4]]; }); return pc; }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function sm(t, a, d) { return eio(seg(t, a, a + (d || .5))); }
  var T = {}, LIVE2 = { bg: true, clip: true };
  function circle(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
  /* the rail clip a moving prop carries itself, so it is never drawn past x 90-930 even with the frame clip off */
  function ownClip(g) { g.beginPath(); g.rect(BX0, 0, BX1 - BX0, BY1); g.clip(); }

  /* ---------- our alien: generic big head, almond eyes, long thin arms (no film creature) ---------- */
  function alienCanvas(col, line, eyes) {
    var c = mk(700, 900), g = c.getContext('2d');
    g.translate(350, 470); g.lineCap = 'round'; g.lineJoin = 'round';
    function limb(pts, w) { g.strokeStyle = line; g.lineWidth = w + 10; g.beginPath(); pts.forEach(function (p, i) { i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); }
    /* arms up and out, frozen mid-reach; legs apart */
    limb([[-50, -40], [-170, -150], [-250, -300]], 26); limb([[50, -40], [175, -140], [260, -290]], 26);
    [[-250, -300, -1], [260, -290, 1]].forEach(function (h) { for (var f = -1; f <= 1; f++) limb([[h[0], h[1]], [h[0] + h[2] * 14 + f * 26, h[1] - 52]], 12); });
    limb([[-30, 180], [-80, 330], [-100, 420]], 30); limb([[30, 180], [85, 330], [110, 420]], 30);
    /* body */
    g.fillStyle = col; g.strokeStyle = line; g.lineWidth = 10;
    g.beginPath(); g.ellipse(0, 70, 78, 140, 0, 0, TAU); g.fill(); g.stroke();
    limb([[0, -60], [0, -120]], 34);
    /* head */
    g.beginPath(); g.moveTo(0, -95); g.bezierCurveTo(-150, -110, -165, -330, -40, -360); g.bezierCurveTo(70, -385, 170, -300, 130, -190); g.bezierCurveTo(105, -125, 50, -95, 0, -95); g.closePath(); g.fill(); g.stroke();
    if (eyes) { g.fillStyle = eyes; [[-58, -215, .5], [52, -215, -.5]].forEach(function (e) { g.save(); g.translate(e[0], e[1]); g.rotate(e[2]); g.beginPath(); g.ellipse(0, 0, 44, 22, 0, 0, TAU); g.fill(); g.restore(); }); g.fillStyle = 'rgba(255,255,255,.55)'; circle(g, -66, -222, 7); g.fill(); circle(g, 44, -222, 7); g.fill(); }
    return c;
  }
  /* our own detail on the alien: a cut-paper white border and frost crystals glued over it */
  function paperFrost(src) {
    var c = mk(src.width + 40, src.height + 40), g = c.getContext('2d'), w = mk(src.width, src.height), wg = w.getContext('2d');
    wg.drawImage(src, 0, 0); wg.globalCompositeOperation = 'source-in'; wg.fillStyle = '#f7fbff'; wg.fillRect(0, 0, w.width, w.height);
    var r = mulberry(77);
    for (var i = 0; i < 24; i++) { var a = i * TAU / 24, rr2 = 11 + r() * 5; g.drawImage(w, 20 + Math.cos(a) * rr2, 20 + Math.sin(a) * rr2); }
    g.drawImage(src, 20, 20);
    g.globalCompositeOperation = 'source-atop'; g.lineCap = 'round';
    for (i = 0; i < 16; i++) {
      var x = 120 + r() * 500, y = 80 + r() * 760, R = 12 + r() * 20, a0 = r();
      g.strokeStyle = 'rgba(240,252,255,' + (.55 + r() * .35).toFixed(2) + ')'; g.lineWidth = 3 + r() * 2;
      for (var k = 0; k < 3; k++) { var an = a0 + k * Math.PI / 3; g.beginPath(); g.moveTo(x - Math.cos(an) * R, y - Math.sin(an) * R); g.lineTo(x + Math.cos(an) * R, y + Math.sin(an) * R); g.stroke(); }
    }
    g.globalCompositeOperation = 'source-over';
    return c;
  }
  function blurred(src, px, tint) {
    var c = mk(src.width, src.height), g = c.getContext('2d'); g.filter = 'blur(' + px + 'px)'; g.drawImage(src, 0, 0); g.filter = 'none';
    if (tint) { g.globalCompositeOperation = 'source-in'; g.fillStyle = tint; g.fillRect(0, 0, c.width, c.height); }
    return c;
  }
  /* ---------- the ghost: a pale paper figure in a long dress, no face detail ---------- */
  function ghostCanvas() {
    var c = mk(420, 760), g = c.getContext('2d'); g.translate(210, 60);
    var gr = g.createLinearGradient(0, 0, 0, 690); gr.addColorStop(0, 'rgba(236,246,255,.97)'); gr.addColorStop(.7, 'rgba(214,234,250,.9)'); gr.addColorStop(1, 'rgba(214,234,250,0)');
    g.fillStyle = gr; g.shadowColor = 'rgba(200,235,255,.6)'; g.shadowBlur = 30;
    g.beginPath(); g.arc(0, 52, 46, 0, TAU); g.fill();
    /* hair falling to the shoulders */
    g.beginPath(); g.moveTo(-50, 40); g.quadraticCurveTo(-62, 140, -40, 170); g.lineTo(40, 170); g.quadraticCurveTo(62, 140, 50, 40); g.closePath(); g.fill();
    /* dress widening to the hem, ragged at the foot */
    g.beginPath(); g.moveTo(-40, 120); g.quadraticCurveTo(-70, 190, -78, 260); g.lineTo(-130, 660); for (var i = 0; i <= 10; i++) g.lineTo(-130 + i * 26, 660 + (i % 2 ? 30 : 0)); g.lineTo(78, 260); g.quadraticCurveTo(70, 190, 40, 120); g.closePath(); g.fill();
    /* arms hanging */
    g.lineCap = 'round'; g.strokeStyle = 'rgba(236,246,255,.9)'; g.lineWidth = 22; g.beginPath(); g.moveTo(-62, 170); g.quadraticCurveTo(-96, 290, -88, 380); g.moveTo(62, 170); g.quadraticCurveTo(96, 290, 88, 380); g.stroke();
    g.shadowBlur = 0; g.fillStyle = 'rgba(40,70,110,.35)'; g.beginPath(); g.ellipse(-16, 50, 7, 4, 0, 0, TAU); g.ellipse(16, 50, 7, 4, 0, 0, TAU); g.fill();
    /* cut-paper detail: a hair parting and strands, a waist, folds down to the hem */
    g.strokeStyle = 'rgba(70,110,160,.5)'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 8); g.quadraticCurveTo(-30, 14, -44, 60); g.quadraticCurveTo(-52, 120, -40, 166); g.moveTo(0, 8); g.quadraticCurveTo(30, 14, 44, 60); g.quadraticCurveTo(52, 120, 40, 166);
    g.moveTo(-36, 40); g.quadraticCurveTo(-46, 110, -30, 160); g.moveTo(36, 40); g.quadraticCurveTo(46, 110, 30, 160); g.stroke();
    g.lineWidth = 7; g.beginPath(); g.moveTo(-62, 236); g.quadraticCurveTo(0, 252, 62, 236); g.stroke();
    g.lineWidth = 4; g.strokeStyle = 'rgba(70,110,160,.35)'; [-70, -25, 25, 70].forEach(function (x) { g.beginPath(); g.moveTo(x * .5, 260); g.quadraticCurveTo(x * .9, 450, x * 1.3, 640); g.stroke(); });
    return c;
  }
  /* ---------- the coin ---------- */
  function coinPiece() {
    return piece([-66, -66, 66, 66], function (g) { circle(g, 0, 0, 64); }, GOLD, { sx: 6, sy: 10, blur: 12, edge: 2, extra: function (g) {
      g.strokeStyle = 'rgba(120,70,0,.5)'; g.lineWidth = 3; for (var i = 0; i < 48; i++) { var a = i * TAU / 48; g.beginPath(); g.moveTo(Math.cos(a) * 58, Math.sin(a) * 58); g.lineTo(Math.cos(a) * 64, Math.sin(a) * 64); g.stroke(); }
      g.strokeStyle = 'rgba(120,70,0,.45)'; g.lineWidth = 4; circle(g, 0, 0, 48); g.stroke();
      g.fillStyle = 'rgba(150,90,0,.55)'; g.beginPath(); for (var k = 0; k < 10; k++) { var r = k % 2 ? 13 : 30, an = -Math.PI / 2 + k * Math.PI / 5; g.lineTo(Math.cos(an) * r, Math.sin(an) * r); } g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(-22, -26, 20, 9, -.6, 0, TAU); g.fill();
    } });
  }
  /* ---------- the foil: one full-bleed sheet per secret, tinted for its world (ice-blue, dusk-purple, night-navy) ---------- */
  /* jury r1: each stroke is two straight coin-wide passes with ragged edges and flakes; the hold before the first stroke is 0.6 s.
     bands are [y of pass 1, y of pass 2]; band 1 opens over the labels that world needs first, the SECRET n block stays until the sheet falls */
  var FOILCFG = {
    1: { g: ['#a7cddd', '#e8f8fc', '#93bfd3', '#ddf2f8', '#88b4c8'], ink: '#24485a', hi: 'rgba(255,255,255,.4)', ty: 880, bands: [[560, 690], [150, 290], [1500, 1650]] },
    2: { g: ['#b3a4cc', '#ece4f6', '#a191c0', '#ddd2ee', '#9282b2'], ink: '#33284f', hi: 'rgba(255,255,255,.4)', ty: 600, bands: [[1180, 1300], [150, 290], [1500, 1650]] },
    3: { g: ['#3b4570', '#7c87b4', '#313a63', '#6e79a8', '#283055'], ink: '#e8ecf8', hi: 'rgba(10,14,40,.4)', ty: 600, bands: [[1290, 1410], [150, 290], [1520, 1660]] }
  };
  function foilCanvas(n) {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(200 + n), F = FOILCFG[n];
    var gr = g.createLinearGradient(0, 0, W, H); F.g.forEach(function (col, i) { gr.addColorStop([0, .35, .5, .7, 1][i], col); });
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (var i = 0; i < 9000; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,' + (.1 + r() * .25).toFixed(3) + ')' : 'rgba(30,36,60,' + (.06 + r() * .14).toFixed(3) + ')'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    /* the printed ticket pattern: small stars in rows */
    g.fillStyle = n === 3 ? 'rgba(220,226,250,.12)' : 'rgba(40,46,72,.14)';
    for (var y = 60; y < H; y += 110) for (var x = (y / 110 % 2) * 70 + 40; x < W; x += 140) { g.save(); g.translate(x, y); star5(g, 20, 8); g.fill(); g.restore(); }
    /* printed words, inside the rail */
    g.textAlign = 'center'; g.textBaseline = 'middle';
    cond(g); font(g, 520, 900); ls(g, 0); g.fillStyle = F.ink; g.fillText(String(n), 510, F.ty + 160); g.fillStyle = F.hi; g.fillText(String(n), 504, F.ty + 152);
    unst(g); ls(g, 0);
    return c;
  }
  function bandStroke(b) {
    var pts = [[130, b[0]], [890, b[0] + 14], [890, b[1]], [130, b[1] + 10]], L = [0];
    for (var j = 1; j < pts.length; j++) L.push(L[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]));
    return { pts: pts, L: L };
  }
  var STROKES = {}; [1, 2, 3].forEach(function (n) { STROKES[n] = FOILCFG[n].bands.map(bandStroke); });
  function strokeAt(S, f) {
    var d = S.L[S.L.length - 1] * f, i = 1; while (i < S.L.length - 1 && S.L[i] < d) i++;
    var a = S.pts[i - 1], b = S.pts[i], u = clamp((d - S.L[i - 1]) / (S.L[i] - S.L[i - 1]), 0, 1);
    return { i: i, x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), dx: (b[0] - a[0]) / (S.L[i] - S.L[i - 1]), dy: (b[1] - a[1]) / (S.L[i] - S.L[i - 1]) };
  }
  function strokePath(g, S, f) { var e = strokeAt(S, f); g.beginPath(); g.moveTo(S.pts[0][0], S.pts[0][1]); for (var j = 1; j < e.i; j++) g.lineTo(S.pts[j][0], S.pts[j][1]); g.lineTo(e.x, e.y); return e; }
  /* ragged edges: small bites out of both sides of the band, seeded per stroke */
  function raggedEdges(g, S, f, seed) {
    var r = mulberry(seed), dmax = S.L[S.L.length - 1] * f;
    for (var d = 0; d < dmax; d += 13) {
      var e = strokeAt(S, d / S.L[S.L.length - 1]), nx = -e.dy, ny = e.dx;
      for (var sd = -1; sd <= 1; sd += 2) { var dep = 4 + r() * 16, w = 9 + r() * 12, ox = e.x + nx * sd * (75 + dep / 2), oy = e.y + ny * sd * (75 + dep / 2); g.fillRect(ox - w / 2, oy - dep / 2 - 2, w, dep + 4); }
    }
  }
  var SHOLD = .4, SDUR = .45, SGAP = .05;
  function foilState(t, F) {
    /* F = { n, drop, sc }: drop = the sheet falls in; sc = the first stroke starts */
    var k = [], i; for (i = 0; i < 3; i++) k.push(eio(seg(t, F.sc + i * (SDUR + SGAP), F.sc + i * (SDUR + SGAP) + SDUR)));
    var end = F.sc + 3 * SDUR + 2 * SGAP, fall = seg(t, end, end + .3);
    return { k: k, end: end, fall: fall };
  }
  var FC = null, FG = null;
  function foil(g, t, F) {
    var st = foilState(t, F);
    if (t < F.drop || t > st.end + 1.1) return;
    var yd = lerp(-H - 40, 0, eio(seg(t, F.drop, F.drop + .28))), SS = STROKES[F.n];
    if (LIVE2.bg && t <= st.end + .32) {
      FG.setTransform(1, 0, 0, 1, 0, 0); FG.globalCompositeOperation = 'source-over'; FG.globalAlpha = 1; FG.clearRect(0, 0, W, H); FG.drawImage(P.foil[F.n - 1], 0, 0);
      FG.lineCap = 'round'; FG.lineJoin = 'round';
      st.k.forEach(function (k, i) {
        if (k <= 0) return;
        /* a scuffed rim, then the coin-wide cut, then bites out of its edges */
        FG.globalCompositeOperation = 'source-atop'; FG.strokeStyle = 'rgba(20,22,40,.42)'; FG.lineWidth = 186; strokePath(FG, SS[i], k); FG.stroke();
        FG.globalCompositeOperation = 'destination-out'; FG.strokeStyle = '#000'; FG.fillStyle = '#000'; FG.lineWidth = 150; strokePath(FG, SS[i], k); FG.stroke();
        raggedEdges(FG, SS[i], k, 400 + F.n * 10 + i);
      });
      FG.globalCompositeOperation = 'source-over';
      g.save(); g.globalAlpha *= 1 - st.fall; g.translate(0, yd + 260 * st.fall * st.fall); if (st.fall > 0) { g.translate(540, 960); g.rotate(.06 * st.fall); g.translate(-540, -960); }
      g.drawImage(FC, 0, 0);
      g.restore();
    }
    /* flakes: ten foil shards per stroke peel off the coin and fall 300+ px */
    g.save(); ownClip(g);
    var fc = FOILCFG[F.n].g;
    for (var i = 0; i < 3; i++) {
      var s0 = F.sc + i * (SDUR + SGAP), rf = mulberry(500 + F.n * 31 + i * 7);
      for (var j = 0; j < 10; j++) {
        var ts = s0 + SDUR * (j + .5) / 10, vx = (rf() - .5) * 320, vy = -80 - rf() * 220, sz = 14 + rf() * 16, w0 = rf() * TAU, sp = (rf() - .5) * 18, off = (rf() - .5) * 120, u = t - ts;
        if (u < 0 || u > .8) continue;
        var e0 = strokeAt(SS[i], eio((j + .5) / 10)), fx = e0.x + vx * u, fy = e0.y + off + vy * u + 1300 * u * u;
        g.save(); g.globalAlpha *= 1 - seg(u, .55, .8); g.translate(fx, fy); g.rotate(w0 + sp * u); g.scale(Math.cos(w0 + 9 * u), 1);
        g.fillStyle = fc[j % 2 ? 1 : 0]; g.strokeStyle = 'rgba(20,22,40,.6)'; g.lineWidth = 2.5;
        g.beginPath(); g.moveTo(-sz, -sz * .4); g.lineTo(sz * .7, -sz * .6); g.lineTo(sz, sz * .35); g.lineTo(-sz * .5, sz * .55); g.closePath(); g.fill(); g.stroke(); g.restore();
      }
    }
    g.restore();
    /* the coin (186 px, sharp: its position is held for the whole frame so motion blur never smears it) rides the head of the live stroke */
    var tc = tq(t), sc2 = foilState(tc, F), ci = -1; for (i = 0; i < 3; i++) if (tc >= F.sc + i * (SDUR + SGAP) - .02) ci = i;
    var cx, cy, rot = 0, ca = 1, lift = 0, ydc = lerp(-H - 40, 0, eio(seg(tc, F.drop, F.drop + .28)));
    if (ci < 0) { var p0 = SS[0].pts[0]; cx = p0[0] + 60 + 460 * (1 - eo(seg(tc, F.drop + .1, F.sc - .08))); cy = p0[1] - 30 + ydc; ca = seg(tc, F.drop + .1, F.drop + .2); rot = -.3 * (1 - seg(tc, F.drop + .1, F.sc)); }
    else {
      var e = strokeAt(SS[ci], sc2.k[ci]); cx = e.x; cy = e.y; rot = .18 * Math.sin(tc * 50);
      var gs = F.sc + ci * (SDUR + SGAP) + SDUR;
      if (ci < 2 && tc > gs) { var nx2 = SS[ci + 1].pts[0], gk = eio(seg(tc, gs, gs + SGAP)); cx = lerp(cx, nx2[0], gk); cy = lerp(cy, nx2[1], gk); lift = Math.sin(Math.PI * gk); }
      if (ci === 2 && sc2.k[2] >= 1) { var u2 = tc - sc2.end; cx += 500 * u2; cy -= 300 * u2 - 1400 * u2 * u2; ca = 1 - seg(u2, .15, .35); rot += 6 * u2; }
    }
    if (ca > 0) { var cs = 1.45 * (1 + .12 * lift); g.save(); ownClip(g); g.globalAlpha *= ca; g.translate(cx, cy - 30 * lift); g.rotate(rot - .35); g.scale(cs, cs * .9); put(g, P.coin, 0, 0); g.restore(); }
  }

  /* ---------- small shared pieces ---------- */
  function star5(g, r1, r2) { g.beginPath(); for (var k = 0; k < 10; k++) { var rr = k % 2 ? r2 : r1, an = -Math.PI / 2 + k * Math.PI / 5; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } g.closePath(); }
  function snow(g, t, n, seed, a, x0, x1, y0, y1, sp) {
    var r = mulberry(seed);
    g.save(); g.fillStyle = SNOW;
    for (var i = 0; i < n; i++) {
      var bx = r(), by = r(), s = 3 + r() * 6, ph = r() * TAU, k = 1 + Math.floor(r() * 3);
      var y = y0 + ((by * (y1 - y0) + (y1 - y0) * k * (sp || 2) * t / DUR) % (y1 - y0)), x = x0 + bx * (x1 - x0) + 18 * osc(t, 3 * k, ph);
      g.globalAlpha = a * (.5 + .5 * r()); circle(g, x, y, s); g.fill();
    }
    g.restore();
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

  /* =========================== WORLD 1: the ice (frame 0, the ask) =========================== */
  var CRACK = (function () { var r = mulberry(17), p = [[150, 700]], x = 150, y = 700; for (var i = 0; i < 18; i++) { x += 28 + r() * 22; y += (r() - .35) * 40; p.push([x, y]); } return p; })();
  var CRACK2 = (function () { var r = mulberry(23), p = [[880, 1380]], x = 880, y = 1380; for (var i = 0; i < 12; i++) { x -= 26 + r() * 20; y -= 14 + r() * 26; p.push([x, y]); } return p; })();
  function iceSheet(g, x0, y0, x1, y1, seed, c0, c1) {
    var gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0 || '#d6eef6'); gr.addColorStop(1, c1 || ICE2); g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    var r = mulberry(seed || 3);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineCap = 'round';
    for (var i = 0; i < 46; i++) { var x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), L = 60 + r() * 220; g.lineWidth = 2 + r() * 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y - L * .18); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.5)'; for (i = 0; i < 60; i++) { circle(g, x0 + r() * (x1 - x0), y0 + r() * (y1 - y0), 3 + r() * 9); g.fill(); }
  }
  function drawCrack(g, pts, k, w) {
    var n = Math.max(1, Math.floor((pts.length - 1) * k)), f = (pts.length - 1) * k - n;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    [['rgba(255,255,255,.9)', w + 6, 2], ['#2f6f8e', w, 0]].forEach(function (s) {
      g.strokeStyle = s[0]; g.lineWidth = s[1]; g.beginPath(); g.moveTo(pts[0][0] + s[2], pts[0][1] + s[2]);
      for (var i = 1; i <= n && i < pts.length; i++) g.lineTo(pts[i][0] + s[2], pts[i][1] + s[2]);
      if (n < pts.length - 1) g.lineTo(lerp(pts[n][0], pts[n + 1][0], f) + s[2], lerp(pts[n][1], pts[n + 1][1], f) + s[2]);
      g.stroke();
    });
    g.restore();
  }
  function wIce(g, t, L) {
    if (L === 'bg') {
      iceSheet(g, -200, -200, 1280, 2120, 3, '#f2fdff', '#9ee3f3');
      /* the dark shape under the ice: big, near-black, hard-edged (jury r1: 85 % ink, 6 px blur) */
      g.save(); g.globalAlpha = .88; g.translate(510, 1010 + 6 * osc(t, 2, 1)); g.rotate(-.12); g.drawImage(P.alienDark, -350 * 1.15, -470 * 1.15, 700 * 1.15, 900 * 1.15); g.fillStyle = 'rgba(244,236,214,.7)'; [[-58, -215, .5], [52, -215, -.5]].forEach(function (e) { g.save(); g.translate(e[0] * 1.15, e[1] * 1.15); g.rotate(e[2]); g.beginPath(); g.ellipse(0, 0, 30, 11, 0, 0, TAU); g.fill(); g.restore(); }); g.restore();
      /* a pale film of ice over it */
      g.fillStyle = 'rgba(226,248,255,.08)'; g.fillRect(-200, -200, 1480, 2320);
      /* the torch pool glides in from the left and settles on the shape on "secrets" */
      var tk = eio(seg(t, -.4, T.sec)), tx = lerp(120, 520, tk) + 30 * osc(t, 3, 1), ty = lerp(1260, 1000, tk);
      var tg = g.createRadialGradient(tx, ty, 20, tx, ty, 330); tg.addColorStop(0, 'rgba(255,252,232,.6)'); tg.addColorStop(.7, 'rgba(255,252,232,.25)'); tg.addColorStop(1, 'rgba(255,250,225,0)');
      g.fillStyle = tg; g.fillRect(tx - 340, ty - 340, 680, 680);
      if (t > T.dim0) { g.fillStyle = 'rgba(43,23,69,' + (.5 * sm(t, T.dim0, .35)).toFixed(3) + ')'; g.fillRect(-200, -200, 1480, 2320); }
      return;
    }
    /* fg: cracks creep, snow falls, the headline, the ticket */
    var ck = .3 + .7 * eo(seg(t, -.15, 1.3)); drawCrack(g, CRACK, ck, 8); drawCrack(g, CRACK2, .2 + .8 * eo(seg(t, 0, 1.6)), 7);
    snow(g, t, 26, 9, .9, BX0, BX1, 300, 1700, 3);
    ticket(g, t);
  }
  /* the frame-0 headline sits in screen space, still and fully printed while the ice glides under it */
  function ovIce(g, t) {
    var ho = sm(t, T.dim0, .3);
    if (t < T.dim0 + .35 || t < 0) {
      var nr = NOREC; NOREC = nr || ho > 0;
      g.save(); g.globalAlpha *= 1 - ho; g.translate(0, -ho * 80);
      stk(g, 'GTA 5', 510, 455, 190, { col: HOT, lw: 18, rot: -.03 + .008 * osc(t, 7, 1) });
      stk(g, 'STILL HIDES THIS', 510, 615, 104, { col: CREAM, lw: 13, rot: .015 + .006 * osc(t, 6, 2) });
      g.restore(); NOREC = nr;
    }
  }
  /* the scratch ticket: three silver panels on a cream card */
  function ticket(g, t) {
    if (t < T.tk0 - .02 || t > T.F1.drop + .35) return;
    var k = cd(t, T.tk0, 10), y = lerp(1500, 0, k), rot = -.025 + (1 - k) * .3 + .006 * osc(t, 6, 2), nr = NOREC, gk = sm(t, T.dim0, .35), ts = lerp(.78, 1, gk);
    g.save(); g.translate(510, lerp(1090, 960, gk) + y); g.rotate(rot); g.scale(ts, ts);
    NOREC = nr || k < .98 || (gk > 0 && gk < 1); putW(g, P.ticket, 0, 0);
    [0, 1, 2].forEach(function (i) {
      var tin = T.pan[i]; if (t < tin - .02) return;
      var pk = cd(t, tin, 16), s = lerp(.6, 1, pk) * kn(t, tin + .08, .05);
      g.save(); g.translate(0, -190 + i * 210); g.scale(s, s); g.globalAlpha *= fin(t, tin, .06); putW(g, P.panel[i], 0, 0); g.restore();
    });
    NOREC = nr;
    if (t >= T.coinIn - .02) { var ck = cd(t, T.coinIn, 12); g.save(); g.translate(lerp(330, 250, ck), -190 + 6 * Math.sin(t * 9)); g.globalAlpha *= fin(t, T.coinIn, .12); g.rotate(-.4 + .15 * Math.sin(t * 5)); put(g, P.coin, 0, 0); g.restore(); }
    g.restore();
  }

  /* =========================== WORLD 2: the bridge over the frozen creek =========================== */
  function pineRow(g, y, n, seed, h, col, x0, x1) {
    var r = mulberry(seed); g.fillStyle = col;
    for (var i = 0; i < n; i++) { var x = x0 + (i + r() * .6) * (x1 - x0) / n, hh = h * (.7 + r() * .5); g.beginPath(); g.moveTo(x, y - hh); g.lineTo(x - hh * .3, y); g.lineTo(x + hh * .3, y); g.closePath(); g.fill(); g.fillStyle = 'rgba(238,246,251,.5)'; g.beginPath(); g.moveTo(x, y - hh); g.lineTo(x - hh * .1, y - hh * .62); g.lineTo(x + hh * .1, y - hh * .62); g.closePath(); g.fill(); g.fillStyle = col; }
  }
  var BRY = 760;
  function wBridge(g, t, L) {
    if (L === 'bg') {
      var gr = g.createLinearGradient(0, -200, 0, BRY + 100); gr.addColorStop(0, '#0c1433'); gr.addColorStop(1, '#2a3e72'); g.fillStyle = gr; g.fillRect(-300, -300, 1680, BRY + 400);
      pineRow(g, BRY + 40, 16, 5, 210, '#1d3b55', -300, 1380);
      g.fillStyle = SNOW; g.beginPath(); g.moveTo(-300, BRY + 30); g.quadraticCurveTo(540, BRY - 10, 1380, BRY + 40); g.lineTo(1380, 2300); g.lineTo(-300, 2300); g.closePath(); g.fill();
      /* the frozen creek */
      g.save(); g.beginPath(); g.moveTo(-300, 1010); g.bezierCurveTo(300, 960, 700, 1060, 1380, 990); g.lineTo(1380, 2300); g.lineTo(-300, 2300); g.closePath(); g.clip(); iceSheet(g, -300, 950, 1380, 2300, 7);
      var sharp = sm(t, T.al0, .7);
      g.save(); g.translate(540, 1460); g.rotate(-.1); g.scale(.62, .62);
      if (sharp < 1) { g.globalAlpha = .85 * (1 - sharp); g.drawImage(P.alienDark, -350, -470); }
      if (sharp > 0) { g.globalAlpha = sharp; g.drawImage(P.alienBlur, -370, -490); g.globalAlpha = sharp * sm(t, T.al0 + .25, .6); g.drawImage(P.alien, -370, -490); }
      g.restore();
      g.fillStyle = 'rgba(214,238,246,.22)'; g.fillRect(-300, 950, 1680, 1400);
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 5; for (var i = 0; i < 7; i++) { var yy = 1200 + i * 90, xx = (i * 191) % 700; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 260, yy - 40); g.stroke(); }
      g.restore();
      /* snowy banks over the creek edge */
      g.fillStyle = SNOW; g.beginPath(); g.moveTo(-300, 1030); g.quadraticCurveTo(100, 990, 260, 1070); g.lineTo(-300, 1120); g.closePath(); g.fill();
      /* the bridge: a steel truss on stone piers, bleeding off both sides */
      g.fillStyle = '#5f6d86'; g.fillRect(170, BRY + 40, 70, 300); g.fillRect(800, BRY + 40, 70, 300);
      g.fillStyle = '#3a2a2a'; g.fillRect(-300, BRY - 6, 1680, 34);
      g.strokeStyle = RUST; g.lineWidth = 12; g.beginPath(); g.moveTo(-300, BRY - 150); g.lineTo(1380, BRY - 150); g.stroke();
      g.lineWidth = 9; for (var x = -300; x < 1380; x += 120) { g.beginPath(); g.moveTo(x, BRY - 150); g.lineTo(x + 120, BRY); g.moveTo(x + 120, BRY - 150); g.lineTo(x, BRY); g.moveTo(x, BRY - 150); g.lineTo(x, BRY); g.stroke(); }
      g.fillStyle = 'rgba(238,246,251,.85)'; g.fillRect(-300, BRY - 162, 1680, 8);
      return;
    }
    snow(g, t, 30, 31, .95, BX0, BX1, 300, 1430, 2);
    /* a paper car crosses the bridge (behind the truss), headlights on */
    var ck = seg(t, T.car0, T.car0 + 1.8), cxx = lerp(1000, 20, ck);
    if (ck > 0 && ck < 1) {
      g.save(); ownClip(g); g.translate(cxx, BRY - 4 + 2 * Math.sin(t * 30));
      g.fillStyle = '#8c1d2c'; rr(g, -80, -62, 160, 46, 10); g.fill(); rr(g, -50, -96, 96, 40, 10); g.fill();
      g.fillStyle = '#9fd3e6'; g.fillRect(-40, -88, 34, 24); g.fillRect(2, -88, 34, 24);
      g.fillStyle = '#1b1b22'; circle(g, -48, -14, 17); g.fill(); circle(g, 48, -14, 17); g.fill();
      g.fillStyle = 'rgba(255,240,180,.85)'; g.beginPath(); g.moveTo(-80, -44); g.lineTo(-230, -70); g.lineTo(-230, -10); g.closePath(); g.fill();
      g.restore();
      g.save(); ownClip(g); g.strokeStyle = RUST; g.lineWidth = 9; var bx = Math.floor((cxx + 300) / 120) * 120 - 300; for (var x2 = bx - 120; x2 <= bx + 240; x2 += 120) { g.beginPath(); g.moveTo(x2, BRY - 150); g.lineTo(x2, BRY); g.stroke(); } g.restore();
      K2streak(g, cxx + 110, BRY - 50, ck);
    }
    /* the alien: a ring round head and chest */
    if (t >= T.ring1 - .02) { g.save(); g.globalAlpha *= 1 - sm(t, T.xh0, .3); KIT.scribble(g, 540, 1386, 180, 230, sm(t, T.ring1, .4), HOT, 11, 5); g.restore(); }
    /* ice3: a crosshair glides on, three hits ping off, nothing breaks */
    if (t >= T.xh0 - .02) {
      var xk = cd(t, T.xh0, 9), xo = sm(t, T.shotOut, .25), hx = lerp(860, 600, xk) + 40 * Math.sin(t * 2.2), hy = lerp(980, 1310, xk) + 30 * Math.sin(t * 1.7 + 1);
      T.HITS.forEach(function (h, i) { if (t >= h) { var hx2 = 420 + i * 150, hy2 = 1250 + (i % 2) * 120, u = t - h; g.save(); g.globalAlpha *= 1 - xo; g.fillStyle = CREAM; g.translate(hx2, hy2); g.rotate(i); star5(g, 22, 9); g.fill(); g.restore(); KIT.impact(g, hx2, hy2, u, .55, CREAM); } });
      g.save(); g.globalAlpha *= (1 - xo) * fin(t, T.xh0, .1); g.strokeStyle = TEAL; g.lineWidth = 10; circle(g, hx, hy, 88); g.stroke(); circle(g, hx, hy, 12); g.stroke();
      [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (d) { g.beginPath(); g.moveTo(hx + d[0] * 60, hy + d[1] * 60); g.lineTo(hx + d[0] * 124, hy + d[1] * 124); g.stroke(); }); g.restore();
    }
  }
  function ovBridge(g, t) {
    chipIn(g, t, 'FIRST MISSION', 330, 570, T.ch1a, T.ch1out, { bg: HOT, px: 52, rot: -.03, from: -30 });
    chipIn(g, t, 'NORTH YANKTON', 640, 660, T.ch1b, T.ch1out, { bg: TEAL, px: 52, rot: .02, from: -30, ph: 2 });
    chipIn(g, t, 'OUR DRAWING', 720, 1370, T.our1, T.F2.drop - .05, { bg: CREAM, px: 44, rot: .03, from: 30 });
    /* jury r1: the stamp lands on the first hit and is gone before the SECRET 2 sheet arrives (it sits under the foil layer too) */
    stampAt(g, t, P.stNo, 510, 760, T.HITS[0], T.F2.drop - .05, -.06, 1);
  }
  function K2streak(g, x, y, k) { if (k <= 0 || k >= 1) return; g.save(); ownClip(g); KIT.streaks(g, x, y, 120, 70, k * 3, .6, { dir: -1, n: 6, col: 'rgba(238,246,251,.8)' }); g.restore(); }

  /* =========================== WORLD 3: Mount Chiliad and the cable car =========================== */
  var CAB0 = [190, 1330], CAB1 = [720, 600];
  function wMount(g, t, L) {
    if (L === 'bg') {
      var gr = g.createLinearGradient(0, -200, 0, 1400); gr.addColorStop(0, '#1f2a63'); gr.addColorStop(.45, '#7a3f86'); gr.addColorStop(.8, '#ff6f91'); gr.addColorStop(1, '#ff9a5a'); g.fillStyle = gr; g.fillRect(-300, -300, 1680, 1800);
      /* paper clouds drifting */
      [[200, 480, 1], [760, 360, 2], [420, 280, 3]].forEach(function (c, i) { var x = c[0] + 60 * osc(t, 1, c[2]); g.fillStyle = i === 1 ? 'rgba(255,214,226,.8)' : 'rgba(255,190,200,.65)'; rr(g, x - 110, c[1] - 26, 220, 52, 26); g.fill(); rr(g, x - 50, c[1] - 56, 120, 60, 30); g.fill(); });
      /* far ridge, then the big peak */
      g.fillStyle = '#5b3a7a'; g.beginPath(); g.moveTo(-300, 1100); g.lineTo(100, 820); g.lineTo(300, 900); g.lineTo(520, 760); g.lineTo(1380, 1050); g.lineTo(1380, 2300); g.lineTo(-300, 2300); g.closePath(); g.fill();
      g.fillStyle = '#2f5d4a'; g.beginPath(); g.moveTo(-300, 1500); g.lineTo(180, 1150); g.lineTo(420, 980); g.lineTo(600, 760); g.lineTo(720, 640); g.lineTo(800, 690); g.lineTo(960, 900); g.lineTo(1380, 1250); g.lineTo(1380, 2300); g.lineTo(-300, 2300); g.closePath(); g.fill();
      g.fillStyle = '#3f7a5c'; g.beginPath(); g.moveTo(720, 640); g.lineTo(800, 690); g.lineTo(960, 900); g.lineTo(1380, 1250); g.lineTo(1380, 2300); g.lineTo(760, 2300); g.lineTo(840, 1300); g.lineTo(760, 900); g.closePath(); g.fill();
      pineRow(g, 1460, 14, 12, 120, '#1f4536', -300, 1380);
      g.fillStyle = '#244a3a'; g.fillRect(-300, 1440, 1680, 900);
      return;
    }
    /* the cable and both stations */
    g.strokeStyle = '#1b1233'; g.lineWidth = 6; g.beginPath(); g.moveTo(CAB0[0], CAB0[1]); g.lineTo(CAB1[0], CAB1[1]); g.stroke();
    g.fillStyle = CREAM; g.fillRect(CAB1[0] - 70, CAB1[1] - 30, 150, 80); g.fillStyle = '#5a2e5e'; g.beginPath(); g.moveTo(CAB1[0] - 90, CAB1[1] - 30); g.lineTo(CAB1[0] + 5, CAB1[1] - 92); g.lineTo(CAB1[0] + 100, CAB1[1] - 30); g.closePath(); g.fill();
    g.fillStyle = '#3a2a4e'; g.fillRect(CAB1[0] - 30, CAB1[1] + 4, 36, 46);
    g.fillStyle = CREAM; g.fillRect(CAB0[0] - 80, CAB0[1] - 10, 160, 90); g.fillStyle = '#5a2e5e'; g.fillRect(CAB0[0] - 96, CAB0[1] - 30, 192, 28);
    /* the cabin climbs (eases into the top station) */
    var k = eio(seg(t, T.cab0, T.cab1)), x = lerp(CAB0[0] + 40, CAB1[0] - 40, k), y = lerp(CAB0[1] - 40, CAB1[1] + 30, k), sway = .06 * Math.sin(t * 4.4) * (1 - k * .6);
    g.save(); g.translate(x, y); g.rotate(sway); g.strokeStyle = '#1b1233'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 64); g.stroke();
    g.fillStyle = ORG; rr(g, -66, 60, 132, 104, 14); g.fill(); g.fillStyle = '#ffe2b8'; g.fillRect(-52, 78, 44, 40); g.fillRect(8, 78, 44, 40); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-66, 146, 132, 18);
    g.fillStyle = '#1b1233'; circle(g, -12, 0, 10); g.fill(); circle(g, 12, 0, 10); g.fill(); g.restore();
  }
  function ovMount(g, t) {
    /* jury r1: the labels sit beside the mountain (right of the cable) and are uncovered by the first coin stroke, never laid on the foil */
    chipIn(g, t, 'MOUNT CHILIAD', 680, 1180, T.ch2a, T.mz - .5, { bg: TEAL, px: 58, rot: -.03, from: 40 });
    chipIn(g, t, "GTA 5'S HIGHEST PEAK", 650, 1298, T.ch2b, T.mz - .5, { bg: CREAM, px: 46, rot: .02, from: 40, ph: 2 });
  }

  /* =========================== WORLD 4: the mural (our redraw from PC Gamer's description) =========================== */
  var MB = [[230, 860], [410, 860], [610, 860], [790, 860]], MS = [[250, 1175], [510, 1175], [770, 1175]];
  function wMural(g, t, L) {
    if (L === 'bg') {
      g.fillStyle = '#6d5a73'; g.fillRect(-600, -1260, 2280, 4400);
      var r = mulberry(61); g.strokeStyle = 'rgba(30,20,40,.25)'; g.lineWidth = 3;
      for (var y = -1260; y < 3140; y += 70) { g.beginPath(); g.moveTo(-600, y); g.lineTo(1680, y); g.stroke(); for (var x = -600 + ((y + 1260) / 70 % 2) * 70; x < 1680; x += 140) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 70); g.stroke(); } }
      /* the painted wall panel */
      g.fillStyle = STONE; g.fillRect(110, 470, 800, 900); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(110, 1370, 800, 12);
      for (var i = 0; i < 900; i++) { g.fillStyle = 'rgba(90,70,50,' + (.03 + r() * .08).toFixed(3) + ')'; g.fillRect(110 + r() * 800, 470 + r() * 900, 2 + r() * 6, 2 + r() * 6); }
      return;
    }
    var nr = NOREC;
    /* the eye, with painted rays */
    var ek = cd(t, T.eye, 12);
    if (t >= T.eye - .02) {
      g.save(); g.translate(510, 680); g.scale(ek * kn(t, T.eye + .1, .06), ek);
      g.strokeStyle = GOLD; g.lineWidth = 10; for (var i = 0; i < 14; i++) { var a = i * TAU / 14 + .1 * osc(t, 2, 0); g.beginPath(); g.moveTo(Math.cos(a) * 112, Math.sin(a) * 92); g.lineTo(Math.cos(a) * (150 + 10 * Math.sin(t * 3 + i)), Math.sin(a) * (128 + 10 * Math.sin(t * 3 + i))); g.stroke(); }
      g.fillStyle = '#fff3c4'; g.beginPath(); g.moveTo(-120, 0); g.quadraticCurveTo(0, -110, 120, 0); g.quadraticCurveTo(0, 110, -120, 0); g.fill(); g.strokeStyle = INK2; g.lineWidth = 8; g.stroke();
      g.fillStyle = '#2c6e8a'; circle(g, 0, 0, 44); g.fill(); g.fillStyle = INK2; circle(g, 0, 0, 20); g.fill();
      g.restore();
    }
    /* connected boxes, each marked with an X; the line draws through them */
    if (t >= T.box0 - .02) {
      var bk = seg(t, T.box0, T.box0 + .7);
      g.save(); g.strokeStyle = INK2; g.lineWidth = 7; g.beginPath(); g.moveTo(MB[0][0], MB[0][1]); var L2 = 3 * bk; for (var j = 1; j <= 3; j++) { var f = clamp(L2 - (j - 1), 0, 1); if (f <= 0) break; g.lineTo(lerp(MB[j - 1][0], MB[j][0], f), lerp(MB[j - 1][1], MB[j][1], f)); } g.stroke();
      g.beginPath(); g.moveTo(510, 775); g.lineTo(510, 808); g.stroke();
      MB.forEach(function (b, j) { var tin = T.box0 + j * .18; if (t < tin) return; var s = cd(t, tin, 18); g.save(); g.translate(b[0], b[1]); g.scale(s, s); g.fillStyle = '#efe6d2'; g.fillRect(-52, -52, 104, 104); g.strokeStyle = INK2; g.lineWidth = 7; g.strokeRect(-52, -52, 104, 104); g.strokeStyle = RED; g.lineWidth = 9; g.beginPath(); g.moveTo(-26, -26); g.lineTo(26, 26); g.moveTo(26, -26); g.lineTo(-26, 26); g.stroke(); g.restore(); });
      g.restore();
    }
    /* the bottom row: UFO, egg, jetpack man, each on its word */
    [[T.ufo, drawUfo], [T.egg, drawEgg], [T.jet, drawJet]].forEach(function (q, j) {
      if (t < q[0] - .02) return; var s = cd(t, q[0], 14) * kn(t, q[0] + .1, .07), b = MS[j];
      g.save(); g.translate(b[0], b[1]); g.scale(s, s); g.fillStyle = '#efe6d2'; g.fillRect(-105, -105, 210, 210); g.strokeStyle = INK2; g.lineWidth = 8; g.strokeRect(-105, -105, 210, 210); q[1](g, t); g.restore();
      if (t >= q[0] && t < q[0] + .45) KIT.impact(g, b[0], b[1], t - q[0], .55, HOT);
    });
    if (t >= T.jq - .02 && t < T.n3 + .45) { g.save(); g.globalAlpha *= 1 - sm(t, T.n3 + .15, .25); slam(g, '?', 858, 1080, 150, t - T.jq, { col: TEAL, lw: 13, rot: .12 + .03 * osc(t, 9, 2) }); g.restore(); }
    /* mur3: pins and red string out to the fan theories */
    if (t >= T.n1 - .02) {
      /* jury r2: only readings the sources report (BRIEF facts 7 and 11): 100% completion (PC Gamer 2016, GamesRadar+ 2025) and "just put in there to mess with people" (Hinchliffe, GamesRadar+ 2024) */
      var NOTES = [[T.n1, P.th1, 300, 993, -.02], [T.n2, P.th2, 720, 993, .02]];
      NOTES.forEach(function (n) {
        if (t < n[0] - .02) return; var k = sm(t, n[0], .3), jig = t >= T.argue ? .06 * Math.exp(-(t - T.argue) * 3) * Math.sin((t - T.argue) * 30) : 0;
        g.save(); g.strokeStyle = RED; g.lineWidth = 6; g.beginPath(); g.moveTo(510, 770); g.lineTo(lerp(510, n[2], k), lerp(770, n[3] - 62, k)); g.stroke(); g.restore();
        if (k >= 1) {
          var s = kn(t, n[0] + .3, .08); g.save(); g.translate(n[2], n[3]); g.rotate(n[4] + jig); g.scale(s, s); NOREC = nr || t < n[0] + .4; putW(g, n[1], 0, 0); NOREC = nr; g.restore();
          g.fillStyle = RED; circle(g, n[2], n[3] - 62, 12); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; circle(g, n[2] - 4, n[3] - 66, 4); g.fill();
        }
        g.fillStyle = RED; circle(g, 510, 770, 12); g.fill();
      });
    }
  }
  function ovMural(g, t) {
    var zo = sm(t, T.mzo, .45);
    chipIn(g, t, 'OUR DRAWING · AS PC GAMER DESCRIBES IT', 510, lerp(1360, 1222, zo), T.ourM, T.F3.drop + .3, { bg: CREAM, px: 40, from: 30 });
    /* jury r2: clear of the caption tape (≥ 16 px), tucked on the board's top edge */
    chipIn(g, t, 'FAN THEORIES', 510, 568, T.fan, T.F3.drop + .3, { bg: HOT, px: 52, rot: -.03, from: -30 });
    /* jury r1: the stake, sourced (GamesRadar+, 2024-11-05: a 44,000-member subreddit, "no one is giving up"); slaps on at "44,000", pinned in the gap after "argue" */
    if (t >= T.n44 - .02 && t < T.F3.drop + .4) {
      var k = cd(t, T.n44, 13), nr = NOREC, pk = cd(t, T.pinT, 18), jg = t >= T.pinT ? .05 * Math.exp(-(t - T.pinT) * 5) * Math.sin((t - T.pinT) * 34) : 0;
      /* jury r2: off the mural, on the wall below the board, past tense and dated */
      g.save(); g.translate(510, 1345 + (1 - k) * 60); g.rotate(-.05 + jg + .004 * osc(t, 7, 1)); var s0 = lerp(1.25, 1, k) * kn(t, T.n44 + .1, .05); g.scale(s0, s0); g.globalAlpha *= fin(t, T.n44, .06);
      NOREC = nr || k < .98; putW(g, P.note44, 0, 0); NOREC = nr;
      if (t >= T.pinT - .02) { var ps = lerp(1.8, 1, pk); g.save(); g.translate(0, -78); g.scale(ps, ps); put(g, P.pin, 0, 0); g.restore(); }
      g.restore();
    }
  }
  function drawUfo(g, t) { var b = 6 * Math.sin(t * 5); g.translate(0, b); g.fillStyle = '#9fd3e6'; g.beginPath(); g.ellipse(0, -18, 36, 30, 0, Math.PI, TAU); g.fill(); g.fillStyle = '#7a8496'; g.beginPath(); g.ellipse(0, 0, 82, 24, 0, 0, TAU); g.fill(); g.strokeStyle = INK2; g.lineWidth = 5; g.stroke(); g.fillStyle = GOLD; [-50, -18, 18, 50].forEach(function (x) { circle(g, x, 2, 7); g.fill(); }); g.fillStyle = 'rgba(255,230,120,.5)'; g.beginPath(); g.moveTo(-28, 22); g.lineTo(28, 22); g.lineTo(52, 92); g.lineTo(-52, 92); g.closePath(); g.fill(); }
  function drawEgg(g) { g.fillStyle = '#fbf3e4'; g.beginPath(); g.moveTo(0, -78); g.bezierCurveTo(58, -78, 66, 30, 60, 46); g.bezierCurveTo(52, 82, -52, 82, -60, 46); g.bezierCurveTo(-66, 30, -58, -78, 0, -78); g.fill(); g.strokeStyle = INK2; g.lineWidth = 6; g.stroke(); g.fillStyle = 'rgba(0,0,0,.08)'; g.beginPath(); g.ellipse(18, 30, 30, 34, 0, 0, TAU); g.fill(); }
  function drawJet(g, t) {
    var b = 5 * Math.sin(t * 7); g.translate(0, b - 10); g.lineCap = 'round'; g.strokeStyle = INK2; g.lineWidth = 9;
    g.fillStyle = '#7a8496'; rr(g, -40, -40, 26, 62, 8); g.fill(); g.stroke();
    g.fillStyle = ORG; g.beginPath(); g.moveTo(-38, 26); g.lineTo(-27, 60 + 10 * Math.sin(t * 25)); g.lineTo(-16, 26); g.closePath(); g.fill();
    circle(g, 8, -58, 18); g.fillStyle = INK2; g.fill();
    g.beginPath(); g.moveTo(8, -40); g.lineTo(4, 20); g.moveTo(6, -24); g.lineTo(46, -46); g.moveTo(6, -24); g.lineTo(-14, 0); g.moveTo(4, 20); g.lineTo(-10, 66); g.moveTo(4, 20); g.lineTo(30, 62); g.stroke();
  }

  /* =========================== WORLD 5: Mount Gordo at night, the ghost =========================== */
  var STARS = (function () { var r = mulberry(88), s = []; for (var i = 0; i < 60; i++) s.push([r() * 1380 - 150, r() * 1100 - 100, 2 + r() * 4, r() * TAU, 1 + Math.floor(r() * 4)]); return s; })();
  var RKY = 1180;
  function wNight(g, t, L) {
    if (L === 'bg') {
      var gr = g.createLinearGradient(0, -200, 0, 1500); gr.addColorStop(0, '#070b24'); gr.addColorStop(1, '#22306b'); g.fillStyle = gr; g.fillRect(-300, -300, 1680, 2620);
      STARS.forEach(function (s) { g.globalAlpha = .45 + .55 * Math.abs(Math.sin(TAU * s[4] * t / DUR * 3 + s[3])); g.fillStyle = CREAM; g.save(); g.translate(s[0], s[1]); star5(g, s[2] * 1.6, s[2] * .6); g.fill(); g.restore(); });
      g.globalAlpha = 1; g.fillStyle = '#f3ecd2'; circle(g, 230, 420, 70); g.fill(); g.fillStyle = '#0d1336'; circle(g, 262, 400, 64); g.fill();
      /* the sea with moving wave strips */
      g.fillStyle = '#16245a'; g.fillRect(-300, 1150, 1680, 1300);
      for (var i = 0; i < 9; i++) { var y = 1180 + i * 46, x = (i * 173 + 120 * t * (1 + i % 3) / 4) % 400 - 400; g.strokeStyle = 'rgba(159,211,230,' + (.2 + .05 * (i % 3)) + ')'; g.lineWidth = 5; for (var xx = x; xx < 1500; xx += 400) { g.beginPath(); g.moveTo(xx, y); g.quadraticCurveTo(xx + 50, y - 14, xx + 100, y); g.quadraticCurveTo(xx + 150, y + 14, xx + 200, y); g.stroke(); } }
      /* Mount Gordo: a dark headland on the left with the lighthouse */
      g.fillStyle = '#0f2a2e'; g.beginPath(); g.moveTo(-300, 1500); g.lineTo(-300, 900); g.bezierCurveTo(100, 820, 300, 760, 470, 860); g.bezierCurveTo(620, 950, 760, 1100, 900, 1200); g.lineTo(1000, 1500); g.closePath(); g.fill();
      g.fillStyle = '#163a3e'; g.beginPath(); g.moveTo(-300, 1700); g.lineTo(-300, 1100); g.bezierCurveTo(200, 1040, 600, 1100, 1100, 1350); g.lineTo(1380, 1700); g.closePath(); g.fill();
      g.fillStyle = '#1f2a33'; g.fillRect(-300, 1500, 1680, 900);
      /* the rock the ghost stands on */
      g.fillStyle = '#4b5a6e'; g.beginPath(); g.moveTo(380, RKY); g.lineTo(450, RKY - 70); g.lineTo(800, RKY - 90); g.lineTo(880, RKY - 20); g.lineTo(900, RKY + 160); g.lineTo(360, RKY + 170); g.closePath(); g.fill();
      g.fillStyle = '#5d6d82'; g.beginPath(); g.moveTo(450, RKY - 70); g.lineTo(800, RKY - 90); g.lineTo(780, RKY - 60); g.lineTo(470, RKY - 44); g.closePath(); g.fill();
      return;
    }
    /* the lighthouse and its sweeping beam (a flat paper wedge) */
    var lx = 240, ly = 830;
    var ba = .45 * Math.sin(TAU * 2 * t / DUR * 3), bk = .22 + .1 * Math.sin(t * 2);
    g.save(); g.translate(lx, ly - 150); g.rotate(ba); g.fillStyle = 'rgba(255,240,180,' + bk.toFixed(3) + ')'; g.beginPath(); g.moveTo(0, 0); g.lineTo(560, -90); g.lineTo(560, 90); g.closePath(); g.fill(); g.restore();
    g.fillStyle = CREAM; g.beginPath(); g.moveTo(lx - 34, ly); g.lineTo(lx - 22, ly - 140); g.lineTo(lx + 22, ly - 140); g.lineTo(lx + 34, ly); g.closePath(); g.fill();
    g.fillStyle = RED; g.fillRect(lx - 30, ly - 70, 60, 26); g.fillStyle = GOLD; g.fillRect(lx - 20, ly - 170, 40, 30); g.fillStyle = INK2; g.beginPath(); g.moveTo(lx - 28, ly - 170); g.lineTo(lx, ly - 196); g.lineTo(lx + 28, ly - 170); g.closePath(); g.fill();
    /* the ghost */
    if (t >= T.gh0 - .02 && t < T.mid + .4) {
      var ga = sm(t, T.gh0, .7), fl = t >= T.mid - .2 ? (Math.sin((t - T.mid) * 70) > 0 ? 1 : .3) * (1 - seg(t, T.mid, T.mid + .32)) : 1;
      var gsc = .85; g.save(); g.globalAlpha *= ga * fl * .92; g.translate(470, RKY - 70 - 660 * gsc + 10 * osc(t, 7, 1) - 40 * (1 - ga)); g.rotate(.02 * osc(t, 5, 2)); g.drawImage(P.ghost, -210 * gsc, -60 * gsc, 420 * gsc, 760 * gsc); g.restore();
    }
    /* JOCK, brushed in red paint across the rock face */
    if (t >= T.jock - .02 && t < T.mid + .4) {
      var pk = seg(t, T.jock, T.jock + .38), jf = t >= T.mid - .2 ? (Math.sin((t - T.mid) * 70 + 1) > 0 ? 1 : .35) * (1 - seg(t, T.mid, T.mid + .32)) : 1;
      g.save(); g.globalAlpha *= jf; g.beginPath(); g.rect(370, RKY - 120, 520 * pk + 10, 320); g.clip(); var nr = NOREC; NOREC = nr || pk < 1; putW(g, P.jock, 630, RKY + 60); NOREC = nr; g.restore();
      if (pk > 0 && pk < 1) { g.save(); g.translate(380 + 500 * pk, RKY + 40 + 30 * Math.sin(pk * 9)); g.rotate(.7); g.fillStyle = '#6b4a2a'; g.fillRect(-10, -120, 20, 110); g.fillStyle = RED; rr(g, -18, -14, 36, 40, 8); g.fill(); g.restore(); }
    }
  }
  function ovNight(g, t) {
    if (t >= T.E0) return;
    chipIn(g, t, 'MOUNT GORDO', 300, 1360, T.ch3, T.gz + .2, { bg: TEAL, px: 58, rot: -.03, from: 40 });
    /* jury r2: every secret is tagged the same way */
    chipIn(g, t, 'OUR DRAWING', 260, 1370, T.gz + .45, T.E0 - .1, { bg: CREAM, px: 44, rot: -.02, from: 30 });
    /* the clock: hands spin to 11:00 and land on "eleven" */
    clock11(g, t);
    /* gho3: an arrow from the tag to JOCK, the tag HER HUSBAND with two rings */
    if (t >= T.arr - .02 && t < T.mid + .3) { g.save(); g.globalAlpha *= 1 - seg(t, T.mid, T.mid + .25); KIT.arrow(g, 780, 960, 735, 1120, sm(t, T.arr, .3), CREAM, 10, -.3); g.restore(); }
    if (t >= T.husb - .02) {
      /* held still (no sway) so the screenshot reads */
      var hk = cd(t, T.husb, 13), nr2 = NOREC; g.save(); g.translate(740, 860 + (1 - hk) * -40); g.rotate(.04); g.globalAlpha *= fin(t, T.husb, .08); NOREC = nr2 || hk < .98; putW(g, P.husb, 0, 0); NOREC = nr2; g.restore();
    }
  }
  function clock11(g, t) {
    if (t < T.clk0 - .02 || t >= T.E0) return;
    var k = cd(t, T.clk0, 10), o = sm(t, T.clkOut, .4), x = lerp(760, 805, o), y = lerp(610, 585, o), s = lerp(.4, .82, k) * lerp(1, .58, o) * kn(t, T.mid, .12);
    g.save(); g.globalAlpha *= fin(t, T.clk0, .1); g.translate(x, y); g.scale(s, s); put(g, P.clockFace, 0, 0);
    if (t >= T.mid) { g.strokeStyle = HOT; g.lineWidth = 14; g.globalAlpha *= 1 - seg(t, T.mid, T.mid + .5); circle(g, 0, 0, 110 + 90 * eo(seg(t, T.mid, T.mid + .5))); g.stroke(); g.globalAlpha = 1; }
    /* the minute hand turns five times from 6:00 and lands on 12 at 11:00, creeps through the hour, and strikes 12:00 at midnight (jury r1) */
    var sp = 1 - eo(seg(t, T.clk0, T.c11)), hrs = 11 - 5 * sp + .9 * eio(seg(t, T.c11 + .4, T.mid - .15)) + .1 * eo(seg(t, T.mid - .05, T.mid + .03));
    var am = TAU * hrs - Math.PI / 2, ah = TAU * hrs / 12 - Math.PI / 2;
    g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(ah) * 52, Math.sin(ah) * 52); g.stroke();
    g.lineWidth = 7; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(am) * 80, Math.sin(am) * 80); g.stroke(); g.fillStyle = HOT; circle(g, 0, 0, 10); g.fill();
    g.restore();
    /* the time tag pops only once the hands have landed */
    chipIn(g, t, '11 PM', 760, 770, T.c11, T.clkOut, { bg: GOLD, px: 64, rot: -.03, from: -20 });
    chipIn(g, t, 'GAME TIME', 760, 850, T.c11 + .12, T.clkOut, { bg: CREAM, px: 42, rot: .02, from: -20, ph: 3 });
  }

  /* =========================== WORLD 6: GTA 6, Nov 19 2026 =========================== */
  function wEnd(g, t, L) {
    if (L === 'bg') {
      var gr = g.createLinearGradient(0, -200, 0, 2100); gr.addColorStop(0, '#2a1457'); gr.addColorStop(.55, '#c2347a'); gr.addColorStop(1, '#ff8a3d'); g.fillStyle = gr; g.fillRect(-300, -300, 1680, 2620);
      var r = mulberry(71); g.fillStyle = 'rgba(255,255,255,.07)'; for (var y = -100; y < 2100; y += 34) for (var x = (y / 34 % 2) * 17 - 100; x < 1300; x += 34) { circle(g, x, y, 4 + 3 * (y / 2100)); g.fill(); }
      return;
    }
    /* the calendar page lands on "November" */
    var k = cd(t, T.cal, 11), nr = NOREC, qk = sm(t, T.qUp, .4), cy = lerp(lerp(-300, 850, k), 765, qk), cs = lerp(1, .78, qk);
    /* jury r1: the drifting pages pass behind the calendar and the GTA 6 panel, never over their type */
    endDrift(g, t);
    if (t >= T.cal - .02) { g.save(); g.translate(510, cy); g.rotate(-.04 + (1 - k) * .5 + .01 * osc(t, 6, 1)); g.scale(cs * kn(t, T.n19, .05), cs * kn(t, T.n19, .05)); NOREC = nr || k < .98 || (qk > 0 && qk < 1); putW(g, P.cal, 0, 0); NOREC = nr; g.restore(); put(g, P.pin, 510 - 236 * cs, cy - 300 * cs); put(g, P.pin, 510 + 236 * cs, cy - 300 * cs); }
    if (t >= T.panIn - .02) {
      var pk = cd(t, T.panIn, 12);
      /* on "ghost?": a small cut-paper ghost peeks up from behind the GTA 6 panel */
      if (t >= T.yes - .25) { var gk = cd(t, T.yes - .25, 9); g.save(); g.globalAlpha *= .9; g.translate(245, lerp(1380, 1085, gk) + 6 * osc(t, 7, 2)); g.rotate(-.08 + .03 * osc(t, 5, 1)); g.drawImage(P.ghost, -92, -26, 184, 333); g.restore(); }
      g.save(); g.translate(lerp(1200, 510, pk), 1305); g.rotate(-.03 + .008 * osc(t, 7, 2)); NOREC = nr || pk < .98; putW(g, P.end6, 0, 0); NOREC = nr; g.restore();
      /* YES / NO, both cream, nothing picked (the comments answer) */
      chipIn(g, t, 'YES', 420, 1098, T.yes, DUR + 1, { bg: CREAM, px: 66, rot: -.04, from: 30 });
      chipIn(g, t, 'NO', 640, 1098, T.yes + .1, DUR + 1, { bg: CREAM, px: 66, rot: .04, from: 30, ph: 2 });
      if (t >= T.coinE - .02) { var ck = cd(t, T.coinE, 10); g.save(); ownClip(g); g.translate(lerp(1000, 812, ck) + 10 * Math.sin(t * 6), 1200 + 14 * Math.sin(t * 4.6)); g.rotate(-.5 + .2 * Math.sin(t * 5)); g.scale(1.2, 1.2); put(g, P.coin, 0, 0); g.restore(); }
    }
  }
  /* small torn calendar pages drifting down behind the page (time passing) */
  function endDrift(g, t) {
    var cols = [HOT, TEAL, ORG, GOLD];
    for (var i = 0; i < 7; i++) {
      var sp = 1 + (i % 2), ph = hash(i + 5) * TAU, x = 150 + (i * 113 + hash(i) * 60) % 720 + 26 * osc(t, 3 * sp, ph), y = 300 + ((hash(i + 9) * 1130 + 1130 * sp * 3 * t / DUR) % 1130);
      g.save(); g.globalAlpha = .55; g.translate(x, y); g.rotate(.5 * osc(t, 2 * sp, ph)); g.scale(.9 * Math.cos(TAU * 4 * sp * t / DUR + ph), .9);
      g.fillStyle = '#f4ead6'; g.fillRect(-26, -32, 52, 64); g.fillStyle = cols[i % 4]; g.fillRect(-26, -32, 52, 11);
      g.fillStyle = 'rgba(29,18,51,.25)'; g.fillRect(-16, -10, 32, 4); g.fillRect(-16, 2, 22, 4); g.restore();
    }
  }
  /* a torn calendar page sweeping up: the night → GTA 6 change */
  function pageSweep(g, t, tm) {
    var k = seg(t, tm - .27, tm + .27); if (k <= 0 || k >= 1) return;
    var y = lerp(1980, -2150, eio(k)); g.save(); g.translate(-10, y); g.rotate(-.03); g.scale(1, 1.32); put(g, P.sweep, 0, 0); g.restore();
  }
  /* a foil sheet sweeping up: the loop seam, back into frame 0 */
  function foilSweep(g, t, tm) {
    var k = seg(t, tm - .27, tm + .27); if (k <= 0 || k >= 1) return;
    var y = lerp(1980, -2100, eio(k)); g.save(); g.translate(0, y); g.drawImage(P.foil[0], 0, 0, W, H, 0, 0, W, 2080); g.restore();
  }

  /* ---------- textures ---------- */
  function buildTextures() {
    GRAIN = buildGrain();
    P.alien = paperFrost(alienCanvas('#9bb39a', '#2c3a3a', '#141a24')); P.alienBlur = blurred(P.alien, 9); P.alienDark = blurred(alienCanvas('#000', '#000', null), 6, '#081128');
    P.ghost = ghostCanvas(); P.coin = coinPiece();
    P.foil = [1, 2, 3].map(foilCanvas); FC = mk(W, H); FG = FC.getContext('2d');
    P.ticket = cardPiece(760, 900, CREAM, [['3 SECRETS', 92, INK, -372], ['GTA 5 · 2013', 50, HOT, 382]], { r: 18, ring: 'rgba(29,18,51,.25)', before: function (g) {
      g.fillStyle = HOT; g.fillRect(-380, -450, 760, 20); g.fillStyle = TEAL; g.fillRect(-380, 430, 760, 20);
      g.fillStyle = 'rgba(29,18,51,.05)'; for (var y = -450; y < 450; y += 12) g.fillRect(-380, y, 760, 1);
    } });
    P.panel = [0, 1, 2].map(function (i) { return cardPiece(640, 190, '#c3c9d2', [['SECRET ' + (i + 1), 70, '#3a3f4e', 4]], { r: 10, before: function (g) { var gr = g.createLinearGradient(-320, -95, 320, 95); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-320, -95, 640, 190); } }); });
    P.stNo = buildStamp(['NO', 'CRACK'], 120, 420);
    /* JOCK in red paint: hand-lettered, speckled like a brush on stone; no drips */
    var jrec = [];
    P.jock = piece([-250, -110, 250, 110], rect(-250, -110, 250, 110), 'rgba(0,0,0,0)', { shadow: false, edge: false, grain: 0, extra: function (g) {
      var tw = inkText(g, 'JOCK', 0, 0, 200, RED, 141, { dense: 30, big: 1.8, ls: 4, rot: -.05 }); jrec.push([-tw / 2, -100, tw / 2, 90, 'JOCK']);
    } });
    wordsOf(P.jock, jrec);
    P.note44 = cardPiece(720, 160, '#fff1a1', [['44,000 JOINED THE HUNT', 60, INK, -22], ['SUBREDDIT · GAMESRADAR, NOV 2024', 38, INK2, 44, 'condensed']], { r: 4, ring: 'rgba(29,18,51,.2)', before: function (g) { g.fillStyle = 'rgba(160,120,0,.12)'; g.fillRect(-360, -80, 720, 26); } });
    P.th1 = cardPiece(370, 136, GOLD, [['100%', 56, INK, -24], ['COMPLETION?', 56, INK, 34]], { r: 6, ring: 'rgba(29,18,51,.25)' });
    P.th2 = cardPiece(390, 136, GOLD, [['JUST TO MESS', 56, INK, -24], ['WITH YOU?', 56, INK, 34]], { r: 6, ring: 'rgba(29,18,51,.25)' });
    P.husb = cardPiece(300, 170, CREAM, [['HER', 46, INK, -48], ['HUSBAND', 66, HOT, 12]], { r: 10, ring: 'rgba(29,18,51,.25)', after: function (g) { g.strokeStyle = GOLD; g.lineWidth = 7; circle(g, -16, 60, 15); g.stroke(); circle(g, 12, 60, 15); g.stroke(); } });
    P.clockFace = piece([-112, -112, 112, 112], function (g) { g.beginPath(); g.arc(0, 0, 110, 0, TAU); }, CREAM, { sx: 5, sy: 9, blur: 14, extra: function (g) {
      g.strokeStyle = ORG; g.lineWidth = 14; g.beginPath(); g.arc(0, 0, 103, 0, TAU); g.stroke();
      for (var i = 0; i < 12; i++) { var a = i * TAU / 12; g.strokeStyle = INK; g.lineWidth = i % 3 ? 3 : 7; g.beginPath(); g.moveTo(Math.cos(a) * 76, Math.sin(a) * 76); g.lineTo(Math.cos(a) * 90, Math.sin(a) * 90); g.stroke(); }
    } });
    P.pin = piece([-16, -16, 16, 16], function (g) { g.beginPath(); g.arc(0, 0, 14, 0, TAU); }, TEAL, { sx: 3, sy: 5, blur: 5, edge: 1.5, after: function (g) { g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(-4, -4, 4, 0, TAU); g.fill(); } });
    var PADC = '#f4ead6';
    P.cal = cardPiece(560, 640, PADC, [['GTA 6', 64, INK, -278], ['NOV', 96, HOT, -168], ['19', 250, INK, 8], ['2026', 92, INK, 182], ['PS5 · XBOX SERIES X|S', 40, INK2, 268, 'condensed']], { r: 10, sy: 14, before: function (g) {
      g.fillStyle = TEAL; g.fillRect(-280, -320, 560, 86); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-280, -320, 560, 6);
      g.strokeStyle = 'rgba(29,18,51,.15)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-240, 236); g.lineTo(240, 236); g.stroke();
    } });
    P.end6 = cardPiece(700, 200, '#c3c9d2', [['GTA 6 · ???', 104, '#3a3f4e', 6]], { r: 12, before: function (g) { var gr = g.createLinearGradient(-350, -100, 350, 100); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-350, -100, 700, 200); } });
    /* the night → GTA 6 change: one big torn calendar page */
    var tp2 = jag(301, 1100, 10), bt2 = jag(302, 1100, 10);
    P.sweep = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp2[0][1]); tp2.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt2.length - 1; i >= 0; i--) g.lineTo(bt2[i][0], 1560 + bt2[i][1]); g.closePath(); }, PADC, { sx: 0, sy: 10, blur: 20, ps: .6, extra: function (g) {
      g.fillStyle = TEAL; g.fillRect(0, -20, 1100, 120);
      g.strokeStyle = 'rgba(29,18,51,.16)'; g.lineWidth = 4; for (var c = 0; c <= 7; c++) { g.beginPath(); g.moveTo(60 + c * 140, 260); g.lineTo(60 + c * 140, 1460); g.stroke(); } for (var r2 = 0; r2 <= 6; r2++) { g.beginPath(); g.moveTo(60, 260 + r2 * 200); g.lineTo(1040, 260 + r2 * 200); g.stroke(); }
      g.fillStyle = 'rgba(255,79,163,.35)'; g.fillRect(62 + 3 * 140, 262 + 2 * 200, 136, 196);
    } });
  }

  /* ---------- which world, and its camera ---------- */
  var WORLD = { ice: wIce, bridge: wBridge, mount: wMount, mural: wMural, night: wNight, end: wEnd };
  function worldAt(t) {
    if (t < T.F1.drop + .3) return 'ice';
    if (t < T.F2.drop + .3) return 'bridge';
    if (t < T.mz) return 'mount';
    if (t < T.F3.drop + .3) return 'mural';
    if (t < T.E0) return 'night';
    return 'end';
  }
  function camOf(w, t) {
    var c = { s: 1, cx: 510, cy: 900, dx: 0, dy: 0 };
    if (w === 'ice') { c.s = 1.06 - .06 * sm(t, -.2, 2.4); c.cy = 1000; c.dy = 340 * (1 - eo(seg(t, -.25, 1.5))); }
    else if (w === 'bridge') { var k = sm(t, T.camD, .8); c.s = 1 + .32 * k; c.cy = 1400; c.dy = -260 * k; c.dx = 10 * osc(t, 2, 0); }
    else if (w === 'mount') { var z = eio(seg(t, T.mz - .7, T.mz)); c.s = (1 + .04 * seg(t, T.F2.drop, T.mz)) * (1 + 1.6 * z * z); c.cx = 720; c.cy = 600; c.dx = -210 * z; c.dy = 300 * z; }
    else if (w === 'mural') { var s0 = lerp(1.3, 1, cd(t, T.mz, 8)), z2 = sm(t, T.mzo, .45); c.s = lerp(s0, .66, z2); c.cy = 470; c.dy = lerp(430 * (1 - s0), 130, z2); }
    else if (w === 'night') { c.s = 1 + .05 * sm(t, T.gz, 1.2); c.cx = 630; c.cy = 1180; }
    return c;
  }
  function applyCam(g, c, t) {
    var bs = 1 + .008 * osc(t, 9, .7);
    g.translate(c.cx + c.dx, c.cy + c.dy); g.scale(c.s * bs, c.s * bs); g.translate(-c.cx, -c.cy);
  }

  /* ---------- captions (the voice, phrase by phrase; the hook line is carried by the picture) ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1 };
  var KEEP = { 'cable car': 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    var o2 = [];
    outc.forEach(function (ws) {
      var id0 = ws.id; if (ws.length <= 6) { o2.push(ws); return; }
      var cut = -1;
      for (var i = 1; i < ws.length - 2; i++) if (/,$/.test(ws[i].w)) { cut = i; break; }
      if (cut < 0) { var best = 1e9; for (i = 2; i < ws.length - 2; i++) { if (GLUE[norm(ws[i].w)] || KEEP[norm(ws[i].w) + ' ' + norm(ws[i + 1].w)]) continue; var d = Math.abs(i + 1 - ws.length / 2); if (d < best) { best = d; cut = i; } } }
      if (cut < 0) { o2.push(ws); return; }
      var a1 = ws.slice(0, cut + 1), a2 = ws.slice(cut + 1); a1.id = a2.id = id0; o2.push(a1); o2.push(a2);
    });
    return o2.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 400, NUMW = {};
  function captions(g, t) {
    /* jury r2: one caption state per frame (every motion-blur sample of a frame rounds to the same time), so a swap never blends */
    t = tq(t);
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0) return;
    /* jury r1: a card is either fully up or gone (swap inside one frame, never a half-read ghost) */
    var nx = CAPS[ci + 1], ns = nx ? nx.s : 1e9, end = Math.min(card0.t1 + .5, ns);
    if (t >= end) return;
    var fi = 1, outk = 1;
    var CY = CAPY, k = cd(t, card0.s, 16);
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
        var held = NUMW[norm(w.w)] && t < w.t0 - .02;
        if (held) { x += ws[i] + gap; return; }
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
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 860, 520, 510, 900, 1300); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.45)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var tt = t >= T.W5 ? t - DUR : t, w = worldAt(tt), C = camOf(w, tt), fn = WORLD[w];
    if (LIVE2.bg) { g.save(); applyCam(g, C, t); fn(g, tt, 'bg'); g.restore(); vignette(g); }
    g.save(); railClip(g); applyCam(g, C, t); fn(g, tt, 'fg'); g.restore();
    g.save(); railClip(g); if (w === 'ice') ovIce(g, tt); ovBridge(g, tt); ovMount(g, tt); ovMural(g, tt); ovNight(g, tt); g.restore();
    g.save(); [T.F1, T.F2, T.F3].forEach(function (F) { foil(g, tt, F); }); g.restore();
    if (LIVE2.bg) { g.save(); pageSweep(g, t, T.E0); foilSweep(g, t, T.W5); g.restore(); }
    if (!POSTERMODE && LIVE.text && t < T.W5 - .1) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('gta5', 'GTA 5', 0, T.dim0); Tx('gta5', 'GTA 5', T.W5 + .1, DUR + 1);
    Tx('hides', 'STILL HIDES THIS', 0, T.dim0); Tx('hides', 'STILL HIDES THIS', T.W5 + .1, DUR + 1);
    Tx('tk', '3 SECRETS', T.tk0 + .3, T.F1.drop + .3); Tx('tk2', 'GTA 5 · 2013', T.tk0 + .3, T.F1.drop + .3);
    [T.F1, T.F2, T.F3].forEach(function (F, i) { Tx('f' + i, String(i + 1), F.drop + .1, foilState(0, F).end + .12); });
    Tx('fm', 'FIRST MISSION', T.ch1a + .1, T.ch1out); Tx('ny', 'NORTH YANKTON', T.ch1b + .1, T.ch1out);
    Tx('our1', 'OUR DRAWING', T.our1 + .1, T.F2.drop - .05);
    Tx('no', 'NO CRACK', T.HITS[0] + .05, T.F2.drop - .05);
    /* the two Chiliad labels are uncovered by the first stroke of SECRET 2 */
    Tx('mc', 'MOUNT CHILIAD', T.F2.sc + SDUR, T.mz - .5); Tx('hp', "GTA 5'S HIGHEST PEAK", T.F2.sc + SDUR, T.mz - .5);
    Tx('jq', '?', T.jq + .1, T.n3 + .2);
    Tx('ourM', 'OUR DRAWING · AS PC GAMER DESCRIBES IT', T.ourM + .1, T.F3.drop + .3);
    Tx('fan', 'FAN THEORIES', T.fan + .1, T.F3.drop + .12);
    Tx('n44a', '44,000 JOINED THE HUNT', T.n44 + .1, T.F3.drop + .15); Tx('n44c', 'SUBREDDIT · GAMESRADAR, NOV 2024', T.n44 + .1, T.F3.drop + .15);
    Tx('n1', '100% COMPLETION?', T.n1 + .3, T.F3.drop + .1); Tx('n2', 'JUST TO MESS WITH YOU?', T.n2 + .3, T.F3.drop + .1);
    Tx('gordo', 'MOUNT GORDO', T.ch3 + .1, T.gz + .2); Tx('ourG', 'OUR DRAWING', T.gz + .55, T.E0 - .1);
    Tx('pm', '11 PM', T.c11 + .1, T.clkOut); Tx('gt', 'GAME TIME', T.c11 + .2, T.clkOut);
    Tx('jock', 'JOCK', T.jock + .38, T.mid + .1);
    Tx('husb', 'HER HUSBAND', T.husb + .1, T.E0);
    Tx('cal', 'GTA 6 NOV 19 2026', T.cal + .3, T.W5); Tx('plat', 'PS5 · XBOX SERIES X|S', T.cal + .3, T.W5);
    Tx('e6', 'GTA 6 · ???', T.panIn + .2, T.W5);
    Tx('yes', 'YES', T.yes + .1, T.W5); Tx('nope', 'NO', T.yes + .2, T.W5);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function scrapes(F, tag) {
    for (var i = 0; i < 3; i++) {
      var t0 = F.sc + i * (SDUR + SGAP), under = VOICED.some(function (v) { return v.t1 > t0 - .05 && v.t0 < t0 + SDUR + .05; }), atStart = VOICED.some(function (v) { return v.t1 > t0 - .03 && v.t0 < t0 + .12; });
      EV.push({ t: t0, type: 'scrape', g: !under ? 1 : atStart ? .3 : .6, id: tag + i });
    }
  }
  function initTimes() {
    /* hook: the ice creaks before the first word; the torch lands on the shape on "secrets"; ? after the line */
    G('crk0', .02, 'crack', .03, .8, { m: .02, dur: .15, light: true }); T.sec = at('hook', 'secrets.');
    G('q', after('hook'), 'pop', .35, 1);
    /* jury r1: the ticket (3 SECRETS) drops in small under the headline on "secrets" and grows to full size when the headline leaves */
    T.tk0 = T.sec - .12; T.dim0 = start('ask') - .45;
    T.pan = [at('ask', 'three'), at('ask', 'you'), at('ask', 'go')];
    T.pan.forEach(function (p, i) { G('pan' + i, p + .08, 'pop', .08, .7); });
    T.coinIn = at('ask', 'yourself.');
    /* one: foil SECRET 1 (ice-blue), scraped; the bridge over the frozen creek */
    T.F1 = { n: 1, drop: wend('ask', 'yourself.') + .3 }; T.F1.sc = T.F1.drop + SHOLD; G('f1', T.F1.drop, 'swish', .3, 1, { dur: .18 }); scrapes(T.F1, 's1');
    T.ch1a = at('ice1', 'in'); T.ch1b = at('ice1', 'first'); T.ch1out = at('ice2', 'frozen') + .3;
    G('ch1a', T.ch1a, 'pop', .1, .6); G('ch1b', T.ch1b, 'pop', .1, .6);
    T.car0 = T.F1.sc + .9; G('car', T.car0 + .4, 'swish', .2, .5);
    T.camD = start('ice2') - .1; T.al0 = at('ice2', 'alien');
    T.ring1 = at('ice2', 'frozen'); T.our1 = G('our1', after('ice2'), 'crack', .35, .3, { heavy: true });
    /* ice3: crosshair; a ting off the ice between the question and "Nothing" lands the NO CRACK stamp; two more tings after the line */
    T.xh0 = start('ice3') - .35; T.noK = at('ice3', 'nothing');
    T.HITS = [G('h1', wend('ice3', 'ice?') + .08, 'ting', .25, 1, { m: .04, dur: .18, trim: 6 }), G('h2', after('ice3') - .05, 'ting', .3, .9), G('h3', after('ice3') + .3, 'ting', .35, .8)];
    /* two: foil SECRET 2 (dusk-purple) arrives once NO CRACK has been read; "Two." lands on it */
    T.F2 = { n: 2, drop: Math.max(T.HITS[2] + .18, T.HITS[0] + .05 + 2.05) }; T.F2.drop = Math.min(T.F2.drop, start('mur1') - .12); T.F2.sc = T.F2.drop + SHOLD; T.shotOut = T.F2.drop - .15; G('f2', T.F2.drop, 'swish', .3, 1); scrapes(T.F2, 's2');
    T.ch2a = T.F2.drop + .3; T.ch2b = T.ch2a + .05;
    T.cab0 = T.F2.sc + .3; T.cab1 = at('mur2', 'mural:') - .3; G('clank', wend('mur1', 'chiliad.') + .2, 'clank', .3, .8, { m: .06 });
    /* the mural: zoom into the station on "A mural", then the eye, the boxes, UFO, egg, jetpack */
    T.mz = at('mur2', 'a', 1) - .15; G('mz', T.mz - .2, 'swish', .35, .8, { m: .04, dur: .14, trim: 10.5 });
    /* jury r1: the UFO box pops when its caption card appears (the card starts .04 s before its first word) */
    T.eye = T.mz - .12; T.box0 = T.mz + .08; T.ufo = at('mur2', 'a', 1) - .04; T.egg = at('mur2', 'egg,'); T.jet = at('mur2', 'jetpack.'); T.jq = at('mur2', 'maybe');
    G('pJet', after('mur2'), 'pop', .35, 1);
    T.ourM = T.ufo + .2;
    /* jury r2: the board steps back before "But"; the dated note and the two sourced readings come in on the question */
    T.mzo = start('mur3') - .45; T.n44 = start('mur3'); T.n1 = at('mur3', 'what'); T.n2 = at('mur3', 'means?'); T.n3 = T.n2; T.fan = at('mur3', 'means?') - .1; T.argue = at('mur3', 'decade.');
    T.pinT = G('pin', after('mur3'), 'thock', .35, 1);
    /* three: foil SECRET 3 (night-navy) once the 44,000 note has been read; Mount Gordo at night; the clock lands on 11 */
    T.F3 = { n: 3, drop: Math.max(wend('mur3', 'decade.') + .45, T.n44 + 3.47, T.n2 + 3.05) }; T.F3.drop = Math.min(T.F3.drop, start('gho1') - .12); T.F3.sc = T.F3.drop + SHOLD; G('f3', T.F3.drop, 'swish', .3, 1); scrapes(T.F3, 's3');
    T.ch3 = at('gho1', 'climb'); T.clk0 = at('gho1', 'gordo') - .3; T.c11 = at('gho1', '11');
    G('c11', wend('gho1', 'pm.') + .1, 'thock', .5, 1);
    T.gz = start('gho2') - .1; T.gh0 = start('gho2') - .2; G('ghost', start('gho2') - .3, 'whoosh', .3, 1, { m: .05 });
    T.clkOut = at('gho2', 'rock,');
    T.jock = at('gho2', 'jock.'); G('brush', after('gho2'), 'brush', .35, 1.2, { dur: .3, trim: 1.5 });
    T.husb = at('gho3', 'her') - .2; T.arr = at('gho3', "husband's"); G('husb', after('gho3'), 'pop', .35, 1);
    /* jury r1: midnight. The clock strikes 12 with a tock in the gap before "GTA 6"; the ghost and JOCK go with it (BRIEF fact 8) */
    T.mid = G('tock', start('end') - .55, 'tock', .3, 1, { dur: .15 });
    T.E0 = start('end') - .05; G('page', T.E0 - .15, 'swish', .3, 1);
    T.cal = T.E0 - .15; T.n19 = at('end', '19th.'); T.panIn = at('end', 'november') + .1; G('pan6', wend('end', '19th.') + .05, 'thock', .3, .9, { m: .05 });
    T.qUp = wend('end', '19th.') - .12; T.yes = at('end', 'will'); T.coinE = at('end', 'ghost?') + .2;
    T.W5 = DUR - .35; G('w5', T.W5 - .2, 'swish', .3, .9);
    STRESS = [['ice2', 'alien'], ['ice3', 'nothing'], ['mur1', 'chiliad.'], ['mur2', 'ufo,'], ['mur2', 'egg,'], ['mur2', 'jetpack.'], ['mur3', 'decade.'], ['gho1', '11'], ['gho2', 'ghost'], ['gho2', 'jock.'], ['gho3', "husband's"], ['end', 'november'], ['end', 'ghost?']].map(function (p) { return at(p[0], p[1]); });
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

  /* ---------- sound: paper and foil foley written into the pauses; no music (Isac adds a TikTok sound) ---------- */
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
    function swish(t, g) { band(t, t + .26, 600, 3600, .09 * g, .02 * g, 1.3, -.2); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); }
    function pop(t, g) { thump(t, .3 * g, 320); tick(t, 1.1 * g, 2600); band(t, t + .06, 2400, 1200, .06 * g, .01 * g, 1.2); }
    function clank(t, g) { osc2('triangle', 523, t, t + .3, [[t, 0], [t + .003, .2 * g], [t + .2, 0]]); osc2('triangle', 811, t, t + .25, [[t, 0], [t + .003, .12 * g], [t + .16, 0]]); thump(t, .45 * g, 170); tick(t, 1.4 * g, 2200); for (var j = 1; j < 4; j++) { tick(t + j * .06, .6 * g, 1800); thump(t + j * .06, .12 * g, 260); } }
    /* a coin dragged over foil: gritty high band noise with a rough rhythm, high-passed so it sits above the voice */
    function scrape(t, g) {
      var d = SDUR; band(t, t + d, 3000, 5200, .3 * g, .22 * g, 1.4, (rnd() - .5) * .4, 'bandpass');
      for (var j = 0; j < 22; j++) tick(t + j * d / 22 + rnd() * .006, (.15 + rnd() * .2) * g, 2600 + rnd() * 3000);
    }
    /* a hit off the ice: a short metallic ping */
    function ting(t, g) { osc2('sine', 2650, t, t + .3, [[t, 0], [t + .002, .14 * g], [t + .22, 0]]); osc2('sine', 3970, t, t + .2, [[t, 0], [t + .002, .07 * g], [t + .14, 0]]); tick(t, 1.2 * g, 4000); }
    /* ice cracking: a cluster of sharp ticks over a low groan */
    function crack(t, g, heavy, light) { if (light) { for (var q = 0; q < 7; q++) tick(t + q * .012 + rnd() * .006, (.7 + rnd() * .5) * g, 1800 + rnd() * 2400); return; } for (var j = 0; j < 9; j++) tick(t + j * .014 + rnd() * .01, (.6 + rnd() * .6) * g, 1500 + rnd() * 2500); thump(t, .4 * g, 130); if (heavy) boom(t + .01, .35 * g, 90, 40, .5); band(t, t + .22, 500, 180, .05 * g, .01 * g, 1.2, 0, 'lowpass'); }
    function whoosh(t, g) { band(t, t + .45, 260, 900, .14 * g, .03 * g, 1, -.1, 'bandpass'); band(t + .05, t + .4, 1800, 900, .03 * g, .01 * g, 2, .1); }
    /* a wet brush stroke on stone */
    function brush(t, g) { band(t, t + .34, 700, 1900, .16 * g, .05 * g, .9, .1, 'bandpass'); band(t, t + .3, 300, 500, .06 * g, .02 * g, 1, 0, 'lowpass'); }
    /* the clock striking midnight: a short wood-block tock, 0.15 s */
    function tock(t, g) { osc2('triangle', 1250, t, t + .16, [[t, 0], [t + .002, .22 * g], [t + .12, 0]]); osc2('sine', 620, t, t + .16, [[t, 0], [t + .002, .18 * g], [t + .14, 0]]); thump(t, .35 * g, 200); tick(t, 1.1 * g, 2400); }
    function flap(t, g) { thump(t, .3 * g, 180); band(t, t + .12, 1200, 600, .1 * g, .01 * g, 1); }
    var LEVEL = { tock: 3, swish: 14, thock: 2, pop: 4.6, clank: 2.4, scrape: 3, ting: 4, crack: 2.4, whoosh: 6, brush: 5, flap: 4 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = window.SFX_TYPE_DB || { tock: -16, swish: -8, thock: -10, pop: -17, clank: -12, scrape: -4, ting: -12, crack: -5, whoosh: -9, brush: -3, flap: -11 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (e.trim || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'pop') pop(e.t, g);
      else if (e.type === 'clank') clank(e.t, g);
      else if (e.type === 'scrape') scrape(e.t, g);
      else if (e.type === 'ting') ting(e.t, g);
      else if (e.type === 'crack') crack(e.t, g, e.heavy, e.light);
      else if (e.type === 'whoosh') whoosh(e.t, g);
      else if (e.type === 'brush') brush(e.t, g);
      else if (e.type === 'flap') flap(e.t, g);
      else if (e.type === 'tock') tock(e.t, g);
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

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-secrets', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.husb + 1.0) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: 'Still hides', t0: 0, t1: T.F1.drop }, { id: 'ice', name: 'The alien in the ice', t0: T.F1.drop, t1: T.F2.drop }, { id: 'mural', name: 'The Chiliad mural', t0: T.F2.drop, t1: T.F3.drop }, { id: 'ghost', name: 'The ghost at 11 PM', t0: T.F3.drop, t1: T.E0 }, { id: 'end', name: 'GTA 6', t0: T.E0, t1: DUR }]; };

  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the bleed backgrounds off and no clip, every shape and glyph must stay inside x 90-930 and above y 1450 */
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 1; var bad = [], n = Math.round(DUR * fps);
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
