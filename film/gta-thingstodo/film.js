/* "Nine things to do in GTA 6": GTA 6, Delta, trailer mode (SAFE-EDIT rule 7). A to-do grid that fills itself:
   nine empty slots at 0/9, and each item is proved by a short muted clip from Rockstar's own "An Extended Look"
   (rk721912) that grows out of its slot into a full-width plate, then flips into our pink pictogram and drops back
   into the slot with a tick. The ninth (BASE jump) gets two shots. The last frame rebuilds frame 0 (the freefall plate).
   Native move: slot -> plate -> slot; the other eight slots slide into a strip under the plate, so the count stays on screen.
   Pure function of t, keyed to the voice with at(id, word). Rail x 90-930, glyphs above y 1450.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx), BOUNDS_RUN. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, K = window.KIT, CLIP = window.CLIP;
  var BG = '#0b0820', BG2 = '#16112e', CREAM = '#fbf0ea', HOT = '#ff4fa3', INK = '#1d1233';
  var TAU = Math.PI * 2;
  var X0 = 90, X1 = 930, MID = 510, CAPY = 212, PILLY = 100;
  var PLATE = [0, 395, W, 860];                  // the full-width footage plate (above the strip)
  var TEASE = [0, 360, W, 1080];                 // frame 0 / last frame: the freefall plate
  var GC = 250, GG = 20, GX = MID - (3 * GC + 2 * GG) / 2, GY = 500;             // grid: x 115-905, y 500-1290
  var SC = 84, SG = 8, SX = MID - (9 * SC + 8 * SG) / 2, SY = 1290;             // strip: x 100-920, y 1290-1374
  var ITEMS = [
    { id: 'jetski', label: 'JET SKI', clip: 'jetski' },
    { id: 'race', label: 'TRACK RACE', clip: 'race' },
    { id: 'dirtbike', label: 'DIRT BIKE', clip: 'dirtbike' },
    { id: 'airboat', label: 'AIRBOAT', clip: 'airboat' },
    { id: 'kayak', label: 'KAYAK', clip: 'kayak' },
    { id: 'gym', label: 'GYM', clip: 'gym' },
    { id: 'hoops', label: 'HOOPS', clip: 'hoops' },
    { id: 'dive', label: 'SCUBA DIVE', clip: 'dive' },
    { id: 'base', label: 'BASE JUMP', clip: 'basejump' }
  ];

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function knock(t, a, amp, f, d) { if (t < a) return 0; var u = t - a; return (amp || 1) * Math.exp(-u * (d || 6)) * Math.sin(u * (f || 22)); }
  function osc(t, n, ph) { return Math.sin(TAU * n * t / DUR + (ph || 0)); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function lerpR(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)]; }

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
  /* the voice track's own silences (vo/vad.js): plate moves and every hit sit in them, never on a word */
  var VAD = window.VAD || [];
  function silAfter(t) { for (var i = 0; i < VAD.length; i++) if (VAD[i][1] > t + .05) return VAD[i]; return [t + .1, t + .4]; }
  function initTimes() {
    EV.length = 0; CLIP.reset();
    T.tz0 = 1.55; T.tz1 = 1.9;                  // the freefall plate holds full width under the hook, then shrinks into slot 9
    T.count = at('hook', 'count');
    T.lit = []; T.ex = []; T.fl = []; T.tk = [];
    ITEMS.forEach(function (it, i) {
      var id = it.id, w0 = LINE[id].words[0];
      T.lit[i] = w0.t0 - .04;                    // the slot lights on the spoken number
      T.ex[i] = LINE[id].words[1].t0 - .14;     // the plate grows out of it just before the item is named
      var nxt = i < 8 ? LINE[ITEMS[i + 1].id].words[0].t0 : start('end');
      T.fl[i] = id === 'race' || id === 'dirtbike' ? nxt - .62 : Math.min(lastw(id) + .18, nxt - .62);   // the races hold for the LAP read   // the footage flips into the pictogram
      T.tk[i] = T.fl[i] + .4;                    // the pictogram lands in its slot
    });
    /* #9: roof run + freefall, our canopy beat, then the real canopy */
    T.ex[8] = at('base', 'base') - .1;
    T.ch0 = silAfter(wend('base', 'tower') - .1)[0] + .02;   // the real canopy opens on the hit, in the pause after "tower"
    T.bj1 = T.ch0 - .3;
    T.fl[8] = Math.min(T.ch0 + 1.05, start('end') - .45); T.tk[8] = T.fl[8] + .4;
    T.src = at('end', 'all');
    T.which = T.tk[8] + .55;                     // the one end question (the voice asks it while it holds)
    T.back = DUR - .85;                          // un-tick, slot 9 grows back into the freefall plate: last frame = frame 0

    /* clip uses: each under 4.9 s, annotated; footage share and runs checked by clipkit.py lint */
    U.tease = CLIP.use('basejump', 0, T.tz1, { from: 2.2, speed: 1, zoom: [1.0, 1.08], focus: [.5, .55], note: 'frame 0: freefall over the city under 9 THINGS TO DO; shrinks into the empty slot 9' });
    U.tease.rect = TEASE;
    var Z = {
      airboat: { from: .4, zoom: [1.0, 1.1], focus: [.48, .62], note: 'fan airboat in the swamp channel, circle on the boat, AIRBOAT chip' },
      hoops: { from: .3, zoom: [1.0, 1.08], focus: [.42, .45], note: 'man shoots at the hoop under the stilt house, circle follows the hoop, HOOPS chip' },
      dive: { from: .3, zoom: [1.0, 1.1], focus: [.48, .55], note: 'scuba diver in the cave arch, brightened, circle on the diver, SCUBA DIVE chip' },
      gym: { from: .4, zoom: [1.0, 1.08], focus: [.5, .55], note: 'bench press top-down, ring on the bar and GAINZ plates, GYM chip' },
      jetski: { from: 0, zoom: [1.0, 1.1], focus: [.52, .6], note: 'two jet skis at sunset, arrow to the riders, JET SKI chip' },
      kayak: { from: .2, zoom: [1.0, 1.08], focus: [.45, .45], note: 'green kayak, arrow from it up to the downtown skyline, KAYAK chip' },
      race: { from: .6, zoom: [1.0, 1.06], focus: [1.0, .55], note: 'circuit race, LAP 1/2 chip by the lap HUD, circle on the leading car, TRACK RACE chip' },
      dirtbike: { from: .6, zoom: [1.0, 1.06], focus: [.7, .55], note: 'dirt bike race, LAP 1/2 chip by the lap HUD, circle on the rider, DIRT BIKE chip' },
      base: { from: .45, zoom: [1.0, 1.12], focus: [.5, .5], note: 'she runs off the roof edge into freefall over the city, arrow on her, BASE JUMP chip' }
    };
    ITEMS.forEach(function (it, i) {
      var z = Z[it.id], t1 = i === 8 ? T.bj1 : T.fl[i];
      var len = CLIP.manifest().clips[it.clip].frames / 30 - .04, from = Math.min(z.from, Math.max(0, len - (t1 - T.ex[i])));
      U[it.id] = CLIP.use(it.clip, T.ex[i], t1, { from: from, speed: Math.min(1, (len - from) / (t1 - T.ex[i])), zoom: z.zoom, focus: z.focus, note: z.note });
      U[it.id].item = i;
    });
    U.chute = CLIP.use('chute', T.ch0, T.fl[8], { from: .1, speed: 1, freeze: .45, zoom: [1.18, 1.0], focus: [.45, .35], note: 'the orange canopy over the skyline, held on the hit, circle on the canopy' });
    U.chute.item = 8;
    var backFrom = 2.2 - (DUR - T.back);
    U.end = CLIP.use('basejump', T.back, DUR + .001, { from: backFrom, speed: 1, zoom: [1.12, 1.0], focus: [.5, .55], note: 'loop: slot 9 grows back into the freefall plate of frame 0' });
    U.end.rect = TEASE;

    /* sound: every hit short, in a silence of the voice track where one is near */
    ev(.02, 'whoosh', .5, { d: .5 });
    ev(T.tz0 + .05, 'swish', .5); ev(T.tz1 + .02, 'tick', .5);
    ITEMS.forEach(function (it, i) { ev(T.count + .12 + i * .07, 'tick', .22); });
    ITEMS.forEach(function (it, i) {
      ev(T.lit[i] + .02, 'pop', .55);
      ev(T.ex[i] - .02, 'swish', .55);
      ev(T.fl[i] - .02, 'zip', .4);
      ev(T.tk[i], i === 8 ? 'slam' : 'thud', i === 8 ? .95 : .5);
    });
    ev(T.ex[8] + .5, 'whoosh', .55, { d: .9 });   // the wind as she leaves the roof
    ev(T.bj1 - .02, 'rise', .7, { t1: T.ch0 });
    ev(T.ch0, 'slam', 1);                         // the canopy opens
    ev(T.tk[8] + .06, 'ding', .9);                // 9/9 COMPLETE
    ev(T.which + .02, 'pop', .55);
    ev(T.back - .05, 'whoosh', .5); ev(T.back + .3, 'thud', .45);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  /* ---------- captions: phrase cards of 2-4 words at 96 px; never end a card on a weak word ---------- */
  var CHUNKS = [], CPX = 96;
  var WEAK = { a: 1, an: 1, the: 1, is: 1, to: 1, in: 1, by: 1, you: 1, of: 1, for: 1, this: 1, and: 1, its: 1, on: 1, from: 1, at: 1, own: 1, are: 1, one: 1, off: 1, past: 1 };
  var HOTW = { airboat: 1, swamps: 1, hoops: 1, scuba: 1, dive: 1, gym: 1, jet: 1, ski: 1, kayak: 1, skyline: 1, race: 1, track: 1, dirt: 1, bike: 1, races: 1, base: 1, jump: 1, tower: 1, rockstars: 1, extended: 1, look: 1, first: 1 };
  function buildChunks(g) {
    var GAP = CPX * .3;
    function wd(w) { return K.measure(g, w.w, CPX, { wide: false }); }
    function width(c) { return c.reduce(function (a, w) { return a + wd(w); }, 0) + GAP * (c.length - 1); }
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;                // frame 0 carries its own words
      var lw = l.words; if (/^(one|two|three|four|five|six|seven|eight|nine)$/.test(norm(lw[0].w))) lw = lw.slice(1);
      var ws = lw.map(function (w) { return { w: w.w.replace(/[,:]$/, '').toUpperCase(), raw: w.w, t0: w.t0, t1: w.t1, hot: !!HOTW[norm(w.w)] }; });
      var phrases = [], cur = [];
      ws.forEach(function (w) { cur.push(w); if (/[.?!,:]$/.test(w.raw)) { phrases.push(cur); cur = []; } });
      if (cur.length) phrases.push(cur);
      var cards = [];
      phrases.forEach(function (ph) {
        var n = /\?$/.test(ph[ph.length - 1].raw) && ph.length <= 6 ? 1 : Math.ceil(ph.length / 4), base = Math.floor(ph.length / n), extra = ph.length % n, sizes = [];
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
        c.line = l.id; if (l.id === 'end' && /\?$/.test(c[c.length - 1].raw)) return;   // WHICH FIRST? on the card says it once
        CHUNKS.push(c);
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
        var tw = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (row.length - 1), x = MID - tw / 2, s = Math.min(1, 820 / tw);
        var y = (n === 1 ? CAPY + 45 : CAPY + r * 100) + (1 - k) * 20;
        g.save(); g.translate(MID, y); g.scale(s, s); g.translate(-MID, -y);
        row.forEach(function (w, j) {
          var on = t >= w.t0 && t < w.t1 + .05;
          K.sticker(g, w.w, x + ws[j] / 2, y + (on ? -6 : 0), CPX, { col: w.hot ? HOT : CREAM, wide: false, lw: CPX * .17 });
          x += ws[j] + gap;
        });
        g.restore();
      });
      g.restore();
      return;
    }
  }

  /* ---------- background: ink, a soft pink glow behind the grid, slow diagonal paper stripes ---------- */
  function backdrop(g, t) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var gr = g.createRadialGradient(MID, 860, 60, MID, 860, 900);
    gr.addColorStop(0, 'rgba(255,79,163,.16)'); gr.addColorStop(1, 'rgba(255,79,163,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = .05; g.strokeStyle = CREAM; g.lineWidth = 30;
    var off = (t / DUR) * 240;
    for (var x = -H; x < W + H; x += 120) { g.beginPath(); g.moveTo(x + off, 0); g.lineTo(x + off - H * .6, H); g.stroke(); }
    g.restore();
  }
  function pill(g, t) {
    g.save(); K.measure(g, 'GTA 6', 64, { wide: false });
    rr(g, X0, PILLY - 46, 232, 92, 46); g.fillStyle = HOT; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    K.sticker(g, 'GTA 6', X0 + 116, PILLY + 2, 64, { col: CREAM, wide: false, lw: 0, shadow: false });
    g.restore();
  }
  /* the counter: N/9, top right; the new number slams in when a pictogram lands */
  function doneCount(t) { var n = 0; for (var i = 0; i < 9; i++) if (t >= T.lit[i]) n++; if (t >= T.back) n = Math.max(0, Math.round(9 * (1 - seg(t, T.back, T.back + .22)))); return n; }
  function counter(g, t) {
    var n = doneCount(t), last = -1;
    for (var i = 0; i < 9; i++) if (t >= T.lit[i] && t < T.back) last = T.lit[i];
    var u = last < 0 ? 9 : t - last, sc = u < .14 ? lerp(1.7, 1, eo(u / .14)) : 1 - .1 * knock(u, .14, 1, 26, 7);
    g.save();
    var w9 = K.measure(g, '/9', 72, { wide: false }), wn = K.measure(g, String(n), 96, { wide: false });
    rr(g, X1 - w9 - wn - 56, PILLY - 56, w9 + wn + 56, 112, 56); g.fillStyle = 'rgba(11,8,32,.85)'; g.fill(); g.lineWidth = 5; g.strokeStyle = n === 9 ? HOT : 'rgba(251,240,234,.35)'; g.stroke();
    K.sticker(g, '/9', X1 - 22 - w9 / 2, PILLY + 8, 72, { col: CREAM, wide: false, lw: 0, shadow: false });
    g.save(); g.translate(X1 - 30 - w9 - wn / 2, PILLY + 2); g.scale(sc, sc);
    K.sticker(g, String(n), 0, 0, 96, { col: n > 0 ? HOT : CREAM, wide: false, lw: 10 });
    g.restore();
    g.restore();
  }

  /* ---------- the grid ⇄ strip ---------- */
  function gridRect(i) { var r = Math.floor(i / 3), c = i % 3; return [GX + c * (GC + GG), GY + r * (GC + GG), GC, GC]; }
  function stripRect(i) { return [SX + i * (SC + SG), SY, SC, SC]; }
  /* m: 0 = grid, 1 = strip under a plate */
  function mode(t) {
    var m = 1 - eio(seg(t, T.tz0, T.tz1));
    for (var i = 0; i < 9; i++) m = Math.max(m, eio(seg(t, T.ex[i], T.ex[i] + .25)) * (1 - eio(seg(t, T.fl[i], T.tk[i]))));
    m = Math.max(m, eio(seg(t, T.back, T.back + .3)));
    return m;
  }
  function slotRect(i, m) { return lerpR(gridRect(i), stripRect(i), m); }
  function current(t) { for (var i = 0; i < 9; i++) if (t >= T.lit[i] && t < T.tk[i]) return i; return -1; }
  function slots(g, t) {
    var m = mode(t), cur = current(t);
    for (var i = 0; i < 9; i++) {
      var r = slotRect(i, m), done = t >= T.tk[i] && !(t >= T.back + .02 * (9 - i)), s = r[2] / GC;
      var lit = i === cur ? seg(t, T.lit[i], T.lit[i] + .1) : 0;
      if (i === cur && t >= T.ex[i]) continue;   // the plate is this slot now
      if (t >= T.tz0 && t < T.tz1 && i === 8) continue;
      /* ripple on "Count along" */
      var rip = knock(t, T.count + .1 + i * .07, 1, 20, 6);
      var land = done ? knock(t, T.tk[i], 1, 24, 6) : 0;
      var cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2, z = 1 + .06 * rip + .08 * lit + .1 * land + (i === cur ? .03 * Math.sin(t * 9) : 0);
      g.save(); g.translate(cx, cy); g.scale(z, z);
      var hw = r[2] / 2, rad = 30 * s;
      if (done) {
        g.save(); rr(g, -hw + 6 * s, -hw + 10 * s, r[2], r[3], rad); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); g.restore();
        rr(g, -hw, -hw, r[2], r[3], rad); g.fillStyle = HOT; g.fill(); g.lineWidth = Math.max(3, 6 * s); g.strokeStyle = INK; g.stroke();
        var lab = 1 - seg(m, .05, .4);
        g.save(); g.translate(0, -18 * s * lab); pict(g, t, PI[ITEMS[i].id], r[2] * lerp(.0047, .0029, lab)); g.restore();
        if (lab > 0) { g.save(); g.globalAlpha *= lab; g.translate(0, hw - 34 * s); K.sticker(g, ITEMS[i].label, 0, 0, 30, { fam: '"Geist Mono", monospace', wt: 700, col: INK, wide: false, lw: 0, shadow: false }); g.restore(); }
        /* the tick */
        var tk = eo(seg(t, T.tk[i] + .05, T.tk[i] + .25));
        if (tk > 0) { g.save(); g.lineCap = g.lineJoin = 'round'; g.strokeStyle = CREAM; g.lineWidth = 12 * s; g.beginPath(); g.moveTo(hw - 62 * s, -hw + 40 * s); g.lineTo(hw - 46 * s, -hw + 56 * s); g.lineTo(hw - 18 * s, -hw + 20 * s); g.setLineDash([80 * s * tk, 200]); g.stroke(); g.restore(); }
      } else {
        g.save(); rr(g, -hw + 5 * s, -hw + 8 * s, r[2], r[3], rad); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill(); g.restore();
        rr(g, -hw, -hw, r[2], r[3], rad); g.fillStyle = lit > 0 ? '#3a1d4a' : '#221a3f'; g.fill();
        g.lineWidth = Math.max(3, 6 * s); g.strokeStyle = lit > 0 || rip > .3 || (i === 0 && t > T.count + .45 && Math.sin(t * 14) > 0) ? HOT : INK; g.stroke();
        g.save(); rr(g, -hw + 14 * s, -hw + 14 * s, r[2] - 28 * s, r[3] - 28 * s, rad * .7); g.lineWidth = Math.max(2, 3 * s); g.strokeStyle = 'rgba(251,240,234,.12)'; g.stroke(); g.restore();
        var nk = lit > 0 ? lerp(1.6, 1, eo(seg(t, T.lit[i], T.lit[i] + .14))) : 1;
        g.save(); g.scale(nk, nk); g.globalAlpha *= lit > 0 ? 1 : .34;
        K.sticker(g, String(i + 1), 0, 6 * s, 150 * s, { col: lit > 0 ? HOT : CREAM, wide: false, lw: lit > 0 ? 14 * s : 0, shadow: lit > 0 });
        g.restore();
      }
      g.restore();
    }
  }

  /* ---------- our pictograms, drawn in a ±100 box, ink strokes ---------- */
  var PI = { airboat: 0, hoops: 1, dive: 2, gym: 3, jetski: 4, kayak: 5, race: 6, dirtbike: 7, base: 8 };   // pictogram per item, whatever its slot
  function pict(g, t, i, s) {
    g.save(); g.scale(s, s); g.lineCap = g.lineJoin = 'round'; g.strokeStyle = INK; g.fillStyle = CREAM; g.lineWidth = 11;
    var w = Math.sin(t * 5 + i);
    if (i === 0) {          // airboat: flat hull, seat, fan cage with spinning blades
      g.beginPath(); g.moveTo(-90, 40); g.lineTo(70, 40); g.lineTo(95, 15); g.lineTo(-80, 15); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-20, 15); g.lineTo(-20, -15); g.lineTo(5, -15); g.stroke();
      g.beginPath(); g.arc(-55, -35, 42, 0, TAU); g.stroke();
      g.save(); g.translate(-55, -35); g.rotate(t * 14); g.beginPath(); g.moveTo(-30, 0); g.lineTo(30, 0); g.moveTo(0, -30); g.lineTo(0, 30); g.lineWidth = 8; g.stroke(); g.restore();
      g.beginPath(); g.moveTo(-100, 62); g.quadraticCurveTo(-60, 52 + w * 4, -20, 62); g.quadraticCurveTo(20, 72, 60, 62); g.lineWidth = 7; g.stroke();
    } else if (i === 1) {   // hoops: backboard, rim, net, ball
      g.beginPath(); g.rect(-70, -90, 140, 80); g.fill(); g.stroke(); g.beginPath(); g.rect(-25, -55, 50, 35); g.lineWidth = 6; g.stroke();
      g.lineWidth = 9; g.beginPath(); g.ellipse(0, -5, 38, 9, 0, 0, TAU); g.stroke();
      g.lineWidth = 5; g.beginPath(); g.moveTo(-34, -2); g.lineTo(-18, 40); g.moveTo(-12, 0); g.lineTo(-6, 40); g.moveTo(12, 0); g.lineTo(6, 40); g.moveTo(34, -2); g.lineTo(18, 40); g.moveTo(-26, 20); g.lineTo(26, 20); g.stroke();
      var by = 52 - Math.abs(w) * 14; g.lineWidth = 9; g.beginPath(); g.arc(58, by, 26, 0, TAU); g.fill(); g.stroke();
      g.lineWidth = 5; g.beginPath(); g.moveTo(32, by); g.lineTo(84, by); g.moveTo(58, by - 26); g.lineTo(58, by + 26); g.stroke();
    } else if (i === 2) {   // diver: mask, body, fins, tank, bubbles
      g.save(); g.rotate(-.35);
      g.beginPath(); g.ellipse(-10, 0, 62, 22, 0, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.rect(-40, -38, 52, 18); g.fill(); g.stroke();
      g.beginPath(); g.arc(-80, -6, 24, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.rect(-100, -16, 22, 14); g.lineWidth = 6; g.stroke();
      g.lineWidth = 11; g.beginPath(); g.moveTo(52, -6); g.lineTo(88, -22 + w * 8); g.moveTo(52, 8); g.lineTo(88, 18 - w * 8); g.stroke();
      g.restore();
      g.lineWidth = 6; for (var b = 0; b < 3; b++) { var ph = ((t * .9 + b / 3) % 1); g.beginPath(); g.arc(-70 + b * 10, -40 - ph * 55, 7 + b * 3, 0, TAU); g.stroke(); }
    } else if (i === 3) {   // barbell
      var ly = Math.abs(w) * -16;
      g.save(); g.translate(0, ly);
      g.beginPath(); g.moveTo(-95, 0); g.lineTo(95, 0); g.lineWidth = 10; g.stroke();
      g.lineWidth = 9; [-1, 1].forEach(function (sd) { g.beginPath(); g.rect(sd * 52 - 12, -52, 24, 104); g.fill(); g.stroke(); g.beginPath(); g.rect(sd * 76 - 9, -36, 18, 72); g.fill(); g.stroke(); });
      g.restore();
      g.beginPath(); g.moveTo(-60, 80); g.lineTo(60, 80); g.lineWidth = 8; g.stroke();
    } else if (i === 4) {   // jet ski + spray
      g.beginPath(); g.moveTo(-90, 30); g.quadraticCurveTo(-90, 5, -60, 0); g.lineTo(40, -10); g.quadraticCurveTo(90, -5, 95, 30); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.rect(-50, -22, 55, 20); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(25, -12); g.lineTo(40, -48); g.lineTo(18, -54); g.stroke();
      g.lineWidth = 7; for (var k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-95 - k * 4, 35 - k * 14); g.quadraticCurveTo(-110 - k * 6 - w * 4, 20 - k * 20, -100 - k * 10, -5 - k * 18); g.stroke(); }
      g.beginPath(); g.moveTo(-100, 60); g.quadraticCurveTo(-50, 50 + w * 4, 0, 60); g.quadraticCurveTo(50, 70, 100, 60); g.stroke();
    } else if (i === 5) {   // kayak + paddle
      g.beginPath(); g.moveTo(-100, 30); g.quadraticCurveTo(0, 0, 100, 30); g.quadraticCurveTo(0, 62, -100, 30); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(0, 28, 24, 8, 0, 0, TAU); g.lineWidth = 7; g.stroke();
      g.save(); g.translate(0, 10); g.rotate(-.6 + w * .25); g.lineWidth = 9; g.beginPath(); g.moveTo(-80, 0); g.lineTo(80, 0); g.stroke();
      g.lineWidth = 8; g.beginPath(); g.ellipse(-86, 0, 18, 9, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.ellipse(86, 0, 18, 9, 0, 0, TAU); g.fill(); g.stroke(); g.restore();
      g.lineWidth = 7; g.beginPath(); g.moveTo(-100, 74); g.quadraticCurveTo(-50, 64 + w * 4, 0, 74); g.quadraticCurveTo(50, 84, 100, 74); g.stroke();
    } else if (i === 6) {   // checkered flag on a pole, waving
      g.beginPath(); g.moveTo(-70, 95); g.lineTo(-70, -90); g.lineWidth = 11; g.stroke();
      for (var rr2 = 0; rr2 < 3; rr2++) for (var cc = 0; cc < 4; cc++) {
        var x0 = -70 + cc * 38, y0 = -85 + rr2 * 36, dy0 = Math.sin(t * 6 + cc * .9) * 7 * (cc / 3), dy1 = Math.sin(t * 6 + (cc + 1) * .9) * 7 * ((cc + 1) / 3);
        g.beginPath(); g.moveTo(x0, y0 + dy0); g.lineTo(x0 + 38, y0 + dy1); g.lineTo(x0 + 38, y0 + 36 + dy1); g.lineTo(x0, y0 + 36 + dy0); g.closePath();
        g.fillStyle = (rr2 + cc) % 2 ? INK : CREAM; g.fill();
      }
      g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); g.moveTo(-70, -85); for (var q = 0; q <= 4; q++) g.lineTo(-70 + q * 38, -85 + Math.sin(t * 6 + q * .9) * 7 * (q / 3)); for (q = 4; q >= 0; q--) g.lineTo(-70 + q * 38, 23 + Math.sin(t * 6 + q * .9) * 7 * (q / 3)); g.closePath(); g.stroke();
    } else if (i === 7) {   // dirt bike
      g.lineWidth = 10;
      [-58, 58].forEach(function (x) { g.beginPath(); g.arc(x, 40, 34, 0, TAU); g.stroke(); g.save(); g.translate(x, 40); g.rotate(t * 8); g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.lineWidth = 6; g.stroke(); g.restore(); });
      g.beginPath(); g.moveTo(-58, 40); g.lineTo(-15, -5); g.lineTo(30, -5); g.lineTo(58, 40); g.moveTo(30, -5); g.lineTo(42, -40); g.lineTo(25, -48); g.stroke();
      g.beginPath(); g.moveTo(-45, -12); g.lineTo(18, -18); g.lineTo(10, -2); g.lineTo(-35, 2); g.closePath(); g.fill(); g.stroke();
      g.lineWidth = 6; g.beginPath(); g.moveTo(-100, 85); g.lineTo(-70, 85 - Math.abs(w) * 6); g.moveTo(-95, 70); g.lineTo(-75, 68); g.stroke();
    } else {                // parachute
      var sw = Math.sin(t * 2.4) * .08; g.rotate(sw);
      g.beginPath(); g.moveTo(-95, -20); g.quadraticCurveTo(0, -130, 95, -20); g.quadraticCurveTo(48, -38, 0, -20); g.quadraticCurveTo(-48, -38, -95, -20); g.closePath(); g.fill(); g.stroke();
      g.lineWidth = 6; g.beginPath(); g.moveTo(-95, -20); g.lineTo(-8, 52); g.moveTo(-32, -28); g.lineTo(-4, 52); g.moveTo(32, -28); g.lineTo(4, 52); g.moveTo(95, -20); g.lineTo(8, 52); g.stroke();
      g.lineWidth = 9; g.beginPath(); g.arc(0, 60, 11, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(0, 71); g.lineTo(0, 96); g.moveTo(-18, 76); g.lineTo(18, 76); g.stroke();
    }
    g.restore();
  }

  /* ---------- footage plates ---------- */
  function drawUse(g, t, u, r, filter) {
    g.save(); g.beginPath(); g.rect(r[0], r[1], r[2], r[3]); g.clip();
    if (filter) g.filter = filter;
    CLIP.draw(g, t, r[0], r[1], r[2], r[3], u);
    g.filter = 'none';
    g.restore();
    g.fillStyle = INK; g.fillRect(r[0], r[1] - 6, r[2], 8); g.fillRect(r[0], r[1] + r[3] - 2, r[2], 8);
  }
  function srcAt(u, t) { var local = Math.max(0, t - u.t0); if (u.freeze != null) local = Math.min(local, u.freeze); return u.from + local * u.speed; }
  function track(u, t, keys) {
    var s = srcAt(u, t);
    if (s <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (var i = 1; i < keys.length; i++) if (s <= keys[i][0]) { var k = seg(s, keys[i - 1][0], keys[i][0]); return [lerp(keys[i - 1][1], keys[i][1], k), lerp(keys[i - 1][2], keys[i][2], k)]; }
    var l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  function circleOn(g, t, u, r, nx, ny, rx, ry, seed, a0) {
    var p = CLIP.toScreen(u, t, nx, ny, r[0], r[1], r[2], r[3]);
    p[0] = clamp(p[0], X0 + rx * .55, X1 - rx * .55);          // the ring stays inside the rail
    g.save(); g.beginPath(); g.rect(X0, r[1], X1 - X0, r[3]); g.clip();
    K.scribble(g, p[0], p[1], rx, ry, eo(seg(t, a0, a0 + .4)), HOT, 12, seed);
    g.restore();
    return p;
  }
  function chipAt(g, s, x, y, bg, col, a, align, px) { if (a <= 0) return; g.save(); g.globalAlpha *= a; K.chip(g, s, x, y, px || 40, { bg: bg || HOT, col: col || INK, align: align }); g.restore(); }
  function credit(g, u, r) { CLIP.credit(g, u, X0 + 10, r[1] + r[3] - 36); }

  /* item plate: grows out of its slot, plays, squeezes shut, flips into the pictogram card and drops back into the slot */
  var FILT = { dive: 'brightness(1.7) contrast(1.08) saturate(1.1)' };
  function annotate(g, t, i, u, r) {
    var a0 = u.t0 + .22, id = ITEMS[i].id, p;
    if (id === 'airboat') circleOn(g, t, u, r, .48, .7, 190, 140, 3, a0);
    else if (id === 'hoops') { p = track(u, t, [[.3, .38, .25], [.9, .45, .33], [1.9, .47, .35], [2.8, .47, .35]]); circleOn(g, t, u, r, p[0], p[1], 170, 120, 5, a0); }
    else if (id === 'dive') circleOn(g, t, u, r, .48, .62, 150, 200, 7, a0);
    else if (id === 'gym') { p = track(u, t, [[.4, .5, .58], [.93, .5, .64], [1.87, .5, .66], [2.8, .5, .58]]); circleOn(g, t, u, r, p[0], p[1], 400, 95, 9, a0); }
    else if (id === 'jetski') { p = track(u, t, [[0, .55, .62], [.6, .48, .62], [1.2, .5, .67], [1.8, .48, .66]]); var q = CLIP.toScreen(u, t, p[0], p[1], r[0], r[1], r[2], r[3]);
      g.save(); g.beginPath(); g.rect(X0, r[1], X1 - X0, r[3]); g.clip(); K.arrow(g, X0 + 60, r[1] + 200, clamp(q[0] - 90, X0 + 80, X1 - 60), q[1] - 70, eo(seg(t, a0, a0 + .35)), HOT, 12, -.25); g.restore(); }
    else if (id === 'kayak') {
      var s0 = CLIP.toScreen(u, t, .5, .58, r[0], r[1], r[2], r[3]), s1 = CLIP.toScreen(u, t, .42, .2, r[0], r[1], r[2], r[3]);
      g.save(); g.beginPath(); g.rect(X0, r[1], X1 - X0, r[3]); g.clip(); K.arrow(g, s0[0], s0[1], clamp(s1[0], X0 + 40, X1 - 40), s1[1] + 40, eo(seg(t, a0, a0 + .4)), HOT, 12, .2); g.restore();
    }
    else if (id === 'race' || id === 'dirtbike') {
      if (id === 'race') circleOn(g, t, u, r, .55, .6, 200, 130, 15, a0);
      else { p = track(u, t, [[.6, .47, .55], [1.9, .58, .6], [2.9, .53, .6]]); circleOn(g, t, u, r, p[0], p[1], 120, 150, 17, a0); }
      chipAt(g, 'LAP 1/2', X1, r[1] + r[3] - 170, CREAM, INK, seg(t, u.t0 + .25, u.t0 + .3), 'right', 44);
      g.save(); g.globalAlpha *= seg(t, a0 + .1, a0 + .25); K.arrow(g, X1 - 70, r[1] + r[3] - 130, X1 - 20, r[1] + r[3] - 90, eo(seg(t, a0 + .2, a0 + .45)), CREAM, 9, .3); g.restore();
    }
    else if (id === 'base') { p = track(u, t, [[.45, .42, .57], [.93, .47, .55], [1.2, .5, .42], [1.7, .47, .42]]); circleOn(g, t, u, r, p[0], p[1], 150, 190, 19, a0); }
  }
  function itemPlate(g, t, i) {
    var u = U[ITEMS[i].id], m = mode(t), slot = slotRect(i, m);
    var e = eio(seg(t, T.ex[i], T.ex[i] + .25));
    var fl = T.fl[i], sh = eio(seg(t, fl + .08, T.tk[i]));
    if (t < fl) {
      var r = lerpR(slot, PLATE, e);
      if (i === 8 && t >= T.bj1) { basePlates(g, t, r); return; }
      var sq = 1 - eio(seg(t, fl - .1, fl));      // the plate squeezes shut before it flips
      g.save(); g.translate(MID + 30, r[1] + r[3] / 2); g.scale(Math.max(.001, sq), 1); g.translate(-(MID + 30), -(r[1] + r[3] / 2));
      drawUse(g, t, u, r, FILT[ITEMS[i].id]);
      if (e >= 1) {
        annotate(g, t, i, u, r);
        chipAt(g, ITEMS[i].label, X0, r[1] + 70, HOT, INK, seg(t, T.ex[i] + .2, T.ex[i] + .32), 'left', 44);
        credit(g, u, r);
      }
      g.restore();
      badge(g, t, i, slot, e);
    } else {
      /* the pictogram card flips open at plate size and drops into the slot */
      var fo = eio(seg(t, fl, fl + .1)), card = lerpR(PLATE, slot, sh);
      var cx = card[0] + card[2] / 2, cy = card[1] + card[3] / 2, side = lerp(card[3], card[2], 0) ;
      g.save(); g.translate(cx, cy); g.scale(Math.max(.001, fo), 1);
      rr(g, -card[2] / 2, -card[3] / 2, card[2], card[3], lerp(0, 30 * slot[2] / GC, sh)); g.fillStyle = HOT; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
      var ps = Math.min(card[2], side) * .0036 * lerp(1.15, .8, sh);
      pict(g, t, PI[ITEMS[i].id], ps);
      g.restore();
    }
  }
  /* the slot's number rides out with the plate to its top-right corner */
  function badge(g, t, i, slot, e) {
    var x = lerp(slot[0] + slot[2] / 2, X1 - 70, e), y = lerp(slot[1] + slot[3] / 2, PLATE[1] + 85, e), s = lerp(slot[2] / GC, 1, e);
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(.06 * Math.sin(t * 3));
    g.beginPath(); g.arc(0, 0, 66, 0, TAU); g.fillStyle = HOT; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    K.sticker(g, String(i + 1), 0, 6, 96, { col: CREAM, wide: false, lw: 10 });
    g.restore();
  }
  /* #9 after the roof run: our canopy opens (0.42 s), then the real canopy */
  function basePlates(g, t, r) {
    if (t < T.ch0) {
      var k = seg(t, T.bj1, T.ch0);
      g.save(); g.beginPath(); g.rect(r[0], r[1], r[2], r[3]); g.clip();
      g.fillStyle = '#8fd3ff'; g.fillRect(r[0], r[1], r[2], r[3]);
      g.save(); g.translate(0, r[1]); K.speedLines(g, W, r[3], MID, r[3] * .44, t, .9, {}); g.restore();
      /* our flat skyline far below */
      g.fillStyle = '#5b6a8c'; for (var b = 0; b < 9; b++) { var bh = 80 + ((b * 53) % 7) * 22; g.fillRect(40 + b * 115, r[1] + r[3] - bh + (1 - k) * 60, 80, bh); }
      g.save(); g.translate(MID, r[1] + r[3] * .44 + Math.sin(t * 9) * 6); var o = eo(k * 1.4); g.scale(lerp(.6, 2.6, o), lerp(.25, 2.6, o)); pict(g, t, 8, 1); g.restore();
      g.restore();
      g.fillStyle = INK; g.fillRect(r[0], r[1] - 6, r[2], 8); g.fillRect(r[0], r[1] + r[3] - 2, r[2], 8);
      chipAt(g, ITEMS[8].label, X0, r[1] + 70, HOT, INK, 1, 'left', 44);
      badge(g, t, 8, r, 1);
    } else {
      var sq = 1 - eio(seg(t, T.fl[8] - .1, T.fl[8]));
      g.save(); g.translate(MID + 30, r[1] + r[3] / 2); g.scale(Math.max(.001, sq), 1); g.translate(-(MID + 30), -(r[1] + r[3] / 2));
      drawUse(g, t, U.chute, r);
      var p = track(U.chute, t, [[.15, .48, .2], [1.4, .52, .2]]);
      circleOn(g, t, U.chute, r, p[0], p[1], 300, 130, 21, T.ch0 + .1);
      chipAt(g, ITEMS[8].label, X0, r[1] + 70, HOT, INK, 1, 'left', 44);
      credit(g, U.chute, r);
      g.restore();
      badge(g, t, 8, r, 1);
    }
  }

  /* ---------- hook frame (frame 0 and the last frame) ---------- */
  var HOOKPX = 120, WPX = 100;
  function hookText(g, t, u) {
    K.slam(g, '9 THINGS TO DO', MID, 255, HOOKPX, u, { col: CREAM, rot: -.03, wide: false, from: .8 });
  }
  function teaser(g, t) {
    /* the freefall plate; from T.tz0 it shrinks into slot 9 */
    var k = eio(seg(t, T.tz0, T.tz1)), r = lerpR(TEASE, gridRect(8), k);
    if (t < T.tz1) {
      drawUse(g, t, U.tease, r);
      if (k < .05) credit(g, U.tease, r);
    }
  }
  function stamp(g, s, x, y, px, u, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); var sc = lerp(1.5, 1, eo(clamp(u / .16, 0, 1))) - .06 * knock(u, .16, 1, 26, 7); g.scale(sc, sc); g.globalAlpha *= clamp(u / .06, 0, 1);
    var w = K.measure(g, s, px, { wide: false }) + px * .9, h = px * 1.5;
    g.fillStyle = HOT; rr(g, -w / 2, -h / 2, w, h, px * .22); g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    K.sticker(g, s, 0, 3, px, { col: CREAM, wide: false, lw: px * .15 });
    g.restore();
  }
  function ending(g, t) {
    /* the source tag, then WHICH FIRST? + comment prompt, held; a pink ring hops slot to slot (every slot, evenly) */
    var out = 1 - seg(t, T.back, T.back + .15);
    chipAt(g, 'ROCKSTAR · AN EXTENDED LOOK', MID, 1426, CREAM, INK, seg(t, T.tk[8], T.tk[8] + .12) * out, 'center', 30);
    /* 9/9 COMPLETE: slams across the grid on the landing, then settles above it */
    var cu = t - T.tk[8] - .04;
    if (cu > 0 && out > 0) {
      var mv = eio(seg(cu, .55, .9)), cy = lerp(890, 440, mv), cs = lerp(1.45, 1, mv);
      g.save(); g.globalAlpha *= out; g.translate(MID, cy); g.scale(cs, cs); stamp(g, '9/9 COMPLETE', 0, 0, 58, cu, -.05); g.restore();
    }
    if (t >= T.which - .05 && out > 0) {
      g.save(); g.globalAlpha *= out;
      K.slam(g, 'WHICH FIRST?', MID, 1334, WPX, t - T.which + .05, { col: HOT, rot: -.03, wide: false, from: .75 });
      var hop = Math.floor((t - T.which) / .3), j = ((hop % 9) + 9) % 9, gr = gridRect(j);
      if (t > T.which + .2) { g.lineWidth = 10; g.strokeStyle = CREAM; rr(g, gr[0] - 10, gr[1] - 10, gr[2] + 20, gr[3] + 20, 38); g.stroke(); }
      g.restore();
    }
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    backdrop(g, t);
    slots(g, t);
    if (t < T.tz1) teaser(g, t);
    var cur = current(t); if (cur >= 0 && t >= T.ex[cur]) itemPlate(g, t, cur);
    if (t >= T.tk[8]) ending(g, t);
    if (t >= T.back) {
      var k = eio(seg(t, T.back + .05, T.back + .35)), r = lerpR(gridRect(8), TEASE, k);
      drawUse(g, t, U.end, r);
      if (k > .95) credit(g, U.end, r);
    }
    pill(g, t);
    counter(g, t);
    /* hook words: landed on frame 0, leave as item 1 lights; slam back for the loop */
    var ha = 1 - seg(t, T.lit[0] - .25, T.lit[0] - .05);
    if (ha > 0 && t < T.back) { g.save(); g.globalAlpha *= ha; hookText(g, t, t + 1); g.restore(); }
    if (t >= T.back + .2) hookText(g, t, t - T.back - .2);
    if (t >= T.count - .05 && t < T.lit[0]) { g.save(); g.globalAlpha *= ha; K.popWords(g, ['COUNT', '*ALONG'], MID, 380, 64, t - T.count + .05, { hot: HOT, gap: .14, wide: false }); g.restore(); }
    captions(g, t);
  }
  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (t < .01 || t > DUR - .5) samples = 1;   // frame 0 and the settled loop frames are sharp, so the last frame equals frame 0
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
    Tx('hook', '9 THINGS TO DO', 0, T.lit[0] - .1); Tx('hook', '9 THINGS TO DO', T.back + .1, DUR + 1);
    var m = mode(t);
    ITEMS.forEach(function (it, i) {
      Tx('l' + i, it.label, T.ex[i] + .3, i === 8 ? T.fl[8] - .1 : T.fl[i] - .1);           // the chip on the plate
      if (m < .3 && t >= T.tk[i] && t < T.back) Tx('l' + i, it.label, 0, DUR + 1);       // the label in its slot
    });
    if (t >= U.race.t0 + .26 && t < U.race.t1 - .02) Tx('lap', 'LAP 1/2', 0, DUR);
    if (t >= U.dirtbike.t0 + .26 && t < U.dirtbike.t1 - .02) Tx('lap', 'LAP 1/2', 0, DUR);
    Tx('src', 'ROCKSTAR · AN EXTENDED LOOK', T.tk[8] + .06, T.back + .12);
    Tx('which', 'WHICH FIRST?', T.which + .1, T.back + .08);
    Tx('done', '9/9 COMPLETE', T.tk[8] + .1, T.back + .08);
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
      WPX = Math.min(110, Math.floor(110 * 790 / K.measure(ctx, 'WHICH FIRST?', 110, { wide: false })));
      HOOKPX = Math.min(130, Math.floor(130 * 800 / K.measure(ctx, '9 THINGS TO DO', 130, { wide: false })));
      window.FILM.POSTER = .45;
      window.FILM.SHOTS = [{ id: 'hook', name: 'Nine things', t0: 0, t1: T.lit[0] }].concat(ITEMS.map(function (it, i) { return { id: it.id, name: (i + 1) + ' ' + it.label.toLowerCase(), t0: T.lit[i], t1: i < 8 ? T.lit[i + 1] : T.tk[8] }; })).concat([{ id: 'end', name: 'Which first?', t0: T.tk[8], t1: DUR }]);
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

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: .45, SLUG: 'gta-thingstodo', SHOTS: [], LIVE: {}, init: init, render: render, frame: frame, T: T };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
