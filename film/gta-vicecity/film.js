/* "GTA 6: Vice City is 29 years old" — four Vice Cities on one timeline, 1997, 2002, 2006 and 2026, for the Delta channel.
   Narrated first and cut to the voice: every beat reads a word time from vo/vo.js (window.VO). Pure function of t.
   Contract like ../nextword/film.js: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Native move: the year dial, a four-digit split-flap counter that flips forward on release years and rolls backwards
   on story years (tagged IN-GAME YEAR). Scene changes are the torn three-stripe wipe, passing under the dial.
   Own graphics only: no Rockstar footage, logo, key art or map art. Facts and sources: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur;
  var BG = '#0b0820', PANEL = '#1a1340', PANEL2 = '#2a1d5c', CREAM = '#fff3e6', DIM = 'rgba(255,243,230,.55)', FAINT = 'rgba(255,243,230,.16)';
  var PINK = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d', PURP = '#9b7bff', MINT = '#3be8a0', SAND = '#ffd36b', YEL = '#ffc65a';
  var DISP = 'Archivo', MONO = '"Geist Mono"';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .8); }
  function pop(t, t0) { return clamp(sp(t, t0, 3, .7), 0, 1.1); }
  function qt(t) { return (Math.floor(t * 30) + .5) / 30; }      // the frame the renderer samples, for displayed numbers

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function at(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function wend(id, word, nth) {
    var l = LINE[id], n = nth || 0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t1;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }

  /* ---------- the SFX gate: hits sit between words, never on them (vo/heard.js from the finished mix when present) ---------- */
  var EDGES = [], VOICED = [];
  VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  (window.HEARD || []).forEach(function (w) { if (w[1] < .15) return; VOICED.push({ t0: w[0], t1: w[1] }); EDGES.push(w[0], w[1]); });   // Whisper pins the first word to 0.00; the voice starts at 0.2
  function blocked(m) {
    var B = [], M = [];
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    return M;
  }
  function free(m) {
    var M = blocked(m), F = [], p = 0;
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { tick: .03, stamp: .17, thump: .16, flap: .05, blips: .3, blip: .1, boop: .22, ding: .5, swish: .26, rewind: .32, click: .05, rattle: .1 };
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m || .2).forEach(function (f) {
      var lo = f[0], hi = f[1] - body; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  function gapSpan(a, b, m) {
    var best = null;
    free(m || .2).forEach(function (f) { var lo = Math.max(a, f[0]), hi = Math.min(b, f[1]) - .03; if (hi - lo >= .06 && (!best || hi - lo > best[1] - best[0])) best = [lo, hi]; });
    return best;
  }
  /* a beat that carries a sound moves into the nearest free stretch (within tol); otherwise it stays on its word, silent */
  var GT = {}, GS = [];
  function G(id, t, type, tol, gain) {
    var n = nearGap(t, type);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .4 : tol)) { GT[id] = n; GS.push({ t: n, type: type, g: gain }); } else GT[id] = t;
    return GT[id];
  }

  /* ---------- scenes: the card under the dial changes era; a torn wipe between them ---------- */
  var SC = [
    { id: 'hook', name: 'From 1997', t0: 0 },
    { id: 'pixel', name: 'The first GTA', t0: start('gta1') - .3 },
    { id: 'post', name: 'Goes 3D', t0: start('vc') - .22 },
    { id: 'back', name: 'Set in 1986', t0: start('set') - .25 },
    { id: 'ruler', name: '40 years', t0: start('forty') - .5 },
    { id: 'hand', name: 'Vice City Stories', t0: start('vcs') - .22 },
    { id: 'leo', name: 'GTA 6', t0: start('now') - .42 },
    { id: 'quote', name: 'Rockstar’s words', t0: start('quote') - .2 },
    { id: 'time', name: '29 years', t0: start('span') - .85 }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  var S = {}; SC.forEach(function (s, i) { S[s.id] = i; });
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = end('best') + .3;
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }

  /* ---------- canvas + safe-area check ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true }, NOISE;
  var BOUNDS = null, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys);
    if (a < SAFE.x0 - .5 || b > SAFE.x1 + .5 || c > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
  }
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS) { var mm = this.measureText(str); recBox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent, str); }
      return orig.apply(this, arguments);
    };
  }
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function textW(g, text, px, wt, fam) { font(g, px, wt, fam); return g.measureText(text).width; }
  function fit(g, text, maxW, px, wt, fam) { var w = textW(g, text, px, wt, fam); return w > maxW ? px * maxW / w : px; }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    font(g, px, o.wt, o.fam);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad, w = tw + pad * 2, h = px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore();
    return w;
  }
  function label(g, text, x, y, a, col, px, align) {
    px = Math.max(36, px || 36);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillStyle = col || CREAM; try { g.letterSpacing = '2px'; } catch (e) {}
    g.fillText(text, x, y + (1 - Math.min(1, a)) * 10); g.restore();
  }
  function stamp(g, text, x, y, t, t0, t1, px, col, rot) {
    if (t < t0 || t > t1 + .3) return;
    var k = sp(t, t0, 3, .55), out = 1 - seg(t, t1, t1 + .3), s = lerp(1.3, 1, clamp(k, 0, 1.2));
    g.save(); g.globalAlpha = clamp(k * 3, 0, 1) * out; g.translate(x, y); g.rotate(rot == null ? -.08 : rot); g.scale(s, s);
    font(g, px, 900); var w = g.measureText(text).width + px * .7, h = px * 1.25;
    rr(g, -w / 2, -h / 2, w, h, px * .18); g.fillStyle = BG; g.fill(); g.strokeStyle = col; g.lineWidth = px * .09; g.stroke();
    g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, px * .05); g.restore();
  }
  function poly(g, pts, fill) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillStyle = fill; g.fill(); }
  function palm(g, x, y, h, lean, t, col, trunk) {
    g.save(); g.translate(x, y); g.strokeStyle = trunk || '#2a1d5c'; g.lineWidth = Math.max(4, h * .035); g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(lean * .5, -h * .5, lean, -h); g.stroke();
    g.translate(lean, -h); var sw = Math.sin(t * 1.6) * .05;
    for (var i = 0; i < 6; i++) { g.save(); g.rotate(-1.9 + i * .75 + sw); g.beginPath(); g.ellipse(0, -h * .28, h * .09, h * .3, 0, 0, 6.2832); g.fillStyle = col; g.fill(); g.restore(); }
    g.restore();
  }
  function arrowL(g, x0, x1, y, k, col) {          // an arrow drawn from x0 toward x1 (k = 0..1)
    if (k <= 0) return;
    var x = lerp(x0, x1, k), d = x1 > x0 ? 1 : -1;
    g.save(); g.strokeStyle = g.fillStyle = col; g.lineWidth = 10; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y); g.lineTo(x - d * 24, y); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - d * 40, y - 24); g.lineTo(x - d * 40, y + 24); g.closePath(); g.fill(); g.restore();
  }

  /* ---------- the Vice City sun: flat disc, ink stripes that keep sliding down ---------- */
  function sunPix(g, cx, cy, r, t) {          // 1997: a stepped, pixel-block disc with stepped stripes
    var B = 24, off = Math.floor(((t * .3) % 1) * 4) / 4, N = 8;
    g.save(); g.beginPath();
    for (var y = -r; y < r; y += B) { var yc = y + B / 2, hw = Math.round(Math.sqrt(Math.max(0, r * r - yc * yc)) / B) * B; if (hw > 0) g.rect(cx - hw, cy + y, 2 * hw, B); }
    g.clip();
    var gr = g.createLinearGradient(0, cy - r, 0, cy + r); gr.addColorStop(0, YEL); gr.addColorStop(.45, ORG); gr.addColorStop(1, PINK);
    g.fillStyle = gr; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    g.fillStyle = BG;
    for (var i = 0; i < N; i++) { var u = (i + off) / N, yy = Math.round((cy + r * (-.05 + Math.pow(u, 1.4) * 1.08)) / 12) * 12, th = Math.max(12, Math.round(r * (.008 + .11 * Math.pow(u, 1.3)) / 12) * 12); g.fillRect(cx - r - 2, yy - th / 2, 2 * r + 4, th); }
    g.restore();
  }
  function sunNeon(g, cx, cy, r, t) {         // 2002-2006: a neon-sign outline sun on ink, stripes as tubes
    var off = (t * .3) % 1, N = 8;
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.fillStyle = '#160f38'; g.fill(); g.clip();
    g.strokeStyle = PINK; g.lineWidth = 6; g.globalAlpha = .9;
    for (var i = 0; i < N; i++) { var u = (i + off) / N, y = cy + r * (-.05 + Math.pow(u, 1.4) * 1.08); g.beginPath(); g.moveTo(cx - r, y); g.lineTo(cx + r, y); g.stroke(); }
    g.restore();
    g.save(); g.lineWidth = 12; g.strokeStyle = PINK; g.beginPath(); g.arc(cx, cy, r - 6, 0, 6.2832); g.stroke();
    g.lineWidth = 5; g.strokeStyle = TEAL; g.beginPath(); g.arc(cx, cy, r - 26, 0, 6.2832); g.stroke(); g.restore();
  }
  function sunEra(g, cx, cy, r, t, home) {
    if (home) { sunPix(g, cx, cy, r, t); return; }
    var e1 = seg(t, SC[S.post].t0 - .2, SC[S.post].t0 + .2), e2 = seg(t, SC[S.leo].t0 - .2, SC[S.leo].t0 + .2);
    var wP = 1 - e1, wN = e1 * (1 - e2), wC = e2;
    [[wP, sunPix], [wN, sunNeon], [wC, sun]].forEach(function (x) { if (x[0] <= .001) return; g.save(); g.globalAlpha = x[0]; x[1](g, cx, cy, r, t); g.restore(); });
  }
  function sun(g, cx, cy, r, t) {
    var N = 8, off = (t * .3) % 1;
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.clip();
    var gr = g.createLinearGradient(0, cy - r, 0, cy + r); gr.addColorStop(0, YEL); gr.addColorStop(.45, ORG); gr.addColorStop(1, PINK);
    g.fillStyle = gr; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    g.fillStyle = BG;
    for (var i = 0; i < N; i++) {
      var u = (i + off) / N, y = cy + r * (-.05 + Math.pow(u, 1.4) * 1.08), th = r * (.008 + .11 * Math.pow(u, 1.3));
      g.fillRect(cx - r - 2, y - th / 2, 2 * r + 4, th);
    }
    g.restore();
  }

  /* =====================================================================================================
     THE YEAR DIAL · four split-flap tiles. DIAL lists every change: a jump flips all changed digits at once
     (a small stagger, like a hotel clock); a roll steps one year at a time, backwards or forwards.
     ===================================================================================================== */
  var TW = 160, TH = 232, TG = 14;
  var DIAL = [];
  function D(t, to, mode, dur) { DIAL.push({ t: t, to: to, mode: mode, dur: dur || 0 }); }
  function initDial() {
    D(0, '1997', 'rel');
    D(GT.d2002, '2002', 'rel');
    D(GT.d1986, '1986', 'game', GT.d1986e - GT.d1986);
    D(GT.d2006, '2006', 'rel');
    D(GT.d1984, '1984', 'game', GT.d1984e - GT.d1984);
    D(GT.d2026, '2026', 'rel');
    D(GT.dq, '????', 'ask');
  }
  function pad4(n) { return String(n); }
  /* the dial's state at t: current chars, next chars, flap progress per digit, mode */
  var ROLLP = 1.8;                              // rolls speed up: step k lands at (k/n)^(1/ROLLP) of the roll
  function dialAt(t) {
    t = qt(t);
    var cur = DIAL[0].to, mode = DIAL[0].mode, modeT = -9;
    for (var i = 1; i < DIAL.length; i++) {
      var d = DIAL[i]; if (t < d.t) break;
      var from = cur;
      if (d.dur > 0) {
        var a = +from, b = +d.to, n = Math.abs(b - a), sg = b > a ? 1 : -1, v = n * Math.pow(seg(t, d.t, d.t + d.dur), ROLLP), k = Math.floor(v);
        if (k < n) return { cur: pad4(a + sg * k), nxt: pad4(a + sg * (k + 1)), p: [v - k, v - k, v - k, v - k], mode: d.mode, modeT: modeT, busy: true };
        cur = d.to; mode = d.mode; modeT = d.t + d.dur; continue;
      }
      var P = [], any = false;
      for (var j = 0; j < 4; j++) { var pj = seg(t, d.t + j * .045, d.t + j * .045 + .3); P.push(pj); if (pj < 1) any = true; }
      if (any) return { cur: from, nxt: d.to, p: P, mode: d.mode, modeT: modeT, busy: true };
      cur = d.to; mode = d.mode; modeT = d.t + .435;
    }
    return { cur: cur, nxt: cur, p: [1, 1, 1, 1], mode: mode, modeT: modeT };
  }
  function digitCol(mode) { return mode === 'game' ? ORG : mode === 'ask' ? CREAM : PINK; }
  function halfTile(g, ch, top, w, h, sy, col, shade) {
    if (sy <= .001) return;
    g.save(); g.scale(1, sy);
    g.beginPath(); if (top) g.rect(-w / 2, -h / 2, w, h / 2); else g.rect(-w / 2, 0, w, h / 2); g.clip();
    rr(g, -w / 2, -h / 2, w, h, 22); g.fillStyle = PANEL; g.fill();
    font(g, 206, 900); g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 0, 10);
    if (shade) { g.fillStyle = 'rgba(11,8,32,' + shade + ')'; g.fillRect(-w / 2, -h / 2, w, h); }
    g.restore();
  }
  function drawDial(g, t, cx, cy, s, home) {
    var st = home ? { cur: '1997', nxt: '1997', p: [1, 1, 1, 1], mode: 'rel' } : dialAt(t), col = st.busy ? CREAM : digitCol(st.mode);   // a moving year is neutral cream: no colour claims a mode until it lands
    g.save(); g.translate(cx, cy); g.scale(s, s);
    var x0 = -(4 * TW + 3 * TG) / 2 + TW / 2;
    for (var i = 0; i < 4; i++) {
      var a = st.cur[i], b = st.nxt[i], p = st.p[i], x = x0 + i * (TW + TG);
      g.save(); g.translate(x, 0);
      /* shadow + frame */
      rr(g, -TW / 2 + 8, -TH / 2 + 10, TW, TH, 22); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
      if (a === b || p >= 1) {
        var ch = p >= 1 ? b : a;
        halfTile(g, ch, true, TW, TH, 1, col); halfTile(g, ch, false, TW, TH, 1, col);
      } else {
        halfTile(g, b, true, TW, TH, 1, col);              // behind: the new top
        halfTile(g, a, false, TW, TH, 1, col);             // behind: the old bottom
        if (p < .5) halfTile(g, a, true, TW, TH, Math.cos(p * Math.PI), col, p * .9);
        else halfTile(g, b, false, TW, TH, -Math.cos(p * Math.PI), col, (1 - p) * .9);
      }
      g.fillStyle = BG; g.fillRect(-TW / 2, -3, TW, 6);   // the split line
      g.fillStyle = 'rgba(255,243,230,.35)'; g.fillRect(-TW / 2 - 6, -12, 8, 24); g.fillRect(TW / 2 - 2, -12, 8, 24);   // hinges
      rr(g, -TW / 2, -TH / 2, TW, TH, 22); g.strokeStyle = 'rgba(255,243,230,.22)'; g.lineWidth = 4; g.stroke();
      g.restore();
    }
    g.restore();
    return st;
  }
  function dialPose(t, home) {
    if (home) return { x: 540, y: 800, s: 1.1 };
    var k = eio(seg(t, start('ask') - .5, start('ask') + .25));
    var kick = t >= at('hook', '1997') ? .035 * Math.exp(-(t - at('hook', '1997')) * 7) : 0;
    var breathe = .03 * Math.exp(-t * 4);
    return { x: 540, y: lerp(800, 640, k), s: lerp(1.1, 1, k) * (1 + breathe + kick) };
  }
  function modeTag(g, t, st, y) {
    if (t < SC[S.pixel].t0 + .35 || st.mode === 'ask' || st.busy) return;   // never a tag on a year that is still moving
    var k = pop(t, Math.max(SC[S.pixel].t0 + .35, st.modeT)), txt = st.mode === 'game' ? 'IN-GAME YEAR' : 'RELEASE YEAR';
    chip(g, txt, 540, y, { px: 44, bg: st.mode === 'game' ? ORG : TEAL, fg: BG, wt: 900, s: k, a: k * 3, rot: st.mode === 'game' ? .03 : -.02 });
  }

  /* ---------- background: ink, the sun, palms in the low corners ---------- */
  function stage(g, t, home) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var k = home ? 0 : eio(seg(t, start('ask') - .5, start('ask') + .25));
    sunEra(g, 540, lerp(820, 650, k), lerp(470, 370, k), t, home);
    if (k > 0) { g.save(); g.globalAlpha = k * .45; g.fillStyle = BG; g.beginPath(); g.arc(540, lerp(820, 650, k), lerp(470, 370, k) + 2, 0, 6.2832); g.fill(); g.restore(); }
    g.save(); g.globalAlpha = .9;
    palm(g, 110, 1900, 520, 40, t * .7, '#1f1650'); palm(g, 960, 1920, 600, -50, t * .7 + 1.3, '#1f1650'); palm(g, 250, 1920, 340, 20, t * .7 + 2, '#1f1650');
    g.restore();
  }

  /* =====================================================================================================
     SCENE · hook and ask
     ===================================================================================================== */
  function pixCar(g, x, y, a) {                // a side-view car built from 12 px blocks, 1997-style
    if (a <= 0) return;
    var B = 16, M = ['..oooooo....', '.oowwowwoo..', 'oooooooooooo', 'oooooooooooc', '.kk....kk...'];
    g.save(); g.globalAlpha *= a; g.translate(Math.round(x / B) * B, y);
    M.forEach(function (row, r) { for (var c = 0; c < row.length; c++) { var ch = row[c]; if (ch === '.') continue; g.fillStyle = ch === 'o' ? ORG : ch === 'w' ? '#7ff0e6' : ch === 'c' ? CREAM : BG; g.fillRect(c * B - 96, r * B - 80, B, B); } });
    g.restore();
  }
  function sceneHook(g, t, home) {
    var T = home ? 0 : t, out = 1 - seg(T, start('ask') - .45, start('ask') - .1);
    var ck = home ? 1 : lerp(.9, 1, eo(seg(T, 0, .3)));
    if (out > 0) chip(g, 'GTA 6', 540, 1190, { px: 120, bg: TEAL, fg: BG, wt: 900, rot: -.04, s: ck * lerp(.8, 1, out), a: out });
    pixCar(g, home ? 190 : 190 + T * 190, 1425, out);
    if (home) return;
    var vk = pop(t, at('hook', 'city') - .06);
    chip(g, 'VICE CITY', 540, 1310, { px: 64, bg: PINK, fg: BG, wt: 900, rot: .03, s: vk * lerp(.8, 1, out), a: vk * 3 * out });
    /* the ask: a ghosted 2026 below, a big ? between, HOW OLD? */
    var a0 = start('ask') - .1, q = pop(t, at('ask', 'old') - .1), gh = eo(seg(t, a0, a0 + .5));
    if (gh <= 0) return;
    var gx0 = 540 - (4 * 104 + 3 * 12) / 2 + 52;
    for (var i = 0; i < 4; i++) {
      var x = gx0 + i * 116, y = 1260 + (1 - gh) * 40 + Math.sin(t * 2 + i) * 4;
      g.save(); g.globalAlpha = gh; g.setLineDash([12, 10]); g.lineDashOffset = -t * 30; rr(g, x - 52, y - 72, 104, 144, 14); g.strokeStyle = 'rgba(255,243,230,.6)'; g.lineWidth = 4; g.stroke(); g.setLineDash([]);
      font(g, 104, 900); g.fillStyle = 'rgba(255,243,230,.45)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('2026'[i], x, y + 6); g.restore();
    }
    label(g, 'GTA 6 OUT', 540, 1375, gh, CREAM, 40);
    /* a dashed line from the dial down to the ghost, with the ? riding it */
    g.save(); g.globalAlpha = gh; g.strokeStyle = 'rgba(255,243,230,.5)'; g.lineWidth = 6; g.setLineDash([4, 18]); g.lineDashOffset = -t * 60; g.lineCap = 'round';
    g.beginPath(); g.moveTo(540, 790); g.lineTo(540, 1170); g.stroke(); g.restore();
    if (q > 0) {
      g.save(); g.translate(540, 1010); g.scale(q, q); g.rotate(Math.sin(t * 3) * .05);
      g.beginPath(); g.arc(0, 0, 118, 0, 6.2832); g.fillStyle = CREAM; g.fill();
      font(g, 190, 900); g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 12); g.restore();
    }
    var hk = pop(t, at('ask', 'old') + .1);
    chip(g, 'HOW OLD?', 760, 930, { px: 56, bg: ORG, fg: BG, wt: 900, rot: .06, s: hk, a: hk * 3 });
  }

  /* =====================================================================================================
     SCENE · the first GTA: our own pixel top-down tile, then three city rows
     ===================================================================================================== */
  var CELL = 56, GC = 12, GR = 9;
  function tileMap(seed) {              // 0 grass, 1 road, 2 building, 3 water, 4 palm, 5 roof pink
    var r = mulberry(seed), m = [];
    for (var y = 0; y < GR; y++) { m.push([]); for (var x = 0; x < GC; x++) m[y].push(0); }
    var rows = [2, 6], cols = seed % 2 ? [3, 8] : [2, 7];
    for (var y2 = 0; y2 < GR; y2++) for (var x2 = 0; x2 < GC; x2++) {
      if (x2 >= GC - 2 + (y2 % 3 === 0 ? 1 : 0)) { m[y2][x2] = 3; continue; }
      if (rows.indexOf(y2) >= 0 || cols.indexOf(x2) >= 0) { m[y2][x2] = 1; continue; }
      var v = r(); m[y2][x2] = v < .42 ? 2 : v < .55 ? 5 : v < .7 ? 4 : 0;
    }
    return { m: m, rows: rows, cols: cols };
  }
  var TILES = [tileMap(5), tileMap(8), tileMap(11)];
  function drawTile(g, tm, t, carOn) {    // drawn at 1x around (0,0): GC*CELL x GR*CELL
    var w = GC * CELL, h = GR * CELL, x0 = -w / 2, y0 = -h / 2;
    rr(g, x0 - 10, y0 - 10, w + 20, h + 20, 18); g.fillStyle = CREAM; g.fill();
    for (var y = 0; y < GR; y++) for (var x = 0; x < GC; x++) {
      var c = tm.m[y][x], px = x0 + x * CELL, py = y0 + y * CELL;
      g.fillStyle = c === 1 ? '#3a3360' : c === 3 ? TEAL : '#156b4a';
      g.fillRect(px, py, CELL, CELL);
      if (c === 1) { g.fillStyle = 'rgba(255,243,230,.5)'; if (tm.rows.indexOf(y) >= 0) g.fillRect(px + 14, py + CELL / 2 - 3, 28, 6); else g.fillRect(px + CELL / 2 - 3, py + 14, 6, 28); }
      if (c === 2 || c === 5) { g.fillStyle = c === 5 ? PINK : PURP; g.fillRect(px + 6, py + 6, CELL - 12, CELL - 12); g.fillStyle = 'rgba(11,8,32,.35)'; g.fillRect(px + 6, py + CELL - 16, CELL - 12, 10); g.fillStyle = CREAM; g.fillRect(px + 16, py + 16, 8, 8); }
      if (c === 4) { g.fillStyle = '#7a4a2a'; g.fillRect(px + 24, py + 24, 8, 8); g.fillStyle = MINT; g.fillRect(px + 12, py + 20, 32, 8); g.fillRect(px + 24, py + 8, 8, 32); g.fillRect(px + 16, py + 12, 8, 8); g.fillRect(px + 32, py + 36, 8, 8); }
      if (c === 3) { var wv = Math.floor(t * 3 + x + y) % 3; g.fillStyle = 'rgba(255,243,230,.55)'; g.fillRect(px + 10 + wv * 8, py + 20, 16, 5); }
    }
    if (!carOn) return;
    /* a car sprite driving the road loop (pixel steps, top view) */
    var L = [[tm.cols[0], tm.rows[0]], [tm.cols[1], tm.rows[0]], [tm.cols[1], tm.rows[1]], [tm.cols[0], tm.rows[1]]];
    var per = [], tot = 0; for (var i = 0; i < 4; i++) { var A = L[i], B = L[(i + 1) % 4], d = Math.abs(B[0] - A[0]) + Math.abs(B[1] - A[1]); per.push(d); tot += d; }
    var u = Math.floor(((t * 3.2) % tot) * 4) / 4, k = 0;
    while (u > per[k]) { u -= per[k]; k++; }
    var P = L[k], Q = L[(k + 1) % 4], cx = P[0] + Math.sign(Q[0] - P[0]) * u, cy = P[1] + Math.sign(Q[1] - P[1]) * u, horiz = P[1] === Q[1];
    var X = x0 + cx * CELL + CELL / 2, Y = y0 + cy * CELL + CELL / 2;
    g.save(); g.translate(X, Y); if (!horiz) g.rotate(Math.PI / 2);
    g.fillStyle = ORG; g.fillRect(-26, -15, 52, 30); g.fillStyle = BG; g.fillRect(-10, -11, 18, 22); g.fillStyle = CREAM; g.fillRect(14, -12, 6, 8); g.fillRect(14, 4, 6, 8);
    g.restore();
  }
  var ROWS = [{ name: 'LIBERTY CITY', y: 970 }, { name: 'SAN ANDREAS', y: 1125 }, { name: 'VICE CITY', y: 1280 }];
  function scenePixel(g, t) {
    var s0 = SC[S.pixel].t0, k = clamp(sp(t, s0 + .1, 2.2, .8), 0, 1.05);
    var m0 = start('map') - .05, mk2 = eio(seg(t, m0, m0 + .7));
    /* the tile: big in gta1, then shrinks into the Vice City row */
    var bx = lerp(520, 250, mk2), by = lerp(1150, ROWS[2].y, mk2) + (1 - Math.min(1, k)) * 160, bs = lerp(1, .26, mk2);
    g.save(); g.globalAlpha = clamp(k * 2, 0, 1); g.translate(bx, by); g.scale(bs, bs); drawTile(g, TILES[0], t, true); g.restore();
    /* the FIRST GTA chip, then TOP-DOWN */
    var fk = pop(t, at('gta1', 'first') - .05), fo = 1 - seg(t, m0, m0 + .25);
    chip(g, 'THE FIRST GTA', 520, 895, { px: 54, bg: CREAM, fg: BG, wt: 900, rot: -.04, s: fk, a: fk * 3 * fo });
    var tk = pop(t, at('map', 'above') - .05);
    chip(g, 'TOP-DOWN', 520, 880, { px: 54, bg: CREAM, fg: BG, wt: 900, rot: -.03, s: tk, a: tk * 3 });
    /* rows */
    var one = pop(t, at('map', 'one') - .05);
    ROWS.forEach(function (r, i) {
      var rk = i === 2 ? mk2 : pop(t, start('map') + .15 + i * .14);
      if (rk <= 0) return;
      var hot = i === 2 && one > 0;
      if (i < 2) { g.save(); g.globalAlpha = clamp(rk * 2, 0, 1); g.translate(250, r.y); g.scale(.26 * rk, .26 * rk); drawTile(g, TILES[i + 1], t + i, false); g.restore(); }
      if (hot) { g.save(); g.globalAlpha = clamp(one, 0, 1); rr(g, 140, r.y - 78, 780, 156, 26); g.strokeStyle = PINK; g.lineWidth = 8; g.stroke(); var pr = (t * 1.2) % 1; g.globalAlpha = (1 - pr) * .6 * clamp(one, 0, 1); rr(g, 140 - pr * 20, r.y - 78 - pr * 20, 780 + pr * 40, 156 + pr * 40, 30); g.lineWidth = 5; g.stroke(); g.restore(); }
      g.save(); g.globalAlpha = clamp(rk * 2, 0, 1); font(g, 60, 900); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = hot ? PINK : CREAM;
      g.fillText(r.name, 370 + (1 - Math.min(1, rk)) * 40, r.y + 4); g.restore();
    });
  }

  /* =====================================================================================================
     SCENE · 2002: a neon postcard; the flat skyline extrudes into 3D on "3D"
     ===================================================================================================== */
  var SKY = [[-250, 70, 150], [-180, 60, 230], [-112, 74, 175], [-30, 64, 270], [42, 70, 200], [118, 58, 245], [184, 64, 160]];
  function postcard(g, t, x, y, s, rot, d3a) {
    var w = 760, h = 470;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    rr(g, -w / 2 + 12, -h / 2 + 16, w, h, 20); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 20); g.fillStyle = CREAM; g.fill();
    var iw = w - 40, ih = h - 40;
    g.save(); rr(g, -iw / 2, -ih / 2, iw, ih, 12); g.clip();
    var gr = g.createLinearGradient(0, -ih / 2, 0, ih / 2); gr.addColorStop(0, '#2a1060'); gr.addColorStop(.6, '#8a2f9a'); gr.addColorStop(1, '#ff6a7a');
    g.fillStyle = gr; g.fillRect(-iw / 2, -ih / 2, iw, ih);
    sun(g, 150, 40, 120, t);
    /* the skyline: outlines, then extruded faces */
    var base = ih / 2 - 40;
    SKY.forEach(function (b, i) {
      var d3 = typeof d3a === 'number' ? d3a : d3a(i), bx = b[0], bw = b[1], bh = b[2] * (.55 + .45 * d3), dx = 26 * d3, dy = -18 * d3;
      if (d3 > 0) { poly(g, [[bx + bw, base], [bx + bw + dx, base + dy], [bx + bw + dx, base - bh + dy], [bx + bw, base - bh]], i % 2 ? '#0e8f86' : '#b8327a');
        poly(g, [[bx, base - bh], [bx + dx, base - bh + dy], [bx + bw + dx, base - bh + dy], [bx + bw, base - bh]], i % 2 ? '#7ff0e6' : '#ff9ccc'); }
      g.globalAlpha = d3; g.fillStyle = i % 2 ? TEAL : PINK; g.fillRect(bx, base - bh, bw, bh); g.globalAlpha = 1;
      g.strokeStyle = i % 2 ? TEAL : PINK; g.lineWidth = 5; g.strokeRect(bx, base - bh, bw, bh);
      g.fillStyle = d3 > .5 ? BG : (i % 2 ? TEAL : PINK);
      for (var r = 0; r < Math.floor(bh / 34) - 1; r++) for (var c = 0; c < 2; c++) if (hash(i * 31 + r * 7 + c) > .3) g.fillRect(bx + 14 + c * (bw - 38), base - bh + 18 + r * 34, 10, 14);
    });
    g.fillStyle = BG; g.fillRect(-iw / 2, base, iw, ih);
    for (var l = 0; l < 3; l++) { g.fillStyle = 'rgba(255,79,163,' + (.5 - l * .14) + ')'; g.fillRect(-iw / 2, base + 14 + l * 16 + (t * 20 % 16), iw, 4); }
    palm(g, -300, base + 6, 190, 18, t, MINT, '#1a1340');
    palm(g, 290, base + 6, 150, -16, t + 1, MINT, '#1a1340');
    g.restore();
    /* our own lettering */
    font(g, 46, 700); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
    g.save(); g.translate(-iw / 2 + 30, -ih / 2 + 50); g.transform(1, 0, -.2, 1, 0, 0); g.fillText('Greetings from', 0, 0); g.restore();
    g.save(); g.translate(-iw / 2 + 26, -ih / 2 + 128); g.transform(1, 0, -.22, 1, 0, 0); font(g, 104, 900);
    g.fillStyle = TEAL; g.fillText('VICE CITY', 7, 7); g.fillStyle = PINK; g.fillText('VICE CITY', 0, 0);
    g.restore();
    g.restore();
  }
  function scenePost(g, t) {
    var s0 = SC[S.post].t0, k = clamp(sp(t, s0 + .05, 2.2, .78), 0, 1.06);
    var d3 = function (i) { var a0 = at('vc', 'goes') - .25 + i * .1; return eio(seg(t, a0, a0 + .45)); };
    postcard(g, t, 520, 1135 + (1 - Math.min(1, k)) * 200, lerp(.85, 1, Math.min(1, k)), -.03 + Math.sin(t * 1.1) * .008, d3);
    var ck = pop(t, GT.ps2);
    chip(g, 'PS2 · OCT 2002', 690, 1352, { px: 46, bg: TEAL, fg: BG, wt: 900, rot: .03, s: ck, a: ck * 3 });
    var dk = pop(t, GT.p3d);
    chip(g, '3D', 230, 930, { px: 96, bg: ORG, fg: BG, wt: 900, rot: -.1, s: dk, a: dk * 3 });
  }

  /* =====================================================================================================
     SCENE · set in 1986: released 2002, story set 1986, an arrow that runs backwards
     ===================================================================================================== */
  function retroCar(g, x, y, s, t, rev) {
    g.save(); g.translate(x, y); g.scale(s, s);
    poly(g, [[-90, 0], [-86, -30], [-40, -34], [-18, -62], [40, -62], [62, -34], [92, -28], [94, 0]], PINK);
    poly(g, [[-10, -36], [8, -56], [36, -56], [52, -36]], '#7ff0e6'); poly(g, [[-34, -36], [-16, -56], [2, -56], [-6, -36]], '#7ff0e6');
    g.fillStyle = CREAM; g.fillRect(-90, -16, 184, 6);
    if (rev && Math.floor(t * 4) % 2 === 0) { g.fillStyle = CREAM; g.fillRect(-94, -26, 10, 12); }
    [-52, 58].forEach(function (wx) { g.beginPath(); g.arc(wx, 2, 22, 0, 6.2832); g.fillStyle = BG; g.fill(); g.beginPath(); g.arc(wx, 2, 9, 0, 6.2832); g.fillStyle = CREAM; g.fill();
      g.save(); g.translate(wx, 2); g.rotate(-t * 9); g.fillStyle = BG; g.fillRect(-2, -9, 4, 18); g.restore(); });
    g.restore();
  }
  function sceneBack(g, t) {
    var s0 = SC[S.back].t0, k = eio(seg(t, s0, s0 + .5));
    var pk = eio(seg(t, s0 - .05, s0 + .55));
    postcard(g, t, lerp(520, 690, pk), lerp(1135, 1000, pk), lerp(1, .42, pk), lerp(-.03, .04, pk), 1);
    var rk = pop(t, s0 + .15);
    chip(g, 'RELEASED 2002', 650, 1140, { px: 54, bg: TEAL, fg: BG, wt: 900, s: rk, a: rk * 3, rot: .02 });
    var TY = 1250, X0 = 170, X1 = 870;
    g.save(); g.globalAlpha = k; g.strokeStyle = FAINT; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(X0, TY); g.lineTo(X1, TY); g.stroke();
    for (var i = 0; i <= 16; i++) { var xx = lerp(X0, X1, i / 16); g.fillStyle = i === 0 || i === 16 ? CREAM : 'rgba(255,243,230,.35)'; g.fillRect(xx - 2, TY - (i % 4 === 0 ? 22 : 12), 4, i % 4 === 0 ? 44 : 24); }
    g.restore();
    var ak = eio(seg(t, at('set', 'set') - .2, wend('set', '1986')));
    arrowL(g, X1 - 20, X0 + 20, TY, ak, ORG);
    retroCar(g, lerp(X1 - 90, X0 + 110, ak), TY - 52, .9, t, ak > 0 && ak < 1);
    var sk = pop(t, s0 + .15);
    chip(g, 'STORY SET IN 1986', 420, 1362, { px: 58, bg: ORG, fg: BG, wt: 900, s: sk, a: sk * 3, rot: -.03 });
  }

  /* =====================================================================================================
     SCENE · forty years: a ruler from 1986 to 2026, the sun rolls along it, the hero stamp
     ===================================================================================================== */
  var RX0 = 210, RX1 = 815, RY = 990;
  function sceneRuler(g, t) {
    var s0 = SC[S.ruler].t0, k = eio(seg(t, s0 + .05, s0 + .5));
    g.save(); g.globalAlpha = k; g.lineCap = 'round';
    g.strokeStyle = FAINT; g.lineWidth = 10; g.beginPath(); g.moveTo(RX0, RY); g.lineTo(RX1, RY); g.stroke();
    var rk = eio(seg(t, GT.roll40, GT.roll40 + 1.1)), xs = lerp(RX0, RX1, rk);
    g.strokeStyle = PINK; g.lineWidth = 14; g.beginPath(); g.moveTo(RX0, RY); g.lineTo(xs, RY); g.stroke();
    for (var i = 0; i <= 40; i++) { var x = lerp(RX0, RX1, i / 40), big = i % 10 === 0; g.fillStyle = x <= xs + 1 ? PINK : 'rgba(255,243,230,.45)'; g.fillRect(x - 2, RY - (big ? 30 : 14), 4, big ? 60 : 28); }
    g.restore();
    sun(g, xs, RY - 70, 52, t);
    g.save(); g.globalAlpha = k;
    font(g, 72, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = ORG; g.fillText('1986', RX0, RY + 82); g.fillStyle = PINK; g.fillText('2026', RX1, RY + 82);
    g.restore();
    label(g, 'STORY YEAR', 100, RY + 150, k, CREAM, 38, 'left');
    label(g, 'GTA 6 OUT', 925, RY + 150, k, CREAM, 38, 'right');
    label(g, 'STORY 1986 \u2192 GTA 6 2026', 510, 1385, eo(seg(t, GT.st40 + .35, GT.st40 + .7)), CREAM, 44);
    /* brace over the ruler */
    var bk = eio(seg(t, GT.roll40 + .2, GT.roll40 + 1.0));
    if (bk > 0) { g.save(); g.strokeStyle = CREAM; g.lineWidth = 6; g.lineCap = 'round'; g.globalAlpha = bk; var m = (RX0 + RX1) / 2, hw = (RX1 - RX0) / 2 * bk;
      g.beginPath(); g.moveTo(m - hw, RY - 120); g.quadraticCurveTo(m - hw, RY - 150, m - hw + 40, RY - 150); g.lineTo(m - 30, RY - 150); g.lineTo(m, RY - 180); g.lineTo(m + 30, RY - 150); g.lineTo(m + hw - 40, RY - 150); g.quadraticCurveTo(m + hw, RY - 150, m + hw, RY - 120); g.stroke(); g.restore(); }
  }

  /* =====================================================================================================
     SCENE · 2006: a generic handheld (no logo) with the skyline on its screen; on "rewinds" the screen rewinds
     ===================================================================================================== */
  function sceneHand(g, t) {
    var s0 = SC[S.hand].t0, k = clamp(sp(t, s0 + .05, 2.2, .78), 0, 1.06), y = 1110 + (1 - Math.min(1, k)) * 220;
    var rw = t >= GT.d1984 && t < GT.d1984e + .5;
    g.save(); g.translate(520, y); g.rotate(Math.sin(t * 1.3) * .012 - .02);
    rr(g, -350 + 12, -165 + 16, 700, 330, 165); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -350, -165, 700, 330, 165); g.fillStyle = '#2e2560'; g.fill(); g.strokeStyle = 'rgba(255,243,230,.3)'; g.lineWidth = 5; g.stroke();
    /* screen */
    g.save(); rr(g, -200, -120, 400, 240, 14); g.fillStyle = BG; g.fill(); g.clip();
    var scroll = rw ? (t - GT.d1984) * 260 : (t - s0) * 30;
    var gr = g.createLinearGradient(0, -120, 0, 120); gr.addColorStop(0, '#2a1060'); gr.addColorStop(1, '#ff6a7a'); g.fillStyle = gr; g.fillRect(-200, -120, 400, 240);
    sun(g, 60, 10, 70, t);
    for (var i = -2; i < 8; i++) { var bx = ((i * 70 - scroll * (rw ? -1 : 1)) % 560 + 560) % 560 - 260, bh = 60 + hash(i + 40) * 80; g.fillStyle = i % 2 ? TEAL : PINK; g.fillRect(bx, 90 - bh, 46, bh); }
    g.fillStyle = BG; g.fillRect(-200, 90, 400, 40);
    if (rw && Math.floor(t * 5) % 2 === 0) { poly(g, [[-20, -60], [-70, -30], [-20, 0]], CREAM); poly(g, [[34, -60], [-16, -30], [34, 0]], CREAM); }
    g.restore();
    rr(g, -200, -120, 400, 240, 14); g.strokeStyle = 'rgba(255,243,230,.4)'; g.lineWidth = 4; g.stroke();
    /* d-pad and buttons */
    g.fillStyle = '#1a1340'; g.fillRect(-300, -14, 76, 28); g.fillRect(-276, -38, 28, 76);
    [[270, -34, PINK], [300, 6, TEAL], [240, 6, ORG], [270, 46, SAND]].forEach(function (b) { g.beginPath(); g.arc(b[0], b[1], 17, 0, 6.2832); g.fillStyle = b[2]; g.fill(); });
    g.restore();
    label(g, 'VICE CITY STORIES', 520, 900, eo(seg(t, s0 + .25, s0 + .6)), CREAM, 44);
    var pk = pop(t, s0 + .2), po = 1;
    chip(g, 'PSP · 2006', 300, 1350, { px: 50, bg: TEAL, fg: BG, wt: 900, rot: -.02, s: pk, a: pk * 3 * po });
    var sk = pop(t, GT.s84);
    chip(g, 'SET IN 1984', 690, 1350, { px: 50, bg: ORG, fg: BG, wt: 900, rot: .02, s: sk, a: sk * 3 });
  }

  /* =====================================================================================================
     SCENE · 2026: our own flat Leonida silhouette (from gta-leonida), the date and platforms
     ===================================================================================================== */
  var MAPL = { x: 130, y: 885, w: 400, h: 500 };
  var COAST = [[.04,.10],[.30,.03],[.52,.08],[.74,.03],[.96,.12],[.92,.30],[.98,.44],[.90,.58],[.82,.70],[.72,.78],[.66,.90],[.56,.93],[.50,.82],[.44,.70],[.34,.62],[.22,.60],[.10,.48],[.14,.34],[.02,.24]];
  var ISLETS = [[.60, .955, .05, .022, .2], [.52, .975, .045, .02, -.1], [.44, .965, .05, .022, .3], [.35, .985, .045, .02, 0], [.26, .975, .04, .018, -.2]];
  function mx(u) { return MAPL.x + u * MAPL.w; }
  function my(v) { return MAPL.y + v * MAPL.h; }
  function coastPath(g) {
    var P = COAST.map(function (p) { return [mx(p[0]), my(p[1])]; }), n = P.length;
    g.beginPath(); g.moveTo((P[n - 1][0] + P[0][0]) / 2, (P[n - 1][1] + P[0][1]) / 2);
    for (var i = 0; i < n; i++) { var a = P[i], b = P[(i + 1) % n]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    g.closePath();
  }
  function isletPath(g) { ISLETS.forEach(function (e) { g.moveTo(mx(e[0]) + e[2] * MAPL.w, my(e[1])); g.ellipse(mx(e[0]), my(e[1]), e[2] * MAPL.w, e[3] * MAPL.h, e[4], 0, 6.2832); }); }
  function sceneLeo(g, t) {
    var s0 = SC[S.leo].t0, k = clamp(sp(t, s0 + .05, 2.2, .8), 0, 1.05);
    g.save(); g.globalAlpha = clamp(k * 2, 0, 1); g.translate(330, 1135); g.scale(lerp(.8, 1, Math.min(1, k)), lerp(.8, 1, Math.min(1, k))); g.translate(-330, -1135);
    g.save(); g.translate(12, 14); coastPath(g); g.fillStyle = TEAL; g.fill(); g.beginPath(); isletPath(g); g.fill(); g.restore();
    coastPath(g); g.fillStyle = PINK; g.fill(); g.beginPath(); isletPath(g); g.fill();
    g.save(); coastPath(g); g.strokeStyle = CREAM; g.lineWidth = 6; g.setLineDash([50, 600]); g.lineDashOffset = -t * 300; g.stroke(); g.restore();
    /* Vice City: a pulsing dot */
    var dx = mx(.80), dy = my(.58), dk = pop(t, GT.leoDot);
    for (var r = 0; r < 2; r++) { var pr = ((t - s0) * .9 + r * .5) % 1; g.globalAlpha = (1 - pr) * .8 * clamp(dk, 0, 1); g.strokeStyle = CREAM; g.lineWidth = 5; g.beginPath(); g.arc(dx, dy, 20 + pr * 70, 0, 6.2832); g.stroke(); }
    g.globalAlpha = clamp(dk * 2, 0, 1); g.beginPath(); g.arc(dx, dy, (20 + 14 * Math.sin(Math.PI * seg(t, GT.leoBack, GT.leoBack + .5))) * Math.min(1.1, dk), 0, 6.2832); g.fillStyle = CREAM; g.fill(); g.lineWidth = 6; g.strokeStyle = BG; g.stroke();
    g.restore();
    var vk = pop(t, GT.leoDot + .15);
    g.save(); g.globalAlpha = clamp(vk * 3, 0, 1); g.strokeStyle = CREAM; g.lineWidth = 4; g.beginPath(); g.moveTo(dx - 14, dy + 16); g.lineTo(300, 1300); g.stroke(); g.restore();
    chip(g, 'VICE CITY', 250, 1330, { px: 44, bg: CREAM, fg: BG, wt: 900, s: vk, a: vk * 3, rot: -.03 });
    /* the date card and the platform card, right column */
    var ck = pop(t, s0 + .2);
    if (ck > 0) {
      g.save(); g.globalAlpha = clamp(ck * 3, 0, 1); g.translate(745, 1005); g.scale(ck, ck); g.rotate(.03);
      rr(g, -170, -115, 340, 230, 26); g.fillStyle = CREAM; g.fill();
      font(g, 86, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = BG; g.fillText('NOV 19', 0, -40); g.fillStyle = PINK; g.fillText('2026', 0, 50);
      g.restore();
    }
    var pk = pop(t, s0 + .4);
    if (pk > 0) {
      g.save(); g.globalAlpha = clamp(pk * 3, 0, 1); g.translate(745, 1255); g.scale(pk, pk); g.rotate(-.02);
      rr(g, -170, -105, 340, 210, 26); g.fillStyle = PANEL2; g.fill(); g.strokeStyle = TEAL; g.lineWidth = 6; g.stroke();
      font(g, 56, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('PS5', 0, -54);
      font(g, 46, 900); g.fillStyle = TEAL; g.fillText('XBOX', 0, 6); g.fillText('SERIES X|S', 0, 60);
      g.restore();
    }
  }

  /* =====================================================================================================
     SCENE · Rockstar's words, exactly, cut with an ellipsis
     ===================================================================================================== */
  function sceneQuote(g, t) {
    var s0 = SC[S.quote].t0, k = clamp(sp(t, s0 + .05, 2.2, .78), 0, 1.06);
    g.save(); g.translate(520, 1110 + (1 - Math.min(1, k)) * 200); g.rotate(-.03 + Math.sin(t * 1.2) * .006);
    rr(g, -380 + 12, -235 + 16, 760, 470, 18); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -380, -235, 760, 470, 18); g.fillStyle = CREAM; g.fill();
    /* tape */
    [[-330, -232, -.5], [330, -232, .5]].forEach(function (p) { g.save(); g.translate(p[0], p[1]); g.rotate(p[2]); g.fillStyle = 'rgba(25,211,197,.75)'; g.fillRect(-60, -18, 120, 36); g.restore(); });
    var qk = 1 + .25 * Math.sin(Math.PI * seg(t, GT.qwe - .05, GT.qwe + .3));
    g.save(); g.translate(-300, -110); g.scale(qk, qk); font(g, 180, 900); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = PINK; g.fillText('“', -40, 50); g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    var px = fit(g, 'We’re a long way', 600, 82, 900);
    font(g, px, 900); g.fillStyle = BG; g.fillText('We’re a long way', -230, -90);
    g.fillText('from the ’80s…', -230, 10);
    var wFrom = textW(g, 'from the ', px, 900), w80 = textW(g, '’80s', px, 900);
    var uk = eio(seg(t, GT.q80, GT.q80 + .45));
    if (uk > 0) { g.strokeStyle = PINK; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(-230 + wFrom, 34); g.lineTo(-230 + wFrom + w80 * uk, 34 + Math.sin(uk * 6) * 3); g.stroke(); }
    font(g, 38, 500, MONO); g.fillStyle = '#5a4a8a'; try { g.letterSpacing = '2px'; } catch (e) {}
    g.fillText('— ROCKSTAR', -330, 150); g.fillText('ROCKSTARGAMES.COM/VI', -330, 200);
    g.restore();
    /* "a long way": a road under the card, the car drives it */
    var rdk = eo(seg(t, GT.qlong - .3, GT.qlong));
    if (rdk > 0) { g.save(); g.globalAlpha = rdk; g.strokeStyle = 'rgba(255,243,230,.5)'; g.lineWidth = 6; g.setLineDash([30, 22]); g.lineDashOffset = t * 120; g.beginPath(); g.moveTo(110, 1405); g.lineTo(930, 1405); g.stroke(); g.restore();
      var ck = seg(t, GT.qlong, GT.qlong + 1.9); retroCar(g, lerp(80, 1000, ck), 1392, .6, t, false); }
  }

  /* =====================================================================================================
     SCENE · 29 years: the four Vice Cities on one proportional timeline; then the vote
     ===================================================================================================== */
  var TL = { x0: 170, x1: 840, y: 1110 };
  function tx(year) { return lerp(TL.x0, TL.x1, (year - 1997) / 29); }
  function mini(g, i, t) {
    if (i === 0) { g.scale(.21, .21); drawTile(g, TILES[0], t, true); }
    else if (i === 1) postcard(g, t, 0, 0, .19, -.04, 1);
    else if (i === 2) { rr(g, -70, -36, 140, 72, 36); g.fillStyle = '#2e2560'; g.fill(); rr(g, -38, -22, 76, 44, 6); g.fillStyle = PINK; g.fill(); g.fillStyle = TEAL; g.fillRect(-58, -6, 14, 14); g.beginPath(); g.arc(52, 0, 8, 0, 6.2832); g.fill(); }
    else { g.scale(.32, .32); g.translate(-(MAPL.x + MAPL.w * .5), -(MAPL.y + MAPL.h * .5)); coastPath(g); g.fillStyle = PINK; g.fill(); }
  }
  function sceneTime(g, t) {
    var s0 = SC[S.time].t0, k = eio(seg(t, s0 + .05, s0 + .5)), bo = 1 - seg(t, GT.dq - .1, GT.dq + .15);
    g.save(); g.globalAlpha = k; g.strokeStyle = CREAM; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(TL.x0, TL.y); g.lineTo(TL.x1, TL.y); g.stroke(); g.restore();
    var YRS = [1997, 2002, 2006, 2026], COL = [PINK, TEAL, ORG, PINK], TIER = [1015, 905, 1015, 1015], LY = [1162, 1162, 1214, 1162];
    YRS.forEach(function (y, i) {
      var pk = pop(t, s0 + .15 + i * .12), x = tx(y);
      if (pk <= 0) return;
      if (TIER[i] < 1000) { g.save(); g.globalAlpha = clamp(pk * 3, 0, 1); g.strokeStyle = COL[i]; g.lineWidth = 4; g.beginPath(); g.moveTo(x, TIER[i] + 50); g.lineTo(x, TL.y); g.stroke(); g.restore(); }
      g.save(); g.globalAlpha = clamp(pk * 3, 0, 1); g.translate(x, TIER[i] - Math.sin(t * 2 + i) * 4); g.scale(pk, pk); mini(g, i, t); g.restore();
      g.save(); g.globalAlpha = clamp(pk * 3, 0, 1); g.beginPath(); g.arc(x, TL.y, 14, 0, 6.2832); g.fillStyle = COL[i]; g.fill(); g.restore();
      label(g, String(y), x, LY[i], clamp(pk * 2, 0, 1), CREAM, 42);
    });
    var bk = eio(seg(t, GT.s29 - .45, GT.s29 - .05)) * bo;
    if (bk > 0) { g.save(); g.strokeStyle = PINK; g.lineWidth = 7; g.lineCap = 'round'; g.globalAlpha = bk; var m = (TL.x0 + TL.x1) / 2, hw = (TL.x1 - TL.x0) / 2 * Math.min(1, bk * 1.2), Y = 1262;
      g.beginPath(); g.moveTo(m - hw, Y - 26); g.quadraticCurveTo(m - hw, Y, m - hw + 34, Y); g.lineTo(m - 26, Y); g.lineTo(m, Y + 26); g.lineTo(m + 26, Y); g.lineTo(m + hw - 34, Y); g.quadraticCurveTo(m + hw, Y, m + hw, Y - 26); g.stroke(); g.restore(); }
    if (t >= GT.s29) { var nk = sp(t, GT.s29, 3, .55), sc = lerp(1.3, 1, clamp(nk, 0, 1.2));
      chip(g, '29 YEARS', 505, 1338, { px: 92, bg: PINK, fg: BG, wt: 900, rot: -.04, s: sc, a: clamp(nk * 3, 0, 1) * bo }); }
    label(g, 'BY RELEASE YEAR \u00b7 2026 \u2212 1997', 505, 1418, eo(seg(t, GT.s29 + .2, GT.s29 + .5)) * bo, CREAM, 36);
    YRS.forEach(function (v, i) {
      var vk = pop(t, GT.vote[i]), col = i % 2, row = (i / 2) | 0;
      chip(g, String(v), 330 + col * 370, 1290 + row * 118, { px: 70, bg: PANEL2, line: COL[i], fg: CREAM, wt: 900, lw: 5, pad: 34, s: vk, a: vk * 3, rot: (i % 2 ? .03 : -.03) });
    });
  }

  /* ---------- the wipe: a narrow torn-edge band in the three Vice City colours; the next card is already under it ---------- */
  var WIPE_HALF = .2;
  function wipeAt(t) {
    for (var i = 2; i < SC.length; i++) if (t >= SC[i].t0 - WIPE_HALF && t <= SC[i].t0 + WIPE_HALF) return i;
    if (t >= SC[1].t0 - WIPE_HALF && t <= SC[1].t0 + WIPE_HALF) return 1;
    return -1;
  }
  function tornX(bx, y, side) { return bx + (hash(Math.floor(y / 44) + side * 7) - .5) * 70; }
  function bandPath(g, bx, w) {
    g.beginPath(); g.moveTo(tornX(bx, 0, 0) - w, -10);
    for (var y = 0; y <= H + 44; y += 44) g.lineTo(tornX(bx, y, 0) - w, y);
    for (var y2 = H + 44; y2 >= 0; y2 -= 44) g.lineTo(tornX(bx, y2, 1) + w, y2);
    g.closePath();
  }
  function drawScene(g, t, si, home) {
    if (home || si === S.hook) sceneHook(g, t, home);
    else if (si === S.pixel) scenePixel(g, t);
    else if (si === S.post) scenePost(g, t);
    else if (si === S.back) sceneBack(g, t);
    else if (si === S.ruler) sceneRuler(g, t);
    else if (si === S.hand) sceneHand(g, t);
    else if (si === S.leo) sceneLeo(g, t);
    else if (si === S.quote) sceneQuote(g, t);
    else if (si === S.time) sceneTime(g, t);
  }
  var NOWIPE = {};     // every change is a wipe; the back scene carries the postcard over, so it slides instead
  function bottomLabel(g, t) {
    var si = sceneAt(t), s = SC[si], txt = null;
    if (si === S.pixel) txt = 'OUR DRAWING, NOT THE GAME’S MAP';
    else if (si === S.post) txt = 'OUR DRAWING';
    else if (si === S.back) txt = 'SETTING: GTA VICE CITY (2002)';
    else if (si === S.hand) txt = 'SETTING: VICE CITY STORIES';
    else if (si === S.leo) txt = 'SOURCE: ROCKSTARGAMES.COM/VI';
    if (!txt) return;
    var q = seg(t, s.t0 + .3, s.t0 + .55) * (1 - seg(t, s.t1 - .25, s.t1 - .1));
    label(g, txt, 510, 1418, q, CREAM, 36);
  }

  /* ---------- frame ---------- */
  function frame(g, t, homeMode) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    var si = homeMode ? 0 : sceneAt(t), wi = homeMode ? -1 : wipeAt(t);
    stage(g, t, homeMode);
    if (wi > 0 && !NOWIPE[SC[wi].id]) {
      var p = eio(seg(t, SC[wi].t0 - WIPE_HALF, SC[wi].t0 + WIPE_HALF)), bx = lerp(-160, W + 160, p);
      g.save(); g.beginPath(); g.moveTo(0, -10); for (var ya = 0; ya <= H + 44; ya += 44) g.lineTo(tornX(bx, ya, 0), ya); g.lineTo(0, H + 44); g.closePath(); g.clip();
      drawScene(g, Math.min(t + .3, SC[wi].t1), wi, false); g.restore();
      g.save(); g.beginPath(); g.moveTo(W, -10); for (var yb = 0; yb <= H + 44; yb += 44) g.lineTo(tornX(bx, yb, 1), yb); g.lineTo(W, H + 44); g.closePath(); g.clip();
      drawScene(g, Math.min(t, SC[wi - 1].t1), wi - 1, false); g.restore();
      [[TEAL, -26], [ORG, 26], [PINK, 0]].forEach(function (c) { g.save(); g.translate(c[1], 0); bandPath(g, bx, 22); g.fillStyle = c[0]; g.fill(); g.restore(); });
    } else drawScene(g, t, si, homeMode);
    /* the dial rides above every scene and every wipe */
    var P = dialPose(t, homeMode), st = drawDial(g, t, P.x, P.y, P.s, homeMode);
    if (homeMode) return;
    modeTag(g, t, st, P.y + TH / 2 * P.s + 44);
    STAMPS.forEach(function (s) { stamp(g, s[0], s[5], s[6], t, s[1], s[2], s[3], s[4], -.06); });
    bottomLabel(g, t);
    if (LIVE.text) captions(g, t);
    /* the loop: the last frame dissolves back into frame 0 */
    var back = eio(seg(t, HOME, HOME + .45));
    if (back > 0) { g.save(); g.globalAlpha = back; frame(g, 0, true); g.restore(); }
    g.fillStyle = 'rgba(255,243,230,.12)'; g.fillRect(60, 140, W - 120, 6);
    g.fillStyle = PINK; g.fillRect(60, 140, (W - 120) * t / DUR, 6);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var STAMPS = [];

  /* ---------- captions: the narrator's words, highlighted as spoken ---------- */
  function captions(g, t) {
    var card = null;
    VO.captions.forEach(function (c) { if (t >= c.t0 - .04 && t < c.t1 + .15) card = c; });
    if (!card) return;
    var k = clamp(spring(t - card.t0 + .04, 3.2, .7), 0, 1.1), out = 1 - seg(t, card.t1, card.t1 + .15);
    g.save(); g.font = '800 80px Archivo'; try { g.fontStretch = 'expanded'; } catch (e) {}
    g.textBaseline = 'alphabetic';
    var words = card.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 24;
    var lines = [[]], lw = [0], maxw = 780;
    words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; });
    var y0 = 370 - (lines.length - 1) * 48;
    g.globalAlpha = out;
    lines.forEach(function (ln, li) {
      var x = 520 - (lw[li] - gap) / 2, y = y0 + li * 96 + (1 - Math.min(1, k)) * 40;
      ln.forEach(function (i) {
        var w = words[i], cur = STRESS[norm(w.w)] && t >= w.t0 - .03 && t < w.t1 + .05, said = t >= w.t0 - .03;
        if (cur) { g.fillStyle = PINK; g.beginPath(); g.roundRect(x - 12, y - 70, ws[i] + 24, 92, 18); g.fill(); }
        g.fillStyle = cur ? BG : said ? CREAM : 'rgba(255,243,230,.3)';
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }
  /* only stressed words get the pink highlight (per-word highlighting reads as stock auto-captions) */
  var STRESS = {}; ['1997', 'old', 'first', 'above', 'three', 'one', '2002', '3d', '1986', 'forty', '2006', 'rewinds', '1984', 'november', '19th', 'back', '80s', '29', 'best', 'year'].forEach(function (w) { STRESS[w] = 1; });

  /* ---------- text dwell for the read check ---------- */
  function TEXTS(t) {
    var out = [], si = sceneAt(t);
    function add(id, text) { out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    if (si === S.hook && t < start('ask') - .2) add('hook', 'GTA 6 1997');
    if (si === S.hook && t > at('hook', 'city') && t < start('ask') - .15) add('hookvc', 'VICE CITY');
    if (si === S.hook && t >= start('ask') - .2) add('ask', 'HOW OLD?');
    if (si === S.pixel) add(t < start('map') ? 'pixel' : 'rows', t < start('map') ? 'THE FIRST GTA' : 'TOP-DOWN VICE CITY');
    if (si === S.pixel && t > start('map') + .3) add('rows2', 'LIBERTY CITY SAN ANDREAS');
    if (si === S.post && t > GT.ps2 + .05) add('post', 'PS2 OCT 2002');
    if (si === S.back && t > SC[S.back].t0 + .2) add('back', 'RELEASED 2002');
    if (si === S.back && t > SC[S.back].t0 + .2) add('back86', 'STORY SET IN 1986');
    if (t > GT.d1986e && t < GT.d2006) add('dial86', '1986 IN-GAME YEAR');
    if (t > GT.st40 + .15 && t < SC[S.hand].t0 - .25) add('stamp40', '40 YEARS');
    if (si === S.ruler && t > GT.st40 + .5) add('ruler', 'STORY 1986 GTA 6 2026');
    if (si === S.hand && t > SC[S.hand].t0 + .3) add('hand', 'PSP 2006');
    if (si === S.hand && t > GT.s84 + .15) add('hand84', 'SET IN 1984');
    if (si === S.leo && t > SC[S.leo].t0 + .3) add('leo', 'NOV 19 2026');
    if (si === S.leo && t > SC[S.leo].t0 + .5) add('plat', 'PS5 XBOX SERIES X|S');
    if (si === S.quote && t > SC[S.quote].t0 + .1) add('quote', 'We\u2019re a long way from the \u201980s\u2026');
    if (si === S.time && t > GT.s29 + .15 && t < GT.dq) add('span', '29 YEARS');
    if (si === S.time && t > GT.vote[0] + .2 && t < HOME) add('best', '1997 2002 2006 2026');
    return out;
  }

  /* ---------- timings that carry sound go into the pauses; then the events ---------- */
  var EV = [];
  function initGaps() {
    GT.d2002 = SC[S.post].t0 - .15;                                   /* forward flips land under the wipe, in the pause, with a flap per digit */
    GT.d1986 = wend('set', '1986') + .15; GT.d1986e = GT.d1986 + .45;  /* the backward roll sits in the pause after "1986" */
    GT.roll40 = start('forty') - .05;
    G('st40', start('forty') - .3, 'stamp', .35, .55);
    GT.d2006 = SC[S.hand].t0 - .14;
    GT.s84 = at('vcs', 'Stories') - .05;
    GT.d1984 = wend('vcs', '1984') + .15; GT.d1984e = GT.d1984 + .42;  /* the rewind, in the pause after "1984" */
    G('rew', GT.d1984, 'rewind', .15, .7);
    GT.d2026 = SC[S.leo].t0 - .15;
    GT.ps2 = G('ps2', wend('vc', '2002') + .15, 'blip', .3, .9);
    GT.p3d = G('p3d', wend('vc', '3D') + .05, 'blip', .4, .9);
    GT.leoDot = SC[S.leo].t0 + .45; GT.leoBack = G('leoBack', wend('now', 'back') + .05, 'blip', .3, .9);
    GT.q80 = at('quote', '80s'); GT.qwe = at('quote', 'we\u2019re'.replace('\u2019', "'")); GT.qlong = at('quote', 'long');
    GT.s29 = G('s29', SC[S.time].t0 + .37, 'stamp', .3, .5);            /* 29 YEARS slams in the pause before "That's 29 years" */
    GT.dq = G('dq', wend('span', 'City') + .18, 'flap', .3, .5);
    GT.vote = [0, 1, 2, 3].map(function (i) { return GT.dq + .17 + i * .05; });
  }
  function initTimes() {
    function A(t, type, g, extra) { if (t !== null) { var e = { t: t, type: type, g: g }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); } }
    GS.forEach(function (e) { A(e.t, e.type, e.g); });
    SC.forEach(function (sc, i) { if (i > 1 && i !== S.ruler) { var s = gapSpan(sc.t0 - .22, sc.t0 + .2); if (s) A(s[0], 'swish', .9, { t1: s[1] }); } });
    var FR = free(.2);
    function ok(t0, body) { return FR.some(function (f) { return t0 >= f[0] && t0 + body <= f[1]; }); }
    DIAL.forEach(function (d, i) {
      if (!i) return;
      var from = DIAL[i - 1].to;
      if (d.dur > 0) {                                  /* a tick on every step; the steps speed up, so the ticks do too */
        var n = Math.abs(+d.to - +from), last = -9;
        for (var k = 1; k <= n; k++) { var tk = d.t + d.dur * Math.pow(k / n, 1 / ROLLP); if (tk - last >= .022 && ok(tk, .05)) { A(tk, 'tick', .3 + .2 * k / n); last = tk; } }
        if (ok(d.t + d.dur, .16) && !GS.some(function (x) { return Math.abs(x.t - d.t - d.dur) < .25; })) A(d.t + d.dur, 'thump', .5);
      } else for (var j = 0; j < 4; j++) if (from[j] !== d.to[j] && ok(d.t + j * .045, .05)) A(d.t + j * .045, 'flap', .7);
    });
    /* pixel tile and rows: 8-bit blips in the gaps */
    var tb = nearGap(SC[S.pixel].t0 + .1, 'blips'); if (tb !== null && Math.abs(tb - SC[S.pixel].t0 - .1) < .4) A(tb, 'blips', .7);
    ['first', 'above', 'three', 'one'].forEach(function (w, i) { var id = i === 0 ? 'gta1' : 'map', b = nearGap(at(id, w) - .1, 'blip', .14); if (b !== null && Math.abs(b - at(id, w)) < .35) A(b, 'blip', .8, { f: 700 + i * 120 }); });
    GT.vote.forEach(function (v, i) { if (ok(v, .1)) A(v, 'blip', .8, { f: 650 + i * 110 }); });
    EV = EV.filter(function (e) { return e.t !== null && e.t >= 0 && e.t < DUR; });
    EV.sort(function (a, b) { return a.t - b.t; });
    for (var i = EV.length - 1; i > 0; i--) if (EV[i].type === EV[i - 1].type && EV[i].t - EV[i - 1].t < .02) EV.splice(i, 1);
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

  /* ---------- sound effects only (no music; Isac adds a trending sound on the platform) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .72;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], pts[0][0]); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], pts[k][0]); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, pts, pan, gain) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); o.connect(og); og.connect(bus(gain == null ? 1 : gain, pan)); env(og.gain, pts); o.start(t0); o.stop(t1); return o; }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function blip(t, f, g) { var o = osc('square', f, t, t + .1, [[t, 0], [t + .004, (g || 1) * .035], [t + .08, 0]], (f - 1000) / 1600); o.frequency.setValueAtTime(f * 1.5, t + .04); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function flap(t, g) { var n = noise(t, .06), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 1.4; var o = bus(1, (rnd() - .5) * .4); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .002, .5 * (g || 1)], [t + .04, 0]]); thump(t, .08 * (g || 1)); }
    function tick(t, g) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, .45 * (g || 1)], [t + .022, 0]]); }
    function ding(t, g) { [76, 83, 88].forEach(function (m, j) { osc('sine', mtof(m), t + j * .04, t + .55, [[t + j * .04, 0], [t + j * .04 + .005, .08 * (g || 1)], [t + .5, 0]], (j - 1) * .4); }); }
    function stampS(t, g) { thump(t, .6 * (g || 1)); var n = noise(t, .16), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1800; var o = bus(1); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, .4 * (g || 1)], [t + .13, 0]]); }
    EV.forEach(function (e) {
      var g = e.g == null ? 1 : e.g;
      if (e.type === 'blip') blip(e.t, e.f || 880, g);
      else if (e.type === 'blips') for (var j = 0; j < 5; j++) blip(e.t + j * .055, 523 * Math.pow(2, [0, 4, 7, 12, 16][j] / 12), g);
      else if (e.type === 'boop') { var o = osc('triangle', 330, e.t, e.t + .22, [[e.t, 0], [e.t + .01, .16 * g], [e.t + .2, 0]]); o.frequency.exponentialRampToValueAtTime(660, e.t + .18); }
      else if (e.type === 'ding') ding(e.t, g);
      else if (e.type === 'thump') thump(e.t, .4 * g);
      else if (e.type === 'flap') flap(e.t, g);
      else if (e.type === 'tick') tick(e.t, g);
      else if (e.type === 'swish') band(e.t, Math.min(e.t1 || e.t + .24, e.t + .26), 900, 5200, .12 * g, .02, 1.6);
      else if (e.type === 'stamp') stampS(e.t, g);
      else if (e.type === 'rewind') { var r = osc('sawtooth', 900, e.t, e.t + .32, [[e.t, 0], [e.t + .02, .03 * g], [e.t + .28, .03 * g], [e.t + .32, 0]]); r.frequency.linearRampToValueAtTime(300, e.t + .32); }
    });
    env(master.gain, [[0, .72], [DUR - .3, .72], [DUR, .5]]);
  }

  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); watch(ctx); watch(tctx); acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['800 84px Archivo', '900 46px Archivo', '700 46px Archivo', '500 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%“”’…'); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  initGaps();
  initDial();
  STAMPS = [['40 YEARS', GT.st40, SC[S.hand].t0 - .25, 118, ORG, 510, 1250]];
  initTimes();
  /* poster: 40 YEARS fully landed, the caption above it gone (the pause after "comes out.") */
  var POSTER_T = GT.st40 + .9;
  VO.captions.forEach(function (c) { if (c.t0 >= start('forty') && c.t1 < start('vcs')) POSTER_T = c.t1 + .2; });
  POSTER_T = Math.min(POSTER_T, SC[S.hand].t0 - .3);
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: POSTER_T, SLUG: 'gta-vicecity', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
