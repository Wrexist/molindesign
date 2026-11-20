/* "GTA 6 hit 7.9 million live viewers": Delta launch-week news Short. Streams Charts (read 2026-11-20): GTA VI's launch
   peaked at 7,915,475 concurrent viewers across tracked livestream platforms (Nov 19 recap; 7,914,273 "preliminary" on
   Nov 18), more than 4.5 times the previous game-launch record, Valorant's closed beta (April 2020, 1,737,267). Twitch alone
   peaked at 3,313,371, the top gaming category in Twitch history by peak viewers (ahead of League of Legends, 3.11M), a
   record among games only. Platform peaks may come from different moments, so they are never shown as parts of 7.9M.
   Viewers, not people, players or sales. Sources in BRIEF.md.
   A vertical film written in code, narrated first and cut to the voice: every beat is keyed to a word time from vo/vo.js
   (window.VO) with at(id, word); every hit sits in a pause the voice track really leaves (vo/vad.js). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Set: the tally room (navy cut-paper wall, a
   kraft shelf, a brass hand tally counter as the hero prop, paper towers of stacked viewer discs, oxblood stamps). No
   Twitch/YouTube/Kick/Streams Charts logos (names typed in our font), no Riot or Rockstar art, no music. Engine from gta-99. */
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
     THE SET: the tally room. A navy cut-paper wall bleeds the whole frame, a kraft shelf runs across it at y 1300
     (texture only outside the rail). The hero prop is a brass hand tally counter, its wheels already reading
     7,915,475 (slammed final, never rolled). Viewers are paper discs: loose tokens in a heap, or stacked into
     towers on the shelf (pink = GTA 6, grey = Valorant's closed beta, violet = League of Legends). Native move:
     the tower drop (discs fall and stack, each settles once, never bouncy). Oxblood stamps on newsprint.
     ===================================================================================================== */
  var NAVY = '#14234a', NAVY2 = '#0a1430';
  var PINK = '#ff3d8b', PINK2 = '#c2185b', PINKD = '#7d0c3d', PINKF = '#ff6aa6';
  var CRM = '#fbf5e6', OXI = '#a3202c', RED2 = '#cf2a33';
  var BRASS = '#d6a842', BRASS2 = '#f6dc8a', BRASS3 = '#a0731f', BRASSD = '#4f370c';
  var GREYF = '#d2d0db', GREY = '#9a98a6', GREY2 = '#6f6d7c', GREYD = '#3f3d4c';
  var VIOF = '#b3a3e6', VIO2 = '#5f4f96', VIOD = '#2f2559';
  INK = '#16182e';
  var D = {};
  var SHELF = 1300, DTH = 16.5;

  /* ---------- pieces ---------- */
  /* a viewer disc seen from the side: a short paper slab (top ellipse + band); stacked, only the bands show */
  function discPiece(face, side, dark, w) {
    var ry = w * .15, th = DTH;
    return piece([-w / 2, -ry, w / 2, ry + th], function (g) { g.beginPath(); g.ellipse(0, 0, w / 2, ry, 0, Math.PI, TAU); g.ellipse(0, th, w / 2, ry, 0, 0, Math.PI); g.closePath(); }, side, { sy: 3, sx: 2, blur: 4, sc: 'rgba(0,4,20,.4)', pad: 10, edge: 1.6, edgeCol: 'rgba(255,248,235,.75)', extra: function (g) {
      g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(-w / 2, th * .55, w, th + ry);
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(-w / 2 + w * .12, 0, w * .1, th + ry);
      g.beginPath(); g.ellipse(0, 0, w / 2, ry, 0, 0, TAU); g.fillStyle = face; g.fill();
      g.beginPath(); g.ellipse(0, 0, w / 2 - 18, ry - 6, 0, 0, TAU); g.strokeStyle = dark; g.globalAlpha = .5; g.lineWidth = 3; g.stroke(); g.globalAlpha = 1;
      eye(g, 0, 0, w * .16, ry * .55, dark);
    } });
  }
  /* the viewer mark: a plain almond eye, cut from the same paper */
  function eye(g, x, y, rx, ry, col) {
    g.save(); g.translate(x, y); g.beginPath(); g.moveTo(-rx, 0); g.quadraticCurveTo(0, -ry * 1.6, rx, 0); g.quadraticCurveTo(0, ry * 1.6, -rx, 0); g.closePath();
    g.fillStyle = 'rgba(255,250,240,.9)'; g.fill(); g.strokeStyle = col; g.lineWidth = 2; g.stroke();
    g.beginPath(); g.arc(0, 0, ry * .75, 0, TAU); g.fillStyle = col; g.fill(); g.restore();
  }
  /* a loose viewer token seen from above (heap, streams) */
  function tokenPiece(face, dark) {
    var R = 36;
    return piece([-R, -R, R, R], function (g) { g.beginPath(); g.arc(0, 0, R, 0, TAU); }, face, { sy: 5, sx: 3, blur: 6, sc: 'rgba(0,4,20,.45)', pad: 12, edge: 2, extra: function (g) {
      g.beginPath(); g.arc(0, 0, R - 8, 0, TAU); g.strokeStyle = dark; g.globalAlpha = .45; g.lineWidth = 3; g.stroke(); g.globalAlpha = 1;
      eye(g, 0, 0, 17, 9, dark);
    } });
  }
  function brassV(g, y0, y1) { var gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, BRASS2); gr.addColorStop(.45, BRASS); gr.addColorStop(1, BRASS3); return gr; }
  function brassH(g, x0, x1) { var gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, BRASS3); gr.addColorStop(.35, BRASS2); gr.addColorStop(.7, BRASS); gr.addColorStop(1, BRASS3); return gr; }
  var CBW = 640, CBH = 360;
  function buildCounter() {
    /* the finger ring (behind the body, out to the left) */
    D.ring = piece([-66, -66, 66, 66], function (g) { g.beginPath(); g.arc(0, 0, 64, 0, TAU); g.arc(0, 0, 40, 0, TAU, true); }, function (g) { return brassV(g, -64, 64); }, { sy: 8, blur: 12, sc: 'rgba(0,4,20,.5)', edgeCol: 'rgba(255,240,190,.85)' });
    D.knob = piece([-20, -56, 20, 56], rectP(40, 112, 8), function (g) { return brassH(g, -20, 20); }, { sy: 6, blur: 8, extra: function (g) { g.fillStyle = 'rgba(79,55,12,.5)'; for (var y = -50; y < 56; y += 9) g.fillRect(-20, y, 40, 3); } });
    D.plg = piece([-58, -40, 58, 84], function (g) { g.beginPath(); g.rect(-22, -6, 44, 90); rr(g, -58, -40, 116, 42, 16); }, function (g) { return brassH(g, -58, 58); }, { sy: 6, blur: 10, sc: 'rgba(0,4,20,.45)', edgeCol: 'rgba(255,240,190,.85)', extra: function (g) {
      g.fillStyle = 'rgba(255,255,255,.3)'; rr(g, -48, -34, 96, 9, 4); g.fill();
      g.fillStyle = 'rgba(79,55,12,.35)'; g.fillRect(-22, 10, 44, 6);
    } });
    var rec = [];
    D.body = piece([-CBW / 2, -CBH / 2, CBW / 2, CBH / 2], rectP(CBW, CBH, 84), function (g) { return brassV(g, -CBH / 2, CBH / 2); }, { sy: 18, sx: 8, blur: 28, sc: 'rgba(0,4,20,.62)', edge: 3, edgeCol: 'rgba(255,240,190,.9)', extra: function (g) {
      rr(g, -CBW / 2 + 16, -CBH / 2 + 16, CBW - 32, CBH - 32, 70); stroke(g, 'rgba(79,55,12,.55)', 5);
      rr(g, -CBW / 2 + 25, -CBH / 2 + 25, CBW - 50, CBH - 50, 62); stroke(g, 'rgba(255,240,190,.45)', 3);
      g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(-130, -132, 230, 26, -.05, 0, TAU); g.fill();
      [[-262, -128], [262, -128], [-262, 128], [262, 128]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 12, 0, TAU); g.fillStyle = BRASS3; g.fill(); g.strokeStyle = BRASSD; g.lineWidth = 2; g.stroke(); g.save(); g.translate(p[0], p[1]); g.rotate(p[0] * .01 + p[1] * .02); g.fillStyle = BRASSD; g.fillRect(-9, -2, 18, 4); g.restore(); });
      var WW = 560, WH = 196;
      rr(g, -WW / 2 - 12, -WH / 2 - 12, WW + 24, WH + 24, 28); g.fillStyle = BRASSD; g.fill();
      rr(g, -WW / 2, -WH / 2, WW, WH, 18); g.fillStyle = '#0f0b16'; g.fill();
      var digits = '7915475', cw = 68, gc = 24, total = 7 * cw + 2 * gc, x = -total / 2;
      for (var i = 0; i < 7; i++) {
        if (i === 1 || i === 4) { ptxt(g, null, ',', x + gc / 2, 52, 96, BRASS2, { ls: 0 }); x += gc; }
        var wg = g.createLinearGradient(0, -WH / 2 + 12, 0, WH / 2 - 12); wg.addColorStop(0, '#07050b'); wg.addColorStop(.5, '#3a3346'); wg.addColorStop(1, '#07050b');
        rr(g, x + 3, -WH / 2 + 12, cw - 6, WH - 24, 6); g.fillStyle = wg; g.fill();
        ptxt(g, rec, digits[i], x + cw / 2, 8, 124, CRM, { ls: 0, st: 'extra-condensed' });
        x += cw;
      }
      g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(-WW / 2, -WH / 2); g.lineTo(-WW / 2 + 190, -WH / 2); g.lineTo(-WW / 2 + 100, WH / 2); g.lineTo(-WW / 2, WH / 2); g.closePath(); g.fill();
    } });
    wordsOf(D.body, rec);
  }
  /* the counter: centre (x, y), scale s, tilt rot, plunger press 0..1 */
  function counter(g, x, y, s, rot, press, norec) {
    var nr = NOREC; NOREC = nr || !!norec;
    g.save(); g.translate(x, y); if (rot) g.rotate(rot); g.scale(s, s);
    put(g, D.plg, 262, -CBH / 2 - 52 + 30 * press);
    put(g, D.knob, CBW / 2 + 6, 6);
    put(g, D.ring, -322, 74);
    putW(g, D.body, 0, 0);
    g.restore(); NOREC = nr;
  }
  function band(text, w, px, bg, fg, ls0) { return chipPiece([[text, px, fg, ls0 == null ? 2 : ls0]], w, bg, fg, { lh: px + 8, pad: 20 }); }
  function buildPieces() {
    buildCounter();
    D.dG = discPiece(PINKF, PINK2, PINKD, 220); D.dV = discPiece(GREYF, GREY2, GREYD, 220); D.dV2 = discPiece('#ecebf2', '#a9a7b6', GREYD, 220); D.dL = discPiece(VIOF, VIO2, VIOD, 220);
    D.tP = tokenPiece(PINK, PINKD); D.tC = tokenPiece(CRM, '#5a4a6e'); D.tV = tokenPiece('#9d8fd6', VIOD);
    D.gplate = cardPiece(360, 164, PINK2, [['GTA 6', 136, CRM, 4]], { ring: 'rgba(255,240,245,.55)' });
    D.src = chipPiece([['PEAK · STREAMS CHARTS DATA', 40, INK, 2]], 620, CRM, INK, { lh: 46, pad: 20 });
    D.src2 = chipPiece([['TWITCH ONLY · STREAMS CHARTS DATA', 40, CRM, 2]], 720, VIO2, CRM, { lh: 46, pad: 20 });
    D.src0 = chipPiece([['AT ONCE · PEAK', 46, INK, 3], ['STREAMS CHARTS DATA', 36, '#3b3f5e', 2]], 560, CRM, INK, { lh: 46, pad: 16 });
    D.rec = buildStamp(['LAUNCH RECORD'], 56, 600, OXI);
    D.notch = ['1×', '2×', '3×', '4×', '½'].map(function (s) { return band(s, 78, 40, CRM, INK, 0); });
    D.once = chipPiece([['ALL AT ONCE · PEAK', 64, CRM, 3]], 600, INK, CRM, { lh: 72, pad: 26, ring: 'rgba(251,245,230,.35)' });
    D.flags = ['TWITCH', 'YOUTUBE', 'KICK', '+ MORE'].map(function (s) { return band(s, s.length > 5 ? 230 : 170, 44, CRM, INK, 2); });
    D.q = cardPiece(190, 190, INK, [['?', 150, CRM, 6]], { ring: 'rgba(251,245,230,.35)' });
    D.vtag = chipPiece([['VALORANT', 56, INK, 3], ['CLOSED BETA', 40, '#4a4858', 3]], 300, CRM, INK, { lh: 62, pad: 26, ring: 'rgba(22,24,46,.3)' });
    D.y2020 = datePiece('APRIL', '2020', 300, GREY2);
    D.vband = band('1.74M · 2020', 210, 40, CRM, INK, 1);
    D.gb1 = band('GTA 6', 200, 52, CRM, PINK2, 3); D.gb2 = band('7.9M', 200, 64, INK, CRM, 2);
    D.x45 = buildStamp(['1.74M', '× 4.5'], 104, 180, OXI);
    D.rcpt = (function () { var rec = [], w = 440, h = 600; var pc = piece([-w / 2, -h / 2, w / 2, h / 2], function (g) { var tp = jag(31, w, 4), bt = jag(32, w, 5); g.beginPath(); g.moveTo(-w / 2, -h / 2 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + q[1]); }); for (var i = bt.length - 1; i >= 0; i--) g.lineTo(-w / 2 + bt[i][0], h / 2 + bt[i][1]); g.closePath(); }, '#fbf8ef', { sy: 14, blur: 22, sc: 'rgba(0,4,20,.6)', extra: function (g) {
      ptxt(g, rec, 'SALES', 0, -h / 2 + 80, 92, INK, { ls: 8 });
      g.fillStyle = 'rgba(22,24,46,.5)'; for (var x = -w / 2 + 30; x < w / 2 - 30; x += 18) g.fillRect(x, -h / 2 + 140, 10, 3);
      g.fillStyle = 'rgba(22,24,46,.18)'; [-60, -10, 40, 90].forEach(function (y) { g.fillRect(-w / 2 + 40, y, 150 + (y * 3 % 90), 12); g.fillRect(w / 2 - 110, y, 70, 12); });
      g.fillStyle = 'rgba(22,24,46,.5)'; for (x = -w / 2 + 30; x < w / 2 - 30; x += 18) g.fillRect(x, 150, 10, 3);
      ptxt(g, rec, 'TOTAL', -w / 2 + 40, 214, 64, INK, { align: 'left', ls: 3 });
      g.setLineDash([12, 9]); rr(g, 30, 176, 170, 78, 6); stroke(g, 'rgba(22,24,46,.55)', 4); g.setLineDash([]);
    } }); return wordsOf(pc, rec); })();
    D.neq = buildStamp(['VIEWERS ≠ SALES'], 80, 640, OXI);
    D.tb1 = band('GTA 6', 200, 52, CRM, PINK2, 3); D.tb2 = band('3.31M', 200, 64, INK, CRM, 2);
    D.lb1 = chipPiece([['LEAGUE OF', 40, INK, 2], ['LEGENDS', 46, INK, 2]], 200, CRM, INK, { lh: 48, pad: 18 }); D.lb2 = band('3.11M', 200, 64, VIOD, CRM, 2);
    D.no1 = chipPiece([['#1 GAME EVER', 72, CRM, 3], ['ON TWITCH', 72, CRM, 3], ['BY PEAK VIEWERS', 44, BRASS2, 3]], 500, INK, CRM, { lh: 84, pad: 30, ring: 'rgba(246,220,138,.6)' });
    D.wat = band('WATCHED', 300, 64, CRM, INK, 3); D.ply = band('PLAYED', 300, 64, CRM, INK, 3);
  }
  function buildBackdrop() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(23);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, NAVY2); gr.addColorStop(.42, NAVY); gr.addColorStop(.68, '#101c3d'); gr.addColorStop(1, '#070d22'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    /* cut-paper wall panels: slightly different navy sheets, overlapping, with pale cut edges */
    for (var i = 0; i < 7; i++) { var x = i * 170 - 40 + r() * 30, wv = 190; g.fillStyle = 'rgba(' + (20 + r() * 14 | 0) + ',' + (34 + r() * 16 | 0) + ',' + (72 + r() * 22 | 0) + ',.55)'; g.fillRect(x, 0, wv, SHELF); g.fillStyle = 'rgba(180,200,255,.06)'; g.fillRect(x, 0, 2, SHELF); g.fillStyle = 'rgba(0,0,10,.18)'; g.fillRect(x + wv - 6, 0, 6, SHELF); }
    for (i = 0; i < 7000; i++) { g.fillStyle = r() < .5 ? 'rgba(170,190,255,' + (.012 + r() * .025).toFixed(3) + ')' : 'rgba(0,0,10,' + (.04 + r() * .07).toFixed(3) + ')'; g.fillRect(r() * W, r() * SHELF, 1 + r() * 2, 1 + r() * 4); }
    /* the shelf: a kraft board, its front edge, and the dark wall under it */
    g.fillStyle = '#c9965a'; g.fillRect(0, SHELF - 6, W, 22); g.fillStyle = 'rgba(255,240,210,.35)'; g.fillRect(0, SHELF - 6, W, 4);
    var fg = g.createLinearGradient(0, SHELF + 16, 0, SHELF + 150); fg.addColorStop(0, '#9b6a35'); fg.addColorStop(1, '#6e4823'); g.fillStyle = fg; g.fillRect(0, SHELF + 16, W, 134);
    grainLines(g, 0, SHELF + 18, W, SHELF + 148, 'rgba(60,30,10,.18)', 11, 4);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, SHELF + 150, W, 10);
    var lg = g.createLinearGradient(0, SHELF + 160, 0, H); lg.addColorStop(0, '#0a1230'); lg.addColorStop(1, '#050918'); g.fillStyle = lg; g.fillRect(0, SHELF + 160, W, H - SHELF - 160);
    g.globalAlpha = .28; g.fillStyle = g.createPattern(GRAIN, 'repeat'); g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    var vg = g.createRadialGradient(510, 860, 300, 510, 860, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(2,4,14,.6)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }
  function buildTextures() { GRAIN = buildGrain(); buildPieces(); D.bg = buildBackdrop(); }

  /* =====================================================================================================
     MOVES
     ===================================================================================================== */
  /* the tower drop: n discs fall one by one between t0 and t1 onto base (bottom of the lowest disc) */
  function tower(g, P, x, base, n, t, t0, t1, seed, o) {
    o = o || {}; var fd = o.fd || .2;
    for (var i = 0; i < n; i++) {
      var ti = n > 1 ? lerp(t0, t1, i / (n - 1)) : t1, k = seg(t, ti - fd, ti); if (k <= 0) break;
      var y = base - (i + 1) * DTH, fall = (1 - k * k) * (o.fall || 900), jx = (hash(i * 13 + (seed || 1)) - .5) * 10;
      var nr = NOREC; NOREC = nr || k < 1;
      put(g, P, x + jx, y - fall); NOREC = nr;
    }
  }
  /* a block of n discs falling as one, landing at tl */
  function block(g, P, x, base, n, t, tl, seed) {
    var k = seg(t, tl - .26, tl); if (k <= 0) return;
    var fall = (1 - k * k) * 1300, s = kn(t, tl, .012);
    for (var i = 0; i < n; i++) put(g, P, x + (hash(i * 7 + seed) - .5) * 10, base - (i + 1) * DTH - fall, 0, s, 1);
  }
  /* a tower rising out of the shelf (discs hidden under the shelf edge until they come up) */
  function riser(g, P, x, n, t, t0, t1, seed) {
    var k = eio(seg(t, t0, t1)); if (k <= 0) return;
    var lift = n * DTH * k;
    g.save(); g.beginPath(); g.rect(0, -400, W, SHELF + 2 + 400); g.clip();
    for (var i = 0; i < n; i++) put(g, P, x + (hash(i * 13 + seed) - .5) * 10, SHELF + n * DTH - lift - (i + 1) * DTH);
    g.restore();
  }
  /* a label band wrapped on a tower: slaps on at tl, leaves with the tower */
  function towerTop(n) { return SHELF - n * DTH; }

  /* loose tokens: the heap of viewers that lands all at once */
  var HEAP = (function () {
    var r = mulberry(77), o = [];
    for (var i = 0; i < 84; i++) {
      var x = 170 + r() * 680, u = (x - 510) / 400, h = 250 * Math.max(0, 1 - u * u) + 40, y = 1440 - r() * h;
      o.push({ x: x, y: y, rot: r() * TAU, c: r() < .62 ? 0 : r() < .7 ? 1 : 2, dt: r() * .07, s: .85 + r() * .3 });
    }
    o.sort(function (a, b) { return a.y - b.y; }); return o;
  })();
  function heap(g, t) {
    if (t < T.heap - .3 || t > T.ask + .7) return;
    var nr = NOREC; NOREC = true;
    HEAP.forEach(function (p, i) {
      var ti = T.heap + p.dt, k = seg(t, ti - .24, ti); if (k <= 0) return;
      var fall = (1 - k * k) * 900, ko = eio(seg(t, T.ask + p.dt * 2, T.ask + .45 + p.dt * 2));
      g.save(); g.translate(p.x, p.y - fall + 700 * ko); g.rotate(p.rot + (1 - k) * .8); g.scale(p.s, p.s * .62 * kn(t, ti, .05));
      put(g, [D.tP, D.tC, D.tV][p.c], 0, 0); g.restore();
    });
    NOREC = nr;
  }
  /* two streams of viewer tokens pouring down the gutters (hook and end only; periodic in DUR) */
  function streams(g, t) {
    var a = Math.max(1 - seg(t, T.out1, T.out1 + .3), seg(t, T.endIn, T.endIn + .4)); if (a <= 0) return;
    var L = 1400, N = 6, sp = 8 * L / DUR;
    g.save(); g.globalAlpha *= a; var nr = NOREC; NOREC = true;
    [[156, 0, 0], [864, .5, 1]].forEach(function (S) {
      for (var i = 0; i < N; i++) { var y = 160 + ((t * sp + (i + S[1]) * L / N) % L); g.save(); g.translate(S[0] + 6 * Math.sin(y * .01 + i), y); g.rotate(y * .006 + i); g.scale(.72, .72 * (.55 + .45 * Math.abs(Math.cos(y * .008 + i)))); put(g, (i + S[2]) % 3 ? D.tP : D.tC, 0, 0); g.restore(); }
    });
    NOREC = nr; g.restore();
  }
  /* plunger presses: down in .06 s, back up in .2 s */
  function press(t) { var p = 0; (T.press || []).forEach(function (tp) { var u = t - tp; if (u >= 0 && u < .26) p = Math.max(p, u < .06 ? u / .06 : 1 - (u - .06) / .2); }); return p; }
  function stampOn(g, pc, x, y, rot, tl, tout, t) { slapOn(g, pc, x, y, rot, tl, tout, t, { from: 1.6 }); }

  /* =====================================================================================================
     THE PROP LAYER (screen space, clipped to the rail). Beats in story order; later pieces land on top.
     ===================================================================================================== */
  function props(g, t) {
    var k, x, y, s;
    streams(g, t);
    /* ---- the counter ---- */
    var pr = press(t);
    if (t < T.split + .5) {
      k = eio(seg(t, T.ask, T.ask + .5));
      x = lerp(510, 380, k); y = lerp(740, 1080, k); s = lerp(1, .72, k);
      var kx = eio(seg(t, T.split, T.split + .35)); y += 8 * pr; s *= 1 - .9 * kx;
      var rot = sw(t, GT.c0 || 0, .025, 10, 4) + .03 * Math.sin(Math.PI * k);
      if (kx < 1) { g.save(); g.globalAlpha *= 1 - kx; counter(g, x, y, s, rot, pr, (k > 0 && k < 1) || t > T.split); g.restore(); }
    }
    if (t >= T.endIn - .25) {
      k = seg(t, T.endIn - .2, T.endIn + .2); y = 740 - (1 - k * k) * 1500 + 8 * pr;
      counter(g, 510, y, 1, sw(t, T.endIn + .2, .02, 10, 4), pr, k < 1);
    }
    /* ---- the GTA 6 plate: hook (frame 0), beside the small counter, and back at the loop seam ---- */
    if (t < T.out1 + .5) lift(g, 510, 410, -.01, T.out1, t, function (q) { putW(q, D.gplate, 0, 0); });
    if (t < T.split + .35) { var kp = eio(seg(t, T.split, T.split + .35)); g.save(); g.globalAlpha *= 1 - kp; drop(g, 372, 790, .02, T.ask + .35, null, t, function (q) { q.scale(.75 * (1 - .9 * kp), .75 * (1 - .9 * kp)); putW(q, D.gplate, 0, 0); }, { fd: .26 }); g.restore(); }
    if (t >= DUR - .3) drop(g, 510, 410, -.01, DUR - .04, null, t, function (q) { putW(q, D.gplate, 0, 0); }, { fd: .22, knock: false, spin: 0 });
    /* ---- the hook type: 7.9 MILLION VIEWERS (frame 0, then again for the end and the loop) ---- */
    var ty = 0, ta = 1;
    if (t < T.out1 + .6) { ty = 900 * eio(seg(t, T.out1, T.out1 + .45)); hookType(g, ty, 1, t > T.out1); }
    if (t >= T.typeIn) { var kt = eo(seg(t, T.typeIn, T.typeIn + .16)); g.save(); g.translate(510, 1100); g.scale(lerp(1.25, 1, kt), lerp(1.25, 1, kt)); g.globalAlpha *= fin(t, T.typeIn, .06); g.translate(-510, -1100); hookType(g, 0, 1, kt < 1); g.restore(); }
    /* ---- once: the heap lands all at once; platform flags; ALL AT ONCE ---- */
    heap(g, t);
    D.flags.forEach(function (F, i) {
      var tl = T.flags + i * .07, xs = [240, 430, 620, 785][i], ys = [1150, 1110, 1120, 1165][i];
      if (t < tl - .02 || t > T.ask + .6) return;
      var kf = cd(t, tl, 16), ko = eio(seg(t, T.ask + .05 * i, T.ask + .4 + .05 * i));
      var nr = NOREC; NOREC = nr || kf < .97 || ko > 0;
      g.save(); g.translate(xs, ys + (1 - kf) * 120 + 800 * ko); g.rotate((i % 2 ? .05 : -.05) * (1 + ko));
      g.fillStyle = '#e8d6b0'; g.fillRect(-4, 0, 8, 150); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(2, 0, 3, 150);
      putW(g, F, 0, -10); g.restore(); NOREC = nr;
    });
    slapOn(g, D.once, 510, 985, -.015, T.onceC, T.ask, t);
    /* ---- the source chip and LAUNCH RECORD: hook and once (over the heap) ---- */
    if (t >= T.src - .05 && t < T.ask + .45) { k = eio(seg(t, T.ask, T.ask + .45)); slapOn(g, k < .5 ? D.src0 : D.src, 510, lerp(1272, 1372, k), lerp(.01, 0, k), T.src, null, t); }
    stampOn(g, D.rec, 510, 1365, -.035, T.recV, T.heap, t);
    if (t >= T.ask + .45 && t < T.tw + .5) {
      var kw = seg(t, T.tw, T.tw + .3), sq = Math.abs(Math.cos(Math.PI * kw)), nr0 = NOREC; NOREC = nr0 || (kw > 0 && kw < 1);
      g.save(); g.translate(510, 1372); g.scale(1, sq); putW(g, kw < .5 ? D.src : D.src2, 0, 0); g.restore(); NOREC = nr0;
    }
    if (t >= T.tw + .3 && t < T.endIn + .5) lift(g, 510, 1372, 0, T.endIn - .1, t, function (q) { putW(q, D.src2, 0, 0); }, { d: .4 });
    if (t >= T.endIn + .3) slapOn(g, D.src0, 510, 1284, .01, T.endSrc, T.seamL, t);
    /* ---- ask: an empty dashed slot with a ? ---- */
    if (t >= T.ask + .2 && t < T.vdrop + .1) {
      var ka = fin(t, T.ask + .2, .2) * (1 - seg(t, T.vdrop - .3, T.vdrop));
      g.save(); g.globalAlpha *= ka; g.setLineDash([16, 12]); g.strokeStyle = 'rgba(251,245,230,.75)'; g.lineWidth = 4;
      g.beginPath(); g.ellipse(740, towerTop(10), 110, 33, 0, 0, TAU); g.moveTo(630, towerTop(10)); g.lineTo(630, SHELF); g.moveTo(850, towerTop(10)); g.lineTo(850, SHELF); g.ellipse(740, SHELF, 110, 33, 0, 0, Math.PI); g.stroke(); g.setLineDash([]); g.restore();
    }
    g.save(); var kq = kn(t, GT.q || 1e9, .06); g.translate(740, 860); g.scale(kq, kq); g.translate(-740, -860); stampOn(g, D.q, 740, 860, .04, T.q, T.vdrop - .3, t); g.restore();
    /* ---- old + val: Valorant's closed beta tower, its tag, 1.74M, the 2020 card ---- */
    if (t >= T.vdrop - .3 && t < T.tw + .5) {
      var lv = eio(seg(t, T.tw, T.tw + .45)), nrv = NOREC; NOREC = nrv || lv > 0;
      g.save(); g.translate(0, -1700 * lv);
      tower(g, D.dV, 740, SHELF, 10, t, T.vdrop - .25, T.vdrop, 3);
      for (var b = 0; b < 4; b++) {
        block(g, b % 2 ? D.dV : D.dV2, 740, towerTop(10 + 10 * b), b < 3 ? 10 : 5, t, T.blk[b], 11 + b);
        if (t >= T.blk[b]) { g.save(); g.beginPath(); g.ellipse(740, towerTop(10 + 10 * b) + 1, 112, 33, 0, .08, Math.PI - .08); g.strokeStyle = 'rgba(12,10,24,.85)'; g.lineWidth = 7; g.stroke(); g.restore(); }
      }
      if (t >= T.vband) slapOn(g, D.notch[0], 868, towerTop(5) + 8, .02, T.vband, null, t);
      for (b = 0; b < 4; b++) if (t >= T.blk[b]) slapOn(g, D.notch[b + 1], 868, towerTop(10 + 10 * b + (b < 3 ? 5 : 2.5)) + 8, (b % 2 ? .02 : -.02), T.blk[b] + .04, null, t);
      if (t >= T.lvl) { var kl = eo(seg(t, T.lvl, T.lvl + .35)); g.save(); g.setLineDash([14, 10]); g.strokeStyle = CRM; g.lineWidth = 5; g.beginPath(); var ly = towerTop(46) - 2; g.moveTo(150, ly); g.lineTo(lerp(150, 860, kl), ly); g.stroke(); g.setLineDash([]); g.restore(); }
      slapOn(g, D.vband, 728, SHELF - 84, .0, T.vband, null, t);
      g.restore(); NOREC = nrv;
    }
    slapOn(g, D.vtag, 752, 900, -.02, T.vtag, T.vOut, t, { tape: true });
    stampOn(g, D.y2020, 752, 575, .03, T.y20, T.vOut, t);
    if (t >= T.v174 && t < T.vOut + .4) { var ko2 = eio(seg(t, T.vOut, T.vOut + .35)); g.save(); g.translate(0, -1600 * ko2); slam(g, '1.74M', 752, 745, 132, t - T.v174, { col: CRM, rot: -.03 }); g.restore(); }
    /* ---- times: the GTA 6 tower drops at the left (46 discs = 4.6 Valorant towers of 10) ---- */
    if (t >= T.gdrop0 - .3 && t < T.tw + .5) {
      var lg2 = eio(seg(t, T.tw, T.tw + .45)), nrg = NOREC; NOREC = nrg || lg2 > 0;
      g.save(); g.translate(0, -1700 * lg2);
      tower(g, D.dG, 280, SHELF, 46, t, T.gdrop0, T.gdrop1, 5, { fd: .22 });
      slapOn(g, D.gb2, 280, SHELF - 330, -.01, T.gband, T.buyIn - .2, t);
      slapOn(g, D.gb1, 280, SHELF - 170, .01, T.gband + .08, T.buyIn - .15, t);
      g.restore(); NOREC = nrg;
    }
    /* ---- buy: the room dims; a blank sales receipt; VIEWERS ≠ SALES ---- */
    var dim = dimA(t);
    if (dim > 0 && LIVE2.bg) { g.fillStyle = 'rgba(4,7,20,' + (.72 * dim).toFixed(3) + ')'; g.fillRect(0, 0, W, H); }
    if (t >= T.buyIn && t < T.rcOut + .5) {
      var kr = eo(seg(t, T.buyIn, T.buyIn + .4)), kro = eio(seg(t, T.rcOut, T.rcOut + .42)), nrr = NOREC; NOREC = nrr || kr < 1 || kro > 0;
      var kd = eio(seg(t, T.tw, T.tw + .5)); NOREC = NOREC || (kd > 0 && kd < 1);
      g.save(); g.translate(lerp(510, 300, kd), lerp(860, 800, kd) - 1700 * kro); g.scale(lerp(1, .5, kd), lerp(1, .5, kd));
      putW(g, D.rcpt, 0, 0, -.02 + .2 * kro);
      stampOn(g, D.neq, 0, 270, -.06, T.neq, null, t);
      g.restore();
      NOREC = nrr;
    }
    stampOn(g, D.x45, 508, 880, -.07, T.x45, T.buyIn + .45, t);
    /* ---- twitch: the GTA 6 Twitch tower rises out of the shelf; 3.31M ---- */
    if (t >= T.rise0 && t < T.endIn + .5) {
      var le = eio(seg(t, T.endIn - .05, T.endIn + .4)), nrt = NOREC; NOREC = nrt || le > 0 || t < T.rise1;
      g.save(); g.beginPath(); g.rect(0, -2000, W, SHELF + 2002); g.clip(); g.save(); g.translate(0, 900 * le);
      riser(g, D.dG, 620, 44, t, T.rise0, T.rise1, 7);
      slapOn(g, D.tb2, 620, SHELF - 300, -.01, T.tb2, null, t);
      slapOn(g, D.tb1, 620, SHELF - 150, .01, T.rise1 - .05, null, t);
      g.restore(); g.save(); g.translate(0, 900 * le);
      /* hist: League of Legends lands beside it (41 discs: 3.11 / 3.31 of 44) */
      tower(g, D.dL, 290, SHELF, 41, t, T.lol0, T.lol1, 9, { fd: .2 });
      slapOn(g, D.lb2, 290, SHELF - 300, .01, T.lb, null, t);
      slapOn(g, D.lb1, 290, SHELF - 140, -.01, T.lb + .08, null, t);
      g.restore(); g.restore(); NOREC = nrt;
    }
    slapOn(g, D.no1, 600, 420, -.02, T.no1, T.endIn - .1, t);
    /* ---- end: WATCHED / PLAYED, equal; they peel off before the loop so the last frame is frame 0 ---- */
    slapOn(g, D.wat, 350, 1392, -.02, T.vote, T.seamL, t);
    slapOn(g, D.ply, 670, 1392, .02, T.vote + .06, T.seamL, t);
  }
  function dimA(t) { return 1.18 * seg(t, T.buyIn, T.buyIn + .3) * (1 - seg(t, T.tw, T.tw + .35)); }
  /* 7.9 MILLION / VIEWERS in sticker type (frame 0 words) */
  function hookType(g, dy, a, norec) {
    var nr = NOREC; NOREC = nr || !!norec;
    g.save(); g.translate(0, dy); g.globalAlpha *= a;
    stk(g, '7.9 MILLION', 510, 1032, 140, { col: PINK, st: 'condensed' });
    stk(g, 'VIEWERS', 510, 1168, 124, { col: CRM, st: 'condensed', ls: 6 });
    g.restore(); NOREC = nr;
  }

  /* ---------- captions: cream label tape in the upper third, phrase by phrase (the hook's words are the frame-0 props) ---------- */
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
  function capHidden(t) { return t >= start('hist') - .1 && t < T.endIn; }
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

  var NOISE, POSTERMODE = false;
  var STAGEC = '#0a1430';
  function stage(g) { g.fillStyle = STAGEC; g.fillRect(0, 0, W, H); }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  /* the hook and the end sit slightly pushed in (1.04); the push relaxes over the hook and returns for the loop */
  function push(t) { if (t < 3.4) return 1 + .04 * (1 - eio(seg(t, 0, 3.4))); if (t >= T.endIn) return 1 + .04 * eio(seg(t, T.endIn + .4, DUR)); return 1; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) {
      g.drawImage(D.bg, 0, 0);
      /* a cool screen-glow pool drifts on the wall (periodic in DUR, so the loop is exact) */
      var lx = 510 + 120 * osc(t, 3, .4), ly = 800 + 90 * osc(t, 2, 1.3), gl = g.createRadialGradient(lx, ly, 60, lx, ly, 760);
      gl.addColorStop(0, 'rgba(150,180,255,.16)'); gl.addColorStop(.6, 'rgba(255,90,160,.05)'); gl.addColorStop(1, 'rgba(255,90,160,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, SHELF);
    }
    var ddx = 4 * osc(t, 17, .3) + 2 * osc(t, 29, 1.1), ddy = 3 * osc(t, 13, 2.1) + 2 * osc(t, 31, .7), ps = push(t);
    g.save(); railClip(g); g.translate(510 + ddx, 900 + ddy); g.scale(ps, ps); g.translate(-510, -900);
    var hp = 1 + .08 * eio(seg(t, T.no1, T.endIn - .15)) * (1 - eio(seg(t, T.endIn - .15, T.endIn + .3))); if (hp > 1) { g.translate(620, 900); g.scale(hp, hp); g.translate(-620, -900); }
    props(g, t); g.restore();
    var dm = dimA(t); if (dm > 0 && LIVE2.bg) { g.fillStyle = 'rgba(4,7,20,' + (.72 * dm).toFixed(3) + ')'; g.fillRect(0, 0, BX0, H); g.fillRect(BX1, 0, W - BX1, H); g.fillRect(BX0, BY1, BX1 - BX0, H - BY1); }
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('gp', 'GTA 6', 0, T.out1); Tx('gp', 'GTA 6', T.ask + .4, T.split); Tx('gp', 'GTA 6', DUR - .05, DUR + 1);
    Tx('big', '7.9 MILLION VIEWERS', 0, T.out1); Tx('big', '7.9 MILLION VIEWERS', T.typeIn + .1, DUR + 1);
    Tx('ctr', '7,915,475', 0, T.split); Tx('ctr', '7,915,475', T.endIn + .3, DUR + 1);
    Tx('s0a', 'AT ONCE · PEAK', T.src + .05, T.ask + .2); Tx('s0b', 'STREAMS CHARTS DATA', T.src + .05, T.ask + .2); Tx('src', 'PEAK · STREAMS CHARTS DATA', T.ask + .25, T.tw + .15); Tx('s0a', 'AT ONCE · PEAK', T.endSrc + .05, T.seamL); Tx('s0b', 'STREAMS CHARTS DATA', T.endSrc + .05, T.seamL);
    Tx('src2', 'TWITCH ONLY · STREAMS CHARTS DATA', T.tw + .15, T.endIn - .1);
    Tx('rec', 'LAUNCH RECORD', T.recV + .1, T.heap);
    Tx('once', 'ALL AT ONCE · PEAK', T.onceC + .1, T.ask);
    ['TWITCH', 'YOUTUBE', 'KICK', '+ MORE'].forEach(function (s, i) { Tx('f' + i, s, T.flags + i * .07 + .1, T.ask + .1); });
    Tx('q', '?', T.q + .1, T.vdrop - .3);
    Tx('vtag', 'VALORANT CLOSED BETA', T.vtag + .1, T.vOut);
    Tx('y20', 'APRIL 2020', T.y20 + .1, T.vOut);
    Tx('v174', '1.74M', T.v174 + .1, T.vOut);
    Tx('vband', '1.74M · 2020', T.vband + .1, T.tw);
    Tx('gb', 'GTA 6 7.9M', T.gband + .1, T.buyIn - .2); ['1×', '2×', '3×', '4×', '½'].forEach(function (s, i) { Tx('n' + i + 'x', s, i ? T.blk[i - 1] + .1 : T.vband + .1, T.tw); });
    Tx('x45', '1.74M × 4.5', T.x45 + .1, T.buyIn + .45);
    Tx('sal', 'SALES', T.buyIn + .3, T.rcOut); Tx('tot', 'TOTAL', T.buyIn + .3, T.rcOut);
    Tx('neq', 'VIEWERS ≠ SALES', T.neq + .1, T.rcOut);
    Tx('tb', 'GTA 6 3.31M', T.tb2 + .1, T.endIn - .1);
    Tx('lb', 'LEAGUE OF LEGENDS', T.lb + .18, T.endIn - .1); Tx('lb2', '3.11M', T.lb + .1, T.endIn - .1);
    Tx('n1', '#1 GAME EVER', T.no1 + .1, T.endIn - .1); Tx('n2', 'ON TWITCH', T.no1 + .1, T.endIn - .1); Tx('n3', 'BY PEAK VIEWERS', T.no1 + .1, T.endIn - .1);
    Tx('wat', 'WATCHED', T.vote + .1, T.seamL); Tx('ply', 'PLAYED', T.vote + .16, T.seamL);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    /* hook: the counter on frame 0; a plunger click in the breath after "G T A six"; the source chip; LAUNCH RECORD
       is on screen by 1.9 s; the plate and the type clear in the pause after the hook and the heap lands there */
    T.press = [];
    var c0 = G('c0', wend('hook', '6') + .16, 'click', .3, 1.2, { m: .035 }); T.press.push(c0);
    T.src = .55; T.recV = 1.05;
    T.out1 = G('out1', lastw('hook') + .3, 'swish', .3, 1);
    T.heap = G('heap', T.out1 + .38, 'patter', .3, 1.2);
    T.onceC = start('once') - .02; T.flags = at('once', 'time') - .02;
    G('flags', after('once') + .05, 'pin', .35, 1);
    T.ask = at('ask', 'big') - .1;
    G('q', after('ask') + .05, 'thock', .35, 1.2, { m: .05 }); T.q = T.ask + .25;
    /* old + val */
    T.vdrop = at('old', 'valorants') - .02; G('vdrop', T.vdrop - .12, 'patter', .3, 1, { m: .05 });
    T.vtag = at('old', 'closed') - .02;
    T.v174 = G('v174', start('val') - .14, 'slap', .3, 1.2, { m: .05 });
    T.y20 = at('val', 'back') - .02;
    /* times: the GTA 6 tower pre-rolls into the pause before its line and lands on "GTA 6" */
    T.gdrop1 = G('gdrop', start('times') - .2, 'patter', .3, 1.2); T.gdrop0 = T.gdrop1 - .55;
    T.split = T.gdrop0 - .35;
    T.gband = at('times', 'is') - .02;
    T.blk = [at('times', 'more') - .02, at('times', 'than') - .02, at('times', 'four') - .02, at('times', 'half') + .02];
    T.vOut = T.blk[0] - .35; T.vband = T.vOut + .15;
    T.lvl = G('lvl', after('times') + .03, 'stamp', .35, 1.4); T.x45 = T.lvl;
    /* buy */
    T.buyIn = at('buy', 'buying') + .05;
    T.neq = G('neq', after('buy') - .05, 'stamp', .35, 1.3);
    /* twitch + hist */
    T.tw = start('twitch') - .1;
    T.rise0 = at('twitch', 'peaked') - .02; T.rise1 = at('twitch', '33') + .5; T.tb2 = at('twitch', 'million') - .02;
    T.lol1 = G('lol', after('twitch') + .02, 'patter', .3, 1.2); T.lol0 = T.lol1 - .45; T.rcOut = T.lol1 - .2; T.lb = T.lol0 + .25;
    T.no1 = G('no1', T.lol1 + .3, 'slap', .3, 1.2);
    /* end: the counter is back in the frame-0 layout; WATCHED / PLAYED (equal) */
    T.endIn = Math.max(after('hist') - .1, T.no1 + 2.6);
    T.typeIn = T.endIn + .3; T.endSrc = T.endIn + .45; T.vote = at('end', 'watch') - .02;
    G('ctrIn', T.endIn + .2, 'thock', .3, 1);
    T.press.push(T.endIn + .2);
    T.seamL = DUR - .34; T.capEnd = DUR - .3;
    G('seam', DUR - .06, 'thock', .25, .8);
    STRESS = [['once', 'same'], ['ask', 'big'], ['old', 'valorants'], ['val', '17'], ['val', '2020'], ['times', 'half'], ['buy', 'buying'], ['twitch', '33'], ['hist', 'biggest'], ['end', 'watch'], ['end', 'play']].map(function (p) { return at(p[0], p[1]); });
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

  BODY.thunk = .16; BODY.patter = .12; BODY.thock = .12; BODY.stamp = .2; BODY.slap = .1; BODY.pin = .1; BODY.tick = .05; BODY.click = .1; BODY.swish = .22;
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
    /* the tally click: a bright metal snap, a ratchet tooth and a small brass ring */
    function click(t, g) { tick(t, 2 * g, 3400); thump(t, .25 * g, 700); tick(t + .028, 1.1 * g, 4200); var o = osc2('triangle', 2350, t, t + .12, [[t, 0], [t + .003, .05 * g], [t + .1, 0]]); o.frequency.exponentialRampToValueAtTime(2200, t + .1); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); nband(t, t + .07, 2600, 1300, .08 * g, .01 * g, 1); }
    function slap(t, g) { thump(t, .3 * g, 260); nband(t, t + .06, 3000, 1500, .12 * g, .01 * g, .9); tick(t, 1.2 * g, 2000); nband(t, t + .035, 2200, 1400, .18 * g, .02 * g, 1.4); }
    function pin(t, g) { tick(t, 1.4 * g, 2800); thump(t, .25 * g, 420); }
    function caseT(t, g) { tick(t, .9 * g, 1500); thump(t, .14 * g, 360); nband(t, t + .035, 2400, 1500, .22 * g, .02 * g, 1.4); }
    /* discs landing: a quick run of paper clacks */
    function patter(t, g) { for (var j = 0; j < 5; j++) { tick(t + j * .022, (1 - j * .12) * g, 2400 + j * 150); thump(t + j * .022, .07 * g, 480); } }
    function swish(t, g) { nband(t, t + .2, 900, 3600, .2 * g, .03 * g, .8); }
    var LEVEL = { stamp: 1, click: 4, thock: 5, slap: 3, pin: 4, tick: 6, patter: 4, swish: 3 };
    var TRIM = window.SFX_TRIM || { neq: 9, lvl: 5 };
    var TYPE_DB = window.SFX_TYPE_DB || { stamp: -12, click: -12, thock: -18, slap: -14, pin: -14, tick: -18, patter: -16, swish: -16 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'stamp') stamp(e.t, g);
      else if (e.type === 'click') click(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'pin') pin(e.t, g);
      else if (e.type === 'tick') caseT(e.t, g);
      else if (e.type === 'patter') patter(e.t, g);
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
      window.FILM.POSTER = Math.round((T.lvl + .45) * 30) / 30 + 1 / 60;
      window.FILM.SHOTS = [{ id: 'hook', name: '7.9M', t0: 0, t1: start('ask') }, { id: 'ask', name: 'Old record', t0: start('ask'), t1: start('times') }, { id: 'times', name: '×4.5', t0: start('times'), t1: start('buy') }, { id: 'buy', name: 'Not sales', t0: start('buy'), t1: start('twitch') }, { id: 'twitch', name: 'Twitch', t0: start('twitch'), t1: start('end') }, { id: 'end', name: 'Watch or play?', t0: start('end'), t1: DUR }];
      window.READY = true;
    });
  }

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-streampeak', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
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
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0, x0: 1e9, x1: -1, y0: 1e9, y1: -1 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0a) + Math.abs(d[i + 1] - 0x14) + Math.abs(d[i + 2] - 0x30) > 24) { var px = (i / 4) % w, py = Math.floor(i / 4 / w); o.c++; o.x0 = Math.min(o.x0, px); o.x1 = Math.max(o.x1, px); o.y0 = Math.min(o.y0, y + py); o.y1 = Math.max(o.y1, y + py); } return o; }
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
