/* "4 locks, 1 bag": GTA 6, Delta, commentary mode (SAFE-EDIT rule 10). GTA 6 loot as an escape room: one cash bag
   behind a chain of four locks (power -> PC password -> safe code -> shed code), from a player's loot run posted the
   day after launch. Hero object: our own duffel bag wrapped in a chain with four padlocks; it opens one lock per lock
   line, rides a rail under each beat, and comes back up and re-locks for the loop.
   Footage (r3): short muted creator uses, full-bleed, each under 5 s and annotated: a darkened, blurred boat still
   behind the frame-0 bag (and again in the last 0.45 s so the loop matches), the boat (POSTED A DAY AFTER LAUNCH),
   keypad (frozen before any digit, then a cut to the safe swinging open, so no code is ever shown), the bag on his
   shoulder (circle follows it), and the SMG pickup label (ring tracks it). The lock counter steps off every clip. Credit lives in the description only (CLIP.credit skips
   creator clips). Everything else is our flat drawing. Pure function of t, keyed to the voice with at(id, word).
   Rail x 90-930, glyphs above y 1450. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx), BOUNDS_RUN. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, K = window.KIT, CLIP = window.CLIP;
  var BG = '#0b0820', CREAM = '#fbf0ea', HOT = '#ff4fa3', TEAL = '#19d3c5', INK = '#1d1233', YEL = '#ffd23f';
  var BAG = '#2f8f5b', BAG2 = '#21694a', STEEL = '#8c93a8', STEEL2 = '#5d6378', WOOD = '#9a6a3f', WOOD2 = '#6e4a2a', WATER = '#1e6fb8';
  var TAU = Math.PI * 2;
  var X0 = 90, X1 = 930, MID = 510, CAPY = 212, CHIPY = 418, PILLY = 100;
  var FX = 0, FY = 392, FW = 1080, FH = 1048, STY = 810;

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
  function initTimes() {
    EV.length = 0; CLIP.reset();
    T.money0 = 1.3;                              // the stake on screen by 2.0 s: $10K-$30K, he says
    T.bg1 = 1.4;                                 // the darkened, blurred boat still behind the frame-0 bag ends
    T.boat0 = start('lock1') - .12;              // clip: boat out to the compound
    T.boat1 = wend('lock1', 'one') + .05;        // own: the breaker
    T.posted1 = T.boat0 + 3.15;                  // POSTED A DAY AFTER LAUNCH chip (replaces the cut "found" beat)
    T.power = at('lock1', 'power');
    T.open1 = lastw('lock1') + .04;
    T.l2 = start('lock2') - .12;                 // own: PC login, then the bedroom wall
    T.pc = at('lock2', 'pc');
    T.open2 = lastw('lock2') + .04;
    T.l3 = start('lock3') - .12;                 // own: the PC prints SAFE CODE: ####
    T.sc = at('lock3', 'safe');
    T.k0 = start('take') - .12;                  // clip: ENTER CODE -> keypad, frozen before any digit; our opinion
    T.kfrz = 1.2;                                // seconds into the cut: the display still reads ----
    T.puzzle = at('take', 'rockstar');
    T.k1 = T.puzzle - .05;                       // clip: the safe swings open (digits never shown)
    T.open3 = T.k1 + .15;
    T.tw = start('twist') - .1;                  // own: the safe, a tiny stack, a sticky note
    T.barely = at('twist', 'little');
    T.another = at('twist', 'another');
    T.slosh = lastw('twist') + .02;              // water slosh under the breath before lock four
    T.l4 = start('lock4') - .02;                 // own: the shed snaps in on a door hit
    T.open4 = at('lock4', 'shed');
    T.b0 = start('bagl') - .12;                  // clip: the bag on his shoulder
    T.b1 = at('bagl', 'ten') - .05;              // own: the bag slides out of the shed, the stake
    T.ten = at('bagl', 'ten');
    T.s0 = start('smg') - .12;                   // clip: the SMG pickup label
    T.smg = at('smg', 'smg');
    T.end = start('end') - .12;                  // own: the bag comes back up, all four open
    T.escape = at('end', 'escape');
    T.loot = at('end', 'loot');
    T.q = at('end', 'escape') - .12;             // SOLVE IT? card: about 2.1 s, down from 3 s
    T.reclose = lastw('end') + .4;               // locks snap shut again: the last frame is frame 0
    T.open = [T.open1, T.open2, T.open3, T.open4];

    /* clip uses: each under 5 s and annotated; clipkit.py lint holds this to SAFE-EDIT rule 10 */
    U.hookbg = CLIP.use('boat', 0, T.bg1, { from: 1.9, speed: .3, zoom: [1.1, 1.16], focus: [.5, .4], note: 'frame-0 backdrop: darkened 50 %, blurred 6 px, behind the drawn bag so frame 0 reads as GTA 6 gameplay with the sound off' });
    U.endbg = CLIP.use('boat', DUR - .45, DUR, { from: 1.9 - .45 * .3, speed: .3, zoom: [1.09, 1.1], focus: [.5, .4], note: 'the same darkened backdrop fades back in under the re-locked bag so the last frame matches frame 0' });
    U.boat = CLIP.use('boat', T.boat0, T.boat1, { speed: Math.min(1, 2.4 / (T.boat1 - T.boat0)), zoom: [1.02, 1.12], focus: [.5, .6], note: 'full bleed, circle on the boat, chip POSTED A DAY AFTER LAUNCH' });
    U.key = CLIP.use('keypad', T.k0, T.k1, { speed: 1, freeze: T.kfrz, zoom: [1.02, 1.1], focus: [.5, .42], note: 'freeze before any digit, circle on the keypad, CODE: HIDDEN, our opinion 3 LOCKS, 1 SAFE' });
    U.safe = CLIP.use('keypad', T.k1, T.tw, { from: 2.07, speed: .42 / (T.tw - T.k1), zoom: [1.12, 1.26], focus: [.32, .5], note: 'the safe swings open, brightened; PUZZLE BOX slam; lock 3 opens' });
    U.bag = CLIP.use('bag', T.b0, T.b1, { from: 1.43, speed: Math.min(1, .44 / (T.b1 - T.b0)), zoom: [1.02, 1.08], focus: [.4, .8], note: 'only the frames where the bag is in shot; the THE BAG circle follows it' });
    U.smg = CLIP.use('smg', T.s0, T.end, { speed: Math.min(1, 1.05 / (T.end - T.s0)), zoom: [1.0, 1.04], focus: [.4, .95], note: 'circle tracks the CRABSHACK VF5 SMG pickup label, RARE SMG · HE SAYS card' });

    ev(.25, 'tick', .5); ev(.42, 'tick', .4); ev(T.money0, 'slam', .7); ev(lastw('hook') + .05, 'thud', .6);
    ev(T.boat0, 'swish', .6); ev(T.boat0 + .45, 'zip', .4);
    ev(T.boat1, 'swish', .6); ev(T.power + .25, 'thud', .7);
    ev(T.l2, 'swish', .6);
    for (var i = 0; i < 6; i++) ev(T.l2 + .3 + i * .13, 'key', .35);
    ev(T.pc, 'whoosh', .5);
    ev(T.l3, 'swish', .6); for (var b = 0; b < 4; b++) ev(T.sc + b * .12, 'key', .4);
    ev(T.k0, 'swish', .6); ev(T.k0 + T.kfrz, 'shutter', .6); ev(T.k1, 'squeak', .5);
    ev(T.tw, 'swish', .6); ev(T.barely + .05, 'squeak', .5); ev(T.another + .05, 'pop', .6);
    ev(T.slosh, 'slosh', .9); ev(T.l4, 'slam', .75); ev(T.l4 + .03, 'thud', .5); ev(T.open4 + .1, 'squeak', .5);
    ev(T.b0, 'swish', .6); ev(T.b1, 'whoosh', .5); ev(T.ten + .1, 'thud', .6);
    ev(T.s0, 'swish', .6); ev(T.smg, 'pop', .6);
    ev(T.end - .3, 'whoosh', .6); ev(T.escape, 'sparkle', .6); ev(T.q, 'pop', .6);
    for (var j = 0; j < 4; j++) { ev(T.open[j], 'pop', .8); ev(T.open[j] + .08, 'ding', .45); ev(T.reclose + j * .06, 'tick', .5); }
    ev(T.reclose + .4, 'slam', .6);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  /* ---------- captions: phrase cards of 2-4 words at 96 px, y 262; never end a card on a weak word ---------- */
  var CHUNKS = [], CPX = 96;
  var WEAK = { a: 1, an: 1, the: 1, is: 1, to: 1, in: 1, by: 1, you: 1, of: 1, for: 1, this: 1, and: 1, could: 1 };
  function buildChunks(g) {
    var HOTW = { locks: 1, bag: 1, power: 1, password: 1, bedroom: 1, safe: 1, code: 1, little: 1, cash: 1, shed: 1, thirty: 1, smg: 1, escape: 1, puzzle: 1, one: 1, two: 1, three: 1, four: 1 };
    var GAP = CPX * .3;
    function wd(w) { return K.measure(g, w.w, CPX, { wide: false }); }
    function width(c) { return c.reduce(function (a, w) { return a + wd(w); }, 0) + GAP * (c.length - 1); }
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;
      var ws = l.words.map(function (w) { return { w: w.w.replace(/[,:]$/, '').toUpperCase(), raw: w.w, t0: w.t0, t1: w.t1, hot: !!HOTW[norm(w.w)] }; });
      /* phrases end at punctuation; a phrase over 4 words splits into balanced cards that never end on a weak word */
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
      /* a lone one-word card joins its neighbour in the same line when the pair stays at 4 words or fewer */
      for (var q = 0; q < cards.length; q++) if (cards[q].length === 1 && cards.length > 1) {
        if (q + 1 < cards.length && cards[q + 1].length < 4) { cards[q + 1] = cards[q].concat(cards[q + 1]); cards.splice(q, 1); q--; }
        else if (q > 0 && cards[q - 1].length < 4) { cards[q - 1] = cards[q - 1].concat(cards[q]); cards.splice(q, 1); q--; }
      }
      /* lay each card out on one line, or two balanced lines when it is wider than the rail */
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
    CHUNKS.forEach(function (c, i) { var nx = CHUNKS[i + 1]; c.t0 = c[0].t0 - .05; c.t1 = nx ? Math.min(nx[0].t0 - .08, c[c.length - 1].t1 + .6) : c[c.length - 1].t1 + .5; });
  }
  function captions(g, t) {
    if (t > T.loot - .05) return;     // the end slams carry the last line
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (t < c.t0 || t >= c.t1) continue;
      /* the whole phrase card shows at once; the spoken word lifts, stressed words are yellow */
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

  /* ---------- background ---------- */
  function backdrop(g, t) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = .07; g.strokeStyle = HOT; g.lineWidth = 34;
    var off = (t / DUR) * 240;
    for (var x = -H; x < W + H; x += 120) { g.beginPath(); g.moveTo(x + off, 0); g.lineTo(x + off - H * .6, H); g.stroke(); }
    g.restore();
  }
  function card(g, x, y, w, h, fill, r) { g.save(); rr(g, x + 8, y + 12, w, h, r || 34); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, x, y, w, h, r || 34); g.fillStyle = fill; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore(); }
  function chipTop(g, s, bg, col, a) { g.save(); g.globalAlpha *= a == null ? 1 : a; K.chip(g, s, MID, CHIPY, 32, { align: 'center', bg: bg, col: col }); g.restore(); }
  function stamp(g, s, x, y, px, u, col, rot) {
    if (u <= 0) return;
    g.save(); g.translate(x, y); g.rotate(rot == null ? -.12 : rot); var sc = lerp(1.8, 1, eo(clamp(u / .16, 0, 1))); g.scale(sc, sc); g.globalAlpha *= clamp(u / .06, 0, 1);
    var w = K.measure(g, s, px, { wide: false }) + px * .9, h = px * 1.45;
    g.lineWidth = Math.max(6, px * .14); g.strokeStyle = col; rr(g, -w / 2, -h / 2, w, h, px * .2); g.stroke();
    K.sticker(g, s, 0, 3, px, { col: col, ink: BG, wide: false }); g.restore();
  }
  /* a drawn prop: scaled up to fill the stage and pushed in 1.0 -> 1.12 over its hold */
  function stage(g, t, t0, t1, s, fn) {
    var k = cd(t, t0, 12), push = lerp(1, 1.12, eio(seg(t, t0, t1)));
    g.save(); g.translate(MID, lerp(STY + 380, STY, k)); g.scale(s * push, s * push); g.globalAlpha *= k; fn(); g.restore();
    return k;
  }
  function pill(g) {
    g.save(); K.measure(g, 'GTA 6', 64, { wide: false });
    rr(g, X0, PILLY - 46, 232, 92, 46); g.fillStyle = HOT; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    K.sticker(g, 'GTA 6', X0 + 116, PILLY + 2, 64, { col: CREAM, wide: false, lw: 0, shadow: false });
    g.restore();
    K.chip(g, 'LOOT RUN', X1, PILLY, 34, { align: 'right', bg: CREAM, col: INK });
  }

  /* =============== the hero: a duffel bag, a chain round it, four padlocks =============== */
  var LX = [-262, -88, 88, 262], LY = -30;
  function openK(t, i) {
    var o = cd(t, T.open[i], 16);
    if (t >= T.reclose) o *= 1 - eio(seg(t, T.reclose + i * .06, T.reclose + i * .06 + .18));
    return o;
  }
  function padlock(g, t, i, x, y, o) {
    var sway = osc(t, 7 + i, i * 1.7) * .05 + knock(t, T.open[i], .22, 20, 5) + knock(t, .25 + i * .06, i === 0 ? .14 : 0, 24, 6);
    g.save(); g.translate(x, y); g.rotate(sway);
    var lift = 34 * o, swing = -1.1 * o;
    g.save(); g.translate(-34, 70 - lift); g.rotate(swing); g.translate(34, 0);
    g.lineCap = 'round'; g.lineWidth = 26; g.strokeStyle = INK; g.beginPath(); g.moveTo(-34, 0); g.lineTo(-34, -52); g.arc(0, -52, 34, Math.PI, 0); g.lineTo(34, 0); g.stroke();
    g.lineWidth = 15; g.strokeStyle = o > .5 ? '#d9dde8' : STEEL; g.stroke(); g.restore();
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
  function duffel(g, t) {
    g.lineCap = 'round'; g.lineWidth = 22; g.strokeStyle = INK; g.beginPath(); g.arc(-90, -150, 70, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.beginPath(); g.arc(90, -150, 70, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.lineWidth = 12; g.strokeStyle = BAG2; g.beginPath(); g.arc(-90, -150, 70, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); g.beginPath(); g.arc(90, -150, 70, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    rr(g, -310, -160, 620, 330, 140); g.fillStyle = BAG; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    g.save(); rr(g, -310, -160, 620, 330, 140); g.clip();
    g.fillStyle = BAG2; g.fillRect(-310, 90, 620, 90);
    g.fillStyle = 'rgba(255,255,255,.12)'; rr(g, -250, -140, 500, 40, 20); g.fill();
    g.restore();
    g.strokeStyle = INK; g.lineWidth = 5; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(-240, -118); g.lineTo(240, -118); g.stroke(); g.setLineDash([]);
    g.fillStyle = BAG2; g.beginPath(); g.ellipse(-300, 5, 26, 120, 0, 0, TAU); g.fill(); g.lineWidth = 6; g.stroke();
    g.beginPath(); g.ellipse(300, 5, 26, 120, 0, 0, TAU); g.fill(); g.stroke();
    for (var b = 0; b < 3; b++) { g.save(); g.translate(-150 + b * 120, -128); g.rotate(-.2 + b * .2 + osc(t, 9, b) * .05); rr(g, -38, -26, 76, 40, 5); g.fillStyle = '#9fd77f'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); g.restore(); }
    K.sticker(g, '$', 0, 128, 76, { col: YEL, wide: false });
  }
  /* poses: big (hook), rail (under each beat), end (bag big, free); the rail ducks away under two clips */
  var BIG = { x: MID, y: 900, s: 1.2 }, RAIL = { x: MID, y: 1318, s: .62 }, ENDP = { x: MID, y: 1040, s: 1.02 };
  function mixp(a, b, k) { return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), s: lerp(a.s, b.s, k) }; }
  /* the lock counter steps off the footage: it fades out for every clip use so it never covers the subject */
  function clipA(t) {
    var a = 1;
    [[T.boat0, T.boat1], [T.k0, T.tw]].forEach(function (c) { var k = Math.min(seg(t, c[0] - .05, c[0] + .12), 1 - seg(t, c[1] - .05, c[1] + .2)); a = Math.min(a, 1 - eio(clamp(k, 0, 1))); });
    return a;
  }
  function pose(t) {
    if (t < T.boat0) return BIG;
    if (t < T.end - .3) {
      var p = mixp(BIG, RAIL, eio(seg(t, T.boat0, T.boat0 + .1)));
      p.a = t >= T.b0 - .05 ? 1 - eio(seg(t, T.b0 - .05, T.b0 + .12)) : clipA(t);
      return p;
    }
    var q = mixp(RAIL, ENDP, eio(seg(t, T.end - .3, T.end + .35)));
    q = mixp(q, BIG, eio(seg(t, T.reclose - .1, T.reclose + .3)));
    q.a = eio(seg(t, T.end - .3, T.end + .05));
    return q;
  }
  function hero(g, t) {
    var p = pose(t), bob = osc(t, 9) * 6;
    if (p.a != null && p.a <= .02) return;
    g.save(); if (p.a != null) g.globalAlpha *= p.a; g.translate(p.x, p.y + bob * p.s); g.scale(p.s, p.s); g.rotate(osc(t, 5, 1) * .015);
    duffel(g, t);
    var drop = 90 * eio(seg(t, T.escape - .3, T.escape + .3)) * (t < T.reclose ? 1 : 1 - eio(seg(t, T.reclose - .15, T.reclose + .05)));
    var ca = 1 - seg(drop, 20, 90);
    chain(g, t, drop, ca);
    g.save(); g.globalAlpha *= ca;
    for (var i = 0; i < 4; i++) padlock(g, t, i, LX[i], LY + drop * (1 + .4 * Math.sin(i * 3)), openK(t, i));
    g.restore();
    g.restore();
    for (var j = 0; j < 4; j++) {
      var u = t - T.open[j]; if (u <= 0 || u > 1.4 || t > T.end - .3 || p.y > 1400 || (p.a != null && p.a < .5)) continue;
      g.save(); g.globalAlpha = 1 - seg(u, 1.1, 1.4); stamp(g, 'OPEN', p.x + LX[j] * p.s, p.y - 40, 34, u, TEAL, -.1); g.restore();
    }
  }
  function hookText(g, t, u) {
    var pulse = 1 + osc(t, 14) * .02;
    g.save(); g.translate(MID, 330); g.scale(pulse, pulse);
    K.slam(g, '4 LOCKS.', 0, 0, 150, u, { col: CREAM, rot: -.035, wide: false, from: 1.15 });
    K.slam(g, '1 BAG.', 20, 168, 160, u - .08, { col: YEL, rot: -.05, wide: false, from: 1.15 });
    g.restore();
  }
  function moneyStamp(g, t, u, y, a) {
    if (u <= 0 || a <= 0) return;
    g.save(); g.globalAlpha *= a;
    K.slam(g, '$10K–$30K', MID, y, 116, u, { col: YEL, rot: -.04, wide: false, from: 1.25 });
    if (u > .12) { var k = cd(t, t - u + .12, 16); g.save(); g.translate(MID + 10, y + 118); g.scale(k, k); K.chip(g, 'HE SAYS', 0, 0, 46, { align: 'center', bg: CREAM, col: INK }); g.restore(); }
    g.restore();
  }

  /* ---------- beats ---------- */
  /* frame 0: a darkened, blurred still of the game behind the drawn bag, so the sound-off scroller sees GTA 6 */
  function gameBg(g, t, u, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.beginPath(); g.rect(0, 380, W, 800); g.clip();
    g.filter = 'blur(6px) brightness(.5)'; CLIP.draw(g, t, -20, 360, W + 40, 840, u); g.filter = 'none';
    g.restore();
  }
  function beatHook(g, t) {
    gameBg(g, t, U.hookbg, lerp(.5, 1, eo(seg(t, 0, .3))) * (1 - eio(seg(t, T.bg1 - .4, T.bg1))));
    hero(g, t);
    var o = T.boat0 - .05, a = 1 - seg(t, o - .2, o);
    g.save(); g.globalAlpha = a; hookText(g, t, t + 1); g.restore();
    moneyStamp(g, t, t - T.money0, 1225, a);
  }
  /* full-bleed footage: the cut's own 1080 x 1110 frame, y 330-1440 */
  function footage(g, t, u) {
    var pop = cd(t, u.t0, 16), s = lerp(.97, 1, pop);
    g.save(); g.translate(MID + 30, FY + FH / 2); g.scale(s, s); g.translate(-(MID + 30), -(FY + FH / 2));
    g.save(); g.beginPath(); g.rect(FX, FY, FW, FH); g.clip();
    if (u === U.safe) g.filter = 'brightness(1.18) contrast(1.05)';
    CLIP.draw(g, t, FX, FY, FW, FH, u);
    g.filter = 'none';
    if (u === U.key && t >= u.t0 + T.kfrz) K.freezeFX(g, W, H, t - u.t0 - T.kfrz);
    g.restore();
    g.fillStyle = INK; g.fillRect(FX, FY - 6, FW, 8); g.fillRect(FX, FY + FH - 2, FW, 8);
    CLIP.credit(g, u, X0 + 10, FY + FH - 40);   // draws nothing for a creator clip: credit is in the description
    g.restore();
  }
  /* a point that follows something in the footage: key-framed in the cut's own seconds */
  function track(u, t, keys) {
    var src = u.from + Math.max(0, t - u.t0) * u.speed;
    if (src <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (var i = 1; i < keys.length; i++) if (src <= keys[i][0]) { var k = seg(src, keys[i - 1][0], keys[i][0]); return [lerp(keys[i - 1][1], keys[i][1], k), lerp(keys[i - 1][2], keys[i][2], k)]; }
    var l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  function circleOn(g, t, u, nx, ny, rx, ry, col, seed, d0, below) {
    var p = CLIP.toScreen(u, t, nx, ny, FX, FY, FW, FH);
    g.save(); g.beginPath(); g.rect(FX, FY, FW, FH + (below || 0)); g.clip();
    var a0 = u.t0 + (d0 == null ? .25 : d0); K.scribble(g, p[0], p[1], rx, ry, eo(seg(t, a0, a0 + .5)), col, 12, seed);
    g.restore();
  }
  function clipChip(g, s, bg, col) { K.chip(g, s, X0, FY + 70, 40, { bg: bg || YEL, col: col || INK }); }
  function beatBoat(g, t) {
    footage(g, t, U.boat);
    circleOn(g, t, U.boat, .5, .64, 270, 330, YEL, 3);
    hero(g, t);
  }
  function beatPower(g, t) {
    var on = eio(seg(t, T.power + .05, T.power + .3));
    var k = stage(g, t, T.boat1, T.l2, 1.4, function () {
      card(g, -260, -270, 520, 540, STEEL2, 26);
      rr(g, -200, -210, 400, 420, 18); g.fillStyle = '#3a3f52'; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
      rr(g, -50, -150, 100, 300, 20); g.fillStyle = INK; g.fill();
      var ly = lerp(90, -90, on);
      rr(g, -70, ly - 40, 140, 80, 18); g.fillStyle = on > .5 ? TEAL : HOT; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
      K.sticker(g, on > .5 ? 'ON' : 'OFF', 0, ly, 44, { col: INK, lw: 0, shadow: false, wide: false });
      var glow = on * (.85 + .15 * Math.sin(t * 30));
      g.fillStyle = 'rgba(255,210,63,' + (.35 * glow).toFixed(3) + ')'; g.beginPath(); g.arc(150, -170, 60, 0, TAU); g.fill();
      g.fillStyle = on > .5 ? YEL : '#555a6e'; g.beginPath(); g.arc(150, -170, 28, 0, TAU); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    });
    if (t > T.power + .1) stamp(g, 'POWER ON', MID, 1090, 72, t - T.power - .1, YEL, -.08);
    chipTop(g, 'MAIN BUILDING · OUR DRAWING', CREAM, INK, k * seg(t, T.posted1, T.posted1 + .2));
    hero(g, t);
  }
  function monitorBody(g) {
    card(g, -300, -200, 600, 380, INK, 26);
    rr(g, -270, -170, 540, 320, 14); g.fillStyle = '#1b3c6e'; g.fill();
    g.fillStyle = INK; g.fillRect(-40, 180, 80, 50); rr(g, -130, 226, 260, 26, 10); g.fill();
  }
  function loginBox(g, t, n) {
    rr(g, -200, -90, 400, 170, 16); g.fillStyle = CREAM; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    K.sticker(g, 'PASSWORD', 0, -50, 40, { col: INK, lw: 0, shadow: false, wide: false });
    rr(g, -160, -10, 320, 64, 10); g.fillStyle = '#e6e0f0'; g.fill(); g.stroke();
    g.fillStyle = INK; var a = g.globalAlpha; for (var i = 0; i < 6; i++) { g.globalAlpha = (i < n ? 1 : .18) * a; g.beginPath(); g.arc(-110 + i * 44, 22, 13, 0, TAU); g.fill(); }
    g.globalAlpha = a; if (n >= 6 && Math.floor(t * 3) % 2) { g.fillStyle = HOT; g.fillRect(150, 0, 6, 44); }
  }
  function beatL2(g, t) {
    var n = Math.min(6, Math.floor(Math.max(0, t - T.l2 - .25) / .1)), bk = cd(t, T.pc, 12);
    var k;
    if (bk < .5) k = stage(g, t, T.l2, T.pc + .3, lerp(1.35, .8, bk), function () { monitorBody(g); loginBox(g, t, n); });
    else k = stage(g, t, T.l2, T.k0, 1, function () {
      /* the bedroom wall; the password scrawl is blurred on purpose */
      g.translate(-510, -900);
      card(g, 110, 620, 800, 560, '#c9a7d8', 26);
      g.save(); rr(g, 116, 626, 788, 548, 22); g.clip();
      g.fillStyle = 'rgba(29,18,51,.08)'; for (var x = 130; x < 900; x += 46) g.fillRect(x, 626, 18, 548);
      rr(g, 160, 990, 520, 140, 18); g.fillStyle = '#e8edf7'; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
      rr(g, 180, 960, 160, 60, 20); g.fillStyle = CREAM; g.fill(); g.stroke();
      rr(g, 140, 900, 40, 240, 10); g.fillStyle = WOOD2; g.fill(); g.stroke();
      g.save(); g.filter = 'blur(7px)'; g.strokeStyle = INK; g.lineWidth = 11; g.lineCap = 'round'; g.beginPath();
      for (var i = 0; i < 28; i++) { var px = 470 + i * 14, py = 770 + Math.sin(i * 1.7) * 20 + (hash(i) - .5) * 22; if (i === 0) g.moveTo(px, py); else g.lineTo(px, py); }
      g.stroke(); g.restore();
      g.restore();
      g.save(); g.translate(300, 760); g.scale(.42, .42); monitorBody(g); loginBox(g, t, 6); g.restore();
      var lk = eo(seg(t, T.pc + .1, T.pc + .5));
      K.scribble(g, 660, 772, 240, 80, lk, HOT, 10, 5);
      if (lk > .3) K.chip(g, 'BLURRED', 660, 885, 40, { align: 'center', bg: HOT, col: CREAM });
    });
    chipTop(g, 'IN THE BEDROOM · OUR DRAWING', CREAM, INK, k);
    hero(g, t);
  }
  function beatL3(g, t) {
    var k = stage(g, t, T.l3, T.k0, 1.4, function () {
      monitorBody(g);
      rr(g, -230, -130, 460, 240, 16); g.fillStyle = '#0d1a2e'; g.fill(); g.lineWidth = 5; g.strokeStyle = TEAL; g.stroke();
      K.sticker(g, 'SAFE CODE:', 0, -70, 48, { col: TEAL, lw: 0, shadow: false, wide: false });
      for (var b = 0; b < 4; b++) {
        var on = t > T.sc + b * .12;
        rr(g, -170 + b * 90, -10, 70, 90, 8); g.fillStyle = on ? CREAM : 'rgba(251,240,234,.15)'; g.fill();
      }
      if (Math.floor(t * 3) % 2) { g.fillStyle = TEAL; g.fillRect(190, 0, 8, 70); }
    });
    if (t > T.sc + .5) stamp(g, 'HIDDEN', MID + 200, 1090, 56, t - T.sc - .5, HOT, -.1);
    chipTop(g, 'THE PC · OUR DRAWING', CREAM, INK, k);
    hero(g, t);
  }
  function beatKey(g, t) {
    var u = t < T.k1 ? U.key : U.safe;
    footage(g, t, u);
    if (u === U.key) circleOn(g, t, U.key, .5, .4, 200, 200, YEL, 7, T.kfrz - .1);
    clipChip(g, 'CODE: HIDDEN', HOT, CREAM);
    if (u === U.safe) K.chip(g, 'SAFE: OPEN', X1, FY + 70, 40, { align: 'right', bg: TEAL, col: INK });
    /* our take */
    K.slam(g, '3 LOCKS, 1 SAFE', MID, 1110, 84, t - T.k0 - .1, { col: CREAM, wide: false, from: 1.3 });
    if (t > T.puzzle + .1) K.slam(g, 'PUZZLE BOX', MID, 960, 112, t - at('take', 'puzzle'), { col: YEL, wide: false, rot: -.06, from: 1.3 });
    hero(g, t);
  }
  function beatTwist(g, t) {
    var door = eio(seg(t, T.tw + .1, T.barely - .05));
    var k = stage(g, t, T.tw, T.l4, 1.42, function () {
      card(g, -280, -290, 560, 520, STEEL2, 22);
      rr(g, -230, -240, 460, 420, 12); g.fillStyle = '#1c1830'; g.fill();
      var ck = cd(t, T.barely, 14);
      g.save(); g.translate(-90, 130); g.scale(ck, ck); rr(g, -55, -26, 110, 30, 5); g.fillStyle = '#9fd77f'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); g.restore();
      var nk = cd(t, T.another - .15, 14);
      if (nk > 0) {
        g.save(); g.translate(70, -60); g.rotate(.08 + osc(t, 8) * .02); g.scale(nk, nk);
        rr(g, -120, -110, 240, 220, 6); g.fillStyle = YEL; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
        K.sticker(g, 'CODE', 0, -60, 40, { col: INK, lw: 0, shadow: false, wide: false });
        g.save(); g.filter = 'blur(8px)'; g.fillStyle = INK; for (var d = 0; d < 4; d++) g.fillRect(-90 + d * 48, -5, 32, 60); g.restore();
        g.restore();
      }
      var dw = 460 * Math.cos(door * 1.35);
      g.save(); g.translate(-230, 0);
      rr(g, 0 - (dw < 0 ? -dw : 0), -240, Math.abs(dw), 420, 12); g.fillStyle = STEEL; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
      if (dw > 60) { g.fillStyle = INK; g.beginPath(); g.arc(dw * .7, -30, 46 * dw / 460, 0, TAU); g.fill(); }
      g.restore();
    });
    if (t > T.barely - .1) K.slam(g, 'A LITTLE CASH', MID, 1150, 84, t - T.barely + .1, { col: CREAM, wide: false, from: 1.3 });
    chipTop(g, 'INSIDE THE SAFE · OUR DRAWING', CREAM, INK, k);
    hero(g, t);
  }
  function shedDraw(g, t, door, bagOut) {
    g.save(); rr(g, -420, 150, 840, 140, 20); g.fillStyle = WATER; g.fill(); g.clip();
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 5; for (var w = 0; w < 4; w++) { g.beginPath(); for (var x = -420; x <= 420; x += 20) { var y = 180 + w * 30 + Math.sin(x * .03 + t * 3 + w) * 6; if (x === -420) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke(); }
    g.restore();
    g.fillStyle = WOOD; g.fillRect(-260, -140, 520, 300); g.strokeStyle = WOOD2; g.lineWidth = 5; for (var p = -240; p < 260; p += 40) { g.beginPath(); g.moveTo(p, -140); g.lineTo(p, 160); g.stroke(); }
    g.lineWidth = 7; g.strokeStyle = INK; g.strokeRect(-260, -140, 520, 300);
    g.fillStyle = '#3a2a1c'; g.beginPath(); g.moveTo(-300, -140); g.lineTo(0, -290); g.lineTo(300, -140); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#120c18'; g.fillRect(-100, -60, 200, 220);
    var dw = 200 * Math.cos(door * 1.4);
    g.fillStyle = WOOD2; g.fillRect(100 - dw, -60, dw, 220); g.lineWidth = 6; g.strokeRect(100 - dw, -60, dw, 220);
    if (bagOut >= 0) { g.save(); g.translate(0, lerp(110, 330, bagOut)); var s = lerp(.3, .62, bagOut); g.scale(s, s); duffel(g, t); g.restore(); }
  }
  function beatL4(g, t) {
    var door = eio(seg(t, T.open4, T.open4 + .45));
    /* no fade: the shed snaps in at full opacity on the door hit, scale .9 -> 1 over six frames */
    var snap = lerp(.9, 1, eo(seg(t, T.l4, T.l4 + .2))), push = lerp(1, 1.12, eio(seg(t, T.l4, T.b0))), k = 1;
    g.save(); g.translate(MID, STY); g.scale(1.25 * snap * push, 1.25 * snap * push); shedDraw(g, t, door, -1); g.restore();
    chipTop(g, 'A SHED BY THE WATER · OUR DRAWING', CREAM, INK, k);
    hero(g, t);
  }
  function beatBag(g, t) {
    footage(g, t, U.bag);
    var bp = track(U.bag, t, [[1.43, .24, .8], [1.57, .36, .85], [1.9, .35, .85]]);
    circleOn(g, t, U.bag, bp[0], bp[1], 220, 190, YEL, 9, .15);
    clipChip(g, 'THE BAG');
    hero(g, t);
  }
  function beatStake(g, t) {
    /* the bag slides out of the shed toward us (about 300 px) and the stake slams on */
    var out = eio(seg(t, T.b1, T.b1 + .55));
    stage(g, t, T.b1 - .3, T.s0, 1.2, function () { g.translate(0, -40); shedDraw(g, t, 1, out); });
    moneyStamp(g, t, t - T.ten, 500, 1);
    hero(g, t);
  }
  function smgIcon(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = INK;
    g.fillRect(-90, -22, 170, 36); g.fillRect(80, -12, 40, 14); g.fillRect(-20, 14, 26, 60); g.fillRect(30, 14, 22, 44); g.fillRect(-120, -14, 34, 22);
    g.restore();
  }
  function smgCard(g, t) {
    var sk = cd(t, T.s0 + .25, 14) * (1 - seg(t, T.q - .15, T.q + .05));
    if (sk <= 0) return;
    g.save(); g.translate(MID, FY + 230); g.rotate(-.03); g.scale(sk, sk);
    card(g, -260, -120, 520, 250, CREAM, 22); smgIcon(g, 0, -45, 1.15);
    K.sticker(g, 'RARE SMG · HE SAYS', 0, 75, 44, { col: HOT, lw: 0, shadow: false, wide: false });
    g.restore();
  }
  function beatSmg(g, t) {
    footage(g, t, U.smg);
    var lp = track(U.smg, t, [[0, .34, .964], [.4, .36, .964], [.6, .41, .964], [.8, .5, .964], [.93, .58, .964], [1.03, .64, .964], [1.1, .7, .964]]);
    circleOn(g, t, U.smg, lp[0], lp[1], 215, 58, YEL, 13, .15, 60);
    smgCard(g, t);
    hero(g, t);
  }
  function beatEnd(g, t) {
    gameBg(g, t, U.endbg, t >= U.endbg.t0 ? .5 * eio(seg(t, U.endbg.t0, DUR)) : 0);
    hero(g, t);
    if (t < T.q + .1) smgCard(g, t);
    var ea = 1 - seg(t, T.reclose - .1, T.reclose + .1);
    if (ea > 0) {
      g.save(); g.globalAlpha = ea;
      if (t > T.loot) K.slam(g, 'ESCAPE ROOM', MID, 300, 96, t - T.loot, { col: YEL, wide: false, rot: -.05, from: 1.25 });
      if (t > T.q) {
        var k = cd(t, T.q, 14); g.save(); g.translate(MID, 570); g.scale(k, k); g.rotate(-.02);
        card(g, -370, -110, 740, 220, HOT, 34);
        K.sticker(g, 'SOLVE IT?', 0, 6, 120, { col: YEL, wide: false });
        g.restore();
      }
      g.restore();
    }
    if (t > T.reclose + .15) {
      hookText(g, t, t - T.reclose - .15);
    }
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    backdrop(g, t);
    if (t < T.boat0) beatHook(g, t);
    else if (t < T.boat1) beatBoat(g, t);
    else if (t < T.l2) beatPower(g, t);
    else if (t < T.l3) beatL2(g, t);
    else if (t < T.k0) beatL3(g, t);
    else if (t < T.tw) beatKey(g, t);
    else if (t < T.l4) beatTwist(g, t);
    else if (t < T.b0) beatL4(g, t);
    else if (t < T.b1) beatBag(g, t);
    else if (t < T.s0) beatStake(g, t);
    else if (t < T.end) beatSmg(g, t);
    else beatEnd(g, t);
    [T.boat0, T.k0, T.b0, T.s0].forEach(function (c) { K.flash(g, W, H, t - c, .25); });
    if (t >= T.boat0 && t < T.posted1) { g.save(); g.globalAlpha = eo(seg(t, T.boat0 + .05, T.boat0 + .2)) * (1 - seg(t, T.posted1 - .15, T.posted1)); clipChip(g, 'POSTED A DAY AFTER LAUNCH'); g.restore(); }
    pill(g);
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
    Tx('hook', '4 LOCKS. 1 BAG.', 0, T.boat0 - .2);
    Tx('money', '$10K–$30K · HE SAYS', T.money0 + .12, T.boat0 - .2);
    Tx('money', '$10K–$30K · HE SAYS', T.ten + .12, T.s0);
    Tx('posted', 'POSTED A DAY AFTER LAUNCH', T.boat0 + .12, T.posted1 - .08);
    Tx('pass', 'BLURRED', T.pc + .13, T.l3);
    Tx('sc', 'SAFE CODE', T.l3 + .15, T.k0);
    Tx('code', 'CODE: HIDDEN', T.k0, T.tw);
    Tx('take', '3 LOCKS, 1 SAFE', T.k0 + .15, T.tw);
    Tx('little', 'A LITTLE CASH', T.barely - .07, T.l4);
    Tx('smg', 'RARE SMG · HE SAYS', T.s0 + .35, T.q - .05);
    Tx('escape', 'ESCAPE ROOM', T.loot + .1, T.reclose + .05);
    Tx('solve', 'SOLVE IT?', T.q + .06, T.reclose + .1);
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

  /* the kit's SFX plus one of ours: a water slosh (low-passed noise in three swells) under the breath before the shed */
  function SCORE(ac) {
    K.score(ac, EV, DUR);
    var sr = ac.sampleRate, nb = ac.createBuffer(1, sr, sr), nd = nb.getChannelData(0);
    for (var i = 0; i < nd.length; i++) nd[i] = hash(i * .37 + 5) * 2 - 1;
    EV.forEach(function (e) {
      if (e.type !== 'slosh') return;
      var t = e.t, d = .6, n = ac.createBufferSource(), lp = ac.createBiquadFilter(), o = ac.createGain();
      n.buffer = nb; n.loop = true; lp.type = 'lowpass'; lp.Q.value = 2.2; n.connect(lp); lp.connect(o); o.connect(ac.destination);
      lp.frequency.setValueAtTime(380, t); o.gain.setValueAtTime(0, t);
      for (var k = 0; k < 3; k++) { var a = t + k * .19; o.gain.linearRampToValueAtTime(.16 * (e.g || 1) * (1 - k * .25), a + .07); lp.frequency.linearRampToValueAtTime(900 - k * 150, a + .07); o.gain.linearRampToValueAtTime(.03, a + .18); lp.frequency.linearRampToValueAtTime(320, a + .18); }
      o.gain.linearRampToValueAtTime(0, t + d); n.start(t); n.stop(t + d + .05);
    });
  }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function init(canvas) {
    canvas.width = W; canvas.height = H; ctx = canvas.getContext('2d'); watch(ctx);
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 84px Archivo', '600 30px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0$–·→'); }))).then(function () {
      initTimes(); buildChunks(ctx);
      window.FILM.POSTER = 1.9;   // the hook with the stake: four locks, one bag, $10K-$30K he says
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
  window.CHUNKS_DEBUG = function () { return CHUNKS.map(function (c) { return c.rows.map(function (r) { return r.map(function (w) { return w.w; }).join(' '); }).join(' / '); }); };

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: 1.9, SLUG: 'gta-lootrun', SHOTS: [], LIVE: {}, init: init, render: render, frame: frame, T: T };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
