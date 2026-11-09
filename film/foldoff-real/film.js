/* "The Fold-Off (realistic)" — the same script, voices and cuts as ../foldoff/, with a photoreal still for every
   shot instead of the stickman drawings. The stills were made with SDXL 1.0 base (CreativeML Open RAIL++-M) in
   ComfyUI on Isac's PC; every person and robot in them is generated and made up. The motion is ours: a push or
   drift on every shot, handheld wobble, zoom punches and shakes on the hits, plus the same show chrome (name slams,
   the counter, stamps, captions). No lip sync: that needs a paid video model.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Pure function of t. */
(function () {
  'use strict';
  var K = window.KIT, C = K.C, W = 1080, H = 1920, INK = C.INK, VO = window.VO;
  var clamp = K.clamp, lerp = K.lerp, seg = K.seg, eo = K.eo, eio = K.eio, pop = K.pop, knock = K.knock;
  var cv, ctx, IMG = {};
  var CASH = '#3dff7a', NEONC = '#2fe0ff', PURP = '#b78bff', AMBER = '#ffb02e';
  var NAMES = ['wide', 'money', 'host', 'host2', 'shirt', 'june', 'juneCU', 'juneSmile', 'yap', 'essay', 'dream', 'six', 'safe', 'cctv', 'wrapped', 'wins'];

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function at(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (word == null) return l.t0; if (typeof word === 'number') return l.words[word].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }

  /* ---------- helpers ---------- */
  function fit(g, s, px, maxW) { var w = K.measure(g, s, px); return w > maxW ? Math.floor(px * maxW / w) : px; }
  function txt(g, s, x, y, px, col, wt, align, fam) { K.font(g, px, wt || 800, fam); g.textAlign = align || 'center'; g.textBaseline = 'middle'; g.fillStyle = col || C.CREAM; g.fillText(s, x, y); }
  /* a photo shot: cover-fit, zoom z0 → z1 over the shot around focus (fx, fy in 0..1 of the image), drift dx,
     handheld wobble, optional shake {t0, amp} and punch time. Pure function of t. */
  function photo(g, name, t, u, dur, o) {
    o = o || {}; var im = IMG[name]; if (!im) return;
    var k = eio(clamp(u / Math.max(.4, dur), 0, 1)), z = lerp(o.z0 || 1.04, o.z1 || 1.12, k);
    if (o.punch != null) z *= K.punch(t, o.punch, o.pamt || .07);
    var cover = Math.max(W / im.width, H / im.height) * z, iw = im.width * cover, ih = im.height * cover;
    var fx = o.fx == null ? .5 : o.fx, fy = o.fy == null ? .5 : o.fy;
    /* keep the focus point at the same screen spot it would have at zoom 1, clamped so the frame stays covered */
    var sx = W * (o.sx == null ? .5 : o.sx), sy = H * (o.sy == null ? .45 : o.sy);
    var x = sx - fx * iw + (o.dx || 0) * k, y = sy - fy * ih + (o.dy || 0) * k;
    var hx = Math.sin(t * 1.7 + 1) * 5 + Math.sin(t * 3.1) * 2.5, hy = Math.cos(t * 1.3) * 5 + Math.sin(t * 2.7 + 2) * 2;
    var sh = o.shake ? K.shake(t, o.shake[0], o.shake[1], o.shake[2] || .4) : { x: 0, y: 0, r: 0 };
    x = clamp(x + hx + sh.x, W - iw, 0); y = clamp(y + hy + sh.y, H - ih, 0);
    g.save(); if (sh.r) { g.translate(W / 2, H / 2); g.rotate(sh.r); g.translate(-W / 2, -H / 2); }
    if (o.filter) g.filter = o.filter;
    g.drawImage(im, x, y, iw, ih); g.restore();
    /* grade: a soft vignette and a darker band under the captions so the type reads on any photo */
    var vg = g.createRadialGradient(W / 2, H * .45, H * .3, W / 2, H * .5, H * .78); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    var lb = g.createLinearGradient(0, H * .7, 0, H); lb.addColorStop(0, 'rgba(0,0,0,0)'); lb.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = lb; g.fillRect(0, H * .7, W, H * .3);
  }
  function dollars(g, x, y, px, u, dur, o) { K.counter(g, 0, 1000000, x, y, px, u, dur, Object.assign({ pre: '$', col: CASH }, o || {})); }
  function nameTag(g, role, name, col, u, y) {
    if (u < 0) return; y = y || 1270;
    var k = pop(u, 0, 3, .55); g.save(); g.translate(W / 2, y - 92); g.scale(k, k); K.chip(g, role, 0, 0, 30, { align: 'center', bg: C.CREAM }); g.restore();
    K.slam(g, name, W / 2, y, fit(g, name, 140, 940), u - .06, { col: col });
  }
  function stamp(g, s, col, x, y, u, rot, px) {
    var k = pop(u, 0, 3, .5); if (k <= 0) return; px = px || 96;
    var w = K.measure(g, s, px) + 90;
    g.save(); g.translate(x, y); g.rotate(rot || -.1); g.scale(k * (1 + .5 * (1 - Math.min(1, k))), k);
    K.rr(g, -w / 2, -px * .95, w, px * 1.9, 22); g.lineWidth = 14; g.strokeStyle = col; g.stroke();
    txt(g, s, 0, 6, px, col, 900); g.restore();
  }
  function stepChip(g, n, u) {
    var k = pop(u, .1, 3, .5); if (k <= 0) return; g.save(); g.translate(W / 2, 330); g.scale(k, k); g.rotate(-.04);
    K.rr(g, -300, -80, 600, 160, 30); K.fillStroke(g, '#14122a', 8); txt(g, 'STEP ' + n + ' / 40', 0, 6, 92, NEONC, 900); g.restore();
  }
  function cctvOverlay(g, t) {
    g.save(); g.globalAlpha = .14; g.fillStyle = '#000'; for (var y = 0; y < H; y += 6) g.fillRect(0, y, W, 2); g.restore();
    txt(g, 'CAM 03', 70, 120, 40, '#fff', 500, 'left', '"Geist Mono"');
    var s = Math.floor(t * 30), ts = '2026-11-04 14:32:' + ('0' + (7 + Math.floor(t) % 50)).slice(-2) + ':' + ('0' + s % 30).slice(-2);
    txt(g, ts, W - 70, 120, 34, '#fff', 500, 'right', '"Geist Mono"');
    if (Math.floor(t * 2) % 2 === 0) { K.circ(g, 90, 190, 14); g.fillStyle = '#ff2a2a'; g.fill(); }
    txt(g, 'REC', 118, 190, 34, '#fff', 500, 'left', '"Geist Mono"');
  }

  /* ---------- karaoke captions, coloured by speaker ---------- */
  var HOT = { three: 1, million: 1, one: 1, shirt: 1, sixty: 1, forty: 1, fold: 1, six: 1, seven: 1, sleeves: 1, absolutely: 1, safety: 1, wrapped: 1, zero: 1, grandma: 1, done: 1, perfect: 1 };
  var WHO = { open: 'host', task: 'host', r1: 'host', r2: 'host', r3: 'host', zero: 'host', wins: 'host', june: 'june', just: 'june', sleeves: 'june', done: 'june', yap1: 'yap', yap2: 'yap', yap3: 'yap', dream1: 'dream', dream2: 'dream', safe: 'safe' };
  var CAPCOL = { host: C.CREAM, june: '#f3c6ff', yap: '#bff6ff', dream: '#e2d2ff', safe: '#ffe1a8' };
  var CHUNKS = [];
  VO.lines.forEach(function (l) {
    var ws = l.words, cur = [];
    ws.forEach(function (w, i) {
      cur.push({ w: w.w.toUpperCase(), t0: w.t0, t1: w.t1, hot: !!HOT[norm(w.w)] });
      if (/[.,!?]$/.test(w.w) || cur.length >= 3 || i === ws.length - 1) { cur.who = WHO[l.id]; CHUNKS.push(cur); cur = []; }
    });
  });
  CHUNKS.forEach(function (c, i) { var nx = CHUNKS[i + 1]; c.a = c[0].t0 - .06; c.b = nx ? Math.min(nx[0].t0 - .06, c[c.length - 1].t1 + .5) : c[c.length - 1].t1 + .6; });
  function captions(g, t) {
    for (var i = 0; i < CHUNKS.length; i++) {
      var c = CHUNKS[i]; if (t < c.a || t >= c.b) continue;
      var px = fit(g, c.map(function (w) { return w.w; }).join('  '), 84, 940), spc = px * .55;
      var ws = c.map(function (w) { return K.measure(g, w.w, px); }), tw = ws.reduce(function (a, b) { return a + b; }, 0) + spc * (c.length - 1), cx = W / 2 - tw / 2;
      c.forEach(function (w, j) {
        var k = pop(t, w.t0 - .02, 4, .55), on = t >= w.t0 && t < w.t1 + .05;
        if (k > 0) { g.save(); g.translate(cx + ws[j] / 2, 1560); var sc = k * (on ? 1.1 : 1); g.scale(sc, sc); K.sticker(g, w.w, 0, 0, px, { col: w.hot ? C.YEL : CAPCOL[c.who], lw: px * .17 }); g.restore(); }
        cx += ws[j] + spc;
      });
    }
  }

  /* ================= shots ================= (g, t, u, t0, dur) */
  var S = {};
  S.wide = function (g, t, u, t0, d) { photo(g, 'wide', t, u, d, { z0: 1.35, z1: 1.05, fy: .55 }); K.popWords(g, ['3', '*ROBOTS'], W / 2, 330, 150, u - .05, { gap: .15 }); };
  S.wide.sfx = function (t0) { return [[t0, 'whoosh', { d: .4 }], [t0 + .05, 'slam'], [t0 + .2, 'slam', { g: .8 }]]; };
  S.money = function (g, t, u, t0, d) { photo(g, 'money', t, u, d, { z0: 1.1, z1: 1.3, dy: -60, shake: [at('open', 'million'), 14, .4] }); dollars(g, W / 2, 620, 150, u, .9); K.confetti(g, W / 2, 500, u - .9, 60, 3, 1); };
  S.money.sfx = function (t0) { return [[t0, 'ratchet', { t1: t0 + .9 }], [t0 + .9, 'ding'], [t0 + .92, 'cheer', { g: .7 }]]; };
  S.hostTask = function (g, t, u, t0, d) { photo(g, 'host', t, u, d, { z0: 1.08, z1: 1.22, fx: .5, fy: .3, sy: .32 }); };
  S.shirt = function (g, t, u, t0, d) { photo(g, 'shirt', t, u, d, { z0: 1.0, z1: 1.1, punch: t0 + .12 }); K.slam(g, 'FOLD 1 SHIRT', W / 2, 330, fit(g, 'FOLD 1 SHIRT', 150, 980), u - .1, { col: C.YEL }); };
  S.shirt.sfx = function (t0) { return [[t0 + .1, 'slam', { g: .8 }]]; };
  S.june = function (g, t, u, t0, d) { photo(g, 'june', t, u, d, { z0: 1.04, z1: 1.14, fy: .32, sy: .3 }); nameTag(g, 'THE JUDGE', 'GRANDMA JUNE', C.PINK, u - .15, 1250); };
  S.june.sfx = function (t0) { return [[t0 + .15, 'pop'], [t0 + .21, 'slam', { g: .9 }]]; };
  S.juneCU = function (g, t, u, t0, d) { photo(g, 'juneCU', t, u, d, { z0: 1.15, z1: 1.3, fy: .42, sy: .42, punch: t0 + .05, pamt: .05 }); };
  S.juneCU.sfx = function (t0) { return [[t0, 'zip']]; };
  function hostCall(n, id) {
    var fn = function (g, t, u, t0, d) {
      photo(g, 'host2', t, u, d, { z0: 1.15 + n * .08, z1: 1.3 + n * .08, fy: .26, sy: .36, punch: t0 + .05, pamt: .1 });
      K.speedLines(g, W, H, W / 2, 700, t, .35, { col: '#fff' });
      K.slam(g, 'ROBOT ' + n, W / 2, 380, 170, u, { col: [NEONC, PURP, AMBER][n - 1] });
    };
    fn.sfx = function (t0) { return [[t0 - .12, 'whoosh', { d: .2 }], [t0, 'slam']]; };
    return fn;
  }
  S.call1 = hostCall(1, 'r1'); S.call2 = hostCall(2, 'r2'); S.call3 = hostCall(3, 'r3');
  S.yap = function (g, t, u, t0, d) { photo(g, 'yap', t, u, d, { z0: 1.05, z1: 1.18, fx: .45, fy: .4 }); nameTag(g, 'ROBOT 1', 'YAPPER-3', NEONC, u - .1, 1260); };
  S.yap.sfx = function (t0) { return [[t0 + .1, 'pop'], [t0 + .16, 'slam', { g: .9 }]]; };
  S.essay = function (g, t, u, t0, d) {
    photo(g, 'essay', t, u, d, { z0: 1.05, z1: 1.3, fx: .5, fy: .7, sy: .62 });
    var k = pop(u, .1, 3, .55); g.save(); g.translate(W / 2, 330); g.scale(k, k); K.chip(g, 'WORDS: ' + Math.floor(40 + u * 1900).toLocaleString('en-US'), 0, 0, 40, { align: 'center', bg: C.CREAM }); g.restore();
  };
  S.essay.sfx = function (t0, t1) { var e = [[t0, 'zip']]; for (var x = t0 + .1; x < t1 - .1; x += .11) e.push([x, 'key', { g: .7 }]); return e; };
  function yapStep(n) {
    var fn = function (g, t, u, t0, d) { photo(g, 'yap', t, u, d, { z0: 2.0 + n * .15, z1: 2.25 + n * .15, fx: .38, fy: .34, sy: .5 }); stepChip(g, n, u); };
    fn.sfx = function (t0) { return [[t0 + .1, 'pop'], [t0 + .15, 'tick']]; };
    return fn;
  }
  S.step1 = yapStep(1); S.step2 = yapStep(2); S.step3 = yapStep(3);
  S.just = function (g, t, u, t0, d) { photo(g, 'juneCU', t, u, d, { z0: 1.5, z1: 1.7, fy: .45, sy: .45, shake: [at('just', 'fold'), 22, .35], punch: at('just', 'fold'), pamt: .08 }); K.emote(g, 'anger', 840, 380, 2, u - .2, t); };
  S.just.sfx = function (t0) { return [[t0, 'zip'], [at('just', 'fold'), 'thud', { g: .8 }]]; };
  S.ots = function (g, t, u, t0, d) { photo(g, 'essay', t, u, d, { z0: 1.0, z1: 1.06, fx: .5, fy: .5, dx: -40 }); stamp(g, 'STILL NOT FOLDED', C.RED, W / 2, 360, u - .2, -.08, 70); };
  S.ots.sfx = function (t0) { return [[t0 + .2, 'slam', { g: .7 }]]; };
  S.dream = function (g, t, u, t0, d) { photo(g, 'dream', t, u, d, { z0: 1.05, z1: 1.18, fy: .3, sy: .32 }); nameTag(g, 'ROBOT 2', 'DREAM-9', PURP, u - .1, 1260); };
  S.dream.sfx = function (t0) { return [[t0 + .1, 'pop'], [t0 + .16, 'slam', { g: .9 }]]; };
  S.six = function (g, t, u, t0, d) {
    photo(g, 'six', t, u, d, { z0: 1.0, z1: 1.1, fy: .55, punch: t0 + .05 });
    stamp(g, 'PERFECT FOLD ✓', C.MINT, W / 2, 330, u - .2, -.1, 78); K.confetti(g, W / 2, 600, u - .1, 50, 6, 1);
  };
  S.six.sfx = function (t0) { return [[t0, 'sparkle'], [t0 + .2, 'ding'], [t0 + .1, 'cheer', { g: .5 }]]; };
  S.count = function (g, t, u, t0, d) {
    photo(g, 'june', t, u, d, { z0: 1.3, z1: 1.45, fx: .5, fy: .3, sy: .38 });
    var k = pop(u, .1, 3, .55); g.save(); g.translate(800, 560); g.scale(k, k); g.rotate(.05);
    K.rr(g, -200, -260, 400, 520, 22); g.save(); g.clip(); var im = IMG.six; g.drawImage(im, -200, -260 - 60, 400, 400 * im.height / im.width); g.restore(); K.rr(g, -200, -260, 400, 520, 22); K.fillStroke(g, null, 10, C.CREAM);
    g.restore();
    var six = at('sleeves', 'six'); K.scribble(g, 800, 560, 240, 300, eio(seg(t, six, six + .4)), C.YEL, 9, 3);
    K.slam(g, '6 SLEEVES?', W / 2, 1180, 120, t - at('sleeves', 'sleeves'), { col: C.YEL });
  };
  S.count.sfx = function (t0) { return [[t0 + .1, 'pop'], [at('sleeves', 'six'), 'scratch']]; };
  S.right = function (g, t, u, t0, d) {
    photo(g, 'dream', t, u, d, { z0: 2.4, z1: 2.7, fx: .5, fy: .26, sy: .42 });
    K.popWords(g, ["YOU'RE", '*ABSOLUTELY', 'RIGHT'], W / 2, 340, 96, u, { times: [0, 1, 2].map(function (i) { return at('dream2', i) - t0; }), hot: PURP, maxW: 980 });
  };
  S.seven = function (g, t, u, t0, d) {
    photo(g, 'six', t, u, d, { z0: 1.25, z1: 1.35, fx: .7, fy: .6, punch: t0 + .25, pamt: .1 });
    K.burst(g, 760, 1050, 140 * pop(u, .25, 3, .5), u - .25, C.YEL, '+1', 1.2);
    K.slam(g, '7 SLEEVES', W / 2, 360, 150, u - .25, { col: PURP });
  };
  S.seven.sfx = function (t0) { return [[t0 + .25, 'boing'], [t0 + .3, 'slam', { g: .8 }]]; };
  S.safe = function (g, t, u, t0, d) { photo(g, 'safe', t, u, d, { z0: 1.05, z1: 1.18, fy: .3, sy: .32 }); nameTag(g, 'ROBOT 3', 'SAFE-T', AMBER, u - .1, 1260); K.emote(g, 'sweat', 760, 470, 1.6, u - .5, t); };
  S.safe.sfx = function (t0) { return [[t0 + .1, 'pop'], [t0 + .16, 'slam', { g: .9 }]]; };
  S.cctv = function (g, t, u, t0, d) { photo(g, 'cctv', t, u, d, { z0: 1.0, z1: 1.04, fy: .6, filter: 'grayscale(1) contrast(1.35) brightness(1.1)' }); cctvOverlay(g, t); };
  S.cctv.sfx = function (t0, t1) { var e = [[t0, 'shutter']]; for (var x = t0 + .3; x < t1 - .1; x += .14) e.push([x, 'pop', { g: .35 }]); return e; };
  S.wrapped = function (g, t, u, t0, d) { photo(g, 'wrapped', t, u, d, { z0: 1.0, z1: 1.12, fy: .62, shake: [t0 + .2, 10, .3] }); stamp(g, 'SAFE ✓', C.RED, W / 2, 380, u - .2, -.12, 110); };
  S.wrapped.sfx = function (t0) { return [[t0 + .2, 'slam']]; };
  S.zero = function (g, t, u, t0, d) { photo(g, 'wide', t, u, d, { z0: 1.0, z1: 1.08, fy: .6 }); var z = at('zero', 'zero'); K.slam(g, '0 / 3', W / 2, 360, 220, t - z, { col: C.RED }); };
  S.zero.sfx = function () { return [[at('zero', 'zero'), 'slam', { g: 1.1 }], [at('zero', 'zero') + .1, 'boing', { g: .7 }]]; };
  S.done = function (g, t, u, t0, d) {
    var dn = at('done');
    photo(g, 'juneSmile', t, u, d, { z0: 1.1, z1: 1.2, fx: .55, fy: .32, sy: .36, shake: [dn + .05, 16, .3], punch: dn + .05, pamt: .08 });
    K.flash(g, W, H, t - dn - .05, .7); K.slam(g, '0.4 SEC', W / 2, 360, 170, t - dn - .1, { col: C.YEL });
    stamp(g, 'FOLDED ✓', C.MINT, W / 2, 1180, t - dn - .1, .06, 90);
  };
  S.done.sfx = function () { var dn = at('done'); return [[dn - .3, 'whoosh', { d: .25 }], [dn + .05, 'slam', { g: 1.2 }], [dn + .1, 'ding']]; };
  S.wins = function (g, t, u, t0, d) {
    photo(g, 'wins', t, u, d, { z0: 1.0, z1: 1.12, fy: .45 });
    K.confetti(g, W / 2, 300, u, 120, 8, 1.3); dollars(g, W / 2, 380, 130, u - .1, .8, { col: C.YEL });
    nameTag(g, 'WINNER', 'GRANDMA', C.PINK, u - .9, 760);
  };
  S.wins.sfx = function (t0) { return [[t0, 'cheer'], [t0 + .1, 'ratchet', { t1: t0 + .9 }], [t0 + .9, 'ding'], [t0 + .95, 'slam', { g: .8 }]]; };

  /* ---------- the timeline: the same cuts as the stickman version ---------- */
  var DUR = VO.dur;
  var CUTS = [
    ['wide', 'Line-up', S.wide, 0], ['money', '$1,000,000', S.money, at('open', 'one')], ['hostTask', 'The task', S.hostTask, at('task')],
    ['shirt', 'One shirt', S.shirt, at('task', 'fold') - .05], ['june', 'The judge', S.june, at('june')], ['juneCU', 'Impress me', S.juneCU, at('june', 'impress') - .05],
    ['call1', 'Robot 1', S.call1, at('r1') - .08], ['yap', 'Yapper-3', S.yap, at('yap1')], ['essay', 'The essay', S.essay, at('yap1', 'folding') - .05],
    ['step1', 'Step 1/40', S.step1, at('yap1', 'step') - .05], ['just', 'Just fold it', S.just, at('just') - .05], ['ots', 'Step 2/40', S.ots, at('yap2') - .05],
    ['step2', 'Step 2/40', S.step2, at('yap2', 'of') - .05], ['call2', 'Robot 2', S.call2, at('r2') - .08], ['dream', 'Dream-9', S.dream, at('dream1')],
    ['six', 'Perfect fold', S.six, at('dream1', 'perfect') - .05], ['count', 'Six sleeves', S.count, at('sleeves') - .05], ['right', 'Absolutely right', S.right, at('dream2') - .05],
    ['seven', 'Seven', S.seven, at('dream2', 'heres') - .05], ['call3', 'Robot 3', S.call3, at('r3') - .08], ['safe', 'Safe-T', S.safe, at('safe')],
    ['cctv', 'Wrapping', S.cctv, at('safe', 'so') - .05], ['wrapped', 'Safe', S.wrapped, at('safe', 'wrapped') - .05], ['zero', 'Zero', S.zero, at('zero') - .05],
    ['done', 'Done', S.done, at('done') - .45], ['wins', 'Grandma wins', S.wins, at('wins') - .05], ['step3', 'Step 3/40', S.step3, at('yap3') - .05]
  ];
  var SCENES = CUTS.map(function (c, i) {
    var t1 = i + 1 < CUTS.length ? CUTS[i + 1][3] : DUR, t0 = c[3];
    return { id: c[0], name: c[1], dur: t1 - t0, fn: c[2], draw: function (g, t, u) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); c[2](g, t, u, t0, t1 - t0); captions(g, t); } };
  });
  var FILMK = K.film({ W: W, H: H, scenes: SCENES });
  var SHOTS = SCENES.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });

  var EV = [];
  SCENES.forEach(function (s) { (s.fn.sfx ? s.fn.sfx(s.t0, s.t1) : []).forEach(function (e) { EV.push(Object.assign({ t: e[0], type: e[1] }, e[2] || {})); }); });
  EV = EV.filter(function (e) { return e.t >= 0 && e.t < DUR; }).sort(function (a, b) { return a.t - b.t; });

  function TEXTS(t) { var out = []; CHUNKS.forEach(function (c) { if (t >= c.a && t < c.b) out.push({ text: c.map(function (w) { return w.w; }).join(' '), t0: c.a, t1: c.b }); }); return out; }
  function SCORE(ac) { K.score(ac, EV, DUR); }
  function render(t, samples, shutter, fps) { FILMK.render(ctx, t, samples, shutter, fps); }
  function loadImages() {
    return Promise.all(NAMES.map(function (n) { return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { IMG[n] = im; res(); }; im.onerror = function () { rej(new Error('missing ' + n)); }; im.src = 'img/' + n + '.jpg'; }); }));
  }
  function init(canvas) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    return Promise.all(K.FONTS.map(function (f) { return document.fonts.load(f, 'Aa0%?!·$✓'); }).concat([loadImages()])).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: at('dream1', 'perfect') + .6, SLUG: 'foldoff-real', SHOTS: SHOTS, init: init, render: render, LIVE: {} };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
