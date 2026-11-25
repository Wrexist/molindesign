/* "Airport Wi-Fi is usually safe now." — Factory #42 (publicwifi) on Tech, explained, after ../findableoff/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t.
   Contract: window.FILM, DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx).
   All cut paper, no people: a generic phone (round punch-hole, no logo) with a re-created Wi-Fi list on frame 0; a kraft
   pneumatic track from the phone past a paper airport router (with a periscope) to a site; a cream capsule with a coral wax
   seal (never a padlock); a fictional bank's storefront; two made-up addresses (RFC 2606 .example names).
   Props stay whole inside x 92–928, y 302–1428. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur, CX = 510;
  var BG = '#121821', CREAM = '#f4ede0', HOT = '#ff5b3d';
  var PAPER = '#f3ecdf', INK = '#211d26', SLATE = '#3a4452', SLATE2 = '#2e3744';
  var KRAFT = '#c9a46a', KRAFT2 = '#9c7a48', SEALG = '#8f877b', HL = '#f3d58c';
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
  function place(name, type, want, m, lo, hi) {
    var s = nearGap(want, type, m);
    GT[name] = (s === null || (lo != null && s < lo) || (hi != null && s + BODY[type] > hi)) ? null : s;
  }

  /* =====================================================================================================
     THE FTC'S STRINGS (one block, so a correction is one edit). BRIEF.md §3, read through WebFetch 2026-11-25;
     BROWSER CONFIRMATION PENDING (the PC was offline). Page: consumer.ftc.gov/articles/are-public-wi-fi-networks-safe-what-you-need-know
       A7: "Because of the widespread use of encryption, connecting through a public Wi-Fi network is usually safe."
       A10: "They also create fake websites and encrypt them to make you think they’re safe when they’re not."
       A11: "If you visit a scammer’s website, your data may be encrypted on its way to the site, but it won’t be safe
             from scammers operating the site."
     ===================================================================================================== */
  var FTC = {
    date: 'FEB 2023',
    plate: 'FTC · PUBLIC WI-FI ADVICE · FEB 2023',
    chip: 'USUALLY · FTC',
    kicker: 'FTC CONSUMER ADVICE · FEB 2023',
    title: 'ARE PUBLIC WI-FI NETWORKS SAFE?',
    hero: ['“…CONNECTING THROUGH', 'A PUBLIC WI-FI NETWORK', 'IS USUALLY SAFE.”'],
    stamp: 'USUALLY\nSAFE',
    under: ['PUBLIC WI-FI · FTC', 'FEB 2023'],
    most: 'MOST SITES · FTC',
    fake: ['“THEY ALSO CREATE FAKE', 'WEBSITES AND ENCRYPT THEM…”'],
    scope: 'IF YOU VISIT A SCAMMER’S SITE',
    trip: ['“…YOUR DATA MAY BE', 'ENCRYPTED ON ITS WAY', 'TO THE SITE, BUT IT WON’T', 'BE SAFE FROM SCAMMERS', 'OPERATING THE SITE.”'],
    credit: 'FTC CONSUMER ADVICE'
  };
  /* Google Chrome Help 95617 and Apple's Safari User Guide (sfri40697), both read by curl 2026-11-25 */
  var MAKERS = {
    chrome: ['“…CHECK THE SITE NAME', 'IN THE ADDRESS BAR.”'], chromeCredit: 'GOOGLE CHROME HELP',
    apple: ['“…CHANGING ONE OR TWO', 'LETTERS OF THE WEBSITE', 'ADDRESS.”'], appleCredit: 'APPLE SAFARI USER GUIDE'
  };
  /* the two addresses: RFC 2606 reserves .example, so neither can ever be a real site. The real one is shown first and ends LEFT; the fake slides in on "fakes" and ends RIGHT */
  var FAKE = 'lumembank.example', REAL = 'lumenbank.example';
  var NET = 'FREE_AIRPORT_WIFI', QUERY = 'IS PUBLIC WIFI SAFE?', QPRE = 'IS PUBLIC WIFI ';

  var K = {
    hook: start('hook'), usually: at('hook', 'usually'), hookEnd: lend('hook'),
    ask: start('ask'), ftcA: at('ask', 'FTC.'), safeA: at('ask', 'safe?'), pubA: at('ask', 'public'), askEnd: lend('ask'),
    then: start('then'), early: at('then', 'Early'), wasnt: at('then', "wasn't."), thenEnd: lend('then'),
    snoop: start('snoop'), didnt: at('snoop', "didn't"), scramble: at('snoop', 'scramble'), logins: at('snoop', 'logins.'), snoopEnd: lend('snoop'),
    now: start('now'), today: at('now', 'today,'), most: at('now', 'most'), enc: at('now', 'encryption.'), nowEnd: lend('now'),
    hero: start('hero'), ftcH: at('hero', 'FTC'), calls: at('hero', 'calls'), usuallyH: at('hero', 'usually'), heroEnd: lend('hero'),
    dip: start('dip'), scammers: at('dip', 'scammers'), fake: at('dip', 'fake'), dipEnd: lend('dip'),
    sealed: start('sealed'), arrives: at('sealed', 'arrives'), rightS: at('sealed', 'Right'), sealedW: at('sealed', 'sealed.'), scammer: at('sealed', 'scammer.'), sealedEnd: lend('sealed'),
    honest: start('honest'), cant: at('honest', "can't"), honestW: at('honest', 'honest.'), honestEnd: lend('honest'),
    check: start('check'), name: at('check', 'name,'), letter1: at('check', 'letter'), letter2: at('check', 'letter.'), checkEnd: lend('check'),
    apple: start('apple'), fakesA: at('apple', 'fakes'), letters: at('apple', 'letters.'), appleEnd: lend('apple'),
    end: start('end'), fakeE: at('end', 'fake?'), left: at('end', 'Left'), rightE: at('end', 'right?'), endEnd: wend('end', 'right?')
  };
  (function () {
    place('sb', 'tick', K.hookEnd + .3, .2, K.hookEnd, K.ask);           /* the search is entered */
    place('pp', 'click', wend('now', 'encryption.') + .25, .16, wend('now', 'encryption.'), K.hero);   /* the capsule's seal snaps on (the gap after "do." is 0.28 s of voice ring-out: no room) */
    place('tw', 'thump', K.heroEnd + .3, .2, K.heroEnd, K.dip);          /* USUALLY SAFE, the hero stamp, punched */
    place('sh', 'knock', K.sealedEnd + .3, .2, K.sealedEnd, K.honest);   /* the shutter drops */
    place('ne', 'slap', K.honestEnd + .3, .2, K.honestEnd, K.check);     /* the ≠ slams between SEALED and HONEST */
    place('ap', 'click', K.appleEnd + .3, .2, K.appleEnd, K.end);        /* the two bars unlock and swing apart */
    place('sl', 'click', wend('end', 'fake?') + .2, .16, wend('end', 'fake?'), at('end', 'Left'));   /* LEFT / RIGHT slam down */
  })();
  function gt(n, d) { return GT[n] != null ? GT[n] : d; }
  K.SB = gt('sb', K.hookEnd + .3); K.TW = gt('tw', K.heroEnd + .3); K.SH = gt('sh', K.sealedEnd + .3); K.NE = gt('ne', K.honestEnd + .3); K.AP = gt('ap', K.appleEnd + .3); K.PP = gt('pp', wend('now', 'encryption.') + .25); K.SL = gt('sl', wend('end', 'fake?') + .2); K.BLIND = at('sealed', 'the');   /* the blind starts down on "the scammer" */
  var TEND = Math.round(DUR * 30) / 30;                    /* frame 0 of the next loop sits at TEND */
  var SC = [
    { id: 'net', fn: 'netScene', name: 'Usually safe', t0: 0 },
    { id: 'shop', fn: 'shopScene', name: 'The fake site', t0: K.dip + .5, tw: .34 },
    { id: 'test', fn: 'testScene', name: 'Spot the fake', t0: K.name, tw: .32 },
    { id: 'end', fn: 'endScene', name: 'Left or right?', t0: TEND - .03, tw: .15, dir: -1 }
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

  /* ---------- the backgrounds: flat paper grounds, one tone per act (A ochre terminal, T forest, D oxblood, C plum),
     three torn sheets drifting at the edges and a cached paper grain (no blur blobs, no navy) ---------- */
  var TA = [hex('#5b4524'), hex('#6f5530'), hex('#3a2c17')], TT = [hex('#1f3b31'), hex('#2a4d40'), hex('#142720')],
      TD = [hex('#4a2125'), hex('#5f2d31'), hex('#2e1417')], TC = [hex('#3c2b3f'), hex('#4f3a53'), hex('#25192a')];
  function mixT(A, B, k) { return A.map(function (a, i) { return a.map(function (v, j) { return lerp(v, B[i][j], clamp(k, 0, 1)); }); }); }
  function rgbs(a) { return 'rgb(' + a.map(Math.round).join(',') + ')'; }
  function netTone(t) { return mixT(TA, TT, seg(t, K.then - .35, K.then + .25)); }
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
    var m = Math.max(8, w * .035), S = { x: m, y: m, w: w - 2 * m, h: h - 2 * m };
    g.save(); rr(g, S.x, S.y, S.w, S.h, rad - m * .6); g.clip();
    if (o.draw) o.draw(g, S);
    g.restore();
    g.fillStyle = '#05080b'; el(g, w / 2, m + w * .07, w * .034, w * .034);   /* round punch-hole */
    g.restore();
  }
  /* the Wi-Fi fan (three arcs and a dot); `lit` 0..1 fills the arcs one by one */
  function fan(g, x, y, s, col, lit, dim) {
    g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineWidth = 15;
    [20, 42, 64].forEach(function (r, i) {
      var on = lit == null ? 1 : seg(lit, i / 3, i / 3 + .2);
      g.strokeStyle = col; g.globalAlpha *= 1; g.save(); g.globalAlpha *= lerp(dim == null ? .3 : dim, 1, on);
      g.beginPath(); g.arc(0, 30, r, -Math.PI * .78, -Math.PI * .22); g.stroke(); g.restore();
    });
    g.fillStyle = col; el(g, 0, 30, 10, 10);
    g.restore();
  }
  /* frame 0's screen: the re-created Wi-Fi list (landscape), one open network, no lock glyph */
  function wifiScreen(g, S, ct, t) {
    g.save(); g.translate(S.x + S.w / 2, S.y + S.h / 2); g.rotate(Math.PI / 2);
    var L = { x: -S.h / 2, y: -S.w / 2, w: S.h, h: S.w };
    g.fillStyle = '#efe8da'; g.fillRect(L.x, L.y, L.w, L.h);
    g.fillStyle = '#2c3340'; g.fillRect(L.x, L.y, L.w, 64);
    /* the Wi-Fi switch in the header (on), no words */
    g.fillStyle = '#d9d2c2'; rr(g, L.x + L.w - 130, L.y + 14, 86, 38, 19); g.fill();
    g.fillStyle = '#2c3340'; el(g, L.x + L.w - 63, L.y + 33, 15, 15);
    fan(g, L.x + 60, L.y + 22, .32, CREAM, null);
    /* the network row: it breathes (a highlight sweep), the fan's arcs fill and empty */
    var rx = L.x + 28, ry = L.y + 96, rw = L.w - 56, rh = 156;
    var pulse = .5 + .5 * Math.sin(ct * 5.2), ps = Math.sin(Math.PI * seg(t, K.safeA - .05, K.safeA + .45));
    g.fillStyle = 'rgba(0,0,0,.14)'; rr(g, rx + 5, ry + 7, rw, rh, 26); g.fill();
    g.fillStyle = mixc(hex('#fbf7ef'), hex(HL), .25 + .3 * pulse + .45 * ps); rr(g, rx, ry, rw, rh, 26); g.fill();
    g.strokeStyle = INK; g.lineWidth = 4 + 4 * ps; rr(g, rx, ry, rw, rh, 26); g.stroke();
    fan(g, rx + 78, ry + 58, .9, INK, (ct * .9) % 1.25, .25);
    onprop(function () { txt(g, NET, rx + 150, ry + rh / 2 + 2, 62, INK, 'left', 900, DISP, rw - 200, 1, 46, 'condensed'); });
    /* a chevron, no lock */
    g.strokeStyle = INK; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(rx + rw - 46, ry + rh / 2 - 20); g.lineTo(rx + rw - 28, ry + rh / 2); g.lineTo(rx + rw - 46, ry + rh / 2 + 20); g.stroke();
    onprop(function () { tag(g, 'RE-CREATED', L.x + 150, L.y + L.h - 52, 1, 0, 300, INK, '#efe8da', 36); });
    /* USUALLY · FTC slaps onto the row on "usually" (chips print on their word) */
    var ua = t < K.then ? seg(tq(t), K.usually - .05, K.usually + .02) : 0;
    if (ua > 0) onprop(function () { chip(g, FTC.chip, L.x + L.w - 200, L.y + L.h - 52, { px: 46, wt: 900, st: 'condensed', bg: INK, fg: CREAM, a: ua, s: lerp(1.25, 1, eout(seg(t, K.usually - .05, K.usually + .1))), rot: -.035, r: 12 }); });
    g.restore();
  }
  /* the track phone's screen (portrait): a site's login form, two fields of dots, a button; no words */
  function loginScreen(g, S, t, a) {
    g.save(); g.globalAlpha *= a;
    g.fillStyle = '#efe8da'; g.fillRect(S.x, S.y, S.w, S.h);
    g.fillStyle = '#2c3340'; g.fillRect(S.x, S.y, S.w, S.h * .16);
    bankIcon(g, S.x + S.w / 2, S.y + S.h * .3, S.w * .0032, INK);
    for (var i = 0; i < 2; i++) { g.fillStyle = '#fbf7ef'; rr(g, S.x + S.w * .1, S.y + S.h * (.46 + i * .14), S.w * .8, S.h * .1, 10); g.fill(); g.strokeStyle = 'rgba(33,29,38,.5)'; g.lineWidth = 2; g.stroke();
      g.fillStyle = INK; for (var d = 0; d < 6; d++) el(g, S.x + S.w * (.2 + d * .1), S.y + S.h * (.51 + i * .14), 5, 5); }
    g.fillStyle = '#2c3340'; rr(g, S.x + S.w * .1, S.y + S.h * .78, S.w * .8, S.h * .09, 12); g.fill();
    g.restore();
  }
  /* a bank-front icon: pediment, four columns, a step (the fictional bank's logo; no words) */
  function bankIcon(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s * 100, s * 100); g.fillStyle = col;
    poly(g, [[-50, -18], [0, -46], [50, -18]]); g.fill(); g.fillRect(-46, -16, 92, 8);
    for (var i = 0; i < 4; i++) g.fillRect(-38 + i * 23, -4, 10, 34);
    g.fillRect(-50, 32, 100, 9);
    g.restore();
  }

  /* frame 0's pose: the phone lies in landscape, gliding up (it already moves on frame 0); ct < 0 (the end) runs the
     same line backwards, so the cut into frame 0 has no bump */
  var PW = 430, PH = 820, GL = 1.15, Y0 = 1190, DY = 180;
  function f0(ct) {
    var y = ct < 0 ? Y0 - 2 * DY / GL * ct : ct < GL ? Y0 - DY * (1 - Math.pow(1 - ct / GL, 2)) : Y0 - DY;
    var r = ct < 0 ? .07 - .1 * ct : .07 * Math.pow(1 - clamp(ct / GL, 0, 1), 2);
    return { x: 510, y: y, rot: -Math.PI / 2 + r };
  }
  /* frame 0's danger cue, no words: a periscope head peeks over the phone's top-right edge, its lens sweeping the screen;
     it sits behind the phone, so the glide hides it by ~0.6 s (a periodic function of ct, also for ct < 0: the seam) */
  var SCOPE_X = 790, SCOPE_K = 1.6;
  function scopePose(ct) { var top = 916 + 5 * Math.sin(ct * 2.2), look = .5 + .5 * Math.sin(ct * 1.7); return { top: top, ang: Math.PI + lerp(.42, .18, look) }; }
  function peekScope(g, ct) {
    var x = SCOPE_X, P = scopePose(ct), top = P.top;
    g.save();
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x - 24, top + 6, 60, 260);
    g.fillStyle = '#7d8f86'; g.fillRect(x - 30, top, 60, 260);
    g.fillStyle = '#6a7b72'; for (var y = top + 40; y < top + 260; y += 46) g.fillRect(x - 30, y, 60, 8);
    g.translate(x, top); g.rotate(P.ang); g.scale(SCOPE_K, -SCOPE_K);
    g.fillStyle = '#7d8f86'; rr(g, -40, -36, 106, 62, 14); g.fill();
    g.fillStyle = '#212a27'; el(g, 52, -5, 18, 22);
    g.fillStyle = HOT; el(g, 47, -11, 7, 8);                       /* the coral glint */
    g.fillStyle = 'rgba(244,237,224,.8)'; el(g, 44, -14, 3, 3);
    g.restore();
  }
  /* the lens's dashed sight line to the FREE_AIRPORT_WIFI row (2 px, coral), drawn over the phone */
  function scopeLine(g, ct, p, a) {
    if (a <= 0) return;
    var P = scopePose(ct), c = Math.cos(P.ang), sn = Math.sin(P.ang), lx = 52 * SCOPE_K, ly = 5 * SCOPE_K;
    var ex = SCOPE_X + c * lx - sn * ly, ey = P.top + sn * lx + c * ly;
    var r = p.rot + Math.PI / 2, tx = -40, ty = -30, qx = p.x + Math.cos(r) * tx - Math.sin(r) * ty, qy = p.y + Math.sin(r) * tx + Math.cos(r) * ty;
    g.save(); g.globalAlpha *= a; g.strokeStyle = HOT; g.lineWidth = 3; g.setLineDash([12, 10]); g.lineDashOffset = -ct * 50;
    g.beginPath(); g.moveTo(ex, ey); g.lineTo(qx, qy); g.stroke(); g.restore();
  }
  /* a departures board over the window: blank flaps (no words), one coral flap that flips (the room's warm accent) */
  function departures(g, ct) {
    var x0 = 132, y0 = 604, w = 250, h = 60;
    g.save();
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x0 + 6, y0 + 8, w, h);
    g.fillStyle = '#2b2622'; g.fillRect(x0, y0, w, h);
    g.fillStyle = '#4b3a2c'; g.fillRect(x0 + w * .3, y0 - 30, 6, 30); g.fillRect(x0 + w * .7, y0 - 30, 6, 30);
    for (var r = 0; r < 2; r++) for (var i = 0; i < 6; i++) {
      var fx = x0 + 12 + i * 39, fy = y0 + 8 + r * 26, hot = r === 0 && i === 4;
      var fk = hot ? ((ct * .8) % 1 + 1) % 1 : 0, fs = hot ? Math.abs(Math.cos(Math.PI * seg(fk, .82, 1))) : 1;
      g.save(); g.translate(fx + 16, fy + 10); g.scale(1, Math.max(.08, fs));
      g.fillStyle = hot ? HOT : '#d9cfbd'; g.fillRect(-16, -10, 32, 20);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-16, -1, 32, 2);
      g.restore();
    }
    g.restore();
  }
  function title0(g, a) { txt(g, 'SAFE?', 510, 534, 170, CREAM, 'center', 900, DISP, 800, a == null ? 1 : a, 60, 'condensed'); }
  var TY0 = 1.0, TY1 = 1.85;   /* at 1.0 s SAFE? slides into the search bar's end and IS PUBLIC WIFI types in front of it; done by 1.85 s */
  /* the rings from the phone's fan: cream, thin, every 0.9 s (a periodic function of ct, also for ct < 0) */
  var RP = .9, RLIFE = 2.2;
  function wifiRings(g, x, y, ct, a, r1) {
    if (a <= 0) return;
    var n1 = Math.floor(ct / RP), n0 = Math.ceil((ct - RLIFE) / RP), base = g.globalAlpha;
    g.save(); g.beginPath(); g.rect(0, 660, W, H); g.clip(); g.strokeStyle = CREAM;
    for (var n = n0; n <= n1; n++) { var k = (ct - n * RP) / RLIFE; if (k < 0 || k >= 1) continue; g.globalAlpha = base * a * .55 * Math.pow(1 - k, 1.2); g.lineWidth = lerp(12, 3, k); g.beginPath(); g.arc(x, y, lerp(150, r1 || 980, eout(k)), 0, 6.283); g.stroke(); }
    g.restore();
  }
  /* the terminal: a long window with a paper plane taking off (bg) and a row of empty gate seats (fg) */
  function terminalBg(g, ct) {
    var y0 = 690, y1 = 1120;
    g.fillStyle = '#3e2f18'; g.fillRect(40, y0 - 20, 1000, y1 - y0 + 40);
    g.fillStyle = '#b9cfc6'; g.fillRect(60, y0, 960, y1 - y0);
    g.fillStyle = '#a6bfb5'; poly(g, [[60, 1000], [300, 960], [560, 990], [820, 950], [1020, 975], [1020, y1], [60, y1]]); g.fill();
    g.fillStyle = '#6f7a70'; g.fillRect(60, 1060, 960, 60);
    g.fillStyle = '#e8dfc9'; for (var i = 0; i < 9; i++) g.fillRect(80 + ((i * 130 - ct * 40) % 1170 + 1170) % 1170 - 60, 1086, 70, 8);
    /* the plane: a cream paper airliner rising across the window, left to right */
    var px = -260 + 150 * (ct + 1.2), py = 900 - 24 * (ct + 1.2);
    g.save(); g.beginPath(); g.rect(60, y0, 960, y1 - y0); g.clip();
    g.translate(px, py); g.rotate(-.1);
    g.fillStyle = 'rgba(0,0,0,.18)'; poly(g, [[-120, 14], [110, 14], [140, 30], [-120, 30]]); g.fill();
    g.fillStyle = CREAM; rr(g, -130, -16, 270, 34, 17); g.fill();
    poly(g, [[-10, 0], [50, 0], [-30, 70], [-60, 70]]); g.fill();
    poly(g, [[-10, 0], [40, 0], [-20, -48], [-44, -48]]); g.fill();
    poly(g, [[-125, -10], [-95, -10], [-120, -62], [-138, -62]]); g.fill();
    g.fillStyle = '#7b8a90'; for (var w2 = 0; w2 < 8; w2++) el(g, -80 + w2 * 22, -4, 5, 5);
    g.restore();
    /* mullions */
    g.fillStyle = '#3e2f18'; [300, 540, 780].forEach(function (x) { g.fillRect(x - 9, y0, 18, y1 - y0); });
    g.fillRect(60, y0 + 6, 960, 12);
  }
  function seats(g, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = '#2b2219'; g.fillRect(120, 1388, 780, 14); g.fillRect(170, 1400, 14, 28); g.fillRect(836, 1400, 14, 28); g.fillRect(500, 1400, 14, 28);
    for (var i = 0; i < 3; i++) {
      var x = 134 + i * 256;
      g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, x + 8, 1206, 236, 150, 26); g.fill();
      g.fillStyle = '#3f6e72'; rr(g, x, 1196, 236, 150, 26); g.fill();
      g.fillStyle = '#4f8488'; rr(g, x + 10, 1330, 216, 52, 16); g.fill();
      g.fillStyle = KRAFT2; rr(g, x - 10, 1316, 20, 74, 8); g.fill();
    }
    g.fillStyle = KRAFT2; rr(g, 892, 1316, 20, 74, 8); g.fill();
    prop(g, 'seats', 120, 1196, 912, 1402);
    g.restore();
  }
  /* the search bar (re-created): from TY0 frame 0's SAFE? shrinks into the bar's end while IS PUBLIC WIFI types in front of
     it, so SAFE? never leaves the screen; the whole query is in by TY1 and the bar dips on enter */
  function searchBar(g, x, y, t, out) {
    var sa = seg(t, TY0, TY0 + .12) * (1 - out);
    if (sa <= 0 || !LIVE.text) return;
    var w = 820, h = 96, x0 = x - w / 2, y0 = y - h / 2, eo = eio(out), PX = 52;
    g.save(); g.translate(-120 * eo, 0);
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
    var preW = g.measureText(QPRE).width, safeW = g.measureText('SAFE?').width, done = t >= TY1;
    var k = seg(t, TY0 + .1, TY1), n = Math.round(QPRE.length * k), typing = !done && n > 0;
    /* a highlighter swipes across PUBLIC WIFI on "public" (the ask's stressed words) */
    var hk = eio(seg(t, K.pubA - .06, K.pubA + .62));
    if (hk > 0 && done) { var hx0 = x0 + 92 + g.measureText('IS ').width, hw = g.measureText('PUBLIC WIFI').width;
      g.fillStyle = HL; g.save(); g.translate(0, -2 * Math.sin(Math.PI * hk)); rr(g, hx0 - 8, y - 30, (hw + 16) * hk, 62, 10); g.fill(); g.restore(); }
    if (done) onprop(function () { txt(g, QUERY, x0 + 92, y + 3, PX, INK, 'left', 900, DISP, 0, 1, 40, 'condensed'); });
    else {
      var nr = NOREC; NOREC = true;
      if (n) onprop(function () { txt(g, QPRE.slice(0, n), x0 + 92, y + 3, PX, INK, 'left', 900, DISP, 0, 1, 40, 'condensed'); });
      if (typing && Math.floor(t * 8) % 2 === 0) { font(g, PX, 900, DISP, 'condensed'); g.fillStyle = INK; g.fillRect(x0 + 96 + g.measureText(QPRE.slice(0, n)).width, y - 26, 5, 52); }
      NOREC = nr;
      /* frame 0's SAFE? flies into its slot at the bar's end (same string, never off screen) */
      var mk = eio(seg(t, TY0, TY0 + .42)), sx = lerp(510, x0 + 92 + preW + safeW / 2, mk), sy = lerp(534, y + 3, mk), spx = lerp(170, PX, mk);
      onprop(function () { txt(g, 'SAFE?', sx, sy, spx, mixc(hex(CREAM), hex(INK), seg(mk, .3, .7)), 'center', 900, DISP, 0, 1, 40, 'condensed'); });
    }
    onprop(function () { tag(g, 'RE-CREATED', x0 + w - 122, y, sa * seg(t, TY0 + .42, TY0 + .52), 0, 220, INK, '#e8dfcc', 36); });
    EXITING = ex; g.restore();
  }
  /* the scope, from 0.8 s: a dark plate, one cream line at 56 px */
  function scopePlate(g, a) {
    if (a <= 0) return;
    var x0 = 110, x1 = 910, y0 = 652, y1 = 762;
    g.save(); g.globalAlpha *= a;
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x0 + 6, y0 + 9, x1 - x0, y1 - y0, 22); g.fill();
    g.fillStyle = INK; rr(g, x0, y0, x1 - x0, y1 - y0, 22); g.fill();
    g.strokeStyle = CREAM; g.lineWidth = 3; rr(g, x0, y0, x1 - x0, y1 - y0, 22); g.stroke();
    prop(g, 'scope plate', x0, y0, x1, y1);
    onprop(function () { txt(g, FTC.plate, 510, (y0 + y1) / 2 + 2, 56, CREAM, 'center', 900, DISP, 780, 1, 46, 'condensed'); });
    g.restore();
  }

  /* =====================================================================================================
     THE TRACK: phone (left) → router with a periscope (middle) → a site (right), on a kraft pneumatic tube
     ===================================================================================================== */
  var TY = 1224, TX0 = 312, TX1 = 790, PHT = { x: 208, y: 1104, s: .51 }, RT = { x: 510, y: 1100 }, SITE = { x0: 742, x1: 918, y0: 930, y1: 1300 };
  function floor(g) {
    g.fillStyle = '#183026'; g.fillRect(92, 1318, 836, 110);
    g.fillStyle = 'rgba(244,237,224,.08)'; for (var i = 0; i < 8; i++) g.fillRect(110 + i * 104, 1350 + (i % 2) * 30, 60, 6);
  }
  function tubeBack(g, a) {
    g.save(); g.globalAlpha *= a;
    g.fillStyle = '#16251f'; g.fillRect(TX0, TY - 36, TX1 - TX0, 72);
    g.restore();
  }
  function tubeFront(g, a) {
    g.save(); g.globalAlpha *= a;
    g.fillStyle = KRAFT; g.fillRect(TX0, TY - 44, TX1 - TX0, 10); g.fillRect(TX0, TY + 34, TX1 - TX0, 10);
    g.fillStyle = KRAFT2; for (var x = TX0 + 40; x < TX1; x += 92) { g.fillRect(x, TY - 48, 14, 18); g.fillRect(x, TY + 30, 14, 18); }
    prop(g, 'tube', TX0, TY - 48, TX1, TY + 48);
    g.restore();
  }
  /* the router: a paper box with two antennas and blinking lights; its own little Wi-Fi fan breathes */
  function router(g, t, a) {
    if (a <= 0) return;
    var x = RT.x, y = RT.y;
    g.save(); g.globalAlpha *= a;
    g.strokeStyle = '#2f3a36'; g.lineWidth = 12; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 80, y - 40); g.lineTo(x - 104, y - 150); g.stroke(); g.beginPath(); g.moveTo(x + 80, y - 40); g.lineTo(x + 104, y - 150); g.stroke();
    g.fillStyle = '#2f3a36'; g.fillRect(x - 12, y + 40, 24, TY - 44 - y - 40);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, x - 122, y - 42, 252, 96, 18); g.fill();
    g.fillStyle = '#e7dcc4'; rr(g, x - 126, y - 48, 252, 92, 18); g.fill();
    g.fillStyle = '#cfc2a6'; g.fillRect(x - 126, y + 20, 252, 24);
    for (var i = 0; i < 5; i++) { var on = Math.sin(t * (5 + i * 1.7) + i * 2) > -.2; g.fillStyle = on ? '#6fbf73' : '#5d6a5f'; el(g, x - 84 + i * 34, y - 4, 7, 7); }
    prop(g, 'router', x - 126, y - 158, x + 126, y + 44);
    g.restore();
  }
  function routerRings(g, t, a) {
    if (a <= 0) return;
    var base = g.globalAlpha; g.save(); g.strokeStyle = CREAM;
    for (var n = Math.ceil((t - 1.6) / .8); n <= Math.floor(t / .8); n++) { var k = (t - n * .8) / 1.6; if (k < 0 || k >= 1) continue; g.globalAlpha = base * a * .5 * (1 - k); g.lineWidth = lerp(8, 3, k); g.beginPath(); g.arc(RT.x, RT.y - 40, lerp(150, 330, k), -Math.PI * .85, -Math.PI * .15); g.stroke(); }
    g.restore();
  }
  /* the periscope: a grey-green paper tube that rises out of the router and swivels to read what passes underneath */
  function periscope(g, up, look, a) {
    if (up <= 0 || a <= 0) return;
    var x = RT.x + 60, base = RT.y - 48, top = lerp(base, 880, eout(up));
    g.save(); g.globalAlpha *= a;
    g.beginPath(); g.rect(0, 0, W, base); g.clip();
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x - 18, top + 6, 44, base - top);
    g.fillStyle = '#7d8f86'; g.fillRect(x - 22, top, 44, base - top + 4);
    g.fillStyle = '#6a7b72'; for (var y = top + 40; y < base; y += 46) g.fillRect(x - 22, y, 44, 8);
    g.save(); g.translate(x, top); g.rotate(lerp(-.5, .6, look));
    g.fillStyle = '#7d8f86'; rr(g, -40, -36, 106, 62, 14); g.fill();
    g.fillStyle = '#212a27'; el(g, 52, -5, 18, 22);
    g.fillStyle = 'rgba(244,237,224,.7)'; el(g, 47, -12, 6, 7);
    g.restore();
    if (up >= 1) prop(g, 'periscope', x - 46, top - 40, x + 72, base);
    g.restore();
  }
  /* the slip / capsule: an open paper slip YOUR LOGIN •••••• (k = 0), rolled into a cream capsule (k = 1);
     `seal` stamps the coral wax seal on; `open` (0..1) pulls the cap off (only ever inside the fake shop) */
  function capsule(g, x, y, s, roll, seal, open, rot, len) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    var L = len || 220, Hh = 92;
    if (roll < 1) {   /* the open slip */
      g.save(); g.globalAlpha *= 1 - seg(roll, .6, 1);
      var sw = lerp(L, 70, eio(seg(roll, 0, .8)));
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-sw / 2 + 5, -Hh / 2 + 7, sw, Hh);
      g.fillStyle = PAPER; g.fillRect(-sw / 2, -Hh / 2, sw, Hh);
      g.strokeStyle = 'rgba(33,29,38,.25)'; g.lineWidth = 2; g.strokeRect(-sw / 2 + 6, -Hh / 2 + 6, sw - 12, Hh - 12);
      if (roll < .3) {
        onprop(function () { txt(g, 'YOUR LOGIN', 0, -14, 36, INK, 'center', 900, DISP, sw - 24, 1 - roll / .3, 36, 'condensed'); });
        g.fillStyle = INK; for (var d = 0; d < 6; d++) el(g, -50 + d * 20, 22, 6, 6);
      }
      prop(g, 'slip', -sw / 2, -Hh / 2, sw / 2, Hh / 2);
      g.restore();
    }
    if (roll > 0) {   /* the capsule */
      g.save(); g.globalAlpha *= seg(roll, .4, .8);
      var cw = lerp(90, L, eio(seg(roll, .4, 1)));
      g.fillStyle = 'rgba(0,0,0,.32)'; rr(g, -cw / 2 + 6, -Hh / 2 + 9, cw, Hh, Hh / 2); g.fill();
      var oc = 60 * eio(open || 0);
      g.fillStyle = '#efe3c6'; rr(g, -cw / 2, -Hh / 2, cw - 36, Hh, Hh / 2); g.fill();
      g.fillStyle = '#d8c7a0'; g.fillRect(-cw / 2 + 30, -Hh / 2 + 10, cw - 96, 8);
      g.strokeStyle = 'rgba(33,29,38,.4)'; g.lineWidth = 3; rr(g, -cw / 2, -Hh / 2, cw - 36, Hh, Hh / 2); g.stroke();
      /* the cap (right end) with the seal on it */
      g.save(); g.translate(oc, -oc * .4); g.rotate(.5 * eio(open || 0));
      g.fillStyle = '#e2d2ad'; rr(g, cw / 2 - 70, -Hh / 2 - 4, 70, Hh + 8, 26); g.fill(); g.strokeStyle = 'rgba(33,29,38,.45)'; g.stroke();
      if (seal > 0) waxSeal(g, cw / 2 - 70, 0, 38 * lerp(1.5, 1, eout(seal)), seg(seal, 0, .3));
      g.restore();
      if (open > .3) {   /* the slip pulled out of the open end */
        g.save(); g.globalAlpha *= seg(open, .3, .7);
        g.fillStyle = PAPER; g.fillRect(cw / 2 - 40, -30, 70 + 60 * seg(open, .4, 1), 60);
        g.fillStyle = INK; for (var dd = 0; dd < 3; dd++) el(g, cw / 2 - 10 + dd * 18, 0, 5, 5);
        g.restore();
      }
      prop(g, 'capsule', -cw / 2, -Hh / 2, cw / 2, Hh / 2);
      g.restore();
    }
    g.restore();
  }
  /* the coral wax seal: a scalloped blob with a pressed ring (the mechanism accent; never a padlock) */
  function waxSeal(g, x, y, r, a, grey) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath();
    for (var i = 0; i <= 24; i++) { var an = i / 24 * 6.283, rr2 = r * (1 + .09 * Math.sin(i * 2.7)); g.lineTo(Math.cos(an) * rr2 + 3, Math.sin(an) * rr2 + 4); }
    g.fill();
    g.fillStyle = grey ? SEALG : HOT; g.beginPath();
    for (i = 0; i <= 24; i++) { an = i / 24 * 6.283; rr2 = r * (1 + .09 * Math.sin(i * 2.7)); g.lineTo(Math.cos(an) * rr2, Math.sin(an) * rr2); }
    g.fill();
    g.strokeStyle = 'rgba(80,20,10,.45)'; g.lineWidth = Math.max(2, r * .09); g.beginPath(); g.arc(0, 0, r * .62, 0, 6.283); g.stroke();
    g.strokeStyle = 'rgba(255,220,200,.5)'; g.lineWidth = Math.max(2, r * .07); g.beginPath(); g.arc(-r * .1, -r * .12, r * .3, Math.PI * 1.1, Math.PI * 1.7); g.stroke();
    g.restore();
  }
  /* a storefront: awning, a sign (an icon), a window, a door with a mail slot and (optionally) a seal */
  function shopFront(g, x0, y0, w, h, icon, seal, sealGrey, name) {
    var aw = h * .16;
    g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(x0 + 7, y0 + 10, w, h);
    g.fillStyle = '#e7dcc4'; g.fillRect(x0, y0 + aw * .6, w, h - aw * .6);
    var n = 5; for (var i = 0; i < n; i++) { g.fillStyle = i % 2 ? '#e7dcc4' : '#3f6e72'; poly(g, [[x0 + w * i / n, y0], [x0 + w * (i + 1) / n, y0], [x0 + w * (i + 1) / n, y0 + aw], [x0 + w * (i + .5) / n, y0 + aw * 1.25], [x0 + w * i / n, y0 + aw]]); g.fill(); }
    g.fillStyle = '#2c3340'; g.fillRect(x0 + w * .12, y0 + aw * 1.45, w * .76, h * .14);
    if (icon) icon(g, x0 + w / 2, y0 + aw * 1.45 + h * .07, Math.min(w, h) * .0028);
    g.fillStyle = '#9fb7b2'; g.fillRect(x0 + w * .1, y0 + h * .46, w * .34, h * .3);
    g.fillStyle = '#5a4a3a'; g.fillRect(x0 + w * .54, y0 + h * .44, w * .36, h * .56);
    g.fillStyle = '#2b2219'; g.fillRect(x0 + w * .6, y0 + h * .62, w * .24, 6);
    if (seal) waxSeal(g, x0 + w * .72, y0 + h * .53, Math.min(w, h) * .085, seal, sealGrey);
    prop(g, name || 'shop', x0, y0, x0 + w, y0 + h);
  }
  /* twelve little shop icons for the web: mail, cart, play, book, cup, note, plane, heart, camera, pin, chat, bank */
  var ICONS = [
    function (g) { g.fillRect(-30, -18, 60, 40); g.fillStyle = '#2c3340'; poly(g, [[-30, -18], [0, 6], [30, -18]]); g.fill(); },
    function (g) { g.fillRect(-30, -16, 50, 26); g.fillRect(-36, -24, 10, 8); el(g, -20, 20, 6, 6); el(g, 12, 20, 6, 6); },
    function (g) { poly(g, [[-18, -24], [26, 0], [-18, 24]]); g.fill(); },
    function (g) { g.fillRect(-28, -22, 26, 44); g.fillRect(2, -22, 26, 44); },
    function (g) { rr(g, -22, -18, 36, 40, 8); g.fill(); g.lineWidth = 6; g.strokeStyle = g.fillStyle; g.beginPath(); g.arc(18, 0, 10, -1.5, 1.5); g.stroke(); },
    function (g) { el(g, -12, 18, 12, 9); g.fillRect(-2, -26, 7, 44); g.fillRect(-2, -26, 22, 8); },
    function (g) { poly(g, [[-30, 0], [30, -6], [34, 0], [30, 6]]); g.fill(); poly(g, [[-4, 0], [10, 0], [-10, 24], [-18, 24]]); g.fill(); poly(g, [[-4, 0], [10, 0], [-10, -24], [-18, -24]]); g.fill(); },
    function (g) { g.beginPath(); g.moveTo(0, 22); g.bezierCurveTo(-40, -6, -18, -34, 0, -12); g.bezierCurveTo(18, -34, 40, -6, 0, 22); g.fill(); },
    function (g) { rr(g, -30, -16, 60, 38, 8); g.fill(); g.fillRect(-12, -24, 24, 10); g.fillStyle = '#e7dcc4'; el(g, 0, 3, 11, 11); },
    function (g) { g.beginPath(); g.arc(0, -8, 18, Math.PI * .85, Math.PI * .15); g.lineTo(0, 26); g.closePath(); g.fill(); g.fillStyle = '#e7dcc4'; el(g, 0, -8, 7, 7); },
    function (g) { rr(g, -30, -22, 60, 36, 12); g.fill(); poly(g, [[-14, 12], [-4, 12], [-18, 26]]); g.fill(); },
    function (g) { bankIcon(g, 0, 0, .006, g.fillStyle); }
  ];
  /* the web: 12 small shop tiles; 9 seals go coral in a wave on "most", 3 stay grey (MOST, not all) */
  var SEALED12 = [1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1];
  function shopGrid(g, t, a, y0) {
    if (a <= 0) return;
    var tw0 = 124, th = 128, gap = 8, x0 = 510 - (6 * tw0 + 5 * gap) / 2;
    g.save(); g.globalAlpha *= a;
    for (var i = 0; i < 12; i++) {
      var c = i % 6, r = Math.floor(i / 6), x = x0 + c * (tw0 + gap), y = y0 + r * (th + gap);
      var ap = eout(seg(t, K.most - .15 + i * .035, K.most + .15 + i * .035));
      if (ap <= 0) continue;
      g.save(); g.translate(x + tw0 / 2, y + th); g.scale(ap, ap); g.translate(-(x + tw0 / 2), -(y + th));
      var lit = SEALED12[i] ? seg(tq(t), K.most + i * .05, K.most + .12 + i * .05) : 0;
      var ex = EXITING; if (ap < 1) EXITING = true;
      shopFront(g, x, y, tw0, th, function (g2, cx, cy, s) { g2.save(); g2.translate(cx, cy); g2.scale(.6, .6); g2.fillStyle = CREAM; ICONS[i](g2); g2.restore(); }, SEALED12[i] ? lit : 0, false, 'shop tile');
      EXITING = ex;
      g.restore();
    }
    g.restore();
  }
  /* the copy the periscope made: readable dots in the early internet; scribble once the capsule is sealed */
  function copyCard(g, x, y, s, scribble, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s); g.rotate(-.03);
    var w = 460, h = 168;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-w / 2 + 7, -h / 2 + 10, w, h);
    g.fillStyle = PAPER; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = HL; el(g, 0, -h / 2 + 4, 14, 14);
    prop(g, 'copy', -w / 2, -h / 2, w / 2, h / 2);
    if (!scribble) {
      var nr = NOREC; NOREC = true; onprop(function () { txt(g, 'YOUR LOGIN', 0, -26, 52, INK, 'center', 900, DISP, w - 40, 1, 40, 'condensed'); }); NOREC = nr;
      g.fillStyle = INK; for (var d = 0; d < 8; d++) el(g, -105 + d * 30, 38, 9, 9);
    } else {
      g.strokeStyle = INK; g.lineWidth = 6; g.lineCap = 'round';
      for (var l = 0; l < 3; l++) { g.beginPath(); for (var xx = -180; xx <= 180; xx += 8) g.lineTo(xx, -40 + l * 40 + 10 * Math.sin(xx * .09 + l * 2) + 6 * Math.sin(xx * .31 + l)); g.stroke(); }
    }
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1: THE NET (hook → dip). A the airport, change 1 the track, the hero plate
     ===================================================================================================== */
  var TR0 = function () { return K.then - .3; }, TR1 = function () { return K.then + .35; };
  function phoneNet(t) {   /* the phone: frame 0's glide, then it turns upright and moves to the track's left end */
    var p = f0(t), k = eio(seg(t, TR0(), TR1()));
    /* on "public Wi-Fi safe?" the phone lifts and tilts toward the search bar (no frozen stretch in the 3.5-6.5 s window) */
    var lf = Math.sin(Math.PI * eio(seg(t, K.pubA - .1, K.safeA + .4))); p = { x: p.x, y: p.y - 22 * lf, rot: p.rot + .03 * lf };
    return { x: lerp(p.x, PHT.x, k), y: lerp(p.y, PHT.y, k) - 60 * Math.sin(Math.PI * k), rot: lerp(p.rot, 0, k), s: lerp(1, PHT.s, k), k: k };
  }
  /* where the slip/capsule is on its run (u 0..1 from the phone's edge to the site's slot) */
  function runX(u) { return lerp(TX0 - 20, TX1 - 10, u); }
  function netScene(g, t) {
    if (LAYER === 'over') return;
    var tone = netTone(t);
    if (LAYER === 'bg') { paperBg(g, t, tone); var ta = 1 - seg(t, TR0(), TR0() + .3); if (ta > 0) { g.save(); g.globalAlpha *= ta; terminalBg(g, t); g.restore(); } return; }
    var air = 1 - seg(t, TR0(), TR0() + .3), trk = seg(t, K.then - .1, K.then + .3);
    /* B (hero) hides the track once its plate is fully up */
    var heroUp = eout(seg(t, K.calls - .25, K.calls + .2)), hidden = t >= K.calls + .2, trkA = 1 - seg(heroUp, .45, .9);
    /* A: rings behind the phone, the seats under it */
    var p = phoneNet(t);
    if (air > 0) { g.save(); g.globalAlpha *= air; wifiRings(g, p.x - 290, p.y, t, 1); seats(g, 1); if (t < GL) peekScope(g, t); departures(g, t); g.restore(); }
    /* the track world */
    if (trk > 0 && !hidden) {
      quiet(function () {
        g.save(); g.globalAlpha *= trk * trkA;
        floor(g); tubeBack(g, 1);
        routerRings(g, t, 1);
        var up = eout(seg(t, K.snoop - .1, K.snoop + .35)) * (1 - eio(seg(t, K.today - .1, K.today + .2))) + eout(seg(t, K.enc + .05, K.enc + .35));
        var run = slipRun(t);
        var look = run ? clamp((run.x - 400) / 360, 0, 1) : .5;
        periscope(g, clamp(up, 0, 1), look, 1);
        router(g, t, 1);
        /* the site: early internet (no seal) → today (coral seal, sealed on "most" like the others) */
        var sa = SEALED12[11] ? seg(tq(t), K.most + .55, K.most + .67) : 0;
        if (run) {   /* the run goes in behind the site's front (into its slot) */
          g.save(); g.beginPath(); g.rect(0, 0, SITE.x0 + 60, H); g.clip();
          capsule(g, run.x, TY, run.s, run.roll, run.seal, 0, 0);
          g.restore();
        }
        shopFront(g, SITE.x0, SITE.y0, SITE.x1 - SITE.x0, SITE.y1 - SITE.y0, function (g2, cx, cy) { g2.fillStyle = '#2c3340'; g2.fillRect(cx - 82, cy - 30, 164, 60); onprop(function () { txt(g2, 'LUMEN BANK', cx, cy + 2, 32, CREAM, 'center', 900, DISP, 152, 1, 30, 'condensed'); }); }, sa, false, 'site');   /* the real bank, seeded for the test (made-up name) */
        if (run) {
          /* the sight line from the periscope's lens to what passes underneath */
          if (run.look > 0) { g.save(); g.globalAlpha *= run.look; g.strokeStyle = CREAM; g.lineWidth = 5; g.setLineDash([14, 12]); g.lineDashOffset = -t * 60; g.beginPath(); g.moveTo(RT.x + 104, 884); g.lineTo(run.x, TY - 50); g.stroke(); g.restore(); }
        }
        tubeFront(g, 1);
        g.restore();
      }, trk < 1);
    }
    /* the phone: frame 0's Wi-Fi list, turning upright into the login form */
    if (!hidden) quiet(function () {
      var off = p.k; g.save(); g.globalAlpha *= trkA;
      phone(g, p.x, p.y, PW * p.s, PH * p.s, p.rot, { name: 'phone', draw: function (g2, S) {
        if (off < .6) { g2.save(); g2.globalAlpha *= 1 - seg(off, .35, .6); wifiScreen(g2, S, t, t); g2.restore(); }
        if (off > .35) loginScreen(g2, S, t, seg(off, .35, .6));
      } }); g.restore();
    }, (t < GL) || (p.k > 0 && p.k < 1) || trkA < 1);
    if (t < .6) scopeLine(g, t, f0(t), 1 - seg(t, .3, .55));
    /* frame 0's SAFE? holds to TY0, then flies into the search bar; the scope plate from 0.8 s holds to the track */
    if (t < TY0) title0(g);
    var scA = seg(t, .8, .9), scO = eio(seg(t, K.then - .45, K.then - .2));
    if (scA > 0 && scO < 1) quiet(function () {
      g.save(); peelT(g, 120, 762, scO);
      var pk = .02 * Math.sin(Math.PI * seg(t, K.ftcA - .02, K.ftcA + .22)); g.translate(510, 707); g.scale(1 + pk, 1 + pk); g.translate(-510, -707);
      scopePlate(g, scA); g.restore();
    }, scA < 1 || scO > 0);
    searchBar(g, 510, 532, t, eio(seg(t, K.then - .45, K.then - .2)));
    /* the track's cards: EARLY INTERNET → TODAY; the copy; the web; MOST SITES */
    var cardsOut = K.hero + .12;
    card(g, 'EARLY INTERNET', 510, lerp(720, 520, eio(seg(t, K.snoop - .2, K.snoop + .15))), t, K.early, K.today - .12, lerp(84, 64, eio(seg(t, K.snoop - .2, K.snoop + .15))), 800);
    card(g, 'TODAY', 300, 520, t, K.today, cardsOut, 64, 400);
    if (t >= K.most) card(g, FTC.most, 690, 520, t, K.most, cardsOut, 50, 420);
    /* the periscope's copy: flies from the lens to the board on "scramble"; peels on "today" */
    var cf = seg(t, K.didnt - .05, K.didnt + .3), co = eio(seg(t, K.most - .2, K.most + .05));
    if (cf > 0 && co < 1) quiet(function () {
      g.save(); g.translate(-700 * co, 0);
      var e = eout(cf); copyCard(g, lerp(RT.x + 104, 400, e), lerp(884, 740, e) - 80 * Math.sin(Math.PI * e), lerp(.2, 1, e), false, 1);
      /* (no COPIED chip: jury r1, it says more than the FTC does) */
      g.restore();
    }, cf < 1 || co > 0);
    /* the web (12 shops) on "today"/"most" */
    var gOut = eio(seg(t, K.hero - .1, K.hero + .15));
    if (t > K.today && gOut < 1) quiet(function () { g.save(); g.translate(0, -40 * gOut); g.globalAlpha *= 1 - gOut; shopGrid(g, t, 1, 600); g.restore(); }, gOut > 0);
    /* the scribble copy: the sealed run passes and the periscope reads only scribble */
    var sk = seg(t, K.PP + .3, K.PP + .55), so = eio(seg(t, K.calls - .4, K.calls - .15));
    if (sk > 0 && so < 1) quiet(function () { g.save(); g.globalAlpha *= 1 - so; var e = eout(sk); copyCard(g, lerp(RT.x + 104, 300, e), lerp(884, 900, e) - 40 * Math.sin(Math.PI * e), lerp(.2, .5, e), true, 1); g.restore(); }, sk < 1 || so > 0);
    /* B: the FTC card drops on "FTC"; the hero plate rises on "calls"; the stamp inks on "usually", slams on K.TW */
    var kin = eout(seg(t, K.hero + .1, K.hero + .35)), kout = 0;   /* held: the shop wipe (17.46-17.8 s) takes them off */
    if (kin > 0 && kout < 1) quiet(function () { g.save(); g.translate(5 * Math.sin(t * 1.7), -560 * (1 - kin)); peelT(g, 140, 880, kout); ftcCard(g, t); g.restore(); }, kin < 1 || kout > 0);
    if (heroUp > 0 && kout < 1) quiet(function () { g.save(); g.translate(0, 520 * (1 - heroUp)); peelT(g, 140, 1300, kout); heroPlate(g, t); g.restore(); }, heroUp < 1 || kout > 0);
  }
  /* the runs: snoop (an open slip, read by the periscope) and the sealed one after "encryption" */
  function slipRun(t) {
    var a0 = K.snoop + .15, a1 = K.scramble + .1;            /* the open slip leaves the phone and reaches the site */
    if (t >= K.then + .35 && t < a1 + .1) {
      var u = sio(seg(t, a0, a1)), x = runX(u), look = Math.sin(Math.PI * seg(x, 380, 760));
      return { x: x, s: eout(seg(t, K.then + .35, K.then + .6)), roll: 0, seal: 0, look: look * seg(t, K.snoop + .3, K.snoop + .4) };
    }
    if (t >= K.today - .1 && t < K.ftcH + .6) {               /* a new slip: rolled over "today … encryption", sealed on the pop after "encryption." (K.PP), then the run */
      var r0 = clamp((t - K.today) / Math.max(.3, K.PP - .15 - K.today), 0, 1);
      var u2 = sio(seg(t, K.PP + .06, K.PP + .75)), xo = lerp(runX(0), 430, eio(seg(t, K.today - .1, K.today + .45))), x2 = lerp(xo, runX(1), u2);   /* out from behind the phone to roll and seal in the open */
      return { x: x2, s: 1, roll: eio(r0), seal: seg(tq(t), K.PP - .1, K.PP), look: Math.sin(Math.PI * seg(x2, 380, 760)) * .8 };
    }
    return null;
  }
  /* the FTC card (re-created): kicker, title, the quote that inks on "usually" */
  var FC = { x0: 108, x1: 912, y0: 446, y1: 896 };
  function ftcCard(g, t) {
    var x0 = FC.x0, x1 = FC.x1, y0 = FC.y0, y1 = FC.y1;
    sheet(g, x0, y0, x1, y1, 5201, PAPER, 'ftc card');
    onprop(function () {
      txt(g, FTC.kicker, x0 + 36, y0 + 46, 38, '#5d564c', 'left', 800, DISP, 480, 1, 36, 'condensed');
      tag(g, 'RE-CREATED', x1 - 130, y0 + 46, 1, 0, 240, INK, PAPER, 36);
      txt(g, FTC.title, x0 + 36, y0 + 118, 62, INK, 'left', 900, DISP, x1 - x0 - 72, 1, 40, 'condensed');
    });
    g.fillStyle = 'rgba(33,29,38,.4)'; g.fillRect(x0 + 36, y0 + 166, x1 - x0 - 72, 3);
    var qa = seg(tq(t), K.ftcH - .04, K.ftcH + .06);
    onprop(function () { FTC.hero.forEach(function (L, i) { txt(g, L, x0 + 36, y0 + 222 + i * 70, 60, INK, 'left', 900, DISP, x1 - x0 - 72, qa, 40, 'condensed'); }); });
    /* the highlighter under "USUALLY SAFE" draws on "usually" (under the ink, not over it) */
  }
  var HP = { x0: 96, x1: 924, y0: 936, y1: 1418 };
  function heroPlate(g, t) {
    var x0 = HP.x0, x1 = HP.x1, y0 = HP.y0, y1 = HP.y1;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, x0 + 8, y0 + 12, x1 - x0, y1 - y0, 26); g.fill();
    g.fillStyle = '#1e1b23'; rr(g, x0, y0, x1 - x0, y1 - y0, 26); g.fill(); rr(g, x0, y0, x1 - x0, y1 - y0, 26); grainIn(g, x0, y0, x1 - x0, y1 - y0, 5301, .8);
    g.strokeStyle = 'rgba(244,237,224,.5)'; g.lineWidth = 3; rr(g, x0, y0, x1 - x0, y1 - y0, 26); g.stroke();
    prop(g, 'hero plate', x0, y0, x1, y1);
    /* the sealed capsule stands at the left, bobbing */
    onprop(function () { capsule(g, 236, y0 + 190 + 8 * Math.sin(t * 2.3), 1.05, 1, 1, 0, -Math.PI / 2 + .12 + .05 * Math.sin(t * 1.4)); });
    /* the stamp inks on "usually", creeps, lifts to 1.08 and slams back on the thump (K.TW) */
    var lift = sio(seg(t, K.TW - .22, K.TW - .05)) * (1 - eio(seg(t, K.TW - .05, K.TW))), squash = -.025 * Math.sin(Math.PI * seg(t, K.TW, K.TW + .14));
    var creep = .05 * sio(seg(t, K.usuallyH + .2, K.TW - .22)) * (1 - seg(t, K.TW - .05, K.TW)) + .03 * sio(seg(t, K.TW + .14, K.dip));
    var ss = 1 + creep + .08 * lift + squash;
    g.save(); g.translate(606, y0 + 178); g.scale(ss, ss);
    if (t < K.usuallyH + .1) { g.save(); g.globalAlpha *= .2 * (1 - seg(t, K.usuallyH, K.usuallyH + .1)); var nr = NOREC; NOREC = true; stamp(g, FTC.stamp, 0, 0, K.usuallyH + 5, K.usuallyH, 134, CREAM, -.04); NOREC = nr; g.restore(); }
    onprop(function () { stamp(g, FTC.stamp, 0, 0, t, K.usuallyH, 134, HOT, -.04); });
    g.restore();
    var aa = seg(tq(t), K.calls - .04, K.calls + .04);
    onprop(function () { FTC.under.forEach(function (L, i) { txt(g, L, 606, y1 - 96 + i * 52, 46, CREAM, 'center', 900, DISP, 520, aa, 44, 'condensed'); }); });
  }

  /* =====================================================================================================
     SCENE 2: THE FAKE SHOP (dip → honest). One big storefront with the same coral seal; the sealed capsule arrives intact
     ===================================================================================================== */
  var BIG = { x0: 300, x1: 908, y0: 912, y1: 1424 };
  function crookedSign(g, x, y, w, h, t) {
    /* LUMEM BANK with its letters not sitting straight; the bank icon at the left; it wobbles on "fake" */
    var wob = Math.sin(Math.PI * seg(t, K.fake - .05, K.fake + .5)) * Math.sin(t * 22);
    g.save(); g.translate(x, y); g.rotate(-.03 + .05 * wob);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
    g.fillStyle = '#2c3340'; g.fillRect(-w / 2, -h / 2, w, h);
    var fl = Math.sin(Math.PI * seg(t, K.rightS - .02, K.rightS + .12)) + .7 * Math.sin(Math.PI * seg(t, K.rightS + .2, K.rightS + .3));   /* the sign flickers once on "Right" */
    bankIcon(g, -w / 2 + 62, 2, .0068, CREAM);
    /* LUMEM BANK (made-up): the last M of LUMEM hangs 12° off, the tell you can see with the sound off */
    var L = ['L', 'U', 'M', 'E', 'M', ' ', 'B', 'A', 'N', 'K'], tilt = [.02, -.03, .01, -.02, .21, 0, .02, -.05, .06, -.03], dy = [0, 2, -1, 1, 7, 0, 0, 3, -3, 2];
    onprop(function () { L.forEach(function (c, i) { if (c === ' ') return; g.save(); g.translate(-w / 2 + 140 + i * 38, dy[i]); g.rotate(tilt[i]); txt(g, c, 0, 2, 64, CREAM, 'center', 900, DISP, 0, 1, 40, 'condensed'); g.restore(); }); });
    if (fl > 0) { g.fillStyle = 'rgba(12,8,10,' + (.6 * fl).toFixed(3) + ')'; g.fillRect(-w / 2, -h / 2, w, h); }
    prop(g, 'sign', -w / 2, -h / 2, w / 2, h / 2);
    g.restore();
  }
  function bigShop(g, t) {
    var x0 = BIG.x0, x1 = BIG.x1, y0 = BIG.y0, y1 = BIG.y1, w = x1 - x0, h = y1 - y0;
    /* awning */
    g.fillStyle = 'rgba(0,0,0,.32)'; g.fillRect(x0 + 8, y0 + 12, w, h);
    g.fillStyle = '#e7dcc4'; g.fillRect(x0, y0 + 60, w, h - 60);
    for (var i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#e7dcc4' : '#7a2f33'; poly(g, [[x0 + w * i / 7, y0], [x0 + w * (i + 1) / 7, y0], [x0 + w * (i + 1) / 7, y0 + 80], [x0 + w * (i + .5) / 7, y0 + 100], [x0 + w * i / 7, y0 + 80]]); g.fill(); }
    prop(g, 'storefront', x0, y0, x1, y1);
    crookedSign(g, x0 + w / 2, y0 + 168, w - 80, 104, t);
    /* the window (sign to door): dark glass; the paper blind drops at 22.3 s; on the knock the light comes on behind it and
       the capsule's silhouette shows the cap popping off and the seal flying (crisp: a 0.16 s pop, then still) */
    var wx0 = x0 + 30, wx1 = x0 + 330, wy0 = y0 + 226, wy1 = y0 + 502;
    g.fillStyle = '#4b3a2c'; g.fillRect(wx0 - 10, wy0 - 10, wx1 - wx0 + 20, wy1 - wy0 + 20);
    g.fillStyle = '#2a2024'; g.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
    g.fillStyle = 'rgba(244,237,224,.08)'; poly(g, [[wx0 + 40, wy0], [wx0 + 110, wy0], [wx0 + 30, wy1], [wx0, wy1], [wx0, wy0 + 90]]); g.fill();
    var bl = eio(seg(t, K.BLIND, K.BLIND + .55)), by1 = lerp(wy0, wy1, bl);
    var lightOn = seg(t, K.SH + .02, K.SH + .1);
    g.fillStyle = mixc(hex('#cdbf9f'), hex('#f2dfae'), lightOn); g.fillRect(wx0, wy0, wx1 - wx0, by1 - wy0);
    g.strokeStyle = 'rgba(80,60,40,.25)'; g.lineWidth = 2; for (var y = wy0 + 18; y < by1; y += 22) { g.beginPath(); g.moveTo(wx0, y); g.lineTo(wx1, y); g.stroke(); }
    if (bl > 0 && bl < 1) { g.fillStyle = '#b8a888'; g.fillRect(wx0 - 4, by1 - 8, wx1 - wx0 + 8, 10); }
    var sh = lightOn;
    if (sh > 0 && bl >= 1) {
      var pk = eout(seg(t, K.SH + .04, K.SH + .2)), op = seg(t, K.SH + .5, K.honest + .3);
      g.save(); g.beginPath(); g.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); g.clip(); g.globalAlpha *= .88 * sh; g.fillStyle = '#33241e';
      /* the capsule stands upright; its cap pops off up and right; the seal flies up-left to the top corner (seal top to body foot ≈ 300 px) */
      var bx = wx0 + 70, bw = 84, btop = wy1 - 180;
      rr(g, bx, btop, bw, 170, 42); g.fill();
      g.save(); g.translate(bx + bw / 2 + 120 * pk, btop - 4 - 26 * pk); g.rotate(.7 * pk); rr(g, -50, -30, 100, 60, 26); g.fill(); g.restore();
      g.save(); g.translate(lerp(bx + bw / 2, wx0 + 46, pk), lerp(btop - 20, wy0 + 46, pk)); g.rotate(2.4 * pk); el(g, 0, 0, 30, 30); for (var q = 0; q < 8; q++) { g.save(); g.rotate(q * .785); g.fillRect(-7, -40, 14, 14); g.restore(); } g.restore();
      if (op > 0) { g.fillRect(bx + 14, btop - 110 * eio(op), bw - 28, 110 * eio(op)); }   /* the slip, pulled out of the open top */
      g.restore();
    }
    g.strokeStyle = '#4b3a2c'; g.lineWidth = 8; g.beginPath(); g.moveTo((wx0 + wx1) / 2, wy0); g.lineTo((wx0 + wx1) / 2, wy1); g.stroke();
    /* the door: the same coral seal as the real shops, a mail slot at the tube's height; the shutter drops on K.SH */
    var dx0 = x0 + 360, dx1 = x1 - 34, dy0 = y0 + 236, dy1 = y1;
    g.fillStyle = '#5a4a3a'; g.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
    g.fillStyle = '#4a3c2f'; g.fillRect(dx0 + 20, dy0 + 20, dx1 - dx0 - 40, dy1 - dy0 - 40);
    g.fillStyle = '#1c1612'; g.fillRect(dx0 + 40, SLOT - 26, dx1 - dx0 - 80, 52);
    /* the door's seal swings on its hook in the "honest" beat, still whole */
    var swing = .35 * Math.sin(Math.PI * 2 * seg(t, K.honest - .1, K.honest + 1.4)) * (1 - seg(t, K.honest + 1.2, K.honest + 1.6)) + .05 * Math.sin(t * 2.1);
    g.save(); g.translate((dx0 + dx1) / 2, dy0 + 30); g.rotate(swing);
    g.strokeStyle = '#2b2219'; g.lineWidth = 4; g.beginPath(); g.moveTo(-30, 0); g.lineTo(0, 50); g.lineTo(30, 0); g.stroke();
    waxSeal(g, 0, 96, 54, 1);
    g.restore();
    /* the open capsule shows inside once the shutter lifts again ("honest") */
    var lift = eout(seg(t, K.honest + .05, K.honest + .5));
    if (lift > 0) quiet(function () { g.save(); g.beginPath(); g.rect(dx0 + 20, dy0 + 160, dx1 - dx0 - 40, 260); g.clip(); capsule(g, (dx0 + dx1) / 2 - 10, dy0 + 330, .82, 1, 1, 1, .08); g.restore(); }, true);
    var drop = eout(seg(t, K.SH - .18, K.SH)), up = lift * .55;
    var shut = drop * (1 - up);
    if (shut > 0) {
      var sy1 = lerp(dy0, dy1, shut);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(dx0, sy1, dx1 - dx0, 10);
      g.fillStyle = '#8a8f95'; g.fillRect(dx0 - 8, dy0, dx1 - dx0 + 16, sy1 - dy0);
      g.fillStyle = '#727880'; for (var yy = sy1 - 26; yy > dy0; yy -= 26) g.fillRect(dx0 - 8, yy, dx1 - dx0 + 16, 6);
      g.fillStyle = '#5c6168'; g.fillRect(dx0 - 8, sy1 - 14, dx1 - dx0 + 16, 14);
    }
    onprop(function () { tag(g, 'FICTIONAL BANK', x0 + w / 2, y0 + 46, 1, -.02, 300, CREAM, '#2a1a1c', 36); });
  }
  var SLOT = 1236;
  function shopScene(g, t) {
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { paperBg(g, t, TD); return; }
    var E0 = S('shop').t0, ex = EXITING; if (t < E0 + .05) EXITING = true;
    /* the camera: the shop opens at 0.8 (wide, the tube running in from off-frame) and pushes to 1.0 over "sealed" →
       "honest" (a 1.25× push), anchored at the storefront's bottom-right so it never leaves the safe box; at 1.0 the
       frame is the layout the label checks were built on. A slow drift before and after keeps the stage moving */
    var z = .78 + .02 * sio(seg(t, E0 - .34, K.sealed - .1)) + .355 * sio(seg(t, K.sealed - .1, K.sealed + .9)) - .01 * sio(seg(t, K.sealed + .9, K.name));
    var AX = 908, AY = 1424;
    g.save(); g.translate(AX, AY); g.scale(z, z); g.translate(-AX, -AY);
    /* the kraft tube from beyond the left edge to the door's slot (drawn from the safe edge, x 92 on screen) */
    var TL = AX - (AX - 96) / z;
    g.fillStyle = '#1b0f11'; g.fillRect(TL, SLOT - 40, BIG.x0 + 400 - TL, 80);
    bigShop(g, t);
    g.fillStyle = KRAFT; g.fillRect(TL, SLOT - 48, BIG.x0 + 360 - TL, 10); g.fillRect(TL, SLOT + 38, BIG.x0 + 360 - TL, 10);
    g.fillStyle = KRAFT2; for (var kx = BIG.x0 + 320; kx > TL + 10; kx -= 96) { g.fillRect(kx, SLOT - 52, 14, 18); g.fillRect(kx, SLOT + 34, 14, 18); }
    prop(g, 'tube', TL, SLOT - 48, BIG.x0 + 360, SLOT + 48);
    /* the sealed capsule's run (the native move, 330-unit body: ≥ 460 px on screen at z 0.8): out of the tube's mouth on
       "arrives", into the slot by "sealed." */
    var u = sio(seg(t, K.sealed - .2, K.sealedW + .15));
    if (u > 0 && u < 1) {
      var cx = lerp(TL - 320, BIG.x0 + 590, u);
      quiet(function () {
        g.save(); g.beginPath(); g.rect(TL, 0, BIG.x0 + 400 - TL, H); g.clip();
        capsule(g, cx, SLOT, 1.75, 1, 1, 0, .015 * Math.sin(t * 9), 330);
        g.restore();
      }, true);
    }
    g.restore();
    EXITING = ex;
    /* top: the FTC's fake-site line on "fake"; then the scope; then the trip quote on "scammer" */
    var fin = seg(t, K.fake - .02, K.fake + .1), fout = seg(t, K.scammer - .3, K.scammer - .05);
    if (fin > 0 && fout < 1) qplate(g, 104, 446, 812, FTC.fake, 62, FTC.credit, 5401, fin, fout);
    var sa = seg(tq(t), K.sealed - .04, K.sealed + .04), so = eio(seg(t, K.check - .5, K.check - .3));
    var nud = 1 + .06 * Math.sin(Math.PI * seg(t, K.scammer - .02, K.scammer + .22));
    if (sa > 0 && so < 1) quiet(function () { g.save(); peelT(g, 140, 794, so); chip(g, FTC.scope, 510, 794, { px: 48, wt: 900, st: 'condensed', bg: CREAM, fg: INK, a: sa, shadow: true, r: 14, maxw: 820, s: nud }); g.restore(); }, so > 0 || nud > 1);
    var tin = seg(t, K.scammer - .02, K.scammer + .1), tout = seg(t, K.check - .5, K.check - .3);
    if (tin > 0 && tout < 1) qplate(g, 104, 440, 812, FTC.trip, 42, FTC.credit, 5402, tin, tout);
  }

  /* =====================================================================================================
     SCENE 3: THE TEST ("name," → end). Two re-created address bars, made-up .example names; the real one first, the fake
     slides in under it on "fakes"; on the pause they swing apart into LEFT (real) / RIGHT (fake) cards
     ===================================================================================================== */
  function tuneIcon(g, x, y, col) {   /* a generic two-slider icon: not a padlock */
    g.strokeStyle = col; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - 20, y - 10); g.lineTo(x + 20, y - 10); g.moveTo(x - 20, y + 12); g.lineTo(x + 20, y + 12); g.stroke();
    g.fillStyle = col; el(g, x - 8, y - 10, 7, 7); el(g, x + 9, y + 12, 7, 7);
  }
  /* a bar/card for one address: k = 0 a wide bar (two rows: https:// and the tiles), k = 1 a card (host on two lines) */
  function addrBar(g, host, cx, cy, k, t, flip0, flip1, name) {
    var w = lerp(820, 400, k), h = lerp(196, 330, k), x0 = cx - w / 2, y0 = cy - h / 2;
    g.fillStyle = 'rgba(0,0,0,.38)'; rr(g, x0 + 8, y0 + 11, w, h, 28); g.fill();
    g.fillStyle = '#fbf8f2'; rr(g, x0, y0, w, h, 28); g.fill();
    g.strokeStyle = 'rgba(33,29,38,.35)'; g.lineWidth = 3; rr(g, x0, y0, w, h, 28); g.stroke();
    prop(g, name, x0, y0, x0 + w, y0 + h);
    tuneIcon(g, x0 + 54, y0 + 50, '#5d564c');
    onprop(function () { txt(g, 'https://', x0 + 92, y0 + 50, 40, '#5d564c', 'left', 700, MONO, 0, 1, 36); });
    /* the host as letter tiles; a tile flips (scaleY 1 → 0 → 1) as the read passes it, letter by letter */
    var H1 = host.split('.')[0], H2 = '.' + host.split('.')[1];
    function tiles(str, i0, x, y, px, tw2) {
      for (var i = 0; i < str.length; i++) {
        var gi = i0 + i, n = host.length, f0 = flip0 == null ? -1 : lerp(flip0, flip1, gi / n), fk = flip0 == null ? 0 : seg(t, f0, f0 + .16), fs = Math.abs(Math.cos(Math.PI * fk));
        var tx = x + i * tw2 + tw2 / 2;
        g.save(); g.translate(tx, y); g.scale(1, Math.max(.06, fs));
        g.fillStyle = fk > 0 && fk < 1 ? '#efe3c6' : '#f1ebdf'; rr(g, -tw2 / 2 + 3, -px * .62, tw2 - 6, px * 1.24, 8); g.fill();
        var nr = NOREC; NOREC = true; onprop(function () { txt(g, str[i], 0, 2, px, INK, 'center', 700, MONO, 0, 1, 36); }); NOREC = nr;
        g.restore();
      }
    }
    if (k < .5) {
      var tw1 = 44, px = 62; tiles(host, 0, x0 + 34, y0 + 132, px, tw1);
    } else {
      /* the card: the name at 66 px mono (the one different letter is the whole test), .example at 36 px under it */
      var tw3 = 40, px2 = 66, tw4 = 24, px4 = 36;
      tiles(H1, 0, cx - H1.length * tw3 / 2, y0 + 160, px2, tw3);
      tiles(H2, H1.length, cx - H2.length * tw4 / 2, y0 + 256, px4, tw4);
    }
    /* the readable host, for readcheck and the label checks (the tiles draw it letter by letter) */
    if (REC || LBL) { var ga = g.globalAlpha; g.globalAlpha = 0; onprop(function () { if (k < .5) { font(g, 62, 700, MONO); g.fillText(host, -9999, -9999); } }); g.globalAlpha = ga; }
  }
  function testScene(g, t) {
    if (LAYER === 'over') return;
    if (LAYER === 'bg') { paperBg(g, t, TC); return; }
    var E0 = S('test').t0, ex = EXITING; if (t < E0 + .05) EXITING = true;
    /* the split: the top bar (the fake) swings right, the bottom bar (the real) swings left; they cross on the way */
    var sk = eio(seg(t, K.AP - .02, K.AP + .55));
    var b1 = { x: lerp(510, 300, sk), y: lerp(900, 1010, sk) }, b2 = { x: lerp(510, 720, sk), y: lerp(1146, 1010, sk) };
    var in2 = eout(seg(t, K.fakesA - .1, K.fakesA + .3));
    var sway = 6 * Math.sin(t * 1.6);
    g.save(); g.translate(sway, 0);
    var mv = sk > 0 && sk < 1;
    if (in2 > 0) quiet(function () { g.save(); g.translate(-900 * (1 - in2), 0); addrBar(g, FAKE, b2.x, b2.y, sk, t, K.letters - .3, K.letters + .5, 'bar 2'); g.restore(); }, in2 < 1 || mv);
    quiet(function () { addrBar(g, REAL, b1.x, b1.y + 40 * (1 - eout(seg(t, E0 - .2, E0 + .3))), sk, t, K.letter1 - .05, K.letter2 + .35, 'bar 1'); }, mv || t < E0 + .3);
    g.restore();
    /* tags: RE-CREATED and MADE-UP ADDRESSES (36 px) under the bars */
    var ty = lerp(1300, 1212, sk);
    var tga = seg(t, K.name + .3, K.name + .42);
    /* one MADE-UP ADDRESSES tag centred under both cards (the pair centred on x 510), RE-CREATED beside it */
    if (tga > 0) quiet(function () {
      font(g, 36, 700, MONO); var wa = g.measureText('MADE-UP ADDRESSES').width + 40, wb = g.measureText('RE-CREATED').width + 40, gp = 22, x0 = 510 - (wa + gp + wb) / 2;
      tag(g, 'MADE-UP ADDRESSES', x0 + wa / 2, ty, tga, 0, 460, CREAM, null, 36); tag(g, 'RE-CREATED', x0 + wa + gp + wb / 2, ty, tga, 0, 300, CREAM, null, 36);
    }, mv || tga < 1);
    /* LEFT / RIGHT (112 px) from "Which": labels, not answers; neither card is highlighted */
    var lk = eout(seg(t, K.end - .1, K.end + .1));
    if (lk > 0) [['LEFT', 300, K.left], ['RIGHT', 720, K.rightE]].forEach(function (c) {
      var tp = Math.sin(Math.PI * seg(t, c[2] - .03, c[2] + .2));
      var sl = sio(seg(t, K.SL - .3, K.SL - .08)) * (1 - eio(seg(t, K.SL - .08, K.SL))), sq = -.05 * Math.sin(Math.PI * seg(t, K.SL, K.SL + .14));
      quiet(function () { chip(g, c[0], c[1], 1336 + 6 * Math.sin(t * 4 + c[1]), { px: 96, wt: 900, bg: BG, line: CREAM, lw: 7, fg: CREAM, w: 300, h: 140, r: 44, a: lk, s: lerp(1.15, 1, lk) * (1 + .06 * tp + .12 * sl + sq), maxw: 300, st: 'condensed' }); }, lk < 1);
    });
    EXITING = ex;
    /* top: Chrome Help on "name"; Apple's guide on "letters" */
    var cin = seg(t, K.name - .3, K.name - .18), cout = seg(t, K.fakesA - .12, K.fakesA + .1);   /* in with the test wipe */
    if (cin > 0 && cout < 1) qplate(g, 104, 446, 812, MAKERS.chrome, 62, MAKERS.chromeCredit, 5501, cin, cout);
    var ain = seg(t, K.fakesA + .1, K.fakesA + .22), aout = seg(t, K.SL + .05, K.SL + .25);   /* off after the slam: the clean LEFT/RIGHT card holds ~0.85 s before the tear */
    if (ain > 0 && aout < 1) qplate(g, 104, 446, 812, MAKERS.apple, 60, MAKERS.appleCredit, 5502, ain, aout);
  }

  /* =====================================================================================================
     THE END CARD: frame 0 again (the terminal, the gliding phone with the Wi-Fi list, SAFE?)
     ===================================================================================================== */
  function endScene(g, t) {
    if (LAYER === 'over') return;
    var ct = t - TEND;
    if (LAYER === 'bg') { paperBg(g, ct, TA); terminalBg(g, ct); return; }
    var p = f0(ct);
    wifiRings(g, p.x - 290, p.y, ct, 1); seats(g, 1); peekScope(g, ct); departures(g, ct);
    quiet(function () { phone(g, p.x, p.y, PW, PH, p.rot, { name: 'phone', draw: function (g2, S2) { wifiScreen(g2, S2, ct, -1); } }); }, true);
    scopeLine(g, ct, p, 1);
    title0(g);
  }

  /* ---------- captions ---------- */
  var CAPGROUPS = { hook: [[2, 4]], ask: [[3], [5]], then: [[5]], snoop: [[3, 3]], now: [[2], [3], [3]], hero: [[4], [4]], dip: [[3, 4]], sealed: [[4], [4]], honest: [[3, 3]], check: [[4], [4]], apple: [[3, 3], [3]], end: [[4], [3]] };
  var CAPS = [];
  VO.lines.forEach(function (l) {
    var G = CAPGROUPS[l.id]; if (!G) return; var i = 0;
    G.forEach(function (card0) { var n = card0.reduce(function (a, b) { return a + b; }, 0), ws = l.words.slice(i, i + n); i += n; CAPS.push({ t0: ws[0].t0, t1: ws[ws.length - 1].t1, words: ws, split: card0 }); });
    if (i !== l.words.length) throw new Error('caption groups for ' + l.id + ' cover ' + i + ' of ' + l.words.length + ' words');
  });
  var STRESS = [['hook', 'usually'], ['ask', 'safe?'], ['then', 'wasn\'t.'], ['snoop', 'scramble'], ['now', 'encryption.'], ['hero', 'usually'], ['dip', 'fake'], ['sealed', 'scammer.'], ['honest', 'honest.'], ['check', 'name,'], ['apple', 'letters.'], ['end', 'fake?']]
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
  var NOISE, SCENES = { netScene: netScene, shopScene: shopScene, testScene: testScene, endScene: endScene };
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
    g.fillStyle = SLATE; edge(4, 0); g.fill();
    edge(4, 0); g.save(); g.clip(); grainIn(g, x0, 0, w, H, 4402, 1.3);
    g.fillStyle = SLATE2; g.fillRect(x0 + 44, 0, 8, H); g.fillRect(x0 + w - 52, 0, 8, H); g.restore();
  }
  /* SEALED ≠ HONEST: an overlay that outlives the shop's wipe; the words print on "honest", the ≠ slams in the pause
     (K.NE); it peels on "name" */
  /* SEALED ≠ HONEST prints whole (the ≠ at full opacity from its first frame) on "can't"; the slap (K.NE) is a pulse on the ≠
     only; it holds the 2.3 s readcheck asks and peels before the test wipe (t0 = "name,") reaches the middle of the frame */
  var HON0 = function () { return K.cant - .04; }, HONOUT = function () { return K.cant + 2.34; };
  function honestPlate(g, t) {
    var ha = seg(tq(t), HON0(), HON0() + .06), ho = eio(seg(t, HONOUT(), HONOUT() + .12));
    if (ha <= 0 || ho >= 1) return;
    quiet(function () {
      g.save(); peelT(g, 140, 1400, ho);
      var y = 1352, pop = 1 + .1 * (1 - eout(seg(t, HON0(), HON0() + .14)));
      g.translate(512, y); g.scale(pop, pop); g.translate(-512, -y);
      g.globalAlpha *= ha;
      g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, 120, y - 62, 800, 128, 22); g.fill();
      g.fillStyle = INK; rr(g, 112, y - 70, 800, 128, 22); g.fill(); g.strokeStyle = CREAM; g.lineWidth = 3; rr(g, 112, y - 70, 800, 128, 22); g.stroke();
      prop(g, 'type plate', 112, y - 70, 912, y + 58);
      onprop(function () {
        txt(g, 'SEALED', 300, y - 4, 84, CREAM, 'center', 900, DISP, 340, 1, 60, 'condensed');
        txt(g, 'HONEST', 724, y - 4, 84, CREAM, 'center', 900, DISP, 340, 1, 60, 'condensed');
        var nk = Math.sin(Math.PI * seg(t, K.NE - .02, K.NE + .16)), nr = NOREC; NOREC = true;
        g.save(); g.translate(512, y - 6); g.scale(1 + .22 * nk, 1 + .22 * nk); txt(g, '≠', 0, 0, 110, HL, 'center', 900, DISP, 0, 1, 60, 'condensed'); g.restore(); NOREC = nr;
      });
      g.restore();
    }, ho > 0 || ha < 1);
  }
  function frame(g, t) {
    CURT = t;
    g.setTransform(1, 0, 0, 1, 0, 0);
    var te = EDGE_T == null ? t : EDGE_T;
    var si = sceneAt(te), Sc = SC[si], Nx = SC[si + 1];
    STG = Sc.id === 'net' ? netTone(te)[2] : Sc.id === 'shop' ? TD[2] : Sc.id === 'test' ? TC[2] : TA[2];
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
    g.save(); safeClip(g); honestPlate(g, t); g.restore();
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) captions(g, t, 1);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor((t > TEND - 1 / 30 ? t - TEND + 1 / 30 : t) * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }
  var POSTERMODE = false, EDGE_T = null;
  var POSTERPX = [];
  /* the poster carries the scope: the FTC's "usually", its date, and the twist in one line */
  function posterTitle(g) {
    g.save(); g.textBaseline = 'alphabetic'; g.textAlign = 'center';
    function fit(str, px, wst, maxw) { font(g, px, 800, DISP, wst); while (g.measureText(str).width > maxw && px > 34) { px -= 1; font(g, px, 800, DISP, wst); } return px; }
    var a = 'Public Wi-Fi is usually safe now.', ap = fit(a, 60, 'semi-expanded', 800);
    g.fillStyle = CREAM; g.fillText(a, CX, 352);
    var b = 'But fake sites are encrypted too.', bp = fit(b, 56, 'condensed', 780);
    font(g, bp, 800, DISP, 'condensed'); var wb = g.measureText(b).width;
    g.fillStyle = CREAM; g.beginPath(); g.roundRect(CX - wb / 2 - 14, 420 - bp * .9, wb + 28, bp * 1.2, 14); g.fill();
    g.fillStyle = BG; g.fillText(b, CX, 420);
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
  var GAIN = { sb: .012, pp: .025, tw: .0037, sh: .0075, ne: .016, ap: .009, sl: .024 };   /* all six level with each other; duck.smr_db 27.4 sets them ≈ −18.8 dB RMS in the mix */   /* relative only: render.mjs peak-normalizes the stem; voiceover.py sets the voice from duck.smr_db against the room bed */
  var TYPE = { sb: 'tick', pp: 'click', tw: 'thump', sh: 'knock', ne: 'slap', ap: 'click', sl: 'click' };
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
      if (e.id === 'sl') osc('triangle', 210, e.t, e.t + .06, 1, [[e.t, 0], [e.t + .003, .55 * e.g], [e.t + .055, 0]], .03);   /* the slam's low body, inside its 0.06 s */
      if (e.id === 'pp') osc('sine', 640, e.t, e.t + .055, 1, [[e.t, 0], [e.t + .002, .4 * e.g], [e.t + .05, 0]], .02);   /* the seal's snap */
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
  var HOLD = { t0: K.usuallyH, t1: K.dip };
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  window.FILM = { POSTERPX: function () { return POSTERPX; }, bare: function () { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); }, W: W, H: H, DUR: DUR, TEND: TEND, POSTER: Math.round((K.TW + .3) * 30) / 30 + 1 / 60, SLUG: 'publicwifi', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE, K: K, GT: GT, HOLD: HOLD, SC: SC, CAPMIN: function () { return CAPMIN; } };
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
