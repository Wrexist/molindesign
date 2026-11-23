/* "Don't put your iPhone in rice." — Factory #40 (rice) on Tech, explained, after ../restartphone/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   All cut paper over a dim tiled kitchen wall: a big paper bowl of rice with a coral rim is the thread. Apple's support
   page (re-created), a generic phone (Dynamic Island-style pill, no logo), its port 610 px wide with a big grain cracking into it, a
   plug that never seats, a plain cream block labelled YOUR HAND, a shelf with airflow, a clock with no numerals, Apple's
   Liquid Detected alert (re-created). No people, no hands. Props stay whole inside x 92–928, y 302–1428. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#121821', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f3ecdf', INK = '#211d26';
  var SLATE = '#3a4452', SLATE2 = '#2e3744';
  var TAGC = '#efe7d4', TAGE = '#d6cbb2', SCR = '#ece5d8', HL = '#f3d58c', SCRW = '#f8f4ec';
  var BOWL = '#2f4b5e', BOWL2 = '#3d5f75', BOWL3 = '#24394a', WATER = '#9fd0ee', WATER2 = '#e6f4fc', RUST = '#a4532a', GOLD = '#d8b25c', KRAFT = '#c9a46a';
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
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }   /* a displayed state follows the frame the renderer samples */
  function frac(x) { return x - Math.floor(x); }

  /* ---------- the voice is the timeline ---------- */
  /* Whisper's aligner pins phrase starts and ends up to 0.2 s off (it read "Liquid" 0.19 s late); every word that opens
     or closes a phrase is snapped to the voice track's own energy (VOICED, −40 dB of its loudest 10 ms, from heard.js) */
  var VAD = (window.VOICED || []).map(function (v) { return { t0: v.t0, t1: v.t1 }; });
  function snap(t, key) { var best = t, bd = .3; VAD.forEach(function (v) { var d = Math.abs(v[key] - t); if (d < bd) { bd = d; best = v[key]; } }); return best; }
  var LINE = {}; VO.lines.forEach(function (l) {
    var ws = l.words.map(function (w) { return { w: w.w, t0: w.t0, t1: w.t1 }; });
    ws.forEach(function (w, i) {
      if (i === 0 || /[.,?:!;]$/.test(ws[i - 1].w)) w.t0 = snap(w.t0, 't0');
      if (i === ws.length - 1 || /[.,?:!;]$/.test(w.w)) w.t1 = Math.max(w.t0 + .06, snap(w.t1, 't1'));
    });
    l.words = ws; l.t0 = ws[0].t0; LINE[l.id] = l;
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
  var EDGES = (window.HEARD_EDGES || []).slice(), VOICED = VAD.map(function (v) { return { t0: v.t0, t1: v.t1 }; });
  var lastE = EDGES.length ? Math.max.apply(null, EDGES) : -1;
  VO.lines.forEach(function (l) { if (l.t0 > lastE + .3) l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 + .15 }); EDGES.push(w.t0, w.t1 + .15); }); });
  var BODY = { thump: .2, knock: .14, slap: .1, paper: .17, pop: .12, tick: .05, click: .06, swish: .21, tear: .15, pour: .2 };
  var GT = {};
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }
  /* =====================================================================================================
     APPLE'S STRINGS (one block, so a correction is one edit). Apple Support 102643, "If you see a liquid-detection
     alert on your iPhone", Published Date: October 30, 2024 (read by curl 2026-11-23, BRIEF.md §3):
       "Here are a few things not to do: Don't dry your iPhone using an external heat source or compressed air. Don't
        insert a foreign object, such as a cotton swab or a paper towel, into the connector. Don't put your iPhone in a
        bag of rice. Doing so could allow small particles of rice to damage your iPhone."
       "…the pins on the connector or cable can corrode and cause permanent damage…"
       "Leave your iPhone in a dry area with some airflow." · "It might take up to 24 hours to fully dry."
       scope: "…iPhone XS, iPhone XS Max, iPhone XR, or later…" · alert name: "Liquid Detected"
     ===================================================================================================== */
  var APPLE = {
    who: 'APPLE SUPPORT', date: 'OCT 30, 2024', credit: 'APPLE SUPPORT · OCT 30, 2024',
    title: ['IF YOU SEE A LIQUID-DETECTION', 'ALERT ON YOUR iPHONE'],
    head: '“…A FEW THINGS NOT TO DO:”',
    rows: ['EXTERNAL HEAT · COMPRESSED AIR', 'COTTON SWAB · PAPER TOWEL', 'BAG OF RICE'], row2sub: 'INTO THE CONNECTOR',
    rice: ['“…COULD ALLOW SMALL', 'PARTICLES OF RICE TO', 'DAMAGE YOUR iPHONE.”'],
    corrode: ['“…THE PINS…', 'CAN CORRODE…”'],
    air: ['“LEAVE YOUR iPHONE', 'IN A DRY AREA WITH', 'SOME AIRFLOW.”'],
    day: ['“IT MIGHT TAKE', 'UP TO 24 HOURS', 'TO FULLY DRY.”'],
    alert: ['Liquid', 'Detected'], alertSmall: 'Liquid Detected',
    scope: ['iPHONE XS,', 'XS MAX, XR', 'OR LATER'],
    stamp: 'COULD\nDAMAGE IT'
  };
  var K = {
    hook: start('hook'), dont: at('hook', "Don't"), riceH: at('hook', 'rice.'), hookEnd: lend('hook'),
    bel: start('belief'), wet: at('belief', 'wet'), classic: at('belief', 'Classic'), belEnd: lend('belief'),
    ask: start('ask'), apple: at('ask', 'Apple'), no: at('ask', 'no?'), askEnd: lend('ask'),
    page: start('page'), pageW: at('page', 'page'), lists: at('page', 'lists'), notW: at('page', 'not'), pageEnd: lend('page'),
    list: start('list'), heat: at('list', 'heat.'), no2: at('list', 'No', 1), cotton: at('list', 'cotton'), swabs: at('list', 'swabs.'), listEnd: lend('list'),
    rice: start('rice'), noR: at('rice', 'no'), bag: at('rice', 'bag'), riceW: at('rice', 'rice.'), riceEnd: lend('rice'),
    twist: start('twist'), bits: at('twist', 'bits'), could: at('twist', 'could'), damage: at('twist', 'damage'), twEnd: lend('twist'),
    dip: start('dip'), charging: at('dip', 'charging'), wetD: at('dip', 'wet'), canD: at('dip', 'can'), corrode: at('dip', 'corrode'), pins: at('dip', 'pins.'), dipEnd: lend('dip'),
    tap: start('tap'), gently: at('tap', 'gently'), hand: at('tap', 'hand,'), port: at('tap', 'port'), down: at('tap', 'down.'), tapEnd: lend('tap'),
    air: start('air'), dry: at('air', 'dry,'), airflow: at('air', 'airflow.'), airEnd: lend('air'),
    day: start('day'), up: at('day', 'up'), dayW: at('day', 'day.'), dayEnd: lend('day'),
    chk: start('check'), charge: at('check', 'charge'), later: at('check', 'later.'), laterEnd: wend('check', 'later.'), liquid: at('check', 'Liquid'), still: at('check', 'Still'), chkEnd: lend('check'),
    end: start('end'), riceE: at('end', 'rice?'), yesE: at('end', 'Yes'), noE: at('end', 'no.'), noEnd: wend('end', 'no.')
  };
  (function () {
    place('hk', 'pour', K.hookEnd + .3, .2, K.hookEnd, K.bel);       /* grains rattle into the bowl */
    place('cf', 'tick', K.belEnd + .3, .2, K.belEnd, K.ask);         /* THE CLASSIC FIX? pressed */
    place('wn', 'tick', K.askEnd + .3, .2, K.askEnd, K.page);        /* WHY NOT? pressed */
    place('pg', 'tick', K.pageEnd + .3, .2, K.pageEnd, K.list);      /* the page's date pressed */
    place('bg', 'slap', K.riceEnd + .3, .2, K.riceEnd, K.twist - .45);  /* the rice bag struck */
    place('tw', 'thump', K.twEnd + .3, .2, K.twEnd, K.dip);          /* COULD DAMAGE IT, the hero stamp, punched */
    place('rs', 'click', K.dipEnd + .3, .2, K.dipEnd, K.tap - .4);   /* the rust sets */
    place('tk', 'knock', K.tapEnd + .3, .2, K.tapEnd, K.air);        /* the third tap */
    place('ar', 'tick', K.airEnd + .3, .2, K.airEnd, K.day);         /* the airflow clipping pressed */
    place('ck', 'tick', K.dayEnd + .3, .2, K.dayEnd, K.chk - .4);    /* the clock's sweep closes */
    place('pl', 'pop', K.chkEnd + .3, .2, K.chkEnd, K.end - .4);     /* the plug pulls out */
  })();
  function gt(n, d) { return GT[n] != null ? GT[n] : d; }
  K.HK = gt('hk', K.hookEnd + .3); K.CF = gt('cf', K.belEnd + .3); K.WN = gt('wn', K.askEnd + .3); K.PG = gt('pg', K.pageEnd + .3);
  K.BG = gt('bg', K.riceEnd + .3); K.TW = gt('tw', K.twEnd + .3); K.RS = gt('rs', K.dipEnd + .3); K.TK = gt('tk', K.tapEnd + .3);
  K.AR = gt('ar', K.airEnd + .3); K.CK = gt('ck', K.dayEnd + .3); K.PL = gt('pl', K.chkEnd + .3);
  var SC = [
    { id: 'bowl', fn: 'bowlScene', name: 'Don’t put your iPhone in rice', t0: 0 },
    { id: 'port', fn: 'portScene', name: 'Tiny rice bits could damage it', t0: K.twist - .03, tw: .2 },   /* the tear is done before "Tiny" */
    { id: 'dry', fn: 'dryScene', name: 'Tap it, air it, wait', t0: K.tap + .72, tw: .3, dir: -1 },   /* the corrode lines print on "corrode" and need 2.3 s */
    { id: 'check', fn: 'checkScene', name: 'Check yours', t0: K.chk + .2, tw: .3 },
    { id: 'end', fn: 'endScene', name: 'Ever put a phone in rice?', t0: K.end + .25, tw: .35, dir: -1 }   /* the tear starts about 35.3 s: the question plays over the bowl */
  ];
  var SHOTS;
  var TEND = Math.round(DUR * 30) / 30;                    /* frame 0 of the next loop sits at TEND */
  var POUR_P = TEND / Math.round(TEND / 1.15);             /* the grain stream repeats a whole number of times per loop */
  var PGP = TEND / Math.round(TEND / .95);                 /* the big grain sliding into the port: also whole cycles per loop */

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
    if (b[2] < SAFE_BOX.x0 || b[0] > SAFE_BOX.x1 || b[1] > SAFE_BOX.y1 || b[3] < SAFE_BOX.y0) return;
    if (b[0] < SAFE.x0 - .5 || b[2] > SAFE.x1 + .5 || b[3] > SAFE.y1 + .5) BOUNDS.push({ t: CURT, text: text, x0: Math.round(b[0]), x1: Math.round(b[2]), y1: Math.round(b[3]) });
  }
  function recBox(g, x0, y0, x1, y1, text) { if (BOUNDS) recBound(g, xbox(g, x0, y0, x1, y1), text); }
  var NOMEASURE = { cable: 1, 'falling phone': 1, 'phone in rice': 1 };   /* the cable runs off the frame's foot on purpose; the end card's phone drops in from above */
  function prop(g, name, x0, y0, x1, y1) {
    if (!PROPS || EXITING || (g !== ctx && g !== tctx) || NOMEASURE[name]) return;
    var m = g.getTransform();
    if (Math.abs(m.b) > .01) { for (var i = 0; i < 12; i++) PROPS.push({ name: name, b: xbox(g, lerp(x0, x1, i / 12), y0, lerp(x0, x1, (i + 1) / 12), y1) }); return; }
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
  function txt(g, text, x, y, px, col, align, wt, fam, maxw, a, minpx, st) {
    a = a == null ? 1 : a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, wt || 900, fam, st); ls(g, 0);
    while (maxw && g.measureText(text).width > maxw && px > (minpx || 36)) { px -= 2; font(g, px, wt || 900, fam, st); }
    g.fillStyle = col || CREAM; g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillText(text, x, y); g.restore();
  }
  function tw(g, text, px, wt, st) { font(g, px, wt || 900, DISP, st || 'condensed'); return g.measureText(text).width; }
  /* quiet tags (RE-CREATED): an outline, never coral, ≥ 36 px */
  function tag(g, text, x, y, a, rot, maxw, col, bg, px) { chip(g, text, x, y, { px: px || 36, wt: 700, fam: MONO, line: col || CREAM, lw: 3, fg: col || CREAM, a: a, rot: rot == null ? .01 : rot, shadow: false, bg: bg || 'rgba(16,22,28,.9)', maxw: maxw || 820 }); }
  function onprop(fn) { var o = ONPROP; ONPROP = true; fn(); ONPROP = o; }
  function peelT(g, x0, y1, eo) { g.translate(x0, y1); g.rotate(-.08 * eo); g.translate(-x0, -y1); g.translate(-70 * eo, 50 * eo); g.globalAlpha *= 1 - eo; }

  /* ---------- the rubber stamp: worn ink (seeded speckle), slammed; condensed caps ---------- */
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
     PAPER
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
  /* a clipping of Apple's page: opaque paper, the quote line by line, APPLE SUPPORT · OCT 30, 2024, RE-CREATED;
     `inn` slides it in from the right, `out` peels it off to the left (it lifts, tilts and drops) */
  function qplate(g, x0, y0, w, lines, px, credit, seed, inn, out) {
    if (inn <= 0 || out >= 1) return;
    var ex0 = EXITING, lh = px * 1.12, h = 26 + lines.length * lh + 58;
    var ei = eout(clamp(inn, 0, 1)), eo = eio(clamp(out, 0, 1));
    g.save();
    if (ei < 1) { g.translate(110 * (1 - ei), 0); g.globalAlpha *= seg(ei, 0, .7); EXITING = true; }
    if (eo > 0) { EXITING = true; g.translate(x0, y0 + h); g.rotate(-.08 * eo); g.translate(-x0, -(y0 + h)); g.translate(-60 * eo, 50 * eo); g.globalAlpha *= 1 - eo; }
    sheet(g, x0, y0, x0 + w, y0 + h, seed, PAPER, 'clipping');
    onprop(function () {
      lines.forEach(function (L, i) { txt(g, L, x0 + 28, y0 + 20 + lh * (i + .5), px, INK, 'left', 900, DISP, w - 56, 1, 40, 'condensed'); });
      txt(g, credit, x0 + 28, y0 + h - 32, 36, '#5d564c', 'left', 800, DISP, w - 300, 1, 36, 'condensed');
      tag(g, 'RE-CREATED', x0 + w - 132, y0 + h - 34, 1, 0, 240, INK, PAPER, 36);
    });
    EXITING = ex0; g.restore();
    return h;
  }
  function slapCard(g, text, x, y, t, t0, px, maxw, dark) {
    if (t < t0 - .08) return;
    var k = eout(seg(t, t0 - .08, t0)), sc = lerp(1.3, 1, k), ex = EXITING; if (k < 1) EXITING = true;
    chip(g, text, x, y - 20 * (1 - k), { px: px || 52, wt: 900, bg: dark ? INK : CREAM, fg: dark ? CREAM : INK, line: dark ? CREAM : null, lw: 4, r: 16, st: 'condensed', rot: .015, s: sc, a: seg(t, t0 - .08, t0 - .05), maxw: maxw || 820 });
    EXITING = ex;
  }
  /* a slapped card that peels off later and pulses on a hit */
  function card(g, text, x, y, t, t0, t1, px, maxw, hit, dark) {
    if (t < t0 - .08) return;
    var eo = t1 == null ? 0 : eio(seg(t, t1, t1 + .16)); if (eo >= 1) return;
    var ex = EXITING; if (eo > 0) EXITING = true;
    g.save(); peelT(g, x - 150, y + 40, eo);
    if (hit != null) { var pk = .05 * Math.sin(Math.PI * seg(t, hit - .02, hit + .16)); g.translate(x, y); g.scale(1 + pk, 1 + pk); g.translate(-x, -y); }
    slapCard(g, text, x, y, t, t0, px, maxw, dark);
    g.restore(); EXITING = ex;
  }

  /* ---------- the wallpaper: a dim tiled kitchen wall (subway tiles), drifting slowly ---------- */
  var TL = null;
  function wallBg(g, ct, dim) {
    g.fillStyle = '#0f151d'; g.fillRect(-400, -300, W + 800, H + 600);
    if (!TL) { var r = mulberry(411); TL = []; for (var gy = -1; gy < 24; gy++) for (var gx = -1; gx < 8; gx++) TL.push([gx * 164 + (gy % 2 ? 82 : 0) + r() * 4, gy * 96 + r() * 4, 154, 86, r()]); }
    g.save(); g.translate(-60 + 4 * Math.sin(ct * .21), -40 + 3 * ct);
    TL.forEach(function (b) {
      g.fillStyle = b[4] < .08 ? '#1c2832' : '#162029'; rr(g, b[0], b[1], b[2], b[3], 10); g.fill();
      g.fillStyle = 'rgba(244,237,224,.045)'; rr(g, b[0] + 10, b[1] + 8, b[2] - 60, 10, 5); g.fill();
    });
    g.restore();
    if (dim) { g.fillStyle = 'rgba(10,14,20,' + dim + ')'; g.fillRect(-400, -300, W + 800, H + 600); }
  }

  /* =====================================================================================================
     RICE: one grain, the stream, the mound (cached), the bowl
     ===================================================================================================== */
  var GC = ['#f6eedd', '#efe4cc', '#e8dcc2', '#fbf5e8'];
  function grain(g, x, y, rot, s, col) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = 'rgba(70,52,30,.35)'; el(g, 1.2, 2, 10, 4.8);
    g.fillStyle = col || GC[0]; el(g, 0, 0, 10, 4.6);
    g.fillStyle = 'rgba(255,255,255,.5)'; el(g, -2.5, -1.4, 4.5, 1.4);
    g.restore();
  }
  /* the mound: back dome and the front band that hides the phone's foot; local coords, rim centre at 0,0 */
  var MOUND = null;
  function domeY(x) { var u = clamp(Math.abs(x) / 392, 0, 1); return -118 * Math.pow(1 - u * u, .75); }
  function rimFront(x) { var u = clamp(Math.abs(x) / 400, 0, 1); return 44 * Math.sqrt(1 - u * u); }
  function frontY(x) { return -64 + 5 * Math.sin(x * .07) + 4 * Math.sin(x * .19 + 1); }
  function mkMound() {
    function layer(seed, inside, top, n) {
      var c = mk(840, 240), g = c.getContext('2d'), r = mulberry(seed);
      g.translate(420, 170);
      g.beginPath(); for (var x = -396; x <= 396; x += 6) g.lineTo(x, top(x)); for (x = 396; x >= -396; x -= 6) g.lineTo(x, rimFront(x) - 2); g.closePath();
      g.fillStyle = '#e2d3b4'; g.fill(); g.save(); g.clip();
      for (var i = 0; i < n; i++) { var gx = (r() * 2 - 1) * 400, gy = -130 + r() * 180; if (!inside(gx, gy)) { i--; continue; } grain(g, gx, gy, r() * 6.283, .85 + r() * .35, GC[Math.floor(r() * 4)]); }
      g.restore();
      return c;
    }
    var back = layer(901, function (x, y) { return y > domeY(x) - 6 && y < rimFront(x) + 4; }, domeY, 1500);
    var front = layer(902, function (x, y) { return Math.abs(x) < 250 && y > frontY(x) - 6; }, function (x) { return Math.abs(x) < 250 ? frontY(x) : rimFront(x) - 2; }, 700);
    MOUND = { back: back, front: front };
  }
  /* the stream of falling grains: periodic over the loop; local coords (x at fall, from yTop to the mound at yBot) */
  function stream(g, t, x, yTop, yBot, a, dens) {
    if (a <= 0) return;
    var n = dens || 16, r = mulberry(77);
    g.save(); g.globalAlpha *= a;
    for (var i = 0; i < n; i++) {
      var ph = i / n + r() * .05, f = frac(t / POUR_P + ph), jx = (r() - .5) * 22, spin = r() * 6.283, s = .9 + r() * .3, col = GC[Math.floor(r() * 4)];
      var y = lerp(yTop, yBot, f * f), fa = seg(y, yTop, yTop + 60);
      g.save(); g.globalAlpha *= fa; grain(g, x + jx * (1 + f), y, spin + f * 9, s, col); g.restore();
    }
    /* the landing: a few grains bounce off the mound */
    for (i = 0; i < 6; i++) { var f2 = frac(t / POUR_P * 2 + i / 6), bx = x + (i % 2 ? 1 : -1) * (20 + 50 * f2), by = yBot - 40 * Math.sin(Math.PI * f2); g.save(); g.globalAlpha *= 1 - f2 * f2; grain(g, bx, by, i + f2 * 6, .9, GC[i % 4]); g.restore(); }
    g.restore();
  }
  /* the bowl, drawn about its foot (bx, by); s scales it, tilt turns it; `ph` is the phone (local pose) or null */
  var BOWL_H = 255;
  function bowl(g, t, bx, by, s, tilt, ph, o) {
    o = o || {}; if (!MOUND) mkMound();
    g.save(); g.translate(bx, by); g.rotate(tilt || 0); g.scale(s, s); g.translate(0, -BOWL_H);
    var ex = EXITING; if (o.moving) EXITING = true;
    prop(g, o.name || 'bowl', -400, -130, 400, BOWL_H);
    /* back rim */
    g.fillStyle = BOWL3; el(g, 0, 0, 400, 44); g.strokeStyle = '#c94a32'; g.lineWidth = 14; g.beginPath(); g.ellipse(0, 0, 393, 40, 0, 3.1416, 6.2832); g.stroke();
    /* the stream lands behind the phone, on the mound's right */
    if (o.stream !== false) stream(g, t, 300, o.streamTop == null ? -900 : o.streamTop, domeY(300) + 6, o.streamA == null ? 1 : o.streamA, o.dens);
    g.drawImage(MOUND.back, -420, -170);
    if (ph) { var pw = ph.w || 300, phh = ph.h || 600; g.save(); var pn = ph.name; ph.name = 'phone in rice'; phone(g, ph.x, ph.y, pw, phh, ph.rot || 0, ph); ph.name = pn; g.restore();
      /* only the part above the rice can be cut by the rail: measure that */
      prop(g, pn || 'phone', ph.x - pw / 2, ph.y - phh / 2, ph.x + pw / 2, Math.min(ph.y + phh / 2, -40)); }
    g.drawImage(MOUND.front, -420, -170);
    /* the body and the coral rim's front half */
    g.beginPath(); g.moveTo(-400, 0); g.bezierCurveTo(-392, 150, -300, 238, -150, 244); g.lineTo(150, 244); g.bezierCurveTo(300, 238, 392, 150, 400, 0); g.ellipse(0, 0, 400, 44, 0, 0, 3.1416, false); g.closePath();
    g.fillStyle = BOWL; g.fill();
    g.save(); g.clip(); grainIn(g, -400, 0, 800, 250, 921, .9);
    g.fillStyle = BOWL2; g.fillRect(-400, 92, 800, 34); g.fillStyle = 'rgba(244,237,224,.16)'; for (var i = -5; i <= 5; i++) el(g, i * 66, 109, 10, 10);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-400, 190, 800, 60);
    g.restore();
    g.fillStyle = BOWL3; rr(g, -150, 236, 300, 19, 8); g.fill();
    g.strokeStyle = HOT; g.lineWidth = 16; g.beginPath(); g.ellipse(0, 0, 393, 40, 0, 0, 3.1416); g.stroke();
    g.strokeStyle = 'rgba(255,230,210,.5)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -2, 393, 40, 0, .3, 2.84); g.stroke();
    EXITING = ex;
    g.restore();
  }

  /* =====================================================================================================
     THE PHONE (generic: dark body, punch-hole camera, no notch, no logo)
     ===================================================================================================== */
  var DROPS = (function () { var r = mulberry(5151), a = []; for (var i = 0; i < 11; i++) a.push([.12 + r() * .76, .08 + r() * .84, 9 + r() * 12, r()]); return a; })();
  function waterDrop(g, x, y, r, a) {
    if (r <= .5 || a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(20,40,60,.25)'; el(g, x + 2, y + 3, r, r * 1.08);
    g.fillStyle = WATER; g.beginPath(); g.moveTo(x, y - r * 1.6); g.bezierCurveTo(x + r * .9, y - r * .5, x + r, y + r * .2, x + r, y + r * .3); g.arc(x, y + r * .3, r, 0, 3.1416); g.bezierCurveTo(x - r, y + r * .2, x - r * .9, y - r * .5, x, y - r * 1.6); g.fill();
    g.fillStyle = WATER2; el(g, x - r * .35, y - r * .05, r * .25, r * .35);
    g.restore();
  }
  function homeScreen(g, S, o) {
    var r = mulberry(5101), cols = 4, pad = S.w * .08, cw = (S.w - pad * 2) / cols, TC = ['#c9b99a', '#9fb4a6', '#d8a77f', '#a9b6c9', '#c7a3a3', '#b8c48f'];
    g.fillStyle = '#e4dccb'; g.fillRect(S.x, S.y, S.w, S.h);
    for (var j = 0; j < 5; j++) for (var i = 0; i < cols; i++) { g.fillStyle = TC[Math.floor(r() * TC.length)]; rr(g, S.x + pad + i * cw + cw * .14, S.y + S.h * .1 + j * cw * 1.12, cw * .72, cw * .72, cw * .2); g.fill(); }
    g.fillStyle = 'rgba(33,29,38,.08)'; rr(g, S.x + pad * .6, S.y + S.h - cw * 1.3, S.w - pad * 1.2, cw * 1.08, cw * .3); g.fill();
    for (i = 0; i < cols; i++) { g.fillStyle = TC[(i * 2 + 1) % TC.length]; rr(g, S.x + pad + i * cw + cw * .14, S.y + S.h - cw * 1.16, cw * .72, cw * .72, cw * .2); g.fill(); }
  }
  function lockScreen(g, S, o) {
    g.fillStyle = '#2c3a4a'; g.fillRect(S.x, S.y, S.w, S.h);
    g.fillStyle = 'rgba(244,237,224,.85)'; rr(g, S.x + S.w * .25, S.y + S.h * .14, S.w * .5, S.h * .07, 10); g.fill();
    g.fillStyle = 'rgba(244,237,224,.35)'; rr(g, S.x + S.w * .32, S.y + S.h * .24, S.w * .36, S.h * .025, 6); g.fill();
    if (o.bolt > 0) {   /* the charging bolt */
      g.save(); g.globalAlpha *= o.bolt; g.fillStyle = '#9fd38a'; var bx = S.x + S.w / 2, by = S.y + S.h * .46, k = S.w / 300;
      poly(g, [[bx + 8 * k, by - 50 * k], [bx - 26 * k, by + 6 * k], [bx - 2 * k, by + 6 * k], [bx - 10 * k, by + 50 * k], [bx + 26 * k, by - 8 * k], [bx + 2 * k, by - 8 * k]]); g.fill(); g.restore();
    }
  }
  /* the phone at (cx, cy) turned by rot; o.wet (0..1) drops on the glass, o.screen 'home' | 'lock', o.alert (0..1) */
  function phone(g, cx, cy, w, h, rot, o) {
    o = o || {}; var rad = w * .13;
    g.save(); g.translate(cx, cy); g.rotate(rot); g.translate(-w / 2, -h / 2);
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 10, 14, w, h, rad); g.fill();
    g.fillStyle = '#2a313d'; rr(g, 0, 0, w, h, rad); g.fill();
    rr(g, 0, 0, w, h, rad); grainIn(g, 0, 0, w, h, 7401, .8);
    g.strokeStyle = 'rgba(244,237,224,.35)'; g.lineWidth = 3; rr(g, 0, 0, w, h, rad); g.stroke();
    g.fillStyle = '#3a4452'; rr(g, w - 4, h * .22, 12, h * .14, 5); g.fill();
    prop(g, o.name || 'phone', 0, 0, w, h);
    var m = Math.max(10, w * .035), S = { x: m, y: m, w: w - 2 * m, h: h - 2 * m };
    g.save(); rr(g, S.x, S.y, S.w, S.h, rad - m * .6); g.clip();
    if (o.screen === 'lock') lockScreen(g, S, o); else homeScreen(g, S, o);
    var wet = o.wet == null ? 0 : o.wet;
    if (wet > 0) DROPS.forEach(function (d) { waterDrop(g, S.x + d[0] * S.w, S.y + d[1] * S.h + 3 * Math.sin((o.t || 0) * 1.3 + d[3] * 6), d[2] * (w / 300) * Math.min(1, wet * 1.4 - d[3] * .4), 1); });
    if (o.alert > 0) {   /* Apple's alert, small, on the glass (re-created; the big card beside it carries the tag) */
      var k = eout(clamp(o.alert, 0, 1)), aw = S.w * .86, ah = S.h * .2, ax = S.x + (S.w - aw) / 2, ay = S.y + S.h * .38;
      g.save(); g.globalAlpha *= clamp(o.alert * 3, 0, 1); g.translate(ax + aw / 2, ay + ah / 2); g.scale(lerp(.8, 1, k), lerp(.8, 1, k)); g.translate(-(ax + aw / 2), -(ay + ah / 2));
      g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, ax + 4, ay + 6, aw, ah, 22); g.fill();
      g.fillStyle = SCRW; rr(g, ax, ay, aw, ah, 22); g.fill();
      waterDrop(g, ax + aw / 2, ay + ah * .36, 14 * (w / 300), 1);
      g.fillStyle = 'rgba(33,29,38,.55)'; rr(g, ax + aw * .2, ay + ah * .66, aw * .6, ah * .1, 6); g.fill(); g.fillStyle = 'rgba(33,29,38,.25)'; rr(g, ax + aw * .3, ay + ah * .82, aw * .4, ah * .07, 5); g.fill();
      g.restore();
    }
    g.restore();
    g.fillStyle = '#10151c'; rr(g, w / 2 - w * .14, m + w * .028, w * .28, w * .078, w * .039); g.fill();   /* Dynamic Island-style pill, no logo */
    if (o.edge) phoneFoot(g, w, h, rad, o);
    g.restore();
  }
  /* the phone's bottom face, as if tipped a little toward us: the port (pill), speaker holes either side.
     o.pg (0..1): one big grain (48 px) slides along the face and drops into the port */
  var FOOT_E = 60;
  function phoneFoot(g, w, h, rad, o) {
    var E = FOOT_E * (w / 300), k = w / 300, i;
    g.fillStyle = '#1d232c'; poly(g, [[rad * .55, h - 3], [w - rad * .55, h - 3], [w - rad * .85, h + E], [rad * .85, h + E]]); g.fill();
    g.fillStyle = 'rgba(244,237,224,.18)'; g.fillRect(rad * .7, h + E - 4, w - rad * 1.4, 3);
    g.fillStyle = '#05080b'; rr(g, w / 2 - w * .165, h + E * .28, w * .33, E * .46, E * .23); g.fill();
    g.strokeStyle = '#4a5566'; g.lineWidth = 2 * k; rr(g, w / 2 - w * .165, h + E * .28, w * .33, E * .46, E * .23); g.stroke();
    g.fillStyle = '#3a4452'; rr(g, w / 2 - w * .11, h + E * .43, w * .22, E * .16, E * .05); g.fill();   /* the USB-C tongue and its pins: a port, not a camera */
    g.fillStyle = GOLD; for (i = 0; i < 9; i++) g.fillRect(w / 2 - w * .095 + i * w * .0225, h + E * .45, w * .011, E * .12);
    g.fillStyle = '#05080b'; for (i = 0; i < 4; i++) { el(g, w / 2 - w * .2 - i * w * .045, h + E * .52, 3.6 * k, 3.6 * k); el(g, w / 2 + w * .2 + i * w * .045, h + E * .52, 3.6 * k, 3.6 * k); }
    if (o.pg != null) {
      var f = o.pg, a = seg(f, 0, .12) * (1 - seg(f, .86, .96)), sl = sio(seg(f, .1, .72)), dn = eio(seg(f, .72, .9));
      if (a > 0) { var gx = lerp(w * .14, w / 2, sl), gy = lerp(h + E + 13 * k, h + E * .5, dn), gs = 3.5 * k * lerp(1, .4, dn);
        g.save(); g.globalAlpha *= a; grain(g, gx, gy, .05 + .5 * Math.sin(Math.PI * sl) + 1.4 * dn, gs, GC[1]); g.restore(); }
    }
  }

  /* =====================================================================================================
     SCENE 1: THE BOWL (hook, belief, ask) → APPLE'S PAGE (page, list, rice)
     ===================================================================================================== */
  var FOOT = { x: 510, y: 1425 };
  /* frame 0: the phone half in the rice, tilted, sinking 250 px and turning upright over the first second.
     ct < 0 (the end card) continues the same curve backwards, so the drop into frame 0 has no bump */
  var REST = { x: 0, y: 60, rot: Math.PI }, P0 = { x: -30, y: -200, rot: Math.PI - .28 }, SINK = 2.4, KM = .12;
  function f0(ct) {
    var k, v0 = 2 / SINK;
    if (ct >= 0) k = 1 - Math.pow(1 - clamp(ct / SINK, 0, 1), 2);
    else {   /* before frame 0 (the end card) the phone sits 12 % higher, then starts to settle: same speed at the seam, no bump */
      var B = v0 * v0 / (4 * KM), ca = -v0 / (2 * B);
      k = ct < ca ? -KM : v0 * ct + B * ct * ct;
    }
    return { x: lerp(P0.x, REST.x, k), y: lerp(P0.y, REST.y, k), rot: lerp(P0.rot, REST.rot, k) };
  }
  function pgPhase(t) { return frac(t / PGP + .45); }
  var STREAM_TOP = 596;   /* the stream starts under the title, never through it */
  function title0(g, a) {
    font(g, 96, 900, DISP, 'condensed'); var s = 'iPHONE IN RICE', w1 = g.measureText(s).width, wq = g.measureText('?').width, x = 510 - (w1 + wq) / 2;
    txt(g, s, x, 514, 96, CREAM, 'left', 900, DISP, 0, a == null ? 1 : a, 60, 'condensed');
    txt(g, '?', x + w1, 514, 96, CREAM, 'left', 900, DISP, 0, a == null ? 1 : a, 60, 'condensed');
  }
  /* the search bar, typed in (re-created) */
  var QUERY = 'WET PHONE IN RICE?';
  function searchBar(g, x, y, t, t0, out) {
    var sa = seg(t, t0, t0 + .12) * (1 - out);
    if (sa <= 0 || !LIVE.text) return;
    var w = 760, h = 92, x0 = x - w / 2, y0 = y - h / 2, eo = eio(out);
    g.save(); g.globalAlpha *= sa; g.translate(-120 * eo, 0);
    var ex = EXITING; if (sa < 1 || eo > 0) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 8, y0 + 10, w, h, 46); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 46); g.fill();
    prop(g, 'search bar', x0, y0, x0 + w, y0 + h);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(x0 + 48, y - 6, 16, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(x0 + 60, y + 6); g.lineTo(x0 + 74, y + 20); g.stroke();
    var k = seg(t, t0 + .04, t0 + .42), n = Math.round(QUERY.length * k), typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
    onprop(function () { if (n) txt(g, QUERY.slice(0, n), x0 + 92, y + 3, 56, INK, 'left', 900, DISP, w - 120, 1, 40, 'condensed'); });
    NOREC = nr;
    onprop(function () { tag(g, 'RE-CREATED', x0 + w - 124, y0 + h + 36, 1, 0, 240, CREAM, null, 36); });
    EXITING = ex; g.restore();
  }
  /* the flame and the swab icons; the rice bag */
  function flame(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#e39a45'; g.beginPath(); g.moveTo(0, -34); g.bezierCurveTo(22, -12, 26, 6, 20, 18); g.arc(0, 14, 20, .2, 2.94); g.bezierCurveTo(-24, 0, -10, -12, 0, -34); g.fill();
    g.fillStyle = '#f3d58c'; g.beginPath(); g.moveTo(0, -8); g.bezierCurveTo(10, 4, 12, 12, 8, 20); g.arc(0, 18, 9, .3, 2.84); g.bezierCurveTo(-10, 10, -6, 2, 0, -8); g.fill();
    g.restore();
  }
  function swab(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-.5);
    g.fillStyle = '#d9cdb2'; rr(g, -30, -3, 60, 6, 3); g.fill();
    g.fillStyle = '#ffffff'; el(g, -32, 0, 10, 7); el(g, 32, 0, 10, 7);
    g.restore();
  }
  function riceBag(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -52, -58, 112, 128, 10); g.fill();
    g.fillStyle = KRAFT; poly(g, [[-56, -50], [56, -50], [60, 66], [-60, 66]]); g.fill();
    g.fillStyle = '#b48e55'; poly(g, [[-56, -50], [56, -50], [48, -68], [-48, -68]]); g.fill();
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(-56, -40, 112, 10);
    g.fillStyle = '#efe5cf'; rr(g, -34, -12, 68, 44, 8); g.fill();
    var r = mulberry(61); for (var i = 0; i < 9; i++) grain(g, -24 + r() * 48, -2 + r() * 24, r() * 6, .8);
    g.restore();
  }
  /* Apple's page (re-created): title, APPLE SUPPORT, the date, the don't list in Apple's order */
  var PG = { x0: 110, y0: 470, x1: 910, y1: 1100 };
  function strike(g, x0, x1, y, k, lw) {
    if (k <= 0) return;
    g.save(); g.strokeStyle = INK; g.lineWidth = lw || 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y + 2); g.lineTo(lerp(x0, x1, k), y - 3 * k); g.stroke(); g.restore();
  }
  function applePage(g, t) {
    var x0 = PG.x0, y0 = PG.y0, x1 = PG.x1, y1 = PG.y1;
    sheet(g, x0, y0, x1, y1, 5201, PAPER, 'apple page');
    onprop(function () {
      txt(g, APPLE.who, x0 + 36, y0 + 46, 36, '#5d564c', 'left', 800, DISP, 400, 1, 36, 'condensed');
      APPLE.title.forEach(function (L, i) { txt(g, L, x0 + 36, y0 + 108 + i * 54, 50, INK, 'left', 900, DISP, x1 - x0 - 72, 1, 40, 'condensed'); });
      txt(g, APPLE.head, x0 + 36, y0 + 252, 44, INK, 'left', 800, DISP, x1 - x0 - 72, 1, 36, 'condensed');
      tag(g, 'RE-CREATED', x0 + 132, y1 - 34, 1, 0, 240, INK, PAPER, 36);
    });
    g.fillStyle = 'rgba(33,29,38,.4)'; g.fillRect(x0 + 36, y0 + 206, x1 - x0 - 72, 3);
    /* the date (a time card) on "page" */
    if (t >= K.pageW - .08) onprop(function () { card(g, APPLE.date, x1 - 150, y0 + 46, t, K.pageW, null, 44, 260, K.PG); });
    /* the rows: 1–2 print grey on "lists"; each inks and is struck on its word. Row 3, BAG OF RICE, is the one that matters:
       1.44× the others (72 px), printed grey on "no", inked on "bag", struck thick on "rice" */
    var RY = [y0 + 330, y0 + 420, y0 + 532], tx = x0 + 120;
    var pr = [seg(t, K.lists - .02, K.lists + .25), seg(t, K.lists + .12, K.lists + .4), seg(tq(t), K.noR - .06, K.noR)];
    var ink = [seg(tq(t), K.heat - .05, K.heat + .1), seg(tq(t), K.swabs - .05, K.swabs + .1), seg(tq(t), K.bag - .03, K.bag + .1)];
    var sk = [eio(seg(t, K.heat, K.heat + .3)), eio(seg(t, K.swabs, K.swabs + .3)), eio(seg(t, K.riceW, K.riceW + .3))];
    APPLE.rows.forEach(function (L, i) {
      if (pr[i] <= 0) return;
      var col = mixc(hex('#9a9185'), hex(INK), ink[i]), px = i === 2 ? 72 : 50;
      g.save(); g.globalAlpha *= pr[i]; g.translate(30 * (1 - pr[i]), 0);
      onprop(function () { txt(g, L, tx, RY[i], px, col, 'left', 900, DISP, 560, 1, 40, 'condensed'); if (i === 1) txt(g, APPLE.row2sub, tx, RY[i] + 46, 36, mixc(hex('#9a9185'), hex('#4b4540'), ink[i]), 'left', 800, DISP, 400, 1, 36, 'condensed'); });
      if (i === 0) flame(g, x0 + 66, RY[i], 1);
      if (i === 1) swab(g, x0 + 66, RY[i] + 8, 1.1);
      g.fillStyle = col; if (i === 2) el(g, x0 + 66, RY[i], 12, 12);
      var wL = Math.min(560, tw(g, L, px));
      strike(g, tx - 8, tx + wL + 8, RY[i], sk[i], i === 2 ? 13 : 8);
      if (i < 2) strike(g, x0 + 38, x0 + 96, RY[i] + (i ? 8 : 0), sk[i], 7);
      g.restore();
    });
    /* the paper rice bag slaps beside its row on "rice", struck */
    if (t >= K.riceW - .06) {
      var kb = eout(seg(t, K.riceW - .06, K.riceW + .04)), pk = .06 * Math.sin(Math.PI * seg(t, K.BG - .02, K.BG + .16));
      g.save(); g.globalAlpha *= seg(t, K.riceW - .06, K.riceW - .03);
      var BX = 800, BY = RY[2] - 10; riceBag(g, BX, BY, .8 * lerp(1.4, 1, kb) * (1 + pk), .08);   /* right of the row, clear of INTO THE CONNECTOR and RE-CREATED */
      var kx = eio(seg(t, K.riceW + .08, K.riceW + .34));
      if (kx > 0) { g.strokeStyle = INK; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(BX - 60, BY - 62); g.lineTo(lerp(BX - 60, BX + 60, kx), lerp(BY - 62, BY + 52, kx)); g.stroke(); }
      g.restore();
    }
  }
  function mixc(a, b, k) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(lerp(a[i], b[i], clamp(k, 0, 1))); }).join(',') + ')'; }
  function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  function phPose(t) { var p = f0(t); return { x: p.x, y: p.y, rot: p.rot, wet: 1, t: t, edge: 1, pg: t < K.page - .15 ? pgPhase(t) : null }; }
  function bowlScene(g, t) {
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { wallBg(g, t, 0); return; }
    /* the bowl: tilts 3° on "Apple", shrinks to 0.6 about its foot as the page arrives */
    var kt = sio(seg(t, K.apple - .1, K.no + .2)) * (1 - sio(seg(t, K.page - .3, K.page + .2)));
    var ks = eio(seg(t, K.page - .15, K.page + .4)), s = lerp(1, .6, ks);
    var p = phPose(t), ph = { x: p.x, y: p.y, rot: p.rot, wet: p.wet, t: t, name: 'phone', edge: 1, pg: p.pg };
    var st = (STREAM_TOP - (FOOT.y - BOWL_H * s)) / s;
    bowl(g, t, FOOT.x + 10 * kt, FOOT.y, s, 0, ph, { moving: t < SINK || (ks > 0 && ks < 1), streamTop: st, dens: 24 });
    /* frame 0's words, peeled on "A" */
    var hout = eio(seg(t, K.bel - .1, K.bel + .12));
    if (hout < 1) { var exh = EXITING; if (hout > 0) EXITING = true; g.save(); peelT(g, 120, 560, hout); title0(g); g.restore(); EXITING = exh; }
    searchBar(g, 510, 532, t, K.bel, eio(seg(t, K.ask - .06, K.ask + .2)));
    card(g, 'CLASSIC FIX?', 510, 690, t, K.classic, K.page - .15, 66, 600, K.CF);
    card(g, 'WHY NOT?', 510, 548, t, K.ask + .18, K.page - .15, 96, 520, K.WN);
    /* Apple's page slides down over the top on "Its" */
    var kin = eout(seg(t, K.page - .15, K.page + .25));
    if (kin > 0) { var ex2 = EXITING; if (kin < 1) EXITING = true; g.save(); g.translate(0, -760 * (1 - kin)); applePage(g, t); g.restore(); EXITING = ex2; }
  }

  /* =====================================================================================================
     SCENE 2: THE PORT (twist, dip): the phone's bottom edge, its port 610 px wide
     ===================================================================================================== */
  var SL = { x0: 110, x1: 910, h: 350 };
  var PINS = 13, PINX0 = 300, PINDX = 35;
  function slabY(t) { return lerp(1010, 800, eio(seg(t, K.dip - .12, K.dip + .4))); }
  function slab(g, y0, t, o) {
    var x0 = SL.x0, x1 = SL.x1, h = SL.h;
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, x0 + 10, y0 + 14, x1 - x0, h, 150); g.fill();
    g.fillStyle = '#2a313d'; rr(g, x0, y0, x1 - x0, h, 150); g.fill();
    rr(g, x0, y0, x1 - x0, h, 150); grainIn(g, x0, y0, x1 - x0, h, 7421, .8);
    g.fillStyle = 'rgba(244,237,224,.22)'; rr(g, x0 + 70, y0 + 8, x1 - x0 - 140, 14, 7); g.fill();   /* the glass's edge */
    g.strokeStyle = 'rgba(244,237,224,.35)'; g.lineWidth = 3; rr(g, x0, y0, x1 - x0, h, 150); g.stroke();
    prop(g, 'port', x0, y0, x1, y0 + h);
    /* the speaker holes either side and the slot: it reads as the bottom of a phone, not an abstract pill */
    g.fillStyle = '#070a0e'; [150, 180, 210, 810, 840, 870].forEach(function (hx) { el(g, hx, y0 + 175, 9, 9); });
    var sx0 = 250, sx1 = 770, sy0 = y0 + 85, sy1 = y0 + 265;
    g.fillStyle = '#070a0e'; rr(g, sx0, sy0, sx1 - sx0, sy1 - sy0, 90); g.fill();
    g.strokeStyle = '#4a5566'; g.lineWidth = 6; rr(g, sx0, sy0, sx1 - sx0, sy1 - sy0, 90); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.05)'; rr(g, sx0 + 20, sy0 + 12, sx1 - sx0 - 40, 26, 13); g.fill();
    /* the tongue and its pins */
    var ty = y0 + 175; g.fillStyle = '#3a4452'; rr(g, 280, ty - 26, 460, 52, 14); g.fill();
    for (var i = 0; i < PINS; i++) {
      var px = PINX0 + i * PINDX, rk = o.rust ? o.rust(i) : 0;
      g.fillStyle = mixc(hex(GOLD), hex(RUST), rk); rr(g, px - 9, ty - 20, 18, 40, 4); g.fill();
      if (rk > .3) { var r = mulberry(300 + i); g.fillStyle = 'rgba(90,40,20,' + (.6 * rk) + ')'; for (var j = 0; j < 4; j++) el(g, px - 6 + r() * 12, ty - 16 + r() * 32, 3 + r() * 4, 2 + r() * 3); }
    }
    return { ty: ty, sy0: sy0, sy1: sy1 };
  }
  /* the big grain and its five fragments: pieces are slices of the one grain; on "Tiny" they crack apart, drift in and
     lodge on the pins by "could" */
  var BIG = { x: 510, y: 680, rx: 150, ry: 62 };
  var CUTS = [-90, -34, 22, 70];
  var LODGE = [[372, 0, .8, -.6], [458, -6, .62, .9], [548, 4, .7, -.3], [622, -4, .56, 1.4], [690, 2, .66, .5]];
  function bigGrainPiece(g, i) {
    var xs = [-160].concat(CUTS).concat([160]), a = xs[i], b = xs[i + 1], r = mulberry(810 + i), P = [];
    for (var y = -70; y <= 70; y += 14) P.push([a + (i ? (r() - .5) * 18 : 0), y]);
    for (y = 70; y >= -70; y -= 14) P.push([b + (i < 4 ? (mulberry(811 + i)() - .5) * 18 + Math.sin(y * .13 + i) * 6 : 0), y]);
    g.save(); poly(g, P); g.clip();
    g.fillStyle = 'rgba(70,52,30,.35)'; el(g, 6, 9, BIG.rx, BIG.ry);
    g.fillStyle = '#f6eedd'; el(g, 0, 0, BIG.rx, BIG.ry);
    g.beginPath(); g.ellipse(0, 0, BIG.rx, BIG.ry, 0, 0, 6.283); grainIn(g, -BIG.rx, -BIG.ry, BIG.rx * 2, BIG.ry * 2, 820, 1);
    g.fillStyle = 'rgba(255,255,255,.55)'; el(g, -40, -22, 70, 14);
    g.strokeStyle = 'rgba(120,96,60,.5)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, BIG.rx - 2, BIG.ry - 2, 0, 0, 6.283); g.stroke();
    g.restore();
    return P;
  }
  function fragments(g, t, ty) {
    var T0 = K.bits, crack = seg(t, T0 - .04, T0 + .12), go = seg(t, T0 + .14, K.damage - .08);
    var appear = eout(seg(t, S('port').t0 - .42, S('port').t0 - .05));
    if (appear <= 0) return;
    for (var i = 0; i < 5; i++) {
      var xs = [-160].concat(CUTS).concat([160]), mid = (xs[i] + xs[i + 1]) / 2, L = LODGE[i];
      var k = sio(go), sx = BIG.x + 1.2 * Math.sin(t * 1.3) * 4, sy = BIG.y - 60 * (1 - appear) + 6 * Math.sin(t * 1.7);
      var spread = (i - 2) * 14 * eout(crack);
      var x0 = sx + spread, y0 = sy, x2 = L[0] - mid * L[2], y2 = ty + L[1], cxp = lerp(x0, x2, .5) + (i - 2) * 50, cyp = lerp(y0, y2, .35);
      var x = (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * cxp + k * k * x2, y = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * cyp + k * k * y2;
      var sc = lerp(1, L[2], k), rot = lerp(.06 * Math.sin(t), L[3], k) + (k > 0 && k < 1 ? .6 * Math.sin(Math.PI * k) * (i % 2 ? 1 : -1) : 0);
      var gone = seg(t, K.dip - .05, K.dip + .3);   /* the rice bits fade on "But": the corrosion is the water's, not the rice's */
      if (gone >= 1) continue;
      g.save(); g.globalAlpha *= appear * (1 - gone); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
      var ex = EXITING; if ((go > 0 && go < 1) || gone > 0) EXITING = true;
      bigGrainPiece(g, i);
      EXITING = ex; g.restore();
    }
    /* the crack lines on "Tiny" */
    if (crack > 0 && go <= 0) { g.save(); g.strokeStyle = '#5d4a33'; g.lineWidth = 4; g.lineCap = 'round'; CUTS.forEach(function (c, j) { var r = mulberry(830 + j); g.beginPath(); for (var y = -60; y <= -60 + 120 * crack; y += 12) g.lineTo(BIG.x + c + (r() - .5) * 16, BIG.y + y); g.stroke(); }); g.restore(); }
  }
  function plug(g, cx, ytop) {
    /* the cable first: it runs off the frame's foot on purpose */
    g.fillStyle = '#e9e3d6'; g.fillRect(cx - 44, ytop + 220, 88, 1500 - ytop); prop(g, 'cable', cx - 44, ytop + 220, cx + 44, 1500);
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(cx + 18, ytop + 220, 18, 1500 - ytop);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, cx - 270, ytop + 62, 560, 150, 30); g.fill();
    g.fillStyle = '#b8b2a5'; rr(g, cx - 240, ytop, 480, 74, 36); g.fill();   /* the metal tip */
    g.fillStyle = 'rgba(255,255,255,.3)'; rr(g, cx - 210, ytop + 11, 420, 12, 6); g.fill();
    g.fillStyle = '#efe9dc'; rr(g, cx - 280, ytop + 56, 560, 150, 30); g.fill();   /* the overmold */
    rr(g, cx - 280, ytop + 56, 560, 150, 30); grainIn(g, cx - 280, ytop + 56, 560, 150, 7431, .7);
    g.fillStyle = '#d8d0bf'; rr(g, cx - 80, ytop + 196, 160, 40, 14); g.fill();
    prop(g, 'plug', cx - 280, ytop, cx + 280, ytop + 236);
  }
  function portScene(g, t) {
    var E0 = S('port').t0;
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { wallBg(g, t, .3); return; }
    var ex = EXITING; if (t < E0 + .05) EXITING = true;
    var y0 = slabY(t), mv = t > K.dip - .12 && t < K.dip + .45;
    var exm = EXITING; if (mv) EXITING = true;
    /* the drop and the rust: a drop bridges pins 5–6 on "wet"; they rust out from it on "corrode" */
    var dk = eout(seg(t, K.wetD - .05, K.wetD + .2));
    var info = slab(g, y0, t, { rust: function (i) { var d = Math.abs(i - 5.5); return eio(seg(t, K.corrode - .05 + d * .28, K.corrode + .35 + d * .3)) * (d < 3.6 ? 1 : 0);   /* the rust creeps pin to pin for ~1.4 s */ } });
    EXITING = exm;
    if (dk > 0) { g.save(); g.globalAlpha *= 1 - .5 * seg(t, K.corrode + .2, K.corrode + .8); waterDrop(g, PINX0 + 5.5 * PINDX, info.ty - 4, 24 * dk, 1); g.restore(); }
    EXITING = ex;
    /* the fragments travel with the slab once they lodge */
    var exf = EXITING; if (t < E0 + .05 || mv) EXITING = true;
    fragments(g, t, info.ty);
    EXITING = exf;
    /* OUR ILLUSTRATION under the port while the pieces lodge: Apple says rice particles could damage it, not how */
    var ia = seg(t, E0 - .05, E0 + .05) * (1 - seg(t, K.dip - .12, K.dip - .04));
    if (ia > 0) { var exi = EXITING; if (ia < 1 || t < E0 + .05) EXITING = true; tag(g, 'OUR ILLUSTRATION', 510, y0 + SL.h + 40, ia, 0, 520, CREAM, null, 36); EXITING = exi; }
    /* the plug comes up from below on "charging" and stops short; it jabs on "can" and never seats */
    var pin = eout(seg(t, K.charging - .1, K.charging + .4)), jab = Math.sin(Math.PI * seg(t, K.canD - .05, K.canD + .3)), back = sio(seg(t, K.corrode + .9, K.tap + .45));   /* the plug backs away slowly until the tear */
    if (pin > 0) { var exp = EXITING; if (pin < 1 || jab > 0) EXITING = true; plug(g, 510, lerp(1470, y0 + SL.h + 30, pin) - 22 * jab + 100 * back); EXITING = exp; }
    /* the hero: COULD DAMAGE IT inks on "damage"; the thump in the pause punches it; it peels before "But" */
    var sOut = eio(seg(t, K.dip - .22, K.dip - .06));
    if (t >= K.damage && sOut < 1) {
      var pk = seg(t, K.TW - .02, K.TW + .1), pul = 1 + .08 * eout(pk) - .03 * Math.sin(Math.PI * seg(t, K.TW - .02, K.TW + .08)), exs = EXITING; if (sOut > 0) EXITING = true;
      var pin2 = 1 + .1 * eout(seg(t, K.damage, K.damage + .28));   /* punch-in 1.00 → 1.10 on "damage" */
      g.save(); peelT(g, 140, 780, sOut); g.translate(510, 606); g.scale(pul * pin2, pul * pin2);
      onprop(function () { stamp(g, APPLE.stamp, 0, 0, t, K.damage, 124, HOT, -.05); });
      g.restore(); EXITING = exs;
    }
    /* Apple's clipping prints on "damage"; on "But" it rises to the top, and the corrode lines ink into it on "corrode" */
    var up = eio(seg(t, K.dip - .1, K.dip + .3)), exq = EXITING; if (up > 0 && up < 1) EXITING = true;
    var cl = seg(tq(t), K.corrode - .02, K.corrode + .05);
    qplate(g, 104, lerp(770, 464, up), 812, cl > 0 ? APPLE.rice.concat(APPLE.corrode) : APPLE.rice, 44, APPLE.credit, 5401, seg(t, K.damage - .02, K.damage + .1), 0);
    EXITING = exq;
  }
  /* rice packed round the phone's foot in the port close-up (a band behind and a band in front) */
  var RB = null;
  /* a mound of big grains, 820 × h, closed on every side (tapered ends, ragged foot) so the rail never cuts it */
  function mkRiceBand(seed, n, h, top) {
    var c = mk(840, h + 20), g = c.getContext('2d'), r = mulberry(seed);
    g.translate(10, 10);
    g.beginPath(); for (var x = 0; x <= 820; x += 10) { var u = Math.abs(x - 410) / 410; g.lineTo(x, top(x) + (h - top(x)) * Math.pow(u, 6)); } for (x = 820; x >= 0; x -= 10) g.lineTo(x, h - 6 + 5 * Math.sin(x * .09)); g.closePath();
    g.fillStyle = '#e2d3b4'; g.fill(); g.save(); g.clip();
    for (var i = 0; i < n; i++) { var gx = r() * 820, gy = r() * h; grain(g, gx, gy, r() * 6.283, 1.6 + r() * .4, GC[Math.floor(r() * 4)]); }
    g.restore(); return c;
  }
  function riceBand(g, y, t) { if (!RB) RB = { b: mkRiceBand(931, 360, 140, function (x) { return 14 + 10 * Math.sin(x * .02); }), f: mkRiceBand(932, 260, 100, function (x) { return 26 + 12 * Math.sin(x * .017 + 2); }) }; g.drawImage(RB.b, 90, y - 30); prop(g, 'rice', 100, y - 20, 920, y + 120); }
  function riceFront(g, y, t) { g.drawImage(RB.f, 90, y + 12); var r = mulberry(940); for (var i = 0; i < 5; i++) { var f = frac(t * .6 + i / 5); g.save(); g.globalAlpha *= 1 - f; grain(g, 200 + r() * 620, y + 40 - 30 * Math.sin(Math.PI * f), r() * 6 + f * 4, 1.6, GC[i % 4]); g.restore(); } }

  /* =====================================================================================================
     SCENE 3: OUT OF THE RICE (tap, air, day)
     ===================================================================================================== */
  var HANDB = { x0: 190, x1: 830, y0: 1132, y1: 1292 };
  var DRY = { x: 510, y: 930 };   /* lying on its side on the shelf, port to the right */
  function tapT() { return [K.hand, K.port, K.TK]; }   /* "Tap it gently" plays under the tear; the taps land on "hand", "port" and the knock */
  function tapDip(t) { var d = 0; tapT().forEach(function (T) { d = Math.max(d, T - .1 <= t ? (t < T ? seg(t, T - .1, T) : 1 - seg(t, T + .04, T + .2)) : 0); }); return d; }
  function handBlock(g, t, a, dx) {
    if (a <= 0) return;
    var exh = EXITING; if (Math.abs(dx) > .5 || a < 1) EXITING = true;
    var x0 = HANDB.x0 + dx, x1 = HANDB.x1 + dx, y0 = HANDB.y0, y1 = HANDB.y1;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 10, y0 + 14, x1 - x0, y1 - y0, 40); g.fill();
    g.fillStyle = TAGE; rr(g, x0, y0 + 10, x1 - x0, y1 - y0, 40); g.fill();
    g.fillStyle = TAGC; rr(g, x0, y0, x1 - x0, y1 - y0 - 6, 40); g.fill();
    rr(g, x0, y0, x1 - x0, y1 - y0 - 6, 40); grainIn(g, x0, y0, x1 - x0, y1 - y0, 7501, .7);
    prop(g, 'hand block', x0, y0, x1, y1 + 10);
    onprop(function () { txt(g, 'YOUR HAND', (x0 + x1) / 2, (y0 + y1) / 2 + 2, 64, INK, 'center', 900, DISP, 560, 1, 40, 'condensed'); });
    g.restore(); EXITING = exh;
  }
  /* drops shaken out at each tap: they spray off the block's edges and fall */
  function tapDrops(g, t, px, py) {
    tapT().forEach(function (T, j) {
      for (var i = 0; i < 6; i++) {
        var k = seg(t, T, T + .7); if (k <= 0 || k >= 1) continue;
        var side = i % 2 ? 1 : -1, vx = side * (120 + 60 * ((i * 7 + j * 3) % 5)), x = px + vx * k * 1.6, y = py - 60 * Math.sin(Math.PI * seg(k, 0, .3)) + 520 * k * k;
        if (y > 1400) continue;
        waterDrop(g, x, y, 13 - i, 1 - seg(k, .7, 1));
      }
    });
  }
  function shelf(g, k) {
    if (k <= 0) return;
    var y = lerp(1500, 1080, eout(k)), exs = EXITING; if (k < 1) EXITING = true;
    g.save();
    g.fillStyle = '#5a4a3a'; poly(g, [[220, y + 40], [270, y + 40], [270, y + 88]]); g.fill(); poly(g, [[800, y + 40], [750, y + 40], [750, y + 88]]); g.fill();
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 110, y + 10, 812, 44, 8); g.fill();
    g.fillStyle = '#b08a5e'; rr(g, 104, y, 812, 42, 8); g.fill(); rr(g, 104, y, 812, 42, 8); grainIn(g, 104, y, 812, 42, 7601, 1.1);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(110, y + 4, 800, 6);
    prop(g, 'shelf', 104, y, 916, y + 90);
    g.restore(); EXITING = exs;
  }
  /* airflow: three cream strips that drift left → right past the phone (periodic in t) */
  function airflow(g, t, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.strokeStyle = 'rgba(244,237,224,.75)'; g.lineCap = 'round';
    [[770, 0], [880, .35], [990, .7]].forEach(function (L, i) {
      var f = frac(t * .55 + L[1]), len = 280, x0 = lerp(110, 880 - len, f), y = L[0];
      g.save(); g.globalAlpha *= Math.sin(Math.PI * f); g.lineWidth = 9; g.beginPath();
      for (var s = 0; s <= 1.0001; s += .05) { var x = x0 + s * len, yy = y + 22 * Math.sin(x * .018 + t * 2 + i); if (s === 0) g.moveTo(x, yy); else g.lineTo(x, yy); }
      g.stroke();
      var xe = x0 + len, ye = y + 22 * Math.sin(xe * .018 + t * 2 + i), dir = Math.atan2(22 * .018 * Math.cos(xe * .018 + t * 2 + i), 1);
      g.save(); g.translate(xe, ye); g.rotate(dir); g.beginPath(); g.moveTo(-26, -16); g.lineTo(2, 0); g.lineTo(-26, 16); g.stroke(); g.restore();
      g.restore();
    });
    g.restore();
  }
  /* the clock: a paper disc with twelve ticks and no numerals; the hand sweeps once round from "up" */
  function clock(g, t, x, y, r, a, sweep, pk) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a * 2, 0, 1); g.translate(x, y); var s = lerp(.6, 1, eout(clamp(a, 0, 1))) * (1 + (pk || 0)); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.4)'; el(g, 8, 12, r, r);
    g.fillStyle = TAGC; el(g, 0, 0, r, r); g.beginPath(); g.arc(0, 0, r, 0, 6.283); grainIn(g, -r, -r, 2 * r, 2 * r, 7701, .7);
    prop(g, 'clock', -r, -r, r, r);
    if (sweep > 0) { g.fillStyle = 'rgba(243,213,140,.8)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * .86, -1.5708, -1.5708 + 6.283 * sweep); g.closePath(); g.fill(); }
    g.strokeStyle = INK; g.lineCap = 'round';
    for (var i = 0; i < 12; i++) { var an = i * .5236; g.lineWidth = i % 3 ? 5 : 9; g.beginPath(); g.moveTo(Math.cos(an) * r * .78, Math.sin(an) * r * .78); g.lineTo(Math.cos(an) * r * .9, Math.sin(an) * r * .9); g.stroke(); }
    var ha = -1.5708 + 6.283 * sweep; g.lineWidth = 12; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(ha) * r * .72, Math.sin(ha) * r * .72); g.stroke();
    g.fillStyle = INK; el(g, 0, 0, 14, 14);
    g.restore();
  }
  function dryScene(g, t) {
    var E0 = S('dry').t0;
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { wallBg(g, t, .2); return; }
    var lift = eio(seg(t, E0, E0 + .38)), drop = eio(seg(t, E0 + .2, E0 + .55)), flip = Math.PI * (1 - eio(seg(lift, .3, 1)));
    /* the phone: out of the rice, over the block (taps), then onto the shelf */
    var toShelf = eio(seg(t, K.air + .02, K.air + .55));
    var RIM = FOOT.y - BOWL_H, px = lerp(510, DRY.x, toShelf), py = lerp(lerp(RIM + REST.y, 805, lift), DRY.y, toShelf) + 27 * tapDip(t) * (1 - toShelf);
    /* under the wipe the phone is still in the bowl; it lifts out from between the rice layers */
    var ex = EXITING; if (t < E0 + .05) EXITING = true;
    if (drop < 1) {
      g.save(); g.globalAlpha *= 1 - drop; g.translate(0, 160 * drop);
      bowl(g, t, FOOT.x, FOOT.y, 1, 0, lift < 1 ? { x: 0, y: py - RIM, rot: flip, wet: 1, t: t, edge: 1 } : null, { moving: drop > 0 || (lift > 0 && lift < 1), name: 'bowl', streamTop: STREAM_TOP - RIM });
      g.restore();
    }
    EXITING = ex;
    /* the camera pushes in 5 % on the taps and lets go as the phone goes to the shelf */
    var zm = 1 + .05 * eio(seg(t, E0 + .55, K.hand + .3)) * (1 - eio(seg(t, K.air - .2, K.air + .3))), exz = EXITING;
    g.save(); g.translate(510, 1000); g.scale(zm, zm); g.translate(-510, -1000);   /* a camera move: every prop stays inside the rails at 1.05 */
    handBlock(g, t, seg(t, E0 + .06, E0 + .22) * (1 - seg(t, K.air + .04, K.air + .36)), -520 * (1 - eout(seg(t, E0 + .06, E0 + .38))) - 600 * eio(seg(t, K.air + .04, K.air + .46)));
    shelf(g, seg(t, K.air - .05, K.air + .4));
    airflow(g, t, eio(seg(t, K.dry - .1, K.dry + .3)) * (1 - .35 * seg(t, K.day, K.day + .3)) + .5 * Math.sin(Math.PI * seg(t, K.airflow, K.airflow + .5)) * (1 - seg(t, K.day, K.day + .3)));
    if (lift >= 1) {
      var exp = EXITING; if (lift < 1 || (toShelf > 0 && toShelf < 1)) EXITING = true;
      var lay = -Math.PI / 2 * toShelf;
      /* grains fall off the phone as it lifts */
      var r = mulberry(950); for (var i = 0; i < 8; i++) { var k = seg(t, E0 + .1 + i * .03, E0 + .7 + i * .03); if (k > 0 && k < 1) grain(g, px - 110 + r() * 220, py + 300 + 380 * k * k, r() * 6 + k * 8, 1.4, GC[i % 4]); }
      var wet = 1 - sio(seg(t, K.up, K.dayEnd + .2));
      phone(g, px, py, 300, 600, lay, { wet: wet, t: t, edge: 1 });
      EXITING = exp;
      if (toShelf < 1) tapDrops(g, t, px, py + 300);
    }
    /* "port down": a cream arrow beside the phone points at its port on "port", pulses on "down", gone before "Then" */
    var ar0 = eout(seg(t, K.port - .04, K.port + .12)), arO = seg(t, K.air - .3, K.air - .08);
    if (ar0 > 0 && arO < 1) {
      var exr = EXITING; if (ar0 < 1 || arO > 0) EXITING = true;
      var apk = 1 + .08 * Math.sin(Math.PI * seg(t, K.down - .02, K.down + .2)), ay = 960 + 40 * (1 - ar0) + 14 * Math.sin(Math.PI * 2 * frac((t - K.port) * 1.4));
      g.save(); g.globalAlpha *= ar0 * (1 - arO); g.translate(745, ay); g.scale(apk, apk);
      g.fillStyle = 'rgba(0,0,0,.35)'; poly(g, [[-22 + 6, -150 + 9], [22 + 6, -150 + 9], [22 + 6, 0 + 9], [60 + 6, 0 + 9], [0 + 6, 80 + 9], [-60 + 6, 0 + 9], [-22 + 6, 0 + 9]]); g.fill();
      g.fillStyle = CREAM; poly(g, [[-22, -150], [22, -150], [22, 0], [60, 0], [0, 80], [-60, 0], [-22, 0]]); g.fill();
      prop(g, 'port arrow', -60, -150, 60, 80);
      g.restore(); EXITING = exr;
    }
    g.restore(); EXITING = exz;
    /* the airflow clipping on "dry"; the day clipping and the clock on "It" / "up" */
    qplate(g, 104, 1190, 812, APPLE.air, 44, APPLE.credit, 5421, seg(t, K.air - .05, K.air + .05), seg(t, K.day - .14, K.day + .02));
    var ca = seg(t, K.day - .05, K.day + .25), sw = eio(seg(t, K.up, K.dayEnd + .05)), cpk = .08 * eout(seg(t, K.up - .05, K.up + .25)) + .05 * Math.sin(Math.PI * seg(t, K.CK - .02, K.CK + .2));   /* punch 1.08 on the sweep */
    clock(g, t, 720, 604, 150, ca, sw, cpk);
    qplate(g, 104, 1190, 812, APPLE.day, 44, APPLE.credit, 5431, seg(t, K.day + .03, K.day + .13), 0);
  }

  /* =====================================================================================================
     SCENE 4: CHECK YOURS (the plug seats later; Apple's alert; still wet → keep drying)
     ===================================================================================================== */
  var CK = { x: 290, y: 818, w: 300, h: 600 };
  function checkScene(g, t) {
    var E0 = S('check').t0;
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { wallBg(g, t, .25); return; }
    var ex = EXITING; if (t < E0 + .05) EXITING = true;
    var seat = eout(seg(t, K.charge - .05, K.charge + .3)), out = eio(seg(t, K.liquid + .12, K.liquid + .42)), al = seg(t, K.liquid - .04, K.liquid + .2);   /* the alert says unplug: it comes out */
    var bottom = CK.y + CK.h / 2, ptop = lerp(1300, bottom - 6, seat) + 170 * out;
    /* the small plug (USB-C cable end) below the phone */
    g.save();
    g.fillStyle = '#e9e3d6'; g.fillRect(CK.x - 20, ptop + 120, 40, 1500); prop(g, 'cable', CK.x - 20, ptop + 120, CK.x + 20, 1500);
    g.fillStyle = '#b8b2a5'; rr(g, CK.x - 34, ptop, 68, 30, 12); g.fill();
    g.fillStyle = '#efe9dc'; rr(g, CK.x - 50, ptop + 24, 100, 100, 18); g.fill();
    prop(g, 'plug', CK.x - 50, ptop, CK.x + 50, ptop + 124);
    g.restore();
    /* the glass looks dry (the day dried it): only the alert shows the water you can't see */
    phone(g, CK.x, CK.y, CK.w, CK.h, 0, { screen: 'lock', bolt: 0, alert: al, wet: 0, t: t, edge: 1 });
    EXITING = ex;
    /* time passing: the day's clock, small, ticks round in the lower right until the alert; LATER on "later" */
    var co = eio(seg(t, K.liquid - .12, K.liquid + .04));
    if (co < 1) { var exc = EXITING; if (co > 0) EXITING = true; g.save(); peelT(g, 620, 1330, co); clock(g, t, 712, 1236, 118, seg(t, E0 - .3, E0), frac(.8 * Math.max(0, t - E0) + .02 * eout(seg(t, K.later, K.later + .3))), .05 * Math.sin(Math.PI * seg(t, K.later - .02, K.later + .2))); g.restore(); EXITING = exc; }
    card(g, 'LATER', 710, 560, t, K.later, null, 76, 300);
    /* the big re-created alert beside the phone, on "Liquid": Apple's name, the tag and Apple's credit live on it */
    if (al > 0) {
      var k = eout(al), x0 = 488, y0 = 632, w = 432, h = 300, exa = EXITING; if (al < 1) EXITING = true;
      g.save(); g.globalAlpha *= clamp(al * 3, 0, 1); g.translate(x0 + w / 2, y0 + h / 2); g.scale(lerp(.85, 1, k), lerp(.85, 1, k)); g.translate(-(x0 + w / 2), -(y0 + h / 2));
      g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 8, y0 + 12, w, h, 40); g.fill();
      g.fillStyle = SCRW; rr(g, x0, y0, w, h, 40); g.fill(); rr(g, x0, y0, w, h, 40); grainIn(g, x0, y0, w, h, 7801, .5);
      prop(g, 'alert card', x0, y0, x0 + w, y0 + h);
      waterDrop(g, x0 + 70, y0 + 88, 28, 1);
      onprop(function () {
        txt(g, APPLE.alert[0], x0 + 124, y0 + 76, 64, INK, 'left', 900, DISP, w - 150, 1, 44, 'condensed');
        txt(g, APPLE.alert[1], x0 + 124, y0 + 146, 64, INK, 'left', 900, DISP, w - 150, 1, 44, 'condensed');
        tag(g, 'RE-CREATED', x0 + 140, y0 + h - 52, 1, 0, 250, INK, SCRW, 36);
        txt(g, 'APPLE', x0 + w - 36, y0 + h - 52, 36, '#5d564c', 'right', 800, DISP, 140, 1, 36, 'condensed');
      });
      g.restore(); EXITING = exa;
      /* a leader from the phone's alert to the card */
      g.save(); g.strokeStyle = 'rgba(244,237,224,.7)'; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(CK.x + 132, CK.y - 40); g.lineTo(lerp(CK.x + 132, x0 - 6, k), lerp(CK.y - 40, y0 + 150, k)); g.stroke(); g.setLineDash([]); g.restore();
      /* the scope, big and cream, with the alert */
      var sa = seg(t, K.liquid + .02, K.liquid + .1);
      APPLE.scope.forEach(function (L, i) { txt(g, L, 704, y0 + h + 44 + i * 50, 46, CREAM, 'center', 900, DISP, 430, sa, 40, 'condensed'); });
    }
    /* "Still wet.": the alert's drop falls to the lower third on "Still" and spreads into a puddle on "wet"; the pop pulses it.
       No chip: the caption says it, and the wipe to the bowl comes early so the question plays over the bowl */
    var fd = seg(t, K.still - .06, K.still + .22);
    if (fd > 0) {
      var exd = EXITING; if (fd < 1) EXITING = true;
      var wetW = at('check', 'wet.'), sp2 = eout(seg(t, wetW - .04, wetW + .3)), pp = 1 + .06 * Math.sin(Math.PI * seg(t, K.PL - .02, K.PL + .2));
      g.save(); g.translate(704, 1310); g.scale(pp, pp);
      g.fillStyle = 'rgba(159,208,238,.85)'; el(g, 0, 40, 40 + 110 * sp2, 10 + 16 * sp2);
      g.fillStyle = 'rgba(230,244,252,.7)'; el(g, -20 - 40 * sp2, 36, 14 + 30 * sp2, 3 + 4 * sp2);
      prop(g, 'puddle', -150, 24, 150, 66);
      g.restore();
      var dy = lerp(782, 1290, fd * fd);
      if (fd < 1) waterDrop(g, 558 + (704 - 558) * fd, dy, 34, 1); else waterDrop(g, 704, 1290 - 10 * (1 - sp2), 34 * (1 - .6 * sp2), 1 - sp2 * .7);
      EXITING = exd;
    }

  }

  /* =====================================================================================================
     THE END CARD: frame 0's bowl and words, YES / NO, the phone drops back into frame 0's pose
     ===================================================================================================== */
  function endScene(g, t) {
    var tt = t - TEND + 1 / 30;
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { wallBg(g, tt, 0); return; }
    var ct = t - TEND + 1 / 60, p = f0(ct), ph = { x: p.x, y: p.y, rot: p.rot, wet: 1, t: t, name: 'phone', edge: 1, pg: pgPhase(t) };
    bowl(g, t, FOOT.x, FOOT.y, 1, 0, ph, { streamTop: STREAM_TOP - (FOOT.y - BOWL_H), dens: 24 });
    title0(g);
    var yo = eio(seg(t, TEND - .12, TEND - .03));
    [['YES', 300], ['NO', 720]].forEach(function (cc) {
      var tq0 = cc[0] === 'YES' ? K.yesE : K.noE, tp = Math.sin(Math.PI * seg(t, tq0 - .03, tq0 + .15)), kc = eout(seg(t, K.riceE - .12, K.riceE)), sc = lerp(1.08, 1, kc) * (1 - .07 * tp) * (1 - yo);
      if (sc <= .01 || kc <= 0) return;
      var oc = ONPROP, ex0 = EXITING; ONPROP = true; EXITING = ex0 || yo > 0 || kc < 1;
      chip(g, cc[0], cc[1], 1290 + 8 * tp + 6 * Math.sin(t * 4.2 + (cc[0] === 'YES' ? 0 : 2.1)) * kc, { px: 112, wt: 900, bg: BG, line: CREAM, lw: 8, fg: CREAM, w: 250, h: 160, r: 54, shadow: true, a: kc * (1 - seg(yo, .5, .9)), s: sc, maxw: 250 });
      ONPROP = oc; EXITING = ex0;
    });
  }

  /* ---------- captions ---------- */
  var CAPGROUPS = { hook: [[2, 4]], belief: [[2, 3], [2]], ask: [[3, 3]], page: [[3, 5]], list: [[2], [3]], rice: [[5]], twist: [[3], [4]], dip: [[2, 2], [4]], tap: [[3, 3], [2]], air: [[3], [2, 2]], day: [[3], [4]], check: [[2], [3], [2], [2]], end: [[3, 3], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', "Don't"], ['belief', 'Classic'], ['ask', 'no?'], ['page', 'not'], ['list', 'heat.'], ['list', 'swabs.'], ['rice', 'rice.'], ['twist', 'damage'], ['dip', 'corrode'], ['tap', 'down.'], ['air', 'airflow.'], ['day', 'day.'], ['check', 'wet.'], ['end', 'rice?']]
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
    var o1 = !nx ? Math.min(card0.t1 + .3, TEND - .08) : keep ? ns - .04 : Math.min(card0.t1 + .5, ns - .04), o0 = o1 - .1;
    /* a card never rides over the next scene's tear; it is gone as the tear starts */
    SC.forEach(function (Sc) { var tr = Sc.t0 - (Sc.tw || 0); if (tr > s + .3 && tr < ns && tr + .06 < o1) { o1 = tr + .06; o0 = o1 - .1; } });
    var fi = seg(t, s, s + .08), out = 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - s, 3.2, .8), 0, 1.04);
    g.save(); var cpx = CAPPX; font(g, cpx, 800, DISP, 'semi-expanded');
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = cpx * .3, maxw = 820, lines = [], lw, wi = 0;
    card0.split.forEach(function (n) { var ln = [], w = 0; for (var j = 0; j < n; j++, wi++) { if (w + ws[wi] > maxw && ln.length) { lines.push(ln); ln = []; w = 0; } ln.push(wi); w += ws[wi] + gap; } lines.push(ln); });
    lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    var lh = cpx * 1.18, y0 = 308 + cpx * .9;
    g.globalAlpha = fi * out * (alpha == null ? 1 : alpha);
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
  var NOISE, SCENES = { bowlScene: bowlScene, portScene: portScene, dryScene: dryScene, checkScene: checkScene, endScene: endScene };
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(56,78,108,.2)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function safeClip(g) { g.beginPath(); g.rect(SAFE_BOX.x0, SAFE_BOX.y0, SAFE_BOX.x1 - SAFE_BOX.x0, SAFE_BOX.y1 - SAFE_BOX.y0); g.clip(); }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  var LAYER = 'fg';
  function drawScene(g, Sc, t, layer) { var o = LAYER; LAYER = layer || 'fg'; g.save(); SCENES[Sc.fn](g, t); g.restore(); LAYER = o; }
  var LCV = null, LCTX = null, FADE = null, PCV = null, PCTX = null, PFADE = null;
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
  function roll(g, xb, t) {
    var w = 440, x0 = xb - w / 2, n = 40, r = mulberry(4401), L = [], R = [];
    for (var i = 0; i <= n; i++) { L.push(14 * r() + 6 * Math.sin(i * 1.7)); R.push(14 * r() + 6 * Math.sin(i * 2.3)); }
    function edge(off, sh) {
      g.beginPath(); for (var i = 0; i <= n; i++) g.lineTo(x0 + L[i] + off, -20 + (H + 40) * i / n + sh);
      for (i = n; i >= 0; i--) g.lineTo(x0 + w - R[i] + off, -20 + (H + 40) * i / n + sh); g.closePath();
    }
    g.fillStyle = 'rgba(0,0,0,.45)'; edge(-22, 0); g.fill();
    g.fillStyle = '#e9e1cf'; edge(-4, 0); g.fill();
    g.fillStyle = SLATE; edge(4, 0); g.fill();
    edge(4, 0); g.save(); g.clip(); grainIn(g, x0, 0, w, H, 4402, 1.3);
    g.fillStyle = SLATE2; g.fillRect(x0 + 44, 0, 8, H); g.fillRect(x0 + w - 52, 0, 8, H); g.restore();
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var wk = Nx ? seg(te, Nx.t0 - (Nx.tw || .4), Nx.t0) : 0;
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
    var cst = 1 + .15 * (t < K.page + 1 ? 1 - seg(t, K.page - .15, K.page + .25) : seg(t, S('end').t0 - .35, S('end').t0));
    if (cst > 1.002) { if (!CCV) { CCV = mk(W, H); CCX = CCV.getContext('2d'); } CCX.clearRect(0, 0, W, H); CCX.drawImage(g.canvas, 0, 0); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'contrast(' + cst.toFixed(3) + ')'; g.drawImage(CCV, 0, 0); g.restore(); }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor((t > TEND - 1 / 30 ? t - TEND + 1 / 30 : t) * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null, CCV = null, CCX = null;
  function posterTitle(g) {
    g.save(); font(g, 54, 800, DISP, 'semi-expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('Don’t put your iPhone in rice.', CX, 310);
    var b = 'Apple: rice bits could damage it.', bp = 52, by = 392; font(g, bp, 800, DISP, 'expanded');
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, by - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, by); g.restore();
  }
  function TEXTS(t) {
    REC = {}; frame(tctx, t); var r = REC; REC = null;
    return Object.keys(r).map(function (k) { return { id: k, text: k, x0: 0, y0: 0, x1: 0, y1: 0 }; });
  }
  /* ---------- events: hits sit between words, never on them ---------- */
  var EV = [];
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
  var GAIN = { hk: .02, cf: .025, wn: .025, pg: .025, bg: .005, tw: .005, rs: .03, tk: .012, ar: .025, ck: .025, pl: .02 };   // measured: r1 hits sat at the limiter ceiling with the voice; cut 12-14 dB so every hit is >= 3 dB under the voice by peak and 50 ms RMS in the final mix
  var TYPE = { hk: 'pour', cf: 'tick', wn: 'tick', pg: 'tick', bg: 'slap', tw: 'thump', rs: 'click', tk: 'knock', ar: 'tick', ck: 'tick', pl: 'pop' };
  function initTimes() {
    Object.keys(TYPE).forEach(function (n) { if (GT[n] != null) EV.push({ t: +GT[n].toFixed(3), type: TYPE[n], g: GAIN[n], id: n, t1: +(GT[n] + BODY[TYPE[n]]).toFixed(3) }); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (t < 2 / (fps || 30) - 1e-6 || t > TEND - .2) samples = 1;   /* frame 0 and the frames into the loop: sharp */
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
    /* THE hit: a rubber stamp slammed on paper; a body where a phone speaker still plays and a 1.5–2.9 kHz paper slap */
    function stampThump(t, g, lb) {
      g = g || 1; lb = lb == null ? 1 : lb;
      var o = osc('sine', 230, t, t + .2, 1, [[t, 0], [t + .012, .3 * g * lb], [t + .12, .26 * g * lb], [t + .19, 0]], .05); o.frequency.exponentialRampToValueAtTime(160, t + .18);
      osc('triangle', 330, t, t + .14, 1, [[t, 0], [t + .004, .22 * g * Math.sqrt(lb)], [t + .06, .15 * g * Math.sqrt(lb)], [t + .13, 0]], .03);
      band(t, .16, 1500, .8, 5.2 * g, .006, .05);
      band(t, .11, 2400, 1.0, 3.6 * g, .004, .03);
      band(t + .001, .18, 1900, .6, 5.0 * g, .008, .04);
      band(t + .012, .07, 2900, 1.4, 2.2 * g, .002, .02);
    }
    function slapS(t, g) { g = g || 1; band(t, .06, 1600, .7, 5.5 * g, .001, .04); band(t, .03, 2800, 1.2, 3 * g, .001, .02); paperHit(t, g * 1.2); }
    function paperHit(t, g) { band(t, .035, 1300, 1.1, 4.2 * g, .0008, .01); band(t + .004, .03, 2200, 1.3, 3.6 * g, .0008, .01); band(t + .009, .022, 2900, 1.6, 2.2 * g, .0008, .01); }
    function knockS(t, g) {
      g = g || 1;
      osc('triangle', 360, t, t + .13, 1, [[t, 0], [t + .003, .5 * g], [t + .05, .25 * g], [t + .12, 0]], .03);
      osc('sine', 2650, t, t + .07, 1, [[t, 0], [t + .002, .35 * g], [t + .06, 0]], .02);
      band(t, .05, 1900, 1.2, 3.2 * g, .001, .03);
      band(t, .025, 2600, 1.4, 2.4 * g, .001, .02);
      paperHit(t, g);
    }
    function clickS(t, g) { g = g || 1; band(t, .018, 2300, 2, 5 * g, .0008, .01); band(t + .03, .02, 1700, 2, 3 * g, .0008, .01); osc('sine', 3100, t, t + .04, 1, [[t, 0], [t + .001, .25 * g], [t + .035, 0]], .01); }
    function tickS(t, g) { g = g || 1; band(t, .03, 3000, 1.6, 3.5 * g, .001, .02); band(t, .04, 1400, 1.5, 1.2 * g, .001, .02); }
    /* rice grains rattling into a bowl: a dry patter of short 1.4–3.6 kHz ticks, no ring-out */
    function pourS(t, g) {
      g = g || 1; var r2 = mulberry(131), tt = t;
      for (var i = 0; i < 16; i++) { band(tt, .012, 1400 + r2() * 2200, 2, (1.4 + r2() * 1.8) * g * (1 - i / 22), .0008, 0, -.4 + r2() * .8); tt += .006 + r2() * .012; }
    }
    function popS(t, g) { g = g || 1; var o = osc('sine', 520, t, t + .1, 1, [[t, 0], [t + .003, .4 * g], [t + .09, 0]], .02); o.frequency.exponentialRampToValueAtTime(260, t + .09); paperHit(t, g * .9); }
    EV.forEach(function (e) {
      if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'thump') stampThump(e.t, e.g, .2);
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'knock') knockS(e.t, e.g);
      else if (e.type === 'click') clickS(e.t, e.g);
      else if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'pour') pourS(e.t, e.g);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o);
      env(o.gain, [[0, ROOM], [DUR, ROOM]]); })();
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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°º×−≈≠µ“”‘’·→…#?‹›✓✕–@!>$(),:§+/=½~↓'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {}; mkMound();
      window.READY = true;
    });
  }
  initTimes();
  var HOLD = { t0: K.damage, t1: K.dip };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, TEND: TEND, POSTER: Math.round((K.TW + .3) * 30) / 30 + 1 / 60, SLUG: 'rice', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
