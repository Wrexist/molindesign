/* "Pop" — how popcorn pops. A vertical TikTok explainer written in code, narrated first and cut to the voice.
   Every visual beat is keyed to a word time from vo/vo.js (window.VO, written by tools/voiceover.py), so picture,
   captions and voice can't drift. Pure function of t like ../film.js. Contract: window.FILM, DUR, render(t), READY,
   EV, TEXTS(t), SCORE(ctx). */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur;
  var BG = '#f6efe2', INK = '#231c15', RED = '#d7262e', HULL = '#e29a35', HULL2 = '#b8661b', STARCH = '#fff4dc', WATER = '#3d9be0', HEAT = '#ec4b26';
  var KX = 540, KY = 1130, KS = 250;                  // the kernel: centre and half-height in px

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function ss(k) { return k * k * (3 - 2 * k); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  /* in for [a, b), springing in at a and easing out over `o` s at b */
  function win(t, a, b, o) { return t < a || t > b + (o || .3) ? 0 : clamp(spring(t - a, 2.2, .78), 0, 1.2) * (1 - eio(seg(t, b, b + (o || .3)))); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function at(id, word) {                              // when a word starts; `word` is its text or its index
    var l = LINE[id]; if (typeof word === 'number') return l.words[word].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word)) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }
  var T = {
    hookPop: at('hook', 'explodes'), rew0: end('hook') + .02, rew1: start('cooker') - .02,
    gauge: at('cooker', 'pressure'),
    cut: start('water') - .1, drops: at('water', 'water'), pct: at('water', '14%'),
    heat: at('steam', 'heat'), boil: at('steam', 'steam'),
    tough: at('trap', 'tough'), trapped: at('trap', 'trapped'),
    climb: at('press', 'climbs'), nine: at('press', 'nine'),
    hot: at('give', '180'), gives: at('give', 'gives'),
    pop: end('give') + .12, burst: start('puff'), forty: at('puff', '40'),
    hear: at('sound', 'pop'), notShell: at('sound', 'shell'), escaping: at('sound', 'steam'),
    dud: start('duds'), leaked: at('duds', 'leaked'),
    bowl: start('loop'), tiny: at('loop', 'tiny'), home: end('loop') + .1
  };
  var SHOTS = [
    { id: 'hook', name: 'It explodes', t0: 0, t1: start('cooker') },
    { id: 'cooker', name: 'Pressure cooker', t0: start('cooker'), t1: T.cut },
    { id: 'water', name: 'Water', t0: T.cut, t1: start('steam') },
    { id: 'steam', name: 'Steam', t0: start('steam'), t1: start('press') },
    { id: 'press', name: 'Pressure', t0: start('press'), t1: T.pop },
    { id: 'pop', name: 'Pop', t0: T.pop, t1: start('sound') },
    { id: 'sound', name: 'The sound', t0: start('sound'), t1: T.dud },
    { id: 'duds', name: 'Duds', t0: T.dud, t1: T.bowl },
    { id: 'bowl', name: 'A bowl', t0: T.bowl, t1: DUR }
  ];

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* kernel outline in unit space (y down, tip at the bottom) */
  function kernelPath(g, s) {
    g.beginPath(); g.moveTo(0, -1 * s);
    g.bezierCurveTo(.46 * s, -1 * s, .84 * s, -.86 * s, .8 * s, -.2 * s);
    g.bezierCurveTo(.74 * s, .42 * s, .3 * s, .9 * s, 0, 1.08 * s);
    g.bezierCurveTo(-.3 * s, .9 * s, -.74 * s, .42 * s, -.8 * s, -.2 * s);
    g.bezierCurveTo(-.84 * s, -.86 * s, -.46 * s, -1 * s, 0, -1 * s); g.closePath();
  }
  /* seeded water drops inside the starch (unit space) */
  var DROPS = (function () {
    var r = mulberry(21), out = [], g = mk(10, 10).getContext('2d');
    while (out.length < 26) {
      var x = (r() * 2 - 1) * .6, y = -.85 + r() * 1.45;
      kernelPath(g, .8);
      if (!g.isPointInPath(x, y) || y > .45) continue;
      if (out.some(function (d) { return Math.hypot(d.x - x, d.y - y) < .17; })) continue;
      out.push({ x: x, y: y, r: .045 + r() * .03, k: out.length, f: .7 + r() * .8, p: r() * 6.28 });
    }
    return out;
  })();
  /* the popped flake: overlapping blobs that bloom outward */
  var BLOBS = (function () {
    var r = mulberry(5), out = [];
    for (var i = 0; i < 17; i++) { var a = i / 17 * 6.283 + r() * .5, d = i === 0 ? 0 : .35 + r() * .55; out.push({ x: Math.cos(a) * d * 1.1, y: Math.sin(a) * d * .9 - .1, r: .38 + r() * .3, k: r() }); }
    return out;
  })();

  function kernel(g, cx, cy, s, o) {
    o = o || {};
    var temp = o.temp || 0, shake = o.shake || 0, t = o.t || 0, bulge = 1 + (o.pressure || 0) * .035;
    g.save();
    g.translate(cx + Math.sin(t * 71) * shake * 6 + Math.sin(t * 43) * shake * 3, cy + Math.cos(t * 59) * shake * 4);
    g.rotate((o.rot || 0) + Math.sin(t * 37) * shake * .02); g.scale(bulge, bulge);
    /* soft contact shadow */
    g.save(); g.scale(1, .18); g.beginPath(); g.arc(0, (1.15 * s) / .18, .62 * s, 0, 6.283);
    g.fillStyle = 'rgba(80,50,20,' + (.16 * (o.alpha == null ? 1 : o.alpha)) + ')'; g.fill(); g.restore();
    g.globalAlpha = o.alpha == null ? 1 : o.alpha;
    /* hull */
    var hg = g.createLinearGradient(-s * .7, -s, s * .7, s);
    hg.addColorStop(0, mix('#f2b54f', '#f07a2a', temp)); hg.addColorStop(.55, mix(HULL, '#d9541c', temp)); hg.addColorStop(1, mix(HULL2, '#8e2c10', temp));
    kernelPath(g, s); g.fillStyle = hg; g.fill();
    var sec = o.section || 0;
    if (sec > 0) {
      /* the cross-section: starch, germ, drops, steam */
      g.save(); kernelPath(g, s * .86); g.clip();
      g.globalAlpha *= eo(sec);
      var sg = g.createRadialGradient(-s * .2, -s * .3, s * .1, 0, 0, s);
      sg.addColorStop(0, '#fffaf0'); sg.addColorStop(1, mix(STARCH, '#ffd9a0', temp * .6));
      g.fillStyle = sg; g.fillRect(-s, -s * 1.2, s * 2, s * 2.4);
      g.beginPath(); g.ellipse(0, s * .62, s * .26, s * .34, 0, 0, 6.283); g.fillStyle = '#f2cf7c'; g.fill();
      var drops = o.drops || 0, steam = o.steam || 0;
      DROPS.forEach(function (d) {
        var appear = clamp(drops * 26 - d.k * .6, 0, 1); if (appear <= 0) return;
        var boil = clamp(steam * 1.6 - hash(d.k) * .6, 0, 1);
        var x = d.x * s, y = d.y * s, rr = d.r * s * spring(appear * .5, 2.4, .6);
        if (boil < 1) {
          var dg = g.createRadialGradient(x - rr * .3, y - rr * .3, rr * .1, x, y, rr);
          dg.addColorStop(0, '#bfe3ff'); dg.addColorStop(1, WATER);
          g.globalAlpha = (1 - boil); g.beginPath(); g.arc(x, y + Math.sin(t * 9 + d.p) * (o.shake || 0) * 3, rr * (1 + .1 * Math.sin(t * 20 * d.f + d.p) * boil), 0, 6.283); g.fillStyle = dg; g.fill();
        }
        if (boil > 0) {
          /* steam: a puff that wanders and, when trapped, bounces off the hull */
          var speed = .6 + (o.pressure || 0) * 2.2, ph = t * speed * d.f + d.p;
          var px = d.x * s * .3 + Math.sin(ph * 1.3) * s * .48, py = d.y * s * .4 - s * .1 + Math.cos(ph * .9 + d.k) * s * .5;
          g.globalAlpha = boil * .85;
          for (var k = 0; k < 3; k++) { g.beginPath(); g.arc(px + k * rr * .7 - rr * .7, py - k * rr * .25, rr * (1.1 - k * .15) * (1 + (o.pressure || 0) * .5), 0, 6.283); g.fillStyle = 'rgba(255,255,255,.75)'; g.fill(); }
        }
      });
      g.globalAlpha = 1;
      /* pressure arrows pushing on the shell */
      var pr = o.pressure || 0;
      if (pr > 0) for (var i = 0; i < 10; i++) {
        var a = i / 10 * 6.283 + .3, r0 = s * .25, r1 = s * (.42 + pr * .28);
        g.strokeStyle = 'rgba(215,38,46,' + (.75 * Math.min(1, pr * 2)) + ')'; g.lineWidth = 9; g.lineCap = 'round';
        var ex = Math.cos(a) * r1 * .95, ey = Math.sin(a) * r1 * 1.1;
        g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 1.1); g.lineTo(ex, ey); g.stroke();
        g.beginPath(); g.moveTo(ex + Math.cos(a + 2.5) * 26, ey + Math.sin(a + 2.5) * 26); g.lineTo(ex, ey); g.lineTo(ex + Math.cos(a - 2.5) * 26, ey + Math.sin(a - 2.5) * 26); g.stroke();
      }
      g.restore();
      /* the shell wall, drawn over the section; thickens when it's the point */
      g.save(); kernelPath(g, s * .93); g.lineWidth = s * (.1 + (o.tough || 0) * .05); g.strokeStyle = mix(HULL2, '#8e2c10', temp); g.globalAlpha = .55 * eo(sec); g.stroke(); g.restore();
      if (o.tough) { g.save(); kernelPath(g, s); g.lineWidth = 10; g.strokeStyle = RED; g.globalAlpha = o.tough * .9; g.stroke(); g.restore(); }
    } else {
      /* outside: a soft highlight and the tip cap */
      g.save(); kernelPath(g, s); g.clip();
      var hl = g.createRadialGradient(-s * .32, -s * .5, s * .02, -s * .32, -s * .5, s * .6);
      hl.addColorStop(0, 'rgba(255,248,225,.75)'); hl.addColorStop(1, 'rgba(255,248,225,0)'); g.fillStyle = hl; g.fillRect(-s, -s * 1.2, s * 2, s * 2.4);
      g.beginPath(); g.ellipse(0, s * 1.02, s * .2, s * .16, 0, 0, 6.283); g.fillStyle = 'rgba(90,40,10,.5)'; g.fill();
      g.restore();
    }
    /* cracks */
    var cr = o.crack || 0;
    if (cr > 0) {
      g.strokeStyle = '#4a1a06'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
      [[0, -1, 1], [-.5, -.7, -1], [.55, -.55, 1]].forEach(function (c, j) {
        var n = Math.floor(cr * 6 * (j ? .7 : 1)); if (n < 1) return;
        g.beginPath(); var x = c[0] * s, y = c[1] * s; g.moveTo(x, y);
        for (var k = 0; k < n; k++) { x += (hash(j * 9 + k) - .5) * s * .14 + c[2] * s * .02; y += s * .09; g.lineTo(x, y); }
        g.stroke();
      });
    }
    g.restore();
  }
  function mix(a, b, k) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = Math.round(lerp(pa >> 16, pb >> 16, k)), gg = Math.round(lerp(pa >> 8 & 255, pb >> 8 & 255, k)), bl = Math.round(lerp(pa & 255, pb & 255, k));
    return 'rgb(' + r + ',' + gg + ',' + bl + ')';
  }
  function flake(g, cx, cy, s, grow, rot) {
    if (grow <= 0) return;
    g.save(); g.translate(cx, cy); g.rotate(rot || 0);
    var gs = s * grow;
    g.save(); g.scale(1, .16); g.beginPath(); g.arc(0, 1.3 * gs / .16, gs * 1.1, 0, 6.283); g.fillStyle = 'rgba(80,50,20,.14)'; g.fill(); g.restore();
    /* hull shards still stuck to the base */
    g.fillStyle = HULL2;
    for (var i = 0; i < 4; i++) { g.save(); g.rotate(-.9 + i * .6); g.translate(0, gs * .95); g.beginPath(); g.moveTo(-gs * .16, 0); g.lineTo(gs * .14, -gs * .05); g.lineTo(gs * .05, gs * .2); g.closePath(); g.fill(); g.restore(); }
    BLOBS.forEach(function (b, j) {
      var k = clamp(spring(grow * 1.6 - b.k * .3, 1.6, .55), 0, 1.15), x = b.x * gs * k, y = b.y * gs * k, r = b.r * gs * (.4 + .6 * k);
      g.beginPath(); g.arc(x + r * .08, y + r * .14, r, 0, 6.283); g.fillStyle = '#ecd7a8'; g.fill();
    });
    BLOBS.forEach(function (b) {
      var k = clamp(spring(grow * 1.6 - b.k * .3, 1.6, .55), 0, 1.15), x = b.x * gs * k, y = b.y * gs * k, r = b.r * gs * (.4 + .6 * k);
      var bg = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
      bg.addColorStop(0, '#fffdf6'); bg.addColorStop(.75, '#fff3d6'); bg.addColorStop(1, '#f3dfb1');
      g.beginPath(); g.arc(x, y, r * .96, 0, 6.283); g.fillStyle = bg; g.fill();
    });
    g.restore();
  }
  /* steam puffs bursting out of a point */
  function burst(g, cx, cy, s, k, seed) {
    if (k <= 0 || k >= 1) return;
    for (var i = 0; i < 14; i++) {
      var a = hash(seed + i) * 6.283, d = s * (.3 + 1.6 * eo(k) * (.6 + hash(seed + i * 3) * .6)), r = s * (.12 + .25 * k) * (.6 + hash(i + seed * 7));
      g.globalAlpha = (1 - k) * .8; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * .85 - s * .3 * k, r, 0, 6.283); g.fillStyle = '#ffffff'; g.fill();
    }
    g.globalAlpha = 1;
  }
  function shards(g, cx, cy, s, k) {
    if (k <= 0 || k >= 1) return;
    g.fillStyle = HULL2;
    for (var i = 0; i < 7; i++) {
      var a = -1.9 + i * .55 + hash(i) * .3, d = s * 2.4 * eo(k), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d + 900 * k * k;
      g.save(); g.translate(x, y); g.rotate(k * (6 + i) ); g.globalAlpha = 1 - k * k;
      g.beginPath(); g.moveTo(-28, -10); g.lineTo(26, -16); g.lineTo(14, 18); g.closePath(); g.fill(); g.restore();
    }
    g.globalAlpha = 1;
  }
  /* rising heat under the kernel */
  function heat(g, k, t) {
    if (k <= 0) return;
    var y0 = KY + KS * 1.45;
    var hg = g.createRadialGradient(KX, y0 + 120, 20, KX, y0 + 120, 520);
    hg.addColorStop(0, 'rgba(236,75,38,' + (.42 * k) + ')'); hg.addColorStop(1, 'rgba(236,75,38,0)');
    g.fillStyle = hg; g.fillRect(0, y0 - 420, W, 700);
    g.lineCap = 'round'; g.lineWidth = 9;
    for (var i = 0; i < 5; i++) {
      var x0 = KX - 260 + i * 130, ph = t * 2.2 + i * 1.7, lift = ((t * .9 + i * .37) % 1);
      g.strokeStyle = 'rgba(236,75,38,' + (k * .55 * Math.sin(lift * Math.PI)) + ')';
      g.beginPath();
      for (var j = 0; j <= 14; j++) { var y = y0 + 140 - j * 14 - lift * 90, x = x0 + Math.sin(ph + j * .5) * 16; if (j) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
  }
  /* pressure gauge and thermometer, the two instruments */
  function gauge(g, cx, cy, r, val, label, alpha) {
    if (alpha <= 0) return;
    g.save(); g.globalAlpha = Math.min(1, alpha); g.translate(cx, cy); var sc = .85 + .15 * Math.min(1, alpha); g.scale(sc, sc);
    g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.fillStyle = '#fffaf1'; g.fill(); g.lineWidth = 10; g.strokeStyle = INK; g.stroke();
    for (var i = 0; i <= 10; i++) {
      var a = Math.PI * .75 + i / 10 * Math.PI * 1.5;
      g.beginPath(); g.moveTo(Math.cos(a) * r * .78, Math.sin(a) * r * .78); g.lineTo(Math.cos(a) * r * (i % 5 ? .7 : .62), Math.sin(a) * r * (i % 5 ? .7 : .62));
      g.lineWidth = i % 5 ? 4 : 7; g.strokeStyle = i > 7 ? RED : INK; g.stroke();
    }
    var na = Math.PI * .75 + clamp(val, 0, 1.05) / 10 * 10 * Math.PI * 1.5;
    g.beginPath(); g.moveTo(-Math.cos(na) * r * .12, -Math.sin(na) * r * .12); g.lineTo(Math.cos(na) * r * .7, Math.sin(na) * r * .7); g.lineWidth = 9; g.lineCap = 'round'; g.strokeStyle = RED; g.stroke();
    g.beginPath(); g.arc(0, 0, 14, 0, 6.283); g.fillStyle = INK; g.fill();
    g.font = '600 26px "Geist Mono"'; g.textAlign = 'center'; g.fillStyle = INK; g.fillText(label, 0, r * .55);
    g.restore();
  }
  function thermo(g, cx, cy, h, val, txt, alpha) {
    if (alpha <= 0) return;
    g.save(); g.globalAlpha = Math.min(1, alpha); g.translate(cx, cy);
    g.lineWidth = 9; g.strokeStyle = INK; g.fillStyle = '#fffaf1';
    g.beginPath(); g.moveTo(-26, -h / 2); g.arc(0, -h / 2, 26, Math.PI, 0); g.lineTo(26, h / 2 - 20); g.arc(0, h / 2 + 14, 44, -1.0, Math.PI + 1.0); g.closePath(); g.fill(); g.stroke();
    var top = h / 2 - (h - 30) * clamp(val, 0, 1);
    g.fillStyle = HEAT; g.beginPath(); g.arc(0, h / 2 + 14, 32, 0, 6.283); g.fill(); g.fillRect(-13, top, 26, h / 2 + 14 - top);
    g.font = '700 46px Archivo'; g.textAlign = 'right'; g.fillStyle = INK; try { g.fontStretch = 'expanded'; } catch (e) {}
    g.fillText(txt, -60, top + 16);
    g.restore();
  }
  /* a big stamped number or word */
  var STAMPS = [];
  function stamp(id, text, t0, t1, x, y, size, color) { STAMPS.push({ id: id, text: text, t0: t0, t1: t1, x: x, y: y, size: size, color: color || INK }); }
  function drawStamps(g, t) {
    STAMPS.forEach(function (s) {
      var k = win(t, s.t0, s.t1, .25); if (k <= 0) return;
      g.save(); g.translate(s.x, s.y); var sc = clamp(spring(t - s.t0, 2.6, .55), 0, 1.3) * (1 - .15 * eio(seg(t, s.t1, s.t1 + .25)));
      g.scale(sc, sc); g.rotate(-.04);
      g.font = '800 ' + s.size + 'px Archivo'; try { g.fontStretch = 'expanded'; } catch (e) {}
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = Math.min(1, k);
      g.fillStyle = s.color; g.fillText(s.text, 0, 0);
      g.restore();
      s._box = [s.x - s.size * s.text.length * .35, s.y - s.size / 2, s.x + s.size * s.text.length * .35, s.y + s.size / 2];
    });
  }
  function label(g, text, x, y, alpha, color) {
    if (alpha <= 0) return;
    g.save(); g.globalAlpha = Math.min(1, alpha); g.font = '600 38px "Geist Mono"'; g.fillStyle = color || INK; g.textAlign = 'center';
    try { g.letterSpacing = '3px'; } catch (e) {}
    g.fillText(text, x, y); g.restore();
  }

  stamp('pct', '14%', T.pct, T.heat + .45, 300, 660, 150, WATER);
  stamp('nine', '9×', T.nine, T.hot - .05, 770, 650, 170, RED);
  stamp('hot', '180°C', T.hot, T.pop - .02, 330, 660, 120, HEAT);
  stamp('pop', 'POP!', T.pop + .04, T.pop + 2.15, 540, 700, 230, RED);
  stamp('forty', '40×', T.forty, start('sound') + .2, 540, 640, 170, INK);

  /* ---------- captions: the narrator's words, highlighted as spoken ---------- */
  function captions(g, t) {
    var card = null;
    VO.captions.forEach(function (c) { if (t >= c.t0 - .04 && t < c.t1 + .15) card = c; });
    if (!card) return;
    var k = clamp(spring(t - card.t0 + .04, 3.2, .7), 0, 1.1), out = 1 - seg(t, card.t1, card.t1 + .15);
    g.save(); g.font = '800 84px Archivo'; try { g.fontStretch = 'expanded'; } catch (e) {}
    g.textBaseline = 'alphabetic';
    var words = card.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 24;
    var lines = [[]], lw = [0], maxw = 900;
    words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; });
    var y0 = 360 - (lines.length - 1) * 50;
    g.globalAlpha = out;
    lines.forEach(function (ln, li) {
      var x = W / 2 - (lw[li] - gap) / 2, y = y0 + li * 100 + (1 - Math.min(1, k)) * 40;
      ln.forEach(function (i) {
        var w = words[i], cur = t >= w.t0 - .03 && t < w.t1 + .05, said = t >= w.t0 - .03;
        if (cur) { g.fillStyle = RED; g.beginPath(); g.roundRect(x - 12, y - 74, ws[i] + 24, 96, 18); g.fill(); }
        g.fillStyle = cur ? '#fff' : said ? INK : 'rgba(35,28,21,.32)';
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#fbf6ec'); bg.addColorStop(1, '#efe4cf');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);

    /* camera: a slow push through the build-up, a punch on the pop */
    var push = 1 + .08 * ss(seg(t, start('steam'), T.pop)) - .08 * eo(seg(t, T.pop, T.pop + .4)) + .05 * Math.max(0, 1 - (t - T.pop) * 3) * (t > T.pop ? 1 : 0);
    g.save(); g.translate(KX, KY); g.scale(push, push); g.translate(-KX, -KY);

    var temp = ss(seg(t, T.heat, T.pop)), pressure = ss(seg(t, T.boil + .3, T.nine + .3)) * .7 + .3 * ss(seg(t, T.hot, T.pop));
    var heatK = seg(t, T.heat - .2, T.heat + .5) * (1 - seg(t, T.pop + .2, T.pop + .8));
    heat(g, heatK, t);

    /* hook: pop, hold, rewind */
    var preview = t >= T.hookPop && t < T.rew1;
    var rewind = seg(t, T.rew0, T.rew1);
    if (t < T.hookPop) kernel(g, KX, KY, KS, { t: t, shake: .1 * seg(t, .6, T.hookPop) });
    else if (preview) {
      var gk = clamp(seg(t, T.hookPop, T.hookPop + .5), 0, 1) * (1 - eio(rewind));
      if (rewind > 0) { g.save(); g.globalAlpha = .35 * Math.sin(rewind * Math.PI); kernel(g, KX, KY + 40 * Math.sin(rewind * 9), KS, { t: t }); g.restore(); }
      flake(g, KX, KY - 40, KS * 1.05, gk, .1);
      burst(g, KX, KY, KS, seg(t, T.hookPop, T.hookPop + .7), 3);
      if (rewind > 0) { g.save(); g.globalAlpha = .12 + .2 * Math.sin(rewind * Math.PI); g.fillStyle = INK; for (var i = 0; i < 9; i++) g.fillRect(0, (i * 237 + t * 4000) % H, W, 6); g.restore(); }
    } else if (t < T.pop) {
      var sec = seg(t, T.cut, T.cut + .45);
      kernel(g, KX, KY, KS, {
        t: t, section: sec, drops: seg(t, T.drops - .1, T.drops + .9), steam: seg(t, T.boil - .1, T.boil + .9),
        temp: temp, pressure: t > T.boil ? pressure : 0, tough: win(t, T.tough, T.trapped + .8, .4) * .8,
        shake: pressure * .6 + .8 * seg(t, T.gives - .4, T.pop), crack: seg(t, T.gives - .1, T.pop - .02)
      });
      /* the steam knocking on the wall while it's trapped */
      var tk = win(t, T.tough, end('trap'), .3);
      if (tk > 0) for (var j = 0; j < 6; j++) {
        var ph = (t * 3.1 + j * .37) % 1, a = j * 1.05 + .4;
        g.save(); g.globalAlpha = tk * (1 - ph) * .9; g.strokeStyle = RED; g.lineWidth = 6;
        g.beginPath(); g.arc(KX + Math.cos(a) * KS * .74, KY + Math.sin(a) * KS * .86, 16 + ph * 34, a - .8, a + .8); g.stroke(); g.restore();
      }
    } else {
      /* the pop, the flake, then the questions */
      var b = seg(t, T.pop, T.pop + .55), gk2 = eo(seg(t, T.pop, T.forty + .4)) * (.8 + .2 * ss(seg(t, T.forty - .1, T.forty + .5)));
      var away = eio(seg(t, T.dud - .3, T.dud + .4)), soundK = win(t, T.hear, T.dud - .3, .3);
      if (t < T.dud + .4) {
        g.save(); g.translate(-away * 900, -170 * soundK);
        if (t < T.pop + .08) kernel(g, KX, KY, KS, { t: t, section: 1, temp: 1, pressure: 1, shake: 1.2, crack: 1, steam: 1, drops: 1 });
        flake(g, KX, KY - 60 * gk2, KS * (.55 + .7 * gk2) * (1 - .25 * soundK), Math.max(.01, gk2), .12 * Math.sin(t * .8));
        shards(g, KX, KY, KS, seg(t, T.pop, T.pop + 1.1));
        burst(g, KX, KY - 30, KS * 1.1, b, 11);
        /* 40x: the kernel it came from, to scale */
        var ghost = win(t, T.forty - .05, end('puff') + .2, .3);
        if (ghost > 0) { g.save(); g.globalAlpha = .9 * Math.min(1, ghost); g.setLineDash([14, 12]); kernelPath2(g, KX + 330, KY + 230, KS * .36); g.lineWidth = 6; g.strokeStyle = HULL2; g.stroke(); g.setLineDash([]); g.restore(); label(g, 'BEFORE', KX + 330, KY + 360, ghost, HULL2); }
        g.restore();
      }
      /* "that pop you hear": the shell (crossed out) vs the steam (with sound waves) */
      if (soundK > 0) {
        var sk = Math.min(1, soundK), xs = win(t, T.notShell, T.dud - .3, .3), st = win(t, T.escaping, T.dud - .3, .3);
        g.save(); g.globalAlpha = sk;
        g.save(); g.translate(300, 1330); g.fillStyle = HULL2; g.beginPath(); g.moveTo(-70, -26); g.lineTo(64, -40); g.lineTo(36, 46); g.closePath(); g.fill();
        if (xs > 0) { g.strokeStyle = RED; g.lineWidth = 14; g.lineCap = 'round'; var xk = Math.min(1, xs); g.beginPath(); g.moveTo(-80, -70); g.lineTo(-80 + 160 * xk, -70 + 140 * xk); g.stroke(); if (xk > .5) { var x2 = (xk - .5) * 2; g.beginPath(); g.moveTo(80, -70); g.lineTo(80 - 160 * x2, -70 + 140 * x2); g.stroke(); } }
        g.restore();
        label(g, 'SHELL', 300, 1430, sk);
        if (st > 0) {
          g.save(); g.translate(760, 1340);
          for (var w2 = 0; w2 < 4; w2++) { var p2 = (t * 1.8 + w2 * .25) % 1; g.globalAlpha = Math.min(1, st) * (1 - p2); g.strokeStyle = RED; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 40 + p2 * 120, -.9, .9); g.stroke(); g.beginPath(); g.arc(0, 0, 40 + p2 * 120, Math.PI - .9, Math.PI + .9); g.stroke(); }
          g.globalAlpha = Math.min(1, st);
          for (var p3 = 0; p3 < 6; p3++) { var q = (t * 2 + p3 / 6) % 1; g.beginPath(); g.arc((hash(p3) - .5) * 30, -q * 160, 18 + q * 22, 0, 6.283); g.fillStyle = 'rgba(255,255,255,' + (1 - q) + ')'; g.fill(); g.strokeStyle = 'rgba(35,28,21,' + (.25 * (1 - q)) + ')'; g.lineWidth = 3; g.stroke(); }
          g.restore();
          label(g, 'STEAM', 760, 1430, Math.min(1, st), RED);
        }
        g.restore();
      }
      /* duds: a kernel that leaked */
      var dk = seg(t, T.dud - .1, T.dud + .5) * (1 - seg(t, T.bowl - .1, T.bowl + .3));
      if (dk > 0) {
        kernel(g, KX + (1 - eo(dk)) * 900, KY, KS, { t: t, rot: (1 - eo(dk)) * 1.2, crack: seg(t, T.leaked - .1, T.leaked + .3) * .5 });
        var lk = seg(t, T.leaked, T.leaked + .3);
        for (var m = 0; m < 7; m++) { var qq = (t * 1.4 + m / 7) % 1; g.globalAlpha = lk * (1 - qq) * dk; g.beginPath(); g.arc(KX + 60 + qq * 120 + Math.sin(qq * 9 + m) * 14, KY - KS * .85 - qq * 200, 12 + qq * 26, 0, 6.283); g.fillStyle = '#fff'; g.fill(); }
        g.globalAlpha = 1;
        label(g, 'OLD MAID · NEVER POPS', KX, KY + KS * 1.3, dk * seg(t, T.leaked, T.leaked + .3));
      }
      /* a bowl: a few hundred tiny explosions, then back to one kernel (the loop) */
      if (t >= T.bowl - .1) bowl(g, t);
    }
    g.restore();

    /* instruments and stamps live outside the camera push */
    var gA = win(t, T.gauge, T.cut + .2, .3) + win(t, T.climb - .2, T.hot - .3, .3);
    var gv = t < T.cut + .5 ? 0 : ss(seg(t, T.climb, T.nine + .2)) * .9 + .1 * ss(seg(t, T.nine, T.pop));
    gauge(g, 280, 660, 135, gv, t < T.cut + .5 ? 'PRESSURE' : (gv > .85 ? '9 ATM' : Math.max(1, Math.round(gv * 10)) + ' ATM'), gA);
    if (t < T.cut + .5) label(g, 'A TINY PRESSURE COOKER', 540, 830, win(t, T.gauge + .2, T.cut, .3));
    var thA = win(t, T.heat, T.pop - .05, .2), tv = t < T.hot ? 20 + 80 * ss(seg(t, T.heat, T.boil)) + 50 * ss(seg(t, T.boil, T.hot)) : 150 + 30 * eo(seg(t, T.hot, T.hot + .5));
    thermo(g, 860, 640, 300, (tv - 20) / 170, Math.round(tv) + '°', thA * (t > T.hot - .1 && t < T.pop ? 0 : 1) * (1 - Math.min(1, win(t, T.nine - .1, end('press'), .2))));
    label(g, 'WATER', 300, 770, win(t, T.pct, T.heat + .45, .25), WATER);
    label(g, '100° = STEAM', 540, 830, win(t, T.boil, end('steam') + .3, .3));
    label(g, 'SEALED SHELL', 540, 830, win(t, T.tough, end('trap') + .2, .3), RED);
    label(g, 'THE AIR AROUND YOU = 1', 540, 830, win(t, T.nine + .3, end('press') + .2, .3));
    drawStamps(g, t);
    captions(g, t);

    /* the frame: a thin progress line along the top (the loop restarts it) */
    g.fillStyle = 'rgba(35,28,21,.12)'; g.fillRect(60, 140, W - 120, 6);
    g.fillStyle = RED; g.fillRect(60, 140, (W - 120) * t / DUR, 6);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'multiply'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function kernelPath2(g, cx, cy, s) { g.save(); g.translate(cx, cy); kernelPath(g, s); g.restore(); }

  /* the bowl: kernels on a grid pop one after another, faster and faster */
  var GRID = (function () {
    var r = mulberry(9), out = [];
    for (var i = 0; i < 42; i++) out.push({ x: 120 + (i % 6) * 168 + (r() - .5) * 60, y: 760 + Math.floor(i / 6) * 132 + (r() - .5) * 40, k: r(), rot: (r() - .5) * 1.4 });
    return out;
  })();
  function popTime(i) { var u = (i + .5) / GRID.length; return T.bowl + .2 + (T.home - T.bowl - .9) * Math.pow(u, .62); }
  var ORDER = GRID.map(function (g, i) { return i; }).sort(function (a, b) { return GRID[a].k - GRID[b].k; });
  function bowl(g, t) {
    var come = eo(seg(t, T.bowl - .1, T.bowl + .4)), back = eio(seg(t, T.home - .2, DUR));
    ORDER.forEach(function (gi, n) {
      var p = GRID[gi], tp = popTime(n), x = lerp(KX, p.x, come * (1 - back)), y = lerp(KY, p.y, come * (1 - back)), s = lerp(KS, 46, come * (1 - back));
      if (back > .85) return;
      g.save(); g.globalAlpha = 1 - ss(seg(back, .5, .85));
      if (t < tp) kernel(g, x, y, s, { t: t + n, rot: p.rot, shake: .25 * seg(t, tp - .4, tp) });
      else { flake(g, x, y - 10, s * 1.15, eo(seg(t, tp, tp + .3)), p.rot); burst(g, x, y, s * 1.2, seg(t, tp, tp + .45), n); }
      g.restore();
    });
    if (back > 0) kernel(g, KX, KY, KS, { t: t, alpha: ss(seg(back, .3, 1)) });
  }

  /* ---------- text dwell: stamps and labels only (captions follow the voice, by design) ---------- */
  function TEXTS(t) {
    var out = [];
    STAMPS.forEach(function (s) { if (t >= s.t0 + .2 && t < s.t1) out.push({ id: s.id, text: s.text, x0: 0, y0: 0, x1: 0, y1: 0 }); });
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [{ t: T.hookPop, type: 'pop', g: .8 }, { t: T.rew0, type: 'rewind' }, { t: T.gauge, type: 'tick' }];
  DROPS.forEach(function (d) { if (d.k % 3 === 0) EV.push({ t: T.drops + d.k * .6 / 26 * 0.9, type: 'blip', f: 900 + d.k * 40 }); });
  EV.push({ t: T.pct, type: 'thump' }, { t: T.heat, type: 'sizzle', t1: T.pop }, { t: T.boil, type: 'hiss', t1: T.pop });
  for (var kn = T.tough; kn < end('trap'); kn += .32) EV.push({ t: kn, type: 'knock' });
  for (var tk2 = T.climb; tk2 < T.nine + .2; tk2 += .11) EV.push({ t: tk2, type: 'tick' });
  EV.push({ t: T.nine, type: 'thump' }, { t: T.hot, type: 'thump' });
  for (var cr = T.gives - .1; cr < T.pop - .05; cr += .09) EV.push({ t: cr, type: 'creak' });
  EV.push({ t: T.pop, type: 'pop', g: 1.4, big: true }, { t: T.forty, type: 'thump' }, { t: T.notShell, type: 'tick' }, { t: T.escaping, type: 'hiss', t1: T.escaping + 1.2 });
  EV.push({ t: T.dud, type: 'rewind' }, { t: T.leaked, type: 'hiss', t1: T.leaked + 1.0, small: true });
  ORDER.forEach(function (gi, n) { EV.push({ t: popTime(n), type: 'pop', g: .32 + .2 * hash(n), f: hash(n * 3) }); });
  EV.push({ t: T.home, type: 'rewind' }, { t: DUR - .45, type: 'tick' });

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { frame(ctx, t); return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- score: a light groove that steps aside for the voice and the pop ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.4), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .2; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], pts[0][0]); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], pts[k][0]); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(t0, rnd() * 2, dur); return s; }

    /* a pop: a short resonant thock plus a puff of air */
    function pop(t, g, f, big) {
      var o = ac.createOscillator(), og = ac.createGain(), f0 = (big ? 220 : 480 + 380 * (f || .5));
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * .45, t + .05);
      o.connect(og); og.connect(bus(1, big ? .35 : .15, big ? 0 : ((f || .5) - .5) * .9)); env(og.gain, [[t, 0], [t + .002, g * .7], [t + (big ? .25 : .07), 0]]); o.start(t); o.stop(t + .3);
      var n = noise(t, big ? .7 : .12), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = big ? 1400 : 2600; bp.Q.value = .8;
      var ng = bus(1, big ? .4 : .1); n.connect(bp); bp.connect(ng); env(ng.gain, [[t, 0], [t + .003, g * (big ? .9 : .5)], [t + (big ? .6 : .1), 0]]);
      if (big) { var s = ac.createOscillator(), sg = ac.createGain(); s.frequency.setValueAtTime(90, t); s.frequency.exponentialRampToValueAtTime(40, t + .35); s.connect(sg); sg.connect(bus(1, 0)); env(sg.gain, [[t, 0], [t + .005, .7], [t + .4, 0]]); s.start(t); s.stop(t + .45); }
    }
    function tick(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3800; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .25], [t + .025, 0]]); }
    function thump(t, g) { var o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(55, t + .16); o.connect(og); og.connect(bus(1, .1)); env(og.gain, [[t, 0], [t + .004, g || .35], [t + .25, 0]]); o.start(t); o.stop(t + .28); }
    function blip(t, f) { var o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.6, t + .06); o.connect(og); og.connect(bus(1, .3, (f - 1400) / 1400)); env(og.gain, [[t, 0], [t + .004, .08], [t + .09, 0]]); o.start(t); o.stop(t + .1); }
    function band(t0, t1, f0, f1, g0, g1, q) { var o = bus(1, .1), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + .2, g0], [t1 - .05, g1], [t1, 0]]); }
    function rewind(t) { band(t, t + .45, 600, 5200, .12, .2, 2); }
    function knock(t) { var o = ac.createOscillator(), og = ac.createGain(); o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(150, t + .04); o.connect(og); og.connect(bus(1, .2, (rnd() - .5) * .6)); env(og.gain, [[t, 0], [t + .002, .18], [t + .06, 0]]); o.start(t); o.stop(t + .08); }
    function creak(t) { var o = bus(1, .1), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700 + rnd() * 500; bp.Q.value = 12; var n = noise(t, .07); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .005, .5], [t + .06, 0]]); }
    EV.forEach(function (e) {
      if (e.type === 'pop') pop(e.t, e.g, e.f, e.big);
      else if (e.type === 'tick') tick(e.t, .22);
      else if (e.type === 'thump') thump(e.t, .3);
      else if (e.type === 'blip') blip(e.t, e.f);
      else if (e.type === 'rewind') rewind(e.t);
      else if (e.type === 'knock') knock(e.t);
      else if (e.type === 'creak') creak(e.t);
      else if (e.type === 'sizzle') band(e.t, e.t1, 5200, 7600, .03, .12, .5);
      else if (e.type === 'hiss') band(e.t, e.t1, e.small ? 3000 : 2200, e.small ? 3600 : 4200, e.small ? .05 : .04, e.small ? .03 : .16, 1.2);
    });

    /* music: 100 BPM in F, marimba-ish plucks, round bass, a shaker. Out for the pop, back for the payoff */
    var BEAT = .6, M0 = start('cooker') - .1;
    function mar(t, m, g, pan) {
      var c = ac.createOscillator(), mo = ac.createOscillator(), mg = ac.createGain(), og = ac.createGain();
      c.type = 'sine'; c.frequency.value = mtof(m); mo.frequency.value = mtof(m) * 4; mg.gain.value = mtof(m) * .8; mo.connect(mg); mg.connect(c.frequency);
      env(mg.gain, [[t, mtof(m) * .9], [t + .08, 0]]);
      c.connect(og); og.connect(bus(1, .25, pan)); env(og.gain, [[t, 0], [t + .003, g], [t + .35, 0]]); c.start(t); mo.start(t); c.stop(t + .4); mo.stop(t + .4);
    }
    function bass(t, m, dur, g) { var o = ac.createOscillator(), f = ac.createBiquadFilter(), og = ac.createGain(); o.type = 'triangle'; o.frequency.value = mtof(m); f.type = 'lowpass'; f.frequency.value = 600; o.connect(f); f.connect(og); og.connect(bus(1, 0)); env(og.gain, [[t, 0], [t + .01, g], [t + dur * .7, g * .5], [t + dur, 0]]); o.start(t); o.stop(t + dur + .02); }
    function shaker(t, g) { var o = bus(1, 0, .3), hp2 = ac.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 7000; var n = noise(t, .06); n.connect(hp2); hp2.connect(o); env(o.gain, [[t, 0], [t + .01, g], [t + .05, 0]]); }
    var CH = [[65, 69, 72, 76], [62, 65, 69, 72], [58, 62, 65, 69], [60, 64, 67, 70]];   // Fmaj7, Dm7, Bbmaj7, C7
    var RT = [41, 38, 34, 36];
    var off0 = T.pop - .35, on1 = T.burst + .05;
    for (var bt = M0, n = 0; bt < T.home + .2; bt += BEAT / 2, n++) {
      if (bt > off0 && bt < on1) continue;
      var bar = Math.floor(n / 8), chd = CH[bar % 4], late = bt > T.bowl ? 1.25 : bt > on1 ? 1.1 : 1;
      var build = bt < off0 ? .7 + .5 * seg(bt, start('steam'), off0) : 1;
      if (n % 2 === 0) mar(bt, chd[(n / 2) % 4] + 12, .06 * build * late, (n % 4 ? .35 : -.35));
      else if (n % 4 === 3) mar(bt, chd[(n + 1) % 4], .04 * build * late, -.2);
      if (n % 8 === 0) bass(bt, RT[bar % 4], BEAT * 3.6, .14 * late);
      if (n % 8 === 5) bass(bt, RT[bar % 4] + 7, BEAT * .9, .1 * late);
      shaker(bt, (n % 2 ? .05 : .08) * build);
    }
    /* a rising line into the pop, then nothing but the pop */
    var rise = ac.createOscillator(), rg = ac.createGain(), rf = ac.createBiquadFilter(); rise.type = 'sawtooth'; rf.type = 'lowpass'; rf.frequency.value = 900;
    rise.connect(rf); rf.connect(rg); rg.connect(bus(1, .3)); env(rise.frequency, [[T.hot, mtof(53)], [T.pop, mtof(65)]]); env(rg.gain, [[T.hot, 0], [T.pop - .15, .05], [T.pop - .02, 0]]); rise.start(T.hot); rise.stop(T.pop);
    /* the button: a chord on the last word, then one tick that becomes the loop */
    [65, 69, 72, 77].forEach(function (m, j) { mar(T.home - .05 + j * .03, m + 12, .07, j % 2 ? .3 : -.3); });
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['800 84px Archivo', '700 46px Archivo', '600 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×'); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: T.forty + .6, SLUG: 'pop', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
