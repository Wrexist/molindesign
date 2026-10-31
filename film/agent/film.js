/* "Agent" — what an AI agent actually is. Factory #14 on Tech, explained (How AI works, part 6), after ../phonephoto/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the click ticket: the guesser's "click" is a strip of receipt paper the series caret types out. It
   travels to a cardboard clicker box (the other software), whose paper finger presses the button the ticket names: the
   ticket's coordinates are printed from BTN, the same constant that places that button, so the claim is true on the frame.
   One hero stamp only: JUST TEXT. Cut-paper screens, no real UI, no logos, no real photos. Facts and sources: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#15131b', CREAM = '#f4ede0';
  var HOT = '#ff5b3d';
  var PAPER = '#f1e9d8', PAPER2 = '#e4d9c3', INK = '#211d26';
  var CARD = '#c8a273', CARD_D = '#a7814f', CARD_L = '#d9b88b', SKIN = '#e2b896', SKIN_D = '#b98a6c', SLATE = '#56607e';
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
  function kn(t, a) { return 1 + Math.max(0, knock(t, a, 16, 6)) * .08; }
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  /* the renderer samples each frame at (i + .5) / fps: anything that shows a changing count (typed letters) is held to
     its frame's centre, so motion blur never mixes two values */
  function qt(t) { return (Math.floor(t * 30) + .5) / 30; }

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

  /* scenes. swipe:true = the next scene comes in under the torn edge */
  var SWIPE = .44, PRE = .3;
  var SC = [
    { id: 'hook', fn: 'hook', name: 'Nobody touched the mouse', t0: 0 },
    { id: 'guesser', fn: 'mach', name: 'Ticket, clicker, screenshot', t0: start('guesser') - .2, swipe: true },
    { id: 'yellowstone', fn: 'ys', name: 'Yellowstone', t0: start('yellowstone') + .75, swipe: true, live: true },
    { id: 'ask_first', fn: 'gate', name: 'Ask first', t0: start('ask_first') + .55, swipe: true, live: true, noHide: true }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, MC, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- the safe-area check: every glyph box drawn on the film canvas is measured (window.BOUNDS_RUN) ---------- */
  var BOUNDS = null, INCOMING = false, CURT = 0, SAFE = { x0: 90, x1: 930, y1: 1450 };
  function recBox(g, x0, y0, x1, y1, text) {
    if (!BOUNDS || INCOMING || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
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

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function wide(g) { try { g.fontStretch = 'expanded'; } catch (e) {} }
  function mw(text, px, wt, fam) { font(MC, px, wt, fam); ls(MC, 0); return MC.measureText(text).width; }
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
    g.fillText(text, 0, px * .04); g.restore(); ls(g, 0);
    return w;
  }
  /* one line of type, shrunk to fit maxw; never under 36 px */
  function txt(g, text, x, y, px, col, align, wt, fam, maxw, a) {
    a = a == null ? 1 : a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 900, fam); ls(g, 0);
    while (maxw && g.measureText(text).width > maxw && px > 36) { px -= 2; font(g, px, wt || 900, fam); }
    g.fillStyle = col || CREAM; g.textAlign = align || 'center'; g.textBaseline = 'middle';
    /* labels that sit on the pencil ring get a stage-coloured halo so the dashes never cut through the letters */
    if (HALO) { g.strokeStyle = BG; g.lineWidth = px * .22; g.lineJoin = 'round'; g.strokeText(text, x, y); }
    g.fillText(text, x, y); g.restore();
  }
  var HALO = false;
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
  /* quiet tags (OUR ILLUSTRATION, RE-CREATED): cream outline, never coral */
  function tag(g, text, x, y, a, rot) { chip(g, text, x, y, { px: 36, wt: 700, fam: MONO, line: CREAM, lw: 3, fg: CREAM, a: a, rot: rot == null ? .02 : rot, shadow: false, bg: 'rgba(21,19,27,.9)', maxw: 820 }); }
  /* credits and sources never show in the incoming scene under the tear: they appear once it has covered the old one */
  function cred(a) { return INCOMING ? 0 : a; }
  /* a cut-paper shape: a polygon whose straight edges wobble a little (seeded), like scissors */
  function cut(g, pts, r, amp) {
    g.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 22));
      for (var k = 0; k < n; k++) { var f = k / n; g.lineTo(lerp(a[0], b[0], f) + (r() - .5) * amp, lerp(a[1], b[1], f) + (r() - .5) * amp); }
    }
    g.closePath(); g.fill();
  }
  /* the caret from part 1 (cream here: coral is kept for the send button, the one stamp and the gate) */
  function caret(g, x, y, h, t, busy, a, col) {
    var on = busy ? 1 : (Math.cos(t * Math.PI * 2 * 1.05) > -.2 ? 1 : .15);
    if (a != null && a <= 0) return;
    g.save(); g.globalAlpha *= (a == null ? 1 : a) * on; g.fillStyle = col || CREAM; rr(g, x - h * .05, y - h / 2, h * .1, h, h * .05); g.fill(); g.restore();
  }
  function arrowHead(g, x, y, ang, s, col) {
    g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = col || CREAM;
    g.beginPath(); g.moveTo(s, 0); g.lineTo(-s * .7, -s * .75); g.lineTo(-s * .35, 0); g.lineTo(-s * .7, s * .75); g.closePath(); g.fill(); g.restore();
  }
  /* a pencil scribble that reads as handwriting without being words */
  function scribble(g, x0, y, w, seed, lw) {
    var r = mulberry(seed);
    g.beginPath(); g.moveTo(x0, y);
    var x = x0, ph = r() * 6;
    while (x < x0 + w) {
      var step = 5, word = 30 + r() * 60, end = Math.min(x0 + w, x + word);
      while (x < end) { x += step; g.lineTo(x, y + Math.sin(x * .32 + ph) * 7 + Math.sin(x * .11) * 3); }
      x += 16 + r() * 8; g.moveTo(x, y);
    }
    g.lineWidth = lw || 3.2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
  }

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
  /* inked straight onto the ticket's paper (no backing card) */
  function stamp(g, text, x, y, t, t0, px, col, rot, sw) {
    if (t < t0) return;
    var c = stampTex(text, col, px);
    var k = sp(t, t0, 3.2, .8), s = lerp(1.35, 1, clamp(k, 0, 1)) * (sw ? sw / c.w : 1), al = clamp(k * 3, 0, 1);
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot == null ? -.08 : rot); g.scale(s, s);
    if (k >= 1) recBox(g, -c.w / 2, -c.h / 2, c.w / 2, c.h / 2, text);
    g.drawImage(c, -c.w / 2, -c.h / 2); g.restore();
  }

  /* =====================================================================================================
     PROPS
     ===================================================================================================== */
  /* the button the paper finger presses, in frame pixels: the ticket prints these numbers */
  var BTN = { x: 412, y: 880 };
  var TK = 'CLICK (' + BTN.x + ', ' + BTN.y + ')';
  var TW = 620, TH = 250, TPX = 54, TTY = -52;
  /* receipt-paper ticket, centred on (x, y), scale s. n = letters typed so far. reveal (0..1) feeds it from the top. */
  function ticket(g, x, y, s, text, n, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0 || s <= 0) return;
    var r = mulberry(strHash(text) + 3), hw = TW / 2, hh = TH / 2;
    g.save(); g.globalAlpha *= a; g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.reveal != null && o.reveal < 1) { g.beginPath(); g.rect(-hw - 30, -hh - 30, TW + 60, (TH + 30) * o.reveal + 30); g.clip(); }
    var pts = [], i;
    for (i = 0; i <= 20; i++) pts.push([-hw + TW * i / 20, -hh + (i % 2 ? 9 : 0)]);
    for (i = 20; i >= 0; i--) pts.push([-hw + TW * i / 20, hh - (i % 2 ? 0 : 9)]);
    g.save(); g.translate(8, 12); g.fillStyle = 'rgba(0,0,0,.36)'; cut(g, pts, r, 0); g.restore();
    g.fillStyle = PAPER; cut(g, pts, r, 0);
    /* a faint feed edge: two sprocket-less receipt rules */
    g.fillStyle = 'rgba(33,29,38,.12)'; g.fillRect(-hw + 26, 4, TW - 52, 3);
    var full = mw(text, TPX, 700, MONO), sub = text.slice(0, n == null ? text.length : n);
    g.fillStyle = INK; font(g, TPX, 700, MONO); ls(g, 0); g.textAlign = 'left'; g.textBaseline = 'middle';
    if (sub.length) g.fillText(sub, -full / 2, TTY);
    if (o.stampT != null) stamp(g, 'JUST TEXT', 0, 58, o.t, o.stampT, 64, HOT, -.05, 390);
    if (o.guess > 0) chip(g, 'GUESS', hw - 92, -hh - 4, { px: Math.round(38 / s), wt: 900, bg: CREAM, fg: BG, a: o.guess, rot: .06, shadow: false });
    g.restore();
  }
  /* the frame position of the caret after the first n letters of a ticket at (x, y) scale s */
  function typeX(x, s, text, n) { var full = mw(text, TPX, 700, MONO); return x + s * (-full / 2 + mw(text.slice(0, n), TPX, 700, MONO)); }

  /* the cardboard clicker box (the other software): flaps, a lever on top, a paper finger out of its left side */
  function box(g, x, y, s, lever, o) {
    o = o || {}; var r = mulberry(41);
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.38)'; rr(g, -112, -70, 240, 200, 10); g.fill();
    /* the lever: a dowel with a knob, hinged at the top right; lever 0 = up, 1 = pulled down */
    var la = lerp(-1.05, -.1, lever);
    g.save(); g.translate(62, -78); g.rotate(la);
    g.fillStyle = '#7b5c3a'; rr(g, -6, -96, 12, 100, 6); g.fill();
    g.fillStyle = PAPER; el(g, 0, -100, 20, 20); g.fillStyle = 'rgba(33,29,38,.25)'; el(g, 4, -96, 8, 8);
    g.restore();
    /* back flaps */
    g.fillStyle = CARD_D; cut(g, [[-120, -80], [-60, -118], [10, -112], [0, -80]], r, 2);
    g.fillStyle = CARD_L; cut(g, [[0, -80], [30, -122], [116, -108], [120, -80]], r, 2);
    /* body */
    g.fillStyle = CARD; cut(g, [[-120, -80], [120, -80], [120, 120], [-120, 120]], r, 2.5);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(-120, 40, 240, 4);
    g.fillStyle = CARD_D; g.fillRect(-120, -80, 240, 10);
    /* the slot the screenshot prints come out of, and the hole the finger comes through */
    g.fillStyle = '#3a2c1e'; rr(g, -78, 92, 156, 12, 6); g.fill();
    el(g, -112, -20, 9, 26);
    /* a hand crank on the front: a cut circle and a handle */
    g.fillStyle = CARD_D; el(g, 52, 18, 30, 30); g.fillStyle = '#7b5c3a';
    var ca = (o.crank || 0) * 6.283; g.save(); g.translate(52, 18); g.rotate(ca); rr(g, -5, -30, 10, 34, 5); g.fill(); el(g, 0, -30, 9, 9); g.restore();
    g.fillStyle = 'rgba(33,29,38,.35)'; el(g, -54, 18, 22, 6);
    g.restore();
  }
  /* the paper finger: a strip from the box's side hole to (tx, ty) */
  function finger(g, x0, y0, tx, ty, a) {
    if (a <= 0 || Math.abs(tx - x0) < 6) return;
    var ang = Math.atan2(ty - y0, tx - x0), L = Math.hypot(tx - x0, ty - y0);
    g.save(); g.globalAlpha *= a; g.translate(x0, y0); g.rotate(ang);
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, 0, -15 + 10, L + 18, 30, 15); g.fill();
    g.fillStyle = SKIN; rr(g, 0, -17, L + 18, 34, 17); g.fill();
    g.fillStyle = SKIN_D; for (var k = 1; k <= 2; k++) if (L - k * 70 > 20) g.fillRect(L - k * 70, -17, 5, 34);
    g.fillStyle = '#f3d9c4'; rr(g, L - 26, -12, 34, 24, 10); g.fill();
    g.restore();
  }
  /* a cut-paper window: a title strip, two pencil-filled fields and the one button (centre = BTN when sc = 1) */
  function screenWin(g, cx, cy, sc, sy, press, done) {
    if (sc <= 0 || sy <= 0) return;
    var w = 420, h = 250, bx = BTN.x - 400, by = BTN.y - 900, r = mulberry(77);
    g.save(); g.translate(cx, cy); g.scale(sc, sc * sy);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-w / 2 + 10, -h / 2 + 14, w, h);
    g.fillStyle = PAPER; cut(g, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], r, 1.5);
    g.fillStyle = SLATE; g.fillRect(-w / 2, -h / 2, w, 34);
    g.fillStyle = PAPER2; el(g, -w / 2 + 22, -h / 2 + 17, 7, 7); el(g, -w / 2 + 44, -h / 2 + 17, 7, 7); el(g, -w / 2 + 66, -h / 2 + 17, 7, 7);
    /* the button */
    var pw = 150, ph = 66, dn = press * 4;
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, bx - pw / 2 + 4, by - ph / 2 + 6, pw, ph, 14); g.fill();
    g.fillStyle = done ? '#3f7a5a' : SLATE; rr(g, bx - pw / 2 + dn, by - ph / 2 + dn, pw, ph, 14); g.fill();
    g.strokeStyle = PAPER; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    if (done) { g.moveTo(bx - 22 + dn, by + dn); g.lineTo(bx - 6 + dn, by + 15 + dn); g.lineTo(bx + 24 + dn, by - 14 + dn); }
    else { g.moveTo(bx - 26 + dn, by + dn); g.lineTo(bx + 22 + dn, by + dn); g.moveTo(bx + 8 + dn, by - 14 + dn); g.lineTo(bx + 24 + dn, by + dn); g.lineTo(bx + 8 + dn, by + 14 + dn); }
    g.stroke();
    /* two fields, pencil-filled */
    g.strokeStyle = 'rgba(33,29,38,.28)'; g.lineWidth = 3;
    g.strokeRect(-w / 2 + 24, 42, w - 48, 30); g.strokeRect(-w / 2 + 24, 84, w - 48, 30);
    g.strokeStyle = 'rgba(33,29,38,.55)'; scribble(g, -w / 2 + 36, 57, 150, 3, 2.6); scribble(g, -w / 2 + 36, 99, 210, 9, 2.6);
    g.restore();
  }
  /* a polaroid-style print. kind: 'win' (the window after the click) or a Yellowstone scene; num = pencil number */
  var PW = 270, PH = 250;
  function print(g, cx, cy, s, rot, kind, num, a) {
    if (s <= 0 || (a != null && a <= 0)) return;
    var r = mulberry(strHash(kind) + 5), iw = 232, ih = 180, ix = -iw / 2, iy = -PH / 2 + 18;
    g.save(); if (a != null) g.globalAlpha *= a; g.translate(cx, cy); g.rotate(rot || 0); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.36)'; g.fillRect(-PW / 2 + 9, -PH / 2 + 13, PW, PH);
    g.fillStyle = PAPER; g.fillRect(-PW / 2, -PH / 2, PW, PH);
    g.save(); g.beginPath(); g.rect(ix, iy, iw, ih); g.clip();
    if (kind === 'win') {
      g.fillStyle = '#2a2633'; g.fillRect(ix, iy, iw, ih);
      g.save(); g.translate(0, iy + ih / 2); g.scale(.5, .5); g.translate(-(BTN.x - 400), -(BTN.y - 900) + 40);
      screenWin(g, 0, 0, 1, 1, 0, true); g.restore();
    } else if (kind === 'geyser') {
      g.fillStyle = '#9cc3d8'; g.fillRect(ix, iy, iw, ih);
      g.fillStyle = '#c9dce6'; cut(g, [[ix, iy + 110], [ix + 70, iy + 70], [ix + 140, iy + 95], [ix + iw, iy + 62], [ix + iw, iy + ih], [ix, iy + ih]], r, 3);
      g.fillStyle = '#8a8f6a'; cut(g, [[ix, iy + 140], [ix + iw, iy + 128], [ix + iw, iy + ih], [ix, iy + ih]], r, 2);
      g.fillStyle = '#d6c7a6'; el(g, 6, iy + 150, 60, 14);
      g.fillStyle = '#fbf6ec'; [[0, 140, 22, 18], [-4, 116, 26, 20], [4, 92, 30, 22], [-6, 66, 34, 22], [6, 42, 38, 22], [0, 22, 44, 20]].forEach(function (p) { el(g, p[0] + 6, iy + p[1], p[2], p[3]); });
      g.fillStyle = '#2f4a36'; for (var i = 0; i < 6; i++) { var px = ix + 10 + i * 18 + (i > 2 ? 140 : 0), pyy = iy + 150; cut(g, [[px, pyy], [px + 9, pyy - 46 - (i % 2) * 12], [px + 18, pyy]], r, 1); }
    } else if (kind === 'spring') {
      g.fillStyle = '#a9cbe0'; g.fillRect(ix, iy, iw, ih);
      g.fillStyle = '#7f8a64'; cut(g, [[ix, iy + 60], [ix + iw, iy + 50], [ix + iw, iy + ih], [ix, iy + ih]], r, 2);
      var rings = ['#c8662f', '#e0a33a', '#e9d27a', '#7fbf9f', '#2f8fae'];
      rings.forEach(function (c, k) { g.fillStyle = c; el(g, 0, iy + 120, 100 - k * 18, 40 - k * 7); });
      g.fillStyle = '#2f4a36'; for (i = 0; i < 9; i++) { var qx = ix + 8 + i * 26, qy = iy + 62; cut(g, [[qx, qy], [qx + 8, qy - 30 - (i % 3) * 6], [qx + 16, qy]], r, 1); }
    } else {
      g.fillStyle = '#b8d2e2'; g.fillRect(ix, iy, iw, ih);
      g.fillStyle = '#7d8aa0'; cut(g, [[ix, iy + 100], [ix + 60, iy + 40], [ix + 110, iy + 80], [ix + 170, iy + 30], [ix + iw, iy + 90], [ix + iw, iy + ih], [ix, iy + ih]], r, 3);
      g.fillStyle = '#f4f1ea'; cut(g, [[ix + 160, iy + 40], [ix + 170, iy + 30], [ix + 182, iy + 44]], r, 1);
      g.fillStyle = '#5f8fae'; g.fillRect(ix, iy + 120, iw, 26);
      g.fillStyle = '#2f4a36'; for (i = 0; i < 10; i++) { var zx = ix + 4 + i * 24, zy = iy + ih; cut(g, [[zx, zy], [zx + 11, zy - 48 - (i % 2) * 14], [zx + 22, zy]], r, 1); }
    }
    g.restore();
    if (num) { g.fillStyle = 'rgba(33,29,38,.75)'; font(g, 40, 700, MONO); g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(num, PW / 2 - 18, PH / 2 - 26); }
    g.restore();
  }
  /* the email card: pencil handwriting, a coral send button with a paper-plane icon (no word on it) */
  var EC = { w: 680, h: 460, bx: 205, by: 150 };
  function emailCard(g, x, y, s, press) {
    var r = mulberry(19), hw = EC.w / 2, hh = EC.h / 2;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(-hw + 10, -hh + 14, EC.w, EC.h);
    g.fillStyle = PAPER; cut(g, [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]], r, 2);
    g.fillStyle = PAPER2; g.fillRect(-hw, -hh, EC.w, 76);
    /* an envelope icon in the header */
    g.strokeStyle = INK; g.lineWidth = 4; g.lineJoin = 'round';
    g.strokeRect(-hw + 28, -hh + 20, 52, 36); g.beginPath(); g.moveTo(-hw + 28, -hh + 20); g.lineTo(-hw + 54, -hh + 42); g.lineTo(-hw + 80, -hh + 20); g.stroke();
    g.strokeStyle = 'rgba(33,29,38,.6)'; scribble(g, -hw + 104, -hh + 38, 210, 4, 3.4);
    /* the to: line, a subject, the body */
    g.strokeStyle = 'rgba(33,29,38,.2)'; g.lineWidth = 2;
    [-112, -52].forEach(function (yy) { g.beginPath(); g.moveTo(-hw + 28, yy + 22); g.lineTo(hw - 28, yy + 22); g.stroke(); });
    g.strokeStyle = 'rgba(33,29,38,.62)';
    scribble(g, -hw + 34, -116, 230, 11, 3.4); scribble(g, -hw + 34, -56, 380, 13, 3.4);
    scribble(g, -hw + 34, 6, 560, 21, 3); scribble(g, -hw + 34, 50, 500, 23, 3); scribble(g, -hw + 34, 94, 290, 29, 3);
    /* send: coral, a paper plane */
    var bw = 170, bh = 100, pk = press == null ? 1 : press;
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, EC.bx - bw / 2 + 5, EC.by - bh / 2 + 7, bw, bh, 26); g.fill();
    g.translate(EC.bx, EC.by); g.scale(pk, pk); g.translate(-EC.bx, -EC.by);
    g.fillStyle = HOT; rr(g, EC.bx - bw / 2, EC.by - bh / 2, bw, bh, 26); g.fill();
    g.fillStyle = PAPER; g.beginPath(); g.moveTo(EC.bx - 40, EC.by - 4); g.lineTo(EC.bx + 42, EC.by - 30); g.lineTo(EC.bx + 14, EC.by + 32); g.lineTo(EC.bx + 2, EC.by + 8); g.closePath(); g.fill();
    g.fillStyle = '#e8d9c4'; g.beginPath(); g.moveTo(EC.bx + 2, EC.by + 8); g.lineTo(EC.bx + 42, EC.by - 30); g.lineTo(EC.bx - 2, EC.by + 24); g.closePath(); g.fill();
    g.restore();
  }
  function cursorArrow(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-.12);
    var P = [[0, 0], [0, 66], [16, 52], [29, 80], [42, 74], [29, 47], [50, 47]];
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); P.forEach(function (p, i) { if (i) g.lineTo(p[0] + 5, p[1] + 7); else g.moveTo(p[0] + 5, p[1] + 7); }); g.closePath(); g.fill();
    g.fillStyle = CREAM; g.beginPath(); P.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); g.fill();
    g.strokeStyle = INK; g.lineWidth = 3.5; g.lineJoin = 'round'; g.stroke();
    g.restore();
  }
  /* a card-stock mouse with a string cord, and the empty pencil outline of a hand over it */
  var MS = { x: 785, y: 1282, s: 1.2 };
  function mouse(g, t) {
    var x = MS.x, y = MS.y, k = MS.s;
    g.save(); g.strokeStyle = '#cfc6b4'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y - 110 * k); g.bezierCurveTo(x, y - 190 * k, x + 100, y - 190 * k, x + 102, y - 250 * k); g.bezierCurveTo(x + 104, y - 300 * k, x + 20, y - 330 * k, 776, 1040); g.stroke(); g.restore();
    g.save(); g.translate(x, y); g.scale(k, k); g.translate(-x, -y);
    g.fillStyle = 'rgba(0,0,0,.38)'; rr(g, x - 75 + 8, y - 110 + 12, 150, 220, 75); g.fill();
    g.fillStyle = '#ddd4c2'; rr(g, x - 75, y - 110, 150, 220, 75); g.fill();
    g.fillStyle = '#c9bfab'; rr(g, x - 75, y - 10, 150, 120, 60); g.fill();
    g.fillStyle = '#ddd4c2'; g.fillRect(x - 75, y - 12, 150, 30);
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - 106); g.lineTo(x, y - 14); g.moveTo(x - 72, y - 14); g.lineTo(x + 72, y - 14); g.stroke();
    g.fillStyle = '#8f8676'; rr(g, x - 8, y - 84, 16, 40, 8); g.fill();
    /* the empty hand: a solid cream pencil outline (the cursor's glide from 0.0 s keeps frame 0 moving) */
    g.save(); g.strokeStyle = CREAM; g.lineWidth = 4 / k; g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); g.ellipse(x, y + 18, 92, 104, 0, 0, 6.283); g.stroke();
    [[-64, -150, -78], [-24, -176, -82], [16, -178, -84], [54, -158, -80]].forEach(function (f) { rr(g, x + f[0] - 15, y + f[1], 30, -f[2] + 40, 15); g.stroke(); });
    g.beginPath(); g.ellipse(x - 112, y + 10, 18, 52, -.5, 0, 6.283); g.stroke();
    g.restore(); g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · hook + ask. Frame 0: NOBODY TOUCHED / THE MOUSE (4 words), the email card, the cursor resting on send,
     the mouse dead still with an empty hand outline. OUR ILLUSTRATION at 1.5 s. On "So what" the type lifts out (the
     caption takes the search phrase) and the cursor slides off the button and up the card.
     ===================================================================================================== */
  var ASK = start('ask');
  var CARD0 = { x: 440, y: 870 };
  /* frame 0: the cursor rests up on the card at C0; from 0.00 s it glides on a slight curve to send, makes two small
     corrections (7 px past, 6 px back), presses at 1.00–1.10 s while the mouse stays dead still; on "So what" it slides
     back up to C0, so the loop lands on frame 0 */
  var C0 = { x: 300, y: 700 }, PRESS = { t0: 1.0, t1: 1.1 };
  function cursorPos(t, idle) {
    var bx = CARD0.x + EC.bx - 8, by = CARD0.y + EC.by - 10;
    if (idle) return { x: C0.x, y: C0.y };
    var g0 = eio(seg(t, 0, .76)), x = lerp(C0.x, bx, g0) + Math.sin(g0 * Math.PI) * 69, y = lerp(C0.y, by, g0) - Math.sin(g0 * Math.PI) * 45;
    var c1 = Math.sin(Math.PI * seg(t, .74, .87)), c2 = Math.sin(Math.PI * seg(t, .85, .98));
    x += 7 * c1 - 6 * c2; y += 6 * c1 - 5 * c2;
    var k = eio(seg(t, ASK + .25, S('guesser').t0 - SWIPE + .1));
    return { x: lerp(x, C0.x, k) + Math.sin(k * Math.PI) * -60, y: lerp(y, C0.y, k) + Math.sin(k * Math.PI) * 30 };
  }
  function pressK(t) { var u = seg(t, PRESS.t0, PRESS.t1); return 1 - .06 * Math.sin(Math.PI * u); }
  function hookScene(g, t, idle) {
    emailCard(g, CARD0.x, CARD0.y, 1, idle ? 1 : pressK(t));
    mouse(g, idle ? 0 : t);
    var c = cursorPos(t, idle); cursorArrow(g, c.x, c.y, 1.3);
    tag(g, 'OUR ILLUSTRATION', 292, 1166, idle ? 0 : cred(fin(t, .55)), -.015);
    if (!idle && t >= ASK - .2) hookSmall(g, t);
  }
  function hookText(g, t, idle) {
    var a = idle ? 1 : 1 - seg(t, ASK - .32, ASK - .1);
    if (a <= 0) return;
    var up = idle ? 0 : eio(seg(t, ASK - .34, ASK - .08)) * 46;
    var L = ['NOBODY TOUCHED', 'THE MOUSE'], px = 112;
    g.save(); g.globalAlpha *= a; font(g, px, 900);
    while (g.measureText(L[0]).width > 820 && px > 60) { px -= 2; font(g, px, 900); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
    g.fillText(L[0], CX, 404 - up); g.fillText(L[1], CX, 404 + px * 1.04 - up);
    g.restore();
  }
  /* during the question the hook stays as one line over the card, so it can still be read */
  function hookSmall(g, t) {
    var a = cred(fin(t, ASK - .14));
    txt(g, 'NOBODY TOUCHED THE MOUSE', CX, 588, 48, CREAM, 'center', 900, DISP, 820, a);
  }

  /* =====================================================================================================
     SCENE 2 · the machine: guesser → action → trick (hero) → runs → loop (screenshot frame) → wrong.
     One stage; every prop moves between keyed layouts.
     ===================================================================================================== */
  var M = {
    g0: S('guesser').t0, gs: start('guesser'), guesser: at('guesser', 'guesser'),
    act: at('action', 'actions'), click: at('action', 'click'), here: wend('action', 'here'),
    tr0: start('trick'), trick: at('trick', 'trick'), cant: at('trick', 'cant'), anyEnd: wend('trick', 'anything'),
    r0: start('runs'), other: at('runs', 'other'), clicks: at('runs', 'clicks'), shot: at('runs', 'screenshot'), shotEnd: wend('runs', 'screenshot'),
    l0: start('loop'), think: at('loop', 'think'), actW: at('loop', 'act'), look: at('loop', 'look'), lookEnd: wend('loop', 'look'),
    w0: start('wrong'), every: at('wrong', 'every'), step: at('wrong', 'step'), guess: at('wrong', 'guess')
  };
  M.mat = at('guesser', 'guesser') - .2;
  /* the screenshot frame holds completely still from here … */
  M.hold0 = M.lookEnd + .28;
  /* … to here: the first new ticket leaves the caret on "every" */
  M.hold1 = M.every - .05;
  M.tk = [M.hold1];
  /* guesser layout (4.0–7.5 s) is 1.15× and lower; on "action" it settles into the compact one so the ticket has room */
  var BIG = { z: 1.15, cx: 650, y0: 800, dy: 127, st: { cx: 222, cy: 920, ch: 322 } }, SMALL = { z: .9, cx: 660, y0: 690, dy: 90, st: { cx: 250, cy: 780, ch: 240 } };
  var TH0 = { cx: 205, cy: 680, ch: 170 };
  var STRIP0 = 'THE CAT SAT ON THE ', STRIP1 = 'TASK: FILL OUT THIS FORM';
  var NT = { x: 479, y: 858, s: .52 }, HERO = { x: 510, y: 1075, s: 1.26 }, TL = { x: 500, y: 680, s: .68 }, BOXL = { x: 790, y: 900 }, PRL = { x: 512, y: 1084, s: .9 };
  var RING = { x: 515, y: 900, rx: 300, ry: 235, aT: -2.41, aA: 0, aL: 1.58 };
  function ringPt(a) { return [RING.x + Math.cos(a) * RING.rx, RING.y + Math.sin(a) * RING.ry]; }
  function chipRow(g, text, x, y, w, sy, lit, a, z) {
    if (sy <= .01 || a <= 0) return;
    z = z || 1; w /= z;
    g.save(); g.globalAlpha *= a; g.translate(x + w * z / 2, y); g.scale(z, sy * z);
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, -w / 2 + 6, -40, w, 86, 18); g.fill();
    g.fillStyle = lit ? CREAM : '#24212c'; rr(g, -w / 2, -43, w, 86, 18); g.fill();
    g.strokeStyle = 'rgba(244,237,224,.55)'; g.lineWidth = 3; rr(g, -w / 2, -43, w, 86, 18); g.stroke();
    if (sy > .3) { g.fillStyle = lit ? BG : CREAM; font(g, 52, 800); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, -w / 2 + 30, 3); }
    g.restore();
  }
  function machScene(g, t) {
    var T = M, still = t >= T.hold0 && t < T.hold1;
    /* ---------- the prompt strip and the next-word chips (guesser, action) ---------- */
    var flip = function (i) { return seg(t, T.act - .06 + i * .07, T.act + .3 + i * .07); };
    var gone = eio(seg(t, T.tr0 - .12, T.tr0 + .22));
    var sk = flip(0), sy = Math.abs(Math.cos(Math.PI * sk)) * (1 - eio(seg(t, T.r0 - .25, T.r0 + .05)));
    var matK = eout(seg(t, T.mat, T.mat + .25));
    if (gone < 1 || t < T.r0 + .1) {
      if (sy > .01) {
        g.save(); g.translate(CX, 600); g.scale(1, sy);
        g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-394, -30, 800, 72);
        g.fillStyle = PAPER; g.fillRect(-400, -36, 800, 72);
        g.fillStyle = INK; font(g, 42, 700, MONO); g.textAlign = 'left'; g.textBaseline = 'middle';
        if (sy > .3) g.fillText(sk < .5 ? (matK >= 1 ? STRIP0 + 'MAT' : STRIP0) : STRIP1, -370, 2);
        g.restore();
      }
      var W0 = ['MAT', 'SOFA', 'FLOOR'], W1 = ['CLICK', 'TYPE', 'SCROLL'], U = 1 - eio(seg(t, T.act - .25, T.act + .3));
      var z = lerp(SMALL.z, BIG.z, U), ccx = lerp(SMALL.cx, BIG.cx, U), cy0 = lerp(SMALL.y0, BIG.y0, U), cdy = lerp(SMALL.dy, BIG.dy, U);
      for (var i = 0; i < 3; i++) {
        var f = flip(i + 1), syr = Math.abs(Math.cos(Math.PI * f)) * (1 - gone);
        var lit = f < .5 ? (i === 0 && t > T.guesser) : (i === 0 && t > T.click - .08);
        chipRow(g, f < .5 ? W0[i] : W1[i], ccx - 240 * z, cy0 + i * cdy, 480 * z, syr, lit, 1, z);
      }
      /* on "guesser" the top guess slides up into the strip: THE CAT SAT ON THE MAT */
      if (matK > 0 && matK < 1) {
        var mx0 = ccx - 240 * z + 30 * z, my0 = cy0, mx1 = CX - 370 + mw(STRIP0, 42, 700, MONO), my1 = 602, mwid = mw('MAT', 42, 700, MONO);
        var mx = lerp(mx0, mx1, matK), my = lerp(my0, my1, matK);
        g.save(); g.fillStyle = CREAM; rr(g, mx - 8, my - 30, mwid + 16, 60, 10); g.fill();
        g.fillStyle = BG; font(g, 42, 700, MONO); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('MAT', mx, my); g.restore();
      }
    }
    var la = fin(t, T.g0 + PRE) * (1 - seg(t, T.act + .25, T.act + .4));
    txt(g, 'NEXT-WORD GUESSER', CX, 1250, 71, CREAM, 'center', 900, DISP, 820, la);
    txt(g, 'HOW AI WORKS · PART 1', CX, 1332, 46, CREAM, 'center', 600, MONO, 820, la);
    /* ---------- the ticket: fed on "Click", typed letter by letter, torn on "trick", stamped, then to the loop ---------- */
    var ty0 = T.click - .04, ty1 = T.here + .08, nT = Math.floor(TK.length * seg(qt(t), ty0, ty1) + 1e-6);
    var rv = eout(seg(t, T.click - .24, T.click + .06));
    /* held still from the stamp until just after "clicks", then a 0.5 s ease-out up to its place on the ring */
    var mu = seg(t, T.clicks + .06, T.clicks + .56), mv = 1 - (1 - mu) * (1 - mu);
    var lift = eio(seg(t, T.trick - .06, T.trick + .22));
    var tx = lerp(HERO.x, TL.x, mv), tyy = lerp(HERO.y - 14 * lift, TL.y, mv), ts = lerp(HERO.s, TL.s, mv), trot = lerp(-.02 * lift, 0, mv);
    var stampK = kn(t, GT.slam + .02);
    function drawTicket() {
      if (t < T.click - .24) return;
      g.save(); g.translate(tx, tyy); g.scale(stampK, stampK); g.translate(-tx, -tyy);
      ticket(g, tx, tyy, ts, TK, nT, { reveal: rv, rot: trot, stampT: GT.slam, t: t });
      g.restore();
    }
    /* the tear: a torn stub left at the feed line when the ticket comes off */
    txt(g, 'COUNTS PIXELS · ANTHROPIC, 2024', CX, 1336, 38, CREAM, 'center', 600, MONO, 820, fin(t, T.here - .05) * (1 - seg(t, T.clicks + .2, T.clicks + .35)));
    /* ---------- the box: in on "trick", down to the loop on "Other" ---------- */
    var bin = eio(seg(t, T.trick - .28, T.trick + .3)), bdn = eio(seg(t, T.r0 - .3, T.r0 + .3));
    var bx = lerp(1250, BOXL.x, bin), by = lerp(830, BOXL.y, bdn);
    var press = eio(seg(t, T.clicks - .3, T.clicks - .04)) * (1 - eio(seg(t, T.clicks + .3, T.clicks + .62)));
    var pump = 0;
    T.tk.forEach(function (k) { pump = Math.max(pump, Math.sin(Math.PI * seg(t, k + .42, k + .78))); });
    var crank = seg(t, T.shot - .2, T.shot + .5) + T.tk.reduce(function (s, k) { return s + seg(t, k + .5, k + .9); }, 0);
    /* ---------- the window the finger presses (runs) ---------- */
    var wpop = clamp(pop(t, T.r0 + .02, 3, .9), 0, 1), wcol = 1 - eio(seg(t, T.l0 - .2, T.l0 + .15));
    var done = t >= T.clicks - .02;
    if (t >= T.r0 && wcol > 0) screenWin(g, 400, 900, lerp(.9, 1, wpop) * (wpop > 0 ? 1 : 0), wcol, press > .96 ? 1 : 0, done);
    /* the ring: drawn on as the loop starts; a cream notch runs round it once */
    var rp = eio(seg(t, T.l0 - .35, T.think + .05));
    if (rp > 0 && t < S('yellowstone').t0) {
      g.save(); g.strokeStyle = 'rgba(244,237,224,.62)'; g.lineWidth = 6; g.setLineDash([18, 14]);
      g.beginPath(); g.ellipse(RING.x, RING.y, RING.rx, RING.ry, 0, RING.aT, RING.aT + 6.283 * rp); g.stroke(); g.restore();
      [(RING.aT + RING.aA) / 2, 1.0, (RING.aL + RING.aT + 6.283) / 2].forEach(function (a, i) {
        if (rp < (i + 1) / 3) return; var p = ringPt(a); arrowHead(g, p[0], p[1], Math.atan2(RING.ry * Math.cos(a), -RING.rx * Math.sin(a)), 20, 'rgba(244,237,224,.75)');
      });
    }
    /* the box under the props that sit on the ring; the finger from its side hole to BTN */
    if (bin > 0 && t < S('yellowstone').t0 + 1) {
      box(g, bx, by, 1, Math.max(press, pump), { crank: crank });
      var ext = eio(seg(t, T.clicks - .32, T.clicks - .04)) * (1 - eio(seg(t, T.clicks + .32, T.clicks + .66)));
      finger(g, bx - 112, by - 20, lerp(bx - 100, BTN.x + 14, ext), lerp(by - 20, BTN.y + 4, ext), ext > .02 ? 1 : 0);
    }
    drawTicket();
    /* the screenshot print: out of the box's slot on "screenshot", to the LOOK place */
    var pk = eio(seg(t, T.shot - .1, T.shotEnd + .35));
    if (t >= T.shot - .1) {
      for (var j = T.tk.length - 1; j >= 0; j--) {
        var q = eio(seg(t, T.tk[j] + .55, T.tk[j] + 1.05));
        if (q > 0) print(g, lerp(bx - 20, PRL.x + 14 * (j + 1), q), lerp(by + 100, PRL.y + 10 * (j + 1), q), lerp(.3, PRL.s, q), lerp(0, .03 * (j + 1), q), 'win');
      }
      print(g, lerp(bx - 20, PRL.x, pk), lerp(by + 100, PRL.y, pk), lerp(.3, PRL.s, pk), lerp(.1, -.02, pk), 'win');
    }
    /* the new tickets of "every step": typed by the caret, each with a GUESS chip, piled on the first */
    /* one new ticket for "every step": out of the caret, opaque, below the first one (never over JUST TEXT, ACT or the
       lever), right edge at x 640, with one GUESS chip on its right end */
    T.tk.forEach(function (k) {
      var q = eio(seg(t, k, k + .38)); if (q <= 0) return;
      ticket(g, lerp(TH0.cx + 40, NT.x, q), lerp(TH0.cy, NT.y, q), lerp(.2, NT.s, q), 'CLICK (OK)', null, { rot: .015 * q, guess: fin(t, k + .4) });
    });
    /* the ring marker: think → act → look → home, then still */
    if (t >= T.think - .06 && t < S('yellowstone').t0) {
      var a;
      if (t < T.actW) a = lerp(RING.aT, RING.aA, eio(seg(t, T.think, T.actW)));
      else if (t < T.look) a = lerp(RING.aA, RING.aL, eio(seg(t, T.actW, T.look)));
      else a = lerp(RING.aL, RING.aT + 6.283, eio(seg(t, T.look, T.hold0)));
      var p = ringPt(a), mk2 = fin(t, T.think - .06);
      g.save(); g.globalAlpha *= mk2; g.fillStyle = CREAM; g.beginPath(); g.arc(p[0], p[1], 15, 0, 6.283); g.fill(); g.restore();
    }
    /* ---------- the caret: station → types the ticket → THINK; solid while it types and through the hold ---------- */
    var cx, cy, ch, busy = false;
    var toT = eio(seg(t, T.click - .3, T.click - .06)), back = eio(seg(t, T.r0 - .12, T.r0 + .3));
    /* the caret blinks in the strip right after the sentence (after MAT once it lands, after the task once it flips) */
    var stx = CX - 370 + (sk < .5 ? mw(STRIP0 + (matK >= 1 ? 'MAT' : ''), 42, 700, MONO) - (matK >= 1 ? 0 : mw(' ', 42, 700, MONO)) : mw(STRIP1, 42, 700, MONO)) + 8;
    var ST = { cx: stx, cy: 600, ch: 52 }, stripA = toT > 0 ? 1 : (sy > .3 ? 1 : 0);
    if (t < T.r0 - .12) {
      var n2 = Math.max(0, nT), ex = typeX(HERO.x, HERO.s, TK, n2) + 10 * HERO.s, ey = HERO.y + TTY * HERO.s;
      cx = lerp(ST.cx, ex, toT); cy = lerp(ST.cy, ey, toT); ch = lerp(ST.ch, 66 * HERO.s, toT); busy = toT > 0 && t < ty1 + .1;
    } else {
      var fx = typeX(HERO.x, HERO.s, TK, TK.length) + 10 * HERO.s, fy = HERO.y + TTY * HERO.s;
      cx = lerp(fx, TH0.cx, back); cy = lerp(fy, TH0.cy, back); ch = lerp(66 * HERO.s, TH0.ch, back);
      busy = back < 1 || (t >= T.l0 - .2 && t < T.hold1 + .4) || T.tk.some(function (k) { return t >= k - .1 && t < k + .4; });
    }
    /* ink while it sits on the ticket's paper, cream on the stage */
    var onPaper = t < T.r0 - .12 ? true : back < .5;
    caret(g, cx, cy, ch, t, busy, t < T.r0 - .12 ? stripA : null, onPaper ? INK : CREAM);
    /* ---------- labels: each beside its own prop, keyed to its word ---------- */
    HALO = true;
    var oa = fin(t, T.clicks + .62);
    txt(g, 'OTHER', 805, 1076, 36, CREAM, 'center', 800, DISP, 240, oa);
    txt(g, 'SOFTWARE', 805, 1118, 36, CREAM, 'center', 800, DISP, 240, oa);
    txt(g, 'SCREENSHOT', 108, 1132, 36, CREAM, 'left', 800, DISP, 300, fin(t, T.shot + .1));
    txt(g, 'THINK', TH0.cx, 816, 56, CREAM, 'center', 900, DISP, 300, fin(t, T.think - .05));
    txt(g, 'ACT', 860, 672, 56, CREAM, 'center', 900, DISP, 300, fin(t, T.actW - .05));
    txt(g, 'LOOK', 108, 1066, 56, CREAM, 'left', 900, DISP, 300, fin(t, T.look - .05));
    HALO = false;
    var ca = cred(fin(t, T.think + .12));
    txt(g, 'THE LOOP · REACT, YAO ET AL., 2022', CX, 1352, 40, CREAM, 'center', 800, DISP, 820, ca);
    txt(g, '“thought-action-observation”', CX, 1406, 44, CREAM, 'center', 700, DISP, 820, ca);
    void still;
  }

  /* =====================================================================================================
     SCENE 3 · yellowstone: the ticket CLICK (PHOTO 4) and the prints that come back; RE-CREATED; Anthropic's words.
     ===================================================================================================== */
  function ysScene(g, t) {
    var POP = GT.pop, K = YK;
    /* the task strip, like part 1's prompt strip */
    g.save(); g.translate(CX, 600);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-394, -30, 800, 72);
    g.fillStyle = PAPER; g.fillRect(-400, -36, 800, 72);
    g.fillStyle = INK; font(g, 42, 700, MONO); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('TASK: CODING DEMO', -370, 2);
    g.restore();
    /* three tickets, each typed and stacked a step lower so every line stays readable; each sends back a bigger print */
    var TXT = ['CLICK (PHOTO 4)', 'CLICK (PHOTO 5)', 'CLICK (PHOTO 6)'], KIND = ['geyser', 'spring', 'pines'], NUM = ['4', '5', '6'];
    var FAN = [{ x: 345, y: 1046, r: -.1 }, { x: 720, y: 1046, r: .085 }, { x: 540, y: 1026, r: -.01 }];
    var drift = Math.sin(t * 1.2) * .004;
    for (var k = 0; k < 3; k++) {
      if (t < K[k] - .2) continue;
      var ty = YT.y + k * YT.dy, rv = eout(seg(t, K[k] - .2, K[k] + .02));
      var n = Math.floor(TXT[k].length * seg(qt(t), K[k], K[k] + .45) + 1e-6);
      ticket(g, CX, ty, YT.s, TXT[k], n, { reveal: rv, rot: (k - 1) * .008 });
      if (t < K[k] + .55) caret(g, typeX(CX, YT.s, TXT[k], n) + 7, ty + TTY * YT.s, 44, t, true, rv, INK);
    }
    /* prints 4 and 5 come back right after their tickets; print 6 lands on the paper pop in the pause after "photos" */
    for (k = 0; k < 3; k++) {
      var q = k < 2 ? eout(seg(t, K[k] + .45, K[k] + .85)) : eout(seg(t, POP - .3, POP)); if (q <= 0) continue;
      var F = FAN[k];
      print(g, lerp(CX, F.x, q), lerp(YT.y + k * YT.dy + 40, F.y, q), lerp(.3, 1.32, q), lerp(0, F.r, q) + drift, KIND[k], q > .9 ? NUM[k] : null);
    }
    tag(g, 'RE-CREATED', CX, 1252, cred(fin(t, S('yellowstone').t0 - .1)), -.01);
    var qa = cred(fin(t, S('yellowstone').t0 - .2));
    txt(g, '“…began to peruse photos of', CX, 1308, 46, CREAM, 'center', 700, DISP, 820, qa);
    txt(g, 'Yellowstone National Park.”', CX, 1362, 46, CREAM, 'center', 700, DISP, 820, qa);
    txt(g, 'ANTHROPIC, OCT 22, 2024', CX, 1418, 38, CREAM, 'center', 700, DISP, 820, qa);
  }

  /* =====================================================================================================
     SCENE 4 · ask first + end: the frame-0 email card returns; the caret types CLICK (SEND); the ticket heads for the
     box and a coral gate drops in front of it on "ask you": ASK FIRST · BUY · SEND, a paper thumb, YES / NO.
     ===================================================================================================== */
  var YK = [.5, 1.0, 1.38].map(function (d) { return start('yellowstone') + d; }), YT = { y: 712, dy: 72, s: .7 };
  var GA = { x: 765, y: 830, w: 320, h: 360 };
  function gateScene(g, t) {
    var a0 = S('ask_first').t0, bf = at('ask_first', 'before'), sends = wend('ask_first', 'sends'), meant = at('ask_first', 'meant'), ask = at('ask_first', 'ask');
    var ys = at('yn', 'yes'), no = at('yn', 'no');
    var ex = 330, ey = 720, es = .62;
    emailCard(g, ex, ey, es);
    var cw = Math.sin(t * 7) * 3, ch2 = Math.cos(t * 5.3) * 2;
    cursorArrow(g, ex + EC.bx * es - 6 + cw, ey + EC.by * es - 8 + ch2, 1.05);
    box(g, 790, 770, 1, 0, {});
    /* the ticket: typed, then heads right and waits behind the gate */
    /* typed fast, then it slides off toward the box and keeps creeping until the gate lands in front of it */
    var TXS = 'CLICK (SEND)', s = TL.s, ty0 = GTY.t0, ty1 = GTY.t1, n = Math.floor(TXS.length * seg(qt(t), ty0, ty1) + 1e-6);
    var LAND = GT.gate, go = eout(seg(t, ty1 + .05, GTY.slide)), cr = seg(t, GTY.slide, LAND), bump = Math.max(0, knock(t, LAND, 18, 9)) * 8;
    var kx = lerp(380, 430, go) + 20 * cr * (2 - cr) - bump, ky = lerp(1086, 1022, go) - 18 * cr;
    ticket(g, kx, ky, s, TXS, n, { rot: -.02 * go });
    var typing = t < ty1 + .05;
    var cx = typing ? typeX(380, s, TXS, n) + 8 : 152, cy = typing ? 1086 + TTY * s : 1086, chh = typing ? 46 : 120;
    var ck = eio(seg(t, ty1 + .05, ty1 + .35));
    if (!typing) { cx = lerp(typeX(380, s, TXS, TXS.length) + 8, 152, ck); cy = lerp(1086 + TTY * s, 1086, ck); chh = lerp(46, 120, ck); }
    caret(g, cx, cy, chh, t, typing || ck < 1, null, (typing || ck < .5) ? INK : CREAM);
    /* the gate: a coral flap that swings down from its top edge (never above y 650) and lands with the cardboard thump */
    var fu = seg(t, LAND - .3, LAND), sy = t < LAND ? fu * fu : 1 + Math.max(-.03, Math.min(.03, knock(t, LAND, 20, 8) * -.03));
    if (fu > 0) {
      var r = mulberry(61), top = GA.y - GA.h / 2;
      g.save(); g.translate(GA.x, top); g.scale(1, Math.max(.001, sy)); g.translate(0, GA.h / 2);
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-GA.w / 2 + 10, -GA.h / 2 + 14, GA.w, GA.h);
      g.fillStyle = HOT; cut(g, [[-GA.w / 2, -GA.h / 2], [GA.w / 2, -GA.h / 2], [GA.w / 2, GA.h / 2], [-GA.w / 2, GA.h / 2]], r, 2.5);
      g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, 84, 900);
      g.fillText('ASK', 0, -112); g.fillText('FIRST', 0, -28);
      font(g, 40, 800); g.fillText('BUY · SEND', 0, 48);
      var yk = function (w) { return 1 + .06 * Math.sin(Math.PI * seg(t, w - .06, w + .3)); };
      [['YES', -74, ys], ['NO', 74, no]].forEach(function (c) {
        var on = fin(t, c[2] - .08);
        chip(g, c[0], c[1], 122, { px: 44, wt: 900, line: BG, lw: 4, fg: BG, w: 128, r: 30, shadow: false, a: 1 - on });
        chip(g, c[0], c[1], 122, { px: 44, wt: 900, bg: BG, fg: HOT, w: 128, r: 30, shadow: false, a: on, s: yk(c[2]) });
      });
      /* a paper thumb holding the gate's left edge */
      g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, -GA.w / 2 - 52 + 5, -10 + 7, 82, 44, 22); g.fill();
      g.fillStyle = SKIN; rr(g, -GA.w / 2 - 52, -10, 82, 44, 22); g.fill();
      g.fillStyle = '#f3d9c4'; rr(g, -GA.w / 2 + 2, -4, 26, 30, 10); g.fill();
      g.fillStyle = SKIN_D; g.fillRect(-GA.w / 2 - 22, -10, 4, 44);
      g.restore();
    }
    var sa = cred(fin(t, S('ask_first').t0 + .05));
    void ask; void meant; void bf;
    txt(g, 'GOOGLE: CONFIRMATION REQUIRED', CX, 1228, 40, CREAM, 'center', 800, DISP, 820, sa);
    txt(g, 'FOR PURCHASES', CX, 1278, 40, CREAM, 'center', 800, DISP, 820, sa);
    txt(g, 'OPENAI: KEEP USERS IN CONTROL', CX, 1346, 40, CREAM, 'center', 800, DISP, 820, sa);
    void a0;
  }

  /* ---------- captions: the narrator's words, one block at a time; only stressed words get the coral pill ---------- */
  var CAPBRK = { guesser: ['nextword'] }, NOSPLIT = { loop: 1 };
  var CAPS = (function () {
    var out = [];
    VO.lines.forEach(function (l) {
      if (l.id === 'hook') return;   /* frame 0 carries the hook's own 4 words */
      var brk = (CAPBRK[l.id] || []).slice(), cur = [], ws = l.words;
      ws.forEach(function (w, i) {
        if (cur.length && brk.length && norm(w.w) === brk[0]) { out.push(cur); cur = []; brk.shift(); }
        cur.push(w);
        if (!NOSPLIT[l.id] && /[.?!:]$/.test(w.w) && i < ws.length - 1) { out.push(cur); cur = []; }
      });
      if (cur.length) out.push(cur);
    });
    return out.map(function (ws) { return { t0: ws[0].t0, s: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws }; });
  })();
  /* the Yellowstone caption holds until the torn edge is half way up, then the ask_first caption takes over at once */
  (function () {
    var tear = S('ask_first').t0 - SWIPE / 2;
    for (var i = 0; i < CAPS.length; i++) if (Math.abs(CAPS[i].t0 - start('ask_first')) < .02) { CAPS[i].s = Math.max(CAPS[i].t0, tear); CAPS[i].cut = true; }
  })();
  var STRESS = [['ask', 'agent'], ['guesser', 'guesser'], ['action', 'actions'], ['action', 'click'], ['trick', 'trick'], ['trick', 'cant'],
    ['runs', 'clicks'], ['runs', 'screenshot'], ['loop', 'think'], ['loop', 'act'], ['loop', 'look'], ['wrong', 'guess'],
    ['yellowstone', 'yellowstone'], ['ask_first', 'ask'], ['yn', 'yes'], ['yn', 'no']]
    .map(function (p) { return at(p[0], p[1], p[2]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function wipeHide(t) {
    var a = 1; SC.forEach(function (sc) { if (sc.swipe && !sc.noHide) a = Math.min(a, 1 - seg(t, sc.t0 - SWIPE, sc.t0 - SWIPE + .1) * (1 - seg(t, sc.t0 + .02, sc.t0 + .14))); });
    return a;
  }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, over: 1, that: 1, up: 1, own: 1, is: 1, it: 1 };
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= c.s - (c.cut ? 0 : .04)) { card0 = c; ci = i; } });
    if (!card0) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.s - .04 : 1e9, o1 = Math.min(card0.t1 + .5, ns - .12), o0 = Math.min(card0.t1 + .35, o1 - .12);
    var fi = card0.cut ? 1 : seg(t, card0.s - .04, card0.s + .06), out = nx && nx.cut ? 1 : 1 - seg(t, o0, o1);
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
    var lh = cpx * 1.18, y0 = (lines.length > 1 ? 362 : 402) + 50 - (lines.length - 1) * lh / 2;   /* pill tops at y ≥ 304 */
    g.globalAlpha = fi * out * wipeHide(t) * (alpha == null ? 1 : alpha);
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 30;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .15;
        if (cur) { g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 12, y - cpx * .87, ws[i] + 24, cpx * 1.15, 18); g.fill(); }
        g.fillStyle = cur ? BG : CREAM;
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SCENES = { hook: function (g, t) { hookScene(g, t, false); }, mach: machScene, ys: ysScene, gate: gateScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) { g.save(); SCENES[Sc.fn](g, t); g.restore(); }
  /* the cut: a torn-paper edge rising from the bottom along one axis, the next scene drawn under it */
  function edgeY(x, ly, t) { var i = Math.round(x / 30); return ly + (i % 2 ? -10 : 8) + Math.sin(x * .013 + t * 5) * 4; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var si = sceneAt(t), Sc = SC[si], Nx = SC[si + 1];
    var sk = Nx && Nx.swipe ? eio(seg(t, Nx.t0 - SWIPE, Nx.t0)) : 0;
    var pre = Sc.swipe && !Sc.live && t < Sc.t0 + PRE;
    drawScene(g, Sc, pre ? Sc.t0 + PRE : t);
    if (sk > 0) {
      var ly = H * (1 - sk) - 20, x;
      g.save(); g.beginPath(); g.moveTo(0, H); for (x = 0; x <= W; x += 30) g.lineTo(x, edgeY(x, ly, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; drawScene(g, Nx, Nx.live ? t : Nx.t0 + PRE); INCOMING = false; g.restore();
      g.save(); g.strokeStyle = HOT; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); for (x = 0; x <= W; x += 30) { var yy = edgeY(x, ly, t); if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); g.restore();
    }
    /* the loop: the torn edge rises right after "no" and lands on the frame-0 picture (no dissolve) */
    var back = eio(seg(t, GT.home, GT.home + .26));
    if (back > 0) {
      var by = H * (1 - back) - 20, bx;
      g.save(); g.beginPath(); g.moveTo(0, H); for (bx = 0; bx <= W; bx += 30) g.lineTo(bx, edgeY(bx, by, t)); g.lineTo(W, H); g.closePath(); g.clip();
      stage(g); INCOMING = true; hookScene(g, 0, true); hookText(g, 0, true); INCOMING = false; g.restore();
      if (back < 1) { g.save(); g.strokeStyle = HOT; g.lineWidth = 8; g.lineJoin = 'round'; g.beginPath(); for (bx = 0; bx <= W; bx += 30) { var yb = edgeY(bx, by, t); if (bx === 0) g.moveTo(bx, yb); else g.lineTo(bx, yb); } g.stroke(); g.restore(); }
    }
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) {
      if (t < S('guesser').t0) hookText(g, t, false);
      captions(g, t, back > 0 ? 1 - back : 1);
    }
    if (!POSTERMODE) {
      g.fillStyle = 'rgba(244,237,224,.12)'; g.fillRect(90, 222, 840, 6);
      g.fillStyle = HOT; g.fillRect(90, 222, 840 * (back > 0 ? 1 - back : t / DUR), 6);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false;
  function posterTitle(g) {
    var a = 'What an AI agent', b = 'actually is', px = 84;
    g.save(); font(g, px, 800); g.textBaseline = 'alphabetic';
    while ((g.measureText(b).width + 28 > 840 || g.measureText(a).width > 840) && px > 52) { px -= 2; font(g, px, 800); }
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText(a, CX, 380);
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 14, 476 - 76, wb + 28, 100, 16); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 476); g.restore();
  }
  /* a text at height y stays readable until the torn edge rising from the bottom reaches it */
  function cutY(id, y) {
    var sc = S(id), need = 1 - (y + 60) / H, u = 0;
    while (u < 1 && eio(u) < need) u += .01;
    return sc.t0 - SWIPE + SWIPE * u;
  }
  function TEXTS(t) {
    var out = [];
    function T(id, text, a, b) { if (t >= a && t < b) out.push({ id: id, text: text, x0: 0, y0: 0, x1: 0, y1: 0 }); }
    T('hook', 'NOBODY TOUCHED THE MOUSE', 0, cutY('guesser', 588));
    T('ill', 'OUR ILLUSTRATION', .72, cutY('guesser', 1166));
    T('ngg', 'NEXT-WORD GUESSER', M.gs + .4, M.act + .25);
    T('p1', 'HOW AI WORKS · PART 1', M.gs + .4, M.act + .25);
    T('cat', 'THE CAT SAT ON THE', M.g0 + PRE, M.act - .06);
    T('mat', 'MAT', M.mat + .25, M.act - .06);
    T('task', 'TASK: FILL OUT THIS FORM', M.act + .3, M.r0 - .25);
    T('tk', TK, M.here + .1, cutY('yellowstone', 760));
    T('cp', 'COUNTS PIXELS · ANTHROPIC, 2024', M.here + .13, M.clicks + .2);
    T('just', 'JUST TEXT', GT.slam + .2, cutY('yellowstone', 760));
    T('os', 'OTHER SOFTWARE', M.clicks + .82, cutY('yellowstone', 1118));
    T('ss', 'SCREENSHOT', M.shot + .3, cutY('yellowstone', 1132));
    T('think', 'THINK', M.think + .15, cutY('yellowstone', 816));
    T('act', 'ACT', M.actW + .15, cutY('yellowstone', 672));
    T('look', 'LOOK', M.look + .15, cutY('yellowstone', 1066));
    T('react', 'THE LOOP · REACT, YAO ET AL., 2022', M.think + .32, cutY('yellowstone', 1352));
    T('tao', '“thought-action-observation”', M.think + .32, cutY('yellowstone', 1406));
    T('okt', 'CLICK (OK)', M.tk[0] + .3, cutY('yellowstone', NT.y));
    T('g1', 'GUESS', M.tk[0] + .5, cutY('yellowstone', NT.y - 70));
    var y0 = S('yellowstone').t0, a0 = S('ask_first').t0;
    T('cdemo', 'TASK: CODING DEMO', cutY('yellowstone', 600) + .1, cutY('ask_first', 600));
    T('ph4', 'CLICK (PHOTO 4)', YK[0] + .5, cutY('ask_first', YT.y));
    T('ph5', 'CLICK (PHOTO 5)', YK[1] + .5, cutY('ask_first', YT.y + YT.dy));
    T('ph6', 'CLICK (PHOTO 6)', YK[2] + .5, cutY('ask_first', YT.y + 2 * YT.dy));
    T('rec', 'RE-CREATED', y0 + .05, cutY('ask_first', 1252));
    T('q1', '“…began to peruse photos of', y0 + .05, cutY('ask_first', 1308));
    T('q2', 'Yellowstone National Park.”', y0 + .05, cutY('ask_first', 1362));
    T('qc', 'ANTHROPIC, OCT 22, 2024', y0 + .05, cutY('ask_first', 1418));
    var ask = at('ask_first', 'ask');
    T('send', 'CLICK (SEND)', GTY.t1 + .1, GT.home);
    T('askf', 'ASK FIRST', GT.gate + .1, GT.home);
    T('buy', 'BUY · SEND', GT.gate + .1, GT.home);
    var sd = wend('ask_first', 'sends');
    T('g18', 'GOOGLE: CONFIRMATION REQUIRED', a0 + .2, GT.home);
    T('g18b', 'FOR PURCHASES', a0 + .2, GT.home);
    T('oai', 'OPENAI: KEEP USERS IN CONTROL', a0 + .2, GT.home);
    void sd;
    T('yes', 'YES', GT.gate + .1, GT.home);
    T('no', 'NO', GT.gate + .1, GT.home);
    void a0;
    return out;
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
  var BODY = { tick: .04, pop: .12, thump: .16 };
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m || .19).forEach(function (f) {
      var lo = f[0], hi = f[1] - body; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  /* Three hits, nothing else: a soft paper tick before "Nobody" (only if the gate leaves room), THE stamp after
     "anything" and a paper pop after "photos". */
  var GT = {}, GS = [];
  function G(id, t, type, tol, gain, m) {
    var n = nearGap(t, type, m);
    if (n !== null && Math.abs(n - t) <= (tol || .45)) { GT[id] = n; GS.push({ t: n, type: type, g: gain }); return true; }
    GT[id] = t; return false;
  }
  function initGaps() {
    var w0 = LINE.hook.words[0].t0;
    /* no tick before "Nobody": unhinted Whisper puts the word at 0.00 s, so no hit fits before it (BRIEF §0) */
    G('slam', wend('trick', 'anything') + .4, 'thump', .5, .1, .24);
    if (GT.slam < wend('trick', 'anything') + .05) GT.slam = wend('trick', 'anything') + .2;
    var tail = wend('yellowstone', 'photos'); VOICED.forEach(function (v) { if (v.t0 < start('ask_first') - .1 && v.t1 > tail) tail = v.t1; });
    G('pop', Math.max(wend('yellowstone', 'photos') + .3, tail + .2), 'pop', .45, .22, .19);
    if (GT.pop < tail + .18) GT.pop = tail + .18;
    /* the gate's cardboard thump: in the gap after "ask you", before "Would" */
    if (!G('gate', wend('ask_first', 'you') + .45, 'thump', .3, .07, .19)) GT.gate = wend('ask_first', 'you') + .2;
    GT.home = DUR - .3;
  }
  var GTY = { t0: start('ask_first') + .7, t1: start('ask_first') + 1.2, slide: start('ask_first') + 1.75 };
  function initTimes() {
    GS.forEach(function (e) { EV.push({ t: e.t, type: e.type, g: e.g, k: e.t === GT.gate ? 'card' : 'stamp' }); });
    EV.forEach(function (e) { if (e.type === 'thump') e.t1 = e.t + (e.k === 'card' ? .13 : BODY.thump); });
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
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.1), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .16; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function band(t0, t1, f0, f1, g0, g1, q, pan, send) { var o = bus(1, send == null ? .1 : send, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    /* THE hit: a rubber stamp slammed on a paper ticket on a desk. A 260 → 190 Hz body and a 330 Hz knock (where a
       phone speaker plays), and a short paper slap on top */
    function stampThump(t, g) {
      g = g || 1;
      var o = osc('sine', 260, t, t + .15, 1, [[t, 0], [t + .004, .62 * g], [t + .14, 0]], .06); o.frequency.exponentialRampToValueAtTime(190, t + .13);
      osc('triangle', 330, t, t + .07, 1, [[t, 0], [t + .002, .4 * g], [t + .06, 0]], .03);
      var n = noise(t, .08), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = .9; var ob = bus(1, .08); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .003, .16 * g], [t + .06, 0]]);
    }
    /* the gate landing: a cardboard flap on a desk, a 245 → 190 Hz body and a dull 320 Hz knock, a little card noise */
    function cardThump(t, g) {
      g = g || 1;
      var o = osc('sine', 245, t, t + .13, 1, [[t, 0], [t + .005, .6 * g], [t + .12, 0]], .05); o.frequency.exponentialRampToValueAtTime(190, t + .12);
      osc('triangle', 320, t, t + .06, 1, [[t, 0], [t + .003, .25 * g], [t + .05, 0]], .02);
      var n = noise(t, .07), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 1.1; var ob = bus(1, .05); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .004, .12 * g], [t + .06, 0]]);
    }
    /* a paper pop: a print snapped flat on the table, short and dry */
    function popS(t, g) {
      g = g || 1; var o = osc('sine', 420, t, t + .1, 1, [[t, 0], [t + .003, .22 * g], [t + .09, 0]], 0); o.frequency.exponentialRampToValueAtTime(260, t + .08);
      band(t, t + .06, 1600, 2600, .07 * g, .01, 1.2, 0, 0);
    }
    /* a soft paper tick: a fingernail on card */
    function tickS(t, g) { g = g || 1; band(t, t + .035, 2400, 3200, .05 * g, .01, 1.6, 0, 0); osc('sine', 900, t, t + .03, 1, [[t, 0], [t + .002, .03 * g], [t + .028, 0]], 0); }
    EV.forEach(function (e) {
      if (e.type === 'thump' && e.k === 'card') cardThump(e.t, e.g);
      else if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'tick') tickS(e.t, e.g);
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”·→…#?‹✓✕–@!>$(),:'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initGaps();
  initTimes();
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.min(M.hold0 + .3, M.hold1 - .1), SLUG: 'agent', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, M: M, GT: GT };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
