/* "They watched you type your passcode." — Factory #43 (stolendevice) on Tech, explained, after ../publicwifi/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   All cut paper, no people (no hands, no eyes, no figures): a generic phone (round punch-hole, no logo) on a café table
   with a re-created passcode pad and a coral sight-ring; the passcode as a flat paper key; paper padlocks whose tumbler
   turns with the setting off and refuses with it on; a paper switch; a map card with a dashed HOME / WORK circle; a hero
   padlock with two scan keyholes and an hour dial; a re-created Settings screen.
   Props stay whole inside x 92–928, y 302–1428. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#121821', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f3ecdf', INK = '#211d26', SLATE = '#3a4452', SLATE2 = '#2e3744';
  var KRAFT = '#c9a46a', KRAFT2 = '#9c7a48', HL = '#f3d58c', GREY = '#8f877b';
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
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function tq(t) { return (Math.floor(t * 30) + .5) / 30; }   /* a displayed state follows the frame the renderer samples */

  /* ---------- the voice is the timeline ---------- */
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
  var BODY = { thump: .2, knock: .14, slap: .1, pop: .12, tick: .05, click: .06 };
  var GT = {};
  /* for a hit that must land inside a short breath: only the heard voice (VAD) blocks, ±0.04 s */
  function placeV(name, type, want, lo, hi) {
    var body = BODY[type], best = null, V = VAD.map(function (v) { return [v.t0 - .04, v.t1 + .04]; }).sort(function (a, b) { return a[0] - b[0]; }), p0 = 0;
    V.concat([[DUR + 9, DUR + 9]]).forEach(function (b) { var a0 = Math.max(p0, lo), b0 = Math.min(b[0], hi) - body; if (b0 >= a0) { var c = clamp(want, a0, b0); if (best === null || Math.abs(c - want) < Math.abs(best - want)) best = c; } p0 = Math.max(p0, b[1]); });
    GT[name] = best;
  }
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }

  /* =====================================================================================================
     APPLE'S STRINGS (one block, so a correction is one edit). BRIEF.md §3a, read by curl 2026-11-28:
       A = Apple Support 120340 "About Stolen Device Protection for iPhone" (Published Date: October 22, 2026)
       B = Apple Support 118723 "About iOS 17 Updates", iOS 17.3 section;  C = Apple Support 100100, iOS 17.3 row
     Every string the picture quotes from Apple is here, word for word (upper-cased for the paper type). The film's own
     labels (scope plate, lock names, SCAN · 1 HOUR · SCAN AGAIN) are marked OURS.
     ===================================================================================================== */
  var APPLE = {
    away: 'AWAY FROM FAMILIAR LOCATIONS',                      /* A2 "…away from familiar locations such as home or work." */
    faceOr: 'FACE ID OR TOUCH ID',                             /* A3 / B14 "…Face ID or Touch ID…" */
    noFallback: 'NO PASSCODE FALLBACK',                        /* B14 "…with no passcode fallback…" */
    keychain: ['USE PASSWORDS', 'OR PASSKEYS', 'SAVED IN KEYCHAIN'],   /* A6 row 1 "Use passwords or passkeys saved in Keychain" */
    account: 'CHANGE YOUR APPLE ACCOUNT PASSWORD',             /* A7 row 1 "Change your Apple Account password" */
    pay: ['“YOU CAN STILL', 'USE YOUR iPHONE', 'PASSCODE FOR', 'PURCHASES WITH', 'APPLE PAY.”'],   /* A8, the whole sentence */
    might: ['MIGHT BE ON', 'BY DEFAULT'],                      /* A10 "Stolen Device Protection might be turned on by default." (never "on by default") */
    must: ['MUST BE ON', 'BEFORE IT\'S STOLEN'],              /* A9 "…must be turned on before the device is lost or stolen." (BRIEF §3b.7 chip wording) */
    settings: 'SETTINGS', faceRow: 'FACE ID & PASSCODE', touchRow: 'OR TOUCH ID & PASSCODE',   /* A11 "Go to Settings, then tap Face ID & Passcode." / "Face ID (or Touch ID) & Passcode" */
    enter: ['ENTER YOUR DEVICE', 'PASSCODE'],                  /* A11 "Enter your device passcode." */
    sdp: 'STOLEN DEVICE PROTECTION',                           /* A11 "Tap Stolen Device Protection…" (the setting's name) */
    version: 'iOS 17.3 · JAN 2024',                            /* C "iOS 17.3 and iPadOS 17.3" · "22 Jan 2024" */
    credit: 'APPLE'
  };
  var OURS = {
    off: 'WITH STOLEN DEVICE PROTECTION OFF',                  /* BRIEF §3b.1: the threat is scoped, ≥ 48 px, keys → dip */
    saved: 'SAVED PASSWORDS', acct1: 'YOUR APPLE ACCOUNT', acct2: ['APPLE ACCOUNT', 'PASSWORD'],
    delay: 'SCAN · 1 HOUR · SCAN AGAIN',                       /* BRIEF §3b.4, from A4 "wait an hour and then perform an additional Face ID or Touch ID authentication" */
    stamp: '1 HOUR', plus: '+1 HOUR', later: 'PHONE GONE', now: 'NOW', homework: 'HOME / WORK', lost: 'LOST', key: 'PASSCODE', you: 'YOU', applePay: 'APPLE PAY'
  };
  var QUERY = 'THIEF KNOWS MY IPHONE PASSCODE', QPRE = 'THIEF KNOWS MY IPHONE ', QWORD = 'PASSCODE';

  var K = {
    hook: start('hook'), passH: at('hook', 'passcode.'), hookEnd: lend('hook'),
    took0: start('took'), tookW: at('took', 'took'), iphone: at('took', 'iPhone.'), tookEnd: lend('took'),
    ask: start('ask'), thief: at('ask', 'thief'), passA: at('ask', 'passcode'), lockA: at('ask', 'lock'), outA: at('ask', 'out?'), askEnd: lend('ask'),
    keys: start('keys'), setting: at('keys', 'setting'), offK: at('keys', 'off,'), opens: at('keys', 'opens'), saved: at('keys', 'saved'), pwK: at('keys', 'passwords.'), keysEnd: lend('keys'),
    dip: start('dip'), change: at('dip', 'change'), acct: at('dip', 'Account'), pwD: at('dip', 'password.'), dipEnd: lend('dip'),
    twist: start('twist'), stolen: at('twist', 'Stolen'), prot: at('twist', 'Protection'), onT: at('twist', 'on.'), twistEnd: lend('twist'),
    away: start('away'), home: at('away', 'home'), work: at('away', 'work,'), those: at('away', 'those'), need: at('away', 'need'), face: at('away', 'face'), finger: at('away', 'fingerprint.'), awayEnd: lend('away'),
    delay: start('delay'), scan1: at('delay', 'scan,'), hourW: at('delay', 'hour,'), another: at('delay', 'another'), scan2: at('delay', 'scan.'), delayEnd: lend('delay'),
    hour: start('hour'), hourH: at('hour', 'hour'), lets: at('hour', 'lets'), mark: at('hour', 'mark'), lostW: at('hour', 'lost.'), hourEnd: lend('hour'),
    pay: start('pay'), payW: at('pay', 'Pay'), passP: at('pay', 'passcode,'), though: at('pay', 'though.'), payEnd: lend('pay'),
    check: start('check'), settings: at('check', 'Settings,'), faceC: at('check', 'Face'), andC: at('check', 'and'), passC: at('check', 'Passcode.'), checkEnd: lend('check'),
    end: start('end'), must: at('end', 'must'), onE: at('end', 'on'), theft: at('end', 'theft.'), theftEnd: wend('end', 'theft.'), is: at('end', 'Is'), endEnd: wend('end', 'yours?')
  };
  /* the hits: each one sits in a voice gap and lands on a visible beat */
  (function () {
    place('rg', 'tick', K.hookEnd + .3, .16, K.hookEnd, K.took0);          /* the sight-ring locks on, SEEN pulses */
    place('tk', 'slap', K.tookEnd + .3, .16, K.tookEnd, K.ask);            /* the phone lands on the stage */
    place('q', 'pop', K.askEnd + .32, .17, K.askEnd, K.keys);              /* the ? pops into the account lock */
    place('cs', 'tick', K.keysEnd + .3, .16, K.keysEnd, K.dip);            /* the saved passwords spill out */
    place('yd', 'thump', K.dipEnd + .32, .2, K.dipEnd, K.twist - .45);     /* YOU drops off the lock, greyed */
    place('sw', 'click', K.twistEnd + .3, .16, K.twistEnd, K.away);        /* the switch's knob lands on ON */
    placeV('kb', 'click', wend('away', 'work,') + .2, wend('away', 'work,'), K.those + .05);   /* the tumbler refuses the key: a dull clack */
    place('hl', 'knock', K.awayEnd + .35, .18, K.awayEnd, K.delay);        /* the hero lock lands */
    placeV('st', 'knock', wend('delay', 'hour,') + .06, wend('delay', 'hour,'), K.another + .05);   /* 1 HOUR inks */
    place('op', 'click', K.delayEnd + .4, .15, K.delayEnd, K.hour);        /* the hero lock's shackle lifts */
    place('lo', 'slap', K.hourEnd + .32, .17, K.hourEnd, K.pay - .4);      /* LOST slams onto the phone */
    place('py', 'click', K.payEnd + .3, .16, K.payEnd, K.check - .4);      /* the APPLE PAY lock opens */
    place('ck', 'click', K.checkEnd + .25, .1, K.checkEnd, K.end);         /* the Settings switch turns on */
    placeV('yn', 'slap', K.endEnd + .17, K.endEnd, DUR - .2);         /* YES is tapped */
  })();
  function gt(n, d) { return GT[n] != null ? GT[n] : d; }
  K.RG = gt('rg', K.hookEnd + .3); K.TK = gt('tk', K.tookEnd + .3); K.Q = gt('q', K.askEnd + .3); K.CS = gt('cs', K.keysEnd + .3);
  K.YD = gt('yd', K.dipEnd + .35); K.SW = gt('sw', K.twistEnd + .3); K.HL = gt('hl', K.awayEnd + .35); K.KB = gt('kb', wend('away', 'work,') + .2);
  K.ST = gt('st', wend('delay', 'hour,') + .25); K.OP = gt('op', K.delayEnd + .4);
  K.LO = gt('lo', K.hourEnd + .3); K.PY = gt('py', K.payEnd + .3); K.CK = gt('ck', K.checkEnd + .25); K.YN = gt('yn', K.endEnd + .28);
  K.EC = K.theftEnd + .14;                                   /* the end card is in by here (the wipe runs in the gap after "theft.") */
  var TEND = Math.round(DUR * 30) / 30;                      /* frame 0 of the next loop sits at TEND */
  var SC = [
    { id: 'net', fn: 'netScene', name: 'The passcode', t0: 0 },
    { id: 'on', fn: 'onScene', name: 'The setting', t0: K.twist, tw: .34 },
    { id: 'pay', fn: 'payScene', name: 'Apple Pay', t0: K.pay, tw: .32, dir: -1 },
    { id: 'check', fn: 'checkScene', name: 'Check yours', t0: K.check, tw: .32 },
    { id: 'end', fn: 'endScene', name: 'Is yours?', t0: K.EC, tw: .22, dir: -1 }
  ];
  var SHOTS;
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
  var NOMEASURE = { floor: 1 };
  function prop(g, name, x0, y0, x1, y1) {
    if (!PROPS || EXITING || (g !== ctx && g !== tctx) || NOMEASURE[name] || g.globalAlpha < .05) return;
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
  function tw(g, text, px, wt, st, fam) { font(g, px, wt || 900, fam || DISP, st || 'condensed'); return g.measureText(text).width; }
  /* quiet tags (RE-CREATED, FICTIONAL BANK, MADE-UP ADDRESSES): an outline, never coral, ≥ 36 px */
  function tag(g, text, x, y, a, rot, maxw, col, bg, px) { chip(g, text, x, y, { px: px || 36, wt: 700, fam: MONO, line: col || CREAM, lw: 3, fg: col || CREAM, a: a, rot: rot == null ? .01 : rot, shadow: false, bg: bg || 'rgba(16,22,28,.9)', maxw: maxw || 820 }); }
  function onprop(fn) { var o = ONPROP; ONPROP = true; fn(); ONPROP = o; }
  function peelT(g, x0, y1, eo) { g.translate(x0, y1); g.rotate(-.08 * eo); g.translate(-x0, -y1); g.translate(-70 * eo, 50 * eo); g.globalAlpha *= 1 - eo; }
  function quiet(fn, cond) { var ex = EXITING; if (cond) EXITING = true; fn(); EXITING = ex; }

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
  /* a clipping of a source page: opaque paper, the quote line by line, the credit, RE-CREATED; `inn` slides it in from the
     right, `out` peels it off to the left (it lifts, tilts and drops) */
  function qplate(g, x0, y0, w, lines, px, credit, seed, inn, out, lineA) {
    if (inn <= 0 || out >= 1) return 0;
    var ex0 = EXITING, lh = px * 1.12, h = 26 + lines.length * lh + 58;
    var ei = eout(clamp(inn, 0, 1)), eo = eio(clamp(out, 0, 1));
    g.save();
    if (ei < 1) { g.translate(110 * (1 - ei), 0); g.globalAlpha *= seg(ei, 0, .7); EXITING = true; }
    if (eo > 0) { EXITING = true; g.translate(x0, y0 + h); g.rotate(-.08 * eo); g.translate(-x0, -(y0 + h)); g.translate(-60 * eo, 50 * eo); g.globalAlpha *= 1 - eo; }
    sheet(g, x0, y0, x0 + w, y0 + h, seed, PAPER, 'clipping');
    onprop(function () {
      lines.forEach(function (L, i) { txt(g, L, x0 + 28, y0 + 20 + lh * (i + .5), px, INK, 'left', 900, DISP, w - 56, lineA == null ? 1 : lineA, 40, 'condensed'); });
      txt(g, credit, x0 + 28, y0 + h - 32, 36, '#5d564c', 'left', 800, DISP, w - 300, 1, 36, 'condensed');
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
  function mixT(A, B, k) { return A.map(function (a, i) { return a.map(function (v, j) { return lerp(v, B[i][j], clamp(k, 0, 1)); }); }); }
  function rgbs(a) { return 'rgb(' + a.map(Math.round).join(',') + ')'; }
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
      { p: torn([[-200, 1300], [420, 1370], [1300, 1260], [1300, 2300], [-200, 2300]], 621), d: [14, .13, 0] },
      { p: torn([[-200, -100], [200, -100], [110, 860], [-200, 980]], 622), d: [10, .17, 1.3] },
      { p: torn([[1300, 100], [900, 220], [960, 1040], [1300, 1120]], 623), d: [12, .11, 2.4] }
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
    /* a quiet floor under the safe box (y 1452 down, where TikTok's caption sits): a darker torn paper band, faint lines */
    if (!FLOORP) { var fr = mulberry(41); FLOORP = [[-60, H + 60]]; for (var fx = -60; fx <= W + 60; fx += 36) FLOORP.push([fx, 1456 + (fr() - .5) * 12]); FLOORP.push([W + 60, H + 60]); }
    g.save(); g.translate(4 * Math.sin(ct * .35), 0); g.fillStyle = 'rgba(0,0,0,.15)'; poly(g, FLOORP); g.fill();
    g.strokeStyle = 'rgba(244,237,224,.06)'; g.lineWidth = 4;
    for (var fl = 0; fl < 3; fl++) { var fy = 1560 + fl * 118, fo = (ct * (14 + fl * 5) + fl * 211) % 360; g.beginPath(); for (var lx = -360 + fo; lx < W + 40; lx += 360) { g.moveTo(lx, fy); g.lineTo(lx + 210, fy); } g.stroke(); }
    g.restore();
    g.drawImage(GRAIN, -150, -150);
  }
  var FLOORP = null;

  /* =====================================================================================================
     PROPS (all cut paper, no people, no hands, no logos)
     ===================================================================================================== */
  /* the generic phone: dark body, round punch-hole, no notch, no logo */
  function phone(g, cx, cy, w, h, rot, o) {
    o = o || {}; var rad = w * .13;
    g.save(); g.translate(cx, cy); g.rotate(rot || 0); g.translate(-w / 2, -h / 2);
    g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, 10, 16, w, h, rad); g.fill();
    g.fillStyle = '#2a313d'; rr(g, 0, 0, w, h, rad); g.fill();
    rr(g, 0, 0, w, h, rad); grainIn(g, 0, 0, w, h, 7401, .8);
    g.strokeStyle = 'rgba(244,237,224,.45)'; g.lineWidth = 3; rr(g, 0, 0, w, h, rad); g.stroke();
    g.fillStyle = '#3a4452'; rr(g, w - 4, h * .22, 12, h * .14, 5); g.fill();
    prop(g, o.name || 'phone', 0, 0, w, h);
    var m = Math.max(8, w * .035), S = { x: m, y: m, w: w - 2 * m, h: h - 2 * m };
    g.save(); rr(g, S.x, S.y, S.w, S.h, rad - m * .6); g.clip();
    if (o.draw) o.draw(g, S);
    g.restore();
    g.fillStyle = '#05080b'; el(g, w / 2, m + w * .07, w * .034, w * .034);   /* round punch-hole */
    g.restore();
  }
  /* the passcode pad (re-created, no words, no digits): six entry dots and twelve round keys; `n` dots filled, `lit` the key
     being pressed (0..11, -1 none), `check` a small cream check (Apple Pay) */
  var PADSEQ = [4, 7, 1, 9, 2, 6];
  function padScreen(g, S, n, lit, litK, o) {
    o = o || {};
    g.fillStyle = o.bg || '#efe8da'; g.fillRect(S.x, S.y, S.w, S.h);
    var cx = S.x + S.w / 2, dy = S.y + S.h * .2, dw = S.w * .1;
    for (var i = 0; i < 6; i++) {
      var x = cx + (i - 2.5) * dw, f = clamp(n - i, 0, 1);
      g.strokeStyle = INK; g.lineWidth = Math.max(3, S.w * .012); g.beginPath(); g.arc(x, dy, S.w * .026, 0, 6.283); g.stroke();
      if (f > 0) { g.fillStyle = INK; el(g, x, dy, S.w * .026 * f, S.w * .026 * f); }
    }
    var kw = S.w * .22, kx0 = cx - kw * 1.12, ky0 = S.y + S.h * .38, kg = S.h * .135;
    for (var k = 0; k < 12; k++) {
      if (k === 9 || k === 11) continue;
      var c = k % 3, r = Math.floor(k / 3), x2 = kx0 + c * kw * 1.12, y2 = ky0 + r * kg, on = k === lit ? litK : 0;
      g.fillStyle = mixc(hex('#d9d1c0'), hex('#2c3340'), on); el(g, x2, y2, kw * .4, kw * .4);
      g.fillStyle = mixc(hex('#c8bfac'), hex('#41495a'), on); el(g, x2, y2 + kw * .05, kw * .12, kw * .12);
    }
    if (o.check > 0) {
      var ck = o.check; g.save(); g.translate(cx, S.y + S.h * .2); g.globalAlpha *= ck;
      g.fillStyle = '#efe8da'; g.fillRect(-S.w * .4, -S.w * .09, S.w * .8, S.w * .18);
      g.fillStyle = INK; el(g, 0, 0, S.w * .085, S.w * .085);
      g.strokeStyle = CREAM; g.lineWidth = S.w * .028; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-S.w * .04, 0); g.lineTo(-S.w * .008, S.w * .032); g.lineTo(S.w * .045, -S.w * .03); g.stroke();
      g.restore();
    }
  }
  /* frame 0's sight-ring: a coral paper lens ring (no eye, no person) with a dashed sight line out to the top right */
  function sightRing(g, x, y, r, a, ct, lineA) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    var la = lineA == null ? 1 : lineA;
    if (la > 0) { g.save(); g.globalAlpha *= la; g.strokeStyle = HOT; g.lineWidth = 5; g.setLineDash([18, 14]); g.lineDashOffset = -ct * 70;
      g.beginPath(); g.moveTo(x + r * .72, y - r * .72); g.lineTo(x + 520, y - 520); g.stroke(); g.restore(); }
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(x + 6, y + 9, r + 14, 0, 6.283); g.moveTo(x + 6 + r - 6, y + 9); g.arc(x + 6, y + 9, r - 6, 0, 6.283); g.fill('evenodd');
    g.fillStyle = HOT; g.beginPath(); g.arc(x, y, r + 14, 0, 6.283); g.moveTo(x + r - 6, y); g.arc(x, y, r - 6, 0, 6.283); g.fill('evenodd');
    g.strokeStyle = 'rgba(80,20,10,.4)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + 4, 0, 6.283); g.stroke();
    /* the lens: a faint tint, a glint */
    g.fillStyle = 'rgba(255,214,190,.12)'; el(g, x, y, r - 6, r - 6);
    g.strokeStyle = 'rgba(255,240,230,.7)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, r - 22, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
    g.restore();
  }
  /* the passcode as a flat paper key: a tag-shaped bow with its name, a blade with teeth. Local origin = the blade's tip,
     blade along −x. `turn` 0..1 turns it a quarter in the lock (the bow foreshortens to a sliver) */
  var KEYL = 420;
  function paperKey(g, x, y, s, rot, turn, label, o) {
    o = o || {};
    var col = o.col || CREAM, ink = o.ink || INK, bl = 220, bh = 46, bw = 200, bhh = 124;
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    var f = Math.max(.1, Math.cos(Math.PI / 2 * clamp(turn || 0, 0, 1)));
    g.scale(1, f);
    if (o.clipX != null) { g.beginPath(); g.rect(-2000, -400, 2000 + o.clipX, 800); g.clip(); }
    /* shadow */
    g.fillStyle = 'rgba(0,0,0,.35)'; poly(g, keyPath(bl, bh, bw, bhh, 7, 10)); g.fill();
    g.fillStyle = col; poly(g, keyPath(bl, bh, bw, bhh, 0, 0)); g.fill();
    g.strokeStyle = o.line || 'rgba(33,29,38,.45)'; g.lineWidth = 3; poly(g, keyPath(bl, bh, bw, bhh, 0, 0)); g.stroke();
    /* the blade's groove */
    g.fillStyle = 'rgba(33,29,38,.18)'; g.fillRect(-bl + 6, -6, bl - 30, 8);
    /* the bow's hole (a ring for a key ring) */
    g.fillStyle = o.hole || '#2b2219'; el(g, -bl - bw + 34, 0, 16, 16);
    if (label && f > .5) onprop(function () {
      if (o.upright) { g.save(); g.translate(-bl - bw / 2 + 30, 0); g.rotate(Math.PI); txt(g, label, 0, -3, o.px || 40, ink, 'center', 900, DISP, bw - 90, 1, 30, 'condensed'); g.restore(); }
      else txt(g, label, -bl - bw / 2 + 14, 3, o.px || 40, ink, 'center', 900, DISP, bw - 70, 1, 30, 'condensed'); });
    if (!o.noProp) prop(g, o.name || 'key', -bl - bw, -bhh / 2, 0, bhh / 2);
    g.restore();
  }
  function keyPath(bl, bh, bw, bhh, dx, dy) {
    var P = [[0 + dx, -bh / 2 + 8 + dy], [-10 + dx, -bh / 2 + dy], [-bl + dx, -bh / 2 + dy], [-bl + dx, -bhh / 2 + 16 + dy], [-bl - 16 + dx, -bhh / 2 + dy], [-bl - bw + 22 + dx, -bhh / 2 + dy],
      [-bl - bw + dx, -bhh / 2 + 22 + dy], [-bl - bw + dx, bhh / 2 - 22 + dy], [-bl - bw + 22 + dx, bhh / 2 + dy], [-bl - 16 + dx, bhh / 2 + dy], [-bl + dx, bhh / 2 - 16 + dy], [-bl + dx, bh / 2 + dy]];
    /* teeth along the blade's lower edge */
    var teeth = [[-bl + 30, 0], [-bl + 52, 18], [-bl + 74, 0], [-bl + 96, 24], [-bl + 118, 0], [-bl + 140, 14], [-bl + 162, 0], [-60, 20], [-40, 0]];
    teeth.forEach(function (q) { P.push([q[0] + dx, bh / 2 + q[1] + dy]); });
    P.push([-14 + dx, bh / 2 + dy], [0 + dx, bh / 2 - 8 + dy]);
    return P;
  }
  /* a paper padlock: body, steel shackle (`open` 0..1 lifts it and swings it out on its right leg), a keyhole of a kind:
     'key' a plain keyhole, 'q' a question mark, 'scan' a face frame and a fingerprint. Returns the keyhole's centre */
  function padlock(g, cx, cy, w, h, o) {
    o = o || {};
    var x0 = cx - w / 2, y0 = cy - h / 2, sw = w * (o.swK || .62), st = w * (o.stK || .13), sh = h * (o.shK || .72), open = clamp(o.open || 0, 0, 1);
    var lift = sh * .34 * eout(clamp(open * 1.4, 0, 1)), sw2 = .32 * seg(open, .45, 1);
    /* the shackle (behind the body): a thick U; the right leg is the pivot */
    g.save();
    var rx = cx + sw / 2 - st / 2, ry = y0 + 6;
    g.translate(rx, ry - lift); g.rotate(-sw2); g.translate(-rx, -(ry - lift));
    g.translate(0, -lift);
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = st; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(cx - sw / 2 + st / 2 + 5, y0 + 30); g.lineTo(cx - sw / 2 + st / 2 + 5, y0 - sh + sw / 2 + 8); g.arc(cx + 5, y0 - sh + sw / 2 + 8, sw / 2 - st / 2, Math.PI, 0); g.lineTo(cx + sw / 2 - st / 2 + 5, y0 + 30); g.stroke();
    g.strokeStyle = o.steel || '#9aa0a6';
    g.beginPath(); g.moveTo(cx - sw / 2 + st / 2, y0 + 30); g.lineTo(cx - sw / 2 + st / 2, y0 - sh + sw / 2); g.arc(cx, y0 - sh + sw / 2, sw / 2 - st / 2, Math.PI, 0); g.lineTo(cx + sw / 2 - st / 2, y0 + 30); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = st * .22;
    g.beginPath(); g.arc(cx, y0 - sh + sw / 2, sw / 2 - st * .72, Math.PI * 1.08, Math.PI * 1.55); g.stroke();
    g.restore();
    /* the body */
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 9, y0 + 13, w, h, w * .09); g.fill();
    g.fillStyle = o.body || '#e7dcc4'; rr(g, x0, y0, w, h, w * .09); g.fill();
    rr(g, x0, y0, w, h, w * .09); grainIn(g, x0, y0, w, h, 8101 + (o.seed || 0), .8);
    g.fillStyle = 'rgba(33,29,38,.12)'; g.fillRect(x0 + w * .06, y0 + h * .1, w * .88, 6); g.fillRect(x0 + w * .06, y0 + h * .86, w * .88, 6);
    g.strokeStyle = 'rgba(33,29,38,.4)'; g.lineWidth = 3; rr(g, x0, y0, w, h, w * .09); g.stroke();
    prop(g, o.name || 'lock', x0, y0 - sh - lift, x0 + w, y0 + h);
    var kx = cx + (o.khx || 0), ky = cy + (o.khy || 0), kr = Math.min(w, h) * (o.khr || .16);
    var kind = o.kind || 'key';
    if (kind === 'key' || kind === 'q' || o.morph != null) {
      var ka = o.morph == null ? 1 : 1 - seg(o.morph, 0, .5);
      if (ka > 0) { g.save(); g.globalAlpha *= ka;
        g.fillStyle = '#2b2219'; el(g, kx, ky - kr * .25, kr * .55, kr * .55); poly(g, [[kx - kr * .3, ky], [kx + kr * .3, ky], [kx + kr * .18, ky + kr * .9], [kx - kr * .18, ky + kr * .9]]); g.fill();
        g.restore(); }
    }
    if (kind === 'scan' || o.morph != null) {
      var sa = o.morph == null ? 1 : seg(o.morph, .4, 1);
      if (sa > 0) scanGlyph(g, kx, ky, kr * 1.25 * lerp(.6, 1, eout(sa)), sa, o.lit || 0);
    }
    if (kind === 'q' && o.q > 0) {
      var qk = o.q, qs = lerp(1.5, 1, eout(seg(qk, 0, .5)));
      g.save(); g.globalAlpha *= seg(qk, 0, .2) * (o.qa == null ? 1 : o.qa); g.translate(kx, ky - kr * 1.9); g.scale(qs, qs);
      g.fillStyle = INK; el(g, 0, 0, kr * .95, kr * .95);
      var nr = NOREC; onprop(function () { txt(g, '?', 0, 4, kr * 1.5, CREAM, 'center', 900, DISP, 0, 1, 40, 'condensed'); }); NOREC = nr;
      g.restore();
    }
    return { x: kx, y: ky, r: kr };
  }
  /* the second keyhole: a face frame (four corners, two eyes, a smile) over a fingerprint (arcs): Face ID or Touch ID */
  function scanGlyph(g, x, y, r, a, lit) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y);
    var L = clamp(lit || 0, 0, 1);
    g.fillStyle = 'rgba(0,0,0,.3)'; el(g, 5, 7, r * 1.25, r * 1.25);
    g.fillStyle = mixc(hex('#2b2219'), hex(HL), L); el(g, 0, 0, r * 1.25, r * 1.25);
    var c = L > .5 ? INK : CREAM;
    g.strokeStyle = c; g.lineWidth = Math.max(3, r * .09); g.lineCap = 'round';
    /* the face frame: four corners */
    var q = r * .78, k = r * .3;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (d) { g.beginPath(); g.moveTo(d[0] * q, d[1] * (q - k)); g.lineTo(d[0] * q, d[1] * q); g.lineTo(d[0] * (q - k), d[1] * q); g.stroke(); });
    /* the fingerprint, inside the frame */
    g.lineWidth = Math.max(2, r * .055);
    for (var i = 0; i < 4; i++) { var rr2 = r * (.14 + i * .13); g.beginPath(); g.arc(0, r * .1, rr2, Math.PI * (1.05 - i * .03), Math.PI * (1.95 + i * .03)); g.stroke(); }
    g.beginPath(); g.moveTo(-r * .14, r * .1); g.quadraticCurveTo(-r * .16, r * .42, -r * .02, r * .58); g.stroke();
    g.beginPath(); g.moveTo(r * .14, r * .1); g.quadraticCurveTo(r * .2, r * .36, r * .1, r * .55); g.stroke();
    g.beginPath(); g.moveTo(-r * .4, r * .12); g.quadraticCurveTo(-r * .42, r * .4, -r * .3, r * .52); g.stroke();
    g.beginPath(); g.moveTo(r * .4, r * .12); g.quadraticCurveTo(r * .44, r * .34, r * .36, r * .46); g.stroke();
    g.restore();
  }
  /* a 60-minute paper dial: a cream disc, twelve ticks, an ink hand; `sweep` 0..1 inks the elapsed wedge (yellow paper) */
  function hourDial(g, x, y, r, sweep, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 7, 10, r + 10, r + 10);
    g.fillStyle = '#2b2219'; el(g, 0, 0, r + 10, r + 10);
    g.fillStyle = PAPER; el(g, 0, 0, r, r);
    var s = clamp(sweep, 0, 1);
    if (s > 0) { g.fillStyle = HL; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * .92, -Math.PI / 2, -Math.PI / 2 + s * 6.283); g.closePath(); g.fill(); }
    g.strokeStyle = INK; g.lineCap = 'round';
    for (var i = 0; i < 12; i++) { var an = i / 12 * 6.283, l = i % 3 === 0 ? .2 : .11; g.lineWidth = i % 3 === 0 ? 7 : 4; g.beginPath(); g.moveTo(Math.sin(an) * r * (.9 - l), -Math.cos(an) * r * (.9 - l)); g.lineTo(Math.sin(an) * r * .9, -Math.cos(an) * r * .9); g.stroke(); }
    var ha = s * 6.283; g.lineWidth = Math.max(6, r * .07); g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(ha) * r * .72, -Math.cos(ha) * r * .72); g.stroke();
    g.fillStyle = INK; el(g, 0, 0, r * .08, r * .08);
    prop(g, 'dial', -r - 10, -r - 10, r + 10, r + 10);
    g.restore();
  }
  /* the big paper switch: a rounded track and a knob; `on` 0..1 slides the knob right and turns the track cream */
  function bigSwitch(g, cx, cy, w, h, on, name, noLabels) {
    var x0 = cx - w / 2, y0 = cy - h / 2, k = clamp(on, 0, 1);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 8, y0 + 12, w, h, h / 2); g.fill();
    g.fillStyle = mixc(hex('#3b3640'), hex(noLabels && name === 'settings switch' ? '#F2D27A' : '#f1e7cf'), k); rr(g, x0, y0, w, h, h / 2); g.fill();
    g.strokeStyle = 'rgba(244,237,224,.5)'; g.lineWidth = 3; rr(g, x0, y0, w, h, h / 2); g.stroke();
    var kr = h / 2 - 12, kx = lerp(x0 + h / 2, x0 + w - h / 2, eio(k));
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, kx + 5, cy + 8, kr, kr);
    g.fillStyle = k > .5 ? INK : CREAM; el(g, kx, cy, kr, kr);
    prop(g, name || 'switch', x0, y0, x0 + w, y0 + h);
    if (noLabels) return;
    var nr = NOREC; NOREC = true;
    onprop(function () {
      txt(g, 'ON', x0 + h * .62, cy + 2, h * .36, INK, 'center', 900, DISP, 0, seg(k, .5, .9), 30, 'condensed');
      txt(g, 'OFF', x0 + w - h * .66, cy + 2, h * .32, CREAM, 'center', 900, DISP, 0, 1 - seg(k, .1, .5), 30, 'condensed');
    });
    NOREC = nr;
  }
  /* a strip of password dots on a paper card; `k` 0..1 rewrites the dots (old row slides out, the new one in) */
  function dotsCard(g, cx, cy, w, h, k, rot, a, seed) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(cx, cy); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -w / 2 + 6, -h / 2 + 9, w, h, 14); g.fill();
    g.fillStyle = PAPER; rr(g, -w / 2, -h / 2, w, h, 14); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 3; rr(g, -w / 2, -h / 2, w, h, 14); g.stroke();
    prop(g, 'card', -w / 2, -h / 2, w / 2, h / 2);
    g.save(); rr(g, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 10); g.clip();
    var n = 7, dx = (w - 70) / (n - 1), off = (k || 0) * h;
    g.fillStyle = INK;
    for (var i = 0; i < n; i++) el(g, -w / 2 + 35 + i * dx, -off, h * .13, h * .13);
    if (k > 0) { var r = mulberry(seed || 9); for (i = 0; i < n + 2; i++) { var d = -w / 2 + 30 + i * (w - 60) / (n + 1); g.save(); g.translate(d, h - off); g.rotate(r() * 6.283); g.fillRect(-h * .11, -h * .11, h * .22, h * .22); g.restore(); } }
    g.restore();
    g.restore();
  }
  /* a generic laptop (no logo): a dark lid with a cream screen that shows a phone on a little map with a pin */
  function laptop(g, cx, cy, w, t, pinK) {
    var h = w * .62, x0 = cx - w / 2, y0 = cy - h / 2;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 8, y0 + 12, w, h, 18); g.fill();
    g.fillStyle = '#2a313d'; rr(g, x0, y0, w, h, 18); g.fill();
    g.fillStyle = '#efe8da'; rr(g, x0 + 16, y0 + 16, w - 32, h - 32, 8); g.fill();
    g.fillStyle = '#d9ceb6'; for (var i = 0; i < 4; i++) g.fillRect(x0 + 16, y0 + 40 + i * (h - 60) / 4, w - 32, 6);
    for (i = 0; i < 4; i++) g.fillRect(x0 + 30 + i * (w - 60) / 4, y0 + 16, 6, h - 32);
    /* the little phone on the map, and a pin that drops on "mark" */
    var px = cx + w * .1, py = cy + 4;
    g.fillStyle = '#2a313d'; rr(g, px - 18, py - 30, 36, 60, 8); g.fill();
    g.fillStyle = '#efe8da'; rr(g, px - 13, py - 24, 26, 48, 4); g.fill();
    if (pinK > 0) { var pk = eout(clamp(pinK, 0, 1)); g.save(); g.translate(px, py - 40 - 40 * (1 - pk)); g.globalAlpha *= seg(pinK, 0, .3);
      g.fillStyle = INK; g.beginPath(); g.arc(0, -22, 18, Math.PI * .85, Math.PI * .15); g.lineTo(0, 6); g.closePath(); g.fill(); g.fillStyle = CREAM; el(g, 0, -22, 7, 7); g.restore(); }
    /* the base */
    g.fillStyle = 'rgba(0,0,0,.35)'; poly(g, [[x0 - 30 + 8, y0 + h + 12], [x0 + w + 30 + 8, y0 + h + 12], [x0 + w + 8, y0 + h + 44], [x0 + 8, y0 + h + 44]]); g.fill();
    g.fillStyle = '#4a5260'; poly(g, [[x0 - 30, y0 + h], [x0 + w + 30, y0 + h], [x0 + w + 6, y0 + h + 32], [x0 - 6, y0 + h + 32]]); g.fill();
    g.fillStyle = '#353c48'; g.fillRect(cx - 40, y0 + h + 4, 80, 8);
    prop(g, 'laptop', x0 - 30, y0, x0 + w + 30, y0 + h + 32);
  }
  /* a generic payment terminal (no brand): a paper box, a cream screen with the contactless waves */
  function terminal(g, cx, cy, w, t, glow) {
    var h = w * 1.35, x0 = cx - w / 2, y0 = cy - h / 2;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 8, y0 + 12, w, h, 26); g.fill();
    g.fillStyle = '#3a4452'; rr(g, x0, y0, w, h, 26); g.fill();
    g.fillStyle = mixc(hex('#e8e0cc'), hex(HL), glow || 0); rr(g, x0 + 20, y0 + 22, w - 40, h * .46, 12); g.fill();
    g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = 'round';
    var wx = cx - 22, wy = y0 + 22 + h * .23;
    for (var i = 0; i < 3; i++) { g.beginPath(); g.arc(wx, wy, 18 + i * 18, -.8, .8); g.stroke(); }
    g.fillStyle = INK; el(g, wx - 6, wy, 6, 6);
    g.fillStyle = '#2b3240'; for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) rr(g, x0 + 28 + c * (w - 56) / 3 + 6, y0 + h * .58 + r * h * .12, (w - 56) / 3 - 12, h * .09, 8), g.fill();
    prop(g, 'terminal', x0, y0, x0 + w, y0 + h);
  }
  /* the map card: paper blocks and roads (no names), a dashed HOME / WORK circle with two little buildings; the phone
     glyph slides from inside the circle to outside it (`out` 0..1) */
  function mapCard(g, x0, y0, w, h, t, out, ringA) {
    sheet(g, x0, y0, x0 + w, y0 + h, 9301, '#e9e0c9', 'map');
    g.save(); g.beginPath(); g.rect(x0 + 6, y0 + 6, w - 12, h - 12); g.clip();
    g.fillStyle = '#d6c9a8';
    var r = mulberry(9302);
    for (var i = 0; i < 18; i++) { var bx = x0 + 20 + (i % 6) * (w - 40) / 6, by = y0 + 20 + Math.floor(i / 6) * (h - 40) / 3; rr(g, bx + 8, by + 8, (w - 40) / 6 - 22 - r() * 20, (h - 40) / 3 - 22 - r() * 14, 8); g.fill(); }
    g.fillStyle = '#f3ecdc'; g.fillRect(x0, y0 + h * .52, w, 18); g.fillRect(x0 + w * .58, y0, 18, h);
    g.restore();
    var cx = x0 + w * .3, cy = y0 + h * .5, R = h * .4;
    g.save(); g.globalAlpha *= ringA == null ? 1 : ringA;
    g.fillStyle = 'rgba(111,168,120,.25)'; el(g, cx, cy, R, R);
    g.strokeStyle = INK; g.lineWidth = 5; g.setLineDash([16, 12]); g.lineDashOffset = -t * 30; g.beginPath(); g.arc(cx, cy, R, 0, 6.283); g.stroke(); g.setLineDash([]);
    /* a house and an office, inside */
    g.fillStyle = INK; poly(g, [[cx - 92, cy - 4], [cx - 62, cy - 34], [cx - 32, cy - 4]]); g.fill(); g.fillRect(cx - 84, cy - 4, 44, 34);
    g.fillRect(cx + 28, cy - 44, 46, 74); g.fillStyle = '#e9e0c9'; for (var q = 0; q < 3; q++) { g.fillRect(cx + 36, cy - 36 + q * 22, 10, 12); g.fillRect(cx + 56, cy - 36 + q * 22, 10, 12); }
    g.restore();
    /* the phone glyph: inside → outside */
    var k = eio(clamp(out, 0, 1)), px = lerp(cx - 8, x0 + w * .78, k), py = lerp(cy + 60, cy + 10, k) - 18 * Math.sin(Math.PI * k);
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, px - 24 + 4, py - 40 + 6, 48, 80, 10); g.fill();
    g.fillStyle = '#2a313d'; rr(g, px - 24, py - 40, 48, 80, 10); g.fill();
    g.fillStyle = '#efe8da'; rr(g, px - 18, py - 33, 36, 66, 6); g.fill();
    return { cx: cx, cy: cy, R: R };
  }
  /* the café table, seen from above: a round kraft top with grain rings and a paper cup; the phone's dust outline stays
     on it once the phone has gone (`gone` 0..1) */
  function cafeTable(g, ct, gone, pose) {
    var cx = 520, cy = 1010, R = 640;
    g.fillStyle = 'rgba(0,0,0,.35)'; el(g, cx + 14, cy + 22, R, R);
    g.fillStyle = '#c39a60'; el(g, cx, cy, R, R);
    g.strokeStyle = 'rgba(120,80,40,.22)'; g.lineWidth = 3;
    for (var i = 1; i < 9; i++) { g.beginPath(); g.ellipse(cx + 18 * Math.sin(i), cy, R * i / 9, R * i / 9 * .96, .1, 0, 6.283); g.stroke(); }
    g.strokeStyle = '#9c7a48'; g.lineWidth = 14; g.beginPath(); g.arc(cx, cy, R - 7, 0, 6.283); g.stroke();
    /* the paper cup (top view) at the lower left, a coffee ring next to it */
    var ux = 206, uy = 800;
    g.strokeStyle = 'rgba(95,60,30,.35)'; g.lineWidth = 6; g.beginPath(); g.arc(ux + 24, uy + 170, 62, .3, 5.4); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.3)'; el(g, ux + 8, uy + 12, 100, 100);
    g.fillStyle = '#efe6d2'; el(g, ux, uy, 100, 100);
    g.fillStyle = '#d9cdb3'; el(g, ux, uy, 84, 84);
    g.fillStyle = '#5b3a22'; el(g, ux, uy, 70, 70);
    g.fillStyle = 'rgba(255,236,210,.25)'; el(g, ux - 18, uy - 20, 22, 14);
    if (gone > 0 && pose) {
      g.save(); g.globalAlpha *= gone; g.translate(pose.x, pose.y); g.rotate(pose.rot);
      g.strokeStyle = 'rgba(244,237,224,.55)'; g.lineWidth = 4; g.setLineDash([14, 12]); rr(g, -PW / 2, -PH / 2, PW, PH, PW * .13); g.stroke(); g.setLineDash([]);
      g.restore();
    }
  }

  /* ---------- the grounds: one flat paper tone per act (teal café, oxblood threat, forest setting, plum pay, ochre check) ---------- */
  var TTEAL = [hex('#173a3d'), hex('#21494c'), hex('#0f2628')], TD = [hex('#4a2125'), hex('#5f2d31'), hex('#2e1417')],
      TT = [hex('#1f3b31'), hex('#2a4d40'), hex('#142720')], TC = [hex('#3c2b3f'), hex('#4f3a53'), hex('#25192a')],
      TO = [hex('#5b4524'), hex('#6f5530'), hex('#3a2c17')];
  var STG = TTEAL[2];

  /* =====================================================================================================
     FRAME 0 (and the end card): the phone on the café table, its pad typing itself, the coral sight-ring on the dots
     ===================================================================================================== */
  var PW = 380, PH = 690;
  var F0A = { x: 566, y: 972, rot: .24 }, F0B = { x: 508, y: 934, rot: .07 }, F0T0 = -1.7, F0T1 = 1.5;
  function f0(ct) {
    var u = clamp((ct - F0T0) / (F0T1 - F0T0), 0, 1), e = 1 - (1 - u) * (1 - u);
    return { x: lerp(F0A.x, F0B.x, e), y: lerp(F0A.y, F0B.y, e), rot: lerp(F0A.rot, F0B.rot, e), s: 1 };
  }
  function tableOff(ct) { var e = sio(clamp((ct - F0T0) / (F0T1 - F0T0), 0, 1)); return { x: lerp(80, -70, e), y: lerp(34, -26, e) }; }
  var DOTDT = .2;
  function padN(ct) { return ct < 0 ? 2 : clamp(2 + ct / DOTDT, 0, 6); }          /* two dots in on frame 0, one every 0.2 s */
  function padLit(n) { if (n >= 6 || n <= 0) return [-1, 0]; var i = Math.floor(n); return [PADSEQ[i % 6], clamp(1 - (n - i) * 1.6, 0, 1)]; }
  /* a point on the phone's screen (S-relative fractions) → screen coordinates, for a phone drawn by phone() at a pose */
  function onPhone(p, w, h, fx, fy) {
    var m = Math.max(8, w * .035), lx = m + (w - 2 * m) * fx - w / 2, ly = m + (h - 2 * m) * fy - h / 2, c = Math.cos(p.rot), s = Math.sin(p.rot);
    return { x: p.x + c * lx - s * ly, y: p.y + s * lx + c * ly };
  }
  function ringAt(p, n) { var q = clamp(n - .5, 0, 5), fx = .5 + (q - 2.5) * .1; return onPhone(p, PW * (p.s || 1), PH * (p.s || 1), fx, .2); }
  /* frame-0 tension, wordless: paper drag marks trail the phone as it is slid across the table (no hand drawn) */
  function dragMarks(g, p, ct) {
    var a = .5 * (1 - seg(ct, .3, 1.6)); if (a <= 0) return;
    var dx = .836, dy = .548, nx = -dy, ny = dx;
    g.save(); g.globalAlpha *= a; g.lineCap = 'round';
    for (var i = 0; i < 4; i++) {
      var o = (i - 1.5) * 84, L = 150 + 50 * ((i * 7) % 3), bx = p.x + dx * 170 + nx * o, by = p.y + dy * 170 + ny * o, sl = 18 * Math.sin(ct * 2 + i);
      g.strokeStyle = 'rgba(244,237,224,.55)'; g.lineWidth = 12 - i % 2 * 4;
      g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + dx * (L + sl), by + dy * (L + sl)); g.stroke();
    }
    g.restore();
  }
  function tablePhone(g, p, ct, ringA, lineA) {
    var n = padN(ct), L = padLit(n);
    if (ringA > 0) dragMarks(g, p, ct);
    phone(g, p.x, p.y, PW * p.s, PH * p.s, p.rot, { name: 'phone', draw: function (g2, S) { padScreen(g2, S, n, L[0], L[1]); } });
    if (ringA > 0) { var r = ringAt(p, n), pulse = 1 + .06 * Math.sin(Math.PI * seg(CURT, K.RG - .02, K.RG + .18)); sightRing(g, r.x, r.y, 84 * pulse, ringA, ct, lineA); }
  }
  /* the title on frame 0 and the end card: PASSCODE SEEN, two words, 132 px */
  var TPX = 114, TY = 532;
  function titleXY(g) { font(g, TPX, 900, DISP, 'condensed'); var a = g.measureText(QWORD).width, b = g.measureText('SEEN').width, gp = 30, x0 = 510 - (a + gp + b) / 2; return { p: x0 + a / 2, s: x0 + a + gp + b / 2 }; }
  function title0(g, a) { var X = titleXY(g); txt(g, QWORD, X.p, TY, TPX, CREAM, 'center', 900, DISP, 0, a == null ? 1 : a, 60, 'condensed'); txt(g, 'SEEN', X.s, TY, TPX, HL, 'center', 900, DISP, 0, a == null ? 1 : a, 60, 'condensed'); }
  /* the search (re-created): from TY0 PASSCODE shrinks into the bar's end while THIEF KNOWS MY IPHONE types in front of it */
  var TY0 = .75, TY1 = 1.3, BARW = 820, BARPX = 50;
  function barPX(g) { var px = BARPX; font(g, px, 900, DISP, 'condensed'); while (g.measureText(QUERY).width > BARW - 130 && px > 40) { px -= 1; font(g, px, 900, DISP, 'condensed'); } return px; }
  function searchBar(g, t, out) {
    var sa = seg(t, TY0, TY0 + .1) * (1 - out);
    if (sa <= 0 || !LIVE.text) return;
    var x = 510, y = TY, w = BARW, h = 96, x0 = x - w / 2, y0 = y - h / 2, eo = eio(out), PX = barPX(g);
    g.save(); g.translate(-140 * eo, 0);
    var ex = EXITING; if (sa < 1 || eo > 0) EXITING = true;
    var press = Math.sin(Math.PI * seg(t, TY1 + .02, TY1 + .2));
    g.translate(x, y); g.scale(1 - .03 * press, 1 - .03 * press); g.translate(-x, -y);
    g.save(); g.globalAlpha *= sa;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 8, y0 + 10, w, h, 48); g.fill();
    g.fillStyle = PAPER; rr(g, x0, y0, w, h, 48); g.fill();
    prop(g, 'search bar', x0, y0, x0 + w, y0 + h);
    g.strokeStyle = INK; g.lineWidth = 6; g.beginPath(); g.arc(x0 + 50, y - 6, 16, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(x0 + 62, y + 6); g.lineTo(x0 + 76, y + 20); g.stroke();
    g.restore();
    font(g, PX, 900, DISP, 'condensed');
    var preW = g.measureText(QPRE).width, qW = g.measureText(QWORD).width, done = t >= TY1;
    var k = seg(t, TY0 + .06, TY1), n = Math.round(QPRE.length * k), typing = !done && n > 0;
    /* a highlighter swipes under THIEF on "thief" */
    var hk = eio(seg(t, K.thief - .06, K.thief + .4));
    if (hk > 0 && done) { var hw = g.measureText('THIEF').width; g.fillStyle = HL; rr(g, x0 + 92 - 8, y - 30, (hw + 16) * hk, 62, 10); g.fill(); }
    if (done) onprop(function () { txt(g, QUERY, x0 + 92, y + 3, PX, INK, 'left', 900, DISP, 0, 1, 36, 'condensed'); });
    else {
      var nr = NOREC; NOREC = true;
      if (n) onprop(function () { txt(g, QPRE.slice(0, n), x0 + 92, y + 3, PX, INK, 'left', 900, DISP, 0, 1, 36, 'condensed'); });
      if (typing && Math.floor(t * 8) % 2 === 0) { font(g, PX, 900, DISP, 'condensed'); g.fillStyle = INK; g.fillRect(x0 + 96 + g.measureText(QPRE.slice(0, n)).width, y - 26, 5, 52); }
      NOREC = nr;
      var X = titleXY(g), mk = eio(seg(t, TY0, TY0 + .4)), sx = lerp(X.p, x0 + 92 + preW + qW / 2, mk), spx = lerp(TPX, PX, mk);
      onprop(function () { txt(g, QWORD, sx, lerp(TY, y + 3, mk), spx, mixc(hex(CREAM), hex(INK), seg(mk, .3, .7)), 'center', 900, DISP, 0, 1, 36, 'condensed'); });
    }
    EXITING = ex; g.restore();
    /* RE-CREATED hangs under the bar's left end */
    var ta = seg(t, TY0 + .4, TY0 + .5) * (1 - out);
    if (ta > 0) quiet(function () { g.save(); g.translate(-140 * eo, 0); tag(g, 'RE-CREATED', 195, 607, ta, 0, 230, CREAM, INK, 30); g.restore(); }, ta < 1 || eo > 0);
  }
  /* SEEN: from the title to a tag on the sight line */
  function seenTag(g, t, p) {
    var r = ringAt(p, padN(t)), X = titleXY(g), mk = eio(seg(t, TY0, TY0 + .45));
    var tx = 812, ty = r.y + 40, x = lerp(X.s, tx, mk), y = lerp(TY, ty, mk), px = lerp(TPX, 48, mk);
    if (mk < 1) { quiet(function () { txt(g, 'SEEN', x, y, px, HL, 'center', 900, DISP, 0, 1, 36, 'condensed'); }, true); return; }
    var pulse = 1 + .1 * Math.sin(Math.PI * seg(t, K.RG - .02, K.RG + .18));
    chip(g, 'SEEN', x, y, { px: 48, wt: 900, st: 'condensed', bg: HL, fg: INK, r: 12, rot: -.05, s: pulse });
  }

  /* =====================================================================================================
     SCENE 1: THE PASSCODE (hook → dip). The table; the phone slides off on its own and the camera pans with it to a
     dark stage; the passcode becomes a key that turns two locks (with the setting OFF)
     ===================================================================================================== */
  function camX(t) { return 1080 * eio(seg(t, K.tookW - .06, K.tookW + .62)); }
  var SL0 = function () { return K.tookW - .14; }, SL1 = function () { return K.tookW + .42; };
  var STP = { x: 300, y: 1036, s: .8 }, STP2 = { x: 176, y: 734, s: .42 };
  function stagePhone(t) {
    var cam = camX(t), u = eio(seg(t, SL0(), SL1())), a = f0(Math.min(t, SL0()));
    var x = lerp(a.x, 1080 + STP.x - cam, u), y = lerp(a.y, STP.y, u) - 70 * Math.sin(Math.PI * u), rot = lerp(a.rot, 0, u) + .25 * Math.sin(Math.PI * u), s = lerp(1, STP.s, u);
    /* it lands on the slap (K.TK): a small drop and squash */
    var land = Math.sin(Math.PI * seg(t, K.TK - .16, K.TK)) * (1 - seg(t, K.TK, K.TK + .01));
    y -= 18 * land;
    var k2 = eio(seg(t, K.setting - .12, K.setting + .34));
    return { x: lerp(x, STP2.x, k2), y: lerp(y, STP2.y, k2), rot: rot, s: lerp(s, STP2.s, k2), u: u, k2: k2 };
  }
  var L1 = { x: 300, y: 1172, w: 300, h: 230 }, L2a = { x: 700, y: 1172 }, L2b = { x: 720, y: 1172 };
  function l2x(t) { return lerp(L2a.x, L2b.x, eio(seg(t, K.setting - .1, K.setting + .3))); }
  /* the key's tip (screen) and its turn, from "passcode" (ask) to the end of dip */
  function keyPose(t) {
    var hov = { x: 700, y: 1000 }, above1 = { x: L1.x, y: 1068 }, in1 = { x: L1.x, y: L1.y + 22 }, above2 = { x: l2x(t), y: 1068 }, in2 = { x: L2b.x, y: L1.y + 22 };
    var p = hov, turn = 0;
    var bob = 8 * Math.sin(t * 2.6);
    p = { x: hov.x, y: hov.y + bob };
    var a = seg(t, K.opens - .3, K.opens + .12); if (a > 0) { var e = eio(a); p = { x: lerp(p.x, above1.x, e), y: lerp(p.y, above1.y, e) - 60 * Math.sin(Math.PI * e) }; }
    var b = seg(t, K.opens + .12, K.saved - .02); if (b > 0) p = { x: above1.x, y: lerp(above1.y, in1.y, eout(b)) };
    turn = eio(seg(t, K.saved, K.saved + .24));
    var c = seg(t, K.dip - .06, K.dip + .14); if (c > 0) turn = lerp(turn, 0, eio(c));
    var d = seg(t, K.dip + .1, K.dip + .32); if (d > 0) p = { x: in1.x, y: lerp(in1.y, above1.y, eio(d)) };
    var e2 = seg(t, K.dip + .32, K.change + .04); if (e2 > 0) { var f = eio(e2); p = { x: lerp(above1.x, above2.x, f), y: above1.y - 70 * Math.sin(Math.PI * f) }; }
    var g2 = seg(t, K.change + .04, K.acct - .04); if (g2 > 0) p = { x: in2.x, y: lerp(above2.y, in2.y, eout(g2)) };
    if (t >= K.acct) turn = eio(seg(t, K.acct, K.acct + .24));
    var inK = t >= K.opens + .12 && t < K.dip + .32 ? 1 : t >= K.change + .04 ? 2 : 0;
    return { x: p.x, y: p.y, turn: turn, ins: inK };
  }
  function netScene(g, t) {
    if (LAYER === 'over') return;
    var cam = camX(t);
    if (LAYER === 'bg') {
      var gone = seg(t, SL0() + .1, SL0() + .3), to = tableOff(Math.min(t, F0T1)), a = f0(SL0());
      if (cam < 1080) { g.save(); g.beginPath(); g.rect(-10, -10, 1090 - cam, H + 20); g.clip(); paperBg(g, t, TTEAL); g.translate(-cam + to.x, to.y); cafeTable(g, t, gone, { x: a.x - to.x, y: a.y - to.y, rot: a.rot }); g.restore(); }
      if (cam > 0) { g.save(); g.beginPath(); g.rect(1080 - cam, -10, cam + 10, H + 20); g.clip(); g.translate(1080 - cam, 0); paperBg(g, t, TD); g.restore(); }
      return;
    }
    var sx = 1080 - cam, ph = stagePhone(t), sliding = ph.u > 0 && ph.u < 1;
    /* the table world: the sight-ring stays on the table after the phone has gone */
    if (cam < 1080) quiet(function () {
      g.save(); g.translate(-cam, 0);
      if (ph.u <= 0) tablePhone(g, f0(t), t, 1, 1);
      else { var a = f0(SL0()), r = ringAt(a, padN(SL0())), to = tableOff(Math.min(t, F0T1)); sightRing(g, r.x, r.y, 84, 1 - seg(t, SL0(), SL0() + .5) * .4, t, 1 - seg(t, SL0(), SL0() + .3)); }
      g.restore();
    }, cam > 0);
    /* SEEN rides the sight line until the pan */
    if (t >= TY0 && cam < 1) seenTag(g, t, f0(t));
    else if (cam >= 1 && cam < 1080) quiet(function () { g.save(); g.translate(-cam, 0); seenTag(g, t, f0(SL0())); g.restore(); }, true);
    /* the stage world (x + sx): the account lock, the second lock, the key, the spilled passwords, YOU */
    if (cam > 0) quiet(function () { g.save(); g.translate(sx, 5 * Math.sin(t * 1.9)); stageB(g, t, ph, sx); g.restore(); }, cam < 1080);
    /* the phone itself (screen coordinates) */
    if (ph.u > 0) quiet(function () {
      var dk = seg(t, K.passA - .08, K.passA + .25);
      phone(g, ph.x, ph.y, PW * ph.s, PH * ph.s, ph.rot, { name: 'phone', draw: function (g2, S) { padScreen(g2, S, 6 * (1 - dk), -1, 0); } });
    }, sliding || (ph.k2 > 0 && ph.k2 < 1));
    if (t < TY0) title0(g);
    searchBar(g, t, eio(seg(t, K.ask + .2, K.ask + .42)));
    card(g, OURS.later, 310, 690, t, K.tookW + .12, K.tookW + 2.66, 52, 420);
    offPlate(g, t);
  }
  /* the scope plate: WITH STOLEN DEVICE PROTECTION OFF, 50 px on an ink plate (≥ 48 px), up before any claim and
     until the wipe; OFF pulses on "off," */
  function offPlate(g, t) {
    var a = seg(t, K.ask + .2, K.ask + .44); if (a <= 0) return;
    var e = eout(a), x0 = 104, x1 = 916, y0 = TY - 46, y1 = TY + 46;
    quiet(function () {
      g.save(); g.translate(160 * (1 - e), 0); g.globalAlpha *= seg(a, 0, .6);
      g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 7, y0 + 10, x1 - x0, y1 - y0, 20); g.fill();
      g.fillStyle = INK; rr(g, x0, y0, x1 - x0, y1 - y0, 20); g.fill(); g.strokeStyle = CREAM; g.lineWidth = 3; rr(g, x0, y0, x1 - x0, y1 - y0, 20); g.stroke();
      prop(g, 'scope plate', x0, y0, x1, y1);
      /* the plate reads WITH STOLEN DEVICE PROTECTION [OFF]: the OFF chip keeps 24 px clear of the label */
      var pre = OURS.off.replace(/ OFF$/, ''), gp = 34, px = 50; font(g, px, 900, DISP, 'condensed');
      function totw() { return g.measureText(pre).width + gp + g.measureText('OFF').width + 10; }
      while (totw() > x1 - x0 - 60) { px -= 1; font(g, px, 900, DISP, 'condensed'); }
      var wPre = g.measureText(pre).width, wOff = g.measureText('OFF').width, lx0 = 510 - totw() / 2, ox = lx0 + wPre + gp + wOff / 2;
      var pk = Math.sin(Math.PI * seg(t, K.offK - .04, K.offK + .4)), hla = seg(t, K.offK - .04, K.offK + .06);
      if (hla > 0) { g.save(); g.globalAlpha *= hla; g.fillStyle = HL; rr(g, ox - wOff / 2 - 10, TY - 30 - 4 * pk, wOff + 20, 62 + 8 * pk, 10); g.fill(); g.restore(); }
      onprop(function () { txt(g, pre, lx0, TY + 2, px, CREAM, 'left', 900, DISP, 0, 1, 40, 'condensed'); });
      onprop(function () { txt(g, 'OFF', ox, TY + 2, px, mixc(hex(CREAM), hex(INK), hla), 'center', 900, DISP, 0, 1, 40, 'condensed'); });
      g.restore();
    }, a < 1);
  }
  function stageB(g, t, ph, sx) {
    /* lock 2: YOUR APPLE ACCOUNT on "lock" (ask), then APPLE ACCOUNT PASSWORD */
    var la = eout(seg(t, K.ask + .18, K.ask + .5)), x2 = l2x(t);
    var op2 = seg(t, K.pwD - .04, K.pwD + .3), kp = keyPose(t);
    if (la > 0) quiet(function () {
      g.save(); g.translate(x2, L1.y + 60 * (1 - la)); g.scale(lerp(.7, 1, la), lerp(.7, 1, la)); g.translate(-x2, -L1.y); g.globalAlpha *= seg(la, 0, .5);
      padlock(g, x2, L1.y, L1.w, L1.h, { kind: 'q', q: seg(t, K.Q - .05, K.Q + .25), qa: 1 - seg(t, K.dip + .2, K.dip + .4), open: op2, name: 'lock 2', seed: 2 });
      g.restore();
    }, la < 1);
    /* its label: YOUR APPLE ACCOUNT → APPLE ACCOUNT / PASSWORD */
    var lb = seg(t, K.ask + .5, K.ask + .62), sw = seg(t, K.setting, K.setting + .2);
    if (lb > 0 && sw < 1) quiet(function () { txt(g, OURS.acct1, x2, 1342, 44, CREAM, 'center', 900, DISP, 400, lb * (1 - sw), 36, 'condensed'); }, lb < 1 || sw > 0);
    if (sw > 0) quiet(function () { OURS.acct2.forEach(function (s2, i) { txt(g, s2, x2, 1330 + i * 50, 44, CREAM, 'center', 900, DISP, 400, sw, 36, 'condensed'); }); }, sw < 1);
    /* lock 1: SAVED PASSWORDS grows out of the phone on "setting" */
    var g1 = eout(seg(t, K.setting + .02, K.setting + .42)), op1 = seg(t, K.pwK - .04, K.pwK + .3);
    if (g1 > 0) quiet(function () {
      var px = lerp(ph.x, L1.x, g1), py = lerp(ph.y, L1.y, g1);
      g.save(); g.translate(px, py); g.scale(lerp(.3, 1, g1), lerp(.3, 1, g1)); g.translate(-L1.x, -L1.y);
      padlock(g, L1.x, L1.y, L1.w, L1.h, { kind: 'key', open: op1, name: 'lock 1', seed: 1 });
      g.restore();
    }, g1 < 1);
    var l1a = seg(t, K.setting + .42, K.setting + .54);
    if (l1a > 0) quiet(function () { txt(g, OURS.saved, L1.x, 1342, 44, CREAM, 'center', 900, DISP, 320, l1a, 36, 'condensed'); }, l1a < 1);
    /* the spilled saved passwords (dots only, no sites) on the tick after "passwords." */
    var CARDS = [[426, 652, -.1], [566, 724, .07], [436, 796, -.05]];
    CARDS.forEach(function (c, i) {
      var k = eout(seg(t, K.CS - .02 + i * .07, K.CS + .32 + i * .07)); if (k <= 0) return;
      quiet(function () { dotsCard(g, lerp(L1.x, c[0], k), lerp(L1.y - 60, c[1], k) - 90 * Math.sin(Math.PI * k), 220 * lerp(.4, 1, k), 64 * lerp(.4, 1, k), 0, lerp(.6, c[2], k), 1, 30 + i); }, k < 1);
    });
    /* the account's password field over lock 2: its dots rewrite on "password." */
    var fa = seg(t, K.change - .1, K.change + .1);
    if (fa > 0) quiet(function () { dotsCard(g, 756, 742, 230, 66, eio(seg(t, K.pwD + .08, K.pwD + .5)), .03, fa, 77); }, fa < 1);
    /* YOU: the owner's key on lock 2's side; it greys and drops on the thump */
    var ya = seg(t, K.setting + .45, K.setting + .6);
    if (ya > 0) {
      var dr = eio(seg(t, K.YD - .1, K.YD + .02)), gr = seg(t, K.YD - .12, K.YD - .02);
      var yx = lerp(x2 + 176, x2 + 130, dr), yy = lerp(L1.y + 6, 1382, dr), yr = lerp(Math.PI / 2, Math.PI / 2 + .9, dr);
      if (dr < 1) quiet(function () { g.save(); g.globalAlpha *= 1 - seg(dr, .55, 1); paperKey(g, yx, yy, .5, yr, 0, OURS.you, { px: 64, col: mixc(hex(CREAM), hex(GREY), gr), ink: INK, name: 'you key', noProp: dr > 0 }); g.restore(); }, ya < 1 || dr > 0);
    }
    /* the PASSCODE key: born from the phone's dots on "passcode", it hovers over the account lock, then turns both */
    var kb = eout(seg(t, K.passA - .06, K.passA + .32));
    if (kb > 0) {
      var dp = onPhone(ph, PW * ph.s, PH * ph.s, .5, .2), k0 = { x: dp.x - sx, y: dp.y };
      var x = lerp(k0.x, kp.x, kb), y = lerp(k0.y, kp.y, kb);
      var clipY = kp.ins === 1 ? L1.y : kp.ins === 2 ? L1.y : null;
      var ks = lerp(.2, .8, kb); quiet(function () { paperKey(g, x, y, ks, Math.PI / 2, kp.turn, OURS.key, { px: 44, clipX: clipY == null ? null : -(y - clipY) / ks, name: 'passcode key' }); }, kb < 1 || clipY != null);
    }
  }

  /* =====================================================================================================
     SCENE 2: THE SETTING (twist → hour). The big switch; the scope plate ON; the map; the key bounces; the hero lock
     with two scan keyholes and an hour dial; then that hour (a laptop marks the phone lost)
     ===================================================================================================== */
  var HERO = { x: 510, y: 1062, w: 740, h: 380 };
  function onScene(g, t) {
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { paperBg(g, t, TT); return; }
    var E0 = S('on').t0, ex = EXITING; if (t < E0 + .05) EXITING = true;
    var mv = eio(seg(t, K.away - .14, K.away + .3));
    /* the switch and its name: big on the twist, then they fly up into the ON plate */
    var lx = lerp(510, 424, mv), ly = lerp(706, TY + 2, mv), lpx = lerp(66, 44, mv);
    var drift = 1 + .01 * (t - K.twist), sx2 = lerp(510, 846, mv), sy2 = lerp(975, TY, mv) + 8 * Math.sin(t * 1.7) * (1 - mv), sw2 = lerp(760 * drift, 112, mv), sh2 = lerp(320 * drift, 54, mv);
    var on = Math.max(eio(seg(t, K.onT, K.SW)), .07 * eio(seg(t, K.twist + .25, K.onT - .05)) * (1 + .3 * Math.sin(t * 9)) / 1.3);
    var pa = seg(mv, .55, 1), plateOut0 = eio(seg(t, K.lets - .2, K.lets + .06));
    if (pa > 0 && plateOut0 < 1) quiet(function () {
      g.save(); peelT(g, 110, TY + 46, plateOut0); g.globalAlpha *= pa; var x0 = 104, x1 = 916, y0 = TY - 46, y1 = TY + 46;
      g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 7, y0 + 10, x1 - x0, y1 - y0, 20); g.fill();
      g.fillStyle = INK; rr(g, x0, y0, x1 - x0, y1 - y0, 20); g.fill(); g.strokeStyle = CREAM; g.lineWidth = 3; rr(g, x0, y0, x1 - x0, y1 - y0, 20); g.stroke();
      prop(g, 'scope plate', x0, y0, x1, y1);
      g.restore();
    }, pa < 1 || plateOut0 > 0);
    var plateOut = eio(seg(t, K.lets - .2, K.lets + .06));
    if (plateOut < 1) quiet(function () {
      g.save(); peelT(g, 110, TY + 46, plateOut);
      var bump = 1 + .04 * Math.sin(Math.PI * seg(t, K.SW - .02, K.SW + .18));
      g.translate(sx2, sy2); g.scale(bump, bump); g.translate(-sx2, -sy2);
      bigSwitch(g, sx2, sy2, sw2, sh2, on, mv > 0 ? 'mini switch' : 'switch', mv > .2);
      g.restore();
      g.save(); peelT(g, 110, TY + 46, plateOut);
      onprop(function () { txt(g, APPLE.sdp, lx, ly, lpx, CREAM, 'center', 900, DISP, 760, 1, 36, 'condensed'); });
      var oa = seg(mv, .7, 1);
      if (oa > 0) onprop(function () { font(g, 44, 900, DISP, 'condensed'); var w = g.measureText(APPLE.sdp).width; txt(g, 'ON', lx + w / 2 + 44, ly, 44, HL, 'center', 900, DISP, 0, oa, 36, 'condensed'); });
      g.restore();
    }, mv > 0 && mv < 1 || plateOut > 0);
    /* the version card: iOS 17.3 · JAN 2024, already on the paper as the wipe opens; off before the keychain lock comes in */
    card(g, APPLE.version, 510, 1300, t, K.twist - .34, K.twistEnd + .85, 56, 600, K.SW, true);
    /* ---- away: the scope chip on "on.", the map card, the keychain lock, the key that is refused, the scan keyhole ---- */
    var aw = eout(seg(t, K.away - .02, K.away + .32)), mOut = eio(seg(t, K.awayEnd - .2, K.awayEnd + .05)), aOut = eio(seg(t, K.awayEnd + .02, K.awayEnd + .28));
    if (aw > 0 && mOut < 1) quiet(function () {
      g.save(); peelT(g, 110, 860, mOut); g.translate(0, -300 * (1 - aw)); g.globalAlpha *= seg(aw, 0, .4);
      var M = mapCard(g, 110, 600, 800, 260, t, seg(t, K.home - .06, K.work + .24), 1);
      onprop(function () { chip(g, OURS.homework, M.cx, M.cy + M.R - 44, { px: 38, wt: 900, st: 'condensed', bg: INK, fg: CREAM, r: 10, rot: -.02 }); });
      g.restore();
    }, aw < 1 || mOut > 0);
    /* AWAY FROM FAMILIAR LOCATIONS · APPLE prints under the switch on "on.", then rides up onto the map card's edge */
    var ca = seg(tq(t), K.onT - .04, K.onT + .04);
    if (ca > 0 && mOut < 1) quiet(function () {
      g.save(); peelT(g, 110, 900, mOut);
      var cy = lerp(1196, 642, aw), cx = 440;
      onprop(function () { var w = chip(g, APPLE.away, cx, cy, { px: 44, wt: 900, st: 'condensed', bg: CREAM, fg: INK, r: 12, a: ca, maxw: 620 });
        tag(g, APPLE.credit, cx + w / 2 + 72, cy, ca, 0, 160, CREAM, INK, 36); });
      g.restore();
    }, ca < 1 || (aw > 0 && aw < 1) || mOut > 0);
    /* the keychain lock: big, its keyhole turns into a 200 px face/fingerprint scan on "face" */
    var KL = { x: 350, y: 1190, w: 380, h: 280 }, KB = K.KB, KA = KB - .133;
    /* the refusal beat grows lock and key 1.15× about the keyhole, then eases back once the scan is in */
    var beat = eio(seg(t, K.work - .25, K.work + .05)) * (1 - eio(seg(t, K.face + .35, K.finger + .1))), BS = 1 + .15 * beat;
    var flinch = t >= KB && t < KB + .067 ? (t < KB + .033 ? 6 : -6) : 0;
    function beatT(g) { g.translate(KL.x, KL.y); g.scale(BS, BS); g.translate(-KL.x, -KL.y); }
    var kl = eout(seg(t, K.away + .02, K.away + .3));
    if (kl > 0 && aOut < 1) quiet(function () {
      g.save(); peelT(g, 160, 1440, aOut); g.translate(-400 * (1 - kl), 0);
      g.save(); beatT(g); g.translate(flinch, 0);
      padlock(g, KL.x, KL.y, KL.w, KL.h, { kind: 'key', morph: seg(t, KB + .1, K.face + .05), lit: seg(t, K.face + .1, K.face + .3), name: 'keychain lock', seed: 3, shK: .5, khr: .3 });
      g.restore();
      APPLE.keychain.forEach(function (s2, i) { txt(g, s2, 744, 1300 + i * 36, 36, CREAM, 'center', 900, DISP, 360, seg(kl, .8, 1), 36, 'condensed'); });
      g.restore();
    }, kl < 1 || aOut > 0);
    /* the native move, mirrored (9.5 s turned; this one refuses): the 360 px PASSCODE key drives in on "work,", sits four
       frames, the tumbler won't turn — the lock flinches 6 px for two frames on the clack (K.KB) — and the key kicks back
       160 px with a 10° twist, settling for 0.25 s while the keyhole irises into the scan */
    var kin = eout(seg(t, K.home - .05, K.home + .3));
    if (kin > 0 && aOut < 1) {
      var KS = 360 / KEYL, kx = KL.x, ky = KL.y;
      var drive = eio(seg(t, K.work - .02, KA)), reb = eout(seg(t, KB + .067, KB + .3)), st2 = seg(t, KB + .3, KB + .55);
      var tip = lerp(1160, kx + 90, kin) - 130 * drive + 160 * reb, bob = 6 * Math.sin(t * 2.6) * (1 - drive) + 12 * reb;
      var tw = .1745 * reb * (1 - .45 * eio(st2)) + .035 * Math.sin(Math.PI * 2 * st2) * (1 - st2);
      var turn = .16 * Math.sin(Math.PI * seg(t, KA, KB)), clip = tip < kx ? -(kx - tip) / KS : null;
      quiet(function () { g.save(); peelT(g, 160, 1440, aOut); beatT(g); paperKey(g, tip, ky + bob, KS, Math.PI - tw, turn, OURS.key, { px: 56, clipX: clip, name: 'passcode key', upright: true }); g.restore(); }, kin < 1 || aOut > 0 || (beat > 0 && beat < 1));
    }
    /* ---- delay: the hero lock ---- */
    var hr = eout(seg(t, K.awayEnd + .22, K.HL)), hOut = eio(seg(t, K.lets - .16, K.lets + .14));
    if (hr > 0 && hOut < 1) quiet(function () { g.save(); g.translate(0, 640 * (1 - hr) + 700 * hOut + 6 * Math.sin(t * 1.9)); heroLock(g, t); g.restore(); }, hr < 1 || hOut > 0);
    /* the second keyhole's names, on "face": first above the keychain lock, then stacked under the hero lock; off before "scan," */
    var into = eio(seg(t, K.awayEnd + .02, K.awayEnd + .3)), cOut = eio(seg(t, K.scan1 - .12, K.scan1 + .02));
    var fa = seg(tq(t), K.face - .04, K.face + .04), na = seg(tq(t), K.face + .08, K.face + .16);
    if (fa > 0 && cOut < 1) quiet(function () {
      g.save(); peelT(g, 160, 1400, cOut);
      onprop(function () { chip(g, APPLE.faceOr, lerp(712, 510, into), lerp(942, 1292, into), { px: 44, wt: 900, st: 'condensed', bg: INK, fg: CREAM, line: CREAM, lw: 3, r: 12, a: fa, maxw: 400 });
      if (na > 0) chip(g, APPLE.noFallback, lerp(712, 510, into), lerp(1016, 1366, into), { px: 42, wt: 900, st: 'condensed', bg: CREAM, fg: INK, r: 12, a: na, maxw: 400 }); });
      g.restore();
    }, fa < 1 || (na > 0 && na < 1) || cOut > 0);
    /* 1 HOUR inks on its own knock (K.ST, in the breath after "hour,") and holds through "That hour" */
    var sOut = hOut;
    if (t >= K.ST - .1 && sOut < 1) quiet(function () {
      g.save(); g.translate(0, 700 * hOut + 6 * Math.sin(t * 1.9));
      var squash = -.04 * Math.sin(Math.PI * seg(t, K.ST, K.ST + .14));
      var ss = 1 + squash + .03 * sio(seg(t, K.ST + .14, K.hour));
      g.translate(510, 768); g.scale(ss, ss);
      peelT(g, -170, 90, sOut);
      onprop(function () { stamp(g, OURS.stamp, 0, 0, t, K.ST - .1, 150, HOT, -.05); });
      g.restore();
    }, sOut > 0 || hOut > 0);
    /* ---- hour: +1 HOUR; a 520 px laptop drops a pin on "mark"; a 150 px LOST tag slams onto a big phone (K.LO) ---- */
    var hi = eout(seg(t, K.lets - .12, K.lets + .2)), LP = { x: 386, y: 1000, w: 520 }, PP = { x: 728, y: 1150, rot: .06, s: .72 };
    if (hi > 0) quiet(function () {
      g.save(); g.translate(-560 * (1 - hi), 0); laptop(g, LP.x, LP.y + 5 * Math.sin(t * 1.4), LP.w, t, seg(t, K.mark - .1, K.mark + .12)); g.restore();
      g.save(); g.translate(560 * (1 - hi), 0);
      var bump = 1 + .03 * Math.sin(Math.PI * seg(t, K.LO, K.LO + .16));
      phone(g, PP.x, PP.y + 6 * Math.sin(t * 1.2 + 1), PW * PP.s * bump, PH * PP.s * bump, PP.rot, { name: 'phone', draw: function (g2, S2) { padScreen(g2, S2, 0, -1, 0); } });
      g.restore();
    }, hi < 1);
    card(g, OURS.plus, 300, 640, t, K.lets - .08, null, 56, 400, null, true);
    /* LOST rises out of the laptop on "mark", hangs over the phone on "lost.", and slams down onto it on the hit */
    var lt = seg(t, K.lets - .1, K.lets + .2);
    if (lt > 0) quiet(function () {
      var e = eout(seg(t, K.mark, K.mark + .35)), hang = eio(seg(t, K.lostW - .1, K.lostW + .2)), sl = eio(seg(t, K.LO - .12, K.LO));
      var x = lerp(lerp(LP.x - 560 * (1 - hi), 600, e), PP.x, hang), y = lerp(lerp(990, 760, e), 820, hang) + (1176 - 820) * sl;
      var sc = lerp(.5, 1, e) * seg(lt, 0, .5) * (1 + .12 * (1 - sl) * hang) * (1 - .05 * Math.sin(Math.PI * seg(t, K.LO, K.LO + .14)));
      onprop(function () { chip(g, OURS.lost, x, y, { px: 112, wt: 900, st: 'condensed', bg: CREAM, fg: INK, line: INK, lw: 5, r: 18, rot: lerp(-.2, -.1, hang) + .04 * sl, s: sc }); });
    }, lt < 1);
    EXITING = ex;
  }
  function heroLock(g, t) {
    var x = HERO.x, y = HERO.y, w = HERO.w, h = HERO.h, y0 = y - h / 2;
    var op = .55 * eio(seg(t, K.OP + .02, K.OP + .3));
    padlock(g, x, y, w, h, { kind: 'none', open: op, name: 'hero lock', seed: 4, stK: .085, swK: .7, shK: .62 });
    onprop(function () { txt(g, APPLE.account, x, y0 + 44, 38, INK, 'center', 900, DISP, w - 80, 1, 36, 'condensed'); });
    var l1 = seg(t, K.scan1 - .04, K.scan1 + .12), l2 = seg(t, K.scan2 - .04, K.scan2 + .12);
    var p1 = 1 + .12 * Math.sin(Math.PI * seg(t, K.scan1 - .04, K.scan1 + .22)), p2 = 1 + .12 * Math.sin(Math.PI * seg(t, K.scan2 - .04, K.scan2 + .22));
    scanGlyph(g, x - 218, y + 6, 66 * p1, 1, l1);
    scanGlyph(g, x + 218, y + 6, 66 * p2, 1, l2);
    hourDial(g, x, y + 6, 100, eio(seg(t, K.hourW - .04, K.another - .06)), 1);
    onprop(function () {
      txt(g, 'SCAN', x - 218, y + 140, 40, INK, 'center', 900, DISP, 0, 1, 36, 'condensed');
      txt(g, 'SCAN AGAIN', x + 218, y + 140, 40, INK, 'center', 900, DISP, 0, seg(tq(t), K.another - .04, K.another + .04), 36, 'condensed');
    });
    /* SCAN · 1 HOUR · SCAN AGAIN builds on its words under the lock */
    var parts = [['SCAN ·', K.scan1], ['1 HOUR ·', K.hourW], ['SCAN AGAIN', K.another]];
    font(g, 56, 900, DISP, 'condensed'); var sp = g.measureText(' ').width, fw = 0; parts.forEach(function (q) { fw += g.measureText(q[0]).width + sp; }); fw -= sp;
    var px0 = x - fw / 2; parts.forEach(function (q) { var w2 = g.measureText(q[0]).width, a2 = seg(tq(t), q[1] - .04, q[1] + .04); if (a2 > 0) txt(g, q[0], px0, y + h / 2 + 76, 56, CREAM, 'left', 900, DISP, 0, a2, 40, 'condensed'); font(g, 56, 900, DISP, 'condensed'); px0 += w2 + sp; });
  }

  /* =====================================================================================================
     SCENE 3: APPLE PAY (pay). The one lock the passcode still turns; Apple's whole sentence
     ===================================================================================================== */
  function payScene(g, t) {
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { paperBg(g, t, TC); return; }
    var E0 = S('pay').t0, ex = EXITING; if (t < E0 + .05) EXITING = true;
    var sway = 5 * Math.sin(t * 1.5);
    var n = 6 * seg(t, K.passP - .2, K.though), L = padLit(n), ck = seg(t, K.PY - .02, K.PY + .14);
    phone(g, 290 + sway, 1110, PW * .72, PH * .72, -.03, { name: 'phone', draw: function (g2, S2) { padScreen(g2, S2, n, L[0], L[1], { check: ck }); } });
    var op = seg(t, K.PY - .02, K.PY + .3), pop = 1 + .1 * Math.sin(Math.PI * seg(t, K.passP - .04, K.passP + .2));
    var wp = Math.max(Math.sin(Math.PI * seg(t, K.passP - .1, K.passP + .2)), Math.sin(Math.PI * seg(t, K.passP + .26, K.passP + .56)));
    g.save(); g.translate(704, 1172); g.scale(pop, pop); g.translate(-704, -1172);
    padlock(g, 704, 1172, 290, 220, { kind: 'key', open: op, name: 'pay lock', seed: 5 });
    /* contactless waves on the lock (no brand mark): they pulse twice as the passcode goes in */
    g.strokeStyle = wp > 0 ? mixc(hex(INK), hex('#7a5a1e'), wp) : INK; g.lineCap = 'round';
    for (var i = 0; i < 3; i++) { g.lineWidth = 6 + 3 * wp; g.beginPath(); g.arc(704 + 70, 1172 - 50, (12 + i * 13) * (1 + .3 * wp), -.8, .8); g.stroke(); }
    g.restore();
    txt(g, OURS.applePay, 704, 1346, 52, CREAM, 'center', 900, DISP, 380, 1, 40, 'condensed');
    onprop(function () { tag(g, 'RE-CREATED', 290 + sway, 1402, 1, 0, 230, CREAM, INK, 30); });
    /* the key: hovering, in on "passcode,", turns on "though." */
    var hov = { x: 704, y: 1012 + 8 * Math.sin(t * 2.4) }, ins = eout(seg(t, K.passP - .04, K.passP + .26));
    var tipY = lerp(hov.y, 1192, ins), turn = eio(seg(t, K.though - .02, K.though + .22));
    paperKey(g, 704, tipY, .8, Math.PI / 2, turn, OURS.key, { px: 44, clipX: ins > .3 ? -(tipY - 1172) / .8 : null, name: 'passcode key' });
    EXITING = ex;
    var qin = seg(t, E0 - .1, E0 + .02);
    if (qin > 0) qplate(g, 104, 446, 812, APPLE.pay, 46, 'APPLE SUPPORT', 6101, qin, 0);
  }

  /* =====================================================================================================
     SCENE 4: CHECK YOURS (check → end). A re-created Settings path, row by row on its words; the switch turns on
     ===================================================================================================== */
  var SP = { x: 510, y: 838, w: 720, h: 760 };
  function checkScene(g, t) {
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { paperBg(g, t, TO); return; }
    var E0 = S('check').t0, ex = EXITING; if (t < E0 + .05) EXITING = true;
    var drift = 4 * Math.sin(t * 1.3);
    phone(g, SP.x, SP.y + drift, SP.w, SP.h, 0, { name: 'settings phone', draw: function (g2, S2) { settingsScreen(g2, S2, t); } });
    EXITING = ex;
    onprop(function () { card(g, OURS.now, SP.x - SP.w / 2 + 130, SP.y - SP.h / 2 + 62, t, E0, null, 44, 120, null, true); });
  }
  function settingsScreen(g, S2, t) {
    g.fillStyle = '#efe8da'; g.fillRect(S2.x, S2.y, S2.w, S2.h);
    var x0 = S2.x + 26, x1 = S2.x + S2.w - 26;
    g.fillStyle = '#2c3340'; g.fillRect(S2.x, S2.y, S2.w, 96);
    onprop(function () { tag(g, 'RE-CREATED', x1 - 118, S2.y + 52, 1, 0, 240, CREAM, '#2c3340', 36); });
    function row(y, h, a, lit) {
      if (a <= 0) return;
      g.save(); g.globalAlpha *= a;
      g.fillStyle = lit > 0 ? mixc(hex('#fbf7ef'), hex(HL), lit) : '#fbf7ef'; rr(g, x0, y, x1 - x0, h, 18); g.fill();
      g.strokeStyle = 'rgba(33,29,38,.25)'; g.lineWidth = 3; rr(g, x0, y, x1 - x0, h, 18); g.stroke();
      g.restore();
    }
    function chev(y, a) { if (a <= 0) return; g.save(); g.globalAlpha *= a; g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1 - 40, y - 14); g.lineTo(x1 - 26, y); g.lineTo(x1 - 40, y + 14); g.stroke(); g.restore(); }
    var a1 = seg(tq(t), K.check - .04, K.check + .04), a2 = seg(tq(t), K.faceC - .04, K.faceC + .04), a3 = seg(tq(t), K.andC - .04, K.andC + .04), a4 = seg(tq(t), K.passC - .04, K.passC + .04);
    var y1 = S2.y + 118, y2 = y1 + 100, y3 = y2 + 150, y4 = y3 + 138;
    row(y1, 86, a1, .6 * Math.sin(Math.PI * seg(t, K.settings, K.settings + .5)));
    /* the Settings gear: big and turning in the empty screen as the wipe opens, it drops into row 1 on "Settings," */
    var gi = eio(seg(t, K.settings - .12, K.settings + .22));
    gear(g, lerp(S2.x + S2.w / 2, x0 + 50, gi), lerp(S2.y + 420, y1 + 43, gi), lerp(120, 26, gi), t * .9);
    onprop(function () { txt(g, APPLE.settings, x0 + 24 + 64 * gi, y1 + 45, 44, INK, 'left', 900, DISP, 360, a1, 36, 'condensed'); }); chev(y1 + 43, a1);
    row(y2, 138, a2, .6 * Math.sin(Math.PI * seg(t, K.faceC, K.faceC + .5)));
    onprop(function () { txt(g, APPLE.faceRow, x0 + 24, y2 + 44, 44, INK, 'left', 900, DISP, 400, a2, 36, 'condensed'); });
    chev(y2 + 44, a2);
    if (a2 > 0) onprop(function () { font(g, 36, 900, DISP, 'condensed'); var tw2 = g.measureText(APPLE.touchRow).width + 28; chip(g, APPLE.touchRow, x0 + 24 + tw2 / 2, y2 + 102, { px: 36, wt: 900, st: 'condensed', line: INK, lw: 3, fg: INK, bg: '#f6f0e3', shadow: false, r: 10, a: a2 }); });
    row(y3, 128, a3, 0);
    onprop(function () { APPLE.enter.forEach(function (s2, i) { txt(g, s2, x0 + 24, y3 + 40 + i * 48, 40, INK, 'left', 900, DISP, 300, a3, 36, 'condensed'); }); });
    if (a3 > 0) { var dn = 6 * seg(t, K.passC - .1, K.checkEnd + .05); g.save(); g.globalAlpha *= a3; for (var i = 0; i < 6; i++) { var dx = x1 - 150 + (i % 3) * 44, dy = y3 + 44 + Math.floor(i / 3) * 44, f = clamp(dn - i, 0, 1); g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.arc(dx, dy, 13, 0, 6.283); g.stroke(); if (f > 0) { g.fillStyle = INK; el(g, dx, dy, 13 * f, 13 * f); } } g.restore(); }
    row(y4, 146, a4, 0);
    onprop(function () { txt(g, APPLE.sdp, x0 + 24, y4 + 46, 40, INK, 'left', 900, DISP, x1 - x0 - 48, a4, 36, 'condensed'); });
    if (a4 > 0) {
      g.save(); g.globalAlpha *= a4; bigSwitch(g, x1 - 92, y4 + 104, 132, 64, eio(seg(t, K.CK - .06, K.CK + .1)), 'settings switch', true); g.restore();
    }
  }
  /* the Settings gear, flat: a toothed ring with a hole */
  function gear(g, x, y, r, ang) {
    g.save(); g.translate(x, y); g.rotate(ang);
    g.fillStyle = '#8f96a0'; g.beginPath();
    for (var i = 0; i < 16; i++) { var a0 = i * Math.PI / 8, rr2 = i % 2 ? r * .78 : r; g.lineTo(Math.cos(a0 - .16) * rr2, Math.sin(a0 - .16) * rr2); g.lineTo(Math.cos(a0 + .16) * rr2, Math.sin(a0 + .16) * rr2); }
    g.closePath(); g.moveTo(r * .36, 0); g.arc(0, 0, r * .36, 0, 6.283, true); g.fill('evenodd');
    g.strokeStyle = 'rgba(33,29,38,.45)'; g.lineWidth = Math.max(2, r * .04); g.stroke();
    g.restore();
  }
  /* a flat Apple chip: cream card, ink lines, an APPLE tag along its foot (the strings come from the APPLE block) */
  function appleChip(g, lines, x, y, a, px, sc) {
    if (a <= 0) return;
    font(g, px, 900, DISP, 'condensed'); var w = 0; lines.forEach(function (L) { w = Math.max(w, g.measureText(L).width); }); w += 64;
    var lh = px * 1.1, h = lines.length * lh + 20 + 40, x0 = -w / 2, y0 = -h / 2;
    g.save(); g.translate(x, y); g.scale(sc || 1, sc || 1); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 8, y0 + 11, w, h, 18); g.fill();
    g.fillStyle = CREAM; rr(g, x0, y0, w, h, 18); g.fill(); g.strokeStyle = INK; g.lineWidth = 4; rr(g, x0, y0, w, h, 18); g.stroke();
    lines.forEach(function (L, i) { txt(g, L, 0, y0 + 12 + lh * (i + .5), px, INK, 'center', 900, DISP, w - 40, 1, 36, 'condensed'); });
    tag(g, APPLE.credit, 0, y0 + h - 26, 1, 0, 160, INK, CREAM, 30);
    g.restore();
  }
  /* the closing row, under the Settings phone and on through the end card: MIGHT BE ON BY DEFAULT from "Check yours:",
     then MUST BE ON BEFORE IT'S STOLEN with YES / NO (both cream, neither hinted) from "It must…". YES is tapped on the
     slap after "yours?"; all three lift off 0.32 s before the loop so the cut into frame 0 is clean */
  function yesNo(g, t) {
    var o = eio(seg(t, TEND - .3, TEND - .18));
    var ma = seg(t, K.check - .12, K.check + .04), mo = eio(seg(t, K.end - .2, K.end - .06));
    if (ma > 0 && mo < 1) quiet(function () { g.save(); peelT(g, 300, 1440, mo); onprop(function () { appleChip(g, APPLE.might, 510, 1336, 1, 46, lerp(1.12, 1, eout(ma))); }); g.restore(); }, ma < 1 || mo > 0);
    var ua = seg(t, K.end - .24, K.end - .1);
    if (ua > 0 && o < 1) quiet(function () {
      var pk = 1 + .03 * Math.sin(Math.PI * seg(t, at('end', 'before') - .02, at('end', 'before') + .2));
      g.save(); g.translate(0, 70 * o); g.globalAlpha *= 1 - o; onprop(function () { appleChip(g, APPLE.must, 306, 1338, 1, 44, lerp(1.08, 1, eout(ua)) * pk); }); g.restore();
    }, ua < 1 || o > 0);
    var a = seg(t, K.end - .02, K.end + .14);
    if (a <= 0 || o >= 1) return;
    [['YES', 632], ['NO', 828]].forEach(function (c, i) {
      var tap = i === 0 && t >= K.YN - .02 ? 1 - seg(t, K.YN, K.YN + .133) : 0;
      quiet(function () { onprop(function () { chip(g, c[0], c[1], 1352 + 70 * o + 4 * Math.sin(t * 3.6 + i * 2), { px: 84, wt: 900, bg: BG, line: CREAM, lw: 6, fg: CREAM, w: 176, h: 124, r: 34, a: a * (1 - o), s: lerp(1.15, 1, eout(a)) * (1 - .08 * tap), st: 'condensed' }); }); }, a < 1 || o > 0);
    });
  }


  /* =====================================================================================================
     THE END CARD: frame 0 again (the table, the typing pad, the sight-ring, PASSCODE SEEN) — ct < 0 runs the same lines
     backwards, so the cut into frame 0 has no bump
     ===================================================================================================== */
  function endScene(g, t) {
    if (LAYER === 'over') return;
    var ct = t - TEND;
    if (LAYER === 'bg') { var to = tableOff(ct), a = f0(ct); paperBg(g, ct, TTEAL); g.save(); g.translate(to.x, to.y); cafeTable(g, ct, 0, null); g.restore(); return; }
    tablePhone(g, f0(ct), ct, 1, 1);
    title0(g);
  }
  /* ---------- captions ---------- */
  var CAPGROUPS = { hook: [[3, 3]], took: [[5]], ask: [[6, 3]], keys: [[4], [5]], dip: [[4, 4]], twist: [[3, 4]], away: [[5], [6]], delay: [[3, 3], [2, 2]], hour: [[4, 4]], pay: [[4, 3]], check: [[2], [5]], end: [[3, 4], [2]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', 'passcode.'], ['took', 'took'], ['ask', 'lock'], ['keys', 'off,'], ['keys', 'saved'], ['dip', 'change'], ['twist', 'on.'], ['away', 'face'], ['delay', 'hour,'], ['hour', 'lost.'], ['pay', 'passcode,'], ['check', 'Settings,'], ['end', 'yours?']]
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
    var o1 = !nx ? Math.min(card0.t1 + .25, TEND - .2) : keep ? ns - .04 : Math.min(card0.t1 + .5, ns - .04), o0 = o1 - .1;
    SC.forEach(function (Sc) { var tr = Sc.t0 - (Sc.tw || 0); if (tr > s + .3 && tr < ns && tr + .06 < o1) { o1 = tr + .06; o0 = o1 - .1; } });
    var fi = seg(t, s, s + .08), out = 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - s, 3.2, .8), 0, 1.04);
    g.save(); var cpx = CAPPX; font(g, cpx, 800, DISP, 'semi-expanded');
    g.textBaseline = 'alphabetic';
    var words = card0.words, maxw = 820;
    /* a forced two-line break (CAPGROUPS) shrinks the card's type until each line fits, rather than orphaning a word */
    for (var guard = 0; guard < 16; guard++) { var wsx = words.map(function (w) { return g.measureText(w.w).width; }), k0 = 0, over = false;
      card0.split.forEach(function (n) { var w2 = 0; for (var j = 0; j < n; j++) w2 += wsx[k0 + j] + (j ? cpx * .3 : 0); k0 += n; if (w2 > maxw) over = true; });
      if (!over || cpx <= 42) break; cpx -= 1; font(g, cpx, 800, DISP, 'semi-expanded'); }
    var ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = cpx * .3, lines = [], lw, wi = 0;
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
  var NOISE, SCENES = { netScene: netScene, onScene: onScene, payScene: payScene, checkScene: checkScene, endScene: endScene };
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
  function roll(g, xb, t) {
    var w = 440, x0 = xb - w / 2, n = 40, r = mulberry(4401), L = [], R = [];
    for (var i = 0; i <= n; i++) { L.push(14 * r() + 6 * Math.sin(i * 1.7)); R.push(14 * r() + 6 * Math.sin(i * 2.3)); }
    function edge(off, sh) {
      g.beginPath(); for (var i = 0; i <= n; i++) g.lineTo(x0 + L[i] + off, -20 + (H + 40) * i / n + sh);
      for (i = n; i >= 0; i--) g.lineTo(x0 + w - R[i] + off, -20 + (H + 40) * i / n + sh); g.closePath();
    }
    g.fillStyle = 'rgba(0,0,0,.45)'; edge(-22, 0); g.fill();
    g.fillStyle = '#e9e1cf'; edge(-4, 0); g.fill();
    g.fillStyle = rgbs(STG.map(function (v) { return Math.min(255, v * 1.45 + 14); })); edge(4, 0); g.fill();
    edge(4, 0); g.save(); g.clip(); grainIn(g, x0, 0, w, H, 4402, 1.3);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x0 + 44, 0, 8, H); g.fillRect(x0 + w - 52, 0, 8, H); g.restore();
  }
  function frame(g, t) {
    CURT = t;
    g.setTransform(1, 0, 0, 1, 0, 0);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    STG = Sc.id === 'net' ? (camX(te) > 540 ? TD[2] : TTEAL[2]) : Sc.id === 'on' ? TT[2] : Sc.id === 'pay' ? TC[2] : Sc.id === 'check' ? TO[2] : TTEAL[2];
    stage(g);
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
    g.save(); safeClip(g); yesNo(g, t); g.restore();
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) captions(g, t, 1);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor((t > TEND - 1 / 30 ? t - TEND + 1 / 30 : t) * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  var POSTERPX = [];
  /* the poster carries the scope: away from home or work, with the setting on */
  function posterTitle(g) {
    g.save(); g.textBaseline = 'alphabetic'; g.textAlign = 'center';
    function fit(str, px, wst, maxw) { font(g, px, 800, DISP, wst); while (g.measureText(str).width > maxw && px > 34) { px -= 1; font(g, px, 800, DISP, wst); } return px; }
    var a = 'A thief knows your passcode?', ap = fit(a, 60, 'semi-expanded', 800);
    g.fillStyle = CREAM; g.fillText(a, CX, 352);
    var b = 'Away from home or work, they still need your face.', bp = fit(b, 56, 'condensed', 800);
    font(g, bp, 800, DISP, 'condensed'); var wb = g.measureText(b).width;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(CX - wb / 2 - 14, 420 - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.fillStyle = BG; g.fillText(b, CX, 420);
    chip(g, APPLE.faceOr, CX, 1408, { px: 44, wt: 900, st: 'condensed', bg: INK, fg: CREAM, line: CREAM, lw: 3, r: 12, maxw: 400 });
    POSTERPX = [ap, bp];
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
  var GAIN = { rg: .034, tk: .019, q: .0264, cs: .047, yd: .01225, sw: .0289, kb: .079, hl: .0219, st: .06, op: .028, lo: .0175, py: .0313, ck: .079, yn: .0178 };   /* levelled to ≈ −16 dB on rmsgate's sliding 50 ms RMS (≈ −19 dB on the jury's meter) with duck.smr_db 33; re-measure after any change to the hits or the mix */   /* relative only: render.mjs peak-normalizes the stem; voiceover.py sets the voice from duck.smr_db against the room bed */
  var TYPE = { rg: 'tick', tk: 'slap', q: 'pop', cs: 'tick', yd: 'thump', sw: 'click', kb: 'click', hl: 'knock', st: 'knock', op: 'click', lo: 'slap', py: 'click', ck: 'click', yn: 'slap' };
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
    /* gains start at 0: a GainNode defaults to 1, and the source's first sample at t slipped through unscaled (a full-scale click that set the stem's peak) */
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); og.gain.value = 0; o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }
    function band(t, dur, f, q, peak, att, send, pan) { var n = noise(t, dur), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; var ob = bus(1, send || 0, pan); ob.gain.value = 0; n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + (att || .002), peak], [t + dur, 0]]); }
    function stampThump(t, g, lb) {
      g = g || 1; lb = lb == null ? 1 : lb;
      var o = osc('sine', 230, t, t + .2, 1, [[t, 0], [t + .012, .3 * g * lb], [t + .12, .26 * g * lb], [t + .19, 0]], .05); o.frequency.exponentialRampToValueAtTime(160, t + .18);
      osc('triangle', 330, t, t + .14, 1, [[t, 0], [t + .004, .22 * g * Math.sqrt(lb)], [t + .06, .15 * g * Math.sqrt(lb)], [t + .13, 0]], .03);
      band(t, .16, 1500, .8, 5.2 * g, .006, .05);
      band(t, .11, 2400, 1.0, 3.6 * g, .004, .03);
      band(t + .001, .18, 1900, .6, 5.0 * g, .008, .04);
      band(t + .012, .07, 2900, 1.4, 2.2 * g, .002, .02);
    }
    function paperHit(t, g) { band(t, .035, 1300, 1.1, 4.2 * g, .0008, .01); band(t + .004, .03, 2200, 1.3, 3.6 * g, .0008, .01); band(t + .009, .022, 2900, 1.6, 2.2 * g, .0008, .01); }
    function slapS(t, g) { g = g || 1; band(t, .06, 1600, .7, 5.5 * g, .001, .04); band(t, .03, 2800, 1.2, 3 * g, .001, .02); paperHit(t, g * 1.2); }
    function knockS(t, g) {
      g = g || 1;
      osc('triangle', 300, t, t + .13, 1, [[t, 0], [t + .003, .5 * g], [t + .05, .25 * g], [t + .12, 0]], .03);
      osc('sine', 2400, t, t + .07, 1, [[t, 0], [t + .002, .3 * g], [t + .06, 0]], .02);
      band(t, .05, 1700, 1.2, 3.2 * g, .001, .03);
      band(t, .025, 2600, 1.4, 2.4 * g, .001, .02);
      paperHit(t, g);
    }
    function clickS(t, g) { g = g || 1; band(t, .018, 2300, 2, 5 * g, .0008, .01); band(t + .03, .02, 1700, 2, 3 * g, .0008, .01); osc('sine', 3100, t, t + .04, 1, [[t, 0], [t + .001, .25 * g], [t + .035, 0]], .01); }
    function tickS(t, g) { g = g || 1; band(t, .03, 3000, 1.6, 3.5 * g, .001, .02); band(t, .04, 1400, 1.5, 1.2 * g, .001, .02); }
    function popS(t, g) { g = g || 1; var o = osc('sine', 520, t, t + .1, 1, [[t, 0], [t + .003, .4 * g], [t + .09, 0]], .02); o.frequency.exponentialRampToValueAtTime(260, t + .09); paperHit(t, g * .9); }
    EV.forEach(function (e) {
      /* every hit carries a 1-3 kHz paper layer so it reads on a phone speaker (jury r1) */
      var lb = Math.min(.07, e.t1 - e.t); band(e.t, lb, 1800, .9, 4 * e.g, .001, .03); band(e.t + .004, lb - .008, 2600, 1.1, 3 * e.g, .001, .02);
      if (e.id === 'sw' || e.id === 'ck' || e.id === 'py' || e.id === 'kb' || e.id === 'op') osc('triangle', 210, e.t, e.t + .06, 1, [[e.t, 0], [e.t + .003, .55 * e.g], [e.t + .055, 0]], .03);   /* a switch / shackle's low body, inside its 0.06 s */
      if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'thump') { stampThump(e.t, e.g, .2); slapS(e.t, e.g * .9); }
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'knock') knockS(e.t, e.g);
      else if (e.type === 'click') clickS(e.t, e.g);
      else if (e.type === 'tick') tickS(e.t, e.g);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o);
      env(o.gain, [[0, ROOM], [DUR, ROOM]]); })();
  }
  var ROOM = .0008;   /* the room bed is the voice's reference (duck.smr_db 34): 13 dB under r1 in the stem, so the hits sit near −18 dB RMS and 3+ dB under the voice */

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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°º×−≈≠µ“”‘’·→…#?‹›✓✕–@!>$(),:§+/=½~↓_'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {}; mkGrain();
      window.READY = true;
    });
  }
  initTimes();
  var HOLD = { t0: K.scan2, t1: K.lets };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { POSTERPX: function () { return POSTERPX; }, bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, TEND: TEND, POSTER: Math.round((K.OP + .4) * 30) / 30 + 1 / 60, SLUG: 'stolendevice', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
