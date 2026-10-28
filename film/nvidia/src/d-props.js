  /* ============================================================ props for the Nvidia history */
  /* a quotable line, built on screen from paper words, each landing on its spoken word (from episode 2) */
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
          g.beginPath(); g.rect(-c.ww / 2, -px * .66, c.ww, px * 1.32); fillStroke(g, (o.hot && o.hot.test(c.w.w)) ? (o.hotCol || NVL) : i % 3 === 2 ? YEL : PAPER, 5);
          txt(g, c.w.w.toUpperCase(), 0, px * .04, px, INK, { wt: 900, wide: true });
          if (i === 0) tape(g, -c.ww / 2 + 20, -px * .62, -.5);
          g.restore();
        }
        x += c.ww + px * .22;
      });
    });
  }
  function wall(g, top, bot) { var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(-200, -200, W + 400, H + 400); }
  function floorAt(g, y, col) { g.fillStyle = col; g.fillRect(-200, y, W + 400, H + 400 - y); g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(-200, y, W + 400, 10); }
  function sepia(g, a) { if (a <= 0) return; g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = a; g.fillStyle = '#e8c48f'; g.fillRect(0, 0, W, H); g.restore(); }
  function flash(g, t, t0, d) { var k = seg(t, t0, t0 + (d || .5)); if (t < t0 || k >= 1) return; g.fillStyle = 'rgba(255,248,225,' + (1 - k) + ')'; g.fillRect(0, 0, W, H); }
  /* faint blueprint grid for "explainer" walls */
  function grid(g, step, col) { g.strokeStyle = col || 'rgba(255,255,255,.05)'; g.lineWidth = 2; for (var x = -200; x < W + 200; x += step) { g.beginPath(); g.moveTo(x, -200); g.lineTo(x, H + 200); g.stroke(); } for (var y = -200; y < H + 200; y += step) { g.beginPath(); g.moveTo(-200, y); g.lineTo(W + 200, y); g.stroke(); } }
  /* a rubber stamp that slams down: big, then settles */
  function stamp(g, s, x, y, t, t0, o) {
    o = o || {}; if (t < t0) return; var k = clamp(sp(t, t0, 4, .6), 0, 1.1), sc = lerp(2.2, 1, clamp(k, 0, 1)) * (o.s || 1), px = o.px || 64, col = o.col || RED;
    g.save(); g.globalAlpha *= clamp(seg(t, t0, t0 + .08), 0, 1) * (o.a == null ? 1 : o.a); g.translate(x, y); g.rotate(o.rot == null ? -.12 : o.rot); g.scale(sc, sc);
    font(g, px, 900, DISP, true); var w = g.measureText(s).width + px;
    rr(g, -w / 2, -px * .8, w, px * 1.6, 12); g.lineWidth = 10; g.strokeStyle = col; g.stroke();
    rr(g, -w / 2 + 12, -px * .8 + 12, w - 24, px * 1.6 - 24, 6); g.lineWidth = 3; g.stroke();
    txt(g, s, 0, 4, px, col, { wt: 900, wide: true }); g.restore();
  }
  /* a yellow sticky note with tape: the callbacks ("REMEMBER…") */
  function sticky(g, lines, x, y, k, rot, o) {
    if (k <= 0) return; o = o || {}; var w = o.w || 380, h = o.h || 300;
    g.save(); g.translate(x, y + (1 - clamp(k, 0, 1)) * -60); g.rotate(rot || -.04); g.scale(clamp(k, 0, 1.06), clamp(k, 0, 1.06));
    g.fillStyle = 'rgba(8,6,18,.4)'; g.fillRect(-w / 2 + 12, -h / 2 + 16, w, h);
    g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2, h / 2 - 40); g.lineTo(w / 2 - 40, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); fillStroke(g, o.col || '#ffe27a', 5);
    lines.forEach(function (l, i) { txt(g, l, 0, (i - (lines.length - 1) / 2) * (o.lh || 70), o.px || 54, INK, { wt: 900, wide: i > 0 }); });
    tape(g, 0, -h / 2, .05); g.restore();
  }
  /* a speech bubble */
  function bubble(g, s, x, y, k, o) {
    if (k <= 0) return; o = o || {}; var px = o.px || 44, lines = Array.isArray(s) ? s : [s];
    font(g, px, 800, DISP); var w = Math.max.apply(null, lines.map(function (l) { return g.measureText(l).width; })) + px * 1.4, h = lines.length * px * 1.25 + px * .9;
    g.save(); g.translate(x, y); g.scale(clamp(k, 0, 1.06), clamp(k, 0, 1.06));
    var tx = o.tail == null ? -w * .25 : o.tail * w / 2;
    g.beginPath(); g.roundRect(-w / 2, -h, w, h, 26); fillStroke(g, o.bg || CREAM, 5);
    g.beginPath(); g.moveTo(tx - 18, -4); g.lineTo(tx + (o.tdx || -28), 46); g.lineTo(tx + 26, -4); g.closePath(); fillStroke(g, o.bg || CREAM, 5);
    g.fillStyle = o.bg || CREAM; g.fillRect(tx - 14, -12, 36, 12);
    lines.forEach(function (l, i) { txt(g, l, 0, -h + px * .45 + (i + .5) * px * 1.25, px, o.fg || INK, { wt: o.wt || 800 }); });
    g.restore();
  }
  /* a computer chip: pins, a dark package, a green die; optional face */
  function chipD(g, x, y, s, t, o) {
    o = o || {}; g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.scale(s, s);
    if (o.glow) glow(g, 0, 0, 260, 'rgba(118,185,0,.55)', o.glow);
    g.lineCap = 'round';
    for (var i = 0; i < 6; i++) { var p = -75 + i * 30; [[p, -112, p, -96], [p, 112, p, 96], [-112, p, -96, p], [112, p, 96, p]].forEach(function (L) { g.beginPath(); g.moveTo(L[0], L[1]); g.lineTo(L[2], L[3]); g.strokeStyle = INK; g.lineWidth = 15; g.stroke(); g.strokeStyle = '#d8c27a'; g.lineWidth = 7; g.stroke(); }); }
    rr(g, -100, -100, 200, 200, 18); fillStroke(g, o.body || '#2c2936', 6);
    rr(g, -62, -62, 124, 124, 10); var gr = g.createLinearGradient(-62, -62, 62, 62); gr.addColorStop(0, o.die2 || NVL); gr.addColorStop(1, o.die || NV); g.fillStyle = gr; g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
    g.strokeStyle = 'rgba(20,40,0,.35)'; g.lineWidth = 3; for (i = 1; i < 4; i++) { g.beginPath(); g.moveTo(-62 + i * 31, -58); g.lineTo(-62 + i * 31, 58); g.moveTo(-58, -62 + i * 31); g.lineTo(58, -62 + i * 31); g.stroke(); }
    if (o.label) { rr(g, -88, 66, 176, 28, 6); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); txt(g, o.label, 0, 80, 22, CREAM, { fam: MONO, wt: 700, ls: 2 }); }
    if (o.face) {
      var bl = ((t + (o.seed || 0)) % 3.3) < .12, m = o.face;
      g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 7;
      [-1, 1].forEach(function (sd) { if (bl || m === 'shut') { g.beginPath(); g.moveTo(sd * 24 - 10, -12); g.lineTo(sd * 24 + 10, -12); g.stroke(); } else if (m === 'x') { g.beginPath(); g.moveTo(sd * 24 - 9, -21); g.lineTo(sd * 24 + 9, -3); g.moveTo(sd * 24 + 9, -21); g.lineTo(sd * 24 - 9, -3); g.stroke(); } else { g.beginPath(); g.ellipse(sd * 24, -12, 8, 11, 0, 0, 6.283); g.fill(); circ(g, sd * 24 - 3, -16, 3); g.fillStyle = '#fff'; g.fill(); g.fillStyle = INK; } });
      g.beginPath(); if (m === 'sad' || m === 'x') g.arc(0, 30, 16, Math.PI * 1.2, Math.PI * 1.8); else if (m === 'grin') { g.moveTo(-22, 12); g.quadraticCurveTo(0, 46, 22, 12); g.closePath(); g.fill(); } else if (m === 'o') { g.ellipse(0, 20, 8, 11, 0, 0, 6.283); g.fill(); } else g.arc(0, 8, 18, Math.PI * .2, Math.PI * .8); g.stroke();
    }
    g.restore();
  }
  /* a graphics card: a board, a shroud, one or two fans, the gold edge */
  function gpuCard(g, x, y, s, t, o) {
    o = o || {}; var spin = (o.spin == null ? 1 : o.spin) * t * 14, w = 560, h = 230;
    g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.scale(s, s);
    if (o.glow) glow(g, 0, 0, 420, 'rgba(118,185,0,.5)', o.glow);
    g.fillStyle = '#e2b640'; for (var i = 0; i < 16; i++) { g.fillRect(-180 + i * 14, h / 2 - 4, 9, 22); } g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(-186, h / 2 - 4, 230, 22);
    rr(g, -w / 2, -h / 2, w, h, 14); fillStroke(g, o.board || '#2f6b3a', 6);
    rr(g, -w / 2 + 14, -h / 2 + 14, w - 28, h - 34, 22); fillStroke(g, o.shroud || '#2c2936', 5);
    g.fillStyle = o.stripe || NV; g.fillRect(-w / 2 + 14, -h / 2 + 30, w - 28, 10);
    var fans = o.fans || 2;
    for (i = 0; i < fans; i++) {
      var fx = fans === 1 ? 60 : -120 + i * 240, fy = 10, r = 84;
      circ(g, fx, fy, r); fillStroke(g, '#1b1820', 5);
      g.save(); g.translate(fx, fy); g.rotate(spin + i);
      for (var b = 0; b < 7; b++) { g.rotate(6.283 / 7); g.beginPath(); g.moveTo(10, 0); g.quadraticCurveTo(50, -26, 76, -6); g.quadraticCurveTo(48, 6, 10, 8); g.closePath(); g.fillStyle = '#4a4656'; g.fill(); }
      circ(g, 0, 0, 22); fillStroke(g, o.hub || NV, 4); g.restore();
    }
    if (fans === 1) { for (i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-250 + i * 26, -70, 14, 150); } }
    if (o.label) txt(g, o.label, o.lx || (fans === 1 ? -150 : 0), -h / 2 + 2, 30, CREAM, { fam: MONO, wt: 700, ls: 3, outline: 6 });
    if (o.heat) glow(g, 0, -h / 2 - 60, 300, 'rgba(255,120,40,.5)', o.heat);
    g.restore();
  }
  /* a server rack, LEDs blinking green */
  function rack(g, x, y, w, h, t, o) {
    o = o || {}; g.save(); g.translate(x, y);
    rr(g, 0, 0, w, h, 8); fillStroke(g, o.body || '#2a2735', 6);
    var rows = Math.floor((h - 30) / 46);
    for (var r = 0; r < rows; r++) {
      var yy = 18 + r * 46; rr(g, 14, yy, w - 28, 36, 4); fillStroke(g, '#3a3647', 3);
      for (var i = 0; i < 6; i++) { var on = hash(r * 7.1 + i * 3.3 + Math.floor(t * (3 + hash(r + i) * 5)) * .37 + (o.seed || 0)) > .45; circ(g, 30 + i * 16, yy + 18, 4); g.fillStyle = on ? NVL : '#203018'; g.fill(); }
      g.fillStyle = 'rgba(0,0,0,.3)'; for (i = 0; i < 8; i++) g.fillRect(w - 40 - i * 12, yy + 8, 6, 20);
    }
    if (o.label) txt(g, o.label, w / 2, h + 34, 30, CREAM, { fam: MONO, wt: 700, outline: 7 });
    g.restore();
  }
  /* a small honesty tag on staged screens */
  function recreated(g, x, y) { chip(g, 'RE-CREATED', x, y, { px: 22, bg: '#2c2936', fg: CREAM, fam: MONO, wt: 700 }); }
  /* the stadium of kids: a grid of tiny workers, each with one sum. fn(i, col, row) → 0..1 lights that kid's pixel */
  function stadium(g, x, y, cols, rows, cell, t, fn, o) {
    o = o || {};
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var i = r * cols + c, cx = x + c * cell + (r % 2) * cell * .5, cy = y + r * cell * .82, k = fn ? fn(i, c, r) : 0, hop = k > 0 && k < 1 ? Math.sin(k * Math.PI) * cell * .25 : 0;
      var hc = ['#ff5b3d', '#3d7bff', '#ffc83d', '#5fb86b', '#b06bff', '#2a9d8f'][Math.floor(hash(i * 1.7) * 6)];
      g.beginPath(); g.ellipse(cx, cy + cell * .3 - hop, cell * .36, cell * .26, 0, Math.PI, 0); g.fillStyle = hc; g.fill();
      circ(g, cx, cy - hop, cell * .24); g.fillStyle = HEAD; g.fill(); g.lineWidth = Math.max(1.5, cell * .06); g.strokeStyle = INK; g.stroke();
      if (cell > 26) { g.fillStyle = INK; circ(g, cx - cell * .08, cy - hop - cell * .02, cell * .035); g.fill(); circ(g, cx + cell * .08, cy - hop - cell * .02, cell * .035); g.fill(); }
      if (k > 0 && o.pix) { var pc = o.pix(i, c, r); g.fillStyle = pc; g.globalAlpha = clamp(k * 2, 0, 1); var pw = cell * (o.pw || .36), ph = cell * (o.ph || .28); g.fillRect(cx - pw / 2, cy - hop - cell * .48 - ph / 2, pw, ph); g.globalAlpha = 1; }
    }
  }
  /* a line chart drawn up to k (0..1) of its points; pts are [x 0..1, y 0..1]; returns the head position */
  function chart(g, x, y, w, h, pts, k, o) {
    o = o || {}; g.save(); g.translate(x, y);
    if (!o.bare) { rr(g, -30, -30, w + 60, h + 60, 18); fillStroke(g, o.bg || '#191527', 5); g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 2; for (var i = 1; i < 5; i++) { g.beginPath(); g.moveTo(0, h * i / 5); g.lineTo(w, h * i / 5); g.stroke(); } }
    var n = pts.length - 1, upto = clamp(k, 0, 1) * n, last = Math.floor(upto), f = upto - last;
    function P(p) { return [p[0] * w, h - p[1] * h]; }
    var head = P(pts[0]);
    g.beginPath(); var a = P(pts[0]); g.moveTo(a[0], a[1]);
    for (i = 1; i <= last; i++) { var q = P(pts[i]); g.lineTo(q[0], q[1]); head = q; }
    if (last < n) { var p0 = P(pts[last]), p1 = P(pts[last + 1]); head = [lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f)]; g.lineTo(head[0], head[1]); }
    g.lineJoin = g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = (o.lw || 10) + 8; g.stroke(); g.strokeStyle = o.col || NVL; g.lineWidth = o.lw || 10; g.stroke();
    if (k > 0) { circ(g, head[0], head[1], 14); fillStroke(g, o.dot || CREAM, 5); }
    g.restore(); return [x + head[0], y + head[1]];
  }
  /* coins and cash */
  function coin(g, x, y, r, col, s) {
    g.save(); g.translate(x, y); g.scale(1, s == null ? 1 : s); circ(g, 0, 0, r); fillStroke(g, col || YEL, 5); circ(g, 0, 0, r * .7); g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.3)'; g.stroke(); txt(g, '$', 0, 2, r * 1.05, 'rgba(0,0,0,.45)', { wt: 900 }); g.restore();
  }
  function cash(g, x, y, s, n) {
    g.save(); g.translate(x, y); g.scale(s, s);
    for (var i = 0; i < (n || 1); i++) { g.save(); g.translate(0, -i * 14); g.rotate((hash(i * 3.3) - .5) * .06); rr(g, -110, -48, 220, 96, 8); fillStroke(g, '#8fcf7a', 5); circ(g, 0, 0, 30); fillStroke(g, '#bfe8a8', 4); txt(g, '$', 0, 2, 40, '#2f6b3a', { wt: 900 }); g.restore(); }
    g.restore();
  }
  /* a wall calendar page */
  function calendar(g, x, y, s, top, big, o) {
    o = o || {}; g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.scale(s, s);
    g.fillStyle = 'rgba(8,6,18,.4)'; g.fillRect(-150 + 12, -170 + 16, 300, 340);
    rr(g, -150, -170, 300, 340, 14); fillStroke(g, CREAM, 6); g.save(); g.beginPath(); g.roundRect(-150, -170, 300, 92, [14, 14, 0, 0]); fillStroke(g, o.col || RED, 6); g.restore();
    txt(g, top, 0, -124, 46, '#fff', { wt: 900, wide: true });
    txt(g, big, 0, 20, o.px || 130, INK, { wt: 900, wide: true });
    if (o.sub) txt(g, o.sub, 0, 120, 36, INK, { fam: MONO, wt: 700 });
    [-90, 90].forEach(function (rx) { circ(g, rx, -170, 14); fillStroke(g, '#bdb6a8', 4); });
    g.restore();
  }
  /* a monitor with a screen-drawing callback */
  function monitor(g, x, y, w, h, fn) {
    g.save(); g.translate(x, y);
    rr(g, -24, h / 2 + 10, 48, 60, 6); fillStroke(g, '#3a3647', 5); rr(g, -110, h / 2 + 60, 220, 22, 10); fillStroke(g, '#3a3647', 5);
    rr(g, -w / 2 - 20, -h / 2 - 20, w + 40, h + 40, 20); fillStroke(g, '#2a2735', 6);
    g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip(); g.fillStyle = '#0f1424'; g.fillRect(-w / 2, -h / 2, w, h); if (fn) fn(g, w, h); g.restore();
    g.restore();
  }
  /* the Denny's booth (1992 and 2026): a window, a red vinyl booth, a table; returns the table top y */
  function diner(g, t, o) {
    o = o || {}; var night = o.night;
    wall(g, night ? '#3b2a3a' : '#f0d9b0', night ? '#2a1f2d' : '#e0bf8c');
    /* window */
    rr(g, 300, 120, 1320, 430, 16); fillStroke(g, night ? '#1a2340' : '#9ed4f5', 8);
    g.save(); g.beginPath(); g.rect(300, 120, 1320, 430); g.clip();
    if (night) { for (var i = 0; i < 40; i++) { circ(g, 320 + hash(i) * 1280, 140 + hash(i + 4) * 200, 2); g.fillStyle = 'rgba(255,250,230,.6)'; g.fill(); } g.fillStyle = '#2a2f4a'; g.fillRect(300, 400, 1320, 150); for (i = 0; i < 6; i++) { var lx = ((i * 300 + t * 90) % 1700) + 200; glow(g, lx, 470, 60, 'rgba(255,220,140,.8)', 1); } }
    else { puff(g, 600 + (t * 10) % 300, 220, .8, 'rgba(255,255,255,.85)'); puff(g, 1300 - (t * 6) % 200, 260, .6, 'rgba(255,255,255,.75)'); g.fillStyle = '#c9b48a'; g.fillRect(300, 430, 1320, 120); }
    /* the diner's own sign, seen backwards through the glass */
    g.save(); g.translate(1380, 230); g.rotate(.03); rr(g, -150, -50, 300, 100, 18); fillStroke(g, '#ffd23d', 6); txt(g, "DENNY'S", 0, 4, 52, RED, { wt: 900, wide: true }); g.restore();
    g.restore();
    g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(960, 120); g.lineTo(960, 550); g.stroke();
    /* booth backs */
    [[120, 700], [1340, 700]].forEach(function (b) { rr(g, b[0], 470, 460, 360, 40); fillStroke(g, '#c0392b', 7); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 5; for (var k = 1; k < 4; k++) { g.beginPath(); g.moveTo(b[0] + k * 115, 490); g.lineTo(b[0] + k * 115, 810); g.stroke(); } });
    floorAt(g, 900, '#7a4b32');
    /* table */
    rr(g, 520, 690, 880, 54, 14); fillStroke(g, '#e8e2d2', 7); g.fillStyle = '#b9b2a2'; g.fillRect(940, 744, 40, 170); g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(940, 744, 40, 170);
    if (o.plaque) { var pk = o.plaque; g.save(); g.translate(960, 380); g.scale(pk, pk); rr(g, -330, -90, 660, 180, 14); fillStroke(g, '#c9a24a', 8); rr(g, -300, -62, 600, 124, 8); fillStroke(g, '#e8c66a', 4); txt(g, 'THE BOOTH THAT LAUNCHED', 0, -22, 32, INK, { wt: 900, wide: true }); txt(g, 'A $1 TRILLION COMPANY', 0, 30, 32, INK, { wt: 900, wide: true }); g.restore(); }
    return 690;
  }
  function mug(g, x, y, s, t, steam) {
    g.save(); g.translate(x, y); g.scale(s, s);
    if (steam) { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 5; g.lineCap = 'round'; for (var i = 0; i < 2; i++) { g.beginPath(); var x0 = -10 + i * 20; for (var k = 0; k < 8; k++) { var yy = -60 - k * 10, xx = x0 + Math.sin(t * 3 + k * .8 + i) * 7; if (k) g.lineTo(xx, yy); else g.moveTo(xx, yy); } g.stroke(); } }
    g.beginPath(); g.arc(34, -26, 16, -Math.PI / 2, Math.PI / 2); g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    rr(g, -32, -56, 64, 58, 10); fillStroke(g, CREAM, 5); g.fillStyle = '#6b3d1e'; g.fillRect(-26, -50, 52, 10);
    g.restore();
  }
  function plate(g, x, y, s) { g.save(); g.translate(x, y); g.scale(s, s); g.beginPath(); g.ellipse(0, 0, 90, 22, 0, 0, 6.283); fillStroke(g, '#fff', 5); g.beginPath(); g.ellipse(-20, -6, 30, 12, 0, 0, 6.283); fillStroke(g, '#fff8e6', 3); circ(g, -20, -8, 9); g.fillStyle = YEL; g.fill(); rr(g, 14, -14, 50, 14, 6); fillStroke(g, '#b5562c', 3); g.restore(); }
  /* hand-held props, drawn at the hand */
  function brush(g) { g.rotate(-.5); g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(0, 10); g.lineTo(0, -90); g.stroke(); g.strokeStyle = '#d6d0c0'; g.lineWidth = 4; g.stroke(); g.beginPath(); g.ellipse(0, -104, 18, 22, 0, 0, 6.283); fillStroke(g, '#5fb8d6', 4); }
  function tray(g) { g.beginPath(); g.ellipse(0, -6, 70, 12, 0, 0, 6.283); fillStroke(g, '#b9b2a2', 4); rr(g, -40, -40, 26, 32, 4); fillStroke(g, 'rgba(255,255,255,.8)', 3); mug(g, 22, -10, .5, 0, false); }
  function pad(g) { g.rotate(.15); rr(g, -26, -36, 52, 70, 6); fillStroke(g, CREAM, 4); g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 3; for (var i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-16, -18 + i * 14); g.lineTo(16, -18 + i * 14); g.stroke(); } }
  function plateH(g) { plate(g, 0, -6, .55); }
  function book(g) { g.rotate(-.1); rr(g, -46, -34, 92, 64, 6); fillStroke(g, '#3d7bff', 4); g.strokeStyle = CREAM; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -34); g.lineTo(0, 30); g.stroke(); txt(g, 'ABC', 0, -2, 24, CREAM, { wt: 900 }); }
  function marker(g) { g.rotate(.7); rr(g, -8, -50, 16, 60, 5); fillStroke(g, INK, 3); g.fillStyle = NV; g.fillRect(-8, -50, 16, 12); }
  function shovel(g) { g.rotate(-.35); g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 60); g.lineTo(0, -150); g.stroke(); g.strokeStyle = '#a8794a'; g.lineWidth = 6; g.stroke(); g.beginPath(); g.moveTo(-34, -150); g.lineTo(34, -150); g.lineTo(26, -230); g.quadraticCurveTo(0, -260, -26, -230); g.closePath(); fillStroke(g, '#c9c6d6', 5); }
  function pick(g) { g.rotate(-.6); g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 40); g.lineTo(0, -120); g.stroke(); g.strokeStyle = '#a8794a'; g.lineWidth = 6; g.stroke(); g.beginPath(); g.moveTo(-70, -100); g.quadraticCurveTo(0, -150, 70, -100); g.lineWidth = 16; g.strokeStyle = INK; g.stroke(); g.lineWidth = 8; g.strokeStyle = '#c9c6d6'; g.stroke(); }
  function phoneH(g) { phone(g, 0, -20, .6, -.2, '#9ee6ff'); }
  function smallCard(g) { g.rotate(-.2); gpuCard(g, 0, -40, .25, 0, { spin: 0 }); }
  /* a toilet, side view */
  function toilet(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    rr(g, -30, -230, 120, 130, 14); fillStroke(g, '#f4f1ea', 6);
    g.beginPath(); g.moveTo(-80, -110); g.lineTo(80, -110); g.quadraticCurveTo(80, -30, 20, -20); g.lineTo(30, 0); g.lineTo(-40, 0); g.lineTo(-30, -20); g.quadraticCurveTo(-90, -40, -80, -110); g.closePath(); fillStroke(g, '#f4f1ea', 6);
    g.beginPath(); g.ellipse(0, -112, 86, 14, 0, 0, 6.283); fillStroke(g, '#e8e2d4', 5); rr(g, 30, -214, 30, 10, 4); fillStroke(g, '#c9c6d6', 3);
    g.restore();
  }
  /* a toilet paper roll that can talk */
  function tpRoll(g, x, y, s, t, mood) {
    g.save(); g.translate(x, y); g.scale(s, s);
    rr(g, -70, -110, 140, 220, 30); fillStroke(g, '#fbf8f0', 6);
    g.beginPath(); g.ellipse(0, -110, 70, 22, 0, 0, 6.283); fillStroke(g, '#ffffff', 6); g.beginPath(); g.ellipse(0, -110, 24, 8, 0, 0, 6.283); fillStroke(g, '#b9a88a', 4);
    g.beginPath(); g.moveTo(70, -40); g.quadraticCurveTo(110, 40, 96, 150); g.lineTo(54, 150); g.quadraticCurveTo(66, 60, 70, -10); fillStroke(g, '#fbf8f0', 5);
    g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 6; [-1, 1].forEach(function (sd) { g.beginPath(); g.ellipse(sd * 24, -20, 8, 11, 0, 0, 6.283); g.fill(); g.beginPath(); g.moveTo(sd * 10, -46 + (mood === 'smug' ? 6 : 0)); g.lineTo(sd * 38, -50); g.stroke(); });
    g.beginPath(); if (mood === 'smug') { g.moveTo(-20, 20); g.quadraticCurveTo(4, 34, 26, 12); g.stroke(); } else { g.arc(0, 14, 16, Math.PI * .2, Math.PI * .8); g.stroke(); }
    g.restore();
  }
  /* a stock board column: a price tag on a ticker */
  function tag(g, s, x, y, k, o) {
    if (k <= 0) return; o = o || {}; var px = o.px || 60;
    g.save(); g.translate(x, y); g.rotate(o.rot || .06); g.scale(clamp(k, 0, 1.06), clamp(k, 0, 1.06));
    font(g, px, 900, DISP, true); var w = g.measureText(s).width + px * 1.4, h = px * 1.6;
    g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2 - 20, -h / 2); g.lineTo(w / 2 + 30, 0); g.lineTo(w / 2 - 20, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); fillStroke(g, o.bg || YEL, 6);
    circ(g, w / 2 - 6, 0, 10); fillStroke(g, CREAM, 4);
    txt(g, s, -14, 4, px, INK, { wt: 900, wide: true }); g.restore();
  }
  /* a date chip that slides into the top-right corner */
  function dateTag(g, s, t, t0, t1) {
    var k = pop(t, t0, 3, .7), out = t1 ? seg(t, t1 - .3, t1) : 0;
    if (k <= 0 || out >= 1) return;
    font(g, 54, 700, MONO, true); var w = g.measureText(s).width + 54 * .84;
    chip(g, s, 1830 - w / 2 + out * 400, 96, { px: 54, bg: CREAM, s: k, rot: .03, wide: true, fam: MONO, wt: 700 });
  }
  /* a keynote stage with a big screen */
  function stageSet(g, t, fn) {
    wall(g, '#0d0b18', '#1b1530');
    for (var i = 0; i < 5; i++) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .06; g.fillStyle = '#9fd0ff'; g.beginPath(); g.moveTo(200 + i * 380, -50); g.lineTo(120 + i * 380 + Math.sin(t * .6 + i) * 60, 900); g.lineTo(320 + i * 380 + Math.sin(t * .6 + i) * 60, 900); g.closePath(); g.fill(); g.restore(); }
    rr(g, 360, 90, 1200, 560, 18); fillStroke(g, '#05040a', 8);
    g.save(); g.beginPath(); g.rect(372, 102, 1176, 536); g.clip(); var gr = g.createLinearGradient(0, 100, 0, 640); gr.addColorStop(0, '#0f2a08'); gr.addColorStop(1, '#050a02'); g.fillStyle = gr; g.fillRect(372, 102, 1176, 536); if (fn) fn(g); g.restore();
    g.fillStyle = '#2a2438'; g.fillRect(-200, 860, W + 400, 300); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-200, 860, W + 400, 14);
    /* audience heads in silhouette */
    for (i = 0; i < 26; i++) { var hx = -40 + i * 80 + (hash(i) - .5) * 30, hy = 1040 + hash(i + 3) * 30; circ(g, hx, hy, 38); g.fillStyle = '#0b0912'; g.fill(); }
  }
  /* a big readout: a value that rolls up as k goes 0..1 */
  function bigNum(g, s, x, y, px, col, k, o) {
    if (k <= 0) return; o = o || {}; g.save(); g.translate(x, y); g.scale(clamp(k, 0, 1.06), clamp(k, 0, 1.06)); g.rotate(o.rot || 0);
    txt(g, s, 0, 0, px, col || CREAM, { wt: 900, wide: true, outline: px * .16 }); g.restore();
  }
  /* a stopwatch dial (from episode 2) */
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
  function fmtB(v, dp) { return v.toFixed(dp == null ? 0 : dp); }
  function money$(v) { return '$' + Math.round(v).toLocaleString('en-US'); }
