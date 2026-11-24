/* "GTA 6: Lucia texts Jason": GTA 6, Delta, "It has X, shown" (VIDEO-PLAN format 5), trailer mode (SAFE-EDIT rules 7, 11).
   In Rockstar's own "An Extended Look" (rk721912, 23:00-24:04) masked gunmen take over a company's opening party; Lucia hides
   among the guests and texts, and her texts pop up on screen as floating bubbles: GUYS EVERYWHERE while Jason creeps through
   the dark, then "10+ guys, auto weps, explosives, sound military..." while she types.
   One hard idea: the texts are the HUD. Hero object: our own drawn phone, whose thread fills with her two texts (re-drawn,
   tagged RE-DRAWN with the video's timestamp). Native move: the footage plate folds down into the phone's screen and back.
   Footage: short muted official clips in the plate (foreground) and dimmed full-bleed plates behind the phone (rule 11).
   Pure function of t, keyed to the voice with at(id, word). Rail x 90-930, glyphs above y 1450.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx), BOUNDS_RUN. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, K = window.KIT, CLIP = window.CLIP;
  var BG = '#0a0b1e', CREAM = '#fbf3ea', HOT = '#34e3c4', INK = '#0d1024', BUB = '#e9e7ee', RED = '#ff4b5c';
  var TAU = Math.PI * 2;
  var X0 = 90, X1 = 930, MID = 510, CAPY = 212, PILLY = 100;
  var PLATE = [0, 380, W, 1040];                     // full-width footage plate
  var PHONE = [250, 470, 520, 930];                 // our phone, x 250-770, y 470-1400

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function knock(t, a, amp, f, d) { if (t < a) return 0; var u = t - a; return (amp || 1) * Math.exp(-u * (d || 6)) * Math.sin(u * (f || 22)); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function lerpR(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)]; }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%+]/g, ''); }
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
    T.bub0 = .85;                                       // GUYS EVERYWHERE lands in our thread on frame 0's beat
    T.party = start('party') - .12;
    T.gun = start('gunmen') - .1;
    T.jas = start('jason') - .1;
    T.pops = at('jason', 'pops') - .05;                 // her text drops onto the phone's lock screen
    T.hide = start('hide') - .1;
    T.intel = start('intel') - .1;
    T.i1 = at('intel', 'ten'); T.i2 = at('intel', 'auto'); T.i3 = at('intel', 'explosives');
    T.close = start('close') - .1;
    T.end = Math.min(lastw('close') + .5, start('end') - .05);
    T.q = start('end');
    T.back = DUR - .7;                                  // the hook frame returns for the loop

    /* foreground uses (each under 4.9 s, annotated; lint checks the caps) */
    var hl = T.party - 0;
    U.hook = CLIP.use('jason', 0, T.party, { from: 1.0, speed: Math.min(1, 3.6 / hl), zoom: [1.3, 1.34], focus: [.74, .42], note: 'frame 0: Jason crouched in the dark office, Lucia\'s GUYS EVERYWHERE bubble on screen, ring on the bubble, title GUYS EVERYWHERE' });
    var gl = T.jas - T.gun;
    U.gun = CLIP.use('gunmen', T.gun, T.jas, { from: .75, speed: Math.min(1, 3.35 / gl), zoom: [1.0, 1.08], focus: [.5, .45], note: 'masked men in white coveralls with rifles walk in; MASKED GUNMEN chip, ring on the masked face' });
    var ll = T.intel - T.hide;
    U.lucia = CLIP.use('lucia', T.hide, T.intel, { from: .78, speed: Math.min(1, 3.3 / ll), zoom: [1.0, 1.1], focus: [.32, .62], note: 'Lucia crouched among the guests typing on her phone, her text bubble bottom left; ring on the phone, arrow to the bubble' });
    var cl = T.end - T.close;
    U.close = CLIP.use('pass', T.close, T.end, { from: 0, speed: Math.min(1, 3.3 / cl), zoom: [1.0, 1.12], focus: [.42, .45], note: 'a masked gunman walks up past the glowing table, her bubble still on screen; ring on him, RIGHT THERE chip' });
    U.back = CLIP.use('jason', T.back, DUR + .001, { from: 3.95, speed: 1, zoom: [1.3, 1.3], focus: [.8, .36], note: 'loop: back to Jason and the GUYS EVERYWHERE bubble under the title' });
    /* background plates (rule 11): dimmed, full bleed, under our graphics */
    U.pparty = CLIP.use('party', T.party, T.gun, { from: .8, speed: 1, zoom: [1.05, 1.12], focus: [.5, .5], plate: true, note: 'plate: the host on the stairs at the opening party, behind our invitation card' });
    U.pjas = CLIP.use('jplate', T.jas, T.hide, { from: 0, speed: Math.min(1, 4.9 / (T.hide - T.jas)), zoom: [1.1, 1.0], focus: [.55, .55], plate: true, note: 'plate: Jason crouching with his pistol in the dark office, behind our phone' });
    U.pint = CLIP.use('lplate', T.intel, T.i3 + .1, { from: 0, speed: Math.min(1, 3.9 / (T.close - T.intel)), zoom: [1.05, 1.12], focus: [.5, .4], plate: true, note: 'plate: a gunman on his radio, Lucia looking up, behind our phone with her full text' });

    /* sound */
    ev(.02, 'whoosh', .5, { d: .45 });
    ev(T.bub0, 'ding', .8);
    ev(T.party, 'swish', .5); ev(T.party + .25, 'sparkle', .5);
    ev(T.gun - .18, 'slam', .45);
    ev(T.jas, 'whoosh', .5);
    ev(T.pops, 'ding', .9);
    ev(T.hide, 'swish', .5);
    ev(T.intel, 'zip', .5);
    ev(T.i1, 'thud', .55); ev(T.i2, 'thud', .55); ev(T.i3, 'slam', .75);
    for (var k = 0; k < 14; k++) ev(T.intel + .1 + k * .085, 'key', .5);
    ev(T.close, 'slam', .7);
    ev(T.end, 'whoosh', .45);
    ev(T.q + .02, 'pop', .6);
    ev(T.back, 'whoosh', .5); ev(T.back + .25, 'ding', .6);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  /* ---------- captions: phrase cards of 2-4 words; the hook and the end question carry their own type ---------- */
  var CHUNKS = [], CPX = 88;
  var WEAK = { a: 1, an: 1, the: 1, is: 1, to: 1, in: 1, with: 1, at: 1, of: 1, and: 1, her: 1, that: 1, one: 1, through: 1 };
  var HOTW = { gunmen: 1, masked: 1, text: 1, guys: 1, everywhere: 1, hiding: 1, phone: 1, ten: 1, plus: 1, auto: 1, weapons: 1, explosives: 1, there: 1, party: 1, dark: 1 };
  function buildChunks(g) {
    var GAP = CPX * .3;
    function wd(w) { return K.measure(g, w.w, CPX, { wide: false }); }
    function width(c) { return c.reduce(function (a, w) { return a + wd(w); }, 0) + GAP * (c.length - 1); }
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'end') return;
      var ws = l.words.map(function (w) { return { w: w.w.replace(/[,:.]$/, '').toUpperCase(), raw: w.w, t0: w.t0, t1: w.t1, hot: !!HOTW[norm(w.w)] }; });
      var phrases = [], cur = [];
      ws.forEach(function (w) { cur.push(w); if (/[.?!,:]$/.test(w.raw)) { phrases.push(cur); cur = []; } });
      if (cur.length) phrases.push(cur);
      phrases.forEach(function (ph) {
        var n = Math.ceil(ph.length / 4), base = Math.floor(ph.length / n), extra = ph.length % n, sizes = [];
        for (var i = 0; i < n; i++) sizes.push(base + (i < extra ? 1 : 0));
        var k = 0, parts = sizes.map(function (z) { var p = ph.slice(k, k + z); k += z; return p; });
        for (var m = 0; m < parts.length - 1; m++) while (parts[m].length > 1 && WEAK[norm(parts[m][parts[m].length - 1].w)]) parts[m + 1].unshift(parts[m].pop());
        parts.forEach(function (c) {
          if (width(c) <= 820 || c.length === 1) c.rows = [c];
          else { var best = null; for (var b = 1; b < c.length; b++) { var a1 = c.slice(0, b), a2 = c.slice(b), sc = Math.max(width(a1), width(a2)); if (!best || sc < best.sc) best = { sc: sc, r: [a1, a2] }; } c.rows = best.r; }
          CHUNKS.push(c);
        });
      });
    });
    CHUNKS.forEach(function (c, i) { var nx = CHUNKS[i + 1]; c.t0 = c[0].t0 - .05; c.t1 = nx ? Math.min(nx[0].t0 - .08, c[c.length - 1].t1 + .6) : c[c.length - 1].t1 + .4; });
  }
  function captions(g, t) {
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (t < c.t0 || t >= c.t1) continue;
      var k = eo(seg(t, c.t0, c.t0 + .12)), gap = CPX * .3, n = c.rows.length;
      g.save(); g.globalAlpha *= k;
      c.rows.forEach(function (row, r) {
        var ws = row.map(function (w) { return K.measure(g, w.w, CPX, { wide: false }); });
        var tw = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (row.length - 1), x = MID - tw / 2, s = Math.min(1, 820 / tw);
        var y = (n === 1 ? CAPY + 60 : CAPY + 15 + r * 92) + (1 - k) * 20;
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

  /* ---------- set: night glass, slow party-light sweep ---------- */
  function backdrop(g, t) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var sx = MID + Math.sin(t * .7) * 260;
    var gr = g.createRadialGradient(sx, 900, 40, sx, 900, 950);
    gr.addColorStop(0, 'rgba(120,70,255,.22)'); gr.addColorStop(1, 'rgba(120,70,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    var gr2 = g.createRadialGradient(W - sx, 1500, 20, W - sx, 1500, 700);
    gr2.addColorStop(0, 'rgba(52,227,196,.12)'); gr2.addColorStop(1, 'rgba(52,227,196,0)');
    g.fillStyle = gr2; g.fillRect(0, 0, W, H);
    /* window mullions */
    g.save(); g.globalAlpha = .07; g.fillStyle = CREAM; var off = (t * 18) % 180;
    for (var x = -180 + off; x < W + 180; x += 180) g.fillRect(x, 0, 6, H);
    g.restore();
  }
  function bgPlate(g, t, dim) {
    CLIP.plate(g, t, 0, 0, W, H, { dim: dim || .5, blur: 2 });
    var v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(10,11,30,.65)'); v.addColorStop(.3, 'rgba(10,11,30,.15)'); v.addColorStop(.75, 'rgba(10,11,30,.2)'); v.addColorStop(1, 'rgba(10,11,30,.9)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  }
  function pill(g) {
    g.save(); rr(g, X0, PILLY - 46, 232, 92, 46); g.fillStyle = HOT; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    K.sticker(g, 'GTA 6', X0 + 116, PILLY + 2, 64, { col: INK, wide: false, lw: 0, shadow: false });
    g.restore();
  }
  function chipAt(g, s, x, y, bg, col, a, align, px) { if (a <= 0) return; g.save(); g.globalAlpha *= a; K.chip(g, s, x, y, px || 40, { bg: bg || HOT, col: col || INK, align: align }); g.restore(); }

  /* ---------- footage plate ---------- */
  function drawUse(g, t, u, r, filter) {
    g.save(); g.beginPath(); g.rect(r[0], r[1], r[2], r[3]); g.clip();
    g.filter = filter || 'brightness(1.45) contrast(1.06) saturate(1.08)';
    CLIP.draw(g, t, r[0], r[1], r[2], r[3], u);
    g.filter = 'none'; g.restore();
    g.fillStyle = INK; g.fillRect(r[0], r[1] - 6, r[2], 8); g.fillRect(r[0], r[1] + r[3] - 2, r[2], 8);
  }
  function srcAt(u, t) { return u.from + Math.max(0, t - u.t0) * u.speed; }
  function track(u, t, keys) {
    var s = srcAt(u, t);
    if (s <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (var i = 1; i < keys.length; i++) if (s <= keys[i][0]) { var k = seg(s, keys[i - 1][0], keys[i][0]); return [lerp(keys[i - 1][1], keys[i][1], k), lerp(keys[i - 1][2], keys[i][2], k)]; }
    var l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  function ringOn(g, t, u, r, nx, ny, rx, ry, seed, a0, col) {
    var p = CLIP.toScreen(u, t, nx, ny, r[0], r[1], r[2], r[3]);
    p[0] = clamp(p[0], X0 + rx * .5, X1 - rx * .5);
    g.save(); g.beginPath(); g.rect(0, r[1], W, r[3]); g.clip();
    K.scribble(g, p[0], p[1], rx, ry, eo(seg(t, a0, a0 + .4)), col || HOT, 11, seed);
    g.restore();
    return p;
  }
  function credit(g, u, r) { CLIP.credit(g, u, X0 + 10, r[1] + r[3] - 36); }
  /* the plate opens from a slit and closes into one */
  function openK(t, u) { return eio(seg(t, u.t0, u.t0 + .14)) * (1 - eio(seg(t, u.t1 - .12, u.t1))); }
  function slitRect(k) { var h = PLATE[3] * Math.max(.002, k); return [PLATE[0], PLATE[1] + (PLATE[3] - h) / 2, PLATE[2], h]; }

  /* ---------- our phone and its thread ---------- */
  function avatar(g, x, y, r) {
    g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = '#f2b8c6'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.arc(x, y - r * .1, r * .42, 0, TAU); g.fillStyle = INK; g.fill();
    g.beginPath(); g.arc(x, y + r * .95, r * .75, Math.PI, TAU); g.fill(); g.restore();
  }
  /* a message bubble: name row + text rows, left aligned at x, top y; k = 0..1 drop-in */
  function bubble(g, x, y, w, rows, k, px, hl) {
    if (k <= 0) return 0;
    var h = 70 + rows.length * px * 1.28;
    g.save(); g.globalAlpha *= clamp(k * 2, 0, 1); g.translate(0, (1 - eo(k)) * -40);
    rr(g, x + 6, y + 10, w, h, 26); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    rr(g, x, y, w, h, 26); g.fillStyle = BUB; g.fill(); if (hl) { g.lineWidth = 6; g.strokeStyle = HOT; g.stroke(); }
    avatar(g, x + 40, y + 38, 20);
    K.sticker(g, 'Lucia', x + 72, y + 40, 34, { col: INK, wide: false, lw: 0, shadow: false, align: 'left', wt: 800 });
    rows.forEach(function (s, i) { K.sticker(g, s, x + 24, y + 70 + px * .62 + i * px * 1.28, px, { col: '#2a2440', wide: false, lw: 0, shadow: false, align: 'left', wt: 600 }); });
    g.restore();
    return h;
  }
  function phone(g, t, r, inner) {
    var x = r[0], y = r[1], w = r[2], h = r[3];
    g.save();
    rr(g, x + 10, y + 16, w, h, 70); g.fillStyle = 'rgba(0,0,0,.5)'; g.fill();
    rr(g, x, y, w, h, 70); g.fillStyle = '#16182c'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#3a3d5c'; g.stroke();
    rr(g, x + 18, y + 18, w - 36, h - 36, 54); g.save(); g.clip();
    inner(x + 18, y + 18, w - 36, h - 36);
    g.restore();
    rr(g, x + w / 2 - 70, y + 34, 140, 36, 18); g.fillStyle = '#000'; g.fill();
    g.restore();
  }
  /* jason beat: the bubble floats over the scene the way the game draws it (re-drawn big), ring on it */
  function floatBubble(g, x, y, w, rows, k, px) {
    if (k <= 0) return 0;
    var h = 84 + rows.length * px * 1.25;
    g.save(); g.globalAlpha *= clamp(k * 2, 0, 1); g.translate(0, (1 - eo(k)) * -50);
    rr(g, x, y, w, h, 14); g.fillStyle = 'rgba(214,212,222,.86)'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.6)'; g.stroke();
    avatar(g, x + 44, y + 44, 24);
    K.sticker(g, 'Lucia', x + 82, y + 46, 40, { col: '#222', wide: false, lw: 0, shadow: false, align: 'left', wt: 700 });
    rows.forEach(function (s0, i) { K.sticker(g, s0, x + 26, y + 84 + px * .6 + i * px * 1.25, px, { col: '#3a3646', wide: false, lw: 0, shadow: false, align: 'left', wt: 500 }); });
    g.restore();
    return h;
  }
  function jasonBeat(g, t) {
    bgPlate(g, t, .38);
    chipAt(g, 'JASON', MID, 600, CREAM, INK, seg(t, T.jas + .1, T.jas + .25) * (1 - seg(t, T.hide - .15, T.hide)), 'center', 44);
    var bk = seg(t, T.pops, T.pops + .3), out = 1 - eio(seg(t, T.hide - .15, T.hide));
    if (bk > 0) {
      g.save(); g.globalAlpha *= out;
      var bh = floatBubble(g, 130, 760, 760, ['GUYS EVERYWHERE'], bk, 76);
      if (bk >= 1) K.scribble(g, MID, 760 + bh / 2, 430, bh / 2 + 50, eo(seg(t, T.pops + .3, T.pops + .7)), RED, 11, 4);
      chipAt(g, 'RE-DRAWN · 23:47', MID, 1060, 'rgba(251,243,234,.92)', INK, seg(t, T.pops + .2, T.pops + .35), 'center', 30);
      g.restore();
    }
  }
  /* intel beat: her thread on our phone, the three threats as rows that land on the words */
  var ROWS = ['10+ guys,', 'auto weps,', 'explosives...'];
  function phoneIntel(g, t) {
    var k = eo(seg(t, T.intel, T.intel + .25)), out = 1 - eio(seg(t, T.close - .18, T.close));
    var r = [150, lerp(H, 400, k) + (1 - out) * 1000, 780, 1000];
    phone(g, t, r, function (x, y, w, h) {
      g.fillStyle = 'rgba(244,242,248,.95)'; g.fillRect(x, y, w, h);
      g.fillStyle = '#e1dee8'; g.fillRect(x, y, w, 130);
      avatar(g, x + w / 2, y + 66, 28);
      K.sticker(g, 'Lucia', x + w / 2, y + 112, 26, { col: INK, wide: false, lw: 0, shadow: false, wt: 700 });
      bubble(g, x + 24, y + 160, w - 90, ['GUYS EVERYWHERE'], 1, 40, false);
      var tt = [T.i1, T.i2, T.i3], n = 0; tt.forEach(function (q) { if (t >= q - .12) n++; });
      var y0 = y + 360, px = 58;
      if (n > 0) {
        var bh = 70 + 3 * px * 1.28;
        rr(g, x + 24, y0, w - 60, bh, 26); g.fillStyle = BUB; g.fill(); g.lineWidth = 6; g.strokeStyle = HOT; g.stroke();
        avatar(g, x + 64, y0 + 38, 20);
        K.sticker(g, 'Lucia', x + 96, y0 + 40, 34, { col: INK, wide: false, lw: 0, shadow: false, align: 'left', wt: 800 });
        for (var i = 0; i < n; i++) {
          var yy = y0 + 70 + px * .62 + i * px * 1.28, u = t - tt[i] + .12;
          g.save(); g.font = '700 ' + px + 'px Archivo'; var ww = g.measureText(ROWS[i]).width; g.restore();
          g.save(); g.globalAlpha = .5; g.fillStyle = i === 2 ? RED : HOT; g.fillRect(x + 44, yy - px * .55, (ww + 12) * eo(seg(u, .1, .3)), px * 1.1); g.restore();
          var sc = lerp(1.25, 1, eo(clamp(u / .14, 0, 1)));
          g.save(); g.translate(x + 50, yy); g.scale(sc, sc);
          K.sticker(g, ROWS[i], 0, 0, px, { col: '#1d1830', wide: false, lw: 0, shadow: false, align: 'left', wt: 700 });
          g.restore();
        }
      }
    });
    chipAt(g, 'EXCERPT · RE-DRAWN · 23:53', MID, r[1] + r[3] + 30, 'rgba(251,243,234,.92)', INK, out * seg(t, T.intel + .3, T.intel + .45), 'center', 28);
  }
  /* the three threats stay listed on the footage while the gunman walks up */
  function threats(g, t, a) {
    if (a <= 0) return;
    ROWS.forEach(function (s0, i) { chipAt(g, s0.replace('...', '').replace(',', '').toUpperCase(), X1, 1200 + i * 72, i === 2 ? RED : HOT, INK, a, 'right', 30); });
  }

  /* ---------- hook: a number and the act, over the real bubble ---------- */
  var HOOKPX = 120;
  function hookTitle(g, t, u) {
    K.slam(g, '10+ GUYS.', MID, 215, HOOKPX, u, { col: CREAM, rot: -.03, wide: false, from: .8 });
    K.slam(g, 'SHE TEXTS.', MID, 215 + HOOKPX * .95, HOOKPX, u - .05, { col: HOT, rot: -.03, wide: false, from: .8 });
  }
  var BUBK = [[0, .71, .5], [1.0, .71, .5], [2.0, .70, .46], [3.0, .69, .38], [4.0, .87, .30], [4.7, .87, .30]];
  function hookFrame(g, t, u, local) {
    var r = PLATE;
    drawUse(g, t, u, r);
    /* ring keyed in screen space (measured on the rendered frames): the camera turns, the bubble drifts */
    var K0 = local ? [[0, .43, .6], [.7, .49, .58], [1.4, .52, .53], [2.1, .38, .5], [2.8, .39, .47], [3.5, .41, .44], [4.5, .41, .44]] : [[0, .38, .5], [1, .38, .5]];
    var lt = t - u.t0, p = [K0[K0.length - 1][1], K0[K0.length - 1][2]];
    for (var i = 1; i < K0.length; i++) if (lt <= K0[i][0]) { var kk = seg(lt, K0[i - 1][0], K0[i][0]); p = [lerp(K0[i - 1][1], K0[i][1], kk), lerp(K0[i - 1][2], K0[i][2], kk)]; break; }
    g.save(); g.beginPath(); g.rect(0, r[1], W, r[3]); g.clip();
    K.scribble(g, clamp(p[0] * W, X0 + 130, X1 - 130), r[1] + p[1] * r[3], 270, 110, 1, HOT, 11, 7);
    g.restore();
    credit(g, u, r);
  }

  /* ---------- end: the question, short ---------- */
  function ending(g, t) {
    var k = eo(seg(t, T.end, T.end + .25)), out = 1 - seg(t, T.back - .1, T.back);
    if (out <= 0) return;
    g.save(); g.globalAlpha *= out;
    K.slam(g, 'WOULD YOU', MID, 470, 120, t - T.q, { col: CREAM, rot: -.03, wide: false, from: .8 });
    K.slam(g, 'SEND IT?', MID, 600, 140, t - T.q - .1, { col: HOT, rot: -.03, wide: false, from: .8 });
    var r = [200, lerp(H, 740, k), 620, 640];
    phone(g, t, r, function (x, y, w, h) {
      g.fillStyle = 'rgba(244,242,248,.95)'; g.fillRect(x, y, w, h);
      bubble(g, x + 20, y + 80, w - 40, ['10+ guys, auto weps,', 'explosives...'], 1, 36, true);
      var pu = 1 + .07 * Math.sin(t * 10);
      g.save(); g.translate(x + w * .3, y + h - 130); g.scale(pu, pu); K.chip(g, 'SEND', 0, 0, 46, { bg: HOT, col: INK, align: 'center' }); g.restore();
      K.chip(g, 'HIDE', x + w * .72, y + h - 130, 46, { bg: '#3a3d5c', col: CREAM, align: 'center' });
      /* a thumb hovers between the two */
      var hx = x + w * (.5 + .22 * Math.sin(t * 3.2)), hy = y + h - 60 + 10 * Math.sin(t * 6);
      g.save(); g.globalAlpha *= .9; g.beginPath(); g.ellipse(hx, hy + 60, 58, 80, 0, 0, TAU); g.fillStyle = '#c99a7f'; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); g.restore();
    });
    g.restore();
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    backdrop(g, t);
    if (t < T.party) {                                   // hook
      hookFrame(g, t, U.hook, true);
      hookTitle(g, t, t + 1);
      chipAt(g, 'IN-GAME · ROCKSTAR · 23:47', MID, 1436, 'rgba(251,243,234,.92)', INK, 1, 'center', 26);
    } else if (t < T.gun) {                              // party: plate, ring on the host
      bgPlate(g, t, .38);
      chipAt(g, 'OPENING PARTY', MID, 1300, CREAM, INK, seg(t, T.party, T.party + .12), 'center', 44);
      chipAt(g, 'NEW HQ · 23:00', MID, 1390, 'rgba(251,243,234,.85)', INK, seg(t, T.party + .1, T.party + .22), 'center', 30);
    } else if (t < T.jas) {                              // gunmen: full-height footage
      var kg = openK(t, U.gun), r = slitRect(kg);
      drawUse(g, t, U.gun, r);
      chipAt(g, 'OPENING PARTY', MID, 1300, CREAM, INK, 1 - seg(t, T.gun + .1, T.gun + .2), 'center', 44);
      chipAt(g, 'GUNMEN', X0, PLATE[1] + 70, RED, INK, seg(t, U.gun.t0 + .05, U.gun.t0 + .15) * (1 - seg(t, T.jas - .08, T.jas)), 'left', 44);
      if (kg > .95) {
        var pg = track(U.gun, t, [[.75, .55, .42], [1.6, .55, .45], [2.6, .52, .45], [3.4, .55, .5]]);
        ringOn(g, t, U.gun, r, pg[0], pg[1], 150, 170, 11, U.gun.t0 + .2, RED);
        credit(g, U.gun, r);
      }
    } else if (t < T.hide) {                             // Jason: plate + her floating text
      jasonBeat(g, t);
    } else if (t < T.intel) {                            // Lucia typing: full-height footage
      var kl = openK(t, U.lucia), rl = slitRect(kl);
      drawUse(g, t, U.lucia, rl);
      chipAt(g, 'LUCIA', X0, PLATE[1] + 70, HOT, INK, seg(t, U.lucia.t0 + .05, U.lucia.t0 + .15) * (1 - seg(t, T.intel - .08, T.intel)), 'left', 44);
      if (kl > .95) {
        var a0 = U.lucia.t0 + .2, pp = CLIP.toScreen(U.lucia, t, .47, .62, rl[0], rl[1], rl[2], rl[3]), bb = CLIP.toScreen(U.lucia, t, .2, .7, rl[0], rl[1], rl[2], rl[3]);
        ringOn(g, t, U.lucia, rl, .47, .62, 120, 90, 13, a0);
        g.save(); g.beginPath(); g.rect(0, rl[1], W, rl[3]); g.clip(); K.arrow(g, pp[0] - 60, pp[1] + 40, clamp(bb[0] + 120, X0 + 60, X1), bb[1] - 70, eo(seg(t, a0 + .3, a0 + .7)), CREAM, 10, .3); g.restore();
        credit(g, U.lucia, rl);
      }
    } else if (t < T.close) {                            // intel: plate + her text on our phone
      if (t < U.pint.t1) bgPlate(g, t, .4); phoneIntel(g, t);
    } else if (t < T.end) {                              // a gunman right there
      var kc = openK(t, U.close), rc = slitRect(kc);
      drawUse(g, t, U.close, rc);
      chipAt(g, 'CLOSE', X1, PLATE[1] + 70, RED, INK, seg(t, U.close.t0 + .05, U.close.t0 + .15) * (1 - seg(t, T.end - .08, T.end)), 'right', 44);
      threats(g, t, 1 - seg(t, T.end - .1, T.end));
      if (kc > .95) {
        var pc = track(U.close, t, [[0, .27, .4], [1.0, .3, .4], [1.6, .45, .45], [2.4, .45, .5], [3.4, .5, .5]]);
        ringOn(g, t, U.close, rc, pc[0], pc[1], 170, 230, 17, U.close.t0 + .2, RED);
        credit(g, U.close, rc);
      }
    } else if (t < T.back) {
      ending(g, t);
    } else {                                             // loop: back to the hook frame
      hookFrame(g, t, U.back, false);
      hookTitle(g, t, t - T.back);
      chipAt(g, 'IN-GAME · ROCKSTAR · 23:47', MID, 1436, 'rgba(251,243,234,.92)', INK, 1, 'center', 26);
    }
    pill(g);
    if (t >= T.party && t < T.end) captions(g, t);
  }
  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (t < .01 || t > DUR - .4) samples = 1;
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
    Tx('hook', '10+ GUYS. SHE TEXTS.', 0, T.party); Tx('hook', '10+ GUYS. SHE TEXTS.', T.back + .1, DUR + 1);
    Tx('inv', 'OPENING PARTY', T.party + .05, T.gun + .1);
    Tx('gun', 'GUNMEN', T.gun + .15, T.jas - .05);
    Tx('jas', 'JASON', T.jas + .25, T.hide - .15);
    Tx('msg', 'GUYS EVERYWHERE', T.pops + .3, T.hide - .2); Tx('msg', 'GUYS EVERYWHERE', T.intel + .3, T.close - .2);
    Tx('luc', 'LUCIA', T.hide + .15, T.intel - .05);
    Tx('i1', '10+ GUYS', T.i1 + .1, T.end - .1); Tx('i2', 'AUTO WEPS', T.i2 + .1, T.end - .1); Tx('i3', 'EXPLOSIVES', T.i3 + .1, T.end - .1);
    Tx('rt', 'CLOSE', T.close + .15, T.end - .05);
    Tx('q', 'WOULD YOU SEND IT?', T.q + .2, T.back - .1);
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
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 84px Archivo', '600 30px Archivo', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0$–·→'); }))).then(function () {
      initTimes(); buildChunks(ctx);
      HOOKPX = Math.min(130, Math.floor(130 * 800 / K.measure(ctx, 'SHE TEXTS.', 130, { wide: false })));
      window.FILM.SHOTS = [
        { id: 'hook', name: 'Guys everywhere', t0: 0, t1: T.party }, { id: 'party', name: 'The party', t0: T.party, t1: T.gun },
        { id: 'gun', name: 'Gunmen', t0: T.gun, t1: T.jas }, { id: 'jas', name: 'Her text', t0: T.jas, t1: T.hide },
        { id: 'hide', name: 'Lucia types', t0: T.hide, t1: T.intel }, { id: 'intel', name: 'The intel', t0: T.intel, t1: T.close },
        { id: 'close', name: 'Right there', t0: T.close, t1: T.end }, { id: 'end', name: 'Send it?', t0: T.end, t1: DUR }];
      window.READY = true;
    });
  }
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1 }); r.to = b.t; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: .5, SLUG: 'gta-texts', SHOTS: [], LIVE: {}, init: init, render: render, frame: frame, T: T };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
