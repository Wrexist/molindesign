/* "GTA 5 is 13 years old. Why is it still selling?" (gta-moneymachine): Delta's weekly long video, 16:9, 1920x1080.
   A film written in code, narrated first and cut to the voice: every beat is keyed to a word time from vo/vo.js
   (window.VO) with at(id, word). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t),
   SCORE(ctx). The set is a dark accounting ledger (ruled teal lines, a pink double margin) with a stock-ticker
   crawl across the top and a receipt-printer tape down the right edge that prints every money number as it is said.
   Six named chapter cards slam down with a heavy clunk. One hero object per beat: a blank game case, tear-off
   calendars, the $1B bill brick, the fiscal-year ruler, the re-created 10-K line, the in-game spending pie, three
   shelves of generic consoles, the copy counter, the 13-row ledger of Take-Two's own shares, the split-screen
   with diverging counters (launch year stops at $1.6B, every year after keeps rolling to about $9.0B, our math),
   the revenue bars and the money machine that hands its key from GTA 5 to GTA 6.
   Every number is in BRIEF.md §5. Our own flat graphics: no Rockstar footage, logo, key art, box art or
   screenshots, no console logos (platforms are type on chips); no music (voice + foley). */
(function () {
  'use strict';
  var W = 1920, H = 1080, VO = window.VO, DUR = VO.dur, TAU = Math.PI * 2;
  var BG = '#0d0a1c', CREAM = '#fbf0ea', PAPER = '#f3e8d2', NEWS = '#efe5cf', INK = '#1d1233', PLUM = '#2a1850';
  var HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d', GOLD = '#ffc83d', MONEY = '#cdebc9', MONEY2 = '#5f9a6e', CASE = '#143b52', CASE2 = '#0c2737';
  var GREY = '#8d86a3', DISP = 'Archivo';
  var SX = 830;                 /* stage centre while the tape is up */

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* critically damped settle 0 -> 1, never overshoots (no bouncy easing) */
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function fin(t, a, d) { return seg(t, a, a + (d || .14)); }
  function kn(t, a, amt) { if (t < a) return 1; var u = t - a; return 1 + (amt || .08) * (1 - Math.exp(-u * 40)) * Math.exp(-u * 7); }
  function sw(t, a, amp, f, d) { if (t < a) return 0; var u = t - a; return amp * Math.exp(-u * (d || 2.6)) * Math.sin(u * (f || 7)); }
  function bob(t, ph, amp) { return (amp == null ? 5 : amp) * Math.sin(t * 1.6 + (ph || 0)); }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function commas(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}, ORDER = []; VO.lines.forEach(function (l) { LINE[l.id] = l; ORDER.push(l.id); });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (!l) throw new Error('no line ' + id); if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function wend(id, word, nth) { return find(id, word, nth).t1; }
  function start(id) { return LINE[id].t0; }
  function lastw(id) { var w = LINE[id].words; return w[w.length - 1].t1; }
  function nextStart(id) { var i = ORDER.indexOf(id); return i + 1 < ORDER.length ? start(ORDER[i + 1]) : DUR; }

  /* ---------- the SFX gate: hits sit in pauses, clear of where the voice really sounds (vo/vad.js) ---------- */
  var EDGES = [], VOICED = [];
  if (window.VAD) window.VAD.forEach(function (v) { VOICED.push({ t0: v[0], t1: v[1] }); EDGES.push(v[0], v[1]); });
  else VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  function free(m) {
    var B = [], M = [], F = [], p = 0;
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { clunk: .34, stamp: .27, swish: .26, pop: .1, tick: .05, tear: .1, ding: .22, print: .16, thock: .12 };
  var FREE = null;
  function nearGap(t, type, m) {
    var bd = BODY[type] || .12, best = null;
    (FREE || (FREE = free(m || (window.VAD ? .15 : .2)))).forEach(function (f) {
      var lo = f[0], hi = f[1] - bd; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  var GT = {}, EV = [];
  function G(id, t, type, tol, gain, extra) {
    var n = nearGap(t, type);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .35 : tol)) { GT[id] = n; var e = { t: n, type: type, g: gain == null ? 1 : gain, id: id }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
    else GT[id] = t;
    return GT[id];
  }
  function vadEnd(id) { var ve = lastw(id) - .6, nx = nextStart(id); (window.VAD || []).forEach(function (v) { if (v[0] < nx - .2 && v[1] > ve) ve = v[1]; }); return ve; }
  function after(id) { return Math.max(vadEnd(id) + .16, Math.min(LINE[id].t1 + .22, nextStart(id) - .35)); }

  /* ---------- canvas, text recording (TEXTS = what was really drawn, legibly) ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  var REC = null;
  function reg(g, id, text) {
    if (!REC || g.globalAlpha < .6) return;
    var m = g.getTransform(), s = Math.sqrt(m.a * m.a + m.b * m.b); if (s < .8) return;
    if (m.e < -400 || m.e > W + 400) return;
    REC[id] = text;
  }
  function font(g, px, wt, fam) { g.font = (wt || 900) + ' ' + px + 'px ' + (fam || DISP); if (g.__st) try { g.fontStretch = g.__st; } catch (e) {} }
  function cond(g, st) { g.__st = st || 'condensed'; try { g.fontStretch = g.__st; } catch (e) {} }
  function unst(g) { g.__st = null; try { g.fontStretch = 'normal'; } catch (e) {} }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, TAU); }
  /* text: o = {px, col, align, wt, st, a, reg, ls, id, base} ; returns width */
  function TX(g, text, x, y, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0.003) return 0;
    var px = o.px || 44;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); cond(g, o.st || 'condensed'); font(g, px, o.wt || 900, o.fam); ls(g, o.ls == null ? 1 : o.ls);
    g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'middle';
    if (o.shadow) { g.fillStyle = o.shadow; g.fillText(text, x + px * .05, y + px * .07); }
    if (o.stroke) { g.lineWidth = o.lw || px * .12; g.strokeStyle = o.stroke; g.lineJoin = 'round'; g.strokeText(text, x, y); }
    g.fillStyle = o.col || CREAM; g.fillText(text, x, y);
    var w = g.measureText(text).width;
    if (o.reg !== false) reg(g, o.id || text, text);
    g.restore(); unst(g); ls(g, 0);
    return w;
  }
  function tw(g, text, px, st, wt) { g.save(); cond(g, st || 'condensed'); font(g, px, wt || 900); ls(g, 1); var w = g.measureText(text).width; g.restore(); unst(g); ls(g, 0); return w; }
  /* a printed chip: flat paper label with a hard shadow */
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 44, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= .003 || s <= .01) return 0;
    var w = (o.w || tw(g, text, px, o.st) + px * .8), h = o.h || px * 1.34;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    var ax = o.align === 'left' ? 0 : o.align === 'right' ? -w : -w / 2;
    if (o.shadow !== false) { g.fillStyle = 'rgba(3,2,10,.55)'; rr(g, ax + 6, -h / 2 + 8, w, h, 6); g.fill(); }
    g.fillStyle = o.bg || CREAM; rr(g, ax, -h / 2, w, h, 6); g.fill();
    grainOn(g, ax, -h / 2, w, h, .35);
    if (o.line) { g.strokeStyle = o.line; g.lineWidth = 3; rr(g, ax + 5, -h / 2 + 5, w - 10, h - 10, 4); g.stroke(); }
    TX(g, text, ax + w / 2, px * .04, { px: px, col: o.fg || INK, st: o.st, id: o.id, reg: o.reg });
    g.restore();
    return w;
  }

  /* ---------- paper ---------- */
  var GRAIN = null, PAT = new Map();
  function buildGrain() {
    var c = mk(256, 256), g = c.getContext('2d'), r = mulberry(41), i;
    for (i = 0; i < 4200; i++) { var d = r(); g.fillStyle = d < .55 ? 'rgba(60,35,10,' + (.05 + r() * .1).toFixed(3) + ')' : 'rgba(255,255,255,' + (.06 + r() * .14).toFixed(3) + ')'; g.fillRect(r() * 256, r() * 256, .6 + r() * 1.5, .6 + r() * 1.5); }
    g.lineWidth = .8;
    for (i = 0; i < 100; i++) { var x = r() * 256, y = r() * 256, an = r() * 6.28, L = 6 + r() * 16; g.strokeStyle = 'rgba(70,45,20,' + (.07 + r() * .09).toFixed(3) + ')'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(an + .6) * L * .5, y + Math.sin(an + .6) * L * .5, x + Math.cos(an) * L, y + Math.sin(an) * L); g.stroke(); }
    return c;
  }
  function grainOn(g, x, y, w, h, a) {
    var p = PAT.get(g); if (!p) { p = g.createPattern(GRAIN, 'repeat'); PAT.set(g, p); }
    g.save(); g.globalAlpha *= a == null ? .7 : a; g.fillStyle = p; g.fillRect(x, y, w, h); g.restore();
  }
  /* a paper sheet centred at the origin of the current transform */
  function sheet(g, w, h, bg, o) {
    o = o || {}; var r = o.r == null ? 8 : o.r;
    if (o.shadow !== false) { g.fillStyle = 'rgba(3,2,10,.5)'; rr(g, -w / 2 + 10, -h / 2 + 14, w, h, r); g.fill(); }
    g.fillStyle = bg || PAPER; rr(g, -w / 2, -h / 2, w, h, r); g.fill();
    g.save(); rr(g, -w / 2, -h / 2, w, h, r); g.clip(); grainOn(g, -w / 2, -h / 2, w, h, o.grain == null ? .8 : o.grain);
    if (o.rule) { g.fillStyle = o.rule; for (var yy = -h / 2 + (o.rs || 40); yy < h / 2 - 6; yy += (o.rs || 40)) g.fillRect(-w / 2, yy, w, 2); }
    g.restore();
    if (o.edge !== false) { g.strokeStyle = 'rgba(255,250,236,.75)'; g.lineWidth = 2.2; rr(g, -w / 2, -h / 2, w, h, r); g.stroke(); }
  }
  /* place: a rigid body that settles in from offset (dx,dy) and scale s0, then bobs */
  function place(g, t, a, x, y, o) {
    o = o || {}; var k = cd(t, a, o.w || 14), ph = o.ph || (x * .013);
    var dx = (o.dx || 0) * (1 - k), dy = (o.dy == null ? 60 : o.dy) * (1 - k), s = lerp(o.s0 == null ? .82 : o.s0, 1, k) * (o.s || 1);
    g.translate(x + dx, y + dy + (o.nobob ? 0 : bob(t, ph, o.bob))); g.rotate((o.rot || 0) + (o.nobob ? 0 : .006 * Math.sin(t * 1.1 + ph)) + (o.r0 || 0) * (1 - k)); g.scale(s, s);
    g.globalAlpha *= fin(t, a, o.fd || .16);
    return k;
  }
  /* out: a beat element leaving (alpha and a small drop) */
  function leave(g, t, b, d) { var k = seg(t, b, b + (d || .25)); if (k > 0) { g.globalAlpha *= 1 - k; g.translate(0, 40 * eio(k)); } return k < 1; }

  /* ---------- props (all our own flat drawings) ---------- */
  /* a blank game case: our own typeset title, a striped cover, no box art, no logos */
  function gameCase(g, title, s, o) {
    o = o || {}; var w = 300, h = 420; g.save(); g.scale(s || 1, s || 1);
    g.fillStyle = 'rgba(3,2,10,.5)'; rr(g, -w / 2 + 12, -h / 2 + 16, w, h, 18); g.fill();
    g.fillStyle = o.plastic || CASE; rr(g, -w / 2, -h / 2, w, h, 18); g.fill();
    g.fillStyle = CASE2; rr(g, -w / 2, -h / 2, 26, h, 14); g.fill();
    var ix = -w / 2 + 36, iy = -h / 2 + 16, iw = w - 52, ih = h - 32;
    g.save(); rr(g, ix, iy, iw, ih, 6); g.clip();
    g.fillStyle = o.cover || PLUM; g.fillRect(ix, iy, iw, ih);
    var cols = o.stripes || [HOT, ORG, TEAL];
    for (var i = 0; i < 9; i++) { g.fillStyle = cols[i % cols.length]; g.save(); g.translate(ix + iw / 2, iy + ih * .78); g.rotate(-.42); g.fillRect(-300, -150 + i * 34, 600, 18); g.restore(); }
    grainOn(g, ix, iy, iw, ih, .6);
    g.restore();
    TX(g, title, ix + iw / 2, iy + 92, { px: o.px || 104, col: CREAM, st: 'extra-condensed', shadow: 'rgba(0,0,0,.45)', id: o.id });
    if (o.sub) TX(g, o.sub, ix + iw / 2, iy + 168, { px: 38, col: GOLD, st: 'condensed' });
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 3; rr(g, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 15); g.stroke();
    if (o.glow) { g.save(); g.globalAlpha *= o.glow; g.strokeStyle = TEAL; g.lineWidth = 10; rr(g, -w / 2 - 12, -h / 2 - 12, w + 24, h + 24, 26); g.stroke(); g.globalAlpha *= .4; g.lineWidth = 26; rr(g, -w / 2 - 22, -h / 2 - 22, w + 44, h + 44, 34); g.stroke(); g.restore(); }
    g.restore();
  }
  /* a tear-off calendar: pink header band, big day, footer */
  function calendar(g, head, big, foot, s, o) {
    o = o || {}; var w = 330, h = 380; g.save(); g.scale(s || 1, s || 1);
    sheet(g, w, h, PAPER, { r: 10 });
    g.save(); rr(g, -w / 2, -h / 2, w, 92, 10); g.clip(); g.fillStyle = o.band || HOT; g.fillRect(-w / 2, -h / 2, w, 92); g.restore();
    [-80, 80].forEach(function (x) { g.fillStyle = '#3b2a55'; circ(g, x, -h / 2 + 8, 13); g.fill(); g.fillStyle = '#c9c0d8'; rr(g, x - 5, -h / 2 - 22, 10, 34, 5); g.fill(); });
    TX(g, head, 0, -h / 2 + 50, { px: o.hpx || 50, col: CREAM });
    TX(g, big, 0, 22 + (o.bdy || 0), { px: o.bpx || 190, col: INK, st: 'extra-condensed', reg: o.reg });
    if (foot) TX(g, foot, 0, h / 2 - 52, { px: o.fpx || 44, col: o.fcol || PLUM, reg: o.reg });
    if (o.circle) { g.save(); g.globalAlpha *= o.circle; g.strokeStyle = HOT; g.lineWidth = 9; g.beginPath(); g.ellipse(0, 24, 128, 104, -.1, 0, TAU * Math.min(1, o.circle * 1.02)); g.stroke(); g.restore(); }
    g.restore();
  }
  function bill(g, s, rot, o) {
    o = o || {}; var w = 300, h = 136; g.save(); if (rot) g.rotate(rot); g.scale(s || 1, s || 1);
    if (o.shadow !== false) { g.fillStyle = 'rgba(3,2,10,.45)'; g.fillRect(-w / 2 + 7, -h / 2 + 9, w, h); }
    g.fillStyle = o.col || MONEY; g.fillRect(-w / 2, -h / 2, w, h); grainOn(g, -w / 2, -h / 2, w, h, .5);
    g.strokeStyle = MONEY2; g.lineWidth = 5; g.strokeRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20);
    g.fillStyle = MONEY2; circ(g, 0, 0, 40); g.fill(); g.fillStyle = o.col || MONEY; circ(g, 0, 0, 32); g.fill();
    TX(g, o.sym || '$', 0, 3, { px: 54, col: MONEY2, reg: false });
    g.restore();
  }
  function brick(g, s, band, o) {
    o = o || {}; g.save(); g.scale(s || 1, s || 1);
    for (var i = 7; i >= 0; i--) { g.save(); g.translate(-i * 4, -i * 10 + 40); bill(g, 1.35, 0, { shadow: i === 7 }); g.restore(); }
    if (band) { g.save(); g.globalAlpha *= band; g.fillStyle = 'rgba(3,2,10,.4)'; g.fillRect(-58 + 6, -110 + 8, 116, 260); g.fillStyle = GOLD; g.fillRect(-58, -110, 116, 250); grainOn(g, -58, -110, 116, 250, .5); g.restore(); }
    g.restore();
  }
  function stopwatch(g, r, ang) {
    g.fillStyle = 'rgba(3,2,10,.5)'; circ(g, 10, 14, r); g.fill();
    g.fillStyle = '#d9d2e6'; rr(g, -30, -r - 46, 60, 40, 8); g.fill(); rr(g, -12, -r - 16, 24, 26, 4); g.fill();
    g.fillStyle = CREAM; circ(g, 0, 0, r); g.fill(); grainOn(g, -r, -r, 2 * r, 2 * r, .4);
    g.strokeStyle = INK; g.lineWidth = 10; circ(g, 0, 0, r - 5); g.stroke();
    for (var i = 0; i < 60; i++) { var a = i / 60 * TAU, L = i % 5 ? 12 : 28; g.strokeStyle = i % 5 ? 'rgba(29,18,51,.5)' : INK; g.lineWidth = i % 5 ? 3 : 6; g.beginPath(); g.moveTo(Math.sin(a) * (r - 22), -Math.cos(a) * (r - 22)); g.lineTo(Math.sin(a) * (r - 22 - L), -Math.cos(a) * (r - 22 - L)); g.stroke(); }
    g.save(); g.rotate(ang); g.fillStyle = HOT; g.beginPath(); g.moveTo(-6, 20); g.lineTo(0, -(r - 40)); g.lineTo(6, 20); g.closePath(); g.fill(); g.restore();
    g.fillStyle = INK; circ(g, 0, 0, 14); g.fill();
  }
  function wallClock(g, r, ah, am) {
    g.fillStyle = 'rgba(3,2,10,.5)'; circ(g, 10, 14, r); g.fill();
    g.fillStyle = PLUM; circ(g, 0, 0, r); g.fill(); g.fillStyle = CREAM; circ(g, 0, 0, r - 16); g.fill(); grainOn(g, -r, -r, 2 * r, 2 * r, .4);
    for (var i = 0; i < 12; i++) { var a = i / 12 * TAU; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(Math.sin(a) * (r - 34), -Math.cos(a) * (r - 34)); g.lineTo(Math.sin(a) * (r - 62), -Math.cos(a) * (r - 62)); g.stroke(); }
    g.lineCap = 'round';
    g.save(); g.rotate(ah); g.strokeStyle = INK; g.lineWidth = 16; g.beginPath(); g.moveTo(0, 12); g.lineTo(0, -(r * .48)); g.stroke(); g.restore();
    g.save(); g.rotate(am); g.strokeStyle = HOT; g.lineWidth = 10; g.beginPath(); g.moveTo(0, 16); g.lineTo(0, -(r * .74)); g.stroke(); g.restore();
    g.lineCap = 'butt'; g.fillStyle = INK; circ(g, 0, 0, 14); g.fill();
  }
  function priceTag(g, lines, s, o) {
    o = o || {}; var w = o.w || 360, h = o.h || 220; g.save(); g.scale(s || 1, s || 1);
    function path() { g.beginPath(); g.moveTo(-w / 2 + 70, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2 + 70, h / 2); g.lineTo(-w / 2, 0); g.closePath(); }
    g.save(); g.translate(9, 12); path(); g.fillStyle = 'rgba(3,2,10,.5)'; g.fill(); g.restore();
    path(); g.fillStyle = o.bg || GOLD; g.fill(); g.save(); path(); g.clip(); grainOn(g, -w / 2, -h / 2, w, h, .6); g.restore();
    g.strokeStyle = 'rgba(255,250,236,.8)'; g.lineWidth = 2.5; path(); g.stroke();
    g.fillStyle = BG; circ(g, -w / 2 + 44, 0, 14); g.fill();
    lines.forEach(function (L) { TX(g, L[0], 30 + (L[3] || 0), L[1], { px: L[2], col: L[4] || INK }); });
    g.restore();
  }
  function consoleBox(g, label, w, h, col, o) {
    o = o || {}; g.save();
    g.fillStyle = 'rgba(3,2,10,.5)'; rr(g, -w / 2 + 9, -h + 12, w, h, 12); g.fill();
    g.fillStyle = col || '#3a3352'; rr(g, -w / 2, -h, w, h, 12); g.fill(); grainOn(g, -w / 2, -h, w, h, .35);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-w / 2 + 14, -h + 14, w - 28, 8);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-w / 2 + 24, -h / 2 - 4, w * .5, 8);
    g.fillStyle = o.led || TEAL; circ(g, w / 2 - 30, -h / 2, 8); g.fill();
    g.restore();
    if (label) chip(g, label, 0, 46, { px: o.px || 40, bg: o.lbg || CREAM });
  }
  function pcTower(g, label) {
    g.fillStyle = 'rgba(3,2,10,.5)'; rr(g, -70 + 9, -260 + 12, 140, 260, 10); g.fill();
    g.fillStyle = '#2e2944'; rr(g, -70, -260, 140, 260, 10); g.fill(); grainOn(g, -70, -260, 140, 260, .35);
    for (var i = 0; i < 6; i++) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-46, -220 + i * 22, 92, 8); }
    g.fillStyle = TEAL; circ(g, 0, -60, 12); g.fill();
    if (label) chip(g, label, 0, 46, { px: 40 });
  }
  function shelf(g, x0, x1, y) {
    g.fillStyle = 'rgba(3,2,10,.5)'; g.fillRect(x0 + 8, y + 10, x1 - x0, 26);
    g.fillStyle = '#7a4f2a'; g.fillRect(x0, y, x1 - x0, 26); grainOn(g, x0, y, x1 - x0, 26, .8);
    g.fillStyle = '#a06b3c'; g.fillRect(x0, y, x1 - x0, 6);
  }
  function pie(g, r, frac, col, base) {
    g.fillStyle = 'rgba(3,2,10,.5)'; circ(g, 10, 14, r); g.fill();
    g.fillStyle = base || '#3d3358'; circ(g, 0, 0, r); g.fill();
    if (frac > 0) { g.fillStyle = col || TEAL; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + TAU * frac); g.closePath(); g.fill(); }
    g.save(); circ(g, 0, 0, r); g.clip(); grainOn(g, -r, -r, 2 * r, 2 * r, .5); g.restore();
    g.strokeStyle = 'rgba(255,250,236,.8)'; g.lineWidth = 3; circ(g, 0, 0, r); g.stroke();
  }
  function arrowDown(g, len, w, col) {
    g.fillStyle = 'rgba(3,2,10,.5)'; g.save(); g.translate(8, 10);
    g.beginPath(); g.moveTo(-w * .32, 0); g.lineTo(w * .32, 0); g.lineTo(w * .32, len - w * .7); g.lineTo(w * .6, len - w * .7); g.lineTo(0, len); g.lineTo(-w * .6, len - w * .7); g.lineTo(-w * .32, len - w * .7); g.closePath(); g.fill(); g.restore();
    g.fillStyle = col || ORG; g.beginPath(); g.moveTo(-w * .32, 0); g.lineTo(w * .32, 0); g.lineTo(w * .32, len - w * .7); g.lineTo(w * .6, len - w * .7); g.lineTo(0, len); g.lineTo(-w * .6, len - w * .7); g.lineTo(-w * .32, len - w * .7); g.closePath(); g.fill();
  }
  function arrowRight(g, len, w, col) {
    g.fillStyle = col || CREAM; g.beginPath(); g.moveTo(0, -w * .3); g.lineTo(len - w * .7, -w * .3); g.lineTo(len - w * .7, -w * .6); g.lineTo(len, 0); g.lineTo(len - w * .7, w * .6); g.lineTo(len - w * .7, w * .3); g.lineTo(0, w * .3); g.closePath(); g.fill();
  }
  /* an ink stamp: double border, slight tilt, slams in from 1.5x */
  function stamp(g, t, a, text, x, y, o) {
    o = o || {}; if (t < a) return; var k = cd(t, a, 26), px = o.px || 72;
    g.save(); g.translate(x, y); g.rotate(o.rot == null ? -.08 : o.rot); var s = lerp(1.6, 1, k); g.scale(s, s); g.globalAlpha *= fin(t, a, .06) * (o.a == null ? 1 : o.a);
    var w = tw(g, text, px, 'condensed') + px * .9, h = px * 1.5, col = o.col || HOT;
    g.strokeStyle = col; g.lineWidth = 8; rr(g, -w / 2, -h / 2, w, h, 8); g.stroke(); g.lineWidth = 3; rr(g, -w / 2 + 12, -h / 2 + 12, w - 24, h - 24, 5); g.stroke();
    if (o.fill) { g.fillStyle = o.fill; rr(g, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 6); g.fill(); }
    TX(g, text, 0, px * .05, { px: px, col: col });
    g.restore();
  }
  /* rolling number (quantized to the sampled frame so motion blur never blends two values) */
  function rollV(t, a, b, v0, v1, step) { var k = eio(seg(tq(t), a, b)); var v = lerp(v0, v1, k); return step ? Math.round(v / step) * step : v; }

  /* ---------- quotable lines: paper word tiles slap down on their words ---------- */
  function tiles(g, t, id, x, y, maxw, px, o) {
    /* the quotable: the whole line cascades down as tiles at the line's start (so it can be read while it is said);
       the key word turns pink when it is spoken */
    o = o || {}; var up = o.text.split(' '), rows = [[]], rw = [0], gap = px * .32, lw = LINE[id].words;
    var wd = up.map(function (u) { return tw(g, u, px, 'condensed') + px * .5; });
    up.forEach(function (u, i) { var L = rows.length - 1; if (rw[L] + wd[i] > maxw && rows[L].length) { rows.push([]); rw.push(0); L++; } rows[L].push(i); rw[L] += wd[i] + gap; });
    var lh = px * 1.45, y0 = y - (rows.length - 1) * lh / 2, any = false, r = mulberry(Math.round(start(id) * 10)), t00 = start(id) - .2;
    rows.forEach(function (row, ri) {
      var xx = x - (rw[ri] - gap) / 2;
      row.forEach(function (i) {
        var t0 = t00 + i * .1, rot = (r() - .5) * .07, cx = xx + wd[i] / 2, nw = norm(up[i]), said = null;
        xx += wd[i] + gap;
        if (t < t0) return; any = true;
        if (o.hot && o.hot.test(nw)) lw.forEach(function (w) { if (said === null && norm(w.w) === nw) said = w.t0; });
        var hot = said !== null && t >= said - .04, hk = hot ? kn(t, said - .04, .12) : 1;
        var k = cd(t, t0, 22);
        g.save(); g.translate(cx, y0 + ri * lh - 30 * (1 - k)); g.rotate(rot * (1 - .4 * k)); var s = lerp(1.35, 1, k) * hk; g.scale(s, s); g.globalAlpha *= fin(t, t0, .07);
        var w = wd[i], h = px * 1.22;
        g.fillStyle = 'rgba(3,2,10,.55)'; g.fillRect(-w / 2 + 7, -h / 2 + 10, w, h);
        g.fillStyle = hot ? HOT : (o.bg || NEWS); g.fillRect(-w / 2, -h / 2, w, h); grainOn(g, -w / 2, -h / 2, w, h, .5);
        TX(g, up[i], 0, px * .05, { px: px, col: hot ? CREAM : INK, reg: false });
        g.restore();
      });
    });
    if (any && g.globalAlpha >= .6) REC && (REC['tiles-' + id] = o.text);
  }

  /* =====================================================================================================
     THE SET: a dark ledger page. Ruled teal lines drift up slowly, a pink double margin, column rules,
     a giant outlined chapter numeral; a ticker crawl on top; the receipt tape on the right.
     ===================================================================================================== */
  var LEDGER = null, VIG = null;
  function buildLedger() {
    LEDGER = mk(W, H + 60); var g = LEDGER.getContext('2d');
    g.fillStyle = BG; g.fillRect(0, 0, W, H + 60);
    var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(42,24,80,.55)'); gr.addColorStop(.6, 'rgba(13,10,28,0)'); gr.addColorStop(1, 'rgba(25,60,70,.35)'); g.fillStyle = gr; g.fillRect(0, 0, W, H + 60);
    for (var y = 0; y < H + 60; y += 60) { g.fillStyle = 'rgba(25,211,197,.11)'; g.fillRect(0, y, W, 2); }
    g.fillStyle = 'rgba(255,79,163,.30)'; g.fillRect(78, 0, 3, H + 60); g.fillRect(88, 0, 3, H + 60);
    [1180, 1360, 1540].forEach(function (x) { g.fillStyle = 'rgba(25,211,197,.07)'; g.fillRect(x, 0, 2, H + 60); });
    /* halftone dots in two corners: texture, not shapes */
    for (var i = 0; i < 2; i++) { var cx = i ? W : 0, cy = i ? 0 : H; for (var yy = 0; yy < 520; yy += 22) for (var xx = 0; xx < 640; xx += 22) { var d = Math.hypot(xx, yy), r = 5 * (1 - d / 640); if (r > .4) { g.fillStyle = i ? 'rgba(25,211,197,.09)' : 'rgba(255,79,163,.08)'; circ(g, i ? cx - xx : cx + xx, i ? cy + yy : cy - yy, r); g.fill(); } } }
    var gg = g.createPattern(GRAIN, 'repeat'); g.globalAlpha = .18; g.fillStyle = gg; g.fillRect(0, 0, W, H + 60); g.globalAlpha = 1;
    VIG = mk(W, H); var q = VIG.getContext('2d'), rg = q.createRadialGradient(W / 2, H / 2, 420, W / 2, H / 2, 1180); rg.addColorStop(0, 'rgba(4,2,12,0)'); rg.addColorStop(1, 'rgba(4,2,12,.5)'); q.fillStyle = rg; q.fillRect(0, 0, W, H);
  }
  function ledgerBg(g, t) {
    var off = (t * 14) % 60; g.drawImage(LEDGER, 0, -off);
    /* the chapter numeral, huge and outlined, drifting */
    var ch = chapterAt(t); if (ch < 1) return;
    g.save(); g.translate(1210 + 30 * Math.sin(t * .21), 600 + 18 * Math.sin(t * .17)); g.rotate(-.06 + .02 * Math.sin(t * .13));
    cond(g, 'extra-condensed'); font(g, 980, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = 'rgba(25,211,197,.08)'; g.strokeText(String(ch), 0, 0); unst(g);
    g.restore();
  }

  /* ---------- the ticker crawl (sourced facts only, BRIEF §5) ---------- */
  var TICK = [
    ['GTA 5 · 230M+ COPIES SOLD-IN · TAKE-TWO, AUG 2026', 'GTA 6 · NOV 19 2026', 'EVERY NUMBER · TAKE-TWO SEC FILINGS'],
    ['GTA 5 LAUNCH · TUE SEPT 17 2013', 'DAY 1 · $800M+ · TAKE-TWO ESTIMATE', 'DAY 3 · $1B+ · TAKE-TWO, SEPT 20 2013'],
    ['TAKE-TWO YEAR · APRIL TO MARCH', 'FY2015 · GTA SALES DOWN ~$1,315.3M · 10-K', 'FY2015 · GTA 5 ON PS4 + XBOX ONE · NOV 2014'],
    ['GTA ONLINE · OCT 1 2013 · FREE WITH GTA 5', 'HEISTS · FREE UPDATE · 2015', 'GTA+ · MARCH 2022', 'SPENDING INSIDE GAMES · 25.8% TO 78.1% · ALL TAKE-TWO'],
    ['PS3 + XBOX 360 · 2013', 'PS4 + XBOX ONE · NOV 2014', 'PC · APR 2015', 'PS5 + XBOX SERIES X|S · MAR 2022', '32.5M+ · 105M+ · 230M+ SOLD-IN'],
    ['GTA GAMES · TAKE-TWO REVENUE · OUR MATH', 'LAUNCH YEAR · $1.6B', 'FY2015-FY2026 · ~$9.0B', 'TOTAL · $10B+'],
    ['GTA SHARE OF TAKE-TWO · 68.9% TO 12.4%', 'TAKE-TWO · $2.35B TO $6.66B', 'GTA 6 · NOV 19 2026 · PS5 + XBOX SERIES X|S']
  ], TSTRIP = [];
  function buildTicker() {
    TICK.forEach(function (items, ci) {
      var m = mk(4, 4).getContext('2d'); cond(m, 'condensed'); font(m, 36, 800); ls(m, 2);
      var parts = [], x = 0; items.forEach(function (s) { var w = m.measureText(s).width; parts.push([s, x, w]); x += w + 110; });
      var c = mk(x, 64), g = c.getContext('2d'); cond(g, 'condensed'); font(g, 36, 800); ls(g, 2); g.textBaseline = 'middle';
      parts.forEach(function (p, i) { g.fillStyle = i % 2 ? CREAM : TEAL; g.fillText(p[0], p[1], 34); g.save(); g.translate(p[1] + p[2] + 55, 32); g.rotate(Math.PI / 4); g.fillStyle = HOT; g.fillRect(-8, -8, 16, 16); g.restore(); });
      TSTRIP.push(c);
    });
  }
  function ticker(g, t) {
    var k = cd(t, 1.7, 10); if (k <= 0) return;
    var ch = Math.max(0, chapterAt(t)), c = TSTRIP[ch], y = -64 * (1 - k);
    g.save(); g.translate(0, y);
    g.fillStyle = '#07050f'; g.fillRect(0, 0, W, 64); g.fillStyle = HOT; g.fillRect(0, 62, W, 3);
    g.fillStyle = TEAL; g.fillRect(0, 0, 150, 64);
    TX(g, 'LEDGER', 75, 34, { px: 36, col: INK, reg: false });
    g.save(); g.beginPath(); g.rect(150, 0, W - 150, 64); g.clip();
    var off = ((t - (ch ? CH[ch - 1].out : 0)) * 120) % c.width; for (var x = 170 - off; x < W; x += c.width) g.drawImage(c, x, 0);
    g.restore(); g.restore();
  }

  /* ---------- the receipt tape: prints each money number as it is said ---------- */
  var TAPE = [], TX0 = 1588, TW = 252;
  function tapeOn(t) {
    var a = cd(t, T.tapeIn, 9) * (1 - eio(seg(t, T.tapeOut5, T.tapeOut5 + .4))) + (t > T.tapeIn6 ? cd(t, T.tapeIn6, 9) : 0) - (t > T.tapeOutE ? eio(seg(t, T.tapeOutE, T.tapeOutE + .4)) : 0);
    return clamp(a, 0, 1);
  }
  function tape(g, t) {
    var on = tapeOn(t); if (on <= 0) return;
    g.save(); g.translate((1 - on) * 340, 0);
    var shown = TAPE.filter(function (e) { return t >= e.t; }), n = shown.length, last = shown[n - 1];
    var feed = last ? eo(seg(t, last.t, last.t + .3)) : 1;
    /* paper */
    var x0 = TX0, y0 = 120;
    g.fillStyle = 'rgba(3,2,10,.5)'; g.fillRect(x0 + 10, y0, TW, H);
    g.fillStyle = '#f7f1e2'; g.fillRect(x0, y0, TW, H); grainOn(g, x0, y0, TW, H, .5);
    g.fillStyle = 'rgba(29,18,51,.06)'; for (var yy = y0 + 20; yy < H; yy += 12) g.fillRect(x0, yy, TW, 1);
    g.save(); g.beginPath(); g.rect(x0, y0 + 30, TW, H); g.clip();
    var LH = 108;
    for (var i = n - 1; i >= 0; i--) {
      var e = shown[i], k = n - 1 - i, y = y0 + 100 + (k - 1 + feed) * LH;
      if (y > H + 40) continue;
      g.save(); g.globalAlpha *= i === n - 1 ? fin(t, e.t, .08) : 1;
      TX(g, e.a, x0 + 14, y - 22, { px: 36, col: PLUM, align: 'left', st: 'extra-condensed' });
      if (e.b) TX(g, e.b, x0 + TW - 16, y + 22, { px: 60, col: e.col || INK, align: 'right', st: 'extra-condensed' });
      g.fillStyle = 'rgba(29,18,51,.25)'; for (var xx = x0 + 14; xx < x0 + TW - 14; xx += 14) g.fillRect(xx, y + 56, 7, 2);
      g.restore();
    }
    g.restore();
    /* printer head */
    g.fillStyle = 'rgba(3,2,10,.55)'; rr(g, x0 - 24 + 8, 70 + 10, TW + 48, 86, 12); g.fill();
    g.fillStyle = '#2b2440'; rr(g, x0 - 24, 70, TW + 48, 86, 12); g.fill(); grainOn(g, x0 - 24, 70, TW + 48, 86, .3);
    g.fillStyle = '#07050f'; g.fillRect(x0 - 6, 140, TW + 12, 10);
    var blink = last && t - last.t < .5 ? 1 : .35;
    g.fillStyle = blink > .5 ? HOT : 'rgba(255,79,163,.4)'; circ(g, x0 + TW - 6, 104, 9); g.fill();
    TX(g, 'PRINTS EVERY $', x0 + 104, 106, { px: 36, col: CREAM, reg: false });
    g.restore();
  }

  /* ---------- chapters ---------- */
  var CH = [
    { n: 1, id: 'c1', word: 'ONE', name: 'THREE DAYS' }, { n: 2, id: 'c2', word: 'TWO', name: 'THE DROP' }, { n: 3, id: 'c3', word: 'THREE', name: 'THE SECOND GAME' },
    { n: 4, id: 'c4', word: 'FOUR', name: 'THREE GENERATIONS' }, { n: 5, id: 'c5', word: 'FIVE', name: 'THE MACHINE' }, { n: 6, id: 'c6', word: 'SIX', name: 'THE HAND-OFF' }
  ];
  function chapterAt(t) { var c = 0; CH.forEach(function (h) { if (t >= h.cover) c = h.n; }); return c; }
  function chapterCard(g, t, h) {
    if (t < h.slam - .3 || t > h.out + .45) return;
    var kin = seg(t, h.slam - .26, h.slam), y = t < h.slam ? -H * (1 - kin * kin) : 0;
    var ko = eio(seg(t, h.out, h.out + .42)); y -= ko * (H + 40);
    var squash = t >= h.slam ? 1 - .018 * Math.exp(-(t - h.slam) * 14) : 1;
    /* the card never holds still: a slow push-in and the ruled lines creeping up (pacecheck: no static stretch over 1 s) */
    var dwell = Math.max(0, t - h.slam), z = 1 + .045 * dwell, drift = (dwell * 40) % 60;
    g.save(); g.translate(W / 2, H / 2 + y); g.scale(1, squash);
    g.fillStyle = 'rgba(3,2,10,.6)'; g.fillRect(-W / 2, H / 2 - 4, W, 40);
    g.fillStyle = PAPER; g.fillRect(-W / 2, -H / 2, W, H); grainOn(g, -W / 2, -H / 2, W, H, .9);
    g.fillStyle = 'rgba(25,120,140,.16)'; for (var yy = -H / 2 + 60 - drift; yy < H / 2; yy += 60) g.fillRect(-W / 2, yy, W, 2);
    g.scale(z, z); g.translate(-22 * dwell, 0);
    g.fillStyle = 'rgba(255,79,163,.5)'; g.fillRect(-W / 2 + 78, -H / 2, 3, H); g.fillRect(-W / 2 + 88, -H / 2, 3, H);
    /* the numeral block */
    var nx = -W / 2 + 470;
    g.fillStyle = 'rgba(3,2,10,.35)'; g.fillRect(nx - 230 + 14, -330 + 18, 460, 660);
    g.fillStyle = INK; g.fillRect(nx - 230, -330, 460, 660); grainOn(g, nx - 230, -330, 460, 660, .3);
    TX(g, String(h.n), nx, 40, { px: 600, col: HOT, st: 'extra-condensed', id: 'chn' + h.n });
    var tx = -W / 2 + 790, lk = cd(t, h.slam + .08, 16);
    TX(g, 'CHAPTER ' + h.word, tx + 40 * (1 - lk), -170, { px: 72, col: '#137f7a', align: 'left', a: lk, ls: 6 });
    var nm = h.name, px = 210; while (tw(g, nm, px, 'extra-condensed') > 1020 && px > 120) px -= 6;
    TX(g, nm, tx, 30, { px: px, col: INK, align: 'left', st: 'extra-condensed' });
    g.fillStyle = HOT; g.fillRect(tx, 170, 420 * eo(seg(t, h.slam + .1, h.slam + .5)), 16);
    TX(g, h.n + ' / 6', tx, 250, { px: 48, col: PLUM, align: 'left', a: lk });
    g.restore();
  }
  function chapterTag(g, t) {
    var ch = chapterAt(t); if (ch < 1 || t > T.endIn) return;
    var h = CH[ch - 1], k = cd(t, h.out + .1, 12);
    if (ch === 5 && t > T.split - .3) return;
    g.save(); g.translate(-40 * (1 - k), 0); g.globalAlpha *= k;
    var w = tw(g, h.name, 40) + 30;
    g.fillStyle = 'rgba(3,2,10,.5)'; g.fillRect(118 + 6, 90 + 8, 66 + w, 58);
    g.fillStyle = HOT; g.fillRect(118, 90, 66, 58); TX(g, String(h.n), 151, 121, { px: 44, col: CREAM, reg: false });
    g.fillStyle = CREAM; g.fillRect(184, 90, w, 58); TX(g, h.name, 184 + w / 2, 121, { px: 40, col: INK, reg: false });
    g.restore();
  }

  /* =====================================================================================================
     SCENES. Each starts just before its first line; the old one slides off left as the new one slides in.
     ===================================================================================================== */
  var T = {}, SC = [];
  function S(from, draw, o) { SC.push({ from: from, draw: draw, o: o || {} }); }
  var SWORD = { c4x: 'npd' };

  /* --- cold open --- */
  S('hook', function (g, t) {
    /* frame 0 (jury r1): the case sharp and at rest, `13 YEARS.` already printed, the SEPT 2013 tag readable; the calendar glides in for motion */
    var gx = lerp(560, 520, eo(seg(t, 0, 1.15)));
    g.save(); g.translate(gx, 620 + bob(t, 0)); g.rotate(-.03);
    /* the 2013 tag hangs off the case's top-right corner on a string, swinging */
    g.save(); g.translate(205, -270); g.rotate(-.35 + sw(t, 0, .05, 5.5, 1.4) + .015 * Math.sin(t * 2));
    g.strokeStyle = CREAM; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 120); g.stroke();
    g.translate(0, 120); g.rotate(Math.PI / 2 - .1); g.translate(150, 0); g.rotate(-Math.PI / 2 + .45); priceTag(g, [['SEPT 2013', 0, 66]], .78, { w: 380, h: 150 }); g.restore();
    gameCase(g, 'GTA 5', 1.4, { px: 110 });
    g.restore();
    /* the calendar page now */
    g.save(); place(g, t, 0, 1300, 610, { dx: 160, dy: -30, rot: .05, r0: .2 }); calendar(g, 'NOVEMBER', '2026', 'TODAY', 1.3, { band: TEAL, bpx: 150, bdy: -4 }); g.restore();
    /* the headline */
    var k1 = -1, k2 = at('hook', 'still');
    var w1 = tw(g, '13 YEARS.', 124), w2 = tw(g, 'STILL SELLING.', 124), hx = 960 - (w1 + w2 + 50) / 2;
    if (t >= k1 - .05) { g.save(); var a = cd(t, k1 - .05, 20); g.translate(hx + w1 / 2, 196 - 30 * (1 - a)); g.scale(lerp(1.3, 1, a), lerp(1.3, 1, a)); TX(g, '13 YEARS.', 0, 0, { px: 124, col: HOT, shadow: 'rgba(0,0,0,.6)', a: fin(t, k1 - .05, .06) }); g.restore(); }
    if (t >= k2 - .05) { g.save(); var b = cd(t, k2 - .05, 20); g.translate(hx + w1 + 50 + w2 / 2, 196 - 30 * (1 - b)); g.scale(lerp(1.3, 1, b), lerp(1.3, 1, b)); TX(g, 'STILL SELLING.', 0, 0, { px: 124, col: CREAM, shadow: 'rgba(0,0,0,.6)', a: fin(t, k2 - .05, .06) }); g.restore(); }
  });
  S('count', function (g, t) {
    var a = at('count', '230'), b = wend('count', 'million'), v = rollV(t, a, b, 0, 230e6, 1e6), done = tq(t) >= b;
    var w1 = tw(g, '13 YEARS.', 124), w2 = tw(g, 'STILL SELLING.', 124), hx = 960 - (w1 + w2 + 50) / 2, ha = 1 - seg(t, a + .95, a + 1.25);
    if (ha > 0) { TX(g, '13 YEARS.', hx + w1 / 2, 196, { px: 124, col: HOT, shadow: 'rgba(0,0,0,.6)', a: ha }); TX(g, 'STILL SELLING.', hx + w1 + 50 + w2 / 2, 196, { px: 124, col: CREAM, shadow: 'rgba(0,0,0,.6)', a: ha }); }
    TX(g, 'COPIES SOLD-IN', SX, 262, { px: 56, col: TEAL, a: fin(t, a + 1.1, .2) });
    g.save(); place(g, t, start('count') - .2, SX, 380, { dy: 40, s0: .9 });
    TX(g, commas(v) + (done ? '+' : ''), 0, 0, { px: 190, col: done ? HOT : CREAM, st: 'extra-condensed', shadow: 'rgba(0,0,0,.6)', reg: done, id: 'n230' });
    g.restore();
    chip(g, 'TAKE-TWO 10-Q · AUG 2026', SX, 540, { px: 48, a: fin(t, b + .05, .15), s: lerp(.9, 1, cd(t, b + .05)) });
    /* the copies, stacking along the shelf as the count rolls */
    for (var i = 0; i < 9; i++) {
      var ti = a + i * (b - a) / 9;
      if (t < ti) continue;
      g.save(); place(g, t, ti, 300 + i * 132, 765, { dy: -120, s0: .7, w: 18, rot: (i % 2 ? .03 : -.03) }); gameCase(g, 'GTA 5', .42, { px: 110 }); g.restore();
    }
  });
  S('ask', function (g, t) {
    /* one case, and bills streaming out of it */
    g.save(); place(g, t, start('ask') - .2, 460, 560, { dx: -200, dy: 0 }); gameCase(g, 'GTA 5', 1, {}); g.restore();
    var t0 = start('ask');
    for (var i = 0; i < 16; i++) {
      var e = t0 + i * .22, u = (t - e) / 1.5; if (u < 0 || u > 1) continue;
      var x = lerp(560, 1080, u) + 60 * Math.sin(i * 1.7), y = 520 - 260 * Math.sin(u * Math.PI * .9) + u * 300;
      g.save(); g.translate(x, y); g.globalAlpha *= 1 - seg(u, .8, 1); bill(g, .55, u * 4 + i, {}); g.restore();
    }
    /* the years flipping */
    var f0 = at('ask', 'keep'), f1 = wend('ask', 'thirteen'), yr = 2013 + Math.floor(13 * seg(tq(t), f0, f1) + 1e-6);
    g.save(); place(g, t, start('ask') - .1, 1240, 420, { dx: 200, dy: 0 }); calendar(g, 'YEAR', String(yr), 'STILL PAYING', 1, { band: ORG, bpx: 160, bdy: -4, reg: yr === 2026 || yr === 2013 }); g.restore();
    var kq = at('ask', 'keep');
    chip(g, '230M+ · TAKE-TWO 10-Q · AUG 2026', SX, 160, { px: 44, a: 1 - seg(t, at('ask', 'paying'), at('ask', 'paying') + .3), reg: false });
    if (REC && t < at('ask', 'paying') && g.globalAlpha >= .6) REC['TAKE-TWO 10-Q · AUG 2026'] = 'TAKE-TWO 10-Q · AUG 2026';
    if (t >= kq - .05) { g.save(); var k = cd(t, kq - .05, 20); g.translate(1240, 800); g.scale(lerp(1.5, 1, k), lerp(1.5, 1, k)); g.rotate(.08); TX(g, '?', 0, 0, { px: 300, col: HOT, shadow: 'rgba(0,0,0,.6)', a: fin(t, kq - .05, .06) }); g.restore(); }
  });
  S('plan', function (g, t) {
    var a = at('plan', 'six');
    CH.forEach(function (h, i) {
      var ti = a + i * .16, col = [HOT, TEAL, ORG][i % 3], x = 360 + (i % 3) * 470, y = 360 + Math.floor(i / 3) * 200;
      if (t < ti) return;
      g.save(); place(g, t, ti, x, y, { dy: -80, s0: .7, rot: (i % 2 ? .02 : -.02), w: 18 });
      g.fillStyle = 'rgba(3,2,10,.5)'; g.fillRect(-210 + 8, -70 + 10, 420, 140);
      g.fillStyle = PAPER; g.fillRect(-210, -70, 420, 140); grainOn(g, -210, -70, 420, 140, .6);
      g.fillStyle = col; g.fillRect(-210, -70, 90, 140);
      TX(g, String(h.n), -165, 4, { px: 80, col: CREAM, reg: false });
      var px = 48; while (tw(g, h.name, px) > 290 && px > 36) px -= 2;
      TX(g, h.name, 45, 4, { px: px, col: INK });
      g.restore();
    });
    var kn2 = start('plan') + .25;
    chip(g, "NUMBERS · TAKE-TWO'S SEC FILINGS", SX, 790, { px: 48, bg: TEAL, a: fin(t, kn2), s: lerp(.9, 1, cd(t, kn2)) });
  });

  /* --- 1 · THREE DAYS --- */
  S('c1q', function (g, t) {
    var kb = at('c1q', 'billion');
    g.save(); place(g, t, start('c1q') - .2, 560, 560, { dy: 90 }); brick(g, 1, cd(t, kb - .1, 18)); g.restore();
    chip(g, '$1,000,000,000', 560, 300, { px: 76, bg: GOLD, a: fin(t, start('c1q')), s: lerp(1.25, 1, cd(t, start('c1q'), 20)) });
    var kf = at('c1q', 'question') - .1;
    g.save(); place(g, t, start('c1q') - .05, 1220, 520, { dx: 200, dy: 0 }); stopwatch(g, 210, (t - start('c1q')) * 9); g.restore();
    chip(g, 'HOW FAST?', 1220, 830, { px: 64, bg: HOT, fg: CREAM, a: fin(t, kf), s: lerp(1.3, 1, cd(t, kf, 20)) });
  });
  S('c1a', function (g, t) {
    /* the calendar holds the whole beat: Tue 17, then the pages tear to 18 and 19 on "Day three" */
    var d3 = at('c1d', 'three'), tear1 = d3 - .05, tear2 = d3 + .3;
    var day = t < tear1 ? 17 : t < tear2 ? 18 : 19, dow = day === 17 ? 'TUESDAY' : day === 18 ? 'WEDNESDAY' : 'THURSDAY';
    g.save(); place(g, t, start('c1a') - .2, 390, 470, { dx: -160, dy: 0 });
    calendar(g, 'SEPT 2013', String(day), dow, 1.12, { reg: day !== 18, circle: day === 17 ? seg(t, at('c1a', 'tuesday'), at('c1a', 'tuesday') + .5) : 0 });
    /* the torn pages falling */
    [[tear1, 17, 'TUESDAY'], [tear2, 18, 'WEDNESDAY']].forEach(function (p) {
      var u = t - p[0]; if (u < 0 || u > 1.1) return;
      g.save(); g.translate(60 * u + 40 * u * u, 260 * u * u + 30 * u); g.rotate(.9 * u * u + .2 * u); g.globalAlpha *= 1 - seg(u, .7, 1.1); calendar(g, 'SEPT 2013', String(p[1]), p[2], 1.12, { reg: false }); g.restore();
    });
    g.restore();
    var kp = at('c1a', 'september');
    chip(g, 'PS3', 300, 800, { px: 44, bg: TEAL, a: fin(t, kp), s: lerp(.8, 1, cd(t, kp)) });
    chip(g, 'XBOX 360', 470, 800, { px: 44, bg: TEAL, a: fin(t, kp + .12), s: lerp(.8, 1, cd(t, kp + .12)) });
    /* right half: launch, then day 1, then day 3 */
    var b1 = start('c1b') - .2, b3 = start('c1d') - .2;
    if (t < b1 + .3) {
      g.save(); if (leave(g, t, b1)) { place(g, t, start('c1a') - .05, 1130, 520, { dx: 220, dy: 0, rot: .04 }); gameCase(g, 'GTA 5', 1.05, { sub: 'LAUNCH' }); } g.restore();
      stamp(g, t, at('c1a', 'launched'), 'LAUNCH DAY', 1130, 820, { px: 64, rot: -.06, a: 1 - seg(t, b1, b1 + .25) });
    }
    if (t >= b1 && t < b3 + .3) {
      g.save(); if (leave(g, t, b3)) {
        var b = at('c1b', '800') - .22, a = Math.min(b1 + .15, b - .5), v = rollV(t, a, b, 0, 800e6, 1e6), done = tq(t) >= b; /* lands before the word (jury r1) */
        place(g, t, b1, 1060, 300, { dy: -50 });
        TX(g, 'DAY 1', 0, 0, { px: 84, col: TEAL });
        TX(g, '$' + commas(v) + (done ? '+' : ''), 0, 150, { px: 150, col: done ? GOLD : CREAM, st: 'extra-condensed', shadow: 'rgba(0,0,0,.6)', reg: done, id: 'n800' });
        chip(g, 'TAKE-TWO ESTIMATE · SELL-THROUGH', 0, 290, { px: 44, a: fin(t, b + .05), s: lerp(.9, 1, cd(t, b + .05)) });
        /* Japan and Brazil: not in the count */
        var kj = start('c1c') - .1, kbz = start('c1c');
        [['JAPAN', kj, -150], ['BRAZIL', kbz, 150]].forEach(function (c) {
          if (t < c[1] - .05) return;
          g.save(); g.translate(c[2], 440 - 40 * (1 - cd(t, c[1] - .05))); g.globalAlpha *= fin(t, c[1] - .05);
          chip(g, c[0], 0, 0, { px: 56, bg: '#5b5470', fg: '#d9d2e6', w: 250 });
          g.strokeStyle = HOT; g.lineWidth = 8; g.beginPath(); g.moveTo(-120, 24); g.lineTo(120, -24); g.stroke();
          g.restore();
        });
        stamp(g, t, start('c1c') + .25, 'NOT IN THE COUNT', 0, 560, { px: 52, rot: -.04 });
      } g.restore();
    }
    if (t >= b3) {
      var a3 = at('c1d', 'more') - .05, e3 = a3, v3 = 1e9, d = true;
      g.save(); place(g, t, b3, 1060, 300, { dy: -50 });
      TX(g, 'DAY 3', 0, 0, { px: 84, col: TEAL });
      if (t >= a3) { g.save(); var sk = cd(t, a3, 22); g.translate(0, 150); g.scale(lerp(1.3, 1, sk), lerp(1.3, 1, sk)); g.globalAlpha *= fin(t, a3, .06); TX(g, '$1,000,000,000+', 0, 0, { px: 150, col: GOLD, st: 'extra-condensed', shadow: 'rgba(0,0,0,.6)', id: 'n1b' }); g.restore(); }
      if (false) TX(g, '$' + commas(v3) + (d ? '+' : ''), 0, 150, { px: 150, col: d ? GOLD : CREAM, st: 'extra-condensed', shadow: 'rgba(0,0,0,.6)', reg: d, id: 'n1b' });
      chip(g, 'RETAIL SALES', 0, 290, { px: 44, a: fin(t, e3 + .05), s: lerp(.9, 1, cd(t, e3 + .05)) });
      g.restore();
      stamp(g, t, wend('c1d', 'three') - .05, 'IN 3 DAYS', 1060, 770, { px: 84, rot: -.07 });
    }
  });
  S('c1e', function (g, t) {
    var t0 = start('c1e') - .2;
    g.save(); place(g, t, t0, 560, 450, { dx: -120, dy: 0, rot: -.025 });
    sheet(g, 800, 480, NEWS, { rule: 'rgba(29,18,51,.05)', rs: 10 });
    TX(g, 'TAKE-TWO, SEPT 20 2013', 0, -180, { px: 44, col: '#137f7a' });
    ['“…the fastest that any', 'entertainment property,', 'including video games and', 'feature films, has reached…”'].forEach(function (L, i) { TX(g, L, 0, -90 + i * 74, { px: 60, col: INK, st: 'condensed', wt: 800, id: 'q1e', reg: i === 0 }); });
    g.restore();
    if (REC && g.globalAlpha >= .6 && t >= t0 + .15) REC.q1e = '“…the fastest that any entertainment property, including video games and feature films, has reached…”';
    /* right: a film reel and a game case, then the clock */
    var cf = start('c1f') - .2;
    if (t < cf + .3) {
      g.save(); if (leave(g, t, cf)) {
        place(g, t, t0 + .1, 1270, 430, { dx: 200, dy: 0 });
        g.save(); g.translate(-130, 0); g.fillStyle = 'rgba(3,2,10,.5)'; circ(g, 10, 14, 120); g.fill(); g.fillStyle = '#c9c0d8'; circ(g, 0, 0, 120); g.fill(); g.rotate(t * 1.5);
        for (var i = 0; i < 5; i++) { var an = i / 5 * TAU; g.fillStyle = PLUM; circ(g, Math.cos(an) * 66, Math.sin(an) * 66, 30); g.fill(); } g.fillStyle = PLUM; circ(g, 0, 0, 16); g.fill(); g.restore();
        chip(g, 'MOVIES', -130, 170, { px: 44 });
        g.save(); g.translate(140, 0); gameCase(g, 'GTA 5', .6, {}); g.restore();
        chip(g, 'GAMES', 140, 170, { px: 44 });
        chip(g, 'FASTEST EVER, TAKE-TWO SAID', 0, 300, { px: 44, bg: HOT, fg: CREAM, a: fin(t, t0 + .25) });
      } g.restore();
    }
    if (t >= cf) {
      var hrs = Math.floor(seg(tq(t), at('c1f', 'about'), lastw('c1f') + .4) * 72);
      g.save(); place(g, t, cf, 1250, 420, { dx: 200, dy: 0 }); wallClock(g, 190, hrs / 12 * TAU, hrs * TAU); g.restore();
      for (var j = 0; j < Math.min(hrs, 12); j++) {
        var tj = at('c1f', 'about') + j * (lastw('c1f') + .4 - at('c1f', 'about')) / 72 * 6; if (t < tj) continue;
        var u = cd(t, tj, 9);
        g.save(); g.translate(1060 + (j % 6) * 76 + (j > 5 ? 38 : 0), lerp(560, 760 - Math.floor(j / 6) * 64, u)); g.rotate((j % 3 - 1) * .08); g.globalAlpha *= fin(t, tj, .08);
        chip(g, '$14M', 0, 0, { px: 38, bg: GOLD, reg: false }); g.restore();
      }
      var km = cf + .1;
      chip(g, 'OUR MATH: $1B ÷ 72 HOURS', 1250, 880, { px: 44, bg: TEAL, a: fin(t, km), s: lerp(.9, 1, cd(t, km)) });
    }
  });
  S('c1x', function (g, t) {
    tiles(g, t, 'c1x', SX, 380, 1300, 110, { text: '$1B BEFORE ITS FIRST FRIDAY', hot: /^(friday)$/ });
    var a = start('c1x') - .1;
    [['TUE', '17', 1], ['WED', '18', 1], ['THU', '19', 2], ['FRI', '20', 0]].forEach(function (d, i) {
      g.save(); place(g, t, a + i * .1, 420 + i * 270, 720, { dy: 60, s0: .8 });
      sheet(g, 220, 230, d[2] ? PAPER : '#d9d2e6', { r: 8 });
      g.fillStyle = d[2] === 2 ? HOT : d[2] ? TEAL : GREY; g.fillRect(-110, -115, 220, 62);
      TX(g, d[0], 0, -84, { px: 44, col: CREAM });
      TX(g, d[1], 0, 30, { px: 110, col: INK, st: 'extra-condensed' });
      if (d[2] === 2) TX(g, '$1B+', 0, -170, { px: 56, col: GOLD, shadow: 'rgba(0,0,0,.6)' });
      if (d[2]) { g.strokeStyle = d[2] === 2 ? HOT : TEAL; g.lineWidth = 9; g.beginPath(); g.moveTo(-60, 60); g.lineTo(-20, 92); g.lineTo(70, 4); g.stroke(); }
      g.restore();
    });
  });

  /* --- 2 · THE DROP --- */
  S('c2q', function (g, t) {
    var ke = at('c2q', 'ends'), drop = cd(t, ke - .05, 5), swing = sw(t, ke - .05, .25, 4, 1.4);
    /* bunting: the right end lets go on "ends" */
    var x0 = 220, x1 = 1440, y0 = 230, flags = 'LAUNCH'.split('');
    function pt(u) { var x = lerp(x0, x1, u), sag = 90 * Math.sin(Math.PI * u); var y = y0 + sag; if (drop > 0) { var dd = drop * 560 * u * u; x -= drop * 300 * u * u * u; y += dd + swing * 200 * u; } return [x, y]; }
    g.save(); place(g, t, start('c2q') - .2, 0, 0, { dy: -80, s0: 1, nobob: true });
    g.strokeStyle = CREAM; g.lineWidth = 4; g.beginPath(); for (var u = 0; u <= 1.001; u += .05) { var p = pt(u); u ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke();
    flags.forEach(function (c, i) {
      var u = (i + .5) / flags.length, p = pt(u), q = pt(u + .02), an = Math.atan2(q[1] - p[1], q[0] - p[0]);
      g.save(); g.translate(p[0], p[1]); g.rotate(an); g.fillStyle = 'rgba(3,2,10,.45)'; g.beginPath(); g.moveTo(-70 + 6, 8); g.lineTo(70 + 6, 8); g.lineTo(6, 168); g.closePath(); g.fill();
      g.fillStyle = [HOT, TEAL, ORG][i % 3]; g.beginPath(); g.moveTo(-70, 0); g.lineTo(70, 0); g.lineTo(0, 160); g.closePath(); g.fill();
      TX(g, c, 0, 52, { px: 70, col: CREAM, reg: false }); g.restore();
    });
    g.restore();
    if (REC && t > start('c2q')) REC.bunt = 'LAUNCH';
    g.save(); place(g, t, start('c2q'), SX, 680, { dy: 120 }); gameCase(g, 'GTA 5', .8, { glow: 0 }); g.restore();
    chip(g, 'AFTER LAUNCH WEEK', SX, 870, { px: 56, bg: ORG, a: fin(t, start('c2q')) });
  });
  function ruler(g, t, a, hiliteY2, star) {
    var x0 = 170, x1 = 1530, y = 440, mid = (x0 + x1) / 2;
    g.save(); place(g, t, a, 0, 0, { dy: 60, s0: 1, nobob: true });
    g.fillStyle = 'rgba(3,2,10,.5)'; g.fillRect(x0 + 10, y - 60 + 14, x1 - x0, 120);
    g.fillStyle = GOLD; g.fillRect(x0, y - 60, mid - x0, 120); g.fillStyle = hiliteY2 ? ORG : '#e8b445'; g.fillRect(mid, y - 60, x1 - mid, 120);
    grainOn(g, x0, y - 60, x1 - x0, 120, .7);
    for (var m = 0; m <= 24; m++) { var x = lerp(x0, x1, m / 24); g.fillStyle = INK; g.fillRect(x - 2, y - 60, 4, m % 12 ? 34 : 120); }
    TX(g, 'YEAR 1 · FY2014', (x0 + mid) / 2, y - 6, { px: 56, col: INK });
    TX(g, 'YEAR 2 · FY2015', (mid + x1) / 2, y - 6, { px: 56, col: INK });
    TX(g, 'APR 2013', x0 + 10, y + 100, { px: 40, col: CREAM, align: 'left' }); TX(g, 'MAR 2014 | APR 2014', mid, y + 100, { px: 40, col: CREAM }); TX(g, 'MAR 2015', x1 - 10, y + 100, { px: 40, col: CREAM, align: 'right' });
    if (star) {
      var sx = lerp(x0, x1, 5.5 / 24);
      g.save(); g.translate(sx, y - 100); g.globalAlpha *= star; g.fillStyle = HOT; g.beginPath(); g.moveTo(0, 50); g.lineTo(-22, 0); g.lineTo(22, 0); g.closePath(); g.fill();
      chip(g, 'GTA 5 LAUNCH · SEPT 17', 0, -36, { px: 44, bg: HOT, fg: CREAM }); g.restore();
    }
    g.restore();
  }
  S('c2b', function (g, t) {
    /* c2a (April to March) was cut after jury r1: the fiscal ruler stays as a silent picture under c2b */
    ruler(g, t, start('c2b') - .2, t > at('c2b', 'next'), seg(t, start('c2b'), start('c2b') + .3));
    var kf = at('c2b', 'fell');
    if (t >= start('c2b') - .15) {
      g.save(); var k = cd(t, start('c2b') - .15, 12); g.translate(lerp(170, 1530, .75), 620 + 30 * (1 - k)); g.globalAlpha *= fin(t, start('c2b') - .15);
      chip(g, 'GTA SALES', 0, 0, { px: 56, bg: CREAM }); g.restore();
    }
    if (t >= kf - .05) { g.save(); var kd = cd(t, kf - .05, 10); g.translate(lerp(170, 1530, .75), 680); g.scale(1, kd); arrowDown(g, 240, 150, ORG); g.restore(); }
  });
  S('c2c', function (g, t) {
    for (var i = 0; i < 5; i++) { var u = ((t - start('c2c')) * .5 + i / 5) % 1; g.save(); g.translate(250 + i * 60 * (i % 2 ? 1 : -1) + (i > 2 ? 1150 : 0), lerp(120, 1000, u)); g.rotate(u * 3 + i); g.globalAlpha *= .5 * Math.sin(Math.PI * u); gameCase(g, 'GTA 5', .3, { px: 100 }); g.restore(); }
    var k = start('c2c') + .15;
    if (t >= k - .08) {
      var dk = cd(t, k - .08, 18), land = T.h13 ? cd(t, T.h13, 22) : 0;
      g.save(); g.translate(SX, 420 - 60 * (1 - dk) + 26 * land); g.scale(lerp(1.4, 1, dk), lerp(1.4, 1, dk));
      TX(g, '−$1.3 BILLION', 0, 0, { px: 200, col: ORG, st: 'extra-condensed', shadow: 'rgba(0,0,0,.65)', a: fin(t, k - .08, .06) });
      g.restore();
    }
    chip(g, 'GTA SALES · FY2015', SX, 620, { px: 56, a: fin(t, start('c2c') - .1) });
    chip(g, 'TAKE-TWO 10-K', SX, 740, { px: 48, bg: TEAL, a: fin(t, k), s: lerp(.9, 1, cd(t, k)) });
  });
  S('c2d', function (g, t) {
    var t0 = start('c2d') - .2;
    g.save(); place(g, t, t0, 520, 480, { dx: -140, dy: 0, rot: -.02 });
    sheet(g, 760, 640, '#f7f3ea', {});
    g.fillStyle = INK; g.fillRect(-380, -320, 760, 110);
    TX(g, 'TAKE-TWO · ANNUAL REPORT (10-K)', 0, -282, { px: 48, col: CREAM });
    TX(g, 'FISCAL YEAR TO MARCH 31, 2015', 0, -236, { px: 40, col: GOLD });
    ['“…decrease of approximately', '$1,315.3 million in sales', 'from our Grand Theft Auto', 'franchise…”'].forEach(function (L, i) { TX(g, L, 0, -120 + i * 82, { px: 64, col: INK, st: 'condensed', wt: 800, reg: false }); });
    g.restore();
    chip(g, 'RE-CREATED', 300, 830, { px: 44, bg: HOT, fg: CREAM, rot: -.04, a: fin(t, t0 + .1) });
    if (REC && g.globalAlpha >= .6 && t >= t0 + .15) REC.q2d = '“…decrease of approximately $1,315.3 million in sales from our Grand Theft Auto franchise…”';
    /* right: why (c2e), then booked later (c2f) */
    var e0 = start('c2e') - .2, f0 = start('c2f') - .45;
    if (t >= e0 && t < f0 + .3) {
      g.save(); if (leave(g, t, f0)) {
        [['YEAR 1', 'LAUNCH', GOLD, 330], ['YEAR 2', 'NO LAUNCH', '#d9d2e6', 640]].forEach(function (b, i) {
          g.save(); place(g, t, e0 + i * .2, 1240, b[3], { dx: 200, dy: 0 });
          sheet(g, 520, 240, b[2], {});
          TX(g, b[0], 0, -60, { px: 64, col: INK }); TX(g, b[1], 0, 40, { px: 80, col: i ? GREY : HOT, st: 'extra-condensed' });
          if (!i) { g.save(); g.translate(200, -60); g.rotate(-.5); g.fillStyle = HOT; g.beginPath(); g.moveTo(0, -46); g.lineTo(18, 20); g.lineTo(0, 10); g.lineTo(-18, 20); g.closePath(); g.fill(); g.restore(); }
          g.restore();
        });
      } g.restore();
    }
    if (t >= f0) {
      var kp = at('c2f', 'booked'), slide = cd(t, kp, 7);
      g.save(); place(g, t, f0, 1240, 560, { dx: 200, dy: 0 });
      /* the drawer */
      g.fillStyle = 'rgba(3,2,10,.5)'; g.fillRect(-260 + 10, 40 + 12, 520, 240);
      g.fillStyle = '#7a4f2a'; g.fillRect(-260, 40, 520, 240); grainOn(g, -260, 40, 520, 240, .8);
      g.fillStyle = '#5c3a1d'; g.fillRect(-230, 60, 460, 80);
      /* the envelope sliding in */
      g.save(); g.translate(0, lerp(-200, 80, slide)); g.globalAlpha *= 1 - .6 * seg(t, kp + .6, kp + 1);
      g.fillStyle = 'rgba(3,2,10,.5)'; g.fillRect(-240 + 8, -110 + 10, 480, 220);
      g.fillStyle = '#f2e5cd'; g.fillRect(-240, -110, 480, 220); grainOn(g, -240, -110, 480, 220, .6);
      g.strokeStyle = 'rgba(29,18,51,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-240, -110); g.lineTo(0, 10); g.lineTo(240, -110); g.stroke();
      TX(g, 'PS4 + XBOX ONE MONEY', 0, 54, { px: 40, col: INK, a: 1 });
      g.restore();
      g.fillStyle = '#7a4f2a'; g.fillRect(-260, 140, 520, 140); grainOn(g, -260, 140, 520, 140, .8); g.fillStyle = '#a06b3c'; g.fillRect(-260, 140, 520, 8);
      chip(g, 'LATER YEARS', 0, 210, { px: 52, bg: CREAM });
      g.restore();
      chip(g, 'BOOKED LATER · 10-K, 2015', 1240, 290, { px: 48, bg: TEAL, a: fin(t, f0 + .1), s: lerp(.9, 1, cd(t, f0 + .1)) });
    }
  });
  S('c2x', function (g, t) {
    tiles(g, t, 'c2x', SX, 300, 1350, 104, { text: 'EVEN GTA 5 FELL OFF A CLIFF.', hot: /^(cliff)$/ });
    var kc = at('c2x', 'cliff'), fall = t > kc ? (t - kc) : 0;
    g.save(); place(g, t, start('c2x') - .2, 0, 0, { dy: 100, s0: 1, nobob: true });
    /* the paper cliff */
    g.fillStyle = 'rgba(3,2,10,.5)'; g.beginPath(); g.moveTo(110, 600 + 14); g.lineTo(900 + 10, 600 + 14); g.lineTo(940 + 10, 700); g.lineTo(880 + 10, 820); g.lineTo(960 + 10, 1080); g.lineTo(110, 1080); g.closePath(); g.fill();
    g.fillStyle = '#3a2f57'; g.beginPath(); g.moveTo(110, 600); g.lineTo(900, 600); g.lineTo(940, 700); g.lineTo(880, 820); g.lineTo(960, 1080); g.lineTo(110, 1080); g.closePath(); g.fill();
    grainOn(g, 110, 600, 860, 480, .5);
    g.fillStyle = TEAL; g.fillRect(110, 600, 790, 14);
    g.restore();
    var tip = cd(t, kc - .3, 8), x = 780 + 240 * seg(fall, 0, .5) + 140 * fall, y = 470 + 700 * fall * fall, rot = tip * .5 + fall * 2.2;
    g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha *= 1 - seg(fall, .9, 1.2); gameCase(g, 'GTA 5', .62, {}); g.restore();
    chip(g, '−$1.3B · FY2015', 1300, 640, { px: 56, bg: ORG, a: fin(t, start('c2x')), rot: .03 });
  });

  /* --- 3 · THE SECOND GAME --- */
  S('c3q', function (g, t) {
    var kb = start('c3q') + .25, ke = at('c3q', 'earning');
    g.save(); place(g, t, start('c3q') - .2, 640, 540, { dy: 80 }); gameCase(g, 'GTA 5', 1.15, { glow: seg(t, ke - .1, ke + .4) * (.75 + .25 * Math.sin(t * 6)) }); g.restore();
    stamp(g, t, kb - .05, 'SOLD', 640, 640, { px: 120, rot: -.12, col: HOT });
    chip(g, 'BOUGHT ONCE.', 1220, 420, { px: 72, a: fin(t, kb), s: lerp(.9, 1, cd(t, kb)), id: 'b1' });
    chip(g, 'STILL EARNING?', 1220, 580, { px: 72, bg: TEAL, a: fin(t, kb + .2), s: lerp(1.3, 1, cd(t, kb + .2, 20)) });
  });
  S('c3a', function (g, t) {
    var ks = at('c3a', 'switched'), open = cd(t, ks, 9);
    g.save(); place(g, t, start('c3a') - .2, 470, 540, { dx: -150, dy: 0 });
    gameCase(g, 'GTA 5', 1.05, {});
    /* a door in the case swings open onto ONLINE */
    g.save(); g.translate(-20, 120);
    g.fillStyle = '#07050f'; g.fillRect(-90, -70, 180, 140); g.save(); g.fillStyle = TEAL; g.globalAlpha *= open; g.fillRect(-82, -62, 164, 124); g.restore();
    if (open > .05) TX(g, 'ONLINE', 0, 0, { px: 46, col: INK, a: open });
    g.save(); g.translate(-90, 0); g.scale(Math.cos(open * 1.35), 1); g.fillStyle = CREAM; g.fillRect(0, -70, 180, 140); grainOn(g, 0, -70, 180, 140, .6); g.fillStyle = INK; circ(g, 160, 0, 8); g.fill(); g.restore();
    g.restore();
    g.restore();
    g.save(); place(g, t, start('c3a') - .05, 1180, 430, { dx: 200, dy: 0, rot: .03 }); calendar(g, 'OCT 2013', '1', 'GTA ONLINE', 1.05, { band: TEAL }); g.restore();
    chip(g, '+14 DAYS AFTER LAUNCH', 1180, 760, { px: 52, bg: GOLD, a: fin(t, at('c3a', 'two')), s: lerp(.9, 1, cd(t, at('c3a', 'two'))) });
    var kf = start('c3b') - .15;
    if (t >= kf - .1) {
      g.save(); var k = cd(t, kf - .1, 14); g.translate(470 + 230, 300); g.rotate(.18 + sw(t, kf - .1, .2, 6, 2)); g.globalAlpha *= fin(t, kf - .1);
      g.strokeStyle = CREAM; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -60); g.lineTo(0, 0); g.stroke();
      g.translate(0, 120 * k); priceTag(g, [['FREE', -24, 110, 0, HOT], ['WITH EVERY COPY OF GTA 5', 66, 40]], .95, { w: 480, h: 230 }); g.restore();
      chip(g, 'TAKE-TWO, OCT 2013', 700, 860, { px: 40, bg: TEAL, a: fin(t, kf + .1) });
    }
  });
  S('c3c', function (g, t) {
    var kr = at('c3c', 'real'), kc = at('c3c', 'cash');
    g.save(); place(g, t, start('c3c') - .2, 380, 440, { dx: -150, dy: 0, rot: -.05 }); bill(g, 1.4, 0, {}); g.restore();
    chip(g, 'REAL MONEY', 380, 600, { px: 52, a: fin(t, kr - .2) });
    if (t > kc - .3) { g.save(); g.translate(640, 440); g.scale(cd(t, kc - .3, 12), 1); arrowRight(g, 220, 90, GOLD); g.restore(); }
    g.save(); place(g, t, kc - .1, 1120, 440, { dx: 180, dy: 0 });
    for (var i = 5; i >= 0; i--) { g.save(); g.translate(-i * 5, -i * 16 + 40); bill(g, 1.3, 0, { col: '#ffd98a', sym: 'G$', shadow: i === 5 }); g.restore(); }
    g.restore();
    chip(g, 'GAME CASH · GTA$', 1120, 620, { px: 52, bg: GOLD, a: fin(t, kc) });
    /* c3d: the shark fin, our own drawing, cutting through the water strip */
    var d0 = start('c3d') - .75;
    if (t >= d0) {
      g.save(); g.globalAlpha *= fin(t, d0, .25);
      g.fillStyle = '#16405a'; g.fillRect(140, 800, 1420, 120); for (var x = 140; x < 1560; x += 60) { g.fillStyle = 'rgba(25,211,197,.35)'; g.fillRect(x + ((t * 80) % 60), 820 + 18 * ((x / 60) % 3), 30, 5); }
      var fx = lerp(220, 1400, seg(t, d0, d0 + 3.4));
      g.save(); g.translate(fx, 806); g.fillStyle = 'rgba(3,2,10,.4)'; g.beginPath(); g.moveTo(-70 + 8, 0); g.quadraticCurveTo(10 + 8, -40, 50 + 8, -150); g.quadraticCurveTo(40 + 8, -60, 80 + 8, 0); g.closePath(); g.fill();
      g.fillStyle = '#9fb4c8'; g.beginPath(); g.moveTo(-70, 0); g.quadraticCurveTo(10, -40, 50, -150); g.quadraticCurveTo(40, -60, 80, 0); g.closePath(); g.fill(); g.restore();
      g.restore();
      chip(g, 'SHARK CARDS', SX - 160, 210, { px: 80, bg: TEAL, a: fin(t, d0), s: lerp(.9, 1, cd(t, d0)) });
      chip(g, "ROCKSTAR'S NAME", 1270, 222, { px: 48, bg: CREAM, a: fin(t, d0 + .1), rot: .03 });
    }
  });
  S('c3e', function (g, t) {
    var t0 = start('c3e') - .2;
    g.save(); place(g, t, t0, 390, 520, { dx: -150, dy: 0, rot: -.03 });
    sheet(g, 440, 560, '#f7f3ea', {}); g.fillStyle = INK; g.fillRect(-220, -280, 440, 150);
    TX(g, 'ANNUAL REPORT', 0, -232, { px: 50, col: CREAM }); TX(g, 'FISCAL 2018', 0, -172, { px: 44, col: GOLD });
    TX(g, 'TAKE-TWO', 0, -40, { px: 72, col: INK }); TX(g, '10-K', 0, 60, { px: 110, col: PLUM, st: 'extra-condensed' });
    g.restore();
    chip(g, 'RE-CREATED', 390, 850, { px: 40, bg: HOT, fg: CREAM, rot: -.04, a: fin(t, t0 + .1) });
    TX(g, 'HIGHER VIRTUAL CURRENCY', 1150, 260, { px: 64, col: CREAM, a: fin(t, t0 + .1), shadow: 'rgba(0,0,0,.6)' });
    TX(g, 'REVENUE FROM:', 1150, 340, { px: 64, col: CREAM, a: fin(t, t0 + .1), shadow: 'rgba(0,0,0,.6)' });
    var kg = at('c3e', 'gta');
    ['GTA ONLINE', 'NBA 2K', 'SOCIAL POINT TITLES'].forEach(function (s, i) { var ti = kg + i * .3; if (t < ti) return; chip(g, s, 1150, 480 + i * 110, { px: 60, bg: i ? CREAM : TEAL, s: lerp(.85, 1, cd(t, ti)), a: fin(t, ti) }); });
    chip(g, 'TAKE-TWO 10-K · FISCAL 2018', 1150, 830, { px: 44, bg: GOLD, a: fin(t, t0 + .3) });
  });
  S('c3e2', function (g, t) {
    var t0 = start('c3e2') - .2, kh = at('c3e2', 'heists');
    /* the free updates: three cards fanning (the next one lands on each beat) */
    ['NEW MODES', 'NEW JOBS', 'NEW CARS'].forEach(function (s, i) {
      var ti = t0 + .1 + i * .35; if (t < ti) return;
      g.save(); place(g, t, ti, 330 + i * 70, 330 + i * 150, { dx: -200, dy: 0, rot: -.08 + i * .05 });
      sheet(g, 420, 130, i % 2 ? TEAL : CREAM, {}); TX(g, s, 0, 0, { px: 52, col: INK }); g.restore();
      chip(g, 'FREE', 520 + i * 70, 300 + i * 150, { px: 40, bg: HOT, fg: CREAM, a: fin(t, ti + .2), rot: .1, reg: false });
    });
    if (REC && t > t0 + .3) REC.upd = 'FREE UPDATES';
    /* the vault door: Heists */
    g.save(); place(g, t, kfu - .1, 1180, 470, { dx: 180, dy: 0 });
    g.fillStyle = 'rgba(3,2,10,.5)'; circ(g, 12, 16, 230); g.fill(); g.fillStyle = '#7d7895'; circ(g, 0, 0, 230); g.fill(); g.fillStyle = '#a49fbc'; circ(g, 0, 0, 190); g.fill(); grainOn(g, -230, -230, 460, 460, .5);
    g.save(); g.rotate((t - kh) * 1.2); g.strokeStyle = INK; g.lineWidth = 16; for (var i = 0; i < 3; i++) { g.rotate(Math.PI / 3); g.beginPath(); g.moveTo(-120, 0); g.lineTo(120, 0); g.stroke(); } g.fillStyle = INK; circ(g, 0, 0, 34); g.fill(); g.restore();
    g.restore();
    var kfu = at('c3e2', 'free');
    chip(g, 'HEISTS · 2015 · FREE UPDATE', 1180, 790, { px: 56, bg: GOLD, a: fin(t, kfu), s: lerp(.9, 1, cd(t, kfu)) });
    chip(g, 'TAKE-TWO, MAY 2015', 1180, 890, { px: 40, bg: TEAL, a: fin(t, kfu + .2) });
  });
  S('c3e3', function (g, t) {
    var t0 = start('c3e3') - .2, kr = t0 + .6;
    g.save(); place(g, t, t0, 520, 470, { dx: -160, dy: 0 });
    /* a paper rosette */
    g.save(); g.translate(0, 120); g.fillStyle = HOT; g.beginPath(); g.moveTo(-90, 0); g.lineTo(-150, 330); g.lineTo(-90, 290); g.lineTo(-40, 340); g.lineTo(0, 0); g.fill(); g.fillStyle = TEAL; g.beginPath(); g.moveTo(90, 0); g.lineTo(150, 330); g.lineTo(90, 290); g.lineTo(40, 340); g.lineTo(0, 0); g.fill(); g.restore();
    g.fillStyle = 'rgba(3,2,10,.5)'; circ(g, 12, 16, 230); g.fill();
    for (var i = 0; i < 24; i++) { g.fillStyle = i % 2 ? GOLD : ORG; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 230, i / 24 * TAU, (i + 1) / 24 * TAU); g.fill(); }
    g.fillStyle = CREAM; circ(g, 0, 0, 170); g.fill(); grainOn(g, -230, -230, 460, 460, .5);
    TX(g, 'PLAYER', 0, -50, { px: 72, col: INK }); TX(g, 'RECORDS', 0, 30, { px: 72, col: INK }); TX(g, 'DEC 2019', 0, 104, { px: 44, col: HOT });
    g.restore();
    TX(g, 'BACK-TO-BACK UPDATES', 1180, 330, { px: 70, col: CREAM, a: fin(t, t0 + .2), shadow: 'rgba(0,0,0,.6)' });
    TX(g, 'BIGGEST EVER FOR PLAYERS', 1180, 420, { px: 56, col: TEAL, a: fin(t, t0 + .3) });
    stamp(g, t, kr, 'NEW RECORDS', 1180, 590, { px: 90, rot: -.05, col: GOLD });
    chip(g, 'TAKE-TWO, MAY 2020', 1180, 790, { px: 48, bg: TEAL, a: fin(t, t0 + .7) });
  });
  S('c3f', function (g, t) {
    var t0 = start('c3f') - .2, km = t0 + .4;
    g.save(); place(g, t, t0, 560, 500, { dx: -160, dy: 0, rot: -.05 });
    g.fillStyle = 'rgba(3,2,10,.55)'; rr(g, -330 + 14, -210 + 18, 660, 420, 28); g.fill();
    g.fillStyle = PLUM; rr(g, -330, -210, 660, 420, 28); g.fill();
    g.save(); rr(g, -330, -210, 660, 420, 28); g.clip(); for (var i = 0; i < 6; i++) { g.fillStyle = [HOT, ORG, TEAL][i % 3]; g.save(); g.translate(150, 130); g.rotate(-.5); g.fillRect(-400, i * 30, 800, 14); g.restore(); } grainOn(g, -330, -210, 660, 420, .5); g.restore();
    TX(g, 'GTA+', -150, -70, { px: 170, col: CREAM, st: 'extra-condensed', shadow: 'rgba(0,0,0,.5)' });
    TX(g, 'MEMBERSHIP', -140, 60, { px: 60, col: GOLD, align: 'center' });
    g.fillStyle = GOLD; rr(g, 180, -150, 100, 76, 10); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(190, -122, 80, 4); g.fillRect(190, -104, 80, 4);
    g.restore();
    chip(g, 'MONTHLY', 1220, 330, { px: 80, bg: TEAL, a: fin(t, km - .05), s: lerp(1.3, 1, cd(t, km - .05, 20)) });
    chip(g, 'MARCH 2022', 1220, 490, { px: 64, a: fin(t, at('c3f', '2022') - .1) });
    chip(g, 'PS5 · XBOX SERIES X|S', 1220, 630, { px: 48, bg: GOLD, a: fin(t, at('c3f', '2022') + .2) });
    chip(g, 'TAKE-TWO, MAY 2022', 1220, 760, { px: 40, bg: TEAL, a: fin(t, at('c3f', '2022') + .4) });
  });
  S('c3g', function (g, t) {
    /* all of Take-Two, not GTA: the pie rolls 25.8% -> 78.1% and lands before "three quarters"; c3j then says where it comes from (jury r1) */
    var t0 = start('c3g') - .2, kh = at('c3h', '2017'), ki = at('c3i', 'three') - .22, kr = Math.min(lastw('c3h') + .1, ki - .5);
    var frac = t < kh ? 0 : t < kr ? .258 * eio(seg(t, kh, kh + .5)) : lerp(.258, .781, eio(seg(tq(t), kr, ki)));
    var landed = tq(t) >= ki, kj = start('c3j') - .2, mv = eio(seg(t, kj, kj + .45)), fo = 1 - seg(t, kj, kj + .2);
    g.save(); place(g, t, t0, 500, 540, { dx: -160, dy: 0 }); pie(g, 290, frac, frac > .5 ? HOT : TEAL);
    if (t >= kh + .4 && t < kr + .1) TX(g, '25.8%', 0, -80, { px: 110, col: CREAM, shadow: 'rgba(0,0,0,.6)' });
    if (landed) TX(g, '78.1%', 0, 30, { px: 150, col: CREAM, shadow: 'rgba(0,0,0,.6)' });
    g.restore();
    chip(g, 'ALL TAKE-TWO GAMES, NOT JUST GTA', 500, 900, { px: 46, bg: ORG, a: fin(t, at('c3g', 'all') - .1), s: lerp(.9, 1, cd(t, at('c3g', 'all') - .1)) });
    TX(g, 'SPENDING INSIDE GAMES', 1170, 230, { px: 66, col: CREAM, a: fin(t, t0 + .1), shadow: 'rgba(0,0,0,.6)' });
    TX(g, 'SHARE OF TAKE-TWO REVENUE', 1170, 310, { px: 48, col: TEAL, a: fin(t, t0 + .2) });
    if (t >= kh && t < kr + .1) chip(g, 'FY2017 · 25.8%', 1170, 450, { px: 64, bg: TEAL, a: fin(t, kh), s: lerp(.9, 1, cd(t, kh)) });
    if (landed) chip(g, 'FY2026 · 78.1%', 1170, 450, { px: 64, bg: HOT, fg: CREAM, a: fin(t, ki), s: lerp(.9, 1, cd(t, ki)) });
    if (t >= kh) chip(g, 'INCL. VIRTUAL CURRENCY + ADD-ONS', 1170, 560, { px: 40, a: fin(t, kh + .5) * fo });
    stamp(g, t, T.h78, 'OVER 3/4', 1170, 690, { px: 84, rot: .06, col: GOLD, a: fo });
    /* c3j: where it comes from */
    if (t >= kj) {
      g.save(); g.globalAlpha *= fin(t, kj, .2);
      g.save(); g.translate(1110, 700 + 40 * (1 - cd(t, kj, 12)));
      /* a phone */
      g.fillStyle = 'rgba(3,2,10,.5)'; rr(g, -330 + 10, -70 + 12, 120, 210, 18); g.fill();
      g.fillStyle = '#2b2440'; rr(g, -330, -70, 120, 210, 18); g.fill(); g.fillStyle = TEAL; rr(g, -318, -52, 96, 160, 8); g.fill(); grainOn(g, -330, -70, 120, 210, .4);
      g.restore();
      chip(g, 'MOBILE · 50.1% OF REVENUE', 1170, 650, { px: 52, bg: HOT, fg: CREAM, s: lerp(.9, 1, cd(t, kj)) });
      var kz = start('c3j') + .5;
      chip(g, 'ZYNGA · BOUGHT MAY 2022', 1190, 760, { px: 48, bg: CREAM, a: fin(t, kz), s: lerp(.9, 1, cd(t, kz)) });
      chip(g, 'TAKE-TWO 10-K · FY2026', 1190, 860, { px: 40, bg: TEAL, a: fin(t, kz) });
      g.restore();
    }
  });
  S('c3x', function (g, t) {
    /* the quotable over its own picture: the FREE tag against the cash it brought in (jury r1: off the company-wide pie) */
    var t0 = start('c3x') - .22, km = t0 + .3;
    tiles(g, t, 'c3x', SX, 345, 1300, 92, { text: "GTA ONLINE WAS FREE. THE MONEY INSIDE IT WASN'T", hot: /^(free|wasnt)$/ });
    g.save(); place(g, t, t0, 470, 800, { dx: -200, dy: 0, rot: -.05 }); priceTag(g, [['FREE', -24, 110, 0, HOT], ['GTA ONLINE · 2013', 66, 40]], .9, { w: 480, h: 230 }); g.restore();
    if (t >= km) {
      g.save(); g.translate(1150, 850);
      var n = Math.min(9, Math.floor((t - km) * 9) + 1);
      for (var i = 0; i < n; i++) { g.save(); g.translate((i % 3) * 30 - 30, -i * 22); bill(g, 1.1, (i % 2 ? .04 : -.03), { sym: 'G$', shadow: i === 0 }); g.restore(); }
      g.restore();
      chip(g, 'SHARK CARDS · REAL MONEY', 1150, 960, { px: 44, bg: GOLD, a: fin(t, km + .2) });
    }
  });
  /* --- 4 · THREE GENERATIONS --- */
  S('c4q', function (g, t) {
    var rows = [[330, 'c4a'], [585, 'c4b'], [840, 'c4d']], t0 = start('c4q') - .2;
    g.save(); place(g, t, t0, 0, 0, { dy: 80, s0: 1, nobob: true }); rows.forEach(function (r) { shelf(g, 330, 1530, r[0]); }); g.restore();
    /* c4q: the one case, hovering, asks */
    var kq = t0 + .2;
    g.save(); var up = seg(t, start('c4a') - .25, start('c4a') + .2); g.globalAlpha *= 1 - up; place(g, t, t0 + .1, 200, 540, { dy: 0, dx: -120 }); gameCase(g, 'GTA 5', .9, {}); g.restore();
    chip(g, 'SAME GAME', 200, 840, { px: 48, bg: GOLD, a: fin(t, kq) * (1 - seg(t, start('c4a') - .2, start('c4a'))) });
    function rowItems(y, lineId, date, items) {
      var r0 = start(lineId) - .1;
      if (t < r0) return;
      chip(g, date, 230, y - 70, { px: 48, bg: HOT, fg: CREAM, a: fin(t, r0), s: lerp(.8, 1, cd(t, r0)) });
      items.forEach(function (it, i) {
        var ti = it[2] != null ? it[2] : r0 + .2 + i * .25; if (t < ti) return;
        g.save(); place(g, t, ti, it[1], y, { dy: -120, s0: .8, w: 16 }); it[0](); g.restore();
      });
    }
    rowItems(330, 'c4a', '2013', [[function () { consoleBox(g, 'PS3', 220, 110, '#3a3352', { px: 40 }); }, 560], [function () { consoleBox(g, 'XBOX 360', 220, 120, '#2f3c48', { px: 40 }); }, 860], [function () { g.translate(0, -96); gameCase(g, 'GTA 5', .44, {}); }, 1130]]);
    rowItems(585, 'c4b', 'NOV 2014', [[function () { consoleBox(g, 'PS4', 240, 90, '#2a2440', { px: 40 }); }, 560], [function () { consoleBox(g, 'XBOX ONE', 260, 90, '#222c33', { px: 40 }); }, 860], [function () { g.translate(0, -96); gameCase(g, 'GTA 5', .44, {}); }, 1130], [function () { pcTower(g, 'PC · APR 2015'); }, 1400, at('c4b', 'pc') - .1]]);
    rowItems(840, 'c4d', 'MAR 2022', [[function () { consoleBox(g, 'PS5', 150, 165, '#e9e4f2', { px: 40, led: HOT }); }, 560], [function () { consoleBox(g, 'XBOX SERIES X|S', 160, 155, '#1c1c24', { px: 40 }); }, 860], [function () { g.translate(0, -96); gameCase(g, 'GTA 5', .44, {}); }, 1130]]);
  });
  S('c4e', function (g, t) {
    tiles(g, t, 'c4e', SX, 350, 1350, 100, { text: 'SAME CITY, SAME STORY. 3 GENERATIONS.', hot: /^(same|story)$/ });
    var a = start('c4e') - .1;
    [['GEN 1', '2013'], ['GEN 2', '2014'], ['GEN 3', '2022']].forEach(function (c, i) {
      g.save(); place(g, t, a + i * .15, 460 + i * 370, 730, { dy: 100, s0: .8 }); gameCase(g, 'GTA 5', .55, {}); g.restore();
      chip(g, c[0] + ' · ' + c[1], 460 + i * 370, 900, { px: 44, bg: [HOT, TEAL, ORG][i], a: fin(t, a + i * .15 + .2) });
    });
  });
  S('c4f', function (g, t) {
    var t0 = start('c4f') - .2, ks = at('c4f', 'count');
    var M = [[start('c4g'), at('c4g', '32'), wend('c4g', 'million'), 32.5e6, 'FEB 2014', 380], [start('c4h'), at('c4h', '100'), wend('c4h', 'million'), 105e6, 'MAY 2019', 830], [start('c4i'), at('c4i', '230'), at('c4i', 'million') + .05, 230e6, 'AUG 2026', 1290]];
    var v = 0, done = false;
    if (t >= ks) v = rollV(t, ks, M[0][2], 0, M[0][3], 1e5);
    M.forEach(function (m, i) { if (t >= m[1] - .3 && i) v = rollV(t, m[1] - .3, m[2], M[i - 1][3], m[3], 1e5); if (tq(t) >= m[2]) done = i; });
    var landed = M.some(function (m, i) { return tq(t) >= m[2] && (i === 2 || tq(t) < M[i + 1][1] - .3); });
    /* the odometer */
    g.save(); place(g, t, t0, SX, 330, { dy: -80, s0: .9 });
    g.fillStyle = 'rgba(3,2,10,.55)'; rr(g, -560 + 14, -130 + 18, 1120, 260, 24); g.fill();
    g.fillStyle = '#2b2440'; rr(g, -560, -130, 1120, 260, 24); g.fill(); grainOn(g, -560, -130, 1120, 260, .3);
    g.fillStyle = '#07050f'; rr(g, -520, -96, 1040, 192, 12); g.fill();
    var s = commas(v) + (landed ? '+' : '');
    TX(g, s, 0, 6, { px: 170, col: landed ? GOLD : CREAM, st: 'extra-condensed', reg: landed, id: 'odo' });
    TX(g, 'COPIES SOLD-IN', 0, -165, { px: 48, col: TEAL });
    g.restore();
    /* the timeline: every release that put the city on sale again, and the three counts */
    var y = 720, x0 = 200, x1 = 1480;
    g.save(); g.globalAlpha *= fin(t, t0 + .2, .3);
    g.fillStyle = CREAM; g.fillRect(x0, y - 4, x1 - x0, 8);
    function yx(yr) { return lerp(x0, x1, (yr - 2013) / 13.6); }
    [[2013.7, 'PS3/360'], [2014.9, 'PS4/XB1'], [2015.3, 'PC'], [2022.2, 'PS5/XSX']].forEach(function (r, i) {
      var ti = start('c4f') + .2 + i * .3; if (t < ti) return; var k = cd(t, ti, 14);
      g.save(); g.translate(yx(r[0]), y); g.fillStyle = TEAL; circ(g, 0, 0, 16 * k); g.fill(); g.restore();
      TX(g, r[1], yx(r[0]), y + (i % 2 ? 100 : 56), { px: 36, col: TEAL, a: k });
    });
    g.restore();
    chip(g, 'ON SALE AGAIN', 330, 600, { px: 48, bg: TEAL, a: fin(t, at('c4f', 'sale')) * (1 - seg(t, M[0][1] - .4, M[0][1] - .1)) });
    M.forEach(function (m, i) {
      if (tq(t) < m[2]) return;
      var x = [yx(2014.1), yx(2019.4), yx(2026.6)][i], k = cd(t, m[2], 14);
      g.save(); g.translate(x, y); g.fillStyle = HOT; g.fillRect(-4, -160 * k, 8, 160 * k); circ(g, 0, 0, 20); g.fill(); g.restore();
      chip(g, (i === 0 ? '32.5M+' : i === 1 ? '105M+' : '230M+') + ' · ' + m[4], clamp(x, 330, 1380), y - 190, { px: 44, bg: i === 2 ? GOLD : CREAM, s: lerp(.85, 1, k), a: k });
    });
    chip(g, 'TAKE-TWO FILINGS · SOLD-IN', SX, 880, { px: 44, bg: TEAL, a: fin(t, t0 + .4) });
  });
  S('c4x', function (g, t) {
    var t0 = at('c4x', 'npd') - .2;
    g.save(); place(g, t, t0, 470, 500, { dx: -160, dy: 0 });
    g.save(); g.translate(0, 120); g.fillStyle = HOT; g.beginPath(); g.moveTo(-90, 0); g.lineTo(-150, 330); g.lineTo(-90, 290); g.lineTo(-40, 340); g.lineTo(0, 0); g.fill(); g.fillStyle = TEAL; g.beginPath(); g.moveTo(90, 0); g.lineTo(150, 330); g.lineTo(90, 290); g.lineTo(40, 340); g.lineTo(0, 0); g.fill(); g.restore();
    g.fillStyle = 'rgba(3,2,10,.5)'; circ(g, 12, 16, 220); g.fill();
    for (var i = 0; i < 24; i++) { g.fillStyle = i % 2 ? GOLD : '#f0a91d'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 220, i / 24 * TAU, (i + 1) / 24 * TAU); g.fill(); }
    g.fillStyle = CREAM; circ(g, 0, 0, 160); g.fill(); grainOn(g, -220, -220, 440, 440, .5);
    TX(g, '#1', 0, -20, { px: 150, col: INK, st: 'extra-condensed' }); TX(g, 'IN THE U.S.', 0, 90, { px: 40, col: HOT });
    g.restore();
    TX(g, 'BEST-SELLING GAME', 1150, 300, { px: 84, col: CREAM, a: fin(t, t0 + .2), shadow: 'rgba(0,0,0,.6)' });
    TX(g, 'OF THE DECADE', 1150, 400, { px: 84, col: GOLD, a: fin(t, t0 + .3), shadow: 'rgba(0,0,0,.6)' });
    chip(g, 'UNITS + DOLLARS · 2010s', 1150, 540, { px: 48, a: fin(t, t0 + .45) });
    chip(g, 'NPD, CITED BY TAKE-TWO · MAY 2020', 1150, 680, { px: 48, bg: TEAL, a: fin(t, t0 + .4), s: lerp(.9, 1, cd(t, t0 + .4)) });
  });

  /* --- 5 · THE MACHINE --- */
  S('c5q', function (g, t) {
    var t0 = start('c5q') - .2, ku = at('c5q', 'up');
    g.save(); place(g, t, t0, 760, 560, { dy: 100 });
    /* an adding machine with its tape curling up */
    g.fillStyle = 'rgba(3,2,10,.55)'; rr(g, -330 + 14, -40 + 18, 660, 380, 28); g.fill();
    g.fillStyle = '#d9d2e6'; rr(g, -330, -40, 660, 380, 28); g.fill(); grainOn(g, -330, -40, 660, 380, .5);
    g.fillStyle = INK; rr(g, -280, 0, 560, 110, 10); g.fill();
    TX(g, t >= ku ? '= ?' : '+ + +', 220, 56, { px: 80, col: TEAL, align: 'right', reg: false });
    for (var r = 0; r < 2; r++) for (var c = 0; c < 6; c++) { g.fillStyle = c === 5 ? HOT : PLUM; rr(g, -270 + c * 92, 140 + r * 86, 76, 66, 10); g.fill(); }
    var L = 120 + 260 * eo(seg(t, t0, t0 + 2.2));
    g.fillStyle = '#f7f1e2'; g.fillRect(-120, -40 - L, 240, L); grainOn(g, -120, -40 - L, 240, L, .5);
    for (var y = -60; y > -40 - L + 20; y -= 40) { g.fillStyle = 'rgba(29,18,51,.3)'; g.fillRect(-90, y, 120 + 40 * Math.sin(y), 6); }
    g.restore();
    if (REC && t > t0 + .3) REC.addm = '= ?';
    chip(g, 'ADD IT ALL UP', 1300, 420, { px: 64, bg: GOLD, a: fin(t, t0 + .1), s: lerp(1.2, 1, cd(t, t0 + .1, 18)) });
    chip(g, '13 ANNUAL REPORTS', 1300, 560, { px: 52, bg: TEAL, a: fin(t, t0 + .05) });
  });
  var FY = [['FY2014', 68.9, 2.35, 1620], ['FY2015', 28.0, 1.08, 303], ['FY2016', 54.5, 1.41, 770], ['FY2017', 38.2, 1.78, 680], ['FY2018', 39.7, 1.79, 712], ['FY2019', 25.7, 2.67, 686], ['FY2020', 23.0, 3.09, 710],
    ['FY2021', 29.2, 3.37, 985], ['FY2022', 30.9, 3.50, 1083], ['FY2023', 14.6, 5.35, 781], ['FY2024', 14.7, 5.35, 786], ['FY2025', 12.6, 5.63, 710], ['FY2026', 12.4, 6.66, 825]];
  S('c5a', function (g, t) {
    /* jury r1: no 13-row read wall. FY2014 and FY2026 rows stay; the 11 years between flick past in one row, the GTA $ column rolling */
    var t0 = start('c5a') - .2, ka = at('c5a', 'share'), kb = at('c5b', 'multiplied'), kb1 = kb - .2;
    var cx = [330, 640, 1000, 1380], y0 = 300, RH = 150;
    g.save(); place(g, t, t0, 0, 0, { dy: 60, s0: 1, nobob: true });
    g.fillStyle = 'rgba(3,2,10,.5)'; g.fillRect(170 + 10, y0 - 50 + 14, 1420, 90 + 3 * RH);
    g.fillStyle = '#f7f1e2'; g.fillRect(170, y0 - 50, 1420, 90 + 3 * RH); grainOn(g, 170, y0 - 50, 1420, 90 + 3 * RH, .6);
    g.fillStyle = INK; g.fillRect(170, y0 - 50, 1420, 90);
    ['FISCAL YEAR', 'GTA SHARE', '× TAKE-TWO REVENUE', '= GTA $ · OUR MATH'].forEach(function (h, i) { TX(g, h, cx[i], y0 - 5, { px: 44, col: i === 3 ? GOLD : CREAM, a: i === 3 ? fin(t, kb - .1) : 1 }); });
    function row(r, y, ti, tm, col, rec) {
      if (t < ti) return; var a = fin(t, ti, .1);
      TX(g, r[0], cx[0], y, { px: 60, col: INK, a: a, reg: rec });
      TX(g, r[1].toFixed(1) + '%', cx[1], y, { px: 60, col: '#137f7a', a: a, reg: rec });
      TX(g, '$' + r[2].toFixed(2) + 'B', cx[2], y, { px: 60, col: PLUM, a: a, reg: rec });
      if (t >= tm) TX(g, '$' + commas(r[3]) + 'M', cx[3], y, { px: 60, col: col, a: fin(t, tm, .08), reg: rec });
    }
    var y1 = y0 + 110, y2 = y1 + RH, y3 = y2 + RH;
    row(FY[0], y1, t0 + .3, kb, HOT, true);
    /* the middle row: FY2015 ... FY2025 flick by */
    if (t >= t0 + .6) {
      g.fillStyle = 'rgba(25,211,197,.14)'; g.fillRect(170, y2 - RH / 2 + 10, 1420, RH - 20);
      var fl = 1 + Math.min(10, Math.floor(seg(tq(t), t0 + .6, kb1) * 11)), done = tq(t) >= kb1;
      if (!done) row(FY[fl], y2, t0 + .6, kb, INK, false);
      else TX(g, '+ 11 MORE YEARS', 785, y2, { px: 60, col: '#137f7a', a: fin(t, kb1, .1) });
    }
    row(FY[12], y3, ka - .1, kb + .3, INK, true);
    g.restore();
  });
  S('c5c', function (g, t) {
    var t0 = start('c5c') - .2, g5 = start('c5g') + .15, merge = eio(seg(t, g5, g5 + .55));
    var lb = at('c5c', '16') - .22, la = Math.min(start('c5c') + .1, lb - .6), lv = rollV(t, la, lb, 0, 1.62, .01), ldone = tq(t) >= lb; /* lands before "1.6" (jury r1) */
    var ra = at('c5d', 'every'), rb = at('c5f', '9') - .22, rv = rollV(t, ra, rb, 0, 9.03, .01), rdone = tq(t) >= rb;
    var BASE = 900, SC2 = 380 / 10.65;
    /* the two halves; they slam together on "Together" */
    var lx = -460 * merge, rxo = 460 * merge;
    g.save(); g.globalAlpha *= fin(t, t0, .2);
    /* scope strip across the top */
    chip(g, 'GTA GAMES · TAKE-TWO REVENUE · OUR MATH', W / 2, 112, { px: 40, bg: CREAM, a: 1 - seg(t, start('c5x') - .3, start('c5x')) });
    if (merge < 1) {
      g.save(); g.globalAlpha *= 1 - merge;
      /* left: pink */
      g.save(); g.translate(lx, 0); g.fillStyle = 'rgba(255,79,163,.16)'; g.fillRect(96, 160, 860, 800);
      TX(g, 'LAUNCH YEAR', 526, 230, { px: 76, col: HOT }); TX(g, 'FY2014', 526, 306, { px: 48, col: CREAM });
      TX(g, '$' + lv.toFixed(1) + 'B', 526, 490, { px: 190, col: ldone ? HOT : CREAM, st: 'extra-condensed', shadow: 'rgba(0,0,0,.6)', reg: ldone, id: 'L16' });
      var lh = lv * SC2; g.fillStyle = HOT; g.fillRect(406, BASE - lh, 240, lh); grainOn(g, 406, BASE - lh, 240, lh, .4);
      if (ldone) chip(g, 'STOPS HERE', 526, BASE - lh - 60, { px: 44, bg: CREAM, a: fin(t, lb + .1) });
      g.restore();
      /* right: teal */
      g.save(); g.translate(rxo, 0); g.fillStyle = 'rgba(25,211,197,.13)'; g.fillRect(964, 160, 860, 800);
      if (t >= start('c5d') - .2) {
        g.globalAlpha *= fin(t, start('c5d') - .2, .2);
        TX(g, 'EVERY YEAR AFTER', 1330, 230, { px: 76, col: TEAL }); TX(g, 'FY2015 – FY2026', 1330, 306, { px: 48, col: CREAM });
        if (rdone) TX(g, 'ABOUT', 1330, 384, { px: 48, col: TEAL, a: fin(t, rb) });
        TX(g, '$' + rv.toFixed(1) + 'B', 1330, 490, { px: 190, col: rdone ? TEAL : CREAM, st: 'extra-condensed', shadow: 'rgba(0,0,0,.6)', reg: rdone, id: 'R90' });
        var rh = rv * SC2; g.fillStyle = TEAL; g.fillRect(1110, BASE - rh, 240, rh); grainOn(g, 1110, BASE - rh, 240, rh, .4);
        /* a year chip stacks each time the running total passes it */
        var cum = 0; for (var i = 1; i < FY.length; i++) { cum += FY[i][3] / 1000; if (rv + 1e-6 < cum) break; var yy = BASE - 30 - (i - 1) * 48; chip(g, FY[i][0], 1745, yy, { px: 36, bg: CREAM, reg: false }); }
      }
      g.restore();
      /* the seam */
      g.fillStyle = '#07050f'; g.fillRect(956, 160, 8, 800);
      g.fillStyle = CREAM; g.fillRect(96, BASE, 1728, 6);
      g.restore();
    }
    if (REC && t > ra && t < g5) REC.yrs = 'FY2015 … FY2026';
    /* together: $10B+ */
    if (t >= g5) {
      var k = cd(t, g5 + .45, 20), xk0 = start('c5x') - .25, mv = eio(seg(t, xk0, xk0 + .4));
      g.save(); g.translate(W / 2, lerp(400, 490, mv)); var s = lerp(1.5, 1, k) * (t > T.h10 ? kn(t, T.h10, .04) : 1) * lerp(1, .62, mv); g.scale(s, s); g.globalAlpha *= fin(t, g5 + .4, .08);
      TX(g, '$10B+', 0, 0, { px: 330, col: GOLD, st: 'extra-condensed', shadow: 'rgba(0,0,0,.65)', id: 'n10' });
      g.restore();
      chip(g, 'FROM GTA GAMES · FY2014 – FY2026', W / 2, lerp(610, 625, mv), { px: 56, bg: CREAM, a: fin(t, g5 + .6) });
      var kh = start('c5h') - .1;
      chip(g, "OUR MATH FROM TAKE-TWO'S 10-Ks · NOT GTA 5 ALONE", W / 2, lerp(730, 715, mv), { px: 48, bg: TEAL, a: fin(t, kh), s: lerp(.9, 1, cd(t, kh)) });
      /* c5x: the bar with the launch slice and the one-sixth mark */
      var xk = start('c5x') - .2;
      if (t >= xk) {
        var bx0 = 260, bx1 = 1660, by = 870, bk = eo(seg(t, xk, xk + .6));
        g.save(); g.globalAlpha *= fin(t, xk, .2);
        g.fillStyle = 'rgba(3,2,10,.5)'; g.fillRect(bx0 + 8, by - 40 + 10, (bx1 - bx0) * bk, 80);
        g.fillStyle = TEAL; g.fillRect(bx0, by - 40, (bx1 - bx0) * bk, 80);
        g.fillStyle = HOT; g.fillRect(bx0, by - 40, (bx1 - bx0) * .152 * bk, 80);
        grainOn(g, bx0, by - 40, (bx1 - bx0) * bk, 80, .4);
        TX(g, 'LAUNCH 15%', bx0 + 14, by + 74, { px: 40, col: HOT, align: 'left', a: bk });
        var sx = bx0 + (bx1 - bx0) / 6; g.fillStyle = CREAM; g.fillRect(sx - 3, by - 70, 6, 140);
        chip(g, '1/6', sx, by - 88, { px: 40, bg: CREAM, a: fin(t, xk + .5) });
        g.restore();
      }
    }
    g.restore();
  }, { noslide: true });
  S('c5x', function (g, t) {
    /* the tiles go on top of the merged frame (drawn by c5c, which stays up underneath) */
    g.save(); g.fillStyle = 'rgba(13,10,28,.0)'; g.restore();
    tiles(g, t, 'c5x', W / 2, 240, 1600, 104, { text: 'LESS THAN A SIXTH OF THE MONEY.', hot: /^(sixth)$/ });
  }, { overlay: true, noslide: true });

  /* --- 6 · THE HAND-OFF --- */
  function machine(g, t, inCase, keyRot, o) {
    o = o || {};
    g.fillStyle = 'rgba(3,2,10,.55)'; rr(g, -380 + 14, -200 + 18, 760, 460, 30); g.fill();
    g.fillStyle = '#2b2440'; rr(g, -380, -200, 760, 460, 30); g.fill(); grainOn(g, -380, -200, 760, 460, .3);
    g.fillStyle = HOT; g.fillRect(-380, -140, 760, 14);
    g.fillStyle = '#07050f'; rr(g, -320, -110, 360, 120, 10); g.fill();
    TX(g, o.display || 'GTA 5', -140, -48, { px: 80, col: TEAL, reg: o.display != null });
    for (var r = 0; r < 2; r++) for (var c = 0; c < 4; c++) { g.fillStyle = c === 3 ? GOLD : PLUM; rr(g, -320 + c * 92, 40 + r * 82, 76, 64, 10); g.fill(); }
    /* the key */
    g.save(); g.translate(250, 90); g.fillStyle = '#07050f'; circ(g, 0, 0, 44); g.fill(); g.rotate(keyRot); g.fillStyle = GOLD; rr(g, -12, -90, 24, 90, 6); g.fill(); circ(g, 0, -100, 32); g.fill(); g.fillStyle = '#2b2440'; circ(g, 0, -100, 12); g.fill(); g.restore();
    /* the slot on top */
    g.fillStyle = '#07050f'; g.fillRect(-170, -206, 340, 16);
    /* the cash drawer */
    var dr = o.drawer || 0; g.fillStyle = '#3a3352'; g.fillRect(-340, 260, 680, 40 + 50 * dr); g.fillStyle = MONEY; for (var i = 0; i < 5; i++) g.fillRect(-300 + i * 124, 266, 100, 20 + 40 * dr);
  }
  S('c6q', function (g, t) {
    var t0 = start('c6q') - .2, kn6 = t0 + .35;
    g.save(); place(g, t, t0, 760, 590, { dy: 100, s: .95 });
    g.save(); g.translate(0, -330); gameCase(g, 'GTA 5', .62, {}); g.restore();
    machine(g, t, 'GTA 5', .3 * Math.sin(t * 2), { drawer: .5 + .5 * Math.sin(t * 2.2) });
    g.restore();
    chip(g, 'MONEY MACHINE', 1350, 380, { px: 64, bg: GOLD, a: fin(t, t0 - .25) });
    chip(g, 'NOW?', 1350, 540, { px: 96, bg: HOT, fg: CREAM, a: fin(t, kn6 - .05), s: lerp(1.3, 1, cd(t, kn6 - .05, 20)) });
  });
  S('c6a', function (g, t) {
    var t0 = start('c6a') - .2, k1 = at('c6a', '69'), k2 = at('c6b', '12'), BASE = 870, SCL = 560 / 6.66;
    TX(g, 'TAKE-TWO NET REVENUE', 560, 200, { px: 60, col: CREAM, a: fin(t, t0 + .1), shadow: 'rgba(0,0,0,.6)' });
    function bar(x, total, share, ta, lbl, tot) {
      if (t < ta) return; var k = eio(seg(t, ta, ta + .6)), h = total * SCL * k, gh = h * share / 100;
      g.fillStyle = 'rgba(3,2,10,.5)'; g.fillRect(x - 130 + 10, BASE - h + 12, 260, h);
      g.fillStyle = '#5b5470'; g.fillRect(x - 130, BASE - h, 260, h); g.fillStyle = HOT; g.fillRect(x - 130, BASE - gh, 260, gh); grainOn(g, x - 130, BASE - h, 260, h, .4);
      TX(g, lbl, x, BASE + 44, { px: 44, col: CREAM, a: k }); TX(g, tot, x, BASE - h - 40, { px: 52, col: CREAM, a: fin(t, ta + .5) });
      if (k >= 1) chip(g, 'GTA ' + share.toFixed(1) + '%', x + 250, BASE - gh / 2 - (gh < 60 ? 30 : 0), { px: 52, bg: HOT, fg: CREAM, a: fin(t, ta + .6) });
    }
    bar(330, 2.35, 68.9, start('c6a') - .1, 'FY2014', '$2.35B');
    bar(860, 6.66, 12.4, start('c6b') - .2, 'FY2026', '$6.66B');
    var kc = start('c6c') - .1;
    if (t >= kc) {
      /* jury r1: both labels clear of the tape (x < 1500) and of the GTA 12.4% chip */
      chip(g, 'TAKE-TWO GOT BIGGER', 1230, 200, { px: 52, bg: TEAL, a: fin(t, kc), s: lerp(.9, 1, cd(t, kc)) });
      var ko = kc + .15;
      g.save(); place(g, t, ko - .2, 1330, 440, { dy: 80 }); gameCase(g, 'GTA 5', .5, { sub: '2013' }); g.restore();
      chip(g, 'GTA 5 GOT OLDER', 1330, 640, { px: 48, bg: ORG, a: fin(t, ko), s: lerp(.9, 1, cd(t, ko)) });
    }
  });
  S('c6d', function (g, t) {
    var t0 = start('c6d') - .2, kn = at('c6d', 'november'), k6 = at('c6d', 'gta');
    g.save(); place(g, t, t0, 470, 500, { dx: -160, dy: 0, rot: -.03 }); calendar(g, 'NOV 2026', '19', 'COMES OUT', 1.2, { band: HOT, circle: seg(t, kn, kn + .5) }); g.restore();
    g.save(); place(g, t, k6 - .2, 980, 500, { dx: 160, dy: 0, rot: .03 }); gameCase(g, 'GTA 6', 1.0, { stripes: [TEAL, HOT, GOLD], cover: '#1d2f55' }); g.restore();
    var ke = start('c6e') - .1;
    chip(g, 'PS5', 1360, 380, { px: 60, bg: TEAL, a: fin(t, ke), s: lerp(.8, 1, cd(t, ke)) });
    chip(g, 'XBOX SERIES X|S', 1360, 500, { px: 52, bg: TEAL, a: fin(t, ke + .2), s: lerp(.8, 1, cd(t, ke + .2)) });
    chip(g, 'TAKE-TWO 10-Q, AUG 2026', 1345, 600, { px: 36, a: fin(t, ke + .5) });
    /* c6f: the day-3 strip from 2013 drifts back in */
    var kf = start('c6f') - .1;
    if (t >= kf) {
      g.save(); place(g, t, kf, 1180, 820, { dx: 300, dy: 0, rot: -.04 });
      g.fillStyle = 'rgba(3,2,10,.5)'; g.fillRect(-300 + 8, -50 + 10, 600, 100);
      g.fillStyle = '#f7f1e2'; g.fillRect(-300, -50, 600, 100); grainOn(g, -300, -50, 600, 100, .5);
      TX(g, 'SEPT 2013 · DAY 3 · $1B+', 0, 4, { px: 52, col: INK });
      g.restore();
      chip(g, '13 YEARS LATER', 560, 860, { px: 52, bg: GOLD, a: fin(t, at('c6f', 'thirteen') + .2) });
    }
  });
  S('c6x', function (g, t) {
    var t0 = start('c6x') - .2, km = at('c6x', 'sequel') - .2, sw6 = eio(seg(t, t0 + .1, km));
    tiles(g, t, 'c6x', SX, 260, 1350, 100, { text: 'THE MONEY MACHINE GETS A SEQUEL.', hot: /^(sequel)$/ });
    g.save(); place(g, t, t0, SX, 720, { dy: 100, s: .75 });
    /* GTA 5 lifts out of the slot, GTA 6 drops in */
    g.save(); g.translate(-520 * sw6, -330 - 120 * Math.sin(Math.PI * sw6)); g.rotate(-.3 * sw6); g.globalAlpha *= 1 - .5 * sw6; gameCase(g, 'GTA 5', .62, {}); g.restore();
    g.save(); g.translate(520 * (1 - sw6), -330 - 120 * Math.sin(Math.PI * sw6)); g.rotate(.3 * (1 - sw6)); g.globalAlpha *= fin(t, t0 + .1, .3); gameCase(g, 'GTA 6', .62, { stripes: [TEAL, HOT, GOLD], cover: '#1d2f55' }); g.restore();
    machine(g, t, '', sw6 * 1.6, { display: sw6 > .9 ? 'GTA 6' : null, drawer: .5 + .5 * Math.sin(t * 2.2) });
    g.restore();
  });

  /* --- end card: the next video (≥ 10 s) --- */
  function endCard(g, t) {
    var t0 = T.endIn; if (t < t0) return;
    var k = eio(seg(t, t0, t0 + .5));
    g.save(); g.globalAlpha *= k;
    TX(g, 'NEXT WEEK ON DELTA', 960, 170, { px: 72, col: TEAL });
    /* the end-screen slot for the next video */
    var bx = 1120, by = 560, bw = 1000, bh = 562;
    g.save(); g.translate(bx, by + bob(t, .4, 4));
    g.fillStyle = 'rgba(3,2,10,.55)'; g.fillRect(-bw / 2 + 14, -bh / 2 + 18, bw, bh);
    g.fillStyle = PLUM; g.fillRect(-bw / 2, -bh / 2, bw, bh);
    g.save(); g.beginPath(); g.rect(-bw / 2, -bh / 2, bw, bh); g.clip();
    for (var i = 0; i < 10; i++) { g.fillStyle = [HOT, ORG, TEAL][i % 3]; g.save(); g.translate(240, 260); g.rotate(-.42); g.fillRect(-700, -40 + i * 40 + ((t * 20) % 120) - 120, 1400, 20); g.restore(); }
    grainOn(g, -bw / 2, -bh / 2, bw, bh, .5); g.restore();
    g.strokeStyle = CREAM; g.lineWidth = 6; g.setLineDash([26, 16]); g.lineDashOffset = -t * 30; g.strokeRect(-bw / 2 + 14, -bh / 2 + 14, bw - 28, bh - 28); g.setLineDash([]);
    TX(g, 'WHAT GTA 6', 0, -90, { px: 120, col: CREAM, shadow: 'rgba(0,0,0,.6)' });
    TX(g, 'HAS TO GET RIGHT', 0, 50, { px: 120, col: GOLD, shadow: 'rgba(0,0,0,.6)' });
    g.restore();
    /* arrow and subscribe */
    g.save(); g.translate(420 + 24 * Math.sin(t * 3), 560); arrowRight(g, 150, 80, HOT); g.restore();
    g.save(); g.translate(360, 820); g.fillStyle = 'rgba(3,2,10,.5)'; circ(g, 10, 14, 120); g.fill(); g.fillStyle = HOT; circ(g, 0, 0, 120); g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 6; circ(g, 0, 0, 120 + 10 + 6 * Math.sin(t * 2.4)); g.stroke();
    TX(g, 'DELTA', 0, -14, { px: 64, col: CREAM }); TX(g, 'SUBSCRIBE', 0, 48, { px: 40, col: INK }); g.restore();
    TX(g, 'WATCH NEXT', 360, 400, { px: 60, col: CREAM });
    TX(g, 'SOURCES: TAKE-TWO SEC FILINGS · IN THE DESCRIPTION', 960, 1010, { px: 40, col: '#bdb6cf' });
    g.restore();
  }

  /* ---------- captions: one card per phrase, numbers and key words in pink ---------- */
  var CARDID = { c1: 1, c2: 1, c3: 1, c4: 1, c5: 1, c6: 1 };
  var EMPH = /\d|^(billion|million|free|cliff|fell|drop|record|records|sequel|sixth|machine|shark|three|thirteen|tuesday|friday|still|selling)$/i;
  function captions(g, t) {
    if (!LIVE.text) return;
    var caps = VO.captions || [], c = null;
    for (var i = 0; i < caps.length; i++) if (t >= caps[i].t0 && t < caps[i].t1) { c = caps[i]; break; }
    if (!c) return;
    var lid = null; VO.lines.forEach(function (l) { if (c.t0 >= l.t0 - .01 && c.t0 <= l.t1 + .01) lid = l.id; });
    if (lid && (CARDID[lid] || lid === 'next')) return;
    var a = clamp((t - c.t0) / .08, 0, 1) * clamp((c.t1 - t) / .08, 0, 1);
    var px = 48, cxp = tapeOn(t) > .5 ? 820 : 960, maxw = tapeOn(t) > .5 ? 1260 : 1500;
    g.save(); cond(g, 'normal'); font(g, px, 800); var words = c.words.map(function (w) { return w.w; }), sp = g.measureText(' ').width;
    var ws = words.map(function (w) { return g.measureText(w).width; }), twd = ws.reduce(function (s, v) { return s + v; }, 0) + sp * (words.length - 1);
    while (twd > maxw && px > 38) { px -= 2; font(g, px, 800); sp = g.measureText(' ').width; ws = words.map(function (w) { return g.measureText(w).width; }); twd = ws.reduce(function (s, v) { return s + v; }, 0) + sp * (words.length - 1); }
    var y = 1008, x = cxp - twd / 2;
    g.globalAlpha = a;
    g.fillStyle = 'rgba(7,5,15,.86)'; rr(g, cxp - twd / 2 - 28, y - 38, twd + 56, 76, 14); g.fill();
    g.textAlign = 'left'; g.textBaseline = 'middle';
    words.forEach(function (w, i) {
      var said = t >= c.words[i].t0 - .02, hot = EMPH.test(w.replace(/[^\w'%$]/g, '').replace(/^\$/, '1'));
      g.fillStyle = hot && said ? HOT : said ? CREAM : 'rgba(244,237,224,.6)'; g.fillText(w, x, y + 2); x += ws[i] + sp;
    });
    g.restore(); unst(g);
  }

  /* ---------- the frame ---------- */
  var NOISE;
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }
  function covered(t) { for (var i = 0; i < CH.length; i++) { var h = CH[i]; if (t >= h.slam + .02 && t <= h.out) return true; } return false; }
  function scenes(g, t) {
    for (var i = 0; i < SC.length; i++) {
      var s = SC[i]; if (t < s.t0 || t > s.t1 + .34) continue;
      if (t > s.t1 && s.o.keep) { /* stays put under the overlay */ }
      g.save();
      var first = s.t0 <= 0, ein = s.o.noslide || s.afterCard || first ? 1 : eo(seg(t, s.t0, s.t0 + .42)), xo = s.nextCard ? 0 : seg(t, s.t1, s.t1 + .3);
      if (t > s.t1 && s.nextOverlay) xo = 0;
      if (t > s.t1 + .02 && s.nextCard) { g.restore(); continue; }
      g.translate((1 - ein) * 260 - eio(xo) * 340, 0); g.globalAlpha *= (s.o.noslide || s.afterCard || first ? 1 : fin(t, s.t0, .22)) * (1 - xo);
      s.draw(g, t, s);
      g.restore();
    }
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    stage(g);
    ledgerBg(g, t);
    if (!covered(t)) {
      if (t < T.endIn + .3) { g.save(); if (t > T.endIn) g.globalAlpha *= 1 - seg(t, T.endIn, T.endIn + .3); scenes(g, t); g.restore(); }
      endCard(g, t);
      tape(g, t);
      chapterTag(g, t);
      /* the search phrase, for the first seconds */
      chip(g, 'HOW MUCH MONEY HAS GTA 5 MADE?', SX, 900, { px: 48, bg: GOLD, a: fin(t, 1.9, .2) * (1 - seg(t, 6.2, 6.5)), s: lerp(.85, 1, cd(t, 1.9)) * (t > 6.2 ? 1 - .2 * seg(t, 6.2, 6.5) : 1) });
      ticker(g, t);
    }
    g.drawImage(VIG, 0, 0);
    CH.forEach(function (h) { chapterCard(g, t, h); });
    if (!covered(t)) captions(g, t);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  /* what is legibly on screen at t (drawn texts, recorded while drawing) */
  function TEXTS(t) {
    REC = {}; frame(ctx, t); var r = REC; REC = null;
    return Object.keys(r).map(function (k) { return { id: k, text: r[k], x0: 0, y0: 0, x1: 0, y1: 0 }; });
  }

  /* ---------- times and sound events, all from the voice ---------- */
  function initTimes() {
    G('pop0', .02, 'pop', .06, .6);
    /* chapter cards: the clunk sits in the pause before the card line; the card lifts just before the next line */
    CH.forEach(function (h) {
      var i = ORDER.indexOf(h.id), prev = ORDER[i - 1];
      h.slam = G('clunk' + h.n, Math.max(vadEnd(prev) + .15, start(h.id) - .62), 'clunk', .4, 1, { heavy: true });
      h.out = nextStart(h.id) - .32;
      h.cover = h.slam;
    });
    /* scenes */
    SC.forEach(function (s, i) { s.t0 = i ? (SWORD[s.from] ? at(s.from, SWORD[s.from]) : start(s.from)) - .22 : 0; });
    SC.forEach(function (s, i) {
      var nx = SC[i + 1]; s.t1 = nx ? nx.t0 : DUR;
      CH.forEach(function (h) { if (s.t1 > h.slam && s.t0 < h.slam) { s.t1 = h.slam + .02; s.nextCard = true; } if (Math.abs(s.t0 - (h.out + .1)) < .5 || (s.t0 > h.slam && s.t0 < h.out + .2)) s.afterCard = true; });
      if (nx && nx.o.overlay) { s.nextOverlay = true; s.t1 = nx ? nx.t0 : DUR; }
    });
    SC.forEach(function (s, i) { if (!s.afterCard) return; CH.forEach(function (h) { if (Math.abs(s.t0 - (h.out + .1)) < .5) { s.t0 = h.out - .05; if (SC[i - 1]) SC[i - 1].t1 = Math.min(SC[i - 1].t1, s.t0); } }); });
    /* c5c stays up under the c5x tiles */
    SC.forEach(function (s, i) { if (SC[i + 1] && SC[i + 1].o.overlay) { s.t1 = SC[i + 1].t1; s.nextCard = SC[i + 1].nextCard; } });
    T.endIn = start('next') - .1; T.split = start('c5c') - .2;
    T.tapeIn = start('ask') - .1; T.tapeOut5 = CH[4].slam; T.tapeIn6 = CH[5].out + .1; T.tapeOutE = T.endIn - .2;
    /* the tape prints in the pauses where it can (a ratchet), silently on words otherwise */
    function print(id, a, b, t, col, quiet) { var tt = quiet ? t : G('pr-' + id, t, 'print', .3, .9); TAPE.push({ t: tt, a: a, b: b, col: col }); }
    TAPE.length = 0;
    TAPE.push({ t: T.tapeIn + .4, a: 'THE LEDGER', b: '2013–', col: HOT });
    print('d1', 'GTA 5 · DAY 1', '$800M+', wend('c1b', 'dollars') + .05);
    print('d3', 'GTA 5 · DAY 3', '$1B+', after('c1d') - .05, HOT);
    print('fy15', 'ALL GTA · FY15', '−$1.3B', after('c2c') - .05, ORG);
    print('rcs', 'ALL TAKE-TWO', '78.1%', after('c3i') + .25, '#137f7a');
    print('u32', 'GTA 5 COPIES', '32.5M+', wend('c4g', 'million') + .05);
    print('u105', 'GTA 5 COPIES', '105M+', wend('c4h', 'million') + .05);
    print('u230', 'GTA 5 COPIES', '230M+', after('c4i') + .25, HOT);
    print('s69', 'ALL GTA · FY14', '68.9%', wend('c6a', 'revenue') + .05, HOT);
    print('s12', 'ALL GTA · FY26', '12.4%', after('c6b') - .05, HOT, true); /* silent: no gap between c6b and c6c, a ratchet here masked "March" */
    /* hero hits in the written pauses */
    T.h1b = G('h1b', after('c1d'), 'stamp', .4, 1.15, { heavy: true });
    G('ding1b', T.h1b + .3, 'ding', .3, .8);
    T.h13 = G('h13', after('c2c'), 'stamp', .4, 1.1, { heavy: true });
    T.h78 = G('h78', after('c3i'), 'stamp', .4, 1.0);
    G('h230', after('c4i'), 'stamp', .4, 1.05, { heavy: true });
    G('h90', after('c5f'), 'stamp', .4, 1.0);
    T.h10 = G('h10', after('c5g'), 'stamp', .4, 1.2, { heavy: true });
    G('ding10', T.h10 + .3, 'ding', .3, .8);
    G('hx', after('c5x'), 'pop', .4, .9);
    G('h6', after('c6x'), 'stamp', .4, 1.1, { heavy: true });
    G('sold', start('c3q') + .2, 'thock', .25, .9);
    /* swishes on scene changes, only where the pause allows */
    SC.forEach(function (s, i) { if (i && !s.afterCard && !s.o.overlay) G('sw' + i, s.t0 + .02, 'swish', .18, .7); });
    G('endsw', T.endIn, 'swish', .3, .9);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { frame(ctx, t); return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- sound: paper and ledger foley in the pauses; no music ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .8;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 34;
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
    function stamp(t, g, heavy) { tick(t, 1.6 * g, 2400); thump(t, .7 * g); if (heavy) { boom(t + .01, .5 * g, 110, 40, .5); } var sn = noise(t, .12), sl = ac.createBiquadFilter(); sl.type = 'lowpass'; sl.frequency.value = 1500; var so = bus(1); sn.connect(sl); sl.connect(so); env(so.gain, [[t, 0], [t + .004, .32 * g], [t + .1, 0]]); }
    /* the chapter clunk: a heavy card hitting a desk, a latch, and a paper slap on top */
    function clunk(t, g) {
      boom(t, .95 * g, 95, 34, .48); thump(t, .9 * g, 180); thump(t + .012, .5 * g, 260);
      band(t, t + .32, 1200, 160, .32 * g, .03 * g, .8, 0, 'lowpass');
      osc2('triangle', 196, t + .004, t + .2, [[t + .004, 0], [t + .007, .16 * g], [t + .12, 0]]);
      osc2('square', 98, t + .002, t + .1, [[t + .002, 0], [t + .004, .06 * g], [t + .07, 0]]);
      tick(t, 2.2 * g, 1600); tick(t + .01, 1.4 * g, 2600);
    }
    function swish(t, g) { band(t, t + .26, 600, 3600, .09 * g, .02 * g, 1.3, -.2); }
    function pop(t, g) { thump(t, .3 * g, 320); tick(t, 1.1 * g, 2600); band(t, t + .06, 2400, 1200, .06 * g, .01 * g, 1.2); }
    function ding(t, g) { osc2('sine', 2093, t, t + .5, [[t, 0], [t + .003, .22 * g], [t + .16, .05 * g], [t + .45, 0]]); osc2('sine', 3136, t + .01, t + .4, [[t + .01, 0], [t + .014, .1 * g], [t + .12, .02 * g], [t + .35, 0]]); tick(t, 1.2 * g, 3000); thump(t, .18 * g, 260); }
    function printer(t, g) { for (var j = 0; j < 6; j++) { tick(t + j * .022, (.6 + rnd() * .3) * g, 2000 + rnd() * 1800); } thump(t + .13, .16 * g, 420); }
    function thock(t, g) { thump(t, .35 * g, 220); tick(t, .9 * g, 1800); }
    var LEVEL = { clunk: 1.25, stamp: 1, swish: 12, pop: 4.2, ding: 3, print: 2.6, thock: 2 };
    var TYPE_DB = window.SFX_TYPE_DB || { clunk: 0, stamp: -2, swish: -2, pop: -7, ding: -6, print: -6, thock: -6 };
    var TRIM = window.SFX_TRIM || {};
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      if (e.type === 'clunk') clunk(e.t, g);
      else if (e.type === 'stamp') stamp(e.t, g, e.heavy);
      else if (e.type === 'swish') swish(e.t, g);
      else if (e.type === 'pop') pop(e.t, g);
      else if (e.type === 'ding') ding(e.t, g);
      else if (e.type === 'print') printer(e.t, g);
      else if (e.type === 'thock') thock(e.t, g);
    });
    /* no music: voice and foley only */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    (function () { var o = bus(1), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = window.ROOM_GAIN || .025; })();
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 46px Archivo'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%×−·…#?|~$+—“”’÷'); })).then(function () { return document.fonts.ready; }).then(function () {
      GRAIN = buildGrain(); buildLedger(); buildTicker();
      EV.length = 0; initTimes();
      window.FILM.POSTER = Math.round((lastw('c5x') + .55) * 30) / 30 + 1 / 60;
      var shots = [{ id: 'open', name: 'Still selling', t0: 0, t1: CH[0].slam }];
      CH.forEach(function (h, i) { shots.push({ id: h.id, name: h.n + ' · ' + h.name.charAt(0) + h.name.slice(1).toLowerCase(), t0: h.slam, t1: i < 5 ? CH[i + 1].slam : T.endIn }); });
      shots.push({ id: 'next', name: 'Next week', t0: T.endIn, t1: DUR });
      window.FILM.SHOTS = shots;
      window.FILM.CHAPTERS = shots.map(function (s) { return [s.name, Math.max(0, Math.floor(s.t0))]; });
      window.READY = true;
    });
  }

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-moneymachine', SHOTS: [], CHAPTERS: [], init: init, render: render, frame: frame, LIVE: LIVE, T: T, GT: GT, CH: CH };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
