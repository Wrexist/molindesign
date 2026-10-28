  /* =================================================================== part 5 · two cards */
  /* 37 · 2012, a student's parents' house; three people want a computer to recognise pictures */
  function sHouse(g, t, s) {
    var tHo = at('a1', 'house.'), t2 = start('a2'), tAl = at('a2', 'alex'), tIl = at('a2', 'ilya'), tGe = at('a2', 'geoffrey'), tPi = at('a2', 'pictures.');
    var inK = eio(seg(t, t2 - .5, t2 + .3));
    g.save(); cam(g, t, s, .06);
    if (inK < 1) {
      g.save(); g.globalAlpha = 1 - inK; var z = lerp(1, 3.2, inK); g.translate(960, 640); g.scale(z, z); g.translate(-960, -640);
      sky(g, t, '#101a3a', '#2a2350', { stars: 1 }); floorAt(g, 820, '#1d2a22');
      house(g, 960, 820, 2.4, .5 + .5 * Math.sin(t * 3) * .2 + .5, '#5a6b90');
      chip(g, "A STUDENT'S PARENTS' HOUSE", 960, 180, { px: 46, bg: CREAM, s: pop(t, tHo - .3), rot: -.02, wide: true });
      g.restore();
    }
    if (inK > 0) {
      g.save(); g.globalAlpha = inK;
      wall(g, '#4a3a5a', '#2f2540'); floorAt(g, 880, '#5a3f30');
      rr(g, 1500, 150, 300, 220, 10); fillStroke(g, '#101a3a', 6); circ(g, 1720, 210, 26); g.fillStyle = '#f6efd8'; g.fill();
      rr(g, 380, 720, 1160, 36, 8); fillStroke(g, '#8a5a3c', 6);
      monitor(g, 960, 520, 440, 260, function (g, w, h) { var k = Math.floor(t * 1.6) % 3; txt(g, ['CAT?', 'CAR?', 'DOG?'][k], 0, 0, 70, NVL, { fam: MONO, wt: 700 }); });
      var cast = [[480, ALEX, tAl, 'ALEX KRIZHEVSKY'], [1440, ILYA, tIl, 'ILYA SUTSKEVER'], [960, HINT, tGe, 'GEOFFREY HINTON']];
      cast.forEach(function (c, i) {
        var k = pop(t, c[2] - .2, 3, .6); if (k <= 0) return;
        var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [80, -200], look: [i === 0 ? .6 : i === 1 ? -.6 : 0, -.3], mouth: 'smile', eyes: 'dot' }], [tPi, { rh: [130, -280], mouth: 'grin', eyes: 'happy' }]]);
        g.save(); g.globalAlpha *= clamp(k, 0, 1); guy(g, c[0], i === 2 ? 1000 : 960, i === 2 ? .95 : 1.05, P, c[1], t); g.restore();
        chip(g, c[3], c[0], i === 2 ? 340 : 520, { px: 28, bg: CREAM, s: k, fam: MONO, wt: 700 });
      });
      /* picture cards flying at the screen */
      ['🐱', '🚗', '🐶'].forEach(function (e, i) { var k = seg(t, tPi - .4 + i * .15, tPi + .8 + i * .15); if (k <= 0 || k >= 1) return; var x = lerp(200 + i * 60, 900, eio(k)), y = lerp(260 + i * 120, 500, eio(k)); card(g, x, y, 160 * (1 - k * .5), 120 * (1 - k * .5), (i - 1) * .2, 1 - seg(k, .8, 1), function (g, w) { txt(g, ['CAT', 'CAR', 'DOG'][i], 0, 4, w * .26, INK, { wt: 900 }); }); });
      g.restore();
    }
    g.restore();
    dateTag(g, '2012', t, at('a1', '2012,') - .1);
    vignette(g, .4);
  }
  /* 38 · two gaming cards, about a week; the biggest image contest, won by a mile */
  function sTrain(g, t, s) {
    var tTw = at('a3', 'two'), tWe = at('a3', 'week.'), t4 = start('a4'), tMi = at('a4', 'mile:'), t15 = at('a4', '15'), t26 = at('a4', '26');
    g.save(); cam(g, t, s, .06);
    wall(g, '#2a2236', '#1a1524'); grid(g, 90);
    if (t < t4 + .3) {
      var a = 1 - seg(t, t4, t4 + .3); g.save(); g.globalAlpha = a;
      [0, 1].forEach(function (i) { var k = pop(t, tTw - .3 + i * .15, 2.8, .6); if (k > 0) gpuCard(g, 620 + i * 680, 470, .95 * clamp(k, 0, 1.05), t, { label: 'GTX 580', glow: .4 + .2 * Math.sin(t * 6 + i), heat: seg(t, tTw, tWe + .5), fans: 2, spin: 1 }); });
      for (var i = 0; i < 8; i++) { var ph = (t * .7 + i * .125) % 1; puff(g, 620 + (i % 2) * 680 + Math.sin(i * 3 + t) * 60, 300 - ph * 220, .35 + ph * .3, 'rgba(255,255,255,' + (.25 * (1 - ph)) + ')'); }
      calendar(g, 960, 820, .7 * clamp(pop(t, tWe - .3), 0, 1.05), 'TRAINING', String(1 + Math.floor(clamp(seg(t, tWe - .3, t4), 0, 1) * 5)), { px: 110, sub: 'DAYS', rot: -.03 });
      chip(g, 'TWO GAMING CARDS', 960, 140, { px: 50, bg: NVL, s: pop(t, tTw - .1), rot: -.02, wide: true });
      g.restore();
    }
    if (t > t4 - .1) {
      var b = clamp(seg(t, t4 - .1, t4 + .3), 0, 1); g.save(); g.globalAlpha = b;
      chip(g, 'IMAGENET 2012 · % WRONG', 960, 150, { px: 44, bg: CREAM, s: b, fam: MONO, wt: 700 });
      var bars = [['ALEXNET', 15.3, NVL, t15], ['NEXT BEST', 26.2, RED, t26]];
      bars.forEach(function (r, i) {
        var k = eio(seg(t, r[3] - .4, r[3] + .3)), x = 640 + i * 640, h = 22 * r[1] * k;
        rr(g, x - 130, 820 - h, 260, h, 10); fillStroke(g, r[2], 6);
        txt(g, r[0], x, 870, 46, CREAM, { wt: 900, wide: true, outline: 8 });
        if (k > 0) txt(g, (r[1] * k).toFixed(1) + '%', x, 780 - h, 70, CREAM, { wt: 900, wide: true, outline: 10 });
      });
      stamp(g, 'WON BY A MILE', 960, 330, t, tMi, { px: 64, col: NVL, rot: -.06 });
      g.restore();
    }
    g.restore();
    vignette(g, .4);
  }
  /* 39 · same simple sums as coloring pixels; the stadium was built for games, perfect for AI */
  function sSame(g, t, s) {
    var tSu = at('a5', 'sums'), tPx = at('a5', 'pixels.'), tMi = at('a5', 'millions'), t6 = start('a6');
    g.save(); cam(g, t, s, .05);
    wall(g, '#13240c', '#081405'); grid(g, 100, 'rgba(182,240,90,.05)');
    var mk = eio(seg(t, tMi - .3, tMi + 1.0));
    /* a stadium of kids, each holding one coloured card: together the cards make a cat, the question a neural network answers */
    function catPix(c, r) {
      var x = c * 56 + (r % 2) * 28, y = r * 46, d = function (ax, ay) { return Math.hypot(x - ax, y - ay); };
      if (d(510, 270) < 34 || d(666, 270) < 34) return INK;
      if (d(588, 340) < 24) return '#ff8fa3';
      var ear = function (ax) { return y > 40 && y < 190 && Math.abs(x - ax) < (y - 40) * .55; };
      if (d(588, 300) < 200 || ear(450) || ear(726)) return '#f0a04b';
      return '#3a5a8a';
    }
    if (mk < 1) {
      g.save(); g.globalAlpha = 1 - mk;
      stadium(g, 372, 250, 21, 12, 56, t, function (i, c, r) { return seg(t, s.t0 + .3 + (c + r) * .04, s.t0 + .8 + (c + r) * .04); }, { pix: function (i, c, r) { return catPix(c, r); }, pw: .96, ph: .8 });
      chip(g, 'IS THIS A CAT?', 960, 140, { px: 50, bg: CREAM, s: pop(t, s.t0 + .1), rot: -.02, wide: true });
      chip(g, '= THE SAME SIMPLE SUMS AS PIXELS', 960, 870, { px: 44, bg: YEL, s: pop(t, tPx - .2), rot: .02, wide: true });
      g.restore();
    }
    if (mk > 0) {
      g.save(); g.globalAlpha = mk;
      stadium(g, 220, 560, 30, 7, 52, t, function (i) { return hash(i + Math.floor(t * 5)) > .3 ? 1 : 0; }, { pix: function (i) { return hash(i * 2.1) > .5 ? NVL : YEL; } });
      g.restore();
      if (t > t6 - .2) quote(g, t, 'a6', 260, { px: 76, maxw: 1500, hot: /games|ai/i });
    }
    g.restore();
    vignette(g, .4);
  }
  /* 40 · the myth: "just got lucky" — partly true; luck only pays if you're already standing there */
  function sLuck(g, t, s) {
    var tLu = at('a6b', 'lucky'), tPa = at('a6b', 'partly'), tSt = at('a6b', 'standing');
    g.save(); cam(g, t, s, .06);
    wall(g, '#31254a', '#1e1730'); floorAt(g, 880, '#2a2438');
    card(g, 560, 420, 640, 300, -.04, pop(t, s.t0 + .1), function (g) { txt(g, 'YOU MAY HAVE HEARD:', 0, -80, 34, INK, { fam: MONO, wt: 700 }); txt(g, '“NVIDIA JUST', 0, 0, 62, INK, { wt: 900, wide: true }); txt(g, 'GOT LUCKY”', 0, 76, 62, INK, { wt: 900, wide: true }); });
    stamp(g, 'PARTLY TRUE', 640, 600, t, tPa, { px: 54, col: YEL, rot: .08 });
    /* Jensen standing on the X long before the bus labelled AI pulls in */
    var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [60, -150], look: [-.6, 0], mouth: 'flat' }], [tSt, { look: [-.9, -.1], mouth: 'smirk', eyes: 'squint' }]]);
    g.save(); g.lineCap = 'round'; g.strokeStyle = YEL; g.lineWidth = 12; g.beginPath(); g.moveTo(1380, 870); g.lineTo(1500, 910); g.moveTo(1500, 870); g.lineTo(1380, 910); g.stroke(); g.restore();
    guy(g, 1440, 890, 1.05, P, JEN, t);
    var bk = eio(seg(t, tSt - .8, tSt + .4)), bx = lerp(-700, 820, bk);
    g.save(); g.translate(bx, 760); rr(g, -360, -200, 720, 220, 30); fillStroke(g, NVL, 8); for (var i = 0; i < 4; i++) { rr(g, -320 + i * 160, -170, 120, 90, 10); fillStroke(g, '#bfe8ff', 5); } txt(g, 'AI', 0, -30, 70, INK, { wt: 900, wide: true }); [-220, 220].forEach(function (wx) { circ(g, wx, 30, 46); fillStroke(g, INK, 6); circ(g, wx, 30, 18); g.fillStyle = '#c9c6d6'; g.fill(); }); g.restore();
    g.restore();
    chip(g, 'LUCK PAYS IF YOU’RE ALREADY THERE', 960, 140, { px: 44, bg: CREAM, s: pop(t, tSt - .2), rot: -.02, wide: true });
    if (t > tLu && t < tPa) spark(g, 860, 360, t, tLu, .8);
    vignette(g, .4);
  }
  /* 41 · 2016: the first DGX-1, hand-delivered to a small lab called OpenAI, and signed */
  function sDGX(g, t, s) {
    var tA = at('a7', 'all'), tD = at('a7', 'dgx1,'), tO = at('a7', 'openai.'), t8 = start('a8'), tFu = at('a8', 'future'), t9 = start('a9'), tIl = at('a9', 'ilya'), tSt = at('a9', 'students');
    g.save(); cam(g, t, s, .06);
    wall(g, '#2f3a4a', '#1e2733'); floorAt(g, 880, '#3a3044');
    /* the lab door */
    rr(g, 1440, 360, 300, 520, 10); fillStroke(g, '#5a6d80', 7); chip(g, 'OPENAI', 1590, 330, { px: 36, bg: CREAM, fam: MONO, wt: 700, s: pop(t, tO - .3) }); circ(g, 1470, 640, 10); g.fillStyle = YEL; g.fill();
    var wk = seg(t, tA, tO), x = lerp(640, 1100, eio(wk));
    var P = poseAt(t, [[s.t0, { lh: [-110, -240], rh: [110, -240], look: [.6, 0], mouth: 'grin' }], [t8, { lh: [-60, -150], rh: [150, -230], look: [.4, .3], mouth: 'smile', eyes: 'squint' }]]);
    if (wk > 0 && wk < 1) { P.lf = [-26 + Math.sin(t * 12) * 20, 0]; P.rf = [26 - Math.sin(t * 12) * 20, 0]; }
    if (t > t8) P = Object.assign({}, P);
    guy(g, x, 920, 1.1, P, t > t8 ? Object.assign({}, JEN, { hold: [null, marker] }) : JEN, t);
    var bx = t < t8 ? x : 1160, by = t < t8 ? 690 : 760;
    g.save(); g.translate(bx, by); rr(g, -170, -120, 340, 240, 12); fillStroke(g, '#2c2936', 7); for (var i = 0; i < 4; i++) { rr(g, -150, -100 + i * 52, 300, 40, 6); fillStroke(g, '#3a3647', 3); g.fillStyle = NVL; for (var j = 0; j < 5; j++) { circ(g, -130 + j * 18, -80 + i * 52, 4); g.fill(); } } txt(g, 'DGX-1', 70, -80, 30, NVL, { fam: MONO, wt: 700 });
    if (t > tFu - .3) { g.save(); g.rotate(-.06); var sig = 'to the future of computing and humanity', n = Math.floor(clamp(seg(t, tFu - .3, end('a8') + .2), 0, 1) * sig.length); font(g, 26, 400, SERIF); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(sig.slice(0, n), 0, 60); g.restore(); }
    g.restore();
    if (t > t9 - .1) {
      var Q = poseAt(t, [[t9, { lh: [-60, -150], rh: [-130, -240], look: [-.6, 0], mouth: 'smile', eyes: 'happy' }]]);
      var ik = eio(seg(t, t9 - .1, tIl + .2)); guy(g, lerp(1590, 1560, ik), 900, 1.0 * ik, Q, ILYA, t);
      chip(g, 'CO-FOUNDER: ILYA SUTSKEVER', 1380, 220, { px: 36, bg: YEL, s: pop(t, tIl - .1), rot: .02 });
      sticky(g, ["FROM THE", "STUDENT'S", "HOUSE"], 420, 340, pop(t, tSt - .2), -.06, { px: 46, lh: 56 });
    }
    g.restore();
    dateTag(g, 'AUG 2016', t, at('a7', '2016,') - .1);
    chip(g, 'ALL IN', 700, 220, { px: 56, bg: NVL, s: pop(t, tA - .1) * (1 - seg(t, t9 - .3, t9)), rot: -.04, wide: true });
    chip(g, 'THE FIRST DGX-1', 960, 140, { px: 44, bg: CREAM, s: pop(t, tD - .1) * (1 - seg(t, t8 - .2, t8)), rot: .02, wide: true });
    vignette(g, .4);
  }
  /* 42 · crypto miners buy the cards, crypto crashes in 2018, the stock halves; the $5.5 million fine */
  function sCrypto(g, t, s) {
    var tMi = at('a10', 'miners'), tCr = at('a10', 'crashes'), tHa = at('a10', 'half'), t11 = start('a11'), tFi = at('a11', 'fine');
    g.save(); cam(g, t, s, .06);
    wall(g, '#3a2a1a', '#24190f'); floorAt(g, 880, '#2e2418');
    if (t < tCr + .2) {
      var a = 1 - seg(t, tCr, tCr + .2); g.save(); g.globalAlpha = a;
      rr(g, 200, 300, 1520, 30, 6); fillStroke(g, '#8a5a3c', 5); rr(g, 200, 560, 1520, 30, 6); fillStroke(g, '#8a5a3c', 5);
      for (var i = 0; i < 8; i++) { var taken = t > tMi + i * .12; if (!taken) { gpuCard(g, 300 + i * 190, 250, .3, t, {}); } }
      for (i = 0; i < 4; i++) { var P = poseAt(t, [[s.t0, { lh: [-100, -260], rh: [80, -200], look: [.3, -.5], mouth: 'grin', eyes: 'happy' }]]); P.lf = [-26 + Math.sin(t * 11 + i) * 18, 0]; P.rf = [26 - Math.sin(t * 11 + i) * 18, 0]; guy(g, 360 + i * 400 + Math.sin(t * 2 + i) * 40, 920, .9, P, Object.assign({}, MINER, { col: ['#7a5584', '#3d7bff', '#5fb86b', '#ff5b3d'][i], seed: 90 + i, hold: [smallCard, smallCard] }), t); }
      chip(g, 'CRYPTO MINERS', 960, 140, { px: 50, bg: YEL, s: pop(t, tMi - .1), rot: -.02, wide: true });
      g.restore();
    }
    if (t > tCr - .1) {
      var b = clamp(seg(t, tCr - .1, tCr + .2), 0, 1); g.save(); g.globalAlpha = b;
      /* a falling coin, then the chart halving */
      var fk = seg(t, tCr - .1, tCr + .7); coin(g, 1520, lerp(200, 820, fk * fk), 90, YEL, Math.cos(t * 9)); if (fk >= 1) spark(g, 1520, 840, t, tCr + .7, 1.2);
      var head = chart(g, 220, 260, 1000, 480, [[0, .55], [.2, .7], [.4, .9], [.55, .82], [.7, .5], [.85, .38], [1, .36]], seg(t, tCr, tHa + .6), { col: RED });
      if (t > tHa - .1) bigNum(g, '−50%+', head[0] - 300, head[1] + 90, 96, RED, pop(t, tHa - .1) * (1 - seg(t, t11 - .4, t11 - .1)));
      chip(g, '2018 · CRYPTO CRASHES', 720, 140, { px: 44, bg: CREAM, s: pop(t, tCr - .1), rot: -.02, fam: MONO, wt: 700 });
      if (t > t11 - .2) { card(g, 1380, 480, 520, 360, .04, pop(t, t11 - .2), function (g) { txt(g, 'SEC', 0, -110, 60, INK, { wt: 900, wide: true }); txt(g, 'DIDN’T TELL INVESTORS', 0, -30, 30, INK, { fam: MONO, wt: 700 }); txt(g, 'HOW MUCH WAS CRYPTO', 0, 14, 30, INK, { fam: MONO, wt: 700 }); }); stamp(g, '$5.5M FINE', 1380, 620, t, tFi, { px: 64, rot: -.1 }); }
      g.restore();
    }
    g.restore();
    vignette(g, .45);
  }

  /* =================================================================== part 6 · the gold rush */
  /* 43 · ChatGPT, trained on a Microsoft supercomputer built from tens of thousands of Nvidia chips */
  function sChatGPT(g, t, s) {
    var tC = at('r1', 'chatgpt.'), t2 = start('r2'), tSu = at('r2', 'supercomputer'), tTe = at('r2', 'tens');
    g.save();
    var zk = eio(seg(t, tSu - .5, tTe + .6)), z = lerp(1.6, .55, zk); g.translate(960, 540); g.scale(z, z); g.translate(-960, -540); cam(g, t, s, .03);
    wall(g, '#0c1a10', '#050c07');
    if (zk > 0) for (var r = -3; r < 4; r++) for (var c = -5; c < 6; c++) { if (r === 0 && c === 0) continue; rack(g, 960 + c * 300 - 110, 540 + r * 330 - 150, 220, 300, t + c + r, { seed: c * 7 + r }); }
    monitor(g, 960, 520, 520, 320, function (g, w, h) { g.fillStyle = '#f4f1ea'; g.fillRect(-w / 2, -h / 2, w, h); txt(g, 'ChatGPT', 0, -30, 70, INK, { wt: 800 }); var q = typed('Hello! How can I help?', t, tC, tC + 1.2); g.textAlign = 'left'; font(g, 26, 600); g.fillStyle = INK; g.fillText(q, -w / 2 + 40, 60); });
    recreated(g, 1130, 700);
    g.restore();
    dateTag(g, 'NOV 30, 2022', t, at('r1', 'november') - .1);
    chip(g, 'A MICROSOFT SUPERCOMPUTER', 960, 140, { px: 48, bg: CREAM, s: pop(t, tSu - .1), rot: -.02, wide: true });
    chip(g, 'TENS OF THOUSANDS OF NVIDIA CHIPS', 960, 900, { px: 46, bg: NVL, s: pop(t, tTe - .1), rot: .02, wide: true });
    vignette(g, .4);
  }
  /* 44 · every tech giant wants the same thing; in a gold rush, sell shovels */
  function sRush(g, t, s) {
    var tGi = at('r3', 'giant'), tOn = at('r3', 'one'), t4 = start('r4'), tSh = at('r4', 'shovels.');
    g.save(); cam(g, t, s, .06);
    sky(g, t, '#f0b06a', '#f6d79a'); floorAt(g, 820, '#c99a5a');
    for (var i = 0; i < 6; i++) { g.fillStyle = '#b88a4a'; g.beginPath(); g.moveTo(-200 + i * 420, 820); g.lineTo(i * 420, 620 - hash(i) * 80); g.lineTo(200 + i * 420, 820); g.closePath(); g.fill(); }
    /* the stall */
    rr(g, 1180, 560, 560, 280, 8); fillStroke(g, '#8a5a3c', 7); g.fillStyle = NV; for (i = 0; i < 7; i++) { g.fillStyle = i % 2 ? CREAM : NV; g.fillRect(1160 + i * 86, 470, 86, 70); } g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(1160, 470, 602, 70);
    txt(g, 'SHOVELS · GPUs', 1460, 430, 40, CREAM, { wt: 900, wide: true, outline: 8 });
    for (i = 0; i < 4; i++) { g.save(); g.translate(1250 + i * 130, 820); shovel(g); g.restore(); }
    var J = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [120, -240], look: [-.7, 0], mouth: 'smile' }], [tSh, { rh: [140, -300], mouth: 'grin', eyes: 'happy' }]]);
    guy(g, 1460, 880, 1.05, J, Object.assign({}, JEN, { hold: [null, shovel] }), t);
    /* the giants run in with sacks of money */
    var names = ['BIG TECH', 'CLOUD CO.', 'SOCIAL CO.', 'SEARCH CO.'];
    for (i = 0; i < 4; i++) {
      var k = seg(t, tGi - .6 + i * .2, tOn + .4 + i * .2), x = lerp(-200, 260 + i * 220, eio(k)); if (k <= 0) continue;
      var P = poseAt(t, [[s.t0, { lh: [-100, -220], rh: [130, -200], look: [.8, 0], mouth: 'O', eyes: 'wide', lean: .1 }]]); P.lf = [-26 + Math.sin(t * 13 + i) * 24, 0]; P.rf = [26 - Math.sin(t * 13 + i) * 24, 0];
      guy(g, x, 900, .9, P, Object.assign({}, SUIT, { seed: 100 + i, tie: [RED, BLUE, YEL, MINT][i], hold: [null, function (g) { circ(g, 0, 10, 34); fillStroke(g, '#c9a26a', 5); txt(g, '$', 0, 12, 34, INK, { wt: 900 }); }] }), t);
      chip(g, names[i], x, 560, { px: 26, bg: CREAM, s: clamp(k * 3, 0, 1), fam: MONO, wt: 700 });
    }
    g.restore();
    chip(g, 'ONE COMPANY SELLS MOST OF THEM', 960, 140, { px: 44, bg: CREAM, s: pop(t, tOn - .1) * (1 - seg(t, t4 - .3, t4)), rot: -.02, wide: true });
    if (t > t4 - .2) quote(g, t, 'r4', 200, { px: 96, maxw: 1500, hot: /shovels/i });
    vignette(g, .35);
  }
  /* 45 · the H100: tens of thousands of dollars each, months of waiting */
  function sH100(g, t, s) {
    var tH = at('r5', 'h100,'), tTe = at('r5', 'tens'), tWa = at('r5', 'wait');
    g.save(); cam(g, t, s, .06);
    wall(g, '#1b1430', '#0f0b1c'); floorAt(g, 880, '#221a38');
    rr(g, 760, 640, 400, 240, 10); fillStroke(g, '#3a3450', 7);
    var k = pop(t, tH - .3, 2.6, .6); if (k > 0) { glow(g, 960, 470, 360, 'rgba(118,185,0,.55)', clamp(k, 0, 1)); gpuCard(g, 960, 480, .85 * clamp(k, 0, 1.05), t, { label: 'H100', glow: .8, fans: 0 }); }
    tag(g, 'TENS OF THOUSANDS OF $', 1420, 300, pop(t, tTe - .1), { px: 44, rot: .1 });
    /* the queue, with calendar pages flipping */
    for (var i = 0; i < 7; i++) { var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [60, -150], look: [.8, 0], mouth: i % 2 ? 'flat' : 'frown', eyes: i % 3 ? 'dot' : 'tiny' }]]); guy(g, 1260 + i * 120, 920, .62, P, Object.assign({}, SUIT, { seed: 110 + i, tie: [RED, BLUE, YEL, MINT][i % 4] }), t); }
    if (t > tWa - .2) { var m = Math.floor(clamp(seg(t, tWa, s.t1), 0, 1) * 6); calendar(g, 360, 520, .8 * clamp(pop(t, tWa - .2), 0, 1.05), 'WAITING', ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'][m], { px: 110, sub: 'MONTHS', rot: -.05 }); }
    g.restore();
    vignette(g, .4);
  }
  /* 46 · May 2023: a trillion dollars, and Denny's puts a plaque on the booth */
  function sPlaque(g, t, s) {
    var tTr = at('r6', 'trillion'), tPl = at('r6', 'plaque');
    g.save(); cam(g, t, s, .06, 960, 420);
    diner(g, t, { plaque: clamp(pop(t, tPl - .2, 2.6, .6), 0, 1.05) });
    mug(g, 700, 690, .8, t, true); plate(g, 1200, 688, .9);
    g.restore();
    dateTag(g, 'MAY 2023', t, at('r6', 'may') - .1);
    bigNum(g, '$1 TRILLION', 960, 860, 120, NVL, pop(t, tTr - .2) * (1 - seg(t, tPl - .4, tPl - .1)));
    chip(g, "DENNY'S PLAQUE", 960, 120, { px: 46, bg: YEL, s: pop(t, tPl - .1), rot: -.02, wide: true });
    vignette(g, .4);
  }
  /* 47 · June 2024: past Microsoft and Apple, the most valuable company in the world */
  function sPodium(g, t, s) {
    var tPa = at('r7', 'passes'), tMo = at('r7', 'most');
    g.save(); cam(g, t, s, .06);
    wall(g, '#1d2440', '#121729'); floorAt(g, 900, '#2a2438');
    var steps = [[960, 380, '1', NV], [560, 260, '2', '#c9c6d6'], [1360, 180, '3', '#c9a26a']];
    steps.forEach(function (p) { rr(g, p[0] - 190, 900 - p[1], 380, p[1], 8); fillStroke(g, p[3], 7); txt(g, p[2], p[0], 900 - p[1] / 2, 110, INK, { wt: 900 }); });
    var sw = eio(seg(t, tPa - .2, tPa + .8));
    /* Nvidia's chip climbs from third to first */
    var nx = lerp(1360, 960, sw), ny = lerp(900 - 180, 900 - 380, sw) - 130 - Math.sin(sw * Math.PI) * 160;
    chipD(g, lerp(960, 1360, sw), 900 - lerp(380, 180, sw) - 110, .8, t, { face: sw > .5 ? 'sad' : 'dot', die: '#3d7bff', die2: '#8fb6ff', label: 'MICROSOFT', seed: 2 });
    chipD(g, 560, 900 - 260 - 110, .8, t, { face: sw > .5 ? 'o' : 'dot', die: '#9a96a6', die2: '#e0dce8', label: 'APPLE', seed: 4 });
    chipD(g, nx, ny, .9, t, { face: sw > .5 ? 'grin' : 'dot', glow: sw, label: 'NVIDIA' });
    if (t > tMo) for (var i = 0; i < 3; i++) spark(g, 960 + (i - 1) * 180, 300 + (i % 2) * 80, t, tMo + i * .12, .9);
    g.restore();
    dateTag(g, 'JUN 2024', t, at('r7', 'june') - .1);
    chip(g, 'MOST VALUABLE COMPANY IN THE WORLD', 960, 130, { px: 44, bg: YEL, s: pop(t, tMo - .1), rot: -.02, wide: true });
    vignette(g, .4);
  }
  /* 48 · DeepSeek, January 2025: about $589 billion gone in a day, the biggest one-day loss ever */
  function sDeepSeek(g, t, s) {
    var tD = at('r8', 'deepseek'), tCh = at('r8', 'cheap'), tLo = at('r8', 'loses'), t9 = start('r9');
    g.save(); cam(g, t, s, .06);
    wall(g, '#2a1520', '#180b12'); grid(g, 90, 'rgba(255,90,90,.05)');
    var pts = [[0, .5], [.15, .62], [.3, .7], [.45, .78], [.6, .86], [.62, .4], [.8, .42], [1, .46]];
    var head = chart(g, 200, 240, 1000, 560, pts, t < tLo ? seg(t, s.t0, tLo) * .6 : lerp(.6, 1, seg(t, tLo, t9)), { col: t > tLo ? RED : NVL });
    if (t > tLo) { bigNum(g, '−$589 BILLION', 1400, 440, 76, RED, pop(t, tLo + .2)); chip(g, 'IN ONE DAY', 1480, 560, { px: 46, bg: CREAM, s: pop(t, tLo + .4), rot: .03, wide: true }); }
    /* a small whale-blue chip labelled DEEPSEEK nudges the chart */
    var dk = pop(t, tD - .2, 2.8, .6); if (dk > 0) { chipD(g, 1500, 820, .55 * clamp(dk, 0, 1.05), t, { face: 'grin', die: '#4a7bd8', die2: '#9fc4ff', label: 'DEEPSEEK', seed: 6 }); chip(g, 'A CHEAP AI MODEL', 1500, 690, { px: 34, bg: CREAM, s: pop(t, tCh - .1), fam: MONO, wt: 700 }); }
    if (t > t9 - .1) stamp(g, 'BIGGEST 1-DAY LOSS EVER', 960, 160, t, t9 + .1, { px: 58, rot: -.04 });
    g.restore();
    dateTag(g, 'JAN 27, 2025', t, at('r8', 'january') - .1);
    vignette(g, .45);
  }
  /* 49 · and it keeps climbing: $4 trillion, $5 trillion, the first ever */
  function sClimb(g, t, s) {
    var t4 = at('r10', '4'), t5 = at('r10', '5'), tFi = at('r10', 'first');
    g.save(); cam(g, t, s, .06);
    wall(g, '#132108', '#070c03'); grid(g, 100, 'rgba(182,240,90,.06)');
    var pts = [[0, .1], [.12, .2], [.2, .16], [.32, .34], [.45, .42], [.55, .55], [.66, .6], [.78, .75], [.9, .88], [1, .96]];
    var head = chart(g, 200, 180, 1400, 700, pts, seg(t, s.t0, t5 + .5), { col: NVL, lw: 14 });
    /* Jensen rides the head of the line up */
    var cP = poseAt(t, [[s.t0, { lh: [-90, -230], rh: [90, -230], mouth: 'grin', eyes: 'happy', look: [.5, -.4] }]]); cP.lf = [-30 + Math.sin(t * 9) * 16, 0]; cP.rf = [30 - Math.sin(t * 9) * 16, 0];
    guy(g, head[0], head[1] - 4, .42, cP, JEN, t);
    [[t4, '$4T', 'JUL 2025', .78], [t5, '$5T', 'OCT 2025', .96]].forEach(function (f) { if (t < f[0] - .2) return; var x = 200 + f[3] * 1400 * (f[3] === .78 ? .78 / .78 : 1), y = 180 + 700 - (f[3] === .78 ? .75 : .96) * 700; var px2 = f[3] === .78 ? 200 + .78 * 1400 : 200 + 1400; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(px2, y); g.lineTo(px2, y - 170); g.stroke(); g.beginPath(); g.moveTo(px2, y - 170); g.lineTo(px2 + 110, y - 140); g.lineTo(px2, y - 110); g.closePath(); fillStroke(g, NV, 5); tag(g, f[1], px2 - 140, y - 160, pop(t, f[0] - .1), { px: 54 }); txt(g, f[2], px2 - 140, y - 80, 28, CREAM, { fam: MONO, wt: 700, outline: 6 }); });
    g.restore();
    chip(g, 'KEEPS CLIMBING', 760, 120, { px: 48, bg: CREAM, s: pop(t, s.t0 + .2), rot: -.03, wide: true });
    stamp(g, 'FIRST COMPANY EVER', 1100, 560, t, tFi, { px: 64, col: NVL, rot: -.08 });
    vignette(g, .4);
  }

  /* =================================================================== part 7 · right now */
  /* 50 · October 2026: $96.2 billion in a quarter, $89 billion from data centers: nine of every ten dollars */
  function sNow(g, t, s) {
    var t2 = start('n2'), t96 = at('n2', '96.2'), t89 = at('n2', '89'), t3 = start('n3'), tNi = at('n3', 'nine'), tGa = at('n3', 'gaming');
    g.save(); cam(g, t, s, .05);
    wall(g, '#1c2a12', '#0e1708'); grid(g, 100, 'rgba(182,240,90,.05)');
    if (t < t2 + .2) {
      var ca = 1 - seg(t, t2, t2 + .2);
      calendar(g, 760, 520, 1.1 * clamp(pop(t, s.t0 + .1), 0, 1.05) * ca, 'RIGHT NOW', 'OCT', { px: 110, sub: '2026' });
      g.save(); g.globalAlpha = ca; guy(g, 1380, 980, 1.1, poseAt(t, [[s.t0, { lh: [-60, -150], rh: [-150, -300], look: [-.6, -.2], mouth: 'smile' }], [s.t0 + .8, { rh: [-170, -320], mouth: 'talk' }]]), JEN, t); g.restore();
      chip(g, 'WHERE IS IT THIS MONTH?', 1380, 200, { px: 44, bg: YEL, s: pop(t, s.t0 + .3) * ca, rot: .02, wide: true });
    }
    if (t > t2 - .1) {
      var a = clamp(seg(t, t2 - .1, t2 + .2), 0, 1); g.save(); g.globalAlpha = a;
      chip(g, 'LAST QUARTER', 960, 120, { px: 40, bg: CREAM, fam: MONO, wt: 700, s: a });
      bigNum(g, '$' + (96.2 * eo(seg(t, t96 - .3, t96 + .7))).toFixed(1) + ' BILLION', 960, 260, 110, CREAM, pop(t, t96 - .3));
      /* ten coins: nine data center, one everything else */
      for (var i = 0; i < 10; i++) { var k = pop(t, t89 - .3 + i * .05, 3, .6); if (k <= 0) continue; var dc = i < 9 && t > t89, x = 330 + i * 140; g.save(); g.translate(x, 560); g.scale(clamp(k, 0, 1.05), clamp(k, 0, 1.05)); coin(g, 0, 0, 56, dc ? NVL : '#c9c6d6', 1); g.restore(); }
      if (t > t89 - .1) { g.strokeStyle = NVL; g.lineWidth = 8; g.beginPath(); g.moveTo(300, 650); g.lineTo(300, 680); g.lineTo(1450, 680); g.lineTo(1450, 650); g.stroke(); chip(g, 'DATA CENTERS · $89B', 875, 730, { px: 40, bg: NVL, s: pop(t, t89), wide: true }); chip(g, 'EVERYTHING ELSE', 1590, 730, { px: 28, bg: '#c9c6d6', s: pop(t, t89 + .2), fam: MONO, wt: 700 }); }
      chip(g, '9 OF EVERY 10 DOLLARS', 960, 860, { px: 54, bg: YEL, s: pop(t, tNi - .1) * (1 - seg(t, tGa - .3, tGa - .1)), rot: -.02, wide: true });
      if (t > tGa - .2) { gpuCard(g, 330, 860, .3, t, {}); cross(g, 330, 860, 1.4, pop(t, tGa)); chip(g, 'NOW MOSTLY SELLS TO AI', 960, 860, { px: 40, bg: CREAM, s: pop(t, tGa + .1), rot: .02, wide: true }); }
      g.restore();
    }
    g.restore();
    vignette(g, .4);
  }
  /* 51 · Vera Rubin in full production; $108 billion expected, with no China AI chip sales */
  function sRubin(g, t, s) {
    var tV = at('n4', 'vera'), tFu = at('n4', 'full'), t108 = at('n4', '108'), tCh = at('n4', 'china.');
    g.save(); cam(g, t, s, .06);
    wall(g, '#14233a', '#0b1424'); floorAt(g, 860, '#1f2a3a');
    g.fillStyle = '#3a3a4a'; g.fillRect(-200, 780, W + 400, 40);
    for (var i = 0; i < 6; i++) { var x = ((i * 380 + (t - tV) * 200) % 2280) - 200; if (t < tV - .3) break; rack(g, x - 90, 470, 180, 310, t, { seed: i, label: 'VERA RUBIN' }); }
    chip(g, 'VERA RUBIN · IN FULL PRODUCTION', 960, 130, { px: 44, bg: NVL, s: pop(t, tFu - .2), rot: -.02, wide: true });
    g.restore();
    if (t > t108 - .3) { bigNum(g, '$108B', 760, 300, 120, CREAM, pop(t, t108 - .2)); chip(g, 'EXPECTED THIS QUARTER', 760, 400, { px: 36, bg: CREAM, s: pop(t, t108), fam: MONO, wt: 700 }); }
    if (t > tCh - .4) { card(g, 1460, 330, 300, 200, .05, pop(t, tCh - .4), function (g) { txt(g, 'CHINA', 0, -40, 48, INK, { wt: 900, wide: true }); txt(g, 'AI CHIPS: $0', 0, 30, 32, INK, { fam: MONO, wt: 700 }); }); cross(g, 1460, 330, 2.2, pop(t, tCh), RED); }
    vignette(g, .4);
  }
  /* 52 · not a straight line: a record on Oct 6, then eight red days; worth about $5.2 trillion today */
  function sWobble(g, t, s) {
    var tRe = at('n5', 'record,'), tEi = at('n5', 'eight'), tSi = at('n5', 'since'), t6 = start('n6'), t52 = at('n6', '5.2');
    g.save(); cam(g, t, s, .06);
    wall(g, '#1d2440', '#121729'); grid(g, 90);
    rr(g, 180, 200, 1560, 600, 18); fillStroke(g, '#191527', 5);
    txt(g, 'CHIP STOCKS · DAILY', 360, 245, 30, CREAM, { fam: MONO, wt: 700 });
    /* candles: a climb to the record, then eight red days, then a few mixed */
    var c = [.3, .36, .34, .42, .48, .55, .62, .58, .5, .45, .4, .37, .34, .31, .3, .34, .38], n = Math.floor(clamp(seg(t, s.t0, tEi + 1.4), 0, 1) * c.length);
    for (var i = 0; i < n; i++) {
      var y0 = i ? c[i - 1] : .25, y1 = c[i], up = y1 >= y0, red8 = i >= 7 && i <= 14, x = 240 + i * 88, ya = 760 - Math.max(y0, y1) * 560, yb = 760 - Math.min(y0, y1) * 560;
      g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 24, ya - 20); g.lineTo(x + 24, yb + 20); g.stroke();
      rr(g, x, ya, 48, Math.max(12, yb - ya), 4); fillStroke(g, up ? NVL : RED, 4);
      if (i === 6 && t > tRe - .2) { tag(g, 'RECORD · OCT 6', x + 40, ya - 70, pop(t, tRe - .1), { px: 34 }); }
    }
    if (t > tEi - .2) { var cnt = clamp(Math.floor(seg(t, tEi - .2, tEi + 1.2) * 8) + 1, 1, 8); chip(g, cnt + (cnt === 1 ? ' RED DAY' : ' RED DAYS IN A ROW'), 1300, 280, { px: 40, bg: RED, fg: '#fff', s: pop(t, tEi - .2), rot: .03, wide: true }); }
    chip(g, 'LONGEST STREAK SINCE 2008', 1300, 380, { px: 32, bg: CREAM, s: pop(t, tSi - .1), fam: MONO, wt: 700 });
    g.restore();
    chip(g, 'NOT A STRAIGHT LINE', 960, 110, { px: 50, bg: YEL, s: pop(t, s.t0 + .1) * (1 - seg(t, t6 - .2, t6)), rot: -.02, wide: true });
    if (t > t6 - .2) { g.fillStyle = 'rgba(8,6,18,' + (.55 * seg(t, t6 - .2, t6 + .2)) + ')'; g.fillRect(0, 0, W, H); bigNum(g, '≈ $5.2 TRILLION', 960, 500, 150, NVL, pop(t, t52 - .2)); chip(g, 'TODAY', 960, 650, { px: 50, bg: CREAM, s: pop(t, t6), rot: .02, wide: true }); }
    vignette(g, .4);
  }
  /* 53 · that $12 share from 1999: six splits, 480 shares, about $104 thousand */
  function sShare(g, t, s) {
    var tRe = at('n7', 'remember'), tSp = at('n7', 'splits,'), t480 = at('n7', '480'), t104 = at('n7', '104');
    g.save(); cam(g, t, s, .05);
    wall(g, '#2a1f3a', '#1a1428'); grid(g, 90);
    sticky(g, ['REMEMBER', '$12?'], 1720, 420, pop(t, tRe - .1), -.06);
    var SPL = [1, 2, 4, 8, 12, 48, 480], k = clamp(seg(t, tSp - .6, t480 + .1), 0, 1), step = Math.min(6, Math.floor(k * 7)), nShares = SPL[step];
    /* the share certificates multiplying in a grid */
    var shown = Math.min(nShares, 480), cols = nShares > 48 ? 30 : nShares > 8 ? 12 : 4, cell = nShares > 48 ? 40 : nShares > 8 ? 90 : 190;
    for (var i = 0; i < shown; i++) { var c = i % cols, r = Math.floor(i / cols), x = 960 - cols * cell / 2 + c * cell + cell / 2, y = 330 + r * cell * .62; g.save(); g.translate(x, y); rr(g, -cell * .42, -cell * .26, cell * .84, cell * .52, cell * .06); fillStroke(g, '#dff0d8', Math.max(2, cell * .04)); if (cell > 60) txt(g, 'NVDA', 0, 2, cell * .18, '#2f6b3a', { fam: MONO, wt: 700 }); g.restore(); }
    chip(g, '1 SHARE' + (step ? ' → ' + nShares + ' SHARES' : ''), 960, 150, { px: 48, bg: CREAM, s: pop(t, s.t0 + .2), rot: -.02, wide: true });
    if (step > 0 && step < 6) chip(g, 'SPLIT ×' + step, 1500, 260, { px: 40, bg: YEL, s: 1, rot: .05, wide: true });
    if (t > t104 - .3) { g.fillStyle = 'rgba(8,6,18,' + (.6 * seg(t, t104 - .3, t104)) + ')'; g.fillRect(0, 0, W, H); counter(g, 960, 560, seg(t, t104 - .3, t104 + .8), 104000, 160, NVL, { pre: '≈ $' }); chip(g, 'FROM $12', 960, 720, { px: 50, bg: YEL, s: pop(t, t104 + .3), rot: .03, wide: true }); }
    g.restore();
    vignette(g, .4);
  }
  /* 54 · still the CEO, still the jacket; the kid who cleaned toilets; "a million times harder" */
  function sJensen(g, t, s) {
    var tTh = at('n8', 'thirtythree'), tJa = at('n8', 'jacket.'), t8b = start('n8b'), tTo = at('n8b', 'toilets'), t200 = at('n8b', '200'), t9 = start('n9'), tMi = at('n9', 'million');
    g.save(); cam(g, t, s, .05);
    stageSet(g, t, function (g) { if (t >= t9) return; if (t < t8b) { chipD(g, 960, 370, 1.1, t, { face: 'grin', glow: .7, label: 'NVIDIA' }); } else { toilet(g, 860, 520, 1.1); g.save(); g.translate(1060, 520); brush(g); g.restore(); txt(g, 'KENTUCKY, 1970s', 960, 180, 40, CREAM, { fam: MONO, wt: 700 }); } });
    var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [140, -270], look: [-.2, -.2], mouth: 'talk' }], [tJa, { lh: [-40, -120], rh: [40, -120], mouth: 'smirk', eyes: 'squint' }], [t9, { lh: [-60, -150], rh: [60, -150], look: [.2, .2], mouth: 'flat', brow: -1 }], [tMi, { lh: [-120, -230], rh: [120, -230], mouth: 'O', eyes: 'wide', brow: 1 }]]);
    guy(g, 960, 960, 1.15, P, JEN, t);
    g.restore();
    chip(g, 'STILL THE CEO · 33 YEARS', 960, 70, { px: 40, bg: CREAM, s: pop(t, tTh - .1) * (1 - seg(t, t8b - .2, t8b)), rot: -.02, wide: true });
    chip(g, 'STILL THE JACKET', 480, 760, { px: 40, bg: YEL, s: pop(t, tJa - .1) * (1 - seg(t, t8b - .2, t8b)), rot: .04, wide: true });
    if (t > t200 - .3 && t < t9 + .2) bigNum(g, '$200 BILLION+', 960, 250, 110, NVL, pop(t, t200 - .2) * (1 - seg(t, t9, t9 + .2)));
    if (t > tTo - .2 && t < t200) sticky(g, ['REMEMBER', 'THE TOILETS?'], 1580, 300, pop(t, tTo - .2), .05, { px: 46 });
    if (t > t9 - .1) { g.fillStyle = 'rgba(8,6,18,' + (.7 * seg(t, t9 - .1, t9 + .3)) + ')'; g.fillRect(0, 0, W, H); quote(g, t, 'n9', 420, { px: 62, maxw: 1600, hot: /million|harder/i }); txt(g, 'JENSEN HUANG ON THE ACQUIRED PODCAST, 2023', 960, 820, 28, CREAM, { fam: MONO, wt: 700, a: seg(t, t9, t9 + .4) }); }
    vignette(g, .4);
  }

  /* =================================================================== the ending */
  /* 55 · why it matters: the same chip, two jobs (the split screen) */
  function sSplit(g, t, s) {
    var t2 = start('e2'), tCo = at('e2', 'cousins'), tGa = at('e2', 'games.'), t3 = start('e3'), tTw = at('e3', 'twenty'), tPa = at('e3', 'paid'), t3b = start('e3b'), tSt = at('e3b', 'stadium'), tKe = at('e3b', 'kept'), tSd = at('e3b', 'standing');
    g.save(); cam(g, t, s, .04);
    if (t < t3b) {
      /* left: a gamer; right: someone asking an AI; the seam is one chip */
      g.save(); g.beginPath(); g.rect(0, 0, W / 2, H); g.clip(); wall(g, '#3a1f4a', '#24132e'); floorAt(g, 880, '#2e1f38');
      monitor(g, 480, 430, 520, 320, function (g, w, h) { var gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#ff9a6a'); gr.addColorStop(1, '#5a3a8a'); g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h); g.save(); g.translate(Math.sin(t * 1.4) * 160, 20); g.beginPath(); g.moveTo(0, -30); g.lineTo(46, 24); g.lineTo(0, 8); g.lineTo(-46, 24); g.closePath(); fillStroke(g, NVL, 4); g.restore(); });
      var P = poseAt(t, [[s.t0, { lh: [-40, -170], rh: [60, -170], look: [.2, -.5], mouth: 'grin', eyes: 'wide', front: 1 }]]); P.lh = [P.lh[0] + Math.sin(t * 18) * 6, P.lh[1]];
      guy(g, 380, 1060, 1.0, P, KID, t); txt(g, 'GAMES', 480, 150, 60, CREAM, { wt: 900, wide: true, outline: 10 });
      g.restore();
      g.save(); g.beginPath(); g.rect(W / 2, 0, W / 2, H); g.clip(); wall(g, '#1a2f3a', '#0f1e26'); floorAt(g, 880, '#1a2a30');
      monitor(g, 1440, 430, 520, 320, function (g, w, h) { g.fillStyle = '#f4f1ea'; g.fillRect(-w / 2, -h / 2, w, h); txt(g, 'ChatGPT', 0, -100, 40, INK, { wt: 800 }); g.textAlign = 'left'; font(g, 24, 600); g.fillStyle = INK; g.fillText(typed('Why is the sky blue?', t, s.t0 + .3, s.t0 + 1.6), -w / 2 + 30, -20); g.fillStyle = '#3a6b2a'; g.fillText(typed('Sunlight scatters off air…', t, s.t0 + 1.8, s.t0 + 3.2), -w / 2 + 30, 30); });
      recreated(g, 1610, 610);
      var Q = poseAt(t, [[s.t0, { lh: [-40, -170], rh: [60, -180], look: [-.2, -.5], mouth: 'smile', front: 1 }]]);
      guy(g, 1540, 1060, 1.0, Q, YOU, t); txt(g, 'AI', 1440, 150, 60, CREAM, { wt: 900, wide: true, outline: 10 });
      g.restore();
      g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke();
      var ck = pop(t, tCo - .3, 2.8, .6); chipD(g, W / 2, 640, .85 * Math.max(.4, clamp(ck, 0, 1.05)), t, { face: 'grin', glow: .8, label: 'GPU' });
      chip(g, 'COUSINS', W / 2, 820, { px: 48, bg: NVL, s: pop(t, tCo - .1), rot: -.03, wide: true });
      if (t > t3 - .2) { g.fillStyle = 'rgba(8,6,18,' + (.5 * seg(t, t3 - .2, t3 + .2)) + ')'; g.fillRect(0, 0, W, H); chip(g, '20 YEARS OF GAMERS PAID FOR IT', W / 2, 560, { px: 50, bg: YEL, s: pop(t, tTw - .1), rot: -.02, wide: true }); for (var i = 0; i < 10; i++) { var ph = (t * 1.4 + i * .1) % 1; if (t < tPa - .2) break; coin(g, lerp(380, W / 2, ph), lerp(700, 640, ph) - Math.sin(ph * Math.PI) * 160, 22, YEL, Math.cos(ph * 9)); } }
    } else {
      /* the recap, three panels */
      wall(g, '#13240c', '#081405'); grid(g, 100, 'rgba(182,240,90,.05)');
      chip(g, "NVIDIA DIDN'T PREDICT AI", 960, 130, { px: 50, bg: CREAM, s: pop(t, t3b), rot: -.02, wide: true });
      [[tSt, 'BUILT A STADIUM', 'FOR GAMES', 400], [tKe, 'KEPT PAYING', 'WHEN NOBODY CARED', 960], [tSd, 'WAS STANDING THERE', 'WHEN AI WALKED IN', 1520]].forEach(function (p, i) {
        card(g, p[3], 560, 480, 520, (i - 1) * .035, pop(t, (i === 0 ? Math.min(p[0], t3b + .4) : p[0]) - .2), function (g) {
          if (i === 0) stadium(g, -190, -150, 9, 4, 44, t, function () { return 1; }, { pix: function (j) { return j % 2 ? NVL : YEL; } });
          else if (i === 1) { coin(g, -60, -110, 40, YEL, 1); coin(g, 30, -140, 40, YEL, 1); coin(g, 80, -90, 40, YEL, 1); }
          else { g.save(); g.translate(0, -20); g.scale(.55, .55); guy(g, 0, 0, 1, { lh: [-60, -150], rh: [60, -150], lf: [-26, 0], rf: [26, 0], hip: 0, lean: 0, tilt: 0, look: [-.6, 0], eyes: 'dot', brow: 0, mouth: 'smirk', jump: 0, front: 0 }, JEN, t); g.restore(); }
          txt(g, p[1], 0, 120, 36, INK, { wt: 900, wide: true }); txt(g, p[2], 0, 180, 28, INK, { fam: MONO, wt: 700 });
        });
      });
    }
    g.restore();
    vignette(g, .4);
  }
  /* 56 · Google, Amazon and AMD building chips to knock Nvidia off the top */
  function sRivals(g, t, s) {
    var tGo = at('e4', 'google,'), tAm = at('e4', 'amazon'), tAd = at('e4', 'amd'), tKn = at('e4', 'knock'), tNo = at('e4b', 'not'), tFo = at('e4b', 'for'), back = eio(seg(t, tNo - .2, tNo + .5));
    g.save(); cam(g, t, s, .06);
    wall(g, '#22283e', '#151a2a');
    g.beginPath(); g.moveTo(-200, 1100); g.lineTo(960, 360); g.lineTo(2120, 1100); g.closePath(); fillStroke(g, '#4a4458', 8);
    chipD(g, 960, 260, .9, t, { face: t > tKn && t < tNo ? 'o' : 'grin', glow: .7 + back * .3, label: 'NVIDIA', rot: knock(t, tKn, 20, 4) * .15 });
    [[tGo, 'GOOGLE TPU', 520, '#4a7bd8', '#9fc4ff'], [tAm, 'AMAZON TRAINIUM', 960, '#ff9a3d', '#ffd29a'], [tAd, 'AMD INSTINCT', 1400, '#d84a4a', '#ff9f9f']].forEach(function (r, i) {
      var k = pop(t, r[0] - .3, 2.8, .6); if (k <= 0) return; var cl = seg(t, r[0], tNo) * (1 - back * .7), y = lerp(960, 640, cl) + Math.sin(t * 6 + i) * 6, x = lerp(r[2], r[2] + (960 - r[2]) * .4, cl);
      chipD(g, x, y, .6 * clamp(k, 0, 1.05), t, { face: 'grin', die: r[3], die2: r[4], label: r[1], seed: i + 7 });
    });
    g.restore();
    stamp(g, 'NOT YET', 960, 560, t, tNo, { px: 90, col: NVL, rot: -.08 });
    chip(g, 'EVERYONE WANTS THE TOP', 960, 130, { px: 48, bg: YEL, s: pop(t, tKn - .1) * (1 - seg(t, tFo - .3, tFo - .05)), rot: -.02, wide: true });
    chip(g, 'MOST AI CHIPS: STILL NVIDIA', 960, 130, { px: 48, bg: NVL, s: pop(t, tFo - .05), rot: .02, wide: true });
    vignette(g, .4);
  }
  /* 57 · 1993, three engineers and a lot of coffee; tonight, the same diner, a question, their chips */
  function sDiner(g, t, s) {
    var t6 = start('e6'), tTy = at('e6', 'type'), tCh = at('e6', 'chips.');
    var nk = eio(seg(t, t6 - .3, t6 + .4));
    g.save(); cam(g, t, s, .05, 960, 520);
    diner(g, t, { night: nk > .5 });
    if (nk < 1) {
      g.save(); g.globalAlpha = 1 - nk;
      [[640, CHRIS, .5], [960, JEN, 0], [1280, CURT, -.5]].forEach(function (c, i) { var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [90, -200], look: [c[2], -.1], mouth: i === 1 ? 'talk' : 'smile' }]]); guy(g, c[0], 900, .95, P, c[1], t); });
      for (var i = 0; i < 5; i++) mug(g, 600 + i * 180, 690, .6, t, true);
      g.restore(); sepia(g, .5 * (1 - nk));
      dateTag(g, '1992', t, s.t0 + .1, t6);
    }
    if (nk > 0) {
      g.save(); g.globalAlpha = nk;
      var P = poseAt(t, [[s.t0, { lh: [-40, -170], rh: [70, -200], look: [.3, -.4], mouth: 'smile', front: 1 }], [tCh, { mouth: 'grin', eyes: 'happy' }]]);
      guy(g, 960, 900, 1.0, Object.assign({}, P), Object.assign({}, YOU, { hold: [null, phoneH] }), t);
      mug(g, 700, 690, .7, t, true);
      g.restore();
      dateTag(g, 'TONIGHT', t, t6);
    }
    g.restore();
    /* the question becomes a packet that flies to a chip far away */
    var pk = seg(t, tTy + .3, tCh - .2); if (pk > 0 && pk < 1) { var x = lerp(1040, 1700, eio(pk)), y = lerp(700, 260, eio(pk)); glow(g, x, y, 90, 'rgba(182,240,90,.8)', 1); circ(g, x, y, 16); fillStroke(g, NVL, 5); }
    if (t > tCh - .4) chipD(g, 1700, 260, .6 * clamp(pop(t, tCh - .4), 0, 1.05), t, { face: 'grin', glow: .9, label: 'NVIDIA' });
    vignette(g, .4);
  }
  /* 58 · watch next (the undersea cables episode, live on the channel) and subscribe */
  function sCard(g, t, s) {
    var tCa = at('e7', 'cable'), tCu = at('e7', 'cut'), tHe = at('e7', 'here.'), t8 = start('e8'), tSu = at('e8', 'subscribe'), tWh = at('e8', 'which');
    g.save(); cam(g, t, s, .04);
    wall(g, '#2f2752', '#1f1a38'); grid(g, 80);
    var vk = pop(t, s.t0 + .1, 2.6, .6);
    if (vk > 0) {
      g.save(); g.translate(1240, 470); g.scale(clamp(vk, 0, 1.04), clamp(vk, 0, 1.04)); g.rotate(.02);
      rr(g, -400, -225, 800, 450, 18); fillStroke(g, '#0c2a4a', 8);
      g.save(); g.beginPath(); g.rect(-392, -217, 784, 434); g.clip();
      var gr = g.createLinearGradient(0, -217, 0, 217); gr.addColorStop(0, '#1d5a8a'); gr.addColorStop(1, '#06182c'); g.fillStyle = gr; g.fillRect(-392, -217, 784, 434);
      g.fillStyle = '#c9a26a'; g.beginPath(); g.moveTo(-392, 217); for (var x = -392; x <= 392; x += 40) g.lineTo(x, 150 + Math.sin(x * .02) * 14); g.lineTo(392, 217); g.closePath(); g.fill();
      /* the cable along the sea floor, snapping when "cut" is said */
      var cutK = seg(t, tCu - .1, tCu + .4), gap = 40 * eo(cutK);
      g.strokeStyle = INK; g.lineWidth = 16; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-392, 120); g.quadraticCurveTo(-200, 100, -gap, 120); g.stroke(); g.beginPath(); g.moveTo(gap, 120); g.quadraticCurveTo(200, 140, 392, 110); g.stroke();
      g.strokeStyle = YEL; g.lineWidth = 6; g.beginPath(); g.moveTo(-392, 120); g.quadraticCurveTo(-200, 100, -gap, 120); g.stroke(); g.beginPath(); g.moveTo(gap, 120); g.quadraticCurveTo(200, 140, 392, 110); g.stroke();
      if (t > tCu) spark(g, 0, 120, t, tCu, .9);
      g.restore();
      txt(g, 'WHAT IF EVERY UNDERSEA', 0, -120, 46, CREAM, { wt: 900, wide: true, outline: 9 }); txt(g, 'CABLE WAS CUT?', 0, -50, 46, CREAM, { wt: 900, wide: true, outline: 9 });
      g.restore();
      chip(g, 'WATCH NEXT ▶', 1240, 170, { px: 48, bg: YEL, s: pop(t, tHe - .2), rot: -.03, wide: true });
      if (t > tHe - .2) arrow(g, 900, 860, 1050, 700, seg(t, tHe - .2, tHe + .3), YEL, 9);
    }
    /* subscribe, and which company next */
    var sk = pop(t, tSu - .2, 3, .6);
    if (sk > 0) { g.save(); g.translate(440, 400); g.scale(clamp(sk, 0, 1.05), clamp(sk, 0, 1.05)); rr(g, -220, -60, 440, 120, 30); fillStroke(g, RED, 7); txt(g, 'SUBSCRIBE', 0, 4, 54, '#fff', { wt: 900, wide: true }); g.restore(); }
    bubble(g, ['WHICH COMPANY NEXT?'], 440, 700, pop(t, tWh - .2), { px: 40, bg: CREAM, tail: -.3 });
    var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [130, -250], look: [.6, -.2], mouth: 'smile' }], [tSu, { rh: [100, -310], mouth: 'grin', eyes: 'happy' }]]);
    guy(g, 260, 1000, .85, P, YOU, t);
    g.restore();
    vignette(g, .35);
  }
