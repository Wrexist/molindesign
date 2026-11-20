/* "Same trailer, 12 years apart": GTA 6, Delta. SLUG: 'gta-sametrailer'   (r3 rebuild, 2026-11-20)
   GTA 5's first trailer (Rockstar Games, Nov 2 2011) and GTA 6's first trailer (Rockstar Games, Dec 4 2023) stacked
   beat for beat: sunset, beach, ROCKSTAR GAMES PRESENTS over the skyline, a vehicle across the water, the cops, a giant
   city sign. Then our own graphics: Trailer 1's 93 million views in a day, and the vote. ~21.7 s, loops.
   A vertical film written in code, narrated first and cut to the voice: every beat is keyed to a word time from
   vo/vo.js (window.VO). Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Footage: 12 muted excerpts (+2 at the loop seam) drawn by film/kit/clip.js from clips.json, each under 5 s with a
   label, and between every pair an own typographic card so no stretch of footage runs over 5 s (clipkit.py lint).
   No Rockstar logo or key art, no trailer audio, no music, no end fade. Every element inside x 90-930 except the
   opening/loop slide, where the two cards enter from opposite sides. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, K = window.KIT, CLIP = window.CLIP;
  var BG = '#0b0820', CREAM = '#fbf0ea', HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d', INK = '#1d1233', YEL = '#ffd23f';
  var TAU = Math.PI * 2;
  var X0 = 110, X1 = 910, MID = 510, CW = 800, CH = 500, TOPY = 230, BOTY = 880, BANDY = 805, LOWY = 1380;
  var SLIDE = 170;          // opening/loop slide distance, px

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
  /* runtime: end .4 s after the last word ("wins?"), then a .45 s loop seam */
  var DUR = VO.dur;   // script.json dur = last word ("wins?") + .4 s + .45 s loop seam

  /* ---------- the six matches ---------- */
  var PAIRS = [
    { id: 'sun', v: 'vsun', s: 'ssun', label: 'SUNSET', col: ORG },
    { id: 'beach', v: 'vpier', s: 'sbeach', label: 'BEACH', col: YEL },
    { id: 'pres', v: 'vpres', s: 'spres', label: 'SKYLINE', col: TEAL },
    { id: 'water', v: 'vski', s: 'sboat', label: 'WATER', col: TEAL },
    { id: 'cops', v: 'vcops', s: 'scops', label: 'COPS', col: HOT },
    { id: 'sign', v: 'vsign', s: 'ssign', label: 'BIG SIGN', col: ORG }
  ];
  var NOTE = {
    sun: 'label SUNSET on both + match counter 1/6',
    beach: 'label BEACH on both + counter 2/6',
    pres: 'label SKYLINE, both show ROCKSTAR GAMES PRESENTS over the city + counter 3/6',
    water: 'label WATER on both (jet ski / speedboat) + counter 4/6',
    cops: 'label COPS on both; GTA 6 side is the police bodycam, POLICE vest in frame + counter 5/6',
    sign: 'label BIG SIGN, VINEWOOD vs VICE called out + counter 6/6'
  };
  /* per-pair clip options: GTA 6 bodycam starts .45 s in so the POLICE vest is on screen the whole use */
  var OPT = { scops: { from: .45, focus: [.5, .38] } };

  /* ---------- times ---------- */
  var T = {}, EV = [], U = {};
  function ev(t, type, g, extra) { var e = { t: t, type: type, g: g == null ? 1 : g }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
  function initTimes() {
    EV.length = 0; CLIP.reset();
    T.vice = start('vice');
    /* pair spans: footage [a, b); between pairs an own typographic card [b, next a) */
    var spans = [
      [0, at('sun', 'sunset') + .22],
      [start('beach') + .1, lastw('beach') + .45],
      [start('pres') + .15, lastw('pres') - .2],
      [start('water') + .1, lastw('water') + .03],
      [start('cops') + .1, lastw('cops') + .48],
      [at('sign', 'vinewood') - .2, T.vice + .6]
    ];
    PAIRS.forEach(function (p, i) {
      var a = spans[i][0], b = spans[i][1], d = b - a;
      function u(name, top) {
        var o = OPT[name] || {}, from = o.from || 0;
        return CLIP.use(name, a, b, { from: from, speed: Math.min(1, (CUTLEN[name] - from) / d * .98),
          zoom: i === 0 ? [1.0, 1.45] : i === 5 ? [1.02, 1.32] : [1.04, 1.18],
          focus: o.focus || (i === 0 ? (top ? [.62, .4] : [.4, .55]) : [.5, .5]),
          note: (top ? 'GTA 5 card: ' : 'GTA 6 card: ') + NOTE[p.id] });
      }
      p.a = a; p.b = b; p.next = spans[i + 1] ? spans[i + 1][0] : null;
      p.uv = u(p.v, true); p.us = u(p.s, false);
      if (i) { ev(a, 'swish', .7); ev(a + .2, 'pop', .7); }
      /* the MATCH! stamp and the tick land on the pair that is playing (the last one on "Vice") */
      p.hit = i === 5 ? T.vice : b - .38;
      ev(p.hit, 'tick', .7); ev(p.hit + .03, 'slam', i === 5 ? 1.3 : .75);
    });
    T.after = PAIRS[5].b;
    /* loop seam: the cards fly back in from off-screen to the frame-0 offset, under SAME TRAILER? */
    T.loop = DUR - .45;
    U.lv = CLIP.use('vsun', T.loop, DUR, { from: 0, freeze: 0, zoom: [1, 1], focus: [.62, .4], note: 'loop seam: the frame-0 GTA 5 sunset returns under SAME TRAILER?' });
    U.ls = CLIP.use('ssun', T.loop, DUR, { from: 0, freeze: 0, zoom: [1, 1], focus: [.4, .55], note: 'loop seam: the frame-0 GTA 6 sunset returns under SAME TRAILER?' });
    ev(T.loop - .05, 'whoosh', .9);
    T.twelve = at('hook', 'twelve');
    T.views = T.after; T.n93 = at('views', '93'); T.day = at('views', 'day'); T.drew = T.views + .15;
    T.end = start('end') - .15; T.formula = at('end', 'formula'); T.coin = at('end', 'coincidence'); T.which = at('end', 'which'); T.wins = at('end', 'wins');
    ev(.02, 'whoosh', .8); ev(.3, 'slam', .8); ev(T.twelve, 'pop', .7);
    ev(T.views, 'whoosh', .8); ev(T.drew, 'ratchet', .7, { t1: T.n93 + .05 }); ev(T.n93 + .05, 'slam', .9); ev(T.day, 'pop', .8);
    ev(T.end, 'swish', .8); ev(T.formula, 'pop', .8); ev(T.coin, 'pop', .8); ev(T.which - .1, 'zip', .7); ev(T.wins, 'thud', .7);
    EV.sort(function (a, b) { return a.t - b.t; });
  }
  var CUTLEN = {};

  /* ---------- captions: the spoken words, up to 3 a card ---------- */
  var CHUNKS = [];
  function buildChunks() {
    var HOTW = { sunset: 1, beach: 1, skyline: 1, water: 1, cops: 1, vinewood: 1, vice: 1, '93': 1, day: 1, coincidence: 1, wins: 1 };
    VO.lines.forEach(function (l) {
      var cur = [];
      l.words.forEach(function (w, i) {
        cur.push({ w: w.w.replace(/[.,:!]$/, '').toUpperCase(), t0: w.t0, t1: w.t1, hot: !!HOTW[norm(w.w)] });
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

  /* ---------- background: slow diagonal stripes + a drifting ghost word ---------- */
  function backdrop(g, t) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = .06; g.strokeStyle = HOT; g.lineWidth = 34;
    var off = (t / DUR) * 240;
    for (var x = -H; x < W + H; x += 120) { g.beginPath(); g.moveTo(x + off, 0); g.lineTo(x + off - H * .6, H); g.stroke(); }
    g.restore();
  }
  function card(g, x, y, w, h, fill, r) { g.save(); rr(g, x + 8, y + 12, w, h, r || 30); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, x, y, w, h, r || 30); g.fillStyle = fill; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore(); }

  /* ---------- the two cards: footage during a pair, our own typographic card between pairs ---------- */
  function chromeA(t) { return t >= T.loop ? 0 : seg(t, T.twelve - .1, T.twelve + .2); }
  /* horizontal slide: the opening eases the cards in from opposite sides; the loop seam brings them back to that offset */
  function slideX(t, top) {
    var d = top ? 1 : -1;
    if (t >= T.loop) return d * lerp(1100, SLIDE, eo(seg(t, T.loop, DUR)));
    return d * SLIDE * (1 - eio(seg(t, 0, .9)));
  }
  function slot(g, t, y, u, year, game, col, pairIdx, inPair, top) {
    var pk = pairIdx === 5 && inPair ? 1 + .03 * eo(seg(t, T.vice, T.vice + .2)) - .03 * seg(t, T.vice + .2, T.after) : 1;
    var sh = pairIdx === 5 && inPair ? 7 * Math.exp(-(t - T.vice) * 9) * Math.sin((t - T.vice) * 70) * (t > T.vice ? 1 : 0) : 0;
    g.save(); g.translate(slideX(t, top) + sh, 0);
    g.translate(MID, y + CH / 2); g.scale(pk, pk); g.translate(-MID, -(y + CH / 2));
    card(g, X0, y, CW, CH, CREAM, 30);
    g.save(); rr(g, X0 + 8, y + 8, CW - 16, CH - 16, 24); g.clip();
    if (inPair) CLIP.draw(g, t, X0 + 8, y + 8, CW - 16, CH - 16, u);
    else typeCard(g, t, y, pairIdx, top);
    g.restore();
    /* chips in a row along the top-left (the bodycam timestamp at the top right stays clear) */
    var x = X0 + 24, w = K.chip(g, year, x, y + 50, 34, { bg: col, col: col === HOT ? CREAM : INK });
    g.save(); g.globalAlpha *= chromeA(t); x += w + 12; w = K.chip(g, game, x, y + 50, 34, { bg: INK, col: CREAM });
    if (t >= 1.0 || t >= T.loop) { var p = PAIRS[pairIdx]; K.chip(g, p.label, x + w + 12, y + 50, 34, { bg: p.col, col: INK }); }
    g.restore();
    if (inPair) CLIP.credit(g, u, X0 + 26, y + CH - 24, '700 22px "Geist Mono", monospace');
    g.restore();
  }
  /* own card between pairs: the number on top, the word below (never the same words twice); the sign pair previews its two words */
  function typeCard(g, t, y, i, top) {
    var p = PAIRS[i], cx = MID, cy = y + CH / 2 + 8, k = cd(t, PAIRS[i - 1] ? PAIRS[i - 1].b : 0, 14);
    g.fillStyle = top ? '#241a46' : '#2d1d50'; g.fillRect(X0, y, CW, CH);
    g.save(); g.translate(cx + (top ? -1 : 1) * 40 * (1 - k), cy); g.rotate((top ? -.03 : .03) + Math.sin(t * 2.2) * .01);
    var s = lerp(.8, 1, k) * (1 + .015 * Math.sin(t * 4)); g.scale(s, s);
    if (p.id === 'sign') K.sticker(g, top ? 'VINEWOOD?' : 'VICE?', 0, 0, top ? 92 : 140, { col: CREAM, ink: INK });
    else if (top) K.sticker(g, '#' + (i + 1), 0, 0, 220, { col: p.col, ink: INK });
    else K.sticker(g, p.label, 0, 0, 120, { col: CREAM, ink: INK, wide: false });
    g.restore();
  }

  /* ---------- the middle band: hook, captions, MATCH! stamps, ticks ---------- */
  function hook(g, t) {
    /* frame 0: SAME TRAILER? between the two sunsets, with only the two years on the cards */
    var loop = t >= T.loop, lt = loop ? 5 : t + .4;
    g.save(); g.translate(MID, BANDY + 6); if (!loop) g.rotate(.02 * Math.sin(t * 5));
    K.slam(g, 'SAME TRAILER?', 0, 0, 80, lt, loop ? { col: YEL, rot: -.03, wide: false } : { col: YEL, rot: -.03, out: start('sun') + .15, wide: false });
    g.restore();
  }
  function nHits(t) { var n = 0; PAIRS.forEach(function (p) { if (t >= p.hit) n++; }); return n; }
  function ticks(g, t) {
    var y = BOTY + CH + 52;
    g.save(); g.globalAlpha *= chromeA(t);
    for (var i = 0; i < 6; i++) {
      var p = PAIRS[i], x = MID + (i - 2.5) * 136, k = cd(t, p.hit, 16);
      g.save(); g.translate(x, y);
      rr(g, -58, -24, 116, 48, 16); g.fillStyle = k > 0 ? p.col : 'rgba(251,240,234,.12)'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
      if (k > 0) { g.scale(lerp(1.6, 1, eo(k)), lerp(1.6, 1, eo(k))); K.sticker(g, '✓', 0, 5, 36, { col: INK, lw: 0, shadow: false }); }
      g.restore();
    }
    g.restore();
  }
  function stamp(g, t) {
    for (var i = 0; i < 6; i++) {
      var p = PAIRS[i], u = t - p.hit; if (u < 0 || u > .7) continue;
      g.save(); g.translate(MID, BANDY); g.rotate(-.06); var s = lerp(i === 5 ? 2.4 : 2, 1, eo(clamp(u / .16, 0, 1))); g.scale(s, s);
      var hw = i === 5 ? 230 : 190;
      g.lineWidth = 10; g.strokeStyle = YEL; rr(g, -hw, -54, hw * 2, 108, 18); g.fillStyle = i === 5 ? HOT : BG; g.fill(); g.stroke();
      K.sticker(g, i === 5 ? '6/6 MATCH!' : 'MATCH!', 0, 4, i === 5 ? 60 : 68, { col: i === 5 ? CREAM : YEL, ink: BG }); g.restore();
      return true;
    }
    return false;
  }

  /* ---------- after the pairs: our own graphics, always moving ---------- */
  function rays(g, t, cx, cy, col, a) {
    g.save(); g.globalAlpha = a; g.translate(cx, cy); g.rotate(t * .35); g.fillStyle = col;
    for (var i = 0; i < 14; i++) { g.rotate(TAU / 14); g.beginPath(); g.moveTo(0, 0); g.lineTo(1400, -110); g.lineTo(1400, 110); g.closePath(); g.fill(); }
    g.restore();
  }
  function beatViews(g, t) {
    var u = t - T.views, k = cd(t, T.views, 12), cy = 860;
    rays(g, t, MID, cy, HOT, .07 * k);
    /* ghost VICE drifting behind, the word we just landed on */
    g.save(); g.globalAlpha = .1 * k; K.sticker(g, 'VICE', MID - 60 + u * 22, 430, 300, { col: CREAM, lw: 0, shadow: false }); g.restore();
    K.chip(g, 'GTA 6 · TRAILER 1 · DEC 2023', MID, 560, 32, { align: 'center', bg: CREAM, col: INK });
    /* ring that fills as the counter climbs */
    var prog = eio(seg(t, T.drew, T.n93 + .05));
    g.save(); g.translate(MID, cy); g.scale(lerp(.6, 1, k), lerp(.6, 1, k));
    g.lineWidth = 34; g.lineCap = 'round'; g.strokeStyle = 'rgba(251,240,234,.12)'; g.beginPath(); g.arc(0, 0, 250, 0, TAU); g.stroke();
    g.strokeStyle = YEL; g.beginPath(); g.arc(0, 0, 250, -Math.PI / 2, -Math.PI / 2 + TAU * prog); g.stroke();
    g.restore();
    if (t > T.drew) K.counter(g, 0, 93, MID, cy + 10, 190, t - T.drew, T.n93 + .05 - T.drew, { col: YEL, commas: false });
    var m = cd(t, T.n93, 14);
    if (m > 0) { g.save(); g.translate(MID, cy + 340); g.scale(m, m); K.sticker(g, 'MILLION+ VIEWS', 0, 0, 64, { col: CREAM, wide: false }); g.restore(); }
    var d = cd(t, T.n93, 14);
    if (d > 0) { g.save(); g.translate(MID, 1290); g.scale(d, d); g.rotate(-.03); K.chip(g, 'IN 24 HOURS', 0, 0, 44, { align: 'center', bg: HOT, col: CREAM }); g.restore(); }
    captions(g, t, LOWY);
  }
  function beatEnd(g, t) {
    var u = t - T.end;
    rays(g, t, MID, 900, TEAL, .05);
    K.slam(g, 'SAME FORMULA?', MID, 470, 66, u, { col: CREAM, rot: -.03, wide: false });
    if (t > T.coin - .05) K.slam(g, 'OR COINCIDENCE?', MID, 560, 44, t - T.coin + .05, { col: YEL, rot: .02, wide: false });
    /* the two sides slide in from opposite edges on "formula" and keep bobbing; "which" sets them pulsing */
    function side(label, sub, y, tt, col, ink, dir) {
      var k = eo(seg(t, tt - .05, tt + .35)); if (k <= 0) return;
      var pulse = t > T.which ? 1 + .05 * Math.max(0, Math.sin((t - T.which) * 9 + (dir > 0 ? 0 : Math.PI))) : 1;
      g.save(); g.translate(MID + dir * 700 * (1 - k), y + Math.sin(t * 3 + y) * 8); g.scale(pulse, pulse); g.rotate(dir * .02);
      card(g, -320, -105, 640, 210, col, 40);
      K.sticker(g, label, 0, -22, 80, { col: ink, lw: 0, shadow: false });
      K.sticker(g, sub, 0, 52, 34, { col: ink, lw: 0, shadow: false, wide: false });
      g.restore();
    }
    side('GTA 5', 'TRAILER · 2011', 780, T.formula, YEL, INK, -1);
    var vs = cd(t, T.formula + .2, 12);
    if (vs > 0) { g.save(); g.translate(MID, 925); g.scale(vs, vs); g.rotate(Math.sin(t * 4) * .06); K.sticker(g, 'VS', 0, 0, 64, { col: HOT, ink: INK }); g.restore(); }
    side('GTA 6', 'TRAILER 1 · 2023', 1070, T.formula + .15, HOT, CREAM, 1);
    captions(g, t, LOWY);
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx;
  function pairAt(t) { for (var i = 0; i < 6; i++) { var p = PAIRS[i]; if (t < p.b) return { i: i, inPair: t >= p.a }; if (!p.next || t < p.next) { if (i === 5) return null; return { i: i + 1, inPair: false }; } } return null; }
  function pairsView(g, t, loop) {
    var s = loop ? { i: 0, inPair: true } : pairAt(t), i = s.i, p = PAIRS[i];
    slot(g, t, TOPY, loop ? U.lv : p.uv, '2011', 'GTA 5', CREAM, i, s.inPair, true);
    slot(g, t, BOTY, loop ? U.ls : p.us, '2023', 'GTA 6', HOT, i, s.inPair, false);
    if (loop || t < start('sun') + .15) hook(g, t);
    else if (!stamp(g, t)) captions(g, t, BANDY);
    if (!loop) ticks(g, t);
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    backdrop(g, t);
    if (t < T.after) pairsView(g, t, false);
    else if (t < T.end) beatViews(g, t);
    else if (t < T.loop) beatEnd(g, t);
    else pairsView(g, t, true);
    K.flash(g, W, H, t - T.after, .3);
    var ca = t < T.after ? chromeA(t) : (t >= T.loop ? 0 : 1);
    g.save(); g.globalAlpha = ca; K.chip(g, 'GTA 6', X0, 150, 40, { bg: HOT, col: CREAM });
    if (t < T.after) K.chip(g, 'MATCHES ' + nHits(t) + '/6', X1, 150, 36, { align: 'right', bg: nHits(t) === 6 ? HOT : CREAM, col: nHits(t) === 6 ? CREAM : INK });
    g.restore();
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
    Tx('pill', 'GTA 6', T.twelve + .2, T.loop);
    Tx('hook', 'SAME TRAILER?', 0, start('sun') + .15);
    Tx('y11', '2011', 0, T.after);
    Tx('y23', '2023', 0, T.after);
    /* the card label chip (SUNSET, BEACH …) shows from the card before its footage until the footage ends */
    PAIRS.forEach(function (p, i) { Tx('lab-' + p.id, p.label, i ? PAIRS[i - 1].b + .05 : 1.05, p.b); });
    Tx('count', 'MATCHES n/6', T.twelve + .2, T.after);
    Tx('tag', 'GTA 6 · TRAILER 1 · DEC 2023', T.views + .05, T.end);
    Tx('views', 'IN 24 HOURS', T.n93 + .05, T.end);
    Tx('formula', 'SAME FORMULA?', T.end + .1, T.loop);
    Tx('sides', 'GTA 5 VS GTA 6', T.formula + .3, T.loop);
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
      window.FILM.POSTER = T.vice + .5;   // VINEWOOD over VICE at 6/6
      window.FILM.SHOTS = [{ id: 'pairs', name: 'Six matches', t0: 0, t1: T.after }, { id: 'views', name: '93 million', t0: T.after, t1: T.end }, { id: 'vote', name: 'Which wins?', t0: T.end, t1: T.loop }, { id: 'loop', name: 'Loop', t0: T.loop, t1: DUR }];
      window.READY = true;
    });
  }

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: 10, SLUG: 'gta-sametrailer', SHOTS: [], LIVE: {}, init: init, render: render, frame: frame, T: T };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
