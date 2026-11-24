/* "GTA 6 Trailer 1 ended on this": Delta, Trailer vs Reality Short (slug gta-holdup), round 2 after jury r1. Sources in BRIEF.md.
   Trailer 1 (Dec 4 2023) ends on a convenience-store holdup; Rockstar's An Extended Look (Aug 27 2026, "captured entirely from
   in-game footage") shows store holdups again, from the same low camera, with a HUD on screen.
   Set: the store's security monitors (bezel, scanlines, REC, CAM tag with the video's date); native move: the channel switch
   (static snow + rolling bar + an audible flick). A 2023 -> 2026 rail along the bottom fills on "August".
   Footage: Trailer 1 (76.5-78.35, 68.7-70.2), An Extended Look (705.8-710.9, 715.6-717.05; plate 729.2-731.55),
   Launch Trailer plate 44.45-46.2. All muted, each use under 5 s. No Rockstar logo (Trailer 1 is cut before its VI logo).
   Pure function of t. Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). Engine from gta-cast. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var INK = '#0c1a1d', CREAM = '#fbf3e4', RED = '#e0303a', PINK = '#e6337a', SUN = '#ffc94a';
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
  var BODY = { swish: .22, slap: .1, tock: .06, pop: .1, fizz: .26, flick: .07 };
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
     THE SET: a convenience store after hours. Teal-ink ground, checker floor, shelf-light strips, one bandana red.
     Every footage card is a store SECURITY MONITOR (bezel, scanlines, REC dot, CAM tag with the video's date).
     Native move: the CHANNEL SWITCH (static snow + a rolling bar + an audible flick) whenever a monitor changes feed.
     Layouts change by beat: a big monitor (hook, date, HUD push), a mid monitor (doubt, Extended Look), two tilted
     offset monitors (the match), a full-width HUD redraw with no monitor, a low quote card over a bright plate, the vote.
     ===================================================================================================== */
  var HERO = { x: 40, w: 1000, y: 470, h: 930 }, BIG = { x: 90, w: 840, y: 470, h: 830 }, MID = { x: 110, w: 800, y: 560, h: 660 };
  var TOPM = { x: 102, w: 740, y: 360, h: 500, rot: -.05 }, BOTM = { x: 178, w: 740, y: 820, h: 500, rot: .05 };
  var TOPV = { x: 110, w: 800, y: 452, h: 410 }, BOTV = { x: 110, w: 800, y: 900, h: 410 };
  var RAILY = 1352, RX0 = 196, RX1 = 824;
  var T = {};
  function lbox(a, b, k) { return { x: lerp(a.x, b.x, k), w: lerp(a.w, b.w, k), y: lerp(a.y, b.y, k), h: lerp(a.h, b.h, k), rot: lerp(a.rot || 0, b.rot || 0, k) }; }

  var BG, NOISE;
  function buildBG() {
    var c = mk(W, H), g = c.getContext('2d'), r = mulberry(11);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0f2c31'); gr.addColorStop(.5, '#0b2024'); gr.addColorStop(1, '#071417'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (var i = 0; i < 4; i++) { g.fillStyle = 'rgba(214,255,245,' + (.05 - i * .008).toFixed(3) + ')'; g.fillRect(0, 60 + i * 64, W, 10); }
    var hy = 1440;
    for (var row = 0; row < 14; row++) {
      var y0 = hy + Math.pow(row / 14, 1.6) * (H - hy), y1 = hy + Math.pow((row + 1) / 14, 1.6) * (H - hy);
      for (var col = -12; col < 12; col++) {
        var s0 = .25 + .75 * (y0 - hy) / (H - hy), s1 = .25 + .75 * (y1 - hy) / (H - hy), cx = W / 2, cw = 120;
        if ((row + col) % 2 === 0) continue;
        g.fillStyle = 'rgba(214,255,245,.045)'; g.beginPath();
        g.moveTo(cx + col * cw * s0, y0); g.lineTo(cx + (col + 1) * cw * s0, y0); g.lineTo(cx + (col + 1) * cw * s1, y1); g.lineTo(cx + col * cw * s1, y1); g.closePath(); g.fill();
      }
    }
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 300, 70, 1140); g.fillRect(W - 70, 300, 70, 1140);
    for (var s = 0; s < 8; s++) { g.fillStyle = 'rgba(224,48,58,.10)'; g.fillRect(0, 380 + s * 136, 70, 8); g.fillRect(W - 70, 380 + s * 136, 70, 8); }
    for (var k = 0; k < 5000; k++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.022)' : 'rgba(0,0,0,.06)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    var vg = g.createRadialGradient(510, 860, 300, 510, 860, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }

  /* static snow for the channel switch (seeded, changes every 1/30 s) */
  function snow(g, x, y, w, h, t, a) {
    if (a <= 0) return;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.globalAlpha *= a;
    var o = Math.floor(t * 30) * 53 % 256, p = g.createPattern(NOISE, 'repeat');
    var m = g.getTransform(); g.translate(-o, -o * 1.7); g.fillStyle = p; g.scale(2, 2); g.fillRect((x + o) / 2, (y + o * 1.7) / 2, w / 2 + 2, h / 2 + 2); g.setTransform(m);
    g.restore();
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.globalAlpha *= a * .5;
    var by = y + ((t * 2.4) % 1) * h; g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x, by - 30, w, 60); g.restore();
  }
  function scan(g, x, y, w, h) { g.save(); g.fillStyle = 'rgba(0,0,0,.10)'; for (var yy = y; yy < y + h; yy += 5) g.fillRect(x, yy, w, 2); g.restore(); }
  function disc(g, x, y, r, c) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = c; g.fill(); }

  /* the monitor. box {x,w,y,h,rot}; feed(g, sx, sy, sw, sh) draws the screen; cam = bezel tag; swk = channel-switch snow 0..1 */
  function monitor(g, box, t, feed, cam, swk, o) {
    o = o || {};
    var X = box.x, MW = box.w, y = box.y, h = box.h, sx = X + 18, sw = MW - 36, sy = y + 18, sh = h - 36 - 58;
    g.save();
    if (box.rot) { var cx = X + MW / 2, cy = y + h / 2; g.translate(cx, cy); g.rotate(box.rot); g.translate(-cx, -cy); }
    rr(g, X + 8, y + 12, MW, h, 26); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, X, y, MW, h, 26); g.fillStyle = '#2a2f33'; g.fill();
    rr(g, X + 4, y + 4, MW - 8, 10, 6); g.fillStyle = 'rgba(255,255,255,.08)'; g.fill();
    g.save(); rr(g, sx, sy, sw, sh, 14); g.clip(); g.fillStyle = '#050a0b'; g.fillRect(sx, sy, sw, sh);
    if (feed) feed(g, sx, sy, sw, sh);
    scan(g, sx, sy, sw, sh);
    if (swk > 0) snow(g, sx, sy, sw, sh, t, Math.min(1, swk));
    var vg = g.createRadialGradient(sx + sw / 2, sy + sh / 2, sh * .3, sx + sw / 2, sy + sh / 2, sw * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = vg; g.fillRect(sx, sy, sw, sh);
    if (o.over) o.over(g, sx, sy, sw, sh);
    g.restore();
    var ly = y + h - 38, on = Math.floor(t * 2) % 2 === 0; var lx = Math.max(sx + 22, 112), rx = Math.min(sx + sw, 918); disc(g, lx, ly, 13, on ? RED : '#5a1a1e');
    M2(g, 'REC', lx + 24, ly + 2, 36, { col: CREAM, ls: 2 });
    if (cam && !o.nocam) M2(g, cam, rx, ly + 2, 36, { col: CREAM, align: 'right', ls: 0 });
    if (o.num) { rr(g, X - 12, y - 16, 96, 96, 16); g.fillStyle = RED; g.fill(); T2(g, o.num, X + 36, y + 32, 72, { col: CREAM }); }
    g.restore();
  }

  /* ring on a point of the picture (the annotation): draws in over .25 s */
  function ring(g, x, y, r, k, col) {
    if (k <= 0) return; g.save(); g.strokeStyle = col || RED; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.arc(x, y, r * (1 + .25 * (1 - eo(k))), -Math.PI / 2, -Math.PI / 2 + TAU * eo(k)); g.stroke(); g.restore();
  }
  /* where a tracked point of a use is at t: pts = [[srcSeconds, nx, ny], ...] (read off the clip's frames) */
  function srcAt(u, t) { var l = t - u.t0; if (u.freeze != null) l = Math.min(l, u.freeze); return u.from + l * u.speed; }
  function track(u, t, pts) {
    var s = srcAt(u, t), i = 0; while (i < pts.length - 2 && s > pts[i + 1][0]) i++;
    var a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)], k = b[0] === a[0] ? 0 : clamp((s - a[0]) / (b[0] - a[0]), 0, 1);
    return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  }
  function tagAt(g, s, px, py, tx, ty, k, px2) {
    if (k <= 0) return; var nr = NOREC; NOREC = nr || k < .999;
    g.save(); g.globalAlpha *= clamp(k * 3, 0, 1); g.strokeStyle = CREAM; g.lineWidth = 5;
    g.beginPath(); g.moveTo(px, py); g.lineTo(lerp(px, tx, eo(k)), lerp(py, ty, eo(k))); g.stroke();
    g.translate(tx, ty); g.scale(lerp(1.15, 1, eo(k)), lerp(1.15, 1, eo(k))); chip(g, s, 0, 0, px2 || 46, RED, CREAM, { rot: -.02 }); g.restore(); NOREC = nr;
  }

  /* ---------- the footage feeds (credit sits bottom-left, clear of the annotations) ---------- */
  function feedUse(u, t, o) {
    o = o || {};
    return function (g, x, y, w, h) {
      var tt = Math.min(t, u.t1 - 1e-3);
      g.save(); g.filter = 'brightness(' + (o.bright || 1.05) + ') contrast(1.05) saturate(1.05)'; CLIP.draw(g, tt, x, y, w, h, u); g.restore();
      if (o.after) o.after(g, x, y, w, h, tt);
      if (!o.nocredit) CLIP.credit(g, u, Math.max(x + 22, 112), y + h - 22, '700 30px "Geist Mono", monospace');
    };
  }
  /* bandana centre, 0..1 of the source frame, read off the frames every 0.17-0.2 s */
  var BAND_TEND = [[.4, .51, .31], [.6, .52, .33], [.8, .51, .36], [1.0, .475, .37], [1.2, .445, .47], [1.4, .41, .50], [1.6, .40, .43], [1.84, .40, .40]];
  var BAND_AISLE = [[0, .40, .37], [.17, .39, .31], [.33, .36, .28], [.5, .36, .38], [.67, .35, .30], [.83, .35, .30], [1.0, .35, .40], [1.17, .34, .34], [1.33, .34, .39], [1.5, .34, .39]];
  var SIGN_AISLE = [[1.0, .13, .05], [1.17, .155, .1], [1.33, .17, .2], [1.4, .21, .28], [1.5, .22, .3]];
  var SIGN_SAME = [[.5, .14, .04], [.67, .12, .08], [.83, .17, .25], [1.0, .17, .3], [1.17, .18, .3], [1.33, .19, .32], [1.45, .19, .32]];
  var BAND_SAME = [[0, .375, .44], [.17, .35, .33], [.33, .35, .33], [.5, .34, .42], [.67, .34, .31], [.83, .34, .44], [1.0, .35, .44], [1.17, .34, .33], [1.33, .33, .42], [1.45, .33, .42]];
  function bandRing(u, t, pts, r, k, tag) {
    return function (gg, x, y, w, h, tt) {
      var p = track(u, tt, pts), q = CLIP.toScreen(u, tt, p[0], p[1], x, y, w, h);
      ring(gg, q[0], q[1], r, k);
      if (tag) tag(gg, q, x, y, w, h);
    };
  }

  /* ---------- frame 0 / seam: the hook title ---------- */
  function hookTitle(g, t, k) {
    if (k <= 0) return;
    var nr = NOREC; NOREC = nr || k < .999; var dy = -460 * (1 - k);
    g.save(); g.translate(0, dy);
    chip(g, 'GTA 6', CX, 150, 60, PINK, CREAM, { rot: -.03 });
    T2(g, 'TRAILER 1', CX, 268, 156, { col: CREAM, st: 'condensed' });
    var tw0 = tw('ENDED ON THIS', 112, 'condensed', 900) + 60, ty = 398;
    g.save(); g.translate(CX, ty); g.rotate(-.02); rr(g, -tw0 / 2 + 6, -64 + 8, tw0, 128, 10); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill(); rr(g, -tw0 / 2, -64, tw0, 128, 10); g.fillStyle = RED; g.fill(); g.restore();
    T2(g, 'ENDED ON THIS', CX, ty, 112, { col: CREAM });
    g.restore(); NOREC = nr;
  }
  /* the down arrow: points at the robbers' heads, bobbing, from frame 0 */
  function arrowAt(g, t, x, y, a) {
    if (a <= 0) return; var b = 10 * Math.sin(t * 9);
    g.save(); g.globalAlpha *= a; g.fillStyle = SUN; g.strokeStyle = INK; g.lineWidth = 5; g.translate(x, y - 40 + b);
    g.beginPath(); g.moveTo(-18, -60); g.lineTo(18, -60); g.lineTo(18, -20); g.lineTo(40, -20); g.lineTo(0, 22); g.lineTo(-40, -20); g.lineTo(-18, -20); g.closePath(); g.stroke(); g.fill(); g.restore();
  }

  /* ---------- the timeline rail (2023 ... 2026); hidden on frame 0 and on the loop frame ---------- */
  function rail(g, t) {
    var a = seg(t, T.aisleOut, T.aisleOut + .3) * (1 - seg(t, T.seamIn - .15, T.seamIn + .1)); if (a <= 0) return;
    var fill = eio(seg(t, T.augW - .1, T.augW + .6)), right = t >= T.augW + .5;
    g.save(); g.globalAlpha *= a;
    g.strokeStyle = 'rgba(251,243,228,.35)'; g.lineWidth = 8; g.setLineDash([16, 14]); g.beginPath(); g.moveTo(RX0, RAILY); g.lineTo(RX1, RAILY); g.stroke(); g.setLineDash([]);
    if (fill > 0) { g.strokeStyle = RED; g.lineWidth = 10; g.beginPath(); g.moveTo(RX0, RAILY); g.lineTo(lerp(RX0, RX1, fill), RAILY); g.stroke(); }
    if (t > T.dipIn && fill <= 0) { var c = (t - T.dipIn) * .2; disc(g, lerp(RX0, RX1, clamp(c, 0, .5)), RAILY, 10, CREAM); }
    var p0 = kn(t, T.dec, .25), p1 = kn(t, T.augW + .5, .25);
    g.save(); g.translate(RX0, RAILY); g.scale(p0, p0); disc(g, 0, 0, 22, CREAM); disc(g, 0, 0, 12, t >= T.dec ? RED : '#5a1a1e'); g.restore();
    g.save(); g.translate(RX1, RAILY); g.scale(p1, p1); disc(g, 0, 0, 22, right ? CREAM : 'rgba(251,243,228,.35)'); if (right) disc(g, 0, 0, 12, RED); g.restore();
    T2(g, '2023', RX0, RAILY + 56, 42, { col: CREAM });
    T2(g, '2026', RX1, RAILY + 56, 42, { col: right ? CREAM : 'rgba(251,243,228,.45)' });
    g.restore();
  }

  /* ---------- our own boards inside a monitor ---------- */
  /* the date: a rewinding tape, the year rolls back 2026 -> 2023, then DEC 4, 2023 slams on "December" */
  function dateBoard(t) {
    return function (gg, x, y, w, h) {
      gg.fillStyle = '#0a1a24'; gg.fillRect(x, y, w, h);
      for (var i = 0; i < 7; i++) { var yy = y + ((t * 1.9 + i / 7) % 1) * h; gg.fillStyle = 'rgba(214,255,245,.08)'; gg.fillRect(x, yy, w, 12 + 6 * (i % 3)); }
      var cx = x + w / 2, cy = y + h / 2;
      if (Math.floor(t * 4) % 2 === 0 || t >= T.dec) M2(gg, '<< REWIND', x + 34, y + 60, 40, { col: CREAM });
      if (t < T.dec) {
        var k = eio(seg(t, T.dateIn, T.dec - .05)), yr = 2026 - k * 3, n = Math.floor(yr + 1e-6), fr = yr - n;
        gg.save(); gg.beginPath(); gg.rect(x, cy - 130, w, 260); gg.clip();
        T2(gg, String(n), cx, cy + fr * 220, 220, { col: CREAM });
        if (fr > 0) T2(gg, String(n + 1), cx, cy + fr * 220 - 220, 220, { col: CREAM });
        gg.restore();
      } else {
        var k2 = eo(seg(t, T.dec, T.dec + .18)), s = lerp(1.35, 1, k2) * kn(t, T.dec + .18, .05), nr = NOREC; NOREC = nr || k2 < .999;
        gg.save(); gg.translate(cx, cy - 20); gg.rotate(-.03); gg.scale(s, s); gg.globalAlpha *= seg(t, T.dec, T.dec + .06);
        rr(gg, -320, -104, 640, 208, 14); gg.fillStyle = CREAM; gg.fill(); T2(gg, 'DEC 4, 2023', 0, -2, 130, { col: INK }); gg.restore(); NOREC = nr;
        T2(gg, 'TRAILER 1', cx, cy + 150, 64, { col: SUN, a: seg(t, T.dec + .2, T.dec + .4) });
      }
    };
  }
  function dipBoard(t) {
    return function (gg, x, y, w, h) {
      gg.fillStyle = 'rgba(5,10,11,.55)'; gg.fillRect(x, y, w, h);
      var cx = x + w / 2, cy = y + h / 2, q = kn(t, T.dipIn, .12);
      rr(gg, cx - 190, y + 34, 380, 96, 10); gg.fillStyle = CREAM; gg.fill(); T2(gg, 'DEC 4, 2023', cx, y + 82, 60, { col: INK }); T2(gg, 'TRAILER 1', cx, y + 166, 48, { col: SUN });
      gg.save(); gg.translate(cx, cy + 90 + 6 * Math.sin(t * 6)); gg.scale(q, q); T2(gg, '?', 0, 0, 230, { col: CREAM, a: .9 }); gg.restore();
    };
  }
  /* the Extended Look's HUD, pushed in 2.5x onto the top-right corner, then framed */
  function hudFeed(u, t) {
    return function (gg, x, y, w, h) {
      var tt = Math.min(t, u.t1 - 1e-3), z = lerp(1, 3.0, eio(seg(t, T.hudIn + .2, T.hudW - .05))), px = x + w, py = y;
      gg.save(); gg.beginPath(); gg.rect(x, y, w, h); gg.clip();
      gg.translate(px, py); gg.scale(z, z); gg.translate(-px, -py);
      gg.filter = 'brightness(1.0) contrast(1.08) saturate(1.05)'; CLIP.draw(gg, tt, x, y, w, h, u); gg.restore();
      function S(nx, ny) { var p = CLIP.toScreen(u, tt, nx, ny, x, y, w, h); return [px + (p[0] - px) * z, py + (p[1] - py) * z]; }
      var a = S(.855, .012), b = S(.993, .185), k = seg(t, T.hudW - .1, T.hudW + .15);
      if (k > 0) {
        var x0 = Math.max(a[0], x + 10), y0 = Math.max(a[1], y + 10), x1 = Math.min(b[0], x + w - 10), y1 = Math.min(b[1], y + h - 10), sc = lerp(1.12, 1, eo(k));
        gg.save(); gg.globalAlpha *= clamp(k * 3, 0, 1); gg.translate((x0 + x1) / 2, (y0 + y1) / 2); gg.scale(sc, sc); gg.strokeStyle = SUN; gg.lineWidth = 9;
        rr(gg, -(x1 - x0) / 2, -(y1 - y0) / 2, x1 - x0, y1 - y0, 18); gg.stroke(); gg.restore();
      }
      if (t >= T.hudTag) tagAt(gg, 'HUD', x + w * .5, y + h * .6, x + 150, y + h * .78, seg(t, T.hudTag, T.hudTag + .25), 60);
      CLIP.credit(gg, u, x + 22, y + h - 22, '700 30px "Geist Mono", monospace');
    };
  }

  /* ---------- the HUD, redrawn big (our drawing; no monitor) ---------- */
  function star(g, x, y, R, r) { g.beginPath(); for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr0 = i % 2 ? r : R; g.lineTo(x + Math.cos(a) * rr0, y + Math.sin(a) * rr0); } g.closePath(); }
  function pistol(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = '#8796ad'; g.strokeStyle = '#0d1417'; g.lineWidth = 4; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(0, 8); g.lineTo(6, 0); g.lineTo(192, 0); g.lineTo(198, 10); g.lineTo(198, 40); g.lineTo(188, 48); g.lineTo(190, 58);
    g.lineTo(202, 128); g.lineTo(196, 138); g.lineTo(150, 142); g.lineTo(143, 132); g.lineTo(132, 74); g.lineTo(114, 74);
    g.quadraticCurveTo(104, 104, 80, 86); g.lineTo(78, 58); g.lineTo(10, 58); g.lineTo(3, 48); g.lineTo(0, 40); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#0d1417'; g.beginPath(); g.moveTo(92, 62); g.quadraticCurveTo(98, 84, 112, 66); g.closePath(); g.fill();
    for (var i = 0; i < 6; i++) g.fillRect(150 + i * 7, 8, 3, 26);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(10, 4, 176, 6);
    g.fillStyle = '#5b6a80'; g.fillRect(4, 44, 74, 8);
    g.restore();
  }
  /* five icon discs, as on the Extended Look's HUD (we don't say what they mean) */
  function icon(g, x, y, r, n) {
    disc(g, x, y, r, '#8e1b24'); g.save(); g.strokeStyle = '#11181b'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
    g.fillStyle = CREAM; g.strokeStyle = CREAM; g.lineWidth = 5; g.translate(x, y);
    if (n === 0) { g.fillRect(-20, -10, 30, 20); g.beginPath(); g.moveTo(10, -6); g.lineTo(24, -14); g.lineTo(24, 14); g.lineTo(10, 6); g.fill(); }
    else if (n === 1) { disc(g, -9, -2, 12, CREAM); disc(g, 11, 4, 12, CREAM); }
    else if (n === 2) { g.beginPath(); g.moveTo(0, -18); g.lineTo(0, -8); g.lineTo(-24, 12); g.lineTo(24, 12); g.lineTo(0, -8); g.stroke(); }
    else if (n === 3) { disc(g, 0, -9, 11, CREAM); g.beginPath(); g.arc(0, 20, 18, Math.PI, TAU); g.fill(); }
    else { g.fillRect(-20, -12, 38, 12); g.fillRect(4, -2, 12, 20); }
    g.restore();
  }
  function hudPanel(g, t) {
    var k = eo(seg(t, T.hudOff - .05, T.hudOff + .2)), ko = eio(seg(t, T.capIn - .2, T.capIn + .05)); if (k <= 0 || ko >= 1) return;
    var nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    g.save(); g.globalAlpha *= 1 - ko; g.translate(CX, 900); g.scale(lerp(1.25, 1, k), lerp(1.25, 1, k)); g.translate(-CX, -900); g.globalAlpha *= clamp(k * 2, 0, 1);
    var x0 = 110, x1 = 910, y0 = 500, y1 = 1300;
    rr(g, x0 + 8, y0 + 12, x1 - x0, y1 - y0, 24); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, x0, y0, x1 - x0, y1 - y0, 24); g.fillStyle = 'rgba(10,16,19,.88)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 3; g.stroke();
    T2(g, 'HUD', x1 - 40, y0 + 56, 56, { col: SUN, align: 'right' });
    /* six stars: four filled, two outline (as at 709 s); one tick per filled star */
    g.save(); g.globalAlpha *= .22; for (var si = 0; si < 6; si++) { star(g, 190 + si * 128, 660, 55, 24); g.strokeStyle = '#cfcfcf'; g.lineWidth = 4; g.stroke(); }
    for (var di = 0; di < 5; di++) { g.beginPath(); g.arc(168 + di * 116, 870, 46, 0, TAU); g.strokeStyle = '#e06a72'; g.lineWidth = 4; g.stroke(); } g.restore();
    for (var i = 0; i < 6; i++) {
      var s0 = T.tk[i], ks = eo(seg(t, s0, s0 + .14)); if (ks <= 0) continue;
      var nrs = NOREC; NOREC = true; g.save(); g.translate(190 + i * 128, 660); var sc = ks * kn(t, s0 + .14, .14); g.scale(sc, sc);
      star(g, 0, 0, 55, 24);
      if (i < 4) { g.fillStyle = '#cfcfcf'; g.fill(); g.strokeStyle = '#11181b'; g.lineWidth = 5; g.stroke(); }
      else { g.fillStyle = '#2b3237'; g.fill(); g.strokeStyle = '#cdd1d6'; g.lineWidth = 6; g.stroke(); }
      g.restore(); NOREC = nrs;
    }
    T2(g, 'WANTED STARS', 150, 760, 50, { col: CREAM, align: 'left', a: seg(t, T.tk[3], T.tk[3] + .12) });
    for (var j = 0; j < 5; j++) {
      var s1 = T.iconsW + j * .04, ki = eo(seg(t, s1, s1 + .16)); if (ki <= 0) continue;
      var nri = NOREC; NOREC = true; g.save(); g.translate(168 + j * 116, 870); g.scale(ki, ki); icon(g, 0, 0, 46, j); g.restore(); NOREC = nri;
    }
    T2(g, '5 ICONS', 870, 870, 46, { col: CREAM, align: 'right', a: seg(t, T.iconsW + .15, T.iconsW + .27) });
    var ka = eo(seg(t, T.ammoW, T.ammoW + .2));
    if (ka > 0) {
      var nra = NOREC; NOREC = nra || ka < .999; g.save(); g.translate(500, 1050); g.scale(lerp(1.3, 1, ka), lerp(1.3, 1, ka));
      M2(g, '20 73', 120, 0, 140, { col: CREAM, align: 'right', ls: 6, wt: 700 });
      pistol(g, 160, -62, .95);
      g.restore(); NOREC = nra;
      T2(g, 'AMMO', 150, 1160, 50, { col: CREAM, align: 'left', a: seg(t, T.ammoW + .05, T.ammoW + .17) });
    }
    chip(g, 'RE-DRAWN', 760, 1232, 44, SUN, INK, { rot: -.02 });
    g.restore(); NOREC = nr;
  }

  /* ---------- Rockstar's own sentence: a low card over a bright plate ---------- */
  function quoteCard(g, t) {
    var k = eo(seg(t, T.capIn, T.capIn + .3)), ko = eio(seg(t, T.capOut - .25, T.capOut)); if (k <= 0 || ko >= 1) return;
    var nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    g.save(); g.translate(0, 900 * ko + (1 - k) * 200); g.globalAlpha *= k;
    var y0 = 820, hh = 510;
    g.save(); g.translate(CX, y0 + hh / 2); g.rotate(-.015); g.translate(-CX, -(y0 + hh / 2));
    rr(g, 120, y0 + 14, 800, hh, 20); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, 110, y0, 800, hh, 20); g.fillStyle = CREAM; g.fill();
    g.fillStyle = RED; g.fillRect(110, y0, 800, 22);
    var w1 = eo(seg(t, T.capIn + .08, T.capIn + .26)), w2 = eo(seg(t, T.capIn + .2, T.capIn + .38));
    T2(g, 'AN EXTENDED LOOK', CX, y0 + 86, 64, { col: RED });
    g.save(); g.translate(CX, y0 + 216); g.scale(lerp(1.3, 1, w1), lerp(1.3, 1, w1)); T2(g, '“IN-GAME', 0, 0, 136, { col: INK, a: w1 * 3 }); g.restore();
    g.save(); g.translate(CX, y0 + 346); g.scale(lerp(1.3, 1, w2), lerp(1.3, 1, w2)); T2(g, 'FOOTAGE”', 0, 0, 136, { col: INK, a: w2 * 3 }); g.restore();
    M2(g, 'ROCKSTAR · AUG 27 2026', CX, y0 + 456, 36, { col: '#5a4e48', align: 'center', ls: 0 });
    g.restore();
    g.restore(); NOREC = nr;
  }

  /* ---------- the vote (end): two monitors, footage thumbnails on "which", kept to the loop ---------- */
  function voteTile(g, box, t, u, num, label) {
    var on = t >= T.voteThumb;
    var feed = on ? feedUse(u, t, { nocredit: true }) : function (gg, x, y, w, h) { gg.fillStyle = num === '1' ? '#3a1216' : '#0f3a3a'; gg.fillRect(x, y, w, h); T2(gg, label, x + w / 2, y + h / 2, 72, { col: CREAM, a: .85 }); };
    var sw = on ? 1 - seg(t, T.voteThumb, T.voteThumb + .2) : .35;
    monitor(g, box, t, feed, label, sw, { num: num });
  }

  /* =====================================================================================================
     PROPS by time
     ===================================================================================================== */
  function mainMonitor(g, t) {
    if (t < T.sameIn + .15) {
      var box = t < T.aisleOut - .05 ? HERO : t < T.dipIn - .1 ? lbox(HERO, BIG, eio(seg(t, T.aisleOut - .05, T.aisleOut + .2))) : lbox(BIG, MID, eio(seg(t, T.dipIn - .1, T.dipIn + .2)));
      var feed, cam, sw = 0, over = null;
      if (t < T.punchIn) {
        var uA = U.tendA;
        feed = feedUse(uA, t, { after: function (gg, x, y, w, h, tt) {
          var p = track(uA, tt, BAND_TEND), q = CLIP.toScreen(uA, tt, p[0], p[1], x, y, w, h);
          ring(gg, q[0], q[1], 76, seg(t, T.ringA, T.ringA + .25));
        } });
        cam = 'CAM 1 · DEC 04 2023';
      } else if (t < T.aisleIn) {
        var uB = U.tendB;
        feed = feedUse(uB, t, { after: function (gg, x, y, w, h, tt) {
          var p = track(uB, tt, BAND_TEND), q = CLIP.toScreen(uB, tt, p[0], p[1], x, y, w, h);
          ring(gg, q[0], q[1], 92, 1);
          tagAt(gg, 'RED BANDANA', q[0] + 60, q[1] + 50, Math.min(x + w - 190, 760), y + h - 205, seg(t, T.bandW, T.bandW + .25), 48);
        } });
        cam = 'CAM 1 · DEC 04 2023'; sw = bump(t, T.punchIn - .04, .14);
      } else if (t < T.aisleOut) {
        var uC = U.aisle1;
        feed = feedUse(uC, t, { after: function (gg, x, y, w, h, tt) {
          var p = track(uC, tt, BAND_AISLE), q = CLIP.toScreen(uC, tt, p[0], p[1], x, y, w, h);
          ring(gg, q[0], q[1], 140, seg(t, T.aisleIn, T.aisleIn + .2));
          tagAt(gg, 'RED BANDANA', q[0] + 70, q[1] + 60, Math.min(x + w - 190, 760), y + h - 205, 1, 48);
        } });
        cam = 'CAM 1 · DEC 04 2023'; sw = bump(t, T.aisleIn - .05, .16);
      } else if (t < T.dipIn) {
        feed = dateBoard(t); cam = 'TAPE · 2023'; sw = 1 - seg(t, T.aisleOut, T.aisleOut + .22);
      } else if (t < T.elIn) {
        feed = dipBoard(t); cam = 'CAM ?'; sw = bump(t, T.dipIn - .15, .3);
      } else if (t < T.elOff) {
        feed = feedUse(U.el, t, {}); cam = 'CAM 2 · AUG 27 2026'; sw = 1 - seg(t, T.elIn, T.elIn + .25);
      } else {
        feed = null; cam = 'CAM 1 + 2'; sw = .9 + .1 * Math.sin(t * 40);
      }
      var drop = eio(seg(t, T.sameIn - .15, T.sameIn + .15));
      g.save(); g.translate(0, 1300 * drop); monitor(g, box, t, feed, cam, sw, { nocam: t < 1.0 }); g.restore();
    }
    if (t >= T.seamIn) {
      var ks = eo(seg(t, T.seamIn, T.seamIn + .3)), nrs = NOREC; NOREC = nrs || ks < .999;
      g.save(); g.translate(0, 1300 * (1 - ks)); monitor(g, HERO, t, feedUse(U.seam, t, {}), 'CAM 1 · DEC 04 2023', 0, { nocam: true }); g.restore();
      NOREC = nrs;
    }
  }
  function props(g, t) {
    if (t < T.sameIn + .15) {
      /* A STORE HOLDUP: a sticker on the monitor from 0.95 s */
      var kc = eo(seg(t, .95, 1.2)) * (1 - seg(t, T.aisleOut - .1, T.aisleOut + .1));
      if (kc > 0) { var nr = NOREC; NOREC = nr || kc < .999; g.save(); g.globalAlpha *= kc; g.translate(330, 1225 + (1 - kc) * 30); chip(g, 'A STORE HOLDUP', 0, 0, 58, SUN, INK, { rot: -.035 }); g.restore(); NOREC = nr; }
      /* the two options, popping on their words */
      if (t >= T.dipTrailer && t < T.elIn + .1) { var k1 = eo(seg(t, T.dipTrailer, T.dipTrailer + .18)), nr1 = NOREC; NOREC = nr1 || k1 < .999; g.save(); g.translate(300, 1282); g.scale(k1, k1); chip(g, 'TRAILER ONLY?', 0, 0, 52, CREAM, INK, { rot: -.04 }); g.restore(); NOREC = nr1; }
      if (t >= T.dipGame && t < T.elIn + .1) { var k2 = eo(seg(t, T.dipGame, T.dipGame + .18)), nr2 = NOREC; NOREC = nr2 || k2 < .999; g.save(); g.translate(735, 1282); g.scale(k2, k2); chip(g, 'IN-GAME?', 0, 0, 52, RED, CREAM, { rot: .04 }); g.restore(); NOREC = nr2; }
      if (t >= T.augW && t < T.sameIn) { var ka = eo(seg(t, T.augW, T.augW + .2)), nra = NOREC; NOREC = nra || ka < .999; g.save(); g.translate(CX, 1282); g.scale(lerp(1.3, 1, ka), lerp(1.3, 1, ka)); chip(g, 'EXTENDED LOOK', 0, 0, 58, SUN, INK, { rot: -.015 }); g.restore(); NOREC = nra; }
      if (t >= T.elIn + .05 && t < T.sameIn) { var ks2 = eo(seg(t, T.elIn + .05, T.elIn + .25)), nrk = NOREC; NOREC = nrk || ks2 < .999; g.save(); g.globalAlpha *= ks2; g.translate(CX, 556); var sw2 = 380; rr(g, -sw2 / 2, -30, sw2, 60, 8); g.fillStyle = INK; g.fill(); g.strokeStyle = SUN; g.lineWidth = 3; g.stroke(); M2(g, '26 MIN · IN-GAME', 0, 2, 36, { col: SUN, align: 'center', ls: 0 }); g.restore(); NOREC = nrk; }
    }
    if (t < T.seamIn) hookTitle(g, t, 1 - eio(seg(t, T.titleOut, T.titleOut + .3)));
    /* 2. the match: two tilted monitors, offset, 2023 over 2026, bandana ringed in both */
    if (t >= T.sameIn - .15 && t < T.sameOut + .3) {
      var kin = eo(seg(t, T.sameIn - .15, T.sameIn + .2)), kout = eio(seg(t, T.sameOut, T.sameOut + .3));
      var ra = bandRing(U.aisle2, t, BAND_AISLE, 64, seg(t, T.bandW2, T.bandW2 + .25)), rb = bandRing(U.same, t, BAND_SAME, 64, seg(t, T.bandW2 + .08, T.bandW2 + .33));
      var sga = bandRing(U.aisle2, t, SIGN_AISLE, 0, 0, function (gg, q) { ring(gg, q[0], q[1], 78, seg(t, T.signW, T.signW + .25), SUN); });
      var sgb = bandRing(U.same, t, SIGN_SAME, 0, 0, function (gg, q) { ring(gg, q[0], q[1], 78, seg(t, T.signW + .08, T.signW + .33), SUN); });
      var fa = feedUse(U.aisle2, t, { after: function (gg, x, y, w, h, tt) { ra(gg, x, y, w, h, tt); sga(gg, x, y, w, h, tt); } });
      var fb = feedUse(U.same, t, { after: function (gg, x, y, w, h, tt) { rb(gg, x, y, w, h, tt); sgb(gg, x, y, w, h, tt); } });
      var nrS = NOREC; NOREC = nrS || kin < .999 || kout > 0;
      g.save(); g.translate(-1000 * (1 - kin) - 1000 * kout, 0); monitor(g, TOPM, t, fa, 'CAM 1 · DEC 04 2023', 0); g.restore();
      g.save(); g.translate(1000 * (1 - kin) + 1000 * kout, 0); monitor(g, BOTM, t, fb, 'CAM 2 · AUG 27 2026', 0); g.restore();
      NOREC = nrS;
    }
    if (t >= T.sameChip && t < T.hudIn + .1) {
      var kk = eo(seg(t, T.sameChip, T.sameChip + .2)), kf = seg(t, T.hudIn - .1, T.hudIn + .1), nrc = NOREC; NOREC = nrc || kk < .999 || kf > 0;
      g.save(); g.globalAlpha *= 1 - kf; g.translate(650, 842); g.rotate(-.03); g.scale(lerp(1.4, 1, kk), lerp(1.4, 1, kk)); chip(g, 'SAME BANDANA', 0, 0, 56, RED, CREAM); g.restore(); NOREC = nrc;
    }
    if (t >= T.signW && t < T.hudIn + .3) {
      var kg = eo(seg(t, T.signW, T.signW + .2)), kgf = seg(t, T.hudIn + .15, T.hudIn + .3), nrg = NOREC; NOREC = nrg || kg < .999 || kgf > 0;
      g.save(); g.globalAlpha *= 1 - kgf; g.translate(240, 842); g.rotate(.03); g.scale(lerp(1.4, 1, kg), lerp(1.4, 1, kg)); chip(g, 'SAME SIGN', 0, 0, 52, SUN, INK); g.restore(); NOREC = nrg;
    }
    /* 3. the HUD: the real footage, pushed in 2.5x onto its top-right corner */
    if (t >= T.hudIn - .1 && t < T.hudOff + .2) {
      var ki5 = eo(seg(t, T.hudIn - .1, T.hudIn + .2)), ko5 = seg(t, T.hudOff - .05, T.hudOff + .2), nr5 = NOREC; NOREC = nr5 || ko5 > 0;
      g.save(); g.globalAlpha *= 1 - ko5; g.translate(0, 1300 * (1 - ki5)); monitor(g, BIG, t, hudFeed(U.hud, t), 'CAM 2 · AUG 27 2026', 1 - seg(t, T.hudIn, T.hudIn + .2)); g.restore(); NOREC = nr5;
    }
    hudPanel(g, t);
    /* 4. Rockstar's own sentence */
    quoteCard(g, t);
    /* 5. the vote, then the seam back to frame 0 */
    if (t >= T.voteIn - .05 && t < T.seamIn + .3) {
      var kv = eo(seg(t, T.voteIn - .05, T.voteIn + .25)), kvo = eio(seg(t, T.seamIn - .05, T.seamIn + .25)), nrv = NOREC; NOREC = nrv || kv < .999 || kvo > 0;
      g.save(); g.translate(-1000 * (1 - kv), -1300 * kvo); voteTile(g, TOPV, t, U.v1, '1', 'TRAILER 1'); g.restore();
      g.save(); g.translate(1000 * (1 - kv), 1300 * kvo); voteTile(g, BOTV, t, U.v2, '2', 'EXTENDED LOOK'); g.restore();
      NOREC = nrv;
    }
    if (t >= T.seamIn) hookTitle(g, t, eo(seg(t, T.seamIn, T.seamIn + .3)));
    rail(g, t);
  }

  /* vote header in the caption zone (the end line has no caption) */
  function voteHeader(g, t) {
    if (t < T.voteIn || t >= T.seamIn + .05) return;
    var k = eo(seg(t, T.voteIn, T.voteIn + .25)), ko = seg(t, T.seamIn - .15, T.seamIn + .05), nr = NOREC; NOREC = nr || k < .999 || ko > 0;
    g.save(); g.globalAlpha *= k * (1 - ko); g.translate(CX, 300 + (1 - k) * -40); g.rotate(-.02);
    var w0 = tw('1 OR 2?', 130) + 70; rr(g, -w0 / 2, -82, w0, 164, 12); g.fillStyle = CREAM; g.fill();
    T2(g, '1 OR 2?', 0, 0, 130, { col: INK }); g.restore(); NOREC = nr;
  }
  /* poster: the frame-0 promise on the match frame */
  function posterTitle(g) {
    chip(g, 'GTA 6', CX, 66, 50, PINK, CREAM, { rot: -.03 });
    T2(g, 'TRAILER 1', CX, 166, 112, { col: CREAM });
    var tw0 = tw('ENDED ON THIS', 80, 'condensed', 900) + 50; g.save(); g.translate(CX, 272); g.rotate(-.02); rr(g, -tw0 / 2, -48, tw0, 96, 10); g.fillStyle = RED; g.fill(); g.restore();
    T2(g, 'ENDED ON THIS', CX, 272, 80, { col: CREAM });
  }
  /* =====================================================================================================
     CAPTIONS: cream tape in the upper third, phrase by phrase, line breaks at phrase boundaries
     (the hook and "A holdup." are the frame-0 board and the A STORE HOLDUP sticker)
     ===================================================================================================== */
  var BREAK = { t1: ['up,'], date: ['was'], el: ['august,', 'look'], hud: ['time,'], stars: ['stars'], cap: ['says', 'video'] };
  var CAPS = (function () {
    var outc = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook' || l.id === 'end') return;
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]["”]?$/.test(w.w) && i < ws.length - 1) { cur.id = l.id; outc.push(cur); cur = []; } });
      if (cur.length) { cur.id = l.id; outc.push(cur); }
    });
    outc = outc.filter(function (ws) { return !(ws.id === 't1' && norm(ws[0].w) === 'a'); });
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
    var nx = CAPS[ci + 1], ns = nx ? nx.s : T.voteIn, nd = T.voteIn - .1;
    var end = Math.min(c0.t1 + .55, ns, nd - .15);
    if (t >= end) return;
    var k = cd(t, c0.s, 16), ko = 1 - seg(t, end - .06, end);
    g.save(); g.globalAlpha *= ko; cond(g, 'condensed'); var cpx = 72; font(g, cpx, 900); ls(g, 1); g.textBaseline = 'alphabetic';
    var words = c0.words, up = words.map(function (w) { return w.w.toUpperCase(); }), ws, gap, lines, lw, maxw = 780, br = BREAK[c0.id] || [];
    function meas() { ws = up.map(function (u) { return g.measureText(u).width; }); gap = cpx * .26; }
    function lay() {
      lines = [[]];
      words.forEach(function (w, i) { lines[lines.length - 1].push(i); if (br.indexOf(w.w.toLowerCase()) >= 0 && i < words.length - 1) lines.push([]); });
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    meas(); lay();
    while (Math.max.apply(null, lw) - gap > maxw && cpx > 52) { cpx -= 4; font(g, cpx, 900); meas(); lay(); }
    var cy0 = t >= T.sameIn - .1 && t < T.sameOut + .2 ? 268 : CAPY, lh = cpx * 1.3, y0 = cy0 - (lines.length - 1) * lh / 2 + cpx * .36;
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
  function railClip(g) { g.beginPath(); if (LIVE2.clip) g.rect(BX0, 0, BX1 - BX0, BY1 + 20); else g.rect(-500, -500, 2080, BY1 + 520); g.clip(); }
  function plateLayer(g, t) {
    var u = CLIP.activePlate(t); if (!u) return;
    var k = seg(t, u.t0, u.t0 + .25) * (1 - seg(t, u.t1 - .25, u.t1));
    var bright = u.clip === 'pcar';
    g.save(); g.globalAlpha = k; CLIP.plate(g, t, 0, 0, W, H, bright ? { dim: .36, blur: 1 } : { dim: .55, blur: 3 }); g.restore();
  }
  function push(t) { if (t < 1.2) return 1 + .025 * (1 - eio(seg(t, 0, 1.2))); if (t >= T.seamIn) return 1 + .025 * eio(seg(t, T.seamIn, DUR)); return 1; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    if (LIVE2.bg) { g.drawImage(BG, 0, 0); plateLayer(g, t); }
    var ddx = 3 * osc(t, 13, .3), ddy = 3 * osc(t, 11, 2.1), ps = push(t);
    g.save(); g.translate(510 + ddx, 900 + ddy); g.scale(ps, ps); g.translate(-510, -900); mainMonitor(g, t); g.restore();
    g.save(); railClip(g); g.translate(510 + ddx, 900 + ddy); g.scale(ps, ps); g.translate(-510, -900);
    props(g, t); g.restore();
    if (!POSTERMODE && LIVE.text) { captions(g, t); }
    if (POSTERMODE) posterTitle(g);
    voteHeader(g, t);
    if (LIVE.grain && NOISE && LIVE2.bg) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  function TEXTS(t) {
    var o = [];
    function Tx(id, text, a, b) { if (t >= a && t < b) o.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    Tx('title', 'TRAILER 1 ENDED ON THIS', 0, T.titleOut + .1); Tx('title', 'TRAILER 1 ENDED ON THIS', T.seamIn + .2, DUR + 1);
    Tx('gta6', 'GTA 6', 0, T.titleOut + .1); Tx('gta6', 'GTA 6', T.seamIn + .2, DUR + 1);
    Tx('hold', 'A STORE HOLDUP', 1.1, T.aisleOut - .1);
    Tx('cam1', 'CAM 1 · DEC 04 2023', 1.0, T.aisleOut); Tx('cam1', 'CAM 1 · DEC 04 2023', T.sameIn + .2, T.sameOut);
    Tx('band', 'RED BANDANA', T.bandW + .1, T.aisleOut);
    Tx('dec', 'DEC 4, 2023', T.dec + .12, T.elIn);
    Tx('dtr', 'TRAILER 1', T.dec + .3, T.elIn); Tx('dtr', 'TRAILER 1', T.voteIn + .25, T.seamIn);
    Tx('opt1', 'TRAILER ONLY?', T.dipTrailer + .08, T.elIn);
    Tx('opt2', 'IN-GAME?', T.dipGame + .05, T.elIn);
    Tx('cam2', 'CAM 2 · AUG 27 2026', T.elIn + .2, T.elOff); Tx('cam2', 'CAM 2 · AUG 27 2026', T.sameIn + .2, T.sameOut); Tx('cam2', 'CAM 2 · AUG 27 2026', T.hudIn + .2, T.hudOff);
    Tx('el', 'EXTENDED LOOK', T.augW + .12, T.sameIn); Tx('elsub', '26 MIN · IN-GAME', T.elIn + .15, T.sameIn); Tx('el', 'EXTENDED LOOK', T.voteIn + .25, T.seamIn);
    Tx('sameb', 'SAME BANDANA', T.sameChip + .12, T.hudIn); Tx('samesign', 'SAME SIGN', T.signW + .12, T.hudIn + .25);
    Tx('hud', 'HUD', T.hudTag + .15, T.hudOff); Tx('hud', 'HUD', T.hudOff + .1, T.capIn);
    Tx('stars', 'WANTED STARS', T.tk[3] + .08, T.capIn);
    Tx('icons', '5 ICONS', T.iconsW + .2, T.capIn);
    Tx('ammo', 'AMMO', T.ammoW + .1, T.capIn);
    Tx('redraw', 'RE-DRAWN', T.hudOff + .08, T.capIn);
    Tx('qel', 'AN EXTENDED LOOK', T.capIn + .15, T.capOut - .1);
    Tx('quote', '“IN-GAME FOOTAGE”', T.capIn + .3, T.capOut - .1);
    Tx('says', 'ROCKSTAR · AUG 27 2026', T.capIn + .15, T.capOut - .1);
    Tx('which', '1 OR 2?', T.voteIn + .15, T.seamIn - .1);
    return o;
  }

  /* ---------- times, clips and sound events, all from the voice ---------- */
  var U = {};
  function initTimes() {
    var gap = window.VAD || [];
    function gapAfter(t) { for (var i = 0; i < gap.length - 1; i++) if (gap[i][1] <= t + .25 && gap[i + 1][0] > t) return [gap[i][1], gap[i + 1][0]]; return [t, t + .3]; }
    T.titleOut = start('t1') + .62;          // the title holds over "A holdup." (no caption for it), lifts as "Guns up" captions
    T.ringA = .45;
    T.punchIn = start('t1') - .05;           // static flick, then the guns-up frames punched in
    T.bandW = T.punchIn + .05;
    T.aisleIn = at('t1', 'red') - .07;       // Trailer 1's aisle shot under "red bandana"
    T.aisleOut = gapAfter(lastw('t1'))[0] + .1;
    T.dateIn = T.aisleOut; T.dec = at('date', 'december') - .07;
    T.dipIn = start('dip') - .1; T.dipTrailer = at('dip', 'trailer'); T.dipGame = at('dip', 'moment') + .3;
    T.elIn = start('el') - .08; T.augW = at('el', 'august'); T.elOff = T.elIn + 1.9;
    T.sameIn = start('same') - .13; T.sameChip = T.sameIn; T.signW = T.sameIn + .58; T.bandW2 = at('same', 'red'); T.sameOut = T.sameIn + 2.23;
    T.hudIn = start('hud') - .15; T.hudTag = at('hud', 'time'); T.hudW = at('hud', 'hud');
    var hg = gapAfter(lastw('hud'));
    T.hudOff = hg[0] + .08;
    T.tk = []; for (var i = 0; i < 4; i++) T.tk.push(hg[0] + .18 + i * .08); T.tk.push(T.tk[3] + .1, T.tk[3] + .18);
    T.iconsW = T.tk[5] + .04; T.ammoW = T.iconsW + .1;
    T.capIn = start('cap') - .2; T.voteIn = start('end') - .2; T.capOut = T.voteIn + .05;
    T.voteThumb = at('end', 'which') - .05;
    T.seamIn = DUR - .45;
    CLIP.reset();
    U.tendA = CLIP.use('tend', 0, T.punchIn, { from: .6, speed: .45, zoom: [1.0, 1.1], focus: [.45, .36], note: 'Trailer 1 last shot (76.5-78.4 s): bandana ringed, arrow, A STORE HOLDUP, CAM 1 DEC 04 2023; cut before the VI logo' });
    U.tendB = CLIP.use('tend', T.punchIn, T.aisleIn, { from: 1.40, speed: (1.82 - 1.40) / (T.aisleIn - T.punchIn), zoom: [1.3, 1.38], focus: [.42, .45], note: 'Trailer 1 last shot, guns up, punched in 1.3x: bandana ringed + RED BANDANA tag' });
    U.aisle1 = CLIP.use('t1aisle', T.aisleIn, T.aisleOut, { from: .2, speed: 1, zoom: [2.0, 2.1], focus: [.37, .33], note: 'Trailer 1 aisle shot (68.7-70.2 s) under "red bandana", punched in 2x on her face: bandana ringed + RED BANDANA tag' });
    U.el = CLIP.use('elstore', T.elIn, T.elOff, { from: 0, speed: 1, zoom: [1.0, 1.06], focus: [.5, .5], note: 'Extended Look store holdup (705.8-707.7 s), CAM 2 AUG 27 2026 + EXTENDED LOOK chip' });
    var sd = T.sameOut - T.sameIn;
    U.aisle2 = CLIP.use('t1aisle', T.sameIn, T.sameOut, { from: .85, speed: (1.46 - .85) / sd, zoom: [1.0, 1.05], focus: [.38, .36], note: 'match, top: Trailer 1 aisle (69.55-70.16 s), bandana and e-Cola sign ringed, SAME BANDANA / SAME SIGN' });
    U.same = CLIP.use('elsame', T.sameIn, T.sameOut, { from: .55, speed: (1.15 - .55) / sd, zoom: [1.0, 1.05], focus: [.36, .4], note: 'match, bottom: Extended Look aisle (716.15-716.75 s), bandana and e-Cola sign ringed, SAME BANDANA / SAME SIGN' });
    U.hud = CLIP.use('elstore', T.hudIn, T.hudOff, { from: 2.4, speed: 1, zoom: [1.0, 1.0], focus: [.93, .08], note: 'Extended Look HUD (708.2-710.5 s): pushed in 3x onto the top-right HUD, framed + HUD tag' });
    U.v1 = CLIP.use('tend', T.voteThumb, T.seamIn + .3, { from: 1.75, freeze: 0, zoom: [1.06, 1.06], focus: [.45, .4], note: 'vote tile 1: still of the Trailer 1 holdup, TRAILER 1' });
    U.v2 = CLIP.use('elsame', T.voteThumb, T.seamIn + .3, { from: .3, freeze: 0, zoom: [1.06, 1.06], focus: [.36, .4], note: 'vote tile 2: still of the Extended Look holdup, EXTENDED LOOK' });
    U.seam = CLIP.use('tend', T.seamIn, DUR + .02, { from: .6 - (DUR - T.seamIn) * .45, speed: .45, zoom: [1.0, 1.0], focus: [.45, .36], note: 'loop seam: frame-0 layout returns (TRAILER 1 ENDED ON THIS), Trailer 1 last shot' });
    function plate(name, t0, t1) { var c = CLIP.manifest().clips[name], span = c.frames / 30 - .04; return CLIP.use(name, t0, t1, { plate: true, from: 0, speed: Math.min(1, span / (t1 - t0)), zoom: [1.1, 1.0], focus: [.5, .5], note: 'background plate' }); }
    plate('pclub', T.dipIn - .1, T.elIn + .05);
    plate('pcar', T.capIn, T.voteIn + .05);
    /* sound: hits sit in the voice's pauses; the channel switches are flicks (short enough for the gaps) */
    G('f0', 0, 'slap', .05, 1.15);
    G('ring', T.ringA, 'tock', .3, 1);
    G('punch', T.punchIn, 'flick', .12, 1);
    G('aisle', T.aisleIn, 'flick', .12, 1);
    G('date', T.aisleOut, 'flick', .12, 1.1);
    G('dec', T.dec, 'slap', .3, 1);
    G('dsw', T.dipIn - .05, 'flick', .15, .9);
    G('o1', T.dipTrailer, 'pop', .3, .8); G('o2', T.dipGame, 'pop', .3, .8);
    G('elsw', T.elIn, 'flick', .15, 1.1);
    G('aug', T.augW, 'slap', .08, .9);
    G('elOff', T.elOff, 'flick', .2, .8);
    G('split', T.sameIn, 'flick', .15, 1.1);
    G('sameb', T.bandW2, 'slap', .3, 1);
    G('hudsw', T.hudIn, 'flick', .15, 1.1);
    G('hudR', T.hudW, 'tock', .3, 1);
    for (var j = 0; j < 4; j++) G('st' + j, T.tk[j], 'slap', .03, .5);
    G('ammo', T.ammoW, 'pop', .3, .9);
    G('cap', T.capIn, 'slap', .2, .75);
    G('vote', T.voteIn, 'flick', .15, 1);
    G('seam', T.seamIn, 'swish', .3, .8);
    STRESS = [at('t1', 'guns'), at('t1', 'bandana'), at('date', 'december'), at('dip', 'trailer'), at('dip', 'game'), at('el', 'extended'), at('el', 'again'), at('same', 'bandana'), at('same', 'camera'), at('hud', 'hud'), at('stars', 'wanted'), at('stars', 'ammo'), at('cap', 'in-game')];
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
    /* the channel switch: a burst of TV static and a little CRT thunk */
    function fizz(t, g) { var o = bus(1), hp2 = ac.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 2400; var n = noise(t, .26); n.connect(hp2); hp2.connect(o); env(o.gain, [[t, 0], [t + .01, .12 * g], [t + .2, .05 * g], [t + .25, 0]]); thump(t, .14 * g, 180); }
    /* the short switch: a hard static burst and a CRT thunk that fits in the voice's short pauses */
    function flick(t, g) { var o = bus(1), hp2 = ac.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 1800; var n = noise(t, .08); n.connect(hp2); hp2.connect(o); env(o.gain, [[t, 0], [t + .004, .2 * g], [t + .05, .09 * g], [t + .075, 0]]); thump(t, .22 * g, 200); }
    var LEVEL = { tock: 2, slap: 3, swish: 3, pop: 2, fizz: 2.5, flick: 3 };
    var TRIM = window.SFX_TRIM || {};
    var TYPE_DB = { tock: -18, slap: -14, swish: -16, pop: -16, fizz: -16, flick: -15 };
    EV.forEach(function (e) {
      var g = (e.g == null ? 1 : e.g) * (LEVEL[e.type] || 1) * Math.pow(10, ((TRIM[e.id] || 0) + (TYPE_DB[e.type] || 0)) / 20);
      ({ slap: slap, tock: tock, swish: swish, pop: pop, fizz: fizz, flick: flick })[e.type](e.t, g);
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
      window.FILM.POSTER = Math.round((T.sameIn + 1.2) * 30) / 30 + 1 / 60;
      window.FILM.SHOTS = [
        { id: 'hook', name: 'Trailer 1 ended on this', t0: 0, t1: start('date') },
        { id: 'date', name: 'December 2023', t0: start('date'), t1: start('el') },
        { id: 'el', name: 'Extended Look', t0: start('el'), t1: start('same') },
        { id: 'same', name: 'Same bandana', t0: start('same'), t1: start('hud') },
        { id: 'hud', name: 'The HUD', t0: start('hud'), t1: start('cap') },
        { id: 'cap', name: 'In-game footage', t0: start('cap'), t1: start('end') },
        { id: 'end', name: 'Which hits harder?', t0: start('end'), t1: DUR }];
      window.READY = true;
    });
  }
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: 0, SLUG: 'gta-holdup', SHOTS: [], init: init, render: render, frame: frame, LIVE: LIVE, LIVE2: LIVE2, T: T, GT: GT };
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
