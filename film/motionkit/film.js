/* Motion kit reel: every piece of film/kit/kit.js on screen once, 9:16, about 40 s, sound effects only.
   Four hooks built for the first three seconds of a Short, the 18 stickman moves, kinetic text, emotes and markup,
   and the seven transitions (each scene arrives through one). Every scene's top chip names the pieces, so a film
   can ask for them by name. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). */
(function () {
  'use strict';
  var K = window.KIT, C = K.C, W = 1080, H = 1920, INK = C.INK;
  var clamp = K.clamp, lerp = K.lerp, seg = K.seg, eo = K.eo, eio = K.eio, ss = K.ss, pop = K.pop, knock = K.knock, P = K.pose;
  var cv, ctx;

  /* ---------- helpers ---------- */
  function bg(g, col, t, o) {
    o = o || {}; g.fillStyle = col; g.fillRect(-W, -H, W * 3, H * 3);
    /* slow diagonal stripes, so even a held frame keeps moving */
    g.save(); g.globalAlpha = o.a || .07; g.fillStyle = o.stripe || '#000'; g.translate((t * 40) % 140, 0); g.rotate(-.5);
    for (var x = -2400; x < 2400; x += 140) g.fillRect(x, -2400, 60, 4800);
    g.restore();
  }
  function floor(g, y, col) { g.fillStyle = col || 'rgba(0,0,0,.18)'; g.fillRect(-W, y, W * 3, H); g.fillStyle = INK; g.fillRect(-W, y - 4, W * 3, 8); }
  function fit(g, s, px, maxW) { var w = K.measure(g, s, px); return w > maxW ? Math.floor(px * maxW / w) : px; }
  function chips(g, a, b) {
    K.chip(g, a, 70, 96, 26);
    if (b) K.chip(g, b, W - 70, 96, 26, { align: 'right', bg: INK, col: C.CREAM });
  }
  function label(g, s, x, y) { K.chip(g, s, x, y, 24, { align: 'center', bg: 'rgba(244,237,224,.92)' }); }
  function peel(g, x, y, rot, s) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    [[-1, -.5], [1, .5], [0, 0]].forEach(function (p) { g.save(); g.rotate(p[1] * .9); g.beginPath(); g.ellipse(p[0] * 26, -6, 34, 13, p[1], 0, 6.283); K.fillStroke(g, C.YEL, 5); g.restore(); });
    K.circ(g, 0, -14, 9); K.fillStroke(g, '#7a5a2a', 4); g.restore();
  }
  function phone(g, t) {
    g.save(); g.translate(-6, -40); g.rotate(-.18);
    K.rr(g, -40, -74, 80, 148, 16); K.fillStroke(g, '#2a2638', 5);
    K.rr(g, -32, -62, 64, 124, 9); g.fillStyle = '#16131f'; g.fill();
    K.rr(g, -20, -22, 34, 18, 3); K.fillStroke(g, null, 3, '#fff'); g.fillStyle = '#fff'; g.fillRect(14, -17, 4, 8);
    g.fillStyle = C.RED; g.fillRect(-17, -19, 3 + (Math.floor(t * 3) % 2), 12);
    K.font(g, 24, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C.RED; g.fillText('1%', -2, 20);
    g.restore();
  }

  /* ---------- scenes ---------- */
  var DUDE = { seed: 1 };
  var STICK = { style: 'stick', seed: 3 };
  var MATE = { col: C.GREEN, shade: '#46955a', seed: 4, hat: 'cap', capCol: '#2f6f4a' };
  var BLUEY = { col: C.BLUE, shade: '#2c5fd0', seed: 6, hat: 'beanie', capCol: C.YEL };

  /* HOOK 1: frame 0 is already moving. He sprints in on focus lines, skids, and the words slam down beside him. */
  function sHook(g, t, u) {
    bg(g, C.BLUE, t, { stripe: '#fff', a: .05 });
    var x = lerp(150, 560, eo(seg(u, 0, .62))), run = u < .55, fy = 1520, s = 1.85;
    var sh = K.shake(t, 0 + sHook.t0 + .95, 22, .4), z = K.punch(t, sHook.t0 + .95, .07);
    g.save(); K.applyCam(g, W, H, { z: z, x: sh.x, y: sh.y, r: sh.r });
    K.speedLines(g, W, H, x, 1050, t, 1 - ss(seg(u, .5, .9)), { col: C.CREAM, r0: 420 });
    floor(g, fy, 'rgba(10,20,80,.25)');
    /* floor dashes scroll with his speed */
    g.fillStyle = INK; var off = -(x - 150) * 2.4;
    for (var i = -2; i < 8; i++) { var dx = ((i * 220 + off) % 1540 + 1540) % 1540 - 230; g.fillRect(dx, fy + 60, 90, 10); }
    if (run) {
      K.streaks(g, x - 140, 1220, 260, 420, t, 1, { col: C.CREAM });
      K.guy(g, x, fy, s, K.ACT.run.pose(u, { T: .36 }), DUDE, t);
    } else if (u < .9) {
      K.guy(g, x, fy, s, K.keys(u, [[.55, K.ACT.run.pose(.55, { T: .36 }), .01], [.55, { lean: -.3, lf: [52, 0], rf: [92, 0], lh: [-110, -250], rh: [-70, -262], mouth: 'O', eyes: 'wide', hip: 30, jump: 0, tilt: 0, brow: 1 }, .12]]), DUDE, t);
      K.dust(g, x + 120, fy, u - .55, 1.4);
    } else K.actor(g, x, fy, s, 'takeback', u - .9, DUDE, t);
    var fs = fit(g, 'STICKMEN', 150, 940);
    K.slam(g, 'STICKMEN', W / 2, 360, fs, u - .12, { col: C.CREAM });
    if (u > .95) K.burst(g, 650, 570, 190 * pop(u, .95, 3, .5), u, C.YEL, null);
    K.popWords(g, ['BUT', '*FAST.'], W / 2, 570, 120, u - .7, { times: [0, .25], maxW: 1000 });
    g.restore();
    K.flash(g, W, H, u - .95, .5);
    chips(g, 'HOOK 1 · RUN-IN + SLAM');
  }
  sHook.sfx = [[0, 'whoosh', { d: .5 }], [.12, 'slam'], [.52, 'squeak'], [.7, 'pop'], [.94, 'slam', { g: 1.2 }], [.97, 'boing']];

  /* HOOK 2: he slips on a peel; the frame freezes mid-air with a record scratch and a caption; then he lands. */
  function sFreeze(g, t, u) {
    var F0 = 1.28, F1 = 2.4, frozen = u >= F0 && u < F1, v = u < F0 ? u : u < F1 ? F0 : u - (F1 - F0);
    var fy = 1480, s = 1.6;
    var z = frozen ? 1 + .14 * ss(seg(u, F0, F1)) : u >= F1 ? 1.14 - .14 * eo(seg(u, F1, F1 + .3)) : 1;
    g.save(); K.applyCam(g, W, H, { z: z, cx: 560, cy: 1180 });
    bg(g, C.YEL, frozen ? sFreeze.t0 + F0 : t, { a: .06 });
    floor(g, fy, 'rgba(120,70,0,.18)');
    var x = v < 1 ? 150 + 330 * v : 480 + 140 * eo(seg(v, 1, 1.6)), tf = sFreeze.t0 + v;   /* the clock stops too: no line boil in the freeze */
    if (v < 1.02) K.actor(g, x, fy, s, 'walk', v, Object.assign({ emote: false }, DUDE), tf);
    else { var fp = K.ACT.fall.pose(v - 1.02, {}); K.guy(g, x, fy, s, fp, DUDE, tf); var h = K.head(x, fy, s, fp, DUDE);
      if (v - 1.02 > .5) { K.impact(g, h[0], fy - 40, v - 1.57, 1.6, INK); K.emote(g, 'stars', h[0], h[1] - 90, 1.3, v - 1.75, tf); } }
    /* the peel: waits on the floor, then flies */
    var pv = v - 1.0;
    if (pv < 0) peel(g, 560, fy - 10, .1, 1.3);
    else peel(g, 560 + 520 * pv, fy - 10 - 900 * pv + 1500 * pv * pv, pv * 14, 1.3);
    g.restore();
    if (u >= F0) { if (frozen) K.freezeFX(g, W, H, u - F0); }
    if (frozen) {
      K.popWords(g, ['yep.', "that's", '*me.'], W / 2, 520, 120, u - F0 - .15, { gap: .2, out: F1 - F0 - .3 });
      var bar = eo(seg(u, F0, F0 + .15)) * (1 - eio(seg(u, F1 - .15, F1)));
      g.fillStyle = '#000'; g.fillRect(0, 0, W, 150 * bar); g.fillRect(0, H - 150 * bar, W, 150 * bar);
    }
    chips(g, 'HOOK 2 · FREEZE FRAME', 'in: whip');
  }
  sFreeze.sfx = [[.1, 'tick', { g: .1 }], [.55, 'tick', { g: .1 }], [1.0, 'squeak'], [1.28, 'scratch'], [1.3, 'shutter'], [1.45, 'pop'], [1.65, 'pop'], [1.85, 'pop', { g: 1.2 }], [2.4, 'whoosh', { d: .2 }], [2.95, 'thud', { g: 1.3 }], [3.1, 'sparkle', { g: .6 }]];

  /* HOOK 3: the camera snaps onto the thing that matters, circles it, then snaps back to the panic. */
  function sZoom(g, t, u) {
    var x = 540, fy = 1560, s = 1.7, hold = [null, phone];
    var Pp = u < 1.9 ? P({ rh: [70, -250], lh: [-40, -200], front: 1, look: [.5, .5], tilt: .12, eyes: u > .55 ? 'wide' : 'dot', mouth: u > .55 ? 'O' : 'smile', brow: u > .55 ? 2 : 0 }) : null;
    var hp = K.toScreen(x, fy, s, Pp || K.BASE, DUDE, 70, -250), px = hp[0] - 10 * s, py = hp[1] - 40 * s;
    var e = u < 1.7 ? eo(seg(u, .5, .7)) : 1 - eo(seg(u, 1.7, 1.9)), z = 1 + 2.3 * e;
    var sh = K.shake(t, sZoom.t0 + .52, 14, .25);
    g.save(); K.applyCam(g, W, H, { z: z, cx: px, cy: py, x: (540 - px) * e + sh.x, y: (900 - py) * e + sh.y });
    bg(g, C.MINT, t, { a: .07 });
    floor(g, fy, 'rgba(0,60,40,.18)');
    if (Pp) K.guy(g, x, fy, s, Pp, Object.assign({ hold: hold }, MATE), t);
    else K.actor(g, x, fy, s, 'panic', u - 1.9, Object.assign({ hold: hold }, MATE), t);
    if (u < 1.9) K.scribble(g, px - 2, py + 22 * s, 46 * s, 30 * s, eio(seg(u, .72, 1.05)), C.RED, 7, 2);
    g.restore();
    K.popWords(g, ['YOUR', 'PHONE', 'AT', '*1%'], W / 2, 430, 120, u - 1.95, { gap: .1 });
    chips(g, 'HOOK 3 · ZOOM PUNCH + CIRCLE', 'in: iris');
  }
  sZoom.sfx = [[.45, 'whoosh', { d: .2 }], [.52, 'slam', { g: .8 }], [.72, 'swish'], [1.68, 'whoosh', { d: .2 }], [1.95, 'pop'], [2.05, 'pop'], [2.15, 'pop'], [2.25, 'pop', { g: 1.3 }]];

  /* HOOK 4: a number rolls to something huge and lands with his head exploding. */
  function sCount(g, t, u) {
    var sh = K.shake(t, sCount.t0 + 1.72, 26, .45);
    g.save(); K.applyCam(g, W, H, { z: K.punch(t, sCount.t0 + 1.72, .06), x: sh.x, y: sh.y });
    bg(g, C.PURPLE, t, { stripe: '#fff', a: .05 });
    K.speedLines(g, W, H, 540, 560, t, .5 * ss(seg(u, 1.72, 1.8)) * (1 - seg(u, 2.4, 2.9)), { col: C.YEL, r0: 380 });
    K.popWords(g, ['VIEWS', 'IN', '*24', 'HOURS'], W / 2, 330, 72, u - .05, { gap: .07 });
    K.counter(g, 0, 1000000, W / 2, 560, fit(g, '1,000,000', 150, 960), u - .2, 1.5, { col: C.CREAM });
    floor(g, 1580, 'rgba(30,0,80,.2)');
    if (u < 1.1) K.guy(g, 540, 1580, 1.8, P({ look: [0, -1], eyes: u > .6 ? 'wide' : 'dot', mouth: u > .6 ? 'o' : 'smile', tilt: -.06 }), BLUEY, t);
    else K.actor(g, 540, 1580, 1.8, 'mindblown', u - 1.1, BLUEY, t);
    g.restore();
    K.flash(g, W, H, u - 1.72, .6);
    chips(g, 'HOOK 4 · NUMBER ROLL + HEAD POP', 'in: bars');
  }
  sCount.sfx = [[.05, 'pop', { g: .7 }], [.2, 'ratchet', { t1: 1.68 }], [1.7, 'slam', { g: 1.3 }], [1.72, 'boing'], [1.8, 'sparkle']];

  /* ACTIONS: six moves per page, each with its signature emote */
  var PAGES = [
    { name: 'MOVES 1/3', tr: 'splat', col: C.NIGHT, o: DUDE, acts: ['walk', 'run', 'jump', 'wave', 'point', 'present'] },
    { name: 'MOVES 2/3 · CLASSIC STICK', tr: 'slam', col: '#2b2d42', o: STICK, acts: ['shrug', 'facepalm', 'think', 'confused', 'celebrate', 'dance'] },
    { name: 'MOVES 3/3', tr: 'spin', col: C.DUSK, o: null, acts: ['takeback', 'mindblown', 'panic', 'sneak', 'fall', 'dizzy'] }
  ];
  var COSTUME3 = [DUDE, BLUEY, MATE, DUDE, BLUEY, MATE];
  var MOVING = { walk: 1, run: 1, sneak: 1, panic: 1 };
  function pageScene(pg, pi) {
    function draw(g, t, u) {
      bg(g, pg.col, t, { stripe: '#fff', a: .04 });
      pg.acts.forEach(function (name, i) {
        var col = i % 2, row = Math.floor(i / 2), cx = col ? 810 : 270, fy = 640 + row * 540, s = .82;
        var stick = pg.o === STICK;
        g.fillStyle = stick ? C.CREAM : INK; g.fillRect(cx - 230, fy - 3, 460, 6);
        if (MOVING[name]) { g.fillStyle = 'rgba(244,237,224,.35)'; var sp = name === 'run' || name === 'panic' ? 900 : name === 'walk' ? 260 : 110; for (var d = 0; d < 4; d++) { var dx = (((d * 120 - u * sp) % 480) + 480) % 480 - 240; g.fillRect(cx + dx, fy + 22, 50, 6); } }
        var o = Object.assign({}, pg.o || COSTUME3[i]); if (stick) { o.seed = 3 + i; }
        var start = K.ACT[name].loop ? 0 : .3, x = cx + (name === 'fall' ? 110 : name === 'takeback' ? 30 : 0);
        g.save(); g.beginPath(); g.rect(cx - 270, fy - 520, 540, 600); g.clip();
        K.actor(g, x, fy, s, name, u - start, o, t);
        g.restore();
        label(g, name, cx, fy + 62);
      });
      chips(g, pg.name, 'in: ' + pg.tr);
    }
    draw.sfx = [];
    pg.acts.forEach(function (name, i) {
      var st = .3;
      if (name === 'jump') draw.sfx.push([.2 + .22, 'boing', { g: .6 }], [.2 + .78, 'thud', { g: .5 }]);
      if (name === 'present') draw.sfx.push([st + .45, 'sparkle', { g: .7 }]);
      if (name === 'facepalm') draw.sfx.push([st + .28, 'thud', { g: .35 }]);
      if (name === 'think') draw.sfx.push([st + 1.2, 'ding', { g: .7 }]);
      if (name === 'takeback') draw.sfx.push([st + .15, 'squeak', { g: .8 }]);
      if (name === 'mindblown') draw.sfx.push([st + .6, 'slam', { g: .6 }]);
      if (name === 'fall') draw.sfx.push([st + .55, 'thud', { g: .6 }]);
    });
    return draw;
  }

  /* KINETIC TEXT: seven ways to put a word on screen */
  function sText(g, t, u) {
    bg(g, C.DUSK, t, { stripe: '#fff', a: .04 });
    var rows = [300, 540, 780, 1020, 1260, 1500, 1740];
    ['typeOn', 'popWords', 'slam', 'stretch', 'wobble', 'marker', 'counter'].forEach(function (n, i) { if (u > i * .5) K.chip(g, n, 70, rows[i] - 100, 22, { bg: 'rgba(244,237,224,.18)', col: C.CREAM }); });
    K.typeOn(g, 'how does wifi work?', W / 2, rows[0], 66, u - .1, { cps: 24 });
    K.popWords(g, ["it's", '*literally', 'radio'], W / 2, rows[1], 86, u - .5);
    var sh = K.shake(t, sText.t0 + 1.0, 10, .25);
    g.save(); g.translate(sh.x, sh.y); K.slam(g, 'NOPE.', W / 2, rows[2], 130, u - 1.0, { col: C.RED }); g.restore();
    K.stretch(g, 'BOING', W / 2, rows[3], 120, u - 1.5, { col: C.MINT });
    K.wobble(g, 'wavy wifi', W / 2, rows[4], 100, t, u - 2.0, { col: C.SKY });
    var mw = K.measure(g, 'the key part', 84) + 50;
    K.marker(g, W / 2 - mw / 2, rows[5], mw, 110, seg(u, 2.5, 2.85), C.YEL);
    if (u > 2.45) K.sticker(g, 'the key part', W / 2, rows[5], 84, { col: C.CREAM });
    K.counter(g, 0, 99, W / 2, rows[6], 130, u - 3.0, .9, { suf: '%', col: C.YEL });
    chips(g, 'KINETIC TEXT', 'in: zoom');
  }
  sText.sfx = (function () { var a = []; for (var i = 0; i < 19; i++) a.push([.1 + i / 24, 'key', { g: .7 }]); return a.concat([[.5, 'pop'], [.62, 'pop', { g: 1.2 }], [.74, 'pop'], [1.0, 'slam'], [1.5, 'boing'], [2.0, 'swish'], [2.5, 'swish', { g: .7 }], [3.0, 'ratchet', { t1: 3.85 }], [3.9, 'ding', { g: .6 }]]); })();

  /* EMOTES + MARKUP: eleven emotes, a burst, and the circle-and-arrow callout */
  function sEmotes(g, t, u) {
    bg(g, '#1f6f80', t, { stripe: '#fff', a: .05 });
    var list = K.EMOTES.concat(['burst']);
    list.forEach(function (n, i) {
      var cx = 165 + (i % 4) * 250, cy = 340 + Math.floor(i / 4) * 290, uu = u - .15 - i * .1;
      if (uu < 0) return;
      g.save(); g.fillStyle = 'rgba(0,0,0,.16)'; K.rr(g, cx - 110, cy - 150, 220, 250, 26); g.fill(); g.restore();
      if (n === 'burst') K.burst(g, cx, cy - 40, 95 * pop(uu, 0, 3, .5), uu, C.YEL, 'POW');
      else K.emote(g, n, cx + (n === 'stars' || n === 'dots' ? 0 : 0), cy + (n === 'stars' ? -40 : n === 'dots' ? 10 : 20), 1.05, uu, t);
      label(g, n, cx, cy + 135);
    });
    K.guy(g, 540, 1760, 1.15, K.ACT.think.pose(u), STICK, t);
    var th = K.head(540, 1760, 1.15, K.ACT.think.pose(u), STICK);
    if (u > .35) K.emote(g, u > 1.6 ? 'bulb' : 'dots', th[0] + 90, th[1] - 80, 1.1, u > 1.6 ? u - 1.6 : u - .35, t);
    K.scribble(g, 540, 1530, 240, 300, eio(seg(u, 2.0, 2.4)), C.YEL, 10, 4);
    K.arrow(g, 930, 1180, 790, 1390, eo(seg(u, 2.35, 2.7)), C.CREAM, 11, .35);
    if (u > 2.6) K.sticker(g, 'this guy', 880, 1130, 62, { col: C.CREAM, rot: .08 });
    chips(g, 'EMOTES + MARKUP', 'in: whip');
  }
  sEmotes.sfx = (function () { var a = []; for (var i = 0; i < 12; i++) a.push([.15 + i * .1, 'pop', { g: .55 + (i % 3) * .2 }]); return a.concat([[1.6, 'ding', { g: .7 }], [2.0, 'swish'], [2.35, 'swish', { g: .6 }], [2.6, 'pop']]); })();

  /* TRANSITIONS: seven cards, each named after the transition that brought it in */
  var CARDS = [['iris', C.RED, 'wave'], ['whip', C.BLUE, 'run'], ['bars', C.NIGHT, 'dance'], ['splat', C.PINK, 'takeback'], ['zoom', C.MINT, 'present'], ['slam', C.YEL, 'celebrate'], ['spin', C.PURPLE, 'dizzy']];
  function cardScene(c, i) {
    function draw(g, t, u) {
      bg(g, c[1], t, { stripe: '#fff', a: .06 });
      K.sticker(g, c[0].toUpperCase(), W / 2, 520, fit(g, c[0].toUpperCase(), 230, 900), { col: C.CREAM, rot: -.04 });
      K.chip(g, "KIT.tr('" + c[0] + "')", W / 2, 700, 30, { align: 'center', bg: INK, col: C.CREAM });
      floor(g, 1560, 'rgba(0,0,0,.14)');
      K.actor(g, 540, 1560, 1.5, c[2], u + (K.ACT[c[2]].loop ? 0 : .1), i % 2 ? STICK : DUDE, t);
      chips(g, 'TRANSITIONS ' + (i + 1) + '/7');
    }
    return draw;
  }

  /* END: confetti and the count */
  function sEnd(g, t, u) {
    bg(g, C.YEL, t, { a: .06 });
    floor(g, 1640, 'rgba(120,70,0,.16)');
    K.actor(g, 540, 1640, 1.6, 'celebrate', u, DUDE, t);
    K.slam(g, 'MOTION KIT', W / 2, 360, fit(g, 'MOTION KIT', 150, 960), u - .1, { col: C.CREAM });
    [['*18', 'moves'], ['*11', 'emotes'], ['*7', 'transitions'], ['*18', 'sound effects']].forEach(function (w, i) {
      K.popWords(g, w, W / 2, 540 + i * 100, 70, u - .45 - i * .18, { hot: C.RED, gap: .08 });
    });
    K.chip(g, 'film/kit/kit.js', W / 2, 960, 26, { align: 'center', bg: INK, col: C.CREAM });
    K.confetti(g, 540, 1250, u - .1, 110, 5);
    K.confetti(g, 200, 1500, u - .5, 50, 11, .8);
    K.confetti(g, 880, 1500, u - .7, 50, 12, .8);
  }
  sEnd.sfx = [[.1, 'slam'], [.12, 'cheer'], [.45, 'pop'], [.63, 'pop'], [.81, 'pop'], [.99, 'pop'], [1.0, 'sparkle'], [1.6, 'sparkle', { g: .6 }]];

  /* ---------- the timeline ---------- */
  var SCENES = [
    { id: 'hook', name: 'Hook 1 · run-in + slam', dur: 2.9, draw: sHook },
    { id: 'freeze', name: 'Hook 2 · freeze frame', dur: 3.4, draw: sFreeze, tr: 'whip', trDur: .45 },
    { id: 'zoom', name: 'Hook 3 · zoom punch', dur: 3.2, draw: sZoom, tr: 'iris', trDur: .6, trOpt: { x: 540, y: 900 } },
    { id: 'count', name: 'Hook 4 · number roll', dur: 3.0, draw: sCount, tr: 'bars', trDur: .7 }
  ];
  PAGES.forEach(function (pg, i) { SCENES.push({ id: 'moves' + (i + 1), name: 'Moves ' + (i + 1) + '/3', dur: 3.3, draw: pageScene(pg, i), tr: pg.tr, trDur: pg.tr === 'slam' ? .7 : .6, trOpt: { x: 540, y: 1300, col: C.PINK } }); });
  SCENES.push({ id: 'text', name: 'Kinetic text', dur: 4.6, draw: sText, tr: 'zoom', trDur: .5 });
  SCENES.push({ id: 'emotes', name: 'Emotes + markup', dur: 3.4, draw: sEmotes, tr: 'whip', trDur: .45, trOpt: { dir: -1 } });
  CARDS.forEach(function (c, i) { SCENES.push({ id: 'tr-' + c[0], name: 'Transition · ' + c[0], dur: 1.0, draw: cardScene(c, i), tr: c[0], trDur: c[0] === 'slam' ? .6 : c[0] === 'iris' ? .55 : .45, trOpt: { x: 540, y: 1150 } }); });
  SCENES.push({ id: 'end', name: 'End', dur: 3.0, draw: sEnd, tr: 'iris', trDur: .6, trOpt: { shape: 'star', x: 540, y: 1100 } });
  var FILMK = K.film({ W: W, H: H, scenes: SCENES }), DUR = FILMK.DUR;
  SCENES.forEach(function (s) { s.draw.t0 = s.t0; });
  var SHOTS = SCENES.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });

  /* ---------- sound cues ---------- */
  var TRSFX = { whip: [[-.15, 'whoosh', { d: .3 }]], iris: [[-.3, 'zip'], [.05, 'pop']], bars: [[-.3, 'swish'], [.08, 'swish', { g: .7 }]], splat: [[-.22, 'splat']], zoom: [[-.25, 'whoosh', { d: .25 }], [0, 'thud', { g: .6 }]], slam: [[0, 'slam']], spin: [[-.22, 'whoosh', { d: .4 }]] };
  var EV = [];
  SCENES.forEach(function (s) {
    (s.draw.sfx || []).forEach(function (e) { EV.push(Object.assign({ t: s.t0 + e[0], type: e[1] }, e[2] || {}, e[2] && e[2].t1 != null ? { t1: s.t0 + e[2].t1 } : {})); });
    if (s.tr && TRSFX[s.tr]) TRSFX[s.tr].forEach(function (e) { EV.push(Object.assign({ t: s.t0 + e[0], type: e[1] }, e[2] || {})); });
  });
  EV = EV.filter(function (e) { return e.t >= 0 && e.t < DUR; }).sort(function (a, b) { return a.t - b.t; });

  function TEXTS() { return []; }
  function SCORE(ac) { K.score(ac, EV, DUR); }

  /* ---------- boot ---------- */
  function render(t, samples, shutter, fps) { FILMK.render(ctx, t, samples, shutter, fps); }
  function init(canvas) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    return Promise.all(K.FONTS.map(function (f) { return document.fonts.load(f, 'Aa0%?!·'); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: SCENES[0].t0 + 1.25, SLUG: 'motion-kit-reel', SHOTS: SHOTS, init: init, render: render, LIVE: {} };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
