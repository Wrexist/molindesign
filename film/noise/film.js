/* "Noise" — how AI turns static into pictures. Factory #5 on Tech, explained, after ../gps/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t. Contract: window.FILM,
   DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). The native move is the wipe: a squeegee bar sweeps the field and
   leaves it one step cleaner (it is also the scene transition). One seeded static field (#4127) is drawn on frame 0,
   flip, dog and end, so "same static" is literally true. Everything is hand-built (chunky static, a paper photo, a salt
   shaker, a filmstrip, drawn cards, a cat and a dog drawn with paths): no AI imagery. Facts: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur;
  var BG = '#15131b', PANEL = '#221f2b', CREAM = '#f4ede0', DIM = 'rgba(244,237,224,.5)', FAINT = 'rgba(244,237,224,.14)';
  var HOT = '#ff5b3d', YEL = '#ffc83d';
  var PAPER = '#f1e9d8', INK = '#211d26', REDINK = '#d8332b', TAN = '#c98f4e', ORANGE = '#e8913f';
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
  function win(t, a, b, o) { return t < a || t > b + (o || .3) ? 0 : clamp(sp(t, a), 0, 1.04) * (1 - eio(seg(t, b, b + (o || .3)))); }
  function knock(t, a, f, d) { if (t < a) return 0; var u = t - a; return Math.exp(-u * (d || 7)) * Math.sin(u * (f || 22)); }
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function commas(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function at(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function wend(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word].t1;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t1;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }

  /* scenes. wipe:false = the scene grows out of the last one (no squeegee cut) */
  var SC = [
    { id: 'hook', name: 'Find the cat', t0: 0 },
    { id: 'trick', name: 'Learned backwards', t0: start('trick') - .05 },
    { id: 'photo', name: 'A real photo', t0: start('photo') - .3 },
    { id: 'guess', name: 'Guess the static', t0: start('guess') - .05 },
    { id: 'good', name: 'Millions of pictures', t0: start('good') - .3 },
    { id: 'paint', name: 'Fifty wipes', t0: start('flip') - .3, wipe: false, field: true },
    { id: 'twin', name: 'Same static', t0: wend('dog2', 'dog', 1) + .02, wipe: false, field: true },
    { id: 'end', name: 'One word', t0: start('end') + .25, wipe: false, field: true }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = end('end') + .25;

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- the safe-area check: every glyph box drawn on the film canvas is measured (window.BOUNDS_RUN) ---------- */
  var BOUNDS = null, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
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
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    font(g, px, o.wt, o.fam);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad, w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore();
    return w;
  }
  /* a label: mono, ≥ 36 px unless asked smaller (small print ≥ 30), optional ink plate so it reads over static */
  function label(g, text, x, y, a, col, px, align, plate) {
    px = Math.max(30, px || 36);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); ls(g, 3); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    while (g.measureText(text).width > 760 && px > 30) { px--; font(g, px, 500, MONO); }
    var dy = (1 - Math.min(1, a)) * 14;
    if (plate) {
      var w = g.measureText(text).width, x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
      rr(g, x0 - 18, y - px * .78 + dy, w + 36, px * 1.56, 12); g.fillStyle = 'rgba(21,19,27,.9)'; g.fill();
    }
    g.fillStyle = col || CREAM;
    g.fillText(text, x, y + dy); g.restore();
  }
  function block(g, lines, x, y, px, a, plate) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); ls(g, 0); g.textAlign = 'center'; g.textBaseline = 'middle';
    var lh = px * 1.3, w = 0; lines.forEach(function (l) { w = Math.max(w, g.measureText(l).width); });
    var y0 = y - (lines.length - 1) * lh / 2;
    if (plate) { rr(g, x - w / 2 - 20, y0 - lh / 2 - 8, w + 40, lh * lines.length + 16, 14); g.fillStyle = 'rgba(21,19,27,.92)'; g.fill(); }
    g.fillStyle = CREAM; lines.forEach(function (l, i) { g.fillText(l, x, y0 + i * lh); });
    g.restore();
  }
  function cross(g, x, y, s, col, a, lw) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.strokeStyle = col || HOT; g.lineWidth = lw || 12; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-26, -26); g.lineTo(26, 26); g.moveTo(26, -26); g.lineTo(-26, 26); g.stroke(); g.restore();
  }
  function tick(g, x, y, s, col, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.strokeStyle = col || HOT; g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-20, 0); g.lineTo(-6, 15); g.lineTo(22, -16); g.stroke(); g.restore();
  }
  function arrow(g, x0, y0, x1, y1, k, col, lw, head) {
    if (k <= 0) return;
    var x = lerp(x0, x1, k), y = lerp(y0, y1, k), a = Math.atan2(y1 - y0, x1 - x0), hd = head || 34;
    g.save(); g.strokeStyle = g.fillStyle = col; g.lineWidth = lw || 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x - Math.cos(a) * hd * .5, y - Math.sin(a) * hd * .5); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a - .45) * hd, y - Math.sin(a - .45) * hd); g.lineTo(x - Math.cos(a + .45) * hd, y - Math.sin(a + .45) * hd); g.closePath(); g.fill();
    g.restore();
  }
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
  function stamp(g, text, x, y, t, t0, t1, px, col, rot) {
    if (t < t0 || t > t1 + .3) return;
    var c = stampTex(text, col, px);
    var k = sp(t, t0, 3.2, .8), s = lerp(1.35, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (1 - seg(t, t1, t1 + .3));
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.1 : rot); g.scale(s, s);
    if (k >= 1) recBox(g, -c.w / 2 - 14, -c.h / 2 - 4, c.w / 2 - 6, c.h / 2 + 4, text);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-c.w / 2 - 4, -c.h / 2 + 10, c.w + 8, c.h);
    g.fillStyle = PAPER; g.fillRect(-c.w / 2 - 14, -c.h / 2 - 4, c.w + 8, c.h + 8);
    g.drawImage(c, -c.w / 2 - 10, -c.h / 2); g.restore();
  }

  /* =====================================================================================================
     THE STATIC. One seeded field (#4127): 90 × 121 cells of 12 px, from y 470 to the bottom. A picture is painted
     out of it with the DDPM mix x = √ᾱ·picture + √(1−ᾱ)·noise (coarse shapes first, detail last).
     ===================================================================================================== */
  var FC = 90, FR = 121, CELL = 12, FY = 470, FH = FR * CELL;
  var RGB0 = [21, 19, 27], RGB1 = [244, 237, 224];
  function noiseArr(seed, n) { var r = mulberry(seed), a = new Float32Array(n); for (var i = 0; i < n; i++) a[i] = clamp(r() * 2.4 - 1.05, -1, 1); return a; }
  var EPS_R = noiseArr(2020, FC * FR), EPS = noiseArr(4127, FC * FR), PC = 52, EPS_P = noiseArr(77, PC * PC), EPS_G = noiseArr(91, PC * PC);
  /* the real DDPM schedule (Ho et al. 2020): β from 1e-4 to 0.02 over 1,000 steps, ᾱ_t = Π(1 − β) */
  var AB = (function () { var a = [1], p = 1; for (var i = 1; i <= 1000; i++) { p *= 1 - (1e-4 + (.02 - 1e-4) * (i - 1) / 999); a.push(p); } return a; })();

  var PICS = {};
  function rasterize(draw, w, h, cols, rows, bc, br) {
    var full = mk(w, h), g = full.getContext('2d'); draw(g, w, h);
    function grab(c, r) { var s = mk(c, r), sg = s.getContext('2d'); sg.imageSmoothingEnabled = true; sg.imageSmoothingQuality = 'high'; sg.drawImage(full, 0, 0, c, r); return s; }
    function arr(cvs) {
      var d = cvs.getContext('2d').getImageData(0, 0, cols, rows).data, a = new Float32Array(cols * rows * 3);
      for (var i = 0; i < cols * rows; i++) for (var ch = 0; ch < 3; ch++) a[i * 3 + ch] = (d[i * 4 + ch] - RGB0[ch]) / (RGB1[ch] - RGB0[ch]);
      return a;
    }
    var small = grab(bc, br), blur = mk(cols, rows), bg = blur.getContext('2d'); bg.imageSmoothingEnabled = true; bg.imageSmoothingQuality = 'high'; bg.drawImage(small, 0, 0, cols, rows);
    return { full: full, sharp: arr(grab(cols, rows)), blur: arr(blur) };
  }
  var TILES = {};
  /* a noisy picture at signal level ab (0 = pure static), detail det (0 = coarse, 1 = sharp); eps2/mixk morphs the noise */
  function noisy(key, cols, rows, eps, pic, ab, det, eps2, mixk) {
    var c = TILES[key]; if (!c) { c = TILES[key] = mk(cols, rows); c.g = c.getContext('2d'); c.img = c.g.createImageData(cols, rows); c.sig = ''; }
    ab = clamp(ab, 0, 1); det = clamp(det || 0, 0, 1);
    var sig = (pic ? pic.name : '-') + ab.toFixed(4) + det.toFixed(3) + (eps2 ? mixk.toFixed(3) : '');
    if (c.sig === sig) return c;
    c.sig = sig;
    var d = c.img.data, sa = Math.sqrt(ab), sn = Math.sqrt(1 - ab), n = cols * rows;
    for (var i = 0; i < n; i++) {
      var e = eps2 ? lerp(eps2[i], eps[i], mixk) : eps[i];
      for (var ch = 0; ch < 3; ch++) {
        var p = pic ? lerp(pic.blur[i * 3 + ch], pic.sharp[i * 3 + ch], det) : .5;
        var x = sa * (2 * p - 1) + sn * e, v = (clamp(x, -1, 1) + 1) / 2;
        d[i * 4 + ch] = RGB0[ch] + (RGB1[ch] - RGB0[ch]) * v;
      }
      d[i * 4 + 3] = 255;
    }
    c.g.putImageData(c.img, 0, 0); return c;
  }
  function cells(g, c, dx, dy, dw, dh, sx, sy, sw, sh) {
    g.save(); g.imageSmoothingEnabled = false;
    if (sx == null) g.drawImage(c, dx, dy, dw, dh); else g.drawImage(c, sx, sy, sw, sh, dx, dy, dw, dh);
    g.restore();
  }
  function staticCv() { return noisy('static', FC, FR, EPS, null, 0, 0); }
  /* the old-TV rolling bar: a brighter band drifting down (the pattern itself never changes) */
  function tvRoll(g, t, a, y0, h) {
    y0 = y0 == null ? FY : y0; h = h || FH;
    var y = y0 + ((t * 240) % (h + 320)) - 160;
    g.save(); g.globalAlpha *= a; g.beginPath(); g.rect(0, y0, W, h); g.clip();
    var lg = g.createLinearGradient(0, y - 110, 0, y + 110); lg.addColorStop(0, 'rgba(255,250,240,0)'); lg.addColorStop(.5, 'rgba(255,250,240,.16)'); lg.addColorStop(1, 'rgba(255,250,240,0)');
    g.fillStyle = lg; g.fillRect(0, y - 110, W, 220);
    g.fillStyle = 'rgba(21,19,27,.18)'; g.fillRect(0, y + 120, W, 5);
    var cy = y0 + ((t * 90 + 400) % h), cg = g.createLinearGradient(0, cy - 40, 0, cy + 46); cg.addColorStop(0, 'rgba(255,91,61,0)'); cg.addColorStop(.47, 'rgba(255,91,61,.22)'); cg.addColorStop(.53, 'rgba(255,91,61,.22)'); cg.addColorStop(1, 'rgba(255,91,61,0)');
    g.fillStyle = cg; g.fillRect(0, cy - 40, W, 86); g.fillStyle = 'rgba(255,91,61,.8)'; g.fillRect(0, cy, W, 6);
    g.restore();
  }
  function drawStatic(g, t, a) { cells(g, staticCv(), 0, FY, W, FH); tvRoll(g, t, a == null ? 1 : a); }
  /* level L (0..50 steps) → signal ᾱ, detail, crisp overlay */
  function levAB(L) { return 1 - Math.pow(1 - clamp(L / 50, 0, 1), 2.5); }
  function fieldAt(g, L, kind, key) {
    var pic = kind ? PICS[kind] : null;
    cells(g, noisy('field' + key, FC, FR, EPS, pic, L <= 0 ? 0 : levAB(L), ss(seg(L, 28, 49))), 0, FY, W, FH);
    var cr = pic ? seg(L, 46, 50) : 0;
    if (cr > 0) { g.save(); g.globalAlpha *= cr; g.drawImage(pic.full, 0, FY); g.restore(); }
  }

  /* ---------- the cat and the dog: one sitting pose, bold cream silhouettes, one coral collar (drawn, not generated) ---------- */
  function tri(g, a, b, c, d, e, f) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.lineTo(e, f); g.closePath(); g.fill(); }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  function drawPet(g, x, y, s, kind, fill) {
    var dog = kind === 'dog'; fill = fill || CREAM;
    g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
    g.fillStyle = 'rgba(0,0,0,.25)'; el(g, 12, 4, 215, 26);
    g.strokeStyle = fill; g.lineWidth = 46; g.beginPath();
    if (dog) { g.moveTo(120, -40); g.bezierCurveTo(232, -70, 272, -190, 244, -292); }
    else { g.moveTo(110, -20); g.bezierCurveTo(272, -10, 302, -172, 214, -238); }
    g.stroke();
    g.fillStyle = fill; g.beginPath(); g.moveTo(-78, -330); g.bezierCurveTo(-160, -300, -195, -130, -178, -24); g.quadraticCurveTo(-172, 0, -140, 0);
    g.lineTo(140, 0); g.quadraticCurveTo(172, 0, 178, -24); g.bezierCurveTo(195, -130, 160, -300, 78, -330); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.5)'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(-48, -190); g.lineTo(-52, -10); g.moveTo(48, -190); g.lineTo(52, -10); g.stroke();
    g.beginPath(); g.moveTo(-100, -6); g.quadraticCurveTo(-76, -30, -52, -6); g.moveTo(52, -6); g.quadraticCurveTo(76, -30, 100, -6); g.stroke();
    if (!dog) {
      g.fillStyle = fill; tri(g, -124, -452, -106, -586, -28, -515); tri(g, 124, -452, 106, -586, 28, -515);
      g.fillStyle = '#e7b4a4'; tri(g, -104, -472, -97, -550, -54, -511); tri(g, 104, -472, 97, -550, 54, -511);
    }
    g.fillStyle = fill; el(g, 0, -425, dog ? 122 : 128, dog ? 112 : 106);
    g.fillStyle = INK; g.strokeStyle = INK;
    if (dog) {
      g.fillStyle = TAN; el(g, -124, -400, 46, 102, .3); el(g, 124, -400, 46, 102, -.3);
      el(g, 52, -452, 42, 36, -.2);
      g.fillStyle = '#fffaf0'; el(g, 0, -370, 74, 56);
      g.fillStyle = INK; el(g, 0, -398, 29, 20);
      g.lineWidth = 6; g.beginPath(); g.moveTo(0, -380); g.lineTo(0, -352); g.moveTo(-36, -346); g.quadraticCurveTo(-16, -334, 0, -352); g.quadraticCurveTo(16, -334, 36, -346); g.stroke();
      el(g, -50, -452, 16, 17); el(g, 52, -452, 16, 17);
      g.fillStyle = CREAM; el(g, -45, -458, 5, 5); el(g, 57, -458, 5, 5);
    } else {
      g.fillStyle = '#86bf5e'; el(g, -50, -438, 23, 27, .12); el(g, 50, -438, 23, 27, -.12);
      g.fillStyle = INK; el(g, -50, -438, 6, 22); el(g, 50, -438, 6, 22);
      g.fillStyle = HOT; tri(g, -15, -394, 15, -394, 0, -377);
      g.lineWidth = 5; g.beginPath(); g.moveTo(0, -377); g.quadraticCurveTo(-10, -360, -27, -364); g.moveTo(0, -377); g.quadraticCurveTo(10, -360, 27, -364); g.stroke();
      g.globalAlpha *= .6; g.lineWidth = 4; g.beginPath();
      for (var k = -1; k <= 1; k++) { g.moveTo(-62, -386 + k * 12); g.lineTo(-184, -396 + k * 28); g.moveTo(62, -386 + k * 12); g.lineTo(184, -396 + k * 28); }
      g.stroke(); g.globalAlpha /= .6;
    }
    g.strokeStyle = HOT; g.lineWidth = 26; g.beginPath(); g.ellipse(0, -330, 86, 26, 0, .15, Math.PI - .15); g.stroke();
    g.fillStyle = YEL; el(g, 0, -296, 16, 16);
    g.restore();
  }
  /* the painted picture (field px 1080 × 1452): a dim room, a rug, the pet */
  var PET = { x: 540, y: 820, s: .86 };
  function roomPic(kind) {
    return function (g, w, h) {
      g.fillStyle = '#2b2637'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(244,237,224,.10)'; g.fillRect(700, 120, 230, 300); g.fillStyle = '#2b2637'; g.fillRect(810, 120, 10, 300); g.fillRect(700, 265, 230, 10);
      g.fillStyle = '#3b3449'; g.fillRect(0, 820, w, h - 820);
      g.fillStyle = '#4a405c'; el(g, 540, 826, 340, 56);
      drawPet(g, PET.x, PET.y, PET.s, kind);
    };
  }
  /* the training photo: an orange cat on a porch (drawn) */
  function photoPic(g, w, h) {
    g.fillStyle = '#d9b48a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,80,40,.25)'; g.lineWidth = 4; for (var y = 30; y < 360; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#9cc5d9'; g.fillRect(310, 50, 160, 180); g.strokeStyle = '#f7f0e2'; g.lineWidth = 12; g.strokeRect(310, 50, 160, 180);
    g.lineWidth = 8; g.beginPath(); g.moveTo(390, 50); g.lineTo(390, 230); g.moveTo(310, 140); g.lineTo(470, 140); g.stroke();
    g.fillStyle = '#8a5a3a'; g.fillRect(0, 360, w, h - 360);
    g.strokeStyle = '#6e4429'; g.lineWidth = 4; [392, 428, 470].forEach(function (yy) { g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); });
    drawPet(g, 200, 432, .58, 'cat', ORANGE);
  }

  /* ---------- the magnifier: the lens shows the same static at 2× ---------- */
  function magPos(tau) { return [540 + 160 * Math.sin(tau * 1.7 + 2.2), 1000 + 190 * Math.sin(tau * 1.15 + .35)]; }
  function magnifier(g, x, y, r, a, inner) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    g.save(); g.translate(x, y); g.rotate(2.3);
    rr(g, r - 4 + 8, -21 + 12, 210, 42, 18); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    rr(g, r - 4, -16, 60, 32, 8); g.fillStyle = '#8e919c'; g.fill();
    rr(g, r + 50, -24, 160, 48, 20); g.fillStyle = HOT; g.fill();
    g.restore();
    g.save(); g.beginPath(); g.arc(x, y, r, 0, 6.283); g.clip(); inner(g); g.fillStyle = 'rgba(255,250,240,.06)'; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 6; g.beginPath(); g.arc(x + 4, y + 6, r + 12, 0, 6.283); g.stroke();
    g.save(); g.shadowColor = 'rgba(255,91,61,.9)'; g.shadowBlur = 16; g.strokeStyle = HOT; g.lineWidth = 22; g.beginPath(); g.arc(x, y, r + 8, 0, 6.283); g.stroke(); g.restore();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, r * .74, 3.65, 4.4); g.stroke();
    g.restore();
  }
  function lensStatic(x, y, z, cvs, dx, dy, dw, dh, extra) {
    return function (g) { g.translate(x, y); g.scale(z, z); g.translate(-x, -y); cells(g, cvs || staticCv(), dx == null ? 0 : dx, dy == null ? FY : dy, dw || W, dh || FH); if (extra) extra(g); };
  }
  /* the tease: for about 0.4 s near 1.0 s two faint ear shapes almost show in the static (a 15 % bias on a few cells), then break up.
     Nothing is there: the field itself (#4127) never changes, and NEVER IN THERE later shows it plain. */
  var EAR = (function () { var c = [], r = mulberry(31);
    [[-3, 0], [3, 0], [-3, 1], [-2, 1], [2, 1], [3, 1], [-4, 2], [-3, 2], [-2, 2], [2, 2], [3, 2], [4, 2], [-4, 3], [-3, 3], [-2, 3], [-1, 3], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [-5, 4], [5, 4], [-5, 5], [5, 5]]
      .forEach(function (p) { c.push([p[0], p[1], r()]); });
    return c; })();
  var EART = .95;
  function earTease(g, t) {
    var on = ss(seg(t, .62, .74)), brk = seg(t, 1.09, 1.34);
    if (on <= 0 || brk >= 1) return;
    var m = magPos(t), ox = Math.round(m[0] / CELL) * CELL, oy = FY + Math.round((m[1] - 40 - FY) / CELL) * CELL;
    g.save(); g.fillStyle = BG; g.globalAlpha = on * .5 * (1 - brk); g.fillRect(m[0] - 80, m[1] - 80, 160, 160);
    g.fillStyle = CREAM;
    EAR.forEach(function (e) { if (e[2] < brk) return; g.globalAlpha = on * (.78 + e[2] * .2); g.fillRect(ox + e[0] * CELL, oy + e[1] * CELL, CELL, CELL); });
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · hook + can: find the cat in this static. You can't. AI image generators can. How?
     ===================================================================================================== */
  var CHIP_T = 1.6;
  function hookScene(g, t, idle) {
    var home = idle != null, ti = home ? idle : t;
    drawStatic(g, ti);
    var m = magPos(ti), cant = home ? 99 : wend('can', 'cant'), how = home ? 99 : at('can', 'how'), can2 = home ? 99 : at('can', 'can');
    magnifier(g, m[0], m[1], 165, 1, lensStatic(m[0], m[1], 2.2, null, null, null, null, null, home ? null : function (g) { earTease(g, t); }));
    if (home) return;
    var nk = win(t, cant - .12, how - .15, .25);
    cross(g, m[0], m[1], 2.3, HOT, nk, 15);
    chip(g, 'NO CAT', m[0], m[1] - 225, { px: 46, wt: 900, bg: BG, fg: CREAM, a: nk, s: lerp(.85, 1, clamp(nk, 0, 1)) });
    var ck = clamp(sp(t, CHIP_T, 3) * 2, 0, 1);
    chip(g, 'AI IMAGE GENERATORS', 540, 548, { px: 50, wt: 900, bg: HOT, fg: BG, a: ck, s: lerp(.8, 1, clamp(sp(t, CHIP_T, 3), 0, 1)) * (1 + Math.max(0, knock(t, can2, 16, 6)) * .08) });
    label(g, 'like Stable Diffusion', 540, 628, clamp(sp(t, CHIP_T + .25, 3) * 2, 0, 1), CREAM, 40, 'center', true);
    /* the big question mark on "How?" */
    var qk = pop(t, how - .04, 3.2, .8);
    if (qk > 0) {
      g.save(); g.translate(540, 1010); g.rotate(-.08); g.scale(lerp(1.4, 1, clamp(qk, 0, 1)), lerp(1.4, 1, clamp(qk, 0, 1))); g.globalAlpha *= clamp(qk * 3, 0, 1);
      g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 10, 16, 165, 165); g.fillStyle = HOT; el(g, 0, 0, 165, 165);
      font(g, 250, 900); g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 12); g.restore();
    }
  }
  /* FIND THE CAT: the only words on frame 0; CAT lights when it is said */
  function headline(g, t, a, idle) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    var px = 132; font(g, px, 900); try { g.fontStretch = 'expanded'; } catch (e) {}
    var s1 = 'FIND THE ', s2 = 'CAT', tw = g.measureText(s1 + s2).width;
    if (tw > 740) { px = Math.floor(px * 740 / tw); font(g, px, 900); try { g.fontStretch = 'expanded'; } catch (e) {} }
    var w1 = g.measureText(s1).width, w2 = g.measureText(s2).width, x = 540 - (w1 + w2) / 2, y = 330;
    var lit = idle ? 1 : seg(t, at('hook', 'cat') - .05, at('hook', 'cat') + .12), kk = idle ? 0 : Math.max(0, knock(t, at('hook', 'cat'), 16, 6));
    g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = CREAM; g.fillText(s1, x, y);
    g.save(); g.translate(x + w1 + w2 / 2, y); g.scale(1 + .06 * kk, 1 + .06 * kk);
    rr(g, -w2 / 2 - 14, -px * .6, (w2 + 28) * lit, px * 1.2, 16); g.fillStyle = HOT; if (lit > 0) g.fill();
    g.fillStyle = lit > .6 ? BG : CREAM; g.textAlign = 'center'; g.fillText(s2, 0, 0);
    g.restore(); g.restore();
  }

  /* =====================================================================================================
     SCENE 2 · trick: they learned it backwards (a filmstrip: photo → static, and the coral arrow back)
     ===================================================================================================== */
  var STRIP = [0, 250, 600, 1000];
  function photoTile(key, step, det) { return noisy(key, PC, PC, EPS_P, PICS.photo, AB[Math.round(clamp(step, 0, 1000))], det == null ? 1 : det); }
  function trickScene(g, t) {
    var s0 = S('trick').t0, trick = at('trick', 'trick'), back = at('trick', 'backwards');
    var sw = 800, sh = 296, sx = 510, sy = 1010, fw = 180;
    var sl = eo(seg(t, s0 - .3, s0 + .2)), ox = (1 - sl) * 320 - eio(seg(t, back - .1, back + .6)) * 0;
    g.save(); g.translate(ox, 0); g.globalAlpha *= sl;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, sx - sw / 2 + 10, sy - sh / 2 + 16, sw, sh, 10); g.fill();
    g.fillStyle = '#0d0c11'; rr(g, sx - sw / 2, sy - sh / 2, sw, sh, 10); g.fill();
    g.fillStyle = 'rgba(244,237,224,.75)';
    for (var i = 0; i < 17; i++) { var hx = sx - sw / 2 + 24 + i * 46.2; rr(g, hx, sy - sh / 2 + 10, 22, 16, 4); g.fill(); rr(g, hx, sy + sh / 2 - 26, 22, 16, 4); g.fill(); }
    STRIP.forEach(function (st, j) {
      var fx = sx - sw / 2 + 25 + fw / 2 + j * 190, fk = clamp(sp(t, s0 - .3 + j * .05, 3) * 2, 0, 1);
      if (fk <= 0) return;
      g.save(); g.globalAlpha *= fk;
      cells(g, photoTile('strip' + j, st), fx - fw / 2, sy - fw / 2, fw, fw);
      g.restore();
    });
    g.restore();
    /* forward: add static → */
    var ak = eio(seg(t, s0 + .35, trick + .2));
    arrow(g, 140, 1215, 880, 1215, ak, CREAM, 7);
    label(g, 'ADD STATIC', 510, 1278, seg(t, s0 + .5, s0 + .8), CREAM, 40);
    /* backwards: the coral arrow, learn to undo it */
    var bk = eio(seg(t, back - .2, back + .3));
    arrow(g, 880, 805, 140, 805, bk, HOT, 12, 46);
    label(g, 'LEARN TO UNDO IT', 510, 735, seg(t, back - .05, back + .2), HOT, 46);
  }

  /* =====================================================================================================
     SCENE 3 · photo + more: a real photo, a salt shaker of static, step 1 → 1,000 until it's pure noise
     ===================================================================================================== */
  var PH = { x: 510, y: 1000, w: 640, h: 760 };
  function stepKF(t) {
    var kf = [[at('photo', 'sprinkle') - .1, 0], [end('photo') + .1, 50], [at('more', 'more') + .2, 250], [at('more', 'more', 1) + .2, 600], [at('more', 'pure') + .15, 1000]];
    if (t <= kf[0][0]) return 0;
    for (var i = 1; i < kf.length; i++) if (t < kf[i][0]) { var k = eio(seg(t, kf[i - 1][0], kf[i][0])); return lerp(kf[i - 1][1], kf[i][1], i === 1 ? seg(t, kf[0][0], kf[1][0]) : k); }
    return 1000;
  }
  function shakerWins() { return [[at('photo', 'sprinkle') - .15, end('photo') + .1, 1], [at('more', 'more') - .1, at('more', 'pure') + .1, 1.6]]; }
  function shaker(g, x, y, rot, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, -52 + 8, -90 + 12, 104, 170, 22); g.fill();
    rr(g, -52, -90, 104, 170, 22); g.fillStyle = 'rgba(214,226,232,.92)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; g.stroke();
    var r = mulberry(12); g.fillStyle = INK; for (var i = 0; i < 70; i++) { g.globalAlpha = .5 + r() * .5; g.fillRect(-42 + r() * 84, -20 + r() * 92, 6, 6); }
    g.fillStyle = CREAM; for (i = 0; i < 40; i++) g.fillRect(-42 + r() * 84, -20 + r() * 92, 6, 6);
    g.globalAlpha = 1;
    rr(g, -56, -126, 112, 44, 12); g.fillStyle = '#b9bcc6'; g.fill();
    g.fillStyle = '#5a5d68'; for (i = 0; i < 5; i++) el(g, -32 + i * 16, -118, 3.5, 3.5);
    g.restore();
  }
  function photoScene(g, t) {
    var s0 = S('photo').t0, spr = at('photo', 'sprinkle'), more1 = at('more', 'more');
    var dk = pop(t, s0 + .02, 2.2), step = stepKF(t);
    var ab = AB[Math.round(step)];
    sheet(g, PH.x, PH.y - (1 - Math.min(1, dk)) * 160, PH.w, PH.h, lerp(.08, -.02, clamp(dk, 0, 1)) + Math.sin(t * 1.3) * .006, clamp(dk * 3, 0, 1), function (g) {
      cells(g, noisy('photo', PC, PC, EPS_P, PICS.photo, ab, 1), -280, -350, 560, 560);
      font(g, 40, 600, MONO); ls(g, 3); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TRAINING PHOTO', 0, 258);
      font(g, 32, 500, MONO); g.fillStyle = REDINK; g.fillText('DRAWN STAND-IN', 0, 318);
    });
    /* the shaker tips over the photo and shakes on the sprinkle words */
    var wins = shakerWins(), shk = 0;
    wins.forEach(function (w) { shk = Math.max(shk, win(t, w[0], w[1], .2) * w[2]); });
    var sa = clamp(sp(t, spr - .55, 2.6) * 2, 0, 1), tip = eio(seg(t, spr - .5, spr - .1));
    var sx = 770, sy = 560 + Math.sin(t * 31) * 10 * shk, srot = lerp(.3, 2.55, tip) + Math.sin(t * 26) * .1 * shk;
    /* grains: seeded, fall from the cap onto the photo while shaking */
    var r = mulberry(5);
    wins.forEach(function (w) {
      for (var i = 0; i < 70 * w[2]; i++) {
        var t0 = lerp(w[0], w[1], r()), lx = 250 + r() * 520, ly = 660 + r() * 540, ft = t - t0;
        if (ft < 0 || ft > .5) continue;
        var cx = sx + Math.cos(srot - Math.PI / 2) * 120, cy = sy + Math.sin(srot - Math.PI / 2) * 120;
        var u = ft / .5, x = lerp(cx, lx, u), y = lerp(cy, ly, u * u);
        g.fillStyle = r() < .5 ? CREAM : '#8a8494'; g.globalAlpha = 1 - seg(u, .85, 1); g.fillRect(x - 4, y - 4, 8, 8); g.globalAlpha = 1;
      }
    });
    shaker(g, sx, sy, srot, sa * (1 - seg(t, at('more', 'pure') + .3, at('more', 'noise') + .4)));
    /* the step counter */
    var stA = clamp(sp(t, spr - .1, 3) * 2, 0, 1), last = Math.round(step);
    chip(g, 'STEP ' + commas(Math.max(1, last)), 310, 640, { px: 54, wt: 900, bg: HOT, fg: BG, a: stA, rot: -.05, s: 1 + Math.max(0, knock(t, at('more', 'pure') + .15, 16, 6)) * .08 });
    label(g, 'DDPM 2020: 1,000 steps', 110, 572, seg(t, more1 + .1, more1 + .4), CREAM, 36, 'left');
    var nz = Math.sqrt(1 - ab), nA = clamp(sp(t, spr - .1, 3) * 2, 0, 1);
    if (nA > 0) {
      label(g, 'NOISE ' + Math.round(nz * 100) + '%', 110, 1420, nA, CREAM, 36, 'left');
      g.save(); g.globalAlpha *= nA; rr(g, 420, 1402, 490, 36, 18); g.fillStyle = FAINT; g.fill(); rr(g, 420, 1402, 36 + 454 * nz, 36, 18); g.fillStyle = HOT; g.fill(); g.restore();
    }
    /* re-hook: pure noise looks just like the puzzle */
    var pure = at('more', 'pure'), zk = eio(seg(t, pure + .3, pure + .7));
    if (zk > 0) {
      g.save(); g.globalAlpha *= zk; cells(g, noisy('rehook', FC, FR, EPS_R, null, 0, 0), 0, FY, W, FH); tvRoll(g, t, 1); g.restore();
      var ca = clamp(sp(t, pure + .45, 3) * 2, 0, 1), cs = lerp(1.2, 1, clamp(sp(t, pure + .45, 3), 0, 1));
      chip(g, 'EVERY PHOTO', 510, 700, { px: 64, wt: 900, bg: HOT, fg: BG, a: ca, rot: -.03, s: cs });
      chip(g, 'ENDS UP LIKE THIS', 510, 800, { px: 64, wt: 900, bg: HOT, fg: BG, a: clamp(sp(t, pure + .55, 3) * 2, 0, 1), rot: -.03, s: cs });
    }
  }

  /* =====================================================================================================
     SCENE 4 · guess: its one job, guess which static you added (two tiles; the guess morphs into a match)
     ===================================================================================================== */
  function guessScene(g, t) {
    var s0 = S('guess').t0, job = at('guess', 'job'), gs = at('guess', 'guess'), added = at('guess', 'added');
    var ts = 380, ly = 1030, Lx = 300, Rx = 720;
    var mk1 = eio(seg(t, gs - .15, added + .3));
    [[Lx, 'STATIC ADDED', 0], [Rx, 'ITS GUESS', 1]].forEach(function (d, j) {
      var a = clamp(sp(t, s0 + .05 + j * .18, 2.8) * 2, 0, 1), rot = (j ? .02 : -.02) + Math.sin(t * 1.1 + j) * .006;
      if (a <= 0) return;
      g.save(); g.globalAlpha *= a; g.translate(d[0], ly + (1 - a) * 40); g.rotate(rot);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-ts / 2 - 8 + 10, -ts / 2 - 8 + 14, ts + 16, ts + 16);
      g.fillStyle = CREAM; g.fillRect(-ts / 2 - 8, -ts / 2 - 8, ts + 16, ts + 16);
      cells(g, j ? noisy('guessR', PC, PC, EPS_P, null, 0, 0, EPS_G, mk1) : noisy('guessL', PC, PC, EPS_P, null, 0, 0), -ts / 2, -ts / 2, ts, ts);
      g.restore();
      label(g, d[1], d[0], ly - ts / 2 - 52, a, CREAM, 40);
    });
    /* ≈ between them when they match */
    var mt = pop(t, added + .25, 3);
    if (mt > 0) { g.save(); g.globalAlpha *= clamp(mt * 2, 0, 1); g.fillStyle = BG; el(g, 510, ly, 46, 46); font(g, 84, 900); g.fillStyle = HOT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('=', 510, ly + 4); g.restore(); }
    /* the miss meter */
    var ma = clamp(sp(t, job - .1, 3) * 2, 0, 1);
    if (ma > 0) {
      var mp = lerp(100, 3, mk1) + Math.sin(t * 13) * 2 * (1 - mk1);
      label(g, 'MISS ' + Math.round(mp) + '%', 110, 1330, ma, CREAM, 40, 'left');
      g.save(); g.globalAlpha *= ma; rr(g, 390, 1294, 520, 72, 36); g.fillStyle = FAINT; g.fill();
      rr(g, 390, 1294, 72 + 448 * mp / 100, 72, 36); g.fillStyle = HOT; g.fill(); g.restore();
    }
    stamp(g, 'MATCH', Rx, ly + 130, t, added + .3, S('guess').t1 + 1, 64, REDINK, -.12);
  }

  /* =====================================================================================================
     SCENE 5 · good: hundreds of millions of pictures (cards flick past, the counter rolls)
     ===================================================================================================== */
  var CARDC = ['#9cc5d9', '#e9d4a6', '#b9d7a0', '#f0c0a8', '#d4c3e8', '#f3e1a0', '#a8d8c8', '#e8b7c4'];
  function icon(g, i, s) {
    g.save(); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
    var k = i % 8;
    if (k === 0) drawPet(g, 0, 120, .42, 'cat', ORANGE);
    else if (k === 1) drawPet(g, 0, 120, .42, 'dog', '#f7f0e2');
    else if (k === 2) { g.fillStyle = '#f7f0e2'; g.fillRect(-90, -20, 180, 140); g.fillStyle = REDINK; tri(g, -115, -15, 115, -15, 0, -120); g.fillStyle = '#6e4429'; g.fillRect(-25, 50, 50, 70); }
    else if (k === 3) { g.fillStyle = '#6e4429'; g.fillRect(-18, 20, 36, 100); g.fillStyle = '#4f8a3c'; el(g, 0, -30, 100, 95); }
    else if (k === 4) { g.fillStyle = '#3450c4'; rr(g, -130, -10, 260, 80, 22); g.fill(); rr(g, -70, -70, 130, 70, 20); g.fill(); g.fillStyle = INK; el(g, -75, 75, 30, 30); el(g, 75, 75, 30, 30); }
    else if (k === 5) { g.fillStyle = '#6e4429'; g.beginPath(); g.moveTo(-130, 40); g.lineTo(130, 40); g.lineTo(95, 100); g.lineTo(-95, 100); g.closePath(); g.fill(); g.fillStyle = '#f7f0e2'; tri(g, -5, 30, -5, -130, 95, 30); }
    else if (k === 6) { g.strokeStyle = '#4f8a3c'; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 120); g.stroke(); g.fillStyle = REDINK; for (var p = 0; p < 6; p++) el(g, Math.cos(p * 1.047) * 45, -40 + Math.sin(p * 1.047) * 45, 34, 34); g.fillStyle = YEL; el(g, 0, -40, 28, 28); }
    else { g.fillStyle = '#5a5d68'; tri(g, -150, 110, -30, -90, 90, 110); g.fillStyle = '#7d808c'; tri(g, -20, 110, 70, -40, 160, 110); g.fillStyle = YEL; el(g, 100, -80, 30, 30); }
    g.restore();
  }
  function card(g, x, y, w, h, rot, i, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-w / 2 + 10, -h / 2 + 14, w, h);
    g.fillStyle = '#f7f2e6'; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = CARDC[i % 8]; g.fillRect(-w / 2 + 16, -h / 2 + 16, w - 32, h - 32);
    g.save(); g.beginPath(); g.rect(-w / 2 + 16, -h / 2 + 16, w - 32, h - 32); g.clip(); g.translate(0, 0); icon(g, i, w / 330); g.restore();
    g.restore();
  }
  var NFL = 26;
  function flickT(i) { var a = at('good', 'hundreds') - .25, b = at('good', 'pictures') + .35; return lerp(a, b, Math.pow(i / NFL, .62)); }
  function goodScene(g, t) {
    var s0 = S('good').t0, hund = at('good', 'hundreds'), pics = at('good', 'pictures'), good = at('good', 'good');
    var cw = 380, ch = 450, cx = 500, cy = 760, n = 0;
    for (var i = 0; i < NFL; i++) if (t >= flickT(i)) n = i + 1;
    var ak = clamp(sp(t, s0 + .02, 2.6) * 2, 0, 1);
    var fan = eio(seg(t, hund - .2, pics + .5));
    for (var q = 3; q >= 1; q--) [-1, 1].forEach(function (sd) { var fx = cx + sd * fan * (q * 100 + 10), fy = cy + 40 + q * 18 * fan; card(g, fx, fy, 240, 290, sd * q * .09 * fan + (hash(q * 7 + sd) - .5) * .05, (q * 3 + (sd > 0 ? 1 : 0)) % 8 + 2, fan * ak); });
    for (var j = 3; j >= 0; j--) card(g, cx + j * 10, cy + j * 12 - (1 - ak) * 60, cw, ch, (hash(n + j) - .5) * .12, n + j, ak);
    if (n > 0) {
      var f = seg(t, flickT(n - 1), flickT(n - 1) + .3), fi = n - 1;
      if (f < 1) card(g, cx - eio(f) * 620, cy - Math.sin(f * 3.14) * 60, cw, ch, -eio(f) * .6 + (hash(fi) - .5) * .12, fi, 1 - seg(f, .7, 1));
    }
    /* 225,000 steps × batch 2,048 = 460.8 million training looks in Stable Diffusion v1-4's last round alone (model card) */
    var vk = eio(seg(t, hund - .1, pics + .4)), val = 460000000 * vk;
    if (t > hund - .2) {
      g.save(); var px = 108; font(g, px, 900); try { g.fontStretch = 'expanded'; } catch (e) {}
      var str = vk >= 1 ? '460,000,000+' : Math.max(1, Math.floor(val / 1e6)) + ' MILLION', cwid = g.measureText('460,000,000+').width;
      if (cwid > 740) { px = Math.floor(px * 740 / cwid); font(g, px, 900); try { g.fontStretch = 'expanded'; } catch (e) {} }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = HOT; g.globalAlpha *= clamp((t - hund + .2) * 5, 0, 1);
      var s = 1 + Math.max(0, knock(t, pics + .4, 14, 6)) * .04; g.translate(510, 1098); g.scale(s, s);
      g.fillText(str, 0, 0); g.restore();
      label(g, 'TRAINING LOOKS', 510, 1188, seg(t, hund, hund + .3), CREAM, 48);
      label(g, 'IN THE LAST ROUND ALONE', 510, 1252, seg(t, hund + .2, hund + .5), CREAM, 48);
      block(g, ['Stable Diffusion v1-4 model card:', '225k steps × batch 2,048'], 510, 1352, 34, seg(t, pics, pics + .3));
    }
    stamp(g, 'REALLY GOOD', 600, 580, t, good - .03, S('good').t1 + 1, 62, REDINK, -.1);
  }

  /* =====================================================================================================
     SCENE 6 · paint: flip it; start from pure static (#4127); wipe away a little noise about 50 times; the prompt steers
     ===================================================================================================== */
  /* the wipe schedule: [t0, t1, from, to, n sweeps, pace exponent, kind] */
  var SEGS = [];
  function levelAt(t) {
    var L = 0, kind = 'cat';
    for (var i = 0; i < SEGS.length; i++) {
      var s = SEGS[i];
      if (t < s.a) break;
      if (t >= s.b) { L = s.to; kind = s.kind; continue; }
      var u = (t - s.a) / (s.b - s.a), k = clamp(Math.floor(s.n * Math.pow(u, 1 / s.p)), 0, s.n - 1);
      var uk = Math.pow(k / s.n, s.p), uk1 = Math.pow((k + 1) / s.n, s.p), d = (s.to - s.from) / s.n;
      return { old: s.from + k * d, nw: s.from + (k + 1) * d, fr: (u - uk) / (uk1 - uk), up: s.to < s.from, kind: s.kind, seg: s, k: k };
    }
    return { old: L, nw: L, fr: -1, kind: kind };
  }
  function squeegee(g, y, up, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    var lg = g.createLinearGradient(0, up ? y : y - 70, 0, up ? y + 70 : y); lg.addColorStop(up ? 0 : 1, 'rgba(0,0,0,.35)'); lg.addColorStop(up ? 1 : 0, 'rgba(0,0,0,0)');
    g.fillStyle = lg; g.fillRect(0, up ? y : y - 70, W, 70);
    g.fillStyle = CREAM; g.fillRect(0, y - 9, W, 18);
    g.fillStyle = HOT; g.fillRect(0, up ? y - 15 : y + 9, W, 7);
    g.restore();
  }
  function sweepField(g, t, st) {
    st = st || levelAt(t);
    if (st.fr < 0) { fieldAt(g, st.old, st.kind, 'A'); return st; }
    var y = st.up ? FY + FH * (1 - st.fr) : FY + FH * st.fr;
    fieldAt(g, st.old, st.kind, 'A');
    g.save(); g.beginPath(); if (st.up) g.rect(0, y, W, FY + FH - y); else g.rect(0, FY, W, y - FY); g.clip(); fieldAt(g, st.nw, st.kind, 'B'); g.restore();
    squeegee(g, y, st.up, 1);
    st.y = y; return st;
  }
  function promptText(t) {
    var p = at('steer', 'prompt') - .1, typ = at('dog2', 'type') - .05, dg = at('dog2', 'dog') - .3;
    var catS = 'a cat', n;
    if (t < typ) { n = Math.round(clamp((t - p) / .4, 0, 1) * catS.length); return catS.slice(0, n); }
    if (t < dg) { n = Math.round(clamp((t - typ) / .2, 0, 1) * 3); return catS.slice(0, catS.length - n); }
    n = Math.round(clamp((t - dg) / .22, 0, 1) * 3); return 'a ' + 'dog'.slice(0, n);
  }
  function promptBar(g, x, y, w, txt, t, a, ph) {
    if (a <= 0) return;
    var h = 96;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    rr(g, x - w / 2 + 6, y - h / 2 + 10, w, h, 22); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, x - w / 2, y - h / 2, w, h, 22); g.fillStyle = BG; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
    font(g, 30, 600, MONO); ls(g, 3); g.fillStyle = HOT; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(ph ? '' : 'PROMPT', x - w / 2 + 28, y + 2);
    ls(g, 0); font(g, 52, 600, MONO); g.fillStyle = CREAM;
    var tx = ph ? x - w / 2 + 34 : x - w / 2 + 190, shown = txt;
    if (ph && !txt) { g.fillStyle = 'rgba(244,237,224,.55)'; g.fillText(ph, tx, y + 3); }
    else g.fillText(shown, tx, y + 3);
    var cwid = shown ? g.measureText(shown).width : (ph ? 0 : 0);
    if (Math.floor(t * 2.6) % 2 === 0) { g.fillStyle = HOT; g.fillRect(tx + cwid + 6, y - 28, 6, 58); }
    g.restore();
  }
  function paintScene(g, t) {
    var fl = at('flip', 'flip'), fa = fl - .25, fm = fl + .08, fb = fl + .42;
    if (t < fm) {
      var k = Math.cos(eio(seg(t, fa, fm)) * Math.PI / 2);
      g.save(); g.translate(540, 1000); g.scale(Math.max(.002, k), 1); g.translate(-540, -1000); goodScene(g, t); g.restore();
      return;
    }
    var k2 = Math.sin(eo(seg(t, fm, fb)) * Math.PI / 2), st = levelAt(t);
    g.save(); g.translate(540, 1000); g.scale(Math.max(.002, k2), 1); g.translate(-540, -1000);
    sweepField(g, t, st);
    if (st.fr < 0 && st.old <= 0) tvRoll(g, t, 1);
    g.restore();
    if (k2 < 1) return;
    var tw = S('twin').t0, out = 1 - seg(t, tw - .3, tw - .02);
    var sw1 = SEGS[0].a, stT = at('flip', 'static'), dogS = SEGS[4], dogF = SEGS[5];
    /* PURE STATIC #4127, then the step chip, then SAME STATIC on the rewind */
    var pureA = win(t, stT - .05, sw1 - .1, .2), sameA = win(t, dogS.b - .25, dogF.a + .05, .2);
    chip(g, 'PURE STATIC #4127', 540, 545, { px: 50, wt: 900, bg: CREAM, fg: BG, a: pureA });
    chip(g, 'SAME STATIC #4127', 540, 545, { px: 50, wt: 900, bg: CREAM, fg: BG, a: sameA, s: 1 + Math.max(0, knock(t, dogS.b - .25, 16, 6)) * .06 });
    var stepA = (t >= sw1 - .05 ? 1 : 0) * (1 - sameA) * out * (t > dogS.a - .05 && t < dogS.b ? 0 : 1);
    var shown = st.fr >= 0 ? Math.round(st.nw) : Math.round(st.old);
    if (stepA > 0 && shown > 0) chip(g, 'STEP ' + shown + '/50', 540, 545, { px: 54, wt: 900, bg: HOT, fg: BG, a: stepA });
    /* small print under "start from pure static" */
    var lpA = win(t, at('flip', 'start') - .05, sw1 + 1.1, .25);
    block(g, ['Stable Diffusion starts from random', 'noise in a compressed grid,', 'decoded at the end'], 540, 1352, 34, lpA, true);
    /* the 50-step chip and the illustration tag */
    var sdA = clamp((t - at('steps', '50') + .1) * 4, 0, 1) * out * (1 - lpA);
    label(g, 'Stable Diffusion default · 50 steps', 540, 1352, sdA, CREAM, 36, 'center', true);
    label(g, 'ILLUSTRATION · not real model output', 540, 1412, clamp((t - sw1 - 1.2) * 4, 0, 1) * out * (1 - lpA), CREAM, 30, 'center', true);
    /* the prompt, and its arrow into every wipe */
    var pa = clamp(sp(t, at('steer', 'prompt') - .15, 3) * 2, 0, 1) * out;
    promptBar(g, 540, 655, 700, promptText(t), t, pa);
    if (pa > 0 && st.fr >= 0 && !st.up && (st.seg === SEGS[3] || st.seg === SEGS[5])) {
      var ak = clamp(st.fr * 2.2, 0, 1);
      arrow(g, 540, 712, 540, lerp(712, 860, ak), 1, HOT, 9, 34);
    }
  }

  /* =====================================================================================================
     SCENE 7 · twin: same static → a cat or a dog (the DM frame); never: the magnifier finds nothing in the static
     ===================================================================================================== */
  var CROP = { x: 250, y: 290, w: 580, h: 682 };
  var CL = { x: 300, y: 1063, w: 376, h: 442 }, CRD = { x: 720, y: 1063, w: 376, h: 442 }, TH = { x: 510, y: 640, w: 360, h: 270, crop: { x: 190, y: 300, w: 700, h: 525 } };
  /* draws the field-px image `src` so that the field crop lands on rect r (k = 0) or identity (k = 1) */
  function cropTo(r, k) {
    var C = r.crop || CROP, s0 = r.w / C.w, ox0 = r.x - r.w / 2 - C.x * s0, oy0 = r.y - r.h / 2 - C.y * s0;
    return { s: lerp(s0, 1, k), ox: lerp(ox0, 0, k), oy: lerp(oy0, FY, k), clip: [lerp(r.x - r.w / 2, 0, k), lerp(r.y - r.h / 2, FY, k), lerp(r.w, W, k), lerp(r.h, FH, k)] };
  }
  function framed(g, r, k, fn, border) {
    var T = cropTo(r, k);
    g.save();
    if (border && k < 1) { var bw = 12 * (1 - k); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(T.clip[0] - bw + 10, T.clip[1] - bw + 14, T.clip[2] + bw * 2, T.clip[3] + bw * 2); g.fillStyle = CREAM; g.fillRect(T.clip[0] - bw, T.clip[1] - bw, T.clip[2] + bw * 2, T.clip[3] + bw * 2); }
    g.beginPath(); g.rect(T.clip[0], T.clip[1], T.clip[2], T.clip[3]); g.clip();
    g.translate(T.ox, T.oy); g.scale(T.s, T.s); fn(g); g.restore();
  }
  function petImg(kind) { return function (g) { g.drawImage(PICS[kind].full, 0, 0); }; }
  function staticImg(g) { cells(g, staticCv(), 0, 0, W, FH); }
  function twinLayout(g, t, o) {
    var dk = o.dk, ck = o.ck, thk = o.thk, out = o.out == null ? 1 : o.out, sx = o.sx || 0;
    if (thk > 0) {
      g.save(); g.globalAlpha *= clamp(thk, 0, 1); framed(g, TH, o.thGrow || 0, staticImg, true); g.restore();
      if (o.thGrow > 0) return;
    }
    g.save(); g.globalAlpha *= out;
    g.save(); g.translate(-sx, 0); framed(g, CL, 1 - ck, petImg('cat'), true); g.restore();
    g.save(); g.translate(sx, 0); framed(g, CRD, 1 - dk, petImg('dog'), true); g.restore();
    g.restore();
  }
  function twinScene(g, t) {
    var s0 = S('twin').t0, nev = at('never', 'never'), hid = wend('never', 'hiding'), pnt = at('never', 'painted'), e0 = S('twin').t1;
    var dk = eio(seg(t, s0, s0 + .6)), ck = eio(seg(t, s0 + .12, s0 + .7)), thk = eio(seg(t, s0 + .3, s0 + .75));
    /* the cat card slides in from the left: start it as a full-field copy pushed off screen */
    if (ck > 0) { g.save(); g.globalAlpha *= clamp(ck * 2, 0, 1); g.translate(-(1 - ck) * 620, 0); framed(g, CL, 0, petImg('cat'), true); g.restore(); }
    framed(g, CRD, 1 - dk, petImg('dog'), true);
    var fa = seg(t, e0 - .3, e0);
    g.save(); g.globalAlpha *= thk; framed(g, TH, 0, staticImg, true); g.restore();
    /* arrows from the static to both pictures */
    var ak = eio(seg(t, s0 + .55, s0 + .95)) * (1 - fa);
    g.save(); g.globalAlpha *= ak; font(g, 54, 900); g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ONE WORD CHANGED.', 510, 808); g.restore();
    chip(g, 'SAME STATIC #4127', TH.x, TH.y - TH.h / 2 - 4, { px: 42, wt: 900, bg: CREAM, fg: BG, a: thk * (1 - fa), rot: -.02 });
    var la = seg(t, s0 + .5, s0 + .8) * (1 - fa);
    block(g, ['ILLUSTRATION ·', 'not real model output'], 510, 1407, 36, clamp((t - s0 + .02) * 6, 0, 1) * (1 - fa));
    chip(g, 'a cat', CL.x, 1322, { px: 52, wt: 600, fam: MONO, bg: BG, fg: CREAM, line: CREAM, lw: 3, a: la, shadow: false });
    chip(g, 'a dog', CRD.x, 1322, { px: 52, wt: 600, fam: MONO, bg: BG, fg: CREAM, line: CREAM, lw: 3, a: la, shadow: false });
    /* never hiding: the magnifier crosses the static tile and finds nothing */
    var mk2 = seg(t, nev - .45, hid + .35);
    if (mk2 > 0 && mk2 < 1) {
      var mx = lerp(380, 640, eio(mk2)), my = TH.y + 20 + Math.sin(mk2 * 3.14) * -40, ma = Math.min(seg(mk2, 0, .15), 1 - seg(mk2, .85, 1));
      var T = cropTo(TH, 0);
      magnifier(g, mx, my, 92, ma, function (g) { g.translate(mx, my); g.scale(2, 2); g.translate(-mx, -my); g.beginPath(); g.rect(T.clip[0], T.clip[1], T.clip[2], T.clip[3]); g.clip(); g.translate(T.ox, T.oy); g.scale(T.s, T.s); staticImg(g); });
    }
    stamp(g, 'NEVER IN THERE', 510, 650, t, nev + .08, e0 - .3, 50, REDINK, -.08);
    /* painted in: one quick wipe across both pictures */
    var pk = seg(t, pnt - .12, pnt + .3);
    if (pk > 0 && pk < 1) {
      var y = lerp(CL.y - CL.h / 2, CL.y + CL.h / 2, eio(pk));
      g.save(); g.fillStyle = CREAM; g.fillRect(CL.x - CL.w / 2 - 12, y - 7, CL.w + 24, 14); g.fillRect(CRD.x - CRD.w / 2 - 12, y - 7, CRD.w + 24, 14);
      g.fillStyle = HOT; g.fillRect(CL.x - CL.w / 2 - 12, y + 7, CL.w + 24, 6); g.fillRect(CRD.x - CRD.w / 2 - 12, y + 7, CRD.w + 24, 6); g.restore();
    }
  }

  /* =====================================================================================================
     SCENE 8 · end: so what's hiding in this static? One word. Go. → frame 0
     ===================================================================================================== */
  function endScene(g, t) {
    var s0 = S('end').t0, k = eio(seg(t, s0, s0 + .6)), one = at('end', 'one'), go = at('end', 'go');
    if (k < 1) {
      g.save(); g.globalAlpha *= 1 - k; twinLayout(g, t, { dk: 1, ck: 1, thk: 0, sx: k * 500 }); g.restore();
      framed(g, TH, k, staticImg, true);
      if (k > .6) tvRoll(g, t - DUR, seg(k, .6, 1));
    } else drawStatic(g, t - DUR);
    var m = magPos(t - DUR), mA = seg(t, s0 + .5, s0 + .9);
    magnifier(g, m[0], m[1], 165, mA, lensStatic(m[0], m[1], 2.2));
    var pa = clamp(sp(t, one - .35, 3) * 2, 0, 1) * (1 - seg(t, HOME - .05, HOME + .25));
    promptBar(g, 540, 620, 640, '', t, pa, 'type one word');
    chip(g, 'GO', 820, 540, { px: 50, wt: 900, bg: HOT, fg: BG, a: pop(t, go - .05, 3) * (1 - seg(t, HOME - .05, HOME + .25)), rot: .06 });
  }

  /* ---------- captions: the narrator's words, one block at a time; only stressed words get the coral pill ---------- */
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;   /* frame 0 carries FIND THE CAT instead: ≤ 5 words on screen */
      var sents = [[]];
      l.words.forEach(function (w, i) { sents[sents.length - 1].push(w); if (/[.?!:]$/.test(w.w) && i < l.words.length - 1) sents.push([]); });
      var cur = [];
      sents = [].concat.apply([], sents.map(function (s) { if (s.length <= 5) return [s]; var h = Math.ceil(s.length / 2); return [s.slice(0, h), s.slice(h)]; }));
      sents.forEach(function (s) { if (cur.length && cur.length + s.length > 5) { out.push(cur); cur = []; } cur = cur.concat(s); });
      if (cur.length) out.push(cur);
    });
    return out.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS = [['can', 'cant'], ['can', 'can'], ['can', 'how'], ['trick', 'backwards'], ['photo', 'real'], ['photo', 'sprinkle'], ['more', 'pure'], ['more', 'noise'],
    ['guess', 'one'], ['guess', 'guess'], ['good', 'hundreds'], ['good', 'millions'], ['good', 'good'], ['flip', 'flip'], ['flip', 'static'], ['steps', 'wipe'], ['steps', 'again'], ['steps', '50'],
    ['steer', 'prompt'], ['steer', 'every'], ['steer', 'cat'], ['dog1', 'same'], ['dog2', 'dog'], ['dog2', 'dog', 1], ['never', 'never'], ['never', 'painted'], ['end', 'one'], ['end', 'word'], ['end', 'go']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fin = seg(t, card0.t0 - .04, card0.t0 + .06), out = 1 - seg(t, o0, o1);
    if (fin * out <= 0) return;
    var k = clamp(spring(t - card0.t0 + .04, 3.2, .8), 0, 1.04);
    g.save(); g.font = '800 74px Archivo'; try { g.fontStretch = 'expanded'; } catch (e) {}
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 22;
    var lines, lw, maxw = 760, cpx = 74;
    function lay() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; }); }
    lay();
    while (lines.length > 2 && cpx > 56) { cpx -= 4; g.font = '800 ' + cpx + 'px Archivo'; try { g.fontStretch = 'expanded'; } catch (e) {} ws = words.map(function (w) { return g.measureText(w.w).width; }); gap = cpx * .28; lay(); }
    var lh = cpx * 1.18, y0 = 380 - (lines.length - 1) * lh / 2;
    g.globalAlpha = fin * out * (alpha == null ? 1 : alpha);
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
  var NOISE, SCENES = { hook: hookScene, trick: trickScene, photo: photoScene, guess: guessScene, good: goodScene, paint: paintScene, twin: twinScene, end: endScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  var PRE = .3;
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function headA(t) { return 1 - seg(t, start('can') - .3, start('can') - .1); }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    var wipeK = Nx && Nx.wipe !== false ? seg(t, Sc.t1 - .34, Sc.t1 - .02) : 0;
    var pre = si > 0 && Sc.wipe !== false && t < Sc.t0 + PRE;
    g.save();
    if (!Sc.field && si > 0) { var push = 1 + .015 * seg(t, Sc.t0, Sc.t1), inK = eo(seg(t, Sc.t0, Sc.t0 + .35)); g.translate(540, 1000); g.scale(push * lerp(.97, 1, inK), push * lerp(.97, 1, inK)); g.translate(-540, -1000); }
    SCENES[Sc.id](g, pre ? Sc.t0 + PRE : t);
    g.restore();
    /* the native move as the cut: the squeegee sweeps down and the next scene is already under it */
    if (wipeK > 0) {
      var y1 = lerp(440, 1950, eio(wipeK));
      g.save(); g.beginPath(); g.rect(0, 440, W, y1 - 440); g.clip(); stage(g);
      g.translate(540, 1000); g.scale(.97, .97); g.translate(-540, -1000); SCENES[Nx.id](g, Nx.t0 + PRE); g.restore();
      squeegee(g, y1, false, 1);
    }
    /* the loop: the end dissolves back into frame 0 */
    var back = eio(seg(t, HOME, HOME + .35));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g); hookScene(g, 0, t - DUR); g.restore(); }
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
    g.save(); font(g, 66, 800); try { g.fontStretch = 'expanded'; } catch (e) {} g.textBaseline = 'alphabetic';
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText('How AI pulls a cat', 540, 300);
    var a = 'out of ', b = 'static', wa = g.measureText(a).width, wb = g.measureText(b).width, x = 540 - (wa + wb) / 2;
    g.textAlign = 'left'; g.fillText(a, x, 400); g.fillStyle = HOT; g.beginPath(); g.roundRect(x + wa - 12, 400 - 64, wb + 24, 88, 16); g.fill();
    g.fillStyle = BG; g.fillText(b, x + wa, 400); g.restore();
  }
  function TEXTS(t) {
    var out = [];
    if (t < start('can') - .3) out.push({ id: 'head', text: 'FIND THE CAT', x0: 0, y0: 0, x1: 0, y1: 0 });
    if (t >= CHIP_T + .2 && t < S('trick').t0 - .3) out.push({ id: 'chip', text: 'AI IMAGE GENERATORS', x0: 0, y0: 0, x1: 0, y1: 0 });
    if (t >= at('good', 'hundreds') + .7 && t < at('flip', 'flip') - .1) out.push({ id: 'cond', text: 'IN THE LAST ROUND ALONE', x0: 0, y0: 0, x1: 0, y1: 0 });
    if (t >= at('steps', '50') + .2 && t < S('twin').t0 - .3) out.push({ id: 'sd50', text: 'Stable Diffusion default · 50 steps', x0: 0, y0: 0, x1: 0, y1: 0 });
    if (t >= S('twin').t0 + .6 && t < S('twin').t1 - .3) out.push({ id: 'dm', text: 'SAME STATIC · a cat · a dog', x0: 0, y0: 0, x1: 0, y1: 0 });
    if (t >= at('never', 'never') + .28 && t < S('twin').t1 - .3) out.push({ id: 'never', text: 'NEVER IN THERE', x0: 0, y0: 0, x1: 0, y1: 0 });
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [];
  function initTimes() {
    var i;
    /* the wipe schedule (native move), keyed to the voice */
    var sw1a = at('steps', 'wipe') - .08, sw1b = wend('steps', 'noise') + .1, sw2a = at('steps', 'again') - .3, sw2b = wend('steps', 'again') + .05;
    SEGS.push({ a: sw1a, b: sw1b, from: 0, to: 1, n: 1, p: 1, kind: 'cat' });
    SEGS.push({ a: sw2a, b: sw2b, from: 1, to: 2, n: 1, p: 1, kind: 'cat' });
    SEGS.push({ a: at('steps', 'about') - .12, b: end('steps') + .2, from: 2, to: 30, n: 28, p: .62, kind: 'cat' });
    SEGS.push({ a: start('steer') - .05, b: at('steer', 'cat') - .02, from: 30, to: 50, n: 20, p: .85, kind: 'cat' });
    SEGS.push({ a: at('dog1', 'same') - .2, b: wend('dog1', 'static') + .1, from: 50, to: 0, n: 5, p: 1, kind: 'cat' });
    SEGS.push({ a: at('dog2', 'dog') + .2, b: at('dog2', 'dog', 1) - .03, from: 0, to: 50, n: 12, p: .8, kind: 'dog' });

    /* hook + can */
    EV.push({ t: 0, type: 'hiss', t1: S('trick').t0, g: .016 });
    EV.push({ t: CHIP_T - .02, type: 'pop', g: .7 }, { t: at('hook', 'cat') - .06, type: 'tick', g: .3 });
    EV.push({ t: wend('can', 'cant') - .1, type: 'buzz' }, { t: at('can', 'can') - .04, type: 'pop', g: .5 }, { t: wend('can', 'how') + .02, type: 'stamp', big: true });
    /* trick */
    for (i = 0; i < 4; i++) EV.push({ t: S('trick').t0 + .15 + i * .16, type: 'tick', g: .22 });
    EV.push({ t: S('trick').t0 + .4, type: 'swish' }, { t: at('trick', 'backwards') - .25, type: 'rewind', t1: at('trick', 'backwards') + .3 });
    /* photo + more */
    EV.push({ t: S('photo').t0 + .08, type: 'paper', g: 1.3 }, { t: S('photo').t0 + .12, type: 'thump', g: .3 });
    shakerWins().forEach(function (w) { EV.push({ t: w[0], type: 'shake', t1: w[1], g: w[2] }); });
    EV.push({ t: at('more', 'more') - .1, type: 'hiss', t1: at('more', 'noise') + .4, g: .02, rise: true });
    EV.push({ t: at('more', 'more') + .2, type: 'tick', g: .3 }, { t: at('more', 'more', 1) + .2, type: 'tick', g: .3 }, { t: at('more', 'pure') + .15, type: 'pop', g: .8 });
    /* guess */
    EV.push({ t: S('guess').t0 + .05, type: 'pop', g: .5 }, { t: S('guess').t0 + .23, type: 'pop', g: .5 });
    EV.push({ t: at('guess', 'guess') - .15, type: 'rise', t1: at('guess', 'added') + .3 }, { t: at('guess', 'added') + .3, type: 'stamp' }, { t: at('guess', 'added') + .35, type: 'ding1' });
    /* good */
    for (i = 0; i < NFL; i++) EV.push({ t: flickT(i), type: 'flip', g: .6 });
    EV.push({ t: at('good', 'pictures') + .4, type: 'thump', g: .4 }, { t: at('good', 'good') - .05, type: 'stamp' });
    /* flip */
    EV.push({ t: at('flip', 'flip') - .2, type: 'swish' }, { t: at('flip', 'flip') + .1, type: 'thump', g: .45 }, { t: at('flip', 'flip') + .1, type: 'hiss', t1: SEGS[0].a, g: .014 });
    EV.push({ t: at('flip', 'static') - .05, type: 'pop', g: .5 });
    /* the wipes */
    SEGS.forEach(function (s, si) {
      for (var k = 0; k < s.n; k++) {
        var a = s.a + (s.b - s.a) * Math.pow(k / s.n, s.p), b = s.a + (s.b - s.a) * Math.pow((k + 1) / s.n, s.p);
        if (b - a > .22) EV.push({ t: a, type: 'wipe', t1: b, up: s.to < s.from });
        else EV.push({ t: a, type: 'tick', g: .1 + (si === 4 ? .05 : 0) });
      }
    });
    EV.push({ t: at('steer', 'cat') - .02, type: 'ding1' });
    /* prompt typing */
    var p0 = at('steer', 'prompt') - .1; for (i = 0; i < 5; i++) EV.push({ t: p0 + i * .08, type: 'key' });
    var b0 = at('dog2', 'type') - .05; for (i = 0; i < 3; i++) EV.push({ t: b0 + i * .066, type: 'key' });
    var d0 = at('dog2', 'dog') - .3; for (i = 0; i < 3; i++) EV.push({ t: d0 + i * .073, type: 'key' });
    EV.push({ t: wend('dog2', 'dog', 1) + .02, type: 'ding1', f: 1 });
    /* twin + never */
    var tw = S('twin').t0;
    EV.push({ t: tw + .05, type: 'swish' }, { t: tw + .3, type: 'paper' }, { t: tw + .55, type: 'pop', g: .5 });
    EV.push({ t: wend('never', 'hiding') + .03, type: 'stamp' }, { t: at('never', 'painted') - .12, type: 'wipe', t1: at('never', 'painted') + .3 });
    /* end */
    EV.push({ t: S('end').t0 + .05, type: 'rise', t1: S('end').t0 + .75 }, { t: S('end').t0 + .75, type: 'hiss', t1: DUR, g: .014 });
    EV.push({ t: at('end', 'one') - .35, type: 'pop', g: .5 }, { t: at('end', 'go') - .05, type: 'pop', g: .8 });
    SC.forEach(function (s, j) { if (j && s.wipe !== false) EV.push({ t: s.t0 - .34, type: 'wipe', t1: s.t0 - .02 }); });
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
    function stampS(t, big) { thump(t, big ? .6 : .45); var n = noise(t, .16), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1500; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .42 : .32], [t + .12, 0]]); tickS(t + .005, .18); }
    function buzz(t) { osc('square', 110, t, t + .28, 1, [[t, 0], [t + .01, .035], [t + .24, .035], [t + .28, 0]], .05); osc('square', 116, t, t + .28, 1, [[t, 0], [t + .01, .03], [t + .24, .03], [t + .28, 0]], .05); }
    function paper(t, g) { g = g || 1; band(t - .03, t + .12, 1800, 3800, .07 * g, .02, 1.2, (rnd() - .5) * .8); tickS(t + .1, .08 * g); }
    function flip(t, g) { g = g || 1; band(t, t + .1, 2000, 5000, .07 * g, .02, 2, -.3); tickS(t + .08, .12 * g); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function rise(t, t1) { band(t, t1, 400, 1800, .03, .06, 3); }
    /* the squeegee: a rubbery drag, bright at the start, low at the end */
    function wipe(t, t1, up) { band(t, t1, up ? 2600 : 700, up ? 700 : 2600, .05, .03, 2.2, up ? .2 : -.2); tickS(t1 - .02, .12); }
    function rewind(t, t1) { band(t, t1, 4200, 500, .05, .06, 4); var n = Math.floor((t1 - t) / .035); for (var j = 0; j < n; j++) tickS(t + j * .035, .05); }
    /* TV static: a steady hiss bed, low (it sits under the voice) */
    function hiss(t, t1, g, up) { var o = bus(1, 0), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 2500; var n = noise(t, t1 - t + .1); n.connect(bp); bp.connect(o); env(o.gain, up ? [[t, 0], [t1 - .1, g], [t1, 0]] : [[t, 0], [t + .08, g], [t1 - .1, g], [t1, 0]]); }
    /* the salt shaker: grains rattling in glass */
    function shake(t, t1, g) { var n = Math.floor((t1 - t) / .045); for (var j = 0; j < n; j++) { var tt = t + j * .045; band(tt, tt + .04, 5200 + (j % 2) * 1400, 4800, .05 * g, .02, 3, (j % 2 ? .3 : -.3)); } }
    function key(t) { tickS(t, .25); osc('sine', 1900, t, t + .03, 1, [[t, 0], [t + .002, .03], [t + .025, 0]]); }
    EV.forEach(function (e) {
      if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'ding1') ding1(e.t, e.f);
      else if (e.type === 'thump') thump(e.t, e.g);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'stamp') stampS(e.t, e.big);
      else if (e.type === 'buzz') buzz(e.t);
      else if (e.type === 'paper') paper(e.t, e.g);
      else if (e.type === 'flip') flip(e.t, e.g);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'rise') rise(e.t, e.t1);
      else if (e.type === 'wipe') wipe(e.t, e.t1, e.up);
      else if (e.type === 'rewind') rewind(e.t, e.t1);
      else if (e.type === 'hiss') hiss(e.t, e.t1, e.g, e.rise);
      else if (e.type === 'shake') shake(e.t, e.t1, e.g);
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
      STEX = {}; TILES = {};
      PICS.cat = rasterize(roomPic('cat'), W, FH, FC, FR, 12, 16); PICS.cat.name = 'cat';
      PICS.dog = rasterize(roomPic('dog'), W, FH, FC, FR, 12, 16); PICS.dog.name = 'dog';
      PICS.photo = rasterize(photoPic, 520, 520, PC, PC, 13, 13); PICS.photo.name = 'photo';
      window.READY = true;
    });
  }
  initTimes();
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: S('twin').t0 + 1.6, SLUG: 'noise', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
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
