/* "GTA 5 vs GTA 6: Every Trailer, Side by Side": Delta long-form L1 (YouTube, 16:9, 1920x1080).
   Six chapters, each a title card; every comparison is the split seam: GTA 5 on the left in a cool grade,
   GTA 6 on the right with the one hot accent. Short muted excerpts of Rockstar's own videos (GTA V Trailer 2011,
   GTA V Official Trailer and Gameplay Video 2013, GTA VI Trailer 1, Trailer 2, An Extended Look, Launch Trailer)
   play inside the two panels as evidence, each under 5 s, with our own slates, cards and charts between them
   (film/kit/clip.js, clips.json, linted by delta/clips/clipkit.py). Dimmed background plates (SAFE-EDIT rule 11)
   sit under the chapter cards and number scenes. No Rockstar logos or key art; the end-card dates are redrawn.
   Narrated first and cut to the voice: every beat is keyed to a word time from vo/vo.js with at(id, word); every
   hit sits in a pause the voice track really leaves (vo/vad.js). Pure function of t. Contract: window.FILM, DUR,
   render(t), READY, EV, TEXTS(t), SCORE(ctx). No music. Facts and sources: BRIEF.md. */
(function () {
  'use strict';
  var W = 1920, H = 1080, VO = window.VO, DUR = VO.dur, CLIP = window.CLIP, TAU = Math.PI * 2;
  var BG = '#0c0e13', BG2 = '#151923', PANEL = '#161a24', PANEL2 = '#1d2230', CREAM = '#f3efe6', DIM = 'rgba(243,239,230,.62)', FAINT = 'rgba(243,239,230,.16)';
  var ACC = '#ff5a36', ACC2 = '#ff7a52', COOL = '#9db0c6', COOLD = '#2a313f', INK = '#0c0e13';
  var DISP = 'Archivo', MONO = '"Geist Mono"';
  var PL = { x: 70, y: 180, w: 870, h: 490 }, PR = { x: 980, y: 180, w: 870, h: 490 };

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function ss(k) { return k * k * (3 - 2 * k); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* critically damped settle 0 -> 1, no overshoot (no bouncy easing) */
  function cd(t, a, w) { if (t <= a) return 0; var u = (t - a) * (w || 14); return 1 - (1 + u) * Math.exp(-u); }
  function fin(t, a, d) { return eo(seg(t, a, a + (d || .3))); }
  function fout(t, a, d) { return 1 - seg(t, a, a + (d || .25)); }
  function kn(t, a, amt) { if (t < a) return 1; var u = t - a; return 1 + (amt || .06) * (1 - Math.exp(-u * 40)) * Math.exp(-u * 7); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}, ORDER = []; VO.lines.forEach(function (l) { LINE[l.id] = l; ORDER.push(l.id); });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function find(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (!l) throw new Error('no line ' + id);
    if (typeof word === 'number') return l.words[Math.min(word, l.words.length - 1)];
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i];
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function at(id, word, nth) { return find(id, word, nth).t0; }
  function wend(id, word, nth) { return find(id, word, nth).t1; }
  function start(id) { return LINE[id].t0; }
  function lastw(id) { var w = LINE[id].words; return w[w.length - 1].t1; }
  function next(id) { var i = ORDER.indexOf(id); return ORDER[i + 1] ? start(ORDER[i + 1]) : DUR; }

  /* ---------- SFX gate: hits sit in pauses, clear of where the voice really sounds (vo/vad.js) ---------- */
  var EDGES = [], VOICED = [];
  if (window.VAD) window.VAD.forEach(function (v) { VOICED.push({ t0: v[0], t1: v[1] }); EDGES.push(v[0], v[1]); });
  else VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); });
  var FREE = null;
  function free(m) {
    var B = [], M = [], F = [], p = 0;
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = M[M.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else M.push(b.slice()); });
    M.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { swish: .26, stamp: .27, pop: .12, tick: .05, whoosh: .4, thump: .26, ding1: .5, slam: .3, card: .75, flip: .14, cross: .2, rise: .5 };
  function nearGap(t, type) {
    var bd = BODY[type] || .14, best = null;
    FREE = FREE || free(window.VAD ? .08 : .2);
    FREE.forEach(function (f) { var lo = f[0], hi = f[1] - bd; if (hi < lo) return; var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c; });
    return best;
  }
  var EV = [];
  /* a hit near t, moved into the nearest pause within tol; dropped (silent) when there is none */
  function G(t, type, o, tol) {
    var n = nearGap(t, type);
    if (n === null || Math.abs(n - t) > (tol == null ? .35 : tol)) return null;
    var e = { t: n, type: type }; if (o) for (var k in o) e[k] = o[k]; EV.push(e); return n;
  }

  /* a hero beat: the picture lands where its sound can sit (a real pause near the word), so no stamp is silent */
  var HT = {}, HDIFF = {}, ES = 0;
  /* prefers the first pause at or after the word (the picture answers the voice), else the nearest one before it */
  function HB(id, t, type, o, tol) {
    tol = tol == null ? 1.6 : tol; FREE = FREE || free(window.VAD ? .08 : .2);
    var bd = BODY[type] || .14, n = null;
    FREE.forEach(function (f) { var lo = Math.max(f[0], t - .1), hi = f[1] - bd; if (n === null && hi >= lo && lo - t <= tol) n = lo; });
    if (n === null) n = nearGap(t, type);
    if (n !== null && Math.abs(n - t) <= tol) { var e = { t: n, type: type }; if (o) for (var k in o) e[k] = o[k]; EV.push(e); HT[id] = n; }
    else HT[id] = t;
    HDIFF[id] = +(HT[id] - t).toFixed(2); return HT[id];
  }
  function h(id) { return HT[id]; }

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function font(g, px, wt, fam, wide) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); try { g.fontStretch = wide ? 'expanded' : 'normal'; } catch (e) {} }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0, r), 0, TAU); }
  function txt(g, s, x, y, px, col, o) {
    o = o || {};
    if (o.max) { font(g, px, o.wt || 800, o.fam, o.wide); ls(g, o.ls || 0); var w0 = g.measureText(s).width; if (w0 > o.max) px = px * o.max / w0; }
    font(g, px, o.wt || 800, o.fam, o.wide); ls(g, o.ls || 0);
    g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
    g.fillStyle = col || CREAM; g.fillText(s, x, y); var w = g.measureText(s).width; ls(g, 0); return w;
  }
  function tw(g, s, px, wt, fam, wide, l) { font(g, px, wt || 800, fam, wide); ls(g, l || 0); var w = g.measureText(s).width; ls(g, 0); return w; }
  /* a flat pill */
  function chip(g, s, x, y, o) {
    o = o || {}; var px = o.px || 40, a = o.a == null ? 1 : o.a; if (a <= 0) return 0;
    var w = tw(g, s, px, o.wt || 800, o.fam, o.wide, o.ls) + (o.pad == null ? px * .9 : o.pad * 2), h = px * 1.55;
    var x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    if (o.s != null) { g.translate(x0 + w / 2, y); g.scale(o.s, o.s); g.translate(-(x0 + w / 2), -y); }
    rr(g, x0, y - h / 2, w, h, o.r == null ? h / 2 : o.r); g.fillStyle = o.bg || CREAM; g.fill();
    if (o.line) { g.lineWidth = 2; g.strokeStyle = o.line; g.stroke(); }
    txt(g, s, x0 + w / 2, y + px * .04, px, o.fg || INK, { wt: o.wt || 800, fam: o.fam, wide: o.wide, ls: o.ls });
    g.restore(); return w;
  }
  function gtaChip(g, which, x, y, a, extra, align) {
    var s = (which === 5 ? 'GTA 5' : 'GTA 6') + (extra ? ' · ' + extra : '');
    return chip(g, s, x, y, { px: 38, a: a, bg: which === 5 ? COOLD : ACC, fg: which === 5 ? CREAM : INK, line: which === 5 ? 'rgba(157,176,198,.5)' : null, align: align || 'left', wide: false });
  }
  function tickMark(g, x, y, s, a, col) {
    if (a <= 0 || s <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.lineCap = g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-22, 0); g.lineTo(-6, 16); g.lineTo(24, -18); g.strokeStyle = col || ACC; g.lineWidth = 11; g.stroke(); g.restore();
  }
  function crossMark(g, x, y, s, a, col) {
    if (a <= 0 || s <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.lineCap = 'round';
    g.beginPath(); g.moveTo(-22, -22); g.lineTo(22, 22); g.moveTo(22, -22); g.lineTo(-22, 22); g.strokeStyle = col || ACC; g.lineWidth = 11; g.stroke(); g.restore();
  }
  /* a strike line drawn across a box, left to right */
  /* a soft light band across a rect, u 0..1 (keeps long holds alive without moving the layout) */
  function sheen(g, x, y, w, h, u, a) {
    if (u <= 0 || u >= 1 || a <= 0) return;
    var cx = lerp(x - 300, x + w + 300, u);
    g.save(); rr(g, x, y, w, h, 16); g.clip();
    var gr = g.createLinearGradient(cx - 220, y, cx + 220, y + h * .35);
    gr.addColorStop(0, 'rgba(255,240,225,0)'); gr.addColorStop(.5, 'rgba(255,240,225,' + a + ')'); gr.addColorStop(1, 'rgba(255,240,225,0)');
    g.fillStyle = gr; g.fillRect(x, y, w, h); g.restore();
  }
  /* a light band that passes over a card again and again between a and b: long holds never read as a still */
  function loopSheen(g, t, x, y, w, h, a, b, al) { if (t < a || t > b) return; sheen(g, x, y, w, h, ((t - a) % 1.7) / 1.4, al || .16); }
  function strike(g, x0, y, x1, k, col) { if (k <= 0) return; g.save(); g.strokeStyle = col || ACC; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y); g.lineTo(lerp(x0, x1, k), y - (x1 - x0) * .05 * k); g.stroke(); g.restore(); }

  /* ---------- background: ink, a slow warm/cool light that never stops moving ---------- */
  function stage(g, t) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var cx = W / 2 + Math.sin(t * .21) * 380, cy = H * .42 + Math.cos(t * .17) * 90;
    var r = g.createRadialGradient(cx, cy, 40, cx, cy, 1100); r.addColorStop(0, 'rgba(255,90,54,.10)'); r.addColorStop(.5, 'rgba(60,70,100,.08)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, W, H);
  }
  function plateLayer(g, t, dim) {
    var u = CLIP.activePlate(t); if (!u) return;
    var a = Math.min(fin(t, u.t0, .25), 1 - seg(t, u.t1 - .25, u.t1));
    g.save(); g.globalAlpha = a; CLIP.plate(g, t, 0, 0, W, H, { dim: dim == null ? .6 : dim, blur: 3 }); g.restore();
    var v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(12,14,19,.55)'); v.addColorStop(.5, 'rgba(12,14,19,.1)'); v.addColorStop(1, 'rgba(12,14,19,.75)');
    g.save(); g.globalAlpha = a; g.fillStyle = v; g.fillRect(0, 0, W, H); g.restore();
  }

  /* ---------- panels: a clip when one is on, our slate when not ---------- */
  var SRC = {}; /* clip name -> 5 or 6 */
  function useIn(list, t) { for (var i = 0; i < list.length; i++) if (list[i] && t >= list[i].t0 && t < list[i].t1) return list[i]; return null; }
  function slate(g, t, b, o) {
    rr(g, b.x, b.y, b.w, b.h, 18); g.fillStyle = PANEL; g.fill();
    /* a slow sweep so the slate is never a still card */
    g.save(); rr(g, b.x, b.y, b.w, b.h, 18); g.clip();
    var sx = b.x + ((t * 120) % (b.w + 600)) - 300, gr = g.createLinearGradient(sx - 200, 0, sx + 200, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.035)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(b.x, b.y, b.w, b.h);
    /* film-strip perforations, our own drawing of "a trailer" */
    g.fillStyle = 'rgba(243,239,230,.07)';
    for (var i = 0; i < 14; i++) { var px = b.x + 20 + ((i * 66 + t * 40) % (b.w - 20)); rr(g, px, b.y + 16, 34, 20, 4); g.fill(); rr(g, px, b.y + b.h - 36, 34, 20, 4); g.fill(); }
    g.restore();
    if (o && o.ta != null && o.ta < 1) { g.save(); g.globalAlpha *= o.ta; }
    if (o && o.big) txt(g, o.big, b.x + b.w / 2, b.y + b.h / 2 - (o.small ? 26 : 0), o.bpx || 96, o.col || (o.side === 6 ? ACC : CREAM), { wt: 900, wide: true, max: b.w - 90 });
    if (o && o.small) txt(g, o.small, b.x + b.w / 2, b.y + b.h / 2 + (o.bpx || 96) * .55 + 10, 38, DIM, { fam: MONO, wt: 600, ls: 2 });
    if (o && o.ta != null && o.ta < 1) g.restore();
  }
  var CREDIT = { v11: 'ROCKSTAR · GTA V TRAILER (2011)', vot: 'ROCKSTAR · GTA V OFFICIAL TRAILER', vgp: 'ROCKSTAR · GTA V GAMEPLAY VIDEO', t1: 'ROCKSTAR · GTA VI TRAILER 1', t2: 'ROCKSTAR · GTA VI TRAILER 2', lt: 'ROCKSTAR · GTA VI LAUNCH TRAILER', el: 'ROCKSTAR · AN EXTENDED LOOK' };
  function srcOf(u) { return CLIP.manifest().clips[u.clip].src; }
  /* o: { uses: [..], slate: {big, small}, note, side 5|6, a, ring: [nx, ny] } */
  function panel(g, t, b, o) {
    var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    rr(g, b.x + 10, b.y + 16, b.w, b.h, 18); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    var u = useIn(o.uses || [], t), ku = u ? Math.min(u.t0 <= .01 ? 1 : fin(t, u.t0, .14), 1 - seg(t, u.t1 - .12, u.t1)) : 0;
    slate(g, t, b, Object.assign({ side: o.side, ta: 1 - ku }, o.slate || {}));
    if (u) {
      var k = Math.min(u.t0 <= .01 ? 1 : fin(t, u.t0, .14), 1 - seg(t, u.t1 - .12, u.t1));
      g.save(); g.globalAlpha *= k; rr(g, b.x, b.y, b.w, b.h, 18); g.clip();
      /* one grade for both games: GTA 5's 720p sources get a little contrast and saturation so the split reads as a pair */
      g.filter = o.side === 5 ? 'contrast(1.08) saturate(1.12) brightness(1.03)' : 'contrast(1.02)';
      CLIP.draw(g, t, b.x, b.y, b.w, b.h, u); g.filter = 'none';
      var vg = g.createRadialGradient(b.x + b.w / 2, b.y + b.h / 2, b.h * .3, b.x + b.w / 2, b.y + b.h / 2, b.w * .7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
      g.fillStyle = vg; g.fillRect(b.x, b.y, b.w, b.h);
      g.restore();
      if (o.ring && t > u.t0 + .25) {
        var p = CLIP.toScreen(u, t, o.ring[0], o.ring[1], b.x, b.y, b.w, b.h), rk = cd(t, u.t0 + .25, 12);
        g.save(); g.globalAlpha *= k; circ(g, p[0], p[1], lerp(90, 62, rk)); g.lineWidth = 7; g.strokeStyle = ACC; g.stroke(); g.restore();
      }
      /* our annotation tag on the clip itself */
      g.save(); g.globalAlpha *= k * (o.quiet ? fin(t, o.quiet, .3) : 1);
      chip(g, '● CLIP', b.x + 22, b.y + 44, { px: 30, fam: MONO, wt: 700, bg: 'rgba(12,14,19,.78)', fg: CREAM, align: 'left', r: 8 });
      g.restore();
    }
    rr(g, b.x, b.y, b.w, b.h, 18); g.lineWidth = 3; g.strokeStyle = o.side === 6 ? 'rgba(255,90,54,.85)' : 'rgba(157,176,198,.55)'; g.stroke();
    /* note + credit under the panel */
    var na = o.noteT == null ? 1 : fin(t, o.noteT, .3);
    if (o.note && na > 0) { g.save(); g.globalAlpha *= na; txt(g, o.note, b.x + 4, b.y + b.h + 50 + (1 - na) * 16, 46, CREAM, { align: 'left', wt: 800 }); g.restore(); }
    var cu = u || o.creditUse;
    if (cu && !o.nocred && (!o.creditUse || t >= cu.t0 - .1) && !(o.quiet && t < o.quiet)) txt(g, CREDIT[srcOf(cu)], b.x + 4, b.y + b.h + 104, 34, DIM, { align: 'left', fam: MONO, wt: 600 });
    g.restore();
  }
  /* the seam between the two panels; m = 0..1 match tick */
  function seam(g, t, m, a) {
    a = a == null ? 1 : a; if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = FAINT; g.fillRect(958, 150, 4, 560);
    var y = 425, mk2 = clamp(m || 0, 0, 1);
    circ(g, 960, y, 46); g.fillStyle = mk2 > .5 ? ACC : BG2; g.fill(); g.lineWidth = 3; g.strokeStyle = mk2 > .5 ? ACC : FAINT; g.stroke();
    if (mk2 > .5) tickMark(g, 960, y + 2, 1, 1, INK);
    else txt(g, 'VS', 960, y + 2, 34, CREAM, { wt: 900 });
    if (mk2 > .5) chip(g, 'MATCH', 960, y + 86, { px: 36, bg: ACC, fg: INK, a: (m - .5) * 2 });
    g.restore();
  }

  /* ---------- chrome: chapter label + six-pip rail (goal gradient) ---------- */
  var CH = [];
  function chapterAt(t) { var c = 0; CH.forEach(function (x, i) { if (t >= x.t) c = i + 1; }); return c; }
  function chrome(g, t, s) {
    if (s.id === 'hook' || s.card) return;
    var c = chapterAt(t), a = fin(t, 2.2, .5);
    if (a <= 0) return;
    g.save(); g.globalAlpha = a;
    if (c > 0) txt(g, ('0' + c) + ' / ' + CH[c - 1].name, 70, 74, 32, DIM, { align: 'left', fam: MONO, wt: 600, ls: 2 });
    else txt(g, 'GTA 5 vs GTA 6 · EVERY TRAILER', 70, 74, 32, DIM, { align: 'left', fam: MONO, wt: 600, ls: 2 });
    for (var i = 0; i < 6; i++) {
      var x = 1478 + i * 64, done = i < c - 1, cur = i === c - 1;
      rr(g, x, 66, 54, 12, 6); g.fillStyle = done ? CREAM : cur ? ACC : FAINT; g.fill();
    }
    g.restore();
  }

  /* ---------- captions: phrase cards, stressed words in the accent ---------- */
  var EMPH = /\d|^(same|every|both|three|two|one|twelve|thirteen|record|missed|yes|never|whole|state|five|four|twenty-six|forty-eight|minutes)$/i;
  function captions(g, t, s) {
    if (!LIVE.text || s.id === 'hook' || s.card) return;
    var caps = VO.captions || [], c = null;
    for (var i = 0; i < caps.length; i++) if (t >= caps[i].t0 && t < caps[i].t1) { c = caps[i]; break; }
    if (!c) return;
    var a = clamp((t - c.t0) / .08, 0, 1) * clamp((c.t1 - t) / .08, 0, 1);
    font(g, 46, 800); var words = c.words.map(function (w) { return w.w; }), sp = g.measureText(' ').width;
    var ws = words.map(function (w) { return g.measureText(w).width; }), tw0 = ws.reduce(function (s2, v) { return s2 + v; }, 0) + sp * (words.length - 1);
    var y = 1010, x = W / 2 - tw0 / 2;
    g.save(); g.globalAlpha = a;
    rr(g, W / 2 - tw0 / 2 - 28, y - 38, tw0 + 56, 76, 20); g.fillStyle = 'rgba(12,14,19,.86)'; g.fill();
    g.textAlign = 'left'; g.textBaseline = 'middle';
    words.forEach(function (w, j) {
      var said = t >= c.words[j].t0 - .02, hot = EMPH.test(w.replace(/[^\w'%-]/g, ''));
      g.fillStyle = hot && said ? ACC2 : said ? CREAM : 'rgba(243,239,230,.5)'; g.fillText(w, x, y + 2); x += ws[j] + sp;
    });
    g.restore();
  }

  /* ---------- clip uses (set in initTimes) ---------- */
  var U = {};
  function use(key, name, t0, t1, o) {
    o = o || {};
    var c = CLIP.manifest().clips[name], len = c.frames / 30 - .05, span = t1 - t0;
    var speed = o.speed || Math.min(1, (len - (o.from || 0)) / span);
    U[key] = CLIP.use(name, t0, t1, { from: o.from || 0, speed: speed, zoom: o.zoom || [1.02, 1.1], focus: o.focus || [.5, .5], note: o.note, plate: o.plate });
    return U[key];
  }
  function plate(key, name, t0, t1, note) { return use(key, name, t0, Math.min(t1, t0 + 4.85), { plate: true, zoom: [1.04, 1.12], note: note || 'plate' }); }

  /* ---------- texts on screen, for readcheck ---------- */
  var TX = [];
  function T(id, text, t0, t1) { TX.push({ id: id, text: text, t0: t0, t1: t1 }); }
  function TEXTS(t) { var o = []; TX.forEach(function (x) { if (t >= x.t0 && t < x.t1) o.push({ id: x.id, text: x.text }); }); return o; }

  /* =================================================================== scenes */
  var SC = [];
  function sc(id, t0, draw, o) { var s = Object.assign({ id: id, t0: t0, draw: draw }, o || {}); SC.push(s); return s; }
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  function push(g, t, s, z) { var u = seg(t, s.t0, s.t1), zz = 1 + (z == null ? .025 : z) * ss(u); g.translate(W / 2, H / 2); g.scale(zz, zz); g.translate(-W / 2, -H / 2); }

  /* 0 · hook: the two sunsets, the search phrase across the seam */
  function sHook(g, t, s) {
    var end2 = s.final;
    g.save(); push(g, t, s, .02);
    var outA = end2 ? 1 - fin(t, ES - .1, .4) : 1;
    g.save(); g.globalAlpha *= outA;
    panel(g, t, { x: 60, y: 120, w: 880, h: 560 }, { uses: [end2 ? U.sky5b : U.sky5], side: 5, slate: { big: '2011', bpx: 150 }, quiet: end2 ? null : 1.2, nocred: end2 });
    panel(g, t, { x: 980, y: 120, w: 880, h: 560 }, { uses: [end2 ? U.t1sb : U.t1s], side: 6, slate: { big: '2023', bpx: 150, col: end2 ? CREAM : null }, quiet: end2 ? null : 1.2, nocred: end2 });
    g.restore(); g.restore();
    var lv = 1 - seg(t, s.t1 - .4, s.t1 - .15);   // outgoing chips clear their line before the next scene's header arrives
    if (!end2) {
      /* frame 0: GTA 5 vs GTA 6, sharp and centred on the seam from the first frame (the clips carry the motion) */
      var gx = 960;
      txt(g, 'GTA 5', gx - 110, 880, 140, CREAM, { align: 'right', wt: 900, wide: true });
      txt(g, 'vs', gx, 880, 100, ACC, { wt: 900 });
      txt(g, 'GTA 6', gx + 110, 880, 140, CREAM, { align: 'left', wt: 900, wide: true });
      var ya = fin(t, 1.0, .35);
      ya *= lv; if (ya > 0) { gtaChip(g, 5, 60, 72, ya, '2011'); gtaChip(g, 6, 1860, 72, ya, '2023', 'right'); }
      var sa = fin(t, at('hook', 'vs') + .6, .3) * lv;
      if (sa > 0) { g.save(); g.globalAlpha = sa; txt(g, 'EVERY TRAILER, SIDE BY SIDE', 960, 1005, 44, DIM, { fam: MONO, wt: 700, ls: 6 }); g.restore(); }
    } else {
      var q = fin(t, at('n6j', 'which') - .1, .35);
      g.save(); g.globalAlpha = q; txt(g, 'WHICH FIRST TRAILER WINS?', 960, 790, 96, CREAM, { wt: 900, wide: true }); g.restore();
      var c2 = fin(t, at('n6k', '2011') - .1, .3);
      if (c2 > 0) {
        chip(g, '2011', 500, 120, { px: 64, bg: COOLD, fg: CREAM, s: lerp(.8, 1, c2), a: c2 * outA, line: 'rgba(157,176,198,.6)' });
        chip(g, '2023', 1420, 120, { px: 64, bg: COOLD, fg: CREAM, s: lerp(.8, 1, c2), a: c2 * outA, line: 'rgba(157,176,198,.6)' });
      }
      var cm = fin(t, at('n6k', 'comments') - .2, .3);
      cm *= outA; if (cm > 0) { g.save(); g.globalAlpha = cm; txt(g, 'YOUR PICK: 2011 OR 2023', 960, 885, 48, CREAM, { fam: MONO, wt: 700, ls: 4 }); g.restore(); }
      var sw0 = at('n6k', '2011'); if (t > sw0 && t < ES + .3) { var su = ((t - sw0) % 1.8) / 1.4; g.save(); g.globalAlpha *= outA; push(g, t, s, .02); sheen(g, 60, 120, 880, 560, su, .3); sheen(g, 980, 120, 880, 560, su - .25, .3); g.restore(); }
      /* end hold: two slots for YouTube's end-screen videos */
      var ek = fin(t, ES + .1, .5);
      if (ek > 0) {
        g.save(); g.globalAlpha = ek;
        txt(g, 'WATCH NEXT', 960, 250, 64, CREAM, { wt: 900, wide: true });
        [[280, 340], [1000, 340]].forEach(function (p, i) {
          rr(g, p[0], p[1] + (1 - ek) * 40, 640, 360, 18); g.fillStyle = PANEL; g.fill(); g.lineWidth = 3; g.strokeStyle = i ? 'rgba(255,90,54,.7)' : 'rgba(157,176,198,.55)'; g.stroke();
          sheen(g, p[0], p[1], 640, 360, ((t - ES - i * .5) % 2.2) / 1.8, .12);
        });
        g.restore();
      }
    }
    seam(g, t, 0, end2 ? 1 - fin(t, ES - .1, .4) : 1);
  }

  /* 1 · the seven trailers, dealt like tickets */
  var TICK5 = [['GTA V TRAILER', 'NOV 2011'], ['OFFICIAL TRAILER', '2013'], ['GAMEPLAY VIDEO', 'JULY 2013']];
  var TICK6 = [['TRAILER 1', 'DEC 2023'], ['TRAILER 2', 'MAY 2025'], ['AN EXTENDED LOOK', 'AUG 2026'], ['LAUNCH TRAILER', 'OCT 2026']];
  function ticket(g, x, y, w, name, date, side, k) {
    if (k <= 0) return;
    g.save(); g.globalAlpha *= clamp(k * 1.5, 0, 1); g.translate(x + (1 - k) * (side === 5 ? -260 : 260), y); g.rotate((1 - k) * (side === 5 ? -.12 : .12));
    rr(g, 0, -52, w, 104, 14); g.fillStyle = side === 5 ? PANEL2 : '#2a1812'; g.fill(); g.lineWidth = 3; g.strokeStyle = side === 5 ? 'rgba(157,176,198,.5)' : ACC; g.stroke();
    /* the ticket's perforated stub */
    g.setLineDash([6, 8]); g.beginPath(); g.moveTo(w - 210, -40); g.lineTo(w - 210, 40); g.strokeStyle = FAINT; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
    txt(g, name, 30, 2, 44, CREAM, { align: 'left', wt: 800 });
    txt(g, date, w - 105, 2, 36, side === 5 ? COOL : ACC2, { fam: MONO, wt: 700 });
    g.restore();
  }
  function sDeck(g, t, s) {
    g.save(); push(g, t, s);
    gtaChip(g, 5, 120, 190, fin(t, s.t0 + .05));
    gtaChip(g, 6, 1000, 190, fin(t, s.t0 + .05));
    var t0 = at('open2', 'every') - .15, t1 = wend('open2', 'side', 1);
    TICK5.forEach(function (c, i) { ticket(g, 120, 300 + i * 126, 800, c[0], c[1], 5, cd(t, t0 + (i * 2 + 1) * (t1 - t0) / 8, 10)); });
    TICK6.forEach(function (c, i) { ticket(g, 1000, 300 + i * 126, 800, c[0], c[1], 6, cd(t, t0 + i * 2 * (t1 - t0) / 8, 10)); });
    g.restore();
    seam(g, t, 0, 1);
  }

  /* 2 · thirteen years apart */
  function sApart(g, t, s) {
    g.save(); push(g, t, s);
    gtaChip(g, 5, PL.x, 135, 1, 'LAUNCHED 2013'); gtaChip(g, 6, PR.x, 135, fin(t, start('open3') + .3), 'LAUNCHED 2026');
    panel(g, t, PL, { uses: [U.roof], side: 5, slate: { big: 'GTA 5', small: 'SEPT 17, 2013' }, note: 'MICHAEL, FRANKLIN, TREVOR', noteT: U.roof.t0 + .2 });
    panel(g, t, PR, { uses: [U.lean], side: 6, slate: { big: 'GTA 6', small: 'NOV 19, 2026', side: 6 }, note: 'JASON AND LUCIA', noteT: U.lean.t0 + .2 });
    g.restore();
    seam(g, t, 0, 1);
    var k = cd(t, h('apart') - .05, 11);
    if (k > 0) {
      chip(g, '13 YEARS APART', 960, 880, { px: 70, bg: ACC, fg: INK, wide: true, wt: 900, s: lerp(1.4, 1, k) * kn(t, h('apart') + .1, .04), a: clamp(k * 2, 0, 1), r: 20 });
    }
  }

  /* 2b · the stake up front: both missed their date, then the day-one gap (flashes of chapters 5 and 6) */
  function sTease(g, t, s) {
    g.save(); push(g, t, s);
    var mid = s.t0 + 1.35, p1 = 1 - fin(t, mid - .15, .2), p2 = fin(t, mid, .2);
    var ka = cd(t, s.t0 + .1, 11), kb = cd(t, s.t0 + .25, 11);
    if (p1 > 0) {
      g.save(); g.globalAlpha *= p1;
      chip(g, 'COMING UP · CHAPTER 5', 960, 200, { px: 36, fam: MONO, wt: 700, bg: CREAM, fg: INK });
      gtaChip(g, 5, 170, 330, ka); gtaChip(g, 6, 1090, 330, kb);
      dateCard(g, 170, 390, 660, 280, 'FIRST DATE', 'SPRING 2013', 5, ka);
      dateCard(g, 1090, 390, 660, 280, 'FIRST DATE', '2025', 6, kb);
      strike(g, 210, 560, 790, eio(seg(t, s.t0 + .55, s.t0 + .8)));
      strike(g, 1130, 560, 1710, eio(seg(t, s.t0 + .7, s.t0 + .95)));
      g.restore();
    }
    if (p2 > 0) {
      g.save(); g.globalAlpha *= p2;
      chip(g, 'COMING UP · CHAPTER 6', 960, 200, { px: 36, fam: MONO, wt: 700, bg: CREAM, fg: INK });
      txt(g, 'DAY ONE', 960, 330, 44, DIM, { fam: MONO, wt: 700, ls: 4 });
      var m5 = cd(t, mid + .05, 12), m6 = cd(t, mid + .3, 12);
      gtaChip(g, 5, 170, 420, m5); gtaChip(g, 6, 1090, 420, m6);
      if (m5 > 0) { g.save(); g.globalAlpha *= clamp(m5 * 1.5, 0, 1); txt(g, '$800M+', 500, 600 + (1 - m5) * 50, 170, COOL, { wt: 900, wide: true }); g.restore(); }
      if (m6 > 0) { g.save(); g.globalAlpha *= clamp(m6 * 1.5, 0, 1); txt(g, '$3.79B', 1420, 600 + (1 - m6) * 50, 190, ACC2, { wt: 900, wide: true }); g.restore(); }
      g.restore();
    }
    g.restore();
    seam(g, t, 0, 1);
  }

  /* 3 · our playbook clipboard: five plays, two columns */
  var PLAYS = ['FIRST TRAILER', 'THE HEROES', 'THE MAP', 'GAMEPLAY REVEAL', 'LAST TRAILER'];
  function clipboard(g, t, x, y, o) {
    g.save(); g.translate(x, y); g.rotate(o.rot || 0);
    rr(g, -400, -330, 800, 680, 26); g.fillStyle = '#d8c8a8'; g.fill();
    rr(g, -370, -280, 740, 610, 10); g.fillStyle = '#f6f1e6'; g.fill();
    rr(g, -120, -360, 240, 70, 14); g.fillStyle = '#7d8592'; g.fill();
    txt(g, 'THE PLAYBOOK', -340, -228, 46, INK, { align: 'left', wt: 900, wide: true });
    txt(g, '5', 180, -228, 46, '#55606f', { wt: 900 }); txt(g, '6', 290, -228, 46, ACC, { wt: 900 });
    for (var i = 0; i < 5; i++) {
      var ry = -140 + i * 100, ra = o.rows ? o.rows(i) : 1;
      g.fillStyle = 'rgba(12,14,19,.12)'; g.fillRect(-340, ry + 46, 680, 3);
      g.save(); g.globalAlpha *= ra;
      txt(g, (i + 1) + '  ' + PLAYS[i], -340, ry, 42, INK, { align: 'left', wt: 800 });
      /* X and O, the coach's marks */
      g.restore();
      rr(g, 152, ry - 30, 56, 60, 10); g.lineWidth = 3; g.strokeStyle = 'rgba(12,14,19,.25)'; g.stroke();
      rr(g, 262, ry - 30, 56, 60, 10); g.stroke();
      if (o.tick) { var k5 = o.tick(i), k6 = o.tick(i, 1); tickMark(g, 180, ry, cd(k5, 0, 12), k5 > 0 ? 1 : 0, '#55606f'); tickMark(g, 290, ry, cd(k6, 0, 12), k6 > 0 ? 1 : 0, ACC); }
      else { txt(g, '?', 180, ry + 2, 44, 'rgba(12,14,19,.35)', { wt: 900 }); txt(g, '?', 290, ry + 2, 44, 'rgba(255,90,54,.55)', { wt: 900 }); }
    }
    g.restore();
  }
  function sBook(g, t, s) {
    plateLayer(g, t, .62);
    g.save(); push(g, t, s, .03);
    var k = cd(t, s.t0 + .05, 9);
    clipboard(g, t, 1420, 560 + (1 - k) * 700, { rot: -.035, rows: function (i) { return fin(t, s.t0 + .25 + i * .22, .3); } });
    var q = fin(t, s.t0 + .2, .3);
    g.globalAlpha = q;
    txt(g, 'SAME', 140, 420, 130, CREAM, { align: 'left', wt: 900, wide: true, max: 820 });
    txt(g, 'PLAYBOOK', 140, 560, 130, ACC, { align: 'left', wt: 900, wide: true, max: 820 });
    txt(g, 'TWICE?', 140, 700, 130, CREAM, { align: 'left', wt: 900, wide: true, max: 820 });
    g.restore();
  }

  /* 4 · six chapters, lined up */
  var CHN = ['THE FIRST TRAILER', 'THREE HEROES, THEN TWO', 'THE MAP', 'THE GAMEPLAY REVEAL', 'THE LAST TRAILER', 'LAUNCH DAY'];
  function sRail(g, t, s) {
    plateLayer(g, t, .62);
    g.save(); push(g, t, s);
    var t0 = at('open6', 'six') - .1;
    txt(g, '6 CHAPTERS', 160, 200, 110, CREAM, { align: 'left', wt: 900, wide: true });
    for (var i = 0; i < 6; i++) {
      var k = cd(t, t0 + .12 + i * .22, 11), y = 330 + i * 98;
      if (k <= 0) continue;
      g.save(); g.globalAlpha = clamp(k * 1.4, 0, 1); g.translate((1 - k) * 200, 0);
      rr(g, 160, y - 38, 1240, 76, 12); g.fillStyle = 'rgba(22,26,36,.88)'; g.fill();
      rr(g, 160, y - 38, 12, 76, 6); g.fillStyle = i === 0 ? ACC : COOL; g.fill();
      txt(g, '0' + (i + 1), 210, y + 2, 46, i === 0 ? ACC : COOL, { align: 'left', fam: MONO, wt: 700 });
      txt(g, CHN[i], 320, y + 2, 48, CREAM, { align: 'left', wt: 800 });
      g.restore();
    }
    g.restore();
  }

  /* chapter card: the seam opens on the number */
  function sCard(g, t, s) {
    plateLayer(g, t, .55);
    var n = s.card, c0 = at(s.line, 'chapter') - .1;
    g.save(); push(g, t, s, .03);
    var k = cd(t, s.t0 + .1, 10), k2 = cd(t, s.t0 + .3, 10);
    g.save(); g.beginPath(); g.rect(0, 150, W, 380); g.clip();
    txt(g, '0' + n, 150, 380 + (1 - k) * 330, 300, ACC, { align: 'left', wt: 900, wide: true });
    g.restore();
    g.save(); g.beginPath(); g.rect(0, 560, W, 190); g.clip();
    txt(g, CHN[n - 1], 160, 660 + (1 - k2) * 180, 116, CREAM, { align: 'left', wt: 900, wide: true, max: 1620 });
    g.restore();
    txt(g, 'CHAPTER ' + n + ' OF 6', 164, 790, 38, DIM, { align: 'left', fam: MONO, wt: 600, ls: 4 });
    /* the six pips, this one filling */
    for (var i = 0; i < 6; i++) {
      var x = 160 + i * 270, f = i < n - 1 ? 1 : i === n - 1 ? eio(seg(t, c0, c0 + 1.2)) : 0;
      rr(g, x, 870, 250, 16, 8); g.fillStyle = FAINT; g.fill();
      if (f > 0) { rr(g, x, 870, 250 * f, 16, 8); g.fillStyle = i === n - 1 ? ACC : CREAM; g.fill(); }
    }
    g.restore();
  }

  /* chapter 1 · the first trailers, dated */
  function sFirst(g, t, s) {
    g.save(); push(g, t, s);
    gtaChip(g, 5, PL.x, 135, 1, 'GTA V TRAILER'); gtaChip(g, 6, PR.x, 135, fin(t, start('t1b') - .3), 'TRAILER 1');
    panel(g, t, PL, { uses: [U.signs], side: 5, slate: { big: 'NOV 2, 2011', bpx: 90, small: 'ROCKSTAR GAMES' }, note: 'FIRST GTA 5 TRAILER', noteT: start('t1a') });
    panel(g, t, PR, { uses: [U.vcnight], side: 6, a: fin(t, start('t1b') - .4), slate: { big: 'DEC 4, 2023', bpx: 90, small: 'ROCKSTAR GAMES', side: 6 }, note: 'GTA 6 TRAILER 1', noteT: start('t1b') });
    g.restore();
    seam(g, t, 0, 1);
    var d1 = cd(t, h('d2011') - .05, 11), d2 = cd(t, h('d2023') - .05, 11);
    if (d1 > 0) chip(g, 'NOV 2, 2011', PL.x + PL.w - 30, PL.y + PL.h - 50, { px: 46, bg: CREAM, fg: INK, align: 'right', s: lerp(1.3, 1, d1), a: d1 });
    if (d2 > 0) chip(g, 'DEC 4, 2023', PR.x + PR.w - 30, PR.y + PR.h - 50, { px: 46, bg: ACC, fg: INK, align: 'right', s: lerp(1.3, 1, d2), a: d2 });
  }

  /* chapter 1 · same four beats, same order: our checklist (no clips: those ranges belong to gta-sametrailer) */
  var BEATS = [['SUNSET', '0:06', '0:03', 'sunset'], ['BEACH', '0:09', '0:12', 'beach'], ['“ROCKSTAR GAMES PRESENTS”', '0:12', '0:15', 'presents'], ['SOMEONE ACROSS THE WATER', '0:19', '0:23', 'water']];
  function sBeats(g, t, s) {
    g.save(); push(g, t, s);
    var hk = fin(t, s.t0 + .05);
    g.globalAlpha = hk;
    txt(g, 'SAME FIRST 4 BEATS', 120, 190, 84, CREAM, { align: 'left', wt: 900, wide: true });
    chip(g, '12 YEARS APART', 1800, 190, { px: 40, bg: ACC, fg: INK, align: 'right', a: fin(t, at('t1c', 'twelve') - .1) });
    g.globalAlpha = 1;
    /* column heads */
    var ca = fin(t, at('t1c', 'same') - .1);
    g.save(); g.globalAlpha = ca;
    gtaChip(g, 5, 1270, 300, 1, '2011', 'left'); gtaChip(g, 6, 1555, 300, 1, '2023', 'left');
    g.restore();
    for (var i = 0; i < 4; i++) {
      var b = BEATS[i], line = i < 3 ? 't1d' : 't1e', tw0 = at(line, b[3]) - .12, k = cd(t, tw0, 11), y = 400 + i * 130;
      rr(g, 120, y - 52, 1680, 104, 14); g.fillStyle = k > 0 ? 'rgba(22,26,36,.95)' : 'rgba(22,26,36,.45)'; g.fill();
      txt(g, String(i + 1), 170, y + 2, 54, k > 0 ? ACC : FAINT, { wt: 900, fam: MONO });
      if (k > 0) {
        g.save(); g.globalAlpha = clamp(k * 1.5, 0, 1); g.translate((1 - k) * 60, 0);
        txt(g, b[0], 240, y + 2, 52, CREAM, { align: 'left', wt: 800 });
        g.restore();
        var k5 = cd(t, tw0 + .15, 12), k6 = cd(t, tw0 + .3, 12);
        tickMark(g, 1310, y, k5, k5, COOL); txt(g, b[1], 1360, y + 2, 40, DIM, { align: 'left', fam: MONO, wt: 600 });
        tickMark(g, 1595, y, k6, k6, ACC); txt(g, b[2], 1645, y + 2, 40, DIM, { align: 'left', fam: MONO, wt: 600 });
      }
    }
    var ord = fin(t, at('t1c', 'order') - .05);
    if (ord > 0) { g.globalAlpha = ord; txt(g, 'TIMES: WHERE EACH BEAT STARTS IN THE TRAILER', 120, 935, 36, DIM, { align: 'left', fam: MONO, wt: 600 }); }
    g.restore();
  }

  /* a generic split scene: o = { L: {...panel opts}, R: {...}, chips: [[5, extra], [6, extra]], match: t } */
  function splitScene(o) {
    return function (g, t, s) {
      g.save(); push(g, t, s);
      if (o.chips) { var cs = o.chipSides || [5, 6]; gtaChip(g, cs[0], PL.x, 135, 1, o.chips[0]); gtaChip(g, cs[1], PR.x, 135, 1, o.chips[1]); }
      panel(g, t, PL, Object.assign({ side: 5 }, typeof o.L === 'function' ? o.L(t) : o.L));
      panel(g, t, PR, Object.assign({ side: 6 }, typeof o.R === 'function' ? o.R(t) : o.R));
      g.restore();
      var m = o.match ? seg(t, o.match(), o.match() + .5) : 0;
      seam(g, t, m, 1);
      if (o.extra) o.extra(g, t, s);
    };
  }

  /* chapter 1 · one thing doesn't match: the seam shoves left, 93 million */
  function sViews(g, t, s) {
    plateLayer(g, t, .62);
    var sh = eio(seg(t, at('t1k', 'doesnt') - .2, at('t1k', 'doesnt') + .5));
    var lw = lerp(870, 150, sh), sx = 70 + lw + 20;
    g.save(); push(g, t, s);
    var bl = { x: 70, y: 180, w: lw, h: 490 }, br = { x: sx + 20, y: 180, w: 1850 - sx - 20, h: 490 };
    var shk = at('t1k', 'match'), sx2 = Math.sin((t - shk) * 55) * 14 * Math.max(0, 1 - Math.abs(t - shk - .3) / .45);
    g.save(); g.translate(sx2, 0);
    rr(g, bl.x, bl.y, bl.w, bl.h, 18); g.fillStyle = PANEL; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(157,176,198,.55)'; g.stroke();
    txt(g, sh > .6 ? '?' : 'GTA 5', bl.x + bl.w / 2, bl.y + bl.h / 2, sh > .6 ? 120 : 90, COOL, { wt: 900 });
    g.restore();
    rr(g, br.x, br.y, br.w, br.h, 18); g.fillStyle = 'rgba(22,26,36,.82)'; g.fill(); g.lineWidth = 3; g.strokeStyle = ACC; g.stroke();
    gtaChip(g, 6, br.x, 135, 1, 'TRAILER 1');
    if (sh < .6) gtaChip(g, 5, 70, 135, 1 - sh / .6, 'GTA V TRAILER');
    var cx = br.x + br.w / 2, nk = cd(t, h('n93') - .05, 11);
    if (nk <= 0) { txt(g, 'GTA 6 TRAILER 1', cx, 400, 96, ACC, { wt: 900, wide: true, max: br.w - 80 }); txt(g, 'THE FIRST 24 HOURS', cx, 500, 44, DIM, { fam: MONO, wt: 700, ls: 3 }); }
    if (nk > 0) {
      g.save(); g.globalAlpha = clamp(nk * 1.4, 0, 1); g.translate(cx, 370); g.scale(lerp(1.25, 1, nk) * kn(t, h('n93') + .05, .03), lerp(1.25, 1, nk));
      txt(g, '93,000,000+', 0, 0, 190, CREAM, { wt: 900, wide: true }); g.restore();
      g.save(); g.globalAlpha = fin(t, at('t1l', 'views') - .1); txt(g, 'YOUTUBE VIEWS', cx, 515, 64, ACC2, { wt: 900, wide: true }); g.restore();
    }
    var h24 = cd(t, h('h24') - .05, 11);
    if (h24 > 0) chip(g, 'IN 24 HOURS', cx, 610, { px: 56, bg: ACC, fg: INK, s: lerp(1.3, 1, h24), a: h24 });
    g.restore();
    var rk = cd(t, h('rec') - .05, 11);
    if (rk > 0) {
      g.save(); g.translate(1300, 790); g.rotate(-.03); g.scale(lerp(1.4, 1, rk), lerp(1.4, 1, rk)); g.globalAlpha = clamp(rk * 2, 0, 1);
      rr(g, -460, -54, 920, 108, 14); g.lineWidth = 6; g.strokeStyle = ACC; g.stroke(); g.fillStyle = 'rgba(12,14,19,.85)'; g.fill();
      txt(g, 'RECORD: NON-MUSIC DEBUT', 0, 4, 56, ACC2, { wt: 900 }); g.restore();
    }
    if (nk > 0) { g.save(); g.globalAlpha = fin(t, at('t1l', '93') + .4); txt(g, 'SOURCE: YOUTUBE OFFICIAL BLOG · DEC 5, 2023', 1300, 880, 34, DIM, { fam: MONO, wt: 600 }); g.restore(); }
  }

  /* chapter 2 · the character wheel (our drawing of the 2013 switch idea, not Rockstar's UI) */
  function wheel(g, t, cx, cy, r, names, lit, o) {
    o = o || {}; var n = names.length, gap = .07;
    for (var i = 0; i < n; i++) {
      var a0 = -Math.PI / 2 + i * TAU / n + gap, a1 = -Math.PI / 2 + (i + 1) * TAU / n - gap, k = o.k ? o.k(i) : 1;
      if (k <= 0) continue;
      var drop = o.drop ? o.drop(i) : 0;
      g.save(); g.globalAlpha *= clamp(k, 0, 1) * (1 - drop); g.translate(0, drop * 260);
      g.beginPath(); g.arc(cx, cy, r, a0, a1); g.arc(cx, cy, r * .52, a1, a0, true); g.closePath();
      var on = lit === i; g.fillStyle = on ? (o.col || ACC) : PANEL2; g.fill(); g.lineWidth = 3; g.strokeStyle = on ? (o.col || ACC) : 'rgba(243,239,230,.25)'; g.stroke();
      var am = (a0 + a1) / 2, tx = cx + Math.cos(am) * r * .76, ty = cy + Math.sin(am) * r * .76;
      txt(g, names[i], tx, ty, o.px || 38, on ? INK : CREAM, { wt: 900, max: r * .62 });
      g.restore();
    }
    circ(g, cx, cy, r * .42); g.fillStyle = BG2; g.fill();
    txt(g, String(o.center || n), cx, cy + 4, r * .4, o.ccol || CREAM, { wt: 900 });
  }
  function sWheel(g, t, s) {
    g.save(); push(g, t, s);
    var big = { x: 70, y: 180, w: 1060, h: 596 };
    gtaChip(g, 5, big.x, 135, 1, 'OFFICIAL TRAILER + GAMEPLAY VIDEO, 2013');
    var sw0 = U.sw.t0, swk = seg(t, sw0, U.sw.t1);
    var inGP = t >= start('h2c') - .3;
    panel(g, t, big, { uses: [U.michael, U.franklin, U.trevor, U.sw], side: 5, slate: inGP ? { big: 'GAMEPLAY VIDEO', bpx: 80, small: 'ROCKSTAR · 2013' } : { big: '3 STORIES', bpx: 110 },
      note: t < start('h2c') - .3 ? 'GTA V OFFICIAL TRAILER · 2013' : 'THE SWITCH: UP TO THE SKY, DOWN AGAIN', noteT: s.t0 + .3 });
    var lit = -1;
    if (t >= U.michael.t0) lit = 0; if (t >= U.franklin.t0) lit = 1; if (t >= U.trevor.t0) lit = 2;
    if (t >= start('h2c') - .2) lit = t < sw0 + (U.sw.t1 - sw0) * .55 ? 0 : 2;
    var wk = function (i) { return cd(t, at('h2a', 'three') - .1 + i * .12, 11); };
    wheel(g, t, 1500, 470, 320, ['MICHAEL', 'FRANKLIN', 'TREVOR'], lit, { k: wk, col: COOL, px: 32, ccol: COOL });
    /* the switch: an arc that travels from one slot to the next while the camera is in the sky */
    if (t >= sw0 && t < U.sw.t1) {
      var k = eio(seg(t, sw0 + (U.sw.t1 - sw0) * .25, sw0 + (U.sw.t1 - sw0) * .6)), a = -Math.PI / 2 + TAU / 6 + k * TAU * 2 / 3;
      g.beginPath(); g.arc(1500, 470, 330, -Math.PI / 2 + TAU / 6, a); g.lineWidth = 10; g.strokeStyle = ACC; g.lineCap = 'round'; g.stroke();
      circ(g, 1500 + Math.cos(a) * 330, 470 + Math.sin(a) * 330, 16); g.fillStyle = ACC; g.fill();
    }
    var sk = fin(t, at('h2d', 'sky') - .1);
    if (sk > 0 && t < U.sw.t1 + .4) chip(g, 'UP: SATELLITE VIEW', 1500, 840, { px: 40, bg: ACC, fg: INK, a: sk * (1 - fin(t, at('h2e', 'drops') - .1)) });
    var dk = fin(t, at('h2e', 'drops') - .1);
    if (dk > 0) chip(g, 'DOWN: ANOTHER HERO', 1500, 840, { px: 40, bg: ACC, fg: INK, a: dk });
    txt(g, 'OUR DIAGRAM', 1500, 120, 30, DIM, { fam: MONO, wt: 600, ls: 3 });
    g.restore();
  }

  /* chapter 2 · three stories, then one story about two people (no wheel on the GTA 6 side: no switching is claimed) */
  function portrait(g, x, y, name, k, nk) {
    if (k <= 0) return;
    g.save(); g.globalAlpha *= clamp(k * 1.5, 0, 1); g.translate(x, y + (1 - k) * 60);
    rr(g, -150, -210, 300, 400, 22); g.fillStyle = PANEL2; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,90,54,.85)'; g.stroke();
    g.fillStyle = 'rgba(243,239,230,.16)'; circ(g, 0, -70, 66); g.fill();
    g.beginPath(); g.moveTo(-120, 150); g.quadraticCurveTo(-110, 10, 0, 10); g.quadraticCurveTo(110, 10, 120, 150); g.closePath(); g.fill();
    if (nk > 0) { g.globalAlpha *= nk; txt(g, name, 0, 245, 52, CREAM, { wt: 900, wide: true }); }
    g.restore();
  }
  function sTwo(g, t, s) {
    g.save(); push(g, t, s);
    gtaChip(g, 5, 180, 160, 1); gtaChip(g, 6, 1100, 160, 1);
    wheel(g, t, 520, 500, 280, ['MICHAEL', 'FRANKLIN', 'TREVOR'], -1, { col: COOL, px: 34, ccol: COOL });
    txt(g, '3 STORIES', 520, 880, 64, COOL, { wt: 900, wide: true });
    var tw = at('h2f', 'two') - .1, kj = cd(t, tw, 11), kl = cd(t, tw + .15, 11);
    portrait(g, 1260, 470, 'JASON', kj, fin(t, at('h2g', 'jason') - .1));
    portrait(g, 1640, 470, 'LUCIA', kl, fin(t, at('h2g', 'lucia') - .1));
    var bk = eio(seg(t, at('h2f', 'people') - .05, at('h2f', 'people') + .4));
    if (bk > 0) { rr(g, 1110, 845, 680 * bk, 80, 16); g.fillStyle = ACC; g.fill(); if (bk > .7) { g.save(); g.globalAlpha *= (bk - .7) / .3; txt(g, 'ONE STORY', 1450, 887, 52, INK, { wt: 900, wide: true }); g.restore(); } }
    g.restore();
    seam(g, t, 0, 1);
  }

  /* chapter 2 · scoreboard */
  function sScore(g, t, s) {
    g.save(); push(g, t, s);
    var a = cd(t, h('sc3') - .05, 10), b = cd(t, h('sc1') - .05, 10);
    rr(g, 120, 220, 800, 560, 22); g.fillStyle = PANEL; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(157,176,198,.55)'; g.stroke();
    rr(g, 1000, 220, 800, 560, 22); g.fillStyle = PANEL; g.fill(); g.strokeStyle = ACC; g.stroke();
    gtaChip(g, 5, 120, 170, 1); gtaChip(g, 6, 1000, 170, 1);
    if (a > 0) { g.save(); g.globalAlpha = clamp(a * 1.5, 0, 1); txt(g, '3', 520, 430 + (1 - a) * 60, 260, COOL, { wt: 900 }); txt(g, 'STORIES', 520, 640, 80, CREAM, { wt: 900, wide: true }); g.restore(); }
    if (b > 0) { g.save(); g.globalAlpha = clamp(b * 1.5, 0, 1); txt(g, '1', 1400, 430 + (1 - b) * 60, 260, ACC, { wt: 900 }); txt(g, 'STORY · 2 PEOPLE', 1400, 640, 72, CREAM, { wt: 900, wide: true }); g.restore(); }
    g.restore();
    seam(g, t, 0, 1);
  }

  /* chapter 2 · in Rockstar's words */
  function sQuote(g, t, s) {
    g.save(); push(g, t, s);
    var big = { x: 70, y: 180, w: 1000, h: 563 };
    gtaChip(g, 6, big.x, 135, 1, 'AN EXTENDED LOOK · 2026');
    panel(g, t, big, { uses: [U.walk], side: 6, slate: { big: 'JASON + LUCIA', bpx: 90, side: 6 }, note: 'JASON AND LUCIA, TOGETHER', noteT: U.walk.t0 + .2 });
    var q = cd(t, s.t0 + .1, 9);
    g.save(); g.globalAlpha = clamp(q * 1.4, 0, 1); g.translate((1 - q) * 120, 0);
    rr(g, 1130, 220, 720, 480, 20); g.fillStyle = CREAM; g.fill();
    txt(g, '“', 1170, 300, 160, ACC, { align: 'left', wt: 900 });
    ['…rely on', 'each other more', 'than ever…'].forEach(function (l, i) { txt(g, l, 1180, 400 + i * 84, 66, INK, { align: 'left', wt: 800 }); });
    txt(g, 'ROCKSTARGAMES.COM/VI', 1180, 650, 34, '#4a5260', { align: 'left', fam: MONO, wt: 700 });
    g.restore();
    g.restore();
  }

  /* chapter 3 · our flat maps (not to scale, no size claim) */
  function blob(g, pts, cx, cy, sc) {
    g.beginPath();
    for (var i = 0; i <= pts.length; i++) { var p = pts[i % pts.length], q = pts[(i + 1) % pts.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (i === 0) g.moveTo(cx + mx * sc, cy + my * sc); else g.quadraticCurveTo(cx + p[0] * sc, cy + p[1] * sc, cx + mx * sc, cy + my * sc); }
    g.closePath();
  }
  var ISL = [[-.5, -1], [.15, -1.05], [.55, -.7], [.6, -.1], [.4, .45], [.5, .9], [.05, 1.05], [-.45, .8], [-.6, .2], [-.4, -.35]];
  var LEO = [[-.9, -.95], [.2, -1], [.55, -.6], [.75, .1], [.95, .7], [.7, 1.0], [.35, .6], [.05, .15], [-.35, -.2], [-.95, -.55]];
  function sMaps(g, t, s) {
    g.save(); push(g, t, s);
    var a5 = cd(t, s.t0 + .1, 9), a6 = cd(t, at('m3c', 'state') - .3, 9);
    gtaChip(g, 5, 120, 150, 1); gtaChip(g, 6, 1000, 150, a6 > 0 ? 1 : .35);
    /* GTA 5: one island, city south, county north */
    g.save(); g.globalAlpha = clamp(a5 * 1.5, 0, 1); g.translate(0, (1 - a5) * 60);
    blob(g, ISL, 520, 560, 330); g.fillStyle = '#243041'; g.fill(); g.lineWidth = 4; g.strokeStyle = COOL; g.stroke();
    g.save(); blob(g, ISL, 520, 560, 330); g.clip(); g.fillStyle = 'rgba(157,176,198,.22)'; g.fillRect(0, 600, 1000, 600); g.restore();
    txt(g, 'BLAINE COUNTY', 520, 420, 44, CREAM, { wt: 800 });
    txt(g, 'LOS SANTOS', 520, 760, 44, CREAM, { wt: 800 });
    g.restore();
    var dk = fin(t, at('m3b', 'desert') - .25);
    /* GTA 6: a whole state with islands */
    if (a6 > 0) {
      g.save(); g.globalAlpha = clamp(a6 * 1.5, 0, 1); g.translate(0, (1 - a6) * 60);
      blob(g, LEO, 1420, 540, 360); g.fillStyle = '#3a1e16'; g.fill(); g.lineWidth = 4; g.strokeStyle = ACC; g.stroke();
      for (var i = 0; i < 7; i++) { circ(g, 1620 + i * 34, 930 - i * 12 + Math.sin(i * 2) * 8, 10 - i * .6); g.fillStyle = ACC; g.fill(); }
      var lk = fin(t, at('m3d', 'leonida') - .15);
      g.globalAlpha *= lk; txt(g, 'LEONIDA', 1380, 400, 72, CREAM, { wt: 900, wide: true });
      g.restore();
      var vk = cd(t, h('vice') - .05, 11);
      if (vk > 0) { circ(g, 1640, 820, 18 * vk); g.fillStyle = CREAM; g.fill(); chip(g, 'VICE CITY, USA', 1640, 880, { px: 44, bg: ACC, fg: INK, a: vk, s: lerp(1.3, 1, vk) }); }
    }
    chip(g, 'NOT TO SCALE · NO SIZE CLAIM', 960, 915, { px: 46, wt: 900, bg: CREAM, fg: INK });
    /* pin windows with the clips */
    function pin(u, x, y, side, label) {
      if (!u || t < u.t0 - .05 || t > u.t1 + .05) return;
      var k = Math.min(cd(t, u.t0, 12), 1 - seg(t, u.t1 - .12, u.t1)), b = { x: x, y: y, w: 600, h: 338 };
      g.save(); g.globalAlpha = k; g.translate(b.x + b.w / 2, b.y + b.h / 2); g.scale(lerp(.85, 1, k), lerp(.85, 1, k)); g.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
      panel(g, t, b, { uses: [u], side: side, slate: {} });
      if (label) chip(g, label, b.x + b.w / 2, b.y + b.h + 34, { px: 38, bg: side === 6 ? ACC : CREAM, fg: INK });
      g.restore();
    }
    pin(U.desert, 560, 180, 5, 'THE DESERT OUT BACK');
    pin(U.islands, 1180, 170, 6, 'ISLANDS');
    pin(U.highway, 1180, 170, 6, null);
    g.restore();
  }

  /* chapter 4 · runtimes on one timeline */
  function sRuntime(g, t, s) {
    g.save(); push(g, t, s);
    var x0 = 140, px = 1640 / 27;
    txt(g, 'GAMEPLAY REVEAL · RUNTIME', 140, 190, 64, CREAM, { align: 'left', wt: 900, wide: true });
    /* the minute ruler */
    var ra = fin(t, s.t0 + .1);
    g.save(); g.globalAlpha = ra;
    for (var m = 0; m <= 27; m++) { g.fillStyle = m % 5 ? FAINT : DIM; g.fillRect(x0 + m * px, 820, 3, m % 5 ? 20 : 36); if (m % 5 === 0) txt(g, m + ' MIN', x0 + m * px, 885, 32, DIM, { fam: MONO, wt: 600 }); }
    g.fillStyle = FAINT; g.fillRect(x0, 818, 1640, 3);
    g.restore();
    var k5 = eio(seg(t, at('g4b', 'runs') - .1, at('g4b', 'minutes') + .2)), k6 = eio(seg(t, at('g4d', '26') - .2, wend('g4d', 'seconds')));
    var c5 = fin(t, s.t0 + .25), c6 = fin(t, at('g4c', 'august') - .15);
    if (c5 > 0) {
      g.save(); g.globalAlpha = c5;
      gtaChip(g, 5, 140, 320, 1, 'GAMEPLAY VIDEO · ROCKSTAR-HOSTED CUT');
      rr(g, x0, 380, Math.max(16, 4.83 * px * k5), 110, 12); g.fillStyle = COOL; g.fill();
      if (k5 >= 1) txt(g, '4:50', x0 + 4.83 * px + 30, 438, 80, CREAM, { align: 'left', wt: 900 });
      g.restore();
    }
    if (c6 > 0) {
      g.save(); g.globalAlpha = c6;
      gtaChip(g, 6, 140, 570, 1, 'AN EXTENDED LOOK · AUG 27, 2026');
      rr(g, x0, 630, Math.max(16, 26.8 * px * k6), 110, 12); g.fillStyle = ACC; g.fill();
      if (k6 >= 1) txt(g, '26:48', x0 + 26.8 * px - 30, 688, 80, INK, { align: 'right', wt: 900 });
      g.restore();
    }
    var mk2 = cd(t, h('x55') - .05, 11);
    if (mk2 > 0) {
      g.save(); g.translate(1460, 420); g.rotate(-.03); g.scale(lerp(1.4, 1, mk2), lerp(1.4, 1, mk2)); g.globalAlpha = clamp(mk2 * 2, 0, 1);
      rr(g, -300, -90, 600, 180, 20); g.fillStyle = CREAM; g.fill();
      txt(g, '5.5× LONGER', 0, -14, 76, INK, { wt: 900, max: 540 }); txt(g, 'OUR MATH: 26:48 ÷ 4:50', 0, 52, 30, '#4a5260', { fam: MONO, wt: 700 });
      g.restore();
    }
    g.restore();
  }

  /* chapter 4 · "captured entirely from in-game footage" */
  function sCapt(g, t, s) {
    plateLayer(g, t, .6);
    g.save(); push(g, t, s);
    var q = cd(t, at('g4i', 'rockstar') - .1, 9);
    g.save(); g.globalAlpha = clamp(q * 1.4, 0, 1); g.translate(0, (1 - q) * 60);
    rr(g, 200, 240, 1520, 500, 24); g.fillStyle = CREAM; g.fill();
    txt(g, '“', 250, 330, 180, ACC, { align: 'left', wt: 900 });
    txt(g, 'Captured entirely from', 300, 420, 96, INK, { align: 'left', wt: 900 });
    txt(g, 'in-game footage on', 300, 530, 96, INK, { align: 'left', wt: 900 });
    txt(g, 'the PlayStation 5', 300, 640, 96, INK, { align: 'left', wt: 900 });
    g.restore();
    var c = fin(t, at('g4i', 'footage') + .1);
    if (c > 0) chip(g, 'ROCKSTARGAMES.COM/VI · AN EXTENDED LOOK', 960, 800, { px: 36, fam: MONO, wt: 700, bg: 'rgba(12,14,19,.9)', fg: CREAM, a: c });
    var p = cd(t, h('ps5') - .05, 11);
    if (p > 0) chip(g, 'CAPTURED ON PS5', 1640, 250, { px: 46, bg: ACC, fg: INK, s: lerp(1.3, 1, p), a: p, align: 'right' });
    g.restore();
  }

  /* chapter 5 · the date cards, then the calendars */
  function dateCard(g, x, y, w, h, top, big, side, k, sub) {
    if (k <= 0) return;
    g.save(); g.globalAlpha *= clamp(k * 1.5, 0, 1); g.translate(x + w / 2, y + h / 2); g.scale(lerp(.9, 1, k), lerp(.9, 1, k)); g.translate(-(x + w / 2), -(y + h / 2));
    rr(g, x, y, w, h, 16); g.fillStyle = side === 6 ? '#2a1812' : PANEL2; g.fill(); g.lineWidth = 3; g.strokeStyle = side === 6 ? ACC : 'rgba(157,176,198,.55)'; g.stroke();
    rr(g, x, y, w, 58, [16, 16, 0, 0]); g.fillStyle = side === 6 ? ACC : COOL; g.fill();
    txt(g, top, x + w / 2, y + 31, 32, INK, { fam: MONO, wt: 700 });
    txt(g, big, x + w / 2, y + 58 + (h - 58) / 2 - (sub ? 14 : 0), 64, CREAM, { wt: 900, max: w - 50 });
    if (sub) txt(g, sub, x + w / 2, y + h - 34, 30, DIM, { fam: MONO, wt: 600 });
    g.restore();
  }
  function sDates(g, t, s) {
    var dip = fin(t, at('l5d', 'missed') - .2, .5);
    g.save(); push(g, t, s);
    var ca = fin(t, s.t0 + .1), cb = cd(t, s.t0 + .2, 10);
    /* l5c: both trailers end on a date: our redrawn end cards */
    var up = eio(seg(t, start('l5d') - .1, start('l5d') + .6));
    g.save(); g.globalAlpha = 1 - up; g.translate(0, -up * 120);
    gtaChip(g, 5, PL.x, 160, ca, 'OFFICIAL TRAILER, 2013'); gtaChip(g, 6, PR.x, 160, ca, 'LAUNCH TRAILER, 2026');
    dateCard(g, PL.x + 60, 260, 750, 400, 'LAST CARD (REDRAWN)', 'SEPTEMBER 17', 5, cb);
    dateCard(g, PR.x + 60, 260, 750, 400, 'LAST CARD (REDRAWN)', 'NOVEMBER 19, 2026', 6, cb);
    g.restore();
    if (up > 0) {
      g.save(); g.globalAlpha = up;
      txt(g, 'BOTH MISSED THEIR FIRST DATE', 960, 180, 76, dip > .5 ? ACC2 : CREAM, { wt: 900, wide: true });
      gtaChip(g, 5, 120, 330, 1); gtaChip(g, 6, 120, 640, 1);
      /* empty slots deal in while the line lands, then each fills with its card */
      [[400, 270, 500], [1020, 270, 500], [400, 580, 420], [870, 580, 420], [1340, 580, 460]].forEach(function (b, i) {
        var gk = cd(t, start('l5d') + .7 + i * .22, 10);
        if (gk <= 0) return;
        g.save(); g.globalAlpha *= gk; g.setLineDash([14, 12]); g.lineWidth = 4; g.strokeStyle = i < 2 ? 'rgba(157,176,198,.8)' : 'rgba(255,90,54,.85)';
        rr(g, b[0], 270 + (b[1] - 270) + (1 - gk) * 40, b[2], 230, 16); g.fillStyle = i < 2 ? 'rgba(52,61,78,.9)' : 'rgba(64,32,22,.9)'; g.fill(); g.stroke(); g.restore();
      });
      var e5a = cd(t, at('l5e', 'spring') - .15, 11), x5 = cd(t, h('x1') - .05, 11), e5b = cd(t, h('d1') - .05, 11);
      dateCard(g, 400, 270, 500, 230, 'PLANNED', 'SPRING 2013', 5, e5a, 'TAKE-TWO, JAN 2013');
      strike(g, 430, 400, 870, eio(seg(t, h('x1') - .05, h('x1') + .25)));
      if (x5 > 0) { g.save(); g.globalAlpha = x5; txt(g, '→', 960, 385, 80, DIM, { wt: 900 }); g.restore(); }
      dateCard(g, 1020, 270, 500, 230, 'RELEASED', 'SEPT 17, 2013', 5, e5b, 'TAKE-TWO, JAN 31, 2013');
      if (e5b > 0) tickMark(g, 1480, 300, e5b, e5b, COOL);
      var e6a = cd(t, at('l5g', 'trailer') - .15, 11), e6b = cd(t, at('l5h', 'may') - .15, 11), e6c = cd(t, h('d2') - .05, 11);
      dateCard(g, 400, 580, 420, 230, 'TRAILER 1 END', '2025', 6, e6a, 'DEC 2023');
      strike(g, 430, 710, 790, eio(seg(t, h('x2') - .05, h('x2') + .25)));
      dateCard(g, 870, 580, 420, 230, 'TRAILER 2 END', 'MAY 26, 2026', 6, e6b, 'MAY 2025');
      strike(g, 900, 710, 1260, eio(seg(t, h('x3') - .05, h('x3') + .25)));
      dateCard(g, 1340, 580, 460, 230, 'RELEASED', 'NOV 19, 2026', 6, e6c, 'LAUNCH TRAILER END');
      if (e6c > 0) tickMark(g, 1760, 610, e6c, e6c, ACC);
      loopSheen(g, t, 400, 270, 1120, 230, at('l5e', 'spring') + .3, start('l5g') - .2, .24);
      loopSheen(g, t, 400, 580, 1400, 230, start('l5g') + .6, at('l5i', 'november'), .24);
      var sw = at('l5i', 'november') + .2;
      sheen(g, 400, 580, 1400, 230, seg(t, sw, sw + 1.3), .28);
      sheen(g, 400, 270, 1120, 230, seg(t, sw + .5, sw + 1.8), .22);
      g.restore();
    }
    g.restore();
    if (dip > 0) { g.fillStyle = 'rgba(0,0,0,' + (.18 * dip * (1 - seg(t, at('l5i', 'came'), at('l5i', 'came') + .6))) + ')'; g.fillRect(0, 0, W, H); }
  }

  /* chapter 5 · first trailer to launch, in days (our math) */
  function sDays(g, t, s) {
    g.save(); push(g, t, s);
    txt(g, 'FIRST TRAILER → LAUNCH', 140, 190, 72, CREAM, { align: 'left', wt: 900, wide: true });
    chip(g, 'OUR MATH', 1780, 190, { px: 36, fam: MONO, wt: 700, bg: CREAM, fg: INK, align: 'right' });
    var px = 1500 / 1081;
    var k5 = eio(seg(t, at('l5j', 'gta') - .1, at('l5j', '22') + .1)), k6 = eio(seg(t, at('l5k', 'gta') - .1, at('l5k', 'took') + .1));
    gtaChip(g, 5, 140, 330, 1, 'NOV 2, 2011 → SEPT 17, 2013');
    rr(g, 140, 380, Math.max(16, 685 * px * k5), 120, 12); g.fillStyle = COOL; g.fill();
    if (k5 >= 1) { txt(g, '685 DAYS', 140 + 685 * px + 30, 425, 70, CREAM, { align: 'left', wt: 900 }); txt(g, '≈ 22 MONTHS', 140 + 685 * px + 30, 482, 38, DIM, { align: 'left', fam: MONO, wt: 600 }); }
    gtaChip(g, 6, 140, 600, fin(t, start('l5k') - .3), 'DEC 4, 2023 → NOV 19, 2026');
    if (t > start('l5k') - .3) { rr(g, 140, 650, Math.max(16, 1081 * px * k6), 120, 12); g.fillStyle = ACC; g.fill(); }
    if (k6 >= 1) { txt(g, '1,081 DAYS', 140 + 1081 * px - 30, 700, 70, INK, { align: 'right', wt: 900 }); txt(g, '≈ 3 YEARS', 140 + 1081 * px - 30, 820, 40, ACC2, { align: 'right', fam: MONO, wt: 700 }); }
    g.restore();
  }

  /* chapter 6 · launch day: the clips, then two stacks of money */
  function stack(g, x, base, h, col, k, o) {
    if (k <= 0) return;
    var hh = h * k, n = Math.max(1, Math.round(hh / 26));
    for (var i = 0; i < n; i++) { var y = base - (i + 1) * (hh / n); rr(g, x - 150, y, 300, hh / n - 3, 6); g.fillStyle = i % 2 ? col : (o && o.alt) || col; g.fill(); }
  }
  function sLaunch(g, t, s) {
    plateLayer(g, t, .62);
    g.save(); push(g, t, s);
    var base = 880, h5 = 116;
    /* clip windows first */
    var p5 = { x: 120, y: 170, w: 760, h: 428 }, p6 = { x: 1040, y: 170, w: 760, h: 428 };
    var s5 = cd(t, h('m800') - .05, 9), s6 = cd(t, at('n6d', 'day') - .2, 9);
    g.save(); g.globalAlpha = 1 - s5; g.translate(0, -s5 * 300);
    gtaChip(g, 5, p5.x, 130, 1, 'SEPT 17, 2013');
    panel(g, t, p5, { uses: [U.plane5], side: 5, slate: { big: 'SEPT 17, 2013', bpx: 80, small: 'GTA 5 LAUNCHES' }, note: null });
    g.restore();
    if (t > start('n6c') - .5) {
      g.save(); g.globalAlpha = (1 - s6) * fin(t, start('n6c') - .5); g.translate(0, -s6 * 300);
      gtaChip(g, 6, p6.x, 130, 1, 'NOV 19, 2026');
      panel(g, t, p6, { uses: [U.boat], side: 6, slate: { big: 'NOV 19, 2026', bpx: 80, small: 'GTA 6 LAUNCHES', side: 6 }, note: null });
      g.restore();
    }
    /* the stacks: $800M+ is one unit, $3.79B is 4.74 units */
    if (s5 > 0) {
      stack(g, 500, base, h5, '#56657a', s5, { alt: COOL });
      txt(g, '$800M+', 500, base - h5 * s5 - 70, 92, CREAM, { wt: 900 });
      txt(g, 'TAKE-TWO · SEPT 18, 2013', 500, base + 50, 32, DIM, { fam: MONO, wt: 600 });
      gtaChip(g, 5, 350, base - h5 - 190, s5, 'DAY ONE');
    }
    var sl = cd(t, h('b379') - .05, 13);
    if (sl > 0) {
      g.save(); g.translate(0, (1 - sl) * -200);
      stack(g, 1420, base, h5 * 4.74, '#c8462a', 1, { alt: ACC });
      g.restore();
      var vk = sl * kn(t, h('b379') + .1, .04);
      g.save(); g.translate(1420, base - h5 * 4.74 - 70); g.scale(vk, vk); txt(g, '$3.79B', 0, 0, 104, ACC2, { wt: 900 }); g.restore();
      txt(g, 'TAKE-TWO · NOV 20, 2026 · COMPANY ESTIMATE', 1420, base + 50, 32, DIM, { fam: MONO, wt: 600 });
      gtaChip(g, 6, 1420, base - h5 * 4.74 - 160, 1, 'DAY ONE', 'center');
    }
    /* n6e: four GTA 5 stacks fit inside */
    var fk = t > at('n6e', 'four') - .3;
    if (fk) for (var i = 0; i < 4; i++) {
      var k = cd(t, at('n6e', 'four') - .3 + i * .16, 12), y0 = base - (i + 1) * h5;
      if (k <= 0) continue;
      g.save(); g.globalAlpha = k; rr(g, 1270, y0 + 3, 300, h5 - 6, 8); g.setLineDash([12, 8]); g.lineWidth = 5; g.strokeStyle = CREAM; g.stroke(); g.setLineDash([]);
      txt(g, '$800M', 1420, y0 + h5 / 2, 40, CREAM, { wt: 900 }); g.restore();
    }
    var mt = cd(t, h('x4') - .05, 11);
    if (mt > 0) {
      g.save(); g.translate(960, 500); g.scale(lerp(1.3, 1, mt), lerp(1.3, 1, mt)); g.globalAlpha = clamp(mt * 2, 0, 1);
      rr(g, -250, -80, 500, 160, 18); g.fillStyle = CREAM; g.fill();
      txt(g, 'MORE THAN 4×', 0, -16, 58, INK, { wt: 900, max: 450 }); txt(g, 'OUR MATH · NOT INFLATION-ADJUSTED', 0, 44, 24, '#4a5260', { fam: MONO, wt: 700 }); g.restore();
    }
    var pr = cd(t, h('c325') - .05, 10);
    if (pr > 0) {
      g.save(); g.globalAlpha = clamp(pr * 1.5, 0, 1); g.translate((1 - pr) * -120, 0);
      rr(g, 120, 150, 660, 230, 20); g.fillStyle = PANEL2; g.fill(); g.lineWidth = 3; g.strokeStyle = ACC; g.stroke();
      txt(g, '32.5M', 160, 230, 104, ACC2, { align: 'left', wt: 900 });
      txt(g, 'GTA 6 COPIES SOLD BEFORE LAUNCH', 160, 320, 40, CREAM, { align: 'left', wt: 800, max: 580 });
      g.restore();
    }
    g.restore();
  }

  /* chapter 6 · same playbook: the five plays tick, the scoreboard differs */
  function sSame(g, t, s) {
    g.save(); push(g, t, s);
    var hit = { 0: at('n6h', 'opening') - .05, 2: at('n6h', 'opening') + .35, 3: at('n6h', 'opening') + .65, 4: at('n6h', 'late') - .05 };
    clipboard(g, t, 520, 560, { rot: -.02, rows: function (i) { return hit[i] == null ? .3 : 1; }, tick: function (i, six) { return hit[i] == null ? -1 : t - hit[i] - (six ? .12 : 0); } });
    g.save(); g.translate(520, 560); g.rotate(-.02);
    var xk = eio(seg(t, at('n6h', 'beats') + .1, at('n6h', 'beats') + .35));
    if (xk > 0) { g.save(); g.strokeStyle = ACC; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(272, -58); g.lineTo(272 + 36 * xk, -58 + 36 * xk); g.moveTo(308, -58); g.lineTo(308 - 36 * xk, -58 + 36 * xk); g.stroke(); g.restore(); }
    g.restore();
    var y = fin(t, h('yes') - .05);
    if (y > 0) chip(g, 'YES · 4 OF 5 MATCH', 520, 965 - 30, { px: 50, bg: ACC, fg: INK, a: y, s: lerp(1.2, 1, cd(t, h('yes') - .05, 11)) });
    var sb = cd(t, at('n6i', 'different') - .15, 10);
    var q = fin(t, s.t0 + .1);
    g.save(); g.globalAlpha = q; txt(g, 'SAME PLAYBOOK?', 1080, 210, 84, CREAM, { align: 'left', wt: 900, wide: true, max: 720 }); g.restore();
    if (sb > 0) {
      g.save(); g.globalAlpha = clamp(sb * 1.5, 0, 1); g.translate((1 - sb) * 120, 0);
      rr(g, 1080, 300, 720, 520, 22); g.fillStyle = PANEL; g.fill(); g.lineWidth = 3; g.strokeStyle = FAINT; g.stroke();
      txt(g, 'DAY-ONE SALES', 1440, 370, 40, DIM, { fam: MONO, wt: 700, ls: 3 });
      gtaChip(g, 5, 1130, 480, 1); txt(g, '$800M+', 1760, 482, 84, COOL, { align: 'right', wt: 900 });
      g.fillStyle = FAINT; g.fillRect(1130, 560, 620, 3);
      gtaChip(g, 6, 1130, 650, 1); txt(g, '$3.79B', 1760, 652, 96, ACC2, { align: 'right', wt: 900 });
      txt(g, 'MORE THAN 4× ON DAY ONE', 1440, 770, 40, CREAM, { wt: 800 });
      g.restore();
    }
    g.restore();
  }

  /* ---------- transitions: the seam opens on the next scene ---------- */
  function wipe(g, t, s, prev) {
    var k = eio(seg(t, s.t0 - .02, s.t0 + .4));
    if (k >= 1 || !prev || s.wipe === 'none') { s.draw(g, t, s); return; }
    g.save(); g.globalAlpha = 1 - k; prev.draw(g, t, prev); g.restore();
    g.save(); g.beginPath();
    if (s.wipe === 'seam') { var hw = k * 980; g.rect(960 - hw, 0, hw * 2, H); }
    else { var x = -200 + k * (W + 400); g.moveTo(-10, -10); g.lineTo(x + 90, -10); g.lineTo(x - 90, H + 10); g.lineTo(-10, H + 10); g.closePath(); }
    g.clip(); stage(g, t); s.draw(g, t, s); g.restore();
    g.save(); g.strokeStyle = ACC; g.lineWidth = 8;
    if (s.wipe === 'seam') { var hw2 = k * 980; g.beginPath(); g.moveTo(960 - hw2, 0); g.lineTo(960 - hw2, H); g.moveTo(960 + hw2, 0); g.lineTo(960 + hw2, H); g.stroke(); }
    else { x = -200 + k * (W + 400); g.beginPath(); g.moveTo(x + 90, -10); g.lineTo(x - 90, H + 10); g.stroke(); }
    g.restore();
  }

  /* ---------- frame ---------- */
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.filter = 'none';
    stage(g, t);
    var i = sceneAt(t), s = SC[i];
    g.save(); wipe(g, t, s, i > 0 ? SC[i - 1] : null); g.restore();
    if (s.idle) { g.save(); s.idle(g, t, s); g.restore(); }
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    chrome(g, t, s);
    captions(g, t, s);
  }

  /* ---------- times: scenes, clip uses, texts, sound ---------- */
  function initTimes() {
    CLIP.reset(); TX.length = 0; EV.length = 0; SC.length = 0; CH.length = 0;
    var M = CLIP.manifest().clips;
    sc('hook', 0, sHook, { wipe: 'none' });
    sc('deck', start('open2') - .3, sDeck);
    sc('apart', start('open3') - .3, sApart);
    sc('tease', start('open4') - .3, sTease);
    sc('book', start('open5') - .3, sBook);
    sc('rail', start('open6') - .3, sRail);
    var cards = [];
    function card(n, line) { var s2 = sc('c' + n, start(line) - .7, sCard, { card: n, line: line, wipe: 'seam' }); cards.push(s2); CH.push({ t: s2.t0, name: CHN[n - 1] }); return s2; }
    card(1, 'ch1');
    sc('first', start('t1a') - .35, sFirst);
    sc('beats', start('t1c') - .3, sBeats);
    sc('wild', start('t1f') - .3, splitScene({ chips: ['GTA V TRAILER', 'TRAILER 1'],
      L: function () { return { uses: [U.hike], slate: { big: 'THE CITY…', bpx: 90 }, note: 'HIKERS ON A MOUNTAIN', noteT: U.hike.t0 + .2 }; },
      R: function () { return { uses: [U.swamp], slate: { big: 'THE CITY…', bpx: 90, side: 6 }, note: 'A SWAMP, THEN FLAMINGOS', noteT: U.swamp.t0 + .2 }; },
      match: function () { return U.hike.t1 - .7; } }));
    sc('face', start('t1i') - .3, splitScene({ chips: ['GTA V TRAILER', 'TRAILER 1'],
      L: function () { return { uses: [U.mike], slate: { big: 'ONE FACE', bpx: 90 }, note: 'MICHAEL ABOVE LOS SANTOS', noteT: at('t1j', 'michael') - .1 }; },
      R: function () { return { uses: [U.lucia1], slate: { big: 'ONE FACE', bpx: 90, side: 6 }, note: 'LUCIA AT A WINDOW', noteT: at('t1j', 'lucia') - .1 }; },
      match: function () { return U.mike.t1 - .7; } }));
    sc('views', start('t1k') - .3, sViews);
    card(2, 'ch2');
    sc('wheel', start('h2a') - .3, sWheel);
    sc('two', start('h2f') - .3, sTwo);
    sc('t2', start('h2h') - .3, splitScene({ chips: ['TRAILER 2 · MAY 6, 2025', 'TRAILER 2 · MAY 6, 2025'], chipSides: [6, 6],
      L: function () { return { side: 6, uses: [U.jason], slate: { big: 'JASON', bpx: 110, small: 'FIRST · 0:19', side: 6 }, note: 'JASON FIRST · 0:19', noteT: U.jason.t0 + .2 }; },
      R: function () { return { uses: [U.fence], slate: { big: 'LUCIA', bpx: 110, small: 'THEN · 1:03', side: 6 }, note: 'THEN LUCIA · 1:03', noteT: U.fence.t0 + .2 }; } }));
    sc('score', start('h2j') - .3, sScore);
    sc('quote', start('h2k') - .55, sQuote);
    card(3, 'ch3');
    sc('maps', start('m3a') - .3, sMaps, { idle: function (g, t, s) { loopSheen(g, t, 90, 190, 820, 600, s.t0 + .8, start('m3c') - .2, .2); } });
    sc('boats', start('m3f') - .3, splitScene({ chips: ['GAMEPLAY VIDEO · 2013', 'TRAILER 2 · 2025'],
      L: function () { return { uses: [U.speed], slate: { big: 'SAME SHOT?', bpx: 84 }, note: 'SPEEDBOAT · LOS SANTOS', noteT: U.speed.t0 + .2 }; },
      R: function () { return { uses: [U.jetski], slate: { big: 'SAME SHOT?', bpx: 84, side: 6 }, note: 'JET SKI · LEONIDA', noteT: U.jetski.t0 + .2 }; },
      match: function () { return U.speed.t1 - .7; } }));
    sc('dusk', start('m3i') - .3, splitScene({ chips: ['GAMEPLAY VIDEO · 2013', 'AN EXTENDED LOOK · 2026'],
      L: function () { return { uses: [U.canal], slate: { big: 'SUNDOWN', bpx: 96 }, note: 'LOS SANTOS AT DUSK', noteT: U.canal.t0 + .2 }; },
      R: function () { return { uses: [U.helis], slate: { big: 'SUNDOWN', bpx: 96, side: 6 }, note: 'HELICOPTERS OVERHEAD', noteT: U.helis.t0 + .2 }; },
      match: function () { return U.canal.t1 - .7; } }));
    card(4, 'ch4');
    sc('runtime', start('g4a') - .3, sRuntime);
    sc('beats4', start('g4f') - .3, splitScene({ chips: ['GAMEPLAY VIDEO · 2013', 'AN EXTENDED LOOK · 2026'],
      L: function (t) { return { uses: [U.truck, U.rob5], ring: t < U.rob5.t0 - .2 ? [.09, .93] : null, slate: t < at('g4h', 'then') - .2 ? { big: 'DRIVE', bpx: 110, small: 'CAR · MINIMAP' } : { big: 'ROB', bpx: 110, small: 'MASK · STORE' }, note: t < at('g4h', 'then') - .2 ? 'CAR, MINIMAP, DRIVE' : 'MASKS ON, A STORE ROBBERY', noteT: U.truck.t0 + .2 }; },
      R: function (t) { return { uses: [U.conv, U.rob6], ring: t < U.rob6.t0 - .2 ? [.09, .92] : null, slate: t < at('g4h', 'then') - .2 ? { big: 'DRIVE', bpx: 110, small: 'CAR · MINIMAP', side: 6 } : { big: 'ROB', bpx: 110, small: 'MASK · STORE', side: 6 }, note: t < at('g4h', 'then') - .2 ? 'CAR, MINIMAP, DRIVE' : 'BANDANAS ON, A STORE ROBBERY', noteT: U.conv.t0 + .2 }; },
      match: function () { return U.rob6.t1 - .3; } }));
    sc('capt', start('g4i') - .3, sCapt);
    card(5, 'ch5');
    sc('last', start('l5a') - .3, splitScene({ chips: ['OFFICIAL TRAILER · 2013', 'LAUNCH TRAILER · OCT 15, 2026'],
      L: function () { return { uses: [U.chute, U.minigun], slate: { big: '1:00', bpx: 130, small: 'ONE MINUTE' }, note: 'RUNTIME 1:00', noteT: start('l5a') + .3 }; },
      R: function () { return { uses: [U.lowrider, U.iguana], slate: { big: '1:29', bpx: 130, small: 'ABOUT 1.5 MINUTES', side: 6 }, note: 'RUNTIME 1:29', noteT: start('l5b') + .3 }; } }));
    sc('dates', start('l5c') - .3, sDates);
    sc('days', start('l5j') - .3, sDays);
    card(6, 'ch6');
    sc('launch', start('n6a') - .3, sLaunch, { idle: function (g, t, s) { loopSheen(g, t, 100, 130, 700, 270, h('c325') + .5, s.t1, .22); } });
    sc('same', start('n6g') - .3, sSame);
    sc('end', start('n6j') - .3, sHook, { final: true });
    SC.forEach(function (s2, i) { s2.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; if (!s2.wipe) s2.wipe = 'slide'; });

    /* ---- clip uses: each under 5 s; at least 0.35 s of our own graphics between footage runs ---- */
    use('sky5', 'sky5', 0, start('open2') - .1, { note: 'GTA V Trailer (2011) sunset skyline with oil pump, left of the seam under GTA 5 vs GTA 6', zoom: [1.0, 1.08], focus: [.45, .5] });
    use('t1s', 't1sun', 0, start('open2') - .1, { note: 'GTA VI Trailer 1 (2023) sunset through a fence, right of the seam under GTA 5 vs GTA 6 and the 2023 chip', zoom: [1.0, 1.08], focus: [.5, .5] });
    use('roof', 'roof', start('open3') - .1, Math.min(start('open3') + 2.4, start('open4') - .45), { note: 'GTA V Gameplay Video: Michael, Franklin, Trevor on a rooftop, labeled, left of the seam under 13 YEARS APART', zoom: [1.02, 1.1], focus: [.55, .5] });
    use('lean', 'lean', start('open3') + .35, U.roof.t1, { note: 'GTA VI Launch Trailer: Jason and Lucia leaning on a car, right of the seam, running with the rooftop trio', zoom: [1.0, 1.08], focus: [.4, .5] });
    use('signs', 'signs', start('t1a') + .1, start('t1a') + 2.1, { note: 'GTA V Trailer (2011) freeway signs under the NOV 2, 2011 date chip', focus: [.6, .4] });
    use('vcnight', 'vcnight', start('t1b') + .1, start('t1b') + 2.3, { note: 'GTA VI Trailer 1 Vice City aerial at night under the DEC 4, 2023 date chip' });
    var w0 = at('t1g', 'hikers') - .55;
    use('hike', 'hike', w0, w0 + 4.2, { note: 'GTA V Trailer: hikers on a mountain, labeled, running beside the swamp', focus: [.5, .45] });
    use('swamp', 'swamp', w0 + .45, w0 + 4.55, { note: 'GTA VI Trailer 1: swamp then flamingos, labeled, beside the hikers; seam ticks MATCH' });
    var f0 = at('t1j', 'michael') - 1.6;
    use('mike', 'mike', f0, f0 + 4.2, { note: 'GTA V Trailer: Michael above the skyline, on screen while he is named', focus: [.7, .4] });

    use('lucia1', 'lucia1', f0 + .45, f0 + 4.55, { note: 'GTA VI Trailer 1: Lucia at a window, beside Michael; seam ticks MATCH', focus: [.35, .45] });
    /* chapter 2 */
    var h0 = at('h2b', 'michael') - .25;
    use('michael', 'michael', h0, at('h2b', 'franklin') - .1, { note: 'GTA V Official Trailer: Michael, the wheel lights MICHAEL', focus: [.7, .4] });
    use('franklin', 'franklin', at('h2b', 'franklin') - .1, at('h2b', 'trevor') - .1, { note: 'GTA V Official Trailer: Franklin, the wheel lights FRANKLIN', focus: [.4, .4] });
    use('trevor', 'trevor', at('h2b', 'trevor') - .1, Math.min(at('h2b', 'trevor') + 1.6, h0 + 4.6), { note: 'GTA V Official Trailer: Trevor, the wheel lights TREVOR', focus: [.35, .4] });
    var sw0 = Math.max(U.trevor.t1 + .45, at('h2d', 'camera') - .5);
    use('sw', 'switch', sw0, Math.min(sw0 + 4.4, start('h2f') - .4), { note: 'GTA V Gameplay Video: the character switch, camera up to satellite view and down, our wheel arc travels MICHAEL to TREVOR', zoom: [1.0, 1.04] });
    use('jason', 'jason', start('h2h') + .2, Math.min(start('h2h') + 3.4, at('h2i', 'lucia') - .55), { note: 'GTA VI Trailer 2: Jason on the porch, labeled JASON FIRST 0:19', focus: [.6, .4] });
    use('fence', 'fence', at('h2i', 'lucia') - .15, at('h2i', 'lucia') + 2.3, { note: 'GTA VI Trailer 2: Lucia outside the prison fence, labeled THEN LUCIA 1:03', focus: [.4, .4] });
    use('walk', 'walk', start('h2k') - .1, start('h2k') + 3.7, { note: 'GTA VI An Extended Look: Jason and Lucia walking through a rooftop bar beside the Rockstar quote strip' });
    /* chapter 3 */
    use('desert', 'desert', at('m3b', 'desert') - .6, at('m3b', 'desert') + 1.6, { note: 'GTA V Gameplay Video: desert town in a pin window on our sketch map, THE DESERT OUT BACK' });
    use('islands', 'islands', at('m3c', 'whole') - .2, Math.min(at('m3c', 'whole') + 1.9, at('m3e', 'vice') - .75), { note: 'GTA VI Trailer 2: islands from the air in a pin window on our sketch of Leonida, ISLANDS' });
    use('highway', 'highway', at('m3e', 'vice') - .35, Math.min(at('m3e', 'vice') + 2.4, start('m3f') - .2), { note: 'GTA VI Trailer 2: highway into the city with the VICE CITY, USA chip' });
    var b0 = at('m3g', 'speedboat') - .35;
    use('speed', 'speed', b0, b0 + 4.0, { note: 'GTA V Gameplay Video: speedboat under a bridge, labeled, beside the jet ski' });
    use('jetski', 'jetski', b0 + .45, b0 + 4.3, { note: 'GTA VI Trailer 2: jet ski with the skyline behind, beside the speedboat; seam ticks MATCH' });
    var d0 = at('m3j', 'los') - 1.0;
    use('canal', 'canal', d0, d0 + 4.0, { note: 'GTA V Gameplay Video: Los Santos at dusk over a canal, beside the helicopters' });
    use('helis', 'helis', d0 + .45, d0 + 4.45, { note: 'GTA VI An Extended Look: skyline with helicopters, beside Los Santos at dusk; seam ticks MATCH', focus: [.6, .3] });
    /* chapter 4 */
    var g0 = at('g4g', 'car') - .25;
    use('truck', 'truck', g0, g0 + 2.0, { note: 'GTA V Gameplay Video: truck on a desert road, our ring on the minimap', zoom: [1, 1.05], focus: [.3, .7] });
    use('conv', 'conv', g0 + .1, Math.min(g0 + 3.4, at('g4h', 'then') - .45), { note: 'GTA VI An Extended Look: red convertible pulls out, our ring on the minimap', zoom: [1, 1.05], focus: [.3, .7] });
    use('rob5', 'rob5', Math.max(U.conv.t1 + .4, at('g4h', 'mask') - .3), Math.max(U.conv.t1 + .4, at('g4h', 'mask') - .3) + 2.3, { note: 'GTA V Gameplay Video: masked crew in a jewelry store, labeled' });
    use('rob6', 'rob6', U.rob5.t0 + .3, U.rob5.t0 + .3 + 1.7, { note: 'GTA VI An Extended Look: bandana robbery in a store, labeled, seam ticks MATCH', focus: [.5, .4] });
    /* chapter 5 */
    use('chute', 'chute', start('l5a') + .05, start('l5a') + 2.3, { note: 'GTA V Official Trailer: parachute at night, RUNTIME 1:00, beside the lowrider' });
    use('lowrider', 'lowrider', start('l5a') + .5, start('l5a') + 2.6, { note: 'GTA VI Launch Trailer: green lowrider with a crew, beside the parachute' });
    use('minigun', 'minigun', start('l5b') + .05, start('l5b') + 2.3, { note: 'GTA V Official Trailer: minigun, a plane goes down, beside the iguana' });

    use('iguana', 'iguana', start('l5b') + .5, Math.min(start('l5b') + 2.6, start('l5c') - .35), { note: 'GTA VI Launch Trailer: iguana on the road, RUNTIME 1:29, beside the minigun' });
    /* chapter 6 */
    use('plane5', 'plane5', at('n6a', 'gta') - .2, at('n6a', 'gta') + 1.6, { note: 'GTA V Trailer (2011): plane over the city at dusk under SEPT 17, 2013, before the $800M+ stack' });
    use('boat', 'boat', start('n6c') - .1, Math.min(start('n6c') + 2.8, at('n6d', 'day') - .25), { note: 'GTA VI An Extended Look: boat crew on the water under NOV 19, 2026, before the $3.79B stack' });
    /* end: the frame-0 sunsets again, under the vote */
    use('sky5b', 'sky5', start('n6j') - .2, start('n6j') + 2.6, { note: 'end vote: GTA V Trailer (2011) sunset skyline under WHICH FIRST TRAILER WINS? (same use as frame 0)', zoom: [1.08, 1.0], focus: [.45, .5] });
    use('t1sb', 't1sun', start('n6j') - .2, start('n6j') + 2.6, { note: 'end vote: GTA VI Trailer 1 (2023) sunset under WHICH FIRST TRAILER WINS? (same use as frame 0)', zoom: [1.08, 1.0] });
    ES = wend('n6k', 'comments') + .5;

    /* ---- background plates (rule 11): dimmed, under our cards only ---- */
    plate('p1', 'pdock', S('book').t0, S('book').t1);
    plate('p2', 'pstreet', S('rail').t0, S('rail').t1);
    plate('pc1', 'pvchute', S('c1').t0, S('c1').t1);
    plate('pv1', 'pt1st', S('views').t0, S('views').t0 + 4.8);
    plate('pv', 'pcause', S('views').t0 + 5.1, S('views').t1);
    plate('pc2', 'pel365', S('c2').t0, S('c2').t1);
    plate('pc3', 'pcanyon', S('c3').t0, S('c3').t1);
    plate('pc4', 'pwindow', S('c4').t0, S('c4').t1);
    plate('pcap', 'pel380', S('capt').t0, S('capt').t1);
    plate('pc5', 'pelst', S('c5').t0, S('c5').t1);
    if (M.pc6) plate('pc6', 'pc6', S('c6').t0, S('c6').t1);

    /* ---- sound: hits in the voice's own pauses ---- */
    G(.0, 'thump', { g: .5 }, .2);
    SC.forEach(function (s2, i) { if (i) G(s2.t0 - (s2.card ? .1 : .05), s2.card ? 'card' : 'swish', null, .4); });   // card hits lead so the line's first word ("Chapter") starts clean
    [0, 1, 2, 3, 4, 5, 6].forEach(function (i) { G(at('open2', 'every') + i * .17, 'flip', { g: .7 }, .5); });
    HB('apart', at('open3', 'thirteen') - .05, 'stamp');
    G(at('open5', 'same') - .1, 'pop', null, .5);
    for (var i = 0; i < 6; i++) G(at('open6', 'six') + .02 + i * .22, 'tick', { g: .5 }, .5);
    HB('d2011', wend('t1a', '2011') + .05, 'pop'); HB('d2023', wend('t1b', '2023') + .05, 'pop');
    ['beach', 'presents'].forEach(function (w) { G(at('t1d', w) - .1, 'tick', { g: .8 }, .4); }); G(at('t1e', 'water') - .1, 'tick', { g: .8 }, .4);
    [U.hike.t1 - .7, U.mike.t1 - .7, U.speed.t1 - .7, U.canal.t1 - .7, U.rob6.t1 - .3].forEach(function (tt) { G(tt, 'ding1', null, .5); });
    G(at('t1k', 'doesnt') - .2, 'whoosh', null, .5);
    HB('n93s', at('t1l', '93') - .15, 'slam', null, 2.3); HT.n93 = at('t1l', '93') - .1; HDIFF.n93 = 0; HB('h24', at('t1m', '24') - .1, 'pop'); HB('rec', start('t1n') - .1, 'stamp');
    ['michael', 'franklin', 'trevor'].forEach(function (w) { G(at('h2b', w) - .1, 'tick', { g: .8 }, .4); });
    G(U.sw.t0 + (U.sw.t1 - U.sw.t0) * .3, 'rise', { t1: U.sw.t0 + (U.sw.t1 - U.sw.t0) * .6 }, .6);
    G(at('h2f', 'two') + .1, 'whoosh', null, .5); HB('sc3', at('h2j', 'three') - .1, 'pop'); HT.sc1 = at('h2j', 'one') - .5; HDIFF.sc1 = 0;
    G(S('quote').t0 + .1, 'flip', { g: 1 }, .5);
    G(at('m3c', 'state') - .3, 'whoosh', null, .5); HB('vice', at('m3e', 'vice') - .15, 'pop', null, 2.3);
    G(at('g4b', 'runs') - .1, 'rise', { t1: at('g4b', 'minutes') + .2 }, .4); G(at('g4d', '26') - .2, 'rise', { t1: wend('g4d', 'seconds') }, .4); HB('x55', start('g4e') - .1, 'stamp');
    HB('ps5', at('g4j', 'playstation') - .1, 'pop');
    G(at('l5c', 'date') - .15, 'flip', { g: 1 }, .5);
    HB('x1', at('l5f', 'slipped') - .1, 'cross', null, .8); HB('x2', at('l5h', 'trailer') - .1, 'cross', null, .8); HB('x3', start('l5i') - .75, 'cross', null, .8);
    HB('d1', at('l5f', 'september') - .15, 'ding1'); HB('d2', start('l5i') - .4, 'ding1', null, .6);
    G(at('l5j', 'gta') - .1, 'rise', { t1: at('l5j', '22') }, .4); G(at('l5k', 'gta') - .1, 'rise', { t1: at('l5k', 'took') }, .4);
    HB('m800', start('n6b') - .55, 'rise', { t1: start('n6b') }, .6); HB('b379', at('n6d', '3.79') - .1, 'slam');
    HB('x4', at('n6e', 'times') - .1, 'stamp'); HB('c325', start('n6f') - .4, 'pop', null, .6);
    ['opening', 'late'].forEach(function (w) { G(at('n6h', w) - .05, 'tick', { g: .9 }, .4); });
    HB('yes', at('n6h', 'yes') - .1, 'stamp'); G(at('n6i', 'different') - .15, 'pop', null, .5);
    G(at('n6k', '2011') - .1, 'pop', null, .5);
    /* ---- texts that must stay readable ---- */
    cards.forEach(function (c) { T('card' + c.card, CHN[c.card - 1], c.t0 + .3, c.t1); });
    T('hook', 'GTA 5 vs GTA 6', 0, start('open2') - .1);
    T('apart', '13 YEARS APART', h('apart') + .15, S('apart').t1);
    T('book', 'SAME PLAYBOOK TWICE?', S('book').t0 + .35, S('book').t1);
    T('views', '93,000,000+ YOUTUBE VIEWS', h('n93') + .15, S('views').t1);
    T('record', 'RECORD: NON-MUSIC DEBUT', h('rec') + .15, S('views').t1);
    T('score5', '3 STORIES', h('sc3') + .15, S('score').t1); T('score6', '1 STORY · 2 PEOPLE', h('sc1') + .15, S('score').t1);
    T('quote', '…rely on each other more than ever…', S('quote').t0 + .2, S('quote').t1);
    T('runtime', '5.5× LONGER', h('x55') + .15, S('runtime').t1); T('rt', '4:50 vs 26:48', wend('g4d', 'seconds'), S('runtime').t1);
    T('capt', 'Captured entirely from in-game footage on the PlayStation 5', at('g4i', 'rockstar'), S('capt').t1);
    T('missed', 'BOTH MISSED THEIR FIRST DATE', start('l5d') + .3, S('dates').t1);
    T('days5', '685 DAYS', at('l5j', '22') + .1, S('days').t1); T('days6', '1,081 DAYS', at('l5k', 'took') + .1, S('days').t1);
    T('money', '$800M+ vs $3.79B', h('b379') + .15, h('c325'));
    T('copies', '32.5M COPIES SOLD BEFORE LAUNCH', h('c325') + .15, S('launch').t1);
    T('same', 'YES · 4 OF 5 MATCH', h('yes') + .15, S('same').t1);
    T('vote', 'WHICH FIRST TRAILER WINS?', at('n6j', 'which'), DUR);

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

  /* ---------- sound: foley cut to the word times; no music ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(11);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.1), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .14; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function tickS(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 4; var n = noise(t, .04); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .3], [t + .035, 0]]); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, 1, [[t, 0], [t + .004, g || .4], [t + .24, 0]], .1); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    /* every hit carries a 1-3 kHz edge so it reads on a phone speaker (LESSONS wifi r2) */
    function swish(t) { band(t, t + .26, 900, 4200, .16, .03, 1.6); }
    function whoosh(t) { band(t, t + .4, 500, 3800, .18, .03, 1.2); }
    function card(t) { band(t, t + .3, 3800, 700, .16, .03, 1.2); thump(t + .05, .3); tickS(t + .06, .25); }
    function stampS(t) { thump(t, .6); var n = noise(t, .16), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = .9; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, .5], [t + .12, 0]]); tickS(t + .005, .3); }
    function slam(t) { stampS(t); osc('sine', 70, t, t + .5, 1, [[t, 0], [t + .01, .35], [t + .45, 0]], .2); }
    function popS(t, g) { var o = osc('sine', 420, t, t + .12, 1, [[t, 0], [t + .004, .22 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(1300, t + .08); tickS(t, .12); }
    function flip(t, g) { g = g || 1; band(t, t + .12, 2000, 5000, .14 * g, .03, 2, (rnd() - .5) * .6); tickS(t + .1, .2 * g); }
    function ding1(t) { osc('sine', mtof(81), t, t + .6, 1, [[t, 0], [t + .005, .12], [t + .55, 0]], .4); osc('sine', mtof(88), t + .03, t + .6, 1, [[t + .03, 0], [t + .035, .06], [t + .5, 0]], .4); }
    function rise(t, t1) { t1 = Math.max(t1 || t + .5, t + .2); band(t, t1, 400, 2200, .05, .1, 3); }
    function crossS(t) { band(t, t + .18, 1500, 3000, .18, .04, 2.5); tickS(t + .15, .25); }
    var MAP = { tick: function (e) { tickS(e.t, (e.g || 1) * .35); }, thump: function (e) { thump(e.t, e.g); }, swish: function (e) { swish(e.t); }, whoosh: function (e) { whoosh(e.t); }, card: function (e) { card(e.t); }, stamp: function (e) { stampS(e.t); }, slam: function (e) { slam(e.t); }, pop: function (e) { popS(e.t, e.g); }, flip: function (e) { flip(e.t, e.g); }, ding1: function (e) { ding1(e.t); }, rise: function (e) { rise(e.t, e.t1); }, cross: function (e) { crossS(e.t); } };
    EV.forEach(function (e) { if (MAP[e.type]) MAP[e.type](e); });
    /* room tone, so the gaps are never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5; var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .012;
      /* the tone steps aside for each chapter line's first word: "Chapter" is the word the listen check kept losing under it */
      [1, 2, 3, 4, 5, 6].forEach(function (i) { var w = LINE['ch' + i].t0, we = LINE['ch' + i].t1; o.gain.setValueAtTime(.012, w - .75); o.gain.linearRampToValueAtTime(0, w - .45); o.gain.setValueAtTime(0, we + .1); o.gain.linearRampToValueAtTime(.012, we + .5); }); })();
  }

  /* YouTube thumbnail (1920x1080, saved at 1280x720): the two sunsets, the phrase */
  function thumb(g) {
    var t = 1.2; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    function half(u, x, side) {
      var tt = u.t0 + .9; g.save(); g.beginPath(); g.rect(x, 0, 952, H); g.clip();
      g.filter = side === 5 ? 'contrast(1.1) saturate(1.2) brightness(1.05)' : 'contrast(1.05) saturate(1.1)';
      CLIP.draw(g, tt, x, 0, 952, H, u); g.filter = 'none';
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(0,0,0,.05)'); gr.addColorStop(.55, 'rgba(0,0,0,.15)'); gr.addColorStop(1, 'rgba(0,0,0,.8)'); g.fillStyle = gr; g.fillRect(x, 0, 952, H);
      g.restore();
    }
    half(U.sky5, 0, 5); half(U.t1s, 968, 6);
    g.fillStyle = ACC; g.fillRect(952, 0, 16, H);
    chip(g, '2011', 60, 90, { px: 64, bg: COOLD, fg: CREAM, align: 'left' }); chip(g, '2023', 1860, 90, { px: 64, bg: ACC, fg: INK, align: 'right' });
    g.save(); g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 30;
    txt(g, 'GTA 5', 445, 760, 205, CREAM, { wt: 900, wide: true });
    txt(g, 'GTA 6', 1475, 760, 205, CREAM, { wt: 900, wide: true });
    g.restore();
    circ(g, 960, 760, 100); g.fillStyle = ACC; g.fill(); txt(g, 'vs', 960, 768, 110, INK, { wt: 900 });
    chip(g, 'EVERY TRAILER, SIDE BY SIDE', 960, 960, { px: 58, bg: CREAM, fg: INK });
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    var fonts = ['900 84px Archivo', '800 46px Archivo', '700 46px Archivo', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all([CLIP.load('clips.json')].concat(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%×÷→…“”·$+?●≈'); }))).then(function () { return document.fonts.ready; }).then(function () {
      initTimes();
      window.FILM.CHAPTERS = [['Same playbook?', 0]].concat(CH.map(function (c, i) { return [(i + 1) + '. ' + c.name.charAt(0) + c.name.slice(1).toLowerCase(), c.t]; }));
      window.FILM.HDIFF = HDIFF; window.FILM.SHOTS = window.FILM.CHAPTERS.map(function (c, i, a) { return { id: 'ch' + i, name: c[0], t0: c[1], t1: i + 1 < a.length ? a[i + 1][1] : DUR }; });
      window.READY = true;
    });
  }
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: 1.2, SLUG: 'gta-everytrailer', SHOTS: [], CHAPTERS: [], thumb: function () { thumb(ctx); }, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
