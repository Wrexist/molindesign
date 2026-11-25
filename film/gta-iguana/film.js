/* "GTA 6 has iguanas": Delta, "It has X, shown" + real Florida (slug gta-iguana). Sources in BRIEF.md.
   Rockstar's Only in Leonida page captions a screenshot "An iguana walks in front of a mobility scooter in the Leonida
   Keys…"; in real Florida, FWC calls green iguanas invasive, NWS Miami once forecast falling iguanas, and 5,195 cold-
   stunned green iguanas were brought to FWC sites on Feb 1–2, 2026.
   Set: Rockstar's screenshot as a paper PHOTO PRINT (front = Rockstar's picture, back = Rockstar's own caption);
   the real-Florida half is a field guide on cream paper. Native move: our cut-paper iguana (spikes, throat fan,
   ringed tail) that walks, stands for the ID leaders, tips off a palm and topples in the cold.
   Footage: the screenshot (a still, three uses, each < 5 s), Launch Trailer plate 9.30-11.15, Trailer 1 plate
   21.80-23.20 (dip only). The trailer iguana shot is NOT used (gta-everytrailer already has it, SAFE-EDIT rule 7).
   Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Engine from gta-holdup. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var INK = '#0d1b1e', CREAM = '#fbf3e4', RED = '#e0303a', PINK = '#e6337a', SUN = '#ffc94a', TEAL = '#1f6f6b', PAPER = '#efe3c8', KRAFT = '#c9955a';
  var DISP = 'Archivo', MONO = '"Geist Mono"';
  var BX0 = 90, BX1 = 930, BY1 = 1430, TAU = Math.PI * 2;

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function ein(k) { return k * k * k; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function kn(t, a, amt) { if (t < a) return 1; var u = t - a; return 1 + (amt || .08) * (1 - Math.exp(-u * 40)) * Math.exp(-u * 7); }
  function hx(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, k) { var p = hx(a), q = hx(b); return 'rgb(' + Math.round(lerp(p[0], q[0], k)) + ',' + Math.round(lerp(p[1], q[1], k)) + ',' + Math.round(lerp(p[2], q[2], k)) + ')'; }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}, ORDER = []; VO.lines.forEach(function (l) { LINE[l.id] = l; ORDER.push(l.id); });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w).indexOf(norm(word)) === 0 && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function endw(id, word, nth) { return find(id, word, nth).t1; }
  function start(id) { return LINE[id].t0; }
  function lastw(id) { var w = LINE[id].words; return w[w.length - 1].t1; }

  /* ---------- the SFX gate: hits sit in pauses (vo/vad.js) ---------- */
  var EDGES = [], VOICED = [];
  if (window.VAD) window.VAD.forEach(function (v) { VOICED.push({ t0: v[0], t1: v[1] }); EDGES.push(v[0], v[1]); });
  else VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  function free(m) {
    var B = [], M = [], F = [], p = 0;
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { swish: .22, slap: .1, tock: .06, pop: .1, flick: .07, flip: .16, drop: .3, thud: .18 };
  function nearGap(t, type, m) {
    var bd = BODY[type] || .12, best = null;
    free(m || .1).forEach(function (f) { var lo = f[0], hi = f[1] - bd; if (hi < lo) return; var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c; });
    return best;
  }
  var GT = {}, EV = [];
  /* a hit: snapped into the nearest pause within tol; the picture keeps its own time (the hit is sound only) */
  function G(id, t, type, tol, gain) {
    var n = nearGap(t, type);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .3 : tol)) { GT[id] = n; EV.push({ t: n, type: type, g: gain == null ? 1 : gain, id: id }); }
    else GT[id] = t;
    return t;
  }

  /* ---------- canvas + safe-area check ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true }, LIVE2 = { bg: true, clip: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  var BOUNDS = null, NOREC = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || NOREC || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys), d = Math.min.apply(null, ys);
    if (d > BY1 || b < SAFE.x0 || a > SAFE.x1) return;
    if (a < SAFE.x0 - .5 || b > SAFE.x1 + .5 || c > SAFE.y1 + .5 || d < 300 - .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c), y0: Math.round(d) });
  }
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS) { var mm = this.measureText(str); recBox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent, str); }
      return orig.apply(this, arguments);
    };
  }

  /* ---------- type ---------- */
  function cond(g, st) { g.__st = st || 'extra-condensed'; try { g.fontStretch = g.__st; } catch (e) {} }
  function unst(g) { g.__st = null; try { g.fontStretch = 'normal'; } catch (e) {} }
  function font(g, px, wt, fam) { g.font = (wt || 900) + ' ' + px + 'px ' + (fam || DISP); if (g.__st) try { g.fontStretch = g.__st; } catch (e) {} }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  /* condensed display text; returns its width. o: align, col, st, wt, ls, max (shrinks to fit, never under 36 px) */
  function T2(g, s, x, y, px, o) {
    o = o || {}; px = Math.max(36, px);
    g.save(); cond(g, o.st || 'condensed'); font(g, px, o.wt || 900); ls(g, o.ls == null ? 1 : o.ls);
    if (o.max) while (g.measureText(s).width > o.max && px > 36) { px -= 2; font(g, px, o.wt || 900); }
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.fillStyle = o.col || CREAM;
    if (o.a != null) g.globalAlpha *= clamp(o.a, 0, 1);
    g.fillText(s, x, y + px * .04); var w = g.measureText(s).width; g.restore(); unst(g); return w;
  }
  function M2(g, s, x, y, px, o) {
    o = o || {}; g.save(); font(g, Math.max(36, px), o.wt || 700, MONO); ls(g, o.ls == null ? 1 : o.ls);
    g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.fillStyle = o.col || CREAM;
    if (o.a != null) g.globalAlpha *= clamp(o.a, 0, 1);
    g.fillText(s, x, y); var w = g.measureText(s).width; g.restore(); return w;
  }
  function tw(s, px, st, wt) { var m = mk(4, 4).getContext('2d'); cond(m, st || 'condensed'); font(m, px, wt || 900); ls(m, 1); var w = m.measureText(s).width; unst(m); return w; }
  function chip(g, s, x, y, px, bg, fg, o) {
    o = o || {}; var w = tw(s, px) + px * .8, h = px * 1.3;
    g.save(); g.translate(x, y); if (o.rot) g.rotate(o.rot); if (o.sc) g.scale(o.sc, o.sc);
    rr(g, -w / 2 + 5, -h / 2 + 7, w, h, 10); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 10); g.fillStyle = bg; g.fill();
    if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = 4; g.stroke(); }
    T2(g, s, 0, 0, px, { col: fg }); g.restore(); return w;
  }
  /* wrapped words with per-word highlight (k 0..1 sweeps the SUN box in); returns the block height */
  function para(g, words, x, y, maxw, px, lh, col, hl, o) {
    o = o || {}; g.save(); cond(g, 'condensed'); font(g, px, o.wt || 800); ls(g, .5); g.textBaseline = 'alphabetic';
    var sp = px * .26, lines = [[]], lw = [0];
    words.forEach(function (w, i) {
      var ww = g.measureText(w).width, L = lines.length - 1;
      if (lw[L] > 0 && lw[L] + sp + ww > maxw) { lines.push([]); lw.push(0); L++; }
      lines[L].push([w, ww, i]); lw[L] += (lw[L] > 0 ? sp : 0) + ww;
    });
    lines.forEach(function (ln, li) {
      var xx = o.center ? x + (maxw - lw[li]) / 2 : x, yy = y + li * lh + px * .8;
      ln.forEach(function (it, j) {
        var k = hl ? hl(it[2]) : 0;
        if (k > 0) { var nx = j < ln.length - 1 ? sp : 0; g.fillStyle = SUN; g.fillRect(xx - 5, yy - px * .84, (it[1] + nx * (hl(it[2] + 1) > 0 ? 1 : 0) + 10) * eo(k), px * 1.06); }
        g.fillStyle = col; g.fillText(it[0], xx, yy); xx += it[1] + sp;
      });
    });
    g.restore(); unst(g); return lines.length * lh;
  }

  /* =====================================================================================================
     THE SET. Game half: teal ink with Rockstar's screenshot blurred behind a PAPER PHOTO PRINT of it
     (cream border, slight tilt). The print flips over to show Rockstar's caption on its back.
     Real-Florida half: a field guide on cream paper; our cut-paper iguana is the one creature.
     ===================================================================================================== */
  var HOOKB = { x: 90, y: 590, w: 840, h: 840, rot: -.012 }, BACKB = { x: 90, y: 612, w: 840, h: 818, rot: .01 }, STRB = { x: 90, y: 636, w: 840, h: 690, rot: -.008 };
  var T = {}, U = {};
  function lbox(a, b, k) { return { x: lerp(a.x, b.x, k), w: lerp(a.w, b.w, k), y: lerp(a.y, b.y, k), h: lerp(a.h, b.h, k), rot: lerp(a.rot || 0, b.rot || 0, k) }; }

  var BG, NOISE, BLUR, PAPERBG;
  function buildBG() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(11);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#12302f'); gr.addColorStop(.55, '#0d2224'); gr.addColorStop(1, '#081517'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (var k = 0; k < 5000; k++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.022)' : 'rgba(0,0,0,.06)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    return c;
  }
  function buildPaper() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(23);
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    for (var i = 0; i < 900; i++) { g.strokeStyle = r() < .5 ? 'rgba(120,90,50,.07)' : 'rgba(255,255,255,.18)'; g.lineWidth = 1 + r(); var x = r() * W, y = r() * H, a = r() * TAU, l = 6 + r() * 26; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    for (var k = 0; k < 7000; k++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(80,60,30,.045)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    var vg = g.createRadialGradient(510, 900, 380, 510, 900, 1300); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(90,60,20,.22)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }
  /* the screenshot, blurred full-bleed behind the print (built once from the decoded frame) */
  function buildBlur() {
    var img = CLIP.frameAt(U.s1, 0).img, c = mk(W, H), g = c.getContext('2d');
    var s = Math.max(W / img.naturalWidth, H / img.naturalHeight) * 1.15, dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    g.filter = 'blur(26px) saturate(1.1)'; g.drawImage(img, W / 2 - dw * .3, H / 2 - dh / 2, dw, dh); g.filter = 'none';
    g.fillStyle = 'rgba(6,18,20,.58)'; g.fillRect(0, 0, W, H);
    return c;
  }

  /* ---------- the cut-paper iguana (our drawing): facing left, origin at mid-body, ~1050 units long ----------
     o: walk (phase), frost 0..1 (cold tint), back (lying on its back), rot, flipX */
  var TOP = [[-268, -70], [-150, -82], [0, -84], [150, -70], [240, -36], [300, -8]];
  function topY(x) { for (var i = 0; i < TOP.length - 1; i++) if (x <= TOP[i + 1][0]) return lerp(TOP[i][1], TOP[i + 1][1], (x - TOP[i][0]) / (TOP[i + 1][0] - TOP[i][0])); return TOP[TOP.length - 1][1]; }
  function iguana(g, x, y, s, o) {
    o = o || {}; var fr = o.frost || 0, ph = o.walk || 0;
    var G1 = mix('#5aa83a', '#8fa7b4', fr), G2 = mix('#2c5e22', '#4d6270', fr), G3 = mix('#a9d46c', '#c9d6dd', fr), RG = mix('#1c3a18', '#33434d', fr);
    if (o.pal) { G1 = o.pal; G2 = mix(o.pal, '#0d1b1e', .45); G3 = mix(o.pal, '#ffffff', .4); RG = mix(o.pal, '#0d1b1e', .65); }
    g.save(); g.translate(x, y); if (o.sq) g.scale(1 / Math.sqrt(o.sq), o.sq); if (o.rot) g.rotate(o.rot); g.scale(s * (o.flipX ? -1 : 1), s * (o.back ? -1 : 1));
    g.shadowColor = 'rgba(0,0,0,.28)'; g.shadowOffsetX = 5; g.shadowOffsetY = 8; g.shadowBlur = 0;
    g.lineCap = 'round'; g.lineJoin = 'round';
    function leg(hx0, hy0, sw, col, front) {
      var kx = hx0 + (front ? -44 : 44) + sw, ky = hy0 + 48, fx = hx0 + (front ? -78 : 18) + sw * 1.6, fy = hy0 + 74;
      g.strokeStyle = col; g.lineWidth = 26; g.beginPath(); g.moveTo(hx0, hy0); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke();
      g.lineWidth = 7; for (var i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + (front ? -26 : 26) + i * 6, fy + 6 + i * 9); g.stroke(); }
    }
    var a = 16 * Math.sin(ph), b = -a;
    leg(-175, 42, b, G2, true); leg(125, 42, a, G2, false);
    /* tail with dark rings */
    function tp(u) { var p0 = [280, 12], p1 = [470, 46], p2 = [628, -6]; var m = 1 - u; return [m * m * p0[0] + 2 * m * u * p1[0] + u * u * p2[0], m * m * p0[1] + 2 * m * u * p1[1] + u * u * p2[1]]; }
    function tn(u) { var a1 = tp(Math.max(0, u - .01)), b1 = tp(Math.min(1, u + .01)), dx = b1[0] - a1[0], dy = b1[1] - a1[1], l = Math.hypot(dx, dy); return [-dy / l, dx / l]; }
    function tw2(u) { return 40 * (1 - u) + 4 * u; }
    g.beginPath();
    for (var i = 0; i <= 24; i++) { var u = i / 24, p = tp(u), n = tn(u), w = tw2(u); if (i === 0) g.moveTo(p[0] + n[0] * w, p[1] + n[1] * w); else g.lineTo(p[0] + n[0] * w, p[1] + n[1] * w); }
    for (var j = 24; j >= 0; j--) { var u2 = j / 24, p2 = tp(u2), n2 = tn(u2), w2 = tw2(u2); g.lineTo(p2[0] - n2[0] * w2, p2[1] - n2[1] * w2); }
    g.closePath(); g.fillStyle = G1; g.fill();
    g.shadowColor = 'rgba(0,0,0,0)';
    [.26, .4, .54, .68, .82].forEach(function (u0) {
      g.beginPath(); var q = [];
      for (var k = 0; k <= 4; k++) { var uu = u0 + .065 * k / 4, pp = tp(uu), nn = tn(uu), ww = tw2(uu) + .5; q.push([pp[0] + nn[0] * ww, pp[1] + nn[1] * ww]); }
      for (var k2 = 4; k2 >= 0; k2--) { var uu2 = u0 + .065 * k2 / 4, pq = tp(uu2), nq = tn(uu2), wq = tw2(uu2) + .5; q.push([pq[0] - nq[0] * wq, pq[1] - nq[1] * wq]); }
      q.forEach(function (pt, ii) { if (ii === 0) g.moveTo(pt[0], pt[1]); else g.lineTo(pt[0], pt[1]); }); g.closePath(); g.fillStyle = RG; g.fill();
    });
    g.shadowColor = 'rgba(0,0,0,.28)';
    /* spikes (behind the body line) */
    g.fillStyle = G2;
    for (var sx = -262; sx <= 300; sx += 19) {
      var ty = topY(sx), h = (sx < 240 ? 40 - 22 * (sx + 262) / 502 : 12);
      g.beginPath(); g.moveTo(sx - 8, ty + 6); g.lineTo(sx + 7, ty - h); g.lineTo(sx + 9, ty + 6); g.closePath(); g.fill();
    }
    /* body */
    g.beginPath(); g.moveTo(-268, -70);
    for (var bi = 1; bi < TOP.length; bi++) g.lineTo(TOP[bi][0], TOP[bi][1]);
    g.lineTo(300, 34); g.quadraticCurveTo(160, 86, 0, 82); g.quadraticCurveTo(-170, 78, -250, 48); g.closePath();
    g.fillStyle = G1; g.fill();
    g.shadowColor = 'rgba(0,0,0,0)';
    g.beginPath(); g.ellipse(-10, 46, 210, 26, 0, 0, TAU); g.fillStyle = G3; g.globalAlpha *= .55; g.fill(); g.globalAlpha /= .55;
    g.strokeStyle = G2; g.lineWidth = 5; for (var st = -150; st <= 200; st += 70) { g.beginPath(); g.moveTo(st, -60); g.quadraticCurveTo(st + 18, -10, st - 4, 40); g.stroke(); }
    g.shadowColor = 'rgba(0,0,0,.28)';
    /* near legs */
    leg(-150, 52, a, G1, true); leg(160, 52, b, G1, false);
    /* head */
    g.beginPath(); g.moveTo(-235, -76); g.quadraticCurveTo(-300, -100, -362, -86); g.quadraticCurveTo(-412, -72, -430, -36); g.quadraticCurveTo(-434, -10, -404, 2);
    g.lineTo(-330, 16); g.quadraticCurveTo(-280, 32, -232, 44); g.closePath(); g.fillStyle = G1; g.fill();
    /* dewlap (throat fan) */
    g.beginPath(); g.moveTo(-352, 12); g.quadraticCurveTo(-370, 104, -300, 112); g.quadraticCurveTo(-246, 88, -240, 36); g.closePath(); g.fillStyle = G3; g.fill();
    g.shadowColor = 'rgba(0,0,0,0)';
    g.strokeStyle = G2; g.lineWidth = 4; g.stroke();
    for (var dl = 0; dl < 3; dl++) { g.beginPath(); g.moveTo(-340 + dl * 26, 30); g.quadraticCurveTo(-345 + dl * 30, 60, -320 + dl * 26, 90 - dl * 10); g.stroke(); }
    g.beginPath(); g.moveTo(-428, -14); g.lineTo(-372, -2); g.stroke();
    g.beginPath(); g.arc(-298, -22, 23, 0, TAU); g.fillStyle = G3; g.fill(); g.stroke();
    g.beginPath(); g.arc(-360, -56, 13, 0, TAU); g.fillStyle = mix('#e8c35a', '#cfd8dd', fr); g.fill(); g.strokeStyle = G2; g.lineWidth = 4; g.stroke();
    g.beginPath(); g.arc(-362, -56, 6, 0, TAU); g.fillStyle = '#101510'; g.fill();
    g.restore();
  }

  /* ---------- props for the real-Florida half ---------- */
  function palm(g, bx, by, tx, ty, t, fs) {
    fs = fs || 1;
    g.save(); g.shadowColor = 'rgba(60,40,10,.25)'; g.shadowOffsetX = 6; g.shadowOffsetY = 8;
    g.beginPath(); g.moveTo(bx - 34, by); g.quadraticCurveTo(bx - 10, (by + ty) / 2, tx - 15, ty); g.lineTo(tx + 15, ty); g.quadraticCurveTo(bx + 30, (by + ty) / 2, bx + 34, by); g.closePath();
    g.fillStyle = '#a06f42'; g.fill(); g.shadowColor = 'rgba(0,0,0,0)';
    g.strokeStyle = '#7b5130'; g.lineWidth = 5; for (var i = 1; i < 12; i++) { var k = i / 12, x = lerp(bx, tx, k * k * .6 + k * .4), y = lerp(by, ty, k); g.beginPath(); g.moveTo(x - 26 + 12 * k, y + 4); g.lineTo(x + 26 - 12 * k, y - 4); g.stroke(); }
    var ang = [-172, -148, -122, -62, -36, -10, 16];
    ang.forEach(function (a0, j) {
      var a = (a0 + 3 * Math.sin(t * 2.2 + j)) * Math.PI / 180, L = (230 - Math.abs(j - 3) * 8) * fs, ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L + 60 * fs, mx = tx + Math.cos(a) * L * .55, my = ty + Math.sin(a) * L * .55 - 30 * fs;
      g.save(); g.shadowColor = 'rgba(60,40,10,.22)'; g.shadowOffsetX = 5; g.shadowOffsetY = 7;
      g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(mx, my - 26 * fs, ex, ey); g.quadraticCurveTo(mx, my + 26 * fs, tx, ty); g.fillStyle = j % 2 ? '#3f8b48' : '#2f7340'; g.fill(); g.restore();
      g.strokeStyle = '#245a31'; g.lineWidth = 3; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
    });
    [[-16, 18], [14, 22], [0, 34]].forEach(function (c) { g.beginPath(); g.arc(tx + c[0] * fs, ty + c[1] * fs, 16 * fs, 0, TAU); g.fillStyle = '#6b4424'; g.fill(); });
    g.restore();
  }
  function thermo(g, x, y0, y1, lvl) {
    g.save(); g.shadowColor = 'rgba(60,40,10,.25)'; g.shadowOffsetX = 5; g.shadowOffsetY = 7;
    rr(g, x - 30, y0, 60, y1 - y0, 30); g.fillStyle = CREAM; g.fill(); g.shadowColor = 'rgba(0,0,0,0)'; g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
    g.beginPath(); g.arc(x, y1 + 18, 50, 0, TAU); g.fillStyle = RED; g.fill(); g.stroke();
    var top = lerp(y1 - 10, y0 + 24, lvl); rr(g, x - 13, top, 26, y1 + 10 - top, 13); g.fillStyle = RED; g.fill();
    g.strokeStyle = 'rgba(13,27,30,.6)'; g.lineWidth = 4; for (var yy = y0 + 40; yy < y1 - 10; yy += 38) { g.beginPath(); g.moveTo(x + 30, yy); g.lineTo(x + 48, yy); g.stroke(); }
    g.restore();
  }

  /* ---------- annotations on the print ---------- */
  function ellRing(g, cx, cy, rx, ry, k, col) {
    if (k <= 0) return; g.save(); g.strokeStyle = col || RED; g.lineWidth = 10; g.lineCap = 'round';
    var s = 1 + .2 * (1 - eo(k)); g.beginPath(); g.ellipse(cx, cy, rx * s, ry * s, -.06, -Math.PI / 2, -Math.PI / 2 + TAU * eo(k)); g.stroke(); g.restore();
  }
  function tagAt(g, s, px, py, tx, ty, k, size, bg, fg) {
    if (k <= 0) return; var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.globalAlpha *= clamp(k * 3, 0, 1); g.strokeStyle = CREAM; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(px, py); g.lineTo(lerp(px, tx, eo(k)), lerp(py, ty, eo(k))); g.stroke();
    g.beginPath(); g.arc(px, py, 9, 0, TAU); g.fillStyle = CREAM; g.fill();
    chip(g, s, tx, ty, size || 48, bg || RED, fg || CREAM, { rot: -.02, sc: lerp(1.15, 1, eo(k)) }); g.restore(); NOREC = nr;
  }
  function leader(g, s, px, py, tx, ty, k) {
    if (k <= 0) return; var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.globalAlpha *= clamp(k * 3, 0, 1); g.strokeStyle = INK; g.lineWidth = 5; g.lineCap = 'round'; g.setLineDash([2, 12]);
    g.beginPath(); g.moveTo(px, py); g.lineTo(lerp(px, tx, eo(k)), lerp(py, ty, eo(k))); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.arc(px, py, 11, 0, TAU); g.fillStyle = RED; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
    chip(g, s, tx, ty, 46, INK, CREAM, { rot: -.015, sc: lerp(1.2, 1, eo(k)) }); g.restore(); NOREC = nr;
  }

  /* ---------- the photo print ---------- */
  /* where the picture sits at t: zoom and focus keyframed on the voice (frame 0 and the last frame are identical) */
  var Z0 = { z: 1.9, fx: .225, fy: .8 };
  function view(t) {
    if (t < T.flipEdge) { var k = eio(seg(t, 0, T.flip0 + .1)); return { z: lerp(Z0.z, 1.38, k), fx: lerp(Z0.fx, .235, k), fy: .8 }; }
    if (t < T.dipIn + .2) {
      var k1 = eio(seg(t, T.u2, T.frontW)), k2 = eio(seg(t, T.frontW - .05, T.frontW + .65)), k3 = seg(t, T.frontW + .65, T.dipIn + .2);
      var z = lerp(lerp(2.25, 2.0, k1), lerp(1.0, 1.05, k3), k2);
      return { z: z, fx: lerp(lerp(.16, .19, k1), .34, k2), fy: lerp(.8, .62, k2) };
    }
    var ke = eio(seg(t, T.endIn + .2, DUR));
    return { z: lerp(1.08, Z0.z, ke), fx: lerp(.33, Z0.fx, ke), fy: lerp(.66, Z0.fy, ke) };
  }
  function printBox(t) {
    if (t < T.flip0) return HOOKB;
    if (t < T.flipEdge) return lbox(HOOKB, BACKB, eio(seg(t, T.flip0, T.flipEdge)));
    if (t < T.flipB0) return BACKB;
    if (t < T.dipIn + .3) return lbox(BACKB, STRB, eio(seg(t, T.flipB0, T.flipBEdge)));
    return HOOKB;
  }
  /* the print: side 'front' draws the use u at view(t); 'back' draws Rockstar's caption */
  function print(g, box, t, side, u, after) {
    var X = box.x, Y = box.y, PW = box.w, PH = box.h, pad = 16, ix = X + pad, iy = Y + pad, iw = PW - pad * 2, ih = PH - pad * 2;
    rr(g, X + 10, Y + 16, PW, PH, 6); g.fillStyle = 'rgba(0,0,0,.42)'; g.fill();
    rr(g, X, Y, PW, PH, 6); g.fillStyle = side === 'front' ? '#f6efe2' : '#efe6d4'; g.fill();
    g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
    if (side === 'front' && u) {
      var v = view(t); u.zoom = [v.z, v.z]; u.focus = [v.fx, v.fy];
      g.save(); g.filter = 'brightness(1.04) contrast(1.04) saturate(1.06)'; CLIP.draw(g, t, ix, iy, iw, ih, u); g.restore();
      if (after) after(g, ix, iy, iw, ih, u);
    } else if (side === 'back') backSide(g, t, ix, iy, iw, ih);
    g.restore();
  }
  function S(u, t, nx, ny, r) { return CLIP.toScreen(u, t, nx, ny, r[0], r[1], r[2], r[3]); }
  /* the iguana's outline in the source picture: x .075-.385, y .725-.90 (read off the 3840x2160 screenshot) */
  function iguanaRing(g, u, t, r, k) {
    var c = S(u, t, .232, .812, r), a = S(u, t, .072, .812, r), b = S(u, t, .232, .722, r);
    ellRing(g, c[0], c[1], Math.abs(c[0] - a[0]), Math.abs(c[1] - b[1]) * 1.05, k);
  }

  /* the back of the print: Rockstar's alt text, verbatim excerpt */
  var ALT = ['“An', 'iguana', 'walks', 'in', 'front', 'of', 'a', 'mobility', 'scooter', 'in', 'the', 'Leonida', 'Keys…”'];
  function altHL(t, which) {
    return function (i) {
      if (which === 'cap') { if (i <= 1) return seg(t, T.igW - .05, T.igW + .2); if (i >= 9) return seg(t, T.keysW - .05, T.keysW + .25); return 0; }
      if (i >= 3 && i <= 8) return seg(t, T.frontW - .05, T.frontW + .3); return 0;
    };
  }
  function backSide(g, t, x, y, w, h) {
    g.fillStyle = '#f3ecdc'; g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(31,111,107,.16)'; g.lineWidth = 2; for (var yy = y + 150; yy < y + h - 40; yy += 84) { g.beginPath(); g.moveTo(x + 30, yy); g.lineTo(x + w - 30, yy); g.stroke(); }
    M2(g, 'ALT TEXT · ROCKSTARGAMES.COM/VI', x + 46, y + 104, 36, { col: TEAL, ls: 0 });
    g.fillStyle = 'rgba(31,111,107,.5)'; g.fillRect(x + 46, y + 136, w - 92, 4);
    para(g, ALT.map(function (s) { return s.toUpperCase(); }), x + 46, y + 170, w - 92, 86, 104, INK, altHL(t, 'cap'));
    M2(g, 'ROCKSTAR · ONLY IN LEONIDA PAGE', x + 46, y + h - 52, 36, { col: 'rgba(13,27,30,.7)', ls: 0 });
  }
  /* the caption strip above the print in the street beat (the same excerpt, smaller) */
  function strip(g, t) {
    var k = eo(seg(t, T.flipB0 + .05, T.flipBEdge + .2)), ko = eio(seg(t, T.dipIn - .05, T.dipIn + .25)); if (k <= 0 || ko >= 1) return;
    var nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    g.save(); g.globalAlpha *= 1 - ko; g.translate(0, -60 * (1 - k) - 200 * ko); g.globalAlpha *= clamp(k * 2, 0, 1);
    g.save(); g.translate(CX, 445); g.rotate(-.01); g.translate(-CX, -445);
    rr(g, 100, 316, 830, 286, 8); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, 92, 308, 830, 286, 8); g.fillStyle = '#f3ecdc'; g.fill();
    M2(g, 'ALT TEXT · ROCKSTARGAMES.COM/VI', 124, 346, 36, { col: TEAL, ls: 0 });
    para(g, ALT.map(function (s) { return s.toUpperCase(); }), 124, 374, 770, 54, 64, INK, altHL(t, 'street'));
    g.restore(); g.restore(); NOREC = nr;
  }

  /* ---------- frame 0 / seam: the hook title ---------- */
  function hookTitle(g, t, k) {
    if (k <= 0) return;
    var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.globalAlpha *= clamp(k * 1.5, 0, 1); g.translate(0, -320 * (1 - k));
    var tw0 = tw('HAS IGUANAS', 150, 'condensed', 900) + 64;
    g.save(); g.translate(CX, 488); g.rotate(-.015); rr(g, -tw0 / 2 + 7, -78 + 9, tw0, 156, 12); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill(); rr(g, -tw0 / 2, -78, tw0, 156, 12); g.fillStyle = CREAM; g.fill(); g.restore();
    T2(g, 'HAS IGUANAS', CX, 488, 150, { col: INK, max: 780 });
    g.restore(); NOREC = nr;
  }
  /* the GTA 6 pill: above the title on frame 0, then on the print's corner through the game beats */
  function pill(g, t) {
    var vis = t < T.flIn - .05 || t >= T.endIn - .1; if (!vis) return;
    var P0 = [CX, 352, 66, -.03], P1 = [188, 632, 50, -.06], P2 = [188, 654, 50, -.06], P3 = [190, 566, 52, -.03], P4 = [188, 1392, 50, -.04], p;
    if (t < T.flip0) p = P0;
    else if (t < T.flipEdge) p = lerpP(P0, P1, eio(seg(t, T.flip0, T.flipEdge)));
    else if (t < T.flipB0) p = P1;
    else if (t < T.dipIn) p = lerpP(P1, P2, eio(seg(t, T.flipB0, T.flipBEdge)));
    else if (t < T.flIn) p = P3;
    else if (t < T.seamIn) p = P4;
    else p = lerpP(P4, P0, eio(seg(t, T.seamIn, T.seamIn + .3)));
    var ka = t >= T.endIn - .1 && t < T.endIn + .3 ? eo(seg(t, T.endIn - .1, T.endIn + .2)) : 1, ko = t < T.endIn - .1 ? seg(t, T.flIn - .2, T.flIn - .05) : 0;
    var nr = NOREC; NOREC = nr || ka < .999 || ko > 0;
    g.save(); g.globalAlpha *= ka * (1 - ko); chip(g, 'GTA 6', p[0], p[1], p[2], PINK, CREAM, { rot: p[3] }); g.restore(); NOREC = nr;
  }
  function lerpP(a, b, k) { return [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)]; }

  /* ---------- GAME HALF: the print, flip, back, street ---------- */
  function gameHalf(g, t) {
    if (t >= T.dipIn + .3 && t < T.endIn - .3) return;
    var box = printBox(t), cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    var sx = 1, side = 'front', u = null, after = null, shade = 0;
    if (t < T.flipEdge) {
      u = U.s1; sx = Math.cos(Math.PI / 2 * eio(seg(t, T.flip0, T.flipEdge))); shade = 1 - sx;
      after = function (gg, x, y, w, h, uu) {
        var r = [x, y, w, h]; iguanaRing(gg, uu, t, r, seg(t, T.ringA, T.ringA + .3));
      };
    } else if (t < T.flipBEdge) {
      side = 'back';
      if (t < T.flipB0) sx = Math.sin(Math.PI / 2 * eio(seg(t, T.flipEdge, T.flipEdge + .1)));
      else sx = Math.cos(Math.PI / 2 * eio(seg(t, T.flipB0, T.flipBEdge)));
      shade = 1 - sx;
    } else if (t < T.dipIn + .3) {
      u = U.s2; sx = Math.sin(Math.PI / 2 * eio(seg(t, T.flipBEdge, T.flipBEdge + .1))); shade = 1 - sx;
      after = function (gg, x, y, w, h, uu) {
        var r = [x, y, w, h];
        var kr = seg(t, T.frontW + .55, T.frontW + .85);
        iguanaRing(gg, uu, t, r, kr);
        var sc = S(uu, t, .462, .585, r), sr = S(uu, t, .548, .585, r), stp = S(uu, t, .462, .33, r);
        ellRing(gg, sc[0], sc[1], Math.abs(sr[0] - sc[0]) * 1.2, Math.abs(sc[1] - stp[1]) * 1.05, seg(t, T.scootW, T.scootW + .3), SUN);
        var as = S(uu, t, .19, .93, r);
        var ks = seg(t, T.streetW - .1, T.streetW + .2), ksx = seg(t, T.frontW, T.frontW + .6);
        tagAt(gg, 'IN THE STREET', as[0], Math.min(as[1], y + h - 40), clamp(lerp(560, 300, eio(ksx)), 260, 700), y + h - 70, ks, 52, RED, CREAM);
              };
    } else {
      u = U.s3; after = function (gg, x, y, w, h, uu) { iguanaRing(gg, uu, t, [x, y, w, h], (1 - seg(t, T.seamIn - .2, T.seamIn + .1)) * seg(t, T.endIn + .1, T.endIn + .4)); };
    }
    var enter = t >= T.endIn - .3 ? eo(seg(t, T.endIn - .3, T.endIn + .05)) : 1, exitk = t >= T.dipIn - .1 && t < T.endIn - .3 ? eio(seg(t, T.dipIn - .1, T.dipIn + .3)) : 0;
    g.save(); g.translate(0, 1500 * (1 - enter) + 1500 * exitk);
    var _bk = side === 'back' ? 1 + .05 * eio(seg(t, T.flipEdge, T.flipB0)) : 1;
    g.translate(cx, cy); g.rotate((box.rot || 0) + (side === 'back' ? .015 * Math.sin((t - T.flipEdge) * 1.3) : 0)); g.scale(Math.max(.07, sx) * _bk, _bk); g.translate(-cx, -cy);
    var nr = NOREC; NOREC = nr || sx < .999 || enter < .999 || exitk > 0;
    print(g, box, t, side, u, after);
    if (shade > 0) { g.fillStyle = 'rgba(0,0,0,' + (shade * .5).toFixed(3) + ')'; g.fillRect(box.x, box.y, box.w, box.h); }
    NOREC = nr; g.restore();
    /* the payoff stamp: on the print's corner from "iguanas" to the dip (not flipped with the print) */
    var ks2 = eo(seg(t, T.stamp, T.stamp + .2)), ko2 = seg(t, T.dipIn - .1, T.dipIn + .1);
    if (t >= T.stamp && t < T.dipIn + .1 && t < T.seamIn) {
      var py = t < T.flip0 ? 612 : t < T.flipB0 ? lerp(612, 634, seg(t, T.flip0, T.flipEdge)) : lerp(634, 656, seg(t, T.flipB0, T.flipBEdge));
      var nrs = NOREC; NOREC = nrs || ks2 < .999 || ko2 > 0;
      g.save(); g.globalAlpha *= 1 - ko2; chip(g, 'ROCKSTAR SCREENSHOT', 640, py, 44, RED, CREAM, { rot: .035, sc: lerp(1.5, 1, ks2) * kn(t, T.stamp + .2, .06) }); g.restore(); NOREC = nrs;
    }
    /* the back's header in the title zone */
    var kh = eo(seg(t, T.flip0 - .12, T.flip0 + .06)), koh = eio(seg(t, T.flipB0 - .05, T.flipB0 + .2));
    if (kh > 0 && koh < 1) {
      var nrh = NOREC; NOREC = nrh || kh < .999 || koh > 0;
      g.save(); g.globalAlpha *= (1 - koh) * clamp(kh * 2, 0, 1); g.translate(0, (1 - kh) * -40);
      T2(g, 'ROCKSTAR’S OWN', 560, 400, 104, { col: CREAM, align: 'center', max: 700 });
      var tw1 = tw('CAPTION', 104) + 50; g.save(); g.translate(CX, 506); g.rotate(-.02); rr(g, -tw1 / 2, -60, tw1, 120, 10); g.fillStyle = SUN; g.fill(); g.restore();
      T2(g, 'CAPTION', CX, 506, 104, { col: INK });
      g.restore(); NOREC = nrh;
    }
    strip(g, t);
  }

  /* the wipe between print beats and the dip: a hard flick + plates; our iguana walks the road */
  function dipLayer(g, t) {
    if (t < T.dipIn - .05 || t >= T.flIn + .3) return;
    var kin = eo(seg(t, T.dipIn, T.dipIn + .3)), ko = eio(seg(t, T.flIn - .1, T.flIn + .25));
    var nr = NOREC; NOREC = nr || kin < .999 || ko > 0;
    g.save(); g.translate(-1100 * ko, 0);
    /* the road strip (ours) */
    g.save(); g.globalAlpha *= kin; g.translate(0, (1 - kin) * 300);
    g.fillStyle = 'rgba(30,34,36,.92)'; g.fillRect(-40, 1190, W + 80, 220);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(-40, 1190, W + 80, 8); g.fillRect(-40, 1402, W + 80, 8);
    var off = (t * 60) % 120; g.fillStyle = SUN; for (var dx = -120 + off; dx < W + 120; dx += 120) g.fillRect(dx, 1296, 64, 12);
    g.restore();
    /* our iguana crossing the road */
    var kw = seg(t, T.dipIn, T.flIn + .2), ix = lerp(980, 420, kw);
    var nri = NOREC; NOREC = true; iguana(g, ix, 1222, .74, { walk: t * 9 }); NOREC = nri;
    /* CUTE? sticker and the ? stamp */
    var kc = eo(seg(t, T.dipIn + .1, T.dipIn + .35));
    chip(g, 'CUTE?', 300, 820, 92, PINK, CREAM, { rot: -.06, sc: kc * kn(t, T.cuteW, .1) });
    var kq = eo(seg(t, T.detW, T.detW + .18));
    if (kq > 0) { g.save(); g.translate(735, 860); g.rotate(.08); g.scale(lerp(1.6, 1, kq), lerp(1.6, 1, kq)); g.globalAlpha *= clamp(kq * 3, 0, 1);
      g.beginPath(); g.arc(0, 0, 130, 0, TAU); g.fillStyle = SUN; g.fill(); T2(g, '?', 0, 6, 230, { col: INK }); g.restore(); }
    g.restore(); NOREC = nr;
  }

  /* ---------- REAL FLORIDA: a field guide on cream paper ---------- */
  function flHeader(g, t) {
    if (t < T.flIn - .05 || t >= T.endIn) return;
    var k = eo(seg(t, T.flIn, T.flIn + .22)), ko = eio(seg(t, T.endIn - .35, T.endIn - .05)), nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    g.save(); g.globalAlpha *= 1 - ko;
    var inv = t >= T.invW + .45, kinv = eo(seg(t, T.invW + .45, T.invW + .8));
    var x0 = lerp(CX, 290, inv ? kinv : 0);
    chip(g, 'REAL FLORIDA', x0, 552, 58, TEAL, CREAM, { rot: -.02, sc: lerp(1.6, 1, k) * kn(t, T.flIn + .22, .08) });
    if (inv) { var nri = NOREC; NOREC = nri || kinv < .999; chip(g, 'INVASIVE · FWC', 700, 552, 50, RED, CREAM, { rot: .025, sc: lerp(1.4, 1, kinv) }); NOREC = nri; }
    g.restore(); NOREC = nr;
  }
  /* ground band under the TikTok UI zone (y 1440-1920): shapes only, never text */
  function ground(g, top, col, edge) {
    g.fillStyle = col; g.fillRect(-60, top, W + 120, H - top + 60);
    g.fillStyle = edge; g.fillRect(-60, top, W + 120, 10);
  }
  /* turn: OUR ID (FWC's marks) on a diagonal + a crop of Rockstar's iguana + INVASIVE stamp */
  function turnLayer(g, t) {
    if (t < T.flIn - .05 || t >= T.nwsIn + .35) return;
    var k = eo(seg(t, T.flIn, T.flIn + .3)), ko = eio(seg(t, T.nwsIn, T.nwsIn + .32)), nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    g.save(); g.translate(-1100 * ko, 0);
    ground(g, 1470, '#a9c27a', '#7f9a55');
    g.save(); g.fillStyle = '#7f9a55'; for (var gx = 30; gx < W; gx += 70) { g.beginPath(); g.moveTo(gx, 1478); g.lineTo(gx + 12, 1440 - (gx * 7 % 30)); g.lineTo(gx + 24, 1478); g.fill(); } g.restore();
    g.translate(0, (1 - k) * 160); g.globalAlpha *= clamp(k * 2, 0, 1);
    var _pk = 1 + .03 * eio(seg(t, T.flIn, T.nwsIn + .3)); g.translate(CX, 1000); g.scale(_pk, _pk); g.translate(-CX, -1000);
    var IX = 360, IY = 1060, IS = .58, IR = -.42;
    var br = 1 + .012 * Math.sin(t * 3.1), cr = Math.cos(IR), sr = Math.sin(IR);
    var nri = NOREC; NOREC = true; iguana(g, IX, IY, IS * br, { walk: 0, rot: IR }); NOREC = nri;
    function P(lx, ly) { var s = IS * br; return [IX + (lx * cr - ly * sr) * s, IY + (lx * sr + ly * cr) * s]; }
    var a = P(-60, -96), b = P(-310, 84), c = P(470, 10);
    leader(g, 'RINGED TAIL', c[0], c[1], 780, 720, seg(t, T.L3, T.L3 + .3));
    leader(g, 'SPIKES', a[0], a[1], 780, 880, seg(t, T.L1, T.L1 + .3));
    leader(g, 'THROAT FAN', b[0], b[1], 780, 1040, seg(t, T.L2, T.L2 + .3));
    /* Rockstar's own iguana, cropped from the same screenshot, beside our marks */
    var kt = eo(seg(t, T.L1 + .1, T.L1 + .4));
    if (kt > 0 && U.s4) {
      var nrt = NOREC; NOREC = nrt || kt < .999;
      g.save(); g.translate(780, 1260); g.rotate(.03); g.scale(lerp(.6, 1, kt), lerp(.6, 1, kt)); g.globalAlpha *= clamp(kt * 2, 0, 1);
      rr(g, -126, -82, 260, 176, 6); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
      rr(g, -134, -90, 260, 176, 6); g.fillStyle = '#f6efe2'; g.fill();
      g.save(); g.beginPath(); g.rect(-124, -80, 240, 156); g.clip(); CLIP.draw(g, t, -124, -80, 240, 156, U.s4); g.restore();
      chip(g, 'IN GAME', -30, -92, 36, RED, CREAM, { rot: -.04 });
      g.restore(); NOREC = nrt;
    }
    M2(g, 'OUR ID · MARKS FROM FWC', 110, 1330, 36, { col: 'rgba(13,27,30,.8)', ls: 0, a: seg(t, T.L1, T.L1 + .3) });
    var ks = eo(seg(t, T.invW, T.invW + .18)), kf = seg(t, T.invW + .45, T.invW + .75);
    if (ks > 0 && kf < 1) {
      var nrs = NOREC; NOREC = true;
      g.save(); g.translate(lerp(470, 700, eio(kf)), lerp(1010, 552, eio(kf))); g.rotate(lerp(-.08, .025, kf)); var s = lerp(lerp(1.6, 1, ks), .45, eio(kf)); g.scale(s, s);
      g.fillStyle = 'rgba(251,243,228,.75)'; rr(g, -330, -78, 660, 156, 14); g.fill();
      g.strokeStyle = RED; g.lineWidth = 10; rr(g, -330, -78, 660, 156, 14); g.stroke(); T2(g, 'INVASIVE', 0, 2, 132, { col: RED }); g.restore(); NOREC = nrs;
    }
    g.restore(); NOREC = nr;
  }
  /* nws: forecast tile high-left, full-height palm right; on "falling" a big paper iguana drops from above the frame */
  function nwsLayer(g, t) {
    if (t < T.nwsIn - .05 || t >= T.coldIn + .35) return;
    var k = eo(seg(t, T.nwsIn, T.nwsIn + .32)), ko = eio(seg(t, T.coldIn, T.coldIn + .32)), nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    var punch = t > T.land ? .04 * Math.exp(-(t - T.land) * 9) * Math.min(1, (t - T.land) * 40) : 0;
    g.save(); g.translate(1100 * (1 - k) - 1100 * ko, 0);
    g.translate(CX, 1300); g.scale(1 + punch, 1 + punch); g.translate(-CX, -1300);
    ground(g, 1440, '#d8c08a', '#b49a62');
    palm(g, 860, 1980, 790, 400, t, 1.45);
    /* thermometer, low left, drops through the line */
    var lv = lerp(.78, .2, eio(seg(t, T.nwsIn + .3, T.fallW + .4)));
    thermo(g, 150, 1060, 1180, lv);
    var kt = seg(t, T.nwsIn + .4, T.nwsIn + .7);
    g.save(); g.globalAlpha *= kt; chip(g, 'LOW 30°F', 340, 1090, 52, INK, CREAM, { rot: -.03 }); M2(g, 'MIAMI · NWS', 236, 1166, 36, { col: INK, ls: 0 }); g.restore();
    /* the drops: one big iguana in 0.35 s, squash, then three smaller ones 0.15 s apart */
    var nri = NOREC; NOREC = true;
    var DROPS = [[T.fallW, 520, 1360, .67, .35], [T.fallW + .15, 250, 1600, .3, .3], [T.fallW + .3, 700, 1700, .32, .3], [T.fallW + .45, 420, 1800, .28, .3]];
    DROPS.forEach(function (d, j) {
      if (t < d[0]) return;
      var kf = seg(t, d[0], d[0] + d[4]), y = lerp(-260, d[2], kf * kf), tl = t - (d[0] + d[4]);
      var sq = tl > 0 ? lerp(.85, 1, eo(seg(tl, 0, .12))) : 1;
      iguana(g, d[1], y, d[3], { rot: lerp(j % 2 ? -.5 : .5, j ? .08 * (j % 2 ? -1 : 1) : 0, kf), sq: sq, flipX: j === 2 });
    });
    NOREC = nri;
    /* the tile: high left, tilted */
    var kti = eo(seg(t, T.nwsIn + .05, T.nwsIn + .35));
    g.save(); g.translate(390, 840); g.rotate(-.052); g.scale(lerp(.9, 1, kti), lerp(.9, 1, kti)); g.translate(-390, -840);
    rr(g, 120, 672, 560, 350, 16); g.fillStyle = 'rgba(60,40,10,.3)'; g.fill();
    rr(g, 110, 660, 560, 350, 16); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = INK; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#1f4f8a'; rr(g, 110, 660, 560, 66, 16); g.fill(); g.fillRect(110, 700, 560, 26);
    M2(g, 'NWS MIAMI · JAN 21, 2020', 132, 694, 36, { col: '#ffffff', ls: 0 });
    para(g, ['“IGUANAS', 'FALLING', 'FROM', 'THE', 'TREES”'], 132, 742, 516, 80, 88, INK, function (i) { return i <= 1 ? seg(t, T.fallW - .05, T.fallW + .25) : 0; }, { center: true });
    g.restore();
    chip(g, 'RE-CREATED', 600, 650, 36, SUN, INK, { rot: .03 });
    g.restore(); NOREC = nr;
  }
  /* cold: FEB 1-2, 2026; a frost line at y 1350; three of our iguanas flip onto their backs, stiff */
  function coldLayer(g, t) {
    if (t < T.coldIn - .05 || t >= T.cntIn + .7) return;
    var k = eo(seg(t, T.coldIn, T.coldIn + .32)), ko = eio(seg(t, T.cntIn + .35, T.cntIn + .65)), nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    var fr = eio(seg(t, T.coldW - .2, T.stunW + .2));
    g.save(); g.translate(1100 * (1 - k) - 1100 * ko, 0);
    ground(g, 1370, mix('#d8c08a', '#dfe9ee', fr), mix('#b49a62', '#9fc3d6', fr));
    var _pk = 1 + .03 * eio(seg(t, T.coldIn, T.cntIn + .3)); g.translate(CX, 1000); g.scale(_pk, _pk); g.translate(-CX, -1000);
    /* frost streaks */
    g.save(); g.globalAlpha *= .5 * fr; g.strokeStyle = '#9fc3d6'; g.lineWidth = 6; g.lineCap = 'round';
    for (var i = 0; i < 9; i++) { var yy = 860 + i * 52, xx = ((t * 520 + i * 173) % 1100) - 100; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + 120, yy - 8); g.stroke(); }
    g.restore();
    /* date card, upper left */
    var kd = eo(seg(t, T.coldIn + .05, T.coldIn + .25));
    g.save(); g.translate(340, 720); g.rotate(-.035); var sd = lerp(1.5, 1, kd) * kn(t, T.coldIn + .25, .06); g.scale(sd, sd); g.globalAlpha *= clamp(kd * 2, 0, 1);
    rr(g, -240 + 7, -70 + 9, 480, 140, 14); g.fillStyle = 'rgba(60,40,10,.3)'; g.fill(); rr(g, -240, -70, 480, 140, 14); g.fillStyle = INK; g.fill();
    T2(g, 'FEB 1–2, 2026', 0, 0, 96, { col: CREAM, max: 440 }); g.restore();
    /* thermometer, right, bottomed out */
    thermo(g, 830, 640, 1080, lerp(.35, .06, fr));
    /* the frost line */
    g.save(); g.fillStyle = mix('#c9b48a', '#e8f2f6', fr); g.fillRect(-60, 1350, W + 120, 22);
    g.fillStyle = mix('#c9b48a', '#bfdbe8', fr); for (var ic = 0; ic < 24; ic++) { var ix = 20 + ic * 46, ih = (8 + (ic * 13 % 22)) * fr; g.beginPath(); g.moveTo(ix, 1372); g.lineTo(ix + 10, 1372 + ih); g.lineTo(ix + 20, 1372); g.fill(); }
    g.restore();
    var PX = [200, 520, 840];
    var nri = NOREC; NOREC = true;
    PX.forEach(function (px, j) {
      var s0 = T.stunW + j * .12, kk = eio(seg(t, s0, s0 + .35)), hop = -70 * Math.sin(Math.PI * kk);
      var y = lerp(1306, 1316, kk) + hop;
      g.save(); g.translate(px, y); g.rotate(Math.PI * kk * (j % 2 ? -1 : 1)); g.translate(-px, -y);
      iguana(g, px, y, .31, { frost: fr, walk: kk > 0 ? 0 : Math.sin(t * 2 + j) * .4, flipX: j === 1 });
      g.restore();
    });
    NOREC = nri;
    g.restore(); NOREC = nr;
  }
  /* count: 5,195 left; 52 icons (1 icon = 100) fill by drop-off site from the first frame of the beat */
  var SITES = [['SUNRISE', 3882, '#1f6f6b'], ['TEQUESTA', 1075, '#e0a020'], ['MARATHON', 215, '#e6337a'], ['FORT MYERS', 23, '#8a8f8c']];
  var ICONS = (function () { var o = []; SITES.forEach(function (s, i) { for (var n = 0; n < Math.round(s[1] / 100); n++) o.push(i); }); return o; })();
  function countLayer(g, t) {
    if (t < T.cntIn - .05 || t >= T.endIn) return;
    var k = eo(seg(t, T.cntIn, T.cntIn + .32)), ko = eio(seg(t, T.endIn - .35, T.endIn - .05)), nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    g.save(); g.translate(1100 * (1 - k), -H * ko);
    ground(g, 1460, '#e4d6b4', '#c9b48a');
    /* tally strip under the UI zone: the same ratio as one stacked bar (no text) */
    var kb = eio(seg(t, T.cntIn + .1, T.cntIn + 1.5)), bx = 90;
    SITES.forEach(function (s) { var w = 900 * s[1] / 5195 * kb; g.fillStyle = s[2]; g.fillRect(bx, 1600, Math.max(0, w), 90); bx += w; });
    g.strokeStyle = INK; g.lineWidth = 5; g.strokeRect(90, 1600, 900, 90);
    var _pk = 1 + .02 * eio(seg(t, T.cntIn, T.endIn)); g.translate(CX, 1000); g.scale(_pk, _pk); g.translate(-CX, -1000);
    var kn0 = eo(seg(t, T.numW, T.numW + .16));
    if (kn0 > 0) {
      var nrn = NOREC; NOREC = nrn || kn0 < .999;
      g.save(); g.translate(110, 720); g.rotate(-.025); var sn = lerp(1.7, 1, kn0) * kn(t, T.numW + .16, .07); g.scale(sn, sn); g.globalAlpha *= clamp(kn0 * 3, 0, 1);
      T2(g, '5,195', 8, 10, 260, { col: 'rgba(60,40,10,.25)', align: 'left' }); T2(g, '5,195', 0, 0, 260, { col: INK, align: 'left' }); g.restore(); NOREC = nrn;
    }
    var kc = eo(seg(t, T.cntIn + .3, T.cntIn + .5));
    if (kc > 0) { var nrc = NOREC; NOREC = nrc || kc < .999; g.save(); g.globalAlpha *= kc; var cw = tw('FEB 1–2, 2026 · FWC', 46) + 37; chip(g, 'FEB 1–2, 2026 · FWC', 110 + cw / 2, 890, 46, RED, CREAM, { rot: .015, sc: lerp(1.3, 1, kc) }); g.restore(); NOREC = nrc; }
    /* the 52 icons: 6 across, filling from the beat's first frame */
    var nri = NOREC; NOREC = true;
    ICONS.forEach(function (si, n) {
      var t0 = T.cntIn + .05 + n * .028, ki = eo(seg(t, t0, t0 + .16)); if (ki <= 0) return;
      var col = n % 6, row = Math.floor(n / 6), x = 150 + col * 78, y = 990 + row * 44;
      g.save(); g.globalAlpha *= clamp(ki * 2, 0, 1); g.translate(x, y - 30 * (1 - ki)); g.scale(lerp(1.4, 1, ki), lerp(1.4, 1, ki));
      iguana(g, 0, 0, .066, { pal: SITES[si][2], walk: 0 }); g.restore();
    });
    NOREC = nri;
    /* key + legend, right column */
    var kk = eo(seg(t, T.cntIn + .15, T.cntIn + .4));
    if (kk > 0) {
      var nrk = NOREC; NOREC = nrk || kk < .999;
      g.save(); g.globalAlpha *= kk;
      g.save(); g.translate(690, 950); iguana(g, 0, 0, .066, { pal: INK, walk: 0 }); g.restore();
      M2(g, '= 100', 740, 952, 36, { col: INK, ls: 0 });
      SITES.forEach(function (s, i) {
        var ki2 = eo(seg(t, T.cntIn + .2 + i * .08, T.cntIn + .45 + i * .08)), y = 1040 + i * 96;
        g.save(); g.globalAlpha *= ki2; g.translate((1 - ki2) * 40, 0);
        rr(g, 626, y - 16, 30, 30, 6); g.fillStyle = s[2]; g.fill();
        T2(g, s[0], 670, y, 38, { col: INK, align: 'left' });
        M2(g, s[1].toLocaleString('en-US'), 670, y + 40, 36, { col: 'rgba(13,27,30,.75)', ls: 0 });
        g.restore();
      });
      g.restore(); NOREC = nrk;
    }
    g.restore(); NOREC = nr;
  }

  /* ---------- end: the vote ---------- */
  function vote(g, t) {
    if (t < T.voteIn - .05 || t >= T.seamIn + .2) return;
    var k = eo(seg(t, T.voteIn, T.voteIn + .25)), ko = eio(seg(t, T.seamIn - .1, T.seamIn + .15)), nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    g.save(); g.globalAlpha *= 1 - ko;
    g.save(); g.translate(CX, 470 - 40 * (1 - k)); g.rotate(-.02); g.globalAlpha *= k;
    var w0 = tw('BRAKE?', 170) + 80; rr(g, -w0 / 2 + 7, -95 + 9, w0, 190, 14); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill(); rr(g, -w0 / 2, -95, w0, 190, 14); g.fillStyle = CREAM; g.fill();
    T2(g, 'BRAKE?', 0, 0, 170, { col: INK }); g.restore();
    var ky = eo(seg(t, T.voteIn + .1, T.voteIn + .35)), kn1 = eo(seg(t, T.voteIn + .18, T.voteIn + .43));
    g.translate(0, 300 * ko);
    chip(g, 'YES', 330, 735, 118, CREAM, INK, { rot: -.05, sc: ky * kn(t, T.yesW, .14), stroke: INK });
    chip(g, 'NO', 720, 735, 118, CREAM, INK, { rot: .05, sc: kn1 * kn(t, T.noW, .14), stroke: INK });
    g.restore(); NOREC = nr;
  }

  /* =====================================================================================================
     CAPTIONS: tape in the upper third, phrase by phrase. The hook, caption and street lines are carried by
     the title, the back of the print and the strip; the end line by the vote.
     ===================================================================================================== */
  var BREAK = { dip: ['cute'], turn: ['florida,'], nws: ['once'], cold: ['winter,'], count: ['over'] };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (['hook', 'caption', 'street', 'end'].indexOf(l.id) >= 0) return;
      var ws = l.words; outc.push({ id: l.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .06, words: ws });
    });
    return outc;
  })();
  var STRESS = [], CAPY = 410;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function captions(g, t) {
    t = tq(t);
    var c0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { c0 = c; ci = i; } });
    if (!c0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s : T.voteIn;
    var end = Math.min(c0.t1 + .45, ns - .02, T.voteIn - .1);
    if (t >= end) return;
    var fl = c0.id !== 'dip', TAPE = fl ? INK : CREAM, TXT = fl ? CREAM : INK;
    var k = cd(t, c0.s, 16), ko = 1 - seg(t, end - .06, end);
    g.save(); g.globalAlpha *= ko; cond(g, 'condensed'); var cpx = 72; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = c0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws, gap, lines, lw, maxw = 760, br = BREAK[c0.id] || [];
    function meas() { ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; }
    function lay() {
      lines = [[]];
      words.forEach(function (w, i) { lines[lines.length - 1].push(i); if (br.indexOf(w.w.toLowerCase()) >= 0 && i < words.length - 1) lines.push([]); });
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    meas(); lay();
    while (Math.max.apply(null, lw) - gap > maxw && cpx > 44) { cpx -= 4; font(g, cpx, 900); meas(); lay(); }
    var lh = cpx * 1.3, y0 = CAPY - (lines.length - 1) * lh / 2 + cpx * .36;
    lines.forEach(function (ln, li) {
      var tw0 = lw[li] - gap, x = CX - tw0 / 2, y = y0 + li * lh + (1 - k) * 26, r = mulberry(Math.round(c0.t0 * 100) + li * 7);
      var x0 = x - 22, x1 = x + tw0 + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CX, y); g.rotate(rot); g.translate(-CX, -y);
      g.save(); g.shadowColor = 'rgba(0,4,20,.45)'; g.shadowBlur = 10; g.shadowOffsetX = 3; g.shadowOffsetY = 6; g.fillStyle = TAPE; rr(g, x0, yt, x1 - x0, yb - yt, 6); g.fill(); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .25;
        if (cur) { g.save(); g.fillStyle = SUN; g.fillRect(x - 6, y - cpx * .78, ws[i] + 12, cpx * .98); g.restore(); }
        g.fillStyle = cur ? INK : TXT; g.fillText(up[i], x, y); x += ws[i] + gap;
      });
      g.restore();
    });
    g.restore(); unst(g); ls(g, 0);
  }

  /* =====================================================================================================
     FRAME
     ===================================================================================================== */
  var POSTERMODE = false, STAGEC = '#0a1430';
  function stage(g) { g.fillStyle = STAGEC; g.fillRect(0, 0, W, H); }
  function plateLayer(g, t) {
    var u = CLIP.activePlate(t); if (!u) return;
    var k = seg(t, u.t0, u.t0 + .2) * (1 - seg(t, u.t1 - .2, u.t1));
    g.save(); g.globalAlpha = k; CLIP.plate(g, t, 0, 0, W, H, { dim: .5, blur: 2 }); g.restore();
  }
  function background(g, t) {
    g.drawImage(BG, 0, 0);
    /* game half: the screenshot, blurred, drifting */
    var gk = 1 - seg(t, T.dipIn - .05, T.dipIn + .25) + seg(t, T.endIn - .3, T.endIn);
    if (t >= T.flIn - .1 && t < T.endIn - .3) gk = 0;
    if (gk > 0 && BLUR) { var d = 1.04 + .03 * Math.sin(t * .6); g.save(); g.globalAlpha = clamp(gk, 0, 1); g.translate(W / 2, H / 2); g.scale(d, d); g.translate(-W / 2, -H / 2); g.drawImage(BLUR, -20 * Math.sin(t * .4), 0); g.restore(); }
    plateLayer(g, t);
    /* real-Florida half: the paper slides in over the dip and out under the end */
    if (t >= T.flIn - .12 && t < T.endIn + .05) {
      var kp = eio(seg(t, T.flIn - .12, T.flIn + .14)), kpo = eio(seg(t, T.endIn - .3, T.endIn + .02));
      g.save(); g.translate(W * (1 - kp), 0); g.translate(0, -H * kpo); g.drawImage(PAPERBG, 0, 0);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-14, 0, 14, H); g.restore();
    }
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) background(g, t);
    dipLayer(g, t);
    turnLayer(g, t); nwsLayer(g, t); coldLayer(g, t); countLayer(g, t);
    flHeader(g, t);
    gameHalf(g, t);
    if (t < T.flip0 + .2) hookTitle(g, t, 1 - eio(seg(t, T.flip0 - .1, T.flip0 + .2)));
    vote(g, t);
    if (t >= T.seamIn) hookTitle(g, t, eo(seg(t, T.seamIn, T.seamIn + .3)));
    pill(g, t);
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('title', 'HAS IGUANAS', 0, T.flip0 + .05); Tx('title', 'HAS IGUANAS', T.seamIn + .2, DUR + 1);
    Tx('gta6', 'GTA 6', 0, T.flIn - .15); Tx('gta6', 'GTA 6', T.endIn, DUR + 1);
    Tx('stamp', 'ROCKSTAR SCREENSHOT', T.stamp + .1, T.dipIn);
    Tx('caphd', 'ROCKSTAR’S OWN CAPTION', T.flipEdge + .1, T.flipB0);
    Tx('alt', ALT.join(' '), T.flipEdge + .1, T.flipB0); Tx('alt', ALT.join(' '), T.flipBEdge + .1, T.dipIn);
    Tx('altsrc', 'ALT TEXT · ROCKSTARGAMES.COM/VI', T.flipEdge + .1, T.flipB0); Tx('altsrc', 'ALT TEXT · ROCKSTARGAMES.COM/VI', T.flipBEdge + .1, T.dipIn);
    Tx('street', 'IN THE STREET', T.streetW + .05, T.dipIn);
    Tx('cute', 'CUTE?', T.dipIn + .2, T.flIn);
    Tx('real', 'REAL FLORIDA', T.flIn + .15, T.endIn - .3);
    Tx('spikes', 'SPIKES', T.L1 + .15, T.nwsIn + .15); Tx('fan', 'THROAT FAN', T.L2 + .15, T.nwsIn + .15); Tx('tail', 'RINGED TAIL', T.L3 + .15, T.nwsIn + .15);
    Tx('ourid', 'OUR ID · MARKS FROM FWC', T.L1 + .2, T.nwsIn + .15); Tx('ingame', 'IN GAME', T.L1 + .3, T.nwsIn + .15);
    Tx('inv', 'INVASIVE · FWC', T.invW + .1, T.endIn - .3);
    Tx('nwsh', 'NWS MIAMI · JAN 21, 2020', T.nwsIn + .15, T.coldIn + .2);
    Tx('quote', '“IGUANAS FALLING FROM THE TREES”', T.nwsIn + .15, T.coldIn + .2);
    Tx('recr', 'RE-CREATED', T.nwsIn + .2, T.coldIn + .15);
    Tx('low', 'LOW 30°F', T.nwsIn + .6, T.coldIn + .15); Tx('lowsrc', 'MIAMI · NWS', T.nwsIn + .6, T.coldIn + .15);
    Tx('feb', 'FEB 1–2, 2026', T.coldIn + .2, T.cntIn + .4);
    Tx('num', '5,195', T.numW + .1, T.endIn - .15);
    Tx('src', 'FEB 1–2, 2026 · FWC', T.cntIn + .45, T.endIn - .15); Tx('key', '= 100', T.cntIn + .3, T.endIn - .15);
    SITES.forEach(function (s, i) { Tx('site' + i, s[0] + ' ' + s[1].toLocaleString('en-US'), T.cntIn + .35 + i * .08, T.endIn - .15); });
    Tx('brake', 'BRAKE?', T.voteIn + .15, T.seamIn);
    Tx('yes', 'YES', T.voteIn + .3, T.seamIn); Tx('no', 'NO', T.voteIn + .4, T.seamIn);
    return o;
  }

  /* ---------- times, clips and sound events, all from the voice ---------- */
  function initTimes() {
    T.ringA = .2;
    T.stamp = lastw('hook') + .03;                    // payoff: Rockstar's own screenshot, by ~1.8 s
    T.flip0 = at('caption', 'rockstar') + .12;        // the print flips over on "Rockstar's own caption"
    T.flipEdge = T.flip0 + .1;
    T.igW = at('caption', 'iguana'); T.keysW = at('caption', 'leonida');
    T.flipB0 = lastw('caption') + .05; T.flipBEdge = T.flipB0 + .1;
    T.u2 = T.flipBEdge;
    T.streetW = at('street', 'street'); T.frontW = at('street', 'front'); T.scootW = at('street', 'scooter');
    T.dipIn = start('dip') - .2; T.cuteW = at('dip', 'cute'); T.detW = at('dip', 'detail');
    T.flIn = start('turn') - .12;
    T.L1 = T.flIn + .35; T.L2 = T.L1 + .22; T.L3 = T.L2 + .22;
    T.invW = at('turn', 'invasive');
    T.nwsIn = start('nws') - .2; T.fcW = at('nws', 'forecast'); T.fallW = at('nws', 'falling') - .05; T.land = T.fallW + .35;
    T.coldIn = start('cold') - .2; T.coldW = at('cold', 'cold'); T.stunW = at('cold', 'stunned');
    T.cntIn = start('count') - .2; T.numW = at('count', '5000') - .02; T.daysW = at('count', 'two');
    T.endIn = start('end') - .05; T.voteIn = T.endIn; T.yesW = at('end', 'yes'); T.noW = at('end', 'no');
    T.seamIn = DUR - .45;
    CLIP.reset();
    U.s1 = CLIP.use('shot', 0, T.flipEdge, { from: 0, freeze: 0, zoom: [Z0.z, Z0.z], focus: [Z0.fx, Z0.fy], note: 'hook: Rockstar\'s Only in Leonida screenshot (Leonida_Keys_02) as a photo print, iguana ringed, ROCKSTAR SCREENSHOT stamp, GTA 6 HAS IGUANAS; flips to its caption' });
    U.s2 = CLIP.use('shot', T.u2, T.dipIn + .3, { from: 0, freeze: 0, zoom: [2.25, 1.05], focus: [.16, .8], note: 'street: the same screenshot, close on the iguana then out to the blue mobility scooter; IN THE STREET + SCOOTER tags, rings, alt-text strip above' });
    U.s3 = CLIP.use('shot', T.endIn - .3, DUR + .02, { from: 0, freeze: 0, zoom: [1.08, Z0.z], focus: [.33, .66], note: 'end vote: the print returns and pushes back to the frame-0 crop; BRAKE? YES / NO; iguana ringed' });
    U.s4 = CLIP.use('shot', T.L1 + .1, T.nwsIn + .35, { from: 0, freeze: 0, zoom: [3.4, 3.6], focus: [.232, .812], note: 'turn: a small crop of Rockstar\'s iguana beside our FWC field-guide marks, IN GAME' });
    function plate(name, t0, t1) { var c = CLIP.manifest().clips[name], span = c.frames / 30 - .04; return CLIP.use(name, t0, t1, { plate: true, from: 0, speed: Math.min(1, span / (t1 - t0)), zoom: [1.1, 1.0], focus: [.5, .5], note: 'background plate' }); }
    var mid = (T.dipIn + T.flIn) / 2;
    plate('pmarina', T.dipIn - .05, mid + .1);
    plate('pbeach', mid + .1, T.flIn + .15);
    /* sound: hits sit in the voice's pauses */
    G('f0', 0, 'slap', .05, 1.1);
    G('ring', T.ringA, 'tock', .15, 1);
    G('stamp', T.stamp, 'slap', .2, 1.1);
    G('flip', T.flip0, 'flip', .3, 1);
    G('ig', T.igW, 'pop', .25, .7);
    G('flipB', T.flipB0, 'flip', .3, 1);
    G('street', T.streetW, 'pop', .3, .8);
    G('scoot', T.scootW, 'tock', .3, 1);
    G('dip', T.dipIn, 'flick', .2, 1.1);
    G('q', T.detW, 'slap', .3, .9);
    G('fl', T.flIn, 'swish', .2, 1.1);
    G('flS', T.flIn + .2, 'slap', .3, 1);
    G('l1', T.L1, 'pop', .2, .7); G('l2', T.L2, 'pop', .2, .7); G('l3', T.L3, 'pop', .2, .7);
    G('inv', T.invW, 'slap', .35, 1.1);
    G('nws', T.nwsIn, 'swish', .2, 1);
    G('fall', T.fallW, 'drop', .3, 1);
    GT.land = T.land; EV.push({ t: T.land, type: 'thud', g: 1, id: 'land' });   /* the landing is on the picture's beat even under the voice: low end only */
    G('cold', T.coldIn, 'swish', .2, 1);
    G('feb', T.coldIn + .2, 'slap', .25, 1);
    for (var j = 0; j < 4; j++) G('st' + j, T.stunW + j * .12 + .3, 'tock', .25, .8);
    G('cnt', T.cntIn, 'swish', .2, .9);
    G('num', T.numW, 'slap', .35, 1.2);
    G('bars', T.cntIn + .25, 'pop', .3, .7);
    G('vote', T.endIn - .5, 'flick', .2, 1);
    G('yes', T.yesW, 'pop', .3, .8); G('no', T.noW, 'pop', .3, .8);
    G('seam', T.seamIn, 'swish', .3, .8);
    STRESS = [at('dip', 'cute'), at('dip', 'detail'), at('turn', 'real'), at('turn', 'invasive'), at('nws', 'forecast'), at('nws', 'falling'), at('cold', 'cold'), at('cold', 'stunned'), at('count', '5000'), at('count', 'two')];
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { POSTERMODE = t === window.FILM.POSTER; frame(ctx, t); POSTERMODE = false; return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) { frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR)); actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0); }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .8;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -8; comp.ratio.value = 2; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); return o; }
    function env(pm, pts) { pm.value = pts[0][1]; pm.setValueAtTime(pts[0][1], 0); pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc2(type, f, t0, t1, pts, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function nband(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g, f) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = f || 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g, f) { var o = osc2('sine', f || 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function slap(t, g) { thump(t, .3 * g, 240); nband(t, t + .07, 2600, 1200, .14 * g, .01 * g, .9); tick(t, 1.1 * g, 2000); }
    function tock(t, g) { tick(t, .7 * g, 2600); thump(t, .12 * g, 520); }
    function swish(t, g) { nband(t, t + .2, 900, 3600, .2 * g, .03 * g, .8); }
    function pop(t, g) { var o = osc2('sine', 520, t, t + .12, [[t, 0], [t + .004, .18 * g], [t + .1, 0]]); o.frequency.exponentialRampToValueAtTime(880, t + .08); tick(t, .5 * g, 3000); }
    function flick(t, g) { var o = bus(1), hp2 = ac.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 1800; var n = noise(t, .08); n.connect(hp2); hp2.connect(o); env(o.gain, [[t, 0], [t + .004, .2 * g], [t + .05, .09 * g], [t + .075, 0]]); thump(t, .22 * g, 200); }
    /* the photo print flipping: a stiff paper flap and a soft card tap */
    function flip(t, g) { nband(t, t + .12, 1800, 4200, .16 * g, .02 * g, 1.2); tick(t + .13, .9 * g, 1800); thump(t + .13, .12 * g, 300); }
    /* our iguana tipping off the palm: a short falling whistle */
    function drop(t, g) { var o = osc2('sine', 1250, t, t + .3, [[t, 0], [t + .02, .07 * g], [t + .26, .05 * g], [t + .3, 0]]); o.frequency.exponentialRampToValueAtTime(420, t + .28); }
    /* the big iguana landing: a low paper thud */
    function thud(t, g) { thump(t, .55 * g, 120); nband(t, t + .06, 900, 300, .1 * g, .01 * g, .8); }
    var LEVEL = { thud: 3, tock: 2, slap: 3, swish: 3, pop: 2, flick: 3, flip: 3, drop: 3 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = { thud: -12, tock: -18, slap: -14, swish: -16, pop: -16, flick: -15, flip: -14, drop: -14 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      ({ thud: thud, slap: slap, tock: tock, swish: swish, pop: pop, flick: flick, flip: flip, drop: drop })[e.type](e.t, g);
    });
    /* no music: Isac adds a platform sound; the film ships voice + sound effects */
    var MUSIC = false; if (MUSIC) { /* intentionally empty */ }
    (function () { var o = bus(1), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = .5; var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = window.ROOM_GAIN || .03; })();
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 84px Archivo', '800 84px Archivo', '700 40px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0?“”…↑&\'–°'); }))).then(function () { return document.fonts.ready; }).then(function () {
      BG = buildBG(); PAPERBG = buildPaper(); EV.length = 0; initTimes(); BLUR = buildBlur();
      window.FILM.POSTER = Math.round((T.stamp + .45) * 30) / 30 + 1 / 60;
      window.FILM.SHOTS = [
        { id: 'hook', name: 'GTA 6 has iguanas', t0: 0, t1: start('caption') },
        { id: 'caption', name: 'Rockstar’s caption', t0: start('caption'), t1: start('street') },
        { id: 'street', name: 'In the street', t0: start('street'), t1: start('dip') },
        { id: 'dip', name: 'Cute detail?', t0: start('dip'), t1: start('turn') },
        { id: 'turn', name: 'Real Florida', t0: start('turn'), t1: start('nws') },
        { id: 'nws', name: 'Falling iguanas', t0: start('nws'), t1: start('cold') },
        { id: 'cold', name: 'Cold snap', t0: start('cold'), t1: start('count') },
        { id: 'count', name: '5,195 in two days', t0: start('count'), t1: start('end') },
        { id: 'end', name: 'Would you brake?', t0: start('end'), t1: DUR }];
      window.READY = true;
    });
  }
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-iguana', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
