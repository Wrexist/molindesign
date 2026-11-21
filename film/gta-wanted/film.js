/* "GTA 6 cops remember 4 things": GTA 6, Delta, trailer mode (SAFE-EDIT rule 7) + background plates (rule 11). Round 2.
   Frame 0: Rockstar's own getaway in "An Extended Look" (rk721912, 851.7 s, Jason firing out of the window) full bleed,
   with a cream magnifier already open on the real wanted HUD (a sharp crop of the same range). Its four icons fly out of
   the lens into our own four-slot tray. Countdown 4 -> 1: each clip card gets a lens on its icon and the disc flies
   out again. The masked beat is proved on the real frozen bandana frame. Then the fix: the stars turn red (GameSpot:
   near the scene, police don't know where you are), Lucia leaves the car, the real car icon blinks out (wide lens,
   flash, 0.3 s hold, BEFORE-over-NOW split) while our car disc cracks, falls and shatters; she burns it; three left.
   The last frame rebuilds frame 0. Pure function of t, keyed to the voice with at(id, word).
   Rail x 90-930, glyphs above y 1450. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx), BOUNDS_RUN. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, K = window.KIT, CLIP = window.CLIP;
  var BG = '#0c0e17', CREAM = '#fbf0ea', RED = '#e0303a', DRED = '#8f1d26', INK = '#14101c', BLUE = '#3d7bff';
  var TAU = Math.PI * 2;
  var X0 = 90, X1 = 930, MID = 510, CAPY = 212, PILLY = 100;
  var CARD = [0, 400, W, 720];                    // the footage card, y 400-1120
  var FULL = [0, 0, W, H];
  var HUDR = [1620 / 1920, 0, 300 / 1920, 140 / 1080];   // the HUD crop, normalized to the source frame (same as the hud* cuts)
  var ICX = [.513, .625, .737, .85], ICY = .571;          // icon centres inside the HUD crop (after the car goes, the three sit at .625-.85)
  var STY = .314;                                         // star row inside the HUD crop
  var LAB = ['TWO OF YOU', 'CLOTHES', 'LOOKS', 'CAR'];
  var ORDER = ['four', 'three', 'two', 'one'];
  var LBIG = [MID - 400, 515, 800, 373];                  // the hook / loop lens (icons ~67 px)
  var LMED = [925 - 600, 430, 600, 280];                  // a lens over a clip's HUD corner (right edge x 925)
  var LW = [92, 440, 833, 389];                           // the vanish lens: x 92-925, ~2.8x the HUD
  var LA = [MID - 350, 425, 700, 327], LB = [MID - 350, 790, 700, 327];   // BEFORE over NOW
  var ROW0 = 862, ROW1 = 940, ROW2 = 1018;                            // two chip rows above the credit at the card's foot
  var CREDY = 1098;

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
  function zoomR(L, s) { return [L[0] + L[2] * (1 - s) / 2, L[1] + L[3] * (1 - s) / 2, L[2] * s, L[3] * s]; }

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
  var VAD = window.VAD || [];
  function silAfter(t) { for (var i = 0; i < VAD.length; i++) if (VAD[i][1] > t + .05) return VAD[i]; return [t + .1, t + .4]; }

  /* ---------- times ---------- */
  var T = {}, EV = [], U = {};
  function ev(t, type, g, extra) { var e = { t: t, type: type, g: g == null ? 1 : g }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
  function initTimes() {
    EV.length = 0; CLIP.reset();
    /* hook: frame 0 = the chase at 851.7 s with the lens already open on the HUD; card; four icons fly into the tray */
    T.shrink0 = .22; T.shrink1 = .62;
    T.fly0 = Math.max(1.25, at('hook', 'four') - .1); T.fly1 = T.fly0 + .55;
    T.hookCard = T.fly1 - .1; T.hookOut = start('proof') - .12;
    T.p0 = start('proof'); T.pEnd = start('four') - .12;
    /* countdown */
    var LEN = [.9, .75, .9, .9];
    T.n = []; T.c0 = []; T.c1 = []; T.fly = [];
    ORDER.forEach(function (id, i) {
      T.n[i] = start(id) - .03;
      T.c0[i] = LINE[id].words[1].t0 - .12;
      var nxt = i === 2 ? start('masked') : i < 3 ? start(ORDER[i + 1]) : start('question');
      T.c1[i] = Math.min(T.c0[i] + LEN[i], nxt - .1);
      T.fly[i] = T.c1[i] - .5;
    });
    /* masked: the real frozen bandana frame with the description icon still lit */
    T.m0 = start('masked') - .15; T.band = at('masked', 'masks') + .05; T.lit = at('masked', 'still') - .03;
    T.mEnd = Math.min(start('one') - .08, T.m0 + 2.26);
    /* question: all ours (a light bar over the tray) */
    T.q0 = T.c1[3]; T.shake = at('question', 'shake') - .02; T.qEnd = start('red') - .05;
    /* the ladder (GameSpot): out of sight -> the stars flash -> they turn red. Ours first, then the real red stars */
    T.sight = at('red', 'sight'); T.flash = at('red', 'flash'); T.redW = at('red', 'red'); T.r0 = T.redW - .6; T.r1 = T.r0 + 1.45;
    /* leave: the real car icon vanishes 1.767 s into the icondrop cut (frame 54, 957.07 s), in the pause after "car." */
    T.vanish = silAfter(wend('leave', 'car') - .1)[0] + .12;
    T.l0 = T.vanish - .75; T.lens2 = T.l0 + .08; T.wide = T.vanish - .24;
    T.split = T.vanish + .5;                              // the clean wide lens holds the vanish 0.5 s, then a flash and BEFORE over NOW
    T.goneW = at('gone', 'gone'); T.lEnd = T.goneW + .35;
    T.drop = T.vanish + .04; T.shat = T.drop + Math.sqrt((1440 - 1290) / 1700);
    /* burn: ignition (1.62 s into the cut) on the hit after "burns it" */
    T.ign = Math.max(silAfter(wend('burn', 'it') - .1)[0] + .05, start('burn') + 1.0);
    T.b0 = T.ign - .9; T.b1 = Math.min(start('loop') - .06, T.ign + .4); T.left = T.b1 + .15;
    /* loop */
    T.back = DUR - .5; T.three = at('loop', 'three');
    T.v0 = Math.max(T.b1 + .3, T.three - .2); T.v1 = T.back;

    /* foreground evidence uses (each under 4.9 s, a note on each) */
    var F0 = .7;   // 851.7 s: Jason fires out of the window, gun in frame
    U.hook = CLIP.use('hud4', 0, T.hookCard, { from: F0, zoom: [1, 1], focus: [.42, .5], note: 'frame 0: Jason fires out of the getaway car, gun in frame; the lens is open on the real HUD from frame 0 and its 4 icons fly into our tray' });
    U.hookHud = CLIP.use('hudhook', 0, T.hookCard, { from: F0, zoom: [1, 1], note: 'sharp HUD crop of the same range in the lens: 4 white stars; couple, hanger, description, car icons' });
    var Z = [
      { clip: 'duo2', from: .5, freeze: null, focus: [.72, .5], note: 'four: both of them lean out of the getaway car windows, a ring on each, lens on the couple icon' },
      { clip: 'clothes', from: 0, freeze: .15, focus: [.72, .5], note: 'three: Jason leans out firing (held on a steady frame), ring on his shirt, lens on the hanger icon' },
      { clip: 'looks', from: 0, freeze: null, focus: [.72, .5], note: 'two: Jason close in a bandana, ring on his face, lens on the description icon' },
      { clip: 'car', from: .2, freeze: null, focus: [.72, .5], note: 'one: the getaway car out of the tunnel, ring on the car, lens on the car icon' }
    ];
    Z.forEach(function (z, i) {
      var o = { from: z.from, speed: 1, zoom: [1.02, 1.08], focus: z.focus, note: z.note };
      if (z.freeze != null) o.freeze = z.freeze;
      U['c' + i] = CLIP.use(z.clip, T.c0[i], T.c1[i], o);
    });
    U.masked = CLIP.use('looks', T.m0, T.mEnd, { from: .97, freeze: .03, zoom: [1.04, 1.12], focus: [.72, .5], note: 'masks on: the real frozen frame, Jason in a bandana while the description icon is still lit: STILL LIT HERE, MASK ON IN THIS SHOT' });
    U.red = CLIP.use('red', T.r0, T.r1, { from: 3.45 - (T.r1 - T.r0), speed: 1, zoom: [1.02, 1.1], focus: [.72, .5], note: 'red: the getaway car drives into the parking garage, lens on the real stars, red; our star row flips red on "red"' });
    U.redHud = CLIP.use('hudred', T.r0, T.r1, { from: U.red.from, note: 'sharp HUD crop in the lens: four red stars' });
    var dFrom = 1.767 - (T.vanish - T.l0);
    U.drop = CLIP.use('icondrop', T.l0, T.lEnd, { from: dFrom, speed: 1, freeze: T.vanish - T.l0 + .02, zoom: [1.02, 1.07], focus: [.72, .5], note: 'leave: Lucia gets out of the parked car; the real car icon vanishes (957.07 s): flash, held 0.3 s, the clean frame held 0.5 s, then the frame before over the frame after' });
    U.dropHud = CLIP.use('huddrop', T.lens2, T.lEnd, { from: dFrom + (T.lens2 - T.l0), freeze: T.vanish - T.lens2 + .02, note: 'sharp HUD crop in the wide lens and the BEFORE / NOW split: 4 icons, then 3 (car gone, the rest slide right)' });
    U.burn = CLIP.use('burn', T.b0, T.b1, { from: 1.62 - (T.ign - T.b0), speed: 1, zoom: [1.0, 1.1], focus: [.6, .5], note: 'burn: Lucia throws the Molotov and the car catches fire, BURNED chip' });
    U.van = CLIP.use('van', T.v0, T.v1, { from: .4, speed: 1, zoom: [1.02, 1.1], focus: [.72, .5], note: 'loop: the van drives off, lens on the three icons left, 3 LEFT' });
    U.vanHud = CLIP.use('hudvan', T.v0, T.v1, { from: .4, speed: 1, note: 'sharp HUD crop in the lens: red stars, couple, hanger, description; no car' });
    /* the encoder's last frame sits at (N - 0.5)/30 and frame 0 at 1/60: show the same source frame on both */
    var tLast = (Math.round(DUR * 30) - .5) / 30, eFrom = F0 + 1 / 60 - (tLast - T.back);
    U.end = CLIP.use('hud4', T.back, DUR + .001, { from: eFrom, zoom: [1, 1], focus: [.42, .5], note: 'loop: the card grows back into the frame-0 chase' });
    U.endHud = CLIP.use('hudhook', T.back, DUR + .001, { from: eFrom, zoom: [1, 1], note: 'loop: the frame-0 lens on the HUD' });

    /* background plates (rule 11): dimmed, under everything, each under 4.9 s, a new range each */
    function plate(name, a, b, from) { if (b - a < .3) return; var len = CLIP.manifest().clips[name].frames / 30 - .05; U[name] = CLIP.use(name, a, Math.min(b, a + 4.85, a + len - (from || 0)), { plate: true, from: from || 0, zoom: [1.05, 1.12], focus: [.5, .5] }); }
    plate('p1heli', T.hookCard, T.hookCard + 3.4, 0);
    plate('p4palms', T.hookCard + 3.4, T.hookCard + 3.4 + 3.95, 0);
    plate('p5cross', T.hookCard + 7.35, T.hookCard + 7.35 + 4.45, 0);
    plate('p3alley', T.hookCard + 11.8, T.q0 + .05, 0);
    plate('p6load', T.lEnd + .45, T.b1, 0);
    plate('p7out', T.b1, T.v0 + .05, 0);

    /* sound: short hits in the voice's silences; the vanish and the ignition are the loudest hits in the film */
    ev(.02, 'whoosh', .5, { d: .4 });
    ev(T.shrink0, 'swish', .55); ev(.3, 'tick', .5);
    for (var i = 0; i < 4; i++) ev(T.fly0 + i * .09, 'pop', .6);
    ev(T.fly1, 'thud', .6);
    ev(T.p0 + .05, 'swish', .45);
    for (i = 0; i < 4; i++) {
      ev(T.n[i] + .01, 'slam', .8);
      ev(T.c0[i], 'swish', .45);
      ev(T.c0[i] + .3, 'shutter', .5);
      ev(T.fly[i], 'zip', .55);
      ev(T.fly[i] + .38, 'thud', .65);
    }
    ev(T.m0, 'swish', .5); ev(T.band, 'scratch', .6); ev(T.lit, 'slam', .95);
    ev(T.q0 + .05, 'whoosh', .5); ev(T.shake, 'ratchet', .7, { t1: T.shake + .45 });
    ev(T.sight + .05, 'thud', .7); ev(T.sight + .1, 'slam', .8);
    for (i = 0; i < 4; i++) ev(T.flash + .02 + i * .16, 'tick', .55);
    ev(T.r0, 'swish', .45);
    for (i = 0; i < 4; i++) ev(T.redW + .05 + i * .06, 'tick', .6);
    ev(T.r1 + .02, 'swish', .5); ev(T.r1 + .25, 'tick', .4); ev(T.r1 + .65, 'tick', .4);
    ev(T.l0, 'swish', .45); ev(T.lens2, 'shutter', .6); ev(T.wide, 'zip', .5);
    ev(T.vanish, 'scratch', 1.2); ev(T.vanish + .01, 'slam', 1.7);
    ev(T.shat, 'splat', 1.3); ev(T.shat + .01, 'thud', .9); ev(T.split, 'shutter', .9);
    ev(T.goneW, 'slam', 1.1); ev(T.lEnd - .05, 'thud', .7); ev(T.left, 'thud', .6);
    ev(T.ign - .55, 'whoosh', .5, { d: .4 }); ev(T.ign, 'slam', 1.8); ev(T.ign + .02, 'whoosh', 1.1, { d: .7 });
    ev(T.v0, 'swish', .45); ev(silAfter(wend('loop', 'three') - .1)[0] + .02, 'slam', .9);
    ev(T.back - .02, 'whoosh', .55); ev(T.back + .05, 'slam', .55);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  /* ---------- captions: phrase cards of 2-4 words; never end a card on a weak word ---------- */
  var CHUNKS = [], CPX = 92;
  var WEAK = { a: 1, an: 1, the: 1, is: 1, to: 1, in: 1, by: 1, you: 1, of: 1, for: 1, this: 1, and: 1, its: 1, on: 1, from: 1, at: 1, own: 1, are: 1, that: 1, how: 1, do: 1, out: 1, only: 1, there: 1, what: 1, they: 1, your: 1, she: 1 };
  var HOTW = { icons: 1, rockstars: 1, chase: 1, two: 1, clothes: 1, look: 1, like: 1, still: 1, lit: 1, car: 1, shake: 1, red: 1, gone: 1, burns: 1, three: 1, masks: 1, icon: 1 };
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

  /* ---------- the set: ink, two slow police-light washes (periodic over DUR so the loop seam matches), a dimmed plate ---------- */
  function backdrop(g, t) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var ph = TAU * 7 * t / DUR, sw = Math.sin(TAU * 3 * t / DUR), a = .5 + .5 * Math.sin(ph), b = .5 + .5 * Math.sin(ph + Math.PI);
    var gr = g.createRadialGradient(150 + 120 * sw, 760, 40, 150, 760, 900);
    gr.addColorStop(0, 'rgba(224,48,58,' + (.2 * a) + ')'); gr.addColorStop(1, 'rgba(224,48,58,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    gr = g.createRadialGradient(930 - 120 * sw, 1100, 40, 930, 1100, 900);
    gr.addColorStop(0, 'rgba(61,123,255,' + (.16 * b) + ')'); gr.addColorStop(1, 'rgba(61,123,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    CLIP.plate(g, t, 0, 0, W, H, { dim: .5, blur: 3 });
  }
  function pill(g) {
    g.save(); K.measure(g, 'GTA 6', 64, { wide: false });
    rr(g, X0, PILLY - 46, 232, 92, 46); g.fillStyle = RED; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    K.sticker(g, 'GTA 6', X0 + 116, PILLY + 2, 64, { col: CREAM, wide: false, lw: 0, shadow: false });
    g.restore();
  }
  function chipAt(g, s, x, y, bg, col, a, align, px) { if (a <= 0) return; g.save(); g.globalAlpha *= a; K.chip(g, s, x, y, px || 34, { bg: bg || RED, col: col || CREAM, align: align }); g.restore(); }
  /* a rubber stamp: cream card, red letters, lands from 2x */
  function stamp(g, s, x, y, px, rot, u, o) {
    if (u < 0) return; o = o || {};
    var w = K.measure(g, s, px, { wide: false }) + px * .9, h = px * 1.55;
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    var sc = u < .14 ? lerp(2, 1, eo(u / .14)) : 1 - .06 * knock(u, .14, 1, 26, 7); g.scale(sc * (o.s || 1), sc * (o.s || 1));
    g.globalAlpha *= clamp(u / .05, 0, 1) * (o.a == null ? 1 : o.a);
    g.save(); g.globalAlpha *= .5; rr(g, -w / 2 + 6, -h / 2 + 9, w, h, 14); g.fillStyle = '#000'; g.fill(); g.restore();
    rr(g, -w / 2, -h / 2, w, h, 14); g.fillStyle = o.bg || CREAM; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    rr(g, -w / 2 + 9, -h / 2 + 9, w - 18, h - 18, 9); g.lineWidth = 3; g.strokeStyle = o.col || RED; g.stroke();
    K.sticker(g, s, 0, px * .05, px, { col: o.col || RED, wide: false, lw: 0, shadow: false });
    g.restore();
  }

  /* ---------- our icons: cut-paper discs (torn edge, off-register print), drawn in a ±100 box ---------- */
  function headShoulders(g, x, y, s) {
    g.beginPath(); g.arc(x, y - 30 * s, 24 * s, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(x - 44 * s, y + 40 * s); g.quadraticCurveTo(x - 44 * s, y + 2 * s, x, y + 2 * s); g.quadraticCurveTo(x + 44 * s, y + 2 * s, x + 44 * s, y + 40 * s); g.closePath(); g.fill();
  }
  function pict(g, i, col) {
    g.save(); g.fillStyle = col; g.strokeStyle = col; g.lineCap = g.lineJoin = 'round';
    if (i === 0) {          // two of you: two heads, the back one offset
      g.save(); g.globalAlpha *= .8; headShoulders(g, -20, -4, .9); g.restore();
      g.save(); g.strokeStyle = DRED; g.lineWidth = 9; g.beginPath(); g.arc(16, -22, 26, 0, TAU); g.stroke(); g.restore();
      headShoulders(g, 16, 8, .95);
    } else if (i === 1) {   // clothes: a hanger
      g.lineWidth = 9; g.beginPath(); g.arc(0, -40, 13, Math.PI, Math.PI * 2.4); g.stroke();
      g.beginPath(); g.moveTo(0, -27); g.lineTo(0, -16); g.lineTo(-52, 26); g.lineTo(52, 26); g.lineTo(0, -16); g.stroke();
    } else if (i === 2) {   // looks: head and shoulders
      headShoulders(g, 0, 4, 1.15);
    } else {                // car: front view
      g.beginPath(); g.roundRect(-50, -12, 100, 40, 12); g.fill();
      g.beginPath(); g.moveTo(-36, -12); g.lineTo(-26, -40); g.lineTo(26, -40); g.lineTo(36, -12); g.closePath(); g.fill();
      g.save(); g.fillStyle = RED; g.beginPath(); g.moveTo(-26, -15); g.lineTo(-19, -33); g.lineTo(19, -33); g.lineTo(26, -15); g.closePath(); g.fill();
      g.beginPath(); g.arc(-32, 6, 8, 0, TAU); g.arc(32, 6, 8, 0, TAU); g.fill(); g.restore();
      g.fillRect(-46, 26, 18, 14); g.fillRect(28, 26, 18, 14);
    }
    g.restore();
  }
  /* a torn paper circle: the radius wobbles a little, the same for each disc every frame (seeded) */
  function tornPath(g, r, seed) {
    g.beginPath();
    for (var k = 0; k <= 36; k++) {
      var a = k / 36 * TAU, j = 1 + .035 * (hash(seed * 31 + (k % 36)) - .5) + .02 * Math.sin(a * 3 + seed);
      g[k ? 'lineTo' : 'moveTo'](Math.cos(a) * r * j, Math.sin(a) * r * j);
    }
    g.closePath();
  }
  function disc(g, t, i, x, y, r, o) {
    o = o || {};
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot);
    var s = r / 100;
    g.save(); g.globalAlpha *= .5; g.translate(7 * s, 11 * s); tornPath(g, r, i + 1); g.fillStyle = '#000'; g.fill(); g.restore();
    /* paper: a cream backing peeking out, then the red disc slightly off it */
    g.save(); g.translate(-4 * s, -3 * s); tornPath(g, r * 1.03, i + 11); g.fillStyle = o.dim ? '#5a4a50' : '#f3e6d6'; g.fill(); g.restore();
    tornPath(g, r * .96, i + 1); g.fillStyle = o.dim ? '#3a2a33' : RED; g.fill();
    g.lineWidth = Math.max(3, 6 * s); g.strokeStyle = INK; g.stroke();
    g.save(); g.scale(s * 1.02, s * 1.02); if (o.dim) g.globalAlpha *= .45;
    g.save(); g.translate(5, 4); pict(g, i, DRED); g.restore();      // off-register ink under the print
    pict(g, i, CREAM);
    g.restore();
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
    /* 0 = under the card; 1 = up in the middle (proof); q = up under the light bar (question) */
    var up = eio(seg(t, T.hookCard - .05, T.hookCard + .3)) * (1 - eio(seg(t, T.pEnd - .12, T.pEnd + .2)));
    var q = eio(seg(t, T.q0, T.q0 + .3)) * (1 - eio(seg(t, T.qEnd - .2, T.qEnd + .15)));
    return { y: lerp(lerp(1290, 800, up), 1000, q), sp: lerp(200, 205, Math.max(up, q)), r: lerp(78, 98, Math.max(up, q)), up: up };
  }
  function slotPos(i, n, G) { return [MID - (n === 3 ? 95 : 0) + (i - (n - 1) / 2) * G.sp, G.y]; }
  function slotAt(i, t, G) {
    var k = eio(seg(t, T.drop, T.drop + .4));
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
      var blink = lit && t >= T.flash && t < T.redW && Math.floor((t - T.flash) / .16) % 2 === 1;
      g.fillStyle = !lit ? '#2a2633' : (redK && kr > .5 ? RED : blink ? '#5a5560' : CREAM); g.fill();
      g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
      g.restore();
    }
    g.restore();
  }
  function lit(i, t) { return t >= T.fly[i] + .38 || (t >= T.fly1 && t < T.n[0]); }
  function litStampOn(t) { return t >= T.mEnd - .05 && t < T.r0; }
  function tray(g, t) {
    if (t < T.fly1 - .02 && t > T.shrink0) {
      var ea = seg(t, T.shrink1 - .1, T.shrink1 + .2), G0 = trayGeo(t);
      g.save(); g.globalAlpha *= ea;
      stars(g, t, MID, G0.y - G0.r - 70, 54, false, .5);
      for (var e = 0; e < 4; e++) { var q = slotPos(e, 4, G0); g.save(); g.setLineDash([12, 10]); g.lineDashOffset = -t * 30; g.lineWidth = 5; g.strokeStyle = 'rgba(251,240,234,.45)'; g.beginPath(); g.arc(q[0], q[1], G0.r, 0, TAU); g.stroke(); g.restore(); }
      g.restore();
      return;
    }
    if (t < T.fly1 - .02 || t >= T.back + .25) return;
    var G = trayGeo(t), out = 1 - eio(seg(t, T.back, T.back + .25));
    g.save(); g.globalAlpha *= out;
    stars(g, t, MID, G.y - G.r - 70, 54, true, 1);
    for (var i = 0; i < 4; i++) {
      if (flying(i, t)) continue;
      var p = slotAt(i, t, G), r = G.r, on = lit(i, t);
      if (i === 3 && t >= T.vanish) { fallingCar(g, t, p, r); continue; }
      var land = knock(t, T.fly[i] + .38, 1, 24, 6), pr = 0;
      if (t >= T.p0 && t < T.pEnd) pr = Math.max(0, Math.sin((t - T.p0) * 4 - i * .9)) * .08;
      var sh = t >= T.shake && t < T.qEnd ? Math.sin(t * 46 + i * 2) * 11 * (1 - seg(t, T.shake + .6, T.qEnd)) : 0;
      var z = 1 + .12 * land + pr;
      var num = t >= T.fly[i] + .3 && t < T.r0 && !(i === 2 && litStampOn(t)) ? String(4 - i) : null;
      disc(g, t, i, p[0] + sh, p[1] + Math.abs(sh) * .3, r * z, { dim: !on, rot: sh * .01, num: num, numU: t - T.fly[i] - .3 });
      var la = (on ? 1 : .5) * (1 - seg(t, T.vanish, T.vanish + .2) * (i === 3 ? 1 : 0));
      g.save(); g.globalAlpha *= la;
      K.sticker(g, LAB[i], p[0], p[1] + r + 40, 30, { fam: '"Geist Mono", monospace', wt: 700, col: CREAM, wide: false, lw: 6 });
      g.restore();
    }
    /* the masked proof leaves its stamp on the LOOKS disc (the number badge steps aside while it shows) */
    if (litStampOn(t)) {
      var p2 = slotAt(2, t, G), la2 = seg(t, T.mEnd - .05, T.mEnd + .1) * (1 - seg(t, T.r0 - .12, T.r0));
      g.save(); g.globalAlpha *= la2; g.translate(p2[0], p2[1] + 6); g.rotate(-.12);
      rr(g, -88, -40, 176, 80, 10); g.fillStyle = CREAM; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
      K.sticker(g, 'STILL LIT', 0, -12, 30, { col: RED, wide: false, lw: 0, shadow: false });
      K.sticker(g, 'HERE', 0, 20, 30, { col: RED, wide: false, lw: 0, shadow: false });
      g.restore();
    }
    if (t >= T.lEnd - .05 && t < T.left) {
      var gu = t - T.lEnd + .05, gs = gu < .14 ? lerp(1.35, 1, eo(gu / .14)) : 1 - .06 * knock(gu, .14, 1, 26, 7);
      g.save(); g.translate(X1 - 120, G.y); g.rotate(-.06); g.scale(gs, gs); g.globalAlpha *= clamp(gu / .05, 0, 1) * (1 - seg(t, T.left - .08, T.left));
      rr(g, -100, -58, 200, 116, 16); g.fillStyle = CREAM; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
      K.sticker(g, 'CAR ICON:', 0, -18, 38, { col: RED, wide: false, lw: 0, shadow: false });
      K.sticker(g, 'GONE', 0, 26, 44, { col: RED, wide: false, lw: 0, shadow: false });
      g.restore();
    }
    if (t >= T.left && t < T.back) {
      var u = t - T.left;
      g.save(); g.translate(X1 - 120, G.y); g.rotate(-.06);
      var sc = u < .14 ? lerp(1.35, 1, eo(u / .14)) : 1 - .06 * knock(u, .14, 1, 26, 7) - .14 * knock(t, T.three, 1, 22, 6); g.scale(sc, sc); g.globalAlpha *= clamp(u / .05, 0, 1);
      rr(g, -98, -44, 196, 88, 16); g.fillStyle = CREAM; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
      K.sticker(g, '3 LEFT', 0, 4, 50, { col: RED, wide: false, lw: 0, shadow: false });
      g.restore();
    }
    g.restore();
    shards(g, t);
  }
  /* the car disc: cracks on the vanish frame, hangs, drops and shatters at y 1440 */
  function fallingCar(g, t, p, r) {
    if (t >= T.shat) return;
    var fall = Math.max(0, t - T.drop), y = p[1] + 1700 * fall * fall, rot = fall * 2.2;
    disc(g, t, 3, p[0] - fall * 50, y, r * (1 + .1 * knock(t, T.vanish, 1, 30, 8)), { crack: seg(t, T.vanish, T.vanish + .12), rot: rot });
  }
  function shards(g, t) {
    var u = t - T.shat; if (u < 0 || t > T.b0 + .2) return;
    var cx = MID + 300 - (T.shat - T.drop) * 50, cy = 1440, a = 1 - seg(t, T.b0 - .1, T.b0 + .2);
    g.save(); g.globalAlpha *= a;
    for (var k = 0; k < 8; k++) {
      /* each shard flies, falls and comes to rest on the floor of the empty band (y 1540-1720) */
      var ang = -Math.PI * (.12 + .76 * hash(k + 3)), sp = 300 + 380 * hash(k + 17), vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
      var floor = 1540 + 180 * hash(k + 53), land = (-vy + Math.sqrt(vy * vy + 4 * 1500 * (floor - cy))) / 3000, uu = Math.min(u, land);
      var x = clamp(cx + vx * uu + (u > land ? vx * .08 * (1 - Math.exp(-(u - land) * 8)) : 0), 70, 1010), y = cy + vy * uu + 1500 * uu * uu;
      var rot = (hash(k + 29) - .5) * 12 * uu + (u > land ? (hash(k + 61) - .5) * .4 : 0), s = 20 + 22 * hash(k + 41);
      g.save(); g.translate(x, y); g.rotate(rot);
      g.beginPath(); g.moveTo(-s, -s * .5); g.lineTo(s * .9, -s * .7); g.lineTo(s * .3, s * .8); g.closePath();
      g.fillStyle = k % 3 === 0 ? '#f3e6d6' : RED; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
      g.restore();
    }
    /* the impact: a flat ink burst line, no glow */
    var kk = eo(seg(u, 0, .18)); if (u > .4) { g.restore(); return; }
    g.save(); g.globalAlpha *= 1 - seg(u, .1, .3); g.strokeStyle = CREAM; g.lineWidth = 6; g.lineCap = 'round';
    for (var j = 0; j < 7; j++) { var aa = -Math.PI * (j + .5) / 7; g.beginPath(); g.moveTo(cx + Math.cos(aa) * 40 * kk, cy + Math.sin(aa) * 40 * kk); g.lineTo(cx + Math.cos(aa) * 110 * kk, cy + Math.sin(aa) * 110 * kk); g.stroke(); }
    g.restore();
    g.restore();
  }

  /* ---------- flights: a disc leaves the lens and lands in its slot ---------- */
  function flying(i, t) { return !!curFlight(i, t); }
  function curFlight(i, t) {
    if (t >= T.fly0 + i * .09 && t < T.fly1) return { t0: T.fly0 + i * .09, t1: T.fly1, src: 'hook' };
    if (t >= T.fly[i] && t < T.fly[i] + .38) return { t0: T.fly[i], t1: T.fly[i] + .38, src: 'item' };
    return null;
  }
  function flights(g, t) {
    var G = trayGeo(t);
    for (var i = 0; i < 4; i++) {
      var f = curFlight(i, t); if (!f) continue;
      var k = eio(seg(t, f.t0, f.t1)), L = f.src === 'hook' ? LBIG : lensRect(t, 'item', i);
      var a = [L[0] + ICX[i] * L[2], L[1] + ICY * L[3]], r0 = L[3] * .095;
      var b = slotAt(i, t, G), arc = Math.sin(k * Math.PI) * 120;
      disc(g, t, i, lerp(a[0], b[0], k), lerp(a[1], b[1], k) - arc, lerp(r0, G.r * 1.15, eo(k)), { rot: (1 - k) * .6 });
    }
  }

  /* ---------- the magnifier: the real HUD, enlarged ---------- */
  function hudCorner(u, t, rect) { return CLIP.toScreen(u, t, HUDR[0] + HUDR[2] * .5, HUDR[1] + HUDR[3] * .5, rect[0], rect[1], rect[2], rect[3]); }
  function grow(u, t, ta, tb, to) { var c = hudCorner(u, t, CARD), k = eo(seg(t, ta, tb)); return lerpR([c[0] - 40, c[1] - 19, 80, 37], to, k); }
  function lensRect(t, kind, i) {
    if (kind === 'item') return grow(U['c' + i], t, T.c0[i] + .14, T.c0[i] + .4, LMED);
    if (kind === 'masked') return zoomR(LMED, 1 + .03 * seg(t, T.m0, T.mEnd));
    if (kind === 'red') return grow(U.red, t, T.r0 + .1, T.r0 + .38, LMED);
    if (kind === 'drop') { var R = grow(U.drop, t, T.lens2, T.lens2 + .28, LMED); return lerpR(R, LW, eio(seg(t, T.wide, T.wide + .2))); }
    var V = grow(U.van, t, T.v0 + .1, T.v0 + .38, LMED);
    return t >= T.back ? lerpR(LMED, LBIG, eio(seg(t, T.back, T.back + .35))) : V;
  }
  /* draw the lens: sharp = a hud* use (whole image), else a main use's HUD sub-rect; ft = film time of the frame shown */
  function lens(g, t, L, use, sharp, ring, ft) {
    var f = CLIP.frameAt(use, ft == null ? t : ft), img = f.img, iw = img.naturalWidth, ih = img.naturalHeight;
    g.save();
    g.save(); g.globalAlpha *= .55; rr(g, L[0] + 8, L[1] + 12, L[2], L[3], 22); g.fillStyle = '#000'; g.fill(); g.restore();
    rr(g, L[0], L[1], L[2], L[3], 22); g.save(); g.clip();
    if (sharp) g.drawImage(img, 0, 0, iw, ih, L[0], L[1], L[2], L[3]);
    else g.drawImage(img, HUDR[0] * iw, HUDR[1] * ih, HUDR[2] * iw, HUDR[3] * ih, L[0], L[1], L[2], L[3]);
    g.restore();
    rr(g, L[0], L[1], L[2], L[3], 22); g.lineWidth = 8; g.strokeStyle = CREAM; g.stroke();
    if (ring && ring.k > 0) K.scribble(g, L[0] + ring.x * L[2], L[1] + ring.y * L[3], ring.rx * L[3], ring.ry * L[3], ring.k, ring.col || CREAM, Math.max(5, L[3] * .025), ring.seed || 3);
    g.restore();
  }
  function flash(g, L, k) { if (k <= 0) return; g.save(); g.globalAlpha *= k; rr(g, L[0], L[1], L[2], L[3], 22); g.fillStyle = '#fff'; g.fill(); g.restore(); }

  /* ---------- the footage card ---------- */
  function cardRect(t) {
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
  function openRect(t, a, b) { var o = eo(seg(t, a, a + .14)), cl = 1 - eio(seg(t, b - .1, b)); return [CARD[0], CARD[1] + CARD[3] * (1 - o * cl) / 2, CARD[2], CARD[3] * o * cl, o * cl]; }
  function ringOn(g, t, u, nx, ny, rx, ry, k, seed, col) {
    var p = CLIP.toScreen(u, t, nx, ny, CARD[0], CARD[1], CARD[2], CARD[3]);
    p[0] = clamp(p[0], X0 + rx + 8, X1 - rx - 8); p[1] = clamp(p[1], CARD[1] + ry + 8, CARD[1] + CARD[3] - ry - 8);
    K.scribble(g, p[0], p[1], rx, ry, k, col || RED, 11, seed);
    return p;
  }
  function credit(g, u) { CLIP.credit(g, u, X0 + 12, CREDY, '700 34px "Geist Mono", monospace'); }
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
    [{ x: .33, y: .73, rx: 125, ry: 110 }],                                        // clothes: Jason's shirt
    [{ x: .34, y: .7, rx: 92, ry: 105 }],                                          // looks: Jason's masked face
    [{ x: .5, y: .72, rx: 190, ry: 130 }]                                          // car
  ];
  function itemBeat(g, t, i) {
    var u = U['c' + i], r = openRect(t, T.c0[i], T.c1[i]);
    drawCard(g, t, u, r);
    if (r[4] < .95) return;
    MARK[i].forEach(function (m, j) { ringOn(g, t, u, m.x, m.y, m.rx, m.ry, eo(seg(t, T.c0[i] + .15 + j * .12, T.c0[i] + .5 + j * .12)), 11 + i * 3 + j); });
    credit(g, u);
    var L = lensRect(t, 'item', i);
    lens(g, t, L, u, false, t < T.fly[i] + .02 ? { x: ICX[i], y: ICY, rx: .16, ry: .16, k: eo(seg(t, T.c0[i] + .4, T.c0[i] + .7)), seed: 5 + i } : null);
    chipAt(g, LAB[i], X0, ROW2, CREAM, INK, seg(t, T.c0[i] + .3, T.c0[i] + .4), 'left', 38);
  }

  /* ---------- beats ---------- */
  var HOOKPX = 118, SRCHW = 480;
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
    /* the lens is open from frame 0 */
    lens(g, t, zoomR(LBIG, cl < 1 ? lerp(.6, 1, cl) : 1), U.hookHud, true, { x: .66, y: .44, rx: .5, ry: .32, k: eo(seg(t, .3, .62)), seed: 2 });
    if (t >= T.fly1 - .3) chipAt(g, '4 STARS · 4 ICONS', MID, LBIG[1] + LBIG[3] + 44, RED, CREAM, seg(t, T.fly1 - .3, T.fly1 - .2) * cl, 'center', 34);
    if (t > T.shrink1 && cl > .9) credit(g, U.hook);
  }
  function proofBeat(g, t) {
    var a = seg(t, T.hookCard + .15, T.hookCard + .25) * (1 - seg(t, T.pEnd - .1, T.pEnd + .05));
    chipAt(g, 'ROCKSTAR · AN EXTENDED LOOK', MID, 1160, RED, CREAM, a, 'center', 34);
    var G = trayGeo(t);
    g.save(); g.globalAlpha *= a; K.arrow(g, X1 - 40, G.y - 300, X1 - 70, G.y - 140, eo(seg(t, T.p0 + .2, T.p0 + .6)), CREAM, 9, .3); g.restore();
  }
  /* masks on: the real frozen bandana frame; the description icon in the lens is still lit */
  function maskedBeat(g, t) {
    var r = openRect(t, T.m0, T.mEnd);
    drawCard(g, t, U.masked, r);
    if (r[4] < .95) return;
    credit(g, U.masked);
    ringOn(g, t, U.masked, MARK[2][0].x, MARK[2][0].y, MARK[2][0].rx, MARK[2][0].ry, eo(seg(t, T.band, T.band + .3)), 23, RED);
    var L = lensRect(t, 'masked');
    lens(g, t, L, U.masked, false, { x: ICX[2], y: ICY, rx: .17, ry: .17, k: eo(seg(t, T.lit - .05, T.lit + .25)), seed: 19, col: RED });
    if (t >= T.lit) {
      var ix = L[0] + ICX[2] * L[2], iy = L[1] + ICY * L[3] + .2 * L[3];
      g.save(); g.globalAlpha *= seg(t, T.lit + .05, T.lit + .1); K.arrow(g, 690, 735, ix - 10, iy + 8, eo(seg(t, T.lit + .05, T.lit + .3)), CREAM, 8, .25); g.restore();
      stamp(g, 'STILL LIT HERE', 650, 790, 52, -.05, t - T.lit);
    }
  }
  function maskChip(g, t) {
    var a = seg(t, T.c0[2] + .4, T.c0[2] + .5) * (1 - seg(t, T.mEnd - .1, T.mEnd));
    chipAt(g, 'MASK ON IN THIS SHOT', MID, ROW2, CREAM, INK, a, 'center', 34);
  }
  /* so how do you shake them? our light bar sweeps over the tray */
  function questionBeat(g, t) {
    var a = seg(t, T.q0 + .05, T.q0 + .25) * (1 - seg(t, T.qEnd - .2, T.qEnd));
    if (a <= 0) return;
    var u = t - T.q0, x = MID, y = 600 + 30 * (1 - eo(seg(t, T.q0, T.q0 + .3))), w = 660, h = 118, ph = Math.floor(u * 7) % 2;
    g.save(); g.globalAlpha *= a;
    /* flat beams from each lamp, sweeping */
    [[-1, RED, 'rgba(224,48,58,'], [1, BLUE, 'rgba(61,123,255,']].forEach(function (s, j) {
      var sw = ((u / .6 + j * .5) % 1), lx = x + s[0] * w * .25, ang = Math.PI / 2 + s[0] * (1.25 - 2.5 * sw), on = (ph === j) ? .3 : .14;
      g.save(); g.beginPath(); g.moveTo(lx, y); g.lineTo(lx + Math.cos(ang - .2) * 1700, y + Math.sin(ang - .2) * 1700); g.lineTo(lx + Math.cos(ang + .2) * 1700, y + Math.sin(ang + .2) * 1700); g.closePath();
      g.fillStyle = s[2] + on + ')'; g.fill(); g.restore();
    });
    /* the bar: an ink housing, two lamps that swap */
    g.save(); g.globalAlpha *= .5; rr(g, x - w / 2 + 8, y - h / 2 + 12, w, h, 40); g.fillStyle = '#000'; g.fill(); g.restore();
    rr(g, x - w / 2, y - h / 2, w, h, 40); g.fillStyle = INK; g.fill(); g.lineWidth = 7; g.strokeStyle = CREAM; g.stroke();
    rr(g, x - w / 2 + 16, y - h / 2 + 14, w / 2 - 24, h - 28, 30); g.fillStyle = ph ? RED : '#4a1418'; g.fill();
    rr(g, x + 8, y - h / 2 + 14, w / 2 - 24, h - 28, 30); g.fillStyle = ph ? '#14254a' : BLUE; g.fill();
    g.fillStyle = 'rgba(251,240,234,.5)'; for (var k = 0; k < 8; k++) g.fillRect(x - w / 2 + 40 + k * 76, y - h / 2 + 24, 8, h - 48);
    /* the cop's question over the tray */
    if (t >= T.shake) K.emote(g, '?', X1 - 90, 830, 1.1, t - T.shake, t);
    g.restore();
  }
  /* ours: break their line of sight -> the stars flash. A cop dot's sight line to our car is cut by a wall */
  function ladderBeat(g, t) {
    var a = eo(seg(t, T.qEnd, T.qEnd + .2)) * (1 - seg(t, T.r0 - .1, T.r0 + .02));
    if (a <= 0) return;
    var u = t - T.qEnd;
    g.save(); g.globalAlpha *= a;
    stars(g, t, MID, 505, 104, false, 1);
    var cy = 680, cx0 = 190, cx1 = 820, wk = eo(seg(t, T.sight - .25, T.sight + .05)), wy = lerp(430, cy, wk);
    /* the sight line: solid until the wall lands, then it stops at the wall */
    g.save(); g.strokeStyle = CREAM; g.lineWidth = 6; g.setLineDash([18, 12]); g.lineDashOffset = -u * 80;
    g.beginPath(); g.moveTo(cx0 + 34, cy); g.lineTo(wk >= 1 ? MID - 30 : cx1 - 70, cy); g.stroke(); g.restore();
    g.beginPath(); g.arc(cx0, cy, 34, 0, TAU); g.fillStyle = BLUE; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.arc(cx0, cy, 13, 0, TAU); g.fillStyle = CREAM; g.fill();
    disc(g, t, 3, cx1 + 6 * Math.sin(u * 3), cy, 62, { rot: .05 });
    /* the wall: an ink block with a cream edge, dropping in on "sight" */
    g.save(); g.globalAlpha *= clamp(wk * 3, 0, 1); rr(g, MID - 30, wy - 95, 60, 190, 10); g.fillStyle = INK; g.fill(); g.lineWidth = 6; g.strokeStyle = CREAM; g.stroke(); g.restore();
    if (t >= T.sight + .05) K.emote(g, '?', cx0 + 40, cy - 70, .8, t - T.sight - .05, t);
    g.restore();
  }
  function redBeat(g, t) {
    var r = openRect(t, T.r0, T.r1);
    drawCard(g, t, U.red, r);
    if (r[4] < .95) return;
    credit(g, U.red);
    lens(g, t, lensRect(t, 'red'), U.redHud, true, { x: .54, y: STY, rx: .62, ry: .2, k: eo(seg(t, T.redW + .05, T.redW + .4)), seed: 8, col: RED });
  }
  /* ours: the search area. Red = near the scene, but they don't know where you are */
  function searchBeat(g, t) {
    var a = eo(seg(t, T.r1 - .05, T.r1 + .2)) * (1 - seg(t, T.l0 - .08, T.l0 + .02));
    if (a <= 0) return;
    var u = t - T.r1, cx = MID, cy = 615, R = 185 * (.85 + .15 * a);
    g.save(); g.globalAlpha *= a;
    g.save(); g.globalAlpha *= .22 + .08 * Math.sin(u * 9); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fillStyle = RED; g.fill(); g.restore();
    g.save(); g.setLineDash([22, 14]); g.lineDashOffset = -u * 60; g.lineWidth = 8; g.strokeStyle = RED; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke(); g.restore();
    /* our car hides in the middle; two cop dots search around it */
    disc(g, t, 3, cx + 8 * Math.sin(u * 2), cy + 10, 62, { rot: -.05 });
    for (var k = 0; k < 2; k++) {
      var ang = u * (1.3 + k * .4) + k * Math.PI, px = cx + Math.cos(ang) * (R + 40) * .82, py = cy + Math.sin(ang) * (R + 40) * .62;
      g.beginPath(); g.arc(px, py, 26, 0, TAU); g.fillStyle = k ? BLUE : RED; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
      g.beginPath(); g.arc(px, py, 10, 0, TAU); g.fillStyle = CREAM; g.fill();
      K.emote(g, '?', px + 34, py - 40, .7, u - .15 - k * .2, t);
    }
    g.restore();
  }
  function redChips(g, t) {
    /* GameSpot's ladder, printed on the words: FLASHING on "flash", RED on "red"; they stay until the split */
    var out = 1 - seg(t, T.split - .12, T.split - .02), a0 = seg(t, T.flash, T.flash + .1) * out, a1 = seg(t, T.redW, T.redW + .1) * out;
    chipAt(g, 'FLASHING = LOST SIGHT OF YOU', X0, ROW0, CREAM, INK, a0, 'left', 34);
    chipAt(g, 'RED = NEAR THE SCENE,', X0, ROW1, RED, CREAM, a1, 'left', 34);
    chipAt(g, 'GAMESPOT', X1, ROW1, CREAM, INK, Math.max(a0, a1), 'right', 30);
    chipAt(g, "THEY DON'T KNOW WHERE YOU ARE", X0, ROW2, RED, CREAM, a1, 'left', 34);
  }
  function leaveBeat(g, t) {
    if (t < T.l0 || t >= T.lEnd + .02) return;
    var r = openRect(t, T.l0, T.lEnd);
    drawCard(g, t, U.drop, r, 1, 'brightness(1.35)');
    if (r[4] < .95) return;
    if (t >= T.split - .05) { g.save(); g.globalAlpha *= .55 * seg(t, T.split - .05, T.split + .1); g.fillStyle = INK; g.fillRect(CARD[0], CARD[1], CARD[2], CARD[3]); g.restore(); }
    credit(g, U.drop);
    if (t < T.lens2) return;
    if (t < T.split) {
      var L = lensRect(t, 'drop');
      lens(g, t, L, U.dropHud, true, t < T.vanish ? { x: ICX[3], y: ICY, rx: .16, ry: .16, k: eo(seg(t, T.lens2 + .25, T.lens2 + .5)), seed: 9, col: CREAM } : null);
      return;
    }
    /* BEFORE over NOW, with a hard white flash on the swap */
    var k = eio(seg(t, T.split, T.split + .18)), push = 1 + .035 * seg(t, T.split, T.lEnd);
    var B = zoomR(lerpR(LW, LB, k), push), A = zoomR(LA, push * lerp(.85, 1, k));
    g.save(); g.globalAlpha *= k; lens(g, t, A, U.dropHud, true, { x: ICX[3], y: ICY, rx: .15, ry: .15, k: eo(seg(t, T.split + .15, T.split + .45)), seed: 27, col: CREAM }, T.vanish - .1); g.restore();
    lens(g, t, B, U.dropHud, true, null);
    K.scribble(g, B[0] + .737 * B[2], B[1] + (ICY + .08) * B[3], .2 * B[2], .14 * B[3], eo(seg(t, T.split + .25, T.split + .55)), RED, 8, 14);
    flash(g, A, 1 - seg(t, T.split, T.split + .12)); flash(g, B, 1 - seg(t, T.split, T.split + .12));
    credit(g, U.drop);   // on top of the split so the credit stays readable
  }
  /* CAR ICON: GONE slams on the seam on the word "gone", then moves into the empty slot of our tray */
  function goneStamp(g, t) {
    if (t < T.goneW || t >= T.lEnd) return;
    stamp(g, 'CAR ICON: GONE', MID, 771, 56, -.04, t - T.goneW, { a: 1 - seg(t, T.lEnd - .08, T.lEnd) });
  }
  function burnBeat(g, t) {
    if (t < T.b0 || t >= T.b1 + .02) return;
    var r = openRect(t, T.b0, T.b1);
    drawCard(g, t, U.burn, r, 1, 'brightness(1.2)');
    if (r[4] < .95) return;
    credit(g, U.burn);
    if (t >= T.ign + .4) {   /* the flame gets 0.4 s clean first */
      ringOn(g, t, U.burn, .52, .5, 230, 150, eo(seg(t, T.ign + .4, T.ign + .65)), 51, CREAM);
      g.save(); g.translate(X1 - 130, CARD[1] + 80); g.rotate(.06);
      var su = t - T.ign - .4, sc = su < .14 ? lerp(2, 1, eo(su / .14)) : 1; g.scale(sc, sc);
      chipAt(g, 'BURNED', 0, 0, RED, CREAM, 1, 'center', 46); g.restore();
    } else if (t < T.ign) chipAt(g, 'MOLOTOV', X0 + 10, CARD[1] + 72, CREAM, INK, seg(t, T.b0 + .15, T.b0 + .25), 'left', 34);
  }
  function loopBeat(g, t) {
    if (t < T.v0) return;
    if (t >= T.back) {
      drawCard(g, t, U.end, cardRect(t));
      lens(g, t, lensRect(t, 'van'), U.endHud, true, null);
      return;
    }
    var r = openRect(t, T.v0, T.back + 1);
    drawCard(g, t, U.van, r);
    if (r[4] < .95) return;
    credit(g, U.van);
    lens(g, t, lensRect(t, 'van'), U.vanHud, true, { x: .737, y: ICY, rx: .34, ry: .17, k: eo(seg(t, T.three - .1, T.three + .2)), seed: 12, col: CREAM });
  }
  function footnote(g, t) {
    var a = seg(t, T.b1 - .25, T.b1 - .15) * (1 - seg(t, T.back - .1, T.back));
    chipAt(g, 'ALSO: WEAPON · CCTV', MID, ROW1, CREAM, INK, a, 'center', 34);
    chipAt(g, 'SOURCE: DEXERTO', MID, ROW2, CREAM, INK, a, 'center', 34);
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    backdrop(g, t);
    if (t < T.hookCard) hookBeat(g, t);
    if (t >= T.hookCard && t < T.pEnd) proofBeat(g, t);
    for (var i = 0; i < 4; i++) if (t >= T.c0[i] && t < T.c1[i] + .02) itemBeat(g, t, i);
    if (t >= T.m0 && t < T.mEnd + .02) maskedBeat(g, t);
    maskChip(g, t);
    if (t >= T.q0 && t < T.qEnd) questionBeat(g, t);
    if (t >= T.qEnd && t < T.r0 + .02) ladderBeat(g, t);
    if (t >= T.r0 && t < T.r1 + .02) redBeat(g, t);
    if (t >= T.sight && t < T.redW + .1) stamp(g, 'OUT OF SIGHT', MID, 778, 52, -.04, t - T.sight - .02, { a: 1 - seg(t, T.redW, T.redW + .1) });
    searchBeat(g, t);
    leaveBeat(g, t);
    burnBeat(g, t);
    loopBeat(g, t);
    redChips(g, t);
    footnote(g, t);
    for (i = 0; i < 4; i++) if (t >= T.n[i] && t < T.c1[i] + .02) bigNum(g, t, i);
    tray(g, t);
    flights(g, t);
    goneStamp(g, t);
    pill(g);
    var ha = 1 - seg(t, T.hookOut - .08, T.hookOut + .06);
    if (t < T.hookOut + .06) hookText(g, t, t + 1, ha);
    if (t >= T.back + .05) hookText(g, t, t - T.back - .05, 1);
    /* the scope note: on the chase card, off while the tray's stars rise through its row */
    chipAt(g, "IN ROCKSTAR'S OWN CHASE", MID, 1070, CREAM, INK, seg(t, .8, .9) * (1 - seg(t, T.hookCard - .1, T.hookCard)) + seg(t, T.hookCard + .3, T.hookCard + .4) * (1 - seg(t, T.pEnd - .12, T.pEnd)), 'center', 34);
    /* the search phrase: under the headline on frame 0, up beside the pill for the body, back under the headline for the loop */
    var sk = eio(seg(t, T.hookOut - .1, T.hookOut + .2)) * (1 - eio(seg(t, T.back, T.back + .3)));
    chipAt(g, 'GTA 6 WANTED LEVEL', lerp(MID + SRCHW / 2, X1, sk), lerp(462, PILLY, sk), CREAM, INK, 1, 'right', 34);
    captions(g, t);
  }
  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (t < .04 || t > DUR - .12) samples = 1;   // the encoder's frame 0 and the last frame are both sharp, so the loop seam matches
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
    Tx('hook', 'COPS REMEMBER 4 THINGS', 0, T.hookOut - .04); Tx('hook', 'COPS REMEMBER 4 THINGS', T.back + .15, DUR + 1);
    Tx('chase', "IN ROCKSTAR'S OWN CHASE", .85, T.hookCard - .1); Tx('chase', "IN ROCKSTAR'S OWN CHASE", T.hookCard + .35, T.pEnd - .1);
    Tx('srch', 'GTA 6 WANTED LEVEL', 0, DUR + 1);
    Tx('src', 'ROCKSTAR · AN EXTENDED LOOK', T.hookCard + .2, T.pEnd - .05);
    Tx('mask', 'MASK ON IN THIS SHOT', T.c0[2] + .45, T.mEnd - .05);
    Tx('lit', 'STILL LIT HERE', T.lit + .05, T.mEnd); Tx('lit', 'STILL LIT HERE', T.mEnd + .05, T.r0 - .1);
    Tx('sight', 'OUT OF SIGHT', T.sight + .05, T.redW);
    Tx('flash', 'FLASHING = LOST SIGHT OF YOU', T.flash + .05, T.split - .07);
    Tx('red1', 'RED = NEAR THE SCENE,', T.redW + .05, T.split - .07);
    Tx('red2', "THEY DON'T KNOW WHERE YOU ARE", T.redW + .05, T.split - .07);
    Tx('gspot', 'GAMESPOT', T.flash + .05, T.split - .07);
    Tx('gone', 'CAR ICON: GONE', T.goneW + .05, T.left - .05);
    Tx('left', '3 LEFT', T.left + .05, T.back);
    Tx('also', 'ALSO: WEAPON · CCTV', T.b1 - .2, T.back - .05);
    Tx('dex', 'SOURCE: DEXERTO', T.b1 - .2, T.back - .05);
    for (var i = 0; i < 4; i++) if (t >= T.fly[i] + .38 && t < T.back) Tx('lab' + i, LAB[i], 0, DUR);
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
      SRCHW = K.chip(ctx, 'GTA 6 WANTED LEVEL', -9999, -9999, 34, {});
      HOOKPX = Math.min(124, Math.floor(124 * 800 / K.measure(ctx, 'COPS REMEMBER', 124, { wide: false })));
      window.FILM.POSTER = T.split + .45;
      window.FILM.SHOTS = [
        { id: 'hook', name: 'Four things', t0: 0, t1: T.hookOut }, { id: 'proof', name: 'Rockstar\'s chase', t0: T.hookOut, t1: T.n[0] },
        { id: 'four', name: '4 two of you', t0: T.n[0], t1: T.n[1] }, { id: 'three', name: '3 clothes', t0: T.n[1], t1: T.n[2] },
        { id: 'two', name: '2 looks, masks on', t0: T.n[2], t1: T.n[3] }, { id: 'one', name: '1 car', t0: T.n[3], t1: T.q0 },
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
