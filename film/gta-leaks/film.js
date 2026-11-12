/* "Fixing some leaks": GTA 6, Delta. The first film in trailer mode (SAFE-EDIT rule 7), and the worked example for
   the skill gta-clip-short. A vertical film written in code, narrated first and cut to the voice: every beat is
   keyed to a word time from vo/vo.js (window.VO). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Footage: two muted Trailer 2 excerpts (Rockstar Games), each under 5 s, drawn by film/kit/clip.js from
   clips.json, each annotated (circle, label, freeze and quote). Everything else is our own flat graphics in the
   Vice City palette: 90 leaked-video tiles, a CONFIRMED stamp, a premiere card that leaks, a drawn roof with drips
   and a THEORY stamp, and a two-button vote. No Rockstar logo or key art, no trailer audio, no music. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, K = window.KIT, CLIP = window.CLIP;
  var BG = '#0b0820', CREAM = '#fbf0ea', HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d', INK = '#1d1233', YEL = '#ffd23f';
  var TAU = Math.PI * 2;
  /* the picture card the trailer clips play in; captions sit under it */
  var CX0 = 60, CY0 = 330, CW = 960, CH = 1120, CAPY = 1650;

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function osc(t, k, ph) { return Math.sin(TAU * k * t / DUR + (ph || 0)); }
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

  /* ---------- times ---------- */
  var T = {}, EV = [], U = {};
  function ev(t, type, g, extra) { var e = { t: t, type: type, g: g == null ? 1 : g }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
  function initTimes() {
    EV.length = 0; CLIP.reset();
    T.roofEnd = start('ask') - .12;              // footage run 1: hook + roof line, on the roof clip
    T.ask = start('ask') - .12;                  // own graphics: the drawn house and the question bubble
    T.ansIn = at('answer', 'i\'m') - .2;             // footage run 2: Jason's answer, then a freeze on the line
    T.freeze = at('answer', 'just') - .05;
    T.why = start('why') - .15;                  // own graphics from here to the end
    T.tiles = at('why', 'hacker');
    T.n90 = at('why', '90');
    T.early = at('why', 'early');
    T.conf = start('conf') - .12;
    T.stamp = at('conf', 'confirmed');
    T.t1 = start('t1') - .12;
    T.leak = at('t1', '2023') + .3;
    T.never = start('never') - .12;
    T.theory = at('never', 'never');
    T.end = start('end') - .12;
    T.joke = at('end', 'joke'); T.coin = at('end', 'coincidence');
    T.out = DUR - .45;

    /* clip uses: each under 5 s and annotated; clip.js + clipkit.py lint hold this to SAFE-EDIT rules 3 and 7 */
    U.roof = CLIP.use('roof', 0, T.roofEnd, { speed: 2.08 / T.roofEnd, zoom: [1.06, 1.22], focus: [.36, .42], note: 'circle on Jason, label ON THE ROOF' });
    U.jason = CLIP.use('jason', T.ansIn, T.why, { from: .1, freeze: T.freeze - T.ansIn + .25, zoom: [1.12, 1.3], focus: [.47, .42], note: 'freeze + quote I\'M JUST FIXING SOME LEAKS' });

    ev(.02, 'whoosh', .8); ev(at('hook', 'joke'), 'pop', .9);
    ev(T.ask, 'swish', .9); ev(at('ask', 'asks'), 'pop', .8);
    ev(T.ansIn, 'whoosh', .7); ev(T.freeze + .25, 'shutter', .9);
    ev(T.why, 'swish', .9); ev(T.tiles, 'ratchet', .7, { t1: T.n90 + .1 }); ev(T.n90 + .12, 'slam', .8);
    ev(T.conf, 'whoosh', .6); ev(T.stamp, 'slam', 1);
    ev(T.t1, 'swish', .8); ev(T.leak, 'scratch', .9);
    ev(T.never, 'whoosh', .7); ev(T.theory, 'thud', .9);
    ev(T.end, 'swish', .8); ev(T.joke, 'pop', .9); ev(T.coin, 'pop', .9);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  /* ---------- captions: the spoken words, chunked to at most 4 a card ---------- */
  var CHUNKS = [];
  function buildChunks() {
    var HOTW = { joke: 1, leaks: 1, '90': 1, confirmed: 1, leaked: 1, never: 1, coincidence: 1, roof: 1 };
    VO.lines.forEach(function (l) {
      var cur = [];
      l.words.forEach(function (w, i) {
        cur.push({ w: w.w.replace(/[.,]$/, '').toUpperCase(), t0: w.t0, t1: w.t1, hot: !!HOTW[norm(w.w)] });
        var endP = /[.?!,]$/.test(w.w);
        if (cur.length === 3 || endP || i === l.words.length - 1) { CHUNKS.push(cur); cur = []; }
      });
    });
    CHUNKS.forEach(function (c, i) { c.t0 = c[0].t0 - .05; c.t1 = CHUNKS[i + 1] ? Math.min(CHUNKS[i + 1][0].t0 - .05, c[c.length - 1].t1 + .6) : c[c.length - 1].t1 + .6; });
  }
  function captions(g, t) {
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (t < c.t0 || t >= c.t1) continue;
      /* shrink a long card to fit 940 px rather than let words collide */
      /* one word at a time with a real gap: the sticker outline eats K.caption's own spacing */
      var px = 60, gap = px * .55, ws = c.map(function (w) { return K.measure(g, w.w, px, { wide: false }) * 1.1; });
      var tw = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (c.length - 1), s = Math.min(1, 940 / tw), x = -tw / 2;
      g.save(); g.translate(W / 2, CAPY); g.scale(s, s);
      c.forEach(function (w, j) { K.caption(g, [w], x + ws[j] / 2, 0, px, t, { wide: false }); x += ws[j] + gap; });
      g.restore(); return;
    }
  }

  /* ---------- background: ink with slow diagonal stripes (periodic in DUR) ---------- */
  function backdrop(g, t) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = .07; g.strokeStyle = HOT; g.lineWidth = 34;
    var off = (t / DUR) * 240;
    for (var x = -H; x < W + H; x += 120) { g.beginPath(); g.moveTo(x + off, 0); g.lineTo(x + off - H * .6, H); g.stroke(); }
    g.restore();
    var gr = g.createRadialGradient(W / 2, H * .45, 200, W / 2, H * .45, 1200); gr.addColorStop(0, 'rgba(25,211,197,.10)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  function card(g, x, y, w, h, fill, r) { g.save(); rr(g, x + 8, y + 12, w, h, r || 34); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, x, y, w, h, r || 34); g.fillStyle = fill; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore(); }

  /* ---------- beat 1 + 3: trailer footage in the card ---------- */
  function footage(g, t, u) {
    var pop = cd(t, u.t0, 16), s = lerp(.94, 1, pop);
    g.save(); g.translate(W / 2, CY0 + CH / 2); g.scale(s, s); g.translate(-W / 2, -(CY0 + CH / 2));
    card(g, CX0 - 10, CY0 - 10, CW + 20, CH + 20, CREAM, 40);
    g.save(); rr(g, CX0, CY0, CW, CH, 32); g.clip(); CLIP.draw(g, t, CX0, CY0, CW, CH, u);
    if (u === U.jason && t >= T.freeze + .25) K.freezeFX(g, W, H, t - T.freeze - .25);
    g.restore();
    CLIP.credit(g, u, CX0 + 28, CY0 + CH - 26);
    g.restore();
  }
  function beatRoof(g, t) {
    footage(g, t, U.roof);
    var p = CLIP.toScreen(U.roof, t, .37, .42, CX0, CY0, CW, CH);
    var k = seg(t, at('hook', 'opens'), at('hook', 'opens') + .55);
    K.scribble(g, p[0], p[1], 150, 210, eio(k), HOT, 12, 3);
    if (k > 0) K.chip(g, 'JASON · ON THE ROOF', p[0] - 60, p[1] + 270, 36, { bg: HOT, col: CREAM });
    /* the hook sticker: lands on frame 0 already moving */
    var hk = t - .05;
    K.slam(g, 'TRAILER 2', W / 2, 470, 96, hk, { col: YEL, rot: -.05, out: T.roofEnd - .2 });
    K.popWords(g, ['OPENS', 'WITH', 'A', '*JOKE'], W / 2, 640, 80, t - at('hook', 'opens'), { times: [0, at('hook', 'with') - at('hook', 'opens'), at('hook', 'a') - at('hook', 'opens'), at('hook', 'joke') - at('hook', 'opens')], out: T.roofEnd - .2 - at('hook', 'opens') });
  }
  /* Jason's line on a yellow card with paint-drip leaks; `low` = 1 moves it down under the WHY question */
  function quoteLine(g, t, low) {
    g.save(); g.translate(0, low ? 40 : 0);
    card(g, 90, 1160, 900, 210, YEL, 26);
    K.popWords(g, ['“I’M', 'JUST', 'FIXING'], W / 2, 1220, 64, t - T.freeze, { col: INK, ink: CREAM, lw: 0, shadow: false, gap: .1 });
    K.popWords(g, ['SOME', '*LEAKS.”'], W / 2, 1310, 72, t - at('answer', 'some'), { col: INK, hot: HOT, ink: CREAM, lw: 0, shadow: false, gap: .14 });
    for (var i = 0; i < 4; i++) { var d = seg(t, at('answer', 'leaks') + i * .18, at('answer', 'leaks') + i * .18 + .7); if (d > 0) { g.fillStyle = TEAL; g.beginPath(); g.ellipse(560 + i * 60, 1370 + eio(d) * (90 + i * 30), 10, 16, 0, 0, TAU); g.fill(); } }
    g.restore();
  }
  function beatAnswer(g, t) {
    footage(g, t, U.jason);
    var u = t - T.freeze - .25;
    if (u > 0) {
      /* the quote, word by word on the freeze, with paint-drip leaks off the last word */
      quoteLine(g, t, 0);
    } else {
      K.chip(g, 'HIS ANSWER', W / 2, CY0 + 70, 38, { align: 'center', bg: TEAL, col: INK });
    }
  }

  /* ---------- beat 2 (own): a drawn house, a ladder, the question from below ---------- */
  function house(g, t, x, y, s, drips) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = TEAL; g.fillRect(-260, -40, 520, 300); g.lineWidth = 8; g.strokeStyle = INK; g.strokeRect(-260, -40, 520, 300);
    g.fillStyle = '#123a4a'; for (var i = -1; i <= 1; i += 2) { g.fillRect(i * 140 - 50, 30, 100, 90); g.strokeRect(i * 140 - 50, 30, 100, 90); }
    g.fillStyle = ORG; g.fillRect(-40, 120, 80, 140); g.strokeRect(-40, 120, 80, 140);
    g.fillStyle = '#3a2a4a'; g.beginPath(); g.moveTo(-300, -40); g.lineTo(300, -40); g.lineTo(240, -110); g.lineTo(-240, -110); g.closePath(); g.fill(); g.stroke();
    /* ladder */
    g.strokeStyle = YEL; g.lineWidth = 10; g.beginPath(); g.moveTo(170, 260); g.lineTo(230, -110); g.moveTo(220, 260); g.lineTo(280, -110); g.stroke();
    g.lineWidth = 7; for (var r = 0; r < 7; r++) { var yy = 230 - r * 52, xx = 175 + (230 - yy) / 370 * 60; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 50, yy); g.stroke(); }
    /* the man on the roof, as a flat silhouette with a hammer that taps */
    var tap = Math.sin(t * 9) * .3;
    g.fillStyle = INK; g.beginPath(); g.arc(60, -190, 26, 0, TAU); g.fill();
    g.fillRect(40, -165, 40, 60); g.save(); g.translate(80, -150); g.rotate(-.6 + tap); g.fillRect(0, -6, 60, 12); g.fillStyle = ORG; g.fillRect(52, -18, 16, 36); g.restore();
    if (drips) for (var d = 0; d < 6; d++) { var ph = ((t * .9 + d * .37) % 1); g.fillStyle = TEAL; g.globalAlpha = 1 - ph; g.beginPath(); g.ellipse(-220 + d * 80, -40 + ph * 300, 9, 14, 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
    g.restore();
  }
  function beatAsk(g, t) {
    var k = cd(t, T.ask, 12);
    house(g, t, W / 2, lerp(1300, 1020, k), 1.25, false);
    /* the man below and his speech bubble */
    var bk = cd(t, at('ask', 'asks') - .1, 13);
    if (bk > 0) {
      g.save(); g.translate(W / 2, 700); g.scale(bk, bk);
      card(g, -400, -130, 800, 240, CREAM, 40);
      g.fillStyle = CREAM; g.beginPath(); g.moveTo(-200, 108); g.lineTo(-260, 220); g.lineTo(-120, 108); g.fill();
      K.sticker(g, '“WHAT YOU DOING', 0, -50, 62, { col: INK, lw: 0, shadow: false });
      K.sticker(g, 'UP THERE?”', 0, 35, 72, { col: HOT, lw: 0, shadow: false });
      g.restore();
    }
    K.chip(g, 'TRAILER 2 · REDRAWN', W / 2, 420, 36, { align: 'center', bg: TEAL, col: INK });
  }

  /* ---------- beat 4 (own): 90 leaked video tiles + counter ---------- */
  function tile(g, x, y, s, col) { rr(g, x - 40 * s, y - 28 * s, 80 * s, 56 * s, 10 * s); g.fillStyle = col; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); g.fillStyle = CREAM; g.beginPath(); g.moveTo(x - 9 * s, y - 13 * s); g.lineTo(x + 15 * s, y); g.lineTo(x - 9 * s, y + 13 * s); g.closePath(); g.fill(); }
  function quoteCard(g, t) {
    var k = cd(t, T.early - .05, 14); if (k <= 0) return;
    g.save(); g.translate(W / 2, 1345); g.scale(k, k);
    card(g, -450, -95, 900, 190, CREAM, 26);
    K.sticker(g, '“EARLY DEVELOPMENT FOOTAGE”', 0, -25, 50, { col: INK, lw: 0, shadow: false, wt: 800, wide: false });
    K.chip(g, 'ROCKSTAR · SEPT 19, 2022', 0, 45, 30, { align: 'center', bg: INK, col: CREAM });
    g.restore();
  }
  function beatWhy(g, t) {
    var shrink = seg(t, T.conf, T.conf + .5), cols = [HOT, TEAL, ORG];
    for (var i = 0; i < 90; i++) {
      var c = i % 9, r = Math.floor(i / 9), ti = lerp(T.tiles, T.n90, i / 89), k = cd(t, ti, 18);
      if (k <= 0) continue;
      var x = 120 + c * 105, y = 610 + r * 62 + Math.sin(t * 2 + i) * 3;
      var s = k * lerp(.9, .6, eio(shrink));
      tile(g, lerp(x, W / 2 + (c - 4) * 60, eio(shrink)), lerp(y, 1000 + (r - 4.5) * 36, eio(shrink)), s, cols[(i * 7) % 3]);
    }
    if (t < T.conf + .3) {
      K.counter(g, 0, 90, W / 2, 440, 130, t - (T.tiles - .1), T.n90 - T.tiles + .1, { col: YEL, commas: false });
      if (t > T.n90) K.chip(g, 'LEAKED VIDEOS', W / 2, 545, 36, { align: 'center', bg: HOT, col: CREAM });
    }
    if (t >= at('why', 'in')) K.chip(g, 'SEPT 2022', W / 2, 290, 40, { align: 'center', bg: ORG, col: INK });
    if (t < T.tiles) { K.slam(g, 'WHY IS THAT', W / 2, 760, 90, t - T.why, { col: CREAM }); K.slam(g, 'FUNNY?', W / 2, 880, 110, t - at('why', 'funny'), { col: HOT }); }
    /* Jason's line stays up under the question, so it can be read */
    if (t < T.tiles) quoteLine(g, t, 1);
    quoteCard(g, t);
  }
  /* ---------- beat 5 (own): CONFIRMED stamp + Rockstar's words ---------- */
  function beatConf(g, t) {
    beatWhy(g, t);
    var k = t - T.stamp;
    if (k > 0) {
      g.save(); g.translate(W / 2, 640); g.rotate(-.12); var s = lerp(2.4, 1, eo(clamp(k / .16, 0, 1))); g.scale(s, s); g.globalAlpha = clamp(k / .06, 0, 1);
      g.lineWidth = 12; g.strokeStyle = HOT; rr(g, -380, -90, 760, 180, 20); g.stroke();
      K.sticker(g, 'CONFIRMED', 0, 4, 120, { col: HOT, ink: BG }); g.restore();
    }
  }
  /* ---------- beat 6 (own): Trailer 1's premiere card leaks ---------- */
  function beatT1(g, t) {
    var k = cd(t, T.t1, 12), y = lerp(1400, 900, k);
    card(g, 120, y - 330, 840, 560, '#1f1640', 36);
    g.fillStyle = HOT; rr(g, 160, y - 290, 760, 360, 22); g.fill();
    g.fillStyle = CREAM; g.beginPath(); g.moveTo(500, y - 170); g.lineTo(600, y - 110); g.lineTo(500, y - 50); g.closePath(); g.fill();
    K.sticker(g, 'TRAILER 1', W / 2, y + 130, 76, { col: CREAM });
    K.chip(g, 'PREMIERE · DEC 2023', W / 2, y + 205, 34, { align: 'center', bg: TEAL, col: INK });
    var lk = t - T.leak;
    if (lk > 0) {
      K.slam(g, 'LEAKED!', W / 2, y - 110, 100, lk, { col: YEL, rot: -.1 });
      K.chip(g, 'ROCKSTAR: “OUR TRAILER HAS LEAKED”', W / 2, 400, 30, { align: 'center', bg: CREAM, col: INK });
    }
  }
  /* ---------- beat 7 (own): the roof again, drawn, dripping; THEORY ---------- */
  function beatNever(g, t) {
    house(g, t, W / 2, 1030, 1.3, true);
    var k = t - T.theory;
    if (k > 0) {
      g.save(); g.translate(W / 2, 560); g.rotate(.08); var s = lerp(2.2, 1, eo(clamp(k / .16, 0, 1))); g.scale(s, s);
      g.lineWidth = 12; g.strokeStyle = ORG; rr(g, -300, -80, 600, 160, 18); g.stroke(); K.sticker(g, 'THEORY', 0, 4, 110, { col: ORG, ink: BG }); g.restore();
    }
    K.chip(g, 'UNCONFIRMED', W / 2, 400, 40, { align: 'center', bg: CREAM, col: INK });
  }
  /* ---------- beat 8 (own): vote ---------- */
  function beatEnd(g, t) {
    function btn(label, x, y, tt, col) { var k = cd(t, tt - .05, 14); if (k <= 0) return; g.save(); g.translate(x, y); g.scale(k, k); g.rotate(Math.sin(t * 3 + x) * .03); card(g, -320, -95, 640, 190, col, 40); K.sticker(g, label, 0, 4, label.length > 6 ? 70 : 96, { col: INK, lw: 0, shadow: false, wide: label.length <= 6 }); g.restore(); }
    btn('JOKE', W / 2, 720, T.joke, YEL);
    btn('COINCIDENCE', W / 2, 960, T.coin, TEAL);
    if (t > at('end', 'one')) K.popWords(g, ['ONE', '*WORD', 'IN', 'THE', 'COMMENTS'], W / 2, 1220, 54, t - at('end', 'one'), { gap: .08, maxW: 900 });
    K.chip(g, 'GTA 6 · NOV 19, 2026', W / 2, 420, 36, { align: 'center', bg: HOT, col: CREAM });
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    backdrop(g, t);
    if (t < T.roofEnd) beatRoof(g, t);
    else if (t < T.ansIn) beatAsk(g, t);
    else if (t < T.why) beatAnswer(g, t);
    else if (t < T.conf) beatWhy(g, t);
    else if (t < T.t1) beatConf(g, t);
    else if (t < T.never) beatT1(g, t);
    else if (t < T.end) beatNever(g, t);
    else beatEnd(g, t);
    /* whip-flash on every cut so the change reads as a move, not a jump */
    [T.roofEnd, T.ansIn, T.why, T.t1, T.never, T.end].forEach(function (c) { K.flash(g, W, H, t - c, .35); });
    /* persistent chrome */
    K.chip(g, 'GTA 6', 60, 200, 40, { bg: HOT, col: CREAM });
    if (CLIP.active(t)) K.chip(g, 'TRAILER 2', W - 60, 200, 36, { align: 'right', bg: CREAM, col: INK });
    captions(g, t);
    /* the last half second dips toward frame 0 so the loop reads */
    var o = seg(t, T.out, DUR); if (o > 0) { g.globalAlpha = eio(o) * .9; g.fillStyle = BG; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  }
  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { frame(ctx, t); return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) { frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR)); actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0); }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- readcheck: every text and how long it is up ---------- */
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('pill', 'GTA 6', 0, DUR + 1);
    Tx('hook1', 'TRAILER 2', .15, T.roofEnd - .2);
    Tx('hook2', 'OPENS WITH A JOKE', at('hook', 'opens') + .1, T.roofEnd - .2);
    Tx('roofchip', 'JASON · ON THE ROOF', at('hook', 'opens') + .3, T.roofEnd);
    Tx('bubble', 'WHAT YOU DOING UP THERE?', at('ask', 'asks') - .1, T.ansIn);
    Tx('quote', 'I’M JUST FIXING SOME LEAKS', at('answer', 'some') + .2, T.tiles);
    Tx('sept', 'SEPT 2022', at('why', 'in') + .1, T.t1);
    Tx('leakedv', 'LEAKED VIDEOS', T.n90 + .05, T.conf + .3);
    Tx('confq', 'EARLY DEVELOPMENT FOOTAGE', T.early + .1, T.t1);
    Tx('t1', 'LEAKED!', T.leak + .05, T.never);
    Tx('theory', 'THEORY', T.theory + .1, T.end);
    Tx('never', 'UNCONFIRMED', T.never + .1, T.end);
    Tx('joke', 'JOKE', T.joke, DUR);
    Tx('coin', 'COINCIDENCE', T.coin, DUR);
    return o;
  }

  function SCORE(ac) { K.score(ac, EV, DUR); }

  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function init(canvas) {
    canvas.width = W; canvas.height = H; ctx = canvas.getContext('2d');
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    var fonts = ['900 84px Archivo', '800 84px Archivo', '600 30px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0“”’·'); }))).then(function () {
      buildChunks(); initTimes();
      window.FILM.POSTER = T.freeze + 1.2;
      window.FILM.SHOTS = [{ id: 'roof', name: 'The roof', t0: 0, t1: T.why }, { id: 'leaks', name: 'The leaks', t0: T.why, t1: T.never }, { id: 'theory', name: 'Joke?', t0: T.never, t1: DUR }];
      window.READY = true;
    });
  }

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: 9, SLUG: 'gta-leaks', SHOTS: [], LIVE: {}, init: init, render: render, frame: frame, T: T };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
