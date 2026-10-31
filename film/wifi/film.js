/* "Wi-Fi" — how Wi-Fi goes through walls. Factory #15 on Tech, explained (How tech works), after ../agent/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the wave ribbon: a strip of cream card stock folded accordion-style. It is the signal. Its height is
   how much signal is left after each material (an illustration, never a measured dB), its fold spacing is the frequency
   (5 GHz is folded twice as tight), foil crumples it and water tints it. One hero stamp only: SAME BAND.
   Cut-paper props, no logos, no real UI, no photos. Facts and sources: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f1e9d8', INK = '#211d26';
  var RIB_L = '#f6eedc', RIB_D = '#b9a780', RIB_C = '#8f7f5e', WET = '#5d86ad';
  var CARD = '#c8a273', CARD_D = '#a7814f', CARD_L = '#d9b88b';
  var DRY = '#dcd6ca', DRY_S = '#aaa292', DRY_T = '#ebe6dc', WOOD = '#c9a06a', WOOD_D = '#9c7444', BRICK = '#b5563d', BRICK_D = '#7f3a29', MORTAR = '#d9ccb6';
  var FOIL = '#c9cdd4', WATER = '#3f7fb3', ROUTER = '#e6dfd0', ROUTER_D = '#bdb4a2';
  var DISP = 'Archivo', MONO = '"Geist Mono"';

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function eout(k) { return 1 - Math.pow(1 - k, 3); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .85); }
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .85), 0, 1.04); }
  function fin(t, a, f) { return clamp(sp(t, a, f || 3) * 2, 0, 1); }
  function knock(t, a, f, d) { if (t < a) return 0; var u = t - a; return Math.exp(-u * (d || 7)) * Math.sin(u * (f || 22)); }
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  var CC = {};
  function rgb(c) { if (CC[c]) return CC[c]; var n = parseInt(c.slice(1), 16); return (CC[c] = [n >> 16 & 255, n >> 8 & 255, n & 255]); }
  function mixc(a, b, k) { if (k <= 0) return a; var A = rgb(a), B = rgb(b); return 'rgb(' + Math.round(lerp(A[0], B[0], k)) + ',' + Math.round(lerp(A[1], B[1], k)) + ',' + Math.round(lerp(A[2], B[2], k)) + ')'; }

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
  function start(id) { return LINE[id].t0; }
  function lend(id) { var ws = LINE[id].words; return ws[ws.length - 1].t1; }

  /* ---------- key times ---------- */
  var K = {
    ask: start('ask'), so: at('ask', 'so'), radio: start('radio'), two: at('radio', '2.4'), billion: at('radio', 'billion'),
    lab: start('lab'), band: start('band'), higher: at('band', 'higher'),
    metal: start('metal'), blocks: at('metal', 'is'), worst: wend('metal', 'worst'), water: start('water'), waterW: at('water', 'water'),
    twist: start('twist'), micro: at('twist', 'microwave'), freq: wend('twist', 'frequency'),
    slamT: wend('twist', 'frequency') + .3, tip: start('tip'), central: at('tip', 'central'), off: at('tip', 'off'), out: at('tip', 'out'), open: wend('tip', 'open'), twistW: at('twist', 'twist'),
    end: start('end'), cabinet: at('end', 'cabinet'), yes: at('end', 'yes'), no: at('end', 'no'), noEnd: wend('end', 'no')
  };

  /* scenes. swipe:true = the next scene comes in under the torn edge (live: drawn at the real time while it does) */
  var SWIPE = .44;
  var SC = [
    { id: 'hook', fn: 'src', name: 'Your walls', t0: 0 },
    { id: 'lab', fn: 'lab', name: 'The material rack', t0: K.lab - .42, swipe: true },
    { id: 'band', fn: 'band', name: 'Same wall, 5 GHz', t0: K.band - .15, swipe: true },
    { id: 'lanes', fn: 'lanes', name: 'Metal and water', t0: K.metal + .1, swipe: true },
    { id: 'twist', fn: 'twist', name: 'Same band', t0: K.twistW - .05, swipe: true, noHide: true },
    /* the stamped pair holds fully still ≥ 1.5 s after the stamp settles: the plan comes in no earlier than that */
    { id: 'plan', fn: 'plan', name: 'Where to put it', t0: Math.max(K.central - .1, K.slamT + .5 + 1.7 + SWIPE), swipe: true },
    { id: 'cab', fn: 'cab', name: 'Yes or no', t0: K.cabinet + .06, swipe: true }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, MC, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- measuring: the safe area (BOUNDS_RUN), what is readable (TEXTS → readcheck) and labels vs props (LABELS_RUN) ---------- */
  var BOUNDS = null, REC = null, PROPS = null, LBL = null, INCOMING = false, CURT = 0, NOREC = false, ONPROP = false, CHIPBOX = null, COVER = 1e9;
  var SAFE = { x0: 95, x1: 925, y1: 1450 };
  function xbox(g, x0, y0, x1, y1) {
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
  }
  function recBound(g, b, text) {
    if (!BOUNDS || INCOMING || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    if (b[0] < SAFE.x0 - .5 || b[2] > SAFE.x1 + .5 || b[3] > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(b[0]), x1: Math.round(b[2]), y1: Math.round(b[3]) });
  }
  function recBox(g, x0, y0, x1, y1, text) { if (BOUNDS) recBound(g, xbox(g, x0, y0, x1, y1), text); }
  function prop(g, name, x0, y0, x1, y1) {
    if (!PROPS || INCOMING || (g !== ctx && g !== tctx)) return;
    var b = xbox(g, x0, y0, x1, y1); if (b[1] > COVER) return; PROPS.push({ name: name, b: b });
  }
  function seen(g, text, b) {
    var vis = !INCOMING && !NOREC && g.globalAlpha >= .95 && b[3] <= COVER && (g === ctx || g === tctx);
    if (REC && vis) REC[text] = 1;
    if (LBL && vis && !ONPROP) LBL.push({ text: text, b: CHIPBOX || b });
  }
  function watch(g) {
    var orig = g.fillText;
    g.fillText = function (str, x, y) {
      if (BOUNDS || REC || LBL) {
        var mm = this.measureText(str), b = xbox(this, x - mm.actualBoundingBoxLeft, y - mm.actualBoundingBoxAscent, x + mm.actualBoundingBoxRight, y + mm.actualBoundingBoxDescent);
        recBound(this, b, str); seen(this, str, b);
      }
      return orig.apply(this, arguments);
    };
  }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function mw(text, px, wt, fam) { font(MC, px, wt, fam); ls(MC, 0); return MC.measureText(text).width; }
  function poly(g, P) { g.beginPath(); P.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  /* a cut-paper shape: a polygon whose straight edges wobble a little (seeded), like scissors */
  function cut(g, pts, r, amp) {
    g.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 22));
      for (var k = 0; k < n; k++) { var f = k / n; g.lineTo(lerp(a[0], b[0], f) + (r() - .5) * amp, lerp(a[1], b[1], f) + (r() - .5) * amp); }
    }
    g.closePath(); g.fill();
  }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    font(g, px, o.wt, o.fam); if (o.wd) wide(g); ls(g, o.ls || 0);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw + pad * 2 > o.maxw && px > 36) { px -= 2; font(g, px, o.wt, o.fam); if (o.wd) wide(g); tw = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, px, o.wt, o.fam); if (o.wd) wide(g);
    CHIPBOX = (o.bg || o.line) && LBL ? xbox(g, -w / 2, -h / 2, w / 2, h / 2) : null;
    g.fillText(text, 0, px * .04); CHIPBOX = null; g.restore(); ls(g, 0);
    return w;
  }
  /* one line of type, shrunk to fit maxw; never under 36 px */
  var HALO = false;
  function txt(g, text, x, y, px, col, align, wt, fam, maxw, a) {
    a = a == null ? 1 : a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 900, fam); ls(g, 0);
    while (maxw && g.measureText(text).width > maxw && px > 36) { px -= 2; font(g, px, wt || 900, fam); }
    g.fillStyle = col || CREAM; g.textAlign = align || 'center'; g.textBaseline = 'middle';
    if (HALO) { g.strokeStyle = BG; g.lineWidth = px * .22; g.lineJoin = 'round'; g.strokeText(text, x, y); }
    g.fillText(text, x, y); g.restore();
  }
  /* quiet tags (OUR ILLUSTRATION): cream outline, never coral */
  function tag(g, text, x, y, a, rot) { chip(g, text, x, y, { px: 36, wt: 700, fam: MONO, line: CREAM, lw: 3, fg: CREAM, a: a, rot: rot == null ? .02 : rot, shadow: false, bg: 'rgba(21,19,27,.9)', maxw: 820 }); }
  /* a dark label tag that sits beside a prop on paper (the floor plan) */
  function ltag(g, text, x, y, a, s) { chip(g, text, x, y, { px: 40, wt: 900, bg: BG, fg: CREAM, a: a, s: s, shadow: true, r: 10 }); }
  /* credits and sources never show in the incoming scene under the tear: they appear once it has covered the old one */
  function cred(a) { return INCOMING ? 0 : a; }

  /* ---------- the one rubber stamp: worn ink (seeded speckle), slammed ---------- */
  var STEX = {};
  function stampTex(text, col, px) {
    var key = text + col + px; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900); ls(m, 2);
    var lw = m.measureText(text).width, pad = px * .45, h = px * 1.25, w = lw + pad * 2, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(4, px * .085); rr(g, 2, 2, w - 4, h - 4, px * .14); g.stroke();
    g.lineWidth = Math.max(2, px * .03); rr(g, px * .14, px * .14, w - px * .28, h - px * .28, px * .08); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, px, 900); ls(g, 2); g.fillText(text, w / 2, h / 2 + px * .05);
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 140);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .35 + r() * .65; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.9, 0, 6.283); g.fill(); }
    c.w = w + 16; c.h = h + 16; STEX[key] = c; return c;
  }
  function stamp(g, text, x, y, t, t0, px, col, rot, sw) {
    if (t < t0) return;
    var c = stampTex(text, col, px);
    var k = eout(seg(t, t0, t0 + .18)), s = lerp(1.35, 1, k) * (sw ? sw / c.w : 1), al = clamp(k * 3, 0, 1);
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.08 : rot); g.scale(s, s);
    var oldP = ONPROP; ONPROP = true;
    if (k >= 1) { recBox(g, -c.w / 2, -c.h / 2, c.w / 2, c.h / 2, text); if (al >= 1) seen(g, text, xbox(g, -c.w / 2, -c.h / 2, c.w / 2, c.h / 2)); } g.drawImage(c, -c.w / 2, -c.h / 2); ONPROP = oldP; g.restore();
  }

  /* =====================================================================================================
     PROPS
     ===================================================================================================== */
  /* the wave ribbon: folds every lam/2 px, sliding right with ph. amp(x) = half-height left at x; tint(x) 0..1 = wet.
     x0..x1 = the strip's cut ends. The far edge of the card stock sits up-right by RD. */
  var RD = [30, -12];
  /* a cut end of card stock is torn, never a straight clip: a ragged vertical edge (seeded, fixed in time) */
  function tornSide(g, x, y0, y1, dir, seed) {
    var r = mulberry(seed), n = Math.ceil((y1 - y0) / 14);
    for (var i = 0; i <= n; i++) { var yy = dir > 0 ? y0 + (y1 - y0) * i / n : y1 - (y1 - y0) * i / n; g.lineTo(x + (r() - .5) * 14 + (i % 2 ? 4 : -4), yy); }
  }
  function ribbon(g, o) {
    /* the strip runs fully off frame or ends in a torn end inside it (c0/c1 are only for a mask a scene wants) */
    var x0 = Math.max(o.x0, o.c0 == null ? -400 : o.c0), x1 = Math.min(o.x1, o.c1 == null ? 1480 : o.c1);
    if (x1 - x0 < 2) return;
    var hl = o.lam / 2, ph = o.ph || 0, cy = o.cy, D = o.D || RD, amp = o.amp, tint = o.tint, sh = o.sh == null ? 1 : o.sh;
    var kA = Math.floor((x0 - ph) / hl) - 1, kB = Math.ceil((x1 + 40 - ph) / hl) + 1, P = [], k, i;
    for (k = kA; k <= kB; k++) { var x = ph + k * hl, s = (((k % 2) + 2) % 2) ? 1 : -1, a = typeof amp === 'function' ? amp(x) : amp; P.push([x, cy + s * a, s]); }
    var tornL = o.x0 > -60 && o.c0 == null, tornR = o.x1 < 1140 && o.c1 == null, sd = o.seed || 41;
    g.save(); g.beginPath();
    var cx0 = tornL ? x0 : x0 - 40, cx1 = tornR ? x1 : x1 + 40;
    g.moveTo(cx0, cy - 700); g.lineTo(cx1, cy - 700);
    if (tornR) tornSide(g, cx1, cy - 700, cy + 700, 1, sd); else g.lineTo(cx1, cy + 700);
    g.lineTo(cx0, cy + 700);
    if (tornL) tornSide(g, cx0, cy - 700, cy + 700, -1, sd + 7); else g.lineTo(cx0, cy - 700);
    g.closePath(); g.clip();
    function quad(a, b, ox, oy) { g.beginPath(); g.moveTo(a[0] + ox, a[1] + oy); g.lineTo(b[0] + ox, b[1] + oy); g.lineTo(b[0] + D[0] + ox, b[1] + D[1] + oy); g.lineTo(a[0] + D[0] + ox, a[1] + D[1] + oy); g.closePath(); g.fill(); }
    if (sh > 0) { g.fillStyle = 'rgba(0,0,0,' + (.34 * sh) + ')'; for (i = 0; i < P.length - 1; i++) quad(P[i], P[i + 1], 7, 16); }
    for (i = 0; i < P.length - 1; i++) {
      var A = P[i], B = P[i + 1], up = B[1] < A[1], tk = tint ? tint((A[0] + B[0]) / 2) : 0;
      /* folded card: the lit face pales toward its top fold, the shaded face darkens into its bottom crease */
      var gr = g.createLinearGradient(A[0], A[1], B[0], B[1]);
      if (up) { gr.addColorStop(0, mixc(RIB_D, WET, tk)); gr.addColorStop(.35, mixc(RIB_L, WET, tk)); gr.addColorStop(1, mixc(RIB_L, WET, tk)); }
      else { gr.addColorStop(0, mixc(RIB_D, WET, tk)); gr.addColorStop(1, mixc(RIB_C, WET, tk)); }
      g.fillStyle = gr; quad(A, B, 0, 0);
      if (PROPS) { var lo = Math.max(A[0], x0), hi = Math.min(B[0] + D[0], x1); if (hi > lo) prop(g, 'ribbon', lo, Math.min(A[1], B[1]) + D[1], hi, Math.max(A[1], B[1]) + 4); }
    }
    /* creases: dark at the valleys, a light ridge on the peaks */
    g.lineCap = 'round'; g.lineWidth = 2.5;
    g.beginPath(); for (i = 0; i < P.length; i++) if (P[i][2] > 0) { g.moveTo(P[i][0], P[i][1]); g.lineTo(P[i][0] + D[0], P[i][1] + D[1]); } g.strokeStyle = 'rgba(33,29,38,.45)'; g.stroke();
    g.beginPath(); for (i = 0; i < P.length; i++) if (P[i][2] < 0) { g.moveTo(P[i][0], P[i][1]); g.lineTo(P[i][0] + D[0], P[i][1] + D[1]); } g.strokeStyle = 'rgba(255,252,244,.7)'; g.stroke();
    g.lineWidth = 2; g.strokeStyle = 'rgba(33,29,38,.2)'; g.beginPath(); for (i = 0; i < P.length; i++) { if (i) g.lineTo(P[i][0], P[i][1]); else g.moveTo(P[i][0], P[i][1]); } g.stroke();
    g.restore();
  }
  /* a crumpled wad of the same card stock, pressed against a face at x (on the left of it) */
  function wad(g, x, cy, w, h, k, seed) {
    if (k <= 0) return;
    var r = mulberry(seed || 9), n = 9, P = [];
    for (var i = 0; i < n; i++) { var a = i / n * 6.283; P.push([x - w / 2 + Math.cos(a) * w / 2 * (.75 + r() * .3), cy + Math.sin(a) * h / 2 * (.7 + r() * .35)]); }
    g.save(); g.translate(x, cy); g.scale(lerp(.4, 1, k), lerp(.4, 1, k)); g.translate(-x, -cy);
    g.fillStyle = 'rgba(0,0,0,.3)'; poly(g, P.map(function (p) { return [p[0] + 6, p[1] + 12]; })); g.fill();
    g.fillStyle = RIB_D; poly(g, P); g.fill();
    g.fillStyle = RIB_L;
    for (i = 0; i < 6; i++) { var cx = x - w / 2 + (r() - .5) * w * .7, cyy = cy + (r() - .5) * h * .6, s = 14 + r() * 18; poly(g, [[cx - s, cyy - s * .4], [cx + s * .6, cyy - s], [cx + s, cyy + s * .5], [cx - s * .3, cyy + s * .8]]); g.fill(); }
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 2;
    for (i = 0; i < 7; i++) { var ax = x - w / 2 + (r() - .5) * w * .8, ay = cy + (r() - .5) * h * .7; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + (r() - .5) * 40, ay + (r() - .5) * 40); g.stroke(); }
    prop(g, 'wad', x - w, cy - h / 2, x, cy + h / 2);
    g.restore();
  }
  /* a wall sample standing on edge: front face x..x+w, y0..y1, its top and right side seen in depth SD */
  var SD = [18, -30];
  function slab(g, kind, x, y0, y1, w, o) {
    o = o || {}; var r = mulberry(strHash(kind) + (o.seed || 0)), dx = SD[0], dy = SD[1], i, yy;
    var face = { drywall: DRY, wood: WOOD, brick: BRICK, foil: FOIL }[kind], side = { drywall: DRY_S, wood: WOOD_D, brick: BRICK_D, foil: '#9da2ab' }[kind], top = { drywall: DRY_T, wood: '#dcb987', brick: '#c96d52', foil: '#e2e5ea' }[kind];
    g.save();
    if (kind === 'glass') {
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x + 8, y0 + 14, w, y1 - y0);
      g.fillStyle = 'rgba(196,228,236,.30)'; g.fillRect(x, y0, w, y1 - y0);
      g.fillStyle = 'rgba(196,228,236,.42)'; poly(g, [[x + w, y0], [x + w + dx, y0 + dy], [x + w + dx, y1 + dy], [x + w, y1]]); g.fill();
      g.fillStyle = 'rgba(220,240,245,.55)'; poly(g, [[x, y0], [x + w, y0], [x + w + dx, y0 + dy], [x + dx, y0 + dy]]); g.fill();
      g.strokeStyle = 'rgba(235,248,250,.85)'; g.lineWidth = 3; g.strokeRect(x, y0, w, y1 - y0);
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x + w * .25, y0 + 40); g.lineTo(x + w * .7, y0 + 110); g.moveTo(x + w * .2, y0 + 140); g.lineTo(x + w * .5, y0 + 186); g.stroke();
    } else {
      g.fillStyle = 'rgba(0,0,0,.36)'; g.fillRect(x + 9, y0 + 14, w + dx, y1 - y0);
      g.fillStyle = side; poly(g, [[x + w, y0], [x + w + dx, y0 + dy], [x + w + dx, y1 + dy], [x + w, y1]]); g.fill();
      g.fillStyle = top; poly(g, [[x, y0], [x + w, y0], [x + w + dx, y0 + dy], [x + dx, y0 + dy]]); g.fill();
      g.fillStyle = face; cut(g, [[x, y0], [x + w, y0], [x + w, y1], [x, y1]], r, 2);
      g.save(); g.beginPath(); g.rect(x, y0, w, y1 - y0); g.clip();
      if (kind === 'drywall') {
        g.fillStyle = 'rgba(33,29,38,.05)'; for (i = 0; i < 18; i++) g.fillRect(x, y0 + r() * (y1 - y0), w, 2);
        if (o.studs) {
          /* pencil stud marks and screw dots, a seam of tape */
          g.strokeStyle = 'rgba(60,56,66,.55)'; g.lineWidth = 3; g.setLineDash([16, 12]);
          g.beginPath(); g.moveTo(x + w * .32, y0 + 20); g.lineTo(x + w * .32, y1 - 20); g.moveTo(x + w * .82, y0 + 20); g.lineTo(x + w * .82, y1 - 20); g.stroke(); g.setLineDash([]);
          g.fillStyle = 'rgba(60,56,66,.6)'; for (yy = y0 + 60; yy < y1 - 30; yy += 110) { el(g, x + w * .32, yy, 4, 4); el(g, x + w * .82, yy + 30, 4, 4); }
          g.strokeStyle = 'rgba(60,56,66,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + w * .32 - 14, y0 + 44); g.lineTo(x + w * .32 + 14, y0 + 44); g.stroke();
        }
        if (o.outlet) {
          var ox = x + w * .57, oy = y1 - 150;
          g.fillStyle = '#efeae0'; rr(g, ox - 34, oy - 52, 68, 104, 8); g.fill();
          g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 2; rr(g, ox - 34, oy - 52, 68, 104, 8); g.stroke();
          g.fillStyle = '#3b3644'; [-24, 22].forEach(function (d) { rr(g, ox - 10, oy + d - 9, 6, 18, 2); g.fill(); rr(g, ox + 5, oy + d - 9, 6, 18, 2); g.fill(); el(g, ox, oy + d + 14, 3.5, 3.5); });
        }
      } else if (kind === 'wood') {
        g.strokeStyle = 'rgba(90,60,30,.35)'; g.lineWidth = 2.5;
        for (i = 0; i < 9; i++) { var gx = x + 6 + i * (w - 12) / 8; g.beginPath(); for (yy = y0; yy <= y1; yy += 12) g.lineTo(gx + Math.sin(yy * .02 + i * 1.3) * 5 + Math.sin(yy * .055 + i) * 2, yy); g.stroke(); }
        g.fillStyle = 'rgba(90,60,30,.4)'; el(g, x + w * .55, y0 + (y1 - y0) * .4, 7, 14);
      } else if (kind === 'brick') {
        g.fillStyle = MORTAR; var row = 0;
        for (yy = y0 + 34; yy < y1; yy += 38, row++) { g.fillRect(x, yy, w, 5); for (var bx = x + (row % 2 ? w * .5 : 0); bx < x + w; bx += w * .9) g.fillRect(bx, yy - 33, 5, 33); }
      } else if (kind === 'foil') {
        for (i = 0; i < 26; i++) { var fx = x + r() * w, fy = y0 + r() * (y1 - y0), s = 10 + r() * 22; g.fillStyle = r() < .5 ? 'rgba(255,255,255,.45)' : 'rgba(90,96,108,.28)'; poly(g, [[fx - s * .6, fy - s], [fx + s * .7, fy - s * .3], [fx + s * .2, fy + s], [fx - s * .8, fy + s * .4]]); g.fill(); }
      }
      g.restore();
    }
    prop(g, kind, x, y0 + dy, x + w + dx, y1 + 14);
    g.restore();
  }
  /* a generic paper router: a box, two stick antennas, four little lights. No brand. */
  function router(g, x, y, s, t, still) {
    g.save(); g.translate(x, y); g.scale(s, s);
    var r = mulberry(31);
    [[-78, -.16], [78, .16]].forEach(function (a) {
      g.save(); g.translate(a[0], -50); g.rotate(a[1]);
      g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, -9 + 6, -178 + 10, 18, 180, 9); g.fill();
      g.fillStyle = '#3b3644'; rr(g, -9, -178, 18, 180, 9); g.fill();
      g.fillStyle = '#56506a'; rr(g, -5, -170, 5, 160, 3); g.fill();
      g.restore();
    });
    g.fillStyle = 'rgba(0,0,0,.36)'; rr(g, -130 + 9, -55 + 14, 260, 110, 18); g.fill();
    g.fillStyle = ROUTER; cut(g, [[-130, -55], [130, -55], [130, 55], [-130, 55]], r, 2);
    g.fillStyle = ROUTER_D; g.fillRect(-130, 30, 260, 25);
    g.fillStyle = 'rgba(33,29,38,.25)'; for (var i = 0; i < 6; i++) rr(g, 40 + i * 13, -30, 6, 40, 3), g.fill();
    for (i = 0; i < 4; i++) { var on = still ? 1 : (Math.sin(t * (5 + i * 1.7) + i * 2) > -.3 ? 1 : .35); g.fillStyle = 'rgba(127,209,155,' + on + ')'; el(g, -96 + i * 26, -8, 7, 7); }
    g.fillStyle = '#3b3644'; rr(g, -110, 55, 40, 10, 4); g.fill(); rr(g, 70, 55, 40, 10, 4); g.fill();
    prop(g, 'router', -135, -235, 135, 66);
    g.restore();
  }
  /* a cut-paper microwave oven (generic, no brand): the light on, a paper cup of water turning on the plate */
  function oven(g, x, y, s, t, still) {
    g.save(); g.translate(x, y); g.scale(s, s);
    var r = mulberry(53);
    g.fillStyle = 'rgba(0,0,0,.36)'; rr(g, -160 + 9, -100 + 14, 320, 200, 16); g.fill();
    g.fillStyle = '#e7e0d1'; cut(g, [[-160, -100], [160, -100], [160, 100], [-160, 100]], r, 2);
    g.fillStyle = '#d2c9b6'; g.fillRect(68, -100, 92, 200);
    g.fillStyle = '#2b2733'; rr(g, -140, -78, 192, 150, 10); g.fill();
    g.fillStyle = 'rgba(244,213,138,.5)'; rr(g, -132, -70, 176, 134, 8); g.fill();
    /* the plate and the cup: the cup swings across the window as the plate turns */
    var a = still ? .6 : t * 1.9, cx = -44 + Math.sin(a) * 42, sc = .82 + .18 * Math.cos(a);
    g.fillStyle = 'rgba(33,29,38,.25)'; el(g, -44, 50, 70, 10);
    g.save(); g.translate(cx, 40); g.scale(sc, 1);
    g.fillStyle = '#f6f1e6'; poly(g, [[-26, -50], [26, -50], [20, 4], [-20, 4]]); g.fill();
    g.fillStyle = WATER; poly(g, [[-23, -32], [23, -32], [20, 4], [-20, 4]]); g.fill();
    g.fillStyle = 'rgba(255,255,255,.5)'; el(g, 0, -32, 23, 4);
    g.restore();
    g.fillStyle = '#9a917e'; el(g, 114, -58, 16, 16); el(g, 114, -12, 16, 16);
    g.fillStyle = '#bdb4a2'; for (var i = 0; i < 3; i++) rr(g, 92, 24 + i * 22, 44, 14, 4), g.fill();
    g.fillStyle = '#9a917e'; rr(g, 50, -64, 10, 116, 4); g.fill();
    prop(g, 'oven', -160, -100, 169, 114);
    g.restore();
  }
  /* a glass fish tank: blue paper water, gravel, one paper fish */
  function tank(g, x, y, w, h, t, still) {
    var r = mulberry(71), tt = still ? 0 : t;
    g.save();
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 9, y + 14, w, h);
    var wy = y + h * .16;
    g.fillStyle = 'rgba(63,127,179,.78)';
    g.beginPath(); g.moveTo(x, y + h);
    for (var xx = x; xx <= x + w; xx += 10) g.lineTo(xx, wy + Math.sin(xx * .05 + tt * 3) * 4);
    g.lineTo(x + w, y + h); g.closePath(); g.fill();
    g.fillStyle = '#c9b48a'; for (var i = 0; i < 40; i++) el(g, x + 6 + r() * (w - 12), y + h - 8 - r() * 16, 5 + r() * 3, 4);
    g.fillStyle = '#5e8f5a'; g.beginPath(); g.moveTo(x + w * .2, y + h - 10);
    for (var k = 0; k < 8; k++) g.lineTo(x + w * .2 + Math.sin(k * .9 + tt * 1.4) * 10 + (k % 2 ? 10 : -6), y + h - 10 - k * (h * .08));
    g.lineTo(x + w * .2 + 12, y + h - 10); g.closePath(); g.fill();
    var fx = x + w * .55 + Math.sin(tt * .9) * w * .18, fy = y + h * .5 + Math.sin(tt * 1.7) * 8, dir = Math.cos(tt * .9) >= 0 ? 1 : -1;
    g.fillStyle = '#f08a3c'; el(g, fx, fy, 30, 16); poly(g, [[fx - dir * 26, fy], [fx - dir * 50, fy - 16], [fx - dir * 50, fy + 16]]); g.fill();
    g.fillStyle = INK; el(g, fx + dir * 16, fy - 4, 3.5, 3.5);
    g.strokeStyle = 'rgba(225,242,246,.9)'; g.lineWidth = 5; g.strokeRect(x, y, w, h);
    g.fillStyle = 'rgba(225,242,246,.5)'; g.fillRect(x - 6, y - 8, w + 12, 10);
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + w * .78, y + 24); g.lineTo(x + w * .92, y + 70); g.stroke();
    prop(g, 'tank', x - 6, y - 8, x + w + 9, y + h + 14);
    g.restore();
  }
  /* a closed paper cabinet: two doors, two knobs, a top, little legs */
  function cabinet(g, x, y, w, h) {
    var r = mulberry(91);
    g.save();
    g.fillStyle = 'rgba(0,0,0,.36)'; g.fillRect(x - w / 2 + 10, y - h / 2 + 14, w, h);
    g.fillStyle = CARD_D; g.fillRect(x - w / 2 + 30, y + h / 2, 22, 36); g.fillRect(x + w / 2 - 52, y + h / 2, 22, 36);
    g.fillStyle = CARD; cut(g, [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], r, 2.5);
    g.fillStyle = CARD_L; g.fillRect(x - w / 2 - 14, y - h / 2 - 26, w + 28, 30);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - w / 2 - 14, y - h / 2 + 2, w + 28, 4);
    g.strokeStyle = CARD_D; g.lineWidth = 5; g.strokeRect(x - w / 2 + 22, y - h / 2 + 26, w / 2 - 30, h - 52); g.strokeRect(x + 8, y - h / 2 + 26, w / 2 - 30, h - 52);
    g.fillStyle = '#3a2c1e'; g.fillRect(x - 3, y - h / 2 + 18, 6, h - 36);
    g.fillStyle = '#7b5c3a'; el(g, x - 26, y, 11, 11); el(g, x + 26, y, 11, 11);
    prop(g, 'cabinet', x - w / 2 - 14, y - h / 2 - 26, x + w / 2 + 14, y + h / 2 + 36);
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · hook + ask + radio. Frame 0: YOUR WALLS ARE / SEE-THROUGH (4 words), a big drywall slab with the ribbon
     passing through it, gliding right from the first frame. On "So" the camera pans back along the ribbon to the router.
     ===================================================================================================== */
  var WALL = { x: 372, y0: 700, y1: 1420, w: 276 }, RY = 1060, RLAM = 180, RA = 160, RA2 = 112;
  var PAN = { t0: K.so - .06, t1: K.so + .74, dx: 780 }, RT = { x: -530 };
  /* the glide: ≥ 300 px in the first second, then a steady drift */
  function glide(t) { return 150 * t + 236 * (1 - Math.exp(-1.4 * t)); }
  function srcScene(g, t, idle) {
    var X = idle ? 0 : PAN.dx * eio(seg(t, PAN.t0, PAN.t1)), ph = glide(t) + X;
    var wx = WALL.x + X, rx = RT.x + X;
    ribbon(g, { x0: rx + 118, x1: 1200, cy: RY, lam: RLAM, ph: ph, amp: function (x) { return x < wx + WALL.w * .5 ? RA : RA2; } });
    if (wx < 1100) slab(g, 'drywall', wx, WALL.y0, WALL.y1, WALL.w, { studs: true, outlet: true });
    if (rx > -300) router(g, rx, RY, 1, t, idle);
    if (idle) return;
    /* radio: the tally card, printed whole; the 2.4 GHZ tag beside the ribbon; the FCC credit */
    var cA = fin(t, K.radio - .05, 3.2), cy = lerp(640, 720, eout(clamp(sp(t, K.radio - .05, 2.6), 0, 1)));
    if (cA > 0) {
      g.save(); g.globalAlpha *= cA; g.translate(650, cy); g.rotate(-.025);
      var r = mulberry(5);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-250 + 9, -110 + 13, 500, 220);
      g.fillStyle = PAPER; cut(g, [[-250, -110], [250, -110], [250, 110], [-250, 110]], r, 2);
      g.fillStyle = 'rgba(33,29,38,.1)'; for (var i = 0; i < 4; i++) g.fillRect(-220, -60 + i * 44, 440, 2);
      ONPROP = true;
      g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
      var bp = 92; font(g, bp, 900); while (g.measureText('2.4 BILLION').width > 440) { bp -= 2; font(g, bp, 900); } g.fillText('2.4 BILLION', 0, -26);
      font(g, 46, 800); g.fillText('WAVES A SECOND', 0, 56);
      ONPROP = false;
      prop(g, 'card', -250, -110, 259, 123);
      g.restore();
    }
    txt(g, '2.4 GHZ', 640, 1268, 52, CREAM, 'center', 900, DISP, 400, fin(t, K.two - .1));
    var ca = fin(t, K.radio - .6);
    txt(g, '2.4 GHZ ≈ 2.4 BILLION A SECOND', CX, 1350, 38, CREAM, 'center', 700, MONO, 820, ca);
    txt(g, 'FCC OET BULLETIN 56', CX, 1400, 36, CREAM, 'center', 700, MONO, 820, ca);
  }
  /* frame 0 type: YOUR WALLS ARE / SEE-THROUGH. On "To Wi-Fi" it steps up and shrinks, and the question the film answers
     prints under it, whole by 2.0 s: HOW DOES WI-FI / GO THROUGH WALLS? (the ask line has no caption; this is it).
     Both leave just before the radio card. */
  function hookText(g, t, idle) {
    var a = idle ? 1 : 1 - seg(t, K.radio - .3, K.radio - .12);
    if (a <= 0) return;
    var m = idle ? 0 : eio(seg(t, K.ask - .05, K.ask + .2));
    var L = ['YOUR WALLS ARE', 'SEE-THROUGH'], px = 116;
    g.save(); g.globalAlpha *= a; font(g, px, 900);
    while (Math.max(g.measureText(L[0]).width, g.measureText(L[1]).width) > 820 && px > 60) { px -= 2; font(g, px, 900); }
    var p2 = lerp(px, 84, m), y1 = lerp(400, 336, m);
    font(g, p2, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
    g.fillText(L[0], CX, y1); g.fillText(L[1], CX, y1 + p2 * 1.04);
    g.restore();
    if (idle) return;
    var qa = a * fin(t, K.ask + .02, 3.6), qy = (1 - clamp(sp(t, K.ask + .02, 3.6), 0, 1)) * 24;
    var Q = ['HOW DOES WI-FI', 'GO THROUGH WALLS?'], qp = 64;
    g.save(); g.globalAlpha *= clamp(qa, 0, 1); font(g, qp, 900);
    while (Math.max(g.measureText(Q[0]).width, g.measureText(Q[1]).width) > 800 && qp > 40) { qp -= 2; font(g, qp, 900); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
    g.fillText(Q[0], CX, 528 + qy); g.fillText(Q[1], CX, 528 + qp * 1.1 + qy);
    g.restore();
  }

  /* =====================================================================================================
     SCENE 2 · lab: the material rack. Drywall, wood, glass, brick on a wooden base; the ribbon threads all four and comes
     out a little narrower after each. NIST's words under it.
     ===================================================================================================== */
  var RACK = { y0: 760, y1: 1066, w: 70, xs: [210, 390, 570, 750], kinds: ['drywall', 'wood', 'glass', 'brick'], names: ['DRYWALL', 'WOOD', 'GLASS', 'BRICK'], amps: [138, 124, 110, 104, 74] };
  function labScene(g, t) {
    var t0 = S('lab').t0, cy = 913;
    var head = lerp(-60, 1200, eio(seg(t, t0 - .25, t0 + 1.5)));
    function amp(x) { for (var i = 0; i < 4; i++) if (x < RACK.xs[i] + RACK.w * .5) return RACK.amps[i]; return RACK.amps[4]; }
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(140 + 8, 1066 + 12, 760, 36);
    ribbon(g, { x0: -100, x1: head, cy: cy, lam: 150, ph: t * 70, amp: amp, seed: 3 });
    g.fillStyle = WOOD_D; poly(g, [[140, 1066], [900, 1066], [918, 1042], [158, 1042]]); g.fill();
    g.fillStyle = WOOD; g.fillRect(140, 1066, 760, 34);
    prop(g, 'rack', 140, 1042, 908, 1112);
    for (var i = 0; i < 4; i++) slab(g, RACK.kinds[i], RACK.xs[i], RACK.y0, RACK.y1, RACK.w, { seed: i });
    for (i = 0; i < 4; i++) txt(g, RACK.names[i], RACK.xs[i] + RACK.w / 2 + 6, 1150, 36, CREAM, 'center', 800, DISP, 176, fin(t, t0 + .1 + i * .08));
    tag(g, 'OUR ILLUSTRATION · NOT TO SCALE', CX, 636, cred(fin(t, t0 - .05)), -.012);
    var qa = cred(fin(t, t0 - .05));
    txt(g, 'NIST 1997 · TESTED 0.5–2, 3–8 GHZ', CX, 694, 36, CREAM, 'center', 700, MONO, 820, qa);
    txt(g, '“…the relative', CX, 1226, 46, CREAM, 'center', 700, DISP, 820, qa);
    txt(g, '‘transparency’ of', CX, 1278, 46, CREAM, 'center', 700, DISP, 820, qa);
    txt(g, 'the majority of', CX, 1330, 46, CREAM, 'center', 700, DISP, 820, qa);
    txt(g, 'these materials…”', CX, 1382, 46, CREAM, 'center', 700, DISP, 820, qa);
  }

  /* =====================================================================================================
     SCENE 3 · band: the same drywall slab, two ribbons. 5 GHz is folded twice as tight and comes out clearly narrower.
     ===================================================================================================== */
  var BD = { x: 560, y0: 720, y1: 1290, w: 80, y5: 865, y2: 1140, a: 104, a5: 40, a2: 88, x0: 300 };
  function bandScene(g, t) {
    var t0 = S('band').t0;
    var h2 = lerp(BD.x0, 1200, eio(seg(t, t0 - .3, t0 + 1.2))), h5 = lerp(BD.x0, 1200, eio(seg(t, K.higher - .15, K.higher + 1.1)));
    var mid = BD.x + BD.w * .5;
    ribbon(g, { x0: BD.x0, x1: h5, cy: BD.y5, lam: 75, ph: t * 60, seed: 5, amp: function (x) { return x < mid ? BD.a : BD.a5; } });
    ribbon(g, { x0: BD.x0, x1: h2, cy: BD.y2, lam: 150, ph: t * 60 + 30, seed: 6, amp: function (x) { return x < mid ? BD.a : BD.a2; } });
    slab(g, 'drywall', BD.x, BD.y0, BD.y1, BD.w, { seed: 4 });
    HALO = true;
    txt(g, '2.4 GHZ', 100, BD.y2, 50, CREAM, 'left', 900, DISP, 190, fin(t, t0 + .05));
    txt(g, '5 GHZ', 100, BD.y5, 50, CREAM, 'left', 900, DISP, 190, fin(t, K.higher + .05));
    HALO = false;
    chip(g, 'SAME WALL', 600, 640, { px: 46, wt: 900, bg: CREAM, fg: BG, a: fin(t, K.higher + .35), s: pop(t, K.higher + .35), rot: .02 });
    var ca = cred(fin(t, t0 + .05));
    txt(g, 'NIST: MORE GHZ, MORE LOSS', CX, 1352, 38, CREAM, 'center', 700, MONO, 820, ca);
    txt(g, 'ASUS: 5 GHZ GOES LESS FAR', CX, 1404, 38, CREAM, 'center', 700, MONO, 820, ca);
  }

  /* =====================================================================================================
     SCENE 4 · lanes: metal (top lane) and water (bottom lane). The foil drops in on "Metal"; the ribbon crumples
     against it on the crinkle; the fish tank slides into the bottom lane in the silence after "worst."
     ===================================================================================================== */
  var LA = { y: 790, foil: 520, fw: 34, fy0: 630, fy1: 950 }, LB = { y: 1125, tx: 330, tw: 270, ty: 990, th: 270 };
  function lanesScene(g, t) {
    var t0 = S('lanes').t0, land = K.blocks + .05, crk = GT.crinkle;
    /* top lane: the ribbon runs full until the foil lands, then the far part pulls away and the near part bunches up */
    var drop = eio(seg(t, land - .4, land)), fy = lerp(-520, 0, drop) + Math.max(0, knock(t, land, 20, 10)) * -6;
    var bunch = eout(seg(t, land + .05, crk + .02)), snap = Math.max(0, knock(t, crk, 26, 9));
    var stopX = LA.foil - 4 - 56 * bunch;
    /* once the foil has landed nothing gets past it: the strip ends in the wad, the frame right of the foil is empty */
    ribbon(g, { x0: -100, x1: drop >= 1 ? stopX : 1200, cy: LA.y, lam: 150, ph: t * 60, amp: 100, c1: LA.fy1 + fy > LA.y - 110 ? LA.foil + 2 : null });
    if (drop >= 1) wad(g, LA.foil - 2, LA.y, lerp(30, 76, bunch) * (1 + snap * .08), lerp(150, 190, bunch) * (1 - snap * .06), Math.max(.4, bunch), 13);
    if (drop > 0) slab(g, 'foil', LA.foil, LA.fy0 + fy, LA.fy1 + fy, LA.fw, { seed: 2 });
    var ma = fin(t, land + .5);
    txt(g, 'METAL:', 610, 742, 54, CREAM, 'left', 900, DISP, 300, ma);
    txt(g, 'VERY HIGH', 610, 802, 46, CREAM, 'left', 900, DISP, 300, ma);
    txt(g, 'APPLE SUPPORT', 610, 854, 36, CREAM, 'left', 700, MONO, 310, ma);
    /* bottom lane: the tank slides in from the right; past it the ribbon is thinner and wet */
    var tk = eio(seg(t, K.worst + .08, K.water - .05)), tx = lerp(1000, LB.tx, tk), tmid = tx + LB.tw * .5;
    ribbon(g, { x0: -100, x1: lerp(LB.tx - 40, 1200, eio(seg(t, t0 - .3, t0 + 1))), cy: LB.y, lam: 150, ph: t * 60 + 40, seed: 8, amp: function (x) { return x < tmid ? 100 : 75; }, tint: function (x) { return x < tmid ? 0 : .55; } });
    if (tk > 0) tank(g, tx, LB.ty, LB.tw, LB.th, t);
    var wa = fin(t, K.water - .05);
    txt(g, 'WATER: MEDIUM', LB.tx + LB.tw / 2, 1318, 46, CREAM, 'center', 900, DISP, 560, wa);
    txt(g, 'APPLE SUPPORT', LB.tx + LB.tw / 2, 1370, 36, CREAM, 'center', 700, MONO, 560, wa);
  }

  /* =====================================================================================================
     SCENE 5 · twist (hero): two cards, the router's and a microwave oven's, and the proof under them: a cut-paper frequency
     ruler 2.40–2.50 GHz, the oven band (47 CFR 18.301: 2450 ± 50 MHz) as a coral bracket and the unlicensed band Wi-Fi
     uses (47 CFR 15.247: 2400–2483.5 MHz) as a cream bracket inside it. The one coral stamp SAME BAND lands on the
     overlap in the silence after "frequency." and the whole frame then holds still.
     ===================================================================================================== */
  var CS = .72, CL = { x: 318, y: 770, r: -.035 }, CR = { x: 702, y: 782, r: .03 }, CW = 380, CH = 560;
  var RU = { x0: 140, x1: 880, f0: 2.40, f1: 2.50, y: 1300, h: 40 };
  function fx(f) { return RU.x0 + (f - RU.f0) / (RU.f1 - RU.f0) * (RU.x1 - RU.x0); }
  function card(g, x, y, rot, s, draw, l1, l2) {
    var r = mulberry(strHash(l1));
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(-CW / 2 + 10, -CH / 2 + 14, CW, CH);
    g.fillStyle = PAPER; cut(g, [[-CW / 2, -CH / 2], [CW / 2, -CH / 2], [CW / 2, CH / 2], [-CW / 2, CH / 2]], r, 2);
    g.fillStyle = 'rgba(33,29,38,.08)'; g.fillRect(-CW / 2 + 24, 46, CW - 48, 3);
    draw(g);
    ONPROP = true; g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, 66, 900); g.fillText(l1, 0, 112); font(g, 62, 900); g.fillText(l2, 0, 190);
    ONPROP = false;
    prop(g, 'card', -CW / 2, -CH / 2, CW / 2 + 10, CH / 2 + 14);
    g.restore();
  }
  /* the ruler: a strip of cut card with a tick every 10 MHz, numbered at 2.40, 2.45, 2.50 */
  function ruler(g, a) {
    if (a <= 0) return;
    var r = mulberry(61), y = RU.y;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(RU.x0 - 16 + 7, y + 11, RU.x1 - RU.x0 + 32, RU.h);
    g.fillStyle = PAPER; cut(g, [[RU.x0 - 16, y], [RU.x1 + 16, y], [RU.x1 + 16, y + RU.h], [RU.x0 - 16, y + RU.h]], r, 1.5);
    g.strokeStyle = INK; g.lineCap = 'butt';
    for (var i = 0; i <= 10; i++) { var x = fx(RU.f0 + i * .01), big = i % 5 === 0; g.lineWidth = big ? 4 : 2.5; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + (big ? 26 : 14)); g.stroke(); }
    prop(g, 'ruler', RU.x0 - 16, y, RU.x1 + 23, y + RU.h + 11);
    g.restore();
    [['2.40', RU.f0], ['2.45', 2.45], ['2.50', RU.f1]].forEach(function (q) { txt(g, q[0], fx(q[1]), y + RU.h + 34, 32, CREAM, 'center', 700, MONO, 0, cred(a)); });
  }
  /* a band bracket standing on the ruler: an outline box from f0 to f1, its label inside the top */
  function bracket(g, f0, f1, top, col, lw, a, inset) {
    if (a <= 0) return;
    var x0 = fx(f0) - inset, x1 = fx(f1) + (f1 >= RU.f1 ? inset : 0), y1 = RU.y - 6;
    g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x0, y1 + 4); g.lineTo(x0, top + 12); g.quadraticCurveTo(x0, top, x0 + 12, top); g.lineTo(x1 - 12, top); g.quadraticCurveTo(x1, top, x1, top + 12); g.lineTo(x1, y1 + 4); g.stroke();
    g.restore();
    return (x0 + x1) / 2;
  }
  function twistScene(g, t) {
    var t0 = S('twist').t0, slam = GT.slam, still = t >= slam;
    /* the Wi-Fi card is on the table from the first frame under the tear; the oven card joins on "microwave" */
    var inR = eio(seg(t, K.micro - .35, K.micro + .25));
    var jolt = 1 + Math.max(0, knock(t, slam + .02, 16, 14)) * .012;
    g.save(); g.translate(CX, CL.y); g.scale(jolt, jolt); g.translate(-CX, -CL.y);
    if (inR > 0) { g.save(); g.globalAlpha *= clamp(inR * 1.6, 0, 1); card(g, CR.x + lerp(24, 0, inR), CR.y - lerp(40, 0, inR), CR.r + lerp(.04, 0, inR), CS * lerp(.94, 1, inR), function (q) { oven(q, 0, -110, .98, t, still); }, 'OVEN', '2.45 GHZ'); g.restore(); }
    card(g, CL.x, CL.y, CL.r, CS, function (q) { router(q, 0, -60, .82, t, still); }, 'WI-FI', '2.4 GHZ');
    g.restore();
    /* the proof, under the cards */
    var ra = cred(fin(t, K.micro - .2)), oa = cred(fin(t, K.micro + .15)), wa = cred(fin(t, at('twist', 'heats') - .05));
    ruler(g, ra);
    var ocx = bracket(g, RU.f0, RU.f1, 1008, HOT, 6, oa, 22);
    if (oa > 0) txt(g, 'OVEN BAND 2.40–2.50 GHZ · 47 CFR 18.301', ocx, 1044, 31, HOT, 'center', 700, MONO, 0, oa);
    var wcx = bracket(g, 2.400, 2.4835, 1082, CREAM, 5, wa, 6);
    if (wa > 0) {
      txt(g, 'UNLICENSED 2.400–2.4835 GHZ', wcx, 1118, 31, CREAM, 'center', 700, MONO, 0, wa);
      txt(g, '(USED BY WI-FI) · 47 CFR 15.247', wcx, 1158, 31, CREAM, 'center', 700, MONO, 0, wa);
    }
    stamp(g, 'SAME BAND', wcx || CX, 1238, t, slam, 70, HOT, -.04, 440);
  }

  /* =====================================================================================================
     SCENE 6 · tip (screenshot frame): a top-down paper floor plan. The router sits centred in the hall on a shelf;
     CENTRAL against it, OFF THE FLOOR under the shelf. Three ribbons: up through a solid interior wall (a little narrower
     after it) into the foil fridge, where it stops; up-left through a doorway and the fish tank (thinner and wet after it);
     right through a doorway, IN THE OPEN beside it. The stamped oven sits in the room below. Labels pop on their words,
     then the whole frame holds still until the torn edge.
     ===================================================================================================== */
  var PL = { x: 130, y: 600, w: 760, h: 690 }, RO = { x: 510, y: 905 };
  var WY = 760, WY2 = 1062;                                   /* the hall: between the two long interior walls */
  var FR = { x: 510, y: 664, w: 74, h: 64 }, TK = { x: 215, y: 690, w: 110, h: 64 }, OV = { x: 742, y: 1176, s: .8 };
  function ribPts(to) { var dx = to[0] - RO.x, dy = to[1] - RO.y; return { L: Math.hypot(dx, dy), ang: Math.atan2(dy, dx), ux: dx / Math.hypot(dx, dy), uy: dy / Math.hypot(dx, dy) }; }
  var RIBS = [
    /* up: through the solid wall at y 760 (full height there), then stopped dead by the foil fridge */
    { to: [510, 612], wall: RO.y - WY, stop: RO.y - (FR.y + FR.h / 2) + 2, metal: true },
    /* up-left: through the doorway in the same wall, then through the fish tank */
    { to: [196, 676], tank: Math.hypot(TK.x - RO.x, TK.y - RO.y) },
    /* right: along the hall and through the doorway in the wall at x 720 */
    { to: [846, 905] }
  ];
  function planScene(g, t) {
    var t0 = S('plan').t0, r = mulberry(17), x = PL.x, y = PL.y, w = PL.w, h = PL.h, i;
    /* paper base and floor */
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(x + 10, y + 14, w, h);
    g.fillStyle = '#e9e0cc'; cut(g, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r, 2);
    g.strokeStyle = 'rgba(33,29,38,.035)'; g.lineWidth = 2;
    for (i = 1; i < 13; i++) { g.beginPath(); g.moveTo(x + i * 60, y); g.lineTo(x + i * 60, y + h); g.stroke(); }
    /* ribbons out of the router: grow once, then lie still. They run under the cardboard walls. */
    var grow = eio(seg(t, t0 - .1, t0 + .4));
    RIBS.forEach(function (rb, k) {
      var q = ribPts(rb.to), end = q.L * grow;
      g.save(); g.translate(RO.x, RO.y); g.rotate(q.ang);
      ribbon(g, { x0: 62, x1: rb.metal ? Math.min(end, rb.stop) : end, c0: -1e4, c1: 1e4, cy: 0, lam: 44, ph: 12 + k * 7, D: [10, -4], sh: .8,
        amp: function (d) { return rb.wall && d > rb.wall ? 19 : rb.tank && d > rb.tank ? 12 : 24; },
        tint: rb.tank ? function (d) { return d > rb.tank ? .6 : 0; } : null });
      g.restore();
    });
    /* cardboard walls: outer; one long wall above the hall (solid but for one doorway), one below it, the rooms */
    g.fillStyle = '#5b4630';
    var WL = [[x, y, w, 12], [x, y + h - 12, w, 12], [x, y, 12, h], [x + w - 12, y, 12, h],
      [x, WY, 125, 10], [x + 230, WY, w - 230, 10],          /* doorway x 255–360 for the up-left ribbon */
      [x, WY2, 160, 10], [x + 250, WY2, 240, 10], [x + 600, WY2, 160, 10],
      [420, y, 10, WY - y], [640, y, 10, WY - y],
      [720, WY, 10, 105], [720, 952, 10, WY2 - 952],         /* doorway y 865–952 for the right ribbon */
      [505, WY2, 10, y + h - WY2]];
    WL.forEach(function (q) { g.fillRect(q[0], q[1], q[2], q[3]); });
    /* the obstacles from earlier, same props: the foil fridge, the fish tank, the stamped oven */
    g.save(); g.translate(FR.x, FR.y);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-FR.w / 2 + 5, -FR.h / 2 + 8, FR.w, FR.h);
    var rf = mulberry(3); g.fillStyle = FOIL; g.fillRect(-FR.w / 2, -FR.h / 2, FR.w, FR.h);
    for (i = 0; i < 10; i++) { var fx2 = -FR.w / 2 + rf() * FR.w, fy = -FR.h / 2 + rf() * FR.h, s = 6 + rf() * 9; g.fillStyle = rf() < .5 ? 'rgba(255,255,255,.5)' : 'rgba(90,96,108,.3)'; poly(g, [[fx2 - s, fy - s * .5], [fx2 + s * .6, fy - s], [fx2 + s, fy + s * .6], [fx2 - s * .4, fy + s]]); g.fill(); }
    prop(g, 'fridge', -FR.w / 2, -FR.h / 2, FR.w / 2 + 5, FR.h / 2 + 8);
    g.restore();
    tank(g, TK.x - TK.w / 2, TK.y - TK.h / 2, TK.w, TK.h, t, true);
    oven(g, OV.x, OV.y, OV.s, t, true);
    stamp(g, 'SAME BAND', OV.x - 14, OV.y + 2, t, -1, 52, HOT, -.06, 230);
    /* the router on its shelf, centred */
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(RO.x - 70 + 5, RO.y + 32 + 8, 140, 16);
    g.fillStyle = WOOD; g.fillRect(RO.x - 70, RO.y + 32, 140, 16); g.fillStyle = WOOD_D; g.fillRect(RO.x - 70, RO.y + 44, 140, 4);
    g.fillRect(RO.x - 56, RO.y + 48, 8, 20); g.fillRect(RO.x + 48, RO.y + 48, 8, 20);
    prop(g, 'shelf', RO.x - 70, RO.y + 32, RO.x + 75, RO.y + 68);
    router(g, RO.x, RO.y + 5, .42, t, true);
    /* labels: each against its own prop, popping as the plan lands / on its word */
    var cw = mw('CENTRAL', 40, 900) + 26;
    ltag(g, 'CENTRAL', RO.x - 72 - cw / 2, RO.y + 18, fin(t, t0 + .08), pop(t, t0 + .08, 4));
    ltag(g, 'OFF THE FLOOR', RO.x, RO.y + 70 + 27, fin(t, Math.max(t0 + .05, K.off)), pop(t, Math.max(t0 + .05, K.off), 4));
    ltag(g, 'IN THE OPEN', 742, 834, fin(t, K.out - .42), pop(t, K.out - .42, 4));
    var aw = fin(t, t0 + .12);
    chip(g, 'AWAY FROM THE', 322, 1146, { px: 36, wt: 900, bg: BG, fg: CREAM, a: aw, r: 10 }); chip(g, 'MICROWAVE →', 322, 1200, { px: 36, wt: 900, bg: BG, fg: CREAM, a: aw, r: 10 });
    var ca = cred(fin(t, t0 - .05));
    txt(g, 'TIPS: TP-LINK, ASUS', CX, 1352, 38, CREAM, 'center', 700, MONO, 820, ca);
  }

  /* =====================================================================================================
     SCENE 7 · end + yn: one closed paper cabinet, a thin ribbon stub out of the gap by its door. YES / NO.
     ===================================================================================================== */
  function cabScene(g, t) {
    var cx = 470, cy = 930;
    ribbon(g, { x0: cx + 200, x1: 860, cy: cy + 40, lam: 70, ph: t * 40, amp: 20, D: [6, -12] });
    cabinet(g, cx, cy, 420, 460);
    var yk = function (w) { return 1 + .06 * Math.sin(Math.PI * seg(t, w - .06, w + .3)); };
    [['YES', 380, K.yes], ['NO', 640, K.no]].forEach(function (c) {
      var on = fin(t, c[2] - .08);
      chip(g, c[0], c[1], 1270, { px: 64, wt: 900, line: HOT, lw: 5, fg: HOT, w: 200, r: 40, shadow: false, a: on < 1 ? 1 : 0 });
      chip(g, c[0], c[1], 1270, { px: 64, wt: 900, bg: HOT, fg: BG, w: 200, r: 40, a: on, s: yk(c[2]) });
    });
  }

  /* ---------- captions: the narrator's words, one block at a time; only stressed words get the coral pill ---------- */
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;   /* frame 0 carries the hook's own 4 words */
      var cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        cur.push(w);
        if (/[.?!:]$/.test(w.w) && i < ws.length - 1) { out.push({ id: l.id, ws: cur }); cur = []; }
      });
      if (cur.length) out.push({ id: l.id, ws: cur });
    });
    /* the ask line is printed as the frame-0 question (HOW DOES WI-FI / GO THROUGH WALLS?): no caption over it.
       The tip line's caption waits for the floor plan: nothing new prints over the stamped pair (the hero hold). */
    out = out.filter(function (c) { return c.id !== 'ask'; });
    return out.map(function (c) { var ws = c.ws; return { id: c.id, t0: ws[0].t0, s: c.id === 'tip' && ws[0] === LINE.tip.words[0] ? S('plan').t0 + .04 : ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  /* a caption that runs into a hold keeps its place until the next one (no fade inside the screenshot hold) */
  var STRESS = [['ask', 'walls'], ['radio', 'billion'], ['lab', 'most'], ['band', 'loses'], ['metal', 'worst'], ['water', 'water'],
    ['twist', 'twist'], ['twist', 'microwave'], ['tip', 'central'], ['end', 'cabinet'], ['end', 'yes'], ['end', 'no']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe && !sc.noHide) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE, sc.t0 - SWIPE + .1) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, over: 1, that: 1, up: 1, own: 1, is: 1, it: 1, go: 1, does: 1 };
  var CAPMIN = 1e9;
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s - .04) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s - .04 : 1e9;
    var keep = nx && (ns - card0.t1 < .9 || card0.id === 'twist');
    var o1 = keep ? ns : Math.min(card0.t1 + .5, ns - .12), o0 = keep ? ns : Math.min(card0.t1 + .35, o1 - .12);
    var fi = seg(t, card0.s - .04, card0.s + .06), out = keep ? (t < ns ? 1 : 0) : 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - card0.s + .04, 3.2, .8), 0, 1.04);
    g.save(); g.font = '800 74px Archivo'; wide(g);
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 22;
    var lines, lw, maxw = 780, cpx = 74;
    function lay() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; }); }
    function fixLines() {
      for (var L = 0; L < lines.length - 1; L++) {
        var last = lines[L][lines[L].length - 1];
        while (lines[L].length > 1 && GLUE[norm(words[last].w)]) { lines[L].pop(); lines[L + 1].unshift(last); last = lines[L][lines[L].length - 1]; }
      }
      var n = lines.length; if (n > 1 && lines[n - 1].length === 1 && lines[n - 2].length > 2) lines[n - 1].unshift(lines[n - 2].pop());
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay(); fixLines();
    function widest() { return Math.max.apply(null, lw) - gap; }
    while ((lines.length > 2 || widest() > maxw) && cpx > 52) { cpx -= 4; g.font = '800 ' + cpx + 'px Archivo'; wide(g); ws = words.map(function (w) { return g.measureText(w.w).width; }); gap = cpx * .28; lay(); fixLines(); }
    var lh = cpx * 1.18, y0 = (lines.length > 1 ? 368 : 408) + 50 - (lines.length - 1) * lh / 2;   /* pill tops at y ≥ 304 */
    g.globalAlpha = fi * out * wipeHide(t) * (alpha == null ? 1 : alpha);
    NOREC = true;
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 30;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 12, y - cpx * .87, ws[i] + 24, cpx * 1.15, 18); g.fill(); CAPMIN = Math.min(CAPMIN, y - cpx * .87); }
        g.fillStyle = cur ? BG : CREAM;
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    NOREC = false;
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SCENES = { src: function (g, t) { srcScene(g, t, false); }, lab: labScene, band: bandScene, lanes: lanesScene, twist: twistScene, plan: planScene, cab: cabScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) { g.save(); SCENES[Sc.fn](g, t); g.restore(); }
  /* the cut: a torn-paper edge rising from the bottom along one axis, the next scene drawn under it */
  function edgeY(x, ly, t) { var i = Math.round(x / 30); return ly + (i % 2 ? -10 : 8) + Math.sin(x * .013 + t * 5) * 4; }
  function tornEdge(g, ly, t) { g.save(); g.strokeStyle = HOT; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); for (var x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t); if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); g.restore(); }
  function clipBelow(g, ly, t) { g.beginPath(); g.moveTo(0, H); for (var x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip(); }
  /* frame 0, as the loop lands on it: the first rendered frame's time */
  var T0 = 1 / 60;
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    var sk = Nx && Nx.swipe ? eio(seg(t, Nx.t0 - SWIPE, Nx.t0)) : 0, ly = H * (1 - sk) - 20;
    var back = eio(seg(t, GT.home, GT.home + .26)), by = H * (1 - back) - 20;
    COVER = Math.min(sk > 0 ? ly - 14 : 1e9, back > 0 ? by - 14 : 1e9);
    drawScene(g, Sc, t);
    if (si === 0 && !POSTERMODE && LIVE.text) hookText(g, t, false);
    COVER = 1e9;
    if (sk > 0) {
      g.save(); clipBelow(g, ly, t);
      stage(g); INCOMING = true; drawScene(g, Nx, t); INCOMING = false; g.restore();
      tornEdge(g, ly, t);
    }
    /* the loop: the torn edge rises right after "no" and lands on the frame-0 picture (no dissolve) */
    if (back > 0) {
      g.save(); clipBelow(g, by, t);
      stage(g); INCOMING = true; srcScene(g, T0, true); hookText(g, T0, true); INCOMING = false; g.restore();
      if (back < 1) tornEdge(g, by, t);
    }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) captions(g, t, back > 0 ? 1 - back : 1);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false;
  function posterTitle(g) {
    var a = 'How Wi-Fi goes', b = 'through your walls', px = 84;
    g.save(); font(g, px, 800); g.textBaseline = 'alphabetic';
    while ((g.measureText(b).width + 28 > 840 || g.measureText(a).width > 840) && px > 52) { px -= 2; font(g, px, 800); }
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText(a, CX, 400);
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 14, 496 - 76, wb + 28, 100, 16); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 496); g.restore();
  }
  /* every text that is fully readable at t (not fading, not under a torn edge, not a caption): drawn to find out */
  function TEXTS(t) {
    REC = {}; frame(tctx, t); var r = REC; REC = null;
    return Object.keys(r).map(function (k) { return { id: k, text: k, x0: 0, y0: 0, x1: 0, y1: 0 }; });
  }

  /* ---------- events: the sound design reads the same word times; hits sit between words, never on them ---------- */
  var EV = [];
  /* the SFX gate (vo/heard.js, written from the finished mix): a hit's whole body keeps 0.19 s clear of every word start
     and end that unhinted faster-whisper base.en and small.en heard in the mix (the gate is 0.15), and clear of every
     stretch where the voice-only track is at or above −40 dBFS. Without heard.js the vo.js word times stand in. */
  var EDGES = window.HEARD_EDGES || [], VOICED = window.VOICED || [];
  if (!EDGES.length) VO.lines.forEach(function (l) { l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 }); EDGES.push(w.t0, w.t1); }); VOICED.push({ t0: l.t0, t1: l.t1 }); });
  function blocked(m) {
    var B = [], Mg = [];
    EDGES.forEach(function (e) { B.push([e - m, e + m]); });
    VOICED.forEach(function (v) { B.push([v.t0 - .03, v.t1 + .03]); });
    B.sort(function (x, y) { return x[0] - y[0]; });
    B.forEach(function (b) { var L = Mg[Mg.length - 1]; if (L && b[0] <= L[1]) L[1] = Math.max(L[1], b[1]); else Mg.push(b.slice()); });
    return Mg;
  }
  function free(m) {
    var Mg = blocked(m), F = [], p = 0;
    Mg.forEach(function (b) { if (b[0] > p) F.push([p, b[0]]); p = Math.max(p, b[1]); });
    F.push([p, DUR + 9]); return F;
  }
  var BODY = { crinkle: .18, thump: .16 };
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m || .19).forEach(function (f) {
      var lo = f[0], hi = f[1] - body; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  /* Two hits, nothing else (BRIEF §0): the foil crinkle after "worst." and THE stamp after "frequency.". No swish before
     "Your": the first word starts 0.2 s in, too close for a hit with the gate's margin. */
  var GT = {}, GS = [];
  function G(id, t, type, tol, gain, m) {
    var n = nearGap(t, type, m);
    if (n !== null && Math.abs(n - t) <= (tol || .45)) { GT[id] = n; GS.push({ t: n, type: type, g: gain }); return true; }
    GT[id] = t; return false;
  }
  function initGaps() {
    var me = LINE.metal.t1, te = LINE.twist.t1;
    /* levels (on the final mix): crinkle RMS ≤ −20.5 dB, thump ≤ −23 dB, each ≥ 3 dB under the words round it */
    G('crinkle', (me + start('water')) / 2 - BODY.crinkle * .5, 'crinkle', .3, .26, .2);
    /* the stamp lands early in the silence after "frequency." so the pair can hold still before the plan comes in */
    G('slam', K.slamT, 'thump', .4, .052, .2);
    GT.home = K.noEnd + 1.2;   /* a beat on the question before the loop; also keeps the 30 s Whisper window edge in silence */
  }
  function initTimes() {
    GS.forEach(function (e) { EV.push({ t: e.t, type: e.type, g: e.g, t1: e.t + BODY[e.type] }); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { POSTERMODE = t === window.FILM.POSTER; frame(ctx, t); POSTERMODE = false; return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- sound: foley cut to the word times; no music (Isac adds a TikTok sound) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 32;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * .9), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 5); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .12; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    /* THE hit: a rubber stamp slammed on two paper cards on a desk. A 260 → 190 Hz body and a 330 Hz knock (where a phone
       speaker plays), a short paper slap on top */
    function stampThump(t, g) {
      g = g || 1;
      var o = osc('sine', 260, t, t + .15, 1, [[t, 0], [t + .004, .62 * g], [t + .14, 0]], .05); o.frequency.exponentialRampToValueAtTime(190, t + .13);
      osc('triangle', 330, t, t + .07, 1, [[t, 0], [t + .002, .4 * g], [t + .06, 0]], .03);
      var n = noise(t, .08), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = .9; var ob = bus(1, .06); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .003, .16 * g], [t + .06, 0]]);
    }
    /* tin foil scrunched: a run of tiny seeded crackles, band-passed high, with a soft 300 Hz press under them */
    function crinkle(t, g) {
      g = g || 1; var dur = BODY.crinkle, r = mulberry(29);
      for (var k = 0; k < 16; k++) {
        var tk = t + r() * (dur - .02), n = noise(tk, .02), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600 + r() * 3600; bp.Q.value = 1.4;
        var ob = bus(1, .04, (r() - .5) * .4); n.connect(bp); bp.connect(ob); var a = (.25 + r() * .45) * g; env(ob.gain, [[tk, 0], [tk + .002, a], [tk + .016, 0]]);
      }
      var o = osc('sine', 300, t, t + .1, 1, [[t, 0], [t + .006, .16 * g], [t + .09, 0]], 0); o.frequency.exponentialRampToValueAtTime(220, t + .09);
    }
    EV.forEach(function (e) {
      if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'crinkle') crinkle(e.t, e.g);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −60 dB, so the loop seam is never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .0015; })();
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d'); MC = mk(8, 8).getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 expanded 84px Archivo', '800 expanded 84px Archivo', '900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹✓✕–@!>$(),:'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initGaps();
  initTimes();
  /* the screenshot hold: from the last label settling (IN THE OPEN, on "out") to the torn edge before "cabinet" */
  var HOLD = { t0: K.out + .1, t1: S('cab').t0 - SWIPE };
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: (HOLD.t0 + HOLD.t1) / 2, SLUG: 'wifi', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, CAPMIN: function () { return CAPMIN; } };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  /* labels vs props: every readable label's box (chip box for chips) against every prop box drawn in the same frame */
  window.LABELS_RUN = function (step) {
    var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) {
      PROPS = []; LBL = []; CURT = t; frame(ctx, t);
      LBL.forEach(function (l) {
        PROPS.forEach(function (p) {
          var ox = Math.min(l.b[2], p.b[2]) - Math.max(l.b[0], p.b[0]), oy = Math.min(l.b[3], p.b[3]) - Math.max(l.b[1], p.b[1]);
          if (ox > 1 && oy > 1) { var key = l.text + ' × ' + p.name, o = out[key] || (out[key] = { label: l.text, prop: p.name, from: t, to: t, area: 0 }); o.to = t; o.area = Math.max(o.area, Math.round(ox * oy)); }
        });
      });
      PROPS = null; LBL = null;
    }
    return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
