/* "Same trailer, 12 years apart": GTA 6, Delta. SLUG: 'gta-sametrailer'
   GTA 5's first trailer (Rockstar Games, Nov 2 2011) and GTA 6's first trailer (Rockstar Games, Dec 4 2023) stacked
   shot for shot: sunset, ROCKSTAR GAMES PRESENTS over the skyline, the beach, a vehicle across the water, the cops,
   a giant city sign. Then our own graphics: the 12-year gap, Trailer 1's 90 million views in a day, and the vote.
   A vertical film written in code, narrated first and cut to the voice: every beat is keyed to a word time from
   vo/vo.js (window.VO). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Footage: 12 muted excerpts drawn by film/kit/clip.js from clips.json, each under 5 s with a label, and between every
   pair an own-graphics "match" card so no stretch of footage runs over 5 s (clipkit.py lint). No Rockstar logo or key
   art, no trailer audio, no music, no end fade. Rail x 90-930. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, K = window.KIT, CLIP = window.CLIP;
  var BG = '#0b0820', CREAM = '#fbf0ea', HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d', INK = '#1d1233', YEL = '#ffd23f';
  var TAU = Math.PI * 2;
  var X0 = 90, X1 = 930, MID = 510, CW = 840, CH = 472, TOPY = 300, BOTY = 930, BANDY = 851, CAPY = 851;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function start(id) { return LINE[id].t0; }
  function lastw(id) { var w = LINE[id].words; return w[w.length - 1].t1; }

  /* ---------- the six matches ---------- */
  var PAIRS = [
    { id: 'sun', v: 'vsun', s: 'ssun', label: 'SUNSET', col: ORG },
    { id: 'pres', v: 'vpres', s: 'spres', label: 'SKYLINE', col: TEAL },
    { id: 'beach', v: 'vpier', s: 'sbeach', label: 'BEACH', col: YEL },
    { id: 'water', v: 'vski', s: 'sboat', label: 'WATER', col: TEAL },
    { id: 'cops', v: 'vcops', s: 'scops', label: 'COPS', col: HOT },
    { id: 'sign', v: 'vsign', s: 'ssign', label: 'BIG SIGN', col: ORG }
  ];
  var NOTE = {
    sun: 'label SUNSET on both + match counter 1/6',
    pres: 'label SKYLINE, both show ROCKSTAR GAMES PRESENTS over the city + counter 2/6',
    beach: 'label BEACH on both + counter 3/6',
    water: 'label WATER on both (jet ski / speedboat) + counter 4/6',
    cops: 'label COPS on both + counter 5/6',
    sign: 'label BIG SIGN, VINEWOOD vs VICE called out + counter 6/6'
  };

  /* ---------- times ---------- */
  var T = {}, EV = [], U = [];
  function ev(t, type, g, extra) { var e = { t: t, type: type, g: g == null ? 1 : g }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
  function initTimes() {
    EV.length = 0; CLIP.reset(); U.length = 0;
    /* pair spans: footage [a, b); between pairs an own-graphics match card [b, next a) of at least .45 s */
    var spans = [
      [0, at('sun', 'sunset') + .45],
      [start('pres') + .3, start('beach') - .35],
      [start('beach') + .15, start('water') - .35],
      [start('water') + .15, start('cops') - .35],
      [start('cops') + .1, start('sign') - .3],
      [at('sign', 'vinewood') - .2, at('sign', 'vice') + .75]
    ];
    PAIRS.forEach(function (p, i) {
      var a = spans[i][0], b = spans[i][1], d = b - a;
      function u(name, top) {
        return CLIP.use(name, a, b, { speed: Math.min(1, CUTLEN[name] / d * .98), zoom: [1.02, 1.1], focus: [.5, .5], note: (top ? 'GTA 5 card: ' : 'GTA 6 card: ') + NOTE[p.id] });
      }
      p.a = a; p.b = b; p.next = spans[i + 1] ? spans[i + 1][0] : null;
      p.uv = u(p.v, true); p.us = u(p.s, false);
      ev(a, i === 0 ? 'whoosh' : 'swish', .7); ev(a + .25, 'pop', .8);
      ev(b, 'tick', .6); ev(b + .05, 'slam', .55);
    });
    T.years = PAIRS[5].b;
    T.y11 = at('years', 'november'); T.y23 = at('years', 'december'); T.twelve = at('years', 'twelve');
    T.views = start('views') - .1; T.n90 = at('views', '90'); T.day = at('views', 'day');
    T.end = start('end') - .1; T.wins = at('end', 'which');
    ev(.02, 'slam', .8);
    ev(T.years, 'whoosh', .8); ev(T.y11, 'pop', .8); ev(T.y23, 'pop', .8); ev(T.twelve + .05, 'thud', .7);
    ev(T.views, 'swish', .8); ev(T.views + .1, 'ratchet', .7, { t1: T.n90 + .2 }); ev(T.n90 + .2, 'slam', .9);
    ev(T.end, 'whoosh', .7); ev(at('end', 'formula'), 'pop', .9); ev(at('end', 'coincidence'), 'pop', .9); ev(T.wins + .6, 'pop', .7);
    EV.sort(function (a, b) { return a.t - b.t; });
  }
  var CUTLEN = {};

  /* ---------- captions: the spoken words, up to 3 a card, in the band between the two cards ---------- */
  var CHUNKS = [];
  function buildChunks() {
    var HOTW = { mirrors: 1, sunset: 1, skyline: 1, beach: 1, water: 1, cops: 1, vinewood: 1, vice: 1, twelve: 1, '90': 1, coincidence: 1, wins: 1 };
    VO.lines.forEach(function (l) {
      var cur = [];
      l.words.forEach(function (w, i) {
        cur.push({ w: w.w.replace(/[.,:]$/, '').toUpperCase(), t0: w.t0, t1: w.t1, hot: !!HOTW[norm(w.w)] });
        if (cur.length === 3 || /[.?!,:]$/.test(w.w) || i === l.words.length - 1) { CHUNKS.push(cur); cur = []; }
      });
    });
    CHUNKS.forEach(function (c, i) { c.t0 = c[0].t0 - .05; c.t1 = CHUNKS[i + 1] ? Math.min(CHUNKS[i + 1][0].t0 - .05, c[c.length - 1].t1 + .6) : DUR; });
  }
  function captions(g, t, y) {
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (t < c.t0 || t >= c.t1) continue;
      var px = 56, gap = px * .55, ws = c.map(function (w) { return K.measure(g, w.w, px, { wide: false }) * 1.1; });
      var tw = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (c.length - 1), s = Math.min(1, (X1 - X0 - 20) / tw), x = -tw / 2;
      g.save(); g.translate(MID, y); g.scale(s, s);
      c.forEach(function (w, j) { K.caption(g, [w], x + ws[j] / 2, 0, px, t, { wide: false }); x += ws[j] + gap; });
      g.restore(); return;
    }
  }

  /* ---------- background ---------- */
  function backdrop(g, t) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = .07; g.strokeStyle = HOT; g.lineWidth = 34;
    var off = (t / DUR) * 240;
    for (var x = -H; x < W + H; x += 120) { g.beginPath(); g.moveTo(x + off, 0); g.lineTo(x + off - H * .6, H); g.stroke(); }
    g.restore();
  }
  function card(g, x, y, w, h, fill, r) { g.save(); rr(g, x + 8, y + 12, w, h, r || 30); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, x, y, w, h, r || 30); g.fillStyle = fill; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore(); }

  /* ---------- the two cards: footage during a pair, our own match card between pairs ---------- */
  function slot(g, t, y, u, year, game, col, pairIdx, inPair, top) {
    card(g, X0, y, CW, CH, CREAM, 30);
    g.save(); rr(g, X0 + 8, y + 8, CW - 16, CH - 16, 24); g.clip();
    if (inPair) {
      CLIP.draw(g, t, X0 + 8, y + 8, CW - 16, CH - 16, u);
      if (u.freeze != null && t - u.t0 > u.freeze) K.freezeFX(g, W, H, t - u.t0 - u.freeze);
    } else matchArt(g, t, y, pairIdx, top);
    g.restore();
    K.chip(g, game + ' · ' + year, X0 + 26, y + 52, 34, { bg: col, col: col === HOT ? CREAM : INK });
    var p = PAIRS[pairIdx];
    /* the pair's label lands on our own match card before the footage and stays through it */
    K.chip(g, p.label, X1 - 26, y + 52, 34, { align: 'right', bg: INK, col: p.col });
    if (inPair) {
      CLIP.credit(g, u, X0 + 26, y + CH - 24, '700 22px "Geist Mono", monospace');
    }
  }
  /* own art between pairs: the next match's icon, flat, in our palette */
  function matchArt(g, t, y, i, top) {
    var p = PAIRS[i], cx = MID, cy = y + CH / 2 + 20;
    g.fillStyle = top ? '#241a46' : '#2d1d50'; g.fillRect(X0, y, CW, CH);
    g.save(); g.translate(cx, cy); var s = .9 + .05 * Math.sin(t * 6 + (top ? 0 : 1)); g.scale(s, s);
    g.lineWidth = 8; g.strokeStyle = INK;
    if (p.id === 'sun') { g.fillStyle = ORG; g.beginPath(); g.arc(0, 30, 110, Math.PI, 0); g.fill(); g.stroke(); g.fillStyle = TEAL; g.fillRect(-300, 30, 600, 70); }
    if (p.id === 'pres') { var hs = [150, 230, 190, 280, 170, 210]; g.fillStyle = TEAL; hs.forEach(function (h, j) { g.fillRect(-270 + j * 90, 100 - h, 70, h); g.strokeRect(-270 + j * 90, 100 - h, 70, h); }); }
    if (p.id === 'beach') { g.fillStyle = YEL; g.fillRect(-300, 60, 600, 50); g.fillStyle = HOT; g.beginPath(); g.arc(0, -40, 120, Math.PI, 0); g.fill(); g.stroke(); g.strokeStyle = CREAM; g.beginPath(); g.moveTo(0, -40); g.lineTo(0, 70); g.stroke(); }
    if (p.id === 'water') { g.strokeStyle = TEAL; g.lineWidth = 14; for (var r = 0; r < 3; r++) { g.beginPath(); for (var x = -300; x <= 300; x += 10) g.lineTo(x, -40 + r * 55 + Math.sin(x / 40 + t * 8) * 16); g.stroke(); } }
    if (p.id === 'cops') { var on = Math.floor(t * 8) % 2; g.fillStyle = on ? HOT : TEAL; rr(g, -150, -70, 140, 120, 20); g.fill(); g.stroke(); g.fillStyle = on ? TEAL : HOT; rr(g, 10, -70, 140, 120, 20); g.fill(); g.stroke(); g.fillStyle = INK; g.fillRect(-190, 50, 380, 40); }
    if (p.id === 'sign') { K.sticker(g, top ? 'VINEWOOD' : 'VICE', 0, 0, top ? 96 : 150, { col: CREAM, ink: INK }); }
    g.restore();
  }

  /* ---------- the middle band: hook, captions, match ticks ---------- */
  function hook(g, t) {
    /* frame 0: the question (2 words), already landed; the two years make the answer readable by 1.0 s */
    var o = lastw('hook') - .1;
    K.slam(g, 'SAME TRAILER?', MID, BANDY + 18, 92, t + .4, { col: YEL, rot: -.03, out: o + .4 });
  }
  function ticks(g, t) {
    /* six slots under the bottom card: each fills when its pair lands (goal gradient) */
    var y = BOTY + CH + 92, n = 0;
    for (var i = 0; i < 6; i++) {
      var p = PAIRS[i], x = MID + (i - 2.5) * 140, k = cd(t, p.b, 16);
      g.save(); g.translate(x, y);
      rr(g, -60, -34, 120, 68, 18); g.fillStyle = k > 0 ? p.col : 'rgba(251,240,234,.12)'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
      if (k > 0) { g.scale(lerp(1.6, 1, eo(k)), lerp(1.6, 1, eo(k))); K.sticker(g, '✓', 0, 6, 44, { col: INK, lw: 0, shadow: false }); n++; }
      g.restore();
    }
    K.chip(g, 'MATCHES ' + n + '/6', MID, y + 88, 34, { align: 'center', bg: n === 6 ? HOT : CREAM, col: n === 6 ? CREAM : INK });
  }
  function matchBand(g, t, i) {
    /* between pairs: MATCH! stamp for the pair that just ended */
    var p = PAIRS[i - 1], u = t - p.b; if (!p || u < 0) return;
    g.save(); g.translate(MID, BANDY); g.rotate(-.06); var s = lerp(2, 1, eo(clamp(u / .16, 0, 1))); g.scale(s, s);
    g.lineWidth = 10; g.strokeStyle = YEL; rr(g, -230, -58, 460, 116, 18); g.fillStyle = BG; g.fill(); g.stroke();
    K.sticker(g, 'MATCH!', 0, 4, 76, { col: YEL, ink: BG }); g.restore();
  }

  /* ---------- after the pairs: own graphics ---------- */
  function beatYears(g, t) {
    var k = cd(t, T.years, 12);
    K.slam(g, '12 YEARS APART', MID, 520, 96, t - T.twelve, { col: YEL, wide: false });
    var y = 980, xa = 190, xb = 830, prog = eio(seg(t, T.y11, T.y23 + .3));
    g.save(); g.globalAlpha = k;
    g.lineWidth = 16; g.lineCap = 'round'; g.strokeStyle = 'rgba(251,240,234,.18)'; g.beginPath(); g.moveTo(xa, y); g.lineTo(xb, y); g.stroke();
    g.strokeStyle = HOT; g.beginPath(); g.moveTo(xa, y); g.lineTo(lerp(xa, xb, prog), y); g.stroke();
    for (var yr = 2011; yr <= 2023; yr++) { var x = lerp(xa, xb, (yr - 2011) / 12); g.fillStyle = (lerp(xa, xb, prog) >= x - 1) ? HOT : 'rgba(251,240,234,.3)'; g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill(); }
    g.restore();
    var a = cd(t, T.y11 - .3, 14), b = cd(t, T.y23 - .3, 14);
    if (a > 0) { g.save(); g.translate(xa + 60, y - 170); g.scale(a, a); card(g, -150, -80, 300, 160, CREAM, 24); K.sticker(g, 'GTA 5', 0, -22, 44, { col: INK, lw: 0, shadow: false }); K.sticker(g, 'NOV 2, 2011', 0, 38, 40, { col: HOT, lw: 0, shadow: false, wide: false }); g.restore(); }
    if (b > 0) { g.save(); g.translate(xb - 60, y + 170); g.scale(b, b); card(g, -150, -80, 300, 160, HOT, 24); K.sticker(g, 'GTA 6', 0, -22, 44, { col: CREAM, lw: 0, shadow: false }); K.sticker(g, 'DEC 4, 2023', 0, 38, 40, { col: INK, lw: 0, shadow: false, wide: false }); g.restore(); }
    K.chip(g, 'FIRST TRAILERS · ROCKSTAR GAMES', MID, 1340, 32, { align: 'center', bg: TEAL, col: INK });
    captions(g, t, 1470);
  }
  function beatViews(g, t) {
    var k = cd(t, T.views, 12);
    card(g, 130, lerp(1100, 640, k), 820, 560, '#1f1640', 34);
    var y0 = lerp(1100, 640, k);
    g.fillStyle = HOT; rr(g, 170, y0 + 40, 740, 260, 22); g.fill();
    K.chip(g, 'GTA 6 · TRAILER 1', MID, y0 + 300, 30, { align: 'center', bg: INK, col: CREAM });
    g.fillStyle = CREAM; g.beginPath(); g.moveTo(MID - 40, y0 + 120); g.lineTo(MID + 50, y0 + 170); g.lineTo(MID - 40, y0 + 220); g.closePath(); g.fill();
    if (t > T.views + .1) K.counter(g, 0, 90, MID, y0 + 420, 150, t - (T.views + .1), T.n90 - T.views + .1, { col: YEL, commas: false });
    if (t > T.n90) K.sticker(g, 'MILLION+', MID, y0 + 510, 54, { col: CREAM, wide: false });
    if (t > T.views + .5) K.chip(g, 'VIEWS IN 24 HOURS', MID, y0 + 620, 30, { align: 'center', bg: YEL, col: INK });
    if (t > T.views + .25) K.chip(g, 'YOUTUBE: 93M+ IN 24H', MID, 470, 32, { align: 'center', bg: CREAM, col: INK });
    captions(g, t, 1470);
  }
  function beatEnd(g, t) {
    K.slam(g, 'SAME FORMULA?', MID, 520, 88, t - T.end, { col: CREAM, rot: -.03 });
    function btn(label, sub, y, tt, col, ink) { var k = cd(t, tt - .05, 14); if (k <= 0) return; g.save(); g.translate(MID, y); g.scale(k, k); g.rotate(Math.sin(t * 3 + y) * .025); card(g, -330, -100, 660, 200, col, 40); K.sticker(g, label, 0, -18, 74, { col: ink, lw: 0, shadow: false }); K.sticker(g, sub, 0, 52, 36, { col: ink, lw: 0, shadow: false, wide: false }); g.restore(); }
    btn('GTA 5', 'TRAILER · 2011', 820, at('end', 'formula'), YEL, INK);
    btn('GTA 6', 'TRAILER 1 · 2023', 1070, at('end', 'coincidence'), HOT, CREAM);
    if (t > T.wins - .1) K.popWords(g, ['WHICH', '*WINS?', 'COMMENT'], MID, 1300, 62, t - T.wins + .1, { gap: .1, maxW: 820 });
    captions(g, t, 1470);
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx;
  function pairAt(t) { for (var i = 0; i < 6; i++) { var p = PAIRS[i]; if (t < p.b) return { i: i, inPair: t >= p.a }; if (!p.next || t < p.next) { if (i === 5) return null; return { i: i + 1, inPair: false }; } } return null; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    backdrop(g, t);
    if (t < T.years) {
      var s = pairAt(t), i = s.i, p = PAIRS[i];
      slot(g, t, TOPY, p.uv, '2011', 'GTA 5', CREAM, i, s.inPair, true);
      slot(g, t, BOTY, p.us, '2023', 'GTA 6', HOT, i, s.inPair, false);
      if (t < lastw('hook')) hook(g, t);
      else if (!s.inPair) matchBand(g, t, i);
      else captions(g, t, CAPY);
      ticks(g, t);
    } else if (t < T.views) beatYears(g, t);
    else if (t < T.end) beatViews(g, t);
    else beatEnd(g, t);
    [T.years, T.views, T.end].forEach(function (c) { K.flash(g, W, H, t - c, .3); });
    K.chip(g, 'GTA 6', X0, 200, 40, { bg: HOT, col: CREAM });
    if (t < T.years) K.chip(g, 'FIRST TRAILERS', X1, 200, 36, { align: 'right', bg: CREAM, col: INK });
  }
  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { frame(ctx, t); return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) { frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR)); actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0); }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- readcheck ---------- */
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('pill', 'GTA 6', 0, DUR + 1);
    Tx('hook', 'SAME TRAILER?', 0, lastw('hook') - .3);
    Tx('y11', 'GTA 5 · 2011', 0, T.years);
    Tx('y23', 'GTA 6 · 2023', 0, T.years);
    /* MATCH! is a 0.4 s stamp between pairs (decoration; the MATCHES n/6 chip under the cards carries it and stays up) */
    PAIRS.forEach(function (p, i) { Tx('lab-' + p.id, p.label, i ? PAIRS[i - 1].b + .1 : 0, p.b); });
    Tx('count', 'MATCHES n/6', 0, T.years);
    Tx('twelve', '12 YEARS APART', T.twelve + .1, T.views);
    Tx('d11', 'NOV 2, 2011', T.y11 - .2, T.views);
    Tx('d23', 'DEC 4, 2023', T.y23 - .2, T.views);
    Tx('views', 'VIEWS IN 24 HOURS', T.views + .6, T.end);
    Tx('guin', 'YOUTUBE: 93M+ IN 24H', T.views + .35, T.end);
    Tx('formula', 'SAME FORMULA?', T.end + .1, DUR);
    Tx('wins', 'WHICH WINS?', T.wins + .1, DUR);
    return o;
  }

  function SCORE(ac) { K.score(ac, EV, DUR); }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function init(canvas) {
    canvas.width = W; canvas.height = H; ctx = canvas.getContext('2d');
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 84px Archivo', '600 30px "Geist Mono"', '700 22px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json'), fetch('clips.json').then(function (r) { return r.json(); }).then(function (m) {
      Object.keys(m.clips).forEach(function (n) { CUTLEN[n] = m.clips[n].out - m.clips[n].in; });
    })].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0“”’·✓'); }))).then(function () {
      buildChunks(); initTimes();
      window.FILM.POSTER = (PAIRS[5].a + PAIRS[5].b) / 2;   // VINEWOOD over VICE, the most legible pair
      window.FILM.SHOTS = [{ id: 'pairs', name: 'Six matches', t0: 0, t1: T.years }, { id: 'years', name: '12 years', t0: T.years, t1: T.views }, { id: 'views', name: '90 million', t0: T.views, t1: T.end }, { id: 'vote', name: 'Which wins?', t0: T.end, t1: DUR }];
      window.READY = true;
    });
  }

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: 10, SLUG: 'gta-sametrailer', SHOTS: [], LIVE: {}, init: init, render: render, frame: frame, T: T };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
