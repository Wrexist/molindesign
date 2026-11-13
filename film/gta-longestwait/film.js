/* "GTA 6's 13 years isn't a record": Delta, pillar 4 (gaming-wide hooks that end on GTA 6).
   A vertical film written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). The hero prop is a tower of wall-calendar pads, one pad per year. Frame 0: GTA 6's tower of 13 pads (the
   13th landing), a swinging 13 tag and NOT A RECORD. Its height is taped on the wall in pink (GTA 5 Sept 17 2013 → GTA 6
   Nov 19 2026, 13 yrs 2 mo); one rival tower then builds under it and through it: Kingdom Hearts III 13 yrs 1 mo (Japan
   to Japan), Psychonauts 2 16 yrs 4 mo, Shenmue III 18 yrs 2 mo (launched Nov 19 2019: the two NOV 19 pages), Streets
   of Rage 4 26 yrs 1 mo, almost twice GTA 6. One measure on screen: release → next numbered game, first release anywhere.
   Engine from film/gta-price (paper pieces, VAD gate, fontStretch re-apply, rail scan); a new set (a paper waiting room).
   Our own flat props: no footage, logos, key art or box art of any game, no console logos; no music. */
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

  BODY.tear = .1; BODY.thock = .12; BODY.pop = .1; BODY.clank = .32; BODY.zip = .32; BODY.tick = .05; BODY.stamp = .27; BODY.swish = .26;

  /* =====================================================================================================
     THE SET: a paper waiting room. A plum wall with a darker wainscot and a cream chair rail, kraft floorboards,
     a paper wall clock at the top whose hands sweep the whole film, a height-chart ruler that scales with the camera,
     and torn calendar pages drifting down behind the props. No sun, no spotlights, no stripes, no confetti.
     THE PROP: calendar towers. One pad = one year. World units: a pad is PBW wide and PBH tall; the camera maps
     world (x, y-up from the floor) to the screen around the floor line FY with one scale s(t).
     Our own flat props only: no logos, key art, box art or footage of any game; titles are our own type.
     ===================================================================================================== */
  var FY = 1250, PBW = 400, PBH = 48, GX = 330, RX = 560;
  var GTAY = (13 + 2 / 12) * PBH;               /* GTA 5 → GTA 6: 13 yrs 2 mo (BRIEF derived) */
  var PLUM = '#2b1745', PLUM2 = '#1f1035', WOOD = '#b98450', WOOD2 = '#8d5c30', PADC = '#f4ead6', GOLD = '#ffc83d', INK2 = '#2a1850';
  var DRIFT = [];
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

  /* ---------- the calendar pad: one year. Cream block, a coloured binding with two rings, a row of day squares,
     page edges at the foot. Drawn with its foot at (0, 0) and its top at -PBH (world units, screen-up = -y). ---------- */
  function padPiece(bind, seed) {
    var r = mulberry(seed), hot = Math.floor(r() * 7);
    return piece([-PBW / 2, -PBH, PBW / 2, 0], function (g) { rr(g, -PBW / 2, -PBH, PBW, PBH, 5); }, PADC, { ps: 1.6, sx: 3, sy: 4, blur: 6, edge: 1.6, extra: function (g) {
      g.fillStyle = bind; g.fillRect(-PBW / 2, -PBH, PBW, 13);
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-PBW / 2, -PBH, PBW, 3);
      [-110, 110].forEach(function (x) { g.fillStyle = INK2; g.beginPath(); g.arc(x, -PBH + 6.5, 4.5, 0, TAU); g.fill(); g.strokeStyle = '#d9dce6'; g.lineWidth = 2.4; g.beginPath(); g.arc(x, -PBH + 1, 6.5, Math.PI * .1, Math.PI * .9, true); g.stroke(); });
      for (var i = 0; i < 7; i++) { var x = -PBW / 2 + 38 + i * 54; g.strokeStyle = 'rgba(29,18,51,.28)'; g.lineWidth = 1.4; g.strokeRect(x, -PBH + 19, 28, 13); if (i === hot) { g.fillStyle = bind; g.globalAlpha = .55; g.fillRect(x + 2, -PBH + 21, 24, 9); g.globalAlpha = 1; } }
      g.fillStyle = 'rgba(120,80,40,.28)'; for (var y = -9; y < -1; y += 2.4) g.fillRect(-PBW / 2 + 3, y, PBW - 6, .9);
    } });
  }
  /* the hanging 13 tag: punched hole, cream card, a pink top band, the number hand-inked */
  var TGW = 270, TGH = 430, TGHOLE = 40;
  function tagPath(g) { var w = TGW, h = TGH, c = 64; g.beginPath(); g.moveTo(-w / 2 + c, -h / 2); g.lineTo(w / 2 - c, -h / 2); g.lineTo(w / 2, -h / 2 + c); g.lineTo(w / 2, h / 2 - 14); g.quadraticCurveTo(w / 2, h / 2, w / 2 - 14, h / 2); g.lineTo(-w / 2 + 14, h / 2); g.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - 14); g.lineTo(-w / 2, -h / 2 + c); g.closePath(); }
  function tagPiece() {
    var w = TGW, h = TGH, rec = [];
    var pc = piece([-w / 2, -h / 2, w / 2, h / 2], tagPath, '#fbf3e4', { sx: 7, sy: 14, blur: 20, extra: function (g) {
      g.fillStyle = 'rgba(29,18,51,.045)'; for (var y = -h / 2; y < h / 2; y += 14) g.fillRect(-w / 2, y, w, 1.5);
      g.fillStyle = HOT; g.fillRect(-w / 2, -h / 2 + 78, w, 22);
      var y13 = -h / 2 + 220, tw = inkText(g, '13', 0, y13, 232, INK, 131, { dense: 80, big: 1.1 });
      rec.push([-tw / 2, y13 - 232 * .5, tw / 2, y13 + 232 * .42, '13']);
      g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(0, -h / 2 + TGHOLE, 26, 0, TAU); g.fill(); g.strokeStyle = HOT; g.lineWidth = 6; g.stroke();
    }, after: function (g) { g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, -h / 2 + TGHOLE, 13, 0, TAU); g.fill(); } });
    return wordsOf(pc, rec);
  }
  /* st = { x, y (pin), len, s, a }: the tag hangs from its hole */
  function hang(g, pc, st, nr, extra) {
    if (!st || st.s <= 0) return;
    g.save(); g.translate(st.x, st.y); g.rotate(st.a || 0);
    g.strokeStyle = '#efe2c4'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, st.len + 4); g.stroke();
    g.translate(0, st.len); g.scale(st.s, st.s);
    var o = NOREC; NOREC = o || !!nr; putW(g, pc, 0, TGH / 2 - TGHOLE); if (extra) { g.translate(0, TGH / 2 - TGHOLE); extra(g); } NOREC = o;
    g.restore();
    put(g, P.pin, st.x, st.y);
  }
  /* a printed card that stands on the floor: the plaque */
  function plaquePiece(title, dates) {
    var w = 720, h = 128;
    return cardPiece(w, h, CREAM, [[title, 58, INK, -24], [dates, 40, HOT, 34]], { r: 8, ring: 'rgba(29,18,51,.22)', before: function (g) { g.fillStyle = 'rgba(29,18,51,.04)'; for (var y = -h / 2; y < h / 2; y += 10) g.fillRect(-w / 2, y, w, 1); } });
  }
  function voteTag(word, w, px) { return cardPiece(w, 130, CREAM, [[word, px, INK, 6, null, 14]], { r: 8, ring: 'rgba(29,18,51,.25)', path: function (g) { g.beginPath(); g.moveTo(-w / 2 + 34, -65); g.lineTo(w / 2, -65); g.lineTo(w / 2, 65); g.lineTo(-w / 2 + 34, 65); g.lineTo(-w / 2, 34); g.lineTo(-w / 2, -34); g.closePath(); }, after: function (g) { g.fillStyle = '#5a3a1a'; g.beginPath(); g.arc(-w / 2 + 22, 0, 8, 0, TAU); g.fill(); } }); }
  /* a torn-off calendar page: binding stub at the top, NOV, 19, the year, the game */
  function pagePiece(bind, year, game) {
    var w = 360, h = 440, tp = jag(400 + year, w, 4);
    return cardPiece(w, h, PADC, [['NOV', 64, bind === TEAL ? '#0f8f86' : HOT, -132], ['19', 200, INK, -6], [String(year), 76, INK, 118], [game, 44, INK2, 180]], { r: 6, sy: 14, path: function (g) { g.beginPath(); g.moveTo(-w / 2, -h / 2 + 8 + tp[0][1]); tp.forEach(function (q) { g.lineTo(-w / 2 + q[0], -h / 2 + 8 + q[1]); }); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); }, before: function (g) {
      g.fillStyle = bind; g.fillRect(-w / 2, -h / 2, w, 30);
      g.strokeStyle = 'rgba(29,18,51,.12)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-w / 2 + 24, 150); g.lineTo(w / 2 - 24, 150); g.stroke();
      for (var i = 0; i < 7; i++) { g.fillStyle = 'rgba(29,18,51,.07)'; g.fillRect(-w / 2 + 24 + i * 46, -h / 2 + 44, 36, 4); }
    } });
  }

  function buildTextures() {
    GRAIN = buildGrain();
    /* the wall, the wainscot and the floor: one bleed piece */
    P.wall = piece([-60, -60, 1140, 1980], rect(-60, -60, 1140, 1980), PLUM, { shadow: false, edge: false, grain: .9, ps: .5, extra: function (g) {
      var gr = g.createLinearGradient(0, 0, 0, FY); gr.addColorStop(0, '#24123c'); gr.addColorStop(1, '#3a1f57'); g.fillStyle = gr; g.fillRect(-60, -60, 1200, FY + 60);
      /* faint wallpaper: hand-printed diamonds */
      var r = mulberry(5); g.fillStyle = 'rgba(255,214,170,.05)';
      for (var y = 20; y < 1040; y += 92) for (var x = (y / 92 % 2) * 60; x < 1140; x += 120) { g.save(); g.translate(x + (r() - .5) * 4, y); g.rotate(Math.PI / 4 + (r() - .5) * .08); g.fillRect(-9, -9, 18, 18); g.restore(); }
      g.fillStyle = PLUM2; g.fillRect(-60, 1060, 1200, FY - 1060);
      g.fillStyle = 'rgba(255,255,255,.04)'; for (var x2 = 30; x2 < 1140; x2 += 180) g.fillRect(x2, 1092, 150, FY - 1120);
      g.fillStyle = '#e8d6b4'; g.fillRect(-60, 1050, 1200, 14); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-60, 1064, 1200, 6);
      /* floorboards */
      g.fillStyle = WOOD; g.fillRect(-60, FY, 1200, 1980 - FY);
      var fg = g.createLinearGradient(0, FY, 0, 1980); fg.addColorStop(0, 'rgba(255,230,190,.12)'); fg.addColorStop(1, 'rgba(30,10,0,.45)'); g.fillStyle = fg; g.fillRect(-60, FY, 1200, 1980 - FY);
      g.strokeStyle = 'rgba(70,40,15,.45)'; g.lineWidth = 3;
      for (var k = 0; k < 9; k++) { var yy = FY + 30 + k * k * 9 + k * 34; g.beginPath(); g.moveTo(-60, yy); g.lineTo(1140, yy); g.stroke(); for (var j = 0; j < 4; j++) { var xx = ((k * 263 + j * 377) % 1200) - 60; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 30 + k * 18); g.stroke(); } }
      g.fillStyle = '#5a3418'; g.fillRect(-60, FY - 6, 1200, 14); g.fillStyle = 'rgba(255,230,190,.25)'; g.fillRect(-60, FY - 6, 1200, 3);
    } });
    P.clockFace = piece([-112, -112, 112, 112], function (g) { g.beginPath(); g.arc(0, 0, 110, 0, TAU); }, CREAM, { sx: 5, sy: 9, blur: 14, extra: function (g) {
      g.strokeStyle = ORG; g.lineWidth = 14; g.beginPath(); g.arc(0, 0, 103, 0, TAU); g.stroke();
      for (var i = 0; i < 12; i++) { var a = i * TAU / 12; g.strokeStyle = INK; g.lineWidth = i % 3 ? 3 : 7; g.beginPath(); g.moveTo(Math.cos(a) * 76, Math.sin(a) * 76); g.lineTo(Math.cos(a) * 90, Math.sin(a) * 90); g.stroke(); }
    } });
    var r = mulberry(77), cols = [HOT, TEAL, ORG, GOLD];
    for (var i = 0; i < 7; i++) DRIFT.push({ x: 180 + (i * 113 + r() * 60) % 660, y: r() * 1500, sp: 1 + (i % 2), ph: r() * TAU, rs: 1 + Math.floor(r() * 2), col: cols[i % cols.length], dx: 20 + r() * 25, s: .8 + r() * .5 });

    P.padG = []; P.padR = [];
    for (i = 0; i < 4; i++) { P.padG.push(padPiece(HOT, 11 + i)); P.padR.push(padPiece(TEAL, 31 + i)); }
    P.tag = tagPiece();
    P.pin = piece([-16, -16, 16, 16], function (g) { g.beginPath(); g.arc(0, 0, 14, 0, TAU); }, TEAL, { sx: 3, sy: 5, blur: 5, edge: 1.5, after: function (g) { g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(-4, -4, 4, 0, TAU); g.fill(); } });
    P.pill6 = cardPiece(270, 92, TEAL, [['GTA 6', 70, INK, 3]], { r: 46, ring: 'rgba(255,240,234,.9)' });
    P.stampRec = buildStamp(['NOT A', 'RECORD'], 104, 270);
    P.stampHero = buildStamp(['26', 'YEARS'], 150, 270);
    P.tab = cardPiece(250, 118, HOT, [['GTA 6', 54, INK, -20], ['13 YRS 2 MO', 40, INK, 32]], { r: 8, ring: 'rgba(255,240,234,.7)' });
    P.bTab = cardPiece(176, 76, HOT, [['GTA 6', 56, INK, 2]], { r: 8, ring: 'rgba(255,240,234,.85)' });
    P.plq = {
      gta: plaquePiece('GTA 5 → GTA 6', 'SEPT 2013 → NOV 2026'),
      ask: plaquePiece('FAMOUS WAITS', 'OUR PICKS'),
      kh: plaquePiece('KINGDOM HEARTS III', 'DEC 2005 → JAN 2019 · JP'),
      psy: plaquePiece('PSYCHONAUTS 2', '2005 → 2021'),
      shen: plaquePiece('SHENMUE III', '2001 (JP) → 2019'),
      sor: plaquePiece('STREETS OF RAGE 4', '1994 (JP) → 2020')
    };
    var msw = Math.max(stkW('RELEASE → NEXT NUMBERED GAME', 38, 'condensed'), stkW('FIRST RELEASE ANYWHERE', 38, 'condensed')) + 50;
    P.measure = cardPiece(Math.min(800, msw), 82, NEWS, [['RELEASE → NEXT NUMBERED GAME', 38, INK, -19, 'condensed'], ['FIRST RELEASE ANYWHERE', 38, HOT, 22, 'condensed']], { r: 4, sy: 6 });
    P.pageS = pagePiece(TEAL, 2019, 'SHENMUE III'); P.pageG = pagePiece(HOT, 2026, 'GTA 6');
    P.sameDay = buildStamp(['SAME DAY'], 96, 420);
    P.yes = voteTag('YES', 220, 84); P.no = voteTag('NO', 220, 84);
    P.loupeRim = piece([-160, -160, 160, 160], function (g) { g.beginPath(); g.arc(0, 0, 158, 0, TAU); g.arc(0, 0, 132, 0, TAU, true); }, ORG, { sx: 6, sy: 10, blur: 14, extra: function (g) { g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-160, -160, 320, 40); } });
    P.loupeHandle = piece([-24, 0, 24, 190], function (g) { rr(g, -24, 0, 48, 190, 20); }, INK2, { sx: 5, sy: 8, blur: 10, edgeCol: 'rgba(251,240,234,.7)' });
    /* the loop sweep: one big torn calendar page */
    var tp2 = jag(301, 1100, 10), bt2 = jag(302, 1100, 10);
    P.sweep = piece([0, -20, 1100, 1580], function (g) { g.beginPath(); g.moveTo(0, tp2[0][1]); tp2.forEach(function (p) { g.lineTo(p[0], p[1]); }); for (var i = bt2.length - 1; i >= 0; i--) g.lineTo(bt2[i][0], 1560 + bt2[i][1]); g.closePath(); }, PADC, { sx: 0, sy: 10, blur: 20, ps: .6, extra: function (g) {
      g.fillStyle = HOT; g.fillRect(0, -20, 1100, 120);
      g.strokeStyle = 'rgba(29,18,51,.16)'; g.lineWidth = 4; for (var c = 0; c <= 7; c++) { g.beginPath(); g.moveTo(60 + c * 140, 260); g.lineTo(60 + c * 140, 1460); g.stroke(); } for (var rr2 = 0; rr2 <= 6; rr2++) { g.beginPath(); g.moveTo(60, 260 + rr2 * 200); g.lineTo(1040, 260 + rr2 * 200); g.stroke(); }
      g.fillStyle = 'rgba(255,79,163,.35)'; g.fillRect(62 + 3 * 140, 262 + 2 * 200, 136, 196);
    } });
  }

  /* =====================================================================================================
     TIME AND STATE. T holds every beat time (initTimes, from the voice). One continuous set: the camera scale
     s(t) pulls back as the rival tower grows; the GTA line is fixed in the world, so only the camera moves it.
     ===================================================================================================== */
  var T = {}, LIVE2 = { bg: true, clip: true };
  function sm(t, a, d) { return eio(seg(t, a, a + (d || .5))); }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function camS(t) {
    return 1.15 - .05 * sm(t, 0, 1.2) - .1 * sm(t, T.rec0, .6) - .18 * sm(t, GAMES[1].b0, GAMES[1].land - GAMES[1].b0 + .25) - .08 * sm(t, GAMES[2].b0, GAMES[2].land - GAMES[2].b0 + .25) - .22 * sm(t, GAMES[3].b0, GAMES[3].land - GAMES[3].b0 + .35) + .58 * sm(t, T.E0, .7);
  }
  function SY(yw, s) { return FY - yw * s; }

  /* the rival tower: how many full pads have landed, and the month sliver on top */
  var GAMES = [];   /* { id, n, mo, land (last pad), sl (sliver in), out (sliver out) } */
  function drawPad(g, pcs, i, x, yScreen, s, rot, a) {
    g.save(); g.globalAlpha *= a; g.translate(x, yScreen); g.rotate(rot); g.scale(s, s); put(g, pcs[i % pcs.length], 0, 0); g.restore();
  }
  function padDrop(t, land, d, h) { d = d || .16; if (t >= land) return 0; return (h || 300) * Math.pow((land - t) / d, 2); }
  function sliver(g, x, yw, frac, s, bind, a, rot) {
    if (frac <= 0 || a <= 0) return;
    var h = Math.max(5, frac * PBH);
    g.save(); g.globalAlpha *= a; g.translate(x, SY(yw, s)); g.rotate(rot || 0); g.scale(s, s);
    g.fillStyle = 'rgba(6,3,18,.35)'; g.fillRect(-PBW / 2 + 3, -h + 4, PBW, h);
    g.fillStyle = PADC; g.fillRect(-PBW / 2, -h, PBW, h);
    g.fillStyle = bind; g.fillRect(-PBW / 2, -h, PBW, Math.min(5, h * .4));
    g.fillStyle = 'rgba(120,80,40,.3)'; for (var y = -h + 6; y < -1; y += 2.4) g.fillRect(-PBW / 2 + 3, y, PBW - 6, .9);
    g.restore();
  }
  /* GTA tower: 12 pads resting, the 13th (with its 2-month sliver) lands at T.p12 */
  function gtaTower(g, t, cx, s, A) {
    for (var i = 0; i < 13; i++) {
      var land = i < 12 ? -9 : T.p12, dy = i === 12 ? padDrop(t, land, .34, 90) : 0;
      if (i === 12 && t < land - .34) continue;
      var sq = i === 12 ? kn(t, land, .05) : 1, jx = (hash(i + 3) - .5) * 12, rot = (hash(i + 9) - .5) * .022;
      drawPad(g, P.padG, i, cx + jx * s, SY(i * PBH + dy, s), s * sq, rot, A);
      if (i === 12) sliver(g, cx + jx * s, i * PBH + PBH + dy, 2 / 12, s, HOT, A, rot);
    }
  }
  /* jury r1: every rival is its own tower, built from 0 under its own plaque and knocked down under the next plaque flip,
     so no game's pads, digits or sliver ever share a frame with another title */
  function rivalCount(t) { var G0 = curGame(t); if (!G0) return 0; var n = 0; for (var i = 0; i < G0.RL.length; i++) if (tq(t) >= G0.RL[i]) n = i + 1; return n; }
  function rivalTower(g, t, cx, s) {
    GAMES.forEach(function (G0) {
      if (t < G0.b0 - .2 || t >= G0.knock + .3) return;
      var kd = t >= G0.knock, last = G0 === GAMES[GAMES.length - 1];
      for (var i = 0; i < G0.RL.length; i++) {
        var land = G0.RL[i]; if (t < land - .16) break;
        var dy = padDrop(t, land), sq = kn(t, land, .05), jx = (hash(i + 41) - .5) * 12, rot = (hash(i + 57) - .5) * .022;
        var x = cx + jx * s, y = SY(i * PBH + dy, s), a = clamp((t - land + .16) / .05, 0, 1);
        if (kd) {
          /* knock-down: the stack topples sideways, top first; gone before the next plaque opens */
          var tb = G0.knock + (G0.RL.length - i) * (last ? .012 : .004), u = Math.max(0, t - tb), dir = i % 2 ? 1 : -1;
          x += dir * u * (last ? 92 + 16 * (i % 5) : 260 + 30 * (i % 4)); y += (last ? 1300 : 2400) * u * u - 100 * u; rot += dir * u * (last ? 3.2 : 5);
          a *= last ? 1 - seg(u, .12, .32) : 1 - seg(t, G0.knock + .04, G0.knock + .2);
        }
        if (a > 0) drawPad(g, P.padR, i, x, y, s * sq, rot, a);
      }
      /* the month sliver on top */
      if (t >= G0.sl - .16) {
        var dy2 = padDrop(t, G0.sl), sa = kd ? 1 - seg(t, G0.knock, G0.knock + (last ? .3 : .12)) : 1;
        sliver(g, cx + (hash(G0.n + 41 - 1) - .5) * 12 * s, G0.n * PBH + dy2, G0.mo / 12, s, TEAL, sa, 0);
      }
    });
  }
  function curGame(t) { var c = null; GAMES.forEach(function (G0) { if (t >= G0.b0 - .2 && t < G0.knock) c = G0; }); return c; }

  /* ---------- the stage, layer by layer ---------- */
  function clock(g, t) {
    var x = 510, y = 168; put(g, P.clockFace, x, y);
    var am = TAU * 6 * t / DUR - Math.PI / 2, ah = TAU * t / DUR - Math.PI / 2 + 1.1;
    g.save(); g.translate(x, y); g.lineCap = 'round';
    g.strokeStyle = INK; g.lineWidth = 10; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(ah) * 50, Math.sin(ah) * 50); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(am) * 78, Math.sin(am) * 78); g.stroke();
    var as = TAU * 30 * t / DUR - Math.PI / 2; g.strokeStyle = HOT; g.lineWidth = 3; g.beginPath(); g.moveTo(-Math.cos(as) * 16, -Math.sin(as) * 16); g.lineTo(Math.cos(as) * 86, Math.sin(as) * 86); g.stroke();
    g.fillStyle = HOT; g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill(); g.restore();
  }
  function drift(g, t) {
    DRIFT.forEach(function (f, i) {
      var y = 300 + ((f.y + 1100 * f.sp * t / DUR) % 1100), x = f.x + f.dx * osc(t, 3 * f.sp, f.ph);
      g.save(); g.globalAlpha = .5; g.translate(x, y); g.rotate(.5 * osc(t, f.rs * 2, f.ph)); g.scale(f.s * Math.cos(TAU * 4 * f.sp * t / DUR + f.ph), f.s);
      g.fillStyle = PADC; g.fillRect(-22, -27, 44, 54); g.fillStyle = f.col; g.fillRect(-22, -27, 44, 9);
      g.fillStyle = 'rgba(29,18,51,.25)'; g.fillRect(-14, -8, 28, 3); g.fillRect(-14, 2, 20, 3); g.restore();
    });
  }
  function ruler(g, t, s) {
    var x0 = 98, w = 26;
    g.save(); g.globalAlpha = .55; g.fillStyle = '#e8d6b4'; g.fillRect(x0, 300, w, FY - 300);
    g.fillStyle = INK2; for (var i = 0; i <= 40; i++) { var y = SY(i * PBH, s); if (y < 300) break; g.fillRect(x0, y - 1.5, i % 5 ? 10 : 22, 3); }
    g.restore();
  }
  function pill(g, t, x, y, a, nr0, sc) {
    if (a <= 0) return; var nr = NOREC;
    g.save(); g.globalAlpha *= a; g.translate(x, y + 3 * osc(t, 9, 2)); g.rotate(-.03 + .01 * osc(t, 7, 1)); if (sc) g.scale(sc, sc); NOREC = nr || nr0; putW(g, P.pill6, 0, 0); NOREC = nr; g.restore();
  }
  function chipAt(g, t, text, x, y, tin, tout, o) {
    o = o || {}; if (t < tin - .02 || t > tout + .3) return;
    var k = cd(t, tin, 14), nr = NOREC; NOREC = nr || k < .98 || t > tout;
    chip(g, text, x, y + (1 - k) * (o.from || -40), { px: o.px || 40, bg: o.bg || ORG, fg: o.fg || INK, a: fin(t, tin, .08) * (1 - seg(t, tout, tout + .25)), rot: o.rot || 0, s: kn(t, tin + .1, .05) });
    NOREC = nr;
  }
  /* the plaque on the floor flips like a hinged card between its states */
  function plaque(g, t) {
    var st = T.PLQ, i = -1; for (var k = 0; k < st.length; k++) if (t >= st[k].t) i = k;
    if (i < 0) return;
    var u = t - st[i].t, cur = st[i].pc, prev = i > 0 ? st[i - 1].pc : null, sy, pc;
    if (u < .13 && prev) { pc = prev; sy = 1 - eio(u / .13); } else { pc = cur; sy = prev ? eio(clamp((u - .13) / .13, 0, 1)) : cd(t, st[i].t, 14); }
    if (!pc || sy <= .01) return;
    var nr = NOREC;
    g.save(); g.translate(510, 1282 + 2 * osc(t, 6, 3)); g.rotate(-.01);
    g.fillStyle = '#5a3418'; g.fillRect(-200, 50, 16, 40); g.fillRect(184, 50, 16, 40);
    g.scale(1, sy); NOREC = nr || sy < .98; putW(g, pc, 0, 0); NOREC = nr; g.restore();
  }
  function counter(g, t, cx, topY) {
    var G0 = curGame(t); if (!G0 || t >= G0.knock) return;
    var n = rivalCount(t); if (n === 0) return;
    var landed = tq(t) >= G0.land, nr = NOREC;
    var y = topY - 54 + 3 * osc(t, 8, 1), num = String(n), px = 96;
    g.save();
    if (landed) {
      var wN = stkW(num, px), wT = stkW('YRS ' + G0.mo + ' MO', 46) + 30, tot = wN + 18 + wT, x0 = cx - tot / 2, k = kn(t, G0.land, .1);
      g.save(); g.translate(x0 + wN / 2, y); g.scale(k, k); NOREC = nr || t < G0.land + .1; stk(g, num, 0, 0, px, { col: CREAM, lw: 10 }); NOREC = nr; g.restore();
      NOREC = nr || t < G0.land + .12; chip(g, 'YRS ' + G0.mo + ' MO', x0 + wN + 18 + wT / 2, y + 8, { px: 46, bg: TEAL, fg: INK, s: kn(t, G0.land + .04, .06), a: fin(t, G0.land, .06) }); NOREC = nr;
    } else {
      NOREC = true; stk(g, num, cx, y, px, { col: '#a99bbd', lw: 10 }); NOREC = nr;
    }
    g.restore();
  }
  function gtaLine(g, t, s) {
    if (t < T.tape0 - .02) return;
    var y = SY(GTAY, s), k = sm(t, T.tape0, .32), pk = sm(t, T.E0, .4), x0 = BX0 + 10, x1 = lerp(BX0 + 10, BX1 - 10, k) - (BX1 - BX0 - 20) * pk;
    if (x1 <= x0) return;
    g.save(); g.fillStyle = 'rgba(6,3,18,.35)'; g.fillRect(x0 + 3, y - 6, x1 - x0, 16);
    g.fillStyle = HOT; g.fillRect(x0, y - 9, x1 - x0, 16); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x0, y - 9, x1 - x0, 4);
    g.fillStyle = 'rgba(120,0,60,.25)'; for (var x = x0 + 12; x < x1; x += 26) g.fillRect(x, y - 9, 2, 16);
    g.restore();
  }
  function lineTab(g, t, s) {
    if (t < T.tab - .02 || t > T.gIn + .25) return;
    var y = SY(GTAY, s), k = cd(t, T.tab, 13), o = seg(t, T.gIn - .1, T.gIn + .15), nr = NOREC;
    g.save(); g.globalAlpha *= fin(t, T.tab, .08) * (1 - o); g.translate(225, y + 70 + (1 - k) * -50 + o * 40); g.rotate(-.025 + sw(t, T.tab + .1, .06, 8, 3) + .01 * osc(t, 7, 4));
    NOREC = nr || k < .98 || o > 0; putW(g, P.tab, 0, 0); NOREC = nr;
    g.restore(); put(g, P.pin, 225, y - 1);
  }
  function plinth(g, t, s) {
    if (t < T.plinth - .02) return;
    var k = cd(t, T.plinth, 12), o = sm(t, T.E0 + .1, .4), x = lerp(RX + 60, RX, k);
    g.save(); g.globalAlpha *= fin(t, T.plinth, .15) * (1 - o); g.translate(x, FY); g.scale(s, s);
    g.fillStyle = 'rgba(6,3,18,.35)'; g.fillRect(-236, -10, 480, 22);
    g.fillStyle = WOOD2; g.fillRect(-240, -16, 480, 22); g.fillStyle = 'rgba(255,230,190,.3)'; g.fillRect(-240, -16, 480, 5);
    g.restore();
  }
  function loupe(g, t, s) {
    if (t < T.lp0 - .02 || t >= T.lp1 + .25) return;
    var k = cd(t, T.lp0, 11), o = sm(t, T.lp1, .25), cx = lerp(760, 720, k), la = fin(t, T.lp0, .15) * (1 - o), cy = 790 + 6 * osc(t, 8, 2) - (1 - k) * 60;
    var Z = s * 7, wx = RX + PBW / 2 - 40, wy = GTAY - PBH * .1;
    g.save(); g.globalAlpha *= la;
    g.save(); g.translate(cx, cy); g.rotate(-.3 + .03 * osc(t, 6, 1)); put(g, P.loupeHandle, 0, 150); g.restore();
    g.save(); g.beginPath(); g.arc(cx, cy, 134, 0, TAU); g.clip();
    g.fillStyle = PLUM; g.fillRect(cx - 140, cy - 140, 280, 280);
    /* the same world, 7x: the top full pad, the 1-month sliver and the pink GTA line just above it */
    function wX(x) { return cx + (x - wx) * Z; } function wY(y) { return cy - (y - wy) * Z; }
    g.fillStyle = PADC; g.fillRect(wX(RX - PBW / 2), wY(13 * PBH), PBW * Z, PBH * Z);
    g.fillStyle = TEAL; g.fillRect(wX(RX - PBW / 2), wY(13 * PBH), PBW * Z, 13 * Z);
    g.fillStyle = PADC; g.fillRect(wX(RX - PBW / 2), wY(13 * PBH + PBH / 12), PBW * Z, PBH / 12 * Z);
    g.fillStyle = TEAL; g.fillRect(wX(RX - PBW / 2), wY(13 * PBH + PBH / 12), PBW * Z, 4 * Z * .4);
    g.fillStyle = HOT; g.fillRect(cx - 140, wY(GTAY) - 9, 280, 16);
    /* the gap: one month */
    var gy0 = wY(GTAY), gy1 = wY(13 * PBH + PBH / 12);
    g.fillStyle = 'rgba(255,200,61,.55)'; g.fillRect(cx - 120, gy0 + 7, 150, gy1 - gy0 - 7);
    g.restore();
    put(g, P.loupeRim, cx, cy);
    var nr = NOREC; NOREC = nr || k < .98 || o > 0;
    if (t >= T.lpChip - .02) chip(g, '1 MONTH SHORT', cx - 60, cy + 196, { px: 46, bg: GOLD, fg: INK, a: fin(t, T.lpChip, .08) * (1 - o), s: kn(t, T.lpChip + .05, .06), rot: -.02 });
    NOREC = nr; g.restore();
  }
  function pages(g, t, s) {
    if (t < T.pg0 - .02 || t > T.pgOut + .5) return;
    var nr = NOREC, out = sm(t, T.pgOut, .45);
    /* jury r2: the Shenmue page alone on "launch day?" (centre stage), the GTA 6 page flies in on "familiar?" and the
       Shenmue page steps left to make room; SAME DAY right after; a second later the two pages lean together */
    var mv = cd(t, T.pgG, 10), lean = cd(t, T.same + 1, 9);
    [[P.pageS, T.pg0, RX, SY(18 * PBH, s), lerp(510, 300, mv) + 22 * lean, -.05], [P.pageG, T.pgG, 225, SY(GTAY, s), 720 - 22 * lean, .04]].forEach(function (q, i) {
      var k = cd(t, q[1], 10), a = fin(t, q[1], .06); if (t < q[1] - .02) return;
      var x = lerp(q[2], q[4], k), y = lerp(q[3], 840, k) - out * (1300 + i * 120), rot = q[5] + (1 - k) * (i ? -.9 : .9) + .015 * osc(t, 7, i) + 0 * out, sc = lerp(.3, 1, k) * kn(t, i ? T.same : T.k19, .04);
      g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot); g.scale(sc, sc); NOREC = nr || k < .98 || out > 0 || (mv > .02 && mv < .98 && !i) || (lean > .02 && lean < .98); putW(g, q[0], 0, 0); NOREC = nr; g.restore();
    });
    if (t >= T.same - .02) { var sk = cd(t, T.same, 30); g.save(); g.globalAlpha *= clamp((t - T.same) * 14, 0, 1) * (1 - out); g.translate(510, 1140 - out * 900); g.rotate(-.05); var ss = lerp(1.15, 1, sk); g.scale(ss, ss); NOREC = nr || sk < .98 || out > 0; putW(g, P.sameDay, 0, 0); NOREC = nr; g.restore(); }
  }
  /* jury r2: how far past the GTA line Psychonauts and Shenmue went: a pink bracket from the line to the tower top */
  function yrBrackets(g, t, s) {
    GAMES.forEach(function (G0) {
      if (!G0.plus || t < G0.land - .27 || t >= G0.yEnd + .2) return;
      var x = RX + (PBW / 2 + 26) * s, y0 = SY(GTAY, s), yt = SY((G0.n + G0.mo / 12) * PBH, s), k = sm(t, G0.land - .25, .25), y1 = lerp(y0, yt, k), o = seg(t, G0.yEnd, G0.yEnd + .2), nr = NOREC;
      g.save(); g.globalAlpha *= 1 - o;
      g.fillStyle = 'rgba(6,3,18,.35)'; g.fillRect(x + 3, y1 + 4, 12, y0 - y1);
      g.fillStyle = HOT; g.fillRect(x - 6, y1, 12, y0 - y1); g.fillRect(x - 22, y1, 28, 10); g.fillRect(x - 22, y0 - 10, 28, 10);
      NOREC = nr || t < G0.land + .1 || o > 0;
      if (t >= G0.land - .02) chip(g, G0.plus, x + 74, (y0 + yt) / 2, { px: 46, bg: HOT, fg: INK, a: fin(t, G0.land, .06), s: kn(t, G0.land + .03, .08), rot: -.03 });
      NOREC = nr; g.restore();
    });
  }
  /* jury r1: two GTA lengths, each a full pad-width frame laid over the 26 tower, labelled at 56 px */
  function brackets(g, t, s) {
    if (t < T.bA - .02 || t > T.E0 + .3) return;
    var hw = (PBW / 2 + 12) * s, o = seg(t, T.E0, T.E0 + .25), nr = NOREC;
    [[T.bA, 0, GTAY, .03], [T.bB, GTAY, 2 * GTAY, -.03]].forEach(function (q, i) {
      if (t < q[0] - .02) return;
      var k = sm(t, q[0], .35), y0 = SY(q[1], s), y1 = lerp(y0, SY(q[2], s), k);
      g.save(); g.globalAlpha *= 1 - o;
      g.fillStyle = 'rgba(255,79,163,.22)'; g.fillRect(RX - hw, y1, 2 * hw, y0 - y1);
      g.strokeStyle = 'rgba(6,3,18,.35)'; g.lineWidth = 10; g.strokeRect(RX - hw + 4, y1 + 6, 2 * hw, y0 - y1 - 4);
      g.strokeStyle = HOT; g.lineWidth = 10; g.strokeRect(RX - hw, y1 + 3, 2 * hw, y0 - y1 - 6);
      g.restore();
      if (k >= 1) { var ty = (y0 + SY(q[2], s)) / 2, kk = kn(t, q[0] + .35, .08); g.save(); g.globalAlpha *= (1 - o) * fin(t, q[0] + .35, .06); g.translate(RX, ty); g.rotate(q[3]); g.scale(kk, kk); NOREC = nr || t < q[0] + .45 || o > 0; putW(g, P.bTab, 0, 0); NOREC = nr; g.restore(); }
    });
  }

  function scene(g, t) {
    var s = camS(t), nr = NOREC;
    ruler(g, t, s);
    drift(g, t);
    var offY = t < 2.2 ? 120 * (1 - sm(t, 1.35, .8)) : 0; g.save(); g.translate(0, offY);
    gtaLine(g, t, s);
    /* GTA tower: frame 0 → slides out on "ask" → back for the end */
    var gx, gA;
    if (t >= T.gIn) { gx = lerp(GX - 90, GX, cd(t, T.gIn, 11)); gA = sm(t, T.gIn, .2); }
    else { gx = GX - 30 * sm(t, T.gOut, .5); gA = 1 - sm(t, T.gOut, .35); }
    var gIn = gA > 0;
    plinth(g, t, s);
    if (gIn) gtaTower(g, t, gx, s, gA);
    rivalTower(g, t, RX, s);
    var G0 = curGame(t), topRival = G0 ? SY((rivalCount(t) + (tq(t) >= G0.sl ? G0.mo / 12 : 0)) * PBH, s) : FY;
    lineTab(g, t, s);
    /* the pill rides the GTA tower's top */
    if (gIn) pill(g, t, gx - 14 * sm(t, T.gIn, .3) * (1 - sm(t, T.E0, .5)), SY(GTAY, s) - 66 + 8 * sm(t, T.gIn, .3) * (1 - sm(t, T.E0, .5)), gA, (t > T.gOut && t < T.gIn) || (t >= T.gIn && t < T.gIn + .5) || (t >= T.E0 && t < T.E0 + .7), 1 - .17 * sm(t, T.gIn, .3) * (1 - sm(t, T.E0, .5)));
    /* the 13 tag: swings on frame 0; flies off right on "ask"; swings back in at the end */
    var tagOut = sm(t, T.gOut, .45), tagIn = sm(t, T.E0 + .2, .55), tx = t >= T.E0 ? lerp(790, 745, tagIn) : lerp(745, 790, tagOut), tagA = t >= T.E0 ? sm(t, T.E0 + .2, .3) : 1 - sm(t, T.gOut, .3);
    if (tagA > 0) {
      g.save(); g.globalAlpha *= tagA;
      var u0 = t >= T.E0 ? Math.max(0, t - T.E0 - .2) : t, swing = .12 * Math.cos(TAU * (u0 + .05) / 1.3) * Math.exp(-u0 * .45) + .025 * osc(t, 7, .4) + (t < T.E0 ? .25 * tagOut : .15 * (1 - tagIn));
      var yk = t >= T.E0 ? 1 : 1 - tagOut, yrsT = t >= T.E0 ? T.E0 : T.yrs, moving = (tagOut > 0 && tagOut < 1) || (t >= T.E0 && tagIn < 1);
      hang(g, P.tag, { x: tx, y: 470, len: 34, s: 1, a: swing }, moving, function (q) {
        if (t < yrsT) return; var k = cd(t, yrsT, 16), nr2 = NOREC; NOREC = nr2 || k < .98 || moving;
        q.save(); q.translate(0, 334 - TGH / 2); var sc = lerp(1.6, 1, k) * kn(t, T.kYears2 || -9, .06); q.scale(sc, sc); q.globalAlpha *= fin(t, yrsT, .06); txt(q, 'YEARS', 0, 0, { px: 62, align: 'center', col: HOT, ls: 6 }); q.restore(); NOREC = nr2;
        var sinceT = t >= T.E0 ? T.E0 : T.since; if (t < sinceT) return;
        var k2 = cd(t, sinceT, 16); NOREC = nr2 || k2 < .98 || moving;
        q.save(); q.translate(0, 393 - TGH / 2 + (1 - k2) * 16); q.globalAlpha *= fin(t, sinceT, .06); txt(q, 'SINCE GTA 5', 0, 0, { px: 40, align: 'center', col: INK, ls: 2 }); q.restore(); NOREC = nr2;
      });
      g.restore();
    }
    /* NOT A RECORD: printed on frame 0, re-stamped on "record", out on "ask" */
    var so = sm(t, T.gOut, .4);
    if (t < T.gOut + .45) {
      var kk = kn(t, T.stampK, .07);
      g.save(); g.globalAlpha *= 1 - so; g.translate(738, 1070 + so * 120); g.rotate(-.07 + .015 * osc(t, 6, 2)); g.scale(kk, kk); NOREC = nr || so > 0 || t < 0; putW(g, P.stampRec, 0, 0); NOREC = nr; g.restore();
      if (t >= T.stampK && t < T.stampK + .45) KIT.impact(g, 752, 1070, t - T.stampK, .45, HOT);
    }
    /* the empty slot: a dashed outline of a tower up to the GTA line draws itself on, then a huge ? inside it */
    if (t >= T.ghost - .02 && t < GAMES[0].RL[0] + .3) {
      var gk = sm(t, T.ghost, .7), go = 1 - seg(t, GAMES[0].RL[0] - .1, GAMES[0].RL[0] + .25), gw = PBW * s, gh = GTAY * s, per = 2 * (gw + gh), L = per * gk;
      g.save(); g.globalAlpha *= go; g.strokeStyle = 'rgba(251,240,234,.75)'; g.lineWidth = 7; g.setLineDash([22, 16]); g.lineDashOffset = -60 * t;
      g.beginPath(); g.moveTo(RX - gw / 2, FY - 18); var pts = [[RX - gw / 2, FY - 18 - gh], [RX + gw / 2, FY - 18 - gh], [RX + gw / 2, FY - 18], [RX - gw / 2, FY - 18]], px0 = RX - gw / 2, py0 = FY - 18, left = L;
      pts.forEach(function (p2) { if (left <= 0) return; var d = Math.hypot(p2[0] - px0, p2[1] - py0), f = Math.min(1, left / d); g.lineTo(px0 + (p2[0] - px0) * f, py0 + (p2[1] - py0) * f); left -= d; px0 = p2[0]; py0 = p2[1]; });
      g.stroke(); g.setLineDash([]); g.fillStyle = 'rgba(25,211,197,.08)'; if (gk >= 1) g.fillRect(RX - gw / 2, FY - 18 - gh, gw, gh); g.restore();
    }
    if (t >= T.q && t < T.qOut + .3) { g.save(); var qk = kn(t, T.qK, .12) * (1 + .03 * osc(t, 17, 1)); g.translate(RX, 930); g.scale(qk, qk); slam(g, '?', 0, 0, 420, t - T.q, { col: TEAL, rot: .05 + .04 * osc(t, 11, 2), out: T.qOut - T.q, lw: 18 }); g.restore(); }
    counter(g, t, RX, topRival);
    loupe(g, t, s);
    brackets(g, t, s);
    /* the dim behind the two pages */
    if (t >= T.pg0 - .1 && t < T.pgOut + .5) { g.save(); g.globalAlpha = .45 * sm(t, T.pg0 - .1, .3) * (1 - sm(t, T.pgOut, .4)); g.fillStyle = '#12081f'; g.fillRect(BX0, 300, BX1 - BX0, FY - 300); g.restore(); }
    yrBrackets(g, t, s);
    pages(g, t, s);
    /* the hero stamp: 26 YEARS, in the pause after "years" */
    if (t >= T.hero - .02 && t < T.heroOut + .35) {
      var hk = cd(t, T.hero, 30), ho = sm(t, T.heroOut, .15); g.save(); g.globalAlpha *= clamp((t - T.hero) * 14, 0, 1) * (1 - ho); g.translate(788, 720 - ho * 200); g.rotate(.05 + .01 * osc(t, 6, 5)); var hs = lerp(1.12, 1, hk) * .7; g.scale(hs, hs); NOREC = nr || hk < .98 || ho > 0; putW(g, P.stampHero, 0, 0); NOREC = nr; g.restore();
      if (t >= T.hero && t < T.hero + .5) KIT.impact(g, 768, 720, t - T.hero, .5, HOT);
    }
    if (t >= T.x2 - .02 && t < T.E0 + .35) slam(g, '≈ 2× GTA 6', 262, 700 - 160 * sm(t, T.E0, .3), 60, t - T.x2, { col: HOT, rot: -.03, lw: 11, out: T.E0 + .05 - T.x2 });
    /* the floor: the plaque and the measure strip */
    plaque(g, t);
    if (t >= T.ms - .02 && t < T.E0 + .35) {
      var mk2 = sm(t, T.ms, .4), mo = sm(t, T.E0, .3), pw = P.measure.w;
      g.save(); g.globalAlpha *= 1 - mo; g.translate(510, 1384 + mo * 60); g.beginPath(); g.rect(-pw / 2, -60, pw * mk2, 120); g.clip(); NOREC = nr || mk2 < 1 || mo > 0; putW(g, P.measure, 0, 0); NOREC = nr; g.restore();
    }
    /* end: LONG? and two identical vote tags */
    if (t >= T.kLong - .02) slam(g, 'LONG?', 735, 1040, 110, t - T.kLong, { col: HOT, rot: -.05, lw: 13 });
    [[P.yes, 370, T.kYes], [P.no, 650, T.kNo]].forEach(function (q, i) {
      var tin = T.vote; if (t < tin - .02) return;
      var k = cd(t, tin, 15), yy = lerp(1180, 1330, k), rot = (i ? .03 : -.03) + sw(t, tin + .08, .08, 8, 2.8) + sw(t, q[2], .05, 10, 3), sc = kn(t, q[2], .08);
      g.save(); g.globalAlpha *= fin(t, tin, .08); g.translate(q[1], yy); g.rotate(rot); g.scale(sc, sc);
      NOREC = nr || k < .98; putW(g, q[0], 0, 0); NOREC = nr; put(g, P.pin, -q[0].w / 2 + 58, 0); g.restore();
    });
    g.restore();
    return s;
  }

  function sweep(g, t, tm) {
    var k = seg(t, tm - .27, tm + .27); if (k <= 0 || k >= 1) return;
    /* jury r2: a full-bleed page (not a box clipped to the rail) */
    var y = lerp(1980, -2150, eio(k));
    g.save(); g.translate(-10, y); g.rotate(-.03); g.scale(1, 1.32); put(g, P.sweep, 0, 0); g.restore();
  }

  /* ---------- captions (the voice, phrase by phrase; the hook line is carried by the picture) ---------- */
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, for: 1, own: 1, how: 1, that: 1, if: 1, you: 1, no: 1, or: 1, it: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'end') return;
      var cur = [], ws = l.words.slice();
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    var o2 = [];
    outc.forEach(function (ws) {
      var id0 = ws.id; if (ws.length <= 6) { o2.push(ws); return; }
      var cut = -1;
      for (var i = 1; i < ws.length - 2; i++) if (/,$/.test(ws[i].w)) { cut = i; break; }
      if (cut < 0) { var best = 1e9; for (i = 2; i < ws.length - 2; i++) { if (GLUE[norm(ws[i].w)]) continue; var d = Math.abs(i + 1 - ws.length / 2); if (d < best) { best = d; cut = i; } } }
      if (cut < 0) { o2.push(ws); return; }
      var a1 = ws.slice(0, cut + 1), a2 = ws.slice(cut + 1); a1.id = a2.id = id0; o2.push(a1); o2.push(a2);
    });
    return o2.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPY = 400, NUMW = { thirteen: 1, sixteen: 1, eighteen: 1, '26': 1 };
  function captions(g, t) {
    /* jury r2: one caption state per frame (every motion-blur sample of a frame rounds to the same time), so a swap never blends */
    t = tq(t);
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { card0 = c; ci = i; } });
    if (!card0) return;
    /* jury r1: a card is either fully up or gone (swap inside one frame, never a half-read ghost) */
    var nx = CAPS[ci + 1], ns = nx ? nx.s : 1e9, end = Math.min(card0.t1 + .5, ns);
    if (card0.words.some(function (w) { return norm(w.w) === '26'; })) end = Math.min(end, T.hero - .02);
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
    if (!VIG) { VIG = mk(W, H); var q = VIG.getContext('2d'), gr = q.createRadialGradient(510, 860, 480, 510, 900, 1250); gr.addColorStop(0, 'rgba(6,3,18,0)'); gr.addColorStop(1, 'rgba(6,3,18,.5)'); q.fillStyle = gr; q.fillRect(0, 0, W, H); }
    g.drawImage(VIG, 0, 0);
  }
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) { put(g, P.wall, 0, 0); clock(g, t); vignette(g); }
    var tt = t >= T.W5 ? t - DUR : t;
    g.save(); railClip(g);
    /* a slow breathing push, periodic in the film's length, so no beat ever holds dead still */
    var bs = 1 + .01 * osc(t, 9, .7); g.translate(510, 880); g.scale(bs, bs); g.translate(-510, -880);
    scene(g, tt);
    g.restore();
    g.save(); sweep(g, t, T.W5); g.restore();
    if (!POSTERMODE && LIVE.text && t < T.W5 - .1) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    /* frame 0 and the loop */
    Tx('pill', 'GTA 6', 0, T.gOut); Tx('pill', 'GTA 6', T.gIn + .5, DUR + 1);
    Tx('since', 'SINCE GTA 5', T.since + .1, T.gOut); Tx('since', 'SINCE GTA 5', T.E0 + .8, T.W5);
    Tx('n13', '13', 0, T.gOut); Tx('n13', '13', T.E0 + .8, DUR + 1);
    Tx('years', 'YEARS', T.yrs + .1, T.gOut); Tx('years', 'YEARS', T.E0 + .8, T.W5);
    Tx('rec', 'NOT A RECORD', 0, T.gOut); Tx('rec', 'NOT A RECORD', T.W5 + .1, DUR + 1);
    Tx('tab', 'GTA 6 · 13 YRS 2 MO', T.tab + .15, T.pg0); Tx('tab', 'GTA 6 · 13 YRS 2 MO', T.pgOut + .5, T.gIn - .1);
    Tx('q', '?', T.q + .1, T.qOut + .05);
    Tx('ms', 'RELEASE → NEXT NUMBERED GAME', T.ms + .4, T.E0); Tx('ms2', 'FIRST RELEASE ANYWHERE', T.ms + .4, T.E0);
    T.PLQ.forEach(function (p, i) { var nx = T.PLQ[i + 1]; if (p.pc) Tx('plq' + i, p.title, p.t + .26, nx ? nx.t + .13 : T.E0); if (p.pc) Tx('pld' + i, p.dates, p.t + .26, nx ? nx.t + .13 : T.E0); });
    GAMES.forEach(function (G0, i) { if (G0.plus) Tx('yb' + i, G0.plus, G0.land + .03, G0.yEnd); });
    GAMES.forEach(function (G0, i) { Tx('n' + i, String(G0.n), G0.land, G0.knock); Tx('cnt' + i, 'YRS ' + G0.mo + ' MO', G0.land, G0.knock); });
    Tx('mon', '1 MONTH SHORT', T.lpChip + .1, T.lp1);
    Tx('pS', 'NOV 19 2019 SHENMUE III', T.pg0 + .45, T.pgOut); Tx('pG', 'NOV 19 2026 GTA 6', T.pgG + .45, T.pgOut);
    Tx('same', 'SAME DAY', T.same + .06, T.pgOut);
    Tx('hero', '26 YEARS', T.hero + .05, T.heroOut);
    Tx('bA', 'GTA 6', T.bA + .45, T.E0); Tx('bB', 'GTA 6', T.bB + .45, T.E0);
    Tx('x2', '≈ 2× GTA 6', T.x2 + .15, T.E0);
    Tx('long', 'LONG?', T.kLong + .15, T.W5); Tx('yes', 'YES', T.vote + .2, T.W5); Tx('no', 'NO', T.vote + .2, T.W5);
    return o;
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    
    /* hook: the 13th pad lands; YEARS on "years"; the plaque flips up; the GTA line is taped across */
    G('p12', .15, 'thock', .05, 2.2, { m: .04 }); T.p12 = .15; T.yrs = at('hook', 'is'); T.since = T.yrs + .3;
    T.plq0 = G('plq0', after('hook'), 'tick', .3, 1);
    T.tape0 = G('tape', T.plq0 + .4, 'zip', .3, 1);
    /* rec */
    T.rec0 = start('rec') - .1; T.stampK = at('rec', 'record');
    G('recS', after('rec'), 'thock', .4, 1.2);
    T.gOut = after('rec') + .32; G('out', T.gOut, 'swish', .3, .9);
    T.plinth = T.gOut + .25; T.tab = T.gOut + .4; G('tabP', T.tab + .05, 'pop', .3, .8);
    /* ask */
    T.q = start('ask'); T.ghost = T.tab + .2; T.qK = G('popQ', after('ask'), 'pop', .35, 1);
    T.ms = T.qK + .3; G('msZ', T.ms, 'zip', .3, .7);
    /* jury r1: the plaque flips on "longer?", Kingdom Hearts pads start falling with it; the ? is up 1.2 s at most */
    var LONGER = at('ask', 'longer?');
    T.qOut = Math.min(T.q + 1.05, LONGER - .32);
    function build(G0, tag) {
      G0.RL = [];
      function u(n) { return G0.id === 'sor' ? (n <= 18 ? n : 18 + (n - 18) * .5) : n; }
      for (var n = 0; n < G0.n; n++) {
        var k = G0.id === 'sor' ? u(n + 1) / u(G0.n) : Math.sqrt((n + 1) / G0.n), tf = G0.b0 + (G0.land - G0.b0) * k; tf = Math.round(tf * 30) / 30; G0.RL.push(tf);
        if (n < G0.n - 1) EV.push({ t: tf, type: 'tick', g: .55 + .45 * (n + 1) / G0.n, id: tag + n });
      }
      G0.RL[G0.n - 1] = G0.land; G0.sl = G0.land + .1;
      EV.push({ t: G0.land - .09, type: 'ratchet', g: 1, id: tag + 'R' });
      GAMES.push(G0);
    }
    function onset(id, w) { return Math.round(at(id, w) * 30) / 30; }
    var PQ = { kh: LONGER - .3, psy: start('psy') - .12, shen: start('shen') - .05, sor: start('sor') };
    /* each tower is knocked down .15 s before the next plaque flips, so it is gone before the new title opens */
    build({ id: 'kh', n: 13, mo: 1, plq: PQ.kh, b0: LONGER, land: onset('kh', 'thirteen'), knock: PQ.psy - .15 }, 'k');
    G('khT', after('kh'), 'thock', .35, 1.1);
    T.KB0 = GAMES[0].b0;
    /* tie: the loupe, gone before the Psychonauts plaque opens */
    T.lp0 = onset('kh', 'thirteen') + .4; T.lpChip = T.lp0 + .25; G('lpP', after('tie'), 'pop', .35, .9); T.lp1 = PQ.psy - .35;
    build({ id: 'psy', n: 16, mo: 4, plq: PQ.psy, b0: PQ.psy + .3, land: onset('psy', 'sixteen.'), knock: PQ.shen - .15 }, 'p');
    G('psyT', after('psy'), 'thock', .35, 1.1); GAMES[1].plus = '+3 YRS'; GAMES[1].yEnd = GAMES[1].knock;
    build({ id: 'shen', n: 18, mo: 2, plq: PQ.shen, b0: PQ.shen + .3, land: onset('shen', 'eighteen'), knock: PQ.sor - .15 }, 's');
    G('shenT', after('shen') - .05, 'thock', .35, 1.1); GAMES[2].plus = '+5 YRS';
    GAMES.slice(0, 3).forEach(function (G0, i) { G('knock' + i, G0.knock, 'clank', .3, .3); });
    /* nov: two pages tear off the two tops and meet in the middle; SAME DAY on "19th" */
    T.pg0 = G('tear', start('nov') - .2, 'tear', .3, 1);
    T.k19 = at('nov', 'november'); T.pgG = at('nov', 'familiar?') - .12; G('tear2', T.pgG, 'tear', .3, .8);
    /* SAME DAY slams in the pause right after "familiar?" */
    T.same = G('sameS', wend('nov', 'familiar?') + .3, 'thock', .3, 1.2);
    /* sor: the pages fly off before the plaque flips; 26 pads roll from 0 and the last one lands on "26" */
    T.pgOut = PQ.sor - .5; GAMES[2].yEnd = T.pgG - .25;
    G('pgOut', T.pgOut, 'swish', .3, .8);
    T.E0 = start('end') - .45;
    build({ id: 'sor', n: 26, mo: 1, plq: PQ.sor, b0: PQ.sor + .3, land: onset('sor', '26'), knock: T.E0 }, 'o');
    T.hero = G('hero', after('sor'), 'stamp', .45, .85, { heavy: true });
    /* dbl: two GTA lengths laid up the tower's side */
    T.bA = at('dbl', 'twice'); T.bB = at('dbl', 'long') - .05; G('x2P', after('dbl'), 'pop', .35, 1); T.x2 = wend('dbl', 'long');
    /* the GTA tower walks back in beside the 26 at the same scale on "twice"; the hero stamp makes room */
    T.gIn = T.bA - .3; T.heroOut = T.E0; G('gIn', T.gIn, 'swish', .3, .7);
    /* end */
    G('tumble', T.E0 - .05, 'clank', .3, 1); G('back', T.E0 + .5, 'swish', .2, .6);
    T.kLong = at('end', 'years'); T.vote = at('end', 'is'); T.kYes = at('end', 'yes'); T.kNo = at('end', 'no?');
    T.W5 = DUR - .35; G('w5', T.W5 - .25, 'swish', .3, .9);
    T.PLQ = [{ t: T.plq0, pc: P.plq.gta, title: 'GTA 5 → GTA 6', dates: 'SEPT 2013 → NOV 2026' }, { t: PQ.kh, pc: P.plq.kh, title: 'KINGDOM HEARTS III', dates: 'DEC 2005 → JAN 2019 · JP' }, { t: PQ.psy, pc: P.plq.psy, title: 'PSYCHONAUTS 2', dates: '2005 → 2021' },
      { t: PQ.shen, pc: P.plq.shen, title: 'SHENMUE III', dates: '2001 (JP) → 2019' }, { t: PQ.sor, pc: P.plq.sor, title: 'STREETS OF RAGE 4', dates: '1994 (JP) → 2020' },
      { t: T.E0, pc: null }];
    /* jury r2: a line's caption waits until its own plaque has replaced the last one */
    var PSHOW = { kh: PQ.kh + .14, psy: PQ.psy + .14, shen: PQ.shen + .14, sor: PQ.sor + .14 };
    CAPS.forEach(function (c) { c.s = Math.max(c.t0 - .04, PSHOW[c.id] || 0); });
    STRESS = [['rec', 'record.'], ['kh', 'thirteen'], ['tie', 'tie.'], ['psy', 'sixteen.'], ['shen', 'eighteen'], ['nov', 'november'], ['sor', '26'], ['dbl', 'twice']].map(function (p) { return at(p[0], p[1]); });
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
    function env(pm, pts) { /* start the param at its first value: before its first automation point it would sit at the default (1) and click */ pm.value = pts[0][1]; pm.setValueAtTime(pts[0][1], 0); pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
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
    function clank(t, g) { osc2('triangle', 523, t, t + .3, [[t, 0], [t + .003, .2 * g], [t + .2, 0]]); osc2('triangle', 811, t, t + .25, [[t, 0], [t + .003, .12 * g], [t + .16, 0]]); thump(t, .45 * g, 170); tick(t, 1.4 * g, 2200); for (var j = 1; j < 6; j++) { tick(t + j * .05, .6 * g, 1800); thump(t + j * .05, .12 * g, 260); } }
    function zip(t, g) { band(t, t + .3, 900, 5200, .1 * g, .04 * g, 1.6, .2); for (var j = 0; j < 7; j++) tick(t + j * .04, .35 * g, 3400); }
    var LEVEL = { ratchet: 2, stamp: 1, swish: 14, tick: 2.4, tear: 9, thock: 2, pop: 4.6, clank: 2.4, zip: 6 };
    var TRIM = window.SFX_TRIM || {};
    /* gta-price jury r1 + this film's first mix (minor hits peaked at the voice): every hit at least 3 dB under the voice, the hero stamp the loudest hit (dB per type, on top of LEVEL) */
    var TYPE_DB = window.SFX_TYPE_DB || { stamp: 0, swish: -8, tick: -6, ratchet: -4, tear: -12, pop: -14, clank: -14, thock: -6, zip: -9 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'stamp') stamp(e.t, g, e.heavy);
      else if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'tear') tear(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
      else if (e.type === 'pop') pop(e.t, g);
      else if (e.type === 'clank') clank(e.t, g);
      else if (e.type === 'zip') zip(e.t, g);
      else if (e.type === 'tick') { tick(e.t, 1.2 * g, 2200); thump(e.t, .12 * g, 400); }
      else if (e.type === 'ratchet') { for (var j = 0; j < 4; j++) tick(e.t + j * .022, (.7 + .1 * j) * g, 2600 - 200 * j); thock(e.t + .09, .8 * g); }
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

  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-longestwait', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  var _bt = buildTextures; buildTextures = function () { _bt(); EV.length = 0; GAMES.length = 0; initTimes(); window.FILM.POSTER = Math.round((T.x2 + .5) * 30) / 30 + 1 / 60;
    window.FILM.SHOTS = [{ id: 'hook', name: '13 years', t0: 0, t1: start('ask') }, { id: 'kh', name: 'Kingdom Hearts III', t0: start('ask'), t1: start('psy') }, { id: 'psy', name: 'Psychonauts 2', t0: start('psy'), t1: start('shen') }, { id: 'shen', name: 'Shenmue III', t0: start('shen'), t1: start('sor') }, { id: 'sor', name: 'Streets of Rage 4', t0: start('sor'), t1: T.E0 }, { id: 'vote', name: 'Yes or no?', t0: T.E0, t1: DUR }]; };

  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  /* rail scan: with the bleed wall off and no clip, every shape and glyph must stay inside x 90-930 and above y 1450 */
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
