/* "Stadium": the whole history of Nvidia. Long-form episode 3 of Tech, explained, the first "whole history".
   A stickman history written in code and cut to the voice: every beat keys to a word time from vo/vo.js
   (window.VO, written by tools/voiceover.py) through at(id, word). Every frame is a pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Built on the episode 2 rig (src/a-c are shared with film/solar), plus:
   - seven parts under slam-shut part cards, with planted callbacks (Denny's, toilets, 30 days, the $12 share)
   - the stadium of kids: a GPU drawn as thousands of tiny workers doing one sum each
   - a graphics-card prop, chips with faces, stock charts drawn as they're spoken
   - one quotable line per part, built from paper words
   Every number is sourced in BRIEF.md. */
(function () {
  'use strict';
  /* per-frame layout state: a quote is on screen (the parked part tag steps aside); text inside a card fits its width */
  var QUOTE_ON = false, CARDW = 0;
  /* a rolling count that only shows round steps, landing on the real value (no exact-looking in-between figures) */
  function roll(v, to, step) { return v >= to - 1e-6 ? to : Math.floor(v / step) * step; }
  var W = 1920, H = 1080, VO = window.VO, DUR = VO.dur;
  var INK = '#1c1830', NIGHT = '#221d3a', DUSK = '#352b55', PLUM = '#56406f', MAUVE = '#7a5584';
  var HEAD = '#fbf7ef', HEADS = '#e2dbcc', HOOD = '#ff5b3d', HOODS = '#d6412a';
  var CREAM = '#f4ede0', PAPER = '#f1e9d8', PAPERS = '#e2d6bf', YEL = '#ffc83d', MINT = '#3fd6a2', LIGHT = '#8fe9ff', RED = '#ff4a3d', BLUE = '#3d7bff', GREEN = '#5fb86b', TEAL = '#2a9d8f';
  var NV = '#76b900', NVD = '#4f8a00', NVL = '#b6f05a', SUN = '#ffb52e', SUN2 = '#ff7a1f', SUNHI = '#fff1a8', PLASMA = '#ff8a3d', AUR1 = '#5dffb0', AUR2 = '#b06bff';
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
    o = o || {}; if (o.a != null && o.a <= 0) return 0; font(g, px, o.wt || 800, o.fam, o.wide); ls(g, o.ls || 0);
    var mw = o.maxw || (CARDW && !o.nofit && (o.align || 'center') === 'center' ? CARDW - 2 * Math.abs(x) : 0);
    if (mw > 0) { var w0 = g.measureText(s).width + (o.outline || 0); if (w0 > mw) { px = px * mw / w0; font(g, px, o.wt || 800, o.fam, o.wide); } }
    var ga = g.globalAlpha; if (o.a != null) g.globalAlpha = ga * clamp(o.a, 0, 1);
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
    if (o.outline) { g.lineWidth = o.outline; g.strokeStyle = o.ocol || INK; g.lineJoin = 'round'; g.strokeText(s, x, y); }
    g.fillStyle = col || CREAM; g.fillText(s, x, y); var w = g.measureText(s).width; ls(g, 0); g.globalAlpha = ga; return w;
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
    if (o.jacket) { g.fillStyle = 'rgba(255,255,255,.10)'; g.beginPath(); g.moveTo(-34, -116); g.lineTo(-6, -40); g.lineTo(-46, -60); g.closePath(); g.fill(); g.beginPath(); g.moveTo(34, -116); g.lineTo(6, -40); g.lineTo(46, -60); g.closePath(); g.fill(); g.fillStyle = o.shirt || '#2b2733'; g.beginPath(); g.moveTo(-16, -120); g.lineTo(0, -48); g.lineTo(16, -120); g.closePath(); g.fill(); g.strokeStyle = '#c9c6d6'; g.lineWidth = 3; g.beginPath(); g.moveTo(8, -46); g.lineTo(12, 4); g.stroke(); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(-52, -104, 9, 90); }
    if (o.coat) { g.fillStyle = o.coat; g.fillRect(-70, -140, 50, 160); g.fillRect(20, -140, 50, 160); g.fillStyle = '#f4ede0'; g.beginPath(); g.moveTo(-20, -118); g.lineTo(0, -60); g.lineTo(20, -118); g.closePath(); g.fill(); }
    g.restore();
    fillStroke(g, null, 5);
    if (!o.coat && !o.jacket) { g.beginPath(); g.moveTo(-28, -50); g.lineTo(28, -50); g.lineTo(22, -18); g.lineTo(-22, -18); g.closePath(); fillStroke(g, sh, 4); }
    if (o.tie) { g.beginPath(); g.moveTo(0, -116); g.lineTo(-9, -96); g.lineTo(0, -50); g.lineTo(9, -96); g.closePath(); fillStroke(g, o.tie, 3.5); }
    else if (!o.coat && !o.jacket) { g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-9, -110); g.lineTo(-11, -84); g.moveTo(9, -110); g.lineTo(11, -84); g.stroke(); }
    if (!o.coat && !o.jacket) { g.beginPath(); g.ellipse(0, -117 - br * .4, 32, 12, 0, 0, 6.283); fillStroke(g, sh, 4.5); }
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
    hair(g, o, bt);
    face(g, P, t, seed, o);
    if (o.beard) { g.beginPath(); g.arc(0, 4, 54, Math.PI * .08, Math.PI * .92); g.quadraticCurveTo(0, 30, 54 * Math.cos(Math.PI * .08), 4 + 54 * Math.sin(Math.PI * .08)); g.closePath(); fillStroke(g, o.beard, 4); g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.moveTo(-10, 28); g.lineTo(10, 28); g.stroke(); }
    hat(g, o);
    if (o.glasses) { g.strokeStyle = INK; g.lineWidth = 4; circ(g, -20, -4, 15); g.stroke(); circ(g, 20, -4, 15); g.stroke(); g.beginPath(); g.moveTo(-5, -5); g.lineTo(5, -5); g.stroke(); }
    if (o.sunglasses) { g.beginPath(); g.roundRect(-40, -18, 34, 24, 8); g.roundRect(6, -18, 34, 24, 8); fillStroke(g, INK, 3); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-34, -14, 8, 6); g.fillRect(12, -14, 8, 6); }
    if (P.sweat) { var sk = (t * 1.4) % 1; g.save(); g.globalAlpha = 1 - sk; g.translate(48, -22 + sk * 30); g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(10, 4, 0, 8); g.quadraticCurveTo(-10, 4, 0, -12); fillStroke(g, '#9fe0ff', 3); g.restore(); }
    g.restore();
    if (P.front) arms();
    g.restore();
  }
  /* hair: spiky (Jensen), grey (side tufts, bald top), cap (short, any colour), long (a fringe and sides) */
  function hair(g, o, bt) {
    var hc = o.hairCol || '#2a2731';
    if (o.hair === 'spiky') {
      g.beginPath(); g.moveTo(-56, -4);
      for (var i = 0; i <= 9; i++) { var a = Math.PI * (1.02 + i * .107), r = i % 2 ? 76 + (i === 5 ? 6 : 0) : 54; g.lineTo(Math.cos(a) * r, Math.sin(a) * r - 4); }
      g.lineTo(56, -4); g.quadraticCurveTo(34, -50, 0, -42); g.quadraticCurveTo(-34, -50, -56, -4); g.closePath(); fillStroke(g, hc, 4.5);
      g.strokeStyle = 'rgba(220,220,235,.45)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-30, -44); g.lineTo(-14, -64); g.moveTo(16, -46); g.lineTo(30, -62); g.stroke();
    } else if (o.hair === 'grey') {
      [-1, 1].forEach(function (sd) { g.beginPath(); g.ellipse(sd * 50, -14, 14, 24, sd * .2, 0, 6.283); fillStroke(g, o.hairCol || '#d9d6df', 4); });
    } else if (o.hair === 'cap') {
      g.beginPath(); g.arc(0, 0, 57, Math.PI * 1.02, -.02); g.quadraticCurveTo(30, -48, 0, -40); g.quadraticCurveTo(-30, -48, -57, -2); g.closePath(); fillStroke(g, hc, 4.5);
    } else if (o.hair === 'long') {
      g.beginPath(); g.arc(0, 0, 60, Math.PI * .95, Math.PI * 2.05); g.lineTo(58, 30); g.lineTo(46, 30); g.quadraticCurveTo(30, -30, -10, -36); g.quadraticCurveTo(-40, -20, -46, 30); g.lineTo(-58, 30); g.closePath(); fillStroke(g, hc, 4.5);
    }
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
  /* the cast: one costume cue each */
  var YOU = { col: HOOD, shade: HOODS, seed: 1 };
  var JEN = { col: '#26232d', shade: '#18161d', jacket: true, hair: 'spiky', legs: '#2b2833', seed: 2 };
  var KID = { col: '#2a9d8f', shade: '#1f7a6f', hair: 'cap', seed: 12 };
  var CHRIS = { col: '#3d7bff', shade: '#2f5fc4', hair: 'cap', hairCol: '#5a4636', beard: '#5a4636', seed: 4 };
  var CURT = { col: '#c96f2a', shade: '#a65a20', hair: 'cap', hairCol: '#8a7a6a', glasses: true, seed: 5 };
  var VAL = { col: '#3b3448', shade: '#2b2533', coat: '#3b3448', tie: RED, hair: 'grey', seed: 6, legs: '#2b2533' };
  var BOSS = { col: '#5a5470', shade: '#47425a', tie: '#ffc83d', hair: 'grey', hairCol: '#9a96a6', glasses: true, seed: 8 };
  var SEGA = { col: '#2f4fa8', shade: '#233c82', coat: '#2f4fa8', tie: CREAM, hair: 'cap', hairCol: '#1e1c24', glasses: true, seed: 9, legs: '#233c82' };
  var BUCK = { col: '#8c1d40', shade: '#6d1531', hair: 'cap', hairCol: '#3a2a20', glasses: true, seed: 10 };
  var ALEX = { col: '#5fb86b', shade: '#479452', hair: 'cap', hairCol: '#4a3a2c', seed: 11 };
  var ILYA = { col: '#6b6f80', shade: '#555866', hair: 'grey', hairCol: '#4a3f38', seed: 13 };
  var HINT = { col: '#b07a4a', shade: '#8f6239', hair: 'grey', glasses: true, seed: 14 };
  var SUIT = { col: '#4a4560', shade: '#3a3650', coat: '#4a4560', tie: RED, hair: 'cap', hairCol: '#2a2430', seed: 15, legs: '#3a3650' };
  var MINER = { col: '#7a5584', shade: '#5f4168', hat: 'hard', seed: 16 };
  var COOK = { col: CREAM, shade: '#d8cfbd', hat: 'beanie', capCol: CREAM, seed: 17 };

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
          if (out > 0) QUOTE_ON = true;
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
    lines.forEach(function (l, i) { txt(g, l, 0, (i - (lines.length - 1) / 2) * (o.lh || 70), o.px || 54, INK, { wt: 900, wide: i > 0, maxw: w * .85 }); });
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
      var hc = o.shirt || ['#ff5b3d', '#3d7bff', '#ffc83d', '#5fb86b', '#b06bff', '#2a9d8f'][Math.floor(hash(i * 1.7) * 6)];
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
    txt(g, top, 0, -124, 46, '#fff', { wt: 900, wide: true, maxw: 260 });
    txt(g, big, 0, 20, o.px || 130, INK, { wt: 900, wide: true, maxw: 260 });
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
    g.save(); g.translate(1380, 230); g.rotate(.03); rr(g, -150, -50, 300, 100, 18); fillStroke(g, '#ffd23d', 6); txt(g, "DENNY'S", 0, 4, 52, RED, { wt: 900, wide: true, maxw: 260 }); g.restore();
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
    recreated(g, 1250, 700);
    var P = poseAt(t, [[s.t0, { lh: [-40, -170], rh: [70, -170], look: [.3, -.5], mouth: 'smile', lean: .05, front: 1 }], [tT, { lh: [-20, -180], rh: [60, -186] }], [tE, { rh: [80, -200], mouth: 'grin', eyes: 'happy' }], [t2, { look: [.2, -.8], eyes: 'wide', mouth: 'o' }]]);
    guy(g, 600, 1040, 1.15, P, YOU, t);
    /* frame 0 already names the company: the chip that will answer, glowing on the desk */
    var zk = 1 - seg(t, t2 - .4, t2);
    if (zk > 0) { g.save(); g.globalAlpha *= zk; glow(g, 1560, 640, 260, 'rgba(182,240,90,.5)', 1); chipD(g, 1560, 640, .95, t, { face: 'grin', glow: 1, label: 'NVIDIA' }); g.restore(); tag(g, '$5 TRILLION', 1560, 440, zk, { px: 50, rot: -.06 }); }
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
      var on = pop(t, tB - .3 + (9 - d) * .07, 3, .7);
      g.save(); g.globalAlpha = Math.max(.22, clamp(on, 0, 1)); rack(g, x, y + (1 - clamp(on, 0, 1)) * 40, w, h, t + d, { seed: d * 3 + side }); g.restore();
    }
    /* the question arrives first: a glowing packet racing down the aisle before the hall lights up */
    var qk = seg(t, s.t0, tB + .3);
    if (qk > 0 && qk < 1) { var qe = eio(qk), qx = lerp(960, vx, qe), qy = lerp(980, vy + 20, qe), qr = lerp(70, 10, qe); for (var tr = 0; tr < 6; tr++) { var te = eio(clamp(qk - tr * .03, 0, 1)); circ(g, lerp(960, vx, te), lerp(980, vy + 20, te), lerp(70, 10, te) * (1 - tr * .14)); g.fillStyle = 'rgba(182,240,90,' + (.5 - tr * .08) + ')'; g.fill(); } circ(g, qx, qy, qr); fillStroke(g, NVL, 5); txt(g, '?', qx, qy + qr * .1, qr * 1.3, INK, { wt: 900 }); }
    /* the math: little sums lifting off every rack */
    if (t > tM - .2) {
      var r = mulberry(5);
      for (var i = 0; i < 70; i++) { var ph = (t * .5 + r()) % 1, sx = 200 + r() * 1520, sy = 900 - ph * 700, sym = ['+', '×', '2+3', '7×8', '=', '0.4×1.7', '+1'][i % 7]; g.save(); g.globalAlpha = Math.sin(ph * Math.PI) * clamp(seg(t, tM - .2, tM + .5), 0, 1) * .9; txt(g, sym, sx, sy, 26 + r() * 20, NVL, { fam: MONO, wt: 700 }); g.restore(); }
    }
    g.restore();
    chip(g, 'A BUILDING FULL OF CHIPS', 960, 150, { px: 56, bg: CREAM, s: pop(t, tC - .2), rot: -.02, wide: true });
    chip(g, 'ALL AT THE SAME TIME', 960, 800, { px: 48, bg: NVL, s: pop(t, tS - .15), rot: .02, wide: true });
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
    card(g, 1080, 520, 420, 480, -.04, clamp(pk, 0, 1), function (g, w, h) { g.fillStyle = '#f0d9b0'; g.fillRect(-w / 2 + 20, -h / 2 + 20, w - 40, h - 140); rr(g, -150, -140, 300, 80, 14); fillStroke(g, '#ffd23d', 5); txt(g, "DENNY'S", 0, -98, 50, RED, { wt: 900, wide: true, maxw: 260 }); mug(g, -80, 60, 1.2, t, true); plate(g, 70, 70, 1); txt(g, '1992', 0, h / 2 - 60, 50, INK, { wt: 900, wide: true }); });
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
      var x = 120 + (i % 9) * 210 + (r() - .5) * 40, y = 760 + Math.floor(i / 9) * 110 + r() * 20, k = pop(t, Math.min(t13, s.t0 + .3) + i * .09, 3, .6), sc = .7 + r() * .25;
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
    var lon = lerp(105, -95, k);
    var P = earth(g, 960, 1260, 820, t, { lon: lon, lat: 30, light: 1, lights: false });
    /* the flight path: Bangkok to Seattle, drawn on the globe */
    var pts = []; for (var i = 0; i <= 30; i++) { var u = i / 30; pts.push(P(lerp(100.5, -122.3, u), lerp(13.7, 47.6, u) + Math.sin(u * Math.PI) * 14)); }
    g.save(); g.setLineDash([16, 14]); g.strokeStyle = CREAM; g.lineWidth = 6; g.beginPath(); var first = true; pts.forEach(function (p, j) { if (p[2] <= 0 || j / 30 > k + .02) return; if (first) { g.moveTo(p[0], p[1]); first = false; } else g.lineTo(p[0], p[1]); }); g.stroke(); g.restore();
    var head = pts[Math.min(30, Math.round(k * 30))];
    /* the plane, with a small face at the window */
    g.save(); g.translate(head[0], head[1] - 60); g.rotate(-.06 + Math.sin(t * 2) * .03); g.scale(1.2, 1.2);
    g.beginPath(); g.ellipse(0, 0, 130, 30, 0, 0, 6.283); fillStroke(g, CREAM, 6); g.beginPath(); g.moveTo(-20, 0); g.lineTo(-70, 80); g.lineTo(-30, 80); g.lineTo(30, 0); g.closePath(); fillStroke(g, '#d8cfbd', 5); g.beginPath(); g.moveTo(-100, -10); g.lineTo(-130, -60); g.lineTo(-104, -60); g.lineTo(-70, -10); g.closePath(); fillStroke(g, RED, 5);
    for (i = 0; i < 5; i++) { circ(g, -40 + i * 30, -4, 9); fillStroke(g, i === 2 ? '#fbf7ef' : '#9ed4f5', 3); }
    g.fillStyle = INK; circ(g, 17, -6, 2.4); g.fill(); circ(g, 23, -6, 2.4); g.fill();
    g.restore();
    chip(g, 'THAILAND', P(100.5, 13.7)[0], P(100.5, 13.7)[1] + 70, { px: 40, bg: CREAM, s: pop(t, s.t0 + .3) * (P(100.5, 13.7)[2] > 0 ? 1 : 0) });
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
      chip(g, 'KENTUCKY', 1390, 380, { px: 44, bg: CREAM, s: pop(t, tA) * (1 - seg(t, tE - .3, tE - .1)), rot: .02, wide: true });
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
    guy(g, 1180, 900, 1.35, big, { col: '#e6dfcf', shade: '#c4bca9', hair: 'cap', hairCol: '#1e1c22', seed: 21, hold: [t > tTe && !lifting ? book : null, null] }, t);
    /* tattoos on the big guy's arms, as little marks */
    if (t > tTa - .1) { var tk2 = seg(t, tTa - .1, tTa + .6); g.save(); g.globalAlpha = tk2; [[1110, 610], [1240, 600], [1200, 650]].forEach(function (p, i) { g.save(); g.translate(p[0], p[1]); g.rotate(i); g.strokeStyle = '#2a5a9a'; g.lineWidth = 4; g.beginPath(); g.moveTo(-12, 0); g.lineTo(0, -12); g.lineTo(12, 0); g.lineTo(0, 12); g.closePath(); g.stroke(); g.restore(); }); g.restore(); }
    var kid = poseAt(t, [[s.t0, { lh: [-60, -130], rh: [60, -130], look: [.6, -.5], mouth: 'o', eyes: 'wide' }], [tTe - .3, { rh: [110, -220], look: [.6, -.3], mouth: 'talk', eyes: 'dot' }], [tB - .3, { lh: [-110, -280], rh: [110, -280], mouth: 'wavy', brow: -1, sweat: 1, look: [0, -.4] }]]);
    var bar = lifting ? (Math.sin(t * 5) * 10) : 0; kid.lh = [kid.lh[0], kid.lh[1] + bar]; kid.rh = [kid.rh[0], kid.rh[1] + bar];
    guy(g, 640, 900, .9, kid, Object.assign({}, KID, { hold: [null, t > tTe - .3 && !lifting ? book : null] }), t);
    if (lifting) { var by = 900 - (280 + 150) * .9 + bar * .9 - 20; g.strokeStyle = INK; g.lineWidth = 14; g.beginPath(); g.moveTo(480, by); g.lineTo(800, by); g.stroke(); g.strokeStyle = '#c9c6d6'; g.lineWidth = 6; g.stroke(); [480, 800].forEach(function (x) { rr(g, x - 26, by - 60, 52, 120, 10); fillStroke(g, '#3a3647', 5); }); }
    g.restore();
    chip(g, '17', 1180, 200, { px: 70, bg: CREAM, s: pop(t, t17 - .1) * (1 - seg(t, tB - .4, tB - .15)), rot: -.04, wide: true });
    chip(g, 'TATTOOS', 1480, 250, { px: 46, bg: CREAM, s: pop(t, tTa - .1) * (1 - seg(t, tB - .4, tB - .15)), rot: .04, wide: true });
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
    g.save(); g.translate(1500, 330); g.rotate(.02); rr(g, -190, -60, 380, 120, 22); fillStroke(g, '#ffd23d', 7); txt(g, "DENNY'S", 0, 6, 66, RED, { wt: 900, wide: true, maxw: 330 }); g.restore();
    chip(g, 'OREGON · AGE 15', 1500, 460, { px: 40, bg: CREAM, s: pop(t, at('b6', 'oregon.') - .1), rot: -.02 });
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
    guy(g, gxS, 920, 1.0, P, Object.assign({}, KID, { col: '#e0a93a', shade: '#b8862a', hair: 'spiky', hairCol: INK, hold: [null, job === 1 ? tray : job === 2 ? pad : null] }), t);
    if (job === 2) { /* a customer at the counter */ guy(g, 1580, 920, 1.0, poseAt(t, [[s.t0, { look: [-.6, 0], mouth: 'smile', lh: [-60, -150], rh: [50, -200] }]]), { col: BLUE, shade: '#2f5fc4', seed: 31, hair: 'cap', hairCol: '#6a4a3a', hold: [null, function (g) { mug(g, 0, 0, .6, t, true); }] }, t); }
    g.restore();
    ['WASHING DISHES', 'BUSSING TABLES', 'WAITING TABLES'].forEach(function (l, i) { var tt = [tW, tB, tWa][i]; chip(g, l, 360 + i * 600, 200, { px: 42, bg: i === job ? YEL : CREAM, s: pop(t, tt - .15), rot: (i - 1) * .03, wide: true, a: i <= job ? 1 : 0 }); });
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
    chip(g, 'SILICON VALLEY', 1350, 270, { px: 56, bg: YEL, s: pop(t, at('b8', 'silicon') - .15), rot: .03, wide: true });
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
    chip(g, 'JENSEN HUANG', 960, 330, { px: 34, bg: YEL, s: pop(t, s.t0 + .3), rot: .01 });
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
    bigNum(g, '$' + roll(40000 * eo(ck), 40000, 5000).toLocaleString('en-US'), 1260, 380, 120, NVL, pop(t, t40 - .3));
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
      for (var i = 0; i < 4; i++) { var k = pop(t, Math.min(tNV - .3, s.t0 + .2) + i * .15, 3, .6); if (k <= 0) continue; g.save(); g.globalAlpha = a; g.translate(420 + i * 110, 560 + i * 26); g.rotate(-.1 + i * .05); g.scale(clamp(k, 0, 1.05), clamp(k, 0, 1.05)); g.beginPath(); g.moveTo(-160, -110); g.lineTo(-60, -110); g.lineTo(-40, -130); g.lineTo(40, -130); g.lineTo(60, -110); g.lineTo(160, -110); g.lineTo(160, 120); g.lineTo(-160, 120); g.closePath(); fillStroke(g, '#e8c66a', 5); txt(g, 'NV' + (i ? ' v' + (i + 1) : ''), 0, 10, 60, INK, { wt: 900, wide: true }); g.restore(); }
      chip(g, 'WHAT DO WE CALL IT?', 960, 160, { px: 50, bg: CREAM, s: pop(t, s.t0 + .1) * a, rot: -.02, wide: true });
      g.save(); g.globalAlpha = a; chip(g, 'NV = NEXT VERSION', 1340, 520, { px: 60, bg: YEL, s: pop(t, tNx - .1), rot: .03, wide: true }); g.restore();
    }
    if (t > t13 - .1 && t < t14 + .2) {
      var a2 = 1 - seg(t, t14, t14 + .2), sk = pop(t, t13 - .1, 3, .6);
      g.save(); g.globalAlpha = a2; g.translate(700, 480); g.scale(clamp(sk, 0, 1.05), clamp(sk, 0, 1.05)); rr(g, -360, -110, 720, 220, 24); fillStroke(g, '#1a1528', 8); glow(g, 0, 0, 420, 'rgba(182,240,90,.35)', 1); txt(g, 'NVISION', 0, 6, 130, NVL, { wt: 900, wide: true, outline: 10 }); g.restore();
      if (t > tTP - .3) { var tk = pop(t, tTP - .3, 3, .55); g.save(); g.globalAlpha = a2; tpRoll(g, 1400, 640 + (1 - clamp(tk, 0, 1)) * 400, 1.5, t, 'smug'); g.restore(); g.save(); g.globalAlpha = a2; bubble(g, 'TAKEN.', 1480, 330, tk, { px: 70, tail: -.3 }); g.restore(); stamp(g, 'TAKEN', 700, 480, t, tTP + .3, { px: 90, a: a2 }); }
    }
    if (t > t14 - .1) {
      var dk = pop(t, tIn - .3, 2.6, .6), tN = at('b14', 'n'), tV = at('b14', 'v:');
      /* the hunt for a word with an N and a V: two big letters, then the dictionary card lands on them */
      if (dk < 1) [[tN, 'N', 700], [tV, 'V', 1220]].forEach(function (L, i) { var k = pop(t, L[0] - .2, 3, .55); if (k <= 0) return; g.save(); g.globalAlpha = 1 - clamp(dk, 0, 1); g.translate(L[2], 470); g.rotate((i ? .06 : -.06) + knock(t, L[0], 20, 6) * .1); g.scale(clamp(k, 0, 1.06), clamp(k, 0, 1.06)); rr(g, -150, -170, 300, 340, 24); fillStroke(g, i ? NVL : YEL, 8); txt(g, L[1], 0, 10, 260, INK, { wt: 900, wide: true }); g.restore(); });
      chip(g, 'A WORD WITH N + V', 960, 160, { px: 50, bg: CREAM, s: pop(t, start('b14') + .3) * (1 - clamp(dk, 0, 1)), rot: -.02, wide: true });
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
    chip(g, '…WITH A WARNING', 700, 260, { px: 44, bg: YEL, s: pop(t, tWa - .1) * (1 - seg(t, t17 - .4, t17 - .1)), rot: -.02, wide: true });
    if (t > t17 - .2) { g.save(); g.fillStyle = 'rgba(20,6,6,' + .45 * seg(t, t17 - .2, t17 + .2) + ')'; g.fillRect(0, 0, W, H); g.restore(); quote(g, t, 'b17', 360, { px: 84, maxw: 1400, hot: /kill/i, hotCol: RED }); txt(g, 'AS TOLD IN “THE NVIDIA WAY” (TAE KIM, 2024)', 960, 170, 36, CREAM, { fam: MONO, wt: 700, outline: 6 }); }
    vignette(g, .45);
  }
  /* =================================================================== part 2 · thirty days from dead */
  /* 21 · NV1 builds worlds from curves; everyone else picks triangles; Microsoft too */
  function sCurves(g, t, s) {
    var tNV = at('d1', 'nv1,'), tCu = at('d1', 'curves.'), tTr = at('d2', 'triangles.'), tMs = at('d2', 'microsoft'), tD = at('d2', 'dead.');
    g.save(); cam(g, t, s, .06);
    wall(g, '#1d2440', '#121729'); grid(g, 80, 'rgba(120,200,255,.06)');
    dateTag(g, '1995', t, at('d1', '1995,') - .1);
    var mv = eio(seg(t, tCu - .7, tCu - .2));
    chipD(g, lerp(960, 300, mv), lerp(520, 330, mv), lerp(1.7, .8, mv) * clamp(pop(t, Math.min(tNV - .2, s.t0 + .2)), 0, 1.05), t, { label: 'NV1', face: t > tD ? 'x' : mv < 1 ? 'grin' : 'dot', glow: .6 * (1 - mv) });
    chip(g, "NVIDIA'S FIRST CHIP", 960, 200, { px: 50, bg: YEL, s: pop(t, s.t0 + .4) * (1 - mv), rot: -.02, wide: true });
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
    stamp(g, 'MICROSOFT: TRIANGLES', 1360, 330, t, tMs + .2, { px: 30, col: NVL, rot: .06 });
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
    if (qk > 0) { g.save(); g.translate(1060, 300); g.rotate(-.05); g.scale(clamp(qk, 0, 1.05), clamp(qk, 0, 1.05)); rr(g, -300, -100, 600, 200, 10); fillStroke(g, '#dff0d8', 6); txt(g, 'PAY TO: NVIDIA', -100, -50, 30, INK, { fam: MONO, wt: 700 }); txt(g, '$5,000,000', 40, 30, 80, '#2f6b3a', { wt: 900, wide: true, maxw: 460 }); g.restore(); }
    var hk = pop(t, tSi - .3, 2.8, .6);
    if (hk > 0) { g.save(); g.translate(1680, 560); g.scale(clamp(hk, 0, 1.05), clamp(hk, 0, 1.05)); var sand = seg(t, tSi, s.t1);
      g.beginPath(); g.moveTo(-70, -120); g.lineTo(70, -120); g.lineTo(8, 0); g.lineTo(70, 120); g.lineTo(-70, 120); g.lineTo(-8, 0); g.closePath(); fillStroke(g, 'rgba(200,230,255,.35)', 6);
      g.fillStyle = YEL; g.beginPath(); g.moveTo(-60 + sand * 50, -110 + sand * 100); g.lineTo(60 - sand * 50, -110 + sand * 100); g.lineTo(6, -4); g.lineTo(-6, -4); g.closePath(); g.fill(); g.beginPath(); g.moveTo(-60, 112); g.lineTo(60, 112); g.lineTo(60 - (1 - sand) * 50, 112 - sand * 70); g.lineTo(-60 + (1 - sand) * 50, 112 - sand * 70); g.closePath(); g.fill();
      g.restore(); chip(g, '≈ 6 MONTHS', 1680, 760, { px: 44, bg: CREAM, s: hk, rot: .03, wide: true }); }
    g.restore();
    chip(g, 'THE SAME WRONG WAY', 960, 140, { px: 50, bg: RED, fg: '#fff', s: pop(t, at('d3', 'wrong') - .15) * (1 - seg(t, t4 - .3, t4)), rot: -.03, wide: true });
    chip(g, 'SOMETHING WILD', 960, 140, { px: 54, bg: YEL, s: pop(t, tWi - .15) * (1 - seg(t, tFi - .2, tFi)), rot: .02, wide: true });
    chip(g, 'SHOICHIRO IRIMAJIRI · SEGA OF AMERICA', 1300, 150, { px: 32, bg: CREAM, s: pop(t, at('d5', 'shoichiro') - .1), rot: -.01 });
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
    if (t > t8 - .2) { bigNum(g, roll(1000000 * eo(mk), 1000000, 100000).toLocaleString('en-US'), 1260, 400, 140, NVL, pop(t, t8 - .2)); chip(g, 'SOLD IN 4 MONTHS', 1260, 540, { px: 50, bg: YEL, s: pop(t, tF - .1), rot: .02, wide: true }); }
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
    chip(g, 'A BRAND NEW WORD', 1440, 640, { px: 44, bg: CREAM, s: pop(t, tN - .2), rot: -.03, wide: true });
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
    if (t > tTw - .3) { var ck = seg(t, tTw - .2, tTw + .9); bigNum(g, roll(2073600 * eo(ck), 2073600, 250000).toLocaleString('en-US') + ' PIXELS', 960, 110, 76, CREAM, pop(t, tTw - .3)); }
    chip(g, '× 60 EVERY SECOND', 1480, 230, { px: 52, bg: NVL, s: pop(t, tSi - .15), rot: .03, wide: true });
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
    chip(g, 'A FEW BRILLIANT PROFESSORS', 960, 230, { px: 48, bg: CREAM, s: pop(t, tP - .2), rot: -.02, wide: true });
    chip(g, 'ONE PROBLEM AT A TIME', 960, 320, { px: 46, bg: YEL, s: pop(t, tO - .1), rot: .02, wide: true });
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
    stadium(g, 0, 320, cols, rows, cell, t, fill, { shirt: '#3a6a46', pix: function (i, c, rr0) { var u = c / cols, v = rr0 / rows; return 'rgb(' + Math.round(255 * (.6 + .4 * Math.sin(u * 3 + t))) + ',' + Math.round(140 + 100 * v) + ',' + Math.round(90 + 120 * u) + ')'; } });
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
    chip(g, 'ALL AT THE SAME MOMENT', 960, 800, { px: 50, bg: YEL, s: pop(t, tSa - .1) * (1 - seg(t, t6b - .3, t6b)), rot: .02, wide: true });
    chip(g, '2 MILLION KIDS · 1 SUM EACH', 960, 890, { px: 50, bg: NVL, s: pop(t, tTw - .1) * (1 - seg(t, t7 - .3, t7)), rot: -.01, wide: true });
    if (t > t7 - .2) { g.fillStyle = 'rgba(8,6,18,' + (.65 * seg(t, tW - .3, tW + .1)) + ')'; g.fillRect(0, 0, W, H); stamp(g, 'THE STADIUM WINS', 960, 560, t, tW - .1, { px: 100, col: NVL, rot: -.08 }); }
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
      g.save(); g.translate(x, 700); rr(g, -150, -110, 300, 220, 8); fillStroke(g, '#c9a26a', 6); txt(g, '3DFX', 0, -20, 64, INK, { wt: 900, wide: true }); txt(g, 'PATENTS · PEOPLE', 0, 50, 26, INK, { fam: MONO, wt: 700 }); g.restore();
      stamp(g, 'BOUGHT', 1500, 420, t, tRe + .3, { px: 80, col: NVL, rot: -.1 });
      chip(g, 'THE OLD KING, BOUGHT', 960, 160, { px: 50, bg: YEL, s: pop(t, tRe - .1), rot: -.02, wide: true });
      g.restore();
    }
    if (t > t9 - .1) {
      var xk = pop(t, Math.min(tX - .3, t9 + .2), 2.6, .6);
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
    chip(g, 'THE LOGO, AS A TATTOO', 1420, 340, { px: 48, bg: NVL, s: pop(t, tT - .1), rot: .03, wide: true });
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
    stamp(g, 'HIRED · 2004', 880, 320, t, tH + .1, { px: 54, col: NVD });
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
    if (t > tFa - .3) { g.save(); g.translate(1060, 880); g.scale(clamp(pop(t, tFa - .3), 0, 1.05), clamp(pop(t, tFa - .3), 0, 1.05)); rr(g, -150, -20, 300, 30, 6); fillStroke(g, '#9a96a6', 5); g.beginPath(); g.moveTo(-130, -20); g.lineTo(-110, -180); g.lineTo(110, -180); g.lineTo(130, -20); g.closePath(); fillStroke(g, '#3a3647', 5); for (var i = 0; i < 4; i++) { var ph = (t * 1.5 + i * .25) % 1; puff(g, -60 + i * 40, -200 - ph * 90, .25, 'rgba(120,120,130,' + (1 - ph) + ')'); } txt(g, 'FAULTY LAPTOP CHIPS', 0, -220, 30, CREAM, { fam: MONO, wt: 700, outline: 6 }); g.restore(); }
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
    if (t > t9 - .2) quote(g, t, 'c9', 220, { px: 64, maxw: 1300, hot: /market|yet/i });
    g.restore();
    chip(g, 'KEEPS PAYING ANYWAY', 1030, 900, { px: 44, bg: YEL, s: pop(t, tK - .1) * (1 - seg(t, t9 - .3, t9)), rot: -.02, wide: true });
    vignette(g, .4);
  }
  /* =================================================================== part 5 · two cards */
  /* 37 · 2012, a student's parents' house; three people want a computer to recognise pictures */
  function sHouse(g, t, s) {
    var tHo = at('a1', 'house.'), t2 = start('a2'), tAl = at('a2', 'alex'), tIl = at('a2', 'ilya'), tGe = at('a2', 'geoffrey'), tPi = at('a2', 'pictures.');
    var inK = eio(seg(t, t2 - .5, t2 + .3));
    g.save(); cam(g, t, s, .06);
    if (inK < 1) {
      g.save(); g.globalAlpha = 1 - inK; var z = lerp(1, 3.2, inK); g.translate(960, 640); g.scale(z, z); g.translate(-960, -640);
      sky(g, t, '#101a3a', '#2a2350', { stars: 1 }); floorAt(g, 820, '#1d2a22');
      house(g, 960, 820, 2.4, .5 + .5 * Math.sin(t * 3) * .2 + .5, '#5a6b90');
      chip(g, "A STUDENT'S PARENTS' HOUSE", 960, 180, { px: 46, bg: CREAM, s: pop(t, tHo - .3), rot: -.02, wide: true });
      g.restore();
    }
    if (inK > 0) {
      g.save(); g.globalAlpha = inK;
      wall(g, '#4a3a5a', '#2f2540'); floorAt(g, 880, '#5a3f30');
      rr(g, 1500, 150, 300, 220, 10); fillStroke(g, '#101a3a', 6); circ(g, 1720, 210, 26); g.fillStyle = '#f6efd8'; g.fill();
      rr(g, 380, 720, 1160, 36, 8); fillStroke(g, '#8a5a3c', 6);
      monitor(g, 960, 520, 440, 260, function (g, w, h) { var k = Math.floor(t * 1.6) % 3; txt(g, ['CAT?', 'CAR?', 'DOG?'][k], 0, 0, 70, NVL, { fam: MONO, wt: 700 }); });
      ['🐱', '🚗', '🐶'].forEach(function (e, i) { var k = seg(t, tPi - .4 + i * .15, tPi + .8 + i * .15); if (k <= 0 || k >= 1) return; var x = lerp(200 + i * 60, 900, eio(k)), y = lerp(260 + i * 120, 500, eio(k)); card(g, x, y, 160 * (1 - k * .5), 120 * (1 - k * .5), (i - 1) * .2, 1 - seg(k, .8, 1), function (g, w) { txt(g, ['CAT', 'CAR', 'DOG'][i], 0, 4, w * .26, INK, { wt: 900 }); }); });
      var cast = [[480, ALEX, tAl, 'ALEX KRIZHEVSKY'], [1440, ILYA, tIl, 'ILYA SUTSKEVER'], [960, HINT, tGe, 'GEOFFREY HINTON']];
      cast.forEach(function (c, i) {
        var k = pop(t, c[2] - .2, 3, .6); if (k <= 0) return;
        var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [80, -200], look: [i === 0 ? .6 : i === 1 ? -.6 : 0, -.3], mouth: 'smile', eyes: 'dot' }], [tPi, { rh: [130, -280], mouth: 'grin', eyes: 'happy' }]]);
        g.save(); g.globalAlpha *= clamp(k, 0, 1); guy(g, c[0], i === 2 ? 1000 : 960, i === 2 ? .95 : 1.05, P, c[1], t); g.restore();
        chip(g, c[3], c[0], i === 2 ? 340 : 520, { px: 34, bg: CREAM, s: k, fam: MONO, wt: 700 });
      });
      /* picture cards flying at the screen */
      g.restore();
    }
    g.restore();
    dateTag(g, '2012', t, at('a1', '2012,') - .1);
    vignette(g, .4);
  }
  /* 38 · two gaming cards, about a week; the biggest image contest, won by a mile */
  function sTrain(g, t, s) {
    var tTw = at('a3', 'two'), tWe = at('a3', 'week.'), t4 = start('a4'), tMi = at('a4', 'mile:'), t15 = at('a4', '15'), t26 = at('a4', '26');
    g.save(); cam(g, t, s, .06);
    wall(g, '#2a2236', '#1a1524'); grid(g, 90);
    if (t < t4 + .3) {
      var a = 1 - seg(t, t4, t4 + .3); g.save(); g.globalAlpha = a;
      [0, 1].forEach(function (i) { var k = pop(t, tTw - .3 + i * .15, 2.8, .6); if (k > 0) gpuCard(g, 620 + i * 680, 470, .95 * clamp(k, 0, 1.05), t, { label: 'GTX 580', glow: .4 + .2 * Math.sin(t * 6 + i), heat: seg(t, tTw, tWe + .5), fans: 2, spin: 1 }); });
      for (var i = 0; i < 8; i++) { var ph = (t * .7 + i * .125) % 1; puff(g, 620 + (i % 2) * 680 + Math.sin(i * 3 + t) * 60, 300 - ph * 220, .35 + ph * .3, 'rgba(255,255,255,' + (.25 * (1 - ph)) + ')'); }
      calendar(g, 960, 820, .7 * clamp(pop(t, tWe - .3), 0, 1.05), 'TRAINING', String(1 + Math.floor(clamp(seg(t, tWe - .3, Math.max(tWe + .6, t4 - 1.3)), 0, 1) * 5)), { px: 110, sub: 'DAYS', rot: -.03 });
      chip(g, 'TWO GAMING CARDS', 960, 140, { px: 50, bg: NVL, s: pop(t, tTw - .1), rot: -.02, wide: true });
      g.restore();
    }
    if (t > t4 - .1) {
      var b = clamp(seg(t, t4 - .1, t4 + .3), 0, 1); g.save(); g.globalAlpha = b;
      chip(g, 'IMAGENET 2012 · TOP-5 ERROR', 960, 150, { px: 44, bg: CREAM, s: b, fam: MONO, wt: 700 });
      var bars = [['ALEXNET', 15.3, NVL, t15], ['NEXT BEST', 26.2, RED, t26]];
      bars.forEach(function (r, i) {
        var k = eio(seg(t, r[3] - .4, r[3] + .3)), x = 640 + i * 640, h = 16 * r[1] * k;
        rr(g, x - 130, 820 - h, 260, h, 10); fillStroke(g, r[2], 6);
        txt(g, r[0], x, 870, 46, CREAM, { wt: 900, wide: true, outline: 8 });
        if (k > 0) txt(g, (r[1] * k).toFixed(1) + '%', x, 780 - h, 70, CREAM, { wt: 900, wide: true, outline: 10 });
      });
      stamp(g, 'WON BY A MILE', 960, 245, t, tMi, { px: 64, col: NVL, rot: -.06 });
      g.restore();
    }
    g.restore();
    vignette(g, .4);
  }
  /* 39 · same simple sums as coloring pixels; the stadium was built for games, perfect for AI */
  function sSame(g, t, s) {
    var tSu = at('a5', 'sums'), tPx = at('a5', 'pixels.'), tMi = at('a5', 'millions'), t6 = start('a6');
    g.save(); cam(g, t, s, .05);
    wall(g, '#13240c', '#081405'); grid(g, 100, 'rgba(182,240,90,.05)');
    var mk = eio(seg(t, tMi - .3, tMi + 1.0));
    /* a stadium of kids, each holding one coloured card: together the cards make a cat, the question a neural network answers */
    function catPix(c, r) {
      var x = c * 56 + (r % 2) * 28, y = r * 46, d = function (ax, ay) { return Math.hypot(x - ax, y - ay); };
      if (d(510, 270) < 34 || d(666, 270) < 34) return INK;
      if (d(588, 340) < 24) return '#ff8fa3';
      var ear = function (ax) { return y > 40 && y < 190 && Math.abs(x - ax) < (y - 40) * .55; };
      if (d(588, 300) < 200 || ear(450) || ear(726)) return '#f0a04b';
      return '#3a5a8a';
    }
    if (mk < 1) {
      g.save(); g.globalAlpha = 1 - mk;
      stadium(g, 372, 250, 21, 12, 56, t, function (i, c, r) { return seg(t, s.t0 + .3 + (c + r) * .04, s.t0 + .8 + (c + r) * .04); }, { pix: function (i, c, r) { return catPix(c, r); }, pw: .96, ph: .8 });
      chip(g, 'IS THIS A CAT?', 960, 140, { px: 50, bg: CREAM, s: pop(t, s.t0 + .1), rot: -.02, wide: true });
      chip(g, '= THE SAME SIMPLE SUMS AS PIXELS', 960, 870, { px: 44, bg: YEL, s: pop(t, tPx - .2), rot: .02, wide: true });
      g.restore();
    }
    if (mk > 0) {
      g.save(); g.globalAlpha = mk;
      stadium(g, 220, 560, 30, 7, 52, t, function (i) { return hash(i + Math.floor(t * 5)) > .3 ? 1 : 0; }, { pix: function (i) { return hash(i * 2.1) > .5 ? NVL : YEL; } });
      g.restore();
      if (t > t6 - .2) quote(g, t, 'a6', 260, { px: 76, maxw: 1500, hot: /games|ai/i });
    }
    g.restore();
    vignette(g, .4);
  }
  /* 40 · the myth: "just got lucky" — partly true; luck only pays if you're already standing there */
  function sLuck(g, t, s) {
    var tLu = at('a6b', 'lucky'), tPa = at('a6b', 'partly'), tSt = at('a6b', 'standing');
    g.save(); cam(g, t, s, .06);
    wall(g, '#31254a', '#1e1730'); floorAt(g, 880, '#2a2438');
    card(g, 560, 420, 640, 300, -.04, pop(t, s.t0 + .1), function (g) { txt(g, 'YOU MAY HAVE HEARD:', 0, -80, 34, INK, { fam: MONO, wt: 700 }); txt(g, '“NVIDIA JUST', 0, 0, 62, INK, { wt: 900, wide: true }); txt(g, 'GOT LUCKY”', 0, 76, 62, INK, { wt: 900, wide: true }); });
    /* Jensen standing on the X long before the bus labelled AI pulls in */
    var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [60, -150], look: [-.6, 0], mouth: 'flat' }], [tSt, { look: [-.9, -.1], mouth: 'smirk', eyes: 'squint' }]]);
    g.save(); g.lineCap = 'round'; g.strokeStyle = YEL; g.lineWidth = 12; g.beginPath(); g.moveTo(1380, 870); g.lineTo(1500, 910); g.moveTo(1500, 870); g.lineTo(1380, 910); g.stroke(); g.restore();
    guy(g, 1440, 890, 1.05, P, JEN, t);
    var bk = eio(seg(t, tSt - .8, tSt + .4)), bx = lerp(-700, 820, bk);
    g.save(); g.translate(bx, 760); rr(g, -360, -200, 720, 220, 30); fillStroke(g, NVL, 8); for (var i = 0; i < 4; i++) { rr(g, -320 + i * 160, -170, 120, 90, 10); fillStroke(g, '#bfe8ff', 5); } txt(g, 'AI', 0, -30, 70, INK, { wt: 900, wide: true }); [-220, 220].forEach(function (wx) { circ(g, wx, 30, 46); fillStroke(g, INK, 6); circ(g, wx, 30, 18); g.fillStyle = '#c9c6d6'; g.fill(); }); g.restore();
    g.restore();
    chip(g, 'LUCK PAYS IF YOU’RE ALREADY THERE', 960, 140, { px: 44, bg: CREAM, s: pop(t, tSt - .2), rot: -.02, wide: true });
    if (t > tLu && t < tPa) spark(g, 860, 360, t, tLu, .8);
    stamp(g, 'PARTLY TRUE', 800, 290, t, tPa, { px: 54, col: YEL, rot: .08 });
    vignette(g, .4);
  }
  /* 41 · 2016: the first DGX-1, hand-delivered to a small lab called OpenAI, and signed */
  function sDGX(g, t, s) {
    var tA = at('a7', 'all'), tD = at('a7', 'dgx1,'), tO = at('a7', 'openai.'), t8 = start('a8'), tFu = at('a8', 'future'), t9 = start('a9'), tIl = at('a9', 'ilya'), tSt = at('a9', 'students');
    g.save(); cam(g, t, s, .06);
    wall(g, '#2f3a4a', '#1e2733'); floorAt(g, 880, '#3a3044');
    /* the lab door */
    rr(g, 1440, 360, 300, 520, 10); fillStroke(g, '#5a6d80', 7); chip(g, 'OPENAI', 1590, 330, { px: 36, bg: CREAM, fam: MONO, wt: 700, s: pop(t, tO - .3) }); circ(g, 1470, 640, 10); g.fillStyle = YEL; g.fill();
    var wk = seg(t, tA, tO), x = lerp(640, 1100, eio(wk));
    var P = poseAt(t, [[s.t0, { lh: [-110, -240], rh: [110, -240], look: [.6, 0], mouth: 'grin' }], [t8, { lh: [-60, -150], rh: [150, -230], look: [.4, .3], mouth: 'smile', eyes: 'squint' }]]);
    if (wk > 0 && wk < 1) { P.lf = [-26 + Math.sin(t * 12) * 20, 0]; P.rf = [26 - Math.sin(t * 12) * 20, 0]; }
    if (t > t8) P = Object.assign({}, P);
    guy(g, x, 920, 1.1, P, t > t8 ? Object.assign({}, JEN, { hold: [null, marker] }) : JEN, t);
    var bx = t < t8 ? x : 1160, by = t < t8 ? 690 : 760;
    g.save(); g.translate(bx, by); rr(g, -170, -120, 340, 240, 12); fillStroke(g, '#2c2936', 7); for (var i = 0; i < 4; i++) { rr(g, -150, -100 + i * 52, 300, 40, 6); fillStroke(g, '#3a3647', 3); g.fillStyle = NVL; for (var j = 0; j < 5; j++) { circ(g, -130 + j * 18, -80 + i * 52, 4); g.fill(); } } txt(g, 'DGX-1', 70, -80, 30, NVL, { fam: MONO, wt: 700 });
    if (t > tFu - .3) { g.save(); g.rotate(-.06); var sig = 'to the future of computing and humanity', n = Math.floor(clamp(seg(t, tFu - .3, end('a8') + .2), 0, 1) * sig.length); font(g, 26, 400, SERIF); g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(sig.slice(0, n), 0, 60); g.restore(); }
    g.restore();
    /* the inscription, big enough to read */
    if (t > tFu - .1 && t < t9 + .1) chip(g, '“TO THE FUTURE OF COMPUTING AND HUMANITY”', 900, 140, { px: 44, bg: CREAM, s: pop(t, tFu) * (1 - seg(t, t9 - .3, t9)), rot: -.02, fam: SERIF, wt: 700 });
    if (t > t9 - .1) {
      var Q = poseAt(t, [[t9, { lh: [-60, -150], rh: [-130, -240], look: [-.6, 0], mouth: 'smile', eyes: 'happy' }]]);
      var ik = eio(seg(t, t9 - .1, tIl + .2)); guy(g, lerp(1590, 1560, ik), 900, 1.0 * ik, Q, ILYA, t);
      chip(g, 'CO-FOUNDER: ILYA SUTSKEVER', 1380, 220, { px: 36, bg: YEL, s: pop(t, tIl - .1), rot: .02 });
      sticky(g, ["FROM THE", "STUDENT'S", "HOUSE"], 420, 340, pop(t, tSt - .2), -.06, { px: 46, lh: 56 });
    }
    g.restore();
    dateTag(g, 'AUG 2016', t, at('a7', '2016,') - .1);
    chip(g, 'ALL IN', 700, 220, { px: 56, bg: NVL, s: pop(t, tA - .1) * (1 - seg(t, t9 - .3, t9)), rot: -.04, wide: true });
    chip(g, 'THE FIRST DGX-1', 960, 140, { px: 44, bg: CREAM, s: pop(t, tD - .1) * (1 - seg(t, t8 - .2, t8)), rot: .02, wide: true });
    vignette(g, .4);
  }
  /* 42 · crypto miners buy the cards, crypto crashes in 2018, the stock halves; the $5.5 million fine */
  function sCrypto(g, t, s) {
    var tMi = at('a10', 'miners'), tCr = at('a10', 'crashes'), tHa = at('a10', 'half'), t11 = start('a11'), tFi = at('a11', 'fine');
    g.save(); cam(g, t, s, .06);
    wall(g, '#3a2a1a', '#24190f'); floorAt(g, 880, '#2e2418');
    if (t < tCr + .2) {
      var a = 1 - seg(t, tCr, tCr + .2); g.save(); g.globalAlpha = a;
      rr(g, 200, 300, 1520, 30, 6); fillStroke(g, '#8a5a3c', 5); rr(g, 200, 560, 1520, 30, 6); fillStroke(g, '#8a5a3c', 5);
      for (var i = 0; i < 8; i++) { var taken = t > tMi + i * .12; if (!taken) { gpuCard(g, 300 + i * 190, 250, .3, t, {}); } }
      for (i = 0; i < 4; i++) { var P = poseAt(t, [[s.t0, { lh: [-100, -260], rh: [80, -200], look: [.3, -.5], mouth: 'grin', eyes: 'happy' }]]); P.lf = [-26 + Math.sin(t * 11 + i) * 18, 0]; P.rf = [26 - Math.sin(t * 11 + i) * 18, 0]; guy(g, 360 + i * 400 + Math.sin(t * 2 + i) * 40, 920, .9, P, Object.assign({}, MINER, { col: ['#7a5584', '#3d7bff', '#5fb86b', '#ff5b3d'][i], seed: 90 + i, hold: [smallCard, smallCard] }), t); }
      chip(g, 'CRYPTO MINERS', 960, 140, { px: 50, bg: YEL, s: pop(t, tMi - .1), rot: -.02, wide: true });
      g.restore();
    }
    if (t > tCr - .1) {
      var b = clamp(seg(t, tCr - .1, tCr + .2), 0, 1); g.save(); g.globalAlpha = b;
      /* a falling coin, then the chart halving */
      var fk = seg(t, tCr - .1, tCr + .7); coin(g, 1520, lerp(200, 820, fk * fk), 90, YEL, Math.cos(t * 9)); if (fk >= 1) spark(g, 1520, 840, t, tCr + .7, 1.2);
      var head = chart(g, 220, 260, 1000, 480, [[0, .55], [.2, .7], [.4, .9], [.55, .82], [.7, .5], [.85, .38], [1, .36]], seg(t, tCr, tHa + .6), { col: RED });
      if (t > tHa - .1) bigNum(g, '−50%+', head[0] - 300, head[1] + 90, 96, RED, pop(t, tHa - .1) * (1 - seg(t, t11 - .4, t11 - .1)));
      chip(g, '2018 · CRYPTO CRASHES', 720, 140, { px: 44, bg: CREAM, s: pop(t, tCr - .1), rot: -.02, fam: MONO, wt: 700 });
      if (t > t11 - .2) { card(g, 1380, 480, 520, 360, .04, pop(t, t11 - .2), function (g) { txt(g, 'SEC', 0, -110, 60, INK, { wt: 900, wide: true }); txt(g, 'DIDN’T TELL INVESTORS', 0, -30, 30, INK, { fam: MONO, wt: 700 }); txt(g, 'HOW MUCH WAS CRYPTO', 0, 14, 30, INK, { fam: MONO, wt: 700 }); }); stamp(g, '$5.5M FINE', 1380, 620, t, tFi, { px: 64, rot: -.1 }); }
      g.restore();
    }
    g.restore();
    vignette(g, .45);
  }

  /* =================================================================== part 6 · the gold rush */
  /* 43 · ChatGPT, trained on a Microsoft supercomputer built from tens of thousands of Nvidia chips */
  function sChatGPT(g, t, s) {
    var tC = at('r1', 'chatgpt.'), t2 = start('r2'), tSu = at('r2', 'supercomputer'), tTe = at('r2', 'tens');
    g.save();
    var zk = eio(seg(t, tSu - .5, tTe + .6)), z = lerp(1.6, .55, zk); g.translate(960, 540); g.scale(z, z); g.translate(-960, -540); cam(g, t, s, .03);
    wall(g, '#0c1a10', '#050c07');
    if (zk > 0) for (var r = -3; r < 4; r++) for (var c = -5; c < 6; c++) { if (r === 0 && c === 0) continue; rack(g, 960 + c * 300 - 110, 540 + r * 330 - 150, 220, 300, t + c + r, { seed: c * 7 + r }); }
    monitor(g, 960, 520, 520, 320, function (g, w, h) { g.fillStyle = '#f4f1ea'; g.fillRect(-w / 2, -h / 2, w, h); txt(g, 'ChatGPT', 0, -30, 70, INK, { wt: 800 }); var q = typed('Hello! How can I help?', t, tC, tC + 1.2); g.textAlign = 'left'; font(g, 26, 600); g.fillStyle = INK; g.fillText(q, -w / 2 + 40, 60); });
    recreated(g, 1130, 700);
    g.restore();
    dateTag(g, 'NOV 30, 2022', t, at('r1', 'november') - .1);
    chip(g, 'A MICROSOFT SUPERCOMPUTER', 900, 230, { px: 48, bg: CREAM, s: pop(t, tSu - .1), rot: -.02, wide: true });
    chip(g, 'TENS OF THOUSANDS OF NVIDIA CHIPS', 960, 900, { px: 46, bg: NVL, s: pop(t, tTe - .1), rot: .02, wide: true });
    vignette(g, .4);
  }
  /* 44 · every tech giant wants the same thing; in a gold rush, sell shovels */
  function sRush(g, t, s) {
    var tGi = at('r3', 'giant'), tOn = at('r3', 'one'), t4 = start('r4'), tSh = at('r4', 'shovels.');
    g.save(); cam(g, t, s, .06);
    sky(g, t, '#f0b06a', '#f6d79a'); floorAt(g, 820, '#c99a5a');
    for (var i = 0; i < 6; i++) { g.fillStyle = '#b88a4a'; g.beginPath(); g.moveTo(-200 + i * 420, 820); g.lineTo(i * 420, 620 - hash(i) * 80); g.lineTo(200 + i * 420, 820); g.closePath(); g.fill(); }
    /* the stall */
    rr(g, 1180, 560, 560, 280, 8); fillStroke(g, '#8a5a3c', 7); g.fillStyle = NV; for (i = 0; i < 7; i++) { g.fillStyle = i % 2 ? CREAM : NV; g.fillRect(1160 + i * 86, 470, 86, 70); } g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(1160, 470, 602, 70);
    txt(g, 'SHOVELS · GPUs', 1460, 400, 40, CREAM, { wt: 900, wide: true, outline: 8 });
    for (i = 0; i < 4; i++) { g.save(); g.translate(1250 + i * 130, 820); shovel(g); g.restore(); }
    var J = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [120, -240], look: [-.7, 0], mouth: 'smile' }], [tSh, { rh: [140, -300], mouth: 'grin', eyes: 'happy' }]]);
    guy(g, 1460, 880, 1.05, J, Object.assign({}, JEN, { hold: [null, shovel] }), t);
    /* the giants run in with sacks of money */
    var names = ['BIG TECH', 'CLOUD CO.', 'SOCIAL CO.', 'SEARCH CO.'];
    for (i = 0; i < 4; i++) {
      var k = seg(t, tGi - .6 + i * .2, tOn + .4 + i * .2), x = lerp(-200, 260 + i * 220, eio(k)); if (k <= 0) continue;
      var P = poseAt(t, [[s.t0, { lh: [-100, -220], rh: [130, -200], look: [.8, 0], mouth: 'O', eyes: 'wide', lean: .1 }]]); P.lf = [-26 + Math.sin(t * 13 + i) * 24, 0]; P.rf = [26 - Math.sin(t * 13 + i) * 24, 0];
      guy(g, x, 900, .9, P, Object.assign({}, SUIT, { seed: 100 + i, tie: [RED, BLUE, YEL, MINT][i], hold: [null, function (g) { circ(g, 0, 10, 34); fillStroke(g, '#c9a26a', 5); txt(g, '$', 0, 12, 34, INK, { wt: 900 }); }] }), t);
      chip(g, names[i], x, 560, { px: 26, bg: CREAM, s: clamp(k * 3, 0, 1), fam: MONO, wt: 700 });
    }
    g.restore();
    chip(g, 'ONE COMPANY SELLS MOST OF THEM', 960, 140, { px: 44, bg: CREAM, s: pop(t, tOn - .1) * (1 - seg(t, t4 - .3, t4)), rot: -.02, wide: true });
    if (t > t4 - .2) quote(g, t, 'r4', 200, { px: 96, maxw: 1500, hot: /shovels/i });
    vignette(g, .35);
  }
  /* 45 · the H100: tens of thousands of dollars each, months of waiting */
  function sH100(g, t, s) {
    var tH = at('r5', 'h100,'), tTe = at('r5', 'tens'), tWa = at('r5', 'wait');
    g.save(); cam(g, t, s, .06);
    wall(g, '#1b1430', '#0f0b1c'); floorAt(g, 880, '#221a38');
    rr(g, 760, 640, 400, 240, 10); fillStroke(g, '#3a3450', 7);
    var k = pop(t, tH - .3, 2.6, .6); if (k > 0) { glow(g, 960, 470, 360, 'rgba(118,185,0,.55)', clamp(k, 0, 1)); gpuCard(g, 960, 480, .85 * clamp(k, 0, 1.05), t, { label: 'H100', glow: .8, fans: 0 }); }
    tag(g, 'TENS OF THOUSANDS OF $', 1280, 300, pop(t, tTe - .1), { px: 44, rot: .1 });
    /* the queue, with calendar pages flipping */
    for (var i = 0; i < 7; i++) { var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [60, -150], look: [.8, 0], mouth: i % 2 ? 'flat' : 'frown', eyes: i % 3 ? 'dot' : 'tiny' }]]); guy(g, 1260 + i * 120, 920, .62, P, Object.assign({}, SUIT, { seed: 110 + i, tie: [RED, BLUE, YEL, MINT][i % 4] }), t); }
    if (t > tWa - .2) { var m = Math.floor(clamp(seg(t, tWa, s.t1), 0, 1) * 6); calendar(g, 360, 520, .8 * clamp(pop(t, tWa - .2), 0, 1.05), 'WAITING', ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL'][m], { px: 110, sub: 'MONTHS', rot: -.05 }); }
    g.restore();
    vignette(g, .4);
  }
  /* 46 · May 2023: a trillion dollars, and Denny's puts a plaque on the booth */
  function sPlaque(g, t, s) {
    var tTr = at('r6', 'trillion'), tPl = at('r6', 'plaque');
    g.save(); cam(g, t, s, .06, 960, 420);
    diner(g, t, { plaque: clamp(pop(t, tPl - .2, 2.6, .6), 0, 1.05) });
    mug(g, 700, 690, .8, t, true); plate(g, 1200, 688, .9);
    g.restore();
    dateTag(g, 'MAY 2023', t, at('r6', 'may') - .1);
    bigNum(g, '$1 TRILLION', 960, 860, 120, NVL, pop(t, tTr - .2) * (1 - seg(t, tPl - .4, tPl - .1)));
    chip(g, "DENNY'S PLAQUE", 960, 120, { px: 46, bg: YEL, s: pop(t, tPl - .1), rot: -.02, wide: true });
    vignette(g, .4);
  }
  /* 47 · June 2024: past Microsoft and Apple, the most valuable company in the world */
  function sPodium(g, t, s) {
    var tPa = at('r7', 'passes'), tMo = at('r7', 'most');
    g.save(); cam(g, t, s, .06);
    wall(g, '#1d2440', '#121729'); floorAt(g, 900, '#2a2438');
    var steps = [[960, 380, '1', NV], [560, 260, '2', '#c9c6d6'], [1360, 180, '3', '#c9a26a']];
    steps.forEach(function (p) { rr(g, p[0] - 190, 900 - p[1], 380, p[1], 8); fillStroke(g, p[3], 7); txt(g, p[2], p[0], 900 - p[1] / 2, 110, INK, { wt: 900 }); });
    var sw = eio(seg(t, tPa - .2, tPa + .8));
    /* Nvidia's chip climbs from third to first */
    var nx = lerp(1360, 960, sw), ny = lerp(900 - 180, 900 - 380, sw) - 130 - Math.sin(sw * Math.PI) * 160;
    chipD(g, lerp(960, 560, sw), 900 - lerp(380, 260, sw) - 110, .8, t, { face: sw > .5 ? 'sad' : 'dot', die: '#3d7bff', die2: '#8fb6ff', label: 'MICROSOFT', seed: 2 });
    chipD(g, lerp(560, 1360, sw), 900 - lerp(260, 180, sw) - 110 - Math.sin(sw * Math.PI) * 60, .8, t, { face: sw > .5 ? 'o' : 'dot', die: '#9a96a6', die2: '#e0dce8', label: 'APPLE', seed: 4 });
    chipD(g, nx, ny, .9, t, { face: sw > .5 ? 'grin' : 'dot', glow: sw, label: 'NVIDIA' });
    if (t > tMo) for (var i = 0; i < 3; i++) spark(g, 960 + (i - 1) * 180, 300 + (i % 2) * 80, t, tMo + i * .12, .9);
    g.restore();
    dateTag(g, 'JUN 2024', t, at('r7', 'june') - .1);
    chip(g, 'MOST VALUABLE COMPANY IN THE WORLD', 900, 210, { px: 44, bg: YEL, s: pop(t, tMo - .1), rot: -.02, wide: true });
    vignette(g, .4);
  }
  /* 48 · DeepSeek, January 2025: about $589 billion gone in a day, the biggest one-day loss ever */
  function sDeepSeek(g, t, s) {
    var tD = at('r8', 'deepseek'), tCh = at('r8', 'cheap'), tLo = at('r8', 'loses'), t9 = start('r9');
    g.save(); cam(g, t, s, .06);
    wall(g, '#2a1520', '#180b12'); grid(g, 90, 'rgba(255,90,90,.05)');
    var pts = [[0, .5], [.15, .62], [.3, .7], [.45, .78], [.6, .86], [.62, .4], [.8, .42], [1, .46]];
    var head = chart(g, 200, 240, 1000, 560, pts, t < tLo ? seg(t, s.t0, tLo) * .6 : lerp(.6, 1, seg(t, tLo, t9)), { col: t > tLo ? RED : NVL });
    if (t > tLo) { bigNum(g, '−$589 BILLION', 1400, 440, 76, RED, pop(t, tLo + .2)); chip(g, 'IN ONE DAY', 1480, 560, { px: 46, bg: CREAM, s: pop(t, tLo + .4), rot: .03, wide: true }); }
    /* a small whale-blue chip labelled DEEPSEEK nudges the chart */
    var dk = pop(t, tD - .2, 2.8, .6); if (dk > 0) { chipD(g, 1500, 820, .55 * clamp(dk, 0, 1.05), t, { face: 'grin', die: '#4a7bd8', die2: '#9fc4ff', label: 'DEEPSEEK', seed: 6 }); chip(g, 'A CHEAP AI MODEL', 1500, 690, { px: 42, bg: CREAM, s: pop(t, tCh - .1), fam: MONO, wt: 700 }); }
    if (t > t9 - .1) stamp(g, 'BIGGEST 1-DAY LOSS EVER', 900, 250, t, t9 + .1, { px: 58, rot: -.04 });
    g.restore();
    dateTag(g, 'JAN 27, 2025', t, at('r8', 'january') - .1);
    vignette(g, .45);
  }
  /* 49 · and it keeps climbing: $4 trillion, $5 trillion, the first ever */
  function sClimb(g, t, s) {
    var t4 = at('r10', '4'), t5 = at('r10', '5'), tFi = at('r10', 'first');
    g.save(); cam(g, t, s, .06);
    wall(g, '#132108', '#070c03'); grid(g, 100, 'rgba(182,240,90,.06)');
    var pts = [[0, .1], [.12, .2], [.2, .16], [.32, .34], [.45, .42], [.55, .55], [.66, .6], [.78, .75], [.9, .88], [1, .96]];
    var head = chart(g, 200, 280, 1400, 600, pts, seg(t, s.t0, t5 + .5), { col: NVL, lw: 14 });
    /* Jensen rides the head of the line up */
    var cP = poseAt(t, [[s.t0, { lh: [-90, -230], rh: [90, -230], mouth: 'grin', eyes: 'happy', look: [.5, -.4] }]]); cP.lf = [-30 + Math.sin(t * 9) * 16, 0]; cP.rf = [30 - Math.sin(t * 9) * 16, 0];
    guy(g, head[0], head[1] - 4, .42, cP, JEN, t);
    [[t4, '$4T', 'JUL 2025', .78], [t5, '$5T', 'OCT 2025', .96]].forEach(function (f) { if (t < f[0] - .2) return; var x = 200 + f[3] * 1400 * (f[3] === .78 ? .78 / .78 : 1), y = 280 + 600 - (f[3] === .78 ? .75 : .96) * 600; var px2 = f[3] === .78 ? 200 + .78 * 1400 : 200 + 1400; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.moveTo(px2, y); g.lineTo(px2, y - 170); g.stroke(); g.beginPath(); g.moveTo(px2, y - 170); g.lineTo(px2 + 110, y - 140); g.lineTo(px2, y - 110); g.closePath(); fillStroke(g, NV, 5); tag(g, f[1], px2 - 140, y - 160, pop(t, f[0] - .1), { px: 54 }); txt(g, f[2], px2 - 140, y - 80, 28, CREAM, { fam: MONO, wt: 700, outline: 6 }); });
    g.restore();
    chip(g, 'KEEPS CLIMBING', 760, 120, { px: 48, bg: CREAM, s: pop(t, s.t0 + .2), rot: -.03, wide: true });
    stamp(g, 'FIRST COMPANY EVER', 1100, 560, t, tFi, { px: 64, col: NVL, rot: -.08 });
    vignette(g, .4);
  }

  /* =================================================================== part 7 · right now */
  /* 50 · October 2026: $96.2 billion in a quarter, $89 billion from data centers: nine of every ten dollars */
  function sNow(g, t, s) {
    var t2 = start('n2'), t96 = at('n2', '96.2'), t89 = at('n2', '89'), t3 = start('n3'), tNi = at('n3', 'nine'), tGa = at('n3', 'gaming');
    g.save(); cam(g, t, s, .05);
    wall(g, '#1c2a12', '#0e1708'); grid(g, 100, 'rgba(182,240,90,.05)');
    if (t < t2 + .2) {
      var ca = 1 - seg(t, t2, t2 + .2);
      calendar(g, 760, 520, 1.1 * clamp(pop(t, s.t0 + .1), 0, 1.05) * ca, 'RIGHT NOW', 'OCT', { px: 110, sub: '2026' });
      g.save(); g.globalAlpha = ca; guy(g, 1380, 980, 1.1, poseAt(t, [[s.t0, { lh: [-60, -150], rh: [-150, -300], look: [-.6, -.2], mouth: 'smile' }], [s.t0 + .8, { rh: [-170, -320], mouth: 'talk' }]]), JEN, t); g.restore();
      chip(g, 'WHERE IS IT THIS MONTH?', 1380, 200, { px: 44, bg: YEL, s: pop(t, s.t0 + .3) * ca, rot: .02, wide: true });
    }
    if (t > t2 - .1) {
      var a = clamp(seg(t, t2 - .1, t2 + .2), 0, 1); g.save(); g.globalAlpha = a;
      chip(g, 'LAST QUARTER', 960, 120, { px: 40, bg: CREAM, fam: MONO, wt: 700, s: a });
      bigNum(g, '$' + (function (v) { return v >= 96.2 ? '96.2' : String(Math.floor(v / 10) * 10); })(96.2 * eo(seg(t, t96 - .3, t96 + .7))) + ' BILLION', 960, 260, 110, CREAM, pop(t, t96 - .3));
      /* ten coins: nine data center, one everything else */
      for (var i = 0; i < 10; i++) { var k = pop(t, t89 - .3 + i * .05, 3, .6); if (k <= 0) continue; var dc = i < 9 && t > t89, x = 330 + i * 140; g.save(); g.translate(x, 560); g.scale(clamp(k, 0, 1.05), clamp(k, 0, 1.05)); coin(g, 0, 0, 56, dc ? NVL : '#c9c6d6', 1); g.restore(); }
      if (t > t89 - .1) { g.strokeStyle = NVL; g.lineWidth = 8; g.beginPath(); g.moveTo(300, 650); g.lineTo(300, 680); g.lineTo(1450, 680); g.lineTo(1450, 650); g.stroke(); chip(g, 'DATA CENTERS · $89B', 875, 730, { px: 40, bg: NVL, s: pop(t, t89), wide: true }); chip(g, 'EVERYTHING ELSE', 1620, 730, { px: 36, bg: '#c9c6d6', s: pop(t, t89 + .2), fam: MONO, wt: 700 }); }
      chip(g, '9 OF EVERY 10 DOLLARS', 960, 860, { px: 54, bg: YEL, s: pop(t, tNi - .1) * (1 - seg(t, tGa - .3, tGa - .1)), rot: -.02, wide: true });
      if (t > tGa - .2) { gpuCard(g, 330, 860, .3, t, {}); cross(g, 330, 860, 1.4, pop(t, tGa)); chip(g, 'NOW MOSTLY SELLS TO AI', 960, 860, { px: 40, bg: CREAM, s: pop(t, tGa + .1), rot: .02, wide: true }); }
      g.restore();
    }
    g.restore();
    vignette(g, .4);
  }
  /* 51 · Vera Rubin in full production; $108 billion expected, with no China AI chip sales */
  function sRubin(g, t, s) {
    var tV = at('n4', 'vera'), tFu = at('n4', 'full'), t108 = at('n4', '108'), tCh = at('n4', 'china.');
    g.save(); cam(g, t, s, .06);
    wall(g, '#14233a', '#0b1424'); floorAt(g, 860, '#1f2a3a');
    g.fillStyle = '#3a3a4a'; g.fillRect(-200, 780, W + 400, 40);
    for (var i = 0; i < 6; i++) { var x = ((i * 380 + (t - tV) * 200) % 2280) - 200; if (t < tV - .3) break; rack(g, x - 90, 470, 180, 310, t, { seed: i, label: 'VERA RUBIN' }); }
    chip(g, 'VERA RUBIN · IN FULL PRODUCTION', 960, 130, { px: 44, bg: NVL, s: pop(t, tFu - .2), rot: -.02, wide: true });
    g.restore();
    if (t > t108 - .3) { bigNum(g, '$108B', 760, 300, 120, CREAM, pop(t, t108 - .2)); chip(g, 'EXPECTED THIS QUARTER', 760, 400, { px: 36, bg: CREAM, s: pop(t, t108), fam: MONO, wt: 700 }); }
    if (t > tCh - .4) { card(g, 1460, 330, 300, 200, .05, pop(t, tCh - .4), function (g) { txt(g, 'CHINA', 0, -40, 48, INK, { wt: 900, wide: true }); txt(g, 'NOT COUNTED', 0, 30, 32, INK, { fam: MONO, wt: 700 }); }); }
    vignette(g, .4);
  }
  /* 52 · not a straight line: a record on Oct 6, then eight red days; worth about $5.2 trillion today */
  function sWobble(g, t, s) {
    var tRe = at('n5', 'record,'), tEi = at('n5', 'eight'), tSi = at('n5', 'since'), t6 = start('n6'), t52 = at('n6', '5.2');
    g.save(); cam(g, t, s, .06);
    wall(g, '#1d2440', '#121729'); grid(g, 90);
    rr(g, 180, 200, 1560, 600, 18); fillStroke(g, '#191527', 5);
    /* candles: Nvidia's climb to the record (left of the divider), then the chip index's eight red days (right) */
    var c = [.3, .36, .34, .42, .48, .55, .62, .58, .5, .45, .4, .37, .34, .31, .3, .34, .38], n = Math.floor(clamp(seg(t, s.t0, tEi + 1.4), 0, 1) * c.length);
    if (n > 7) { g.save(); g.setLineDash([12, 12]); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; g.beginPath(); g.moveTo(860, 220); g.lineTo(860, 780); g.stroke(); g.restore(); txt(g, 'NVIDIA', 520, 240, 32, CREAM, { fam: MONO, wt: 700 }); txt(g, 'CHIP STOCKS', 1180, 240, 32, RED, { fam: MONO, wt: 700 }); }
    for (var i = 0; i < n; i++) {
      var y0 = i ? c[i - 1] : .25, y1 = c[i], up = y1 >= y0, red8 = i >= 7 && i <= 14, x = 240 + i * 88, ya = 760 - Math.max(y0, y1) * 560, yb = 760 - Math.min(y0, y1) * 560;
      g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 24, ya - 20); g.lineTo(x + 24, yb + 20); g.stroke();
      rr(g, x, ya, 48, Math.max(12, yb - ya), 4); fillStroke(g, up ? NVL : RED, 4);
      if (i === 6 && t > tRe - .2) { tag(g, 'NVIDIA RECORD · OCT 6', x + 40, ya - 70, pop(t, tRe - .1), { px: 34 }); }
    }
    if (t > tEi - .2) { var cnt = clamp(Math.floor(seg(t, tEi - .2, tEi + 1.2) * 8) + 1, 1, 8); chip(g, 'CHIP STOCKS: ' + cnt + (cnt === 1 ? ' RED DAY' : ' RED DAYS IN A ROW'), 1240, 185, { px: 40, bg: RED, fg: '#fff', s: pop(t, tEi - .2), rot: .03, wide: true }); }
    chip(g, 'LONGEST STREAK SINCE 2008', 1300, 255, { px: 32, bg: CREAM, s: pop(t, tSi - .1), fam: MONO, wt: 700 });
    g.restore();
    chip(g, 'NOT A STRAIGHT LINE', 960, 110, { px: 50, bg: YEL, s: pop(t, s.t0 + .1) * (1 - seg(t, tEi - .5, tEi - .25)), rot: -.02, wide: true });
    if (t > t6 - .2) { g.fillStyle = 'rgba(8,6,18,' + (.55 * seg(t, t6 - .2, t6 + .2)) + ')'; g.fillRect(0, 0, W, H); bigNum(g, '≈ $5.2 TRILLION', 960, 500, 150, NVL, pop(t, t52 - .2)); chip(g, 'TODAY', 960, 650, { px: 50, bg: CREAM, s: pop(t, t6), rot: .02, wide: true }); }
    vignette(g, .4);
  }
  /* 53 · that $12 share from 1999: six splits, 480 shares, about $104 thousand */
  function sShare(g, t, s) {
    var tRe = at('n7', 'remember'), tSp = at('n7', 'splits,'), t480 = at('n7', '480'), t104 = at('n7', '104');
    g.save(); cam(g, t, s, .05);
    wall(g, '#2a1f3a', '#1a1428'); grid(g, 90);
    sticky(g, ['REMEMBER', '$12?'], 1710, 470, pop(t, tRe - .1), -.06, { w: 300, h: 240, px: 48 });
    var SPL = [1, 2, 4, 8, 12, 48, 480], k = clamp(seg(t, tSp - .6, t480 + .1), 0, 1), step = Math.min(6, Math.floor(k * 7)), nShares = SPL[step];
    /* the share certificates multiplying in a grid */
    var shown = Math.min(nShares, 480), cols = nShares > 48 ? 30 : nShares > 8 ? 12 : 4, cell = nShares > 48 ? 40 : nShares > 8 ? 90 : 190;
    for (var i = 0; i < shown; i++) { var c = i % cols, r = Math.floor(i / cols), x = 960 - cols * cell / 2 + c * cell + cell / 2, y = 330 + r * cell * .62; g.save(); g.translate(x, y); rr(g, -cell * .42, -cell * .26, cell * .84, cell * .52, cell * .06); fillStroke(g, '#dff0d8', Math.max(2, cell * .04)); if (cell > 60) txt(g, 'NVDA', 0, 2, cell * .18, '#2f6b3a', { fam: MONO, wt: 700 }); g.restore(); }
    chip(g, '1 SHARE' + (step ? ' → ' + nShares + ' SHARES' : ''), 960, 150, { px: 48, bg: CREAM, s: pop(t, s.t0 + .2), rot: -.02, wide: true });
    if (step > 0 && step < 6) chip(g, 'SPLIT ×' + step, 1500, 260, { px: 40, bg: YEL, s: 1, rot: .05, wide: true });
    if (t > t104 - .3) { g.fillStyle = 'rgba(8,6,18,' + (.6 * seg(t, t104 - .3, t104)) + ')'; g.fillRect(0, 0, W, H); counter(g, 960, 560, seg(t, t104 - .3, t104 + .8), 104000, 160, NVL, { pre: '≈ $', step: 10000 }); chip(g, 'FROM $12', 960, 720, { px: 50, bg: YEL, s: pop(t, t104 + .3), rot: .03, wide: true }); }
    g.restore();
    vignette(g, .4);
  }
  /* 54 · still the CEO, still the jacket; the kid who cleaned toilets; "a million times harder" */
  function sJensen(g, t, s) {
    var tTh = at('n8', 'thirtythree'), tJa = at('n8', 'jacket.'), t8b = start('n8b'), tTo = at('n8b', 'toilets'), t200 = at('n8b', '200'), t9 = start('n9'), tMi = at('n9', 'million');
    g.save(); cam(g, t, s, .05);
    stageSet(g, t, function (g) { if (t >= t9) return; if (t < t8b) { chipD(g, 960, 370, 1.1, t, { face: 'grin', glow: .7, label: 'NVIDIA' }); } else { toilet(g, 860, 520, 1.1); g.save(); g.translate(1060, 520); brush(g); g.restore(); txt(g, 'KENTUCKY, 1970s', 960, 790, 40, CREAM, { fam: MONO, wt: 700 }); } });
    var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [140, -270], look: [-.2, -.2], mouth: 'talk' }], [tJa, { lh: [-40, -120], rh: [40, -120], mouth: 'smirk', eyes: 'squint' }], [t9, { lh: [-60, -150], rh: [60, -150], look: [.2, .2], mouth: 'flat', brow: -1 }], [tMi, { lh: [-120, -230], rh: [120, -230], mouth: 'O', eyes: 'wide', brow: 1 }]]);
    guy(g, 960, 960, 1.15, P, JEN, t);
    g.restore();
    chip(g, 'STILL THE CEO · 33 YEARS', 960, 70, { px: 40, bg: CREAM, s: pop(t, tTh - .1) * (1 - seg(t, t8b - .2, t8b)), rot: -.02, wide: true });
    chip(g, 'STILL THE JACKET', 480, 760, { px: 40, bg: YEL, s: pop(t, tJa - .1) * (1 - seg(t, t8b - .2, t8b)), rot: .04, wide: true });
    if (t > t200 - .3 && t < t9 + .2) bigNum(g, '$200 BILLION+', 960, 250, 110, NVL, pop(t, t200 - .2) * (1 - seg(t, t9, t9 + .2)));
    if (t > tTo - .2 && t < t200) sticky(g, ['REMEMBER', 'THE TOILETS?'], 1580, 300, pop(t, tTo - .2), .05, { px: 46 });
    if (t > t9 - .1) { g.fillStyle = 'rgba(8,6,18,' + (.7 * seg(t, t9 - .1, t9 + .3)) + ')'; g.fillRect(0, 0, W, H); quote(g, t, 'n9', 420, { px: 62, maxw: 1600, hot: /million|harder/i }); txt(g, 'JENSEN HUANG ON THE ACQUIRED PODCAST, 2023', 960, 820, 36, CREAM, { fam: MONO, wt: 700, a: seg(t, t9, t9 + .4) }); }
    vignette(g, .4);
  }

  /* =================================================================== the ending */
  /* 55 · why it matters: the same chip, two jobs (the split screen) */
  function sSplit(g, t, s) {
    var t2 = start('e2'), tCo = at('e2', 'cousins'), tGa = at('e2', 'games.'), t3 = start('e3'), tTw = at('e3', 'twenty'), tPa = at('e3', 'paid'), t3b = start('e3b'), tSt = at('e3b', 'stadium'), tKe = at('e3b', 'kept'), tSd = at('e3b', 'standing');
    g.save(); cam(g, t, s, .04);
    if (t < t3b) {
      /* left: a gamer; right: someone asking an AI; the seam is one chip */
      g.save(); g.beginPath(); g.rect(0, 0, W / 2, H); g.clip(); wall(g, '#3a1f4a', '#24132e'); floorAt(g, 880, '#2e1f38');
      monitor(g, 480, 430, 520, 320, function (g, w, h) { var gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#ff9a6a'); gr.addColorStop(1, '#5a3a8a'); g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h); g.save(); g.translate(Math.sin(t * 1.4) * 160, 20); g.beginPath(); g.moveTo(0, -30); g.lineTo(46, 24); g.lineTo(0, 8); g.lineTo(-46, 24); g.closePath(); fillStroke(g, NVL, 4); g.restore(); });
      var P = poseAt(t, [[s.t0, { lh: [-40, -170], rh: [60, -170], look: [.2, -.5], mouth: 'grin', eyes: 'wide', front: 1 }]]); P.lh = [P.lh[0] + Math.sin(t * 18) * 6, P.lh[1]];
      guy(g, 380, 1060, 1.0, P, KID, t); txt(g, 'GAMES', 480, 150, 60, CREAM, { wt: 900, wide: true, outline: 10 });
      g.restore();
      g.save(); g.beginPath(); g.rect(W / 2, 0, W / 2, H); g.clip(); wall(g, '#1a2f3a', '#0f1e26'); floorAt(g, 880, '#1a2a30');
      monitor(g, 1440, 430, 520, 320, function (g, w, h) { g.fillStyle = '#f4f1ea'; g.fillRect(-w / 2, -h / 2, w, h); txt(g, 'ChatGPT', 0, -100, 40, INK, { wt: 800 }); g.textAlign = 'left'; font(g, 24, 600); g.fillStyle = INK; g.fillText(typed('Why is the sky blue?', t, s.t0 + .3, s.t0 + 1.6), -w / 2 + 30, -20); g.fillStyle = '#3a6b2a'; g.fillText(typed('Sunlight scatters off air…', t, s.t0 + 1.8, s.t0 + 3.2), -w / 2 + 30, 30); });
      recreated(g, 1610, 610);
      var Q = poseAt(t, [[s.t0, { lh: [-40, -170], rh: [60, -180], look: [-.2, -.5], mouth: 'smile', front: 1 }]]);
      guy(g, 1540, 1060, 1.0, Q, YOU, t); txt(g, 'AI', 1440, 150, 60, CREAM, { wt: 900, wide: true, outline: 10 });
      g.restore();
      g.strokeStyle = INK; g.lineWidth = 12; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke();
      var ck = pop(t, tCo - .3, 2.8, .6); glow(g, W / 2, 640, 300, 'rgba(182,240,90,.45)', clamp(ck, 0, 1)); chipD(g, W / 2, 640, .85 * Math.max(.4, clamp(ck, 0, 1.05)), t, { face: 'grin', glow: 1, label: 'GPU' });
      chip(g, 'GAMES · SINCE 1993', 480, 240, { px: 36, bg: CREAM, s: pop(t, tGa - .1) * (1 - seg(t, t3 - .3, t3)), rot: -.02, fam: MONO, wt: 700 });
      chip(g, 'AI · SINCE 2012', 1440, 240, { px: 36, bg: NVL, s: pop(t, tGa + .2) * (1 - seg(t, t3 - .3, t3)), rot: .02, fam: MONO, wt: 700 });
      chip(g, 'COUSINS', W / 2, 820, { px: 48, bg: NVL, s: pop(t, tCo - .1), rot: -.03, wide: true });
      if (t > t3 - .2) { g.fillStyle = 'rgba(8,6,18,' + (.5 * seg(t, t3 - .2, t3 + .2)) + ')'; g.fillRect(0, 0, W, H); chip(g, '20 YEARS OF GAMERS PAID FOR IT', W / 2, 300, { px: 50, bg: YEL, s: pop(t, tTw - .1), rot: -.02, wide: true }); for (var i = 0; i < 10; i++) { var ph = (t * 1.4 + i * .1) % 1; if (t < tPa - .2) break; coin(g, lerp(380, W / 2, ph), lerp(700, 640, ph) - Math.sin(ph * Math.PI) * 160, 22, YEL, Math.cos(ph * 9)); } }
    } else {
      /* the recap, three panels */
      wall(g, '#13240c', '#081405'); grid(g, 100, 'rgba(182,240,90,.05)');
      chip(g, "NVIDIA DIDN'T PREDICT AI", 960, 130, { px: 50, bg: CREAM, s: pop(t, t3b), rot: -.02, wide: true });
      [[tSt, 'BUILT A STADIUM', 'FOR GAMES', 400], [tKe, 'KEPT PAYING', 'WHEN NOBODY CARED', 960], [tSd, 'WAS STANDING THERE', 'WHEN AI WALKED IN', 1520]].forEach(function (p, i) {
        card(g, p[3], 560, 480, 520, (i - 1) * .035, pop(t, (i === 0 ? Math.min(p[0], t3b + .4) : p[0]) - .2), function (g) {
          if (i === 0) stadium(g, -190, -150, 9, 4, 44, t, function () { return 1; }, { pix: function (j) { return j % 2 ? NVL : YEL; } });
          else if (i === 1) { coin(g, -60, -110, 40, YEL, 1); coin(g, 30, -140, 40, YEL, 1); coin(g, 80, -90, 40, YEL, 1); }
          else { g.save(); g.translate(0, -20); g.scale(.55, .55); guy(g, 0, 0, 1, { lh: [-60, -150], rh: [60, -150], lf: [-26, 0], rf: [26, 0], hip: 0, lean: 0, tilt: 0, look: [-.6, 0], eyes: 'dot', brow: 0, mouth: 'smirk', jump: 0, front: 0 }, JEN, t); g.restore(); }
          txt(g, p[1], 0, 120, 36, INK, { wt: 900, wide: true }); txt(g, p[2], 0, 180, 28, INK, { fam: MONO, wt: 700 });
        });
      });
    }
    g.restore();
    vignette(g, .4);
  }
  /* 56 · Google, Amazon and AMD building chips to knock Nvidia off the top */
  function sRivals(g, t, s) {
    var tGo = at('e4', 'google,'), tAm = at('e4', 'amazon'), tAd = at('e4', 'amd'), tKn = at('e4', 'knock'), tNo = at('e4b', 'not'), tFo = at('e4b', 'for'), back = eio(seg(t, tNo - .2, tNo + .5));
    g.save(); cam(g, t, s, .06);
    wall(g, '#22283e', '#151a2a');
    g.beginPath(); g.moveTo(-200, 1100); g.lineTo(960, 360); g.lineTo(2120, 1100); g.closePath(); fillStroke(g, '#4a4458', 8);
    chipD(g, 960, 260, .9, t, { face: t > tKn && t < tNo ? 'o' : 'grin', glow: .7 + back * .3, label: 'NVIDIA', rot: knock(t, tKn, 20, 4) * .15 });
    [[tGo, 'GOOGLE TPU', 520, '#4a7bd8', '#9fc4ff'], [tAm, 'AMAZON TRAINIUM', 960, '#ff9a3d', '#ffd29a'], [tAd, 'AMD INSTINCT', 1400, '#d84a4a', '#ff9f9f']].forEach(function (r, i) {
      var k = pop(t, r[0] - .3, 2.8, .6); if (k <= 0) return; var cl = seg(t, r[0], tNo) * (1 - back * .7), y = lerp(960, 640, cl) + Math.sin(t * 6 + i) * 6, x = lerp(r[2], r[2] + (960 - r[2]) * .4, cl);
      chipD(g, x, y, .74 * clamp(k, 0, 1.05), t, { face: 'grin', die: r[3], die2: r[4], label: r[1], seed: i + 7 });
    });
    g.restore();
    stamp(g, 'NOT YET', 960, 560, t, tNo, { px: 90, col: NVL, rot: -.08 });
    chip(g, 'EVERYONE WANTS THE TOP', 960, 130, { px: 48, bg: YEL, s: pop(t, tKn - .1) * (1 - seg(t, tFo - .3, tFo - .05)), rot: -.02, wide: true });
    chip(g, 'MOST AI CHIPS: STILL NVIDIA', 960, 130, { px: 48, bg: NVL, s: pop(t, tFo - .05), rot: .02, wide: true });
    vignette(g, .4);
  }
  /* 57 · 1993, three engineers and a lot of coffee; tonight, the same diner, a question, their chips */
  function sDiner(g, t, s) {
    var t6 = start('e6'), tTy = at('e6', 'type'), tCh = at('e6', 'chips.');
    var nk = eio(seg(t, t6 - .3, t6 + .4));
    g.save(); cam(g, t, s, .05, 960, 520);
    diner(g, t, { night: nk > .5 });
    if (nk < 1) {
      g.save(); g.globalAlpha = 1 - nk;
      [[640, CHRIS, .5], [960, JEN, 0], [1280, CURT, -.5]].forEach(function (c, i) { var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [90, -200], look: [c[2], -.1], mouth: i === 1 ? 'talk' : 'smile' }]]); guy(g, c[0], 900, .95, P, c[1], t); });
      for (var i = 0; i < 5; i++) mug(g, 600 + i * 180, 690, .6, t, true);
      g.restore(); sepia(g, .5 * (1 - nk));
      dateTag(g, '1992', t, s.t0 + .1, t6);
    }
    if (nk > 0) {
      g.save(); g.globalAlpha = nk;
      var P = poseAt(t, [[s.t0, { lh: [-40, -170], rh: [70, -200], look: [.3, -.4], mouth: 'smile', front: 1 }], [tCh, { mouth: 'grin', eyes: 'happy' }]]);
      guy(g, 960, 900, 1.0, Object.assign({}, P), Object.assign({}, YOU, { hold: [null, phoneH] }), t);
      mug(g, 700, 690, .7, t, true);
      g.restore();
      dateTag(g, 'TONIGHT', t, t6);
    }
    g.restore();
    /* the question becomes a packet that flies to a chip far away */
    var pk = seg(t, tTy + .3, tCh - .2); if (pk > 0 && pk < 1) { var x = lerp(1040, 1700, eio(pk)), y = lerp(700, 260, eio(pk)); glow(g, x, y, 90, 'rgba(182,240,90,.8)', 1); circ(g, x, y, 16); fillStroke(g, NVL, 5); }
    if (t > tCh - .4) chipD(g, 1700, 260, .6 * clamp(pop(t, tCh - .4), 0, 1.05), t, { face: 'grin', glow: .9, label: 'NVIDIA' });
    vignette(g, .4);
  }
  /* 58 · watch next (the undersea cables episode, live on the channel) and subscribe */
  function sCard(g, t, s) {
    var tCa = at('e7', 'cable'), tCu = at('e7', 'cut'), tHe = at('e7', 'here.'), t8 = start('e8'), tSu = at('e8', 'subscribe'), tWh = at('e8', 'which');
    g.save(); cam(g, t, s, .04);
    wall(g, '#2f2752', '#1f1a38'); grid(g, 80);
    var vk = pop(t, s.t0 + .1, 2.6, .6);
    if (vk > 0) {
      g.save(); g.translate(1240, 470); g.scale(clamp(vk, 0, 1.04), clamp(vk, 0, 1.04)); g.rotate(.02);
      rr(g, -400, -225, 800, 450, 18); fillStroke(g, '#0c2a4a', 8);
      g.save(); g.beginPath(); g.rect(-392, -217, 784, 434); g.clip();
      var gr = g.createLinearGradient(0, -217, 0, 217); gr.addColorStop(0, '#1d5a8a'); gr.addColorStop(1, '#06182c'); g.fillStyle = gr; g.fillRect(-392, -217, 784, 434);
      g.fillStyle = '#c9a26a'; g.beginPath(); g.moveTo(-392, 217); for (var x = -392; x <= 392; x += 40) g.lineTo(x, 150 + Math.sin(x * .02) * 14); g.lineTo(392, 217); g.closePath(); g.fill();
      /* the cable along the sea floor, snapping when "cut" is said */
      var cutK = seg(t, tCu - .1, tCu + .4), gap = 40 * eo(cutK);
      g.strokeStyle = INK; g.lineWidth = 16; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-392, 120); g.quadraticCurveTo(-200, 100, -gap, 120); g.stroke(); g.beginPath(); g.moveTo(gap, 120); g.quadraticCurveTo(200, 140, 392, 110); g.stroke();
      g.strokeStyle = YEL; g.lineWidth = 6; g.beginPath(); g.moveTo(-392, 120); g.quadraticCurveTo(-200, 100, -gap, 120); g.stroke(); g.beginPath(); g.moveTo(gap, 120); g.quadraticCurveTo(200, 140, 392, 110); g.stroke();
      if (t > tCu) spark(g, 0, 120, t, tCu, .9);
      g.restore();
      txt(g, 'WHAT IF EVERY UNDERSEA', 0, -120, 46, CREAM, { wt: 900, wide: true, outline: 9 }); txt(g, 'CABLE WAS CUT?', 0, -50, 46, CREAM, { wt: 900, wide: true, outline: 9 });
      g.restore();
      chip(g, 'WATCH NEXT ▶', 1240, 170, { px: 48, bg: YEL, s: pop(t, tHe - .2), rot: -.03, wide: true });
      if (t > tHe - .2) arrow(g, 900, 860, 1050, 700, seg(t, tHe - .2, tHe + .3), YEL, 9);
    }
    /* subscribe, and which company next */
    var sk = pop(t, tSu - .2, 3, .6);
    if (sk > 0) { g.save(); g.translate(440, 400); g.scale(clamp(sk, 0, 1.05), clamp(sk, 0, 1.05)); rr(g, -220, -60, 440, 120, 30); fillStroke(g, RED, 7); txt(g, 'SUBSCRIBE', 0, 4, 54, '#fff', { wt: 900, wide: true }); g.restore(); }
    bubble(g, ['WHICH COMPANY NEXT?'], 440, 700, pop(t, tWh - .2), { px: 40, bg: CREAM, tail: -.3 });
    var P = poseAt(t, [[s.t0, { lh: [-60, -150], rh: [130, -250], look: [.6, -.2], mouth: 'smile' }], [tSu, { rh: [100, -310], mouth: 'grin', eyes: 'happy' }]]);
    guy(g, 260, 1000, .85, P, YOU, t);
    g.restore();
    vignette(g, .35);
  }

  /* scenes: each starts just before its first line; wipe = how it arrives; part = a chapter card slams in the pause before it */
  var SC = [
    { id: 'prompt', name: 'One question tonight', t0: 0, draw: sPrompt },
    { id: 'hall', name: 'A hall of chips', t0: start('o2') - .3, draw: sHall, wipe: 'iris' },
    { id: 'one', name: 'Almost all from one company', t0: start('o3') - .3, draw: sOne, wipe: 'slide' },
    { id: 'thesis', name: 'A gaming company', t0: start('o5') - .3, draw: sThesis, wipe: 'slide' },
    { id: 'scale', name: 'Forty-two million to five trillion', t0: start('o7') - .3, draw: sScale, wipe: 'slide' },
    { id: 'toilets', name: 'The kid who cleaned toilets', t0: start('o11') - .3, draw: sToilets, wipe: 'iris' },
    { id: 'grave', name: 'Graphics graveyard', t0: start('o12') - .3, draw: sGrave, wipe: 'slide' },
    { id: 'ask', name: 'Three questions', t0: start('o16') - .3, draw: sAsk, wipe: 'slide' },
    { id: 'tease', name: 'The pinboard', t0: start('o19') - .3, draw: sTease, wipe: 'slide' },
    { id: 'title', name: 'Title', t0: start('title') - .45, draw: sTitle, wipe: 'iris' },
    { id: 'plane', name: 'Taiwan to America, 1973', t0: start('b1') - .3, draw: sPlane, wipe: 'slide', part: 'THE BOOTH', q: 'Who starts a chip company in a diner?' },
    { id: 'school', name: 'The wrong school', t0: start('b2') - .3, draw: sSchool, wipe: 'slide' },
    { id: 'roommate', name: 'The roommate', t0: start('b4') - .3, draw: sRoommate, wipe: 'slide' },
    { id: 'dennysjob', name: "A job at Denny's", t0: start('b6') - .3, draw: sDennysJob, wipe: 'iris' },
    { id: 'valley', name: 'Silicon Valley', t0: start('b8') - .3, draw: sValley, wipe: 'slide' },
    { id: 'booth', name: 'The booth', t0: start('b9') - .3, draw: sBooth, wipe: 'iris' },
    { id: 'found', name: 'April 5, 1993', t0: start('b11') - .3, draw: sFound, wipe: 'slide' },
    { id: 'name', name: 'Next version, envy', t0: start('b12') - .3, draw: sName, wipe: 'slide' },
    { id: 'pitch', name: 'The worst pitch', t0: start('b15') - .3, draw: sPitch, wipe: 'slide' },
    { id: 'valentine', name: 'If you lose my money', t0: start('b16') - .3, draw: sValentine, wipe: 'iris' },
    { id: 'curves', name: 'Curves versus triangles', t0: start('d1') - .3, draw: sCurves, wipe: 'slide', part: 'THIRTY DAYS FROM DEAD', q: 'How close did it come to dying?' },
    { id: 'sega', name: 'Pay us anyway', t0: start('d3') - .3, draw: sSega, wipe: 'slide' },
    { id: 'allin', name: 'All in on RIVA 128', t0: start('d6') - .3, draw: sAllIn, wipe: 'slide' },
    { id: 'payroll', name: 'One month of payroll', t0: start('d7') - .3, draw: sPayroll, wipe: 'slide' },
    { id: 'motto', name: 'The motto', t0: start('d9') - .3, draw: sMotto, wipe: 'iris' },
    { id: 'ipo', name: 'Twelve dollars a share', t0: start('g1') - .3, draw: sIPO, wipe: 'slide', part: 'THE GPU', q: 'What is a GPU, actually?' },
    { id: 'geforce', name: "The world's first GPU", t0: start('g2') - .3, draw: sGeForce, wipe: 'slide' },
    { id: 'pixels', name: 'Two million pixels', t0: start('g3') - .3, draw: sPixels, wipe: 'iris' },
    { id: 'profs', name: 'A few brilliant professors', t0: start('g5') - .3, draw: sProfs, wipe: 'slide' },
    { id: 'stadium', name: 'A stadium full of kids', t0: start('g6') - .3, draw: sStadium, wipe: 'slide' },
    { id: 'xbox', name: '3dfx and the Xbox', t0: start('g8') - .3, draw: sXbox, wipe: 'slide' },
    { id: 'tattoo', name: 'The tattoo', t0: start('g10') - .3, draw: sTattoo, wipe: 'iris' },
    { id: 'buck', name: 'Ian Buck', t0: start('c1') - .3, draw: sBuck, wipe: 'slide', part: 'THE BET NOBODY WANTED', q: 'Why did Wall Street hate it?' },
    { id: 'cuda', name: 'CUDA', t0: start('c3') - .3, draw: sCuda, wipe: 'iris' },
    { id: 'wallst', name: 'Wall Street sees the bill', t0: start('c5') - .3, draw: sWallSt, wipe: 'slide' },
    { id: 'keep', name: 'Keep paying anyway', t0: start('c8') - .3, draw: sKeep, wipe: 'slide' },
    { id: 'house', name: "A student's parents' house", t0: start('a1') - .3, draw: sHouse, wipe: 'slide', part: 'TWO CARDS', q: 'Where did modern AI come from?' },
    { id: 'train', name: 'Two GTX 580s', t0: start('a3') - .3, draw: sTrain, wipe: 'slide' },
    { id: 'same', name: 'The same simple sums', t0: start('a5') - .3, draw: sSame, wipe: 'iris' },
    { id: 'luck', name: 'Just lucky?', t0: start('a6b') - .3, draw: sLuck, wipe: 'slide' },
    { id: 'dgx', name: 'The first DGX-1', t0: start('a7') - .3, draw: sDGX, wipe: 'slide' },
    { id: 'crypto', name: 'The crypto crash', t0: start('a10') - .3, draw: sCrypto, wipe: 'slide' },
    { id: 'chatgpt', name: 'ChatGPT', t0: start('r1') - .3, draw: sChatGPT, wipe: 'iris', part: 'THE GOLD RUSH', q: 'What happened after ChatGPT?' },
    { id: 'rush', name: 'Sell shovels', t0: start('r3') - .3, draw: sRush, wipe: 'slide' },
    { id: 'h100', name: 'The H100', t0: start('r5') - .3, draw: sH100, wipe: 'slide' },
    { id: 'plaque', name: 'The plaque', t0: start('r6') - .3, draw: sPlaque, wipe: 'iris' },
    { id: 'podium', name: 'Number one', t0: start('r7') - .3, draw: sPodium, wipe: 'slide' },
    { id: 'deepseek', name: 'DeepSeek day', t0: start('r8') - .3, draw: sDeepSeek, wipe: 'slide' },
    { id: 'climb', name: 'Four, then five trillion', t0: start('r10') - .3, draw: sClimb, wipe: 'slide' },
    { id: 'now', name: 'October 2026', t0: start('n1') - .3, draw: sNow, wipe: 'iris', part: 'RIGHT NOW', q: 'Where is it this month?' },
    { id: 'rubin', name: 'Vera Rubin', t0: start('n4') - .3, draw: sRubin, wipe: 'slide' },
    { id: 'wobble', name: 'Not a straight line', t0: start('n5') - .3, draw: sWobble, wipe: 'slide' },
    { id: 'share', name: 'That twelve-dollar share', t0: start('n7') - .3, draw: sShare, wipe: 'slide' },
    { id: 'jensen', name: 'Still the CEO', t0: start('n8') - .3, draw: sJensen, wipe: 'iris' },
    { id: 'split', name: 'Why it matters', t0: start('e1') - .3, draw: sSplit, wipe: 'slide' },
    { id: 'rivals', name: 'Knock it off the top', t0: start('e4') - .3, draw: sRivals, wipe: 'slide' },
    { id: 'diner', name: 'Same diner, tonight', t0: start('e5') - .3, draw: sDiner, wipe: 'iris' },
    { id: 'card', name: 'Watch next', t0: start('e7') - .3, draw: sCard, wipe: 'slide' }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  /* the part cards land in the pause before each part's first line */
  var PARTS = [];
  SC.forEach(function (s, i) { if (s.part) { var prev = VO.lines[VO.lines.indexOf(LINE[firstLine(s)]) - 1]; PARTS.push({ t: prev.t1 + 1.3, n: PARTS.length + 1, text: s.part, q: s.q, scene: s }); } });
  function firstLine(s) { for (var i = 0; i < VO.lines.length; i++) if (VO.lines[i].t0 >= s.t0) return VO.lines[i].id; }
  /* YouTube chapters (each ≥ 10 s, first at 0:00) */
  var CHAPTERS = [['A gaming company runs AI', 0]].concat(PARTS.map(function (p) { return [(p.text.charAt(0) + p.text.slice(1).toLowerCase()).replace(/\bgpu\b/, 'GPU'), Math.max(0, p.t - .1)]; })).concat([['Why it matters', S('split').t0]]);

  /* ---------- part cards: slam in big, then park top-left as a label for the part ---------- */
  function partCards(g, t) {
    for (var i = 0; i < PARTS.length; i++) {
      var c = PARTS[i], nx = i + 1 < PARTS.length ? PARTS[i + 1].t : S('split').t0;
      if (t < c.t || t > nx) continue;
      /* the finished quote holds 1.3 s clear, then the card slams in, holds 2.4 s, and parks */
      var u = t - c.t, k = eio(seg(u, 2.4, 2.85));
      font(g, 120, 900, DISP, true); var tw0 = g.measureText(c.text).width, tpx = Math.min(120, 120 * 1300 / tw0), tw = tw0 * tpx / 120, cw = Math.max(tw + 160, 1000), ch = 380;
      var s = lerp(1, .26, k), px = lerp(W / 2, 24 + cw * s / 2, k), py = lerp(H / 2, 22 + ch * s / 2, k);
      if (k < 1) { g.fillStyle = 'rgba(14,10,28,' + (.9 * (1 - k) * clamp(u * 6, 0, 1)) + ')'; g.fillRect(0, 0, W, H); }
      var sl = pop(t, c.t, 2.8, .5), sc = s * lerp(1.6, 1, clamp(sl, 0, 1));
      g.save(); g.translate(px, py); g.scale(sc, sc); g.rotate(lerp(-.04, -.015, k) + knock(t, c.t + .1, 30, 9) * .05);
      g.globalAlpha = clamp(sl * 3, 0, 1) * (t > nx - .3 ? 1 - seg(t, nx - .3, nx) : 1) * (k >= 1 ? .92 * (QUOTE_ON || !LIVE.text ? 0 : 1) : 1);
      rr(g, -cw / 2 + 16, -ch / 2 + 20, cw, ch, 26); g.fillStyle = 'rgba(8,6,18,.5)'; g.fill();
      rr(g, -cw / 2, -ch / 2, cw, ch, 26); fillStroke(g, YEL, 10);
      g.fillStyle = INK; g.fillRect(-cw / 2, -ch / 2 + 20, 16, ch - 40);
      txt(g, 'PART ' + c.n + ' OF 7', 0, -110, 52, INK, { fam: MONO, wt: 700, ls: 6 });
      txt(g, c.text, 0, 14, tpx, INK, { wt: 900, wide: true });
      if (c.q) txt(g, c.q, 0, 122, 46, INK, { wt: 800, a: (1 - k) * seg(u, .5, .8) });
      g.restore();
    }
  }

  /* ---------- captions: one card per phrase, stressed words in yellow ---------- */
  var EMPH = /\d|^(nvidia|gaming|games|ai|gpu|cpu|cuda|denny's|toilets|toilet|thirty|dead|stadium|kids|professors|triangles|curves|trillion|billion|million|shovels|lucky|crypto|chatgpt|openai|record|biggest|first|everything|anyway|kill|harder|twelve|remember)\b/i;
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

  /* YouTube thumbnail (1920×1080, saved at 1280×720): Jensen and a grinning chip, "$5 TRILLION / FROM A DENNY'S" */
  function thumb(g) {
    var t = 2.2; g.setTransform(1, 0, 0, 1, 0, 0);
    wall(g, '#132108', '#070c03'); grid(g, 120, 'rgba(182,240,90,.08)');
    glow(g, 1530, 520, 600, 'rgba(118,185,0,.6)', 1);
    chipD(g, 1530, 500, 1.7, t, { face: 'grin', glow: 1, label: 'GPU' });
    guy(g, 1140, 1200, 1.6, { lh: [-60, -150], rh: [170, -290], lf: [-26, 0], rf: [26, 0], hip: 0, lean: -.05, tilt: 0, look: [.6, -.2], eyes: 'dot', brow: 1, mouth: 'smirk', jump: 0, front: 0 }, JEN, t);
    function slab(s, x, y, px, bg, fg, rot) { g.save(); g.translate(x, y); g.rotate(rot); font(g, px, 900, DISP, true); var w = g.measureText(s).width + px * .6; rr(g, -w / 2, -px * .72, w, px * 1.44, 26); fillStroke(g, bg, 14); txt(g, s, 0, px * .06, px, fg, { wt: 900, wide: true, outline: fg === '#fff' ? px * .1 : 0 }); g.restore(); }
    slab('$5 TRILLION', 560, 260, 120, NV, '#fff', -.05);
    g.save(); g.translate(560, 480); g.rotate(-.03); txt(g, 'FROM A', 0, 0, 100, CREAM, { wt: 900, wide: true, outline: 20 }); g.restore();
    slab("DENNY'S", 560, 690, 130, YEL, RED, -.04);
    vignette(g, .35);
  }

  /* ---------- frame ---------- */
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = NIGHT; g.fillRect(0, 0, W, H);
    var i = sceneAt(t), s = SC[i]; QUOTE_ON = false;
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
    PARTS.forEach(function (c, i) { var nx = i + 1 < PARTS.length ? PARTS[i + 1].t : S('split').t0; if (t >= c.t && t < nx) out.push({ id: 'part' + i, text: 'PART ' + c.n + ' ' + c.text }); });
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [];
  function E(t, type, o) { EV.push(Object.assign({ t: t, type: type }, o || {})); }
  function words(id, list, type, o, off) { list.forEach(function (w) { E(at(id, w) + (off || -.08), type, o); }); }
  function initTimes() {
    var i;
    /* cold open */
    E(at('o1', 'type') + .1, 'receipt', { t1: at('o1', 'tonight') + .1 }); E(start('o2') - .1, 'zip', { t1: start('o2') + .8 });
    E(start('o2'), 'hum', { t1: start('o3') - .3 }); for (i = 0; i < 10; i++) E(start('o2') + .4 + i * .3, 'blip', { f: 900 + i * 80, g: .05 });
    E(start('o3') + .2, 'pop', { g: .7 }); E(at('o4', 'dennys') - .1, 'stamp', { small: true }); E(at('o4', 'games.') - .1, 'pop', { g: .8 });
    E(start('o5') - .1, 'paper'); E(start('o6') - .2, 'stamp'); words('o6', ['gaming', 'math', 'ai.'], 'paper', { g: 1.2 }, -.08);
    E(start('o7') - .1, 'boing'); E(start('o8') - .1, 'register'); E(start('o9') - .1, 'clocktick', { t1: end('o9') }); E(start('o10') - .1, 'stamp', { big: true });
    E(start('o11') - .2, 'whoosh'); E(start('o11') + .3, 'flies', { t1: end('o11') });
    E(start('o12') - .2, 'powerdown'); E(start('o13') - .1, 'thump', { g: .5 }); E(start('o14') - .1, 'register'); E(start('o15') - .1, 'stamp');
    words('o16', ['games'], 'paper', { g: 1.4 }, -.25); E(start('o17') - .2, 'paper'); E(start('o18') - .2, 'paper');
    E(start('o19') - .2, 'paper', { g: 1.3 }); E(start('o20') - .1, 'pop', { g: .7 }); E(start('o20') + .6, 'pop', { g: .7 }); E(start('o20') + 1.2, 'pop', { g: .7 });
    /* title */
    ['the', 'whole', 'history', 'of'].forEach(function (w) { E(at('title', w) - .06, 'tick', { g: .25 }); }); E(at('title', 'nvidia.') - .06, 'stamp', { big: true });
    PARTS.forEach(function (c) { E(c.t - .02, 'slam'); E(c.t + 2.4, 'swish'); });
    /* part 1 */
    E(start('b1'), 'engine', { t1: end('b1') }); E(start('b2') + .2, 'paper'); E(start('b3'), 'rushw', { t1: end('b3') - .3 });
    E(start('b4') + .2, 'pop', { g: .6 }); E(start('b5') + .3, 'thump', { g: .4 }); E(start('b6') + .2, 'clunk'); E(start('b7') - .1, 'paper');
    E(start('b8') - .2, 'whoosh'); E(start('b9'), 'clocktick', { t1: end('b10') }); E(at('b9', 'dennys') - .1, 'ding1');
    E(start('b11') - .1, 'flip'); E(start('b11') + 1.2, 'register'); E(start('b12') + .3, 'paper'); E(start('b13') + .5, 'buzzbad'); E(start('b14') + .2, 'ding');
    E(start('b15') - .1, 'gulp'); E(start('b16'), 'paper'); E(start('b17') - .1, 'stamp', { big: true });
    /* part 2 */
    E(start('d1') + .3, 'pop', { g: .7 }); E(at('d2', 'triangles.') - .1, 'pop', { g: .8 }); E(at('d2', 'dead.') - .1, 'buzzbad');
    E(start('d3') + .2, 'pop', { g: .6 }); E(at('d4', 'wild.') - .1, 'stamp', { small: true }); E(at('d5', 'yes.'), 'ding'); E(at('d5', '5') - .1, 'register'); E(at('d5', 'six') - .1, 'clocktick', { t1: end('d5') });
    E(at('d6', 'half') - .1, 'fall', { t1: at('d6', 'half') + 1.2 }); E(at('d6', 'everything') - .1, 'receipt', { t1: at('d6', 'everything') + .8 }); E(at('d6', 'riva'), 'ding1');
    E(start('d7'), 'engine', { t1: end('d8') }); E(at('d7', 'month') - .1, 'stamp', { small: true }); E(at('d8', 'million') - .1, 'rise', { t1: at('d8', 'four') + .4 }); E(at('d8', 'four') + .4, 'ding');
    E(start('d10') - .1, 'clocktick', { t1: end('d10') + .5 }); E(at('d10', 'thirty') - .1, 'thump', { g: .5 });
    /* part 3 */
    E(at('g1', '12') - .1, 'register'); E(at('g1', 'remember') - .1, 'paper'); E(at('g2', 'geforce') - .2, 'whoosh'); E(at('g2', 'first') - .1, 'stamp', { big: true });
    E(start('g3') - .1, 'pop', { g: .7 }); E(at('g4', 'two') - .2, 'zip', { t1: at('g4', 'two') + .8 }); E(at('g4', 'sixty') - .1, 'blip', { f: 1300, g: .1 });
    E(at('g5', 'professors.') - .1, 'paper'); E(at('g5', 'one') - .1, 'clocktick', { t1: end('g5') });
    E(at('g6', 'stadium') - .2, 'rushw', { t1: end('g6') }); E(at('g6', 'same') - .1, 'shimmer', { t1: end('g6') + .3 }); E(at('g6b', 'red') - .1, 'pop', { g: .6 }); E(at('g6b', 'darkens') - .1, 'pop', { g: .6 }); E(at('g6b', 'done.') - .1, 'ding');
    E(at('g7', 'wins.') - .1, 'stamp', { big: true });
    E(at('g8', 'remains') - .1, 'clunk'); E(at('g9', 'xbox,') - .1, 'whoosh'); E(at('g9', '200') - .1, 'register'); E(at('g10', '100') - .1, 'ding1'); E(at('g10', 'tattooed') - .1, 'zip', { t1: at('g10', 'tattooed') + 1.0 });
    /* part 4 */
    E(at('c1', 'wiring') - .1, 'clunk'); E(at('c2', 'language') - .1, 'receipt', { t1: at('c2', 'hires') - .3 }); E(at('c2', 'hires') + .1, 'stamp', { small: true });
    E(at('c3', 'cuda.') - .1, 'stamp', { big: true }); words('c3', ['weather,', 'medicine,', 'physics.'], 'pop', { g: .7 }, -.15);
    E(start('c4') - .1, 'whoosh'); E(at('c4b', 'find') - .1, 'ding1');
    E(at('c5', 'bill,') - .1, 'receipt', { t1: at('c5', 'bill,') + .6 }); E(at('c6', 'faulty') - .1, 'glitch', { t1: at('c6', 'faulty') + .6 }); E(at('c6', '31') - .1, 'fall', { t1: at('c6', '31') + 1.0 }); E(at('c6', '31') + .1, 'stamp');
    E(at('c7', 'three') - .1, 'powerdown'); E(at('c8', 'remember') - .1, 'paper'); E(at('c8', 'keeps') - .1, 'register'); words('c9', ['market', 'yet.'], 'paper', { g: 1.2 }, -.08);
    /* part 5 */
    E(start('a1'), 'clocktick', { t1: at('a1', 'house.') }); E(at('a2', 'pictures.') - .2, 'paper', { g: 1.3 });
    E(at('a3', 'two') - .2, 'hum', { t1: start('a4') - .2 }); E(at('a3', 'week.') - .1, 'flip'); E(at('a4', '15') - .2, 'rise', { t1: at('a4', '15') + .3 }); E(at('a4', '26') - .2, 'rise', { t1: at('a4', '26') + .3 }); E(at('a4', 'mile:'), 'stamp', { big: true });
    E(at('a5', 'millions') - .2, 'rushw', { t1: end('a5') + .2 }); words('a6', ['games.', 'ai.'], 'paper', { g: 1.2 }, -.08);
    E(at('a6b', 'partly') - .05, 'stamp', { small: true }); E(at('a6b', 'standing') - .7, 'engine', { t1: at('a6b', 'standing') + .5 }); E(at('a6b', 'standing') + .4, 'ding');
    E(at('a7', 'all') - .1, 'whoosh'); E(at('a7', 'openai.') - .1, 'dingdong'); E(at('a8', 'future') - .2, 'receipt', { t1: end('a8') }); E(at('a9', 'ilya') - .1, 'ding1'); E(at('a9', 'students') - .1, 'paper');
    E(at('a10', 'miners') - .1, 'clunk'); E(at('a10', 'crashes') - .1, 'fall', { t1: at('a10', 'crashes') + .8 }); E(at('a10', 'crashes') + .7, 'thump', { g: .6 }); E(at('a11', 'fine') - .05, 'stamp');
    /* part 6 */
    E(at('r1', 'chatgpt.') - .1, 'ding1', { f: 1 }); E(at('r2', 'supercomputer') - .3, 'hum', { t1: end('r2') + .2 });
    E(at('r3', 'giant') - .6, 'rush', { t1: at('r3', 'one') + .6 }); words('r4', ['gold', 'shovels.'], 'paper', { g: 1.3 }, -.08); E(at('r4', 'shovels.') + .3, 'clunk');
    E(at('r5', 'h100,') - .2, 'shimmer', { t1: at('r5', 'tens') }); E(at('r5', 'tens') - .1, 'register'); for (i = 0; i < 6; i++) E(at('r5', 'wait') + i * .25, 'flip', { g: .5 });
    E(at('r6', 'trillion') - .1, 'register'); E(at('r6', 'plaque') - .1, 'clunk'); E(at('r7', 'passes') - .1, 'rise', { t1: at('r7', 'passes') + .8 }); E(at('r7', 'most') - .1, 'ding');
    E(at('r8', 'deepseek') - .1, 'pop', { g: .7 }); E(at('r8', 'loses') - .1, 'fall', { t1: at('r8', 'loses') + 1.2 }); E(at('r8', 'loses') + 1.1, 'boom'); E(start('r9') + .1, 'stamp', { big: true });
    E(start('r10'), 'rise', { t1: at('r10', '5') + .3 }); E(at('r10', '4') - .1, 'ding1'); E(at('r10', '5') - .1, 'ding'); E(at('r10', 'first'), 'stamp');
    /* part 7 */
    E(start('n1') + .1, 'flip'); E(at('n2', '96.2') - .3, 'receipt', { t1: at('n2', '96.2') + .6 }); E(at('n2', '96.2') + .6, 'register'); E(at('n2', '89') - .2, 'receipt', { t1: at('n2', '89') + .5 }); E(at('n3', 'nine') - .1, 'pop', { g: .8 }); E(at('n3', 'gaming') - .05, 'buzzbad');
    E(at('n4', 'vera') - .3, 'engine', { t1: end('n4') }); E(at('n4', '108') - .1, 'register'); E(at('n4', 'china.') - .05, 'stamp', { small: true });
    E(at('n5', 'record,') - .1, 'ding1'); for (i = 0; i < 8; i++) E(at('n5', 'eight') - .2 + i * .17, 'thump', { g: .25 }); E(start('n6') - .1, 'whoosh'); E(at('n6', '5.2') - .1, 'stamp', { big: true });
    E(at('n7', 'remember') - .1, 'paper'); for (i = 0; i < 6; i++) E(at('n7', 'splits,') - .6 + i * (at('n7', '480') - at('n7', 'splits,') + .7) / 6, 'flip', { g: .7 }); E(at('n7', '104') - .1, 'register');
    E(at('n8', 'jacket.') - .1, 'zip', { t1: at('n8', 'jacket.') + .5 }); E(at('n8b', 'toilets') - .1, 'flies', { t1: at('n8b', '200') }); E(at('n8b', '200') - .1, 'register'); words('n9', ['million', 'harder'], 'paper', { g: 1.3 }, -.08);
    /* ending */
    E(start('e1') - .1, 'gulp'); E(at('e2', 'cousins') - .2, 'shimmer', { t1: end('e2') }); E(at('e3', 'paid') - .2, 'receipt', { t1: end('e3') }); words('e3b', ['stadium', 'kept', 'standing'], 'paper', { g: 1.2 }, -.2);
    words('e4', ['google,', 'amazon', 'amd'], 'pop', { g: .7 }, -.2); E(at('e4', 'knock') - .05, 'thump', { g: .5 }); E(at('e4b', 'not') - .05, 'stamp', { g: .6 }); E(at('e4b', 'for') - .1, 'pop', { g: .5 });
    E(start('e5') - .2, 'projector', { t1: start('e6') - .3 }); E(at('e6', 'type') + .1, 'receipt', { t1: at('e6', 'type') + .9 }); E(at('e6', 'type') + .4, 'zip', { t1: at('e6', 'chips.') - .2 }); E(at('e6', 'chips.') - .1, 'ding');
    E(at('e7', 'cable') - .1, 'whoosh'); E(at('e7', 'cut') - .05, 'zap', { t1: at('e7', 'cut') + .4 }); E(at('e7', 'here.') - .1, 'ding'); E(at('e8', 'subscribe') - .1, 'click'); E(at('e8', 'which') - .1, 'pop', { g: .7 });
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
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: end('title') + .3, SLUG: 'nvidia', SHOTS: SHOTS, CHAPTERS: CHAPTERS, thumb: function () { thumb(ctx); }, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
