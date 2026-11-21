/* "GTA 6 lets aliens take you": GTA 6, Delta, commentary mode (SAFE-EDIT rule 10) + background plates (rule 11).
   A top-5 countdown of launch-week finds, each proven by a short muted creator clip (facecams and captions cropped out,
   credit in the description only), over dimmed real gameplay from GTA VI: An Extended Look playing behind the cards.
   Native move: the beam drop. A countdown dial slams onto the plate on each number, then every clip card is lowered
   out of the sky in a coral cone of light (the UFO motif) and beamed back up when we're done with it. At #1 the beam is real.
   Loop: "Walk toward that light, and…" is finished by "GTA 6 lets aliens take you."; the last frame rebuilds frame 0.
   Pure function of t, keyed to the voice with at(id, word). Rail x 90-930, glyphs above y 1450.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx), BOUNDS_RUN. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, K = window.KIT, CLIP = window.CLIP;
  var BG = '#0a0f22', BG2 = '#16204a', INK = '#0c1124', CREAM = '#f6efe2', COR = '#ff6a4d', COR2 = '#ffb199', MINT = '#7dffc8';
  var YEL = '#ffd23f', TAXI = '#ffc21a', BRONZE = '#c98a4b', BRONZE2 = '#8a5328', XRAY = '#10345c', SILVER = '#c9cdd6';
  var TAU = Math.PI * 2;
  var X0 = 90, X1 = 930, MID = 510, CAPY = 212, PILLY = 100;
  var DIALC = [852, 112, 64];                     // the dial's corner seat (x, y, r): top right, beside the GTA 6 pill

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
  var T = {}, EV = [], U = {}, P = {};
  function ev(t, type, g, extra) { var e = { t: t, type: type, g: g == null ? 1 : g }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
  var VAD = window.VAD || [];
  function silAfter(t) { for (var i = 0; i < VAD.length; i++) if (VAD[i][1] > t + .05) return VAD[i]; return [t + .1, t + .3]; }
  var ITEMS = ['bent', 'suit', 'crab', 'skunk', 'dark'], NUMW = ['five', 'four', 'three', 'two', 'one'];
  var CL = 1.45, CL1 = 1.4;                       // on-screen seconds per item card, and for the #1 UFO card
  function initTimes() {
    EV.length = 0; CLIP.reset();
    /* hook: the card under the light is already on at frame 0; she is taken (beamed up) at T.taken */
    T.taken = 1.6; T.search = 1.7;
    T.l0 = start('list') - .08; T.one = at('list', 'one'); T.of5 = at('list', 'five'); T.secrets = at('list', 'finds');
    /* items: the dial slams on the number word, the card drops right after it */
    T.n = ITEMS.map(function (id, i) { return at(id, NUMW[i]) - .04; });
    T.item = ITEMS.map(function (id) { return start(id) - .12; });
    T.bentIn = at('bent', 'car') - .32; T.banana = at('bent', 'banana');
    T.xray = at('scoliosis', 'calls') - .08; T.scol = at('scoliosis', 'scoliosis');
    T.suitIn = at('suit', 'man') - .32;
    T.dr0 = start('drive') - .1; T.sounds = at('drive', 'sounds'); T.coll = at('drive', 'collateral'); T.y04 = at('drive', '2004');
    T.crabIn = at('crab', 'crab') - .32; T.home = at('crab', 'home');
    T.skw = at('skunk', 'skunk'); T.flo = at('skunk', 'floridas'); T.close = at('skunk', 'up');
    T.skIn = wend('skunk', 'close') + .38 - CL;
    T.oneIn = at('dark', 'ufo') - .3; T.road = T.oneIn + CL1;   // #1: the real light first, then our map of where
    T.tr0 = start('trophy') - .1; T.called = at('trophy', 'called'); T.tis = at('trophy', 'is'); T.truth = at('trophy', 'truth');
    T.lp0 = start('loop') - .1; T.walk = at('loop', 'walk'); T.light = at('loop', 'light');
    T.back = DUR - .45;                           // the hook frame rebuilds: the last frame is frame 0
    T.ufoIn = wend('loop', 'light') + .05;       // the real light is lowered in after "that light"

    /* creator clips: each short, annotated, inside our own card; clipkit.py lint holds the share to rule 10 (<= 34 %) */
    U.hook = CLIP.use('ufo', 0, T.taken + .2, { from: .95, speed: .47, zoom: [1.2, 1.2], focus: [.58, .4], note: 'hook: Lucia under the light on a dark road, she starts to glow white; the card is beamed up (she is taken)' });
    U.bent = CLIP.use('bent', T.bentIn, T.bentIn + CL, { from: .18, speed: .75, freeze: 1.0, zoom: [1.0, 1.0], focus: [.5, .55], note: 'the bent black muscle car from above; freeze on the most kinked frame, coral curve along its bent side against a straight dashed line' });
    U.suit = CLIP.use('suit', T.suitIn, T.suitIn + CL, { speed: 1.75 / CL, zoom: [2.2, 2.2], focus: [.15, .72], note: 'zoomed 2.2x and following the man in the dark suit across the street to the silver sedan; ring on him' });
    U.crab = CLIP.use('crab', T.crabIn, T.crabIn + CL, { speed: 1.75 / CL, zoom: [1.0, 1.08], focus: [.5, .4], note: 'the giant crab on top of Jason on his floor, ringed; chip IN HIS CLIP' });
    U.skunk = CLIP.use('skunk', T.skIn, T.skIn + CL, { speed: 1.75 / CL, zoom: [1.0, 1.14], focus: [.3, .5], note: 'exposure lifted: the hairy legs walk past the knocked-down player; chips SKUNK APE, FLORIDA LEGEND, a height bar beside it' });
    U.one = CLIP.use('ufo', T.oneIn, T.road, { from: 1.0, speed: .77 / CL1, zoom: [1.12, 1.3], focus: [.6, .45], note: '#1 proof: the player engulfed in white light on the dark road; the beam widens to a white-out' });
    var lp = DUR - T.ufoIn;
    U.loop = CLIP.use('ufo', T.ufoIn, DUR, { from: .95 - lp * .5, speed: .5, zoom: [1.2, 1.2], focus: [.58, .4], note: 'loop: she looks up at the light and starts to glow; the beam widens into the hook frame' });

    /* background plates (rule 11): real GTA 6 gameplay from An Extended Look, dimmed, always under our cards.
       All-ours stretches: the X-ray (after the bent card), the Collateral card and the #1 map. */
    function plate(name, t0, t1, from, len, dim) { var u = CLIP.use(name, t0, t1, { plate: true, from: from || 0, speed: Math.min(1, (len - (from || 0) - .05) / (t1 - t0)), zoom: [1.12, 1.2], focus: [.5, .5] }); u.dim = dim || .58; return u; }
    P.night = plate('p7night', 0, T.l0, 0, 2.0);
    P.palms = plate('p4palms', T.l0, T.item[0], 0, 4.0, .66);
    P.drive = plate('p2drive', T.item[0], U.bent.t1 + .1, 0, 4.0);
    P.van = plate('p5van', T.item[1], T.dr0, 0, 4.0, .68);
    P.coast = plate('p3coast', T.item[2], T.item[3], 0, 4.0);
    P.wild = plate('p1wild', T.item[3], T.item[4], 0, 2.85);
    P.night2 = plate('p7night', T.item[4], T.road, 2.05, 4.0);
    P.aerial = plate('p6aerial', T.tr0 - .1, T.ufoIn, 0, 4.0);
    P.sky = plate('p8skyline', T.ufoIn, DUR - .05, 0, 3.1);

    /* sound: hits sit in the voice's silences or on the landing */
    ev(.02, 'rise', .35, { t1: .5 });
    ev(T.taken - .05, 'whoosh', .5);
    ev(T.one + .02, 'slam', .55); ev(T.of5 + .05, 'pop', .4);
    T.n.forEach(function (n, i) { ev(n + .02, 'slam', .65); ev(n + .1, 'tick', .4); });
    [T.bentIn, T.suitIn, T.crabIn, T.skIn, T.oneIn].forEach(function (d) { ev(d, 'whoosh', .45); ev(d + .36, 'thud', .5); });
    [U.bent.t1, U.suit.t1, U.crab.t1, U.skunk.t1].forEach(function (e) { ev(e - .38, 'swish', .35); });
    ev(T.banana + .05, 'boing', .35);
    ev(U.bent.t0 + U.bent.freeze, 'shutter', .45);
    ev(U.bent.t1 + .02, 'zip', .4);
    ev(T.dr0 + .08, 'key', .35);
    ev(T.y04 + .02, 'slam', .5);
    ev(T.home + .05, 'pop', .4);
    ev(T.close, 'thud', .35);
    ev(T.truth - .05, 'ding', .5);
    ev(T.road - .45, 'rise', .4, { t1: T.road - .05 }); ev(T.road - .03, 'slam', .6); ev(T.road + .05, 'shutter', .35);
    ev(T.ufoIn, 'rise', .35, { t1: T.back });
    ev(T.back + .05, 'whoosh', .4);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  /* ---------- captions: phrase cards of 2-4 words at 96 px; coral on the stressed words ---------- */
  var CHUNKS = [], CPX = 96;
  var WEAK = { a: 1, an: 1, the: 1, is: 1, to: 1, in: 1, by: 1, you: 1, of: 1, for: 1, this: 1, and: 1, its: 1, on: 1, from: 1, at: 1, was: 1, it: 1, his: 1, like: 1, that: 1 };
  function buildChunks(g) {
    var HOTW = { one: 1, five: 1, secrets: 1, bent: 1, banana: 1, scoliosis: 1, man: 1, suit: 1, calm: 1, drive: 1, collateral: 1, '2004': 1, giant: 1, crab: 1, jason: 1, home: 1, skunk: 1, ape: 1, bigfoot: 1, close: 1, dark: 1, road: 1, nobody: 1, trophy: 1, truth: 1, light: 1 };
    var GAP = CPX * .3;
    function wd(w) { return K.measure(g, w.w, CPX, { wide: false }); }
    function width(c) { return c.reduce(function (a, w) { return a + wd(w); }, 0) + GAP * (c.length - 1); }
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;                // frame 0 carries its own three words
      var lw = l.words; if (/^(five|four|three|two|one)$/.test(norm(lw[0].w))) lw = lw.slice(1);   // the dial says the number
      var ws = lw.map(function (w) { return { w: w.w.replace(/[,:.]$/, '').replace(/…$/, '…').toUpperCase(), raw: w.w, t0: w.t0, t1: w.t1, hot: !!HOTW[norm(w.w)] }; });
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
    CHUNKS.forEach(function (c, i) { var nx = CHUNKS[i + 1]; c.t0 = c[0].t0 - .05; c.t1 = nx ? Math.min(nx[0].t0 - .1, c[c.length - 1].t1 + .4) : c[c.length - 1].t1 + .4; });
  }
  function captions(g, t) {
    if (t > T.back - .05) return;
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (t < c.t0 || t >= c.t1) continue;
      var k = eo(seg(t, c.t0, c.t0 + .12)), gap = CPX * .3, n = c.rows.length;
      g.save(); g.globalAlpha *= k * (1 - seg(t, c.t1 - .1, c.t1));
      c.rows.forEach(function (row, r) {
        var ws = row.map(function (w) { return K.measure(g, w.w, CPX, { wide: false }); });
        var tw = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (row.length - 1), x = MID - tw / 2, s = Math.min(1, 830 / tw);
        var y = (n === 1 ? CAPY + 45 : CAPY + r * 100) + (1 - k) * 20;
        g.save(); g.translate(MID, y); g.scale(s, s); g.translate(-MID, -y);
        row.forEach(function (w, j) {
          var on = t >= w.t0 && t < w.t1 + .05;
          K.sticker(g, w.w, x + ws[j] / 2, y + (on ? -6 : 0), CPX, { col: w.hot ? COR : CREAM, ink: INK, wide: false, lw: CPX * .17 });
          x += ws[j] + gap;
        });
        g.restore();
      });
      g.restore();
      return;
    }
  }

  /* ---------- backdrop: our night sky, with the real gameplay plate dimmed over it ---------- */
  function sky(g, t) {
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, BG); gr.addColorStop(1, BG2);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (var i = 0; i < 70; i++) {
      var x = hash(i) * W, y = hash(i + 50) * H * .95, tw = .5 + .5 * osc(t, 3 + (i % 5), i);
      x = (x + t / DUR * W * (1 + (i % 2))) % W;     // loop-periodic drift: the last frame matches frame 0
      g.fillStyle = 'rgba(246,239,226,' + (.25 + .55 * tw) + ')'; g.fillRect(x, y, 3 + (i % 3), 3 + (i % 3));
    }
  }
  function backdrop(g, t) {
    sky(g, t);
    var a = seg(t, .05, .45) * (1 - seg(t, T.back - .1, DUR - .05));
    if (a > 0) {
      var pu = CLIP.activePlate(t); g.save(); g.globalAlpha = a; CLIP.plate(g, t, 0, 0, W, H, { dim: pu && pu.dim ? pu.dim : .58 }); g.restore();
      g.save(); g.globalAlpha = .22 * a; g.fillStyle = BG; g.fillRect(0, 0, W, H); g.restore();
    }
  }

  /* ---------- the beam: a coral cone of light from above the frame ---------- */
  function beam(g, t, cx, y1, w0, w1, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    var gr = g.createLinearGradient(0, -60, 0, y1);
    gr.addColorStop(0, 'rgba(255,106,77,0)'); gr.addColorStop(.35, 'rgba(255,106,77,.32)'); gr.addColorStop(1, 'rgba(255,236,214,.55)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(cx - w0 / 2, -60); g.lineTo(cx + w0 / 2, -60); g.lineTo(cx + w1 / 2, y1); g.lineTo(cx - w1 / 2, y1); g.closePath(); g.fill();
    g.clip();
    /* drifting motes inside the cone, loop-periodic */
    for (var i = 0; i < 26; i++) {
      var u = (hash(i + 7) + t / DUR * (3 + (i % 3))) % 1, x = cx + (hash(i) - .5) * lerp(w0, w1, 1 - u) * .9, y = lerp(y1, -60, u);
      g.fillStyle = 'rgba(255,246,232,.7)'; g.beginPath(); g.arc(x, y, 3 + (i % 4), 0, TAU); g.fill();
    }
    g.strokeStyle = 'rgba(255,246,232,.35)'; g.lineWidth = 4;
    for (var j = -2; j <= 2; j++) { g.beginPath(); g.moveTo(cx + j * w0 * .18, -60); g.lineTo(cx + j * w1 * .2, y1); g.stroke(); }
    g.restore();
  }
  /* a card's drop/lift state: lowered in on tIn (lands ~0.35 s later), lifted out ending at tOut */
  function drop(t, tIn, tOut) {
    var dn = cd(t, tIn, 9), up = eio(seg(t, tOut - .38, tOut));
    var oy = -(1 - dn) * 1300 - up * 1500;
    var ba = seg(t, tIn - .06, tIn + .02) * (1 - seg(t, tIn + .4, tIn + .75)) + seg(t, tOut - .5, tOut - .4) * (1 - seg(t, tOut - .06, tOut));
    return { oy: oy, beam: clamp(ba, 0, 1), land: tIn + .34, on: t >= tIn - .02 && t < tOut };
  }
  function cardFrame(g, x, y, w, h, fill) {
    g.save(); rr(g, x - w / 2 + 10, y - h / 2 + 16, w, h, 26); g.fillStyle = 'rgba(0,0,0,.5)'; g.fill(); g.restore();
    rr(g, x - w / 2 - 10, y - h / 2 - 10, w + 20, h + 20, 30); g.fillStyle = CREAM; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    if (fill) { rr(g, x - w / 2, y - h / 2, w, h, 20); g.fillStyle = fill; g.fill(); }
  }
  /* the clip card: footage inside our cream frame, in its own transform; `over` draws annotations in card px */
  function clipCard(g, t, u, L, tIn, tOut, over, filter) {
    var d = drop(t, tIn, tOut); if (!d.on) return null;
    beam(g, t, L.x, L.y - L.h / 2 + d.oy + 40, 180, L.w + 140, d.beam);
    var sc = 1 + .035 * knock(t, d.land, 1, 24, 8) + (L.push ? L.push(t) : 0);
    g.save(); g.translate(L.x, L.y + d.oy); g.rotate(L.r + (1 - cd(t, tIn, 9)) * .06); g.scale(sc, sc);
    cardFrame(g, 0, 0, L.w, L.h);
    g.save(); rr(g, -L.w / 2, -L.h / 2, L.w, L.h, 20); g.clip();
    if (filter) g.filter = filter;
    CLIP.draw(g, t, -L.w / 2, -L.h / 2, L.w, L.h, u);
    g.filter = 'none';
    if (u.freeze != null && t >= u.t0 + u.freeze) { g.save(); g.translate(-W / 2, -H / 2); K.freezeFX(g, W, H, t - u.t0 - u.freeze); g.restore(); }
    if (over) over(g, d);
    g.restore();
    g.restore();
    return d;
  }
  /* a point in the clip (0..1 of the source) -> card-local px */
  function cpt(u, t, L, nx, ny) { return CLIP.toScreen(u, t, nx, ny, -L.w / 2, -L.h / 2, L.w, L.h); }
  function track(u, t, keys) {
    var local = Math.max(0, t - u.t0); if (u.freeze != null) local = Math.min(local, u.freeze);
    var src = u.from + local * u.speed;
    if (src <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (var i = 1; i < keys.length; i++) if (src <= keys[i][0]) { var k = seg(src, keys[i - 1][0], keys[i][0]); return [lerp(keys[i - 1][1], keys[i][1], k), lerp(keys[i - 1][2], keys[i][2], k)]; }
    var l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  function chipAt(g, s, x, y, bg, col, a, align, px) { if (a <= 0) return; g.save(); g.globalAlpha *= a; K.chip(g, s, x, y, px || 40, { bg: bg || CREAM, col: col || INK, align: align }); g.restore(); }

  /* ---------- the countdown dial: a coral ring, five ticks, one big numeral ---------- */
  function dialShape(g, t, x, y, r, num, lit, spin, col) {
    g.save(); g.translate(x, y);
    g.beginPath(); g.arc(8, 12, r, 0, TAU); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fillStyle = INK; g.fill();
    g.lineWidth = r * .16; g.strokeStyle = col || COR; g.beginPath(); g.arc(0, 0, r * .84, 0, TAU); g.stroke();
    g.lineWidth = r * .05; g.strokeStyle = CREAM; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
    for (var i = 0; i < 5; i++) {
      var a = -Math.PI / 2 + (i - 2) * .42 + spin;
      g.beginPath(); g.arc(Math.cos(a) * r * .84, Math.sin(a) * r * .84, r * .085, 0, TAU);
      g.fillStyle = i < lit ? CREAM : 'rgba(12,17,36,.85)'; g.fill();
    }
    K.sticker(g, String(num), 0, r * .1, r * 1.05, { col: CREAM, ink: INK, wide: false, lw: 0, shadow: false });
    g.restore();
  }
  /* which item's dial is up at t, and where: big in the middle on the number, then to its corner seat as the card drops */
  function dial(g, t) {
    var i = -1; for (var k = 0; k < 5; k++) if (t >= T.n[k] - .02) i = k;
    if (i < 0 || t > T.back - .05) return;
    var n0 = T.n[i], nxt = i < 4 ? T.n[i + 1] - .02 : T.back - .05;
    var dIn = [T.bentIn, T.suitIn, T.crabIn, T.skw - .1, T.oneIn][i];
    var u = t - n0, k = eo(clamp(u / .14, 0, 1)), down = 1 - eio(seg(t, nxt - .14, nxt));
    var go = eio(seg(t, dIn - .12, dIn + .3));
    var x = lerp(540, DIALC[0], go), y = lerp(860, DIALC[1], go), r = lerp(210, DIALC[2], go);
    var sc = lerp(1.6, 1, k) * down - .06 * knock(u, .12, 1, 26, 8);
    if (sc <= 0) return;
    g.save(); g.globalAlpha *= clamp(u / .05, 0, 1); g.translate(x, y); g.scale(sc, sc); g.rotate((1 - k) * -.4);
    dialShape(g, t, 0, 0, r, 5 - i, 5 - i, (1 - k) * 1.2 + osc(t, 7, i) * .03);
    g.restore();
  }

  /* ---------- the hook frame (frame 0 and the last frame) ---------- */
  var LHOOK = { x: 540, y: 1010, w: 800, h: 1000, r: 0 };
  function hookWords(g, t, u, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    var pulse = 1 + osc(t, 14) * .012;
    g.translate(MID, 300); g.scale(pulse, pulse);
    K.slam(g, 'ALIENS', 0, 0, 140, u, { col: CREAM, ink: INK, rot: -.03, wide: false, from: 1.2 });
    K.slam(g, 'TAKE YOU?', 0, 136, 126, u - .06, { col: COR, ink: INK, rot: -.045, wide: false, from: 1.2 });
    g.restore();
  }
  function ufoCard(g, t, u, lift, beamA) {
    var oy = -lift * 1600;
    beam(g, t, LHOOK.x, H + 40, 300 + 80 * osc(t, 9), 1500, beamA);
    if (lift >= 1) return;
    g.save(); g.translate(LHOOK.x, LHOOK.y + oy); g.rotate(osc(t, 8) * .012 + lift * .08); var s = 1 - lift * .4; g.scale(s, s);
    cardFrame(g, 0, 0, LHOOK.w, LHOOK.h);
    g.save(); rr(g, -LHOOK.w / 2, -LHOOK.h / 2, LHOOK.w, LHOOK.h, 20); g.clip();
    CLIP.draw(g, t, -LHOOK.w / 2, -LHOOK.h / 2, LHOOK.w, LHOOK.h, u);
    /* our beam continues over the footage, soft, so the real light and ours are one */
    var gr = g.createLinearGradient(0, -LHOOK.h / 2, 0, LHOOK.h / 2); gr.addColorStop(0, 'rgba(255,236,214,.28)'); gr.addColorStop(.5, 'rgba(255,236,214,0)');
    g.fillStyle = gr; g.fillRect(-LHOOK.w / 2, -LHOOK.h / 2, LHOOK.w, LHOOK.h);
    g.restore();
    g.restore();
  }
  function beatHook(g, t) {
    var lift = eio(seg(t, T.taken - .1, T.taken + .25));
    ufoCard(g, t, U.hook, lift, 1 - seg(t, T.taken + .3, T.l0));
    K.flash(g, W, H, t - T.taken, .5);
    hookWords(g, t, t + 1, 1 - seg(t, T.l0 - .25, T.l0));
    chipAt(g, 'GTA 6 SECRETS', X1, PILLY, COR, INK, seg(t, T.search, T.search + .15) * (1 - seg(t, T.l0 - .2, T.l0)), 'right');
  }
  /* list: "That's number one of five": a mint #1 dial, then the row of five */
  function beatList(g, t) {
    var u1 = t - T.one, row = seg(t, T.of5 - .05, T.of5 + .1), gone = 1 - eio(seg(t, T.n[0] - .2, T.n[0] + .02));
    if (gone <= 0) return;
    if (u1 > 0) {
      var k = eo(clamp(u1 / .14, 0, 1)), y = lerp(760, 700, row);
      g.save(); g.globalAlpha *= gone; g.translate(540, y); var s = lerp(1.5, 1, k) - .06 * knock(u1, .12, 1, 26, 8); s *= lerp(1, .78, row); g.scale(s, s);
      dialShape(g, t, 0, 0, 210, 1, 5, osc(t, 7) * .03 + (1 - k), MINT);
      g.restore();
    }
    chipAt(g, 'GTA 6 SECRETS', MID, 1250, COR, INK, seg(t, T.secrets - .05, T.secrets + .1) * gone, 'center', 44);
  }
  /* the menu: five small drawn icons (banana car, suit, claw, footprint, saucer); big in a row on "five", then a strip
     along the bottom where the current one is ringed and the passed ones go out one by one */
  function icon(g, t, i, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = g.lineCap = 'round'; g.lineWidth = 6; g.strokeStyle = INK;
    g.beginPath(); g.arc(0, 0, 62, 0, TAU); g.fillStyle = CREAM; g.fill(); g.stroke();
    if (i === 0) {        /* a banana-bent car */
      g.beginPath(); g.moveTo(-44, 10); g.quadraticCurveTo(0, -30, 44, 10); g.lineTo(44, 24); g.quadraticCurveTo(0, -12, -44, 24); g.closePath(); g.fillStyle = '#2b2b33'; g.fill(); g.stroke();
      g.fillStyle = YEL; g.beginPath(); g.arc(-26, 30, 9, 0, TAU); g.arc(26, 30, 9, 0, TAU); g.fill();
    } else if (i === 1) { /* a suit and tie */
      g.beginPath(); g.moveTo(-40, 48); g.lineTo(-34, -20); g.quadraticCurveTo(0, -40, 34, -20); g.lineTo(40, 48); g.closePath(); g.fillStyle = '#20232c'; g.fill(); g.stroke();
      g.fillStyle = CREAM; g.beginPath(); g.moveTo(-12, -30); g.lineTo(0, 6); g.lineTo(12, -30); g.closePath(); g.fill();
      g.fillStyle = COR; g.beginPath(); g.moveTo(-5, -22); g.lineTo(5, -22); g.lineTo(3, 18); g.lineTo(-3, 18); g.closePath(); g.fill();
    } else if (i === 2) { /* a crab claw */
      g.save(); g.rotate(-.3 + Math.sin(t * 6) * .12); g.fillStyle = '#d9533c';
      g.beginPath(); g.moveTo(-10, 40); g.quadraticCurveTo(-30, -10, 0, -40); g.lineTo(8, -12); g.quadraticCurveTo(26, -34, 34, -22); g.quadraticCurveTo(28, 10, 10, 40); g.closePath(); g.fill(); g.stroke(); g.restore();
    } else if (i === 3) { /* a footprint */
      g.fillStyle = '#6b4a33'; g.beginPath(); g.ellipse(0, 10, 20, 32, 0, 0, TAU); g.fill(); g.stroke();
      for (var k = 0; k < 4; k++) { g.beginPath(); g.arc(-15 + k * 10, -30 - (k === 0 ? 0 : 3), 6, 0, TAU); g.fill(); }
    } else {              /* a saucer with its beam */
      g.fillStyle = 'rgba(255,236,214,.9)'; g.beginPath(); g.moveTo(-10, 4); g.lineTo(10, 4); g.lineTo(28, 46); g.lineTo(-28, 46); g.closePath(); g.fill();
      g.fillStyle = MINT; g.beginPath(); g.ellipse(0, -14, 20, 16, 0, Math.PI, TAU); g.fill(); g.stroke();
      g.fillStyle = '#8d93a3'; g.beginPath(); g.ellipse(0, -6, 44, 13, 0, 0, TAU); g.fill(); g.stroke();
    }
    g.restore();
  }
  function menu(g, t) {
    if (t < T.of5 || t > T.back - .05) return;
    var dock = eio(seg(t, T.n[0] - .25, T.n[0] + .15)), cur = -1;
    for (var k = 0; k < 5; k++) if (t >= T.n[k] - .02) cur = k;
    for (var i = 0; i < 5; i++) {
      var ui = t - (T.of5 + .04 + i * .08); if (ui < 0) continue;
      var kk = eo(clamp(ui / .14, 0, 1));
      var x = lerp(150 + i * 195, 400 + i * 96, dock), y = lerp(1080, 1405, dock) + Math.sin(t * 3 + i) * 4 * (1 - dock);
      var s = lerp(1.25, .62, dock) * lerp(1.5, 1, kk), done = i < cur ? 1 - .7 * seg(t, T.n[i + 1] - .05, T.n[i + 1] + .2) : 1;
      if (i === cur) s *= 1 + .18 * eo(seg(t, T.n[i], T.n[i] + .2)) - .1 * knock(t, T.n[i] + .05, 1, 24, 8);
      g.save(); g.globalAlpha *= clamp(ui / .05, 0, 1) * (1 - seg(t, T.back - .3, T.back - .05)) * done;
      if (i === cur) { g.beginPath(); g.arc(x, y, 62 * s + 10, 0, TAU); g.lineWidth = 8; g.strokeStyle = i === 4 ? MINT : COR; g.stroke(); }
      icon(g, t, i, x, y, s);
      g.restore();
    }
  }

  /* ---------- #5 the bent car ---------- */
  var LBENT = { x: 540, y: 840, w: 1000, h: 830, r: -.02 };
  var BENDK = [[.40, .22], [.385, .33], [.41, .47], [.37, .58], [.31, .70], [.30, .82], [.31, .92]];
  function banana(g, t, x, y, s, k) {
    if (k <= 0) return;
    g.save(); g.translate(x + (1 - k) * 300, y); g.rotate(-.35 + osc(t, 9) * .06 + (1 - k) * .8); g.scale(s, s);
    g.lineJoin = 'round'; g.lineWidth = 9; g.strokeStyle = INK;
    g.beginPath(); g.moveTo(-170, -30); g.quadraticCurveTo(0, 150, 170, -40); g.quadraticCurveTo(160, -10, 150, 0); g.quadraticCurveTo(0, 80, -150, -10); g.closePath();
    g.fillStyle = YEL; g.fill(); g.stroke();
    g.fillStyle = '#5a3d1e'; g.beginPath(); g.arc(-168, -30, 12, 0, TAU); g.fill(); rr(g, 150, -62, 26, 30, 6); g.fill();
    g.restore();
  }
  function beatBent(g, t) {
    clipCard(g, t, U.bent, LBENT, T.bentIn, U.bent.t1 + .02, function (g2) {
      var fz = U.bent.t0 + U.bent.freeze; if (t < fz + .05) return;
      var k = eo(seg(t, fz + .05, fz + .35));
      /* what a straight car would be (dashed) against its real side, which kinks */
      var a = cpt(U.bent, t, LBENT, BENDK[0][0], BENDK[0][1]), b = cpt(U.bent, t, LBENT, BENDK[6][0], BENDK[6][1]);
      g2.save(); g2.setLineDash([22, 16]); g2.lineWidth = 7; g2.strokeStyle = CREAM; g2.globalAlpha *= k; g2.beginPath(); g2.moveTo(a[0], a[1]); g2.lineTo(b[0], b[1]); g2.stroke(); g2.restore();
      g2.save(); g2.lineWidth = 13; g2.strokeStyle = COR; g2.lineCap = g2.lineJoin = 'round'; g2.beginPath();
      var n = 1 + Math.floor(k * 5.99);
      for (var i = 0; i <= n; i++) { var p = cpt(U.bent, t, LBENT, BENDK[i][0], BENDK[i][1]); if (i) g2.lineTo(p[0], p[1]); else g2.moveTo(p[0], p[1]); }
      g2.stroke(); g2.restore();
    });
    chipAt(g, 'IN HIS CLIP', X0, 1315, COR, INK, seg(t, T.bentIn + .4, T.bentIn + .55) * (1 - seg(t, T.xray + .5, T.xray + .65)));
    banana(g, t, 790, 1290, .72, eo(seg(t, T.banana - .05, T.banana + .3)) * (1 - seg(t, T.suitIn - .1, T.suitIn + .1)));
    if (t >= U.bent.t1 - .05) xray(g, t);
  }
  /* "He calls it scoliosis": our X-ray of the bent car, a spine drawn on along its bend */
  function xray(g, t) {
    var k = eo(seg(t, U.bent.t1 - .05, U.bent.t1 + .25)), out = 1 - eio(seg(t, T.suitIn - .1, T.suitIn + .2));
    if (out <= 0) return;
    g.save(); g.translate(LBENT.x, LBENT.y - 20); g.rotate(LBENT.r); g.scale(k * out, 1 * out);
    cardFrame(g, 0, 0, 760, 640, XRAY);
    g.save(); rr(g, -380, -320, 760, 640, 20); g.clip();
    g.strokeStyle = 'rgba(170,220,255,.12)'; g.lineWidth = 2;
    for (var gx = -380; gx < 380; gx += 40) { g.beginPath(); g.moveTo(gx, -320); g.lineTo(gx, 320); g.stroke(); }
    for (var gy = -320; gy < 320; gy += 40) { g.beginPath(); g.moveTo(-380, gy); g.lineTo(380, gy); g.stroke(); }
    /* the car from above, its body kinked in the middle like the one in his clip */
    function bend(v) { return 70 * Math.sin(v * Math.PI) * (v < .5 ? 1 : .8) + 25 * Math.sin(v * TAU * 1.5); }
    g.strokeStyle = 'rgba(200,235,255,.8)'; g.lineWidth = 8; g.lineJoin = 'round';
    g.beginPath();
    for (var i = 0; i <= 20; i++) { var v = i / 20, y = -260 + v * 520; g.lineTo(bend(v) - 120, y); }
    for (var j = 20; j >= 0; j--) { var v2 = j / 20, y2 = -260 + v2 * 520; g.lineTo(bend(v2) + 120, y2); }
    g.closePath(); g.stroke();
    /* the spine */
    var sk = eo(seg(t, T.scol - .15, T.scol + .45));
    for (var s = 0; s < 11; s++) {
      var v3 = .06 + s * .088; if (v3 > .06 + sk * .88) break;
      var y3 = -260 + v3 * 520, x3 = bend(v3), a = Math.atan2(bend(v3 + .01) - x3, 5.2);
      g.save(); g.translate(x3, y3); g.rotate(-a); rr(g, -40, -16, 80, 32, 12); g.fillStyle = '#eaf6ff'; g.fill(); g.lineWidth = 4; g.strokeStyle = XRAY; g.stroke(); g.restore();
    }
    g.restore();
    g.restore();
    chipAt(g, 'HE SAYS', X1, 1315, CREAM, INK, seg(t, T.xray, T.xray + .15) * out, 'right');
  }

  /* ---------- #4 the man in the suit ---------- */
  var LSUIT = { x: 540, y: 800, w: 860, h: 700, r: .025 };
  var SUITK = [[0, .15, .72], [.6, .28, .75], [1.2, .36, .7], [1.75, .5, .58]];
  function sedan(g, t, x, y, s, door, man) {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = INK;
    g.beginPath(); g.moveTo(-320, 40); g.lineTo(-310, -20); g.quadraticCurveTo(-240, -40, -170, -50); g.quadraticCurveTo(-110, -120, 0, -124); g.quadraticCurveTo(120, -122, 190, -54); g.quadraticCurveTo(300, -46, 320, 0); g.lineTo(320, 40); g.closePath();
    g.fillStyle = SILVER; g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-140, -54); g.quadraticCurveTo(-90, -108, 0, -108); g.lineTo(0, -54); g.closePath(); g.fillStyle = '#2a3550'; g.fill(); g.lineWidth = 5; g.stroke();
    g.beginPath(); g.moveTo(20, -54); g.lineTo(20, -108); g.quadraticCurveTo(110, -104, 160, -54); g.closePath(); g.fill(); g.stroke();
    [-200, 210].forEach(function (wx) { g.beginPath(); g.arc(wx, 40, 52, 0, TAU); g.fillStyle = INK; g.fill(); g.beginPath(); g.arc(wx, 40, 24, 0, TAU); g.fillStyle = '#8d93a3'; g.fill(); });
    /* the passenger: a man in a dark suit, sliding in */
    if (man > 0) {
      g.save(); g.translate(lerp(-480, -70, man), -40);
      g.fillStyle = '#20232c'; g.strokeStyle = INK; g.lineWidth = 6;
      g.beginPath(); g.moveTo(-50, 120); g.lineTo(-44, -20); g.quadraticCurveTo(0, -46, 44, -20); g.lineTo(50, 120); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = CREAM; g.beginPath(); g.moveTo(-14, -30); g.lineTo(0, 10); g.lineTo(14, -30); g.closePath(); g.fill();
      g.fillStyle = COR; g.beginPath(); g.moveTo(-5, -22); g.lineTo(5, -22); g.lineTo(3, 12); g.lineTo(-3, 12); g.closePath(); g.fill();
      g.fillStyle = '#b98b6a'; g.beginPath(); g.arc(0, -70, 34, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = '#9aa0ab'; g.beginPath(); g.arc(0, -82, 34, Math.PI, TAU); g.fill();
      g.restore();
    }
    /* the open door swings */
    g.save(); g.translate(-10, -54); g.scale(1 - door * .75, 1);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(-150, 0); g.lineTo(-150, 90); g.lineTo(0, 90); g.closePath(); g.fillStyle = '#b4b9c4'; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    g.restore();
    g.restore();
  }
  function beatSuit(g, t) {
    var fm = track(U.suit, t, SUITK); U.suit.focus = [fm[0] + .06, fm[1] - .08];   // the 2.2x window follows him
    clipCard(g, t, U.suit, LSUIT, T.suitIn, U.suit.t1, function (g2) {
      var m = track(U.suit, t, SUITK), p = cpt(U.suit, t, LSUIT, m[0], m[1] - .06);
      K.scribble(g2, p[0], p[1], 150, 250, eo(seg(t, T.suitIn + .4, T.suitIn + .8)), COR, 12, 8);
    });
    chipAt(g, 'IN HIS CLIP', X1, 1225, COR, INK, seg(t, T.suitIn + .38, T.suitIn + .53) * (1 - seg(t, T.dr0 + .3, T.dr0 + .45)), 'right');
    /* after the card: our drawing of him getting in */
    if (t > U.suit.t1 - .1) {
      var k = cd(t, U.suit.t1 - .1, 10), out = 1 - eio(seg(t, T.dr0 - .15, T.dr0 + .1));
      if (out > 0) {
        g.save(); g.globalAlpha *= out; g.translate(0, (1 - k) * 500);
        sedan(g, t, 560, 860, 1.25, eio(seg(t, U.suit.t1, U.suit.t1 + .35)), eio(seg(t, U.suit.t1 + .05, U.suit.t1 + .6)));
        g.restore();
      }
    }
  }
  /* "Stay calm and drive. Sounds like Collateral, 2004." */
  function beatDrive(g, t) {
    var k = cd(t, T.dr0, 11), lift = eio(seg(t, T.n[2] - .3, T.n[2] - .02));
    g.save(); g.globalAlpha *= clamp(k * 1.5, 0, 1); g.translate(520, 700 - (1 - k) * 220 - lift * 1500); g.rotate(-.025 + osc(t, 9) * .01);
    cardFrame(g, 0, 0, 800, 380, CREAM);
    K.sticker(g, '“', -330, -110, 150, { col: COR, wide: false, lw: 0, shadow: false });
    K.sticker(g, 'STAY CALM.', 10, -60, 104, { col: INK, wide: false, lw: 0, shadow: false });
    K.sticker(g, 'AND DRIVE.', 10, 70, 104, { col: INK, wide: false, lw: 0, shadow: false });
    g.restore();
    chipAt(g, 'IN-GAME LINE · HIS CLIP', MID, 955 - lift * 1500, COR, INK, seg(t, T.dr0 + .3, T.dr0 + .45), 'center');
    /* the dated ticket: taxi yellow, checker strip */
    var u = t - (T.coll - .02); if (u < 0) return; lift = eio(seg(t, T.crabIn + .15, T.crabIn + .45)); if (lift >= 1) return;
    var kk = eo(clamp(u / .16, 0, 1)), s = lerp(1.5, 1, kk) - .05 * knock(u, .14, 1, 26, 8);
    g.save(); g.translate(560, 1215 - lift * 1500); g.rotate(.05 * (1 + (1 - kk) * 3)); g.scale(s, s); g.globalAlpha *= clamp(u / .05, 0, 1);
    rr(g, -300 + 8, -120 + 12, 600, 240, 20); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, -300, -120, 600, 240, 20); g.fillStyle = TAXI; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    g.save(); rr(g, -300, -120, 600, 240, 20); g.clip(); g.fillStyle = INK;
    for (var c = 0; c < 20; c++) { g.fillRect(-300 + c * 30, 80 + (c % 2) * 20, 30, 20); g.fillRect(-300 + c * 30, 100 - (c % 2) * 20, 30, 20); }
    g.restore();
    K.sticker(g, '2004', 0, -48, 104, { col: INK, wide: false, lw: 0, shadow: false });
    K.sticker(g, 'COLLATERAL', 0, 36, 50, { col: INK, wide: false, lw: 0, shadow: false });
    g.restore();
  }

  /* ---------- #3 the crab ---------- */
  var LCRAB = { x: 500, y: 810, w: 800, h: 740, r: -.02 };
  function house(g, t, x, y, k) {
    if (k <= 0) return;
    g.save(); g.translate(x, y + (1 - k) * 60); g.scale(k, k); g.globalAlpha *= k; g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = INK;
    g.beginPath(); g.moveTo(-90, -10); g.lineTo(0, -90); g.lineTo(90, -10); g.closePath(); g.fillStyle = COR; g.fill(); g.stroke();
    rr(g, -70, -10, 140, 100, 4); g.fillStyle = CREAM; g.fill(); g.stroke();
    rr(g, -18, 30, 36, 60, 4); g.fillStyle = INK; g.fill();
    /* a claw out of the roof */
    g.save(); g.translate(30, -70); g.rotate(-.4 + Math.sin(t * 9) * .2); g.fillStyle = '#d9533c';
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-10, -60, 20, -80); g.lineTo(26, -50); g.quadraticCurveTo(40, -70, 50, -60); g.quadraticCurveTo(40, -20, 14, 6); g.closePath(); g.fill(); g.stroke();
    g.restore();
    g.restore();
  }
  function beatCrab(g, t) {
    clipCard(g, t, U.crab, LCRAB, T.crabIn, U.crab.t1, function (g2) {
      var p = cpt(U.crab, t, LCRAB, .55, .3);
      K.scribble(g2, p[0], p[1], 330, 230, eo(seg(t, T.crabIn + .42, T.crabIn + .85)), COR, 12, 3);
    });
    var a = seg(t, T.home - .05, T.home + .1) * (1 - seg(t, T.n[3] - .25, T.n[3]));
    chipAt(g, 'IN HIS CLIP', X0, 1260, COR, INK, seg(t, T.crabIn + .38, T.crabIn + .53) * (1 - seg(t, T.n[3] + .3, T.n[3] + .45)));
    house(g, t, 800, 1250, eo(seg(t, T.home - .05, T.home + .3)) * (1 - seg(t, T.n[3] - .25, T.n[3])));
  }

  /* ---------- #2 the Skunk Ape ---------- */
  var LSK = { x: 570, y: 790, w: 800, h: 720, r: .03 };
  function footprint(g, t, x, y, k, big) {
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.rotate(.2); g.scale(lerp(1.4, 1, eo(k)) * (big || 1), lerp(1.4, 1, eo(k)) * (big || 1)); g.globalAlpha *= clamp(k * 4, 0, 1);
    g.fillStyle = '#6b4a33'; g.strokeStyle = INK; g.lineWidth = 6;
    g.beginPath(); g.ellipse(0, 20, 55, 95, 0, 0, TAU); g.fill(); g.stroke();
    for (var i = 0; i < 5; i++) { g.beginPath(); g.ellipse(-44 + i * 22, -88 - (i === 0 ? 0 : 8 - Math.abs(i - 2) * 3), 12, 16, 0, 0, TAU); g.fill(); g.stroke(); }
    g.restore();
  }
  /* how big? a drawn Jason beside a drawn hairy shape, no number (nobody measured it) */
  function heights(g, t, x, y, k) {
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.scale(.8, .8); g.globalAlpha *= clamp(k * 2, 0, 1); g.lineJoin = g.lineCap = 'round';
    g.fillStyle = 'rgba(12,17,36,.75)'; rr(g, -110, -280, 260, 300, 22); g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 4; g.beginPath(); g.moveTo(-90, 0); g.lineTo(130, 0); g.stroke();
    /* Jason */
    g.fillStyle = CREAM; g.beginPath(); g.arc(-45, -128, 16, 0, TAU); g.fill(); rr(g, -62, -108, 34, 66, 10); g.fill(); g.fillRect(-60, -46, 12, 46); g.fillRect(-42, -46, 12, 46);
    /* the ape, rising to its height */
    var h = 240 * eo(k);
    g.fillStyle = '#6b4a33'; g.strokeStyle = INK; g.lineWidth = 4;
    g.beginPath(); g.moveTo(10, 0); g.lineTo(18, -h * .5); g.quadraticCurveTo(14, -h * .82, 50, -h * .9); g.arc(62, -h * .9, 22, Math.PI, TAU); g.quadraticCurveTo(110, -h * .82, 106, -h * .5); g.lineTo(114, 0); g.closePath(); g.fill(); g.stroke();
    /* the coral height bar with a question mark */
    g.strokeStyle = COR; g.lineWidth = 8; g.beginPath(); g.moveTo(-82, 0); g.lineTo(-82, -h); g.moveTo(-96, -h); g.lineTo(-68, -h); g.stroke();
    K.sticker(g, '?', -82, -h - 32, 46, { col: COR, ink: INK, wide: false, lw: 8 });
    g.restore();
  }
  function beatSkunk(g, t) {
    LSK.push = function (tt) { return .1 * eio(seg(tt, T.close - .05, T.close + .4)); };
    clipCard(g, t, U.skunk, LSK, T.skIn, U.skunk.t1, function (g2) {
      var p = cpt(U.skunk, t, LSK, .2, .45);
      K.scribble(g2, p[0], p[1], 190, 300, eo(seg(t, T.skIn + .42, T.skIn + .85)), COR, 12, 9);
    }, 'brightness(1.8) contrast(1.08) saturate(1.1)');
    var out = 1 - seg(t, T.n[4] + .4, T.n[4] + .55);
    chipAt(g, 'SKUNK APE', X1, 1240, COR, INK, seg(t, T.skw + .1, T.skw + .25) * out, 'right');
    chipAt(g, 'FLORIDA LEGEND', X1, 1330, CREAM, INK, seg(t, T.flo - .02, T.flo + .13) * out, 'right');
    footprint(g, t, 540, 900, seg(t, T.skw - .05, T.skw + .25) * (1 - seg(t, T.skIn + .3, T.skIn + .4)), 1.7);
    heights(g, t, 190, 1400, eo(seg(t, T.skIn + .45, T.skIn + .8)) * out);
  }

  /* ---------- #1 a car on a dark road: the dip ---------- */
  var LROAD = { x: 540, y: 820, w: 820, h: 640, r: 0 };
  var LONE = { x: 540, y: 790, w: 800, h: 780, r: 0 };
  function beatDark(g, t) {
    var a = seg(t, T.n[4] + .45, T.n[4] + .6) * (1 - seg(t, T.tr0 + .3, T.tr0 + .45));
    chipAt(g, 'KELLY COUNTY · AFTER 2 AM', MID, 1250, COR, INK, a, 'center');
    chipAt(g, 'PER GUIDES', MID, 1330, CREAM, INK, a, 'center', 34);
    /* the real proof: she is engulfed, our beam widens to a white-out */
    if (t < T.road + .05) {
      LONE.push = function (tt) { return .12 * eio(seg(tt, T.road - .6, T.road)); };
      clipCard(g, t, U.one, LONE, T.oneIn, T.road + 2, function (g2) {
        var w = seg(t, T.road - .55, T.road - .02);
        g2.fillStyle = 'rgba(255,248,236,' + (w * w * .95) + ')'; g2.fillRect(-LONE.w / 2, -LONE.h / 2, LONE.w, LONE.h);
      });
      var bw = seg(t, T.road - .6, T.road);
      beam(g, t, LONE.x, H + 40, 300, lerp(900, 1600, bw), bw * .9);
    }
    K.flash(g, W, H, t - T.road, .9);
    if (t < T.road) return;
    /* then where: our map card, quick */
    var kk = cd(t, T.road, 12), out = 1 - eio(seg(t, T.tr0 - .05, T.tr0 + .25));
    if (out <= 0) return;
    g.save(); g.translate(LROAD.x, LROAD.y); var sc = lerp(1.15, 1, kk) * out; g.scale(sc, sc); g.globalAlpha *= clamp(kk * 2, 0, 1);
    cardFrame(g, 0, 0, LROAD.w, LROAD.h, '#0b1230');
    g.save(); rr(g, -LROAD.w / 2, -LROAD.h / 2, LROAD.w, LROAD.h, 20); g.clip();
    g.fillStyle = '#e9e4d2'; g.beginPath(); g.arc(250, -230, 34, 0, TAU); g.fill();
    g.fillStyle = '#0f1a2c'; g.beginPath(); g.moveTo(-410, -20);
    for (var i = 0; i <= 16; i++) g.lineTo(-410 + i * 52, -60 - 50 * hash(i + 4) - (i % 3) * 18);
    g.lineTo(410, -20); g.closePath(); g.fill();
    g.fillStyle = '#3a2a22'; g.fillRect(-410, -20, 820, 340);
    g.fillStyle = '#1b1c24'; g.beginPath(); g.moveTo(-30, -20); g.lineTo(30, -20); g.lineTo(330, 320); g.lineTo(-330, 320); g.closePath(); g.fill();
    var mv = (t - T.road) * .35;
    g.fillStyle = 'rgba(255,210,63,.75)';
    for (var m = 0; m < 6; m++) { var v = ((m / 6 + mv) % 1), yy = -20 + v * v * 340, ww = 4 + v * 16; g.fillRect(-ww / 2, yy, ww, 8 + v * 40); }
    /* the parked car with its lights on, and the beam coming down on the road ahead of it */
    g.save(); g.translate(60, 90);
    g.fillStyle = '#7a1f22'; g.strokeStyle = INK; g.lineWidth = 6; rr(g, -150, -60, 300, 110, 22); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-110, -60); g.lineTo(-80, -120); g.lineTo(80, -120); g.lineTo(110, -60); g.closePath(); g.fill(); g.stroke();
    var blink = Math.sin((t - T.road) * TAU * 1.6) > 0 ? 1 : .15;
    [-120, 120].forEach(function (lx) { g.fillStyle = 'rgba(255,106,77,' + blink + ')'; rr(g, lx - 22, -40, 44, 24, 6); g.fill(); });
    g.restore();
    beam(g, t, -120, 60, 60, 220, .8);
    g.fillStyle = MINT; g.beginPath(); g.ellipse(-120, -250, 70, 18, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(-120, -262, 30, 22, 0, Math.PI, TAU); g.fill();
    g.restore();
    g.restore();
  }

  /* ---------- the trophy: all ours ---------- */
  function beatTrophy(g, t) {
    var k = cd(t, T.tr0 + .3, 10), out = 1 - eio(seg(t, T.ufoIn - .15, T.ufoIn + .15));
    if (out <= 0) return;
    g.save(); g.translate(540, 760 + (1 - k) * 900 + (1 - out) * -1400); g.rotate(osc(t, 6) * .02);
    var s = 1 + .03 * knock(t, T.truth - .05, 1, 24, 8); g.scale(s, s);
    g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = INK;
    /* handles */
    g.beginPath(); g.arc(-215, -150, 80, Math.PI * .5, Math.PI * 1.5); g.lineWidth = 30; g.strokeStyle = INK; g.stroke(); g.lineWidth = 16; g.strokeStyle = BRONZE; g.stroke();
    g.beginPath(); g.arc(215, -150, 80, -Math.PI * .5, Math.PI * .5); g.lineWidth = 30; g.strokeStyle = INK; g.stroke(); g.lineWidth = 16; g.strokeStyle = BRONZE; g.stroke();
    g.lineWidth = 10; g.strokeStyle = INK;
    /* cup */
    g.beginPath(); g.moveTo(-230, -280); g.lineTo(230, -280); g.quadraticCurveTo(220, 20, 40, 60); g.lineTo(-40, 60); g.quadraticCurveTo(-220, 20, -230, -280); g.closePath();
    g.fillStyle = BRONZE; g.fill(); g.stroke();
    g.save(); g.clip();
    var sh = ((t - T.tr0) * .6) % 1.6 - .3;      // a shine sweeps across
    g.fillStyle = 'rgba(255,240,210,.45)'; g.beginPath(); g.moveTo(-300 + sh * 600, -300); g.lineTo(-220 + sh * 600, -300); g.lineTo(-360 + sh * 600, 80); g.lineTo(-440 + sh * 600, 80); g.closePath(); g.fill();
    g.fillStyle = BRONZE2; g.beginPath(); g.ellipse(0, -280, 230, 30, 0, 0, TAU); g.fill();
    g.restore();
    /* a small saucer embossed on the cup */
    g.fillStyle = BRONZE2; g.beginPath(); g.ellipse(0, -130, 90, 26, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(0, -152, 44, 30, 0, Math.PI, TAU); g.fill();
    g.fillRect(-26, 60, 52, 90); g.strokeRect(-26, 60, 52, 90);
    rr(g, -170, 150, 340, 60, 10); g.fillStyle = BRONZE2; g.fill(); g.stroke();
    /* the plaque */
    rr(g, -330, 230, 660, 190, 16); g.fillStyle = '#2a1a10'; g.fill(); g.stroke();
    g.restore();
    var pk = seg(t, T.tis - .05, T.tis + .12) * out;
    if (pk > 0) {
      g.save(); g.globalAlpha *= pk; var yy = 760 + (1 - k) * 900 + (1 - out) * -1400;
      K.sticker(g, 'THE TRUTH IS', 540, yy + 290, 64, { col: '#f3c48d', wide: false, lw: 0, shadow: false });
      K.sticker(g, 'OUT THERE', 540, yy + 362, 64, { col: '#f3c48d', wide: false, lw: 0, shadow: false });
      g.restore();
    }
    chipAt(g, 'TROPHY NAME · PER GUIDES', MID, 1300, COR, INK, seg(t, T.tr0 + .55, T.tr0 + .7) * out, 'center');
  }

  /* ---------- the loop: the real light, then frame 0 ---------- */
  function beatLoop(g, t) {
    var lift = t < T.ufoIn ? 1 : 1 - cd(t, T.ufoIn, 9);
    ufoCard(g, t, U.loop, lift, seg(t, T.lp0, T.lp0 + .35));
    hookWords(g, t, t - T.back + .1, seg(t, T.back - .1, T.back));
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx;
  function pill(g, t) {
    g.save(); K.measure(g, 'GTA 6', 64, { wide: false });
    rr(g, X0, PILLY - 46, 232, 92, 46); g.fillStyle = COR; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    K.sticker(g, 'GTA 6', X0 + 116, PILLY + 2, 64, { col: INK, wide: false, lw: 0, shadow: false });
    g.restore();
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    backdrop(g, t);
    if (t < T.l0) beatHook(g, t);
    else if (t < T.item[0] + .3) beatList(g, t);
    if (t >= T.item[0] - .1 && t < T.suitIn + .25) beatBent(g, t);
    if (t >= T.n[1] - .1 && t < T.crabIn + .3) { beatSuit(g, t); beatDrive(g, t); }
    if (t >= T.n[2] - .1 && t < T.n[3] + .5) beatCrab(g, t);
    if (t >= T.n[3] - .1 && t < T.n[4] + .6) beatSkunk(g, t);
    if (t >= T.n[4] - .1 && t < T.tr0 + .5) beatDark(g, t);
    if (t >= T.tr0 - .1 && t < T.ufoIn + .2) beatTrophy(g, t);
    if (t >= T.lp0) beatLoop(g, t);
    menu(g, t);
    dial(g, t);
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
    Tx('pill', 'GTA 6', 0, DUR + 1);
    Tx('hook', 'ALIENS TAKE YOU?', 0, T.l0 - .1); Tx('hook', 'ALIENS TAKE YOU?', T.back + .1, DUR + 1);
    Tx('search', 'GTA 6 SECRETS', T.search + .1, T.n[0] - .1);
    Tx('clip5', 'IN HIS CLIP', T.bentIn + .5, T.xray + .55);
    Tx('scol', 'HE SAYS', T.xray + .1, T.suitIn);
    Tx('clip4', 'IN HIS CLIP', T.suitIn + .48, T.dr0 + .35);
    Tx('quote', 'STAY CALM. AND DRIVE.', T.dr0 + .3, T.n[2] - .3);
    Tx('ingame', 'IN-GAME LINE · HIS CLIP', T.dr0 + .4, T.n[2] - .3);
    Tx('y04', '2004 COLLATERAL', T.coll + .05, T.crabIn + .25);
    Tx('clip3', 'IN HIS CLIP', T.crabIn + .48, T.n[3] + .35);
    Tx('skunk', 'SKUNK APE', T.skw + .2, T.n[4] + .45);
    Tx('flo', 'FLORIDA LEGEND', T.flo + .08, T.n[4] + .45);
    Tx('kelly', 'KELLY COUNTY · AFTER 2 AM', T.n[4] + .55, T.tr0 + .35);
    Tx('guides', 'PER GUIDES', T.n[4] + .55, T.tr0 + .35);
    Tx('plaque', 'THE TRUTH IS OUT THERE', T.tis + .05, T.ufoIn - .05);
    Tx('tname', 'TROPHY NAME · PER GUIDES', T.tr0 + .6, T.ufoIn - .05);
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
        if (d < H && c > 0 && (a < 89.5 || b > 930.5 || c > 1450.5)) BOUNDS.push({ t: CURT, text: str, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
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
      window.FILM.POSTER = .9;
      window.FILM.SHOTS = [{ id: 'hook', name: 'Aliens', t0: 0, t1: T.l0 }, { id: 'list', name: 'Top 5', t0: T.l0, t1: T.item[0] }, { id: 'five', name: '#5 Bent car', t0: T.item[0], t1: T.item[1] }, { id: 'four', name: '#4 The suit', t0: T.item[1], t1: T.item[2] }, { id: 'three', name: '#3 The crab', t0: T.item[2], t1: T.item[3] }, { id: 'two', name: '#2 Skunk Ape', t0: T.item[3], t1: T.item[4] }, { id: 'one', name: '#1 The light', t0: T.item[4], t1: DUR }];
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

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: .9, SLUG: 'gta-wildfinds', SHOTS: [], LIVE: {}, init: init, render: render, frame: frame, T: T };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
