/* "Hallucinate" — why AI makes things up. Factory #3 on Tech, explained, after ../nextword/ and ../strawberry/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t. Contract: window.FILM,
   DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). The native move is the blank that always fills: an answer slot with
   a caret in it, and something always drops in. Built from flat paper things (a court filing, rubber stamps, index cards,
   a phone, an answer sheet, a paper chart): the channel must not look AI-made. Facts: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur;
  var BG = '#15131b', PANEL = '#221f2b', PANEL2 = '#2c2838', CREAM = '#f4ede0', DIM = 'rgba(244,237,224,.42)', FAINT = 'rgba(244,237,224,.14)';
  var HOT = '#ff5b3d', YEL = '#ffc83d', MINT = '#3fd6a2', SKY = '#53b6ff', BAD = '#ff4a5e';
  var PAPER = '#f1e9d8', PAPER2 = '#e8dfcb', INK = '#211d26', INKD = 'rgba(33,29,38,.6)', BLUEINK = '#3450c4', REDINK = '#d8332b', STICKY = '#f6d54a', PADY = '#f7e7a1';
  var DISP = 'Archivo', MONO = '"Geist Mono"', SERIF = '"Instrument Serif"', ITAL = 'italic 400', ITF = SERIF;

  /* ---------- math ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function eo(k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); }
  function eio(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function ss(k) { return k * k * (3 - 2 * k); }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function spring(dt, f, z) {
    if (dt <= 0) return 0;
    var w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + z * w / wd * Math.sin(wd * dt));
  }
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .85); }
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .85), 0, 1.04); }
  function win(t, a, b, o) { return t < a || t > b + (o || .3) ? 0 : clamp(sp(t, a), 0, 1.04) * (1 - eio(seg(t, b, b + (o || .3)))); }
  /* a decaying wobble that starts at a (a slap settling): pure function of t */
  function knock(t, a, f, d) { if (t < a) return 0; var u = t - a; return Math.exp(-u * (d || 7)) * Math.sin(u * (f || 22)); }
  function strHash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function at(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function wend(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word].t1;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t1;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }

  var SC = [
    { id: 'hook', name: 'The fake case', t0: 0 },
    { id: 'story', name: 'Six cases', t0: start('story') - .3 },
    { id: 'chat', name: 'Is it real?', t0: start('asked') - .3 },
    { id: 'judge', name: 'Gibberish', t0: at('gibberish', 'gibberish') - .4 },
    { id: 'turn', name: 'Guessing', t0: start('turn') - .3 },
    { id: 'guess', name: 'The guesser', t0: start('guess') - .3 },
    { id: 'button', name: 'No I-don\'t-know', t0: start('button') - .3 },
    { id: 'test', name: 'The test', t0: start('test') - .3 },
    { id: 'chart', name: 'Skip or guess', t0: start('tested') - .3 },
    { id: 'since', name: '2,000 cases', t0: start('since') - .3 },
    { id: 'end', name: 'Always a next word', t0: start('end') - .35 }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = end('end') + .25;

  /* global stamps (outlive their scene; y ~1280): [text, t0, t1, px, col, rot, x, y] */
  var STAMPS = [];

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); }
  function serif(g, px) { g.font = 'italic 400 ' + px + 'px ' + SERIF; }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    if (o.ital) serif(g, px); else font(g, px, o.wt, o.fam);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad, w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; if (o.dash) g.setLineDash(o.dash); g.stroke(); g.setLineDash([]); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore();
    return w;
  }
  function textW(g, text, px, wt, fam) { font(g, px, wt, fam); return g.measureText(text).width; }
  function label(g, text, x, y, a, col, px, align) {
    px = Math.max(30, px || 32);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillStyle = col || DIM; try { g.letterSpacing = '4px'; } catch (e) {}
    g.fillText(text, x, y + (1 - Math.min(1, a)) * 14); g.restore();
  }
  /* plain text on paper (no letterspacing), left-aligned unless told */
  function txt(g, s, x, y, px, col, fam, align, wt) {
    if (fam === 'serif') serif(g, px); else font(g, px, wt || (fam === MONO ? 500 : 700), fam || DISP);
    g.textAlign = align || 'left'; g.textBaseline = 'middle'; g.fillStyle = col || INK; g.fillText(s, x, y);
    return g.measureText(s).width;
  }
  function caret(g, x, y, h, t, busy, col, a) {
    var on = busy ? 1 : (Math.cos(t * Math.PI * 2 * 1.05) > -.2 ? 1 : .15);
    g.save(); g.globalAlpha *= (a == null ? 1 : a) * on; g.fillStyle = col || HOT; rr(g, x - h * .045, y - h / 2, h * .09, h, h * .045); g.fill(); g.restore();
  }
  function dots(g, x, y, t, a, col) {
    for (var i = 0; i < 3; i++) { var b = .5 + .5 * Math.sin(t * 7 - i * .9); g.save(); g.globalAlpha *= a * (.35 + .65 * b); g.beginPath(); g.arc(x + i * 30, y - 6 * b, 10, 0, 6.283); g.fillStyle = col || CREAM; g.fill(); g.restore(); }
  }
  function tick(g, x, y, s, col, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.strokeStyle = col || MINT; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-20, 0); g.lineTo(-6, 15); g.lineTo(22, -16); g.stroke(); g.restore();
  }
  function arrow(g, x0, y0, x1, y1, k, col, lw) {
    if (k <= 0) return;
    var x = lerp(x0, x1, k), y = lerp(y0, y1, k), a = Math.atan2(y1 - y0, x1 - x0);
    g.save(); g.strokeStyle = g.fillStyle = col; g.lineWidth = lw || 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x - Math.cos(a) * 16, y - Math.sin(a) * 16); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a - .45) * 34, y - Math.sin(a - .45) * 34); g.lineTo(x - Math.cos(a + .45) * 34, y - Math.sin(a + .45) * 34); g.closePath(); g.fill();
    g.restore();
  }
  /* a sheet of paper centred at (x, y): flat drop shadow, the sheet, then fn draws on it with the origin at its centre */
  function sheet(g, x, y, w, h, rot, a, fn, col, s) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0); if (s) g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(-w / 2 + 12, -h / 2 + 18, w, h);
    g.fillStyle = col || PAPER; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(-w / 2, h / 2 - 6, w, 6);
    if (fn) fn(g, w, h);
    g.restore();
  }
  /* wrap text into lines no wider than maxW (font already set) */
  function wrap(g, s, maxW) {
    var words = s.split(' '), lines = [], cur = '';
    words.forEach(function (w) { var tryS = cur ? cur + ' ' + w : w; if (g.measureText(tryS).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryS; });
    if (cur) lines.push(cur); return lines;
  }
  /* fit a font size so the text is at most maxW wide (never under the 30 px floor) */
  function fitPx(g, s, px, maxW, setFont) { setFont(px); var w = g.measureText(s).width; if (w <= maxW) return px; var p = Math.max(30, Math.floor(px * maxW / w)); setFont(p); return p; }

  /* ---------- rubber stamps: drawn once into a canvas with worn ink (seeded speckle), then slammed ---------- */
  var STEX = {};
  function stampTex(lines, col, px) {
    var key = lines.join('|') + col + px; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900);
    var sub = lines.length > 1 ? .5 : 1, lw = 0;
    lines.forEach(function (s, i) { font(m, i ? Math.round(px * sub) : px, 900); try { m.letterSpacing = '2px'; } catch (e) {} lw = Math.max(lw, m.measureText(s).width); });
    var pad = px * .45, h = px * 1.25 + (lines.length - 1) * px * .62, w = lw + pad * 2, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(4, px * .085); rr(g, 2, 2, w - 4, h - 4, px * .14); g.stroke();
    g.lineWidth = Math.max(2, px * .03); rr(g, px * .14, px * .14, w - px * .28, h - px * .28, px * .08); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach(function (s, i) { font(g, i ? Math.round(px * sub) : px, 900); try { g.letterSpacing = '2px'; } catch (e) {} g.fillText(s, w / 2, i ? px * .66 + px * 1.25 / 2 + (i - 1) * px * .62 + px * .1 : px * 1.25 / 2 + px * .05); });
    /* worn rubber: speckled gaps and a lighter corner */
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 140);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .35 + r() * .65; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.9, 0, 6.283); g.fill(); }
    var lg = g.createLinearGradient(0, 0, w, h); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(.75, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,.45)');
    g.globalAlpha = 1; g.fillStyle = lg; g.fillRect(-8, -8, w + 16, h + 16);
    c.w = w + 16; c.h = h + 16; STEX[key] = c; return c;
  }
  function slam(g, lines, col, px, x, y, t, t0, rot, a, t1) {
    if (t < t0) return 0;
    var k = sp(t, t0, 3.2, .8), s = lerp(1.7, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (a == null ? 1 : a) * (t1 ? 1 - seg(t, t1, t1 + .3) : 1);
    if (al <= 0) return 0;
    var c = stampTex(lines, col, px);
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot || 0); g.scale(s, s); g.drawImage(c, -c.w / 2, -c.h / 2); g.restore();
    return k;
  }
  function stamp(g, text, x, y, t, t0, t1, px, col, rot) {
    if (t < t0 || t > t1 + .3) return;
    var c = stampTex([text], col, px);
    /* a paper backing so a stamp on the dark stage reads as ink on a label */
    var k = sp(t, t0, 3.2, .8), s = lerp(1.7, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (1 - seg(t, t1, t1 + .3));
    g.save(); g.globalAlpha = al; g.translate(x, y); g.rotate(rot == null ? -.1 : rot); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-c.w / 2 - 4, -c.h / 2 + 10, c.w + 8, c.h);
    g.fillStyle = PAPER; g.fillRect(-c.w / 2 - 14, -c.h / 2 - 4, c.w + 8, c.h + 8);
    g.drawImage(c, -c.w / 2 - 10, -c.h / 2); g.restore();
  }

  /* ---------- the native move: the blank that always fills ---------- */
  function slot(g, x, y, w, h, t, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    rr(g, x - w / 2, y - h / 2, w, h, 18); if (o.fill) { g.fillStyle = o.fill; g.fill(); }
    g.setLineDash([16, 12]); g.lineDashOffset = -t * 20; g.strokeStyle = o.col || 'rgba(244,237,224,.7)'; g.lineWidth = 4; g.stroke(); g.setLineDash([]);
    g.restore();
    if (o.caretX != null) caret(g, o.caretX, y, h * .62, t, o.busy, o.caretCol || HOT, a);
  }

  /* a counter: whole numbers with a thousands comma */
  function counter(g, v, x, y, px, col, prefix) {
    font(g, px, 900); g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = col || CREAM;
    g.fillText((prefix || '') + Math.floor(v).toLocaleString('en-US'), x, y); g.restore();
  }

  /* ---------- background: faint citation fragments drifting, plain type ---------- */
  var DRIFT = (function () {
    var r = mulberry(9), words = ['F.3d', '11th Cir.', 'Id.', '§', 'v.', 'F. Supp. 2d', 'WL', '925', '1339', 'S.D.N.Y.', 'cert. denied', '(2019)', 'at 1342', 'supra', 'Co., Ltd.', 'aff\'d', 'App.', '¶'], out = [];
    for (var i = 0; i < 24; i++) out.push({ w: words[i % words.length], x: 60 + r() * (W - 120), y: r() * H, v: 12 + r() * 22, px: 30 + r() * 30, ital: r() < .4 });
    return out;
  })();
  function drift(g, t, a) {
    if (a <= 0) return;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
    DRIFT.forEach(function (d) {
      var y = ((d.y - t * d.v) % (H + 200) + H + 200) % (H + 200) - 100;
      var band = y > 150 && y < 600 ? 1 - seg(t, 1.6, 2.4) : 0;   // keep the hook headline band clean (t < 0 is the loop layer)
      if (band >= 1) return;
      g.globalAlpha = .055 * a * (1 - band); if (d.ital) serif(g, d.px * 1.2); else font(g, d.px, 500, MONO);
      g.fillText(d.w, d.x, y);
    });
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · hook: the filing cites a case; it doesn't exist; ChatGPT made it up; it's called an AI hallucination
     ===================================================================================================== */
  var DOCX = 540, DOCY = 1010, DOCW = 880, DOCH = 680;
  var NAME1 = 'Varghese v. China Southern', NAME2 = 'Airlines Co., Ltd.,', CITE = '925 F.3d 1339 (11th Cir. 2019)';
  /* the court page; o.name = how many chars of the case name show (null = all), o.slot = dashed slot alpha, o.caret */
  function docPage(g, t, o) {
    o = o || {};
    var sway = .004 * Math.sin(t * .7) + (o.rot || 0);
    sheet(g, DOCX + (o.dx || 0), DOCY + (o.dy || 0), DOCW, DOCH, -.015 + sway, o.a == null ? 1 : o.a, function (g) {
      var L = -380, hd = o.head == null ? 1 : o.head;
      g.save(); g.globalAlpha *= hd;
      font(g, 30, 500, MONO); try { g.letterSpacing = '3px'; } catch (e) {}
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK;
      g.fillText('UNITED STATES DISTRICT COURT', 0, -285); g.fillText('SOUTHERN DISTRICT OF NEW YORK', 0, -245);
      try { g.letterSpacing = '0px'; } catch (e) {}
      if (o.fed > 0) { g.save(); g.globalAlpha *= clamp(o.fed, 0, 1); g.fillStyle = HOT; g.fillRect(-300, -228, 600 * clamp(o.fed, 0, 1), 6); g.restore(); }
      g.fillStyle = 'rgba(33,29,38,.35)'; g.fillRect(L, -212, 760, 3);
      txt(g, 'Mata v. Avianca, Inc.', L, -165, 46, INK, 'serif');
      txt(g, 'No. 22-cv-1461', 380, -163, 30, INKD, MONO, 'right');
      font(g, 30, 500, MONO); try { g.letterSpacing = '3px'; } catch (e) {} g.fillStyle = INK; g.textAlign = 'left'; g.fillText('AFFIRMATION IN OPPOSITION', L, -108); try { g.letterSpacing = '0px'; } catch (e) {}
      txt(g, 'citing:', L, -48, 32, INKD, MONO);
      g.restore();
      /* the cited case: highlighter behind the name, then the name (the slot) */
      var full = NAME1 + ' ' + NAME2, n = o.name == null ? full.length : Math.max(0, Math.min(full.length, Math.floor(o.name)));
      var s1 = full.slice(0, Math.min(n, NAME1.length)), s2 = n > NAME1.length + 1 ? full.slice(NAME1.length + 1, n) : '';
      serif(g, 72);
      var w1 = g.measureText(NAME1).width, w2 = g.measureText(NAME2).width;
      var hl = o.hl == null ? 1 : o.hl;
      if (hl > 0) {
        g.save(); g.globalAlpha *= hl; g.fillStyle = 'rgba(255,214,61,.62)';
        g.fillRect(L - 8, 22 - 34, (w1 + 16) * Math.min(1, n / NAME1.length), 62);
        if (n > NAME1.length) g.fillRect(L - 8, 100 - 34, (w2 + 16) * Math.min(1, (n - NAME1.length) / NAME2.length), 62);
        g.restore();
      }
      if (o.slot > 0) slot(g, 0, 60, 800, 196, t, { a: o.slot, col: 'rgba(33,29,38,.55)' });
      serif(g, 72); g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(s1, L, 18); if (s2) g.fillText(s2, L, 96);
      if (o.caret) {
        var cx = n <= NAME1.length ? L + g.measureText(s1).width + 10 : L + g.measureText(s2).width + 10, cyy = n <= NAME1.length ? 22 : 100;
        caret(g, cx, cyy, 72, t, o.busy, HOT);
      }
      var ca = o.cite == null ? 1 : o.cite;
      if (ca > 0) { g.save(); g.globalAlpha *= ca; txt(g, CITE, L, 166, 38, INK, MONO); g.restore(); }
      g.save(); g.globalAlpha *= hd; g.fillStyle = 'rgba(33,29,38,.35)'; g.fillRect(L, 214, 760, 3); g.restore();
      if (o.inner) o.inner(g);
    });
  }
  function headline(g, t, a, lit, kk) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, 74, 800); try { g.fontStretch = 'expanded'; } catch (e) {}
    g.textBaseline = 'middle'; g.textAlign = 'left';
    var a1 = 'AI ', b1 = 'HALLUCINATION', wa = g.measureText(a1).width, wb = g.measureText(b1).width, x = 540 - (wa + wb) / 2, y = 538;
    g.fillStyle = CREAM; g.fillText(a1, x, y);
    var s = 1 + .05 * (kk || 0);
    g.save(); g.translate(x + wa + wb / 2, y); g.scale(s, s);
    if (lit > 0) { g.globalAlpha *= 1; g.fillStyle = HOT; rr(g, -wb / 2 - 12, -46, (wb + 24) * clamp(lit, 0, 1), 92, 14); g.fill(); }
    g.fillStyle = lit > .6 ? BG : CREAM; g.textAlign = 'center'; g.fillText(b1, 0, 0);
    if (lit <= 0) { g.fillStyle = HOT; g.fillRect(-wb / 2, 44, wb, 8); }
    g.restore(); g.restore();
  }
  function hookScene(g, t, idle) {
    var ti = idle == null ? t : idle, home = idle != null, T = home ? -99 : t, N = 99;
    var exist = home ? N : at('hook', 'exist'), gpt = home ? N : at('hook', 'chatgpt'), made = home ? N : at('hook', 'made');
    var hal = home ? N : at('name', 'hallucination'), filed = home ? N : at('name', 'filed'), fed = home ? N : at('name', 'federal');
    var why = home ? N : start('why'), things = home ? N : at('why', 'things'), up = home ? N : at('why', 'up'), sure = home ? N : at('why', 'sure');
    var full = (NAME1 + ' ' + NAME2).length;
    /* why: the name is erased to a blank (backspace), and the caret types it straight back, no pause */
    var erase = seg(t, why + .05, things), retype = seg(t, up - .05, sure - .1), n = full;
    if (t > why + .05) n = t < up - .05 ? full * (1 - ss(erase)) : full * retype;
    var slotA = home ? 0 : win(t, why, sure + .2, .3);
    var stampOut = seg(t, why - .1, why + .2);
    var sticky = home ? 0 : 1, leave = 1;
    docPage(g, ti, {
      name: n, caret: t > why && t < sure + .6, busy: t > why + .05 && t < sure - .1, slot: slotA, hl: t < why ? 1 : t < up ? 1 - erase : retype,
      fed: home ? 0 : eio(seg(t, fed - .05, fed + .35)) * (1 - seg(t, why - .2, why + .1)),
      inner: function (g) {
        /* DOESN'T EXIST, slammed across the cited case on "exist" */
        if (!home) slam(g, ["DOESN'T EXIST"], REDINK, 80, -10, 80, t, exist + .04, -.13, 1 - stampOut);
        /* the court's own stamp: FILED, blue ink, on "filed" */
        if (!home) slam(g, ['FILED', 'S.D.N.Y.', 'MAR 01 2023'], BLUEINK, 60, 236, 282, t, filed + .05, .06, .92);
        /* a sticky note on "ChatGPT" */
        if (!home && t >= gpt - .05) {
          var k = sp(t, gpt - .05, 2.8, .82), s = lerp(1.25, 1, clamp(k, 0, 1));
          g.save(); g.globalAlpha *= clamp(k * 3, 0, 1); g.translate(-235, 292); g.rotate(-.07 + .02 * knock(t, gpt + .1, 14, 5)); g.scale(s, s);
          g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-115 + 8, -95 + 12, 230, 190);
          g.fillStyle = STICKY; g.fillRect(-115, -95, 230, 190); g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(-115, -95, 230, 26);
          txt(g, 'source:', -90, -36, 40, INKD, 'serif');
          var mk2 = seg(t, made - .05, made + .3);
          txt(g, 'ChatGPT', -92, 30, 42, INK, DISP, 'left', 800);
          g.fillStyle = REDINK; g.fillRect(-94, 60, 170 * mk2, 6);
          g.restore();
        }
      }
    });
    /* the headline with the search phrase: up from frame 0, lit on "hallucination" */
    var ha = home ? 1 : 1 - seg(t, why - .3, why + .1);
    headline(g, ti, ha, home ? 0 : eio(seg(t, hal - .05, hal + .2)), home ? 0 : Math.max(0, knock(t, hal, 16, 6)));
    label(g, 'NO PAUSE. NO DOUBT.', 520, 1420, home ? 0 : win(t, sure - .05, SC[0].t1 - .4, .2), HOT, 32);
  }

  /* =====================================================================================================
     SCENE 2 · New York, 2023: a lawyer asks ChatGPT for cases; it gives six; not one exists
     ===================================================================================================== */
  var CASES = [
    [['Varghese v.', 'China Southern Airlines'], ['925 F.3d 1339', '(11th Cir. 2019)']],
    [['Shaboon v.', 'Egyptair'], ['2013 IL App (1st)', '111279-U']],
    [['Petersen v.', 'Iran Air'], ['905 F. Supp. 2d 121', '(D.D.C. 2012)']],
    [['Martinez v.', 'Delta Airlines, Inc.'], ['2019 WL 4639462', '']],
    [['Estate of Durden v.', 'KLM Royal Dutch Airlines'], ['2017 WL 2418825', '']],
    [['Miller v.', 'United Airlines, Inc.'], ['174 F.3d 366', '(2d Cir. 1999)']]
  ];
  var CW = 390, CH = 228;
  function cardXY(i) { return [i % 2 ? 738 : 302, 728 + Math.floor(i / 2) * 262]; }
  function indexCard(g, x, y, rot, s, a, fn) {
    sheet(g, x, y, CW, CH, rot, a, function (g, w, h) {
      g.fillStyle = 'rgba(216,51,43,.55)'; g.fillRect(-w / 2, -h / 2 + 44, w, 3);
      g.fillStyle = 'rgba(52,80,196,.16)'; for (var k = 0; k < 4; k++) g.fillRect(-w / 2, -h / 2 + 92 + k * 40, w, 2);
      if (fn) fn(g, w, h);
    }, '#f6f1e6', s);
  }
  function storyScene(g, t) {
    var s0 = SC[1].t0, ny = at('story', 'new'), y23 = at('story', '2023'), lawyer = at('story', 'lawyer'), asks = at('story', 'asks'), gpt = at('story', 'chatgpt'), cases = at('story', 'cases');
    var six = at('six', 'six'), judges = at('six', 'judges'), quotes = at('six', 'quotes'), not = at('six', 'not'), exists = at('six', 'exists');
    var out = eio(seg(t, six - .35, six + .05));
    /* phase A: the dateline, the flight, the legal pad and the chat */
    if (out < 1) {
      g.save(); g.globalAlpha *= 1 - out; g.translate(0, -out * 80);
      var dk = pop(t, ny - .05, 2.8), yk = pop(t, y23 - .05, 3);
      var dpx = 92; font(g, dpx, 900); try { g.fontStretch = 'expanded'; } catch (e) {}
      var dW = g.measureText('NEW YORK · 2023').width; if (dW > 880) { dpx = Math.floor(dpx * 880 / dW); font(g, dpx, 900); try { g.fontStretch = 'expanded'; } catch (e) {} }
      var nyW = g.measureText('NEW YORK').width, yW = g.measureText(' · 2023').width, x0 = 540 - (nyW + yW) / 2;
      g.save(); g.globalAlpha *= clamp(dk * 2, 0, 1); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('NEW YORK', x0, 590 + (1 - Math.min(1, dk)) * 30); g.restore();
      g.save(); g.globalAlpha *= clamp(yk * 2, 0, 1); font(g, dpx, 900); try { g.fontStretch = 'expanded'; } catch (e) {} g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = HOT; g.fillText(' · 2023', x0 + nyW, 590 + (1 - Math.min(1, yk)) * 30); g.restore();
      /* the flight: a flat airliner crossing, and the case it led to */
      var px = lerp(-180, 1260, seg(t, s0, cases + .6)), pyy = 735 - 30 * seg(t, s0, cases + .6);
      plane(g, px, pyy, .9, .85);
      var tk = pop(t, s0 + .3, 2.4);
      indexCard(g, 540, 875, -.025 + .006 * Math.sin(t * .9), 1, clamp(tk * 2, 0, 1) * (1 - seg(t, lawyer - .2, lawyer + .1) * .0), function (g) {
        txt(g, 'Mata v. Avianca', -168, -84, 44, INK, 'serif');
        txt(g, 'SAYS A SERVING', -168, -22, 30, INK, MONO); txt(g, 'CART HIT HIS KNEE', -168, 18, 30, INK, MONO); txt(g, 'FLIGHT 670 · 2019', -168, 58, 30, INKD, MONO);
      });
      /* the legal pad, written on "asks"; the chat window on "ChatGPT" */
      var pk = pop(t, lawyer - .1, 2.6);
      sheet(g, 300, 1235, 380, 330, -.05 + .005 * Math.sin(t * .8), clamp(pk * 2, 0, 1), function (g, w, h) {
        g.fillStyle = 'rgba(52,80,196,.25)'; for (var k = 0; k < 6; k++) g.fillRect(-w / 2, -h / 2 + 70 + k * 48, w, 2);
        g.fillStyle = 'rgba(216,51,43,.5)'; g.fillRect(-w / 2 + 52, -h / 2, 3, h);
        g.fillStyle = '#7d6a3a'; g.fillRect(-w / 2, -h / 2, w, 26);
        var wk = seg(t, asks - .05, gpt), wk2 = seg(t, gpt, cases + .1);
        g.save(); g.beginPath(); g.rect(-w / 2 + 64, -h / 2 + 30, (w - 70) * wk, 60); g.clip(); txt(g, 'need cases', -w / 2 + 70, -h / 2 + 62, 50, BLUEINK, 'serif'); g.restore();
        g.save(); g.beginPath(); g.rect(-w / 2 + 64, -h / 2 + 90, (w - 70) * wk2, 64); g.clip(); txt(g, 'ask ChatGPT?', -w / 2 + 70, -h / 2 + 118, 50, BLUEINK, 'serif'); g.restore();
      }, PADY, lerp(.94, 1, clamp(pk, 0, 1)));
      var ck = pop(t, gpt - .1, 2.6);
      if (t >= gpt - .1) {
        g.save(); g.globalAlpha *= clamp(ck * 2, 0, 1);
        rr(g, 560, 1080 + (1 - Math.min(1, ck)) * 40, 370, 300, 36); g.fillStyle = PANEL; g.fill(); g.strokeStyle = FAINT; g.lineWidth = 3; g.stroke();
        label(g, 'ChatGPT', 600, 1130 + (1 - Math.min(1, ck)) * 40, 1, MINT, 30, 'left');
        rr(g, 640, 1180, 260, 70, 26); g.fillStyle = PANEL2; g.fill();
        chip(g, 'cases?', 770, 1215, { px: 36, wt: 700, pad: 0 });
        dots(g, 610, 1310, t, seg(t, cases - .1, cases + .2));
        g.restore();
        arrow(g, 470, 1180, 548, 1180, eio(seg(t, gpt, gpt + .3)), HOT, 7);
      }
      g.restore();
    }
    /* phase B: six index cards deal out of the chat window */
    if (t >= six - .3) {
      var shown = 0;
      CASES.forEach(function (c, i) {
        var d0 = six - .2 + i * .11, k = eio(seg(t, d0, d0 + .45)); if (t < d0) return;
        var p = cardXY(i), x = lerp(745, p[0], k), y = lerp(1230, p[1], k) - Math.sin(k * Math.PI) * 60, rot = lerp(.5, (hash(i + 3) - .5) * .06, k) + .004 * Math.sin(t * .9 + i);
        shown++;
        var stT = lerp(not, exists + .15, [0, .3, .52, .7, .84, .96][i]);
        indexCard(g, x, y, rot, lerp(.7, 1, k), clamp(k * 3, 0, 1), function (g, w, h) {
          var fs = function (px) { serif(g, px); };
          var p1 = fitPx(g, c[0][1], 40, w - 50, fs);
          txt(g, c[0][0], -w / 2 + 24, -h / 2 + 26, 34, INKD, 'serif');
          txt(g, c[0][1], -w / 2 + 24, -h / 2 + 72, p1, INK, 'serif');
          var fm = function (px) { font(g, px, 500, MONO); };
          var q1 = fitPx(g, c[1][0], 30, w - 50, fm); txt(g, c[1][0], -w / 2 + 24, -h / 2 + 128, q1, INK, MONO);
          if (c[1][1]) txt(g, c[1][1], -w / 2 + 24, -h / 2 + 168, 30, INK, MONO);
          /* judges: a small gavel mark on every card; quotes: quote marks */
          var jk = pop(t, judges + i * .05, 3);
          if (t >= judges + i * .05) { g.save(); g.globalAlpha *= clamp(jk * 2, 0, 1); g.translate(w / 2 - 44, -h / 2 + 22); g.scale(.42 * clamp(jk, 0, 1.04), .42 * clamp(jk, 0, 1.04)); gavelIcon(g, BLUEINK); g.restore(); }
          var qk = pop(t, quotes + i * .05, 3);
          if (t >= quotes + i * .05) { g.save(); g.globalAlpha *= clamp(qk * 2, 0, 1); serif(g, 96); g.fillStyle = HOT; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText('“”', w / 2 - 18, h / 2 - 34); g.restore(); }
          slam(g, ["DOESN'T EXIST"], REDINK, 40, 0, 6, t, stT, -.14 + (hash(i) - .5) * .1);
        });
      });
      label(g, 'REAL JUDGES’ NAMES', 520, 560, win(t, judges - .05, quotes - .15, .15), DIM, 32);
      label(g, 'QUOTED PASSAGES', 520, 560, win(t, quotes, not - .2, .15), DIM, 32);
      label(g, '0 OF 6 REAL', 520, 560, clamp(sp(t, exists + .2), 0, 1) * (1 - seg(t, SC[1].t1 - .45, SC[1].t1 - .2)), HOT, 38);
    }
  }
  function plane(g, x, y, s, a) {
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.scale(s, s); g.fillStyle = CREAM;
    rr(g, -150, -20, 300, 40, 20); g.fill();
    g.beginPath(); g.moveTo(-40, 0); g.lineTo(40, 0); g.lineTo(-20, 90); g.lineTo(-60, 90); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-40, 0); g.lineTo(30, 0); g.lineTo(-30, -70); g.lineTo(-62, -70); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(-150, -10); g.lineTo(-110, -10); g.lineTo(-140, -64); g.lineTo(-160, -64); g.closePath(); g.fill();
    g.fillStyle = BG; for (var k = 0; k < 7; k++) { g.beginPath(); g.arc(-70 + k * 26, -4, 5, 0, 6.283); g.fill(); }
    g.fillStyle = HOT; g.fillRect(-150, 8, 300, 6);
    g.restore();
  }
  function gavelIcon(g, col) {
    g.fillStyle = col; g.save(); g.rotate(-.6);
    rr(g, -44, -22, 88, 44, 10); g.fill(); g.fillRect(-52, -26, 12, 52); g.fillRect(40, -26, 12, 52);
    rr(g, -8, 18, 16, 92, 6); g.fill();
    g.restore();
  }

  /* =====================================================================================================
     SCENE 3 · the DM moment: "Is varghese a real case" → yes; "What is your source" → it double-checked
     (Sanctions op. Appendix B, the lawyer's own wording, re-created)
     ===================================================================================================== */
  var PHX = 90, PHY = 560, PHW = 900, PHH = 900;
  var MSG = [
    { u: true, s: 'Is varghese a real case' },
    { u: false, s: 'Yes, Varghese v. China Southern Airlines Co Ltd, 925 F.3d 1339 (11th Cir. 2019) is a real case.' },
    { u: true, s: 'What is your source' },
    { u: false, s: 'I apologize for the confusion earlier. Upon double-checking, I found that the case … does\u00a0indeed\u00a0exist and can be found on legal research databases such as Westlaw and LexisNexis.' }
  ];
  var MPX = 41, MLH = 54;
  function chatLayout(g) {
    if (chatLayout.c) return chatLayout.c;
    var y = 0, out = [];
    MSG.forEach(function (m) {
      font(g, MPX, m.u ? 600 : 500); var lines = wrap(g, m.s, m.u ? 600 : 770), wmax = 0;
      lines.forEach(function (l) { wmax = Math.max(wmax, g.measureText(l).width); });
      var h = lines.length * MLH + (m.u ? 40 : 0);
      out.push({ m: m, lines: lines, y: y, h: h, w: wmax }); y += h + 22;
    });
    chatLayout.c = out; return out;
  }
  function chatScene(g, t) {
    var s0 = SC[2].t0, even = at('asked', 'even'), isW = at('asked', 'is'), vg = at('asked', 'varghese'), real = at('asked', 'real'), caseW = at('asked', 'case');
    var yes = at('yes', 'yes'), then = at('yes', 'then'), said2 = at('yes', 'said', 1), dbl = at('yes', 'doublechecked'), dblE = wend('yes', 'doublechecked');
    var ph = pop(t, s0, 2.4), L = chatLayout(g);
    /* when each message starts and finishes appearing */
    var caseE = wend('asked', 'case'), TT = [[caseE + .05, caseE + .06], [yes - .05, yes + .9], [then - .32, then + .05], [said2 - .15, dbl - .04]];
    /* the tag: the source of the words, up from the first frame */
    label(g, 'FROM THE COURT RECORD · RE-CREATED', 520, 505, clamp(ph * 2, 0, 1), CREAM, 30);
    g.save(); g.globalAlpha *= clamp(ph * 2, 0, 1); g.translate(0, (1 - Math.min(1, ph)) * 80);
    rr(g, PHX, PHY, PHW, PHH, 64); g.fillStyle = '#0d0c11'; g.fill(); g.strokeStyle = 'rgba(244,237,224,.22)'; g.lineWidth = 4; g.stroke();
    rr(g, PHX + 18, PHY + 18, PHW - 36, PHH - 36, 50); g.fillStyle = '#1b1922'; g.fill();
    label(g, 'ChatGPT', PHX + 60, PHY + 70, 1, CREAM, 34, 'left');
    g.fillStyle = FAINT; g.fillRect(PHX + 18, PHY + 112, PHW - 36, 2);
    /* the input bar: his question is typed here, then sent */
    rr(g, PHX + 40, 1326, PHW - 80, 84, 42); g.fillStyle = '#272430'; g.fill();
    var q = MSG[0].s, nq = t > caseE + .05 ? 0 : Math.floor(seg(t, even + .1, caseE - .05) * q.length);
    font(g, MPX, 600); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText(q.slice(0, nq), PHX + 80, 1368);
    caret(g, PHX + 84 + g.measureText(q.slice(0, nq)).width, 1368, 44, t, nq > 0 && nq < q.length, HOT);
    g.beginPath(); g.arc(PHX + PHW - 84, 1368, 28, 0, 6.283); g.fillStyle = nq > 0 ? CREAM : 'rgba(244,237,224,.25)'; g.fill();
    g.strokeStyle = BG; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(PHX + PHW - 84, 1382); g.lineTo(PHX + PHW - 84, 1354); g.moveTo(PHX + PHW - 96, 1364); g.lineTo(PHX + PHW - 84, 1352); g.lineTo(PHX + PHW - 72, 1364); g.stroke();
    /* the conversation scrolls so the newest message is in view */
    var top = PHY + 140, bottom = 1300, view = bottom - top, scroll = 0;
    L.forEach(function (m, i) { var need = Math.max(0, m.y + m.h - view); scroll = lerp(scroll, need, eio(seg(t, TT[i][0], TT[i][0] + .5))); });
    /* keep the end of the last answer in view while it types */
    g.save(); g.beginPath(); g.rect(PHX + 18, PHY + 114, PHW - 36, PHH - 150); g.clip();
    L.forEach(function (m, i) {
      if (t < TT[i][0]) return;
      var k = pop(t, TT[i][0], 3), y = top + m.y - scroll + (1 - Math.min(1, k)) * 30;
      g.save(); g.globalAlpha *= clamp(k * 2, 0, 1);
      if (m.m.u) {
        var bw = m.w + 56, bx = PHX + PHW - 50 - bw;
        rr(g, bx, y, bw, m.h, 30); g.fillStyle = '#34303f'; g.fill();
        font(g, MPX, 600); g.fillStyle = CREAM; g.textAlign = 'left'; g.textBaseline = 'middle';
        var shownU = Math.floor(seg(t, TT[i][0], TT[i][1]) * m.m.s.length), cU = 0;
        m.lines.forEach(function (l, j) { var s = l.slice(0, Math.max(0, shownU - cU)); cU += l.length + 1; g.fillText(s, bx + 28, y + 20 + MLH / 2 + j * MLH); });
      } else {
        var total = m.m.s.length, shown = Math.floor(seg(t, TT[i][0] + .15, TT[i][1]) * total), c = 0;
        if (shown === 0) dots(g, PHX + 70, y + 28, t, 1);
        m.lines.forEach(function (l, j) {
          var s = l.slice(0, Math.max(0, shown - c)), yy = y + MLH / 2 + j * MLH; c += l.length + 1;
          drawRich(g, s, PHX + 60, yy, t, i === 1 ? [['Yes,', yes]] : [['double-checking,', dbl, 'under'], ['does\u00a0indeed\u00a0exist', dbl, 'hit']]);
        });
      }
      g.restore();
    });
    g.restore();
    g.restore();
  }
  /* draw a line of answer text, marking chosen phrases in coral once spoken */
  function drawRich(g, s, x, y, t, marks) {
    font(g, MPX, 500); g.textAlign = 'left'; g.textBaseline = 'middle';
    var hits = [];
    marks.forEach(function (mk) {
      var start = s.indexOf(mk[0]); if (start < 0 || t < mk[1]) return;
      var pre = g.measureText(s.slice(0, start)).width, pw = g.measureText(mk[0]).width;
      if (mk[2] === 'under') { var ku = eio(seg(t, mk[1], mk[1] + .25)); g.fillStyle = HOT; g.fillRect(x + pre, y + 24, pw * ku, 5); return; }
      if (mk[2] === 'hit') { hits.push([pre, pw, mk]); return; }
      var k = eio(seg(t, mk[1], mk[1] + .3)); g.fillStyle = HOT; rr(g, x + pre - 6, y - 28, (pw + 12) * k, 56, 10); g.fill();
    });
    g.fillStyle = CREAM; g.fillText(s, x, y);
    marks.forEach(function (mk) {
      if (mk[2] || t < mk[1] + .15) return; var start = s.indexOf(mk[0]); if (start < 0) return;
      g.fillStyle = BG; g.fillText(mk[0], x + g.measureText(s.slice(0, start)).width, y);
    });
    /* the hard hit: a coral block lands on the phrase with a knock, like a stamp */
    hits.forEach(function (h) {
      var pre = h[0], pw = h[1], t0 = h[2][1], k = Math.min(1, seg(t, t0, t0 + .06)), sc = 1 + .5 * (1 - k) + .07 * knock(t, t0 + .06, 26, 8);
      g.save(); g.translate(x + pre + pw / 2, y); g.rotate(-.03 * k); g.scale(sc, sc); g.globalAlpha *= k;
      g.fillStyle = HOT; rr(g, -pw / 2 - 12, -33, pw + 24, 66, 8); g.fill();
      font(g, MPX, 500); g.textAlign = 'center'; g.fillStyle = BG; g.fillText(h[2][0], 0, 1); g.fillText(h[2][0], .8, 1);
      g.restore();
    });
  }

  /* =====================================================================================================
     SCENE 4 · the judge: "Its legal analysis is gibberish." · fined $5,000
     ===================================================================================================== */
  function judgeScene(g, t) {
    var s0 = SC[3].t0, gib = at('gibberish', 'gibberish'), legal = at('gibberish', 'legal');
    var fined = at('fine', 'fined'), money = at('fine', '5000'), lawyers = at('fine', 'lawyers');
    var up = eio(seg(t, fined - .3, fined + .25));
    /* the gavel: a flat wooden gavel and its block; it lifts, then strikes on "gibberish" and leaves on "fined" */
    var hit = gib - .02, ang = t < hit - .28 ? lerp(0, -.36, eio(seg(t, s0, hit - .28))) : t < hit ? lerp(-.36, 0, Math.pow(seg(t, hit - .28, hit), 2)) : knock(t, hit, 24, 9) * -.05;
    var ga = clamp(pop(t, s0, 2.4) * 2, 0, 1) * (1 - up);
    if (ga > 0) {
      g.save(); g.globalAlpha *= ga;
      g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, 548, 742, 184, 34, 10); g.fill();
      g.fillStyle = '#5c3f27'; rr(g, 540, 730, 184, 36, 10); g.fill(); g.fillStyle = '#7a5434'; rr(g, 556, 722, 152, 16, 6); g.fill();
      g.save(); g.translate(950, 640); g.rotate(ang);
      g.fillStyle = '#8a613e'; rr(g, -320, -11, 320, 22, 11); g.fill();
      g.fillStyle = '#6b4a2f'; rr(g, -352, -86, 70, 172, 14); g.fill();
      g.fillStyle = '#4a321f'; g.fillRect(-352, -62, 70, 12); g.fillRect(-352, 50, 70, 12);
      g.restore(); g.restore();
    }
    /* the quote card */
    var qk = pop(t, s0 + .05, 2.6), qy = lerp(1010, 790, up);
    sheet(g, 530, qy + (1 - Math.min(1, qk)) * 60, 860, 430, -.012 + .004 * Math.sin(t * .8), clamp(qk * 2, 0, 1), function (g, w, h) {
      serif(g, 150); g.fillStyle = 'rgba(216,51,43,.25)'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('“', -w / 2 + 24, -h / 2 - 6);
      txt(g, 'Its legal analysis', -w / 2 + 70, -h / 2 + 120, 76, INK, 'serif');
      var gk = sp(t, gib, 3, .8), ww = txt(g, 'is ', -w / 2 + 70, -h / 2 + 210, 76, INK, 'serif');
      if (t >= gib - .02) {
        serif(g, 76); var gw = g.measureText('gibberish.').width, gx = -w / 2 + 70 + ww;
        g.save(); g.fillStyle = HOT; g.fillRect(gx - 6, -h / 2 + 210 - 40, (gw + 12) * eio(seg(t, gib, gib + .25)), 80); g.restore();
        g.save(); g.translate(gx, -h / 2 + 210); g.scale(lerp(1.25, 1, clamp(gk, 0, 1)), lerp(1.25, 1, clamp(gk, 0, 1))); txt(g, 'gibberish.”', 0, 0, 76, INK, 'serif'); g.restore();
      }
      g.fillStyle = 'rgba(33,29,38,.3)'; g.fillRect(-w / 2 + 70, h / 2 - 118, w - 140, 3);
      txt(g, 'JUDGE P. KEVIN CASTEL · S.D.N.Y.', -w / 2 + 70, h / 2 - 80, 30, INK, MONO);
      txt(g, 'JUNE 22, 2023', -w / 2 + 70, h / 2 - 40, 30, INKD, MONO);
    });
    /* fined: $5,000, rolling */
    if (t >= fined - .2) {
      var fk = pop(t, fined - .2, 2.6), v = 5000 * eio(seg(t, fined, money + .35));
      g.save(); g.globalAlpha *= clamp(fk * 2, 0, 1);
      counter(g, v, 540, 1205, 170, CREAM, '$');
      g.restore();
      label(g, 'SANCTIONS · JUNE 22, 2023', 520, 1075, fk, DIM, 30);
      label(g, '+ A LETTER TO EACH REAL JUDGE', 520, 1335, pop(t, wend('fine', '5000') + .1), CREAM, 30);
      label(g, 'IT NAMED AS AN AUTHOR', 520, 1385, pop(t, wend('fine', '5000') + .2), CREAM, 30);
    }
  }

  /* =====================================================================================================
     SCENE 5 · the turn: it wasn't lying; it was guessing (the word drops into the blank)
     ===================================================================================================== */
  function turnScene(g, t) {
    var s0 = SC[4].t0, thing = at('turn', 'thing'), lying = at('turn', 'lying'), lyingE = wend('turn', 'lying'), guessing = at('turn', 'guessing');
    var ca = pop(t, s0 + .05, 3);
    /* a caret waits first: here's the thing */
    /* "here's the thing": the first blank is up at once, with a caret waiting in it; LYING drops in, then is struck */
    slot(g, 540, 820, 640, 190, t, { a: clamp(ca * 2, 0, 1) * (1 - seg(t, lying - .1, lying + .2)), caretX: t < lying - .05 ? 260 : null });
    var lk = pop(t, lying - .1, 3), sk = eio(seg(t, lyingE - .05, lyingE + .3));
    label(g, "IT WASN'T", 520, 680, clamp(ca, 0, 1), DIM, 34);
    if (t >= lying - .1) {
      g.save(); g.globalAlpha *= clamp(lk * 2, 0, 1) * lerp(1, .55, sk); font(g, 170, 900); try { g.fontStretch = 'expanded'; } catch (e) {} g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
      g.fillText('LYING', 540, 820 + (1 - Math.min(1, lk)) * 30); var lw = g.measureText('LYING').width; g.restore();
      if (sk > 0) { g.save(); g.strokeStyle = HOT; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); g.moveTo(540 - lw / 2 - 30, 830); g.lineTo(540 - lw / 2 - 30 + (lw + 60) * sk, 810); g.stroke(); g.restore(); }
    }
    label(g, 'IT WAS', 520, 990, pop(t, at('turn', 'was') - .05), DIM, 34);
    /* the blank, then GUESSING drops in */
    var sa = pop(t, lyingE + .1, 3);
    font(g, 150, 900); try { g.fontStretch = 'expanded'; } catch (e) {}
    var gw = Math.min(900, g.measureText('GUESSING').width + 60);
    slot(g, 540, 1130, gw, 190, t, { a: clamp(sa * 2, 0, 1), caretX: t < guessing ? 540 - gw / 2 + 40 : null });
    if (t >= guessing - .08) {
      var dk = sp(t, guessing - .08, 3, .8), yy = lerp(960, 1130, clamp(dk, 0, 1));
      g.save(); g.globalAlpha *= clamp(dk * 3, 0, 1); font(g, 150, 900); try { g.fontStretch = 'expanded'; } catch (e) {}
      var sc = Math.min(1, (gw - 50) / g.measureText('GUESSING').width); g.translate(540, yy); g.scale(sc, sc);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = HOT; g.fillText('GUESSING', 0, 6); g.restore();
    }
  }

  /* =====================================================================================================
     SCENE 6 · the guesser: the next likely word, again and again; a fake case looks just like a real one
     ===================================================================================================== */
  var SENT = ['The', 'court', 'held', 'that', 'the', 'airline'];
  var CANDS = [null, ['court', 'case', 'judge'], ['held', 'ruled', 'found'], ['that', 'the', 'in'], ['the', 'a', 'no'], ['airline', 'claim', 'plaintiff']];
  var BARS = [[1, .62, .4], [1, .7, .35], [1, .55, .45], [1, .5, .3], [1, .66, .5]];
  var CITES = [
    { tag: 'B', parts: [['Varghese', 0], ['v.', 0], ['China Southern', 0], ['925', 1], ['F.3d', 1], ['1339', 1], ['(11th Cir. 2019)', 1]], real: false },
    { tag: 'A', parts: [['Ireland', 0], ['v.', 0], ['AMR Corp.', 0], ['20', 1], ['F. Supp. 3d', 1], ['341', 1], ['(E.D.N.Y. 2014)', 1]], real: true }
  ];
  function guessScene(g, t) {
    var s0 = SC[5].t0, guesses = at('guess', 'guesses'), next = at('guess', 'next'), word = at('guess', 'word'), again = at('guess', 'again'), againE = end('guess');
    var to = at('looks', 'to'), fake = at('looks', 'fake'), looksW = at('looks', 'looks'), like = at('looks', 'like'), real = at('looks', 'real'), oneE = end('looks');
    var leave = eio(seg(t, to - .3, to + .1));
    /* the sentence, built a word at a time: each word is the top pick of a short list (illustration, no numbers) */
    if (leave < 1) {
      g.save(); g.globalAlpha *= 1 - leave; g.translate(0, -leave * 120);
      label(g, 'SEE PART 1: NEXT WORD', 900, 565, pop(t, s0 + .1), DIM, 30, 'right');
      var steps = [s0 + .2]; for (var i = 1; i < SENT.length; i++) steps.push(lerp(guesses, againE - .1, (i - 1) / (SENT.length - 2)));
      var shown = 0; steps.forEach(function (st) { if (t >= st) shown++; });
      sheet(g, 540, 790, 880, 180, -.01, pop(t, s0 + .05, 2.6), function (g, w, h) {
        serif(g, 64); var x = -w / 2 + 40, y = 4;
        for (var i = 0; i < shown; i++) {
          var k = pop(t, steps[i], 3.2), ww = g.measureText(SENT[i] + ' ').width;
          g.save(); g.globalAlpha *= clamp(k * 2, 0, 1); g.fillStyle = i === shown - 1 && i > 0 ? REDINK : INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(SENT[i], x, y - (1 - Math.min(1, k)) * 50); g.restore();
          x += ww;
        }
        if (shown < SENT.length) { serif(g, 64); slot(g, x + 90, y, 180, 92, t, { col: 'rgba(33,29,38,.5)' }); caret(g, x + 16, y, 64, t, false, HOT); }
        else caret(g, x + 4, y, 64, t, false, HOT);
      });
      /* the list of next words for the current step, with bars; the top one flies up into the slot */
      var cur = Math.min(shown, SENT.length - 1);
      if (cur >= 1 && t < againE + .1) {
        var st = Math.max(steps[cur - 1] + .08, steps[cur] - .6), ca = clamp(sp(t, st, 3), 0, 1), opts = CANDS[cur], bars = BARS[cur - 1];
        if (t >= st && t < steps[cur] + .2) {
          opts.forEach(function (w, j) {
            var y = 1000 + j * 110, k = clamp(sp(t, st + j * .04, 3.2), 0, 1), pick = j === 0 && t >= steps[cur] - .1, fly = j === 0 ? eio(seg(t, steps[cur] - .12, steps[cur])) : 0;
            g.save(); g.globalAlpha *= k * (1 - fly);
            font(g, 54, 800); g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = j === 0 ? HOT : CREAM; g.fillText(w, 380, y);
            rr(g, 410, y - 26, 460, 52, 10); g.fillStyle = 'rgba(244,237,224,.07)'; g.fill();
            rr(g, 410, y - 26, 460 * bars[j] * k, 52, 10); g.fillStyle = j === 0 ? HOT : 'rgba(244,237,224,.45)'; g.fill();
            g.restore();
          });
        }
        label(g, 'LIKELY NEXT WORDS · ILLUSTRATION', 520, 1350, win(t, guesses - .2, againE - .2, .2), DIM, 30);
      }
      g.restore();
    }
    /* two citations, cut into the same parts: which one is real? */
    if (t >= to - .2) {
      CITES.forEach(function (c, ci) {
        var by = ci === 0 ? 800 : 1200, appear = ci === 0 ? to - .1 : looksW - .1;
        label(g, ci === 0 ? 'CASE 1' : 'CASE 2', 130, by - 120, pop(t, appear), DIM, 30, 'left');
        var revealT = c.real ? real : fake, rk = pop(t, revealT + .05, 3);
        if (t >= revealT + .05) chip(g, c.real ? 'REAL' : 'FAKE', 860, by - 120, { px: 36, wt: 900, bg: c.real ? MINT : HOT, fg: BG, pad: 18, s: lerp(1.5, 1, clamp(rk, 0, 1)), a: clamp(rk * 2, 0, 1), rot: -.05 });
        var rows = [[], []]; c.parts.forEach(function (p, j) { rows[p[1]].push(j); });
        rows.forEach(function (row, ri) {
          var px = ri ? 40 : 52, ws = row.map(function (j) { if (ri) font(g, px, 500, MONO); else serif(g, px); return g.measureText(c.parts[j][0]).width + 34; }), gap = 12;
          var tot = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (row.length - 1), x = 540 - tot / 2, y = by + ri * 96 - 20;
          row.forEach(function (j, q) {
            var k = pop(t, appear + j * .07, 3.2), w = ws[q], same = seg(t, like - .1, like + .2) * (1 - seg(t, real - .1, real + .2));
            g.save(); g.globalAlpha *= clamp(k * 2, 0, 1); g.translate(x + w / 2, y + (1 - Math.min(1, k)) * 30);
            rr(g, -w / 2, -38, w, 76, 14); g.fillStyle = PAPER; g.fill();
            if (same > 0) { g.strokeStyle = YEL; g.lineWidth = 4 * same; g.stroke(); }
            if (ri) font(g, px, 500, MONO); else serif(g, px);
            g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c.parts[j][0], 0, 2);
            g.restore();
            x += w + gap;
          });
        });
      });
      label(g, 'SAME PARTS · SAME SHAPE', 520, 1015, win(t, like - .1, oneE + .2, .2), YEL, 32);
    }
  }

  /* =====================================================================================================
     SCENE 7 · the peak: a guesser always has a next word; there's no "I don't know" button (unless it's trained to use one)
     ===================================================================================================== */
  function pushButton(g, x, y, t, lit, press, cross) {
    g.save(); g.translate(x, y);
    rr(g, -250, 40, 500, 90, 30); g.fillStyle = '#2e2a37'; g.fill();
    var dy = press * 22, col = lit > 0 ? 'rgb(' + Math.round(lerp(120, 63, lit)) + ',' + Math.round(lerp(116, 214, lit)) + ',' + Math.round(lerp(126, 162, lit)) + ')' : '#78747e';
    rr(g, -220, -60 + dy, 440, 130, 40); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill();
    rr(g, -220, -80 + dy, 440, 130, 40); g.fillStyle = col; g.fill();
    font(g, 46, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = BG; g.fillText("I DON'T KNOW", 0, -14 + dy);
    if (cross > 0) {
      g.save(); g.globalAlpha *= clamp(cross, 0, 1) * (1 - lit); g.strokeStyle = HOT; g.lineWidth = 16; g.lineCap = 'round';
      g.beginPath(); g.arc(0, -14, 150, -Math.PI / 2, -Math.PI / 2 + 6.283 * clamp(cross, 0, 1)); g.stroke();
      if (cross >= 1) { g.beginPath(); g.moveTo(-106, 92); g.lineTo(106, -120); g.stroke(); }
      g.restore();
    }
    g.restore();
  }
  function buttonScene(g, t) {
    var s0 = SC[6].t0, always = at('button', 'always'), has = at('button', 'has'), nextW = at('button', 'next'), wordE = wend('button', 'word');
    var no = at('button', 'no'), btn = at('button', 'button'), unless = at('catch', 'unless'), trained = at('catch', 'trained'), one = at('catch', 'one'), catchW = at('catch', 'catch');
    var sa = pop(t, s0 + .05, 2.8), SY = 760;
    slot(g, 540, SY, 820, 160, t, { a: clamp(sa * 2, 0, 1) });
    /* the grey "I don't know" card hovers over the slot and never drops; a coral guess snaps in */
    var hk = pop(t, s0 + .25, 2.4), drift0 = eio(seg(t, nextW - .1, wordE + .3)), bob = Math.sin(t * 2.6) * 10;
    var hx = lerp(540, -260, drift0) + Math.sin(t * 1.3) * 8, hy = lerp(SY - 190, SY - 330, drift0) + bob;
    var pressed = eio(seg(t, one - .1, one + .15));
    if (t < wordE + .7) chip(g, "I don't know", hx, hy, { px: 56, wt: 700, bg: '#5d5966', fg: CREAM, pad: 34, a: clamp(hk * 2, 0, 1) * (1 - drift0 * .7), rot: -.04 + drift0 * -.2 });
    var gk = sp(t, nextW + .05, 3, .82);
    if (t >= nextW + .05 && pressed < 1) {
      var gy = lerp(SY - 260, SY, clamp(gk, 0, 1)), out = pressed;
      g.save(); g.globalAlpha *= clamp(gk * 3, 0, 1) * (1 - out); serif(g, 64);
      chip(g, 'Varghese v. China Southern', 540 + out * 600, gy, { px: 62, ital: true, bg: HOT, fg: BG, pad: 30 });
      g.restore();
    }
    /* trained to use it: the button lights, presses, and "I don't know" finally drops into the slot */
    if (t >= one - .05) {
      var ik = sp(t, one + .05, 3, .82), iy = lerp(SY - 260, SY, clamp(ik, 0, 1));
      chip(g, "I don't know", 540, iy, { px: 60, wt: 700, bg: MINT, fg: BG, pad: 34, a: clamp(ik * 3, 0, 1) });
    }
    var bk = pop(t, no - .1, 2.6), lit = eio(seg(t, trained - .05, trained + .25));
    g.save(); g.globalAlpha *= clamp(bk * 2, 0, 1); pushButton(g, 540, 1150 + (1 - Math.min(1, bk)) * 60, t, lit, pressed * (1 - seg(t, one + .3, one + .6)), seg(t, btn - .05, btn + .35)); g.restore();
    label(g, 'ALWAYS A NEXT WORD', 520, 920, win(t, always - .05, no - .3, .2), HOT, 32);
    label(g, 'NO BUTTON FOR IT', 520, 920, win(t, btn, unless - .3, .2), CREAM, 32);
    label(g, 'TRAINED TO USE IT', 520, 920, win(t, trained, catchW - .3, .2), MINT, 32);
    /* the catch: a hang tag swings in */
    if (t >= catchW - .1) {
      var ck = sp(t, catchW - .1, 1.6, .55), sw = (1 - clamp(ck, 0, 1.2)) * .9 + knock(t, catchW + .3, 6, 2.5) * .12;
      g.save(); g.translate(770, 1280); g.rotate(sw);
      g.strokeStyle = CREAM; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -120); g.lineTo(0, -40); g.stroke();
      rr(g, -150, -40, 300, 110, 16); g.fillStyle = REDINK; g.fill(); g.beginPath(); g.arc(0, -22, 9, 0, 6.283); g.fillStyle = BG; g.fill();
      font(g, 46, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = PAPER; g.fillText('THE CATCH', 0, 22);
      g.restore();
    }
  }

  /* =====================================================================================================
     SCENE 8 · the test: a blank scores zero, a guess might score; the old SAT's quarter point
     ===================================================================================================== */
  var ROWS = 6, RY0 = 750, RSTEP = 96, BX0 = 330, BSTEP = 104;
  /* per row: the bubble the pencil fills (−1 = blank) and whether it was right */
  var FILLS = [[-1], [2, true], [0, false], [3, true], [1, false], [2, false]];
  function pencil(g, x, y, a, rot) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(rot == null ? -.7 : rot);
    g.fillStyle = '#f2c230'; g.fillRect(0, -16, 230, 32); g.fillStyle = '#d9a91f'; g.fillRect(0, 4, 230, 12);
    g.fillStyle = '#c9b8a0'; g.beginPath(); g.moveTo(0, -16); g.lineTo(-46, 0); g.lineTo(0, 16); g.closePath(); g.fill();
    g.fillStyle = INK; g.beginPath(); g.moveTo(-30, -6); g.lineTo(-46, 0); g.lineTo(-30, 6); g.closePath(); g.fill();
    g.fillStyle = '#b8b0a4'; g.fillRect(230, -16, 26, 32); g.fillStyle = '#e88a8a'; rr(g, 256, -16, 36, 32, 8); g.fill();
    g.restore();
  }
  function testScene(g, t) {
    var s0 = SC[7].t0, graded = at('test', 'graded'), mc = at('test', 'multiplechoice'), blank = at('test', 'blank'), zero = at('test', 'zero'), points = at('test', 'points');
    var guessW = at('learn', 'guess'), right = at('learn', 'right'), models = at('learn', 'models'), learnW = at('learn', 'learn'), guess2 = at('learn', 'guess', 1);
    var sat = at('sat', 'sat'), fix = at('sat', 'fix'), wrong = at('sat', 'wrong'), quarter = at('sat', 'quarter'), point = at('sat', 'point');
    var sk = pop(t, s0 + .05, 2.4);
    /* when each row gets its pencil mark: row 1 stays blank until "learn to guess"; row 2 on "guess"; the rest fast on "learn to guess" */
    var FT = [guess2 + .25, guessW + .1, learnW, learnW + .07, learnW + .14, learnW + .21];
    sheet(g, 540, 1010 + (1 - Math.min(1, sk)) * 80, 820, 760, -.012 + .004 * Math.sin(t * .7), clamp(sk * 2, 0, 1), function (g, w, h) {
      /* header strip: a machine-scored answer sheet, then the old SAT */
      g.fillStyle = '#e9b8a4'; g.fillRect(-w / 2, -h / 2, w, 110);
      font(g, 34, 500, MONO); try { g.letterSpacing = '4px'; } catch (e) {} g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillStyle = INK; g.globalAlpha *= 1;
      g.fillText('ANSWER SHEET', -w / 2 + 40, -h / 2 + 56);
      /* a running tally of maybe-points: every guessed row might be +1 */
      var nG = 0; for (var r0 = 1; r0 < ROWS; r0++) if (t >= FT[r0]) nG++; if (t >= FT[0]) nG++;
      g.textAlign = 'right'; g.save(); g.globalAlpha *= pop(t, points - .2); g.fillText(nG > 1 ? 'PTS +' + nG + '?' : 'PTS', w / 2 - 40, -h / 2 + 56); g.restore();
      try { g.letterSpacing = '0px'; } catch (e) {}
      var ox = -540, oy = -1010;
      for (var r = 0; r < ROWS; r++) {
        var ry = RY0 + r * RSTEP + oy, F = FILLS[r];
        txt(g, (r + 1) + '.', -w / 2 + 50, ry, 34, INKD, MONO);
        for (var b = 0; b < 4; b++) {
          var bx = BX0 + b * BSTEP + ox, bk = pop(t, s0 + .25 + (r * 4 + b) * .03, 3.4);
          g.save(); g.globalAlpha *= clamp(bk * 2, 0, 1);
          g.beginPath(); g.ellipse(bx, ry, 34, 26, 0, 0, 6.283); g.strokeStyle = '#c4704f'; g.lineWidth = 3; g.stroke();
          font(g, 26, 700); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#c4704f'; g.fillText('ABCD'[b], bx, ry + 1);
          if (F[0] === b && t >= FT[r]) { var fk = seg(t, FT[r], FT[r] + .12); g.beginPath(); g.ellipse(bx, ry, 30 * fk, 22 * fk, 0, 0, 6.283); g.fillStyle = '#2a2630'; g.fill(); }
          g.restore();
        }
        /* the score column */
        var px = w / 2 - 70;
        if (r === 0 && t >= zero - .05 && t < FT[0]) { var zk = pop(t, zero - .05, 3.4); g.save(); g.globalAlpha *= clamp(zk * 2, 0, 1); txt(g, '0', px, ry, 60, REDINK, DISP, 'center', 900); g.restore(); }
        if (r === 1 && t >= right - .05) { var rk = pop(t, right - .05, 3.4); g.save(); g.globalAlpha *= clamp(rk * 2, 0, 1); txt(g, '+1?', px, ry, 46, '#1d8a63', DISP, 'center', 900); g.restore(); }
        if (r === 0 && t >= blank - .05 && t < FT[0]) { var hk = win(t, blank - .05, FT[0] - .1, .2); g.save(); g.globalAlpha *= hk * .9; g.strokeStyle = REDINK; g.lineWidth = 5; rr(g, -w / 2 + 24, ry - 44, w - 160, 88, 16); g.stroke(); g.restore(); }
        if (r > 1 && t >= FT[r] && F[0] >= 0) { var qk = pop(t, FT[r] + .03, 3.6); g.save(); g.globalAlpha *= clamp(qk * 2, 0, 1); txt(g, '+1?', px, ry, 46, INKD, DISP, 'center', 900); g.restore(); }
      }
      if (t >= FT[0]) { var b0 = pop(t, FT[0], 3); g.save(); g.globalAlpha *= clamp(b0 * 2, 0, 1); txt(g, '+1?', w / 2 - 70, RY0 + oy, 46, INKD, DISP, 'center', 900); g.restore(); }
    });
    /* on "SAT": an older, yellowed answer sheet slaps down on top (3° tilt), five bubbles A–E, and its own key */
    if (t >= sat - .12) {
      var sl = seg(t, sat - .12, sat + .02), sk2 = 1 + .35 * (1 - eio(sl)) + .02 * knock(t, sat + .02, 22, 9), rot2 = lerp(.22, .052, eio(sl));
      sheet(g, 560 + 260 * (1 - eio(sl)), 1000 - 60 * (1 - eio(sl)), 820, 800, rot2, clamp(sl * 3, 0, 1), function (g, w, h) {
        g.fillStyle = 'rgba(150,110,40,.10)'; g.fillRect(-w / 2, -h / 2, w, h);
        g.fillStyle = '#d9c38a'; g.fillRect(-w / 2, -h / 2, w, 110);
        font(g, 34, 500, MONO); try { g.letterSpacing = '4px'; } catch (e) {} g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = INK;
        g.fillText('SAT · UNTIL 2016', -w / 2 + 40, -h / 2 + 56);
        g.textAlign = 'right'; g.fillText('PTS', w / 2 - 40, -h / 2 + 56); try { g.letterSpacing = '0px'; } catch (e) {}
        for (var r = 0; r < ROWS; r++) {
          var ry = -h / 2 + 170 + r * 92, F = FILLS[r], px = w / 2 - 70;
          txt(g, (r + 1) + '.', -w / 2 + 50, ry, 34, INKD, MONO);
          for (var b = 0; b < 5; b++) {
            var bx = -w / 2 + 170 + b * 92;
            g.beginPath(); g.ellipse(bx, ry, 32, 25, 0, 0, 6.283); g.strokeStyle = '#8a7a52'; g.lineWidth = 3; g.stroke();
            font(g, 26, 700); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#8a7a52'; g.fillText('ABCDE'[b], bx, ry + 1);
            if (F[0] === b) { g.beginPath(); g.ellipse(bx, ry, 28, 21, 0, 0, 6.283); g.fillStyle = '#2a2630'; g.fill(); }
          }
          /* the key, read out row by row: right +1 on "fix", blank 0, wrong −¼ on "wrong answers" */
          var mt = F[0] < 0 ? fix + .15 : F[1] ? fix : wrong + (r - 2) * .1, mk = pop(t, mt, 3.4);
          if (t >= mt) { g.save(); g.globalAlpha *= clamp(mk * 2, 0, 1); txt(g, F[0] < 0 ? '0' : F[1] ? '+1' : '−¼', px, ry, F[1] ? 50 : 54, F[0] < 0 ? INKD : F[1] ? '#1d8a63' : REDINK, DISP, 'center', 900); g.restore(); }
        }
        /* the printed key in the footer; a highlighter sweeps it on "quarter point" */
        var ky = h / 2 - 56, hk = eio(seg(t, quarter - .05, point + .2));
        font(g, 30, 600, MONO); var kw = g.measureText('RIGHT +1 · BLANK 0 · WRONG −¼').width;
        if (hk > 0) { g.fillStyle = 'rgba(255,91,61,.55)'; g.fillRect(-kw / 2 - 10, ky - 22, (kw + 20) * hk, 44); }
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText('RIGHT +1 · BLANK 0 · WRONG −¼', 0, ky);
      }, PAPER);
    }
    /* the pencil: to row 2 on "guess", then down every row on "learn to guess" */
    var px0 = 1000, py0 = 1500, pxs, pys;
    var tgt = function (r) { var F = FILLS[r]; return [BX0 + (F[0] < 0 ? 0 : F[0]) * BSTEP + 30, RY0 + r * RSTEP + 30]; };
    var order = [1, 2, 3, 4, 5, 0], tl = [guessW + .1, learnW, learnW + .07, learnW + .14, learnW + .21, guess2 + .25];
    pxs = px0; pys = py0;
    var pin = eio(seg(t, guessW - .4, guessW + .1)), pa = pin * (1 - seg(t, sat - .4, sat - .1));
    if (pa > 0) {
      var cur = [lerp(px0, tgt(1)[0], pin), lerp(py0, tgt(1)[1], pin)];
      for (var q = 1; q < order.length; q++) { var k = eio(seg(t, tl[q] - .06, tl[q])), p1 = tgt(order[q]); cur = [lerp(cur[0], p1[0], k), lerp(cur[1], p1[1], k)]; }
      var scrib = Math.sin(t * 60) * 4 * (t > guessW && t < guess2 + .5 ? 1 : 0);
      pencil(g, cur[0] + scrib, cur[1], pa, -.75);
    }
    label(g, 'EVERY ROW GUESSED', 520, 1450 - 20, win(t, guess2 + .3, sat - .3, .2), HOT, 30);
  }

  /* =====================================================================================================
     SCENE 9 · OpenAI's tests: rarely skips → 75% wrong; skips when unsure → 26% wrong (right: 24% vs 22%)
     ===================================================================================================== */
  var BARX = 170, BARW = 700, BARH = 100;
  function bar(g, y, segs, t, ta) {
    /* segs: [[value, col, label, t0]] laid left to right, each growing from its t0; ta = the empty track's alpha */
    var x = BARX;
    if (ta > 0) { g.save(); g.globalAlpha *= clamp(ta, 0, 1); rr(g, BARX, y, BARW, BARH, 12); g.fillStyle = 'rgba(33,29,38,.06)'; g.fill(); g.strokeStyle = 'rgba(33,29,38,.55)'; g.lineWidth = 3; g.setLineDash([14, 10]); g.stroke(); g.setLineDash([]); g.restore(); }
    segs.forEach(function (s) {
      var k = eio(seg(t, s[3], s[3] + .45)), w = BARW * s[0] / 100 * k;
      if (w > 0) { g.fillStyle = s[1]; g.fillRect(x, y, w, BARH); }
      if (s[0] >= 15 && k > .6) { font(g, 64, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = s[1] === PAPER2 ? INK : '#fff'; g.globalAlpha *= 1; g.fillText(Math.round(s[0] * k) + '%', x + w / 2, y + BARH / 2 + 3); }
      x += BARW * s[0] / 100;
    });
  }
  function chartScene(g, t) {
    var s0 = SC[8].t0, tests = at('tested', 'tests'), rarely = at('tested', 'rarely'), skipped = at('tested', 'skipped'), p75 = at('tested', '75%'), wrong1 = at('tested', 'wrong');
    var skips = at('skip', 'skips'), unsure = at('skip', 'unsure'), just = at('skip', 'just'), p26 = at('skip', '26%');
    var ck = pop(t, s0 + .05, 2.4);
    var GREEN = '#2f9e74', GREY = '#b9b0a0';
    sheet(g, 540, 1000 + (1 - Math.min(1, ck)) * 70, 860, 820, -.008 + .003 * Math.sin(t * .7), clamp(ck * 2, 0, 1), function (g, w, h) {
      g.save(); g.translate(-540, -1000);
      font(g, 30, 500, MONO); try { g.letterSpacing = '3px'; } catch (e) {} g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = INK;
      g.fillText('OPENAI · SimpleQA', BARX, 640);
      try { g.letterSpacing = '0px'; } catch (e) {}
      g.save(); g.globalAlpha *= clamp(pop(t, tests - .05, 3) * 2, 0, 1); txt(g, 'short fact questions, no web', BARX, 686, 40, INKD, 'serif'); g.restore();
      /* model 1 */
      /* both models and their empty bars are up on "tests": two different models, side by side */
      var m1 = pop(t, tests - .05, 3), m2 = pop(t, tests + .1, 3);
      g.save(); g.globalAlpha *= clamp(m1 * 2, 0, 1); txt(g, 'o4-mini', BARX, 742, 44, INK, DISP, 'left', 800); g.restore();
      g.save(); g.globalAlpha *= clamp(pop(t, rarely - .05, 3) * 2, 0, 1); txt(g, 'rarely skips', BARX + 200, 744, 32, INKD, 'serif'); g.restore();
      bar(g, 776, [[75, REDINK, 'wrong', p75 - .45], [24, GREEN, 'right', wrend(p75)], [1, GREY, 'skipped', wrend(p75) + .2]], t, m1);
      var l1 = pop(t, wrend(p75) + .3, 3);
      g.save(); g.globalAlpha *= clamp(l1 * 2, 0, 1); legend(g, 912, [['WRONG 75%', REDINK], ['RIGHT 24%', GREEN], ['SKIP 1%', '#8a8273']]); g.restore();
      /* model 2 */
      /* the tag between them: this is not one model getting better */
      g.save(); g.globalAlpha *= clamp(m2 * 2, 0, 1); g.fillStyle = 'rgba(33,29,38,.25)'; g.fillRect(BARX, 985, BARW, 2);
      font(g, 30, 600, MONO); g.textAlign = 'center'; g.textBaseline = 'middle'; var tw = g.measureText('TWO DIFFERENT MODELS · NOT A BEFORE/AFTER').width;
      g.fillStyle = PAPER; g.fillRect(540 - tw / 2 - 14, 965, tw + 28, 40); g.fillStyle = INK; g.fillText('TWO DIFFERENT MODELS · NOT A BEFORE/AFTER', 540, 986); g.restore();
      g.save(); g.globalAlpha *= clamp(m2 * 2, 0, 1); txt(g, 'gpt-5-thinking-mini', BARX, 1056, 44, INK, DISP, 'left', 800); g.restore();
      g.save(); g.globalAlpha *= clamp(pop(t, skips - .05, 3) * 2, 0, 1); txt(g, 'skips when unsure', BARX, 1100, 32, INKD, 'serif'); g.restore();
      bar(g, 1130, [[26, REDINK, 'wrong', p26 - .45], [22, GREEN, 'right', p26 + .25], [52, GREY, 'skipped', skips]], t, m2);
      var l2 = pop(t, wend('skip', '26%') + .2, 3);
      g.save(); g.globalAlpha *= clamp(l2 * 2, 0, 1); legend(g, 1266, [['WRONG 26%', REDINK], ['RIGHT 22%', GREEN], ['SKIP 52%', '#8a8273']]); g.restore();
      /* the honest small print */
      var sp2 = pop(t, wend('skip', '26%') + .45, 3);
      g.save(); g.globalAlpha *= clamp(sp2 * 2, 0, 1); txt(g, 'right answers: 24% vs 22%', BARX, 1334, 32, INK, MONO); g.restore();
      g.restore();
    });
    label(g, 'GPT-5 SYSTEM CARD · AUG 2025', 520, 1448 - 18, pop(t, tests), DIM, 30);
  }
  function wrend(tt) { return tt + .55; }
  function legend(g, y, items) {
    var x = BARX; font(g, 30, 500, MONO);
    items.forEach(function (it) { g.fillStyle = it[1]; g.fillRect(x, y - 12, 24, 24); g.fillStyle = INK; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(it[0], x + 34, y + 1); x += g.measureText(it[0]).width + 70; });
  }

  /* =====================================================================================================
     SCENE 10 · one tracker: over 2,000 court cases like this (2,207 on Oct 23, 2026)
     ===================================================================================================== */
  var PILE = (function () { var r = mulberry(23), out = []; for (var i = 0; i < 34; i++) out.push({ x: 540 + (r() - .5) * 400, y: 840 + (r() - .5) * 170, rot: (r() - .5) * .5, ox: (i % 2 ? 1 : -1) * (760 + r() * 300), oy: (r() - .5) * 400 }); return out; })();
  function sinceScene(g, t) {
    var s0 = SC[9].t0, tracker = at('since', 'tracker'), logged = at('since', 'logged'), over = at('since', 'over'), n2000 = at('since', '2000'), cases = at('since', 'cases'), thisW = at('since', 'this');
    var a0 = s0 + .1, a1 = cases + .1;
    var v = 2207 * Math.pow(seg(t, a0, a1), 1.6);
    PILE.forEach(function (p, i) {
      var tt = lerp(a0, a1, Math.pow(i / (PILE.length - 1), .62)); if (t < tt) return;
      var k = eio(seg(t, tt, tt + .32)), x = lerp(p.x + p.ox, p.x, k), y = lerp(p.y + p.oy, p.y, k);
      var num = Math.max(1, Math.round(2207 * Math.pow(seg(tt, a0, a1), 1.6)));
      indexCard(g, x, y, p.rot * k + (1 - k) * .8, .9, 1, function (g, w, h) {
        txt(g, 'CASE', -w / 2 + 24, -h / 2 + 22, 30, INKD, MONO);
        txt(g, '#' + num.toLocaleString('en-US'), -w / 2 + 24, -h / 2 + 76, 48, INK, MONO);
        slam(g, ['AI'], REDINK, 44, 120, 40, t, tt + .2, -.2);
      });
    });
    /* the counter */
    var ck = pop(t, logged - .1, 2.6);
    g.save(); g.globalAlpha *= clamp(ck * 2, 0, 1);
    rr(g, 150, 1050, 780, 190, 30); g.fillStyle = BG; g.fill(); g.strokeStyle = FAINT; g.lineWidth = 3; g.stroke();
    counter(g, v, 540, 1148, 150, t >= a1 ? HOT : CREAM);
    g.restore();
    label(g, 'COURT CASES LIKE THIS', 520, 1290, pop(t, cases - .05), HOT, 34);
    label(g, 'AI HALLUCINATION CASES DATABASE', 520, 1350, pop(t, tracker - .1), CREAM, 30);
    label(g, 'DAMIEN CHARLOTIN · OCT 23, 2026', 520, 1398, pop(t, tracker + .1), DIM, 30);
  }

  /* =====================================================================================================
     SCENE 11 · the end: it always has a next word, even when the answer doesn't exist → frame 0
     ===================================================================================================== */
  function endScene(g, t) {
    var s0 = SC[10].t0, always = at('end', 'always'), nextW = at('end', 'next'), even = at('end', 'even'), answer = at('end', 'answer'), exist = at('end', 'exist');
    var full = (NAME1 + ' ' + NAME2).length;
    var build = eio(seg(t, even - .1, exist + .2));
    var n = full * seg(t, nextW - .05, answer + .1);
    docPage(g, t, { a: 1, head: lerp(.3, 1, build), cite: lerp(.3, 1, build), hl: seg(t, nextW, answer + .2), name: n, caret: t < HOME, busy: n > 0 && n < full, slot: 1 - seg(t, answer, exist + .1), rot: (1 - eio(seg(t, s0, s0 + .6))) * .03, dy: (1 - eio(seg(t, s0, s0 + .6))) * 40 });
    headline(g, t, eio(seg(t, exist - .2, HOME)), 0, 0);
    label(g, 'ALWAYS A NEXT WORD', 520, 1420, win(t, always - .05, even - .2, .2), HOT, 32);
  }

  /* ---------- captions: the narrator's words, highlighted as spoken; the first card is up from frame 0 ---------- */
  /* merge cards that read better as one: the frame-0 claim, a lone dateline, a quoted phrase, a one-word question */
  var CAPS = (function () {
    var MERGE = ['This court case', 'New York,', 'No "I don\'t', 'Blank?', 'AI gets'], out = [];
    VO.captions.forEach(function (c) {
      var prev = out[out.length - 1], ptxt = prev && prev.words.map(function (w) { return w.w; }).join(' ');
      if (prev && MERGE.indexOf(ptxt) > -1) out[out.length - 1] = { t0: prev.t0, t1: c.t1, words: prev.words.concat(c.words) };
      else out.push(c);
    });
    return out;
  })();
  /* only the stressed words get the coral pill; every other word stays plain cream */
  var STRESS = [['hook', 'court'], ['hook', 'case'], ['hook', 'exist'], ['hook', 'chatgpt'], ['name', 'hallucination'], ['six', 'six'], ['six', 'not'], ['six', 'one'],
    ['yes', 'yes'], ['yes', 'doublechecked'], ['gibberish', 'gibberish'], ['fine', '5000'], ['turn', 'lying'], ['turn', 'guessing'], ['button', 'i'], ['button', 'dont'], ['button', 'know'],
    ['test', 'zero'], ['sat', 'quarter'], ['sat', 'point'], ['tested', '75%'], ['skip', '26%'], ['since', '2000'], ['end', 'doesnt'], ['end', 'exist']].map(function (p) { return at(p[0], p[1]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function captions(g, t, alpha) {
    /* one caption layer at a time: each card fades out fully, then 0.12 s of nothing, then the next fades in (0.1 s) */
    var card = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= (i ? c.t0 - .04 : -1e9)) { card = c; ci = i; } });
    if (!card) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card.t1 + .12, ns - .12), o0 = Math.min(card.t1, o1 - .12);
    var fin = ci === 0 ? 1 : seg(t, card.t0 - .04, card.t0 + .06), out = 1 - seg(t, o0, o1);
    if (fin * out <= 0) return;
    var first = ci === 0;
    var k = first ? 1 : clamp(spring(t - card.t0 + .04, 3.2, .8), 0, 1.04);
    g.save(); g.font = '800 80px Archivo'; try { g.fontStretch = 'expanded'; } catch (e) {}
    g.textBaseline = 'alphabetic';
    var words = card.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 24;
    var lines = [[]], lw = [0], maxw = 900;
    words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; });
    var y0 = 360 - (lines.length - 1) * 48;
    g.globalAlpha = fin * out * (alpha == null ? 1 : alpha);
    lines.forEach(function (ln, li) {
      var x = W / 2 - (lw[li] - gap) / 2, y = y0 + li * 96 + (1 - Math.min(1, k)) * 40;
      ln.forEach(function (i) {
        var w = words[i], nw = words[i + 1], cur = stressed(w) && t >= w.t0 - .03 && t < Math.min(w.t1 + .05, nw ? nw.t0 - .03 : 1e9);
        if (cur) { g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 12, y - 70, ws[i] + 24, 92, 18); g.fill(); }
        g.fillStyle = cur ? BG : CREAM;
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SCENES = [hookScene, storyScene, chatScene, judgeScene, turnScene, guessScene, buttonScene, testScene, chartScene, sinceScene, endScene];
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(60,48,58,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    drift(g, t, 1);
    var si = sceneAt(t), S = SC[si];
    /* scene changes are the caret: a coral caret bar sweeps across and takes the old scene with it */
    var sel = si + 1 < SC.length ? seg(t, S.t1 - .3, S.t1 - .02) : 0;
    var inK = si > 0 ? eo(seg(t, S.t0, S.t0 + .35)) : 1;
    g.save();
    var push = 1 + .03 * seg(t, S.t0, S.t1), cy = 1000;
    g.translate(540, cy); g.scale(push * lerp(.96, 1, inK), push * lerp(.96, 1, inK)); g.translate(-540, -cy);
    SCENES[si](g, t);
    g.restore();
    if (sel > 0) {
      var x1 = lerp(-40, 1120, eio(sel));
      g.save(); g.beginPath(); g.rect(0, 470, x1, 1060); g.clip(); stage(g); drift(g, t, 1); g.restore();
      g.save(); g.fillStyle = HOT; rr(g, x1 - 9, 470, 18, 1060, 9); g.fill(); g.restore();
    }
    /* the loop: the end dissolves back into frame 0 */
    var back = eio(seg(t, HOME, HOME + .35));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g); drift(g, t - DUR, 1); hookScene(g, 0, t - DUR); g.restore(); }   // phase-locked: the last frame is frame 0
    STAMPS.forEach(function (s) { stamp(g, s[0], s[6], s[7], t, s[1], s[2], s[3], s[4], s[5]); });
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) { if (back > 0) { captions(g, t, 1 - back); captions(g, 0, back); } else captions(g, t); }

    if (!POSTERMODE) {
      g.fillStyle = 'rgba(244,237,224,.12)'; g.fillRect(60, 140, W - 120, 6);
      g.fillStyle = HOT; g.fillRect(60, 140, (W - 120) * (back > 0 ? 1 - back : t / DUR), 6);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

  var POSTERMODE = false;
  function posterTitle(g) {
    g.save(); font(g, 80, 800); try { g.fontStretch = 'expanded'; } catch (e) {} g.textBaseline = 'alphabetic';
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText('Why AI makes', 540, 320);
    var a = 'things ', b = 'up', wa = g.measureText(a).width, wb = g.measureText(b).width, x = 540 - (wa + wb) / 2;
    g.textAlign = 'left'; g.fillText(a, x, 420); g.fillStyle = HOT; g.beginPath(); g.roundRect(x + wa - 12, 420 - 68, wb + 24, 92, 18); g.fill();
    g.fillStyle = BG; g.fillText(b, x + wa, 420); g.restore();
  }
  function TEXTS(t) {
    var out = [];
    STAMPS.forEach(function (s, i) { if (t >= s[1] + .2 && t < s[2]) out.push({ id: 'stamp' + i, text: s[0], x0: 0, y0: 0, x1: 0, y1: 0 }); });
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [];
  function initTimes() {
    var i;
    STAMPS.push(['NO SUCH CASE', wend('yes', 'doublechecked') + .2, at('gibberish', 'gibberish') - .5, 66, REDINK, -.05, 540, 1382]);
    /* hook */
    EV.push({ t: at('hook', 'exist') + .04, type: 'stamp', big: true });
    EV.push({ t: at('hook', 'chatgpt') - .05, type: 'stick' });
    EV.push({ t: at('hook', 'made') - .05, type: 'scratch' }, { t: at('hook', 'made') + .1, type: 'scratch' });
    EV.push({ t: at('name', 'hallucination'), type: 'pop', g: .7 });
    EV.push({ t: at('name', 'filed') + .05, type: 'stamp' }, { t: at('name', 'federal'), type: 'swish' });
    EV.push({ t: start('why') + .05, type: 'peel' });
    for (i = 0; i < 12; i++) EV.push({ t: lerp(start('why') + .05, at('why', 'things'), i / 11), type: 'key', f: hash(i + 10), g: .25 });
    for (i = 0; i < 18; i++) EV.push({ t: lerp(at('why', 'up') - .05, at('why', 'sure') - .1, i / 17), type: 'key', f: hash(i + 30), g: .45 });
    EV.push({ t: at('why', 'sure'), type: 'ding1' });
    /* story */
    EV.push({ t: at('story', 'new') - .05, type: 'pop' }, { t: at('story', '2023') - .05, type: 'thump', g: .35 });
    EV.push({ t: SC[1].t0 + .1, type: 'fly', t1: at('story', 'cases') + .6 });
    EV.push({ t: at('story', 'asks') - .05, type: 'pen', t1: at('story', 'chatgpt') }, { t: at('story', 'chatgpt'), type: 'pen', t1: at('story', 'cases') + .1 });
    EV.push({ t: at('story', 'chatgpt') - .1, type: 'pop', g: .6 });
    for (i = 0; i < 6; i++) EV.push({ t: at('six', 'six') - .2 + i * .11, type: 'paper' });
    for (i = 0; i < 6; i++) EV.push({ t: at('six', 'judges') + i * .05, type: 'tick', g: .2 }, { t: at('six', 'quotes') + i * .05, type: 'blip', f: 900 + i * 60, g: .05 });
    [0, .3, .52, .7, .84, .96].forEach(function (k) { EV.push({ t: lerp(at('six', 'not'), at('six', 'exists') + .15, k), type: 'stamp' }); });
    /* chat */
    var isW = at('asked', 'is'), caseE = wend('asked', 'case');
    for (i = 0; i < 8; i++) EV.push({ t: lerp(isW - .05, caseE, i / 7), type: 'key', f: hash(i + 60), g: .4 });
    EV.push({ t: caseE + .05, type: 'send' });
    EV.push({ t: at('yes', 'yes') - .05, type: 'recv' }, { t: at('yes', 'then') - .32, type: 'send' }, { t: at('yes', 'said', 1) - .1, type: 'recv' });
    EV.push({ t: at('yes', 'doublechecked'), type: 'stamp', small: true }, { t: wend('yes', 'doublechecked') + .2, type: 'stamp', big: true });
    /* judge */
    EV.push({ t: at('gibberish', 'gibberish') - .02, type: 'gavel' });
    EV.push({ t: at('fine', 'fined') - .2, type: 'paper' }, { t: at('fine', 'fined'), type: 'roll', t1: at('fine', '5000') + .35 }, { t: end('fine') + .08, type: 'ding' });
    /* turn */
    EV.push({ t: at('turn', 'lying') - .1, type: 'thump', g: .4 }, { t: wend('turn', 'lying') - .05, type: 'strike' }, { t: at('turn', 'guessing') + .1, type: 'drop' });
    /* guess */
    EV.push({ t: SC[5].t0 + .2, type: 'tick', g: .3 });
    for (i = 1; i < 6; i++) { var st = lerp(at('guess', 'guesses'), end('guess') - .1, (i - 1) / 4); EV.push({ t: st - .45, type: 'tick', g: .12 }, { t: st, type: 'drop', g: .5 }); }
    EV.push({ t: at('looks', 'to') - .1, type: 'swish' });
    for (i = 0; i < 7; i++) EV.push({ t: at('looks', 'to') - .1 + i * .07, type: 'tick', g: .14 }, { t: at('looks', 'looks') - .1 + i * .07, type: 'tick', g: .14 });
    EV.push({ t: at('looks', 'fake') + .05, type: 'stamp' }, { t: at('looks', 'real') + .05, type: 'ding1', f: 1 });
    /* button */
    EV.push({ t: at('button', 'next') + .1, type: 'drop' }, { t: at('button', 'button') - .05, type: 'buzz' });
    EV.push({ t: at('catch', 'trained') - .05, type: 'ding1', f: 1 }, { t: at('catch', 'one') - .05, type: 'click' }, { t: at('catch', 'one') + .2, type: 'drop', g: .7 });
    EV.push({ t: at('catch', 'catch') - .1, type: 'swing' });
    /* test */
    EV.push({ t: SC[7].t0 + .05, type: 'paper' });
    for (i = 0; i < 8; i++) EV.push({ t: at('test', 'multiplechoice') - .1 + i * .05, type: 'tick', g: .1 });
    EV.push({ t: at('test', 'zero') - .05, type: 'buzz' });
    EV.push({ t: at('learn', 'guess') + .1, type: 'pencil' }, { t: at('learn', 'right') - .05, type: 'ding1' });
    [0, .07, .14, .21].forEach(function (d) { EV.push({ t: at('learn', 'learn') + d, type: 'pencil' }); });
    EV.push({ t: at('learn', 'guess', 1) + .25, type: 'pencil' });
    EV.push({ t: at('sat', 'sat') - .1, type: 'paper', g: 1.6 }, { t: at('sat', 'sat') + .02, type: 'stick' });
    [0, .2, .3].forEach(function (d) { EV.push({ t: at('sat', 'wrong') + d, type: 'tick', g: .3 }); });
    EV.push({ t: at('sat', 'fix'), type: 'tick', g: .3 }, { t: at('sat', 'fix') + .15, type: 'tick', g: .2 });
    EV.push({ t: at('sat', 'quarter') - .05, type: 'mark' });
    /* chart */
    EV.push({ t: SC[8].t0 + .05, type: 'paper' }, { t: at('tested', '75%') - .45, type: 'rise', t1: at('tested', '75%') }, { t: at('tested', '75%'), type: 'thump', g: .45 });
    EV.push({ t: at('skip', 'skips'), type: 'rise', t1: at('skip', 'skips') + .45 }, { t: at('skip', '26%') - .45, type: 'rise', t1: at('skip', '26%') }, { t: at('skip', '26%'), type: 'ding' });
    /* since */
    PILE.forEach(function (p, j) { var tt = lerp(SC[9].t0 + .1, at('since', 'cases') + .1, Math.pow(j / (PILE.length - 1), .62)); EV.push({ t: tt + .25, type: 'paper', g: .5 }); });
    EV.push({ t: at('since', 'cases') + .12, type: 'thump', g: .5 });
    /* end */
    var full = (NAME1 + ' ' + NAME2).length, k0 = at('end', 'next') - .05, k1 = at('end', 'answer') + .1;
    for (i = 0; i < 22; i++) EV.push({ t: lerp(k0, k1, i / 21), type: 'key', f: hash(i + 120), g: .4 });
    EV.push({ t: end('end') + .05, type: 'tick', g: .2 });
    SC.forEach(function (s, i) { if (i) EV.push({ t: s.t0 - .3, type: 'select' }); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { POSTERMODE = t === window.FILM.POSTER; frame(ctx, t); POSTERMODE = false; return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- sound: foley cut to the word times; no music (Isac adds a TikTok sound) ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.1), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .16; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }

    function key(t, f, g) { var o = bus(1, .05, (f - .5) * .6), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400 + f * 1800; bp.Q.value = 3; var n = noise(t, .04); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, (g || 1) * .3], [t + .03, 0]]); osc('sine', 180 + f * 60, t, t + .05, 1, [[t, 0], [t + .002, (g || 1) * .12], [t + .04, 0]]); }
    function tickS(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .22], [t + .025, 0]]); }
    function blip(t, f, g) { var o = osc('sine', f, t, t + .12, 1, [[t, 0], [t + .004, g || .09], [t + .1, 0]], .3, clamp((f - 1100) / 1400, -1, 1)); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + .07); }
    function ding(t) { [76, 83, 88].forEach(function (m, j) { osc('sine', mtof(m), t + j * .04, t + 1.2, 1, [[t + j * .04, 0], [t + j * .04 + .005, .08], [t + 1.1, 0]], .5, (j - 1) * .4); }); }
    function ding1(t, hi) { osc('sine', mtof(hi ? 81 : 76), t, t + .7, 1, [[t, 0], [t + .005, .07], [t + .6, 0]], .4); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, 1, [[t, 0], [t + .004, g || .4], [t + .26, 0]], .1); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t - .12, t + .14, 900, 5200, .12, .02, 1.6); }
    /* a rubber stamp: a dull thud of rubber on paper on a desk, and a short paper slap */
    function stampS(t, big, small) { thump(t, big ? .65 : small ? .32 : .45); var n = noise(t, .16), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1500; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .45 : small ? .2 : .32], [t + .12, 0]]); tickS(t + .005, .18); }
    function buzz(t) { osc('square', 110, t, t + .3, 1, [[t, 0], [t + .01, .04], [t + .26, .04], [t + .3, 0]], .05); osc('square', 116, t, t + .3, 1, [[t, 0], [t + .01, .035], [t + .26, .035], [t + .3, 0]], .05); }
    function paper(t, g) { g = g || 1; band(t - .03, t + .12, 1800, 3800, .07 * g, .02, 1.2, (rnd() - .5) * .8); tickS(t + .1, .08 * g); }
    function flip(t) { band(t, t + .18, 2000, 5000, .1, .02, 2); tickS(t + .16, .25); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function scratch(t) { band(t, t + .09, 2500, 4200, .05, .03, 3, (rnd() - .5) * .6); }
    function pen(t, t1) { var n = Math.max(2, Math.floor((t1 - t) / .07)); for (var j = 0; j < n; j++) band(t + j * (t1 - t) / n, t + j * (t1 - t) / n + .06, 2800 + rnd() * 1200, 3600, .035, .02, 3, -.3); }
    function pencilS(t) { for (var j = 0; j < 5; j++) band(t + j * .025, t + j * .025 + .04, 3200, 4600, .05, .03, 4, .2); }
    function stick(t) { band(t, t + .08, 600, 1400, .1, .02, 1); thump(t + .02, .2); }
    function peel(t) { band(t, t + .3, 1200, 5200, .06, .02, 2); }
    function fly(t, t1) { band(t, t1, 300, 700, .015, .03, 1.2, -.4); }
    function send(t) { var o = osc('sine', 660, t, t + .2, 1, [[t, 0], [t + .005, .06], [t + .16, 0]], .2); o.frequency.exponentialRampToValueAtTime(1320, t + .12); }
    function recv(t) { var o = osc('sine', 990, t, t + .25, 1, [[t, 0], [t + .005, .06], [t + .2, 0]], .25); o.frequency.exponentialRampToValueAtTime(700, t + .18); }
    function mark(t) { band(t, t + .25, 2000, 3500, .05, .03, 2); }
    /* the gavel: a wooden knock (two damped partials) and a thud */
    function gavel(t) { osc('sine', 420, t, t + .2, 1, [[t, 0], [t + .002, .3], [t + .15, 0]], .3); osc('sine', 1130, t, t + .1, 1, [[t, 0], [t + .002, .12], [t + .07, 0]], .3); thump(t, .6); tickS(t, .4); }
    function roll(t, t1) { var n = 16; for (var j = 0; j < n; j++) tickS(lerp(t, t1, Math.pow(j / n, .8)), .07); }
    function strike(t) { band(t, t + .28, 1500, 6000, .1, .05, 2.2); }
    function drop(t, g) { g = g || 1; thump(t, .35 * g); tickS(t, .3 * g); }
    function click(t) { tickS(t, .5); thump(t, .3); tickS(t + .08, .25); }
    function swing(t) { band(t, t + .45, 700, 1600, .05, .02, 2); tickS(t + .45, .2); }
    function rise(t, t1) { band(t, t1, 400, 1800, .03, .06, 3); }
    EV.forEach(function (e) {
      if (e.type === 'key') key(e.t, e.f == null ? .5 : e.f, e.g);
      else if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'blip') blip(e.t, e.f, e.g);
      else if (e.type === 'ding') ding(e.t);
      else if (e.type === 'ding1') ding1(e.t, e.f);
      else if (e.type === 'thump') thump(e.t, e.g);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'stamp') stampS(e.t, e.big, e.small);
      else if (e.type === 'buzz') buzz(e.t);
      else if (e.type === 'paper') paper(e.t, e.g);
      else if (e.type === 'flip') flip(e.t);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'scratch') scratch(e.t);
      else if (e.type === 'pen') pen(e.t, e.t1);
      else if (e.type === 'pencil') pencilS(e.t);
      else if (e.type === 'stick') stick(e.t);
      else if (e.type === 'peel') peel(e.t);
      else if (e.type === 'fly') fly(e.t, e.t1);
      else if (e.type === 'send') send(e.t);
      else if (e.type === 'recv') recv(e.t);
      else if (e.type === 'mark') mark(e.t);
      else if (e.type === 'gavel') gavel(e.t);
      else if (e.type === 'roll') roll(e.t, e.t1);
      else if (e.type === 'strike') strike(e.t);
      else if (e.type === 'drop') drop(e.t, e.g);
      else if (e.type === 'click') click(e.t);
      else if (e.type === 'swing') swing(e.t);
      else if (e.type === 'rise') rise(e.t, e.t1);
      else if (e.type === 'select') band(e.t, e.t + .28, 1200, 3000, .05, .07, 2);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    key(DUR - .35, .5, .8);
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −50 dB, under the whole film so the silent tail (and the loop seam) is never digital zero:
       auto-captions invent words in true silence */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5;
      var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .021; })();
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['800 84px Archivo', '700 46px Archivo', '900 46px Archivo', '600 46px Archivo', '500 46px Archivo', '500 30px "Geist Mono"', 'italic 400 96px "Instrument Serif"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈¼“”·'); })).then(function () { return document.fonts.ready; }).then(function () { STEX = {}; window.READY = true; });
  }
  initTimes();
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: at('hook', 'exist') + .9, SLUG: 'hallucinate', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
