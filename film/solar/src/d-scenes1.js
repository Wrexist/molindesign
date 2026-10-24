
  /* ============================================================ scene helpers */
  /* a quotable line, built on screen from paper words, each landing on its spoken word */
  function quote(g, t, id, y, o) {
    o = o || {}; var ws = LINE[id].words, px = o.px || 88, maxw = o.maxw || 1500, rows = [[]], rw = [0];
    font(g, px, 900, DISP, true);
    ws.forEach(function (w) { var ww = g.measureText(w.w.toUpperCase()).width + px * .7; if (rw[rw.length - 1] + ww > maxw && rows[rows.length - 1].length) { rows.push([]); rw.push(0); } rows[rows.length - 1].push({ w: w, ww: ww }); rw[rw.length - 1] += ww + px * .22; });
    var out = o.out == null ? 1 : o.out, n = 0;
    rows.forEach(function (row, ri) {
      var x = (o.x || W / 2) - (rw[ri] - px * .22) / 2, yy = y + (ri - (rows.length - 1) / 2) * px * 1.5;
      row.forEach(function (c) {
        var k = pop(t, c.w.t0 - .06, 3.4, .55), i = n++;
        if (k > 0) {
          g.save(); g.globalAlpha *= out; g.translate(x + c.ww / 2, yy + (1 - clamp(k, 0, 1)) * -40); g.rotate((hash(i * 3.1 + y) - .5) * .09); g.scale(k, k);
          g.fillStyle = 'rgba(8,6,18,.45)'; g.fillRect(-c.ww / 2 + 10, -px * .66 + 14, c.ww, px * 1.32);
          g.beginPath(); g.rect(-c.ww / 2, -px * .66, c.ww, px * 1.32); fillStroke(g, i % 3 === 2 ? YEL : PAPER, 5);
          txt(g, c.w.w.toUpperCase(), 0, px * .04, px, INK, { wt: 900, wide: true });
          if (i === 0) tape(g, -c.ww / 2 + 20, -px * .62, -.5);
          g.restore();
        }
        x += c.ww + px * .22;
      });
    });
  }
  /* a stopwatch dial with a sweeping hand */
  function stopwatch(g, x, y, r, k, col, label) {
    g.save(); g.translate(x, y);
    rr(g, -r * .18, -r * 1.32, r * .36, r * .26, 6); fillStroke(g, CREAM, 5);
    circ(g, 0, 0, r); fillStroke(g, CREAM, 8);
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * .86, -Math.PI / 2, -Math.PI / 2 + 6.283 * clamp(k, 0, 1)); g.closePath(); g.fillStyle = col || 'rgba(255,74,61,.35)'; g.fill();
    for (var i = 0; i < 12; i++) { var a = i / 12 * 6.283; g.beginPath(); g.moveTo(Math.sin(a) * r * .78, -Math.cos(a) * r * .78); g.lineTo(Math.sin(a) * r * .9, -Math.cos(a) * r * .9); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); }
    var a2 = 6.283 * k; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(a2) * r * .8, -Math.cos(a2) * r * .8); g.lineWidth = 8; g.lineCap = 'round'; g.strokeStyle = RED; g.stroke(); circ(g, 0, 0, 10); g.fillStyle = INK; g.fill();
    if (label) txt(g, label, 0, r + 54, 52, CREAM, { wt: 900, wide: true, outline: 10 });
    g.restore();
  }
  function wall(g, top, bot) { var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(-200, -200, W + 400, H + 400); }
  function floorAt(g, y, col) { g.fillStyle = col; g.fillRect(-200, y, W + 400, H + 400 - y); g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(-200, y, W + 400, 10); }
  function sepia(g, a) { if (a <= 0) return; g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = a; g.fillStyle = '#e8c48f'; g.fillRect(0, 0, W, H); g.restore(); }
  function drink(g) { g.rotate(-.1); g.beginPath(); g.moveTo(-16, -40); g.lineTo(16, -40); g.lineTo(11, 8); g.lineTo(-11, 8); g.closePath(); fillStroke(g, 'rgba(255,170,90,.9)', 4); g.strokeStyle = RED; g.lineWidth = 4; g.beginPath(); g.moveTo(4, -40); g.lineTo(14, -66); g.stroke(); circ(g, -10, -42, 9); fillStroke(g, '#ffd23d', 3); }
  function flash(g, t, t0, d, col) { var k = seg(t, t0, t0 + (d || .5)); if (t < t0 || k >= 1) return; g.fillStyle = col || 'rgba(255,248,225,' + (1 - k) + ')'; if (col) g.globalAlpha = 1 - k; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }

  /* =================================================================== scenes */
  /* 1 · the Sun sneezes. Right at us. */
  function sBeach(g, t, s) {
    var tA = at('open1', 'sun'), tS = at('open1', 'sneezes'), t2 = start('open2');
    g.save(); var sh = knock(t, tS + .05, 34, 5) * 16; g.translate(sh, -sh * .6); cam(g, t, s, .1, 1250, 420);
    sky(g, t, '#6ab8f5', '#ffd9a8', { clouds: 'rgba(255,255,255,.8)' });
    var sea = g.createLinearGradient(0, 600, 0, 780); sea.addColorStop(0, '#2b7fc2'); sea.addColorStop(1, '#69c0e6'); g.fillStyle = sea; g.fillRect(-200, 610, W + 400, 200);
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 4; for (var i = 0; i < 9; i++) { var wx = ((i * 260 + t * 40) % (W + 300)) - 150, wy = 650 + (i % 3) * 38; g.beginPath(); g.moveTo(wx, wy); g.quadraticCurveTo(wx + 40, wy - 10, wx + 80, wy); g.stroke(); }
    ground(g, 770, '#f6d9a0', '#e6b977', { amp: 8 });
    palm(g, 1740, 800, 1.15, t, '#3a5a3f');
    /* umbrella */
    g.save(); g.translate(240, 900); g.strokeStyle = INK; g.lineWidth = 9; g.beginPath(); g.moveTo(0, 0); g.lineTo(30, -420); g.stroke();
    g.translate(30, -420); g.rotate(.07); g.beginPath(); g.moveTo(-230, 40); g.quadraticCurveTo(0, -150, 230, 40); g.closePath(); fillStroke(g, RED, 6); g.beginPath(); g.moveTo(-80, 40); g.quadraticCurveTo(0, -150, 80, 40); g.closePath(); fillStroke(g, CREAM, 0); g.restore();
    var mood = t < tA - .2 ? 'calm' : t < tS - .03 ? 'aah' : t < tS + .8 ? 'sneeze' : 'oops';
    var r = 170 * (1 + (mood === 'aah' ? .1 * seg(t, tA - .2, tS) : 0) - knock(t, tS, 22, 5) * .1);
    sun(g, 1380, 290, r, t, mood);
    /* the sneeze itself: a spray of sparks off the Sun */
    if (t > tS && t < tS + .8) { var k = seg(t, tS, tS + .8); for (i = 0; i < 14; i++) { var a = Math.PI * (.55 + hash(i) * .5), d = 200 + eo(k) * 380; circ(g, 1380 + Math.cos(a) * d, 290 + Math.sin(a) * d * .8, 9 * (1 - k)); g.fillStyle = '#ffe9a0'; g.fill(); } }
    var P = poseAt(t, [[s.t0, { lh: [-70, -150], rh: [56, -236], look: [.6, -.5], mouth: 'smile', eyes: 'happy', tilt: -.06 }], [tA, { eyes: 'dot', mouth: 'o', look: [.8, -.8] }], [tS + .05, { eyes: 'wide', mouth: 'O', brow: 1, rh: [90, -270], lean: -.06 }, .15], [t2, { lean: -.14, lh: [-130, -310], rh: [130, -310], mouth: 'O', sweat: 1, look: [.3, -.3] }, .2]]);
    guy(g, 620, 920, 1.3, P, Object.assign({}, YOU, { hat: 'sun', sunglasses: t < tS + .1, hold: [null, t < t2 ? drink : null] }), t);
    /* the sunglasses fall off */
    var fk = seg(t, tS + .1, tS + .6); if (fk > 0) { g.save(); g.translate(lerp(640, 760, fk), lerp(500, 905, fk * fk)); g.rotate(fk * 4); g.beginPath(); g.roundRect(-40, -12, 34, 24, 8); g.roundRect(6, -12, 34, 24, 8); fillStroke(g, INK, 3); g.restore(); }
    g.restore();
    /* the cloud comes straight at the lens */
    var ck = seg(t, tS + .2, end('open2') + .3);
    if (ck > 0) { var cx = lerp(1380, 960, eio(ck)), cy = lerp(290, 560, eio(ck)), cr = lerp(40, 1500, Math.pow(ck, 2.4)); plasma(g, cx, cy, cr, t, 1, true); g.fillStyle = 'rgba(255,244,214,' + seg(ck, .8, 1) + ')'; g.fillRect(0, 0, W, H); }
    chip(g, 'RIGHT AT US', 960, 170, { px: 58, bg: YEL, s: pop(t, at('open2', 'us') - .1) * (1 - seg(ck, .7, .85)), rot: -.03, wide: true });
    vignette(g, .35);
  }
  /* 2 · the biggest storm ever recorded, hitting a planet that runs on electricity */
  function sStorm(g, t, s) {
    var tb = at('open3', 'biggest'), te = at('open3', 'electricity');
    g.save(); cam(g, t, s, .07, 1300, 560);
    space(g, t, t * 30, 0);
    sun(g, 160, 560, 330, t, 'grin', { spots: true });
    var k = seg(t, s.t0, s.t1 + .4), cx = lerp(560, 1150, eio(k));
    for (i = 0; i < 6; i++) { g.strokeStyle = 'rgba(255,170,80,' + (.35 - i * .05) + ')'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - 200 - i * 70, 470 + i * 34); g.lineTo(cx - 60 - i * 40, 470 + i * 34); g.stroke(); }
    plasma(g, cx, 560, 150 + k * 40, t, 1, true);
    /* Earth, wearing a power cord */
    var ex = 1560, ey = 560, er = 240;
    g.save(); g.lineCap = 'round'; g.beginPath(); g.moveTo(ex + 120, ey + 200); g.bezierCurveTo(ex + 160, ey + 420, ex + 420, ey + 300, ex + 460, ey + 560); g.strokeStyle = INK; g.lineWidth = 26; g.stroke(); g.strokeStyle = '#3b3550'; g.lineWidth = 14; g.stroke(); g.restore();
    var sq = seg(t, s.t1 - .5, s.t1 + .4);
    earth(g, ex, ey, er, t, { lon: -75, lat: 25, light: -1, field: .9, squash: sq });
    for (var i = 0; i < 3; i++) bolt(g, ex + 150, ey + 240, ex + 200 + i * 40, ey + 330, t, te < t ? .8 : 0, YEL, i);
    g.restore();
    chip(g, 'BIGGEST EVER RECORDED', 760, 170, { px: 54, bg: YEL, s: pop(t, tb - .1), rot: -.03, wide: true });
    chip(g, 'RUNS ON ELECTRICITY', 1560, 900, { px: 44, bg: CREAM, s: pop(t, te - .1), rot: .02, wide: true });
    flash(g, t, s.t0, .5);
    vignette(g, .4);
  }
  /* 3 · what breaks first? how long? should you worry? and how much warning */
  function sAsk(g, t, s) {
    var t5 = start('open5'), tw = at('open5', 'warning');
    g.save(); cam(g, t, s, .05);
    wall(g, '#2f2752', '#1f1a38');
    g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 2; for (var x = 0; x < W; x += 80) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    var out = eio(seg(t, at('open5', 'scary') - .2, at('open5', 'scary') + .4));
    [['breaks', 'WHAT BREAKS FIRST?', 420, -.06, RED], ['long', 'HOW LONG DOES IT LAST?', 960, .03, YEL], ['worried', 'SHOULD YOU WORRY?', 1500, -.03, LIGHT]].forEach(function (q, i) {
      var k = pop(t, at('open4', q[0]) - .25, 3, .6); if (k <= 0) return;
      var y = 470 + (i === 1 ? -30 : 20) + out * (i === 1 ? -900 : 900) * (i === 1 ? 1 : 1);
      card(g, q[2] + out * (i - 1) * 400, y, 460, 380, q[3] + knock(t, at('open4', q[0]) - .1, 18, 6) * .05, 1, function (g) {
        g.fillStyle = q[4]; g.fillRect(-230, -190, 460, 70); txt(g, 'Q' + (i + 1), 0, -154, 44, INK, { wt: 900, wide: true });
        var lines = q[1].split(' '), mid = Math.ceil(lines.length / 2);
        var L2 = q[1] === 'HOW LONG DOES IT LAST?' ? ['HOW LONG DOES', 'IT LAST?'] : [lines.slice(0, mid).join(' '), lines.slice(mid).join(' ')]; txt(g, L2[0], 0, -10, 40, INK, { wt: 900, wide: true }); txt(g, L2[1], 0, 54, 40, INK, { wt: 900, wide: true });
      });
      tape(g, q[2] + out * (i - 1) * 400, y - 186, (i - 1) * .2);
    });
    /* the stopwatch: how much warning */
    var sk = pop(t, tw - .3, 2.6, .6);
    if (sk > 0) { g.save(); g.translate(960, 480); g.scale(sk, sk); stopwatch(g, 0, 0, 200, seg(t, tw, s.t1) * .9, null, 'HOW MUCH WARNING?'); g.restore(); }
    var P = poseAt(t, [[s.t0, { look: [-.6, -.3], mouth: 'flat' }], [at('open4', 'worried') - .1, { lh: [-120, -250], rh: [120, -250], mouth: 'wavy', brow: -1, look: [0, 0], sweat: 1 }], [t5, { lh: [-60, -150], rh: [80, -300], mouth: 'talk', brow: 1, look: [-.8, -.4] }]]);
    guy(g, 1700, 1080, 1.05, P, YOU, t);
    g.restore();
    vignette(g, .45);
  }
  /* 4 · the title */
  function sTitle(g, t, s) {
    g.save(); cam(g, t, s, .06);
    space(g, t, t * 20, 0, { a: '#140f2e', b: '#2a1a40' });
    sun(g, 1600, 830, 260, t, at('title', 'tomorrow') < t ? 'smug' : 'grin', { spots: true });
    earth(g, 300, 860, 150, t, { lon: -40, lat: 20, light: 1 });
    g.restore();
    var L = [['WHAT', 'IF', 'THE', 'BIGGEST'], ['SOLAR', 'STORM', 'IN', 'HISTORY'], ['HIT', 'EARTH', 'TOMORROW?']];
    L.forEach(function (ws, ri) {
      var px = 124; font(g, px, 900, DISP, true);
      var sp2 = px * .3, wd = ws.map(function (w) { return g.measureText(w).width; }), tw = wd.reduce(function (a, b) { return a + b; }, 0) + sp2 * (ws.length - 1), x = W / 2 - tw / 2, y = 230 + ri * 165;
      ws.forEach(function (w, i) {
        var k = pop(t, at('title', w.replace('?', '').toLowerCase()) - .06, 3.2, .6);
        if (k > 0) {
          g.save(); g.translate(x + wd[i] / 2, y); g.scale(k, k); g.rotate((hash(i + ri * 5) - .5) * .06);
          if (w === 'TOMORROW?') { rr(g, -wd[i] / 2 - 20, -px * .62, wd[i] + 40, px * 1.2, 16); fillStroke(g, RED, 8); }
          txt(g, w, 0, 4, px, w === 'TOMORROW?' ? '#fff' : w === 'SOLAR' || w === 'STORM' ? YEL : CREAM, { wt: 900, wide: true, outline: 16, ocol: INK }); g.restore();
        }
        x += wd[i] + sp2;
      });
    });
    vignette(g, .45);
  }
  /* 5 · 93 million miles; 1859 did it in 17 hours */
  function sTrip(g, t, s) {
    var t2 = start('warn2'), tc = at('warn1', 'cross');
    g.save(); cam(g, t, s, .05, 960, 540);
    space(g, t, t * 40, 0);
    sun(g, 120, 540, 260, t, t < t2 ? 'smug' : 'grin');
    earth(g, 1740, 540, 110, t, { lon: -80, lat: 20, light: -1 });
    /* the route */
    g.save(); g.setLineDash([22, 18]); g.lineDashOffset = -t * 60; g.strokeStyle = 'rgba(244,237,224,.45)'; g.lineWidth = 5; g.beginPath(); g.moveTo(420, 540); g.lineTo(1600, 540); g.stroke(); g.restore();
    var k1 = seg(t, tc, end('warn1') + .2), k2 = seg(t, at('warn2', 'trip'), at('warn2', 'hours') + .2), k = t < t2 ? eio(k1) * .55 : lerp(.55, 1, eio(k2));
    var cx = lerp(440, 1560, k);
    if (t > t2) for (var i = 0; i < 5; i++) { g.strokeStyle = 'rgba(255,200,120,' + (.5 - i * .08) + ')'; g.lineWidth = 7; g.beginPath(); g.moveTo(cx - 140 - i * 60, 500 + i * 22); g.lineTo(cx - 40 - i * 30, 500 + i * 22); g.stroke(); }
    plasma(g, cx, 540, 100, t, k1 > 0 ? 1 : 0, true);
    g.restore();
    if (t < t2) counter(g, 960, 270, seg(t, at('warn1', 'ninetythree') - .1, at('warn1', 'miles')), 93000000, 96, YEL, { post: ' MI' });
    else {
      chip(g, '1859', 960, 400, { px: 70, bg: CREAM, s: pop(t, at('warn2', '1859') - .1), rot: -.05, wide: true });
      counter(g, 1200, 250, seg(t, at('warn2', 'trip'), at('warn2', 'hours')), 17, 110, YEL, { pre: '≈', post: ' HOURS' });
      chip(g, 'THE RECORD', 960, 860, { px: 46, bg: RED, fg: '#fff', s: pop(t, at('warn2', 'record') - .1), rot: .02, wide: true });
    }
    vignette(g, .4);
  }
  function doorbellIcon(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); rr(g, -50, -90, 100, 180, 30); fillStroke(g, '#2a2638', 6); circ(g, 0, -40, 24); fillStroke(g, '#4a6bd8', 5); circ(g, 0, 40, 28); fillStroke(g, LIGHT, 5); g.restore(); }
  /* 6 · the doorbell camera a million miles out */
  function sDoorbell(g, t, s) {
    var tm = at('warn3', 'million'), tdb = at('warn3', 'doorbell'), th = at('warn4', 'hits'), t4 = start('warn4');
    g.save(); cam(g, t, s, .06, 1000, 540);
    space(g, t, t * 25, 0);
    sun(g, -160, 540, 420, t, 'smug');
    earth(g, 1680, 560, 150, t, { lon: -80, lat: 20, light: -1, aurora: seg(t, th + .3, th + 1.2) });
    var hit = t > th, sx = 1000, sy = 520 + Math.sin(t * 1.4) * 10;
    var ck = seg(t, t4 - .2, th);
    plasma(g, lerp(330, sx - 60, eio(ck)), 540, 110 + ck * 40, t, ck > 0 ? 1 - seg(t, th + .1, th + .9) : 0, true);
    satellite(g, sx, sy, 1.1, Math.sin(t * .8) * .06 + knock(t, th, 26, 5) * .2, { cam: true, camLit: hit && (t * 4 % 1) < .5, eyes: hit ? null : null });
    if (hit) { for (var i = 0; i < 3; i++) { var rk = ((t - th) * 1.4 + i / 3) % 1; circ(g, sx, sy, 80 + rk * 260); g.strokeStyle = 'rgba(255,74,61,' + (1 - rk) * .7 + ')'; g.lineWidth = 7; g.stroke(); } }
    /* the distance */
    var dk = seg(t, tm - .2, tm + .5);
    if (dk > 0) { g.save(); g.globalAlpha = dk; g.strokeStyle = CREAM; g.lineWidth = 4; g.setLineDash([12, 10]); g.beginPath(); g.moveTo(sx + 60, 760); g.lineTo(sx + 60 + (1600 - sx - 60) * eo(dk), 760); g.stroke(); g.restore(); chip(g, '1,000,000 MILES', 1300, 760, { px: 40, bg: CREAM, s: pop(t, tm), wide: true }); }
    g.restore();
    /* the doorbell-camera frame */
    var fb = pop(t, tdb - .1, 3, .7);
    if (fb > 0 && t < t4) {
      g.save(); g.globalAlpha = clamp(fb, 0, 1); g.lineWidth = 14; g.strokeStyle = CREAM; rr(g, 70, 70, W - 140, H - 140, 60); g.stroke();
      circ(g, 150, 150, 16); g.fillStyle = (t * 2 % 1) < .5 ? RED : 'rgba(255,74,61,.3)'; g.fill();
      txt(g, 'REC · FRONT DOOR CAM', 190, 152, 34, CREAM, { fam: MONO, wt: 700, align: 'left', outline: 6 });
      g.restore();
      g.save(); g.translate(1700, 300); g.scale(fb, fb); doorbellIcon(g, 0, 0, 1.1); g.restore();
    }
    chip(g, 'DING DONG', sx, 330, { px: 52, bg: RED, fg: '#fff', s: pop(t, th + .05) * (1 - seg(t, th + 1.2, th + 1.5)), rot: -.05, wide: true });
    chip(g, '15 TO 60 MINUTES OF WARNING', 960, 180, { px: 50, bg: YEL, s: pop(t, at('warn4', 'fifteen') - .1), rot: -.02, wide: true });
    vignette(g, .4);
  }
  function door(g, x, y, open) {
    g.save(); g.translate(x, y); rr(g, -150, -460, 300, 460, 6); fillStroke(g, '#2a2142', 7);
    g.save(); g.transform(1 - open * .6, open * .12, 0, 1, -150 + 0, 0); rr(g, 0, -450, 290, 450, 4); fillStroke(g, '#a5524b', 6); circ(g, 250, -220, 12); fillStroke(g, YEL, 4); g.restore();
    g.restore();
  }
  function pizzaBox(g) { g.rotate(-.05); g.beginPath(); g.rect(-70, -44, 140, 26); fillStroke(g, '#e8c57a', 4); txt(g, 'PIZZA', 0, -31, 18, RED, { wt: 900 }); }
  /* 7 · less time than a pizza delivery; the pizza isn't trying to fry the grid */
  function sPizza(g, t, s) {
    var t6 = start('warn6');
    g.save(); cam(g, t, s, .06, 700, 600);
    sky(g, t, '#2a2a5a', '#7a5a8a', { stars: .6 });
    house(g, 500, 860, 2.4, 1, '#6a5590');
    ground(g, 860, '#3b5a46', '#2a4034', { amp: 4 });
    var P = poseAt(t, [[s.t0, { lh: [-60, -180], rh: [70, -190], look: [.4, -.2], mouth: 'smile' }], [at('warn5', 'pizza'), { mouth: 'grin', eyes: 'happy' }], [t6 + .4, { look: [1, -.4], eyes: 'wide', mouth: 'O', brow: 1 }]]);
    guy(g, 820, 880, 1.15, P, Object.assign({}, PIZZA, { hold: [pizzaBox, pizzaBox] }), t);
    /* pizza clock vs storm clock */
    var tp = at('warn5', 'pizza');
    g.save(); g.translate(820, 330); g.scale(pop(t, tp - .3), pop(t, tp - .3)); stopwatch(g, 0, 0, 110, .75, 'rgba(255,200,61,.5)', '30–45 MIN'); g.restore();
    g.save(); g.translate(1340, 330); g.scale(pop(t, at('warn5', 'less') - .2), pop(t, at('warn5', 'less') - .2)); stopwatch(g, 0, 0, 110, .25, null, '15 MIN'); g.restore();
    txt(g, '>', 1080, 330, 120, CREAM, { wt: 900, outline: 14, ocol: INK });
    /* and the cloud goes for the pylons */
    var pk = seg(t, t6 - .3, t6 + .5);
    if (pk > 0) {
      pylon(g, 1500, 880, 1.2); pylon(g, 1820, 880, 1.2); wires(g, [1500, 1820], 880, 1.2, t, 1);
      plasma(g, lerp(2200, 1700, eio(pk)), 300, 130, t, 1, true);
      var zk = t > at('warn6', 'fry') - .1; if (zk) for (var i = 0; i < 3; i++) bolt(g, 1680 - i * 30, 380, 1500 + i * 160, 650, t, 1, YEL, i);
      chip(g, 'FRIES POWER GRIDS', 1660, 160, { px: 42, bg: RED, fg: '#fff', s: pop(t, at('warn6', 'fry') - .1), rot: .03, wide: true });
    }
    g.restore();
    vignette(g, .45);
  }
  /* 8 · 1859: Richard Carrington sees a white flash */
  function sCarr(g, t, s) {
    var t2 = start('hist2'), tf = at('hist2', 'flash');
    g.save(); cam(g, t, s, .07, 900, 520);
    wall(g, '#4a3a2e', '#2e231c');
    /* the window and the telescope */
    rr(g, 140, 120, 420, 520, 8); g.fillStyle = '#9fc4e6'; g.fill(); g.lineWidth = 12; g.strokeStyle = '#2b2018'; g.stroke(); g.fillStyle = '#2b2018'; g.fillRect(344, 120, 12, 520); g.fillRect(140, 374, 420, 12);
    g.save(); g.translate(470, 600); g.rotate(-.6); rr(g, -40, -30, 520, 60, 14); fillStroke(g, '#b88a4a', 6); rr(g, 470, -40, 60, 80, 8); fillStroke(g, '#8a6a3a', 6); g.restore();
    g.strokeStyle = '#2b2018'; g.lineWidth = 10; g.beginPath(); g.moveTo(560, 640); g.lineTo(500, 900); g.moveTo(560, 640); g.lineTo(640, 900); g.stroke();
    /* the projected Sun on a white board */
    g.save(); g.translate(1180, 470); rr(g, -260, -260, 520, 520, 8); fillStroke(g, '#f6eedc', 8);
    circ(g, 0, 0, 200); g.fillStyle = '#ffe8b0'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#7a5a3a'; g.stroke();
    [[-60, 30, 24], [-30, 48, 16], [-84, 52, 12], [40, -60, 14]].forEach(function (p) { circ(g, p[0], p[1], p[2]); g.fillStyle = '#3a2a1a'; g.fill(); });
    if (t > tf - .05 && t < tf + 1.6) { var fk = 1 - seg(t, tf + .2, tf + 1.6); glow(g, -52, 18, 120, 'rgba(255,255,255,1)', fk); glow(g, -20, 36, 90, 'rgba(255,255,255,1)', fk); circ(g, -52, 18, 16 * fk); g.fillStyle = '#fff'; g.fill(); }
    g.restore();
    if (t > tf - .05 && t < tf + .4) { g.fillStyle = 'rgba(255,255,255,' + (.6 * (1 - seg(t, tf, tf + .4))) + ')'; g.fillRect(-200, -200, W + 400, H + 400); }
    floorAt(g, 900, '#2b2018');
    var P = poseAt(t, [[s.t0, { lh: [-40, -230], rh: [90, -250], look: [1, 0], mouth: 'flat', brow: 0 }], [tf, { eyes: 'wide', mouth: 'O', brow: 1, lean: -.08, rh: [130, -320], lh: [-90, -300] }, .15], [tf + 1.2, { eyes: 'dot', mouth: 'o', look: [1, -.2], lean: 0, rh: [160, -280] }]]);
    guy(g, 820, 905, 1.25, P, Object.assign({}, CARR, { hold: [null, function (g) { g.rotate(.4); g.fillStyle = '#2b2018'; g.fillRect(-4, -40, 8, 46); }] }), t);
    g.restore();
    sepia(g, .55);
    chip(g, 'SEPTEMBER 1, 1859', 1180, 120, { px: 46, bg: CREAM, s: pop(t, at('hist2', 'september') - .1), rot: -.04, wide: true });
    chip(g, 'RICHARD CARRINGTON', 820, 1010 - 90, { px: 36, bg: YEL, s: pop(t, at('hist2', 'carrington') - .1) * (1 - seg(t, tf + 1.5, tf + 1.8)), wide: true });
    chip(g, 'HAPPENED BEFORE', 1180, 120, { px: 46, bg: RED, fg: '#fff', s: pop(t, at('hist1', 'before') - .1) * (1 - seg(t, t2, t2 + .3)), rot: .03, wide: true });
    vignette(g, .6);
  }
  /* 9 · the next night: northern lights over the Caribbean */
  function sAurora(g, t, s) {
    var te = at('hist3', 'explodes');
    g.save(); cam(g, t, s, .08, 960, 400);
    sky(g, t, '#0b0a24', '#2a2050', { stars: 1 });
    var ak = eio(seg(t, te - .3, te + 1.2));
    aurora(g, t, ak, 300); aurora(g, t + 3, ak * .7, 420, { k: .8 });
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = ak * .25; var rg = g.createLinearGradient(0, 0, 0, 500); rg.addColorStop(0, '#ff4a6a'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(-200, -200, W + 400, 700); g.restore();
    g.fillStyle = '#0f1a33'; g.fillRect(-200, 720, W + 400, 200);
    g.save(); g.globalAlpha = ak * .3; g.globalCompositeOperation = 'lighter'; g.fillStyle = AUR1; g.fillRect(-200, 720, W + 400, 60); g.restore();
    ground(g, 830, '#2a2a3a', '#1a1a28', { amp: 6 });
    palm(g, 200, 860, 1.3, t, '#141020'); palm(g, 1700, 860, 1.1, t + 2, '#141020');
    var P1 = poseAt(t, [[s.t0, { look: [0, -1], mouth: 'flat' }], [te, { rh: [120, -340], look: [.4, -1], mouth: 'O', eyes: 'wide', brow: 1 }]]);
    var P2 = poseAt(t, [[s.t0, { look: [0, -1], mouth: 'flat' }], [te + .3, { lh: [-100, -300], rh: [100, -300], look: [-.2, -1], mouth: 'grin', eyes: 'wide' }]]);
    guy(g, 820, 900, 1.05, P1, Object.assign({}, FARM, { col: '#d6a043', shade: '#b8862f', seed: 12 }), t);
    guy(g, 1100, 900, 1.0, P2, Object.assign({}, OPER, { hat: 'top', seed: 14 }), t);
    g.restore();
    chip(g, 'THE CARIBBEAN, 1859', 960, 150, { px: 50, bg: CREAM, s: pop(t, at('hist3', 'caribbean') - .1), rot: -.03, wide: true });
    vignette(g, .5);
  }
  function telegraphDesk(g, t, haywire, battery) {
    /* wires on the wall */
    g.strokeStyle = '#2b2018'; g.lineWidth = 7; g.beginPath(); g.moveTo(-200, 260); g.lineTo(980, 260); g.quadraticCurveTo(1060, 260, 1060, 340); g.lineTo(1060, 620); g.stroke();
    if (haywire > 0) { g.save(); g.setLineDash([16, 40]); g.lineDashOffset = -t * 700; g.strokeStyle = YEL; g.shadowColor = YEL; g.shadowBlur = 14; g.lineWidth = 5; g.globalAlpha = haywire; g.beginPath(); g.moveTo(-200, 260); g.lineTo(980, 260); g.quadraticCurveTo(1060, 260, 1060, 340); g.lineTo(1060, 620); g.stroke(); g.restore(); }
    /* the desk */
    rr(g, 760, 640, 820, 46, 6); fillStroke(g, '#8a5a32', 6); g.fillStyle = '#6a4224'; g.fillRect(800, 686, 30, 260); g.fillRect(1510, 686, 30, 260);
    /* the key and the sounder */
    var tap = haywire > 0 ? (Math.sin(t * 40) > .2 ? 1 : 0) : 0;
    g.save(); g.translate(1040, 640); rr(g, -70, -24, 140, 24, 4); fillStroke(g, '#5a3a20', 5); g.save(); g.rotate(-.08 + tap * .08); rr(g, -60, -40, 110, 14, 4); fillStroke(g, '#c9a04a', 4); circ(g, 50, -34, 14); fillStroke(g, '#2b2018', 4); g.restore(); g.restore();
    g.save(); g.translate(1300, 640); rr(g, -80, -30, 160, 30, 4); fillStroke(g, '#5a3a20', 5); rr(g, -50, -100, 30, 70, 4); fillStroke(g, '#c9a04a', 4); rr(g, 20, -100, 30, 70, 4); fillStroke(g, '#c9a04a', 4); rr(g, -60, -112 + tap * 8, 120, 14, 3); fillStroke(g, '#8a8a8a', 4); g.restore();
    /* the battery jar */
    if (battery !== false) { g.save(); g.translate(1460, 640); rr(g, -46, -110, 92, 110, 10); fillStroke(g, 'rgba(160,210,190,.7)', 5); g.fillStyle = '#5a6a6a'; g.fillRect(-20, -130, 12, 60); g.fillRect(8, -130, 12, 60); g.restore(); }
  }
  /* 10 · the telegraph goes haywire, sparks, a zapped forehead, unplugged batteries, free electricity */
  function sTele(g, t, s) {
    var tz = at('hist5', 'zapped'), tsp = at('hist5', 'sparks'), tu = at('hist6', 'unplug'), t7 = start('hist7'), hk = seg(t, at('hist4', 'haywire') - .2, at('hist4', 'haywire') + .3);
    g.save(); cam(g, t, s, .08, 1100, 520);
    wall(g, '#5a4a3a', '#3a2e24');
    /* a window full of aurora */
    rr(g, 180, 330, 360, 300, 8); g.fillStyle = '#0b0a24'; g.fill(); g.save(); rr(g, 180, 330, 360, 300, 8); g.clip(); g.translate(0, 0); aurora(g, t, .9, 520); g.restore(); g.lineWidth = 12; g.strokeStyle = '#2b2018'; rr(g, 180, 330, 360, 300, 8); g.stroke();
    floorAt(g, 940, '#2b2018');
    var unplugged = t > tu + .2;
    telegraphDesk(g, t, hk, !unplugged);
    if (unplugged) { g.save(); g.translate(1460 + 120, 900); rr(g, -46, -110, 92, 110, 10); fillStroke(g, 'rgba(160,210,190,.5)', 5); g.restore(); }
    for (var i = 0; i < 4; i++) bolt(g, 1040 + (i - 1.5) * 30, 600, 1000 + (i - 1.5) * 120, 520 - i * 20, t, t > tsp && t < tz + .2 && (t * 6 + i) % 2 < 1 ? 1 : 0, YEL, i);
    var zk = t > tz - .05 && t < tz + .5; if (zk) bolt(g, 1060, 340, 880, 470, t, 1, '#fff6b0', 9);
    /* the message tape keeps coming, powered by the storm */
    if (unplugged) { var tl = (t - tu) * 220; g.save(); g.translate(1300, 540); g.fillStyle = PAPER; g.fillRect(-20, 0, 40, Math.min(tl, 380)); g.fillStyle = INK; for (var d = 0; d < tl && d < 380; d += 34) { if (hash(d) > .5) g.fillRect(-12, d + 6, 24, 8); else { circ(g, 0, d + 10, 6); g.fill(); } } g.restore(); }
    var zapped = t > tz;
    var P = poseAt(t, [[s.t0, { lh: [100, -260], rh: [160, -250], look: [1, .4], mouth: 'flat', front: 1 }], [hk > 0 ? at('hist4', 'haywire') : s.t0 + 99, { look: [1, 0], mouth: 'o', eyes: 'wide' }], [tz, { eyes: 'spiral', mouth: 'wavy', lean: -.12, lh: [-110, -320], rh: [60, -330], jump: 30 }, .1], [tz + .6, { jump: 0, lean: 0 }], [tu - .4, { eyes: 'dot', mouth: 'flat', lh: [180, -250], rh: [210, -240], look: [1, .3], lean: .1 }], [tu + .3, { lh: [260, -150], rh: [220, -200] }], [t7, { lean: 0, lh: [-60, -150], rh: [110, -320], mouth: 'grin', eyes: 'happy', look: [-.4, 0] }]]);
    guy(g, 860, 945, 1.25, P, Object.assign({}, OPER, { hair: zapped ? 'zap' : null, soot: zapped }), t);
    g.restore();
    sepia(g, .45);
    chip(g, "1859's INTERNET", 1240, 160, { px: 48, bg: CREAM, s: pop(t, at('hist4', 'internet') - .1) * (1 - seg(t, start('hist5'), start('hist5') + .3)), rot: -.03, wide: true });
    chip(g, 'WASHINGTON', 760, 200, { px: 44, bg: CREAM, s: pop(t, at('hist5', 'washington') - .1) * (1 - seg(t, start('hist6'), start('hist6') + .3)), rot: .03, wide: true });
    chip(g, 'ZAP', 800, 300, { px: 70, bg: YEL, s: pop(t, tz) * (1 - seg(t, tz + .9, tz + 1.2)), rot: -.1, wide: true });
    chip(g, 'NO BATTERY. STILL WORKS.', 1240, 160, { px: 46, bg: MINT, s: pop(t, at('hist6', 'anyway') - .1) * (1 - seg(t, t7, t7 + .3)), rot: -.02, wide: true });
    chip(g, 'POWERED BY THE STORM', 1240, 250, { px: 40, bg: YEL, s: pop(t, at('hist6', 'storm') - .1) * (1 - seg(t, t7, t7 + .3)), rot: .02, wide: true });
    if (t > t7) quote(g, t, 'hist7', 330, { px: 70, out: 1 - seg(t, s.t1 - .3, s.t1) });
    vignette(g, .55);
  }
  /* small icons for "today, it's everything" */
  function icon(g, kind, x, y, s, k) {
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.scale(s * k, s * k);
    rr(g, -80, -80, 160, 160, 26); fillStroke(g, CREAM, 6);
    g.lineWidth = 6; g.strokeStyle = INK;
    if (kind === 'phone') phone(g, 0, 0, .8, 0);
    else if (kind === 'fridge') { rr(g, -34, -58, 68, 116, 8); fillStroke(g, '#dfe6ee', 5); g.beginPath(); g.moveTo(-34, -14); g.lineTo(34, -14); g.stroke(); g.fillStyle = INK; g.fillRect(20, -46, 6, 22); g.fillRect(20, 0, 6, 30); }
    else if (kind === 'car') { g.beginPath(); g.moveTo(-60, 20); g.lineTo(-50, -10); g.lineTo(-24, -34); g.lineTo(24, -34); g.lineTo(48, -10); g.lineTo(62, 20); g.closePath(); fillStroke(g, RED, 5); circ(g, -32, 24, 15); fillStroke(g, INK, 0); circ(g, 32, 24, 15); fillStroke(g, INK, 0); }
    else if (kind === 'hospital') { g.fillStyle = RED; g.fillRect(-16, -54, 32, 108); g.fillRect(-54, -16, 108, 32); }
    else if (kind === 'bulb') { circ(g, 0, -12, 36); fillStroke(g, YEL, 5); rr(g, -18, 22, 36, 30, 4); fillStroke(g, '#9a9aa6', 5); }
    else if (kind === 'laptop') { rr(g, -50, -44, 100, 64, 6); fillStroke(g, '#3d64b8', 5); rr(g, -64, 22, 128, 14, 4); fillStroke(g, '#9a9aa6', 5); }
    else if (kind === 'traffic') { rr(g, -26, -60, 52, 120, 10); fillStroke(g, '#2a2638', 5); [[RED, -34], [YEL, 0], [MINT, 34]].forEach(function (c) { circ(g, 0, c[1], 13); g.fillStyle = c[0]; g.fill(); }); }
    else if (kind === 'server') { for (var i = 0; i < 3; i++) { rr(g, -50, -54 + i * 38, 100, 30, 4); fillStroke(g, '#2a2638', 4); circ(g, 34, -39 + i * 38, 5); g.fillStyle = MINT; g.fill(); } }
    else if (kind === 'water') { g.beginPath(); g.moveTo(0, -56); g.quadraticCurveTo(46, 6, 30, 30); g.quadraticCurveTo(0, 64, -30, 30); g.quadraticCurveTo(-46, 6, 0, -56); fillStroke(g, '#4ab0ff', 5); }
    else if (kind === 'plane') { g.beginPath(); g.moveTo(-60, 4); g.lineTo(50, -6); g.quadraticCurveTo(66, 0, 50, 6); g.lineTo(-60, 4); g.closePath(); fillStroke(g, '#dfe6ee', 5); g.beginPath(); g.moveTo(0, 0); g.lineTo(-20, -44); g.lineTo(-6, -44); g.lineTo(20, 0); g.moveTo(0, 2); g.lineTo(-20, 44); g.lineTo(-6, 44); g.lineTo(20, 2); fillStroke(g, '#dfe6ee', 4); }
    else if (kind === 'atm') { rr(g, -44, -56, 88, 112, 6); fillStroke(g, '#3a9a6a', 5); rr(g, -30, -42, 60, 36, 4); fillStroke(g, LIGHT, 4); g.fillStyle = INK; g.fillRect(-26, 20, 52, 8); }
    else if (kind === 'tv') { rr(g, -60, -40, 120, 76, 6); fillStroke(g, '#2a2638', 5); rr(g, -50, -30, 100, 56, 4); g.fillStyle = '#9ee6ff'; g.fill(); }
    else if (kind === 'telegraph') { rr(g, -50, 10, 100, 20, 4); fillStroke(g, '#5a3a20', 4); rr(g, -40, -6, 80, 12, 3); fillStroke(g, '#c9a04a', 4); circ(g, 34, -10, 10); fillStroke(g, '#2b2018', 3); }
    /* the plug */
    g.fillStyle = INK; g.fillRect(56, 60, 34, 20); g.fillRect(84, 56, 14, 6); g.fillRect(84, 74, 14, 6);
    g.restore();
  }
  /* 11 · split: 1859 had one thing plugged in. Today, everything. */
  function sThenNow(g, t, s) {
    var t9 = start('hist9'), tev = at('hist9', 'everything'), split = lerp(W / 2, 520, eio(seg(t, t9 - .2, t9 + .5)));
    g.save(); cam(g, t, s, .04);
    /* left: 1859 */
    g.save(); g.beginPath(); g.rect(-200, -200, split + 200, H + 400); g.clip();
    wall(g, '#6a5440', '#3a2e24'); icon(g, 'telegraph', split / 2, 520, 1.6, pop(t, at('hist8', '1859') - .1));
    txt(g, '1859', split / 2, 210, 96, PAPER, { wt: 900, wide: true, outline: 12 });
    sepia(g, .4);
    g.restore();
    /* right: today */
    g.save(); g.beginPath(); g.rect(split, -200, W + 400, H + 400); g.clip();
    wall(g, '#2f2752', '#1f1a38');
    txt(g, 'TODAY', split + (W - split) / 2, 150, 96, YEL, { wt: 900, wide: true, outline: 12 });
    var kinds = ['phone', 'hospital', 'fridge', 'car', 'server', 'bulb', 'laptop', 'traffic', 'water', 'plane', 'atm', 'tv'];
    kinds.forEach(function (kd, i) {
      var c = i % 4, r = Math.floor(i / 4), x = split + (W - split) * (.16 + c * .225), y = 360 + r * 230;
      var tk = i < 2 ? at('hist8', 'advanced') + i * .2 : t9 - .3 + (i - 2) * ((tev - t9 + .3) / 10);
      icon(g, kd, x, y + Math.sin(t * 2 + i) * 6, lerp(.95, .9, seg(t, t9, t9 + .5)), pop(t, tk, 3.4, .6));
    });
    g.restore();
    g.fillStyle = INK; g.fillRect(split - 9, -200, 18, H + 400); g.fillStyle = YEL; g.fillRect(split - 3, -200, 6, H + 400);
    g.restore();
    if (t > t9) quote(g, t, 'hist9', 1000 - 140, { px: 76 });
    vignette(g, .4);
  }
