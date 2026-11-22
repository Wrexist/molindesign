/* "The NSA says restart weekly." — Factory #39 (restartphone) on Tech, explained, after ../trackeralert/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   All cut paper over a dim paper week planner: a giant cream power button with a coral ring is the thread. The NSA's
   one-page sheet (page 1) and one column of its chart (page 2, re-created), a generic phone with a cut-paper bug and a
   crack in its glass, three power cycles (the screen collapses to a coral line, the ring sweeps, it blooms back), a
   paper patch, Apple's iOS 16.5.1 card, a re-created Samsung settings path ending on a chevron. No people, no hands.
   Props stay whole inside x 92–928, y 302–1428. */
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
  var BODY = { thump: .2, knock: .14, slap: .1, paper: .17, pop: .12, tick: .05, click: .06, swish: .21, rip: .24, marker: .3, tear: .15, chirp: .14 };
  var GT = {};
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }
  /* =====================================================================================================
     THE NSA STRINGS (one block, so they can be changed quickly). Verified against the PDF on 2026-11-22
     (media.defense.gov copy, 2 pages, read visually in a browser; see BRIEF.md §3b.1):
       page 1, under POWER: "Power the device off and on weekly."
       page 2 chart "WHAT CAN I DO TO PREVENT/MITIGATE?": practices are the columns, threats the rows (side label
       THREAT/VULNERABILITY); the column "Turn Device Off & On Weekly" has exactly two marks, both "Sometimes prevents",
       on "Spearphishing (To install Malware)" and "Zero-Click Exploits"; every other row in it is "Does not prevent
       (no icon)"; legend: "Does not prevent (no icon)", "Sometimes prevents", "Almost always prevents"
       footer: "U/OO/155488-20 | PP-20-0622 | Oct 2020 rev 1.1" (print OCT 2020, not the 2021 upload path)
       page 1, under SOFTWARE UPDATES: "Update the device software and applications as soon as possible." (not shown)
     ===================================================================================================== */
  var NSA = {
    org: 'NSA',
    title: 'MOBILE DEVICE BEST PRACTICES',
    powerHead: 'POWER',
    powerLines: ['POWER THE', 'DEVICE OFF AND', 'ON WEEKLY.'],
    footerId: 'U/OO/155488-20 | PP-20-0622',
    footerDate: 'OCT 2020 REV 1.1',
    date: 'OCT 2020',
    chartTitle: 'WHAT CAN I DO TO PREVENT/MITIGATE?',
    sideLabel: 'THREAT/VULNERABILITY',
    column: ['TURN DEVICE', 'OFF & ON', 'WEEKLY'],
    rows: [['SPEARPHISHING', '(TO INSTALL MALWARE)'], ['ZERO-CLICK EXPLOITS']],
    otherRows: 'OTHER ROWS: NO ICON',
    legend: ['DOES NOT PREVENT (NO ICON)', 'SOMETIMES PREVENTS', 'ALMOST ALWAYS PREVENTS'],
    stamp: 'SOMETIMES\nPREVENTS',
    stampCredit: 'NSA CHART'
  };
  var K = {
    hook: start('hook'), nsa: at('hook', 'NSA'), weekly: at('hook', 'weekly.'), hookEnd: lend('hook'),
    ask: start('ask'), every: at('ask', 'every'), week: at('ask', 'week?'), askEnd: lend('ask'),
    quote: start('quote'), guide: at('quote', 'guide'), power: at('quote', 'power'), off: at('quote', 'off'), qweekly: at('quote', 'weekly.'), quoteEnd: lend('quote'),
    why: start('why'), some: at('why', 'Some'), spyware: at('why', 'spyware'), survive: at('why', 'survive'), whyEnd: lend('why'),
    wipe: start('wipe'), reboot: at('wipe', 'reboot'), can: at('wipe', 'can'), wipeW: at('wipe', 'wipe'), wipeEnd: lend('wipe'),
    twist: start('twist'), nsas: at('twist', "NSA's"), chart: at('twist', 'chart'), sometimes: at('twist', 'sometimes.'), twistEnd: lend('twist'),
    dip: start('dip'), y2023: at('dip', '2023,'), kasp: at('dip', 'Kaspersky'), may: at('dip', 'may'), reinf: at('dip', 'reinfected.'), dipEnd: lend('dip'),
    hole: start('hole'), hrestart: at('hole', 'restart'), holeW: at('hole', 'hole.'), holeEnd: lend('hole'),
    upd: start('update'), updW: at('update', 'update'), canU: at('update', 'can.'), fixedW: at('update', 'fixed'), canUEnd: wend('update', 'can.'), apple: at('update', 'Apple'), june: at('update', 'June.'), updEnd: lend('update'),
    ans: start('answer'), ansUpd: at('answer', 'update'), ansRestart: at('answer', 'restart'), ansWeekly: at('answer', 'weekly.'), ansEnd: lend('answer'),
    sam: start('samsung'), samW: at('samsung', 'Samsung'), galaxy: at('samsung', 'Galaxy'), phonesS: at('samsung', 'phones'), canS: at('samsung', 'can'), restartS: at('samsung', 'restart'), schedule: at('samsung', 'schedule.'), samEnd: lend('samsung'),
    end: start('end'), weekE: at('end', 'week?'), thisE: at('end', 'this'), yesE: at('end', 'Yes'), noE: at('end', 'no.'), noEnd: wend('end', 'no.')
  };
  (function () {
    place('hk', 'tick', K.hookEnd + .3, .2, K.hookEnd, K.ask);        /* the NSA chip pressed */
    place('sb', 'tick', K.askEnd + .3, .2, K.askEnd, K.quote);        /* the search bar's last key */
    place('qt', 'tick', K.quoteEnd + .3, .2, K.quoteEnd, K.why);      /* the underline's end */
    place('wy', 'pop', K.whyEnd + .3, .2, K.whyEnd, K.wipe);          /* the quote plate re-pressed */
    place('rp', 'tear', K.wipeEnd + .3, .2, K.wipeEnd, K.twist);      /* the wipe to the chart */
    place('tw', 'thump', K.twistEnd + .3, .2, K.twistEnd, K.dip);     /* SOMETIMES / PREVENTS, the hero stamp, punched and re-inked */
    place('hl', 'click', K.holeEnd + .3, .2, K.holeEnd, K.upd);       /* THE WAY IN pressed */
    place('pt', 'slap', K.canUEnd + .3, .2, K.canUEnd, K.apple);      /* the patch lands */
    place('an', 'tick', K.ansEnd + .3, .2, K.ansEnd, K.sam);          /* the check mark */
    place('sm', 'tick', K.samEnd + .3, .2, K.samEnd, K.end);          /* the schedule row pressed */
  })();
  var TW = .45;
  function gt(n, d) { return GT[n] != null ? GT[n] : d; }
  K.HK = gt('hk', K.hookEnd + .3); K.SB = gt('sb', K.askEnd + .3); K.QT = gt('qt', K.quoteEnd + .3); K.WY = gt('wy', K.whyEnd + .3);
  K.RP = gt('rp', K.wipeEnd + .3); K.TW = gt('tw', K.twistEnd + .3); K.HL = gt('hl', K.holeEnd + .3); K.PT = gt('pt', K.canUEnd + .3);
  K.AN = gt('an', K.ansEnd + .3); K.SM = gt('sm', K.samEnd + .3);
  var SC = [
    { id: 'button', fn: 'buttonScene', name: 'The NSA says restart weekly', t0: 0 },
    { id: 'phone', fn: 'phoneScene', name: 'Some spyware can’t survive a restart', t0: K.some, tw: .4 },
    { id: 'chart', fn: 'chartScene', name: 'The NSA’s own chart: sometimes', t0: K.twist, tw: .45 },
    { id: 'back', fn: 'backScene', name: 'Reinfected; the hole; an update', t0: K.dip + .66, tw: .35 },
    { id: 'samsung', fn: 'samsungScene', name: 'Samsung: restart on a schedule', t0: Math.max(K.sam - .05, K.AN + .2), tw: .4 },
    { id: 'end', fn: 'endScene', name: 'Did you restart this week?', t0: Math.max(K.end - .05, K.SM + .25), tw: .35 }
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
  /* =====================================================================================================
     THE PROPS (all cut paper, all drawn by hand): a dim paper week planner, a cream paper power button with a coral
     ring (no logo), the NSA's sheet and one column of its chart (re-created), a generic phone (punch-hole, no logo),
     a cut-paper bug, a crack in the glass, a paper patch, Apple's card, a re-created Samsung settings path.
     ===================================================================================================== */
  var CUR = 'button';
  var TAGC = '#efe7d4', TAGE = '#d6cbb2', GRAYR = '#8d877c', SCR = '#ece5d8', HL = '#f3d58c';
  function frac(x) { return x - Math.floor(x); }
  function peelT(g, x0, y1, eo) { g.translate(x0, y1); g.rotate(-.08 * eo); g.translate(-x0, -y1); g.translate(-70 * eo, 50 * eo); g.globalAlpha *= 1 - eo; }

  /* ---------- the wallpaper: a dim paper week planner (seven columns of day cards), drifting slowly ---------- */
  var PL = null;
  function planBg(g, ct, dim) {
    g.fillStyle = '#0f151d'; g.fillRect(-400, -300, W + 800, H + 600);
    if (!PL) { var r = mulberry(311); PL = []; for (var gy = -1; gy < 11; gy++) for (var gx = -1; gx < 8; gx++) PL.push([gx * 152 + r() * 6, gy * 198 + r() * 8, 128 + r() * 6, 170 + r() * 8, r()]); }
    g.save(); g.translate(-40 + 3 * ct, -70 + 4 * ct);
    PL.forEach(function (b) {
      g.fillStyle = b[4] < .07 ? '#1f2b2c' : '#172029'; rr(g, b[0], b[1], b[2], b[3], 12); g.fill();
      g.fillStyle = 'rgba(244,237,224,.055)'; rr(g, b[0] + 12, b[1] + 12, 30, 18, 6); g.fill();
      if (b[4] > .9) { g.strokeStyle = 'rgba(255,91,61,.16)'; g.lineWidth = 5; g.beginPath(); g.arc(b[0] + 27, b[1] + 21, 26, 0, 6.283); g.stroke(); }
    });
    g.restore();
    if (dim) { g.fillStyle = 'rgba(10,14,20,' + dim + ')'; g.fillRect(-400, -300, W + 800, H + 600); }
  }
  /* coral pulse rings round the lit button (background layer; loop-safe in ct) */
  function pulses(g, cx, cy, r, ct, a) {
    if (a <= 0) return;
    g.save(); g.strokeStyle = HOT;
    [0, .5].forEach(function (ph) { var k = frac(ct * .7 + ph); g.globalAlpha = a * .5 * (1 - k); g.lineWidth = Math.max(3, .03 * r) * (1 - .5 * k); g.beginPath(); g.arc(cx, cy, r * (1.04 + .42 * k), 0, 6.283); g.stroke(); });
    g.restore();
  }
  /* ---------- the hero: a cream paper power button, coral ring with a sweep, seven week notches, the power glyph ---------- */
  function powerGlyph(g, cx, cy, gr, col, lw, rot) {
    g.save(); g.translate(cx, cy); g.rotate(rot || 0); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
    g.beginPath(); g.arc(0, gr * .06, gr, -1.5708 + .66, -1.5708 - .66 + 6.283); g.stroke();
    g.beginPath(); g.moveTo(0, -gr * 1.14); g.lineTo(0, -gr * .2); g.stroke(); g.restore();
  }
  function powerBtn(g, cx, cy, r, o) {
    o = o || {}; var lit = o.lit == null ? 1 : o.lit;
    g.fillStyle = 'rgba(0,0,0,.42)'; el(g, cx + .04 * r, cy + .08 * r, r, r);
    g.fillStyle = TAGE; el(g, cx, cy + .035 * r, r, r);
    g.fillStyle = TAGC; el(g, cx, cy, r, r);
    g.beginPath(); g.arc(cx, cy, r, 0, 6.283); grainIn(g, cx - r, cy - r, 2 * r, 2 * r, 6301, .7);
    g.strokeStyle = 'rgba(120,104,80,.28)'; g.lineWidth = Math.max(2, .018 * r); g.beginPath(); g.arc(cx, cy, r * .97, 0, 6.283); g.stroke();
    g.strokeStyle = mixc(hex(GRAYR), hex(HOT), lit); g.lineWidth = .075 * r; g.beginPath(); g.arc(cx, cy, r * .86, 0, 6.283); g.stroke();
    var sa = (o.sweep || 0) * 6.283 - 1.5708;
    g.save(); g.strokeStyle = 'rgba(255,238,224,.8)'; g.lineWidth = .03 * r; g.lineCap = 'round'; g.beginPath(); g.arc(cx, cy, r * .86, sa, sa + .75); g.stroke(); g.restore();
    if (o.days > 0) for (var i = 0; i < 7; i++) {
      var a = -1.5708 + (i + .5) * 6.283 / 7, k = eout(clamp(o.days - i, 0, 1)), s = (.028 + .022 * k) * r;
      if (k <= 0) continue;
      g.fillStyle = INK; el(g, cx + Math.cos(a) * r * .72, cy + Math.sin(a) * r * .72, s, s);
    }
    powerGlyph(g, cx, cy, .33 * r, INK, .085 * r, o.rot || 0);
    prop(g, o.name || 'power button', cx - r, cy - r, cx + r, cy + r * 1.035);
  }
  /* ---------- the search bar, typed in (re-created) ---------- */
  var QUERY = 'SHOULD I RESTART MY PHONE EVERY WEEK?';
  function searchBar(g, x, y, t, t0, out) {
    var sa = seg(t, t0, t0 + .12) * (1 - out);
    if (sa <= 0 || !LIVE.text) return;
    var w = 812, h = 86, x0 = x - w / 2, y0 = y - h / 2, eo = eio(out);
    g.save(); g.globalAlpha *= sa; g.translate(-120 * eo, 0);
    var ex = EXITING; if (sa < 1 || eo > 0) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 8, y0 + 10, w, h, 46); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 46); g.fill();
    prop(g, 'search bar', x0, y0, x0 + w, y0 + h);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(x0 + 46, y - 6, 15, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(x0 + 57, y + 5); g.lineTo(x0 + 70, y + 18); g.stroke();
    var k = seg(t, t0 + .04, t0 + .34), n = Math.round(QUERY.length * k), typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
    onprop(function () { if (n) txt(g, QUERY.slice(0, n), x0 + 84, y + 3, 46, INK, 'left', 900, DISP, w - 108, 1, 38, 'condensed'); });
    NOREC = nr;
    var tga = 1 - seg(t, K.guide - .45, K.guide - .3); if (tga > 0) onprop(function () { tag(g, 'RE-CREATED', x0 + w - 110, y0 + h + 34, tga, 0, 220, CREAM, null, 30); });
    EXITING = ex; g.restore();
  }
  /* ---------- the NSA sheet, page 1 (re-created): title, POWER, the bullet, the real footer ---------- */
  var SH = { x0: 104, y0: 630, x1: 916, y1: 1216 };
  function nsaPage(g, t) {
    var x0 = SH.x0, y0 = SH.y0, x1 = SH.x1, y1 = SH.y1;
    sheet(g, x0, y0, x1, y1, 5201, PAPER, 'nsa sheet');
    onprop(function () {
      chip(g, NSA.org, x0 + 74, y0 + 60, { px: 46, wt: 900, bg: INK, fg: CREAM, r: 10, shadow: false, pad: 14, st: 'condensed' });
      txt(g, NSA.title, x0 + 134, y0 + 62, 46, INK, 'left', 900, DISP, x1 - x0 - 164, 1, 36, 'condensed');
      txt(g, NSA.powerHead, x0 + 40, y0 + 172, 52, INK, 'left', 900, DISP, 300, 1, 36, 'condensed');
      txt(g, NSA.footerId, x0 + 40, y1 - 80, 30, '#5d564c', 'left', 700, MONO, 560, 1, 30);
      txt(g, NSA.footerDate, x0 + 40, y1 - 40, 30, '#5d564c', 'left', 700, MONO, 400, 1, 30);
      tag(g, 'RE-CREATED', x1 - 122, y1 - 42, 1, 0, 220, INK, PAPER, 30);
    });
    g.fillStyle = 'rgba(33,29,38,.4)'; g.fillRect(x0 + 40, y0 + 108, x1 - x0 - 80, 3);
    /* the date card (the footer's date, not the upload path) */
    if (t >= K.guide + .2) onprop(function () { slapCard(g, NSA.date, x1 - 150, y0 + 172, t, K.guide + .3, 50, 260); });
    /* the bullet prints on "power"; the underline runs on "weekly" */
    var ba = 1;
    if (ba > 0) {
      g.save(); g.globalAlpha *= ba; g.fillStyle = INK; el(g, x0 + 58, y0 + 256, 11, 11); g.restore();
      onprop(function () { NSA.powerLines.forEach(function (L, i) { txt(g, L, x0 + 92, y0 + 258 + i * 76, 68, INK, 'left', 900, DISP, x1 - x0 - 130, ba, 44, 'condensed'); }); });
    }
    /* r1: the quote is on the page from the first frame; a highlighter runs under it word by word ("power", "off", "weekly") */
    font(g, 68, 900, DISP, 'condensed');
    [[K.power, K.off - .05, 0], [K.off, K.qweekly - .05, 1], [K.qweekly, K.qweekly + .3, 2]].forEach(function (q) {
      var ul = eio(seg(t, q[0] - .04, q[1])); if (ul <= 0) return;
      var w3 = g.measureText(NSA.powerLines[q[2]]).width, yy = y0 + 296 + q[2] * 76;
      g.save(); g.strokeStyle = HL; g.globalAlpha *= .9; g.lineWidth = 10; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0 + 92, yy); g.lineTo(x0 + 92 + w3 * ul, yy - 2 * ul); g.stroke(); g.restore();
    });
  }
  /* ---------- the button scene (hook, ask, quote) ---------- */
  function f0(ct) { var k = eout(seg(ct, 0, .9)); return { x: lerp(566, 510, k), y: lerp(1074, 930, k), r: lerp(330, 356, k), rot: lerp(.5, 0, k) }; }
  function btnPose(t) {
    var p = f0(t), ka = eio(seg(t, K.ask - .1, K.ask + .5)), kq = eio(seg(t, K.guide - .25, K.guide + .4));
    var x = p.x, y = lerp(p.y, 1010, ka), r = lerp(p.r, 292, ka);
    x = lerp(x, 510, kq); y = lerp(y, 1322, kq); r = lerp(r, 92, kq);
    return { x: x, y: y, r: r, rot: p.rot, moving: t < .9 || (ka > 0 && ka < 1) || (kq > 0 && kq < 1) };
  }
  /* RESTART WEEKLY? (frame 0 and the end card): the words and the "?" are set as two pieces */
  function title0(g, a) {
    font(g, 92, 900, DISP, 'condensed'); var w1 = g.measureText('RESTART WEEKLY').width, wq = g.measureText('?').width, x = 510 - (w1 + wq) / 2;
    txt(g, 'RESTART WEEKLY', x, 514, 92, CREAM, 'left', 900, DISP, 0, a == null ? 1 : a, 60, 'condensed');
    txt(g, '?', x + w1, 514, 92, CREAM, 'left', 900, DISP, 0, a == null ? 1 : a, 60, 'condensed');
  }
  /* r1: the bug sits on the button at frame 0; the ring flicks it off just after "weekly" */
  function bugOnBtn(x, y, r) { return { x: x + .6 * r, y: y + .56 * r, s: 1.55 * r / 356, rot: .75 }; }   /* r2 polish: on the ring's edge, clear of the power glyph */
  function sweepAt(t) { return t * .55 + eio(seg(t, K.weekly - .05, K.weekly + .6)); }
  function buttonScene(g, t) {
    var bp = btnPose(t);
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { planBg(g, t, 0); pulses(g, bp.x, bp.y, bp.r, t, 1); return; }
    /* frame 0's words, peeled on "So" */
    var hout = eio(seg(t, K.ask - .1, K.ask + .12));
    if (hout < 1) { var exh = EXITING; if (hout > 0) EXITING = true; g.save(); peelT(g, 110, 560, hout); title0(g); g.restore(); EXITING = exh; }
    searchBar(g, 510, 520, t, K.ask, eio(seg(t, K.off, K.off + .25)));
    /* the sheet slides up on "guide" */
    var kin = eout(seg(t, K.guide - .3, K.guide + .12));
    if (kin > 0) { var ex2 = EXITING; if (kin < 1) EXITING = true; g.save(); g.translate(0, 820 * (1 - kin)); nsaPage(g, t); g.restore(); EXITING = ex2; }
    /* the button: frame 0's glide, then down and smaller under the sheet (the ring keeps sweeping) */
    var ex = EXITING; if (bp.moving) EXITING = true;
    var days = clamp((t - K.every) / (K.askEnd + .1 - K.every) * 7, 0, 7) * (1 - seg(t, K.guide - .25, K.guide));
    powerBtn(g, bp.x, bp.y, bp.r, { sweep: sweepAt(t), rot: bp.rot, days: days });
    EXITING = ex;
    var bb = bugOnBtn(bp.x, bp.y, bp.r), FL = K.weekly + .15;
    if (t < FL) bug(g, bb.x, bb.y, bb.s, bb.rot + .12 * Math.sin(t * 2.2), t, .3, 1);
    else { var kf = seg(t, FL, FL + .6); if (kf < 1) bug(g, bb.x + 160 * kf, bb.y - 60 * Math.sin(Math.PI * seg(kf, 0, .35)) + 520 * kf * kf, bb.s, bb.rot + 3 * kf, t, .2, 1 - seg(kf, .45, 1)); }
    /* NSA, on "NSA" (a sticker on the button's shoulder), peeled as the sheet arrives */
    var na = eio(seg(t, K.guide - .3, K.guide - .1));
    if (t >= K.nsa - .08 && na < 1) {
      var exn = EXITING; if (na > 0 || bp.moving) EXITING = true;
      g.save(); peelT(g, bp.x - bp.r, bp.y - bp.r * .6, na);
      var pk = .05 * Math.sin(Math.PI * seg(t, K.HK - .02, K.HK + .16)), nx = bp.x - bp.r * .8, ny = bp.y - bp.r * .86;
      g.translate(nx, ny); g.scale(1 + pk, 1 + pk); g.translate(-nx, -ny);
      onprop(function () { slapCard(g, NSA.org, nx, ny, t, K.nsa, 68, 240); });
      g.restore(); EXITING = exn;
    }
  }

  /* ---------- the phone, its screen, the power cycle, the crack, the bug, the patch ---------- */
  var PH = { x: 104, y: 476, w: 392, h: 712 };
  var SM0 = Math.max(10, PH.w * .035), SS = { x: PH.x + SM0, y: PH.y + SM0, w: PH.w - 2 * SM0, h: PH.h - 2 * SM0 };
  var CR = { x: SS.x + SS.w - 46, y: SS.y + SS.h - 58 }, HOME = { x: SS.x + SS.w / 2, y: SS.y + SS.h * .45 };
  function cycle(t, T0) { if (t < T0 - .001 || t > T0 + 1.0) return null; return { T0: T0, col: eio(seg(t, T0, T0 + .14)), dark: seg(t, T0 + .1, T0 + .16) * (1 - seg(t, T0 + .8, T0 + .9)), sweep: eio(seg(t, T0 + .16, T0 + .78)), bloom: eout(seg(t, T0 + .78, T0 + 1.0)) }; }
  function homeScreen(g, S) {
    var r = mulberry(5101), cols = 4, pad = S.w * .08, cw = (S.w - pad * 2) / cols, TC = ['#c9b99a', '#9fb4a6', '#d8a77f', '#a9b6c9', '#c7a3a3', '#b8c48f'];
    g.fillStyle = '#e4dccb'; g.fillRect(S.x, S.y, S.w, S.h);
    for (var j = 0; j < 4; j++) for (var i = 0; i < cols; i++) { g.fillStyle = TC[Math.floor(r() * TC.length)]; rr(g, S.x + pad + i * cw + cw * .14, S.y + S.h * .12 + j * cw * 1.12, cw * .72, cw * .72, cw * .2); g.fill(); }
    g.fillStyle = 'rgba(33,29,38,.08)'; rr(g, S.x + pad * .6, S.y + S.h - cw * 1.3, S.w - pad * 1.2, cw * 1.08, cw * .3); g.fill();
    for (i = 0; i < cols; i++) { g.fillStyle = TC[(i * 2 + 1) % TC.length]; rr(g, S.x + pad + i * cw + cw * .14, S.y + S.h - cw * 1.16, cw * .72, cw * .72, cw * .2); g.fill(); }
  }
  function crack(g, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.strokeStyle = 'rgba(252,248,240,.92)'; g.lineCap = 'round'; g.lineJoin = 'round';
    var r = mulberry(7701);
    for (var i = 0; i < 7; i++) {
      var ang = 2.4 + i * .52 + (r() - .5) * .3, L = 40 + r() * 70, x = CR.x, y = CR.y;
      g.lineWidth = 4 - i * .25; g.beginPath(); g.moveTo(x, y);
      for (var s = 0; s < 4; s++) { var d = L / 4; ang += (r() - .5) * .6; x += Math.cos(ang) * d; y += Math.sin(ang) * d; g.lineTo(x, y); }
      g.stroke();
    }
    g.fillStyle = '#1a1f26'; el(g, CR.x, CR.y, 13, 11);
    g.strokeStyle = 'rgba(252,248,240,.92)'; g.lineWidth = 3; g.beginPath(); g.arc(CR.x, CR.y, 16, 0, 6.283); g.stroke();
    g.restore();
  }
  function phoneUnit(g, t, cyc, o) {
    o = o || {};
    var c = null; cyc.forEach(function (T0) { var q = cycle(t, T0); if (q) c = q; });
    var pr = 0; cyc.forEach(function (T0) { pr = Math.max(pr, Math.sin(Math.PI * seg(t, T0 - .14, T0 + .08))); });
    g.fillStyle = '#3a4452'; rr(g, PH.x + PH.w - 4 - 6 * pr, PH.y + 168, 14, 98, 5); g.fill();   /* the side button presses in */
    var P = phoneBody(g, PH.x, PH.y, PH.w, PH.h, '#0b0e13', 'phone');
    var sy = 1; if (c) sy = t < c.T0 + .14 ? 1 - c.col : c.bloom;
    g.save(); rr(g, P.x, P.y, P.w, P.h, PH.w * .13 - SM0 * .6); g.clip();
    g.fillStyle = '#0b0e13'; g.fillRect(P.x, P.y, P.w, P.h);
    if (sy > .004) { g.save(); g.translate(0, P.y + P.h / 2); g.scale(1, sy); g.translate(0, -(P.y + P.h / 2)); homeScreen(g, P); g.restore(); }
    if (c && sy < .3) { var la = 1 - sy / .3; g.fillStyle = HOT; g.globalAlpha = la * (1 - c.dark * .85); rr(g, P.x + P.w * (.5 - .45 * la), P.y + P.h / 2 - 5, P.w * .9 * la, 10, 5); g.fill(); g.globalAlpha = 1; }
    if (c && c.dark > 0) {
      g.save(); g.globalAlpha *= c.dark; var gx = P.x + P.w / 2, gy = P.y + P.h / 2;
      g.strokeStyle = 'rgba(244,237,224,.18)'; g.lineWidth = 10; g.beginPath(); g.arc(gx, gy, 74, 0, 6.283); g.stroke();
      g.strokeStyle = HOT; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.arc(gx, gy, 74, -1.5708, -1.5708 + 6.283 * Math.max(.01, c.sweep)); g.stroke();
      powerGlyph(g, gx, gy, 34, CREAM, 9, 0);
      g.restore();
    }
    g.restore();
    g.fillStyle = '#10151c'; el(g, PH.x + PH.w / 2, P.y + Math.max(14, PH.w * .045), Math.max(6, PH.w * .022), Math.max(6, PH.w * .022));
    crack(g, o.crack == null ? 1 : o.crack);
    return P;
  }
  /* ---------- a generic phone: dark body, punch-hole camera, no notch, no logo; returns the screen box ---------- */
  function phoneBody(g, x0, y0, w, h, scr, name) {
    var rad = w * .13;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 10, y0 + 14, w, h, rad); g.fill();
    g.fillStyle = '#2a313d'; rr(g, x0, y0, w, h, rad); g.fill();
    rr(g, x0, y0, w, h, rad); grainIn(g, x0, y0, w, h, 7401, .8);
    g.strokeStyle = 'rgba(244,237,224,.35)'; g.lineWidth = 3; rr(g, x0, y0, w, h, rad); g.stroke();
    prop(g, name || 'phone', x0, y0, x0 + w, y0 + h);
    var m = Math.max(10, w * .035), S = { x: x0 + m, y: y0 + m, w: w - 2 * m, h: h - 2 * m };
    g.fillStyle = scr || SCR; rr(g, S.x, S.y, S.w, S.h, rad - m * .6); g.fill();
    g.fillStyle = '#10151c'; el(g, x0 + w / 2, S.y + Math.max(14, w * .045), Math.max(6, w * .022), Math.max(6, w * .022));
    return S;
  }
  /* the bug: a cut-paper beetle (dark green paper, ink legs that walk), no face */
  function bug(g, x, y, s, rot, t, walk, a) {
    if (a <= 0 || s <= 0) return;
    g.save(); g.globalAlpha *= a == null ? 1 : a; g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    var w = walk == null ? 1 : walk;
    g.strokeStyle = '#151a16'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
    for (var i = 0; i < 3; i++) for (var sd = -1; sd <= 1; sd += 2) {
      var ph = Math.sin(t * 15 + i * 2.1 + (sd > 0 ? 1.6 : 0)) * w, yy = -16 + i * 18;
      g.beginPath(); g.moveTo(sd * 22, yy); g.lineTo(sd * (44 + 3 * i), yy + (i - 1) * 12 + ph * 8); g.lineTo(sd * (56 + 5 * i), yy + (i - 1) * 22 + ph * 12); g.stroke();
    }
    g.lineWidth = 5; [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(sd * 7, -44); g.quadraticCurveTo(sd * 18, -70, sd * 32, -78 + 3 * Math.sin(t * 6 + sd)); g.stroke(); });
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 5, 9, 31, 44);
    g.fillStyle = '#41603f'; el(g, 0, 0, 31, 44);
    g.fillStyle = '#2f4a31'; el(g, 0, -40, 17, 13);
    g.strokeStyle = '#263b28'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -30); g.lineTo(0, 43); g.stroke();
    g.fillStyle = 'rgba(225,238,205,.28)'; el(g, -12, -10, 7, 14);
    g.restore();
  }
  function along(P, k) { /* a point and heading along a polyline, k in 0..1 per segment count */
    var n = P.length - 1, f = clamp(k, 0, 1) * n, i = Math.min(n - 1, Math.floor(f)), u = f - i, a = P[i], b = P[i + 1];
    return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), rot: Math.atan2(b[1] - a[1], b[0] - a[0]) + 1.5708 };
  }
  /* falling off: lifted, turned over, dropped (a tear, never a fade alone) */
  function bugFall(g, x, y, t, T0, dir) {
    var k = seg(t, T0, T0 + .62); if (k <= 0 || k >= 1) return k <= 0;
    bug(g, x + 70 * k * (dir || 1), y - 30 * Math.sin(Math.PI * seg(k, 0, .3)) + 560 * k * k, 1.2 * (1 + .1 * Math.sin(Math.PI * seg(k, 0, .3))), 2.6 * k * (dir || 1), t, .2, 1 - seg(k, .45, 1));
    return false;
  }
  function patch(g, t, t0) {
    if (t < t0 - .06) return;
    var k = eout(seg(t, t0 - .06, t0 + .04)), s = lerp(1.35, 1, k) - .04 * Math.sin(Math.PI * seg(t, t0 + .04, t0 + .2));
    g.save(); g.translate(CR.x - 4, CR.y - 6); g.rotate(-.18); g.scale(s, s); g.globalAlpha *= seg(t, t0 - .06, t0 - .03);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -66, -44, 140, 98, 10); g.fill();
    g.fillStyle = '#f6efe2'; rr(g, -72, -50, 140, 98, 10); g.fill();
    rr(g, -72, -50, 140, 98, 10); grainIn(g, -72, -50, 140, 98, 7811, .7);
    g.strokeStyle = '#8f8574'; g.lineWidth = 3; g.setLineDash([9, 7]); rr(g, -62, -40, 120, 78, 6); g.stroke(); g.setLineDash([]);
    g.fillStyle = 'rgba(214,196,150,.8)'; [[-66, -44], [62, 42]].forEach(function (c) { g.save(); g.translate(c[0], c[1]); g.rotate(-.75); g.fillRect(-26, -10, 52, 20); g.restore(); });
    g.restore();
  }
  /* Kaspersky's card: one 2023 iPhone case */
  function kasCard(g, t, t0, out) {
    var a = seg(t, t0 - .08, t0 - .02); if (a <= 0 || out >= 1) return;
    var x0 = 520, y0 = 476, x1 = 916, y1 = 768, ex = EXITING; if (a < 1 || out > 0) EXITING = true;
    var k = eout(seg(t, t0 - .08, t0 + .1));
    g.save(); peelT(g, x0, y1, eio(out)); g.translate(0, 30 * (1 - k)); g.globalAlpha *= a;
    sheet(g, x0, y0, x1, y1, 5301, CREAM, 'kaspersky card');
    onprop(function () {
      chip(g, 'JUNE 2023', x0 + 118, y0 + 52, { px: 44, wt: 900, bg: INK, fg: CREAM, r: 10, shadow: false, pad: 14, st: 'condensed' });
      txt(g, 'KASPERSKY', x0 + 24, y0 + 128, 64, INK, 'left', 900, DISP, x1 - x0 - 48, 1, 40, 'condensed');
      txt(g, '“OPERATION', x0 + 24, y0 + 194, 50, INK, 'left', 900, DISP, x1 - x0 - 48, 1, 40, 'condensed');
      txt(g, 'TRIANGULATION”', x0 + 24, y0 + 246, 50, INK, 'left', 900, DISP, x1 - x0 - 48, 1, 40, 'condensed');
    });
    /* r1: the scope in big cream type under the card: one iPhone case, 2023 */
    txt(g, 'ONE iPHONE SPYWARE', x0 + 4, y1 + 40, 46, CREAM, 'left', 900, DISP, x1 - x0 - 8, 1, 40, 'condensed');
    txt(g, 'CASE · 2023', x0 + 4, y1 + 90, 46, CREAM, 'left', 900, DISP, x1 - x0 - 8, 1, 40, 'condensed');
    g.restore(); EXITING = ex;
  }
  /* ---------- WHY + WIPE: the bug on the screen; Kaspersky's words; power cycle 1 tears it off ---------- */
  function phoneScene(g, t) {
    var E0 = S('phone').t0, T1 = K.wipeW;
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { planBg(g, t, .3); return; }
    var ex = EXITING; if (t < E0 + .05) EXITING = true;
    var sin = eout(seg(t, E0 - .4, E0 + .1));
    g.save(); g.translate(-60 * (1 - sin), 0);
    phoneUnit(g, t, [T1], { crack: 1 });
    /* the bug, wobbling on the glass; on "can" it freezes and lifts; on "wipe" the cycle tears it off */
    var lift = eio(seg(t, K.can, K.can + .25));
    if (t < T1) bug(g, HOME.x + 8 * Math.sin(t * 1.7), HOME.y + 6 * Math.sin(t * 2.3), 1.2 * (1 + .08 * lift), .25 * Math.sin(t * 1.3) * (1 - lift), t, 1 - lift, 1);
    else bugFall(g, HOME.x, HOME.y, t, T1, 1);
    g.restore(); EXITING = ex;
    kasCard(g, t, K.spyware, 0);
    /* Kaspersky's words, on "survive"; re-pressed by the pop after the line */
    var qa = seg(t, K.survive - .02, K.survive + .1);
    if (qa > 0) {
      var pk = .03 * Math.sin(Math.PI * seg(t, K.WY - .02, K.WY + .16));
      g.save(); g.translate(510, 1320); g.scale(1 + pk, 1 + pk); g.translate(-510, -1320);
      qplate(g, 104, 1228, 812, ['“THE MALICIOUS TOOLSET DOES NOT', 'SUPPORT PERSISTENCE…”'], 50, ['KASPERSKY · JUNE 2023'], 5401, qa, 0, false, 44);
      g.restore();
    }
  }
  /* ---------- the chart: one column of the NSA's page 2 chart (re-created); SOME-TIMES on "sometimes" ---------- */
  var CH = { x0: 104, y0: 470, x1: 916, y1: 1120 }, SLOT = { x: 410, y: 1278 };
  function halfMark(g, x, y, r, k) {
    if (k <= 0) return;
    g.save(); g.translate(x, y); g.scale(k, k);
    g.strokeStyle = INK; g.lineWidth = 5; g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.stroke();
    g.fillStyle = INK; g.beginPath(); g.arc(0, 0, r, 1.5708, 4.7124); g.closePath(); g.fill();
    g.restore();
  }
  function chartScene(g, t) {
    var E0 = S('chart').t0;
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { planBg(g, t, .3); return; }
    var x0 = CH.x0, y0 = CH.y0, x1 = CH.x1, y1 = CH.y1, ex = EXITING; if (t < E0 + .05) EXITING = true;
    var sin = eout(seg(t, E0 - .4, E0 + .1));
    g.save(); g.translate(0, 50 * (1 - sin));
    sheet(g, x0, y0, x1, y1, 5501, PAPER, 'chart');
    var cx0 = 600, cx1 = 896, hdr0 = y0 + 230, hdr1 = hdr0 + 150, r1 = hdr1, r2 = r1 + 112, r3 = r2 + 86;
    /* the column lights on "chart" (a highlighter wash, top to bottom) */
    var hk = eio(seg(t, K.chart - .05, K.chart + .35));
    if (hk > 0) { g.fillStyle = 'rgba(243,213,140,.75)'; g.fillRect(cx0, hdr0, cx1 - cx0, (r3 - hdr0) * hk); }
    g.strokeStyle = 'rgba(33,29,38,.55)'; g.lineWidth = 3;
    [hdr0, hdr1, r2, r3].forEach(function (y) { g.beginPath(); g.moveTo(x0 + 24, y); g.lineTo(cx1, y); g.stroke(); });
    g.beginPath(); g.moveTo(cx0, hdr0); g.lineTo(cx0, r3); g.stroke(); g.beginPath(); g.moveTo(cx1, hdr0); g.lineTo(cx1, r3); g.stroke();
    onprop(function () {
      txt(g, NSA.chartTitle, x0 + 24, y0 + 46, 46, INK, 'left', 900, DISP, x1 - x0 - 48, 1, 36, 'condensed');
      /* the legend, all three entries; "Does not prevent" has no icon, as on the NSA's sheet */
      txt(g, NSA.legend[0], x0 + 24, y0 + 104, 36, '#3d3833', 'left', 800, DISP, 760, 1, 36, 'condensed');
      txt(g, NSA.legend[1], x0 + 66, y0 + 148, 36, '#3d3833', 'left', 800, DISP, 330, 1, 36, 'condensed');
      txt(g, NSA.legend[2], x0 + 66, y0 + 192, 36, '#3d3833', 'left', 800, DISP, 380, 1, 36, 'condensed');
      txt(g, NSA.sideLabel, x0 + 24, hdr0 + 75, 36, '#3d3833', 'left', 900, DISP, cx0 - x0 - 40, 1, 32, 'condensed');
      NSA.column.forEach(function (L, i) { txt(g, L, (cx0 + cx1) / 2, hdr0 + 30 + i * 44, 42, INK, 'center', 900, DISP, cx1 - cx0 - 20, 1, 34, 'condensed'); });
      txt(g, NSA.rows[0][0], x0 + 24, r1 + 36, 44, INK, 'left', 900, DISP, cx0 - x0 - 40, 1, 36, 'condensed');
      txt(g, NSA.rows[0][1], x0 + 24, r1 + 80, 36, INK, 'left', 900, DISP, cx0 - x0 - 40, 1, 32, 'condensed');
      txt(g, NSA.rows[1][0], x0 + 24, r2 + 44, 44, INK, 'left', 900, DISP, cx0 - x0 - 40, 1, 36, 'condensed');
      txt(g, NSA.otherRows, x0 + 24, r3 + 40, 36, '#3d3833', 'left', 800, DISP, cx0 - x0 - 40, 1, 32, 'condensed');
      tag(g, 'RE-CREATED', x1 - 122, y1 - 38, 1, 0, 220, INK, PAPER, 30);
    });
    halfMark(g, x0 + 42, y0 + 148, 15, 1); g.fillStyle = INK; el(g, x0 + 42, y0 + 192, 16, 16);
    /* the two cells stay empty (no glyph) until "sometimes", then the half marks print */
    var mk = clamp(sp(t, K.sometimes, 4, .7), 0, 1.06);
    [r1 + 56, r2 + 43].forEach(function (cy) { halfMark(g, (cx0 + cx1) / 2, cy, 30, mk); });
    g.restore(); EXITING = ex;
    /* r1: the stamp's slot: an empty dashed outline in the lower third that SOMETIMES / PREVENTS prints into */
    var stx = stampTex(NSA.stamp, HOT, 100, 1), so = seg(t, K.sometimes, K.sometimes + .04), sa = seg(t, E0 - .2, E0 + .1) * (1 - so);
    if (sa > 0) { g.save(); g.globalAlpha *= sa; g.strokeStyle = 'rgba(244,237,224,.55)'; g.lineWidth = 5; g.setLineDash([16, 12]); g.translate(SLOT.x, SLOT.y); g.rotate(-.05); rr(g, -stx.w / 2 + 8, -stx.h / 2 + 8, stx.w - 16, stx.h - 16, 20); g.stroke(); g.setLineDash([]); g.restore(); }
    /* the hero: SOMETIMES / PREVENTS inks on "sometimes"; the slap in the pause punches it and inks it a second time;
       it peels just after "In", and the dip's caption waits until it has gone */
    var sOut = eio(seg(t, K.dip + .26, K.dip + .4));
    if (t >= K.sometimes && sOut < 1) {
      var pk = seg(t, K.TW - .02, K.TW + .1), pul = 1 + .08 * eout(pk) - .03 * Math.sin(Math.PI * seg(t, K.TW - .02, K.TW + .08)), exs = EXITING; if (sOut > 0) EXITING = true;
      g.save(); peelT(g, 140, 1400, sOut); g.translate(SLOT.x, SLOT.y); g.scale(pul, pul);
      onprop(function () { stamp(g, NSA.stamp, 0, 0, t, K.sometimes, 100, HOT, -.05); });
      if (t >= K.TW - .02 && t < K.TW + .3) { g.globalAlpha *= .5 * (1 - seg(t, K.TW + .05, K.TW + .3)); var oc = NOREC; NOREC = true; g.translate(3, 4); stamp(g, NSA.stamp, 0, 0, t, K.sometimes, 100, HOT, -.05); NOREC = oc; }
      g.restore(); EXITING = exs;
    }
    /* NSA CHART, on "chart", beside the slot */
    var co = eio(seg(t, K.dip + .26, K.dip + .4));
    if (co < 1) { var exc = EXITING; if (co > 0) EXITING = true; g.save(); peelT(g, 640, 1400, co); slapCard(g, NSA.stampCredit, 822, 1168, t, K.chart + .02, 46, 206); g.restore(); EXITING = exc; }
  }
  /* ---------- DIP → ANSWER: after a restart the bug comes back through the crack; the crack stays; the patch ---------- */
  var IN1 = [[880, 1152], [640, 1140], [CR.x + 26, CR.y + 18], [CR.x, CR.y], [HOME.x, HOME.y]];
  var IN2 = [[900, 1160], [660, 1146], [CR.x + 40, CR.y + 24]];
  function backScene(g, t) {
    var E0 = S('back').t0, C2 = E0 - .78, C3 = K.hrestart, C4 = K.ansRestart;
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { planBg(g, t, .3); return; }
    var ex = EXITING; if (t < E0 + .05) EXITING = true;
    phoneUnit(g, t, [C2, C3, C4], { crack: 1 });
    EXITING = ex;
    /* the bug: crawls back from outside, in through the crack (on "may"), settles on "reinfected" */
    var k1 = sio(seg(t, K.kasp, K.reinf + .25));
    if (t >= K.kasp - .3 && t < C3) {
      var p = along(IN1, k1), walk = k1 < 1 ? 1 : .25, ent = seg(t, K.kasp - .3, K.kasp);
      bug(g, p.x + (1 - ent) * 60, p.y, lerp(.9, 1.2, seg(k1, .4, .8)), k1 < 1 ? p.rot : .2 * Math.sin(t * 1.4), t, walk, ent);
    }
    /* power cycle 3 on "restart": it tears it off again... */
    if (t >= C3) bugFall(g, HOME.x, HOME.y, t, C3, -1);
    /* ...and it heads straight back for the crack; the patch on "can" stops it and it tumbles away */
    var k2 = sio(seg(t, K.holeW + .05, K.PT));
    if (t >= K.holeW - .2 && t < K.PT) { var q = along(IN2, k2), e2 = seg(t, K.holeW - .2, K.holeW + .1); bug(g, q.x + (1 - e2) * 60, q.y, .95, q.rot, t, 1, e2); }
    if (t >= K.PT) { var b = IN2[2], kb = seg(t, K.PT, K.PT + .68); if (kb < 1) bug(g, b[0] + 150 * kb, b[1] - 40 * Math.sin(Math.PI * seg(kb, 0, .35)) + 420 * kb * kb, .95, 1.2 + 3 * kb, t, .2, 1 - seg(kb, .5, 1)); }
    patch(g, t, K.PT);   /* r1: the patch lands on the slap, in the gap after "can." */
    kasCard(g, t, E0, seg(t, K.ans - .1, K.ans + .16));
    /* Kaspersky's words, on "may" */
    var qa = seg(t, K.may - .02, K.may + .1), qo = seg(t, K.holeW + .08, K.holeW + .36);
    if (qa > 0 && qo < 1) qplate(g, 104, 1228, 812, ['“…MAY BE REINFECTED', 'AFTER REBOOTING.”'], 50, ['KASPERSKY · JUNE 2023'], 5411, qa, qo, false, 44);
    /* THE WAY IN, beside the crack, on "hole" (a marker ring round the crack) */
    var wo = eio(seg(t, K.apple + .25, K.apple + .45));
    if (t >= K.holeW - .08 && wo < 1) {
      var mr = eio(seg(t, K.holeW - .08, K.holeW + .3));
      g.save(); g.globalAlpha *= 1 - wo; g.strokeStyle = HL; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.arc(CR.x, CR.y, 44, -1.2, -1.2 + 6.1 * mr); g.stroke();
      g.strokeStyle = CREAM; g.lineWidth = 5; g.beginPath(); g.moveTo(600, 1046); g.lineTo(600 - 110 * mr, 1046 + 44 * mr); g.stroke(); g.restore();
      var exw = EXITING; if (wo > 0) EXITING = true; g.save(); peelT(g, 600, 1060, wo);
      var hp = .05 * Math.sin(Math.PI * seg(t, K.HL - .02, K.HL + .16)); g.translate(730, 1030); g.scale(1 + hp, 1 + hp); g.translate(-730, -1030);
      slapCard(g, 'THE WAY IN', 730, 1030, t, K.holeW, 52, 340); g.restore(); EXITING = exw;
    }
    /* UPDATE on "update"; its check mark on "update it" */
    if (t >= K.updW - .08) {
      slapCard(g, 'UPDATE', 690, 922, t, K.updW, 64, 330);
      var ck = eio(seg(t, K.ansUpd, K.ansUpd + .25));
      if (ck > 0) { g.save(); g.strokeStyle = HL; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(838, 922); g.lineTo(838 + 20 * Math.min(1, ck * 2), 922 + 22 * Math.min(1, ck * 2)); if (ck > .5) g.lineTo(858 + 40 * (ck - .5) * 2, 944 - 54 * (ck - .5) * 2); g.stroke(); g.restore(); }
    }
    /* NSA, on "weekly" (the answer's second half is the NSA's own bullet) */
    /* r1: the answer is two ticks: UPDATE ✓ (above) and RESTART WEEKLY ✓ · NSA, on "restart" */
    if (t >= K.ansRestart - .08) {
      slapCard(g, 'RESTART WEEKLY', 688, 1044, t, K.ansRestart, 52, 384);
      var ck2 = eio(seg(t, K.ansWeekly, K.ansWeekly + .25));
      if (ck2 > 0) { g.save(); g.strokeStyle = HL; g.lineWidth = 14; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(884, 1044); g.lineTo(884 + 14 * Math.min(1, ck2 * 2), 1044 + 18 * Math.min(1, ck2 * 2)); if (ck2 > .5) g.lineTo(898 + 24 * (ck2 - .5) * 2, 1062 - 46 * (ck2 - .5) * 2); g.stroke(); g.restore(); }
      if (t >= K.ansRestart - .02) { g.fillStyle = CREAM; el(g, 560, 1124, 6, 6); slapCard(g, NSA.org, 620, 1124, t, K.ansRestart + .06, 44, 160); }
    }
    /* Apple's card (Apple's credit lives only here): iOS 16.5.1 on "Apple", the date on "June" */
    var aa = seg(t, K.updW - .04, K.updW + .08), ao = eio(seg(t, K.ans - .1, K.ans + .16));
    if (aa > 0 && ao < 1) {
      var x0 = 104, y0 = 1194, w = 812, h = 230, exa = EXITING; if (aa < 1 || ao > 0) EXITING = true;
      g.save(); if (ao > 0) peelT(g, 104, 1424, ao); g.translate(110 * (1 - eout(aa)), 0); g.globalAlpha *= aa;
      sheet(g, x0, y0, x0 + w, y0 + h, 5601, PAPER, 'apple card');
      onprop(function () {
        txt(g, 'iOS 16.5.1', x0 + 28, y0 + 46, 56, INK, 'left', 900, DISP, 360, 1, 40, 'condensed');
        txt(g, 'FIXED: ONE KERNEL FLAW', x0 + 28, y0 + 104, 44, INK, 'left', 900, DISP, 460, 1, 36, 'condensed');
        txt(g, 'CVE-2023-32434', x0 + w - 28, y0 + 104, 36, '#4b4540', 'right', 700, MONO, 300, 1, 30);
        txt(g, 'CREDIT: KASPERSKY', x0 + 28, y0 + 156, 40, INK, 'left', 900, DISP, w - 56, 1, 36, 'condensed');
        txt(g, 'APPLE SECURITY NOTES', x0 + 28, y0 + 202, 34, '#5d564c', 'left', 800, DISP, 400, 1, 30, 'condensed');
        var jp = Math.sin(Math.PI * seg(t, K.june - .06, K.june + .3));   /* r2 polish: the date pulses on "June" */
        if (t >= K.updW + .02) { g.save(); g.translate(x0 + w - 170, y0 + 46); g.scale(1 + .14 * jp, 1 + .14 * jp); g.rotate(-.04 * jp); g.translate(-(x0 + w - 170), -(y0 + 46)); slapCard(g, 'JUNE 21, 2023', x0 + w - 170, y0 + 46, t, K.updW + .1, 46, 300); g.restore(); }
        /* r2 polish: on "fixed" a highlighter runs under FIXED: ONE KERNEL FLAW */
        var fx = eio(seg(t, K.fixedW - .04, K.fixedW + .45)); if (fx > 0) { g.save(); g.strokeStyle = HL; g.globalAlpha *= .9; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0 + 28, y0 + 128); g.lineTo(x0 + 28 + 420 * fx, y0 + 127); g.stroke(); g.restore(); }
        /* r2 polish: on "June" a highlighter stroke runs under the date */
        var ju = eio(seg(t, K.june - .1, K.june + .5)); if (ju > 0) { g.save(); g.strokeStyle = HL; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0 + w - 300, y0 + 80); g.lineTo(x0 + w - 300 + 262 * ju, y0 + 80 - 3 * ju); g.stroke(); g.restore(); }
      });
      g.restore(); EXITING = exa;
    }
  }
  /* ---------- SAMSUNG: the re-created settings path, ending on a chevron (no switch drawn) ---------- */
  var SROWS = ['Settings', 'Device care', 'Auto optimization', 'Auto restart', 'Restart on schedule'];
  function samsungScene(g, t) {
    var E0 = S('samsung').t0;
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { planBg(g, t, .35); return; }
    var x0 = 104, y0 = 470, w = 812, h = 780, ka = eout(seg(t, E0 - .38, E0 - .08)), ex = EXITING; if (ka < 1) EXITING = true;
    var push = 1 + .03 * sio(seg(t, E0, S('end').t0)), pk = .03 * Math.sin(Math.PI * seg(t, K.SM - .02, K.SM + .16));
    g.save(); g.translate(0, 80 * (1 - ka)); g.translate(510, 860); g.scale(push, push); g.translate(-510, -860);
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 10, y0 + 14, w, h, 40); g.fill();
    g.fillStyle = SCR; rr(g, x0, y0, w, h, 40); g.fill(); rr(g, x0, y0, w, h, 40); grainIn(g, x0, y0, w, h, 5701, .6);
    prop(g, 'settings card', x0, y0, x0 + w, y0 + h);
    onprop(function () {
      font(g, 42, 900, DISP, 'condensed'); var hw = g.measureText('SAMSUNG GALAXY').width + 28;
      chip(g, 'SAMSUNG GALAXY', x0 + 30 + hw / 2, y0 + 54, { px: 42, wt: 900, st: 'condensed', bg: INK, fg: CREAM, r: 12, shadow: false, pad: 14 });
      tag(g, 'RE-CREATED', x0 + w - 130, y0 + 54, 1, 0, 230, INK, SCR, 30);
      txt(g, 'SAMSUNG US SUPPORT', x0 + w - 34, y0 + h - 34, 32, '#6b6457', 'right', 800, DISP, 400, 1, 30, 'condensed');
    });
    /* the cursor walks down the path, one row per word; the last row lights on "schedule" */
    var WT = [K.galaxy, K.phonesS, K.canS, K.restartS, K.schedule];
    SROWS.forEach(function (lab, i) {
      var ry = y0 + 108 + i * 112, a = seg(t, E0 - .36 + i * .03, E0 - .26 + i * .03); if (a <= 0) return;
      var on = tq(t) >= WT[i] - .03 ? 1 : 0, last = i === SROWS.length - 1, lit = last ? eout(seg(tq(t), K.schedule - .03, K.schedule + .17)) : 0;
      var cur = !last && on && tq(t) < (WT[i + 1] - .03) ? 1 : 0, ps = last ? 1 + pk : 1;
      g.save(); g.globalAlpha *= a; g.translate(30 * (1 - a), 0); g.translate(x0 + w / 2, ry + 42); g.scale(ps, ps); g.translate(-(x0 + w / 2), -(ry + 42));
      g.fillStyle = last ? mixc(hex('#f8f4ec'), hex(HL), lit) : cur ? '#efe3c4' : '#f8f4ec'; rr(g, x0 + 26, ry, w - 52, 84, 22); g.fill();
      if (on && !last) { g.fillStyle = '#8f8574'; el(g, x0 + 50, ry + 42, 7, 7); }
      onprop(function () {
        txt(g, lab, x0 + 70, ry + 44, 48, INK, 'left', 900, DISP, w - 190, 1, 36, 'condensed');
        txt(g, '›', x0 + w - 66, ry + 40, 62, '#6b6457', 'center', 900, DISP, 0, 1, 36);
      });
      g.restore();
    });
    g.restore(); EXITING = ex;
    var fa = seg(t, E0 - .3, E0 - .2);
    txt(g, '“MENU NAMES… MAY VARY…”', 510, 1330, 40, CREAM, 'center', 900, DISP, 800, fa, 36, 'condensed');
  }
  /* ---------- THE END CARD: frame 0's button, YES / NO, then the glide back into frame 0 ---------- */
  function endScene(g, t) {
    var tt = t - TEND + 1 / 30, gl = eio(seg(t, TEND - .22, TEND - 1 / 30));
    var p = f0(1 / 60), x = lerp(510, p.x, gl), y = lerp(930, p.y, gl), r = lerp(356, p.r, gl), rot = lerp(0, p.rot, gl);
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { planBg(g, tt, 0); pulses(g, x, y, r, tt, 1); return; }
    var exw = EXITING; if (gl > 0) EXITING = true;
    title0(g);
    powerBtn(g, x, y, r, { sweep: tt * .55, rot: rot });
    /* the bug is back: it crawls onto the button on "Did you restart this week?" and sits where frame 0 has it */
    var bb = bugOnBtn(x, y, r), kc2 = sio(seg(t, K.end, K.weekE + .1)), bx = lerp(980, bb.x, kc2), by = lerp(1330, bb.y, kc2);
    bug(g, bx, by, bb.s, kc2 < 1 ? lerp(-.9, bb.rot, kc2) : bb.rot + .12 * Math.sin(tt * 2.2), tt, kc2 < 1 ? 1 : .3, seg(t, K.end - .1, K.end + .15));
    EXITING = exw;
    var yo = eio(seg(t, TEND - .2, TEND - .06));
    [['YES', 330], ['NO', 690]].forEach(function (cc) {
      var tq0 = cc[0] === 'YES' ? K.yesE : K.noE, tp = Math.sin(Math.PI * seg(t, tq0 - .03, tq0 + .15)), kc = eout(seg(t, K.thisE - .16, K.thisE + .02)), sc = lerp(1.08, 1, kc) * (1 - .07 * tp) * (1 - yo);
      if (sc <= .01 || kc <= 0) return;
      var oc = ONPROP, ex0 = EXITING; ONPROP = true; EXITING = ex0 || yo > 0 || kc < 1;
      chip(g, cc[0], cc[1], 1190 + 8 * tp + 6 * Math.sin(t * 4.2 + (cc[0] === 'YES' ? 0 : 2.1)) * kc, { px: 112, wt: 900, bg: BG, line: CREAM, lw: 8, fg: CREAM, w: 250, h: 160, r: 54, shadow: true, a: kc * (1 - seg(yo, .5, .9)), s: sc, maxw: 250 });
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
  var CAPGROUPS = { hook: [[2, 3]], ask: [[4, 4]], quote: [[3], [3, 4]], why: [[1], [3, 3]], wipe: [[4, 3]], twist: [[3, 3], [1]], dip: [[2], [2, 2], [3]], hole: [[3, 3]], update: [[3], [2, 3]], answer: [[3, 3]], samsung: [[3], [2, 3]], end: [[5], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', 'NSA'], ['ask', 'week?'], ['quote', 'power'], ['why', 'survive'], ['wipe', 'wipe'], ['twist', 'sometimes.'], ['dip', 'reinfected.'], ['hole', 'hole.'], ['update', 'update'], ['answer', 'restart'], ['samsung', 'schedule.'], ['end', 'week?']]
    .map(function (p) { return at(p[0], p[1]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var CAPPX = 52, CAPMIN = 1e9;
  /* r1: the dip's first card waits until the SOMETIMES stamp has peeled (they never share a frame) */
  function capStart(c) { return Math.abs(c.t0 - K.dip) < .01 ? K.dip + .44 : c.t0 - .04; }
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= capStart(c)) { card0 = c; ci = i; } });
    if (!card0) return;
    var s = capStart(card0), nx = CAPS[ci + 1], ns = nx ? capStart(nx) : 1e9;
    var keep = nx && ns - card0.t1 < 2.4;
    var o1 = !nx ? Math.min(card0.t1 + .3, TEND - .08) : keep ? ns - .04 : Math.min(card0.t1 + .5, ns - .04), o0 = o1 - .1;   /* the last card holds to the cut */
    /* r2 polish: a card never rides over the next scene's tear; it is gone as the tear starts */
    SC.forEach(function (Sc) { var tr = Sc.t0 - (Sc.tw || 0); if (tr > s + .3 && tr < ns && tr + .06 < o1) { o1 = tr + .06; o0 = o1 - .1; } });
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
        var w = words[i], nw = words[i + 1], tf = tq(t), cur = stressed(w) && tf >= w.t0 - .03 && tf < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9) + .2;
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
  var NOISE, SCENES = { buttonScene: buttonScene, phoneScene: phoneScene, chartScene: chartScene, backScene: backScene, samsungScene: samsungScene, endScene: endScene };
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
    g.fillText('The NSA says restart weekly.', CX, 310);
    var b = 'Its chart: sometimes.', bp = 62, by = 392; font(g, bp, 800, DISP, 'expanded');
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
  var GAIN = { hk: .12, sb: .1, qt: .1, wy: .08, rp: .1, tw: .018, hl: .12, pt: .06, an: .1, sm: .1 };
  var TYPE = { hk: 'tick', sb: 'tick', qt: 'tick', wy: 'pop', rp: 'tear', tw: 'thump', hl: 'click', pt: 'slap', an: 'tick', sm: 'tick' };
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
    /* the tag's sound: two short dry pips (2.1 and 2.8 kHz), no ring-out (a ringing hit makes Whisper invent words) */
    function chirpS(t, g) { g = g || 1; [[2100, 0], [2800, .075]].forEach(function (p) { var t0 = t + p[1]; osc('sine', p[0], t0, t0 + .06, 1, [[t0, 0], [t0 + .003, .3 * g], [t0 + .045, .18 * g], [t0 + .06, 0]], 0); }); band(t, .02, 2400, 2, 1.2 * g, .001, 0); }
    function popS(t, g) { g = g || 1; var o = osc('sine', 520, t, t + .1, 1, [[t, 0], [t + .003, .4 * g], [t + .09, 0]], .02); o.frequency.exponentialRampToValueAtTime(260, t + .09); paperHit(t, g * .9); }
    EV.forEach(function (e) {
      if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'chirp') chirpS(e.t, e.g);
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
  /* the hero hold: SOME-TIMES, from "sometimes" to "In 2023" */
  var HOLD = { t0: K.sometimes, t1: K.dip };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((K.TW + .3) * 30) / 30 + 1 / 60, SLUG: 'restartphone', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
