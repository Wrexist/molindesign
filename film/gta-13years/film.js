/* "13 years" — GTA 5 to GTA 6, a Short for the Delta channel. Our own flat graphics and our own voice: no Rockstar
   footage, logo or key art, no music. Narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py). Pure function of t like ../film.js. Contract: window.FILM,
   DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). The native move is the striped sunset disc: the backdrop of the
   number on frame 0, the marker that rolls down the year ruler, and the sun that sets on the last line.
   Facts and sources: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur;
  var BG = '#0b0820', PANEL = '#1a1238', PANEL2 = '#2a1b57', CREAM = '#fff1e3', DIM = 'rgba(255,241,227,.55)', FAINT = 'rgba(255,241,227,.16)';
  var PINK = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d', YEL = '#ffc65a', HOT = PINK;
  var DISP = 'Archivo', MONO = '"Geist Mono"';

  /* ---------- math ---------- */
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
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .72); }
  function qt(t) { return (Math.floor(t * 30) + .5) / 30; }      // the frame the renderer samples, for displayed numbers

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

  var SC = [
    { id: 'hook', name: 'Thirteen years', t0: 0 },
    { id: 'ruler', name: 'The ruler', t0: start('five') - .3 },
    { id: 'ps', name: 'Two consoles', t0: start('ps') - .3 },
    { id: 'bars', name: 'The longest gap', t0: start('prev') - .3 },
    { id: 'dates', name: 'Two delays', t0: start('fall') - .3 },
    { id: 'end', name: 'Day one', t0: start('now') - .5 }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = end('q') + .3;
  /* one hero stamp, in the low band (y 1280, clear of TikTok's caption overlay) */
  var STAMPS = [['OVER 2×', at('dbl', 'double'), at('dbl', 'double') + 2.3, 130, PINK, -.06]];

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
  function textW(g, text, px, wt, fam) { font(g, px, wt, fam); return g.measureText(text).width; }
  function fit(g, text, maxW, px, wt, fam) { var w = textW(g, text, px, wt, fam); return w > maxW ? px * maxW / w : px; }
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
  function label(g, text, x, y, a, col, px, align) {
    px = Math.max(30, px || 32);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillStyle = col || DIM; try { g.letterSpacing = '3px'; } catch (e) {}
    g.fillText(text, x, y + (1 - Math.min(1, a)) * 14); g.restore();
  }
  function stamp(g, text, x, y, t, t0, t1, px, col, rot) {
    if (t < t0 || t > t1 + .3) return;
    var k = sp(t, t0, 3, .55), out = 1 - seg(t, t1, t1 + .3), s = lerp(1.35, 1, clamp(k, 0, 1.2));
    g.save(); g.globalAlpha = clamp(k * 3, 0, 1) * out; g.translate(x, y); g.rotate(rot == null ? -.12 : rot); g.scale(s, s);
    font(g, px, 900); var w = g.measureText(text).width + px * .7, h = px * 1.25;
    rr(g, -w / 2, -h / 2, w, h, px * .18); g.fillStyle = BG; g.fill(); g.strokeStyle = col; g.lineWidth = px * .09; g.stroke();
    g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, px * .05); g.restore();
  }
  function arrow(g, x0, y0, x1, y1, k, col, lw) {
    if (k <= 0) return;
    var x = lerp(x0, x1, k), y = lerp(y0, y1, k), a = Math.atan2(y1 - y0, x1 - x0);
    g.save(); g.strokeStyle = g.fillStyle = col; g.lineWidth = lw || 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x - Math.cos(a) * 18, y - Math.sin(a) * 18); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a - .45) * 38, y - Math.sin(a - .45) * 38); g.lineTo(x - Math.cos(a + .45) * 38, y - Math.sin(a + .45) * 38); g.closePath(); g.fill();
    g.restore();
  }
  /* the Vice City sun: a flat disc, ink stripes that thicken toward the bottom and keep sliding down */
  function sun(g, cx, cy, r, t, o) {
    o = o || {}; var N = 7, off = (t * .3) % 1;
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.clip();
    var gr = g.createLinearGradient(0, cy - r, 0, cy + r); gr.addColorStop(0, YEL); gr.addColorStop(.45, ORG); gr.addColorStop(1, PINK);
    g.fillStyle = gr; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    g.fillStyle = o.cut || BG;
    for (var i = 0; i < N; i++) {
      var u = (i + off) / N, y = cy + r * (-.08 + Math.pow(u, 1.5) * 1.1), th = r * (.01 + .12 * Math.pow(u, 1.3));
      g.fillRect(cx - r - 2, y - th / 2, 2 * r + 4, th);
    }
    g.restore();
  }
  /* a flat console slab or tower, drawn from rounded rects only */
  function slab(g, x, y, w, h, body, trim, a) {
    g.save(); g.globalAlpha *= a; rr(g, x - w / 2, y - h / 2, w, h, Math.min(w, h) * .2); g.fillStyle = body; g.fill();
    rr(g, x - w / 2, y - h / 2, w, h, Math.min(w, h) * .2); g.strokeStyle = trim; g.lineWidth = 6; g.stroke(); g.restore();
  }

  /* ---------- background: flat ink with a few slow speed dashes, so the frame is never still ---------- */
  var DASH = (function () {
    var r = mulberry(11), out = [];
    for (var i = 0; i < 16; i++) out.push({ x: r() * W, y: 200 + r() * 1500, v: 18 + r() * 40, w: 60 + r() * 120, c: i % 2 ? TEAL : PINK });
    return out;
  })();
  function dashes(g, t) {
    g.save();
    DASH.forEach(function (d) {
      var x = ((d.x - t * d.v) % (W + 300) + W + 300) % (W + 300) - 150;
      g.globalAlpha = .1; g.fillStyle = d.c; g.fillRect(x, d.y, d.w, 5);
    });
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · the hook: a huge 13 over the striped sun, already moving on frame 0
     ===================================================================================================== */
  function hookScene(g, t) {
    var kick = Math.exp(-Math.max(0, t - at('hook', 'thirteen')) * 7) * (t >= at('hook', 'thirteen') ? 1 : 0);
    var settle = Math.exp(-t * 9);
    var s = 1 + .08 * settle + .07 * kick;
    sun(g, 540, 880, 410, t);
    g.save(); g.translate(540, 900); g.scale(s, s);
    font(g, 700, 900); try { g.fontStretch = 'expanded'; } catch (e) {}
    var px = fit(g, '13', 640, 700, 900);
    font(g, px, 900); try { g.fontStretch = 'expanded'; } catch (e) {}
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = 26; g.strokeStyle = BG; g.fillStyle = TEAL;
    g.strokeText('13', 14, 14); g.fillText('13', 14, 14);
    g.strokeText('13', 0, 0); g.fillStyle = CREAM; g.fillText('13', 0, 0);
    g.restore();
    var ya = sp(t, .22, 3, .6);
    chip(g, 'YEARS', 540, 1330, { px: 120, bg: PINK, fg: BG, wt: 900, s: Math.min(1.1, ya), a: ya * 3 });
  }

  /* =====================================================================================================
     SCENE 2 · the ruler: the sun rolls from Sept 2013 to Nov 2026
     ===================================================================================================== */
  var RX = 300, RY0 = 520, RDY = 60, Y5 = RY0 + .712 * RDY, Y6 = RY0 + 13.882 * RDY;
  var TA = at('six', 'lands') - .05, TB = at('six', '2026') + .1;
  function sunY(t) {
    var d = Math.min(1.04, sp(t, start('five') + .02, 2.2, .62));
    return lerp(Y5 - 230, Y5, d) + (Y6 - Y5) * eio(seg(t, TA, TB));
  }
  function rulerScene(g, t) {
    var S = SC[1], grow = eo(seg(t, S.t0 + .05, S.t0 + .6)), ys = sunY(t), roll = t > TA;
    g.save(); g.lineCap = 'round';
    g.strokeStyle = FAINT; g.lineWidth = 6; g.beginPath(); g.moveTo(RX, RY0 - 20); g.lineTo(RX, RY0 - 20 + (RDY * 13 + 40) * grow); g.stroke();
    if (roll) { g.strokeStyle = PINK; g.lineWidth = 14; g.beginPath(); g.moveTo(RX, Y5); g.lineTo(RX, ys); g.stroke(); }
    for (var k = 0; k <= 13; k++) {
      var y = RY0 + k * RDY, a = clamp(grow * 15 - k, 0, 1), done = roll && ys >= y - 1;
      g.globalAlpha = a; g.strokeStyle = done ? PINK : DIM; g.lineWidth = 5;
      g.beginPath(); g.moveTo(RX - 18, y); g.lineTo(RX + 18, y); g.stroke();
      font(g, 30, k === 0 || k === 13 ? 700 : 500, MONO); g.textAlign = 'right'; g.textBaseline = 'middle';
      g.fillStyle = done ? PINK : (k === 0 || k === 13) ? CREAM : DIM; g.fillText(String(2013 + k), 232, y);
    }
    g.restore();
    var sa = clamp(sp(t, start('five') + .02, 2.2, .62) * 3, 0, 1);
    g.save(); g.globalAlpha = sa; sun(g, RX, ys, 64, t); g.restore();
    /* the two dates */
    var a5 = clamp(sp(t, at('five', 'GTA'), 3, .7), 0, 1.1), a6 = clamp(sp(t, TB - .5, 3, .7), 0, 1.1);
    function card(big, sub, y, a, col) {
      if (a <= 0) return;
      g.save(); g.globalAlpha = clamp(a, 0, 1); g.translate((1 - Math.min(1, a)) * 40, 0);
      font(g, 100, 900); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText(big, 470, y);
      g.restore(); label(g, sub, 470, y + 78, a, col, 38, 'left');
    }
    card('GTA 5', 'SEP 17, 2013', 560, a5, PINK);
    card('GTA 6', 'NOV 19, 2026', 1270, a6, TEAL);
    /* years elapsed, rolling with the sun */
    if (roll && sunY(qt(t)) - Y5 >= RDY) {
      var yrs = (sunY(qt(t)) - Y5) / RDY, n = Math.min(13, Math.floor(yrs + 1e-3)), tg = at('gap', 'thirteen');
      var kick = t >= tg ? Math.exp(-(t - tg) * 7) : 0, ca = clamp(sp(t, TA + .1, 3, .7), 0, 1);
      g.save(); g.translate(720, 930); g.scale(1 + .1 * kick, 1 + .1 * kick); g.globalAlpha = ca;
      font(g, 240, 900); try { g.fontStretch = 'expanded'; } catch (e) {}
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = TEAL; g.fillText(String(n), 9, 9); g.fillStyle = CREAM; g.fillText(String(n), 0, 0);
      g.restore();
      chip(g, 'YEARS', 720, 1090, { px: 56, bg: PINK, fg: BG, wt: 900, a: ca });
      var ma = clamp(sp(t, at('gap', 'two') - .05, 3, .7), 0, 1);
      chip(g, '+ 2 MONTHS', 720, 1180, { px: 50, line: CREAM, fg: CREAM, wt: 800, a: ma, s: Math.min(1.08, ma) });
    }
  }

  /* =====================================================================================================
     SCENE 3 · two consoles: PlayStation 3 then, PlayStation 5 now (flat shapes, no logos)
     ===================================================================================================== */
  function psScene(g, t) {
    var a3 = clamp(sp(t, at('ps', 'launched') - .1, 3, .7), 0, 1.1), a5 = clamp(sp(t, at('ps', 'GTA', 1) - .1, 3, .7), 0, 1.1);
    function name(txt, x, y, a) {
      if (a <= 0) return;
      g.save(); g.globalAlpha = clamp(a, 0, 1); var px = fit(g, txt, 340, 46, 800); font(g, px, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText(txt, x, y + (1 - Math.min(1, a)) * 24); g.restore();
    }
    name('PLAYSTATION 3', 290, 730, a3); name('PLAYSTATION 5', 740, 730, a5);
    /* PS3: a wide slab, pink trim, a disc slot and one teal light */
    var bob3 = Math.sin(t * 1.6) * 6, bob5 = Math.sin(t * 1.6 + 1.5) * 6;
    g.save(); g.translate(0, bob3);
    slab(g, 290, 960, 330, 110, PANEL2, PINK, clamp(a3, 0, 1));
    g.globalAlpha = clamp(a3, 0, 1); g.fillStyle = BG; rr(g, 150, 944, 210, 12, 6); g.fill();
    g.fillStyle = TEAL; g.beginPath(); g.arc(422 - 60, 984, 8, 0, 6.2832); g.fill(); g.globalAlpha = 1; g.restore();
    /* PS5: a tall tower, cream shells around a dark centre */
    g.save(); g.translate(0, bob5);
    slab(g, 740, 960, 150, 390, CREAM, TEAL, clamp(a5, 0, 1));
    g.globalAlpha = clamp(a5, 0, 1); g.fillStyle = PANEL; rr(g, 740 - 24, 960 - 170, 48, 340, 20); g.fill();
    g.fillStyle = TEAL; rr(g, 740 - 4, 960 - 150, 8, 300, 4); g.fill(); g.globalAlpha = 1; g.restore();
    var y3 = fit(g, '2013', 300, 130, 900);
    chip(g, '2013', 290, 1250, { px: y3, fg: PINK, wt: 900, pad: 0, a: a3 });
    chip(g, '2026', 740, 1250, { px: y3, fg: TEAL, wt: 900, pad: 0, a: a5 });
    arrow(g, 460, 960, 580, 960, eo(seg(t, at('ps', 'GTA', 1) - .25, at('ps', 'GTA', 1) + .2)), PINK, 10);
  }

  /* =====================================================================================================
     SCENE 4 · the longest gap before, against this one
     ===================================================================================================== */
  var BX = 150, BWID = 780;
  function barsScene(g, t) {
    var a1 = clamp(sp(t, SC[3].t0 + .15, 3, .7), 0, 1), g1 = eo(seg(t, at('prev', 'longest'), at('prev', 'longest') + .9));
    var g2 = eo(seg(t, at('dbl', 'more') - .1, at('dbl', 'double') + .35)), a2 = clamp(sp(t, at('prev', 'about') - .2, 3, .7), 0, 1);
    label(g, 'GTA IV TO GTA 5', BX, 640, a1, CREAM, 34, 'left'); label(g, 'APR 2008 TO SEP 2013', BX, 690, a1, DIM, 30, 'left');
    g.save(); g.globalAlpha = a1; rr(g, BX, 730, BWID, 100, 18); g.fillStyle = 'rgba(255,241,227,.07)'; g.fill(); g.restore();
    var w1 = BWID * 5.4 / 13.2 * g1;
    if (w1 > 4) { rr(g, BX, 730, w1, 100, 18); g.fillStyle = TEAL; g.fill(); }
    chip(g, '5.4 YEARS', BX + w1 + 24 + 140, 780, { px: 56, fg: CREAM, wt: 900, pad: 0, a: g1 > .6 ? (g1 - .6) / .4 : 0 });
    label(g, 'GTA 5 TO GTA 6', BX, 910, a2, CREAM, 34, 'left'); label(g, 'SEP 2013 TO NOV 2026', BX, 960, a2, DIM, 30, 'left');
    g.save(); g.globalAlpha = a2; rr(g, BX, 1000, BWID, 100, 18); g.fillStyle = 'rgba(255,241,227,.07)'; g.fill(); g.restore();
    var w2 = BWID * g2;
    if (w2 > 4) {
      rr(g, BX, 1000, w2, 100, 18); g.fillStyle = PINK; g.fill();
      if (g2 > .5) { font(g, 56, 900); g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = BG; g.globalAlpha = (g2 - .5) * 2; g.fillText('13.2 YEARS', BX + w2 - 26, 1052); g.globalAlpha = 1; }
    }
    label(g, 'RELEASE DATE TO RELEASE DATE', 540, 1400, a2, DIM, 30);
  }

  /* =====================================================================================================
     SCENE 5 · the dates: first target, then two delays crossed out
     ===================================================================================================== */
  var CARDS = [
    { y: 650, tag: 'FIRST TARGET', date: 'FALL 2025', col: TEAL, show: at('fall', 'fall') - .1, dateAt: at('fall', 'fall'), strike: at('d1', 'said') },
    { y: 900, tag: 'DELAY 1 · ANNOUNCED MAY 2, 2025', date: 'MAY 26, 2026', col: ORG, show: at('d1', 'may', 0) - .1, dateAt: at('d1', '26'), strike: at('d2', 'moved') },
    { y: 1150, tag: 'DELAY 2 · ANNOUNCED NOV 6, 2025', date: 'NOV 19, 2026', col: PINK, show: at('d2', 'november') - .1, dateAt: at('d2', 'november'), strike: 1e9 }
  ];
  function datesScene(g, t) {
    var held = at('held', 'held'), pulse = t >= held ? Math.exp(-(t - held) * 3) * Math.cos((t - held) * 16) : 0;
    CARDS.forEach(function (c, i) {
      var a = clamp(sp(t, c.show, 3, .7), 0, 1.1); if (a <= 0) return;
      var sk = eo(seg(t, c.strike, c.strike + .35)), dim = 1 - .55 * sk, x = 130, w = 800, h = 190, last = i === 2;
      var sc = last ? 1 + .035 * Math.max(0, pulse) : 1;
      g.save(); g.globalAlpha = clamp(a, 0, 1) * dim; g.translate(540, c.y); g.scale(sc, sc); g.translate(-540, -c.y + (1 - Math.min(1, a)) * 40);
      rr(g, x, c.y - h / 2, w, h, 28); g.fillStyle = last && t >= held ? PANEL2 : PANEL; g.fill();
      g.strokeStyle = c.col; g.lineWidth = last && t >= held ? 8 : 5; rr(g, x, c.y - h / 2, w, h, 28); g.stroke();
      label(g, c.tag, x + 34, c.y - 52, 1, c.col, 30, 'left');
      var da = clamp(sp(t, c.dateAt, 3, .7), 0, 1), px = fit(g, c.date, 720, 100, 900);
      g.globalAlpha *= da; font(g, px, 900); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText(c.date, x + 34, c.y + 24);
      if (sk > 0) { var tw = g.measureText(c.date).width; g.globalAlpha = 1; g.strokeStyle = PINK; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 20, c.y + 24); g.lineTo(x + 20 + (tw + 30) * sk, c.y + 24); g.stroke(); }
      g.restore();
    });
    var ha = clamp(sp(t, held + .5, 3, .7), 0, 1);
    chip(g, "STILL THE DATE ON ROCKSTAR'S SITE", 540, 1330, { px: 32, fg: TEAL, line: TEAL, wt: 600, fam: MONO, a: ha, pad: 18 });
    label(g, 'SOURCES: ROCKSTAR, VGC, VARIETY', 540, 1400, clamp(sp(t, CARDS[1].show, 3, .7), 0, 1), DIM, 30);
  }

  /* =====================================================================================================
     SCENE 6 · the sun sets on "almost over", then rises into frame 0
     ===================================================================================================== */
  var HORIZON = 1190;
  function endScene(g, t) {
    var u1 = eio(seg(t, SC[5].t0 + .1, end('now') - .05)), u2 = eio(seg(t, end('q') - .35, HOME));
    var cy = lerp(lerp(780, 1290, u1), 880, u2), r = lerp(340, 410, u2);
    g.save(); g.beginPath(); g.rect(0, 0, W, lerp(HORIZON, H, u2)); g.clip(); sun(g, 540, cy, r, t); g.restore();
    g.fillStyle = TEAL; g.globalAlpha = 1 - u2; rr(g, 150, HORIZON, 780, 10, 5); g.fill(); g.globalAlpha = 1;
    var qa = clamp(sp(t, at('q', 'day') - .1, 3, .65), 0, 1.1);
    var px = fit(g, 'DAY ONE?', 700, 190, 900);
    chip(g, 'DAY ONE?', 540, 1330, { px: px, fg: CREAM, wt: 900, pad: 0, a: qa * (1 - u2), s: Math.min(1.05, .7 + .3 * qa) });
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
        if (cur) { g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 12, y - 70, ws[i] + 24, 92, 18); g.fill(); }
        g.fillStyle = cur ? BG : said ? CREAM : 'rgba(244,237,224,.3)';
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }


  /* ---------- the picture ---------- */
  var NOISE, SCENES = [hookScene, rulerScene, psScene, barsScene, datesScene, endScene];
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 960, 200, 540, 960, 1250); vg.addColorStop(0, 'rgba(70,30,110,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.30)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    dashes(g, t);
    var si = sceneAt(t), S = SC[si];
    /* scene change: a pink edge sweeps left to right and clears the old scene (one axis only, no radial smear) */
    var sel = si + 1 < SC.length ? seg(t, S.t1 - .3, S.t1 - .02) : 0;
    var inK = si > 0 ? eo(seg(t, S.t0, S.t0 + .35)) : 1;
    g.save();
    var push = 1 + .025 * seg(t, S.t0, S.t1), cy = 1000;
    g.translate(540, cy); g.scale(push * lerp(.95, 1, inK), push * lerp(.95, 1, inK)); g.translate(-540, -cy);
    SCENES[si](g, t);
    g.restore();
    if (sel > 0) {
      var x1 = lerp(0, 1080, eio(sel));
      g.save(); g.beginPath(); g.rect(0, 470, x1, 1060); g.clip(); stage(g); dashes(g, t); g.restore();
      g.fillStyle = PINK; g.fillRect(x1 - 6, 470, 12, 1060);
    }
    /* the loop: the end dissolves back into frame 0 */
    var back = eio(seg(t, HOME, HOME + .4));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g); dashes(g, 0); hookScene(g, 0); g.restore(); }
    STAMPS.forEach(function (s) { if (s[3]) stamp(g, s[0], 540, 1280, t, s[1], s[2], s[3], s[4], s[5]); });
    if (LIVE.text) captions(g, t);

    /* a thin progress line along the top (the loop restarts it) */
    g.fillStyle = 'rgba(255,241,227,.12)'; g.fillRect(60, 140, W - 120, 6);
    g.fillStyle = PINK; g.fillRect(60, 140, (W - 120) * t / DUR, 6);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

  /* ---------- text dwell: on-screen stamps only (captions follow the voice, by design) ---------- */
  function TEXTS(t) {
    var out = [];
    STAMPS.forEach(function (s, i) { if (t >= s[1] + .2 && t < s[2]) out.push({ id: 'stamp' + i, text: s[0], x0: 0, y0: 0, x1: 0, y1: 0 }); });
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [];
  function initTimes() {
    EV.push({ t: .02, type: 'thump' }, { t: .24, type: 'stamp' }, { t: at('hook', 'thirteen'), type: 'thump' });
    EV.push({ t: start('five') + .1, type: 'boop' }, { t: at('five', 'GTA'), type: 'blips', n: 3 });
    for (var k = 1; k <= 13; k++) {                       // a tick each time the sun crosses a year
      var target = Y5 + k * RDY, lo = TA, hi = TB;
      if (target > Y6) continue;
      for (var j = 0; j < 30; j++) { var m = (lo + hi) / 2; if (sunY(m) < target) lo = m; else hi = m; }
      EV.push({ t: hi, type: 'tick', g: .2 + k * .012 });
    }
    EV.push({ t: TB, type: 'thump' }, { t: TB + .05, type: 'ding' }, { t: at('gap', 'thirteen'), type: 'stamp' }, { t: at('gap', 'two') - .05, type: 'blip', f: 900 });
    EV.push({ t: at('ps', 'launched') - .1, type: 'blips', n: 3 }, { t: at('ps', 'GTA', 1) - .1, type: 'blips', n: 4, f: 1000 }, { t: at('ps', 'GTA', 1) - .2, type: 'swish' });
    EV.push({ t: at('prev', 'longest'), type: 'swish' }, { t: at('prev', 'about') - .2, type: 'blip', f: 800 }, { t: at('dbl', 'more') - .1, type: 'swish' });
    EV.push({ t: at('dbl', 'double'), type: 'stamp', big: true });
    CARDS.forEach(function (c, i) { EV.push({ t: c.show + .1, type: 'blips', n: 3, f: 700 + i * 120 }); if (c.strike < 1e8) EV.push({ t: c.strike, type: 'strike' }); });
    EV.push({ t: at('held', 'held'), type: 'ding' });
    EV.push({ t: SC[5].t0 + .1, type: 'suck', t1: end('now') - .05 }, { t: at('q', 'day'), type: 'ding' });
    SC.forEach(function (s, i) { if (i) EV.push({ t: s.t0 - .3, type: 'select' }); });
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

  /* ---------- score: a bouncy little synth groove that steps aside for the voice and the two silences ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.3), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .18; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], pts[0][0]); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], pts[k][0]); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(t0); o.stop(t1); return o; }

    /* foley */
    function key(t, f, g) { var o = bus(1, .05, (f - .5) * .6), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400 + f * 1800; bp.Q.value = 3; var n = noise(t, .04); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, (g || 1) * .3], [t + .03, 0]]); osc('sine', 180 + f * 60, t, t + .05, 1, [[t, 0], [t + .002, (g || 1) * .12], [t + .04, 0]]); }
    function tick(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .22], [t + .025, 0]]); }
    function blip(t, f, g) { var o = osc('sine', f, t, t + .12, 1, [[t, 0], [t + .004, g || .09], [t + .1, 0]], .3, (f - 1100) / 1400); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + .07); }
    function boop(t) { var o = osc('triangle', 520, t, t + .25, 1, [[t, 0], [t + .01, .14], [t + .22, 0]], .3); o.frequency.exponentialRampToValueAtTime(260, t + .2); }
    function ding(t) { [76, 83, 88].forEach(function (m, j) { osc('sine', mtof(m), t + j * .04, t + 1.2, 1, [[t + j * .04, 0], [t + j * .04 + .005, .09], [t + 1.1, 0]], .5, (j - 1) * .4); }); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, 1, [[t, 0], [t + .004, g || .4], [t + .26, 0]], .1); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t - .12, t + .14, 900, 5200, .14, .02, 1.6); }
    function slice(t) { band(t - .1, t + .02, 3000, 9000, .1, .2, 2.5); tick(t + .02, .3); }
    function stampS(t, big) { thump(t, big ? .7 : .5); var n = noise(t, .2), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1800; var o = bus(1, .25); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .5 : .35], [t + .15, 0]]); }
    function buzz(t) { osc('square', 110, t, t + .35, 1, [[t, 0], [t + .01, .05], [t + .3, .05], [t + .34, 0]], .05); osc('square', 116, t, t + .35, 1, [[t, 0], [t + .01, .04], [t + .3, .04], [t + .34, 0]], .05); }
    function paper(t) { band(t - .03, t + .07, 1800, 3800, .05, .02, 1.2, (rnd() - .5) * .8); }
    function flip(t) { band(t, t + .16, 2000, 5000, .1, .02, 2); tick(t + .15, .25); }
    function click(t) { tick(t, .5); thump(t, .15); }
    EV.forEach(function (e) {
      if (e.type === 'key') key(e.t, e.f || .5, e.g);
      else if (e.type === 'tick') tick(e.t, e.g);
      else if (e.type === 'blip') blip(e.t, e.f);
      else if (e.type === 'blips') for (var j = 0; j < e.n; j++) blip(e.t + j * .045, (e.f || 800) + j * 120, .06);
      else if (e.type === 'boop') boop(e.t);
      else if (e.type === 'ding') ding(e.t);
      else if (e.type === 'thump') thump(e.t);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'slice') slice(e.t);
      else if (e.type === 'stamp') stampS(e.t, e.big);
      else if (e.type === 'buzz') buzz(e.t);
      else if (e.type === 'paper') paper(e.t);
      else if (e.type === 'flip') flip(e.t);
      else if (e.type === 'click') click(e.t);
      else if (e.type === 'whirr') band(e.t, e.t1, 400, 2600, .08, .12, 4);
      else if (e.type === 'suck') band(e.t, e.t1, 5000, 300, .1, .14, 1.4);
      else if (e.type === 'select') band(e.t, e.t + .28, 1200, 3000, .05, .07, 2);
    });

    EV.forEach(function (e) {
      if (e.type === 'strike') { band(e.t - .05, e.t + .22, 800, 4200, .12, .02, 1.4); tick(e.t + .2, .35); }
    });

    /* no music: Isac adds a trending TikTok sound on the platform, so the film ships voice + sound effects. */
    key(DUR - .35, .5, .8);
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); watch(ctx); watch(tctx); acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 84px Archivo', '800 46px Archivo', '700 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%$×·→'); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  initTimes();
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: TB + .6, SLUG: 'gta-13years', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
