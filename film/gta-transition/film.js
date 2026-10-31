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
    { id: 'date', name: 'Nov 19', t0: start('date') - .15 },
    { id: 'now', name: 'GTA 6 first', t0: start('now') - .15 },
    { id: 'get', name: 'What you get', t0: start('daily') - .15 },
    { id: 'prom', name: 'The promise', t0: start('p1') - .15 },
    { id: 'oldv', name: 'Old videos stay', t0: start('oldv') - .15 },
    { id: 'cta', name: 'Subscribe', t0: start('sub') + .3 }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = end('ask2') + .35;
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  var S = {}; SC.forEach(function (s, i) { S[s.id] = i; });
  var BIG = 44;                                    // smallest sublabel size on screen

  /* ---------- small flat drawing helpers ---------- */
  function pop(t, t0) { return clamp(sp(t, t0, 3, .62), 0, 1.12); }
  function slide(t, t0, t1) { return eio(seg(t, t0, t1)); }

  /* ---------- the mark: a cracked Delta triangle that flips into a 6 ---------- */
  var FLIP = .42;
  var ZIG = [[0, -420], [46, -260], [-34, -120], [40, 10], [-30, 140], [24, 290], [0, 460]];
  function mark(g, cx, cy, size, t, flipK, wob, crack) {
    var ang = flipK * Math.PI, c = Math.abs(Math.cos(ang)), sx = c < .02 ? .02 : c, showSix = flipK > .5;
    g.save(); g.translate(cx, cy); g.rotate(wob || 0); g.scale(sx, 1);
    if (!showSix) {
      var gap = crack ? 12 + 8 * Math.sin(t * 9) + crack * 18 : 0;
      for (var half = 0; half < 2; half++) {
        g.save();
        if (crack) {
          g.beginPath(); var dir = half ? 1 : -1;
          g.moveTo(dir * 1000, -1000);
          ZIG.forEach(function (z) { g.lineTo(z[0] * size / 560, z[1] * size / 560); });
          g.lineTo(dir * 1000, 1000); g.closePath(); g.clip();
          g.translate(dir * gap * .5, dir * gap * .22);
        }
        tri(g, 18, 22, size * .62, 0, TEAL); tri(g, 0, 0, size * .62, 0, PINK); tri(g, 0, size * .1, size * .26, 0, BG);
        g.restore();
        if (!crack) break;
      }
    } else {
      font(g, size * 1.25, 900); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = TEAL; g.fillText('6', 18, size * .06 + 22); g.fillStyle = PINK; g.fillText('6', 0, size * .06);
    }
    g.restore();
  }
  function hookFrame(g, t, home) {
    var T = home ? 0 : t, flipK = home ? 0 : eio(seg(T, FLIP, FLIP + .38));
    var wob = Math.sin(T * 2.4) * .06 + Math.sin(T * 5.1) * .015;
    var sz = 560 * lerp(.94, 1, eo(seg(T, 0, .5))) * (1 + .04 * Math.sin(T * 3));
    mark(g, 540, 800, sz, T, flipK, wob, home ? 1 : 1 - seg(T, FLIP - .1, FLIP + .2));
    chip(g, 'DELTA', 250, 470, { px: 64, bg: TEAL, fg: BG, rot: -.08, a: 1 - flipK });
    if (flipK < .5) chip(g, 'NOV 19', 540, 1150, { px: 130, bg: CREAM, fg: BG, rot: -.05 });
    else {
      var tw = at('why', 'why') - .05, afterW = !home && T > tw, kD = home ? 0 : pop(T, at('hook', 'Delta') - .05), kW = afterW ? pop(T, tw) : 0;
      chip(g, 'GTA 6', 540, 1150, { px: 130, bg: CREAM, fg: BG, rot: -.05 });
      if (kD > 0 && !afterW) chip(g, 'DELTA', 540, 1330, { px: 90, bg: TEAL, fg: BG, rot: .04, s: kD, a: kD * 2 });
      if (afterW) chip(g, 'WHY?', 540, 1330, { px: 90, bg: PINK, fg: BG, rot: .04, s: kW, a: kW * 2 });
    }
  }

  /* ---------- scene: date (the calendar holds the whole scene, consoles under it) ---------- */
  function platCard(g, x, kind, t, k, label, px, col) {
    g.save(); g.translate(x, 790); g.scale(k, k);
    rr(g, -200, -300, 400, 620, 40); g.fillStyle = PANEL2; g.fill(); rr(g, -200, -300, 400, 620, 40); g.strokeStyle = col; g.lineWidth = 8; g.stroke();
    g.save(); g.translate(0, Math.sin(t * 2.2 + (kind ? 1.5 : 0)) * 8 - 40); g.scale(1.25, 1.25); (kind ? consoleX : console5)(g, 0, 0, t, 1); g.restore();
    font(g, px, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText(label, 0, 250);
    g.restore();
  }
  function sceneDate(g, t) {
    var s = SC[S.date], tD = at('date', 'November'), tP = start('plat') - .05;
    var calK = pop(t, s.t0 + .1), flip = eo(seg(t, tD - .2, tD + .25)), calOut = 1 - eio(seg(t, tP, tP + .3));
    if (calOut > .01) {
      g.save(); g.globalAlpha = calOut; g.translate(540, 760); g.scale(calK * calOut, calK * calOut); g.rotate(-.03);
      rr(g, -300, -330, 600, 660, 36); g.fillStyle = CREAM; g.fill();
      g.save(); rr(g, -300, -330, 600, 660, 36); g.clip(); g.fillStyle = PINK; g.fillRect(-300, -330, 600, 120); g.restore();
      g.fillStyle = BG; [-190, 190].forEach(function (rx) { g.beginPath(); g.arc(rx, -330, 22, 0, 6.2832); g.fill(); });
      font(g, 74, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = BG; g.fillText('NOVEMBER', 0, -266);
      g.save(); g.globalAlpha *= clamp(flip * 3, 0, 1); g.scale(1, lerp(.2, 1, flip)); font(g, 400, 900); g.fillStyle = PINK; g.fillText('19', 0, 10); g.restore();
      font(g, 110, 900); g.fillStyle = BG; g.globalAlpha = calOut * clamp(flip * 2 - 1, 0, 1); g.fillText('2026', 0, 250);
      g.restore();
      stamp(g, 'LAUNCH DAY', 540, 1170, t, at('date', '2026') - .45, tP, 96, ORG, -.06);
    }
    var kP = pop(t, tP + .15), kX = pop(t, at('plat', 'Xbox') - .15);
    if (kP > 0) platCard(g, 290, 0, t, Math.min(kP, 1.04), 'PS5', 90, TEAL);
    if (kX > 0) platCard(g, 730, 1, t, Math.min(kX, 1.04), 'XBOX SERIES X|S', 38, PURP);
  }

  /* ---------- scene: now (game tiles pushed aside by the GTA 6 tile) ---------- */
  function sceneNow(g, t) {
    var s = SC[S.now], tG = at('now', 'GTA'), tF = at('now', 'first'), inK = pop(t, s.t0 + .02), toOld = eio(seg(t, tG - .15, tG + .35));
    var punch = t >= tF ? 1 + .1 * Math.exp(-(t - tF) * 7) : 1;
    g.save(); g.translate(540, 780); g.scale(punch, punch); g.translate(-540, -780);
    for (var row = 0; row < 2; row++) {
      var y = 640 + row * 260, dir = row ? -1 : 1, off = (t - s.t0) * 90 * dir;
      for (var i = -1; i < 7; i++) {
        var idx = ((i % 6) + 6) % 6, cx = ((i * 210 + off) % 1470 + 1470) % 1470 - 200;
        var kk = clamp(inK * 1.4 - (i + 1) * .04, 0, 1.05), push = toOld * (cx < 540 ? -1 : 1) * 560, al = (1 - toOld * .75);
        g.save(); g.globalAlpha = clamp(kk * 2, 0, 1) * al; g.translate(cx + push, y + Math.sin(t * 2 + i + row) * 6); g.scale(kk, kk);
        rr(g, -90, -90, 180, 180, 34); g.fillStyle = TILE[(idx + row * 3) % 6]; g.fill(); g.translate(0, 4);
        g.save(); g.fillStyle = BG; gameIcon(g, (idx + row * 2) % 6, 1); g.restore();
        g.restore();
      }
    }
    var big = pop(t, tG + .1);
    if (big > 0) {
      g.save(); g.translate(540, 780); g.scale(big, big); g.rotate(-.04);
      rr(g, -280, -280, 560, 560, 70); g.fillStyle = PINK; g.fill(); rr(g, -280, -280, 560, 560, 70); g.strokeStyle = CREAM; g.lineWidth = 8; g.stroke();
      font(g, 330, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = BG; g.fillText('6', 0, 30);
      font(g, 70, 900); g.fillText('GTA', 0, -190);
      g.restore();
      var ck = pop(t, at('now', 'first') - .25);
      chip(g, 'COMES FIRST', 540, 1120, { px: 100, bg: TEAL, fg: BG, rot: .035, s: ck, a: ck * 2 });
    }
    g.restore();
    stamp(g, 'FIRST', 540, 1275, t, tF, tF + 1.4, 96, ORG, -.05);
  }
  var TILE = [PINK, TEAL, ORG, PURP, MINT, SAND];

  /* ---------- scene: get (one hero object at a time) ---------- */

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

  var GET = [
    { name: 'DAILY SHORTS', col: PINK, tag: 'EVERY DAY', icon: 0, shape: 'rect', enter: 'pop', at: function () { return at('daily', 'new') - .05; } },
    { name: 'DETAILS + EGGS', col: TEAL, tag: '', icon: 1, icon2: 2, shape: 'circle', enter: 'spin', at: function () { return at('hid', 'Hidden') - .05; } },
    { name: 'BREAKDOWNS', col: PURP, tag: '', icon: 3, shape: 'frame', enter: 'drop', at: function () { return at('brk', 'Trailer') - .2; } },
    { name: 'MYSTERIES', col: MINT, tag: '', icon: 4, shape: 'dash', enter: 'rot', at: function () { return at('myst', 'Mysteries') - .05; } },
    { name: 'GUIDES', col: SAND, tag: '', icon: 5, shape: 'clip', enter: 'rise', at: function () { return at('guide', 'guides') - .35; } }
  ];
  function heroPanel(g, d) {
    var cx = 540, y0 = 500, h = 700;
    g.beginPath();
    if (d.shape === 'circle') g.arc(cx, y0 + h / 2, 372, 0, 6.2832);
    else if (d.shape === 'frame') g.roundRect(150, y0 + 40, 780, h - 80, 26);
    else if (d.shape === 'clip') g.roundRect(150, y0 + 30, 780, h - 30, 36);
    else g.roundRect(150, y0, 780, h, d.shape === 'dash' ? 90 : 44);
    g.fillStyle = PANEL2; g.fill();
    if (d.shape === 'dash') g.setLineDash([26, 16]);
    g.strokeStyle = d.col; g.lineWidth = 10; g.stroke(); g.setLineDash([]);
    if (d.shape === 'frame') { g.fillStyle = BG; for (var i = 0; i < 9; i++) { g.fillRect(170 + i * 86, y0 + 52, 40, 26); g.fillRect(170 + i * 86, y0 + h - 78, 40, 26); } }
    if (d.shape === 'clip') { rr(g, 440, y0, 200, 70, 20); g.fillStyle = d.col; g.fill(); }
  }
  function drawHero(g, d, t, t0, mode, a) {
    // mode: 0 = settled, 1..: entering with progress in a.p, handled by caller through transform
    g.save(); g.globalAlpha = a;
    heroPanel(g, d);
    var big = d.shape === 'circle' ? 2.6 : 3.6, iy = d.shape === 'frame' ? 760 : 750;
    if (d.icon2 != null) { g.save(); g.translate(400, iy); g.scale(2.5, 2.5); getIcon(g, d.icon, t, t0 + .02, d.col); g.restore(); g.save(); g.translate(690, iy); g.scale(2.5, 2.5); getIcon(g, d.icon2, t, t0 + .12, ORG); g.restore(); }
    else { g.save(); g.translate(540, iy); g.scale(big, big); getIcon(g, d.icon, t, t0 + .02, d.col); g.restore(); }
    font(g, d.name.length > 12 ? 56 : 84, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText(d.name, 540, d.tag ? 1000 : 1030);
    if (d.tag) { font(g, 44, 500, MONO); try { g.letterSpacing = '2px'; } catch (e) {} g.fillStyle = d.col; g.fillText(d.tag, 540, 1110); }
    g.restore();
  }
  function enterXf(g, kind, e) {                 // e = 0..1, applied around the card centre
    g.translate(540, 850);
    if (kind === 'spin') g.scale(Math.max(.04, e), 1);
    else if (kind === 'drop') g.translate(0, (1 - e) * -420);
    else if (kind === 'rot') { g.rotate((1 - e) * -.35); g.scale(lerp(.7, 1, e), lerp(.7, 1, e)); }
    else if (kind === 'rise') g.translate(0, (1 - e) * 520);
    else g.scale(lerp(.9, 1, e), lerp(.9, 1, e));
    g.translate(-540, -850);
  }
  function sceneGet(g, t) {
    var act = 0; GET.forEach(function (d, i) { if (t >= d.at()) act = i; });
    var t0 = GET[act].at(), k = seg(t, t0, t0 + .36), e = act === 0 ? 1 : eo(k);
    if (act > 0 && k < 1) drawHero(g, GET[act - 1], t, GET[act - 1].at(), 0, 1 - eo(seg(t, t0, t0 + .18)));
    var first = SC[S.get].t0, kin = act === 0 ? Math.min(pop(t, first + .05), 1.04) : e;
    g.save(); enterXf(g, GET[act].enter, act === 0 ? kin : e); drawHero(g, GET[act], t, t0, 0, clamp((act === 0 ? kin : e) * 2.2, 0, 1)); g.restore();
    var tT = at('myst', 'theory'); stamp(g, 'THEORY', 540, 1215, t, tT, tT + 1.3, 78, ORG, -.06);
    var q = seg(t, tT + .1, tT + .35) * (1 - seg(t, tT + 1.1, tT + 1.3)); if (q > 0) label(g, 'OUR THEORY · NOT ROCKSTAR', 540, 1305, q, CREAM, 40);
  }

  /* ---------- scene: promise (two hero cards, two lines each) ---------- */
  function promIcon(g, i, t, t0, col) {
    var T = t - t0;
    if (i === 0) { g.beginPath(); g.arc(0, 0, 46, 0, 6.2832); g.fillStyle = col; g.fill(); tick(g, 0, 2, 1.2, BG, clamp(T / .35, 0, 1)); }
    else if (i === 1) { rr(g, -64, -38, 128, 76, 14); g.fillStyle = ORG; g.fill(); g.setLineDash([9, 7]); g.strokeStyle = BG; g.lineWidth = 5; rr(g, -56, -30, 112, 60, 9); g.stroke(); g.setLineDash([]); }
    else if (i === 2) { g.beginPath(); g.arc(0, 0, 46, 0, 6.2832); g.strokeStyle = col; g.lineWidth = 12; g.stroke(); g.beginPath(); g.moveTo(-33, 33); g.lineTo(33, -33); g.stroke(); }
    else { var gp = 10 + 7 * Math.sin(T * 5); g.strokeStyle = col; g.lineWidth = 11; g.lineCap = 'round';
      g.beginPath(); g.arc(-34 - gp, 0, 26, .5, 6.28 - .5 + 0, false); g.stroke(); g.beginPath(); g.arc(34 + gp, 0, 26, Math.PI + .5, Math.PI - .5 + 6.28 - 0, false); g.stroke();
      g.lineWidth = 7; [[-12, -34], [0, -40], [12, -34]].forEach(function (p) { g.beginPath(); g.moveTo(p[0] - 6, p[1] - 10); g.lineTo(p[0] + 6, p[1] + 10); g.stroke(); });
      g.beginPath(); g.moveTo(-14, 14); g.lineTo(14, -14); g.stroke(); }
  }
  var PROM = [
    { card: 0, word: ['Every', 'rumor'], row: [{ head: 'EVERY FACT SOURCED', sub: 'SOURCE ON SCREEN', col: TEAL }, { head: 'RUMORS LABELED', sub: 'A RUMOR IS A RUMOR', col: ORG }], id: 'p1' },
    { card: 1, word: ['leaks', 'affiliated'], row: [{ head: 'NO LEAKS', sub: 'WE DO NOT SHOW THEM', col: PINK }, { head: 'NOT AFFILIATED', sub: '', col: PURP }], id: 'p2' }
  ];
  function scenePromise(g, t) {
    var s = SC[S.prom], tp2 = start('p2') - .1;
    PROM.forEach(function (c, ci) {
      var a0 = ci ? tp2 : s.t0 + .05, a1 = ci ? 1e9 : tp2 + .3;
      if (t < a0 || t > a1) return;
      var k = ci ? seg(t, a0, a0 + .32) : 1, e = eo(k), outK = ci ? 0 : seg(t, tp2, tp2 + .32), dx = 0, fa = ci ? clamp(e * 2, 0, 1) : 1 - eo(seg(t, tp2, tp2 + .18));
      g.save(); g.globalAlpha = fa;
      c.row.forEach(function (r, ri) {
        var t0 = at(c.id, c.word[ri]) - .12, kk = Math.min(pop(t, t0), 1.03); if (kk <= 0) return;
        var y = 500 + ri * 330;
        g.save(); g.globalAlpha *= clamp(kk * 2, 0, 1); g.translate(540, y + 140); g.scale(kk, kk); g.translate(-540, -(y + 140));
        rr(g, 100, y, 880 - 20, 290, 40); g.fillStyle = PANEL2; g.fill(); rr(g, 100, y, 860, 290, 40); g.strokeStyle = r.col; g.lineWidth = 8; g.stroke();
        g.save(); g.translate(230, y + 145); g.scale(1.5, 1.5); promIcon(g, ci * 2 + ri, t, t0 + .1, r.col); g.restore();
        font(g, 44, 900); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText(r.head, 330, r.sub ? y + 112 : y + 145);
        if (r.sub) { font(g, BIG, 500, MONO); try { g.letterSpacing = '1px'; } catch (e) {} g.fillStyle = r.col; g.fillText(r.sub, 340, y + 196); }
        g.restore();
      });
      g.restore();
    });
  }

  /* ---------- scene: old videos stay ---------- */
  function sceneOldVideos(g, t) {
    var s = SC[S.oldv], tcol = [PINK, TEAL, ORG, PURP, MINT, SAND];
    for (var i = 0; i < 6; i++) {
      var col = i % 3, row = (i / 3) | 0, x = 130 + col * 290, y = 520 + row * 270;
      var k = pop(t, s.t0 + .1 + i * .08), stay = pop(t, at('oldv', 'stay') - .1 + i * .1);
      if (k <= 0) continue;
      g.save(); g.globalAlpha = clamp(k * 2, 0, 1); g.translate(x + 130, y + 100); g.scale(Math.min(k, 1.04), Math.min(k, 1.04));
      rr(g, -130, -100, 260, 200, 22); g.fillStyle = tcol[i]; g.fill();
      g.fillStyle = 'rgba(11,8,32,.28)'; g.fillRect(-130, 40, 260, 60);
      poly(g, [[-18, -40], [-18, 18], [34, -11]], CREAM);
      g.fillStyle = BG; g.fillRect(-110, 62, 120 - i * 8, 14);
      if (stay > 0) { g.save(); g.translate(96, -70); g.scale(Math.min(stay, 1.05), Math.min(stay, 1.05)); g.beginPath(); g.arc(0, 0, 34, 0, 6.2832); g.fillStyle = CREAM; g.fill(); tick(g, 0, 2, .9, BG, clamp((t - at('oldv', 'stay') + .1 - i * .1) / .3, 0, 1)); g.restore(); }
      g.restore();
    }
    var ck = pop(t, at('oldv', 'all') - .1);
    chip(g, 'OLD VIDEOS STAY UP', 540, 1160, { px: 54, bg: CREAM, fg: BG, rot: -.025, s: Math.min(ck, 1.03), a: ck * 2 });
  }

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
      font(g, 40, 500, MONO); g.fillStyle = PINK; g.fillText('TYPE IT BELOW', 0, 84);
      g.restore();
      var opts = [['HIDDEN DETAILS', TEAL], ['EASTER EGGS', ORG], ['TRAILER BREAKDOWNS', PURP], ['MYSTERIES', MINT]];
      opts.forEach(function (o, i) {
        var kk = pop(t, tAsk2 + .05 + i * .22), hot = Math.floor(((t - tAsk2) * 1.6)) % 4 === i && t > tAsk2 + 1.1;
        var x = 540, y = 940 + i * 112;
        chip(g, (i + 1) + '  ' + o[0], x, y, { px: 50, bg: hot ? o[1] : PANEL2, line: o[1], fg: hot ? BG : CREAM, s: kk * (hot ? 1.04 : 1), a: kk * 2 * out, lw: 5, pad: 26 });
      });
    }
  }


  /* ---------- the wipe: a narrow torn-edge band; the next scene is already under it ---------- */
  var WIPE_HALF = .2;
  function wipeAt(t) {
    for (var i = 1; i < SC.length; i++) if (t >= SC[i].t0 - WIPE_HALF && t <= SC[i].t0 + WIPE_HALF) return i;
    return -1;
  }
  function tornX(bx, y, side) { return bx + (hash(Math.floor(y / 44) + side * 7) - .5) * 70; }
  function bandPath(g, bx, w, side) {
    g.beginPath(); g.moveTo(tornX(bx, 0, 0) - w, -10);
    for (var y = 0; y <= H + 44; y += 44) g.lineTo(tornX(bx, y, 0) - w, y);
    for (var y2 = H + 44; y2 >= 0; y2 -= 44) g.lineTo(tornX(bx, y2, 1) + w, y2);
    g.closePath();
  }
  function drawScene(g, t, si, home) {
    g.save(); g.translate(0, home || si === 0 ? 60 : 100);
    if (home || si === 0) hookFrame(g, t, home);
    else if (si === S.date) sceneDate(g, t);
    else if (si === S.now) sceneNow(g, t);
    else if (si === S.get) sceneGet(g, t);
    else if (si === S.prom) scenePromise(g, t);
    else if (si === S.oldv) sceneOldVideos(g, t);
    else if (si === S.cta) sceneCta(g, t);
    g.restore();
  }

  /* ---------- frame ---------- */
  function bottomLabel(g, t) {
    var si = sceneAt(t), s = SC[si];
    if (si !== S.date) return;
    var q = seg(t, s.t0 + .35, s.t0 + .6) * (1 - seg(t, s.t1 - .15, s.t1 - .02));
    label(g, 'SOURCE: ROCKSTARGAMES.COM/VI', 540, 1430, q, CREAM, 40);
  }
  function frame(g, t, homeMode) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    var si = homeMode ? 0 : sceneAt(t), wi = homeMode ? -1 : wipeAt(t);
    stage(g, t, homeMode || si === 0 ? .96 : .4);
    if (wi > 0) {
      var p = eio(seg(t, SC[wi].t0 - WIPE_HALF, SC[wi].t0 + WIPE_HALF)), bx = lerp(-160, W + 160, p);
      g.save(); g.beginPath(); g.moveTo(0, -10); for (var ya = 0; ya <= H + 44; ya += 44) g.lineTo(tornX(bx, ya, 0), ya); g.lineTo(0, H + 44); g.closePath(); g.clip();
      drawScene(g, Math.min(t + .3, SC[wi].t1), wi, false); g.restore();
      g.save(); g.beginPath(); g.moveTo(W, -10); for (var yb = 0; yb <= H + 44; yb += 44) g.lineTo(tornX(bx, yb, 1), yb); g.lineTo(W, H + 44); g.closePath(); g.clip();
      drawScene(g, Math.min(t, SC[wi - 1].t1), wi - 1, false); g.restore();
      [[TEAL, -26], [ORG, 26], [PINK, 0]].forEach(function (c) { g.save(); g.translate(c[1], 0); bandPath(g, bx, 22, 0); g.fillStyle = c[0]; g.fill(); g.restore(); });
    } else drawScene(g, t, si, homeMode);
    if (homeMode) return;
    bottomLabel(g, t);
    if (LIVE.text) captions(g, t);
    var back = eio(seg(t, HOME, HOME + .45));
    if (back > 0) { g.save(); g.globalAlpha = back; frame(g, 0, true); g.restore(); }
    g.fillStyle = 'rgba(255,243,230,.12)'; g.fillRect(60, 140, W - 120, 6);
    g.fillStyle = PINK; g.fillRect(60, 140, (W - 120) * t / DUR, 6);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

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
    function add(id, text) { out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    if (si === 0) add('mark', t < FLIP + .2 ? 'NOV 19' : 'GTA 6');
    if (si === S.date) add('date', t < start('plat') ? 'NOVEMBER 19 2026' : 'NOVEMBER 19 2026 PS5 XBOX SERIES X|S SOURCE ROCKSTARGAMES.COM/VI');
    if (si === S.now) add('now', 'GTA 6 COMES FIRST');
    if (si === S.get) { var a = 0; GET.forEach(function (d, i) { if (t >= d.at()) a = i; }); add('get' + a, (GET[a].name + ' ' + GET[a].tag).trim()); }
    if (si === S.prom) PROM.forEach(function (c) { c.row.forEach(function (r, ri) { if (t >= at(c.id, c.word[ri]) - .1) add(c.id + ri, (r.head + ' ' + r.sub).trim()); }); });
    if (si === S.oldv) add('oldv', 'OLD VIDEOS STAY UP');
    if (si === S.cta) add('cta', t < start('ask1') ? 'SUBSCRIBE' : 'WHICH GTA 6 TOPIC FIRST? HIDDEN DETAILS EASTER EGGS TRAILER BREAKDOWNS MYSTERIES');
    return out;
  }

  /* ---------- events: sound design reads the same word times ---------- */
  var EV = [];
  function initTimes() {
    EV.push({ t: .03, type: 'stamp', big: true });
    SC.forEach(function (s, i) { if (i) EV.push({ t: s.t0, type: 'swish' }); });
    EV.push({ t: at('date', 'November'), type: 'thump' }, { t: start('plat'), type: 'boop' }, { t: at('plat', 'Xbox') - .05, type: 'boop' });
    EV.push({ t: at('now', 'GTA') + .1, type: 'stamp', big: true });
    GET.forEach(function (d, i) { EV.push({ t: d.at() + .05, type: 'blip', f: 620 + i * 90 }); });
    EV.push({ t: at('myst', 'theory'), type: 'stamp' });
    PROM.forEach(function (c) { c.row.forEach(function (r, ri) { EV.push({ t: at(c.id, c.word[ri]) - .1, type: c.card && ri ? 'thump' : 'click' }); }); });
    EV.push({ t: start('p2') - .1, type: 'swish' });
    for (var i = 0; i < 6; i++) EV.push({ t: at('oldv', 'stay') - .1 + i * .1, type: 'blip', f: 800 + i * 60 });
    EV.push({ t: at('sub', 'never') - .3, type: 'click' }, { t: at('sub', 'never') - .23, type: 'ding' });
    for (var j = 0; j < 4; j++) EV.push({ t: start('ask2') + .05 + j * .22, type: 'blip', f: 700 + j * 90 });
    /* no hit lands inside a spoken word: stamps keep 0.15 s, everything else 0.14 s clear of the word's start, so each hit moves into the gap before it */
    var WORDS = []; VO.lines.forEach(function (l) { l.words.forEach(function (w) { WORDS.push(w); }); });
    EV.forEach(function (e) {
      var m = e.type === 'stamp' ? .15 : .14;
      for (var pass = 0; pass < 6; pass++) {
        var hit = null; WORDS.forEach(function (w) { if (e.t > w.t0 - m && e.t < w.t1) hit = w; });
        if (!hit) break;
        e.t = hit.t0 - m - .005;
      }
      e.t = Math.max(e.type === 'swish' ? .2 : 0, e.t);
    });
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
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: at('date', 'November') + 1.2, SLUG: 'gta-transition', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
