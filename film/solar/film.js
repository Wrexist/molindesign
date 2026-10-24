/* "Sneeze": what if the biggest solar storm in history hit Earth tomorrow? Long-form episode 2 of Tech, explained.
   A stickman explainer written in code and cut to the voice: every beat keys to a word time from vo/vo.js
   (window.VO, written by tools/voiceover.py) through at(id, word). Every frame is a pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   New since episode 1:
   - six "parts", each one question with a payoff, under a slam-shut chapter card
   - a Sun with a face
   - lit characters (rim light and contact shadows)
   - an orthographic globe
   - auroras
   - depth-of-field foregrounds
   - one quotable line per part, built from paper words
   Every number is sourced in BRIEF.md. */
(function () {
  'use strict';
  var W = 1920, H = 1080, VO = window.VO, DUR = VO.dur;
  var INK = '#1c1830', NIGHT = '#221d3a', DUSK = '#352b55', PLUM = '#56406f', MAUVE = '#7a5584';
  var HEAD = '#fbf7ef', HEADS = '#e2dbcc', HOOD = '#ff5b3d', HOODS = '#d6412a';
  var CREAM = '#f4ede0', PAPER = '#f1e9d8', PAPERS = '#e2d6bf', YEL = '#ffc83d', MINT = '#3fd6a2', LIGHT = '#8fe9ff', RED = '#ff4a3d', BLUE = '#3d7bff', GREEN = '#5fb86b', TEAL = '#2a9d8f';
  var SUN = '#ffb52e', SUN2 = '#ff7a1f', SUNHI = '#fff1a8', PLASMA = '#ff8a3d', AUR1 = '#5dffb0', AUR2 = '#b06bff';
  var DISP = 'Archivo', MONO = '"Geist Mono"', SERIF = '"Instrument Serif"';

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
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .85); }
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .7), 0, 1.08); }
  function win(t, a, b, o) { return t < a || t > b + (o || .3) ? 0 : clamp(sp(t, a, 3, .8), 0, 1.06) * (1 - eio(seg(t, b, b + (o || .3)))); }
  function knock(t, a, f, d) { if (t < a) return 0; var u = t - a; return Math.exp(-u * (d || 7)) * Math.sin(u * (f || 22)); }
  /* smooth value noise for handheld drift, never a jitter */
  function vnoise(x, s) { var i = Math.floor(x), f = x - i, a = hash(i + s * 91.7), b = hash(i + 1 + s * 91.7); return lerp(a, b, ss(f)) * 2 - 1; }
  function mix(a, b, k) {
    if (typeof a === 'number') return lerp(a, b, k);
    if (Array.isArray(a)) return a.map(function (v, i) { return mix(v, b[i], k); });
    return k < .4 ? a : b;
  }
  function kf(t, keys, ez) {
    ez = ez || eio;
    if (t <= keys[0][0]) return keys[0][1];
    for (var i = 1; i < keys.length; i++) if (t < keys[i][0]) return mix(keys[i - 1][1], keys[i][1], ez(seg(t, keys[i - 1][0], keys[i][0])));
    return keys[keys.length - 1][1];
  }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%.]/g, '').replace(/\.$/, ''); }
  function at(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (!l) throw new Error('no line ' + id);
    if (typeof word === 'number') return l.words[Math.min(word, l.words.length - 1)].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function wend(id, word, nth) {
    var l = LINE[id], n = nth || 0;
    if (typeof word === 'number') return l.words[Math.min(word, l.words.length - 1)].t1;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t1;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, NOISE, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam, wide) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); try { g.fontStretch = wide ? 'expanded' : 'normal'; } catch (e) {} }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, 6.2832); }
  function fillStroke(g, fill, lw, stroke) { if (fill) { g.fillStyle = fill; g.fill(); } if (lw) { g.lineWidth = lw; g.strokeStyle = stroke || INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
  function txt(g, s, x, y, px, col, o) {
    o = o || {}; font(g, px, o.wt || 800, o.fam, o.wide); ls(g, o.ls || 0);
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
    if (o.outline) { g.lineWidth = o.outline; g.strokeStyle = o.ocol || INK; g.lineJoin = 'round'; g.strokeText(s, x, y); }
    g.fillStyle = col || CREAM; g.fillText(s, x, y); var w = g.measureText(s).width; ls(g, 0); return w;
  }
  function chip(g, s, x, y, o) {
    o = o || {}; var px = o.px || 44, a = o.a == null ? 1 : o.a, sc = o.s == null ? 1 : o.s;
    if (a <= 0 || sc <= 0) return;
    font(g, px, o.wt || 800, o.fam, o.wide); ls(g, o.ls || 0);
    var tw = g.measureText(s).width, pad = o.pad == null ? px * .42 : o.pad, w = o.w || tw + pad * 2, h = o.h || px * 1.45;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(o.rot || 0); g.scale(sc, sc);
    if (!o.flat) { rr(g, -w / 2 + 7, -h / 2 + 9, w, h, o.r == null ? h * .3 : o.r); g.fillStyle = 'rgba(10,8,20,.45)'; g.fill(); }
    rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .3 : o.r); fillStroke(g, o.bg || CREAM, o.lw == null ? 5 : o.lw, o.line || INK);
    g.fillStyle = o.fg || INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, px * .05);
    ls(g, 0); g.restore(); return w;
  }
  function arrow(g, x0, y0, x1, y1, k, col, lw, head) {
    if (k <= 0) return;
    var x = lerp(x0, x1, k), y = lerp(y0, y1, k), a = Math.atan2(y1 - y0, x1 - x0), hd = head || 30;
    g.save(); g.lineCap = 'round';
    g.strokeStyle = INK; g.lineWidth = (lw || 7) + 8; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x - Math.cos(a) * hd * .5, y - Math.sin(a) * hd * .5); g.stroke();
    g.strokeStyle = g.fillStyle = col || CREAM; g.lineWidth = lw || 7; g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a - .45) * hd, y - Math.sin(a - .45) * hd); g.lineTo(x - Math.cos(a + .45) * hd, y - Math.sin(a + .45) * hd); g.closePath(); fillStroke(g, col || CREAM, 5);
    g.restore();
  }
  function cross(g, x, y, s, a, col) {
    if (a <= 0 || s <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.lineCap = 'round';
    g.strokeStyle = INK; g.lineWidth = 22; g.beginPath(); g.moveTo(-26, -26); g.lineTo(26, 26); g.moveTo(26, -26); g.lineTo(-26, 26); g.stroke();
    g.strokeStyle = col || RED; g.lineWidth = 12; g.stroke(); g.restore();
  }
  function tick(g, x, y, s, a, col) {
    if (a <= 0 || s <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.lineCap = g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-24, 0); g.lineTo(-7, 18); g.lineTo(26, -20);
    g.strokeStyle = INK; g.lineWidth = 22; g.stroke(); g.strokeStyle = col || MINT; g.lineWidth = 12; g.stroke(); g.restore();
  }
  function spark(g, x, y, t, t0, s, col) {
    if (t < t0 || t > t0 + .7) return;
    var k = seg(t, t0, t0 + .7), r = 20 + eo(k) * 90 * (s || 1), a = 1 - k;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.lineCap = 'round';
    for (var i = 0; i < 9; i++) {
      var an = i / 9 * 6.283 + hash(t0 * 10 + i) * .5, r0 = r * .35, r1 = r * (.8 + hash(i + t0) * .4);
      g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.moveTo(Math.cos(an) * r0, Math.sin(an) * r0); g.lineTo(Math.cos(an) * r1, Math.sin(an) * r1); g.stroke();
      g.strokeStyle = i % 2 ? YEL : (col || CREAM); g.lineWidth = 6; g.stroke();
    }
    circ(g, 0, 0, 26 * (1 - k)); g.fillStyle = '#fff6d8'; g.fill(); g.restore();
  }
  /* a jagged electric arc from a to b, re-drawn 12 times a second */
  function bolt(g, x0, y0, x1, y1, t, a, col, seed) {
    if (a <= 0) return;
    var n = 9, f = Math.floor(t * 12) + (seed || 0) * 31, pts = [[x0, y0]], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    for (var i = 1; i < n; i++) { var u = i / n, off = (hash(f * 7.3 + i * 1.9) - .5) * L * .22; pts.push([x0 + dx * u + nx * off, y0 + dy * u + ny * off]); }
    pts.push([x1, y1]);
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.lineJoin = g.lineCap = 'round';
    function path() { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); }
    path(); g.strokeStyle = INK; g.lineWidth = 13; g.stroke();
    path(); g.strokeStyle = col || YEL; g.lineWidth = 6; g.shadowColor = col || YEL; g.shadowBlur = 18; g.stroke();
    path(); g.strokeStyle = '#fffbe8'; g.lineWidth = 2; g.shadowBlur = 0; g.stroke();
    g.restore();
  }
  function spinner(g, x, y, r, t, col, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(t * 6); g.lineCap = 'round';
    for (var i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.globalAlpha = a * (.2 + .8 * i / 7); g.strokeStyle = col || INK; g.lineWidth = r * .22; g.beginPath(); g.moveTo(r * .5, 0); g.lineTo(r, 0); g.stroke(); }
    g.restore();
  }
  function vignette(g, a) {
    var r = g.createRadialGradient(W / 2, H * .45, H * .35, W / 2, H * .5, H * 1.05);
    r.addColorStop(0, 'rgba(10,6,24,0)'); r.addColorStop(1, 'rgba(10,6,24,' + (a == null ? .5 : a) + ')');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
  }
  /* a soft additive glow */
  function glow(g, x, y, r, col, a) {
    if (a <= 0) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha *= clamp(a, 0, 1);
    var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
  }
  /* a directional key light over the whole frame: warm or cool from one side, so flat art reads as lit */
  function keyLight(g, x, y, col, a) {
    g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = a == null ? .5 : a;
    var gr = g.createRadialGradient(x, y, 0, x, y, 1700); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  }
  /* depth of field: draw fn blurred (foreground objects, out of focus) */
  function soft(g, px, fn) { g.save(); try { g.filter = 'blur(' + px + 'px)'; } catch (e) {} fn(g); g.restore(); }
  /* the camera: a slow push plus a gentle handheld drift, on every scene */
  function cam(g, t, s, z, cx, cy, drift) {
    var u = seg(t, s.t0, s.t1), zz = 1 + (z == null ? .05 : z) * ss(u), d = drift == null ? 1 : drift;
    var dx = vnoise(t * .35, s.t0) * 9 * d, dy = vnoise(t * .3, s.t0 + 7) * 6 * d, r = vnoise(t * .25, s.t0 + 3) * .004 * d;
    cx = cx == null ? W / 2 : cx; cy = cy == null ? H / 2 : cy;
    g.translate(cx + dx, cy + dy); g.rotate(r); g.scale(zz, zz); g.translate(-cx, -cy);
  }

  /* ---------- the rig: one character, many costumes; lit from one side, standing on a contact shadow ---------- */
  var BASE = { lh: [-60, -150], rh: [60, -150], lf: [-26, 0], rf: [26, 0], hip: 0, lean: 0, tilt: 0, look: [0, 0], eyes: 'dot', brow: 0, mouth: 'smile', jump: 0, front: 0 };
  function poseAt(t, keys) {
    var cur = Object.assign({}, BASE), tgt = cur;
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i]; if (t < k[0]) break;
      var nt = Object.assign({}, tgt, k[1]), e = eio(seg(t, k[0], k[0] + (k[2] || .32)));
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
  function limb(g, pts, w, col, hi) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.lineCap = g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = w + 9; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke();
    if (hi) { g.save(); g.translate(-w * .18, -w * .12); g.strokeStyle = hi; g.lineWidth = w * .28; g.stroke(); g.restore(); }
  }
  function lighten(hex, k) { var n = parseInt(hex.slice(1), 16), r = n >> 16, gg = n >> 8 & 255, b = n & 255; r = Math.round(r + (255 - r) * k); gg = Math.round(gg + (255 - gg) * k); b = Math.round(b + (255 - b) * k); return 'rgb(' + r + ',' + gg + ',' + b + ')'; }
  function guy(g, x, y, s, P, o, t) {
    o = o || {}; var col = o.col || HOOD, sh = o.shade || HOODS, seed = o.seed || 1, bt = Math.floor(t * 8), hi = o.rim === false ? null : lighten(col, .38);
    function j(i) { return (hash(bt * 13.1 + i * 3.7 + seed * 17.3) - .5) * 2.4; }
    var br = Math.sin(t * 2.2 + seed) * 2.2, sway = Math.sin(t * 1.3 + seed * 2) * 3;
    /* contact shadow, squashes as he jumps */
    if (!o.noShadow) { var jh = clamp((P.jump || 0) / 200, 0, 1); g.save(); g.translate(x, y + 8); g.scale(s, s); g.beginPath(); g.ellipse(0, 0, 92 * (1 - jh * .4), 16 * (1 - jh * .4), 0, 0, 6.283); g.fillStyle = 'rgba(8,6,20,' + (.32 * (1 - jh * .5)) + ')'; g.fill(); g.restore(); }
    g.save(); g.translate(x, y - (P.jump || 0)); g.scale(s * (o.flip ? -1 : 1), s);
    var hip = [0, -150 + (P.hip || 0)], lean = P.lean || 0;
    function R(px, py) { return [hip[0] + px * Math.cos(lean) - py * Math.sin(lean), hip[1] + px * Math.sin(lean) + py * Math.cos(lean)]; }
    var shL = R(-40, -106 - br * .3), shR = R(40, -106 - br * .3), neck = R(0, -122 - br * .5);
    var legC = o.legs || HEAD;
    [[-1, P.lf], [1, P.rf]].forEach(function (L, i) {
      var root = [hip[0] + L[0] * 20, hip[1]], tg = [L[1][0] + j(i), L[1][1]], r = ik(root, tg, 80, 78, L[0], false);
      limb(g, [root, [r[0][0] + j(i + 4), r[0][1] + j(i + 6)], r[1]], 13, legC);
      g.save(); g.translate(r[1][0] + L[0] * 7, r[1][1] + 2); g.beginPath(); g.ellipse(0, 0, 19, 10, 0, 0, 6.283); fillStroke(g, o.shoe || INK, 0); g.restore();
    });
    /* torso */
    g.save(); g.translate(hip[0], hip[1]); g.rotate(lean);
    g.beginPath(); g.moveTo(-47 + j(1) * .5, 6); g.quadraticCurveTo(-55, -58, -43 + j(2) * .5, -112 - br * .3); g.quadraticCurveTo(0, -130 - br * .4, 43, -112 - br * .3); g.quadraticCurveTo(55, -58, 47, 6); g.quadraticCurveTo(0, 13, -47, 6); g.closePath();
    fillStroke(g, col, 0); g.save(); g.clip(); g.fillStyle = sh; g.fillRect(16, -140, 60, 160);
    if (hi) { g.fillStyle = hi; g.globalAlpha = .55; g.fillRect(-60, -140, 16, 160); g.globalAlpha = 1; }
    if (o.vest) { g.fillStyle = YEL; g.fillRect(-60, -70, 140, 16); g.fillRect(-60, -30, 140, 16); }
    if (o.coat) { g.fillStyle = o.coat; g.fillRect(-70, -140, 50, 160); g.fillRect(20, -140, 50, 160); g.fillStyle = '#f4ede0'; g.beginPath(); g.moveTo(-20, -118); g.lineTo(0, -60); g.lineTo(20, -118); g.closePath(); g.fill(); }
    g.restore();
    fillStroke(g, null, 5);
    if (!o.coat) { g.beginPath(); g.moveTo(-28, -50); g.lineTo(28, -50); g.lineTo(22, -18); g.lineTo(-22, -18); g.closePath(); fillStroke(g, sh, 4); }
    if (o.tie) { g.beginPath(); g.moveTo(0, -116); g.lineTo(-9, -96); g.lineTo(0, -50); g.lineTo(9, -96); g.closePath(); fillStroke(g, o.tie, 3.5); }
    else if (!o.coat) { g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-9, -110); g.lineTo(-11, -84); g.moveTo(9, -110); g.lineTo(11, -84); g.stroke(); }
    if (!o.coat) { g.beginPath(); g.ellipse(0, -117 - br * .4, 32, 12, 0, 0, 6.283); fillStroke(g, sh, 4.5); }
    if (o.badge) { g.save(); g.translate(-22, -80); g.rotate(-.1); rr(g, -18, -11, 36, 22, 4); fillStroke(g, CREAM, 3); g.restore(); }
    g.restore();
    function arms() {
      [[-1, P.lh, shL], [1, P.rh, shR]].forEach(function (A, i) {
        var tg = [A[1][0] + sway * (i ? -.3 : .3) + j(i + 9), A[1][1] + j(i + 11)], r = ik(A[2], tg, 70, 66, A[0], !!P.elDown);
        limb(g, [A[2], [r[0][0] + j(i + 13), r[0][1]], r[1]], 15, o.coat || col, i ? null : hi);
        circ(g, r[1][0], r[1][1], 12.5); fillStroke(g, HEAD, 4.5);
        if (o.hold && o.hold[i]) { g.save(); g.translate(r[1][0], r[1][1]); o.hold[i](g); g.restore(); }
      });
    }
    if (!P.front) arms();
    var tilt = lean + (P.tilt || 0), hc = [neck[0] + Math.sin(tilt) * 56, neck[1] - Math.cos(tilt) * 56];
    g.save(); g.translate(hc[0] + j(20) * .5, hc[1]); g.rotate(tilt);
    if (o.hair === 'bun') { circ(g, 0, -62, 22); fillStroke(g, '#c9c3cf', 4.5); }
    if (o.hair === 'zap') { for (var zi = 0; zi < 9; zi++) { var za = Math.PI * (1.08 + zi * .105), zl = 86 + hash(zi + bt) * 22; g.beginPath(); g.moveTo(Math.cos(za) * 40, Math.sin(za) * 40); g.lineTo(Math.cos(za + .06) * zl, Math.sin(za + .06) * zl); g.lineTo(Math.cos(za + .12) * 40, Math.sin(za + .12) * 40); fillStroke(g, '#3a3047', 4); } }
    circ(g, 0, 0, 56); fillStroke(g, o.skin2 || HEADS, 0);
    g.save(); circ(g, 0, 0, 56); g.clip(); circ(g, -9, -8, 54); g.fillStyle = o.skin || HEAD; g.fill();
    if (o.soot) { g.fillStyle = 'rgba(40,30,40,.55)'; for (var si = 0; si < 7; si++) { circ(g, -30 + hash(si) * 60, -30 + hash(si + 9) * 60, 10 + hash(si + 3) * 12); g.fill(); } }
    /* rim light on the lit side */
    g.globalAlpha = .7; g.beginPath(); g.arc(0, 0, 50, Math.PI * 1.05, Math.PI * 1.45); g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.lineCap = 'round'; g.stroke(); g.globalAlpha = 1;
    g.restore();
    circ(g, 0, 0, 56); fillStroke(g, null, 5);
    if (o.hair === 'bun') { g.beginPath(); g.arc(0, 0, 56, Math.PI * 1.05, Math.PI * 1.95); g.lineTo(30, -30); g.quadraticCurveTo(0, -44, -30, -30); g.closePath(); fillStroke(g, '#c9c3cf', 4.5); }
    if (o.sideburns) { [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(sd * 52, -18); g.quadraticCurveTo(sd * 60, 22, sd * 36, 38); g.lineTo(sd * 30, 18); g.quadraticCurveTo(sd * 40, 0, sd * 40, -18); g.closePath(); fillStroke(g, '#6b4a3a', 4); }); }
    face(g, P, t, seed, o);
    hat(g, o);
    if (o.glasses) { g.strokeStyle = INK; g.lineWidth = 4; circ(g, -20, -4, 15); g.stroke(); circ(g, 20, -4, 15); g.stroke(); g.beginPath(); g.moveTo(-5, -5); g.lineTo(5, -5); g.stroke(); }
    if (o.sunglasses) { g.beginPath(); g.roundRect(-40, -18, 34, 24, 8); g.roundRect(6, -18, 34, 24, 8); fillStroke(g, INK, 3); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-34, -14, 8, 6); g.fillRect(12, -14, 8, 6); }
    if (P.sweat) { var sk = (t * 1.4) % 1; g.save(); g.globalAlpha = 1 - sk; g.translate(48, -22 + sk * 30); g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(10, 4, 0, 8); g.quadraticCurveTo(-10, 4, 0, -12); fillStroke(g, '#9fe0ff', 3); g.restore(); }
    g.restore();
    if (P.front) arms();
    g.restore();
  }
  function face(g, P, t, seed, o) {
    var lx = (P.look ? P.look[0] : 0) * 7, ly = (P.look ? P.look[1] : 0) * 6;
    var blink = ((t + seed * 1.37) % 3.7) < .11, e = blink && P.eyes !== 'x' && P.eyes !== 'spiral' ? 'shut' : P.eyes;
    g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round';
    [-1, 1].forEach(function (sd) {
      var ex = sd * 19 + lx, ey = -4 + ly;
      if (e === 'dot') { g.beginPath(); g.ellipse(ex, ey, 7.5, 10, 0, 0, 6.283); g.fill(); circ(g, ex - 2.5, ey - 4, 2.4); g.fillStyle = '#fff'; g.fill(); g.fillStyle = INK; }
      else if (e === 'wide') { g.beginPath(); g.ellipse(ex, ey, 10.5, 14, 0, 0, 6.283); g.fill(); circ(g, ex - 3.5, ey - 5, 3.4); g.fillStyle = '#fff'; g.fill(); g.fillStyle = INK; }
      else if (e === 'tiny') { circ(g, ex, ey, 4.5); g.fill(); }
      else if (e === 'happy') { g.lineWidth = 5.5; g.beginPath(); g.arc(ex, ey + 5, 9, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      else if (e === 'x') { g.lineWidth = 5; g.beginPath(); g.moveTo(ex - 7, ey - 7); g.lineTo(ex + 7, ey + 7); g.moveTo(ex + 7, ey - 7); g.lineTo(ex - 7, ey + 7); g.stroke(); }
      else if (e === 'spiral') { g.lineWidth = 3.5; g.beginPath(); for (var k = 0; k < 24; k++) { var a = k * .55 + t * 8 * sd, r = k * .45; if (k) g.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r); else g.moveTo(ex, ey); } g.stroke(); }
      else if (e === 'squint') { g.lineWidth = 5; g.beginPath(); g.moveTo(ex + 8 * sd, ey - 7); g.lineTo(ex - 6 * sd, ey); g.lineTo(ex + 8 * sd, ey + 7); g.stroke(); }
      else if (e === 'side') { g.beginPath(); g.ellipse(ex + 4, ey, 7.5, 10, 0, 0, 6.283); g.fill(); g.lineWidth = 4.5; g.beginPath(); g.moveTo(ex - 11, ey - 7); g.lineTo(ex + 11, ey - 7); g.stroke(); }
      else { g.lineWidth = 5; g.beginPath(); g.moveTo(ex - 8, ey + 1); g.lineTo(ex + 8, ey + 1); g.stroke(); }
      var b = P.brow || 0, by = -27 + ly * .5 - (b === 1 ? 7 : 0), inner = b === -1 ? 6 : b === 2 ? -6 : 0;
      g.lineWidth = 5; g.beginPath(); g.moveTo(sd * 8 + lx, by + inner); g.lineTo(sd * 30 + lx, by); g.stroke();
    });
    var m = P.mouth, my = 24 + ly * .5, mx = lx * .6;
    g.lineWidth = 5;
    if (m === 'smile') { g.beginPath(); g.arc(mx, my - 8, 13, Math.PI * .2, Math.PI * .8); g.stroke(); }
    else if (m === 'grin') { g.beginPath(); g.moveTo(mx - 17, my - 4); g.quadraticCurveTo(mx, my - 8, mx + 17, my - 4); g.quadraticCurveTo(mx, my + 22, mx - 17, my - 4); g.fill(); g.save(); g.clip(); circ(g, mx, my + 14, 9); g.fillStyle = '#ff7a8a'; g.fill(); g.restore(); }
    else if (m === 'o') { g.beginPath(); g.ellipse(mx, my, 6, 8, 0, 0, 6.283); g.fill(); }
    else if (m === 'O') { g.beginPath(); g.ellipse(mx, my + 2, 11, 15, 0, 0, 6.283); g.fill(); }
    else if (m === 'frown') { g.beginPath(); g.arc(mx, my + 10, 12, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
    else if (m === 'wavy') { g.beginPath(); g.moveTo(mx - 15, my); for (var i = 1; i <= 6; i++) g.lineTo(mx - 15 + i * 5, my + (i % 2 ? -4 : 4)); g.stroke(); }
    else if (m === 'talk') { var op = .5 + .5 * Math.abs(Math.sin(t * 15)); g.beginPath(); g.ellipse(mx, my, 9, 3 + op * 8, 0, 0, 6.283); g.fill(); }
    else if (m === 'smirk') { g.beginPath(); g.moveTo(mx - 12, my - 2); g.quadraticCurveTo(mx + 2, my + 4, mx + 14, my - 7); g.stroke(); }
    else if (m === 'teeth') { rr(g, mx - 18, my - 8, 36, 18, 6); fillStroke(g, '#fff', 4); g.beginPath(); g.moveTo(mx - 18, my + 1); g.lineTo(mx + 18, my + 1); g.moveTo(mx - 6, my - 8); g.lineTo(mx - 6, my + 10); g.moveTo(mx + 6, my - 8); g.lineTo(mx + 6, my + 10); g.lineWidth = 2.5; g.stroke(); }
    else { g.beginPath(); g.moveTo(mx - 10, my); g.lineTo(mx + 10, my); g.stroke(); }
  }
  function hat(g, o) {
    if (o.hat === 'hard') { g.beginPath(); g.arc(0, -22, 52, Math.PI, 0); g.closePath(); fillStroke(g, YEL, 5); g.beginPath(); g.ellipse(0, -22, 66, 9, 0, 0, 6.283); fillStroke(g, YEL, 5); g.beginPath(); g.moveTo(0, -74); g.lineTo(0, -30); g.lineWidth = 4; g.stroke(); }
    else if (o.hat === 'cap') { g.beginPath(); g.arc(0, -16, 55, Math.PI * 1.02, -.02); g.closePath(); fillStroke(g, o.capCol || GREEN, 5); g.beginPath(); g.moveTo(30, -18); g.quadraticCurveTo(80, -22, 92, -8); g.lineTo(34, -6); g.closePath(); fillStroke(g, o.capCol || GREEN, 5); }
    else if (o.hat === 'sun') { g.beginPath(); g.ellipse(0, -36, 92, 16, 0, 0, 6.283); fillStroke(g, '#e8c57a', 5); g.beginPath(); g.arc(0, -36, 46, Math.PI, 0); g.closePath(); fillStroke(g, '#e8c57a', 5); g.fillStyle = HOOD; g.fillRect(-44, -48, 88, 10); }
    else if (o.hat === 'top') { rr(g, -40, -150, 80, 110, 6); fillStroke(g, '#2b2433', 5); g.fillStyle = '#8a3b3b'; g.fillRect(-38, -62, 76, 14); g.beginPath(); g.ellipse(0, -42, 70, 12, 0, 0, 6.283); fillStroke(g, '#2b2433', 5); }
    else if (o.hat === 'straw') { g.beginPath(); g.ellipse(0, -40, 96, 18, 0, 0, 6.283); fillStroke(g, '#e8c57a', 5); g.beginPath(); g.arc(0, -40, 44, Math.PI, 0); g.closePath(); fillStroke(g, '#e8c57a', 5); g.fillStyle = '#5b8f4a'; g.fillRect(-42, -52, 84, 10); }
    else if (o.hat === 'beanie') { g.beginPath(); g.arc(0, -14, 56, Math.PI, 0); g.closePath(); fillStroke(g, o.capCol || BLUE, 5); rr(g, -60, -24, 120, 20, 8); fillStroke(g, o.capCol || BLUE, 5); circ(g, 0, -74, 12); fillStroke(g, CREAM, 4); }
  }
  /* the cast */
  var YOU = { col: HOOD, shade: HOODS, seed: 1 };
  var CARR = { col: '#3b3448', shade: '#2b2533', coat: '#3b3448', hat: 'top', sideburns: true, seed: 6, legs: '#2b2533' };
  var OPER = { col: '#6b5a8a', shade: '#55476f', tie: RED, seed: 9 };
  var FARM = { col: '#3d7bff', shade: '#2f5fc4', hat: 'straw', seed: 5 };
  var ENG = { col: '#ffc83d', shade: '#e0a92a', hat: 'hard', glasses: true, seed: 3, badge: true };
  var PIZZA = { col: RED, shade: '#c9322a', hat: 'cap', capCol: CREAM, seed: 8 };

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
    if (fn) fn(g, w, h);
    g.restore();
  }
  function tape(g, x, y, rot) { g.save(); g.translate(x, y); g.rotate(rot || 0); g.fillStyle = 'rgba(255,240,190,.75)'; g.fillRect(-50, -16, 100, 32); g.restore(); }
  /* a big number that rolls up from 0 as k goes 0..1 */
  function counter(g, x, y, k, to, px, col, o) {
    o = o || {}; var v = to * eo(clamp(k, 0, 1)), s = o.fmt ? o.fmt(v) : Math.round(v).toLocaleString('en-US');
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

  /* scenes: each starts just before its first line; wipe = how it arrives; part = a chapter card slams in the pause before it */
  var SC = [
    { id: 'beach', name: 'The Sun sneezes', t0: 0, draw: sBeach },
    { id: 'storm', name: 'A planet that runs on electricity', t0: start('open3') - .3, draw: sStorm, wipe: 'none' },
    { id: 'ask', name: 'Three questions', t0: start('open4') - .3, draw: sAsk, wipe: 'slide' },
    { id: 'title', name: 'Title', t0: start('title') - .45, draw: sTitle, wipe: 'iris' },
    { id: 'trip', name: '93 million miles', t0: start('warn1') - .3, draw: sTrip, wipe: 'slide', part: 'HOW MUCH WARNING?' },
    { id: 'doorbell', name: 'A doorbell camera in space', t0: start('warn3') - .3, draw: sDoorbell, wipe: 'iris' },
    { id: 'pizza', name: 'Faster than pizza', t0: start('warn5') - .3, draw: sPizza, wipe: 'slide' },
    { id: 'carr', name: 'Carrington, 1859', t0: start('hist1') - .3, draw: sCarr, wipe: 'slide', part: 'IT HAPPENED BEFORE' },
    { id: 'aurora', name: 'Northern lights in the Caribbean', t0: start('hist3') - .3, draw: sAurora, wipe: 'iris' },
    { id: 'tele', name: 'The telegraph goes haywire', t0: start('hist4') - .3, draw: sTele, wipe: 'slide' },
    { id: 'thennow', name: 'Then and now', t0: start('hist8') - .3, draw: sThenNow, wipe: 'slide' },
    { id: 'starlink', name: '38 satellites, a minor storm', t0: start('sat1') - .3, draw: sStarlink, wipe: 'slide', part: 'WHAT BREAKS FIRST?' },
    { id: 'tractor', name: 'Tractors off by ten feet', t0: start('sat4') - .3, draw: sTractor, wipe: 'slide' },
    { id: 'lake', name: 'Turn left into a lake', t0: start('sat6') - .3, draw: sLake, wipe: 'iris' },
    { id: 'lines', name: 'The power lines', t0: start('grid1') - .3, draw: sLines, wipe: 'slide', part: 'THE LIGHTS GO OUT' },
    { id: 'quebec', name: 'Quebec, 1989', t0: start('grid3') - .3, draw: sQuebec, wipe: 'slide' },
    { id: 'big', name: 'The big one', t0: start('grid6') - .3, draw: sBig, wipe: 'iris' },
    { id: 'trans', name: 'House-size transformers', t0: start('long1') - .3, draw: sTrans, wipe: 'slide', part: 'HOW LONG DOES IT LAST?' },
    { id: 'lloyds', name: "Lloyd's ran the numbers", t0: start('long3') - .3, draw: sLloyds, wipe: 'slide' },
    { id: 'fridge', name: 'Your fridge, then your nose', t0: start('long6') - .3, draw: sFridge, wipe: 'iris' },
    { id: 'odds', name: 'The odds', t0: start('odds1') - .3, draw: sOdds, wipe: 'slide', part: 'SHOULD YOU WORRY?' },
    { id: 'miss', name: 'The 2012 near miss', t0: start('odds3') - .3, draw: sMiss, wipe: 'slide' },
    { id: 'prep', name: 'An hour is enough', t0: start('odds5') - .3, draw: sPrep, wipe: 'slide' },
    { id: 'miami', name: 'Northern lights in Miami', t0: start('end1') - .3, draw: sMiami, wipe: 'iris' },
    { id: 'card', name: 'Watch next', t0: start('end5') - .3, draw: sCard, wipe: 'slide' }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  /* the part cards land in the pause before each part's first line */
  var PARTS = [];
  SC.forEach(function (s, i) { if (s.part) { var prev = VO.lines[VO.lines.indexOf(LINE[firstLine(s)]) - 1]; PARTS.push({ t: prev.t1 + .12, n: PARTS.length + 1, text: s.part, scene: s }); } });
  function firstLine(s) { for (var i = 0; i < VO.lines.length; i++) if (VO.lines[i].t0 >= s.t0) return VO.lines[i].id; }
  /* YouTube chapters (each ≥ 10 s, first at 0:00) */
  var CHAPTERS = [['The Sun sneezes', 0]].concat(PARTS.map(function (p) { return [p.text.charAt(0) + p.text.slice(1).toLowerCase(), Math.max(0, p.t - .1)]; })).concat([['The weird upside', S('miami').t0]]);

  /* ---------- part cards: slam in big, then park top-left as a label for the part ---------- */
  function partCards(g, t) {
    for (var i = 0; i < PARTS.length; i++) {
      var c = PARTS[i], nx = i + 1 < PARTS.length ? PARTS[i + 1].t : S('miami').t0;
      if (t < c.t || t > nx) continue;
      var u = t - c.t, k = eio(seg(u, 1.25, 1.7));
      font(g, 120, 900, DISP, true); var tw = g.measureText(c.text).width, cw = Math.max(tw + 140, 900), ch = 330;
      var s = lerp(1, .3, k), px = lerp(W / 2, 30 + cw * s / 2, k), py = lerp(H / 2, 40 + ch * s / 2, k);
      if (k < 1) { g.fillStyle = 'rgba(14,10,28,' + (.6 * (1 - k) * clamp(u * 6, 0, 1)) + ')'; g.fillRect(0, 0, W, H); }
      var sl = pop(t, c.t, 2.8, .5), sc = s * lerp(1.6, 1, clamp(sl, 0, 1));
      g.save(); g.translate(px, py); g.scale(sc, sc); g.rotate(lerp(-.04, -.015, k) + knock(t, c.t + .1, 30, 9) * .05);
      g.globalAlpha = clamp(sl * 3, 0, 1) * (t > nx - .3 ? 1 - seg(t, nx - .3, nx) : 1) * (k >= 1 ? .92 : 1);
      rr(g, -cw / 2 + 16, -ch / 2 + 20, cw, ch, 26); g.fillStyle = 'rgba(8,6,18,.5)'; g.fill();
      rr(g, -cw / 2, -ch / 2, cw, ch, 26); fillStroke(g, YEL, 10);
      g.fillStyle = INK; g.fillRect(-cw / 2, -ch / 2 + 20, 16, ch - 40);
      txt(g, 'PART ' + c.n + ' OF 6', 0, -78, 52, INK, { fam: MONO, wt: 700, ls: 6 });
      txt(g, c.text, 0, 46, 120, INK, { wt: 900, wide: true });
      g.restore();
    }
  }

  /* ---------- captions: one card per phrase, stressed words in yellow ---------- */
  var EMPH = /\d|^(sneezes|biggest|warning|pizza|doorbell|record|flash|caribbean|haywire|zapped|sparks|everything|minor|lake|gps|danger|flood|collapsed|transformers|house|years|trillion|fridge|nose|worried|odds|percent|decade|miss|week|safe|flashlight|water|map|school|miami|selfie|post|million|hours|seconds|seventeen|ten|twenty|forty|six|nine|twelve)\b/i;
  function captions(g, t) {
    if (!LIVE.text) return;
    var caps = VO.captions || [], c = null;
    for (var i = 0; i < caps.length; i++) if (t >= caps[i].t0 && t < caps[i].t1) { c = caps[i]; break; }
    if (!c || S('title').t0 < t && t < S('title').t1) return;
    var a = clamp((t - c.t0) / .08, 0, 1) * clamp((c.t1 - t) / .08, 0, 1);
    font(g, 50, 800); var words = c.words.map(function (w) { return w.w; }), sp = g.measureText(' ').width;
    var ws = words.map(function (w) { return g.measureText(w).width; }), tw = ws.reduce(function (s, v) { return s + v; }, 0) + sp * (words.length - 1);
    var y = 996, x = W / 2 - tw / 2;
    g.save(); g.globalAlpha = a;
    rr(g, W / 2 - tw / 2 - 30, y - 42, tw + 60, 84, 22); g.fillStyle = 'rgba(16,12,30,.82)'; g.fill();
    g.textAlign = 'left'; g.textBaseline = 'middle';
    words.forEach(function (w, i) {
      var said = t >= c.words[i].t0 - .02, hot = EMPH.test(w.replace(/[^\w'%]/g, ''));
      g.fillStyle = hot ? YEL : said ? CREAM : 'rgba(244,237,224,.55)'; g.fillText(w, x, y + 3); x += ws[i] + sp;
    });
    g.restore();
  }

  /* ---------- transitions ---------- */
  function wipe(g, t, s, prev) {
    var k = eio(seg(t, s.t0 - .02, s.t0 + .42));
    if (k >= 1 || s.wipe === 'none' || !prev) { s.draw(g, t, s); return; }
    prev.draw(g, t, prev);
    g.save(); g.beginPath();
    if (s.wipe === 'iris') { circ(g, W / 2, H / 2, k * 1150); }
    else { var x = -200 + k * (W + 400); g.moveTo(-10, -10); g.lineTo(x + 120, -10); g.lineTo(x - 120, H + 10); g.lineTo(-10, H + 10); g.closePath(); }
    g.clip(); s.draw(g, t, s); g.restore();
    g.save();
    if (s.wipe === 'iris') { circ(g, W / 2, H / 2, k * 1150); g.lineWidth = 26; g.strokeStyle = INK; g.stroke(); g.lineWidth = 8; g.strokeStyle = YEL; g.stroke(); }
    else { x = -200 + k * (W + 400); g.beginPath(); g.moveTo(x + 120, -10); g.lineTo(x - 120, H + 10); g.lineWidth = 34; g.strokeStyle = INK; g.stroke(); g.lineWidth = 10; g.strokeStyle = YEL; g.stroke(); }
    g.restore();
  }

  /* YouTube thumbnail (1920×1080, saved at 1280×720): the Sun mid-sneeze, Earth in the way, three words */
  function thumb(g) {
    var t = 2.2; g.setTransform(1, 0, 0, 1, 0, 0);
    space(g, t, 0, 0, { a: '#120d2c', b: '#2a1640' });
    sun(g, 1420, 470, 330, t, 'sneeze', { spots: true });
    for (var i = 0; i < 16; i++) { var a = Math.PI * (.6 + hash(i) * .6), d = 420 + hash(i + 3) * 300; circ(g, 1420 + Math.cos(a) * d, 470 + Math.sin(a) * d * .8, 10 + hash(i + 5) * 10); g.fillStyle = '#ffe9a0'; g.fill(); }
    plasma(g, 900, 640, 210, t, 1, true);
    earth(g, 300, 840, 220, t, { lon: -75, lat: 25, light: 1, field: .8, squash: .6 });
    g.save(); g.translate(560, 220); g.rotate(-.05); txt(g, 'THE SUN', 0, 0, 170, CREAM, { wt: 900, wide: true, outline: 26 }); g.restore();
    g.save(); g.translate(560, 430); g.rotate(-.06); font(g, 150, 900, DISP, true); var sw = g.measureText('SNEEZED').width + 90; rr(g, -sw / 2, -105, sw, 210, 28); fillStroke(g, RED, 14); txt(g, 'SNEEZED', 0, 8, 150, '#fff', { wt: 900, wide: true }); g.restore();
    vignette(g, .35);
  }

  /* ---------- frame ---------- */
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = NIGHT; g.fillRect(0, 0, W, H);
    var i = sceneAt(t), s = SC[i];
    g.save(); wipe(g, t, s, i > 0 ? SC[i - 1] : null); g.restore();
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    partCards(g, t);
    captions(g, t);
    if (t > DUR - .5) { g.fillStyle = 'rgba(0,0,0,' + seg(t, DUR - .5, DUR) + ')'; g.fillRect(0, 0, W, H); }
    if (LIVE.grain && NOISE) { g.save(); g.globalAlpha = .045; g.globalCompositeOperation = 'overlay'; var ox = Math.floor(hash(Math.floor(t * 24)) * 256), oy = Math.floor(hash(Math.floor(t * 24) + 1) * 256); g.translate(-ox, -oy); g.fillStyle = g.createPattern(NOISE, 'repeat'); g.fillRect(0, 0, W + 256, H + 256); g.restore(); }
  }
  function TEXTS(t) {
    var out = [];
    /* the card slams in for 1.7 s, then stays on screen as the parked top-left label until the next part */
    PARTS.forEach(function (c, i) { var nx = i + 1 < PARTS.length ? PARTS[i + 1].t : S('miami').t0; if (t >= c.t && t < nx) out.push({ id: 'part' + i, text: 'PART ' + c.n + ' ' + c.text }); });
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [];
  function E(t, type, o) { EV.push(Object.assign({ t: t, type: type }, o || {})); }
  function words(id, list, type, o, off) { list.forEach(function (w) { E(at(id, w) + (off || -.08), type, o); }); }
  function initTimes() {
    var i;
    /* beach */
    E(0, 'waves', { t1: start('open3') - .2 });
    E(at('open1', 'sun') - .25, 'aah', { t1: at('open1', 'sneezes') - .02 }); E(at('open1', 'sneezes'), 'choo'); E(at('open1', 'sneezes') + .1, 'boom');
    E(start('open2') - .1, 'rush', { t1: end('open2') + .35 }); E(at('open2', 'us') - .1, 'stamp');
    /* storm */
    E(start('open3') - .25, 'whoosh'); E(at('open3', 'biggest') - .1, 'stamp', { big: true }); E(at('open3', 'electricity') - .05, 'zap', { t1: at('open3', 'electricity') + .8 });
    /* ask */
    words('open4', ['breaks', 'long', 'worried'], 'paper', { g: 1.4 }, -.25); words('open4', ['breaks', 'long', 'worried'], 'pop', { g: .8 }, -.15);
    E(at('open5', 'scary') - .1, 'whoosh'); E(at('open5', 'warning') - .3, 'pop', { g: 1 }); for (i = 0; i < 8; i++) E(at('open5', 'warning') + i * .25, 'tick', { g: .2 });
    /* title */
    ['what', 'if', 'the', 'biggest', 'solar', 'storm', 'in', 'history', 'hit', 'earth'].forEach(function (w) { E(at('title', w) - .06, 'tick', { g: .25 }); });
    E(at('title', 'tomorrow') - .06, 'stamp', { big: true });
    /* part cards: the hard hit */
    PARTS.forEach(function (c) { E(c.t - .02, 'slam'); E(c.t + 1.25, 'swish'); });
    /* trip */
    E(at('warn1', 'cross') - .1, 'rise', { t1: end('warn1') }); for (i = 0; i < 20; i++) E(at('warn1', 'ninetythree') + i * .06, 'tick', { g: .1 }); E(at('warn1', 'miles') + .1, 'ding1');
    E(at('warn2', '1859') - .1, 'pop', { g: .7 }); E(at('warn2', 'trip') - .05, 'whoosh'); E(at('warn2', 'hours') - .05, 'ding');
    /* doorbell */
    E(at('warn3', 'million') - .1, 'zip', { t1: at('warn3', 'million') + .5 }); E(at('warn3', 'doorbell') - .05, 'blip', { f: 1400, g: .1 });
    E(start('warn4') - .2, 'rush', { t1: at('warn4', 'hits') }); E(at('warn4', 'hits'), 'thump', { g: .6 }); E(at('warn4', 'hits') + .05, 'dingdong'); E(at('warn4', 'fifteen') - .1, 'stamp');
    /* pizza */
    E(at('warn5', 'pizza') - .3, 'pop', { g: .7 }); E(at('warn5', 'less') - .2, 'pop', { g: .7 }); E(start('warn6') - .3, 'whoosh'); E(at('warn6', 'fry') - .1, 'zap', { t1: at('warn6', 'fry') + 1.0 });
    /* carrington */
    E(start('hist1') - .2, 'projector', { t1: start('hist3') - .3 }); E(at('hist1', 'before') - .1, 'stamp', { small: true }); E(at('hist2', 'september') - .1, 'paper', { g: 1.5 }); E(at('hist2', 'flash') - .05, 'shimmer', { t1: at('hist2', 'flash') + 1.4 }); E(at('hist2', 'flash') - .05, 'ding1', { f: 1 });
    /* aurora */
    E(at('hist3', 'explodes') - .3, 'shimmer', { t1: end('hist3') + .4 }); E(at('hist3', 'caribbean') - .1, 'pop', { g: .6 });
    /* telegraph */
    E(at('hist4', 'haywire') - .2, 'morse', { t1: at('hist5', 'zapped') - .1 }); E(at('hist5', 'sparks') - .05, 'zap', { t1: at('hist5', 'sparks') + .7 }); E(at('hist5', 'zapped') - .05, 'zap', { t1: at('hist5', 'zapped') + .4 }); E(at('hist5', 'zapped'), 'boing');
    E(at('hist6', 'unplug') + .1, 'clunk'); E(at('hist6', 'anyway') - .3, 'morse', { t1: end('hist6') + .3 }); E(at('hist6', 'storm') - .1, 'pop', { g: .6 });
    /* then / now */
    E(start('hist8') - .2, 'whoosh'); E(at('hist8', '1859') - .1, 'pop', { g: .6 }); for (i = 0; i < 12; i++) E((i < 2 ? at('hist8', 'advanced') + i * .2 : start('hist9') - .3 + (i - 2) * ((at('hist9', 'everything') - start('hist9') + .3) / 10)) + .02, 'blip', { f: 700 + i * 70, g: .07 });
    /* starlink */
    E(at('sat2', 'minor') - .2, 'pop', { g: .7 }); E(at('sat2', 'knocked'), 'fall', { t1: at('sat2', 'knocked') + 1.6 }); E(at('sat2', 'knocked') + .5, 'fall', { t1: at('sat2', 'knocked') + 2.2 });
    for (i = 0; i < 16; i++) E(at('sat2', 'thirtyeight') - .1 + i * .04, 'tick', { g: .12 }); E(at('sat2', 'starlink') + .2, 'ding1'); E(at('sat3', 'minor') - .08, 'stamp', { small: true });
    /* tractor */
    E(start('sat4') - .2, 'engine', { t1: at('sat5', 'stopped') - .2 }); E(at('sat4', 'threw') - .05, 'glitch', { t1: at('sat4', 'threw') + .5 }); E(at('sat4', 'ten') - .1, 'pop', { g: .7 }); E(at('sat5', 'stopped') + .2, 'stamp', { small: true });
    /* lake */
    E(start('sat6') - .2, 'engine', { t1: at('sat6', 'lake') }); E(at('sat6', 'left') - .1, 'blip', { f: 1200, g: .12 }); E(at('sat6', 'lake') + .2, 'splash');
    E(at('sat7', 'planes') - .2, 'whoosh'); E(at('sat7', 'radio') - .2, 'static', { t1: at('sat7', 'radio') + 1.1 }); E(at('sat7', 'phone') - .1, 'ding1', { f: 1 }); E(at('sat7', 'now') - .1, 'buzzbad');
    /* lines */
    E(at('grid1', 'down') - .3, 'whoosh'); E(at('grid2', 'shakes') - .1, 'hum', { t1: end('grid2') + .2 }); E(at('grid2', 'shoves') - .05, 'zap', { t1: at('grid2', 'shoves') + .8 }); E(at('grid2', 'flood') - .2, 'rushw', { t1: end('grid2') + .2 });
    /* quebec */
    E(at('grid3', 'march') - .1, 'paper'); for (i = 0; i < 18; i++) E(at('grid4', 'collapsed') + i * (wend('grid4', 'seconds') - at('grid4', 'collapsed')) / 18, 'tick', { g: .14 }); E(at('grid4', 'collapsed'), 'powerdown'); E(wend('grid4', 'seconds'), 'thump', { g: .5 });
    E(at('grid5', 'six') - .1, 'pop', { g: .7 }); E(at('grid5', 'nine') - .1, 'stamp');
    /* big */
    E(at('grid6', 'big') - .4, 'rise', { t1: at('grid6', 'big') + .2 }); E(at('grid6', 'big') + .2, 'boom');
    /* transformers */
    E(at('long1', 'night') - .1, 'clocktick', { t1: at('long1', 'transformers') - .2 }); E(at('long1', 'transformers') - .25, 'whoosh'); E(at('long1', 'transformers'), 'hum', { t1: start('long3') - .3 });
    E(at('long2', 'house') - .2, 'pop', { g: .8 }); E(at('long2', 'order') - .1, 'stamp'); for (i = 0; i < 10; i++) E(at('long2', 'years') - .1 + i * .18, 'flip', { g: .5 });
    /* lloyd's */
    E(at('long3', 'lloyds') - .1, 'paper'); for (i = 0; i < 14; i++) E(at('long4', 'twenty') - .3 + hash(i) * 1.2, 'powerdown'); E(at('long4', 'year') - .1, 'stamp');
    E(start('long5') - .2, 'receipt', { t1: at('long5', 'trillion') + .3 }); E(at('long5', '2.6') - .1, 'stamp', { big: true }); E(at('long5', 'trillion') + .2, 'register');
    /* fridge */
    E(at('long6', 'fridge') - .3, 'fridgedoor'); E(at('long7', 'nose') - .2, 'flies', { t1: S('odds').t0 - .2 });
    /* odds */
    E(at('odds1', 'worried') - .1, 'gulp'); E(at('odds2', 'odds') - .1, 'pop', { g: .6 }); E(at('odds2', 'twelve') - .2, 'rise', { t1: at('odds2', 'twelve') + .3 }); E(at('odds2', 'decade') - .1, 'stamp', { small: true });
    /* near miss */
    E(at('odds3', 'near') - .1, 'stamp', { small: true }); E(at('odds4', 'fired'), 'whoosh'); E(at('odds4', 'week') - .2, 'pop', { g: .6 }); E(at('odds4', 'hit') - .1, 'thump', { g: .5 }); E(at('odds4', 'hit') + .4, 'ding1', { f: 1 });
    /* prep */
    E(at('odds5', 'hour') - .1, 'ding1'); E(at('odds5', 'lower') + .1, 'clunk'); E(at('odds5', 'safe') - .7, 'whoosh'); E(at('odds5', 'safe') - .1, 'powerdown');
    words('odds6', ['flashlight', 'water', 'map'], 'tickbox', null, 0); E(at('odds6', 'flashlight') + .1, 'click');
    /* miami */
    E(start('end1') - .2, 'waves', { t1: start('end5') - .3 }); E(at('end1', 'weird') - .1, 'pop', { g: .6 }); E(at('end2', 'northern') - .2, 'shimmer', { t1: end('end3') }); E(at('end2', 'miami') - .1, 'pop', { g: .7 });
    E(at('end3', 'selfie'), 'shutter'); E(at('end4', 'post') + .05, 'buzzbad');
    /* card */
    E(at('end5', 'cables') - .3, 'pop', { g: .8 }); E(at('end5', 'here') - .1, 'ding');
    SC.forEach(function (s, j) { if (j && s.wipe !== 'none') E(s.t0 - .05, 'swish'); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

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

  /* ---------- sound: foley cut to the word times; no music (Isac adds his own) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.1), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .16; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function tickS(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .22], [t + .025, 0]]); }
    function blip(t, f, g) { var o = osc('sine', f, t, t + .12, 1, [[t, 0], [t + .004, g || .09], [t + .1, 0]], .3, clamp((f - 1100) / 1400, -1, 1)); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + .07); }
    function ding(t) { [76, 83, 88].forEach(function (m, j) { osc('sine', mtof(m), t + j * .04, t + 1.2, 1, [[t + j * .04, 0], [t + j * .04 + .005, .08], [t + 1.1, 0]], .5, (j - 1) * .4); }); }
    function ding1(t, hi) { osc('sine', mtof(hi ? 81 : 76), t, t + .7, 1, [[t, 0], [t + .005, .07], [t + .6, 0]], .4); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, 1, [[t, 0], [t + .004, g || .4], [t + .26, 0]], .1); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t - .12, t + .14, 900, 5200, .1, .02, 1.6); }
    function whoosh(t) { band(t - .15, t + .35, 500, 3800, .12, .02, 1.2); }
    function stampS(t, big, small) { thump(t, big ? .65 : small ? .32 : .45); var n = noise(t, .16), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1500; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .45 : small ? .2 : .32], [t + .12, 0]]); tickS(t + .005, .18); }
    function paper(t, g) { g = g || 1; band(t - .03, t + .12, 1800, 3800, .07 * g, .02, 1.2, (rnd() - .5) * .8); tickS(t + .1, .08 * g); }
    function flip(t, g) { g = g || 1; band(t, t + .12, 2000, 5000, .08 * g, .02, 2, -.3); tickS(t + .1, .15 * g); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function click(t) { tickS(t, .5); thump(t, .3); tickS(t + .08, .25); }
    function rise(t, t1) { band(t, t1, 400, 1800, .03, .06, 3); }
    function zip(t, t1) { band(t, t1, 1500, 7000, .02, .07, 3); }
    function buzzbad(t) { osc('square', 110, t, t + .35, 1, [[t, 0], [t + .01, .05], [t + .3, .05], [t + .35, 0]], .05); osc('square', 117, t, t + .35, 1, [[t, 0], [t + .01, .045], [t + .3, .045], [t + .35, 0]], .05); }
    function splash(t) { band(t, t + .7, 2500, 600, .15, .02, .8); thump(t, .3); }
    function glitch(t, t1) { var n = Math.floor((t1 - t) / .05); for (var k = 0; k < n; k++) { var tt = t + k * .05; if (rnd() < .6) osc('square', 300 + rnd() * 1500, tt, tt + .04, 1, [[tt, 0], [tt + .002, .025], [tt + .035, 0]]); } }
    function powerdown(t) { var o = osc('sawtooth', 220, t, t + .7, 1, [[t, 0], [t + .01, .05], [t + .65, 0]], .1); o.frequency.exponentialRampToValueAtTime(40, t + .6); }
    function rush(t, t1) { band(t, t1, 300, 2400, .06, .12, .6); band(t, t1, 2500, 5000, .02, .05, 1); }
    function boom(t) { var o = osc('sine', 70, t, t + 2.2, 1, [[t, 0], [t + .02, .5], [t + 2, 0]], .3); o.frequency.exponentialRampToValueAtTime(30, t + 1.5); band(t, t + 1.8, 400, 120, .2, .02, .5); }
    function fall(t, t1) { var o = osc('sine', 900, t, t1 + .1, 1, [[t, 0], [t + .02, .05], [t1, .03], [t1 + .1, 0]], .2); o.frequency.exponentialRampToValueAtTime(260, t1); }
    /* new for this episode */
    /* the sneeze: a rising, nasal "aah" swell (filtered saw), then a noisy "choo" */
    function aah(t, t1) { var o = osc('sawtooth', 160, t, t1 + .05, 1, [[t, 0], [t + .2, .02], [t1 - .05, .05], [t1, 0]], .2); o.frequency.linearRampToValueAtTime(330, t1); band(t, t1, 700, 1400, .02, .05, 4); }
    function choo(t) { var o = bus(1, .3), hp2 = ac.createBiquadFilter(); hp2.type = 'bandpass'; hp2.frequency.value = 3800; hp2.Q.value = .8; var n = noise(t, .45); n.connect(hp2); hp2.connect(o); env(o.gain, [[t, 0], [t + .01, .55], [t + .08, .3], [t + .42, 0]]); thump(t, .5); }
    /* an electric crackle */
    function zap(t, t1) { var n = Math.max(4, Math.floor((t1 - t) / .03)); for (var k = 0; k < n; k++) { var tt = t + k * (t1 - t) / n + rnd() * .015; if (rnd() < .7) { var o = bus(1, .15, (rnd() - .5) * .6), hp3 = ac.createBiquadFilter(); hp3.type = 'highpass'; hp3.frequency.value = 2000 + rnd() * 3000; var ns = noise(tt, .03); ns.connect(hp3); hp3.connect(o); env(o.gain, [[tt, 0], [tt + .001, .18 + rnd() * .2], [tt + .02, 0]]); } } osc('sawtooth', 60, t, t1, 1, [[t, 0], [t + .02, .03], [t1 - .05, .03], [t1, 0]], .05); }
    function staticS(t, t1) { band(t, t1, 3000, 3200, .06, .05, .4); glitch(t, t1); }
    /* auroras and flashes: a soft shimmering chord */
    function shimmer(t, t1) { [79, 83, 86, 91].forEach(function (m, j) { var o = osc('sine', mtof(m), t, t1 + .5, 1, [[t, 0], [t + .4 + j * .1, .018], [t1, .015], [t1 + .5, 0]], .7, (j - 1.5) * .5); var lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 5 + j; lg.gain.value = 4; lfo.connect(lg); lg.connect(o.frequency); lfo.start(Math.max(0, t)); lfo.stop(t1 + .5); }); }
    function clunk(t) { thump(t, .55); band(t, t + .1, 600, 300, .12, .02, 3); tickS(t + .02, .3); }
    function boing(t) { var o = osc('sine', 300, t, t + .5, 1, [[t, 0], [t + .01, .08], [t + .45, 0]], .2); env(o.frequency, [[t, 300], [t + .1, 600], [t + .2, 260], [t + .3, 480], [t + .45, 300]]); }
    function dingdong(t) { [[79, 0], [75, .32]].forEach(function (n) { osc('triangle', mtof(n[0]), t + n[1], t + n[1] + 1, 1, [[t + n[1], 0], [t + n[1] + .01, .09], [t + n[1] + .9, 0]], .4); }); }
    function slam(t) { thump(t, .7); var n = noise(t, .25), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; var o = bus(1, .35); n.connect(lp); lp.connect(o); env(o.gain, [[t, 0], [t + .003, .6], [t + .2, 0]]); osc('sine', 55, t, t + .6, 1, [[t, 0], [t + .01, .35], [t + .55, 0]], .1); }
    function morse(t, t1) { var tt = t; while (tt < t1) { var d = rnd() < .5 ? .06 : .16; osc('square', 740, tt, tt + d, 1, [[tt, 0], [tt + .005, .025], [tt + d - .005, .025], [tt + d, 0]], .1, .3); tickS(tt, .12); tt += d + .06; } }
    function engine(t, t1) { var o = osc('sawtooth', 48, t, t1 + .2, 1, [[t, 0], [t + .3, .035], [t1, .035], [t1 + .2, 0]], .05); var lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 9; lg.gain.value = 6; lfo.connect(lg); lg.connect(o.frequency); lfo.start(Math.max(0, t)); lfo.stop(t1 + .2); }
    function hum(t, t1) { [60, 120, 180].forEach(function (f, j) { osc('sine', f, t, t1 + .3, 1, [[t, 0], [t + .3, .05 / (j + 1)], [t1, .05 / (j + 1)], [t1 + .3, 0]], .05); }); }
    function rushw(t, t1) { band(t, t1, 400, 700, .08, .06, .5); band(t, t1, 1800, 2600, .03, .03, 1); }
    function clocktick(t, t1) { for (var tt = t; tt < t1; tt += .5) tickS(tt, .3); }
    function receipt(t, t1) { var n = Math.max(3, Math.floor((t1 - t) / .03)); for (var k = 0; k < n; k++) tickS(t + k * (t1 - t) / n, .07); band(t, t1, 2600, 3200, .02, .02, 3); }
    function register(t) { tickS(t, .4); [88, 93].forEach(function (m, j) { osc('triangle', mtof(m), t + j * .08, t + .9, 1, [[t + j * .08, 0], [t + j * .08 + .005, .07], [t + .85, 0]], .4); }); }
    function fridgedoor(t) { band(t, t + .25, 400, 200, .1, .02, 1); osc('sine', 120, t + .3, t + 1.0, 1, [[t + .3, .03], [t + 1.0, 0]], .05); }
    function flies(t, t1) { [0, 1].forEach(function (j) { var o = osc('sawtooth', 210 + j * 23, t, t1, 1, [[t, 0], [t + .3, .012], [t1 - .2, .012], [t1, 0]], .1, j ? .4 : -.4); var lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 3 + j; lg.gain.value = 30; lfo.connect(lg); lg.connect(o.frequency); lfo.start(Math.max(0, t)); lfo.stop(t1); }); }
    function gulp(t) { var o = osc('sine', 500, t, t + .2, 1, [[t, 0], [t + .01, .1], [t + .18, 0]], .1); o.frequency.exponentialRampToValueAtTime(180, t + .15); }
    function tickbox(t) { popS(t, .7); tickS(t + .05, .3); }
    function shutter(t) { tickS(t, .5); band(t, t + .08, 2000, 1200, .15, .02, 2); tickS(t + .07, .35); }
    function waves(t, t1) { for (var tt = t; tt < t1; tt += 3.2) band(tt, Math.min(t1, tt + 2.6), 500, 1600, .03, .01, .5, (rnd() - .5) * .6); }
    function projector(t, t1) { for (var tt = t; tt < t1; tt += 1 / 12) tickS(tt, .05); }
    var MAP = { tick: function (e) { tickS(e.t, e.g); }, blip: function (e) { blip(e.t, e.f, e.g); }, ding: function (e) { ding(e.t); }, ding1: function (e) { ding1(e.t, e.f); }, thump: function (e) { thump(e.t, e.g); }, swish: function (e) { swish(e.t); }, whoosh: function (e) { whoosh(e.t); }, stamp: function (e) { stampS(e.t, e.big, e.small); }, paper: function (e) { paper(e.t, e.g); }, flip: function (e) { flip(e.t, e.g); }, pop: function (e) { popS(e.t, e.g); }, click: function (e) { click(e.t); }, rise: function (e) { rise(e.t, e.t1); }, zip: function (e) { zip(e.t, e.t1); }, buzzbad: function (e) { buzzbad(e.t); }, splash: function (e) { splash(e.t); }, glitch: function (e) { glitch(e.t, e.t1); }, powerdown: function (e) { powerdown(e.t); }, rush: function (e) { rush(e.t, e.t1); }, boom: function (e) { boom(e.t); }, fall: function (e) { fall(e.t, e.t1); },
      aah: function (e) { aah(e.t, e.t1); }, choo: function (e) { choo(e.t); }, zap: function (e) { zap(e.t, e.t1); }, 'static': function (e) { staticS(e.t, e.t1); }, shimmer: function (e) { shimmer(e.t, e.t1); }, clunk: function (e) { clunk(e.t); }, boing: function (e) { boing(e.t); }, dingdong: function (e) { dingdong(e.t); }, slam: function (e) { slam(e.t); }, morse: function (e) { morse(e.t, e.t1); }, engine: function (e) { engine(e.t, e.t1); }, hum: function (e) { hum(e.t, e.t1); }, rushw: function (e) { rushw(e.t, e.t1); }, clocktick: function (e) { clocktick(e.t, e.t1); }, receipt: function (e) { receipt(e.t, e.t1); }, register: function (e) { register(e.t); }, fridgedoor: function (e) { fridgedoor(e.t); }, flies: function (e) { flies(e.t, e.t1); }, gulp: function (e) { gulp(e.t); }, tickbox: function (e) { tickbox(e.t); }, shutter: function (e) { shutter(e.t); }, waves: function (e) { waves(e.t, e.t1); }, projector: function (e) { projector(e.t, e.t1); } };
    EV.forEach(function (e) { if (MAP[e.type]) MAP[e.type](e); });
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −50 dB, so the gaps are never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5; var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .021; })();
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 84px Archivo', '800 46px Archivo', '700 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"', 'italic 400 96px "Instrument Serif"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×÷−≈≠µ“”·→…✓✕▶←'); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  initTimes();
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: end('title') + .3, SLUG: 'solar', SHOTS: SHOTS, CHAPTERS: CHAPTERS, thumb: function () { thumb(ctx); }, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
