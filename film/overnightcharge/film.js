/* "Your phone doesn't charge all night." — Factory #32 (overnightcharge) on Tech, explained, after ../darkmode/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   One night on a nightstand, all cut paper: the phone and a tall charge column (a glass that fills like a glass of water,
   a brass peg at its 80 tick). Heat half: a pillow flops onto the phone and the HEAT thermometer's bulb goes coral (fail);
   top-down, a paper hand pulls it into the open and the hot case drops (pass). Hours half: the wide room's window shows
   the night passing; the fill clunks onto the 80 peg and sits there, then at dawn the peg swings aside and the fill
   slaps the top (the hero). Coral only on the low point, the top slap, frame 0's "?" and YES / NO.
   Props stay whole inside the safe box x 92–928, y 302–1428; backgrounds bleed full width. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#121821', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f3ecdf', INK = '#211d26';
  var SLATE = '#3a4452', SLATE2 = '#2e3744';
  var CASE = '#2c2621', CASE2 = '#463b31', BRASS = '#d8b25c', BRASS2 = '#a8843a', GLOW = '#f1cf6b', LAMP = '#fbe9b4', SKIN = '#e2c3a0';
  var PHB = '#2a313d', SCRW = '#f6f1e6', BAND1 = '#55627a';
  var DISP = 'Archivo', MONO = '"Geist Mono"';
  var SAFE_BOX = { x0: 92, y0: 302, x1: 928, y1: 1428 };

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function eout(k) { return 1 - Math.pow(1 - k, 3); }
  function sio(k) { return .5 - .5 * Math.cos(Math.PI * clamp(k, 0, 1)); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .85); }
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .85), 0, 1.04); }
  function fin(t, a, f) { return clamp(sp(t, a, f || 3) * 2, 0, 1); }
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }   /* a displayed number follows the frame the renderer samples */

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) {
    /* the aligner splits "32°F?" into "32°" + "F?": one word on screen and in the keys */
    var ws = []; l.words.forEach(function (w) { var p = ws[ws.length - 1]; if (p && /°$/.test(p.w) && /^F/.test(w.w)) { p.w += w.w; p.t1 = w.t1; } else ws.push({ w: w.w, t0: w.t0, t1: w.t1 }); });
    l.words = ws; LINE[l.id] = l;
  });
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

  /* the hits are placed from the heard words before anything is timed off them (see the SFX gate below) */
  var EDGES = window.HEARD_EDGES || [], VOICED = window.VOICED || [];
  var lastE = EDGES.length ? Math.max.apply(null, EDGES) : -1;
  VO.lines.forEach(function (l) { if (l.t0 > lastE + .3) l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 + .15 }); EDGES.push(w.t0, w.t1 + .15); }); });
  function voiceEnd(id, before) { var e = lend(id); VOICED.forEach(function (v) { if (v.t0 < lend(id) + .3 && v.t1 > e && v.t1 < before) e = v.t1; }); return e; }
  var BODY = { thump: .2, knock: .14, slap: .1, paper: .17, pop: .12, tick: .05, click: .06, swish: .21, rip: .24, marker: .3 };
  var GT = {};
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }
  BODY.buzz = .2; BODY.rattle = .26;
  BODY.buzz = .2; BODY.clink = .1; BODY.click = .06;
  var K = {
    your: start('hook'), dsnt: at('hook', "doesn't"), hnight: at('hook', 'night'), hookEnd: lend('hook'),
    ask: start('ask'), ruin: at('ask', 'ruin'), askEnd: lend('ask'),
    wear: start('wear'), wearW: at('wear', 'wear'), heat: at('wear', 'heat'), hours: at('wear', 'hours'), wfull: at('wear', 'full'), wearEnd: lend('wear'),
    pillow: start('pillow'), pil: at('pillow', 'pillow'), pheat: at('pillow', 'heat'), trapped: at('pillow', 'trapped'), pilEnd: lend('pillow'),
    dip: start('dip'), damage: at('dip', 'damage'), good: at('dip', 'good'), dipEnd: lend('dip'),
    open: start('open'), openW: at('open', 'open'), out: at('open', 'out'), hot: at('open', 'hot'), caseW: at('open', 'case'), openEnd: lend('open'),
    night: start('night'), n11: at('night', '11'), plugged: at('night', 'plugged'), nightEnd: lend('night'),
    pause: start('pause'), n80: at('pause', '80'), n80e: wend('pause', '80'), stop: at('pause', 'stop'), pauseEnd: lend('pause'),
    learn: start('learn'), routine: at('learn', 'routine'), learnEnd: lend('learn'),
    full: start('full'), fills: at('full', 'fills'), before: at('full', 'before'), unplug: at('full', 'unplug'), fullEnd: lend('full'),
    check: start('check'), settings: at('check', 'settings'), battery: at('check', 'battery'), checkEnd: lend('check'),
    end: start('end'), wait: at('end', 'wait'), yes: at('end', 'yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  (function () {
    place('hk', 'click', K.hookEnd + .15, .16, K.hookEnd, K.ask);                          /* the lamp's pull cord */
    place('pw', 'thump', voiceEnd('pillow', K.dip) + .08, .2, K.pilEnd, K.dip - .32);            /* the pillow settles: a soft whump */
    place('dp', 'thump', K.dipEnd + .52, .16, K.dipEnd, K.open - .15);   /* late in the gap, past the dip's duck release, so it is not counted as bed under the voice */         /* the low point: the bulb goes coral */
    place('fl', 'paper', voiceEnd('open', K.night) + .06, .16, K.openEnd, K.night - .3);     /* the hot case lands */
    place('ck', 'knock', voiceEnd('pause', K.learn) + .06, .16, K.pauseEnd, K.learn);        /* the fill clunks onto the 80 peg */
    place('sl', 'slap', K.fullEnd + .42, .16, K.fullEnd, K.check - .7);       /* clear of the phantom word Whisper sometimes hears in the hold */      /* THE hit: the fill slaps the top */
  })();
  var TW = .5;
  K.HK = GT.hk != null ? GT.hk : K.hookEnd + .15;
  K.PW = GT.pw != null ? GT.pw : K.pilEnd + .15;
  K.DP = GT.dp != null ? GT.dp : K.dipEnd + .15;
  K.FL = GT.fl != null ? GT.fl : K.openEnd + .15;
  K.CK = GT.ck != null ? GT.ck : K.pauseEnd + .15;
  K.SL = GT.sl != null ? GT.sl : K.fullEnd + .15;
  var SC = [
    { id: 'stand', fn: 'standScene', name: 'Charging all night? Heat and hours at 100%', t0: 0 },
    { id: 'bed', fn: 'bedScene', name: 'Under a pillow, the heat gets trapped', t0: K.pillow - .05 },
    { id: 'top', fn: 'topScene', name: 'In the open, out of a hot case', t0: K.open + .5 },
    { id: 'room', fn: 'roomScene', name: 'One night: it stops at 80, then fills before you unplug', t0: K.night + .3 },
    { id: 'set', fn: 'setScene', name: 'Settings, then Battery', t0: K.check + .37 },
    { id: 'end', fn: 'endScene', name: 'Is your phone set to wait?', t0: K.wait - .4, cut: true }
  ];

  var SHOTS;
  var TEND = Math.round(DUR * 30) / 30;                    /* frame 0 of the next loop sits at TEND */

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- measuring: the safe area (BOUNDS_RUN), what is readable (TEXTS → readcheck) and labels vs props (LABELS_RUN) ---------- */
  var BOUNDS = null, REC = null, PROPS = null, LBL = null, CURT = 0, NOREC = false, EXITING = false, ONPROP = false, CHIPBOX = null;
  var SAFE = { x0: 95, x1: 925, y1: 1450 };
  function xbox(g, x0, y0, x1, y1) {
    var m = g.getTransform(), xs = [], ys = [];
    [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].forEach(function (p) { xs.push(m.a * p[0] + m.c * p[1] + m.e); ys.push(m.b * p[0] + m.d * p[1] + m.f); });
    return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
  }
  function recBound(g, b, text) {
    if (!BOUNDS || EXITING || (g !== ctx && g !== tctx) || g.globalAlpha < .05) return;
    if (b[2] < SAFE_BOX.x0 || b[0] > SAFE_BOX.x1 || b[1] > SAFE_BOX.y1 || b[3] < SAFE_BOX.y0) return;   /* fully outside the scene clip: never drawn */
    if (b[0] < SAFE.x0 - .5 || b[2] > SAFE.x1 + .5 || b[3] > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(b[0]), x1: Math.round(b[2]), y1: Math.round(b[3]) });
  }
  function recBox(g, x0, y0, x1, y1, text) { if (BOUNDS) recBound(g, xbox(g, x0, y0, x1, y1), text); }
  function prop(g, name, x0, y0, x1, y1) {
    if (!PROPS || EXITING || (g !== ctx && g !== tctx)) return;
    PROPS.push({ name: name, b: xbox(g, x0, y0, x1, y1) });
  }
  function seen(g, text, b) {
    var vis = !NOREC && !EXITING && g.globalAlpha >= .95 && (g === ctx || g === tctx) && b[3] > SAFE_BOX.y0 && b[1] < SAFE_BOX.y1;
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
  /* setting ctx.font resets fontStretch (gta-lucia): the stretch is applied after every font change */
  function font(g, px, wt, fam, st) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); try { g.fontStretch = st || 'normal'; } catch (e) {} }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2))); }
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
  function poly(g, P) { g.beginPath(); P.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); }
  function el(g, x, y, rx, ry, rot) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, 6.283); g.fill(); }
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
    font(g, px, o.wt, o.fam, o.st); ls(g, o.ls || 0);
    var tw0 = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad;
    while (o.maxw && tw0 + pad * 2 > o.maxw && px > 36) { px -= 2; font(g, px, o.wt, o.fam, o.st); tw0 = g.measureText(text).width; pad = o.pad == null ? px * .32 : o.pad; }
    var w = o.w || tw0 + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg || o.line) recBox(g, -w / 2, -h / 2, w / 2, h / 2, '[chip] ' + text);
    if (o.bg) { if (o.shadow !== false) { rr(g, -w / 2 + 6, -h / 2 + 9, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); } rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    font(g, px, o.wt, o.fam, o.st);
    CHIPBOX = (o.bg || o.line) && LBL ? xbox(g, -w / 2, -h / 2, w / 2, h / 2) : null;
    g.fillText(text, 0, px * .04); CHIPBOX = null; g.restore(); ls(g, 0);
    return w;
  }
  /* one line of type, shrunk to fit maxw; never under 36 px unless asked */
  function txt(g, text, x, y, px, col, align, wt, fam, maxw, a, minpx, st) {
    a = a == null ? 1 : a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 900, fam, st); ls(g, 0);
    while (maxw && g.measureText(text).width > maxw && px > (minpx || 36)) { px -= 2; font(g, px, wt || 900, fam, st); }
    g.fillStyle = col || CREAM; g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillText(text, x, y); g.restore();
  }
  /* quiet tags (RE-CREATED): an outline, never coral */
  function tag(g, text, x, y, a, rot, maxw, col, bg, px) { chip(g, text, x, y, { px: px || 36, wt: 700, fam: MONO, line: col || CREAM, lw: 3, fg: col || CREAM, a: a, rot: rot == null ? .01 : rot, shadow: false, bg: bg || 'rgba(16,22,28,.9)', maxw: maxw || 820 }); }
  function onprop(fn) { var o = ONPROP; ONPROP = true; fn(); ONPROP = o; }

  /* ---------- the rubber stamp: worn ink (seeded speckle), slammed; condensed caps like a real rubber stamp ---------- */
  var STEX = {};
  function stampTex(text, col, px, speck) {
    speck = speck == null ? 1 : speck;
    var key = text + col + px + speck; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900, DISP, 'extra-condensed'); ls(m, 2);
    var TL = text.split('\n'), lw = Math.max.apply(null, TL.map(function (s) { return m.measureText(s).width; })), pad = px * .3, h = px * (1.05 * TL.length + .2), w = lw + pad * 2, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(4, px * .085); rr(g, 2, 2, w - 4, h - 4, px * .14); g.stroke();
    g.lineWidth = Math.max(2, px * .03); rr(g, px * .14, px * .14, w - px * .28, h - px * .28, px * .08); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle'; font(g, px, 900, DISP, 'extra-condensed'); ls(g, 2); TL.forEach(function (s, i) { g.fillText(s, w / 2, h / 2 + px * .05 + (i - (TL.length - 1) / 2) * px * 1.02); });
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 140 * speck);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .3 + r() * .6; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.7, 0, 6.283); g.fill(); }
    c.w = w + 16; c.h = h + 16; c.lines = TL; c.px = px; STEX[key] = c; return c;
  }
  /* full opacity from its first frame; only the size settles (1.3 → 1 in 0.1 s) */
  function stamp(g, text, x, y, t, t0, px, col, rot, speck) {
    if (t < t0) return;
    var c = stampTex(text, col, px, speck);
    var k = eout(seg(t, t0, t0 + .1)), s = lerp(1.3, 1, k);
    g.save(); g.translate(x, y); g.rotate(rot == null ? -.05 : rot); g.scale(s, s);
    var oldP = ONPROP; ONPROP = true;
    if (k >= 1) recBox(g, -c.w / 2, -c.h / 2, c.w / 2, c.h / 2, text.replace(/\n/g, ' '));
    c.lines.forEach(function (s2, i) { var ly = (i - (c.lines.length - 1) / 2) * c.px * 1.02; seen(g, s2, xbox(g, -c.w / 2, ly - c.px * .55, c.w / 2, ly + c.px * .55)); });
    g.drawImage(c, -c.w / 2, -c.h / 2); ONPROP = oldP; g.restore();
  }

  /* =====================================================================================================
     PROPS (all paper, all drawn by hand)
     ===================================================================================================== */
  function grainIn(g, x0, y0, w, h, seed, k) {
    var r = mulberry(seed), n = Math.floor(w * h / 160);
    g.save(); g.clip();
    for (var i = 0; i < n; i++) { g.fillStyle = r() < .5 ? 'rgba(0,0,0,' + (.09 * (k || 1)) + ')' : 'rgba(255,255,255,' + (.10 * (k || 1)) + ')'; g.fillRect(x0 + r() * w, y0 + r() * h, 1.6 + r() * 1.8, 1.6 + r() * 1.8); }
    g.restore();
  }
  function sheet(g, x0, y0, x1, y1, seed, col, name) {
    g.fillStyle = 'rgba(0,0,0,.38)'; g.fillRect(x0 + 8, y0 + 11, x1 - x0 - 8, y1 - y0 - 11);
    g.fillStyle = col || PAPER; cut(g, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], mulberry(seed), 1.3);
    g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); grainIn(g, x0, y0, x1 - x0, y1 - y0, seed + 1, .9);
    prop(g, name || 'sheet', x0, y0, x1, y1);
  }
  function drift(t, ph, k) { return 7 * Math.sin(t * 1.9 + ph) * (k == null ? 1 : k); }
  function frac(x) { return x - Math.floor(x); }

  /* a quote strip: opaque paper, the source's words line by line, a credit line, RE-CREATED; `out` (0..1) peels it off
     to the left (it lifts, tilts and drops, never fades) and `inn` (0..1) slides it in from the right */
  function quote(g, x0, y0, w, lines, px, credit, seed, inn, out, retag) {
    if (inn <= 0 || out >= 1) return;
    var ex0 = EXITING, lh = px * 1.16, h = 34 + lines.length * lh + 58;
    var ei = eout(clamp(inn, 0, 1)), eo = eio(clamp(out, 0, 1));
    g.save();
    if (ei < 1) { g.translate(110 * (1 - ei), 0); g.globalAlpha *= seg(ei, 0, .7); EXITING = true; }
    if (eo > 0) { EXITING = true; g.translate(x0, y0 + h); g.rotate(-.08 * eo); g.translate(-x0, -(y0 + h)); g.translate(-60 * eo, 50 * eo); g.globalAlpha *= 1 - eo; }
    sheet(g, x0, y0, x0 + w, y0 + h, seed, PAPER, 'quote');
    onprop(function () {
      lines.forEach(function (L, i) { txt(g, L, x0 + 30, y0 + 22 + lh * (i + .5), px, INK, 'left', 700, DISP, w - 60, 1, Math.min(px, 40), 'condensed'); });
      txt(g, credit, x0 + 30, y0 + h - 30, 36, '#5d564c', 'left', 800, DISP, retag === false ? w - 60 : w - 250, 1, 36, 'condensed');
    });
    if (retag !== false) tag(g, 'RE-CREATED', x0 + w - 118, y0 + h - 32, 1, 0, 200, INK, PAPER, 30);
    EXITING = ex0;
    g.restore();
    return h;
  }
  function decay(t, t0, f, k) { if (t < t0) return 0; var dt = t - t0; return Math.sin(dt * f) * Math.exp(-dt * k); }
  function lerpPose(a, b, k) { return { cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), s: lerp(a.s, b.s, k), rot: lerp(a.rot || 0, b.rot || 0, k) }; }
  function mixc(a, b, k) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(lerp(a[i], b[i], clamp(k, 0, 1))); }).join(',') + ')'; }
  function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  var PW = 420, PHH = 820, SX = 190, SY = 390;
  function phone(g, P, o) {
    o = o || {};
    g.save(); g.translate(P.cx, P.cy); g.rotate(P.rot || 0); g.scale(P.s, P.s);
    if (o.halo > 0) {   /* the backlight leaking round the screen: a soft gray halo */
      g.save(); g.shadowColor = 'rgba(214,216,226,' + (.55 * o.halo).toFixed(3) + ')'; g.shadowBlur = 90 * P.s;
      g.fillStyle = 'rgba(90,92,98,' + (.6 * o.halo).toFixed(3) + ')'; rr(g, -SX, -SY, SX * 2, SY * 2, 46); g.fill(); g.restore();
    }
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, -PW / 2 + 12, -PHH / 2 + 18, PW, PHH, 64); g.fill();
    g.fillStyle = PHB; rr(g, -PW / 2, -PHH / 2, PW, PHH, 64); g.fill();
    rr(g, -PW / 2, -PHH / 2, PW, PHH, 64); grainIn(g, -PW / 2, -PHH / 2, PW, PHH, 811, .9);
    g.fillStyle = '#1f252f'; rr(g, PW / 2 - 2, -230, 9, 90, 4); g.fill(); rr(g, PW / 2 - 2, -110, 9, 60, 4); g.fill();
    prop(g, o.name || 'phone', -PW / 2, -PHH / 2, PW / 2 + 7, PHH / 2);
    if (o.shade > 0) { g.fillStyle = 'rgba(3,4,7,' + o.shade.toFixed(3) + ')'; rr(g, -PW / 2, -PHH / 2, PW + 8, PHH, 64); g.fill(); }
    /* the screen */
    g.save(); rr(g, -SX, -SY, SX * 2, SY * 2, 46); g.clip();
    g.fillStyle = '#060708'; g.fillRect(-SX, -SY, SX * 2, SY * 2);
    if (o.screen) o.screen(g);
    g.restore();
    if (o.flap) o.flap(g);
    /* the punch-hole camera and the port */
    g.fillStyle = '#0c0e12'; el(g, 0, -SY + 30, 12, 12); g.fillStyle = 'rgba(244,237,224,.18)'; el(g, -3, -SY + 27, 4, 4);
    g.fillStyle = '#151a22'; rr(g, -34, PHH / 2 - 9, 68, 9, 4); g.fill();
    g.strokeStyle = 'rgba(244,237,224,' + (o.rim == null ? .5 : o.rim).toFixed(3) + ')'; g.lineWidth = 3 / Math.min(1, P.s) * .8; rr(g, -PW / 2, -PHH / 2, PW, PHH, 64); g.stroke();
    g.restore();
  }
  function portOf(P) { return [P.cx - Math.sin(P.rot || 0) * PHH / 2 * P.s, P.cy + Math.cos(P.rot || 0) * PHH / 2 * P.s]; }
  function cord(g, A, B, k, droop) {
    if (k <= 0) return;
    var c1 = [A[0], A[1] + (droop || 140)], c2 = [B[0] - 90, B[1] + 40];
    function P(u) { var a = (1 - u) * (1 - u) * (1 - u), b = 3 * u * (1 - u) * (1 - u), c = 3 * u * u * (1 - u), d = u * u * u; return [a * A[0] + b * c1[0] + c * c2[0] + d * B[0], a * A[1] + b * c1[1] + c * c2[1] + d * B[1]]; }
    g.save(); g.lineCap = 'round';
    [['rgba(0,0,0,.35)', 14, 4], ['#14171d', 10, 0], ['rgba(244,237,224,.22)', 2.5, -2]].forEach(function (L) {
      g.strokeStyle = L[0]; g.lineWidth = L[1]; g.beginPath();
      for (var i = 0; i <= 40; i++) { var u = (1 - k) + k * i / 40, p = P(u); if (i) g.lineTo(p[0], p[1] + L[2]); else g.moveTo(p[0], p[1] + L[2]); }
      g.stroke();
    });
    g.fillStyle = '#14171d'; rr(g, A[0] - 14, A[1] - 4, 28, 22, 5); if (k >= 1) g.fill();
    g.restore();
  }
  var SKIN2 = '#c49c78', SKIN3 = '#a98263';
  function hand(g) {
    /* cut paper: a torn sleeve, a fist with the index finger out (pointing left), one flat colour per piece, no outlines */
    var r = mulberry(404);
    g.fillStyle = '#3b4a60'; cut(g, [[10, -40], [150, -46], [156, 44], [6, 40]], r, 3);                 /* the sleeve, torn at the wrist */
    g.fillStyle = '#2f3d52'; cut(g, [[10, -40], [26, -42], [24, 40], [6, 40]], r, 2);
    g.fillStyle = SKIN; cut(g, [[14, -34], [-58, -40], [-70, -8], [-66, 36], [14, 34]], r, 2.2);         /* the fist */
    g.fillStyle = SKIN; cut(g, [[-50, -40], [-150, -42], [-156, -26], [-50, -20]], r, 1.6);              /* the index finger */
    g.fillStyle = SKIN2; cut(g, [[-64, -10], [-84, -6], [-84, 6], [-64, 10]], r, 1.2);                   /* curled knuckles */
    cut(g, [[-62, 12], [-80, 16], [-78, 28], [-60, 30]], r, 1.2);
    g.fillStyle = SKIN2; cut(g, [[-14, -34], [-50, -50], [-58, -40], [-20, -26]], r, 1.4);              /* the thumb over the fist */
    g.fillStyle = 'rgba(255,240,220,.4)'; cut(g, [[-146, -39], [-138, -39], [-138, -35], [-146, -35]], r, .6);
  }
  function ring(x, y, r) { var o = []; for (var i = 0; i < 9; i++) { var a = i / 9 * 6.283; o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return o; }
  /* =====================================================================================================
     THE NIGHTSTAND PROPS (all cut paper, all drawn by hand)
     ===================================================================================================== */
  var CUR = 'stand';
  var NT = 1410;                                   /* the nightstand's top in the side views */
  var FILL1 = '#f6e7b8', FILL2 = '#e7c86f', SAND = '#cdb487', CASEC = '#5b4034', PILLOW = '#d4cde0', PILLOW2 = '#b7aecb';
  function lerpC(a, b, k) { return { x: lerp(a.x, b.x, k), w: lerp(a.w, b.w, k), y0: lerp(a.y0, b.y0, k), base: lerp(a.base, b.base, k) }; }
  /* the lamp: off frame, upper left; L 1 = on, 0 = off. The hook's pull cord turns it off; the end card has it on */
  function lampL(t) { return 1 - eio(seg(t, K.HK + .02, K.HK + .24)); }

  /* ---------- backgrounds: they bleed full width and stay dark (never brighter than ~85, never saturated) ---------- */
  function wallBG(g, L, tint) {
    var c = tint || [lerp(9, 40, L), lerp(11, 37, L), lerp(17, 48, L)];
    g.fillStyle = mixc(c, c, 0); g.fillRect(-300, -300, W + 600, H + 600);
    g.fillStyle = 'rgba(255,255,255,' + (.012 + .018 * L).toFixed(3) + ')'; for (var x = -300; x < W + 300; x += 96) g.fillRect(x, -300, 40, NT + 300);
    if (L > 0) {
      var pool = g.createRadialGradient(130, 420, 40, 130, 420, 1000);
      pool.addColorStop(0, 'rgba(255,208,150,' + (.15 * L).toFixed(3) + ')'); pool.addColorStop(1, 'rgba(255,208,150,0)');
      g.fillStyle = pool; g.fillRect(-300, -300, W + 600, H + 600);
    }
  }
  function standBG(g, L, top) {
    top = top || NT;
    g.fillStyle = mixc([24, 18, 14], [70, 50, 36], .35 + .65 * L); g.fillRect(-300, top, W + 600, 22);
    g.fillStyle = mixc([16, 12, 10], [46, 33, 24], .35 + .65 * L); g.fillRect(-300, top + 22, W + 600, H);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-300, top + 22, W + 600, 8);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-300, top + 96, W + 600, 4);
  }

  /* ---------- the charge column: a tall glass on the nightstand that fills like a glass of water ----------
     C = { x, w, y0 (glass top), base (the table line) }; o.lvl 0..100; o.nums: the scale's numbers; o.peg: the brass stop
     at 80 (0 = across the glass, 1 = swung down out of the way; null = none); o.slap: the top flashes coral (the peak) */
  function colGeom(C) { var bh = Math.round(clamp(C.w * .36, 40, 76)), y1 = C.base - bh; return { x0: C.x, x1: C.x + C.w, y0: C.y0, y1: y1, h: y1 - C.y0, bh: bh }; }
  function colY(C, v) { var G = colGeom(C); return G.y1 - 10 - (G.h - 20) * v / 100; }
  function jackOf(C) { var G = colGeom(C); return [G.x0 - 6, C.base - G.bh * .45]; }
  function column(g, C, o, t) {
    o = o || {};
    var G = colGeom(C), x0 = G.x0, x1 = G.x1, y0 = G.y0, y1 = G.y1, w = C.w, h = G.h, r = Math.min(34, w * .2);
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, x0 + 12, y0 + 16, w, C.base - y0, r); g.fill();
    /* the brass base on the table and the cap ring */
    g.fillStyle = BRASS2; rr(g, x0 - 14, y1 - 4, w + 28, G.bh + 4, 12); g.fill();
    g.fillStyle = BRASS; rr(g, x0 - 10, y1, w + 20, G.bh - 6, 10); g.fill();
    rr(g, x0 - 10, y1, w + 20, G.bh - 6, 10); grainIn(g, x0 - 10, y1, w + 20, G.bh - 6, 1201, .8);
    prop(g, 'column', x0 - 14, y0 - 22, x1 + (o.peg != null ? 22 : 14), C.base);
    if (o.title > 0) onprop(function () { txt(g, '% CHARGE', (x0 + x1) / 2, y1 + G.bh / 2 - 2, Math.min(52, G.bh * .78), '#4a3a1c', 'center', 900, DISP, w + 10, o.title, 36, 'condensed'); });
    /* the glass */
    g.fillStyle = '#0c1017'; rr(g, x0, y0, w, h, r); g.fill();
    var lv = clamp(o.lvl, 0, 100.5), fy = colY(C, lv);
    g.save(); rr(g, x0 + 9, y0 + 9, w - 18, h - 18, r * .7); g.clip();
    var gr = g.createLinearGradient(0, fy, 0, y1); gr.addColorStop(0, o.slap > 0 ? mixc(hex(FILL1), hex(HOT), o.slap) : FILL1); gr.addColorStop(.25, FILL2); gr.addColorStop(1, '#c9a24c');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x0, y1 + 20); g.lineTo(x0, fy);
    var wav = o.wav || 0, ph = (t || 0) * 5.3;
    for (var i = 0; i <= 14; i++) g.lineTo(x0 + w * i / 14, fy + wav * Math.sin(i * .95 + ph));
    g.lineTo(x1, y1 + 20); g.closePath(); g.fill();
    g.save(); g.clip(); grainIn(g, x0, fy - 10, w, y1 - fy + 20, 1203, 1);
    /* bubbles rising in the fill while it charges */
    if (o.bub > 0) { var rb = mulberry(77); for (var b = 0; b < 9; b++) { var bx = x0 + 22 + rb() * (w - 44), sp0 = 60 + rb() * 70, md = Math.max(40, y1 - fy), by = y1 - ((((t * sp0 + rb() * 900) % md) + md) % md); g.fillStyle = 'rgba(255,250,230,' + (.55 * o.bub).toFixed(3) + ')'; el(g, bx, by, 5 + rb() * 5, 5 + rb() * 5); } }
    g.restore();
    if (o.slap > 0) { g.fillStyle = 'rgba(255,91,61,' + (.85 * o.slap).toFixed(3) + ')'; g.fillRect(x0, fy - 6, w, 34); }
    if (o.glow > 0) { var gg = g.createLinearGradient(0, fy - 70, 0, fy + 26); gg.addColorStop(0, 'rgba(255,236,170,0)'); gg.addColorStop(.72, 'rgba(255,236,170,' + (.5 * o.glow).toFixed(3) + ')'); gg.addColorStop(1, 'rgba(255,250,225,' + (.75 * o.glow).toFixed(3) + ')'); g.fillStyle = gg; g.fillRect(x0, fy - 70, w, 96); }
    g.restore();
    /* ticks at 20, 40, 60, 80, 100 on the glass; the numbers outside, left */
    [20, 40, 60, 80, 100].forEach(function (v) {
      var y = colY(C, v), under = v < lv - 1, tk = o.ticks == null ? 1 : o.ticks;
      g.fillStyle = under ? 'rgba(33,29,38,' + (.55 * tk).toFixed(3) + ')' : 'rgba(244,237,224,' + (.75 * tk).toFixed(3) + ')'; if (tk > 0) g.fillRect(x0 + 10, y - 3, Math.min(w * .26, 56), 6);
      if (o.nums > 0) onprop(function () { txt(g, String(v), x0 - 14, y, 50, CREAM, 'right', 900, DISP, 0, o.nums, 40, 'condensed'); });
    });
    /* the glass rim and one glint */
    g.strokeStyle = 'rgba(244,237,224,' + (o.rim == null ? .9 : o.rim).toFixed(3) + ')'; g.lineWidth = 5; rr(g, x0, y0, w, h, r); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.1)'; rr(g, x0 + w * .68, y0 + 24, w * .1, h - 48, 8); g.fill();
    g.fillStyle = BRASS2; rr(g, x0 - 8, y0 - 22, w + 16, 30, 10); g.fill(); g.fillStyle = BRASS; rr(g, x0 - 4, y0 - 19, w + 8, 20, 8); g.fill();
    /* the peg: a brass bar across the glass at 80, hinged on the right wall; it swings down out of the way */
    if (o.peg != null) {
      var py = colY(C, 80) - 8, hx = x1 - 10, ang0 = Math.PI * .5 * eio(clamp(o.peg, 0, 1));
      g.save(); g.translate(hx, py); g.rotate(-ang0 * -1);
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -(w - 26) + 4, -7 + 6, w - 26, 16, 6); g.fill();
      g.fillStyle = BRASS2; rr(g, -(w - 26), -8, w - 26, 16, 6); g.fill(); g.fillStyle = BRASS; rr(g, -(w - 26), -8, w - 26, 7, 4); g.fill();
      g.restore();
      g.fillStyle = BRASS2; el(g, x1 + 8, py, 13, 13); g.fillStyle = BRASS; el(g, x1 + 6, py - 2, 7, 7);
    }
    if (o.shade > 0) { g.fillStyle = 'rgba(3,4,7,' + o.shade.toFixed(3) + ')'; rr(g, x0 - 14, y0 - 22, w + 28, C.base - y0 + 22, r); g.fill(); }
  }

  /* ---------- the HEAT thermometer: a paper card, a glass tube, a sand bulb that turns coral at the low point; no numbers ---------- */
  function thermo(g, T, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    var s = o.s == null ? 1 : o.s, cx = T.x + T.w / 2, cy = T.y0 + T.h / 2;
    g.save(); g.globalAlpha *= a; g.translate(cx, cy); g.rotate(o.rot || 0); g.scale(s, s); g.translate(-cx, -cy);
    var ex = EXITING; if (s < .995 || a < 1) EXITING = true;
    sheet(g, T.x, T.y0, T.x + T.w, T.y0 + T.h, 1301, PAPER, 'thermometer');
    g.fillStyle = BRASS2; el(g, cx, T.y0 + 18, 9, 9);
    var hot = clamp(o.hot || 0, 0, 1);
    onprop(function () { txt(g, 'HEAT', cx, T.y0 + 66, Math.min(66, T.w * .36), hot > .5 ? HOT : INK, 'center', 900, DISP, T.w - 24, 1, 40, 'condensed'); });
    var tw = Math.round(T.w * .2), ty0 = T.y0 + 120, br = T.w * .25, by = T.y0 + T.h - br - 26, ty1 = by - br * .6;
    g.fillStyle = '#d8cdb8'; rr(g, cx - tw / 2, ty0, tw, ty1 - ty0 + 10, tw / 2); g.fill(); el(g, cx, by, br, br);
    for (var i = 0; i <= 8; i++) { var yy = lerp(ty1 - 20, ty0 + 20, i / 8); g.fillStyle = INK; g.fillRect(cx + tw / 2 + 10, yy - 2, i % 2 ? 16 : 30, 4); }
    var col = mixc(hex(SAND), hex(HOT), hot), m = clamp(o.m || 0, 0, 1), my = lerp(ty1, ty0 + 14, m);
    g.fillStyle = col; rr(g, cx - tw / 2 + 7, my, tw - 14, ty1 - my + 16, (tw - 14) / 2); g.fill();
    var pul = 1 + .12 * (o.pulse || 0);
    g.fillStyle = col; el(g, cx, by, (br - 10) * pul, (br - 10) * pul);
    g.fillStyle = 'rgba(255,250,235,.45)'; el(g, cx - br * .32, by - br * .3, br * .2, br * .14);
    g.strokeStyle = INK; g.lineWidth = 4; rr(g, cx - tw / 2, ty0, tw, ty1 - ty0 + 10, tw / 2); g.stroke(); g.beginPath(); g.arc(cx, by, br, 0, 6.283); g.stroke();
    EXITING = ex; g.restore();
  }

  /* ---------- the HOURS AT 100% tag: a paper luggage tag with a paper clock, tied to the column's cap ---------- */
  function hoursTag(g, x, y, k, rot) {
    if (k <= 0) return;
    var s = lerp(1.3, 1, eout(clamp(k, 0, 1))), w = 290, h = 176;
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s); g.globalAlpha *= seg(k, 0, .15);
    var ex = EXITING; if (k < 1) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.38)'; poly(g, [[-w / 2 + 30 + 7, -h / 2 + 9], [w / 2 + 7, -h / 2 + 9], [w / 2 + 7, h / 2 + 9], [-w / 2 + 30 + 7, h / 2 + 9], [-w / 2 + 7, 9]]); g.fill();
    g.fillStyle = PAPER; poly(g, [[-w / 2 + 30, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2 + 30, h / 2], [-w / 2, 0]]); g.fill();
    poly(g, [[-w / 2 + 30, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2 + 30, h / 2], [-w / 2, 0]]); grainIn(g, -w / 2, -h / 2, w, h, 1311, .9);
    prop(g, 'hours tag', -w / 2, -h / 2, w / 2, h / 2);
    g.fillStyle = '#1a1510'; el(g, -w / 2 + 26, 0, 9, 9);
    /* the clock: a paper disc, two ink hands */
    var ccx = -w / 2 + 86; g.fillStyle = '#e6dbc6'; el(g, ccx, 0, 46, 46); g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(ccx, 0, 46, 0, 6.283); g.stroke();
    g.lineCap = 'round'; g.lineWidth = 6; g.beginPath(); g.moveTo(ccx, 0); g.lineTo(ccx, -32); g.moveTo(ccx, 0); g.lineTo(ccx + 24, 10); g.stroke(); g.lineCap = 'butt';
    onprop(function () { txt(g, 'HOURS AT', 56, -34, 50, INK, 'center', 900, DISP, 166, 1, 44, 'condensed'); txt(g, '100%', 56, 30, 72, INK, 'center', 900, DISP, 166, 1, 48, 'condensed'); });
    EXITING = ex; g.restore();
  }

  /* ---------- the pillow: one fat paper shape, pointy corners, a stitched seam ---------- */
  function pillowShape(g, w, h, r) {
    var c = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], bul = [[0, -h * .12], [w * .06, 0], [0, h * .12], [-w * .06, 0]];
    g.beginPath(); g.moveTo(c[0][0], c[0][1]);
    for (var i = 0; i < 4; i++) {
      var a = c[i], b = c[(i + 1) % 4], m = [(a[0] + b[0]) / 2 + bul[i][0] + (r() - .5) * 8, (a[1] + b[1]) / 2 + bul[i][1] + (r() - .5) * 8];
      g.quadraticCurveTo(m[0] * 1.02, m[1] * 1.02, b[0], b[1]);
    }
    g.closePath();
  }
  function pillow(g, x, y, w, h, rot, sq, shade) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(1 + (sq || 0), 1 - (sq || 0));
    g.save(); g.translate(10, 16); pillowShape(g, w, h, mulberry(5)); g.fillStyle = 'rgba(0,0,0,.4)'; g.fill(); g.restore();
    pillowShape(g, w, h, mulberry(5)); g.fillStyle = PILLOW; g.fill();
    pillowShape(g, w, h, mulberry(5)); grainIn(g, -w / 2, -h / 2, w, h, 1321, 1);
    prop(g, 'pillow', -w / 2 - w * .06, -h / 2 - h * .12, w / 2 + w * .06, h / 2 + h * .12);
    g.save(); pillowShape(g, w, h, mulberry(5)); g.clip();
    g.fillStyle = PILLOW2; el(g, 0, h * .55, w * .62, h * .3); el(g, w * .05, -h * .5, w * .5, h * .14);
    g.fillStyle = 'rgba(255,255,255,.3)'; el(g, -w * .18, -h * .12, w * .22, h * .12);
    g.restore();
    g.strokeStyle = 'rgba(90,80,110,.55)'; g.lineWidth = 4; g.setLineDash([14, 10]); g.save(); g.scale(.86, .8); pillowShape(g, w, h, mulberry(5)); g.restore(); g.stroke(); g.setLineDash([]);
    if (shade > 0) { pillowShape(g, w, h, mulberry(5)); g.fillStyle = 'rgba(3,4,7,' + shade.toFixed(3) + ')'; g.fill(); }
    g.restore();
  }
  /* heat squiggles: paper strips that rise from the phone and get pushed back down under the pillow (trapped) */
  function squiggles(g, x0, x1, yb, ycap, t, t0, k) {
    if (k <= 0 || t < t0) return;
    for (var i = 0; i < 4; i++) {
      var ph = frac((t - t0) * .85 + i * .27), up = ph < .55 ? eout(ph / .55) : 1 - eio((ph - .55) / .45) * .85;
      var x = lerp(x0, x1, (i + .5) / 4), ytop = lerp(yb, ycap, up), len = 70;
      g.save(); g.globalAlpha *= k * seg(ph, 0, .08);
      g.strokeStyle = GLOW; g.lineWidth = 11; g.lineCap = 'round'; g.beginPath();
      for (var j = 0; j <= 10; j++) { var yy = ytop + len * j / 10, xx = x + 12 * Math.sin(j * .9 + t * 7 + i); if (j) g.lineTo(xx, yy); else g.moveTo(xx, yy); }
      g.stroke(); g.restore();
      if (ph > .5 && ph < .62) { g.save(); g.globalAlpha *= k * (1 - Math.abs(ph - .56) / .06); g.strokeStyle = 'rgba(241,207,107,.8)'; g.lineWidth = 5; g.beginPath(); g.arc(x, ycap - 4, 22, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.restore(); }
    }
  }
  /* the phone in its case (a warm brown case, 22 px proud of the phone) */
  function casedPhone(g, P, o, cs) {
    if (cs && cs.k > 0) {
      g.save(); g.translate(P.cx + (cs.dx || 0), P.cy + (cs.dy || 0)); g.rotate((P.rot || 0) + (cs.rot || 0)); g.scale(P.s * (cs.sc || 1), P.s * (cs.sc || 1)); g.globalAlpha *= cs.k;
      g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -PW / 2 - 22 + 12, -PHH / 2 - 22 + 18, PW + 44, PHH + 44, 82); g.fill();
      g.fillStyle = CASEC; rr(g, -PW / 2 - 22, -PHH / 2 - 22, PW + 44, PHH + 44, 82); g.fill();
      rr(g, -PW / 2 - 22, -PHH / 2 - 22, PW + 44, PHH + 44, 82); grainIn(g, -PW / 2 - 22, -PHH / 2 - 22, PW + 44, PHH + 44, 1331, 1);
      if (cs.off) { g.fillStyle = '#3e2c24'; rr(g, -PW / 2 + 4, -PHH / 2 + 4, PW - 8, PHH - 8, 60); g.fill(); g.fillStyle = '#2a1f1a'; el(g, -PW / 2 + 70, -PHH / 2 + 80, 34, 34); }
      if (cs.shade > 0) { g.fillStyle = 'rgba(3,4,7,' + cs.shade.toFixed(3) + ')'; rr(g, -PW / 2 - 22, -PHH / 2 - 22, PW + 44, PHH + 44, 82); g.fill(); }
      g.restore();
    }
    if (!cs || !cs.off) phone(g, P, o);
  }
  /* the lock screen: a soft blue glow and a paper battery (no numbers on it) */
  function lockScreen(s, t, k, lvl) {
    var gr = s.createLinearGradient(0, -SY, 0, SY); gr.addColorStop(0, mixc([18, 26, 40], [40, 64, 98], k)); gr.addColorStop(1, mixc([8, 10, 16], [16, 24, 40], k));
    s.fillStyle = gr; s.fillRect(-SX, -SY, SX * 2, SY * 2);
    var bw = 120, bh = 58, bx = -bw / 2, by = -270;
    s.strokeStyle = 'rgba(244,237,224,' + (.5 + .4 * k).toFixed(3) + ')'; s.lineWidth = 7; rr(s, bx, by, bw, bh, 12); s.stroke();
    s.fillStyle = 'rgba(244,237,224,.8)'; rr(s, bx + bw + 4, by + 18, 9, 22, 3); s.fill();
    s.fillStyle = mixc([80, 70, 40], hex(FILL2), k); rr(s, bx + 9, by + 9, (bw - 18) * clamp(lvl, .1, 1), bh - 18, 6); s.fill();
  }

  /* ---------- the search card (the main search phrase): drops in at the question, typed by ~3.4 s ---------- */
  function searchBar(g, t) {
    var SB = 1.3, sa = seg(t, SB, SB + .12), out = eio(seg(t, K.wear + .35, K.wear + .6));
    if (sa <= 0 || out >= 1 || !LIVE.text) return;
    var x0 = 484, y0 = 454, w = 436, h = 226, cx = x0 + w / 2, cy = y0 + h / 2;
    var sc = lerp(.86, 1, Math.min(1, pop(t, SB, 3.4))) * (1 - .12 * out), bump = 26 * Math.sin(Math.PI * seg(t, K.askEnd + .12, K.askEnd + .5));
    g.save(); g.globalAlpha *= sa * (1 - out); g.translate(cx, cy - 60 * out - bump); g.scale(sc, sc); g.translate(-cx, -cy);
    var ex = EXITING; if (sc < .995 || sa < 1 || out > 0) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 8, y0 + 10, w, h, 36); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 36); g.fill();
    prop(g, 'search bar', x0, y0, x0 + w, y0 + h);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(x0 + 44, y0 + 50, 16, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(x0 + 56, y0 + 62); g.lineTo(x0 + 70, y0 + 76); g.stroke();
    var LN = ['DOES CHARGING', 'OVERNIGHT RUIN', 'YOUR BATTERY?'], XS = [x0 + 88, x0 + 30, x0 + 30], YS = [y0 + 50, y0 + 114, y0 + 178];
    var total = LN.join(' ').length, k = seg(t, SB + .1, 2.0), n = Math.round(total * k), typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
    var shown = [], left = n, last = 0;
    LN.forEach(function (L, i) { var c = Math.max(0, Math.min(L.length, left)); shown.push(L.slice(0, c)); if (c > 0) last = i; left -= L.length + 1; });
    onprop(function () { shown.forEach(function (str, i) { if (str) txt(g, str, XS[i], YS[i], 54, INK, 'left', 900, DISP, x0 + w - 22 - XS[i], 1, 48, 'condensed'); }); });
    NOREC = nr;
    if (typing && Math.floor(t * 8) % 2 === 0) { font(g, 54, 900, DISP, 'condensed'); var cw = g.measureText(shown[last]).width; g.fillStyle = INK; g.fillRect(XS[last] + cw + 4, YS[last] - 28, 5, 56); }
    EXITING = ex; g.restore();
  }
  /* the lamp's pull cord, top right: yanked on the click */
  function pullCord(g, t, L) {
    var y = 486 + 46 * Math.sin(Math.PI * seg(t, K.HK - .1, K.HK + .14)) * (t < 6 ? 1 : 0), x = 900;
    g.strokeStyle = mixc([90, 84, 70], [200, 190, 170], L); g.lineWidth = 3; g.beginPath(); g.moveTo(x, SAFE_BOX.y0); g.lineTo(x, y); g.stroke();
    g.fillStyle = BRASS2; el(g, x, y + 16, 15, 19); g.fillStyle = mixc(hex(BRASS2), hex(BRASS), L); el(g, x - 3, y + 12, 8, 10);
    prop(g, 'pull cord', x - 16, y - 4, x + 16, y + 36);
  }
  /* the frame-0 sticker on the phone: CHARGING / ALL NIGHT? (the "?" coral), then the hedge strip under it */
  function sticker(g, P, k, hk, t) {
    if (k <= 0) return;
    var cx = P.cx, cy = P.cy + 92 * P.s / .9, w = 372, h = 172, s = k, spx = 70;
    font(g, spx, 900, DISP, 'condensed'); while (spx > 50 && Math.max(g.measureText('CHARGING').width, g.measureText('ALL NIGHT?').width + 2) > w - 56) { spx -= 2; font(g, spx, 900, DISP, 'condensed'); }
    g.save(); g.translate(cx, cy); g.rotate(-.02); g.scale(s, s);
    var ex = EXITING; if (k < .999) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -w / 2 + 7, -h / 2 + 10, w, h, 18); g.fill();
    g.fillStyle = CREAM; rr(g, -w / 2, -h / 2, w, h, 18); g.fill();
    onprop(function () {
      txt(g, 'CHARGING', 0, -36, spx, INK, 'center', 900, DISP, 0, 1, 48, 'condensed');
      font(g, spx, 900, DISP, 'condensed'); var w1 = g.measureText('ALL NIGHT').width, w2 = g.measureText('?').width, x = -(w1 + w2 + 2) / 2;
      txt(g, 'ALL NIGHT', x, 40, spx, INK, 'left', 900, DISP, 0, 1, 48, 'condensed'); txt(g, '?', x + w1 + 2, 40, spx, HOT, 'left', 900, DISP, 0, 1, 48, 'condensed');
    });
    if (hk > 0) {
      var e = eout(clamp(hk, 0, 1)), y = h / 2 + 18 + 56, w0 = w; w = 404;
      g.save(); g.globalAlpha *= seg(hk, 0, .3); g.translate(0, y); g.scale(lerp(1.2, 1, e), lerp(1.2, 1, e)); if (hk < 1) EXITING = true;
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -w / 2 + 7, -56 + 8, w, 112, 14); g.fill();
      g.fillStyle = INK; rr(g, -w / 2, -56, w, 112, 14); g.fill(); g.strokeStyle = CREAM; g.lineWidth = 3; rr(g, -w / 2, -56, w, 112, 14); g.stroke();
      onprop(function () { txt(g, 'WITH ITS CHARGING', 0, -24, 44, CREAM, 'center', 900, DISP, w - 26, 1, 40, 'condensed'); txt(g, 'SETTING ON', 0, 26, 44, CREAM, 'center', 900, DISP, w - 26, 1, 40, 'condensed'); });
      g.restore(); w = w0;
    }
    EXITING = ex; g.restore();
  }

  /* =====================================================================================================
     LAYOUT A: the nightstand (side view). The phone glides in; the lamp goes off; the two culprits get pinned on.
     ===================================================================================================== */
  var F0A = { cx: 600, cy: NT - 369, s: .9, rot: .02 }, F0B = { cx: 300, cy: NT - 369, s: .9, rot: -.01 };
  var WEARP = { cx: 262, cy: NT - 410 * .72, s: .72, rot: 0 }, ENDP = { cx: 288, cy: NT - 369, s: .9, rot: -.01 };
  var CA = { x: 818, w: 96, y0: 710, base: NT }, CW = { x: 706, w: 200, y0: 540, base: NT };
  function aFill(u) { return 27 + 13 * eout(seg(u, 0, 4.5)); }
  function standScene(g, t) {
    var L = lampL(t), shade = .5 * (1 - L);
    if (LAYER === 'bg') { wallBG(g, L); standBG(g, L); return; }
    var gk = eout(seg(t, 0, .55)), P = lerpPose(F0A, F0B, gk);
    P.cy += drift(t, .2, .5) * seg(t, .6, 1.2);
    var wk = eio(seg(t, K.wear + .2, K.wear + .9));
    P = lerpPose(P, WEARP, wk);
    var C = lerpC(CA, CW, wk);
    C.y0 += drift(t, 1.3, .25) * (1 - wk);
    pullCord(g, t, L);
    cord(g, portOf(P), jackOf(C), 1, 90);
    column(g, C, { lvl: aFill(t) + .6 * Math.sin(t * 2.1), wav: 3, bub: 1, shade: shade * .7, rim: .6 + .3 * L, peg: null, glow: 1 }, t);
    /* HOURS AT 100% tag on "hours", tied to the cap */
    var hk = seg(t, K.wearW - .1, K.wearW + .05);
    if (hk > 0) { var hx = 764, hy = 790 + drift(t, 2.2, .3); g.strokeStyle = 'rgba(244,237,224,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(C.x + 30, C.y0 - 10); g.lineTo(hx - 120, hy); g.stroke(); hoursTag(g, hx, hy, hk, -.05 + .02 * Math.sin(t * 1.7)); }
    /* the HEAT thermometer pinned on "heat" */
    var th = pop(t, K.wear + .75, 3.2);
    if (t >= K.wear + .75) thermo(g, { x: 428, y0: 740, w: 180, h: 580 }, { s: th, a: seg(t, K.wear + .75, K.wear + .83), m: .26 + .02 * Math.sin(t * 2), hot: 0, rot: .02 });
    casedPhone(g, P, { shade: shade * .4, rim: .7, halo: 1, screen: function (s) { lockScreen(s, t, 1, aFill(t) / 100 + .2); } }, { k: 1, shade: shade * .4 });
    /* frame 0's sticker and its hedge; both peel as the question starts */
    var so = eio(seg(t, 5.0, 5.28));
    if (so < 1) { g.save(); g.globalAlpha *= 1 - so; sticker(g, P, 1 - .3 * so, seg(t, K.dsnt - .04, K.dsnt + .2) * (1 - so), t); g.restore(); }
    searchBar(g, t);
    quote(g, 108, 470 + drift(t, 2.6, .3), 500, ['“…TEMPERATURE', 'HISTORY AND', 'CHARGING PATTERN.”'], 44, 'APPLE SUPPORT', 1341, seg(t, K.wear + .45, K.wear + .65), seg(t, K.pillow - .5, K.pillow - .1), false);
  }

  /* =====================================================================================================
     LAYOUT A2: the bed close-up. The pillow flops onto the phone, the heat can't get out, the bulb goes coral.
     ===================================================================================================== */
  var BEDP = { cx: 372, cy: 1110, s: .6, rot: -.22 };
  function bedScene(g, t) {
    if (LAYER === 'bg') {
      g.fillStyle = '#2c2c40'; g.fillRect(-300, -300, W + 600, H + 600);
      g.fillStyle = 'rgba(255,255,255,.025)'; for (var i = 0; i < 14; i++) { g.save(); g.translate(-200 + i * 120, 0); g.rotate(.3); g.fillRect(0, -400, 26, 3000); g.restore(); }
      g.fillStyle = '#1d1712'; g.fillRect(-300, -300, W + 600, 760); g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(-300, 452, W + 600, 8);
      return;
    }
    var fall = eio(seg(t, K.pillow - .1, K.pil + .02)), land = t >= K.pil + .02;
    var sq = .07 * Math.abs(decay(t, K.pil + .02, 16, 5)) + .05 * Math.abs(decay(t, K.PW, 20, 6));
    var px = lerp(330, 360, fall), py = lerp(430, 1010, fall), prot = lerp(-.42, -.05, fall);
    casedPhone(g, BEDP, { shade: .25, rim: .6, screen: function (s) { lockScreen(s, t, 1, .5); } }, { k: 1, shade: .2 });
    /* the heat: rises off the phone's poking-out end and is pushed back down under the pillow */
    if (land) squiggles(g, 190, 600, 1330, 1196, t, K.pheat - .25, seg(t, K.pheat - .25, K.pheat + .05));
    var ex = EXITING; if (!land) EXITING = true;
    pillow(g, px + 32, py, 480, 336, prot, land ? sq : 0, 0);
    EXITING = ex;
    /* the thermometer: climbs while the heat is trapped; the bulb goes coral on "damage … for good" */
    var m = .28 + .3 * eio(seg(t, K.pheat, K.trapped + .3)) + .42 * eio(seg(t, K.damage - .1, K.good + .1));
    var hot = eio(seg(t, K.damage, K.good + .05)), pul = Math.abs(decay(t, K.DP, 18, 5));
    thermo(g, { x: 694, y0: 486, w: 220, h: 820 }, { m: m + .01 * Math.sin(t * 9) * seg(t, K.pheat, K.dip), hot: hot, pulse: pul + .25 * Math.abs(decay(t, K.good, 14, 5)), rot: .015 + .01 * Math.sin(t * 1.3) });
    quote(g, 108, 470 + drift(t, 2.6, .3), 560, ['“DON’T … PLACE THEM', 'UNDER A … PILLOW…”'], 46, 'APPLE SAFETY GUIDE', 1351, seg(t, K.pillow - .65, K.pillow - .45), seg(t, K.dip - .3, K.dip - .1), false);
    quote(g, 108, 470 + drift(t, 2.2, .3), 560, ['IN AIR ABOVE 95°F,', 'HEAT “CAN PERMANENTLY', 'DAMAGE BATTERY', 'CAPACITY.”'], 46, 'APPLE', 1361, seg(t, K.dip - .14, K.dip + .06), 0, false);
  }

  /* =====================================================================================================
     LAYOUT B: top-down on the nightstand. A paper hand pulls the phone out into the open; the hot case drops off.
     ===================================================================================================== */
  function topScene(g, t) {
    if (LAYER === 'bg') {
      g.fillStyle = '#3d2c21'; g.fillRect(-300, -300, W + 600, H + 600);
      var r = mulberry(31); for (var i = 0; i < 12; i++) { g.fillStyle = 'rgba(0,0,0,' + (.12 + r() * .1).toFixed(3) + ')'; g.fillRect(-300, -300 + i * 190, W + 600, 4); g.fillStyle = 'rgba(255,230,200,' + (.02 + r() * .025).toFixed(3) + ')'; g.fillRect(-300, -300 + i * 190 + 30 + r() * 80, W + 600, 2 + r() * 3); }
      return;
    }
    var pull = eio(seg(t, K.open + .5, K.openW + .4)), shove = eio(seg(t, K.open + .45, K.openW + .3));
    var P = lerpPose({ cx: 350, cy: 720, s: .52, rot: .2 }, { cx: 372, cy: 1002, s: .52, rot: -.03 }, pull);
    P.cy += drift(t, 1.4, .3) * seg(t, K.openW + .2, K.openW + .6); var sett = sio(seg(t, K.caseW, K.night + .4)); P = { cx: P.cx - 40 * sett, cy: P.cy - 50 * sett, s: P.s, rot: P.rot - .07 * sett };
    /* the case: lifts on "out", slides off and drops by the flap */
    var lift = eout(seg(t, K.out - .05, K.out + .2)), slide = eio(seg(t, K.hot - .05, K.FL - .02)), land = Math.abs(decay(t, K.FL, 22, 7));
    var cs = { k: 1, sc: 1 + .04 * lift * (1 - slide), dx: 640 * slide, dy: 420 * slide, rot: .6 * slide, off: false };
    var caseP = { cx: P.cx + cs.dx, cy: P.cy + cs.dy - 6 * land, s: P.s * (1 + .03 * land), rot: P.rot + cs.rot };
    var exc = EXITING; EXITING = slide > 0;
    if (slide < 1) casedPhone(g, slide > 0 ? caseP : P, null, { k: 1, off: true, sc: cs.sc });
    EXITING = exc;
    phone(g, P, { rim: .7, screen: function (s) { lockScreen(s, t, 1, .5); } });
    /* the hand: in on "Charge", pinches the phone's foot, pulls it out, leaves after "open" */
    var hin = eout(seg(t, K.open + .1, K.open + .5)) * (1 - eio(seg(t, K.openW + .25, K.openW + .6)));
    if (hin > 0) { var ft = portOf(P); g.save(); g.translate(ft[0] + 150 + 260 * (1 - hin), ft[1] + 90 + 200 * (1 - hin)); g.rotate(-2.4); g.scale(1.5, 1.5); var exh = EXITING; EXITING = true; hand(g); EXITING = exh; g.restore(); }
    /* the pillow: shoved up and off to the top left */
    var pox = lerp(372, -360, shove), poy = lerp(660, 300, shove);
    if (shove < 1) { var exp = EXITING; EXITING = true; pillow(g, pox, poy, 540, 400, .1 - .5 * shove, 0, 0); EXITING = exp; }
    /* the thermometer cools back to cream */
    var cool = eio(seg(t, K.openW - .1, K.night + .2));
    thermo(g, { x: 714, y0: 486, w: 190, h: 520 }, { m: lerp(1, .26, cool), hot: 1 - cool, rot: -.02 + .01 * Math.sin(t * 1.5) });
    /* the do-this plate: the source's verbs, no tick */
    var a1 = fin(t, K.open + .3, 4), a2 = fin(t, K.openW + .05, 4);
    if (a1 > 0) { chip(g, 'IN THE OPEN', 704, 1062, { px: 60, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 16, a: a1, maxw: 400 }); chip(g, 'NOT UNDER A PILLOW', 600, 1268, { px: 58, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 16, a: a1, maxw: 600 }); }
    if (a2 > 0) { chip(g, 'HOT? CASE OFF', 704, 1144, { px: 60, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 16, a: a2, maxw: 400 }); chip(g, 'APPLE', 836, 1204, { px: 36, wt: 800, bg: INK, line: CREAM, lw: 3, fg: CREAM, st: 'condensed', r: 12, a: a2, maxw: 200 }); }
  }

  /* =====================================================================================================
     LAYOUT C: the wide room, one night. The moon crosses the window; the fill stops on the 80 peg, then tops off at dawn.
     ===================================================================================================== */
  var NT2 = 1414, WIN = { x0: 108, y0: 462, x1: 712, y1: 690 };
  var CR = { x: 692, w: 206, y0: 716, base: NT2 }, CH = { x: 500, w: 398, y0: 716, base: NT2 };
  var RP = { cx: 206, cy: 1388 - 135, s: .33, rot: 0 };          /* the phone, upright in its little dock */
  function dawn(t) { return eio(seg(t, K.full - .2, K.fills + .3)); }
  function skyCol(t) {
    var n = seg(t, K.night, K.learn + .5), d = dawn(t);
    var top = mixc(mixc(hex('#0b1020'), hex('#152446'), n).match(/\d+/g).map(Number), [96, 84, 118], d);
    var bot = mixc(mixc(hex('#121a30'), hex('#1f3260'), n).match(/\d+/g).map(Number), [236, 168, 128], d);
    return [top, bot];
  }
  K.RISE = K.SL - .6;
  function roomFill(t) {
    var v = 22 + 22 * seg(t, K.night - .6, K.pause);                                     /* the evening: slow, always moving */
    if (t >= K.pause - .05) { var a = eout(seg(t, K.pause - .05, K.n80e - .05)); v = lerp(44, 80, a); }   /* "At eighty": fast, onto the peg */
    /* on the peg: it presses up against the stop and breathes just under it (78–80, never over) */
    if (t >= K.n80e - .05) v = 80 - 1.2 * Math.abs(decay(t, K.n80e - .05, 20, 6)) - .9 * Math.abs(decay(t, K.CK, 24, 7)) - (1 - Math.cos(6.283 * (t - K.n80e) / 1.5)) * seg(t, K.n80e + .2, K.n80e + .9) * (1 - seg(t, K.RISE - .55, K.RISE - .15));
    if (t >= K.RISE) { var b = sio(seg(t, K.RISE, K.SL)); v = lerp(80, 100, b * b); }   /* 80 → 100 in 0.6 s, fastest into the top */
    if (t >= K.SL) v = 100 - 1.6 * Math.abs(decay(t, K.SL, 22, 7));
    return v;
  }
  /* minutes after 11 PM on the example night, keyed to the voice (11 PM → 1 AM → 4 AM → 6:30 AM) */
  function clockMin(t) {
    var T = [[K.night - 1, 0], [K.n11, 0], [K.pause + .2, 120], [K.learn + .3, 300], [K.full + .3, 450]];
    if (t <= T[0][0]) return 0;
    for (var i = 1; i < T.length; i++) if (t < T[i][0]) return lerp(T[i - 1][1], T[i][1], sio(seg(t, T[i - 1][0], T[i][0])));
    return 450 + 2 * (t - T[T.length - 1][0]);
  }
  function timeChip(t) {
    var T = [[K.night - 1, '11:00 PM'], [K.pause - .05, '1:00 AM'], [K.learn - .05, '4:00 AM'], [K.full - .05, '6:30 AM']], cur = T[0], t0 = T[0][0];
    T.forEach(function (x) { if (t >= x[0]) { cur = x; t0 = x[0]; } });
    return { text: cur[1], t0: t0 };
  }
  /* a cut-paper wind-up alarm clock: two bells, a hammer, two feet; the hands run through the night; it shakes at 6:30 */
  function alarmClock(g, cx, base, t, rg, bs) {
    var r = 70, cy = base - 22 - r, sh = (rg > 0 ? .085 * Math.sin(t * 62) * rg : 0) + (bs > 0 ? .07 * Math.sin(t * 75.4) * bs : 0), hop = rg > 0 ? 5 * Math.abs(Math.sin(t * 31)) * rg : 0;
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, cx + 8, base - 4, r * .95, 9);
    g.save(); g.translate(cx, cy - hop); g.rotate(sh);
    prop(g, 'alarm clock', -r - 30, -r - 58, r + 30, r + 22 + hop);
    var rr2 = mulberry(1411);
    g.fillStyle = BRASS2; [-1, 1].forEach(function (sd) { poly(g, [[sd * 40, r - 8], [sd * 58, r + 22], [sd * 44, r + 22], [sd * 30, r - 4]]); g.fill(); });   /* feet */
    [-1, 1].forEach(function (sd) {                                                                                                          /* bells */
      var bx = sd * r * .72, by = -r * .78, bb = (rg > 0 ? 3 * Math.sin(t * 90 + sd) * rg : 0) + (bs > 0 ? 4 * Math.sin(t * 75.4 + sd) * bs : 0);
      g.save(); g.translate(bx + bb, by); g.rotate(sd * .62);
      g.fillStyle = BRASS2; g.beginPath(); g.arc(0, 0, 36, Math.PI, 0); g.closePath(); g.fill();
      g.fillStyle = BRASS; g.beginPath(); g.arc(0, -3, 28, Math.PI, 0); g.closePath(); g.fill();
      g.restore();
    });
    g.fillStyle = '#3a3226'; g.fillRect(-4, -r - 44, 8, 30); el(g, 0, -r - 46, 10, 7);                                                     /* hammer */
    g.fillStyle = '#b23a2a'; cut(g, ring(0, 0, r), rr2, 2);                                                                                  /* the body */
    g.fillStyle = '#8f2c20'; cut(g, ring(4, 6, r - 4), mulberry(1412), 1.6);
    g.fillStyle = PAPER; cut(g, ring(0, 0, r - 13), mulberry(1413), 1.4);
    g.beginPath(); g.arc(0, 0, r - 13, 0, 6.283); grainIn(g, -r, -r, 2 * r, 2 * r, 1414, .8);
    for (var i = 0; i < 12; i++) { var a = i / 12 * 6.283; g.fillStyle = INK; g.save(); g.rotate(a); g.fillRect(-2.5, -(r - 20), 5, i % 3 ? 8 : 15); g.restore(); }
    var m = clockMin(t), hm = (11 * 60 + m) % 720;
    g.strokeStyle = INK; g.lineCap = 'round';
    g.lineWidth = 9; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(hm / 720 * 6.283) * 34, -Math.cos(hm / 720 * 6.283) * 34); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(m / 60 * 6.283) * 50, -Math.cos(m / 60 * 6.283) * 50); g.stroke();
    g.lineCap = 'butt'; g.fillStyle = INK; el(g, 0, 0, 7, 7);
    g.restore();
    if (rg > 0) {                                                                                                                         /* ring marks over the bells */
      g.save(); g.globalAlpha *= rg; g.strokeStyle = CREAM; g.lineWidth = 5; g.lineCap = 'round';
      [-1, 1].forEach(function (sd) { for (var q = 0; q < 3; q++) { var a0 = sd * (.9 + q * .28); g.beginPath(); g.moveTo(cx + Math.sin(a0) * (r + 52), cy - hop - Math.cos(a0) * (r + 52)); g.lineTo(cx + Math.sin(a0) * (r + 72), cy - hop - Math.cos(a0) * (r + 72)); g.stroke(); } });
      g.lineCap = 'butt'; g.restore();
    }
  }
  /* the night's history, drawn on the glass by hand: fast to 80 by 1 AM, flat through 4 AM, up to 100 by 6:30 */
  function history(g, C, t) {
    var dk = seg(t, K.unplug, K.SL);
    if (dk <= 0) return;
    var G = colGeom(C), xL = G.x0 + 34, xR = G.x1 - 40;
    var P = [[0, 22], [2 / 7.5, 80], [6.5 / 7.5, 80], [1, 100]].map(function (p) { return [lerp(xL, xR, p[0]), colY(C, p[1])]; });
    var r = mulberry(1501), pts = [];
    for (var i = 0; i < P.length - 1; i++) { var a = P[i], b = P[i + 1], n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 14)); for (var k = 0; k < n; k++) { var f = k / n; pts.push([lerp(a[0], b[0], f) + (r() - .5) * 3.2, lerp(a[1], b[1], f) + (r() - .5) * 3.2]); } }
    pts.push(P[P.length - 1]);
    var L = [0]; for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var upto = L[L.length - 1] * dk, end = pts[0];
    function path() { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var j = 1; j < pts.length; j++) { if (L[j] <= upto) { g.lineTo(pts[j][0], pts[j][1]); end = pts[j]; } else { var f = (upto - L[j - 1]) / (L[j] - L[j - 1]); end = [lerp(pts[j - 1][0], pts[j][0], f), lerp(pts[j - 1][1], pts[j][1], f)]; g.lineTo(end[0], end[1]); break; } } }
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    path(); g.strokeStyle = 'rgba(255,250,235,.85)'; g.lineWidth = 20; g.stroke();
    path(); g.strokeStyle = INK; g.lineWidth = 10; g.stroke();
    g.fillStyle = INK; el(g, pts[0][0], pts[0][1], 11, 11);
    if (dk >= 1) { var pu = 1 + .18 * Math.abs(Math.sin((t - K.unplug) * 3.2)); g.fillStyle = CREAM; el(g, end[0], end[1], 17 * pu, 17 * pu); g.fillStyle = INK; el(g, end[0], end[1], 11, 11); }
    g.restore();
    /* the three labels, each when the pen passes it (ink on the gold fill) */
    var l1 = fin(t, K.unplug + .02, 5), l2 = fin(t, K.unplug + .22, 5), l3 = fin(t, K.SL, 6);
    onprop(function () {
      if (l1 > 0) txt(g, '11 PM', P[0][0] + 26, P[0][1] + 34, 48, INK, 'left', 900, DISP, 0, l1, 48, 'condensed');
      if (l2 > 0) { txt(g, '80%', P[1][0] + 30, P[1][1] + 58, 48, INK, 'left', 900, DISP, 0, l2, 48, 'condensed'); txt(g, 'ALL NIGHT', P[1][0] + 30, P[1][1] + 108, 48, INK, 'left', 900, DISP, 0, l2, 48, 'condensed'); }
      if (l3 > 0) { font(g, 48, 900, DISP, 'condensed'); var wa = g.measureText('AT 6:30').width, w6 = g.measureText('6:30').width; txt(g, '6:30', P[2][0] - 12, (P[3][1] + P[2][1]) / 2 + 4, 48, INK, 'right', 900, DISP, 0, l3, 48, 'condensed'); txt(g, 'AT', P[2][0] - 12 - w6 - 12, (P[3][1] + P[2][1]) / 2 + 4, 48, INK, 'right', 900, DISP, 0, l3, 48, 'condensed'); txt(g, '100%', P[2][0] - 26 - wa, (P[3][1] + P[2][1]) / 2 + 4, 48, INK, 'right', 900, DISP, 0, l3, 48, 'condensed'); }
    });
    var tg = fin(t, K.fills + .95, 5);
    if (tg > 0) onprop(function () { tag(g, 'EXAMPLE NIGHT', (G.x0 + G.x1) / 2, G.y1 - 38, tg, 0, G.x1 - G.x0 - 30, INK, 'rgba(255,248,228,.92)', 32); });
  }
  function roomScene(g, t) {
    var d = dawn(t);
    if (LAYER === 'bg') {
      wallBG(g, 0, [lerp(12, 46, d * .7), lerp(15, 36, d * .7), lerp(26, 44, d * .7)]);
      standBG(g, .25 + .5 * d, NT2);
      return;
    }
    var hero = eio(seg(t, K.fills + .5, K.fills + 1));
    /* the window and the moon: one continuous sky, 604 px wide; the moon rises at the left and arcs across */
    var sky = skyCol(t), gr = g.createLinearGradient(0, WIN.y0, 0, WIN.y1); gr.addColorStop(0, sky[0]); gr.addColorStop(1, sky[1]);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(WIN.x0 + 8, WIN.y0 + 10, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
    g.fillStyle = gr; g.fillRect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
    g.save(); g.beginPath(); g.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0); g.clip();
    var rs = mulberry(808); for (var i = 0; i < 30; i++) { var sx = WIN.x0 + rs() * (WIN.x1 - WIN.x0), sy = WIN.y0 + rs() * (WIN.y1 - WIN.y0); g.fillStyle = 'rgba(244,237,224,' + ((.35 + .4 * rs()) * (1 - d) * (.7 + .3 * Math.sin(t * 3 + i))).toFixed(3) + ')'; el(g, sx, sy, 2.4, 2.4); }
    var mk2 = .3 * seg(t, K.night - .6, K.pause) + .7 * seg(t, K.pause, K.full + .4), ma = lerp(Math.PI * 1.16, Math.PI * 1.86, mk2), mx = 410 + 300 * Math.cos(ma), my = 690 + 200 * Math.sin(ma);
    g.fillStyle = mixc(hex(CREAM), [250, 220, 190], d); cut(g, ring(mx, my, 40), mulberry(61), 1.5);
    g.fillStyle = sky[0]; cut(g, ring(mx + 17, my - 10, 34), mulberry(62), 1.2);
    if (d > 0) { var dg = g.createRadialGradient(410, WIN.y1 + 40, 10, 410, WIN.y1 + 40, 380); dg.addColorStop(0, 'rgba(255,214,170,' + (.55 * d).toFixed(3) + ')'); dg.addColorStop(1, 'rgba(255,214,170,0)'); g.fillStyle = dg; g.fillRect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0); }
    g.restore();
    g.strokeStyle = '#59606f'; g.lineWidth = 12; g.strokeRect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
    g.lineWidth = 8; g.beginPath(); g.moveTo((WIN.x0 + WIN.x1) / 2, WIN.y0); g.lineTo((WIN.x0 + WIN.x1) / 2, WIN.y1); g.stroke();
    /* the clock chip at the window's foot, tagged EXAMPLE NIGHT until the glass takes the tag */
    var tc = timeChip(t), fl = seg(t, tc.t0, tc.t0 + .16), fls = tc.t0 > K.night ? Math.abs(Math.cos(Math.PI * fl)) : 1;
    chip(g, tc.text, 250, 640, { px: 58, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 14, s: 1 + .12 * (1 - fls), a: 1, maxw: 290, rot: -.01 });
    var wt = 1 - seg(t, K.fills + .5, K.fills + .7);
    if (wt > 0) { var ex1 = EXITING; if (wt < 1) EXITING = true; tag(g, 'EXAMPLE NIGHT', 540, 642, wt, 0, 320, CREAM, 'rgba(16,22,28,.92)', 34); EXITING = ex1; }
    /* the column, then the phone in its dock and the alarm clock on the nightstand */
    var C = lerpC(CR, CH, hero), ring2 = seg(t, K.unplug - .05, K.unplug + .08) * (1 - seg(t, K.SL + .55, K.SL + .95));
    var buzz = ring2 > 0 ? Math.sin(t * 70) * 3 * ring2 : 0;
    var P = { cx: RP.cx + buzz, cy: RP.cy, s: RP.s, rot: RP.rot };
    var lvl = roomFill(t);
    g.fillStyle = '#6b4a33'; poly(g, [[146, 1414], [266, 1414], [256, 1380], [156, 1380]]); g.fill();
    var bp = t >= K.SL + .3 ? clamp(sp(t, K.SL + .3, 3.2, .55), 0, 1.25) : 0;
    phone(g, P, { rim: .75, halo: .6, name: 'phone in dock', screen: function (s) {
      lockScreen(s, t, 1, clamp(lvl / 100, .1, 1));
      if (bp > 0) {   /* a big full battery pops onto the screen once the fill is at 100 */
        s.save(); s.translate(0, 40); s.scale(bp, bp); s.strokeStyle = CREAM; s.lineWidth = 16; rr(s, -120, -64, 240, 128, 26); s.stroke();
        s.fillStyle = CREAM; rr(s, 128, -26, 22, 52, 8); s.fill(); s.fillStyle = FILL2; rr(s, -100, -44, 200, 88, 14); s.fill();
        s.fillStyle = INK; poly(s, [[12, -40], [-30, 8], [-2, 8], [-14, 42], [30, -8], [2, -8]]); s.fill(); s.restore();
      }
    } });
    g.fillStyle = '#8a6244'; poly(g, [[140, 1414], [272, 1414], [262, 1392], [150, 1392]]); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(140, 1408, 132, 6);
    cord(g, [262, 1402], jackOf(C), 1, 20);
    if (ring2 > 0) { g.save(); g.globalAlpha *= ring2; g.strokeStyle = CREAM; g.lineWidth = 5; [P.cx - 92, P.cx + 92].forEach(function (x, j) { for (var q = 0; q < 2; q++) { g.beginPath(); g.arc(x, RP.cy - 40, 18 + q * 16, j ? -.9 : Math.PI - .9, j ? .9 : Math.PI + .9); g.stroke(); } }); g.restore(); }
    alarmClock(g, 394, NT2, t, ring2, seg(t, K.SL + 1.0, K.SL + 1.05) * (1 - seg(t, K.SL + 1.35, K.SL + 1.4)));
    /* "plugged in": a paper hand comes down and taps the phone awake (a ring round the screen) */
    var hi = eout(seg(t, K.n11 + .1, K.plugged - .05)) * (1 - eio(seg(t, K.plugged + .35, K.plugged + .95)));
    if (hi > 0) {
      var tp = Math.sin(Math.PI * seg(t, K.plugged - .1, K.plugged + .15)), exh = EXITING; EXITING = true;
      g.save(); g.translate(314 - 160 * (1 - hi) + 10 * Math.sin(t * 4), 946 - 330 * (1 - hi) + 70 * tp); g.rotate(-Math.PI / 2 + .25); g.scale(1.5, 1.5); hand(g); g.restore();
      EXITING = exh;
    }
    var rk = seg(t, K.plugged, K.plugged + .45);
    if (rk > 0 && rk < 1) { g.strokeStyle = 'rgba(244,237,224,' + (.9 * (1 - rk)).toFixed(3) + ')'; g.lineWidth = 6; g.beginPath(); g.ellipse(RP.cx, RP.cy, 70 + 110 * rk, 140 + 70 * rk, 0, 0, 6.283); g.stroke(); }
    var pegK = eio(seg(t, K.unplug - .02, K.RISE + .02)), slap = Math.max(0, 1 - Math.abs(t - K.SL) / .25) * (t >= K.SL - .03 ? 1 : 0);
    var moving = t < K.n80e - .05 || (t > K.RISE && t < K.SL + .1);
    /* the hold: the column pushes in 3 % (anchored on the nightstand) */
    var pin = 1 + .03 * sio(seg(t, K.SL + .15, S('set').t0 - TW)), pcx = C.x + C.w / 2;
    g.save(); g.translate(pcx, NT2); g.scale(pin, pin); g.translate(-pcx, -NT2);
    column(g, C, { lvl: lvl, wav: moving ? 5 : 2 + 1.5 * Math.sin(t * 1.3), bub: moving ? 1 : .35, nums: 1 - seg(t, K.fills + .3, K.fills + .55), ticks: 1 - hero, title: 1, peg: pegK, slap: clamp(slap, 0, 1), rim: .95 }, t);
    history(g, C, t);
    g.restore();
    /* 80% beside the peg, with the source's hedge, from the frame the fill lands on it; peeled off before the fill moves on */
    var la = fin(t, K.n80e, 4), lo = seg(t, K.fills + .28, K.fills + .58);
    if (la > 0 && lo < 1) labelSheet(g, ['80% CHARGE', '“…IN CERTAIN SITUATIONS.”'], 'APPLE', 108, 716, 484, la, C, 80, 1371, [64, 46], lo);
    /* the routine: a paper calendar, 14 squares filling one a day */
    var ca = fin(t, K.learn - .05, 4) * (1 - eio(seg(t, K.fills + .28, K.fills + .58)));
    if (ca > 0) calendar(g, 108, 930, t, ca);
    /* the hero: Pixel's own sentence */
    quote(g, 108, 716 + drift(t, 2.4, .3), 372, ['“…ADAPTIVE', 'CHARGING MAY', 'TURN ON TO', 'CHARGE TO 100%', 'ONE HOUR BEFORE', 'YOU UNPLUG.”'], 44, 'GOOGLE PIXEL HELP', 1381, seg(t, K.fills + .6, K.fills + .82), 0, false);
  }
  /* a paper label beside the column with a leader to the level it names; `out` peels it off (lifts, tilts, drops) */
  function labelSheet(g, lines, credit, x0, y0, w, a, C, v, seed, px, out) {
    var h = 30 + px[0] * 1.15 + px[1] * 1.15 + 54, ex = EXITING, eo = eio(clamp(out || 0, 0, 1)); if (a < 1 || eo > 0) EXITING = true;
    g.save(); g.globalAlpha *= clamp(a, 0, 1) * (1 - eo); g.translate(40 * (1 - clamp(a, 0, 1)), 0);
    if (eo > 0) { g.translate(x0, y0 + h); g.rotate(-.1 * eo); g.translate(-x0, -(y0 + h)); g.translate(-70 * eo, 60 * eo); }
    sheet(g, x0, y0, x0 + w, y0 + h, seed, PAPER, 'label');
    onprop(function () {
      txt(g, lines[0], x0 + 26, y0 + 18 + px[0] * .6, px[0], INK, 'left', 900, DISP, w - 52, 1, 44, 'condensed');
      txt(g, lines[1], x0 + 26, y0 + 22 + px[0] * 1.15 + px[1] * .6, px[1], INK, 'left', 800, DISP, w - 52, 1, 36, 'condensed');
      txt(g, credit, x0 + 26, y0 + h - 30, 36, '#5d564c', 'left', 800, DISP, w - 52, 1, 36, 'condensed');
    });
    var ly = colY(C, v), sx = x0 + w, sy = y0 + 30;
    g.strokeStyle = CREAM; g.lineWidth = 4; g.beginPath(); g.moveTo(sx, sy); g.lineTo(C.x - 82, ly); g.stroke();
    g.fillStyle = CREAM; el(g, C.x - 82, ly, 7, 7);
    EXITING = ex; g.restore();
  }
  function calendar(g, x0, y0, t, a) {
    var ex = EXITING; if (a < 1) EXITING = true;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(40 * (1 - clamp(a, 0, 1)), 0);
    var w = 484, h = 182; sheet(g, x0, y0, x0 + w, y0 + h, 1391, PAPER, 'calendar');
    var s0 = K.learn + .05;
    for (var i = 0; i < 14; i++) {
      var cx = x0 + 22 + i * 32.6, cy = y0 + 22, k = seg(t, s0 + i * .15, s0 + i * .15 + .09), pk = Math.sin(Math.PI * seg(t, s0 + i * .15, s0 + i * .15 + .16));
      g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(cx, cy - 4 * pk, 26, 26);
      if (k > 0) { g.fillStyle = INK; g.fillRect(cx + 4, cy + 4 - 4 * pk, 18, 18 * k); }
    }
    onprop(function () { txt(g, 'LEARNS FOR', x0 + 22, y0 + 78, 44, INK, 'left', 900, DISP, 0, 1, 44, 'condensed'); txt(g, 'ABOUT 14 DAYS', x0 + 22, y0 + 120, 44, INK, 'left', 900, DISP, 0, 1, 44, 'condensed'); txt(g, 'APPLE, GOOGLE', x0 + 22, y0 + 158, 36, '#5d564c', 'left', 800, DISP, w - 44, 1, 36, 'condensed'); });
    EXITING = ex; g.restore();
  }

  /* =====================================================================================================
     LAYOUT D: into the phone. A re-created, generic settings screen with each maker's own path.
     ===================================================================================================== */
  function setScene(g, t) {
    if (LAYER === 'bg') { wallBG(g, .2); return; }
    var k = eout(seg(t, K.check - .75, K.check + .15)), sc = lerp(.86, 1, k) + .008 * seg(t, K.check + .35, K.end);
    g.save(); g.translate(510, 950); g.scale(sc, sc); g.translate(-510, -950);
    var x0 = 124, y0 = 476, x1 = 896, y1 = 1420;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 12, y0 + 16, x1 - x0, y1 - y0, 70); g.fill();
    g.fillStyle = PHB; rr(g, x0, y0, x1 - x0, y1 - y0, 70); g.fill();
    prop(g, 'settings phone', x0, y0, x1, y1);
    g.fillStyle = '#efe8db'; rr(g, x0 + 22, y0 + 22, x1 - x0 - 44, y1 - y0 - 44, 52); g.fill();
    rr(g, x0 + 22, y0 + 22, x1 - x0 - 44, y1 - y0 - 44, 52); grainIn(g, x0 + 22, y0 + 22, x1 - x0 - 44, y1 - y0 - 44, 1401, .6);
    onprop(function () { txt(g, 'Settings › Battery', x0 + 60, y0 + 92, 52, INK, 'left', 900, DISP, 460, 1, 40, 'condensed'); });
    var CARDS = [['iPHONE', '› Charging', 'Optimized Battery Charging', K.check - .55],
                 ['PIXEL', '› Battery health', '› Charging optimization', K.check - .42],
                 ['GALAXY', '› Battery protection', '› Adaptive', K.check - .29]];
    CARDS.forEach(function (c, i) {
      var a = fin(t, c[3], 4.5), cy = y0 + 160 + i * 248;
      if (a <= 0) return;
      g.save(); g.globalAlpha *= a; g.translate(0, 40 * (1 - a)); var ex = EXITING; if (a < 1) EXITING = true;
      g.fillStyle = 'rgba(0,0,0,.12)'; rr(g, x0 + 50, cy + 6, x1 - x0 - 100, 222, 26); g.fill();
      g.fillStyle = '#fbf7ef'; rr(g, x0 + 46, cy, x1 - x0 - 92, 222, 26); g.fill();
      onprop(function () {
        txt(g, c[0], x0 + 80, cy + 50, 50, INK, 'left', 900, DISP, 600, 1, 40, 'condensed');
        txt(g, c[1], x0 + 80, cy + 112, 40, '#4b4540', 'left', 800, DISP, x1 - x0 - 160, 1, 36, 'condensed');
        txt(g, c[2], x0 + 80, cy + 170, 42, INK, 'left', 900, DISP, x1 - x0 - 160, 1, 36, 'condensed');
      });
      /* a neutral chevron: a path to follow, no on/off state (the choices differ by maker) */
      g.strokeStyle = INK; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x1 - 118, cy + 80); g.lineTo(x1 - 92, cy + 111); g.lineTo(x1 - 118, cy + 142); g.stroke(); g.lineCap = 'butt'; g.lineJoin = 'miter';
      EXITING = ex; g.restore();
    });
    g.restore();
    onprop(function () { tag(g, 'RE-CREATED', 736, 568, k, 0, 260, INK, '#efe8db', 34); });
  }

  /* =====================================================================================================
     THE END: frame 0's room, lamp on, YES / NO; the phone glides back to frame 0's place by the cut
     ===================================================================================================== */
  function endScene(g, t) {
    if (LAYER === 'bg') { wallBG(g, 1); standBG(g, 1); return; }
    var u = sio(seg(t, TEND - .55, TEND)), P = lerpPose(ENDP, F0A, u);
    P.cy += drift(t, .3, .5) * (1 - seg(t, TEND - .8, TEND - .55));
    pullCord(g, 99, 1);
    var C = { x: CA.x, w: CA.w, y0: CA.y0, base: CA.base }; C.y0 += drift(t - TEND, 1.3, .25);
    var E0 = S('end').t0, kc = eout(seg(t, E0, E0 + .12)), sc0 = lerp(1.06, 1, kc);
    /* YES / NO sit above the phone's path, so the glide back to frame 0 never crosses them; they shrink away before the cut */
    var yo = eio(seg(t, K.noEnd + .08, K.noEnd + .24));
    [['YES', 330], ['NO', 640]].forEach(function (c) {
      var tq0 = c[0] === 'YES' ? K.yes : K.noE, tp = Math.sin(Math.PI * seg(t, tq0 - .03, tq0 + .15)), sc = sc0 * (1 - .07 * tp) * (1 - yo);
      if (sc <= .01) return;
      var oc = ONPROP, ex0 = EXITING; ONPROP = yo > 0 || kc < 1; EXITING = ex0 || yo > 0; chip(g, c[0], c[1], 566 + 8 * tp, { px: 110, wt: 900, bg: BG, line: HOT, lw: 8, fg: HOT, w: 218, h: 156, r: 54, shadow: true, a: 1 - seg(yo, .5, .9), s: sc, maxw: 218 }); ONPROP = oc; EXITING = ex0;
    });
    cord(g, portOf(P), jackOf(C), 1, 90);
    column(g, C, { lvl: aFill(t - TEND) + .6 * Math.sin((t - TEND) * 2.1), wav: 3, bub: 1, shade: 0, rim: .9, peg: null, glow: 1 }, t - TEND);
    casedPhone(g, P, { shade: 0, rim: .7, halo: 1, screen: function (s) { lockScreen(s, t, 1, aFill(t - TEND) / 100 + .2); } }, { k: 1, shade: 0 });
    var ck = pop(t, TEND - .8, 3), exk = EXITING; if (ck < .999) EXITING = true;
    if (ck > 0) sticker(g, P, Math.min(1, ck), 0, t);
    EXITING = exk;
  }
  /* a time card / label chip slapped down (full opacity from its first frame) */
  function slapCard(g, text, x, y, t, t0, px, maxw) {
    if (t < t0 - .08) return;
    var k = eout(seg(t, t0 - .08, t0)), sc = lerp(1.3, 1, k), ex = EXITING; if (k < 1) EXITING = true;
    chip(g, text, x, y - 20 * (1 - k), { px: px || 52, wt: 900, bg: CREAM, fg: INK, r: 16, st: 'condensed', rot: .015, s: sc, a: seg(t, t0 - .08, t0 - .05), maxw: maxw || 820 });
    EXITING = ex;
  }
  /* ---------- captions: the narrator's words in phrase cards (one size); stressed words get a cream pill (never coral) ---------- */
  var CAPGROUPS = { hook: [[3, 3]], ask: [[4, 3]], wear: [[2, 3], [2, 4]], pillow: [[4, 4]], dip: [[4, 4]], open: [[2, 3], [5]], night: [[2], [3, 2]], pause: [[3, 4]], learn: [[4]], full: [[4, 4]], check: [[2, 3]], end: [[3, 3], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', "doesn't"], ['ask', 'ruin'], ['wear', 'heat'], ['wear', 'hours'], ['pillow', 'trapped'], ['dip', 'good'], ['open', 'open'], ['night', '11'], ['pause', '80'], ['learn', 'routine'], ['full', 'unplug'], ['check', 'battery'], ['end', 'wait']]
    .map(function (p) { return at(p[0], p[1]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPPX = 52, CAPMIN = 1e9;
  function capStart(c) { return c.t0 - .04; }
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= capStart(c)) { card0 = c; ci = i; } });
    if (!card0) return;
    var s = capStart(card0), nx = CAPS[ci + 1], ns = nx ? capStart(nx) : 1e9;
    var keep = nx && ns - card0.t1 < 2.4;
    var o1 = !nx ? DUR + 9 : keep ? ns - .04 : Math.min(card0.t1 + .5, ns - .04), o0 = o1 - .1;   /* the last card holds to the cut */
    var fi = seg(t, s, s + .08), out = 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - s, 3.2, .8), 0, 1.04);
    g.save(); var cpx = CAPPX; font(g, cpx, 800, DISP, 'semi-expanded');
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = cpx * .3, maxw = 820, lines = [], lw, wi = 0;
    card0.split.forEach(function (n) { var ln = [], w = 0; for (var j = 0; j < n; j++, wi++) { if (w + ws[wi] > maxw && ln.length) { lines.push(ln); ln = []; w = 0; } ln.push(wi); w += ws[wi] + gap; } lines.push(ln); });
    lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    var lh = cpx * 1.18, y0 = 308 + cpx * .9;   /* pill tops at y ≥ 304; two lines end by y 446, clear of every prop (y ≥ 465) */
    g.globalAlpha = fi * out * (alpha == null ? 1 : alpha);
    NOREC = true;
    lines.forEach(function (ln, li) {
      var x = CX - (lw[li] - gap) / 2, y = y0 + li * lh + (1 - Math.min(1, k)) * 26;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .2;
        if (cur) { g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 12, y - cpx * .87, ws[i] + 24, cpx * 1.15, 18); g.fill(); CAPMIN = Math.min(CAPMIN, y - cpx * .87); }
        g.fillStyle = cur ? BG : CREAM;
        g.fillText(w.w, x, y); x += ws[i] + gap;
        CAPMIN = Math.min(CAPMIN, y - cpx * .74);
      });
    });
    NOREC = false;
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SCENES = { standScene: standScene, bedScene: bedScene, topScene: topScene, roomScene: roomScene, setScene: setScene, endScene: endScene };
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(56,78,108,.2)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function safeClip(g) { g.beginPath(); g.rect(SAFE_BOX.x0, SAFE_BOX.y0, SAFE_BOX.x1 - SAFE_BOX.x0, SAFE_BOX.y1 - SAFE_BOX.y0); g.clip(); }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  var LAYER = 'fg';
  function drawScene(g, Sc, t, layer) { var o = LAYER, oc = CUR; LAYER = layer || 'fg'; CUR = Sc.id; g.save(); SCENES[Sc.fn](g, t); g.restore(); LAYER = o; CUR = oc; }
  /* the background layer (hills, clouds, fog, seats, the wipe's cloud bank) bleeds across the full width and down past
     the box; its top edge fades in over y 302–372 so nothing is ever sliced flat. Props and words stay inside the rail. */
  var LCV = null, LCTX = null, FADE = null;
  function bgLayer(g, fn) {
    if (!LCV) { LCV = mk(W, H); LCTX = LCV.getContext('2d'); FADE = LCTX.createLinearGradient(0, 296, 0, 372); FADE.addColorStop(0, 'rgba(0,0,0,0)'); FADE.addColorStop(1, 'rgba(0,0,0,1)'); }
    var l = LCTX; l.setTransform(1, 0, 0, 1, 0, 0); l.globalAlpha = 1; l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, W, H);
    fn(l);
    l.setTransform(1, 0, 0, 1, 0, 0); l.globalAlpha = 1; l.globalCompositeOperation = 'destination-in'; l.fillStyle = FADE; l.fillRect(0, 0, W, H); l.globalCompositeOperation = 'source-over';
    g.drawImage(LCV, 0, 0);
  }
  function fullScene(g, Sc, t) {
    bgLayer(g, function (l) { drawScene(l, Sc, t, 'bg'); });
    g.save(); safeClip(g); drawScene(g, Sc, t, 'fg'); g.restore();
  }
  /* the wipe: a blank dark panel (no numbers, no words) slides across the whole frame, right → left; behind it the next
     scene is already built. Dark slate, so nothing outside the rail reads as a prop. */
  function roll(g, xb, t) {
    var w = 440, x0 = xb - w / 2;
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x0 - 26, 0, 26, H);
    g.fillStyle = SLATE; g.fillRect(x0, 0, w, H);
    g.fillStyle = SLATE2; g.fillRect(x0 + 34, 0, 10, H); g.fillRect(x0 + w - 44, 0, 10, H);
    g.fillStyle = 'rgba(0,0,0,.18)'; rr(g, x0 + w / 2 - 16, 860, 32, 220, 16); g.fill();
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var wk = Nx && !Nx.cut ? seg(te, Nx.t0 - TW, Nx.t0) : 0;
    if (wk > 0) {
      var dir = Nx.dir || 1, e = eio(wk), xb = dir > 0 ? lerp(W + 280, -280, e) : lerp(-280, W + 280, e);
      var nr = NOREC; NOREC = wk < .4; fullScene(g, Nx, t); NOREC = nr;
      g.save(); EXITING = true; NOREC = true;
      g.beginPath(); if (dir > 0) g.rect(-10, 0, xb + 10, H); else g.rect(xb, 0, W - xb + 10, H); g.clip();
      stage(g); fullScene(g, Sc, t);
      g.restore();
      bgLayer(g, function (l) { roll(l, xb, t); });
      EXITING = false; NOREC = nr;
    } else fullScene(g, Sc, t);
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) captions(g, t, 1);
    /* frame 0's tension: about 20 % more contrast while the lamp is on, eased out on the pull cord and back in for the loop */
    var cst = 1 + .2 * (t < 4 ? 1 - seg(t, K.HK - .02, K.HK + .3) : seg(t, TEND - .7, TEND - .15));
    if (cst > 1.002) { if (!CCV) { CCV = mk(W, H); CCX = CCV.getContext('2d'); } CCX.clearRect(0, 0, W, H); CCX.drawImage(g.canvas, 0, 0); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'contrast(' + cst.toFixed(3) + ')'; g.drawImage(CCV, 0, 0); g.restore(); }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null, CCV = null, CCX = null;
  function posterTitle(g) {
    /* the poster: the hero hold with the title in the caption's place */
    g.save(); font(g, 54, 800, DISP, 'semi-expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('Does charging overnight', CX, 362);
    var b = 'ruin your battery?', bp = 62; font(g, bp, 800, DISP, 'expanded');
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 436 - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 436); g.restore();
  }
  function TEXTS(t) {
    REC = {}; frame(tctx, t); var r = REC; REC = null;
    return Object.keys(r).map(function (k) { return { id: k, text: k, x0: 0, y0: 0, x1: 0, y1: 0 }; });
  }

  /* ---------- events: the sound design reads the same word times; hits sit between words, never on them ---------- */
  var EV = [];
  /* the SFX gate (vo/heard.js, written from the finished mix): a hit's whole body keeps clear of every word start and end
     that unhinted faster-whisper base.en and small.en heard in the mix, and of every stretch where the voice-only track is
     at or above −40 dBFS. Without heard.js the vo.js word times stand in. */
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
  function nearGap(t, type, m) {
    var body = BODY[type] || .12, best = null;
    free(m || .19).forEach(function (f) {
      var lo = f[0], hi = f[1] - body; if (hi < lo) return;
      var c = clamp(t, lo, hi); if (best === null || Math.abs(c - t) < Math.abs(best - t)) best = c;
    });
    return best;
  }
  /* the hero stays the loudest hit but sits ≥ 3 dB under the voice's next peak */
  var GAIN = { hk: .16, pw: .03, dp: .05, fl: .11, ck: .14, sl: .11 };
  var TYPE = { hk: 'click', pw: 'thump', dp: 'thump', fl: 'paper', ck: 'knock', sl: 'slap' };
  function initTimes() {
    Object.keys(TYPE).forEach(function (n) { if (GT[n] != null) EV.push({ t: +GT[n].toFixed(3), type: TYPE[n], g: GAIN[n], id: n, t1: +(GT[n] + BODY[TYPE[n]]).toFixed(3) }); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (t < 2 / (fps || 30) - 1e-6 || t > TEND - .2) samples = 1;   /* frame 0 and the frames into the loop: sharp, no ghosting */
    if (samples === 1) { POSTERMODE = t === window.FILM.POSTER; frame(ctx, t); POSTERMODE = false; return; }
    var span = (shutter || .5) / (fps || 30); EDGE_T = t;
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    EDGE_T = null; ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- sound: foley cut to the word times; no music (Isac adds a TikTok sound) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 32;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -3; comp.ratio.value = 2; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * .9), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 5); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .1; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function band(t, dur, f, q, peak, att, send, pan) { var n = noise(t, dur), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; var ob = bus(1, send || 0, pan); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + (att || .002), peak], [t + dur, 0]]); }
    /* THE hit: a rubber stamp slammed on paper on a desk. Body 250 → 170 Hz and a 330 Hz knock (where a phone speaker
       still plays), with a paper slap at 1.5–2.5 kHz on top so it reads on a phone */
    function stampThump(t, g, lb) {
      g = g || 1; lb = lb == null ? 1 : lb;   /* lb: the low body's share; the dip's thump keeps the 1.5–3 kHz paper slap and loses most of the boom */
      var o = osc('sine', 230, t, t + .2, 1, [[t, 0], [t + .012, .3 * g * lb], [t + .12, .26 * g * lb], [t + .19, 0]], .05); o.frequency.exponentialRampToValueAtTime(160, t + .18);
      osc('triangle', 330, t, t + .14, 1, [[t, 0], [t + .004, .22 * g * Math.sqrt(lb)], [t + .06, .15 * g * Math.sqrt(lb)], [t + .13, 0]], .03);
      band(t, .16, 1500, .8, 5.2 * g, .006, .05);
      band(t, .11, 2400, 1.0, 3.6 * g, .004, .03);
      band(t + .001, .18, 1900, .6, 5.0 * g, .008, .04);
      band(t + .012, .07, 2900, 1.4, 2.2 * g, .002, .02);
    }
    /* a cloud bank passing: a soft paper whoosh, band 700 → 2200 → 900 Hz, 0.2 s, dry (no reverb tail into the words) */
    function swishS(t, g) {
      g = g || 1; var n = noise(t, .22), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .7;
      bp.frequency.setValueAtTime(700, t); bp.frequency.exponentialRampToValueAtTime(2200, t + .1); bp.frequency.exponentialRampToValueAtTime(900, t + .2);
      var ob = bus(1, 0, 0); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .07, 1.1 * g], [t + .13, .9 * g], [t + .2, 0]]);
    }
    /* a flat paper slap (a card landing) */
    function slapS(t, g) { g = g || 1; band(t, .06, 1600, .7, 5.5 * g, .001, .04); band(t, .03, 2800, 1.2, 3 * g, .001, .02); }
    /* fog sliding in: a soft paper hiss, 2.6 → 1.3 kHz */
    function paperS(t, g) {
      g = g || 1; var n = noise(t, .17), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .8; bp.frequency.setValueAtTime(2600, t); bp.frequency.exponentialRampToValueAtTime(1300, t + .16);
      var ob = bus(1, .04, 0); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .03, 1.2 * g], [t + .12, .7 * g], [t + .17, 0]]);
    }
    /* a small knock with a 1–3 kHz click */
    function knockS(t, g) {
      g = g || 1;
      osc('triangle', 360, t, t + .13, 1, [[t, 0], [t + .003, .5 * g], [t + .05, .25 * g], [t + .12, 0]], .03);
      osc('sine', 2650, t, t + .07, 1, [[t, 0], [t + .002, .35 * g], [t + .06, 0]], .02);
      band(t, .05, 1900, 1.2, 3.2 * g, .001, .03);
      band(t, .025, 2600, 1.4, 2.4 * g, .001, .02);
    }
    /* a switch: a short dry click */
    function clickS(t, g) { g = g || 1; band(t, .018, 2300, 2, 5 * g, .0008, .01); band(t + .03, .02, 1700, 2, 3 * g, .0008, .01); osc('sine', 3100, t, t + .04, 1, [[t, 0], [t + .001, .25 * g], [t + .035, 0]], .01); }
    /* a chip tapping down: one soft paper tick */
    function tickS(t, g) { g = g || 1; band(t, .03, 3000, 1.6, 3.5 * g, .001, .02); band(t, .04, 1400, 1.5, 1.2 * g, .001, .02); }
    /* the signal ring / the call chime: soft sine pings (the ring rises in three steps, the chime is one bell tone) */
    function ringS(t, g) { g = g || 1; [1320, 1760, 2350].forEach(function (f, j) { var t0 = t + j * .035; osc('sine', f, t0, t0 + .07, 1, [[t0, 0], [t0 + .004, .3 * g], [t0 + .065, 0]], .06, -.2 + j * .2); }); }
    function chimeS(t, g) { g = g || 1; osc('sine', 1245, t, t + .13, 1, [[t, 0], [t + .004, .32 * g], [t + .03, .2 * g], [t + .125, 0]], .1); osc('sine', 2490, t, t + .08, 1, [[t, 0], [t + .003, .08 * g], [t + .07, 0]], .05); }
    /* a paper ticket torn in two: a crackle of short 1.2–3.6 kHz bursts over a soft tearing hiss */
    function ripS(t, g) {
      g = g || 1; var r2 = mulberry(91), tt = t;
      for (var i = 0; i < 9; i++) { band(tt, .018, 1200 + r2() * 2400, 1.6, (2.2 + r2() * 1.6) * g, .001, .01); tt += .012 + r2() * .022; }
      var n = noise(t, .22), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .9; bp.frequency.setValueAtTime(1800, t); bp.frequency.linearRampToValueAtTime(3000, t + .2);
      var ob = bus(1, .02, 0); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .02, .9 * g], [t + .16, .6 * g], [t + .22, 0]]);
    }
    /* a felt marker drawn round in one stroke: a squeaky band of noise, 2.2 → 3.2 → 2.6 kHz, with a stroke-speed flutter */
    function markerS(t, g) {
      g = g || 1; var n = noise(t, .3), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2;
      bp.frequency.setValueAtTime(2200, t); bp.frequency.linearRampToValueAtTime(3200, t + .14); bp.frequency.linearRampToValueAtTime(2600, t + .28);
      var ob = bus(1, .02, 0); n.connect(bp); bp.connect(ob);
      var pts = [[t, 0]]; for (var i = 1; i <= 14; i++) pts.push([t + i * .02, (i % 2 ? 1.6 : 1.0) * g * (i > 12 ? .4 : 1)]); pts.push([t + .3, 0]); env(ob.gain, pts);
    }
    /* the same card fails: a dull two-pulse buzz (118 Hz square through a low-pass) with a 1.8 kHz edge for phone speakers */
    function buzzS(t, g) {
      g = g || 1;
      [0, .09].forEach(function (o) {
        var t0 = t + o, os = ac.createOscillator(), lp = ac.createBiquadFilter(), og = ac.createGain();
        os.type = 'square'; os.frequency.value = 118; lp.type = 'lowpass'; lp.frequency.value = 1400;
        os.connect(lp); lp.connect(og); og.connect(bus(1, .02, 0)); env(og.gain, [[t0, 0], [t0 + .006, .2 * g], [t0 + .07, .16 * g], [t0 + .09, 0]]);
        os.start(t0); os.stop(t0 + .1);
        band(t0, .08, 1800, 1.2, 1.6 * g, .004, .02);
      });
    }
    /* a door chain pulled taut: seven bright metal clinks (inharmonic pairs, 2.6–4.8 kHz) over 0.25 s */
    function rattleS(t, g) {
      g = g || 1; var r2 = mulberry(57), tt = t;
      for (var i = 0; i < 7; i++) {
        var f = 2600 + r2() * 2200, a = (.16 + r2() * .1) * g;
        osc('sine', f, tt, tt + .07, 1, [[tt, 0], [tt + .001, a], [tt + .06, 0]], .05, -.3 + r2() * .6);
        osc('sine', f * 1.47, tt, tt + .05, 1, [[tt, 0], [tt + .001, a * .6], [tt + .045, 0]], .04);
        band(tt, .02, 4200, 2, 1.4 * g, .001, .02);
        tt += .02 + r2() * .03;
      }
    }
    /* the needle hitting its stop: a short bright metal clink (3.1 + 4.6 kHz) */
    function clinkS(t, g) { g = g || 1; osc('sine', 3100, t, t + .09, 1, [[t, 0], [t + .001, .3 * g], [t + .085, 0]], .05); osc('sine', 4620, t, t + .06, 1, [[t, 0], [t + .001, .18 * g], [t + .055, 0]], .04); band(t, .02, 3800, 2, 1.6 * g, .001, .02); }
    EV.forEach(function (e) {
      if (e.type === 'clink') clinkS(e.t, e.g);
      else if (e.type === 'buzz') buzzS(e.t, e.g);
      else if (e.type === 'rattle') rattleS(e.t, e.g);
      else
      if (e.type === 'thump') stampThump(e.t, e.g, .2);
      else if (e.type === 'swish') swishS(e.t, e.g);
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'paper') paperS(e.t, e.g);
      else if (e.type === 'knock') knockS(e.t, e.g);
      else if (e.type === 'click') clickS(e.t, e.g);
      else if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'rip') ripS(e.t, e.g);
      else if (e.type === 'marker') markerS(e.t, e.g);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    /* room tone, about −60 dB, so the loop seam is never digital zero; a little more room under the hero hold */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o);
      
      env(o.gain, [[0, ROOM], [DUR, ROOM]]);   /* flat: a step up under the hero read as a word onset to Whisper */ })();
  }
  var ROOM = .0035;

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    watch(ctx); watch(tctx);
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['800 semi-expanded 84px Archivo', '900 expanded 84px Archivo', '800 expanded 84px Archivo', '900 condensed 84px Archivo', '800 condensed 84px Archivo', '700 condensed 84px Archivo', '900 extra-condensed 84px Archivo', '900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°º×−≈≠µ“”‘’·→…#?‹›✓✕–@!>$(),:§+/=½~'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initTimes();
  /* the hero hold: from the circle closing to the ticket roll that brings frame 0 back */
  var HOLD = { t0: K.SL, t1: S('set').t0 - TW };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round(28.4 * 30) / 30 + 1 / 60, SLUG: 'overnightcharge', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.CLIP_RUN = function (step) {
    var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) {
      PROPS = []; CURT = t; frame(ctx, t);
      PROPS.forEach(function (p) {
        var b = p.b, over = Math.max(SAFE_BOX.x0 - b[0], b[2] - SAFE_BOX.x1, SAFE_BOX.y0 - b[1], b[3] - SAFE_BOX.y1);
        if (over > 1) { var o = out[p.name] || (out[p.name] = { prop: p.name, from: t, to: t, over: 0, n: 0 }); o.to = t; o.n++; o.over = Math.max(o.over, Math.round(over)); }
      });
      PROPS = null;
    }
    return Object.keys(out).map(function (k) { return out[k]; });
  };
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
