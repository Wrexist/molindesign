  /* =================================================================== scenes · cold open */
  function dinerTable(g) { rr(g, 520, 690, 880, 54, 14); fillStroke(g, '#e8e2d2', 7); g.fillStyle = '#b9b2a2'; g.fillRect(940, 744, 40, 170); g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(940, 744, 40, 170); }
  function typed(s, t, t0, t1) { var n = Math.floor(clamp(seg(t, t0, t1), 0, 1) * s.length); return s.slice(0, n); }

  /* 1 · type one question tonight */
  function sPrompt(g, t, s) {
    var tT = at('o1', 'type'), tE = at('o1', 'tonight'), t2 = start('o2');
    g.save(); cam(g, t, s, .12, 980, 420);
    wall(g, '#241d3d', '#16122a'); grid(g, 90);
    /* desk lamp glow and window */
    rr(g, 1360, 120, 400, 300, 14); fillStroke(g, '#101a36', 7); for (var i = 0; i < 30; i++) { circ(g, 1380 + hash(i) * 360, 140 + hash(i + 2) * 260, 2); g.fillStyle = 'rgba(255,250,230,.6)'; g.fill(); } circ(g, 1660, 190, 34); g.fillStyle = '#f6efd8'; g.fill();
    floorAt(g, 880, '#2e2647');
    rr(g, 260, 760, 1400, 40, 10); fillStroke(g, '#8a5a3c', 6);
    monitor(g, 960, 470, 760, 430, function (g, w, h) {
      g.fillStyle = '#f4f1ea'; g.fillRect(-w / 2, -h / 2, w, h);
      g.fillStyle = '#e4dfd3'; g.fillRect(-w / 2, -h / 2, w, 56); txt(g, 'ChatGPT', -w / 2 + 110, -h / 2 + 28, 30, INK, { wt: 800 });
      rr(g, -w / 2 + 50, h / 2 - 110, w - 100, 70, 35); fillStroke(g, '#fff', 4);
      var q = typed('How do computers think so fast?', t, tT + .1, tE + .1);
      g.textAlign = 'left'; font(g, 30, 600); g.fillStyle = INK; g.fillText(q + ((t * 2 % 1) < .5 && t < t2 ? '|' : ''), -w / 2 + 84, h / 2 - 74);
      if (t > tE + .3) { var k = seg(t, tE + .3, t2 + .5); rr(g, w / 2 - 480, -h / 2 + 90 - k * 40, 420, 64, 22); fillStroke(g, '#dfe9ff', 3); g.fillStyle = INK; g.fillText('How do computers think so fast?', w / 2 - 460, -h / 2 + 124 - k * 40); }
    });
    var P = poseAt(t, [[s.t0, { lh: [-40, -170], rh: [70, -170], look: [.3, -.5], mouth: 'smile', lean: .05, front: 1 }], [tT, { lh: [-20, -180], rh: [60, -186] }], [tE, { rh: [80, -200], mouth: 'grin', eyes: 'happy' }], [t2, { look: [.2, -.8], eyes: 'wide', mouth: 'o' }]]);
    guy(g, 600, 1040, 1.15, P, YOU, t);
    g.restore();
    /* the question flies into the screen as a glowing packet */
    var pk = seg(t, t2 - .1, t2 + .9);
    if (pk > 0 && pk < 1) { var px2 = lerp(1150, 960, eio(pk)), py2 = lerp(300, 470, eio(pk)), sz = lerp(1, .05, eio(pk)); g.save(); g.translate(px2, py2); g.scale(sz, sz); glow(g, 0, 0, 200, 'rgba(182,240,90,.8)', 1); chip(g, 'YOUR QUESTION', 0, 0, { px: 46, bg: NVL }); g.restore(); }
    chip(g, 'TONIGHT', 420, 170, { px: 52, bg: YEL, s: pop(t, tE - .1), rot: -.04, wide: true });
    vignette(g, .4);
  }
  /* 2 · a building full of chips, all doing math at once */
  function sHall(g, t, s) {
    var tB = at('o2', 'building'), tC = at('o2', 'chips'), tM = at('o2', 'math'), tS = at('o2', 'same');
    g.save(); cam(g, t, s, .16, 960, 520);
    wall(g, '#0e1020', '#05060c');
    /* rows of racks in one-point perspective */
    var vx = 960, vy = 470;
    g.fillStyle = '#14182a'; g.beginPath(); g.moveTo(-200, H + 200); g.lineTo(vx - 40, vy + 40); g.lineTo(vx + 40, vy + 40); g.lineTo(W + 200, H + 200); g.closePath(); g.fill();
    for (var side = -1; side <= 1; side += 2) for (var d = 9; d >= 0; d--) {
      var z = 1 / (1 + d * .55), x = vx + side * (180 + 820 * z) - (side > 0 ? 0 : 160 * z), y = vy - 360 * z, w = 160 * z, h = 760 * z;
      var on = pop(t, tB - .3 + (9 - d) * .07, 3, .7); if (on <= 0) continue;
      g.save(); g.globalAlpha = clamp(on, 0, 1); rack(g, x, y + (1 - clamp(on, 0, 1)) * 40, w, h, t + d, { seed: d * 3 + side }); g.restore();
    }
    /* the math: little sums lifting off every rack */
    if (t > tM - .2) {
      var r = mulberry(5);
      for (var i = 0; i < 70; i++) { var ph = (t * .5 + r()) % 1, sx = 200 + r() * 1520, sy = 900 - ph * 700, sym = ['+', '×', '2+3', '7×8', '=', '0.4×1.7', '+1'][i % 7]; g.save(); g.globalAlpha = Math.sin(ph * Math.PI) * clamp(seg(t, tM - .2, tM + .5), 0, 1) * .9; txt(g, sym, sx, sy, 26 + r() * 20, NVL, { fam: MONO, wt: 700 }); g.restore(); }
    }
    g.restore();
    chip(g, 'A BUILDING FULL OF CHIPS', 960, 150, { px: 56, bg: CREAM, s: pop(t, tC - .2), rot: -.02, wide: true });
    chip(g, 'ALL AT THE SAME TIME', 960, 900, { px: 48, bg: NVL, s: pop(t, tS - .15), rot: .02, wide: true });
    flash(g, t, s.t0, .35);
    vignette(g, .5);
  }
  /* 3 · most AI chips come from one company, one that started in a Denny's making game chips */
  function sOne(g, t, s) {
    var tO = at('o3', 'one'), tD = at('o4', "denny's"), tV = at('o4', 'video'), t4 = start('o4');
    g.save(); cam(g, t, s, .06);
    wall(g, '#1c2a14', '#0f170a'); grid(g, 120, 'rgba(182,240,90,.05)');
    var sh = eio(seg(t, t4 - .2, t4 + .6));
    for (var i = 0; i < 24; i++) {
      var c = i % 6, r = Math.floor(i / 6), k = pop(t, s.t0 + .1 + (c + r) * .06, 3, .7);
      var x = lerp(330 + c * 252, 160 + c * 120, sh), y = lerp(240 + r * 210, 330 + r * 130, sh), sc = lerp(.72, .42, sh) * clamp(k, 0, 1.05);
      if (sc > 0) chipD(g, x, y + Math.sin(t * 2 + i) * 4, sc, t, { face: t > tO ? 'grin' : 'dot', seed: i * .37, glow: t > tO ? .4 : 0 });
    }
    /* the origin, pinned up: a diner and a video game */
    var pk = pop(t, tD - .25, 2.8, .6);
    card(g, 1080, 520, 420, 480, -.04, clamp(pk, 0, 1), function (g, w, h) { g.fillStyle = '#f0d9b0'; g.fillRect(-w / 2 + 20, -h / 2 + 20, w - 40, h - 140); rr(g, -150, -140, 300, 80, 14); fillStroke(g, '#ffd23d', 5); txt(g, "DENNY'S", 0, -98, 50, RED, { wt: 900, wide: true }); mug(g, -80, 60, 1.2, t, true); plate(g, 70, 70, 1); txt(g, '1993', 0, h / 2 - 60, 50, INK, { wt: 900, wide: true }); });
    var vk = pop(t, tV - .25, 2.8, .6);
    card(g, 1560, 560, 420, 480, .05, clamp(vk, 0, 1), function (g, w, h) {
      g.fillStyle = '#10142a'; g.fillRect(-w / 2 + 20, -h / 2 + 20, w - 40, h - 140);
      g.save(); g.translate(0, -40); g.rotate(Math.sin(t * 2) * .2); g.beginPath(); g.moveTo(0, -80); g.lineTo(60, 60); g.lineTo(0, 30); g.lineTo(-60, 60); g.closePath(); fillStroke(g, NVL, 5); g.restore();
      for (var j = 0; j < 12; j++) { circ(g, -170 + hash(j) * 340, -200 + ((hash(j + 3) * 400 + t * 120) % 340), 3); g.fillStyle = '#fff'; g.fill(); }
      txt(g, 'VIDEO GAMES', 0, h / 2 - 60, 46, INK, { wt: 900, wide: true });
    });
    tape(g, 1080, 290, -.2); tape(g, 1560, 330, .2);
    g.restore();
    chip(g, 'ONE COMPANY', 960, 120, { px: 64, bg: NVL, s: pop(t, tO - .15) * (1 - sh * .0), rot: -.03, wide: true });
    vignette(g, .45);
  }
  /* 4 · the thesis, built from paper: not an AI company … a gaming company whose math is AI's math */
  function sThesis(g, t, s) {
    var t6 = start('o6');
    g.save(); cam(g, t, s, .05);
    wall(g, '#2f2752', '#1f1a38'); grid(g, 80);
    var out = eio(seg(t, t6 - .4, t6 + .2));
    g.save(); g.translate(0, -out * 700); g.rotate(-out * .08);
    quote(g, t, 'o5', 470, { px: 78, maxw: 1500 });
    if (t > end('o5') - .2) { var ck = seg(t, end('o5') - .2, end('o5') + .15); g.save(); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 34; g.beginPath(); g.moveTo(240, 600); g.lineTo(lerp(240, 1680, ck), lerp(600, 340, ck)); g.stroke(); g.strokeStyle = RED; g.lineWidth = 20; g.stroke(); g.restore(); }
    g.restore();
    if (t > t6 - .2) quote(g, t, 'o6', 520, { px: 82, maxw: 1550, hot: /gaming|math|ai/i });
    g.restore();
    vignette(g, .45);
  }
  /* 5 · the scale: mind blown, $42M in 1999, less than an hour today, $5 trillion */
  function sScale(g, t, s) {
    var t8 = start('o8'), t9 = start('o9'), t10 = start('o10'), tH = at('o9', 'hour'), tT = at('o10', 'trillion'), tE = at('o10', 'earth');
    g.save(); cam(g, t, s, .05);
    wall(g, '#20304a', '#141e30'); grid(g, 100);
    /* 7: your brain */
    var bk = 1 - eio(seg(t, t8 - .3, t8 + .2));
    if (bk > 0) {
      g.save(); g.globalAlpha = bk;
      var P = poseAt(t, [[s.t0, { eyes: 'wide', mouth: 'O', lh: [-120, -260], rh: [120, -260], brow: 1 }], [at('o7', 'breaks'), { eyes: 'spiral', mouth: 'wavy', tilt: .1 }]]);
      guy(g, 960, 1000, 1.4, P, YOU, t);
      if (t > at('o7', 'breaks')) for (var i = 0; i < 8; i++) { var a = -Math.PI / 2 + (i - 3.5) * .3, kk = seg(t, at('o7', 'breaks'), at('o7', 'breaks') + .6), d = 160 + eo(kk) * 200; puff(g, 960 + Math.cos(a) * d, 330 + Math.sin(a) * d, .35 + hash(i) * .2, 'rgba(255,255,255,' + (1 - kk * .6) + ')'); }
      g.restore();
    }
    /* three panels, left to right */
    var p1 = pop(t, t8 - .1, 2.8, .65), p2 = pop(t, t9 - .1, 2.8, .65), p3 = pop(t, t10 - .1, 2.8, .65);
    card(g, 360, 520, 500, 620, -.03, clamp(p1, 0, 1), function (g) { calendar(g, 0, -150, .55, 'IPO', '1999', { px: 120 }); cash(g, 0, 90, .9, 3); txt(g, '$42 MILLION', 0, 230, 56, INK, { wt: 900, wide: true }); });
    card(g, 960, 520, 500, 620, .02, clamp(p2, 0, 1), function (g) { stopwatch(g, 0, -110, 150, seg(t, t9 + .2, tH + .2) * .92); txt(g, 'TODAY:', 0, 140, 40, INK, { fam: MONO, wt: 700 }); txt(g, '< 1 HOUR', 0, 214, 70, RED, { wt: 900, wide: true }); });
    card(g, 1560, 520, 500, 620, -.02, clamp(p3, 0, 1), function (g) {
      g.save(); g.translate(0, -80); rr(g, -90, 60, 180, 120, 8); fillStroke(g, '#c9a24a', 6); txt(g, '1', 0, 118, 80, INK, { wt: 900 }); g.beginPath(); g.moveTo(-110, -140); g.lineTo(110, -140); g.quadraticCurveTo(100, 40, 0, 50); g.quadraticCurveTo(-100, 40, -110, -140); g.closePath(); fillStroke(g, '#ffd23d', 6); g.restore();
      txt(g, '$5 TRILLION', 0, 190, 62, INK, { wt: 900, wide: true }); txt(g, '#1 ON EARTH', 0, 252, 40, NVD, { wt: 900, wide: true });
    });
    if (t > tT) for (i = 0; i < 3; i++) spark(g, 1560 + (i - 1) * 160, 300, t, tT + i * .08, .7);
    g.restore();
    vignette(g, .45);
  }
  /* 6 · the man who runs it once cleaned toilets */
  function sToilets(g, t, s) {
    var tT = at('o11', 'toilets'), tK = at('o11', 'kids');
    g.save(); cam(g, t, s, .08, 960, 600);
    wall(g, '#cfe6e8', '#a9cdd2');
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 3; for (var x = -200; x < W + 200; x += 90) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 860); g.stroke(); } for (var y = 0; y < 860; y += 90) { g.beginPath(); g.moveTo(-200, y); g.lineTo(W + 200, y); g.stroke(); }
    floorAt(g, 860, '#8fb3b9');
    toilet(g, 1240, 900, 1.5); toilet(g, 1640, 900, 1.2);
    var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [90, -190], mouth: 'smile', look: [.5, 0] }], [tT - .2, { rh: [140, -140], lean: .2, mouth: 'flat', look: [.8, .4] }], [tT + .5, { rh: [150, -120], lean: .24 }]]);
    var scrub = t > tT - .2 ? Math.sin(t * 14) * 18 : 0; P.rh = [P.rh[0] + scrub, P.rh[1]];
    guy(g, 860, 920, 1.35, P, Object.assign({}, JEN, { hold: [null, brush] }), t);
    if (t > tT) for (var i = 0; i < 4; i++) { var ph = (t * 1.3 + i * .25) % 1; g.save(); g.globalAlpha = 1 - ph; g.translate(1180 + i * 40, 720 - ph * 120); g.rotate(ph * 3); g.beginPath(); for (var k = 0; k < 8; k++) { var a = k / 8 * 6.283, r = k % 2 ? 6 : 16; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = '#fff'; g.fill(); g.restore(); }
    g.restore();
    chip(g, "NVIDIA'S BOSS", 560, 260, { px: 50, bg: CREAM, s: pop(t, s.t0 + .2), rot: -.04, wide: true });
    chip(g, 'ONCE CLEANED TOILETS', 1240, 170, { px: 56, bg: YEL, s: pop(t, tT - .15), rot: .03, wide: true });
    chip(g, 'AT A SCHOOL FOR TROUBLED KIDS', 960, 320, { px: 40, bg: CREAM, s: pop(t, tK - .4), rot: -.01 });
    vignette(g, .35);
  }
  /* 7 · what should be impossible: a graveyard of chip startups, a first chip that flopped, the king 3dfx */
  function sGrave(g, t, s) {
    var t13 = start('o13'), t14 = start('o14'), t15 = start('o15'), tF = at('o14', 'flopped'), tW = at('o14', 'weeks'), tK = at('o15', 'king'), tB = at('o15', 'buying');
    g.save(); cam(g, t, s, .06);
    sky(g, t, '#2b2350', '#4a3a6a', { stars: .6 });
    ground(g, 830, '#3b4a3a', '#2a3529', { amp: 12 });
    chip(g, 'WHAT SHOULD BE IMPOSSIBLE', 960, 130, { px: 60, bg: YEL, s: pop(t, s.t0 + .1), rot: -.03, wide: true });
    /* dozens of graphics-chip startups */
    var r = mulberry(9);
    for (var i = 0; i < 18; i++) {
      var x = 120 + (i % 9) * 210 + (r() - .5) * 40, y = 760 + Math.floor(i / 9) * 110 + r() * 20, k = pop(t, t13 + i * .09, 3, .6), sc = .7 + r() * .25;
      if (k <= 0) continue;
      g.save(); g.translate(x, y); g.scale(sc * clamp(k, 0, 1.05), sc * clamp(k, 0, 1.05)); g.rotate((r() - .5) * .12);
      g.beginPath(); g.moveTo(-60, 0); g.lineTo(-60, -120); g.arc(0, -120, 60, Math.PI, 0); g.lineTo(60, 0); g.closePath(); fillStroke(g, '#9a95a8', 5);
      txt(g, 'GPU CO.', 0, -110, 24, INK, { fam: MONO, wt: 700 }); txt(g, '199' + (i % 9), 0, -70, 24, INK, { fam: MONO, wt: 700 }); g.restore();
    }
    /* the first chip flops; the money drains */
    var fk = pop(t, t14 - .1, 2.8, .65);
    if (fk > 0 && t < t15) {
      g.save(); g.globalAlpha = 1 - seg(t, t15 - .3, t15); chipD(g, 660, 470, .9 * clamp(fk, 0, 1), t, { face: t > tF ? 'x' : 'dot', label: 'NV1' }); g.restore();
      var bal = 1 - seg(t, tW - .6, tW + .8) * .93; g.save(); g.globalAlpha = 1 - seg(t, t15 - .3, t15);
      rr(g, 1050, 360, 600, 90, 20); fillStroke(g, '#1a1528', 6); rr(g, 1060, 370, 580 * bal, 70, 14); g.fillStyle = bal < .2 ? RED : NV; g.fill(); txt(g, 'CASH LEFT', 1350, 300, 40, CREAM, { fam: MONO, wt: 700, outline: 7 });
      if (t > tW) txt(g, 'WEEKS FROM BROKE', 1350, 540, 54, RED, { wt: 900, wide: true, outline: 10 }); g.restore();
    }
    /* the king of graphics: 3dfx, crown and all; Nvidia ends up carrying the crown */
    if (t > t15 - .3) {
      var kk = pop(t, t15 - .1, 2.6, .6), bk = seg(t, tB - .2, tB + .7);
      chipD(g, 760, 520, .85 * clamp(kk, 0, 1), t, { label: '3DFX', die: '#c9a24a', die2: '#f2d27a', face: t > tB ? 'sad' : 'grin', rot: bk * .5 });
      var cx = lerp(760, 1260, eio(bk)), cy = lerp(380, 380, bk) - Math.sin(bk * Math.PI) * 200;
      g.save(); g.translate(cx, cy); g.rotate(bk * 6.283 * .5 + Math.sin(t * 2) * .05); g.beginPath(); g.moveTo(-70, 40); g.lineTo(-80, -30); g.lineTo(-40, 0); g.lineTo(0, -50); g.lineTo(40, 0); g.lineTo(80, -30); g.lineTo(70, 40); g.closePath(); fillStroke(g, '#ffd23d', 6); g.restore();
      if (t > tB) { chipD(g, 1260, 560, .85, t, { face: 'grin', glow: .5, label: 'NVIDIA' }); stamp(g, 'BOUGHT', 760, 660, t, tB + .2, { px: 54 }); }
      chip(g, 'THE KING: 3DFX', 760, 290 - (t > tB ? 0 : 0), { px: 46, bg: CREAM, s: pop(t, tK - .1) * (1 - bk * 0), rot: -.03 });
    }
    g.restore();
    vignette(g, .45);
  }
  /* 8 · three questions */
  function sAsk(g, t, s) {
    g.save(); cam(g, t, s, .05);
    wall(g, '#2f2752', '#1f1a38'); grid(g, 80);
    var qs = [['o16', 'games', 'HOW DID A GAME CHIP', 'END UP RUNNING AI?', 420, -.06, NVL], ['o17', 'hate', 'WHY DID WALL STREET', 'HATE THE BET?', 960, .03, RED], ['o18', 'knock', 'CAN ANYTHING', 'KNOCK IT OFF?', 1500, -.03, LIGHT]];
    qs.forEach(function (q, i) {
      var k = pop(t, start(q[0]) - .2, 3, .6); if (k <= 0) return;
      var y = 520 + (i === 1 ? -30 : 20) + (1 - clamp(k, 0, 1)) * 200;
      card(g, q[4], y, 480, 400, q[5] + knock(t, at(q[0], q[1]) - .1, 18, 6) * .05, clamp(k, 0, 1), function (g) {
        g.fillStyle = q[6]; g.fillRect(-240, -200, 480, 74); txt(g, 'Q' + (i + 1), 0, -162, 46, INK, { wt: 900, wide: true });
        txt(g, q[2], 0, -10, 30, INK, { wt: 900, wide: true }); txt(g, q[3], 0, 50, 30, INK, { wt: 900, wide: true });
        if (i === 0) { gpuCard(g, 0, 140, .3, t, {}); } else if (i === 1) { chart(g, -110, 110, 220, 70, [[0, .9], [.3, .7], [.6, .5], [1, .05]], 1, { bare: true, col: RED, lw: 8 }); } else { chipD(g, 0, 140, .32, t, { face: 'o' }); }
      });
      tape(g, q[4], y - 196, (i - 1) * .2);
    });
    g.restore();
    vignette(g, .45);
  }
  /* 9 · the teaser board: a booth, a toilet paper company, a rescue from Sega, two cards at a student's house */
  function sTease(g, t, s) {
    var picks = [['o19', 'booth', 300, 380, -.06], ['o19', 'toilet', 760, 330, .05], ['o19', 'sega', 1200, 390, -.04], ['o20', 'cards', 1640, 350, .06]];
    g.save(); cam(g, t, s, .08, 1100, 500);
    wall(g, '#7a5a3a', '#5a4028');
    g.fillStyle = 'rgba(0,0,0,.12)'; for (var i = 0; i < 60; i++) { circ(g, hash(i) * W, hash(i + 9) * H, 3 + hash(i + 2) * 5); g.fill(); }
    /* red string between the pins, drawn as they arrive */
    g.strokeStyle = RED; g.lineWidth = 4;
    for (i = 1; i < picks.length; i++) { var a = picks[i - 1], b = picks[i], k = seg(t, at(b[0], b[1]) - .1, at(b[0], b[1]) + .4); if (k <= 0) continue; g.beginPath(); g.moveTo(a[2], a[3] - 190); g.quadraticCurveTo((a[2] + b[2]) / 2, a[3] - 120, lerp(a[2], b[2], k), lerp(a[3] - 190, b[3] - 190, k)); g.stroke(); }
    picks.forEach(function (p, i) {
      var k = pop(t, at(p[0], p[1]) - .2, 3, .6); if (k <= 0) return;
      card(g, p[2], p[3] + (1 - clamp(k, 0, 1)) * -80, 380, 420, p[4], clamp(k, 0, 1), function (g, w, h) {
        g.fillStyle = ['#f0d9b0', '#dfeef0', '#1d2f8a', '#1a1f33'][i]; g.fillRect(-w / 2 + 20, -h / 2 + 20, w - 40, h - 120);
        if (i === 0) { rr(g, -130, -130, 260, 150, 30); fillStroke(g, '#c0392b', 5); mug(g, -40, 40, 1, t, true); mug(g, 60, 40, 1, t, true); }
        else if (i === 1) tpRoll(g, 0, -30, .9, t, 'smug');
        else if (i === 2) { rr(g, -120, -90, 240, 110, 40); fillStroke(g, '#2b2b35', 5); circ(g, -60, -36, 22); fillStroke(g, '#5a5866', 4); [[50, -50, RED], [80, -24, YEL], [50, 0, NV], [20, -24, BLUE]].forEach(function (bt) { circ(g, bt[0], bt[1], 12); fillStroke(g, bt[2], 3); }); txt(g, '$5,000,000', 0, 80, 40, CREAM, { wt: 900, wide: true }); }
        else { house(g, 0, 40, .9, 1); gpuCard(g, -60, -110, .22, t, {}); gpuCard(g, 70, -110, .22, t, {}); }
        txt(g, ['THE BOOTH', 'THE NAME', 'THE RESCUE', 'TWO CARDS'][i], 0, h / 2 - 52, 44, INK, { wt: 900, wide: true });
      });
      circ(g, p[2], p[3] - 190, 14); fillStroke(g, RED, 4);
    });
    g.restore();
    vignette(g, .45);
  }
  /* 10 · the title */
  function sTitle(g, t, s) {
    g.save(); cam(g, t, s, .06);
    wall(g, '#132108', '#070c03'); grid(g, 120, 'rgba(182,240,90,.06)');
    chipD(g, 1500, 760, 1.1, t, { face: 'grin', glow: .9, label: 'GPU' });
    var P = poseAt(t, [[s.t0, { lh: [-80, -160], rh: [100, -250], look: [.6, -.2], mouth: 'smirk' }]]);
    guy(g, 380, 1040, 1.2, P, JEN, t);
    g.restore();
    var L = [['THE', 'WHOLE', 'HISTORY'], ['OF', 'NVIDIA']];
    L.forEach(function (ws, ri) {
      var px = ri ? 190 : 120; font(g, px, 900, DISP, true);
      var sp2 = px * .3, wd = ws.map(function (w) { return g.measureText(w).width; }), tw = wd.reduce(function (a, b) { return a + b; }, 0) + sp2 * (ws.length - 1), x = W / 2 - tw / 2 - 60, y = 290 + ri * 210;
      ws.forEach(function (w, i) {
        var k = pop(t, at('title', w.toLowerCase()) - .06, 3.2, .6);
        if (k > 0) { g.save(); g.translate(x + wd[i] / 2, y); g.scale(k, k); g.rotate((hash(i + ri * 5) - .5) * .06); if (w === 'NVIDIA') { rr(g, -wd[i] / 2 - 30, -px * .6, wd[i] + 60, px * 1.15, 22); fillStroke(g, NV, 10); } txt(g, w, 0, 6, px, w === 'NVIDIA' ? '#fff' : CREAM, { wt: 900, wide: true, outline: 18, ocol: INK }); g.restore(); }
        x += wd[i] + sp2;
      });
    });
    vignette(g, .45);
  }

  /* =================================================================== part 1 · the booth */
  /* 11 · 1973: a nine-year-old flies from Taiwan to America */
  function sPlane(g, t, s) {
    var k = eio(seg(t, s.t0 + .3, end('b1') + .2));
    g.save(); cam(g, t, s, .05);
    space(g, t, t * 10, 0, { a: '#0d1530', b: '#1b2550' });
    var lon = lerp(125, -95, k);
    var P = earth(g, 960, 1260, 820, t, { lon: lon, lat: 30, light: 1, lights: false });
    /* the flight path: Taipei to Seattle, drawn on the globe */
    var pts = []; for (var i = 0; i <= 30; i++) { var u = i / 30; pts.push(P(lerp(121.5, -122.3, u), lerp(25, 47.6, u) + Math.sin(u * Math.PI) * 14)); }
    g.save(); g.setLineDash([16, 14]); g.strokeStyle = CREAM; g.lineWidth = 6; g.beginPath(); var first = true; pts.forEach(function (p, j) { if (p[2] <= 0 || j / 30 > k + .02) return; if (first) { g.moveTo(p[0], p[1]); first = false; } else g.lineTo(p[0], p[1]); }); g.stroke(); g.restore();
    var head = pts[Math.min(30, Math.round(k * 30))];
    /* the plane, with a small face at the window */
    g.save(); g.translate(head[0], head[1] - 60); g.rotate(-.06 + Math.sin(t * 2) * .03); g.scale(1.2, 1.2);
    g.beginPath(); g.ellipse(0, 0, 130, 30, 0, 0, 6.283); fillStroke(g, CREAM, 6); g.beginPath(); g.moveTo(-20, 0); g.lineTo(-70, 80); g.lineTo(-30, 80); g.lineTo(30, 0); g.closePath(); fillStroke(g, '#d8cfbd', 5); g.beginPath(); g.moveTo(-100, -10); g.lineTo(-130, -60); g.lineTo(-104, -60); g.lineTo(-70, -10); g.closePath(); fillStroke(g, RED, 5);
    for (i = 0; i < 5; i++) { circ(g, -40 + i * 30, -4, 9); fillStroke(g, i === 2 ? '#fbf7ef' : '#9ed4f5', 3); }
    g.fillStyle = INK; circ(g, 17, -6, 2.4); g.fill(); circ(g, 23, -6, 2.4); g.fill();
    g.restore();
    chip(g, 'TAIWAN', P(121, 24)[0], P(121, 24)[1] + 70, { px: 40, bg: CREAM, s: pop(t, s.t0 + .3) * (P(121, 24)[2] > 0 ? 1 : 0) });
    var us = P(-100, 40); if (us[2] > 0) chip(g, 'AMERICA', us[0], us[1] + 80, { px: 40, bg: CREAM, s: pop(t, at('b1', 'america') - .2) });
    g.restore();
    chip(g, 'JENSEN HUANG, AGE 9', 960, 160, { px: 54, bg: YEL, s: pop(t, at('b1', 'jensen') - .15), rot: -.03, wide: true });
    dateTag(g, '1973', t, at('b1', '1973') - .1);
    vignette(g, .4);
  }
  /* 12 · a "fancy boarding school" in Kentucky; actually a school for troubled kids; the toilets, every day */
  function sSchool(g, t, s) {
    var tF = at('b2', 'fancy'), tA = at('b3', 'actually'), tT = at('b3', 'toilets'), tE = at('b3', 'every');
    g.save(); cam(g, t, s, .06);
    var real = t > tA - .1;
    sky(g, t, real ? '#8a9aa8' : '#7cc4f2', real ? '#c4c9cc' : '#fbe3b8', { clouds: real ? 'rgba(220,224,228,.9)' : 'rgba(255,255,255,.85)' });
    ground(g, 830, real ? '#7d8a6a' : '#6fbf5a', real ? '#64705a' : '#4f9a42');
    if (!real) {
      var bk = pop(t, tF - .2, 2.6, .6);
      g.save(); g.translate(1300, 820); g.scale(clamp(bk, 0, 1.05), clamp(bk, 0, 1.05));
      [-260, 260].forEach(function (x) { rr(g, x - 70, -460, 140, 460, 6); fillStroke(g, '#e8d8b8', 6); g.beginPath(); g.moveTo(x - 90, -460); g.lineTo(x, -580); g.lineTo(x + 90, -460); g.closePath(); fillStroke(g, '#3d64b8', 6); });
      rr(g, -200, -360, 400, 360, 6); fillStroke(g, '#f2e6cc', 6); for (var i = 0; i < 6; i++) { rr(g, -160 + (i % 3) * 120, -320 + Math.floor(i / 3) * 140, 70, 90, 30); fillStroke(g, '#9ed4f5', 4); }
      g.beginPath(); g.moveTo(0, -560); g.lineTo(0, -680); g.lineTo(90, -650); g.lineTo(0, -620); g.strokeStyle = INK; g.lineWidth = 6; g.stroke(); g.fillStyle = RED; g.fill();
      g.restore();
      for (i = 0; i < 4; i++) spark(g, 1100 + i * 140, 300 + (i % 2) * 80, t, tF + i * .1, .5);
      chip(g, '“A FANCY BOARDING SCHOOL”', 1300, 170, { px: 50, bg: CREAM, s: bk, rot: -.03 });
    } else {
      /* the real thing: a plain dorm, a row of toilets, a tally of days */
      rr(g, 960, 420, 860, 420, 6); fillStroke(g, '#b9ada0', 6); for (i = 0; i < 8; i++) { rr(g, 1000 + (i % 4) * 200, 460 + Math.floor(i / 4) * 170, 120, 110, 4); fillStroke(g, '#7a8a96', 4); g.strokeStyle = INK; g.lineWidth = 3; for (var b = 1; b < 4; b++) { g.beginPath(); g.moveTo(1000 + (i % 4) * 200 + b * 30, 460 + Math.floor(i / 4) * 170); g.lineTo(1000 + (i % 4) * 200 + b * 30, 570 + Math.floor(i / 4) * 170); g.stroke(); } }
      chip(g, 'KENTUCKY', 1390, 380, { px: 44, bg: CREAM, s: pop(t, tA), rot: .02, wide: true });
      if (t > tT - .4) { toilet(g, 760, 900, 1.1); }
      var nTally = Math.floor(clamp(seg(t, tE - .1, tE + 1.6), 0, 1) * 20);
      for (i = 0; i < nTally; i++) { var gx = 1060 + Math.floor(i / 5) * 110, gi = i % 5; g.strokeStyle = INK; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); if (gi < 4) { g.moveTo(gx + gi * 18, 140); g.lineTo(gx + gi * 18, 240); } else { g.moveTo(gx - 10, 230); g.lineTo(gx + 70, 150); } g.stroke(); }
      if (t > tE) chip(g, 'EVERY DAY', 1260, 300, { px: 50, bg: YEL, s: pop(t, tE - .1), rot: -.03, wide: true });
      chip(g, 'A SCHOOL FOR TROUBLED KIDS', 700, 170, { px: 48, bg: RED, fg: '#fff', s: pop(t, at('b3', 'troubled') - .2), rot: -.04, wide: true });
    }
    var P = poseAt(t, [[s.t0, { lh: [-60, -120], rh: [70, -130], look: [.6, -.3], mouth: 'smile', eyes: 'happy' }], [tA, { eyes: 'wide', mouth: 'O', brow: 1, look: [.6, -.2] }], [tT - .2, { rh: [120, -110], lean: .15, mouth: 'flat', eyes: 'dot', look: [.6, .4] }]]);
    if (t > tT - .2) P.rh = [P.rh[0] + Math.sin(t * 13) * 14, P.rh[1]];
    guy(g, 520, 960, .95, P, Object.assign({}, KID, { hold: [!real ? function (g) { rr(g, -30, 0, 60, 50, 6); fillStroke(g, '#8a5a3c', 4); } : null, t > tT - .2 ? brush : null] }), t);
    g.restore();
    vignette(g, .4);
  }
  /* 13 · the roommate: seventeen, tattoos, can't read; reading for bench press */
  function sRoommate(g, t, s) {
    var t17 = at('b4', 'seventeen,'), tTa = at('b4', 'tattoos,'), tR = at('b4', 'read.'), tTe = at('b5', 'teaches'), tB = at('b5', 'bench');
    g.save(); cam(g, t, s, .07);
    wall(g, '#6a7d8c', '#4e5e6b'); floorAt(g, 880, '#5a4a3e');
    /* bunk bed */
    g.strokeStyle = INK; g.lineWidth = 12; [[1380, 1680]].forEach(function (b) { g.beginPath(); g.moveTo(b[0], 880); g.lineTo(b[0], 320); g.moveTo(b[1], 880); g.lineTo(b[1], 320); g.stroke(); });
    rr(g, 1370, 400, 320, 50, 10); fillStroke(g, '#c9c3cf', 6); rr(g, 1370, 700, 320, 50, 10); fillStroke(g, '#c9c3cf', 6);
    var tk = seg(t, tB - .3, tB + .4), lifting = t > tB - .3;
    var big = poseAt(t, [[s.t0, { lh: [-70, -140], rh: [70, -140], look: [-.6, 0], mouth: 'flat', brow: -1 }], [tTe, { lh: [-60, -200], rh: [50, -150], look: [-.4, .2], mouth: 'smile', brow: 0, eyes: 'squint' }], [tB - .3, { lh: [-90, -150], rh: [-20, -260], mouth: 'grin' }]]);
    guy(g, 1180, 900, 1.35, big, { col: '#4a4a52', shade: '#38383f', hair: 'cap', hairCol: '#1e1c22', seed: 21, hold: [t > tTe && !lifting ? book : null, null] }, t);
    /* tattoos on the big guy's arms, as little marks */
    if (t > tTa - .1) { var tk2 = seg(t, tTa - .1, tTa + .6); g.save(); g.globalAlpha = tk2; [[1110, 610], [1240, 600], [1200, 650]].forEach(function (p, i) { g.save(); g.translate(p[0], p[1]); g.rotate(i); g.strokeStyle = '#2a5a9a'; g.lineWidth = 4; g.beginPath(); g.moveTo(-12, 0); g.lineTo(0, -12); g.lineTo(12, 0); g.lineTo(0, 12); g.closePath(); g.stroke(); g.restore(); }); g.restore(); }
    var kid = poseAt(t, [[s.t0, { lh: [-60, -130], rh: [60, -130], look: [.6, -.5], mouth: 'o', eyes: 'wide' }], [tTe - .3, { rh: [110, -220], look: [.6, -.3], mouth: 'talk', eyes: 'dot' }], [tB - .3, { lh: [-110, -280], rh: [110, -280], mouth: 'wavy', brow: -1, sweat: 1, look: [0, -.4] }]]);
    var bar = lifting ? (Math.sin(t * 5) * 10) : 0; kid.lh = [kid.lh[0], kid.lh[1] + bar]; kid.rh = [kid.rh[0], kid.rh[1] + bar];
    guy(g, 640, 900, .9, kid, Object.assign({}, KID, { hold: [null, t > tTe - .3 && !lifting ? book : null] }), t);
    if (lifting) { var by = 900 - (280 + 150) * .9 + bar * .9 - 20; g.strokeStyle = INK; g.lineWidth = 14; g.beginPath(); g.moveTo(480, by); g.lineTo(800, by); g.stroke(); g.strokeStyle = '#c9c6d6'; g.lineWidth = 6; g.stroke(); [480, 800].forEach(function (x) { rr(g, x - 26, by - 60, 52, 120, 10); fillStroke(g, '#3a3647', 5); }); }
    g.restore();
    chip(g, '17', 1180, 200, { px: 70, bg: CREAM, s: pop(t, t17 - .1), rot: -.04, wide: true });
    chip(g, 'TATTOOS', 1480, 250, { px: 46, bg: CREAM, s: pop(t, tTa - .1), rot: .04, wide: true });
    chip(g, "CAN'T READ", 900, 260, { px: 46, bg: YEL, s: pop(t, tR - .2) * (1 - seg(t, tTe - .2, tTe)), rot: -.03, wide: true });
    chip(g, 'READING ⇄ BENCH PRESS', 960, 150, { px: 52, bg: NVL, s: pop(t, tB - .1), rot: .02, wide: true });
    vignette(g, .4);
  }
  /* 14 · Denny's: dishes, bussing, waiting; remember Denny's */
  function sDennysJob(g, t, s) {
    var tW = at('b6', 'washing'), tB = at('b6', 'bussing'), tWa = at('b6', 'waiting'), t7 = start('b7');
    g.save(); cam(g, t, s, .06, 900, 560);
    wall(g, '#f0d9b0', '#e0bf8c');
    g.fillStyle = '#e8e2d2'; for (var x = -200; x < W + 200; x += 80) for (var y = 600; y < 880; y += 80) if (((x + y) / 80) % 2 === 0) g.fillRect(x, y, 80, 80);
    floorAt(g, 880, '#c0392b');
    g.save(); g.translate(1500, 230); g.rotate(.02); rr(g, -190, -60, 380, 120, 22); fillStroke(g, '#ffd23d', 7); txt(g, "DENNY'S", 0, 6, 66, RED, { wt: 900, wide: true }); g.restore();
    chip(g, 'OREGON · AGE 15', 1500, 360, { px: 40, bg: CREAM, s: pop(t, at('b6', 'oregon.') - .1), rot: -.02 });
    /* the sink and a stack of plates */
    rr(g, 180, 600, 520, 60, 8); fillStroke(g, '#c9c6d6', 6); rr(g, 220, 660, 440, 220, 8); fillStroke(g, '#9a96a6', 6);
    var nPlates = 4 + Math.floor(clamp(seg(t, tW, tB), 0, 1) * 6);
    for (var i = 0; i < nPlates; i++) { g.beginPath(); g.ellipse(560, 590 - i * 14, 70, 14, 0, 0, 6.283); fillStroke(g, '#fff', 4); }
    for (i = 0; i < 8; i++) { var ph = (t * .8 + i * .125) % 1; circ(g, 300 + hash(i) * 160, 600 - ph * 100, 8 + hash(i + 1) * 8); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; g.stroke(); }
    var job = t < tB - .2 ? 0 : t < tWa - .2 ? 1 : 2, gx = [420, 900, 1240][job];
    var P = poseAt(t, [[s.t0, { lh: [-40, -170], rh: [60, -160], look: [-.5, .3], mouth: 'flat' }], [tW, { lh: [-60, -150], rh: [40, -150] }], [tB - .2, { lh: [-80, -150], rh: [80, -230], mouth: 'smile', look: [.4, -.2] }], [tWa - .2, { lh: [-40, -200], rh: [80, -170], mouth: 'talk', look: [.6, 0] }], [t7, { lh: [-60, -150], rh: [120, -290], mouth: 'grin', eyes: 'happy', look: [0, -.3] }]]);
    if (job === 0) { P.lh = [P.lh[0] + Math.sin(t * 12) * 10, P.lh[1]]; P.rh = [P.rh[0] - Math.sin(t * 12) * 10, P.rh[1]]; }
    var walk = t > tB - .2 && t < tB + .4 || t > tWa - .2 && t < tWa + .4; if (walk) { P.lf = [-26 + Math.sin(t * 16) * 20, 0]; P.rf = [26 - Math.sin(t * 16) * 20, 0]; }
    var gxS = job === 0 ? 420 : job === 1 ? lerp(420, 900, eio(seg(t, tB - .2, tB + .4))) : lerp(900, 1240, eio(seg(t, tWa - .2, tWa + .4)));
    guy(g, gxS, 920, 1.0, P, Object.assign({}, KID, { col: '#d6412a', shade: '#b23420', hat: 'beanie', capCol: CREAM, hold: [null, job === 1 ? tray : job === 2 ? pad : null] }), t);
    if (job === 2) { /* a customer at the counter */ guy(g, 1580, 920, 1.0, poseAt(t, [[s.t0, { look: [-.6, 0], mouth: 'smile', lh: [-60, -150], rh: [50, -200] }]]), { col: BLUE, shade: '#2f5fc4', seed: 31, hair: 'cap', hairCol: '#6a4a3a', hold: [null, function (g) { mug(g, 0, 0, .6, t, true); }] }, t); }
    g.restore();
    ['WASHING DISHES', 'BUSSING TABLES', 'WAITING TABLES'].forEach(function (l, i) { var tt = [tW, tB, tWa][i]; chip(g, l, 360 + i * 600, 140, { px: 42, bg: i === job ? YEL : CREAM, s: pop(t, tt - .15), rot: (i - 1) * .03, wide: true, a: i <= job ? 1 : 0 }); });
    sticky(g, ['REMEMBER', "DENNY'S"], 960, 520, pop(t, t7 - .1, 3, .6), -.05);
    vignette(g, .35);
  }
  /* 15 · engineering, chips in Silicon Valley */
  function sValley(g, t, s) {
    var tE = at('b8', 'electrical'), tC = at('b8', 'chips');
    g.save(); cam(g, t, s, .07);
    sky(g, t, '#ffcf8a', '#ffe9c4', { clouds: 'rgba(255,255,255,.8)' });
    g.fillStyle = '#c9a26a'; g.beginPath(); g.moveTo(-200, 640); for (var x = -200; x <= W + 200; x += 100) g.lineTo(x, 560 + Math.sin(x * .004) * 60 + Math.sin(x * .011) * 20); g.lineTo(W + 200, 900); g.lineTo(-200, 900); g.closePath(); g.fill();
    floorAt(g, 820, '#5a4a6a');
    rr(g, 180, 720, 1500, 34, 8); fillStroke(g, '#8a5a3c', 6);
    monitor(g, 1180, 470, 560, 330, function (g, w, h) {
      g.strokeStyle = 'rgba(120,200,255,.8)'; g.lineWidth = 3;
      var k = seg(t, tC - .6, tC + 1.2);
      for (var i = 0; i < 14; i++) { if (i / 14 > k) break; var x0 = -w / 2 + 30 + hash(i) * (w - 60), y0 = -h / 2 + 30 + hash(i + 7) * (h - 60); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (hash(i + 3) > .5 ? 80 : 0), y0 + (hash(i + 3) > .5 ? 0 : 60)); g.lineTo(x0 + 80, y0 + 60); g.stroke(); circ(g, x0, y0, 5); g.fillStyle = 'rgba(120,200,255,.9)'; g.fill(); }
      rr(g, -60, -60, 120, 120, 10); g.strokeStyle = NVL; g.lineWidth = 4; g.stroke();
    });
    var P = poseAt(t, [[s.t0, { lh: [-40, -180], rh: [80, -190], look: [.7, -.2], mouth: 'smile', front: 1 }], [tC, { rh: [140, -230], mouth: 'grin' }]]);
    guy(g, 700, 940, 1.2, P, Object.assign({}, JEN, { jacket: false, col: '#4a6a9a', shade: '#3a5680', hold: [null, null] }), t);
    g.restore();
    chip(g, 'ELECTRICAL ENGINEERING', 600, 170, { px: 46, bg: CREAM, s: pop(t, tE - .15), rot: -.03, wide: true });
    chip(g, 'SILICON VALLEY', 1300, 140, { px: 56, bg: YEL, s: pop(t, at('b8', 'silicon') - .15), rot: .03, wide: true });
    vignette(g, .35);
  }
  /* 16 · the booth: three engineers, coffee, eggs, hours, a plan */
  function sBooth(g, t, s) {
    var tC = at('b9', 'chris'), tP = at('b9', 'curtis'), tCo = at('b10', 'coffee,'), tEg = at('b10', 'eggs,'), tH = at('b10', 'hours'), tPl = at('b10', 'plan:'), tR = at('b10', 'real.');
    g.save(); cam(g, t, s, .08, 960, 560);
    diner(g, t, { night: true });
    var spin = seg(t, tH - .2, tH + 1.2);
    /* a wall clock that spins through hours */
    g.save(); g.translate(960, 640); circ(g, 0, 0, 0); g.restore();
    var talk = function (i) { var ph = (t * .7 + i * .33) % 1; return ph < .33; };
    [[700, CHRIS, tC, 'CHRIS MALACHOWSKY', -1], [960, JEN, s.t0, 'JENSEN HUANG', 0], [1220, CURT, tP, 'CURTIS PRIEM', 1]].forEach(function (c, i) {
      var k = pop(t, c[2] - .15, 3, .7); if (k <= 0 && i !== 1) return;
      var P = poseAt(t, [[s.t0, { lh: [-60, -200], rh: [60, -200], look: [c[4] * -.4, .1], mouth: 'smile' }], [tCo, { lh: [-30, -230], rh: [70, -235], mouth: talk(i) ? 'talk' : 'smile' }], [tPl, { lh: [-80, -260], rh: [80, -260], mouth: 'grin', eyes: 'happy', look: [0, -.2] }]]);
      P.mouth = t > tCo && t < tPl ? (talk(i) ? 'talk' : 'smile') : P.mouth;
      guy(g, c[0], 1000 - (i === 1 ? 0 : 0), 1.05, P, Object.assign({}, c[1], { noShadow: true }), t);
    });
    dinerTable(g);
    if (t > tCo - .1) { [[760, .9], [960, 1], [1160, .9]].forEach(function (m, i) { var k = pop(t, tCo - .1 + i * .08, 3, .6); if (k > 0) mug(g, m[0] - 70, 696, clamp(k, 0, 1.05) * .9, t, true); }); }
    if (t > tEg - .1) { [[880, 0], [1100, 1]].forEach(function (p, i) { var k = pop(t, tEg - .1 + i * .1, 3, .6); if (k > 0) plate(g, p[0], 694, clamp(k, 0, 1.05) * .8); }); }
    /* the napkin sketch: a 3D ship made of triangles */
    var nk = pop(t, tPl - .2, 2.6, .6);
    if (nk > 0) { g.save(); g.translate(960, 330); g.scale(clamp(nk, 0, 1.05), clamp(nk, 0, 1.05)); g.rotate(-.04); g.fillStyle = 'rgba(8,6,18,.4)'; g.fillRect(-300 + 12, -170 + 14, 600, 340); g.beginPath(); g.rect(-300, -170, 600, 340); fillStroke(g, '#fbf8f0', 5);
      var rk = seg(t, tPl, tR + .4), rot = t * .8; var V = [[0, -90, 0], [80, 60, 40], [-80, 60, 40], [0, 40, -80]];
      function pr(v) { var x = v[0] * Math.cos(rot) - v[2] * Math.sin(rot), z = v[0] * Math.sin(rot) + v[2] * Math.cos(rot); return [x * 1.2, v[1] * 1.1 + z * .2]; }
      [[0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 2, 3]].forEach(function (f, j) { if (j / 4 > rk + .05) return; var a = pr(V[f[0]]), b = pr(V[f[1]]), c = pr(V[f[2]]); g.beginPath(); g.moveTo(a[0], a[1] - 10); g.lineTo(b[0], b[1] - 10); g.lineTo(c[0], c[1] - 10); g.closePath(); fillStroke(g, ['rgba(118,185,0,.35)', 'rgba(118,185,0,.55)', 'rgba(118,185,0,.25)', 'rgba(118,185,0,.45)'][j], 4); });
      txt(g, 'MAKE GAMES LOOK REAL', 0, 135, 36, INK, { wt: 900, wide: true }); g.restore(); }
    if (spin > 0 && spin < 1) { g.save(); g.translate(1680, 160); circ(g, 0, 0, 70); fillStroke(g, CREAM, 6); g.rotate(spin * 6.283 * 4); g.strokeStyle = INK; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -52); g.stroke(); g.restore(); txt(g, 'HOURS', 1680, 270, 40, CREAM, { wt: 900, wide: true, outline: 8 }); }
    g.restore();
    chip(g, 'CHRIS MALACHOWSKY', 520, 600, { px: 34, bg: CREAM, s: pop(t, tC - .1), rot: -.02 });
    chip(g, 'JENSEN HUANG', 960, 980, { px: 34, bg: YEL, s: pop(t, s.t0 + .3), rot: .01 });
    chip(g, 'CURTIS PRIEM', 1400, 600, { px: 34, bg: CREAM, s: pop(t, tP - .1), rot: .02 });
    dateTag(g, 'LATE 1992', t, at('b9', '1992,') - .1);
    vignette(g, .45);
  }
  /* 17 · April 1993: the company starts with about $40,000 */
  function sFound(g, t, s) {
    var tA = at('b11', 'april'), t40 = at('b11', '40');
    g.save(); cam(g, t, s, .06);
    wall(g, '#2f3a52', '#1d2538'); grid(g, 90);
    calendar(g, 520, 500, 1.3 * clamp(pop(t, tA - .2), 0, 1.05), 'APRIL', '5', { sub: '1993' });
    var ck = seg(t, t40 - .3, t40 + 1);
    for (var i = 0; i < 4; i++) { var k = pop(t, t40 - .3 + i * .12, 3, .6); if (k > 0) cash(g, 1240 + (i % 2) * 30, 680 - i * 40, clamp(k, 0, 1.05) * 1.1, 1); }
    bigNum(g, '$' + Math.round(40000 * eo(ck)).toLocaleString('en-US'), 1260, 380, 120, NVL, pop(t, t40 - .3));
    chip(g, 'ABOUT', 1260, 260, { px: 40, bg: CREAM, s: pop(t, t40 - .3), rot: -.03 });
    g.restore();
    chip(g, 'NVIDIA IS BORN', 960, 140, { px: 56, bg: YEL, s: pop(t, at('b11', 'start') - .15), rot: -.02, wide: true });
    vignette(g, .4);
  }
  /* 18 · the name: NV files, NVision taken by a toilet paper company, invidia = envy */
  function sName(g, t, s) {
    var tNV = at('b12', 'nv,'), tNx = at('b12', 'next'), t13 = start('b13'), tTP = at('b13', 'toilet'), t14 = start('b14'), tIn = at('b14', 'invidia,'), tEn = at('b14', 'envy.');
    g.save(); cam(g, t, s, .06);
    wall(g, '#2d4a3a', '#1c3026'); grid(g, 90);
    if (t < t13 + .2) {
      var a = 1 - seg(t, t13, t13 + .2);
      for (var i = 0; i < 4; i++) { var k = pop(t, tNV - .3 + i * .1, 3, .6); if (k <= 0) continue; g.save(); g.globalAlpha = a; g.translate(420 + i * 110, 560 + i * 26); g.rotate(-.1 + i * .05); g.scale(clamp(k, 0, 1.05), clamp(k, 0, 1.05)); g.beginPath(); g.moveTo(-160, -110); g.lineTo(-60, -110); g.lineTo(-40, -130); g.lineTo(40, -130); g.lineTo(60, -110); g.lineTo(160, -110); g.lineTo(160, 120); g.lineTo(-160, 120); g.closePath(); fillStroke(g, '#e8c66a', 5); txt(g, 'NV' + (i ? ' v' + (i + 1) : ''), 0, 10, 60, INK, { wt: 900, wide: true }); g.restore(); }
      g.save(); g.globalAlpha = a; chip(g, 'NV = NEXT VERSION', 1340, 520, { px: 60, bg: YEL, s: pop(t, tNx - .1), rot: .03, wide: true }); g.restore();
    }
    if (t > t13 - .1 && t < t14 + .2) {
      var a2 = 1 - seg(t, t14, t14 + .2), sk = pop(t, t13 - .1, 3, .6);
      g.save(); g.globalAlpha = a2; g.translate(700, 480); g.scale(clamp(sk, 0, 1.05), clamp(sk, 0, 1.05)); rr(g, -360, -110, 720, 220, 24); fillStroke(g, '#1a1528', 8); glow(g, 0, 0, 420, 'rgba(182,240,90,.35)', 1); txt(g, 'NVISION', 0, 6, 130, NVL, { wt: 900, wide: true, outline: 10 }); g.restore();
      if (t > tTP - .3) { var tk = pop(t, tTP - .3, 3, .55); g.save(); g.globalAlpha = a2; tpRoll(g, 1400, 640 + (1 - clamp(tk, 0, 1)) * 400, 1.5, t, 'smug'); g.restore(); g.save(); g.globalAlpha = a2; bubble(g, 'TAKEN.', 1480, 330, tk, { px: 70, tail: -.3 }); g.restore(); stamp(g, 'TAKEN', 700, 480, t, tTP + .3, { px: 90, a: a2 }); }
    }
    if (t > t14 - .1) {
      var dk = pop(t, tIn - .3, 2.6, .6);
      card(g, 960, 470, 980, 420, -.02, clamp(dk, 0, 1), function (g) { txt(g, 'IN·VID·I·A', 0, -110, 96, INK, { fam: SERIF, wt: 400 }); txt(g, '(LATIN, NOUN)', 0, -30, 34, INK, { fam: MONO, wt: 700 }); txt(g, '= ENVY', 0, 80, 110, NVD, { wt: 900, wide: true }); });
      /* rivals, green with envy */
      if (t > tEn - .2) [[260, -.1], [1660, .1]].forEach(function (r, i) { var P = poseAt(t, [[s.t0, { mouth: 'frown', brow: -1, eyes: 'squint', look: [i ? -.6 : .6, 0], lh: [-70, -130], rh: [70, -130] }]]); guy(g, r[0], 1000 + (1 - clamp(pop(t, tEn - .2 + i * .1), 0, 1)) * 300, 1, P, { col: '#5a5470', shade: '#47425a', skin: '#a8e06a', skin2: '#86c04a', seed: 40 + i }, t); });
      chip(g, 'GREEN WITH ENVY', 960, 820, { px: 50, bg: NVL, s: pop(t, tEn), rot: .02, wide: true });
    }
    g.restore();
    vignette(g, .4);
  }
  /* 19 · the pitch: "one of the worst pitches", a phone call anyway */
  function sPitch(g, t, s) {
    var tW = at('b15', 'worst'), tPh = at('b15', 'phones');
    g.save(); cam(g, t, s, .06);
    wall(g, '#3a4a62', '#273246'); floorAt(g, 880, '#4a3a4a');
    /* whiteboard */
    rr(g, 200, 180, 700, 420, 10); fillStroke(g, '#fbfbf6', 8);
    g.strokeStyle = '#3d7bff'; g.lineWidth = 6; g.lineCap = 'round'; var wk = seg(t, s.t0, tW);
    [[260, 520, 420, 300], [420, 300, 560, 420], [560, 420, 820, 230]].forEach(function (l, i) { var k = clamp(wk * 3 - i, 0, 1); if (k <= 0) return; g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(lerp(l[0], l[2], k), lerp(l[1], l[3], k)); g.stroke(); });
    txt(g, '3D CHIPS FOR PC GAMES!', 550, 230, 34, RED, { wt: 900 });
    var J = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [-150, -280], look: [.6, -.2], mouth: 'talk' }], [tW, { rh: [60, -150], mouth: 'o', eyes: 'wide', brow: 1, sweat: 1 }]]);
    guy(g, 980, 940, 1.15, J, JEN, t);
    var B = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [60, -150], look: [-.6, 0], mouth: 'flat', brow: -1 }], [tW - .3, { rh: [130, -200], mouth: 'frown' }], [tPh - .2, { rh: [40, -300], look: [-.2, -.2], mouth: 'smirk', brow: 0 }]]);
    guy(g, 1500, 940, 1.15, B, Object.assign({}, BOSS, { hold: [null, t > tPh - .2 ? phoneH : function (g) { if (t > tW - .3) { g.save(); g.rotate(Math.PI); rr(g, -14, -40, 28, 40, 10); fillStroke(g, HEAD, 4); g.restore(); } }] }), t);
    g.restore();
    chip(g, 'HIS OLD BOSS', 1500, 220, { px: 44, bg: CREAM, s: pop(t, at('b15', 'boss,') - .1), rot: .03, wide: true });
    chip(g, '“ONE OF THE WORST PITCHES”', 1300, 340, { px: 44, bg: RED, fg: '#fff', s: pop(t, tW - .1) * (1 - seg(t, tPh - .4, tPh - .1)), rot: -.03 });
    chip(g, '…AND CALLS AN INVESTOR ANYWAY', 1260, 340, { px: 42, bg: YEL, s: pop(t, tPh - .1), rot: .02 });
    vignette(g, .4);
  }
  /* 20 · Don Valentine, Sequoia, the money and the warning */
  function sValentine(g, t, s) {
    var tV = at('b16', 'don'), tM = at('b16', 'money'), tWa = at('b16', 'warning.'), t17 = start('b17');
    g.save(); cam(g, t, s, .06);
    wall(g, '#4a2f2a', '#2f1d1a'); floorAt(g, 880, '#3a2420');
    /* a big desk */
    rr(g, 820, 640, 900, 60, 10); fillStroke(g, '#6b3d1e', 7); g.fillStyle = '#5a3218'; g.fillRect(860, 700, 820, 190); g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(860, 700, 820, 190);
    var V = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [60, -150], look: [-.6, 0], mouth: 'flat', brow: -1, eyes: 'squint' }], [tM - .2, { lh: [-140, -170], mouth: 'smirk' }], [t17 - .2, { lh: [-170, -230], rh: [60, -260], brow: -1, mouth: 'teeth', eyes: 'squint', look: [-.8, 0] }]]);
    guy(g, 1380, 900, 1.25, V, VAL, t);
    var mk = seg(t, tM - .2, tM + .5);
    if (mk > 0) { g.save(); g.translate(lerp(1250, 1000, eio(mk)), 600); g.beginPath(); g.moveTo(-70, 40); g.quadraticCurveTo(-90, -60, -30, -70); g.lineTo(30, -70); g.quadraticCurveTo(90, -60, 70, 40); g.closePath(); fillStroke(g, '#c9a26a', 6); txt(g, '$', 0, -10, 70, '#5a3a1a', { wt: 900 }); g.restore(); }
    var J = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [60, -150], look: [.6, 0], mouth: 'smile' }], [tM, { rh: [130, -220], mouth: 'grin', eyes: 'happy' }], [t17 - .2, { lh: [-120, -260], rh: [90, -220], mouth: 'wavy', eyes: 'wide', brow: 1, sweat: 1, lean: -.12 }]]);
    guy(g, 560, 900, 1.15, J, JEN, t);
    g.restore();
    chip(g, 'DON VALENTINE · SEQUOIA', 1380, 150, { px: 44, bg: CREAM, s: pop(t, tV - .1) * (1 - seg(t, t17 - .4, t17 - .1)), rot: .03, wide: true });
    chip(g, '…WITH A WARNING', 960, 150, { px: 44, bg: YEL, s: pop(t, tWa - .1) * (1 - seg(t, t17 - .4, t17 - .1)), rot: -.02, wide: true });
    if (t > t17 - .2) { g.save(); g.fillStyle = 'rgba(20,6,6,' + .45 * seg(t, t17 - .2, t17 + .2) + ')'; g.fillRect(0, 0, W, H); g.restore(); quote(g, t, 'b17', 360, { px: 84, maxw: 1400, hot: /kill/i, hotCol: RED }); txt(g, 'AS TOLD IN “THE NVIDIA WAY” (TAE KIM, 2024)', 960, 560, 30, CREAM, { fam: MONO, wt: 700, outline: 6 }); }
    vignette(g, .45);
  }
