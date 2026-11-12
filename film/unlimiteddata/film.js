/* "Unlimited data isn't unlimited speed." — Factory #29 on Tech, explained, after ../airplanemode/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the take-a-number ticket: when a tower is busy every phone's data waits in line at its door; your
   ticket (heavy ink outline, a phone icon) is placed by your plan, walks to the back after 50 GB on some plans, and comes
   forward at the next bill cycle. Scenes change under a roll of paper tickets pulled across the frame. One hero mark:
   a coral marker circle around NETWORK MANAGEMENT on a re-created Broadband Facts label (FCC format, no carrier);
   coral is also on the end card's YES / NO and nowhere else. Generic card, tower, phone and label drawn by hand: no logos.
   Props stay whole inside the safe box x 92–928, y 302–1428; backgrounds bleed full width. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#111a26', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f3ecdf', INK = '#211d26', CASE = '#e4ddce', SCREEN = '#0b0e12';
  var STEEL = '#8a96a6', BLUEINK = '#24427a', ROLL = '#d3d9e0', ROLL2 = '#b9c2cc';
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
  var K = {
    speedW: at('hook', 'speed'), hookEnd: lend('hook'),
    ask: start('ask'), slow: at('ask', 'slow'), askEnd: lend('ask'),
    room: start('room'), towerW: at('room', 'tower'), fixed: at('room', 'fixed'), roomEnd: lend('room'),
    busy: start('busy'), busyW: at('busy', 'busy'), decides: at('busy', 'decides'), first: at('busy', 'first'), busyEnd: lend('busy'),
    place: start('place'), sets: at('place', 'sets'), placeW: at('place', 'place'), placeEnd: lend('place'),
    dip: start('dip'), gigs: at('dip', 'gigs'), some: at('dip', 'some'), move: at('dip', 'move'), back: at('dip', 'back'), dipEnd: lend('dip'),
    bill: start('bill'), next: at('bill', 'next'), starts: at('bill', 'starts'), billEnd: lend('bill'),
    but: start('but'), written: at('but', 'written'), check: at('but', 'check'), butEnd: lend('but'),
    label: start('label'), bb: at('label', 'broadband'), labelEnd: lend('label'),
    hero: start('hero'), network: at('hero', 'network'), linkW: at('hero', 'link'), theres: at('hero', 'theres'), lineW: at('hero', 'line'), heroEnd: lend('hero'),
    end: start('end'), full: at('end', 'full'), endEnd: lend('end'), yes: at('yn', 'yes'), noE: at('yn', 'no'), noEnd: wend('yn', 'no')
  };
  (function () {
    place('ne', 'slap', K.hookEnd + .1, .16, K.hookEnd, K.ask);              /* ≠ drops on the card */
    place('en', 'click', voiceEnd('ask', K.room) + .06, .16, K.askEnd, K.room);              /* the search is entered */
    place('ds', 'knock', voiceEnd('room', K.busy) + .06, .16, K.roomEnd, K.busy);            /* the ticket dispenser lands on the door */
    place('dt', 'tick', voiceEnd('busy', K.place) + .06, .16, K.busyEnd, K.place);           /* the door lets the next ticket through */
    place('sw2', 'swish', voiceEnd('place', K.dip) + .04, .16, K.placeEnd, K.dip);           /* ticket roll → the month board */
    place('rp', 'rip', voiceEnd('dip', K.bill) + .04, .16, K.dipEnd, K.bill);                /* your ticket is torn and re-printed */
    place('fw', 'paper', voiceEnd('bill', K.but) + .04, .16, K.billEnd, K.but);              /* new cycle: your ticket slides forward */
    if (GT.fw != null) place('d1', 'tick', GT.fw + BODY.paper + .08, .16, GT.fw, K.but);     /* DAY 1 */
    place('lb', 'paper', voiceEnd('but', K.label) + .04, .16, K.butEnd, K.label);            /* the label slides up out of the phone */
    place('ls', 'slap', voiceEnd('label', K.hero) + .04, .16, K.labelEnd, K.hero);           /* RE-CREATED · FCC LABEL FORMAT */
    place('mk', 'marker', voiceEnd('hero', K.end) + .04, .16, K.heroEnd, K.end);             /* the marker circle */
    if (GT.mk != null) place('hero', 'thump', GT.mk + BODY.marker + .02, .16, GT.mk, K.end); /* the circle closes */
  })();
  var TW = .55;                                            /* a ticket-roll wipe: 0.55 s */
  K.NE = GT.ne != null ? GT.ne : K.hookEnd + .12;
  K.EN = GT.en != null ? GT.en : K.askEnd + .2;
  K.DS = GT.ds != null ? GT.ds : K.roomEnd + .2;
  K.DT = GT.dt != null ? GT.dt : K.busyEnd + .2;
  K.RP = GT.rp != null ? GT.rp : K.dipEnd + .2;
  K.FW = GT.fw != null ? GT.fw : K.billEnd + .2;
  K.D1 = GT.d1 != null ? GT.d1 : K.FW + .3;
  K.LB = GT.lb != null ? GT.lb : K.butEnd + .15;
  K.LS = GT.ls != null ? GT.ls : K.labelEnd + .15;
  K.MK = GT.mk != null ? GT.mk : K.heroEnd + .25;
  K.HERO = GT.hero != null ? GT.hero : K.MK + .32;
  K.QA0 = K.NE + .3;                                       /* AT&T's sentence slides in after the ≠ */
  var SC = [
    { id: 'card', fn: 'cardScene', name: 'Unlimited data, full bars, spinning', t0: 0 },
    { id: 'tower', fn: 'towerScene', name: 'A fixed amount of room; who goes first', t0: K.QA0 + .3 + 2.95 + TW },
    { id: 'month', fn: 'monthScene', name: 'After 50 GB: some plans move you back', t0: GT.sw2 != null ? GT.sw2 + .3 : K.dip },
    { id: 'acct', fn: 'acctScene', name: 'Your account, your Broadband Facts label', t0: K.bill + .3 + 2.42 + TW },
    { id: 'end', fn: 'endScene', name: 'Did you think unlimited meant full speed?', t0: K.HERO + 3.03, cut: true }
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
      txt(g, credit, x0 + 30, y0 + h - 30, 34, '#5d564c', 'left', 800, DISP, w - 250, 1, 30, 'condensed');
    });
    if (retag !== false) tag(g, 'RE-CREATED', x0 + w - 118, y0 + h - 32, 1, 0, 200, INK, PAPER, 30);
    EXITING = ex0;
    g.restore();
    return h;
  }

  /* ---------- a cell tower: a paper lattice, three antenna panels; lit = cream with two small arcs ---------- */
  function tower(g, x, base, h, lit, tt) {
    var k = clamp(lit, 0, 1), col = k > .5 ? CREAM : STEEL, top = base - h;
    g.save();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(x - h * .17 + 5, base + 6); g.lineTo(x - h * .04 + 5, top + 6); g.moveTo(x + h * .17 + 5, base + 6); g.lineTo(x + h * .04 + 5, top + 6); g.stroke();
    g.strokeStyle = col; g.lineWidth = Math.max(4, h * .04); g.lineJoin = 'round';
    g.beginPath(); g.moveTo(x - h * .17, base); g.lineTo(x - h * .04, top); g.moveTo(x + h * .17, base); g.lineTo(x + h * .04, top); g.stroke();
    g.lineWidth = Math.max(2.5, h * .022); g.beginPath();
    for (var i = 0; i < 5; i++) { var y0 = lerp(base, top, i / 5), y1 = lerp(base, top, (i + 1) / 5), w0 = lerp(.17, .04, i / 5) * h, w1 = lerp(.17, .04, (i + 1) / 5) * h; g.moveTo(x - w0, y0); g.lineTo(x + w1, y1); g.moveTo(x + w0, y0); g.lineTo(x - w1, y1); }
    g.stroke();
    if (k > .5) { g.fillStyle = 'rgba(244,237,224,.85)'; poly(g, [[x - h * .17, base], [x - h * .04, top], [x + h * .04, top], [x + h * .17, base]]); g.fill(); }
    g.fillStyle = col; [-1, 0, 1].forEach(function (j) { g.beginPath(); g.roundRect(x + j * h * .085 - h * .03, top - h * .14, h * .06, h * .16, 3); g.fill(); });
    if (k > 0) {
      var s = .7 + .3 * Math.min(1.04, k);
      g.strokeStyle = CREAM; g.lineWidth = Math.max(4, h * .035); g.lineCap = 'round'; g.globalAlpha *= clamp(k * 1.5, 0, 1);
      var ph = tt == null ? 0 : frac(tt * .9);   /* the signal steps outward, so the tower is never a still */
      [h * (.16 + .1 * ph), h * (.28 + .1 * ph)].forEach(function (rr0, j) { g.save(); g.globalAlpha *= j ? 1 - ph * .8 : 1; g.beginPath(); g.arc(x, top - h * .06, rr0 * s, -2.5, -1.95); g.stroke(); g.beginPath(); g.arc(x, top - h * .06, rr0 * s, -1.19, -.64); g.stroke(); g.restore(); });
    }
    g.restore();
    prop(g, 'tower', x - h * .17, top - h * .2, x + h * .17, base);
  }

  /* ---------- a generic phone (round punch-hole, no notch, no logo); the screen is dark, callers draw on it ---------- */
  function phone(g, cx, top, w, h, o) {
    o = o || {};
    var x0 = cx - w / 2, r = w * .14, bz = w * .05;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 10, top + 14, w, h, r); g.fill();
    g.fillStyle = CASE; rr(g, x0, top, w, h, r); g.fill();
    rr(g, x0, top, w, h, r); grainIn(g, x0, top, w, h, 501, .8);
    g.strokeStyle = 'rgba(33,29,38,.4)'; g.lineWidth = 3; rr(g, x0, top, w, h, r); g.stroke();
    var sx0 = x0 + bz, sy0 = top + bz, sw = w - 2 * bz, sh = h - 2 * bz, sr = r - bz * .7;
    g.fillStyle = SCREEN; rr(g, sx0, sy0, sw, sh, sr); g.fill();
    g.fillStyle = '#04060a'; el(g, cx, sy0 + sw * .06, w * .024, w * .024);
    prop(g, 'phone', x0, top, x0 + w, top + h);
    return { x0: sx0, y0: sy0, w: sw, h: sh };
  }

  /* ---------- the take-a-number ticket: paper, two side notches, a perforation, a big printed number.
     yours: a heavy ink outline and a small phone icon. tear (0..1): the old ticket rips in two and falls; numB shows under it ---------- */
  function ticketPath(g, x0, y0, w, h) {
    var x1 = x0 + w, y1 = y0 + h, ym = y0 + h * .58, n = Math.min(14, w * .12), r = 9;
    g.beginPath(); g.moveTo(x0 + r, y0); g.lineTo(x1 - r, y0); g.quadraticCurveTo(x1, y0, x1, y0 + r);
    g.lineTo(x1, ym - n); g.arc(x1, ym, n, -Math.PI / 2, Math.PI / 2, true); g.lineTo(x1, y1 - r); g.quadraticCurveTo(x1, y1, x1 - r, y1);
    g.lineTo(x0 + r, y1); g.quadraticCurveTo(x0, y1, x0, y1 - r); g.lineTo(x0, ym + n); g.arc(x0, ym, n, Math.PI / 2, -Math.PI / 2, true);
    g.lineTo(x0, y0 + r); g.quadraticCurveTo(x0, y0, x0 + r, y0); g.closePath();
  }
  function ticketFace(g, w, h, num, yours, name) {
    var x0 = -w / 2, y0 = -h / 2;
    g.fillStyle = 'rgba(0,0,0,.38)'; g.save(); g.translate(6, 9); ticketPath(g, x0, y0, w, h); g.fill(); g.restore();
    g.fillStyle = yours ? CREAM : PAPER; ticketPath(g, x0, y0, w, h); g.fill();
    ticketPath(g, x0, y0, w, h); grainIn(g, x0, y0, w, h, 900 + (num | 0), .8);
    g.strokeStyle = 'rgba(33,29,38,.45)'; g.lineWidth = 3; g.setLineDash([7, 7]); g.beginPath(); g.moveTo(x0 + 12, y0 + h * .26); g.lineTo(x0 + w - 12, y0 + h * .26); g.stroke(); g.setLineDash([]);
    if (yours) {
      g.strokeStyle = INK; g.lineWidth = 7; ticketPath(g, x0, y0, w, h); g.stroke();
      /* a small phone icon in the stub */
      var iw = Math.min(w * .26, h * .2 * .75), ih = h * .2, ix = -iw / 2, iy = y0 + h * .035;
      g.fillStyle = INK; rr(g, ix, iy, iw, ih, iw * .18); g.fill(); g.fillStyle = CREAM; rr(g, ix + iw * .14, iy + ih * .12, iw * .72, ih * .66, 2); g.fill();
      g.fillStyle = INK; el(g, 0, iy + ih * .9, iw * .07, iw * .07);
    } else { g.fillStyle = 'rgba(33,29,38,.55)'; el(g, 0, y0 + h * .13, w * .05, w * .05); }
    onprop(function () { txt(g, String(num), 0, y0 + h * .62, Math.round(h * .4), INK, 'center', 900, DISP, w - 14, 1, 30, 'condensed'); });
    prop(g, name || 'ticket', x0, y0, x0 + w, y0 + h);
  }
  function ticket(g, cx, cy, w, h, num, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); var ex = EXITING; if (a < .95 || o.moving) EXITING = true;
    g.translate(cx, cy); if (o.rot) g.rotate(o.rot); if (o.s) g.scale(o.s, o.s);
    if (o.halo) { g.strokeStyle = CREAM; g.lineWidth = 9; ticketPath(g, -w / 2 - 11, -h / 2 - 11, w + 22, h + 22); g.stroke(); }
    var tk = o.tear || 0;
    if (tk <= 0) ticketFace(g, w, h, num, o.yours, o.name);
    else {
      /* the new print underneath, then the old ticket in two halves (a zigzag rip down the middle) peeling away */
      var e = eout(seg(tk, 0, .3)), f = seg(tk, .3, 1); EXITING = true;
      [-1, 1].forEach(function (sd) {
        g.save(); g.globalAlpha *= 1 - seg(tk, .55, 1);
        g.translate(sd * w * .2 * e, 130 * f * f); g.rotate(sd * (.3 * e + .12 * f));
        g.beginPath(); g.moveTo(0, -h / 2 - 20);
        for (var i = 0; i <= 8; i++) g.lineTo((i % 2 ? 7 : -7), -h / 2 + h * i / 8);
        g.lineTo(0, h / 2 + 20); g.lineTo(sd * (w / 2 + 30), h / 2 + 20); g.lineTo(sd * (w / 2 + 30), -h / 2 - 20); g.closePath(); g.clip();
        ticketFace(g, w, h, num, o.yours, 'torn'); g.restore();
      });
      /* the new print lands on top of the falling halves */
      EXITING = ex;
      if (o.numB != null && tk >= .24) { g.save(); var sb = lerp(1.25, 1, eout(seg(tk, .24, .5))); g.scale(sb, sb); ticketFace(g, w, h, o.numB, o.yours, o.name); g.restore(); }
      EXITING = true;
    }
    EXITING = ex; g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · frame 0: a big paper signal card (full bars, DATA: UNLIMITED, a spinner that never finishes) gliding up;
     the ≠ in the hook's pause; the search bar; AT&T's own sentence
     ===================================================================================================== */
  /* frame 0: a 640 px card centred on x 540, tilted 12°, already gliding up (its top-left corner travels ~310 px in 1.1 s);
     its whole outline stays inside x 110–910 and above y 1428 on every frame */
  var F0 = { cx: 540, cy: 1045, S: 640, rot: -.21, cyUp: 795, sUp: .92 };
  function spinner(g, x, y, R, t, w) {
    var head = tq(t) * 11, n = 12;            /* the bright head turns smoothly: something changes on every frame */
    g.save(); g.lineCap = 'round'; g.lineWidth = w;
    for (var i = 0; i < n; i++) {
      var rot0 = (head % n) / n * 2 * Math.PI, a = -Math.PI / 2 + i * 2 * Math.PI / n + rot0, age = ((n - i) % n);
      g.strokeStyle = 'rgba(33,29,38,' + (.12 + .82 * Math.max(0, 1 - age / 8)).toFixed(3) + ')';
      g.beginPath(); g.moveTo(x + Math.cos(a) * R * .5, y + Math.sin(a) * R * .5); g.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); g.stroke();
    }
    g.restore();
  }
  /* a loading bar whose fill crawls around 3 %; light stripes run along the empty track (whole periods per loop, so the
     seam matches) */
  var NEFALL = .56;
  function loadBar(g, x, y, w, h, t, u) {
    var r = h / 2, per = 46 * u, TL = Math.round(DUR * 30) / 30, v = Math.round(TL * 1.1) * per / TL, off = ((t * v) % per + per) % per;
    g.save(); rr(g, x, y, w, h, r); g.fillStyle = '#e2d9c8'; g.fill(); g.clip();
    g.fillStyle = 'rgba(33,29,38,.13)';
    for (var sx = x - per * 2 + off; sx < x + w + per; sx += per) { poly(g, [[sx, y + h], [sx + per * .45, y + h], [sx + per * .45 + h * .6, y], [sx + h * .6, y]]); g.fill(); }
    var p = .03 + .008 * Math.sin(2 * Math.PI * t / TL);
    g.fillStyle = INK; rr(g, x - r, y, r + w * p + r * .2, h, r); g.fill();
    g.restore();
    g.strokeStyle = INK; g.lineWidth = 7 * u; rr(g, x, y, w, h, r); g.stroke();
    onprop(function () { txt(g, '3%', x + w, y + h + 50 * u, Math.max(30, Math.round(52 * u)), INK, 'right', 900, DISP, 0, 1, 30, 'condensed'); });
  }
  function bars(g, x, y, u) {
    for (var i = 0; i < 4; i++) { var bh = (34 + i * 20) * u; g.fillStyle = INK; rr(g, x + i * 46 * u, y - bh, 32 * u, bh, 6 * u); g.fill(); }
  }
  function signalCard(g, cx, cy, S, t, rot, ne) {
    var u = S / 640, x0 = cx - S / 2, y0 = cy - S / 2;
    g.save(); if (rot) { g.translate(cx, cy); g.rotate(rot); g.translate(-cx, -cy); }
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 14 * u, y0 + 20 * u, S, S, S * .1); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, S, S, S * .1); g.fill();
    rr(g, x0, y0, S, S, S * .1); grainIn(g, x0, y0, S, S, 77, .8);
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 4; rr(g, x0, y0, S, S, S * .1); g.stroke();
    prop(g, 'signal card', x0, y0, x0 + S, y0 + S);
    /* the status row: four full bars on the left, a full battery on the right */
    bars(g, x0 + 62 * u, y0 + 128 * u, u);
    g.strokeStyle = INK; g.lineWidth = 7 * u; rr(g, x0 + S - 180 * u, y0 + 72 * u, 100 * u, 50 * u, 10 * u); g.stroke();
    g.fillStyle = INK; rr(g, x0 + S - 172 * u, y0 + 80 * u, 84 * u, 34 * u, 6 * u); g.fill(); rr(g, x0 + S - 76 * u, y0 + 86 * u, 12 * u, 22 * u, 4 * u); g.fill();
    /* the plan row: an ink band, DATA: UNLIMITED */
    g.fillStyle = INK; rr(g, x0 + 40 * u, y0 + 160 * u, S - 80 * u, 104 * u, 18 * u); g.fill();
    onprop(function () { txt(g, 'DATA: UNLIMITED', cx, y0 + 214 * u, Math.round(70 * u), CREAM, 'center', 900, DISP, S - 130 * u, 1, 30, 'condensed'); });
    /* the progress bar: crawling at about 3 %, slower, not stopped */
    loadBar(g, x0 + 64 * u, y0 + 430 * u, S - 128 * u, 92 * u, t, u);
    /* ≠ (cream on ink, never coral): drops between the plan row and the spinner in the hook's pause */
    if (ne != null && t >= ne - NEFALL) {
      /* it drops from above the card on "speed" (~2.0 s) and lands with the slap in the pause */
      var fk = seg(t, ne - NEFALL, ne), k = eout(seg(t, ne, ne + .1)), s = fk < 1 ? lerp(2.5, 1.12, fk * fk) : lerp(1.12, 1, k), nx = cx, ny = y0 + 340 * u, hz = 1 - fk * fk;
      var ex0 = EXITING; if (fk < 1) EXITING = true;
      g.save(); g.globalAlpha *= seg(fk, 0, .25); g.translate(nx, ny); g.scale(s, s); g.rotate(-.06 - .25 * hz);
      g.fillStyle = 'rgba(0,0,0,' + (.4 - .25 * hz).toFixed(3) + ')'; el(g, (8 + 40 * hz) * u, (12 + 60 * hz) * u, 82 * u, 82 * u);
      g.fillStyle = INK; el(g, 0, 0, 82 * u, 82 * u); g.strokeStyle = CREAM; g.lineWidth = 7 * u; g.beginPath(); g.arc(0, 0, 72 * u, 0, 6.283); g.stroke();
      g.strokeStyle = CREAM; g.lineWidth = 15 * u; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-38 * u, -16 * u); g.lineTo(38 * u, -16 * u); g.moveTo(-38 * u, 16 * u); g.lineTo(38 * u, 16 * u); g.moveTo(17 * u, -45 * u); g.lineTo(-17 * u, 45 * u); g.stroke();
      g.restore(); EXITING = ex0;
    }
    g.restore();
  }
  var QA = ['“On an unlimited plan?', 'We may temporarily', 'slow your speed at any', 'time if our network', 'is busy.”'];
  function cardScene(g, t) {
    if (LAYER === 'bg') return;
    var gl = sio(seg(t, 0, 1.1)), rot = lerp(F0.rot, 0, gl);
    var shrink = eio(seg(t, K.NE + .16, K.NE + .66));
    var roam = sio(seg(t, K.NE + .6, S('tower').t0)), s = lerp(lerp(1, F0.sUp, gl), .52, shrink), cx = lerp(F0.cx, 700, shrink) - 190 * roam, cy = lerp(lerp(F0.cy, F0.cyUp, gl), 1228, shrink);
    var d = drift(t, .3, .5 * seg(t, 1, 1.6));
    signalCard(g, cx, cy + d, F0.S * s, t, rot + .07 * Math.sin(Math.PI * 2 * roam) * shrink, K.NE);
    /* the search bar: drops in under the card at ~1.3 s, typed by ~1.8 s; rises above AT&T's sentence as the card shrinks */
    var SBin = .42, sa = fin(t, SBin, 4);
    if (sa > 0 && LIVE.text) {
      var press = Math.sin(Math.PI * seg(t, K.EN - .02, K.EN + .14)), y = lerp(1332, 628, eio(seg(t, K.NE + .16, K.NE + .66))) + 30 * (1 - Math.min(1, pop(t, SBin, 3)));
      g.save(); g.globalAlpha *= sa; g.translate(540, y); g.scale(1 - .03 * press, 1 - .03 * press); g.translate(-540, -y);
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 154, y - 62, 772, 132, 40); g.fill();
      g.fillStyle = PAPER; rr(g, 148, y - 70, 772, 132, 40); g.fill();
      prop(g, 'search bar', 148, y - 70, 920, y + 62);
      g.strokeStyle = INK; g.lineWidth = 7; g.beginPath(); g.arc(214, y - 8, 22, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(230, y + 8); g.lineTo(248, y + 27); g.stroke();
      var A1 = 'why is my', A2 = 'unlimited data slow?', k = seg(t, SBin + .14, 1.58), n = Math.round((A1.length + 1 + A2.length) * k);
      var s1 = A1.slice(0, n), s2 = n > A1.length + 1 ? A2.slice(0, n - A1.length - 1) : '';
      var typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
      font(g, 50, 800, DISP, 'condensed'); var w1 = g.measureText(A1 + ' ').width;
      onprop(function () { if (s1) txt(g, s1, 282, y - 4, 50, INK, 'left', 800, DISP, 0, 1, 30, 'condensed'); if (s2) txt(g, s2, 282 + w1, y - 4, 50, INK, 'left', 800, DISP, 0, 1, 30, 'condensed'); });
      NOREC = nr;
      if (typing && Math.floor(t * 4) % 2 === 0) { font(g, 50, 800, DISP, 'condensed'); var cw = g.measureText(s2 ? A1 + ' ' + s2 : s1).width; g.fillStyle = INK; g.fillRect(286 + cw, y - 32, 5, 56); }
      g.restore();
    }
    /* AT&T's own sentence, word for word */
    quote(g, 110, 708, 800, QA, 44, 'AT&T · SUPPORT PAGE', 211, seg(t, K.QA0, K.QA0 + .3), 0);
  }

  /* =====================================================================================================
     SCENE 2 · the tower: a fixed pipe (T-Mobile's sentence), the queue at the door when it's busy, your ticket
     ===================================================================================================== */
  var TWR = { x: 700, base: 1310, h: 500 };
  var PUSH = { ox: 700, oy: 1310 };
  function towerPush(t) { return 1 + .1 * sio(seg(t, K.busy, K.first)); }
  function city(g, t) {
    /* far blocks and the ground: cool blue paper, full width (background) */
    var r = mulberry(61), x = -40;
    g.fillStyle = '#1b2738';
    while (x < W + 40) { var bw = 70 + r() * 90, bh = 120 + r() * 170; rr(g, x, 1310 - bh, bw - 8, bh + 40, 6); g.fill(); x += bw; }
    g.fillStyle = '#2a3a50'; g.fillRect(-20, 1306, W + 40, H);
    g.fillStyle = '#33465f'; g.fillRect(-20, 1306, W + 40, 10);
  }
  function bigTower(g, t) {
    var x = TWR.x, base = TWR.base, h = TWR.h, top = base - h;
    /* the lattice (cream paper), its antennas, two short arcs: it transmits */
    tower(g, x, base, h, 1, t);
    /* the pipe: a fixed-width paper tube from the door up to the antennas */
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, x - 22 + 5, top + 40 + 7, 44, h - 190, 22); g.fill();
    g.fillStyle = '#d6cdbb'; rr(g, x - 22, top + 40, 44, h - 190, 22); g.fill();
    g.strokeStyle = INK; g.lineWidth = 5; rr(g, x - 22, top + 40, 44, h - 190, 22); g.stroke();
    /* the door at the base */
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x - 66 + 6, base - 160 + 8, 132, 160, 12); g.fill();
    g.fillStyle = '#d6cdbb'; rr(g, x - 66, base - 160, 132, 160, 12); g.fill();
    g.fillStyle = '#0e141c'; rr(g, x - 50, base - 144, 100, 144, 8); g.fill();
    prop(g, 'door', x - 66, base - 160, x + 66, base);
  }
  function dispenser(g, x, y, k) {
    if (k <= 0) return;
    g.save(); g.translate(x, y); var s = Math.min(1.04, k); g.scale(s, s);
    var ex = EXITING; if (k < .98) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.4)'; el(g, 6, 9, 54, 54);
    g.fillStyle = '#e6dccb'; el(g, 0, 0, 54, 54); g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, 54, 0, 6.283); g.stroke();
    g.fillStyle = INK; rr(g, -30, -10, 60, 14, 4); g.fill();
    prop(g, 'dispenser', -54, -54, 54, 54);
    EXITING = ex; g.restore();
  }
  /* the queue: slot x positions on the ground left of the door; each ticket has keyframes [t, slot] (slot -1 = the door) */
  var TS = [588, 474, 360, 246], TY = 1236, TKW = 100, TKH = 136;
  function slotX(s) { return s < 0 ? TWR.x : s >= TS.length ? TS[TS.length - 1] - 114 * (s - TS.length + 1) : TS[s]; }
  var QT = [];
  (function () {
    var R = K.busyW + .05, F = K.first, D = K.DT, P = K.placeW - .05;
    function tk(num, inAt, keys, from) { QT.push({ num: num, inAt: inAt, keys: keys, from: from }); }
    tk(29, R, [[R, 0], [F, -1]], [-1, -1]);
    tk(30, R + .1, [[R + .1, 1], [F, 0], [D, -1]], [-1, 1]);
    tk(31, R + .2, [[R + .2, 2], [F, 1], [D, 0]], [1, -1]);
    tk(32, R + .3, [[R + .3, 3], [F, 2], [D, 1]], [-1, 1]);
    tk(34, F + .1, [[F + .1, 3], [D, 2], [P, 3]], [1, -1]);
    tk(35, D + .1, [[D + .1, 3], [P, 4]], [-1, 1]);
  })();
  function qState(T, t) {
    if (t < T.inAt) return null;
    var x = slotX(T.keys[0][1]), y = TY, a = 1, moving = false;
    var e0 = eout(seg(t, T.inAt, T.inAt + .4));
    /* flying in: from above, in an arc, fading up (never through the rail) */
    if (e0 < 1) { x = lerp(x + T.from[0] * 160, x, e0); y = lerp(TY - 260, TY, e0) - 120 * Math.sin(Math.PI * e0); a = seg(e0, 0, .4); moving = true; }
    for (var i = 1; i < T.keys.length; i++) {
      var kk = T.keys[i], k = eio(seg(t, kk[0], kk[0] + .38));
      if (k <= 0) break;
      var x1 = slotX(kk[1]); x = lerp(slotX(T.keys[i - 1][1]), x1, k); if (k < 1) moving = true;
      if (kk[1] < 0) { a *= 1 - seg(k, .5, 1); moving = true; }
      if (kk[1] >= TS.length) { a *= 1 - seg(k, .2, .9); moving = true; }
    }
    return { x: x, y: y + 6 * Math.sin(t * 3 + T.num), a: a, moving: moving };
  }
  var QT2 = ['“…there is a fixed', 'amount of network', 'capacity available', 'at each cell tower.”'];
  var QP = ['“…by plan and brand …”'];
  function towerScene(g, t) {
    var T0 = S('tower').t0, pk = towerPush(t);
    if (LAYER === 'bg') { g.translate(PUSH.ox, PUSH.oy); g.scale(pk, pk); g.translate(-PUSH.ox, -PUSH.oy); city(g, t); return; }
    /* the label first, under the push: FIXED CAPACITY beside the pipe with a leader to it */
    g.save(); g.translate(PUSH.ox, PUSH.oy); g.scale(pk, pk); g.translate(-PUSH.ox, -PUSH.oy);
    bigTower(g, t);
    var fa = fin(t, K.fixed - .05, 4);
    if (fa > 0) {
      g.save(); g.globalAlpha *= fa; g.strokeStyle = CREAM; g.lineWidth = 5; g.setLineDash([12, 10]);
      g.beginPath(); g.moveTo(520, 1000); g.lineTo(lerp(520, 668, eout(seg(t, K.fixed, K.fixed + .4))), 1000); g.stroke(); g.setLineDash([]); g.restore();
      chip(g, 'FIXED CAPACITY', 360, 1000, { px: 52, wt: 900, bg: CREAM, fg: INK, a: fa, st: 'condensed', r: 16 });
    }
    /* the dispenser lands on the door's right in the pause after "room." */
    dispenser(g, 838, 1150, t >= K.DS ? pop(t, K.DS, 3.4) : 0);
    /* the queue */
    var nq = NOREC; NOREC = true;   /* the other tickets are props passing through the door; only yours is a read */
    QT.forEach(function (T) { var q = qState(T, t); if (q) ticket(g, q.x, q.y, TKW, TKH, T.num, { a: q.a, moving: q.moving }); });
    NOREC = nq;
    /* your ticket: printed from the dispenser on "sets", it flies to its place in the line on "place" */
    var P0 = K.sets - .05;
    if (t >= P0) {
      var pr = eout(seg(t, P0, P0 + .3)), fl = eio(seg(t, K.placeW - .05, K.placeW + .4));
      var yx = lerp(838, slotX(2), fl), yy = lerp(lerp(1150, 1010, pr), TY, fl) - 150 * Math.sin(Math.PI * fl), ys = lerp(lerp(.3, .9, pr), 1, fl);
      ticket(g, yx, yy + (fl >= 1 ? 6 * Math.sin(t * 3 + 33) : 0), TKW, TKH, 33, { yours: true, s: ys, moving: fl < 1 || pr < 1, rot: .08 * Math.sin(Math.PI * fl) });
    }
    g.restore();
    /* T-Mobile's capacity sentence (slides in with the scene) peels off as the tickets rush in; the plan credit takes its place */
    var qOut = Math.max(T0 + .3 + 2.95, K.busyW + .1);
    quote(g, 110, 606, 480, QT2, 42, 'T-MOBILE FAQ', 233, seg(t, T0 - .1, T0 + .25), seg(t, qOut, qOut + .35));
    quote(g, 110, 606, 480, QP, 42, 'T-MOBILE POLICY', 245, seg(t, qOut + .2, qOut + .5), 0);
    /* when it applies, in big type, for as long as the queue is up */
    busyChip(g, t, fin(t, K.busyW + .05, 4));
  }
  function busyChip(g, t, a) {
    if (a <= 0) return;
    chip(g, 'ONLY WHEN THE TOWER IS BUSY', 510, 1384, { px: 54, wt: 900, bg: CREAM, fg: INK, a: a, st: 'condensed', r: 16, maxw: 800 });
  }

  /* =====================================================================================================
     SCENE 3 · the month: a bill strip with a gauge; AFTER 50 GB; your ticket walks to the back and is re-printed;
     the carriers' own words, equal and alphabetical; NEXT BILL CYCLE brings it forward
     ===================================================================================================== */
  var MS = [692, 520, 348, 176], MY = 1180, MKW = 166, MKH = 210;
  var CARDS = [
    { x: 110, head: 'AT&T · SOME', head2: 'UNLIMITED PLANS', q: ['“…after you use more', 'than 50GB or 22GB…”'] },
    { x: 520, head: 'T-MOBILE ·', head2: 'T-MIX STANDARD', q: ['“…with 50GB of', 'Premium Data”'] }
  ];
  /* the tower's doorway at the right of the line: two lattice legs rising behind FIXED CAPACITY, a paper door frame */
  function doorway(g, t) {
    var x0 = 782, x1 = 924, y0 = 1078, y1 = 1300;
    g.strokeStyle = CREAM; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0 + 8, y0); g.lineTo(x0 + 40, y0 - 64); g.moveTo(x1 - 8, y0); g.lineTo(x1 - 40, y0 - 64); g.moveTo(x0 + 8, y0 - 4); g.lineTo(x1 - 40, y0 - 64); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 6, y0 + 8, x1 - x0, y1 - y0, 12); g.fill();
    g.fillStyle = '#d6cdbb'; rr(g, x0, y0, x1 - x0, y1 - y0, 12); g.fill();
    g.strokeStyle = INK; g.lineWidth = 4; rr(g, x0, y0, x1 - x0, y1 - y0, 12); g.stroke();
    g.fillStyle = '#0e141c'; rr(g, x0 + 18, y0 + 26, x1 - x0 - 36, y1 - y0 - 26, 8); g.fill();
    /* a sliver of light through the door: one ticket at a time goes in */
    var ph = frac(t * .8); g.fillStyle = 'rgba(244,237,224,' + (.12 + .1 * Math.sin(ph * 6.283)).toFixed(3) + ')'; rr(g, x0 + 30, y0 + 40, 20, y1 - y0 - 60, 6); g.fill();
    prop(g, 'door', x0, y0 - 64, x1, y1);
    chip(g, 'FIXED CAPACITY', 750, 1038, { px: 44, wt: 900, bg: CREAM, fg: INK, st: 'condensed', r: 14 });
  }
  function monthScene(g, t) {
    var M0 = S('month').t0;
    if (LAYER === 'bg') { g.fillStyle = '#2a3a50'; g.fillRect(-20, 1300, W + 40, H); g.fillStyle = '#33465f'; g.fillRect(-20, 1300, W + 40, 10); return; }
    var d = drift(t, .7, .45);
    /* the bill strip: DAY n · a gauge to 50 GB */
    var gfill = lerp(.55, 1, eio(seg(t, M0, K.gigs + .1))) * (1 - eio(seg(t, K.D1, K.D1 + .3)));
    var day = t < K.D1 ? Math.round(lerp(lerp(9, 17, seg(t, M0, K.dipEnd)), 30, seg(tq(t), K.bill, K.starts))) : 1;
    var sx0 = 110, sy0 = 546, sw = 800, sh = 116;
    sheet(g, sx0, sy0 + d * .3, sx0 + sw, sy0 + sh + d * .3, 401, PAPER, 'bill strip');
    onprop(function () { txt(g, 'DAY', sx0 + 30, sy0 + 58 + d * .3, 54, INK, 'left', 900, DISP, 190, 1, 40, 'condensed'); });
    font(g, 54, 900, DISP, 'condensed'); var dw = g.measureText('DAY ').width, nr0 = NOREC; NOREC = true;   /* a running counter: the digits roll, the word holds */
    onprop(function () { txt(g, String(day), sx0 + 30 + dw, sy0 + 58 + d * .3, 54, INK, 'left', 900, DISP, 120, 1, 40, 'condensed'); }); NOREC = nr0;
    var gx0 = 340, gx1 = 880, gy = sy0 + 58 + d * .3;
    g.fillStyle = '#d8cfbf'; rr(g, gx0, gy - 20, gx1 - gx0, 40, 20); g.fill();
    g.fillStyle = INK; rr(g, gx0, gy - 20, Math.max(40, (gx1 - gx0) * gfill), 40, 20); g.fill();
    g.strokeStyle = INK; g.lineWidth = 4; rr(g, gx0, gy - 20, gx1 - gx0, 40, 20); g.stroke();
    /* AFTER 50 GB slaps onto the strip on "gigs"; NEXT BILL CYCLE flips over it on "next" */
    var nb = seg(t, K.bill + .05, K.bill + .3);
    if (nb < .5) slapCard(g, 'AFTER 50 GB', 610, 696, t, K.gigs + .05, Math.max(.02, Math.cos(Math.PI * nb)));
    else slapCard(g, 'NEXT BILL CYCLE', 610, 696, t, -9, Math.max(.02, -Math.cos(Math.PI * nb)));
    /* the scope and the carriers' own words (equal size, alphabetical, all cream) */
    var sa = fin(t, K.some - .05, 4);
    if (sa > 0) {
      chip(g, 'SOME PLANS', 282, 778, { px: 54, wt: 900, bg: CREAM, fg: INK, a: sa, st: 'condensed', r: 16 });
      txt(g, 'CHECKED NOV 12, 2026', 670, 778, 38, CREAM, 'center', 800, DISP, 400, sa, 36, 'condensed');
    }
    CARDS.forEach(function (c, i) {
      var ca = fin(t, K.some + .1 + i * .12, 4); if (ca <= 0) return;
      var y0 = 818 + 20 * (1 - Math.min(1, pop(t, K.some + .1 + i * .12, 3)));
      g.save(); g.globalAlpha *= ca; var ex = EXITING; if (ca < .95) EXITING = true;
      sheet(g, c.x, y0, c.x + 390, y0 + 172, 451 + i, PAPER, 'carrier card');
      onprop(function () {
        txt(g, c.head, c.x + 20, y0 + 30, 32, '#5d564c', 'left', 800, DISP, 350, 1, 30, 'condensed');
        txt(g, c.head2, c.x + 20, y0 + 60, 32, '#5d564c', 'left', 800, DISP, 350, 1, 30, 'condensed');
        c.q.forEach(function (L, j) { txt(g, L, c.x + 20, y0 + 102 + j * 40, 38, INK, 'left', 800, DISP, 350, 1, 32, 'condensed'); });
      });
      EXITING = ex; g.restore();
    });
    /* the line at the tower's door, big: yours is first; on "move you back" it walks to the back (516 px), is torn and
       re-printed 58; the next bill cycle brings it forward as 33 */
    doorway(g, t);
    var back = eio(seg(t, K.move - .05, K.back + .2)), fwd = eio(seg(t, K.FW, K.FW + .45));
    var others = [34, 35, 36];
    others.forEach(function (n, i) {
      var x = lerp(lerp(MS[i + 1], MS[i], back), MS[i + 1], fwd);
      ticket(g, x, MY + 6 * Math.sin(t * 3 + n), MKW, MKH, n, { moving: (back > 0 && back < 1) || (fwd > 0 && fwd < 1) });
    });
    var yx = lerp(lerp(MS[0], 240, back), MS[0], fwd), yy = MY - 170 * Math.sin(Math.PI * back) - 170 * Math.sin(Math.PI * fwd) + 6 * Math.sin(t * 3 + 33);
    var tear = seg(t, K.RP, K.RP + .55), fl = seg(t, K.FW - .05, K.FW + .15);
    var num = t < K.RP ? 33 : 58, mv = (back > 0 && back < 1) || (fwd > 0 && fwd < 1);
    var rot = .1 * Math.sin(Math.PI * back) - .1 * Math.sin(Math.PI * fwd);
    if (tear > 0 && tear < 1) ticket(g, yx, yy, MKW, MKH, 33, { yours: true, tear: tear, numB: 58 });
    else if (fl > 0 && fl < 1) { g.save(); g.translate(yx, yy); g.scale(1, Math.max(.02, Math.abs(Math.cos(Math.PI * fl)))); var ex2 = EXITING; EXITING = true; ticket(g, 0, 0, MKW, MKH, fl < .5 ? 58 : 33, { yours: true }); EXITING = ex2; g.restore(); }
    else ticket(g, yx, yy, MKW, MKH, t >= K.FW + .15 ? 33 : num, { yours: true, moving: mv, rot: rot });
    busyChip(g, t, 1);
  }
  /* a time card: slapped down (full opacity from its first frame, 1.35 → 1 in 0.08 s); sx flips it */
  function slapCard(g, text, x, y, t, t0, sx) {
    if (t < t0 - .08) return;
    var k = eout(seg(t, t0 - .08, t0)), sc = lerp(1.35, 1, k), ex = EXITING; if (k < 1 || sx < .95) EXITING = true;
    g.save(); g.translate(x, y); g.scale(sx == null ? 1 : sx, 1);
    chip(g, text, 0, -24 * (1 - k), { px: 60, wt: 900, bg: CREAM, fg: INK, h: 86, r: 18, st: 'condensed', rot: .02, s: sc, a: seg(t, t0 - .08, t0 - .05) });
    EXITING = ex; g.restore();
  }

  /* =====================================================================================================
     SCENE 4 · your account → the Broadband Facts label (FCC format, re-created) → its NETWORK MANAGEMENT link,
     circled by hand in coral; the policy sentence slides out behind it
     ===================================================================================================== */
  var LBW = 466, LBH = 700, LABEL = '#fbf8f1', NMY = 456;
  function labelSheet(g, x0, y0) {
    var w = LBW, h = LBH;
    sheet(g, x0, y0, x0 + w, y0 + h, 707, LABEL, 'label');
    g.strokeStyle = INK; g.lineWidth = 6; g.strokeRect(x0 + 14, y0 + 14, w - 28, h - 28);
    onprop(function () {
      txt(g, 'Broadband Facts', x0 + 34, y0 + 72, 64, INK, 'left', 900, DISP, w - 68, 1, 40, 'condensed');
      txt(g, 'Mobile Broadband', x0 + 34, y0 + 124, 40, INK, 'left', 700, DISP, w - 68, 1, 36, 'condensed');
      txt(g, 'Consumer Disclosure', x0 + 34, y0 + 166, 40, INK, 'left', 700, DISP, w - 68, 1, 36, 'condensed');
    });
    g.fillStyle = INK; g.fillRect(x0 + 30, y0 + 196, w - 60, 14);
    onprop(function () {
      txt(g, 'Data Included with', x0 + 34, y0 + 252, 42, INK, 'left', 800, DISP, w - 68, 1, 40, 'condensed');
      txt(g, 'Monthly Price', x0 + 34, y0 + 298, 42, INK, 'left', 800, DISP, w - 68, 1, 40, 'condensed');
      txt(g, 'Unlimited', x0 + w - 34, y0 + 352, 52, INK, 'right', 900, DISP, 260, 1, 40, 'condensed');
    });
    g.fillRect(x0 + 30, y0 + 390, w - 60, 4);
    onprop(function () {
      txt(g, 'Network Management', x0 + 34, y0 + NMY, 46, BLUEINK, 'left', 800, DISP, w - 68, 1, 40, 'condensed');
      txt(g, 'Privacy Policy', x0 + 34, y0 + 544, 44, BLUEINK, 'left', 800, DISP, w - 68, 1, 40, 'condensed');
    });
    g.fillStyle = BLUEINK; font(g, 46, 800, DISP, 'condensed'); var nw = Math.min(w - 68, g.measureText('Network Management').width); g.fillRect(x0 + 34, y0 + NMY + 26, nw, 4);
    font(g, 44, 800, DISP, 'condensed'); g.fillRect(x0 + 34, y0 + 568, g.measureText('Privacy Policy').width, 4);
    g.fillStyle = INK; g.fillRect(x0 + 30, y0 + 594, w - 60, 14);
    onprop(function () { txt(g, 'fcc.gov/broadbandlabels', x0 + 34, y0 + 638, 36, INK, 'left', 700, DISP, w - 68, 1, 30, 'condensed'); });
    return nw;
  }
  /* the hand-drawn marker circle: a wobbly loop drawn from the left, overshooting its start (coral: the hero mark) */
  function marker(g, cx, cy, rx, ry, k) {
    if (k <= 0) return;
    var r = mulberry(29), N = 64, P = [];
    for (var i = 0; i <= N; i++) P.push(1 + (r() - .5) * .05);
    var a0 = Math.PI * .92, span = (2 * Math.PI + .5) * eout(clamp(k, 0, 1));
    g.save(); g.strokeStyle = HOT; g.lineWidth = 11; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    for (var j = 0; j <= 80; j++) {
      var u = j / 80, a = a0 + span * u, wob = P[Math.floor((u * N) % N)], grow = 1 + .06 * u;
      var x = cx + Math.cos(a) * rx * wob * grow, y = cy + Math.sin(a) * ry * wob * grow + 6 * u;
      if (j) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.stroke(); g.restore();
  }
  var QV = ['“On certain', 'plans, we may', 'prioritize your', 'data behind', 'other traffic.”'];   /* VERIZON, word for word */
  function acctScene(g, t) {
    if (LAYER === 'bg') { g.fillStyle = '#1b2738'; g.fillRect(-20, 1330, W + 40, H); return; }
    var A0 = S('acct').t0, d = drift(t, .5, .45);
    /* the rule chip over the phone, then over the label until the policy page comes out */
    var ra = fin(t, A0 - .2, 4) * (1 - seg(t, K.linkW, K.linkW + .2));
    if (ra > 0) {
      chip(g, 'LINK IN YOUR ACCOUNT', 342, 588, { px: 44, wt: 900, bg: CREAM, fg: INK, a: ra, st: 'condensed', r: 14 });
      txt(g, 'FCC RULE · 47 CFR 8.1', 748, 588, 36, CREAM, 'center', 800, DISP, 340, ra, 30, 'condensed');
    }
    /* the phone: rises on "But", sinks away as the label comes out of it */
    var LR = K.LB, rise = eout(seg(t, A0 - TW, A0 + .1)), sink = eio(seg(t, LR + .3, LR + .9));
    if (sink < 1) {
      var ptop = 640 + 25 * (1 - rise) + 480 * sink + d * .3;
      g.save(); g.globalAlpha *= (1 - seg(sink, .5, 1)) * seg(rise, 0, .4); var ex = EXITING; if (sink > 0) EXITING = true;
      var sc = phone(g, 510, ptop, 410, 750);
      /* a re-created account screen (generic): YOUR PLAN · UNLIMITED, BILLING, PLAN LABEL › */
      g.save(); rr(g, sc.x0, sc.y0, sc.w, sc.h, 40); g.clip();
      onprop(function () {
                [['YOUR PLAN', 'UNLIMITED'], ['BILLING', ''], ['LABEL', '›']].forEach(function (row, i) {
          var ry = sc.y0 + 130 + i * 128, hl = i === 2;
          g.fillStyle = hl ? CREAM : '#26303d'; rr(g, sc.x0 + 20, ry, sc.w - 40, 108, 18); g.fill();
          txt(g, row[0], sc.x0 + 44, ry + 38, 32, hl ? INK : '#c9c2b4', 'left', 800, DISP, 300, 1, 30, 'condensed');
          if (row[1]) txt(g, row[1], i === 2 ? sc.x0 + sc.w - 50 : sc.x0 + 44, i === 2 ? ry + 54 : ry + 78, i === 2 ? 60 : 36, hl ? INK : CREAM, i === 2 ? 'right' : 'left', 900, DISP, 300, 1, 30, 'condensed');
          if (hl) { g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(sc.x0 + 44, ry + 58, 34, 40); g.fillStyle = INK; g.fillRect(sc.x0 + 50, ry + 66, 22, 5); g.fillRect(sc.x0 + 50, ry + 78, 22, 3); g.fillRect(sc.x0 + 50, ry + 87, 16, 3); }
        });
      });
      g.restore();
      EXITING = ex; g.restore();
    }
    /* the label: slides up out of the phone in the pause after "check.", centred; on "link" it slides left (full size)
       and the policy page rises beside it on the right */
    var up = eout(seg(t, LR, LR + .8));
    var sh = eio(seg(t, K.linkW - .1, K.linkW + .45));
    var LX = lerp(510 - LBW / 2, 104, sh), LY = lerp(lerp(1300, 632, up), 520, sh) + d * .4;
    var gk = eio(seg(t, K.HERO - .02, K.HERO + .5));     /* the page's tickets grow into the big line */
    var px0 = 592, pw = 332, ph = 600, py0 = 520 + 60 * (1 - sh) + d * .3;
    if (up > 0) {
      g.save(); var ex4 = EXITING; if (up < 1 || (sh > 0 && sh < 1)) EXITING = true;
      g.globalAlpha *= seg(up, 0, .25);
      var nw = labelSheet(g, LX, LY);
      /* the tap on "network": a fingertip presses the link row, a cream ring spreads */
      var tp = seg(t, K.network - .3, K.network + .5);
      if (tp > 0 && tp < 1) {
        var fx = LX + 34 + nw * .55, fy = LY + NMY, pr = Math.sin(Math.PI * seg(tp, .2, .6));
        g.save(); g.globalAlpha *= 1 - seg(tp, .75, 1);
        g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(fx, fy, 30 + 70 * seg(tp, .35, 1), 0, 6.283); g.stroke();
        g.fillStyle = 'rgba(0,0,0,.3)'; el(g, fx + 30, fy + 70 - 12 * pr, 40, 56);
        g.fillStyle = '#e8c9a8'; el(g, fx + 22, fy + 58 - 14 * pr, 38, 54); g.strokeStyle = 'rgba(33,29,38,.6)'; g.lineWidth = 4; g.beginPath(); g.ellipse(fx + 22, fy + 58 - 14 * pr, 38, 54, 0, 0, 6.283); g.stroke();
        g.restore();
      }
      EXITING = ex4; g.restore();
    }
    /* the policy page, beside the label (never behind it) */
    if (sh > 0) {
      g.save(); g.globalAlpha *= seg(sh, 0, .4); var ex3 = EXITING; if (sh < 1) EXITING = true;
      sheet(g, px0, py0, px0 + pw, py0 + ph, 811, PAPER, 'policy page');
      onprop(function () {
        txt(g, 'NETWORK', px0 + 26, py0 + 50, 40, INK, 'left', 900, DISP, pw - 52, 1, 40, 'condensed');
        txt(g, 'MANAGEMENT', px0 + 26, py0 + 94, 40, INK, 'left', 900, DISP, pw - 52, 1, 40, 'condensed');
        g.fillStyle = INK; g.fillRect(px0 + 26, py0 + 122, pw - 52, 6);
        QV.forEach(function (L, i) { txt(g, L, px0 + 26, py0 + 174 + i * 52, 42, INK, 'left', 800, DISP, pw - 52, 1, 40, 'condensed'); });
        txt(g, 'VERIZON', px0 + 26, py0 + 436, 34, '#5d564c', 'left', 800, DISP, 200, 1, 30, 'condensed');
      });
      tag(g, 'RE-CREATED', px0 + 100, py0 + 490, 1, 0, 200, INK, PAPER, 30);
      EXITING = ex3; g.restore();
    }
    /* the line on the page: four small tickets; when the circle closes they grow out of the page into a big row (yours, 33,
       in a heavy cream outline) */
    if (sh > 0) {
      var nrt = NOREC; NOREC = gk < 1;
      [0, 1, 2, 3].forEach(function (i) {
        var e = gk, yours = i === 2;
        var x = lerp(px0 + 55 + i * 74, 510 + (i - 1.5) * 152, e), y = lerp(py0 + 556, 1244, e) - 60 * Math.sin(Math.PI * e) + (e >= 1 ? 5 * Math.sin(t * 3 + i) : 0);
        var w = lerp(54, 128, e), hh = lerp(66, 120, e);
        g.save(); g.globalAlpha *= seg(sh, .2, .6);
        ticket(g, x, y, w, hh, 31 + i, { yours: yours, halo: yours && e > .6, s: yours ? lerp(1, 1.08, e) : 1, name: 'page ticket', moving: (e > 0 && e < 1) || sh < 1 });
        g.restore();
      });
      NOREC = nrt;
    }
    /* THE hero mark: the coral marker circle around Network Management, drawn in the silence after "line." */
    if (up > 0) { var nw2 = labelSheetNW(); marker(g, LX + 34 + nw2 / 2, LY + NMY - 4, nw2 / 2 + 22, 50, seg(t, K.MK + .02, K.MK + .32)); }
    /* RE-CREATED · FCC LABEL FORMAT under the plate, slapped on in the pause after "label." */
    if (t >= K.LS - .08 && up > 0) {
      var kt = eout(seg(t, K.LS - .08, K.LS)), ex5 = EXITING; if (kt < 1) EXITING = true;
      tag(g, 'RE-CREATED · FCC LABEL FORMAT', 510, 1344 + d * .2, seg(t, K.LS - .08, K.LS - .05), .01, 760, CREAM, null, 30);
      EXITING = ex5;
    }
    /* the takeaway, in its own words, from the tap on */
    var la = fin(t, K.network - .05, 4);
    if (la > 0) chip(g, 'LOOK FOR: PREMIUM OR HIGH-SPEED GB', 510, 1396, { px: 48, wt: 900, bg: CREAM, fg: INK, a: la, st: 'condensed', r: 16, maxw: 810 });
  }
  function labelSheetNW() { var c = tctx; c.save(); font(c, 46, 800, DISP, 'condensed'); var w = Math.min(LBW - 68, c.measureText('Network Management').width); c.restore(); return w; }

  /* =====================================================================================================
     SCENE 5 · the end: TODAY, frame 0's card at full opacity, YES / NO; it glides back to frame 0's place
     ===================================================================================================== */
  function endScene(g, t) {
    if (LAYER === 'bg') return;
    var u = sio(seg(t, TEND - 1.0, TEND)), rot = lerp(0, F0.rot, u), tt = t - TEND;
    var s = lerp(F0.sUp, 1, u), cy = lerp(F0.cyUp + 110, F0.cy, u);
    var bob = 1 - seg(t, TEND - 1.2, TEND - .6), d = drift(t, .3, 1.1 * bob);
    signalCard(g, F0.cx, cy + d, F0.S * s, tt, rot, null);
    var E0 = S('end').t0;
    /* a hard cut on the slap: TODAY and YES / NO land at full opacity on the first frame (1.15 → 1) */
    var kc = eout(seg(t, E0, E0 + .12)), sc0 = lerp(1.15, 1, kc);
    chip(g, 'TODAY', 760, 566, { px: 60, wt: 900, bg: CREAM, fg: INK, a: 1, st: 'condensed', rot: .03, r: 18, s: sc0 });
    var ya = 1, yp = 1;
    [['YES', 330, 0], ['NO', 750, .1]].forEach(function (c) {
      var tq0 = c[0] === 'YES' ? (GT.ty != null ? GT.ty : K.yes) : K.noE, tp = Math.sin(Math.PI * seg(t, tq0 - .03, tq0 + .15)), sc = sc0 * (1 - .07 * tp);
      chip(g, c[0], c[1], 1328 + 10 * tp, { px: 116, wt: 900, bg: BG, line: HOT, lw: 8, fg: HOT, w: 300, h: 170, r: 60, shadow: true, a: ya, s: sc });
    });
  }

  /* ---------- captions: the narrator's words in phrase cards (one size); stressed words get a cream pill (never coral) ---------- */
  var CAPGROUPS = { hook: [[2], [3]], ask: [[3, 3]], room: [[3], [6]], busy: [[3], [3, 4]], place: [[3, 5]], dip: [[6], [5]], bill: [[5]], but: [[4], [4]], label: [[3, 3], [3]], hero: [[3, 2], [3]], end: [[3], [2, 2]], yn: [[3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', 'speed'], ['room', 'fixed'], ['busy', 'busy'], ['place', 'place'], ['dip', 'back'], ['bill', 'next'], ['but', 'check'], ['label', 'broadband'], ['hero', 'line'], ['end', 'full']]
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
  var NOISE, SCENES = { cardScene: cardScene, towerScene: towerScene, monthScene: monthScene, acctScene: acctScene, endScene: endScene };
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
    var w = 380, x0 = xb - w / 2, th = 210, off = (t * 160) % th;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0 - 26, 0, 26, H);
    for (var y = -th + off; y < H + th; y += th) {
      var n = 40 + Math.floor((y - off) / th + 20) % 60;
      g.fillStyle = (n % 2) ? ROLL : ROLL2; g.fillRect(x0, y, w, th);
      g.strokeStyle = 'rgba(33,29,38,.5)'; g.lineWidth = 4; g.setLineDash([10, 9]); g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); g.setLineDash([]);
      g.fillStyle = BG; el(g, x0, y + th / 2, 18, 18); el(g, x0 + w, y + th / 2, 18, 18);
      g.fillStyle = 'rgba(33,29,38,.14)'; el(g, xb, y + th / 2, 26, 26);
    }
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
    g.fillText('Why unlimited data', CX, 352);
    var b = 'slows down', bp = 62; font(g, bp, 800, DISP, 'expanded');
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
  var GAIN = { ne: .4, en: .4, ds: .3, dt: .25, sw2: .3, rp: .3, fw: .4, d1: .2, lb: .4, ls: .06, mk: .45, hero: .26, ty: .5 };
  var TYPE = { ne: 'slap', en: 'click', ds: 'knock', dt: 'tick', sw2: 'swish', rp: 'rip', fw: 'paper', d1: 'tick', lb: 'paper', ls: 'slap', mk: 'marker', hero: 'thump', ty: 'tick' };
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
    EV.forEach(function (e) {
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
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((HOLD.t0 + HOLD.t1) / 2 * 30) / 30 + 1 / 60, SLUG: 'unlimiteddata', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
