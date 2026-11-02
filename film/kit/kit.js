/* Motion kit: the shared animation pieces for code-rendered films (factory Shorts, long-form stickman episodes, the
   GTA Shorts). Load it before a film's film.js; it defines window.KIT and nothing else. Every function is a pure
   function of time (t, or u = t - start), so it works under the render(t) contract: no Date.now, no timers, seeded
   noise only. Sizes are in canvas pixels and nothing assumes 9:16 or 16:9; pass W and H where the frame matters.
   What's in it (README.md has a recipe for each):
     rig          guy(g, x, y, s, P, o, t): the stickman (hoodie or classic stick style), IK limbs, squash, spin, faces
     actions      ACT.<name>.pose(u, o) and actor(...): 18 moves (walk, run, jump, wave, point, present, shrug,
                  facepalm, think, confused, celebrate, dance, takeback, mindblown, panic, sneak, fall, dizzy)
     emotes       emote(g, type, x, y, sc, u, t): ! ? sweat anger heart bulb sparkle stars zzz notes dots
     fx           speedLines, streaks, burst, impact, dust, confetti, scribble, arrow, marker, flash, freezeFX
     camera       shake, punch, snap, applyCam
     transitions  tr(g, type, k, W, H, prev, next, o): iris, whip, bars, splat, zoom, slam, spin, cut
     text         sticker, slam, popWords, typeOn, wobble, stretch, counter, caption
     sound        score(ac, EV, DUR): procedural SFX by name (no music: Isac adds the platform sound) */
(function () {
  'use strict';
  var K = {};
  var C = K.C = {
    INK: '#1c1830', NIGHT: '#221d3a', DUSK: '#352b55', HEAD: '#fbf7ef', HEADS: '#e2dbcc', HOOD: '#ff5b3d', HOODS: '#d6412a',
    CREAM: '#f4ede0', PAPER: '#f1e9d8', YEL: '#ffc83d', MINT: '#3fd6a2', RED: '#ff4a3d', BLUE: '#3d7bff', PINK: '#ff7ab6',
    GREEN: '#5fb86b', SKY: '#8fe9ff', PURPLE: '#8b5cf6'
  };
  var INK = C.INK, DISP = 'Archivo', MONO = '"Geist Mono"', PI = Math.PI, TAU = PI * 2;
  K.FONTS = ['900 84px Archivo', '800 84px Archivo', '600 46px Archivo', '500 30px "Geist Mono"', '700 30px "Geist Mono"'];

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function ss(k) { return k * k * (3 - 2 * k); }
  function back(k) { var c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }
  function bounce(k) {
    var n = 7.5625, d = 2.75;
    if (k < 1 / d) return n * k * k;
    if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75;
    if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375;
    return n * (k -= 2.625 / d) * k + .984375;
  }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* a damped spring's step response: a closed form, so it stays a pure function of time */
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = TAU * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .85); }
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .6), 0, 1.15); }
  function knock(t, a, f, d) { if (t < a) return 0; var u = t - a; return Math.exp(-u * (d || 7)) * Math.sin(u * (f || 22)); }
  function mix(a, b, k) {
    if (typeof a === 'number') return lerp(a, b, k);
    if (Array.isArray(a)) return a.map(function (v, i) { return mix(v, b[i], k); });
    return k < .4 ? a : b;
  }
  Object.assign(K, { clamp: clamp, lerp: lerp, seg: seg, eo: eo, eio: eio, ss: ss, back: back, bounce: bounce, hash: hash, mulberry: mulberry, spring: spring, sp: sp, pop: pop, knock: knock, mix: mix });

  /* ---------- canvas primitives ---------- */
  function font(g, px, wt, fam, wide) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); try { g.fontStretch = wide ? 'expanded' : 'normal'; } catch (e) {} }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, TAU); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function fillStroke(g, fill, lw, stroke) { if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = stroke || INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
  Object.assign(K, { font: font, ls: ls, circ: circ, rr: rr, fillStroke: fillStroke });

  /* ---------- the rig ----------
     Body space: feet on y = 0, hips at y = -150, shoulders about -256, head centre about -328, head top -384.
     The figure faces +x; o.flip mirrors it. P (a pose) holds hand and foot targets in body space plus:
       hip (crouch, +down)  lean (torso, rad)  tilt (head, rad)  shr (shoulders up)  look [x, y] (-1..1)
       eyes dot|wide|tiny|happy|shut|x|spiral|heart|star   brow 0|1 up|-1 angry|2 worried
       mouth smile|grin|o|O|frown|wavy|talk|flat|scream|teeth
       jump (body units up)  dx (body units along x)  sq (squash, + flat / - tall)  spin (whole body, rad, about the hips)
       front (draw arms in front of the head, for hands on the face)  elDown (elbows bend downward)
     o (costume): style 'hoodie'|'stick', col/shade (hoodie), legs, seed, flip, hat, capCol, glasses, hold [fnL, fnR] */
  var BASE = K.BASE = { lh: [-62, -150], rh: [62, -150], lf: [-26, 0], rf: [26, 0], hip: 0, lean: 0, tilt: 0, shr: 0, look: [0, 0], eyes: 'dot', brow: 0, mouth: 'smile', jump: 0, dx: 0, sq: 0, spin: 0, front: 0 };
  function P(over) { return Object.assign({}, BASE, over); }
  /* pose keys: [[u, partialPose, blendSeconds], ...]; each key eases from the pose before it */
  function keys(u, ks) {
    var cur = Object.assign({}, BASE), tgt = cur;
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i]; if (u < k[0]) break;
      var nt = Object.assign({}, tgt, k[1]), e = eio(seg(u, k[0], k[0] + (k[2] || .2)));
      var out = {}; for (var key in nt) out[key] = cur[key] === undefined ? nt[key] : mix(cur[key], nt[key], e);
      cur = out; tgt = nt;
    }
    return cur;
  }
  function ik(r, tg, l1, l2, side, down) {
    var dx = tg[0] - r[0], dy = tg[1] - r[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - .5), a = Math.atan2(dy, dx);
    var c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), b = Math.acos(c);
    var e1 = [r[0] + l1 * Math.cos(a + b), r[1] + l1 * Math.sin(a + b)], e2 = [r[0] + l1 * Math.cos(a - b), r[1] + l1 * Math.sin(a - b)];
    var el = down ? (e1[1] > e2[1] ? e1 : e2) : ((e1[0] - r[0]) * side > (e2[0] - r[0]) * side ? e1 : e2);
    var k = Math.min(1, (l1 + l2) / Math.hypot(dx, dy));
    return [el, k < 1 ? [r[0] + dx * k, r[1] + dy * k] : tg];
  }
  function limb(g, pts, w, col, stick) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.lineCap = g.lineJoin = 'round';
    if (stick) { g.strokeStyle = INK; g.lineWidth = w; g.stroke(); return; }
    g.strokeStyle = INK; g.lineWidth = w + 9; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke();
  }
  /* where a body-space point lands on screen, for emotes and props that follow the figure */
  function toScreen(x, y, s, Pp, o, bx, by) {
    Pp = Pp || BASE; o = o || {};
    var sp0 = Pp.spin || 0, cy = by + 150, c = Math.cos(sp0), si = Math.sin(sp0);
    var rx = bx * c - cy * si, ry = bx * si + cy * c - 150;
    ry -= (Pp.jump || 0);
    var sq = Pp.sq || 0, f = o.flip ? -1 : 1;
    return [x + ((Pp.dx || 0) * f + rx * (1 + sq) * f) * s, y + ry * (1 - sq) * s];
  }
  function headLocal(Pp) {
    var hip = [0, -150 + (Pp.hip || 0)], lean = Pp.lean || 0, tilt = lean + (Pp.tilt || 0);
    var nk = [hip[0] + 122 * Math.sin(lean), hip[1] - 122 * Math.cos(lean) - (Pp.shr || 0) * .5];
    return [nk[0] + Math.sin(tilt) * 56, nk[1] - Math.cos(tilt) * 56];
  }
  K.head = function (x, y, s, Pp, o) { var h = headLocal(Pp || BASE); return toScreen(x, y, s, Pp, o, h[0], h[1]); };
  K.toScreen = toScreen;

  function guy(g, x, y, s, Pp, o, t) {
    o = o || {}; Pp = Pp || BASE;
    var stick = o.style === 'stick', col = o.col || C.HOOD, sh = o.shade || C.HOODS, seed = o.seed || 1, bt = Math.floor(t * 8);
    /* line boil at 8 fps: a hand-drawn shimmer */
    function j(i) { return (hash(bt * 13.1 + i * 3.7 + seed * 17.3) - .5) * (o.boil == null ? 2.4 : o.boil); }
    var br = Math.sin(t * 2.2 + seed) * 2.2, sway = Math.sin(t * 1.3 + seed * 2) * 3, sq = Pp.sq || 0;
    g.save(); g.translate(x + (Pp.dx || 0) * s * (o.flip ? -1 : 1), y);
    g.scale(s * (1 + sq) * (o.flip ? -1 : 1), s * (1 - sq));
    g.translate(0, -(Pp.jump || 0));
    if (Pp.spin) { g.translate(0, -150); g.rotate(Pp.spin); g.translate(0, 150); }
    var hip = [0, -150 + (Pp.hip || 0)], lean = Pp.lean || 0, shr = Pp.shr || 0;
    function R(px, py) { return [hip[0] + px * Math.cos(lean) - py * Math.sin(lean), hip[1] + px * Math.sin(lean) + py * Math.cos(lean)]; }
    var sw = stick ? 0 : 40, shL = R(-sw, -106 - br * .3 - shr), shR = R(sw, -106 - br * .3 - shr), neck = R(0, -122 - br * .5 - shr * .5);
    var lw = stick ? 11 : 13;
    /* legs */
    [[-1, Pp.lf], [1, Pp.rf]].forEach(function (L, i) {
      var root = [hip[0] + L[0] * (stick ? 4 : 20), hip[1]], tg = [L[1][0] + j(i), L[1][1]], r = ik(root, tg, 80, 78, L[0], false);
      limb(g, [root, [r[0][0] + j(i + 4), r[0][1] + j(i + 6)], r[1]], lw, o.legs || C.HEAD, stick);
      if (!stick) { g.save(); g.translate(r[1][0] + 7, r[1][1] + 2); g.beginPath(); g.ellipse(0, 0, 19, 10, 0, 0, TAU); fillStroke(g, o.shoe || INK, 0); g.restore(); }
    });
    /* torso */
    if (stick) {
      limb(g, [hip, R(j(1) * .5, -60), neck], lw, INK, true);
    } else {
      g.save(); g.translate(hip[0], hip[1]); g.rotate(lean);
      g.beginPath(); g.moveTo(-47 + j(1) * .5, 6); g.quadraticCurveTo(-55, -58, -43 + j(2) * .5, -112 - br * .3 - shr); g.quadraticCurveTo(0, -130 - br * .4 - shr, 43, -112 - br * .3 - shr); g.quadraticCurveTo(55, -58, 47, 6); g.quadraticCurveTo(0, 13, -47, 6); g.closePath();
      fillStroke(g, col, 0); g.save(); g.clip(); g.fillStyle = sh; g.fillRect(16, -150, 60, 170); g.restore();
      fillStroke(g, null, 5);
      g.beginPath(); g.moveTo(-28, -50); g.lineTo(28, -50); g.lineTo(22, -18); g.lineTo(-22, -18); g.closePath(); fillStroke(g, sh, 4);
      if (o.tie) { g.beginPath(); g.moveTo(0, -116); g.lineTo(-9, -96); g.lineTo(0, -50); g.lineTo(9, -96); g.closePath(); fillStroke(g, o.tie, 3.5); }
      else { g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-9, -110 - shr); g.lineTo(-11, -84); g.moveTo(9, -110 - shr); g.lineTo(11, -84); g.stroke(); }
      g.beginPath(); g.ellipse(0, -117 - br * .4 - shr, 32, 12, 0, 0, TAU); fillStroke(g, sh, 4.5);
      g.restore();
    }
    function arms() {
      [[-1, Pp.lh, shL], [1, Pp.rh, shR]].forEach(function (A, i) {
        var tg = [A[1][0] + sway * (i ? -.3 : .3) + j(i + 9), A[1][1] + j(i + 11)], r = ik(A[2], tg, 70, 66, A[0], !!Pp.elDown);
        limb(g, [A[2], [r[0][0] + j(i + 13), r[0][1]], r[1]], stick ? lw : 15, col, stick);
        if (!stick) { circ(g, r[1][0], r[1][1], 12.5); fillStroke(g, C.HEAD, 4.5); }
        if (o.hold && o.hold[i]) { g.save(); g.translate(r[1][0], r[1][1]); o.hold[i](g, t); g.restore(); }
      });
    }
    if (!Pp.front) arms();
    /* head */
    var tilt = lean + (Pp.tilt || 0), hc = [neck[0] + Math.sin(tilt) * 56, neck[1] - Math.cos(tilt) * 56];
    g.save(); g.translate(hc[0] + j(20) * .5, hc[1]); g.rotate(tilt);
    circ(g, 0, 0, 56); fillStroke(g, C.HEADS, 0);
    g.save(); circ(g, 0, 0, 56); g.clip(); circ(g, -9, -8, 54); g.fillStyle = C.HEAD; g.fill(); g.restore();
    circ(g, 0, 0, 56); fillStroke(g, null, stick ? 7 : 5);
    face(g, Pp, t, seed);
    hat(g, o);
    if (o.glasses) { g.strokeStyle = INK; g.lineWidth = 4; circ(g, -20, -4, 15); g.stroke(); circ(g, 20, -4, 15); g.stroke(); g.beginPath(); g.moveTo(-5, -5); g.lineTo(5, -5); g.stroke(); }
    g.restore();
    if (Pp.front) arms();
    g.restore();
  }
  /* keep = add to the current path (an iris mask) instead of starting a new one */
  function star(g, x, y, r, n, inner, keep) {
    if (!keep) g.beginPath();
    for (var i = 0; i < n * 2; i++) { var a = -PI / 2 + i * PI / n, rr2 = i % 2 ? r * (inner || .45) : r; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
    g.closePath();
  }
  function heartPath(g, x, y, s, keep) {
    if (!keep) g.beginPath(); g.moveTo(x, y + s * .9);
    g.bezierCurveTo(x - s * 1.4, y - s * .1, x - s * .7, y - s * 1.1, x, y - s * .35);
    g.bezierCurveTo(x + s * .7, y - s * 1.1, x + s * 1.4, y - s * .1, x, y + s * .9); g.closePath();
  }
  function face(g, Pp, t, seed) {
    var lx = (Pp.look ? Pp.look[0] : 0) * 7, ly = (Pp.look ? Pp.look[1] : 0) * 6;
    var blink = ((t + seed * 1.37) % 3.7) < .11, e = blink && /dot|wide|tiny/.test(Pp.eyes) ? 'shut' : Pp.eyes;
    g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round';
    [-1, 1].forEach(function (sd) {
      var ex = sd * 19 + lx, ey = -4 + ly;
      if (e === 'dot') { g.beginPath(); g.ellipse(ex, ey, 7.5, 10, 0, 0, TAU); g.fill(); circ(g, ex - 2.5, ey - 4, 2.4); g.fillStyle = '#fff'; g.fill(); g.fillStyle = INK; }
      else if (e === 'wide') { g.beginPath(); g.ellipse(ex, ey, 11, 15, 0, 0, TAU); g.fill(); circ(g, ex - 3.5, ey - 5, 3.6); g.fillStyle = '#fff'; g.fill(); g.fillStyle = INK; }
      else if (e === 'tiny') { circ(g, ex, ey, 4.5); g.fill(); }
      else if (e === 'happy') { g.lineWidth = 5.5; g.beginPath(); g.arc(ex, ey + 5, 9, PI * 1.15, PI * 1.85); g.stroke(); }
      else if (e === 'x') { g.lineWidth = 5; g.beginPath(); g.moveTo(ex - 7, ey - 7); g.lineTo(ex + 7, ey + 7); g.moveTo(ex + 7, ey - 7); g.lineTo(ex - 7, ey + 7); g.stroke(); }
      else if (e === 'spiral') { g.lineWidth = 3.5; g.beginPath(); for (var a = 0; a < 16; a += .3) { var r0 = a * .7, an = a * sd + t * 9 * sd; g.lineTo(ex + Math.cos(an) * r0, ey + Math.sin(an) * r0); } g.stroke(); }
      else if (e === 'heart') { heartPath(g, ex, ey, 10 + Math.sin(t * 14) * 1.5); g.fillStyle = C.RED; g.fill(); g.lineWidth = 3; g.stroke(); g.fillStyle = INK; }
      else if (e === 'star') { star(g, ex, ey, 12, 5, .5); g.fillStyle = C.YEL; g.fill(); g.lineWidth = 3; g.stroke(); g.fillStyle = INK; }
      else { g.lineWidth = 5; g.beginPath(); g.moveTo(ex - 8, ey + 1); g.lineTo(ex + 8, ey + 1); g.stroke(); }
      /* brows: 1 raised, -1 angry (inner ends down), 2 worried (inner ends up) */
      var b = Pp.brow || 0, by = -27 + ly * .5 - (b === 1 ? 8 : 0), inner = b === -1 ? 7 : b === 2 ? -7 : 0;
      g.lineWidth = 5; g.beginPath(); g.moveTo(sd * 8 + lx, by + inner); g.lineTo(sd * 30 + lx, by); g.stroke();
    });
    var m = Pp.mouth, my = 24 + ly * .5, mx = lx * .6;
    g.lineWidth = 5;
    if (m === 'smile') { g.beginPath(); g.arc(mx, my - 8, 13, PI * .2, PI * .8); g.stroke(); }
    else if (m === 'grin') { g.beginPath(); g.moveTo(mx - 17, my - 4); g.quadraticCurveTo(mx, my - 8, mx + 17, my - 4); g.quadraticCurveTo(mx, my + 22, mx - 17, my - 4); g.fill(); g.save(); g.clip(); circ(g, mx, my + 14, 9); g.fillStyle = '#ff7a8a'; g.fill(); g.restore(); }
    else if (m === 'o') { g.beginPath(); g.ellipse(mx, my, 6, 8, 0, 0, TAU); g.fill(); }
    else if (m === 'O') { g.beginPath(); g.ellipse(mx, my + 2, 11, 15, 0, 0, TAU); g.fill(); }
    else if (m === 'scream') { var op = 1 + Math.sin(t * 30) * .08; g.beginPath(); g.ellipse(mx, my + 4, 15, 19 * op, 0, 0, TAU); g.fill(); g.save(); g.clip(); circ(g, mx, my + 22, 10); g.fillStyle = '#ff7a8a'; g.fill(); g.restore(); }
    else if (m === 'teeth') { rr(g, mx - 18, my - 8, 36, 18, 6); fillStroke(g, '#fff', 4); g.beginPath(); g.moveTo(mx - 18, my + 1); g.lineTo(mx + 18, my + 1); for (var k2 = -1; k2 <= 1; k2++) { g.moveTo(mx + k2 * 9, my - 8); g.lineTo(mx + k2 * 9, my + 10); } g.lineWidth = 2.5; g.stroke(); }
    else if (m === 'frown') { g.beginPath(); g.arc(mx, my + 10, 12, PI * 1.2, PI * 1.8); g.stroke(); }
    else if (m === 'wavy') { g.beginPath(); g.moveTo(mx - 15, my); for (var i = 1; i <= 6; i++) g.lineTo(mx - 15 + i * 5, my + (i % 2 ? -4 : 4)); g.stroke(); }
    else if (m === 'talk') { var o2 = .5 + .5 * Math.abs(Math.sin(t * 15)); g.beginPath(); g.ellipse(mx, my, 9, 3 + o2 * 8, 0, 0, TAU); g.fill(); }
    else { g.beginPath(); g.moveTo(mx - 10, my); g.lineTo(mx + 10, my); g.stroke(); }
  }
  function hat(g, o) {
    if (o.hat === 'cap') { g.beginPath(); g.arc(0, -16, 55, PI * 1.02, -.02); g.closePath(); fillStroke(g, o.capCol || C.GREEN, 5); g.beginPath(); g.moveTo(30, -18); g.quadraticCurveTo(80, -22, 92, -8); g.lineTo(34, -6); g.closePath(); fillStroke(g, o.capCol || C.GREEN, 5); }
    else if (o.hat === 'beanie') { g.beginPath(); g.arc(0, -14, 56, PI, 0); g.closePath(); fillStroke(g, o.capCol || C.BLUE, 5); rr(g, -60, -24, 120, 20, 8); fillStroke(g, o.capCol || C.BLUE, 5); circ(g, 0, -74, 12); fillStroke(g, C.CREAM, 4); }
    else if (o.hat === 'crown') { g.beginPath(); g.moveTo(-40, -40); g.lineTo(-44, -88); g.lineTo(-20, -62); g.lineTo(0, -98); g.lineTo(20, -62); g.lineTo(44, -88); g.lineTo(40, -40); g.closePath(); fillStroke(g, C.YEL, 5); }
  }
  K.guy = guy; K.face = face; K.star = star; K.heart = heartPath;
  K.keys = keys; K.pose = P;

  /* ---------- actions: u is seconds since the action started; loops are seamless, one-shots hold their last pose ---------- */
  var ACT = K.ACT = {};
  function cyc(u, T) { var p = u / T * TAU; return [Math.sin(p), Math.cos(p)]; }
  ACT.walk = { loop: .9, pose: function (u, o) {
    o = o || {}; var c = cyc(u, o.T || .9), s = c[0], co = c[1], st = o.stride || 40;
    return P({ lf: [-6 + s * st, -Math.max(0, co) * 26], rf: [6 - s * st, -Math.max(0, -co) * 26], lh: [-34 - s * 36, -158], rh: [34 + s * 36, -158], hip: 8 * Math.abs(s), lean: .05, look: [.5, 0], dx: (o.speed || 0) * u });
  } };
  ACT.run = { loop: .46, pose: function (u, o) {
    o = o || {}; var c = cyc(u, o.T || .46), s = c[0], co = c[1], st = o.stride || 66;
    return P({ lf: [10 + s * st, -Math.max(0, co) * 62], rf: [10 - s * st, -Math.max(0, -co) * 62], lh: [-6 - s * 62, -222 + co * 18], rh: [16 + s * 62, -222 - co * 18], hip: 22 + 10 * Math.abs(s), lean: .3, tilt: -.12, brow: -1, mouth: 'flat', look: [1, 0], jump: 14 * Math.abs(co), dx: (o.speed || 0) * u });
  } };
  ACT.panic = { loop: .4, pose: function (u, o) {
    var p = ACT.run.pose(u, Object.assign({ T: .4, stride: 52 }, o));
    return Object.assign(p, { lh: [-74 + Math.sin(u * 23) * 30, -386 + Math.cos(u * 17) * 22], rh: [74 + Math.sin(u * 19 + 1) * 30, -390 + Math.cos(u * 21) * 22], lean: -.04, tilt: Math.sin(u * 11) * .1, mouth: 'scream', eyes: 'wide', brow: 2, look: [-.6, -.2] });
  }, emote: ['sweat', 0] };
  ACT.sneak = { loop: 1.6, pose: function (u, o) {
    o = o || {}; var c = cyc(u, 1.6), s = c[0], co = c[1];
    return P({ lf: [8 + s * 58, -Math.max(0, co) * 44], rf: [8 - s * 58, -Math.max(0, -co) * 44], lh: [56, -236 + co * 6], rh: [98, -250 - co * 6], hip: 46 + 6 * Math.abs(s), lean: .32, tilt: -.2, eyes: 'tiny', mouth: 'o', look: [1, 0], brow: 1, dx: (o.speed || 0) * u });
  } };
  ACT.jump = { loop: 1.4, pose: function (u) {
    var a = u % 1.4, pre = seg(a, 0, .2), air = seg(a, .22, .78), land = a - .78;
    var p = keys(a, [[0, {}], [0, { hip: 44, lean: .18, lh: [-96, -126], rh: [-70, -120], mouth: 'flat', brow: -1 }, .18], [.2, { hip: -6, lean: 0, lh: [-52, -392], rh: [52, -392], mouth: 'grin', eyes: 'happy', lf: [-36, -60], rf: [34, -76] }, .1], [.74, { lf: [-30, 0], rf: [30, 0], hip: 40, lh: [-110, -240], rh: [110, -240], mouth: 'O', eyes: 'dot' }, .06], [.95, { hip: 0, lh: [-62, -150], rh: [62, -150], mouth: 'smile' }, .3]]);
    p.jump = air > 0 && air < 1 ? 280 * 4 * air * (1 - air) : 0;
    p.sq = a < .2 ? .14 * ss(pre) : a < .4 ? -.16 * (1 - seg(a, .2, .4)) : land > 0 ? .17 * Math.exp(-land * 9) * Math.cos(land * 22) : 0;
    return p;
  }, emote: ['dust', .78] };
  ACT.wave = { loop: 2, pose: function (u) {
    var p = keys(u, [[0, {}], [.05, { rh: [96, -372], mouth: 'grin', tilt: .08, brow: 1 }, .2]]);
    if (u > .2) { p.rh = [96 + Math.sin(u * 13) * 34, -372 + Math.abs(Math.cos(u * 13)) * 10]; p.tilt = .08 + Math.sin(u * 6.5) * .05; }
    return p;
  } };
  ACT.point = { pose: function (u) {
    var p = keys(u, [[0, {}], [.08, { rh: [182, -280], lh: [-58, -176], look: [1, -.1], mouth: 'talk', brow: 1, lean: -.06, tilt: .05 }, .14]]);
    p.rh = [p.rh[0] + knock(u, .22, 24, 8) * 18, p.rh[1]];
    return p;
  } };
  ACT.present = { pose: function (u) {
    var p = keys(u, [[0, {}], [0, { hip: 26, lh: [-36, -170], rh: [36, -170], eyes: 'shut' }, .15], [.2, { hip: 0, lh: [-170, -318], rh: [170, -318], eyes: 'happy', mouth: 'grin', brow: 1, lf: [-48, 0], rf: [48, 0] }, .12]]);
    var a = seg(u, .2, .5); p.jump = 60 * 4 * a * (1 - a); p.sq = u > .5 ? .1 * knock(u, .5, 26, 8) : 0;
    return p;
  }, emote: ['sparkle', .45] };
  ACT.shrug = { pose: function (u) {
    var p = keys(u, [[0, {}], [.1, { lh: [-118, -206], rh: [118, -206], shr: 16, tilt: .2, brow: 1, mouth: 'wavy', look: [0, -.3], elDown: 1 }, .18]]);
    p.shr += knock(u, .3, 18, 6) * 6; return p;
  } };
  ACT.facepalm = { pose: function (u) {
    var p = keys(u, [[0, {}], [.1, { rh: [16, -318], front: 1, tilt: .32, lean: .1, eyes: 'shut', mouth: 'frown', brow: 2 }, .18]]);
    if (u > .5) p.tilt += Math.sin((u - .5) * 9) * .06;
    return p;
  } };
  ACT.think = { pose: function (u) {
    var p = keys(u, [[0, {}], [.1, { rh: [22, -286], lh: [18, -206], front: 1, look: [.6, -.9], tilt: -.16, mouth: 'flat', brow: 1 }, .25], [1.2, { eyes: 'wide', mouth: 'O', brow: 1, look: [0, -1] }, .08]]);
    p.rh = [p.rh[0], p.rh[1] + (u > .35 && u < 1.2 ? Math.sin(u * 14) * 5 : 0)];
    return p;
  }, emote: ['dots', .35, 'bulb', 1.2] };
  ACT.confused = { pose: function (u) {
    var p = keys(u, [[0, {}], [.1, { rh: [34, -388], lh: [-62, -150], front: 1, tilt: .16, look: [-.5, -.6], mouth: 'wavy', brow: 2 }, .2]]);
    if (u > .3) p.rh = [34 + Math.sin(u * 26) * 10, -388];
    return p;
  }, emote: ['?', .2] };
  ACT.celebrate = { loop: .6, pose: function (u) {
    var a = (u % .6) / .6, pump = Math.sin(u / .6 * TAU);
    return P({ lh: [-112, -392 + pump * 26], rh: [112, -392 - pump * 26], eyes: 'happy', mouth: 'grin', brow: 1, jump: 70 * 4 * a * (1 - a), sq: a < .12 ? .1 * (1 - a / .12) : 0, lf: [-30, -18 * Math.sin(a * PI)], rf: [30, -18 * Math.sin(a * PI)] });
  }, emote: ['sparkle', 0] };
  ACT.dance = { loop: .8, pose: function (u) {
    var c = cyc(u, .8), s = c[0];
    return P({ lean: s * .16, tilt: -s * .2, hip: 12 + 10 * Math.abs(s), lf: [-40 + s * 12, -Math.max(0, s) * 34], rf: [40 + s * 12, -Math.max(0, -s) * 34], lh: [-112, -300 + s * 90], rh: [112, -300 - s * 90], eyes: 'happy', mouth: 'grin', dx: 0 });
  }, emote: ['notes', 0] };
  ACT.takeback = { pose: function (u) {
    var p = keys(u, [[0, { look: [1, 0] }], [.15, { lh: [-112, -352], rh: [96, -364], lean: -.26, eyes: 'wide', mouth: 'O', brow: 1, look: [1, -.2], lf: [-50, 0], rf: [10, -40] }, .06], [.55, { lf: [-40, 0], rf: [30, 0], lh: [-80, -300], rh: [70, -310] }, .3]]);
    var a = seg(u, .15, .5); p.jump = 70 * Math.sin(PI * a); p.dx = -60 * eo(seg(u, .15, .5));
    p.sq = u < .15 ? 0 : u < .3 ? -.16 * (1 - seg(u, .15, .3)) : .14 * knock(u, .5, 24, 7);
    return p;
  }, emote: ['!', .15, 'sweat', .6] };
  ACT.mindblown = { pose: function (u) {
    var p = keys(u, [[0, { look: [0, -.2] }], [.05, { lh: [-58, -338], rh: [58, -338], front: 1, eyes: 'wide', mouth: 'O', brow: 1 }, .2], [.6, { lh: [-150, -360], rh: [150, -360], eyes: 'spiral', mouth: 'scream', front: 0 }, .1]]);
    p.tilt = u > .6 ? knock(u, .6, 30, 5) * .3 : 0; p.jump = u > .6 ? 30 * Math.max(0, knock(u, .6, 14, 6)) : 0;
    return p;
  }, emote: ['boom', .6] };
  ACT.fall = { pose: function (u, o) {
    /* a slip: feet fly forward, the body falls backwards (o.forward = a trip instead) */
    var dir = o && o.forward ? 1 : -1, a = seg(u, .1, .55);
    var p = keys(u, [[0, { look: [1, 0] }], [.08, { lf: [70, -120], rf: [40, -160], lh: [-130, -330], rh: [120, -340], eyes: 'wide', mouth: 'O', brow: 2 }, .1], [.55, { lf: [60, -40], rf: [30, -70], lh: [-160, -200], rh: [150, -210], eyes: 'x', mouth: 'wavy', brow: 0 }, .12]]);
    p.spin = dir * PI / 2 * eio(a) + (u > .55 ? dir * .05 * knock(u, .55, 20, 7) : 0);
    p.jump = 90 * Math.sin(PI * seg(u, .05, .4)) - 128 * eio(seg(u, .25, .55)) + (u > .55 ? 14 * Math.abs(knock(u, .55, 22, 7)) : 0);
    return p;
  }, emote: ['impact', .55, 'stars', .7] };
  ACT.dizzy = { loop: 1.57, pose: function (u) {
    return P({ lean: Math.sin(u * 4) * .14, tilt: Math.cos(u * 4) * .18, eyes: 'spiral', mouth: 'wavy', lh: [-96, -150 + Math.sin(u * 4) * 20], rh: [96, -150 - Math.sin(u * 4) * 20], lf: [-30 + Math.sin(u * 4) * 10, 0], rf: [30 + Math.sin(u * 4) * 10, 0], hip: 10 });
  }, emote: ['stars', 0] };
  ACT.idle = { pose: function (u) { return P({ look: [Math.sin(u * .7) * .4, 0] }); } };
  K.ACTIONS = Object.keys(ACT);
  /* draw an action, with its signature emote (o.emote === false turns it off) */
  K.actor = function (g, x, y, s, name, u, o, t) {
    var A = ACT[name], Pp = A.pose(u, o || {}); guy(g, x, y, s, Pp, o, t);
    if (o && o.emote === false) return Pp;
    var em = A.emote || [], h = K.head(x, y, s, Pp, o);
    for (var i = 0; i < em.length; i += 2) {
      var ty = em[i], u0 = u - em[i + 1]; if (u0 < 0) continue;
      if (ty === 'dust') K.dust(g, x + (Pp.dx || 0) * s, y, u0, s);
      else if (ty === 'impact') K.impact(g, h[0], y - 30 * s, u0, s * 1.4, C.CREAM);
      else if (ty === 'boom') K.burst(g, h[0], h[1] - 40 * s, 150 * s * pop(u0, 0, 3.5, .5), u0, C.YEL, 'BOOM', s * 1.1);
      else if (ty === 'stars') K.emote(g, 'stars', h[0], h[1] - 70 * s, s, u0, t);
      else if (ty === 'dots' && em[i + 3] != null && u >= em[i + 3]) continue;   /* the thought bubble gives way to the idea */
      else K.emote(g, ty, h[0] + 70 * s * (o && o.flip ? -1 : 1), h[1] - 70 * s, s, u0, t);
    }
    return Pp;
  };

  /* ---------- emotes: drawn at (x, y), scale sc (1 = a head of radius 56), u = seconds since it appeared ---------- */
  K.emote = function (g, type, x, y, sc, u, t) {
    if (u < 0) return; sc = sc || 1;
    var k = pop(u, 0, 3.6, .45);
    g.save(); g.translate(x, y); g.scale(sc * k, sc * k); g.lineJoin = g.lineCap = 'round';
    if (type === '!') {
      g.rotate(.12 + knock(u, 0, 26, 6) * .3);
      g.beginPath(); g.moveTo(-14, -96); g.lineTo(14, -96); g.lineTo(7, -10); g.lineTo(-7, -10); g.closePath(); fillStroke(g, C.RED, 7);
      circ(g, 0, 18, 13); fillStroke(g, C.RED, 7);
    } else if (type === '?') {
      g.rotate(Math.sin(t * 3) * .15); K.sticker(g, '?', 0, -30, 120, { col: C.YEL });
    } else if (type === 'sweat') {
      var d = (u * 1.4) % 1;
      g.globalAlpha *= 1 - ss(seg(d, .6, 1)); g.translate(-20, -40 + d * 70);
      g.beginPath(); g.moveTo(0, -26); g.quadraticCurveTo(18, 2, 0, 10); g.quadraticCurveTo(-18, 2, 0, -26); fillStroke(g, C.SKY, 5);
    } else if (type === 'anger') {
      var pul = 1 + Math.sin(t * 14) * .12; g.scale(pul, pul); g.strokeStyle = C.RED; g.lineWidth = 9;
      for (var i = 0; i < 4; i++) { g.save(); g.rotate(i * PI / 2); g.beginPath(); g.moveTo(8, -28); g.quadraticCurveTo(8, -8, 28, -8); g.stroke(); g.restore(); }
    } else if (type === 'heart') {
      var b = 1 + Math.max(0, Math.sin(t * 9)) * .18; g.scale(b, b); heartPath(g, 0, -10, 34); fillStroke(g, C.PINK, 6);
    } else if (type === 'bulb') {
      var on = u > .1;
      if (on) { g.strokeStyle = C.YEL; g.lineWidth = 7; for (i = 0; i < 7; i++) { var a = -PI / 2 + (i - 3) * .42, r1 = 62 + Math.sin(t * 20 + i) * 4; g.beginPath(); g.moveTo(Math.cos(a) * 52, -40 + Math.sin(a) * 52); g.lineTo(Math.cos(a) * r1 * 1.25, -40 + Math.sin(a) * r1 * 1.25); g.stroke(); } }
      circ(g, 0, -40, 36); fillStroke(g, on ? C.YEL : C.HEADS, 6);
      rr(g, -18, -6, 36, 26, 5); fillStroke(g, '#b8b2c4', 5);
    } else if (type === 'sparkle') {
      [[-30, -40, 30, 0], [34, -70, 22, 1.7], [30, 0, 16, 3.1]].forEach(function (q) {
        var tw = .6 + .4 * Math.abs(Math.sin(t * 6 + q[3]));
        star(g, q[0], q[1], q[2] * tw, 4, .28); fillStroke(g, C.YEL, 4);
      });
    } else if (type === 'stars') {
      for (i = 0; i < 4; i++) { var an = t * 5 + i * TAU / 4, sx = Math.cos(an) * 80, sy = Math.sin(an) * 22; star(g, sx, sy, 17 + sy * .25, 5, .45); fillStroke(g, C.YEL, 4); }
    } else if (type === 'zzz') {
      for (i = 0; i < 3; i++) { var z = ((u * .7 + i / 3) % 1); g.globalAlpha = Math.sin(z * PI); K.sticker(g, 'Z', z * 50, -z * 120, 40 + i * 10, { col: C.CREAM, shadow: false }); }
      g.globalAlpha = 1;
    } else if (type === 'notes') {
      for (i = 0; i < 2; i++) {
        var n = ((u * .8 + i * .5) % 1), nx = i * 46 + Math.sin(n * 8) * 12, ny = -n * 120;
        g.save(); g.globalAlpha = Math.sin(n * PI); g.translate(nx, ny); g.rotate(Math.sin(t * 6 + i) * .2);
        g.beginPath(); g.ellipse(-8, 18, 13, 10, -.4, 0, TAU); fillStroke(g, C.MINT, 5);
        g.beginPath(); g.moveTo(4, 14); g.lineTo(4, -30); g.lineTo(26, -20); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.restore();
      }
    } else if (type === 'dots') {
      circ(g, -40, 30, 9); fillStroke(g, C.CREAM, 5); circ(g, -20, 0, 14); fillStroke(g, C.CREAM, 5);
      g.beginPath(); g.ellipse(30, -60, 70, 46, 0, 0, TAU); fillStroke(g, C.CREAM, 6);
      for (i = 0; i < 3; i++) { circ(g, 6 + i * 24, -58 - Math.max(0, Math.sin(t * 8 - i)) * 8, 7); g.fillStyle = INK; g.fill(); }
    }
    g.restore();
  };
  K.EMOTES = ['!', '?', 'sweat', 'anger', 'heart', 'bulb', 'sparkle', 'stars', 'zzz', 'notes', 'dots'];

  /* ---------- fx ---------- */
  /* manga focus lines: radial streaks from the frame edge toward (cx, cy), re-drawn 12 times a second */
  K.speedLines = function (g, W, H, cx, cy, t, a, o) {
    if (a <= 0) return; o = o || {};
    var n = o.n || 70, st = Math.floor(t * 12), R = Math.hypot(W, H), r0 = o.r0 || Math.min(W, H) * .32;
    g.save(); g.globalAlpha *= a; g.fillStyle = o.col || C.CREAM;
    for (var i = 0; i < n; i++) {
      var an = (i + hash(i * 3.3 + st * 1.7) * .9) / n * TAU, w = (2 + hash(i * 7.7 + st) * 7) / R, r1 = r0 * (.75 + hash(i * 5.1 + st * .7) * .7);
      g.beginPath(); g.moveTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1);
      g.lineTo(cx + Math.cos(an - w * 8) * R, cy + Math.sin(an - w * 8) * R); g.lineTo(cx + Math.cos(an + w * 8) * R, cy + Math.sin(an + w * 8) * R); g.closePath(); g.fill();
    }
    g.restore();
  };
  /* horizontal motion streaks trailing something moving along dir (+1 right) */
  K.streaks = function (g, x, y, len, h, t, a, o) {
    if (a <= 0) return; o = o || {};
    var n = o.n || 9, dir = o.dir || 1, st = Math.floor(t * 15);
    g.save(); g.globalAlpha *= a; g.strokeStyle = o.col || C.CREAM; g.lineCap = 'round';
    for (var i = 0; i < n; i++) {
      var yy = y + (hash(i * 2.1) - .5) * h, l = len * (.4 + .6 * hash(i * 9.3 + st)), x0 = x - dir * (20 + hash(i * 4.4 + st) * 40);
      g.lineWidth = 4 + hash(i) * 6; g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 - dir * l, yy); g.stroke();
    }
    g.restore();
  };
  /* a comic burst: a jagged star with an optional word in it */
  K.burst = function (g, x, y, r, u, col, word, sc) {
    if (r <= 0) return;
    g.save(); g.translate(x, y); g.rotate(-.1 + Math.sin(u * 3) * .04);
    function spikes(R, seed) { g.beginPath(); for (var i = 0; i < 28; i++) { var a = i / 28 * TAU, rr2 = i % 2 ? R * (.6 + hash(i * 1.3 + seed) * .14) : R * (.92 + hash(i * 2.7 + seed) * .16); g.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } g.closePath(); }
    spikes(r, 1); fillStroke(g, col || C.YEL, 9);
    spikes(r * .66, 5); fillStroke(g, C.RED, 0);
    if (word) K.sticker(g, word, 0, 4, Math.round(r * .36), { col: C.CREAM, rot: 0 });
    g.restore();
  };
  /* a hit: one ring and eight spikes, gone in 0.35 s */
  K.impact = function (g, x, y, u, sc, col) {
    if (u < 0 || u > .4) return; sc = sc || 1; var k = eo(u / .35), a = 1 - seg(u, .15, .4);
    g.save(); g.globalAlpha *= a; g.strokeStyle = col || C.CREAM; g.lineCap = 'round';
    g.lineWidth = 10 * sc * (1 - k * .6); circ(g, x, y, (30 + 140 * k) * sc); g.stroke();
    for (var i = 0; i < 8; i++) { var an = i / 8 * TAU + .2, r0 = (60 + 120 * k) * sc, r1 = (90 + 200 * k) * sc; g.lineWidth = 9 * sc * (1 - k * .5); g.beginPath(); g.moveTo(x + Math.cos(an) * r0, y + Math.sin(an) * r0); g.lineTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); g.stroke(); }
    g.restore();
  };
  /* dust puffs kicked out sideways from a landing at (x, y) */
  K.dust = function (g, x, y, u, sc) {
    if (u < 0 || u > .6) return; sc = sc || 1;
    g.save(); g.fillStyle = C.CREAM; g.strokeStyle = INK; g.lineWidth = 4 * sc;
    for (var i = 0; i < 8; i++) {
      var sd = i % 2 ? 1 : -1, h = hash(i * 3.7), d = eo(u / .5) * (40 + 120 * h) * sc, r = (16 + 14 * hash(i * 1.9)) * sc * (1 - u / .6);
      circ(g, x + sd * (30 * sc + d), y - 10 * sc - d * .3 * h, r); g.globalAlpha = .9; g.fill(); g.stroke();
    }
    g.restore();
  };
  /* confetti from (x0, y0): ballistic then fluttering; pure function of u */
  K.confetti = function (g, x0, y0, u, n, seed, sc) {
    if (u < 0) return; sc = sc || 1; var r = mulberry(seed || 9), cols = [C.YEL, C.RED, C.BLUE, C.MINT, C.PINK, C.CREAM];
    for (var i = 0; i < (n || 90); i++) {
      var vx = (r() - .5) * 1500 * sc, vy = -(700 + r() * 1100) * sc, sp2 = r() * 14 + 4, ph = r() * TAU, col = cols[i % cols.length], w = (14 + r() * 14) * sc;
      var tt = Math.min(u, .6), x = x0 + vx * tt * (1 - tt * .6) + Math.sin(u * 3 + ph) * 40 * sc * seg(u, .4, 1), y = y0 + vy * tt + 1600 * sc * tt * tt + Math.max(0, u - .6) * 380 * sc;
      g.save(); g.translate(x, y); g.rotate(u * sp2 + ph); g.scale(1, Math.cos(u * sp2 * .8 + ph)); g.fillStyle = col; g.fillRect(-w / 2, -w * .3, w, w * .6); g.restore();
    }
  };
  /* a hand-drawn circle around (x, y), drawn on as k goes 0 → 1 */
  K.scribble = function (g, x, y, rx, ry, k, col, lw, seed) {
    if (k <= 0) return; seed = seed || 1;
    g.save(); g.strokeStyle = col || C.RED; g.lineWidth = lw || 10; g.lineCap = g.lineJoin = 'round'; g.beginPath();
    var a0 = -2.2 + hash(seed) * .5, n = 80, span = TAU * 1.12 * k;
    for (var i = 0; i <= n; i++) { var a = a0 + span * i / n, w = 1 + .07 * Math.sin(a * 3 + seed) + .05 * (i / n); g.lineTo(x + Math.cos(a) * rx * w, y + Math.sin(a) * ry * w); }
    g.stroke(); g.restore();
  };
  /* a hand-drawn curved arrow from (x0, y0) to (x1, y1), drawn on as k goes 0 → 1 */
  K.arrow = function (g, x0, y0, x1, y1, k, col, lw, bend) {
    if (k <= 0) return; var mx = (x0 + x1) / 2 - (y1 - y0) * (bend == null ? .3 : bend), my = (y0 + y1) / 2 + (x1 - x0) * (bend == null ? .3 : bend);
    function q(u) { var v = 1 - u; return [v * v * x0 + 2 * v * u * mx + u * u * x1, v * v * y0 + 2 * v * u * my + u * u * y1]; }
    g.save(); g.strokeStyle = col || C.CREAM; g.lineWidth = lw || 10; g.lineCap = g.lineJoin = 'round'; g.beginPath();
    for (var i = 0; i <= 40; i++) { var p = q(k * i / 40); g.lineTo(p[0], p[1]); } g.stroke();
    if (k > .8) { var e = q(k), b = q(k - .05), an = Math.atan2(e[1] - b[1], e[0] - b[0]), hl = (lw || 10) * 3.4 * seg(k, .8, 1); g.beginPath(); g.moveTo(e[0] - Math.cos(an - .5) * hl, e[1] - Math.sin(an - .5) * hl); g.lineTo(e[0], e[1]); g.lineTo(e[0] - Math.cos(an + .5) * hl, e[1] - Math.sin(an + .5) * hl); g.stroke(); }
    g.restore();
  };
  /* a highlighter swipe behind text: left to right as k goes 0 → 1 */
  K.marker = function (g, x, y, w, h, k, col) {
    if (k <= 0) return; var ww = w * eo(k);
    g.save(); g.fillStyle = col || C.YEL; g.beginPath(); g.moveTo(x, y - h * .42); g.lineTo(x + ww, y - h * .5); g.lineTo(x + ww - 8, y + h * .5); g.lineTo(x + 6, y + h * .44); g.closePath(); g.fill(); g.restore();
  };
  K.flash = function (g, W, H, u, a) { if (u < 0 || u > .2) return; g.save(); g.globalAlpha = (a || .85) * (1 - u / .2); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.restore(); };
  /* freeze frame: draw the frozen frame first, then this desaturates it, tints it and pops a flash */
  K.freezeFX = function (g, W, H, u) {
    if (u < 0) return;
    g.save(); g.globalCompositeOperation = 'saturation'; g.globalAlpha = clamp(u / .06, 0, 1) * .9; g.fillStyle = 'hsl(0,0%,50%)'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = clamp(u / .06, 0, 1) * .35; g.fillStyle = '#e8c58a'; g.fillRect(0, 0, W, H); g.restore();
    K.flash(g, W, H, u, .7);
  };

  /* ---------- camera ---------- */
  /* decaying, seeded shake: {x, y, r}; amp in px */
  K.shake = function (t, t0, amp, dur) {
    var u = t - t0; if (u < 0 || u > dur) return { x: 0, y: 0, r: 0 };
    var e = Math.pow(1 - u / dur, 2) * amp;
    return { x: e * (Math.sin(t * 71) + Math.sin(t * 113 + 1)) * .5, y: e * (Math.sin(t * 89 + 2) + Math.sin(t * 131)) * .5, r: e * .0012 * Math.sin(t * 97) };
  };
  /* zoom punch: 1 → 1 + amt in 50 ms, then eases back */
  K.punch = function (t, t0, amt) { var u = t - t0; if (u < 0) return 1; return 1 + amt * (u < .05 ? u / .05 : Math.exp(-(u - .05) * 5)); };
  /* snap zoom that holds: from → to in about 0.18 s */
  K.snap = function (t, t0, from, to) { return lerp(from, to, eo(seg(t, t0, t0 + .2))); };
  /* cam {z, x, y, r, cx, cy}: zoom z around (cx, cy), then offset x, y */
  K.applyCam = function (g, W, H, c) {
    var cx = c.cx == null ? W / 2 : c.cx, cy = c.cy == null ? H / 2 : c.cy;
    g.translate(cx + (c.x || 0), cy + (c.y || 0)); g.rotate(c.r || 0); g.scale(c.z || 1, c.z || 1); g.translate(-cx, -cy);
  };

  /* ---------- transitions: k 0 → 1 across the cut; prev(g) and next(g) each draw a full frame ---------- */
  function shapePath(g, type, cx, cy, r) {
    if (type === 'star') { star(g, cx, cy, r, 5, .5, true); return; }
    if (type === 'heart') { heartPath(g, cx, cy + r * .1, r * .9, true); return; }
    g.moveTo(cx + r, cy); g.arc(cx, cy, Math.max(0, r), 0, TAU);
  }
  function blob(g, cx, cy, r, seed) {
    var n = 22, pts = [];
    for (var i = 0; i < n; i++) { var a = i / n * TAU, rr2 = r * (.78 + hash(i * 1.7 + seed) * .42); pts.push([cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2]); }
    g.beginPath(); var m0 = [(pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2]; g.moveTo(m0[0], m0[1]);
    for (i = 0; i < n; i++) { var p = pts[i], q = pts[(i + 1) % n]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    g.closePath();
  }
  K.tr = function (g, type, k, W, H, prev, next, o) {
    o = o || {}; k = clamp(k, 0, 1);
    var cx = o.x == null ? W / 2 : o.x, cy = o.y == null ? H / 2 : o.y, R = Math.hypot(W, H), col = o.col || INK;
    if (type === 'iris') {
      /* close on prev, hold black for a beat, open on next */
      var closing = k < .45, r = closing ? R * (1 - eio(k / .45)) : k < .55 ? 0 : R * eio((k - .55) / .45);
      (closing ? prev : next)(g);
      g.save(); g.beginPath(); g.rect(0, 0, W, H); shapePath(g, o.shape, closing ? cx : (o.x2 == null ? cx : o.x2), closing ? cy : (o.y2 == null ? cy : o.y2), r); g.fillStyle = col; g.fill('evenodd'); g.restore();
    } else if (type === 'whip') {
      var dir = o.dir || 1, e = eio(k), off = e * W * dir;
      g.save(); g.translate(-off, 0); prev(g); g.restore();
      g.save(); g.translate(W * dir - off, 0); next(g); g.restore();
      var a = Math.sin(PI * k);
      g.save(); g.globalAlpha = a * .55; g.fillStyle = C.CREAM; for (var i = 0; i < 26; i++) { var yy = hash(i * 3.1) * H, hh = 2 + hash(i * 7.3) * 10; g.fillRect(0, yy, W, hh); } g.restore();
    } else if (type === 'bars') {
      var u = k * 2, n = o.n || 5, cols = o.cols || [C.YEL, C.RED, C.BLUE, C.MINT, C.PINK], ang = o.angle == null ? -.35 : o.angle, D = R * .6;
      (u < 1 ? prev : next)(g);
      g.save(); g.translate(W / 2, H / 2); g.rotate(ang);
      var bh = (R * 1.1) / n;
      for (i = 0; i < n; i++) {
        var ga = eio(clamp((u - i * .06) / .66, 0, 1)), gb = eio(clamp((u - 1.1 - i * .06) / .66, 0, 1));
        var x0 = -D + 2 * D * gb, x1 = -D + 2 * D * ga; if (x1 <= x0) continue;
        g.fillStyle = cols[i % cols.length]; g.fillRect(x0 - 2, -R * .55 + i * bh - 1, x1 - x0 + 4, bh + 2);
      }
      g.restore();
    } else if (type === 'splat') {
      if (k < .5) { prev(g); var r1 = R * 1.05 * Math.pow(eo(k * 2), 1.2); if (r1 > 1) { blob(g, cx, cy, r1, 3); g.fillStyle = o.col || C.PINK; g.fill(); } }
      else { g.fillStyle = o.col || C.PINK; g.fillRect(0, 0, W, H); var r2 = R * 1.1 * eio((k - .5) * 2); if (r2 > 1) { g.save(); blob(g, o.x2 == null ? cx : o.x2, o.y2 == null ? cy : o.y2, r2, 8); g.clip(); next(g); g.restore(); } }
    } else if (type === 'zoom') {
      if (k < .5) { var z = 1 + 5 * Math.pow(k * 2, 3); g.save(); g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy); prev(g); g.restore(); g.save(); g.globalAlpha = Math.pow(k * 2, 3); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.restore(); }
      else { var z2 = 1 + .6 * (1 - eo((k - .5) * 2)); g.save(); g.translate(W / 2, H / 2); g.scale(z2, z2); g.translate(-W / 2, -H / 2); next(g); g.restore(); g.save(); g.globalAlpha = Math.pow(1 - (k - .5) * 2, 3); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.restore(); }
    } else if (type === 'slam') {
      prev(g); var y = -H * (1 - bounce(k));
      g.save(); g.translate(0, y); next(g); g.fillStyle = INK; g.fillRect(0, H - 4, W, 14); g.restore();
    } else if (type === 'spin') {
      g.fillStyle = col; g.fillRect(0, 0, W, H);
      var first = k < .5, e2 = first ? eio(k * 2) : eio((k - .5) * 2), s2 = first ? 1 - e2 : e2, rot = first ? e2 * PI : -(1 - e2) * PI;
      if (s2 > .001) { g.save(); g.translate(W / 2, H / 2); g.rotate(rot); g.scale(s2, s2); g.translate(-W / 2, -H / 2); (first ? prev : next)(g); g.restore(); }
    } else { (k < .5 ? prev : next)(g); }
  };
  K.TRANSITIONS = ['iris', 'whip', 'bars', 'splat', 'zoom', 'slam', 'spin', 'cut'];
  /* when the cut lands inside a transition (k where next first fills the frame), for timing sound and shakes */
  K.trHit = { iris: .55, whip: .5, bars: .5, splat: .5, zoom: .5, slam: .36, spin: .5, cut: .5 };

  /* ---------- text ---------- */
  /* sticker type: a thick ink outline and a drop shadow, so it reads on any background */
  K.sticker = function (g, s, x, y, px, o) {
    o = o || {}; font(g, px, o.wt || 900, o.fam, o.wide !== false); ls(g, o.ls || 0);
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.miterLimit = 2;
    var lw = o.lw == null ? Math.max(4, px * .15) : o.lw, ink = o.ink || INK;
    if (o.rot) { g.save(); g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
    if (o.shadow !== false) { g.lineWidth = lw; g.strokeStyle = ink; g.fillStyle = ink; g.strokeText(s, x + px * .05, y + px * .08); g.fillText(s, x + px * .05, y + px * .08); }
    if (lw) { g.lineWidth = lw; g.strokeStyle = ink; g.strokeText(s, x, y); }
    g.fillStyle = o.col || C.CREAM; g.fillText(s, x, y);
    var w = g.measureText(s).width; ls(g, 0); if (o.rot) g.restore(); return w;
  };
  function measure(g, s, px, o) { o = o || {}; font(g, px, o.wt || 900, o.fam, o.wide !== false); ls(g, o.ls || 0); var w = g.measureText(s).width; ls(g, 0); return w; }
  K.measure = measure;
  function outK(u, o) { return o && o.out != null ? 1 - eio(seg(u, o.out, o.out + .18)) : 1; }
  /* SLAM: lands from 2.6× in 0.14 s with a recoil; u = seconds since it started */
  K.slam = function (g, s, x, y, px, u, o) {
    if (u < 0) return; o = o || {}; var k = eo(clamp(u / .14, 0, 1)), sc = lerp(o.from || 2.6, 1, k) - .12 * knock(u, .12, 30, 8), ok = outK(u, o);
    if (ok <= 0) return;
    g.save(); g.globalAlpha *= clamp(u / .05, 0, 1); g.translate(x, y); g.rotate((o.rot == null ? -.04 : o.rot) * (1 + (1 - k) * 3)); g.scale(sc * ok, sc * ok);
    K.sticker(g, s, 0, 0, px, o); g.restore();
  };
  /* words spring in one by one; '*word' is a stressed word (accent colour, bigger, it keeps wiggling) */
  K.popWords = function (g, words, x, y, px, u, o) {
    o = o || {}; var gap = o.gap || .12, lh = px * 1.12, maxW = o.maxW || 900, ok = outK(u, o); if (ok <= 0) return;
    var items = words.map(function (w, i) { var hot = w[0] === '*'; w = hot ? w.slice(1) : w; return { w: w, hot: hot, at: o.times ? o.times[i] : i * gap, wd: measure(g, w, px, o) * (hot ? 1.14 : 1), i: i }; });
    var spc = px * .3, lines = [[]], lw = [0];
    items.forEach(function (it) { var L = lines.length - 1, add = (lines[L].length ? spc : 0) + it.wd; if (lw[L] + add > maxW && lines[L].length) { lines.push([it]); lw.push(it.wd); } else { lines[L].push(it); lw[L] += add; } });
    var y0 = y - (lines.length - 1) * lh / 2;
    lines.forEach(function (L, li) {
      var cx = x - lw[li] / 2;
      L.forEach(function (it) {
        var uu = u - it.at, k = pop(uu, 0, 3.2, .5);
        if (k > 0) {
          g.save(); g.translate(cx + it.wd / 2, y0 + li * lh + (1 - Math.min(1, k)) * px * .5); g.rotate(it.hot ? Math.sin(u * 7 + it.i) * .06 : 0);
          var sc = k * ok * (it.hot ? 1.14 : 1); g.scale(sc, sc);
          K.sticker(g, it.w, 0, 0, px, Object.assign({}, o, { col: it.hot ? (o.hot || C.YEL) : (o.col || C.CREAM) }));
          g.restore();
        }
        cx += it.wd + spc;
      });
    });
  };
  /* typewriter with a caret; o.cps characters a second; align 'left' draws from x */
  K.typeOn = function (g, s, x, y, px, u, o) {
    if (u < 0) return; o = o || {}; var n = Math.min(s.length, Math.floor(u * (o.cps || 18))), full = measure(g, s, px, Object.assign({ wt: 700 }, o));
    var x0 = o.align === 'left' ? x : x - full / 2, sub = s.slice(0, n);
    var w = sub ? K.sticker(g, sub, x0, y, px, Object.assign({ wt: 700, align: 'left', shadow: false, lw: 0 }, o)) : 0;
    var done = n >= s.length, on = !done || Math.floor(u * 2.6) % 2 === 0;
    if (on) { g.fillStyle = o.caret || C.YEL; g.fillRect(x0 + w + px * .08, y - px * .52, px * .1, px * 1.04); }
  };
  /* letters ride a wave */
  K.wobble = function (g, s, x, y, px, t, u, o) {
    if (u < 0) return; o = o || {}; var full = measure(g, s, px, o), cx = x - full / 2, k = pop(u, 0, 3, .55);
    for (var i = 0; i < s.length; i++) {
      var ch = s[i], w = measure(g, ch, px, o);
      if (ch !== ' ') { g.save(); g.translate(cx + w / 2, y + Math.sin(t * 7 + i * .7) * px * .1); g.rotate(Math.sin(t * 6 + i) * .09); g.scale(k, k); K.sticker(g, ch, 0, 0, px, o); g.restore(); }
      cx += w;
    }
  };
  /* jelly: shoots up tall, then wobbles flat-tall-flat */
  K.stretch = function (g, s, x, y, px, u, o) {
    if (u < 0) return; o = o || {}; var sx, sy;
    if (u < .1) { sy = 1.5 * u / .1; sx = .6; } else { var j = knock(u, .1, 18, 4.5); sx = 1 + .35 * j; sy = 1 - .35 * j; }
    g.save(); g.translate(x, y + px * .5); g.scale(sx, sy); K.sticker(g, s, 0, -px * .5, px, o); g.restore();
  };
  /* an odometer: from → to over dur seconds; each digit rolls into the next */
  K.counter = function (g, from, to, x, y, px, u, dur, o) {
    if (u < 0) return; o = o || {};
    var k = (o.ease || function (q) { return 1 - Math.pow(1 - q, 3); })(clamp(u / dur, 0, 1)), v = lerp(from, to, k), fin = Math.round(to);
    var digits = String(Math.abs(fin)).length, dw = measure(g, '0', px, o) * 1.02, cw = measure(g, ',', px, o), lh = px * 1.1;
    var groups = o.commas === false ? 0 : Math.floor((digits - 1) / 3), pre = o.pre || '', suf = o.suf || '';
    var pw = pre ? measure(g, pre, px, o) : 0, sw = suf ? measure(g, suf, px, o) : 0, tw = pw + digits * dw + groups * cw + sw;
    var land = u > dur ? 1 - .1 * knock(u, dur, 26, 7) : 1, x0 = -tw / 2;
    g.save(); g.translate(x, y); g.scale(land, land);
    if (pre) K.sticker(g, pre, x0 + pw / 2, 0, px, o);
    var cx = x0 + pw;
    for (var d = digits - 1; d >= 0; d--) {
      var p10 = Math.pow(10, d), r = v / p10, dig = Math.floor(r) % 10, low = v - Math.floor(r) * p10, f = d === 0 ? r - Math.floor(r) : clamp(low - (p10 - 1), 0, 1);
      if (u >= dur) f = 0;
      var lead = Math.floor(v / p10) === 0 && d > 0 && f === 0;
      g.save(); g.beginPath(); g.rect(cx - 4, -lh * .62, dw + 8, lh * 1.24); g.clip();
      if (!lead) K.sticker(g, String(dig), cx + dw / 2, -f * lh, px, o);
      if (f > 0) K.sticker(g, String((dig + 1) % 10), cx + dw / 2, (1 - f) * lh, px, o);
      g.restore(); cx += dw;
      if (d > 0 && d % 3 === 0 && o.commas !== false) { if (Math.floor(v / p10) > 0) K.sticker(g, ',', cx + cw / 2, 0, px, o); cx += cw; }
    }
    if (suf) K.sticker(g, suf, cx + sw / 2, 0, px, o);
    g.restore();
  };
  /* karaoke caption: words [{w, t0, t1, hot}] already chunked by the film; the spoken word pops, hot words go yellow */
  K.caption = function (g, words, x, y, px, t, o) {
    o = o || {}; var shown = words.filter(function (w) { return t >= w.t0 - .02; }); if (!shown.length) return;
    var spc = px * .28, ws = words.map(function (w) { return measure(g, w.w, px, o); }), tw = ws.reduce(function (a, b) { return a + b; }, 0) + spc * (words.length - 1), cx = x - tw / 2;
    words.forEach(function (w, i) {
      var k = pop(t, w.t0 - .02, 4, .55), on = t >= w.t0 && t < (w.t1 || w.t0 + .3) + .05;
      if (k > 0) { g.save(); g.translate(cx + ws[i] / 2, y); var sc = k * (on ? 1.1 : 1); g.scale(sc, sc); K.sticker(g, w.w, 0, 0, px, Object.assign({}, o, { col: w.hot ? C.YEL : (o.col || C.CREAM), lw: px * .17 })); g.restore(); }
      cx += ws[i] + spc;
    });
  };
  /* a small mono tag chip */
  K.chip = function (g, s, x, y, px, o) {
    o = o || {}; font(g, px, 600, MONO); ls(g, px * .12); var w = g.measureText(s).width + px * 1.4, h = px * 2.1;
    var x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    rr(g, x0, y - h / 2, w, h, h / 2); fillStroke(g, o.bg || C.CREAM, 0);
    g.fillStyle = o.col || INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(s, x0 + px * .7, y + 1); ls(g, 0); return w;
  };

  /* ---------- sound: SFX by name, synthesised offline (no samples, no music) ----------
     EV: [{t, type, g?, t1?}]; types: whoosh swish pop boing thud slam ding scratch tick key squeak sparkle splat zip
     ratchet (t → t1) rise (t → t1) shutter cheer */
  K.SFX = ['whoosh', 'swish', 'pop', 'boing', 'thud', 'slam', 'ding', 'scratch', 'tick', 'key', 'squeak', 'sparkle', 'splat', 'zip', 'ratchet', 'rise', 'shutter', 'cheer'];
  K.score = function (ac, EV, DUR) {
    var sr = ac.sampleRate, rnd = mulberry(7), i;
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.1), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .16; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(gn, send, pan) { var o = ac.createGain(); o.gain.value = gn; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function band(t0, t1, f0, f1, g0, g1, q, pan, send) { var o = bus(1, send == null ? .1 : send, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .22], [t + .025, 0]]); }
    function thud(t, g) { var o = osc('sine', 150, t, t + .2, [[t, 0], [t + .004, g || .45], [t + .16, 0]], .03); o.frequency.exponentialRampToValueAtTime(52, t + .14); }
    function lowNoise(t, dur, g, f) { var n = noise(t, dur), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = f || 1500; var o = bus(1, .2); n.connect(lp); lp.connect(o); env(o.gain, [[t, 0], [t + .004, g], [t + dur, 0]]); }
    var S = {
      whoosh: function (e) { var d = e.d || .34; band(e.t, e.t + d, 300, 2600, .16 * (e.g || 1), .03, 1.1, 0, .15); },
      swish: function (e) { band(e.t, e.t + .24, 900, 5200, .12 * (e.g || 1), .02, 1.6); },
      pop: function (e) { var o = osc('sine', 300, e.t, e.t + .12, [[e.t, 0], [e.t + .004, .16 * (e.g || 1)], [e.t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, e.t + .08); },
      boing: function (e) { var t = e.t, o = osc('triangle', 180, t, t + .5, [[t, 0], [t + .01, .14 * (e.g || 1)], [t + .45, 0]], .1); o.frequency.exponentialRampToValueAtTime(420, t + .32); var l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 22; lg.gain.value = 40; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + .5); },
      thud: function (e) { thud(e.t, .5 * (e.g || 1)); },
      slam: function (e) { var g = e.g || 1; thud(e.t, .62 * g); lowNoise(e.t, .16, .4 * g); tick(e.t + .004, .2 * g); },
      ding: function (e) { [1568, 2349, 3136].forEach(function (f, i) { osc('sine', f, e.t, e.t + 1.2, [[e.t, 0], [e.t + .004, [.09, .05, .025][i] * (e.g || 1)], [e.t + 1.1, 0]], .3); }); },
      scratch: function (e) { var t = e.t; band(t, t + .1, 1200, 3800, .2, .1, 4); band(t + .1, t + .24, 3800, 700, .2, .05, 4); var o = osc('sawtooth', 260, t, t + .26, [[t, 0], [t + .01, .05], [t + .24, 0]]); o.frequency.linearRampToValueAtTime(820, t + .1); o.frequency.linearRampToValueAtTime(180, t + .24); },
      tick: function (e) { tick(e.t, e.g); },
      key: function (e) { tick(e.t, .2 * (e.g || 1)); osc('sine', 1900 + rnd() * 400, e.t, e.t + .03, [[e.t, 0], [e.t + .002, .025], [e.t + .025, 0]]); },
      squeak: function (e) { var o = osc('sine', 900, e.t, e.t + .18, [[e.t, 0], [e.t + .01, .08 * (e.g || 1)], [e.t + .16, 0]], .1); o.frequency.linearRampToValueAtTime(1800, e.t + .07); o.frequency.linearRampToValueAtTime(1100, e.t + .16); },
      sparkle: function (e) { for (var k = 0; k < 6; k++) { var tt = e.t + k * .045, f = 2200 + rnd() * 2600; osc('sine', f, tt, tt + .35, [[tt, 0], [tt + .003, .035 * (e.g || 1)], [tt + .3, 0]], .4, (rnd() - .5) * .8); } },
      splat: function (e) { var t = e.t, n = noise(t, .3), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; env(lp.frequency, [[t, 2400], [t + .25, 200]]); var o = bus(1, .2); n.connect(lp); lp.connect(o); env(o.gain, [[t, 0], [t + .005, .45 * (e.g || 1)], [t + .26, 0]]); thud(t, .35); },
      zip: function (e) { var o = osc('sine', 380, e.t, e.t + .14, [[e.t, 0], [e.t + .005, .07 * (e.g || 1)], [e.t + .13, 0]], .05); o.frequency.exponentialRampToValueAtTime(2600, e.t + .12); },
      ratchet: function (e) { for (var tt = e.t, k = 0; tt < e.t1; tt += lerp(.03, .09, seg(tt, e.t, e.t1)), k++) { tick(tt, .14 * (e.g || 1)); } },
      rise: function (e) { band(e.t, e.t1, 400, 2400, .04, .08, 3); },
      shutter: function (e) { tick(e.t, .35); thud(e.t, .2); tick(e.t + .05, .2); },
      cheer: function (e) { band(e.t, e.t + 1.2, 900, 1400, .06 * (e.g || 1), .02, .6, -.3, .3); band(e.t + .05, e.t + 1.1, 1300, 1700, .05 * (e.g || 1), .02, .6, .3, .3); }
    };
    EV.forEach(function (e) { if (S[e.type]) S[e.type](e); });
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −50 dB, so silence is never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5; var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .021; })();
  };

  /* ---------- a film skeleton: scenes on a timeline, joined by transitions, with motion blur ----------
     film = K.film({ W, H, scenes: [{ id, name, dur, draw(g, t, u), tr: 'whip', trDur: .5, trOpt: {} }] })
     film.frame(g, t) draws one frame; film.render(ctx, t, samples, shutter, fps) blends subframes for motion blur. */
  K.film = function (spec) {
    var W = spec.W, H = spec.H, SC = spec.scenes, t0 = 0;
    SC.forEach(function (s) { s.t0 = t0; t0 += s.dur; s.t1 = t0; });
    var DUR = t0, tmp, tctx, acc, actx;
    function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
    function drawScene(g, i, t) { var s = SC[i]; g.save(); s.draw(g, t, t - s.t0); g.restore(); }
    function frame(g, t) {
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      var i = sceneAt(t), s = SC[i], nx = SC[i + 1];
      /* inside a transition: centred on the cut between this scene and the next (or the previous) */
      var hit = null;
      if (nx && nx.tr && t > nx.t0 - (nx.trDur || .5) * (K.trHit[nx.tr] || .5)) hit = [i, i + 1];
      else if (s.tr && i > 0 && t < s.t0 + (s.trDur || .5) * (1 - (K.trHit[s.tr] || .5))) hit = [i - 1, i];
      if (hit) {
        var b = SC[hit[1]], d = b.trDur || .5, h = K.trHit[b.tr] || .5, k = (t - (b.t0 - d * h)) / d;
        K.tr(g, b.tr, k, W, H, function (gg) { drawScene(gg, hit[0], t); }, function (gg) { drawScene(gg, hit[1], t); }, b.trOpt || {});
      } else drawScene(g, i, t);
    }
    function render(ctx, t, samples, shutter, fps) {
      t = clamp(t, 0, DUR); samples = samples || 1;
      if (samples === 1) { frame(ctx, t); return; }
      if (!tmp) { tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; tctx = tmp.getContext('2d'); acc = document.createElement('canvas'); acc.width = W; acc.height = H; actx = acc.getContext('2d'); }
      var span = (shutter || .5) / (fps || 30);
      for (var k = 0; k < samples; k++) { frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR)); actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0); }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
    }
    return { W: W, H: H, DUR: DUR, scenes: SC, frame: frame, render: render, sceneAt: sceneAt };
  };

  window.KIT = K;
})();
