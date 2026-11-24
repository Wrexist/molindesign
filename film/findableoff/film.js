/* "Turned off? Your iPhone's still findable." — Factory #41 (findableoff) on Tech, explained, after ../rice/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   All cut paper on a dim tufted sofa at night: one big generic phone (round punch-hole, no logo) is the thread, from its
   re-created POWER OFF slider on frame 0, dark in the cushions, to the re-created Settings screen and back. Apple's guide
   card (re-created), helper devices on tables and in a bag (no people), a paper map with a soft circle, one paper switch.
   Props stay whole inside x 92–928, y 302–1428. */
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
     APPLE'S STRINGS (one block, so a correction is one edit). BRIEF.md §3, both read by curl 2026-11-24:
     A. Apple iPhone User Guide, "Add your iPhone to Find My":
       "On a supported iPhone, turning on the Find My network allows you to locate your iPhone for up to 24 hours
        after it's turned off, or up to 5 hours when it's in power reserve mode." · "Settings > [your name] > Find My."
       "Tap Find My iPhone, then turn on Find My iPhone."
     B. Apple Support 102648, "How to turn on Find My on your iPhone, iPad, or Mac" (Published Date: September 14, 2026):
       "…a crowdsourced network of over a billion Apple devices that use Bluetooth technology to detect the location of an
        accessory or device, and report their approximate location back to the owner. It's all anonymous and encrypted…"
     ===================================================================================================== */
  var APPLE = {
    guide: 'APPLE iPHONE USER GUIDE', title: 'ADD YOUR iPHONE TO FIND MY',
    scope: 'ON A SUPPORTED iPHONE',
    q1: ['“…ALLOWS YOU TO LOCATE', 'YOUR iPHONE…”'],
    stamp: 'UP TO\n24 HOURS', after: 'AFTER IT’S TURNED OFF', reserve: ['UP TO 5 HOURS IN', 'POWER RESERVE MODE'],
    billion: ['“…OVER A BILLION', 'APPLE DEVICES…”'], credit: 'APPLE SUPPORT',
    approx: 'APPROXIMATE LOCATION', bt: 'BLUETOOTH · ANONYMOUS · ENCRYPTED',
    net: 'FIND MY NETWORK', only: 'ONLY IF FIND MY NETWORK IS ON',
    rows: { fmi: 'Find My iPhone', fmn: 'Find My network', sll: 'Send Last Location', fm: 'Find My' }
  };
  var K = {
    hook: start('hook'), offH: at('hook', 'off?'), your: at('hook', 'Your'), findable: at('hook', 'findable.'), hookEnd: lend('hook'),
    ask: start('ask'), findA: at('ask', 'find'), offA: at('ask', 'off?'), askEnd: lend('ask'),
    lost: start('lost'), lose: at('lost', 'lose'), switched: at('lost', 'switched'), lostEnd: lend('lost'),
    gone: start('gone'), wifi: at('gone', 'Wi-Fi.'), no2: at('gone', 'No', 1), cell: at('gone', 'cellular.'), looks: at('gone', 'Looks'), goneW: at('gone', 'gone.'), goneEnd: lend('gone'),
    twist: start('twist'), appleT: at('twist', 'Apple'), supported: at('twist', 'supported'), located: at('twist', 'located.'), twEnd: lend('twist'),
    hours: start('hours'), upH: at('hours', 'up'), h24: at('hours', '24'), after: at('hours', 'after'), hoursEnd: lend('hours'),
    network: start('network'), billion: at('network', 'billion'), devices: at('network', 'devices'), netEnd: lend('network'),
    relay: start('relay'), spot: at('relay', 'spot'), bluetooth: at('relay', 'Bluetooth'), report: at('relay', 'report'), back: at('relay', 'back.'), relayEnd: lend('relay'),
    dip: start('dip'), needs: at('dip', 'needs'), sw: at('dip', 'switch'), called: at('dip', 'called'), dipEnd: lend('dip'),
    path: start('path'), settings: at('path', 'Settings,'), yourN: at('path', 'your'), findP: at('path', 'Find'), pathEnd: lend('path'),
    toggle: start('toggle'), tap: at('toggle', 'Tap'), findT: at('toggle', 'Find'), turn: at('toggle', 'Turn'), both: at('toggle', 'both'), switches: at('toggle', 'switches'), onT: at('toggle', 'on.'), togEnd: lend('toggle'),
    end: start('end'), onE: at('end', 'on?'), yesE: at('end', 'Yes'), noE: at('end', 'no.'), noEnd: wend('end', 'no.')
  };
  (function () {
    place('pw', 'knock', K.hookEnd + .3, .2, K.hookEnd, K.ask);        /* the screen dies: a soft paper knock */
    place('sb', 'tick', K.askEnd + .3, .2, K.askEnd, K.lost);          /* the search is pressed */
    place('cu', 'knock', K.lostEnd + .3, .2, K.lostEnd, K.gone);       /* the phone lands in the cushions */
    place('gn', 'tick', K.goneEnd + .3, .2, K.goneEnd, K.twist);       /* the "?" pin pops away */
    place('tw', 'thump', K.hoursEnd + .3, .2, K.hoursEnd, K.network);  /* UP TO 24 HOURS, the hero stamp, punched */
    place('bl', 'pop', K.relayEnd + .3, .2, K.relayEnd, K.dip);        /* the blip lands in the circle */
    place('sw', 'click', K.dipEnd + .3, .1, K.dipEnd, K.path - .35);   /* everything goes grey */
    place('pt', 'tick', K.pathEnd + .3, .14, K.pathEnd, K.toggle);      /* the Find My row pressed */
    place('tg', 'click', K.togEnd + .3, .2, K.togEnd, K.end);          /* the second switch seats */
  })();
  function gt(n, d) { return GT[n] != null ? GT[n] : d; }
  K.PW = gt('pw', K.hookEnd + .3); K.SB = gt('sb', K.askEnd + .3); K.CU = gt('cu', K.lostEnd + .3); K.GN = gt('gn', K.goneEnd + .3);
  K.TW = gt('tw', K.hoursEnd + .3); K.BL = gt('bl', K.relayEnd + .3); K.SW = gt('sw', K.dipEnd + .3); K.PT = gt('pt', K.pathEnd + .3); K.TG = gt('tg', K.togEnd + .3);
  var SC = [
    { id: 'room', fn: 'roomScene', name: 'Turned off? Still findable', t0: 0 },
    { id: 'settings', fn: 'settingsScene', name: 'Check yours', t0: K.path - .05, tw: .3 },
    { id: 'end', fn: 'endScene', name: 'Were yours on?', t0: K.end - .06, tw: .35, dir: -1 }
  ];
  var SHOTS;
  var TEND = Math.round(DUR * 30) / 30;                    /* frame 0 of the next loop sits at TEND */
  var RP = 1.2, RLIFE = 2.3, RING0 = 1.0;   /* the beacon starts at 1.0 s */                                /* a ring leaves the phone every 1.2 s and lives 2.3 s */

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
  var NOMEASURE = { 'phone in sofa': 1, 'cushion L': 1, 'cushion R': 1 };   /* the phone's foot is down in the cushions: only the part above them is measured */
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

  function mixc(a, b, k) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(lerp(a[i], b[i], clamp(k, 0, 1))); }).join(',') + ')'; }
  function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }

  /* ---------- the backgrounds: flat paper grounds, one tone per act (A plum, B teal, C night indigo, Settings ochre),
     with three torn sheets drifting at the edges and a cached paper grain (jury r1: no more navy tufting) ---------- */
  var TA = [hex('#3e2c31'), hex('#523a40'), hex('#2a1d22')], TB = [hex('#1d3a39'), hex('#2a504d'), hex('#142928')],
      TC = [hex('#23284a'), hex('#323862'), hex('#171a31')], TS = [hex('#4a3423'), hex('#5e4630'), hex('#32241a')];
  function mixT(A, B, k) { return A.map(function (a, i) { return a.map(function (v, j) { return lerp(v, B[i][j], clamp(k, 0, 1)); }); }); }
  function rgbs(a) { return 'rgb(' + a.map(Math.round).join(',') + ')'; }
  function roomTone(t) { return mixT(mixT(TA, TB, seg(t, K.twist - .1, K.twist + .4)), TC, seg(t, K.network - .3, K.network + .4)); }
  var GRAIN = null, SHEETS = null;
  function mkGrain() {
    var c = mk(W + 300, H + 300), g = c.getContext('2d'), r = mulberry(613);
    g.beginPath(); g.rect(0, 0, c.width, c.height); grainIn(g, 0, 0, c.width, c.height, 612, .7);
    g.lineCap = 'round'; g.lineWidth = 1.5;
    for (var i = 0; i < 520; i++) { var x = r() * c.width, y = r() * c.height, a = r() * 6.283, l = 10 + r() * 26; g.strokeStyle = r() < .5 ? 'rgba(255,240,220,.05)' : 'rgba(0,0,0,.07)'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .5) * l * .5, y + Math.sin(a + .5) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    GRAIN = c;
    function torn(pts, seed) {
      var r2 = mulberry(seed), out = [];
      for (var i = 0; i < pts.length; i++) { var p = pts[i], q = pts[(i + 1) % pts.length], n = Math.max(2, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / 22)); for (var j = 0; j < n; j++) out.push([lerp(p[0], q[0], j / n) + (r2() - .5) * 8, lerp(p[1], q[1], j / n) + (r2() - .5) * 8]); }
      return out;
    }
    SHEETS = [
      { p: torn([[-200, 1250], [420, 1330], [1300, 1210], [1300, 2300], [-200, 2300]], 621), d: [14, .13, 0] },
      { p: torn([[-200, -100], [230, -100], [130, 880], [-200, 1000]], 622), d: [10, .17, 1.3] },
      { p: torn([[1300, 100], [880, 220], [952, 1040], [1300, 1120]], 623), d: [12, .11, 2.4] }
    ];
  }
  function paperBg(g, ct, T) {
    if (!GRAIN) mkGrain();
    g.fillStyle = rgbs(T[0]); g.fillRect(-400, -300, W + 800, H + 600);
    SHEETS.forEach(function (sh) {
      g.save(); g.translate(sh.d[0] * Math.sin(ct * sh.d[1] + sh.d[2]), sh.d[0] * .6 * Math.cos(ct * sh.d[1] * .8 + sh.d[2]));
      g.save(); g.translate(5, 9); g.fillStyle = 'rgba(0,0,0,.22)'; poly(g, sh.p); g.fill(); g.restore();
      g.fillStyle = rgbs(T[1]); poly(g, sh.p); g.fill();
      g.restore();
    });
    g.drawImage(GRAIN, -150, -150);   /* static grain: it moves with nothing, so it costs no bitrate */
  }
  var STG = TA[2];

  /* =====================================================================================================
     THE PHONE (generic: dark body, round punch-hole, no notch, no logo)
     ===================================================================================================== */
  function phone(g, cx, cy, w, h, rot, o) {
    o = o || {}; var rad = w * .13;
    g.save(); g.translate(cx, cy); g.rotate(rot || 0); g.translate(-w / 2, -h / 2);
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 10, 14, w, h, rad); g.fill();
    g.fillStyle = '#2a313d'; rr(g, 0, 0, w, h, rad); g.fill();
    rr(g, 0, 0, w, h, rad); grainIn(g, 0, 0, w, h, 7401, .8);
    g.strokeStyle = 'rgba(244,237,224,.4)'; g.lineWidth = 3; rr(g, 0, 0, w, h, rad); g.stroke();
    g.fillStyle = '#3a4452'; rr(g, w - 4, h * .22, 12, h * .14, 5); g.fill();
    prop(g, o.name || 'phone', 0, 0, w, h);
    var m = Math.max(10, w * .035), S = { x: m, y: m, w: w - 2 * m, h: h - 2 * m };
    g.save(); rr(g, S.x, S.y, S.w, S.h, rad - m * .6); g.clip();
    var off = o.off == null ? 1 : o.off;
    if (off < 1 && o.draw) o.draw(g, S);
    if (off > 0) {   /* off: near-black glass with one faint glare */
      g.save(); g.globalAlpha *= off; g.fillStyle = '#090c11'; g.fillRect(S.x, S.y, S.w, S.h);
      g.fillStyle = 'rgba(255,255,255,.045)'; poly(g, [[S.x + S.w * .55, S.y], [S.x + S.w * .8, S.y], [S.x + S.w * .2, S.y + S.h], [S.x - S.w * .05, S.y + S.h]]); g.fill();
      if (o.sheen > 0) {   /* a diagonal glass sheen (cream, 8 %) and a faint coral standby dot: dark, but still alive */
        g.fillStyle = 'rgba(244,237,224,' + (.08 * o.sheen).toFixed(3) + ')'; poly(g, [[S.x + S.w * .05, S.y], [S.x + S.w * .42, S.y], [S.x - S.w * .1, S.y + S.h * .62], [S.x - S.w * .1, S.y + S.h * .2]]); g.fill();
        g.fillStyle = 'rgba(255,91,61,' + (o.sheen * (.35 + .2 * Math.sin(CURT * 3.1))).toFixed(3) + ')'; el(g, S.x + S.w * .5, S.y + S.h * .93, w * .016, w * .016);
      }
      g.restore();
    }
    g.restore();
    g.fillStyle = '#05080b'; el(g, w / 2, m + w * .07, w * .034, w * .034);   /* round punch-hole */
    g.restore();
  }
  /* the power-off screen (re-created, generic): a dimmed light wallpaper and one POWER OFF slider; knob 0..1 */
  function powerScreen(g, S, knob, tagA) {
    /* drawn sideways: on frame 0 the phone lies in landscape, so the slider runs along the long side (track 650 px) */
    g.save(); g.translate(S.x + S.w / 2, S.y + S.h / 2); g.rotate(Math.PI / 2);
    var L = { x: -S.h / 2, y: -S.w / 2, w: S.h, h: S.w };
    /* a flat paper wallpaper: a pale sky, a sun disc, two cut hills (no blur) */
    g.fillStyle = '#ecd2ab'; g.fillRect(L.x, L.y, L.w, L.h);
    g.fillStyle = '#f7e6c4'; el(g, L.x + L.w * .8, L.y + L.h * .62, L.h * .2, L.h * .2);
    g.fillStyle = '#d39a6f'; poly(g, [[L.x, L.y + L.h * .7], [L.x + L.w * .3, L.y + L.h * .52], [L.x + L.w * .62, L.y + L.h * .74], [L.x + L.w, L.y + L.h * .6], [L.x + L.w, L.y + L.h], [L.x, L.y + L.h]]); g.fill();
    g.fillStyle = '#9c5e4a'; poly(g, [[L.x, L.y + L.h * .86], [L.x + L.w * .45, L.y + L.h * .78], [L.x + L.w, L.y + L.h * .9], [L.x + L.w, L.y + L.h], [L.x, L.y + L.h]]); g.fill();
    g.fillStyle = 'rgba(24,18,22,.3)'; g.fillRect(L.x, L.y, L.w, L.h);
    var sw = L.w * .82, sh = 112, sx = L.x + (L.w - sw) / 2, sy = L.y + L.h * .14, kr = sh / 2 - 8;
    g.fillStyle = 'rgba(28,24,30,.66)'; rr(g, sx, sy, sw, sh, sh / 2); g.fill();
    var kx = sx + 8 + kr + clamp(knob, 0, 1) * (sw - 16 - 2 * kr), ky = sy + sh / 2;
    var la = 1 - seg(knob, .62, .8);
    onprop(function () { txt(g, 'POWER OFF', sx + sw * .74, ky + 2, 60, CREAM, 'center', 800, DISP, sw * .42, la, 40, 'condensed'); });
    g.fillStyle = 'rgba(0,0,0,.3)'; el(g, kx + 3, ky + 4, kr, kr);
    g.fillStyle = CREAM; el(g, kx, ky, kr, kr);
    g.strokeStyle = '#c94a32'; g.lineWidth = kr * .16; g.lineCap = 'round';
    g.beginPath(); g.arc(kx, ky + kr * .06, kr * .44, -Math.PI / 2 + .62, -Math.PI / 2 - .62 + 2 * Math.PI); g.stroke();
    g.beginPath(); g.moveTo(kx, ky - kr * .5); g.lineTo(kx, ky - kr * .05); g.stroke();
    if (tagA > 0) onprop(function () { tag(g, 'RE-CREATED', L.x + L.w / 2, L.y + L.h * .8, tagA, 0, 300, CREAM, '#1c1a20', 36); });
    g.restore();
  }
  /* the knob is dragged at a steady speed from frame 0 (about 300 px) and reaches the end just before "off?";
     ct < 0 (the end card) runs the same line backwards, so the drag into frame 0 has no bump */
  var KNOB0 = .44;
  function knobAt(ct) { var v = (1 - KNOB0) / Math.max(.3, K.offH - .08); return clamp(KNOB0 + v * ct, 0, 1); }
  /* frame 0's pose: the phone lies sideways; once the screen dies it turns upright (0.6-1.45 s) */
  var PW = 400, PH = 820, REST = { x: 510, y: 1000, rot: 0 }, P0 = { x: 510, y: 950, rot: -Math.PI / 2 + .03 }, ROT0 = .6, SINK = 1.45;
  function f0(ct) {
    var k = ct <= 0 ? 0 : eio(seg(ct, ROT0, SINK));
    return { x: lerp(P0.x, REST.x, k), y: lerp(P0.y, REST.y, k), rot: lerp(P0.rot, REST.rot, k) };
  }
  function title0(g, a) { txt(g, 'OFF = GONE?', 510, 516, 116, CREAM, 'center', 900, DISP, 800, a == null ? 1 : a, 60, 'condensed'); }

  /* the beacon: a cream ring leaves the dark phone every RP s from "findable"; tf freezes them (the switch) */
  function ringK(t, tf) {
    if (t < RING0) return [];
    var te = Math.min(t, tf == null ? 1e9 : tf), out = [];
    var n1 = Math.floor((te - RING0) / RP), n0 = Math.max(0, Math.ceil((te - RLIFE - RING0) / RP));
    for (var n = n0; n <= n1; n++) { var k = (te - (RING0 + n * RP)) / RLIFE; if (k >= 0 && k < 1) out.push(k); }
    return out;
  }
  function rings(g, cx, cy, t, r0, r1, a, tf) {
    if (a <= 0) return;
    var fa = tf == null ? 1 : 1 - seg(t, tf, tf + 1.1); if (fa <= 0) return;
    var base = g.globalAlpha;
    g.save(); g.strokeStyle = CREAM;
    ringK(t, tf).forEach(function (k) { var r = lerp(r0, r1, eout(k)); g.globalAlpha = base * a * fa * Math.pow(1 - k, 1.3) * .8; g.lineWidth = lerp(16, 5, k); g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.stroke(); });
    g.restore();
  }
  function ringHit(t, d, r0, r1, tf) { var h = 0; ringK(t, tf).forEach(function (k) { var r = lerp(r0, r1, eout(k)); h = Math.max(h, 1 - Math.abs(r - d) / 70); }); return clamp(h, 0, 1); }

  /* =====================================================================================================
     THE SOFA: two seat cushions with a crease where the phone slips in; a back and arms show when we pull back
     ===================================================================================================== */
  var CT = 1196;
  function cushionTop(x, x0, x1, dip) { return CT - 30 * Math.sin(Math.PI * clamp((x - x0) / (x1 - x0), 0, 1)) + dip * Math.exp(-Math.pow((x - 510) / 80, 2)); }
  function cushion(g, x0, x1, dip, seed, name) {
    g.beginPath(); g.moveTo(x0, 1428);
    for (var x = x0; x <= x1 + .1; x += 8) { var e = Math.min(x - x0, x1 - x) < 30 ? 30 - Math.sqrt(Math.max(0, 900 - Math.pow(30 - Math.min(x - x0, x1 - x), 2))) : 0; g.lineTo(x, cushionTop(x, x0, x1, dip) + e); }
    g.lineTo(x1, 1428); g.closePath();
    g.fillStyle = '#9a5b42'; g.fill();
    g.save(); g.clip();
    var gr = g.createLinearGradient(0, CT - 40, 0, CT + 70); gr.addColorStop(0, '#bb7a55'); gr.addColorStop(1, 'rgba(154,91,66,0)'); g.fillStyle = gr; g.fillRect(x0, CT - 40, x1 - x0, 110);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x0, 1330, x1 - x0, 100);
    g.beginPath(); g.rect(x0, CT - 40, x1 - x0, 1428 - CT + 40); grainIn(g, x0, CT - 40, x1 - x0, 1428 - CT + 40, seed, .9);
    g.restore();
    g.strokeStyle = 'rgba(244,237,224,.28)'; g.lineWidth = 4; g.beginPath();
    for (x = x0 + 24; x <= x1 - 24; x += 8) { var y = cushionTop(x, x0, x1, dip) + 16; if (x === x0 + 24) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke();
    prop(g, name, x0, CT - 32, x1, 1428);
  }
  function sofaBack(g, a) {   /* only seen pulled back: a tufted back and two arms around the seat (core coords) */
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = '#7e4936'; rr(g, 40, 650, 1000, 600, 90); g.fill();
    for (var i = 0; i < 4; i++) for (var j = 0; j < 2; j++) { var bx = 190 + i * 230 + (j ? 115 : 0), by = 800 + j * 170; if (bx > 960) continue; g.fillStyle = '#5a3324'; el(g, bx, by, 13, 13); }
    g.fillStyle = '#9a5b42'; rr(g, -60, 1000, 170, 428, 60); g.fill(); rr(g, 970, 1000, 170, 428, 60); g.fill();
    g.fillStyle = '#2b1d18'; g.fillRect(60, 1428, 40, 70); g.fillRect(980, 1428, 40, 70);
    g.restore();
  }

  /* the Wi-Fi fan and the cellular bars, drawn in cream; `k` strikes them out */
  function wifiIcon(g, x, y, s, a, k) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -96, -96, 200, 200, 40); g.fill();
    g.fillStyle = '#26303d'; rr(g, -100, -100, 200, 200, 40); g.fill();
    g.strokeStyle = CREAM; g.lineCap = 'round'; g.lineWidth = 16;
    [62, 40, 18].forEach(function (r) { g.beginPath(); g.arc(0, 42, r, -Math.PI * .78, -Math.PI * .22); g.stroke(); });
    g.fillStyle = CREAM; el(g, 0, 42, 11, 11);
    prop(g, 'wifi icon', -100, -100, 100, 100);
    strikeX(g, k);
    g.restore();
  }
  function cellIcon(g, x, y, s, a, k) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -96, -96, 200, 200, 40); g.fill();
    g.fillStyle = '#26303d'; rr(g, -100, -100, 200, 200, 40); g.fill();
    g.fillStyle = CREAM; for (var i = 0; i < 4; i++) { var bh = 26 + i * 22; rr(g, -62 + i * 34, 58 - bh, 22, bh, 5); g.fill(); }
    prop(g, 'cell icon', -100, -100, 100, 100);
    strikeX(g, k);
    g.restore();
  }
  function strikeX(g, k) { if (k <= 0) return; g.strokeStyle = HOTSTRIKE; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); g.moveTo(-78, -78); g.lineTo(lerp(-78, 78, k), lerp(-78, 78, k)); g.stroke(); }
  var HOTSTRIKE = '#f4ede0';
  /* the "?" pin that floats up and fades on "gone" */
  function qPin(g, x, y, a, sc) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(sc || 1, sc || 1);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(4, -56, 58, Math.PI * .8, Math.PI * .2); g.lineTo(4, 50); g.closePath(); g.fill();
    g.fillStyle = CREAM; g.beginPath(); g.arc(0, -60, 58, Math.PI * .8, Math.PI * .2); g.lineTo(0, 44); g.closePath(); g.fill();
    prop(g, 'pin', -58, -118, 58, 44);
    var nr = NOREC; NOREC = true; txt(g, '?', 0, -58, 84, INK, 'center', 900, DISP, 0, 1, 60, 'condensed'); NOREC = nr;   /* an icon, not a read */
    g.restore();
  }
  /* the search bar (re-created), typed in */
  var QUERY = 'FIND iPHONE WHEN OFF';
  function searchBar(g, x, y, t, t0, out) {
    var sa = seg(t, t0, t0 + .12) * (1 - out);
    if (sa <= 0 || !LIVE.text) return;
    var w = 780, h = 96, x0 = x - w / 2, y0 = y - h / 2, eo = eio(out);
    g.save(); g.globalAlpha *= sa; g.translate(-120 * eo, 0);
    var ex = EXITING; if (sa < 1 || eo > 0) EXITING = true;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 8, y0 + 10, w, h, 48); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 48); g.fill();
    prop(g, 'search bar', x0, y0, x0 + w, y0 + h);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(x0 + 50, y - 6, 16, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(x0 + 62, y + 6); g.lineTo(x0 + 76, y + 20); g.stroke();
    var k = seg(t, t0 + .04, t0 + .6), n = Math.round(QUERY.length * k), typing = k > 0 && k < 1, nr = NOREC; NOREC = nr || typing;
    onprop(function () { if (n) txt(g, QUERY.slice(0, n), x0 + 96, y + 3, 58, INK, 'left', 900, DISP, w - 124, 1, 40, 'condensed'); });
    NOREC = nr;
    onprop(function () { tag(g, 'RE-CREATED', x0 + w - 124, y0 + h + 34, 1, 0, 240, CREAM, null, 36); });
    EXITING = ex; g.restore();
  }
  /* the scope, from 0.8 s to 5 s: a dark plate with two cream lines at 52 and 56 px, under the caption */
  function scopePlate(g, t, a) {
    if (a <= 0) return;
    var x0 = 100, x1 = 920, y0 = 440, y1 = 582;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 6, y0 + 9, x1 - x0, y1 - y0, 22); g.fill();
    g.fillStyle = INK; rr(g, x0, y0, x1 - x0, y1 - y0, 22); g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 3; rr(g, x0, y0, x1 - x0, y1 - y0, 22); g.stroke();
    prop(g, 'scope plate', x0, y0, x1, y1);
    onprop(function () {
      txt(g, 'SUPPORTED iPHONE · NETWORK ON', 510, y0 + 44, 52, CREAM, 'center', 800, DISP, 770, 1, 46, 'condensed');
      txt(g, 'UP TO 24 HOURS', 510, y0 + 104, 56, CREAM, 'center', 900, DISP, 770, 1, 46, 'condensed');
    });
    g.restore();
  }
  /* Apple's guide card (re-created) */
  var GD = { x0: 110, x1: 910, y0: 466, y1: 916 };
  function guideCard(g, t) {
    var x0 = GD.x0, x1 = GD.x1, y0 = GD.y0, y1 = GD.y1;
    sheet(g, x0, y0, x1, y1, 5201, PAPER, 'guide card');
    onprop(function () {
      txt(g, APPLE.guide, x0 + 36, y0 + 44, 36, '#5d564c', 'left', 800, DISP, 520, 1, 36, 'condensed');
      txt(g, APPLE.title, x0 + 36, y0 + 106, 56, INK, 'left', 900, DISP, x1 - x0 - 72, 1, 40, 'condensed');
      tag(g, 'RE-CREATED', x1 - 150, y0 + 46, 1, 0, 240, INK, PAPER, 36);
    });
    g.fillStyle = 'rgba(33,29,38,.4)'; g.fillRect(x0 + 36, y0 + 150, x1 - x0 - 72, 3);
    /* the scope prints on "supported": Apple's own first words, dark on the page */
    var sa = seg(tq(t), K.supported - .04, K.supported + .04);
    if (sa > 0) onprop(function () { chip(g, APPLE.scope, x0 + 36 + tw(g, APPLE.scope, 46, 900, 'condensed') / 2 + 16, y0 + 214, { px: 46, wt: 900, st: 'condensed', bg: INK, fg: CREAM, a: sa, shadow: false, r: 12 }); });
    /* the quote inks on "located" */
    var qa = seg(tq(t), K.located - .04, K.located + .06);
    if (qa > 0) onprop(function () { APPLE.q1.forEach(function (L, i) { txt(g, L, x0 + 36, y0 + 300 + i * 66, 60, INK, 'left', 900, DISP, x1 - x0 - 72, qa, 40, 'condensed'); }); });
  }
  /* the hero plate: UP TO 24 HOURS (coral, the one stamp) with Apple's condition and the power-reserve line under it */
  /* the 24-hour dial: a coral arc sweeps the clock over 1.5 s (17.6-19.1 s) and stops on a dashed UP TO end */
  function dial24(g, x, y, r, t) {
    var k = eio(seg(t, 17.6, 19.1)), A0 = -Math.PI / 2, AS = Math.PI * 2 * 330 / 360, da = seg(t, 18.95, 19.15);
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.3)'; el(g, 4, 6, r, r); g.fillStyle = '#2b2731'; el(g, 0, 0, r, r);
    g.strokeStyle = 'rgba(244,237,224,.85)'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.stroke();
    for (var i = 0; i < 24; i++) { var a = i / 24 * 6.283, l = i % 6 ? 8 : 16; g.strokeStyle = 'rgba(244,237,224,' + (i % 6 ? .45 : .9) + ')'; g.lineWidth = i % 6 ? 3 : 5; g.beginPath(); g.moveTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8)); g.lineTo(Math.cos(a) * (r - 8 - l), Math.sin(a) * (r - 8 - l)); g.stroke(); }
    if (k > 0) { g.strokeStyle = HOT; g.lineWidth = 14; g.lineCap = 'butt'; g.beginPath(); g.arc(0, 0, r - 34, A0, A0 + AS * k); g.stroke(); }
    if (da > 0) { g.save(); g.globalAlpha *= da; g.strokeStyle = HOT; g.lineWidth = 14; g.setLineDash([9, 8]); g.beginPath(); g.arc(0, 0, r - 34, A0 + AS, A0 + Math.PI * 2); g.stroke(); g.restore(); }
    var ha = A0 + AS * k; g.strokeStyle = CREAM; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(ha) * (r - 30), Math.sin(ha) * (r - 30)); g.stroke();
    g.fillStyle = CREAM; el(g, 0, 0, 8, 8);
    prop(g, 'dial', -r, -r, r, r);
    g.restore();
  }
  var HP = { x0: 96, x1: 924, y0: 958, y1: 1418 };
  function heroPlate(g, t) {
    var x0 = HP.x0, x1 = HP.x1, y0 = HP.y0, y1 = HP.y1;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 8, y0 + 12, x1 - x0, y1 - y0, 26); g.fill();
    g.fillStyle = '#1e1b23'; rr(g, x0, y0, x1 - x0, y1 - y0, 26); g.fill(); rr(g, x0, y0, x1 - x0, y1 - y0, 26); grainIn(g, x0, y0, x1 - x0, y1 - y0, 5301, .8);
    g.strokeStyle = 'rgba(244,237,224,.5)'; g.lineWidth = 3; rr(g, x0, y0, x1 - x0, y1 - y0, 26); g.stroke();
    prop(g, 'hero plate', x0, y0, x1, y1);
    /* the stamp inks on "24", creeps in, then lifts to 1.08 and slams back to 1.0 on the thump (K.TW) */
    var lift = sio(seg(t, K.TW - .22, K.TW - .05)) * (1 - eio(seg(t, K.TW - .05, K.TW))), squash = -.025 * Math.sin(Math.PI * seg(t, K.TW, K.TW + .14));
    var creep = .06 * sio(seg(t, K.h24 + .2, K.TW - .22)) * (1 - seg(t, K.TW - .05, K.TW)) + .03 * sio(seg(t, K.TW + .14, K.network - .3));
    var ss = 1 + creep + .08 * lift + squash;
    dial24(g, 232, y0 + 152, 98, t);
    g.save(); g.translate(612, y0 + 150); g.scale(ss, ss);
    onprop(function () { stamp(g, APPLE.stamp, 0, 0, t, K.h24, 108, HOT, -.04); });
    g.restore();
    var aa = seg(tq(t), K.h24 - .04, K.h24 + .04);
    onprop(function () {
      txt(g, APPLE.after, 510, y0 + 324, 54, CREAM, 'center', 900, DISP, 740, aa, 40, 'condensed');
      APPLE.reserve.forEach(function (L, i) { txt(g, L, 510, y0 + 376 + i * 50, 46, CREAM, 'center', 800, DISP, 760, aa, 44, 'condensed'); });
    });
  }

  /* =====================================================================================================
     THE ROOM, pulled back: four hero helpers (no people), each woken by the beacon; on "billion" the room becomes
     one window in a paper city block full of lit devices; then the map card, the chips, the switch
     ===================================================================================================== */
  var ANCH = { x: 510, y: 1300 }, ZOUT = .45;
  /* screen positions after the pull-back (z = ZOUT); d = distance from the phone's screen point */
  var DEV = [
    { k: 'laptop', x: 205, y: 1026 }, { k: 'tablet', x: 822, y: 1004 },
    { k: 'phone', x: 196, y: 1262 }, { k: 'laptop', x: 812, y: 1292, relay: 1 }
  ];
  DEV.forEach(function (D) { D.d = Math.hypot(D.x - 510, D.y - 1267); });
  var PHS = { x: 510, y: 0 };   /* the phone's screen point when pulled back (set below) */
  /* when the beacon (a ring after the pull-back) last crossed distance d, and when it first did */
  var RR0 = 220 * .74 * ZOUT, RR1 = 1100;
  function crossK(d) { var u = (d - RR0) / (RR1 - RR0); return u <= 0 || u >= 1 ? null : 1 - Math.cbrt(1 - u); }
  function firstHit(d) { var kc = crossK(d); if (kc == null) return 1e9; var n = Math.ceil((K.network + .3 - RING0 - kc * RLIFE) / RP); return RING0 + n * RP + kc * RLIFE; }
  function lastHit(t, d, tf) {
    var kc = crossK(d); if (kc == null) return null;
    var te = Math.min(t, tf), n = Math.floor((te - RING0 - kc * RLIFE) / RP), tc = RING0 + n * RP + kc * RLIFE;
    return n >= 0 && tc >= firstHit(d) - .001 ? tc : null;
  }
  function devScreen(g, x, y, w, h, lit, grey, fl) {
    var c = mixc(hex('#2a313d'), hex('#f4e4c1'), lit);
    if (grey > 0) c = mixc(c.match(/\d+/g).map(Number), hex('#3d4450'), grey);
    g.fillStyle = c; rr(g, x, y, w, h, Math.min(w, h) * .1); g.fill();
    var ua = lit * (1 - grey);
    if (ua > 0) {   /* a lit screen shows a little UI: a header bar and three rows */
      g.fillStyle = 'rgba(120,84,60,' + (.45 * ua) + ')'; g.fillRect(x + w * .1, y + h * .12, w * .45, h * .07);
      for (var i = 0; i < 3; i++) { g.fillStyle = 'rgba(120,84,60,' + (.22 * ua) + ')'; g.fillRect(x + w * .1, y + h * (.32 + i * .17), w * .8, h * .09); }
    }
    if (fl > 0) { g.strokeStyle = 'rgba(244,237,224,' + (.95 * fl) + ')'; g.lineWidth = 6; rr(g, x - 9, y - 9, w + 18, h + 18, Math.min(w, h) * .16); g.stroke(); }
  }
  function device(g, D, lit, grey, fl, z, bump) {
    var s = z / ZOUT * (1 + bump), x = ANCH.x + (D.x - ANCH.x) * z / ZOUT, y = ANCH.y + (D.y - ANCH.y) * z / ZOUT;
    g.save(); g.translate(x, y); g.scale(s, s);
    if (D.k === 'laptop') {   /* lid, screen, camera, hinge, keyboard deck and trackpad, on a round table */
      g.fillStyle = '#5a3e2e'; g.fillRect(-8, 32, 16, 54); rr(g, -46, 84, 92, 12, 6); g.fill();
      g.fillStyle = '#a07650'; el(g, 0, 30, 100, 13);
      g.fillStyle = '#5c6676'; poly(g, [[-96, 2], [96, 2], [108, 24], [-108, 24]]); g.fill();
      g.fillStyle = '#3a4250'; for (var r = 0; r < 3; r++) g.fillRect(-74 + r * 6, 6 + r * 5, 148 - r * 12, 3);
      g.fillStyle = '#4a5463'; rr(g, -24, 18, 48, 5, 2); g.fill();
      g.fillStyle = '#1f252e'; g.fillRect(-94, -3, 188, 6);
      g.fillStyle = '#3a4452'; rr(g, -92, -124, 184, 122, 10); g.fill();
      devScreen(g, -84, -114, 168, 104, lit, grey, fl);
      g.fillStyle = '#0d1116'; el(g, 0, -119, 2.5, 2.5);
      prop(g, 'laptop', -100, -124, 100, 96);
    } else if (D.k === 'tablet') {   /* a tablet on a folded kraft stand, camera on the bezel */
      g.fillStyle = '#b48a5a'; poly(g, [[-40, 96], [44, 96], [20, 10], [-6, 10]]); g.fill();
      g.fillStyle = '#3a4452'; rr(g, -70, -96, 140, 190, 16); g.fill();
      devScreen(g, -61, -84, 122, 166, lit, grey, fl);
      g.fillStyle = '#0d1116'; el(g, 0, -90, 2.5, 2.5);
      prop(g, 'tablet', -70, -96, 70, 96);
    } else {   /* a phone with a round punch-hole, on a stool */
      g.fillStyle = '#5a3e2e'; rr(g, -66, 92, 132, 14, 6); g.fill(); g.fillRect(-54, 106, 10, 36); g.fillRect(44, 106, 10, 36);
      g.fillStyle = '#3a4452'; rr(g, -44, -88, 88, 176, 16); g.fill();
      devScreen(g, -38, -82, 76, 164, lit, grey, fl);
      g.fillStyle = '#0d1116'; el(g, 0, -72, 4, 4);
      prop(g, 'phone', -66, -88, 66, 142);
    }
    g.restore();
  }
  /* the tick: a coral badge with a cream check pops on a helper's corner when the beacon first reaches it */
  function tickBadge(g, x, y, k) {
    if (k <= 0) return;
    var sc = k < 1 ? lerp(1.4, 1, eout(k)) : 1;
    g.save(); g.translate(x, y); g.scale(sc, sc); g.globalAlpha *= clamp(k * 3, 0, 1);
    g.fillStyle = 'rgba(0,0,0,.3)'; el(g, 2, 3, 22, 22); g.fillStyle = HOT; el(g, 0, 0, 22, 22);
    g.strokeStyle = CREAM; g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-10, 1); g.lineTo(-3, 8); g.lineTo(10, -7); g.stroke();
    g.restore();
  }
  /* the city block: the room is one window; every other window holds lit devices, woken by a wave from ours */
  var CITY = { x: 510, y: 1060, z: .22 }, WR = { x0: 70, y0: 296, x1: 950, y1: 1470 }, WPX = 1000, WPY = 1304, WCX = 510, WCY = 883;
  var CDOTS = null, CW0 = 0;
  function mkCity() {
    var r = mulberry(707); CDOTS = [];
    for (var j = -3; j <= 3; j++) for (var i = -3; i <= 3; i++) {
      if (!i && !j) continue;
      for (var n = 0; n < 16; n++) {
        var x = lerp(WR.x0 + 70, WR.x1 - 70, r()) + i * WPX, y = lerp(WR.y0 + 110, WR.y1 - 90, r()) + j * WPY, kk = r();
        var d = Math.hypot(x - WCX, y - WCY) * CITY.z;
        CDOTS.push({ x: x, y: y, k: kk < .55 ? 0 : kk < .85 ? 1 : 2, d: d });
      }
    }
  }
  function waveR(t, tb) { var k = (t - tb) / 1.6; return k < 0 ? -1 : lerp(40, 1000, eout(Math.min(1, k))); }
  function waveT(d) { var u = (d - 40) / 960; return CW0 + 1.6 * (1 - Math.cbrt(1 - clamp(u, 0, .999))); }
  function city(g, t, zc) {
    if (!CDOTS) mkCity();
    var vx0 = CITY.x - CITY.x / zc, vx1 = CITY.x + (W - CITY.x) / zc, vy0 = CITY.y + (452 - CITY.y) / zc, vy1 = CITY.y + (H - CITY.y) / zc;
    g.save(); g.beginPath(); g.rect(0, 452, W, H); g.clip();
    g.translate(CITY.x, CITY.y); g.scale(zc, zc); g.translate(-CITY.x, -CITY.y);
    g.fillStyle = '#8a6448'; g.fillRect(vx0, vy0, vx1 - vx0, vy1 - vy0);
    g.fillStyle = 'rgba(0,0,0,.09)'; for (var y = Math.floor(vy0 / 52) * 52; y < vy1; y += 52) g.fillRect(vx0, y, vx1 - vx0, 7);
    for (var j = -3; j <= 3; j++) for (var i = -3; i <= 3; i++) {
      var x0 = WR.x0 + i * WPX, y0 = WR.y0 + j * WPY, w = WR.x1 - WR.x0, h = WR.y1 - WR.y0;
      if (x0 > vx1 || x0 + w < vx0 || y0 > vy1 || y0 + h < vy0) continue;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x0 - 16, y0 - 10, w + 50, h + 60);
      g.fillStyle = '#e3cfa9'; g.fillRect(x0 - 30, y0 - 30, w + 60, h + 60);
      g.fillStyle = '#c4a983'; g.fillRect(x0 - 50, y0 + h + 22, w + 100, 30);
      if (i || j) { g.fillStyle = '#1d2140'; g.fillRect(x0, y0, w, h); g.fillStyle = '#262b4e'; g.fillRect(x0, y0 + h * .68, w, h * .32); }
    }
    CDOTS.forEach(function (D) {
      if (D.x < vx0 - 60 || D.x > vx1 + 60 || D.y < vy0 - 60 || D.y > vy1 + 60) return;
      var dt = t - waveT(D.d), lit = dt >= 0 ? 1 : 0, pop = dt >= 0 && dt < .35 ? Math.sin(Math.PI * dt / .35) : 0;
      g.save(); g.translate(D.x, D.y); g.scale(1.7 * (1 + .5 * pop), 1.7 * (1 + .5 * pop));
      var c = lit ? '#f4e4c1' : '#3a3f66', tx, ty;
      if (D.k === 0) { g.fillStyle = '#11142a'; rr(g, -26, -44, 52, 88, 10); g.fill(); g.fillStyle = c; rr(g, -20, -38, 40, 76, 7); g.fill(); g.fillStyle = '#11142a'; el(g, 0, -32, 3, 3); tx = 26; ty = -44; }
      else if (D.k === 1) { g.fillStyle = '#11142a'; rr(g, -60, -44, 120, 76, 8); g.fill(); g.fillStyle = c; rr(g, -52, -36, 104, 60, 5); g.fill(); g.fillStyle = '#11142a'; g.fillRect(-70, 32, 140, 12); tx = 60; ty = -44; }
      else { g.fillStyle = '#11142a'; rr(g, -44, -60, 88, 120, 10); g.fill(); g.fillStyle = c; rr(g, -36, -52, 72, 104, 7); g.fill(); tx = 44; ty = -60; }
      if (lit) {   /* the coral tick as the wave passes */
        var tk = clamp(dt / .2, 0, 1); g.translate(tx, ty); g.scale(lerp(1.5, 1, eout(tk)), lerp(1.5, 1, eout(tk)));
        g.fillStyle = HOT; el(g, 0, 0, 24, 24); g.strokeStyle = CREAM; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-11, 1); g.lineTo(-3, 9); g.lineTo(11, -8); g.stroke();
      }
      g.restore();
    });
    g.restore();
  }
  /* the map card: a paper map (roads, a river, a park), a soft circle, the pin; APPROXIMATE LOCATION · APPLE */
  var MP = { x0: 110, x1: 910, y0: 466, y1: 800 }, CIRC = { x: 640, y: 596, r: 90 };
  function mapCard(g, t, pinK, la) {
    var x0 = MP.x0, x1 = MP.x1, y0 = MP.y0, y1 = MP.y1;
    sheet(g, x0, y0, x1, y1, 5501, '#e9e2cf', 'map card');
    g.save(); g.beginPath(); g.rect(x0 + 18, y0 + 18, x1 - x0 - 36, y1 - y0 - 110); g.clip();
    g.fillStyle = '#c9d6b4'; g.beginPath(); g.ellipse(300, 590, 130, 70, -.3, 0, 6.283); g.fill();
    g.strokeStyle = '#a9c4d6'; g.lineWidth = 34; g.beginPath(); g.moveTo(100, 510); g.bezierCurveTo(330, 470, 420, 700, 920, 650); g.stroke();
    g.strokeStyle = '#fbf6ea'; g.lineWidth = 18; g.lineCap = 'round';
    g.beginPath(); g.moveTo(90, 650); g.bezierCurveTo(300, 620, 500, 540, 920, 540); g.stroke();
    g.beginPath(); g.moveTo(520, 470); g.bezierCurveTo(560, 580, 520, 640, 600, 720); g.stroke();
    g.beginPath(); g.moveTo(780, 470); g.lineTo(830, 720); g.stroke();
    g.lineWidth = 9; g.strokeStyle = 'rgba(251,246,234,.8)'; g.beginPath(); g.moveTo(90, 570); g.lineTo(450, 720); g.stroke();
    g.restore();
    var ca = seg(pinK, .6, 1);
    if (ca > 0) { var cr = CIRC.r * lerp(.6, 1, eout(ca)); g.save(); g.globalAlpha *= ca; g.fillStyle = 'rgba(33,29,38,.12)'; el(g, CIRC.x, CIRC.y, cr, cr); g.strokeStyle = 'rgba(33,29,38,.55)'; g.lineWidth = 4; g.setLineDash([12, 10]); g.beginPath(); g.arc(CIRC.x, CIRC.y, cr, 0, 6.283); g.stroke(); g.setLineDash([]); g.restore(); }
    if (pinK >= 1) { g.save(); g.translate(CIRC.x, CIRC.y + 10); g.fillStyle = INK; g.beginPath(); g.arc(0, -40, 24, Math.PI * .8, Math.PI * .2); g.lineTo(0, 0); g.closePath(); g.fill(); g.fillStyle = PAPER; el(g, 0, -40, 9, 9); g.restore(); }
    g.fillStyle = 'rgba(33,29,38,.3)'; g.fillRect(x0 + 18, y1 - 90, x1 - x0 - 36, 3);
    if (la > 0) onprop(function () { txt(g, APPLE.approx, x0 + 36, y1 - 46, 46, INK, 'left', 900, DISP, 560, la, 40, 'condensed'); txt(g, 'APPLE', x1 - 36, y1 - 46, 36, '#5d564c', 'right', 800, DISP, 160, la, 36, 'condensed'); });
  }
  /* a switch; `nt` 1 draws it neutral (a dashed outline, no state) until its word */
  function toggleSw(g, x, y, w, h, on, nt) {
    nt = nt || 0;
    if (nt > 0) { g.save(); g.globalAlpha *= nt; g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 4; g.setLineDash([10, 8]); g.lineDashOffset = -CURT * 36; rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.stroke(); g.setLineDash([]); g.restore(); }
    if (nt >= 1) return;
    g.save(); g.globalAlpha *= 1 - nt;
    var c = mixc(hex('#b9b2a6'), hex('#6fbf73'), on);
    g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, x - w / 2 + 4, y - h / 2 + 6, w, h, h / 2); g.fill();
    g.fillStyle = c; rr(g, x - w / 2, y - h / 2, w, h, h / 2); g.fill();
    var kr = h / 2 - 7, kx = lerp(x - w / 2 + 7 + kr, x + w / 2 - 7 - kr, on);
    g.fillStyle = 'rgba(0,0,0,.2)'; el(g, kx + 2, y + 4, kr, kr); g.fillStyle = '#fbf8f2'; el(g, kx, y, kr, kr);
    g.restore();
  }
  var SWP = { x0: 110, x1: 910, y0: 466, y1: 800 };
  function switchPlate(g, t, on, oa) {
    var x0 = SWP.x0, x1 = SWP.x1, y0 = SWP.y0, y1 = SWP.y1;
    sheet(g, x0, y0, x1, y1, 5601, PAPER, 'switch plate');
    onprop(function () { txt(g, APPLE.net, 510, y0 + 64, 72, INK, 'center', 900, DISP, 740, 1, 40, 'condensed'); });
    toggleSw(g, 510, y0 + 172, 270, 130, on);
    if (oa > 0) onprop(function () { chip(g, APPLE.only, 510, y0 + 282, { px: 50, wt: 900, st: 'condensed', bg: INK, fg: CREAM, a: oa, shadow: false, r: 12, maxw: 760 }); });
  }

  /* =====================================================================================================
     SCENE 1: THE ROOM (hook → dip). Layout A the phone, B Apple's line, C the crowd and the switch
     ===================================================================================================== */
  function phA(t) {   /* the phone in core coords */
    var p = f0(t), s = lerp(1, .74, eio(seg(t, K.hookEnd + .05, K.ask + .3)));
    var dk = .6 * eio(seg(t, K.lost + .05, K.lose + .35)) + .4 * eio(seg(t, K.switched - .05, K.switched + .3)), bob = 6 * Math.sin(Math.PI * seg(t, K.CU - .05, K.CU + .25));
    var cy = 1410 - PH / 2 * s + 120 * dk + bob;
    return { x: p.x, y: p.y + cy - REST.y, rot: p.rot + .07 * dk, s: s, dk: dk };
  }
  function cityK(t) { return eio(seg(t, K.billion + .2, K.billion + 1.2)) * (1 - eio(seg(t, K.relay - .25, K.relay + .45))); }
  function roomScene(g, t) {
    var zk = eio(seg(t, K.network - .4, K.network + .3)), z = lerp(1, ZOUT, zk);
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { paperBg(g, t, roomTone(t)); return; }
    var p = phA(t), s = p.s, py = p.y, off = eio(seg(t, K.offH - .08, K.offH + .14));
    PHS.x = ANCH.x + (p.x - ANCH.x) * z; PHS.y = ANCH.y + (py - ANCH.y) * z;
    var tf = K.sw + .08;
    CW0 = K.billion + .35;
    /* act B hides the room: only Apple's two cards sit on the teal paper */
    var roomA = clamp(1 - seg(t, K.twist + .05, K.twist + .4) + seg(t, K.network - .45, K.network - .15), 0, 1);
    /* the sofa close-up pushes in from "Say" to "But" */
    var push = 1 + .15 * sio(seg(t, K.lost, K.twist)) * (1 - seg(t, K.twist + .4, K.twist + .45));
    var ck = cityK(t), zc = lerp(1, CITY.z - .02 * seg(t, K.billion + 1.2, K.relay - .25), ck);
    var ra = (t < K.lost ? 1 : t < K.twist ? .5 : 1);
    var exz = EXITING; if ((zk > 0 && zk < 1) || (ck > 0 && ck < 1)) EXITING = true;
    if (roomA > 0) {
      g.save(); g.globalAlpha *= roomA;
      if (ck > 0) {
        city(g, t, zc);
        var wx0 = CITY.x + (WR.x0 - CITY.x) * zc, wy0 = CITY.y + (WR.y0 - CITY.y) * zc, wx1 = CITY.x + (WR.x1 - CITY.x) * zc, wy1 = CITY.y + (WR.y1 - CITY.y) * zc;
        g.beginPath(); g.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); g.clip();
        g.translate(CITY.x, CITY.y); g.scale(zc, zc); g.translate(-CITY.x, -CITY.y);
        paperBg(g, t, roomTone(t));
      }
      if (push > 1.0005) { g.translate(510, 1150); g.scale(push, push); g.translate(-510, -1150); }
      if (zk > 0) { g.fillStyle = 'rgba(20,14,18,' + (.55 * zk).toFixed(3) + ')'; var fy = ANCH.y + (1440 - ANCH.y) * z; g.fillRect(-400, fy, W + 800, H); }
      g.save(); g.translate(ANCH.x, ANCH.y); g.scale(z, z); g.translate(-ANCH.x, -ANCH.y);
      sofaBack(g, zk);
      g.restore();
      rings(g, PHS.x, PHS.y, t, 220 * s * z, lerp(640, RR1, zk), ra, tf);
      g.save(); g.translate(ANCH.x, ANCH.y); g.scale(z, z); g.translate(-ANCH.x, -ANCH.y);
      var moving = t < SINK || (t > K.hookEnd && t < K.ask + .35) || (p.dk > 0 && p.dk < 1) || (push > 1 && push < 1.15);
      var exm = EXITING; if (moving) EXITING = true;
      var inSofa = t >= K.lost;
      g.save();
      if (inSofa) { g.beginPath(); g.rect(-2000, -2000, 5000, 2000 + 1424); g.clip(); }   /* the phone never shows below the seat */
      phone(g, p.x, py, PW * s, PH * s, p.rot, { name: inSofa ? 'phone in sofa' : 'phone', off: off, sheen: seg(t, .85, 1.05) * (1 - seg(t, 12.4, 12.6)), draw: function (g2, S) { powerScreen(g2, S, knobAt(t), 1 - off); } });
      g.restore();
      if (inSofa && !moving) prop(g, 'phone', p.x - PW * s / 2, py - PH * s / 2, p.x + PW * s / 2, CT - 30);
      EXITING = exm;
      /* the cushions rise on "Say"; the crease dips where the phone goes in */
      var cu = eout(seg(t, K.lost - .15, K.lost + .3));
      if (cu > 0) {
        var exc = EXITING; if (cu < 1) EXITING = true;
        g.save(); g.translate(0, 300 * (1 - cu));
        var dip = 26 * p.dk;
        cushion(g, 92, 516, dip, 6101, 'cushion L'); cushion(g, 504, 928, dip, 6102, 'cushion R');
        g.restore(); EXITING = exc;
      }
      g.restore();
      /* C: four helpers; each wakes, ticks and sends its own ring when the beacon reaches it; greys after the switch */
      if (zk > 0) {
        var exd = EXITING; if (zk < 1) EXITING = true;
        DEV.forEach(function (D) {
          var f1 = firstHit(D.d), lit = eout(seg(t, f1 - .06, f1 + .12)), grey = seg(t, K.sw + .1 + D.d / 520, K.sw + .45 + D.d / 520);
          var hc = lastHit(t, D.d, tf), dt = hc == null ? 9 : t - hc, pulse = dt < .9 ? 1 - dt / .9 : 0, bump = dt < .3 ? .07 * Math.sin(Math.PI * dt / .3) : 0;
          var fl = pulse * (1 - grey);
          if (D.relay) fl = Math.max(fl, Math.sin(Math.PI * seg(t, K.spot - .05, K.spot + .4)));
          var x = ANCH.x + (D.x - ANCH.x) * z / ZOUT, y = ANCH.y + (D.y - ANCH.y) * z / ZOUT, sc = z / ZOUT;
          if (pulse > 0 && grey < 1) { g.save(); g.strokeStyle = CREAM; g.globalAlpha *= .75 * pulse * (1 - grey); g.lineWidth = 6; g.beginPath(); g.arc(x, y - 20 * sc, lerp(40, 190, eout(1 - pulse)) * sc, 0, 6.283); g.stroke(); g.restore(); }
          g.save(); g.translate(0, 8 * eio(grey)); device(g, D, lit, grey, fl, z, bump);
          var bx = x + (D.k === 'laptop' ? 92 : D.k === 'tablet' ? 70 : 44) * sc, by = y - (D.k === 'laptop' ? 124 : D.k === 'tablet' ? 96 : 88) * sc;
          var exb2 = EXITING; EXITING = true; tickBadge(g, bx, by, seg(t, f1, f1 + .18) * (1 - seg(tq(t), K.sw, K.sw + .25))); EXITING = exb2;
          g.restore();
        });
        EXITING = exd;
      }
      g.restore();
      /* the city: the wave front leaves our window as a few wide rings */
      if (ck > 0) {
        var wcx = CITY.x + (WCX - CITY.x) * zc, wcy = CITY.y + (WCY - CITY.y) * zc;
        g.save(); g.beginPath(); g.rect(0, 452, W, H); g.clip(); g.strokeStyle = CREAM;
        for (var n = 0; n < 3; n++) { var tb = CW0 + n * .55, kk = (t - tb) / 1.6; if (kk < 0 || kk >= 1) continue; g.globalAlpha = roomA * ck * .7 * (1 - kk); g.lineWidth = lerp(12, 4, kk); g.beginPath(); g.arc(wcx, wcy, lerp(40, 1000, eout(kk)), 0, 6.283); g.stroke(); }
        g.restore();
      }
    }
    EXITING = exz;
    /* frame 0's words peel at 0.6 s; the scope plate takes their place at 0.8 s and holds to 5 s */
    var hout = eio(seg(t, .6, .8));
    if (hout < 1) { var exh = EXITING; if (hout > 0) EXITING = true; g.save(); peelT(g, 120, 560, hout); title0(g); g.restore(); EXITING = exh; }
    var scA = seg(t, .8, .92), scO = eio(seg(t, 5.0, 5.2));
    if (scA > 0 && scO < 1) { var exs = EXITING; if (scA < 1 || scO > 0) EXITING = true; g.save(); peelT(g, 120, 580, scO); scopePlate(g, t, scA); g.restore(); EXITING = exs; }
    searchBar(g, 510, 646, t, 1.36, eio(seg(t, K.lost - .12, K.lost + .1)));
    /* HOUR 0 on "lose"; the icons strike on their words; the "?" pin rises and fades on "gone" */
    var gOut = eio(seg(t, K.twist - .25, K.twist - .02));
    if (gOut < 1) {
      var exg = EXITING; if (gOut > 0) EXITING = true;
      g.save(); peelT(g, 140, 760, gOut);
      card(g, 'HOUR 0', 510, 520, t, K.lose, null, 64, 400);
      var wa = eout(seg(t, K.gone - .1, K.gone + .15)), ca2 = eout(seg(t, K.no2 - .1, K.no2 + .15));
      wifiIcon(g, 310, 704, lerp(.95, 1.06, wa), wa, eio(seg(tq(t), K.wifi - .02, K.wifi + .2)));
      cellIcon(g, 710, 704, lerp(.95, 1.06, ca2), ca2, eio(seg(tq(t), K.cell - .02, K.cell + .2)));
      var qk = seg(t, K.looks - .05, K.GN + .1);
      if (qk > 0 && qk < 1) { var exq = EXITING; EXITING = true; qPin(g, 510, lerp(800, 752, eout(qk)), Math.sin(Math.PI * qk), 1.25); EXITING = exq; }
      g.restore(); EXITING = exg;
    }
    /* B: Apple's guide card slides down on "But"; the hero plate rises on "For"; both leave before "Over" */
    var kin = eout(seg(t, K.twist - .1, K.twist + .3)), kup = eio(seg(t, K.network - .3, K.network + .05));
    if (kin > 0 && kup < 1 && !POSTERMODE) { var exk = EXITING; if (kin < 1 || kup > 0) EXITING = true; g.save(); g.translate(4 * Math.sin(t * 1.9), -620 * (1 - kin) - 640 * kup); guideCard(g, t); g.restore(); EXITING = exk; }
    var hin = eout(seg(t, K.hours - .12, K.hours + .26)), hpe = eio(seg(t, K.network - .32, K.network - .06));
    if (hin > 0 && hpe < 1) {
      var exp = EXITING; if (hin < 1 || hpe > 0) EXITING = true;
      g.save(); g.translate(0, 520 * (1 - hin)); peelT(g, 140, 1300, hpe); heroPlate(g, t); g.restore(); EXITING = exp;
    }
    /* after the switch the room slowly goes dark: the low point keeps moving into the wipe */
    var dim = .42 * sio(seg(t, K.sw + .35, K.path - .25));
    if (dim > 0) { g.fillStyle = 'rgba(8,8,14,' + dim.toFixed(3) + ')'; g.fillRect(0, 300, W, 1140); }
    /* the billion clipping on "billion" (the DM frame), peeled as the map comes in */
    var qo = seg(t, K.spot - .2, K.spot - .02);   /* pinned to the screen: it fades in place, never slides off */
    if (qo < 1) { var exq2 = EXITING; if (qo > 0) EXITING = true; g.save(); g.globalAlpha *= 1 - qo; qplate(g, 104, 466, 812, APPLE.billion, 66, APPLE.credit, 5401, seg(t, K.network - .02, K.network + .1), 0); g.restore(); EXITING = exq2; }
    /* the DM line over the city: OVER A BILLION APPLE DEVICES, 80 px, under the window (it repeats the quote, so it is not a new read) */
    var bk = seg(t, K.billion + .5, K.billion + .7) * (1 - seg(t, K.relay - .3, K.relay - .1));
    if (bk > 0) {
      var exl = EXITING, nrl = NOREC; NOREC = true; if (bk < 1) EXITING = true;
      g.save(); g.globalAlpha *= bk; g.translate(0, 30 * (1 - eout(seg(t, K.billion + .5, K.billion + .8))));
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 112, 1222, 808, 202, 24); g.fill(); g.fillStyle = INK; rr(g, 106, 1214, 808, 202, 24); g.fill(); g.strokeStyle = CREAM; g.lineWidth = 3; rr(g, 106, 1214, 808, 202, 24); g.stroke();
      prop(g, 'billion plate', 106, 1214, 914, 1416);
      onprop(function () { txt(g, 'OVER A BILLION', 510, 1268, 80, HOT, 'center', 900, DISP, 760, 1, 72, 'condensed'); txt(g, 'APPLE DEVICES', 510, 1356, 80, CREAM, 'center', 900, DISP, 760, 1, 72, 'condensed'); });
      g.restore(); NOREC = nrl; EXITING = exl;
    }
    /* relay: the map slides in; the coral blip hops from the relay laptop to the circle on "report back" */
    var min = eout(seg(t, K.spot - .2, K.spot + .15)), mout = eio(seg(t, K.dip + .15, K.dip + .3));
    var pinK = seg(t, K.report - .05, K.back + .05);
    if (min > 0 && mout < 1) { var exmp = EXITING; if (min < 1 || mout > 0) EXITING = true; g.save(); g.translate(-900 * (1 - min), 0); g.globalAlpha *= 1 - mout; mapCard(g, t, pinK, seg(t, K.spot - .05, K.spot + .05)); g.restore(); EXITING = exmp; }
    if (pinK > 0 && pinK < 1) {
      var R = DEV[3], bk = sio(pinK), R0y = R.y - 130, bx = lerp(R.x, CIRC.x, bk), by = lerp(R0y, CIRC.y - 30, bk) - 220 * Math.sin(Math.PI * bk);
      for (var i = 1; i <= 5; i++) { var bk2 = sio(clamp(pinK - i * .04, 0, 1)); g.fillStyle = 'rgba(255,91,61,' + (.35 - i * .06) + ')'; el(g, lerp(R.x, CIRC.x, bk2), lerp(R0y, CIRC.y - 30, bk2) - 220 * Math.sin(Math.PI * bk2), 12 - i, 12 - i); }
      g.fillStyle = CREAM; el(g, bx, by, 24, 24); g.fillStyle = HOT; el(g, bx, by, 18, 18);
    }
    /* BLUETOOTH and ANONYMOUS · ENCRYPTED print on "Bluetooth", under the map; both leave as the switch goes */
    var cOut = eio(seg(t, K.called - .1, K.called + .1));
    if (cOut < 1 && t >= K.bluetooth - .08) {
      var exb = EXITING; if (cOut > 0) EXITING = true; g.save(); peelT(g, 140, 880, cOut);
      var cha = seg(tq(t), K.bluetooth - .04, K.bluetooth + .04);
      chip(g, 'BLUETOOTH', 236, 846, { px: 42, wt: 900, st: 'condensed', bg: INK, line: CREAM, lw: 3, fg: CREAM, a: cha, shadow: false, r: 12 });
      chip(g, 'ANONYMOUS · ENCRYPTED', 656, 846, { px: 42, wt: 900, st: 'condensed', bg: INK, line: CREAM, lw: 3, fg: CREAM, a: cha, shadow: false, r: 12 });
      g.restore(); EXITING = exb;
    }
    /* dip: the switch plate slides down over the map, ON; it flips OFF on "switch"; everything greys */
    var swin = eout(seg(t, K.dip - .4, K.dip - .05));
    if (swin > 0) {
      var exw = EXITING; if (swin < 1) EXITING = true;
      var on = 1 - eio(seg(tq(t), K.sw - .02, K.sw + .16)), oa = seg(tq(t), K.dip - .36, K.dip - .28);
      var drift = 36 * sio(seg(t, K.sw + .3, K.path - .2)), cpk = .02 * Math.sin(Math.PI * seg(t, at('dip', 'network.') - .02, at('dip', 'network.') + .2)) + .02 * Math.sin(Math.PI * seg(t, K.SW - .02, K.SW + .18));
      g.save(); g.translate(0, -560 * (1 - swin) + drift); if (cpk > 0) { g.translate(510, 760); g.scale(1 + cpk, 1 + cpk); g.translate(-510, -760); } switchPlate(g, t, on, oa); g.restore(); EXITING = exw;
    }
  }

  /* =====================================================================================================
     SCENE 2: CHECK YOURS. The re-created Settings screen; breadcrumbs print on their words; both switches on
     ===================================================================================================== */
  var SP = { x: 510, y: 980, w: 640, h: 880 };
  function row(g, x, y, w, h, label, o) {
    o = o || {};
    if (o.hl > 0) { g.fillStyle = 'rgba(33,29,38,' + (.12 * o.hl) + ')'; g.fillRect(x, y, w, h); }
    var tx = x + 30;
    if (o.icon) { g.fillStyle = o.icon; rr(g, x + 26, y + h / 2 - 28, 56, 56, 14); g.fill(); g.fillStyle = 'rgba(255,255,255,.85)'; el(g, x + 54, y + h / 2, 10, 10); tx = x + 104; }
    if (o.avatar) { g.fillStyle = '#b9ad98'; el(g, x + 66, y + h / 2, 44, 44); g.fillStyle = '#e8dfcf'; el(g, x + 66, y + h / 2 - 10, 16, 16); el(g, x + 66, y + h / 2 + 26, 26, 14); tx = x + 128; }
    onprop(function () { txt(g, label, tx, y + h / 2 + 2, o.px || 48, INK, 'left', 800, DISP, w - (tx - x) - 150, 1, 36, 'condensed'); });
    if (o.sw != null) toggleSw(g, x + w - 92, y + h / 2, 118, 70, o.sw, o.nt);
    else if (o.chev !== false) { g.strokeStyle = '#a49c8f'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + w - 46, y + h / 2 - 16); g.lineTo(x + w - 32, y + h / 2); g.lineTo(x + w - 46, y + h / 2 + 16); g.stroke(); }
    if (o.line !== false) { g.fillStyle = 'rgba(33,29,38,.12)'; g.fillRect(tx, y + h - 2, w - (tx - x), 2); }
  }
  function group(g, x, y, w, n, rh) { g.fillStyle = '#fbf8f2'; rr(g, x, y, w, n * rh, 26); g.fill(); }
  function back(g, S, label) {
    g.strokeStyle = '#5b7fae'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(S.x + 50, S.y + 62); g.lineTo(S.x + 34, S.y + 80); g.lineTo(S.x + 50, S.y + 98); g.stroke();
    onprop(function () { txt(g, label, S.x + 66, S.y + 82, 40, '#5b7fae', 'left', 800, DISP, 400, 1, 36, 'normal'); });
  }
  function page(g, S, n, t) {
    g.fillStyle = '#ece6da'; g.fillRect(S.x, S.y, S.w, S.h);
    var x = S.x + 24, w = S.w - 48, rh = 108;
    function hl(tt) { return Math.sin(Math.PI * seg(t, tt - .12, tt + .16)); }
    if (n === 0) {   /* Settings: your name at the top */
      onprop(function () { txt(g, 'Settings', S.x + 34, S.y + 150, 72, INK, 'left', 900, DISP, 500, 1, 40, 'normal'); });
      group(g, x, S.y + 230, w, 1, 140); row(g, x, S.y + 230, w, 140, '[Your Name]', { avatar: 1, hl: hl(K.yourN), line: false, px: 50 });
      var nr = NOREC; NOREC = true;   /* two plain rows for context, not reads */
      group(g, x, S.y + 410, w, 2, rh); row(g, x, S.y + 410, w, rh, 'Wi-Fi', { icon: '#6f9fd8' }); row(g, x, S.y + 410 + rh, w, rh, 'Bluetooth', { icon: '#6f9fd8', line: false });
      NOREC = nr;
    } else if (n === 1) {   /* your name: Find My */
      back(g, S, 'Settings');
      g.fillStyle = '#b9ad98'; el(g, S.x + S.w / 2, S.y + 200, 74, 74); g.fillStyle = '#e8dfcf'; el(g, S.x + S.w / 2, S.y + 180, 26, 26); el(g, S.x + S.w / 2, S.y + 240, 44, 24);
      onprop(function () { txt(g, '[Your Name]', S.x + S.w / 2, S.y + 330, 56, INK, 'center', 900, DISP, 500, 1, 40, 'normal'); });
      group(g, x, S.y + 410, w, 1, rh); row(g, x, S.y + 410, w, rh, APPLE.rows.fm, { icon: '#7fbf7a', hl: hl(K.findP), line: false });
    } else if (n === 2) {   /* Find My: Find My iPhone */
      back(g, S, '[Your Name]');
      onprop(function () { txt(g, APPLE.rows.fm, S.x + 34, S.y + 170, 72, INK, 'left', 900, DISP, 500, 1, 40, 'normal'); });
      group(g, x, S.y + 250, w, 1, rh); row(g, x, S.y + 250, w, rh, APPLE.rows.fmi, { icon: '#7fbf7a', hl: hl(K.tap - .08), line: false });
    } else {   /* Find My iPhone: the switches */
      back(g, S, APPLE.rows.fm);
      onprop(function () { txt(g, APPLE.rows.fmi, S.x + 34, S.y + 170, 64, INK, 'left', 900, DISP, 540, 1, 40, 'normal'); });
      var a1 = eio(seg(tq(t), K.both - .02, K.both + .16)), a2 = eio(seg(tq(t), K.switches - .02, K.switches + .16));
      group(g, x, S.y + 250, w, 3, rh);
      var n1 = 1 - seg(t, K.tap + 1.36, K.tap + 1.48), n2 = n1;   /* neutral until their words */
      row(g, x, S.y + 250, w, rh, APPLE.rows.fmi, { sw: a1, nt: n1 }); row(g, x, S.y + 250 + rh, w, rh, APPLE.rows.fmn, { sw: a2, nt: n2 }); row(g, x, S.y + 250 + rh * 2, w, rh, APPLE.rows.sll, { sw: 0, line: false });
    }
  }
  function settingsScreen(g, S, t) {
    var P = [0, K.yourN + .25, K.findP + .25, K.tap], cur = 0;
    for (var i = 1; i < P.length; i++) if (t >= P[i]) cur = i;
    var k = cur ? eio(seg(t, P[cur], P[cur] + .3)) : 1;
    var nr = NOREC, exs = EXITING; NOREC = nr || k < 1; if (k < 1) EXITING = true;   /* a push: the pages slide through the screen's clip */
    if (cur && k < 1) { g.save(); g.translate(-S.w * .3 * k, 0); page(g, S, cur - 1, t); g.fillStyle = 'rgba(0,0,0,' + (.15 * k) + ')'; g.fillRect(S.x, S.y, S.w, S.h); g.restore(); }
    g.save(); g.translate(S.w * (1 - k), 0); if (k < 1) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(S.x - 14, S.y, 14, S.h); } page(g, S, cur, t); g.restore();
    NOREC = nr; EXITING = exs;
    onprop(function () { tag(g, 'RE-CREATED', S.x + S.w / 2, S.y + S.h - 56, 1, 0, 300, INK, '#ece6da', 36); });
  }
  function crumbs(g, t) {
    var C = [['SETTINGS', K.settings], ['[YOUR NAME]', K.yourN], ['FIND MY', K.findP]], px = 42, gap = 54, ws = C.map(function (c) { return tw(g, c[0], px, 900, 'condensed') + px * .64; });
    var tot = ws.reduce(function (a, b) { return a + b; }, 0) + gap * 2, x = 510 - tot / 2, y = 468;
    C.forEach(function (c, i) {
      var a = seg(tq(t), c[1] - .04, c[1] + .04);
      if (a > 0) {
        if (i) txt(g, '›', x - gap / 2, y, 50, CREAM, 'center', 900, DISP, 0, a, 40, 'condensed');
        chip(g, c[0], x + ws[i] / 2, y, { px: px, wt: 900, st: 'condensed', bg: CREAM, fg: INK, a: a, s: lerp(1.15, 1, eout(seg(t, c[1] - .04, c[1] + .12))), shadow: true, r: 12 });
      }
      x += ws[i] + gap;
    });
  }
  function settingsScene(g, t) {
    var E0 = S('settings').t0;
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { paperBg(g, t, TS); return; }
    var ex = EXITING; if (t < E0 + .05) EXITING = true;
    var lift = eout(seg(t, E0 - .3, E0 + .2));
    g.save(); g.translate(9 * Math.sin((t - E0) * 1.7), 80 * (1 - lift));   /* a slow hand sway: the screen never freezes between taps */
    phone(g, SP.x, SP.y, SP.w, SP.h, 0, { off: 0, name: 'settings phone', draw: function (g2, S2) { settingsScreen(g2, S2, t); } });
    g.restore();
    EXITING = ex;
    crumbs(g, t);
  }

  /* =====================================================================================================
     THE END CARD: frame 0's phone and words, YES / NO, the knob rides into frame 0's pose
     ===================================================================================================== */
  function endScene(g, t) {
    if (LAYER === 'over') return;
    var ct = t - TEND + 1 / 60;
    if (LAYER === 'bg') { paperBg(g, ct, TA); return; }
    var p = f0(ct);
    phone(g, p.x, p.y, PW, PH, p.rot, { off: 0, draw: function (g2, S2) { powerScreen(g2, S2, knobAt(ct), 1); } });
    title0(g);
    var yo = eio(seg(t, TEND - .08, TEND - .025));
    [['YES', 300], ['NO', 720]].forEach(function (cc) {
      var tq0 = cc[0] === 'YES' ? K.yesE : K.noE, tp = Math.sin(Math.PI * seg(t, tq0 - .03, tq0 + .15)), kc = eout(seg(t, K.end - .22, K.end - .1)), sc = lerp(1.08, 1, kc) * (1 - .07 * tp) * (1 - yo);
      if (sc <= .01 || kc <= 0) return;
      var oc = ONPROP, ex0 = EXITING; ONPROP = true; EXITING = ex0 || yo > 0 || kc < 1;
      chip(g, cc[0], cc[1], 1262 + 8 * tp + 6 * Math.sin(t * 4.2 + (cc[0] === 'YES' ? 0 : 2.1)) * kc, { px: 112, wt: 900, bg: BG, line: CREAM, lw: 8, fg: CREAM, w: 250, h: 160, r: 54, shadow: true, a: kc * (1 - seg(yo, .5, .9)), s: sc, maxw: 250 });
      ONPROP = oc; EXITING = ex0;
    });
  }

  /* ---------- captions ---------- */
  var CAPGROUPS = { hook: [[2], [2, 2]], ask: [[4, 5]], lost: [[4], [2]], gone: [[2], [2], [2]], twist: [[3], [3], [4]], hours: [[3, 2], [4]], network: [[3, 2], [3]], relay: [[3, 2], [3]], dip: [[3, 3], [3]], path: [[2], [3], [2]], toggle: [[4], [4]], end: [[3], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', 'findable.'], ['ask', 'off?'], ['lost', 'lose'], ['gone', 'gone.'], ['twist', 'located.'], ['hours', '24'], ['network', 'billion'], ['relay', 'Bluetooth'], ['dip', 'switch'], ['path', 'Settings,'], ['toggle', 'both'], ['end', 'on?']]
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
  var NOISE, SCENES = { roomScene: roomScene, settingsScene: settingsScene, endScene: endScene };
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  function stage(g) {
    g.fillStyle = rgbs(STG); g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(255,228,196,.05)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
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
    CURT = t;
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    STG = Sc.id === 'room' ? roomTone(te)[2] : Sc.id === 'settings' ? TS[2] : TA[2];
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
    var cst = 1 + .12 * (t < K.lost ? 1 - seg(t, K.ask - .2, K.ask + .3) : seg(t, S('end').t0 - .35, S('end').t0));
    if (cst > 1.002) { if (!CCV) { CCV = mk(W, H); CCX = CCV.getContext('2d'); } CCX.clearRect(0, 0, W, H); CCX.drawImage(g.canvas, 0, 0); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'contrast(' + cst.toFixed(3) + ')'; g.drawImage(CCV, 0, 0); g.restore(); }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor((t > TEND - 1 / 30 ? t - TEND + 1 / 30 : t) * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null, CCV = null, CCX = null;
  var POSTERPX = [];
  function posterTitle(g) {
    g.save(); g.textBaseline = 'alphabetic'; g.textAlign = 'center';
    function fit(str, px, wst, maxw) { font(g, px, 800, DISP, wst); while (g.measureText(str).width > maxw && px > 34) { px -= 1; font(g, px, 800, DISP, wst); } return px; }
    var a = 'Your iPhone can be found when off.', ap = fit(a, 58, 'semi-expanded', 800);
    g.fillStyle = CREAM; g.fillText(a, CX, 330);
    /* the scope, whole: Apple's two conditions on one highlighted block (lines fitted to <= 772 px, >= 46 px) */
    var L = ['Supported iPhone \u00b7 Find My network on:', 'up to 24 hours.'], bp = Math.min(fit(L[0], 56, 'condensed', 772), fit(L[1], 56, 'condensed', 772));
    POSTERPX = [ap, bp];
    font(g, bp, 800, DISP, 'condensed');
    L.forEach(function (str, i) {
      var y = 600 + i * bp * 1.3, wb = g.measureText(str).width, x = CX - wb / 2;
      g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, y - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
      g.textAlign = 'left'; g.fillStyle = BG; g.fillText(str, x, y);
    });
    g.restore();
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
  var GAIN = { pw: .006, sb: .012, cu: .006, gn: .012, tw: .003, bl: .009, sw: .012, pt: .012, tg: .014 };   // from rice's measured levels: every hit >= 3 dB under the voice by peak and 50 ms RMS in the final mix
  var TYPE = { pw: 'knock', sb: 'tick', cu: 'knock', gn: 'tick', tw: 'thump', bl: 'pop', sw: 'click', pt: 'tick', tg: 'click' };
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
      else if (e.type === 'thump') { stampThump(e.t, e.g, .2); slapS(e.t, e.g * .9); }   /* the re-slam: a low thump and a 1-3 kHz paper slap */
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
      STEX = {}; mkGrain();
      window.READY = true;
    });
  }
  initTimes();
  var HOLD = { t0: K.h24, t1: K.network };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { POSTERPX: function () { return POSTERPX; }, bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, TEND: TEND, POSTER: Math.round((K.TW + .3) * 30) / 30 + 1 / 60, SLUG: 'findableoff', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
