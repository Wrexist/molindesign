/* "Lucia ends a 25-year streak": GTA 6, Delta #6. A vertical film written in code, narrated first and cut to the voice:
   every visual beat is keyed to a word time from vo/vo.js (window.VO) with at(id, word). Pure function of t.
   Contract like ../nextword/film.js: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   Engine from ../gta-transition (torn-edge wipe, hero cards) with ../gta-songs' heard-word SFX gate (vo/heard.js).
   Native move: the lineup wall. 13 story-lead cards (2001–2013, all men) fill three rows; the one empty slot lights pink
   for Lucia. One hero stamp: 25 YEARS (derived, 2001 → 2026), which the poster carries.
   Own flat shapes in the Vice City palette. No Rockstar footage, logo, key art or character likeness (busts are generic),
   no music. Every shape stays inside x 90–930, y 300–1430. Facts and sources: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#0b0820', PANEL = '#1a1340', PANEL2 = '#2a1d5c', CREAM = '#fff3e6', DIM = 'rgba(255,243,230,.55)';
  var PINK = '#ff4fa3', TEAL = '#19d3c5', ORG = '#ff8a3d', PURP = '#9b7bff', SAND = '#ffd36b', BUST = '#4a3a8c';
  var DISP = 'Archivo', MONO = '"Geist Mono"', SERIF = '"Instrument Serif"';
  var RX0 = 90, RX1 = 930, RY0 = 300, RY1 = 1430;           // the safe rect: every shape and glyph stays inside

  /* ---------- math ---------- */
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
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .7), 0, 1.06); }
  function fin(t, a, d) { return clamp((t - a) / (d || .12), 0, 1); }
  function pin(t, a) { return lerp(1.16, 1, clamp(sp(t, a, 3.4, .75), 0, 1)); }      // a slap: lands big, settles
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function wend(id, word, nth) { return find(id, word, nth).t1; }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }
  /* where each line's voice really stops (energy > −40 dBFS in out/vo/vo.wav, measured after every voice run);
     vo.js under-reads a line's last word by up to 0.9 s ("1997"), so pause beats key to these */
  var VEND = { hook: 2.67, meet: 6.47, ask: 8.53, three: 12.42, men: 16.44, names: 20.64, but: 23.49, same: 26.01, online: 31.05, past: 34.33, fight: 37.11, first: 40.97, end: 44.31 };
  function vend(id) { var v = VEND[id]; if (!(v >= LINE[id].t0 && v <= LINE[id].t1 + .01)) throw new Error('VEND stale for ' + id + ': re-measure after the voice run'); return v; }

  /* ---------- the SFX gate: hits sit in pauses, clear of every word vo.js has and Whisper heard in the mix (vo/heard.js) ---------- */
  var EDGES = [], VOICED = [];
  VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  (window.HEARD || []).forEach(function (w) { if (w[1] < .15) return; VOICED.push({ t0: w[0], t1: w[1] }); EDGES.push(w[0], w[1]); });   // Whisper pins the first word to 0.00
  function free(m) {
    var B = [], M = [], F = [], p = 0;
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - m, v.t1 + m]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { blank: .2, eq: .12, tearS: .2, chime: .28, knock: .16, slap: .2, tear: .3, pop: .12, flap: .08, thump: .16, tick: .03, click: .06, ding: .5, whirr: .3, cross: .2, slide: .26, hero: .5, swish: .26 };
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m == null ? .2 : m).forEach(function (f) {
      var lo = f[0], hi = f[1] - body; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  /* a sound goes to the nearest free stretch within tol of its beat; with no free stretch the beat stays silent.
     The picture never moves with the gate, so a new heard.js only re-renders audio. */
  var EV = [], GT = {};
  function G(id, t, type, tol, gain, extra) {
    var n = nearGap(t, type, extra && extra.m);
    if (n !== null && Math.abs(n - t) <= (tol == null ? .15 : tol)) { GT[id] = n; var e = { t: n, type: type, g: gain == null ? 1 : gain, id: id }; if (extra) for (var k in extra) e[k] = extra[k]; EV.push(e); }
    return n;
  }

  /* ---------- canvas + safe-area check ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true }, NOISE;
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var BOUNDS = null, INCOMING = false, CURT = 0, SAFE = { x0: RX0, x1: RX1, y0: RY0, y1: RY1 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || INCOMING || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    var a = Math.min.apply(null, xs), b = Math.max.apply(null, xs), c = Math.max.apply(null, ys), d = Math.min.apply(null, ys);
    var px = Math.abs(m.d) * (y1 - y0);
    if (a < SAFE.x0 - .5 || b > SAFE.x1 + .5 || c > SAFE.y1 + .5 || d < SAFE.y0 - .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(a), x1: Math.round(b), y1: Math.round(c) });
  }
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS) { var mm = this.measureText(str); recBox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent, str); }
      return orig.apply(this, arguments);
    };
  }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam, st) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); try { g.fontStretch = st || 'normal'; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    font(g, px, o.wt || 900, o.fam, o.st); ls(g, o.ls || 0);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .34 : o.pad;
    while (o.maxw && tw + pad * 2 > o.maxw && px > 40) { px -= 2; font(g, px, o.wt || 900, o.fam, o.st); tw = g.measureText(text).width; pad = o.pad == null ? px * .34 : o.pad; }
    var w = o.w || tw + pad * 2, h = o.h || px * 1.3;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 8, w, h, o.r == null ? h * .24 : o.r); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .24 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .24 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 4; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .05); g.restore(); ls(g, 0);
    return w;
  }
  function label(g, text, x, y, a, col, px, align) {
    px = Math.max(36, px || 36);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); ls(g, 2); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillStyle = col || CREAM; g.fillText(text, x, y + (1 - Math.min(1, a)) * 12); g.restore(); ls(g, 0);
  }
  /* text fitted into a width: tries narrower stretches before it ever goes under minpx */
  function fitText(g, text, x, y, maxw, px, wt, col, minpx) {
    var st = ['normal', 'semi-condensed', 'condensed', 'extra-condensed'], i = 0;
    font(g, px, wt, DISP, st[0]);
    while (g.measureText(text).width > maxw && (i < st.length - 1 || px > (minpx || 36))) {
      if (i < st.length - 1) i++; else px -= 2;
      font(g, px, wt, DISP, st[i]);
    }
    g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y);
    font(g, px, wt);
  }
  function poly(g, pts, fill) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); g.fillStyle = fill; g.fill(); }
  function clipSafe(g) { g.beginPath(); g.rect(RX0, RY0, RX1 - RX0, RY1 - RY0); g.clip(); }

  /* the one hero stamp: worn ink (seeded speckle), two lines, slammed */
  var STEX = {}, TAPE = null;
  function stampTex(t1, t2, col, px) {
    var key = t1 + t2 + col + px; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900); ls(m, 6); var w1 = m.measureText(t1).width; font(m, px * .36, 800); ls(m, 3); var w2 = m.measureText(t2).width; ls(m, 0);
    var pad = px * .34, w = Math.max(w1, w2) + pad * 2, h = px * 1.12 + px * .5 + pad * .9, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(5, px * .07); rr(g, 3, 3, w - 6, h - 6, px * .14); g.stroke();
    g.lineWidth = Math.max(2, px * .025); rr(g, 14, 14, w - 28, h - 28, px * .1); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, px, 900); ls(g, 6); g.fillText(t1, w / 2, pad * .45 + px * .58);
    font(g, px * .36, 800); ls(g, 3); g.fillText(t2, w / 2, h - pad * .45 - px * .26); ls(g, 0);
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 110);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .35 + r() * .65; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 2.4, 0, 6.283); g.fill(); }
    g.globalCompositeOperation = 'destination-over'; g.globalAlpha = .94; g.fillStyle = BG; rr(g, 3, 3, w - 6, h - 6, px * .14); g.fill();
    c.w = w + 16; c.h = h + 16; c.px = px; STEX[key] = c; return c;
  }
  function heroStamp(g, x, y, s, rot, a) {
    var c = stampTex('25 YEARS', 'SINCE GTA III · 2001', ORG, 112);
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.save(); g.globalAlpha *= .4; g.drawImage(c, -c.w / 2 + 10, -c.h / 2 + 12); g.restore();
    g.drawImage(c, -c.w / 2, -c.h / 2);
    recBox(g, -c.w / 2 + 8, -c.h / 2 + 8, c.w / 2 - 8, c.h / 2 - 8, '[stamp] 25 YEARS');
    g.restore();
  }

  /* ---------- the film's own object: a streak scoreboard with a bulb chase (no stock sunset disc) ---------- */
  function board(g, T, a) {
    if (a <= 0) return;
    var x0 = 130, y0 = 590, x1 = 890, y1 = 1330;
    g.save(); g.globalAlpha *= a;
    rr(g, x0 + 10, y0 + 14, x1 - x0, y1 - y0, 34); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, x0, y0, x1 - x0, y1 - y0, 34); g.fillStyle = PANEL; g.fill();
    rr(g, x0, y0, x1 - x0, y1 - y0, 34); g.strokeStyle = ORG; g.lineWidth = 10; g.stroke();
    /* score lines, like a chalk scoreboard */
    for (var y = y0 + 70, i = 0; y < y1 - 40; y += 64, i++) { g.fillStyle = 'rgba(25,211,197,' + (i % 3 === 0 ? .2 : .08) + ')'; g.fillRect(x0 + 40, y, x1 - x0 - 80, 3); }
    /* the bulb chase runs round the frame the whole time */
    var pts = [], step = 46, ins = 26, k, n;
    for (k = x0 + ins; k <= x1 - ins; k += step) pts.push([k, y0 + ins]);
    for (k = y0 + ins + step; k <= y1 - ins; k += step) pts.push([x1 - ins, k]);
    for (k = x1 - ins - step; k >= x0 + ins; k -= step) pts.push([k, y1 - ins]);
    for (k = y1 - ins - step; k > y0 + ins; k -= step) pts.push([x0 + ins, k]);
    var head = Math.floor(T * 16);
    for (n = 0; n < pts.length; n++) {
      var on = ((n - head) % 4 + 4) % 4 === 0;
      g.beginPath(); g.arc(pts[n][0], pts[n][1], on ? 8 : 6, 0, 6.2832); g.fillStyle = on ? PINK : 'rgba(255,243,230,.22)'; g.fill();
    }
    g.restore();
  }
  function stage(g) { g.fillStyle = BG; g.fillRect(0, 0, W, H); }

  /* ---------- the tally: 25 strokes, a light runs along them (the streak) ---------- */
  /* stroke idx of the tally, in tally space (one group of five = four bars and a slash) */
  function strokePts(idx, T) {
    var gi = Math.floor(idx / 5), j = idx % 5, x0 = -372 + gi * 156;
    if (j < 4) { var xx = x0 + j * 27, wob = Math.sin(T * 3 + idx) * 2; return [xx, -44 + wob, xx + 2, 44 + wob]; }
    return [x0 - 16, 34, x0 + 98, -34];
  }
  /* crackT: the 25th stroke (the last slash) cracks in two and the light stops: the streak ends */
  function tally(g, cx, y, T, s, crackT, a, upto) {
    g.save(); g.globalAlpha *= a == null ? 1 : a; g.translate(cx, y); g.scale(s, s); g.lineCap = 'round';
    var run = crackT == null || T < crackT, hi = ((Math.floor(T * 11) % 25) + 25) % 25, n = upto == null ? 25 : upto;
    for (var idx = 0; idx < n; idx++) {
      var d = ((hi - idx) % 25 + 25) % 25, lit = run ? (d === 0 ? 1 : d < 4 ? .55 - d * .14 : 0) : 0, p = strokePts(idx, T);
      g.lineWidth = 13;
      if (!run && idx === 24) {
        /* the crack: two halves, pushed apart and tilted */
        var k = eo(seg(T, crackT, crackT + .25)), mx = (p[0] + p[2]) / 2, my = (p[1] + p[3]) / 2;
        g.strokeStyle = ORG;
        [[p[0], p[1], -1], [p[2], p[3], 1]].forEach(function (h) {
          g.save(); g.translate(mx + h[2] * 14 * k, my + h[2] * 10 * k); g.rotate(h[2] * .22 * k);
          g.beginPath(); g.moveTo(h[0] - mx, h[1] - my); g.lineTo(h[2] * 6, -h[2] * 4); g.stroke(); g.restore();
        });
        if (k < 1) { g.fillStyle = 'rgba(255,211,107,' + (1 - k) + ')'; for (var q = 0; q < 5; q++) { var an = q * 1.26 + .4; g.fillRect(mx + Math.cos(an) * 40 * k - 3, my + Math.sin(an) * 40 * k - 3, 6, 6); } }
        continue;
      }
      g.strokeStyle = lit > 0 ? 'rgba(255,79,163,' + (.45 + lit * .55) + ')' : CREAM;
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[2], p[3]); g.stroke();
    }
    g.restore();
  }

  /* =====================================================================================================
     SCENES
     ===================================================================================================== */
  var SC = [
    { id: 'hook', name: 'Hook', t0: 0 },
    { id: 'meet', name: 'Meet Lucia', t0: start('meet') - .15 },
    { id: 'three', name: 'GTA III goes 3D', t0: start('three') - .1 },
    { id: 'wall', name: 'Every lead a man', t0: vend('three') + .42 },
    { id: 'sel', name: '1997', t0: start('but') - .24 },
    { id: 'online', name: 'GTA Online', t0: start('online') - .2 },
    { id: 'past', name: 'Her past', t0: start('past') - .45 },
    { id: 'first', name: 'The first', t0: start('first') + .25 }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var S = {}; SC.forEach(function (s, i) { S[s.id] = i; });
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  var HOME = vend('end') + .2, HOMEK = .4;
  var T_PEN = vend('past') + .25, T_Q = vend('ask') + .17, T_X = vend('online') + .2, T_MAN = vend('men') + .15, T_SHRINK = start('ask') - .48;
  var T_TAPE = vend('hook') + .27, T_PUNCH = vend('fight') + .3, T_GLOVE = at('fight', 'father') - .05;
  /* the payoff: 25 strokes sweep the wall in 0.4 s, the 25th snaps over LUCIA on the bell, the stamp lands 0.15 s later */
  var T_SW = vend('first') + .12, T_SNAP = T_SW + .4, T_STAMP = T_SNAP + .15;
  /* the spotlight hops: Tommy in the pause before "It was", the others in the written pauses before their names */
  var HOPS = [['tommy', 1, start('names') - .2], ['cj', 2, at('names', 'cj') - .24], ['niko', 6, at('names', 'niko') - .24], ['trevor', 12, at('names', 'trevor') - .24]];

  /* ---------- hook: the streak. Frame 0: GTA 6 · 25 · YEAR STREAK (4 words), already moving ---------- */
  function hookFrame(g, T, live) {
    board(g, T, 1);
    /* GTA 6 pill, top left, on screen from frame 0 */
    chip(g, 'GTA 6', 300, 418 + Math.sin(T * 2.3) * 5, { px: 96, bg: CREAM, fg: BG, rot: -.06 + Math.sin(T * 1.7) * .01 });
    /* the giant 25 */
    var tp = live ? at('hook', '25year') - .04 : -9, punch = T > tp ? Math.exp(-(T - tp) * 7) * .14 : 0;
    var s = 1 + .028 * Math.sin(T * 3.1 + .6) + punch, rot = -.035 + .022 * Math.sin(T * 2.2 + 1), dy = 9 * Math.sin(T * 2.6);
    g.save(); g.translate(CX, 850 + dy); g.rotate(rot); g.scale(s, s);
    font(g, 560, 900); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = PINK; g.fillText('25', 22, 26);
    g.lineJoin = 'round'; g.lineWidth = 16; g.strokeStyle = BG; g.strokeText('25', 0, 0);
    g.fillStyle = CREAM; g.fillText('25', 0, 0);
    g.restore();
    /* 25 strokes with the light running along them; on "ends" the 25th stroke cracks */
    var stop = live ? at('hook', 'ends') : null;
    tally(g, CX, 1150, T, 1, stop);
    chip(g, 'YEAR STREAK', CX, 1268, { px: 90, bg: PINK, fg: BG, rot: -.03 + Math.sin(T * 1.9) * .008 });
    /* after "streak.": a pink GTA 6 tape slaps across the tally, then the condition */
    var k = live ? eo(seg(T, T_TAPE, T_TAPE + .22)) : 0;
    if (k > 0) {
      g.save(); clipSafe(g); g.translate(CX, 1130); g.rotate(-.12); var L = 940;
      g.beginPath(); g.rect(-L / 2, -60, L * k, 120); g.clip();
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-L / 2 + 8, -48 + 10, L, 96);
      g.fillStyle = PINK; g.fillRect(-L / 2, -48, L, 96);
      g.fillStyle = BG; g.fillRect(-L / 2, -48, L, 8); g.fillRect(-L / 2, 40, L, 8);
      var strip = TAPE || (TAPE = mk(L, 96)), sg = strip.getContext('2d'); sg.clearRect(0, 0, L, 96);
      font(sg, 50, 900); sg.textAlign = 'left'; sg.textBaseline = 'middle'; sg.fillStyle = BG; ls(sg, 4);
      sg.fillText('GTA 6  ·  GTA 6  ·  GTA 6  ·  GTA 6  ·  GTA 6  ·  GTA 6', -120 - ((T - T_TAPE) * 30) % 200, 51); ls(sg, 0);
      g.drawImage(strip, -L / 2, -48);
      g.restore();
    }
    var kc = live ? pop(T, at('hook', 'ends') + .08) : 0;
    chip(g, 'SINCE 2001', CX, 1384, { px: 52, bg: TEAL, fg: BG, s: kc, a: kc * 2, rot: .02 });
  }

  /* ---------- meet + ask: a HELLO MY NAME IS tag, LUCIA, then JASON beside it; then the streak returns with a ? ---------- */
  function nameTag(g, name, band, w, h, namePx, t, writeT, smallLine) {
    rr(g, -w / 2 + 10, -h / 2 + 14, w, h, 34); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, -w / 2, -h / 2, w, h, 34); g.fillStyle = band; g.fill();
    var bh = h * .36;
    rr(g, -w / 2 + 16, -h / 2 + bh, w - 32, h - bh - 18, 22); g.fillStyle = CREAM; g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = BG;
    font(g, Math.round(bh * .5), 900); ls(g, 6); g.fillText('HELLO', 0, -h / 2 + (smallLine ? bh * .36 : bh * .52)); ls(g, 0);
    if (smallLine) { font(g, 38, 600, MONO); ls(g, 3); g.fillText('MY NAME IS', 0, -h / 2 + bh * .78); ls(g, 0); }
    /* the name is written on, left to right */
    var k = writeT == null ? 1 : eio(seg(t, writeT, writeT + .32));
    if (k > 0) {
      g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w * k, h); g.clip();
      font(g, namePx, 900, DISP, 'semi-condensed'); g.fillStyle = band === CREAM ? PINK : BG; g.fillText(name, 0, -h / 2 + bh + (h - bh - 18) / 2 + namePx * .04);
      g.restore();
    }
  }
  function sceneMeet(g, t) {
    var s = SC[S.meet], tL = at('meet', 'lucia') - .1, tJ = at('meet', 'jason') - .18, tA = T_SHRINK;
    var m = eio(seg(t, tA, tA + .4));
    /* LUCIA tag: under the wipe already, name written on "Lucia" */
    var kL = pop(t, s.t0 - .22, 2.8, .72), sl = pin(t, tL);
    g.save(); g.translate(lerp(CX, 320, m), lerp(760, 620, m)); g.rotate(lerp(-.04, -.06, m)); var sc = Math.min(kL, 1.03) * lerp(1, .52, m) * (m > 0 ? 1 : (t > tL ? sl * .98 + .02 : 1));
    g.scale(sc, sc);
    nameTag(g, 'LUCIA', PINK, 700, 440, 178, t, tL, m < .05);
    g.restore();
    /* JASON tag slides in on "Jason" */
    var kJ = eo(seg(t, tJ, tJ + .3));
    if (kJ > 0) {
      g.save(); g.globalAlpha *= clamp(kJ * 2, 0, 1);
      g.translate(lerp(650, 720, m), lerp(1110 + (1 - kJ) * 60, 640, m)); g.rotate(lerp(.05, .06, m)); var sj = lerp(lerp(.8, 1, kJ), .78, m); g.scale(sj, sj);
      nameTag(g, 'JASON', TEAL, 460, 290, 116, t, null, false);
      g.restore();
    }
    /* Rockstar's own words, with the source line; gone before the ? */
    var q = seg(t, tL + .4, tL + .65);
    if (q > 0) {
      g.save(); g.globalAlpha *= q; g.font = 'italic 400 ' + Math.round(lerp(64, 54, m)) + 'px ' + SERIF; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
      g.fillText('“…Jason and Lucia’s story…”', CX, lerp(1318, 1342, m)); g.restore();
      label(g, 'ROCKSTAR · ROCKSTARGAMES.COM/VI', CX, lerp(1398, 1404, m), q, SAND, 40);
    }
    /* ask: the streak comes back under a big ? */
    if (m > 0) {
      var kq = pop(t, tA + .15, 2.6, .6), kq2 = pop(t, at('ask', 'breaking') - .05) + (t > T_Q ? Math.exp(-(t - T_Q) * 8) * .25 : 0);
      tally(g, CX, 960, t, lerp(.8, 1, Math.min(kq, 1)), null, clamp(kq * 2, 0, 1) * .9);
      if (kq2 > 0) {
        g.save(); g.translate(CX, 950); g.scale(.85, .85); g.rotate(.06 + Math.sin(t * 3) * .03); g.scale(kq2, kq2);
        font(g, 400, 900); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = PINK; g.fillText('?', 16, 20); g.lineWidth = 14; g.strokeStyle = BG; g.strokeText('?', 0, 0); g.fillStyle = CREAM; g.fillText('?', 0, 0);
        g.restore();
      }
      var kc = pop(t, tA + .05);
      chip(g, 'WHAT STREAK?', CX, 1238, { px: 84, bg: ORG, fg: BG, rot: -.03, s: kc, a: kc * 2 });
    }
  }

  /* ---------- three: a flat top-down street grid tilts back and its blocks rise into a 3D city ---------- */
  var BLK = (function () { var r = mulberry(21), out = []; for (var i = 0; i < 5; i++) for (var j = 0; j < 5; j++) out.push({ i: i, j: j, h: 40 + r() * 150, c: [PINK, TEAL, ORG, PURP, SAND][Math.floor(r() * 5)] }); return out; })();
  function shade(hex, k) { var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255; return 'rgb(' + Math.round(r * k) + ',' + Math.round(gg * k) + ',' + Math.round(b * k) + ')'; }
  function sceneThree(g, t) {
    var s = SC[S.three], t3 = at('three', '3d'), k = eio(seg(t, t3 - .3, t3 + .5)), th = k * Math.PI / 4, sq = lerp(1, .56, k);
    var kin = pop(t, s.t0 - .22, 2.6, .8), cx = CX, cy = 960 + k * 40, cell = 100, half = 250, mrg = 22;
    var c = Math.cos(th), sn = Math.sin(th);
    function P(x, y, z) { var xr = x * c - y * sn, yr = x * sn + y * c; return [cx + xr * kin, cy + (yr * sq - (z || 0)) * kin]; }
    /* ground */
    var gpts = [[-half - mrg, -half - mrg], [half + mrg, -half - mrg], [half + mrg, half + mrg], [-half - mrg, half + mrg]].map(function (p) { return P(p[0], p[1]); });
    poly(g, gpts, PANEL);
    g.save(); g.strokeStyle = 'rgba(255,243,230,.35)'; g.lineWidth = 3; g.setLineDash([14, 14]);
    for (var r = 1; r < 5; r++) { var v = -half + r * cell; [[[v, -half], [v, half]], [[-half, v], [half, v]]].forEach(function (ln) { var a = P(ln[0][0], ln[0][1]), b = P(ln[1][0], ln[1][1]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }); }
    g.restore();
    /* blocks, far to near */
    var list = BLK.map(function (b) { var x0 = -half + b.i * cell + 14, y0 = -half + b.j * cell + 14, w = cell - 28; var ctr = P(x0 + w / 2, y0 + w / 2); return { b: b, x0: x0, y0: y0, w: w, d: ctr[1] }; });
    list.sort(function (a, b) { return a.d - b.d; });
    list.forEach(function (o) {
      var hgt = o.b.h * k * Math.min(1, seg(t, t3 - .2 + (o.b.i + o.b.j) * .03, t3 + .55 + (o.b.i + o.b.j) * .03) * 1.0001);
      var base = [[o.x0, o.y0], [o.x0 + o.w, o.y0], [o.x0 + o.w, o.y0 + o.w], [o.x0, o.y0 + o.w]];
      var B = base.map(function (p) { return P(p[0], p[1], 0); }), T = base.map(function (p) { return P(p[0], p[1], hgt * kin); });
      if (hgt > .5) for (var e = 0; e < 4; e++) { var n = (e + 1) % 4; poly(g, [B[e], B[n], T[n], T[e]], shade(o.b.c, e % 2 ? .45 : .62)); }
      poly(g, T, o.b.c);
      if (k < .5) { g.save(); g.globalAlpha = 1 - k * 2; g.strokeStyle = BG; g.lineWidth = 4; g.beginPath(); g.moveTo(T[0][0], T[0][1]); for (var q = 1; q < 4; q++) g.lineTo(T[q][0], T[q][1]); g.closePath(); g.stroke(); g.restore(); }
    });
    /* a car drives the middle road the whole time */
    var u = ((t - s.t0) * .32) % 1, car = P(-half + u * 2 * half, -half + 2 * cell + cell / 2 - 50, 0);
    g.fillStyle = CREAM; g.beginPath(); g.arc(car[0], car[1], 13 * kin, 0, 6.2832); g.fill();
    var kc = pop(t, s.t0 + .25), kf = pop(t, at('three', 'took') - .05);
    chip(g, 'GTA III · OCT 2001', CX, 1282, { px: 60, bg: ORG, fg: BG, rot: -.025, s: kc, a: kc * 2 });
    chip(g, 'THE STREAK STARTS', CX, 1374, { px: 60, bg: TEAL, fg: BG, rot: .02, s: kf, a: kf * 2 });
  }

  /* ---------- the lineup wall ---------- */
  var LEADS = [
    ['CLAUDE', '2001'], ['TOMMY', '2002'], ['CJ', '2004'], ['MIKE', '2004'], ['TONI', '2005'],
    ['VIC', '2006'], ['NIKO', '2008'], ['JOHNNY', '2009'], ['HUANG', '2009'], ['LUIS', '2009'],
    ['MICHAEL', '2013'], ['FRANKLIN', '2013'], ['TREVOR', '2013']
  ];
  var CW = 152, CH = 225, CG = 10, ROWY = [605, 845, 1085];
  function slotXY(i) {
    var r = i < 5 ? 0 : i < 10 ? 1 : 2, c = i - r * 5, n = r === 2 ? 4 : 5, x0 = CX - (n * CW + (n - 1) * CG) / 2;
    return [x0 + c * (CW + CG), ROWY[r]];
  }
  function bust(g, cx, top, col, hair) {
    g.fillStyle = col;
    g.beginPath(); g.arc(cx, top + 58, 30, 0, 6.2832); g.fill();
    g.beginPath(); g.moveTo(cx - 50, top + 140); g.quadraticCurveTo(cx - 50, top + 96, cx - 20, top + 94); g.lineTo(cx + 20, top + 94); g.quadraticCurveTo(cx + 50, top + 96, cx + 50, top + 140); g.closePath(); g.fill();
    if (hair) { g.beginPath(); g.moveTo(cx - 34, top + 52); g.quadraticCurveTo(cx - 40, top + 106, cx - 26, top + 118); g.lineTo(cx - 18, top + 70); g.closePath(); g.fill(); g.beginPath(); g.moveTo(cx + 34, top + 52); g.quadraticCurveTo(cx + 40, top + 106, cx + 26, top + 118); g.lineTo(cx + 18, top + 70); g.closePath(); g.fill(); }
  }
  function leadCard(g, i, x, y, a, lit, sc, names) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x + CW / 2, y + CH / 2); g.scale(sc || 1, sc || 1); g.translate(-CW / 2, -CH / 2);
    rr(g, 0, 0, CW, CH, 16); g.fillStyle = lit ? PINK : PANEL2; g.fill();
    rr(g, 0, 0, CW, CH, 16); g.strokeStyle = lit ? CREAM : 'rgba(25,211,197,.7)'; g.lineWidth = lit ? 5 : 3; g.stroke();
    bust(g, CW / 2, 0, lit ? BG : BUST, lit);
    rr(g, 8, 146, CW - 16, 42, 8); g.fillStyle = BG; g.fill();
    var nm = lit ? 'LUCIA' : LEADS[i][0], gm = lit ? '2026' : LEADS[i][1];
    if (names !== false) {
      fitText(g, nm, CW / 2, 168, CW - 22, 36, 800, lit ? PINK : CREAM, 36);
      font(g, 36, 600, MONO); g.fillStyle = lit ? BG : TEAL; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(gm, CW / 2, 207);
    }
    g.restore();
  }
  function emptySlot(g, x, y, a, glow) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    if (glow > 0) { rr(g, x, y, CW, CH, 16); g.fillStyle = 'rgba(255,79,163,' + (.25 + .35 * glow) + ')'; g.fill(); }
    g.setLineDash([14, 10]); rr(g, x + 2, y + 2, CW - 4, CH - 4, 16); g.strokeStyle = glow > 0 ? PINK : 'rgba(255,243,230,.5)'; g.lineWidth = 4; g.stroke(); g.setLineDash([]);
    g.restore();
  }
  function wallBack(g, t, a) {
    g.save(); g.globalAlpha *= a;
    rr(g, 100, 585, 820, 745, 26); g.fillStyle = PANEL; g.fill();
    g.save(); rr(g, 100, 585, 820, 745, 26); g.clip();
    for (var y = 600, i = 0; y < 1330; y += 46, i++) { g.fillStyle = i % 4 === 0 ? 'rgba(25,211,197,.42)' : 'rgba(25,211,197,.16)'; g.fillRect(100, y, 820, i % 4 === 0 ? 4 : 2); }
    g.restore(); g.restore();
  }
  /* card entrance times for the wall scene */
  /* row one lands in the pause before "Since then" (a placard tick each); rows two and three follow at 0.25 s */
  function cardIn(i) { return i < 5 ? SC[S.wall].t0 + .05 + i * .16 : start('men') + .12 + (i - 5) * .25; }
  function sceneWall(g, t) {
    var s = SC[S.wall], kw = pop(t, s.t0 - .22, 2.6, .85);
    wallBack(g, t, clamp(kw * 2, 0, 1));
    chip(g, 'WRITTEN LEADS · 2001–2025', CX, 556, { px: 48, line: CREAM, fg: CREAM, lw: 3, s: Math.min(kw, 1), a: kw * 2, wt: 800 });
    /* the spotlight hops on the names */
    var hot = -1, ht = 0, tEnd = s.t1;
    HOPS.forEach(function (p) { if (t >= p[2]) { hot = p[1]; ht = p[2]; } });
    if (t > vend('names') + .5) hot = -1;
    for (var i = 0; i < 13; i++) {
      var xy = slotXY(i), k = eo(seg(t, cardIn(i), cardIn(i) + .3));
      if (k <= 0) continue;
      var dim = hot >= 0 && hot !== i ? .42 : 1, sc = hot === i ? lerp(1, 1.08, clamp(sp(t, ht, 3.2, .6), 0, 1.1)) : 1;
      if (hot === i) { g.save(); var gr = g.createRadialGradient(xy[0] + CW / 2, xy[1] + CH / 2, 20, xy[0] + CW / 2, xy[1] + CH / 2, 170); gr.addColorStop(0, 'rgba(255,243,230,.35)'); gr.addColorStop(1, 'rgba(255,243,230,0)'); g.fillStyle = gr; g.fillRect(xy[0] - 60, xy[1] - 40, CW + 120, CH + 80); g.restore(); }
      leadCard(g, i, xy[0], xy[1] - (1 - k) * 70, clamp(k * 1.6, 0, 1) * dim, false, sc);
      if (hot === i) { g.save(); rr(g, xy[0] + CW / 2 - CW * sc / 2 - 4, xy[1] + CH / 2 - CH * sc / 2 - 4, CW * sc + 8, CH * sc + 8, 18); g.strokeStyle = PINK; g.lineWidth = 6; g.stroke(); g.restore(); }
    }
    var e13 = slotXY(13); emptySlot(g, e13[0], e13[1], eo(seg(t, cardIn(12) + .1, cardIn(12) + .4)), 0);
    var km = pop(t, T_MAN, 3, .62);
    chip(g, 'EVERY ONE A MAN', CX, 1372, { px: 64, bg: CREAM, fg: BG, rot: -.025, s: km, a: km * 2 });
  }

  /* ---------- sel: a re-created 1997 select screen, then two identical missions ---------- */
  var PIX_M = ['....hhhh....', '...hhhhhh...', '...ffffff...', '...ffffff...', '...ffffff...', '....ffff....', '.....ff.....', '..ssssssss..', '.ssssssssss.', '.ssssssssss.'];
  var PIX_F = ['...hhhhhh...', '..hhhhhhhh..', '..hffffffh..', '..hffffffh..', '..hffffffh..', '..hhffffhh..', '..hh.ff.hh..', '..ssssssss..', '.ssssssssss.', '.ssssssssss.'];
  var TILES = [[0, TEAL, ORG], [1, PINK, TEAL], [0, SAND, PURP], [1, ORG, PINK], [1, TEAL, SAND], [0, PINK, TEAL], [1, PURP, ORG], [0, ORG, TEAL]];
  function pixBust(g, x, y, px, tile) {
    var rows = tile[0] ? PIX_F : PIX_M, col = { h: tile[1], f: '#f4d7bf', s: tile[2] };
    rows.forEach(function (row, ry) { for (var rx = 0; rx < row.length; rx++) { var ch = row[rx]; if (ch === '.') continue; g.fillStyle = col[ch]; g.fillRect(x + rx * px, y + ry * px, px, px); } });
  }
  function crt(g, t, sel, clickK) {
    rr(g, -380 + 10, -300 + 14, 760, 600, 40); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
    rr(g, -380, -300, 760, 600, 40); g.fillStyle = '#e6d8c4'; g.fill();
    rr(g, -330, -262, 660, 470, 26); g.fillStyle = '#120d24'; g.fill();
    g.save(); rr(g, -330, -262, 660, 470, 26); g.clip();
    for (var y = -262; y < 210; y += 6) { g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(-330, y, 660, 2); }
    font(g, 36, 600, MONO); ls(g, 4); g.fillStyle = TEAL; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PICK ONE', 0, -222); ls(g, 0);
    for (var i = 0; i < 8; i++) {
      var cx = -213 + (i % 4) * 142, cy = -110 + Math.floor(i / 4) * 160;
      rr(g, cx - 60, cy - 66, 120, 132, 8); g.fillStyle = i === sel ? 'rgba(255,79,163,.28)' : '#221a44'; g.fill();
      if (i === sel) { rr(g, cx - 60, cy - 66, 120, 132, 8); g.strokeStyle = clickK > 0 ? PINK : CREAM; g.lineWidth = clickK > 0 ? 7 : 4; g.stroke(); }
      pixBust(g, cx - 54, cy - 58, 9, TILES[i]);
    }
    g.restore();
    rr(g, 230, 228, 90, 26, 12); g.fillStyle = '#b8a890'; g.fill();
    g.beginPath(); g.arc(-290, 241, 11, 0, 6.2832); g.fillStyle = clickK > 0 ? TEAL : '#8c7d68'; g.fill();
    poly(g, [[-120, 300], [120, 300], [170, 350], [-170, 350]], '#cdbda6');
  }
  var T_EQ = wend('same', 'missions') + .15;
  function sceneSel(g, t) {
    var s = SC[S.sel], tS = start('same') - .12, m = eio(seg(t, tS, tS + .45)), tC = vend('but') + .08;
    var kin = pop(t, s.t0 - .22, 2.6, .8);
    chip(g, 'GTA (1997) · TOP-DOWN', CX, 552, { px: 54, bg: ORG, fg: BG, rot: -.02, s: Math.min(kin, 1), a: kin * 2 });
    /* the cursor walks the grid and settles on a woman tile (6), clicked in the pause after "1997" */
    var path = [0, 1, 2, 6], tw = at('but', 'woman') - .1, step = Math.floor(clamp((t - (s.t0 + .3)) / Math.max(.2, (tw - s.t0 - .3) / 3), 0, 3)), sel = path[step];
    if (t > tw) sel = 6;
    if (m < 1) {
      g.save(); g.globalAlpha *= 1 - m; g.translate(CX, lerp(900, 820, m)); var sc = Math.min(kin, 1.02) * lerp(1, .92, m); g.scale(sc, sc);
      var clickK = t > tC ? 1 : 0; crt(g, t, sel, clickK);
      /* pixel arrow cursor over the selected tile */
      var cx = -213 + (sel % 4) * 142 + 30, cy = -110 + Math.floor(sel / 4) * 160 + 20, press = t > tC && t < tC + .12 ? 4 : 0;
      g.fillStyle = CREAM; [[0, 0, 6, 42], [6, 6, 6, 30], [12, 12, 6, 22], [18, 18, 6, 14], [24, 24, 6, 6]].forEach(function (r) { g.fillRect(cx + r[0], cy + r[1] + press, r[2], r[3]); });
      g.restore();
      var kw = pop(t, s.t0 + .35), q = 1 - m;
      chip(g, '4 OF 8 PICKS WERE WOMEN', CX, 1325, { px: 56, bg: CREAM, fg: BG, rot: .02, s: kw, a: kw * 2 * q, maxw: 820 });
      label(g, 'VIA WIKIPEDIA · LEVELUP', CX, 1404, seg(t, s.t0 + .12, s.t0 + .27) * q, SAND, 40);
    }
    /* same: two mission cards, a man tile and a woman tile, with = between */
    if (m > 0) {
      [[0, 300, 0], [1, 720, 6]].forEach(function (c, j) {
        var kc = eo(seg(t, tS + .05 + j * .1, tS + .4 + j * .1));
        g.save(); g.globalAlpha *= clamp(kc * 2, 0, 1); g.translate(c[1], 935 + (1 - kc) * 140 + Math.sin(t * 2.2 + j * .3) * 5);
        rr(g, -170 + 8, -270 + 12, 340, 540, 30); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
        rr(g, -170, -270, 340, 540, 30); g.fillStyle = PANEL2; g.fill(); rr(g, -170, -270, 340, 540, 30); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
        rr(g, -84, -236, 168, 150, 12); g.fillStyle = '#120d24'; g.fill();
        pixBust(g, -72, -230, 12, TILES[c[2]]);
        font(g, 46, 900); g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MISSION 1', 0, -30);
        /* the same job drawn on both: a car, a dashed route, a flag */
        rr(g, -120, 40, 90, 46, 12); g.fillStyle = ORG; g.fill(); g.fillStyle = BG; g.beginPath(); g.arc(-98, 88, 12, 0, 6.2832); g.arc(-52, 88, 12, 0, 6.2832); g.fill();
        g.setLineDash([12, 10]); g.strokeStyle = TEAL; g.lineWidth = 6; g.beginPath(); g.moveTo(-20, 64); g.quadraticCurveTo(40, -10, 90, 64); g.stroke(); g.setLineDash([]);
        g.fillStyle = CREAM; g.fillRect(96, 20, 6, 80); poly(g, [[102, 20], [146, 34], [102, 48]], PINK);
        font(g, 40, 600, MONO); g.fillStyle = TEAL; g.fillText('SAME JOB', 0, 190);
        g.restore();
      });
      var ke = pop(t, T_EQ);
      if (ke > 0) { g.save(); g.translate(CX, 935); g.scale(ke, ke); g.fillStyle = PINK; rr(g, -34, -30, 68, 20, 6); g.fill(); rr(g, -34, 10, 68, 20, 6); g.fill(); g.restore(); }
      var kl = pop(t, tS + .1);
      chip(g, 'LOOK ONLY', CX, 1330, { px: 72, bg: PINK, fg: BG, rot: -.02, s: kl, a: kl * 2, maxw: 820 });
    }
    /* the whole sequence is our re-creation */
    chip(g, 'RE-CREATED', 800, 640, { px: 36, bg: PINK, fg: BG, fam: MONO, wt: 600, rot: .08, s: Math.min(kin, 1), a: kin * 2 });
  }

  /* ---------- online: a re-created character creator; the woman you build is a blank: no name, no past ---------- */
  var T_BLANK = at('online', 'blank') - .1;
  function sceneOnline(g, t) {
    var s = SC[S.online], kin = pop(t, s.t0 - .22, 2.6, .8), tM = at('online', 'make') - .2, tg = eio(seg(t, tM, tM + .3)), tN = at('online', 'but') - .05, tX = T_X;
    chip(g, 'GTA ONLINE · 2013', CX, 552, { px: 56, bg: TEAL, fg: BG, rot: -.02, s: Math.min(kin, 1), a: kin * 2 });
    g.save(); g.translate(CX, 920); var sc = Math.min(kin, 1.02); g.scale(sc, sc); g.translate(-CX, -920);
    rr(g, 128, 618, 780, 610, 36); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
    rr(g, 120, 610, 780, 610, 36); g.fillStyle = PANEL; g.fill(); rr(g, 120, 610, 780, 610, 36); g.strokeStyle = CREAM; g.lineWidth = 4; g.stroke();
    /* the avatar: generic, faceless; hair grows with the HAIR slider */
    var hairK = tg * (.5 + .5 * Math.sin((t - tM) * 1.6 - 1.2) * .5 + .25), faceK = Math.sin((t - s.t0) * 1.3) * .5 + .5;
    var ax = 300, ay = 900;
    g.fillStyle = PINK; g.beginPath(); g.moveTo(ax - 120, 1180); g.quadraticCurveTo(ax - 120, 1030, ax - 50, 1020); g.lineTo(ax + 50, 1020); g.quadraticCurveTo(ax + 120, 1030, ax + 120, 1180); g.closePath(); g.fill();
    g.fillStyle = SAND; var hl = 30 + hairK * 120; g.beginPath(); g.ellipse(ax, ay - 10, 92, 96, 0, Math.PI, 0); g.lineTo(ax + 92, ay - 10 + hl); g.lineTo(ax - 92, ay - 10 + hl); g.closePath(); g.fill();
    g.fillStyle = '#f4d7bf'; g.beginPath(); g.ellipse(ax, ay + 10, 70 + faceK * 8, 84, 0, 0, 6.2832); g.fill();
    /* the controls */
    font(g, 40, 600, MONO); ls(g, 3); g.fillStyle = CREAM; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('GENDER', 500, 700); g.fillText('FACE', 500, 870); g.fillText('HAIR', 500, 1010); ls(g, 0);
    rr(g, 500, 735, 360, 76, 38); g.fillStyle = BG; g.fill();
    var kx = lerp(500, 680, tg); rr(g, kx + 6, 741, 168, 64, 32); g.fillStyle = tg > .5 ? PINK : TEAL; g.fill();
    font(g, 44, 900); g.textAlign = 'center'; g.fillStyle = tg > .5 ? CREAM : BG; g.fillText('M', 590, 775); g.fillStyle = tg > .5 ? BG : CREAM; g.fillText('F', 770, 775);
    [[920, faceK], [1060, hairK]].forEach(function (r) { g.fillStyle = 'rgba(255,243,230,.25)'; rr(g, 500, r[0] - 6, 360, 12, 6); g.fill(); g.fillStyle = TEAL; rr(g, 500, r[0] - 6, 360 * r[1], 12, 6); g.fill(); g.beginPath(); g.arc(500 + 360 * r[1], r[0], 22, 0, 6.2832); g.fillStyle = CREAM; g.fill(); });
    /* her NAME field pops on "But": empty, a cursor blinking; it flashes pink and shakes after "past" (nothing to enter) */
    var kb = pop(t, tN);
    if (kb > 0) {
      var sh = t > tX ? Math.exp(-(t - tX) * 7) * Math.sin((t - tX) * 46) * 14 : 0, fl = t > tX && t < tX + .5;
      g.save(); g.translate(sh, 0); g.globalAlpha *= clamp(kb * 2, 0, 1);
      font(g, 40, 600, MONO); ls(g, 3); g.fillStyle = CREAM; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('NAME', 500, 1142); ls(g, 0);
      rr(g, 630, 1108, 230, 68, 14); g.fillStyle = BG; g.fill(); g.strokeStyle = fl ? PINK : 'rgba(255,243,230,.6)'; g.lineWidth = fl ? 6 : 3; g.stroke();
      if (Math.floor(t * 2.6) % 2 === 0) { g.fillStyle = TEAL; g.fillRect(648, 1122, 6, 40); }
      g.restore();
    }
    g.restore();
    chip(g, 'RE-CREATED', 800, 630, { px: 36, bg: PINK, fg: BG, fam: MONO, wt: 600, rot: .08, s: Math.min(kin, 1), a: kin * 2 });
    var ky = pop(t, tM + .1), ks = pop(t, T_BLANK);
    chip(g, 'YOU BUILD HER', CX, 1292, { px: 56, bg: CREAM, fg: BG, rot: .02, s: ky, a: ky * 2 });
    chip(g, 'NO NAME · NO PAST', CX, 1380, { px: 56, bg: PINK, fg: BG, rot: -.02, s: ks, a: ks * 2 });
  }

  /* ---------- past + fight: the empty slot lights pink, a case folder flies in and opens on Rockstar's sentence ---------- */
  var QUOTE = ['“Lucia’s father taught', 'her to fight as soon', 'as she could walk.”'];
  function gloves(g, x, y, t, k) {
    var pu = t > T_PUNCH ? Math.exp(-(t - T_PUNCH) * 5) * Math.sin((t - T_PUNCH) * 16) : 0;
    g.save(); g.globalAlpha *= k; g.translate(x, y);
    g.strokeStyle = CREAM; g.lineWidth = 6; g.lineCap = 'round';
    g.fillStyle = CREAM; g.fillRect(-60, -20, 120, 10);
    [-1, 1].forEach(function (sd, j) {
      g.save(); g.translate(sd * 40, -10); g.rotate(Math.sin(t * 2.1 + j * 1.3) * .14 + (j === 0 ? -pu * .9 : 0));
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 46); g.stroke();
      g.translate(0, 112);
      g.fillStyle = sd < 0 ? PINK : TEAL; rr(g, -50, -66, 100, 124, 44); g.fill();
      rr(g, -40, 48, 80, 36, 10); g.fillStyle = CREAM; g.fill();
      g.fillStyle = sd < 0 ? shade('#ff4fa3', .7) : shade('#19d3c5', .7); g.beginPath(); g.ellipse(sd * -30, -6, 22, 36, sd * .3, 0, 6.2832); g.fill();
      g.restore();
    });
    g.restore();
  }
  var T_OPEN = at('past', 'lucia') + .32;
  function scenePast(g, t) {
    var s = SC[S.past], tL = start('past') + .05, tG = at('past', 'lucia') + .02, tO = T_OPEN;
    var kw = pop(t, s.t0 - .22, 2.6, .85), z = eio(seg(t, tG, tG + .4)), open = eio(seg(t, tO, tO + .3));
    /* the wall again, dimmed; LUCIA's slot lights */
    wallBack(g, t, clamp(kw * 2, 0, 1) * (1 - .6 * z));
    for (var i = 0; i < 13; i++) { var xy = slotXY(i); leadCard(g, i, xy[0], xy[1], clamp(kw * 2, 0, 1) * lerp(.5, .18, z), false, 1); }
    var e = slotXY(13), glow = seg(t, tL, tL + .15) * (.75 + .25 * Math.sin(t * 9));
    emptySlot(g, e[0], e[1], clamp(kw * 2, 0, 1) * (1 - z * .5), glow);
    /* the folder: from the right into the slot, then up to the middle */
    var fk = eo(seg(t, tL + .05, tL + .32));
    if (fk > 0) {
      var sx = lerp(e[0] + CW / 2 + 500 * (1 - fk), CX, z), sy = lerp(e[1] + CH / 2, 872, z), fs = lerp(CW / 740, .92, z);
      g.save(); g.translate(sx, sy); g.rotate(lerp(.04, -.015, z)); g.scale(fs, fs);
      /* back of the folder + the paper inside */
      rr(g, -370 + 12, -280 + 16, 740, 600, 30); g.fillStyle = 'rgba(0,0,0,.45)'; g.fill();
      rr(g, -370, -350, 520, 100, 22); g.fillStyle = shade('#ff8a3d', .8); g.fill();
      rr(g, -370, -280, 740, 600, 30); g.fillStyle = shade('#ff8a3d', .8); g.fill();
      if (z > .55) { g.save(); g.globalAlpha *= seg(z, .55, .9); font(g, 50, 900); g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LUCIA CAMINOS', -110, -312); g.restore(); }
      rr(g, -340, -250, 680, 540, 18); g.fillStyle = CREAM; g.fill();
      if (open > 0) {
        g.save(); g.globalAlpha *= clamp(open * 2 - .3, 0, 1);
        g.font = 'italic 400 68px ' + SERIF; g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle';
        var QY = -178, QL = 84;
        var hlF = seg(t, at('fight', 'father') - .03, at('fight', 'father') + .2), hlT = seg(t, at('fight', 'fight') - .03, at('fight', 'fight') + .2);
        QUOTE.forEach(function (ln, li) { g.fillText(ln, 0, QY + li * QL); });
        /* underline the words as they are spoken: "father", "fight" */
        g.fillStyle = PINK;
        if (hlF > 0) { var w0 = g.measureText('“Lucia’s ').width, w1 = g.measureText('father').width, lw = g.measureText(QUOTE[0]).width; g.fillRect(-lw / 2 + w0, QY + 38, w1 * hlF, 8); }
        if (hlT > 0) { var v0 = g.measureText('her to ').width, v1 = g.measureText('fight').width, lv = g.measureText(QUOTE[1]).width; g.fillRect(-lv / 2 + v0, QY + QL + 38, v1 * hlT, 8); }
        /* the source, two lines, 44 px here = 40 px on screen */
        font(g, 44, 600, MONO); ls(g, 2); g.fillStyle = shade('#ff4fa3', .85); g.fillText('ROCKSTARGAMES.COM/VI', 0, 206); g.fillText('ONLY-IN-LEONIDA/LUCIA', 0, 254); ls(g, 0);
        g.restore();
        /* in the pause after "her own": Rockstar's next sentence, as an ink stamp on the same page */
        var kp = T_PEN <= t ? clamp(sp(t, T_PEN, 3.6, .7), 0, 1.1) : 0;
        if (kp > 0) {
          g.save(); g.translate(0, 98); g.rotate(-.05); var ps = lerp(1.25, 1, Math.min(kp, 1)); g.scale(ps, ps); g.globalAlpha *= clamp(kp * 3, 0, 1);
          g.strokeStyle = PINK; g.fillStyle = PINK; g.lineWidth = 6; rr(g, -250, -62, 500, 124, 14); g.stroke(); g.lineWidth = 2; rr(g, -238, -50, 476, 100, 10); g.stroke();
          g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, 46, 900); ls(g, 4); g.fillText('LEONIDA', 0, -20); font(g, 40, 900); ls(g, 3); g.fillText('PENITENTIARY', 0, 26); ls(g, 0);
          g.restore();
        }
      }
      /* the cover, with the tab name; swings up and away on open */
      if (open < 1) {
        g.save(); g.translate(0, -280); g.scale(1, lerp(1, -.08, open)); g.translate(0, 280); g.globalAlpha *= open > .9 ? (1 - open) * 10 : 1;
        rr(g, -370, -280, 740, 600, 30); g.fillStyle = ORG; g.fill();
        if (z > .6) {
          g.globalAlpha *= seg(z, .6, 1);
          font(g, 64, 600, MONO); ls(g, 8); g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CASE FILE', 0, 0); ls(g, 0);
          g.strokeStyle = BG; g.lineWidth = 4; g.strokeRect(-230, -70, 460, 140);
        }
        g.restore();
      }
      g.restore();
    }
    /* below the folder, once it is open: her gloves on a hook */
    var gd = eo(seg(t, T_GLOVE, T_GLOVE + .22));
    if (gd > 0) { g.save(); g.translate(0, (1 - gd) * -160); gloves(g, CX, 1206, t, clamp(gd * 3, 0, 1)); g.restore(); }
  }

  /* ---------- first: the payoff. The wall with LUCIA lit, the claim, then the 25 YEARS stamp in the pause ---------- */
  var CLAIM = [['FIRST', 'WOMAN'], ['WRITTEN', 'TO', 'LEAD'], ['A', 'GTA', 'STORY']];
  function claimBlock(g, t, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; font(g, 74, 900); g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    var hiF = t >= at('first', 'first') - .05, hiW = t >= at('first', 'wrote') - .05;
    CLAIM.forEach(function (ln, li) {
      var ws = ln.map(function (w) { return g.measureText(w).width; }), gap = 22, tot = ws.reduce(function (p, c) { return p + c; }, 0) + gap * (ln.length - 1), x = CX - tot / 2, y = 378 + li * 86;
      ln.forEach(function (w, i) {
        var on = (li === 0 && hiF) || (w === 'WRITTEN' && hiW);
        if (on) { g.fillStyle = w === 'WRITTEN' ? ORG : PINK; rr(g, x - 10, y - 64, ws[i] + 20, 80, 14); g.fill(); }
        g.fillStyle = on ? BG : CREAM; g.fillText(w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }
  function sceneFirst(g, t) {
    var s = SC[S.first], tW = at('first', 'woman') - .05, tLd = at('first', 'wrote') - .08, tE = start('end') - .2, m = eio(seg(t, tE, tE + .45));
    var kw = pop(t, s.t0 - .22, 2.6, .85);
    claimBlock(g, t, clamp(kw * 2, 0, 1) * (1 - m));
    var wa = clamp(kw * 2, 0, 1) * (1 - m);
    wallBack(g, t, wa);
    for (var i = 0; i < 13; i++) { var xy = slotXY(i); leadCard(g, i, xy[0], xy[1], wa * .34, false, 1); }
    var e = slotXY(13), kl = pop(t, tW, 3, .6), snapK = t > T_SNAP ? Math.exp(-(t - T_SNAP) * 6) * .14 : 0;
    if (kl > 0) leadCard(g, 13, e[0], e[1], wa * clamp(kl * 2, 0, 1), true, lerp(1.25, 1, clamp(kl, 0, 1)) + .03 * Math.sin(t * 4) + snapK);
    else emptySlot(g, e[0], e[1], wa, 1);
    /* frame 0's tally comes back: 24 strokes sweep the wall in 0.4 s, the 25th flies to LUCIA, snaps on the bell and cracks */
    if (t >= T_SW) {
      var TY = 958, ta = wa * (1 - seg(t, T_STAMP + .1, T_STAMP + .4)), shown = Math.min(24, Math.floor((t - T_SW) / (.3 / 24)) + 1);
      tally(g, CX, TY, t, 1, null, ta * .95, shown);
      var p = strokePts(24, t), fly = eio(seg(t, T_SNAP - .12, T_SNAP));
      if (t >= T_SNAP - .12) {
        var lx = e[0] + CW / 2, ly = e[1] + CH / 2 - 10, mx = lerp(CX + (p[0] + p[2]) / 2, lx, fly), my = lerp(TY + (p[1] + p[3]) / 2, ly, fly);
        var hl = 66 * lerp(1, 1.4, fly), ck = eo(seg(t, T_SNAP, T_SNAP + .14)), fall = seg(t, T_SNAP + .04, T_SNAP + .34);
        g.save(); g.globalAlpha *= wa * (1 - fall); g.lineCap = 'round'; g.lineWidth = lerp(13, 18, fly); g.strokeStyle = ORG;
        [-1, 1].forEach(function (sd) {
          g.save(); g.translate(mx + sd * 26 * ck, my + sd * 8 * ck + fall * fall * 140); g.rotate(-.55 + sd * .5 * ck);
          g.beginPath(); g.moveTo(0, 0); g.lineTo(sd * hl, 0); g.stroke(); g.restore();
        });
        g.restore();
      }
    }
    var kc = pop(t, tLd);
    chip(g, 'CO-LEAD · WITH JASON', CX, 1372, { px: 56, bg: PINK, fg: BG, rot: -.02, s: kc, a: kc * 2 * (1 - m) });
    /* the end vote: two equal cards, neither lit */
    if (m > 0) endVote(g, t, m);
    /* the hero stamp slams in the pause after "story", then rides up for the vote */
    if (t >= T_STAMP) {
      var k = sp(t, T_STAMP, 3.4, .8), sc = lerp(1.05, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1);
      var up = eio(seg(t, tE, tE + .5));
      heroStamp(g, CX, lerp(905, 486, up), sc * lerp(1, .9, up), lerp(-.08, -.04, up), al);
    }
  }
  function endVote(g, t, m) {
    var tC = start('end') - .1;
    [['JASON', TEAL, 300, tC], ['LUCIA', PINK, 720, tC]].forEach(function (c) {
      var k = pop(t, c[3], 2.8, .75);
      if (k <= 0) return;
      g.save(); g.globalAlpha *= clamp(k * 2, 0, 1) * m; g.translate(c[2], 960 + Math.sin(t * 2.4) * 6); g.scale(Math.min(k, 1.04), Math.min(k, 1.04));
      rr(g, -175 + 8, -250 + 12, 350, 500, 32); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill();
      rr(g, -175, -250, 350, 500, 32); g.fillStyle = PANEL2; g.fill(); rr(g, -175, -250, 350, 500, 32); g.strokeStyle = c[1]; g.lineWidth = 8; g.stroke();
      g.save(); g.translate(0, -230); g.scale(2, 2); bust(g, 0, 0, c[1], false); g.restore();
      rr(g, -150, 90, 300, 100, 16); g.fillStyle = BG; g.fill();
      font(g, 80, 900); g.fillStyle = c[1]; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c[0], 0, 144);
      g.restore();
    });
    var ko = pop(t, tC + .15);
    chip(g, 'OR', CX, 960, { px: 52, bg: CREAM, fg: BG, s: ko, a: ko * 2 * m });
    var kq = pop(t, start('end') - .15);
    chip(g, 'WHO’S YOUR PICK?', CX, 1340, { px: 70, bg: CREAM, fg: BG, rot: -.02, s: kq, a: kq * 2 * m });
  }

  /* =====================================================================================================
     FRAME
     ===================================================================================================== */
  var SCENES = { hook: function (g, t) { hookFrame(g, t, true); }, meet: sceneMeet, three: sceneThree, wall: sceneWall, sel: sceneSel, online: sceneOnline, past: scenePast, first: sceneFirst };
  function drawScene(g, t, si) {
    g.save(); clipSafe(g);     // nothing a scene draws can leave the safe rect, entrances included
    var Sc = SC[si];
    if (si > 0) { var push = 1 + .012 * seg(t, Sc.t0, Sc.t1); g.translate(CX, 960); g.scale(push, push); g.translate(-CX, -960); }
    SCENES[Sc.id](g, t);
    g.restore();
  }
  /* the wipe: a narrow torn band moving along x, clipped to the safe rect; the next scene is already under it */
  var WIPE_HALF = .2;
  function wipeAt(t) { for (var i = 1; i < SC.length; i++) if (t >= SC[i].t0 - WIPE_HALF && t <= SC[i].t0 + WIPE_HALF) return i; return -1; }
  function tornX(bx, y, side) { return bx + (hash(Math.floor(y / 44) + side * 7) - .5) * 64; }
  function bandPath(g, bx, w) {
    g.beginPath(); g.moveTo(tornX(bx, 0, 0) - w, RY0 - 50);
    for (var y = RY0 - 44; y <= RY1 + 44; y += 44) g.lineTo(tornX(bx, y, 0) - w, y);
    for (var y2 = RY1 + 44; y2 >= RY0 - 44; y2 -= 44) g.lineTo(tornX(bx, y2, 1) + w, y2);
    g.closePath();
  }
  function stageK(si) { return si === 0 ? 0 : .2; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    var si = sceneAt(t), wi = wipeAt(t);
    stage(g, t, stageK(si));
    if (wi > 0) {
      var p = eio(seg(t, SC[wi].t0 - WIPE_HALF, SC[wi].t0 + WIPE_HALF)), bx = lerp(RX0 - 120, RX1 + 120, p);
      g.save(); g.beginPath(); g.moveTo(0, RY0 - 50); for (var ya = RY0 - 44; ya <= RY1 + 44; ya += 44) g.lineTo(tornX(bx, ya, 0), ya); g.lineTo(0, RY1 + 50); g.closePath(); g.clip();
      g.fillStyle = BG; g.fillRect(0, 0, W, H); stage(g, t, stageK(wi)); INCOMING = true; drawScene(g, t, wi); INCOMING = false; g.restore();
      g.save(); g.beginPath(); g.moveTo(W, RY0 - 50); for (var yb = RY0 - 44; yb <= RY1 + 44; yb += 44) g.lineTo(tornX(bx, yb, 1), yb); g.lineTo(W, RY1 + 50); g.closePath(); g.clip();
      drawScene(g, Math.min(t, SC[wi - 1].t1 - .001), wi - 1); g.restore();
      g.save(); clipSafe(g);
      [[TEAL, -24], [ORG, 24], [PINK, 0]].forEach(function (c) { g.save(); g.translate(c[1], 0); bandPath(g, bx, 20); g.fillStyle = c[0]; g.fill(); g.restore(); });
      g.restore();
    } else drawScene(g, t, si);
    if (LIVE.text) captions(g, t, wipeHide(t));
    /* home: dissolve into frame 0, already moving (T runs up to 0 at the last frame) */
    var back = eio(seg(t, HOME, HOME + HOMEK));
    if (back > 0) { g.save(); g.globalAlpha = back; g.fillStyle = BG; g.fillRect(0, 0, W, H); hookFrame(g, t - DUR, false); g.restore(); }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

  /* ---------- captions: upper third (y 310–490), stressed words only; the hook, the claim and the vote are carried by the picture ---------- */
  var NOCAP = { hook: 1, first: 1, end: 1 };
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (NOCAP[l.id]) return;
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) { cur.push(w); if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { out.push(cur); cur = []; } });
      if (cur.length) out.push(cur);
    });
    return out.map(function (ws) { return { t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  var STRESS = [['meet', 'lucia'], ['meet', 'jason'], ['ask', 'streak'], ['three', '3d'], ['three', '2001'], ['men', 'every'], ['men', 'wrote'], ['men', 'man'],
    ['names', 'tommy'], ['names', 'cj'], ['names', 'niko'], ['names', 'trevor'], ['but', 'woman'], ['but', '1997'], ['same', 'same'], ['same', 'look'],
    ['online', 'online'], ['online', 'blank'], ['past', 'past'], ['fight', 'father'], ['fight', 'fight']]
    .map(function (p) { return at(p[0], p[1]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function wipeHide(t) {
    var a = 1; for (var i = 1; i < SC.length; i++) a = Math.min(a, 1 - seg(t, SC[i].t0 - WIPE_HALF - .05, SC[i].t0 - WIPE_HALF) * (1 - seg(t, SC[i].t0 + WIPE_HALF, SC[i].t0 + WIPE_HALF + .05)));
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, her: 1 };
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.t0 - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .1), o0 = Math.min(card0.t1 + .35, o1 - .1);
    var fi = seg(t, card0.t0 - .04, card0.t0 + .04), out = 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - card0.t0 + .04, 3.2, .8), 0, 1.04);
    var cpx = 72, maxw = 800;
    g.save(); font(g, cpx, 800, DISP, 'expanded'); g.textBaseline = 'alphabetic';
    var words = card0.words, ws, gap, lines, lw;
    function meas() { ws = words.map(function (w) { return g.measureText(w.w).width; }); gap = cpx * .28; }
    function lay() {
      lines = [[]]; lw = [0];
      words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; });
      for (var L = 0; L < lines.length - 1; L++) { var last = lines[L][lines[L].length - 1]; while (lines[L].length > 1 && GLUE[norm(words[last].w)]) { lines[L].pop(); lines[L + 1].unshift(last); last = lines[L][lines[L].length - 1]; } }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    meas(); lay();
    while ((lines.length > 2 || Math.max.apply(null, lw) - gap > maxw) && cpx > 52) { cpx -= 4; font(g, cpx, 800, DISP, 'expanded'); meas(); lay(); }
    var lh = cpx * 1.2, y0 = 420 - (lines.length - 1) * lh / 2 + cpx * .3;
    g.globalAlpha = fi * out * (alpha == null ? 1 : alpha);
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 30;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = PINK; rr(g, x - 12, y - cpx * .84, ws[i] + 24, cpx * 1.06, 16); g.fill(); }
        g.fillStyle = cur ? BG : CREAM;
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }

  /* ---------- text dwell for the read check ---------- */
  function TEXTS(t) {
    var out = [];
    function T(id, text, a, b) { if (t >= a && t < b) out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    function cut(id) { return SC[S[id]].t0 - .1; }   // the torn band reaches the middle of the frame at t0
    T('gta', 'GTA 6', 0, cut('meet')); T('gta', 'GTA 6', HOME + .3, DUR + 1);
    T('25', '25 YEAR STREAK', 0, cut('meet')); T('25', '25 YEAR STREAK', HOME + .3, DUR + 1);
    T('since', 'SINCE 2001', at('hook', 'ends') + .12, cut('meet'));
    T('lucia', 'LUCIA', at('meet', 'lucia'), cut('three'));
    T('jason', 'JASON', at('meet', 'jason'), cut('three'));
    T('rsq', '“…Jason and Lucia’s story…”', at('meet', 'lucia') + .45, cut('three'));
    T('rss', 'ROCKSTAR · ROCKSTARGAMES.COM/VI', at('meet', 'lucia') + .5, cut('three'));
    T('what', 'WHAT STREAK?', T_SHRINK + .15, cut('three'));
    T('g3', 'GTA III · OCT 2001', SC[S.three].t0 + .35, cut('wall'));
    T('f3', 'THE STREAK STARTS', at('three', 'took'), cut('wall'));
    T('sl', 'WRITTEN LEADS · 2001–2025', SC[S.wall].t0 + .1, cut('sel'));
    T('men', 'EVERY ONE A MAN', T_MAN + .1, cut('sel'));
    T('g97', 'GTA (1997) · TOP-DOWN', SC[S.sel].t0 + .1, cut('online'));
    T('4of8', '4 OF 8 PICKS WERE WOMEN', SC[S.sel].t0 + .45, start('same') + .05);
    T('src97', 'VIA WIKIPEDIA · LEVELUP', SC[S.sel].t0 + .28, start('same') + .1);
    T('look', 'LOOK ONLY', start('same') + .1, cut('online'));
    T('onl', 'GTA ONLINE · 2013', SC[S.online].t0 + .1, cut('past'));
    T('build', 'YOU BUILD HER', at('online', 'make') + .05, cut('past'));
    T('blank', 'NO NAME · NO PAST', T_BLANK + .05, cut('past'));
    T('case', 'LUCIA CAMINOS', T_OPEN - .05, cut('first'));
    T('quote', '“Lucia’s father taught her to fight as soon as she could walk.”', T_OPEN + .15, cut('first'));
    T('qsrc', 'ROCKSTARGAMES.COM/VI ONLY-IN-LEONIDA/LUCIA', T_OPEN + .2, cut('first'));
    T('pen', 'LEONIDA PENITENTIARY', T_PEN + .05, cut('first'));
    T('claim', 'FIRST WOMAN WRITTEN TO LEAD A GTA STORY', SC[S.first].t0 + .1, start('end') - .1);
    T('colead', 'CO-LEAD · WITH JASON', at('first', 'wrote') + .02, start('end') - .1);
    T('stamp', '25 YEARS', T_STAMP + .1, HOME + .2);
    T('stamp2', 'SINCE GTA III · 2001', T_STAMP + .1, HOME + .2);
    T('vJ', 'JASON', start('end') + .05, HOME + .2);
    T('vL', 'LUCIA', start('end') + .05, HOME + .2);
    T('pick', 'WHO’S YOUR PICK?', start('end') - .05, HOME + .2);
    return out;
  }

  /* ---------- events: hits placed in pauses by the gate; beats with no free pause stay silent ---------- */
  function initTimes() {
    var i;
    /* frame 0: a knock before the first word (pinned: the voice starts at 0.2 s; Whisper pins the first word to 0.00) */
    EV.push({ t: 0, type: 'knock', g: .6, id: 'k0' });
    /* every sound sits in a pause, 0.2 s clear of the words vo.js has and Whisper heard in the mix; its picture beat sits on it */
    G('crack', at('hook', 'ends'), 'tick', .1, 1.4, { m: .15 });    // silent unless Whisper hears a gap there
    G('tape', T_TAPE, 'slap', .06, .9);
    G('shrink', T_SHRINK - .02, 'slide', .08, .6);
    G('q', T_Q, 'thump', .06, .7);
    G('w_wall', SC[S.wall].t0 - WIPE_HALF, 'tearS', .1, 2.4);
    /* the native move's sound: a placard tick as each card lands (row one in the pause, the rest where the gate allows) */
    for (i = 0; i < 13; i++) G('card' + i, cardIn(i) + .15, 'flap', .06, 1.1, { m: .15 });
    G('man', T_MAN, 'thump', .06, .9);
    HOPS.forEach(function (h) { G('hop_' + h[0], h[2], 'click', .1, 1.1, { m: .15 }); });
    G('w_sel', SC[S.sel].t0 - WIPE_HALF, 'tearS', .1, 2.4, { m: .15 });
    G('click', vend('but') + .08, 'click', .1, 1);
    G('eq', T_EQ, 'eq', .1, 1, { m: .15 });
    G('w_online', SC[S.online].t0 - WIPE_HALF, 'tearS', .1, 2.4, { m: .15 });
    G('blank', T_X, 'blank', .08, 2.2, { m: .15 });
    G('w_past', SC[S.past].t0 - WIPE_HALF, 'tear', .1, 2.4);
    G('pen', T_PEN, 'slap', .08, .8);
    G('punch', T_PUNCH + .02, 'thump', .1, .8);
    for (i = 0; i < 6; i++) G('sw' + i, T_SW + .02 + i * .05, 'tick', .04, 1.6, { m: .15 });
    G('hero', T_SNAP, 'hero', .06, .55, { m: .2 });
    G('home', HOME - .05, 'swish', .25, 2);
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

  /* ---------- sound effects only (no music; Isac adds a trending sound on the platform) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .8;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (var i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, pts, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function tick(t, g) { var n = noise(t, .03), bp = ac.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 3200; var o = bus(1, (rnd() - .5) * .3); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .16 * (g || 1)], [t + .024, 0]]); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .2, [[t, 0], [t + .004, g || .4], [t + .14, 0]]); o.frequency.exponentialRampToValueAtTime(50, t + .12); }
    function knock(t, g) { thump(t, .5 * g); var n = noise(t, .06), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 1.5; var o = bus(1); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .3 * g], [t + .05, 0]]); }
    function slap(t, g) { var n = noise(t, .2), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = .8; var o = bus(1, -.1); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, .45 * g], [t + .05, .12 * g], [t + .18, 0]]); thump(t + .01, .45 * g); band(t - .08, t + .02, 600, 3000, .05 * g, .08 * g, 1.2); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, [[t, 0], [t + .004, .16 * (g || 1)], [t + .1, 0]]); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function flap(t, g) { var n = noise(t, .07), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 1.2; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .003, .3 * g], [t + .06, 0]]); thump(t + .02, .15 * g); }
    function tear(t, t1, g) { band(t, t1, 700, 2600, .06 * g, .04 * g, 1.8); for (var j = 0; j < 4; j++) tick(t + (t1 - t) * (j + .5) / 4, .14 * g); }
    function click(t, g) { band(t, t + .03, 4200, 4200, .3 * g, .1 * g, 6); thump(t, .15 * g); }
    function ding(t, g) { [[1319, .1], [1976, .06], [2637, .03]].forEach(function (p, j) { osc('sine', p[0], t + j * .02, t + .5, [[t + j * .02, 0], [t + j * .02 + .005, p[1] * g], [t + .45, 0]], (j - 1) * .3); }); }
    function whirr(t, g) { var o = osc('triangle', 90, t, t + .32, [[t, 0], [t + .1, .05 * g], [t + .3, 0]]); o.frequency.exponentialRampToValueAtTime(260, t + .3); band(t, t + .3, 600, 2400, .04 * g, .02 * g, 2); }
    function cross(t, g) { band(t, t + .09, 2500, 1200, .12 * g, .05 * g, 2); band(t + .09, t + .19, 2500, 1200, .12 * g, .05 * g, 2); }
    function slide(t, g) { band(t, t + .24, 500, 1800, .08 * g, .03 * g, 1.2); thump(t + .2, .25 * g); }
    /* the hero: a heavy stamp and a "streak broken" register bell */
    /* the hero: the 25th stroke snaps on a "streak broken" register bell, the heavy stamp lands 0.15 s later */
    function hero(t, g) {
      click(t, .8 * g);
      [[88, .07], [95, .045], [100, .03]].forEach(function (p, j) { var a = t + j * .03; osc('sine', mtof(p[0]), a, a + .5, [[a, 0], [a + .005, p[1] * g], [a + .45, 0]], (j - 1) * .35); });
      var s = t + .15;
      thump(s, .8 * g); var o0 = osc('sine', 70, s, s + .3, [[s, 0], [s + .006, .35 * g], [s + .28, 0]]); o0.frequency.exponentialRampToValueAtTime(40, s + .25);
      var n = noise(s, .16), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; var o = bus(1); n.connect(lp); lp.connect(o); env(o.gain, [[s, 0], [s + .004, .4 * g], [s + .12, 0]]);
    }
    EV.forEach(function (e) {
      var g = e.g == null ? 1 : e.g;
      if (e.type === 'knock') knock(e.t, g);
      else if (e.type === 'slap') slap(e.t, g);
      else if (e.type === 'pop') popS(e.t, g);
      else if (e.type === 'flap') flap(e.t, g);
      else if (e.type === 'tear') tear(e.t, e.t + .28, g);
      else if (e.type === 'tearS') tear(e.t, e.t + .18, g);
      else if (e.type === 'thump') { thump(e.t, .5 * g); tick(e.t, .3 * g); }
      else if (e.type === 'tick') tick(e.t, g);
      else if (e.type === 'click') click(e.t, g);
      else if (e.type === 'ding') ding(e.t, g);
      else if (e.type === 'chime') [[1568, .09], [2093, .05]].forEach(function (p, j) { var a = e.t + j * .03; osc('sine', p[0], a, a + .3, [[a, 0], [a + .004, p[1] * g], [a + .25, 0]], (j - .5) * .4); });
      else if (e.type === 'whirr') whirr(e.t, g);
      else if (e.type === 'cross') cross(e.t, g);
      else if (e.type === 'eq') [[1047, .07], [1047, .07]].forEach(function (p, j) { var a = e.t + j * .06; osc('sine', p[0], a, a + .1, [[a, 0], [a + .004, p[1] * g], [a + .05, 0]], (j - .5) * .3); });
      else if (e.type === 'blank') { var bz = osc('square', 110, e.t, e.t + .2, [[e.t, 0], [e.t + .01, .035 * g], [e.t + .17, .02 * g], [e.t + .19, 0]]); thump(e.t, .2 * g); }
      else if (e.type === 'slide') slide(e.t, g);
      else if (e.type === 'hero') hero(e.t, g);
      else if (e.type === 'swish') band(e.t, e.t + .24, 900, 5200, .1 * g, .02, 1.6);
    });
    /* no music: Isac adds a trending sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    env(master.gain, [[0, .8], [DUR - .3, .8], [DUR, .6]]);
    /* room tone (about −50 dB in the pauses), so no pause and no loop seam is ever digital zero */
    (function () { var o = bus(1), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = ROOM; })();
  }
  var ROOM = .03;

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 84px Archivo', '800 84px Archivo', '600 46px Archivo', '500 36px "Geist Mono"', '600 36px "Geist Mono"', 'italic 400 64px "Instrument Serif"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%·…“”’?–'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }

  initTimes();
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: Math.round((T_STAMP + .4) * 30) / 30, SLUG: 'gta-lucia', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
