/* "Turning off Wi-Fi barely saves battery." — Factory #37 (wifibattery) on Tech, explained, after ../juicejacking/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   All cut paper over a dimmed paper night wallpaper: a giant re-created Control Center Wi-Fi button (blue paper, cream
   fan arcs). The tap drops a gray layer on it; on the twist that layer peels back like a flap and the arcs are still
   there, dashed: NOT OFF (iPHONE · CONTROL CENTER). Strings to AIRDROP and LOCATION SERVICES, a paper alarm clock that
   brings back AUTO-JOIN, a balance (Wi-Fi vs cellular), a re-created Pixel Quick Settings Bluetooth pill and a battery
   with no numbers, a re-created Settings list. Props stay whole inside x 92–928, y 302–1428. */
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
    /* the aligner splits "5 a.m." into "a." + "m.": one word on screen and in the keys */
    var ws = []; l.words.forEach(function (w) { var p = ws[ws.length - 1]; if (p && ((/°$/.test(p.w) && /^F/.test(w.w)) || (p.w === 'a.' && /^m\./.test(w.w)))) { p.w += w.w; p.t1 = w.t1; } else ws.push({ w: w.w, t0: w.t0, t1: w.t1 }); });
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
  var BODY = { thump: .2, knock: .14, slap: .1, paper: .17, pop: .12, tick: .05, click: .06, swish: .21, rip: .24, marker: .3, tear: .15 };
  var GT = {};
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }
  var K = {
    hook: start('hook'), barely: at('hook', 'barely'), hookEnd: lend('hook'),
    ask: start('ask'), button: at('ask', 'button'), askEnd: lend('ask'),
    apple: start('apple'), wifiA: at('apple', 'Wi-Fi'), btw: at('apple', 'Bluetooth'), minimal: at('apple', 'minimal'), connected: at('apple', 'connected.'), appleEnd: lend('apple'),
    keep: start('keep'), keepW: at('keep', 'Keep'), both: at('keep', 'both'), keepEnd: lend('keep'),
    dip: start('dip'), tap: at('dip', 'tap'), offD: at('dip', 'off'), dipEnd: lend('dip'),
    twist: start('twist'), iph: at('twist', 'iPhone,'), btnT: at('twist', 'button'), doesnt: at('twist', "doesn't"), twistEnd: lend('twist'),
    avail: start('avail'), disc: at('avail', 'disconnects.'), available: at('avail', 'available'), airdrop: at('avail', 'AirDrop.'), availEnd: lend('avail'),
    five: start('fiveam'), autojoin: at('fiveam', 'auto-join'), fiveW: at('fiveam', '5'), fiveEnd: lend('fiveam'),
    cell: start('cell'), less: at('cell', 'less'), cellular: at('cell', 'cellular.'), cellEnd: lend('cell'),
    bt: start('bt'), dead: at('bt', 'dead?'), google: at('bt', 'Google'), turnB: at('bt', 'turn'), btB: at('bt', 'Bluetooth'), btoff: at('bt', 'off.'), btEnd: lend('bt'),
    check: start('check'), settings: at('check', 'Settings,'), batteryC: at('check', 'Battery,'), toggles: at('check', 'toggles.'), checkEnd: lend('check'),
    end: start('end'), offE: at('end', 'off?'), yesE: at('end', 'Yes'), noE: at('end', 'no.'), noEnd: wend('end', 'no.')
  };
  (function () {
    place('hk', 'tick', K.hookEnd + .3, .2, K.hookEnd, K.ask);          /* the search card lands */
    place('kp', 'paper', wend('keep', 'advice?') + .3, .2, wend('keep', 'advice?'), K.keepW);
    place('dp', 'thump', K.dipEnd + .3, .2, K.dipEnd, K.twist);         /* the finger presses: the gray layer drops */
    place('tw', 'slap', K.twistEnd + .3, .2, K.twistEnd, K.avail);      /* NOT OFF, the hero stamp, re-pressed */
    place('fa', 'tick', K.fiveEnd + .3, .2, K.fiveEnd, K.cell);         /* the clock's hammer: one dry tick, no ring */
    place('ce', 'pop', K.cellEnd + .3, .2, K.cellEnd, K.bt);            /* the tower's pan lands */
    place('bc', 'click', K.btEnd + .3, .2, K.btEnd, K.check);           /* the Bluetooth pill switches off */
    place('ck', 'click', K.checkEnd + .3, .2, K.checkEnd, K.end);       /* the No Mobile Coverage row, tapped */
  })();
  var TW = .5;
  K.HK = GT.hk != null ? GT.hk : K.hookEnd + .3;
  K.KP = GT.kp != null ? GT.kp : wend('keep', 'advice?') + .3;
  K.DP = GT.dp != null ? GT.dp : K.dipEnd + .3;
  K.TW = GT.tw != null ? GT.tw : K.twistEnd + .3;
  K.FA = GT.fa != null ? GT.fa : K.fiveEnd + .3;
  K.CE = GT.ce != null ? GT.ce : K.cellEnd + .3;
  K.BC = GT.bc != null ? GT.bc : K.btEnd + .3;
  K.CK = GT.ck != null ? GT.ck : K.checkEnd + .3;
  K.ST = K.doesnt;                     /* NOT OFF lands on "doesn't" (silent); the slap re-presses it in the gap after "off." */
  var SC = [
    { id: 'cc', fn: 'ccScene', name: 'The Wi-Fi button: tapped, peeled, not off', t0: 0 },
    { id: 'scale', fn: 'scaleScene', name: 'Wi-Fi vs cellular; Bluetooth for a dying battery', t0: Math.max(at('cell', 'says'), K.fiveW + 3.12), tw: .4 },
    { id: 'set', fn: 'setScene', name: 'Battery usage, the two paths', t0: Math.max(K.check + .7, K.BC + .62), tw: .45 },
    { id: 'end', fn: 'endScene', name: 'Still switching Wi-Fi off?', t0: Math.max(K.end + .56, K.CK + .62), tw: .45 }
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
  var PUNCHX = false;   /* r2: during the 1.06 punch on the turn the wall plug, the cable and the pad's far rim may crop for a moment */
  var CAMONLY = false;   /* the close-up (frame 0, end card): only the phone and its strip are measured; the pipe runs off the frame on purpose */
  function prop(g, name, x0, y0, x1, y1) {
    if (!PROPS || EXITING || (g !== ctx && g !== tctx)) return;
    if (CAMONLY && name !== 'phone') return;
    if (PUNCHX && (name === 'phone slab' || name === 'board' || name === 'gate posts')) return;
    /* a rotated prop is measured as 12 thin vertical strips, so its box follows the tilted outline instead of its corners */
    var m = g.getTransform();
    if (Math.abs(m.b) > .01) { for (var i = 0; i < 12; i++) PROPS.push({ name: name, b: xbox(g, lerp(x0, x1, i / 12), y0, lerp(x0, x1, (i + 1) / 12), y1) }); return; }
    PROPS.push({ name: name, b: xbox(g, x0, y0, x1, y1) })
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
  var SKIN2 = '#c49c78', SKIN3 = '#a98263';
  function hand(g) {
    /* cut paper: a torn sleeve, a fist with the index finger out (pointing left), one flat colour per piece, no outlines */
    var r = mulberry(404);
    g.fillStyle = '#e4dac4'; cut(g, [[10, -40], [150, -46], [156, 44], [6, 40]], r, 3);                 /* this film's sleeve: cream knit */
    g.fillStyle = '#4f7fc4'; g.fillRect(70, -44, 16, 86);                                                 /* one Wi-Fi-blue stripe */
    g.fillStyle = '#cfc3a8'; cut(g, [[8, -42], [40, -44], [40, 42], [4, 42]], r, 1.5);                   /* the ribbed cuff */
    g.strokeStyle = 'rgba(120,104,80,.55)'; g.lineWidth = 3; for (var ri = 0; ri < 5; ri++) { g.beginPath(); g.moveTo(12 + ri * 6.5, -38); g.lineTo(12 + ri * 6.5, 38); g.stroke(); }
    g.fillStyle = SKIN; cut(g, [[14, -34], [-58, -40], [-70, -8], [-66, 36], [14, 34]], r, 2.2);         /* the fist */
    g.fillStyle = SKIN; cut(g, [[-50, -40], [-150, -42], [-156, -26], [-50, -20]], r, 1.6);              /* the index finger */
    g.fillStyle = SKIN2; cut(g, [[-64, -10], [-84, -6], [-84, 6], [-64, 10]], r, 1.2);                   /* curled knuckles */
    cut(g, [[-62, 12], [-80, 16], [-78, 28], [-60, 30]], r, 1.2);
    g.fillStyle = SKIN2; cut(g, [[-14, -34], [-50, -50], [-58, -40], [-20, -26]], r, 1.4);              /* the thumb over the fist */
    g.fillStyle = 'rgba(255,240,220,.4)'; cut(g, [[-146, -39], [-138, -39], [-138, -35], [-146, -35]], r, .6);
  }
  function ring(x, y, r) { var o = []; for (var i = 0; i < 9; i++) { var a = i / 9 * 6.283; o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return o; }
  /* =====================================================================================================
     THE PROPS (all cut paper, all drawn by hand): a dimmed paper night wallpaper, a re-created Control Center Wi-Fi
     button (blue paper, cream fan arcs) whose gray "off" layer peels back like a flap, a Bluetooth button (the word
     BT, no rune), paper tags on strings, a paper alarm clock, a balance, a re-created Pixel Quick Settings pill,
     a battery with no numbers, a re-created Settings list
     ===================================================================================================== */
  var CUR = 'cc';
  var WIFI = '#3d82dc', WIFI2 = '#2e66b2', DIMC = '#3b424f', DIMA = '#5b6472', UNDER = '#22416b', FLAPC = '#d6cdb9';
  var NIGHT0 = '#121a2c', NIGHT1 = '#1d2236', HILL1 = '#19202f', HILL2 = '#151b28', AMBER = '#f0a83a';
  /* loop-safe cycles: anything periodic in the frame-0 picture is a function of ct (t at the start, t − TEND at the end) */
  function cyc(ct, hz, ph) { return Math.sin(6.283 * (ct * hz + (ph || 0))); }

  /* ---------- the wallpaper behind Control Center: a dimmed paper night (hills, a moon, slow clouds, a few stars) ---------- */
  var STARS = null;
  function wallpaper(g, ct, warm, sun) {
    if (!STARS) { var r = mulberry(77); STARS = []; while (STARS.length < 34) { var x = -300 + r() * 1680, y = 300 + r() * 1000; if (x > 250 && x < 770 && y > 380 && y < 980) continue; STARS.push([x, y, 1.5 + r() * 2.5, r()]); } }
    var gr = g.createLinearGradient(0, 0, 0, H);
    warm = warm || 0;
    gr.addColorStop(0, mixc(hex(NIGHT0), hex('#2a2a4a'), warm)); gr.addColorStop(.62, mixc(hex(NIGHT1), hex('#4a3a52'), warm)); gr.addColorStop(1, mixc(hex('#262438'), hex('#8a5a40'), warm));
    g.fillStyle = gr; g.fillRect(-400, -300, W + 800, H + 600);
    if (warm > 0) { var gw = g.createRadialGradient(540, 1500, 50, 540, 1500, 900); gw.addColorStop(0, 'rgba(240,168,58,' + (.32 * warm).toFixed(3) + ')'); gw.addColorStop(1, 'rgba(240,168,58,0)'); g.fillStyle = gw; g.fillRect(-400, 300, W + 800, H); }
    STARS.forEach(function (s) { g.fillStyle = 'rgba(244,237,224,' + (.18 + .3 * (1 + cyc(ct, .35 + s[3] * .4, s[3])) * .5).toFixed(3) + ')'; el(g, s[0], s[1], s[2], s[2]); });
    /* the moon, cut from paper, with a bite out of it */
    var ma = 1 - seg(warm, 0, .7), my = 470 + 260 * eio(warm);
    if (ma > 0) { g.save(); g.globalAlpha *= ma; g.fillStyle = 'rgba(236,228,206,.5)'; el(g, 905, my, 54, 54); g.fillStyle = mixc(hex(NIGHT0), hex('#2a2a4a'), warm); el(g, 930, my - 15, 48, 48); g.restore(); }
    /* clouds drifting left to right, very slowly */
    [[120, 700, 1.1, 9], [760, 1060, .8, 6], [-200, 1260, 1.3, 7]].forEach(function (c, i) {
      var x = c[0] + c[3] * ct, y = c[1] + 6 * cyc(ct, .07, i * .3), s = c[2];
      g.fillStyle = 'rgba(70,84,110,.28)'; el(g, x, y, 130 * s, 34 * s); el(g, x - 60 * s, y - 18 * s, 60 * s, 34 * s); el(g, x + 40 * s, y - 26 * s, 70 * s, 42 * s);
    });
    if (sun > 0) { var scy = lerp(1346, 1160, eout(sun)); g.fillStyle = 'rgba(244,190,90,.18)'; el(g, 990, scy, 150, 150); g.fillStyle = '#f2b45a'; el(g, 990, scy, 90, 90); }
    var r2 = mulberry(91);
    g.fillStyle = HILL1; cut(g, [[-400, 1330], [100, 1250], [420, 1300], [760, 1230], [1480, 1310], [1480, 2300], [-400, 2300]], r2, 4);
    g.fillStyle = HILL2; cut(g, [[-400, 1420], [260, 1380], [640, 1430], [1000, 1370], [1480, 1420], [1480, 2300], [-400, 2300]], r2, 4);
  }

  /* ---------- the Wi-Fi fan icon: a dot and three arcs, cream on the button ---------- */
  function fan(g, cx, cy, r, col, dash, a) {
    var ay = cy + .3 * r;
    g.save(); g.globalAlpha *= a == null ? 1 : a; g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round'; g.lineWidth = .1 * r;
    if (dash) { g.lineCap = 'butt'; g.setLineDash([.085 * r, .06 * r]); }
    [.27, .47, .67].forEach(function (k) { g.beginPath(); g.arc(cx, ay, k * r, -Math.PI * .76, -Math.PI * .24); g.stroke(); });
    g.setLineDash([]); el(g, cx, ay, .085 * r, .085 * r);
    g.restore();
  }
  /* the re-created Control Center Wi-Fi button. dim: the gray "off" layer (0..1); peel: that layer folded back from the
     top (0..1), showing the dashed arcs still there underneath; the flap's back carries NOT OFF from K.ST */
  function wifiButton(g, cx, cy, r, o) {
    o = o || {}; var dim = o.dim || 0, pk = o.peel || 0, t = o.t || 0;
    var L = lerp(-r, -.1 * r, eio(pk));
    g.fillStyle = 'rgba(0,0,0,.42)'; el(g, cx + .05 * r, cy + .07 * r, r, r);
    if (pk > 0) {
      g.fillStyle = UNDER; el(g, cx, cy, r, r);
      g.save(); g.beginPath(); g.arc(cx, cy, r, 0, 6.283); grainIn(g, cx - r, cy - r, 2 * r, 2 * r, 5101, .8); g.restore();
      fan(g, cx, cy - .485 * r, .85 * r, CREAM, true, .95);   /* the arcs, still there underneath, drawn dashed (available) */
      /* jury r1: still live: two slow dashed rings keep pulsing out of the fan (0.8 s period, cream at 60 %, no data dots) */
      var fr = .85 * r, fay = cy - .485 * r + .3 * fr;
      g.save(); g.beginPath(); g.arc(cx, cy, r * .97, 0, 6.283); g.clip(); g.strokeStyle = CREAM; g.lineWidth = .085 * fr; g.lineCap = 'butt'; g.setLineDash([.085 * fr, .06 * fr]);
      [0, .5].forEach(function (ph) { var k = frac(t / .8 + ph); g.globalAlpha = .6 * Math.sin(Math.PI * k) * eio(pk); g.beginPath(); g.arc(cx, fay, fr * (.67 + .45 * k), -Math.PI * .76, -Math.PI * .24); g.stroke(); });
      g.restore();
    }
    g.save();
    if (pk > 0) { g.beginPath(); g.rect(cx - r - 4, cy + L, 2 * r + 8, r - L + 6); g.clip(); }
    g.fillStyle = mixc(hex(WIFI), hex(DIMC), dim); el(g, cx, cy, r, r);
    g.beginPath(); g.arc(cx, cy, r, 0, 6.283); grainIn(g, cx - r, cy - r, 2 * r, 2 * r, 5111, .8);
    g.strokeStyle = mixc(hex(WIFI2), hex('#2c323d'), dim); g.lineWidth = .035 * r; g.beginPath(); g.arc(cx, cy, r * .982, 0, 6.283); g.stroke();
    fan(g, cx, cy, r, mixc(hex(CREAM), hex(DIMA), dim), false, 1);
    g.restore();
    prop(g, 'wifi button', cx - r, cy - r, cx + r, cy + r);
    if (pk > 0) {
      /* the flap: the gray layer's top cap, folded down across the line y = L (its back is plain paper) */
      var fy = cy + 2 * L, hw = Math.sqrt(Math.max(0, r * r - L * L));
      g.save(); g.beginPath(); g.rect(cx - r - 20, cy + L, 2 * r + 40, 3 * r); g.clip();
      g.fillStyle = 'rgba(0,0,0,.4)'; el(g, cx + 8, fy + 14, r, r);
      g.fillStyle = FLAPC; el(g, cx, fy, r, r);
      g.beginPath(); g.arc(cx, fy, r, 0, 6.283); grainIn(g, cx - r, fy - r, 2 * r, 2 * r, 5121, .7);
      g.restore();
      g.save(); g.beginPath(); g.arc(cx, fy, r, 0, 6.283); g.clip(); var cg = g.createLinearGradient(0, cy + L, 0, cy + L + .22 * r); cg.addColorStop(0, 'rgba(33,29,38,.28)'); cg.addColorStop(1, 'rgba(33,29,38,0)'); g.fillStyle = cg; g.fillRect(cx - r, cy + L, 2 * r, .22 * r); g.restore();
      g.fillStyle = 'rgba(33,29,38,.35)'; g.fillRect(cx - hw, cy + L - 2, 2 * hw, 4);
      var fb = cy + 2 * L + r;
      if (fb > cy + L + 4) prop(g, 'flap', cx - (L > 0 ? r : hw), cy + L, cx + (L > 0 ? r : hw), fb);
      if (pk >= .999 && t >= K.ST) {
        var pul = 1 + .06 * Math.sin(Math.PI * seg(t, K.TW - .02, K.TW + .2));
        g.save(); g.translate(cx, cy + .34 * r); g.scale(pul * r / 220, pul * r / 220); stamp(g, 'NOT OFF', 0, 0, t, K.ST, 92, HOT, -.06); g.restore();
      }
    }
  }
  /* the Bluetooth button: same paper, the letters BT (no rune) */
  function btButton(g, cx, cy, r, dim) {
    g.fillStyle = 'rgba(0,0,0,.42)'; el(g, cx + .05 * r, cy + .07 * r, r, r);
    g.fillStyle = mixc(hex(WIFI), hex(DIMC), dim || 0); el(g, cx, cy, r, r);
    g.beginPath(); g.arc(cx, cy, r, 0, 6.283); grainIn(g, cx - r, cy - r, 2 * r, 2 * r, 5211, .8);
    g.strokeStyle = WIFI2; g.lineWidth = .035 * r; g.beginPath(); g.arc(cx, cy, r * .982, 0, 6.283); g.stroke();
    prop(g, 'bt button', cx - r, cy - r, cx + r, cy + r);
    onprop(function () { txt(g, 'BT', cx, cy + .02 * r, Math.round(.5 * r), CREAM, 'center', 900, DISP, 0, 1, 36, 'condensed'); });
  }
  /* a paper tag on a string: a cream card with a punched hole, the string from (sx, sy) to the hole */
  function string(g, x0, y0, x1, y1, sag, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.strokeStyle = 'rgba(236,228,206,.9)'; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + (sag || 0), x1, y1); g.stroke(); g.restore();
  }
  function paperTag(g, lines, x, y, a, rot, px, name) {
    if (a <= 0) return;
    px = px || 38; var L = typeof lines === 'string' ? [lines] : lines;
    font(g, px, 900, DISP, 'condensed'); var w = 0; L.forEach(function (s) { w = Math.max(w, g.measureText(s).width); }); w += px * .9 + 26; var h = L.length * px * 1.08 + px * .5;
    var ex = EXITING; if (a < 1) EXITING = true;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -w / 2 + 6, -h / 2 + 8, w, h, 10); g.fill();
    g.fillStyle = PAPER; rr(g, -w / 2, -h / 2, w, h, 10); g.fill();
    rr(g, -w / 2, -h / 2, w, h, 10); grainIn(g, -w / 2, -h / 2, w, h, strHash(L[0]) & 4095, .6);
    g.fillStyle = '#5d564c'; el(g, -w / 2 + 16, 0, 6, 6);
    prop(g, name || 'tag', -w / 2, -h / 2, w / 2, h / 2);
    onprop(function () { L.forEach(function (s, i) { txt(g, s, 13 + px * .2, (i - (L.length - 1) / 2) * px * 1.08 + 1, px, INK, 'center', 900, DISP, 0, 1, 30, 'condensed'); }); });
    g.restore(); EXITING = ex;
    return w;
  }

  /* ---------- the hand: cut paper, a fist with the index finger out (pointing along −x), a torn sleeve ---------- */
  function drawHand(g, tx, ty, rot, s) {
    g.save(); g.translate(tx, ty); g.rotate(rot); g.scale(s, s); g.translate(156, 36); hand(g); g.restore();
  }

  /* ---------- the paper alarm clock (no numerals: the time is the 5:00 AM card) ---------- */
  function clock(g, cx, cy, s, hAng, mAng, roll, ring) {
    g.save(); g.translate(cx, cy); g.rotate(roll + .08 * decay(ring, 0, 60, 9)); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.4)'; el(g, 8, 12, 100, 100);
    g.fillStyle = '#c9bfa8'; [-1, 1].forEach(function (d) { g.save(); g.rotate(d * .62); el(g, 0, -116, 34, 26); g.restore(); });
    g.fillStyle = '#8f846d'; g.fillRect(-4, -136, 8, 26); el(g, 0, -140, 9, 9);
    g.fillStyle = '#8f846d'; [-1, 1].forEach(function (d) { g.save(); g.rotate(d * .7); g.fillRect(-7, 84, 14, 40); g.restore(); });
    g.fillStyle = '#e1d7c2'; el(g, 0, 0, 100, 100);
    g.beginPath(); g.arc(0, 0, 100, 0, 6.283); grainIn(g, -100, -100, 200, 200, 6101, .7);
    g.fillStyle = '#f6efe0'; el(g, 0, 0, 82, 82);
    g.fillStyle = INK; for (var i = 0; i < 12; i++) { g.save(); g.rotate(i * Math.PI / 6); g.fillRect(-2.5, -76, 5, i % 3 ? 10 : 18); g.restore(); }
    g.lineCap = 'round'; g.strokeStyle = INK;
    g.save(); g.rotate(mAng); g.lineWidth = 7; g.beginPath(); g.moveTo(0, 10); g.lineTo(0, -64); g.stroke(); g.restore();
    g.save(); g.rotate(hAng); g.lineWidth = 11; g.beginPath(); g.moveTo(0, 8); g.lineTo(0, -44); g.stroke(); g.restore();
    g.fillStyle = HOT; el(g, 0, 0, 9, 9);
    g.restore();
    prop(g, 'clock', cx - 108 * s, cy - 150 * s, cx + 108 * s, cy + 128 * s);
  }

  /* ---------- the search card: DOES TURNING OFF WI-FI SAVE BATTERY, typed in ---------- */
  function searchCard(g, x, y, t, t0, a) {
    var sa = seg(t, t0, t0 + .12) * (a == null ? 1 : a);
    if (sa <= 0 || !LIVE.text) return;
    var w = 780, h = 92, x0 = x - w / 2, y0 = y - h / 2;
    g.save(); g.globalAlpha *= sa;
    var ex = EXITING; if (sa < 1) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 8, y0 + 10, w, h, 46); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 46); g.fill();
    prop(g, 'search card', x0, y0, x0 + w, y0 + h);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(x0 + 48, y - 6, 15, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(x0 + 59, y + 5); g.lineTo(x0 + 72, y + 18); g.stroke();
    var L = 'DOES TURNING OFF WI-FI SAVE BATTERY', k = seg(t, t0 + .04, t0 + .55), n = Math.round(L.length * k), typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
    onprop(function () { if (n) txt(g, L.slice(0, n), x0 + 88, y + 3, 44, INK, 'left', 900, DISP, w - 112, 1, 40, 'condensed'); });
    NOREC = nr;
    EXITING = ex; g.restore();
  }
  /* the hook's plate: "…MINIMAL POWER…" / WHEN NOT CONNECTED · APPLE (slammed on "barely", held to the pull-out) */
  function minPlate(g, t, t0, out) {
    if (t < t0 - .06 || out >= 1) return;
    var k = eout(seg(t, t0 - .06, t0 + .2)), s = 1, eo = eio(out), w = 600, h = 124, x = 510, y = 1268 + 80 * (1 - k);
    var ex = EXITING; if (k < 1 || eo > 0) EXITING = true;
    g.save(); g.translate(x - 640 * eo, y + 40 * eo); g.rotate(-.012 - .15 * eo); g.scale(s, s); g.globalAlpha *= 1 - eo;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -w / 2 + 8, -h / 2 + 11, w, h, 16); g.fill();
    g.fillStyle = CREAM; rr(g, -w / 2, -h / 2, w, h, 16); g.fill();
    rr(g, -w / 2, -h / 2, w, h, 16); grainIn(g, -w / 2, -h / 2, w, h, 1521, .6);
    prop(g, 'minimal plate', -w / 2, -h / 2, w / 2, h / 2);
    onprop(function () {
      txt(g, '“…MINIMAL POWER…”', 0, -22, 62, INK, 'center', 900, DISP, w - 40, 1, 48, 'condensed');
      txt(g, 'WHEN NOT CONNECTED · APPLE', 0, 34, 40, '#4b4540', 'center', 900, DISP, w - 40, 1, 36, 'condensed');
    });
    g.restore(); EXITING = ex;
  }

  /* =====================================================================================================
     CONTROL CENTER: frame 0 is a close-up on the lit Wi-Fi button rising 290 px into place (WI-FI OFF?, the finger
     reaching in). On "Apple" the camera pulls out to the two buttons; KEEP ON; the tap; on "On iPhone" the push-in,
     the gray layer peels back: NOT OFF; the strings; the clock brings back AUTO-JOIN.
     ===================================================================================================== */
  var WR = 165, BTDX = 347;                         /* world radius of a button; the BT button sits 347 px right of Wi-Fi (two 390 px tiles) */
  /* jury r1: the hero is ≥ 720 px at frame 0, 580 px while the hook plates sit under it, 390 px each in the two-tile
     module (x 110–910), 600 → 708 px on the twist (the push-in on "doesn't"), 480 px while the tags hang on it */
  var F0 = { x: 510, y: 1050, s: 362 / WR }, C1 = { x: 510, y: 1000, s: 372 / WR }, C0 = { x: 510, y: 900, s: 290 / WR }, MOD = { x: 305, y: 800, s: 195 / WR }, TWS = { x: 510, y: 820, s: 300 / WR }, TWP = { x: 510, y: 820, s: 354 / WR }, AVS = { x: 510, y: 760, s: 240 / WR };
  function lc(a, b, k) { return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), s: lerp(a.s, b.s, k) }; }
  function camStart(t) { return lc(F0, C1, eout(seg(t, 0, .55))); }
  var FRAME0 = camStart(1 / 60);                   /* where frame 0 (t = 1/60) sits; the end card glides back to it */
  function camC(t) {
    var c = camStart(t);
    c = lc(c, C0, eio(seg(t, K.barely - .1, K.barely + .35)));
    c = lc(c, MOD, eio(seg(t, K.apple - .15, K.apple + .45)));
    c = lc(c, TWS, eio(seg(t, K.twist - .05, K.twist + .5)));
    c = lc(c, TWP, eio(seg(t, K.doesnt, K.doesnt + .6)));
    c = lc(c, AVS, eio(seg(t, K.TW + .2, K.avail + .35)));
    return c;
  }
  /* the close-up as frame 0 and the end card draw it: the lit button, WI-FI OFF? above it, RE-CREATED on its rim */
  function closeLabel(g, c, a, tagA) {
    var r = WR * c.s;
    if (a > 0) { var ex = EXITING; if (a < 1) EXITING = true; txt(g, 'WI-FI OFF?', c.x, c.y - r - 82, 104, CREAM, 'center', 900, DISP, 760, a, 60, 'condensed'); EXITING = ex; }
    if (tagA > 0) onprop(function () { tag(g, 'RE-CREATED', Math.min(c.x + .76 * r + 30, 790), c.y - .8 * r, tagA, .02, 260, CREAM, 'rgba(16,22,28,.9)', 32); });
  }
  function hoverTip(c, ct) { var r = WR * c.s; return [c.x + .5 * r + 9 * cyc(ct, .45), c.y + .3 * r + 12 * cyc(ct, .6, .25)]; }
  /* frame 0's second element (no words): the fingertip is on the glass, touch rings spread from it (loop-safe in ct) */
  function touchRings(g, x, y, ct, a) {
    if (a <= 0) return;
    g.save(); g.lineWidth = 6; g.strokeStyle = CREAM;
    [0, .5].forEach(function (ph) { var k = frac(ct * 1.1 + ph); g.globalAlpha = a * .6 * (1 - k); g.beginPath(); g.arc(x, y, 26 + 74 * k, 0, 6.283); g.stroke(); });
    g.restore();
  }
  function ccScene(g, t) {
    var c = camC(t), r = WR * c.s, moving = (t < .55) || (t > K.barely - .1 && t < K.barely + .35) || (t > K.apple - .15 && t < K.apple + .45) || (t > K.twist - .05 && t < K.twist + .5) || (t > K.doesnt && t < K.doesnt + .6) || (t > K.TW + .2 && t < K.avail + .35);
    if (LAYER === 'bg') { wallpaper(g, t, eio(seg(t, K.fiveW, K.FA + .25)), seg(t, K.FA - .02, K.cell + .6)); return; }
    if (LAYER === 'over') { ccHand(g, t, c); return; }
    var exw = EXITING; if (moving) EXITING = true;
    /* jury r1: the tile dims on "tap" (grey within 0.12 s), pressed in 6 px; the thump in the gap is the tile settling */
    var dim = eout(seg(t, K.tap, K.tap + .12));
    var pk = eio(seg(t, K.btnT - .1, K.doesnt + .02)) * (1 - eio(seg(t, K.five - .12, K.five + .3)));
    var bx = c.x + BTDX * c.s + 560 * (1 - eout(seg(t, K.btw - .3, K.btw + .12))) + 760 * eio(seg(t, K.twist - .05, K.twist + .4)), by = c.y, brr = WR * c.s;
    var press = Math.sin(Math.PI * seg(t, K.tap - .02, K.tap + .2)), pulse = .035 * Math.sin(Math.PI * seg(t, K.button - .02, K.button + .3)) + .03 * Math.sin(Math.PI * seg(t, K.HK - .02, K.HK + .22)) + .03 * Math.sin(Math.PI * seg(t, at('ask', 'Wi-Fi') - .02, at('ask', 'Wi-Fi') + .3)) + .03 * Math.sin(Math.PI * seg(t, K.wifiA - .02, K.wifiA + .3));
    var land = .025 * Math.sin(Math.PI * seg(t, K.DP - .02, K.DP + .16));
    if (bx - brr < 940) { var exb = EXITING; if (bx - brr > SAFE_BOX.x1 - 2 * brr || t < K.btw + .12) EXITING = true; btButton(g, bx, by, brr, 0); EXITING = exb; }
    /* KEEP ON tags hang ABOVE both tiles from "Keep" until the push-in (jury r1: nothing under the tiles for the finger to cover) */
    var kdrop = eout(seg(t, K.keepW - .12, K.keepW)), kin = t >= K.keepW - .12 ? 1 : 0, kout = eio(seg(t, K.twist - .1, K.twist + .2));
    if (kin > 0 && kout < 1) {
      var sw = .07 * decay(t, K.keepW, 11, 4.5);
      [[c.x, c.y, 0], [bx, by, 1]].forEach(function (b) {
        if (b[2] && bx - brr > 900) return;
        var tx = b[0] + 10, ty = b[1] - r - 56 - 60 * (1 - kdrop);
        string(g, b[0], b[1] - r + 4, tx - 70, ty + 4, 6, kin * (1 - kout));
        var exk = EXITING; if (kdrop < 1) EXITING = true; paperTag(g, 'KEEP ON', tx, ty, kin * (1 - kout), sw + .03, 36, 'keep tag'); EXITING = exk;
      });
    }
    /* the home network's tag hangs under the tile from "both"; on "disconnects" its string snaps and it falls out of frame */
    var nin = eout(seg(t, K.both - .02, K.both + .2)), fall = seg(t, K.disc, K.disc + .6);
    var hx = c.x - .5 * r, hy = c.y + .866 * r;
    if (nin > 0 && fall < 1) {
      var tx2 = c.x - .45 * r, ty2 = c.y + r + 52 + 900 * fall * fall, rot2 = -.03 - 1.2 * fall * fall + .04 * decay(t, K.both, 8, 3);
      var exf = EXITING; if (fall > 0 || moving) EXITING = true;
      if (fall <= 0) string(g, hx, hy, tx2 - 74, ty2 - 2, 8, nin);
      paperTag(g, 'HOME WI-FI', tx2, ty2, nin, rot2, 36, 'network tag');
      EXITING = exf;
    }
    /* the tap, the press, the dim */
    var sc = 1 - .03 * press + land;
    g.save(); g.translate(c.x, c.y); g.scale(sc + pulse, sc + pulse); g.translate(-c.x, -c.y);
    wifiButton(g, c.x, c.y, r, { dim: dim, peel: pk, t: t });
    g.restore();
    /* the snapped string's stub, dangling from the rim */
    if (t >= K.disc && t < K.five + .1) { var su = seg(t, K.disc, K.disc + .3); string(g, hx, hy, hx - 20 * su - 6, hy + 46 - 30 * (1 - su), 10, 1 - seg(t, K.five - .1, K.five + .1)); }
    /* avail: DISCONNECTED at the stub, AVAILABLE on the dashed arcs, AIRDROP and LOCATION SERVICES on strings */
    var aout = eio(seg(t, K.fiveW + .1, K.fiveW + .4));
    if (t >= K.disc && aout < 1) { var dk = eout(seg(t, K.disc, K.disc + .15)); chipCard(g, 'DISCONNECTED', 238, c.y - r - 30 - 30 * aout, dk * (1 - aout), 36, 260, true); }
    if (t >= K.available && aout < 1) {
      var ak = eout(seg(t, K.available, K.available + .14)), aa = ak * (1 - aout);
      var exa = EXITING; if (aa < 1) EXITING = true;
      onprop(function () { chip(g, 'AVAILABLE', c.x + 40, c.y - r - 30, { px: 40, wt: 900, st: 'condensed', bg: CREAM, fg: INK, r: 10, a: aa, s: lerp(1.2, 1, ak), shadow: false }); });
      EXITING = exa;
    }
    if (t >= K.airdrop - .02 && aout < 1) {
      var tk = eout(seg(t, K.airdrop - .02, K.airdrop + .25)), ta = tk * (1 - aout), sw2 = .05 * decay(t, K.airdrop, 7, 2.6);
      var lx = c.x - r, ly = c.y + .1 * r, rx2 = c.x + r, ry2 = c.y + .05 * r;
      string(g, lx, ly, 208, 800 - 20, 20, ta); paperTag(g, 'AIRDROP', 208 + 30 * (1 - tk), 800, ta, -.04 + sw2, 40, 'airdrop tag');
      string(g, rx2, ry2, 810, 780 - 40, 20, ta); paperTag(g, ['LOCATION', 'SERVICES'], 810 - 30 * (1 - tk), 780, ta, .04 - sw2, 34, 'location tag');
    }
    /* fiveam: the clock rolls in, rocks, its hand sweeps to 5; on "5" the AUTO-JOIN tag flies back onto the (still dim) button */
    var cin = eout(seg(t, K.five - .2, K.five + .4));
    if (cin > 0) {
      var clx = lerp(-160, 236, cin), cly = 1010, sweep = eio(seg(t, K.autojoin, K.fiveW));
      var exc = EXITING; if (cin < 1) EXITING = true;
      var rock = .06 * Math.sin(2 * Math.PI * 2.4 * (t - K.five)) * seg(t, K.five + .3, K.five + .5) * (1 - seg(t, K.fiveW - .1, K.fiveW + .05));
      clock(g, clx, cly, .9, lerp(Math.PI / 2, Math.PI * 5 / 6, sweep), 4 * Math.PI * sweep + 1.2 * eio(seg(t, K.fiveW + .3, K.cell + .4)), -2.4 * (1 - cin) + rock, t - K.FA);
      EXITING = exc;
      if (t >= K.fiveW) {
        slapCard(g, '5:00 AM', 700, 1046, t, K.fiveW, 50, 260);
        txt(g, 'OR SOONER:', 700, 1098, 36, CREAM, 'center', 900, DISP, 330, seg(t, K.fiveW, K.fiveW + .06), 36, 'condensed');
        txt(g, 'NEW PLACE, RESTART…', 700, 1138, 36, CREAM, 'center', 900, DISP, 330, seg(t, K.fiveW, K.fiveW + .06), 36, 'condensed');
      }
      if (t >= K.autojoin) {
        var fly = eio(seg(t, K.FA - .5, K.FA)), ajk = eout(seg(t, K.autojoin, K.autojoin + .2));
        var ax0 = 452, ay0 = 1010, ax1 = c.x + .5 * r + 40, ay1 = c.y + .86 * r;
        var axx = lerp(ax0, ax1, fly), ayy = lerp(ay0, ay1, fly) - 140 * Math.sin(Math.PI * fly), lsc = 1 + .1 * Math.sin(Math.PI * seg(t, K.FA - .02, K.FA + .16));
        var exj = EXITING; if (fly > 0 && fly < 1) EXITING = true;
        if (fly <= 0) string(g, clx + 96, cly - 10, axx - 92, ayy, 14, ajk);
        g.save(); g.translate(axx, ayy); g.scale(lsc, lsc); g.translate(-axx, -ayy);
        if (fly >= 1) onprop(function () { paperTag(g, 'AUTO-JOIN', axx, ayy, 1, -.05 + .04 * decay(t, K.FA, 11, 4), 40, 'autojoin tag'); });
        else paperTag(g, 'AUTO-JOIN', axx, ayy, ajk, .03 - .08 * fly, 40, 'autojoin tag');
        g.restore(); EXITING = exj;
      }
    }
    EXITING = exw;
    /* screen space: WI-FI OFF? and RE-CREATED ride on the close-up; the hook plate; the search card */
    var la0 = 1 - eio(seg(t, K.apple - .2, K.apple + .1)), lsh = -60 * eio(seg(t, K.apple - .2, K.apple + .1));
    g.save(); g.translate(0, lsh); closeLabel(g, c, la0, la0); g.restore();
    if (t >= K.apple + .2 && t < K.twist + .3) onprop(function () { tag(g, 'RE-CREATED', 510, 1040, seg(t, K.apple + .2, K.apple + .35) * (1 - seg(t, K.twist - .1, K.twist + .1)), 0, 260, CREAM, 'rgba(16,22,28,.9)', 32); });
    minPlate(g, t, K.barely + .3, seg(t, K.apple - .1, K.apple + .3));
    var sqk = .04 * Math.sin(Math.PI * seg(t, K.ask - .02, K.ask + .3)) + .03 * Math.sin(Math.PI * seg(t, K.button - .02, K.button + .3));
    g.save(); if (sqk) { g.translate(510, 1378); g.scale(1 + sqk, 1 + sqk); g.translate(-510, -1378); }
    searchCard(g, 510, 1378, t, .6, 1 - seg(t, K.says() - .25, K.says() - .1)); g.restore();
    /* apple: the quote plate, underlined as it is said; keep: the advice (a paper thunk in the gap after "advice?"); dip: TODAY */
    qplate(g, 104, 1196, 812, ['“WI-FI AND BLUETOOTH ARE DESIGNED TO', 'DRAW MINIMAL POWER FROM THE BATTERY', 'WHEN THEY AREN’T CONNECTED…”'], 42, ['APPLE SUPPORT · iPHONE BATTERY PAGE'], 3301, seg(t, K.says(), K.says() + .15), seg(t, at('keep', 'advice?') - .15, at('keep', 'advice?')), false, 36);
    var qo = 1 - seg(t, at('keep', 'advice?') - .15, at('keep', 'advice?'));
    if (t > K.minimal && qo > 0) {
      g.save(); g.globalAlpha = qo; g.strokeStyle = WIFI; g.lineWidth = 7; g.lineCap = 'round';
      var u1 = eio(seg(t, K.minimal, at('apple', 'power') + .35)), u2 = eio(seg(t, at('apple', 'when'), K.connected + .6));
      g.beginPath(); for (var ui = 0; ui <= 20 * u1; ui++) { var ux = 244 + 278 * ui / 20; g.lineTo(ux, 1304 + 2.5 * Math.sin(ui * 1.3)); } g.stroke();
      if (u2 > 0) { g.beginPath(); for (ui = 0; ui <= 30 * u2; ui++) { ux = 132 + 586 * ui / 30; g.lineTo(ux, 1351 + 2.5 * Math.sin(ui * 1.1 + 1)); } g.stroke(); }
      g.restore();
    }
    var kth = .03 * Math.sin(Math.PI * seg(t, K.KP - .02, K.KP + .16));
    g.save(); if (kth) { g.translate(510, 1300); g.scale(1 + kth, 1 + kth); g.translate(-510, -1300); }
    qplate(g, 104, 1252, 812, ['“…KEEP WI-FI AND BLUETOOTH TURNED ON.”'], 44, ['“FOR THE BEST EXPERIENCE…” · APPLE'], 3311, seg(t, at('keep', 'advice?'), at('keep', 'advice?') + .15), seg(t, K.twist - .3, K.twist - .05), false, 38);
    g.restore();
    var today = 1 - seg(t, K.twist - .2, K.twist);
    if (t > K.dip - .05 && today > 0) slapCard(g, 'TODAY', 510, 1128, t, K.dip, 64, 300);
    /* twist: the scope in big type, the real off switch in fine print under it */
    var ic = seg(t, K.iph, K.iph + .12) * (1 - eio(seg(t, K.five - .15, K.five + .15)));
    var icy = lerp(1300, 1150, eio(seg(t, K.avail, K.available - .15)));
    if (ic > 0) {
      chipCard(g, 'iPHONE · CONTROL CENTER', 510, icy, ic, 52, 800, true); tag(g, 'RE-CREATED', 510, icy + 56, ic, 0, 260, CREAM, 'rgba(16,22,28,.9)', 30);
      var fo = seg(t, K.doesnt + .2, K.doesnt + .3) * (1 - seg(t, K.available - .3, K.available - .15));
      if (fo > 0) txt(g, 'FULLY OFF: SETTINGS › WI-FI', 510, icy + 106, 36, CREAM, 'center', 900, DISP, 700, fo, 36, 'condensed');
    }
    qplate(g, 104, 1236, 812, ['“…WILL CONTINUE', 'TO BE AVAILABLE…”'], 46, ['APPLE SUPPORT'], 3321, seg(t, K.available, K.available + .15), seg(t, at('fiveam', 'back') - .02, at('fiveam', 'back') + .18), false, 40);
    /* fiveam (jury r1): Apple's auto-join line carries the band under the clock; the 5:00 AM card's fine print lists the sooner triggers */
    QHIDE = t < K.fiveW ? 2 : 0;
    qplate(g, 104, 1160, 812, ['“…AUTO-JOIN… IS', 'ALSO DISABLED UNTIL:', '… IT’S 5 A.M.', 'LOCAL TIME.”'], 40, ['APPLE SUPPORT'], 3331, seg(t, at('fiveam', 'back') + .08, at('fiveam', 'back') + .23), 0, false, 36);
    QHIDE = 0;
  }
  function ccHand(g, t, c) {
    var r = WR * c.s, tip, a = .32, s = 1.2 * clamp(r / 300, .82, 1);
    /* hovering from frame 0 to "Apple", fingertip on the glass with touch rings; back on "But", pressing on "tap" */
    var out1 = eio(seg(t, K.apple - .15, K.apple + .3)), in2 = eout(seg(t, K.dip - .15, K.tap - .02)), out2 = eio(seg(t, K.tap + .4, K.DP + .2));
    if (out1 < 1) {
      tip = hoverTip(c, t); var dipk = 22 * Math.sin(Math.PI * seg(t, K.button - .02, K.button + .3)) + 16 * Math.sin(Math.PI * seg(t, at('ask', 'what') - .02, at('ask', 'what') + .35)) + 18 * Math.sin(Math.PI * seg(t, K.HK - .06, K.HK + .2));
      var fx = tip[0] - dipk * .6 + 620 * out1, fy = tip[1] - dipk * .4 + 420 * out1;
      touchRings(g, fx - 4, fy + 2, t, 1 - seg(t, K.ask - .2, K.ask + .2));
      drawHand(g, fx, fy, a, s);
    }
    /* apple: the finger comes back and reads along the quote, under the words being said */
    var in3 = eout(seg(t, K.minimal - .35, K.minimal)), out3 = eio(seg(t, K.connected + .55, K.connected + .95));
    if (in3 > 0 && out3 < 1) {
      var u1 = eio(seg(t, K.minimal, at('apple', 'power') + .35)), mv = eio(seg(t, at('apple', 'power') + .35, at('apple', 'when'))), u2 = eio(seg(t, at('apple', 'when'), K.connected + .6));
      var rx = lerp(244 + 278 * u1, 132 + 586 * u2, mv), ry = 1446 + 3 * cyc(t, .8);
      drawHand(g, rx + 640 * (1 - in3) + 640 * out3, ry + 420 * (1 - in3) + 420 * out3, .32, 1.0);
    }
    /* dip: in from the lower right, press on "tap", lift and slide away (its box stays on the Wi-Fi tile and below it) */
    if (in2 > 0 && out2 < 1) {
      var prs = Math.sin(Math.PI * seg(t, K.tap - .04, K.tap + .2)), lift = eout(seg(t, K.tap + .2, K.tap + .4));
      var hx = c.x + .3 * r - .1 * r * prs + .12 * r * lift, hy = c.y + .32 * r - .06 * r * prs + .08 * r * lift + 6 * cyc(t, .8) * lift;
      drawHand(g, lerp(hx + 640, hx, in2) + 620 * out2, lerp(hy + 420, hy, in2) + 420 * out2, a, 1.1);
    }
  }
  K.says = function () { return at('apple', 'says'); };

  /* =====================================================================================================
     THE BALANCE (cell) and the Pixel Quick Settings pill (bt), in screen space
     ===================================================================================================== */
  var BPX = 510, BPY = 640, BEAM = 280;
  function iconCard(g, x, y, kind) {
    var w = 200, h = 170, x0 = x - w / 2, y0 = y - h;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 6, y0 + 8, w, h, 24); g.fill();
    g.fillStyle = kind === 'wifi' ? WIFI : '#3f9a63'; rr(g, x0, y0, w, h, 24); g.fill();
    rr(g, x0, y0, w, h, 24); grainIn(g, x0, y0, w, h, kind === 'wifi' ? 7101 : 7111, .8);
    prop(g, kind + ' card', x0, y0, x0 + w, y0 + h);
    if (kind === 'wifi') fan(g, x, y0 + 64, 90, CREAM, false, 1);
    else {
      /* a paper cell tower with signal bars */
      g.fillStyle = CREAM; poly(g, [[x - 34, y0 + 120], [x, y0 + 24], [x + 34, y0 + 120], [x + 22, y0 + 120], [x, y0 + 56], [x - 22, y0 + 120]]); g.fill();
      g.fillRect(x - 24, y0 + 86, 48, 6); el(g, x, y0 + 22, 8, 8);
      [0, 1, 2].forEach(function (i) { g.fillRect(x + 46 + i * 16, y0 + 96 - i * 22, 10, 24 + i * 22); });
    }
    onprop(function () { txt(g, kind === 'wifi' ? 'WI-FI' : 'CELLULAR', x, y0 + 146, 38, CREAM, 'center', 900, DISP, w - 20, 1, 30, 'condensed'); });
  }
  function balance(g, t, th) {
    /* the post and its base */
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(BPX - 10, BPY + 10, 28, 520);
    g.fillStyle = '#c9bfa8'; g.fillRect(BPX - 14, BPY, 28, 520);
    g.fillStyle = '#b3a88f'; g.fillRect(BPX + 6, BPY, 8, 520);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, BPX - 150 + 8, BPY + 512, 300, 44, 12); g.fill();
    g.fillStyle = '#d8ceb8'; rr(g, BPX - 150, BPY + 504, 300, 44, 12); g.fill();
    prop(g, 'balance post', BPX - 150, BPY, BPX + 150, BPY + 548);
    var ca = Math.cos(th), sa = Math.sin(th), ends = [[-BEAM, 'wifi'], [BEAM, 'cell']];
    ends.forEach(function (e) {
      var ex = BPX + e[0] * ca, ey = BPY + e[0] * sa, py = ey + 250, sw = 0;
      string(g, ex, ey, ex - 104, py - 6, 0, 1); string(g, ex, ey, ex + 104, py - 6, 0, 1);
      iconCard(g, ex, py - 4, e[1]);
      g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(ex + 6, py + 8, 124, 26, 0, 0, Math.PI); g.fill();
      g.fillStyle = '#d8ceb8'; g.beginPath(); g.ellipse(ex, py, 124, 26, 0, 0, Math.PI); g.fill(); g.fillRect(ex - 124, py - 6, 248, 8);
      prop(g, 'pan', ex - 124, py - 6, ex + 124, py + 26);
    });
    g.save(); g.translate(BPX, BPY); g.rotate(th);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -BEAM - 16 + 6, -14 + 8, 2 * BEAM + 32, 28, 10); g.fill();
    g.fillStyle = '#e7dfcc'; rr(g, -BEAM - 16, -14, 2 * BEAM + 32, 28, 10); g.fill();
    g.fillStyle = '#b3a88f'; g.fillRect(-BEAM - 10, 6, 2 * BEAM + 20, 5);
    g.restore();
    g.fillStyle = '#8f846d'; el(g, BPX, BPY, 22, 22); g.fillStyle = '#efe7d6'; el(g, BPX, BPY, 9, 9);
  }
  function battery(g, cx, cy, lv) {
    var w = 360, h = 150;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, cx - w / 2 + 8, cy - h / 2 + 10, w + 26, h, 24); g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 12; rr(g, cx - w / 2, cy - h / 2, w, h, 24); g.stroke();
    g.fillStyle = CREAM; rr(g, cx + w / 2 + 6, cy - 32, 18, 64, 6); g.fill();
    var fw = (w - 36) * clamp(lv, 0, 1);
    g.fillStyle = lv < .16 ? HOT : CREAM; rr(g, cx - w / 2 + 18, cy - h / 2 + 18, Math.max(10, fw), h - 36, 10); g.fill();
    prop(g, 'battery', cx - w / 2 - 6, cy - h / 2 - 6, cx + w / 2 + 30, cy + h / 2 + 6);
  }
  function qsPanel(g, t, off, press) {
    var x0 = 130, y0 = 470, w = 760, h = 640;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 10, y0 + 14, w, h, 44); g.fill();
    g.fillStyle = '#242b37'; rr(g, x0, y0, w, h, 44); g.fill();
    rr(g, x0, y0, w, h, 44); grainIn(g, x0, y0, w, h, 8101, .8);
    g.strokeStyle = 'rgba(244,237,224,.4)'; g.lineWidth = 3; rr(g, x0, y0, w, h, 44); g.stroke();
    prop(g, 'qs panel', x0, y0, x0 + w, y0 + h);
    onprop(function () { tag(g, 'RE-CREATED · PIXEL', 510, y0 + 54, 1, 0, 700, CREAM, '#242b37', 32); });
    battery(g, 500, 660, lerp(.56, .07, eio(seg(t, K.dead - .1, K.dead + .35))));
    /* the Bluetooth pill (the word, no rune); pressed, it goes gray and says Off */
    var pw = 640, ph = 170, px0 = 510 - pw / 2, py0 = 852, ps = 1 - .04 * press;
    g.save(); g.translate(510, py0 + ph / 2); g.scale(ps, ps); g.translate(-510, -(py0 + ph / 2));
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, px0 + 6, py0 + 9, pw, ph, ph / 2); g.fill();
    g.fillStyle = mixc(hex('#a9c7f2'), hex(DIMC), off); rr(g, px0, py0, pw, ph, ph / 2); g.fill();
    rr(g, px0, py0, pw, ph, ph / 2); grainIn(g, px0, py0, pw, ph, 8111, .6);
    g.fillStyle = mixc(hex('#3d6fb3'), hex('#2a303b'), off); el(g, px0 + 92, py0 + ph / 2, 54, 54);
    prop(g, 'bt pill', px0, py0, px0 + pw, py0 + ph);
    var ink = off > .5 ? CREAM : INK;
    onprop(function () {
      txt(g, 'BT', px0 + 92, py0 + ph / 2 + 2, 40, CREAM, 'center', 900, DISP, 0, 1, 36, 'condensed');
      txt(g, 'Bluetooth', px0 + 172, py0 + ph / 2 + 2, 60, ink, 'left', 900, DISP, 400, 1, 40, 'condensed');
    });
    g.restore();
  }
  function scaleScene(g, t) {
    var E0 = S('scale').t0;
    if (LAYER === 'bg') { wallpaper(g, t, 1, 1); g.fillStyle = 'rgba(12,16,24,.45)'; g.fillRect(-400, -300, W + 800, H + 600); return; }
    /* jury r1: Apple's cellular quote peels first, then the balance leaves while the Pixel card comes in on "Battery";
       nothing Apple-credited shares a frame with the Pixel card */
    var bout = eio(seg(t, K.bt - .24, K.bt + .14)), qin = eout(seg(t, K.bt - .04, K.bt + .36));
    var press = Math.sin(Math.PI * seg(t, K.BC - .12, K.BC + .1)), off = seg(t, K.BC - .02, K.BC + .04);
    if (LAYER === 'over') {
      var hin = eout(seg(t, K.turnB - .25, K.btB + .1)), hout = eio(seg(t, K.BC + .25, K.BC + .7));
      if (hin > 0 && hout < 1) { var pr = seg(t, K.BC - .12, K.BC) * (1 - seg(t, K.BC + .08, K.BC + .22)), hx = 690 - 40 * pr + 3 * cyc(t, .5), hy = 990 - 30 * pr + 5 * cyc(t, .6, .3); drawHand(g, hx + 640 * (1 - hin) + 640 * hout, hy + 420 * (1 - hin) + 420 * hout, .32, 1.1); }
      return;
    }
    if (bout < 1) {
      var th = .2 * eio(seg(t, K.less - .02, K.CE)) + .012 * decay(t, K.CE, 14, 5) + .006 * cyc(t, .4) * seg(t, K.CE + .3, K.CE + .6);
      var ex = EXITING; if (bout > 0 || t < E0 + .05) EXITING = true;
      g.save(); g.translate(-980 * bout, -60 * bout); g.translate(BPX, BPY); g.rotate(-.12 * bout); g.translate(-BPX, -BPY);
      balance(g, t, th);
      var hk = seg(t, E0 - .12, E0 - .02);
      if (hk > 0) onprop(function () { chip(g, 'HEAVIER =', BPX - 150, BPY + 372, { px: 38, wt: 900, st: 'condensed', bg: INK, fg: CREAM, line: CREAM, lw: 3, r: 12, a: hk, shadow: false, maxw: 300 }); chip(g, 'MORE BATTERY', BPX + 100, BPY + 372, { px: 38, wt: 900, st: 'condensed', bg: INK, fg: CREAM, line: CREAM, lw: 3, r: 12, a: hk, shadow: false, maxw: 320 }); });
      g.restore(); EXITING = ex;
    }
    if (qin > 0) { var eq = EXITING; if (qin < 1) EXITING = true; g.save(); g.translate(900 * (1 - qin), 0); qsPanel(g, t, off, press); g.restore(); EXITING = eq; }
    qplate(g, 104, 1100, 812, ['“WI-FI USES LESS', 'BATTERY POWER', 'THAN CELLULAR', 'NETWORKS.”'], 46, ['APPLE SUPPORT'], 3401, seg(t, E0 - .12, E0 + .03), seg(t, K.bt - .22, K.bt - .05), false, 40);
    qplate(g, 104, 1194, 812, ['“TURN OFF BLUETOOTH”'], 50, ['PIXEL & ANDROID HELP', 'FOR A DYING BATTERY'], 3411, seg(t, K.google, K.google + .15), 0, false, 44);
  }

  /* =====================================================================================================
     CHECK (jury r1): a re-created iPhone Battery page, not the toggles: a blank usage chart, three blank app rows and
     Apple's own usage line "No Mobile Coverage and Low Signal" in cream; the two paths as separate chips
     ===================================================================================================== */
  var SX0 = 150, SY0 = 470, SW = 720, SH = 560;
  function setPhone(g, t, hl, prs) {
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, SX0 + 12, SY0 + 16, SW, SH, 56); g.fill();
    g.fillStyle = '#2a313d'; rr(g, SX0, SY0, SW, SH, 56); g.fill();
    rr(g, SX0, SY0, SW, SH, 56); grainIn(g, SX0, SY0, SW, SH, 9101, .9);
    prop(g, 'battery page', SX0, SY0, SX0 + SW, SY0 + SH);
    g.save(); rr(g, SX0 + 16, SY0 + 16, SW - 32, SH - 32, 42); g.clip();
    g.fillStyle = '#ece5d8'; g.fillRect(SX0, SY0, SW, SH);
    /* the usage chart: blank bars, no axis numbers */
    var bh = [.35, .5, .3, .8, .6, .45, .7, .4, .55, .3, .65, .5];
    bh.forEach(function (h, i) { var gx = SX0 + 60 + i * 50, gh = 120 * h * (.92 + .08 * cyc(t, .3, i * .13)); g.fillStyle = '#9fb7d6'; rr(g, gx, SY0 + 236 - gh, 34, gh, 6); g.fill(); });
    g.fillStyle = 'rgba(33,29,38,.25)'; g.fillRect(SX0 + 50, SY0 + 240, SW - 100, 3);
    /* three app rows with no names, then Apple's row */
    [0, 1, 2].forEach(function (i) { var ry = SY0 + 262 + i * 52; g.fillStyle = '#d9d1c1'; rr(g, SX0 + 60, ry, 36, 36, 9); g.fill(); g.fillStyle = '#cfc6b4'; rr(g, SX0 + 116, ry + 10, [300, 230, 260][i], 16, 8); g.fill(); });
    var ry = SY0 + 420, pz = 1 - .03 * prs;
    g.save(); g.translate(SX0 + SW / 2, ry + 50); g.scale(pz, pz); g.translate(-(SX0 + SW / 2), -(ry + 50));
    g.fillStyle = mixc(hex('#f6f1e6'), hex('#f3d58c'), hl); rr(g, SX0 + 40, ry - 8, SW - 80, 116, 18); g.fill();
    g.fillStyle = '#8a8270'; rr(g, SX0 + 64, ry + 28, 44, 44, 11); g.fill();
    g.restore();
    onprop(function () {
      g.save(); g.translate(SX0 + SW / 2, ry + 50); g.scale(pz, pz); g.translate(-(SX0 + SW / 2), -(ry + 50));
      txt(g, 'No Mobile Coverage', SX0 + 130, ry + 26, 44, INK, 'left', 900, DISP, SW - 190, 1, 40, 'condensed');
      txt(g, 'and Low Signal', SX0 + 130, ry + 74, 44, INK, 'left', 900, DISP, SW - 190, 1, 40, 'condensed');
      g.restore();
      var ha = seg(t, K.batteryC, K.batteryC + .1);
      if (ha > 0) txt(g, 'Battery', SX0 + 50, SY0 + 76, 60, INK, 'left', 900, DISP, 300, ha, 40, 'condensed');
    });
    g.restore();
    g.strokeStyle = 'rgba(244,237,224,.55)'; g.lineWidth = 3; rr(g, SX0, SY0, SW, SH, 56); g.stroke();
    txt(g, 'APPLE’S OWN USAGE LABEL', SX0 + 60, SY0 + SH + 38, 32, CREAM, 'left', 900, DISP, 600, 1, 30, 'condensed');
    onprop(function () { tag(g, 'RE-CREATED · iPHONE', SX0 + SW - 190, SY0 + 64, 1, 0, 330, INK, '#ece5d8', 30); });
  }
  function pathChip(g, segs, x, y, t) {
    var px = 40, vis = segs.filter(function (sg) { return t >= sg[1]; });
    if (!vis.length) return;
    g.save(); font(g, px, 900, DISP, 'condensed'); ls(g, 0);
    var ws = vis.map(function (sg) { return g.measureText(sg[0]).width; }), w = ws.reduce(function (a, b) { return a + b; }, 0) + 40, h = px * 1.5;
    var k = fin(t, vis[0][1], 4), ex = EXITING; if (k < 1) EXITING = true;
    g.globalAlpha *= k; g.translate(0, 18 * (1 - k));
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x + 5, y - h / 2 + 7, w, h, 14); g.fill();
    g.fillStyle = INK; rr(g, x, y - h / 2, w, h, 14); g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 3; rr(g, x, y - h / 2, w, h, 14); g.stroke();
    var cx = x + 20;
    vis.forEach(function (sg, i) { var a = i ? fin(t, sg[1], 6) : 1; txt(g, sg[0], cx, y + 2, px, i ? AMBER : CREAM, 'left', 900, DISP, 0, a, 34, 'condensed'); cx += ws[i]; });
    EXITING = ex; g.restore();
  }
  function setScene(g, t) {
    var E0 = S('set').t0;
    if (LAYER === 'bg') { wallpaper(g, t, 1, 1); g.fillStyle = 'rgba(12,16,24,.45)'; g.fillRect(-400, -300, W + 800, H + 600); return; }
    var hl = eio(seg(t, K.batteryC + .2, K.batteryC + .5)), prs = Math.sin(Math.PI * seg(t, K.CK - .1, K.CK + .12));
    if (LAYER === 'over') {
      /* the finger rests on Apple's row from "Battery" and taps it in the gap after "toggles" */
      var hy = SY0 + 470 - 14 * prs + 4 * cyc(t, .6, .3), hx = SX0 + SW - 130 - 20 * prs + 3 * cyc(t, .5);
      var hin = eout(seg(t, K.batteryC - .1, K.batteryC + .35)), hout = eio(seg(t, K.CK + .3, K.CK + .8));
      if (hin > 0 && hout < 1) drawHand(g, hx + 640 * (1 - hin) + 640 * hout, hy + 420 * (1 - hin) + 420 * hout, .32, 1.0);
      return;
    }
    var pin = eout(seg(t, E0, E0 + .45)), ex = EXITING; if (pin < 1) EXITING = true;
    g.save(); g.translate(0, 120 * (1 - pin)); setPhone(g, t, hl, prs); g.restore(); EXITING = ex;
    /* jury r2: each path is one chip on one line, left-aligned at x 110; its words print as they are said */
    pathChip(g, [['iPHONE: SETTINGS ›', K.settings], [' BATTERY', K.batteryC]], 110, 1132, t);
    pathChip(g, [['PIXEL: SETTINGS ›', K.settings], [' BATTERY ›', K.batteryC], [' BATTERY USAGE', K.batteryC]], 110, 1214, t);
  }

  /* =====================================================================================================
     THE END CARD: the lit button, the finger hovering (never pressing), YES / NO held to the last 0.2 s,
     then a fast reframe into frame 0 (jury r1)
     ===================================================================================================== */
  function endScene(g, t) {
    var tt = t - TEND + 1 / 30, gl = eio(seg(t, TEND - .22, TEND - 1 / 30)), c = lc(C0, FRAME0, gl), r = WR * c.s;
    if (LAYER === 'bg') { wallpaper(g, tt, 0); return; }
    if (LAYER === 'over') { var tip = hoverTip(c, tt); touchRings(g, tip[0] - 4, tip[1] + 2, tt, gl); drawHand(g, tip[0], tip[1], .32, 1.2 * clamp(r / 300, .82, 1)); return; }
    var exw = EXITING; if (gl > 0) EXITING = true;
    wifiButton(g, c.x, c.y, r, { dim: 0, peel: 0, t: t });
    EXITING = exw;
    closeLabel(g, c, 1, 1);
    var yo = eio(seg(t, TEND - .22, TEND - .06));
    [['YES', 330], ['NO', 690]].forEach(function (cc) {
      var tq0 = cc[0] === 'YES' ? K.yesE : K.noE, tp = Math.sin(Math.PI * seg(t, tq0 - .03, tq0 + .15)), kc = eout(seg(t, S('end').t0 - .3, S('end').t0 - .1)), sc = lerp(1.08, 1, kc) * (1 - .07 * tp) * (1 - yo);
      if (sc <= .01 || kc <= 0) return;
      var oc = ONPROP, ex0 = EXITING; ONPROP = true; EXITING = ex0 || yo > 0 || kc < 1;
      chip(g, cc[0], cc[1], 1316 + 8 * tp + 6 * Math.sin(t * 4.2 + (cc[0] === 'YES' ? 0 : 2.1)) * kc, { px: 112, wt: 900, bg: BG, line: CREAM, lw: 8, fg: CREAM, w: 250, h: 160, r: 54, shadow: true, a: kc * (1 - seg(yo, .5, .9)), s: sc, maxw: 250 });
      ONPROP = oc; EXITING = ex0;
    });
  }
  var QHIDE = 0;
  function qplate(g, x0, y0, w, lines, px, credits, seed, inn, out, retag, minpx) {
    if (inn <= 0 || out >= 1) return;
    var ex0 = EXITING, lh = px * 1.12, h = 26 + lines.length * lh + credits.length * 44 + 14;
    var ei = eout(clamp(inn, 0, 1)), eo = eio(clamp(out, 0, 1));
    g.save();
    if (ei < 1) { g.translate(110 * (1 - ei), 0); g.globalAlpha *= seg(ei, 0, .7); EXITING = true; }
    if (eo > 0) { EXITING = true; g.translate(x0, y0 + h); g.rotate(-.08 * eo); g.translate(-x0, -(y0 + h)); g.translate(-60 * eo, 50 * eo); g.globalAlpha *= 1 - eo; }
    sheet(g, x0, y0, x0 + w, y0 + h, seed, PAPER, 'quote');
    onprop(function () {
      lines.forEach(function (L, i) { if (QHIDE && i >= lines.length - QHIDE) return; txt(g, L, x0 + 28, y0 + 20 + lh * (i + .5), px, INK, 'left', 900, DISP, w - 56, 1, minpx || 44, 'condensed'); });
      if (!QHIDE) credits.forEach(function (c, i) {
        if (Array.isArray(c)) { font(g, 36, 800, DISP, 'condensed'); var cw0 = g.measureText(c[0] + '  ').width; txt(g, c[0], x0 + 28, y0 + 20 + lines.length * lh + 26 + i * 44, 36, '#5d564c', 'left', 800, DISP, 0, 1, 36, 'condensed'); txt(g, c[1], x0 + 28 + cw0, y0 + 20 + lines.length * lh + 26 + i * 44, 36, '#5d564c', 'left', 800, DISP, 0, 1, 36, 'condensed'); return; }
        txt(g, c, x0 + 28, y0 + 20 + lines.length * lh + 26 + i * 44, 36, '#5d564c', 'left', 800, DISP, (retag && i === credits.length - 1) ? w - 300 : w - 56, 1, 36, 'condensed'); });
    });
    if (retag) onprop(function () { tag(g, 'RE-CREATED', x0 + w - 130, y0 + h - 34, 1, 0, 230, INK, PAPER, 34); });
    EXITING = ex0; g.restore();
    return h;
  }
  function chipCard(g, text, x, y, a, px, maxw, dark) {
    if (a <= 0) return;
    var ex = EXITING; if (a < 1) EXITING = true;
    chip(g, text, x, y + 24 * (1 - a), { px: px || 52, wt: 900, bg: dark ? INK : CREAM, fg: dark ? CREAM : INK, line: dark ? CREAM : null, lw: 3, r: 14, st: 'condensed', rot: .012, a: a, maxw: maxw || 800 });
    EXITING = ex;
  }
  /* a time card / label chip slapped down (full opacity from its first frame) */
  function slapCard(g, text, x, y, t, t0, px, maxw) {
    if (t < t0 - .08) return;
    var k = eout(seg(t, t0 - .08, t0)), sc = lerp(1.3, 1, k), ex = EXITING; if (k < 1) EXITING = true;
    chip(g, text, x, y - 20 * (1 - k), { px: px || 52, wt: 900, bg: CREAM, fg: INK, r: 16, st: 'condensed', rot: .015, s: sc, a: seg(t, t0 - .08, t0 - .05), maxw: maxw || 820 });
    EXITING = ex;
  }
  /* ---------- captions ---------- */
  var CAPGROUPS = { hook: [[3, 3]], ask: [[4, 3]], apple: [[2, 3], [3, 3]], keep: [[2], [4]], dip: [[3, 4]], twist: [[2], [3, 3]], avail: [[3], [3, 2]], fiveam: [[4, 5]], cell: [[3], [3, 3]], bt: [[3], [2, 3]], check: [[2], [2, 3]], end: [[4], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', 'barely'], ['ask', 'button'], ['apple', 'minimal'], ['keep', 'Keep'], ['dip', 'tap'], ['twist', "doesn't"], ['avail', 'available'], ['fiveam', '5'], ['cell', 'less'], ['bt', 'Bluetooth'], ['check', 'Battery,'], ['end', 'off?']]
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
    var o1 = !nx ? Math.min(card0.t1 + .3, TEND - .08) : keep ? ns - .04 : Math.min(card0.t1 + .5, ns - .04), o0 = o1 - .1;   /* the last card holds to the cut */
    var fi = seg(t, s, s + .08), out = 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - s, 3.2, .8), 0, 1.04);
    g.save(); var cpx = CAPPX; font(g, cpx, 800, DISP, 'semi-expanded');
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = cpx * .3, maxw = 820, lines = [], lw, wi = 0;
    card0.split.forEach(function (n) { var ln = [], w = 0; for (var j = 0; j < n; j++, wi++) { if (w + ws[wi] > maxw && ln.length) { lines.push(ln); ln = []; w = 0; } ln.push(wi); w += ws[wi] + gap; } lines.push(ln); });
    lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    var lh = cpx * 1.18, y0 = 308 + cpx * .9;   /* pill tops at y ≥ 304; two lines end by y 446, clear of every prop (y ≥ 465) */
    /* r2: "Your phone did that." steps back to 50 % while the YOUR PHONE / DID THAT. plate says it */
    var dim = 1;
    g.globalAlpha = fi * out * dim * (alpha == null ? 1 : alpha);
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
  var NOISE, SCENES = { ccScene: ccScene, scaleScene: scaleScene, setScene: setScene, endScene: endScene };
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
  function tiltScene(g, Sc, t, dy) {
    bgLayer(g, function (l) { l.translate(0, dy); drawScene(l, Sc, t, 'bg'); });
    g.save(); safeClip(g); g.beginPath(); g.rect(0, 430, W, H); g.clip(); g.translate(0, dy); drawScene(g, Sc, t, 'fg'); g.restore();   /* nothing crosses the captions mid-tilt */
  }
  function fullScene(g, Sc, t) {
    bgLayer(g, function (l) { drawScene(l, Sc, t, 'bg'); });
    g.save(); safeClip(g); drawScene(g, Sc, t, 'fg'); g.restore();
    drawScene(g, Sc, t, 'over');   /* the hand: it reaches in from past the frame's edge, so it is never cut flat at the rail */
  }
  /* the wipe: a blank dark panel (no numbers, no words) slides across the whole frame, right → left; behind it the next
     scene is already built. Dark slate, so nothing outside the rail reads as a prop. */
  function roll(g, xb, t) {
    /* a strip of torn paper card: both long edges ripped, grain over the face */
    var w = 440, x0 = xb - w / 2, n = 40, r = mulberry(4401), L = [], R = [];
    for (var i = 0; i <= n; i++) { L.push(14 * r() + 6 * Math.sin(i * 1.7)); R.push(14 * r() + 6 * Math.sin(i * 2.3)); }
    function edge(off, sh) {
      g.beginPath(); for (var i = 0; i <= n; i++) g.lineTo(x0 + L[i] + off, -20 + (H + 40) * i / n + sh);
      for (i = n; i >= 0; i--) g.lineTo(x0 + w - R[i] + off, -20 + (H + 40) * i / n + sh); g.closePath();
    }
    g.fillStyle = 'rgba(0,0,0,.45)'; edge(-22, 0); g.fill();
    g.fillStyle = '#e9e1cf'; edge(-4, 0); g.fill();   /* the torn fibre edge shows lighter */
    g.fillStyle = SLATE; edge(4, 0); g.fill();
    edge(4, 0); g.save(); g.clip(); grainIn(g, x0, 0, w, H, 4402, 1.3);
    g.fillStyle = SLATE2; g.fillRect(x0 + 44, 0, 8, H); g.fillRect(x0 + w - 52, 0, 8, H); g.restore();
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var wk = Nx && !Nx.cut ? seg(te, Nx.t0 - (Nx.tw || TW), Nx.t0) : 0;
    if (wk > 0 && Nx.tilt) {
      var et = eio(wk), nr0 = NOREC; EXITING = true; NOREC = true;
      tiltScene(g, Sc, t, -1180 * et); NOREC = wk < .6; tiltScene(g, Nx, t, 1180 * (1 - et));
      EXITING = false; NOREC = nr0;
    } else if (wk > 0) {
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
    /* frame 0's tension: a little more contrast on the close-up, eased out after the hook and back in for the loop */
    var cst = 1 + .15 * (t < 4 ? 1 - seg(t, K.HK - .02, K.HK + .3) : seg(t, TEND - .7, TEND - .15));
    if (cst > 1.002) { if (!CCV) { CCV = mk(W, H); CCX = CCV.getContext('2d'); } CCX.clearRect(0, 0, W, H); CCX.drawImage(g.canvas, 0, 0); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'contrast(' + cst.toFixed(3) + ')'; g.drawImage(CCV, 0, 0); g.restore(); }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor((t > TEND - 1 / 30 ? t - TEND + 1 / 30 : t) * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null, CCV = null, CCX = null;
  function posterTitle(g) {
    /* the poster: the hero hold with the title in the caption's place */
    g.save(); font(g, 54, 800, DISP, 'semi-expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('Does turning off Wi-Fi', CX, 310);
    var b = 'save battery?', bp = 62, by = 392; font(g, bp, 800, DISP, 'expanded');
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, by - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, by); g.restore();
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
  var GAIN = { hk: .4, kp: .25, dp: .15, tw: .11, fa: .4, ce: .09, bc: .1, ck: .3 };
  var TYPE = { hk: 'tick', kp: 'paper', dp: 'thump', tw: 'slap', fa: 'tick', ce: 'pop', bc: 'click', ck: 'click' };
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
    function slapS(t, g) { g = g || 1; band(t, .06, 1600, .7, 5.5 * g, .001, .04); band(t, .03, 2800, 1.2, 3 * g, .001, .02); paperHit(t, g * 1.2); }
    /* a 1–3 kHz paper transient, layered on the knock and the slap so they read on a phone speaker */
    function paperHit(t, g) { band(t, .035, 1300, 1.1, 4.2 * g, .0008, .01); band(t + .004, .03, 2200, 1.3, 3.6 * g, .0008, .01); band(t + .009, .022, 2900, 1.6, 2.2 * g, .0008, .01); }
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
      paperHit(t, g);
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
    /* a short panel tear: crackle bursts over 0.13 s, dry */
    function tearS(t, g) {
      g = g || 1; var r2 = mulberry(93), tt = t;
      for (var i = 0; i < 7; i++) { band(tt, .016, 1300 + r2() * 2200, 1.6, (2.4 + r2() * 1.4) * g, .001, 0); tt += .01 + r2() * .012; }
      var n = noise(t, .14), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .9; bp.frequency.setValueAtTime(1700, t); bp.frequency.linearRampToValueAtTime(2900, t + .13);
      var ob = bus(1, 0, 0); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .015, .9 * g], [t + .1, .5 * g], [t + .14, 0]]);
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
    /* a plug seating: a short low plop (sine 520 → 260 Hz) with a 1–3 kHz paper click */
    function popS(t, g) { g = g || 1; var o = osc('sine', 520, t, t + .1, 1, [[t, 0], [t + .003, .4 * g], [t + .09, 0]], .02); o.frequency.exponentialRampToValueAtTime(260, t + .09); paperHit(t, g * .9); }
    EV.forEach(function (e) {
      if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'clink') clinkS(e.t, e.g);
      else if (e.type === 'buzz') buzzS(e.t, e.g);
      else if (e.type === 'rattle') rattleS(e.t, e.g);
      else
      if (e.type === 'thump') stampThump(e.t, e.g, .2);
      else if (e.type === 'swish') swishS(e.t, e.g);
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'paper') paperS(e.t, e.g);
      else if (e.type === 'knock') { knockS(e.t, e.g); if (e.id === 'nv') slapS(e.t, e.g * .8); }   /* r2: the gate slam gets a 1–3 kHz slap layer */
      else if (e.type === 'click') clickS(e.t, e.g);
      else if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'rip') ripS(e.t, e.g);
      else if (e.type === 'tear') tearS(e.t, e.g);
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
  /* the hero hold: NONE NAMED, from the slap through the lab line */
  var HOLD = { t0: K.doesnt, t1: K.five };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((K.TW + .35) * 30) / 30 + 1 / 60, SLUG: 'wifibattery', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
  };
  function times(step) { if (Array.isArray(step)) return step; var a = []; for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) a.push(t); return a; }
  window.CLIP_RUN = function (step) {
    var out = {};
    times(step).forEach(function (t) {
      PROPS = []; CURT = t; frame(ctx, t);
      PROPS.forEach(function (p) {
        var b = p.b, over = Math.max(SAFE_BOX.x0 - b[0], b[2] - SAFE_BOX.x1, SAFE_BOX.y0 - b[1], b[3] - SAFE_BOX.y1);
        if (over > 1) { var o = out[p.name] || (out[p.name] = { prop: p.name, from: t, to: t, over: 0, n: 0 }); o.to = t; o.n++; o.over = Math.max(o.over, Math.round(over)); }
      });
      PROPS = null;
    });
    return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.LABELS_RUN = function (step) {
    var out = {};
    times(step).forEach(function (t) {
      PROPS = []; LBL = []; CURT = t; frame(ctx, t);
      LBL.forEach(function (l) {
        PROPS.forEach(function (p) {
          var ox = Math.min(l.b[2], p.b[2]) - Math.max(l.b[0], p.b[0]), oy = Math.min(l.b[3], p.b[3]) - Math.max(l.b[1], p.b[1]);
          if (ox > 1 && oy > 1) { var key = l.text + ' × ' + p.name, o = out[key] || (out[key] = { label: l.text, prop: p.name, from: t, to: t, area: 0 }); o.to = t; o.area = Math.max(o.area, Math.round(ox * oy)); }
        });
      });
      PROPS = null; LBL = null;
    });
    return Object.keys(out).map(function (k) { return out[k]; });
  };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
