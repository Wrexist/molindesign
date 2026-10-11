/* comic-panel-spot-color: charcoal ground, procedural B&W hatching, one red + one muted gold, hard-cut floating frames that re-cut to open a scene, white disc cursor. */
(function () {
  var ID = 'comic-panel-spot-color';
  var GROUND = '#1d1d1d', INK = '#121212', PAPER = '#ffffff', SPOT = '#c82924', SPOT_ART = '#be261e', GOLD = '#b0976a';
  var SW = 1000, SH = 700;
  var SCENES = [
    { n: 'I', t: 'The cellar', c: 'Below the old house, the keeper finds the last bottle. Nobody has touched it in a hundred years.' },
    { n: 'II', t: 'The pilgrim', c: 'Under a gold moon, a stranger in a red cloak climbs the hill to meet him.' },
    { n: 'III', t: 'The beam', c: 'He pours one glass, and in an instant a beam of light fills the room.' }
  ];
  function bez(x1, y1, x2, y2) {
    return function (t) {
      var u = t;
      for (var i = 0; i < 8; i++) {
        var x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u - t;
        var d = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
        if (Math.abs(d) < 1e-6) break;
        u = Math.min(1, Math.max(0, u - x / d));
      }
      return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
    };
  }
  var EASE = bez(0.7, 0, 0.2, 1);
  // value noise for hand-drawn wobble
  function hash(x, y) { var s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vn(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  var inC = function (x, y, cx, cy, r) { var dx = x - cx, dy = y - cy; return dx * dx + dy * dy < r * r; };
  var inR = function (x, y, x0, y0, x1, y1) { return x >= x0 && x <= x1 && y >= y0 && y <= y1; };
  function inP(x, y, p) {
    var c = false;
    for (var i = 0, j = p.length - 1; i < p.length; j = i++) {
      if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c;
    }
    return c;
  }
  function sphere(x, y, cx, cy, r) { var nx = (x - cx) / r, ny = (y - cy) / r; return 0.3 + 0.6 * Math.max(0, Math.min(1, 0.5 + 0.7 * (nx * 0.6 + ny * 0.5))); }
  // hatch families: angle, darkness threshold, spacing (cross-hatching builds up with darkness)
  function hatch(g, shade) {
    var fams = [[Math.PI / 4, 0.2, 9, 1.5], [-Math.PI / 4, 0.44, 9, 1.4], [0, 0.66, 7, 1.2], [Math.PI / 2, 0.86, 5, 1.1]];
    var R = Math.hypot(SW, SH) / 2, cx = SW / 2, cy = SH / 2;
    g.strokeStyle = INK; g.lineCap = 'round';
    fams.forEach(function (f) {
      var dx = Math.cos(f[0]), dy = Math.sin(f[0]), nx = -dy, ny = dx;
      g.lineWidth = f[3]; g.beginPath();
      for (var o = -R; o <= R; o += f[2]) {
        var pen = false, k = 0;
        for (var t = -R; t <= R; t += 4) {
          var x = cx + nx * o + dx * t, y = cy + ny * o + dy * t;
          var on = x >= 0 && y >= 0 && x < SW && y < SH && shade(x, y) + (vn(x * 0.02, y * 0.02) - 0.5) * 0.08 > f[1];
          var w = (vn(x * 0.04 + o * 0.1, y * 0.04) - 0.5) * 1.2;
          if (on && !pen) { g.moveTo(x + nx * w, y + ny * w); pen = true; k = 0; }
          else if (on && ++k % 3 === 0) g.lineTo(x + nx * w, y + ny * w);
          else if (!on && pen) { g.lineTo(x, y); pen = false; }
        }
      }
      g.stroke();
    });
  }
  function poly(g, pts, fill, stroke, lw) {
    g.beginPath(); pts.forEach(function (p, i) { i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 4; g.lineJoin = 'round'; g.stroke(); }
  }
  // shade the right side of a spot shape with a few ink lines (spot colour still reads first)
  function spotShade(g, pts, x0) {
    g.save(); g.beginPath(); pts.forEach(function (p, i) { i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); g.clip();
    g.strokeStyle = INK; g.lineWidth = 1.6; g.beginPath();
    for (var x = x0; x < SW; x += 7) { g.moveTo(x, 0); g.lineTo(x - 300, 300); g.moveTo(x, 300); g.lineTo(x - 400, 700); }
    g.stroke(); g.restore();
  }
  var BOTTLE = [[420, 560], [420, 380], [432, 352], [455, 330], [455, 262], [450, 250], [490, 250], [485, 262], [485, 330], [508, 352], [520, 380], [520, 560]];
  var CLOAK = [[360, 318], [384, 340], [392, 372], [408, 498], [312, 498], [330, 372], [338, 340]];
  var GOBLET = [[440, 380], [560, 380], [552, 420], [528, 446], [508, 454], [506, 520], [540, 536], [460, 536], [494, 520], [492, 454], [472, 446], [448, 420]];
  var DRAW = [
    function (g) {
      hatch(g, function (x, y) {
        if (inR(x, y, 110, 80, 300, 300)) return (Math.abs(x - 205) < 6 || Math.abs(y - 190) < 6) ? 0.95 : 0.02;
        if (inR(x, y, 96, 66, 314, 314)) return 0.92;
        var beam = inP(x, y, [[110, 300], [300, 300], [620, 560], [340, 560]]);
        if (y > 560) return inC(x, y * 4, 470, 2280, 140) ? 0.97 : (y < 572 ? 0.25 : 0.62 + 0.3 * (y - 560) / 140);
        if (inC(x, y, 800, 320, 110)) return Math.abs(y - 270) < 8 || Math.abs(y - 370) < 8 ? 0.95 : sphere(x, y, 800, 320, 110);
        if (inC(x, y, 880, 480, 92)) return Math.abs(y - 450) < 7 ? 0.95 : sphere(x, y, 880, 480, 92);
        if (inC(x, y, 700, 470, 86)) return Math.abs(y - 500) < 7 ? 0.95 : sphere(x, y, 700, 470, 86);
        var v = 0.5 + 0.35 * Math.min(1, Math.hypot(x - 260, y - 330) / 700);
        return beam ? v - 0.42 : v;
      });
      g.strokeStyle = INK; g.lineWidth = 4;
      [[800, 320, 110], [880, 480, 92], [700, 470, 86]].forEach(function (c) { g.beginPath(); g.arc(c[0], c[1], c[2], 0, 7); g.stroke(); });
      g.strokeRect(110, 80, 190, 220);
      poly(g, BOTTLE, SPOT_ART); spotShade(g, BOTTLE, 492);
      g.fillStyle = PAPER; g.fillRect(432, 390, 10, 140);
      g.fillStyle = GOLD; g.fillRect(432, 440, 76, 46);
      poly(g, BOTTLE, null, INK, 5); g.strokeRect(432, 440, 76, 46);
    },
    function (g) {
      var hill = function (x) { return 470 + 50 * Math.sin(x / 170) + 24 * Math.sin(x / 60 + 1); };
      var back = function (x) { return 420 + 46 * Math.sin(x / 230 + 2); };
      hatch(g, function (x, y) {
        if (inC(x, y, 720, 190, 92)) return 0;
        if (y > hill(x)) return 0.93;
        if (y > back(x)) return 0.76;
        var r = Math.hypot(x - 720, y - 190);
        if (r < 210) return 0.3 + 0.4 * (r - 92) / 118;
        return 0.62 + 0.25 * (1 - y / 700);
      });
      g.fillStyle = GOLD; g.beginPath(); g.arc(720, 190, 92, 0, 7); g.fill();
      g.strokeStyle = INK; g.lineWidth = 4; g.stroke();
      g.fillStyle = PAPER;
      for (var i = 0; i < 26; i++) { var sx = hash(i, 3) * SW, sy = hash(i, 9) * 330; if (Math.hypot(sx - 720, sy - 190) > 220) { g.fillRect(sx, sy, 3, 3); } }
      poly(g, CLOAK, SPOT_ART); spotShade(g, CLOAK, 366);
      g.fillStyle = INK; g.beginPath(); g.ellipse(360, 352, 11, 14, 0, 0, 7); g.fill();
      poly(g, CLOAK, null, INK, 5);
      g.lineWidth = 5; g.beginPath(); g.moveTo(410, 300); g.lineTo(420, 505); g.stroke();
    },
    function (g) {
      var BEAM = [[430, 0], [570, 0], [700, 700], [300, 700]];
      hatch(g, function (x, y) {
        var inb = inP(x, y, BEAM);
        if (y > 560) return inb ? 0.18 + 0.1 * Math.abs(x - 500) / 200 : 0.8;
        if (inb) return 0.05 + 0.25 * Math.abs(x - 500) / (70 + y * 0.19);
        return 0.86 - 0.12 * Math.max(0, 1 - Math.abs(x - 500) / 420);
      });
      g.strokeStyle = INK; g.lineWidth = 3;
      g.beginPath(); g.moveTo(430, 0); g.lineTo(300, 700); g.moveTo(570, 0); g.lineTo(700, 700); g.stroke();
      g.fillStyle = PAPER;
      for (var i = 0; i < 40; i++) { var t = hash(i, 5), sy = 40 + hash(i, 7) * 480, half = 70 + sy * 0.19; g.fillRect(500 + (t - 0.5) * half * 1.6, sy, 2.5, 2.5); }
      poly(g, GOBLET, SPOT_ART); spotShade(g, GOBLET, 512);
      g.fillStyle = PAPER; g.fillRect(452, 388, 8, 26);
      poly(g, GOBLET, null, INK, 5);
    }
  ];

  Lib.register(ID, {
    hint: 'Open a frame: click, or Tab to it and press Enter; Esc to go back',
    notes: [
      'Palette: ground <code>#1d1d1d</code>, ink <code>#121212</code>, spot <code>#c82924</code> (art <code>#be261e</code>), gold <code>#b0976a</code>; art is mono + one red + at most one gold',
      'Red on charcoal is only ≈ 3:1, so use it for ≥ 24 px type, hover/focus (<code>.1s</code>) and the one coloured object per scene',
      'Frames are four corner points (skew ≤ 4°) re-cut over .8 s <code>cubic-bezier(.7,0,.2,1)</code>; reduced motion swaps them instantly',
      'Disc cursor 120 px, white, <code>3px solid #000</code>, 16 px uppercase label; buttons 96×48 with a 3 px white stroke',
      'Story text stays real DOM: uppercase, third-person caption boxes'
    ],
    simplified: 'Canvas 2D hatching (four line families by darkness) stands in for the WebGL frame and hatch shaders; scenes are simple procedural shapes, and frame layout is inferred like the skill\'s CSS approximation.',
    css: [
      '.d-' + ID + ' { background: ' + GROUND + '; }',
      '.d-' + ID + ' canvas { position: absolute; inset: 0; }',
      '.d-' + ID + ' .ttl { position: absolute; left: 5%; top: 4.5%; margin: 0; pointer-events: none; color: #fff; font-family: Archivo, sans-serif; font-stretch: 62%; font-weight: 800; text-transform: uppercase; letter-spacing: .005em; line-height: 1; font-size: clamp(24px, 5.2cqw, 46px); }',
      '.d-' + ID + ' { container-type: size; }',
      '.d-' + ID + ' .ttl span { color: ' + SPOT + '; }',
      '.d-' + ID + ' .hit { position: absolute; border-radius: 0; }',
      '.d-' + ID + ' .hit:focus-visible { outline: none; }',
      '.d-' + ID + ' .back { position: absolute; right: 5%; top: 4%; width: 96px; height: 48px; border: 3px solid #fff; color: #fff; font-family: Archivo, sans-serif; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; font-size: 13px; transition: color .1s, border-color .1s; }',
      '@media (hover: hover) and (pointer: fine) { .d-' + ID + ' .back:hover { color: ' + SPOT + '; border-color: ' + SPOT + '; } }',
      '.d-' + ID + ' .back:focus-visible { color: ' + SPOT + '; border-color: ' + SPOT + '; outline: none; }',
      '.d-' + ID + ' .cap { position: absolute; right: 6%; bottom: 8%; max-width: min(320px, 44%); margin: 0; padding: 12px 14px; background: #fff; color: ' + INK + '; border: 3px solid ' + INK + '; transform: rotate(-1deg); font-family: Archivo, sans-serif; font-weight: 800; font-size: 13px; line-height: 1.35; text-transform: uppercase; letter-spacing: .02em; box-shadow: 6px 6px 0 rgb(0 0 0 / .5); }',
      '.d-' + ID + ' .cap b { display: block; color: ' + SPOT + '; font-size: 24px; font-stretch: 62%; line-height: 1; margin-bottom: 4px; }',
      '.d-' + ID + ' .cap, .d-' + ID + ' .back { opacity: 0; visibility: hidden; transition: opacity .4s, visibility 0s .4s; }',
      '.d-' + ID + '.is-open .cap, .d-' + ID + '.is-open .back { opacity: 1; visibility: visible; transition: opacity .4s .45s, visibility 0s; }',
      '.d-' + ID + ' .disc { position: absolute; left: 0; top: 0; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%; background: #fff; border: 3px solid #000; display: grid; place-items: center; pointer-events: none; z-index: 5; color: #000; font: 800 16px/1 Archivo, sans-serif; text-transform: uppercase; letter-spacing: .04em; transition: scale .4s cubic-bezier(.215,.61,.355,1), opacity .3s; scale: .12; opacity: 0; }',
      '.d-' + ID + ' .disc span { transition: opacity .2s; opacity: 0; }',
      '.d-' + ID + ' .disc.big { scale: 1; } .d-' + ID + ' .disc.big span { opacity: 1; }',
      '.d-' + ID + '.stage[data-native-cursor][data-disc], .d-' + ID + '.stage[data-native-cursor][data-disc] * { cursor: none !important; }',
      '@container (max-aspect-ratio: 1/1) { .d-' + ID + ' .cap { max-width: none; left: 5%; right: 5%; bottom: 3.5%; transform: rotate(-.6deg); font-size: 12px; } .d-' + ID + ' .cap b { font-size: 20px; } .d-' + ID + '.is-open .ttl { opacity: 0; } }',
      '.d-' + ID + ' .ttl { transition: opacity .3s; }',
      '@media (prefers-reduced-motion: reduce) { .d-' + ID + ' .cap, .d-' + ID + ' .back { transition: none !important; } }'
    ].join('\n'),
    mount: function (stage, ctx) {
      var el = ctx.el;
      var cv = el('canvas'), g = cv.getContext('2d');
      cv.setAttribute('aria-hidden', 'true');
      var ttl = el('p', 'ttl', 'The keeper\'s <span>night</span>');
      var cap = el('p', 'cap'); cap.setAttribute('aria-live', 'polite');
      var back = el('button', 'back', 'Back'); back.type = 'button';
      var disc = el('div', 'disc', '<span>Open</span>'); disc.setAttribute('aria-hidden', 'true');
      stage.appendChild(cv); stage.appendChild(ttl);
      var useDisc = ctx.fine && !ctx.reduced;
      stage.setAttribute('data-native-cursor', '');
      if (useDisc) { stage.setAttribute('data-disc', ''); stage.appendChild(disc); }
      var arts = [], hits = [];
      SCENES.forEach(function (s, i) {
        var b = el('button', 'hit'); b.type = 'button';
        b.setAttribute('aria-label', 'Open frame ' + (i + 1) + ' of 3: ' + s.t);
        b.addEventListener('click', function () { open(i); });
        b.addEventListener('pointerenter', function () { hover = i; dirty = true; });
        b.addEventListener('pointerleave', function () { if (hover === i) hover = -1; dirty = true; });
        b.addEventListener('focus', function () { hover = i; dirty = true; });
        b.addEventListener('blur', function () { if (hover === i) hover = -1; dirty = true; });
        stage.appendChild(b); hits.push(b);
      });
      stage.appendChild(cap); stage.appendChild(back);

      var W = 1, H = 1, dpr = 1, portrait = false, opened = -1, hover = -1, dirty = true;
      var cur = null, from = null, to = null, animT = 1;
      var mx = 0.5, my = 0.5, px = 0.5, py = 0.5, dX = -200, dY = -200, inside = false;
      function jit(i, k) { return (hash(i * 4 + k, 17) - 0.5) * 0.026; }
      function rectPts(r, i) { return [[r[0] + jit(i, 0), r[1] + jit(i, 1)], [r[2] + jit(i, 2), r[1] + jit(i, 3)], [r[2] + jit(i, 4), r[3] + jit(i, 5)], [r[0] + jit(i, 6), r[3] + jit(i, 7)]]; }
      function closedRects() {
        return portrait
          ? [[0.06, 0.17, 0.94, 0.5], [0.06, 0.54, 0.48, 0.93], [0.52, 0.54, 0.94, 0.93]]
          : [[0.05, 0.19, 0.47, 0.88], [0.51, 0.13, 0.95, 0.51], [0.54, 0.56, 0.93, 0.88]];
      }
      function target() {
        var rs = closedRects();
        return rs.map(function (r, i) {
          if (opened < 0) return rectPts(r, i);
          if (i === opened) return rectPts(portrait ? [0.05, 0.18, 0.95, 0.73] : [0.04, 0.17, 0.96, 0.94], i + 5);
          var cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
          return [[cx, cy], [cx, cy], [cx, cy], [cx, cy]];
        });
      }
      function go() {
        to = target();
        if (!cur || ctx.reduced) { cur = to; animT = 1; } else { from = cur.map(function (p) { return p.map(function (q) { return q.slice(); }); }); animT = 0; }
        var rs = closedRects();
        hits.forEach(function (b, i) {
          var r = rs[i];
          b.style.left = r[0] * 100 + '%'; b.style.top = r[1] * 100 + '%';
          b.style.width = (r[2] - r[0]) * 100 + '%'; b.style.height = (r[3] - r[1]) * 100 + '%';
          b.hidden = opened >= 0;
        });
        dirty = true;
      }
      function open(i) {
        opened = i; hover = -1;
        var s = SCENES[i];
        cap.innerHTML = '<b>Chapter ' + s.n + ' · ' + s.t + '</b>' + s.c;
        stage.classList.add('is-open'); go();
        back.focus({ preventScroll: true });
      }
      function close() {
        if (opened < 0) return;
        var was = opened; opened = -1; stage.classList.remove('is-open'); go();
        hits[was].focus({ preventScroll: true });
      }
      back.addEventListener('click', close);
      cv.addEventListener('click', function () { if (opened >= 0) close(); });
      function onKey(e) { if (e.key === 'Escape' && opened >= 0) { e.stopPropagation(); close(); } }
      stage.addEventListener('keydown', onKey);
      function onMove(e) {
        var r = stage.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height; inside = true;
        if (e.pointerType !== 'mouse') return;
        var big = opened >= 0 ? e.target === cv || e.target === back : hover >= 0;
        disc.classList.toggle('big', big);
        disc.firstChild.textContent = opened >= 0 ? 'Back' : 'Open';
        disc.style.opacity = '1';
      }
      function onLeave() { inside = false; disc.style.opacity = '0'; mx = 0.5; my = 0.5; }
      stage.addEventListener('pointermove', onMove);
      stage.addEventListener('pointerleave', onLeave);

      function render() {
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.fillStyle = GROUND; g.fillRect(0, 0, W, H);
        var order = [0, 1, 2]; if (opened >= 0) { order.splice(opened, 1); order.push(opened); }
        order.forEach(function (i) {
          var pts = cur[i].map(function (p) { return [p[0] * W, p[1] * H]; });
          var x0 = Math.min(pts[0][0], pts[3][0]), x1 = Math.max(pts[1][0], pts[2][0]);
          var y0 = Math.min(pts[0][1], pts[1][1]), y1 = Math.max(pts[2][1], pts[3][1]);
          var bw = x1 - x0, bh = y1 - y0;
          if (bw < 2 || bh < 2) return;
          g.save(); g.beginPath(); pts.forEach(function (p, k) { k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); g.clip();
          if (arts[i]) {
            var s = Math.max(bw / SW, bh / SH) * 1.06, iw = SW * s, ih = SH * s;
            var ox = ctx.reduced ? 0 : (px - 0.5) * -0.04 * iw, oy = ctx.reduced ? 0 : (py - 0.5) * -0.04 * ih;
            g.drawImage(arts[i], x0 + (bw - iw) / 2 + ox, y0 + (bh - ih) / 2 + oy, iw, ih);
          } else { g.fillStyle = '#e8e8e8'; g.fillRect(x0, y0, bw, bh); }
          g.restore();
          g.beginPath(); pts.forEach(function (p, k) { k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath();
          g.lineWidth = 3; g.lineJoin = 'miter'; g.strokeStyle = hover === i ? SPOT : PAPER; g.stroke();
          if (bw > 60 && opened < 0) {            // roman-numeral tab in the corner
            var tx = pts[0][0] + 10, ty = pts[0][1] + 10;
            g.fillStyle = PAPER; g.fillRect(tx, ty, 34, 24); g.strokeStyle = INK; g.lineWidth = 2; g.strokeRect(tx, ty, 34, 24);
            g.fillStyle = hover === i ? SPOT : INK; g.font = '800 13px Archivo, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText(SCENES[i].n, tx + 17, ty + 12.5);
          }
        });
      }
      var lp = ctx.loop(function (dt) {
        if (animT < 1) {
          animT = Math.min(1, animT + dt / 0.8);
          var k = EASE(animT);
          cur = from.map(function (p, i) { return p.map(function (q, j) { return [q[0] + (to[i][j][0] - q[0]) * k, q[1] + (to[i][j][1] - q[1]) * k]; }); });
          dirty = true;
        }
        if (!ctx.reduced) {
          var nx = ctx.damp(px, mx, 4, dt), ny = ctx.damp(py, my, 4, dt);
          if (Math.abs(nx - px) + Math.abs(ny - py) > 1e-4) dirty = true;
          px = nx; py = ny;
        }
        if (useDisc && inside) {
          var r = stage.getBoundingClientRect();
          dX = ctx.damp(dX, mx * r.width, 18, dt); dY = ctx.damp(dY, my * r.height, 18, dt);
          disc.style.transform = 'translate3d(' + dX.toFixed(1) + 'px,' + dY.toFixed(1) + 'px,0)';
        }
        if (dirty) { dirty = false; render(); }
      });
      function resize() {
        var f = ctx.fitCanvas(cv, stage, 2); W = f.w; H = f.h; dpr = f.dpr;
        var p = H > W * 1.02; if (p !== portrait || !cur) { portrait = p; cur = null; go(); }
        dirty = true;
      }
      var ro = new ResizeObserver(resize);
      // build the three hatched plates one per frame so mount never blocks
      var buildIdx = 0, buildTimer = 0;
      function buildNext() {
        if (buildIdx >= DRAW.length) return;
        var c = document.createElement('canvas'); c.width = SW; c.height = SH;
        var cg = c.getContext('2d'); cg.fillStyle = PAPER; cg.fillRect(0, 0, SW, SH);
        DRAW[buildIdx](cg); arts[buildIdx++] = c; dirty = true;
        buildTimer = setTimeout(buildNext, 30);
      }
      resize();

      return {
        start: function () { ro.observe(stage); resize(); if (buildIdx < DRAW.length && !buildTimer) buildNext(); lp.start(); },
        stop: function () { ro.disconnect(); lp.stop(); clearTimeout(buildTimer); buildTimer = 0; }
      };
    }
  });
})();
