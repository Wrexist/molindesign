/* "This warning doesn't mean you're hacked." — Factory #30 (notprivate) on Tech, explained, after ../unlimiteddata/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the peephole check: the browser is a front door seen from inside, every site a visitor holding up a
   dated ID card (a certificate). A string runs from your wall calendar to a marker on the card's date ruler; inside the
   VALID window the chain slides off, outside it (same card, wrong clock) the warning pops out of the peephole. The Wi-Fi
   clerk and a stranger with a pasted-over card stand at the same door. One hero mark: the coral door chain snapping taut
   across the YOUR BANK door; coral is also on the end card's YES / NO and nowhere else. Scenes change under a blank
   sliding door panel. Everything drawn by hand: no logos, no browser colours; every warning screen says RE-CREATED.
   Props stay whole inside the safe box x 92–928, y 302–1428; backgrounds bleed full width. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#111a26', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f3ecdf', INK = '#211d26';
  var BLUEINK = '#24427a', SLATE = '#c3ccd6', SLATE2 = '#a9b4c1';
  var WOOD = '#a8774f', WOOD2 = '#875c3c', JAMB = '#d3cab8', BRASS = '#d8b25c', BRASS2 = '#a8843a', WALL = '#1a2533', SKIN = '#e2c3a0', GLOW = '#f1cf6b';
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
  BODY.buzz = .26; BODY.rattle = .26;
  var K = {
    hacked: at('hook', 'hacked'), hookEnd: lend('hook'),
    ask: start('ask'), conn: at('ask', 'connection'), askEnd: lend('ask'),
    card: start('card'), site: at('card', 'site'), shows: at('card', 'shows'), dated: at('card', 'dated'), idW: at('card', 'id'), cardEnd: lend('card'),
    clock: start('clock'), checks: at('clock', 'checks'), dates: at('clock', 'dates'), own: at('clock', 'own'), clockEnd: lend('clock'),
    wrong: start('wrong'), wclock: at('wrong', 'clock'), off: at('wrong', 'off'), real: at('wrong', 'real'), wcard: at('wrong', 'card'), fails: at('wrong', 'fails'), wrongEnd: lend('wrong'),
    study: start('study'), clocks: at('study', 'clocks'), third: at('study', 'third'), windows: at('study', 'windows'), studyEnd: lend('study'),
    wifi: start('wifi'), wwifi: at('wifi', 'wifi'), too: at('wifi', 'too'), sign: at('wifi', 'sign'), wifiEnd: lend('wifi'),
    dip: start('dip'), sometimes: at('dip', 'sometimes'), someone: at('dip', 'someones'), pretend: at('dip', 'pretending'), be: at('dip', 'be'), dipEnd: lend('dip'),
    check: start('check'), cclock: at('check', 'clock'), cwifi: at('check', 'wifi'), first: at('check', 'first'), checkEnd: lend('check'),
    bank: start('bank'), banking: at('bank', 'banking'), never: at('bank', 'never'), click: at('bank', 'click'), bankEnd: lend('bank'),
    end: start('end'), clicked: at('end', 'clicked'), yes: at('end', 'yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  (function () {
    place('hk', 'slap', K.hookEnd + .12, .16, K.hookEnd, K.ask);                          /* the strike across HACKED? */
    place('sw1', 'swish', K.card - .4, .16, K.askEnd, K.card);          /* sliding panel → the door */
    place('ok', 'click', voiceEnd('clock', K.wrong) + .08, .16, K.clockEnd, K.wrong);     /* the chain slides off */
    place('bz', 'buzz', voiceEnd('wrong', K.study) + .05, .16, K.wrongEnd, K.study);      /* the same card fails */
    place('sw3', 'swish', K.wifi - .3, .16, K.studyEnd, K.wifi);                          /* sliding panel → the door */
    place('s13', 'slap', voiceEnd('study', K.wifi) + .05, .16, K.studyEnd, GT.sw3 != null ? GT.sw3 - .03 : K.wifi);   /* 1 IN 3 slams down (no voice gap inside the line) */
    place('wf', 'paper', voiceEnd('wifi', K.dip) + .06, .16, K.wifiEnd, K.dip);           /* the clipboard drops away */
    place('kn1', 'knock', voiceEnd('dip', K.check) + .1, .16, K.dipEnd, K.check);         /* two slow knocks */
    if (GT.kn1 != null) place('kn2', 'knock', GT.kn1 + .38, .16, GT.kn1 + .2, K.check);
    place('sw4', 'swish', K.bank - .3, .16, K.checkEnd, K.bank);      /* sliding panel → the bank door */
    place('ch', 'rattle', voiceEnd('bank', K.end) + .1, .16, K.bankEnd, K.end);           /* THE hit: the chain snaps taut */
    GT.hero = GT.ch;
  })();
  var TW = .5;                                             /* a sliding-panel wipe: 0.5 s */
  K.HK = GT.hk != null ? GT.hk : K.hookEnd + .15;
  K.OK = GT.ok != null ? GT.ok : K.clockEnd + .2;
  K.BZ = GT.bz != null ? GT.bz : K.wrongEnd + .15;
  K.WF = GT.wf != null ? GT.wf : K.wifiEnd + .15;
  K.KN1 = GT.kn1 != null ? GT.kn1 : K.dipEnd + .2;
  K.KN2 = GT.kn2 != null ? GT.kn2 : 1e9;
  K.HERO = GT.ch != null ? GT.ch : K.bankEnd + .2;
  var SC = [
    { id: 'warn', fn: 'warnScene', name: 'Not private. Hacked?', t0: 0 },
    { id: 'door1', fn: 'doorScene', name: 'A dated ID card, checked with your clock', t0: K.card + .2 },
    { id: 'study', fn: 'studyScene', name: 'One Google study: 1 in 3 on Windows', t0: K.study + .45 },
    { id: 'door2', fn: 'doorScene', name: 'Wi-Fi sign-in, and a stranger', t0: K.wifi + .3 },
    { id: 'hero', fn: 'heroScene', name: 'On a banking site, never click through', t0: K.bank + .35 },
    { id: 'end', fn: 'endScene', name: 'Have you ever clicked through?', t0: K.end - .04, cut: true }
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
    if (ei < 1) { g.translate(560 * (1 - ei), 0); EXITING = true; }
    if (eo > 0) { EXITING = true; g.translate(x0, y0 + h); g.rotate(-.22 * eo); g.translate(-x0, -(y0 + h)); g.translate(-260 * eo, 900 * eo * eo); }
    sheet(g, x0, y0, x0 + w, y0 + h, seed, PAPER, 'quote');
    onprop(function () {
      lines.forEach(function (L, i) { txt(g, L, x0 + 30, y0 + 22 + lh * (i + .5), px, INK, 'left', 700, DISP, w - 60, 1, 36, 'condensed'); });
      txt(g, credit, x0 + 30, y0 + h - 30, 34, '#5d564c', 'left', 800, DISP, retag === false ? w - 60 : w - 250, 1, 30, 'condensed');
    });
    if (retag !== false) tag(g, 'RE-CREATED', x0 + w - 118, y0 + h - 32, 1, 0, 200, INK, PAPER, 30);
    EXITING = ex0;
    g.restore();
    return h;
  }

  /* =====================================================================================================
     PROPS (all paper, all drawn by hand)
     ===================================================================================================== */
  function brokenLock(g, x, y, u, wob) {
    g.save(); g.translate(x, y); g.scale(u, u);
    g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 22;
    g.beginPath(); g.moveTo(-46, 4); g.lineTo(-46, -50); g.arc(0, -50, 46, Math.PI, Math.PI * 1.6); g.stroke();
    /* the broken right half of the shackle, lifted out and turned */
    g.save(); g.translate(22, -30); g.rotate(.45 + (wob || 0));
    g.beginPath(); g.arc(0, -50, 46, Math.PI * 1.8, Math.PI * 2); g.lineTo(46, -16); g.stroke(); g.restore();
    g.fillStyle = INK; rr(g, -76, -8, 152, 120, 20); g.fill();
    g.fillStyle = PAPER; el(g, 0, 38, 15, 15); rr(g, -6, 42, 12, 36, 4); g.fill();
    g.restore();
  }
  /* the re-created warning page (generic: a blank browser bar, our own broken padlock, no logo, no browser colours) */
  var F0 = { cx: 510, cy: 1010, s: 1.05, rot: -.07 }, UP = { cx: 510, cy: 960, s: .9, rot: 0 }, SM = { cx: 510, cy: 1170, s: .73, rot: 0 }, SM2 = { cx: 510, cy: 1150, s: .78, rot: 0 };
  function lerpPose(a, b, k) { return { cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), s: lerp(a.s, b.s, k), rot: lerp(a.rot, b.rot, k) }; }
  function warnPage(g, P, t, o) {
    o = o || {};
    g.save(); g.translate(P.cx, P.cy); g.rotate(P.rot); g.scale(P.s, P.s);
    var w = 740, h = 700, x0 = -370, y0 = -350;
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, x0 + 14, y0 + 20, w, h, 30); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 30); g.fill();
    rr(g, x0, y0, w, h, 30); grainIn(g, x0, y0, w, h, 97, .8);
    prop(g, 'warning page', x0, y0, x0 + w, y0 + h);
    g.save(); rr(g, x0, y0, w, h, 30); g.clip(); g.fillStyle = '#2c3543'; g.fillRect(x0, y0, w, 78); g.restore();
    g.fillStyle = '#5a6473'; [0, 1, 2].forEach(function (i) { el(g, x0 + 40 + i * 30, y0 + 39, 9, 9); });
    g.fillStyle = '#3e4858'; rr(g, x0 + 150, y0 + 18, 540, 42, 21); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 4; rr(g, x0, y0, w, h, 30); g.stroke();
    brokenLock(g, 0, -150, 1, .04 * Math.sin(t * 2.6));
    onprop(function () { txt(g, 'NOT PRIVATE', 0, 34, 104, INK, 'center', 900, DISP, 680, 1, 40, 'condensed'); });
    var cw = chip(g, 'HACKED?', 0, 154, { px: 78, wt: 900, bg: INK, fg: CREAM, st: 'condensed', r: 18, shadow: false });
    if (o.strike > 0) {
      var sx0 = -cw / 2 - 6, sx1 = lerp(sx0, cw / 2 + 6, eout(clamp(o.strike, 0, 1)));
      g.lineCap = 'round';
      g.strokeStyle = INK; g.lineWidth = 22; g.beginPath(); g.moveTo(sx0, 170); g.lineTo(sx1, lerp(170, 136, (sx1 - sx0) / (cw + 12))); g.stroke();
      g.strokeStyle = CREAM; g.lineWidth = 12; g.beginPath(); g.moveTo(sx0, 170); g.lineTo(sx1, lerp(170, 136, (sx1 - sx0) / (cw + 12))); g.stroke();
    }
    if (o.sub > 0) chip(g, 'YOUR BROWSER STOPPED', 0, 244, { px: 50, wt: 900, bg: PAPER, line: INK, lw: 5, fg: INK, st: 'condensed', r: 14, shadow: false, s: o.sub, a: clamp(o.sub * 3, 0, 1) });
    tag(g, 'RE-CREATED', 246, -234, 1, 0, 300, INK, PAPER, 34);
    g.restore();
  }

  /* ---------- the front door, seen from inside: a paper jamb, a wood door, a peephole, a brass chain ---------- */
  var DR = { x0: 110, x1: 490, y0: 590, y1: 1420 }, PEEP = { x: 300, y: 742 };
  function chain(g, A, B, sag, col, size, lw) {
    size = size || 1;
    var cx = (A[0] + B[0]) / 2 + (B[1] > A[1] + 60 ? 26 : 0), cy = (A[1] + B[1]) / 2 + sag;
    function P(u) { var a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; return [a * A[0] + b * cx + c * B[0], a * A[1] + b * cy + c * B[1]]; }
    var len = 0, pv = A; for (var i = 1; i <= 24; i++) { var p = P(i / 24); len += Math.hypot(p[0] - pv[0], p[1] - pv[1]); pv = p; }
    var n = Math.max(3, Math.round(len / (16 * size)));
    g.save(); g.lineWidth = lw || 5;
    for (var k = 0; k < n; k++) {
      var u = (k + .5) / n, p0 = P(u), q = P(Math.min(1, u + .01)), ang = Math.atan2(q[1] - p0[1], q[0] - p0[0]), ry = (k % 2 ? 3 : 7) * size;
      g.save(); g.translate(p0[0], p0[1]); g.rotate(ang);
      g.strokeStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.ellipse(2, 4, 11.5 * size, ry, 0, 0, 6.283); g.stroke();
      g.strokeStyle = col; g.beginPath(); g.ellipse(0, 0, 11.5 * size, ry, 0, 0, 6.283); g.stroke();
      g.restore();
    }
    g.restore();
  }
  function door(g, t, st) {
    var J = st.jolt || 0, x0 = DR.x0, x1 = DR.x1, y0 = DR.y0, y1 = DR.y1;
    g.save(); g.translate(J, 0);
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x0 + 10, y0 + 12, x1 - x0, y1 - y0 - 12);
    g.fillStyle = JAMB; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); grainIn(g, x0, y0, x1 - x0, y1 - y0, 301, .7);
    if (Math.abs(J) < .5) prop(g, 'door', x0, y0, x1, y1);
    var px0 = x0 + 20, px1 = x1 - 20, py0 = y0 + 20, py1 = y1;
    /* the swing: the free edge comes toward us (about 18°): the panel narrows, its free edge stands taller, daylight fills the gap */
    var op = clamp(st.open || 0, 0, 1), pr = lerp(px1, px1 - 150, op), lift = 18 * op, sx = (pr - px0) / (px1 - px0);
    function X(x) { return px0 + (x - px0) * sx; }
    if (op > 0) { g.fillStyle = '#f4ead6'; g.fillRect(pr, py0, px1 - pr, py1 - py0); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(pr + 10, py0 + 10, Math.max(0, px1 - pr - 20), py1 - py0 - 20); }
    poly(g, [[px0, py0], [pr, py0 - lift], [pr, py1], [px0, py1]]); g.fillStyle = WOOD; g.fill();
    poly(g, [[px0, py0], [pr, py0 - lift], [pr, py1], [px0, py1]]); grainIn(g, px0, py0 - lift, pr - px0, py1 - py0 + lift, 303, 1.1);
    if (op > 0) { g.fillStyle = WOOD2; poly(g, [[pr, py0 - lift], [pr + 12 * op, py0 - lift + 4], [pr + 12 * op, py1], [pr, py1]]); g.fill(); }
    g.strokeStyle = WOOD2; g.lineWidth = 9;
    g.strokeRect(X(px0 + 42), py0 + 64, (px1 - px0 - 84) * sx, 300);
    g.strokeRect(X(px0 + 42), py0 + 430, (px1 - px0 - 84) * sx, 330);
    g.strokeStyle = 'rgba(255,240,215,.16)'; g.lineWidth = 3;
    g.strokeRect(X(px0 + 50), py0 + 72, (px1 - px0 - 100) * sx, 284);
    g.strokeRect(X(px0 + 50), py0 + 438, (px1 - px0 - 100) * sx, 314);
    /* the peephole */
    g.fillStyle = BRASS2; el(g, X(PEEP.x), PEEP.y + 2, 24, 24); g.fillStyle = BRASS; el(g, X(PEEP.x), PEEP.y, 22, 22); g.fillStyle = '#16120c'; el(g, X(PEEP.x), PEEP.y, 10, 10);
    /* the knob */
    g.fillStyle = BRASS2; rr(g, X(px1 - 46) - 15, 990, 30, 96, 12); g.fill(); g.fillStyle = BRASS; el(g, X(px1 - 46), 1036, 24, 24);
    /* the chain's slot on the door, its anchor on the jamb */
    g.fillStyle = BRASS2; rr(g, X(320), 878, X(440) - X(320), 28, 10); g.fill(); g.fillStyle = '#3b2f1d'; rr(g, X(330), 887, X(430) - X(330), 10, 5); g.fill();
    g.fillStyle = BRASS2; rr(g, x1 - 19, 866, 15, 50, 5); g.fill();
    var on = clamp(st.chain == null ? 1 : st.chain, 0, 1), A = [x1 - 12, 891];
    var B = [lerp(x1 - 6, X(338), on), lerp(1050, 891, on) - 30 * Math.sin(Math.PI * on)];
    chain(g, A, B, lerp(0, 14, on) + (st.rattle || 0) + 7 * Math.sin(t * 2.9) * on, BRASS, 1, 5);
    g.fillStyle = BRASS; el(g, B[0], B[1], 9, 9);
    g.restore();
  }
  /* ---------- the tear-off wall calendar: month band, day, year; flipping backwards drops pages in from the top ---------- */
  var CAL = { x0: 680, y0: 560, w: 220, h: 250 };
  var PAGES = [['NOV', 13], ['OCT', 13], ['SEP', 13], ['AUG', 13], ['JUL', 13], ['JUN', 13], ['MAY', 13], ['APR', 13]];
  function calPage(g, x0, y0, p) {
    var w = CAL.w, h = CAL.h;
    g.fillStyle = PAPER; g.fillRect(x0, y0, w, h);
    g.fillStyle = INK; g.fillRect(x0, y0, w, 64);
    onprop(function () {
      txt(g, p[0], x0 + w / 2, y0 + 36, 46, CREAM, 'center', 900, DISP, w - 30, 1, 36, 'condensed');
      txt(g, String(p[1]), x0 + w / 2, y0 + 136, 112, INK, 'center', 900, DISP, w - 30, 1, 60, 'condensed');
      txt(g, '2026', x0 + w / 2, y0 + h - 30, 36, '#5d564c', 'center', 800, DISP, w - 30, 1, 30, 'condensed');
    });
  }
  function calendar(g, x0, y0, f) {
    var w = CAL.w, h = CAL.h, i = Math.floor(f + 1e-6), k = f - i;
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x0 + 10, y0 + 14, w, h);
    calPage(g, x0, y0, PAGES[Math.min(PAGES.length - 1, i)]);
    if (k > .02 && i + 1 < PAGES.length) {
      var nr = NOREC; NOREC = true;
      g.save(); g.translate(x0, y0); g.scale(1, eout(k)); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(4, 6, w, h); calPage(g, 0, 0, PAGES[i + 1]); g.restore();
      NOREC = nr;
    }
    g.fillStyle = BRASS2; [.28, .72].forEach(function (u) { rr(g, x0 + w * u - 9, y0 - 16, 18, 34, 8); g.fill(); });
    prop(g, 'calendar', x0, y0 - 16, x0 + w, y0 + h);
  }
  /* ---------- the ID card: a certificate for shop.example with a date ruler (MAR 2026 → MAR 2027) and its VALID window ---------- */
  var CARD = { x0: 520, y0: 880, w: 400, h: 320 };
  var RUL = { x0: 552, x1: 888 };
  function mx(m) { return RUL.x0 + m * (RUL.x1 - RUL.x0) / 12; }                      /* months after Mar 1, 2026 */
  var WIN0 = mx(5), WIN1 = mx(11.47), TODAYM = 8.4;
  function idCard(g, x0, y0, o) {
    o = o || {}; var w = CARD.w, h = CARD.h, ry = y0 + 258;
    sheet(g, x0, y0, x0 + w, y0 + h, 611, PAPER, 'id card');
    g.fillStyle = INK; g.fillRect(x0 + 2, y0 + 2, w - 4, 74);
    /* a small closed padlock on the band */
    g.strokeStyle = CREAM; g.lineWidth = 6; g.beginPath(); g.arc(x0 + 42, y0 + 30, 11, Math.PI, 0); g.stroke(); g.fillStyle = CREAM; rr(g, x0 + 26, y0 + 30, 32, 26, 5); g.fill();
    onprop(function () {
      txt(g, 'CERTIFICATE', x0 + 72, y0 + 40, 56, CREAM, 'left', 900, DISP, w - 86, 1, 48, 'condensed');
      txt(g, 'shop.example', x0 + 26, y0 + 118, 56, INK, 'left', 800, DISP, w - 52, 1, 40, 'condensed');
      txt(g, 'VALID AUG 2026 – FEB 2027', x0 + 26, y0 + 172, 34, '#4d463d', 'left', 800, DISP, w - 52, 1, 30, 'condensed');
    });
    var X0 = x0 - CARD.x0;
    /* the date ruler: an ink band 64 px tall, month ticks, the VALID window; the window turns cream when the pin is inside */
    g.fillStyle = INK; rr(g, RUL.x0 + X0 - 20, ry - 32, RUL.x1 - RUL.x0 + 40, 64, 10); g.fill();
    g.strokeStyle = 'rgba(244,237,224,.7)'; g.lineWidth = 3;
    for (var m = 0; m <= 12; m++) { g.beginPath(); g.moveTo(mx(m) + X0, ry - 10); g.lineTo(mx(m) + X0, ry + 10); g.stroke(); }
    var gl = clamp(o.glow || 0, 0, 1);
    g.fillStyle = '#3d4350'; rr(g, WIN0 + X0, ry - 26, WIN1 - WIN0, 52, 8); g.fill();
    if (gl > 0) { g.fillStyle = 'rgba(244,237,224,' + gl.toFixed(3) + ')'; rr(g, WIN0 + X0, ry - 26, WIN1 - WIN0, 52, 8); g.fill(); }
    g.strokeStyle = CREAM; g.lineWidth = 4; rr(g, WIN0 + X0, ry - 26, WIN1 - WIN0, 52, 8); g.stroke();
    if (o.ma > 0) {
      var x = o.mx + X0; g.save(); g.globalAlpha *= clamp(o.ma, 0, 1); g.lineCap = 'round';
      g.strokeStyle = CREAM; g.lineWidth = 13; g.beginPath(); g.moveTo(x, y0 + 210); g.lineTo(x, ry + 36); g.stroke();
      g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y0 + 210); g.lineTo(x, ry + 36); g.stroke();
      poly(g, [[x - 17, y0 + 194], [x + 17, y0 + 194], [x, y0 + 218]]); g.fillStyle = INK; g.fill(); g.strokeStyle = CREAM; g.lineWidth = 3; g.stroke();
      g.restore();
    }
  }
  /* the string from the calendar to the card's marker */
  function string(g, mxp, k, cardX0) {
    if (k <= 0) return;
    var ax = CAL.x0 + CAL.w / 2, ay = CAL.y0 + CAL.h + 4, bx = mxp + (cardX0 - CARD.x0), by = CARD.y0 + 4;
    var e = eout(clamp(k, 0, 1));
    g.save(); g.strokeStyle = CREAM; g.lineWidth = 5; g.setLineDash([14, 10]); g.lineCap = 'round';
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(lerp(ax, bx, e), lerp(ay, by, e)); g.stroke(); g.setLineDash([]);
    g.fillStyle = CREAM; el(g, ax, ay, 8, 8); g.restore();
  }
  /* ---------- the warning popping out of the peephole (re-created, generic) ---------- */
  function miniWarn(g, k, J) {
    if (k <= 0) return;
    var e = Math.min(1, k), cx = lerp(PEEP.x + (J || 0), 300 + (J || 0), e), cy = lerp(PEEP.y, 792, e), s = Math.min(1.04, k);
    g.save(); g.translate(cx, cy); g.scale(s, s); var ex = EXITING; if (k < .97) EXITING = true;
    var w = 320, h = 236;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, -w / 2 + 10, -h / 2 + 14, w, h, 18); g.fill();
    g.fillStyle = PAPER; rr(g, -w / 2, -h / 2, w, h, 18); g.fill();
    g.save(); rr(g, -w / 2, -h / 2, w, h, 18); g.clip(); g.fillStyle = '#2c3543'; g.fillRect(-w / 2, -h / 2, w, 32); g.restore();
    prop(g, 'peephole warning', -w / 2, -h / 2, w / 2, h / 2);
    brokenLock(g, 0, -30, .42, 0);
    onprop(function () { txt(g, 'NOT PRIVATE', 0, 52, 48, INK, 'center', 900, DISP, w - 30, 1, 36, 'condensed'); });
    tag(g, 'RE-CREATED', 0, 96, 1, 0, 260, INK, PAPER, 30);
    EXITING = ex; g.restore();
  }
  /* ---------- the airport Wi-Fi clerk's clipboard ---------- */
  function wifiGlyph(g, x, y, s) {
    g.save(); g.strokeStyle = INK; g.lineWidth = 8 * s; g.lineCap = 'round';
    [1, 2, 3].forEach(function (i) { g.beginPath(); g.arc(x, y, 16 * i * s, -Math.PI * .78, -Math.PI * .22); g.stroke(); });
    g.fillStyle = INK; el(g, x, y, 6 * s, 6 * s); g.restore();
  }
  function clipboard(g, x0, y0, tap) {
    var w = 400, h = 340;
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, x0 + 10, y0 + 14, w, h, 18); g.fill();
    g.fillStyle = '#6f4f35'; rr(g, x0, y0, w, h, 18); g.fill();
    sheet(g, x0 + 22, y0 + 40, x0 + w - 22, y0 + h - 20, 641, PAPER, 'clipboard paper');
    g.fillStyle = '#9aa3ad'; rr(g, x0 + w / 2 - 70, y0 - 14, 140, 50, 10); g.fill(); g.fillStyle = '#7d8691'; rr(g, x0 + w / 2 - 40, y0 - 4, 80, 14, 6); g.fill();
    prop(g, 'clipboard', x0, y0 - 14, x0 + w, y0 + h);
    onprop(function () {
      txt(g, 'AIRPORT WI-FI', x0 + 46, y0 + 86, 36, '#4d463d', 'left', 800, DISP, 250, 1, 30, 'condensed');
      txt(g, 'SIGN IN TO', x0 + 46, y0 + 146, 52, INK, 'left', 900, DISP, 300, 1, 40, 'condensed');
      txt(g, 'WI-FI', x0 + 46, y0 + 200, 52, INK, 'left', 900, DISP, 300, 1, 40, 'condensed');
    });
    wifiGlyph(g, x0 + w - 58, y0 + 108, 1.1);
    var pr = Math.sin(Math.PI * clamp(tap || 0, 0, 1));
    g.fillStyle = INK; rr(g, x0 + 46, y0 + 240 + 3 * pr, w - 92, 60, 14); g.fill();
    onprop(function () { txt(g, 'SIGN IN', x0 + w / 2, y0 + 271 + 3 * pr, 40, CREAM, 'center', 900, DISP, w - 120, 1, 36, 'condensed'); });
    if (tap > 0 && tap < 1) {
      g.save(); g.globalAlpha *= 1 - seg(tap, .6, 1); g.strokeStyle = CREAM; g.lineWidth = 6;
      g.beginPath(); g.arc(x0 + w / 2 + 60, y0 + 270, 20 + 70 * seg(tap, .2, 1), 0, 6.283); g.stroke();
      g.fillStyle = SKIN; el(g, x0 + w / 2 + 84, y0 + 312 - 14 * pr, 30, 44); g.strokeStyle = 'rgba(33,29,38,.6)'; g.lineWidth = 4; g.beginPath(); g.ellipse(x0 + w / 2 + 84, y0 + 312 - 14 * pr, 30, 44, 0, 0, 6.283); g.stroke();
      g.restore();
    }
  }
  /* ---------- the stranger: a dark cut-paper silhouette with a rim of light; a card with the name pasted over ---------- */
  function stranger(g, cx, k, t, paste) {
    if (k <= 0) return;
    var dy = (1 - eout(k)) * 560;
    g.save(); g.translate(0, dy); var ex = EXITING; if (k < .99) EXITING = true;
    /* cut paper in the house look: a slate coat with its collar turned up, a hat brim low over a face in shadow */
    var r = mulberry(4242), RIM = 'rgba(244,237,224,.55)';
    function piece(P, col, seed, k) { var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; P.forEach(function (q) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); });
      g.fillStyle = col; cut(g, P, r, 3); if (seed) grainIn(g, x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8, seed, k || 1.2); g.strokeStyle = RIM; g.lineWidth = 3; g.stroke(); }
    /* the coat */
    piece([[cx - 172, 1420], [cx - 172, 1010], [cx - 150, 930], [cx - 66, 900], [cx + 66, 900], [cx + 150, 930], [cx + 172, 1010], [cx + 172, 1420]], '#2b3646', 4301, 1.3);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, 905); g.lineTo(cx + 10, 1420); g.stroke();
    /* the face, mostly shadow under the brim */
    g.fillStyle = '#5c463a'; el(g, cx, 832, 50, 58);
    g.fillStyle = 'rgba(10,12,18,.6)'; g.fillRect(cx - 52, 774, 104, 46);
    /* the turned-up collar: two lighter flaps */
    piece([[cx - 120, 920], [cx - 70, 838], [cx - 30, 868], [cx - 18, 950], [cx - 96, 968]], '#3b4a60', 4303, 1);
    piece([[cx + 120, 920], [cx + 70, 838], [cx + 30, 868], [cx + 18, 950], [cx + 96, 968]], '#3b4a60', 4305, 1);
    /* the hat: crown, band, a wide brim */
    piece([[cx - 66, 790], [cx - 58, 712], [cx - 22, 698], [cx + 26, 700], [cx + 60, 716], [cx + 66, 790]], '#161c26', 4307, 1);
    g.fillStyle = '#3a3340'; g.fillRect(cx - 64, 764, 128, 16);
    piece([[cx - 128, 796], [cx - 96, 780], [cx + 96, 780], [cx + 132, 794], [cx + 100, 808], [cx - 100, 808]], '#161c26', 0);
    prop(g, 'stranger', cx - 174, 690, cx + 174, 1420);
    /* the card it holds up: a certificate with someone else's name under a pasted slip */
    var c0 = cx - 190, cy0 = 930 + 6 * Math.sin(t * 2.1);
    sheet(g, c0, cy0, c0 + 380, cy0 + 250, 677, PAPER, 'fake card');
    g.fillStyle = INK; g.fillRect(c0 + 2, cy0 + 2, 376, 66);
    onprop(function () { txt(g, 'CERTIFICATE', c0 + 30, cy0 + 36, 48, CREAM, 'left', 900, DISP, 320, 1, 40, 'condensed'); });
    g.strokeStyle = 'rgba(33,29,38,.55)'; g.lineWidth = 7; g.lineCap = 'round';
    [[c0 + 30, cy0 + 120, 250], [c0 + 30, cy0 + 168, 300], [c0 + 30, cy0 + 214, 200]].forEach(function (L, i) { g.beginPath(); g.moveTo(L[0], L[1]); for (var j = 1; j <= 12; j++) g.lineTo(L[0] + L[2] * j / 12, L[1] + (j % 2 ? -7 : 7) * (i % 2 ? .6 : 1)); g.stroke(); });
    /* two gloved hands, cut paper */
    [[c0 + 26, 1], [c0 + 354, -1]].forEach(function (hd) { g.fillStyle = '#1c2230'; el(g, hd[0], cy0 + 236, 36, 27); g.strokeStyle = RIM; g.lineWidth = 3; g.beginPath(); g.ellipse(hd[0], cy0 + 236, 36, 27, 0, 0, 6.283); g.stroke();
      g.fillStyle = '#2a3242'; el(g, hd[0] + 16 * hd[1], cy0 + 214, 10, 18, .3 * hd[1]); });
    if (paste > 0) {
      var e = eout(seg(paste, 0, .2)), s = lerp(1.25, 1, e);
      g.save(); g.translate(c0 + 196, cy0 + 150); g.rotate(-.3); g.scale(s, s); g.globalAlpha *= seg(paste, 0, .05);
      var r = mulberry(919), pw = 330, ph = 92;
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(-pw / 2 + 6, -ph / 2 + 9, pw, ph);
      g.fillStyle = '#fbf6ea'; g.beginPath(); g.moveTo(-pw / 2, -ph / 2);
      for (var q = 0; q <= 14; q++) g.lineTo(-pw / 2 + pw * q / 14, -ph / 2 + (r() - .5) * 8);
      for (q = 0; q <= 6; q++) g.lineTo(pw / 2 + (r() - .5) * 14, -ph / 2 + ph * q / 6);
      for (q = 14; q >= 0; q--) g.lineTo(-pw / 2 + pw * q / 14, ph / 2 + (r() - .5) * 8);
      g.closePath(); g.fill();
      var ex2 = EXITING; if (e < 1) EXITING = true;
      onprop(function () { txt(g, 'shop.example', 0, 4, 52, INK, 'center', 800, DISP, pw - 30, 1, 40, 'condensed'); });
      EXITING = ex2; g.restore();
    }
    EXITING = ex; g.restore();
  }
  /* ---------- the wall behind the door (background, full width) ---------- */
  function wall(g, dim) {
    g.fillStyle = WALL; g.fillRect(-300, -300, W + 600, H + 600);
    g.fillStyle = 'rgba(255,255,255,.028)'; for (var x = -300; x < W + 300; x += 72) g.fillRect(x, -300, 30, 1720);
    g.fillStyle = '#243142'; g.fillRect(-300, 1420, W + 600, H); g.fillStyle = '#2f3e52'; g.fillRect(-300, 1416, W + 600, 8);
    if (dim > 0) { g.fillStyle = 'rgba(3,6,10,' + (.6 * dim).toFixed(3) + ')'; g.fillRect(-300, -300, W + 600, H + 600); }
  }
  /* a time card / label chip slapped down (full opacity from its first frame) */
  function slapCard(g, text, x, y, t, t0, px, maxw) {
    if (t < t0 - .08) return;
    var k = eout(seg(t, t0 - .08, t0)), sc = lerp(1.3, 1, k), ex = EXITING; if (k < 1) EXITING = true;
    chip(g, text, x, y - 20 * (1 - k), { px: px || 52, wt: 900, bg: CREAM, fg: INK, r: 16, st: 'condensed', rot: .015, s: sc, a: seg(t, t0 - .08, t0 - .05), maxw: maxw || 820 });
    EXITING = ex;
  }

  /* =====================================================================================================
     SCENE 1 · frame 0: the re-created warning, gliding; the strike across HACKED?; the search; Chrome's own sentence
     ===================================================================================================== */
  var QA = ['“Attackers might be', 'trying to steal your', 'information…”'];
  function warnScene(g, t) {
    if (LAYER === 'bg') return;
    /* frame 0: the big page already gliding; it shrinks to its low spot by 1.55 s so the search bar and Chrome's own
       sentence have room above it, then a slow push (s .73 → .78) while the question runs */
    var gk = seg(t, 0, 1.55), P = lerpPose(F0, SM, .4 * eout(gk) + .6 * sio(gk));
    P = lerpPose(P, SM2, sio(seg(t, 2.2, 5.4)));
    P.cy += drift(t, .3, .5 * seg(t, 1.5, 2.2));
    warnPage(g, P, t, { strike: seg(t, K.HK, K.HK + .1), sub: t >= K.HK ? pop(t, K.HK, 3.2) : 0 });
    /* the search bar pops in at 0.5 s above the page and has typed the words everyone searches by 1.6 s */
    var SB = .5, sa = seg(t, SB, SB + .12);
    if (sa > 0 && LIVE.text) {
      var y = 516, sc = lerp(.86, 1, Math.min(1, pop(t, SB, 3.4))), press = Math.sin(Math.PI * seg(t, 1.58, 1.74));
      sc *= 1 - .03 * press;
      g.save(); g.globalAlpha *= sa; g.translate(534, y); g.scale(sc, sc); g.translate(-534, -y);
      var ex = EXITING; if (sc < .995 || sa < 1) EXITING = true;
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 154, y - 50, 772, 116, 40); g.fill();
      g.fillStyle = PAPER; rr(g, 148, y - 58, 772, 116, 40); g.fill();
      prop(g, 'search bar', 148, y - 58, 920, y + 58);
      g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.arc(214, y - 6, 22, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(230, y + 10); g.lineTo(248, y + 29); g.stroke();
      /* typed as two halves, so each half is a read of its own */
      var A1 = 'your connection', A2 = 'is not private', k = seg(t, SB + .12, 1.58), n = Math.round((A1.length + 1 + A2.length) * k);
      var s1 = A1.slice(0, n), s2 = n > A1.length + 1 ? A2.slice(0, n - A1.length - 1) : '';
      var typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
      font(g, 46, 800, DISP, 'condensed'); var w1 = g.measureText(A1 + ' ').width, w2 = g.measureText(A2).width;
      /* "not private": a marker sweep behind the second half on the spoken word */
      var hl = seg(t, at('ask', 'not') - .04, at('ask', 'not') + .26);
      if (hl > 0 && s2) { g.fillStyle = GLOW; rr(g, 270 + w1, y - 30, (w2 + 16) * eout(hl), 56, 10); g.fill(); }
      onprop(function () { if (s1) txt(g, s1, 278, y - 2, 46, INK, 'left', 800, DISP, 0, 1, 30, 'condensed'); if (s2) txt(g, s2, 278 + w1, y - 2, 46, INK, 'left', 800, DISP, 0, 1, 30, 'condensed'); });
      NOREC = nr; s1 = s2 ? A1 + ' ' + s2 : s1;
      if (typing && Math.floor(t * 8) % 2 === 0) { font(g, 46, 800, DISP, 'condensed'); var cw = g.measureText(s1).width; g.fillStyle = INK; g.fillRect(282 + cw, y - 30, 5, 54); }
      EXITING = ex; g.restore();
    }
    /* Chrome's own sentence lands sharp by 1.95 s, before the strike, between the bar and the page (never over it) */
    quote(g, 110, 630, 560, QA, 40, 'CHROME WARNING PAGE', 211, seg(t, 1.6, 1.92), 0);
  }

  /* =====================================================================================================
     SCENES 2 and 4 · the door: the card, the calendar, the string (door1: right clock, wrong clock);
     the Wi-Fi clipboard, the stranger, the two checks (door2)
     ===================================================================================================== */
  var QC = ['“…the certificates', 'that websites use', 'to identify', 'themselves…”'];
  var QW = ['“…sign in to Wi-Fi', 'networks at places', 'like cafes or', 'airports.”'];
  var QD = ['“…an attacker is', 'trying to pretend', 'to be [site]…”'];
  function decay(t, t0, f, k) { if (t < t0) return 0; var dt = t - t0; return Math.sin(dt * f) * Math.exp(-dt * k); }
  /* door1's camera: a slow push 0.895 → 1.0 (×1.12) into the door and the card across 6–15 s; door2 holds at 1.0 */
  var CAMC = { x: 515, y: 1010 };
  function doorCam(t, two) { return two ? 1 : lerp(.895, 1, sio(seg(t, 6.0, 15.0))); }
  function camOn(g, c) { g.translate(CAMC.x, CAMC.y); g.scale(c, c); g.translate(-CAMC.x, -CAMC.y); }
  /* door1: on the latch click the chain slides off and the door swings ~18° open; it stays open while the calendar flips
     back, and slams shut onto the chain on the buzz */
  function door1State(t) {
    var slam = Math.pow(seg(t, K.BZ - .14, K.BZ), 2);
    return { off: eout(seg(t, K.OK, K.OK + .25)) * (1 - seg(t, K.BZ - .02, K.BZ + .08)), open: eout(seg(t, K.OK + .06, K.OK + .62)) * (1 - slam) };
  }
  function doorScene(g, t) {
    var two = t >= S('door2').t0 - TW - .02;
    var dim = two ? eio(seg(t, K.sometimes - .05, K.sometimes + .35)) * (1 - eio(seg(t, K.check - .05, K.check + .35))) : 0;
    var cam = doorCam(t, two), st1 = !two ? door1State(t) : { off: 0, open: 0 };
    if (LAYER === 'bg') {
      g.save(); camOn(g, cam); wall(g, dim);
      if (st1.open > 0) {   /* daylight through the gap: a cream wedge across the floor */
        var o = st1.open, gx1 = DR.x1 - 20, gx0 = gx1 - 150 * o;
        g.fillStyle = 'rgba(244,237,224,' + (.34 * o).toFixed(3) + ')';
        poly(g, [[gx0, 1424], [gx1, 1424], [gx1 + 470 * o, 2000], [gx0 + 60 * o, 2000]]); g.fill();
        g.fillStyle = 'rgba(244,237,224,' + (.16 * o).toFixed(3) + ')';
        poly(g, [[gx0 - 30, 1424], [gx1 + 30, 1424], [gx1 + 620 * o, 2000], [gx0 - 20, 2000]]); g.fill();
      }
      g.restore(); return;
    }
    var T0 = two ? S('door2').t0 : S('door1').t0, d = drift(t, .5, .4);
    var jolt = two ? 6 * (decay(t, K.KN1, 46, 9) + decay(t, K.KN2, 46, 9)) : 5 * decay(t, K.BZ, 46, 9);
    var rattle = !two ? 14 * decay(t, K.BZ, 38, 6) : 0;
    g.save(); camOn(g, cam);
    door(g, t, { open: st1.open, chain: 1 - st1.off, jolt: jolt, rattle: rattle });
    /* the calendar and YOUR CLOCK */
    var f = !two ? 7 * eio(seg(t, K.wclock, K.off + .2)) : 0;
    var calIn = !two ? fin(t, K.clock + .02, 3.5) : 1, calY = !two ? -70 * (1 - Math.min(1, pop(t, K.clock + .02, 3))) : 0;
    var calOut = two ? eio(seg(t, K.sometimes, K.sometimes + .4)) * (1 - eio(seg(t, K.check - .3, K.check + .05))) : 0;
    var showCal = calIn > 0 && calOut < 1;
    if (showCal) {
      g.save(); g.globalAlpha *= calIn * (1 - calOut); var ex = EXITING; if (calIn < .95 || calOut > 0) EXITING = true;
      g.translate(0, calY - 90 * calOut + d * .2);
      var nr = NOREC; if (f > 0 && f < 7) NOREC = true;
      calendar(g, CAL.x0, CAL.y0, f); NOREC = nr;
      if (!(two && t >= K.check)) { txt(g, 'YOUR', 600, 652, 44, CREAM, 'center', 900, DISP, 150, 1, 36, 'condensed'); txt(g, 'CLOCK', 600, 702, 44, CREAM, 'center', 900, DISP, 150, 1, 36, 'condensed'); }
      EXITING = ex; g.restore();
    }
    /* the card: slides in on "site" (door1), already up in door2; leaves as the stranger rises; dips on "fails" */
    var ci = !two ? eout(seg(t, K.site - .25, K.site + .25)) : 1, cOut = two ? eio(seg(t, K.someone - .2, K.someone + .25)) : 0;
    var shake = !two ? 12 * decay(t, K.BZ, 50, 7) : 0, dip = !two ? 24 * eout(seg(t, K.fails - .03, K.fails + .12)) * (1 - sio(seg(t, K.fails + .45, K.fails + .9))) : 0;
    var cx0 = CARD.x0 + 160 * (1 - ci) + 160 * cOut + shake + 5 * Math.sin(t * 1.7 + 1), cy0 = CARD.y0 + 12 * Math.sin(t * 2.3) + dip;   /* held up by a hand: it sways */
    var mk = mx(TODAYM - f), inside = mk >= WIN0 && mk <= WIN1;
    var ma = !two ? seg(t, K.checks, K.checks + .25) : 1, glow = inside ? (!two ? fin(t, K.dates, 4) : 1) * (.9 + .1 * Math.sin(t * 5)) : 0;
    if (!two) glow = Math.max(glow, inside ? .7 * Math.sin(Math.PI * seg(t, K.dated, K.dated + .5)) : 0);
    if (ci > 0 && cOut < 1) {
      g.save(); g.globalAlpha *= seg(ci, 0, .3) * (1 - seg(cOut, .5, 1)); var ex2 = EXITING; if (ci < 1 || cOut > 0 || Math.abs(shake) > .5) EXITING = true;
      if (showCal) { g.save(); g.globalAlpha *= calIn * (1 - calOut); string(g, mk, ma, cx0); g.restore(); }
      idCard(g, cx0, cy0, { ma: ma * (1 - calOut), mx: mk, glow: glow });
      EXITING = ex2; g.restore();
    }
    g.restore();   /* camera off: the chips and quote strips are screen-space labels */
    /* door1: the fail, both labels beside the card */
    if (!two) {
      var sa = fin(t, K.off - .08, 4), wa = fin(t, K.off - .02, 4);
      if (sa > 0) chip(g, 'SAME CARD', 720, 1270, { px: 52, wt: 900, bg: CREAM, fg: INK, a: sa, st: 'condensed', r: 16 });
      if (wa > 0) chip(g, 'WRONG CLOCK', 720, 1352, { px: 52, wt: 900, bg: CREAM, fg: INK, a: wa, st: 'condensed', r: 16 });
      quote(g, 520, 560, 400, QC, 40, 'CHROME', 233, seg(t, K.card + .16, K.card + .46), seg(t, K.clock - .2, K.clock + .1));
    }
    if (two) { var ya = fin(t, K.check - .05, 4); if (ya > 0) chip(g, 'YOUR DATE & TIME', 710, 868, { px: 48, wt: 900, bg: CREAM, fg: INK, a: ya, st: 'condensed', r: 16, maxw: 400 }); }
    /* door2: the Wi-Fi clipboard covers the card; the tap on "sign in" sends it away; it comes back for the check */
    if (two) {
      var cbIn = eout(seg(t, K.wifi - .15, K.wwifi + .1)), cbOut = eio(seg(t, K.WF - .1, K.WF + .3)), cb2 = eout(seg(t, K.check - .1, K.check + .3));
      if (cbIn > 0 && cbOut < 1) {
        g.save(); g.globalAlpha *= seg(cbIn, 0, .3); var ex3 = EXITING; if (cbIn < 1 || cbOut > 0) EXITING = true;
        g.translate(0, 440 * (1 - cbIn) + 560 * cbOut * cbOut); clipboard(g, 520, 868, seg(t, K.sign - .1, K.sign + .45));
        EXITING = ex3; g.restore();
      }
      if (cb2 > 0) {
        g.save(); g.globalAlpha *= seg(cb2, 0, .3); var ex4 = EXITING; if (cb2 < 1) EXITING = true;
        g.translate(0, 440 * (1 - cb2) + d * .3); clipboard(g, 520, 940, 0);
        EXITING = ex4; g.restore();
        var wa2 = fin(t, K.check + .15, 4); if (wa2 > 0) chip(g, 'WI-FI SIGN-IN', 720, 1356, { px: 48, wt: 900, bg: CREAM, fg: INK, a: wa2, st: 'condensed', r: 16, maxw: 410 });
      }
    }
    /* the lights drop: a shade over the door and the props (the wall is shaded in the background layer) */
    if (dim > 0) {   /* shade only the props (the wall is shaded in the background layer), so no box shows at the rail */
      g.fillStyle = 'rgba(3,6,10,' + (.5 * dim).toFixed(3) + ')';
      g.fillRect(DR.x0 + jolt - 2, DR.y0 - 2, DR.x1 - DR.x0 + 16, DR.y1 - DR.y0 + 4);
      if (showCal) g.fillRect(CAL.x0 - 4, CAL.y0 - 20 + calY - 90 * calOut, CAL.w + 16, CAL.h + 36);
      if (ci > 0 && cOut < 1) g.fillRect(cx0 - 2, cy0 - 2, CARD.w + 12, CARD.h + 14);
    }
    if (two) {
      var sk = eout(seg(t, K.someone - .15, K.someone + .45)) * (1 - eio(seg(t, K.check - .1, K.check + .35)));
      stranger(g, 720, sk, t, t >= K.pretend - .02 ? seg(t, K.pretend - .02, K.pretend + .5) : 0);
    }
    /* the warning in the peephole: the same screen for every visitor */
    var mw = 0;
    if (!two) mw = t >= K.BZ - .01 ? pop(t, K.BZ - .01, 3.2) : 0;
    else {
      if (t >= K.too - .05) mw = pop(t, K.too - .05, 3.2) * (1 - eio(seg(t, K.sign + .3, K.sign + .55)));
      if (t >= K.be - .05) mw = pop(t, K.be - .05, 3.2) * (1 - eio(seg(t, K.check - .1, K.check + .2)));
    }
    g.save(); camOn(g, cam); miniWarn(g, mw, jolt); g.restore();
    if (two) {
      quote(g, 96, 1010, 420, QW, 40, 'CHROME HELP', 245, seg(t, K.wifi + .1, K.wifi + .4), seg(t, K.sometimes + .1, K.sometimes + .45), false);   /* a help-page sentence, not a screen: no RE-CREATED */
      quote(g, 100, 1010, 400, QD, 40, 'CHROME', 257, seg(t, K.someone - .35, K.someone - .05), seg(t, K.check + .35, K.check + .7));
    }
  }

  /* =====================================================================================================
     SCENE 3 · the study: nine warning slips, every third with a calendar; 1 IN 3, scoped in big type
     ===================================================================================================== */
  /* a slip: a tiny copy of frame 0's warning page (dark bar, broken padlock, NOT PRIVATE); the clock ones get a calendar sticker */
  function slip(g, cx, cy, w, h, seed, icon, flash) {
    var x0 = cx - w / 2, y0 = cy - h / 2;
    sheet(g, x0, y0, x0 + w, y0 + h, seed, PAPER, 'slip');
    g.fillStyle = '#2c3543'; g.fillRect(x0 + 2, y0 + 2, w - 4, 24);
    g.fillStyle = '#5a6473'; [0, 1, 2].forEach(function (i) { el(g, x0 + 16 + i * 11, y0 + 14, 3.5, 3.5); });
    g.fillStyle = '#3e4858'; rr(g, x0 + 56, y0 + 7, w - 76, 13, 6); g.fill();
    brokenLock(g, x0 + 50, cy + 22, .34, 0);
    onprop(function () {
      txt(g, 'NOT', x0 + 92, cy + 2, 36, INK, 'left', 900, DISP, w - 102, 1, 30, 'condensed');
      txt(g, 'PRIVATE', x0 + 92, cy + 38, 36, INK, 'left', 900, DISP, w - 102, 1, 30, 'condensed');
    });
    if (icon > 0) {
      g.strokeStyle = CREAM; g.lineWidth = 6 + 4 * (flash || 0); g.strokeRect(x0 - 5, y0 - 5, w + 10, h + 10);
      var s = lerp(1.4, 1, eout(seg(icon, 0, .4)));
      g.save(); g.translate(x0 + w - 12, y0 + 10); g.rotate(.12); g.scale(s, s); g.globalAlpha *= seg(icon, 0, .1);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-24, -22, 56, 58);
      g.fillStyle = CREAM; g.fillRect(-28, -26, 56, 58); g.fillStyle = INK; g.fillRect(-28, -26, 56, 17);
      g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(-28, -26, 56, 58);
      g.fillStyle = INK; for (var i = 0; i < 3; i++) for (var j = 0; j < 2; j++) g.fillRect(-21 + i * 16, -2 + j * 15, 10, 9);
      g.restore();
    }
  }
  function studyScene(g, t) {
    if (LAYER === 'bg') return;
    var T0 = S('study').t0, d = drift(t, .9, .35), SL = GT.s13 != null ? GT.s13 : 1e9;
    var flash = Math.max(0, 1 - Math.abs(t - SL) / .25);
    chip(g, '2016–17 · GOOGLE STUDY', 510, 590, { px: 56, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 16, rot: -.012 });
    var cols = [254, 510, 766], rows = [742, 902, 1062];
    for (var i = 0; i < 9; i++) {
      var r = Math.floor(i / 3), c = i % 3, t0 = T0 - .35 + i * .07, k = eout(seg(t, t0, t0 + .35));
      if (k <= 0) continue;
      var third = c === 2, dimk = third ? 0 : seg(t, K.third, K.third + .3);
      var ic = third ? (t >= K.clocks + r * .12 ? seg(t, K.clocks + r * .12, K.clocks + r * .12 + .3) : 0) : 0, grow = 1 + .12 * eout(seg(ic, 0, 1));
      var x = lerp(510, cols[c], k), y = lerp(1300, rows[r], k) + (k >= 1 ? 4 * Math.sin(t * 2.4 + i) : 0) + d * .2;
      g.save(); g.globalAlpha *= seg(k, 0, .25) * (1 - .5 * dimk); var ex = EXITING; if (k < 1 || (ic > 0 && ic < 1)) EXITING = true;
      g.translate(x, y); g.rotate((1 - k) * (c - 1) * .3 + (i % 2 ? .012 : -.012)); g.scale(grow, grow);
      slip(g, 0, 0, 226, 140, 700 + i, ic, flash);
      EXITING = ex; g.restore();
    }
    var ta = fin(t, K.clocks + .05, 4);
    if (ta > 0) {
      var lift = sio(seg(t, SL - .3, SL - .06)) * (1 - eout(seg(t, SL - .06, SL)));
      chip(g, '1 IN 3', 248, 1218 - 14 * lift, { px: 86, wt: 900, bg: CREAM, fg: INK, a: ta, st: 'condensed', r: 18, s: (1 + .12 * Math.sin(Math.PI * seg(t, K.third - .04, K.third + .2))) * (1 + .16 * lift) });
      txt(g, 'WARNINGS:', 418, 1190, 42, CREAM, 'left', 900, DISP, 480, ta, 36, 'condensed');
      txt(g, 'A WRONG CLOCK', 418, 1242, 52, CREAM, 'left', 900, DISP, 490, ta, 40, 'condensed');
    }
    chip(g, 'CHROME ON WINDOWS', 510, 1318, { px: 52, wt: 900, bg: null, line: CREAM, lw: 4, fg: CREAM, st: 'condensed', r: 16 });
    txt(g, 'ACER ET AL. · GOOGLE · CCS 2017', 510, 1398, 34, CREAM, 'center', 800, DISP, 800, 1, 30, 'condensed');
  }

  /* =====================================================================================================
     SCENE 5 · the hero: the YOUR BANK door opens a crack, fingers come through, the coral chain snaps taut
     ===================================================================================================== */
  /* a cut-paper hand reaching left, ~140 px from wrist to fingertips: back of the hand, four fingers with knuckle shading,
     a thumb on top, a coat cuff at the wrist (origin = the wrist) */
  var SKIN2 = '#c49c78', SKIN3 = '#a98263';
  function hand(g) {
    var OL = 'rgba(33,29,38,.6)';
    g.fillStyle = '#2b3646'; rr(g, -4, -46, 60, 92, 10); g.fill(); g.strokeStyle = 'rgba(244,237,224,.5)'; g.lineWidth = 3; rr(g, -4, -46, 60, 92, 10); g.stroke();
    [[-30, 66], [-10, 76], [10, 72], [29, 58]].forEach(function (f, i) {
      var y = f[0], L = f[1];
      g.fillStyle = SKIN; rr(g, -62 - L, y - 10, L + 20, 20, 10); g.fill();
      g.strokeStyle = OL; g.lineWidth = 2.5; rr(g, -62 - L, y - 10, L + 20, 20, 10); g.stroke();
      g.fillStyle = SKIN2; el(g, -66, y + 1, 10, 8);                                   /* the knuckle */
      g.strokeStyle = SKIN3; g.lineWidth = 2; g.beginPath(); g.moveTo(-62 - L * .45, y - 6); g.lineTo(-62 - L * .45, y + 6); g.stroke();   /* the middle crease */
      g.fillStyle = 'rgba(255,240,220,.35)'; rr(g, -56 - L, y - 7, 10, 6, 3); g.fill();   /* a nail glint */
    });
    poly(g, [[0, -40], [-66, -42], [-74, 40], [0, 42]]); g.fillStyle = SKIN; g.fill(); g.strokeStyle = OL; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = SKIN2; poly(g, [[0, 22], [-70, 24], [-74, 40], [0, 42]]); g.fill();       /* the shaded underside */
    g.fillStyle = SKIN2; [-30, -10, 10].forEach(function (y) { el(g, -64, y + 10, 6, 3); });
    g.save(); g.translate(-38, -40); g.rotate(-.55);                                         /* the thumb, on top */
    g.fillStyle = SKIN; rr(g, -56, -11, 64, 22, 11); g.fill(); g.strokeStyle = OL; g.lineWidth = 2.5; rr(g, -56, -11, 64, 22, 11); g.stroke();
    g.fillStyle = SKIN2; el(g, -2, 2, 9, 7); g.restore();
  }
  var HD = { x0: 120, x1: 900, y0: 560, y1: 1262 };
  function heroScene(g, t) {
    if (LAYER === 'bg') { wall(g, 0); return; }
    var x0 = HD.x0, x1 = HD.x1, y0 = HD.y0, y1 = HD.y1, d = drift(t, .4, .3);
    var snap = t >= K.HERO - .02 ? eout(seg(t, K.HERO - .02, K.HERO + .06)) : 0;
    var open = eout(seg(t, K.never - .1, K.never + .5)) * (1 - .3 * snap) + .06 * Math.sin(Math.PI * seg(t, K.HERO - .02, K.HERO + .18));
    g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(x0 + 12, y0 + 14, x1 - x0, y1 - y0 - 14);
    g.fillStyle = JAMB; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); grainIn(g, x0, y0, x1 - x0, y1 - y0, 351, .7);
    prop(g, 'bank door', x0, y0, x1, y1);
    var px0 = x0 + 22, px1 = x1 - 22, py0 = y0 + 22, pr = px1 - 48 * clamp(open, 0, 1.2), sx = (pr - px0) / (px1 - px0);
    function X(x) { return px0 + (x - px0) * sx; }
    if (open > 0) { g.fillStyle = '#f7e6bd'; g.fillRect(pr, py0, px1 - pr, y1 - py0); }
    g.fillStyle = WOOD; g.fillRect(px0, py0, pr - px0, y1 - py0);
    g.beginPath(); g.rect(px0, py0, pr - px0, y1 - py0); grainIn(g, px0, py0, pr - px0, y1 - py0, 353, 1.1);
    g.strokeStyle = WOOD2; g.lineWidth = 10; g.strokeRect(X(px0 + 50), py0 + 220, (px1 - px0 - 100) * sx, 410);
    g.strokeStyle = 'rgba(255,240,215,.16)'; g.lineWidth = 3; g.strokeRect(X(px0 + 60), py0 + 230, (px1 - px0 - 120) * sx, 390);
    /* the plaque */
    var plx = X(510);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, plx - 220 + 6, 640 + 8, 440, 116, 16); g.fill();
    g.fillStyle = CREAM; rr(g, plx - 220, 640, 440, 116, 16); g.fill(); g.strokeStyle = BRASS2; g.lineWidth = 6; rr(g, plx - 220, 640, 440, 116, 16); g.stroke();
    onprop(function () { txt(g, 'YOUR BANK', plx, 700, 84, INK, 'center', 900, DISP, 400, 1, 50, 'condensed'); });
    g.fillStyle = BRASS; el(g, plx, 604, 13, 13); g.fillStyle = '#16120c'; el(g, plx, 604, 6, 6);
    /* the knob */
    g.fillStyle = BRASS2; rr(g, X(px1 - 56) - 16, 1000, 32, 104, 12); g.fill(); g.fillStyle = BRASS; el(g, X(px1 - 56), 1050, 27, 27);
    /* fingers through the gap */
    var fk = eout(seg(t, K.click - .15, K.click + .3)) * (1 - .25 * snap);
    if (fk > 0 && open > .2) {
      g.save(); g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
      g.translate(pr + 30 + 120 * (1 - fk), 1000 + 3 * Math.sin(t * 3.1)); g.rotate(-.08 - .06 * snap); hand(g);
      g.restore();
    }
    /* THE chain: coral, across the whole door, from a plate on the door to the jamb; slack, then taut on the snap */
    var A = [x0 + 44, 930], B = [x1 - 10, 930];
    g.fillStyle = BRASS2; rr(g, A[0] - 14, 900, 30, 60, 8); g.fill(); rr(g, B[0] - 10, 900, 18, 60, 6); g.fill();
    var sag = lerp(lerp(150, 70, clamp(open, 0, 1)), 0, snap) + 10 * decay(t, K.HERO + .05, 40, 10);
    chain(g, A, B, sag, HOT, 1.5, 8);
    prop(g, 'chain', A[0], 920, B[0], 940 + Math.max(0, sag));
    /* the re-created link under it, struck through on "never" */
    /* the re-created warning's two buttons: Chrome's own "Back to safety" (cream, never coral) and the struck "Proceed to … (unsafe)" */
    var sy = 1318 + d * .2;
    sheet(g, 100, sy - 40, 920, sy + 40, 911, PAPER, 'warning buttons');
    font(g, 42, 800, DISP, 'condensed'); var bw = g.measureText('Back to safety').width + 44;
    g.fillStyle = CREAM; rr(g, 120, sy - 30, bw, 60, 14); g.fill(); g.strokeStyle = INK; g.lineWidth = 4; rr(g, 120, sy - 30, bw, 60, 14); g.stroke();
    onprop(function () { txt(g, 'Back to safety', 120 + bw / 2, sy, 42, INK, 'center', 800, DISP, 0, 1, 40, 'condensed'); });
    var px = 120 + bw + 30;
    onprop(function () { txt(g, 'Proceed to … (unsafe)', px, sy, 40, BLUEINK, 'left', 700, DISP, 900 - px, 1, 36, 'condensed'); });
    font(g, 40, 700, DISP, 'condensed'); var lw = Math.min(900 - px, g.measureText('Proceed to … (unsafe)').width);
    g.fillStyle = BLUEINK; g.fillRect(px, sy + 20, lw, 3);
    var sk = seg(t, K.never - .02, K.never + .12);
    if (sk > 0) { g.strokeStyle = INK; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(px - 10, sy + 6); g.lineTo(lerp(px - 10, px + 10 + lw, sk), sy - 4); g.stroke(); }
    tag(g, 'RE-CREATED', 812, sy + 76, 1, 0, 190, CREAM, BG, 30);
    var ca = fin(t, K.banking - .05, 4);
    if (ca > 0) chip(g, 'BANK · SHOPPING · ANY LOGIN', 510, 512, { px: 52, wt: 900, bg: CREAM, fg: INK, a: ca, st: 'condensed', r: 16, maxw: 800 });
  }

  /* =====================================================================================================
     SCENE 6 · the end: frame 0's page at full opacity, YES / NO; it glides back to frame 0's place and tilt
     ===================================================================================================== */
  function endScene(g, t) {
    if (LAYER === 'bg') return;
    var u = sio(seg(t, TEND - 1.0, TEND)), P = lerpPose(UP, F0, u), bob = 1 - seg(t, TEND - 1.2, TEND - .6);
    P.cy += drift(t, .3, .9 * bob);
    warnPage(g, P, t, {});
    var E0 = S('end').t0, kc = eout(seg(t, E0, E0 + .12)), sc0 = lerp(1.15, 1, kc);
    [['YES', 300], ['NO', 720]].forEach(function (c) {
      var tq0 = c[0] === 'YES' ? K.yes : K.noE, tp = Math.sin(Math.PI * seg(t, tq0 - .03, tq0 + .15)), sc = sc0 * (1 - .07 * tp);
      chip(g, c[0], c[1], 1336 + 10 * tp, { px: 116, wt: 900, bg: BG, line: HOT, lw: 8, fg: HOT, w: 300, h: 160, r: 60, shadow: true, a: 1, s: sc });
    });
  }
  /* ---------- captions: the narrator's words in phrase cards (one size); stressed words get a cream pill (never coral) ---------- */
  var CAPGROUPS = { hook: [[3, 3]], ask: [[5], [2, 3]], card: [[3, 3], [4]], clock: [[3, 2], [4]], wrong: [[3, 2], [4]], study: [[3], [2, 3, 2]], wifi: [[2, 3], [4]], dip: [[2], [2, 4]], check: [[4], [4]], bank: [[4], [3]], end: [[3, 2], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', 'hacked'], ['ask', 'private'], ['card', 'dated'], ['clock', 'clock'], ['wrong', 'fails'], ['study', 'third'], ['wifi', 'sign'], ['dip', 'pretending'], ['check', 'first'], ['bank', 'never'], ['end', 'clicked']]
    .map(function (p) { return at(p[0], p[1]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPPX = 58, CAPMIN = 1e9;
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
    g.save(); var cpx = CAPPX; font(g, cpx, 800, DISP, 'expanded');
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = cpx * .3, maxw = 820, lines = [], lw, wi = 0;
    card0.split.forEach(function (n) { var ln = [], w = 0; for (var j = 0; j < n; j++, wi++) { if (w + ws[wi] > maxw && ln.length) { lines.push(ln); ln = []; w = 0; } ln.push(wi); w += ws[wi] + gap; } lines.push(ln); });
    lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    var lh = cpx * 1.18, y0 = Math.max(440 - (lines.length - 1) * lh / 2, 308 + cpx * .9);   /* pill tops at y ≥ 304 */
    if (card0.t0 < S('door1').t0 - TW) y0 = 308 + cpx * .9;   /* the warning scene: captions sit at the top, clear of the search bar (y 458–574) */
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
  var NOISE, SCENES = { warnScene: warnScene, doorScene: doorScene, studyScene: studyScene, heroScene: heroScene, endScene: endScene };
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(56,78,108,.34)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function safeClip(g) { g.beginPath(); g.rect(SAFE_BOX.x0, SAFE_BOX.y0, SAFE_BOX.x1 - SAFE_BOX.x0, SAFE_BOX.y1 - SAFE_BOX.y0); g.clip(); }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  var LAYER = 'fg';
  function drawScene(g, Sc, t, layer) { var o = LAYER; LAYER = layer || 'fg'; g.save(); SCENES[Sc.fn](g, t); g.restore(); LAYER = o; }
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
  /* the wipe: a roll of take-a-number tickets (cool grey paper, ink numbers) is pulled across the whole frame, right → left;
     behind it the next scene is already built */
  function roll(g, xb, t) {
    /* a blank sliding door panel (no numbers, no words): pale slate, two grooves, a recessed pull */
    var w = 440, x0 = xb - w / 2;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0 - 26, 0, 26, H);
    g.fillStyle = SLATE; g.fillRect(x0, 0, w, H);
    g.fillStyle = SLATE2; g.fillRect(x0 + 34, 0, 10, H); g.fillRect(x0 + w - 44, 0, 10, H);
    g.fillStyle = 'rgba(33,29,38,.22)'; rr(g, x0 + w / 2 - 16, 860, 32, 220, 16); g.fill();
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
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  function posterTitle(g) {
    /* the poster: the hero hold with the title in the caption's place */
    g.save(); font(g, 62, 800, DISP, 'expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('Why it says', CX, 352);
    var b = 'not private', bp = 62; font(g, bp, 800, DISP, 'expanded');
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 430 - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 430); g.restore();
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
  var GAIN = { s13: .2, hk: .24, sw1: .38, ok: .8, bz: .5, sw3: .38, wf: .42, kn1: .53, kn2: .49, sw4: .38, ch: .12, hero: .065 };
  var TYPE = { s13: 'slap', hk: 'slap', sw1: 'swish', ok: 'click', bz: 'buzz', sw3: 'swish', wf: 'paper', kn1: 'knock', kn2: 'knock', sw4: 'swish', ch: 'rattle', hero: 'thump' };
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
    function stampThump(t, g) {
      g = g || 1;
      var o = osc('sine', 230, t, t + .2, 1, [[t, 0], [t + .012, .3 * g], [t + .12, .26 * g], [t + .19, 0]], .05); o.frequency.exponentialRampToValueAtTime(160, t + .18);
      osc('triangle', 330, t, t + .14, 1, [[t, 0], [t + .004, .22 * g], [t + .06, .15 * g], [t + .13, 0]], .03);
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
      [0, .13].forEach(function (o) {
        var t0 = t + o, os = ac.createOscillator(), lp = ac.createBiquadFilter(), og = ac.createGain();
        os.type = 'square'; os.frequency.value = 118; lp.type = 'lowpass'; lp.frequency.value = 1400;
        os.connect(lp); lp.connect(og); og.connect(bus(1, .02, 0)); env(og.gain, [[t0, 0], [t0 + .006, .2 * g], [t0 + .1, .16 * g], [t0 + .12, 0]]);
        os.start(t0); os.stop(t0 + .13);
        band(t0, .1, 1800, 1.2, 1.6 * g, .004, .02);
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
    EV.forEach(function (e) {
      if (e.type === 'buzz') buzzS(e.t, e.g);
      else if (e.type === 'rattle') rattleS(e.t, e.g);
      else
      if (e.type === 'thump') stampThump(e.t, e.g);
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
      var h0 = K.HERO + .05, h1 = HOLD.t1 + .1;
      env(o.gain, [[0, ROOM], [h0, ROOM], [h0 + .2, ROOM * 3.16], [h1 - .15, ROOM * 3.16], [h1 + .1, ROOM]]); })();
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
    var fonts = ['900 expanded 84px Archivo', '800 expanded 84px Archivo', '900 condensed 84px Archivo', '800 condensed 84px Archivo', '700 condensed 84px Archivo', '900 extra-condensed 84px Archivo', '900 84px Archivo', '800 84px Archivo', '700 46px Archivo', '600 46px Archivo', '700 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°º×−≈≠µ“”‘’·→…#?‹›✓✕–@!>$(),:§+/=½~'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initTimes();
  /* the hero hold: from the circle closing to the ticket roll that brings frame 0 back */
  var HOLD = { t0: K.HERO + .13, t1: S('end').t0 };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((HOLD.t0 + HOLD.t1) / 2 * 30) / 30 + 1 / 60, SLUG: 'notprivate', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
