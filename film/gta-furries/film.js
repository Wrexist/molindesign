/* "GTA 6 made furries illegal": Delta, "It has X, shown", commentary mode (slug gta-furries). Sources in BRIEF.md.
   An in-game TV ad from the "Anti-Furry Association" says furry activity is illegal in Leonida and to report it;
   reviewers met a furry under a police helicopter; break the blockade and you can help them escape; in one
   player's run the hideout has a gun wall and the reward is a choice: GUN / CASH ($15,000).
   Set: LEONIDA NIGHT BROADCAST. A flat, hand-built CRT TV set playing our re-created PSA, a police light bar, a
   police helicopter with a searchlight, our own fox-suit mascot, sawhorse barricades that snap apart, a sealed
   reward envelope, police tape along the floor. Native move: the TV set (frame 0 and the loop seam) and the
   blockade that breaks open onto the gameplay card.
   Footage: three creator clips (rule 10, @nerpah, facecam cropped, credit in the description only) in a cream card;
   six official Rockstar plates (rule 11, each at 0.75x or faster) dimmed under the hook / ad / dip / fox beats, plus a
   seam plate that runs straight into the hook plate (same shot) so the loop plays continuous footage.
   Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Engine from gta-iguana. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 540;
  var INK = '#120d22', NIGHT = '#0b0818', CREAM = '#fff3dc', RED = '#ff2b45', BLUE = '#2f6bff', SUN = '#ffd21f', FOX = '#ff7a1f', FOXD = '#c44d0c', WOOD = '#7b4a2a', WOODD = '#5a331b', GREEN = '#1f8a4c';
  var DISP = 'Archivo', MONO = '"Geist Mono"';
  var BY1 = 1430, TAU = Math.PI * 2;
  /* loop-periodic rates: every drifting thing returns to its frame-0 phase at DUR */
  function per(rate) { return Math.max(1, Math.round(DUR * rate)) / DUR; }
  var TAPEV = 120 * per(70 / 120), ROLL = per(.55), BLINK = per(2), BOB = TAU * per(5 / TAU);

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

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}, ORDER = []; VO.lines.forEach(function (l) { LINE[l.id] = l; ORDER.push(l.id); });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w).indexOf(norm(word)) === 0 && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
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
  var BODY = { knock: .3, rotor: .8, roll: .35, kaching: .9, swish: .22, slap: .1, tock: .06, pop: .1, flick: .07, flip: .16, thud: .18, crash: .3, whoop: .3, stat: .14 };
  function nearGap(t, type, m) {
    var bd = BODY[type] || .12, best = null;
    free(m || .08).forEach(function (f) { var lo = f[0], hi = f[1] - bd; if (hi < lo) return; var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c; });
    return best;
  }
  var GT = {}, EV = [];
  /* a hit: snapped into the nearest pause within tol; the picture keeps its own time (the hit is sound only) */
  function G(id, t, type, tol, gain) {
    var n = nearGap(t, type);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .3 : tol)) { GT[id] = n; EV.push({ t: n, type: type, g: gain == null ? 1 : gain, id: id }); }
    else { GT[id] = t; EV.push({ t: t, type: type, g: (gain == null ? 1 : gain) * .35, id: id, under: true }); }   // no pause near the move: play it on the move, softer, under the voice
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
    rr(g, -w / 2 + 6, -h / 2 + 8, w, h, 10); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 10); g.fillStyle = bg; g.fill();
    if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = 5; g.stroke(); }
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
     THE SET: Leonida night broadcast. Ink-violet night, police tape along the floor, our props flat and hand-built.
     ===================================================================================================== */
  var T = {}, U = {};
  var BG, NOISE;
  function buildBG() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(19);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1d1438'); gr.addColorStop(.6, '#120c26'); gr.addColorStop(1, '#08060f'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    /* halftone dots, denser toward the floor (texture only) */
    for (var y = 40; y < H; y += 26) for (var x = (y / 26 % 2) * 13; x < W; x += 26) { var a = .025 + .05 * (y / H); g.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')'; g.beginPath(); g.arc(x, y, 2.2, 0, TAU); g.fill(); }
    for (var k = 0; k < 5000; k++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.07)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    return c;
  }
  /* police tape along the floor, always drifting (ours; no words on it) */
  function tape(g, t, y, rot, speed, alpha) {
    g.save(); g.globalAlpha *= alpha == null ? 1 : alpha; g.translate(CX, y); g.rotate(rot); g.translate(-CX, -y);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-200, y - 34 + 10, W + 400, 68);
    g.fillStyle = SUN; g.fillRect(-200, y - 34, W + 400, 68);
    g.save(); g.beginPath(); g.rect(-200, y - 34, W + 400, 68); g.clip();
    var off = (t * speed) % 120; g.fillStyle = INK;
    for (var x = -320 + off; x < W + 320; x += 120) { g.beginPath(); g.moveTo(x, y + 34); g.lineTo(x + 46, y - 34); g.lineTo(x + 92, y - 34); g.lineTo(x + 46, y + 34); g.closePath(); g.fill(); }
    g.restore();
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-200, y + 26, W + 400, 8);
    g.restore();
  }

  /* ---------- the TV set (our CRT): origin at its centre, 820 x 620 body; screenFn draws into the screen ---------- */
  var SCR = { x: -370, y: -262, w: 590, h: 470 };
  function tvSet(g, t, cx, cy, s, rot, screenFn) {
    g.save(); g.translate(cx, cy); g.rotate(rot || 0); g.scale(s, s);
    /* antennas */
    g.strokeStyle = '#2a2236'; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-40, -300); g.lineTo(-190, -470); g.moveTo(-10, -300); g.lineTo(130, -455); g.stroke();
    g.fillStyle = '#2a2236'; g.beginPath(); g.arc(-190, -470, 13, 0, TAU); g.arc(130, -455, 13, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(-25, -300, 70, 26, 0, Math.PI, TAU); g.fill();
    /* legs */
    g.fillStyle = WOODD; [[-300, 1], [260, -1]].forEach(function (l) { g.beginPath(); g.moveTo(l[0], 300); g.lineTo(l[0] + 40, 300); g.lineTo(l[0] + 20 + 22 * l[1] * -1, 370); g.lineTo(l[0] - 2 * l[1], 370); g.closePath(); g.fill(); });
    /* cabinet */
    rr(g, -410 + 14, -310 + 20, 820, 620, 46); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, -410, -310, 820, 620, 46); g.fillStyle = WOOD; g.fill();
    g.save(); rr(g, -410, -310, 820, 620, 46); g.clip();
    g.strokeStyle = 'rgba(40,20,8,.35)'; g.lineWidth = 4; for (var i = 0; i < 9; i++) { var yy = -290 + i * 70; g.beginPath(); g.moveTo(-410, yy); g.bezierCurveTo(-200, yy + 18, 100, yy - 16, 410, yy + 6); g.stroke(); }
    g.fillStyle = 'rgba(255,220,180,.10)'; g.fillRect(-410, -310, 820, 24);
    g.restore();
    /* bezel */
    rr(g, SCR.x - 26, SCR.y - 26, SCR.w + 52, SCR.h + 52, 62); g.fillStyle = '#d9cbb0'; g.fill();
    rr(g, SCR.x - 10, SCR.y - 10, SCR.w + 20, SCR.h + 20, 54); g.fillStyle = '#1a1624'; g.fill();
    /* screen */
    g.save(); rr(g, SCR.x, SCR.y, SCR.w, SCR.h, 48); g.clip();
    if (screenFn) screenFn(g, SCR.x, SCR.y, SCR.w, SCR.h);
    /* CRT flicker every frame (seeded by the frame number) and a glitch line */
    var fr = mulberry(Math.floor(t * 30) * 7 + 3); g.fillStyle = 'rgba(255,255,255,' + (.02 + .07 * fr()).toFixed(3) + ')'; g.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(SCR.x, SCR.y + fr() * SCR.h, SCR.w, 3 + 5 * fr());
    /* scanlines, roll band, glass */
    var nr = NOREC; NOREC = true;
    g.fillStyle = 'rgba(0,0,0,.13)'; for (var sy = SCR.y; sy < SCR.y + SCR.h; sy += 6) g.fillRect(SCR.x, sy, SCR.w, 2);
    var band = SCR.y + ((t * ROLL) % 1) * (SCR.h + 160) - 80; var bg2 = g.createLinearGradient(0, band - 70, 0, band + 70); bg2.addColorStop(0, 'rgba(255,255,255,0)'); bg2.addColorStop(.5, 'rgba(255,255,255,.07)'); bg2.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = bg2; g.fillRect(SCR.x, band - 70, SCR.w, 140);
    var gl = g.createRadialGradient(SCR.x + SCR.w / 2, SCR.y + SCR.h / 2, SCR.h * .3, SCR.x + SCR.w / 2, SCR.y + SCR.h / 2, SCR.w * .75); gl.addColorStop(0, 'rgba(0,0,0,0)'); gl.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = gl; g.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
    g.beginPath(); g.moveTo(SCR.x, SCR.y); g.lineTo(SCR.x + SCR.w * .55, SCR.y); g.lineTo(SCR.x, SCR.y + SCR.h * .45); g.closePath(); g.fillStyle = 'rgba(255,255,255,.05)'; g.fill();
    NOREC = nr; g.restore();
    /* control panel: two knobs and a speaker grille */
    rr(g, 252, -262, 128, 520, 18); g.fillStyle = WOODD; g.fill();
    [[316, -190, TAU * t / DUR], [316, -60, -.6]].forEach(function (k) { g.beginPath(); g.arc(k[0], k[1], 44, 0, TAU); g.fillStyle = '#d9cbb0'; g.fill(); g.strokeStyle = '#1a1624'; g.lineWidth = 6; g.beginPath(); g.moveTo(k[0], k[1]); g.lineTo(k[0] + Math.cos(k[2] - 1.2) * 36, k[1] + Math.sin(k[2] - 1.2) * 36); g.stroke(); });
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 6; for (var gy = 20; gy < 230; gy += 24) { g.beginPath(); g.moveTo(272, gy); g.lineTo(360, gy); g.stroke(); }
    /* the on light: blinks red */
    g.beginPath(); g.arc(316, 245, 9, 0, TAU); g.fillStyle = Math.floor(t * BLINK) % 2 ? RED : '#6a1622'; g.fill();
    g.restore();
  }
  /* our fox-ear head silhouette (the screen icon) */
  function foxHead(g, x, y, s, col, inner, o) {
    o = o || {};
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = col;
    g.beginPath(); g.moveTo(-120, -50); g.lineTo(-150, -255); g.lineTo(-18, -112); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(120, -50); g.lineTo(150, -255); g.lineTo(18, -112); g.closePath(); g.fill();
    if (inner) { g.fillStyle = inner; g.beginPath(); g.moveTo(-104, -80); g.lineTo(-128, -205); g.lineTo(-46, -112); g.closePath(); g.fill(); g.beginPath(); g.moveTo(104, -80); g.lineTo(128, -205); g.lineTo(46, -112); g.closePath(); g.fill(); g.fillStyle = col; }
    /* head: wide cheeks, a long pointed snout */
    g.beginPath(); g.moveTo(-150, -10); g.quadraticCurveTo(-140, -125, 0, -128); g.quadraticCurveTo(140, -125, 150, -10); g.quadraticCurveTo(120, 60, 0, 168); g.quadraticCurveTo(-120, 60, -150, -10); g.closePath(); g.fill();
    /* white cheeks and chin (the fox mask) */
    g.fillStyle = CREAM; g.beginPath(); g.moveTo(-150, -8); g.quadraticCurveTo(-70, 10, 0, -14); g.quadraticCurveTo(70, 10, 150, -8); g.quadraticCurveTo(118, 62, 0, 168); g.quadraticCurveTo(-118, 62, -150, -8); g.closePath(); g.fill();
    /* darker mask round the eyes */
    g.fillStyle = FOXD; g.beginPath(); g.ellipse(-56, -40, 44, 30, -.35, 0, TAU); g.ellipse(56, -40, 44, 30, .35, 0, TAU); g.fill();
    if (o.eyes !== false) {
      var lk = o.look || 0;
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(-54, -42, 26, 22, -.3, 0, TAU); g.ellipse(54, -42, 26, 22, .3, 0, TAU); g.fill();
      g.fillStyle = INK; g.beginPath(); g.arc(-50, -42 - lk, 12, 0, TAU); g.arc(58, -42 - lk, 12, 0, TAU); g.fill();
    }
    g.fillStyle = INK; g.beginPath(); g.ellipse(0, 150, 24, 17, 0, 0, TAU); g.fill();
    g.restore();
  }
  /* the screen before the ad: a prohibition sign slams over a fox head (no words: frame 0 carries the title) */
  function screenIcon(g, t, x, y, w, h) {
    var gr = g.createRadialGradient(x + w / 2, y + h / 2, 20, x + w / 2, y + h / 2, w * .7); gr.addColorStop(0, '#2e6f6a'); gr.addColorStop(1, '#0f2a2c'); g.fillStyle = gr; g.fillRect(x, y, w, h);
    var bob = 6 * Math.sin(t * BOB);
    foxHead(g, x + w / 2, y + h / 2 + 20 + bob, 1.32, FOX, FOXD, { look: 4 * Math.sin(t * BOB * .5) });
    var k = t >= T.seamIn ? 0 : eo(seg(t, T.slash, T.slash + .16));
    if (k > 0) {
      g.save(); g.translate(x + w / 2, y + h / 2 + 10); var sc = lerp(1.7, 1, k) * kn(t, T.slash + .16, .05); g.scale(sc, sc); g.globalAlpha *= clamp(k * 2, 0, 1);
      g.strokeStyle = RED; g.lineWidth = 38; g.beginPath(); g.arc(0, 0, 215, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(-152, -152); g.lineTo(152, 152); g.stroke(); g.restore();
    }
  }
  /* the re-created PSA card (the quote is an excerpt of the ad's words, F1) */
  var Q1 = ['“FURRY', 'ACTIVITY', 'OF', 'ANY', 'KIND', 'IS', 'ILLEGAL…”'];
  function screenAd(g, t, x, y, w, h) {
    g.fillStyle = CREAM; g.fillRect(x, y, w, h);
    g.fillStyle = RED; g.fillRect(x, y, w, 92);
    T2(g, 'ANTI-FURRY ASSOCIATION', x + w / 2, y + 50, 50, { col: CREAM, max: w - 70 });
    para(g, Q1, x + 40, y + 118, w - 80, 72, 80, INK, function (i) { return i === 6 ? seg(t, T.adCard + .25, T.adCard + .5) : 0; });
    /* the ad's own instruction, stamped on "report" */
    var ks = eo(seg(t, T.rep0, T.rep0 + .16));
    if (ks > 0) { var nrs = NOREC; NOREC = nrs || ks < .999; g.save(); g.translate(x + w / 2 + 40, y + h - 78); g.rotate(-.1); var sc = lerp(1.8, 1, ks) * kn(t, T.rep0 + .16, .06); g.scale(sc, sc); g.globalAlpha *= clamp(ks * 3, 0, 1);
      var sw = tw('REPORT IT', 100) + 60; rr(g, -sw / 2, -62, sw, 124, 12); g.fillStyle = RED; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 6; rr(g, -sw / 2 + 10, -52, sw - 20, 104, 8); g.stroke();
      T2(g, 'REPORT IT', 0, 2, 100, { col: CREAM }); g.restore(); NOREC = nrs; }
  }
  function tvScreen(t) {
    return function (g, x, y, w, h) {
      if (t >= T.adCard && t < T.seamIn) {
        screenAd(g, t, x, y, w, h);
        var st = seg(t, T.adCard, T.adCard + .12); if (st < 1) { var r = mulberry(Math.floor(t * 60)); g.globalAlpha = 1 - st; for (var i = 0; i < 160; i++) { g.fillStyle = r() < .5 ? '#ffffff' : '#000000'; g.fillRect(x + r() * w, y + r() * h, 20 + r() * 80, 4 + r() * 8); } g.globalAlpha = 1; }
      } else screenIcon(g, t, x, y, w, h);
    };
  }
  /* where the TV sits: hook, pushed in for the ad, knocked off left for the dip, back for the seam */
  function tvPose(t) {
    var P0 = { x: CX, y: 1075, s: 1.12, r: 0 };
    if (t >= T.seamIn) { var k = eo(seg(t, T.seamIn, T.seamIn + .3)); return { x: CX, y: lerp(-700, P0.y, k), s: P0.s, r: lerp(.12, 0, k), on: true }; }
    if (t < T.adIn) return { x: CX, y: P0.y, s: lerp(1.12, 1.15, eio(seg(t, 0, T.adIn))), r: 0, on: true };
    var ka = eio(seg(t, T.adIn, T.adIn + .35)), kd = seg(t, T.adIn + .35, T.dipIn);
    var p = { x: CX - 10 * ka, y: lerp(P0.y, 1045, ka), s: lerp(1.15, 1.2, ka) + .03 * kd, r: lerp(0, -.015, ka), on: true };
    var ko = eio(seg(t, T.dipIn - .08, T.dipIn + .28)); p.x -= 1300 * ko; p.r -= .35 * ko; if (ko >= 1) p.on = false;
    return p;
  }
  function tvLayer(g, t) {
    var p = tvPose(t); if (!p.on) return;
    var nr = NOREC; NOREC = nr || (t > T.dipIn - .1 && t < T.seamIn) || (t >= T.seamIn && t < T.seamIn + .3);
    tvSet(g, t, p.x, p.y, p.s, p.r, tvScreen(t));
    /* GTA 6 chip on the cabinet's top-left corner */
    g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(p.s, p.s);
    chip(g, 'GTA 6', -250, -300, 64, '#e6337a', CREAM, { rot: -.08 });
    g.restore();
    NOREC = nr;
    /* the RE-CREATED tag under the set, from the ad card to the dip */
    var kt = eo(seg(t, T.adCard + .05, T.adCard + .25)), kto = seg(t, T.dipIn - .1, T.dipIn + .1);
    if (kt > 0 && kto < 1 && t < T.seamIn) { var n2 = NOREC; NOREC = n2 || kt < .999 || kto > 0; g.save(); g.globalAlpha *= kt * (1 - kto); chip(g, 'RE-CREATED · IN-GAME TV AD', CX, 1408, 40, INK, CREAM, { rot: .01, stroke: SUN }); g.restore(); NOREC = n2; }
  }
  /* hook title: FURRIES / ARE ILLEGAL (frame 0 and the seam) */
  function hookTitle(g, t, k) {
    if (k <= 0) return; var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.globalAlpha *= clamp(k * 1.5, 0, 1); g.translate(0, -340 * (1 - k));
    g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowOffsetX = 6; g.shadowOffsetY = 9; T2(g, 'FURRIES', CX, 418, 196, { col: CREAM, max: 820, st: 'condensed' }); g.restore();
    var w0 = tw('ARE ILLEGAL', 128) + 60;
    g.save(); g.translate(CX, 590); g.rotate(-.025); rr(g, -w0 / 2 + 7, -72 + 9, w0, 144, 10); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, -w0 / 2, -72, w0, 144, 10); g.fillStyle = RED; g.fill(); T2(g, 'ARE ILLEGAL', 0, 0, 128, { col: CREAM, max: 780 }); g.restore();
    g.restore(); NOREC = nr;
  }
  /* the words the ad lists, as speech bubbles around the set */
  var BUBS = [['UWU', 255, 470, -.06], ['RAWR XD', 560, 545, .03], ['HEWWO', 830, 455, .07]];
  function bubbles(g, t) {
    if (t < T.bub0 || t >= T.dipIn + .3) return;
    var ko = eio(seg(t, T.dipIn - .08, T.dipIn + .25));
    BUBS.forEach(function (b, i) {
      var k = eo(seg(t, T.bub0 + i * .15, T.bub0 + i * .15 + .22)); if (k <= 0) return;
      var nr = NOREC; NOREC = nr || k < .999 || ko > 0;
      var w = tw(b[0], 64) + 64, h = 100, x = Math.min(b[1], 930 - w / 2 - 4) - 1300 * ko;
      g.save(); g.translate(x, b[2]); g.rotate(b[3]); var s = lerp(.4, 1, k) * kn(t, T.bub0 + i * .15 + .22, .06); g.scale(s, s); g.globalAlpha *= clamp(k * 2, 0, 1);
      rr(g, -w / 2 + 6, -h / 2 + 8, w, h, 40); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
      g.fillStyle = CREAM; rr(g, -w / 2, -h / 2, w, h, 40); g.fill();
      g.beginPath(); g.moveTo(-14, h / 2 - 4); g.lineTo(18, h / 2 + 40); g.lineTo(26, h / 2 - 4); g.closePath(); g.fill();
      g.strokeStyle = RED; g.lineWidth = 7; g.beginPath(); g.moveTo(-w / 2 + 16, h / 2 - 12); g.lineTo(w / 2 - 16, -h / 2 + 12); g.stroke();
      T2(g, b[0], 0, 2, 64, { col: INK });
      g.restore(); NOREC = nr;
    });
  }

  /* ---------- DIP: the light bar, a bush, ears that pop up ---------- */
  function lightbar(g, t, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    var on = Math.floor(t * 7) % 2;
    rr(g, -420 + 10, -70 + 14, 840, 140, 60); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, -420, -70, 840, 140, 60); g.fillStyle = '#20202c'; g.fill();
    for (var i = 0; i < 4; i++) {
      var left = i < 2, lit = left ? on === 0 : on === 1, col = left ? RED : BLUE, cx = -315 + i * 210;
      if (lit) { var gl = g.createRadialGradient(cx, 0, 20, cx, 0, 260); gl.addColorStop(0, left ? 'rgba(255,43,69,.55)' : 'rgba(47,107,255,.55)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(cx - 260, -260, 520, 520); }
      rr(g, cx - 90, -48, 180, 96, 40); g.fillStyle = lit ? col : (left ? '#5a1420' : '#16295e'); g.fill();
      rr(g, cx - 70, -38, 80, 22, 11); g.fillStyle = lit ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.12)'; g.fill();
    }
    rr(g, -60, 60, 120, 30, 8); g.fillStyle = '#20202c'; g.fill();
    g.restore();
  }
  function dipLayer(g, t) {
    if (t < T.dipIn - .1 || t >= T.foxIn + .35) return;
    var kin = eo(seg(t, T.dipIn - .05, T.dipIn + .3)), ko = eio(seg(t, T.foxIn - .1, T.foxIn + .3));
    var nr = NOREC; NOREC = true;
    /* red / blue wash over the plate */
    var on = Math.floor(t * 7) % 2; g.save(); g.globalAlpha = .13 * kin * (1 - ko); g.fillStyle = on ? BLUE : RED; g.fillRect(0, 0, W, H); g.restore();
    lightbar(g, t, CX, lerp(-200, 790, kin) - 900 * ko, .98);
    /* the bush and the ears */
    var by = 1240 + 500 * (1 - kin) + 600 * ko;
    var ke = eo(seg(t, T.oneW - .05, T.oneW + .2)), peek = .25 + .1 * Math.sin(t * 6);
    var ey = by + 150 - lerp(peek * 160, 330, ke);
    foxHead(g, 560, ey, .9, FOX, FOXD);
    var r = mulberry(5);
    for (var i = 0; i < 9; i++) { var bx = 60 + i * 120 + r() * 40, br = 120 + r() * 50; g.beginPath(); g.arc(bx, by + 120 - r() * 30, br, 0, TAU); g.fillStyle = i % 2 ? '#14532f' : '#1a6a3c'; g.fill(); }
    g.fillStyle = '#0f3d23'; g.fillRect(-20, by + 150, W + 40, 400);
    if (ke > 0) { g.save(); g.translate(790, ey - 120); g.rotate(.12); var s = lerp(1.6, 1, ke); g.scale(s, s); g.globalAlpha *= clamp(ke * 3, 0, 1); g.beginPath(); g.arc(0, 0, 80, 0, TAU); g.fillStyle = SUN; g.fill(); NOREC = false; T2(g, '?', 0, 6, 140, { col: INK }); NOREC = true; g.restore(); }
    NOREC = nr;
  }

  /* ---------- FOX: helicopter, searchlight, our fox-suit mascot ---------- */
  function heli(g, t, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    var D = '#16142a';
    g.fillStyle = D;
    g.beginPath(); g.ellipse(0, 0, 150, 72, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(110, -28); g.lineTo(360, -14); g.lineTo(360, 6); g.lineTo(110, 26); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(330, -14); g.lineTo(380, -80); g.lineTo(395, -80); g.lineTo(372, 8); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(-60, -12, 70, 44, -.1, Math.PI * .9, Math.PI * 2.05); g.fillStyle = '#3d5277'; g.fill();
    g.strokeStyle = D; g.lineWidth = 9; g.beginPath(); g.moveTo(-110, 100); g.lineTo(110, 100); g.moveTo(-60, 68); g.lineTo(-70, 100); g.moveTo(60, 68); g.lineTo(70, 100); g.stroke();
    g.fillStyle = D; rr(g, -14, -100, 28, 34, 6); g.fill();
    /* rotor: a blurred disc and one blade turning */
    g.fillStyle = 'rgba(200,200,230,.16)'; g.beginPath(); g.ellipse(0, -100, 360, 16, 0, 0, TAU); g.fill();
    var bl = Math.cos(t * 31) * 360; g.strokeStyle = 'rgba(30,28,50,.9)'; g.lineWidth = 10; g.beginPath(); g.moveTo(-bl, -100); g.lineTo(bl, -100); g.stroke();
    var tr = Math.cos(t * 41) * 40; g.beginPath(); g.moveTo(382, -40 - tr); g.lineTo(382, -40 + tr); g.lineWidth = 6; g.stroke();
    /* nav lights */
    g.beginPath(); g.arc(360, -2, 8, 0, TAU); g.fillStyle = Math.floor(t * 4) % 2 ? RED : '#4a1018'; g.fill();
    g.beginPath(); g.arc(20, 70, 8, 0, TAU); g.fillStyle = Math.floor(t * 4 + 1) % 2 ? BLUE : '#14224a'; g.fill();
    /* searchlight housing */
    g.beginPath(); g.arc(-120, 58, 18, 0, TAU); g.fillStyle = CREAM; g.fill();
    g.restore();
  }
  /* our fox-suit mascot: feet at (x, y), about 600 px tall at s = 1; up 0..1 raises the paws */
  function mascot(g, t, x, y, s, up) {
    g.save(); g.translate(x, y); g.scale(s, s);
    /* tail */
    g.fillStyle = FOX; g.beginPath(); g.moveTo(80, -160); g.quadraticCurveTo(260, -170 + 10 * Math.sin(t * 4), 250, -330); g.quadraticCurveTo(190, -250, 70, -230); g.closePath(); g.fill();
    g.fillStyle = CREAM; g.beginPath(); g.moveTo(250, -330); g.quadraticCurveTo(290, -270, 232, -228); g.quadraticCurveTo(196, -268, 250, -330); g.fill();
    /* legs + feet */
    g.fillStyle = FOXD; rr(g, -95, -120, 76, 120, 30); g.fill(); rr(g, 19, -120, 76, 120, 30); g.fill();
    g.fillStyle = CREAM; g.beginPath(); g.ellipse(-60, -6, 62, 26, 0, 0, TAU); g.ellipse(60, -6, 62, 26, 0, 0, TAU); g.fill();
    /* arms */
    var aL = [lerp(-160, -175, up), lerp(-170, -520, up)], aR = [lerp(160, 175, up), lerp(-170, -520, up)];
    g.strokeStyle = FOX; g.lineCap = 'round'; g.lineWidth = 64;
    g.beginPath(); g.moveTo(-95, -330); g.quadraticCurveTo(lerp(-170, -160, up), lerp(-260, -400, up), aL[0], aL[1]); g.stroke();
    g.beginPath(); g.moveTo(95, -330); g.quadraticCurveTo(lerp(170, 160, up), lerp(-260, -400, up), aR[0], aR[1]); g.stroke();
    g.fillStyle = CREAM; g.beginPath(); g.arc(aL[0], aL[1], 40, 0, TAU); g.arc(aR[0], aR[1], 40, 0, TAU); g.fill();
    /* body */
    rr(g, -125, -380, 250, 290, 100); g.fillStyle = FOX; g.fill();
    g.fillStyle = CREAM; g.beginPath(); g.ellipse(0, -215, 80, 115, 0, 0, TAU); g.fill();
    /* head */
    var hb = 4 * Math.sin(t * 3.4);
    foxHead(g, 0, -545 + hb, 1.05, FOX, FOXD, { look: 10 * up });
    g.restore();
  }
  function foxLayer(g, t) {
    if (t < T.foxIn - .1 || t >= T.cardIn + .35) return;
    var kin = eo(seg(t, T.foxIn - .05, T.foxIn + .32)), ko = eio(seg(t, T.cardIn - .1, T.cardIn + .3));
    var nr = NOREC; NOREC = true;
    /* searchlight target sweeps onto the mascot on "fox" */
    var tx = lerp(900, 430, eio(seg(t, T.foxIn + .2, T.foxW + .05))) + 14 * Math.sin(t * 2.2) * seg(t, T.foxW, T.foxW + .4);
    var hx = 800 + 18 * Math.sin(t * 1.3) + 700 * (1 - kin) + 700 * ko, hy = 770 + 12 * Math.sin(t * 2.1) - 400 * (1 - kin);
    var lx = hx - 120, ly = hy + 58, gy = 1405;
    var lit = clamp(1 - Math.abs(tx - 430) / 260, 0, 1);
    /* the mascot */
    var my = 1420 + 200 * ko, up = eo(seg(t, T.heliW - .1, T.heliW + .25));
    g.save(); g.globalAlpha *= kin * (1 - ko); g.filter = 'brightness(' + lerp(.32, 1, lit).toFixed(3) + ')'; mascot(g, t, 430, my, .95, up); g.filter = 'none'; g.restore();
    /* the cone and the pool of light */
    if (kin > 0) {
      g.save(); g.globalAlpha *= kin * (1 - ko); g.globalCompositeOperation = 'screen';
      var cg = g.createLinearGradient(lx, ly, tx, gy); cg.addColorStop(0, 'rgba(255,246,210,.55)'); cg.addColorStop(1, 'rgba(255,246,210,.18)');
      g.fillStyle = cg; g.beginPath(); g.moveTo(lx - 10, ly); g.lineTo(lx + 10, ly); g.lineTo(tx + 250, gy); g.lineTo(tx - 250, gy); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,246,210,.28)'; g.beginPath(); g.ellipse(tx, gy, 250, 52, 0, 0, TAU); g.fill();
      g.restore();
    }
    heli(g, t, hx, hy, 1);
    NOREC = nr;
    /* reviewers chip */
    var kr = eo(seg(t, T.revW, T.revW + .25)), kro = seg(t, T.cardIn - .1, T.cardIn + .15);
    if (kr > 0 && kro < 1) { var n2 = NOREC; NOREC = n2 || kr < .999 || kro > 0; g.save(); g.globalAlpha *= 1 - kro; chip(g, 'CNET · GQ REVIEWS', 330, 662, 50, CREAM, INK, { rot: -.04, sc: lerp(1.3, 1, kr) }); g.restore(); NOREC = n2; }
  }

  /* ---------- the gameplay card (creator clips): footage in a cream card, annotations in card px ---------- */
  var CARD = { x: CX, y: 1012, w: 800, h: 770 };
  function cardFrame(g, w, h) {
    rr(g, -w / 2 + 12, -h / 2 + 18, w, h, 22); g.fillStyle = 'rgba(0,0,0,.55)'; g.fill();
    rr(g, -w / 2 - 14, -h / 2 - 14, w + 28, h + 28, 30); g.fillStyle = CREAM; g.fill();
  }
  var CUR = { w: CARD.w, h: CARD.h };
  function cardClip(g, t, u, pose, over) {
    CUR = { w: pose.w || CARD.w, h: pose.h || CARD.h };
    g.save(); g.translate(pose.x, pose.y); g.rotate(pose.r || 0); g.scale(pose.s, pose.s);
    cardFrame(g, CUR.w, CUR.h);
    g.save(); rr(g, -CUR.w / 2, -CUR.h / 2, CUR.w, CUR.h, 18); g.clip();
    CLIP.draw(g, t, -CUR.w / 2, -CUR.h / 2, CUR.w, CUR.h, u);
    if (over) over(g);
    g.restore(); g.restore();
  }
  function cpt(u, t, nx, ny) { return CLIP.toScreen(u, t, nx, ny, -CUR.w / 2, -CUR.h / 2, CUR.w, CUR.h); }
  function ring(g, x, y, rx, ry, k, col) {
    if (k <= 0) return; g.save(); g.strokeStyle = col || SUN; g.lineWidth = 11; g.lineCap = 'round';
    var s = 1 + .2 * (1 - eo(k)); g.beginPath(); g.ellipse(x, y, rx * s, ry * s, -.05, -Math.PI / 2, -Math.PI / 2 + TAU * eo(k)); g.stroke(); g.restore();
  }
  function barricade(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.strokeStyle = '#2a2236'; g.lineWidth = 16; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-120, -10); g.lineTo(-160, 130); g.moveTo(-120, -10); g.lineTo(-80, 130); g.moveTo(120, -10); g.lineTo(80, 130); g.moveTo(120, -10); g.lineTo(160, 130); g.stroke();
    rr(g, -190 + 6, -60 + 10, 380, 84, 10); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    g.save(); rr(g, -190, -60, 380, 84, 10); g.clip(); g.fillStyle = CREAM; g.fillRect(-190, -60, 380, 84);
    g.fillStyle = FOX; for (var i = -6; i < 8; i++) { g.beginPath(); g.moveTo(i * 56, 24); g.lineTo(i * 56 + 28, 24); g.lineTo(i * 56 + 70, -60); g.lineTo(i * 56 + 42, -60); g.closePath(); g.fill(); }
    g.restore();
    g.beginPath(); g.arc(-150, -78, 14, 0, TAU); g.arc(150, -78, 14, 0, TAU); g.fillStyle = Math.floor(t0g * 3) % 2 ? SUN : '#6a5510'; g.fill();
    g.restore();
  }
  var t0g = 0;
  /* second-half poses: the van card sits left and tilted, the hideout card goes full-bleed (the door morphs one into the other) */
  var VANP = { x: 488, y: 1085, s: 1, r: -.035, w: CARD.w, h: CARD.h };
  var ARSP = { x: CX, y: 1010, s: 1, r: .012, w: 1010, h: 1040 };
  /* free: the card drops in behind the blockade, the blockade breaks on "Break" */
  function freeLayer(g, t) {
    if (!U.van || t < U.van.t0 - .02 || t >= U.van.t1) return;
    var u = U.van, kin = eo(seg(t, u.t0, u.t0 + .3)), ko = 0;
    var pose = { x: VANP.x, y: lerp(-700, VANP.y, kin), s: 1, r: lerp(.08, VANP.r, kin), w: VANP.w, h: VANP.h };
    var nr = NOREC; NOREC = nr || kin < .999 || ko > 0;
    cardClip(g, t, u, pose, function (gg) {
      var c = cpt(u, t, .79, .38), e = cpt(u, t, .97, .38), f = cpt(u, t, .79, .06);
      ring(gg, c[0], c[1], Math.abs(e[0] - c[0]) * 1.1, Math.abs(c[1] - f[1]) * 1.05, seg(t, T.furW - .05, T.furW + .3));
      var ka = eo(seg(t, T.escW - .05, T.escW + .3));
      if (ka > 0) { gg.save(); gg.strokeStyle = SUN; gg.fillStyle = SUN; gg.lineWidth = 16; gg.lineCap = 'round'; var x0 = c[0] - 40, y0 = c[1] + 200, x1 = lerp(x0, 380, ka); gg.beginPath(); gg.moveTo(x0, y0); gg.lineTo(x1, y0 - 30 * ka); gg.stroke(); gg.beginPath(); gg.moveTo(x1 + 34, y0 - 34 * ka); gg.lineTo(x1 - 8, y0 - 66 * ka); gg.lineTo(x1 - 4, y0 + 4 - 20 * ka); gg.closePath(); gg.fill(); gg.restore(); }
    });
    NOREC = nr;
  }
  /* the blockade: three barricades go up round the mascot, a strip of tape crosses the card, all snap apart on "Break" */
  function blockade(g, t) {
    if (t < T.barIn - .05 || t >= T.brk + .6) return;
    t0g = t;
    var kb = seg(t, T.brk, T.brk + .55), kbe = eo(seg(t, T.barIn, T.barIn + .3));
    var nr = NOREC; NOREC = true;
    [[-1, 250], [0, 540], [1, 830]].forEach(function (b, i) {
      var ki = eo(seg(t, T.barIn + i * .08, T.barIn + i * .08 + .28));
      var dir = b[0] === 0 ? .3 : b[0], fx = b[1] + dir * 900 * ein(kb) + dir * 160 * eo(kb), fy = 1310 + lerp(600, 0, ki) - 260 * Math.sin(Math.PI * kb) + 400 * ein(kb), fr = dir * 1.4 * eo(kb) + (i - 1) * .04;
      barricade(g, fx, fy, .82, fr);
    });
    var kt = eo(seg(t, T.cardIn + .15, T.cardIn + .3));
    if (kt > 0) { var sn = eo(kb); g.save(); g.globalAlpha *= kt * (1 - seg(kb, .6, 1));
      g.save(); g.translate(CX - 420 * sn, 900 + 300 * sn * sn); g.rotate(-.6 * sn); g.translate(-CX, -900); g.beginPath(); g.rect(-300, 0, CX + 300, H); g.clip(); tape(g, t, 900, -.08, 60, 1); g.restore();
      g.save(); g.translate(CX + 420 * sn, 900 + 300 * sn * sn); g.rotate(.6 * sn); g.translate(-CX, -900); g.beginPath(); g.rect(CX, 0, W, H); g.clip(); tape(g, t, 900, -.08, 60, 1); g.restore();
      g.restore(); }
    NOREC = nr;
  }
  /* our roll-up garage door: shuts on the van card, rolls up onto the hideout card */
  function doorLayer(g, t) {
    if (!U.ars || t < T.doorDown || t >= T.doorUp + .32) return;
    var c = t < T.doorUp ? eio(seg(t, T.doorDown, T.doorDown + .25)) : 1 - eio(seg(t, T.doorUp, T.doorUp + .3));
    var nr = NOREC; NOREC = true;
    /* the closed door grows from the van card's place to the full-bleed hideout card while the footage is off */
    var km = eio(seg(t, U.van.t1, U.ars.t0)), P = {}; ['x', 'y', 'r', 'w', 'h'].forEach(function (k) { P[k] = lerp(VANP[k], ARSP[k], km); });
    var cw = P.w, ch = P.h;
    g.save(); g.translate(P.x, P.y); g.rotate(P.r);
    if (t >= U.van.t1 && t < U.ars.t0) { cardFrame(g, cw, ch); rr(g, -cw / 2, -ch / 2, cw, ch, 18); g.fillStyle = '#0c0a14'; g.fill(); }
    g.save(); rr(g, -cw / 2, -ch / 2, cw, ch, 18); g.clip();
    var dh = ch * c, y0 = -ch / 2;
    g.fillStyle = '#8d93a3'; g.fillRect(-cw / 2, y0, cw, dh);
    for (var y = y0 + dh - 70; y > y0 - 70; y -= 70) { g.fillStyle = '#6f7586'; g.fillRect(-cw / 2, y, cw, 10); g.fillStyle = '#a9aebb'; g.fillRect(-cw / 2, y + 10, cw, 6); }
    g.fillStyle = '#3b3f4b'; g.fillRect(-cw / 2, y0 + dh - 26, cw, 26);
    rr(g, -70, y0 + dh - 70, 140, 26, 10); g.fillStyle = '#2a2236'; g.fill();
    pawPrint(g, cw / 2 - 150, y0 + dh - 200, 1.4, 'rgba(255,122,31,.8)');
    g.restore(); g.restore(); NOREC = nr;
  }
  /* wall: the arsenal card whips in, pushes to the gun wall on "wall" */
  function wallLayer(g, t) {
    if (!U.ars || t < U.ars.t0 - .02 || t >= U.ars.t1) return;
    var u = U.ars, kin = 1, ko = eio(seg(t, u.t1 - .28, u.t1));
    var kz = eio(seg(t, T.wallW - .1, T.wallW + .35));
    var z = lerp(1.0, 1.85, kz); u.zoom = [z, z]; u.focus = [lerp(.6, .86, kz), lerp(.4, .13, kz)];
    var pose = { x: ARSP.x - 1300 * ko, y: ARSP.y + 200 * ko, s: 1, r: ARSP.r - .25 * ko, w: ARSP.w, h: ARSP.h };
    var nr = NOREC; NOREC = nr || kin < .999 || ko > 0;
    cardClip(g, t, u, pose, function (gg) {
      var kb = seg(t, T.wallW + .3, T.wallW + .55);
      if (kb > 0) { var a = cpt(u, t, .71, .04), b = cpt(u, t, .99, .23); bracket(gg, a[0], a[1], b[0], b[1], kb); }
    });
    var kh = eo(seg(t, T.hideW - .12, T.hideW + .1));
    if (kh > 0) { NOREC = nr || kin < .999 || ko > 0 || kh < .999; g.save(); g.globalAlpha *= 1 - ko; chip(g, 'HIDEOUT', 285 - 1300 * ko, 1385 + 200 * ko, 76, SUN, INK, { rot: -.06, sc: lerp(1.5, 1, kh) * kn(t, T.hideW + .1, .06) }); g.restore(); }
    NOREC = nr;
  }
  function bracket(g, x0, y0, x1, y1, k) {
    var L = 60 * eo(k), p = 14; g.save(); g.strokeStyle = SUN; g.lineWidth = 12; g.lineCap = 'square'; g.globalAlpha *= clamp(k * 3, 0, 1);
    x0 = Math.max(x0 - p, -CUR.w / 2 + 16); y0 = Math.max(y0 - p, -CUR.h / 2 + 16); x1 = Math.min(x1 + p, CUR.w / 2 - 16); y1 = Math.min(y1 + p, CUR.h / 2 - 16);
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(function (c) { g.beginPath(); g.moveTo(c[0] + c[2] * L, c[1]); g.lineTo(c[0], c[1]); g.lineTo(c[0], c[1] + c[3] * L); g.stroke(); });
    g.restore();
  }

  /* ---------- PAY: the reward envelope opens onto the choice clip ---------- */
  function envelope(g, t, x, y, s, open) {
    g.save(); g.translate(x, y); g.scale(s, s);
    var w = 640, h = 420;
    rr(g, -w / 2 + 10, -h / 2 + 16, w, h, 16); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 16); g.fillStyle = '#efe2c6'; g.fill();
    /* flap: folds up as it opens */
    var fy = lerp(30, -h / 2 - 200, eio(open));
    g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(0, fy); g.lineTo(w / 2, -h / 2); g.closePath(); g.fillStyle = open > .5 ? '#d8c7a4' : '#f6ecd8'; g.fill();
    g.strokeStyle = 'rgba(90,60,20,.35)'; g.lineWidth = 4; g.stroke();
    if (open < .5) { g.beginPath(); g.arc(0, fy - 6, 58, 0, TAU); g.fillStyle = RED; g.fill(); pawPrint(g, 0, fy - 6, .9, '#7a0f1e'); }
    g.restore();
  }
  function envFront(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    var w = 640, h = 420; g.beginPath(); g.moveTo(-w / 2, -h / 2 + 60); g.lineTo(0, 40); g.lineTo(w / 2, -h / 2 + 60); g.lineTo(w / 2, h / 2 - 16); g.quadraticCurveTo(w / 2, h / 2, w / 2 - 16, h / 2); g.lineTo(-w / 2 + 16, h / 2); g.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - 16); g.closePath();
    g.fillStyle = '#f6ecd8'; g.fill(); g.strokeStyle = 'rgba(90,60,20,.3)'; g.lineWidth = 4; g.stroke();
    pawPrint(g, 200, 120, .8, 'rgba(255,122,31,.85)');
    g.restore();
  }
  function pawPrint(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = col;
    g.beginPath(); g.ellipse(0, 12, 26, 20, 0, 0, TAU); g.fill();
    [[-26, -16], [-9, -28], [9, -28], [26, -16]].forEach(function (p) { g.beginPath(); g.ellipse(p[0], p[1], 9, 12, 0, 0, TAU); g.fill(); });
    g.restore();
  }
  /* the game's prompt, enlarged (our re-drawing of what the card shows) */
  function promptPanel(g, t, x, y, s, hlGun, hlCash, o) {
    o = o || {};
    g.save(); g.translate(x, y); g.scale(s, s);
    var w = 700, h = 236;
    rr(g, -w / 2 + 8, -h / 2 + 12, w, h, 24); g.fillStyle = 'rgba(0,0,0,.5)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 24); g.fillStyle = 'rgba(14,10,26,.94)'; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 5; g.stroke();
    [[-56, 'GUN', hlGun, 'sq'], [56, 'CASH ($15,000)', hlCash, 'x']].forEach(function (r) {
      if (r[2] > 0) { rr(g, -w / 2 + 18, r[0] - 46, (w - 36) * eo(r[2]), 92, 16); g.fillStyle = SUN; g.fill(); }
      var bx = -w / 2 + 70; g.beginPath(); g.arc(bx, r[0], 32, 0, TAU); g.fillStyle = CREAM; g.fill();
      g.strokeStyle = INK; g.lineWidth = 6;
      if (r[3] === 'sq') { g.strokeRect(bx - 13, r[0] - 13, 26, 26); } else { g.beginPath(); g.moveTo(bx - 13, r[0] - 13); g.lineTo(bx + 13, r[0] + 13); g.moveTo(bx + 13, r[0] - 13); g.lineTo(bx - 13, r[0] + 13); g.stroke(); }
      T2(g, r[1], -w / 2 + 128, r[0], 70, { col: r[2] > .5 ? INK : CREAM, align: 'left', max: w - 160 });
    });
    g.restore();
  }
  function payLayer(g, t) {
    if (t < T.payIn - .05 || t >= T.endIn + .4) return;
    var nr = NOREC;
    /* envelope: flies in, opens on "reward", falls away as the card rises out */
    var ke = eo(seg(t, T.payIn, T.payIn + .3)), open = seg(t, T.thankW - .05, T.thankW + .2), kd = eio(seg(t, T.chIn + .15, T.chIn + .55));
    var ex = lerp(700, 560, ke), ey = lerp(1900, 1080, ke) + 900 * kd, es = 1 + .03 * Math.sin((t - T.payIn) * 3) * (1 - open);
    if (kd < 1) { NOREC = true; envelope(g, t, ex, ey, es, open); NOREC = nr; }
    /* the choice card */
    var u = U.ch;
    if (u && t >= u.t0 - .02 && t < u.t1) {
      var kc = eio(seg(t, u.t0, u.t0 + .45)), ko = eio(seg(t, u.t1 - .3, u.t1));
      var z = lerp(1.0, 1.5, eio(seg(t, T.gunW - .35, T.gunW + .15))); u.zoom = [z, z]; u.focus = [.7, .1];
      var pose = { x: lerp(ex, 585, kc), y: lerp(ey - 60, 930, kc) + 1300 * ko, s: lerp(.5, .94, kc), r: lerp(-.03, .028, kc) + .25 * ko };
      NOREC = nr || kc < .999 || ko > 0;
      cardClip(g, t, u, pose, function (gg) {
        var c = cpt(u, t, .685, .222), e = cpt(u, t, .815, .222), f = cpt(u, t, .685, .158);
        ring(gg, c[0], c[1], Math.abs(e[0] - c[0]) * 1.2, Math.abs(c[1] - f[1]) * 1.25, seg(t, T.gunW - .1, T.gunW + .22), SUN);
      });
      NOREC = nr;
    }
    if (kd < 1 && open > .3) { NOREC = true; envFront(g, ex, ey, es); NOREC = nr; }
  }
  /* the prompt panel + $15,000 slam carry from pay into the vote */
  function promptLayer(g, t) {
    if (t < T.panelIn - .05 || t >= T.seamIn + .25) return;
    var kp = eo(seg(t, T.panelIn, T.panelIn + .3)), kv = eio(seg(t, T.endIn, T.endIn + .4)), kout = eio(seg(t, T.seamIn - .05, T.seamIn + .2));
    var hlG = t < T.endIn ? seg(t, T.gunW, T.gunW + .2) * (1 - seg(t, T.cashW - .05, T.cashW)) : 0;
    var hlC = t < T.endIn ? seg(t, T.cashW, T.cashW + .2) : 0;
    var nr = NOREC; NOREC = nr || kp < .999 || (kv > 0 && kv < 1) || kout > 0;
    g.save(); g.globalAlpha *= 1 - kout; g.translate(0, 900 * kout);
    if (kv < 1) { g.save(); g.globalAlpha *= 1 - kv; promptPanel(g, t, lerp(560, 505, kp), lerp(1400, 1335, kp) + 200 * kv, lerp(.6, 1, kp) * kn(t, T.panelIn + .3, .04), hlG, hlC); g.restore(); }
    /* $15,000 slams on the word, then becomes the vote's right card */
    var kc = eo(seg(t, T.cashW, T.cashW + .18));
    if (kc > 0) {
      var x = lerp(330, 735, kv), y = lerp(1105, 1215, kv), px = lerp(120, 80, kv);   // low left, off the ringed prompt
      g.save(); g.translate(x, y); g.rotate(lerp(-.09, .03, kv) + (kv >= 1 ? .03 * Math.sin((t - T.endIn) * 7.5 + Math.PI) : 0)); var s = (1 + .05 * seg(t, T.endIn + .4, T.seamIn)) * lerp(1.6, 1, kc) * kn(t, T.cashW + .18, .07); g.scale(s, s);
      var w0 = tw('$15,000', px) + 60, h0 = px * 1.25; rr(g, -w0 / 2 + 8, -h0 / 2 + 10, w0, h0, 12); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, -w0 / 2, -h0 / 2, w0, h0, 12); g.fillStyle = GREEN; g.fill();
      T2(g, '$15,000', 0, 0, px, { col: CREAM }); g.restore();
    }
    g.restore(); NOREC = nr;
  }
  /* ---------- END: the vote ---------- */
  function pistol(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#2a2236';
    rr(g, -130, -60, 250, 66, 14); g.fill(); rr(g, -150, -50, 40, 40, 8); g.fill();
    g.beginPath(); g.moveTo(40, 0); g.lineTo(110, 0); g.lineTo(130, 130); g.lineTo(60, 140); g.closePath(); g.fill();
    g.strokeStyle = '#2a2236'; g.lineWidth = 12; g.beginPath(); g.arc(20, 30, 32, 0, Math.PI); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.18)'; rr(g, -120, -52, 220, 12, 6); g.fill();
    g.restore();
  }
  function cashStack(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    for (var i = 4; i >= 0; i--) { rr(g, -130 + i * 6, -40 + i * 18 - 40, 260, 90, 10); g.fillStyle = i % 2 ? '#2f9a5c' : '#3fb06d'; g.fill(); g.strokeStyle = '#155a33'; g.lineWidth = 4; g.stroke(); }
    g.fillStyle = CREAM; rr(g, -30, -84, 60, 98, 6); g.fill();
    g.restore();
  }
  function voteLayer(g, t) {
    if (t < T.endIn - .05 || t >= T.seamIn + .25) return;
    var k = eo(seg(t, T.endIn + .05, T.endIn + .35)), ko = eio(seg(t, T.seamIn - .05, T.seamIn + .2));
    var nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    g.save(); g.globalAlpha *= 1 - ko; g.translate(0, 900 * ko);
    /* header */
    var kq = eo(seg(t, T.e1 - .1, T.e1 + .2));
    g.save(); g.translate(CX, 470 - 40 * (1 - kq)); g.rotate(-.02); g.globalAlpha *= kq;
    var w0 = Math.min(tw('GUN OR CASH?', 120) + 70, 770); rr(g, -w0 / 2 + 7, -72 + 9, w0, 144, 12); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); rr(g, -w0 / 2, -72, w0, 144, 12); g.fillStyle = CREAM; g.fill();
    T2(g, 'GUN OR CASH?', 0, 0, 120, { col: INK, max: w0 - 70 }); g.restore();
    /* two cards, neither highlighted */
    [[305, -.04, T.e1, 'gun'], [735, .04, T.e2, 'cash']].forEach(function (c, i) {
      var kc = eo(seg(t, T.endIn + .1 + i * .1, T.endIn + .4 + i * .1)); if (kc <= 0) return;
      /* slow push and a wobble out of phase, so the two cards never sit still while the question hangs */
      var kpu = 1 + .06 * eio(seg(t, T.endIn + .4, T.seamIn)), wob = .035 * Math.sin((t - T.endIn) * 7.5 + i * Math.PI) * seg(t, T.endIn + .3, T.endIn + .6);
      g.save(); g.translate(c[0], 1030 + 160 * (1 - kc)); g.rotate(c[1] + wob); var s = kc * kpu * kn(t, c[2], .06); g.scale(s, s);
      rr(g, -185 + 8, -270 + 12, 370, 540, 26); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
      rr(g, -185, -270, 370, 540, 26); g.fillStyle = CREAM; g.fill(); g.strokeStyle = INK; g.lineWidth = 6; g.stroke();
      if (c[3] === 'gun') { pistol(g, 0, -60, 1.0); T2(g, 'GUN', 0, 185, 104, { col: INK }); }
      else cashStack(g, 0, -60, 1.0);
      g.restore();
    });
    g.restore(); NOREC = nr;
  }

  /* =====================================================================================================
     CAPTIONS: tape in the upper third, phrase by phrase. Hook = title, ad = the TV, end = the vote.
     ===================================================================================================== */
  var BREAK = { dip: ['happens'], fox: ['furry,'], free: ['blockade,'], wall: ['hideout?'], pay: ['run,', 'reward:'] };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (['hook', 'ad', 'end'].indexOf(l.id) >= 0) return;
      var ws = l.words; outc.push({ id: l.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .06, words: ws });
    });
    return outc;
  })();
  var STRESS = [], CAPY = 455;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function captions(g, t) {
    t = tq(t);
    var c0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { c0 = c; ci = i; } });
    if (!c0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s : T.e1;
    var end = Math.min(c0.t1 + .45, ns - .02, T.e1 - .1);
    if (t >= end) return;
    var TAPE = INK, TXT = CREAM;
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
  var POSTERMODE = false, STAGEC = NIGHT;
  function stage(g) { g.fillStyle = STAGEC; g.fillRect(0, 0, W, H); }
  function plateLayer(g, t) {
    var u = CLIP.activePlate(t); if (!u) return;
    var k = u.fadeOut ? 1 - seg(t, u.t1 - .25, u.t1) : 1;
    g.save(); g.globalAlpha = k; CLIP.plate(g, t, 0, 0, W, H, { dim: u.dim || .5 }); g.restore();
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) { g.drawImage(BG, 0, 0); plateLayer(g, t); }
    tape(g, t, 1530, -.03, TAPEV, 1);
    dipLayer(g, t);
    foxLayer(g, t);
    freeLayer(g, t);
    blockade(g, t);
    doorLayer(g, t);
    wallLayer(g, t);
    payLayer(g, t);
    voteLayer(g, t);
    promptLayer(g, t);
    tvLayer(g, t);
    if (t < T.adIn + .25) hookTitle(g, t, 1 - eio(seg(t, T.adIn - .05, T.adIn + .25)));
    if (t >= T.seamIn) hookTitle(g, t, eo(seg(t, T.seamIn + .05, T.seamIn + .35)));
    bubbles(g, t);
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('title', 'FURRIES ARE ILLEGAL', 0, T.adIn + .05); Tx('title', 'FURRIES ARE ILLEGAL', T.seamIn + .2, DUR + 1);
    Tx('gta6', 'GTA 6', 0, T.dipIn); Tx('gta6', 'GTA 6', T.seamIn + .2, DUR + 1);
    Tx('afa', 'ANTI-FURRY ASSOCIATION', T.adCard + .1, T.dipIn);
    Tx('q1', Q1.join(' '), T.adCard + .1, T.dipIn);
    Tx('rep', 'REPORT IT', T.rep0 + .05, T.dipIn + .22);
    Tx('recr', 'RE-CREATED · IN-GAME TV AD', T.adCard + .2, T.dipIn - .05);
    BUBS.forEach(function (b, i) { Tx('bub' + i, b[0], T.bub0 + i * .15 + .1, T.dipIn + .05); });
    Tx('rev', 'CNET · GQ REVIEWS', T.revW + .1, T.cardIn);
    Tx('hide', 'HIDEOUT', T.hideW - .05, U.ars.t1 - .1);
    Tx('gun', 'GUN', T.panelIn + .1, T.endIn + .25); Tx('gun', 'GUN', T.endIn + .35, T.seamIn);
    Tx('cashp', 'CASH ($15,000)', T.panelIn + .1, T.endIn + .25);
    Tx('cash', '$15,000', T.cashW + .1, T.seamIn);
    Tx('vote', 'GUN OR CASH?', T.e1 + .05, T.seamIn);
    return o;
  }

  /* ---------- times, clips and sound events, all from the voice ---------- */
  function initTimes() {
    T.slash = start('hook') + .03;                 // the red slash slams over the fox head
    T.adCard = at('hook', 'being');                // payoff: the re-created TV ad is on the screen by ~1.4 s
    T.adIn = start('ad') - .12;
    T.bub0 = at('ad', 'says') - .3; T.reportW = at('ad', 'report'); T.rep0 = T.reportW - .25;
    T.dipIn = start('dip') - .1; T.copsW = at('dip', 'cops'); T.oneW = at('dip', 'one');
    T.foxIn = start('fox') - .2; T.revW = at('fox', 'reviewers'); T.foxW = at('fox', 'furry'); T.heliW = at('fox', 'helicopter');
    T.breakW = at('free', 'break'); T.furW = at('free', 'them'); T.escW = at('free', 'escape');
    T.hideW = at('wall', 'hideout'); T.wallW = at('wall', 'wall');
    T.payIn = start('pay') - .15; T.thankW = at('pay', 'reward'); T.gunW = at('pay', 'gun'); T.cashW = at('pay', '15000');
    T.e1 = at('end', 'gun'); T.e2 = at('end', 'cash');
    T.seamIn = DUR - .45;
    CLIP.reset();
    /* creator clips (rule 10): each under its 3 s cut, total about 8 s */
    T.cardIn = start('free') - .2;
    var vanT1 = T.cardIn + 2.75; T.doorDown = vanT1 - .3; var arsT0 = vanT1 + .36; T.doorUp = arsT0;   // our garage door shuts on the van and rolls up on the hideout (footage breaks for .36 s)
    U.van = CLIP.use('van', T.cardIn, vanT1, { from: .2, speed: .95, zoom: [1.06, 1.14], focus: [.66, .4], note: 'free: the furries at the white van, ringed on "them", escape arrow; card breaks out from behind our barricades' });
    T.brk = Math.max(T.breakW, T.cardIn + .3); T.barIn = lastw('fox') - .35;
    U.ars = CLIP.use('arsenal', arsT0, arsT0 + 2.4, { from: .3, speed: 1, zoom: [1, 1], focus: [.6, .4], note: 'wall: the hideout garage, pushed in on the gun wall on "wall", yellow corner brackets, HIDEOUT chip' });
    T.payIn = Math.min(T.payIn, U.ars.t1 - .1);
    T.chIn = T.thankW + .15; T.panelIn = T.chIn + .12;
    U.ch = CLIP.use('choice', T.chIn, T.chIn + 2.6, { from: .22, speed: .8, freeze: 1.75, zoom: [1, 1], focus: [.7, .2], note: 'pay (hero): the reward prompt GUN / CASH ($15,000), pushed in and ringed, enlarged in our prompt panel below; $15,000 slams on the word' });
    T.endIn = Math.min(start('end') - .15, U.ch.t1 - .2);
    /* official plates (rule 11): dimmed, under the hook / ad / dip / fox only */
    function plate(name, t0, t1, from, dim, fade) {
      var c = CLIP.manifest().clips[name], span = c.frames / c.fps - (from || 0) - .04;
      var u = CLIP.use(name, t0, t1, { plate: true, from: from || 0, speed: Math.min(1, span / (t1 - t0)), zoom: [1.12, 1.2], focus: [.5, .5], note: 'background plate' });
      u.dim = dim; u.fadeOut = !!fade; return u;
    }
    /* every plate plays at 0.75x or faster (jury r1): seven short official ranges chained under the first half */
    T.p1 = 2.06; T.p2 = 3.58; T.p3 = 5.4;
    plate('pseam', DUR - .4, DUR + .02, 0, .5);
    plate('pnight', 0, T.p1, 0, .5);
    plate('praid', T.p1, T.p2, 0, .4);
    plate('ppolice', T.p2, T.p3, 0, .45);
    plate('pcops', T.p3, T.foxIn, 0, .45);
    plate('pheli', T.foxIn, T.foxIn + 1.27, 0, .45);
    plate('ptruck', T.foxIn + 1.27, T.cardIn + .2, 0, .45, true);
    /* sound: hits sit in the voice's pauses */
    G('slash', T.slash, 'slap', .12, 1.1);
    G('card', T.adCard, 'stat', .2, 1);
    G('ad', T.adIn, 'swish', .2, .9);
    for (var i = 0; i < 3; i++) G('bub' + i, T.bub0 + i * .15, 'pop', .25, .7);
    G('rep', T.reportW, 'tock', .3, .8);
    G('dip', T.dipIn, 'whoop', .25, 1);
    G('one', T.oneW, 'pop', .3, 1);
    G('fox', T.foxIn, 'swish', .2, .9);
    G('light', T.foxW, 'tock', .3, 1);
    G('up', T.heliW, 'pop', .3, .8);
    G('cardin', T.cardIn, 'thud', .25, 1);
    G('brk', T.brk, 'crash', .3, 1.1);
    G('fur', T.furW, 'pop', .3, .8);
    G('esc', T.escW, 'swish', .35, .8);
    G('door', T.doorDown + .25, 'thud', .25, 1); G('doorup', T.doorUp, 'swish', .25, .9);
    G('hide', T.hideW, 'tock', .3, .9);
    G('zoom', T.wallW, 'slap', .3, 1);
    G('pay', T.payIn, 'swish', .2, .9);
    G('flap', T.thankW, 'flip', .3, 1);
    G('gun', T.gunW, 'pop', .3, .9);
    G('cash', T.cashW, 'slap', .35, 1.2);
    G('vote', T.endIn, 'flick', .25, 1);
    G('e1', T.e1, 'pop', .3, .8); G('e2', T.e2, 'pop', .3, .8);
    G('seam', T.seamIn, 'swish', .3, .8);
    /* jury r1: a sound on every move of our own, at about -10 dBFS; these sit where the move is, under the voice if need be */
    function F(id, t, type, gain) { EV.push({ t: t, type: type, g: gain == null ? 1 : gain, id: id }); }
    F('knock', T.dipIn - .06, 'knock', 1);           // the TV is knocked off left
    F('rotor', T.foxIn - .3, 'rotor', 1);            // the helicopter arrives
    F('doorroll', T.doorDown, 'roll', 1); F('doorroll2', T.doorUp, 'roll', 1);
    F('env', T.payIn, 'swish', 1.1);                 // the envelope flies in
    F('kaching', lastw('pay') + .05, 'kaching', 1);  // after the line: the till
    F('slamk', T.cashW, 'thud', .9);                 // $15,000 lands
    F('drop', T.seamIn + .25, 'thud', 1.1);          // the TV drops back in for the loop
    STRESS = [at('dip', 'cops'), at('dip', 'one'), at('fox', 'furry'), at('fox', 'helicopter'), at('free', 'break'), at('free', 'escape'), at('wall', 'hideout'), at('wall', 'guns'), at('pay', 'gun'), at('pay', '15000')];
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
    function flip(t, g) { nband(t, t + .12, 1800, 4200, .16 * g, .02 * g, 1.2); tick(t + .13, .9 * g, 1800); thump(t + .13, .12 * g, 300); }
    function thud(t, g) { thump(t, .55 * g, 120); nband(t, t + .06, 900, 300, .1 * g, .01 * g, .8); }
    /* the blockade breaking: a wooden crack and two clatters */
    function crash(t, g) { thump(t, .5 * g, 160); nband(t, t + .09, 3000, 900, .22 * g, .02 * g, .7); tick(t + .12, .9 * g, 1500); tick(t + .21, .7 * g, 1700); thump(t + .2, .15 * g, 260); }
    /* a short siren whoop (police, the dip) */
    function whoop(t, g) { var o = osc2('triangle', 620, t, t + .3, [[t, 0], [t + .03, .07 * g], [t + .24, .05 * g], [t + .3, 0]]); o.frequency.linearRampToValueAtTime(1180, t + .14); o.frequency.linearRampToValueAtTime(700, t + .29); }
    /* the TV switching to the ad: a burst of static */
    function stat(t, g) { var o = bus(1), hp2 = ac.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 2400; var n = noise(t, .14); n.connect(hp2); hp2.connect(o); env(o.gain, [[t, 0], [t + .005, .14 * g], [t + .11, .05 * g], [t + .14, 0]]); }
    /* the TV knocked off: a hard knock and a falling swish */
    function knock(t, g) { thump(t, .6 * g, 140); tick(t, 1.2 * g, 1600); nband(t + .03, t + .3, 2400, 600, .2 * g, .02 * g, .8); }
    /* helicopter: a short burst of rotor chops under a low swell */
    function rotor(t, g) { for (var i = 0; i < 9; i++) { var tt = t + i * .085, a = Math.sin(Math.PI * (i + .5) / 9); thump(tt, .32 * g * a, 95); nband(tt, tt + .05, 700, 400, .08 * g * a, .01, .9); } }
    /* garage door: a metal rattle over a slide */
    function roll(t, g) { nband(t, t + .3, 500, 1400, .14 * g, .05 * g, .6); for (var i = 0; i < 6; i++) tick(t + .03 + i * .045, .8 * g, 1200); thump(t + .28, .4 * g, 110); }
    /* the till: bell over a drawer thunk */
    function kaching(t, g) { thump(t, .35 * g, 180); tick(t, 1 * g, 2200); [[2093, 0], [2637, .07]].forEach(function (b) { var o = osc2('triangle', b[0], t + .07 + b[1], t + .9, [[t + .07 + b[1], 0], [t + .075 + b[1], .14 * g], [t + .8, 0]]); }); }
    var LEVEL = { thud: 3, tock: 2, slap: 3, swish: 3, pop: 2, flick: 3, flip: 3, crash: 3, whoop: 3, stat: 3, knock: 3, rotor: 3, roll: 3, kaching: 3 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = { thud: -1, tock: -3, slap: -7, swish: 11, pop: 8, flick: -6, flip: -3, crash: -7, whoop: -2, stat: -2, knock: -3, rotor: 6, roll: 8, kaching: 2 };   // balanced by measured peak (jury r1: hits at about -10 dBFS)
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      ({ thud: thud, slap: slap, tock: tock, swish: swish, pop: pop, flick: flick, flip: flip, crash: crash, whoop: whoop, stat: stat, knock: knock, rotor: rotor, roll: roll, kaching: kaching })[e.type](e.t, g);
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
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0?“”…$’·()'); }))).then(function () { return document.fonts.ready; }).then(function () {
      BG = buildBG(); EV.length = 0; initTimes();
      window.FILM.POSTER = Math.round((T.adCard + .6) * 30) / 30 + 1 / 60;
      window.FILM.SHOTS = [
        { id: 'hook', name: 'Furries are illegal', t0: 0, t1: start('ad') },
        { id: 'ad', name: 'The TV ad', t0: start('ad'), t1: start('dip') },
        { id: 'dip', name: 'When the cops find one', t0: start('dip'), t1: start('fox') },
        { id: 'fox', name: 'A furry under a helicopter', t0: start('fox'), t1: start('free') },
        { id: 'free', name: 'Break the blockade', t0: start('free'), t1: start('wall') },
        { id: 'wall', name: 'Wall of guns', t0: start('wall'), t1: start('pay') },
        { id: 'pay', name: 'Gun or $15,000', t0: start('pay'), t1: start('end') },
        { id: 'end', name: 'Which one?', t0: start('end'), t1: DUR }];
      window.READY = true;
    });
  }
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-furries', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
