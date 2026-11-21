/* "GTA 6 cops remember 4 things": GTA 6, Delta, trailer mode (SAFE-EDIT rule 7) + background plates (rule 11).
   Rockstar's own getaway in "An Extended Look" (rk721912, 841-991 s) plays in a clip card; a magnifier opens straight over
   the real wanted HUD (a sharp HUD crop of the same source range) and its four icons fly out of the lens into our own
   four-slot icon tray. Countdown 4 -> 1, each disc flies out of the real HUD again with its number. Then Rockstar's fix:
   the stars turn red, Lucia leaves the car and the real car icon blinks out on the frame our car disc cracks and falls,
   she burns it, three discs left. Dimmed plates of the same chase play under everything else.
   The last frame rebuilds frame 0 (full-bleed chase + COPS REMEMBER 4 THINGS).
   Pure function of t, keyed to the voice with at(id, word). Rail x 90-930, glyphs above y 1450.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx), BOUNDS_RUN. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, K = window.KIT, CLIP = window.CLIP;
  var BG = '#0c0e17', CREAM = '#fbf0ea', RED = '#e0303a', DRED = '#8f1d26', INK = '#14101c', BLUE = '#3d7bff';
  var TAU = Math.PI * 2;
  var X0 = 90, X1 = 930, MID = 510, CAPY = 212, PILLY = 100;
  var CARD = [0, 400, W, 720];                    // the footage card, y 400-1120
  var FULL = [0, 0, W, H];
  var HUDR = [1620 / 1920, 0, 300 / 1920, 140 / 1080];   // the HUD crop, normalized to the source frame (same as the hud* cuts)
  var ICX = [.513, .625, .737, .85], ICY = .571;          // icon centres inside the HUD crop
  var STX = [.243, .36, .483, .6, .72, .838], STY = .314; // star centres inside the HUD crop (first two dim)
  var LAB = ['TWO OF YOU', 'CLOTHES', 'LOOKS', 'CAR'];
  var ORDER = ['four', 'three', 'two', 'one'];            // the countdown line that lights each slot

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function knock(t, a, amp, f, d) { if (t < a) return 0; var u = t - a; return (amp || 1) * Math.exp(-u * (d || 6)) * Math.sin(u * (f || 22)); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function lerpR(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)]; }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word < 0 ? l.words.length + word : word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function wend(id, word, nth) { return find(id, word, nth).t1; }
  function start(id) { return LINE[id].words[0].t0; }
  function lastw(id) { var w = LINE[id].words; return w[w.length - 1].t1; }
  var VAD = window.VAD || [];
  function silAfter(t) { for (var i = 0; i < VAD.length; i++) if (VAD[i][1] > t + .05) return VAD[i]; return [t + .1, t + .4]; }

  /* ---------- times ---------- */
  var T = {}, EV = [], U = {};
  function ev(t, type, g, extra) { var e = { t: t, type: type, g: g == null ? 1 : g }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
  function initTimes() {
    EV.length = 0; CLIP.reset();
    /* hook: full-bleed chase -> card -> lens on the HUD -> four icons fly into the tray */
    T.shrink0 = .22; T.shrink1 = .62;
    T.lens0 = .66; T.lens1 = 1.0;
    T.fly0 = Math.max(1.25, at('hook', 'four') - .1); T.fly1 = T.fly0 + .55;   // the discs leave the lens on "four"
    T.hookOut = start('proof') - .12; T.hookCard = T.fly1 + .08;   // the chase card closes once the discs have landed
    /* proof: tray up to the centre over the helicopter plate */
    T.p0 = start('proof'); T.pEnd = start('four') - .12;
    /* countdown: number slams on the spoken number, clip card opens, lens, the disc flies out of it */
    T.n = []; T.c0 = []; T.c1 = []; T.fly = [];
    ORDER.forEach(function (id, i) {
      T.n[i] = start(id) - .03;
      T.c0[i] = LINE[id].words[1].t0 - .12;
      var nxt = i < 3 ? start(ORDER[i + 1]) : start('question');
      if (id === 'two') nxt = start('masked');
      T.c1[i] = Math.min(T.c0[i] + 1.22, nxt - .1);
      T.fly[i] = T.c1[i] - .5;
    });
    /* masked: all ours */
    T.m0 = start('masked'); T.mh = T.m0 - .4; T.band = at('masked', 'on') - .05; T.lit = at('masked', 'still') - .03; T.mEnd = start('one') - .08;
    /* question: all ours */
    T.q0 = T.c1[3]; T.shake = at('question', 'shake') - .02; T.qEnd = start('red') - .1;
    /* red */
    T.r0 = at('red', 'stars') - .35; T.redW = at('red', 'red');
    /* leave: the real car icon vanishes 1.767 s into the icondrop cut (frame 54, 957.07 s), in the breath after "car."
       (Whisper ends words ~0.15 s early here: "car." really ends at ~22.15 s on the voice track) */
    T.vanish = clamp(wend('leave', 'car') + .22, wend('leave', 'car') + .05, at('leave', 'its') - .04);
    T.l0 = T.vanish - 1.767 + .55;                       // from .55 s into the cut: the car is parked, the door about to open
    T.r1 = Math.min(T.l0 - .5, silAfter(wend('red', 'red') - .1)[0] + .25);   // the red card runs past the end of "red."; a beat of ours before the next card
    T.lens2 = T.l0 + .35;
    T.lEnd = T.vanish + .9;
    /* burn: ignition (1.62 s into the cut) on the hit after "burns it" */
    T.ign = Math.max(silAfter(wend('burn', 'it') - .1)[0] + .05, start('burn') + 1.0);
    T.b0 = T.ign - 1.0; T.b1 = Math.min(start('loop') - .06, T.ign + .55);
    /* loop */
    T.v0 = Math.max(T.b1 + .3, at('loop', 'remember') - .1); T.three = at('loop', 'three'); T.left = T.vanish + .8; T.back = DUR - .55;
    T.v1 = T.back;

    /* foreground evidence uses (each under 4.9 s, a note on each) */
    U.hook = CLIP.use('hud4', 0, T.hookCard, { from: .6, zoom: [1, 1], focus: [.62, .5], note: 'frame 0: Jason fires from the car, 4 white stars; shrinks into the card, lens opens on the HUD, its 4 icons fly into our tray' });
    U.hookHud = CLIP.use('hudhook', T.lens0, T.hookCard, { from: .6 + T.lens0, zoom: [1, 1], note: 'sharp HUD crop of the same range inside the lens: 4 white stars, couple, hanger, description, car' });
    var Z = [
      { clip: 'duo2', from: .5, focus: [.72, .5], note: 'four: both of them lean out of the getaway car windows, a ring on each, lens on the couple icon' },
      { clip: 'clothes', from: .3, focus: [.72, .5], note: 'three: Jason leans out firing, ring on his shirt, lens on the hanger icon' },
      { clip: 'looks', from: .2, focus: [.72, .5], note: 'two: Jason close in a bandana, ring on his face, lens on the description icon (lit while masked)' },
      { clip: 'car', from: .2, focus: [.72, .5], note: 'one: the getaway car out of the tunnel, ring on the car, lens on the car icon' }
    ];
    Z.forEach(function (z, i) {
      var len = CLIP.manifest().clips[z.clip].frames / 30 - .05, d = T.c1[i] - T.c0[i];
      U['c' + i] = CLIP.use(z.clip, T.c0[i], T.c1[i], { from: Math.min(z.from, Math.max(0, len - d)), speed: Math.min(1, len / d), zoom: [1.02, 1.08], focus: z.focus, note: z.note });
    });
    U.red = CLIP.use('red', T.r0, T.r1, { from: Math.max(0, 3.45 - (T.r1 - T.r0)), speed: 1, zoom: [1.02, 1.1], focus: [.72, .5], note: 'red: the getaway car drives into the parking garage, lens on the real stars, now red; our star row flips white to red on "red"' });
    U.redHud = CLIP.use('hudred', T.redW - .25, T.r1, { from: U.red.from + (T.redW - .25 - T.r0), note: 'sharp HUD crop in the lens: four red stars' });
    U.drop = CLIP.use('icondrop', T.l0, T.lEnd, { from: .55, speed: 1, freeze: T.vanish - T.l0 + .45, zoom: [1.02, 1.06], focus: [.72, .5], note: 'leave: Lucia parks, opens the door, gets out; the real car icon vanishes (957.07 s) on the frame our car disc cracks' });
    U.dropHud = CLIP.use('huddrop', T.lens2, T.lEnd, { from: .55 + (T.lens2 - T.l0), freeze: T.vanish - T.lens2 + .45, note: 'sharp HUD crop in the big lens: car icon present, then gone' });
    U.burn = CLIP.use('burn', T.b0, T.b1, { from: Math.max(0, 1.62 - (T.ign - T.b0)), speed: 1, freeze: T.ign - T.b0 + .3, zoom: [1.0, 1.1], focus: [.6, .5], note: 'burn: Lucia throws the Molotov, the car catches fire (held), BURNED chip' });
    U.van = CLIP.use('van', T.v0, T.v1, { from: .4, speed: 1, zoom: [1.02, 1.1], focus: [.72, .5], note: 'loop: the van drives off, lens on three red icons left, 3 LEFT' });
    U.vanHud = CLIP.use('hudvan', T.v0 + .3, T.v1, { from: .7, speed: 1, note: 'sharp HUD crop in the lens: red stars, couple, hanger, description; no car' });
    U.end = CLIP.use('hud4', T.back, DUR + .001, { from: .6 - (DUR - T.back) + 1 / 30, zoom: [1, 1], focus: [.62, .5], note: 'loop: the card grows back into the frame-0 chase' });

    /* background plates (rule 11): dimmed, under everything, each under 4.9 s, a new range each */
    function plate(name, a, b, from) { if (b - a < .3) return; var len = CLIP.manifest().clips[name].frames / 30 - .05; U[name] = CLIP.use(name, a, Math.min(b, a + 4.85, a + len - (from || 0)), { plate: true, from: from || 0, zoom: [1.05, 1.12], focus: [.5, .5] }); }
    plate('p1heli', T.hookCard, T.hookCard + 3.4, 0);
    plate('p4palms', T.hookCard + 3.4, T.c1[1] + .02, 0);
    plate('p5cross', T.c1[1] + .02, T.c1[2], 0);
    plate('p3alley', T.mEnd, T.q0, .3);
    plate('p2flip', T.qEnd, T.r1, 0);
    plate('p6load', T.b0, T.b1, 0);
    plate('p7out', T.b1, T.back, 3.3 - (T.back - T.b1) - .05);

    /* sound: short hits in the voice's silences where one is near */
    ev(.02, 'whoosh', .5, { d: .4 });
    ev(T.shrink0, 'swish', .55); ev(T.lens0 + .02, 'shutter', .7);
    for (var i = 0; i < 4; i++) ev(T.fly0 + i * .09, 'pop', .6);
    ev(T.fly1, 'thud', .55);
    ev(T.p0 + .05, 'swish', .45);
    for (i = 0; i < 4; i++) {
      ev(T.n[i] + .01, 'slam', .75);
      ev(T.c0[i], 'swish', .45);
      ev(T.c0[i] + .3, 'shutter', .45);
      ev(T.fly[i], 'zip', .55);
      ev(T.fly[i] + .38, 'thud', .6);
    }
    ev(T.band, 'swish', .6); ev(T.band + .22, 'thud', .5); ev(T.lit, 'slam', .8);
    ev(T.q0 + .05, 'whoosh', .5); ev(T.shake, 'ratchet', .7, { t1: T.shake + .45 });
    ev(T.r0, 'swish', .45);
    for (i = 0; i < 4; i++) ev(T.redW + .05 + i * .06, 'tick', .6);
    ev(T.redW + .3, 'thud', .5);
    ev(T.l0, 'swish', .45); ev(T.lens2, 'shutter', .6);
    ev(T.vanish, 'scratch', .9); ev(T.vanish + .04, 'slam', .9); ev(T.vanish + .55, 'thud', .5);
    ev(T.ign - .65, 'whoosh', .5, { d: .4 }); ev(T.ign, 'slam', 1); ev(T.ign + .02, 'whoosh', .8, { d: .7 });
    ev(T.left, 'thud', .6); ev(T.v0, 'swish', .45); ev(silAfter(wend('loop', 'three') - .1)[0] + .02, 'slam', .8);
    ev(T.back - .02, 'whoosh', .55); ev(T.back + .3, 'slam', .55);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  /* ---------- captions: phrase cards of 2-4 words; never end a card on a weak word ---------- */
  var CHUNKS = [], CPX = 92;
  var WEAK = { a: 1, an: 1, the: 1, is: 1, to: 1, in: 1, by: 1, you: 1, of: 1, for: 1, this: 1, and: 1, its: 1, on: 1, from: 1, at: 1, own: 1, are: 1, that: 1, how: 1, do: 1, out: 1, only: 1, theres: 1, what: 1, they: 1, your: 1 };
  var HOTW = { icons: 1, rockstars: 1, chase: 1, two: 1, clothes: 1, look: 1, like: 1, still: 1, lit: 1, car: 1, shake: 1, red: 1, gone: 1, burns: 1, three: 1, sight: 1, masks: 1 };
  function buildChunks(g) {
    var GAP = CPX * .3;
    function wd(w) { return K.measure(g, w.w, CPX, { wide: false }); }
    function width(c) { return c.reduce(function (a, w) { return a + wd(w); }, 0) + GAP * (c.length - 1); }
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
      var lw = l.words; if (/^(one|two|three|four)$/.test(norm(lw[0].w)) && /:$/.test(lw[0].w)) lw = lw.slice(1);
      var ws = lw.map(function (w) { return { w: w.w.replace(/[,:]$/, '').toUpperCase(), raw: w.w, t0: w.t0, t1: w.t1, hot: !!HOTW[norm(w.w)] }; });
      var phrases = [], cur = [];
      ws.forEach(function (w) { cur.push(w); if (/[.?!,:]$/.test(w.raw)) { phrases.push(cur); cur = []; } });
      if (cur.length) phrases.push(cur);
      /* merge a short phrase into the next one on the same line ("Masks on." stays alone: it is its own beat) */
      var cards = [];
      phrases.forEach(function (ph) {
        var n = ph.length <= 5 ? 1 : Math.ceil(ph.length / 4), base = Math.floor(ph.length / n), extra = ph.length % n, sizes = [];
        for (var i = 0; i < n; i++) sizes.push(base + (i < extra ? 1 : 0));
        var k = 0, parts = sizes.map(function (z) { var p = ph.slice(k, k + z); k += z; return p; });
        for (var m = 0; m < parts.length - 1; m++) while (parts[m].length > 1 && WEAK[norm(parts[m][parts[m].length - 1].w)]) parts[m + 1].unshift(parts[m].pop());
        parts.forEach(function (p) { cards.push(p); });
      });
      cards.forEach(function (c) {
        if (width(c) <= 820 || c.length === 1) c.rows = [c];
        else {
          var best = null;
          for (var b = 1; b < c.length; b++) { var a1 = c.slice(0, b), a2 = c.slice(b), sc = Math.max(width(a1), width(a2)) + (WEAK[norm(a1[a1.length - 1].w)] ? 120 : 0); if (!best || sc < best.sc) best = { sc: sc, r: [a1, a2] }; }
          c.rows = best.r;
        }
        c.line = l.id; CHUNKS.push(c);
      });
    });
    CHUNKS.forEach(function (c, i) { var nx = CHUNKS[i + 1]; c.t0 = c[0].t0 - .05; c.t1 = nx ? Math.min(nx[0].t0 - .1, c[c.length - 1].t1 + .6) : Math.min(c[c.length - 1].t1 + .4, T.back - .05); });
  }
  function captions(g, t) {
    if (t < T.hookOut || t > T.back - .05) return;
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (t < c.t0 || t >= c.t1) continue;
      var k = eo(seg(t, c.t0, c.t0 + .12)), out = 1 - seg(t, c.t1 - .06, c.t1), gap = CPX * .3, n = c.rows.length;
      g.save(); g.globalAlpha *= k * out;
      c.rows.forEach(function (row, r) {
        var ws = row.map(function (w) { return K.measure(g, w.w, CPX, { wide: false }); });
        var tw = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (row.length - 1), x = MID - tw / 2, s = Math.min(1, 820 / tw);
        var y = (n === 1 ? CAPY + 50 : CAPY + r * 100) + (1 - k) * 20;
        g.save(); g.translate(MID, y); g.scale(s, s); g.translate(-MID, -y);
        row.forEach(function (w, j) {
          var on = t >= w.t0 && t < w.t1 + .05;
          K.sticker(g, w.w, x + ws[j] / 2, y + (on ? -6 : 0), CPX, { col: w.hot ? RED : CREAM, wide: false, lw: CPX * .17 });
          x += ws[j] + gap;
        });
        g.restore();
      });
      g.restore();
      return;
    }
  }

  /* ---------- the set: ink, police-light sweeps, a dimmed plate of the chase ---------- */
  function backdrop(g, t) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    /* slow red / blue light sweeps, like a light bar on a wall */
    var ph = t * 1.6, a = .5 + .5 * Math.sin(ph), b = .5 + .5 * Math.sin(ph + Math.PI);
    var gr = g.createRadialGradient(150 + 120 * Math.sin(t * .7), 760, 40, 150, 760, 900);
    gr.addColorStop(0, 'rgba(224,48,58,' + (.22 * a) + ')'); gr.addColorStop(1, 'rgba(224,48,58,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    gr = g.createRadialGradient(930 - 120 * Math.sin(t * .7), 1100, 40, 930, 1100, 900);
    gr.addColorStop(0, 'rgba(61,123,255,' + (.2 * b) + ')'); gr.addColorStop(1, 'rgba(61,123,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    /* the plate on top of the sweeps, dimmed and soft */
    CLIP.plate(g, t, 0, 0, W, H, { dim: .52, blur: 3 });
  }
  function pill(g) {
    g.save(); K.measure(g, 'GTA 6', 64, { wide: false });
    rr(g, X0, PILLY - 46, 232, 92, 46); g.fillStyle = RED; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    K.sticker(g, 'GTA 6', X0 + 116, PILLY + 2, 64, { col: CREAM, wide: false, lw: 0, shadow: false });
    g.restore();
  }
  function chipAt(g, s, x, y, bg, col, a, align, px) { if (a <= 0) return; g.save(); g.globalAlpha *= a; K.chip(g, s, x, y, px || 34, { bg: bg || RED, col: col || CREAM, align: align }); g.restore(); }

  /* ---------- our icons: cut-paper discs, drawn in a ±100 box ---------- */
  function headShoulders(g, x, y, s) {
    g.beginPath(); g.arc(x, y - 30 * s, 24 * s, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x - 44 * s, y + 40 * s); g.quadraticCurveTo(x - 44 * s, y + 2 * s, x, y + 2 * s); g.quadraticCurveTo(x + 44 * s, y + 2 * s, x + 44 * s, y + 40 * s); g.closePath(); g.fill();
  }
  function pict(g, t, i, bandana) {
    g.save(); g.fillStyle = CREAM; g.strokeStyle = CREAM; g.lineCap = g.lineJoin = 'round';
    if (i === 0) {          // two of you: two heads, the back one offset
      g.save(); g.globalAlpha *= .8; headShoulders(g, -20, -4, .9); g.restore();
      g.save(); g.strokeStyle = DRED; g.lineWidth = 9; g.beginPath(); g.arc(16, -22, 26, 0, TAU); g.stroke(); g.restore();
      headShoulders(g, 16, 8, .95);
      g.save(); g.fillStyle = RED; g.fillRect(-60, 46, 120, 30); g.restore();
    } else if (i === 1) {   // clothes: a hanger
      g.lineWidth = 9; g.beginPath(); g.arc(0, -40, 13, Math.PI, Math.PI * 2.4); g.stroke();
      g.beginPath(); g.moveTo(0, -27); g.lineTo(0, -16); g.lineTo(-52, 26); g.lineTo(52, 26); g.lineTo(0, -16); g.stroke();
    } else if (i === 2) {   // looks: head and shoulders (optionally a bandana)
      headShoulders(g, 0, 4, 1.15);
      g.save(); g.fillStyle = RED; g.fillRect(-60, 50, 120, 30); g.restore();
      if (bandana > 0) {
        g.save(); g.translate(0, lerp(-90, 0, eo(bandana))); g.globalAlpha *= clamp(bandana * 3, 0, 1);
        g.fillStyle = '#e66b8a'; g.strokeStyle = INK; g.lineWidth = 3;
        g.beginPath(); g.moveTo(-27, -30); g.lineTo(27, -30); g.lineTo(18, -12); g.lineTo(0, -4); g.lineTo(-18, -12); g.closePath(); g.fill(); g.stroke();
        g.fillStyle = CREAM; for (var d = 0; d < 5; d++) { g.beginPath(); g.arc(-16 + d * 8, -24 + (d % 2) * 7, 2.2, 0, TAU); g.fill(); }
        g.restore();
      }
    } else {                // car: front view
      g.beginPath(); g.roundRect(-50, -12, 100, 40, 12); g.fill();
      g.beginPath(); g.moveTo(-36, -12); g.lineTo(-26, -40); g.lineTo(26, -40); g.lineTo(36, -12); g.closePath(); g.fill();
      g.fillStyle = RED; g.beginPath(); g.moveTo(-26, -15); g.lineTo(-19, -33); g.lineTo(19, -33); g.lineTo(26, -15); g.closePath(); g.fill();
      g.beginPath(); g.arc(-32, 6, 8, 0, TAU); g.arc(32, 6, 8, 0, TAU); g.fill();
      g.fillStyle = CREAM; g.fillRect(-46, 26, 18, 14); g.fillRect(28, 26, 18, 14);
    }
    g.restore();
  }
  /* a disc at (x, y), radius r; lit 0..1 (red) vs dim; crack 0..1 */
  function disc(g, t, i, x, y, r, o) {
    o = o || {};
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot);
    var s = r / 100;
    g.save(); g.globalAlpha *= .5; g.beginPath(); g.arc(7 * s, 11 * s, r, 0, TAU); g.fillStyle = '#000'; g.fill(); g.restore();
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = o.dim ? '#3a2a33' : RED; g.fill();
    g.lineWidth = Math.max(4, 9 * s); g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.arc(0, 0, r * .84, 0, TAU); g.lineWidth = Math.max(2, 4 * s); g.strokeStyle = o.dim ? 'rgba(251,240,234,.18)' : 'rgba(251,240,234,.35)'; g.stroke();
    g.save(); g.scale(s * 1.05, s * 1.05); if (o.dim) g.globalAlpha *= .45; pict(g, t, i, o.bandana || 0); g.restore();
    if (o.crack > 0) {
      g.save(); g.strokeStyle = INK; g.lineWidth = 10 * s; g.lineCap = g.lineJoin = 'round'; g.beginPath();
      var pts = [[-70, -70], [-25, -30], [-40, 5], [10, 20], [-5, 55], [40, 75]], n = Math.max(1, Math.round(eo(o.crack) * (pts.length - 1)));
      g.moveTo(pts[0][0] * s, pts[0][1] * s); for (var k = 1; k <= n; k++) g.lineTo(pts[k][0] * s, pts[k][1] * s);
      g.stroke(); g.restore();
    }
    if (o.num) {
      var u = o.numU, sc = u < .14 ? lerp(2.2, 1, eo(u / .14)) : 1 - .08 * knock(u, .14, 1, 26, 7);
      g.save(); g.translate(-r * .78, -r * .78); g.scale(sc, sc);
      g.beginPath(); g.arc(0, 0, 38 * Math.max(.7, s), 0, TAU); g.fillStyle = CREAM; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
      K.sticker(g, o.num, 0, 3, 54 * Math.max(.7, s), { col: INK, wide: false, lw: 0, shadow: false });
      g.restore();
    }
    g.restore();
  }

  /* ---------- the tray (our HUD): six stars and four discs ---------- */
  function trayGeo(t) {
    /* 0 = bottom under the card, 1 = up in the middle (proof, question, loop end) */
    var up = Math.max(eio(seg(t, T.hookOut - .05, T.hookOut + .3)) * (1 - eio(seg(t, T.pEnd - .12, T.pEnd + .2))),
      eio(seg(t, T.q0, T.q0 + .3)) * (1 - eio(seg(t, T.qEnd - .15, T.qEnd + .15))));
    return { y: lerp(1290, 800, up), sp: lerp(200, 205, up), r: lerp(78, 92, up), up: up };
  }
  function slotPos(i, n, G) { return [MID - (n === 3 ? 95 : 0) + (i - (n - 1) / 2) * G.sp, G.y]; }
  function carGone(t) { return t >= T.vanish && t < T.back + .2; }
  function trayN(t) { return carGone(t) ? 3 : 4; }
  /* where slot i sits; after the car falls, three discs slide to the centre */
  function slotAt(i, t, G) {
    var k = eio(seg(t, T.vanish + .35, T.vanish + .75));
    if (t >= T.back) k = 1;
    var a = slotPos(i, 4, G), b = slotPos(i, 3, G);
    return i < 3 ? [lerp(a[0], b[0], k), a[1]] : a;
  }
  function stars(g, t, x, y, sz, redK, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    for (var i = 0; i < 6; i++) {
      var sx = x + (i - 2.5) * sz * 1.25, lit = i >= 2, kr = lit ? eo(seg(t, T.redW + (i - 2) * .06, T.redW + (i - 2) * .06 + .12)) : 0;
      if (t >= T.back) kr = 0;
      var pop = lit ? 1 + .25 * knock(t, T.redW + (i - 2) * .06, 1, 24, 7) : 1;
      g.save(); g.translate(sx, y); g.scale(pop, pop);
      K.star(g, 0, 0, sz * .5, 5, .45);
      g.fillStyle = !lit ? '#2a2633' : (redK && kr > .5 ? RED : CREAM); g.fill();
      g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
      g.restore();
    }
    g.restore();
  }
  function lit(i, t) { return t >= T.fly[i] + .38 || (t >= T.fly1 && t < T.n[0]); }
  function tray(g, t) {
    if (t < T.fly1 - .02 && t > T.shrink0) {
      /* the empty tray waits under the card for the four icons */
      var ea = seg(t, T.shrink1 - .1, T.shrink1 + .2), G0 = trayGeo(t);
      g.save(); g.globalAlpha *= ea;
      stars(g, t, MID, G0.y - G0.r - 70, 54, false, .5);
      for (var e = 0; e < 4; e++) { var q = slotPos(e, 4, G0); g.save(); g.setLineDash([12, 10]); g.lineDashOffset = -t * 30; g.lineWidth = 5; g.strokeStyle = 'rgba(251,240,234,.45)'; g.beginPath(); g.arc(q[0], q[1], G0.r, 0, TAU); g.stroke(); g.restore(); }
      g.restore();
      return;
    }
    if (t < T.fly1 - .02 || t >= T.back + .25) return;
    var G = trayGeo(t), out = 1 - eio(seg(t, T.back, T.back + .25));
    g.save(); g.globalAlpha *= out; g.translate(0, (1 - out) * 300);
    /* our star row above the discs (not during the masked hero beat) */
    var masked = t >= T.mh && t < T.mEnd;
    stars(g, t, MID, G.y - G.r - 70, 54, true, masked ? .25 : 1);
    var n = trayN(t);
    for (var i = 0; i < 4; i++) {
      if (masked && i === 2) { var p0 = slotAt(i, t, G); g.save(); g.setLineDash([10, 10]); g.lineWidth = 4; g.strokeStyle = 'rgba(251,240,234,.4)'; g.beginPath(); g.arc(p0[0], p0[1], G.r, 0, TAU); g.stroke(); g.restore(); continue; }
      if (flying(i, t)) continue;
      var p = slotAt(i, t, G), r = G.r, on = lit(i, t);
      if (i === 3 && t >= T.vanish) { fallingCar(g, t, p, r); continue; }
      /* countdown pop when the disc lands; proof: the discs pulse in turn; question: shake */
      var land = knock(t, T.fly[i] + .38, 1, 24, 6), pr = 0;
      if (t >= T.p0 && t < T.pEnd) pr = Math.max(0, Math.sin((t - T.p0) * 4 - i * .9)) * .08;
      var sh = t >= T.shake && t < T.qEnd ? Math.sin(t * 46 + i * 2) * 9 * (1 - seg(t, T.shake + .5, T.qEnd)) : 0;
      var z = 1 + .12 * land + pr;
      var num = t >= T.fly[i] + .3 && t < T.r0 ? String(4 - i) : null;
      disc(g, t, i, p[0] + sh, p[1] + Math.abs(sh) * .3, r * z, { dim: !on, rot: sh * .01, num: num, numU: t - T.fly[i] - .3 });
      if (i === 2 && t >= T.mEnd && t < T.r0) chipAt(g, 'STILL LIT', p[0], p[1] - r - 8, CREAM, RED, seg(t, T.mEnd, T.mEnd + .1) * (1 - seg(t, T.r0 - .1, T.r0)), 'center', 22);
      /* the label under each disc */
      var la = (on ? 1 : .5) * (1 - seg(t, T.vanish, T.vanish + .2));
      g.save(); g.globalAlpha *= la * (masked ? .35 : 1);
      K.sticker(g, LAB[i], p[0], p[1] + r + 40, 30, { fam: '"Geist Mono", monospace', wt: 700, col: CREAM, wide: false, lw: 6 });
      g.restore();
    }
    if (n === 3 && t >= T.left && t < T.back) {
      var u = t - T.left;
      g.save(); g.translate(X1 - 114, G.y); g.rotate(-.06);
      var sc = u < .14 ? lerp(1.8, 1, eo(u / .14)) : 1 - .06 * knock(u, .14, 1, 26, 7) - .14 * knock(t, T.three, 1, 22, 6); g.scale(sc, sc); g.globalAlpha *= clamp(u / .05, 0, 1);
      rr(g, -98, -44, 196, 88, 16); g.fillStyle = CREAM; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
      K.sticker(g, '3 LEFT', 0, 4, 50, { col: RED, wide: false, lw: 0, shadow: false });
      g.restore();
    }
    g.restore();
  }
  /* the car disc: cracks on the vanish frame, hangs, then drops out of the tray */
  function fallingCar(g, t, p, r) {
    var u = t - T.vanish; if (u > 1.2) return;
    var fall = Math.max(0, u - .32), y = p[1] + 1700 * fall * fall, rot = fall * 3;
    disc(g, t, 3, p[0] - fall * 60, y, r * (1 + .1 * knock(t, T.vanish, 1, 30, 8)), { crack: seg(u, 0, .12), rot: rot });
  }

  /* ---------- flights: a disc leaves the lens and lands in its slot ---------- */
  var FLY = [];   // [i] = {t0, t1, from: fn(t) -> [x,y,r]}
  function flying(i, t) { var f = curFlight(i, t); return !!f; }
  function curFlight(i, t) {
    if (t >= T.fly0 + i * .09 && t < T.fly1 + i * .09 - .09 + .02 && t < T.fly1) return { t0: T.fly0 + i * .09, t1: T.fly1, src: 'hook' };
    if (t >= T.fly[i] && t < T.fly[i] + .38) return { t0: T.fly[i], t1: T.fly[i] + .38, src: 'item' };
    return null;
  }
  function flights(g, t) {
    var G = trayGeo(t);
    for (var i = 0; i < 4; i++) {
      var f = curFlight(i, t); if (!f) continue;
      var k = eio(seg(t, f.t0, f.t1)), a, r0;
      if (f.src === 'hook') { var L = lensRect(t, 'hook'); a = [L[0] + ICX[i] * L[2], L[1] + ICY * L[3]]; r0 = L[3] * .095; }
      else { var L2 = lensRect(t, 'item', i); a = [L2[0] + ICX[i] * L2[2], L2[1] + ICY * L2[3]]; r0 = L2[3] * .095; }
      var b = slotAt(i, t, G), arc = Math.sin(k * Math.PI) * 120;
      var x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k) - arc, r = lerp(r0, G.r * 1.15, eo(k));
      disc(g, t, i, x, y, r, { rot: (1 - k) * .6 });
    }
  }

  /* ---------- the magnifier: the real HUD, enlarged, straight over its corner ---------- */
  function hudCorner(u, t, rect) { return CLIP.toScreen(u, t, HUDR[0] + HUDR[2] * .5, HUDR[1] + HUDR[3] * .5, rect[0], rect[1], rect[2], rect[3]); }
  function lensRect(t, kind, i) {
    if (kind === 'hook') {
      var c = hudCorner(U.hook, Math.min(t, T.hookCard - .01), cardRect(t)), k = eo(seg(t, T.lens0, T.lens1));
      var big = [MID - 400, 470, 800, 373];
      return lerpR([c[0] - 40, c[1] - 19, 80, 37], big, k);
    }
    if (kind === 'item') {
      var u = U['c' + i], c2 = hudCorner(u, t, CARD), k2 = eo(seg(t, T.c0[i] + .18, T.c0[i] + .45));
      return lerpR([c2[0] - 40, c2[1] - 19, 80, 37], [X1 - 560, 430, 560, 261], k2);
    }
    if (kind === 'big') {
      var uu = U.drop, c3 = hudCorner(uu, t, CARD), k3 = eo(seg(t, T.lens2, T.lens2 + .35));
      return lerpR([c3[0] - 40, c3[1] - 19, 80, 37], [X1 - 640, 430, 640, 299], k3);
    }
    if (kind === 'red') { var c4 = hudCorner(U.red, t, CARD), k4 = eo(seg(t, T.redW - .25, T.redW + .05)); return lerpR([c4[0] - 40, c4[1] - 19, 80, 37], [X1 - 600, 430, 600, 280], k4); }
    var c5 = hudCorner(U.van, t, CARD), k5 = eo(seg(t, T.v0 + .3, T.v0 + .6));
    return lerpR([c5[0] - 40, c5[1] - 19, 80, 37], [X1 - 600, 430, 600, 280], k5);
  }
  /* draw the lens: src is either a sharp hud* use (whole image) or a main use (its HUD sub-rect) */
  function lens(g, t, L, use, sharp, ring) {
    var f = CLIP.frameAt(use, t), img = f.img, iw = img.naturalWidth, ih = img.naturalHeight;
    g.save();
    g.save(); g.globalAlpha *= .55; rr(g, L[0] + 8, L[1] + 12, L[2], L[3], 22); g.fillStyle = '#000'; g.fill(); g.restore();
    rr(g, L[0], L[1], L[2], L[3], 22); g.save(); g.clip();
    if (sharp) g.drawImage(img, 0, 0, iw, ih, L[0], L[1], L[2], L[3]);
    else g.drawImage(img, HUDR[0] * iw, HUDR[1] * ih, HUDR[2] * iw, HUDR[3] * ih, L[0], L[1], L[2], L[3]);
    g.restore();
    rr(g, L[0], L[1], L[2], L[3], 22); g.lineWidth = 8; g.strokeStyle = CREAM; g.stroke();
    if (ring && ring.k > 0) {
      g.lineWidth = 7; g.strokeStyle = CREAM;
      K.scribble(g, L[0] + ring.x * L[2], L[1] + ring.y * L[3], ring.rx * L[3], ring.ry * L[3], ring.k, ring.col || CREAM, Math.max(5, L[3] * .025), ring.seed || 3);
    }
    g.restore();
  }

  /* ---------- the footage card ---------- */
  function cardRect(t) {
    /* frame 0: full-bleed; shrinks into the card; at the end the card grows back */
    if (t < T.shrink1) return lerpR(FULL, CARD, eio(seg(t, T.shrink0, T.shrink1)));
    if (t >= T.back) return lerpR(CARD, FULL, eio(seg(t, T.back, T.back + .35)));
    return CARD;
  }
  function cardFrame(g, r) { g.fillStyle = INK; g.fillRect(r[0], r[1] - 8, r[2], 10); g.fillRect(r[0], r[1] + r[3] - 2, r[2], 10); }
  function drawCard(g, t, u, r, a, filt) {
    if (!u) return;
    g.save(); g.globalAlpha *= a == null ? 1 : a;
    g.save(); g.beginPath(); g.rect(r[0], r[1], r[2], r[3]); g.clip(); if (filt) g.filter = filt;
    CLIP.draw(g, t, r[0], r[1], r[2], r[3], u); g.filter = 'none'; g.restore();
    if (r[1] > 1) cardFrame(g, r);
    g.restore();
  }
  function ringOn(g, t, u, nx, ny, rx, ry, k, seed, col) {
    var p = CLIP.toScreen(u, t, nx, ny, CARD[0], CARD[1], CARD[2], CARD[3]);
    p[0] = clamp(p[0], X0 + rx * .55, X1 - rx * .55);
    g.save(); g.beginPath(); g.rect(X0, CARD[1], X1 - X0, CARD[3]); g.clip();
    K.scribble(g, p[0], p[1], rx, ry, k, col || RED, 11, seed); g.restore();
    return p;
  }
  function credit(g, u) { CLIP.credit(g, u, X0 + 10, CARD[1] + CARD[3] - 34, '700 28px "Geist Mono", monospace'); }
  function bigNum(g, t, i) {
    var u = t - T.n[i]; if (u < 0) return;
    var out = 1 - seg(t, T.c1[i] - .1, T.c1[i]);
    g.save(); g.globalAlpha *= out; g.translate(X0 + 85, CARD[1] + 95); g.rotate(-.06);
    var sc = u < .14 ? lerp(2.4, 1, eo(u / .14)) : 1 - .08 * knock(u, .14, 1, 26, 7); g.scale(sc, sc);
    g.beginPath(); g.arc(0, 0, 78, 0, TAU); g.fillStyle = RED; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    K.sticker(g, String(4 - i), 0, 6, 110, { col: CREAM, wide: false, lw: 12 });
    g.restore();
  }
  /* item annotations: where the thing is in each clip (0..1 of the source frame) */
  var MARK = [
    [{ x: .4, y: .56, rx: 70, ry: 95 }, { x: .56, y: .55, rx: 70, ry: 95 }],      // duo2: one out of each window
    [{ x: .3, y: .62, rx: 130, ry: 120 }],                                         // clothes: Jason's shirt
    [{ x: .34, y: .64, rx: 95, ry: 110 }],                                         // looks: Jason's masked face
    [{ x: .5, y: .72, rx: 190, ry: 130 }]                                          // car
  ];
  function itemBeat(g, t, i) {
    var u = U['c' + i];
    var o = eo(seg(t, T.c0[i], T.c0[i] + .14)), cl = 1 - eio(seg(t, T.c1[i] - .1, T.c1[i]));
    var r = [CARD[0], CARD[1] + CARD[3] * (1 - o * cl) / 2, CARD[2], CARD[3] * o * cl];
    drawCard(g, t, u, r);
    if (o * cl < .95) return;
    MARK[i].forEach(function (m, j) { ringOn(g, t, u, m.x, m.y, m.rx, m.ry, eo(seg(t, T.c0[i] + .15 + j * .12, T.c0[i] + .5 + j * .12)), 11 + i * 3 + j); });
    credit(g, u);
    var L = lensRect(t, 'item', i);
    if (t < T.fly[i] + .02) lens(g, t, L, u, false, { x: ICX[i], y: ICY, rx: .16, ry: .16, k: eo(seg(t, T.c0[i] + .45, T.c0[i] + .75)), seed: 5 + i });
    else lens(g, t, L, u, false, null);
    chipAt(g, LAB[i], X0, CARD[1] + CARD[3] - 110, CREAM, INK, seg(t, T.c0[i] + .3, T.c0[i] + .4), 'left', 38);
  }

  /* ---------- beats ---------- */
  var HOOKPX = 118;
  function hookText(g, t, u, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    K.slam(g, 'COPS REMEMBER', MID, 250, HOOKPX, u, { col: CREAM, rot: -.03, wide: false, from: .8 });
    K.slam(g, '4 THINGS', MID, 375, HOOKPX * 1.12, u - .02, { col: RED, rot: -.03, wide: false, from: .8 });
    g.restore();
  }
  function hookBeat(g, t) {
    if (t >= T.hookCard) return;
    var r = cardRect(t), cl = 1 - eio(seg(t, T.hookCard - .12, T.hookCard));
    if (t > T.shrink1) r = [r[0], r[1] + r[3] * (1 - cl) / 2, r[2], r[3] * cl];
    drawCard(g, t, U.hook, r);
    if (t >= T.lens0 && t < T.hookCard) {
      var L = lensRect(t, 'hook');
      /* the lens grows out of the HUD; leader from the corner */
      lens(g, t, L, U.hookHud, true, { x: .66, y: .44, rx: .5, ry: .32, k: eo(seg(t, T.lens1 - .05, T.lens1 + .3)), seed: 2 });
      if (t >= T.fly1) { g.save(); g.globalAlpha *= .9; chipAt(g, '4 STARS · 4 ICONS', MID, L[1] + L[3] + 40, RED, CREAM, seg(t, T.fly1, T.fly1 + .1), 'center', 30); g.restore(); }
    }
    if (t > T.shrink1 && t < .8) credit(g, U.hook);
  }
  function proofBeat(g, t) {
    var a = seg(t, T.hookCard, T.hookCard + .1) * (1 - seg(t, T.pEnd - .1, T.pEnd + .05));
    chipAt(g, 'ROCKSTAR · AN EXTENDED LOOK', MID, 1160, RED, CREAM, a, 'center', 32);
    /* a hand-drawn arrow from the stars to the discs */
    var G = trayGeo(t);
    g.save(); g.globalAlpha *= a; K.arrow(g, X1 - 40, G.y - 300, X1 - 70, G.y - 140, eo(seg(t, T.p0 + .2, T.p0 + .6)), CREAM, 9, .3); g.restore();
  }
  function maskedBeat(g, t) {
    var a = eo(seg(t, T.mh, T.mh + .25)) * (1 - eio(seg(t, T.mEnd - .15, T.mEnd)));
    if (a <= 0) return;
    var u = t - T.m0, cy = 760, r = 250 * (.6 + .4 * a) * (1 + .04 * knock(t, T.lit, 1, 24, 6));
    var pulse = t >= T.lit ? .5 + .5 * Math.sin((t - T.lit) * 16) : 0;
    g.save(); g.globalAlpha *= a;
    if (pulse > 0) { g.save(); g.globalAlpha *= .35 * pulse; g.beginPath(); g.arc(MID, cy, r + 40, 0, TAU); g.fillStyle = RED; g.fill(); g.restore(); }
    disc(g, t, 2, MID, cy, r, { bandana: seg(t, T.band, T.band + .25), rot: Math.sin(u * 3) * .03 });
    if (t >= T.lit - .02) {
      var su = t - T.lit;
      g.save(); g.translate(MID + 150, cy + 230); g.rotate(-.08);
      var sc = su < .14 ? lerp(2, 1, eo(su / .14)) : 1 - .06 * knock(su, .14, 1, 26, 7); g.scale(sc, sc); g.globalAlpha *= clamp(su / .05, 0, 1);
      rr(g, -175, -50, 350, 100, 16); g.fillStyle = CREAM; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
      K.sticker(g, 'STILL LIT', 0, 4, 66, { col: RED, wide: false, lw: 0, shadow: false });
      g.restore();
    }
    g.restore();
  }
  function questionBeat(g, t) {
    var a = seg(t, T.q0 + .05, T.q0 + .25) * (1 - seg(t, T.qEnd - .15, T.qEnd));
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    /* our siren light bar over the discs, spinning red/blue */
    var x = MID, y = 1110, w = 360, h = 70, ph = Math.floor(t * 6) % 2;
    rr(g, x - w / 2, y - h / 2, w, h, 26); g.fillStyle = INK; g.fill();
    rr(g, x - w / 2 + 12, y - h / 2 + 10, w / 2 - 18, h - 20, 18); g.fillStyle = ph ? RED : '#4a1418'; g.fill();
    rr(g, x + 6, y - h / 2 + 10, w / 2 - 18, h - 20, 18); g.fillStyle = ph ? '#14254a' : BLUE; g.fill();
    g.restore();
  }
  function redBeat(g, t) {
    var o = eo(seg(t, T.r0, T.r0 + .14)), cl = 1 - eio(seg(t, T.r1 - .1, T.r1));
    var r = [CARD[0], CARD[1] + CARD[3] * (1 - o * cl) / 2, CARD[2], CARD[3] * o * cl];
    drawCard(g, t, U.red, r);
    if (o * cl < .95) return;
    credit(g, U.red);
    ringOn(g, t, U.red, .5, .72, 170, 110, eo(seg(t, T.r0 + .2, T.r0 + .55)), 31, CREAM);
    if (t >= T.redW - .25) lens(g, t, lensRect(t, 'red'), U.redHud, true, { x: .54, y: STY, rx: .62, ry: .2, k: eo(seg(t, T.redW + .05, T.redW + .4)), seed: 8 });
  }
  function redChip(g, t) {
    var a = seg(t, T.redW + .1, T.redW + .2) * (1 - seg(t, T.ign - .15, T.ign - .05));
    chipAt(g, 'RED = THEY DON\'T KNOW WHERE YOU ARE · GAMESPOT', MID, 1030, RED, CREAM, a, 'center', 23);
  }
  function leaveBeat(g, t) {
    if (t < T.l0 || t >= T.lEnd + .02) return;
    var o = eo(seg(t, T.l0, T.l0 + .14)), cl = 1 - eio(seg(t, T.lEnd - .1, T.lEnd));
    var r = [CARD[0], CARD[1] + CARD[3] * (1 - o * cl) / 2, CARD[2], CARD[3] * o * cl];
    drawCard(g, t, U.drop, r, 1, 'brightness(1.35)');
    if (o * cl < .95) return;
    credit(g, U.drop);
    if (t < T.vanish + .1) ringOn(g, t, U.drop, .3, .55, 110, 170, eo(seg(t, T.l0 + .1, T.l0 + .4)), 41, CREAM);
    if (t >= T.lens2) {
      var L = lensRect(t, 'big');
      var ring = t < T.vanish ? { x: ICX[3], y: ICY, rx: .16, ry: .16, k: eo(seg(t, T.lens2 + .3, T.lens2 + .6)), seed: 9, col: CREAM } : null;
      lens(g, t, L, U.dropHud, true, ring);
      /* after it goes, the three that are left get one bracket (the others slide right into the car's place) */
      if (t >= T.vanish + .08) {
        var k = eo(seg(t, T.vanish + .08, T.vanish + .4));
        K.scribble(g, L[0] + .737 * L[2], L[1] + ICY * L[3], .2 * L[2], .2 * L[3], k, RED, 8, 14);
      }
    }
  }
  function burnBeat(g, t) {
    if (t < T.b0 || t >= T.b1 + .02) return;
    var o = eo(seg(t, T.b0, T.b0 + .12)), cl = 1 - eio(seg(t, T.b1 - .1, T.b1));
    var r = [CARD[0], CARD[1] + CARD[3] * (1 - o * cl) / 2, CARD[2], CARD[3] * o * cl];
    drawCard(g, t, U.burn, r, 1, 'brightness(1.2)');
    if (o * cl < .95) return;
    credit(g, U.burn);
    if (t >= T.ign) {
      ringOn(g, t, U.burn, .52, .5, 230, 160, eo(seg(t, T.ign + .02, T.ign + .3)), 51, CREAM);
      g.save(); g.translate(X1 - 150, CARD[1] + 110); g.rotate(.06);
      var su = t - T.ign, sc = su < .14 ? lerp(2, 1, eo(su / .14)) : 1; g.scale(sc, sc);
      chipAt(g, 'BURNED', 0, 0, RED, CREAM, 1, 'center', 46); g.restore();
    } else chipAt(g, 'MOLOTOV', X0 + 20, CARD[1] + 100, CREAM, INK, seg(t, T.b0 + .15, T.b0 + .25), 'left', 34);
  }
  function loopBeat(g, t) {
    if (t < T.v0) return;
    var o = eo(seg(t, T.v0, T.v0 + .14));
    var r = t < T.back ? [CARD[0], CARD[1] + CARD[3] * (1 - o) / 2, CARD[2], CARD[3] * o] : cardRect(t);
    if (t < T.back) drawCard(g, t, U.van, r);
    if (t >= T.back) { drawCard(g, t, U.end, r); return; }
    if (o < .95) return;
    credit(g, U.van);
    if (t >= T.v0 + .3) lens(g, t, lensRect(t, 'van'), U.vanHud, true, { x: .74, y: ICY, rx: .34, ry: .17, k: eo(seg(t, T.three - .1, T.three + .2)), seed: 12, col: CREAM });
  }
  function footnote(g, t) {
    var a = seg(t, T.lEnd + .1, T.lEnd + .2) * (1 - seg(t, T.back - .05, T.back + .05));
    chipAt(g, 'ALSO: WEAPON · CCTV ICONS · DEXERTO', MID, 1445 - 20, CREAM, INK, a * .95, 'center', 24);
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    backdrop(g, t);
    if (t < T.hookOut) hookBeat(g, t);
    if (t >= T.hookCard && t < T.pEnd) proofBeat(g, t);
    for (var i = 0; i < 4; i++) if (t >= T.c0[i] && t < T.c1[i] + .02) { itemBeat(g, t, i); bigNum(g, t, i); }
    for (i = 0; i < 4; i++) if (t >= T.n[i] && t < T.c0[i]) bigNum(g, t, i);
    if (t >= T.mh && t < T.mEnd) maskedBeat(g, t);
    if (t >= T.q0 && t < T.qEnd) questionBeat(g, t);
    if (t >= T.r0 && t < T.r1 + .02) redBeat(g, t);
    leaveBeat(g, t);
    burnBeat(g, t);
    loopBeat(g, t);
    redChip(g, t);
    chipAt(g, 'CAR ICON: GONE', X1, 779, RED, CREAM, seg(t, T.vanish + .1, T.vanish + .2) * (1 - seg(t, T.ign - .1, T.ign)), 'right', 34);
    footnote(g, t);
    tray(g, t);
    flights(g, t);
    pill(g);
    /* hook words: on frame 0, leave as the proof line starts; slam back for the loop */
    var ha = 1 - seg(t, T.hookOut - .08, T.hookOut + .06);
    if (t < T.hookOut + .06) hookText(g, t, t + 1, ha);
    if (t >= T.back + .15) hookText(g, t, t - T.back - .15, 1);
    chipAt(g, "IN ROCKSTAR'S OWN CHASE", MID, 1070, CREAM, INK, seg(t, .8, .9) * (1 - seg(t, T.pEnd - .12, T.pEnd)), 'center', 32);
    chipAt(g, 'GTA 6 WANTED LEVEL', X1, PILLY, CREAM, INK, seg(t, 1.5, 1.6) * (1 - seg(t, T.back - .1, T.back)), 'right', 30);
    captions(g, t);
  }
  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (t < .04 || t > DUR - .12) samples = 1;   // the encoder's frame 0 (t = 1/60) and the last frame are both sharp, so the loop seam matches
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
    Tx('hook', 'COPS REMEMBER 4 THINGS', 0, T.hookOut - .04); Tx('hook', 'COPS REMEMBER 4 THINGS', T.back + .25, DUR + 1);
    Tx('chase', "IN ROCKSTAR'S OWN CHASE", .85, T.pEnd - .1);
    Tx('srch', 'GTA 6 WANTED LEVEL', 1.55, T.back - .05);
    Tx('src', 'ROCKSTAR · AN EXTENDED LOOK', T.hookCard + .1, T.pEnd - .05);
    Tx('red', "RED = THEY DON'T KNOW WHERE YOU ARE · GAMESPOT", T.redW + .15, T.ign - .1);
    Tx('gone', 'CAR ICON: GONE', T.vanish + .15, T.ign - .1);
    Tx('lit', 'STILL LIT', T.lit + .05, T.r0 - .1);
    Tx('left', '3 LEFT', T.left + .05, T.back);
    Tx('also', 'ALSO: WEAPON · CCTV ICONS · DEXERTO', T.lEnd + .15, T.back);
    for (var i = 0; i < 4; i++) if (t >= T.fly[i] + .38 && t < T.back && !(t >= T.mh && t < T.mEnd)) Tx('lab' + i, LAB[i], 0, DUR);
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 84px Archivo', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0$–·→'); }))).then(function () {
      initTimes(); buildChunks(ctx);
      HOOKPX = Math.min(124, Math.floor(124 * 800 / K.measure(ctx, 'COPS REMEMBER', 124, { wide: false })));
      window.FILM.POSTER = T.vanish + .6;
      window.FILM.SHOTS = [
        { id: 'hook', name: 'Four things', t0: 0, t1: T.hookOut }, { id: 'proof', name: 'Rockstar\'s chase', t0: T.hookOut, t1: T.n[0] },
        { id: 'four', name: '4 two of you', t0: T.n[0], t1: T.n[1] }, { id: 'three', name: '3 clothes', t0: T.n[1], t1: T.n[2] },
        { id: 'two', name: '2 looks', t0: T.n[2], t1: T.n[3] }, { id: 'one', name: '1 car', t0: T.n[3], t1: T.q0 },
        { id: 'q', name: 'Shake them?', t0: T.q0, t1: T.r0 }, { id: 'red', name: 'Stars turn red', t0: T.r0, t1: T.l0 },
        { id: 'leave', name: 'Icon gone', t0: T.l0, t1: T.b0 }, { id: 'burn', name: 'Burn it', t0: T.b0, t1: T.v0 },
        { id: 'loop', name: 'Three left', t0: T.v0, t1: DUR }];
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

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: 20, SLUG: 'gta-wanted', SHOTS: [], LIVE: {}, init: init, render: render, frame: frame, T: T };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
