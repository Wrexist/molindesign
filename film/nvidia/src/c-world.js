
  /* ================================================================ the world */
  /* the Sun, a character: corona flames, a glow, a face. mood: calm | aah | sneeze | grin | smug | oops | sleepy */
  function sun(g, x, y, r, t, mood, o) {
    o = o || {};
    glow(g, x, y, r * 3.2, 'rgba(255,170,60,.55)', o.glow == null ? 1 : o.glow);
    g.save(); g.translate(x, y);
    var sq = mood === 'aah' ? 1 + .05 * Math.sin(t * 9) : 1, sy = mood === 'sneeze' ? .88 : 1;
    g.scale(sq * (mood === 'sneeze' ? 1.1 : 1), sq * sy);
    /* flames: two rings of soft spikes, counter-rotating */
    for (var ring = 0; ring < 2; ring++) {
      g.beginPath(); var n = 22, rot = t * (ring ? -.12 : .09);
      for (var i = 0; i <= n * 2; i++) {
        var a = rot + i / (n * 2) * 6.283, k = i % 2 ? 1 : 0, wob = Math.sin(t * 3 + i * 1.7 + ring) * .05;
        var rr0 = r * (k ? (ring ? 1.18 : 1.28) + wob + hash(i + ring * 40) * .06 : 1.02);
        if (i) g.lineTo(Math.cos(a) * rr0, Math.sin(a) * rr0); else g.moveTo(Math.cos(a) * rr0, Math.sin(a) * rr0);
      }
      g.closePath(); fillStroke(g, ring ? SUN2 : PLASMA, 6);
    }
    var gr = g.createRadialGradient(-r * .3, -r * .35, r * .1, 0, 0, r); gr.addColorStop(0, SUNHI); gr.addColorStop(.6, SUN); gr.addColorStop(1, '#ff9a24');
    circ(g, 0, 0, r); g.fillStyle = gr; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke();
    /* sunspots, the thing Carrington drew */
    if (o.spots) { [[-.35, .25, .09], [-.22, .32, .06], [.3, -.1, .07]].forEach(function (s2) { circ(g, s2[0] * r, s2[1] * r, s2[2] * r); g.fillStyle = 'rgba(150,70,20,.55)'; g.fill(); }); }
    /* face */
    var s = r / 200; g.scale(s, s); g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round'; g.lineWidth = 10;
    var blink = (t % 4.1) < .12 && mood !== 'sneeze' && mood !== 'aah';
    [-1, 1].forEach(function (sd) {
      var ex = sd * 62, ey = -30;
      if (mood === 'sneeze' || blink) { g.beginPath(); g.moveTo(ex - 24, ey + (mood === 'sneeze' ? -sd * 0 : 0)); g.lineTo(ex, ey + 12); g.lineTo(ex + 24, ey); g.stroke(); }
      else if (mood === 'aah') { g.beginPath(); g.moveTo(ex - 22, ey + 4); g.quadraticCurveTo(ex, ey - 14, ex + 22, ey + 4); g.stroke(); }
      else if (mood === 'sleepy') { g.beginPath(); g.arc(ex, ey, 20, 0, Math.PI); g.stroke(); }
      else if (mood === 'smug') { g.beginPath(); g.ellipse(ex, ey + 4, 16, 12, 0, 0, 6.283); g.fill(); g.lineWidth = 9; g.beginPath(); g.moveTo(ex - 26, ey - 10); g.lineTo(ex + 26, ey - 10); g.stroke(); }
      else { g.beginPath(); g.ellipse(ex, ey, 17, 23, 0, 0, 6.283); g.fill(); circ(g, ex - 6, ey - 9, 6); g.fillStyle = '#fff'; g.fill(); g.fillStyle = INK; }
      /* cheeks */
      circ(g, sd * 100, 40, 26); g.fillStyle = 'rgba(255,90,60,.35)'; g.fill(); g.fillStyle = INK;
    });
    if (mood === 'aah') { g.beginPath(); g.ellipse(0, 58, 34, 22 + 10 * Math.abs(Math.sin(t * 6)), 0, 0, 6.283); g.fill(); g.lineWidth = 8; g.beginPath(); g.moveTo(-52, -70); g.lineTo(-18, -62); g.moveTo(52, -70); g.lineTo(18, -62); g.stroke(); }
    else if (mood === 'sneeze') { g.beginPath(); g.ellipse(0, 58, 70, 50, 0, 0, 6.283); g.fill(); }
    else if (mood === 'grin' || mood === 'smug') { g.beginPath(); g.moveTo(-70, 40); g.quadraticCurveTo(0, 60, 70, 40); g.quadraticCurveTo(0, 130, -70, 40); g.fill(); }
    else if (mood === 'oops') { g.beginPath(); g.moveTo(-50, 64); g.lineTo(50, 64); g.stroke(); g.beginPath(); g.moveTo(-30, 64); g.lineTo(-26, 84); g.lineTo(-10, 84); g.lineTo(-12, 64); fillStroke(g, '#fff', 6); }
    else { g.beginPath(); g.arc(0, 30, 44, Math.PI * .2, Math.PI * .8); g.stroke(); }
    g.restore();
  }
  /* a CME: a lumpy, glowing cloud of plasma, k = 0..1 grows and roils */
  function plasma(g, x, y, r, t, a, face) {
    if (a <= 0 || r <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    glow(g, 0, 0, r * 2, 'rgba(255,120,40,.6)', 1);
    for (var layer = 0; layer < 3; layer++) {
      g.beginPath(); var n = 14;
      for (var i = 0; i <= n; i++) {
        var an = i / n * 6.283, rr0 = r * (1 - layer * .22) * (.85 + .18 * Math.sin(an * 3 + t * 3 + layer) + .08 * Math.sin(an * 5 - t * 4));
        var px = Math.cos(an) * rr0, py = Math.sin(an) * rr0 * .82;
        if (i) g.lineTo(px, py); else g.moveTo(px, py);
      }
      g.closePath(); fillStroke(g, ['#ff6a2a', '#ff9a3d', '#ffd27a'][layer], layer ? 0 : 7);
    }
    if (face) {
      var s = r / 160; g.scale(s, s); g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 9; g.lineCap = 'round';
      [-1, 1].forEach(function (sd) { g.beginPath(); g.ellipse(sd * 40, -14, 12, 16, 0, 0, 6.283); g.fill(); g.beginPath(); g.moveTo(sd * 18, -44); g.lineTo(sd * 62, -32); g.stroke(); });
      g.beginPath(); g.moveTo(-36, 34); g.quadraticCurveTo(0, 20, 36, 34); g.stroke();
    }
    g.restore();
  }
  /* starfield in three depths; px, py = camera parallax */
  function space(g, t, px, py, o) {
    o = o || {};
    var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, o.a || '#0c0a1e'); gr.addColorStop(1, o.b || '#1b1538'); g.fillStyle = gr; g.fillRect(-200, -200, W + 400, H + 400);
    /* nebula smudges */
    glow(g, 400 + (px || 0) * .1, 300, 700, 'rgba(120,60,200,.12)', 1); glow(g, 1500 + (px || 0) * .1, 800, 800, 'rgba(40,120,200,.1)', 1);
    var r = mulberry(21);
    for (var d = 0; d < 3; d++) {
      var par = [.15, .35, .7][d];
      for (var i = 0; i < [160, 70, 25][d]; i++) {
        var x = ((r() * (W + 400) - (px || 0) * par) % (W + 400) + W + 400) % (W + 400) - 200, y = ((r() * (H + 300) - (py || 0) * par) % (H + 300) + H + 300) % (H + 300) - 150;
        var tw = .55 + .45 * Math.sin(t * (1 + r() * 2) + i), sz = [1.1, 1.8, 2.8][d];
        circ(g, x, y, sz); g.fillStyle = 'rgba(255,248,230,' + (tw * [.45, .7, .9][d]) + ')'; g.fill();
        if (d === 2 && i % 4 === 0) { g.save(); g.globalAlpha = tw * .6; g.strokeStyle = '#fff8e6'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x + 9, y); g.moveTo(x, y - 9); g.lineTo(x, y + 9); g.stroke(); g.restore(); }
      }
    }
  }
  /* the globe: orthographic projection of the coastlines, lit from the sun side, city lights on the night side */
  function earth(g, x, y, r, t, o) {
    o = o || {};
    var lon0 = (o.lon == null ? -80 : o.lon) * Math.PI / 180, lat0 = (o.lat == null ? 22 : o.lat) * Math.PI / 180, light = o.light == null ? -1 : o.light;
    function P(lon, lat) {
      var l = lon * Math.PI / 180 - lon0, p = lat * Math.PI / 180;
      var cz = Math.sin(lat0) * Math.sin(p) + Math.cos(lat0) * Math.cos(p) * Math.cos(l);
      return [x + r * Math.cos(p) * Math.sin(l), y - r * (Math.cos(lat0) * Math.sin(p) - Math.sin(lat0) * Math.cos(p) * Math.cos(l)), cz];
    }
    if (o.field) magneto(g, x, y, r, t, o.field, o.squash || 0, light);
    glow(g, x, y, r * 1.35, 'rgba(90,170,255,.35)', 1);
    circ(g, x, y, r); var sea = g.createRadialGradient(x + light * r * .4, y - r * .3, r * .1, x, y, r); sea.addColorStop(0, '#3b8fd9'); sea.addColorStop(1, '#174a86'); g.fillStyle = sea; g.fill();
    g.save(); circ(g, x, y, r); g.clip();
    LAND.forEach(function (poly) {
      var pts = poly.map(function (p) { return P(p[0], p[1]); }), vis = pts.filter(function (p) { return p[2] > 0; }).length;
      if (!vis) return;
      g.beginPath(); pts.forEach(function (p, i) { var q = p[2] > 0 ? p : [x + (p[0] - x) / Math.hypot(p[0] - x, p[1] - y || 1) * r, y + (p[1] - y) / Math.hypot(p[0] - x, p[1] - y || 1) * r]; if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); g.closePath();
      g.fillStyle = o.land || '#58b36a'; g.fill(); g.lineWidth = Math.max(2, r * .012); g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke();
    });
    /* night side */
    var sh = g.createLinearGradient(x + light * r, y, x - light * r, y); sh.addColorStop(0, 'rgba(8,6,30,0)'); sh.addColorStop(.55, 'rgba(8,6,30,.15)'); sh.addColorStop(1, 'rgba(8,6,30,.7)'); g.fillStyle = sh; g.fillRect(x - r, y - r, r * 2, r * 2);
    if (o.lights !== false) {
      var lit = o.lightsOn == null ? 1 : o.lightsOn;
      Object.keys(CITY).forEach(function (k, i) {
        var p = P(CITY[k][0], CITY[k][1]); if (p[2] <= .05) return;
        var night = clamp(((p[0] - x) * -light / r + .2) * 1.6, 0, 1), on = typeof lit === 'function' ? lit(CITY[k], i) : lit;
        if (night * on <= 0) return; glow(g, p[0], p[1], r * .09, 'rgba(255,210,120,.9)', night * on); circ(g, p[0], p[1], r * .012); g.fillStyle = 'rgba(255,240,190,' + night * on + ')'; g.fill();
      });
    }
    g.restore();
    /* rim */
    circ(g, x, y, r); g.lineWidth = Math.max(4, r * .025); g.strokeStyle = INK; g.stroke();
    g.save(); g.beginPath(); g.arc(x, y, r * .93, light < 0 ? Math.PI * .75 : -Math.PI * .25, light < 0 ? Math.PI * 1.35 : Math.PI * .35); g.strokeStyle = 'rgba(200,240,255,.55)'; g.lineWidth = r * .03; g.lineCap = 'round'; g.stroke(); g.restore();
    if (o.aurora) { [-1, 1].forEach(function (sd) { g.save(); g.translate(x, y + sd * r * .82); g.scale(1, .35); glow(g, 0, 0, r * .55, 'rgba(93,255,176,.65)', o.aurora); g.restore(); }); }
    return P;
  }
  /* the magnetic field as nested loops; squash > 0 = the storm pushing on the day side */
  function magneto(g, x, y, r, t, a, squash, light) {
    g.save(); g.globalAlpha *= a; g.lineWidth = 4;
    for (var i = 1; i <= 4; i++) {
      var R = r * (1 + i * .45);
      g.beginPath();
      for (var k = 0; k <= 64; k++) {
        var th = k / 64 * 6.283, rr0 = R * (.55 + .45 * Math.abs(Math.cos(th)));
        var sideDay = Math.cos(th) * light > 0, sqz = sideDay ? 1 - squash * .35 * i / 4 : 1 + squash * .6 * i / 4;
        var wob = 1 + Math.sin(t * 4 + i + k * .3) * .02 * (1 + squash * 3);
        var px = x + Math.cos(th) * rr0 * sqz * wob, py = y + Math.sin(th) * rr0 * .62 * wob;
        if (k) g.lineTo(px, py); else g.moveTo(px, py);
      }
      g.closePath(); g.setLineDash([18, 14]); g.lineDashOffset = -t * 30 * (i % 2 ? 1 : -1); g.strokeStyle = 'rgba(143,233,255,' + (.55 - i * .08) + ')'; g.stroke();
    }
    g.restore();
  }
  /* aurora curtains across the top of a night sky */
  function aurora(g, t, a, y0, o) {
    if (a <= 0) return;
    o = o || {};
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha *= clamp(a, 0, 1);
    for (var band = 0; band < 3; band++) {
      var base = (y0 || 260) + band * 60, col = [AUR1, '#7dffd8', AUR2][band], h = [300, 220, 260][band];
      for (var x = -40; x < W + 40; x += 14) {
        var yy = base + Math.sin(x * .004 + t * .5 + band) * 70 + Math.sin(x * .011 - t * .8 + band * 2) * 26;
        var hh = h * (.6 + .4 * Math.sin(x * .02 + t * 1.3 + band * 3)), al = .09 + .07 * Math.sin(x * .03 + t * 2 + band);
        var gr = g.createLinearGradient(0, yy - hh, 0, yy); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.7, col); gr.addColorStop(1, 'rgba(255,255,255,.6)');
        g.globalAlpha = clamp(a, 0, 1) * al * (o.k || 1); g.fillStyle = gr; g.fillRect(x, yy - hh, 16, hh);
      }
    }
    g.restore();
  }
  /* a sky gradient with soft clouds drifting */
  function sky(g, t, top, bot, o) {
    o = o || {};
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(-200, -200, W + 400, H + 400);
    if (o.stars) { var r = mulberry(31); for (var i = 0; i < 120; i++) { var x = r() * W, y = r() * H * .6; circ(g, x, y, .8 + r() * 1.6); g.fillStyle = 'rgba(255,250,235,' + (o.stars * (.3 + .5 * Math.abs(Math.sin(t + i)))) + ')'; g.fill(); } }
    if (o.clouds) { for (i = 0; i < 4; i++) { var cx = ((i * 520 + t * (12 + i * 5)) % (W + 600)) - 300, cy = 160 + i * 70; puff(g, cx, cy, .8 + i * .2, o.clouds); } }
  }
  function puff(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s, s); g.beginPath();
    g.arc(-60, 10, 40, Math.PI * .5, Math.PI * 1.5); g.arc(-15, -25, 52, Math.PI, Math.PI * 1.9); g.arc(50, -5, 45, Math.PI * 1.3, Math.PI * .3); g.lineTo(-60, 50); g.closePath();
    g.fillStyle = col; g.fill(); g.restore();
  }
  function ground(g, y, col, col2, o) {
    o = o || {};
    g.beginPath(); g.moveTo(-200, y); for (var x = -200; x <= W + 200; x += 60) g.lineTo(x, y + Math.sin(x * .004 + (o.ph || 0)) * (o.amp == null ? 10 : o.amp)); g.lineTo(W + 200, H + 200); g.lineTo(-200, H + 200); g.closePath();
    var gr = g.createLinearGradient(0, y, 0, H); gr.addColorStop(0, col); gr.addColorStop(1, col2 || col); g.fillStyle = gr; g.fill(); g.lineWidth = 6; g.strokeStyle = INK; g.stroke();
  }
  function palm(g, x, y, s, t, col) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(10, -150, 40, -300); g.lineTo(58, -298); g.quadraticCurveTo(30, -150, 14, 0); g.closePath(); fillStroke(g, col || '#3a2f4a', 5);
    for (var i = 0; i < 6; i++) { var a = -Math.PI / 2 + (i - 2.5) * .55 + Math.sin(t * 1.2 + i) * .05; g.save(); g.translate(48, -300); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(80, -40, 170, 20); g.quadraticCurveTo(80, -10, 0, 10); g.closePath(); fillStroke(g, col || '#2a2238', 4); g.restore(); }
    g.restore();
  }
  /* a lattice power pylon with drooping wires; lit wires glow */
  function pylon(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = col || INK; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-40, 0); g.lineTo(-10, -260); g.lineTo(10, -260); g.lineTo(40, 0); g.moveTo(-60, -200); g.lineTo(60, -200); g.moveTo(-80, -160); g.lineTo(80, -160);
    for (var k = 0; k < 6; k++) { var y0 = -k * 40, y1 = -(k + 1) * 40, w0 = 40 - k * 5, w1 = 40 - (k + 1) * 5; g.moveTo(-w0, y0); g.lineTo(w1, y1); g.moveTo(w0, y0); g.lineTo(-w1, y1); }
    g.stroke(); g.restore();
  }
  function wires(g, xs, y, s, t, lit, col) {
    [-200, -160].forEach(function (dy, row) {
      [-1, 1].forEach(function (sd) {
        for (var i = 0; i + 1 < xs.length; i++) {
          var x0 = xs[i] + sd * (row ? 80 : 60) * s, x1 = xs[i + 1] + sd * (row ? 80 : 60) * s, yy = y + dy * s;
          g.beginPath(); g.moveTo(x0, yy); g.quadraticCurveTo((x0 + x1) / 2, yy + 60 * s, x1, yy);
          g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
          if (lit > 0) { g.save(); g.setLineDash([20, 70]); g.lineDashOffset = -t * 500 - i * 30; g.strokeStyle = col || YEL; g.globalAlpha = clamp(lit, 0, 1); g.shadowColor = col || YEL; g.shadowBlur = 12; g.lineWidth = 4; g.stroke(); g.restore(); }
        }
      });
    });
  }
  function house(g, x, y, s, lit, col) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.beginPath(); g.rect(-90, -120, 180, 120); fillStroke(g, col || '#6a5590', 5);
    g.beginPath(); g.moveTo(-110, -118); g.lineTo(0, -200); g.lineTo(110, -118); g.closePath(); fillStroke(g, '#3e3155', 5);
    [[-50, -80], [30, -80]].forEach(function (w) { rr(g, w[0], w[1], 36, 34, 4); fillStroke(g, lit > 0 ? 'rgba(255,214,122,' + (.25 + .75 * lit) + ')' : '#2a2340', 4); });
    rr(g, -14, -56, 30, 56, 4); fillStroke(g, '#3e3155', 4);
    if (lit > 0) glow(g, 0, -60, 160, 'rgba(255,200,110,.35)', lit);
    g.restore();
  }
  function satellite(g, x, y, s, rot, o) {
    o = o || {};
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(-120, 0); g.lineTo(120, 0); g.stroke();
    [-1, 1].forEach(function (sd) { rr(g, sd < 0 ? -190 : 70, -30, 120, 60, 4); fillStroke(g, '#3d64b8', 5); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 2; for (var i = 1; i < 4; i++) { g.beginPath(); g.moveTo((sd < 0 ? -190 : 70) + i * 30, -28); g.lineTo((sd < 0 ? -190 : 70) + i * 30, 28); g.stroke(); } });
    rr(g, -42, -42, 84, 84, 8); fillStroke(g, o.body || '#d6a043', 5);
    if (o.cam) { circ(g, 0, 0, 26); fillStroke(g, '#2a2638', 5); circ(g, 0, 0, 14); g.fillStyle = o.camLit ? '#7dfcff' : '#4a6bd8'; g.fill(); circ(g, -5, -5, 4); g.fillStyle = '#fff'; g.fill(); circ(g, 26, -26, 6); g.fillStyle = o.camLit ? RED : '#5a2a2a'; g.fill(); }
    else { g.beginPath(); g.arc(0, 42, 26, Math.PI, 0); fillStroke(g, CREAM, 5); }
    if (o.eyes) { g.fillStyle = INK; if (o.eyes === 'shut') { g.lineWidth = 5; g.beginPath(); g.moveTo(-26, -8); g.lineTo(-8, -8); g.moveTo(8, -8); g.lineTo(26, -8); g.stroke(); txt(g, 'z', 52, -60, 34, CREAM, { wt: 900, outline: 6 }); } else { circ(g, -16, -8, 7); g.fill(); circ(g, 16, -8, 7); g.fill(); } }
    g.restore();
  }
  function phone(g, x, y, s, rot, screen) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    rr(g, -36, -66, 72, 132, 14); fillStroke(g, '#2a2638', 5);
    rr(g, -29, -56, 58, 112, 8); g.fillStyle = screen || '#9ee6ff'; g.fill(); g.restore();
  }
  function card(g, x, y, w, h, rot, a, fn, col) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(8,6,18,.45)'; g.fillRect(-w / 2 + 12, -h / 2 + 16, w, h);
    g.beginPath(); g.rect(-w / 2, -h / 2, w, h); fillStroke(g, col || PAPER, 5);
    var cw0 = CARDW; CARDW = w - 40; if (fn) fn(g, w, h); CARDW = cw0;
    g.restore();
  }
  function tape(g, x, y, rot) { g.save(); g.translate(x, y); g.rotate(rot || 0); g.fillStyle = 'rgba(255,240,190,.75)'; g.fillRect(-50, -16, 100, 32); g.restore(); }
  /* a big number that rolls up from 0 as k goes 0..1 */
  function counter(g, x, y, k, to, px, col, o) {
    o = o || {}; var v = to * eo(clamp(k, 0, 1)), v = o.step ? roll(v, to, o.step) : v; var s = o.fmt ? o.fmt(v) : Math.round(v).toLocaleString('en-US');
    txt(g, (o.pre || '') + s + (o.post || ''), x, y, px, col || CREAM, { wt: 900, wide: true, outline: o.outline == null ? px * .14 : o.outline });
  }

  /* ---------- the world map (lon, lat), from episode 1 ---------- */
  var LAND = [
    [[-168, 65], [-162, 71], [-140, 70], [-120, 73], [-95, 72], [-80, 74], [-62, 66], [-55, 52], [-66, 45], [-70, 42], [-76, 35], [-81, 31], [-80, 25], [-83, 29], [-90, 30], [-97, 27], [-97, 21], [-92, 18], [-87, 21], [-88, 15], [-83, 9], [-79, 8], [-85, 11], [-92, 14], [-105, 20], [-110, 24], [-115, 30], [-118, 34], [-124, 40], [-124, 48], [-130, 55], [-140, 60], [-150, 60], [-158, 57], [-165, 60]],
    [[-55, 60], [-43, 60], [-20, 70], [-20, 80], [-40, 83], [-65, 80], [-58, 75], [-52, 68]],
    [[-80, 9], [-72, 12], [-62, 11], [-50, 0], [-35, -5], [-39, -14], [-41, -22], [-48, -26], [-53, -34], [-58, -38], [-65, -42], [-68, -50], [-70, -55], [-74, -52], [-73, -40], [-71, -30], [-70, -18], [-76, -14], [-81, -6], [-80, 0], [-77, 4]],
    [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [5, 53], [8, 57], [5, 62], [14, 67], [25, 71], [40, 68], [55, 70], [70, 73], [90, 76], [110, 77], [140, 72], [160, 70], [180, 68], [180, 64], [170, 60], [160, 58], [156, 51], [142, 47], [140, 40], [130, 35], [127, 38], [122, 40], [121, 31], [117, 24], [110, 21], [108, 16], [109, 12], [105, 9], [100, 13], [100, 7], [104, 1], [98, 8], [97, 17], [92, 22], [88, 22], [80, 15], [78, 8], [73, 17], [72, 21], [66, 25], [57, 26], [56, 24], [52, 24], [50, 30], [48, 29], [54, 17], [45, 13], [43, 17], [35, 28], [34, 31], [36, 36], [30, 36], [27, 37], [26, 40], [23, 36], [20, 40], [16, 38], [18, 40], [13, 45], [8, 44], [3, 43], [-4, 37]],
    [[-17, 21], [-16, 28], [-9, 33], [-5, 36], [10, 37], [11, 33], [20, 31], [32, 31], [34, 28], [38, 18], [43, 12], [51, 12], [48, 5], [40, -3], [40, -11], [35, -20], [33, -26], [27, -34], [19, -35], [16, -28], [12, -17], [13, -8], [9, -1], [9, 4], [4, 6], [-8, 4], [-13, 8], [-17, 14]],
    [[-5, 50], [1, 51], [2, 53], [-1, 55], [-2, 58], [-5, 58], [-6, 56], [-3, 54], [-5, 52]],
    [[-24, 64], [-14, 64], [-15, 66], [-22, 66]],
    [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [135, -35], [129, -32], [115, -34]],
    [[130, 31], [135, 34], [141, 36], [142, 40], [141, 45], [143, 44], [140, 41], [136, 35], [131, 34]],
    [[95, 5], [106, -6], [102, -4]], [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3]], [[131, -1], [141, -3], [150, -10], [141, -9]],
    [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]], [[172, -34], [178, -38], [174, -41], [167, -46], [171, -44]]
  ];
  var CITY = { ny: [-74, 40.7], dc: [-77, 38.9], chi: [-87.6, 41.9], la: [-118, 34], hou: [-95.4, 29.8], mia: [-80.2, 25.8], sea: [-122.3, 47.6], den: [-105, 39.7], atl: [-84.4, 33.7], dal: [-96.8, 32.8], phx: [-112, 33.4], mon: [-73.6, 45.5], qc: [-71.2, 46.8], tor: [-79.4, 43.7], mex: [-99.1, 19.4], bog: [-74, 4.6], sp: [-46.6, -23.5], ba: [-58.4, -34.6], lon: [-.1, 51.5], par: [2.3, 48.9], ber: [13.4, 52.5], mad: [-3.7, 40.4], rom: [12.5, 41.9], cai: [31.2, 30], lag: [3.4, 6.5], jnb: [28, -26.2], mos: [37.6, 55.8], dub: [55.3, 25.2], del: [77.2, 28.6], mum: [72.8, 19], bkk: [100.5, 13.8], sg: [103.8, 1.3], hk: [114.2, 22.3], sha: [121.5, 31.2], bei: [116.4, 39.9], seo: [127, 37.6], tok: [139.7, 35.7], syd: [151.2, -33.9], hav: [-82.4, 23.1] };
