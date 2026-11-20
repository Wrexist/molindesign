/* "Everyone's already dead": GTA 6, Delta, commentary mode (SAFE-EDIT rule 10).
   A vertical film written in code, narrated first and cut to the voice: every beat is keyed to a word time from
   vo/vo.js (window.VO); sound effects sit in the voice's pauses (vo/vad.js). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Footage: three muted 1.8-2.5 s gameplay clips from a creator's launch-day TikTok (facecam and captions cropped out
   at cut time, credit in the description only), each shown as a pinned evidence polaroid with a pink annotation.
   Everything else is our own flat drawing: a chalk outline on a dark floor, police tape (the native move: it sweeps
   through every big cut and is already mid-sweep on frame 0), a cork evidence board that fills with tags, a safe,
   a total counter labeled HE SAYS. Layout keeps glyphs inside x 90-930 and above y 1450. No music, no end fade. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, K = window.KIT, CLIP = window.CLIP;
  var FLOOR = '#16121b', CORK = '#3d2b1e', CREAM = '#fbf0ea', CHALK = '#f3efe6', TAPE = '#ffd23f', INK = '#1d1233';
  var PINK = '#ff4fa3', RED = '#ff3b3b', MANILA = '#ead09a', TEAL = '#19d3c5', GREEN = '#3fae5a', STEEL = '#7d8794';
  var TAU = Math.PI * 2, X0 = 90, X1 = 930, MID = 510, CAPY = 476;

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function osc(t, n, ph) { return Math.sin(TAU * n * t / DUR + (ph || 0)); }   /* periodic in DUR: the loop is exact */
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}, ORDER = []; VO.lines.forEach(function (l) { LINE[l.id] = l; ORDER.push(l.id); });
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

  /* ---------- the SFX gate: hits sit in pauses, clear of where the voice really sounds (vo/vad.js) ---------- */
  var EDGES = [], VOICED = [];
  if (window.VAD) window.VAD.forEach(function (v) { VOICED.push({ t0: v[0], t1: v[1] }); EDGES.push(v[0], v[1]); });
  else VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  function free(m) {
    var B = [], M = [], F = [], p = -1;
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    M.forEach(function (b) { if (b[0] > p) F.push([Math.max(0, p), b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { whoosh: .3, swish: .26, pop: .1, thud: .16, slam: .2, shutter: .06, zip: .14, tick: .03, key: .03, ding: .3, scratch: .26, squeak: .18 };
  function nearGap(t, type) {
    var bd = BODY[type] || .12, best = null;
    free(.15).forEach(function (f) { var lo = f[0], hi = f[1] - bd; if (hi < lo) return; var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c; });
    return best;
  }
  var EV = [];
  function G(t, type, tol, gain) {
    var n = nearGap(t, type);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .35 : tol)) EV.push({ t: n, type: type, g: gain == null ? 1 : gain });
  }

  /* ---------- times ---------- */
  var T = {}, U = {};
  function initTimes() {
    EV.length = 0; CLIP.reset();
    T.stash = at('hook', 'stash'); T.house = at('hook', 'house'); T.dead = at('hook', 'dead');
    T.wipe1 = start('where') - .32;                                     /* tape wipe: floor -> board */
    T.close = at('where', 'close'); T.starts = at('where', 'starts'); T.gameW = at('where', 'game');
    T.door0 = start('door') - .15; T.door1 = T.door0 + 1.9;           /* exhibit A: the door, up to the BREAK OPEN prompt */
    T.prompt = T.door0 + 1.2;                                         /* BREAK OPEN shows 1.2-2.0 s into the cut */
    T.down = at('door', 'down');
    T.bod0 = T.door1 + .35; T.bod1 = start('nofight') - .1;          /* exhibit B: the garage shot with the body on the floor (cut 1.68-2.5 s) */
    T.fight = at('nofight', 'fight'); T.loot = at('nofight', 'loot');
    T.guns = T.bod1; T.stampsOut = at('guns', 'smg') - .2;
    T.items = [at('guns', 'smg'), at('guns', 'rifle'), at('guns', 'stash')];
    T.tab0 = start('room') - .15; T.tab1 = T.tab0 + 2.1;              /* exhibit C: ends at cut 2.10 s, 9+ frames before a drug word shows in the HUD (frame 72) */
    T.more = at('room', 'more');
    T.safe0 = T.tab1; T.safeOpen = at('safe', 'safe'); T.cash = at('safe', 'cash'); T.card = at('safe', 'card'); T.six = at('safe', '$6000');
    T.tot0 = start('total') - .15; T.roll0 = at('total', 'about'); T.roll1 = at('total', '$17000') + .5; T.without = at('total', 'without');
    T.wipe2 = start('end') - .05;                                      /* tape wipe: board -> floor */
    T.who = at('end', 'who'); T.q = at('end', 'before');
    T.back = lastw('end') + .4;                                        /* the hook rebuilds for the loop */
    /* where each tag pins: [time it flies to its slot] */
    T.pin = [T.items[1] - .05, T.items[2] - .05, T.tab0 - .02, T.tab1 - .34, T.card - .1, T.six + .75];

    /* clip uses: each under 5 s and annotated; clipkit.py lint holds this to SAFE-EDIT rules 3 and 10 */
    U.door = CLIP.use('door', T.door0, T.door1, { zoom: [1.02, 1.12], focus: [.42, .45], note: 'EXHIBIT A polaroid; pink circle on the BREAK OPEN prompt, BREAK OPEN chip' });
    U.bod = CLIP.use('bodies', T.bod0, T.bod1, { from: 1.68, speed: .8 / (T.bod1 - T.bod0), zoom: [1.04, 1.12], focus: [.45, .42], note: 'EXHIBIT B polaroid (brightened); pink circle on the body on the floor, ALREADY DOWN stamp on the polaroid stripps, pink circle on the LOOT prompt' });
    U.tab = CLIP.use('table', T.tab0, T.tab1, { zoom: [1.12, 1.22], focus: [.5, .32], note: 'EXHIBIT C polaroid; pink circle on the back-room table, MORE TO BAG chip' });

    /* sound: one hit per beat, only where the voice leaves room */
    G(0, 'tick', .1, .5);
    G(T.wipe1 - .05, 'whoosh', .35, 1.5); G(T.wipe1, 'scratch', .35, 1.15); G(T.close + .1, 'thud', .35, .26);
    G(T.door0, 'shutter', .3, .44); G(T.prompt + .1, 'pop', .35, .5);
    G(T.door1, 'swish', .3, .8); G(T.bod0, 'shutter', .3, .44);
    G(T.bod1, 'thud', .35, .26); G(start('nofight') - .15, 'slam', .3, .2);
    G(T.tab0, 'shutter', .3, .44); G(T.tab1 + .1, 'thud', .4, .14);
    G(T.tot0, 'pop', .3, .5);
    G(T.wipe2 - .12, 'whoosh', .35, .85); G(T.wipe2, 'scratch', .35, .65);
    G(T.who, 'thud', .5, .14);
    G(T.back + .1, 'slam', .35, .1);
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  /* ---------- captions: phrase cards (2-4 words, 96 px) at a fixed centre in the upper third.
     Each line splits into phrases by word count; a phrase marked 0 is skipped because the same words are big on screen. */
  var PHRASES = {
    hook: [[3, 1], [4, 1], [3, 0]], where: [[3, 1], [5, 1]], door: [[4, 1], [4, 1], [3, 1]], nofight: [[2, 0], [3, 0]],
    guns: [[2, 0], [3, 0], [3, 0]], room: [[3, 1], [5, 1]], safe: [[5, 1], [5, 1], [3, 1]], total: [[2, 0], [2, 1], [4, 1]], end: [[5, 1], [4, 1]]
  };
  var CHUNKS = [];
  function buildChunks() {
    var HOTW = { dead: 1, door: 1, down: 1, fight: 1, loot: 1, smg: 1, rifle: 1, safe: 1, cash: 1, '6000': 1, '17000': 1, kill: 1, who: 1, start: 1, starts: 1, room: 1, bag: 1 };
    VO.lines.forEach(function (l) {
      var spec = PHRASES[l.id] || [[l.words.length, 1]], i = 0;
      spec.forEach(function (ph, j) {
        var n = j === spec.length - 1 ? l.words.length - i : ph[0], c = [];
        for (var k = 0; k < n && i < l.words.length; k++, i++) { var w = l.words[i]; c.push({ w: w.w.replace(/[.,:]$/, '').toUpperCase(), t0: w.t0, t1: w.t1, hot: !!HOTW[norm(w.w)] }); }
        if (c.length) { c.show = !!ph[1]; CHUNKS.push(c); }
      });
    });
    CHUNKS.forEach(function (c, i) { c.t0 = c[0].t0 - .06; var nx = CHUNKS[i + 1]; c.t1 = nx ? Math.min(nx[0].t0 - .08, c[c.length - 1].t1 + .5) : Math.min(DUR, c[c.length - 1].t1 + .5); });
  }
  function captions(g, t) {
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (!c.show || t < c.t0 || t >= c.t1) continue;
      var px = 96, gap = px * .3, ws = c.map(function (w) { return K.measure(g, w.w, px, { wide: false }); });
      /* wrap to at most two lines inside 800 px */
      var lines = [[]], lw = [0];
      c.forEach(function (w, j) { var L = lines.length - 1, add = (lines[L].length ? gap : 0) + ws[j]; if (lw[L] + add > 800 && lines[L].length && lines.length < 2) { lines.push([j]); lw.push(ws[j]); } else { lines[L].push(j); lw[L] += add; } });
      var widest = Math.max.apply(null, lw), s = Math.min(1, 800 / widest), lh = px * 1.02, y0 = 420 - (lines.length - 1) * lh / 2;
      var k = cd(t, c.t0, 22), sc = s * lerp(.86, 1, k), out = 1 - seg(t, c.t1 - .07, c.t1);
      g.save(); g.globalAlpha *= out; g.translate(MID, 420); g.scale(sc, sc); g.translate(-MID, -420);
      lines.forEach(function (L, li) {
        var x = MID - lw[li] / 2;
        L.forEach(function (j) {
          var w = c[j], on = t >= w.t0 - .03 && t < w.t1 + .05;
          K.sticker(g, w.w, x + ws[j] / 2, y0 + li * lh, px, { col: w.hot ? TAPE : (on ? '#ffffff' : CREAM), wide: false, lw: px * .16 });
          x += ws[j] + gap;
        });
      });
      g.restore(); return;
    }
  }

  /* ---------- textures (built once) ---------- */
  var TX = {};
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function buildTextures() {
    /* asphalt floor */
    var f = mk(W, H), g = f.getContext('2d'), i;
    g.fillStyle = FLOOR; g.fillRect(0, 0, W, H);
    for (i = 0; i < 5200; i++) { var a = hash(i * 3.1); g.fillStyle = a > .5 ? 'rgba(255,255,255,' + (.02 + .05 * hash(i)) + ')' : 'rgba(0,0,0,' + (.1 + .2 * hash(i + 9)) + ')'; g.fillRect(hash(i * 1.7) * W, hash(i * 2.3) * H, 1 + 3 * hash(i * 5.9), 1 + 3 * hash(i * 6.1)); }
    g.strokeStyle = 'rgba(255,255,255,.035)'; g.lineWidth = 3; for (i = 0; i < 9; i++) { g.beginPath(); g.moveTo(hash(i + 40) * W, 0); g.lineTo(hash(i + 60) * W, H); g.stroke(); }
    TX.floor = f;
    /* cork board */
    var c = mk(W, H); g = c.getContext('2d');
    g.fillStyle = CORK; g.fillRect(0, 0, W, H);
    for (i = 0; i < 9000; i++) { var b = hash(i * 1.3 + 7); g.fillStyle = b > .55 ? 'rgba(120,86,52,' + (.25 + .3 * hash(i + 2)) + ')' : 'rgba(20,12,6,' + (.2 + .3 * hash(i + 5)) + ')'; var r = 1 + 3.2 * hash(i * 4.4); g.beginPath(); g.ellipse(hash(i * 2.9) * W, hash(i * 3.7) * H, r, r * (.5 + hash(i)), hash(i * 8) * 3, 0, TAU); g.fill(); }
    /* old pin holes and scraps of paper from earlier cases */
    for (i = 0; i < 70; i++) { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(hash(i + 300) * W, hash(i + 500) * H, 2.5, 0, TAU); g.fill(); }
    var vg = g.createRadialGradient(W / 2, H * .5, 300, W / 2, H * .5, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    TX.cork = c;
    /* police tape strip: one repeat, scrolls along its band */
    var tp = mk(1240, 96); g = tp.getContext('2d');
    g.fillStyle = TAPE; g.fillRect(0, 0, 1240, 96);
    g.fillStyle = INK; g.fillRect(0, 0, 1240, 8); g.fillRect(0, 88, 1240, 8);
    g.font = '900 46px Archivo'; try { g.fontStretch = 'expanded'; } catch (e) {} g.textBaseline = 'middle';
    g.fillText('CRIME SCENE', 30, 50); g.fillText('DO NOT CROSS', 640, 50);
    TX.tape = tp;
    /* grain */
    var n = mk(256, 256); g = n.getContext('2d'); var id = g.createImageData(256, 256);
    for (i = 0; i < id.data.length; i += 4) { var v = Math.floor(hash(i * .37) * 255); id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0); TX.noise = n;
  }

  /* ---------- primitives ---------- */
  /* a police-tape band from (x0,y0) to (x1,y1); k 0..1 is how much of it has unrolled; scroll moves the print */
  function tape(g, x0, y0, x1, y1, k, scroll, thick) {
    if (k <= 0) return;
    var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), a = Math.atan2(dy, dx), h = thick || 96, len = L * k;
    g.save(); g.translate(x0, y0); g.rotate(a);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(0, -h / 2 + 12, len, h);
    g.beginPath(); g.rect(0, -h / 2, len, h); g.clip();
    var o = ((scroll % 1240) + 1240) % 1240, s = h / 96;
    for (var x = -o * s; x < len; x += 1240 * s) g.drawImage(TX.tape, x, -h / 2, 1240 * s, h);
    g.restore();
  }
  /* chalk outline of a sprawled figure, centred near (0,0), about 760 x 780 at s = 1 */
  var BODYPTS = [[10, -262], [120, -240], [250, -330], [292, -420], [340, -404], [292, -296], [176, -196], [152, -20], [262, 118], [304, 326], [252, 352], [196, 152], [42, 62], [-56, 178], [-112, 338], [-182, 330], [-142, 150], [-146, -20], [-172, -196], [-330, -128], [-372, -36], [-412, -66], [-362, -170], [-204, -252], [-82, -262]];
  function chalk(g, x, y, s, k, rot, lw) {
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.lineJoin = 'round'; g.lineCap = 'round';
    function path(j) {
      g.beginPath(); var n = BODYPTS.length, m = Math.max(2, Math.ceil(n * k));
      for (var i = 0; i <= Math.min(n, m); i++) { var p = BODYPTS[i % n]; g[i ? 'lineTo' : 'moveTo'](p[0] + j * (hash(i * 7) - .5), p[1] + j * (hash(i * 11) - .5)); }
    }
    g.strokeStyle = 'rgba(243,239,230,.35)'; g.lineWidth = (lw || 16) * 1.9; path(10); g.stroke();
    g.strokeStyle = CHALK; g.lineWidth = lw || 16; path(0); g.stroke();
    g.strokeStyle = 'rgba(22,18,27,.45)'; g.lineWidth = 3; g.setLineDash([6, 13]); path(0); g.stroke(); g.setLineDash([]);
    if (k >= 1) {
      g.beginPath(); g.ellipse(-44, -336, 74, 70, -.3, 0, TAU);
      g.strokeStyle = 'rgba(243,239,230,.35)'; g.lineWidth = (lw || 16) * 1.9; g.stroke(); g.strokeStyle = CHALK; g.lineWidth = lw || 16; g.stroke();
    }
    g.restore();
  }
  function pin(g, x, y, col) {
    g.save(); g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.arc(x + 5, y + 8, 15, 0, TAU); g.fill();
    g.fillStyle = col || RED; g.beginPath(); g.arc(x, y, 15, 0, TAU); g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(x - 5, y - 5, 4.5, 0, TAU); g.fill(); g.restore();
  }
  /* sticker text without the outline, fitted to a width */
  function label(g, s, x, y, px, col, maxW, o) {
    var w = K.measure(g, s, px, { wide: false, wt: (o && o.wt) || 900 }), sx = maxW && w > maxW ? maxW / w : 1;
    g.save(); g.translate(x, y); g.scale(sx, 1); K.sticker(g, s, 0, 0, px, Object.assign({ col: col || INK, lw: 0, shadow: false, wide: false }, o || {})); g.restore();
  }
  /* the kit slam, shown from the moment it is back inside the rail (about 1.05x) */
  function slam(g, s, x, y, px, u, o) { if (u < .075) return; K.slam(g, s, x, y, px, u, o); }
  function stamp(g, s, x, y, px, u, col, rot) {
    if (u <= .085) return;
    var sc = lerp(2.3, 1, eo(clamp(u / .16, 0, 1))) - .06 * Math.exp(-u * 8) * Math.sin(u * 30);
    var w = K.measure(g, s, px, { wide: false }) + px * .9, h = px * 1.45;
    g.save(); g.translate(x, y); g.rotate(rot == null ? -.08 : rot); g.scale(sc, sc);
    g.lineWidth = 10; g.strokeStyle = col || PINK; rr(g, -w / 2, -h / 2, w, h, 14); g.stroke();
    K.sticker(g, s, 0, 3, px, { col: col || PINK, ink: INK, wide: false });
    g.restore();
  }

  /* ---------- icons for the evidence tags (flat, hand-built) ---------- */
  function icon(g, type, t) {
    g.save(); g.lineJoin = 'round'; g.lineWidth = 6; g.strokeStyle = INK;
    function box(x, y, w, h, col, r) { rr(g, x, y, w, h, r || 6); g.fillStyle = col; g.fill(); g.stroke(); }
    if (type === 'smg') {
      box(-120, -26, 170, 46, '#3a3d45'); box(50, -14, 80, 18, '#2c2f36', 4); box(-40, 18, 34, 78, '#2c2f36', 4); box(-104, 18, 30, 50, '#3a3d45', 4); box(-176, -18, 60, 26, '#2c2f36', 4);
    } else if (type === 'rifle') {
      g.save(); g.rotate(-.05); box(-200, -18, 80, 40, '#6b4a35', 10); box(-124, -26, 170, 44, '#3a3d45'); box(44, -14, 150, 16, '#2c2f36', 4); box(0, -38, 70, 14, '#2c2f36', 4);
      g.beginPath(); g.moveTo(-40, 18); g.quadraticCurveTo(-30, 80, 0, 92); g.lineTo(26, 80); g.quadraticCurveTo(4, 60, 6, 18); g.closePath(); g.fillStyle = '#2c2f36'; g.fill(); g.stroke(); g.restore();
    } else if (type === 'bag') {
      g.beginPath(); g.moveTo(-70, -30); g.quadraticCurveTo(-60, -90, 0, -90); g.quadraticCurveTo(60, -90, 70, -30); g.lineWidth = 10; g.stroke(); g.lineWidth = 6;
      box(-150, -38, 300, 130, '#2f5d46', 60); g.beginPath(); g.moveTo(-110, -6); g.lineTo(110, -6); g.setLineDash([10, 8]); g.stroke(); g.setLineDash([]);
      box(-24, 22, 48, 30, MANILA, 5);
    } else if (type === 'room') {
      box(-150, -86, 300, 176, '#d9d2c3', 6); box(-110, -60, 90, 150, '#6b4a35', 4); g.fillStyle = INK; g.beginPath(); g.arc(-34, 18, 6, 0, TAU); g.fill();
      box(10, 30, 120, 18, '#c9b48a', 3); box(26, 4, 34, 26, '#2f5d46', 4); box(70, 8, 40, 22, '#2f5d46', 4);
    } else if (type === 'cash') {
      for (var i = 2; i >= 0; i--) box(-130 + i * 12, -40 - i * 18, 240, 100, i ? '#5fae6a' : '#7cc785', 8);
      box(-40, -40, 50, 100, MANILA, 2); label(g, '$', 82, 10, 56, '#1f5a2c');
    } else if (type === 'card') {
      g.save(); g.rotate(-.08); box(-140, -78, 280, 170, '#3b6fd8', 18); g.fillStyle = INK; g.fillRect(-140, -40, 280, 32); box(-110, 14, 52, 40, TAPE, 6); label(g, '? ? ?', 50, 48, 40, CREAM); g.restore();
    } else if (type === 'house') {
      box(-120, -40, 240, 130, '#b8322e', 4); g.beginPath(); g.moveTo(-140, -40); g.lineTo(0, -110); g.lineTo(140, -40); g.closePath(); g.fillStyle = '#5a1f1d'; g.fill(); g.stroke();
      box(-30, 10, 60, 80, CREAM, 3); box(-96, -10, 46, 40, '#16262e', 3); box(50, -10, 46, 40, '#16262e', 3);
    }
    g.restore();
  }
  /* a manila evidence tag: 500 x 300 at s = 1; the label is ≥ 64 px so it stays ≥ 36 px at the board scale .56 */
  var ITEMS = [
    { icon: 'smg', text: 'TYPE 9 SMG', sub: 'ON THE FLOOR' },
    { icon: 'rifle', text: 'ASSAULT RIFLE', sub: 'DUKE 556' },
    { icon: 'bag', text: 'STASH BAG', sub: 'FULL' },
    { icon: 'room', text: 'BACK ROOM', sub: 'MORE BAGS' },
    { icon: 'cash', text: 'CASH $378', sub: 'IN THE SAFE' },
    { icon: 'card', text: 'CARD $6,000', sub: 'HE SAYS' }
  ];
  function tag(g, it, x, y, s, rot, pinned) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.beginPath(); var P = [[-250, -110], [-205, -150], [250, -150], [250, 150], [-205, 150], [-250, 110]];
    g.save(); g.translate(10, 14); g.beginPath(); P.forEach(function (p, i) { g[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }); g.closePath(); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); g.restore();
    g.beginPath(); P.forEach(function (p, i) { g[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }); g.closePath(); g.fillStyle = MANILA; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    g.beginPath(); g.arc(-212, 0, 20, 0, TAU); g.fillStyle = '#c9a868'; g.fill(); g.stroke(); g.beginPath(); g.arc(-212, 0, 9, 0, TAU); g.fillStyle = CORK; g.fill();
    g.strokeStyle = 'rgba(29,18,51,.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-170, 52); g.lineTo(230, 52); g.stroke();
    g.save(); g.translate(30, -50); g.scale(.82, .82); icon(g, it.icon); g.restore();
    label(g, it.text, 30, 102, 66, INK, 420);
    if (pinned) pin(g, 30, -128, RED);
    g.restore();
  }

  /* ---------- board slots: 3 x 2, tags at scale .56 ---------- */
  var SLOT = [[232, 1172], [510, 1172], [788, 1172], [232, 1350], [510, 1350], [788, 1350]], SLOTS = .54;
  function slotRot(i, t) { return (hash(i + 3) - .5) * .06 + .012 * Math.sin(t * 1.7 + i * 1.3); }
  /* where tag i is at time t: big in the hero spot from its entry, flying to its slot at T.pin[i] */
  function tagState(i, t) {
    var e = ENTRY[i]; if (t < e) return null;
    var hp = HERO[i], k = eio(seg(t, T.pin[i], T.pin[i] + .32)), pop = cd(t, e, 13);
    return { x: lerp(hp[0], SLOT[i][0], k), y: lerp(hp[1], SLOT[i][1], k), s: lerp(hp[2] * (.6 + .4 * pop), SLOTS, k), rot: lerp(-.03 + .02 * Math.sin(t * 2.3), slotRot(i, t), k), pinned: k >= 1, hero: k < 1, k: k };
  }
  var ENTRY = [], HERO = [[MID, 850, 1.08], [MID, 850, 1.08], [MID, 850, 1.08], [MID, 850, 1.08], [680, 860, .74], [680, 860, .74]];
  /* mode: 'pinned' = only tags already on the board, 'hero' = only the one in the hero spot, else both */
  function boardTags(g, t, mode) {
    for (var i = 0; i < ITEMS.length; i++) {
      var s = tagState(i, t); if (!s) continue;
      if (mode === 'pinned' && !s.pinned) continue;
      if (mode === 'hero' && s.pinned) continue;
      tag(g, ITEMS[i], s.x, s.y, s.s, s.rot, s.pinned);
      if (s.hero && s.k < .2 && t > ENTRY[i] + .15) {
        g.save(); g.globalAlpha *= 1 - s.k * 5;
        K.chip(g, ITEMS[i].sub, HERO[i][0], HERO[i][1] + 150 * HERO[i][2] + 40, 38, { align: 'center', bg: i === 5 ? PINK : INK, col: CREAM });
        g.restore();
      }
    }
  }

  /* ---------- polaroid exhibits (the clips) ---------- */
  var PX0 = 120, PY0 = 575, PW = 780, PH = 860, PIN = 26, PBOT = 112;
  function photoRect() { return [PX0 + PIN, PY0 + PIN, PW - 2 * PIN, PH - PIN - PBOT]; }
  function polaroid(g, t, u, name, from, bright) {
    var tin = cd(t, u.t0, 20), tout = eio(seg(t, u.t1 - .18, u.t1));
    var dx = (1 - tin) * (from === 'top' ? 0 : 760) - tout * 900, dy = (1 - tin) * (from === 'top' ? -900 : 60) + tout * 80, rot = -.025 + (1 - tin) * .25 - tout * .2;
    g.save(); g.translate(MID + dx, PY0 + PH / 2 + dy); g.rotate(rot); g.translate(-MID, -(PY0 + PH / 2));
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(PX0 + 12, PY0 + 18, PW, PH);
    g.fillStyle = CREAM; g.fillRect(PX0, PY0, PW, PH);
    var r = photoRect();
    g.save(); g.beginPath(); g.rect(r[0], r[1], r[2], r[3]); g.clip();
    if (bright) g.filter = 'brightness(' + bright + ') contrast(1.06)';
    CLIP.draw(g, t, r[0], r[1], r[2], r[3], u);
    g.filter = 'none';
    g.restore();
    g.lineWidth = 3; g.strokeStyle = 'rgba(29,18,51,.35)'; g.strokeRect(r[0], r[1], r[2], r[3]);
    if (name && Math.abs(dx) < 240 && dy > -560) label(g, name, MID, PY0 + PH - PBOT / 2 + 4, 50, INK, PW - 80);
    pin(g, MID, PY0 + 14, RED);
    g.restore();
    return { dx: dx, dy: dy, tin: tin, tout: tout };
  }
  /* annotation helpers that follow the picture */
  function onPhoto(u, t, nx, ny) { var r = photoRect(); return CLIP.toScreen(u, t, nx, ny, r[0], r[1], r[2], r[3]); }
  function ring(g, x, y, rx, ry, k, seed) { K.scribble(g, x, y, rx, ry, k, PINK, 9, seed || 1); }

  /* ---------- backgrounds ---------- */
  function floorBG(g, t) {
    g.drawImage(TX.floor, 0, 0);
    var lx = 520 + 70 * osc(t, 2, .4), ly = 980 + 60 * osc(t, 3, 1.3), gl = g.createRadialGradient(lx, ly, 60, lx, ly, 820);
    gl.addColorStop(0, 'rgba(255,236,200,.16)'); gl.addColorStop(.6, 'rgba(255,220,180,.05)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
  }
  function boardBG(g, t) {
    g.save(); g.translate(4 * osc(t, 5, .2), 4 * osc(t, 7, 1)); g.drawImage(TX.cork, -10, -10, W + 20, H + 20); g.restore();
    var lx = 510 + 120 * osc(t, 3, 2), ly = 900 + 80 * osc(t, 4, .5), gl = g.createRadialGradient(lx, ly, 80, lx, ly, 900);
    gl.addColorStop(0, 'rgba(255,214,150,.13)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
  }

  /* ---------- the hook (also the loop's last second) ---------- */
  /* tape sweep: already 60 % across on frame 0; the end replays the same sweep against DUR so the seam is exact */
  function hookTapeK(t) { return eo(seg(t, -.35, .4)); }
  function hookWords(g, t, u, ui, gap) {
    /* u: seconds since the words landed (large on frame 0); ui: seconds since they started leaving (<0 = staying) */
    var out = ui > 0 ? eio(seg(ui, 0, .2)) : 0;
    if (out >= 1) return;
    var pd = t >= T.dead ? 1 + .1 * Math.exp(-(t - T.dead) * 6) * Math.sin((t - T.dead) * 28) : 1;
    var lines = [['EVERYONE’S', 712, 118, CREAM, -.04], ['ALREADY', 837, 118, CREAM, -.04], ['DEAD.', 997, 190, RED, -.06]];
    lines.forEach(function (L, i) {
      var uu = u - i * (gap || .12); if (uu < .075) return;
      var k = eo(clamp(uu / .14, 0, 1)), sc = lerp(2.4, 1, k) * (1 - out) * (i === 2 ? pd : 1);
      var w = K.measure(g, L[0], L[2], { wide: false }), fit = Math.min(1, 800 / w);
      g.save(); g.translate(MID + osc(t, 30, i) * 4, L[1] + osc(t, 22, i * 2) * 3); g.rotate(L[4] + osc(t, 17, i) * .01); g.scale(sc * fit, sc * fit);
      K.sticker(g, L[0], 0, 0, L[2], { col: L[3], wide: false, lw: L[2] * .14 });
      g.restore();
    });
  }
  function marker(g, n, x, y, u) {
    var k = cd(u, 0, 15); if (k <= 0) return;
    g.save(); g.translate(x, y + (1 - k) * -60); g.scale(k, k);
    g.beginPath(); g.moveTo(-46, 44); g.lineTo(-30, -44); g.lineTo(30, -44); g.lineTo(46, 44); g.closePath(); g.fillStyle = TAPE; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    label(g, n, 0, 6, 62, INK); g.restore();
  }
  function beatHook(g, t) {
    floorBG(g, t);
    chalk(g, 528, 1000, 1.0, 1, .04);
    marker(g, '1', 196, 1300, t - .22);
    marker(g, '2', 846, 1235, t - .5);
    tape(g, -60, 640, 1140, 570, hookTapeK(t), t * 260 + 300);
    hookWords(g, t, t + 1, T.wipe1 - .15 < t ? t - (T.wipe1 - .15) : -1);
    /* the payoff by 1.9 s: the place, and why it matters */
    var hk = cd(t, T.stash - .3, 16);
    if (hk > 0) {
      var sw = Math.sin((t - T.stash) * 5) * .08 * Math.exp(-(t - T.stash) * 1.5);
      g.save(); g.translate(MID, 1215); g.rotate(sw); g.scale(hk, hk);
      tag(g, { icon: 'house', text: 'STASH HOUSE' }, 0, 0, .62, -.03, true); g.restore();
    }
    if (t > T.stash - .25) { var ck = cd(t, T.stash - .25, 18); g.save(); g.translate(MID, 1385); g.scale(ck, ck); K.chip(g, 'JUST LOOT', 0, 0, 44, { align: 'center', bg: PINK, col: CREAM }); g.restore(); }
  }

  /* ---------- where: our map sketch on the board ---------- */
  function beatWhere(g, t, under) {
    if (!under) boardBG(g, t);
    var k = cd(t, T.wipe1 - .05, 14), y = lerp(1500, 0, k);
    function inF(yy) { return yy + y < 1405; }
    g.save(); g.translate(0, y); g.translate(MID, 930); g.rotate(-.02 + .006 * Math.sin(t * 1.4)); g.translate(-MID, -930);
    var x0 = 140, y0 = 600, w = 740, h = 640;
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(x0 + 12, y0 + 16, w, h);
    g.fillStyle = '#7fd3d0'; g.fillRect(x0, y0, w, h);
    /* land */
    g.fillStyle = '#efe0b8'; g.beginPath(); g.moveTo(x0, y0 + 90); g.lineTo(x0 + 520, y0 + 90); g.quadraticCurveTo(x0 + 610, y0 + 210, x0 + 560, y0 + 330); g.quadraticCurveTo(x0 + 640, y0 + 470, x0 + 520, y0 + h); g.lineTo(x0, y0 + h); g.closePath(); g.fill();
    g.fillStyle = '#b9d98f'; g.beginPath(); g.ellipse(x0 + 190, y0 + 300, 150, 110, .3, 0, TAU); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 12; g.beginPath(); g.moveTo(x0 + 20, y0 + 560); g.quadraticCurveTo(x0 + 260, y0 + 470, x0 + 400, y0 + 260); g.stroke();
    g.lineWidth = 6; g.strokeStyle = INK; g.strokeRect(x0, y0, w, h);
    g.fillStyle = INK; g.fillRect(x0, y0, w, 86);
    if (inF(y0 + 70)) label(g, 'SOUTH VICE-DALE', MID, y0 + 46, 44, CREAM, w - 60);
    /* red building + pin */
    var bx = x0 + 410, by = y0 + 250;
    g.save(); g.translate(bx, by); g.scale(.42, .42); icon(g, 'house'); g.restore();
    var pk = seg(t, T.close - .25, T.close + .05), py = by - 80 - (1 - eo(pk)) * 420;
    if (pk > 0) { g.save(); g.translate(bx, py); g.fillStyle = PINK; g.beginPath(); g.arc(0, -40, 34, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-26, -20); g.lineTo(0, 30); g.lineTo(26, -20); g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.arc(0, -40, 34, 0, TAU); g.stroke(); g.fillStyle = CREAM; g.beginPath(); g.arc(0, -40, 12, 0, TAU); g.fill(); g.restore(); }
    /* start star, dashed path to the building */
    var sx = x0 + 230, sy = y0 + 470, sk = 1;
    if (inF(by + 90)) tag(g, { icon: 'house', text: 'STASH HOUSE' }, bx + 190, by + 10, .56, .04, true);
    if (sk > 0) {
      if (t > T.gameW) { g.save(); g.setLineDash([16, 14]); g.lineWidth = 8; g.strokeStyle = INK; g.lineDashOffset = -t * 60; g.beginPath(); g.moveTo(sx, sy); var dk = eio(seg(t, T.gameW, T.starts + .3)); g.lineTo(lerp(sx, bx, dk), lerp(sy, by + 40, dk)); g.stroke(); g.restore(); }
      g.save(); g.translate(sx, sy); g.scale(sk, sk); g.rotate(t * .6); g.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r2 = i % 2 ? 22 : 50; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r2, Math.sin(a) * r2); } g.closePath(); g.fillStyle = TAPE; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore();
      if (inF(sy + 130)) K.chip(g, 'START', sx, sy + 92, 38, { align: 'center', bg: INK, col: TAPE });
    }
    if (inF(y0 + h - 4)) K.chip(g, 'OUR SKETCH', x0 + w - 24, y0 + h - 44, 36, { align: 'right', bg: CREAM, col: INK });
    pin(g, MID, y0 + 10, TEAL);
    g.restore();
    if (t > T.wipe1 + .15) slam(g, 'NEAR THE START', MID, 1345, 80, t - (T.wipe1 + .15), { col: TAPE, wide: false, rot: -.03 });
  }

  /* ---------- exhibits ---------- */
  function beatDoor(g, t) {
    boardBG(g, t);
    if (t < T.door0 + .4) beatWhere(g, t, true);
    polaroid(g, t, U.door, '', 'right');
    breakChip(g, t);
    var u = t - T.prompt;
    if (u > 0 && t < T.door1 - .2) {
      var p = onPhoto(U.door, t, .52, .47);
      ring(g, p[0], p[1], 150, 62, eio(seg(u, 0, .35)), 3);
    }
  }
  /* a pink note chip at the top of the board that outlasts its exhibit a little */
  function topChip(g, t, s, a, b) { if (t < a || t > b) return; var ck = cd(t, a, 16) * (1 - eio(seg(t, b - .15, b))); g.save(); g.translate(MID, 600); g.scale(ck, ck); K.chip(g, s, 0, 0, 44, { align: 'center', bg: PINK, col: CREAM }); g.restore(); }
  function breakChip(g, t) { topChip(g, t, 'BREAK OPEN', T.door0 + .25, T.door1 + .72); }
  function beatDown(g, t) {
    boardBG(g, t);
    var k = cd(t, T.door1 - .05, 12);
    g.save(); g.translate(MID, lerp(1700, 905, k)); g.rotate(.03 + .01 * Math.sin(t * 2));
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(-340 + 12, -330 + 16, 680, 660);
    g.fillStyle = CREAM; g.fillRect(-340, -330, 680, 660); g.fillStyle = FLOOR; g.fillRect(-310, -300, 620, 520);
    chalk(g, 10, -40, .5, 1, .1, 22);
    pin(g, 0, -316, RED);
    g.restore();
    breakChip(g, t);
  }
  /* where the body on the floor is in the garage shot, keyed from the cut (frames 51 / 60 / 75) */
  function bodyAt(t) { var f = 51 + (t - T.bod0) * 30 * U.bod.speed; return f < 60 ? [lerp(.5, .46, (f - 51) / 9), .41] : [lerp(.46, .36, clamp((f - 60) / 15, 0, 1)), lerp(.41, .38, clamp((f - 60) / 15, 0, 1))]; }
  function beatBodies(g, t) {
    boardBG(g, t);
    polaroid(g, t, U.bod, '', 'top', 1.55);
    breakChip(g, t);
    var rk = eio(seg(t, T.bod0 + .3, T.bod0 + .65));
    if (rk > 0 && t < T.bod1 - .15) { var b = bodyAt(t), p = onPhoto(U.bod, t, b[0], b[1]); ring(g, p[0], p[1], 120, 66, rk, 5); }
    var tin = cd(t, T.bod0, 20);
    if (t < T.bod1 - .12 && tin > .97) stamp(g, 'ALREADY DOWN', MID, PY0 + PH - PBOT / 2 + 2, 58, t - Math.max(T.down, T.bod0 + .25), PINK, -.03);
  }
  /* after exhibit B: the three facts as stamps on the empty board, cleared before the first tag */
  function boardStamps(g, t) {
    var out = eio(seg(t, T.stampsOut, T.stampsOut + .2)); if (out >= 1) return;
    g.save(); g.translate(MID, 860); g.scale(1 - out, 1 - out); g.translate(-MID, -860);
    stamp(g, 'ALREADY DOWN', MID, lerp(PY0 + PH - PBOT / 2 + 2, 680, eio(seg(t, T.bod1, T.bod1 + .25))), lerp(58, 70, eio(seg(t, T.bod1, T.bod1 + .25))), 1, PINK, -.03);
    stamp(g, 'NO FIGHT', MID, 850, 104, t - (start('nofight') - .15), PINK, -.07);
    slam(g, 'JUST LOOT', MID, 1030, 100, t - T.loot, { col: TAPE, wide: false, rot: .03 });
    g.restore();
  }
  /* the wrapped bricks on the table, keyed from the cut every 0.5 s (frames 1 / 16 / 31 / 46 / 63) */
  var BRICK = [[0, .33, .5], [.5, .5, .45], [1, .5, .42], [1.5, .57, .41], [2.1, .62, .3]];
  function brickAt(t) { var s2 = t - T.tab0; for (var i = 1; i < BRICK.length; i++) if (s2 <= BRICK[i][0]) { var k = (s2 - BRICK[i - 1][0]) / (BRICK[i][0] - BRICK[i - 1][0]); return [lerp(BRICK[i - 1][1], BRICK[i][1], k), lerp(BRICK[i - 1][2], BRICK[i][2], k)]; } return [BRICK[4][1], BRICK[4][2]]; }
  function beatTable(g, t) {
    boardTags(g, t, 'pinned');
    polaroid(g, t, U.tab, '', 'right');
    topChip(g, t, 'MORE TO BAG', T.tab0 + .25, T.tab1 + .55);
    if (t > T.tab0 + .35 && t < T.tab1 - .15) { var bk = brickAt(t), p = onPhoto(U.tab, t, bk[0], bk[1]); ring(g, p[0], p[1], 150, 90, eio(seg(t, T.tab0 + .35, T.tab0 + .75)), 7); }
  }

  /* ---------- the board beats: tags, safe, total ---------- */
  function safe(g, t, x, y, s) {
    var open = eio(seg(t, T.safeOpen - .05, T.safeOpen + .4));
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(-190, -180, 400, 400);
    rr(g, -200, -200, 400, 400, 22); g.fillStyle = STEEL; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    rr(g, -160, -160, 320, 320, 12); g.fillStyle = '#1a1620'; g.fill(); g.stroke();
    /* contents (visible once open, leave as they fly) */
    if (open > .3 && t < T.cash + .05) { g.save(); g.translate(-40, 70); g.scale(.55, .55); icon(g, 'cash'); g.restore(); }
    if (open > .3 && t < T.card + .05) { g.save(); g.translate(60, -40); g.scale(.45, .45); icon(g, 'card'); g.restore(); }
    /* the door swings on its left hinge */
    var dw = 320 * Math.cos(open * 1.35);
    if (dw > 4) {
      g.save(); g.translate(-160, 0);
      rr(g, 0, -160, dw, 320, 12); g.fillStyle = '#95a0ad'; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
      var cx = dw / 2;
      g.beginPath(); g.ellipse(cx, -20, 70 * dw / 320, 70, 0, 0, TAU); g.fillStyle = '#d7dde4'; g.fill(); g.stroke();
      for (var i = 0; i < 12; i++) { var a = i / 12 * TAU + t * 1.6; g.beginPath(); g.moveTo(cx + Math.cos(a) * 50 * dw / 320, -20 + Math.sin(a) * 50); g.lineTo(cx + Math.cos(a) * 64 * dw / 320, -20 + Math.sin(a) * 64); g.lineWidth = 4; g.stroke(); }
      g.lineWidth = 12; g.beginPath(); g.moveTo(cx, 70); g.lineTo(cx + 60 * dw / 320 * Math.cos(t * 1.6), 70 + 60 * Math.sin(t * 1.6) * .3); g.stroke();
      g.restore();
    } else {
      g.save(); g.translate(-160, 0); g.fillStyle = '#95a0ad'; g.fillRect(-60 * open, -160, 60 * open, 320); g.lineWidth = 8; g.strokeStyle = INK; g.strokeRect(-60 * open, -160, 60 * open, 320); g.restore();
    }
    g.restore();
  }
  /* the empty board: six dashed slots that the tags fill, and its header */
  function slots(g, t) {
    var k = cd(t, T.guns - .05, 12); if (k <= 0) return;
    g.save(); g.globalAlpha *= k; g.setLineDash([14, 12]); g.lineDashOffset = -t * 20; g.lineWidth = 4; g.strokeStyle = 'rgba(234,208,154,.55)';
    SLOT.forEach(function (p) { rr(g, p[0] - 135, p[1] - 81, 270, 162, 10); g.stroke(); });
    g.setLineDash([]); g.restore();
  }
  function beatGuns(g, t) {
    boardBG(g, t); slots(g, t);
    boardTags(g, t);
    boardStamps(g, t);
  }
  function beatSafe(g, t) {
    boardBG(g, t); slots(g, t);
    topChip(g, t, 'MORE TO BAG', T.tab0 + .25, T.tab1 + .55);
    boardTags(g, t, 'pinned');
    var gone = eio(seg(t, T.six + .55, T.six + .85));
    var k = cd(t, T.safe0, 12), s = lerp(.7, 1, k) * (1 - gone), mv = eio(seg(t, T.safeOpen + .1, T.cash));
    if (s > .01) safe(g, t, lerp(MID, 315, mv), lerp(1500, 860, k) - gone * 100, s * lerp(.95, .66, mv));
    boardTags(g, t, 'hero');
  }
  function yarn(g, t) {
    var k = seg(t, T.roll1 - .05, T.roll1 + .6); if (k <= 0) return;
    g.save(); g.strokeStyle = RED; g.lineWidth = 5; g.lineCap = 'round';
    for (var i = 0; i < 6; i++) {
      var kk = eio(clamp(k * 1.6 - i * .12, 0, 1)); if (kk <= 0) continue;
      var sx = SLOT[i][0] + 30 * SLOTS, sy = SLOT[i][1] - 128 * SLOTS, ex = MID + (i % 3 - 1) * 90, ey = 870;
      var mx = lerp(sx, ex, .5), my = lerp(sy, ey, .5) + 30 + 6 * Math.sin(t * 2 + i);
      g.beginPath(); g.moveTo(sx, sy);
      var px = lerp(sx, ex, kk), py = lerp(sy, ey, kk);
      g.quadraticCurveTo(lerp(sx, mx, kk), lerp(sy, my, kk), px, py); g.stroke();
    }
    g.restore();
  }
  function beatTotal(g, t) {
    boardBG(g, t); slots(g, t);
    yarn(g, t);
    boardTags(g, t);
    var lk = cd(t, T.tot0, 12);
    if (lk > 0) { g.save(); g.translate(MID, lerp(560, 680, lk)); g.globalAlpha *= lk; label(g, 'HIS TOTAL', 0, 0, 64, CREAM, 700, { lw: 9, shadow: true }); g.restore(); }
    if (t > T.roll0 - .05) {
      var dur = T.roll1 - T.roll0;
      K.counter(g, 0, 17200, MID, 815, 158, t - T.roll0, dur, { pre: '$', col: TAPE, wide: false });
    } else if (lk > 0) {
      label(g, '$?', MID, 815, 158, TAPE, 600, { lw: 20, shadow: true });
    }
    if (t > T.roll1 + .02) { var ck = cd(t, T.roll1 + .02, 14); g.save(); g.translate(MID, 950); g.scale(ck, ck); K.chip(g, 'HE SAYS', 0, 0, 40, { align: 'center', bg: PINK, col: CREAM }); g.restore(); }
    stamp(g, 'NO KILLS', MID, 1046, 62, t - (T.without - .3), CREAM, .04);
  }

  /* ---------- end: back on the floor; the question, then the hook rebuilds ---------- */
  function beatEnd(g, t) {
    floorBG(g, t);
    chalk(g, 528, 1000, 1.0, 1, .04);
    var leave = eio(seg(t, T.back - .05, T.back + .2));
    var qk = cd(t, T.who - .05, 11);
    if (qk > 0 && leave < 1) {
      g.save(); g.translate(MID, 880 + 10 * Math.sin(t * 2.4)); g.rotate(.08 * Math.sin(t * 1.8)); var s = qk * (1 - leave); g.scale(s, s);
      K.sticker(g, '?', 0, 0, 440, { col: PINK, lw: 34 }); g.restore();
    }
    var ck = cd(t, T.wipe2 + .02, 16);
    if (ck > 0 && leave < 1) {
      g.save(); var cy = lerp(1500, 1260, ck) + leave * 300; g.translate(MID, cy); g.rotate(-.025);
      g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, -380 + 10, -120 + 14, 760, 240, 26); g.fill();
      rr(g, -380, -120, 760, 240, 26); g.fillStyle = CREAM; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
      if (cy < 1335) { label(g, 'WHO HIT IT', 0, -46, 84, INK, 680); label(g, 'FIRST?', 0, 50, 92, PINK, 680); }
      g.restore();
    }
    /* the loop: the same tape sweep and words as frame 0, timed against DUR */
    tape(g, -60, 640, 1140, 570, hookTapeK(t - DUR), (t - DUR) * 260 + 300);
    if (t > T.back) hookWords(g, t, t - (T.back + .05), -1, .06);
  }

  /* tape wipe across a cut at tc: a wide band sweeps from the bottom-left */
  function wipe(g, t, tc) {
    var k = seg(t, tc - .28, tc + .28); if (k <= 0 || k >= 1) return;
    var y = lerp(2300, -500, eio(k));
    tape(g, -200, y + 260, 1280, y - 260, 1, t * 900, 420);
  }

  /* ---------- frame ---------- */
  var ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    if (t < T.wipe1) beatHook(g, t);
    else if (t < T.door0) beatWhere(g, t);
    else if (t < T.door1) beatDoor(g, t);
    else if (t < T.bod0) beatDown(g, t);
    else if (t < T.bod1) beatBodies(g, t);
    else if (t < T.tab0) beatGuns(g, t);
    else if (t < T.tab1) { boardBG(g, t); slots(g, t); beatTable(g, t); }
    else if (t < T.tot0) beatSafe(g, t);
    else if (t < T.wipe2) beatTotal(g, t);
    else beatEnd(g, t);
    wipe(g, t, T.wipe1); wipe(g, t, T.wipe2);
    K.chip(g, 'GTA 6', X0, 200, 44, { bg: PINK, col: CREAM });
    if (LIVE.text) captions(g, t);
    if (LIVE.grain && TX.noise) { g.save(); g.globalAlpha = .045; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(TX.noise, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.restore(); }
  }
  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { frame(ctx, t); return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) { frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR)); actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0); }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- safe-area check: every glyph inside x 90-930, above y 1450 ---------- */
  var BOUNDS = null, CURT = 0;
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS && this.globalAlpha > .05) {
        var mm = this.measureText(str), m = this.getTransform(), xs = [], ys = [];
        [[x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent], [x + mm.actualBoundingBoxRight, y - mm.actualBoundingBoxAscent], [x - mm.actualBoundingBoxLeft, y + mm.actualBoundingBoxDescent], [x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
        var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys), d = Math.min.apply(null, ys);
        var onScreen = b > 0 && a < W && c > 0 && d < H;
        if (onScreen && (a < 89.5 || b > 930.5 || c > 1450.5)) BOUNDS.push({ t: CURT, text: str, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
      }
      return orig.apply(this, arguments);
    };
  }

  /* ---------- readcheck ---------- */
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('pill', 'GTA 6', 0, DUR + 1);
    Tx('hook', 'EVERYONE’S ALREADY DEAD.', 0, T.wipe1 - .15); Tx('hook', 'EVERYONE’S ALREADY DEAD.', T.back + .3, DUR + 1);
    Tx('stash', 'STASH HOUSE', T.stash + .1, T.wipe1); Tx('stash', 'STASH HOUSE', T.wipe1 + .3, T.door0 + .1);
    Tx('loot', 'JUST LOOT', T.stash, T.wipe1); Tx('loot', 'JUST LOOT', T.loot + .15, T.stampsOut);
    Tx('county', 'SOUTH VICE-DALE', T.wipe1 + .22, T.door0 + .2);
    Tx('start', 'START', T.wipe1 + .35, T.door0 + .1);
    Tx('near', 'NEAR THE START', T.wipe1 + .25, T.door0 + .2);
    Tx('break', 'BREAK OPEN', T.door0 + .35, T.door1 + .58);
    Tx('down', 'ALREADY DOWN', Math.max(T.down, T.bod0 + .25) + .1, T.stampsOut);
    Tx('nofight', 'NO FIGHT', start('nofight') - .06, T.stampsOut);
    ITEMS.forEach(function (it, i) { Tx('tag' + i, it.text, ENTRY[i] + .15, T.wipe2); });
    Tx('more', 'MORE TO BAG', T.tab0 + .35, T.tab1 + .42);
    Tx('his', 'HIS TOTAL', T.tot0 + .2, T.wipe2);
    Tx('total', '$17,200', T.roll1, T.wipe2);
    Tx('says', 'HE SAYS', T.roll1 + .1, T.wipe2);
    Tx('shots', 'NO KILLS', T.without - .2, T.wipe2);
    Tx('q', 'WHO HIT IT FIRST?', T.wipe2 + .2, T.back - .05);
    return o;
  }

  function SCORE(ac) { K.score(ac, EV, DUR); }
  function init(canvas) {
    canvas.width = W; canvas.height = H; ctx = canvas.getContext('2d');
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    watch(ctx); watch(tctx);
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 84px Archivo', '600 30px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0’·$?'); }))).then(function () { return document.fonts.ready; }).then(function () {
      buildTextures(); buildChunks(); initTimes();
      ENTRY = [T.items[0] - .05, T.items[1] - .05, T.items[2] - .05, T.tab1 - .36, T.cash - .02, T.card + .02];
      /* the card's tag stays in the hero spot until its price is said, then pins */
      window.FILM.POSTER = T.roll1 + 1.2;
      window.FILM.SHOTS = [{ id: 'hook', name: 'Already dead', t0: 0, t1: T.door0 }, { id: 'ex', name: 'Exhibits', t0: T.door0, t1: T.safe0 }, { id: 'safe', name: 'The safe', t0: T.safe0, t1: T.tot0 }, { id: 'total', name: 'His total', t0: T.tot0, t1: T.wipe2 }, { id: 'end', name: 'Who?', t0: T.wipe2, t1: DUR }];
      window.READY = true;
    });
  }

  window.FILM = { W: W, H: H, DUR: DUR, POSTER: 10, SLUG: 'gta-stashhouse', SHOTS: [], LIVE: LIVE, init: init, render: render, frame: frame, T: T };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
