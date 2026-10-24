/* "FYP" — how the TikTok algorithm picks your next video. Factory #6 on Tech, explained, after ../noise/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t. Contract: window.FILM,
   DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). The native move is the swipe: inside the phone a card swipes up to the
   next one, and the scene cuts are the same swipe on the whole stage (the next scene is already drawn under it).
   Everything is hand-built: a generic drawn phone (no TikTok logo, no real interface), drawn video cards, a casino chip,
   a stopwatch, a re-created paper page. Facts: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur;
  var BG = '#15131b', CREAM = '#f4ede0', DIM = 'rgba(244,237,224,.5)', FAINT = 'rgba(244,237,224,.14)';
  var HOT = '#ff5b3d', YEL = '#ffc83d';
  var PAPER = '#f1e9d8', INK = '#211d26', REDINK = '#d8332b', TAN = '#c98f4e', ORANGE = '#e8913f';
  var BODY = '#2d2937', BODY2 = '#3d3849';
  var DISP = 'Archivo', MONO = '"Geist Mono"';

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function ss(k) { return k * k * (3 - 2 * k); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
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

  /* scenes. swipe:true = the whole stage swipes up into this scene (the native move as the cut) */
  var SC = [
    { id: 'hook', fn: 'feed', name: 'The bet', t0: 0 },
    { id: 'clue', fn: 'feed', name: 'Every swipe', t0: start('clue') - .05 },
    { id: 'linger', fn: 'feed', name: 'Linger', t0: start('linger') - .15 },
    { id: 'strong', fn: 'feed', name: 'Strong sign', t0: start('strong') - .1 },
    { id: 'turn', fn: 'crowd', name: 'Not just you', t0: start('turn') - .1 },
    { id: 'stranger', fn: 'crowd', name: 'A stranger', t0: start('stranger') - .15 },
    { id: 'helped', fn: 'crowd', name: 'Your feed', t0: start('helped') - .25 },
    { id: 'doc', fn: 'doc', name: 'The guide', t0: at('doc', 'in') + .42, swipe: true },
    { id: 'end', fn: 'end', name: 'Yes or no', t0: at('end', 'did') - .05, swipe: true }
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
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    font(g, px, o.wt, o.fam); ls(g, o.ls || 0);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad, w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore(); ls(g, 0);
    return w;
  }
  /* a label: mono, ≥ 36 px unless asked smaller (small print ≥ 30), optional ink plate */
  function label(g, text, x, y, a, col, px, align, plate) {
    px = Math.max(30, px || 36);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); ls(g, 3); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    while (g.measureText(text).width > 760 && px > 30) { px--; font(g, px, 500, MONO); }
    var dy = (1 - Math.min(1, a)) * 14;
    if (plate) {
      var w = g.measureText(text).width, x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
      rr(g, x0 - 18, y - px * .78 + dy, w + 36, px * 1.56, 12); g.fillStyle = 'rgba(21,19,27,.92)'; g.fill();
    }
    g.fillStyle = col || CREAM;
    g.fillText(text, x, y + dy); g.restore();
  }
  function block(g, lines, x, y, px, a, plate, col, wt) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 500, MONO); ls(g, 0); g.textAlign = 'center'; g.textBaseline = 'middle';
    var lh = px * 1.3, w = 0; lines.forEach(function (l) { w = Math.max(w, g.measureText(l).width); });
    var y0 = y - (lines.length - 1) * lh / 2;
    if (plate) { rr(g, x - w / 2 - 20, y0 - lh / 2 - 8, w + 40, lh * lines.length + 16, 14); g.fillStyle = 'rgba(21,19,27,.92)'; g.fill(); }
    g.fillStyle = col || CREAM; lines.forEach(function (l, i) { g.fillText(l, x, y0 + i * lh); });
    g.restore();
  }
  function tickMark(g, x, y, s, col, a, lw) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.strokeStyle = col || HOT; g.lineWidth = lw || 10; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-20, 0); g.lineTo(-6, 15); g.lineTo(22, -16); g.stroke(); g.restore();
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

  /* ---------- rubber stamps: worn ink (seeded speckle), slammed, on a paper backing ---------- */
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

  /* =====================================================================================================
     PROPS. The video cards (drawn, flat), the phone (generic: a body, a notch, a vertical card with a bar),
     the casino chip, the stopwatch, a thumb.
     ===================================================================================================== */
  /* the cat and the dog from Noise, smaller here: one sitting pose, one coral collar */
  function drawPet(g, x, y, s, kind, fill) {
    var dog = kind === 'dog'; fill = fill || CREAM;
    g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
    g.fillStyle = 'rgba(0,0,0,.18)'; el(g, 12, 4, 215, 26);
    g.strokeStyle = fill; g.lineWidth = 46; g.beginPath();
    if (dog) { g.moveTo(120, -40); g.bezierCurveTo(232, -70, 272, -190, 244, -292); }
    else { g.moveTo(110, -20); g.bezierCurveTo(272, -10, 302, -172, 214, -238); }
    g.stroke();
    g.fillStyle = fill; g.beginPath(); g.moveTo(-78, -330); g.bezierCurveTo(-160, -300, -195, -130, -178, -24); g.quadraticCurveTo(-172, 0, -140, 0);
    g.lineTo(140, 0); g.quadraticCurveTo(172, 0, 178, -24); g.bezierCurveTo(195, -130, 160, -300, 78, -330); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.5)'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(-48, -190); g.lineTo(-52, -10); g.moveTo(48, -190); g.lineTo(52, -10); g.stroke();
    if (!dog) {
      g.fillStyle = fill; tri(g, -124, -452, -106, -586, -28, -515); tri(g, 124, -452, 106, -586, 28, -515);
      g.fillStyle = '#e7b4a4'; tri(g, -104, -472, -97, -550, -54, -511); tri(g, 104, -472, 97, -550, 54, -511);
    }
    g.fillStyle = fill; el(g, 0, -425, dog ? 122 : 128, dog ? 112 : 106);
    g.fillStyle = INK; g.strokeStyle = INK;
    if (dog) {
      g.fillStyle = TAN; el(g, -124, -400, 46, 102, .3); el(g, 124, -400, 46, 102, -.3);
      g.fillStyle = '#fffaf0'; el(g, 0, -370, 74, 56);
      g.fillStyle = INK; el(g, 0, -398, 29, 20); el(g, -50, -452, 16, 17); el(g, 52, -452, 16, 17);
    } else {
      g.fillStyle = '#86bf5e'; el(g, -50, -438, 23, 27, .12); el(g, 50, -438, 23, 27, -.12);
      g.fillStyle = INK; el(g, -50, -438, 6, 22); el(g, 50, -438, 6, 22);
      g.fillStyle = HOT; tri(g, -15, -394, 15, -394, 0, -377);
    }
    g.strokeStyle = HOT; g.lineWidth = 26; g.beginPath(); g.ellipse(0, -330, 86, 26, 0, .15, Math.PI - .15); g.stroke();
    g.fillStyle = YEL; el(g, 0, -296, 16, 16);
    g.restore();
  }
  /* video subjects: 0 cat, 1 dog, 2 house, 3 tree, 4 car, 5 boat, 6 flower, 7 mountains */
  var CARDC = ['#9cc5d9', '#e9d4a6', '#b9d7a0', '#f0c0a8', '#d4c3e8', '#a8d8c8', '#f3e1a0', '#e8b7c4'];
  function icon(g, i, s, t) {
    g.save(); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
    var k = ((i % 8) + 8) % 8, wob = Math.sin((t || 0) * 2.2 + i) * 6;
    if (k === 0) drawPet(g, 0, 150, .5, 'cat', ORANGE);
    else if (k === 1) drawPet(g, 0, 150, .5, 'dog', '#f7f0e2');
    else if (k === 2) { g.fillStyle = '#f7f0e2'; g.fillRect(-90, -20, 180, 140); g.fillStyle = REDINK; tri(g, -115, -15, 115, -15, 0, -120); g.fillStyle = '#6e4429'; g.fillRect(-25, 50, 50, 70); g.fillStyle = YEL; g.fillRect(40, 10, 34, 30); }
    else if (k === 3) { g.fillStyle = '#6e4429'; g.fillRect(-18, 20, 36, 100); g.fillStyle = '#4f8a3c'; el(g, wob * .4, -30, 100, 95); }
    else if (k === 4) { g.save(); g.translate(wob * 2, 0); g.fillStyle = '#3450c4'; rr(g, -130, -10, 260, 80, 22); g.fill(); rr(g, -70, -70, 130, 70, 20); g.fill(); g.fillStyle = INK; el(g, -75, 75, 30, 30); el(g, 75, 75, 30, 30); g.restore(); }
    else if (k === 5) { g.save(); g.translate(0, wob * .6); g.rotate(wob * .006); g.fillStyle = '#6e4429'; g.beginPath(); g.moveTo(-130, 40); g.lineTo(130, 40); g.lineTo(95, 100); g.lineTo(-95, 100); g.closePath(); g.fill(); g.fillStyle = '#f7f0e2'; tri(g, -5, 30, -5, -130, 95, 30); g.restore(); g.fillStyle = 'rgba(52,80,196,.35)'; g.fillRect(-170, 100, 340, 30); }
    else if (k === 6) { g.strokeStyle = '#4f8a3c'; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 120); g.stroke(); g.save(); g.translate(0, -40); g.rotate(wob * .02); g.fillStyle = REDINK; for (var p = 0; p < 6; p++) el(g, Math.cos(p * 1.047) * 45, Math.sin(p * 1.047) * 45, 34, 34); g.fillStyle = YEL; el(g, 0, 0, 28, 28); g.restore(); }
    else { g.fillStyle = '#5a5d68'; tri(g, -150, 110, -30, -90, 90, 110); g.fillStyle = '#7d808c'; tri(g, -20, 110, 70, -40, 160, 110); g.fillStyle = '#f7f0e2'; tri(g, -30, -90, -58, -44, -2, -44); g.fillStyle = YEL; el(g, 100 + wob, -80, 30, 30); }
    g.restore();
  }
  /* a video filling a screen of sw × sh (origin at the screen centre); prog = how far it has played */
  function video(g, sw, sh, id, prog, t, o) {
    o = o || {};
    g.fillStyle = CARDC[((id % 8) + 8) % 8]; g.fillRect(-sw / 2, -sh / 2, sw, sh);
    g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(-sw / 2, sh * .14, sw, sh * .36);
    g.save(); g.translate(0, -sh * .04); icon(g, id, sw / 380, t); g.restore();
    if (o.bar !== false) {
      var by = sh / 2 - (o.barY || 46), bw = sw - 64;
      g.fillStyle = 'rgba(33,29,38,.25)'; rr(g, -bw / 2, by - 6, bw, 12, 6); g.fill();
      g.fillStyle = HOT; rr(g, -bw / 2, by - 6, Math.max(12, bw * clamp(prog, 0, 1)), 12, 6); g.fill();
    }
  }
  var PW = 560, PH = 1160, SW = PW - 44, SH = PH - 44;
  /* the phone; scr(g, sw, sh) draws the screen with its origin at the screen centre, clipped */
  function phone(g, x, y, s, rot, a, scr, o) {
    if (a <= 0 || s <= 0) return;
    o = o || {};
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -PW / 2 + 16, -PH / 2 + 26, PW, PH, 80); g.fill();
    g.fillStyle = BODY2; rr(g, PW / 2 - 6, -PH / 2 + 250, 16, 130, 6); g.fill(); rr(g, -PW / 2 - 10, -PH / 2 + 220, 16, 90, 6); g.fill();
    g.fillStyle = BODY; rr(g, -PW / 2, -PH / 2, PW, PH, 80); g.fill();
    g.strokeStyle = o.ring || 'rgba(244,237,224,.22)'; g.lineWidth = o.ring ? 14 / Math.max(s, .2) * .5 : 5; rr(g, -PW / 2, -PH / 2, PW, PH, 80); g.stroke();
    g.save(); rr(g, -SW / 2, -SH / 2, SW, SH, 60); g.clip(); g.fillStyle = '#0f0e13'; g.fillRect(-SW / 2, -SH / 2, SW, SH);
    if (scr) scr(g, SW, SH);
    g.restore();
    g.fillStyle = BODY; rr(g, -66, -SH / 2 + 18, 132, 36, 18); g.fill();
    if (o.after) o.after(g);
    g.restore();
  }
  /* the casino chip: coral, cream edge inserts, an inner ring (no words on it) */
  function casino(g, x, y, r, rot, a, s) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s || 1, s || 1);
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, r * .1, r * .2, r, r);
    g.fillStyle = '#b8381f'; el(g, 0, r * .1, r, r);
    g.rotate(rot || 0);
    g.fillStyle = HOT; el(g, 0, 0, r, r);
    g.fillStyle = CREAM; for (var i = 0; i < 8; i++) { g.save(); g.rotate(i * Math.PI / 4); rr(g, -r * .13, -r, r * .26, r * .24, r * .04); g.fill(); g.restore(); }
    g.strokeStyle = CREAM; g.lineWidth = r * .06; g.setLineDash([r * .18, r * .12]); g.beginPath(); g.arc(0, 0, r * .66, 0, 6.283); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#e94a2d'; el(g, 0, 0, r * .52, r * .52);
    g.fillStyle = CREAM; g.beginPath(); g.moveTo(0, -r * .3); g.lineTo(r * .26, 0); g.lineTo(0, r * .3); g.lineTo(-r * .26, 0); g.closePath(); g.fill();
    g.restore();
  }
  function stopwatch(g, x, y, r, secs, a, s) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s || 1, s || 1);
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 8, 14, r, r);
    g.fillStyle = '#b9bcc6'; rr(g, -r * .2, -r * 1.32, r * .4, r * .3, 8); g.fill(); g.fillRect(-r * .08, -r * 1.06, r * .16, r * .12);
    g.fillStyle = CREAM; el(g, 0, 0, r, r); g.strokeStyle = BODY; g.lineWidth = r * .1; g.beginPath(); g.arc(0, 0, r * .95, 0, 6.283); g.stroke();
    g.strokeStyle = INK; g.lineWidth = 4; for (var i = 0; i < 12; i++) { var an = i * Math.PI / 6; g.beginPath(); g.moveTo(Math.sin(an) * r * .72, -Math.cos(an) * r * .72); g.lineTo(Math.sin(an) * r * .84, -Math.cos(an) * r * .84); g.stroke(); }
    var hand = secs * Math.PI / 30 * 5;
    g.strokeStyle = HOT; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(hand) * r * .7, -Math.cos(hand) * r * .7); g.stroke();
    g.fillStyle = HOT; el(g, 0, 0, 10, 10);
    g.restore();
  }
  function thumb(g, x, y, s, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.rotate(-.35);
    g.fillStyle = 'rgba(0,0,0,.28)'; rr(g, -48 + 14, -40 + 18, 96, 300, 48); g.fill();
    g.fillStyle = '#e2b48f'; rr(g, -48, -40, 96, 300, 48); g.fill();
    g.fillStyle = '#f3d2b8'; rr(g, -30, -26, 60, 70, 26); g.fill();
    g.strokeStyle = 'rgba(110,68,41,.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-30, 100); g.quadraticCurveTo(0, 112, 30, 100); g.stroke();
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · hook + know + clue + linger + strong: one phone, the chip bet, then your own thumb's clues
     ===================================================================================================== */
  var CHIP_T = 1.6;
  var CH0 = [150, -420], CHL = [158, -60];          /* the chip's start and landing spot, phone-local */
  function chipLand() { return .6; }
  function chipPos(t, idle) {
    var tl = chipLand();
    var u = idle ? clamp(idle / tl, 0, 1) : seg(t, 0, tl);
    if (!idle && t > S('end').t0) { var back = eio(seg(t, HOME - .5, HOME)); u = 1 - back; }
    var e = 1 - Math.pow(1 - u, 2.2);
    return { x: lerp(CH0[0], CHL[0], e), y: lerp(CH0[1], CHL[1], e) - Math.sin(u * Math.PI) * 120, rot: (1 - e) * 5.2, s: 1 + (1 - e) * .15 };
  }
  /* this video, in the phone: the cat video, and on "this" a THIS VIDEO tag (frame 0 itself keeps 4 words) */
  function thisScreen(depth, t, tagA) {
    return function (g, sw, sh) {
      video(g, sw, sh, 0, (t * .4 % 1 + 1) % 1, t);
      if (tagA > 0) chip(g, 'THIS VIDEO', 0, -sh / 2 + 190, { px: 56, wt: 900, bg: BG, fg: CREAM, a: tagA, s: lerp(1.25, 1, clamp(tagA, 0, 1)) });
    };
  }
  /* the in-phone feed: each entry swipes up into view at t over sw seconds */
  var FEED = [];
  function feedAt(t) {
    var i = 0; for (var j = 0; j < FEED.length; j++) if (t >= FEED[j].t) i = j;
    return i;
  }
  function feedCard(g, sw, sh, f, t) {
    if (f.id === 'this') { thisScreen(0, t, pop(t, chipLand() - .02, 3) * kn(t, at('hook', 'this')))(g, sw, sh); return; }
    video(g, sw, sh, f.id, f.prog ? f.prog(t) : 0, t);
    if (f.over) f.over(g, sw, sh, t);
  }
  function feedScreen(t) {
    return function (g, sw, sh) {
      var i = feedAt(t), f = FEED[i], k = i > 0 ? eio(seg(t, f.t, f.t + f.sw)) : 1;
      if (k < 1) { g.save(); g.translate(0, -sh * k); feedCard(g, sw, sh, FEED[i - 1], t); g.restore(); g.save(); g.translate(0, sh * (1 - k)); feedCard(g, sw, sh, f, t); g.restore(); }
      else feedCard(g, sw, sh, f, t);
    };
  }
  /* the phone's camera: frame 0 close up, then it settles left for the clues */
  var PZ = { x: 540, y: 1330, s: 1.5 }, PL = { x: 372, y: 1040, s: .76 };
  function phoneCam(t) {
    var k = eio(seg(t, at('know', 'so') - .15, at('know', 'algorithm') + .25));
    return { x: lerp(PZ.x, PL.x, k), y: lerp(PZ.y - Math.min(t, 2) * 8, PL.y, k), s: lerp(PZ.s, PL.s, k), rot: lerp(-.025 + Math.sin(t * 1.4) * .008, Math.sin(t * 1.1) * .006, k), k: k };
  }
  /* the SIGNALS strip: one tally per clue, dropping in from above */
  var TALLY = [];
  var STRIP = { x: 782, w: 252, top: 670, bot: 1440 };
  function signals(g, t, a) {
    if (a <= 0) return;
    var ox = (1 - a) * 40;
    g.save(); g.translate(ox, 0); g.globalAlpha *= clamp(a, 0, 1);
    rr(g, STRIP.x - STRIP.w / 2 - 12, STRIP.top + 44, STRIP.w + 24, STRIP.bot - STRIP.top - 30, 22); g.fillStyle = 'rgba(244,237,224,.06)'; g.fill();
    g.strokeStyle = 'rgba(244,237,224,.22)'; g.lineWidth = 3; g.setLineDash([12, 10]); g.stroke(); g.setLineDash([]);
    label(g, 'SIGNALS', STRIP.x, STRIP.top, 1, CREAM, 40);
    var y = STRIP.bot;
    TALLY.forEach(function (d) {
      var h = d.big ? 150 : 84, k = sp(t, d.t, 3.2, .85), ka = clamp(k * 3, 0, 1);
      y -= h; var yy = y + h / 2 - (1 - Math.min(1, k)) * 120;
      if (t >= d.t) {
        g.save(); g.globalAlpha *= ka; g.translate(STRIP.x, yy); var s = 1 + (d.knock ? Math.max(0, knock(t, d.knock(t), 16, 6)) * .08 : 0); g.scale(s, s);
        recBox(g, -STRIP.w / 2, -h / 2 + 6, STRIP.w / 2, h / 2 - 6, '[tally] ' + d.text);
        rr(g, -STRIP.w / 2 + 5, -h / 2 + 12, STRIP.w, h - 12, 16); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
        rr(g, -STRIP.w / 2, -h / 2 + 6, STRIP.w, h - 12, 16);
        if (d.outline) { g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke(); g.fillStyle = 'rgba(21,19,27,.9)'; g.fill(); g.stroke(); }
        else { g.fillStyle = d.big ? HOT : '#ff8a6d'; if (d.big) g.fillStyle = HOT; g.fill(); }
        var txt = typeof d.text === 'function' ? d.text(t) : d.text;
        font(g, d.big ? 50 : 38, 700, MONO); ls(g, 2); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = d.outline ? CREAM : BG;
        g.fillText(txt, 0, d.big ? -22 : 2);
        if (d.big) { font(g, 30, 600, MONO); ls(g, 1); g.fillText('LONG VIDEO', 0, 34); }
        ls(g, 0); g.restore();
      }
      y -= 14;
    });
    g.restore();
  }
  function feedScene(g, t) {
    var P = phoneCam(t), know = at('know', 'know'), ch = chipPos(t);
    var strong = at('strong', 'strong'), turn0 = S('turn').t0;
    phone(g, P.x, P.y, P.s, P.rot, 1, feedScreen(t), {
      after: function (g) {
        /* the bet chip sits on this video until the first swipe carries it off with the card */
        var sw0 = FEED[1].t, sk = eio(seg(t, sw0, sw0 + FEED[1].sw));
        if (sk < 1) { g.save(); g.globalAlpha *= 1 - seg(sk, 0, .45); g.translate(0, -SH * sk); casino(g, ch.x, ch.y, 112, ch.rot, 1, ch.s * kn(t, at('hook', 'this'))); g.restore(); }
      }
    });
    /* the big ? on "know" */
    var qk = pop(t, know - .04, 3.2, .8) * (1 - seg(t, FEED[1].t - .1, FEED[1].t + .15));
    if (qk > 0) {
      g.save(); g.translate(P.x, P.y - 40); g.rotate(-.08); var qs = lerp(1.4, 1, clamp(qk, 0, 1)); g.scale(qs, qs); g.globalAlpha *= clamp(qk * 3, 0, 1);
      g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 10, 16, 140, 140); g.fillStyle = HOT; el(g, 0, 0, 140, 140);
      font(g, 210, 900); g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 10); g.restore();
    }
    /* TIKTOK ALGORITHM, the search phrase, from 1.6 s */
    var ca = fin(t, CHIP_T) * (1 - seg(t, start('clue') - .2, start('clue') + .1));
    chip(g, 'TIKTOK ALGORITHM', 540, 512, { px: 56, wt: 900, bg: HOT, fg: BG, a: ca, s: lerp(.8, 1, clamp(sp(t, CHIP_T, 3), 0, 1)) * kn(t, at('know', 'algorithm')) });
    /* the clue strip */
    signals(g, t, eio(seg(t, know - .1, know + .5)) * (1 - eio(seg(t, turn0 - .05, turn0 + .45))));
    /* linger: a thumb that hovers and doesn't swipe; a stopwatch */
    var l0 = S('linger').t0, l1 = S('strong').t0;
    var la = fin(t, l0 + .1) * (1 - seg(t, l1 - .1, l1 + .2));
    if (la > 0) {
      thumb(g, P.x + 120 + Math.sin(t * 3.1) * 8, P.y + 330 + Math.sin(t * 2.3) * 14, 1, la);
      var secs = lingerSecs(t);
      stopwatch(g, P.x, P.y - 60, 120, Math.max(0, t - LT[0] + .9), la, secs > 0 ? kn(t, LT[secs - 1]) : 1);
    }
    /* strong: STRONG SIGNAL, with TikTok's own words */
    stamp(g, 'STRONG SIGNAL', P.x + 40, P.y - 150, t, strong + .02, turn0 - .1, 52, REDINK, -.1);
    var qa = fin(t, S('strong').t0 + .25) * (1 - seg(t, turn0 - .2, turn0 + .1));
    block(g, ['“a strong indicator of interest”', 'TikTok Newsroom, Jun 18, 2020'], 540, 506, 34, qa, true);
  }
  var LT = [];
  function lingerSecs(t) { var n = 0; LT.forEach(function (x) { if (t >= x) n++; }); return n; }

  /* frame 0's headline: TIKTOK BET / ON YOU; YOU lights when it is said */
  function headline(g, t, a, idle) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    var px = 116; font(g, px, 900); wide(g);
    var l1 = 'TIKTOK BET', tw = g.measureText(l1).width;
    if (tw > 720) { px = Math.floor(px * 720 / tw); font(g, px, 900); wide(g); }
    g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillStyle = CREAM;
    var bk = idle ? 1 : kn(t, at('hook', 'bet'));
    g.save(); g.translate(540, 250); g.scale(bk, bk); g.fillText(l1, 0, 0); g.restore();
    var s1 = 'ON ', s2 = 'YOU', w1 = g.measureText(s1).width, w2 = g.measureText(s2).width, x = 540 - (w1 + w2) / 2, y = 378;
    var lit = idle ? 1 : seg(t, at('hook', 'youd') - .05, at('hook', 'youd') + .12), kk = idle ? 0 : Math.max(0, knock(t, at('hook', 'youd'), 16, 6));
    g.textAlign = 'left'; g.fillText(s1, x, y);
    g.save(); g.translate(x + w1 + w2 / 2, y); g.scale(1 + .06 * kk, 1 + .06 * kk);
    if (lit > 0) { rr(g, -w2 / 2 - 14, -px * .6, (w2 + 28) * lit, px * 1.2, 16); g.fillStyle = HOT; g.fill(); }
    g.fillStyle = lit > .6 ? BG : CREAM; g.textAlign = 'center'; g.fillText(s2, 0, 0);
    g.restore(); g.restore();
  }
  /* frame 0 (and the loop's landing frame): the phone close up, this video in it, the chip on its way */
  function hookIdle(g, ti) {
    var ch = chipPos(0, Math.max(ti, 0));
    phone(g, PZ.x, PZ.y - Math.min(ti, 2) * 8, PZ.s, -.025 + Math.sin(ti * 1.4) * .008, 1, thisScreen(0, ti, 0), {
      after: function (g) { casino(g, ch.x, ch.y, 112, ch.rot, 1, ch.s); }
    });
  }

  /* =====================================================================================================
     SCENE 2 · turn + stranger + third + helped: your phone is one of many; a stranger's two videos; her third
     ===================================================================================================== */
  var GRID = (function () { var g = []; for (var r = 0; r < 4; r++) for (var c = 0; c < 6; c++) g.push({ x: 160 + c * 142, y: 600 + r * 225, c: c, r: r, id: Math.floor(hash(r * 6 + c + 3) * 8), ph: hash(r * 6 + c + 40) }); return g; })();
  var YOU = 7, HER = 16;    /* grid slots: you (row 1, col 1), the stranger (row 2, col 4) */
  var GS = .18;
  var PY = { x: 285, y: 915, s: .62 }, PS = { x: 745, y: 915, s: .62 };
  var TILE = { w: 440, h: 312, ys: [-372, 0, 372] };
  var A = 0, B = 5, C = 6;
  /* a phone screen as a list of three videos (you: A, B, an empty slot; her: A, B, C) */
  function listScreen(ids, t, hi, slot) {
    return function (g, sw, sh) {
      g.fillStyle = '#0f0e13'; g.fillRect(-sw / 2, -sh / 2, sw, sh);
      TILE.ys.forEach(function (y, i) {
        var id = ids[i];
        if (id == null) {
          if (slot) slot(g, y);
          return;
        }
        g.save(); g.translate(0, y); rr(g, -TILE.w / 2, -TILE.h / 2, TILE.w, TILE.h, 26); g.clip(); g.scale(TILE.w / SW, TILE.w / SW); video(g, SW, TILE.h * SW / TILE.w, id, .5 + .5 * Math.sin(t * .7 + i), t, { barY: 40 }); g.restore();
        var h = hi ? hi(i) : 0;
        if (h > 0) { g.save(); g.globalAlpha *= clamp(h, 0, 1); rr(g, -TILE.w / 2, y - TILE.h / 2, TILE.w, TILE.h, 26); g.strokeStyle = HOT; g.lineWidth = 22; g.stroke(); g.restore(); }
      });
    };
  }
  function tileWorld(P, i) { return { x: P.x, y: P.y + TILE.ys[i] * P.s, w: TILE.w * P.s, h: TILE.h * P.s }; }
  function avatar(g, x, y, r, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.fillStyle = 'rgba(0,0,0,.3)'; el(g, x + 4, y + 6, r * 1.15, r * 1.15);
    g.fillStyle = '#6b6478'; el(g, x, y, r * 1.15, r * 1.15);
    g.save(); g.beginPath(); g.arc(x, y, r * 1.15, 0, 6.283); g.clip();
    g.fillStyle = CREAM; el(g, x, y - r * .25, r * .42, r * .46); el(g, x, y + r * .9, r * .82, r * .6); g.restore();
    g.restore();
  }
  function tileFly(g, x, y, s, id, t, rot) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -TILE.w / 2 + 12, -TILE.h / 2 + 18, TILE.w, TILE.h, 26); g.fill();
    rr(g, -TILE.w / 2, -TILE.h / 2, TILE.w, TILE.h, 26); g.save(); g.clip(); g.scale(TILE.w / SW, TILE.w / SW); video(g, SW, TILE.h * SW / TILE.w, id, .6, t, { barY: 40 }); g.restore();
    rr(g, -TILE.w / 2, -TILE.h / 2, TILE.w, TILE.h, 26); g.strokeStyle = HOT; g.lineWidth = 22; g.stroke();
    g.restore();
  }
  function cLand() { return wend('third', 'third') - .02; }
  function crowdScene(g, t) {
    var tr = S('turn').t0, st = S('stranger').t0, hp = S('helped').t0;
    var trick = at('turn', 'trick'), notw = at('turn', 'not'), youW = at('turn', 'you');
    /* 1. your phone shrinks into the crowd */
    var shr = eio(seg(t, tr, trick + .35));
    var Y0 = GRID[YOU], H0 = GRID[HER];
    var toPair = eio(seg(t, st, st + .7));
    GRID.forEach(function (p, i) {
      if (i === YOU) return;
      if (i === HER && toPair > 0) return;
      var d = Math.hypot(p.x - Y0.x, p.y - Y0.y), ak = fin(t, trick - .25 + d / 1400, 3.4);
      var a = ak * (1 - (i === HER ? 0 : toPair));
      if (a <= 0) return;
      phone(g, p.x, p.y, GS * lerp(.7, 1, clamp(ak, 0, 1)), (p.ph - .5) * .1, a, function (g, sw, sh) { video(g, sw, sh, p.id, (t * (.15 + p.ph * .2) + p.ph) % 1, t); });
      var bl = seg(t, notw - .1 + p.ph * .5, notw + .15 + p.ph * .5) * (1 - seg(t, notw + .5 + p.ph * .5, notw + .8 + p.ph * .5));
      if (bl > 0) { g.save(); g.globalAlpha *= a * bl; g.fillStyle = HOT; el(g, p.x + 44, p.y - 92, 15, 15); g.restore(); }
    });
    var landed = t >= cLand();
    var hiA = function (i) { return i === 0 ? fin(t, at('stranger', 'two')) : i === 1 ? fin(t, at('stranger', 'same')) : 0; };
    /* the stranger: her A, B, C */
    if (toPair > 0) {
      var hx = lerp(H0.x, PS.x, toPair), hy = lerp(H0.y, PS.y, toPair), hs = lerp(GS, PS.s, toPair);
      phone(g, hx, hy, hs, 0, 1, listScreen([A, B, C], t, function (i) { return i < 2 ? hiA(i) : cGlow(t); }));
    }
    /* you */
    var yx = lerp(lerp(PL.x, Y0.x, shr), PY.x, toPair), yy = lerp(lerp(PL.y, Y0.y, shr), PY.y, toPair), ys = lerp(lerp(PL.s, GS, shr), PY.s, toPair);
    var yourScreen = toPair <= 0 ? function (g, sw, sh) { video(g, sw, sh, 7, 1, t); }
      : listScreen([A, B, landed ? C : null], t, function (i) { return i < 2 ? hiA(i) : landed ? 1 : 0; }, function (g, y) { slotEmpty(g, y, 1); });
    phone(g, yx, yy, ys, 0, 1, yourScreen, { ring: toPair <= 0 && shr > .5 ? HOT : null });
    chip(g, 'YOU', yx, yy, { px: 44, wt: 900, bg: CREAM, fg: BG, a: fin(t, trick - .1) * (1 - toPair), s: kn(t, youW) });
    var pA = fin(t, st + .55);
    if (pA <= 0) return;
    chip(g, 'YOU', PY.x, 500, { px: 46, wt: 900, bg: CREAM, fg: BG, a: pA, s: kn(t, at('helped', 'your')) });
    avatar(g, 578, 500, 30, pA);
    chip(g, 'STRANGER', 756, 500, { px: 46, wt: 900, bg: CREAM, fg: BG, a: pA, s: kn(t, at('stranger', 'stranger')) * kn(t, at('helped', 'stranger')) });
    /* the same two videos, joined */
    [[0, at('stranger', 'two')], [1, at('stranger', 'same')]].forEach(function (d) {
      var k = eio(seg(t, d[1], d[1] + .35));
      if (k <= 0) return;
      var a = tileWorld(PY, d[0]), b = tileWorld(PS, d[0]), x0 = a.x + a.w / 2 - 6, x1 = b.x - b.w / 2 + 6;
      g.save(); g.strokeStyle = HOT; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, a.y); g.lineTo(lerp(x0, x1, k), a.y); g.stroke();
      g.fillStyle = HOT; el(g, x0, a.y, 16, 16); if (k >= 1) el(g, x1, a.y, 16, 16); g.restore();
    });
    /* her third one: a copy slides across into your empty slot in 0.35 s and lands on "third" */
    var a2 = tileWorld(PS, 2), b2 = tileWorld(PY, 2), mv = eio(seg(t, cLand() - .35, cLand()));
    if (mv > 0 && mv < 1) tileFly(g, lerp(a2.x, b2.x, mv), lerp(a2.y, b2.y, mv) - Math.sin(mv * Math.PI) * 90, PY.s * (1 + Math.sin(mv * Math.PI) * .15), C, t, Math.sin(mv * Math.PI) * -.06);
    if (landed) {
      var ak = eio(seg(t, cLand(), cLand() + .25));
      g.save(); g.globalAlpha *= ak; arrow(g, a2.x - a2.w / 2 - 4, a2.y, lerp(a2.x - a2.w / 2 - 4, b2.x + b2.w / 2 + 14, ak), b2.y, 1, HOT, 12, 38); g.restore();
    }
    var mp = fin(t, at('third', 'may') - .05) * (1 - seg(t, hp - .1, hp + .15));
    chip(g, 'MAY PREDICT', 520, 1342, { px: 56, wt: 900, bg: HOT, fg: BG, a: mp, rot: -.02, s: kn(t, at('third', 'guess')) });
    label(g, 'TikTok Transparency Center', 520, 1416, mp, CREAM, 30, 'center', true);
    /* the DM frame: the same layout, held; only the tag is new */
    var ta = fin(t, hp + .05);
    block(g, ['PICKED WITH HELP', 'FROM A STRANGER'], 520, 1366, 56, ta, true, CREAM, 700);
  }
  function arrow(g, x0, y0, x1, y1, k, col, lw, head) {
    if (k <= 0) return;
    var x = lerp(x0, x1, k), y = lerp(y0, y1, k), a = Math.atan2(y1 - y0, x1 - x0), hd = head || 34;
    g.save(); g.strokeStyle = g.fillStyle = col; g.lineWidth = lw || 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x - Math.cos(a) * hd * .5, y - Math.sin(a) * hd * .5); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a - .45) * hd, y - Math.sin(a - .45) * hd); g.lineTo(x - Math.cos(a + .45) * hd, y - Math.sin(a + .45) * hd); g.closePath(); g.fill();
    g.restore();
  }
  function cGlow(t) { return fin(t, at('third', 'may') - .1); }
  function slotEmpty(g, y, a) {
    g.save(); g.globalAlpha *= a; rr(g, -TILE.w / 2 + 6, y - TILE.h / 2 + 6, TILE.w - 12, TILE.h - 12, 24); g.strokeStyle = 'rgba(244,237,224,.5)'; g.lineWidth = 8; g.setLineDash([24, 18]); g.stroke(); g.setLineDash([]);
    font(g, 150, 900); g.fillStyle = 'rgba(244,237,224,.45)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, y + 8); g.restore();
  }

  /* =====================================================================================================
     SCENE 3 · doc + two: the internal guide the New York Times saw (re-created: title and the two metric names only)
     ===================================================================================================== */
  var DOC = { x: 512, y: 768, w: 780, h: 300 }, CLIP = { x: 512, y: 1090, w: 760, h: 236 };
  /* the viewer's own time spent: 72 px, per-digit roll on each whole second (this film's clock, not a TikTok number) */
  function youCounter(g, x, y, t, a) {
    if (a <= 0) return;
    var px = 72, sec = Math.floor(t), fr = seg(t - sec, 0, .2), pre = 'YOU, 0:';
    function str(n) { return (n < 10 ? '0' : '') + n; }
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(-.02);
    font(g, px, 900); wide(g); var wp = g.measureText(pre).width, wd = g.measureText('00').width, w = wp + wd + 56, h = px * 1.3;
    recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + pre + str(sec));
    rr(g, -w / 2 + 6, -h / 2 + 9, w, h, 20); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 20); g.fillStyle = CREAM; g.fill();
    g.fillStyle = BG; g.textBaseline = 'middle'; g.textAlign = 'left';
    var x0 = -w / 2 + 28; g.fillText(pre, x0, 3);
    g.save(); g.beginPath(); g.rect(x0 + wp - 4, -h / 2 + 6, wd + 12, h - 12); g.clip();
    var a0 = str(Math.max(0, sec - 1)), a1 = str(sec), dx = x0 + wp;
    [0, 1].forEach(function (d) {
      var ch0 = a0[d], ch1 = a1[d], cw = g.measureText('0').width, xx = dx + d * cw;
      if (ch0 === ch1 || fr >= 1) g.fillText(ch1, xx, 3);
      else if (fr <= 0) g.fillText(ch0, xx, 3);
      else { var e = eio(fr); g.fillText(ch0, xx, 3 - e * h); if (e > .3) g.fillText(ch1, xx, 3 + (1 - e) * h); }
    });
    g.restore(); g.restore();
  }
  function docScene(g, t) {
    var s0 = S('doc').t0, nyt = at('doc', 'times'), inl = at('doc', 'internal');
    var two = at('two', 'two'), cb = at('two', 'come'), hl = at('two', 'how');
    var dk = pop(t, s0 + .05, 2.4);
    sheet(g, DOC.x, DOC.y - (1 - Math.min(1, dk)) * 120, DOC.w, DOC.h, lerp(.05, -.018, clamp(dk, 0, 1)) + Math.sin(t * 1.2) * .004, clamp(dk * 3, 0, 1), function (g, w, h) {
      g.textAlign = 'left'; g.textBaseline = 'middle';
      font(g, 36, 600, MONO); ls(g, 3); g.fillStyle = INK; g.fillText('INTERNAL DOCUMENT', -w / 2 + 50, -h / 2 + 56); ls(g, 0);
      font(g, 84, 900); g.fillStyle = INK; g.fillText('TikTok Algo 101', -w / 2 + 50, -h / 2 + 148);
      g.fillStyle = INK; g.fillRect(-w / 2 + 50, -h / 2 + 206, w - 100, 5);
    });
    chip(g, 'RE-CREATED', DOC.x + DOC.w / 2 - 150, DOC.y - DOC.h / 2 + 56, { px: 32, wt: 700, fam: MONO, line: REDINK, lw: 4, fg: REDINK, a: clamp(dk * 3, 0, 1), rot: .03, shadow: false });
    /* the document is real, says TikTok: red ink straight on the page, under the title, on "internal" */
    stamp(g, 'REAL, SAYS TIKTOK', DOC.x + 10, DOC.y + 96, t, inl - .02, S('doc').t1, 56, REDINK, -.05, true);
    /* the source, as a re-created clipping: in with the page, out when the two numbers land */
    var ck = pop(t, s0 + .25, 2.6), cout = eio(seg(t, two - .3, two + .15));
    if (ck > 0 && cout < 1) {
      var ca = clamp(ck * 3, 0, 1) * (1 - cout), crot = lerp(-.06, .02, clamp(ck, 0, 1));
      sheet(g, CLIP.x, CLIP.y + (1 - Math.min(1, ck)) * 90, CLIP.w, CLIP.h, crot, ca, function (g, w, h) {
        var s = kn(t, nyt); g.scale(s, s);
        g.textAlign = 'center'; g.textBaseline = 'middle';
        font(g, 36, 600, MONO); ls(g, 3); g.fillStyle = INK; g.fillText('THE NEW YORK TIMES', -90, -h / 2 + 46); ls(g, 0);
        g.fillStyle = INK; g.fillRect(-w / 2 + 40, -h / 2 + 78, w - 80, 3);
        font(g, 44, 800); g.fillStyle = INK; g.fillText('How TikTok Reads Your Mind', 0, 6);
        font(g, 36, 600, MONO); g.fillStyle = INK; g.fillText('Ben Smith · Dec 5, 2021', 0, h / 2 - 46);
      });
      chip(g, 'RE-CREATED', CLIP.x + CLIP.w / 2 - 128, CLIP.y + (1 - Math.min(1, ck)) * 90 - CLIP.h / 2 + 44, { px: 30, wt: 700, fam: MONO, line: REDINK, lw: 4, fg: REDINK, a: ca, rot: .03, shadow: false });
    }
    /* two numbers: retention (come back?) and time spent (how long you stay), answered with this film's own clock */
    var r1 = pop(t, at('two', 'numbers') - .1, 3.2), r2 = pop(t, at('two', 'mattered') - .1, 3.2);
    chip(g, 'RETENTION', 512, 1056, { px: 76, wt: 900, bg: HOT, fg: BG, a: clamp(r1 * 3, 0, 1), s: lerp(1.3, 1, clamp(r1, 0, 1)) * kn(t, cb), rot: -.03 });
    label(g, 'do you come back?', 512, 1140, fin(t, cb - .1), CREAM, 40, 'center', true);
    chip(g, 'TIME SPENT', 512, 1232, { px: 76, wt: 900, bg: HOT, fg: BG, a: clamp(r2 * 3, 0, 1), s: lerp(1.3, 1, clamp(r2, 0, 1)) * kn(t, hl), rot: .025 });
    youCounter(g, 512, 1352, t, fin(t, hl - .1));
  }

  /* =====================================================================================================
     SCENE 4 · end: did you finish this one? Yes or no? → frame 0
     ===================================================================================================== */
  function endScene(g, t) {
    var s0 = S('end').t0, fn = at('end', 'finish'), yes = at('end', 'yes'), no = at('end', 'no');
    var ch = chipPos(t), out = 1 - seg(t, HOME - .55, HOME - .25);
    phone(g, PZ.x, PZ.y - 16 * (1 - seg(t, HOME - .6, HOME)), PZ.s, -.025 + Math.sin((t - DUR) * 1.4) * .008, 1, thisScreen(0, t - DUR, 0), {
      after: function (g) { casino(g, ch.x, ch.y, 112, ch.rot, 1, ch.s * kn(t, fn)); }
    });
    var dd = at('end', 'did'), ya = pop(t, dd - .05, 3) * out, na = pop(t, dd + .07, 3) * out;
    chip(g, 'YES', 270, 900, { px: 90, wt: 900, bg: CREAM, fg: BG, a: clamp(ya * 3, 0, 1), s: lerp(1.3, 1, clamp(ya, 0, 1)) * kn(t, yes), rot: -.04 });
    chip(g, 'NO', 525, 900, { px: 90, wt: 900, bg: HOT, fg: BG, a: clamp(na * 3, 0, 1), s: lerp(1.3, 1, clamp(na, 0, 1)) * kn(t, no), rot: .04 });
    /* an empty comment box with a blinking caret: answering is the viewer's job (and the answer is a signal) */
    var ca = fin(t, s0 + .35) * out;
    if (ca > 0) {
      g.save(); g.globalAlpha *= ca; rr(g, 150 + 6, 1050 + 10, 600, 100, 50); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
      rr(g, 150, 1050, 600, 100, 50); g.fillStyle = BG; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
      font(g, 44, 500, MONO); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(244,237,224,.75)'; g.fillText('yes or no?', 236, 1102);
      if (Math.floor(t * 2.6) % 2 === 0) { g.fillStyle = HOT; g.fillRect(204, 1074, 6, 56); }
      g.restore();
    }
  }

  /* ---------- captions: the narrator's words, one block at a time; only stressed words get the coral pill ---------- */
  /* caption cards break at phrase boundaries: sentence ends, then these words start a new card */
  var CAPBRK = { know: ['tiktok'], linger: ['you'], stranger: ['two'], third: ['youll'], helped: ['helped'], doc: ['saw'] };
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;   /* frame 0 carries TIKTOK BET ON YOU instead: ≤ 5 words on screen */
      var brk = (CAPBRK[l.id] || []).slice(), cur = [];
      l.words.forEach(function (w, i) {
        if (cur.length && brk.length && norm(w.w) === brk[0]) { out.push(cur); cur = []; brk.shift(); }
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < l.words.length - 1) { out.push(cur); cur = []; }
      });
      if (cur.length) out.push(cur);
      if (l.id === 'know') out.splice(out.length - 2, 1);   /* "So how does the" plays under the frame-0 headline */
    });
    return out.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS = [['know', 'algorithm'], ['know', 'know'], ['clue', 'clue'], ['clue', 'finish'], ['clue', 'skip'], ['clue', 'replay'],
    ['linger', 'seconds'], ['linger', 'linger'], ['strong', 'long'], ['strong', 'strong'], ['turn', 'trick'], ['turn', 'not'], ['turn', 'you'],
    ['stranger', 'stranger'], ['stranger', 'same'], ['stranger', 'two'], ['third', 'may'], ['third', 'third'], ['helped', 'never'], ['helped', 'helped'],
    ['doc', '2021'], ['doc', 'times'], ['two', 'two'], ['two', 'back'], ['two', 'long'], ['end', 'finish'], ['end', 'yes'], ['end', 'no']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
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
    var lines, lw, maxw = 760, cpx = 74;
    function lay() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; }); }
    var GLUE = { the: 1, a: 1, an: 1, your: 1, her: 1, my: 1, new: 1, york: 1, of: 1 };
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
    var swA = 1; SC.forEach(function (sc) { if (sc.swipe && card0.t0 > sc.t0 - SWIPE - .05 && card0.t0 < sc.t0 + .1) swA = seg(t, sc.t0 - SWIPE * .4, sc.t0 + .15); });
    g.globalAlpha = fi * out * swA * (alpha == null ? 1 : alpha);
    lines.forEach(function (ln, li) {
      var x = W / 2 - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 40;
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
  var NOISE, SCENES = { feed: feedScene, crowd: crowdScene, doc: docScene, end: endScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  var PRE = .3, SWIPE = .42;
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function headA(t) { return 1 - seg(t, at('know', 'tiktok') - .2, at('know', 'tiktok') - .03); }
  function drawScene(g, Sc, t) {
    g.save();
    if (Sc.fn === 'doc') { var push = 1 + .015 * seg(t, Sc.t0, Sc.t1); g.translate(540, 1000); g.scale(push, push); g.translate(-540, -1000); }
    SCENES[Sc.fn](g, t);
    g.restore();
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    /* the native move as the cut: the stage swipes up and the next scene is already under it */
    var sk = Nx && Nx.swipe ? eio(seg(t, Nx.t0 - SWIPE, Nx.t0)) : 0;
    var pre = Sc.swipe && t < Sc.t0 + PRE;
    if (sk > 0) {
      g.save(); g.translate(0, -H * sk); drawScene(g, Sc, t); g.restore();
      /* the incoming scene is in transit under the swipe; the safe-area check measures it once it has landed */
      g.save(); g.translate(0, H * (1 - sk)); stage(g); INCOMING = true; drawScene(g, Nx, Nx.t0 + PRE); INCOMING = false; g.restore();
      /* the swipe's edge: a thin coral line where the two scenes meet */
      g.fillStyle = HOT; g.fillRect(0, H * (1 - sk) - 3, W, 6);
    } else drawScene(g, Sc, pre ? Sc.t0 + PRE : t);
    /* the loop: the end dissolves back into frame 0 */
    var back = eio(seg(t, HOME, HOME + .35));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g); hookIdle(g, t - DUR); g.restore(); }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) {
      if (si === 0) headline(g, t, headA(t));
      if (back > 0) { captions(g, t, 1 - back); headline(g, 0, back, true); } else captions(g, t);
    }
    if (!POSTERMODE) {
      g.fillStyle = 'rgba(244,237,224,.12)'; g.fillRect(60, 140, W - 120, 6);
      g.fillStyle = HOT; g.fillRect(60, 140, (W - 120) * (back > 0 ? 1 - back : t / DUR), 6);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false;
  function posterTitle(g) {
    g.save(); font(g, 70, 800); wide(g); g.textBaseline = 'alphabetic';
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText('Why TikTok knew', 540, 300);
    var a = 'you’d ', b = 'watch this', wa = g.measureText(a).width, wb = g.measureText(b).width, x = 540 - (wa + wb) / 2;
    g.textAlign = 'left'; g.fillText(a, x, 400); g.fillStyle = HOT; g.beginPath(); g.roundRect(x + wa - 12, 400 - 66, wb + 24, 90, 16); g.fill();
    g.fillStyle = BG; g.fillText(b, x + wa, 400); g.restore();
  }
  function TEXTS(t) {
    var out = [];
    function T(id, text, a, b) { if (t >= a && t < b) out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    T('head', 'TIKTOK BET ON YOU', 0, at('know', 'tiktok') - .2);
    T('chip', 'TIKTOK ALGORITHM', CHIP_T + .2, start('clue') - .2);
    T('quote', '“a strong indicator of interest”', S('strong').t0 + .45, S('turn').t0 - .2);
    T('may', 'MAY PREDICT', at('third', 'may') + .2, S('helped').t0 + .3);
    T('dm', 'PICKED WITH HELP FROM A STRANGER', S('helped').t0 + .3, S('doc').t0 - SWIPE);
    T('title', 'TikTok Algo 101', S('doc').t0 + .25, S('end').t0 - SWIPE);
    T('clip', 'How TikTok Reads Your Mind', S('doc').t0 + .35, at('two', 'two') - .3);
    T('stamp', 'REAL, SAYS TIKTOK', at('doc', 'internal') + .3, S('end').t0 - SWIPE);
    T('ret', 'RETENTION', at('two', 'numbers') + .2, S('end').t0 - SWIPE);
    T('ts', 'TIME SPENT', at('two', 'mattered') + .2, S('end').t0 - SWIPE);
    T('yesno', 'YES NO', at('end', 'did') + .15, HOME - .5);
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [];
  function initTimes() {
    var i;
    /* the in-phone feed (native move), keyed to the voice */
    var swp = at('clue', 'swipe'), finW = at('clue', 'finish'), finE = wend('clue', 'finish'), skp = at('clue', 'skip'), rpl = at('clue', 'replay');
    var catT = swp - .12, treeT = finE + .04, boatT = skp + .06, carT = start('linger') - .2, longT = start('strong') - .12;
    FEED.push({ id: 'this', t: -1, sw: .3 });
    FEED.push({ id: 0, t: catT, sw: .32, prog: function (t) { return lerp(.3, 1, eio(seg(t, catT + .2, finE))); }, over: function (g, sw, sh, t) { var k = pop(t, finE - .05, 3); if (k > 0) { g.save(); g.globalAlpha *= clamp(k * 3, 0, 1); g.fillStyle = 'rgba(21,19,27,.85)'; el(g, 0, -sh * .04, 120 * k, 120 * k); tickMark(g, 0, -sh * .04, 3.4 * k, HOT, 1, 11); g.restore(); } } });
    FEED.push({ id: 3, t: treeT, sw: .26, prog: function (t) { return .05 + seg(t, treeT, skp) * .06; } });
    FEED.push({ id: 5, t: boatT, sw: .16, prog: function (t) { return t < rpl - .05 ? lerp(.15, 1, eio(seg(t, boatT + .15, rpl - .05))) : seg(t, rpl + .25, rpl + 6); },
      over: function (g, sw, sh, t) {
        var k = pop(t, rpl - .1, 3) * (1 - seg(t, carT - .3, carT));
        if (k <= 0) return;
        g.save(); g.globalAlpha *= clamp(k * 3, 0, 1); g.translate(0, -sh * .04); g.fillStyle = 'rgba(21,19,27,.85)'; el(g, 0, 0, 125 * k, 125 * k);
        g.rotate(-(t - rpl) * 5); g.strokeStyle = HOT; g.lineWidth = 20; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, 70, .5, 5.4); g.stroke();
        g.fillStyle = HOT; g.save(); g.rotate(5.4); g.translate(70, 0); tri(g, -26, -4, 26, -4, 0, 30); g.restore(); g.restore();
      } });
    FEED.push({ id: 4, t: carT, sw: .3, prog: function (t) { return .1 + seg(t, carT, S('strong').t0) * .5; } });
    var lgF = at('strong', 'finish'), lgS = at('strong', 'strong');
    FEED.push({ id: 7, t: longT, sw: .3, prog: function (t) { return lerp(.02, 1, eio(seg(t, lgF, lgS + .05))); },
      over: function (g, sw, sh, t) {
        chip(g, 'LONG VIDEO', 0, -sh / 2 + 150, { px: 56, wt: 900, bg: CREAM, fg: BG, a: seg(t, longT + .3, longT + .45), s: kn(t, at('strong', 'long')) });
        var k = pop(t, lgS + .05, 3); if (k > 0) { g.save(); g.globalAlpha *= clamp(k * 3, 0, 1); g.fillStyle = 'rgba(21,19,27,.85)'; el(g, 0, sh * .22, 110 * k, 110 * k); tickMark(g, 0, sh * .22, 3.1 * k, HOT, 1, 11); g.restore(); }
      } });
    LT = [at('linger', 'seconds'), at('linger', 'linger'), at('linger', 'counted')];
    TALLY.push({ text: 'FINISH', t: finE + .02 });
    TALLY.push({ text: 'SKIP', t: skp + .2, outline: true });
    TALLY.push({ text: 'REPLAY', t: rpl + .12 });
    TALLY.push({ text: 'LINGER', t: LT[0] + .05, knock: function (t) { var n = lingerSecs(t); return LT[Math.max(0, n - 1)] + .05; } });
    TALLY.push({ text: 'STRONG', t: lgS + .08, big: true });

    /* hook */
    EV.push({ t: 0, type: 'slide', t1: chipLand() });
    EV.push({ t: chipLand(), type: 'clack' });
    EV.push({ t: at('hook', 'youd') - .03, type: 'tick', g: .3 }, { t: CHIP_T - .02, type: 'pop', g: .7 });
    /* know */
    EV.push({ t: at('know', 'so') - .15, type: 'rise', t1: at('know', 'algorithm') + .25 }, { t: at('know', 'algorithm') - .03, type: 'tick', g: .3 }, { t: wend('know', 'know') + .02, type: 'stamp', big: true });
    EV.push({ t: at('know', 'know') + .1, type: 'swish' });
    /* clue: the in-phone swipes and the tallies */
    FEED.forEach(function (f, j) { if (j) EV.push({ t: f.t, type: 'flick', g: f.sw < .2 ? 1.3 : 1 }); });
    TALLY.forEach(function (d) { EV.push({ t: d.t + .06, type: 'drop', g: d.big ? 1.4 : 1 }); });
    EV.push({ t: finE - .05, type: 'ding1' }, { t: rpl - .1, type: 'rewind', t1: rpl + .25 });
    LT.forEach(function (x) { EV.push({ t: x - .02, type: 'clock' }); });
    EV.push({ t: lgF, type: 'rise', t1: lgS + .05 }, { t: lgS + .02, type: 'stamp', big: true }, { t: lgS + .06, type: 'ding1', f: 1 });
    /* turn + stranger + third + helped */
    var tr = S('turn').t0, st = S('stranger').t0, hp = S('helped').t0;
    EV.push({ t: tr + .05, type: 'swish' });
    for (i = 0; i < 10; i++) EV.push({ t: at('turn', 'trick') - .2 + i * .06, type: 'tick', g: .12 });
    for (i = 0; i < 6; i++) EV.push({ t: at('turn', 'not') + i * .09, type: 'pop', g: .25 });
    EV.push({ t: at('turn', 'you') - .02, type: 'pop', g: .6 });
    EV.push({ t: st + .05, type: 'swish' }, { t: at('stranger', 'stranger') - .03, type: 'pop', g: .5 });
    EV.push({ t: at('stranger', 'same') + .05, type: 'zip', t1: at('stranger', 'same') + .4 }, { t: at('stranger', 'two') + .05, type: 'zip', t1: at('stranger', 'two') + .4 });
    EV.push({ t: at('third', 'may') - .05, type: 'pop', g: .7 }, { t: at('third', 'guess') - .1, type: 'swish' }, { t: cLand() - .35, type: 'swish' }, { t: cLand(), type: 'clack' }, { t: cLand() + .05, type: 'ding1' });
    EV.push({ t: hp + .05, type: 'rise', t1: hp + .65 }, { t: hp + .1, type: 'thump', g: .4 }, { t: at('helped', 'helped') - .04, type: 'ding1', f: 1 });
    /* doc + two */
    var dc = S('doc').t0;
    EV.push({ t: dc - SWIPE, type: 'whoosh', t1: dc }, { t: dc + .08, type: 'paper', g: 1.3 }, { t: dc + .12, type: 'thump', g: .3 });
    EV.push({ t: at('doc', 'new') - .1, type: 'paper' }, { t: at('doc', 'times') - .03, type: 'tick', g: .3 }, { t: at('doc', 'internal') - .02, type: 'stamp' }, { t: at('two', 'two') - .3, type: 'swish' });
    EV.push({ t: at('two', 'numbers') - .1, type: 'slap' }, { t: at('two', 'mattered') - .1, type: 'slap' }, { t: at('two', 'come') - .05, type: 'tick', g: .3 }, { t: at('two', 'how') - .05, type: 'tick', g: .3 });
    for (var sq = Math.ceil(at('two', 'how')); sq < S('end').t0 - SWIPE; sq++) EV.push({ t: sq, type: 'tick', g: .28 });
    /* end */
    var en = S('end').t0;
    EV.push({ t: en - SWIPE, type: 'whoosh', t1: en }, { t: at('end', 'finish') - .03, type: 'tick', g: .3 });
    EV.push({ t: at('end', 'did') - .05, type: 'pop', g: .7 }, { t: at('end', 'did') + .07, type: 'pop', g: .8 }, { t: at('end', 'yes') - .04, type: 'tick', g: .25 }, { t: at('end', 'no') - .04, type: 'tick', g: .3 });
    EV.push({ t: HOME - .5, type: 'slide', t1: HOME });
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
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }

    function tickS(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .22], [t + .025, 0]]); }
    function ding1(t, hi) { osc('sine', mtof(hi ? 81 : 76), t, t + .7, 1, [[t, 0], [t + .005, .07], [t + .6, 0]], .4); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, 1, [[t, 0], [t + .004, g || .4], [t + .26, 0]], .1); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t - .12, t + .14, 900, 5200, .12, .02, 1.6); }
    function whoosh(t, t1) { band(t, t1, 500, 4200, .1, .03, 1.2); }
    function stampS(t, big) { thump(t, big ? .6 : .45); var n = noise(t, .16), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1500; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .42 : .32], [t + .12, 0]]); tickS(t + .005, .18); }
    function paper(t, g) { g = g || 1; band(t - .03, t + .12, 1800, 3800, .07 * g, .02, 1.2, (rnd() - .5) * .8); tickS(t + .1, .08 * g); }
    function flick(t, g) { g = g || 1; band(t, t + .16, 1400, 5600, .09 * g, .02, 1.8, .2); tickS(t + .14, .1 * g); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function rise(t, t1) { band(t, t1, 400, 1800, .03, .06, 3); }
    function rewind(t, t1) { band(t, t1, 4200, 500, .05, .06, 4); var n = Math.floor((t1 - t) / .035); for (var j = 0; j < n; j++) tickS(t + j * .035, .05); }
    /* the chip: a clay clack (two quick ticks over a low knock) and a felt slide */
    function clack(t) { thump(t, .5); tickS(t, .4); tickS(t + .045, .25); osc('triangle', 1250, t, t + .08, 1, [[t, 0], [t + .002, .06], [t + .07, 0]], .1); }
    function slide(t, t1) { band(t, t1, 1200, 600, .04, .05, .8); }
    function drop(t, g) { thump(t, .22 * (g || 1)); osc('sine', mtof(g > 1.2 ? 64 : 71), t, t + .25, 1, [[t, 0], [t + .004, .05], [t + .2, 0]], .2); tickS(t, .14); }
    function clock(t) { tickS(t, .3); tickS(t + .5, .15); }
    function zip(t, t1) { band(t, t1, 1200, 3600, .04, .02, 3); }
    function slap(t) { thump(t, .45); var n = noise(t, .1), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 900; var o = bus(1, .15); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .3], [t + .08, 0]]); }
    function key(t) { tickS(t, .25); osc('sine', 1900, t, t + .03, 1, [[t, 0], [t + .002, .03], [t + .025, 0]]); }
    EV.forEach(function (e) {
      if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'ding1') ding1(e.t, e.f);
      else if (e.type === 'thump') thump(e.t, e.g);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'whoosh') whoosh(e.t, e.t1);
      else if (e.type === 'stamp') stampS(e.t, e.big);
      else if (e.type === 'paper') paper(e.t, e.g);
      else if (e.type === 'flick') flick(e.t, e.g);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'rise') rise(e.t, e.t1);
      else if (e.type === 'rewind') rewind(e.t, e.t1);
      else if (e.type === 'clack') clack(e.t);
      else if (e.type === 'slide') slide(e.t, e.t1);
      else if (e.type === 'drop') drop(e.t, e.g);
      else if (e.type === 'clock') clock(e.t);
      else if (e.type === 'zip') zip(e.t, e.t1);
      else if (e.type === 'slap') slap(e.t);
      else if (e.type === 'key') key(e.t);
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”·→…#?'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initTimes();
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: at('helped', 'helped') + 1.0, SLUG: 'fyp', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
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
