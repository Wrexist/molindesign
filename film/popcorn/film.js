/* "Pop" — how popcorn pops. A vertical TikTok explainer written in code, narrated first and cut to the voice.
   Every visual beat is keyed to a word time from vo/vo.js (window.VO, written by tools/voiceover.py), so picture,
   captions and voice can't drift. Pure function of t like ../film.js. Contract: window.FILM, DUR, render(t), READY,
   EV, TEXTS(t), SCORE(ctx). */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur;
  var BG = '#f6efe2', INK = '#231c15', RED = '#d7262e', HULL = '#e29a35', HULL2 = '#b8661b', STARCH = '#fff4dc', WATER = '#3d9be0', HEAT = '#ec4b26';
  var KX = 540, KY = 1130, KS = 250;                  // the kernel: centre and half-height in px

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function ss(k) { return k * k * (3 - 2 * k); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  /* in for [a, b), springing in at a and easing out over `o` s at b */
  function win(t, a, b, o) { return t < a || t > b + (o || .3) ? 0 : clamp(spring(t - a, 2.2, .78), 0, 1.2) * (1 - eio(seg(t, b, b + (o || .3)))); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function at(id, word) {                              // when a word starts; `word` is its text or its index
    var l = LINE[id]; if (typeof word === 'number') return l.words[word].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word)) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }
  var T = {
    hookPop: at('hook', 'explodes'), rew0: end('hook') + .02, rew1: start('cooker') - .02,
    gauge: at('cooker', 'pressure'),
    cut: start('water') - .1, drops: at('water', 'water'), pct: at('water', '14%'),
    heat: at('steam', 'heat'), boil: at('steam', 'steam'),
    tough: at('trap', 'tough'), trapped: at('trap', 'trapped'),
    climb: at('press', 'climbs'), nine: at('press', 'nine'),
    hot: at('give', '180'), gives: at('give', 'gives'),
    pop: end('give') + .12, burst: start('puff'), forty: at('puff', '40'),
    hear: at('sound', 'pop'), notShell: at('sound', 'shell'), escaping: at('sound', 'steam'),
    dud: start('duds'), leaked: at('duds', 'leaked'),
    bowl: start('loop'), tiny: at('loop', 'tiny'), home: end('loop') + .1
  };
  var SHOTS = [
    { id: 'hook', name: 'It explodes', t0: 0, t1: start('cooker') },
    { id: 'cooker', name: 'Pressure cooker', t0: start('cooker'), t1: T.cut },
    { id: 'water', name: 'Water', t0: T.cut, t1: start('steam') },
    { id: 'steam', name: 'Steam', t0: start('steam'), t1: start('press') },
    { id: 'press', name: 'Pressure', t0: start('press'), t1: T.pop },
    { id: 'pop', name: 'Pop', t0: T.pop, t1: start('sound') },
    { id: 'sound', name: 'The sound', t0: start('sound'), t1: T.dud },
    { id: 'duds', name: 'Duds', t0: T.dud, t1: T.bowl },
    { id: 'bowl', name: 'A bowl', t0: T.bowl, t1: DUR }
  ];


  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var S0 = 300;                                        // sprites are drawn once at this unit size, then scaled

  /* ---------- the real kernel: shapes in unit space (y down, tip at the bottom) ---------- */
  function kernelPath(g, s, dx, dy) {
    dx = dx || 0; dy = dy || 0;
    g.beginPath(); g.moveTo(dx, dy - s);
    g.bezierCurveTo(dx + .52 * s, dy - 1.0 * s, dx + .84 * s, dy - .76 * s, dx + .8 * s, dy - .3 * s);
    g.bezierCurveTo(dx + .77 * s, dy + .14 * s, dx + .5 * s, dy + .62 * s, dx + .2 * s, dy + .93 * s);
    g.bezierCurveTo(dx + .12 * s, dy + 1.01 * s, dx + .06 * s, dy + 1.06 * s, dx, dy + 1.07 * s);
    g.bezierCurveTo(dx - .06 * s, dy + 1.06 * s, dx - .12 * s, dy + 1.01 * s, dx - .2 * s, dy + .93 * s);
    g.bezierCurveTo(dx - .5 * s, dy + .62 * s, dx - .77 * s, dy + .14 * s, dx - .8 * s, dy - .3 * s);
    g.bezierCurveTo(dx - .84 * s, dy - .76 * s, dx - .52 * s, dy - 1.0 * s, dx, dy - s); g.closePath();
  }
  /* the germ: the pale teardrop on the kernel's face, and the embryo inside it in section */
  function germPath(g, s, x0, w, y0, y1) {
    g.beginPath(); g.moveTo(x0, y0 * s);
    g.bezierCurveTo(x0 + w * s, (y0 + .04) * s, x0 + w * 1.1 * s, (y0 + (y1 - y0) * .55) * s, x0 + .05 * s, y1 * s);
    g.quadraticCurveTo(x0, (y1 + .03) * s, x0 - .05 * s, y1 * s);
    g.bezierCurveTo(x0 - w * 1.1 * s, (y0 + (y1 - y0) * .55) * s, x0 - w * s, (y0 + .04) * s, x0, y0 * s); g.closePath();
  }
  function tipCap(g, s) {
    var tg = g.createLinearGradient(0, .9 * s, 0, 1.1 * s); tg.addColorStop(0, '#7a4317'); tg.addColorStop(1, '#3b1c08');
    g.beginPath(); g.ellipse(0, 1.0 * s, .12 * s, .085 * s, 0, 0, 6.283); g.fillStyle = tg; g.fill();
    g.beginPath(); g.ellipse(-.03 * s, .975 * s, .05 * s, .025 * s, -.3, 0, 6.283); g.fillStyle = 'rgba(255,200,140,.25)'; g.fill();
  }
  function sprite(w, h, ox, oy) { var c = mk(w, h); return { c: c, g: c.getContext('2d'), ox: ox, oy: oy }; }
  function drawSpr(g, sp, x, y, s) { var k = s / S0; g.drawImage(sp.c, x - sp.ox * k, y - sp.oy * k, sp.c.width * k, sp.c.height * k); }

  var SPR = {};
  function buildKernel() {
    var s = S0, sp = sprite(Math.ceil(1.9 * s), Math.ceil(2.3 * s), .95 * s, 1.08 * s), g = sp.g, r = mulberry(31), i;
    g.translate(sp.ox, sp.oy);
    g.save(); kernelPath(g, s); g.clip();
    var lg = g.createLinearGradient(0, -s, 0, 1.1 * s);
    lg.addColorStop(0, '#fad36a'); lg.addColorStop(.4, '#f3b13c'); lg.addColorStop(.8, '#dd862c'); lg.addColorStop(1, '#a9561a');
    g.fillStyle = lg; g.fillRect(-s, -1.1 * s, 2 * s, 2.3 * s);
    /* round body: falloff to both edges, a touch warmer on the shadow side */
    var sg = g.createLinearGradient(-.85 * s, 0, .85 * s, 0);
    sg.addColorStop(0, 'rgba(150,62,8,.42)'); sg.addColorStop(.2, 'rgba(150,62,8,0)'); sg.addColorStop(.62, 'rgba(150,62,8,0)'); sg.addColorStop(1, 'rgba(120,40,4,.62)');
    g.fillStyle = sg; g.fillRect(-s, -1.1 * s, 2 * s, 2.3 * s);
    var cg = g.createRadialGradient(0, -1.05 * s, .1 * s, 0, -1.05 * s, .55 * s);
    cg.addColorStop(0, 'rgba(255,236,170,.5)'); cg.addColorStop(1, 'rgba(255,236,170,0)'); g.fillStyle = cg; g.fillRect(-s, -1.1 * s, 2 * s, s);
    /* the germ on the face */
    g.save(); g.filter = 'blur(5px)'; germPath(g, s, .02 * s, .25, .02, .9); g.fillStyle = 'rgba(253,233,168,.78)'; g.fill(); g.restore();
    germPath(g, s, .02 * s, .25, .02, .9); g.strokeStyle = 'rgba(178,98,26,.32)'; g.lineWidth = 3; g.stroke();
    g.save(); g.filter = 'blur(3px)'; germPath(g, s, .03 * s, .12, .3, .82); g.fillStyle = 'rgba(255,245,205,.45)'; g.fill(); g.restore();
    /* pericarp grain: fine streaks from crown to tip */
    for (i = 0; i < 90; i++) {
      var x = (r() * 2 - 1) * .82 * s;
      g.beginPath(); g.moveTo(x, -1.02 * s); g.bezierCurveTo(x * 1.06, -.3 * s, x * .7, .45 * s, x * .14, 1.05 * s);
      g.strokeStyle = r() < .5 ? 'rgba(255,240,200,.07)' : 'rgba(130,55,8,.08)'; g.lineWidth = .6 + r() * 2.4; g.stroke();
    }
    for (i = 0; i < 1600; i++) { g.fillStyle = r() < .5 ? 'rgba(110,45,5,.07)' : 'rgba(255,245,215,.08)'; g.fillRect((r() * 2 - 1) * s, (r() * 2.2 - 1.1) * s, 1 + r() * 2, 1 + r() * 2); }
    /* gloss: a long soft specular, a sharp glint, a warm rim on the shadow side */
    g.save(); g.filter = 'blur(12px)'; g.translate(-.38 * s, -.42 * s); g.rotate(-.32); g.beginPath(); g.ellipse(0, 0, .12 * s, .4 * s, 0, 0, 6.283); g.fillStyle = 'rgba(255,255,246,.62)'; g.fill(); g.restore();
    g.save(); g.filter = 'blur(2px)'; g.translate(-.44 * s, -.64 * s); g.rotate(-.55); g.beginPath(); g.ellipse(0, 0, .045 * s, .12 * s, 0, 0, 6.283); g.fillStyle = 'rgba(255,255,255,.92)'; g.fill(); g.restore();
    g.save(); g.filter = 'blur(9px)'; kernelPath(g, s, .09 * s, -.02 * s); g.lineWidth = .06 * s; g.strokeStyle = 'rgba(255,214,140,.32)'; g.stroke(); g.restore();
    g.save(); g.filter = 'blur(14px)'; g.beginPath(); g.ellipse(0, 1.1 * s, .5 * s, .25 * s, 0, 0, 6.283); g.fillStyle = 'rgba(90,35,5,.45)'; g.fill(); g.restore();
    g.restore();
    tipCap(g, s);
    kernelPath(g, s); g.strokeStyle = 'rgba(110,48,8,.5)'; g.lineWidth = 2.5; g.stroke();
    SPR.kernel = sp;
  }
  /* the kernel cut along its long axis: pericarp, hard (glassy) starch, soft starch, germ, tip cap */
  function buildSection() {
    var s = S0, sp = sprite(Math.ceil(1.9 * s), Math.ceil(2.3 * s), .95 * s, 1.08 * s), g = sp.g, r = mulberry(17), i, x, y;
    g.translate(sp.ox, sp.oy);
    g.save(); kernelPath(g, s); g.clip();
    var pg = g.createLinearGradient(0, -s, 0, s); pg.addColorStop(0, '#e39a3a'); pg.addColorStop(1, '#b8601c');
    g.fillStyle = pg; g.fillRect(-s, -1.1 * s, 2 * s, 2.3 * s);
    for (i = 0; i < 6; i++) { kernelPath(g, s * (1 - i * .011)); g.strokeStyle = i % 2 ? 'rgba(255,215,150,.22)' : 'rgba(120,50,8,.25)'; g.lineWidth = 1.5; g.stroke(); }
    /* hard endosperm: glassy amber, packed polygonal cells */
    g.save(); kernelPath(g, s * .935); g.clip();
    var hg = g.createRadialGradient(-.1 * s, -.3 * s, .1 * s, 0, 0, 1.05 * s); hg.addColorStop(0, '#f8d27a'); hg.addColorStop(1, '#e8a447');
    g.fillStyle = hg; g.fillRect(-s, -1.1 * s, 2 * s, 2.3 * s);
    for (y = -1.05 * s; y < 1.1 * s; y += 15) for (x = -s; x < s; x += 17) {
      var jx = x + ((y / 15 | 0) % 2) * 8.5 + (r() - .5) * 6, jy = y + (r() - .5) * 5;
      g.beginPath(); for (var k = 0; k < 6; k++) { var a = k / 6 * 6.283 + r() * .3, rr = 8 + r() * 2; g[k ? 'lineTo' : 'moveTo'](jx + Math.cos(a) * rr, jy + Math.sin(a) * rr * .9); } g.closePath();
      g.fillStyle = 'rgba(255,' + (215 + r() * 30 | 0) + ',150,' + (.08 + r() * .1) + ')'; g.fill(); g.strokeStyle = 'rgba(160,88,22,.2)'; g.lineWidth = 1; g.stroke();
    }
    g.restore();
    /* soft endosperm: the white floury heart, round starch granules */
    g.save(); g.filter = 'blur(6px)'; kernelPath(g, s * .68, 0, -.12 * s); g.fillStyle = '#fbf2de'; g.fill(); g.restore();
    g.save(); kernelPath(g, s * .66, 0, -.12 * s); g.clip();
    g.fillStyle = '#fbf3e2'; g.fillRect(-s, -1.1 * s, 2 * s, 2.3 * s);
    for (i = 0; i < 1500; i++) {
      x = (r() * 2 - 1) * .7 * s; y = (r() * 1.6 - .95) * s; var gr = 2.5 + r() * 4.5;
      g.beginPath(); g.arc(x, y, gr, 0, 6.283); g.fillStyle = 'rgba(255,253,246,.95)'; g.fill(); g.strokeStyle = 'rgba(205,172,118,.42)'; g.lineWidth = 1; g.stroke();
    }
    g.restore();
    /* germ: embryo in its scutellum, near the tip */
    germPath(g, s, .04 * s, .27, .3, .97); var gg = g.createLinearGradient(0, .3 * s, 0, s); gg.addColorStop(0, '#f6e3a2'); gg.addColorStop(1, '#e7c66c');
    g.fillStyle = gg; g.fill(); g.strokeStyle = 'rgba(176,128,40,.6)'; g.lineWidth = 3; g.stroke();
    germPath(g, s, .06 * s, .13, .46, .9); g.fillStyle = '#e9cd78'; g.fill(); g.strokeStyle = 'rgba(176,128,40,.55)'; g.lineWidth = 2; g.stroke();
    g.beginPath(); g.moveTo(.06 * s, .5 * s); g.bezierCurveTo(.1 * s, .62 * s, .03 * s, .74 * s, .07 * s, .86 * s); g.strokeStyle = 'rgba(160,112,30,.6)'; g.lineWidth = 6; g.lineCap = 'round'; g.stroke();
    /* section sheen */
    g.save(); g.filter = 'blur(16px)'; g.beginPath(); g.ellipse(-.3 * s, -.5 * s, .2 * s, .38 * s, -.3, 0, 6.283); g.fillStyle = 'rgba(255,255,250,.28)'; g.fill(); g.restore();
    g.restore();
    tipCap(g, s);
    kernelPath(g, s); g.strokeStyle = 'rgba(110,48,8,.6)'; g.lineWidth = 3; g.stroke();
    SPR.section = sp;
  }

  /* water held in the starch (unit space): small beads, never in the germ */
  var DROPS = (function () {
    var r = mulberry(21), out = [], g = mk(10, 10).getContext('2d'), tries = 0;
    while (out.length < 64 && tries++ < 5000) {
      var x = (r() * 2 - 1) * .75, y = -.92 + r() * 1.55;
      kernelPath(g, .86); if (!g.isPointInPath(x, y)) continue;
      germPath(g, 1, .04, .3, .27, 1); if (g.isPointInPath(x, y)) continue;
      if (out.some(function (d) { return Math.hypot(d.x - x, d.y - y) < .1; })) continue;
      out.push({ x: x, y: y, r: .022 + r() * .018, k: out.length, f: .7 + r() * .8, p: r() * 6.28 });
    }
    return out;
  })();

  /* ---------- the flake: foamed starch lobes bursting from a split hull ---------- */
  function flakeModel(seed) {
    var r = mulberry(seed), L = [], i;
    function lobe(a, d, R, z, delay) { L.push({ a: a, d: d, R: R, z: z, delay: delay, h: [r() * 6.28, r() * 6.28, r() * 6.28], amp: [.07 + r() * .05, .04 + r() * .03, .022 + r() * .015] }); }
    lobe(-Math.PI / 2, .45, .4, .45, 0);
    for (i = 0; i < 15; i++) lobe(-Math.PI / 2 + (r() * 2 - 1) * 1.45, .38 + r() * .62, .2 + r() * .17, r(), r() * .4);
    lobe(-Math.PI / 2 - 1.2 - r() * .2, .8, .3, .2, .15); lobe(-Math.PI / 2 + 1.2 + r() * .2, .8, .3, .25, .2);   // the butterfly's wings
    L.sort(function (a, b) { return a.z - b.z; });
    var sh = []; for (i = 0; i < 4; i++) sh.push({ a: Math.PI / 2 + (i - 1.5) * .55 + (r() - .5) * .25, len: .26 + r() * .1, w: .12 + r() * .05 });
    return { L: L, sh: sh };
  }
  var FLAKES = [flakeModel(5), flakeModel(11), flakeModel(23), flakeModel(42), flakeModel(77), flakeModel(91)];
  function lobePath(g, cx, cy, R, L) {
    g.beginPath();
    for (var i = 0; i <= 40; i++) {
      var a = i / 40 * 6.2832, rr = R * (1 + L.amp[0] * Math.sin(3 * a + L.h[0]) + L.amp[1] * Math.sin(5 * a + L.h[1]) + L.amp[2] * Math.sin(9 * a + L.h[2]));
      g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * .96);
    }
    g.closePath();
  }
  function shardPath(g, w, len) {
    g.beginPath(); g.moveTo(-w * .2, 0); g.quadraticCurveTo(w, len * .35, w * .35, len); g.lineTo(-w * .25, len * .92); g.quadraticCurveTo(-w * .9, len * .45, -w * .2, 0); g.closePath();
  }
  function shard(g, w, len, alpha) {
    shardPath(g, w, len); var sg = g.createLinearGradient(-w, 0, w, len); sg.addColorStop(0, 'rgba(240,170,70,' + alpha + ')'); sg.addColorStop(1, 'rgba(165,82,22,' + alpha + ')');
    g.fillStyle = sg; g.fill(); g.strokeStyle = 'rgba(255,225,160,' + (.55 * alpha) + ')'; g.lineWidth = Math.max(1, w * .08); g.stroke();
  }
  var FOAM = new WeakMap();
  function foam(g) {
    if (!FOAM.has(g)) {
      var c = mk(160, 160), x = c.getContext('2d'), r = mulberry(8);
      for (var i = 0; i < 260; i++) { x.beginPath(); x.arc(r() * 160, r() * 160, 1.5 + r() * 5, 0, 6.283); x.strokeStyle = 'rgba(176,134,70,' + (.1 + r() * .14) + ')'; x.lineWidth = 1; x.stroke(); }
      for (i = 0; i < 160; i++) { x.fillStyle = 'rgba(255,255,255,.5)'; x.fillRect(r() * 160, r() * 160, 1.5, 1.5); }
      FOAM.set(g, g.createPattern(c, 'repeat'));
    }
    return FOAM.get(g);
  }
  function backOut(k) { var c = 1.4; return k <= 0 ? 0 : k >= 1 ? 1 : 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }
  /* (x, y) is the flake's base, where the hull split; s is the unit size; k the growth 0..1 */
  function drawFlake(g, M, x, y, s, k, rot, opt) {
    if (k <= 0) return; opt = opt || {};
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    var shA = opt.shards == null ? 1 : opt.shards;
    if (shA > 0) M.sh.forEach(function (h) { g.save(); g.rotate(h.a - Math.PI / 2); g.translate(0, -.16 * s); shard(g, h.w * s, h.len * s * (.6 + .4 * Math.min(1, k * 1.5)), shA); g.restore(); });
    var pat = opt.texture === false ? null : foam(g);
    M.L.forEach(function (L) {
      var kk = backOut(clamp((k - L.delay * .5) / (1 - L.delay * .5), 0, 1)); if (kk <= 0) return;
      var cx = Math.cos(L.a) * L.d * s * kk, cy = Math.sin(L.a) * L.d * s * kk - .12 * s, R = L.R * s * (.22 + .78 * kk);
      /* the crease this lobe casts on the lobes behind it */
      lobePath(g, cx + R * .09, cy + R * .13, R * 1.1, L); g.fillStyle = 'rgba(130,88,36,.18)'; g.fill();
      lobePath(g, cx + R * .05, cy + R * .07, R * 1.03, L); g.fillStyle = 'rgba(120,80,30,.3)'; g.fill();
      lobePath(g, cx, cy, R, L);
      var lg = g.createRadialGradient(cx - R * .36, cy - R * .42, R * .08, cx, cy, R * 1.04);
      lg.addColorStop(0, '#fffefa'); lg.addColorStop(.5, '#fdf3da'); lg.addColorStop(.82, '#efd7a4'); lg.addColorStop(1, '#cfa865');
      g.fillStyle = lg; g.fill();
      if (pat && R > 18) { g.save(); g.clip(); g.globalAlpha *= .9; g.fillStyle = pat; g.fillRect(cx - R, cy - R, R * 2, R * 2); g.restore(); }
    });
    if (shA > 0) { g.save(); g.translate(0, -.12 * s); g.scale(1, .8); tipCap(g, s * .35); g.restore(); }
    g.restore();
  }
  function buildFlakeSprites() {
    SPR.flakes = FLAKES.map(function (M) {
      var u = 80, sp = sprite(4 * u, 3.4 * u, 2 * u, 2.4 * u);
      drawFlake(sp.g, M, sp.ox, sp.oy, u, 1, 0);
      sp.unit = u; return sp;
    });
  }
  function drawFlakeSpr(g, i, x, y, s, rot) {
    var sp = SPR.flakes[i % SPR.flakes.length], k = s / sp.unit;
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.drawImage(sp.c, -sp.ox * k, -sp.oy * k, sp.c.width * k, sp.c.height * k); g.restore();
  }

  /* soft vapour: what steam actually looks like */
  function vapor(g, x, y, R, k, seed, up, alpha) {
    if (k <= 0 || k >= 1) return;
    for (var i = 0; i < 12; i++) {
      var a = -Math.PI / 2 + (hash(seed + i) - .5) * (up ? 1.6 : 6.28), d = R * (.2 + 1.5 * eo(k) * (.5 + hash(seed + i * 3) * .7));
      var cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d - (up ? R * .8 * k : 0), rr = R * (.25 + .55 * k) * (.6 + hash(i + seed * 7) * .6);
      var vg = g.createRadialGradient(cx, cy, 0, cx, cy, rr); var al = (alpha || .7) * (1 - k) * (1 - k * .3);
      vg.addColorStop(0, 'rgba(255,255,255,' + al + ')'); vg.addColorStop(.6, 'rgba(255,255,255,' + (al * .45) + ')'); vg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = vg; g.beginPath(); g.arc(cx, cy, rr, 0, 6.283); g.fill();
    }
  }
  function wisp(g, x, y, t, k, n, spread) {
    if (k <= 0) return;
    for (var m = 0; m < n; m++) {
      var q = (t * .9 + m / n) % 1, cx = x + Math.sin(q * 7 + m * 2.1) * (10 + q * spread), cy = y - q * 220, rr = 10 + q * 46;
      var vg = g.createRadialGradient(cx, cy, 0, cx, cy, rr), al = k * .55 * Math.sin(q * Math.PI);
      vg.addColorStop(0, 'rgba(255,255,255,' + al + ')'); vg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = vg; g.beginPath(); g.arc(cx, cy, rr, 0, 6.283); g.fill();
    }
  }

  function mix(a, b, k) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = Math.round(lerp(pa >> 16, pb >> 16, k)), gg = Math.round(lerp(pa >> 8 & 255, pb >> 8 & 255, k)), bl = Math.round(lerp(pa & 255, pb & 255, k));
    return 'rgb(' + r + ',' + gg + ',' + bl + ')';
  }

  /* ---------- the kernel, whole or cut open ---------- */
  function kernel(g, cx, cy, s, o) {
    o = o || {};
    var temp = o.temp || 0, shake = o.shake || 0, t = o.t || 0, pr = o.pressure || 0, bulge = 1 + pr * .03;
    var al = o.alpha == null ? 1 : o.alpha;
    g.save();
    g.translate(cx + Math.sin(t * 71) * shake * 6 + Math.sin(t * 43) * shake * 3, cy + Math.cos(t * 59) * shake * 4);
    if (o.shadow !== false) { g.save(); g.scale(1, .16); var shg = g.createRadialGradient(0, 1.08 * s / .16, 0, 0, 1.08 * s / .16, .7 * s); shg.addColorStop(0, 'rgba(25,12,4,' + (.4 * al) + ')'); shg.addColorStop(1, 'rgba(25,12,4,0)'); g.fillStyle = shg; g.beginPath(); g.arc(0, 1.08 * s / .16, .7 * s, 0, 6.283); g.fill(); g.restore(); }
    g.rotate((o.rot || 0) + Math.sin(t * 37) * shake * .02); g.scale(bulge, bulge);
    g.globalAlpha = al;
    var sec = o.section || 0;
    if (sec < 1) {
      if (sec > 0) {
        /* cut open: the front half splits and slides away */
        var e = eio(sec);
        [-1, 1].forEach(function (side) {
          g.save(); g.beginPath(); g.rect(side < 0 ? -s : 0, -1.2 * s, s, 2.4 * s); g.clip();
          g.translate(side * e * s * 1.3, -e * s * .1); g.rotate(side * e * .25); g.globalAlpha = al * (1 - e) * (1 - e);
          drawSpr(g, SPR.kernel, 0, 0, s); g.restore();
        });
      } else drawSpr(g, SPR.kernel, 0, 0, s);
    }
    if (sec > 0) {
      g.save(); g.globalAlpha = al * Math.min(1, sec * 2.5);
      drawSpr(g, SPR.section, 0, 0, s);
      /* heat: the hull darkens, the soft starch turns glassy (it gelatinises) */
      var gel = o.gel || 0;
      if (gel > 0) { g.save(); kernelPath(g, s * .66, 0, -.12 * s); g.clip(); var jg = g.createRadialGradient(-.15 * s, -.4 * s, .05 * s, 0, -.1 * s, .7 * s); jg.addColorStop(0, 'rgba(255,250,232,' + (.55 * gel) + ')'); jg.addColorStop(1, 'rgba(244,214,150,' + (.6 * gel) + ')'); g.fillStyle = jg; g.fillRect(-s, -s, 2 * s, 2 * s); g.restore(); }
      var drops = o.drops || 0, steam = o.steam || 0;
      DROPS.forEach(function (d) {
        var appear = clamp(drops * 3 - d.k / DROPS.length * 2, 0, 1); if (appear <= 0) return;
        var boil = clamp(steam * 1.7 - hash(d.k) * .7, 0, 1);
        var x = d.x * s + Math.sin(t * 9 + d.p) * shake * 3, y = d.y * s, rr = d.r * s * clamp(spring(appear * .6, 2.4, .6), 0, 1.2);
        if (boil < 1) {
          var dg = g.createRadialGradient(x - rr * .35, y - rr * .35, rr * .05, x, y, rr);
          dg.addColorStop(0, 'rgba(235,248,255,.98)'); dg.addColorStop(.45, 'rgba(120,190,245,.92)'); dg.addColorStop(1, 'rgba(40,120,205,.95)');
          g.globalAlpha = al * (1 - boil); g.beginPath(); g.arc(x, y, rr * (1 - boil * .6), 0, 6.283); g.fillStyle = dg; g.fill();
          g.globalAlpha = al;
        }
        if (boil > 0) {
          /* a vapour bubble grows where the water was, jostling harder as the pressure climbs */
          var ph = t * (1 + pr * 5) * d.f + d.p, wob = (2 + pr * 7) * (s / 250);
          var bx = x + Math.sin(ph * 1.7) * wob, by = y + Math.cos(ph * 1.3) * wob, br = rr * (1 + 1.4 * boil + pr * 1.1);
          var bg = g.createRadialGradient(bx - br * .3, by - br * .3, br * .1, bx, by, br);
          bg.addColorStop(0, 'rgba(255,255,255,' + (.8 * boil) + ')'); bg.addColorStop(.7, 'rgba(255,255,255,' + (.35 * boil) + ')'); bg.addColorStop(1, 'rgba(255,255,255,' + (.75 * boil) + ')');
          g.beginPath(); g.arc(bx, by, br, 0, 6.283); g.fillStyle = bg; g.fill(); g.strokeStyle = 'rgba(190,150,90,' + (.35 * boil) + ')'; g.lineWidth = 1.5; g.stroke();
        }
      });
      /* pressure on the shell, from inside */
      if (pr > 0) for (var i = 0; i < 10; i++) {
        var a = i / 10 * 6.283 + .3, r0 = s * .3, r1 = s * (.48 + pr * .2);
        var ex = Math.cos(a) * r1 * .95, ey = Math.sin(a) * r1 * 1.1 - .05 * s;
        g.globalAlpha = al * Math.min(1, pr * 2) * .9; g.lineCap = 'round'; g.lineJoin = 'round';
        [['rgba(255,255,255,.85)', 13], [RED, 7]].forEach(function (st) {
          g.strokeStyle = st[0]; g.lineWidth = st[1];
          g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 1.1 - .05 * s); g.lineTo(ex, ey); g.stroke();
          g.beginPath(); g.moveTo(ex + Math.cos(a + 2.5) * 22, ey + Math.sin(a + 2.5) * 22); g.lineTo(ex, ey); g.lineTo(ex + Math.cos(a - 2.5) * 22, ey + Math.sin(a - 2.5) * 22); g.stroke();
        });
        g.globalAlpha = al;
      }
      if (o.tough) { g.save(); kernelPath(g, s * .985); g.lineWidth = s * .05; g.strokeStyle = 'rgba(215,38,46,' + (o.tough * .85) + ')'; g.stroke(); g.restore(); }
      g.restore();
    }
    if (temp > 0) { g.save(); kernelPath(g, s); g.clip(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(232,120,70,' + (temp * .32) + ')'; g.fillRect(-s, -1.1 * s, 2 * s, 2.3 * s); g.restore(); }
    /* cracks: hairlines first, then they open */
    var cr = o.crack || 0;
    if (cr > 0) {
      g.lineCap = 'round'; g.lineJoin = 'round';
      [[0, -1, .3], [-.42, -.86, -.6], [.48, -.82, .7]].forEach(function (c, j) {
        var n = Math.floor(cr * 9 * (j ? .7 : 1)); if (n < 1) return;
        var path = [], x = c[0] * s, y = c[1] * s; path.push([x, y]);
        for (var k = 0; k < n; k++) { x += (hash(j * 9 + k) - .5) * s * .12 + c[2] * s * .03; y += s * .075; path.push([x, y]); }
        [['rgba(255,220,160,.7)', 6, 1.5], ['#3d1404', 2 + cr * 4, 0]].forEach(function (st) {
          g.strokeStyle = st[0]; g.lineWidth = st[1]; g.beginPath(); path.forEach(function (p, i) { g[i ? 'lineTo' : 'moveTo'](p[0] + st[2], p[1] + st[2]); }); g.stroke();
        });
      });
    }
    g.restore();
  }
  /* the pop itself: hull petals peel back while the foam erupts from the crown */
  function popping(g, cx, cy, s, open, k, M, rot, t) {
    g.save(); g.translate(cx, cy); g.rotate(rot);
    if (open < 1) {
      var e = eo(open);
      [[-1, -.06], [1, .06]].forEach(function (p) {
        g.save(); g.translate(0, .95 * s); g.rotate(p[0] * e * .85); g.translate(0, -.95 * s);
        g.beginPath(); g.rect(p[0] < 0 ? -s : 0, -1.2 * s, s, 2.4 * s); g.clip(); g.globalAlpha = 1 - ss(seg(open, .55, 1));
        drawSpr(g, SPR.kernel, 0, 0, s); g.restore();
      });
    }
    drawFlake(g, M, 0, .85 * s, s * 1.45, k, 0, { shards: ss(seg(open, .5, 1)) });
    g.restore();
  }
  function flyShards(g, cx, cy, s, k) {
    if (k <= 0 || k >= 1) return;
    for (var i = 0; i < 7; i++) {
      var a = -2.4 + i * .8 + hash(i) * .3, d = s * 2.6 * eo(k), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d + 1100 * k * k;
      g.save(); g.translate(x, y); g.rotate(k * (5 + i)); g.scale(.9, .9); shard(g, 24 + hash(i * 5) * 16, 46 + hash(i * 7) * 24, 1 - k * k); g.restore();
    }
  }

  /* ---------- the stove: a hot iron pan rises under the kernel ---------- */
  var PAN_Y = 1440;
  function pan(g, k, temp) {
    if (k <= 0) return;
    g.save(); g.translate(0, (1 - eo(k)) * 760);
    /* far wall, seen over the floor */
    var wall = g.createLinearGradient(0, PAN_Y - 300, 0, PAN_Y - 170); wall.addColorStop(0, '#3c3a38'); wall.addColorStop(1, '#141312');
    g.beginPath(); g.ellipse(540, PAN_Y + 20, 940, 320, 0, Math.PI, 2 * Math.PI); g.fillStyle = wall; g.fill();
    /* floor */
    var fl = g.createRadialGradient(540, PAN_Y - 20, 40, 540, PAN_Y + 60, 950);
    fl.addColorStop(0, '#3d3c3a'); fl.addColorStop(.55, '#262524'); fl.addColorStop(1, '#121110');
    g.beginPath(); g.ellipse(540, PAN_Y + 60, 900, 250, 0, 0, 6.283); g.fillStyle = fl; g.fill();
    g.fillRect(0, PAN_Y + 60, W, H - PAN_Y);
    /* the rim: a thick rolled steel lip with a highlight */
    g.lineCap = 'round';
    g.beginPath(); g.ellipse(540, PAN_Y + 20, 940, 320, 0, Math.PI * 1.04, Math.PI * 1.96); g.strokeStyle = '#6d6a66'; g.lineWidth = 22; g.stroke();
    g.beginPath(); g.ellipse(540, PAN_Y + 14, 940, 320, 0, Math.PI * 1.12, Math.PI * 1.88); g.strokeStyle = 'rgba(235,232,226,.75)'; g.lineWidth = 4; g.stroke();
    g.beginPath(); g.ellipse(540, PAN_Y + 34, 935, 316, 0, Math.PI * 1.04, Math.PI * 1.96); g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 6; g.stroke();
    if (temp > 0) {
      g.globalCompositeOperation = 'lighter';
      var hg = g.createRadialGradient(540, PAN_Y + 10, 10, 540, PAN_Y + 40, 560); hg.addColorStop(0, 'rgba(255,96,30,' + (.3 * temp) + ')'); hg.addColorStop(.5, 'rgba(200,50,10,' + (.1 * temp) + ')'); hg.addColorStop(1, 'rgba(200,50,10,0)');
      g.fillStyle = hg; g.fillRect(0, PAN_Y - 200, W, H - PAN_Y + 200);
      g.globalCompositeOperation = 'source-over';
    }
    /* seasoning sheen */
    g.save(); g.filter = 'blur(16px)'; g.beginPath(); g.ellipse(320, PAN_Y + 150, 280, 34, -.05, 0, 6.283); g.fillStyle = 'rgba(255,250,240,.08)'; g.fill();
    g.beginPath(); g.ellipse(790, PAN_Y + 260, 220, 26, .05, 0, 6.283); g.fillStyle = 'rgba(255,250,240,.06)'; g.fill(); g.restore();
    g.restore();
  }
  /* heat haze above the pan */
  function haze(g, k, t) {
    if (k <= 0) return;
    g.lineCap = 'round'; g.lineWidth = 5;
    for (var i = 0; i < 6; i++) {
      var x0 = KX - 330 + i * 132, ph = t * 2.2 + i * 1.7, lift = ((t * .8 + i * .37) % 1);
      g.strokeStyle = 'rgba(255,190,140,' + (k * .22 * Math.sin(lift * Math.PI)) + ')';
      g.beginPath();
      for (var j = 0; j <= 16; j++) { var y = PAN_Y - 60 - j * 16 - lift * 120, x = x0 + Math.sin(ph + j * .45) * 12; g[j ? 'lineTo' : 'moveTo'](x, y); }
      g.stroke();
    }
  }

  /* pressure gauge and thermometer, the two instruments */
  function gauge(g, cx, cy, r, val, label, alpha) {
    if (alpha <= 0) return;
    g.save(); g.globalAlpha = Math.min(1, alpha); g.translate(cx, cy); var sc = .85 + .15 * Math.min(1, alpha); g.scale(sc, sc);
    g.save(); g.shadowColor = 'rgba(60,30,10,.25)'; g.shadowBlur = 24; g.shadowOffsetY = 8;
    var bz = g.createLinearGradient(0, -r, 0, r); bz.addColorStop(0, '#d9d4cc'); bz.addColorStop(1, '#8d867c');
    g.beginPath(); g.arc(0, 0, r + 10, 0, 6.283); g.fillStyle = bz; g.fill(); g.restore();
    g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.fillStyle = '#fffaf1'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    for (var i = 0; i <= 10; i++) {
      var a = Math.PI * .75 + i / 10 * Math.PI * 1.5;
      g.beginPath(); g.moveTo(Math.cos(a) * r * .84, Math.sin(a) * r * .84); g.lineTo(Math.cos(a) * r * (i % 5 ? .74 : .66), Math.sin(a) * r * (i % 5 ? .74 : .66));
      g.lineWidth = i % 5 ? 4 : 7; g.strokeStyle = i > 7 ? RED : INK; g.stroke();
    }
    var na = Math.PI * .75 + clamp(val, 0, 1.05) * Math.PI * 1.5;
    g.beginPath(); g.moveTo(-Math.cos(na) * r * .12, -Math.sin(na) * r * .12); g.lineTo(Math.cos(na) * r * .72, Math.sin(na) * r * .72); g.lineWidth = 8; g.lineCap = 'round'; g.strokeStyle = RED; g.stroke();
    g.beginPath(); g.arc(0, 0, 13, 0, 6.283); g.fillStyle = INK; g.fill();
    var gl = g.createLinearGradient(0, -r, 0, 0); gl.addColorStop(0, 'rgba(255,255,255,.55)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    g.beginPath(); g.ellipse(0, -r * .45, r * .8, r * .45, 0, 0, 6.283); g.fillStyle = gl; g.fill();
    g.font = '600 26px "Geist Mono"'; g.textAlign = 'center'; g.fillStyle = INK; g.fillText(label, 0, r * .55);
    g.restore();
  }
  function thermo(g, cx, cy, h, val, txt, alpha) {
    if (alpha <= 0) return;
    g.save(); g.globalAlpha = Math.min(1, alpha); g.translate(cx, cy);
    g.save(); g.shadowColor = 'rgba(60,30,10,.22)'; g.shadowBlur = 20; g.shadowOffsetY = 6;
    g.lineWidth = 6; g.strokeStyle = 'rgba(35,28,21,.8)'; g.fillStyle = 'rgba(255,252,246,.95)';
    g.beginPath(); g.moveTo(-26, -h / 2); g.arc(0, -h / 2, 26, Math.PI, 0); g.lineTo(26, h / 2 - 20); g.arc(0, h / 2 + 14, 44, -1.0, Math.PI + 1.0); g.closePath(); g.fill(); g.restore(); g.stroke();
    var top = h / 2 - (h - 30) * clamp(val, 0, 1);
    var mg = g.createLinearGradient(-13, 0, 13, 0); mg.addColorStop(0, '#b8261a'); mg.addColorStop(.4, '#ff6b4a'); mg.addColorStop(1, '#c42d1c');
    g.fillStyle = mg; g.beginPath(); g.arc(0, h / 2 + 14, 32, 0, 6.283); g.fill(); g.fillRect(-12, top, 24, h / 2 + 14 - top);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-20, -h / 2, 6, h - 10);
    g.font = '700 46px Archivo'; g.textAlign = 'right'; g.fillStyle = INK; try { g.fontStretch = 'expanded'; } catch (e) {}
    g.fillText(txt, -60, top + 16);
    g.restore();
  }
  /* a big stamped number or word */
  var STAMPS = [];
  function stamp(id, text, t0, t1, x, y, size, color) { STAMPS.push({ id: id, text: text, t0: t0, t1: t1, x: x, y: y, size: size, color: color || INK }); }
  function drawStamps(g, t) {
    STAMPS.forEach(function (s) {
      var k = win(t, s.t0, s.t1, .25); if (k <= 0) return;
      g.save(); g.translate(s.x, s.y); var sc = clamp(spring(t - s.t0, 2.6, .55), 0, 1.3) * (1 - .15 * eio(seg(t, s.t1, s.t1 + .25)));
      g.scale(sc, sc); g.rotate(-.04);
      g.font = '800 ' + s.size + 'px Archivo'; try { g.fontStretch = 'expanded'; } catch (e) {}
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = Math.min(1, k);
      g.lineJoin = 'round'; g.lineWidth = s.size * .12; g.strokeStyle = 'rgba(251,246,236,.9)'; g.strokeText(s.text, 0, 0);
      g.fillStyle = s.color; g.fillText(s.text, 0, 0);
      g.restore();
    });
  }
  function label(g, text, x, y, alpha, color) {
    if (alpha <= 0) return;
    g.save(); g.globalAlpha = Math.min(1, alpha); g.font = '600 38px "Geist Mono"'; g.fillStyle = color || INK; g.textAlign = 'center';
    try { g.letterSpacing = '3px'; } catch (e) {}
    g.fillText(text, x, y); g.restore();
  }
  /* a labelled leader line to a part of the kernel */
  function callout(g, text, px, py, lx, ly, alpha) {
    if (alpha <= 0) return;
    var k = Math.min(1, alpha), e = eo(k);
    g.save(); g.globalAlpha = k; g.strokeStyle = INK; g.lineWidth = 3;
    g.beginPath(); g.moveTo(px, py); g.lineTo(lerp(px, lx, e), lerp(py, ly + 14, e)); g.stroke();
    g.beginPath(); g.arc(px, py, 8, 0, 6.283); g.fillStyle = '#fff'; g.fill(); g.stroke();
    g.restore();
    label(g, text, lx, ly, k);
  }

  stamp('pct', '14%', T.pct, T.heat + .45, 300, 660, 150, WATER);
  stamp('nine', '9×', T.nine, T.hot - .05, 770, 650, 170, RED);
  stamp('hot', '180°C', T.hot, T.pop - .02, 330, 660, 120, HEAT);
  stamp('pop', 'POP!', T.pop + .04, T.pop + 2.15, 540, 600, 230, RED);
  stamp('forty', '40×', T.forty, start('sound') + .2, 540, 620, 170, INK);

  /* ---------- captions: the narrator's words, highlighted as spoken ---------- */
  function captions(g, t) {
    var card = null;
    VO.captions.forEach(function (c) { if (t >= c.t0 - .04 && t < c.t1 + .15) card = c; });
    if (!card) return;
    var k = clamp(spring(t - card.t0 + .04, 3.2, .7), 0, 1.1), out = 1 - seg(t, card.t1, card.t1 + .15);
    g.save(); g.font = '800 84px Archivo'; try { g.fontStretch = 'expanded'; } catch (e) {}
    g.textBaseline = 'alphabetic';
    var words = card.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 24;
    var lines = [[]], lw = [0], maxw = 900;
    words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; });
    var y0 = 360 - (lines.length - 1) * 50;
    g.globalAlpha = out;
    lines.forEach(function (ln, li) {
      var x = W / 2 - (lw[li] - gap) / 2, y = y0 + li * 100 + (1 - Math.min(1, k)) * 40;
      ln.forEach(function (i) {
        var w = words[i], cur = t >= w.t0 - .03 && t < w.t1 + .05, said = t >= w.t0 - .03;
        if (cur) { g.fillStyle = RED; g.beginPath(); g.roundRect(x - 12, y - 74, ws[i] + 24, 96, 18); g.fill(); }
        g.fillStyle = cur ? '#fff' : said ? INK : 'rgba(35,28,21,.32)';
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }

  /* ---------- the finale: a pan of kernels popping, faster and faster ---------- */
  var PAN = (function () {
    var r = mulberry(9), out = [], i;
    for (i = 0; i < 44; i++) {
      var d = r(), y = PAN_Y - 120 + d * 330, x = 110 + r() * 860;
      if (Math.abs(x - 540) < 90 && y > PAN_Y + 120) { i--; continue; }        // the old maid's spot stays clear
      out.push({ x: x, y: y, sc: .55 + .45 * d, rot: (r() - .5) * 2.8 + Math.PI / 2 * (r() < .5 ? 1 : -1), k: r(), h: 160 + r() * 300, dx: (r() - .5) * 160, spin: (r() - .5) * 5, v: i, flip: r() < .5 });
    }
    return out;
  })();
  var POPORDER = PAN.map(function (p, i) { return i; }).sort(function (a, b) { return PAN[a].k - PAN[b].k; });
  var RAIN = (function () { var r = mulberry(13), out = []; for (var i = 0; i < 46; i++) out.push({ x: 90 + r() * 900, y: PAN_Y - 150 + r() * 330, t0: 0, u: r(), v: i + 3, rot: r() * 6.28, sc: .55 + r() * .4, spin: (r() - .5) * 6 }); return out; })();
  function popTime(n) { var u = (n + .5) / POPORDER.length; return T.bowl + .25 + (T.home - T.bowl - .95) * Math.pow(u, .6); }
  POPORDER.forEach(function (pi, n) { PAN[pi].tp = popTime(n); });
  RAIN.forEach(function (q) { q.t0 = T.tiny - .3 + (T.home - .6 - T.tiny) * Math.pow(q.u, .8); });
  var MAID = { x: 540, y: PAN_Y + 205, s: 52 };
  function finale(g, t) {
    var come = eo(seg(t, T.bowl - .15, T.bowl + .35));
    var items = [];
    PAN.forEach(function (p) { items.push({ y: p.y, p: p }); });
    RAIN.forEach(function (q) { if (t >= q.t0) items.push({ y: q.y, q: q }); });
    items.sort(function (a, b) { return a.y - b.y; });
    items.forEach(function (it) {
      if (it.p) {
        var p = it.p, s = 62 * p.sc;
        g.save(); g.globalAlpha = come;
        if (t < p.tp) {
          var j = seg(t, p.tp - .5, p.tp) * 3;
          g.translate(p.x + Math.sin(t * 61 + p.v) * j, p.y + Math.cos(t * 47 + p.v) * j * .6 - s * .45);
          g.rotate(p.rot); drawSpr(g, SPR.kernel, 0, 0, s * .62);
        } else {
          var u = seg(t, p.tp, p.tp + .62), fx = p.x + p.dx * u, fy = p.y - p.h * 4 * u * (1 - u);
          if (u >= 1) { var b = seg(t, p.tp + .62, p.tp + .82); fy = p.y - 30 * p.sc * Math.sin(b * Math.PI) * (1 - b); }
          drawFlakeSpr(g, p.v, fx, fy, s * .78 * eo(seg(t, p.tp, p.tp + .12)), p.spin * Math.min(u, 1) + (p.flip ? .4 : -.3));
          vapor(g, p.x, p.y - s * .5, s * 1.1, seg(t, p.tp, p.tp + .5), p.v * 7, true, .55);
        }
        g.restore();
      } else {
        var q = it.q, u2 = seg(t, q.t0, q.t0 + .55), qy = lerp(-200, q.y, u2 * u2), s2 = 62 * q.sc;
        if (u2 >= 1) { var b2 = seg(t, q.t0 + .55, q.t0 + .8); qy = q.y - 26 * q.sc * Math.sin(b2 * Math.PI) * (1 - b2); }
        drawFlakeSpr(g, q.v, q.x, qy, s2 * .78, q.rot + q.spin * u2);
      }
    });
  }

  /* ---------- the picture ---------- */
  var NOISE;
  function paper(g) {
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#fbf6ec'); bg.addColorStop(1, '#efe4cf');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1150, 300, 540, 1000, 1300); vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, 'rgba(150,110,60,.12)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    paper(g);

    /* camera: a slow push through the build-up, a punch on the pop */
    var push = 1 + .08 * ss(seg(t, start('steam'), T.pop)) - .08 * eo(seg(t, T.pop, T.pop + .4)) + .05 * Math.max(0, 1 - (t - T.pop) * 3) * (t > T.pop ? 1 : 0);
    g.save(); g.translate(KX, KY); g.scale(push, push); g.translate(-KX, -KY);

    var temp = ss(seg(t, T.heat, T.pop)), pressure = ss(seg(t, T.boil + .3, T.nine + .3)) * .7 + .3 * ss(seg(t, T.hot, T.pop));
    var panK = seg(t, T.heat - .25, T.heat + .45), panHeat = temp * (1 - .6 * seg(t, T.pop, T.pop + 3)) + .5 * seg(t, T.bowl - .3, T.bowl + .5);
    pan(g, panK, panHeat);
    haze(g, seg(t, T.heat, T.heat + .8) * (1 - seg(t, T.pop + .2, T.pop + 1)), t);

    var M = FLAKES[0];
    /* hook: pop, hold, rewind */
    var rewind = seg(t, T.rew0, T.rew1);
    if (t < T.hookPop) kernel(g, KX, KY, KS, { t: t, shake: .12 * seg(t, .6, T.hookPop) });
    else if (t < T.rew1) {
      var hk = eo(seg(t, T.hookPop, T.hookPop + .45)) * .85 * (1 - eio(rewind)), ho = seg(t, T.hookPop - .02, T.hookPop + .3) * (1 - eio(rewind));
      g.save(); g.scale(1, 1);
      g.translate(0, -120 * Math.sin(Math.PI * Math.min(1, seg(t, T.hookPop, T.hookPop + .7))) * (1 - eio(rewind)));
      kernelShadowOnly(g, KX, KY, KS, 1 - hk * .5);
      popping(g, KX, KY, KS, ho, hk, M, 0, t);
      vapor(g, KX, KY - KS * .6, KS, seg(t, T.hookPop, T.hookPop + .7) * (rewind > 0 ? 0 : 1), 3, true);
      g.restore();
      if (rewind > 0) { g.save(); g.globalAlpha = .1 + .18 * Math.sin(rewind * Math.PI); g.fillStyle = INK; for (var i = 0; i < 9; i++) g.fillRect(0, (i * 237 + t * 4000) % H, W, 5); g.restore(); }
    } else if (t < T.pop) {
      var sec = seg(t, T.cut, T.cut + .5);
      kernel(g, KX, KY, KS, {
        t: t, section: sec, drops: seg(t, T.drops - .15, T.drops + .7), steam: seg(t, T.boil - .1, T.boil + .9),
        temp: temp * .6, gel: ss(seg(t, T.climb, T.pop)), pressure: t > T.boil ? pressure : 0, tough: win(t, T.tough, T.trapped + .8, .4),
        shake: pressure * .5 + .9 * seg(t, T.gives - .4, T.pop), crack: seg(t, T.gives - .1, T.pop - .02)
      });
      /* anatomy, as soon as it's open */
      var an = win(t, T.cut + .35, T.pct - .1, .25);
      callout(g, 'HULL', KX + .79 * KS, KY - .35 * KS, 880, 960, an);
      callout(g, 'STARCH', KX - .25 * KS, KY - .4 * KS, 200, 960, an);
      callout(g, 'GERM', KX + .08 * KS, KY + .62 * KS, 860, 1296, an);
      /* the steam knocking on the wall while it's trapped */
      var tk = win(t, T.tough, end('trap'), .3);
      if (tk > 0) for (var j = 0; j < 6; j++) {
        var ph = (t * 3.1 + j * .37) % 1, a = j * 1.05 + .4;
        g.save(); g.globalAlpha = tk * (1 - ph) * .9; g.strokeStyle = RED; g.lineWidth = 6;
        g.beginPath(); g.arc(KX + Math.cos(a) * KS * .76, KY - .1 * KS + Math.sin(a) * KS * .86, 16 + ph * 34, a - .8, a + .8); g.stroke(); g.restore();
      }
    } else {
      /* the pop: hull splits, the foam erupts, the whole thing jumps; then the questions */
      var open = seg(t, T.pop - .02, T.pop + .32), fk = eo(seg(t, T.pop, T.pop + .75)) * .8 + .2 * ss(seg(t, T.forty - .15, T.forty + .5));
      var ju = seg(t, T.pop + .06, T.pop + 1.0), jy = -240 * 4 * ju * (1 - ju), jr = .35 * Math.sin(ju * Math.PI);
      var land = seg(t, T.pop + 1.0, T.pop + 1.3), squash = 1 - .05 * Math.sin(land * Math.PI);
      var away = eio(seg(t, T.dud - .3, T.dud + .4)), soundK = win(t, T.hear, T.dud - .3, .3);
      if (t < T.dud + .4) {
        g.save(); g.translate(-away * 1000, -150 * soundK);
        var fs = 1 - .3 * soundK;
        g.translate(KX, KY + KS * .85); g.scale(fs, fs * squash); g.translate(-KX, -(KY + KS * .85));
        kernelShadowOnly(g, KX, KY, KS, (1 - ju * .7));
        if (t < T.pop + .06) kernel(g, KX, KY, KS, { t: t, section: 1, temp: .6, gel: 1, pressure: 1, shake: 1.2, crack: 1, steam: 1, drops: 1, shadow: false });
        else popping(g, KX, KY + jy, KS * (open < 1 ? 1 : 1), open, fk, M, jr, t);
        /* 40x: the kernel it came from, to scale */
        var ghost = win(t, T.forty - .05, end('puff') + .2, .3);
        if (ghost > 0) { g.save(); g.globalAlpha = Math.min(1, ghost); drawSpr(g, SPR.kernel, KX + 380, KY + 250, KS * .3); g.restore(); label(g, 'BEFORE', KX + 380, KY + 370, ghost, '#fff'); }
        g.restore();
        flyShards(g, KX, KY - KS * .4, KS, seg(t, T.pop, T.pop + 1.1));
        vapor(g, KX, KY - KS * .5, KS * 1.3, seg(t, T.pop, T.pop + 1.1), 11, true, .85);
      }
      /* "that pop you hear": not the hull (crossed out), the steam (rings) */
      if (soundK > 0) {
        var sk = Math.min(1, soundK), xs = win(t, T.notShell, T.dud - .3, .3), st = win(t, T.escaping, T.dud - .3, .3);
        g.save(); g.globalAlpha = sk;
        g.save(); g.translate(290, 1330); g.rotate(-.9); shard(g, 70, 130, 1); g.restore();
        if (xs > 0) { g.save(); g.translate(290, 1340); g.strokeStyle = RED; g.lineWidth = 14; g.lineCap = 'round'; var xk = Math.min(1, xs); g.beginPath(); g.moveTo(-85, -75); g.lineTo(-85 + 170 * xk, -75 + 150 * xk); g.stroke(); if (xk > .5) { var x2 = (xk - .5) * 2; g.beginPath(); g.moveTo(85, -75); g.lineTo(85 - 170 * x2, -75 + 150 * x2); g.stroke(); } g.restore(); }
        label(g, 'HULL', 290, 1450, sk, '#fff');
        if (st > 0) {
          g.save(); g.translate(770, 1350);
          for (var w2 = 0; w2 < 4; w2++) { var p2 = (t * 1.8 + w2 * .25) % 1; g.globalAlpha = Math.min(1, st) * (1 - p2); g.strokeStyle = RED; g.lineWidth = 8; g.beginPath(); g.arc(0, -40, 50 + p2 * 120, -.9, .9); g.stroke(); g.beginPath(); g.arc(0, -40, 50 + p2 * 120, Math.PI - .9, Math.PI + .9); g.stroke(); }
          g.globalAlpha = Math.min(1, st); wisp(g, 0, 20, t * 1.6, 1, 7, 40);
          g.restore();
          label(g, 'STEAM', 770, 1450, Math.min(1, st), '#fff');
        }
        g.restore();
      }
      /* duds: a kernel whose hull leaked, so pressure never built */
      var dk = seg(t, T.dud - .1, T.dud + .5), mv = eio(seg(t, T.bowl - .15, T.bowl + .45));
      if (dk > 0) {
        var dx = lerp(KX + (1 - eo(dk)) * 1000, MAID.x, mv), dy = lerp(KY, MAID.y - MAID.s * .9, mv), ds = lerp(KS, MAID.s, mv);
        if (t >= T.bowl - .2) finale(g, t);
        kernel(g, dx, dy, ds, { t: t, rot: (1 - eo(dk)) * 1.4, crack: seg(t, T.leaked - .1, T.leaked + .3) * .35 * (1 - mv) });
        wisp(g, dx + .3 * ds, dy - .85 * ds, t, seg(t, T.leaked, T.leaked + .3) * (1 - mv), 6, 50);
        label(g, 'OLD MAID · NEVER POPS', KX, KY + KS * 1.3, seg(t, T.leaked, T.leaked + .3) * (1 - seg(t, T.bowl - .2, T.bowl + .1)), '#fff');
      }
    }
    g.restore();

    /* instruments and stamps live outside the camera push */
    var gA = win(t, T.gauge, T.cut + .2, .3) + win(t, T.climb - .2, T.hot - .3, .3);
    var gv = t < T.cut + .5 ? 0 : ss(seg(t, T.climb, T.nine + .2)) * .9 + .1 * ss(seg(t, T.nine, T.pop));
    gauge(g, 280, 660, 135, gv, t < T.cut + .5 ? 'PRESSURE' : (gv > .85 ? '9 ATM' : Math.max(1, Math.round(gv * 10)) + ' ATM'), gA);
    if (t < T.cut + .5) label(g, 'A TINY PRESSURE COOKER', 540, 830, win(t, T.gauge + .2, T.cut, .3));
    var thA = win(t, T.heat, T.pop - .05, .2), tv = t < T.hot ? 20 + 80 * ss(seg(t, T.heat, T.boil)) + 50 * ss(seg(t, T.boil, T.hot)) : 150 + 30 * eo(seg(t, T.hot, T.hot + .5));
    thermo(g, 860, 640, 300, (tv - 20) / 170, Math.round(tv) + '°', thA * (t > T.hot - .1 && t < T.pop ? 0 : 1) * (1 - Math.min(1, win(t, T.nine - .1, end('press'), .2))));
    label(g, 'WATER', 300, 770, win(t, T.pct, T.heat + .45, .25), WATER);
    label(g, '100° = STEAM', 540, 830, win(t, T.boil, end('steam') + .3, .3));
    label(g, 'SEALED SHELL', 540, 830, win(t, T.tough, end('trap') + .2, .3), RED);
    label(g, 'THE AIR AROUND YOU = 1', 540, 830, win(t, T.nine + .3, end('press') + .2, .3));
    drawStamps(g, t);

    /* the loop: the pan fades back to one kernel on paper, which is frame 0 */
    var back = eio(seg(t, T.home - .05, DUR));
    if (back > 0) { g.save(); g.globalAlpha = back; paper(g); kernel(g, KX, KY, KS, { t: 0 }); g.restore(); }
    captions(g, t);

    /* a thin progress line along the top (the loop restarts it) */
    g.fillStyle = 'rgba(35,28,21,.12)'; g.fillRect(60, 140, W - 120, 6);
    g.fillStyle = RED; g.fillRect(60, 140, (W - 120) * t / DUR, 6);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'multiply'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function kernelShadowOnly(g, cx, cy, s, a) {
    g.save(); g.translate(cx, cy); g.scale(1, .16); var y = 1.08 * s / .16, shg = g.createRadialGradient(0, y, 0, 0, y, .75 * s);
    shg.addColorStop(0, 'rgba(25,12,4,' + (.4 * a) + ')'); shg.addColorStop(1, 'rgba(25,12,4,0)'); g.fillStyle = shg; g.beginPath(); g.arc(0, y, .75 * s, 0, 6.283); g.fill(); g.restore();
  }

  /* ---------- text dwell: stamps and labels only (captions follow the voice, by design) ---------- */
  function TEXTS(t) {
    var out = [];
    STAMPS.forEach(function (s) { if (t >= s.t0 + .2 && t < s.t1) out.push({ id: s.id, text: s.text, x0: 0, y0: 0, x1: 0, y1: 0 }); });
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [{ t: T.hookPop, type: 'pop', g: .8 }, { t: T.rew0, type: 'rewind' }, { t: T.gauge, type: 'tick' }];
  DROPS.forEach(function (d) { if (d.k % 6 === 0) EV.push({ t: T.drops - .15 + d.k / DROPS.length * .55, type: 'blip', f: 900 + d.k * 18 }); });
  EV.push({ t: T.pct, type: 'thump' }, { t: T.heat, type: 'sizzle', t1: T.pop }, { t: T.boil, type: 'hiss', t1: T.pop });
  for (var kn = T.tough; kn < end('trap'); kn += .32) EV.push({ t: kn, type: 'knock' });
  for (var tk2 = T.climb; tk2 < T.nine + .2; tk2 += .11) EV.push({ t: tk2, type: 'tick' });
  EV.push({ t: T.nine, type: 'thump' }, { t: T.hot, type: 'thump' });
  for (var cr = T.gives - .1; cr < T.pop - .05; cr += .09) EV.push({ t: cr, type: 'creak' });
  EV.push({ t: T.pop, type: 'pop', g: 1.4, big: true }, { t: T.forty, type: 'thump' }, { t: T.notShell, type: 'tick' }, { t: T.escaping, type: 'hiss', t1: T.escaping + 1.2 });
  EV.push({ t: T.dud, type: 'rewind' }, { t: T.leaked, type: 'hiss', t1: T.leaked + 1.0, small: true });
  POPORDER.forEach(function (pi, n) { EV.push({ t: popTime(n), type: 'pop', g: .32 + .2 * hash(n), f: hash(n * 3) }); });
  RAIN.forEach(function (q, n) { EV.push({ t: q.t0 + .55, type: 'tick', g: .08 }); });
  EV.push({ t: T.home, type: 'rewind' }, { t: DUR - .45, type: 'tick' });

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { frame(ctx, t); return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- score: a light groove that steps aside for the voice and the pop ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.4), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .2; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], pts[0][0]); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], pts[k][0]); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(t0, rnd() * 2, dur); return s; }

    /* a pop: a short resonant thock plus a puff of air */
    function pop(t, g, f, big) {
      var o = ac.createOscillator(), og = ac.createGain(), f0 = (big ? 220 : 480 + 380 * (f || .5));
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * .45, t + .05);
      o.connect(og); og.connect(bus(1, big ? .35 : .15, big ? 0 : ((f || .5) - .5) * .9)); env(og.gain, [[t, 0], [t + .002, g * .7], [t + (big ? .25 : .07), 0]]); o.start(t); o.stop(t + .3);
      var n = noise(t, big ? .7 : .12), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = big ? 1400 : 2600; bp.Q.value = .8;
      var ng = bus(1, big ? .4 : .1); n.connect(bp); bp.connect(ng); env(ng.gain, [[t, 0], [t + .003, g * (big ? .9 : .5)], [t + (big ? .6 : .1), 0]]);
      if (big) { var s = ac.createOscillator(), sg = ac.createGain(); s.frequency.setValueAtTime(90, t); s.frequency.exponentialRampToValueAtTime(40, t + .35); s.connect(sg); sg.connect(bus(1, 0)); env(sg.gain, [[t, 0], [t + .005, .7], [t + .4, 0]]); s.start(t); s.stop(t + .45); }
    }
    function tick(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3800; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .25], [t + .025, 0]]); }
    function thump(t, g) { var o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + .16); o.connect(og); og.connect(bus(1, .1)); env(og.gain, [[t, 0], [t + .004, g || .35], [t + .25, 0]]); o.start(t); o.stop(t + .28); }
    function blip(t, f) { var o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + .06); o.connect(og); og.connect(bus(1, .3, (f - 1400) / 1400)); env(og.gain, [[t, 0], [t + .004, .08], [t + .09, 0]]); o.start(t); o.stop(t + .1); }
    function band(t0, t1, f0, f1, g0, g1, q) { var o = bus(1, .1), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + .2, g0], [t1 - .05, g1], [t1, 0]]); }
    function rewind(t) { band(t, t + .45, 600, 5200, .12, .2, 2); }
    function knock(t) { var o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(150, t + .04); o.connect(og); og.connect(bus(1, .2, (rnd() - .5) * .6)); env(og.gain, [[t, 0], [t + .002, .18], [t + .06, 0]]); o.start(t); o.stop(t + .08); }
    function creak(t) { var o = bus(1, .1), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700 + rnd() * 500; bp.Q.value = 12; var n = noise(t, .07); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .005, .5], [t + .06, 0]]); }
    EV.forEach(function (e) {
      if (e.type === 'pop') pop(e.t, e.g, e.f, e.big);
      else if (e.type === 'tick') tick(e.t, e.g || .22);
      else if (e.type === 'thump') thump(e.t, .3);
      else if (e.type === 'blip') blip(e.t, e.f);
      else if (e.type === 'rewind') rewind(e.t);
      else if (e.type === 'knock') knock(e.t);
      else if (e.type === 'creak') creak(e.t);
      else if (e.type === 'sizzle') band(e.t, e.t1, 5200, 7600, .03, .12, .5);
      else if (e.type === 'hiss') band(e.t, e.t1, e.small ? 3000 : 2200, e.small ? 3600 : 4200, e.small ? .05 : .04, e.small ? .03 : .16, 1.2);
    });

    /* music: 100 BPM in F, marimba-ish plucks, round bass, a shaker. Out for the pop, back for the payoff */
    var BEAT = .6, M0 = start('cooker') - .1;
    function mar(t, m, g, pan) {
      var c = ac.createOscillator(), mo = ac.createOscillator(), mg = ac.createGain(), og = ac.createGain();
      c.type = 'sine'; c.frequency.value = mtof(m); mo.frequency.value = mtof(m) * 4; mg.gain.value = mtof(m) * .8; mo.connect(mg); mg.connect(c.frequency);
      env(mg.gain, [[t, mtof(m) * .9], [t + .08, 0]]);
      c.connect(og); og.connect(bus(1, .25, pan)); env(og.gain, [[t, 0], [t + .003, g], [t + .35, 0]]); c.start(t); mo.start(t); c.stop(t + .4); mo.stop(t + .4);
    }
    function bass(t, m, dur, g) { var o = ac.createOscillator(), f = ac.createBiquadFilter(), og = ac.createGain(); o.type = 'triangle'; o.frequency.value = mtof(m); f.type = 'lowpass'; f.frequency.value = 600; o.connect(f); f.connect(og); og.connect(bus(1, 0)); env(og.gain, [[t, 0], [t + .01, g], [t + dur * .7, g * .5], [t + dur, 0]]); o.start(t); o.stop(t + dur + .02); }
    function shaker(t, g) { var o = bus(1, 0, .3), hp2 = ac.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 7000; var n = noise(t, .06); n.connect(hp2); hp2.connect(o); env(o.gain, [[t, 0], [t + .01, g], [t + .05, 0]]); }
    var CH = [[65, 69, 72, 76], [62, 65, 69, 72], [58, 62, 65, 69], [60, 64, 67, 70]];   // Fmaj7, Dm7, Bbmaj7, C7
    var RT = [41, 38, 34, 36];
    var off0 = T.pop - .35, on1 = T.burst + .05;
    for (var bt = M0, n = 0; bt < T.home + .2; bt += BEAT / 2, n++) {
      if (bt > off0 && bt < on1) continue;
      var bar = Math.floor(n / 8), chd = CH[bar % 4], late = bt > T.bowl ? 1.25 : bt > on1 ? 1.1 : 1;
      var build = bt < off0 ? .7 + .5 * seg(bt, start('steam'), off0) : 1;
      if (n % 2 === 0) mar(bt, chd[(n / 2) % 4] + 12, .06 * build * late, (n % 4 ? .35 : -.35));
      else if (n % 4 === 3) mar(bt, chd[(n + 1) % 4], .04 * build * late, -.2);
      if (n % 8 === 0) bass(bt, RT[bar % 4], BEAT * 3.6, .14 * late);
      if (n % 8 === 5) bass(bt, RT[bar % 4] + 7, BEAT * .9, .1 * late);
      shaker(bt, (n % 2 ? .05 : .08) * build);
    }
    /* a rising line into the pop, then nothing but the pop */
    var rise = ac.createOscillator(), rg = ac.createGain(), rf = ac.createBiquadFilter(); rise.type = 'sawtooth'; rf.type = 'lowpass'; rf.frequency.value = 900;
    rise.connect(rf); rf.connect(rg); rg.connect(bus(1, .3)); env(rise.frequency, [[T.hot, mtof(53)], [T.pop, mtof(65)]]); env(rg.gain, [[T.hot, 0], [T.pop - .15, .05], [T.pop - .02, 0]]); rise.start(T.hot); rise.stop(T.pop);
    /* the button: a chord on the last word, then one tick that becomes the loop */
    [65, 69, 72, 77].forEach(function (m, j) { mar(T.home - .05 + j * .03, m + 12, .07, j % 2 ? .3 : -.3); });
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    buildKernel(); buildSection(); buildFlakeSprites();
    var fonts = ['800 84px Archivo', '700 46px Archivo', '600 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×'); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: T.forty + .6, SLUG: 'pop', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
