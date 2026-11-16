/* "Fixing some leaks": GTA 6, Delta. The first film in trailer mode (SAFE-EDIT rule 7), and the worked example for
   the skill gta-clip-short. A vertical film written in code, narrated first and cut to the voice: every beat is
   keyed to a word time from vo/vo.js (window.VO). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Footage: two muted Trailer 2 excerpts (Rockstar Games) drawn by film/kit/clip.js from clips.json: the opening
   house shot (under the hook) and the roof shot, used twice: once for "up on a roof", once for the exact frames where
   Jason says "just fixing some leaks" (11.8-12.9 s of Rockstar's post), frozen under the quote. Everything else is
   our own flat drawing in the Vice City palette, labeled OUR DRAWING where it redraws the trailer. Layout keeps to
   the x 90-930 rail; captions sit at y 476, clear of the Shorts overlay. No Rockstar logo or key art, no trailer
   audio, no music, no end fade. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, K = window.KIT, CLIP = window.CLIP;
  var BG = '#0b0820', CREAM = '#fbf0ea', HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d', INK = '#1d1233', YEL = '#ffd23f';
  var WOOD = '#4e8a80', WOOD2 = '#3d6f67', SHINGLE = '#2a2733';
  var TAU = Math.PI * 2;
  /* the rail: everything stays inside x 90-930; the picture card sits under the captions */
  var X0 = 90, X1 = 930, MID = 510, CX0 = 90, CY0 = 600, CW = 840, CH = 840, CAPY = 476, CHIPY = 335;

  /* ---------- math ---------- */
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

  /* ---------- times ---------- */
  var T = {}, EV = [], U = {};
  function ev(t, type, g, extra) { var e = { t: t, type: type, g: g == null ? 1 : g }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
  function initTimes() {
    EV.length = 0; CLIP.reset();
    T.roof0 = start('roof') - .1;                // footage run 1: house shot under the hook, then the roof shot
    T.roofEnd = start('ask') - .12;              // own drawing: the question from below, "his answer?"
    T.q0 = start('quote') - .12;                 // footage run 2: the frames where Jason says the line, then a freeze
    T.freeze = T.q0 + 1.55;
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

    /* clip uses: each under 5 s and annotated; clipkit.py lint holds this to SAFE-EDIT rules 3 and 7 */
    U.house = CLIP.use('house', 0, T.roof0, { speed: 1.55 / T.roof0, zoom: [1.04, 1.16], focus: [.5, .45], note: 'hook text OPENS WITH A LINE ABOUT LEAKS over the opening shot' });
    U.roof = CLIP.use('roof', T.roof0, T.roofEnd, { speed: 1, zoom: [1.1, 1.2], focus: [.45, .42], note: 'arrow to the roof, label JASON · ON THE ROOF' });
    /* "Just fixing some leaks" is spoken 11.76-12.9 s into Rockstar's post, over this same shot (cut starts at 11.47) */
    U.quote = CLIP.use('roof', T.q0, T.why, { from: .25, freeze: T.freeze - T.q0, zoom: [1.2, 1.34], focus: [.42, .4], note: 'freeze + quote card JUST FIXING SOME LEAKS, on the frames where he says it' });

    ev(.04, 'whoosh', .7); ev(.3, 'slam', .7); ev(lastw('hook') + .04, 'pop', .8);
    ev(T.roof0, 'swish', .6); ev(T.roofEnd, 'swish', .8); ev(at('ask', 'asks'), 'pop', .7);
    ev(T.q0, 'whoosh', .6); ev(lastw('quote') + .05, 'shutter', .8);
    for (var i = 0; i < 3; i++) ev(lastw('quote') + .35 + i * .22, 'tick', .5);
    ev(T.why, 'swish', .8); ev(T.tiles, 'ratchet', .7, { t1: T.n90 + .1 }); ev(T.n90 + .12, 'pop', .9);
    ev(T.conf, 'whoosh', .6); ev(T.stamp, 'slam', 1);
    ev(T.t1, 'swish', .8); ev(T.leak, 'scratch', .9);
    ev(T.never, 'whoosh', .7); ev(T.theory, 'thud', .9);
    ev(T.end, 'swish', .7); ev(T.joke, 'pop', .9); ev(T.coin, 'pop', .9);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  /* ---------- captions: the spoken words, up to 3 a card, at y 476 ---------- */
  var CHUNKS = [];
  function buildChunks() {
    var HOTW = { leaks: 1, '90': 1, confirmed: 1, leaked: 1, never: 1, coincidence: 1, roof: 1, joke: 1 };
    VO.lines.forEach(function (l) {
      var cur = [];
      l.words.forEach(function (w, i) {
        cur.push({ w: w.w.replace(/[.,]$/, '').toUpperCase(), t0: w.t0, t1: w.t1, hot: !!HOTW[norm(w.w)] });
        if (cur.length === 3 || /[.?!,]$/.test(w.w) || i === l.words.length - 1) { CHUNKS.push(cur); cur = []; }
      });
    });
    CHUNKS.forEach(function (c, i) { c.t0 = c[0].t0 - .05; c.t1 = CHUNKS[i + 1] ? Math.min(CHUNKS[i + 1][0].t0 - .05, c[c.length - 1].t1 + .6) : DUR; });
  }
  function captions(g, t) {
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (t < c.t0 || t >= c.t1) continue;
      var px = 58, gap = px * .55, ws = c.map(function (w) { return K.measure(g, w.w, px, { wide: false }) * 1.1; });
      var tw = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (c.length - 1), s = Math.min(1, (X1 - X0 - 20) / tw), x = -tw / 2;
      g.save(); g.translate(MID, CAPY); g.scale(s, s);
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
  function card(g, x, y, w, h, fill, r) { g.save(); rr(g, x + 8, y + 12, w, h, r || 34); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, x, y, w, h, r || 34); g.fillStyle = fill; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore(); }
  function chipTop(g, s, bg, col) { K.chip(g, s, MID, CHIPY, 36, { align: 'center', bg: bg, col: col }); }

  /* ---------- footage in the card ---------- */
  function footage(g, t, u, creditAlpha) {
    var pop = cd(t, u.t0, 16), s = lerp(.96, 1, pop);
    g.save(); g.translate(MID, CY0 + CH / 2); g.scale(s, s); g.translate(-MID, -(CY0 + CH / 2));
    card(g, CX0, CY0, CW, CH, CREAM, 36);
    g.save(); rr(g, CX0 + 8, CY0 + 8, CW - 16, CH - 16, 30); g.clip(); CLIP.draw(g, t, CX0 + 8, CY0 + 8, CW - 16, CH - 16, u);
    if (u === U.quote && t >= T.freeze) K.freezeFX(g, W, H, t - T.freeze);
    g.restore();
    g.save(); g.globalAlpha *= creditAlpha == null ? 1 : creditAlpha; CLIP.credit(g, u, CX0 + 30, CY0 + CH - 30); g.restore();
    g.restore();
  }
  function beatOpen(g, t) {
    footage(g, t, U.house, seg(t, .8, 1.1));
    hookText(g, t);
  }
  function hookText(g, t) {
    var o = T.roofEnd - .15;
    K.slam(g, 'OPENS WITH A LINE', MID, CY0 + 110, 54, t - .3, { col: CREAM, rot: -.03, out: o - .3 });
    K.slam(g, 'ABOUT LEAKS', MID, CY0 + 200, 78, t - at('hook', 'about'), { col: YEL, rot: -.05, out: o - at('hook', 'about') });
  }
  function beatRoof(g, t) {
    footage(g, t, U.roof);
    var p = CLIP.toScreen(U.roof, t, .62, .55, CX0 + 8, CY0 + 8, CW - 16, CH - 16), k = seg(t, at('roof', 'roof') - .25, at('roof', 'roof') + .2);
    K.arrow(g, 860, CY0 + 330, Math.min(p[0], 880), Math.max(p[1], CY0 + 450), eio(k), YEL, 12, -.25);
    hookText(g, t);
  }
  /* ---------- own drawing: the house from the trailer, redrawn (weathered teal planks, dark shingles) ---------- */
  function house(g, t, x, y, s, drips) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = WOOD; g.fillRect(-250, -40, 500, 300);
    g.strokeStyle = WOOD2; g.lineWidth = 4; for (var py = -20; py < 260; py += 26) { g.beginPath(); g.moveTo(-250, py); g.lineTo(250, py); g.stroke(); }
    g.lineWidth = 8; g.strokeStyle = INK; g.strokeRect(-250, -40, 500, 300);
    g.fillStyle = '#16262e'; for (var i = -1; i <= 1; i += 2) { g.fillRect(i * 135 - 48, 30, 96, 86); g.strokeRect(i * 135 - 48, 30, 96, 86); }
    g.fillStyle = '#6b4a35'; g.fillRect(-40, 120, 80, 140); g.strokeRect(-40, 120, 80, 140);
    g.fillStyle = SHINGLE; g.beginPath(); g.moveTo(-285, -40); g.lineTo(285, -40); g.lineTo(230, -105); g.lineTo(-230, -105); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = YEL; g.lineWidth = 10; g.beginPath(); g.moveTo(165, 260); g.lineTo(215, -105); g.moveTo(212, 260); g.lineTo(262, -105); g.stroke();
    g.lineWidth = 7; for (var r = 0; r < 7; r++) { var yy = 230 - r * 50, xx = 169 + (230 - yy) / 365 * 50; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 47, yy); g.stroke(); }
    var tap = Math.sin(t * 9) * .3;
    g.fillStyle = INK; g.beginPath(); g.arc(50, -185, 24, 0, TAU); g.fill(); g.fillRect(31, -162, 38, 58);
    g.save(); g.translate(69, -148); g.rotate(-.6 + tap); g.fillRect(0, -6, 56, 12); g.fillStyle = ORG; g.fillRect(48, -17, 15, 34); g.restore();
    if (drips) for (var d = 0; d < 6; d++) { var ph = ((t * .9 + d * .37) % 1); g.fillStyle = TEAL; g.globalAlpha = 1 - ph; g.beginPath(); g.ellipse(-210 + d * 80, -40 + ph * 300, 9, 14, 0, 0, TAU); g.fill(); g.globalAlpha = 1; }
    g.restore();
  }
  function beatAsk(g, t) {
    var k = cd(t, T.roofEnd, 12);
    house(g, t, MID + 40, lerp(1400, 1120, k), 1.2, false);
    /* the man below: a small figure, the bubble comes from him */
    var mx = 190, my = 1340;
    g.fillStyle = INK; g.beginPath(); g.arc(mx, my - 120, 22, 0, TAU); g.fill(); g.fillRect(mx - 18, my - 98, 36, 70);
    g.save(); g.translate(mx + 16, my - 90); g.rotate(-1.1 + Math.sin(t * 5) * .15); g.fillRect(0, -5, 50, 10); g.restore();
    var bk = cd(t, at('ask', 'asks') - .1, 13);
    if (bk > 0) {
      g.save(); g.translate(400, 760); g.scale(bk, bk);
      card(g, -300, -110, 620, 210, CREAM, 36);
      g.fillStyle = CREAM; g.beginPath(); g.moveTo(-230, 92); g.lineTo(-210, 470); g.lineTo(-150, 92); g.fill();
      K.sticker(g, '“WHAT ARE YOU', 10, -40, 54, { col: INK, lw: 0, shadow: false, wide: false });
      K.sticker(g, 'DOING UP THERE?”', 10, 35, 46, { col: HOT, lw: 0, shadow: false });
      g.restore();
    }
    if (t > start('answer') - .1) K.slam(g, 'HIS ANSWER?', MID, 1500, 80, t - start('answer') + .1, { col: YEL });
    chipTop(g, 'OUR DRAWING · TRAILER 2', TEAL, INK);
  }
  /* Jason's line on a yellow card with leak drips that keep falling into the next beat */
  function quoteLine(g, t, dy) {
    g.save(); g.translate(0, dy || 0);
    card(g, 120, 1140, 780, 200, YEL, 26);
    K.popWords(g, ['“JUST', 'FIXING'], MID, 1200, 68, t - at('quote', 'just'), { col: INK, ink: CREAM, lw: 0, shadow: false, gap: .12 });
    K.popWords(g, ['SOME', '*LEAKS.”'], MID, 1285, 72, t - at('quote', 'some'), { col: INK, hot: HOT, ink: CREAM, lw: 0, shadow: false, gap: .14 });
    g.restore();
    for (var i = 0; i < 7; i++) {
      var t0 = at('quote', 'leaks') + i * .32, u = t - t0; if (u < 0 || u > 1.4) continue;
      g.fillStyle = TEAL; g.globalAlpha = 1 - seg(u, 1, 1.4); g.beginPath(); g.ellipse(300 + (i * 97) % 420, 1340 + (dy || 0) + eio(seg(u, 0, 1.2)) * 260, 10, 16, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
    }
  }
  function beatQuote(g, t) {
    footage(g, t, U.quote);
    K.chip(g, 'JASON · SAME SHOT', CX0 + 30, CY0 + 60, 36, { bg: TEAL, col: INK });
    if (t > at('quote', 'just') - .05) quoteLine(g, t, 0);
  }

  /* ---------- own: about 90 leaked video tiles + counter ---------- */
  function tile(g, x, y, s, col) { rr(g, x - 40 * s, y - 28 * s, 80 * s, 56 * s, 10 * s); g.fillStyle = col; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); g.fillStyle = CREAM; g.beginPath(); g.moveTo(x - 9 * s, y - 13 * s); g.lineTo(x + 15 * s, y); g.lineTo(x - 9 * s, y + 13 * s); g.closePath(); g.fill(); }
  function tiles(g, t, shrink) {
    var cols = [HOT, TEAL, ORG];
    for (var i = 0; i < 90; i++) {
      var c = i % 9, r = Math.floor(i / 9), ti = lerp(T.tiles, T.n90, i / 89), k = cd(t, ti, 18);
      if (k <= 0) continue;
      /* each tile drops in like a drip */
      var x = 130 + c * 95, y = 860 + r * 54, fall = (1 - eo(seg(t, ti, ti + .25))) * 160;
      var s = k * lerp(.85, .55, eio(shrink));
      tile(g, lerp(x, MID + (c - 4) * 50, eio(shrink)), lerp(y - fall, 1170 + (r - 4.5) * 28, eio(shrink)), s, cols[(i * 7) % 3]);
    }
  }
  function beatWhy(g, t) {
    if (t < T.tiles) {
      K.slam(g, 'WHY DOES THAT', MID, 760, 76, t - T.why, { col: CREAM, wide: false });
      K.slam(g, 'MATTER?', MID, 870, 104, t - at('why', 'matter'), { col: HOT });
      quoteLine(g, t, 40);
    }
    tiles(g, t, 0);
    if (t > T.tiles - .1 && t < T.early) K.counter(g, 0, 90, MID, 680, 120, t - (T.tiles - .1), T.n90 - T.tiles + .1, { col: YEL, commas: false });
    if (t > T.n90) K.chip(g, 'ABOUT 90 VIDEOS · PER REPORTS', MID, 1430, 34, { align: 'center', bg: HOT, col: CREAM });
    if (t >= at('why', 'in')) chipTop(g, 'SEPT 2022', ORG, INK);
    rockCard(g, t);
  }
  function rockCard(g, t) {
    var k = cd(t, T.early - .05, 13); if (k <= 0) return;
    g.save(); g.translate(MID, 680); g.scale(lerp(.9, 1, k), lerp(.9, 1, k)); g.globalAlpha = k;
    card(g, -390, -130, 780, 260, CREAM, 26);
    K.chip(g, 'ROCKSTAR · SEPT 19, 2022', 0, -78, 30, { align: 'center', bg: INK, col: CREAM });
    K.sticker(g, '“EARLY DEVELOPMENT', 0, -5, 56, { col: INK, lw: 0, shadow: false, wt: 800, wide: false });
    K.sticker(g, 'FOOTAGE”', 0, 60, 56, { col: INK, lw: 0, shadow: false, wt: 800, wide: false });
    g.restore();
  }
  /* ---------- own: Rockstar's words, CONFIRMED stamped on the quote ---------- */
  function beatConf(g, t) {
    var sh = seg(t, T.conf, T.conf + .5);
    tiles(g, t, sh);
    chipTop(g, 'SEPT 2022', ORG, INK);
    rockCard(g, t);
    K.chip(g, 'ABOUT 90 VIDEOS · PER REPORTS', MID, 1430, 34, { align: 'center', bg: HOT, col: CREAM });
    var u = t - T.stamp;
    if (u > 0) {
      g.save(); g.translate(MID + 150, 800); g.rotate(-.14); var s = lerp(2.2, 1, eo(clamp(u / .16, 0, 1))); g.scale(s, s); g.globalAlpha = clamp(u / .06, 0, 1);
      g.lineWidth = 10; g.strokeStyle = HOT; rr(g, -210, -52, 420, 104, 16); g.stroke();
      K.sticker(g, 'CONFIRMED', 0, 3, 64, { col: HOT, ink: BG }); g.restore();
    }
  }
  /* ---------- own: Trailer 1's premiere card leaks ---------- */
  function beatT1(g, t) {
    var k = cd(t, T.t1, 12), y = lerp(1400, 980, k);
    card(g, 150, y - 300, 720, 520, '#1f1640', 34);
    g.fillStyle = HOT; rr(g, 186, y - 264, 648, 300, 22); g.fill();
    g.fillStyle = CREAM; g.beginPath(); g.moveTo(MID - 40, y - 160); g.lineTo(MID + 50, y - 110); g.lineTo(MID - 40, y - 60); g.closePath(); g.fill();
    K.sticker(g, 'TRAILER 1', MID, y + 110, 72, { col: CREAM });
    K.chip(g, 'PREMIERE · DEC 2023', MID, y + 180, 34, { align: 'center', bg: TEAL, col: INK });
    var lk = t - T.leak;
    if (lk > 0) {
      K.slam(g, 'LEAKED!', MID, y - 110, 110, lk, { col: YEL, rot: -.1 });
      K.chip(g, 'ROCKSTAR: “OUR TRAILER HAS LEAKED”', MID, CHIPY, 30, { align: 'center', bg: CREAM, col: INK });
    }
  }
  /* ---------- own: the roof again, dripping; THEORY ---------- */
  function theoryStamp(g, t) {
    var k = t - T.theory; if (k <= 0) return;
    g.save(); g.translate(MID, 720); g.rotate(.07); var s = lerp(2.2, 1, eo(clamp(k / .16, 0, 1))); g.scale(s, s);
    g.lineWidth = 12; g.strokeStyle = ORG; rr(g, -270, -75, 540, 150, 18); g.stroke(); K.sticker(g, 'THEORY', 0, 4, 104, { col: ORG, ink: BG }); g.restore();
  }
  function beatNever(g, t) {
    house(g, t, MID + 30, 1150, 1.2, true);
    theoryStamp(g, t);
    chipTop(g, 'UNCONFIRMED', CREAM, INK);
  }
  /* ---------- own: vote, built over the dripping roof; no fade ---------- */
  function beatEnd(g, t) {
    g.save(); g.globalAlpha = lerp(1, .35, seg(t, T.end, T.joke)); house(g, t, MID + 30, 1150, 1.2, true); g.restore();
    function btn(label, y, tt, col) { var k = cd(t, tt - .05, 14); if (k <= 0) return; g.save(); g.translate(MID, y); g.scale(k, k); g.rotate(Math.sin(t * 3 + y) * .025); card(g, -300, -90, 600, 180, col, 40); K.sticker(g, label, 0, 4, label.length > 6 ? 70 : 96, { col: INK, lw: 0, shadow: false, wide: label.length <= 6 }); g.restore(); }
    btn('JOKE', 760, T.joke, YEL);
    btn('COINCIDENCE', 990, T.coin, TEAL);
    if (t > at('end', 'one')) K.popWords(g, ['ONE', '*WORD', 'BELOW'], MID, 1210, 64, t - at('end', 'one'), { gap: .1, maxW: 820 });
    chipTop(g, 'YOUR CALL', HOT, CREAM);
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    backdrop(g, t);
    if (t < T.roof0) beatOpen(g, t);
    else if (t < T.roofEnd) beatRoof(g, t);
    else if (t < T.q0) beatAsk(g, t);
    else if (t < T.why) beatQuote(g, t);
    else if (t < T.conf) beatWhy(g, t);
    else if (t < T.t1) beatConf(g, t);
    else if (t < T.never) beatT1(g, t);
    else if (t < T.end) beatNever(g, t);
    else beatEnd(g, t);
    [T.roofEnd, T.q0, T.why, T.t1, T.never].forEach(function (c) { K.flash(g, W, H, t - c, .3); });
    K.chip(g, 'GTA 6', X0, 200, 40, { bg: HOT, col: CREAM });
    if (CLIP.active(t) && t > 4) K.chip(g, 'TRAILER 2', X1 - 30, 200, 36, { align: 'right', bg: CREAM, col: INK });
    captions(g, t);
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
    Tx('hook1', 'OPENS WITH A LINE', .35, T.roofEnd - .45);
    Tx('hook2', 'ABOUT LEAKS', at('hook', 'about') + .05, T.roofEnd - .35);
    Tx('drawn', 'OUR DRAWING · TRAILER 2', T.roofEnd + .1, T.q0);
    Tx('bubble', 'WHAT ARE YOU DOING UP THERE?', at('ask', 'asks'), T.q0);
    Tx('quote', 'JUST FIXING SOME LEAKS', at('quote', 'some') + .1, T.tiles);
    Tx('sept', 'SEPT 2022', at('why', 'in') + .1, T.t1);
    Tx('about90', 'ABOUT 90 VIDEOS · PER REPORTS', T.n90 + .05, T.t1);
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 84px Archivo', '600 30px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0“”’·'); }))).then(function () {
      buildChunks(); initTimes();
      window.FILM.POSTER = T.freeze + .45;   // the roof freeze with the quote card, between captions
      window.FILM.SHOTS = [{ id: 'roof', name: 'The roof', t0: 0, t1: T.why }, { id: 'leaks', name: 'The leaks', t0: T.why, t1: T.never }, { id: 'theory', name: 'Joke?', t0: T.never, t1: DUR }];
      window.READY = true;
    });
  }

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: 10, SLUG: 'gta-leaks', SHOTS: [], LIVE: {}, init: init, render: render, frame: frame, T: T };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
