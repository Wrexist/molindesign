/* "GTA 6 hid an actual egg": GTA 6, Delta, commentary mode (SAFE-EDIT rule 10). A top-5 Easter-egg countdown where
   every item is proven by a short muted gameplay clip (@blockay's TikTok, facecam/captions/labels cropped out; credit
   in the description only), with our own real-world context as one dated paper card per item (2013, 2001, 2009, 1980,
   2026), and a loop: Atari named them in 1980, forty-six years later GTA 6 hid an actual egg.
   Native move: the countdown tile slams onto each item from a new corner; the dated card sits somewhere new each item.
   Footage is full width (1080) and at least 700 px tall; every use is under 5 s, annotated, and tracked.
   Pure function of t, keyed to the voice with at(id, word). Rail x 90-930, glyphs above y 1450.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx), BOUNDS_RUN. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, K = window.KIT, CLIP = window.CLIP;
  var BG = '#0b0820', CREAM = '#fbf0ea', HOT = '#ff4fa3', TEAL = '#19d3c5', INK = '#1d1233', YEL = '#ffd23f';
  var SKY = '#58b7ff', GRN = '#3fbf5a', PURP = '#6b2fb3', MAG = '#e83fa0', SEA = '#1aa6a0', SEA2 = '#0d7f86', PAPER = '#f4ead6';
  var TAU = Math.PI * 2;
  var X0 = 90, X1 = 930, MID = 510, CAPY = 212, PILLY = 100;
  var BY = 392;                                   // footage band top (full width, below the captions)

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function knock(t, a, amp, f, d) { if (t < a) return 0; var u = t - a; return (amp || 1) * Math.exp(-u * (d || 6)) * Math.sin(u * (f || 22)); }
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
  /* the voice track's own silences (vo/vad.js): scene changes and every hit sit in them, never on a word */
  var VAD = window.VAD || [];
  function silAfter(t) { for (var i = 0; i < VAD.length; i++) if (VAD[i][1] > t + .05) return VAD[i]; throw new Error('no silence after ' + t); }
  function initTimes() {
    EV.length = 0; CLIP.reset();
    T.tease0 = .95;                               // the real egg (thrown off the tower) takes the frame: payoff by 1.2 s
    T.search = 1.55;                              // TOP 5 EASTER EGGS chip: the search phrase on screen
    T.i5 = silAfter(lastw('hook') - .3)[0] + .02; T.boat = at('boat', 'boat'); T.jason = at('boat', 'jasons');
    T.g0 = start('gps');                          // clip: the boat's GPS screen, on "Its GPS"
    T.still = at('gps', 'still');
    T.i4 = silAfter(lastw('gps') - .3)[0] + .02;  T.q4 = silAfter(wend('dog', 'four') - .1)[0] + .03;
    T.d0 = silAfter(wend('dog', 'sea') - .2)[0] + .02;   // clip: the dog on a jet ski, from the pause after "sea?"
    T.i3 = silAfter(lastw('dog') - .3)[0] + .02;  T.d1 = T.i3;
    T.brian = at('car', 'brians'); T.drive = silAfter(wend('car', 'three') - .1)[0] + .03;
    T.p0 = silAfter(lastw('car') - .3)[0] + .02;  // clip: the plate, exposure lifted
    T.had = at('plate', 'had');
    T.i2 = silAfter(lastw('plate') - .3)[0] + .02;
    T.tc0 = silAfter(wend('trinity', 'two') - .1)[0] + .03;   // clip: Trinity Apartments, after "Two:"
    T.t1 = wend('trinity', 'apartments') + .05;   // own: the knot draws itself, 2009 card
    T.dex = at('trinity', 'dexters');
    T.i1 = silAfter(lastw('trinity') - .3)[0] + .02; T.tall = at('tower', 'tallest');
    T.top = silAfter(lastw('tower') - .3)[0] + .02;          // own: the camera reaches the top, a drawn nest
    T.ne0 = silAfter(wend('nest', 'nest') - .1)[0] + .02;    // clip: the last of the nest shot, then the egg in his hand
    T.egg = at('nest', 'egg');
    T.ne1 = silAfter(lastw('nest') - .3)[0] + .02;
    T.at0 = T.ne1; T.atari = at('atari', 'atari');
    T.lp0 = start('loop') - .1; T.y26 = silAfter(lastw('atari') - .3)[0] + .05;
    T.back = DUR - .45;                           // the drawn egg and the hook come back: the last frame is frame 0
    T.items = [T.i5, T.i4, T.i3, T.i2, T.i1];

    /* clip uses: each under 5 s and annotated; clipkit.py lint holds this to SAFE-EDIT rule 10 (creator share <= 1/3) */
    U.tease = CLIP.use('egg', T.tease0, T.i5, { from: 1.83, speed: Math.min(1, .62 / (T.i5 - T.tease0)), zoom: [1.0, 1.1], focus: [.44, .5], note: 'hook payoff: the real egg in his hand, thrown off the tower; a circle follows the egg' });
    U.tease.band = [430, 900];
    U.gps = CLIP.use('gps', T.g0, T.i4, { speed: .62, freeze: 1.7, zoom: [1.1, 1.45], focus: [.27, .36], note: 'push to the boat GPS screen, freeze, ring on the screen, chips IN HIS CLIP and LOS SANTOS' });
    U.gps.band = [BY, 700];
    U.dog = CLIP.use('dog', T.d0, T.d1, { speed: Math.min(1, 1.62 / (T.d1 - T.d0)), zoom: [1.02, 1.12], focus: [.55, .5], note: 'whole band, circle follows the dog in the life vest' });
    U.dog.band = [BY, 1048];
    U.plate = CLIP.use('plate', T.p0, T.i2, { speed: Math.min(1, 1.7 / (T.i2 - T.p0)), zoom: [1.75, 2.0], focus: [.5, .29], note: 'night shot brightened, push to the plate, box on HAD YOU, chip LOOK-ALIKE' });
    U.plate.band = [BY, 760];
    U.tri = CLIP.use('trinity', T.tc0, T.t1, { speed: Math.min(1, 1.3 / (T.t1 - T.tc0)), zoom: [1.0, 1.06], focus: [.45, .35], note: 'whole band, circle tracks the triquetra logo, chip TRINITY APARTMENTS' });
    U.tri.band = [BY, 1048];
    var nf = 1.13;                                  // from the cut to the sky: the egg rises into his hand on "Easter", then holds
    U.nest = CLIP.use('egg', T.ne0, T.ne1, { from: nf, speed: 1, freeze: 1.93 - nf, zoom: [1.0, 1.08], focus: [.5, .78], note: 'the egg rises into his hand at the tower top and holds; a circle follows the egg, stamp EASTER EGG' });
    U.nest.noFx = true;
    U.nest.band = [BY, 1048];

    /* sound: every hit is short and sits in a silence of the voice track (vo/vad.js) */
    ev(.02, 'tick', .45);
    T.items.forEach(function (it) { ev(it + .03, 'slam', .75); });
    ev(silAfter(wend('boat', 'five'))[0] + .04, 'pop', .45);   // HE SAYS / the dock sign
    ev(T.g0 - .12, 'zip', .5);
    ev(T.q4, 'pop', .5);                                       // the "?" over the stranded swimmer
    ev(T.d0 + .02, 'swish', .5);
    ev(T.drive, 'zip', .55);
    ev(T.p0 + .02, 'swish', .5);
    ev(T.tc0 + .01, 'pop', .5);
    ev(T.top + .03, 'whoosh', .45);
    ev(T.ne0 + .02, 'pop', .5);
    ev(T.at0 + .03, 'pop', .6);
    ev(T.y26, 'slam', .5);
    ev(T.back - .3, 'whoosh', .45); ev(T.back + .12, 'thud', .5);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  /* ---------- captions: phrase cards of 2-4 words at 96 px; never end a card on a weak word ---------- */
  var CHUNKS = [], CPX = 96;
  var WEAK = { a: 1, an: 1, the: 1, is: 1, to: 1, in: 1, by: 1, you: 1, of: 1, for: 1, this: 1, and: 1, its: 1, on: 1, from: 1, at: 1, was: 1, says: 1, still: 1 };
  function buildChunks(g) {
    var HOTW = { five: 1, four: 1, three: 1, two: 1, one: 1, boat: 1, gps: 1, los: 1, santos: 1, dog: 1, jet: 1, ski: 1, brians: 1, fast: 1, furious: 1, had: 1, you: 0, trinity: 1, dexters: 1, villain: 1, tallest: 1, tower: 1, nest: 1, actual: 1, easter: 1, egg: 1, atari: 1, '1980': 1, '2009': 1, fortysix: 1 };
    var GAP = CPX * .3;
    function wd(w) { return K.measure(g, w.w, CPX, { wide: false }); }
    function width(c) { return c.reduce(function (a, w) { return a + wd(w); }, 0) + GAP * (c.length - 1); }
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;                // frame 0 carries its own four words
      var ws = l.words.map(function (w) { return { w: w.w.replace(/[,:]$/, '').replace(/…$/, '…').toUpperCase(), raw: w.w, t0: w.t0, t1: w.t1, hot: !!HOTW[norm(w.w)] || (l.id === 'plate' && /^(had|you)/i.test(w.w)) }; });
      var phrases = [], cur = [];
      ws.forEach(function (w) { cur.push(w); if (/[.?!,:]$/.test(w.raw)) { phrases.push(cur); cur = []; } });
      if (cur.length) phrases.push(cur);
      var cards = [];
      phrases.forEach(function (ph) {
        var n = Math.ceil(ph.length / 4), base = Math.floor(ph.length / n), extra = ph.length % n, sizes = [];
        for (var i = 0; i < n; i++) sizes.push(base + (i < extra ? 1 : 0));
        var k = 0, parts = sizes.map(function (z) { var p = ph.slice(k, k + z); k += z; return p; });
        for (var m = 0; m < parts.length - 1; m++) while (parts[m].length > 1 && WEAK[norm(parts[m][parts[m].length - 1].w)]) parts[m + 1].unshift(parts[m].pop());
        parts.forEach(function (p) { cards.push(p); });
      });
      for (var q = 0; q < cards.length; q++) if (cards[q].length === 1 && cards.length > 1) {
        if (q + 1 < cards.length && cards[q + 1].length < 4) { cards[q + 1] = cards[q].concat(cards[q + 1]); cards.splice(q, 1); q--; }
        else if (q > 0 && cards[q - 1].length < 4) { cards[q - 1] = cards[q - 1].concat(cards[q]); cards.splice(q, 1); q--; }
      }
      cards.forEach(function (c) {
        if (width(c) <= 820 || c.length === 1) c.rows = [c];
        else {
          var best = null;
          for (var b = 1; b < c.length; b++) { var a1 = c.slice(0, b), a2 = c.slice(b), sc = Math.max(width(a1), width(a2)) + (WEAK[norm(a1[a1.length - 1].w)] ? 120 : 0) + (norm(a1[a1.length - 1].w) === 'gta' ? 400 : 0); if (!best || sc < best.sc) best = { sc: sc, r: [a1, a2] }; }
          c.rows = best.r;
        }
        c.line = l.id; CHUNKS.push(c);
      });
    });
    CHUNKS.forEach(function (c, i) { var nx = CHUNKS[i + 1]; c.t0 = c[0].t0 - .05; c.t1 = nx ? Math.min(nx[0].t0 - .08, c[c.length - 1].t1 + .6) : c[c.length - 1].t1 + .4; });
  }
  function captions(g, t) {
    if (t > T.back - .05) return;
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (t < c.t0 || t >= c.t1) continue;
      var k = eo(seg(t, c.t0, c.t0 + .12)), gap = CPX * .3, n = c.rows.length;
      g.save(); g.globalAlpha *= k;
      c.rows.forEach(function (row, r) {
        var ws = row.map(function (w) { return K.measure(g, w.w, CPX, { wide: false }); });
        var tw = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (row.length - 1), x = MID - tw / 2, s = Math.min(1, 830 / tw);
        var y = (n === 1 ? CAPY + 45 : CAPY + r * 100) + (1 - k) * 20;
        g.save(); g.translate(MID, y); g.scale(s, s); g.translate(-MID, -y);
        row.forEach(function (w, j) {
          var on = t >= w.t0 && t < w.t1 + .05;
          K.sticker(g, w.w, x + ws[j] / 2, y + (on ? -6 : 0), CPX, { col: w.hot ? YEL : CREAM, wide: false, lw: CPX * .17 });
          x += ws[j] + gap;
        });
        g.restore();
      });
      g.restore();
      return;
    }
  }

  /* ---------- background: ink with drifting stripes in the item's colour ---------- */
  function itemAt(t) { var i = -1; for (var k = 0; k < 5; k++) if (t >= T.items[k]) i = k; if (t >= T.at0) i = 5; return i; }
  var ITEMCOL = [TEAL, SKY, GRN, HOT, YEL, '#ff8a3d'];
  function backdrop(g, t) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var i = itemAt(t);
    g.save(); g.globalAlpha = .08; g.strokeStyle = i < 0 ? HOT : ITEMCOL[i]; g.lineWidth = 34;
    var off = (t / DUR) * 240;
    for (var x = -H; x < W + H; x += 120) { g.beginPath(); g.moveTo(x + off, 0); g.lineTo(x + off - H * .6, H); g.stroke(); }
    g.restore();
  }
  function shadowCard(g, x, y, w, h, fill, r) { g.save(); rr(g, x + 8, y + 12, w, h, r || 30); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, x, y, w, h, r || 30); g.fillStyle = fill; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore(); }
  function stamp(g, s, x, y, px, u, col, rot) {
    if (u <= 0) return;
    g.save(); g.translate(x, y); g.rotate(rot == null ? -.12 : rot); var sc = lerp(1.35, 1, eo(clamp(u / .16, 0, 1))); g.scale(sc, sc); g.globalAlpha *= clamp(u / .06, 0, 1);
    var w = K.measure(g, s, px, { wide: false }) + px * .9, h = px * 1.45;
    g.fillStyle = 'rgba(11,8,32,.72)'; rr(g, -w / 2, -h / 2, w, h, px * .2); g.fill();
    g.lineWidth = Math.max(6, px * .14); g.strokeStyle = col; rr(g, -w / 2, -h / 2, w, h, px * .2); g.stroke();
    K.sticker(g, s, 0, 3, px, { col: col, ink: BG, wide: false }); g.restore();
  }
  function pill(g, t) {
    g.save(); K.measure(g, 'GTA 6', 64, { wide: false });
    rr(g, X0, PILLY - 46, 232, 92, 46); g.fillStyle = HOT; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    K.sticker(g, 'GTA 6', X0 + 116, PILLY + 2, 64, { col: CREAM, wide: false, lw: 0, shadow: false });
    g.restore();
    var a = seg(t, T.search, T.search + .2) * (1 - seg(t, T.back - .3, T.back - .1));
    if (a > 0) { g.save(); g.globalAlpha *= a; K.chip(g, 'TOP 5 EASTER EGGS', X1, PILLY, 34, { align: 'right', bg: CREAM, col: INK }); g.restore(); }
  }

  /* ---------- the countdown tile: slams in from a new corner each item ---------- */
  var TILE = [ { x: 260, y: 545, r: -.08, c: TEAL }, { x: 760, y: 545, r: .07, c: SKY }, { x: 260, y: 1290, r: .06, c: GRN }, { x: 760, y: 1280, r: -.06, c: HOT }, { x: 510, y: 560, r: -.04, c: YEL } ];
  function tile(g, t, i) {
    var u = t - (T.items[i] + .05 - .14); if (u < 0) return;
    var p = TILE[i], end = (i === 0 ? T.g0 + .1 : i < 4 ? T.items[i + 1] : T.top) - .02, out = 1 - eio(seg(t, end - .2, end));
    if (out <= 0) return;
    var k = eo(clamp(u / .14, 0, 1)), sc = lerp(1.4, 1, k) - .08 * knock(u, .12, 30, 8);
    var fx = p.x < MID ? -1 : p.x > MID ? 1 : 0;
    g.save(); void fx; var gl = i === 3 ? eio(seg(t, T.tc0 - .05, T.tc0 + .25)) : 1, px = lerp(MID, p.x, gl), py = lerp(880, p.y, gl); sc *= lerp(1.5, 1, gl);
    g.translate(px + Math.sin(t * 2.1 + i) * 4, py - 160 * (1 - k)); g.rotate(p.r * (1 + (1 - k) * 3) + osc(t, 11, i) * .02); g.scale(sc * out, sc * out); g.globalAlpha *= clamp(u / .05, 0, 1);
    shadowCard(g, -125, -125, 250, 250, p.c, 34);
    K.sticker(g, '#' + (5 - i), 0, 10, 168, { col: INK, lw: 0, shadow: false, wide: false });
    g.restore();
  }

  /* ---------- the dated paper card: one real-world fact per item ---------- */
  function dated(g, t, t0, x, y, year, sub, rot, out) {
    var u = t - t0; if (u < 0) return;
    var k = cd(t, t0, 15), o = out == null ? 1 : out; if (o <= 0) return;
    g.save(); g.translate(x, y - (1 - k) * 110); g.rotate((rot || 0) + (1 - k) * .25 + osc(t, 9, x) * .012); g.globalAlpha *= clamp(u / .08, 0, 1) * o;
    var w = 440, h = 120 + sub.length * 50 + 30;
    g.save(); g.beginPath();
    g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2);
    for (var j = 0; j <= 12; j++) g.lineTo(w / 2 - j * w / 12, h / 2 + (j % 2 ? 9 : -3));
    g.closePath(); g.fillStyle = 'rgba(0,0,0,.4)'; g.translate(8, 12); g.fill(); g.translate(-8, -12); g.fillStyle = PAPER; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.restore();
    K.sticker(g, year, 0, -h / 2 + 72, 116, { col: HOT, wide: false, lw: 0, shadow: false });
    sub.forEach(function (s, j) { K.sticker(g, s, 0, -h / 2 + 160 + j * 50, 40, { col: INK, wide: false, lw: 0, shadow: false, wt: 800 }); });
    g.restore();
  }

  /* ---------- the hero: our Easter egg, in the in-game egg's colours (purple, magenta and yellow stripes) ---------- */
  function eggPath(g, w, h) {
    g.beginPath();
    for (var i = 0; i <= 64; i++) { var a = i / 64 * TAU, s = Math.sin(a); g.lineTo(w * Math.cos(a) * (1 + .13 * s), h * s); }
    g.closePath();
  }
  function egg(g, t, x, y, s, rot) {
    var w = 270, h = 350;
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(rot);
    g.save(); g.translate(14, 22); eggPath(g, w, h); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill(); g.restore();
    eggPath(g, w, h); g.fillStyle = PURP; g.fill();
    g.save(); eggPath(g, w, h); g.clip();
    var ph = (t / DUR * Math.round(DUR * 140 / 250) * 250) % 250;   // loop-periodic, so the last frame matches frame 0
    for (var b = -3; b < 5; b++) {
      var yy = -h + b * 250 + ph;
      g.fillStyle = MAG; g.beginPath(); g.moveTo(-w * 1.3, yy); g.quadraticCurveTo(0, yy + 40, w * 1.3, yy); g.lineTo(w * 1.3, yy + 70); g.quadraticCurveTo(0, yy + 110, -w * 1.3, yy + 70); g.fill();
      g.fillStyle = YEL; g.beginPath(); g.moveTo(-w * 1.3, yy + 110); g.quadraticCurveTo(0, yy + 150, w * 1.3, yy + 110); g.lineTo(w * 1.3, yy + 132); g.quadraticCurveTo(0, yy + 172, -w * 1.3, yy + 132); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(-w * .38, -h * .4, w * .16, h * .3, -.35, 0, TAU); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(w * .5, h * .3, w * .6, h * .8, -.3, 0, TAU); g.fill();
    g.restore();
    eggPath(g, w, h); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
    g.restore();
  }
  function hookText(g, t, u, y0, s, from) {
    var pulse = 1 + osc(t, 14) * .015;
    g.save(); g.translate(MID, y0); g.scale(s * pulse, s * pulse);
    K.slam(g, 'A REAL', 0, 0, 150, u, { col: CREAM, rot: -.035, wide: false, from: from || 1.2 });
    var px = Math.min(150, 150 * 790 / K.measure(g, 'EASTER EGG?', 150, { wide: false }));
    K.slam(g, 'EASTER EGG?', 0, 160, px, u - .06, { col: YEL, rot: -.05, wide: false, from: from || 1.2 });
    g.restore();
  }
  /* the hook frame (frame 0 and the last frame): the egg turns, sparkles orbit, the words sit on top */
  function eggScene(g, t, fly) {
    var f = eio(fly);
    var x = lerp(MID, 830, f), y = lerp(990, 300, f), s = lerp(1.28, .12, f), rot = osc(t, 13) * .12 + f * 1.4;
    for (var i = 0; i < 5; i++) {
      var a = TAU * (i / 5) + TAU * 3 * t / DUR, r = 420 * s;
      var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 1.12;
      g.save(); g.globalAlpha *= 1 - f; g.fillStyle = [YEL, TEAL, HOT, CREAM, YEL][i]; K.star(g, px, py, 22 + 6 * Math.sin(t * 4 + i), 4, .4); g.fill(); g.restore();
    }
    egg(g, t, x, y + osc(t, 17) * 14 * s, s, rot);
  }

  /* ---------- footage: full width; each use carries its own band [y, h] ---------- */
  function footage(g, t, u, filter) {
    var y = u.band[0], h = u.band[1], pop = cd(t, u.t0, 16), s = lerp(.97, 1, pop);
    g.save(); g.translate(MID + 30, y + h / 2); g.scale(s, s); g.translate(-(MID + 30), -(y + h / 2));
    g.save(); g.beginPath(); g.rect(0, y, W, h); g.clip();
    if (filter) g.filter = filter;
    CLIP.draw(g, t, 0, y, W, h, u);
    g.filter = 'none';
    if (u.freeze != null && !u.noFx && t >= u.t0 + u.freeze) K.freezeFX(g, W, H, t - u.t0 - u.freeze);
    g.restore();
    g.fillStyle = INK; g.fillRect(0, y - 6, W, 8); g.fillRect(0, y + h - 2, W, 8);
    CLIP.credit(g, u, X0 + 10, y + h - 40);   // draws nothing for a creator clip: credit is in the description
    g.restore();
  }
  /* a point that follows something in the footage: key-framed in the cut's own seconds */
  function track(u, t, keys) {
    var local = Math.max(0, t - u.t0); if (u.freeze != null) local = Math.min(local, u.freeze);
    var src = u.from + local * u.speed;
    if (src <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (var i = 1; i < keys.length; i++) if (src <= keys[i][0]) { var k = seg(src, keys[i - 1][0], keys[i][0]); return [lerp(keys[i - 1][1], keys[i][1], k), lerp(keys[i - 1][2], keys[i][2], k)]; }
    var l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  function srcAt(u, t) { var local = Math.max(0, t - u.t0); if (u.freeze != null) local = Math.min(local, u.freeze); return u.from + local * u.speed; }
  function circleOn(g, t, u, nx, ny, rx, ry, col, seed, a0) {
    var p = CLIP.toScreen(u, t, nx, ny, 0, u.band[0], W, u.band[1]);
    g.save(); g.beginPath(); g.rect(0, u.band[0], W, u.band[1]); g.clip();
    K.scribble(g, p[0], p[1], rx, ry, eo(seg(t, a0, a0 + .45)), col, 12, seed);
    g.restore();
    return p;
  }
  function chipAt(g, s, x, y, bg, col, a, align) { if (a <= 0) return; g.save(); g.globalAlpha *= a; K.chip(g, s, x, y, 40, { bg: bg || YEL, col: col || INK, align: align }); g.restore(); }

  /* ---------- our drawings ---------- */
  function water(g, t, y0, y1, col, col2) {
    g.save(); g.beginPath(); g.rect(0, y0, W, y1 - y0); g.clip();
    g.fillStyle = col; g.fillRect(0, y0, W, y1 - y0);
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 6; g.lineCap = 'round';
    for (var r = 0; r < 6; r++) {
      var yy = y0 + 40 + r * (y1 - y0 - 40) / 6;
      g.beginPath();
      for (var x = -40; x <= W + 40; x += 24) { var y = yy + Math.sin(x * .025 + t * 2.6 + r * 1.3) * 9; if (x === -40) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    }
    g.fillStyle = col2; g.fillRect(0, y0, W, 14);
    g.restore();
  }
  function boat(g, t, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(Math.sin(t * 2.4) * .03);
    g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = INK;
    g.beginPath(); g.moveTo(-300, -40); g.lineTo(300, -60); g.lineTo(250, 40); g.quadraticCurveTo(0, 70, -260, 40); g.closePath(); g.fillStyle = CREAM; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-282, 2); g.lineTo(276, -12); g.lineTo(266, 12); g.lineTo(-272, 24); g.closePath(); g.fillStyle = '#2b6fd6'; g.fill();
    g.beginPath(); g.moveTo(-120, -44); g.lineTo(10, -50); g.lineTo(60, -120); g.lineTo(-60, -116); g.closePath(); g.fillStyle = '#9fe3ff'; g.fill(); g.stroke();
    rr(g, -150, -60, 210, 22, 8); g.fillStyle = '#d9d2c4'; g.fill(); g.stroke();
    rr(g, -330, -70, 44, 110, 10); g.fillStyle = '#3a3550'; g.fill(); g.stroke();
    /* the dash screen: the GPS, glowing teal */
    rr(g, -30, -100, 46, 34, 6); g.fillStyle = TEAL; g.fill(); g.lineWidth = 4; g.stroke();
    g.restore();
  }
  function dock(g, t, x, y) {
    g.save(); g.translate(x, y);
    g.fillStyle = '#9a6a3f'; g.strokeStyle = INK; g.lineWidth = 6;
    rr(g, -260, -24, 520, 48, 6); g.fill(); g.stroke();
    for (var p = 0; p < 5; p++) { rr(g, -240 + p * 115, 20, 26, 120, 6); g.fillStyle = '#6e4a2a'; g.fill(); g.stroke(); }
    g.fillStyle = '#6e4a2a'; rr(g, 150, -230, 22, 210, 6); g.fill(); g.stroke();
    g.save(); g.translate(161, -250); g.rotate(-.04 + Math.sin(t * 1.7) * .02);
    rr(g, -170, -54, 340, 108, 14); g.fillStyle = PAPER; g.fill(); g.stroke();
    K.sticker(g, "JASON'S PLACE", 0, 4, 40, { col: INK, wide: false, lw: 0, shadow: false });
    g.restore();
    g.restore();
  }
  function swimmer(g, t, x, y, u) {
    var bob = Math.sin(t * 3.3) * 10;
    g.save(); g.translate(x, y + bob);
    g.lineCap = 'round'; g.lineWidth = 16; g.strokeStyle = INK;
    var wv = Math.sin(t * 9) * .6;
    g.beginPath(); g.moveTo(-40, 10); g.lineTo(-110, -60 + wv * 30); g.stroke(); g.beginPath(); g.moveTo(40, 10); g.lineTo(110, -70 - wv * 30); g.stroke();
    g.beginPath(); g.arc(0, -30, 54, 0, TAU); g.fillStyle = '#f2c9a0'; g.fill(); g.lineWidth = 8; g.stroke();
    g.fillStyle = INK; g.beginPath(); g.arc(-18, -38, 7, 0, TAU); g.arc(18, -38, 7, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(0, -8, 12, 9, 0, 0, TAU); g.fill();
    g.restore();
    g.save(); g.beginPath(); g.rect(0, y + 10, W, 200); g.fillStyle = SEA; g.globalAlpha *= .65; g.fill(); g.restore();
    K.emote(g, '?', x + 150, y - 150, 1.6, u, t);
  }
  function car(g, t, x, y, s, spin) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = INK;
    g.beginPath(); g.moveTo(-330, 30); g.lineTo(-320, -30); g.quadraticCurveTo(-250, -60, -150, -66); g.quadraticCurveTo(-80, -130, 40, -128); g.quadraticCurveTo(140, -120, 210, -64); g.quadraticCurveTo(320, -54, 340, -10); g.lineTo(340, 30); g.closePath();
    g.fillStyle = GRN; g.fill(); g.stroke();
    g.save(); g.clip();
    g.fillStyle = '#2b6fd6'; g.beginPath(); g.moveTo(-330, 0); g.quadraticCurveTo(-120, -50, 60, 10); g.quadraticCurveTo(200, 50, 340, -20); g.lineTo(340, 8); g.quadraticCurveTo(200, 70, 60, 34); g.quadraticCurveTo(-120, -20, -330, 26); g.fill();
    g.restore();
    g.beginPath(); g.moveTo(-120, -70); g.quadraticCurveTo(-70, -116, 30, -116); g.lineTo(40, -70); g.closePath(); g.fillStyle = '#16314f'; g.fill(); g.lineWidth = 5; g.stroke();
    g.beginPath(); g.moveTo(60, -70); g.lineTo(54, -114); g.quadraticCurveTo(130, -108, 180, -70); g.closePath(); g.fill(); g.stroke();
    g.lineWidth = 8; g.beginPath(); g.moveTo(-300, -36); g.lineTo(-260, -78); g.lineTo(-210, -78); g.stroke();
    [-200, 210].forEach(function (wx) {
      g.save(); g.translate(wx, 40); g.beginPath(); g.arc(0, 0, 58, 0, TAU); g.fillStyle = INK; g.fill();
      g.beginPath(); g.arc(0, 0, 30, 0, TAU); g.fillStyle = '#c9cbd6'; g.fill();
      g.rotate(spin); g.strokeStyle = INK; g.lineWidth = 6; for (var k = 0; k < 5; k++) { g.rotate(TAU / 5); g.beginPath(); g.moveTo(0, 0); g.lineTo(26, 0); g.stroke(); }
      g.restore();
    });
    g.restore();
  }
  function knotPath(g, R) {
    /* our triquetra: three pointed lobes, each a lens from the centre outwards, plus the ring through them */
    for (var k = 0; k < 3; k++) {
      var a = -Math.PI / 2 + k * TAU / 3, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
      var tipx = ca * R * 1.25, tipy = sa * R * 1.25, bx = -ca * R * .35, by = -sa * R * .35, wv = R * .62;
      g.moveTo(bx, by);
      g.quadraticCurveTo(ca * R * .45 + px * wv, sa * R * .45 + py * wv, tipx, tipy);
      g.quadraticCurveTo(ca * R * .45 - px * wv, sa * R * .45 - py * wv, bx, by);
    }
  }
  function knot(g, t, x, y, R, k) {
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.rotate(osc(t, 6) * .05);
    g.lineCap = g.lineJoin = 'round';
    var L = R * 14;
    g.setLineDash([L * k, L]);
    g.beginPath(); knotPath(g, R); g.lineWidth = 34; g.strokeStyle = INK; g.stroke();
    g.lineWidth = 20; g.strokeStyle = '#4f8f86'; g.stroke();
    g.beginPath(); g.arc(0, 0, R * .62, -Math.PI / 2, -Math.PI / 2 + TAU * k); g.setLineDash([]); g.lineWidth = 30; g.strokeStyle = INK; g.stroke(); g.lineWidth = 16; g.strokeStyle = '#4f8f86'; g.stroke();
    g.restore();
  }
  function tower(g, t, x, base, hgt, climb) {
    g.save(); g.translate(x, base);
    g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = INK;
    g.beginPath(); g.moveTo(-150, 0); g.lineTo(-110, -hgt); g.lineTo(110, -hgt); g.lineTo(150, 0); g.closePath(); g.fillStyle = '#5b6a8c'; g.fill(); g.stroke();
    g.save(); g.clip();
    g.fillStyle = '#8fd3ff';
    for (var r = 0; r < hgt / 60; r++) for (var c = 0; c < 4; c++) { var lit = hash(r * 7 + c) > .55; g.globalAlpha = lit ? .9 : .35; g.fillRect(-100 + c * 52, -40 - r * 60, 34, 34); }
    g.globalAlpha = 1; g.restore();
    /* the striped mast, as in the clip */
    g.fillStyle = CREAM; g.fillRect(-26, -hgt - 260, 52, 260); g.strokeRect(-26, -hgt - 260, 52, 260);
    g.fillStyle = INK; for (var s = 0; s < 6; s++) g.fillRect(-26, -hgt - 250 + s * 44, 52, 14);
    /* the nest on the top ledge */
    g.save(); g.translate(78, -hgt - 18); g.strokeStyle = '#6e4a2a'; g.lineWidth = 7;
    for (var n = 0; n < 14; n++) { var a = hash(n + 3) * Math.PI; g.beginPath(); g.moveTo(-60 + hash(n) * 30, Math.sin(a) * 10); g.lineTo(60 - hash(n + 9) * 30, -Math.sin(a) * 14); g.stroke(); }
    g.restore();
    /* the climbing dot */
    var cy = -lerp(30, hgt + 10, climb);
    g.fillStyle = YEL; g.beginPath(); g.arc(-140 + 30 * climb, cy, 22, 0, TAU); g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    g.restore();
  }
  /* Atari's Adventure: a blocky room, the square walks through the wall into the hidden one */
  function atariRoom(g, t, x, y, k) {
    var B = 40;
    g.save(); g.translate(x, y);
    g.fillStyle = '#2d2a3e'; g.fillRect(-380, -200, 760, 400);
    g.fillStyle = '#e0a63c';
    g.fillRect(-380, -200, 760, B); g.fillRect(-380, 160, 760, B); g.fillRect(-380, -200, B, 400); g.fillRect(340, -200, B, 400);
    g.fillRect(-20, -200, B, 140); g.fillRect(-20, 60, B, 140);
    g.fillStyle = '#7a2fd6'; g.fillRect(20, -160, 320, 320);
    g.globalAlpha *= seg(k, .55, .75);
    K.sticker(g, 'SECRET', 180, -40, 52, { col: YEL, wide: false, lw: 0, shadow: false });
    K.sticker(g, 'ROOM', 180, 30, 52, { col: YEL, wide: false, lw: 0, shadow: false });
    g.restore();
    var sx = lerp(-260, 120, eio(seg(k, .1, .6))), sy = Math.sin(k * 12) * 6;
    g.save(); g.translate(x, y); g.fillStyle = CREAM; g.fillRect(sx - 22, sy - 22, 44, 44); g.restore();
  }

  /* ---------- beats ---------- */
  function beatHook(g, t) {
    var fly = seg(t, T.tease0 - .1, T.tease0 + .35);
    if (t >= T.tease0) {
      var u = U.tease, rev = eio(seg(t, T.tease0, T.tease0 + .3)), y = u.band[0], h = u.band[1];
      g.save(); g.beginPath(); g.rect(0, y + h * (1 - rev), W, h * rev); g.clip(); footage(g, t, u); g.restore();
      var e = track(u, t, [[1.83, .44, .83], [2.03, .33, .36], [2.23, .45, .35], [2.37, .475, .29], [2.47, .48, .3]]);
      circleOn(g, t, u, e[0], e[1], 120, 120, YEL, 4, T.tease0 + .25);
    }
    if (fly < 1) eggScene(g, t, fly);
    /* the hook words: big over the egg on frame 0, then they rise into the caption zone above the footage */
    var r = eio(seg(t, T.tease0 - .05, T.tease0 + .3)), a = 1 - seg(t, T.i5 - .2, T.i5);
    g.save(); g.globalAlpha *= a; hookText(g, t, t + 1, lerp(330, 200, r), lerp(1, .74, r)); g.restore();
  }
  function beatBoat(g, t) {
    /* #5: our boat glides in to a dock with JASON'S PLACE; 2013 card; the GPS clip takes the top from "GPS" */
    var inK = eio(seg(t, T.i5, T.boat + .5));
    if (t < T.g0) {
      g.save(); g.translate(0, (1 - cd(t, T.i5, 10)) * 300);
      water(g, t, 900, 1440, SEA, SEA2);
      dock(g, t, 560, 940);
      boat(g, t, lerp(1250, 450, inK), 960 + Math.sin(t * 2.4) * 6, 1.05);
      chipAt(g, 'HE SAYS', 721, 600, HOT, CREAM, seg(t, T.boat + .1, T.boat + .25), 'center');
      g.restore();
    } else {
      footage(g, t, U.gps);
      var p = circleOn(g, t, U.gps, .26, .33, 300, 210, YEL, 6, T.g0 + .3);
      chipAt(g, 'IN HIS CLIP', X0, BY + 70, HOT, CREAM, seg(t, T.g0, T.g0 + .1));
      chipAt(g, 'LOS SANTOS', X0, BY + 165, YEL, INK, seg(t, T.g0 + .15, T.g0 + .3));
      /* below the clip: our boat, its dash screen joined to the ring by a dotted line */
      water(g, t, 1180, 1440, SEA, SEA2);
      boat(g, t, 290, 1210, .62);
      var bx = 290 - 7 * .62, by = 1210 - 83 * .62;
      g.save(); g.setLineDash([14, 14]); g.lineDashOffset = -t * 60; g.strokeStyle = YEL; g.lineWidth = 6; g.globalAlpha *= seg(t, T.g0 + .4, T.g0 + .7);
      g.beginPath(); g.moveTo(bx, by - 16); g.lineTo(Math.max(160, p[0] - 120), U.gps.band[0] + U.gps.band[1] - 8); g.stroke(); g.restore();
    }
    dated(g, t, T.boat + .15, t < T.g0 ? 315 : 700, t < T.g0 ? 1290 : 1300, '2013', ['GTA 5 · MICHAEL', 'AND HIS BOAT'], .05, 1 - seg(t, T.i4 - .2, T.i4));
    tile(g, t, 0);
  }
  function beatDog(g, t) {
    if (t < T.d0) {
      var k = cd(t, T.i4, 10);
      g.save(); g.translate(0, (1 - k) * 400);
      water(g, t, 700, 1440, SEA, SEA2);
      for (var w = 0; w < 3; w++) { var cx = (t * 90 + w * 380) % 1300 - 110; g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(cx, 820 + w * 190, 60, 10, 0, 0, TAU); g.fill(); }
      g.save(); g.translate(470, 1040); g.scale(1.6, 1.6); g.translate(-470, -1040); swimmer(g, t, 470, 1040, t - T.q4); g.restore();
      g.restore();
    } else {
      footage(g, t, U.dog);
      var d = track(U.dog, t, [[0, .53, .45], [.33, .54, .55], [.67, .55, .56], [1.0, .56, .5], [1.33, .57, .5], [1.67, .59, .62]]);
      circleOn(g, t, U.dog, d[0], d[1], 150, 130, YEL, 8, T.d0 + .2);
    }
    tile(g, t, 1);
  }
  function road(g, t, y, mv) {
    g.save(); g.fillStyle = '#2a2440'; g.fillRect(0, y, W, 130); g.fillStyle = INK; g.fillRect(0, y, W, 8);
    g.fillStyle = YEL; for (var m = 0; m < 6; m++) g.fillRect(((m * 220 - mv) % 1320 + 1320) % 1320 - 120, y + 62, 110, 10); g.restore();
  }
  function beatCar(g, t) {
    /* #3: our green look-alike drives in on a road low in the frame; 2001 card top right; LOOK-ALIKE chip */
    var k = eo(seg(t, T.i3 + .1, T.i3 + 1.1));
    var cx = lerp(-420, 520, k), spin = (t - T.i3) * 14 * (1 - k * .8);
    road(g, t, 1250, t * 300 * (1 - k) + k * 300 * (T.brian + .25));
    if (k < .98) { g.save(); g.globalAlpha *= 1 - k; g.strokeStyle = CREAM; g.lineWidth = 8; g.lineCap = 'round'; for (var s = 0; s < 4; s++) { g.beginPath(); g.moveTo(cx - 380 - s * 30, 1090 + s * 40); g.lineTo(cx - 560 - s * 30, 1090 + s * 40); g.stroke(); } g.restore(); }
    car(g, t, cx, 1190 + Math.sin(t * 9) * 2, 1.05, spin);
    chipAt(g, 'LOOK-ALIKE', 520, 960, CREAM, INK, seg(t, T.brian + .1, T.brian + .25), 'center');
    dated(g, t, T.i3 + .45, 680, 620, '2001', ['THE FAST AND', 'THE FURIOUS'], .04);
    tile(g, t, 2);
  }
  function beatPlate(g, t) {
    footage(g, t, U.plate, 'brightness(1.9) contrast(1.15) saturate(1.1)');
    var p = CLIP.toScreen(U.plate, t, .5, .275, 0, BY, W, 760);
    var bk = eo(seg(t, T.p0 + .25, T.p0 + .6)), hit = knock(t, T.had, 1, 26, 7);
    g.save(); g.beginPath(); g.rect(0, BY, W, 760); g.clip();
    g.strokeStyle = YEL; g.lineWidth = 12 + 10 * Math.abs(hit); g.lineJoin = 'round'; var bw = 330 * bk * (1 + .08 * hit), bh = 180 * bk * (1 + .08 * hit);
    if (bk > 0) { rr(g, p[0] - bw / 2, p[1] - bh / 2, bw, bh, 18); g.stroke(); }
    g.restore();
    chipAt(g, 'LOOK-ALIKE', X0, BY + 70, CREAM, INK, 1);
    /* below the clip: our car from behind? no: the 2001 card stays, and the plate's words land as a stamp after the line */
    dated(g, t, T.p0 - .3, 330, 1300, '2001', ['THE FAST AND', 'THE FURIOUS'], -.04);
    stamp(g, 'HAD YOU', 712, 1300, 70, t - at('plate', 'had') + .02, YEL, -.1);
  }
  function beatTrinity(g, t) {
    var chipA = seg(t, at('trinity', 'trinity') - .05, at('trinity', 'trinity') + .1);
    if (t < T.tc0) { /* "Two:": the tile has the frame */ }
    else if (t < T.t1) {
      footage(g, t, U.tri);
      var kn = track(U.tri, t, [[0, .59, .11], [.66, .46, .19], [1.32, .28, .29]]);
      circleOn(g, t, U.tri, kn[0], kn[1], 120, 110, YEL, 11, T.tc0 + .2);
      chipAt(g, 'TRINITY APARTMENTS', X0, BY + 1048 - 300, YEL, INK, chipA);
    } else {
      var k = seg(t, T.t1, T.t1 + .7);
      g.save(); g.fillStyle = '#e9e3da'; g.globalAlpha *= cd(t, T.t1, 12); rr(g, 140, 470, 760, 600, 30); g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore();
      knot(g, t, 520, 760, 150, eio(k));
      chipAt(g, 'TRINITY APARTMENTS', 520, 1010, YEL, INK, 1, 'center');
      dated(g, t, T.t1, 330, 1290, '2009', ['DEXTER, SEASON 4'], -.05);
    }
    tile(g, t, 3);
  }
  function beatTower(g, t) {
    /* #1: the tower rises, the camera climbs it; "Up top" reaches the nest */
    var rise = eio(seg(t, T.i1, T.tall + .4)), climb = seg(t, T.tall, T.top + .6);
    var cam = eio(seg(t, T.tall + .2, T.top + .5));
    g.save(); g.beginPath(); g.rect(0, 380, W, 1080); g.clip();
    var z = lerp(1, 1.45, eio(seg(t, T.top - .1, T.ne0)));
    g.translate(680, 640); g.scale(z, z); g.translate(-680, -640);
    g.translate(0, cam * 760);
    g.save(); g.translate(680, 1440); g.scale(1.45, 1); g.translate(-680, -1440);
    tower(g, t, 680, 1440 + (1 - rise) * 900, 1300, climb);
    g.restore();
    g.restore();
    if (t > T.tall + .2) {
      var ck = cd(t, T.tall + .2, 14);
      g.save(); g.translate(300, 1250 + (1 - ck) * 120); g.rotate(-.05); g.globalAlpha *= ck;
      shadowCard(g, -200, -110, 400, 220, PAPER, 22);
      K.sticker(g, '5+ MIN', 0, -34, 92, { col: INK, wide: false, lw: 0, shadow: false });
      K.sticker(g, 'CLIMB · HE SAYS', 0, 56, 40, { col: HOT, wide: false, lw: 0, shadow: false, wt: 800 });
      /* a stopwatch hand sweeping on the card */
      var a = (t - T.tall) * 4;
      g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(150, -78, 26, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(150, -78); g.lineTo(150 + Math.sin(a) * 20, -78 - Math.cos(a) * 20); g.stroke();
      g.restore();
    }
    tile(g, t, 4);
  }
  function beatNest(g, t) {
    footage(g, t, U.nest);
    var s = srcAt(U.nest, t);
    if (s < 1.12) circleOn(g, t, U.nest, .74, .82, 170, 110, YEL, 12, T.ne0 + .15);
    else {
      var e = track(U.nest, t, [[1.13, .42, 1.0], [1.5, .42, .97], [1.67, .43, .92], [1.87, .44, .83], [1.93, .43, .7]]);
      circleOn(g, t, U.nest, e[0], e[1], 150, 140, YEL, 14, T.ne0 + .5);
    }
    stamp(g, 'EASTER EGG', MID, 640, 84, t - at('nest', 'easter') + .02, YEL, -.08);
  }
  function beatAtari(g, t) {
    var k = seg(t, T.at0, T.lp0 + .4);
    var lp = t >= T.lp0, gone = 1 - seg(t, T.back - .3, T.back - .05);
    if (gone > 0) {
      g.save(); g.globalAlpha *= cd(t, T.at0, 12) * gone; atariRoom(g, t, MID, 1130, k); g.restore();
      dated(g, t, T.at0 + .05, t >= T.y26 ? 315 : 510, 620, '1980', ['ATARI · ADVENTURE'], -.04, gone);
      chipAt(g, 'ATARI NAMED THEM', MID, 1395, YEL, INK, seg(t, T.atari + .1, T.atari + .25) * gone, 'center');
      if (t > T.y26) {
        dated(g, t, T.y26, 705, 640, '2026', [], .05, gone);
        K.slam(g, '+46 YEARS', MID, 860, 92, t - T.y26 - .1, { col: YEL, wide: false, rot: -.04, from: 1.3, out: T.back - .3 - T.y26 });
      }
    }
    /* the loop: our egg flies back in, the hook words return; the last frame is frame 0 */
    if (t >= T.back - .3) {
      var f = 1 - eio(seg(t, T.back - .3, T.back + .15));
      eggScene(g, t, f);
      hookText(g, t, t - T.back + .1, 330, 1, 1.0);
    }
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    backdrop(g, t);
    if (t < T.i5) beatHook(g, t);
    else if (t < T.i4) beatBoat(g, t);
    else if (t < T.d1) beatDog(g, t);
    else if (t < T.p0) beatCar(g, t);
    else if (t < T.i2) beatPlate(g, t);
    else if (t < T.i1) beatTrinity(g, t);
    else if (t < T.ne0) beatTower(g, t);
    else if (t < T.at0) beatNest(g, t);
    else beatAtari(g, t);
    [T.g0, T.d0, T.p0, T.i2, T.ne0].forEach(function (c) { K.flash(g, W, H, t - c, .22); });
    pill(g, t);
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
    /* stamps that repeat the caption word for word while it is spoken (HAD YOU, EASTER EGG) are punctuation, not reads */
    Tx('pill', 'GTA 6', 0, DUR + 1);
    Tx('hook', 'A REAL EASTER EGG?', 0, T.i5 - .05); Tx('hook', 'A REAL EASTER EGG?', T.back + .1, DUR + 1);
    Tx('top5', 'TOP 5 EASTER EGGS', T.search + .1, T.back - .2);
    Tx('y13', '2013 GTA 5 · MICHAEL AND HIS BOAT', T.boat + .25, T.i4 - .1);
    Tx('says', 'HE SAYS', T.boat + .2, T.g0);
    Tx('inclip', 'IN HIS CLIP', T.g0 + .1, T.i4);
    Tx('ls', 'LOS SANTOS', T.g0 + .25, T.i4);
    Tx('y01', '2001 THE FAST AND THE FURIOUS', T.i3 + .55, T.i2);
    Tx('look', 'LOOK-ALIKE', T.brian + .2, T.i2);
    Tx('triap', 'TRINITY APARTMENTS', at('trinity', 'trinity') + .05, T.i1 - .05);
    Tx('y09', '2009 DEXTER, SEASON 4', T.t1 + .1, T.i1);
    Tx('climb', '5+ MIN CLIMB · HE SAYS', T.tall + .3, T.ne0);
    Tx('y80', '1980 ATARI · ADVENTURE', T.at0 + .15, T.back - .15);
    Tx('named', 'ATARI NAMED THEM', T.atari + .2, T.back - .15);
    Tx('y26', '2026', T.y26 + .06, T.back - .1);
    return o;
  }

  /* ---------- safe-area check: every glyph box inside x 90-930 and above y 1450 ---------- */
  var BOUNDS = null, CURT = 0;
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS && g.globalAlpha > .05) {
        var mm = this.measureText(str), m = this.getTransform(), xs = [], ys = [];
        var x0 = x - mm.actualBoundingBoxLeft, x1 = x + mm.actualBoundingBoxRight, y0 = y - mm.actualBoundingBoxAscent, y1 = y + mm.actualBoundingBoxDescent;
        [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
        var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys), d = Math.min.apply(null, ys);
        if (d < H && (a < 89.5 || b > 930.5 || c > 1450.5)) BOUNDS.push({ t: CURT, text: str, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
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
      initTimes(); buildChunks(ctx);
      window.FILM.POSTER = T.tease0 + .75;   // the real egg in the air, circled, under A REAL EASTER EGG?
      window.FILM.SHOTS = [{ id: 'hook', name: 'The egg', t0: 0, t1: T.i5 }, { id: 'five', name: '#5 The boat', t0: T.i5, t1: T.i4 }, { id: 'four', name: '#4 The dog', t0: T.i4, t1: T.i3 }, { id: 'three', name: '#3 The car', t0: T.i3, t1: T.i2 }, { id: 'two', name: '#2 Trinity', t0: T.i2, t1: T.i1 }, { id: 'one', name: '#1 The tower', t0: T.i1, t1: T.at0 }, { id: 'loop', name: '1980', t0: T.at0, t1: DUR }];
      window.READY = true;
    });
  }
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1 }); r.to = b.t; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  window.CHUNKS_DEBUG = function () { return CHUNKS.map(function (c) { return c.rows.map(function (r) { return r.map(function (w) { return w.w; }).join(' '); }).join(' / '); }); };

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: 1.6, SLUG: 'gta-eastereggs', SHOTS: [], LIVE: {}, init: init, render: render, frame: frame, T: T };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
