/* "QR code" — why a torn QR code still scans. Factory #9 on Tech, explained (How tech works, part 4), after ../memory/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t. Contract: window.FILM,
   DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). The QR code is real: qr.js (window.QR, written by qr/make_qr.py) holds
   a level-H code's 29×29 modules, which codeword each module carries, and the two tear polygons; the torn version the film
   shows was decoded with ZXing-cpp and zbar (out/check/qr-proof.json), the corner tear was checked to fail.
   The native move is the tear: the paper rips along a jagged edge and the piece falls; at `thirty` the missing modules
   ghost back in coral codeword by codeword; at `corners` a second tear bites a corner square and nothing comes back.
   Scene cuts are a torn paper edge rising from the bottom, the next scene drawn under it.
   Everything is hand-built: the paper code, a generic drawn phone (no logo, no real scanner UI), a paper CD, a magazine
   page, a box flap, a car-part tag, a menu, a parking sign, a ticket. Facts: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, QR = window.QR, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', DIM = 'rgba(244,237,224,.5)';
  var HOT = '#ff5b3d', YEL = '#ffd65a';
  var PAPER = '#f1e9d8', INK = '#211d26', REDINK = '#d8332b', BACKP = '#d6c9b1', CARD = '#c99a62';
  var BODY = '#2d2937', BODY2 = '#3d3849', SCREEN = '#1b1a21';
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

  /* scenes. swipe:true = the next scene rises in on a torn paper edge, drawn under the old one */
  var SWIPE = .42, PRE = .3;
  var SC = [
    { id: 'hook', fn: 'hook', name: 'Torn', t0: 0 },
    { id: 'trick', fn: 'split', name: 'Backup', t0: start('trick') - .05, swipe: true },
    { id: 'thirty', fn: 'rebuild', name: 'Level H', t0: start('thirty') - .05, swipe: true },
    { id: 'where', fn: 'corners', name: 'Corners', t0: start('where') - .05, swipe: true },
    { id: 'rare', fn: 'rare', name: 'Rarest', t0: start('rare') - .05, swipe: true },
    { id: 'factory', fn: 'factory', name: '1994', t0: start('factory') - .05, swipe: true },
    { id: 'most', fn: 'most', name: 'Level M', t0: start('most') - .05, swipe: true },
    { id: 'end', fn: 'end', name: 'Which corner', t0: start('end') - .05, swipe: true }
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
    font(g, px, o.wt, o.fam); ls(g, o.ls || 0);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw + pad * 2 > o.maxw && px > 30) { px -= 2; font(g, px, o.wt, o.fam); tw = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
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

  /* =====================================================================================================
     THE QR CODE. Real modules from qr.js; paper = symbol + 4-module quiet zone (QU units). Drawn in module units.
     ===================================================================================================== */
  var QN = QR.n, QQ = QR.q, QU = QN + 2 * QQ, MOD = QR.m, CW = QR.cw, ND = QR.nd;
  function inPoly(x, y, P) { var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { if (((P[i][1] > y) !== (P[j][1] > y)) && (x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0])) c = !c; } return c; }
  /* the modules under the hook tear, grouped by codeword (rebuilt one codeword at a time) */
  var TORN = [], GROUPS = [];
  (function () {
    var seen = {};
    for (var y = 0; y < QN; y++) for (var x = 0; x < QN; x++) if (inPoly(x + .5, y + .5, QR.tear)) {
      var c = CW[y * QN + x]; TORN.push({ x: x, y: y, d: MOD[y][x] === '1', c: c });
      if (!seen[c]) { seen[c] = 1; GROUPS.push(c); }
    }
    GROUPS.sort(function (a, b) { return (a < 0 ? 999 : a) - (b < 0 ? 999 : b); });
    TORN.forEach(function (m) { m.g = GROUPS.indexOf(m.c); });
  })();
  function centroid(P) { var x = 0, y = 0, n = 0; P.forEach(function (p) { if (p[0] <= QN + QQ && p[1] <= QN + QQ && p[0] >= -QQ && p[1] >= -QQ) { x += p[0]; y += p[1]; n++; } }); return [x / n, y / n]; }
  var TC1 = centroid(QR.tear), TC2 = centroid(QR.tear2);
  function isFinder(x, y) { return (x < 7 && y < 7) || (x >= QN - 7 && y < 7) || (x < 7 && y >= QN - 7); }
  function polyPath(g, P) { g.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); g.closePath(); }
  function modules(g, o, mat) {
    mat = mat || MOD; var n = mat.length;
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var col = o && o.col ? o.col(x, y, mat[y][x] === '1') : (mat[y][x] === '1' ? INK : null);
      if (col) { g.fillStyle = col; g.fillRect(x - .01, y - .01, 1.02, 1.02); }
    }
  }
  function paperSq(g, n, col) { g.fillStyle = col || PAPER; g.fillRect(-QQ, -QQ, n + 2 * QQ, n + 2 * QQ); }
  /* o: x, y (centre), w (paper px), rot, a, tear (bool), tear2 (bool), col(x,y,dark), finder (coral 0..1), rebuild (0..1),
     piece: {k, dx, dy, rot} for the falling hook piece; piece2 likewise; edge (white fibre on torn edges) */
  function qrCode(g, o) {
    var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    var u = o.w / QU;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(o.x, o.y); g.rotate(o.rot || 0); g.scale(u, u); g.translate(-QU / 2 + QQ, -QU / 2 + QQ);
    function clipTorn() {
      g.beginPath(); g.rect(-QQ, -QQ, QU, QU);
      if (o.tear) polyPath(g, QR.tear.slice().reverse());
      if (o.tear2) polyPath(g, QR.tear2.slice().reverse());
      g.clip('evenodd');
    }
    /* shadow */
    g.save(); g.translate(.5, .8); clipTorn(); g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(-QQ, -QQ, QU, QU); g.restore();
    g.save(); clipTorn();
    paperSq(g, QN, o.paper);
    var fc = o.finder || 0;
    modules(g, { col: function (x, y, d) {
      if (!d) return null;
      if (fc > 0 && isFinder(x, y)) return fc >= 1 ? HOT : mixC(INK, HOT, fc);
      return o.col ? o.col(x, y, d) : INK;
    } });
    if (o.inner) o.inner(g, u);
    g.restore();
    /* torn edges: a pale paper fibre along the rip */
    if (o.edge !== false) {
      g.save(); g.beginPath(); g.rect(-QQ, -QQ, QU, QU); g.clip();
      g.strokeStyle = 'rgba(255,252,244,.95)'; g.lineWidth = .32; g.lineJoin = 'round';
      [o.tear && QR.tear, o.tear2 && QR.tear2].forEach(function (P) { if (!P) return; g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length - 1; i++) g.lineTo(P[i][0], P[i][1]); g.stroke(); });
      g.restore();
    }
    /* the rebuild: missing modules ghost back, codeword by codeword */
    if (o.rebuild > 0) {
      var G = GROUPS.length * o.rebuild;
      TORN.forEach(function (m) {
        var k = clamp(G - m.g, 0, 1); if (k <= 0) return;
        var s = lerp(.4, 1, eo(k));
        g.save(); g.globalAlpha *= k; g.translate(m.x + .5, m.y + .5); g.scale(s, s);
        g.fillStyle = m.d ? HOT : 'rgba(241,233,216,.85)'; g.fillRect(-.5, -.5, 1.02, 1.02); g.restore();
      });
    }
    if (o.piece) piece(g, QR.tear, TC1, o.piece);
    if (o.piece2) piece(g, QR.tear2, TC2, o.piece2);
    if (o.over) o.over(g, u);
    g.restore();
  }
  function piece(g, P, C, p) {
    if (p.a === 0) return;
    g.save(); g.translate(C[0] + p.dx, C[1] + p.dy); g.rotate(p.rot); g.translate(-C[0], -C[1]);
    g.save(); g.translate(.5, .9); g.beginPath(); g.rect(-QQ, -QQ, QU, QU); g.clip(); g.beginPath(); polyPath(g, P); g.clip(); g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-QQ, -QQ, QU, QU); g.restore();
    g.beginPath(); g.rect(-QQ, -QQ, QU, QU); g.clip(); g.beginPath(); polyPath(g, P); g.clip();
    paperSq(g, QN); modules(g);
    g.strokeStyle = 'rgba(255,252,244,.95)'; g.lineWidth = .32; g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length - 1; i++) g.lineTo(P[i][0], P[i][1]); g.stroke();
    g.restore();
  }
  function mixC(a, b, k) {
    function h(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
    var A = h(a), B = h(b); return 'rgb(' + Math.round(lerp(A[0], B[0], k)) + ',' + Math.round(lerp(A[1], B[1], k)) + ',' + Math.round(lerp(A[2], B[2], k)) + ')';
  }
  /* a small printed code on a prop (level M for everyday codes) */
  function miniCode(g, x, y, w, mat, rot) {
    var n = mat.length, u = w / (n + 8);   /* a 4-module quiet zone, as tested in qr/make_qr.py */
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(u, u); g.translate(-n / 2, -n / 2);
    g.fillStyle = '#fbf6ea'; g.fillRect(-4, -4, n + 8, n + 8);
    modules(g, null, mat); g.restore();
  }
  /* viewfinder brackets around a box; k 0..1 tightens from loose; wob = hunting jitter */
  function brackets(g, x0, y0, x1, y1, col, lw, len, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(function (c) {
      g.beginPath(); g.moveTo(c[0], c[1] + c[3] * len); g.lineTo(c[0], c[1]); g.lineTo(c[0] + c[2] * len, c[1]); g.stroke();
    });
    g.restore();
  }
  /* the symbol's box on screen for an unrotated code */
  function symBox(x, y, w) { var u = w / QU, h = QN * u / 2; return { x0: x - h, y0: y - h, x1: x + h, y1: y + h, u: u }; }

  /* a generic drawn phone: rounded body, round punch-hole, no logo */
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

  /* =====================================================================================================
     SCENE 1 · hook + ask: the huge torn code, its piece falling; a phone scans it; then push in on the tear
     ===================================================================================================== */
  var BIG = { x: CX, y: 1000, w: 800 };
  function swayAt(t) { return -.018 + Math.sin(t * 1.3) * .008; }
  /* the hook piece: already tearing away on frame 0, gone by 1.3 s; never returns (the loop dissolves to t≈0) */
  function fallP(t) { var k = clamp((t + .55) / 1.5, 0, 1); return { dx: 1.2 + k * k * 46, dy: 1.5 + k * k * 70, rot: .1 + k * k * .9, a: k >= 1 ? 0 : 1 }; }
  function hookCode(g, t, extra) {
    var o = { x: BIG.x, y: BIG.y, w: BIG.w, rot: swayAt(t), tear: true, piece: fallP(t) };
    for (var k in extra) o[k] = extra[k];
    qrCode(g, o);
  }
  function hookScene(g, t) {
    var sc = at('hook', 'scans'), lock0 = at('hook', 'code'), so = at('ask', 'so'), how = at('ask', 'how'), gone = at('ask', 'gone');
    /* push in on the tear while the voice asks */
    var z = eio(seg(t, so - .1, gone + .3)), sb = symBox(BIG.x, BIG.y, BIG.w), fx = sb.x0 + 24 * sb.u, fy = sb.y0 + 24 * sb.u;
    /* the code drops 200 px as it pushes in, so STILL SCANS. and CORNERS INTACT sit above the paper, never on its squares */
    g.save(); g.translate(0, 200 * z); g.translate(lerp(BIG.x, fx, z * .55), lerp(BIG.y, fy, z * .55)); g.scale(1 + .3 * z, 1 + .3 * z); g.translate(-lerp(BIG.x, fx, z * .55), -lerp(BIG.y, fy, z * .55));
    hookCode(g, t, { over: function (g) {
      /* the dashed outline of what's gone */
      var da = fin(t, how - .1);
      if (da > 0) {
        g.save(); g.globalAlpha *= da; g.beginPath(); g.rect(-QQ, -QQ, QU, QU); g.clip();
        g.setLineDash([.9, .6]); g.lineDashOffset = -t * 2; g.strokeStyle = HOT; g.lineWidth = .36;
        g.beginPath(); var P = QR.tear; g.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length - 1; i++) g.lineTo(P[i][0], P[i][1]); g.lineTo(QN + QQ, QN + QQ); g.closePath(); g.stroke();
        g.restore();
      }
    } });
    /* the camera's view: a scan line, then brackets lock on the symbol */
    var lk = eio(seg(t, lock0 - .25, sc)), ba = fin(t, .35) * (1 - seg(t, so - .2, so + .1));
    var pad = lerp(90, 14, lk);
    brackets(g, sb.x0 - pad, sb.y0 - pad, sb.x1 + pad, sb.y1 + pad, lk >= 1 ? HOT : CREAM, 12, 70, ba);
    var sl = seg(t, .35, sc - .05);
    if (sl > 0 && sl < 1) { g.save(); g.globalAlpha *= .85 * Math.min(1, (1 - sl) * 6, sl * 8); var yy = lerp(sb.y0, sb.y1, (Math.sin(sl * Math.PI * 1.5 - Math.PI / 2) + 1) / 2); g.fillStyle = HOT; g.fillRect(sb.x0 - 20, yy - 4, sb.x1 - sb.x0 + 40, 8); g.restore(); }
    g.restore();
    /* the phone slides up under the code; its screen is a viewfinder on the code, then shows what it decoded */
    var pk = clamp(sp(t, .3, 2.2, .9), 0, 1.02), pout = eio(seg(t, so - .2, so + .3)), py = lerp(1960, 1330, pk) + pout * 600;
    var ck = fin(t, wend('hook', 'scans') - .08);
    phone(g, CX, py, 440, 820, 1, function (g, x0, y0, w, h) {
      /* the code's lower edge through the glass, dim */
      g.save(); g.globalAlpha *= .55; hookCode(g, t, { x: 0, y: y0 + 215, w: 270, piece: null }); g.restore();
      g.fillStyle = 'rgba(21,19,27,.35)'; g.fillRect(x0, y0, w, h);
      brackets(g, -125, y0 + 100, 125, y0 + 330, ck > .5 ? HOT : CREAM, 6, 34, 1);
      if (ck > 0) {
        g.save(); g.globalAlpha *= ck * (1 - seg(pout, 0, .06)); rr(g, -190, y0 + 6, 380, 92, 22); g.fillStyle = HOT; g.fill(); g.restore();
        chip(g, 'SCANNED ✓', 0, y0 + 32, { px: 40, wt: 900, fg: BG, a: ck * (1 - seg(pout, 0, .06)) });
        label(g, QR.text, 0, y0 + 72, ck * (1 - seg(pout, 0, .06)), BG, 36);
      }
    });
    stamp(g, '?', 740, 1130 + 150 * z, t, how - .12, S('trick').t0 - SWIPE, 170, HOT, .12);
  }
  /* frame 0's headline: TORN QR CODE. (3 words); on "scans" STILL SCANS. and its condition pop together, and they
     glide down under the caption when the voice asks */
  function headline(g, t, a, idle) {
    var px = 104;
    if (a > 0) {
      g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 900); wide(g);
      var l1 = 'TORN QR CODE.', tw = g.measureText(l1).width;
      if (tw > 800) { px = Math.floor(px * 800 / tw); font(g, px, 900); wide(g); }
      g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText(l1, CX, 340); g.restore();
    }
    if (idle) return;
    var sc = at('hook', 'still') - .05, pa = fin(t, sc) * (1 - seg(t, S('trick').t0 - SWIPE + .05, S('trick').t0 - SWIPE + .2));
    if (pa <= 0) return;
    var dn = eio(seg(t, at('ask', 'so') - .25, at('ask', 'so') + .1)) * 75, kk = Math.max(0, knock(t, sc, 16, 6));
    chip(g, 'STILL SCANS.', CX, 450 + dn, { px: 80, wt: 900, bg: HOT, fg: BG, a: pa, s: lerp(1.25, 1, clamp(pop(t, sc, 3.2), 0, 1)) * (1 + .05 * kk), r: 16 });
    label(g, 'LEVEL H · CORNERS INTACT', CX, 545 + dn, pa, CREAM, 40, 'center', true);
  }
  function headA(t) { var c = at('ask', 'so'); return 1 - seg(t, c - .1, c + .06); }
  function hookIdle(g, ti) { hookCode(g, ti); }

  /* =====================================================================================================
     SCENE 2 · trick + cd: the code's modules split into DATA and BACKUP; a paper CD rolls in, scratched
     ===================================================================================================== */
  function cdProp(g, x, y, r, rot, scratchK, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 8, 14, r, r);
    g.rotate(rot);
    var gr = g.createLinearGradient(-r, -r, r, r); gr.addColorStop(0, '#d9d4e2'); gr.addColorStop(.45, '#f4ede0'); gr.addColorStop(.55, '#c9c2d6'); gr.addColorStop(1, '#e8e1ee');
    g.fillStyle = gr; el(g, 0, 0, r, r);
    g.strokeStyle = 'rgba(33,29,38,.12)'; g.lineWidth = 2; for (var i = 1; i < 6; i++) { g.beginPath(); g.arc(0, 0, r * (.4 + i * .1), 0, 6.283); g.stroke(); }
    g.fillStyle = BG; el(g, 0, 0, r * .14, r * .14); g.strokeStyle = 'rgba(33,29,38,.3)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r * .3, 0, 6.283); g.stroke();
    /* the scratch */
    if (scratchK > 0) {
      g.strokeStyle = scratchK > 1 ? HOT : mixC('#8a8296', HOT, clamp(scratchK, 0, 1)); g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-r * .75, -r * .2); g.lineTo(lerp(-r * .75, r * .55, Math.min(1, scratchK * 3)), lerp(-r * .2, -r * .62, Math.min(1, scratchK * 3))); g.stroke();
    }
    g.restore();
  }
  function splitScene(g, t) {
    var s0 = S('trick').t0, part = at('trick', 'part'), bk = at('trick', 'backup'), ev = at('trick', 'every');
    var cd0 = start('cd'), rs = at('cd', 'reedsolomon'), cds = at('cd', 'cds');
    var mv = eio(seg(t, cd0 - .35, cd0 + .35));
    var x = lerp(CX, 350, mv), y = lerp(860, 820, mv), w = lerp(640, 470, mv);
    /* backup modules turn coral in placement order, from "part" to "backup" */
    var bkK = seg(t, part - .05, bk + .1), flash = Math.max(0, knock(t, cds - .05, 14, 5));
    qrCode(g, { x: x, y: y, w: w, rot: -.015 + Math.sin(t * 1.1) * .006, col: function (xx, yy, d) {
      var c = CW[yy * QN + xx]; if (c < 0) return INK;
      if (c >= ND) { var on = clamp((bkK * (70 - ND + 6)) - (c - ND), 0, 1); return on > 0 ? (flash > .2 ? '#ff8a70' : mixC(INK, HOT, on)) : INK; }
      return INK;
    } });
    var la = 1 - seg(t, at('cd', 'math') - .05, at('cd', 'math') + .2);
    chip(g, 'DATA', 300, 1260, { px: 56, wt: 900, bg: CREAM, fg: BG, a: fin(t, part - .1) * la, s: kn(t, part) });
    chip(g, 'BACKUP', 690, 1260, { px: 56, wt: 900, bg: HOT, fg: BG, a: fin(t, part - .05) * la, s: lerp(1.25, 1, clamp(pop(t, part - .05, 3.2), 0, 1)) * kn(t, bk - .05) });
    stamp(g, 'EVERY CODE', CX, 1380, t, ev - .1, cd0 - .25, 64, HOT, -.05);
    /* the CD rolls in from the right */
    var ck = clamp(sp(t, cd0 - .3, 1.8, .9), 0, 1.01), cx = lerp(1300, 735, ck);
    cdProp(g, cx, 880, 175, (cx - 735) / 175, seg(t, cds - .25, cds + .1) + (flash > .2 ? 1 : 0), ck > 0 ? 1 : 0);
    chip(g, 'REED–SOLOMON', CX, 1150, { px: 72, wt: 900, bg: CREAM, fg: BG, a: fin(t, rs - .1), s: lerp(1.2, 1, clamp(pop(t, rs - .1, 3.2), 0, 1)), rot: -.02, maxw: 780 });
    label(g, 'SAME FIX AS CDs', CX, 1330, fin(t, rs + .05) * kn(t, cds), CREAM, 40, 'center', true);
    label(g, 'DENSO WAVE, QRCODE.COM', CX, 1405, fin(t, rs + .2), CREAM, 30, 'center', true);
  }

  /* =====================================================================================================
     SCENE 3 · thirty + corners: the torn code rebuilds in coral (codeword by codeword); then a corner tear: no scan
     ===================================================================================================== */
  var RB = { x: CX, y: 870, w: 540 };
  function T2t() { return at('corners', 'corner') - .25; }
  function fall2(t) { var k = seg(t, T2t(), T2t() + 1.1); return { dx: -k * k * 22 - k * 3, dy: k * k * 60 + k * 2, rot: -k * k * 1.1, a: k >= 1 ? 0 : 1 }; }
  /* what this tear really cost, from qr.js: codewords with a light module under the tear now read wrong (the torn-off
     paper reads dark). Version 3-H interleaves 2 blocks; each block's 22 Reed-Solomon bytes fix 11. */
  var BROKEN = (function () {
    var seen = {}, out = [];
    TORN.forEach(function (m) { if (!m.d && m.c >= 0 && !seen[m.c]) { seen[m.c] = 1; out.push({ c: m.c, g: m.g, b: m.c < ND ? m.c % 2 : (m.c - ND) % 2 }); } });
    return out;
  })();
  var NCW = 70, SPARE = 11;
  function brokenIn(b) { return BROKEN.filter(function (x) { return x.b === b; }).length; }
  function levelsRow(g, x, y, a, px) {
    if (a <= 0) return;
    var parts = [['L 7%', CREAM], [' · ', DIM], ['M 15%', HOT], [' · ', DIM], ['Q 25%', CREAM], [' · ', DIM], ['H 30%', HOT]];
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 600, MONO); ls(g, 2); g.textBaseline = 'middle'; g.textAlign = 'left';
    var w = 0; parts.forEach(function (p) { w += g.measureText(p[0]).width; });
    var x0 = x - w / 2, dy = (1 - Math.min(1, a)) * 14;
    rr(g, x0 - 20, y - px * .8 + dy, w + 40, px * 1.6, 12); g.fillStyle = 'rgba(21,19,27,.92)'; g.fill();
    parts.forEach(function (p) { g.fillStyle = p[1]; g.fillText(p[0], x0, y + dy); x0 += g.measureText(p[0]).width; });
    g.restore(); ls(g, 0);
  }
  function rebuildScene(g, t) {
    var lv = at('thirty', 'level'), th = at('thirty', '30%'), rb = at('thirty', 'rebuilt'), bt = at('corners', 'but'), only = at('corners', 'only');
    var torn2 = t >= T2t();
    var rk = seg(t, th - .25, rb + .25), lose = seg(t, only - .1, only + .4);
    var hunt = t > only ? Math.sin(t * 19) * 10 * seg(t, only, only + .2) : 0, sb = symBox(RB.x, RB.y, RB.w);
    qrCode(g, { x: RB.x, y: RB.y, w: RB.w, rot: -.012 + Math.sin(t * 1.2) * .006, tear: true, tear2: torn2, rebuild: rk * (1 - lose), piece2: torn2 ? fall2(t) : null });
    /* the camera: brackets locked while it reads, hunting once the corner is gone */
    var bl = fin(t, S('thirty').t0 + .1);
    brackets(g, sb.x0 - 16 + hunt, sb.y0 - 16 - hunt * .6, sb.x1 + 16 - hunt * .4, sb.y1 + 16 + hunt, t > only ? CREAM : HOT, 11, 60, bl);
    var outT = 1 - seg(t, bt - .25, bt - .05), outA = 1 - seg(t, bt - .1, bt + .15), outB = 1 - seg(t, T2t() + .05, T2t() + .25);
    /* three reads at once at most: the levels row and its credit give way when THIS TEAR arrives (the row pays off in `most`) */
    var outL = 1 - seg(t, th + .1, th + .3);
    levelsRow(g, CX, 525, fin(t, lv) * outT * outL, 40);
    label(g, 'DENSO WAVE · ISO/IEC 18004', CX, 580, fin(t, lv + .15) * outT * outL, CREAM, 30, 'center', true);
    chip(g, 'LEVEL H', CX, 1190, { px: 60, wt: 900, bg: CREAM, fg: BG, a: fin(t, lv - .1) * outA, s: lerp(1.2, 1, clamp(pop(t, lv - .1, 3.2), 0, 1)) * kn(t, lv) });
    chip(g, 'UP TO ≈30% OF ITS BYTES', CX, 1270, { px: 56, wt: 900, bg: HOT, fg: BG, a: fin(t, at('thirty', 'up') - .1) * outB, s: lerp(1.1, 1, clamp(pop(t, at('thirty', 'up') - .1, 3.2), 0, 1)) * kn(t, th), maxw: 720, rot: -.015 });
    /* the readout: this tear's real cost, counted as the coral bytes come back */
    var G = GROUPS.length * rk, n = BROKEN.filter(function (x) { return x.g < G; }).length, ta = fin(t, th + .05) * outB;
    chip(g, 'THIS TEAR: ' + n + ' OF ' + NCW + ' BYTES', CX, 1345, { px: 46, wt: 900, bg: CREAM, fg: BG, a: ta, s: kn(t, rb), maxw: 720 });
    var b0 = BROKEN.filter(function (x) { return x.b === 0 && x.g < G; }).length, b1 = BROKEN.filter(function (x) { return x.b === 1 && x.g < G; }).length;
    /* 11 of 22 correctable bytes (6 of 11 and 5 of 11 per block) */
    label(g, 'HALF THE SPARE USED', CX, 1415, fin(t, th + .15) * outB, CREAM, 44, 'center', true);
    /* the condition, big, in the same frame as the failure */
    onlyChip(g, t);
    stamp(g, '✕ NO SCAN', CX, 1365, t, T2t() + .25, S('where').t0 - SWIPE, 64, HOT, -.05);
  }

  /* =====================================================================================================
     SCENE 4 · where + up: three squares light; the camera snaps to them; the code turns, UP stays locked
     ===================================================================================================== */
  /* the condition stays on screen from "But" through the corners scene, above the code */
  function onlyChip(g, t) {
    var a0 = at('corners', 'but'), z = at('where', 'camera');
    chip(g, 'ONLY IF THE CORNERS SURVIVE', CX, 520, { px: 56, wt: 900, bg: HOT, fg: BG, a: fin(t, a0 - .1) * (1 - seg(t, z - .3, z)), s: lerp(1.1, 1, clamp(pop(t, a0 - .1, 3.2), 0, 1)) * kn(t, at('corners', 'only')), maxw: 720 });
  }
  var CO = { x: CX, y: 900, w: 620 };
  function corScene(g, t) {
    var s0 = S('where').t0, th = at('where', 'those'), cam = at('where', 'camera'), wh = at('where', 'where'), w3 = at('up', 'three'), kw = at('up', 'knows'), wy = at('up', 'way'), up = at('up', 'up');
    /* where: the code slides in tilted and the camera finds it; up: a quarter turn, a half turn, a flip over, upright */
    var e = eio(seg(t, s0, cam + .1)), rot = .52 * (1 - e);
    [[w3 - .05, 1], [kw - .05, 1], [up - .1, 2]].forEach(function (s) { rot += Math.PI / 2 * s[1] * clamp(sp(t, s[0], 2.6, .9), 0, 1.02); });
    var fk = eio(seg(t, wy - .1, wy + .45)), sx = Math.cos(fk * Math.PI * 2);
    var fA = fin(t, th - .05);
    g.save(); g.translate(CO.x + 170 * (1 - e), CO.y); g.rotate(rot - .01); g.scale(sx, 1);
    if (sx < 0) sheet(g, 0, 0, CO.w, CO.w, 0, 1, function (g, w, h) { g.fillStyle = BACKP; g.fillRect(-w / 2, -h / 2, w, h); });
    else qrCode(g, { x: 0, y: 0, w: CO.w, rot: 0, finder: fA, over: function (g, u) {
      /* camera brackets on each square */
      var bk = eio(seg(t, cam - .15, cam + .15));
      if (bk > 0) [[3.5, 3.5], [QN - 3.5, 3.5], [3.5, QN - 3.5]].forEach(function (c, i) {
        var p = lerp(3, .6, bk);
        g.save(); g.lineWidth = .45; brackets(g, c[0] - 3.5 - p, c[1] - 3.5 - p, c[0] + 3.5 + p, c[1] + 3.5 + p, HOT, .45, 2, bk); g.restore();
      });
      /* the outline joining them: where the code is */
      var ok = eio(seg(t, wh - .1, wh + .35));
      if (ok > 0) {
        g.save(); g.strokeStyle = HOT; g.lineWidth = .5; g.lineJoin = 'round';
        var pts = [[3.5, QN - 3.5], [3.5, 3.5], [QN - 3.5, 3.5]], len = ok * 2;
        g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
        for (var i = 1; i < 3; i++) { var kk = clamp(len - (i - 1), 0, 1); g.lineTo(lerp(pts[i - 1][0], pts[i][0], kk), lerp(pts[i - 1][1], pts[i][1], kk)); if (kk < 1) break; }
        g.stroke(); g.restore();
      }
      /* UP: an arrow locked to the code */
      var ua = fin(t, w3 - .1);
      if (ua > 0) {
        g.save(); g.globalAlpha *= ua; g.fillStyle = HOT; g.translate(QN / 2, -QQ - 1.2);
        g.fillRect(-.45, -1.2, .9, 2.2); tri(g, -1.6, -1.1, 1.6, -1.1, 0, -3.2);
        font(g, 2.2, 900); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('UP', 1.6, -.6);
        g.restore();
      }
    } });
    g.restore();
    onlyChip(g, t);
    label(g, 'ANY ANGLE', CX, 1380, fin(t, start('up') - .1) * kn(t, kw), CREAM, 44, 'center', true);
  }

  /* =====================================================================================================
     SCENE 5 · rare: a magazine page and a box flap, a ruler sweeping each; then the corner square's 1:1:3:1:1
     ===================================================================================================== */
  function magazine(g, w, h) {
    g.fillStyle = HOT; g.fillRect(-w / 2, -h / 2, w, 70);
    font(g, 40, 900); wide(g); g.fillStyle = BG; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('WEEKEND', -w / 2 + 24, -h / 2 + 36);
    font(g, 46, 900); g.fillStyle = INK; g.fillText('Fresh fish', -w / 2 + 24, -h / 2 + 130); g.fillText('3 for $5', -w / 2 + 24, -h / 2 + 184);
    g.fillStyle = '#b9ae98'; g.fillRect(-w / 2 + 24, -h / 2 + 230, w - 48, 170);
    g.fillStyle = INK; el(g, -w / 2 + 120, -h / 2 + 315, 70, 40); tri(g, -w / 2 + 180, -h / 2 + 315, -w / 2 + 230, -h / 2 + 280, -w / 2 + 230, -h / 2 + 350);
    font(g, 30, 700, MONO); g.fillStyle = INK; g.fillText('Open 8–6 daily', -w / 2 + 24, -h / 2 + 445);
  }
  function boxFlap(g, w, h) {
    g.strokeStyle = 'rgba(60,40,20,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-w / 2, -h / 2 + 60); g.lineTo(w / 2, -h / 2 + 60); g.stroke();
    font(g, 44, 900); wide(g); g.fillStyle = '#3a2a1a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('THIS SIDE UP', 0, -h / 2 + 130);
    for (var i = 0; i < 2; i++) { var ax = -60 + i * 120; g.fillRect(ax - 7, -h / 2 + 200, 14, 70); tri(g, ax - 28, -h / 2 + 210, ax + 28, -h / 2 + 210, ax, -h / 2 + 174); }
    font(g, 40, 900); g.fillStyle = REDINK; g.fillText('FRAGILE', 0, -h / 2 + 320);
  }
  function rareScene(g, t) {
    var s0 = S('rare').t0, mg = at('rare', 'magazines'), bx = at('rare', 'boxes'), ra = at('rare', 'rarest'), pt = at('rare', 'pattern');
    var dimK = eio(seg(t, ra - .3, ra + .1));
    var mk1 = pop(t, s0 + .05, 2.8), mk2 = pop(t, bx - .2, 2.8);
    g.save(); g.globalAlpha *= 1 - .75 * dimK;
    sheet(g, 320, 850 - (1 - Math.min(1, mk1)) * 90, 420, 520, -.06, clamp(mk1 * 3, 0, 1), magazine);
    sheet(g, 690, 1000 - (1 - Math.min(1, mk2)) * 90, 420, 380, .05, clamp(mk2 * 3, 0, 1), boxFlap, CARD);
    /* the ruler: a coral reading line sweeping across each prop */
    [[mg - .3, 320, 850, 420, 520], [bx - .05, 690, 1000, 420, 380]].forEach(function (r) {
      var k = seg(t, r[0], r[0] + .9); if (k <= 0 || k >= 1) return;
      var y = r[2] - r[4] / 2 + r[4] * eio(k); g.save(); g.globalAlpha *= Math.min(1, (1 - k) * 6, k * 8); g.fillStyle = HOT; g.fillRect(r[1] - r[3] / 2 - 20, y - 4, r[3] + 40, 8); g.restore();
    });
    g.restore();
    /* the corner square and its cross-section */
    var fk = pop(t, ra - .15, 2.8), fa = clamp(fk * 3, 0, 1);
    if (fa > 0) {
      var s = 46 * lerp(.8, 1, Math.min(1, fk)), x0 = CX - 3.5 * s, y0 = 800 - 3.5 * s;
      g.save(); g.globalAlpha *= fa;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0 - s + 10, y0 - s + 14, 9 * s, 9 * s);
      g.fillStyle = PAPER; g.fillRect(x0 - s, y0 - s, 9 * s, 9 * s);
      g.fillStyle = INK; g.fillRect(x0, y0, 7 * s, 7 * s); g.fillStyle = PAPER; g.fillRect(x0 + s, y0 + s, 5 * s, 5 * s); g.fillStyle = INK; g.fillRect(x0 + 2 * s, y0 + 2 * s, 3 * s, 3 * s);
      var lk = eio(seg(t, ra, ra + .5)); g.fillStyle = HOT; g.fillRect(x0 - s, y0 + 3.5 * s - 4, 9 * s * lk, 8);
      /* the bars: 1 1 3 1 1 */
      var bw = 96, bx0 = CX - 3.5 * bw, by = 1150, widths = [1, 1, 3, 1, 1], xx = bx0;
      widths.forEach(function (wd, i) {
        var k = eio(seg(t, ra + .15 + i * .1, ra + .4 + i * .1));
        g.fillStyle = i % 2 ? PAPER : INK; g.fillRect(xx, by - 50, wd * bw * k, 100);
        if (k > 0) { font(g, 48, 900); g.fillStyle = i % 2 ? INK : CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = fa * k; g.fillText(String(wd), xx + wd * bw / 2, by + 2); g.globalAlpha = fa; }
        xx += wd * bw;
      });
      g.strokeStyle = CREAM; g.lineWidth = 3; g.strokeRect(bx0, by - 50, 7 * bw, 100);
      g.restore();
    }
    label(g, 'DENSO WAVE: FLIERS, MAGAZINES, BOXES', CX, 1385, fin(t, mg + .1), CREAM, 30, 'center', true);
  }

  /* =====================================================================================================
     SCENE 6 · factory: a paper car-part tag with a code, a grease smudge on "dirty"; 1994
     ===================================================================================================== */
  function gear(g, x, y, r, n, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); g.beginPath();
    for (var i = 0; i < n * 2; i++) { var a0 = i * Math.PI / n, rr0 = i % 2 ? r * .78 : r; g.lineTo(Math.cos(a0 - .12) * rr0, Math.sin(a0 - .12) * rr0); g.lineTo(Math.cos(a0 + .12) * rr0, Math.sin(a0 + .12) * rr0); }
    g.closePath(); g.fill(); g.globalCompositeOperation = 'destination-out'; el(g, 0, 0, r * .32, r * .32); g.restore();
  }
  function factoryScene(g, t) {
    var s0 = S('factory').t0, yr = at('factory', '1994'), dt = at('factory', 'dirty'), cp = at('factory', 'carparts');
    var tk = pop(t, s0 + .05, 2.6), sm = eio(seg(t, dt - .1, dt + .35));
    sheet(g, CX, 870 - (1 - Math.min(1, tk)) * 90, 700, 520, -.04, clamp(tk * 3, 0, 1), function (g, w, h) {
      g.fillStyle = BG; el(g, -w / 2 + 50, -h / 2 + 50, 18, 18);
      g.fillStyle = HOT; g.fillRect(-w / 2, -h / 2 + 92, w, 10);
      font(g, 34, 700, MONO); ls(g, 2); g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('PART 4471-B', -w / 2 + 90, -h / 2 + 52); ls(g, 0);
      g.fillStyle = '#6b6476'; gear(g, -w / 2 + 165, 50, 110, 10, t * .6);
      miniCode(g, 150, 45, 300, MOD);
      /* the grease smudge: over the middle of the code, never the corner squares */
      /* the grease smudge: the exact ellipses qr/make_qr.py tested with ZXing and zbar (QR.smudge, module units) */
      if (sm > 0) { var su = 300 / (QN + 8); g.save(); g.globalAlpha *= .78; g.fillStyle = '#3b3328'; QR.smudge.forEach(function (e) { el(g, 150 + e[0] * su, 45 + e[1] * su, e[2] * su * sm, e[3] * su * sm, e[4]); }); g.restore(); }
      font(g, 30, 700, MONO); g.fillStyle = INK; g.fillText('LINE 3 · BIN 12', -w / 2 + 90, h / 2 - 50);
    });
    stamp(g, '1994', 330, 1210, t, yr - .1, S('most').t0 - SWIPE, 100, HOT, -.1);
    chip(g, QR.tagok ? 'STILL SCANS' : 'DIRT-PROOF BY DESIGN', 700, 1215, { px: 50, wt: 900, bg: CREAM, fg: BG, a: fin(t, wend('factory', 'dirty') + .05), s: kn(t, wend('factory', 'dirty') + .05), rot: .04 });
    label(g, 'DENSO WAVE, JAPAN', CX, 1340, fin(t, s0 + .15), CREAM, 34, 'center', true);
  }

  /* =====================================================================================================
     SCENE 7 · most: a menu, a parking sign, a ticket; LEVEL M ≈ 15%
     ===================================================================================================== */
  function mostScene(g, t) {
    var s0 = S('most').t0, mk0 = at('most', 'maker'), ms = at('most', 'most'), cd = at('most', 'codes'), ab = at('most', 'about'), f15 = at('most', '15%');
    var MM = QR.mm;
    var a1 = pop(t, s0 + .05, 2.8), a2 = pop(t, ms - .2, 2.8), a3 = pop(t, cd - .1, 2.8);
    sheet(g, 300, 780 - (1 - Math.min(1, a1)) * 80, 360, 470, -.06, clamp(a1 * 3, 0, 1), function (g, w, h) {
      font(g, 46, 900); wide(g); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MENU', 0, -h / 2 + 60);
      g.fillStyle = HOT; g.fillRect(-w / 2 + 40, -h / 2 + 100, w - 80, 5);
      font(g, 30, 700, MONO); g.fillText('scan to order', 0, -h / 2 + 140);
      miniCode(g, 0, 60, 230, MM);
    });
    sheet(g, 730, 830 - (1 - Math.min(1, a2)) * 80, 330, 430, .05, clamp(a2 * 3, 0, 1), function (g, w, h) {
      g.fillStyle = '#2f5aa8'; g.fillRect(-w / 2, -h / 2, w, 130); font(g, 110, 900); g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('P', 0, -h / 2 + 70);
      font(g, 30, 700, MONO); g.fillStyle = INK; g.fillText('pay by phone', 0, -h / 2 + 168);
      miniCode(g, 0, 85, 200, MM);
    });
    sheet(g, 520, 1075 - (1 - Math.min(1, a3)) * 80, 520, 210, -.02, clamp(a3 * 3, 0, 1), function (g, w, h) {
      g.fillStyle = HOT; g.fillRect(-w / 2, -h / 2, 26, h);
      font(g, 44, 900); wide(g); g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('ADMIT ONE', -w / 2 + 56, -30);
      font(g, 30, 700, MONO); g.fillText('ROW F · SEAT 9', -w / 2 + 56, 30);
      miniCode(g, w / 2 - 66, 0, 116, MM);
    }, '#efe2c4');
    levelsRow(g, CX, 1222, fin(t, mk0 - .05), 40);
    chip(g, 'LEVEL M ≈ 15%', CX, 1318, { px: 76, wt: 900, bg: HOT, fg: BG, a: fin(t, cd - .1), s: lerp(1.25, 1, clamp(pop(t, cd - .1, 3.2), 0, 1)) * kn(t, f15), rot: -.02 });
    label(g, '“MOST FREQUENTLY SELECTED” · DENSO WAVE', CX, 1410, fin(t, mk0 - .05), CREAM, 30, 'center', true);
  }

  /* =====================================================================================================
     SCENE 8 · end: back to the torn code, three squares coral, the fourth corner dashed; grows back into frame 0
     ===================================================================================================== */
  var ENDC = { x: CX, y: 880, w: 560 };
  function endScene(g, t) {
    var s0 = S('end').t0, fq = at('end', 'find'), wc = at('end', 'which'), em = at('end', 'empty');
    var out = eio(seg(t, HOME - .6, HOME)), oa = 1 - out, tk = pop(t, s0 + .02, 2.6);
    var x = lerp(ENDC.x, BIG.x, out), y = lerp(ENDC.y + (1 - Math.min(1, tk)) * 100, BIG.y, out), w = lerp(ENDC.w * lerp(1, 1.06, eio(seg(t, s0, HOME - .6))), BIG.w, out) * kn(t, em);
    /* a clean code: three squares coral, the fourth corner left plain so the viewer has to look. It tears only as it
       grows back into frame 0, the piece starting in place */
    qrCode(g, { x: x, y: y, w: w, rot: lerp(.01, swayAt(t - DUR), out), tear: out > 0, piece: out > 0 ? { dx: 1.2 * out, dy: 1.5 * out, rot: .1 * out, a: 1 } : null, finder: fin(t, fq) * oa });
    /* the answer box drops in on "Which" */
    var bkk = pop(t, wc - .12, 2.8), ca = clamp(bkk * 3, 0, 1) * oa;
    if (ca > 0) {
      g.save(); g.globalAlpha *= ca; var bx = CX - 300, by = 1200 - (1 - Math.min(1, bkk)) * 90;
      rr(g, bx + 6, by + 10, 600, 100, 50); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
      rr(g, bx, by, 600, 100, 50); g.fillStyle = BG; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
      font(g, 44, 500, MONO); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('corner: __', bx + 80, by + 52);
      if (Math.floor(t * 2) % 2 === 0) { g.fillStyle = HOT; g.fillRect(bx + 48, by + 22, 10, 58); }
      g.restore();
    }
    block(g, ['Denso Wave, qrcode.com · ISO/IEC 18004', 'read Oct 26 2026 · code decoded: ZXing, zbar'], CX, 1385, 30, fin(t, s0 + .3) * oa, true, CREAM, 500);
  }

  /* ---------- captions: the narrator's words, one block at a time; only stressed words get the coral pill ---------- */
  var CAPBRK = { cd: ['the'], thirty: ['up'], where: ['where'], rare: ['for'], factory: ['for'], most: ['most', 'about'] };
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;   /* frame 0 carries TORN QR CODE. / STILL SCANS. instead: ≤ 5 words on screen */
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
  var STRESS = [['ask', 'gone'], ['trick', 'trick'], ['trick', 'backup'], ['cd', 'reedsolomon'], ['cd', 'cds'], ['thirty', 'top'], ['thirty', '30%'], ['thirty', 'rebuilt'],
    ['corners', 'only'], ['corners', 'corner'], ['where', 'camera'], ['where', 'where'], ['up', 'three'], ['up', 'up'],
    ['rare', 'magazines'], ['rare', 'boxes'], ['rare', 'rarest'], ['factory', '1994'], ['factory', 'dirty'], ['most', 'most'], ['most', '15%'], ['end', 'empty']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  /* captions never draw over a cut */
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE - .14, sc.t0 - SWIPE) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1 };
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
  var NOISE, SCENES = { hook: hookScene, split: splitScene, rebuild: rebuildScene, corners: corScene, rare: rareScene, factory: factoryScene, most: mostScene, end: endScene };
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
  /* the cut's edge: torn paper, a zigzag with a slow wobble */
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
      if (si === 0) headline(g, t, headA(t));
      if (back > 0) { captions(g, t, 1 - back); headline(g, 0, seg(t, HOME + .1, HOME + .35), true); } else captions(g, t);
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
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText('Why a torn QR code', CX, 300);
    var b = 'still scans', wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 14, 400 - 70, wb + 28, 96, 16); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 400); g.restore();
  }
  function TEXTS(t) {
    var out = [];
    function T(id, text, a, b) { if (t >= a && t < b) out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    function cut(id) { return S(id).t0 - .2; }
    T('head', 'TORN QR CODE.', 0, at('ask', 'so') - .08); T('head', 'TORN QR CODE.', HOME + .2, DUR + 1);
    T('still', 'STILL SCANS.', at('hook', 'still') + .1, S('trick').t0 - SWIPE + .05);
    T('cond', 'LEVEL H · CORNERS INTACT', at('hook', 'still') + .1, S('trick').t0 - SWIPE + .05);
    T('backup', 'BACKUP', at('trick', 'part') + .1, at('cd', 'math') - .05);
    T('rs', 'REED–SOLOMON', at('cd', 'reedsolomon') + .1, cut('thirty'));
    T('cds', 'SAME FIX AS CDs', at('cd', 'reedsolomon') + .2, cut('thirty'));
    T('h', 'LEVEL H', at('thirty', 'level') + .1, at('corners', 'but') - .1);
    T('levels', 'L 7% · M 15% · Q 25% · H 30%', at('most', 'maker') + .15, cut('end'));
    T('tear', 'THIS TEAR: 11 OF 70 BYTES', at('thirty', '30%') + .2, T2t() + .05);
    T('spare', 'HALF THE SPARE USED', at('thirty', '30%') + .3, T2t() + .05);
    T('30', 'UP TO ≈30% OF ITS BYTES', at('thirty', 'up') + .1, T2t() + .05);
    T('only', 'ONLY IF THE CORNERS SURVIVE', at('corners', 'but') + .1, at('where', 'camera') - .3);
    T('angle', 'ANY ANGLE', start('up') + .1, cut('rare'));
    T('1994', 'DENSO WAVE, JAPAN', S('factory').t0 + .3, cut('most'));
    T('m15', 'LEVEL M ≈ 15%', at('most', 'codes') + .1, cut('end'));
    /* the answer box ("corner: __") is a prompt, not a read: it drops in on "Which" and is not dwell-checked */
    return out;
  }

  /* ---------- events: the sound design reads the same word times; hits sit between words, never on them ---------- */
  var EV = [], ALLW = [];
  VO.lines.forEach(function (l) { l.words.forEach(function (w) { ALLW.push(w); }); });
  /* a hit that would land inside a spoken word moves to just before that word starts */
  /* a hit's whole body (t … t + body) must sit in a real gap between words: loop until it does. Before the word if the
     gap there holds it, else just after the word ends. */
  var BODY = { stamp: .2, stampS: .16, slap: .16, clack: .2, thump: .16, rip: .22, scratch: .24, paper: .17, peel: .3, swish: .28, pop: .12, tick: .04, key: .04 };
  function gapT(t, body) {
    for (var guard = 0; guard < 40; guard++) {
      var hit = -1;
      for (var i = 0; i < ALLW.length; i++) { var w = ALLW[i]; if (t < w.t1 + .01 && t + body > w.t0 - .03) { hit = i; break; } }
      if (hit < 0) return t;
      var wd = ALLW[hit], prevEnd = hit > 0 ? ALLW[hit - 1].t1 : -1, before = wd.t0 - .03 - body;
      t = (before >= prevEnd + .01 && before >= 0) ? before : wd.t1 + .02;
    }
    return t;
  }
  function E(o) { o.t = gapT(o.t, BODY[o.type] || (o.t1 ? .08 : .12)); EV.push(o); }
  /* a sound that must stay inside one gap between words (a cut's tear): clip it to the gap, or drop it */
  function gapSpan(a, b) {
    for (var i = 0; i < ALLW.length; i++) { var w = ALLW[i]; if (w.t1 + .02 > a && w.t0 - .03 < b) { if (w.t0 - .03 - a >= .12) b = w.t0 - .03; else a = w.t1 + .02; } }
    return b - a >= .1 ? [a, b] : null;
  }
  function initTimes() {
    var i;
    /* hook: the tear on frame 0 (quiet, before the first word), the phone, the lock */
    E({ t: 0, type: 'paper', g: .45 }); E({ t: .3, type: 'swish' }); E({ t: wend('hook', 'scans') - .08, type: 'clack' });
    /* ask: the ? stamp */
    E({ t: at('ask', 'how') - .12, type: 'stampS', g: .45 });
    /* cuts: a paper tear, inside the gap only */
    SC.forEach(function (sc) { if (sc.swipe) { var s = gapSpan(sc.t0 - SWIPE, sc.t0); if (s) EV.push({ t: s[0], type: 'tear', t1: s[1] }); } });
    /* trick: DATA, BACKUP, EVERY CODE */
    E({ t: at('trick', 'part') - .1, type: 'pop', g: .6 }); E({ t: at('trick', 'backup') - .1, type: 'slap' }); E({ t: at('trick', 'every') - .1, type: 'stampS', g: .5 });
    /* cd: rolls in, the chip, the scratch */
    E({ t: start('cd') - .3, type: 'swish' }); E({ t: at('cd', 'reedsolomon') - .1, type: 'pop', g: .7 }); E({ t: at('cd', 'cds') - .2, type: 'scratch' });
    /* thirty: LEVEL H, the rebuild ticks, the 30% chip */
    /* nothing inside "up to thirty percent": Whisper heard "3 %" through the rebuild ticks; the rebuild lands on one pop after "rebuilt" */
    E({ t: at('thirty', 'level') - .1, type: 'pop', g: .6 }); E({ t: wend('thirty', 'rebuilt') + .05, type: 'slap' });
    /* corners: the rip, NO SCAN */
    E({ t: T2t(), type: 'rip' }); E({ t: T2t() + .25, type: 'stampS', g: .55 });
    /* where + up: three squares, the brackets snap, four turns */
    for (i = 0; i < 3; i++) E({ t: at('where', 'those') - .05 + i * .08, type: 'pop', g: .4 });
    E({ t: at('where', 'camera') - .1, type: 'clack' }); E({ t: at('where', 'where') - .1, type: 'swish' });
    [at('up', 'three'), at('up', 'knows'), at('up', 'way'), at('up', 'up')].forEach(function (s) { E({ t: s - .08, type: 'swish' }); });
    /* rare: two props slap down, the square, the bars */
    E({ t: at('rare', 'magazines') - .2, type: 'slap' }); E({ t: at('rare', 'boxes') - .15, type: 'slap' }); E({ t: at('rare', 'rarest') - .15, type: 'stampS', g: .45 });
    for (i = 0; i < 5; i++) E({ t: at('rare', 'rarest') + .15 + i * .1, type: 'tick', g: .12 });
    E({ t: at('rare', 'pattern') - .2, type: 'pop', g: .6 });
    /* factory: the tag, 1994, the smudge */
    E({ t: S('factory').t0 + .05, type: 'paper' }); E({ t: at('factory', '1994') - .1, type: 'stampS', g: .55 }); E({ t: at('factory', 'dirty') - .1, type: 'scratch' }); E({ t: wend('factory', 'dirty') + .05, type: 'pop', g: .5 });
    /* most: three props, the chip */
    E({ t: S('most').t0 + .05, type: 'paper' }); E({ t: at('most', 'most') - .2, type: 'paper' }); E({ t: at('most', 'codes') - .1, type: 'paper' }); E({ t: at('most', 'about') - .1, type: 'slap' });
    /* end */
    E({ t: S('end').t0 + .02, type: 'paper', g: .6 }); E({ t: at('end', 'which') - .1, type: 'pop', g: .7 }); E({ t: at('end', 'empty') - .05, type: 'pop', g: .9 });
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
    function stampS(t, big) { thump(t, big ? .6 : .45); var n = noise(t, .16), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1500; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .42 : .32], [t + .12, 0]]); tickS(t + .005, .18); }
    function paper(t, g) { g = g || 1; band(t, t + .15, 1800, 3800, .07 * g, .02, 1.2, (rnd() - .5) * .8); tickS(t + .12, .08 * g); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function rise(t, t1) { band(t, t1, 400, 1800, .03, .06, 3); }
    function clack(t) { thump(t, .5); tickS(t, .4); tickS(t + .045, .25); }
    function slap(t) { thump(t, .45); var n = noise(t, .1), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 900; var o = bus(1, .15); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .3], [t + .08, 0]]); }
    function key(t) { tickS(t, .25); osc('sine', 1900, t, t + .03, 1, [[t, 0], [t + .002, .03], [t + .025, 0]]); }
    /* a paper peel: a short rising rasp */
    function peel(t, g) { g = g || 1; band(t, t + .28, 1200, 3400, .05 * g, .02 * g, 2.2, .2); }
    /* a tear: a gritty band rising with the edge */
    function tearS(t, t1) { band(t, t1 + .03, 700, 2600, .06, .05, 1.8); for (var j = 0; j < 5; j++) tickS(t + (t1 - t) * (j + .5) / 5, .07); }
    function rip(t) { band(t - .02, t + .2, 2500, 900, .14, .04, 1.4); tickS(t, .2); tickS(t + .06, .14); }
    /* the reader bar: a soft scanning tone, a slow sweep down */
    function scan(t, t1) { osc('sine', 880, t, t1 + .05, 1, [[t, 0], [t + .04, .025], [t1 - .03, .02], [t1 + .05, 0]], .2).frequency.exponentialRampToValueAtTime(440, t1); }
    function scratch(t) { band(t, t + .22, 2600, 1800, .08, .03, 2.5, -.2); }
    EV.forEach(function (e) {
      if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'thump') thump(e.t, e.g);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'stamp') stampS(e.t, e.big);
      else if (e.type === 'stampS') stampShort(e.t, e.g);
      else if (e.type === 'paper') paper(e.t, e.g);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'rise') rise(e.t, e.t1);
      else if (e.type === 'clack') clack(e.t);
      else if (e.type === 'slap') slap(e.t);
      else if (e.type === 'key') key(e.t);
      else if (e.type === 'peel') peel(e.t, e.g);
      else if (e.type === 'tear') tearS(e.t, e.t1);
      else if (e.type === 'rip') rip(e.t);
      else if (e.type === 'scan') scan(e.t, e.t1);
      else if (e.type === 'scratch') scratch(e.t);
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”·→…#?‹✓✕–'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initTimes();
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: at('thirty', 'rebuilt') + .3, SLUG: 'qrcode', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
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
