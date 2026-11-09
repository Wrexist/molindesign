/* "Closing apps won't save your battery" — Factory #25 on Tech, explained, after ../whatif-password/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   The native move is the card flick: app cards are hand-cut paper, a swipe flings one up through the top of the safe
   box, and every scene change is the same move (the whole scene shrinks into a card and is flicked away, the next scene
   already built under it). One hero stamp: “NO AND NO.” (coral) on the re-created 2016 email; coral is also on the end
   card's YES / NO and nowhere else. A generic app switcher and settings screen, drawn by hand: no logos, no real UI.
   Every scene is clipped to the safe box x 92–928, y 302–1428. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;   /* vo.js dur 39.64: the last word rings to 39.23, 0.41 s of tail */
  var BG = '#15131b', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f1e9d8', INK = '#211d26', CARD = '#f4ecdc', DARK = '#2b2834';
  var DISP = 'Archivo', MONO = '"Geist Mono"';
  var SAFE_BOX = { x0: 92, y0: 302, x1: 928, y1: 1428 };

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
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

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

  /* the hits are placed from the heard words before anything is timed off them (see the SFX gate below) */
  var EDGES = window.HEARD_EDGES || [], VOICED = window.VOICED || [];
  var lastE = EDGES.length ? Math.max.apply(null, EDGES) : -1;
  VO.lines.forEach(function (l) { if (l.t0 > lastE + .3) l.words.forEach(function (w) { VOICED.push({ t0: w.t0, t1: w.t1 + .15 }); EDGES.push(w.t0, w.t1 + .15); }); });
  /* where a line's voice really stops (its last word rings past the vo.js end) */
  function voiceEnd(id, before) { var e = lend(id); VOICED.forEach(function (v) { if (v.t0 < lend(id) + .3 && v.t1 > e && v.t1 < before) e = v.t1; }); return e; }
  var BODY = { thump: .2, knock: .14, slap: .1, rattle: .13, paper: .17, pop: .12, click: .06, tick: .05 };
  var GT = {};
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }
  var K = {
    hookEnd: lend('hook'), wont: at('hook', 'wont'), batW: at('hook', 'battery'),
    apple: start('apple'), only: at('apple', 'only'), unres: at('apple', 'unresponsive'), appleEnd: lend('apple'),
    ask: start('ask'), draining: at('ask', 'draining'), askEnd: lend('ask'),
    paused: start('paused'), most: at('paused', 'most'), apps: at('paused', 'apps'), pausedW: at('paused', 'paused'), pausedEnd: lend('paused'),
    scratch: start('scratch'), swipe: at('scratch', 'swipe'), away: at('scratch', 'away'), restarts: at('scratch', 'restarts'), scratchW: at('scratch', 'scratch'), scratchEnd: lend('scratch'),
    work: start('work'), more: at('work', 'more'), workEnd: lend('work'),
    email: start('email'), y2016: at('email', '2016'), cook: at('email', 'cook'), emailEnd: lend('email'), emailed: at('email', 'emailed'),
    question: start('question'), quit: at('question', 'quit'), needed: at('question', 'needed'), questionEnd: lend('question'),
    answer: start('answer'), chief: at('answer', 'chief'), answerEnd: lend('answer'),
    nono: start('nono'), nonoEnd: lend('nono'),
    drains: start('drains'), bright: at('drains', 'bright'), weak: at('drains', 'weak'), background: at('drains', 'background'), drainsEnd: lend('drains'),
    check: start('check'), settings: at('check', 'settings'), batteryW: at('check', 'battery'), checkEnd: lend('check'),
    scope: start('scope'), frozen: at('scope', 'frozen'), hogging: at('scope', 'hogging'), close: at('scope', 'close'), scopeEnd: lend('scope'),
    end: start('end'), swiping: at('end', 'swiping'), yes: at('end', 'yes'), noE: at('end', 'no'), noEnd: wend('end', 'no')
  };
  (function () {
    /* frame 0's swipe: a soft paper flick in the quiet before the first word (the loop's thumb is already on the card) */
    place('sw', 'click', .17, .15, .12, .26);
    place('f1', 'paper', voiceEnd('hook', K.apple) + .12, .19, K.hookEnd, K.apple);
    place('hl', 'slap', voiceEnd('apple', K.ask) + .12, .19, K.appleEnd, K.ask - .45);
    place('f2', 'paper', K.ask - .42, .19, GT.hl != null ? GT.hl + .2 : K.appleEnd, K.ask);
    /* the last two rebuilt pieces land on two quiet paper ticks, in the gap after "scratch" */
    place('tk1', 'tick', 13.6, .15, K.scratchEnd, K.work);
    place('tk2', 'tick', (GT.tk1 != null ? GT.tk1 : 13.6) + .14, .15, K.scratchEnd, K.work);
    place('f3', 'paper', voiceEnd('work', K.email) + .1, .19, K.workEnd, K.email);
    place('pp', 'pop', voiceEnd('question', K.answer) + .1, .17, K.questionEnd, K.answer);
    place('hero', 'thump', voiceEnd('answer', K.nono) + .1, .19, K.answerEnd, K.nono);
    /* no sound on the flick off the hero: the hold keeps its silence and the stamp reads its full time */
    place('f5', 'paper', 31.0, .19, K.drainsEnd, K.check);   /* as late as the gap allows: the BACKGROUND ACTIVITY fix line reads its full time */
    place('f6', 'paper', voiceEnd('scope', K.end) + .06, .19, K.scopeEnd, K.end);
  })();
  var SW = .4;                                           /* a flick wipe: 0.4 s; its card leaves on the paper swish */
  function wipeEnd(gt, fb) { return (gt != null ? gt - .07 : fb) + SW; }
  K.HERO = GT.hero != null ? GT.hero : K.answerEnd + .25;  /* the hero stamp lands on the thump, in the silence before "No and no." */
  K.HL = GT.hl != null ? GT.hl : K.appleEnd + .2;          /* the highlighter on Apple's sentence */
  K.SLIP = GT.pp != null ? GT.pp - .04 : K.answer - .45;   /* the reply slip slides in on the pop */
  K.FLY0 = GT.sw != null ? GT.sw : .17;                    /* frame 0's swipe: the card leaves on the flick, before the first word */
  K.RB1 = GT.tk2 != null ? GT.tk2 : K.scratchEnd + .45;   /* the rebuild's last piece lands on the second tick */
  K.PB = K.paused - .35;                                   /* the battery moves up, the cards come back */
  K.PD = K.work - .36;                                     /* the two cards side by side */
  var SC = [
    { id: 'fan', fn: 'fanScene', name: 'Your app switcher', t0: 0 },
    { id: 'page', fn: 'pageScene', name: 'Apple: only if unresponsive', t0: wipeEnd(GT.f1, K.hookEnd + .1) },
    { id: 'batt', fn: 'battScene', name: 'Paused, then from scratch', t0: wipeEnd(GT.f2, K.ask - .45) },
    { id: 'letter', fn: 'letterScene', name: 'The 2016 email: no and no', t0: wipeEnd(GT.f3, K.email - .45) },
    { id: 'drains', fn: 'drainsScene', name: 'What drains it', t0: K.drains - .1 },
    { id: 'settings', fn: 'settingsScene', name: 'Check yours', t0: wipeEnd(GT.f5, K.check - .42) },
    { id: 'end', fn: 'endScene', name: 'Still swiping?', t0: wipeEnd(GT.f6, K.end - .42) }
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
  /* quiet tags (RE-CREATED, AS REPORTED): an outline, never coral */
  function tag(g, text, x, y, a, rot, maxw, col, bg, px) { chip(g, text, x, y, { px: px || 38, wt: 700, fam: MONO, line: col || CREAM, lw: 3, fg: col || CREAM, a: a, rot: rot == null ? .01 : rot, shadow: false, bg: bg || 'rgba(21,19,27,.9)', maxw: maxw || 820 }); }
  function onprop(fn) { var o = ONPROP; ONPROP = true; fn(); ONPROP = o; }
  function dashRect(g, x, y, w, h, r, col, lw, dash, phase) { g.save(); g.setLineDash(dash || [16, 12]); g.lineDashOffset = phase || 0; g.strokeStyle = col; g.lineWidth = lw || 4; rr(g, x, y, w, h, r); g.stroke(); g.restore(); }

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
     PROPS (all paper)
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

  /* ---------- app icons: generic glyphs on a coloured tile (no brand) ---------- */
  var APPS = {
    maps: { col: '#5f9c62' }, chat: { col: '#5b7fd1' }, music: { col: '#8a6fc4' }, photos: { col: '#c99a33' }, weather: { col: '#3f9496' },
    video: { col: '#4d6fa8' }, game: { col: '#7a8f3c' }
  };
  var ORDER = ['maps', 'chat', 'music', 'photos', 'weather'];  /* the switcher strip, slot j → ORDER[j mod 5] */
  function glyph(g, id, cx, cy, s) {
    g.save(); g.translate(cx, cy); g.scale(s, s); g.fillStyle = CREAM; g.strokeStyle = CREAM; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
    if (id === 'maps') { g.beginPath(); g.arc(0, -5, 12, Math.PI, 0); g.lineTo(0, 16); g.closePath(); g.fill(); g.fillStyle = APPS.maps.col; el(g, 0, -5, 5, 5); }
    else if (id === 'chat') { rr(g, -15, -13, 30, 22, 8); g.fill(); poly(g, [[-8, 8], [-12, 16], [0, 9]]); g.fill(); }
    else if (id === 'music') { el(g, -6, 9, 7, 6, -.3); g.fillRect(-1, -14, 4, 23); poly(g, [[3, -14], [14, -9], [14, -3], [3, -8]]); g.fill(); }
    else if (id === 'photos') { poly(g, [[-15, 12], [-4, -4], [4, 6], [8, 1], [15, 12]]); g.fill(); el(g, 8, -9, 4, 4); }
    else if (id === 'weather') { el(g, 0, 0, 9, 9); for (var i = 0; i < 8; i++) { var a = i * .785; g.beginPath(); g.moveTo(Math.cos(a) * 13, Math.sin(a) * 13); g.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); g.stroke(); } }
    else if (id === 'video') { poly(g, [[-8, -12], [12, 0], [-8, 12]]); g.fill(); }
    else if (id === 'game') { rr(g, -16, -9, 32, 18, 9); g.fill(); g.fillStyle = APPS.game.col; g.fillRect(-11, -1.5, 9, 3); g.fillRect(-8, -4.5, 3, 9); el(g, 8, -2, 2.5, 2.5); el(g, 11, 3, 2.5, 2.5); }
    g.restore();
  }
  function iconTile(g, id, x, y, sz) {
    g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, x + 3, y + 4, sz, sz, sz * .24); g.fill();
    g.fillStyle = APPS[id].col; rr(g, x, y, sz, sz, sz * .24); g.fill();
    glyph(g, id, x + sz / 2, y + sz / 2, sz / 46);
  }

  /* ---------- an app card: 400 × 700 paper, a picture of the app (no text), its icon tile above it ----------
     o: { rot, alpha, pauseT (a pause disc lands), playT (the disc turns into ▶ and lifts), playing (equalizer moves), dim, pieces (0…8: rebuilt piece by piece), noIcon } */
  var CW = 400, CH = 700, CARDPTS = (function () {
    var P = [], r = 34, C = [[CW - r, r, -1.5708], [CW - r, CH - r, 0], [r, CH - r, 1.5708], [r, r, 3.1416]];
    C.forEach(function (c) { for (var k = 0; k <= 4; k++) { var a = c[2] + k / 4 * 1.5708; P.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } });
    return P;
  })();
  function appCard(g, id, cx, top, sc, t, o) {
    o = o || {};
    if (o.alpha != null && o.alpha <= 0) return;
    g.save(); if (o.alpha != null) g.globalAlpha *= clamp(o.alpha, 0, 1);
    g.translate(cx, top); if (o.rot) g.rotate(o.rot); g.scale(sc, sc); g.translate(-CW / 2, 0);
    var P = o.pieces == null ? 99 : o.pieces;
    var pk = function (i) { return P >= 99 ? 1 : clamp(P - i, 0, 1); };
    var drop = function (i, fn) { var k = pk(i); if (k <= 0) return; g.save(); g.translate(0, -150 * Math.pow(1 - eout(k), 1)); g.globalAlpha *= clamp(k * 3, 0, 1); fn(); g.restore(); };
    if (!o.noIcon) drop(0, function () { iconTile(g, id, 6, -66, 54); });
    drop(0, function () {
      g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, 10, 14, CW, CH, 34); g.fill();
      g.fillStyle = CARD; cut(g, CARDPTS, mulberry(strHash(id) + 11), 2.6);   /* a hand-cut edge, not a flat-icon kit */
      rr(g, 0, 0, CW, CH, 34); grainIn(g, 0, 0, CW, CH, strHash(id) + 3, .8);
      prop(g, 'card-' + id, 0, 0, CW, CH);
    });
    if (id === 'maps') {
      drop(1, function () { g.fillStyle = '#d5e2c3'; rr(g, 20, 20, 360, 520, 22); g.fill(); g.fillStyle = '#c3d4ab'; [[40, 40, 70, 120], [170, 40, 100, 120], [310, 210, 50, 150], [40, 410, 70, 110], [170, 410, 100, 110]].forEach(function (b) { rr(g, b[0], b[1], b[2], b[3], 10); g.fill(); }); });
      drop(2, function () { g.strokeStyle = '#fbf6ea'; g.lineWidth = 26; g.lineCap = 'butt'; g.beginPath(); g.moveTo(20, 185); g.lineTo(380, 185); g.moveTo(20, 385); g.lineTo(380, 385); g.stroke(); });
      drop(3, function () { g.strokeStyle = '#fbf6ea'; g.lineWidth = 26; g.beginPath(); g.moveTo(140, 20); g.lineTo(140, 540); g.moveTo(290, 20); g.lineTo(290, 540); g.stroke(); });
      drop(4, function () { g.save(); g.strokeStyle = APPS.maps.col; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([2, 20]); g.beginPath(); g.moveTo(140, 500); g.lineTo(140, 385); g.lineTo(290, 385); g.lineTo(290, 230); g.stroke(); g.restore(); });
      drop(5, function () { g.fillStyle = '#3f6f43'; g.beginPath(); g.arc(290, 190, 30, Math.PI, 0); g.lineTo(290, 245); g.closePath(); g.fill(); g.fillStyle = CARD; el(g, 290, 190, 11, 11); });
      drop(6, function () { g.fillStyle = DARK; rr(g, 20, 560, 360, 120, 24); g.fill(); });
      drop(7, function () { g.fillStyle = APPS.maps.col; el(g, 322, 620, 34, 34); g.fillStyle = CREAM; poly(g, [[310, 602], [338, 620], [310, 638]]); g.fill(); g.fillStyle = 'rgba(244,237,224,.75)'; rr(g, 44, 600, 170, 18, 9); g.fill(); g.fillStyle = 'rgba(244,237,224,.4)'; rr(g, 44, 630, 110, 14, 7); g.fill(); });
    } else if (id === 'chat') {
      var B = [[0, 210, 74], [1, 250, 96], [0, 170, 74], [1, 220, 74], [0, 260, 96], [1, 150, 60]], yy = 34;
      B.forEach(function (b, i) {
        var x = b[0] ? 376 - b[1] : 24;
        g.fillStyle = b[0] ? APPS.chat.col : '#ddd3c0'; rr(g, x, yy, b[1], b[2], 26); g.fill();
        yy += b[2] + 18;
      });
      if (o.playT != null && t >= o.playT) { var nk = eout(seg(t, o.playT + .2, o.playT + .5)); g.save(); g.globalAlpha *= nk; g.fillStyle = '#ddd3c0'; rr(g, 24, yy + 30 * (1 - nk), 200, 74, 26); g.fill(); g.restore(); }
      g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 4; rr(g, 20, 622, 360, 58, 29); g.stroke();
    } else if (id === 'music') {
      g.fillStyle = APPS.music.col; rr(g, 40, 40, 320, 320, 26); g.fill();
      g.save(); g.translate(200, 200); g.scale(4.2, 4.2); glyph(g, 'music', 0, 0, 1); g.restore();
      var pr = o.playing ? .32 + ((t * .02) % .4) : .32;
      g.fillStyle = 'rgba(33,29,38,.2)'; rr(g, 40, 406, 320, 10, 5); g.fill(); g.fillStyle = INK; rr(g, 40, 406, 320 * pr, 10, 5); g.fill(); el(g, 40 + 320 * pr, 411, 13, 13);
      g.fillStyle = INK; poly(g, [[140, 470], [110, 490], [140, 510]]); g.fill(); poly(g, [[112, 470], [82, 490], [112, 510]]); g.fill();
      poly(g, [[260, 470], [290, 490], [260, 510]]); g.fill(); poly(g, [[288, 470], [318, 490], [288, 510]]); g.fill();
      el(g, 200, 490, 40, 40); g.fillStyle = CARD; g.fillRect(186, 474, 9, 32); g.fillRect(205, 474, 9, 32);
      for (var q = 0; q < 8; q++) { var eh = o.playing ? 18 + 46 * Math.abs(Math.sin(t * 5.3 + q * 1.37)) : 14; g.fillStyle = APPS.music.col; rr(g, 64 + q * 36, 660 - eh, 24, eh, 6); g.fill(); }
    } else if (id === 'photos') {
      var PC = ['#9cc0d4', '#b6cf98', '#dcbf78', '#c4aed6', '#8fb5a8', '#e0cfb0'];
      for (var r2 = 0; r2 < 5; r2++) for (var c2 = 0; c2 < 3; c2++) {
        var px0 = 22 + c2 * 122, py0 = 24 + r2 * 132, k2 = (r2 * 3 + c2) % 6;
        g.fillStyle = PC[k2]; rr(g, px0, py0, 112, 120, 12); g.fill();
        g.fillStyle = 'rgba(33,29,38,.22)'; poly(g, [[px0 + 8, py0 + 110], [px0 + 40 + (k2 * 7) % 20, py0 + 50], [px0 + 66, py0 + 84], [px0 + 82, py0 + 66], [px0 + 106, py0 + 110]]); g.fill();
        g.fillStyle = 'rgba(255,255,255,.55)'; el(g, px0 + 84, py0 + 28, 10, 10);
      }
    } else if (id === 'weather') {
      g.fillStyle = '#cfe2e2'; rr(g, 20, 20, 360, 660, 26); g.fill();
      g.fillStyle = '#e4b548'; el(g, 190, 190, 82, 82);
      g.fillStyle = '#fbf6ea'; el(g, 250, 270, 86, 50); el(g, 180, 286, 66, 40); el(g, 310, 290, 56, 34);
      g.fillStyle = '#9cbfa6'; poly(g, [[20, 560], [120, 470], [210, 530], [300, 450], [380, 520], [380, 680], [20, 680]]); g.fill();
      for (var d = 0; d < 5; d++) { g.fillStyle = d % 2 ? '#e4b548' : '#fbf6ea'; el(g, 70 + d * 65, 610, 18, 18); }
    }
    if (o.dim) { g.fillStyle = 'rgba(21,19,27,' + o.dim + ')'; rr(g, -2, -70, CW + 14, CH + 86, 34); g.fill(); }
    /* the pause disc (‖), or ▶ when the app resumes */
    if (o.pauseT != null && t >= o.pauseT) {
      var pa = 1 - (o.playT != null ? seg(t, o.playT + .25, o.playT + .45) : 0);
      if (pa > 0) {
        var ps = lerp(1.35, 1, eout(seg(t, o.pauseT, o.pauseT + .1))), pl = o.playT != null && t >= o.playT;
        g.save(); g.globalAlpha *= pa; g.translate(200, 330 - 60 * (1 - pa)); g.scale(ps, ps);
        g.fillStyle = 'rgba(0,0,0,.35)'; el(g, 5, 8, 92, 92); g.fillStyle = CREAM; el(g, 0, 0, 92, 92); g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 84, 0, 6.283); g.stroke();
        g.fillStyle = INK; if (pl) { poly(g, [[-22, -38], [38, 0], [-22, 38]]); g.fill(); } else { rr(g, -34, -38, 22, 76, 6); g.fill(); rr(g, 12, -38, 22, 76, 6); g.fill(); }
        g.restore();
      }
    }
    g.restore();
  }

  /* ---------- a paper thumb (no skin tones, no nails): a cut-paper capsule pointing up ---------- */
  function thumb(g, x, y, rot, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -48, 10, 108, 330, 54); g.fill();
    g.fillStyle = '#d9c7a6'; rr(g, -56, 0, 112, 330, 56); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 4; rr(g, -56, 0, 112, 330, 56); g.stroke();
    g.strokeStyle = 'rgba(33,29,38,.25)'; g.lineWidth = 4; g.beginPath(); g.moveTo(-30, 150); g.quadraticCurveTo(0, 162, 30, 150); g.stroke();
    g.restore();
  }

  /* ---------- the paper battery: an outline, a nub and five cells; `level` is how many cells are lit (fractional fades) ---------- */
  function battery(g, cx, cy, sc, level, o) {
    o = o || {};
    g.save(); g.translate(cx, cy); g.scale(sc, sc);
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -292, -128, 600, 280, 44); g.fill();
    g.fillStyle = '#26222e'; rr(g, -300, -140, 600, 280, 44); g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 16; rr(g, -300, -140, 600, 280, 44); g.stroke();
    g.fillStyle = CREAM; rr(g, 312, -54, 40, 108, 14); g.fill();
    prop(g, 'battery', -308, -148, 352, 148);
    for (var i = 0; i < 5; i++) {
      var x = -268 + i * 108, k = clamp(level - i, 0, 1);
      dashRect(g, x, -108, 92, 216, 14, 'rgba(244,237,224,.35)', 4, [12, 10], 0);
      if (k > 0) { g.save(); g.globalAlpha *= k; g.fillStyle = PAPER; rr(g, x, -108 + 216 * (1 - k) * .5, 92, 216 * (.5 + .5 * k), 14); g.fill(); g.restore(); }
    }
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · frame 0: your app switcher, one card swiped away (and the end: the same strip scrolls back to frame 0)
     ===================================================================================================== */
  var TOP = 668, F0OFF = 320, SLOT = 440, THY = 1100;               /* cards hang from y 668; frame 0's strip sits 320 px right and glides left */
  function strip(g, t, off, o) {
    o = o || {};
    for (var j = -3; j <= 8; j++) {
      var x = 510 + SLOT * j + off;
      if (o.gap && j >= 1) x -= SLOT * o.gap;
      if (o.skip0 && j === 0) continue;
      if (x < -260 || x > 1340) continue;
      var id = ORDER[((j % 5) + 5) % 5], bob = 6 * Math.sin(t * 2.1 + j * 1.3) * (o.bob == null ? 1 : o.bob);
      appCard(g, id, x, TOP + bob, 1, t, { rot: .012 * Math.sin(t * 1.4 + j) * (o.bob == null ? 1 : o.bob) });
    }
  }
  /* frame 0's headline: SWIPING / ≠ SAVING [battery glyph] (cream; the claim in 3 words, sound off) */
  function headline(g, t, a) {
    if (a <= 0 || !LIVE.text) return;
    txt(g, 'SWIPING', CX, 400, 112, CREAM, 'center', 900, DISP, 820, a, 60, 'expanded');
    g.save(); g.globalAlpha *= a; var hp = 112; font(g, hp, 900, DISP, 'expanded');
    while (g.measureText('SAVING').width + 86 + 26 + 34 + 150 > 810 && hp > 60) { hp -= 2; font(g, hp, 900, DISP, 'expanded'); }
    var s2 = 'SAVING', nw = 86, w2 = g.measureText(s2).width + nw + 26, gw = 150, x0 = CX - (w2 + 34 + gw) / 2;
    /* the ≠, drawn (the face has no glyph for it): two bars and a slash */
    g.fillStyle = CREAM; rr(g, x0 + 4, 494, nw - 8, 14, 4); g.fill(); rr(g, x0 + 4, 528, nw - 8, 14, 4); g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 13; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0 + 22, 572); g.lineTo(x0 + nw - 22, 464); g.stroke();
    g.restore();
    txt(g, s2, x0 + nw + 26, 520, hp, CREAM, 'left', 900, DISP, 0, a, 60, 'expanded');
    var pk = t >= K.batW && t < K.batW + .5 ? Math.sin(Math.PI * seg(t, K.batW, K.batW + .4)) * .14 : 0;
    g.save(); g.globalAlpha *= a; g.translate(x0 + w2 + 34 + gw / 2 - 8, 516); g.scale(1 + pk, 1 + pk);
    g.strokeStyle = CREAM; g.lineWidth = 8; rr(g, -gw / 2, -36, gw - 16, 72, 14); g.stroke(); g.fillStyle = CREAM; rr(g, gw / 2 - 12, -15, 12, 30, 4); g.fill();
    for (var i = 0; i < 4; i++) { rr(g, -gw / 2 + 12 + i * 30, -24, 22, 48, 5); g.fill(); }
    g.restore();
  }
  function fanScene(g, t) {
    var off = F0OFF * (1 - eout(seg(t, 0, .95)));
    var bobK = seg(t, .95, 1.6);
    var fly = seg(t, K.FLY0, K.FLY0 + .42), gap = eio(seg(t, K.FLY0 + .45, K.FLY0 + .95));
    strip(g, t, off, { skip0: true, gap: gap, bob: bobK });
    /* the swiped card: dips under the thumb (already on it at frame 0), then flies up through the top */
    var press = Math.sin(Math.PI * seg(t, 0, K.FLY0 + .02));
    if (fly < 1) {
      var dy = 18 * press - 1500 * fly * fly, rot = -.16 * fly;
      appCard(g, ORDER[0], 510 + off + 30 * fly, TOP + dy + 6 * Math.sin(t * 2.1) * bobK, 1 - .03 * press, t, { rot: rot, alpha: 1 - seg(fly, .35, .75) });
    }
    /* the thumb: on the card from frame 0 (where the loop's last frame left it), pushes it up and follows it out */
    var tout = seg(t, K.FLY0 + .05, K.FLY0 + .4);
    if (tout < 1) thumb(g, 560 + off + 20 * tout, THY + 18 * press - 520 * tout * tout, -.08, 1 - tout);
    headline(g, t, 1);
  }
  function endScene(g, t) {
    var u = seg(t, TEND - 2.4, TEND), off = -(SLOT * 5 - F0OFF) * Math.pow(u, 1.29);   /* ends on frame 0's strip (≡ +320) at frame 0's speed */
    var bob = 1 - seg(t, TEND - .9, TEND - .2);
    strip(g, t, off, { bob: bob });
    /* the thumb comes back up onto the front card and stops where frame 0 has it */
    var tin = eout(seg(t, TEND - .6, TEND));
    if (tin > 0) thumb(g, 560 + off + SLOT * 5, lerp(1500, THY, tin), -.08, 1);
    /* YES / NO: coral, the same size, neither one lit; gone before the last frame */
    var ya = fin(t, K.end + .3) * (1 - seg(t, TEND - .24, TEND - .12)), yp = Math.min(1, pop(t, K.end + .3, 3));
    if (ya > 0) [['YES', 316], ['NO', 704]].forEach(function (c) {
      chip(g, c[0], c[1] + 4 * Math.sin(t * 2.1 + c[1]), 1030 + 16 * (1 - yp) + 6 * Math.sin(t * 2.6 + c[1] * .01), { px: 116, wt: 900, bg: BG, line: HOT, lw: 8, fg: HOT, w: 300, h: 170, r: 60, shadow: true, a: ya });
    });
    headline(g, t, seg(t, K.noEnd + .14, K.noEnd + .26));
  }

  /* =====================================================================================================
     SCENE 2 · Apple's support page (re-created): “…close an app only if it's unresponsive.”
     ===================================================================================================== */
  var QL;   /* the quote's three lines: text, y on the page, inked from → to (its words' times) */
  function pageScene(g, t) {
    if (!QL) QL = [['“…close an app', 290, at('apple', 'close'), wend('apple', 'app')], ['only if it\'s', 384, at('apple', 'only'), wend('apple', "it's")], ['unresponsive.”', 478, at('apple', 'unresponsive'), wend('apple', 'unresponsive')]];
    var d = drift(t, .5, .6), y0 = 572 + d, y1 = 1412 + d;
    sheet(g, 110, y0, 910, y1, 41, '#fbf6ea', 'page');
    onprop(function () {
      /* the page header: a drawn menu and search bar, no logo */
      g.fillStyle = 'rgba(33,29,38,.75)'; for (var i = 0; i < 3; i++) g.fillRect(152, y0 + 44 + i * 13, 40, 6);
      g.strokeStyle = 'rgba(33,29,38,.4)'; g.lineWidth = 4; rr(g, 226, y0 + 34, 440, 52, 26); g.stroke();
      g.beginPath(); g.arc(254, y0 + 60, 11, 0, 6.283); g.stroke();
      txt(g, 'APPLE SUPPORT', 152, y0 + 142, 46, INK, 'left', 900, DISP, 520, 1, 40, 'condensed');
      g.fillStyle = 'rgba(33,29,38,.25)'; g.fillRect(152, y0 + 196, 716, 4);
      /* the highlighter, in the silence after "unresponsive" (mustard, never coral) */
      var hk1 = eout(seg(t, K.HL, K.HL + .12)), hk2 = eout(seg(t, K.HL + .08, K.HL + .22));
      g.fillStyle = 'rgba(232,197,82,.85)';
      if (hk1 > 0) { rr(g, 140, y0 + 342, 560 * hk1, 84, 12); g.fill(); }
      if (hk2 > 0) { rr(g, 140, y0 + 436, 640 * hk2, 84, 12); g.fill(); }
      /* Apple's sentence: printed light on the page, then inked word by word as the narrator reads it */
      QL.forEach(function (q) {
        var y = y0 + q[1], k = seg(t, q[2] - .03, q[3]);
        txt(g, q[0], 152, y, 82, '#8a8073', 'left', 800, DISP, 716, 1, 60, 'condensed');
        if (k > 0) { g.save(); g.beginPath(); g.rect(140, y - 60, 740 * k, 120); g.clip(); txt(g, q[0], 152, y, 82, INK, 'left', 800, DISP, 716, 1, 60, 'condensed'); g.restore(); }
      });
      /* the page's date and the article it is from, in the bottom of the page */
      g.fillStyle = 'rgba(33,29,38,.25)'; g.fillRect(152, y0 + 716, 716, 4);
      txt(g, 'FORCE AN APP TO CLOSE', 152, y0 + 762, 42, INK, 'left', 900, DISP, 716, 1, 40, 'condensed');
      txt(g, 'APPLE SUPPORT · OCT 15, 2026', 152, y0 + 810, 40, INK, 'left', 700, DISP, 716, 1, 40, 'condensed');
      /* the page's own picture: three small cards; the middle one freezes (shakes) on "unresponsive", then is swiped up */
      var dk = fin(t, K.only - .1), my = y0 + 540;
      if (dk > 0) {
        g.save(); g.globalAlpha *= dk; g.translate(0, 20 * (1 - dk));
        var shake = t >= K.unres && t < K.HL + .3 ? 5 * Math.sin((t - K.unres) * 2 * Math.PI * 9) : 0, fl = seg(t, K.HL + .32, K.HL + .62);
        [-1, 0, 1].forEach(function (j) {
          var x = 510 + j * 150, yy = my, rot = 0;
          if (j === 0) { x += shake; yy -= 260 * fl * fl; rot = -.1 * fl; }
          if (j === 0 && fl >= 1) return;
          g.save(); g.translate(x, yy); g.rotate(rot); g.globalAlpha *= j === 0 ? 1 - fl * .8 : 1;
          g.fillStyle = 'rgba(0,0,0,.18)'; rr(g, -52, 6, 108, 150, 14); g.fill();
          g.fillStyle = j === 0 ? '#e6dcc6' : '#efe7d6'; rr(g, -56, 0, 112, 150, 14); g.fill();
          g.strokeStyle = 'rgba(33,29,38,.45)'; g.lineWidth = 3; rr(g, -56, 0, 112, 150, 14); g.stroke();
          iconTile(g, ['chat', 'maps', 'music'][j + 1], -18, 50, 36);
          g.restore();
        });
        /* the swipe-up arrow over the middle card */
        g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(670, my + 120); g.lineTo(670, my + 20); g.moveTo(648, my + 42); g.lineTo(670, my + 20); g.lineTo(692, my + 42); g.stroke();
        g.restore();
      }
    });
    tag(g, 'RE-CREATED', 770, y0 + 142, 1, .02, 300, INK, '#fbf6ea');   /* on the page from its first frame */
  }

  /* =====================================================================================================
     SCENE 3 · what's really draining it? → most apps are paused → swipe one: it restarts from scratch → more work
     ===================================================================================================== */
  var PIECES = 8;
  function battScene(g, t) {
    var s0 = S('batt').t0;
    var mv = eio(seg(t, K.PB, K.PB + .45)), gone = eio(seg(t, K.swipe - .1, K.swipe + .3));
    /* the battery: big, ticking down; then small at the top; it peels up when the swipe starts */
    var lvl = 5 - eout(seg(t, K.ask + .25, K.ask + .37)) - eout(seg(t, K.draining, K.draining + .12)) - eout(seg(t, K.askEnd - .1, K.askEnd + .02));
    if (gone < 1) {
      g.save(); g.globalAlpha *= 1 - gone;
      battery(g, 490 + drift(t, 1, .6) * (1 - mv), lerp(1010, 650, mv) - 120 * gone + drift(t, 2.2, .5), lerp(1.08, .42, mv), lvl);
      g.restore();
    }
    /* the ? tag on the battery: on "draining"; it flies off when the cards come back */
    var qk = fin(t, K.ask), qo = eio(seg(t, K.PB - .05, K.PB + .3));
    if (qk > 0 && qo < 1) chip(g, '?', 760, 1290 - 700 * qo * qo + drift(t, 3, .5), { px: 170, wt: 900, bg: CREAM, fg: BG, w: 200, h: 200, r: 100, a: qk * (1 - qo), s: .9 + .1 * Math.min(1, pop(t, K.ask, 3.2)), rot: .05 });
    /* the three cards: CHAT (paused), MAPS (paused, then swiped), MUSIC (still playing) */
    var cin = function (i) { return eout(seg(t, K.PB + .05 + i * .06, K.PB + .55 + i * .06)); };
    var spread = eio(seg(t, K.away - .1, K.away + .3));             /* the other two slide aside and dim */
    var pd = eio(seg(t, K.PD, K.PD + .45));                          /* two cards side by side */
    if (t >= K.PB) {
      /* CHAT */
      var cx = lerp(lerp(230, 40, spread), 300, pd), cs = lerp(.6, .78, pd), ctop = lerp(lerp(912, 960, spread), 790, pd) + 520 * (1 - cin(0)) + drift(t, .3, .6);
      appCard(g, 'chat', cx, ctop, cs, t, { pauseT: K.most + .1, playT: K.PD + .35, dim: .5 * spread * (1 - pd) });
      /* MUSIC: keeps playing; slides out and stays out */
      var mx = lerp(790, 1010, spread), mtop = lerp(912, 960, spread) + 520 * (1 - cin(2)) + drift(t, 1.7, .6);
      if (pd < 1) appCard(g, 'music', mx, mtop, .6, t, { playing: true, dim: .5 * spread, alpha: 1 - pd });
      /* MAPS: paused, then the thumb flings it up and off */
      var fly = seg(t, K.swipe + .06, K.swipe + .46);
      if (fly < 1) appCard(g, 'maps', 510 + 20 * fly, 912 + 520 * (1 - cin(1)) - 1300 * fly * fly + drift(t, 2.9, .6), .6, t, { pauseT: K.pausedW - .02, rot: -.15 * fly, alpha: 1 - seg(fly, .35, .75) });
      var tin = eout(seg(t, K.swipe - .45, K.swipe - .05)), tout = seg(t, K.swipe + .1, K.swipe + .45);
      if (tin > 0 && tout < 1) thumb(g, 540 + 20 * tout, 1470 - 300 * tin - 480 * tout * tout, -.08, 1 - tout);
    }
    /* STILL PLAYING: next to the music card only, from the cards' return until it slides out */
    var sa = fin(t, K.PB + .45) * (1 - seg(t, K.away - .1, K.away + .05));
    if (sa > 0) chip(g, 'STILL PLAYING', 760, 838 + drift(t, 1.7, .6), { px: 42, wt: 900, bg: CREAM, fg: BG, a: sa, maxw: 300, st: 'condensed', shadow: false, rot: .01 });
    /* the rebuild: an empty slot, the icon is tapped, the card comes back from eight pieces */
    var slotA = fin(t, K.away + .1);
    if (slotA > 0) {
      var rx = lerp(510, 712, pd), rs = lerp(.9, .78, pd), rtop = lerp(728, 790, pd) + drift(t, 2.9, .5);
      var n = PIECES * seg(t, K.restarts - .02, K.RB1);   /* pieces 7 and 8 land on the two ticks */
      g.save(); g.globalAlpha *= slotA;
      if (n < 1) { g.save(); g.translate(rx, rtop); g.scale(rs, rs); dashRect(g, -200, 0, 400, 700, 34, 'rgba(244,237,224,.6)', 6, [20, 14], (t * 40) % 68); g.restore(); }
      if (n < .2) {
        /* the icon tile in the empty slot, tapped */
        var tp = t >= K.restarts - .2 ? Math.sin(Math.PI * seg(t, K.restarts - .2, K.restarts)) : 0;
        g.save(); g.translate(rx, rtop + 315 * rs); g.scale(1 - .12 * tp, 1 - .12 * tp); iconTile(g, 'maps', -60, -60, 120); g.restore();
        if (tp > 0) { g.strokeStyle = 'rgba(244,237,224,' + (1 - tp) + ')'; g.lineWidth = 6; g.beginPath(); g.arc(rx, rtop + 315 * rs, 70 + 50 * tp, 0, 6.283); g.stroke(); }
      }
      if (n > 0) appCard(g, 'maps', rx, rtop, rs, t, { pieces: n });
      g.restore();
    }
    /* the source, from "restarts" (Android's own words: a cold start "starts from scratch") */
    var ca = fin(t, K.restarts);
    if (ca > 0) { txt(g, 'ANDROID DEVELOPERS', 112, 598, 38, CREAM, 'left', 800, DISP, 420, ca, 36, 'condensed'); txt(g, 'APP STARTUP TIME', 112, 642, 36, CREAM, 'left', 700, DISP, 420, ca, 36, 'condensed'); }
    /* labels next to the card each one names */
    var fsA = fin(t, K.scratchW - .05);
    if (fsA > 0) chip(g, 'FROM SCRATCH', lerp(510, 712, eout(seg(t, K.PD - .3, K.PD + .05))),   /* leads its card right, so RESUMES never lands on it */ 1392 + drift(t, 2.9, .5), { px: 48, wt: 900, bg: CREAM, fg: BG, a: fsA, s: .9 + .1 * Math.min(1, pop(t, K.scratchW - .05, 3.2)), maxw: 330, st: 'condensed', shadow: false });
    var rsA = fin(t, K.PD);
    if (rsA > 0) chip(g, 'RESUMES', 300, 1392 + drift(t, .3, .6), { px: 48, wt: 900, bg: CREAM, fg: BG, a: rsA, maxw: 330, st: 'condensed', shadow: false });
    var mwA = fin(t, Math.max(K.scratchEnd - .05, K.work - .45));
    if (mwA > 0) chip(g, 'MORE WORK', 712, 700 + drift(t, 2.9, .5), { px: 60, wt: 900, line: CREAM, lw: 5, fg: CREAM, bg: BG, a: mwA, s: .9 + .1 * Math.min(1, pop(t, Math.max(K.scratchEnd - .05, K.work - .45), 3.2)), maxw: 330, st: 'condensed', shadow: false, rot: -.02 });
  }

  /* =====================================================================================================
     SCENE 4 · 2016: a fan emails Tim Cook (re-created, as reported) → the reply → “NO AND NO.” (the hero)
     ===================================================================================================== */
  function letterScene(g, t) {
    var st = 1 - seg(t, K.HERO + .1, K.HERO + .13);                 /* the hero hold: nothing drifts */
    var dE = drift(t, .4, .7) * st, dL = drift(t, 1.6, .5) * st, dS = drift(t, 2.8, .5) * st;
    var open = eio(seg(t, K.question - .45, K.question - .15)), rise = eio(seg(t, K.question - .3, K.question + .2));
    /* the envelope slides in from the right on "emailed" (340 px, 0.45 s) */
    var sl = eout(seg(t, K.emailed + .06, K.emailed + .51)); if (sl <= 0) { chip2016(g, t, dL); return; }
    var exS = EXITING; EXITING = exS || sl < 1;
    g.save(); g.translate(340 * (1 - sl), 0); g.rotate(.04 * (1 - sl));
    var ex0 = 110, ex1 = 910, ey0 = 880 + dE, ey1 = 1360 + dE, pocket = 1012 + dE;
    /* the envelope's back */
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, ex0 + 6, ey0 + 12, ex1 - ex0, ey1 - ey0, 16); g.fill();
    g.fillStyle = '#e3d4b2'; rr(g, ex0, ey0, ex1 - ex0, ey1 - ey0, 16); g.fill();
    prop(g, 'envelope', ex0, ey0, ex1 + 6, ey1 + 12);
    /* the open flap, behind the letter */
    if (open > 0) { g.fillStyle = '#d9c8a2'; poly(g, [[ex0, ey0], [ex1, ey0], [510, ey0 - 190 * open]]); g.fill(); }
    /* the letter: rises out of the envelope */
    var ly0 = lerp(ey0 + 40, 575 + dL, rise);
    if (rise > 0) {
      g.save(); g.beginPath(); g.rect(0, 0, W, pocket + 2); g.clip();
      sheet(g, 140, ly0, 880, ly0 + 520, 61, '#fbf6ea', 'letter');
      onprop(function () {
        txt(g, '1. DO YOU QUIT APPS?', 172, ly0 + 146, 62, INK, 'left', 900, DISP, 680, fin(t, K.quit - .2), 48, 'condensed');
        var qa = fin(t, K.needed - .25);
        txt(g, '2. IS THAT NEEDED', 172, ly0 + 228, 62, INK, 'left', 900, DISP, 680, qa, 48, 'condensed');
        txt(g, 'FOR BATTERY?', 222, ly0 + 298, 62, INK, 'left', 900, DISP, 640, qa, 48, 'condensed');
      });
      tag(g, 'RE-CREATED · AS REPORTED', 420, ly0 + 64, 1, .0, 560, INK, '#fbf6ea', 36);
      g.restore();
    }
    /* the envelope's front pocket, with the address */
    g.fillStyle = '#efe2c4'; cut(g, [[ex0, pocket], [ex1, pocket], [ex1, ey1], [ex0, ey1]], mulberry(171), 1.2);
    g.beginPath(); g.rect(ex0, pocket, ex1 - ex0, ey1 - pocket); grainIn(g, ex0, pocket, ex1 - ex0, ey1 - pocket, 172, .9);
    g.strokeStyle = 'rgba(33,29,38,.22)'; g.lineWidth = 3; g.beginPath(); g.moveTo(ex0, ey1); g.lineTo(510, pocket + 150); g.lineTo(ex1, ey1); g.stroke();
    if (open < 1) { g.save(); g.globalAlpha *= 1 - open; g.fillStyle = '#e6d6b2'; poly(g, [[ex0, ey0], [ex1, ey0], [510, ey0 + 220]]); g.fill(); g.strokeStyle = 'rgba(33,29,38,.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(ex0, ey0); g.lineTo(510, ey0 + 220); g.lineTo(ex1, ey0); g.stroke(); g.restore(); }
    onprop(function () {
      txt(g, 'TO: TIM COOK', 510, pocket + 236, 78, INK, 'center', 900, DISP, 700, 1, 60, 'condensed');
      /* a postage square with wavy lines (our drawing) */
      g.strokeStyle = 'rgba(33,29,38,.5)'; g.lineWidth = 4; rr(g, 806, pocket + 34, 70, 84, 6); g.stroke();
      g.lineWidth = 3; for (var i = 0; i < 3; i++) { g.beginPath(); for (var x = 720; x <= 800; x += 4) { var yy = pocket + 56 + i * 20 + 5 * Math.sin(x * .12); if (x === 720) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); }
    });
    g.restore(); EXITING = exS;
    chip2016(g, t, dL);
    letterTail(g, t, ly0, dS);
  }
  /* the time jump: 2016 slaps on its word, then sits on the letter's corner */
  function chip2016(g, t, dL) {
    var ya = fin(t, S('letter').t0 - .35), ym = eio(seg(t, K.question - .3, K.question + .15));
    var yl = eio(seg(t, K.emailed, K.emailed + .4));   /* low on the empty stage until the envelope comes in under it */
    if (ya > 0) chip(g, '2016', lerp(510, 784, ym), lerp(lerp(1160, 700, yl), 640, ym) + (ym > 0 ? dL : drift(t, 2, .5)), { px: lerp(150, 56, ym), wt: 900, bg: CREAM, fg: BG, a: ya, s: .9 + .1 * Math.min(1, pop(t, S('letter').t0 - .35, 3.2)), rot: lerp(-.04, .03, ym), st: 'expanded', shadow: ym < .5 });
  }
  function letterTail(g, t, ly0, dS) {
    /* the reply slip slides in from the right on the pop */
    var sk = eout(seg(t, K.SLIP, K.SLIP + .4));
    if (sk > 0) {
      var sx = lerp(1000, 140, sk), sy0 = 1150 + dS;
      g.save(); g.translate(sx - 140, 0); var ex = EXITING; EXITING = sk < 1;
      sheet(g, 140, sy0, 880, sy0 + 248, 81, '#e9dfc7', 'slip');
      onprop(function () {
        txt(g, 'FROM: CRAIG FEDERIGHI', 172, sy0 + 58, 56, INK, 'left', 900, DISP, 680, 1, 44, 'condensed');
        txt(g, 'APPLE SVP, SOFTWARE ENGINEERING', 172, sy0 + 122, 40, INK, 'left', 800, DISP, 680, 1, 36, 'condensed');
        txt(g, '9TO5MAC · MACRUMORS · MAR 10, 2016', 172, sy0 + 194, 36, INK, 'left', 700, DISP, 680, 1, 34, 'condensed');
      });
      EXITING = ex; g.restore();
    }
    /* THE hero: coral “NO AND NO.” across both questions, on the thump */
    stamp(g, '“NO AND NO.”', 510, ly0 + 400, t, K.HERO, 126, HOT, -.05, .45);
  }

  /* =====================================================================================================
     SCENE 5 · what drains it (Apple's battery page): a bright screen, a weak signal, background apps
     ===================================================================================================== */
  function drainsScene(g, t) {
    /* Apple's own term is "background activity"; its fix line sits in the row */
    var rows = [['BRIGHT SCREEN', K.bright], ['WEAK SIGNAL', K.weak], ['BACKGROUND ACTIVITY', K.background]];
    rows.forEach(function (r, i) {
      var y0 = 572 + i * 182 + drift(t, i * 1.3, .6), rh = i === 2 ? 226 : 160, on = fin(t, r[1] - .05), k = Math.min(1, pop(t, r[1] - .05, 3.2));
      g.save(); g.translate(510, y0 + 80); g.scale(1 + .03 * Math.sin(Math.PI * seg(t, r[1] - .05, r[1] + .2)), 1); g.translate(-510, -(y0 + 80));
      sheet(g, 110, y0, 910, y0 + rh, 91 + i * 7, '#fbf6ea', 'row');
      onprop(function () {
        txt(g, r[0], 370, y0 + 82, 62, INK, 'left', 900, DISP, 520, 1, 44, 'condensed');
        if (i === 2) { g.fillStyle = 'rgba(33,29,38,.2)'; g.fillRect(140, y0 + 160, 740, 3); txt(g, 'FIX: TURN OFF BACKGROUND APP REFRESH · APPLE', 510, y0 + 192, 36, INK, 'center', 800, DISP, 740, 1, 36, 'condensed'); }
      });
      /* the icon slot, and its icon on the word */
      dashRect(g, 140, y0 + 18, 200, 124, 18, 'rgba(33,29,38,.3)', 4, [12, 10], 0);
      if (on > 0) {
        g.save(); g.globalAlpha *= on; g.translate(240, y0 + 80); g.scale(.85 + .15 * k, .85 + .15 * k);
        if (i === 0) {
          g.fillStyle = DARK; rr(g, -30, -50, 60, 104, 12); g.fill(); g.fillStyle = '#fbf6ea'; rr(g, -24, -42, 48, 86, 8); g.fill();
          g.fillStyle = '#e4b548'; el(g, 44, -24, 24, 24);
          g.strokeStyle = '#e4b548'; g.lineWidth = 6; g.lineCap = 'round';
          for (var q = 0; q < 8; q++) { var a = q * .785 + t * 1.2; g.beginPath(); g.moveTo(44 + Math.cos(a) * 32, -24 + Math.sin(a) * 32); g.lineTo(44 + Math.cos(a) * 44, -24 + Math.sin(a) * 44); g.stroke(); }
        } else if (i === 1) {
          for (var b = 0; b < 4; b++) { var bh = 22 + b * 24, bx = -60 + b * 34; if (b === 0) { g.fillStyle = INK; rr(g, bx, 46 - bh, 24, bh, 5); g.fill(); } else dashRect(g, bx, 46 - bh, 24, bh, 5, 'rgba(33,29,38,.55)', 3, [6, 5], 0); }
          if (Math.floor(t * 3) % 2) { g.fillStyle = INK; rr(g, -60 + 34, 46 - 46, 24, 46, 5); g.fill(); }
        } else {
          g.fillStyle = CARD; rr(g, -64, -46, 74, 96, 10); g.fill(); g.strokeStyle = 'rgba(33,29,38,.5)'; g.lineWidth = 3; rr(g, -64, -46, 74, 96, 10); g.stroke();
          g.save(); g.translate(30, 4); g.rotate(t * 3); g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = 'round';
          g.beginPath(); g.arc(0, 0, 30, .3, 2.8); g.stroke(); g.beginPath(); g.arc(0, 0, 30, 3.45, 5.95); g.stroke();
          g.fillStyle = INK; poly(g, [[30 * Math.cos(2.8) - 9, 30 * Math.sin(2.8) - 2], [30 * Math.cos(2.8) + 9, 30 * Math.sin(2.8) - 2], [30 * Math.cos(2.8), 30 * Math.sin(2.8) + 12]]); g.fill();
          g.restore();
        }
        g.restore();
      }
      g.restore();
    });
    txt(g, 'APPLE · MAXIMIZING BATTERY LIFE', 510, 1196 + drift(t, 4, .5), 36, CREAM, 'center', 700, DISP, 800, 1, 34, 'condensed');
    /* the battery drains while the three are named */
    var lvl = 4.4 - 3 * seg(t, K.bright - .1, K.drainsEnd + .1);
    battery(g, 500 + drift(t, 5, .4), 1330 + drift(t, 5.6, .4), .55, lvl);
  }

  /* =====================================================================================================
     SCENE 6 · check yours (a re-created, generic battery screen) → the one app worth closing
     ===================================================================================================== */
  var USE = [['video', 'VIDEO', .62], ['chat', 'CHAT', .4], ['maps', 'MAPS', .3], ['game', 'GAME', .48]];
  function settingsScene(g, t) {
    var d = drift(t, .8, .5), sy = 566 + d, SH = 480;
    g.fillStyle = 'rgba(0,0,0,.42)'; rr(g, 160, sy + 14, 712, SH, 60); g.fill();
    g.fillStyle = DARK; rr(g, 150, sy, 720, SH, 60); g.fill();
    g.fillStyle = '#f7f0e1'; rr(g, 166, sy + 16, 688, SH - 32, 46); g.fill();
    rr(g, 166, sy + 16, 688, SH - 32, 46); grainIn(g, 166, sy + 16, 688, SH - 32, 201, .7);
    prop(g, 'screen', 150, sy, 872, sy + SH + 14);
    g.fillStyle = DARK; el(g, 510, sy + 40, 9, 9);
    onprop(function () {
      txt(g, 'BATTERY', 206, sy + 96, 58, INK, 'left', 900, DISP, 400, 1, 44, 'condensed');
      txt(g, 'USAGE BY APP', 206, sy + 148, 38, INK, 'left', 700, DISP, 400, 1, 36, 'condensed');
    });
    tag(g, 'RE-CREATED', 712, sy + 96, 1, .0, 260, INK, '#f7f0e1', 36);
    var grow = eout(seg(t, K.settings - .1, K.settings + .5)), hog = eio(seg(t, K.hogging - .05, K.hogging + .35));
    var shake = t >= K.frozen - .05 && t < K.close + .1 ? 7 * Math.sin((t - K.frozen) * 2 * Math.PI * 11) : 0;
    var fly = seg(t, K.close + .05, K.close + .45), gy = sy + 210 + 3 * 72;
    USE.forEach(function (u, i) {
      var y = sy + 210 + i * 72, isG = u[0] === 'game';
      if (isG && fly >= 1) return;
      g.save();
      if (isG) { g.globalAlpha *= 1 - seg(fly, .25, .6); g.translate(30 * fly, -1200 * fly * fly); g.translate(510, y); g.rotate(-.12 * fly); g.translate(-510, -y); }
      if (isG && fly > 0) { g.fillStyle = '#f7f0e1'; rr(g, 180, y - 34, 660, 68, 16); g.fill(); g.strokeStyle = 'rgba(33,29,38,.4)'; g.lineWidth = 3; rr(g, 180, y - 34, 660, 68, 16); g.stroke(); }
      g.save(); if (isG) g.translate(shake, 0); iconTile(g, u[0], 200, y - 28, 56); g.restore();
      onprop(function () { txt(g, u[1], 280, y, 42, INK, 'left', 800, DISP, 170, 1, 36, 'condensed'); });
      var len = 330 * grow * (isG ? lerp(u[2], 1, hog) : u[2]);
      g.fillStyle = 'rgba(33,29,38,.12)'; rr(g, 470, y - 13, 340, 26, 13); g.fill();
      if (len > 2) { g.fillStyle = INK; rr(g, 470, y - 13, len, 26, 13); g.fill(); }
      g.restore();
    });
    /* the two paths (iPhone and Pixel only), under the screen */
    var dc = drift(t, 2.4, .5);
    chip(g, 'iPHONE: SETTINGS › BATTERY', 510, 1092 + dc, { px: 46, wt: 900, bg: CREAM, fg: BG, a: fin(t, S('settings').t0 - .25), maxw: 836, st: 'condensed', shadow: false });
    chip(g, 'PIXEL: SETTINGS › BATTERY › BATTERY USAGE', 510, 1160 + dc, { px: 46, wt: 900, bg: CREAM, fg: BG, a: fin(t, K.check + .2), maxw: 836, st: 'condensed', shadow: false });
    /* the one worth closing, in each maker's words, and the iPhone's other fix; up from "Battery" so each reads its full time */
    var sa = fin(t, K.settings - .12);
    chip(g, 'FROZEN? CLOSE IT · APPLE', 510, 1236 + dc, { px: 42, wt: 900, line: CREAM, lw: 4, fg: CREAM, bg: BG, a: sa, maxw: 836, st: 'condensed', shadow: false });
    chip(g, 'HOGGING? RESTRICT OR FORCE STOP · PIXEL HELP', 510, 1302 + dc, { px: 42, wt: 900, line: CREAM, lw: 4, fg: CREAM, bg: BG, a: fin(t, K.settings - .08), maxw: 816, st: 'extra-condensed', shadow: false });
    txt(g, 'iPHONE: OR TURN OFF ITS BACKGROUND APP REFRESH', 510, 1376 + dc, 42, CREAM, 'center', 900, DISP, 816, fin(t, K.settings - .04), 40, 'extra-condensed');
    /* the thumb comes in from the right, pointing left, onto the GAME row (clear of the paths and chips), and follows it out */
    var tin = eout(seg(t, K.close - .45, K.close - .05)), tout = seg(t, K.close + .1, K.close + .45);
    if (tin > 0 && tout < 1) thumb(g, lerp(1180, 836, tin) + 30 * tout, gy - 1200 * tout * tout, -Math.PI / 2 + .06, (1 - tout) * tin);
  }

  /* ---------- captions: the narrator's words in phrase cards (one size); stressed words get a cream pill (never coral) ---------- */
  var CAPS = VO.captions.filter(function (c) { return c.t0 > K.hookEnd + .1; }).map(function (c) { return { t0: c.t0, t1: c.words[c.words.length - 1].t1, words: c.words }; });
  var STRESS = [['apple', 'unresponsive'], ['paused', 'paused'], ['scratch', 'scratch'], ['work', 'more'], ['email', '2016'], ['drains', 'bright'], ['drains', 'weak'], ['drains', 'background'], ['check', 'battery'], ['scope', 'close'], ['end', 'swiping']]
    .map(function (p) { return at(p[0], p[1]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  var GLUE = { the: 1, a: 1, an: 1, your: 1, its: 1, of: 1, at: 1, to: 1, and: 1, in: 1, with: 1, on: 1, by: 1, so: 1, that: 1, is: 1, it: 1, do: 1, from: 1, be: 1, or: 1, for: 1, if: 1, no: 1, those: 1, one: 1 };
  var CAPPX = 64, CAPMIN = 1e9;
  /* the drains caption waits for its wipe so it never sits over the hero stamp */
  function capStart(c) { return Math.max(c.t0 - .04, c.t0 > K.nonoEnd && c.t0 < K.drains + .5 ? S('drains').t0 : -1); }
  function captions(g, t, alpha) {
    var card0 = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= capStart(c)) { card0 = c; ci = i; } });
    if (!card0) return;
    var s = capStart(card0), nx = CAPS[ci + 1], ns = nx ? capStart(nx) : 1e9;
    var keep = nx && ns - card0.t1 < 2.4;
    var o1 = keep ? ns - .04 : Math.min(card0.t1 + .5, ns - .04), o0 = o1 - .1;
    var fi = seg(t, s, s + .08), out = 1 - seg(t, o0, o1);
    if (fi * out <= 0) return;
    var k = clamp(spring(t - s, 3.2, .8), 0, 1.04);
    g.save(); var cpx = CAPPX; font(g, cpx, 800, DISP, 'expanded');
    g.textBaseline = 'alphabetic';
    var words = card0.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = cpx * .3, maxw = 820, lines, lw;
    function lay2() { lines = [[]]; lw = [0]; words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; }); }
    function fixLines() {
      for (var L = 0; L < lines.length - 1; L++) {
        var last = lines[L][lines[L].length - 1];
        while (lines[L].length > 1 && GLUE[norm(words[last].w)]) { lines[L].pop(); lines[L + 1].unshift(last); last = lines[L][lines[L].length - 1]; }
      }
      lw = lines.map(function (ln) { var w = 0; ln.forEach(function (i) { w += ws[i] + gap; }); return w; });
    }
    lay2(); fixLines();
    var lh = cpx * 1.18, y0 = Math.max(430 - (lines.length - 1) * lh / 2, 308 + cpx * .9);   /* pill tops at y ≥ 304 */
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
  var NOISE, SCENES = { fanScene: fanScene, pageScene: pageScene, battScene: battScene, letterScene: letterScene, drainsScene: drainsScene, settingsScene: settingsScene, endScene: endScene };
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function safeClip(g) { g.beginPath(); g.rect(SAFE_BOX.x0, SAFE_BOX.y0, SAFE_BOX.x1 - SAFE_BOX.x0, SAFE_BOX.y1 - SAFE_BOX.y0); g.clip(); }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function drawScene(g, Sc, t) { g.save(); SCENES[Sc.fn](g, t); g.restore(); }
  /* the flick: the outgoing scene shrinks into a card (cream edge) and is flung up through the top of the safe box */
  function flick(g, k) {
    var a = eout(clamp(k / .3, 0, 1)), f = clamp((k - .18) / .82, 0, 1), s = 1 - .1 * a;
    g.translate(510, 865 - 1400 * f * f); g.rotate(-.06 * f); g.scale(s, s); g.translate(-510, -865);
  }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    var wk = Nx ? seg(te, Nx.t0 - SW, Nx.t0) : 0;
    g.save(); safeClip(g);
    if (wk > 0) {
      var nr = NOREC; NOREC = wk < .5; drawScene(g, Nx, t); NOREC = nr;
      g.save(); flick(g, wk); EXITING = true; NOREC = true;
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, SAFE_BOX.x0 + 10, SAFE_BOX.y0 + 16, 836, 1126, 44); g.fill();
      rr(g, SAFE_BOX.x0, SAFE_BOX.y0, 836, 1126, 44); g.save(); g.clip(); stage(g); drawScene(g, Sc, t); g.restore();
      g.strokeStyle = CREAM; g.lineWidth = 6; rr(g, SAFE_BOX.x0, SAFE_BOX.y0, 836, 1126, 44); g.stroke();
      EXITING = false; NOREC = nr; g.restore();
    } else drawScene(g, Sc, t);
    g.restore();
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) captions(g, t, 1 - seg(t, K.noEnd + .04, K.noEnd + .14));
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  function posterTitle(g) {
    /* the poster: the hero hold with the title in the caption's place */
    g.save(); font(g, 72, 800, DISP, 'expanded'); g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = CREAM;
    g.fillText('Closing apps won\'t', CX, 384);
    var b = 'save your battery', bp = 72; font(g, bp, 800, DISP, 'expanded');
    var wb = g.measureText(b).width, x = CX - wb / 2;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(x - 14, 470 - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.textAlign = 'left'; g.fillStyle = BG; g.fillText(b, x, 470); g.restore();
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
  /* the hero stays the loudest hit but sits ≥ 3 dB under the voice's peak on "No and no" */
  var GAIN = { sw: .6, hero: .22, f1: .36, hl: .2, f2: .27, tk1: .75, tk2: .75, f3: .27, pp: .2, f5: .27, f6: .27 };
  var TYPE = { sw: 'click', hero: 'thump', f1: 'paper', hl: 'slap', f2: 'paper', tk1: 'tick', tk2: 'tick', f3: 'paper', pp: 'pop', f5: 'paper', f6: 'paper' };
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
      var o = osc('sine', 250, t, t + .2, 1, [[t, 0], [t + .012, .5 * g], [t + .14, .46 * g], [t + .19, 0]], .05); o.frequency.exponentialRampToValueAtTime(170, t + .18);
      osc('triangle', 330, t, t + .14, 1, [[t, 0], [t + .004, .32 * g], [t + .06, .22 * g], [t + .13, 0]], .03);
      band(t, .15, 1600, .9, 3.8 * g, .008, .05);
      band(t, .1, 2500, 1.1, 2.3 * g, .006, .03);
      band(t + .001, .17, 1800, .55, 3.6 * g, .008, .04);
    }
    /* a flat paper slap (the highlighter) */
    function slapS(t, g) { g = g || 1; band(t, .06, 1600, .7, 5.5 * g, .001, .04); band(t, .03, 2800, 1.2, 3 * g, .001, .02); }
    /* a soft paper pop (the reply slip) */
    function popS(t, g) { g = g || 1; band(t, .03, 3200, 1.8, 5 * g, .001, .02); band(t + .002, .05, 1500, 2.2, .8 * g, .001, .02); }
    /* the card flick: a paper swish sweeping down 3.4 → 1.1 kHz, with a 1–3 kHz slap at its start so it reads on a phone */
    function flickS(t, g) {
      g = g || 1;
      var n = noise(t, .17), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1;
      bp.frequency.setValueAtTime(3400, t); bp.frequency.exponentialRampToValueAtTime(1100, t + .16);
      var ob = bus(1, .05, -.1); n.connect(bp); bp.connect(ob);
      env(ob.gain, [[t, 0], [t + .03, 2.6 * g], [t + .1, 1.6 * g], [t + .17, 0]]);
      slapS(t + .004, .5 * g);
    }
    /* a paper tick (a rebuilt piece landing): 1–3 kHz, 50 ms */
    function tickS(t, g) {
      g = g || 1;   /* tonal, so it reads at a low peak: a 2.1 kHz tock, a 1.25 kHz body and a little paper grit */
      osc('sine', 2100, t, t + .06, 1, [[t, 0], [t + .003, .5 * g], [t + .05, 0]], .02);
      osc('triangle', 1250, t, t + .06, 1, [[t, 0], [t + .003, .3 * g], [t + .04, 0]], .02);
      band(t, .03, 2400, 1.4, 1.2 * g, .001, .01);
    }
    /* frame 0's swipe: a short, soft paper flick (60 ms, 3 → 1.4 kHz) */
    function swS(t, g) {
      g = g || 1; var n = noise(t, .06), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.1;
      bp.frequency.setValueAtTime(3000, t); bp.frequency.exponentialRampToValueAtTime(1400, t + .055);
      var ob = bus(1, .03, .1); n.connect(bp); bp.connect(ob); env(ob.gain, [[t, 0], [t + .012, 2.6 * g], [t + .06, 0]]);
    }
    EV.forEach(function (e) {
      if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'click') swS(e.t, e.g);
      else if (e.type === 'thump') stampThump(e.t, e.g);
      else if (e.type === 'slap') slapS(e.t, e.g);
      else if (e.type === 'pop') { popS(e.t, e.g); slapS(e.t + .002, LAYER * e.g); }
      else if (e.type === 'paper') flickS(e.t, e.g);
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
  var ROOM = .0108, LAYER = .9;

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
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”‘’·→…#?‹›✓✕–@!>$(),:§+/=½'); })).then(function () { return document.fonts.ready; }).then(function () {
      STEX = {};
      window.READY = true;
    });
  }
  initTimes();
  /* the hero hold: from the stamp settling to the flick that peels the letter (the only still in the film) */
  var HOLD = { t0: K.HERO + .13, t1: S('drains').t0 - SW };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, POSTER: Math.round((HOLD.t0 + HOLD.t1) / 2 * 30) / 30 + 1 / 60, SLUG: 'forceclose', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
  window.BOUNDS_RUN = function (step) {
    BOUNDS = []; var out = {};
    for (var t = 0; t <= DUR + 1e-6; t += step || 1 / 15) { CURT = t; POSTERMODE = false; frame(ctx, t); }
    BOUNDS.forEach(function (b) { var o = out[b.text] || (out[b.text] = { text: b.text, from: b.t, to: b.t, x0: b.x0, x1: b.x1, y1: b.y1, n: 0 }); o.to = b.t; o.n++; o.x0 = Math.min(o.x0, b.x0); o.x1 = Math.max(o.x1, b.x1); o.y1 = Math.max(o.y1, b.y1); });
    BOUNDS = null; return Object.keys(out).map(function (k) { return out[k]; });
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
