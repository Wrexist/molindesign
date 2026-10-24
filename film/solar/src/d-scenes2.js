
  /* a flat Starlink-style satellite: one long panel */
  function flatSat(g, x, y, s, rot, burn, face) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    if (burn > 0) { glow(g, -40, 0, 90, 'rgba(255,140,40,.9)', burn); g.save(); g.globalAlpha = burn; g.beginPath(); g.moveTo(-30, -14); g.quadraticCurveTo(-140, 0, -30, 14); fillStroke(g, '#ffb03d', 0); g.restore(); }
    rr(g, -20, -16, 40, 32, 5); fillStroke(g, '#c9ccd6', 4);
    rr(g, 20, -10, 120, 20, 3); fillStroke(g, '#3d64b8', 4);
    if (face) { g.fillStyle = INK; g.lineWidth = 3; g.strokeStyle = INK; if (face === 'x') { [-8, 8].forEach(function (ex) { g.beginPath(); g.moveTo(ex - 4, -6); g.lineTo(ex + 4, 2); g.moveTo(ex + 4, -6); g.lineTo(ex - 4, 2); g.stroke(); }); } else { circ(g, -7, -3, 3); g.fill(); circ(g, 7, -3, 3); g.fill(); } }
    g.restore();
  }
  /* 12 · first to go: 38 Starlink satellites, from a minor storm */
  function sStarlink(g, t, s) {
    var tk = at('sat2', 'knocked'), tm = at('sat2', 'minor'), t3 = start('sat3');
    g.save(); cam(g, t, s, .07, 960, 600);
    space(g, t, t * 30, 0);
    /* the curve of the Earth and its air, which swells in the storm */
    var swell = eio(seg(t, tm - .2, tk + .6));
    glow(g, 960, 2500, 1700 + swell * 120, 'rgba(90,170,255,.55)', 1);
    circ(g, 960, 2500, 1600); var gr = g.createLinearGradient(0, 900, 0, 1200); gr.addColorStop(0, '#3b8fd9'); gr.addColorStop(1, '#174a86'); g.fillStyle = gr; g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    g.save(); circ(g, 960, 2500, 1600); g.clip(); g.fillStyle = '#58b36a'; g.beginPath(); g.ellipse(700, 960, 380, 70, -.05, 0, 6.283); g.fill(); g.lineWidth = 6; g.stroke(); g.restore();
    circ(g, 960, 2500, 1650 + swell * 110); g.strokeStyle = 'rgba(143,233,255,' + (.25 + swell * .35) + ')'; g.lineWidth = 30 + swell * 40; g.stroke();
    /* the train of satellites; after "knocked", they sag, tilt and burn */
    for (var i = 0; i < 9; i++) {
      var d = (i * 230 + t * 50) % 1900 - 80, f = clamp((t - tk - hash(i) * .6) / 2.2, 0, 1), fall = f * f;
      var x = d + fall * 160, y = 420 + Math.sin(i * 1.3) * 16 + fall * 520 - Math.pow(Math.abs(d - 960) / 960, 2) * -60;
      flatSat(g, x, y, 1.6, fall * (1.2 + hash(i) * 2) + Math.sin(t * 3 + i) * .03, fall, i === 6 ? (f > .2 ? 'x' : 'dot') : null);
    }
    g.restore();
    /* a storm gauge, needle on MINOR */
    var gk = pop(t, tm - .2);
    if (gk > 0) {
      g.save(); g.translate(330, 260); g.scale(gk, gk);
      g.beginPath(); g.arc(0, 60, 170, Math.PI, 0); g.closePath(); fillStroke(g, CREAM, 7);
      [[MINT, 0], [YEL, 1], ['#ff9a3d', 2], [RED, 3], ['#b03030', 4]].forEach(function (c) { g.beginPath(); g.arc(0, 60, 150, Math.PI + c[1] * Math.PI / 5, Math.PI + (c[1] + 1) * Math.PI / 5); g.arc(0, 60, 100, Math.PI + (c[1] + 1) * Math.PI / 5, Math.PI + c[1] * Math.PI / 5, true); g.closePath(); fillStroke(g, c[0], 4); });
      var na = Math.PI + Math.PI * .12 + Math.sin(t * 7) * .03; g.beginPath(); g.moveTo(0, 60); g.lineTo(Math.cos(na) * 140, 60 + Math.sin(na) * 140); g.lineWidth = 10; g.lineCap = 'round'; g.strokeStyle = INK; g.stroke(); circ(g, 0, 60, 14); g.fillStyle = INK; g.fill();
      txt(g, 'MINOR', 0, 110, 44, CREAM, { wt: 900, wide: true, outline: 9 });
      g.restore();
    }
    chip(g, '2022', 960, 120, { px: 50, bg: CREAM, s: pop(t, at('sat2', '2022') - .1) * (1 - seg(t, t3, t3 + .3)), rot: -.03, wide: true });
    if (t > at('sat2', 'thirtyeight') - .1) counter(g, 1460, 230, seg(t, at('sat2', 'thirtyeight') - .1, at('sat2', 'starlink') + .3), 38, 150, RED, { post: '' });
    chip(g, 'STARLINK SATELLITES', 1460, 360, { px: 38, bg: CREAM, s: pop(t, at('sat2', 'starlink') - .1), wide: true });
    if (t > t3) quote(g, t, 'sat3', 760, { px: 96 });
    vignette(g, .4);
  }
  function tractor(g, x, y, s, t, run) {
    g.save(); g.translate(x, y); g.scale(s, s);
    var b = run ? Math.sin(t * 18) * 2 : 0; g.translate(0, b);
    rr(g, -150, -150, 240, 90, 14); fillStroke(g, '#3a9a4a', 6);
    rr(g, -110, -280, 140, 140, 10); fillStroke(g, '#3a9a4a', 6); rr(g, -90, -260, 100, 90, 6); fillStroke(g, '#bfe6ff', 4);
    g.fillStyle = INK; g.fillRect(60, -230, 14, 90);
    if (run) for (var i = 0; i < 3; i++) { var k = (t * 1.5 + i / 3) % 1; circ(g, 67 + k * 30, -240 - k * 120, 10 + k * 22); g.fillStyle = 'rgba(80,80,90,' + (.5 * (1 - k)) + ')'; g.fill(); }
    [[-90, -40, 72], [70, -30, 42]].forEach(function (w) { g.save(); g.translate(w[0], w[1]); g.rotate(run ? t * 6 : 0); circ(g, 0, 0, w[2]); fillStroke(g, '#2a2638', 6); circ(g, 0, 0, w[2] * .45); fillStroke(g, YEL, 5); g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(-w[2] * .45, 0); g.lineTo(w[2] * .45, 0); g.stroke(); g.restore(); });
    /* the GPS puck on the roof */
    rr(g, -60, -306, 40, 26, 6); fillStroke(g, '#2a2638', 4);
    g.restore();
  }
  /* 13 · GPS-guided tractors off by ten feet; some farmers just stopped */
  function sTractor(g, t, s) {
    var tt = at('sat4', 'threw'), t5 = start('sat5'), stop = t > at('sat5', 'stopped') - .2;
    g.save(); cam(g, t, s, .06, 960, 600);
    sky(g, t, '#7cc4ff', '#ffe2b0', { clouds: 'rgba(255,255,255,.85)' });
    ground(g, 560, '#6aaa4a', '#4a8a3a', { amp: 4 });
    /* planted rows: straight before, wiggly after */
    var tx = stop ? 1180 : lerp(200, 1180, seg(t, s.t0, t5));
    for (var r = 0; r < 6; r++) {
      var ry = 640 + r * 70; g.beginPath(); g.moveTo(-100, ry);
      for (var x = -100; x < (r === 3 ? tx - 150 : W + 100); x += 20) { var wob = r === 3 && x > 760 ? Math.sin(x * .02) * 26 + (x - 760) * .06 : 0; g.lineTo(x, ry + wob); }
      g.strokeStyle = '#3a5a2a'; g.lineWidth = 10; g.stroke();
      for (x = -80; x < (r === 3 ? tx - 150 : W + 100); x += 60) { var wb = r === 3 && x > 760 ? Math.sin(x * .02) * 26 + (x - 760) * .06 : 0; g.beginPath(); g.moveTo(x, ry + wb); g.lineTo(x - 8, ry + wb - 22); g.moveTo(x, ry + wb); g.lineTo(x + 8, ry + wb - 22); g.strokeStyle = '#7ad04a'; g.lineWidth = 5; g.stroke(); }
    }
    var off = t > tt ? Math.sin((tx - 760) * .02) * 26 + Math.max(0, tx - 760) * .06 : 0;
    /* the satellite beam */
    satellite(g, 1500, 130, .5, .2);
    var bk = t > tt ? .3 + .3 * Math.sin(t * 30) : .5;
    g.save(); g.globalAlpha = bk; g.beginPath(); g.moveTo(1500, 160); g.lineTo(tx - 80, 640 + 3 * 70 + off - 300); g.lineTo(tx + 20, 640 + 3 * 70 + off - 300); g.closePath(); g.fillStyle = LIGHT; g.fill(); g.restore();
    tractor(g, tx, 640 + 3 * 70 + 20 + off, .9, t, !stop);
    /* ten feet */
    if (t > at('sat4', 'ten') - .2) { var ay = 640 + 3 * 70, ax = Math.min(tx - 200, 1080); arrow(g, ax, ay - 140, ax, ay - 140 + 70, eo(seg(t, at('sat4', 'ten') - .2, at('sat4', 'ten') + .3)), YEL, 7, 24); chip(g, '≈10 FEET OFF', ax - 190, ay - 110, { px: 40, bg: YEL, s: pop(t, at('sat4', 'ten')), wide: true }); }
    /* the farmer quits */
    if (t > t5 - .3) {
      var P = poseAt(t, [[t5 - .3, { lh: [-80, -250], rh: [80, -250], mouth: 'frown', brow: -1, look: [-.6, 0] }], [at('sat5', 'stopped'), { lh: [30, -230], rh: [-30, -232], front: 1, mouth: 'flat', eyes: 'squint', brow: -1, look: [0, 0] }]]);
      guy(g, 1520, 960, 1.15, P, FARM, t);
      chip(g, 'NOPE.', 1520, 400, { px: 60, bg: CREAM, s: pop(t, at('sat5', 'stopped') + .2), rot: .05, wide: true });
    }
    g.restore();
    chip(g, 'MAY 2024 · NORTH DAKOTA', 1080, 150, { px: 44, bg: CREAM, s: pop(t, at('sat4', 'may') - .1) * (1 - seg(t, t5, t5 + .3)), rot: -.03, wide: true });
    chip(g, 'GPS', 300, 260, { px: 60, bg: LIGHT, s: pop(t, at('sat4', 'gps') - .1) * (1 - seg(t, t5, t5 + .3)), rot: .05, wide: true });
    vignette(g, .4);
  }
  function car(g, x, y, s, rot, col) { g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s); g.beginPath(); g.moveTo(-170, 0); g.lineTo(-160, -70); g.lineTo(-90, -80); g.lineTo(-50, -140); g.lineTo(80, -140); g.lineTo(130, -80); g.lineTo(175, -64); g.lineTo(180, 0); g.closePath(); fillStroke(g, col || '#3d7bff', 7); rr(g, -36, -128, 60, 46, 6); fillStroke(g, '#bfe6ff', 5); rr(g, 34, -128, 50, 46, 6); fillStroke(g, '#bfe6ff', 5); [-100, 110].forEach(function (wx) { circ(g, wx, 0, 38); fillStroke(g, '#2a2638', 6); circ(g, wx, 0, 14); fillStroke(g, '#9a9aa6', 4); }); g.restore(); }
  /* 14 · your maps app: turn left into a lake. Planes, radio, your phone (for now) */
  function sLake(g, t, s) {
    var tl = at('sat6', 'left'), tk = at('sat6', 'lake'), t7 = start('sat7');
    g.save(); cam(g, t, s, .06, 1100, 560);
    sky(g, t, '#86c8ff', '#ffe2b0', { clouds: 'rgba(255,255,255,.8)' });
    ground(g, 700, '#7ab85a', '#5a9a4a', { amp: 3 });
    g.beginPath(); g.ellipse(1250, 840, 520, 120, 0, 0, 6.283); var lk = g.createLinearGradient(0, 720, 0, 960); lk.addColorStop(0, '#4aa8e8'); lk.addColorStop(1, '#2a78c0'); fillStroke(g, null, 0); g.fillStyle = lk; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
    g.fillStyle = '#5a5a6a'; g.fillRect(-200, 690, 900, 60);
    var dk = seg(t, tk - .3, tk + .6), cx = t < tk - .3 ? lerp(-200, 560, seg(t, s.t0, tk - .3)) : lerp(560, 1120, eio(dk)), cy = t < tk - .3 ? 720 : lerp(720, 860, eio(dk)) - Math.sin(dk * Math.PI) * 120, cr = lerp(0, .5, eio(dk));
    if (t < t7) car(g, cx, cy, .8, cr);
    if (t > tk + .2) {
      /* splash, then you on the roof of the sunk car */
      var sp2 = seg(t, tk + .2, tk + 1.2); if (sp2 < 1) for (var i = 0; i < 12; i++) { var a = Math.PI * (1.1 + i / 12 * .8), d = eo(sp2) * 220; circ(g, 1120 + Math.cos(a) * d, 820 + Math.sin(a) * d * 1.4 + sp2 * sp2 * 200, 16 * (1 - sp2)); g.fillStyle = '#bfe6ff'; g.fill(); }
      if (t > t7 - .1) {
        g.save(); g.beginPath(); g.rect(800, 600, 700, 220); g.clip(); car(g, 1120, 900, .8, .1); g.restore();
        var P = poseAt(t, [[t7 - .1, { lh: [-90, -170], rh: [70, -320], look: [.5, -.6], mouth: 'flat', eyes: 'dot' }], [at('sat7', 'phone'), { mouth: 'grin', eyes: 'happy' }], [at('sat7', 'now') - .1, { mouth: 'wavy', eyes: 'side', brow: -1 }]]);
        guy(g, 1110, 800, .95, P, Object.assign({}, YOU, { hold: [null, function (g) { phone(g, 0, -20, .8, .1, at('sat7', 'now') < t && (t * 3 % 1) < .4 ? '#555' : '#9ee6ff'); }] }), t);
      }
    }
    /* planes reroute */
    if (t > at('sat7', 'planes') - .2) { var pk = seg(t, at('sat7', 'planes') - .2, at('sat7', 'planes') + 1.4); g.save(); g.setLineDash([16, 14]); g.strokeStyle = CREAM; g.lineWidth = 5; g.beginPath(); g.moveTo(100, 260); g.quadraticCurveTo(700, 40, 1300, 260); g.stroke(); g.restore(); var px = lerp(100, 1300, pk), py = (1 - pk) * (1 - pk) * 260 + 2 * (1 - pk) * pk * 40 + pk * pk * 260; icon(g, 'plane', px, py, .7, 1); }
    /* radio static */
    if (t > at('sat7', 'radio') - .2) { g.save(); g.translate(1600, 520); g.scale(pop(t, at('sat7', 'radio') - .2), pop(t, at('sat7', 'radio') - .2)); rr(g, -110, -70, 220, 140, 14); fillStroke(g, '#8a5a32', 6); rr(g, -90, -50, 110, 100, 8); fillStroke(g, '#2a2638', 4); for (var n = 0; n < 60; n++) { g.fillStyle = hash(n + Math.floor(t * 20)) > .5 ? '#ddd' : '#555'; g.fillRect(-88 + (n % 10) * 10.6, -48 + Math.floor(n / 10) * 16, 10, 15); } circ(g, 60, -10, 22); fillStroke(g, CREAM, 4); g.restore(); txt(g, 'KSSHHH', 1600, 400, 40, CREAM, { wt: 900, wide: true, outline: 8 }); }
    g.restore();
    /* the maps app */
    var mk = pop(t, s.t0 + .2, 2.4, .7) * (1 - seg(t, t7 - .3, t7));
    if (mk > 0) {
      g.save(); g.translate(330, 470); g.scale(mk, mk); g.rotate(-.04);
      rr(g, -170, -320, 340, 640, 40); fillStroke(g, '#2a2638', 8); rr(g, -150, -296, 300, 592, 26); g.fillStyle = '#e8f0e0'; g.fill();
      g.save(); rr(g, -150, -296, 300, 592, 26); g.clip(); g.beginPath(); g.ellipse(-120, -60, 120, 90, 0, 0, 6.283); g.fillStyle = '#7ec4ff'; g.fill(); g.fillStyle = '#cfd6c4'; g.fillRect(-20, -296, 40, 600);
      g.beginPath(); g.moveTo(0, 280); g.lineTo(0, -40); g.lineTo(-120, -60); g.strokeStyle = '#3d7bff'; g.lineWidth = 16; g.lineCap = 'round'; g.stroke(); g.restore();
      rr(g, -140, -286, 280, 110, 18); fillStroke(g, '#1f8a4a', 0); txt(g, '← TURN LEFT', 0, -248, 36, '#fff', { wt: 900, wide: true }); txt(g, 'INTO LAKE', 0, -206, 26, 'rgba(255,255,255,.85)', { fam: MONO, wt: 700 });
      circ(g, 0, 140, 16); fillStroke(g, '#3d7bff', 5);
      g.restore();
      chip(g, '100% CONFIDENT', 330, 900, { px: 34, bg: YEL, s: pop(t, at('sat6', 'confidence') - .1) * mk, rot: .03, wide: true });
    }
    chip(g, 'FOR NOW.', 1110, 160, { px: 64, bg: RED, fg: '#fff', s: pop(t, at('sat7', 'now') - .1), rot: -.04, wide: true });
    vignette(g, .4);
  }
  /* 15 · the real danger: current shoved into long power lines, a flood into tiny pipes */
  function sLines(g, t, s) {
    var t2 = start('grid2'), tsh = at('grid2', 'shakes'), tsv = at('grid2', 'shoves'), tf = at('grid2', 'flood');
    var tilt = eio(seg(t, s.t0, at('grid1', 'down') + .3));
    g.save(); g.translate(0, lerp(-500, 0, tilt)); cam(g, t, s, .05, 960, 600);
    sky(g, t, '#141236', '#5a3a7a', { stars: 1 });
    aurora(g, t, .8, -200);
    glow(g, 960, 700, 900, 'rgba(255,170,120,.25)', 1);
    /* the shaking magnetic field */
    var amp = t < tsh ? .2 : 1 + 2 * seg(t, tsh, tsh + .5);
    for (var i = 0; i < 5; i++) { g.beginPath(); for (var x = -100; x <= W + 100; x += 20) { var y = -360 + i * 70 + Math.sin(x * .006 + t * 2 + i) * 18 * amp + Math.sin(x * .02 - t * 9) * 6 * (amp - .2); if (x === -100) g.moveTo(x, y); else g.lineTo(x, y); } g.strokeStyle = 'rgba(143,233,255,' + (.5 - i * .06) + ')'; g.lineWidth = 4; g.setLineDash([20, 14]); g.lineDashOffset = -t * 40; g.stroke(); g.setLineDash([]); }
    ground(g, 900, '#2f4a5a', '#1f3040', { amp: 10 });
    var xs = [-60, 480, 1020, 1560, 2100];
    xs.forEach(function (x) { pylon(g, x, 900, 1.3); });
    var lit = t > tsv - .1 ? .6 + .4 * Math.sin(t * 20) : .15;
    wires(g, xs, 900, 1.3, t, lit, t > tsv ? '#ffe36b' : LIGHT);
    if (t > tsv) for (i = 0; i < 2; i++) bolt(g, 1020 - 104, 900 - 260 * 1.3 + 50, 1020 - 160, 680, t, (t * 5 + i) % 2 < 1 ? .9 : 0, YEL, i);
    g.restore();
    chip(g, 'THE REAL DANGER', 960, 150, { px: 54, bg: RED, fg: '#fff', s: pop(t, at('grid1', 'danger') - .1) * (1 - seg(t, t2, t2 + .3)), rot: -.03, wide: true });
    chip(g, 'MAGNETIC FIELD', 960, 120, { px: 42, bg: LIGHT, s: pop(t, at('grid2', 'magnetic') - .1) * (1 - seg(t, tsv, tsv + .3)), rot: .02, wide: true });
    chip(g, 'EXTRA CURRENT', 960, 150, { px: 50, bg: YEL, s: pop(t, at('grid2', 'current') - .1) * (1 - seg(t, tf - .3, tf)), rot: -.02, wide: true });
    /* the pipe analogy */
    var pk = pop(t, tf - .25, 2.6, .7);
    if (pk > 0) {
      card(g, 1380, 320, 820, 420, -.02, clamp(pk, 0, 1), function (g) {
        g.save(); g.scale(pk, pk);
        var wk = seg(t, tf, tf + 1.4), bulge = 1 + Math.sin(t * 22) * .08 * wk;
        g.beginPath(); g.moveTo(-390, -160); for (var x = -390; x < -100; x += 10) g.lineTo(x, -160 + Math.sin(x * .05 + t * 8) * 16); g.lineTo(-100, 160); g.lineTo(-390, 160); g.closePath(); fillStroke(g, '#4ab0ff', 5);
        rr(g, -110, -26 * bulge, 480, 52 * bulge, 10); fillStroke(g, '#9a9aa6', 6);
        if (wk > .4) for (var i = 0; i < 5; i++) { var jx = -40 + i * 90, jk = (t * 2 + i * .3) % 1; g.beginPath(); g.moveTo(jx, -26); g.quadraticCurveTo(jx + 10, -80 - jk * 60, jx + 30, -60 - jk * 100); g.strokeStyle = '#4ab0ff'; g.lineWidth = 8; g.lineCap = 'round'; g.stroke(); }
        txt(g, 'WAY TOO SMALL', 130, 120, 40, INK, { wt: 900, wide: true });
        g.restore();
      });
    }
    vignette(g, .45);
  }
  function skyline(g, t, y, darkFn, seed) {
    var r = mulberry(seed || 5);
    for (var i = 0; i < 16; i++) {
      var bx = -60 + i * 130, bh = 220 + r() * 380, bw = 100 + r() * 50;
      g.fillStyle = i % 2 ? '#241d40' : '#2d2550'; g.fillRect(bx, y - bh, bw, bh); g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(bx, y - bh, bw, bh);
      var off = darkFn ? darkFn(bx) : 0;
      for (var wy = y - bh + 20; wy < y - 20; wy += 34) for (var wx = bx + 12; wx < bx + bw - 16; wx += 22) { var on = r() < .55; if (on && off < 1) { g.fillStyle = 'rgba(255,214,122,' + (1 - off) + ')'; g.fillRect(wx, wy, 10, 14); } }
    }
  }
  /* 16 · Quebec 1989: the grid collapsed in ~90 s; 6 million people, 9 hours */
  function sQuebec(g, t, s) {
    var tc = at('grid4', 'collapsed'), t5 = start('grid5');
    g.save(); cam(g, t, s, .07, 960, 560);
    sky(g, t, '#0d0b26', '#2a2250', { stars: .7 });
    aurora(g, t, .55, 260);
    var dk = seg(t, tc - .1, wend('grid4', 'seconds'));
    skyline(g, t, 860, function (bx) { return clamp((dk * 2200 - bx) / 200, 0, 1); }, 9);
    ground(g, 860, '#e8eef6', '#c9d4e2', { amp: 0 });
    /* snow */
    g.fillStyle = 'rgba(255,255,255,.8)'; for (var i = 0; i < 90; i++) { var sx = (hash(i) * W + Math.sin(t + i) * 30) % W, sy = (hash(i + 40) * H + t * 60) % H; circ(g, sx, sy, 2 + hash(i + 7) * 3); g.fill(); }
    if (t > t5 - .2) {
      g.fillStyle = 'rgba(8,6,20,.45)'; g.fillRect(-200, -200, W + 400, H + 400);
      [[700, 1.1, 3], [1220, 1.0, 21]].forEach(function (c, j) {
        var P = poseAt(t, [[t5 - .2, { rh: [70, -250], lh: [-60, -160], look: [j ? -.5 : .5, 0], mouth: 'frown', brow: -1 }]]);
        guy(g, c[0], 960, c[1], P, Object.assign({}, j ? OPER : YOU, { hat: 'beanie', seed: c[2], hold: [null, function (g) { rr(g, -8, -50, 16, 44, 3); fillStroke(g, CREAM, 3); g.beginPath(); g.moveTo(0, -50); g.quadraticCurveTo(10, -66, 0, -82); g.quadraticCurveTo(-10, -66, 0, -50); fillStroke(g, YEL, 3); glow(g, 0, -70, 120, 'rgba(255,190,90,.6)', 1); }] }), t);
      });
    }
    g.restore();
    chip(g, 'MARCH 1989 · QUEBEC', 960, 140, { px: 48, bg: CREAM, s: pop(t, at('grid3', 'march') - .1) * (1 - seg(t, tc - .4, tc - .1)), rot: -.03, wide: true });
    chip(g, 'A MUCH WEAKER STORM', 960, 240, { px: 36, bg: YEL, s: pop(t, at('grid3', 'weaker') - .1) * (1 - seg(t, tc - .4, tc - .1)), rot: .02, wide: true });
    if (t > tc - .2 && t < t5) { g.save(); g.translate(960, 330); g.scale(pop(t, tc - .2), pop(t, tc - .2)); stopwatch(g, 0, 0, 150, seg(t, tc, wend('grid4', 'seconds')) * 1.5 % 1, null, null); g.restore(); counter(g, 960, 560, seg(t, tc, wend('grid4', 'seconds')), 90, 110, YEL, { post: ' SECONDS' }); }
    if (t > t5) { counter(g, 960, 230, seg(t, at('grid5', 'six') - .1, at('grid5', 'people')), 6000000, 120, CREAM, { post: '' }); chip(g, 'PEOPLE', 960, 340, { px: 40, bg: CREAM, s: pop(t, at('grid5', 'people') - .1), wide: true }); chip(g, '9 HOURS IN THE DARK', 960, 450, { px: 48, bg: YEL, s: pop(t, at('grid5', 'nine') - .1), rot: -.02, wide: true }); }
    vignette(g, .5);
  }
  /* 17 · and tomorrow's storm is the big one */
  function sBig(g, t, s) {
    var tb = at('grid6', 'big');
    g.save(); cam(g, t, s, .06);
    space(g, t, t * 30, 0);
    plasma(g, 420, 600, 70, t, 1, false); chip(g, '1989', 420, 760, { px: 40, bg: CREAM, s: pop(t, s.t0 + .1), wide: true });
    var gk = eo(seg(t, tb - .4, tb + .3));
    plasma(g, 1300, 560, lerp(70, 420, gk), t, gk > 0 ? 1 : 0, true);
    if (gk > .5) chip(g, 'TOMORROW', 1300, 1000 - 80, { px: 40, bg: RED, fg: '#fff', s: pop(t, tb + .1), wide: true });
    g.restore();
    quote(g, t, 'grid6', 290, { px: 76 });
    vignette(g, .4);
  }
  function bed(g, x, y) { g.save(); g.translate(x, y); rr(g, -360, -80, 720, 120, 20); fillStroke(g, '#5a4a7e', 6); rr(g, -380, -220, 60, 300, 14); fillStroke(g, '#3e3155', 6); rr(g, -310, -130, 170, 70, 30); fillStroke(g, CREAM, 5); g.restore(); }
  function transformer(g, x, y, s, t, hum) {
    g.save(); g.translate(x, y); g.scale(s, s);
    rr(g, -200, -340, 400, 340, 16); fillStroke(g, '#7a8a9a', 7);
    for (var i = 0; i < 6; i++) { rr(g, -230 - (i % 2) * 0, -300 + i * 50, 30, 36, 4); } for (i = 0; i < 7; i++) { g.fillStyle = '#5a6a7a'; g.fillRect(-200 + i * 60, -320, 22, 300); }
    [-120, 0, 120].forEach(function (bx) { rr(g, bx - 20, -470, 40, 130, 8); fillStroke(g, '#c9a04a', 6); for (var k = 0; k < 4; k++) { g.beginPath(); g.ellipse(bx, -450 + k * 30, 32, 10, 0, 0, 6.283); fillStroke(g, '#e0d6c0', 4); } });
    if (hum) glow(g, 0, -170, 380, 'rgba(255,200,90,.35)', .5 + .5 * Math.sin(t * 9));
    g.restore();
  }
  /* 18 · what keeps engineers up at night: house-size transformers, built to order, years to arrive */
  function sTrans(g, t, s) {
    var tT = at('long1', 'transformers'), t2 = start('long2');
    if (t < tT - .2) {
      g.save(); cam(g, t, s, .06, 900, 560);
      wall(g, '#1e1a38', '#14112a');
      rr(g, 1300, 160, 360, 300, 10); g.fillStyle = '#0b0a24'; g.fill(); g.lineWidth = 10; g.strokeStyle = INK; g.stroke(); circ(g, 1560, 250, 40); g.fillStyle = '#fff3c8'; g.fill();
      bed(g, 900, 860); floorAt(g, 900, '#1a1530');
      var P = poseAt(t, [[s.t0, { lh: [-40, -180], rh: [40, -182], front: 1, eyes: 'wide', mouth: 'wavy', brow: -1, look: [.3, -.6] }]]);
      g.save(); g.translate(720, 830); g.rotate(-Math.PI / 2 * .0); guy(g, 0, 0, .9, P, Object.assign({}, ENG, { hat: null, noShadow: true }), t); g.restore();
      g.save(); rr(g, 600, 680, 880, 160, 30); fillStroke(g, '#8a7ab8', 6); g.restore();
      /* the clock: 3:07 AM */
      rr(g, 1150, 690, 180, 70, 10); fillStroke(g, '#2a2638', 5); txt(g, '3:07', 1240, 727, 44, RED, { fam: MONO, wt: 700 });
      g.restore();
      chip(g, 'ENGINEERS, AT NIGHT', 600, 160, { px: 44, bg: CREAM, s: pop(t, at('long1', 'engineers') - .1), rot: -.03, wide: true });
    } else {
      var ss2 = { t0: tT - .2, t1: s.t1 };
      g.save(); cam(g, t, ss2, .06, 960, 600);
      sky(g, t, '#86c8ff', '#ffe2b0', { clouds: 'rgba(255,255,255,.8)' });
      ground(g, 860, '#7ab85a', '#5a9a4a', { amp: 3 });
      g.save(); g.strokeStyle = '#9a9aa6'; g.lineWidth = 6; for (var x = 380; x < 1640; x += 40) { g.beginPath(); g.moveTo(x, 860); g.lineTo(x, 780); g.stroke(); } g.beginPath(); g.moveTo(380, 790); g.lineTo(1640, 790); g.stroke(); g.restore();
      transformer(g, 700, 860, 1.1, t, true);
      var hk = pop(t, at('long2', 'house') - .2, 2.4, .7);
      if (hk > 0) { g.save(); g.translate(1340, 860); g.scale(hk, hk); house(g, 0, 0, 2.6, 1); g.restore(); txt(g, '=', 1040, 600, 140, CREAM, { wt: 900, outline: 14 }); }
      var P2 = poseAt(t, [[ss2.t0, { lh: [-80, -250], rh: [100, -330], look: [-.6, -.6], mouth: 'o' }]]);
      guy(g, 1040, 900, .55, P2, ENG, t);
      g.restore();
      chip(g, 'GIANT TRANSFORMER', 700, 150, { px: 46, bg: YEL, s: pop(t, tT - .1) * (1 - seg(t, t2, t2 + .3)), rot: -.03, wide: true });
      chip(g, 'BUILT TO ORDER', 620, 160, { px: 52, bg: RED, fg: '#fff', s: pop(t, at('long2', 'order') - .1), rot: -.05, wide: true });
      /* the calendar flipping */
      var yk = seg(t, at('long2', 'years') - .2, s.t1);
      if (yk > 0) { g.save(); g.translate(1460, 230); g.scale(pop(t, at('long2', 'years') - .2), pop(t, at('long2', 'years') - .2)); rr(g, -130, -110, 260, 230, 14); fillStroke(g, CREAM, 6); g.fillStyle = RED; g.fillRect(-130, -110, 260, 60); var mo = ['JAN', 'MAR', 'MAY', 'JUL', 'SEP', 'NOV'][Math.floor(yk * 30) % 6], yr = 2027 + Math.floor(yk * 5); txt(g, mo, 0, -80, 34, '#fff', { wt: 900, wide: true }); txt(g, '' + yr, 0, 30, 76, INK, { wt: 900, wide: true }); g.restore(); txt(g, 'STILL WAITING…', 1460, 400, 34, CREAM, { fam: MONO, wt: 700, outline: 6 }); }
    }
    vignette(g, .45);
  }
  /* 19 · Lloyd's: 20 to 40 million Americans, up to a year or two, $2.6 trillion */
  function sLloyds(g, t, s) {
    var t4 = start('long4'), t5 = start('long5'), tm = at('long4', 'twenty');
    g.save(); cam(g, t, s, .05, 960, 560);
    space(g, t, t * 10, 0);
    var dark = function (c, i) { var hit = c[0] > -125 && c[0] < -66 && c[1] > 24 && c[1] < 50 && hash(i * 3.3) < .7; return hit ? 1 - seg(t, tm - .3 + hash(i) * .9, tm + .2 + hash(i) * .9) : 1; };
    earth(g, 960, 1160, 820, t, { lon: -97, lat: 50, light: -1, lightsOn: dark });
    /* extra US city lights, dense, so the blackout reads */
    g.restore();
    chip(g, "LLOYD'S, 2013", 960, 120, { px: 50, bg: CREAM, s: pop(t, at('long3', 'lloyds') - .1) * (1 - seg(t, t4, t4 + .3)), rot: -.03, wide: true });
    chip(g, 'A STORM LIKE 1859', 960, 220, { px: 40, bg: YEL, s: pop(t, at('long3', '1859') - .1) * (1 - seg(t, t4, t4 + .3)), rot: .02, wide: true });
    if (t > t4 && t < t5) { txt(g, '20–40 MILLION', 960, 170, 120, YEL, { wt: 900, wide: true, outline: 16 }); chip(g, 'AMERICANS IN THE DARK', 960, 290, { px: 40, bg: CREAM, s: pop(t, at('long4', 'americans') - .1), wide: true }); chip(g, 'UP TO 1–2 YEARS', 960, 400, { px: 52, bg: RED, fg: '#fff', s: pop(t, at('long4', 'year') - .1), rot: -.03, wide: true }); }
    /* the receipt */
    if (t > t5 - .2) {
      var rk = eio(seg(t, t5 - .2, at('long5', 'trillion') + .3)), rh = lerp(0, 900, rk);
      g.save(); g.translate(960, 1080 - rh + 40); g.rotate(-.03);
      g.fillStyle = 'rgba(8,6,18,.4)'; g.fillRect(-250 + 12, 0 + 14, 500, rh + 200);
      g.beginPath(); g.rect(-250, 0, 500, rh + 200); fillStroke(g, '#fbf7ef', 5);
      txt(g, 'THE BILL', 0, 60, 50, INK, { wt: 900, wide: true });
      ['TRANSFORMERS', 'SPOILED FOOD', 'LOST WORK', 'REPAIRS', 'MORE REPAIRS', 'SNACKS'].forEach(function (it, i) { txt(g, it, -210, 140 + i * 56, 30, INK, { fam: MONO, wt: 600, align: 'left' }); txt(g, '$$$', 210, 140 + i * 56, 30, INK, { fam: MONO, wt: 600, align: 'right' }); });
      g.strokeStyle = INK; g.setLineDash([10, 8]); g.lineWidth = 3; g.beginPath(); g.moveTo(-220, 490); g.lineTo(220, 490); g.stroke(); g.setLineDash([]);
      txt(g, 'TOTAL', -210, 560, 40, INK, { wt: 900, align: 'left' });
      g.restore();
      if (t > at('long5', '2.6') - .1) { var tk2 = pop(t, at('long5', '2.6') - .1); g.save(); g.translate(960, 1080 - rh + 40 + 650); g.scale(tk2, tk2); g.rotate(-.05); rr(g, -330, -70, 660, 140, 20); fillStroke(g, RED, 8); txt(g, '$2.6 TRILLION', 0, 6, 84, '#fff', { wt: 900, wide: true }); g.restore(); }
    }
    vignette(g, .4);
  }
  /* 20 · your fridge would be the first to know. Then your nose. */
  function sFridge(g, t, s) {
    var tf = at('long6', 'fridge'), tn = at('long7', 'nose');
    g.save(); cam(g, t, s, .08, 1000, 560);
    wall(g, '#2a2440', '#1a1630');
    g.fillStyle = '#3a3256'; g.fillRect(-200, 600, 2400, 300); g.fillStyle = '#4a4070'; g.fillRect(-200, 590, 2400, 24);
    floorAt(g, 900, '#16122a');
    /* the fridge, door swinging open, dark inside */
    var ok = eio(seg(t, tf - .3, tf + .3));
    g.save(); g.translate(1100, 900); rr(g, -180, -700, 360, 700, 20); fillStroke(g, '#dfe6ee', 7);
    rr(g, -160, -680, 320, 660, 10); g.fillStyle = '#2a2a3a'; g.fill();
    [-520, -330, -150].forEach(function (y) { g.fillStyle = '#4a4a5a'; g.fillRect(-160, y, 320, 8); });
    rr(g, -120, -460, 70, 120, 6); fillStroke(g, '#f4ede0', 4); txt(g, 'MILK', -85, -400, 20, INK, { wt: 900 });
    g.beginPath(); g.ellipse(60, -230, 70, 40, 0, 0, 6.283); fillStroke(g, '#9ac46a', 4);
    if (t > tn - .4) for (var i = 0; i < 4; i++) { g.save(); g.translate(-40 + i * 50, -500); g.beginPath(); for (var y = 0; y < 220; y += 10) g.lineTo(Math.sin(y * .05 + t * 4 + i) * 16, -y); g.strokeStyle = 'rgba(140,220,90,' + seg(t, tn - .4, tn + .3) * .9 + ')'; g.lineWidth = 9; g.lineCap = 'round'; g.stroke(); g.restore(); }
    g.save(); g.transform(1 - ok * .82, ok * .18, 0, 1, 180, 0); rr(g, -360, -700, 360, 700, 20); fillStroke(g, '#c9d2dc', 7); g.restore();
    g.restore();
    /* flies */
    if (t > tn) for (i = 0; i < 5; i++) { var a = t * (4 + i) + i * 2, fx = 1100 + Math.cos(a) * (120 + i * 30), fy = 360 + Math.sin(a * 1.3) * 80; circ(g, fx, fy, 6); g.fillStyle = INK; g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.ellipse(fx - 4, fy - 6, 5, 3, -.5, 0, 6.283); g.stroke(); }
    var P = poseAt(t, [[s.t0, { lh: [-60, -160], rh: [140, -260], look: [1, 0], mouth: 'smile' }], [tf + .2, { mouth: 'o', eyes: 'wide', brow: 1 }], [tn - .2, { rh: [40, -330], lh: [-60, -200], mouth: 'wavy', eyes: 'squint', brow: -1, lean: -.15, front: 1, look: [.4, 0] }, .2]]);
    guy(g, 720, 905, 1.25, P, YOU, t);
    g.restore();
    chip(g, 'FIRST TO KNOW', 1100, 120, { px: 50, bg: CREAM, s: pop(t, tf - .1) * (1 - seg(t, tn - .3, tn)), rot: -.03, wide: true });
    chip(g, 'THEN YOUR NOSE', 1100, 120, { px: 56, bg: '#9ac46a', s: pop(t, tn - .1), rot: .03, wide: true });
    vignette(g, .5);
  }
  /* 21 · should you be worried? odds: under 1% to about 12% per decade */
  function sOdds(g, t, s) {
    var t2 = start('odds2'), tu = at('odds2', 'under'), tw = at('odds2', 'twelve');
    g.save(); cam(g, t, s, .05);
    wall(g, '#2f2752', '#1f1a38');
    var P = poseAt(t, [[s.t0, { lh: [-40, -230], rh: [40, -232], front: 1, eyes: 'wide', mouth: 'wavy', brow: -1, sweat: 1, look: [0, 0] }], [t2, { lh: [-60, -150], rh: [60, -150], front: 0, eyes: 'dot', mouth: 'flat', brow: 0, sweat: 0, look: [-.8, -.3] }], [tw + .3, { rh: [110, -320], mouth: 'o', brow: 1 }]]);
    guy(g, t < t2 ? 960 : 1620, 1000, t < t2 ? 1.3 : 1.05, P, YOU, t);
    if (t > t2 - .2) {
      var x0 = 220, x1 = 1380, y0 = 520, X = function (p) { return lerp(x0, x1, p / 15); }, bk = pop(t, t2 - .2, 2.4, .7);
      g.save(); g.globalAlpha = clamp(bk, 0, 1);
      rr(g, x0 - 20, y0 - 60, x1 - x0 + 40, 120, 60); fillStroke(g, CREAM, 7);
      for (var p = 0; p <= 15; p += 5) { g.fillStyle = INK; g.fillRect(X(p) - 2, y0 + 70, 4, 24); txt(g, p + '%', X(p), y0 + 124, 34, CREAM, { fam: MONO, wt: 700 }); }
      var a = X(.8), b = lerp(a, X(12), eio(seg(t, tw - .2, tw + .4)));
      if (t > tu - .2) { rr(g, a - 30, y0 - 42, Math.max(60, b - a + 60), 84, 42); var gr = g.createLinearGradient(a, 0, X(12), 0); gr.addColorStop(0, MINT); gr.addColorStop(.5, YEL); gr.addColorStop(1, RED); g.fillStyle = gr; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); }
      g.restore();
      chip(g, 'UNDER 1%', a, y0 - 150, { px: 40, bg: MINT, s: pop(t, at('odds2', 'one') - .1), wide: true });
      chip(g, '≈12%', X(12), y0 - 150, { px: 50, bg: RED, fg: '#fff', s: pop(t, tw), wide: true });
      chip(g, 'PER DECADE', 800, 820, { px: 48, bg: YEL, s: pop(t, at('odds2', 'decade') - .1), rot: -.02, wide: true });
      chip(g, 'THE ODDS', 800, 220, { px: 52, bg: CREAM, s: pop(t, at('odds2', 'odds') - .1), rot: .02, wide: true });
    }
    g.restore();
    vignette(g, .45);
  }
  /* 22 · the near miss: July 2012 */
  function sMiss(g, t, s) {
    var tf = at('odds4', 'fired'), tw = at('odds4', 'week'), th = at('odds4', 'hit');
    g.save(); cam(g, t, s, .05);
    space(g, t, t * 10, 0);
    var cx = 960, cy = 560, R = 400;
    g.save(); g.setLineDash([14, 14]); g.strokeStyle = 'rgba(244,237,224,.4)'; g.lineWidth = 4; g.beginPath(); g.ellipse(cx, cy, R, R * .62, 0, 0, 6.283); g.stroke(); g.restore();
    sun(g, cx, cy, 130, t, t > th + .3 ? 'oops' : t > tf ? 'smug' : 'calm');
    var ea = -1.0 - (t - s.t0) * .08, blast = -1.0 - (tf - s.t0) * .08 + .62;
    var bp = [cx + Math.cos(blast) * R, cy + Math.sin(blast) * R * .62];
    /* the blast, aimed at a spot Earth left a week ago */
    var bk = seg(t, tf, tf + 1.6);
    if (bk > 0) plasma(g, lerp(cx, bp[0], eio(bk)), lerp(cy, bp[1], eio(bk)), 40 + bk * 60, t, 1 - seg(t, th + .6, th + 1.2), true);
    if (t > tw - .2) { g.save(); g.globalAlpha = .45 * pop(t, tw - .2); earth(g, bp[0], bp[1], 60, t, { lights: false }); g.restore(); cross(g, bp[0], bp[1], 1.4, pop(t, th - .1), RED); chip(g, '1 WEEK EARLIER', bp[0], bp[1] - 120, { px: 34, bg: YEL, s: pop(t, at('odds4', 'earlier') - .1), wide: true }); }
    var ep = [cx + Math.cos(ea) * R, cy + Math.sin(ea) * R * .62];
    earth(g, ep[0], ep[1], 70, t, { light: ep[0] > cx ? -1 : 1 });
    if (t > th + .4) chip(g, 'PHEW', ep[0], ep[1] - 120, { px: 40, bg: MINT, s: pop(t, th + .4), rot: .06, wide: true });
    g.restore();
    chip(g, 'A NEAR MISS', 960, 120, { px: 52, bg: RED, fg: '#fff', s: pop(t, at('odds3', 'near') - .1) * (1 - seg(t, start('odds4'), start('odds4') + .3)), rot: -.03, wide: true });
    chip(g, 'JULY 2012', 960, 120, { px: 52, bg: CREAM, s: pop(t, at('odds4', 'july') - .1), rot: -.03, wide: true });
    chip(g, 'JUST AS BIG', 1500, 220, { px: 40, bg: YEL, s: pop(t, at('odds4', 'big') - .1), rot: .04, wide: true });
    vignette(g, .4);
  }
  function lever(g, x, y, k) { g.save(); g.translate(x, y); rr(g, -60, -20, 120, 40, 8); fillStroke(g, '#5a5a6a', 5); g.rotate(lerp(-.7, .7, k)); g.lineWidth = 14; g.lineCap = 'round'; g.strokeStyle = INK; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -150); g.stroke(); circ(g, 0, -160, 26); fillStroke(g, RED, 5); g.restore(); }
  /* 23 · even an hour of warning helps: lower the load, satellites hide in safe mode; you: a flashlight, water, a paper map */
  function sPrep(g, t, s) {
    var t6 = start('odds6'), t7 = start('odds7'), tl = at('odds5', 'lower'), tsf = at('odds5', 'safe');
    if (t < t6 - .2) {
      g.save(); cam(g, t, s, .05, 960, 560);
      if (t < tsf - .6) {
        wall(g, '#20304a', '#141e30');
        /* a control room wall of screens */
        for (var i = 0; i < 6; i++) { rr(g, 160 + i * 270, 140, 240, 160, 10); fillStroke(g, '#0e1828', 6); g.strokeStyle = MINT; g.lineWidth = 4; g.beginPath(); for (var x = 0; x < 220; x += 10) g.lineTo(170 + i * 270 + x, 230 + Math.sin(x * .06 + t * 3 + i) * 30 * (t > tl ? .4 : 1)); g.stroke(); }
        rr(g, 300, 640, 1320, 60, 10); fillStroke(g, '#3a4a64', 6);
        var lk = eio(seg(t, tl - .2, tl + .4));
        lever(g, 1100, 640, lk); txt(g, 'LOAD', 1100, 740, 34, CREAM, { fam: MONO, wt: 700 });
        var P = poseAt(t, [[s.t0, { rh: [150, -300], lh: [-60, -180], look: [1, -.3], mouth: 'flat' }], [tl - .2, { rh: [220, -300], lh: [200, -310], look: [1, 0], mouth: 'grin', lean: .1 }], [tl + .3, { rh: [230, -200], lh: [210, -210] }]]);
        guy(g, 860, 920, 1.15, P, ENG, t);
        floorAt(g, 920, '#101826');
      } else {
        space(g, t, t * 20, 0);
        earth(g, 960, 1300, 700, t, { lon: -40, lat: 40, light: -1 });
        [[520, 360], [960, 260], [1400, 360]].forEach(function (p, i) { satellite(g, p[0], p[1] + Math.sin(t * 1.5 + i) * 10, .8, Math.sin(t + i) * .05, { eyes: t > tsf - .1 ? 'shut' : 'dot' }); });
      }
      g.restore();
      chip(g, 'EVEN 1 HOUR HELPS', 960, 120, { px: 50, bg: MINT, s: pop(t, at('odds5', 'hour') - .1) * (1 - seg(t, tl - .4, tl - .1)), rot: -.03, wide: true });
      chip(g, 'LOWER THE LOAD', 960, 120, { px: 50, bg: YEL, s: pop(t, tl - .1) * (1 - seg(t, tsf - .9, tsf - .6)), rot: .02, wide: true });
      chip(g, 'SAFE MODE', 960, 560, { px: 64, bg: CREAM, s: pop(t, tsf - .1), rot: -.03, wide: true });
    } else {
      var ss2 = { t0: t6 - .2, t1: s.t1 };
      g.save(); cam(g, t, ss2, .06, 900, 600);
      wall(g, '#3a2e5a', '#241d3e'); floorAt(g, 900, '#1e1834');
      rr(g, 1020, 120, 300, 240, 8); g.fillStyle = '#0b0a24'; g.fill(); g.save(); rr(g, 1020, 120, 300, 240, 8); g.clip(); aurora(g, t, .9, 330); g.restore(); g.lineWidth = 10; g.strokeStyle = INK; rr(g, 1020, 120, 300, 240, 8); g.stroke(); g.fillStyle = INK; g.fillRect(1165, 120, 10, 240);
      g.fillStyle = '#4a3a6a'; g.fillRect(140, 300, 360, 18); rr(g, 170, 240, 50, 60, 6); fillStroke(g, '#4ab0ff', 4); rr(g, 240, 220, 34, 80, 6); fillStroke(g, '#ffc83d', 4); rr(g, 300, 250, 80, 50, 6); fillStroke(g, '#5fb86b', 4);
      var tF = at('odds6', 'flashlight'), tW = at('odds6', 'water'), tM = at('odds6', 'map');
      var P2 = poseAt(t, [[ss2.t0, { lh: [-60, -150], rh: [60, -150], look: [.6, 0], mouth: 'smile' }], [tF, { rh: [130, -250], mouth: 'grin' }], [t7, { lh: [-110, -260], rh: [110, -260], look: [0, .4], glasses: 1, mouth: 'smirk', eyes: 'dot' }]]);
      var mapH = function (g) { g.save(); g.rotate(.1); g.beginPath(); g.moveTo(0, -40); g.lineTo(140, -50); g.lineTo(150, 50); g.lineTo(10, 60); g.closePath(); fillStroke(g, '#f1e9d8', 4); g.strokeStyle = RED; g.lineWidth = 4; g.beginPath(); g.moveTo(20, 30); g.quadraticCurveTo(80, -40, 130, 10); g.stroke(); g.restore(); };
      guy(g, 620, 905, 1.25, P2, Object.assign({}, YOU, { glasses: t > t7, hold: [t > t7 ? mapH : null, t > tF && t < t7 ? function (g) { g.rotate(-.3); rr(g, -12, -60, 24, 70, 6); fillStroke(g, '#2a2638', 4); } : null] }), t);
      if (t > tF && t < t7) { g.save(); g.globalCompositeOperation = 'lighter'; var bx = 620 + 130 * 1.25, by = 905 - 250 * 1.25 - 60; var gr = g.createRadialGradient(bx, by, 10, bx + 300, by - 400, 500); gr.addColorStop(0, 'rgba(255,240,180,.6)'); gr.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + 700, by - 600); g.lineTo(bx + 200, by - 800); g.closePath(); g.fill(); g.restore(); }
      /* the checklist */
      var items = [['FLASHLIGHT', tF], ['WATER', tW], ['PAPER MAP', tM]];
      card(g, 1380, 420, 560, 440, .03, pop(t, tF - .4, 2.6, .7), function (g) {
        txt(g, 'BLACKOUT KIT', 0, -160, 44, INK, { wt: 900, wide: true });
        items.forEach(function (it, i) { rr(g, -230, -90 + i * 100, 50, 50, 8); fillStroke(g, '#fff', 4); txt(g, it[0], -160, -64 + i * 100, 40, INK, { wt: 800, align: 'left' }); tick(g, -205, -65 + i * 100, .9, pop(t, it[1]), MINT); });
      });
      g.restore();
      if (t > t7) quote(g, t, 'odds7', 270, { px: 80 });
    }
    vignette(g, .45);
  }
  /* 24 · the weird upside: northern lights in Miami, the perfect selfie, and you can't post it */
  function sMiami(g, t, s) {
    var t2 = start('end2'), tsf = at('end3', 'selfie'), t4 = start('end4'), tp = at('end4', 'post');
    g.save(); cam(g, t, s, .08, 960, 460);
    sky(g, t, '#090822', '#2a2050', { stars: 1 });
    var ak = .35 + .65 * eio(seg(t, at('end2', 'northern') - .2, at('end2', 'miami')));
    aurora(g, t, ak, 280, { k: 2.2 }); aurora(g, t + 4, ak * .8, 400, { k: 1.8 });
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = ak * .3; var rg = g.createLinearGradient(0, 0, 0, 560); rg.addColorStop(0, '#ff4a8a'); rg.addColorStop(.6, 'rgba(93,255,176,.5)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(-200, -200, W + 400, 760); g.restore();
    /* Miami: a low skyline, palms, the sea */
    g.save(); g.translate(0, 760); g.scale(1, .42); g.translate(0, -760); skyline(g, t, 760, null, 17); g.restore();
    g.fillStyle = '#10204a'; g.fillRect(-200, 760, W + 400, 120);
    g.save(); g.globalAlpha = ak * .35; g.globalCompositeOperation = 'lighter'; g.fillStyle = AUR1; g.fillRect(-200, 760, W + 400, 50); g.restore();
    ground(g, 860, '#d9c08a', '#b89a62', { amp: 6 });
    palm(g, 160, 880, 1.3, t, '#121022'); palm(g, 1760, 880, 1.2, t + 2, '#121022');
    var shoot = t > tsf - .4, failed = t > tp;
    var P = poseAt(t, [[s.t0, { look: [0, -1], mouth: 'O', eyes: 'wide', lh: [-60, -150], rh: [60, -160] }], [t2 + .4, { lh: [-110, -320], rh: [110, -320], mouth: 'grin' }], [tsf - .5, { lh: [-60, -150], rh: [160, -330], look: [.6, -.4], mouth: 'grin', eyes: 'happy', tilt: -.1 }], [t4 + .3, { look: [.8, -.6], mouth: 'flat', eyes: 'dot', tilt: 0 }], [tp + .3, { mouth: 'frown', eyes: 'side', brow: -1 }]]);
    guy(g, 860, 900, 1.25, P, Object.assign({}, YOU, { sunglasses: false, hold: [null, shoot ? function (g) { phone(g, 0, -20, .9, .3, failed ? '#555' : '#9ee6ff'); } : null] }), t);
    g.restore();
    if (t > tsf && t < tsf + .35) { g.fillStyle = 'rgba(255,255,255,' + (1 - seg(t, tsf, tsf + .35)) + ')'; g.fillRect(0, 0, W, H); }
    /* the photo, and the upload that never happens */
    var pk = pop(t, tsf + .25, 2.6, .7);
    if (pk > 0) {
      g.save(); g.translate(1440, 440); g.scale(pk, pk); g.rotate(.05);
      g.fillStyle = 'rgba(8,6,18,.45)'; g.fillRect(-250 + 14, -300 + 18, 500, 600);
      g.beginPath(); g.rect(-250, -300, 500, 600); fillStroke(g, '#fff', 6);
      g.save(); g.beginPath(); g.rect(-220, -270, 440, 440); g.clip(); g.translate(-220, -270); g.scale(440 / W * 2.2, 440 / H * 1.2); sky(g, t, '#090822', '#2a2050', { stars: 1 }); aurora(g, t, 1, 200); g.restore();
      g.save(); g.translate(0, 120); circ(g, 0, -80, 56); fillStroke(g, HEAD, 5); g.restore();
      if (t > t4 - .1) {
        var fk = failed ? 1 : 0;
        rr(g, -200, 190, 400, 80, 40); fillStroke(g, fk ? RED : '#3d7bff', 5);
        if (!fk) { spinner(g, -150, 230, 22, t, '#fff', 1); txt(g, 'POSTING…', 20, 232, 34, '#fff', { wt: 900, wide: true }); }
        else txt(g, '✕ NO SIGNAL', 0, 232, 36, '#fff', { wt: 900, wide: true });
      }
      g.restore();
    }
    chip(g, 'THE WEIRD UPSIDE', 960, 140, { px: 52, bg: YEL, s: pop(t, at('end1', 'weird') - .1) * (1 - seg(t, t2, t2 + .3)), rot: -.03, wide: true });
    chip(g, 'EVEN IN MIAMI', 640, 140, { px: 52, bg: CREAM, s: pop(t, at('end2', 'miami') - .1) * (1 - seg(t, tsf - .6, tsf - .3)), rot: .03, wide: true });
    vignette(g, .45);
  }
  /* 25 · end card: the next video */
  function sCard(g, t, s) {
    g.save(); cam(g, t, s, .04);
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#221d3a'); bg.addColorStop(1, '#3b2f5c'); g.fillStyle = bg; g.fillRect(-200, -200, W + 400, H + 400);
    var k = pop(t, s.t0 + .1);
    g.save(); g.translate(330, 200); g.scale(k * .7, k * .7); circ(g, 0, 0, 120); fillStroke(g, HOOD, 8);
    g.beginPath(); g.moveTo(-34, -60); g.lineTo(-34, 54); g.lineTo(-6, 28); g.lineTo(14, 72); g.lineTo(32, 64); g.lineTo(12, 20); g.lineTo(48, 18); g.closePath(); fillStroke(g, CREAM, 7); g.restore();
    txt(g, 'Tech, explained', 460, 200, 70, CREAM, { wt: 900, align: 'left' });
    /* the next video, as a thumbnail card */
    var nk = pop(t, at('end5', 'cables') - .3, 2.6, .7);
    if (nk > 0) {
      g.save(); g.translate(1000, 590); g.scale(nk, nk); g.rotate(-.02);
      g.fillStyle = 'rgba(8,6,18,.5)'; g.fillRect(-400 + 16, -225 + 20, 800, 450);
      g.save(); rr(g, -400, -225, 800, 450, 18); g.clip();
      var sg = g.createLinearGradient(0, -225, 0, 225); sg.addColorStop(0, '#14507a'); sg.addColorStop(1, '#061428'); g.fillStyle = sg; g.fillRect(-400, -225, 800, 450);
      g.strokeStyle = INK; g.lineWidth = 26; g.beginPath(); g.moveTo(-400, 120); g.quadraticCurveTo(-100, 160, 40, 110); g.stroke(); g.beginPath(); g.moveTo(120, 100); g.quadraticCurveTo(250, 80, 400, 130); g.stroke();
      spark(g, 80, 105, .1, 0, .8);
      txt(g, 'EVERY CABLE', 0, -110, 76, CREAM, { wt: 900, wide: true, outline: 12 }); rr(g, -150, -50, 300, 100, 14); fillStroke(g, RED, 7); txt(g, 'CUT?', 0, 4, 76, '#fff', { wt: 900, wide: true });
      g.restore();
      rr(g, -400, -225, 800, 450, 18); g.lineWidth = 8; g.strokeStyle = CREAM; g.stroke();
      circ(g, 0, 0, 0);
      g.restore();
      chip(g, '▶ WATCH NEXT', 1000, 900, { px: 44, bg: RED, fg: '#fff', s: pop(t, at('end5', 'here') - .1), wide: true });
    }
    var P = poseAt(t, [[s.t0, { rh: [110, -300], look: [.5, 0], mouth: 'grin' }], [at('end5', 'here') - .2, { rh: [200, -300], lh: [-60, -150], look: [1, -.1], eyes: 'happy', mouth: 'grin' }]]);
    guy(g, 1620, 1000, 1.15, P, YOU, t);
    g.restore();
    vignette(g, .4);
  }
