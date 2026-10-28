/* "Leonida region by region" — the six places Rockstar names in the GTA 6 state, on our own drawn silhouette.
   Narrated first and cut to the voice: every beat reads a word time from vo/vo.js (window.VO). Pure function of t.
   Contract like ../nextword/film.js: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Native move: the spotlight, one disc of light that lands on one region at a time.
   Own graphics only: no Rockstar footage, logo, key art or map art. Positions are approximate unless Rockstar's text says. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur;
  var BG = '#0b0820', PANEL = '#1a1340', PANEL2 = '#2a1d5c', CREAM = '#fff3e6', DIM = 'rgba(255,243,230,.55)', FAINT = 'rgba(255,243,230,.14)';
  var PINK = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d', PURP = '#9b7bff', MINT = '#3be8a0', SAND = '#ffd36b';
  var DISP = 'Archivo', MONO = '"Geist Mono"';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .8); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function at(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }

  /* ---------- the regions: Rockstar's six, positions approximate (u, v on our own silhouette) ---------- */
  var REG = [
    { id: 'vice', name: 'VICE CITY', short: 'VICE CITY', col: PINK, u: .80, v: .58, r: .17, quote: '“the sun and fun capital of America”', tag: 'POSITION APPROXIMATE' },
    { id: 'keys', name: 'LEONIDA KEYS', short: 'THE KEYS', col: TEAL, u: .40, v: .965, r: .17, quote: '“tropical archipelago”', tag: 'POSITION APPROXIMATE', keys: true },
    { id: 'grass', name: 'GRASSRIVERS', short: 'GRASSRIVERS', col: MINT, u: .55, v: .74, r: .17, quote: '“primordial expanse”', tag: 'POSITION APPROXIMATE' },
    { id: 'port', name: 'PORT GELLHORN', short: 'PORT GELLHORN', col: PURP, u: .22, v: .40, r: .17, quote: '“shut-down attractions”', tag: 'POSITION APPROXIMATE' },
    { id: 'amb', name: 'AMBROSIA', short: 'AMBROSIA', col: ORG, u: .52, v: .40, r: .17, quote: '“In the heart of Leonida”', tag: 'ROCKSTAR: “HEART OF LEONIDA”' },
    { id: 'kal', name: 'MOUNT KALAGA', short: 'MOUNT KALAGA', col: SAND, u: .50, v: .13, r: .17, quote: '“northern border”', tag: 'ROCKSTAR: NORTHERN BORDER' }
  ];
  var MAP = { x: 240, y: 450, w: 600, h: 740 };
  var COAST = [[.04,.10],[.30,.03],[.52,.08],[.74,.03],[.96,.12],[.92,.30],[.98,.44],[.90,.58],[.82,.70],[.72,.78],[.66,.90],[.56,.93],[.50,.82],[.44,.70],[.34,.62],[.22,.60],[.10,.48],[.14,.34],[.02,.24]];
  var ISLETS = [[.60, .955, .05, .022, .2], [.52, .975, .045, .02, -.1], [.44, .965, .05, .022, .3], [.35, .985, .045, .02, 0], [.26, .975, .04, .018, -.2]];

  /* scenes keyed to the voice */
  var SC = [{ id: 'hook', name: 'The state', t0: 0 }, { id: 'six', name: 'Six regions', t0: start('six') - .15 }];
  REG.forEach(function (r) { SC.push({ id: r.id, name: r.name, t0: start(r.id) - .2 }); });
  SC.push({ id: 'launch', name: 'Nov 19', t0: start('launch') - .15 }, { id: 'ask', name: 'Which first?', t0: start('ask') - .3 });
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = end('ask') + .35;
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function regIdx(si) { return si - 2; }       // region scenes are SC[2..7]

  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true }, NOISE;
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
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    font(g, px, o.wt, o.fam);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad, w = tw + pad * 2, h = px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore();
    return w;
  }
  function textW(g, text, px, wt, fam) { font(g, px, wt, fam); return g.measureText(text).width; }
  function label(g, text, x, y, a, col, px) {
    px = Math.max(30, px || 30);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = col || DIM; try { g.letterSpacing = '3px'; } catch (e) {}
    g.fillText(text, x, y); g.restore();
  }
  function stamp(g, text, x, y, t, t0, t1, px, col, rot) {
    if (t < t0 || t > t1 + .3) return;
    var k = sp(t, t0, 3, .55), out = 1 - seg(t, t1, t1 + .3), s = lerp(1.2, 1, clamp(k, 0, 1.2));
    g.save(); g.globalAlpha = clamp(k * 3, 0, 1) * out; g.translate(x, y); g.rotate(rot == null ? -.1 : rot); g.scale(s, s);
    font(g, px, 900); var w = g.measureText(text).width + px * .7, h = px * 1.25;
    rr(g, -w / 2, -h / 2, w, h, px * .18); g.fillStyle = 'rgba(11,8,32,.8)'; g.fill(); g.strokeStyle = col; g.lineWidth = px * .08; g.stroke();
    g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, px * .05); g.restore();
  }

  /* ---------- map ---------- */
  function mx(u) { return MAP.x + u * MAP.w; }
  function my(v) { return MAP.y + v * MAP.h; }
  function coastPath(g) {
    var P = COAST.map(function (p) { return [mx(p[0]), my(p[1])]; }), n = P.length;
    g.beginPath();
    g.moveTo((P[n - 1][0] + P[0][0]) / 2, (P[n - 1][1] + P[0][1]) / 2);
    for (var i = 0; i < n; i++) { var a = P[i], b = P[(i + 1) % n]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    g.closePath();
  }
  function isletPath(g, s) {
    ISLETS.forEach(function (e) { g.moveTo(mx(e[0]) + e[2] * MAP.w * s, my(e[1])); g.ellipse(mx(e[0]), my(e[1]), e[2] * MAP.w * s, e[3] * MAP.h * s, e[4], 0, 6.2832); });
  }
  function level(i, t) {                     // 0 before, 1 while active, then settles to a dim "done" glow
    var s = SC[i + 2], a = clamp(sp(t, s.t0 + .08, 2.2, .75), 0, 1.15);
    if (t < s.t0 + .08) return { a: 0, rad: 1 };
    var d = eo(seg(t, s.t1 - .05, s.t1 + .5));
    var all = seg(t, SC[8].t0, SC[8].t0 + .5);
    return { a: a * lerp(1, .42, d) * (1 - all) + a * .5 * all, rad: lerp(2.0, 1.25, d), act: d < .01 };
  }
  function drawMap(g, t, homeMode) {
    var T = homeMode ? 0 : t, k = eio(seg(T, start('six') - .1, start('six') + .55));
    /* flat offset shadow in teal while the land is pink */
    if (k < 1) { g.save(); g.globalAlpha = 1 - k; g.translate(16, 18); coastPath(g); g.fillStyle = TEAL; g.fill(); g.beginPath(); isletPath(g, 1); g.fill(); g.restore(); }
    coastPath(g); g.fillStyle = PINK; g.globalAlpha = 1 - k; g.fill(); g.globalAlpha = k; g.fillStyle = PANEL; g.fill(); g.globalAlpha = 1;
    g.beginPath(); isletPath(g, 1); g.fillStyle = PINK; g.globalAlpha = 1 - k; g.fill(); g.globalAlpha = k; g.fillStyle = PANEL; g.fill(); g.globalAlpha = 1;
    /* spotlight discs, clipped to the land */
    if (!homeMode) {
      g.save(); coastPath(g); g.clip();
      REG.forEach(function (r, i) {
        if (r.keys) return;
        var L = level(i, t); if (L.a <= 0.001) return;
        g.globalAlpha = clamp(L.a, 0, 1) * .85; g.fillStyle = r.col;
        g.beginPath(); g.arc(mx(r.u), my(r.v), r.r * MAP.w * L.rad, 0, 6.2832); g.fill();
      });
      g.restore();
      var Lk = level(1, t);
      if (Lk.a > 0.001) {
        g.save(); g.globalAlpha = clamp(Lk.a, 0, 1); g.beginPath(); isletPath(g, 1.08); g.fillStyle = TEAL; g.fill();
        var pr = (t * .9) % 1; g.globalAlpha = clamp(Lk.a, 0, 1) * (1 - pr) * (Lk.act ? 1 : 0); g.strokeStyle = TEAL; g.lineWidth = 6;
        g.beginPath(); g.arc(mx(.44), my(.965), 70 + pr * 120, 0, 6.2832); g.stroke(); g.restore();
      }
    }
    /* coast: a solid line and a light that runs around it, so the map never sits still */
    coastPath(g); g.strokeStyle = PINK; g.lineWidth = 7; g.lineJoin = 'round'; g.stroke();
    g.beginPath(); isletPath(g, 1); g.stroke();
    g.save(); coastPath(g); g.strokeStyle = CREAM; g.lineWidth = 7; g.setLineDash([70, 880]); g.lineDashOffset = -T * 420; g.stroke(); g.restore();
  }

  /* ---------- icons: flat, hand-built, drawn around (0,0) at 1x ---------- */
  function poly(g, pts, fill) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillStyle = fill; g.fill(); }
  function palm(g, x, y, h, lean, t, col) {
    g.save(); g.translate(x, y); g.strokeStyle = '#2a1d5c'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(lean * .5, -h * .5, lean, -h); g.stroke();
    g.translate(lean, -h); var sw = Math.sin(t * 1.6) * .05;
    for (var i = 0; i < 6; i++) { g.save(); g.rotate(-1.9 + i * .75 + sw); g.beginPath(); g.ellipse(0, -h * .28, h * .09, h * .3, 0, 0, 6.2832); g.fillStyle = col; g.fill(); g.restore(); }
    g.restore();
  }
  function icon(g, id, t, t0) {
    var T = t - t0;
    if (id === 'vice') {
      g.beginPath(); g.arc(0, 40, 62, Math.PI, 0); g.fillStyle = ORG; g.fill();
      var bx = [-78, -42, -6, 30], bw = [32, 32, 32, 32], bh = [96, 140, 78, 118], bc = [TEAL, CREAM, PURP, TEAL];
      bx.forEach(function (x, i) {
        var k = clamp(sp(t, t0 + .08 + i * .07, 2.4, .75), 0, 1.1), h = bh[i] * k;
        g.fillStyle = bc[i]; g.fillRect(x, 50 - h, bw[i], h); poly(g, [[x, 50 - h], [x + 8, 50 - h - 14], [x + bw[i] - 8, 50 - h - 14], [x + bw[i], 50 - h]], bc[i]);
        g.fillStyle = BG; for (var j = 0; j < 4; j++) if (h > 30 + j * 24) g.fillRect(x + 8, 50 - h + 12 + j * 22, 6, 9), g.fillRect(x + 19, 50 - h + 12 + j * 22, 6, 9);
      });
      palm(g, 92, 52, 120, 22, t, MINT);
    } else if (id === 'keys') {
      var bob = Math.sin(T * 2.2) * 6;
      g.save(); g.translate(0, -62 + bob); g.rotate(Math.sin(T * 1.7) * .05);
      poly(g, [[-62, 0], [62, 0], [44, 30], [-44, 30]], CREAM); poly(g, [[-6, -4], [-6, -86], [50, -4]], PINK); poly(g, [[-14, -4], [-14, -66], [-52, -4]], ORG);
      g.restore();
      g.strokeStyle = CREAM; g.lineWidth = 6; g.lineCap = 'round';
      for (var i = 0; i < 3; i++) { g.beginPath(); for (var x = -110; x <= 110; x += 10) { var y = -20 + i * 22 + Math.sin(x * .09 + T * 3 + i) * 5; if (x === -110) g.moveTo(x, y); else g.lineTo(x, y); } g.globalAlpha = .7 - i * .15; g.stroke(); g.globalAlpha = 1; }
      palm(g, 84, -28, 80, -14, t, MINT);
    } else if (id === 'grass') {
      g.strokeStyle = CREAM; g.lineWidth = 5; g.lineCap = 'round'; g.globalAlpha = .6;
      for (var r = 0; r < 3; r++) { g.beginPath(); for (var xx = -110; xx <= 110; xx += 10) { var yy = 52 + r * 20 + Math.sin(xx * .1 + T * 2.4 + r * 2) * 5; if (xx === -110) g.moveTo(xx, yy); else g.lineTo(xx, yy); } g.stroke(); }
      g.globalAlpha = 1;
      var drift = Math.sin(T * 1.3) * 16, G = '#06432c';
      g.save(); g.translate(drift, 8);
      rr(g, -78, -16, 150, 36, 18); g.fillStyle = G; g.fill();
      poly(g, [[-78, -4], [-122, 14], [-78, 14]], G); poly(g, [[60, -10], [112, -2], [112, 14], [60, 18]], G);
      g.fillStyle = G; g.beginPath(); g.arc(34, -22, 12, 0, 6.2832); g.arc(62, -22, 12, 0, 6.2832); g.fill();
      g.fillStyle = ORG; g.beginPath(); g.arc(34, -23, 6, 0, 6.2832); g.arc(62, -23, 6, 0, 6.2832); g.fill();
      g.fillStyle = CREAM; for (var q = 0; q < 5; q++) poly(g, [[70 + q * 8, 14], [74 + q * 8, 24], [78 + q * 8, 14]], CREAM);
      g.restore();
      [-96, -70, 84, 104].forEach(function (x, i) { var sw = Math.sin(T * 1.8 + i) * 4, h = 90 + hash(i + 4) * 40; g.fillStyle = '#0f7a52'; g.beginPath(); g.ellipse(x + sw, 22 - h / 2, 7, h / 2, sw * .03, 0, 6.2832); g.fill(); g.fillStyle = '#7a4a2a'; g.beginPath(); g.ellipse(x + sw * 1.4, 22 - h + 6, 9, 20, 0, 0, 6.2832); g.fill(); });
    } else if (id === 'port') {
      g.save(); g.translate(-78, 6); g.strokeStyle = CREAM; g.lineWidth = 5; g.beginPath(); g.arc(0, -42, 48, 0, 6.2832); g.stroke();
      g.globalAlpha = .55; for (var s = 0; s < 6; s++) { g.beginPath(); g.moveTo(0, -42); g.lineTo(Math.cos(s * 1.047) * 48, -42 + Math.sin(s * 1.047) * 48); g.stroke(); }
      g.beginPath(); g.moveTo(-30, 40); g.lineTo(0, -42); g.lineTo(30, 40); g.stroke(); g.restore();
      g.fillStyle = CREAM; g.fillRect(40, -70, 9, 130);
      rr(g, 6, -118, 160, 66, 12); g.fillStyle = CREAM; g.fill();
      chip(g, 'MOTEL', 86, -85, { px: 36, pad: 0, fg: BG, wt: 900 });
      var on = Math.cos(T * 11) > -.3;
      g.globalAlpha = on ? 1 : .25; rr(g, 26, -48, 120, 14, 7); g.fillStyle = PINK; g.fill(); g.globalAlpha = 1;
      g.fillStyle = BG; g.fillRect(-110, 60, 260, 9);
    } else if (id === 'amb') {
      g.fillStyle = CREAM; g.fillRect(-84, -12, 124, 66); poly(g, [[-84, -12], [-62, -40], [18, -40], [40, -12]], CREAM);
      g.fillStyle = BG; for (var w = 0; w < 4; w++) g.fillRect(-70 + w * 28, 8, 14, 18);
      g.fillStyle = CREAM; g.fillRect(52, -78, 24, 132); g.fillRect(84, -48, 20, 102);
      g.fillStyle = ORG; g.fillRect(52, -78, 24, 14); g.fillRect(84, -48, 20, 12); g.fillRect(52, -42, 24, 10);
      for (var p = 0; p < 6; p++) {
        var u = ((T * .45 + p / 6) % 1), px = 64 + Math.sin(u * 5 + p) * 14 + u * 36, py = -84 - u * 120, rr2 = 14 + u * 26;
        g.globalAlpha = (1 - u) * .85; g.fillStyle = CREAM; g.beginPath(); g.arc(px, py, rr2, 0, 6.2832); g.fill();
      }
      g.globalAlpha = 1;
      for (var c = 0; c < 3; c++) { var cu = ((T * .8 + c / 3) % 1); g.save(); g.translate(-100 + cu * 90, 64); g.fillStyle = CREAM; g.fillRect(-9, -9, 18, 18); g.restore(); }
      g.fillStyle = BG; g.fillRect(-110, 54, 240, 8);
    } else if (id === 'kal') {
      poly(g, [[-120, 52], [-44, -70], [30, 52]], '#2a1d5c'); poly(g, [[-20, 52], [58, -96], [132, 52]], '#3a2a7a');
      poly(g, [[-44, -70], [-62, -40], [-50, -46], [-40, -34], [-28, -44], [-16, -38]], CREAM); poly(g, [[58, -96], [38, -62], [50, -68], [60, -52], [72, -66], [82, -58]], CREAM);
      for (var tt = 0; tt < 5; tt++) { var tx = -96 + tt * 52 + (tt % 2) * 12, th = 46 + hash(tt + 2) * 20, sw2 = Math.sin(t * 1.4 + tt) * 2; poly(g, [[tx + sw2, 52 - th], [tx - 16, 52 - 8], [tx + 16, 52 - 8]], '#0f7a52'); poly(g, [[tx + sw2, 52 - th - 20], [tx - 12, 52 - th + 8], [tx + 12, 52 - th + 8]], MINT); }
      g.fillStyle = BG; g.fillRect(-130, 52, 270, 8);
    }
  }
  function pin(g, i, x, y, a, s, col, hot, t) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s);
    if (hot) { var pr = (t * 1.1 + i * .17) % 1; g.globalAlpha *= (1 - pr) * .8; g.strokeStyle = col; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 30 + pr * 44, 0, 6.2832); g.stroke(); g.globalAlpha = clamp(a, 0, 1); }
    g.beginPath(); g.arc(0, 0, 30, 0, 6.2832); g.fillStyle = CREAM; g.fill(); g.lineWidth = 6; g.strokeStyle = col; g.stroke();
    font(g, 34, 900); g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), 0, 2); g.restore();
  }

  /* ---------- background ---------- */
  function stage(g, t, sunK) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    /* a striped sun behind the map */
    var cx = 540, cy = 830, R = 430;
    g.save(); g.globalAlpha = sunK; g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.clip();
    g.fillStyle = ORG; g.fillRect(0, cy - R, W, R); g.fillStyle = '#8a2f9a'; g.fillRect(0, cy, W, R);
    g.fillStyle = BG; var off = (t * 14) % 56;
    for (var i = 0; i < 9; i++) { var yy = cy + 20 + i * 56 - off, hh = 6 + i * 3.2; if (yy > cy - 4) g.fillRect(0, yy, W, hh); }
    g.restore();
    /* palms, low corners */
    g.save(); g.globalAlpha = .9;
    palm(g, 110, 1900, 520, 40, t * .7, '#1f1650'); palm(g, 960, 1920, 600, -50, t * .7 + 1.3, '#1f1650'); palm(g, 250, 1920, 340, 20, t * .7 + 2, '#1f1650');
    g.restore();
  }

  /* ---------- frame ---------- */
  var PINT = [];                                   // when each numbered pin lands in the "six" scene
  function pinTime(i) { return at('six', 'six') + .05 + i * .26; }
  function card(g, t, i) {
    var r = REG[i], s = SC[i + 2], k = clamp(sp(t, s.t0 + .1, 2.6, .78), 0, 1.08), out = 1 - seg(t, s.t1 - .12, s.t1 + .04);
    var a = clamp(k * 2, 0, 1) * out; if (a <= 0) return;
    g.save(); g.globalAlpha = a; g.translate(0, (1 - Math.min(1, k)) * 70);
    rr(g, 100, 1210, 880 - 40, 178, 30); g.fillStyle = PANEL; g.fill();
    rr(g, 100, 1210, 16, 178, 8); g.fillStyle = r.col; g.fill();
    g.beginPath(); g.arc(184, 1299, 40, 0, 6.2832); g.fillStyle = r.col; g.fill();
    font(g, 46, 900); g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), 184, 1302);
    font(g, 58, 900); g.textAlign = 'left'; g.fillStyle = CREAM; g.fillText(r.name, 252, 1262);
    var qpx = 38; font(g, qpx, 600); while (g.measureText(r.quote).width > 660 && qpx > 30) { qpx -= 1; font(g, qpx, 600); }
    g.fillStyle = r.col; g.fillText(r.quote, 252, 1335);
    g.restore();
  }
  function bottomLabel(g, t) {
    var si = sceneAt(t), a = 1, txt = '', col = DIM;
    if (si === 1 || si === 8) txt = 'SOURCE: ROCKSTARGAMES.COM/VI';
    else if (si >= 2 && si <= 7) { txt = REG[si - 2].tag; col = REG[si - 2].col; }
    else if (si === 9) txt = 'OUR DRAWING, NOT ROCKSTAR’S MAP';
    else return;
    if (si === 1) a = seg(t, at('six', 'site') - .1, at('six', 'site') + .2);
    var s = SC[si], q = si >= 2 && si <= 7 ? seg(t, s.t0 + .25, s.t0 + .5) * (1 - seg(t, s.t1 - .12, s.t1)) : seg(t, s.t0 + .2, s.t0 + .5);
    label(g, txt, 540, 1428, a * q, col, 30);
  }

  function frame(g, t, homeMode) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    var T = homeMode ? 0 : t, si = homeMode ? 0 : sceneAt(t);
    var hookK = 1 - eio(seg(T, start('six') - .1, start('six') + .55));
    stage(g, t, lerp(.55, .96, hookK));
    /* the map: big on frame 0, then settles and takes small pushes */
    var ms = lerp(1.0, 1.32, hookK) * (1 + .018 * seg(T, SC[1].t0, DUR)) * lerp(.96, 1, eo(seg(T, 0, .5)));
    if (homeMode) ms = 1.32 * .96;
    g.save(); g.translate(540, 820); g.scale(ms, ms); g.translate(-540, -820);
    drawMap(g, t, homeMode);
    if (!homeMode) {
      /* pins */
      REG.forEach(function (r, i) {
        var pk = clamp(sp(t, pinTime(i), 3, .65), 0, 1.1), act = si === i + 2, px = mx(r.u), py = my(r.v);
        if (r.keys) py = my(.945);
        var sceneStart = SC[1].t0;
        if (t < pinTime(i) || si < 1) return;
        var vis = act ? 1 - clamp(sp(t, SC[i + 2].t0 + .1, 3, .8), 0, 1) : 1;
        var alpha = (si >= 8 ? 1 : si === 1 ? 1 : .55);
        pin(g, i, px, py, pk * vis * alpha, 1, r.col, si === 1 || si === 9, t);
      });
      /* the icon of the active region */
      if (si >= 2 && si <= 7) {
        var r2 = REG[si - 2], s2 = SC[si], k = clamp(sp(t, s2.t0 + .12, 2.6, .7), 0, 1.12), out = 1 - seg(t, s2.t1 - .08, s2.t1 + .1);
        var cx = mx(r2.u), cy = my(r2.v) + (r2.keys ? -40 : 0);
        g.save(); g.translate(cx, cy); g.scale(k * 1.15 * out + .001, k * 1.15 * out + .001); icon(g, r2.id, t, s2.t0 + .12); g.restore();
      }
      /* the word on frame 0 */
      var wa = hookK > .5 ? 1 : 0;
      if (hookK > 0.001) chip(g, 'LEONIDA', 540, 800, { px: 88, bg: CREAM, fg: BG, rot: -.07, a: hookK * clamp((t + .001) * 8, 0.0, 1) + (t < .001 ? hookK : 0), s: 1 });
    } else {
      chip(g, 'LEONIDA', 540, 800, { px: 88, bg: CREAM, fg: BG, rot: -.07 });
    }
    g.restore();
    if (homeMode) return;

    /* the six scene: a big count */
    if (si === 1) {
      var ck = clamp(sp(t, at('six', 'six'), 2.8, .6), 0, 1.1), co = 1 - seg(t, SC[2].t0 - .2, SC[2].t0);
      chip(g, '6 REGIONS', 540, 1300, { px: 104, bg: PINK, fg: BG, s: ck * 1.0, a: ck * 2 * co, rot: -.03 });
    }
    if (si >= 2 && si <= 7) card(g, t, si - 2);
    /* launch: chips then the stamp */
    if (si === 8) {
      var s8 = SC[8];
      var c1 = clamp(sp(t, at('launch', 'names') - .35, 3, .65), 0, 1.1), c2 = clamp(sp(t, at('launch', 'one'), 3, .65), 0, 1.1), gone = 1 - seg(t, SC[9].t0 - .15, SC[9].t0 + .05);
      chip(g, '6 NAMES', 300, 1300, { px: 64, bg: TEAL, fg: BG, s: c1, a: c1 * 2 * gone, rot: -.04 });
      chip(g, '1 STATE', 760, 1300, { px: 64, bg: ORG, fg: BG, s: c2, a: c2 * 2 * gone, rot: .04 });
    }
    if (si === 9) {
      var k9 = clamp(sp(t, SC[9].t0 + .05, 2.6, .7), 0, 1.1), fadeHome = 1 - seg(t, HOME - .2, HOME);
      REG.forEach(function (r, i) {
        var kk = clamp(sp(t, SC[9].t0 + .2 + i * .09, 3, .7), 0, 1.1), col = i % 2, row = (i / 2) | 0;
        chip(g, (i + 1) + '  ' + r.short, 330 + col * 420, 1222 + row * 74, { px: 34, bg: PANEL2, line: r.col, fg: CREAM, s: kk, a: kk * 2 * fadeHome, wt: 800, lw: 4, pad: 20 });
      });
    }
    STAMPS.forEach(function (s) { stamp(g, s[0], 540, 800, t, s[1], s[2], s[3], s[4], s[5]); });
    bottomLabel(g, t);
    if (LIVE.text) captions(g, t);

    /* the loop: the last frame dissolves back into frame 0 */
    var back = eio(seg(t, HOME, HOME + .45));
    if (back > 0) { g.save(); g.globalAlpha = back; frame(g, 0, true); g.restore(); }

    g.fillStyle = 'rgba(255,243,230,.12)'; g.fillRect(60, 140, W - 120, 6);
    g.fillStyle = PINK; g.fillRect(60, 140, (W - 120) * t / DUR, 6);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var STAMPS = [['NOV 19, 2026', at('launch', 'november'), at('ask', 'region') - .1, 88, ORG, -.05]];
  /* ---------- captions: the narrator's words, highlighted as spoken ---------- */
  function captions(g, t) {
    var card = null;
    VO.captions.forEach(function (c) { if (t >= c.t0 - .04 && t < c.t1 + .15) card = c; });
    if (!card) return;
    var k = clamp(spring(t - card.t0 + .04, 3.2, .7), 0, 1.1), out = 1 - seg(t, card.t1, card.t1 + .15);
    g.save(); g.font = '800 80px Archivo'; try { g.fontStretch = 'expanded'; } catch (e) {}
    g.textBaseline = 'alphabetic';
    var words = card.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 24;
    var lines = [[]], lw = [0], maxw = 780;
    words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; });
    var y0 = 360 - (lines.length - 1) * 48;
    g.globalAlpha = out;
    lines.forEach(function (ln, li) {
      var x = W / 2 - (lw[li] - gap) / 2, y = y0 + li * 96 + (1 - Math.min(1, k)) * 40;
      ln.forEach(function (i) {
        var w = words[i], cur = t >= w.t0 - .03 && t < w.t1 + .05, said = t >= w.t0 - .03;
        if (cur) { g.fillStyle = PINK; g.beginPath(); g.roundRect(x - 12, y - 70, ws[i] + 24, 92, 18); g.fill(); }
        g.fillStyle = cur ? BG : said ? CREAM : "rgba(255,243,230,.3)";
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }


  /* ---------- text dwell for the read check ---------- */
  function TEXTS(t) {
    var out = [], si = sceneAt(t);
    STAMPS.forEach(function (s, i) { if (t >= s[1] + .2 && t < s[2]) out.push({ id: 'stamp' + i, text: s[0], x0: 0, y0: 0, x1: 0, y1: 0 }); });
    if (si >= 2 && si <= 7 && t > SC[si].t0 + .1 && t < SC[si].t1 - .05) out.push({ id: 'card' + si, text: REG[si - 2].name + ' ' + REG[si - 2].quote, x0: 0, y0: 0, x1: 0, y1: 0 });
    return out;
  }

  /* ---------- events: sound design reads the same word times ---------- */
  var EV = [];
  function initTimes() {
    REG.forEach(function (r, i) { EV.push({ t: pinTime(i), type: 'blip', f: 600 + i * 110 }); });
    EV.push({ t: at('six', 'six'), type: 'thump' });
    var cue = { vice: 'ding', keys: 'blips', grass: 'bloop', port: 'click', amb: 'whirr', kal: 'thump' };
    REG.forEach(function (r, i) {
      var s = SC[i + 2];
      EV.push({ t: s.t0 + .02, type: 'swish' }, { t: s.t0 + .14, type: cue[r.id], n: 5, t1: s.t0 + 1.2 });
    });
    EV.push({ t: at('launch', 'names') - .35, type: 'boop' }, { t: at('launch', 'one'), type: 'boop' }, { t: at('launch', 'november'), type: 'stamp', big: true });
    REG.forEach(function (r, i) { EV.push({ t: SC[9].t0 + .2 + i * .09, type: 'blip', f: 700 + i * 90 }); });
    SC.forEach(function (s, i) { if (i > 8) EV.push({ t: s.t0 - .1, type: 'swish' }); });
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

  /* ---------- sound effects only (no music; Isac adds a trending sound on the platform) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], pts[0][0]); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], pts[k][0]); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, pts, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); o.connect(og); og.connect(bus(1, pan)); env(og.gain, pts); o.start(t0); o.stop(t1); return o; }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function blip(t, f, g) { var o = osc('sine', f, t, t + .12, [[t, 0], [t + .004, g || .09], [t + .1, 0]], (f - 1100) / 1400); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + .07); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, [[t, 0], [t + .004, g || .4], [t + .26, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function ding(t) { [76, 83, 88].forEach(function (m, j) { osc('sine', mtof(m), t + j * .04, t + 1.2, [[t + j * .04, 0], [t + j * .04 + .005, .09], [t + 1.1, 0]], (j - 1) * .4); }); }
    function stampS(t, big) { thump(t, big ? .7 : .5); var n = noise(t, .2), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1800; var o = bus(1); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .5 : .35], [t + .15, 0]]); }
    EV.forEach(function (e) {
      if (e.type === 'blip') blip(e.t, e.f);
      else if (e.type === 'blips') for (var j = 0; j < e.n; j++) blip(e.t + j * .06, 700 + j * 140, .06);
      else if (e.type === 'boop') { var o = osc('triangle', 520, e.t, e.t + .25, [[e.t, 0], [e.t + .01, .14], [e.t + .22, 0]]); o.frequency.exponentialRampToValueAtTime(260, e.t + .2); }
      else if (e.type === 'ding') ding(e.t);
      else if (e.type === 'thump') thump(e.t);
      else if (e.type === 'swish') band(e.t - .12, e.t + .14, 900, 5200, .14, .02, 1.6);
      else if (e.type === 'stamp') stampS(e.t, e.big);
      else if (e.type === 'bloop') { var ob = osc('sine', 220, e.t, e.t + .3, [[e.t, 0], [e.t + .01, .16], [e.t + .26, 0]]); ob.frequency.exponentialRampToValueAtTime(90, e.t + .22); }
      else if (e.type === 'click') { band(e.t, e.t + .03, 4200, 4200, .3, .1, 6); thump(e.t, .15); }
      else if (e.type === 'whirr') band(e.t, e.t1, 400, 1800, .06, .1, 4);
    });
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
  }

  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); watch(ctx); watch(tctx); acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['800 84px Archivo', '900 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%“”'); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  initTimes();
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: start('vice') + 1.6, SLUG: 'gta-leonida', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
