/* "Why Delta is becoming a GTA 6 channel" — the transition video for the Delta audience.
   Narrated first and cut to the voice: every beat reads a word time from vo/vo.js (window.VO). Pure function of t.
   Contract like ../nextword/film.js: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Native move: the channel flip, a three-stripe wipe between scenes, and the Delta triangle that flips into a 6.
   Own graphics only: no Rockstar footage, logo, key art or map art; consoles are plain flat boxes with no logos. */
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
    g.fillStyle = col || DIM; try { g.letterSpacing = '2px'; } catch (e) {}
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

  /* ---------- icons: flat, hand-built, drawn around (0,0) at 1x ---------- */
  function poly(g, pts, fill) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillStyle = fill; g.fill(); }
  function palm(g, x, y, h, lean, t, col) {
    g.save(); g.translate(x, y); g.strokeStyle = '#2a1d5c'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(lean * .5, -h * .5, lean, -h); g.stroke();
    g.translate(lean, -h); var sw = Math.sin(t * 1.6) * .05;
    for (var i = 0; i < 6; i++) { g.save(); g.rotate(-1.9 + i * .75 + sw); g.beginPath(); g.ellipse(0, -h * .28, h * .09, h * .3, 0, 0, 6.2832); g.fillStyle = col; g.fill(); g.restore(); }
    g.restore();
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

  /* ---------- scenes keyed to the voice ---------- */
  var SC = [
    { id: 'hook', name: 'Delta to 6', t0: 0 },
    { id: 'why', name: 'The wait', t0: start('why') - .15 },
    { id: 'date', name: 'Nov 19', t0: start('date') - .15 },
    { id: 'old', name: 'Every kind', t0: start('old') - .15 },
    { id: 'get', name: 'What you get', t0: start('get') - .15 },
    { id: 'prom', name: 'The promise', t0: start('prom') + .1 },
    { id: 'oldv', name: 'Old videos stay', t0: start('oldv') - .15 },
    { id: 'cta', name: 'Subscribe', t0: start('sub') - .15 }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = end('ask2') + .35;
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  var S = {}; SC.forEach(function (s, i) { S[s.id] = i; });

  /* ---------- small flat drawing helpers ---------- */
  function tri(g, cx, cy, r, rot, fill) {
    g.beginPath();
    for (var i = 0; i < 3; i++) { var a = rot - Math.PI / 2 + i * 2.0944; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    g.closePath(); g.fillStyle = fill; g.fill();
  }
  function card(g, x, y, w, h, col, a, r) {
    g.save(); g.globalAlpha *= a == null ? 1 : a; rr(g, x, y, w, h, r || 28); g.fillStyle = PANEL; g.fill();
    if (col) { rr(g, x, y, w, h, r || 28); g.strokeStyle = col; g.lineWidth = 5; g.stroke(); }
    g.restore();
  }
  function tick(g, cx, cy, s, col, k) {                 // a drawn check mark, k = 0..1 progress
    g.save(); g.strokeStyle = col; g.lineWidth = 12 * s; g.lineCap = 'round'; g.lineJoin = 'round';
    var p = [[-22, 2], [-6, 18], [24, -16]].map(function (q) { return [cx + q[0] * s, cy + q[1] * s]; });
    g.beginPath(); g.moveTo(p[0][0], p[0][1]);
    var k1 = clamp(k * 2, 0, 1), k2 = clamp(k * 2 - 1, 0, 1);
    g.lineTo(lerp(p[0][0], p[1][0], k1), lerp(p[0][1], p[1][1], k1));
    if (k2 > 0) g.lineTo(lerp(p[1][0], p[2][0], k2), lerp(p[1][1], p[2][1], k2));
    g.stroke(); g.restore();
  }
  function pop(t, t0) { return clamp(sp(t, t0, 3, .62), 0, 1.12); }

  /* ---------- the mark: Delta triangle that flips into a 6 ---------- */
  var FLIP = at('hook', 'over') - .12;
  function mark(g, cx, cy, size, t, flipK, wob) {
    // flipK 0 = triangle, 1 = six. The flip is a turn around the vertical axis.
    var ang = flipK * Math.PI, c = Math.abs(Math.cos(ang)), sx = c < .02 ? .02 : c, showSix = flipK > .5;
    g.save(); g.translate(cx, cy); g.rotate(wob || 0); g.scale(sx, 1);
    if (!showSix) {
      tri(g, 18, 22, size * .62, 0, TEAL);
      tri(g, 0, 0, size * .62, 0, PINK);
      tri(g, 0, size * .1, size * .26, 0, BG);
    } else {
      font(g, size * 1.25, 900); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = TEAL; g.fillText('6', 18, size * .06 + 22); g.fillStyle = PINK; g.fillText('6', 0, size * .06);
    }
    g.restore();
  }
  function hookFrame(g, t, home) {
    var T = home ? 0 : t, flipK = home ? 0 : eio(seg(T, FLIP, FLIP + .45));
    var wob = Math.sin(T * 2.4) * .06 + Math.sin(T * 5.1) * .015;
    var sz = 560 * lerp(.94, 1, eo(seg(T, 0, .5))) * (1 + .04 * Math.sin(T * 3));
    mark(g, 540, 800, sz, T, flipK, wob);
    var a = home ? 1 : 1;
    if (flipK < .5 || (!home && T < at('hook', 'Delta') - .05)) chip(g, 'GTA 6', 540, 1150, { px: 120, bg: CREAM, fg: BG, rot: -.05 });
    else {
      var k = home ? 1 : pop(T, at('hook', 'Delta') - .05);
      chip(g, 'DELTA', 540, 1150, { px: 120, bg: CREAM, fg: BG, rot: -.05, s: k, a: k * 2 });
    }
  }

  /* ---------- scene: why (loading bar fills to done on "over") ---------- */
  function sceneWhy(g, t) {
    var s = SC[S.why], q = pop(t, s.t0 + .1);
    var fillA = at('why', 'GTA') - .1, fillB = at('why', 'here') + .1, f = eio(seg(t, fillA, fillB));
    var k = pop(t, start('why'));
    chip(g, 'WHY?', 540, 640, { px: 150, bg: TEAL, fg: BG, rot: .04, s: k, a: k * 2 });
    var bx = 130, bw = 820, by = 980, bh = 96, bk = pop(t, fillA - .25);
    g.save(); g.globalAlpha = clamp(bk * 2, 0, 1); g.translate(0, (1 - Math.min(1, bk)) * 40);
    rr(g, bx, by, bw, bh, 48); g.fillStyle = PANEL; g.fill(); rr(g, bx, by, bw, bh, 48); g.strokeStyle = CREAM; g.lineWidth = 5; g.stroke();
    g.save(); rr(g, bx + 8, by + 8, bw - 16, bh - 16, 40); g.clip();
    g.fillStyle = PINK; g.fillRect(bx + 8, by + 8, (bw - 16) * f, bh - 16);
    g.fillStyle = 'rgba(255,243,230,.35)'; for (var i = 0; i < 12; i++) { var sx = bx + 8 + ((i * 90 + t * 120) % (bw + 90)) - 90; if (sx < bx + 8 + (bw - 16) * f) g.fillRect(sx, by + 8, 28, bh - 16); }
    g.restore();
    label(g, 'GTA 6', 540, by - 56, 1, CREAM, 40);
    g.restore();
    var done = pop(t, fillB);
    if (done > 0) { chip(g, 'ALMOST HERE', 540, 1220, { px: 84, bg: ORG, fg: BG, rot: -.04, s: done, a: done * 2 }); }
  }

  /* ---------- scene: date (calendar, consoles, the Rockstar page) ---------- */
  function console5(g, x, y, t, k) {            // plain flat slab, no logos
    g.save(); g.translate(x, y); g.scale(k, k);
    rr(g, -62, -190, 124, 380, 62); g.fillStyle = CREAM; g.fill();
    rr(g, -34, -190, 68, 380, 34); g.fillStyle = PANEL2; g.fill();
    rr(g, -10, -170, 20, 340, 10); g.fillStyle = TEAL; g.fill();
    g.restore();
  }
  function consoleX(g, x, y, t, k) {
    g.save(); g.translate(x, y); g.scale(k, k);
    rr(g, -92, -170, 112, 340, 14); g.fillStyle = '#17112f'; g.fill(); g.strokeStyle = PURP; g.lineWidth = 4; g.stroke();
    g.beginPath(); g.arc(-36, -100, 36, 0, 6.2832); g.fillStyle = BG; g.fill(); g.strokeStyle = TEAL; g.lineWidth = 6; g.stroke();
    rr(g, 34, -50, 96, 220, 12); g.fillStyle = CREAM; g.fill(); g.beginPath(); g.arc(82, 10, 22, 0, 6.2832); g.fillStyle = PANEL2; g.fill();
    g.restore();
  }
  function sceneDate(g, t) {
    var s = SC[S.date], tD = at('date', 'November'), tP = start('plat'), tS = start('src');
    var calK = pop(t, s.t0 + .1), flip = eo(seg(t, tD - .2, tD + .25));
    var calOut = 1 - eio(seg(t, tP - .1, tP + .35));
    // calendar page
    if (calOut > .01) {
      g.save(); g.globalAlpha = calOut; g.translate(540, 800 - (1 - calOut) * 60); g.scale(calK * lerp(.9, 1, calOut), calK * lerp(.9, 1, calOut)); g.rotate(-.03);
      rr(g, -300, -330, 600, 660, 36); g.fillStyle = CREAM; g.fill();
      g.save(); rr(g, -300, -330, 600, 660, 36); g.clip(); g.fillStyle = PINK; g.fillRect(-300, -330, 600, 120); g.restore();
      g.fillStyle = BG; [-190, 190].forEach(function (rx) { g.beginPath(); g.arc(rx, -330, 22, 0, 6.2832); g.fill(); });
      font(g, 74, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = BG; g.fillText('NOVEMBER', 0, -266);
      var dayA = clamp(flip * 3, 0, 1);
      g.save(); g.globalAlpha = dayA; g.scale(1, lerp(.2, 1, flip)); font(g, 400, 900); g.fillStyle = PINK; g.fillText('19', 0, 10); g.restore();
      font(g, 110, 900); g.fillStyle = BG; g.globalAlpha = clamp(flip * 2 - 1, 0, 1); g.fillText('2026', 0, 250);
      g.restore();
    }
    // consoles
    var kP = pop(t, tP), kX = pop(t, at('plat', 'Xbox') - .05), co = 1 - eio(seg(t, tS - .1, tS + .3));
    if (kP > 0 && co > .01) {
      g.save(); g.globalAlpha = co;
      g.save(); g.translate(0, Math.sin(t * 2.2) * 8); console5(g, 300, 780, t, kP); g.restore();
      g.save(); g.translate(0, Math.sin(t * 2.2 + 1.5) * 8); consoleX(g, 700, 780, t, kX); g.restore();
      chip(g, 'PS5', 300, 1100, { px: 80, bg: CREAM, fg: BG, rot: -.04, s: kP, a: kP * 2 });
      chip(g, 'XBOX SERIES X|S', 700, 1100, { px: 46, bg: TEAL, fg: BG, rot: .04, s: kX, a: kX * 2, pad: 22 });
      g.restore();
    }
    // the Rockstar page (our own mock of an address bar and the quoted words)
    var kS = pop(t, tS);
    if (kS > 0) {
      g.save(); g.globalAlpha = clamp(kS * 2, 0, 1); g.translate(540, 780 + (1 - Math.min(1, kS)) * 120); g.scale(Math.min(kS, 1.05), Math.min(kS, 1.05));
      rr(g, -400, -260, 800, 520, 30); g.fillStyle = PANEL; g.fill(); rr(g, -400, -260, 800, 520, 30); g.strokeStyle = CREAM; g.lineWidth = 5; g.stroke();
      rr(g, -370, -230, 740, 84, 42); g.fillStyle = BG; g.fill();
      g.fillStyle = MINT; g.beginPath(); g.arc(-326, -188, 14, 0, 6.2832); g.fill();
      font(g, 38, 500, MONO); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('rockstargames.com/VI', -290, -186);
      font(g, 56, 900); g.textAlign = 'center'; g.fillStyle = DIM; g.fillText('Coming', 0, -40);
      font(g, 92, 900); g.fillStyle = PINK; g.fillText('November 19,', 0, 62); g.fillText('2026', 0, 160);
      var tk = clamp((t - tS - .9) / .4, 0, 1); if (tk > 0) tick(g, 300, 180, 1.4, MINT, tk);
      g.restore();
    }
  }

  /* ---------- scene: old (a row of game tiles; GTA 6 pushes to the front) ---------- */
  function gameIcon(g, id, s) {
    g.save(); g.scale(s, s);
    if (id === 0) { rr(g, -70, -40, 140, 80, 36); g.fillStyle = CREAM; g.fill(); g.fillStyle = BG; g.fillRect(-52, -6, 34, 10); g.fillRect(-40, -18, 10, 34); g.beginPath(); g.arc(32, -8, 9, 0, 6.2832); g.arc(50, 10, 9, 0, 6.2832); g.fill(); }
    else if (id === 1) { poly(g, [[-70, 20], [-56, -10], [-26, -34], [30, -34], [56, -6], [74, 20]], CREAM); g.fillStyle = BG; [-40, 40].forEach(function (x) { g.beginPath(); g.arc(x, 24, 18, 0, 6.2832); g.fill(); }); g.fillStyle = PANEL2; g.fillRect(-18, -26, 40, 18); }
    else if (id === 2) { g.rotate(-.7); g.fillStyle = CREAM; g.fillRect(-9, -76, 18, 110); poly(g, [[-9, -76], [9, -76], [0, -98]], CREAM); g.fillStyle = BG; g.fillRect(-32, 34, 64, 12); g.fillRect(-7, 46, 14, 34); }
    else if (id === 3) { g.beginPath(); g.arc(0, 0, 52, 0, 6.2832); g.fillStyle = CREAM; g.fill(); poly(g, [[0, -22], [20, -6], [12, 18], [-12, 18], [-20, -6]], BG); }
    else if (id === 4) { poly(g, [[0, -80], [28, -20], [28, 50], [-28, 50], [-28, -20]], CREAM); poly(g, [[-28, 20], [-56, 56], [-28, 50]], BG); poly(g, [[28, 20], [56, 56], [28, 50]], BG); g.beginPath(); g.arc(0, -14, 12, 0, 6.2832); g.fillStyle = BG; g.fill(); }
    else { g.beginPath(); g.moveTo(-50, 40); g.lineTo(-50, -10); g.arc(0, -10, 50, Math.PI, 0); g.lineTo(50, 40); g.quadraticCurveTo(25, 20, 0, 40); g.quadraticCurveTo(-25, 20, -50, 40); g.fillStyle = CREAM; g.fill(); g.fillStyle = BG; g.beginPath(); g.arc(-18, -12, 9, 0, 6.2832); g.arc(18, -12, 9, 0, 6.2832); g.fill(); }
    g.restore();
  }
  var TILE = [PINK, TEAL, ORG, PURP, MINT, SAND];
  function sceneOld(g, t) {
    var s = SC[S.old], tN = start('old' ) + 0, tNow = start('now'), tDown = at('old', 'stayed');
    var inK = pop(t, s.t0 + .05), toOld = eio(seg(t, tNow - .1, tNow + .45));
    // two scrolling rows of tiles
    for (var row = 0; row < 2; row++) {
      var y = 640 + row * 260, dir = row ? -1 : 1, off = (t - s.t0) * 60 * dir;
      for (var i = -1; i < 7; i++) {
        var idx = ((i % 6) + 6) % 6, cx = ((i * 210 + off) % 1470 + 1470) % 1470 - 200;
        var kk = clamp(inK * 1.4 - (i + 1) * .05, 0, 1.05);
        var push = toOld * (cx < 540 ? -1 : 1) * 520, al = (1 - toOld * .7);
        g.save(); g.globalAlpha = clamp(kk * 2, 0, 1) * al; g.translate(cx + push, y + Math.sin(t * 2 + i + row) * 6); g.scale(kk, kk);
        rr(g, -90, -90, 180, 180, 34); g.fillStyle = TILE[(idx + row * 3) % 6]; g.fill(); g.translate(0, 4);
        g.save(); g.fillStyle = BG; gameIcon(g, (idx + row * 2) % 6, 1); g.restore();
        g.restore();
      }
    }
    // an "every kind" label that turns into the pointing arrow
    var lab = pop(t, at('old', 'every') - .1) * (1 - toOld);
    if (lab > 0) chip(g, 'EVERY KIND OF GAME', 540, 1000, { px: 62, bg: CREAM, fg: BG, rot: -.03, s: lab, a: lab * 2 });
    // GTA 6 tile takes the middle
    var big = pop(t, tNow + .1);
    if (big > 0) {
      g.save(); g.translate(540, 780); g.scale(big, big); g.rotate(-.04);
      rr(g, -280, -280, 560, 560, 70); g.fillStyle = PINK; g.fill(); rr(g, -280, -280, 560, 560, 70); g.strokeStyle = CREAM; g.lineWidth = 8; g.stroke();
      font(g, 330, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = BG; g.fillText('6', 0, 30);
      font(g, 70, 900); g.fillText('GTA', 0, -190);
      g.restore();
      chip(g, 'COMES FIRST', 540, 1160, { px: 96, bg: TEAL, fg: BG, rot: .035, s: pop(t, at('now', 'first') - .25), a: pop(t, at('now', 'first') - .25) * 2 });
    }
  }

  /* ---------- scene: get (six tiles fill in on their words) ---------- */
  var GET = [
    { name: 'DAILY SHORTS', col: PINK, tag: 'EVERY DAY', at: function () { return at('daily', 'Short'); } },
    { name: 'HIDDEN DETAILS', col: TEAL, tag: 'IN THE TRAILERS', at: function () { return at('hid', 'Hidden'); } },
    { name: 'EASTER EGGS', col: ORG, tag: 'EXPLAINED', at: function () { return at('hid', 'Easter'); } },
    { name: 'TRAILER BREAKDOWNS', col: PURP, tag: 'ANNOTATED', at: function () { return at('hid', 'breakdowns'); } },
    { name: 'MYSTERIES', col: MINT, tag: 'THEORY = LABELED', at: function () { return at('myst', 'Mysteries'); } },
    { name: 'GUIDES', col: SAND, tag: 'AFTER LAUNCH', at: function () { return at('guide', 'guides'); } }
  ];
  function tileXY(i) { return [90 + (i % 2) * 430, 470 + ((i / 2) | 0) * 294]; }
  function getIcon(g, i, t, t0, col) {
    var T = t - t0, k = clamp(sp(t, t0 + .1, 2.8, .7), 0, 1.1);
    g.save(); g.scale(k, k);
    if (i === 0) {                                   // calendar with days ticking
      rr(g, -52, -46, 104, 94, 14); g.fillStyle = CREAM; g.fill(); g.fillStyle = col; g.fillRect(-52, -46, 104, 24);
      for (var d = 0; d < 7; d++) { var on = T > .15 + d * .12; g.beginPath(); g.arc(-36 + (d % 4) * 24, -4 + ((d / 4) | 0) * 28, 8, 0, 6.2832); g.fillStyle = on ? col : 'rgba(11,8,32,.25)'; g.fill(); }
    } else if (i === 1) {                            // magnifier sweeping, finds a dot
      rr(g, -56, -40, 112, 80, 12); g.fillStyle = PANEL2; g.fill(); var mxx = Math.sin(T * 2.2) * 28;
      g.beginPath(); g.arc(24, -4, 8, 0, 6.2832); g.fillStyle = CREAM; g.fill();
      g.beginPath(); g.arc(mxx, 0, 30, 0, 6.2832); g.strokeStyle = col; g.lineWidth = 9; g.stroke(); g.beginPath(); g.moveTo(mxx + 21, 21); g.lineTo(mxx + 48, 50); g.stroke();
      if (Math.abs(mxx - 24) < 14) { g.beginPath(); g.arc(24, -4, 14, 0, 6.2832); g.fillStyle = col; g.fill(); }
    } else if (i === 2) {                            // egg
      g.rotate(Math.sin(T * 3) * .1); g.beginPath(); g.ellipse(0, 4, 40, 54, 0, 0, 6.2832); g.fillStyle = CREAM; g.fill();
      g.save(); g.beginPath(); g.ellipse(0, 4, 40, 54, 0, 0, 6.2832); g.clip(); g.strokeStyle = col; g.lineWidth = 11; g.beginPath(); g.moveTo(-44, 6); for (var z = 0; z < 6; z++) g.lineTo(-44 + z * 18 + 9, 6 + (z % 2 ? 14 : -14)); g.stroke(); g.restore();
    } else if (i === 3) {                            // a frame with an arrow and zoom box
      rr(g, -64, -42, 128, 84, 10); g.fillStyle = PANEL2; g.fill(); g.beginPath(); g.arc(-20, 10, 20, Math.PI, 0); g.fillStyle = ORG; g.fill();
      var bz = 1 + .08 * Math.sin(T * 4); g.strokeStyle = col; g.lineWidth = 6; g.strokeRect(0 - 16 * bz, -26 - 4, 44 * bz, 34 * bz);
      g.beginPath(); g.moveTo(54, -50); g.lineTo(18, -22); g.stroke(); poly(g, [[18, -22], [30, -22], [20, -34]], col);
    } else if (i === 4) {                            // question mark with orbit
      font(g, 110, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText('?', 0, 6);
      for (var o = 0; o < 3; o++) { var a = T * 2 + o * 2.09; g.beginPath(); g.arc(Math.cos(a) * 58, Math.sin(a) * 40, 7, 0, 6.2832); g.fillStyle = CREAM; g.fill(); }
    } else {                                         // checklist
      for (var r = 0; r < 3; r++) { var y = -30 + r * 32; rr(g, -52, y - 10, 20, 20, 5); g.strokeStyle = col; g.lineWidth = 4; g.stroke(); tick(g, -42, y, .5, col, clamp((T - .2 - r * .2) / .3, 0, 1)); g.fillStyle = CREAM; g.fillRect(-18, y - 4, 66 - r * 14, 8); }
    }
    g.restore();
  }
  function sceneGet(g, t) {
    var s = SC[S.get];
    var hk = pop(t, s.t0 + .1);
    // the headline chip shrinks away when the first tile lands
    var head = 1 - eio(seg(t, GET[0].at() - .35, GET[0].at() - .05));
    if (head > .01) chip(g, 'WHAT YOU GET', 540, 760, { px: 84, bg: PINK, fg: BG, rot: -.04, s: hk * head, a: hk * 2 * head });
    var act = -1; GET.forEach(function (d, i) { if (t >= d.at() - .1) act = i; });
    GET.forEach(function (d, i) {
      var t0 = d.at() - .1, k = Math.min(pop(t, t0), 1.02); if (k <= 0) return;
      var xy = tileXY(i), isAct = i === act, ds = isAct ? 1 : lerp(1, .97, eo(seg(t, GET[Math.min(i + 1, 5)].at() - .1, GET[Math.min(i + 1, 5)].at() + .3)));
      g.save(); g.translate(xy[0] + 205, xy[1] + 135); g.scale(k * ds, k * ds); g.globalAlpha = clamp(k * 2, 0, 1) * (isAct ? 1 : .88);
      rr(g, -205, -135, 410, 270, 30); g.fillStyle = isAct ? PANEL2 : PANEL; g.fill();
      rr(g, -205, -135, 410, 270, 30); g.strokeStyle = d.col; g.lineWidth = isAct ? 8 : 4; g.stroke();
      g.save(); g.translate(0, -40); getIcon(g, i, t, t0 + .1, d.col); g.restore();
      font(g, d.name.length > 14 ? 30 : 40, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText(d.name, 0, 62);
      font(g, 30, 500, MONO); try { g.letterSpacing = '1px'; } catch (e) {} g.fillStyle = d.col; g.fillText(d.tag, 0, 104);
      g.restore();
    });
    // THEORY stamp on mysteries
    stamp(g, 'THEORY', 540, 1290, t, at('myst', 'theories'), at('myst', 'theories') + .9, 72, ORG, -.06);
  }

  /* ---------- scene: promise (four rows, one per line) ---------- */
  function promIcon(g, i, t, t0, col) {
    var T = t - t0;
    if (i === 0) { g.beginPath(); g.arc(0, 0, 36, 0, 6.2832); g.fillStyle = col; g.fill(); tick(g, 0, 2, 1, BG, clamp(T / .35, 0, 1)); }
    else if (i === 1) { rr(g, -54, -30, 108, 60, 12); g.fillStyle = ORG; g.fill(); g.setLineDash([8, 6]); g.strokeStyle = BG; g.lineWidth = 4; rr(g, -48, -24, 96, 48, 8); g.stroke(); g.setLineDash([]); }
    else if (i === 2) { g.beginPath(); g.arc(0, 0, 38, 0, 6.2832); g.strokeStyle = col; g.lineWidth = 10; g.stroke(); g.beginPath(); g.moveTo(-27, 27); g.lineTo(27, -27); g.stroke(); }
    else { // broken chain
      var gap = 12 + 8 * Math.sin(T * 4);
      [-1, 1].forEach(function (d) { rr(g, d * (28 + gap) - 26, -17, 52, 34, 17); g.strokeStyle = col; g.lineWidth = 9; g.stroke(); });
    }
  }
  var PROM = [
    { id: 'p1', word: 'source', head: 'EVERY FACT SOURCED', sub: 'LINKS IN THE DESCRIPTION', col: TEAL },
    { id: 'p2', word: 'rumor', head: 'RUMORS LABELED', sub: 'A RUMOR IS CALLED A RUMOR', col: ORG },
    { id: 'p3', word: 'leaks', head: 'NO LEAKS', sub: 'WE DO NOT SHOW THEM', col: PINK },
    { id: 'p4', word: 'affiliated', head: 'NOT AFFILIATED', sub: 'ROCKSTAR · TAKE-TWO', col: PURP }
  ];
  function scenePromise(g, t) {
    var s = SC[S.prom], tp = start('prom');
    var head = pop(t, tp), gone = 1 - eio(seg(t, PROM[0].time - .35, PROM[0].time - .05));
    if (gone > .01) chip(g, 'MY PROMISE', 540, 760, { px: 88, bg: CREAM, fg: BG, rot: .03, s: head * gone, a: head * 2 * gone });
    PROM.forEach(function (p, i) {
      var t0 = p.time - .1, k = Math.min(pop(t, t0), 1.02); if (k <= 0) return;
      var y = 500 + i * 210, isAct = t < (i < 3 ? PROM[i + 1].time - .1 : 1e9);
      g.save(); g.globalAlpha = clamp(k * 2, 0, 1); g.translate(540, y + 85); g.scale(k, k); g.translate(-540, -(y + 85));
      rr(g, 100, y, 880 - 20, 170, 30); g.fillStyle = isAct ? PANEL2 : PANEL; g.fill(); rr(g, 100, y, 860, 170, 30); g.strokeStyle = p.col; g.lineWidth = isAct ? 8 : 4; g.stroke();
      g.save(); g.translate(190, y + 85); promIcon(g, i, t, t0 + .1, p.col); g.restore();
      font(g, 52, 900); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText(p.head, 270, y + 62);
      font(g, 30, 500, MONO); try { g.letterSpacing = '1px'; } catch (e) {} g.fillStyle = p.col; g.fillText(p.sub, 270, y + 122);
      g.restore();
    });
  }

  /* ---------- scene: old videos stay up, then same channel / new focus ---------- */
  function sceneOldVideos(g, t) {
    var s = SC[S.oldv], tOv = start('oldv'), tSame = start('same');
    var shelf = 1 - eio(seg(t, tSame - .1, tSame + .35));
    if (shelf > .01) {
      var tcol = [PINK, TEAL, ORG, PURP, MINT, SAND];
      for (var i = 0; i < 6; i++) {
        var col = i % 3, row = (i / 3) | 0, x = 130 + col * 290, y = 520 + row * 270;
        var k = pop(t, s.t0 + .1 + i * .08) * shelf, stay = pop(t, at('oldv', 'stay') + .05 + i * .1);
        if (k <= 0) continue;
        g.save(); g.globalAlpha = clamp(k * 2, 0, 1); g.translate(x + 130, y + 100); g.scale(k, k);
        rr(g, -130, -100, 260, 200, 22); g.fillStyle = tcol[i]; g.fill();
        g.fillStyle = 'rgba(11,8,32,.28)'; g.fillRect(-130, 40, 260, 60);
        poly(g, [[-18, -40], [-18, 18], [34, -11]], CREAM);
        g.fillStyle = BG; g.fillRect(-110, 62, 120 - i * 8, 14);
        if (stay > 0) { g.save(); g.translate(96, -70); g.scale(stay, stay); g.beginPath(); g.arc(0, 0, 34, 0, 6.2832); g.fillStyle = CREAM; g.fill(); tick(g, 0, 2, .9, BG, clamp((t - at('oldv', 'stay') - .1 - i * .1) / .3, 0, 1)); g.restore(); }
        g.restore();
      }
      var ck = pop(t, at('oldv', 'all') - .1);
      chip(g, 'ALL OLD VIDEOS STAY UP', 540, 1160, { px: 54, bg: CREAM, fg: BG, rot: -.025, s: ck * shelf, a: ck * 2 * shelf });
    }
    // same channel, new focus: viewfinder brackets close in on the Delta triangle, which flips to the six
    var sk = pop(t, tSame);
    if (sk > 0) {
      var focus = eio(seg(t, at('same', 'focus') - .3, at('same', 'focus') + .35)), br = lerp(380, 250, focus), fl = eio(seg(t, at('same', 'focus') + .05, at('same', 'focus') + .5));
      g.save(); g.globalAlpha = clamp(sk * 2, 0, 1);
      mark(g, 540, 800, 400 * Math.min(sk, 1.05), t, fl, Math.sin(t * 2.4) * .05);
      g.strokeStyle = CREAM; g.lineWidth = 12; g.lineCap = 'round';
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (d) { var cx = 540 + d[0] * br, cy = 800 + d[1] * br; g.beginPath(); g.moveTo(cx - d[0] * 90, cy); g.lineTo(cx, cy); g.lineTo(cx, cy - d[1] * 90); g.stroke(); });
      g.restore();
      var ch = pop(t, at('same', 'Same') - .05);
      chip(g, 'SAME CHANNEL', 540, 1140, { px: 84, bg: CREAM, fg: BG, rot: -.04, s: ch, a: ch * 2 });
      var nf = pop(t, at('same', 'focus') - .15);
      chip(g, 'NEW FOCUS', 540, 1290, { px: 84, bg: PINK, fg: BG, rot: .04, s: nf, a: nf * 2 });
    }
  }

  /* ---------- scene: subscribe + comment ---------- */
  function sceneCta(g, t) {
    var s = SC[S.cta], tSub = at('sub', 'Subscribe'), tAsk = start('ask1'), tAsk2 = start('ask2');
    var btn = 1 - eio(seg(t, tAsk - .1, tAsk + .35));
    if (btn > .01) {
      var k = pop(t, s.t0 + .1), press = clamp((t - (at('sub', 'never') - .35)) / .12, 0, 1), done = press >= 1;
      var sc = k * btn * (1 - .06 * Math.sin(press * Math.PI));
      g.save(); g.globalAlpha = clamp(k * 2, 0, 1) * btn; g.translate(540, 760); g.scale(sc, sc);
      rr(g, -330, -100, 660, 200, 100); g.fillStyle = done ? TEAL : PINK; g.fill();
      font(g, 84, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = BG; g.fillText(done ? 'SUBSCRIBED' : 'SUBSCRIBE', 0, 6);
      g.restore();
      // bell rings after the press
      var bt = t - (at('sub', 'never') - .23); if (bt > 0) {
        g.save(); g.globalAlpha = btn; g.translate(540, 990); g.rotate(Math.sin(bt * 22) * .35 * Math.exp(-bt * 2.2));
        g.beginPath(); g.moveTo(-60, 40); g.quadraticCurveTo(-60, -60, 0, -64); g.quadraticCurveTo(60, -60, 60, 40); g.closePath(); g.fillStyle = CREAM; g.fill(); g.fillRect(-72, 40, 144, 14);
        g.beginPath(); g.arc(0, 70, 14, 0, 6.2832); g.fill(); g.restore();
      }
      // pointer travels in and taps
      var px = lerp(800, 600, eio(seg(t, s.t0 + .3, at('sub', 'never') - .35))), py = lerp(1200, 800, eio(seg(t, s.t0 + .3, at('sub', 'never') - .35))) + press * 6;
      g.save(); g.globalAlpha = btn * clamp(k, 0, 1); g.translate(px, py); poly(g, [[0, 0], [0, 78], [20, 60], [34, 94], [50, 86], [36, 54], [62, 52]], CREAM); g.restore();
    }
    var ak = pop(t, tAsk);
    if (ak > 0) {
      var out = 1 - eio(seg(t, HOME - .25, HOME));
      g.save(); g.globalAlpha = clamp(ak * 2, 0, 1) * out; g.translate(540, 640); g.scale(Math.min(ak, 1.05), Math.min(ak, 1.05));
      rr(g, -380, -170, 760, 300, 44); g.fillStyle = CREAM; g.fill(); poly(g, [[-100, 130], [-40, 130], [-120, 200]], CREAM);
      font(g, 62, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = BG; g.fillText('WHICH GTA 6', 0, -88); g.fillText('TOPIC FIRST?', 0, -12);
      font(g, 34, 500, MONO); g.fillStyle = PINK; g.fillText('TYPE IT IN THE COMMENTS', 0, 80);
      g.restore();
      var opts = [['HIDDEN DETAILS', TEAL], ['EASTER EGGS', ORG], ['TRAILER BREAKDOWNS', PURP], ['MYSTERIES', MINT]];
      opts.forEach(function (o, i) {
        var kk = pop(t, tAsk2 + .05 + i * .22), hot = Math.floor(((t - tAsk2) * 1.6)) % 4 === i && t > tAsk2 + 1.1;
        var x = 540, y = 960 + i * 118;
        chip(g, (i + 1) + '  ' + o[0], x, y, { px: 52, bg: hot ? o[1] : PANEL2, line: o[1], fg: hot ? BG : CREAM, s: kk * (hot ? 1.06 : 1), a: kk * 2 * out, lw: 5, pad: 30 });
      });
    }
  }

  /* ---------- the wipe: three flat stripes, the channel flip ---------- */
  function wipe(g, t) {
    SC.forEach(function (s, i) {
      if (!i) return;
      var cols = [PINK, TEAL, ORG];
      for (var b = 0; b < 3; b++) {
        var a = s.t0 - .2 + b * .035, c = a + .2, d = c + .02, e = d + .2;
        if (t < a || t > e) continue;
        var x0 = t < d ? -40 : lerp(-40, W + 40, eio(seg(t, d, e))), x1 = t < c ? lerp(-40, W + 40, eio(seg(t, a, c))) : W + 40;
        g.fillStyle = cols[b]; g.fillRect(x0, b * H / 3 - 1, x1 - x0, H / 3 + 2);
      }
    });
  }

  /* ---------- frame ---------- */
  function bottomLabel(g, t) {
    var si = sceneAt(t), s = SC[si], txt = '', col = DIM;
    if (si === S.date && t > start('src') - .1) txt = 'SOURCE: ROCKSTARGAMES.COM/VI';
    else if (si === S.date) txt = 'GTA 6 · RELEASE DATE';
    else if (si === S.get) txt = 'OUR OWN GRAPHICS · NO ROCKSTAR FOOTAGE';
    else if (si === S.prom) txt = 'MADE WITH OUR OWN GRAPHICS AND VOICE';
    else return;
    var q = seg(t, s.t0 + .35, s.t0 + .6) * (1 - seg(t, s.t1 - .15, s.t1 - .02));
    label(g, txt, 540, 1430, q, CREAM, 30);
  }

  function frame(g, t, homeMode) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    var T = homeMode ? 0 : t, si = homeMode ? 0 : sceneAt(t);
    stage(g, t, homeMode || si === 0 ? .96 : .4);
    g.save(); g.translate(0, homeMode || si === 0 ? 60 : 100);
    if (homeMode || si === 0) hookFrame(g, t, homeMode);
    else if (si === S.why) sceneWhy(g, t);
    else if (si === S.date) sceneDate(g, t);
    else if (si === S.old) sceneOld(g, t);
    else if (si === S.get) sceneGet(g, t);
    else if (si === S.prom) scenePromise(g, t);
    else if (si === S.oldv) sceneOldVideos(g, t);
    else if (si === S.cta) sceneCta(g, t);
    g.restore();
    if (homeMode) return;
    wipe(g, t);
    STAMPS.forEach(function (s) { stamp(g, s[0], 540, s[6], t, s[1], s[2], s[3], s[4], s[5]); });
    bottomLabel(g, t);
    if (LIVE.text) captions(g, t);
    var back = eio(seg(t, HOME, HOME + .45));
    if (back > 0) { g.save(); g.globalAlpha = back; frame(g, 0, true); g.restore(); }
    g.fillStyle = 'rgba(255,243,230,.12)'; g.fillRect(60, 140, W - 120, 6);
    g.fillStyle = PINK; g.fillRect(60, 140, (W - 120) * t / DUR, 6);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var STAMPS = [['GTA 6', at('date', 'GTA'), at('plat', 'PlayStation') - .1, 120, PINK, -.05, 1280]];
  PROM.forEach(function (p) { p.time = at(p.id, p.word); });
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
    var out = [], si = sceneAt(t), s = SC[si];
    function add(id, text) { out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    STAMPS.forEach(function (st, i) { if (t >= st[1] + .2 && t < st[2]) add('stamp' + i, st[0]); });
    if (si === 0) add('mark', t < at('hook', 'Delta') ? 'GTA 6' : 'DELTA');
    if (si === S.why) add('why', 'WHY? GTA 6 ALMOST HERE');
    if (si === S.date) add('date', t < start('plat') ? 'NOVEMBER 19 2026' : t < start('src') ? 'PS5 XBOX SERIES X|S' : 'ROCKSTARGAMES.COM/VI Coming November 19, 2026');
    if (si === S.old) add('old', t < start('now') ? 'EVERY KIND OF GAME' : 'GTA 6 COMES FIRST');
    if (si === S.get) GET.forEach(function (d) { if (t >= d.at() - .05) add('get' + d.name, d.name + ' ' + d.tag); });
    if (si === S.prom) PROM.forEach(function (p) { if (t >= p.time - .05) add(p.id, p.head + ' ' + p.sub); });
    if (si === S.oldv) add('oldv', t < start('same') ? 'ALL OLD VIDEOS STAY UP' : 'SAME CHANNEL NEW FOCUS');
    if (si === S.cta) add('cta', t < start('ask1') ? 'SUBSCRIBE' : 'WHICH GTA 6 TOPIC FIRST? HIDDEN DETAILS EASTER EGGS TRAILER BREAKDOWNS MYSTERIES');
    return out;
  }

  /* ---------- events: sound design reads the same word times ---------- */
  var EV = [];
  function initTimes() {
    EV.push({ t: FLIP + .2, type: 'stamp' }, { t: FLIP + .3, type: 'swish' });
    SC.forEach(function (s, i) { if (i) EV.push({ t: s.t0 + .02, type: 'swish' }); });
    EV.push({ t: at("why", "wait") - .25, type: 'blip', f: 700 }, { t: at('why', 'here') + .1, type: 'ding' });
    EV.push({ t: at('date', 'November'), type: 'thump' }, { t: at('date', 'GTA'), type: 'stamp' }, { t: start('plat'), type: 'boop' }, { t: at('plat', 'Xbox') - .05, type: 'boop' }, { t: start('src'), type: 'click' });
    EV.push({ t: at('old', 'every') - .1, type: 'blip', f: 760 }, { t: start('now') + .1, type: 'stamp', big: true });
    GET.forEach(function (d, i) { EV.push({ t: d.at() - .1, type: 'blip', f: 620 + i * 90 }); });
    EV.push({ t: at('myst', 'theories'), type: 'stamp' });
    PROM.forEach(function (p, i) { EV.push({ t: p.time - .1, type: i === 2 ? 'thump' : 'click' }); });
    for (var i = 0; i < 6; i++) EV.push({ t: at('oldv', 'stay') + .15 + i * .1, type: 'blip', f: 800 + i * 60 });
    EV.push({ t: at('same', 'focus') + .05, type: 'stamp', big: true });
    EV.push({ t: at('sub', 'never') - .3, type: 'click' }, { t: at('sub', 'never') - .23, type: 'ding' });
    for (var j = 0; j < 4; j++) EV.push({ t: start('ask2') + .05 + j * .22, type: 'blip', f: 700 + j * 90 });
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
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: FLIP + 1.2, SLUG: 'gta-transition', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
