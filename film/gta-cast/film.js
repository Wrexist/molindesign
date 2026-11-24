/* "GTA 6: Who do you trust?": Delta, catalog Short. Rockstar's eight People pages (rockstargames.com/VI/only-in-leonida/<name>),
   in Rockstar's menu order, one official clip and one Rockstar line per card; the viewer picks a number. Sources in BRIEF.md.
   Set: the lineup board. A split-flap board asks the question on frame 0; each character is a numbered card dealt onto a night
   board, its number tile flips over on the spoken name (the native move), the official clip plays once in the card's window and
   then hands over to our own flat drawing of that person's Rockstar line. A row of eight number slots along the bottom tracks
   the lineup. All eight return as a ballot; the flap board drops back on for the loop.
   Footage: Jason and Lucia from An Extended Look (ranges no other film uses), the other six from rockstargames.com/VI character
   clips, background plates from the Out Now spot (no logo, console or PRE-LOAD frames). All muted, each under 5 s.
   Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Engine from gta-heroes. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var INK = '#14112b', INK2 = '#1f1a44', CREAM = '#fbf3e4', CORAL = '#ff5a4e', CORALD = '#c7352c', PINK = '#e6337a', TEAL = '#1fb5a6', SUN = '#ffb347', NAVY = '#0d0b22';
  var DISP = 'Archivo', MONO = '"Geist Mono"';
  var BX0 = 90, BX1 = 930, BY1 = 1430, TAU = Math.PI * 2;

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function kn(t, a, amt) { if (t < a) return 1; var u = t - a; return 1 + (amt || .08) * (1 - Math.exp(-u * 40)) * Math.exp(-u * 7); }
  function bump(t, a, d) { return Math.sin(Math.PI * seg(t, a, a + d)); }
  function osc(t, k, ph) { return Math.sin(TAU * k * t / DUR + (ph || 0)); }

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
  var BODY = { flap: .14, swish: .22, slap: .1, tock: .06, pop: .1, whirr: .3 };
  function nearGap(t, type, m) {
    var bd = BODY[type] || .12, best = null;
    free(m || .12).forEach(function (f) { var lo = f[0], hi = f[1] - bd; if (hi < lo) return; var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c; });
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
    if (a < SAFE.x0 - .5 || b > SAFE.x1 + .5 || c > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
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
    o = o || {}; g.save(); font(g, Math.max(30, px), o.wt || 700, MONO); ls(g, o.ls == null ? 2 : o.ls);
    g.textAlign = o.align || 'left'; g.textBaseline = 'middle'; g.fillStyle = o.col || CREAM; g.fillText(s, x, y); var w = g.measureText(s).width; g.restore(); return w;
  }
  function tw(s, px, st, wt) { var m = mk(4, 4).getContext('2d'); cond(m, st || 'condensed'); font(m, px, wt || 900); ls(m, 1); var w = m.measureText(s).width; unst(m); return w; }
  function chip(g, s, x, y, px, bg, fg, o) {
    o = o || {}; var w = tw(s, px) + px * .8, h = px * 1.3;
    g.save(); if (o.rot) { g.translate(x, y); g.rotate(o.rot); g.translate(-x, -y); }
    rr(g, x - w / 2 + 5, y - h / 2 + 7, w, h, 10); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    rr(g, x - w / 2, y - h / 2, w, h, 10); g.fillStyle = bg; g.fill();
    T2(g, s, x, y, px, { col: fg }); g.restore(); return w;
  }

  /* =====================================================================================================
     THE CAST (Rockstar's People menu order). quote = Rockstar's own words, cut only with "…"; panel = our drawing of it.
     ===================================================================================================== */
  var CAST = [
    { id: 'jason', name: 'JASON DUVAL', quote: '…JUST KEEP GETTING HARDER.', col: '#2a6f97', clip: 'jason' },
    { id: 'lucia', name: 'LUCIA CAMINOS', quote: '…TAUGHT HER TO FIGHT…', col: '#8a2f5c', clip: 'lucia' },
    { id: 'cal', name: 'CAL HAMPTON', quote: '…COAST GUARD COMMS…', col: '#1e5d57', clip: 'cal' },
    { id: 'boobie', name: 'BOOBIE IKE', quote: '…TALK BUSINESS.', col: '#5b2a86', clip: 'boobie' },
    { id: 'drequan', name: 'DRE\'QUAN PRIEST', quote: 'MORE OF A HUSTLER…', col: '#9a4a14', clip: 'drequan' },
    { id: 'dimez', name: 'REAL DIMEZ', sub: 'BAE-LUXE & ROXY', quote: '…VIRAL HOOKS.', col: '#a3245e', clip: 'dimez' },
    { id: 'raul', name: 'RAUL BAUTISTA', quote: '…HUNT FOR TALENT.', col: '#27406e', clip: 'raul' },
    { id: 'brian', name: 'BRIAN HEDER', quote: '…LET OTHERS DO HIS DIRTY WORK.', col: '#245f7a', clip: 'brian' }
  ];
  /* card geometry */
  var CL = 116, CR = 904, CT = 478, WX = 140, WY = 500, WW = 740, WH = 630, NY = 1196, CB = 1300;
  var TX = 92, TY = 452, TW = 168, TH = 186;   // the number tile (top-left, over the card corner)
  var SLY = 1372, SLW = 86, SLG = 10, SL0 = CX - (8 * SLW + 7 * SLG) / 2;

  var T = {};
  /* quote lines: wrap at the strip width, 2 lines max */
  function wrap(s, px, maxw) {
    var words = s.split(' '), lines = [''];
    words.forEach(function (w) { var L = lines.length - 1, tr = lines[L] ? lines[L] + ' ' + w : w; if (tw(tr, px, 'condensed', 800) > maxw && lines[L]) lines.push(w); else lines[L] = tr; });
    return lines;
  }

  /* ---------- background: night board (ink, halftone, awning stripes) ---------- */
  var BG, NOISE;
  function buildBG() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(11);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1a1440'); gr.addColorStop(.55, '#120e2c'); gr.addColorStop(1, '#0b0a1d'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    /* diagonal awning stripes, very faint */
    g.save(); g.globalAlpha = .05; g.fillStyle = CORAL; for (var x = -H; x < W + H; x += 120) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 60, 0); g.lineTo(x + 60 + H * .5, H); g.lineTo(x + H * .5, H); g.closePath(); g.fill(); } g.restore();
    /* halftone dots, denser toward the bottom */
    for (var y = 0; y < H; y += 22) for (var xx = (y / 22 % 2) * 11; xx < W; xx += 22) { var k = y / H; g.fillStyle = 'rgba(255,90,78,' + (.03 + .07 * k * k).toFixed(3) + ')'; g.beginPath(); g.arc(xx, y, 1.5 + 3 * k * k, 0, TAU); g.fill(); }
    for (var i = 0; i < 5000; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.06)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    var vg = g.createRadialGradient(510, 880, 300, 510, 880, 1300); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }

  /* =====================================================================================================
     THE FLAP BOARD (frame 0 and the seam): WHO DO / YOU / TRUST? in split-flap tiles, a GTA 6 chip above.
     ===================================================================================================== */
  var BROWS = ['WHO DO', 'YOU', 'TRUST?'], FTW = 122, FTH = 196, FGAP = 10, FROWY = [610, 828, 1046];
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ?#';
  /* one flap tile; k in 0..1 = the top flap falling (0 = at rest). ch = letter showing, prev = letter before */
  function flapTile(g, x, y, w, h, ch, prev, k, px, bg) {
    var hh = h / 2;
    function half(c, top, yy, sc) {
      g.save(); g.beginPath(); g.rect(x, top ? y : y + hh, w, hh); g.clip();
      if (sc !== 1) { g.translate(0, yy); g.scale(1, sc); g.translate(0, -yy); }
      rr(g, x, y, w, h, 10); g.fillStyle = bg || '#1d1838'; g.fill();
      if (c !== ' ') { cond(g, 'condensed'); font(g, px, 900); ls(g, 0); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText(c, x + w / 2, y + hh + px * .05); unst(g); }
      g.restore();
    }
    g.save(); rr(g, x + 4, y + 8, w, h, 10); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill(); g.restore();
    if (k <= 0) { half(ch, true, 0, 1); half(ch, false, 0, 1); }
    else {
      /* new letter's top already showing behind, old letter's bottom below; the falling flap carries old top then new bottom */
      var nr = NOREC; NOREC = true;
      half(ch, true, 0, 1); half(prev, false, 0, 1);
      if (k < .5) half(prev, true, y + hh, 1 - k * 2); else half(ch, false, y + hh, (k - .5) * 2);
      NOREC = nr;
    }
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, y + hh - 2, w, 4);
    g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x + 6, y + 6, w - 12, 6);
  }
  /* the board, drawn with its top-left offset dy (slides); ripple: each tile flips once through a few letters, staggered */
  function board(g, t, dy, ripple0) {
    var sc = 1;
    g.save(); g.translate(0, dy);
    /* the board's frame */
    rr(g, 110, 484, 806, 704, 22); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, 104, 476, 812, 704, 22); g.fillStyle = INK; g.fill(); g.strokeStyle = 'rgba(251,243,228,.25)'; g.lineWidth = 3; g.stroke();
    [[124, 496], [896, 496], [124, 1160], [896, 1160]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 7, 0, TAU); g.fillStyle = '#56507e'; g.fill(); });
    BROWS.forEach(function (row, ri) {
      var n = row.length, x0 = CX - (n * FTW + (n - 1) * FGAP) / 2;
      for (var i = 0; i < n; i++) {
        var ch = row[i], x = x0 + i * (FTW + FGAP), y = FROWY[ri] - FTH / 2;
        if (ch === ' ') continue;
        var k = 0, show = ch, prev = ch;
        if (ripple0 != null) {
          /* three quick flips per tile through neighbour letters, landing back on its own letter */
          var s0 = ripple0 + (ri * 3 + i) * .03, u = (t - s0) / .08;
          if (u > 0 && u < 2) { var step = Math.floor(u), gi = GLYPHS.indexOf(ch), seq = [GLYPHS[(gi + 1) % GLYPHS.length], ch]; show = seq[step]; prev = step === 0 ? ch : seq[step - 1]; k = u - step; }
        }
        flapTile(g, x, y, FTW, FTH, show, prev, k, 176, ri === 2 ? '#2a1d4d' : '#1d1838');
      }
    });
    g.restore();
  }

  /* =====================================================================================================
     THE CARD: number tile, window (clip, then our panel), name bar, Rockstar quote strip.
     ===================================================================================================== */
  function cardFrame(g) {
    rr(g, CL + 8, CT + 12, CR - CL, CB - CT, 18); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, CL, CT, CR - CL, CB - CT, 18); g.fillStyle = CREAM; g.fill();
  }
  function numTile(g, i, t, C) {
    /* the native move: the tile flips over (a vertical squash) from ? to the number on the spoken name */
    var fl = seg(t, C.name - .14, C.name + .1), showNum = fl >= .5, sy = Math.abs(Math.cos(Math.PI * fl)), kk = kn(t, C.name + .1, .06);
    g.save(); g.translate(TX + TW / 2, TY + TH / 2); g.rotate(-.05); g.scale(kk, Math.max(.04, sy) * kk);
    rr(g, -TW / 2 + 6, -TH / 2 + 10, TW, TH, 16); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, -TW / 2, -TH / 2, TW, TH, 16); g.fillStyle = showNum ? CORAL : INK2; g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 5; rr(g, -TW / 2 + 9, -TH / 2 + 9, TW - 18, TH - 18, 10); g.stroke();
    var nr = NOREC; NOREC = nr || sy < .9;
    if (showNum) { T2(g, String(i + 1), -10, -6, 140, { col: CREAM }); M2(g, '/8', 40, 56, 34, { col: CREAM, ls: 0 }); }
    else T2(g, '?', 0, -4, 130, { col: CORAL });
    NOREC = nr; g.restore();
  }
  function nameBar(g, i, t, C, leaving) {
    var sub = CAST[i].sub, bh = sub ? 144 : 108, y0 = NY - 54;
    rr(g, WX, y0, WW, bh, 10); g.fillStyle = INK; g.fill();
    if (leaving) return;
    if (t < C.name - .02) { for (var d = 0; d < 3; d++) { g.beginPath(); g.arc(CX - 40 + d * 40, NY, 9, 0, TAU); g.fillStyle = 'rgba(251,243,228,.6)'; g.fill(); } return; }
    var k = eo(seg(t, C.name, C.name + .16)), s = lerp(1.25, 1, k) * kn(t, C.name + .14, .03);
    var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.beginPath(); g.rect(WX, y0, WW, bh); g.clip(); g.translate(CX, NY); g.scale(s, s); g.globalAlpha *= seg(t, C.name, C.name + .06);
    T2(g, CAST[i].name, 0, sub ? -6 : -2, 88, { max: WW - 60 });
    if (sub) T2(g, sub, 0, 62, 40, { col: CREAM, max: WW - 60 });
    g.restore(); NOREC = nr;
  }
  /* the window: the clip while its use runs, then a vertical wipe to our panel */
  function windowArea(g, i, t, C) {
    g.save(); rr(g, WX, WY, WW, WH, 10); g.clip();
    g.fillStyle = CAST[i].col; g.fillRect(WX, WY, WW, WH);
    var u = C.use, wipe = seg(t, u.t1 - .22, u.t1);
    if (t < u.t0) { g.globalAlpha *= .35; T2(g, '?', CX, WY + WH / 2, 300, { col: CREAM }); g.globalAlpha = 1; }
    else if (t < u.t1) {
      g.save(); if (C.bright) g.filter = 'brightness(' + C.bright + ') contrast(1.06)';
      CLIP.draw(g, Math.min(t, u.t1 - 1e-3), WX, WY, WW, WH, u); g.restore();
      /* annotation on the clip: a coral corner bracket and the credit */
      g.strokeStyle = CORAL; g.lineWidth = 7; g.lineCap = 'round';
      [[WX + 22, WY + 22, 1, 1], [WX + WW - 22, WY + 22, -1, 1], [WX + 22, WY + WH - 22, 1, -1], [WX + WW - 22, WY + WH - 22, -1, -1]].forEach(function (p) { g.beginPath(); g.moveTo(p[0], p[1] + 50 * p[3]); g.lineTo(p[0], p[1]); g.lineTo(p[0] + 50 * p[2], p[1]); g.stroke(); });
      CLIP.credit(g, u, WX + 36, WY + WH - 34, '700 30px "Geist Mono", monospace');
    }
    if (wipe > 0) {
      g.save(); g.beginPath(); g.rect(WX, WY + WH * (1 - eio(wipe)), WW, WH * eio(wipe) + 1); g.clip();
      g.fillStyle = CAST[i].col; g.fillRect(WX, WY, WW, WH); PANEL[i](g, t, C); g.restore();
    }
    g.restore();
    g.strokeStyle = INK; g.lineWidth = 6; rr(g, WX, WY, WW, WH, 10); g.stroke();
  }
  function card(g, i, t, dx, leaving) {
    var C = CC[i], nr0 = NOREC; NOREC = nr0 || Math.abs(dx) > .5;
    g.save(); g.translate(dx, 0);
    cardFrame(g); windowArea(g, i, t, C); nameBar(g, i, t, C, leaving);
    if (i === 7 && t >= T.lori) lori(g, t, WX + WW / 2 + 20, WY + WH - 64, 46);
    numTile(g, i, t, C);
    g.restore(); NOREC = nr0;
  }

  /* Rockstar's own line about Brian, as a fine-print sticker (exact words, cut with an ellipsis) */
  var LORI = '…WITH HIS THIRD WIFE, LORI';
  function lori(g, t, x, y, px) {
    var k = eo(seg(t, T.lori, T.lori + .16)), nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.translate(x, y); g.rotate(-.05); g.scale(lerp(1.08, 1, k), lerp(1.08, 1, k)); g.globalAlpha *= seg(t, T.lori, T.lori + .05);
    chip(g, LORI, 0, 0, px || 42, SUN, INK); g.restore(); NOREC = nr;
  }
  /* =====================================================================================================
     PANELS: our own flat drawing of each Rockstar line, inside the window (x 140-880, y 500-1040).
     ===================================================================================================== */
  var PX0 = WX + WW / 2, PY0 = WY + WH / 2;
  function disc(g, x, y, r, c) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = c; g.fill(); }
  var PANEL = [
    /* Jason: an easy road that turns into steps; HARDER lands on "harder" */
    function (g, t, C) {
      var k = eo(seg(t, C.use.t1 - .2, C.use.t1 + .5));
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(WX, PY0 + 140, WW, 140);
      g.fillStyle = CREAM; g.fillRect(WX, PY0 + 140, 240, 18);
      for (var s = 0; s < 5; s++) { var sx = WX + 240 + s * 96, sh = (s + 1) * 62 * eo(seg(t, C.use.t1 + s * .12, C.use.t1 + s * .12 + .3)); g.fillStyle = s % 2 ? '#f0e2c8' : CREAM; g.fillRect(sx, PY0 + 158 - sh, 96, sh); }
      /* a walking figure: a dot and a bar that climbs */
      var p = seg(t, C.use.t1 + .2, C.hard), cxp = lerp(WX + 120, WX + 560, p), cyp = PY0 + 120 - 260 * p * p;
      disc(g, cxp, cyp - 64, 20, SUN); g.fillStyle = SUN; rr(g, cxp - 14, cyp - 42, 28, 58, 10); g.fill();
      T2(g, 'EASY LIFE', WX + 140, PY0 + 196, 48, { col: CREAM, a: k });
      if (t >= C.hard) { var kh = eo(seg(t, C.hard, C.hard + .16)); g.save(); g.translate(PX0 + 230, PY0 - 120); g.rotate(.12); g.scale(lerp(1.5, 1, kh), lerp(1.5, 1, kh));
        g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.moveTo(6, -150 + 8); g.lineTo(96, -40 + 8); g.lineTo(40, -40 + 8); g.lineTo(40, 120 + 8); g.lineTo(-28, 120 + 8); g.lineTo(-28, -40 + 8); g.lineTo(-84, -40 + 8); g.closePath(); g.fill();
        g.fillStyle = CORAL; g.beginPath(); g.moveTo(0, -150); g.lineTo(90, -40); g.lineTo(34, -40); g.lineTo(34, 120); g.lineTo(-34, 120); g.lineTo(-34, -40); g.lineTo(-90, -40); g.closePath(); g.fill(); g.strokeStyle = CREAM; g.lineWidth = 6; g.stroke(); g.restore(); }
    },
    /* Lucia: a boxing glove punches on "fight" */
    function (g, t, C) {
      var pk = bump(t, C.fight, .35), x = PX0 - 60 + 170 * pk, y = PY0 + 10;
      g.save(); g.translate(x, y); g.rotate(-.12 + .1 * pk);
      g.fillStyle = '#f2ede4'; rr(g, -250, -62, 120, 124, 16); g.fill();
      g.fillStyle = CORAL; g.beginPath(); g.ellipse(0, 0, 150, 120, 0, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(-40, 62, 80, 52, -.2, 0, TAU); g.fill();
      g.fillStyle = CORALD; g.beginPath(); g.ellipse(-40, 70, 60, 34, -.2, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(30, -60, 70, 28, -.2, 0, TAU); g.fill();
      g.fillStyle = CREAM; g.fillRect(-140, -66, 16, 132);
      g.restore();
      for (var i = 0; i < 5; i++) { var a = -.6 + i * .3, L = 70 * pk; if (L < 4) continue; g.strokeStyle = SUN; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 190 + Math.cos(a) * 20, y + Math.sin(a) * 120); g.lineTo(x + 190 + Math.cos(a) * (20 + L), y + Math.sin(a) * (120 + L)); g.stroke(); }
    },
    /* Cal: a radio scanner on a couch arm, signal arcs pulsing, COAST GUARD on its screen */
    function (g, t, C) {
      g.fillStyle = '#123f3b'; rr(g, WX + 60, PY0 + 120, WW - 120, 120, 30); g.fill();
      g.fillStyle = '#2d2a26'; rr(g, PX0 - 210, PY0 - 120, 420, 230, 18); g.fill();
      g.fillStyle = '#a8f0c8'; rr(g, PX0 - 180, PY0 - 94, 360, 96, 8); g.fill();
      for (var wv = 0; wv < 22; wv++) { var hh = 10 + 30 * Math.abs(Math.sin(t * 7 + wv * .9) * Math.sin(wv * .4 + t)); g.fillStyle = '#0f3b2a'; g.fillRect(PX0 - 165 + wv * 15, PY0 - 46 - hh, 9, hh * 2); }
      for (var b = 0; b < 4; b++) disc(g, PX0 - 135 + b * 90, PY0 + 60, 22, b === 1 ? CORAL : '#6e6a62');
      g.fillStyle = '#2d2a26'; g.fillRect(PX0 + 150, PY0 - 260, 16, 150);
      for (var i = 0; i < 3; i++) { var ph = ((t * 1.6 + i / 3) % 1); g.strokeStyle = 'rgba(168,240,200,' + (1 - ph).toFixed(3) + ')'; g.lineWidth = 8; g.beginPath(); g.arc(PX0 + 158, PY0 - 262, 30 + ph * 120, -2.5, -.65); g.stroke(); }
    },
    /* Boobie: a playing card turns over to the Jack of Hearts on "business" */
    function (g, t, C) {
      var f = seg(t, C.biz - .1, C.biz + .2), sx = Math.abs(Math.cos(Math.PI * f)), face = f >= .5;
      g.save(); g.translate(PX0, PY0); g.rotate(.06); g.scale(Math.max(.03, sx), 1);
      rr(g, -150 + 8, -210 + 12, 300, 420, 22); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
      rr(g, -150, -210, 300, 420, 22); g.fillStyle = face ? CREAM : '#3b1d63'; g.fill();
      var nr = NOREC; NOREC = nr || sx < .95;
      if (face) {
        T2(g, 'J', -96, -150, 84, { col: CORALD }); T2(g, 'J', 96, 150, 84, { col: CORALD });
        g.fillStyle = CORAL; g.beginPath(); g.moveTo(0, 90); g.bezierCurveTo(-150, -10, -80, -120, 0, -50); g.bezierCurveTo(80, -120, 150, -10, 0, 90); g.fill();
      } else { g.strokeStyle = SUN; g.lineWidth = 6; rr(g, -126, -186, 252, 372, 14); g.stroke(); for (var d = -3; d <= 3; d++) { g.beginPath(); g.moveTo(-126, d * 60); g.lineTo(126, d * 60 + 60); g.stroke(); } }
      NOREC = nr; g.restore();
      /* a grin of light under the card before the turn: all smiles */
      if (!face) { g.strokeStyle = SUN; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.arc(PX0 + 250, PY0 - 120, 60, .3, Math.PI - .3); g.stroke(); disc(g, PX0 + 225, PY0 - 140, 10, SUN); disc(g, PX0 + 275, PY0 - 140, 10, SUN); }
    },
    /* Dre'Quan: a spinning record with Rockstar's label line ONLY RAW... RECORDS */
    function (g, t, C) {
      var a = t * 3.2;
      disc(g, PX0 + 8, PY0 + 12, 230, 'rgba(0,0,0,.4)'); disc(g, PX0, PY0, 230, '#111');
      for (var r = 90; r < 225; r += 12) { g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 2; g.beginPath(); g.arc(PX0, PY0, r, 0, TAU); g.stroke(); }
      g.save(); g.translate(PX0, PY0); g.rotate(a); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 170, -.3, .3); g.stroke(); g.restore();
      disc(g, PX0, PY0, 86, SUN); disc(g, PX0, PY0, 8, '#111');
      g.save(); g.translate(PX0, PY0); g.rotate(a); disc(g, 0, -52, 14, CORAL); g.restore();
      /* tone arm */
      g.save(); g.translate(PX0 + 300, PY0 - 200); g.rotate(.5 + .02 * Math.sin(t * 9)); g.fillStyle = '#d9d2c3'; g.fillRect(-8, 0, 16, 230); g.fillRect(-20, 220, 40, 40); g.restore();
    },
    /* Dimez: two phones (two people), a play button each, view counts and hearts rising on "viral" */
    function (g, t, C) {
      [-1, 1].forEach(function (s, j) {
        var x = PX0 + s * 165, y = PY0 + 10 + 8 * Math.sin(t * 5 + j);
        g.save(); g.translate(x, y); g.rotate(s * .07);
        rr(g, -110 + 6, -200 + 10, 220, 400, 30); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
        rr(g, -110, -200, 220, 400, 30); g.fillStyle = '#16122a'; g.fill();
        rr(g, -96, -170, 192, 330, 14); g.fillStyle = j ? '#ff8a5c' : '#c33b7a'; g.fill();
        disc(g, 0, -10, 46, 'rgba(255,255,255,.85)'); g.fillStyle = j ? '#ff8a5c' : '#c33b7a'; g.beginPath(); g.moveTo(-14, -34); g.lineTo(26, -10); g.lineTo(-14, 14); g.fill();
        g.restore();
      });
      for (var i = 0; i < 9; i++) {
        var s0 = C.viral + i * .12, u = t - s0; if (u < 0) continue; var x = PX0 + (hash(i) - .5) * 520, y = PY0 + 200 - u * 330;
        if (y < WY + 30) continue; g.save(); g.translate(x, y); g.scale(.9 + hash(i + 9) * .6, .9 + hash(i + 9) * .6); g.fillStyle = CORAL; g.beginPath(); g.moveTo(0, 18); g.bezierCurveTo(-30, -2, -16, -24, 0, -10); g.bezierCurveTo(16, -24, 30, -2, 0, 18); g.fill(); g.restore();
      }
    },
    /* Raul: a vault door that swings open on "banks" */
    function (g, t, C) {
      var o = eio(seg(t, C.banks, C.banks + .5)), cxv = PX0 - 40, cyv = PY0;
      g.fillStyle = '#2a2f3a'; rr(g, cxv - 250, cyv - 230, 500, 460, 24); g.fill();
      disc(g, cxv, cyv, 200, '#11141a');
      /* gold bars inside */
      for (var b = 0; b < 3; b++) { g.fillStyle = b % 2 ? '#e8b64a' : SUN; g.fillRect(cxv - 120 + b * 80, cyv + 40 - (b % 2) * 50, 70, 40); }
      g.save(); g.translate(cxv + 200 * o * 1.05, cyv); g.scale(1 - .75 * o, 1);
      disc(g, 0, 0, 196, '#8f99a8'); disc(g, 0, 0, 150, '#a9b2bf');
      g.rotate(t * 1.4 + o * 3); g.strokeStyle = '#3a3f4a'; g.lineWidth = 16; g.lineCap = 'round';
      for (var s = 0; s < 3; s++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(s * TAU / 3) * 110, Math.sin(s * TAU / 3) * 110); g.stroke(); }
      disc(g, 0, 0, 30, '#3a3f4a'); g.restore();
    },
    /* Brian: a boat at sunset (his line on the People page: "Nothing better than a Mudslide at sunset") */
    function (g, t, C) {
      var gr = g.createLinearGradient(0, WY, 0, WY + WH); gr.addColorStop(0, '#2b2160'); gr.addColorStop(.55, '#e2577a'); gr.addColorStop(.62, SUN); gr.addColorStop(.63, '#1d5e78'); gr.addColorStop(1, '#0e3346'); g.fillStyle = gr; g.fillRect(WX, WY, WW, WH);
      disc(g, PX0 + 120, WY + WH * .6, 110 + 4 * Math.sin(t * 2), SUN);
      g.fillStyle = '#1d5e78'; g.fillRect(WX, WY + WH * .62, WW, WH * .38);
      for (var i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,179,71,.5)'; g.fillRect(PX0 + 40 + Math.sin(t * 3 + i) * 20, WY + WH * .66 + i * 26, 160 - i * 18, 6); }
      var bx = PX0 - 160 + 24 * Math.sin(t * .9), by = WY + WH * .64 + 6 * Math.sin(t * 2.2);
      g.fillStyle = CREAM; g.beginPath(); g.moveTo(bx - 170, by - 40); g.lineTo(bx + 170, by - 40); g.lineTo(bx + 120, by + 20); g.lineTo(bx - 140, by + 20); g.closePath(); g.fill();
      g.fillStyle = '#f0e2c8'; g.fillRect(bx - 80, by - 100, 130, 60); g.fillStyle = '#2b2160'; g.fillRect(bx - 66, by - 88, 44, 30); g.fillRect(bx - 10, by - 88, 44, 30);
      g.fillStyle = CORAL; g.fillRect(bx - 170, by - 46, 340, 10);
    }
  ];
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  /* ---------- the lineup rail: eight number slots along the bottom ---------- */
  function rail(g, t, ballot) {
    for (var i = 0; i < 8; i++) {
      var x = SL0 + i * (SLW + SLG), C = CC[i], lit = t >= C.name && t < T.seamDrop + .25 + i * .03, cur = lit && t < T.endIn && (i === 7 || t < CC[i + 1].name);
      if (ballot) cur = false;
      var pop = kn(t, C.name, .18) * kn(t, T.pulse + i * .04, .12), y = SLY;
      g.save(); g.translate(x + SLW / 2, y); g.scale(pop, pop);
      rr(g, -SLW / 2, -40, SLW, 80, 12); g.fillStyle = cur ? CORAL : lit ? CREAM : 'rgba(31,26,68,.92)'; g.fill();
      if (!lit) { g.strokeStyle = 'rgba(251,243,228,.35)'; g.lineWidth = 3; g.stroke(); }
      T2(g, String(i + 1), 0, 0, 52, { col: cur ? CREAM : lit ? INK : 'rgba(251,243,228,.75)' });
      g.restore();
    }
  }

  /* ---------- the ballot: all eight, numbered, none highlighted ---------- */
  var BW = 405, BH = 200, BY0 = 458;
  function ballot(g, t) {
    for (var i = 0; i < 8; i++) {
      var col = i % 2, row = Math.floor(i / 2), x = col ? CX + 5 : CX - 5 - BW, y = BY0 + row * (BH + 8);
      var s0 = T.endIn + i * .06, k = eo(seg(t, s0, s0 + .3));
      if (k <= 0) continue;
      var nr = NOREC; NOREC = nr || k < .999;
      g.save(); g.translate(x + BW / 2 + (1 - k) * (col ? 520 : -520), y + BH / 2);
      rr(g, -BW / 2 + 6, -BH / 2 + 9, BW, BH, 14); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
      rr(g, -BW / 2, -BH / 2, BW, BH, 14); g.fillStyle = CREAM; g.fill();
      /* the face: a still from that person's own official clip */
      var u = BU[i]; g.save(); if (BB[i]) g.filter = 'brightness(' + BB[i] + ')'; CLIP.draw(g, t, -BW / 2, -BH / 2, BH, BH, u); g.restore();
      g.strokeStyle = INK; g.lineWidth = 5; rr(g, -BW / 2, -BH / 2, BH, BH, 12); g.stroke();
      rr(g, -BW / 2 + 6, -BH / 2 + 6, 64, 64, 10); g.fillStyle = CORAL; g.fill(); T2(g, String(i + 1), -BW / 2 + 38, -BH / 2 + 38, 54, { col: CREAM });
      var nm = CAST[i].name.split(' '), TXL = -BW / 2 + BH + 14, MX = BW - BH - 22;
      if (CAST[i].sub) { T2(g, 'REAL DIMEZ', TXL - 4, -30, 36, { col: INK, align: 'left', ls: 0, st: 'condensed' }); T2(g, 'BAE-LUXE', TXL, 20, 36, { col: CORALD, align: 'left', max: MX }); T2(g, '& ROXY', TXL, 60, 36, { col: CORALD, align: 'left', max: MX }); }
      else { T2(g, nm[0], TXL, -24, 58, { col: INK, align: 'left', max: MX }); T2(g, nm.slice(1).join(' '), TXL, 34, 42, { col: '#5a4e63', align: 'left', max: MX }); }
      g.restore(); NOREC = nr;
    }
    /* Brian's Rockstar line rides on his tile */
    var bx = CX + 5 + BW / 2 - 62, by = BY0 + 3 * (BH + 8) + BH - 18;
    if (t >= T.endIn + .25) lori(g, Math.max(t, T.lori + 1), bx, by, 36);
  }
  function header(g, t, dy) {
    var txt = t < T.drop ? 'WHO DO YOU TRUST?' : 'DROP THE NUMBER!', prevTxt = 'WHO DO YOU TRUST?', n = 17, w = 44, gap = 4, x0 = CX - (n * w + (n - 1) * gap) / 2;
    g.save(); g.translate(0, dy);
    for (var i = 0; i < n; i++) {
      var ch = txt[i] || ' ', pv = prevTxt[i] || ' ', k = 0;
      if (t >= T.drop) { var u = (t - T.drop - i * .02) / .1; if (u < 1) { k = clamp(u, 0, 1); if (u < 0) { ch = pv; } } }
      if (k > 0 && k < 1) flapTile(g, x0 + i * (w + gap), 398 - 34, w, 68, ch, pv, k, 56, '#1d1838');
      else flapTile(g, x0 + i * (w + gap), 398 - 34, w, 68, ch, ch, 0, 56, '#1d1838');
    }
    g.restore();
  }
  /* small flat icon per person for the ballot (our drawing, no likeness) */
  function PANEL_ICON(g, i, x, y) {
    g.save(); g.translate(x, y);
    if (i === 0) { g.fillStyle = CREAM; for (var s = 0; s < 4; s++) g.fillRect(-48 + s * 24, 40 - (s + 1) * 18, 24, (s + 1) * 18); }
    else if (i === 1) { g.fillStyle = CORAL; g.beginPath(); g.ellipse(0, -6, 40, 32, 0, 0, TAU); g.fill(); g.fillStyle = CREAM; g.fillRect(-46, 18, 30, 28); }
    else if (i === 2) { g.fillStyle = '#2d2a26'; rr(g, -40, -20, 80, 50, 6); g.fill(); g.fillStyle = '#a8f0c8'; g.fillRect(-32, -12, 64, 18); g.fillStyle = '#2d2a26'; g.fillRect(24, -60, 6, 40); }
    else if (i === 3) { g.fillStyle = CREAM; rr(g, -32, -46, 64, 92, 8); g.fill(); g.fillStyle = CORAL; g.beginPath(); g.moveTo(0, 22); g.bezierCurveTo(-34, 0, -18, -26, 0, -10); g.bezierCurveTo(18, -26, 34, 0, 0, 22); g.fill(); }
    else if (i === 4) { disc(g, 0, 0, 46, '#111'); disc(g, 0, 0, 18, SUN); }
    else if (i === 5) { [-22, 22].forEach(function (dx) { g.fillStyle = '#16122a'; rr(g, dx - 18, -36, 36, 72, 8); g.fill(); g.fillStyle = CORAL; g.fillRect(dx - 13, -28, 26, 52); }); }
    else if (i === 6) { disc(g, 0, 0, 44, '#8f99a8'); g.strokeStyle = '#3a3f4a'; g.lineWidth = 6; for (var k = 0; k < 3; k++) { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(k * 2.09) * 30, Math.sin(k * 2.09) * 30); g.stroke(); } }
    else { disc(g, 10, -10, 26, SUN); g.fillStyle = CREAM; g.beginPath(); g.moveTo(-44, 14); g.lineTo(44, 14); g.lineTo(30, 34); g.lineTo(-36, 34); g.fill(); }
    g.restore();
  }

  /* =====================================================================================================
     CAPTIONS: cream tape in the upper third, phrase by phrase (the hook's words are the frame-0 board)
     ===================================================================================================== */
  var GLUE = { the: 1, a: 1, an: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, so: 1, for: 1, as: 1, he: 1, she: 1, it: 1, you: 1, do: 1 };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'end') return;
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]["”]?$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    return outc.map(function (ws) { return { id: ws.id, t0: ws[0].t0, t1: ws[ws.length - 1].t1, s: ws[0].t0 - .04, words: ws }; });
  })();
  var STRESS = [], CAPY = 368;
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }
  function captions(g, t) {
    t = tq(t);
    var c0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s) { c0 = c; ci = i; } });
    if (!c0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s : T.capEnd, nd = T.endIn - .34;
    for (var j = CC.length - 1; j >= 0; j--) if (CC[j].deal - .34 > c0.s + .3) nd = Math.min(nd, CC[j].deal - .34);
    var end = Math.min(c0.t1 + .55, ns, nd - .15);
    if (t >= end) return;
    var k = cd(t, c0.s, 16), ko = 1 - seg(t, end - .06, end);
    g.save(); g.globalAlpha *= ko; cond(g, 'condensed'); var cpx = 72; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = c0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws, gap, lines, lw, maxw = 760;
    function meas() { ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; }
    function lay() {
      lines = [[]]; lw = [0];
      words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; });
      for (var L = 0; L < lines.length - 1; L++) { var last = lines[L][lines[L].length - 1]; while (lines[L].length > 1 && GLUE[norm(words[last].w)]) { lines[L].pop(); lines[L + 1].unshift(last); last = lines[L][lines[L].length - 1]; } }
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    meas(); lay();
    while ((lines.length > 2 || Math.max.apply(null, lw) - gap > maxw) && cpx > 52) { cpx -= 4; font(g, cpx, 900); meas(); lay(); }
    var lh = cpx * 1.3, y0 = CAPY - (lines.length - 1) * lh / 2 + cpx * .36;
    lines.forEach(function (ln, li) {
      var tw0 = lw[li] - gap, x = CX - tw0 / 2, y = y0 + li * lh + (1 - k) * 26, r = mulberry(Math.round(c0.t0 * 100) + li * 7);
      var x0 = x - 22, x1 = x + tw0 + 22, yt = y - cpx * .86, yb = y + cpx * .24, rot = (r() - .5) * .025;
      g.save(); g.translate(CX, y); g.rotate(rot); g.translate(-CX, -y);
      g.save(); g.shadowColor = 'rgba(0,4,20,.55)'; g.shadowBlur = 10; g.shadowOffsetX = 3; g.shadowOffsetY = 6; g.fillStyle = CREAM; rr(g, x0, yt, x1 - x0, yb - yt, 6); g.fill(); g.restore();
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .25;
        if (cur) { g.save(); g.fillStyle = SUN; g.fillRect(x - 6, y - cpx * .78, ws[i] + 12, cpx * .98); g.restore(); }
        var isG = /^GTA$/.test(up[i]); g.fillStyle = isG ? PINK : INK; g.fillText(up[i], x, y); x += ws[i] + gap;
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
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1); else g.rect(-500, -500, 2080, BY1 + 500); g.clip(); }
  /* the board sits pushed in a touch at frame 0 and at the seam */
  function push(t) { if (t < 1.4) return 1 + .02 * (1 - eio(seg(t, 0, 1.4))); if (t >= T.seam) return 1 + .02 * eio(seg(t, T.seam, DUR)); return 1; }
  function plateLayer(g, t) {
    var u = CLIP.activePlate(t); if (!u) return;
    var k = (u.t0 <= 0 ? 1 : seg(t, u.t0, u.t0 + .25)) * (u.t1 >= DUR ? 1 : 1 - seg(t, u.t1 - .25, u.t1));
    var hook = u.t0 <= 0 || u.t1 >= DUR;
    g.save(); g.globalAlpha = k; if (hook) g.filter = 'brightness(1.1)'; CLIP.plate(g, t, 0, 0, W, H, hook ? { dim: .45, blur: 0 } : { dim: .5, blur: 2 }); g.restore();
  }
  function props(g, t) {
    /* the hook board: frame 0 over a dimmed street plate; lifts away as card 1 deals in; drops back on at the seam */
    if (t < T.boardOut + .5) {
      var ko = eio(seg(t, T.boardOut, T.boardOut + .36)), nr = NOREC; NOREC = nr || ko > 0;
      board(g, t, -1300 * ko, .12); NOREC = nr;
    }
    /* the cards: each lands on its spoken name as the one before leaves left (card 5 flips in instead: a break in the deal) */
    for (var i = 0; i < 8; i++) {
      var C = CC[i], tin = C.deal, tout = i < 7 ? CC[i + 1].deal : T.endIn;
      if (t < tin - .36 || t > tout + .36) continue;
      var ki = eo(seg(t, tin - .34, tin)), ko2 = eio(seg(t, tout - .3, tout + .05));
      if (i === 4 && t < tin + .02) {
        var fk = seg(t, tin - .3, tin), sx = Math.max(.02, Math.sin(Math.PI / 2 * fk)), nrf = NOREC; NOREC = true;
        g.save(); g.translate(CX, 0); g.scale(sx, 1); g.translate(-CX, 0); card(g, i, t, 0); g.restore(); NOREC = nrf;
      } else card(g, i, t, (i === 4 ? 0 : 900 * (1 - ki)) - 980 * ko2, t > tout - .32);
    }
    if (t >= T.seamDrop) {
      var kd = seg(t, T.seamDrop, T.seamLand), fall = (1 - kd * kd) * 1300, nr3 = NOREC; NOREC = nr3 || kd < 1;
      board(g, t, -fall, null); NOREC = nr3;
    }
    if (t >= T.endIn - .1 && t < T.seamDrop + .5) {
      var kb = eio(seg(t, T.seamDrop - .1, T.seamDrop + .45)), nrb = NOREC; NOREC = nrb || kb > 0;
      g.save(); g.translate(0, 1300 * kb); ballot(g, t); g.restore();
      header(g, t, -900 * kb - 260 * (1 - eo(seg(t, T.endIn, T.endIn + .3)))); NOREC = nrb;
    }
    /* GTA 6 chip over the board (frame 0 and the seam) */
    var gk = t < T.boardOut + .4 ? 1 - eio(seg(t, T.boardOut, T.boardOut + .3)) : t >= T.seamDrop ? seg(t, T.seamDrop, T.seamLand) : 0;
    if (gk > 0) { var nr4 = NOREC; NOREC = nr4 || gk < 1; g.save(); g.globalAlpha *= gk; chip(g, 'GTA 6', CX, 478 + (1 - gk) * -200, 72, PINK, CREAM, { rot: -.03 }); g.restore(); NOREC = nr4; }
    /* the rail; the GTA 6 CHARACTERS chip sits over it from 1.0 s until card 1 has settled */
    var ck = eo(seg(t, T.chip, T.chip + .2)) * (1 - eio(seg(t, T.chipOut, T.chipOut + .25)));
    if (ck < .999) { g.save(); g.globalAlpha *= 1 - ck; rail(g, t); g.restore(); }
    if (ck > 0) { var nr5 = NOREC; NOREC = nr5 || ck < .999; g.save(); g.globalAlpha *= ck; chip(g, 'GTA 6 CHARACTERS', CX, SLY + (1 - ck) * 30, 64, CORAL, CREAM, { rot: -.015 }); g.restore(); NOREC = nr5; }
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) { g.drawImage(BG, 0, 0); plateLayer(g, t); }
    var ddx = 3 * osc(t, 13, .3), ddy = 3 * osc(t, 11, 2.1), ps = push(t);
    g.save(); railClip(g); g.translate(510 + ddx, 900 + ddy); g.scale(ps, ps); g.translate(-510, -900);
    props(g, t); g.restore();
    if (!POSTERMODE && LIVE.text) captions(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('who', 'WHO DO YOU TRUST?', 0, T.boardOut + .1); Tx('who', 'WHO DO YOU TRUST?', T.endIn + .3, T.drop); Tx('who', 'WHO DO YOU TRUST?', T.seamLand - .1, DUR + 1);
    Tx('gta6', 'GTA 6', 0, T.boardOut + .1); Tx('gta6', 'GTA 6', T.seamLand - .1, DUR + 1);
    Tx('chip', 'GTA 6 CHARACTERS', T.chip + .1, T.chipOut + .1);
    var bA = T.endIn + .4, bB = T.seamDrop + .1;
    for (var i = 0; i < 8; i++) {
      var C = CC[i], tout = i < 7 ? CC[i + 1].deal - .3 : T.endIn - .2;
      Tx('n' + i, CAST[i].name, C.name + .1, tout); Tx('n' + i, CAST[i].name, bA, bB);
      if (CAST[i].sub) { Tx('sub' + i, CAST[i].sub, C.name + .1, tout); Tx('sub' + i, CAST[i].sub, bA, bB); }
    }

    Tx('lori', LORI, T.lori + .1, T.endIn - .2); Tx('lori', LORI, T.endIn + .3, bB);
    return o;
  }

  /* ---------- times, clips and sound events, all from the voice ---------- */
  var CC = [];
  var BU = [], BB = [];
  function initTimes() {
    CC.length = 0;
    T.boardOut = 1.12; T.chip = .78;
    G('rip', .12, 'flap', .2, .9);
    G('chipS', T.chip, 'pop', .25, .8);
    G('bout', T.boardOut - .05, 'swish', .2, .9);
    CAST.forEach(function (c, i) {
      var nameW = c.id === 'brian' ? find('brian', 'brian') : LINE[c.id].words[0];
      /* each card lands on its spoken name (card 1 lands at 1.46 s and names itself at 1.52 s, before the voice gets to it) */
      var C = i === 0 ? { name: 1.52, deal: 1.46 } : { name: nameW.t0, deal: nameW.t0 - .03 };
      CC.push(C);
    });
    T.chipOut = 3.5; T.pulse = CC[4].name;
    T.endIn = start('end') - .12; T.drop = at('end', 'drop') - .05; T.lori = at('brian', 'others') + .1;
    T.seamDrop = DUR - 1.02; T.seamLand = DUR - .62; T.seam = DUR - 1.6; T.capEnd = T.endIn - .3;
    var C0 = CC[0];
    CLIP.reset();
    /* the clip in each window: starts as the card slides in, 1.3 s, so the face is up when the name lands */
    function clipUse(i, dur, o) {
      o = o || {}; var c = CLIP.manifest().clips[CAST[i].clip], span = c.frames / 30 - .04 - (o.from || 0), t0 = CC[i].name, live = Math.min(span, .9);
      CC[i].use = CLIP.use(CAST[i].clip, t0, t0 + dur, { from: o.from || 0, freeze: live, zoom: o.zoom || [1.0, 1.06], focus: o.focus || [.5, .4], note: o.note + ' (plays, then holds its last frame)' });
      CC[i].bright = o.bright;
    }
    clipUse(0, 1.3, { focus: [.33, .35], zoom: [1.06, 1.12], bright: 1.55, note: 'Jason Duval, card 1: number and name on the card (An Extended Look)' });
    clipUse(1, 1.3, { from: .3, focus: [.29, .52], zoom: [1.7, 1.8], bright: 1.5, note: 'Lucia Caminos, card 2: number and name (An Extended Look)' });
    clipUse(2, 1.3, { focus: [.55, .35], note: 'Cal Hampton, card 3: number and name' });
    clipUse(3, 1.3, { focus: [.4, .45], bright: 1.55, note: 'Boobie Ike, card 4: number and name' });
    clipUse(4, 1.3, { focus: [.5, .4], bright: 1.15, note: 'Dre\'Quan Priest, card 5: number and name' });
    clipUse(5, 1.3, { focus: [.4, .4], bright: 1.15, note: 'Real Dimez (Bae-Luxe and Roxy), card 6: names' });
    clipUse(6, 1.3, { focus: [.55, .35], note: 'Raul Bautista, card 7: number and name' });
    clipUse(7, 1.3, { focus: [.55, .3], note: 'Brian Heder, card 8: number, name and Rockstar\'s line about him' });
    /* the ballot: a still of each person from their own clip, as a numbered face tile with the name */
    var BF = [[1.1, [.36, .3], 1.5, 1.55], [.9, [.27, .5], 2.0, 1.5], [0, [.68, .28], 1.4, 0], [.8, [.55, .35], 1.25, 1.55], [.8, [.5, .35], 1.2, 1.15], [.8, [.5, .3], 1.0, 1.15], [1.2, [.55, .3], 1.2, 0], [.8, [.6, .3], 1.25, 0]];
    BU.length = 0; BB.length = 0;
    CAST.forEach(function (c, i) { var f = BF[i]; BU.push(CLIP.use(c.clip, T.endIn - .2, T.seamDrop + .45, { from: f[0], freeze: 0, zoom: [f[2], f[2]], focus: f[1], note: 'ballot tile ' + (i + 1) + ': still of ' + c.name + ' with number and name' })); BB.push(f[3]); });
    /* background plates (rule 11): dimmed under the board; the street plate is under frame 0 and comes back, frozen on its first frame, for the seam */
    function plate(name, t0, t1, o) { o = o || {}; var c = CLIP.manifest().clips[name], span = c.frames / 30 - .04; return CLIP.use(name, t0, t1, { plate: true, from: 0, freeze: o.freeze, speed: Math.min(1, span / (t1 - t0)), zoom: o.zoom || [1.08, 1.0], focus: [.5, .5], note: 'background plate behind the lineup board' }); }
    plate('pstreet', 0, 1.5, { zoom: [1.0, 1.04] });
    plate('pstreet', DUR - 1.1, DUR + .02, { freeze: 0, zoom: [1.0, 1.0] });
    plate('pboat', CC[1].deal, CC[1].deal + 1.8);
    plate('pclub', CC[3].deal - .2, CC[3].deal + 2.2);
    plate('pclub2', CC[5].deal, CC[5].deal + 1.6);
    /* beats inside the panels */
    C0.hard = at('jason', 'harder');
    CC[1].fight = at('lucia', 'fight');
    CC[3].biz = at('boobie', 'business');
    CC[5].viral = at('dimez', 'viral');
    CC[6].banks = at('raul', 'bank');
    CC.forEach(function (C, i) {
      G('deal' + i, C.deal - .34, 'swish', .2, .8);
      G('flip' + i, C.name, 'flap', .3, 1);
    });
    G('hard', C0.hard, 'slap', .3, 1);
    G('fight', CC[1].fight + .1, 'slap', .3, 1);
    G('biz', CC[3].biz, 'flap', .3, .8);
    G('banks', CC[6].banks + .1, 'whirr', .3, .8);
    G('lori', T.lori, 'slap', .3, 1);
    G('endIn', T.endIn - .2, 'swish', .2, .9);
    for (var b = 0; b < 8; b++) EV.push({ t: T.endIn + b * .06, type: 'tock', g: .35, id: 'bal' + b });
    G('drop', T.drop, 'flap', .3, .9);
    G('seam', T.seamDrop, 'swish', .2, .8);
    STRESS = [find('jason', 0).t0, C0.hard, find('lucia', 0).t0, CC[1].fight, find('cal', 0).t0, at('cal', 'coast'), find('boobie', 0).t0, CC[3].biz, find('drequan', 0).t0, at('drequan', 'hustler'), find('dimez', 0).t0, CC[5].viral, find('raul', 0).t0, CC[6].banks, CC[7].name, at('brian', 'dirty')];
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
    /* split-flap: a fast rattle of plastic clicks */
    function flap(t, g) { for (var j = 0; j < 6; j++) { tick(t + j * .022 + rnd() * .006, (.6 + rnd() * .6) * g, 2200 + rnd() * 2200); } thump(t, .1 * g, 400); }
    function slap(t, g) { thump(t, .3 * g, 240); nband(t, t + .07, 2600, 1200, .14 * g, .01 * g, .9); tick(t, 1.1 * g, 2000); }
    function tock(t, g) { tick(t, .7 * g, 2600); thump(t, .12 * g, 520); }
    function swish(t, g) { nband(t, t + .2, 900, 3600, .2 * g, .03 * g, .8); }
    function pop(t, g) { var o = osc2('sine', 520, t, t + .12, [[t, 0], [t + .004, .18 * g], [t + .1, 0]]); o.frequency.exponentialRampToValueAtTime(880, t + .08); tick(t, .5 * g, 3000); }
    function whirr(t, g) { for (var j = 0; j < 8; j++) tick(t + j * .035, .5 * g, 1500 + j * 200); thump(t + .3, .25 * g, 120); }
    var LEVEL = { tock: 2, flap: 2.5, slap: 3, swish: 3, pop: 2, whirr: 2 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = { tock: -22, flap: -14, slap: -14, swish: -16, pop: -16, whirr: -16 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      ({ flap: flap, slap: slap, tock: tock, swish: swish, pop: pop, whirr: whirr })[e.type](e.t, g);
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
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0?“…↑&\''); }))).then(function () { return document.fonts.ready; }).then(function () {
      BG = buildBG(); EV.length = 0; initTimes();
      window.FILM.POSTER = Math.round((at('brian', 'dirty') + .8) * 30) / 30 + 1 / 60;
      window.FILM.SHOTS = [{ id: 'hook', name: 'Who do you trust?', t0: 0, t1: start('jason') }].concat(CAST.map(function (c, i) { return { id: c.id, name: c.name, t0: start(c.id), t1: i < 7 ? start(CAST[i + 1].id) : start('end') }; })).concat([{ id: 'end', name: 'Ballot', t0: start('end'), t1: DUR }]);
      window.READY = true;
    });
  }
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-cast', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var o = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var r = o[b.text] || (o[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); r.to = b.t; r.n++; r.x0 = Math.min(r.x0, b.x0); r.x1 = Math.max(r.x1, b.x1); r.y1 = Math.max(r.y1, b.y1); });
    BOUNDS = null; return Object.keys(o).map(function (k) { return o[k]; });
  };
  window.RAIL_SCAN = function (fps, subs) {
    fps = fps || 30; subs = subs || 3; var bad = [], n = Math.round(DUR * fps), span = .5 / fps;
    LIVE2.bg = false; LIVE2.clip = false; var lg = LIVE.grain; LIVE.grain = false; var lt = LIVE.text; LIVE.text = false;
    function dirty(x, y, w, h) { var d = ctx.getImageData(x, y, w, h).data, o = { c: 0 }; for (var i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x0a) + Math.abs(d[i + 1] - 0x14) + Math.abs(d[i + 2] - 0x30) > 24) o.c++; return o; }
    for (var i = 0; i < n; i++) for (var s = 0; s < subs; s++) {
      var t = (i + .5) / fps - span / 2 + span * (s + .5) / subs; frame(ctx, clamp(t, 0, DUR));
      var L0 = dirty(0, 300, 90, H - 300), R0 = dirty(930, 300, 150, H - 300), B0 = dirty(90, 1450, 840, H - 1450);
      if (L0.c + R0.c + B0.c > 0) { bad.push({ f: i, t: +t.toFixed(3), left: L0.c, right: R0.c, bottom: B0.c }); break; }
    }
    LIVE2.bg = true; LIVE2.clip = true; LIVE.grain = lg; LIVE.text = lt; return bad;
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
