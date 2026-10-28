  /* =================================================================== part 2 · thirty days from dead */
  /* 21 · NV1 builds worlds from curves; everyone else picks triangles; Microsoft too */
  function sCurves(g, t, s) {
    var tNV = at('d1', 'nv1,'), tCu = at('d1', 'curves.'), tTr = at('d2', 'triangles.'), tMs = at('d2', 'microsoft'), tD = at('d2', 'dead.');
    g.save(); cam(g, t, s, .06);
    wall(g, '#1d2440', '#121729'); grid(g, 80, 'rgba(120,200,255,.06)');
    dateTag(g, '1995', t, at('d1', '1995,') - .1);
    chipD(g, 300, 330, .8 * clamp(pop(t, tNV - .2), 0, 1.05), t, { label: 'NV1', face: t > tD ? 'x' : 'dot' });
    /* left: a ship made of curves; right: the same ship made of triangles */
    var ck = pop(t, tCu - .3, 2.6, .6);
    if (ck > 0) { g.save(); g.translate(760, 560); g.scale(clamp(ck, 0, 1.05), clamp(ck, 0, 1.05)); g.rotate(Math.sin(t) * .06);
      g.beginPath(); g.moveTo(-200, 40); g.bezierCurveTo(-160, -160, 160, -160, 200, 40); g.bezierCurveTo(120, 120, -120, 120, -200, 40); g.closePath(); fillStroke(g, t > tD ? '#6a6a7a' : '#ff8a3d', 7);
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; for (var i = 1; i < 5; i++) { g.beginPath(); g.moveTo(-200 + i * 80, 40); g.quadraticCurveTo(-200 + i * 80, -100 + Math.abs(i - 2.5) * 20, -180 + i * 80, -60); g.stroke(); }
      g.restore(); txt(g, 'CURVES', 760, 780, 60, CREAM, { wt: 900, wide: true, outline: 10 }); }
    var tk = pop(t, tTr - .3, 2.6, .6);
    if (tk > 0) { g.save(); g.translate(1360, 560); g.scale(clamp(tk, 0, 1.05), clamp(tk, 0, 1.05)); g.rotate(Math.sin(t + 1) * .06);
      var pts = [[-200, 40], [-100, -80], [0, -110], [100, -80], [200, 40], [100, 90], [0, 100], [-100, 90]];
      for (i = 0; i < pts.length; i++) { var a = pts[i], b = pts[(i + 1) % pts.length]; g.beginPath(); g.moveTo(0, 0); g.lineTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.closePath(); fillStroke(g, ['#76b900', '#8ccf1a', '#5a9a00', '#a2e03a'][i % 4], 5); }
      g.restore(); txt(g, 'TRIANGLES', 1360, 780, 60, NVL, { wt: 900, wide: true, outline: 10 }); }
    stamp(g, 'MICROSOFT: TRIANGLES', 1360, 300, t, tMs + .2, { px: 46, col: NVL, rot: .06 });
    if (t > tD - .1) { g.save(); g.lineCap = 'round'; var xk = seg(t, tD - .1, tD + .2); g.strokeStyle = INK; g.lineWidth = 34; g.beginPath(); g.moveTo(560, 380); g.lineTo(lerp(560, 960, xk), lerp(380, 760, xk)); g.stroke(); g.strokeStyle = RED; g.lineWidth = 20; g.stroke(); g.restore(); }
    g.restore();
    vignette(g, .45);
  }
  /* 22 · Sega: the same wrong way; "find another partner… and pay us anyway"; five million, six months */
  function sSega(g, t, s) {
    var t3 = start('d3'), t4 = start('d4'), tWi = at('d4', 'wild.'), tFi = at('d4', 'find'), tPa = at('d4', 'pay'), tY = at('d5', 'yes.'), t5 = at('d5', '5'), tSi = at('d5', 'six');
    g.save(); cam(g, t, s, .06, 960, 560);
    wall(g, '#2a3a6a', '#1a2548'); floorAt(g, 880, '#2a2238');
    /* a console on the meeting table */
    rr(g, 520, 660, 880, 46, 10); fillStroke(g, '#c9c3cf', 6); g.fillStyle = '#9a96a6'; g.fillRect(940, 706, 40, 180);
    var ck = pop(t, t3 - .1, 3, .6); if (ck > 0) { g.save(); g.translate(960, 620); g.scale(clamp(ck, 0, 1.05), clamp(ck, 0, 1.05)); rr(g, -150, -50, 300, 80, 24); fillStroke(g, '#2b2b35', 5); circ(g, -60, -10, 20); fillStroke(g, '#5a5866', 4); [[60, -26, RED], [90, -6, YEL], [60, 14, NV], [30, -6, BLUE]].forEach(function (b) { circ(g, b[0], b[1], 11); fillStroke(g, b[2], 3); }); g.restore(); txt(g, "SEGA'S NEXT CONSOLE", 960, 520, 34, CREAM, { fam: MONO, wt: 700, outline: 6 }); }
    var J = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [60, -160], look: [.6, 0], mouth: 'flat', brow: -1 }], [tFi - .2, { rh: [160, -260], mouth: 'talk', brow: 1 }], [tPa - .1, { lh: [-40, -200], rh: [150, -180], mouth: 'grin', eyes: 'squint' }], [tY, { lh: [-130, -300], rh: [130, -300], mouth: 'grin', eyes: 'happy', jump: 30 }], [tY + .5, { jump: 0 }]]);
    guy(g, 520, 900, 1.15, J, JEN, t);
    var S2 = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [60, -150], look: [-.6, 0], mouth: 'flat' }], [tPa + .2, { mouth: 'O', eyes: 'wide', brow: 1 }], [tY - .3, { rh: [-130, -220], mouth: 'smile', eyes: 'happy', tilt: -.08 }]]);
    guy(g, 1400, 900, 1.15, S2, SEGA, t);
    bubble(g, ['FIND ANOTHER PARTNER…'], 560, 340, pop(t, tFi - .2) * (1 - seg(t, tPa - .1, tPa)), { px: 44 });
    bubble(g, ['…BUT PAY US ANYWAY?'], 560, 340, pop(t, tPa - .1) * (1 - seg(t, tY - .2, tY)), { px: 44, bg: YEL });
    /* the cheque and the hourglass */
    var qk = pop(t, t5 - .2, 2.8, .6);
    if (qk > 0) { g.save(); g.translate(1060, 300); g.rotate(-.05); g.scale(clamp(qk, 0, 1.05), clamp(qk, 0, 1.05)); rr(g, -300, -100, 600, 200, 10); fillStroke(g, '#dff0d8', 6); txt(g, 'PAY TO: NVIDIA', -100, -50, 30, INK, { fam: MONO, wt: 700 }); txt(g, '$5,000,000', 40, 30, 80, '#2f6b3a', { wt: 900, wide: true }); g.restore(); }
    var hk = pop(t, tSi - .3, 2.8, .6);
    if (hk > 0) { g.save(); g.translate(1680, 560); g.scale(clamp(hk, 0, 1.05), clamp(hk, 0, 1.05)); var sand = seg(t, tSi, s.t1);
      g.beginPath(); g.moveTo(-70, -120); g.lineTo(70, -120); g.lineTo(8, 0); g.lineTo(70, 120); g.lineTo(-70, 120); g.lineTo(-8, 0); g.closePath(); fillStroke(g, 'rgba(200,230,255,.35)', 6);
      g.fillStyle = YEL; g.beginPath(); g.moveTo(-60 + sand * 50, -110 + sand * 100); g.lineTo(60 - sand * 50, -110 + sand * 100); g.lineTo(6, -4); g.lineTo(-6, -4); g.closePath(); g.fill(); g.beginPath(); g.moveTo(-60, 112); g.lineTo(60, 112); g.lineTo(60 - (1 - sand) * 50, 112 - sand * 70); g.lineTo(-60 + (1 - sand) * 50, 112 - sand * 70); g.closePath(); g.fill();
      g.restore(); chip(g, '≈ 6 MONTHS', 1680, 760, { px: 44, bg: CREAM, s: hk, rot: .03, wide: true }); }
    g.restore();
    chip(g, 'THE SAME WRONG WAY', 960, 140, { px: 50, bg: RED, fg: '#fff', s: pop(t, at('d3', 'wrong') - .15) * (1 - seg(t, t4 - .3, t4)), rot: -.03, wide: true });
    chip(g, 'SOMETHING WILD', 960, 140, { px: 54, bg: YEL, s: pop(t, tWi - .15) * (1 - seg(t, tFi - .2, tFi)), rot: .02, wide: true });
    chip(g, 'SHOICHIRO IRIMAJIRI · SEGA OF AMERICA', 1300, 960, { px: 32, bg: CREAM, s: pop(t, at('d5', 'shoichiro') - .1), rot: -.01 });
    vignette(g, .4);
  }
  /* 23 · half the people out; every chip on the RIVA 128 */
  function sAllIn(g, t, s) {
    var tH = at('d6', 'half'), tB = at('d6', 'everything'), tR = at('d6', 'riva');
    g.save(); cam(g, t, s, .07);
    wall(g, '#3a3450', '#25203a'); floorAt(g, 880, '#2e2840');
    /* the door on the right */
    rr(g, 1660, 420, 200, 460, 8); fillStroke(g, '#7a5a3a', 6); circ(g, 1690, 660, 10); g.fillStyle = YEL; g.fill();
    for (var i = 0; i < 10; i++) {
      var leave = i % 2 === 1, lk = leave ? seg(t, tH - .2 + i * .06, tH + 1.4 + i * .06) : 0, x = lerp(160 + i * 140, 1760, eio(lk)), a = 1 - seg(lk, .85, 1);
      if (a <= 0) continue;
      var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [60, -150], look: [.3, 0], mouth: 'smile' }], [tH - .2, leave ? { mouth: 'frown', look: [1, 0], brow: -1 } : { mouth: 'flat', eyes: 'wide' }]]);
      if (leave && lk > 0 && lk < 1) { P.lf = [-26 + Math.sin(t * 14 + i) * 22, 0]; P.rf = [26 - Math.sin(t * 14 + i) * 22, 0]; }
      g.save(); g.globalAlpha = a; guy(g, x, 900, .62, P, { col: ['#3d7bff', '#ff5b3d', '#5fb86b', '#ffc83d', '#b06bff'][i % 5], shade: 'rgba(0,0,0,.25)', seed: 50 + i, hair: i % 3 ? 'cap' : null, hairCol: '#3a2a20' }, t); g.restore();
    }
    /* the all-in: chips pushed onto one card, poker style */
    var ak = pop(t, tB - .3, 2.6, .6);
    if (ak > 0) { gpuCard(g, 960, 420, .9 * clamp(ak, 0, 1.05), t, { label: 'RIVA 128', glow: t > tR ? .6 : 0, fans: 1 });
      for (i = 0; i < 14; i++) { var ck = seg(t, tB + i * .05, tB + .5 + i * .05), sx = lerp(hash(i) * W, 760 + (i % 7) * 60, eio(ck)), sy = lerp(1100, 230 - Math.floor(i / 7) * 26, eio(ck)); if (ck > 0) { g.save(); g.translate(sx, sy); g.scale(1, .45); circ(g, 0, 0, 30); fillStroke(g, [RED, CREAM, BLUE][i % 3], 5); g.restore(); } } }
    g.restore();
    chip(g, 'ABOUT HALF LAID OFF', 600, 230, { px: 48, bg: RED, fg: '#fff', s: pop(t, tH - .1), rot: -.03, wide: true });
    chip(g, 'ALL IN', 1400, 160, { px: 60, bg: YEL, s: pop(t, tB - .1), rot: .03, wide: true });
    vignette(g, .4);
  }
  /* 24 · one month of payroll left; a million units in four months */
  function sPayroll(g, t, s) {
    var tS = at('d7', 'ships'), tO = at('d7', 'month'), t8 = start('d8'), tMi = at('d8', 'million'), tF = at('d8', 'four');
    g.save(); cam(g, t, s, .06);
    wall(g, '#2a3a2a', '#1a261a'); floorAt(g, 860, '#2a2430');
    dateTag(g, 'AUG 1997', t, at('d7', 'august') - .1);
    /* bank balance, almost empty */
    var bk = pop(t, tO - .4, 2.8, .6);
    if (bk > 0) { g.save(); g.translate(440, 400); g.scale(clamp(bk, 0, 1.05), clamp(bk, 0, 1.05)); rr(g, -260, -170, 520, 340, 20); fillStroke(g, CREAM, 6); txt(g, 'PAYROLL LEFT', 0, -110, 40, INK, { fam: MONO, wt: 700 }); for (var i = 0; i < 12; i++) { rr(g, -230 + i * 38, -50, 30, 120, 6); fillStroke(g, i === 0 ? RED : '#e2dccb', 4); } txt(g, '1 MONTH', 0, 120, 60, RED, { wt: 900, wide: true }); g.restore(); }
    /* a conveyor of boxes */
    g.fillStyle = '#4a4458'; g.fillRect(-200, 780, W + 400, 30); g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(-200, 780, W + 400, 30);
    for (i = 0; i < 9; i++) { var bx = ((i * 260 + (t - tS) * 260) % 2340) - 200; if (t < tS) break; g.save(); g.translate(bx, 700); rr(g, -80, -80, 160, 160, 6); fillStroke(g, '#c9a26a', 5); g.fillStyle = '#a8794a'; g.fillRect(-12, -80, 24, 160); txt(g, 'RIVA 128', 0, 0, 22, INK, { fam: MONO, wt: 700 }); g.restore(); }
    var mk = seg(t, tMi - .4, tF + .6);
    if (t > t8 - .2) { bigNum(g, Math.round(1000000 * eo(mk)).toLocaleString('en-US'), 1260, 400, 140, NVL, pop(t, t8 - .2)); chip(g, 'SOLD IN 4 MONTHS', 1260, 540, { px: 50, bg: YEL, s: pop(t, tF - .1), rot: .02, wide: true }); }
    g.restore();
    vignette(g, .4);
  }
  /* 25 · the motto */
  function sMotto(g, t, s) {
    var t10 = start('d10');
    g.save(); cam(g, t, s, .05);
    wall(g, '#3a1f2a', '#24131b'); grid(g, 80);
    calendar(g, 960, 790, .8 * clamp(pop(t, s.t0 + .2), 0, 1.05), 'COUNTDOWN', String(Math.max(0, 30 - Math.floor(clamp(seg(t, t10, end('d10') + 1.2), 0, 1) * 4))), { px: 140, sub: 'DAYS' });
    if (t < t10) chip(g, 'THE UNOFFICIAL MOTTO', 960, 380, { px: 60, bg: YEL, s: pop(t, at('d9', 'motto.') - .2), rot: -.03, wide: true });
    else quote(g, t, 'd10', 400, { px: 72, maxw: 1700, hot: /thirty|days/i, hotCol: RED });
    g.restore();
    vignette(g, .45);
  }

  /* =================================================================== part 3 · the GPU */
  /* 26 · IPO day, $12 a share */
  function sIPO(g, t, s) {
    var t12 = at('g1', '12'), tR = at('g1', 'remember');
    g.save(); cam(g, t, s, .06);
    wall(g, '#14233a', '#0b1424');
    /* the ticker board */
    rr(g, 160, 140, 1600, 200, 14); fillStroke(g, '#05070c', 8);
    g.save(); g.beginPath(); g.rect(170, 150, 1580, 180); g.clip(); var tick = 'NVDA 12.00 ▲   INTC   MSFT   CSCO   AAPL   '; font(g, 64, 700, MONO); var tw = g.measureText(tick).width, off = (t * 160) % tw;
    for (var i = 0; i < 4; i++) txt(g, tick, 170 - off + i * tw, 240, 64, '#ffd23d', { fam: MONO, wt: 700, align: 'left' }); g.restore();
    floorAt(g, 880, '#2a2438');
    var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [100, -280], look: [.4, -.4], mouth: 'grin', eyes: 'happy' }], [t12, { lh: [-130, -290], rh: [130, -290], jump: 40 }], [t12 + .4, { jump: 0, lh: [-60, -150], rh: [110, -260] }]]);
    guy(g, 560, 920, 1.2, P, JEN, t);
    tag(g, '$12', 1180, 560, pop(t, t12 - .15), { px: 130, rot: .08 });
    sticky(g, ['REMEMBER', '$12'], 1580, 640, pop(t, tR - .1), .05);
    g.restore();
    dateTag(g, 'JAN 22, 1999', t, at('g1', 'january') - .1);
    chip(g, 'NVIDIA GOES PUBLIC', 960, 420, { px: 50, bg: CREAM, s: pop(t, at('g1', 'public') - .1) * (1 - seg(t, t12 - .3, t12)), rot: -.02, wide: true });
    vignette(g, .4);
  }
  /* 27 · GeForce 256, "the world's first GPU" */
  function sGeForce(g, t, s) {
    var tG = at('g2', 'geforce'), tN = at('g2', 'word:'), tF = at('g2', 'first');
    g.save(); cam(g, t, s, .07);
    wall(g, '#1a2a0e', '#0c1506'); grid(g, 100, 'rgba(182,240,90,.05)');
    var bk = pop(t, tG - .3, 2.6, .6);
    if (bk > 0) { g.save(); g.translate(760, 560); g.scale(clamp(bk, 0, 1.05), clamp(bk, 0, 1.05)); g.rotate(-.06);
      rr(g, -320, -340, 640, 680, 18); fillStroke(g, '#24301a', 8); g.fillStyle = NV; g.beginPath(); g.moveTo(-320, 100); g.lineTo(320, -60); g.lineTo(320, 20); g.lineTo(-320, 180); g.closePath(); g.fill();
      gpuCard(g, 0, -60, .9, t, { glow: .5, fans: 1 }); txt(g, 'GEFORCE 256', 0, 240, 64, CREAM, { wt: 900, wide: true, outline: 10 }); g.restore(); }
    var nk = pop(t, tN - .1, 3, .55);
    if (nk > 0) { g.save(); g.translate(1420, 380); g.rotate(.12); g.scale(clamp(nk, 0, 1.06) * 1.0, clamp(nk, 0, 1.06)); g.beginPath(); for (var i = 0; i < 24; i++) { var a = i / 24 * 6.283, r = i % 2 ? 180 : 210; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); fillStroke(g, YEL, 7); txt(g, "WORLD'S", 0, -60, 46, INK, { wt: 900, wide: true }); txt(g, 'FIRST', 0, -4, 46, INK, { wt: 900, wide: true }); txt(g, 'GPU', 0, 70, 96, RED, { wt: 900, wide: true }); g.restore(); }
    if (t > tF) for (i = 0; i < 3; i++) spark(g, 1420 + (i - 1) * 200, 260 + (i % 2) * 220, t, tF + i * .1, .8);
    g.restore();
    chip(g, 'A BRAND NEW WORD', 1420, 780, { px: 44, bg: CREAM, s: pop(t, tN - .2), rot: -.03, wide: true });
    vignette(g, .4);
  }
  /* 28 · what is a GPU: two million pixels, sixty times a second */
  function sPixels(g, t, s) {
    var t4 = start('g4'), tTw = at('g4', 'two'), tSi = at('g4', 'sixty');
    g.save(); cam(g, t, s, .05);
    wall(g, '#1d2440', '#121729');
    var zk = eio(seg(t, tTw - .6, tTw + .8));
    monitor(g, 960, 470, lerp(1100, 1400, zk), lerp(620, 780, zk), function (g, w, h) {
      /* a little game frame: mountains, a ship */
      var gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#ff9a6a'); gr.addColorStop(1, '#5a3a8a'); g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h);
      g.fillStyle = '#3a2560'; g.beginPath(); g.moveTo(-w / 2, h / 2); for (var x = -w / 2; x <= w / 2; x += 60) g.lineTo(x, h * .15 + Math.sin(x * .01) * 60 + Math.sin(x * .03) * 30); g.lineTo(w / 2, h / 2); g.closePath(); g.fill();
      g.save(); g.translate(Math.sin(t * 1.4) * 200, -40 + Math.sin(t * 2.3) * 30); g.beginPath(); g.moveTo(0, -40); g.lineTo(60, 30); g.lineTo(0, 10); g.lineTo(-60, 30); g.closePath(); fillStroke(g, NVL, 5); g.restore();
      /* the pixel grid fades in as the count is spoken */
      if (zk > 0) { var cell = lerp(80, 26, zk); g.strokeStyle = 'rgba(0,0,0,' + (.5 * zk) + ')'; g.lineWidth = 2; for (x = -w / 2; x < w / 2; x += cell) { g.beginPath(); g.moveTo(x, -h / 2); g.lineTo(x, h / 2); g.stroke(); } for (var y = -h / 2; y < h / 2; y += cell) { g.beginPath(); g.moveTo(-w / 2, y); g.lineTo(w / 2, y); g.stroke(); } }
      /* the redraw sweep, sixty a second (shown slowed down) */
      if (t > tSi - .2) { var sy = ((t * 2.2) % 1) * h - h / 2; g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-w / 2, sy, w, 16); }
    });
    g.restore();
    chip(g, 'SO WHAT IS A GPU?', 960, 110, { px: 56, bg: YEL, s: pop(t, s.t0 + .1) * (1 - seg(t, t4 - .2, t4)), rot: -.02, wide: true });
    if (t > tTw - .3) { var ck = seg(t, tTw - .2, tTw + .9); bigNum(g, Math.round(2073600 * eo(ck)).toLocaleString('en-US') + ' PIXELS', 960, 110, 76, CREAM, pop(t, tTw - .3)); }
    chip(g, '× 60 EVERY SECOND', 1560, 230, { px: 52, bg: NVL, s: pop(t, tSi - .15), rot: .03, wide: true });
    vignette(g, .4);
  }
  /* 29 · a CPU: a few brilliant professors, one problem at a time */
  function sProfs(g, t, s) {
    var tP = at('g5', 'professors.'), tO = at('g5', 'one');
    g.save(); cam(g, t, s, .06);
    wall(g, '#2f4a3a', '#1f3026'); floorAt(g, 880, '#3a2a22');
    rr(g, 220, 140, 1480, 420, 10); fillStroke(g, '#24382c', 10); g.strokeStyle = '#8a6a4a'; g.lineWidth = 14; g.strokeRect(220, 140, 1480, 420);
    txt(g, 'CPU', 400, 220, 70, 'rgba(255,255,255,.85)', { wt: 900, wide: true });
    var eq = ['∫ x² dx', 'a² + b² = c²', 'E = mc²', 'Σ 1/n²'];
    var q = Math.floor(clamp(seg(t, tO - .3, s.t1), 0, .999) * 4);
    for (var i = 0; i < 3; i++) {
      var x = 560 + i * 420, P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [-40, -330], look: [-.3, -.6], mouth: 'flat', brow: -1 }], [tP, { rh: [-90, -310], mouth: 'smile' }]]);
      P.rh = [P.rh[0] + Math.sin(t * 6 + i) * 20, P.rh[1] + Math.cos(t * 7 + i) * 12];
      txt(g, eq[(q + i) % 4], x - 60, 380, 44, 'rgba(255,255,255,.85)', { fam: SERIF, wt: 400 });
      guy(g, x, 920, 1.05, P, Object.assign({}, HINT, { col: ['#b07a4a', '#6a7d8c', '#8a5a7a'][i], seed: 60 + i, hold: [null, function (g) { g.fillStyle = '#fff'; g.fillRect(-6, -14, 12, 22); }] }), t);
    }
    /* the queue of problems waiting */
    for (i = 0; i < 6; i++) { var qx = 1820 - i * 18, qy = 700 - i * 60; card(g, qx, qy, 120, 70, .1 - i * .04, pop(t, tO - .2 + i * .06), function (g) { txt(g, '?', 0, 4, 46, INK, { wt: 900 }); }); }
    g.restore();
    chip(g, 'A FEW BRILLIANT PROFESSORS', 960, 640, { px: 48, bg: CREAM, s: pop(t, tP - .2), rot: -.02, wide: true });
    chip(g, 'ONE PROBLEM AT A TIME', 960, 740, { px: 46, bg: YEL, s: pop(t, tO - .1), rot: .02, wide: true });
    vignette(g, .4);
  }
  /* 30 · a GPU: a stadium full of kids doing simple sums, all at once; two million kids, one sum each */
  function sStadium(g, t, s) {
    var tSt = at('g6', 'stadium'), tSa = at('g6', 'same'), t6b = start('g6b'), tRed = at('g6b', 'red'), tDa = at('g6b', 'darkens'), tTw = at('g6b', 'two'), tDo = at('g6b', 'done.'), t7 = start('g7'), tW = at('g7', 'wins.');
    g.save();
    var zoom = t < t6b ? 1 : t < tTw ? lerp(1, 2.4, eio(seg(t, t6b, t6b + .6))) * (1 - 0) : lerp(2.4, 1, eio(seg(t, tTw - .2, tTw + .6)));
    g.translate(960, 560); g.scale(zoom, zoom); g.translate(-960, -560); cam(g, t, s, .04);
    wall(g, '#173a1a', '#0c2010');
    /* stands */
    for (var r = 0; r < 6; r++) { g.fillStyle = r % 2 ? '#2a5a2a' : '#245024'; g.fillRect(-200, 300 + r * 108, W + 400, 108); }
    var cols = 40, rows = 14, cell = 48;
    var fill = function (i, c, rr0) {
      if (t < tSa - .1) return 0;
      if (t < tDo) return clamp(seg(t, tSa - .1, tSa + .3), 0, 1);
      return 1;
    };
    stadium(g, 0, 320, cols, rows, cell, t, fill, { pix: function (i, c, rr0) { var u = c / cols, v = rr0 / rows; return 'rgb(' + Math.round(255 * (.6 + .4 * Math.sin(u * 3 + t))) + ',' + Math.round(140 + 100 * v) + ',' + Math.round(90 + 120 * u) + ')'; } });
    /* the giant screen the stadium paints */
    rr(g, 560, 60, 800, 230, 12); fillStroke(g, '#05070c', 8);
    var sk = t < tSa ? 0 : clamp(seg(t, tSa - .1, tSa + .3), 0, 1);
    g.save(); g.beginPath(); g.rect(570, 70, 780, 210); g.clip(); var gr = g.createLinearGradient(0, 70, 0, 280); gr.addColorStop(0, '#ff9a6a'); gr.addColorStop(1, '#5a3a8a'); g.globalAlpha = sk; g.fillStyle = gr; g.fillRect(570, 70, 780, 210); g.translate(960 + Math.sin(t * 1.4) * 200, 170); g.beginPath(); g.moveTo(0, -30); g.lineTo(46, 24); g.lineTo(0, 8); g.lineTo(-46, 24); g.closePath(); fillStroke(g, NVL, 4); g.restore();
    g.restore();
    /* the close-up beat: one kid adds red, another darkens */
    if (t > t6b - .2 && t < tTw + .2) {
      var a = clamp(seg(t, t6b - .2, t6b + .2), 0, 1) * (1 - seg(t, tTw - .1, tTw + .2));
      g.save(); g.globalAlpha = a;
      card(g, 560, 520, 520, 360, -.03, 1, function (g) { g.fillStyle = 'rgb(' + (t > tRed ? 230 : 150) + ',90,70)'; g.fillRect(-200, -150, 160, 160); txt(g, '+ RED', 100, -70, 56, RED, { wt: 900, wide: true }); txt(g, t > tRed ? '✓' : '…', -120, 80, 70, INK, { wt: 900 }); });
      card(g, 1360, 520, 520, 360, .03, pop(t, tDa - .2), function (g) { g.fillStyle = t > tDa ? '#3a2a50' : '#7a6a90'; g.fillRect(-200, -150, 160, 160); txt(g, '− LIGHT', 100, -70, 56, INK, { wt: 900, wide: true }); txt(g, t > tDa ? '✓' : '…', -120, 80, 70, INK, { wt: 900 }); });
      g.restore();
    }
    chip(g, 'GPU', 220, 230, { px: 80, bg: NVL, s: pop(t, s.t0 + .1), rot: -.05, wide: true });
    chip(g, 'A STADIUM FULL OF KIDS', 960, 890, { px: 50, bg: CREAM, s: pop(t, tSt - .15) * (1 - seg(t, t6b - .3, t6b)), rot: -.02, wide: true });
    chip(g, 'ALL AT THE SAME MOMENT', 960, 890, { px: 50, bg: YEL, s: pop(t, tSa - .1) * (1 - seg(t, t6b - .3, t6b)), rot: .02, wide: true });
    chip(g, '2 MILLION KIDS · 1 SUM EACH', 960, 890, { px: 50, bg: NVL, s: pop(t, tTw - .1) * (1 - seg(t, t7 - .3, t7)), rot: -.01, wide: true });
    if (t > t7 - .2) { stamp(g, 'THE STADIUM WINS', 960, 560, t, tW - .1, { px: 100, col: NVL, rot: -.08 }); }
    vignette(g, .4);
  }
  /* 31 · 3dfx's remains; the Xbox and $200 million up front */
  function sXbox(g, t, s) {
    var t8 = start('g8'), tRe = at('g8', 'remains'), t9 = start('g9'), tX = at('g9', 'xbox,'), t2 = at('g9', '200');
    g.save(); cam(g, t, s, .06);
    wall(g, '#22283e', '#151a2a'); floorAt(g, 880, '#2a2438');
    dateTag(g, '2000', t, t8);
    if (t < t9 + .2) {
      var a = 1 - seg(t, t9, t9 + .2);
      g.save(); g.globalAlpha = a;
      /* a moving box labelled 3dfx, carried off */
      var ck = seg(t, tRe - .2, t9);
      var P = poseAt(t, [[s.t0, { lh: [-100, -230], rh: [100, -230], look: [.5, 0], mouth: 'grin' }]]);
      P.lf = [-26 + Math.sin(t * 12) * 18, 0]; P.rf = [26 - Math.sin(t * 12) * 18, 0];
      var x = lerp(300, 1300, ck);
      guy(g, x, 920, 1.1, P, JEN, t);
      g.save(); g.translate(x, 600); rr(g, -150, -110, 300, 220, 8); fillStroke(g, '#c9a26a', 6); txt(g, '3DFX', 0, -20, 64, INK, { wt: 900, wide: true }); txt(g, 'PATENTS · PEOPLE', 0, 50, 26, INK, { fam: MONO, wt: 700 }); g.restore();
      chip(g, 'THE OLD KING, BOUGHT', 960, 160, { px: 50, bg: YEL, s: pop(t, tRe - .1), rot: -.02, wide: true });
      g.restore();
    }
    if (t > t9 - .1) {
      var xk = pop(t, tX - .3, 2.6, .6);
      if (xk > 0) { g.save(); g.translate(760, 560); g.scale(clamp(xk, 0, 1.05), clamp(xk, 0, 1.05)); glow(g, 0, 0, 420, 'rgba(118,185,0,.5)', 1); rr(g, -300, -170, 600, 340, 30); fillStroke(g, '#1b1820', 8); g.strokeStyle = NVL; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath(); g.moveTo(-90, -90); g.lineTo(90, 90); g.moveTo(90, -90); g.lineTo(-90, 90); g.stroke(); txt(g, 'XBOX · 2001', 0, 220, 44, CREAM, { fam: MONO, wt: 700, outline: 7 }); g.restore(); }
      var mk = pop(t, t2 - .3, 2.8, .6);
      if (mk > 0) { cash(g, 1400, 700, 1.4 * clamp(mk, 0, 1.05), 6); bigNum(g, '$200 MILLION', 1400, 420, 92, NVL, mk); chip(g, 'UP FRONT', 1400, 530, { px: 44, bg: CREAM, s: pop(t, at('g9', 'front.') - .2), rot: .03, wide: true }); }
      chip(g, 'MICROSOFT PICKS NVIDIA', 960, 140, { px: 50, bg: CREAM, s: pop(t, at('g9', 'microsoft') - .1), rot: -.02, wide: true });
    }
    g.restore();
    vignette(g, .4);
  }
  /* 32 · the stock hits $100: the tattoo */
  function sTattoo(g, t, s) {
    var t100 = at('g10', '100'), tT = at('g10', 'tattooed');
    g.save(); cam(g, t, s, .07);
    wall(g, '#2a1f3a', '#1a1428'); grid(g, 90);
    var head = chart(g, 160, 240, 760, 500, [[0, .1], [.15, .18], [.3, .14], [.45, .35], [.6, .5], [.75, .62], [.9, .82], [1, .95]], seg(t, s.t0, t100 + .1), { col: NVL });
    if (t > t100 - .1) { tag(g, '$100', head[0] + 80, head[1] - 60, pop(t, t100 - .1), { px: 70 }); spark(g, head[0], head[1], t, t100, 1); }
    var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [60, -150], look: [-.6, -.2], mouth: 'smile' }], [t100, { lh: [-130, -280], rh: [60, -160], mouth: 'grin', eyes: 'happy' }], [tT - .2, { lh: [-170, -190], rh: [60, -150], look: [-.8, .2], mouth: 'teeth', eyes: 'squint', brow: -1 }]]);
    guy(g, 1420, 940, 1.3, P, JEN, t);
    /* the needle and the mark on his arm */
    if (t > tT - .2) { var ax = 1420 - 150 * 1.3 * .7, ay = 940 - 230 * 1.3; g.save(); g.translate(ax - 60, ay - 70 + Math.sin(t * 40) * 4); g.rotate(.6); rr(g, -14, -80, 28, 90, 8); fillStroke(g, '#c9c6d6', 4); g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 10); g.lineTo(0, 36); g.stroke(); g.restore(); for (var i = 0; i < 6; i++) { var ph = (t * 3 + i * .17) % 1; circ(g, ax - 40 + Math.cos(i) * 30 * ph, ay - 30 - ph * 40, 4); g.fillStyle = 'rgba(255,255,255,' + (1 - ph) + ')'; g.fill(); } }
    g.restore();
    chip(g, 'STOCK HITS $100 →', 540, 160, { px: 46, bg: CREAM, s: pop(t, t100 - .2), rot: -.03, wide: true });
    chip(g, 'THE LOGO, AS A TATTOO', 1400, 200, { px: 48, bg: NVL, s: pop(t, tT - .1), rot: .03, wide: true });
    vignette(g, .4);
  }

  /* =================================================================== part 4 · the bet nobody wanted */
  /* 33 · Ian Buck at Stanford wires GeForce cards together; a language for math; hired in 2004 */
  function sBuck(g, t, s) {
    var tW = at('c1', 'wiring'), t2 = start('c2'), tL = at('c2', 'language'), tMa = at('c2', 'math'), tH = at('c2', 'hires');
    g.save(); cam(g, t, s, .07);
    wall(g, '#6a2a3a', '#4a1c28'); floorAt(g, 880, '#3a2a2a');
    chip(g, 'STANFORD', 560, 150, { px: 46, bg: CREAM, s: pop(t, at('c1', 'stanford,') - .1), rot: -.03, wide: true });
    /* a tower of cards, cables between them */
    for (var i = 0; i < 6; i++) { var k = pop(t, tW - .4 + i * .08, 3, .6); if (k > 0) gpuCard(g, 560 + (i % 2) * 120, 300 + i * 90, .42 * clamp(k, 0, 1.05), t, { fans: 2, glow: t > tMa ? .25 : 0 }); }
    if (t > tW) { g.strokeStyle = '#ffc83d'; g.lineWidth = 5; for (i = 0; i < 5; i++) { g.beginPath(); g.moveTo(700, 320 + i * 90); g.quadraticCurveTo(820 + Math.sin(t * 2 + i) * 10, 360 + i * 90, 680, 410 + i * 90); g.stroke(); } }
    var P = poseAt(t, [[s.t0, { lh: [-100, -210], rh: [-40, -190], look: [-.7, -.2], mouth: 'flat', brow: 1 }], [t2, { lh: [-40, -180], rh: [70, -180], look: [.6, -.2], mouth: 'talk', front: 1 }], [tH, { lh: [-130, -280], rh: [130, -280], mouth: 'grin', eyes: 'happy' }]]);
    guy(g, 1020, 940, 1.15, P, BUCK, t);
    if (t > t2 - .2) monitor(g, 1460, 470, 520, 320, function (g, w, h) { g.textAlign = 'left'; font(g, 26, 600, MONO); var code = ['kernel void add(float a<>,', '               float b<>,', '               out float c<>) {', '  c = a + b;', '}', '// math, not pixels'], n = Math.floor(seg(t, tL - .3, tMa + .6) * code.join('').length); var shown = 0; code.forEach(function (l, j) { var vis = l.slice(0, clamp(n - shown, 0, l.length)); shown += l.length; g.fillStyle = j === 5 ? NVL : '#cfe6ff'; g.fillText(vis, -w / 2 + 24, -h / 2 + 44 + j * 40); }); });
    g.restore();
    chip(g, 'IAN BUCK, GRAD STUDENT', 1020, 220, { px: 44, bg: YEL, s: pop(t, at('c1', 'ian') - .1) * (1 - seg(t, t2 - .2, t2)), rot: .02, wide: true });
    chip(g, 'MATH THAT ISN’T GAMES', 1460, 170, { px: 44, bg: NVL, s: pop(t, tMa - .1), rot: -.02, wide: true });
    stamp(g, 'HIRED · 2004', 1020, 260, t, tH + .1, { px: 54, col: NVD });
    vignette(g, .4);
  }
  /* 34 · CUDA: the stadium on any problem; built into every gaming chip; the idea */
  function sCuda(g, t, s) {
    var tC = at('c3', 'cuda.'), tWe = at('c3', 'weather,'), tMe = at('c3', 'medicine,'), tPh = at('c3', 'physics.'), t4 = start('c4'), tGa = at('c4', 'gamers'), t4b = start('c4b'), tFi = at('c4b', 'find');
    g.save(); cam(g, t, s, .05);
    wall(g, '#0f2a14', '#081a0c'); grid(g, 100, 'rgba(182,240,90,.05)');
    dateTag(g, '2006', t, at('c3', '2006,') - .1);
    if (t < t4 + .2) {
      var a = 1 - seg(t, t4, t4 + .2); g.save(); g.globalAlpha = a;
      bigNum(g, 'CUDA', 960, 220, 170, NVL, pop(t, tC - .2));
      stadium(g, 330, 470, 26, 5, 48, t, function () { return t > tC ? 1 : 0; }, { pix: function (i) { return ['#5dc8ff', '#ff6a8a', '#ffd23d'][Math.floor(i / 44) % 3]; } });
      [['WEATHER', tWe, 460, '#5dc8ff'], ['MEDICINE', tMe, 960, '#ff6a8a'], ['PHYSICS', tPh, 1460, '#ffd23d']].forEach(function (p, i) {
        var k = pop(t, p[1] - .2, 3, .6); if (k <= 0) return;
        card(g, p[2], 840, 360, 180, (i - 1) * .04, clamp(k, 0, 1), function (g) {
          if (i === 0) { puff(g, -90, 20, .5, '#9fd8ff'); txt(g, '☂', 60, 0, 70, INK, { wt: 900 }); }
          else if (i === 1) { g.strokeStyle = RED; g.lineWidth = 6; g.beginPath(); for (var x = -140; x < 0; x += 4) g.lineTo(x, Math.sin(x * .2 + t * 5) * 30); g.stroke(); g.strokeStyle = BLUE; g.beginPath(); for (x = -140; x < 0; x += 4) g.lineTo(x, -Math.sin(x * .2 + t * 5) * 30); g.stroke(); }
          else { circ(g, -80, 0, 16); g.fillStyle = RED; g.fill(); g.strokeStyle = INK; g.lineWidth = 4; for (var o = 0; o < 3; o++) { g.save(); g.translate(-80, 0); g.rotate(o + t); g.beginPath(); g.ellipse(0, 0, 60, 22, 0, 0, 6.283); g.stroke(); g.restore(); } }
          txt(g, p[0], 70, 50, 38, INK, { wt: 900, wide: true });
        });
      });
      g.restore();
    }
    if (t > t4 - .2) {
      var b = clamp(seg(t, t4 - .2, t4 + .2), 0, 1); g.save(); g.globalAlpha = b;
      /* gamers carrying CUDA like a backpack they never open */
      for (var i = 0; i < 5; i++) {
        var x = 220 + i * 370, P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [70, -200], look: [.5, .2], mouth: 'smile', eyes: 'happy' }]]);
        P.lf = [-26 + Math.sin(t * 9 + i) * 12, 0]; P.rf = [26 - Math.sin(t * 9 + i) * 12, 0];
        guy(g, x, 940, .9, P, { col: ['#ff5b3d', '#3d7bff', '#ffc83d', '#b06bff', '#2a9d8f'][i], shade: 'rgba(0,0,0,.25)', seed: 70 + i, hair: 'cap', hairCol: '#3a2a20', hold: [null, phoneH] }, t);
        g.save(); g.translate(x - 70, 940 - 230 * .9); rr(g, -40, -50, 60, 100, 12); fillStroke(g, NV, 4); txt(g, 'CUDA', -10, 0, 18, INK, { fam: MONO, wt: 700 }); g.restore();
      }
      chip(g, 'IN EVERY GAMING CHIP', 960, 160, { px: 50, bg: NVL, s: pop(t, at('c4', 'ordinary') - .2) * (1 - seg(t, t4b - .3, t4b)), rot: -.02, wide: true });
      chip(g, 'A FEATURE THEY WILL NEVER USE', 960, 280, { px: 42, bg: CREAM, s: pop(t, tGa) * (1 - seg(t, t4b - .3, t4b)), rot: .02, wide: true });
      if (t > t4b - .2) {
        quote(g, t, 'c4b', 300, { px: 58, maxw: 1500, hot: /millions|find/i });
        /* scientists arrive from the right */
        for (i = 0; i < 3; i++) { var sk = seg(t, tFi - .6 + i * .15, tFi + .6 + i * .15), x2 = lerp(2100, 1450 + i * 140, eio(sk)); if (sk > 0) { var Q = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [60, -190], look: [-.6, 0], mouth: 'o', eyes: 'wide' }]]); guy(g, x2, 940, .9, Q, { col: CREAM, shade: '#d8cfbd', coat: CREAM, glasses: true, seed: 80 + i, hair: 'grey' }, t); } }
      }
      g.restore();
    }
    g.restore();
    vignette(g, .4);
  }
  /* 35 · Wall Street sees the bill; 2008: a charge, −31% in a day, −75% for the year */
  function sWallSt(g, t, s) {
    var tBi = at('c5', 'bill,'), tPo = at('c5', 'point.'), t6 = start('c6'), tFa = at('c6', 'faulty'), t31 = at('c6', '31'), t7 = start('c7'), tTh = at('c7', 'three');
    g.save(); cam(g, t, s, .06);
    wall(g, '#1a1f33', '#0f1322'); floorAt(g, 880, '#22263a');
    var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [140, -230], look: [.6, -.2], mouth: 'frown', brow: -1, eyes: 'squint' }], [tPo, { lh: [-130, -200], rh: [140, -230], mouth: 'frown' }], [t6, { lh: [-120, -290], rh: [120, -290], mouth: 'O', eyes: 'wide', brow: 1, sweat: 1 }]]);
    guy(g, 360, 940, 1.15, P, Object.assign({}, SUIT, { hold: [null, t < t6 ? function (g) { var n = Math.floor(clamp(seg(t, tBi - .3, tBi + .6), 0, 1) * 8); rr(g, -50, -20 - n * 26, 100, 30 + n * 26, 4); fillStroke(g, '#fbf8f0', 3); for (var j = 0; j < n; j++) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-36, -6 - j * 26, 60, 6); } } : null] }), t);
    chip(g, 'WALL STREET', 400, 240, { px: 46, bg: CREAM, s: pop(t, s.t0 + .2), rot: -.03, wide: true });
    chip(g, 'SEES THE BILL', 400, 340, { px: 42, bg: RED, fg: '#fff', s: pop(t, tBi - .1) * (1 - seg(t, t6 - .3, t6)), rot: .03, wide: true });
    /* the stock chart for 2007–2008 */
    var pts = [[0, .8], [.1, .9], [.2, .85], [.3, .88], [.38, .82], [.4, .56], [.5, .5], [.6, .42], [.7, .35], [.8, .26], [.9, .22], [1, .2]];
    var ck = t < t6 ? seg(t, s.t0, t6) * .36 : t < t31 ? lerp(.36, .36, 1) : t < t7 ? lerp(.36, .4, seg(t, t31 - .1, t31 + .3)) : lerp(.4, 1, seg(t, t7, tTh + .5));
    var head = chart(g, 820, 220, 920, 520, pts, ck, { col: t > t31 - .1 ? RED : NVL });
    if (t > t31 - .1) { stamp(g, '−31% IN ONE DAY', 1280, 400, t, t31, { px: 54 }); }
    if (t > tTh - .1) { bigNum(g, '−75%', 1500, 680, 120, RED, pop(t, tTh - .1)); chip(g, 'THAT YEAR', 1500, 790, { px: 40, bg: CREAM, s: pop(t, tTh), rot: .02 }); }
    if (t > tFa - .3) { g.save(); g.translate(1060, 880); g.scale(clamp(pop(t, tFa - .3), 0, 1.05), clamp(pop(t, tFa - .3), 0, 1.05)); rr(g, -150, -20, 300, 30, 6); fillStroke(g, '#9a96a6', 5); g.beginPath(); g.moveTo(-130, -20); g.lineTo(-110, -180); g.lineTo(110, -180); g.lineTo(130, -20); g.closePath(); fillStroke(g, '#3a3647', 5); for (var i = 0; i < 4; i++) { var ph = (t * 1.5 + i * .25) % 1; puff(g, -60 + i * 40, -200 - ph * 90, .25, 'rgba(120,120,130,' + (1 - ph) + ')'); } txt(g, 'FAULTY LAPTOP CHIPS', 0, 60, 30, CREAM, { fam: MONO, wt: 700, outline: 6 }); g.restore(); }
    dateTag(g, '2008', t, at('c6', '2008,') - .1);
    g.restore();
    vignette(g, .45);
  }
  /* 36 · remember thirty days from dead? it keeps paying anyway; the quote */
  function sKeep(g, t, s) {
    var tR = at('c8', 'remember'), tK = at('c8', 'keeps'), t9 = start('c9');
    g.save(); cam(g, t, s, .06);
    wall(g, '#22301a', '#141e0e'); floorAt(g, 880, '#2a2430');
    sticky(g, ['REMEMBER', '30 DAYS?'], 1560, 300, pop(t, tR - .1) * (1 - seg(t, t9 - .3, t9)), .06);
    /* a machine labelled CUDA, fed with coins */
    rr(g, 820, 360, 420, 520, 20); fillStroke(g, '#2c2936', 8); rr(g, 860, 400, 340, 140, 10); fillStroke(g, '#0f1a08', 5); txt(g, 'CUDA', 1030, 470, 80, NVL, { wt: 900, wide: true });
    rr(g, 990, 590, 80, 16, 6); g.fillStyle = INK; g.fill();
    var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [120, -230], look: [.6, -.1], mouth: 'flat' }], [tK, { rh: [170, -260], mouth: 'smile' }]]);
    var feed = t > tK - .3 ? Math.sin(t * 6) * 20 : 0; P.rh = [P.rh[0] + feed, P.rh[1]];
    guy(g, 560, 940, 1.2, P, Object.assign({}, JEN, { hold: [null, function (g) { coin(g, 0, -10, 18, YEL); }] }), t);
    for (var i = 0; i < 5; i++) { var ph = (t * 1.2 + i * .2) % 1; if (t < tK - .3) break; coin(g, lerp(820, 1030, ph), 600 - Math.sin(ph * Math.PI) * 120, 18, YEL, Math.cos(ph * 9)); }
    if (t > t9 - .2) quote(g, t, 'c9', 180, { px: 64, maxw: 1600, hot: /market|yet/i });
    g.restore();
    chip(g, 'KEEPS PAYING ANYWAY', 1030, 900, { px: 44, bg: YEL, s: pop(t, tK - .1) * (1 - seg(t, t9 - .3, t9)), rot: -.02, wide: true });
    vignette(g, .4);
  }
