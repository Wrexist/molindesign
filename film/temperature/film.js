/* "Temperature" — why the same question gets different answers. Factory #10 on Tech, explained (How AI works, part 6),
   after ../qrcode/. A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed
   to a word time from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the die and the dial: a paper die (a real cube, orthographic, flat-shaded) tumbles and lands on a
   word; three odds bars under it are reshaped by a knob with the real softmax rule (p^(1/T), renormalised). Scene cuts
   are the dial itself: a radial wipe sweeps clockwise round the frame with a coral needle on its edge.
   The pizza odds are an example (EXAMPLE ODDS on screen). The GPT-2 printout is the real Fig. 1 beam-search output of
   Holtzman et al. (ICLR 2020), line breaks moved to the repeats (RE-CREATED). The 80 / 1,000 and 992 / 8 split are from
   Thinking Machines Lab (Sep 2025), open model Qwen3, temperature 0. Everything is hand-built. Facts: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', DIM = 'rgba(244,237,224,.5)';
  var HOT = '#ff5b3d';
  var PAPER = '#f1e9d8', INK = '#211d26';
  var BODY2 = '#3d3849', SCREEN = '#1b1a21', BUB = '#2d2937';
  var DISP = 'Archivo', MONO = '"Geist Mono"';

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .85); }
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .85), 0, 1.04); }
  function fin(t, a, f) { return clamp(sp(t, a, f || 3) * 2, 0, 1); }
  function knock(t, a, f, d) { if (t < a) return 0; var u = t - a; return Math.exp(-u * (d || 7)) * Math.sin(u * (f || 22)); }
  function kn(t, a) { return 1 + Math.max(0, knock(t, a, 16, 6)) * .08; }
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function mixC(a, b, k) {
    function h(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
    var A = h(a), B = h(b); return 'rgb(' + Math.round(lerp(A[0], B[0], k)) + ',' + Math.round(lerp(A[1], B[1], k)) + ',' + Math.round(lerp(A[2], B[2], k)) + ')';
  }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function wend(id, word, nth) { return find(id, word, nth).t1; }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }

  /* scenes. swipe:true = the next scene comes in under a dial sweep */
  var SWIPE = .44, PRE = .3;
  var SC = [
    { id: 'hook', fn: 'hook', name: 'Two answers', t0: 0 },
    { id: 'dice', fn: 'die', name: 'Dice', t0: start('dice') - .05, swipe: true },
    { id: 'stuck', fn: 'stuck', name: 'Stuck', t0: start('stuck') - .05, swipe: true },
    { id: 'zero', fn: 'lab', name: '80 of 1,000', t0: start('zero') - .05, swipe: true },
    { id: 'end', fn: 'end', name: 'Ask twice', t0: start('end') - .05, swipe: true }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = end('end') + .25;

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- the safe-area check: every glyph box drawn on the film canvas is measured (window.BOUNDS_RUN) ---------- */
  var BOUNDS = null, INCOMING = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || INCOMING || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys);
    if (a < SAFE.x0 - .5 || b > SAFE.x1 + .5 || c > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
  }
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS) { var mm = this.measureText(str); recBox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent, str); }
      return orig.apply(this, arguments);
    };
  }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    font(g, px, o.wt, o.fam); if (o.wd) wide(g); ls(g, o.ls || 0);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw + pad * 2 > o.maxw && px > 30) { px -= 2; font(g, px, o.wt, o.fam); if (o.wd) wide(g); tw = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, px, o.wt, o.fam); if (o.wd) wide(g);
    g.fillText(text, 0, px * .04); g.restore(); ls(g, 0);
    return w;
  }
  function label(g, text, x, y, a, col, px, align, plate) {
    px = Math.max(30, px || 36);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); ls(g, 3); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    while (g.measureText(text).width > 800 && px > 30) { px--; font(g, px, 500, MONO); }
    var dy = (1 - Math.min(1, a)) * 14;
    if (plate) {
      var w = g.measureText(text).width, x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
      rr(g, x0 - 18, y - px * .78 + dy, w + 36, px * 1.56, 12); g.fillStyle = 'rgba(21,19,27,.92)'; g.fill();
    }
    g.fillStyle = col || CREAM;
    g.fillText(text, x, y + dy); g.restore(); ls(g, 0);
  }
  function block(g, lines, x, y, px, a, plate, col, wt, fam) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 500, fam || MONO); ls(g, 0); g.textAlign = 'center'; g.textBaseline = 'middle';
    var lh = px * 1.3, w = 0; lines.forEach(function (l) { w = Math.max(w, g.measureText(l).width); });
    var y0 = y - (lines.length - 1) * lh / 2;
    if (plate) { rr(g, x - w / 2 - 22, y0 - lh / 2 - 10, w + 44, lh * lines.length + 20, 14); g.fillStyle = 'rgba(21,19,27,.94)'; g.fill(); if (plate === 'line') { g.strokeStyle = CREAM; g.lineWidth = 3; g.stroke(); } }
    g.fillStyle = col || CREAM; lines.forEach(function (l, i) { g.fillText(l, x, y0 + i * lh); });
    g.restore();
  }
  function tri(g, a, b, c, d, e, f) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.lineTo(e, f); g.closePath(); g.fill(); }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  function sheet(g, x, y, w, h, rot, a, fn, col) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(-w / 2 + 12, -h / 2 + 18, w, h);
    g.fillStyle = col || PAPER; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(-w / 2, h / 2 - 6, w, 6);
    if (fn) fn(g, w, h);
    g.restore();
  }
  function tag(g, text, x, y, a, rot) { chip(g, text, x, y, { px: 32, wt: 700, fam: MONO, line: HOT, lw: 4, fg: HOT, a: a, rot: rot == null ? .03 : rot, shadow: false, bg: 'rgba(21,19,27,.85)' }); }

  /* ---------- rubber stamps: worn ink (seeded speckle), slammed ---------- */
  var STEX = {};
  function stampTex(text, col, px) {
    var key = text + col + px; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900); ls(m, 2);
    var lw = m.measureText(text).width, pad = px * .45, h = px * 1.25, w = lw + pad * 2, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(4, px * .085); rr(g, 2, 2, w - 4, h - 4, px * .14); g.stroke();
    g.lineWidth = Math.max(2, px * .03); rr(g, px * .14, px * .14, w - px * .28, h - px * .28, px * .08); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, px, 900); ls(g, 2); g.fillText(text, w / 2, h / 2 + px * .05);
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 140);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .35 + r() * .65; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.9, 0, 6.283); g.fill(); }
    c.w = w + 16; c.h = h + 16; STEX[key] = c; return c;
  }
  function stamp(g, text, x, y, t, t0, t1, px, col, rot, bare) {
    if (t < t0 || t > t1 + .3) return;
    var c = stampTex(text, col, px);
    var k = sp(t, t0, 3.2, .8), s = lerp(1.35, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (1 - seg(t, t1, t1 + .3));
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.1 : rot); g.scale(s, s);
    if (k >= 1) recBox(g, -c.w / 2 - 14, -c.h / 2 - 4, c.w / 2 - 6, c.h / 2 + 4, text);
    if (!bare) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-c.w / 2 - 4, -c.h / 2 + 10, c.w + 8, c.h);
      g.fillStyle = PAPER; g.fillRect(-c.w / 2 - 14, -c.h / 2 - 4, c.w + 8, c.h + 8); }
    g.drawImage(c, -c.w / 2 - 10, -c.h / 2); g.restore();
  }

  /* ---------- the toppings, drawn flat ---------- */
  var WORDS = ['PEPPERONI', 'MUSHROOMS', 'PINEAPPLE'];
  function topping(g, i, x, y, r) {
    g.save(); g.translate(x, y);
    if (i === 0) {
      g.fillStyle = '#c8442e'; el(g, 0, 0, r, r);
      g.fillStyle = '#8e2a1c'; [[-.4, -.3], [.35, -.35], [.05, .1], [-.35, .4], [.4, .35]].forEach(function (p) { el(g, p[0] * r, p[1] * r, r * .13, r * .11); });
      g.fillStyle = 'rgba(255,230,200,.35)'; el(g, -.3 * r, -.45 * r, r * .25, r * .1, -.5);
    } else if (i === 1) {
      g.fillStyle = '#efe3c9'; rr(g, -r * .28, -r * .05, r * .56, r * .95, r * .14); g.fill();
      g.fillStyle = '#9a7354'; g.beginPath(); g.ellipse(0, 0, r, r * .72, 0, Math.PI, 0); g.closePath(); g.fill();
      g.fillStyle = '#c9a585'; el(g, -r * .35, -r * .35, r * .14, r * .1); el(g, r * .3, -r * .45, r * .1, r * .08);
      g.strokeStyle = INK; g.lineWidth = Math.max(2, r * .05); g.beginPath(); g.moveTo(-r, 0); g.lineTo(r, 0); g.stroke();
    } else {
      g.fillStyle = '#5f8f4a'; tri(g, -r * .25, -r * .55, 0, -r * 1.05, r * .25, -r * .55); tri(g, -r * .5, -r * .5, -r * .25, -r * .95, 0, -r * .55);
      g.fillStyle = '#f2c14e'; g.beginPath(); g.moveTo(-r * .8, r * .7); g.lineTo(r * .8, r * .7); g.lineTo(0, -r * .6); g.closePath(); g.fill();
      g.save(); g.clip(); g.strokeStyle = '#b8862a'; g.lineWidth = Math.max(2, r * .05);
      for (var k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(k * r * .35 - r, r); g.lineTo(k * r * .35 + r, -r); g.stroke(); g.beginPath(); g.moveTo(k * r * .35 + r, r); g.lineTo(k * r * .35 - r, -r); g.stroke(); }
      g.restore();
    }
    g.restore();
  }

  /* =====================================================================================================
     THE PAPER DIE. A real cube: object space ±1, orientation M (3×3), seen through a fixed view tilt V, orthographic.
     Each roll turns it by whole quarter turns about world axes, so it always lands flat with a word upright to camera.
     ===================================================================================================== */
  function mm(A, B) { var C = []; for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) C.push(A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]); return C; }
  function mv(M, v) { return [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]]; }
  function rot(ax, a) { var c = Math.cos(a), s = Math.sin(a); if (ax === 0) return [1, 0, 0, 0, c, -s, 0, s, c]; if (ax === 1) return [c, 0, s, 0, 1, 0, -s, 0, c]; return [c, -s, 0, s, c, 0, 0, 0, 1]; }
  var I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  /* faces: normal n, text axes u (right) and v (down); word index. Each word sits on two opposite-ish faces */
  var FACES = [
    { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], w: 0 }, { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], w: 0 },
    { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], w: 1 }, { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], w: 2 },
    { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], w: 1 }, { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], w: 2 }
  ];
  var V = mm(rot(0, -.36), rot(1, -.4));
  function rnd3(M) { return M.map(function (x) { return Math.round(x); }); }
  function frontWord(M) {
    for (var i = 0; i < FACES.length; i++) { var f = FACES[i], n = mv(M, f.n), v = mv(M, f.v); if (n[2] > .9 && v[1] > .9) return f.w; }
    return -1;
  }
  /* the rolls, keyed to the voice (filled in initRolls) */
  var ROLLS = [];
  function initRolls() {
    var P = 0, M_ = 1, A = 2;
    function R(land, d, w, tally) { ROLLS.push({ land: land, d: d, w: w, tally: tally }); }
    /* dice: the drop-in */
    R(at('dice', 'dice') + .02, at('dice', 'dice') + .02 - S('dice').t0, P, false);
    /* weighted: P, P, then MUSHROOMS on "mushrooms" */
    var w0 = at('weighted', 'weighted'), w1 = at('weighted', 'so'), w2 = at('weighted', 'mushrooms');
    R(w0 + .05, .55, P, true); R(w1, Math.min(.6, w1 - w0 - .1), P, true); R(w2 + .05, Math.min(.6, w2 + .05 - w1 - .08), M_, true);
    /* down: four in a row, all the favorite */
    ['favorite', 'almost', 'always', 'wins'].forEach(function (wd, i, arr) {
      var tl = at('down', wd) + .05, prev = i ? at('down', arr[i - 1]) + .05 : at('down', 'down') + .1;
      R(tl, Math.max(.26, Math.min(.5, tl - prev - .04)), P, true);
    });
    /* up: long shots get a chance */
    var u0 = at('up', 'long') + .05, u1 = at('up', 'shots') + .05, u2 = at('up', 'chance') + .05;
    R(u0, Math.min(.55, u0 - at('up', 'up') - .05), A, true); R(u1, Math.max(.26, Math.min(.5, u1 - u0 - .04)), M_, true); R(u2, Math.max(.26, Math.min(.55, u2 - u1 - .04)), P, true);
    /* each roll: quarter turns about x or y (and a z twist if needed) so the right word lands face-up to camera */
    var M = rnd3(mm(rot(1, -Math.PI / 2 * 1), rot(0, Math.PI / 2 * 2)));
    var rng = mulberry(31);
    ROLLS.forEach(function (r, i) {
      var qmin = r.d > .7 ? 4 : 2, done = false, axes = rng() < .5 ? [0, 1] : [1, 0], sg = rng() < .5 ? 1 : -1;
      if (i === 0) { /* the drop-in starts from a tilted, unreadable pose */ qmin = 5; }
      for (var qz = 0; qz < 4 && !done; qz++) for (var qa = qmin; qa < qmin + 4 && !done; qa++) for (var ai = 0; ai < 2 && !done; ai++) for (var si = 0; si < 2 && !done; si++) {
        var ax = axes[ai], q = qa * (si ? -sg : sg), Rz = [0, 1, 3, 2][qz] * Math.PI / 2;
        var Rf = rnd3(mm(rot(2, Rz), rot(ax, q * Math.PI / 2))), M2 = rnd3(mm(Rf, M));
        if (frontWord(M2) === r.w) { r.ax = ax; r.q = q; r.qz = Rz; r.M0 = M; M = M2; done = true; }
      }
      if (!done) throw new Error('no roll for ' + r.w);
      r.M1 = M; r.t0 = r.land - r.d;
    });
  }
  function dieM(t) {
    var M = ROLLS[0].M0;
    for (var i = 0; i < ROLLS.length; i++) {
      var r = ROLLS[i]; if (t < r.t0) break;
      if (t >= r.land) { M = r.M1; continue; }
      var k = eo(seg(t, r.t0, r.land) * 1.0);
      k = 1 - Math.pow(1 - seg(t, r.t0, r.land), 2.2);
      M = mm(mm(rot(2, r.qz * k), rot(r.ax, r.q * Math.PI / 2 * k)), r.M0);
    }
    return M;
  }
  function lastRoll(t) { var r = null; ROLLS.forEach(function (x) { if (t >= x.land) r = x; }); return r; }
  function activeRoll(t) { for (var i = 0; i < ROLLS.length; i++) if (t >= ROLLS[i].t0 && t < ROLLS[i].land) return ROLLS[i]; return null; }
  var LIGHT = (function () { var l = [-.35, -.62, .7], n = Math.hypot(l[0], l[1], l[2]); return [l[0] / n, l[1] / n, l[2] / n]; })();
  /* pepperoni's share of the die follows the odds: the two PEPPERONI faces are a third of the die, so the other four
     faces are painted pepperoni from the top by c = (6P − 2) / 4 (0.4 at T 1, 0.22 at T 1.8, 0.98 at T 0.2) */
  function cover(P) { return clamp((6 * P - 2) / 4, 0, 1); }
  var DOTS = (function () { var r = mulberry(5), o = []; for (var i = 0; i < 9; i++) o.push([20 + r() * 160, 18 + r() * 164, 13 + r() * 6]); return o; })();
  function faceArt(g, f, c) {
    /* face-local 0..200 */
    g.fillStyle = 'rgba(33,29,38,.07)'; g.fillRect(14, 14, 172, 172);
    var band = f.w === 0 ? 0 : clamp(c, 0, 1) * 200;
    if (band < 120) topping(g, f.w, 100, 78, 44);
    font(g, 34, 900); var tw = g.measureText(WORDS[f.w]).width, px = Math.min(34, 34 * 176 / tw);
    if (band < 136) { font(g, px, 900); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(WORDS[f.w], 100, 160); }
    if (band > 0) {
      g.save(); g.beginPath(); g.rect(0, 0, 200, band); g.clip();
      g.fillStyle = '#d9533c'; g.fillRect(0, 0, 200, 200);
      g.fillStyle = '#9c2f1f'; DOTS.forEach(function (d) { el(g, d[0], d[1], d[2], d[2] * .85); });
      g.fillStyle = 'rgba(255,240,220,.9)'; g.fillRect(0, band - 5, 200, 5);
      if (band > 92) { font(g, px, 900); g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PEPPERONI', 100, Math.min(band / 2, 100) + 4); }
      g.restore();
    }
  }
  /* draw the die at x, y with half-edge h px; hl = outline the landed face in coral; c = pepperoni cover */
  function die(g, x, y, h, M, a, hl, c) {
    if (a <= 0) return;
    var VM = mm(V, M);
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    FACES.forEach(function (f) {
      var nw = mv(VM, f.n); if (nw[2] <= .02) return;
      function P(su, sv) { var p = [f.n[0] + su * f.u[0] + sv * f.v[0], f.n[1] + su * f.u[1] + sv * f.v[1], f.n[2] + su * f.u[2] + sv * f.v[2]], q = mv(VM, p); return [q[0] * h, q[1] * h]; }
      var o = P(-1, -1), pu = P(1, -1), pv = P(-1, 1), pq = P(1, 1);
      var lum = .7 + .3 * Math.max(0, nw[0] * LIGHT[0] + nw[1] * LIGHT[1] + nw[2] * LIGHT[2]);
      g.beginPath(); g.moveTo(o[0], o[1]); g.lineTo(pu[0], pu[1]); g.lineTo(pq[0], pq[1]); g.lineTo(pv[0], pv[1]); g.closePath();
      g.fillStyle = PAPER; g.fill();
      g.save(); g.clip(); g.transform((pu[0] - o[0]) / 200, (pu[1] - o[1]) / 200, (pv[0] - o[0]) / 200, (pv[1] - o[1]) / 200, o[0], o[1]);
      g.globalAlpha *= clamp((nw[2] - .1) * 4, 0, 1); faceArt(g, f, c || 0); g.restore();
      g.beginPath(); g.moveTo(o[0], o[1]); g.lineTo(pu[0], pu[1]); g.lineTo(pq[0], pq[1]); g.lineTo(pv[0], pv[1]); g.closePath();
      g.fillStyle = 'rgba(40,30,30,' + (1 - lum).toFixed(3) + ')'; g.fill();
      var isFront = hl && mv(M, f.n)[2] > .9;
      g.strokeStyle = isFront ? HOT : INK; g.lineWidth = isFront ? 7 : 4; g.lineJoin = 'round'; g.stroke();
    });
    g.restore();
  }

  /* ---------- the odds: softmax with temperature over the example odds ---------- */
  var BASE = [.6, .25, .15];
  function odds(T) {
    if (T < .03) return [1, 0, 0];
    var e = BASE.map(function (p) { return Math.exp(Math.log(p) / T); }), s = e[0] + e[1] + e[2];
    return e.map(function (x) { return x / s; });
  }
  /* the knob value: 1, a test turn to 1.3 and back on "dial", then 0.2 on "down", 1.8 on "up", 0 on "why" (springs, no bounce past the stops) */
  function knobT(t) {
    var v = 1, st = [[wend('dial', 'dial') - .05, 1.3], [at('dial', 'temperature') + .15, 1], [at('down', 'down') - .05, .2], [at('up', 'up') - .05, 1.8], [at('why', 'why') - .1, 0]], prev = 1;
    st.forEach(function (s) { v += (s[1] - prev) * clamp(sp(t, s[0], 2.4, .95), 0, 1); prev = s[1]; });
    return clamp(v, 0, 2);
  }

  /* =====================================================================================================
     SCENE 1 · hook + ask: ONE shared "Best pizza topping?" bubble sent to two big generic phones; one says Pepperoni.,
     the other types Mushrooms.; the search phrase comes in as the headline at ~1.5 s
     ===================================================================================================== */
  function phone(g, x, y, w, h, a, inner) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    rr(g, -w / 2 + 10, 16, w, h, 56); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -w / 2, 0, w, h, 56); g.fillStyle = BODY2; g.fill();
    rr(g, -w / 2 + 14, 14, w - 28, h - 28, 44); g.fillStyle = SCREEN; g.fill();
    g.fillStyle = '#0c0b10'; el(g, 0, 44, 13, 13);
    if (inner) { g.save(); rr(g, -w / 2 + 14, 14, w - 28, h - 28, 44); g.clip(); inner(g, -w / 2 + 14, 14, w - 28, h - 28); g.restore(); }
    g.restore();
  }
  /* frames are quantised for anything that shows a changing number, so motion blur never mixes two values */
  /* the renderer samples each frame at (i + .5) / fps, so round() would straddle a frame edge and blur two values
     into one garbled number: floor to the frame and hold its centre instead. */
  function qt(t) { return (Math.floor(t * 30) + .5) / 30; }
  var PH = { w: 424, h: 780, y: 540, xs: [290, 730] }, QB = { y: 470 };
  function reply(g, x0, y0, w, rep, t, shake) {
    g.save(); g.translate(shake || 0, 0);
    var bx = x0 + 18, by = y0 + 100;
    if (rep.dots != null) {
      if (rep.dots > 0) {
        g.globalAlpha *= rep.dots; rr(g, bx, by, 200, 124, 36); g.fillStyle = BUB; g.fill();
        for (var i = 0; i < 3; i++) { var b = Math.max(0, Math.sin(t * 7 - i * .9)); g.fillStyle = mixC('#8d8899', '#f4ede0', b); el(g, bx + 54 + i * 46, by + 62 - b * 10, 14, 14); }
      }
      g.restore(); return;
    }
    font(g, 54, 800); var full = g.measureText(rep.full).width, tw = g.measureText(rep.text).width;
    rr(g, bx, by, Math.min(w - 36, Math.max(120, full + 52)), 124, 36); g.fillStyle = BUB; g.fill();
    g.fillStyle = CREAM; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(rep.text, bx + 24, by + 64);
    if (rep.caret && Math.floor(t * 4) % 2 === 0) { g.fillStyle = HOT; g.fillRect(bx + 32 + tw, by + 32, 6, 62); }
    g.restore();
  }
  /* frame 0: the shared question + "Pepperoni." = 4 words; the right phone shows typing dots, then types "Mushrooms."
     from 0.12 s, done by ~0.8 s */
  var TY0 = .12;
  function typed(t) { return 'Mushrooms.'.slice(0, clamp(1 + Math.floor((t - TY0) / .07), 0, 10)); }
  function question(g, t) {
    /* one cream bubble above both phones, two coral leads into them: the same question, sent twice */
    font(g, 60, 800); var tx = 'Best pizza topping?', tw = g.measureText(tx).width, w = tw + 70, x0 = CX - w / 2;
    g.save(); g.strokeStyle = HOT; g.lineWidth = 6; g.lineCap = 'round'; g.setLineDash([2, 14]); g.lineDashOffset = -t * 40;
    PH.xs.forEach(function (x) { g.beginPath(); g.moveTo(CX + (x - CX) * .35, QB.y + 40); g.lineTo(x, PH.y + 60); g.stroke(); });
    g.restore();
    rr(g, x0 + 6, QB.y - 48, w, 100, 34); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    rr(g, x0, QB.y - 54, w, 100, 34); g.fillStyle = CREAM; g.fill();
    g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(tx, CX, QB.y - 2);
  }
  function phones(g, t, mode) {
    var sh = 0, dif = at('hook', 'different');
    if (mode === 'hook') sh = knock(t, dif - .05, 38, 7) * 14;
    var bob = Math.sin(t * 1.4) * 5;
    phone(g, PH.xs[0], PH.y + bob, PH.w, PH.h, 1, function (g, x0, y0, w, h) {
      reply(g, x0, y0, w, mode === 'end' ? { dots: 1 } : { text: 'Pepperoni.', full: 'Pepperoni.' }, t, sh);
    });
    phone(g, PH.xs[1], PH.y - bob, PH.w, PH.h, 1, function (g, x0, y0, w, h) {
      reply(g, x0, y0, w, mode === 'end' || t < TY0 ? { dots: 1 } : { text: typed(t), full: 'Mushrooms.', caret: typed(t).length < 10 }, t + .4, -sh);
    });
    question(g, t);
  }
  var STY = 1010;
  function hookScene(g, t) {
    phones(g, t, 'hook');
    var why = at('ask', 'why');
    stamp(g, '≠', CX, STY, t, -.09, why - .2, 225, HOT, -.08);
    stamp(g, '?', CX, STY, t, why - .12, S('dice').t0, 220, HOT, .1);
    tag(g, 'RE-CREATED', CX, 1395, 1, .02);
  }
  var HEAD = ['WHY DOES CHATGPT', 'GIVE DIFFERENT', 'ANSWERS?'], HEADT = 1.45;
  function headline(g, t) {
    var a = fin(t, HEADT) * (1 - seg(t, start('dice') - .12, start('dice') + .02));
    if (a <= 0) return;
    var k = clamp(spring(t - HEADT, 3.2, .85), 0, 1.04);
    g.save(); g.globalAlpha *= a;
    var px = 64; font(g, px, 900); wide(g); g.textAlign = 'center'; g.textBaseline = 'middle';
    HEAD.forEach(function (l) { while (g.measureText(l).width > 800 && px > 52) { px -= 2; font(g, px, 900); wide(g); } });
    HEAD.forEach(function (l, i) {
      var y = 262 + i * px * 1.08 + (1 - Math.min(1, k)) * 30, dk = at('ask', 'different');
      if (i === 1 && t >= dk - .03 && t < wend('ask', 'different') + .2) {
        var wd = g.measureText('DIFFERENT').width, x0 = CX - g.measureText(l).width / 2 + g.measureText('GIVE ').width;
        g.fillStyle = HOT; rr(g, x0 - 10, y - px * .6, wd + 20, px * 1.2, 14); g.fill();
      }
      g.fillStyle = CREAM; g.fillText(l, CX, y);
    });
    g.restore();
  }
  /* the loop back: right phone still typing, no ≠ until frame 0 proper */
  function hookIdle(g, ti) { phones(g, ti, 'hook'); tag(g, 'RE-CREATED', CX, 1395, 1, .02); }

  /* =====================================================================================================
     SCENE 2 · dice → why: a big die, the odds bars, the ROLLS tally, the knob; filling y 480–1440
     ===================================================================================================== */
  var BX = [215, 510, 805], BW = 250, BASEY = 1170, MAXH = 230, DX = 300, DY = 648, DH = 150;
  function KIN() { return end('weighted') - .55; }
  function bars(g, t, a, P, PD, flash) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    var od = at('odds', 'odds');
    for (var i = 0; i < 3; i++) {
      var g0 = od - .05 + i * .45, gr = clamp(sp(t, g0, 2.2, .95), 0, 1.0), grd = clamp(sp(qt(t), g0, 2.2, .95), 0, 1), hh = Math.max(4, P[i] * MAXH * gr), x = BX[i];
      var fl = flash[i] || 0;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x - BW / 2 + 8, BASEY - hh + 10, BW, hh);
      g.fillStyle = fl > 0 ? mixC('#f4ede0', '#ff5b3d', fl) : (i === 0 ? '#f4ede0' : '#d9d0c0'); g.fillRect(x - BW / 2, BASEY - hh, BW, hh);
      topping(g, i, x, BASEY - Math.min(hh, 64) / 2 - 2, Math.min(26, Math.max(6, hh / 2 - 6)));
      /* the % counts up with its bar, then follows the knob; a hard number, never a cross-fade */
      if (t >= g0) {
        var hd = Math.max(4, PD[i] * MAXH * grd), inside = hd > 150, ly = inside ? BASEY - hd + 40 : BASEY - hd - 34;
        font(g, 54, 900); g.fillStyle = inside ? BG : (i === 0 || fl > .3 ? HOT : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(Math.round(PD[i] * 100 * grd) + '%', x, ly);
      }
      g.save(); font(g, 38, 600, MONO); ls(g, 0); g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha *= fin(t, od + .1); g.fillText(WORDS[i], x, BASEY + 38); g.restore();
    }
    g.fillStyle = CREAM; g.fillRect(BX[0] - BW / 2 - 4, BASEY, BX[2] - BX[0] + BW + 8, 4);
    g.restore();
  }
  function knob(g, x, y, r, T, a, nums) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    var A0 = Math.PI * .75, SPAN = Math.PI * 1.5;
    g.lineCap = 'round';
    for (var i = 0; i <= 20; i++) { var an = A0 + SPAN * i / 20, r0 = r + 6, r1 = r + (i % 10 === 0 ? 24 : 14); g.strokeStyle = i % 10 === 0 ? CREAM : DIM; g.lineWidth = 4; g.beginPath(); g.moveTo(Math.cos(an) * r0, Math.sin(an) * r0); g.lineTo(Math.cos(an) * r1, Math.sin(an) * r1); g.stroke(); }
    if (nums !== false) {
      font(g, 36, 900); g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle';
      ['0', '1', '2'].forEach(function (s, i) { var an = A0 + SPAN * i / 2, rr0 = r + 44; g.fillText(s, Math.cos(an) * rr0, Math.sin(an) * rr0); });
    }
    var ang = A0 + SPAN * T / 2;
    g.fillStyle = 'rgba(0,0,0,.4)'; el(g, 6, 10, r, r);
    g.save(); g.rotate(ang);
    g.fillStyle = BODY2; g.beginPath();
    for (var k = 0; k < 48; k++) { var aa = k / 48 * Math.PI * 2, rk = k % 2 ? r : r - 6; g.lineTo(Math.cos(aa) * rk, Math.sin(aa) * rk); }
    g.closePath(); g.fill();
    g.fillStyle = '#4a4458'; el(g, 0, 0, r * .74, r * .74);
    g.fillStyle = HOT; rr(g, r * .12, -8, r * .74, 16, 8); g.fill();
    g.restore();
    g.restore();
  }
  function tallyRow(g, word, x, y, a, hot) {
    chip(g, WORDS[word], x, y, { px: 36, wt: 900, bg: hot > 0 ? mixC('#f4ede0', '#ff5b3d', hot) : CREAM, fg: BG, a: a, w: 320, shadow: true });
  }
  function dieScene(g, t) {
    var s0 = S('dice').t0, od = start('odds'), dl = KIN(), wy = at('why', 'why');
    /* before the dial arrives the die and bars sit 150 px lower, filling the frame; they lift as the knob slides in */
    var drop = 150 * (1 - clamp(sp(t, dl, 2.4, .9), 0, 1));
    var T = knobT(t), P = odds(T), TD = knobT(qt(t)), PD = odds(TD);
    var mvk = eio(seg(t, od - .25, od + .3));
    var r0 = ROLLS[0], ink = clamp(sp(t, s0 + .02, 1.5, .9), 0, 1.01);
    var bx = lerp(lerp(-300, CX, ink), DX, mvk), by = lerp(900, DY, mvk), hh = lerp(175, DH, mvk);
    var ar = activeRoll(t), lr = lastRoll(t), hop = 0, sq = 1;
    if (ar && ar !== r0) { var k = seg(t, ar.t0, ar.land); hop = Math.sin(Math.PI * k) * 12; }
    if (lr) sq = 1 + Math.max(0, knock(t, lr.land, 20, 9)) * .05;
    g.save(); g.translate(0, drop);
    g.save(); g.globalAlpha *= .4; g.fillStyle = '#000'; el(g, bx, by + hh * 1.5, hh * 1.25, hh * .2); g.restore();
    g.save(); g.translate(bx, by - hop); g.scale(sq, 1 / sq); g.translate(-bx, -(by - hop));
    die(g, bx, by - hop, hh, dieM(t), 1, lr && !ar && t - lr.land < .6, cover(P[0]));
    g.restore();
    stamp(g, 'ON PURPOSE', CX, 575, t, at('dice', 'on') - .08, start('odds') + .6, 92, HOT, -.06);
    var flash = [0, 0, 0];
    ROLLS.forEach(function (r) { if (r.tally && t >= r.land) flash[r.w] = Math.max(flash[r.w], 1 - seg(t, r.land, r.land + .45)); });
    var pp = at('odds', 'pepperoni'); flash[0] = Math.max(flash[0], fin(t, pp - .05) * (1 - seg(t, end('odds') + .1, end('odds') + .6)));
    bars(g, t, fin(t, at('odds', 'odds') - .1), P, PD, flash);
    chip(g, 'BEST PIZZA TOPPING?', 712, 545, { px: 40, wt: 900, bg: 'rgba(21,19,27,.0)', fg: CREAM, a: fin(t, at('odds', 'best') - .1), maxw: 430, shadow: false, line: CREAM, lw: 3 });
    chip(g, 'EXAMPLE ODDS', 712, 832, { px: 38, wt: 700, fam: MONO, line: HOT, lw: 4, fg: HOT, bg: 'rgba(21,19,27,.85)', shadow: false, a: fin(t, at('odds', 'odds') + .45), rot: .02 });
    var clr = 1 - seg(t, wy - .1, wy + .15), list = ROLLS.filter(function (r) { return r.tally && t >= r.land; });
    list.slice(-4).reverse().forEach(function (r, i) {
      var k = clamp(sp(t, r.land, 3, .9), 0, 1.02), newest = list[list.length - 1];
      var slot = Math.min(2, i - (1 - Math.min(1, clamp(sp(t, newest.land, 3, .9), 0, 1)))), y = 612 + Math.max(0, slot) * 64;
      var a = clr * clamp(k * 3, 0, 1);
      if (i === 3) { a *= 1 - seg(t, newest.land, newest.land + .12); y = 612 + 2 * 64; }
      if (a <= 0) return;
      tallyRow(g, r.w, 712, y, a, 1 - seg(t, r.land, r.land + .5));
    });
    g.restore();
    /* the knob slides in at ~15.5 s, before "dial"; a test turn 1 → 1.3 → 1 while the voice says "dial" */
    var ka = clamp(sp(t, dl, 2.4, .9), 0, 1.02), kx = lerp(235, 255, ka);
    knob(g, kx, 1318, 80, T, clamp(ka * 2.5, 0, 1));
    var tp = at('dial', 'temperature'), dn = at('down', 'down'), upw = at('up', 'up');
    chip(g, 'TEMPERATURE', 690, 1248, { px: 52, wt: 900, fg: CREAM, a: fin(t, tp - .08), s: kn(t, tp), maxw: 470, wd: true });
    chip(g, 'T = ' + TD.toFixed(1), 690, 1336, { px: 64, wt: 900, bg: HOT, fg: BG, a: fin(t, dl + .15), s: kn(t, dn) * kn(t, upw) * kn(t, wy), maxw: 420 });
    chip(g, 'OPENAI API: 0–2 · DEFAULT 1', 680, 1410, { px: 36, wt: 800, bg: CREAM, fg: BG, a: fin(t, dl + .3) * (1 - seg(t, dn + .45, dn + .55)), maxw: 490 });
    chip(g, 'LOW = FOCUSED', 680, 1410, { px: 42, wt: 900, bg: CREAM, fg: BG, a: fin(t, dn + .55) * (1 - seg(t, upw - .2, upw)), maxw: 460 });
    chip(g, 'HIGH = MORE RANDOM', 680, 1410, { px: 42, wt: 900, bg: CREAM, fg: BG, a: fin(t, upw - .2) * (1 - seg(t, wy - .22, wy - .1)), maxw: 460 });
    stamp(g, '?', DX, DY + 30, t, at('why', 'favorite') - .1, S('stuck').t0, 110, HOT, .12);
  }

  /* =====================================================================================================
     SCENE 3 · stuck: the real GPT-2 beam-search output (Holtzman et al., Fig. 1) printing faster and faster, the paper
     feeding up as it spills; the repeats in coral. Only the source's own words, line breaks moved to the repeats.
     ===================================================================================================== */
  var PRINT = [
    ['“…was conducted by researchers', 0],
    ['from the', 0],
    ['Universidad Nacional Autónoma de México', 1],
    ['(UNAM) and the', 0],
    ['Universidad Nacional Autónoma de México', 1],
    ['(UNAM/', 0]
  ];
  /* the source prints four of these before its own "…": the loop runs on, and the sheet says RE-CREATED */
  for (var pi = 0; pi < 12; pi++) PRINT.push(['Universidad Nacional Autónoma de México/', 1]);
  PRINT.push(['Universidad Nacional Autónoma de …”', 1]);
  var PSY = { top: 700, bot: 1170 }, PLH = 50;
  /* it prints faster and faster: each line takes 0.74 of the one before, down to a 0.1 s floor */
  function printTimes() {
    var tt = S('stuck').t0 + .12, out = [], i, d;
    for (i = 0; i < PRINT.length; i++) { d = Math.max(.1, .44 * Math.pow(.74, i)); out.push({ t: tt, d: d }); tt += d; }
    return out;
  }
  function stuckScene(g, t) {
    var s0 = S('stuck').t0, st = at('stuck', 'stuck'), rep = at('stuck', 'repeating'), PT = printTimes();
    var sk = pop(t, s0 + .02, 2.6);
    chip(g, 'ALWAYS THE LIKELIEST WORDS', CX, 540, { px: 52, wt: 900, bg: CREAM, fg: BG, a: fin(t, s0 + .1), s: lerp(1.08, 1, clamp(pop(t, s0 + .1, 3.2), 0, 1)), maxw: 740, rot: -.01 });
    chip(g, 'BEAM SEARCH · GPT-2', CX, 618, { px: 44, wt: 900, bg: HOT, fg: BG, a: fin(t, s0 + .2), maxw: 740, rot: .01 });
    /* the sheet: a window on the paper; lines past the window push the paper up */
    var shown = 0; PT.forEach(function (p, i) { if (t >= p.t) shown = i + 1; });
    var lastK = shown ? clamp((t - PT[shown - 1].t) / (PT[shown - 1].d * .9), 0, 1) : 0;
    var rows = PSY.bot - PSY.top - 60, over = Math.max(0, (shown - 1 + eio(lastK)) * PLH + PLH - rows), w = 860;
    g.save(); g.globalAlpha *= clamp(sk * 3, 0, 1); g.translate(CX, (1 - Math.min(1, sk)) * 80);
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(-w / 2 + 12, PSY.top + 18, w, PSY.bot - PSY.top);
    g.fillStyle = PAPER; g.fillRect(-w / 2, PSY.top, w, PSY.bot - PSY.top);
    g.save(); g.beginPath(); g.rect(-w / 2, PSY.top + 10, w, PSY.bot - PSY.top - 10); g.clip();
    font(g, 34, 500, MONO); ls(g, 0); g.textAlign = 'left'; g.textBaseline = 'middle';
    var x0 = -w / 2 + 28, y0 = PSY.top + 48 - over;
    PRINT.forEach(function (L, i) {
      if (i >= shown) return;
      var k = i === shown - 1 ? lastK : 1, n = Math.ceil(L[0].length * k), s = L[0].slice(0, n), y = y0 + i * PLH;
      if (y < PSY.top + 12 || y > PSY.bot - 8) return;   /* scrolled out of the window: not drawn at all */
      if (L[1]) { var hk = eio(seg(t, Math.max(PT[i].t, rep - .3), Math.max(PT[i].t, rep - .3) + .3)); if (hk > 0) { g.fillStyle = 'rgba(255,91,61,.34)'; g.fillRect(x0 - 6, y - 21, g.measureText(L[0]).width * hk + 12, 42); } }
      g.fillStyle = INK; g.fillText(s, x0, y);
    });
    g.restore();
    /* the printer's lip: the paper feeds up out of it */
    g.fillStyle = BODY2; rr(g, -w / 2 - 20, PSY.bot - 6, w + 40, 34, 10); g.fill();
    g.fillStyle = HOT; g.fillRect(-w / 2, PSY.top, w, 8);
    g.restore();
    if (!INCOMING) label(g, 'HOLTZMAN ET AL., ICLR 2020', CX, 1216, fin(t, s0 + .02), CREAM, 34, 'center', true);
    tag(g, 'RE-CREATED', 232, 668, fin(t, s0 + .25), -.04);
    stamp(g, 'STUCK', 655, 1338, t, st - .1, S('zero').t0, 100, HOT, -.07);
  }

  /* =====================================================================================================
     SCENE 4 · zero + eighty: temperature 0, the open model, one prompt 1,000 times; 80 different answers; the split
     ===================================================================================================== */
  function slip(g, x, y, w, h, rot, a, text, px, col, fg) {
    sheet(g, x, y, w, h, rot, a, function (g, w, h) {
      if (!text) return;
      font(g, px, px > 32 ? 800 : 500, px > 32 ? DISP : MONO); g.fillStyle = fg || INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, -w / 2 + 24, 2);
    }, col);
  }
  /* a slip in a pile: paper with a thin edge line, no drop shadow (stacked shadows smear) */
  function pileSlip(g, x, y, w, h, rot, col) {
    g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = 'rgba(33,29,38,.22)'; g.fillRect(-w / 2, h / 2 - 3, w, 3); g.restore();
  }
  function labScene(g, t) {
    var s0 = S('zero').t0, zr = at('zero', 'zero'), lb = at('zero', 'lab'), ask = at('zero', 'asked'), th = at('zero', '1000');
    var e80 = at('eighty', '80'), dif = at('eighty', 'different'), busy = at('eighty', 'busy'), rnd = at('eighty', 'round');
    /* temperature 0 and the knob at 0 are there from the cut */
    knob(g, 175, 548, 44, 0, fin(t, s0 + .02), false);
    chip(g, 'TEMPERATURE 0', 575, 540, { px: 62, wt: 900, bg: HOT, fg: BG, a: fin(t, s0 + .05), s: kn(t, at('zero', 'zero')), wd: true, maxw: 680 });
    chip(g, 'OPEN MODEL QWEN3', CX, 630, { px: 54, wt: 900, bg: CREAM, fg: BG, a: fin(t, lb - .1), s: kn(t, lb), maxw: 800 });
    var out80 = eio(seg(t, e80 - .2, e80 + .15)), pk = pop(t, s0 + .05, 2.6);
    slip(g, CX, 775 - (1 - Math.min(1, pk)) * 60 - out80 * 40, 760, 110, -.012, clamp(pk * 3, 0, 1) * (1 - out80), 'Tell me about Richard Feynman', 44);
    var grow = eio(seg(t, zr + .15, wend('zero', 'times'))), n = Math.floor(grow * 26);
    var sk = eio(seg(t, dif - .1, dif + .45)), stripY = lerp(1150 - (n + 1) * 3.2 - 6, 1000, sk);
    var rng = mulberry(77), jit = []; for (var i = 0; i < 26; i++) jit.push([(rng() - .5) * 20, (rng() - .5) * .03]);
    if (grow > 0) {
      g.save(); g.globalAlpha *= .35; g.fillStyle = '#000'; el(g, lerp(CX, 300, sk), 1196, lerp(380, 230, sk), 16); if (sk > 0) el(g, 750, 1196, 170 * sk, 14); g.restore();
      for (i = 0; i < 26; i++) {
        if (i > n) continue;
        var coral = i % 3 === 1 && i < 24, ci = Math.floor(i / 3);
        var k = coral ? eio(seg(t, dif - .05 + ci * .05, dif + .35 + ci * .05)) : sk;
        var below = i - Math.min(8, Math.floor((i + 1) / 3));
        var x0 = CX + jit[i][0], y0 = 1150 - i * 3.2, x1 = coral ? 750 : 296, y1 = 1180 - (coral ? ci : below) * 3.4;
        var x = lerp(x0, x1, k), y = lerp(y0, y1, k) - Math.sin(Math.PI * k) * (coral ? 70 : 0), w = lerp(740, coral ? 340 : 440, k);
        pileSlip(g, x, y, w, 78, jit[i][1] * (1 - k) + (coral ? .03 : -.01) * k, coral && k > .2 ? mixC('#f1e9d8', '#ff5b3d', clamp(k * 2, 0, 1)) : PAPER);
      }
      slip(g, CX, stripY, 740, 80, -.006, fin(t, zr + .15), 'Feynman was born on May 11, 1918, in', 30);
    }
    var ea = fin(t, dif + .35);
    if (ea > 0) {
      slip(g, 296, 1180 - 18 * 3.4 - 6, 440, 78, -.01, ea, 'Queens, New York ×992', 34);
      slip(g, 750, 1180 - 8 * 3.4 - 6, 340, 78, .03, ea, 'New York City ×8', 34, HOT, BG);
      g.save(); g.globalAlpha *= ea; g.strokeStyle = HOT; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(CX, 1042); g.lineTo(320, 1100); g.moveTo(CX, 1042); g.lineTo(730, 1130); g.stroke(); g.restore();
    }
    var c1 = Math.round(seg(qt(t), zr + .15, th + .1) * 10) * 100;
    chip(g, '×' + (c1 >= 1000 ? '1,000' : c1), 780, 1262, { px: 60, wt: 900, bg: CREAM, fg: BG, a: fin(t, zr + .45) * (1 - out80), s: kn(t, th), rot: .05 });
    var c2 = Math.round(seg(qt(t), e80 - .15, e80 + .35) * 8) * 10, ba = fin(t, e80 - .15);
    if (ba > 0) {
      var bs = lerp(1.12, 1, clamp(pop(t, e80 - .15, 3.2), 0, 1)) * kn(t, wend('eighty', 'answers'));
      g.save(); g.globalAlpha *= ba; g.translate(300, 790); g.scale(bs, bs);
      font(g, 230, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = HOT; g.fillText(String(c2), 0, 8);
      g.restore();
      g.save(); g.globalAlpha *= fin(t, e80 + .05); font(g, 56, 900); wide(g); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
      g.fillText('DIFFERENT', 462, 758); g.fillText('ANSWERS', 462, 824); g.restore();
    }
    label(g, 'OUT OF 1,000 RUNS', CX, 920, fin(t, dif), CREAM, 40, 'center', true);
    chip(g, 'SAME FACT · DIFFERENT WORDS', CX, 1262, { px: 40, wt: 900, bg: CREAM, fg: BG, a: fin(t, dif + .2), s: kn(t, dif + .6), maxw: 800 });
    chip(g, 'SERVER LOAD CHANGES ROUNDING', CX, 1338, { px: 38, wt: 900, bg: 'rgba(21,19,27,.92)', fg: CREAM, line: CREAM, lw: 3, shadow: false, a: fin(t, at('eighty', 'answers') - .6), s: kn(t, rnd), maxw: 820 });
    chip(g, 'TOKEN 103 · THINKING MACHINES LAB, SEP 2025', CX, 1412, { px: 32, wt: 600, fg: CREAM, a: fin(t, lb + .1), maxw: 820, shadow: false });
  }

  /* =====================================================================================================
     SCENE 5 · end: the two phones again, both still typing (the picture doesn't answer); YES / NO; sources
     ===================================================================================================== */
  function endScene(g, t) {
    var s0 = S('end').t0, tw = at('end', 'twice'), ys = at('end', 'yes'), no = at('end', 'no');
    phones(g, t, 'end');
    var oa = 1 - eio(seg(t, HOME - .1, HOME + .2));
    chip(g, 'TWICE', CX, 1010, { px: 70, wt: 900, bg: CREAM, fg: BG, a: fin(t, tw - .05) * oa, s: lerp(1.2, 1, clamp(pop(t, tw - .05, 3.2), 0, 1)), rot: -.04 });
    chip(g, 'YES', 380, 1200, { px: 70, wt: 900, bg: CREAM, fg: BG, a: fin(t, ys - .08) * oa, s: lerp(1.25, 1, clamp(pop(t, ys - .08, 3.2), 0, 1)), w: 200, r: 50 });
    chip(g, 'NO', 640, 1200, { px: 70, wt: 900, bg: CREAM, fg: BG, a: fin(t, no - .08) * oa, s: lerp(1.25, 1, clamp(pop(t, no - .08, 3.2), 0, 1)), w: 200, r: 50 });
    block(g, ['OpenAI API · Holtzman et al., ICLR 2020', 'Thinking Machines Lab 2025 · Hinton 2015'], CX, 1406, 30, fin(t, s0 + .3) * oa, true, CREAM, 500);
  }

  /* ---------- captions: the narrator's words, one block at a time; only stressed words get the coral pill ---------- */
  var CAPBRK = { zero: ['asked'] };
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'ask') return;   /* frame 0 is the phones (4 words); the search phrase is the headline */
      var brk = (CAPBRK[l.id] || []).slice(), cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        if (cur.length && brk.length && norm(w.w) === brk[0]) { out.push(cur); cur = []; brk.shift(); }
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { out.push(cur); cur = []; }
      });
      if (cur.length) out.push(cur);
    });
    return out.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS = [['ask', 'why'], ['ask', 'different'], ['dice', 'trick'], ['dice', 'dice'], ['dice', 'purpose'], ['odds', 'odds'], ['odds', '60%'],
    ['weighted', 'weighted'], ['weighted', 'mushrooms'], ['dial', 'temperature'], ['down', 'down'], ['down', 'almost'], ['up', 'up'], ['up', 'chance'],
    ['why', 'always'], ['stuck', 'tried'], ['stuck', 'stuck'], ['zero', 'zero'], ['zero', '1000'], ['eighty', '80'], ['eighty', 'differently'],
    ['end', 'twice'], ['end', 'yes'], ['end', 'no']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  /* captions never draw over a cut */
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE - .14, sc.t0 - SWIPE) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, those: 1 };
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .06), out = 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - card0.t0 + .04, 3.2, .8), 0, 1.04);
    g.save(); g.font = '800 74px Archivo'; wide(g);
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 22;
    var lines, lw, maxw = 780, cpx = 74;
    function lay() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; }); }
    function fixLines() {
      for (var L = 0; L < lines.length - 1; L++) {
        var last = lines[L][lines[L].length - 1];
        while (lines[L].length > 1 && GLUE[norm(words[last].w)]) { lines[L].pop(); lines[L + 1].unshift(last); last = lines[L][lines[L].length - 1]; }
      }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw) && cpx > 52) { cpx -= 4; g.font = '800 ' + cpx + 'px Archivo'; wide(g); ws = words.map(function (w) { return g.measureText(w.w).width; }); gap = cpx * .28; lay(); fixLines(); }
    var lh = cpx * 1.18, y0 = 380 - (lines.length - 1) * lh / 2;
    g.globalAlpha = fi * out * wipeHide(t) * (alpha == null ? 1 : alpha);
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 40;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 12, y - cpx * .87, ws[i] + 24, cpx * 1.15, 18); g.fill(); }
        g.fillStyle = cur ? BG : CREAM;
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SCENES = { hook: hookScene, die: dieScene, stuck: stuckScene, lab: labScene, end: endScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) {
    g.save();
    if (Sc.fn !== 'hook' && Sc.fn !== 'end') { var push = 1 + .015 * seg(t, Sc.t0, Sc.t1); g.translate(CX, 1000); g.scale(push, push); g.translate(-CX, -1000); }
    SCENES[Sc.fn](g, t);
    g.restore();
  }
  /* the cut: the house torn-paper edge rising from the bottom, the next scene drawn under it */
  function edgeY(x, ly, t) { var i = Math.round(x / 30); return ly + (i % 2 ? -10 : 8) + Math.sin(x * .013 + t * 5) * 4; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    var sk = Nx && Nx.swipe ? eio(seg(t, Nx.t0 - SWIPE, Nx.t0)) : 0;
    var pre = Sc.swipe && t < Sc.t0 + PRE;
    drawScene(g, Sc, pre ? Sc.t0 + PRE : t);
    if (sk > 0) {
      var ly = H * (1 - sk) - 20, x;
      g.save(); g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; drawScene(g, Nx, Nx.t0 + PRE); INCOMING = false; g.restore();
      g.save(); g.strokeStyle = HOT; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); for (x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t); if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); g.restore();
    }
    /* the loop: the end dissolves back into frame 0 */
    var back = eio(seg(t, HOME, HOME + .35));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g); hookIdle(g, t - DUR); g.restore(); }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) {
      if (t < start('dice') + .1) headline(g, t);
      captions(g, t, back > 0 ? 1 - back : 1);
    }
    if (!POSTERMODE) {
      g.fillStyle = 'rgba(244,237,224,.12)'; g.fillRect(90, 222, 840, 6);
      g.fillStyle = HOT; g.fillRect(90, 222, 840 * (back > 0 ? 1 - back : t / DUR), 6);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false;
  function posterTitle(g) {
    g.save(); font(g, 76, 800); wide(g); g.textBaseline = 'alphabetic';
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText('Why ChatGPT gives', CX, 300);
    var b = 'different answers', wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 14, 400 - 70, wb + 28, 96, 16); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 400); g.restore();
  }
  /* a text at height y stays readable until the torn edge rising from the bottom reaches it */
  function cutY(id, y) {
    var sc = S(id), need = 1 - (y + 60) / H, u = 0;
    while (u < 1 && eio(u) < need) u += .01;
    return sc.t0 - SWIPE + SWIPE * u;
  }
  function TEXTS(t) {
    var out = [];
    function T(id, text, a, b) { if (t >= a && t < b) out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    T('head', 'WHY DOES CHATGPT GIVE DIFFERENT ANSWERS?', HEADT + .2, start('dice') - .1);
    T('q', 'Best pizza topping?', 0, start('dice') - SWIPE);
    T('purpose', 'ON PURPOSE', at('dice', 'on') + .05, start('odds') + .6);
    T('question', 'BEST PIZZA TOPPING?', at('odds', 'best') + .1, cutY('stuck', 545));
    T('example', 'EXAMPLE ODDS', at('odds', 'odds') + .55, cutY('stuck', 832));
    T('temp', 'TEMPERATURE', at('dial', 'temperature') + .1, cutY('stuck', 1258));
    T('api', 'OPENAI API: 0–2 · DEFAULT 1', KIN() + .5, at('down', 'down') + .45);
    T('low', 'LOW = FOCUSED', at('down', 'down') + .75, at('up', 'up') - .2);
    T('high', 'HIGH = MORE RANDOM', at('up', 'up'), at('why', 'why') - .1);
    T('likeliest', 'ALWAYS THE LIKELIEST WORDS', S('stuck').t0 + .25, cutY('zero', 540));
    T('beam', 'BEAM SEARCH · GPT-2', S('stuck').t0 + .35, cutY('zero', 618));
    T('holtz', 'HOLTZMAN ET AL., ICLR 2020', S('stuck').t0 + .15, cutY('zero', 1216));
    T('t0', 'TEMPERATURE 0', S('zero').t0 + .2, cutY('end', 540));
    T('qwen', 'OPEN MODEL QWEN3', at('zero', 'lab') + .1, cutY('end', 630));
    T('tml', 'TOKEN 103 · THINKING MACHINES LAB, SEP 2025', at('zero', 'lab') + .25, cutY('end', 1412));
    T('prompt', 'Tell me about Richard Feynman', S('zero').t0 + .3, at('eighty', '80') - .2);
    T('80', '80 DIFFERENT ANSWERS', at('eighty', '80') + .35, cutY('end', 824));
    T('runs', 'OUT OF 1,000 RUNS', at('eighty', 'different') + .1, cutY('end', 920));
    T('queens', 'Queens, New York ×992', at('eighty', 'different') + .55, cutY('end', 1120));
    T('nyc', 'New York City ×8', at('eighty', 'different') + .6, cutY('end', 1120));
    T('same', 'SAME FACT · DIFFERENT WORDS', at('eighty', 'different') + .3, cutY('end', 1262));
    T('server', 'SERVER LOAD CHANGES ROUNDING', at('eighty', 'answers') - .5, cutY('end', 1338));
    return out;
  }

  /* ---------- events: the sound design reads the same word times; hits sit between words, never on them ---------- */
  var EV = [], ALLW = [];
  /* the last word of a line is heard longer than vo.js says ("60%." 12.68 in vo.js, 12.84 in the mix): pad it to the line end + 0.15 */
  VO.lines.forEach(function (l) { l.words.forEach(function (w, i) { ALLW.push(i === l.words.length - 1 ? { w: w.w, t0: w.t0, t1: Math.min(Math.max(w.t1, l.t1), w.t1 + .3) + .06 } : w); }); });
  /* a hit's whole body (t … t + body) must sit in a real gap between words: loop until it does. Before the word if the
     gap there holds it, else just after the word ends. */
  /* How far a hit must stay from a word. Whisper hears a word up to 0.12 s from where vo.js puts it, and a noisy or
     sustained sound that close masks the word's edge (the r2 jury heard a rattle swallow "sixty percent"), so those keep
     0.14 s clear. A short quiet transient (a knock, a pop, a tick, a key) rides much closer without touching the words. */
  var WIDE = { rattle: 1, swish: 1, sweep: 1, paper: 1, slap: 1, stamp: 1, stampS: 1, clack: 1 };
  function mg(type) { return WIDE[type] ? [.16, .14] : [.14, .1]; }
  var BODY = { stamp: .2, stampS: .16, slap: .16, clack: .2, thump: .16, knock: .15, rattle: .12, paper: .17, swish: .28, pop: .12, tick: .04, key: .04 };
  function gapT(t, body, type) {
    var M = mg(type), MG0 = M[0], MG1 = M[1];
    for (var guard = 0; guard < 40; guard++) {
      var hit = -1;
      for (var i = 0; i < ALLW.length; i++) { var w = ALLW[i]; if (t < w.t1 + MG1 && t + body > w.t0 - MG0) { hit = i; break; } }
      if (hit < 0) return t;
      var wd = ALLW[hit], prevEnd = hit > 0 ? ALLW[hit - 1].t1 : -1, before = wd.t0 - MG0 - body;
      t = (before >= prevEnd + MG1 && before >= 0) ? before : wd.t1 + MG1;
    }
    return t;
  }
  function E(o) { o.t = gapT(o.t, BODY[o.type] || (o.t1 ? .08 : .12), o.type); EV.push(o); }
  /* a hit that can't find a gap within 0.25 s of its picture stays silent (rolls inside fast speech) */
  function Ed(o, tol) { var t0 = o.t, t = gapT(o.t, BODY[o.type] || .12, o.type); if (Math.abs(t - t0) <= (tol || .25) + .08) { o.t = t; EV.push(o); } }
  /* a sound that must stay inside one gap between words (a cut's sweep): clip it to the gap, or drop it */
  function gapSpan(a, b) {
    var MG0 = .15, MG1 = .14;
    for (var i = 0; i < ALLW.length; i++) { var w = ALLW[i]; if (w.t1 + MG1 > a && w.t0 - MG0 < b) { if (w.t0 - MG0 - a >= .12) b = w.t0 - MG0; else a = w.t1 + MG1; } }
    return b - a >= .1 ? [a, b] : null;
  }
  /* a burst of the same sound: the first hit finds a gap, the rest follow it at `step` for as long as they stay free */
  function burst(ts, type, g, tol, step) {
    var last = -9;
    ts.forEach(function (t0) {
      var t = gapT(t0, BODY[type] || .12, type);
      if (Math.abs(t - t0) > tol) return;
      if (t - last < (step || .07)) t = last + (step || .07);
      if (gapT(t, BODY[type] || .12, type) !== t) return;
      EV.push({ t: t, type: type, g: g }); last = t;
    });
  }
  function initTimes() {
    var i;
    /* hook: the ≠ stamp lands before the first word and quieter than it; the right phone's keys only in gaps */
    E({ t: 0, type: 'stampS', g: .3 }); Ed({ t: .4, type: 'tick', g: .2 }, .3);
    (function () { var ts = []; for (var j = 0; j < 10; j++) ts.push(TY0 + j * .07); burst(ts, 'key', null, .3, .07); })();
    Ed({ t: at('hook', 'different') - .08, type: 'pop', g: .6 }, .3);
    Ed({ t: at('ask', 'why') - .12, type: 'stampS', g: .45 }, .3);
    /* cuts: a dial sweep, inside the gap only */
    SC.forEach(function (sc) { if (sc.swipe) { var s = gapSpan(sc.t0 - SWIPE, sc.t0); if (s) EV.push({ t: s[0], type: 'sweep', t1: s[1] }); } });
    /* the die: a rattle while it tumbles, a wooden knock when it lands */
    ROLLS.forEach(function (r, k) {
      if (k > 0) Ed({ t: r.t0 + .03, type: 'rattle', g: .5 }, .12);
      Ed({ t: r.land - .02, type: 'knock', g: k === 0 ? 1 : .7 }, k === 0 ? .5 : .3);
    });
    Ed({ t: at('dice', 'on') - .08, type: 'stampS', g: .5 }, .3);
    /* odds: the bars rise, EXAMPLE ODDS */
    Ed({ t: at('odds', 'odds') - .1, type: 'swish' }, .3);
    for (i = 0; i < 3; i++) Ed({ t: at('odds', 'odds') - .05 + i * .45, type: 'tick', g: .25 }, .25);
    Ed({ t: end('odds') + .17, type: 'pop', g: .7 }, .3);
    /* dial: the knob slides in; ratchet ticks while it turns, only in real gaps */
    Ed({ t: KIN() + .05, type: 'slap' }, .3);
    burst([0, 1, 2, 3].map(function (j) { return wend('dial', 'dial') - .05 + j * .04; }), 'tick', .12, .25, .045);
    [[at('down', 'down') - .05, 8], [at('up', 'up') - .05, 12], [at('why', 'why') - .1, 9]].forEach(function (s) {
      var ts = []; for (var j = 0; j < s[1]; j++) ts.push(s[0] + j * .035); burst(ts, 'tick', .14, .25, .04);
    });
    Ed({ t: at('why', 'favorite') - .1, type: 'stampS', g: .45 }, .3);
    /* stuck: the printer chatters per line (gaps only), the bracket, STUCK */
    burst(printTimes().map(function (p) { return p.t; }), 'key', null, .6, .075);
    Ed({ t: at('stuck', 'tried') - .1, type: 'pop', g: .6 }, .3); Ed({ t: at('stuck', 'stuck') - .1, type: 'stampS', g: .55 }, .3);
    /* lab: the conditions, the prompt slip, the pile, the 80, the fork */
    Ed({ t: at('zero', 'zero') - .1, type: 'pop', g: .7 }, .3); Ed({ t: at('zero', 'lab') - .1, type: 'pop', g: .5 }, .3); Ed({ t: S('zero').t0 + .05, type: 'pop', g: .5 }, .3); Ed({ t: at('zero', 'zero') + .05, type: 'paper' }, .3);
    (function () { var ts = []; for (var j = 0; j < 10; j++) ts.push(at('zero', 'zero') + .3 + j * .15); burst(ts, 'paper', .5, .5, .19); })();
    Ed({ t: at('eighty', '80') - .12, type: 'slap' }, .3); Ed({ t: at('eighty', 'different') - .05, type: 'pop', g: .6 }, .3); Ed({ t: at('eighty', 'busy') - .38, type: 'pop', g: .5 }, .25);
    /* end */
    Ed({ t: S('end').t0 + .02, type: 'paper', g: .6 }, .3); Ed({ t: at('end', 'yes') - .32, type: 'pop', g: .7 }, .3); Ed({ t: at('end', 'no') - .1, type: 'pop', g: .8 }, .3);
    E({ t: HOME - .1, type: 'swish' });
    /* hits moved into the same gap pile up: keep one per 60 ms of the same kind */
    EV.sort(function (a, b) { return a.t - b.t; });
    for (i = EV.length - 1; i > 0; i--) if (EV[i].type === EV[i - 1].type && EV[i].t - EV[i - 1].t < .06) EV.splice(i, 1);
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

  /* ---------- sound: foley cut to the word times; no music (Isac adds a TikTok sound) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.1), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .16; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }

    function tickS(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .22], [t + .025, 0]]); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .16, 1, [[t, 0], [t + .004, g || .4], [t + .14, 0]], .03); o.frequency.exponentialRampToValueAtTime(60, t + .12); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t, t + .26, 900, 5200, .12, .02, 1.6); }
    function stampShort(t, g) { var o = osc('sine', 150, t, t + .16, 1, [[t, 0], [t + .004, g || .4], [t + .14, 0]], .05); o.frequency.exponentialRampToValueAtTime(60, t + .12); tickS(t + .005, .14); }
    function paper(t, g) { g = g || 1; band(t, t + .15, 1800, 3800, .07 * g, .02, 1.2, (rnd() - .5) * .8); tickS(t + .12, .08 * g); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function slap(t) { thump(t, .45); var n = noise(t, .1), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 900; var o = bus(1, .15); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .3], [t + .08, 0]]); }
    function key(t) { tickS(t, .2); osc('sine', 1900, t, t + .03, 1, [[t, 0], [t + .002, .025], [t + .025, 0]]); }
    /* the die: a hollow wooden knock (two damped partials and a click), and a short rattle of little knocks */
    function knockS(t, g) {
      g = g || 1;
      osc('sine', 420, t, t + .14, 1, [[t, 0], [t + .002, .22 * g], [t + .1, 0]], .08).frequency.exponentialRampToValueAtTime(300, t + .1);
      osc('sine', 1180, t, t + .07, 1, [[t, 0], [t + .002, .08 * g], [t + .05, 0]], .05);
      thump(t, .22 * g); tickS(t, .22 * g);
    }
    function rattle(t, g) { for (var j = 0; j < 3; j++) { var tt = t + j * .035 + rnd() * .01; osc('sine', 900 + rnd() * 500, tt, tt + .03, 1, [[tt, 0], [tt + .002, .05 * (g || 1)], [tt + .025, 0]], .05); tickS(tt, .08 * (g || 1)); } }
    /* the dial sweep: a soft rising whoosh with a ratchet inside it */
    function sweepS(t, t1) { band(t, t1 + .03, 600, 3000, .07, .04, 1.6); var n = Math.max(2, Math.round((t1 - t) / .04)); for (var j = 0; j < n; j++) tickS(t + (t1 - t) * (j + .5) / n, .06); }
    EV.forEach(function (e) {
      if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'thump') thump(e.t, e.g);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'stampS') stampShort(e.t, e.g);
      else if (e.type === 'paper') paper(e.t, e.g);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'slap') slap(e.t);
      else if (e.type === 'key') key(e.t);
      else if (e.type === 'knock') knockS(e.t, e.g);
      else if (e.type === 'rattle') rattle(e.t, e.g);
      else if (e.type === 'sweep') sweepS(e.t, e.t1);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −50 dB, so the loop seam is never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .021; })();
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”·→…#?‹✓✕–óé'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initRolls();
  initTimes();
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: at('up', 'chance') + .35, SLUG: 'temperature', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  /* full pass of the safe-area check: every glyph box (and stamp) outside x 90–930 or below y 1450 */
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
