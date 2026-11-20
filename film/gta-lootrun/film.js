/* "4 locks, 1 bag": GTA 6, Delta, commentary mode (SAFE-EDIT rule 10). GTA 6 loot as an escape room: one cash bag
   behind a chain of four locks (power -> PC password -> safe code -> shed code), from a player's loot run posted the
   day after launch. Hero object: our own duffel bag wrapped in a chain with four padlocks; it opens one lock per lock
   line, rides a rail under the picture card while the story plays, and comes back up and re-locks for the loop.
   Footage: three muted creator clips (boat, keypad, airboat; facecam and captions cropped out at cut time), each under
   5 s, annotated; the keypad use freezes before any digit is typed and skips to the safe swinging open, so no code is
   ever shown. Credit lives in the description only (CLIP.credit skips creator clips). Everything else is our flat
   drawing. Pure function of t, keyed to the voice with at(id, word). Rail x 90-930, glyphs above y 1450.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx), BOUNDS_RUN(step). */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, K = window.KIT, CLIP = window.CLIP;
  var BG = '#0b0820', CREAM = '#fbf0ea', HOT = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d', INK = '#1d1233', YEL = '#ffd23f';
  var BAG = '#2f8f5b', BAG2 = '#21694a', STEEL = '#8c93a8', STEEL2 = '#5d6378', WOOD = '#9a6a3f', WOOD2 = '#6e4a2a', WATER = '#1e6fb8';
  var TAU = Math.PI * 2;
  var X0 = 90, X1 = 930, MID = 510, CX0 = 90, CY0 = 560, CW = 840, CH = 620, CAPY = 476, CHIPY = 335;

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function knock(t, a, amp, f, d) { if (t < a) return 0; var u = t - a; return (amp || 1) * Math.exp(-u * (d || 6)) * Math.sin(u * (f || 22)); }
  /* ambient motion is periodic in the film's length, so the last frame is frame 0 */
  function osc(t, n, ph) { return Math.sin(TAU * n * t / DUR + (ph || 0)); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

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
  function start(id) { return LINE[id].t0; }
  function lastw(id) { var w = LINE[id].words; return w[w.length - 1].t1; }

  /* ---------- times ---------- */
  var T = {}, EV = [], U = {};
  function ev(t, type, g, extra) { var e = { t: t, type: type, g: g == null ? 1 : g }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
  function initTimes() {
    EV.length = 0; CLIP.reset();
    T.cash = at('hook', 'cash');
    T.found = start('found') - .15;              // the bag shrinks onto the rail; calendar
    T.day = at('found', 'day');
    T.flip = at('found', 'found');
    T.boat0 = start('lock1') - .12;              // clip 1: boat out to the compound
    T.boat1 = at('lock1', 'turn') - .1;           // own: the breaker
    T.power = at('lock1', 'power');
    T.open1 = lastw('lock1') + .04;
    T.l2 = start('lock2') - .12;                 // own: PC login, then the bedroom wall
    T.pw = at('lock2', 'password');
    T.pc = at('lock2', 'pc');
    T.bed = at('lock2', 'bedroom');
    T.open2 = lastw('lock2') + .04;
    T.k0 = start('lock3') - .12;                 // clip 2a: ENTER CODE -> keypad, frozen before any digit
    T.kfrz = 1.2;                                // seconds into the cut: the display still reads ----
    T.open3 = lastw('lock3') + .04;
    T.k1 = T.open3 - .55;
    T.tw0 = start('twist') - .1;                        // clip 2b: the safe swings open (digits never shown)
    T.tw = start('twist') - .1;                  // own: the safe, a tiny stack, a sticky note
    T.barely = at('twist', 'barely');
    T.another = at('twist', 'another');
    T.l4 = start('lock4') + .06;                 // own: the shed by the water
    T.open4 = wend('lock4', 'opens');
    T.shed = at('lock4', 'shed');
    T.bag = at('lock4', 'bag');
    T.money = at('lock4', 'worth');
    T.a0 = start('smg') - .12;                   // clip 3: out through the swamp with the bag
    T.smg = at('smg', 'smg');
    T.sell = at('smg', 'sell');
    T.end = start('end') - .12;                  // own: the bag comes back up, all four open
    T.escape = at('end', 'escape');
    T.could = at('end', 'could');
    T.solve = at('end', 'escape') + .3;
    T.reclose = Math.max(lastw('end') + .25, DUR - .55);   // locks snap shut again: the last frame is frame 0
    T.open = [T.open1, T.open2, T.open3, T.open4];

    /* clip uses: each under 5 s and annotated; clipkit.py lint holds this to SAFE-EDIT rule 10 */
    U.boat = CLIP.use('boat', T.boat0, T.boat1, { speed: 1, zoom: [1.04, 1.14], focus: [.5, .6], note: 'circle on the boat, label BOAT OUT TO THE COMPOUND, lock counter under the card' });
    U.key = CLIP.use('keypad', T.k0, T.k1, { speed: 1, freeze: T.kfrz, zoom: [1.02, 1.12], focus: [.5, .42], note: 'freeze before any digit, circle on the keypad, label SAFE CODE: NOT SHOWN' });
    U.safe = CLIP.use('keypad', T.k1, T.tw, { from: 2.07, speed: .42 / (T.tw0 - T.k1), zoom: [1.06, 1.1], focus: [.5, .5], note: 'the safe swings open; lock 3 stamped OPEN' });
    U.air = CLIP.use('airboat', T.a0, T.end, { speed: 2.45 / (start('end') - .12 - T.a0), zoom: [1.04, 1.16], focus: [.5, .5], note: 'circle on the airboat, label OUT WITH THE BAG, RARE SMG card, SELL THE BAG chip' });

    ev(.25, 'tick', .5); ev(.42, 'tick', .4); ev(wend('hook', 'cash') + .02, 'pop', .6); ev(lastw('hook') + .05, 'thud', .7);
    ev(T.found, 'whoosh', .6); ev(T.day, 'scratch', .5);
    ev(T.boat0, 'swish', .6); ev(T.boat0 + .45, 'zip', .4);
    ev(T.boat1, 'swish', .6); ev(T.power + .25, 'thud', .7);
    ev(T.l2, 'swish', .6);
    for (var i = 0; i < 6; i++) ev(T.l2 + .3 + i * .13, 'key', .35);
    ev(T.bed - .05, 'whoosh', .5);
    ev(T.k0, 'swish', .6); ev(T.k0 + T.kfrz, 'shutter', .6); ev(T.k1, 'squeak', .5);
    ev(T.tw, 'swish', .6); ev(T.barely + .05, 'squeak', .5); ev(T.another + .05, 'pop', .6);
    ev(T.l4, 'swish', .6); ev(T.shed + .1, 'squeak', .5); ev(T.bag, 'thud', .6); ev(T.money + .1, 'ding', .5);
    ev(T.a0, 'swish', .6); ev(T.smg, 'pop', .6); ev(T.sell + .1, 'zip', .5);
    ev(T.end, 'whoosh', .6); ev(T.escape, 'sparkle', .6); ev(T.could, 'pop', .6);
    for (var j = 0; j < 4; j++) { ev(T.open[j], 'pop', .8); ev(T.open[j] + .08, 'ding', .45); ev(T.reclose + j * .06, 'tick', .5); }
    ev(T.reclose + .4, 'slam', .6);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  /* ---------- captions: spoken words, up to 3 a card, at y 476 (the hook line has its own big type) ---------- */
  var CHUNKS = [];
  function buildChunks() {
    var HOTW = { locks: 1, bag: 1, power: 1, password: 1, bedroom: 1, safe: 1, code: 1, barely: 1, another: 1, shed: 1, thirty: 1, smg: 1, sell: 1, escape: 1, room: 1, solve: 1, one: 1, two: 1, three: 1, four: 1 };
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
      var cur = [];
      l.words.forEach(function (w, i) {
        cur.push({ w: w.w.replace(/[.,:]$/, '').toUpperCase(), t0: w.t0, t1: w.t1, hot: !!HOTW[norm(w.w)] });
        if (cur.length === 3 || /[.?!,:]$/.test(w.w) || i === l.words.length - 1) { CHUNKS.push(cur); cur = []; }
      });
    });
    CHUNKS.forEach(function (c, i) { var nx = CHUNKS[i + 1]; c.t0 = c[0].t0 - .05; c.t1 = nx ? Math.min(nx[0].t0 - .05, c[c.length - 1].t1 + .6) : c[c.length - 1].t1 + .5; });
  }
  function captions(g, t) {
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (t < c.t0 || t >= c.t1) continue;
      var px = 58, gap = px * .55, ws = c.map(function (w) { return K.measure(g, w.w, px, { wide: false }) * 1.1; });
      var tw = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (c.length - 1), s = Math.min(1, (X1 - X0 - 40) / tw), x = -tw / 2;
      g.save(); g.translate(MID, CAPY); g.scale(s, s);
      c.forEach(function (w, j) { K.caption(g, [w], x + ws[j] / 2, 0, px, t, { wide: false }); x += ws[j] + gap; });
      g.restore(); return;
    }
  }

  /* ---------- background: drifting pink stripes + slow dollar signs, periodic in DUR ---------- */
  function backdrop(g, t) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = .07; g.strokeStyle = HOT; g.lineWidth = 34;
    var off = (t / DUR) * 240;
    for (var x = -H; x < W + H; x += 120) { g.beginPath(); g.moveTo(x + off, 0); g.lineTo(x + off - H * .6, H); g.stroke(); }
    g.restore();
  }
  function card(g, x, y, w, h, fill, r) { g.save(); rr(g, x + 8, y + 12, w, h, r || 34); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, x, y, w, h, r || 34); g.fillStyle = fill; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore(); }
  function chipTop(g, s, bg, col, a) { g.save(); g.globalAlpha *= a == null ? 1 : a; K.chip(g, s, MID, CHIPY, 34, { align: 'center', bg: bg, col: col }); g.restore(); }
  function stamp(g, s, x, y, px, u, col, rot) {
    if (u <= 0) return;
    g.save(); g.translate(x, y); g.rotate(rot == null ? -.12 : rot); var sc = lerp(2.2, 1, eo(clamp(u / .16, 0, 1))); g.scale(sc, sc); g.globalAlpha *= clamp(u / .06, 0, 1);
    var w = K.measure(g, s, px, { wide: false }) + px * .9, h = px * 1.45;
    g.lineWidth = Math.max(6, px * .14); g.strokeStyle = col; rr(g, -w / 2, -h / 2, w, h, px * .2); g.stroke();
    K.sticker(g, s, 0, 3, px, { col: col, ink: BG, wide: false }); g.restore();
  }

  /* =============== the hero: a duffel bag, a chain round it, four padlocks =============== */
  var LX = [-262, -88, 88, 262], LY = -30;
  function openK(t, i) {
    var o = cd(t, T.open[i], 16);
    if (t >= T.reclose) o *= 1 - eio(seg(t, T.reclose + i * .06, T.reclose + i * .06 + .18));
    return o;
  }
  function padlock(g, t, i, x, y, o) {
    /* hangs from the chain at (x, y); swings a little, rattles on its open */
    var sway = osc(t, 7 + i, i * 1.7) * .05 + knock(t, T.open[i], .22, 20, 5) + knock(t, .25 + i * .06, i === 0 ? .14 : 0, 24, 6);
    g.save(); g.translate(x, y); g.rotate(sway);
    var lift = 34 * o, swing = -1.1 * o;
    /* shackle: a U from the chain down into the body */
    g.save(); g.translate(-34, 70 - lift); g.rotate(swing); g.translate(34, 0);
    g.lineCap = 'round'; g.lineWidth = 26; g.strokeStyle = INK; g.beginPath(); g.moveTo(-34, 0); g.lineTo(-34, -52); g.arc(0, -52, 34, Math.PI, 0); g.lineTo(34, 0); g.stroke();
    g.lineWidth = 15; g.strokeStyle = o > .5 ? '#d9dde8' : STEEL; g.stroke(); g.restore();
    /* body */
    var col = o > .5 ? TEAL : YEL;
    rr(g, -66, 58, 132, 118, 20); g.fillStyle = col; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.28)'; rr(g, -54, 68, 22, 96, 10); g.fill();
    K.sticker(g, String(i + 1), 6, 104, 54, { col: INK, lw: 0, shadow: false, wide: false });
    g.fillStyle = INK; g.beginPath(); g.arc(6, 146, 8, 0, TAU); g.fill(); g.fillRect(3, 146, 6, 18);
    g.restore();
  }
  function chain(g, t, drop, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    for (var i = 0; i < 17; i++) {
      var x = -300 + i * 37.5, y = LY + drop * (1 + .4 * Math.sin(i * .7)) + Math.sin(i * .9 + t * 2) * 2;
      g.save(); g.translate(x, y); g.lineWidth = 9; g.strokeStyle = INK; g.beginPath();
      if (i % 2) g.ellipse(0, 0, 24, 9, 0, 0, TAU); else g.ellipse(0, 0, 22, 15, 0, 0, TAU);
      g.stroke(); g.lineWidth = 5; g.strokeStyle = STEEL; g.stroke(); g.restore();
    }
    g.restore();
  }
  function duffel(g, t, cashK) {
    /* handles */
    g.lineCap = 'round'; g.lineWidth = 22; g.strokeStyle = INK; g.beginPath(); g.arc(-90, -150, 70, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.beginPath(); g.arc(90, -150, 70, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.lineWidth = 12; g.strokeStyle = BAG2; g.beginPath(); g.arc(-90, -150, 70, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.beginPath(); g.arc(90, -150, 70, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    /* body */
    rr(g, -310, -160, 620, 330, 140); g.fillStyle = BAG; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    g.save(); rr(g, -310, -160, 620, 330, 140); g.clip();
    g.fillStyle = BAG2; g.fillRect(-310, 90, 620, 90);
    g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, -250, -140, 500, 40, 20); g.fill();
    g.restore();
    /* zipper */
    g.strokeStyle = INK; g.lineWidth = 5; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(-240, -118); g.lineTo(240, -118); g.stroke(); g.setLineDash([]);
    /* end caps */
    g.fillStyle = BAG2; g.beginPath(); g.ellipse(-300, 5, 26, 120, 0, 0, TAU); g.fill(); g.lineWidth = 6; g.stroke();
    g.beginPath(); g.ellipse(300, 5, 26, 120, 0, 0, TAU); g.fill(); g.stroke();
    /* the $ patch + bills poking out of the zip */
    for (var b = 0; b < 3; b++) { g.save(); g.translate(-150 + b * 120, -128); g.rotate(-.2 + b * .2 + osc(t, 9, b) * .05); rr(g, -38, -26, 76, 40, 5); g.fillStyle = '#9fd77f'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); g.restore(); }
    K.sticker(g, '$', 0, 128, 76, { col: YEL, wide: false });
  }
  /* the whole object; pose gives its centre and scale */
  function pose(t) {
    var big = { x: MID, y: 1130, s: 1.25 }, rail = { x: MID, y: 1335, s: .6 };
    if (t < T.found) return big;
    if (t < T.end) { var k = eio(seg(t, T.found, T.found + .7)); return { x: lerp(big.x, rail.x, k), y: lerp(big.y, rail.y, k), s: lerp(big.s, rail.s, k) }; }
    var k2 = eio(seg(t, T.end, T.end + .7)); return { x: lerp(rail.x, big.x, k2), y: lerp(rail.y, big.y, k2), s: lerp(rail.s, big.s, k2) };
  }
  function hero(g, t) {
    var p = pose(t), bob = osc(t, 9) * 6;
    g.save(); g.translate(p.x, p.y + bob * p.s); g.scale(p.s, p.s); g.rotate(osc(t, 5, 1) * .015);
    var cashK = t < T.found ? t - T.cash : 0;
    duffel(g, t, cashK > 0 ? cashK : 0);
    var drop = 90 * eio(seg(t, T.escape - .3, T.escape + .3)) * (t < T.reclose ? 1 : 1 - eio(seg(t, T.reclose - .15, T.reclose + .05)));
    var ca = 1 - seg(drop, 20, 90);
    chain(g, t, drop, ca);
    g.save(); g.globalAlpha *= ca;
    for (var i = 0; i < 4; i++) padlock(g, t, i, LX[i], LY + drop * (1 + .4 * Math.sin(i * 3)), openK(t, i));
    g.restore();
    if (cashK > 0) stamp(g, 'CASH', 0, -235, 64, cashK, YEL, -.06);
    g.restore();
    /* OPEN stamps over the rail locks */
    for (var j = 0; j < 4; j++) {
      var u = t - T.open[j]; if (u <= 0 || u > 1.4 || t > T.end) continue;
      g.save(); g.globalAlpha = 1 - seg(u, 1.1, 1.4); stamp(g, 'OPEN', p.x + LX[j] * p.s, p.y - 40, 34, u, TEAL, -.1); g.restore();
    }
  }
  function hookText(g, t, u) {
    var pulse = 1 + osc(t, 14) * .02;
    g.save(); g.translate(MID, 400); g.scale(pulse, pulse);
    K.slam(g, '4 LOCKS.', 0, -10, 150, u, { col: CREAM, rot: -.035, wide: false });
    K.slam(g, '1 BAG.', 20, 165, 160, u - .08, { col: YEL, rot: -.05, wide: false });
    g.restore();
  }

  /* ---------- beats ---------- */
  function beatHook(g, t) {
    hero(g, t);
    var o = T.found - .05;
    g.save(); g.globalAlpha = 1 - seg(t, o - .2, o); hookText(g, t, t + 1); g.restore();
  }
  function calendar(g, t) {
    var k = cd(t, T.found + .45, 12); if (k <= 0) return;
    g.save(); g.translate(MID, lerp(1100, 860, k)); g.rotate(osc(t, 6) * .02); g.globalAlpha = k;
    card(g, -250, -250, 500, 480, CREAM, 30);
    g.fillStyle = HOT; rr(g, -250, -250, 500, 120, 30); g.fill(); g.fillRect(-250, -170, 500, 40); g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.moveTo(-250, -130); g.lineTo(250, -130); g.stroke();
    K.sticker(g, 'NOV', 0, -190, 64, { col: CREAM, wide: false });
    for (var r = -1; r <= 1; r += 2) { g.fillStyle = INK; g.beginPath(); g.arc(r * 150, -250, 16, 0, TAU); g.fill(); }
    var flip = seg(t, T.flip - .15, T.flip + .15), day = flip < .5 ? '19' : '20', sy = Math.abs(Math.cos(flip * Math.PI));
    g.save(); g.translate(0, 30); g.scale(1, Math.max(.02, sy)); K.sticker(g, day, 0, 0, 190, { col: INK, lw: 0, shadow: false, wide: false }); g.restore();
    K.chip(g, flip < .5 ? 'LAUNCH DAY' : 'FOUND IT', 0, 180, 40, { align: 'center', bg: flip < .5 ? INK : TEAL, col: flip < .5 ? CREAM : INK });
    g.restore();
  }
  function beatFound(g, t) {
    calendar(g, t);
    hero(g, t);
    chipTop(g, 'GTA 6 · LAUNCHED NOV 19', YEL, INK, seg(t, T.found + .2, T.found + .4));
  }
  function footage(g, t, u) {
    var pop = cd(t, u.t0, 16), s = lerp(.96, 1, pop);
    g.save(); g.translate(MID, CY0 + CH / 2); g.scale(s, s); g.translate(-MID, -(CY0 + CH / 2));
    card(g, CX0, CY0, CW, CH, CREAM, 36);
    g.save(); rr(g, CX0 + 8, CY0 + 8, CW - 16, CH - 16, 30); g.clip(); CLIP.draw(g, t, CX0 + 8, CY0 + 8, CW - 16, CH - 16, u);
    if (u === U.key && t >= u.t0 + T.kfrz) K.freezeFX(g, W, H, t - u.t0 - T.kfrz);
    g.restore();
    CLIP.credit(g, u, CX0 + 30, CY0 + CH - 30);   // draws nothing for a creator clip: credit is in the description
    g.restore();
  }
  function circleOn(g, t, u, nx, ny, rx, ry, col, seed, d0) {
    var p = CLIP.toScreen(u, t, nx, ny, CX0 + 8, CY0 + 8, CW - 16, CH - 16);
    g.save(); rr(g, CX0, CY0, CW, CH, 36); g.clip();
    var a0 = u.t0 + (d0 == null ? .25 : d0); K.scribble(g, p[0], p[1], rx, ry, eo(seg(t, a0, a0 + .5)), col, 11, seed);
    g.restore();
  }
  function beatBoat(g, t) {
    footage(g, t, U.boat);
    circleOn(g, t, U.boat, .5, .64, 190, 230, YEL, 3);
    K.chip(g, 'BY BOAT', CX0 + 34, CY0 + 60, 40, { bg: YEL, col: INK });
    hero(g, t);
  }
  function breaker(g, t) {
    var k = cd(t, T.boat1, 12), on = eio(seg(t, T.power + .05, T.power + .3));
    g.save(); g.translate(MID, lerp(1100, 860, k)); g.globalAlpha = k;
    card(g, -260, -270, 520, 540, STEEL2, 26);
    rr(g, -200, -210, 400, 420, 18); g.fillStyle = '#3a3f52'; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    /* the lever slot and lever */
    rr(g, -50, -150, 100, 300, 20); g.fillStyle = INK; g.fill();
    var ly = lerp(90, -90, on);
    rr(g, -70, ly - 40, 140, 80, 18); g.fillStyle = on > .5 ? TEAL : HOT; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    K.sticker(g, on > .5 ? 'ON' : 'OFF', 0, ly, 44, { col: INK, lw: 0, shadow: false, wide: false });
    /* lamp */
    var glow = on * (.85 + .15 * Math.sin(t * 30));
    g.fillStyle = 'rgba(255,210,63,' + (.35 * glow).toFixed(3) + ')'; g.beginPath(); g.arc(150, -170, 60, 0, TAU); g.fill();
    g.fillStyle = on > .5 ? YEL : '#555a6e'; g.beginPath(); g.arc(150, -170, 28, 0, TAU); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    g.restore();
    if (t > T.power + .1) stamp(g, 'POWER ON', MID, 640, 60, t - T.power - .1, YEL, -.08);
    chipTop(g, 'MAIN BUILDING · OUR DRAWING', CREAM, INK, k);
  }
  function beatPower(g, t) { breaker(g, t); hero(g, t); }
  function monitor(g, t, a, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha *= a;
    card(g, -300, -200, 600, 380, INK, 26);
    rr(g, -270, -170, 540, 320, 14); g.fillStyle = '#1b3c6e'; g.fill();
    g.fillStyle = INK; g.fillRect(-40, 180, 80, 50); rr(g, -130, 226, 260, 26, 10); g.fill();
    rr(g, -200, -90, 400, 170, 16); g.fillStyle = CREAM; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    K.sticker(g, 'PASSWORD', 0, -50, 40, { col: INK, lw: 0, shadow: false, wide: false });
    rr(g, -160, -10, 320, 64, 10); g.fillStyle = '#e6e0f0'; g.fill(); g.stroke();
    var n = Math.min(6, Math.floor(Math.max(0, t - T.l2 - .25) / .13));
    g.fillStyle = INK; for (var i = 0; i < 6; i++) { g.globalAlpha = (i < n ? 1 : .18) * a; g.beginPath(); g.arc(-110 + i * 44, 22, 13, 0, TAU); g.fill(); }
    g.globalAlpha = a; if (n >= 6 && Math.floor(t * 3) % 2) { g.fillStyle = HOT; g.fillRect(150, 0, 6, 44); }
    g.restore();
  }
  function bedroom(g, t, k) {
    if (k <= 0) return;
    g.save(); g.translate(0, (1 - k) * 700);
    card(g, 110, 620, 800, 560, '#c9a7d8', 26);
    g.save(); rr(g, 116, 626, 788, 548, 22); g.clip();
    g.fillStyle = 'rgba(29,18,51,.08)'; for (var x = 130; x < 900; x += 46) g.fillRect(x, 626, 18, 548);
    /* the bed */
    rr(g, 160, 990, 520, 140, 18); g.fillStyle = '#e8edf7'; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    rr(g, 180, 960, 160, 60, 20); g.fillStyle = CREAM; g.fill(); g.stroke();
    rr(g, 140, 900, 40, 240, 10); g.fillStyle = WOOD2; g.fill(); g.stroke();
    /* the scrawl on the wall: blurred on purpose, the password is not ours to give away */
    g.save(); g.filter = 'blur(7px)'; g.strokeStyle = INK; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath();
    for (var i = 0; i < 28; i++) { var px = 520 + i * 12, py = 770 + Math.sin(i * 1.7) * 18 + (hash(i) - .5) * 20; if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); }
    g.stroke(); g.restore();
    g.restore();
    var lk = eo(seg(t, T.pc + .1, T.pc + .5));
    K.scribble(g, 690, 772, 220, 70, lk, HOT, 10, 5);
    if (lk > .3) K.chip(g, 'BLURRED', 690, 880, 40, { align: 'center', bg: HOT, col: CREAM });
    g.restore();
  }
  function beatL2(g, t) {
    var bk = cd(t, T.pc, 12), mk = cd(t, T.l2, 12);
    if (bk <= 0) monitor(g, t, mk, MID, lerp(1080, 860, mk), 1);
    bedroom(g, t, bk);
    if (bk > 0) monitor(g, t, mk, lerp(MID, 330, bk), lerp(860, 720, bk), lerp(1, .5, bk));
    chipTop(g, 'IN THE BEDROOM · OUR DRAWING', CREAM, INK, mk);
    hero(g, t);
  }
  function beatKey(g, t) {
    var u = t < T.k1 ? U.key : U.safe;
    footage(g, t, u);
    if (u === U.key) {
      circleOn(g, t, U.key, .5, .4, 150, 150, YEL, 7, T.kfrz - .1);
      K.chip(g, 'THE PC GIVES THE SAFE CODE', CX0 + 34, CY0 + 60, 34, { bg: YEL, col: INK });
    } else K.chip(g, 'SAFE: OPEN', CX0 + 34, CY0 + 60, 34, { bg: TEAL, col: INK });
    K.chip(g, 'CODE: HIDDEN', MID, CY0 + CH - 60, 40, { align: 'center', bg: HOT, col: CREAM });
    hero(g, t);
  }
  function safe(g, t) {
    var k = cd(t, T.tw, 12), door = eio(seg(t, T.tw + .1, T.barely - .05));
    g.save(); g.translate(MID, lerp(1100, 880, k)); g.globalAlpha = k;
    card(g, -280, -290, 560, 520, STEEL2, 22);
    rr(g, -230, -240, 460, 420, 12); g.fillStyle = '#1c1830'; g.fill();
    /* inside: one tiny stack of cash, and a sticky note */
    var ck = cd(t, T.barely, 14);
    g.save(); g.translate(-60, 140); g.scale(ck, ck); rr(g, -55, -26, 110, 30, 5); g.fillStyle = '#9fd77f'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); g.restore();
    var nk = cd(t, T.another - .15, 14);
    if (nk > 0) {
      g.save(); g.translate(70, -40); g.rotate(.08 + osc(t, 8) * .02); g.scale(nk, nk);
      rr(g, -120, -110, 240, 220, 6); g.fillStyle = YEL; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
      K.sticker(g, 'CODE', 0, -60, 40, { col: INK, lw: 0, shadow: false, wide: false });
      g.save(); g.filter = 'blur(8px)'; g.fillStyle = INK; for (var d = 0; d < 4; d++) g.fillRect(-90 + d * 48, -5, 32, 60); g.restore();
      g.restore();
    }
    /* the door swings toward us on its left hinge */
    var dw = 460 * Math.cos(door * 1.35);
    g.save(); g.translate(-230, 0);
    rr(g, 0 - (dw < 0 ? -dw : 0), -240, Math.abs(dw), 420, 12); g.fillStyle = STEEL; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    if (dw > 60) { g.fillStyle = INK; g.beginPath(); g.arc(dw * .7, -30, 46 * dw / 460, 0, TAU); g.fill(); }
    g.restore();
    g.restore();
    if (t > T.barely - .05) K.slam(g, 'BARELY ANY CASH', MID, 690, 62, t - T.barely + .05, { col: CREAM, wide: false });
    chipTop(g, 'INSIDE THE SAFE · OUR DRAWING', CREAM, INK, k);
  }
  function beatTwist(g, t) { safe(g, t); hero(g, t); }
  function shed(g, t) {
    var k = cd(t, T.l4, 12), door = eio(seg(t, T.shed, T.shed + .45));
    g.save(); g.translate(MID, lerp(1100, 860, k)); g.globalAlpha = k;
    /* water */
    g.save(); rr(g, -400, 150, 800, 140, 20); g.fillStyle = WATER; g.fill(); g.clip();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 5; for (var w = 0; w < 4; w++) { g.beginPath(); for (var x = -400; x <= 400; x += 20) { var y = 180 + w * 30 + Math.sin(x * .03 + t * 3 + w) * 6; if (x === -400) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); }
    g.restore();
    /* shed */
    g.fillStyle = WOOD; g.fillRect(-260, -140, 520, 300); g.strokeStyle = WOOD2; g.lineWidth = 5; for (var p = -240; p < 260; p += 40) { g.beginPath(); g.moveTo(p, -140); g.lineTo(p, 160); g.stroke(); }
    g.lineWidth = 7; g.strokeStyle = INK; g.strokeRect(-260, -140, 520, 300);
    g.fillStyle = '#3a2a1c'; g.beginPath(); g.moveTo(-300, -140); g.lineTo(0, -290); g.lineTo(300, -140); g.closePath(); g.fill(); g.stroke();
    /* doorway, bag inside */
    g.fillStyle = '#120c18'; g.fillRect(-100, -60, 200, 220);
    var bk = cd(t, T.bag - .1, 12);
    if (bk > 0) { g.save(); g.translate(0, 110); g.scale(.3 * bk, .3 * bk); duffel(g, t, 0); g.restore(); }
    var dw = 200 * Math.cos(door * 1.4);
    g.fillStyle = WOOD2; g.fillRect(100 - dw, -60, dw, 220); g.lineWidth = 6; g.strokeRect(100 - dw, -60, dw, 220);
    g.restore();
    if (t > T.money) {
      var u = t - T.money;
      g.save(); g.translate(MID, 1085); var s = lerp(1.12, 1, eo(clamp(u / .16, 0, 1))); g.scale(s, s); g.globalAlpha = clamp(u / .06, 0, 1);
      K.chip(g, '$10K–$30K · HE SAYS', 0, 0, 50, { align: 'center', bg: YEL, col: INK }); g.restore();
    }
    chipTop(g, 'A SHED BY THE WATER · OUR DRAWING', CREAM, INK, k);
  }
  function beatL4(g, t) { shed(g, t); hero(g, t); }
  function smgIcon(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = INK;
    g.fillRect(-90, -22, 170, 36); g.fillRect(80, -12, 40, 14); g.fillRect(-20, 14, 26, 60); g.fillRect(30, 14, 22, 44); g.fillRect(-120, -14, 34, 22);
    g.restore();
  }
  function beatAir(g, t) {
    footage(g, t, U.air);
    circleOn(g, t, U.air, .5, .52, 230, 220, YEL, 11);
    K.chip(g, 'OUT WITH THE BAG', CX0 + 34, CY0 + 60, 34, { bg: YEL, col: INK });
    var sk = cd(t, T.smg - .05, 14);
    if (sk > 0) {
      g.save(); g.translate(770, CY0 + 150); g.rotate(.06); g.scale(sk, sk);
      card(g, -140, -80, 280, 170, CREAM, 18); smgIcon(g, 0, -20, .95);
      K.sticker(g, 'RARE SMG', 0, 50, 40, { col: HOT, lw: 0, shadow: false, wide: false });
      g.restore();
    }
    if (t > T.sell) {
      var u = t - T.sell;
      g.save(); g.translate(MID, CY0 + CH - 70); var s = lerp(1.6, 1, eo(clamp(u / .16, 0, 1))); g.scale(s, s); g.globalAlpha = clamp(u / .06, 0, 1);
      K.chip(g, '→ $$$', 0, 0, 52, { align: 'center', bg: TEAL, col: INK }); g.restore();
    }
    var mu = t - T.a0, my = lerp(1085, CHIPY, eio(clamp(mu / .4, 0, 1)));
    K.chip(g, '$10K–$30K · HE SAYS', MID, my, lerp(50, 40, eio(clamp(mu / .4, 0, 1))), { align: 'center', bg: YEL, col: INK });
    hero(g, t);
  }
  function beatEnd(g, t) {
    hero(g, t);
    var ea = 1 - seg(t, T.reclose - .1, T.reclose + .1);
    if (ea > 0) {
      g.save(); g.globalAlpha = ea;
      if (t > T.escape) K.slam(g, 'LOOT =', MID, 650, 80, t - T.escape, { col: CREAM, wide: false });
      if (t > T.escape + .2) K.slam(g, 'ESCAPE ROOM', MID, 760, 90, t - T.escape - .2, { col: YEL, wide: false, rot: -.05 });
      if (t > T.solve) { var k = cd(t, T.solve, 14); g.save(); g.translate(MID, 335); g.scale(k, k); K.chip(g, 'SOLVE IT?', 0, 0, 56, { align: 'center', bg: HOT, col: CREAM }); g.restore(); }
      g.restore();
    }
    if (t > T.reclose + .2) hookText(g, t, t - T.reclose - .2);
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    backdrop(g, t);
    if (t < T.found) beatHook(g, t);
    else if (t < T.boat0) beatFound(g, t);
    else if (t < T.boat1) beatBoat(g, t);
    else if (t < T.l2) beatPower(g, t);
    else if (t < T.k0) beatL2(g, t);
    else if (t < T.tw) beatKey(g, t);
    else if (t < T.l4) beatTwist(g, t);
    else if (t < T.a0) beatL4(g, t);
    else if (t < T.end) beatAir(g, t);
    else beatEnd(g, t);
    [T.boat0, T.k0, T.a0].forEach(function (c) { K.flash(g, W, H, t - c, .25); });
    K.chip(g, 'GTA 6', X0, 200, 40, { bg: HOT, col: CREAM });
    K.chip(g, 'LOOT RUN', X1, 200, 34, { align: 'right', bg: CREAM, col: INK });
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
    Tx('hook', '4 LOCKS. 1 BAG.', 0, T.found - .2);
    Tx('cash', 'CASH', T.cash, T.found);
    Tx('cal', 'FOUND IT', T.flip + .1, T.boat0);
    Tx('boat', 'BY BOAT', T.boat0, T.boat1);
    Tx('pass', 'BLURRED', T.pc + .13, T.k0);
    Tx('code', 'CODE: HIDDEN', T.k0, T.tw);
    Tx('barely', 'BARELY ANY CASH', T.barely - .02, T.l4);
    Tx('money', '$10K–$30K · HE SAYS', T.money + .05, T.end);
    Tx('smg', 'RARE SMG', T.smg, T.end);
    Tx('escape', 'ESCAPE ROOM', T.escape + .25, T.reclose + .05);
    Tx('solve', 'SOLVE IT?', T.solve + .05, T.reclose + .05);
    return o;
  }

  /* ---------- safe-area check: every glyph box inside x 90-930 and above y 1450 ---------- */
  var BOUNDS = null, CURT = 0;
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS && g.globalAlpha > .05) {
        var mm = this.measureText(str), m = this.getTransform(), xs = [], ys = [];
        var al = this.textAlign, x0 = x - mm.actualBoundingBoxLeft, x1 = x + mm.actualBoundingBoxRight, y0 = y - mm.actualBoundingBoxAscent, y1 = y + mm.actualBoundingBoxDescent;
        [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
        var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys);
        if (a < 89.5 || b > 930.5 || c > 1450.5) BOUNDS.push({ t: CURT, text: str, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
        void al;
      }
      return orig.apply(this, arguments);
    };
  }

  function SCORE(ac) { K.score(ac, EV, DUR); }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function init(canvas) {
    canvas.width = W; canvas.height = H; ctx = canvas.getContext('2d'); watch(ctx);
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 84px Archivo', '600 30px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0$–·→'); }))).then(function () {
      buildChunks(); initTimes();
      window.FILM.POSTER = .6;   // the hook: four locks, one bag
      window.FILM.SHOTS = [{ id: 'hook', name: 'Four locks', t0: 0, t1: T.boat0 }, { id: 'locks', name: 'The chain', t0: T.boat0, t1: T.l4 }, { id: 'bag', name: 'The bag', t0: T.l4, t1: DUR }];
      window.READY = true;
    });
  }
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1 }); r.to = b.t; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: .6, SLUG: 'gta-lootrun', SHOTS: [], LIVE: {}, init: init, render: render, frame: frame, T: T };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
