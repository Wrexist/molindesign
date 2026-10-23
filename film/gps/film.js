/* "GPS" — how your phone knows where you are. Factory #4 on Tech, explained, after ../hallucinate/.
   A vertical explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time
   from vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t. Contract: window.FILM,
   DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). The native move is the compass circle: a drafting compass swings one
   distance circle per satellite until the circles agree. Built from flat, hand-drawn things (a phone with a drawn map,
   a foil satellite, LCD clock cards, a printed ticket, a stopwatch, a wooden ruler, wall clocks, a speedometer, an
   adding-machine tape, a tape measure, a quote card, a toggle switch, a tear-off calendar): the channel must not look
   AI-made. Facts: BRIEF.md. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur;
  var BG = '#15131b', PANEL = '#221f2b', PANEL2 = '#2c2838', CREAM = '#f4ede0', DIM = 'rgba(244,237,224,.5)', FAINT = 'rgba(244,237,224,.14)';
  var HOT = '#ff5b3d', YEL = '#ffc83d', MINT = '#3fd6a2', DOT = '#2f7bff';
  var BLUEINK = '#3450c4', PAPER = '#f1e9d8', INK = '#211d26', INKD = 'rgba(33,29,38,.62)', REDINK = '#d8332b', GRAPH = '#3b3a44', WOOD = '#d7ad68', WOODD = '#a87a3a';
  var GOLD = '#d6a043', GOLDD = '#a8762a', PANELB = '#2b4f8e', PANELL = '#4f78bd';
  var DISP = 'Archivo', MONO = '"Geist Mono"', SERIF = '"Instrument Serif"';

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
    { id: 'hook', name: 'Clocks in space', t0: 0 },
    { id: 'sky', name: '30 satellites', t0: start('sky') - .3 },
    { id: 'say', name: 'Two things', t0: start('say') - .3 },
    { id: 'listen', name: 'It only listens', t0: start('listen') - .3 },
    { id: 'math', name: 'Time × light', t0: start('math') - .3 },
    { id: 'three', name: 'Three circles', t0: start('three') - .3 },
    { id: 'catch', name: 'A foot a nanosecond', t0: start('catch') - .3 },
    { id: 'fourth', name: 'The fourth', t0: start('fourth') - .3 },
    { id: 'weird', name: 'The weird part', t0: start('weird') - .3 },
    { id: 'net', name: '38 millionths', t0: start('net') - .3 },
    { id: 'miles', name: 'Seven miles', t0: at('miles', 'seven') - .4 },
    { id: 'doubt', name: '1977', t0: start('doubt') - .02 },
    { id: 'switch', name: 'Fix off', t0: start('switch') - .15 },
    { id: 'result', name: 'Twenty days', t0: start('result') - .3 },
    { id: 'fixed', name: 'Corrected', t0: start('fixed') - .3 },
    { id: 'feet', name: '16 feet', t0: at('feet', 'phone') - .3 },
    { id: 'end', name: 'The blue dot', t0: start('end') - .35 }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
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
  function ls(g, px) { try { g.letterSpacing = px + 'px'; } catch (e) {} }
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
  function label(g, text, x, y, a, col, px, align) {
    px = Math.max(36, px || 36);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillStyle = col || DIM; ls(g, 4);
    g.fillText(text, x, y + (1 - Math.min(1, a)) * 14); g.restore();
  }
  function txt(g, s, x, y, px, col, fam, align, wt) {
    if (fam === 'serif') serif(g, px); else font(g, px, wt || (fam === MONO ? 500 : 700), fam || DISP);
    g.textAlign = align || 'left'; g.textBaseline = 'middle'; g.fillStyle = col || INK; g.fillText(s, x, y);
    return g.measureText(s).width;
  }
  function tick(g, x, y, s, col, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.strokeStyle = col || MINT; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-20, 0); g.lineTo(-6, 15); g.lineTo(22, -16); g.stroke(); g.restore();
  }
  function cross(g, x, y, s, col, a, lw) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.strokeStyle = col || HOT; g.lineWidth = lw || 12; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-26, -26); g.lineTo(26, 26); g.moveTo(26, -26); g.lineTo(-26, 26); g.stroke(); g.restore();
  }
  function arrow(g, x0, y0, x1, y1, k, col, lw, head) {
    if (k <= 0) return;
    var x = lerp(x0, x1, k), y = lerp(y0, y1, k), a = Math.atan2(y1 - y0, x1 - x0), hd = head || 34;
    g.save(); g.strokeStyle = g.fillStyle = col; g.lineWidth = lw || 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x - Math.cos(a) * hd * .5, y - Math.sin(a) * hd * .5); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a - .45) * hd, y - Math.sin(a - .45) * hd); g.lineTo(x - Math.cos(a + .45) * hd, y - Math.sin(a + .45) * hd); g.closePath(); g.fill();
    g.restore();
  }
  function dashLine(g, x0, y0, x1, y1, t, col, lw, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.strokeStyle = col || DIM; g.lineWidth = lw || 4; g.setLineDash([14, 12]); g.lineDashOffset = -t * 40;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore();
  }
  function sheet(g, x, y, w, h, rot, a, fn, col, s) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0); if (s) g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(-w / 2 + 12, -h / 2 + 18, w, h);
    g.fillStyle = col || PAPER; g.fillRect(-w / 2, -h / 2, w, h);
    g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(-w / 2, h / 2 - 6, w, 6);
    if (fn) fn(g, w, h);
    g.restore();
  }
  function wrap(g, s, maxW) {
    var words = s.split(' '), lines = [], cur = '';
    words.forEach(function (w) { var tryS = cur ? cur + ' ' + w : w; if (g.measureText(tryS).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryS; });
    if (cur) lines.push(cur); return lines;
  }
  function fitPx(g, s, px, maxW, setFont) { setFont(px); var w = g.measureText(s).width; if (w <= maxW) return px; var p = Math.max(30, Math.floor(px * maxW / w)); setFont(p); return p; }

  /* ---------- rubber stamps: worn ink (seeded speckle), slammed ---------- */
  var STEX = {};
  function stampTex(lines, col, px) {
    var key = lines.join('|') + col + px; if (STEX[key]) return STEX[key];
    var m = mk(4, 4).getContext('2d'); font(m, px, 900);
    var sub = lines.length > 1 ? .5 : 1, lw = 0;
    lines.forEach(function (s, i) { font(m, i ? Math.round(px * sub) : px, 900); ls(m, 2); lw = Math.max(lw, m.measureText(s).width); });
    var pad = px * .45, h = px * 1.25 + (lines.length - 1) * px * .62, w = lw + pad * 2, c = mk(Math.ceil(w + 16), Math.ceil(h + 16)), g = c.getContext('2d');
    g.translate(8, 8); g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = Math.max(4, px * .085); rr(g, 2, 2, w - 4, h - 4, px * .14); g.stroke();
    g.lineWidth = Math.max(2, px * .03); rr(g, px * .14, px * .14, w - px * .28, h - px * .28, px * .08); g.stroke();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach(function (s, i) { font(g, i ? Math.round(px * sub) : px, 900); ls(g, 2); g.fillText(s, w / 2, i ? px * .66 + px * 1.25 / 2 + (i - 1) * px * .62 + px * .1 : px * 1.25 / 2 + px * .05); });
    var r = mulberry(strHash(key)), n = Math.floor(w * h / 140);
    g.globalCompositeOperation = 'destination-out';
    for (var i = 0; i < n; i++) { g.globalAlpha = .35 + r() * .65; g.beginPath(); g.arc(r() * w, r() * h, .6 + r() * 1.9, 0, 6.283); g.fill(); }
    var lg = g.createLinearGradient(0, 0, w, h); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(.75, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,.45)');
    g.globalAlpha = 1; g.fillStyle = lg; g.fillRect(-8, -8, w + 16, h + 16);
    c.w = w + 16; c.h = h + 16; STEX[key] = c; return c;
  }
  function slam(g, lines, col, px, x, y, t, t0, rot, a, t1) {
    if (t < t0) return 0;
    var k = sp(t, t0, 3.2, .8), s = lerp(1.35, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (a == null ? 1 : a) * (t1 ? 1 - seg(t, t1, t1 + .3) : 1);
    if (al <= 0) return 0;
    var c = stampTex(lines, col, px);
    g.save(); g.globalAlpha *= al; g.translate(x, y); g.rotate(rot || 0); g.scale(s, s); g.drawImage(c, -c.w / 2, -c.h / 2); g.restore();
    return k;
  }
  function stamp(g, text, x, y, t, t0, t1, px, col, rot) {
    if (t < t0 || t > t1 + .3) return;
    var c = stampTex([text], col, px);
    var k = sp(t, t0, 3.2, .8), s = lerp(1.35, 1, clamp(k, 0, 1)), al = clamp(k * 3, 0, 1) * (1 - seg(t, t1, t1 + .3));
    g.save(); g.globalAlpha = al; g.translate(x, y); g.rotate(rot == null ? -.1 : rot); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-c.w / 2 - 4, -c.h / 2 + 10, c.w + 8, c.h);
    g.fillStyle = PAPER; g.fillRect(-c.w / 2 - 14, -c.h / 2 - 4, c.w + 8, c.h + 8);
    g.drawImage(c, -c.w / 2 - 10, -c.h / 2); g.restore();
  }

  /* ---------- objects ---------- */
  /* a flat satellite: gold foil body, two blue solar wings, an antenna face pointing at Earth */
  function satellite(g, x, y, s, a, rot, o) {
    if (a <= 0 || s <= 0) return;
    o = o || {};
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.strokeStyle = '#8d8796'; g.lineWidth = 8; g.beginPath(); g.moveTo(-200, 0); g.lineTo(200, 0); g.stroke();
    [-1, 1].forEach(function (side) {
      var x0 = side < 0 ? -212 : 82;
      g.fillStyle = PANELB; g.fillRect(x0, -40, 130, 80);
      g.strokeStyle = PANELL; g.lineWidth = 2;
      for (var k = 1; k < 5; k++) { g.beginPath(); g.moveTo(x0 + k * 26, -40); g.lineTo(x0 + k * 26, 40); g.stroke(); }
      g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 130, 0); g.stroke();
      g.strokeStyle = '#1b2f57'; g.lineWidth = 3; g.strokeRect(x0, -40, 130, 80);
    });
    rr(g, -56, -64, 112, 128, 10); g.fillStyle = o.body || GOLD; g.fill();
    /* foil crinkles */
    g.fillStyle = o.bodyD || GOLDD; var r = mulberry(o.seed || 5);
    for (var i = 0; i < 7; i++) { var yy = -56 + i * 17 + r() * 6; g.beginPath(); g.moveTo(-50, yy); g.lineTo(-10 + r() * 30, yy + 4 + r() * 5); g.lineTo(50, yy + r() * 4); g.lineTo(50, yy + 3); g.lineTo(-50, yy + 4); g.closePath(); g.fill(); }
    /* the Earth-facing L-band antenna: a white plate with a ring of helix elements */
    g.fillStyle = CREAM; rr(g, -48, 62, 96, 30, 5); g.fill();
    g.fillStyle = '#8d8796'; for (var k2 = 0; k2 < 6; k2++) { g.beginPath(); g.arc(-38 + k2 * 15.2, 77, 5, 0, 6.283); g.fill(); }
    g.fillStyle = '#6d6876'; for (k2 = 0; k2 < 6; k2++) g.fillRect(-40 + k2 * 15.2, 92, 5, 10);
    /* a radiator panel and a small dish on the body: GPS-shaped, not clip-art */
    g.fillStyle = 'rgba(244,237,224,.85)'; g.fillRect(-46, -50, 24, 60);
    g.strokeStyle = '#8d8796'; g.lineWidth = 2; for (k2 = 1; k2 < 6; k2++) { g.beginPath(); g.moveTo(-46, -50 + k2 * 10); g.lineTo(-22, -50 + k2 * 10); g.stroke(); }
    g.fillStyle = CREAM; g.beginPath(); g.ellipse(30, -78, 18, 8, 0, 0, 6.283); g.fill(); g.fillStyle = '#8d8796'; g.fillRect(28, -72, 4, 10);
    if (o.label) { font(g, 30, 700, MONO); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.label, 0, 0); }
    g.restore();
  }
  /* an LCD clock card: label, and digits where the ones that differ from `ref` go coral */
  function clockCard(g, x, y, w, lab, digits, ref, a, o) {
    if (a <= 0) return;
    o = o || {}; var h = o.h || 132;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot);
    rr(g, -w / 2, -h / 2, w, h, 20); g.fillStyle = PANEL; g.fill(); g.strokeStyle = o.edge || FAINT; g.lineWidth = 3; g.stroke();
    font(g, 30, 500, MONO); ls(g, 3); g.fillStyle = o.labCol || DIM; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(lab, -w / 2 + 26, -h / 2 + 34); ls(g, 0);
    var px = o.px || 44; font(g, px, 600, MONO); while (g.measureText('0').width * digits.length > w - 44 && px > 30) { px--; font(g, px, 600, MONO); } var cw = g.measureText('0').width, x0 = -cw * digits.length / 2;
    for (var i = 0; i < digits.length; i++) {
      var hot = ref && ref[i] !== digits[i];
      g.fillStyle = hot ? HOT : CREAM; g.textAlign = 'center'; g.fillText(digits[i], x0 + cw * (i + .5), h / 2 - 40);
    }
    g.restore();
  }
  /* the clock reading at film time t: 12:00:0s.mmm uuu (+ extra microseconds) */
  function clockStr(t, extraUs) {
    var us = Math.floor((7.25 + t) * 1e6) + (extraUs || 0), s = Math.floor(us / 1e6), f = us - s * 1e6;
    var ms = Math.floor(f / 1000), u = f - ms * 1000, mm = Math.floor(s / 60), ss2 = s - mm * 60;
    function p(n, k) { n = String(n); while (n.length < k) n = '0' + n; return n; }
    return '12:' + p(mm, 2) + ':' + p(ss2, 2) + '.' + p(ms, 3) + ' ' + p(u, 3);
  }
  /* the street map (drawn, no app chrome): map-space origin = the blue dot */
  var STREETS = (function () {
    var r = mulberry(41), v = [], hz = [];
    var x = -900; while (x < 900) { v.push(x); x += 95 + r() * 90; }
    var y = -1100; while (y < 1100) { hz.push(y); y += 100 + r() * 85; }
    return { v: v, h: hz, minor: Array.from({ length: 40 }, function () { return [(r() - .5) * 1800, (r() - .5) * 2200, r() < .5]; }) };
  })();
  function mapView(g, x0, y0, w, h, dx, dy, z, t) {
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    g.fillStyle = '#ece5d3'; g.fillRect(x0, y0, w, h);
    g.translate(x0 + w / 2 + dx, y0 + h / 2 + dy); g.scale(z, z);
    /* park and river */
    g.fillStyle = '#cbdcae'; g.fillRect(-310, -520, 260, 230); g.fillRect(120, 260, 210, 300);
    g.strokeStyle = '#a9cde6'; g.lineWidth = 70; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-900, 640); g.bezierCurveTo(-300, 480, 100, 900, 900, 720); g.stroke();
    /* blocks get faint buildings */
    g.fillStyle = 'rgba(160,148,120,.18)';
    STREETS.minor.forEach(function (m) { g.fillRect(m[0], m[1], m[2] ? 60 : 40, m[2] ? 40 : 70); });
    function road(wd, col, fn) { g.strokeStyle = col; g.lineWidth = wd; g.lineCap = 'butt'; g.beginPath(); fn(); g.stroke(); }
    var all = function () { STREETS.v.forEach(function (x) { g.moveTo(x, -1200); g.lineTo(x, 1200); }); STREETS.h.forEach(function (y) { g.moveTo(-1000, y); g.lineTo(1000, y); }); };
    road(22, '#d6ccb4', all); road(16, '#ffffff', all);
    var ave = function () { g.moveTo(-1000, 820); g.lineTo(1000, -900); };
    road(34, '#d9b75c', ave); road(26, '#f3d27a', ave);
    g.restore();
  }
  function blueDot(g, x, y, t, s, a) {
    if (a <= 0) return;
    s = s || 1;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    var ph = (t * .75) % 1;
    g.fillStyle = 'rgba(47,123,255,.16)'; g.beginPath(); g.arc(x, y, 48 * s, 0, 6.283); g.fill();
    g.strokeStyle = 'rgba(47,123,255,' + (.55 * (1 - ph)) + ')'; g.lineWidth = 4 * s; g.beginPath(); g.arc(x, y, (18 + 40 * ph) * s, 0, 6.283); g.stroke();
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x + 2 * s, y + 4 * s, 19 * s, 0, 6.283); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 19 * s, 0, 6.283); g.fill();
    g.fillStyle = DOT; g.beginPath(); g.arc(x, y, (13 + Math.sin(t * 4) * .8) * s, 0, 6.283); g.fill();
    g.restore();
  }
  /* a phone: body, notch, and the map with the blue dot at map-space origin */
  function phone(g, cx, cy, w, h, t, o) {
    o = o || {}; var a = o.a == null ? 1 : o.a; if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(cx, cy); if (o.rot) g.rotate(o.rot);
    var R = w * .14;
    g.fillStyle = 'rgba(0,0,0,.4)'; rr(g, -w / 2 + 10, -h / 2 + 16, w, h, R); g.fill();
    rr(g, -w / 2, -h / 2, w, h, R); g.fillStyle = '#0d0c11'; g.fill(); g.strokeStyle = '#4a4555'; g.lineWidth = 4; g.stroke();
    var b = Math.max(8, w * .04), sx = -w / 2 + b, sy = -h / 2 + b, sw = w - 2 * b, sh = h - 2 * b;
    g.save(); rr(g, sx, sy, sw, sh, R * .78); g.clip();
    if (o.screen) o.screen(g, sx, sy, sw, sh);
    else {
      var z = o.zoom || 1, mdx = o.mdx || 0, mdy = o.mdy || 0;
      mapView(g, sx, sy, sw, sh, mdx, mdy, z * w / 330, t);
      var dx = sx + sw / 2 + mdx, dy = sy + sh / 2 + mdy;
      if (o.inner) o.inner(g, dx, dy, z * w / 330);
      blueDot(g, dx, dy, t, (o.dotS || 1) * w / 330, o.dot == null ? 1 : o.dot);
    }
    g.restore();
    rr(g, -w * .14, -h / 2 + b + 8, w * .28, Math.max(10, w * .065), 99); g.fillStyle = '#0d0c11'; g.fill();
    g.restore();
  }
  /* Earth, flat: ocean disc with a few drawn land masses drifting round */
  var LAND = (function () { var r = mulberry(77), out = []; for (var i = 0; i < 6; i++) { var pts = [], n = 9, cx = r() * 2, cy = (r() - .5) * 1.3, rad = .22 + r() * .3; for (var k = 0; k < n; k++) { var an = k / n * 6.283, rr2 = rad * (.65 + r() * .55); pts.push([Math.cos(an) * rr2, Math.sin(an) * rr2 * .8]); } out.push({ x: cx, y: cy, p: pts }); } return out; })();
  function earth(g, x, y, r, t, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fillStyle = '#23466a'; g.fill();
    g.save(); g.clip();
    g.fillStyle = '#7fa66d';
    LAND.forEach(function (L) {
      for (var rep = -1; rep <= 1; rep++) {
        var lx = x + ((((L.x + t * .02) % 2) + 2) % 2 - 1 + rep * 2) * r, ly = y + L.y * r;
        g.beginPath(); L.p.forEach(function (p, k) { var px = lx + p[0] * r, py = ly + p[1] * r; if (k) g.lineTo(px, py); else g.moveTo(px, py); }); g.closePath(); g.fill();
      }
    });
    /* night side, flat */
    g.fillStyle = 'rgba(10,10,20,.28)'; g.beginPath(); g.arc(x + r * .55, y + r * .2, r * 1.05, 0, 6.283); g.fill();
    g.restore();
    g.strokeStyle = 'rgba(244,237,224,.3)'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.stroke();
    g.restore();
  }
  /* the constellation: six orbit planes, five satellites each, Earth to scale (orbit radius 4.17 Earth radii) */
  var PLANES = [[-.95, .2], [-.55, .42], [-.15, .3], [.25, .5], [.65, .26], [1.05, .38]];
  function constellation(g, cx, cy, R, er, t, a, o) {
    if (a <= 0) return;
    o = o || {};
    var sats = [];
    PLANES.forEach(function (p, i) {
      for (var j = 0; j < 5; j++) {
        var ph = t * .16 + j * 6.283 / 5 + i * .9, ex = Math.cos(ph) * R, ey = Math.sin(ph) * R * p[1];
        var c = Math.cos(p[0]), s = Math.sin(p[0]);
        sats.push({ x: cx + ex * c - ey * s, y: cy + ex * s + ey * c, back: Math.sin(ph) < 0, i: i * 5 + j });
      }
    });
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    var ok = o.orbits == null ? 1 : o.orbits;
    PLANES.forEach(function (p, i) {
      g.save(); g.translate(cx, cy); g.rotate(p[0]); g.strokeStyle = 'rgba(244,237,224,' + (.2 * ok) + ')'; g.lineWidth = 2.5;
      g.beginPath(); g.ellipse(0, 0, R, R * p[1], 0, 0, 6.283 * clamp((o.draw == null ? 1 : o.draw) * 1.2 - i * .04, 0, 1)); g.stroke(); g.restore();
    });
    var shown = o.count == null ? 30 : o.count;
    function drawSat(q) {
      if (q.i >= shown) return;
      var hidden = q.back && Math.hypot(q.x - cx, q.y - cy) < er; if (hidden) return;
      satellite(g, q.x, q.y, .17, q.back ? .55 : 1, 0, { seed: q.i });
      if (o.check) o.check(g, q);
    }
    sats.forEach(function (q) { if (q.back) drawSat(q); });
    earth(g, cx, cy, er, t, 1);
    sats.forEach(function (q) { if (!q.back) drawSat(q); });
    g.restore();
  }
  /* a paper ticket printed out of something: grows down to `h`, torn zigzag edge */
  function ticket(g, x, y, w, h, a, fn) {
    if (a <= 0 || h <= 2) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(-w / 2 + 10, 12, w, h);
    g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(w / 2, 0); g.lineTo(w / 2, h);
    var n = Math.round(w / 24); for (var i = n; i >= 0; i--) g.lineTo(-w / 2 + i * w / n, h - (i % 2 ? 12 : 0));
    g.closePath(); g.fillStyle = '#f7f2e6'; g.fill();
    g.save(); g.clip(); if (fn) fn(g, w, h); g.restore();
    g.restore();
  }
  /* a drafting compass: needle at (px, py), pencil at angle th on radius r */
  function compass(g, px, py, r, th, a, lift) {
    if (a <= 0) return;
    var qx = px + Math.cos(th) * r, qy = py + Math.sin(th) * r, mx = (px + qx) / 2, my = (py + qy) / 2, hx = mx, hy = my - 150 - (lift || 0);
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.lineCap = 'round';
    g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 12; g.beginPath(); g.moveTo(px + 10, py + 10); g.lineTo(hx + 10, hy + 14); g.lineTo(qx + 10, qy + 10); g.stroke();
    g.strokeStyle = '#b9bcc6'; g.lineWidth = 11; g.beginPath(); g.moveTo(px, py); g.lineTo(hx, hy); g.stroke();
    g.strokeStyle = '#8e919c'; g.lineWidth = 11; g.beginPath(); g.moveTo(hx, hy); g.lineTo(qx, qy - 24); g.stroke();
    g.fillStyle = '#e8c255'; g.save(); g.translate(qx, qy - 12); g.rotate(Math.atan2(qy - hy, qx - hx) - Math.PI / 2); g.fillRect(-7, -22, 14, 22); g.fillStyle = GRAPH; g.beginPath(); g.moveTo(-7, 0); g.lineTo(7, 0); g.lineTo(0, 13); g.closePath(); g.fill(); g.restore();
    g.fillStyle = '#5a5d68'; g.beginPath(); g.arc(hx, hy, 15, 0, 6.283); g.fill();
    g.fillStyle = '#b9bcc6'; g.fillRect(hx - 5, hy - 46, 10, 34);
    g.fillStyle = '#5a5d68'; g.beginPath(); g.arc(px, py, 5, 0, 6.283); g.fill();
    g.restore();
  }
  /* a manila hang tag on a string */
  function hangTag(g, x, y, text, t, t0, col, fg) {
    if (t < t0) return;
    var ck = sp(t, t0, 1.6, .55), sw = (1 - clamp(ck, 0, 1.2)) * .9 + knock(t, t0 + .3, 6, 2.5) * .12 + Math.sin(t * 1.7) * .02;
    g.save(); g.globalAlpha *= clamp(ck * 3, 0, 1); g.translate(x, y); g.rotate(sw);
    g.strokeStyle = CREAM; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 70); g.stroke();
    font(g, 46, 900); var tw = g.measureText(text).width + 70;
    g.beginPath(); g.moveTo(-tw / 2 + 26, 70); g.lineTo(tw / 2 - 26, 70); g.lineTo(tw / 2, 96); g.lineTo(tw / 2, 180); g.lineTo(-tw / 2, 180); g.lineTo(-tw / 2, 96); g.closePath();
    g.fillStyle = col || '#d9b67a'; g.fill(); g.beginPath(); g.arc(0, 92, 9, 0, 6.283); g.fillStyle = BG; g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg || INK; g.fillText(text, 0, 140);
    g.restore();
  }

  /* ---------- background: faint coordinates drifting, plain type ---------- */
  var DRIFT = (function () {
    var r = mulberry(9), words = ['40.7128° N', '74.0060° W', '12,550 mi', 'L1 1575.42 MHz', 'PRN 07', 'PRN 13', 'PRN 22', 'x, y, z', 'Δt', 'µs', 'WGS 84', 'ns', 'c', '34.0522° N', 'PRN 31', '10.23 MHz', 't + 0.0674', '±'], out = [];
    for (var i = 0; i < 24; i++) out.push({ w: words[i % words.length], x: 60 + r() * (W - 120), y: r() * H, v: 12 + r() * 22, px: 30 + r() * 26 });
    return out;
  })();
  function PAPERK(t) { return SC ? seg(t, S('doubt').t0 - .3, S('doubt').t0) * (1 - seg(t, S('result').t1 - .3, S('result').t1)) : 0; }
  function QUIETK(t) { if (!SC) return 0; var k = 0; ['sky', 'end'].forEach(function (id) { var q = S(id); k = Math.max(k, seg(t, q.t0 - .3, q.t0) * (1 - seg(t, q.t1, q.t1 + .3))); }); return k; }
  function drift(g, t, a) {
    if (a <= 0) return;
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
    DRIFT.forEach(function (d) {
      var y = ((d.y - t * d.v) % (H + 200) + H + 200) % (H + 200) - 100;
      var band = y > 150 && y < 600 ? 1 - seg(t, 1.6, 2.4) : 0;
      if (band >= 1) return;
      g.globalAlpha = .009 * a * (1 - band) * (1 - PAPERK(t)) * (1 - QUIETK(t)); font(g, d.px, 500, MONO);
      g.fillText(d.w, d.x, y);
    });
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · hook + why: your phone finds you with clocks in space; two clocks that don't agree; how does GPS work?
     ===================================================================================================== */
  var HK = { satX: 175, satY: 705, cX: 312, c1Y: 925, c2Y: 1275, cw: 436, phX: 738, phY: 1035, phW: 336, phH: 790 };
  /* frame 0's two clocks: frozen readouts (the conflict as a number), the ≠ with the gap on it */
  var SATCLK = '12:00:00.000 038', EARTHCLK = '12:00:00.000 000';
  function hookClocks(g, t, dx, clk, k1) {
    clockCard(g, HK.cX + dx, HK.c1Y, HK.cw, 'SATELLITE CLOCK', SATCLK, EARTHCLK, 1, { rot: -.015 + k1, h: 150, px: 48, edge: clk > 0 ? 'rgba(255,91,61,' + (.8 * clk) + ')' : FAINT });
    clockCard(g, HK.cX + dx, HK.c2Y, HK.cw, 'CLOCK ON EARTH', EARTHCLK, null, 1, { rot: .012 - k1, h: 150, px: 48, edge: clk > 0 ? 'rgba(244,237,224,' + (.5 * clk) + ')' : FAINT });
    chip(g, '+38 µs A DAY', HK.cX + 18 + dx, (HK.c1Y + HK.c2Y) / 2, { px: 56, wt: 900, bg: HOT, fg: BG, rot: -.03 + k1 * .8, s: 1 + Math.abs(k1) * 3 });
  }
  function headline(g, t, a, lit, kk) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    var px = 76; font(g, px, 800); try { g.fontStretch = 'expanded'; } catch (e) {}
    var s1 = 'HOW DOES ', s2 = 'GPS', s3 = ' WORK?', tw = g.measureText(s1 + s2 + s3).width;
    if (tw > 760) { px = Math.floor(px * 760 / tw); font(g, px, 800); try { g.fontStretch = 'expanded'; } catch (e) {} }
    var w1 = g.measureText(s1).width, w2 = g.measureText(s2).width, w3 = g.measureText(s3).width, x = 540 - (w1 + w2 + w3) / 2, y = 540;
    g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = CREAM; g.fillText(s1, x, y); g.fillText(s3, x + w1 + w2, y);
    var s = 1 + .06 * (kk || 0);
    g.save(); g.translate(x + w1 + w2 / 2, y); g.scale(s, s);
    if (lit > 0) { g.fillStyle = HOT; rr(g, -w2 / 2 - 12, -px * .62, (w2 + 24) * clamp(lit, 0, 1), px * 1.24, 14); g.fill(); }
    g.fillStyle = lit > .6 ? BG : CREAM; g.textAlign = 'center'; g.fillText(s2, 0, 0);
    if (lit <= 0) { g.fillStyle = HOT; g.fillRect(-w2 / 2, px * .58, w2, 8); }
    g.restore(); g.restore();
  }
  /* the frame-0 layout: satellite + its clock, the ≠, the clock on Earth, the phone with the blue dot. k = 0..1 assembled */
  function hookLayout(g, t, o) {
    o = o || {};
    var clk = o.clk || 0, spc = o.spc || 0, a = o.a == null ? 1 : o.a;
    var bob = Math.sin(t * 1.1) * 8;
    g.save(); g.globalAlpha *= a;
    /* the signal: dashes running from the satellite to the phone, a small packet riding it */
    var sx = HK.satX + 120, sy = HK.satY + 40 + bob, px = HK.phX - 50, py = HK.phY - HK.phH / 2 + 70;
    dashLine(g, sx, sy, px, py, t, 'rgba(255,91,61,.55)', 4, o.sig == null ? 1 : o.sig);
    var pk = ((t * .55) % 1);
    g.save(); g.globalAlpha *= (o.sig == null ? 1 : o.sig) * Math.sin(pk * Math.PI); g.fillStyle = HOT; g.beginPath(); g.arc(lerp(sx, px, pk), lerp(sy, py, pk), 9, 0, 6.283); g.fill(); g.restore();
    phone(g, HK.phX + (o.phDx || 0), HK.phY, HK.phW, HK.phH, t, { rot: .035 + .004 * Math.sin(t * .8), a: o.phA });
    satellite(g, HK.satX, HK.satY + bob - spc * 26, 1.3, 1, -.08 + .02 * Math.sin(t * .7), {});
    hookClocks(g, t, 0, clk, knock(t, o.clkT || -9, 18, 6) * .05);
    g.restore();
  }
  function hookScene(g, t, idle) {
    var ti = idle == null ? t : idle, home = idle != null, N = 99;
    var clocks = home ? N : at('hook', 'clocks'), space = home ? N : at('hook', 'space');
    var gps = home ? N : at('why', 'gps'), ein = home ? N : at('why', 'einstein');
    hookLayout(g, ti, { clk: home ? 0 : seg(t, clocks - .05, clocks + .2), clkT: home ? -9 : clocks, spc: home ? 0 : eio(seg(t, space - .1, space + .5)) });
    headline(g, ti, 1, home ? 0 : eio(seg(t, gps - .05, gps + .2)), home ? 0 : Math.max(0, knock(t, gps, 16, 6)));
    if (!home) hangTag(g, HK.satX + 250, HK.satY + 30, 'EINSTEIN?', t, ein - .12);
  }

  /* =====================================================================================================
     SCENE 2 · sky: about 30 satellites, over 12,000 miles up (Earth and orbit to scale)
     ===================================================================================================== */
  var CX = 540, CY = 1030, OR = 345, ER = 83;
  function skyScene(g, t) {
    var s0 = S('sky').t0, thirty = at('sky', '30'), up = at('sky', 'up'), miles = at('sky', 'miles'), k12 = at('sky', '12000');
    var dr = eio(seg(t, s0, thirty));
    var cnt = Math.round(30 * eio(seg(t, at('sky', 'about') - .1, thirty + .15)));
    constellation(g, CX, CY, OR, ER, t, 1, { draw: dr, count: cnt });
    /* the counter */
    var ck = pop(t, thirty - .1, 3);
    if (t > s0 + .2) {
      g.save(); g.globalAlpha *= clamp(sp(t, s0 + .2) * 2, 0, 1);
      font(g, 120, 900); g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = HOT; g.fillText(String(cnt), 300, 590 + (1 - Math.min(1, ck)) * 10);
      g.restore();
      label(g, 'GPS SATELLITES', 330, 580, clamp(sp(t, s0 + .3) * 2, 0, 1), CREAM, 34, 'left');
      label(g, 'ABOUT', 330, 622, clamp(sp(t, s0 + .3) * 2, 0, 1), DIM, 30, 'left');
    }
    /* the height ruler, surface to orbit */
    var hk = eio(seg(t, k12 - .15, miles + .2));
    if (hk > 0) {
      var x = 880, y0 = CY - ER * .2, y1 = CY - OR * .92;
      g.save(); g.strokeStyle = HOT; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x, lerp(y0, y1, hk)); g.stroke();
      g.beginPath(); g.moveTo(x - 18, y0); g.lineTo(x + 18, y0); g.stroke();
      if (hk >= 1) { g.beginPath(); g.moveTo(x - 18, y1); g.lineTo(x + 18, y1); g.stroke(); }
      g.restore();
      label(g, '12,550 MI', 860, (y0 + y1) / 2 - 22, seg(t, miles - .1, miles + .3), HOT, 34, 'right');
      label(g, 'UP', 860, (y0 + y1) / 2 + 22, seg(t, up - .1, up + .3), HOT, 34, 'right');
    }
    label(g, 'EARTH AND ORBITS TO SCALE', 540, 1420, win(t, s0 + .6, S('sky').t1 - .4, .2), CREAM, 36);
  }

  /* =====================================================================================================
     SCENE 3 · say: each one broadcasts two things, the time and where it is (a ticket prints out of the satellite)
     ===================================================================================================== */
  function sayScene(g, t) {
    var s0 = S('say').t0, two = at('say', 'two'), time = at('say', 'time'), where = at('say', 'where'), it = wend('say', 'is');
    var sk = pop(t, s0 + .05, 2.6), bob = Math.sin(t * 1.1) * 8;
    satellite(g, 540, 690 + bob + (1 - Math.min(1, sk)) * 60, 1.45, clamp(sk * 2, 0, 1), -.02, {});
    var h = 40 + 70 * eio(seg(t, s0 + .3, s0 + .9)) + 170 * eio(seg(t, time - .2, time + .3)) + 190 * eio(seg(t, where - .2, where + .3));
    ticket(g, 540, 850 + bob, 720, h, clamp(sk * 2, 0, 1), function (g, w) {
      var n1 = Math.floor(22 * seg(t, time - .05, time + .45)), n2 = Math.floor(14 * seg(t, where - .05, where + .4));
      g.save(); g.translate(0, 70);
      txt(g, 'GPS SATELLITE · PRN 07', -w / 2 + 40, -38, 30, INK, MONO, 'left', 700); txt(g, 'L1 1575.42 MHz', w / 2 - 50, -38, 30, INKD, MONO, 'right');
      txt(g, '1 · THE TIME', -w / 2 + 40, 60, 30, INKD, MONO);
      txt(g, '12:00:07.250000000'.slice(0, n1), -w / 2 + 40, 130, 56, INK, MONO, 'left', 600);
      txt(g, '2 · WHERE IT IS', -w / 2 + 40, 248, 30, INKD, MONO);
      txt(g, "x, y, z in orbit".slice(0, n2), -w / 2 + 40, 318, 56, INK, MONO, 'left', 600);
      g.fillStyle = 'rgba(33,29,38,.2)'; g.fillRect(-w / 2 + 30, 196, w - 60, 2); g.fillRect(-w / 2 + 30, -2, w - 60, 2);
      g.restore();
    });
    chip(g, '2 THINGS', 540, 1380, { px: 48, wt: 900, bg: HOT, fg: BG, a: win(t, two - .05, it, .2), s: lerp(.9, 1, pop(t, two - .05)) });
    label(g, 'BROADCAST, NONSTOP', 540, 1380, win(t, it + .3, S('say').t1 - .3, .2), DIM, 36);
  }

  /* =====================================================================================================
     SCENE 4 · listen + trip: your phone never talks back, it only listens; the signal takes under a tenth of a second
     ===================================================================================================== */
  var LS = [[250, 640], [540, 600], [830, 640]], LPX = 640, LPY = 1120, LPW = 300, LPH = 600;
  function stopwatch(g, x, y, r, v, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    g.fillStyle = '#8e919c'; g.fillRect(-16, -r - 40, 32, 30); rr(g, -30, -r - 52, 60, 18, 6); g.fill();
    g.save(); g.rotate(.7); g.fillRect(-10, -r - 22, 20, 18); g.restore();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(8, 12, r + 12, 0, 6.283); g.fill();
    g.fillStyle = '#c9ccd4'; g.beginPath(); g.arc(0, 0, r + 12, 0, 6.283); g.fill();
    g.fillStyle = PAPER; g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.fill();
    g.strokeStyle = INK; g.lineCap = 'round';
    for (var i = 0; i < 60; i++) { var an = i / 60 * 6.283, l = i % 5 ? 10 : 22; g.lineWidth = i % 5 ? 2 : 4; g.beginPath(); g.moveTo(Math.sin(an) * (r - 8), -Math.cos(an) * (r - 8)); g.lineTo(Math.sin(an) * (r - 8 - l), -Math.cos(an) * (r - 8 - l)); g.stroke(); }
    /* one turn = 0.1 s; the tenth-of-a-second mark is the top */
    var an2 = v / .1 * 6.283;
    g.strokeStyle = HOT; g.lineWidth = 6; g.beginPath(); g.moveTo(-Math.sin(an2) * 20, Math.cos(an2) * 20); g.lineTo(Math.sin(an2) * (r - 14), -Math.cos(an2) * (r - 14)); g.stroke();
    g.fillStyle = HOT; g.beginPath(); g.arc(0, 0, 10, 0, 6.283); g.fill();
    g.restore();
  }
  function listenScene(g, t) {
    var s0 = S('listen').t0, never = at('listen', 'never'), talks = at('listen', 'talks'), back = at('listen', 'back'), listens = at('listen', 'listens');
    var signal = at('trip', 'signal'), reaches = at('trip', 'reaches'), tenth = at('trip', 'tenth'), second = at('trip', 'second'), tripE = end('trip');
    var pk = pop(t, s0 + .05, 2.6);
    LS.forEach(function (p, i) { var k = pop(t, s0 + .1 + i * .08, 2.6); satellite(g, p[0], p[1] + Math.sin(t * 1.1 + i) * 6, .4, clamp(k * 2, 0, 1), -.05 + i * .04, { seed: i + 3 }); });
    phone(g, LPX, LPY + (1 - Math.min(1, pk)) * 60, LPW, LPH, t, { a: clamp(pk * 2, 0, 1), rot: .02 });
    /* the phone tries to talk back: an arrow up, crossed out */
    var ak = eio(seg(t, talks - .1, back + .1)), xk = pop(t, never - .02, 3.2), aout = 1 - seg(t, listens - .3, listens);
    g.save(); g.globalAlpha *= aout; arrow(g, LPX - 20, LPY - LPH / 2 - 20, 360, 760, ak, 'rgba(244,237,224,.75)', 7);
    if (t > never - .02) cross(g, lerp(LPX - 20, 360, .55), lerp(LPY - LPH / 2 - 20, 760, .55), clamp(xk, 0, 1.04) * 1.3, HOT, 1, 13);
    g.restore();
    /* it only listens: a slip rides down from each satellite into the phone */
    var lk = seg(t, listens - .35, listens + .9);
    LS.forEach(function (p, i) {
      var x1 = LPX + (i - 1) * 60, y1 = LPY - LPH / 2 + 40;
      dashLine(g, p[0], p[1] + 50, x1, y1, t, 'rgba(255,91,61,.5)', 4, seg(t, listens - .4, listens) * (1 - seg(t, S('listen').t1 - .5, S('listen').t1)));
      var k = clamp(lk * 1.4 - i * .2, 0, 1);
      if (k > 0 && k < 1) { var x = lerp(p[0], x1, eio(k)), y = lerp(p[1] + 50, y1, eio(k)); g.save(); g.translate(x, y); g.rotate(-.1 + i * .1); g.fillStyle = '#f7f2e6'; g.fillRect(-34, -20, 68, 40); g.fillStyle = INKD; g.fillRect(-24, -8, 48, 5); g.fillRect(-24, 4, 34, 5); g.restore(); }
    });
    label(g, 'ONE-WAY', 540, 1450 - 30, win(t, listens, signal - .2, .2), HOT, 34);
    /* trip: one signal from the middle satellite, timed by a stopwatch */
    var tk = pop(t, signal - .2, 2.6);
    var v = .0674 * eio(seg(t, reaches - .1, tenth + .2));
    stopwatch(g, 235, 1130, 118, v, clamp(tk * 2, 0, 1));
    if (t > signal - .2) {
      var fr = seg(t, reaches - .1, tenth + .2);
      var x0 = LS[1][0], y0 = LS[1][1] + 50, x1b = LPX, y1b = LPY - LPH / 2 + 40;
      dashLine(g, x0, y0, x1b, y1b, t, 'rgba(255,91,61,.75)', 5, clamp(tk * 2, 0, 1));
      if (fr > 0 && fr < 1) { g.fillStyle = HOT; g.beginPath(); g.arc(lerp(x0, x1b, fr), lerp(y0, y1b, fr), 14, 0, 6.283); g.fill(); }
      g.save(); g.globalAlpha *= clamp(tk * 2, 0, 1); font(g, 52, 700, MONO); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText(v.toFixed(4) + ' s', 235, 1320); g.restore();
      label(g, '< 0.1 SECOND', 250, 1395, win(t, tenth - .05, tripE + .6, .2), HOT, 36);
    }
  }

  /* =====================================================================================================
     SCENE 5 · math: trip time × the speed of light = distance (paper tags drop into the sum)
     ===================================================================================================== */
  function tag(g, x, y, w, lab, val, t0, t, col, fg) {
    if (t < t0) return;
    var k = sp(t, t0, 2.8, .82), yy = lerp(y - 120, y, clamp(k, 0, 1)), rot = lerp(-.12, -.015, clamp(k, 0, 1)) + .006 * Math.sin(t * .9 + x);
    sheet(g, x, yy, w, 150, rot, clamp(k * 3, 0, 1), function (g, w2, h2) {
      txt(g, lab, -w2 / 2 + 28, -h2 / 2 + 30, 30, fg ? 'rgba(21,19,27,.7)' : INKD, MONO);
      var px = fitPx(g, val, 72, w2 - 56, function (p) { font(g, p, 800); });
      txt(g, val, -w2 / 2 + 28, 22, px, fg || INK, DISP, 'left', 800);
    }, col || PAPER);
  }
  function mathScene(g, t) {
    var trip = at('math', 'trip'), speed = at('math', 'speed'), light = at('math', 'light'), equals = at('math', 'equals'), dist = at('math', 'distance');
    tag(g, 540, 700, 720, 'TRIP TIME', '0.0674 s', trip - .1, t);
    var xk = pop(t, at('math', 'times') - .05, 3);
    chip(g, '×', 540, 830, { px: 84, wt: 800, a: clamp(xk * 2, 0, 1), s: xk });
    tag(g, 540, 960, 720, 'SPEED OF LIGHT', '186,282 mi/s', speed - .05, t);
    var ek = pop(t, equals - .05, 3);
    chip(g, '≈', 540, 1090, { px: 84, wt: 800, a: clamp(ek * 2, 0, 1), s: ek });
    tag(g, 540, 1220, 720, 'DISTANCE TO THAT SATELLITE', '12,550 mi', dist - .05, t, HOT, BG);
    /* a little light streak along the speed tag */
    var lk = seg(t, light - .1, light + .5);
    if (lk > 0 && lk < 1) { g.save(); g.globalAlpha *= Math.sin(lk * Math.PI); g.fillStyle = '#fff6d6'; rr(g, lerp(150, 880, lk) - 80, 1032, 160, 8, 4); g.fill(); g.restore(); }
  }

  /* =====================================================================================================
     SCENE 6/8 · three + fourth: the native move. A compass swings a distance circle round each satellite's point
     ===================================================================================================== */
  var MX = 540, MY = 1015, MW = 720, MH = 800;
  var PIN = [30, -10], SP = [[-260, -190], [250, -110], [-120, 330], [250, 300]];
  function rad(i) { return Math.hypot(SP[i][0] - PIN[0], SP[i][1] - PIN[1]); }
  /* the second crossing of circles 1 and 2 (the one circle 3 throws away) */
  var GHOST = (function () {
    var ax = SP[0][0], ay = SP[0][1], bx = SP[1][0], by = SP[1][1], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    var px = PIN[0] - ax, py = PIN[1] - ay, k = (px * dx + py * dy) / L2, fx = ax + k * dx, fy = ay + k * dy;
    return [2 * fx - PIN[0], 2 * fy - PIN[1]];
  })();
  function paperMap(g, w, h) {
    /* a faint printed road map: a few roads, a town name, a river */
    g.save();
    g.strokeStyle = 'rgba(160,190,215,.7)'; g.lineWidth = 26; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-w / 2, 180); g.bezierCurveTo(-150, 90, 60, 330, w / 2, 230); g.stroke();
    g.strokeStyle = 'rgba(214,170,90,.55)'; g.lineWidth = 10;
    g.beginPath(); g.moveTo(-w / 2, -120); g.lineTo(w / 2, 40); g.moveTo(-60, -h / 2); g.lineTo(120, h / 2); g.moveTo(-w / 2, 330); g.lineTo(w / 2, -330); g.stroke();
    g.strokeStyle = 'rgba(33,29,38,.12)'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-w / 2, -260); g.lineTo(w / 2, -200); g.moveTo(250, -h / 2); g.lineTo(200, h / 2); g.moveTo(-320, -h / 2); g.lineTo(-260, h / 2); g.stroke();
    font(g, 30, 500, MONO); g.fillStyle = 'rgba(33,29,38,.4)'; g.textAlign = 'left'; g.fillText('MAP · 1 IN = 500 MI', -w / 2 + 24, h / 2 - 28);
    g.restore();
  }
  function satMark(g, i, x, y, a, t) {
    if (a <= 0) return;
    satellite(g, x, y, .26, a, -.1 + i * .07, { seed: i + 9 });
    chip(g, String(i + 1), x + 58, y - 34, { px: 34, wt: 900, bg: INK, fg: PAPER, a: a });
  }
  function circleArc(g, x, y, r, k, lw, col, a) {
    if (k <= 0 || a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
    g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + 6.283 * clamp(k, 0, 1)); g.stroke(); g.restore();
  }
  function pinDrop(g, x, y, t, t0, col, a) {
    if (t < t0 || a <= 0) return;
    var k = sp(t, t0, 3, .8), yy = lerp(y - 90, y, clamp(k, 0, 1));
    g.save(); g.globalAlpha *= clamp(k * 3, 0, 1) * a;
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 6, y + 4, 16 * clamp(k, 0, 1), 6, 0, 0, 6.283); g.fill();
    g.fillStyle = col || HOT; g.beginPath(); g.arc(x, yy - 52, 26, Math.PI * .85, Math.PI * .15); g.lineTo(x, yy); g.closePath(); g.fill();
    g.fillStyle = PAPER; g.beginPath(); g.arc(x, yy - 54, 10, 0, 6.283); g.fill();
    g.restore();
  }
  /* o: draws = [[k, lw, alpha] per circle], compass = {i, th, a, from, k}, ghost, pin, labels */
  function mapScene(g, t, o) {
    sheet(g, MX, MY + (o.dy || 0), MW, MH, -.012 + .004 * Math.sin(t * .6), o.a == null ? 1 : o.a, function (g, w, h) {
      paperMap(g, w, h);
      g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip();
      o.draws.forEach(function (d, i) { if (d) circleArc(g, SP[i][0], SP[i][1], rad(i), d[0], d[1], d[3] || GRAPH, d[2]); });
      g.restore();
      o.marks.forEach(function (m, i) { satMark(g, i, SP[i][0], SP[i][1], m, t); });
      if (o.ghost > 0) { g.save(); g.globalAlpha *= clamp(o.ghost, 0, 1); g.strokeStyle = HOT; g.lineWidth = 5; g.beginPath(); g.arc(GHOST[0], GHOST[1], 18, 0, 6.283); g.stroke(); g.beginPath(); g.arc(PIN[0], PIN[1], 18, 0, 6.283); g.stroke(); g.restore(); }
      if (o.ghostX > 0) cross(g, GHOST[0], GHOST[1], .8, HOT, o.ghostX, 9);
      if (o.blob > 0) { g.save(); g.globalAlpha *= clamp(o.blob, 0, 1) * .35; g.fillStyle = HOT; g.beginPath(); g.arc(PIN[0], PIN[1], 95, 0, 6.283); g.fill(); g.restore(); }
      if (o.pinT != null) pinDrop(g, PIN[0], PIN[1], t, o.pinT, HOT, o.pinA == null ? 1 : o.pinA);
      if (o.compass) { var c = o.compass; g.save(); g.beginPath(); g.rect(-w / 2, -h / 2 - 220, w, h + 220); g.clip(); compass(g, SP[c.i][0], SP[c.i][1], rad(c.i), c.th, c.a, c.lift); g.restore(); }
      if (o.inner) o.inner(g, w, h);
    });
  }
  /* compass angle for circle i drawn over [a, b] */
  function swing(t, a, b) { return -Math.PI / 2 + 6.283 * eio(seg(t, a, b)); }
  function threeScene(g, t) {
    var s0 = S('three').t0, w = LINE.three.words;
    var c1 = at('three', 'three'), c2 = at('three', 'three', 1), c3 = at('three', 'distances'), pin = at('three', 'pinned'), spot = at('three', 'spot');
    var d1 = [c1 - .1, c1 + .55], d2 = [c2 - .1, c2 + .55], d3 = [c3 - .05, c3 + .6];
    var ak = pop(t, s0 + .02, 2.6);
    var ci = t < d2[0] - .15 ? 0 : t < d3[0] - .15 ? 1 : 2;
    var th = ci === 0 ? swing(t, d1[0], d1[1]) : ci === 1 ? swing(t, d2[0], d2[1]) : swing(t, d3[0], d3[1]);
    var lift = 0;
    mapScene(g, t, {
      a: clamp(ak * 2, 0, 1), dy: (1 - Math.min(1, ak)) * 50,
      draws: [[seg(t, d1[0], d1[1]) * 1.001, 5, 1], [seg(t, d2[0], d2[1]), 5, 1], [seg(t, d3[0], d3[1]), 5, 1]],
      marks: [pop(t, s0 + .1, 3), pop(t, c2 - .3, 3), pop(t, c3 - .3, 3)],
      ghost: seg(t, d2[1] - .05, d2[1] + .15) * (1 - seg(t, d3[1], d3[1] + .3)), ghostX: seg(t, d3[1], d3[1] + .15) * (1 - seg(t, pin + .4, pin + .8)),
      pinT: pin - .05,
      compass: { i: ci, th: th, a: 1 - seg(t, d3[1] + .1, d3[1] + .4), lift: lift }
    });
    label(g, '3 DISTANCES · 1 SPOT', 540, 560, win(t, spot - .1, S('three').t1 - .4, .2), HOT, 32);
    label(g, 'TWO CROSSINGS', 540, 560, win(t, d2[1], d3[1] - .1, .2), DIM, 36);
  }
  /* SCENE 7 · catch: light goes about a foot every billionth of a second (a 12-inch wooden ruler) */
  function ruler(g, x, y, w, h, rot, a, t, lk) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.rotate(rot);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-w / 2 + 10, -h / 2 + 16, w, h);
    g.fillStyle = WOOD; g.fillRect(-w / 2, -h / 2, w, h);
    g.strokeStyle = 'rgba(168,122,58,.35)'; g.lineWidth = 2; var r = mulberry(12);
    for (var i = 0; i < 9; i++) { var yy = -h / 2 + 8 + r() * (h - 16); g.beginPath(); g.moveTo(-w / 2, yy); g.bezierCurveTo(-w / 6, yy + (r() - .5) * 14, w / 6, yy + (r() - .5) * 14, w / 2, yy + (r() - .5) * 8); g.stroke(); }
    var in1 = (w - 40) / 12;
    g.strokeStyle = INK; g.fillStyle = INK; g.lineCap = 'butt';
    for (var k = 0; k <= 96; k++) { var xx = -w / 2 + 20 + k * in1 / 8, l = k % 8 === 0 ? 46 : k % 4 === 0 ? 30 : k % 2 === 0 ? 20 : 12; g.lineWidth = k % 8 ? 2 : 3.5; g.beginPath(); g.moveTo(xx, -h / 2); g.lineTo(xx, -h / 2 + l); g.stroke(); if (k % 8 === 0 && k > 0 && k < 96) { font(g, 30, 700); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(k / 8), xx, -h / 2 + 72); } }
    font(g, 30, 500, MONO); g.textAlign = 'left'; g.fillStyle = 'rgba(33,29,38,.55)'; g.fillText('12 INCHES', -w / 2 + 30, h / 2 - 26);
    /* light: a bright bar crossing the ruler, once, in a billionth of a second (slowed down) */
    if (lk > 0 && lk < 1) {
      var lx = lerp(-w / 2 + 20, w / 2 - 20, lk);
      var gr = g.createLinearGradient(lx - 260, 0, lx, 0); gr.addColorStop(0, 'rgba(255,246,214,0)'); gr.addColorStop(1, 'rgba(255,246,214,.95)');
      g.fillStyle = gr; g.fillRect(lx - 260, -10, 260, 20); g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(lx, 0, 13, 0, 6.283); g.fill();
    }
    g.restore();
  }
  function catchScene(g, t) {
    var s0 = S('catch').t0, but = at('catch', 'but'), light = at('catch', 'light'), foot = at('catch', 'foot'), bil = at('catch', 'billionth'), sec = at('catch', 'second');
    var bk = pop(t, but - .05, 3.2);
    chip(g, 'BUT', 540, 610, { px: 80, wt: 900, bg: HOT, fg: BG, a: clamp(bk * 2, 0, 1) * (1 - seg(t, foot, foot + .3)), s: lerp(1.3, 1, clamp(bk, 0, 1)) });
    var rk = pop(t, s0 + .05, 2.6);
    ruler(g, 540, 850 + (1 - Math.min(1, rk)) * 60, 760, 180, -.03, clamp(rk * 2, 0, 1), t, seg(t, light - .05, foot + .35));
    /* the bracket: 1 foot */
    var fk = eio(seg(t, foot - .05, foot + .3));
    if (fk > 0) {
      g.save(); g.translate(540, 865); g.rotate(-.03); g.strokeStyle = HOT; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-360, 100); g.lineTo(-360, 120); g.lineTo(lerp(-360, 360, fk), 120); if (fk >= 1) g.lineTo(360, 100); g.stroke();
      g.restore();
      chip(g, '1 FOOT', 540, 1060, { px: 56, wt: 900, a: fk, fg: HOT });
    }
    var nk = pop(t, bil - .05, 3);
    chip(g, '= 1 BILLIONTH', 540, 1165, { px: 64, wt: 900, bg: CREAM, fg: BG, a: clamp(nk * 2, 0, 1), s: lerp(.9, 1, clamp(nk, 0, 1)) });
    label(g, 'OF A SECOND · 0.000000001 s', 540, 1250, seg(t, sec - .2, sec + .2), CREAM, 32);
    label(g, 'LIGHT, SLOWED DOWN', 540, 600, win(t, light, at('catch', 'billionth'), .2), DIM, 36);
  }
  function fourthScene(g, t) {
    var s0 = S('fourth').t0, clock = at('fourth', 'clock'), isnt = at('fourth', 'isnt'), good = at('fourth', 'good'), fourth = at('fourth', 'fourth'), fixes = at('fourth', 'fixes');
    var ak = pop(t, s0 + .02, 2.6);
    var smear = eio(seg(t, isnt - .1, good + .2)) * (1 - eio(seg(t, fixes - .05, fixes + .35)));
    var lw = lerp(5, 54, smear), al = lerp(1, .3, smear);
    var d4 = [fourth - .05, fourth + .6];
    var wob = smear * Math.sin(t * 13) * 6;
    mapScene(g, t, {
      a: clamp(ak * 2, 0, 1), dy: (1 - Math.min(1, ak)) * 20,
      draws: [[1, lw, al], [1, lw, al], [1, lw, al], [seg(t, d4[0], d4[1]), lerp(5, 54, eio(seg(t, isnt, good)) * (1 - eio(seg(t, fixes - .05, fixes + .35)))), lerp(1, .3, smear), HOT]],
      marks: [1, 1, 1, pop(t, fourth - .35, 3)],
      blob: smear, pinT: fixes + .05, pinA: 1,
      compass: { i: 3, th: swing(t, d4[0], d4[1]), a: seg(t, fourth - .3, fourth - .1) * (1 - seg(t, d4[1] + .1, d4[1] + .4)) },
      inner: function (g, w, h) {
        if (smear > .3) { g.save(); g.globalAlpha *= clamp((smear - .3) * 2, 0, 1); g.translate(PIN[0] + wob, PIN[1]); g.restore(); }
      }
    });
    /* the phone's clock, wobbling: its last digits run loose */
    var ck = pop(t, clock - .2, 2.8), off = Math.round(1000 * (.5 + .5 * Math.sin(t * 9))) * eio(seg(t, isnt - .1, isnt + .2)) * (1 - eio(seg(t, fixes - .05, fixes + .3)));
    var ref = clockStr(t, 0), ph = clockStr(t, Math.round(off * 7 + 1000 * eio(seg(t, isnt - .1, isnt + .2)) * (1 - eio(seg(t, fixes - .05, fixes + .3)))));
    clockCard(g, 540, 545, 520, "YOUR PHONE'S CLOCK", ph, ref, clamp(ck * 2, 0, 1), { rot: -.01 + .01 * Math.sin(t * 11) * smear, h: 124 });
        chip(g, 'x, y, z + TIME', 540, 1418, { px: 48, wt: 900, bg: HOT, fg: BG, a: win(t, fixes, S('fourth').t1 - .4, .2) });
  }

  /* =====================================================================================================
     SCENE 9 · weird + speed: weaker gravity makes clocks tick faster; their speed slows them a little
     ===================================================================================================== */
  function wallClock(g, x, y, r, sec, a, lab, rim) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(8, 12, r + 14, 0, 6.283); g.fill();
    g.fillStyle = rim || '#3a3644'; g.beginPath(); g.arc(0, 0, r + 14, 0, 6.283); g.fill();
    g.fillStyle = PAPER; g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.fill();
    g.strokeStyle = INK; g.lineCap = 'round';
    for (var i = 0; i < 60; i++) { var an = i / 60 * 6.283, l = i % 5 ? 8 : 18; g.lineWidth = i % 5 ? 2 : 4; g.beginPath(); g.moveTo(Math.sin(an) * (r - 8), -Math.cos(an) * (r - 8)); g.lineTo(Math.sin(an) * (r - 8 - l), -Math.cos(an) * (r - 8 - l)); g.stroke(); }
    var hA = (10 + sec / 3600) / 12 * 6.283, mA = (8 + sec / 60) / 60 * 6.283, sA = sec / 60 * 6.283;
    g.lineWidth = 9; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(hA) * r * .45, -Math.cos(hA) * r * .45); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(mA) * r * .7, -Math.cos(mA) * r * .7); g.stroke();
    g.strokeStyle = HOT; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-Math.sin(sA) * 18, Math.cos(sA) * 18); g.lineTo(Math.sin(sA) * r * .86, -Math.cos(sA) * r * .86); g.stroke();
    g.fillStyle = HOT; g.beginPath(); g.arc(0, 0, 8, 0, 6.283); g.fill();
    g.restore();
    if (lab) label(g, lab, x, y + r + 50, a, CREAM, 36);
  }
  function speedo(g, x, y, r, v, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    var a0 = Math.PI * .8, a1 = Math.PI * 2.2;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(8, 12, r + 16, 0, 6.283); g.fill();
    g.fillStyle = '#1c1a22'; g.beginPath(); g.arc(0, 0, r + 16, 0, 6.283); g.fill(); g.strokeStyle = '#4a4555'; g.lineWidth = 5; g.stroke();
    g.strokeStyle = CREAM; g.lineCap = 'butt';
    for (var i = 0; i <= 50; i++) { var an = lerp(a0, a1, i / 50), l = i % 5 ? 12 : 26; g.lineWidth = i % 5 ? 2 : 5; g.beginPath(); g.moveTo(Math.cos(an) * (r - 6), Math.sin(an) * (r - 6)); g.lineTo(Math.cos(an) * (r - 6 - l), Math.sin(an) * (r - 6 - l)); g.stroke();
      if (i % 10 === 0) { font(g, 30, 700, MONO); g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i / 5), Math.cos(an) * (r - 62), Math.sin(an) * (r - 62)); } }
    g.strokeStyle = HOT; g.lineWidth = 12; g.beginPath(); g.arc(0, 0, r - 4, lerp(a0, a1, .85), lerp(a0, a1, .9)); g.stroke();
    var na = lerp(a0, a1, v / 10000);
    g.strokeStyle = HOT; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(-Math.cos(na) * 24, -Math.sin(na) * 24); g.lineTo(Math.cos(na) * (r - 20), Math.sin(na) * (r - 20)); g.stroke();
    g.fillStyle = '#5a5d68'; g.beginPath(); g.arc(0, 0, 18, 0, 6.283); g.fill();
    font(g, 30, 500, MONO); g.fillStyle = DIM; g.textAlign = 'center'; g.fillText('× 1,000 MPH', 0, r * .45);
    g.restore();
  }
  function gravArrows(g, x, y, len, a) {
    if (a <= 0) return;
    for (var i = 0; i < 3; i++) arrow(g, x + (i - 1) * 46, y - len / 2, x + (i - 1) * 46, y + len / 2, 1, 'rgba(244,237,224,' + (.55 * a) + ')', 5, 22);
  }
  function weirdScene(g, t) {
    var s0 = S('weird').t0, weird = at('weird', 'weird'), grav = at('weird', 'gravity'), there = at('weird', 'there'), faster = at('weird', 'faster');
    var spd = at('speed', 'speed'), k87 = at('speed', '8700'), mph = at('speed', 'hour'), slows = at('speed', 'slows'), little = at('speed', 'little');
    var ek = pop(t, s0 + .05, 2.4);
    var sk = eio(seg(t, spd - .45, spd + .15));          // the speed phase slides the ground away
    /* Earth's edge at the bottom */
    g.save(); g.translate(0, sk * 420);
    g.globalAlpha *= clamp(ek * 2, 0, 1);
    g.beginPath(); g.arc(540, 2470, 1080, 0, 6.283); g.fillStyle = '#23466a'; g.fill();
    g.save(); g.clip(); g.fillStyle = '#7fa66d'; g.beginPath(); g.ellipse(300, 1420, 260, 60, 0, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(860, 1450, 200, 70, 0, 0, 6.283); g.fill(); g.restore();
    var base = (t - s0) * 1;
    wallClock(g, 540, 1225, 108, 14 + base, 1, null);
    label(g, 'ON THE GROUND', 540, 1052, 1 - sk, CREAM, 36);
    gravArrows(g, 220, 1220, 150, 1); gravArrows(g, 860, 1220, 150, 1);
    g.restore();
    label(g, 'STRONGER', 220, 1060 + sk * 420, clamp(ek * 2, 0, 1) * (1 - sk) * seg(t, grav - .1, grav + .2), DIM, 36);
    /* the clock in orbit runs ahead (exaggerated: really 45.7 millionths of a second a day) */
    var lead = 3.2 * eio(seg(t, faster - .1, faster + 1.2)) - .7 * eio(seg(t, slows - .1, slows + .6));
    var oy = lerp(745, 690, sk);
    wallClock(g, 540, oy, 108, 14 + base + lead + lead * .0, clamp(ek * 2, 0, 1), null, '#6b5a3a');
    satellite(g, 735, oy - 95, .3, clamp(ek * 2, 0, 1), -.1, { seed: 3 });
    label(g, 'IN ORBIT', 540, oy - 160, clamp(ek * 2, 0, 1), CREAM, 36);
    gravArrows(g, 220, oy, 50, clamp(ek * 2, 0, 1) * seg(t, there - .1, there + .3) * (1 - sk));
    gravArrows(g, 860, oy, 50, clamp(ek * 2, 0, 1) * seg(t, there - .1, there + .3) * (1 - sk));
    label(g, 'WEAKER', 220, oy - 70, clamp(ek * 2, 0, 1) * seg(t, there - .1, there + .3) * (1 - sk), DIM, 36);
    /* tags */
    var fk = pop(t, faster - .05, 3);
    chip(g, '+45.7 µs/DAY · GRAVITY', 540, lerp(905, 850, sk), { px: 40, wt: 800, fam: MONO, bg: HOT, fg: BG, a: clamp(fk * 2, 0, 1), s: lerp(.9, 1, clamp(fk, 0, 1)) });
    var wk = pop(t, weird - .05, 3);
    chip(g, 'THE WEIRD PART', 540, 640, { px: 44, wt: 900, line: HOT, fg: HOT, a: clamp(wk * 2, 0, 1) * (1 - seg(t, grav, grav + .3)) });
    /* speed: a speedometer slides up into the gap */
    var gk = eio(seg(t, spd - .3, spd + .3));
    speedo(g, 540, lerp(1500, 1180, gk), 205, 8700 * eio(seg(t, k87 - .25, mph)), gk);
    chip(g, '8,700 MPH', 540, 1418, { px: 48, wt: 900, fg: HOT, a: seg(t, mph - .2, mph + .2) });
    var slk = pop(t, slows - .05, 3);
    chip(g, '−7.1 µs/DAY · SPEED', 540, 940, { px: 40, wt: 800, fam: MONO, bg: CREAM, fg: BG, a: clamp(slk * 2, 0, 1), s: lerp(.9, 1, clamp(slk, 0, 1)) });
  }

  /* =====================================================================================================
     SCENE 10 · net: they gain 38 millionths of a second a day (an adding-machine tape, then the whole frame)
     ===================================================================================================== */
  function netScene(g, t) {
    var s0 = S('net').t0, net = at('net', 'net'), result = at('net', 'result'), gain = at('net', 'run'), n38 = at('net', '38'), mil = at('net', 'millionths'), day = at('net', 'day');
    var rows = [['+45.7', 'GRAVITY', s0 + .1], ['− 7.1', 'SPEED', net - .05], ['+38.6', 'µs A DAY', result]];
    var h = 60 + 86 * (eio(seg(t, s0 + .05, s0 + .35)) + eio(seg(t, net - .1, net + .2)) + eio(seg(t, result - .1, result + .25))) + 30 * eio(seg(t, result - .1, result + .25));
    var up = eio(seg(t, n38 - .5, n38 + .1));
    g.save(); g.translate(0, -up * 40);
    /* the machine's mouth */
    rr(g, 190, 548, 700, 46, 14); g.fillStyle = '#3a3644'; g.fill();
    ticket(g, 540, 570, 620, h, 1, function (g, w) {
      rows.forEach(function (r, i) {
        if (t < r[2] - .1) return;
        var y = 70 + i * 86 + (i === 2 ? 30 : 0);
        if (i === 2) { g.fillStyle = INK; g.fillRect(-w / 2 + 40, y - 52, w - 80, 4); }
        txt(g, r[0], -w / 2 + 50, y, 60, i === 2 ? REDINK : INK, MONO, 'left', 700);
        txt(g, r[1], w / 2 - 50, y, 36, INKD, MONO, 'right');
      });
    });
    g.restore();
    /* the DM frame: big */
    var bk = pop(t, n38 - .08, 2.8);
    if (t > n38 - .08) {
      g.save(); g.globalAlpha *= clamp(bk * 2, 0, 1);
      g.translate(540, 1080); g.scale(lerp(1.15, 1, clamp(bk, 0, 1)), lerp(1.15, 1, clamp(bk, 0, 1)));
      font(g, 260, 900); try { g.fontStretch = 'expanded'; } catch (e) {} g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = HOT; g.fillText('+38', 0, 0);
      g.restore();
    }
    var mk2 = seg(t, n38, n38 + .3);
    g.save(); g.globalAlpha *= mk2; font(g, 50, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('MILLIONTHS OF A SECOND', 540, 1250); g.restore();
    var dk = seg(t, day - .1, day + .2);
    chip(g, 'EVERY DAY, IN ORBIT', 540, 1345, { px: 48, wt: 900, bg: CREAM, fg: BG, a: dk });
  }

  /* =====================================================================================================
     SCENE 11 · miles: at light speed that's about seven miles of distance error, every day (range error if uncorrected)
     ===================================================================================================== */
  function tapeCase(g, x, y, a) {
    g.save(); g.globalAlpha *= a; g.translate(x, y);
    rr(g, -60, -60, 120, 120, 30); g.fillStyle = YEL; g.fill(); g.strokeStyle = '#a07a12'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#2b2830'; g.beginPath(); g.arc(0, 0, 30, 0, 6.283); g.fill(); g.fillStyle = YEL; g.beginPath(); g.arc(0, 0, 10, 0, 6.283); g.fill();
    g.restore();
  }
  function milesScene(g, t) {
    var s0 = S('miles').t0, seven = at('miles', 'seven'), mi = at('miles', 'miles'), err = at('miles', 'error'), day = at('miles', 'day');
    var ak = pop(t, s0 + .05, 2.6), A = clamp(ak * 2, 0, 1);
    var y = 640, sx = 215, px = 590;
    label(g, 'MEASURED DISTANCE TO SATELLITE', 540, 515, A, CREAM, 36);
    satellite(g, sx, y + 40 + Math.sin(t * 1.1) * 6, .55, A, -.1, { seed: 2 });
    phone(g, px, y + 150, 140, 280, t, { a: A, rot: .03, dotS: .8 });
    dashLine(g, sx + 80, y - 20, px, y - 20, t, 'rgba(244,237,224,.7)', 5, A);
    /* the tape overshoots by one day's worth: +7 mi */
    var d = eio(seg(t, seven - .1, mi + .25)), tx1 = px + d * 170;
    g.save(); g.globalAlpha *= A;
    if (d > 0) {
      g.fillStyle = HOT; g.fillRect(px, y - 34, tx1 - px, 28);
      g.fillStyle = BG; for (var k = 0; k < d * 11; k++) g.fillRect(px + k * 15, y - 34, 2, 12);
      g.strokeStyle = CREAM; g.lineWidth = 4; g.beginPath(); g.moveTo(px, y - 64); g.lineTo(px, y + 20); g.stroke();
    }
    g.restore();
    tapeCase(g, Math.min(860, Math.max(px + 66, tx1 + 64)), y - 20, A * seg(t, seven - .3, seven));
    /* the number, and the caveat at nearly the same size */
    var bk = pop(t, seven - .08, 3);
    if (t > seven - .08) {
      g.save(); g.globalAlpha *= clamp(bk * 2, 0, 1); g.translate(540, 1000); g.scale(lerp(1.12, 1, clamp(bk, 0, 1)), lerp(1.12, 1, clamp(bk, 0, 1)));
      font(g, 170, 900); try { g.fontStretch = 'expanded'; } catch (e) {} g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = HOT; g.fillText('+7 MI', 0, 0); g.restore();
    }
    var ek = seg(t, err - .15, err + .15);
    g.save(); g.globalAlpha *= ek; font(g, 44, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('OF RANGE ERROR A DAY', 540, 1115); g.restore();
    var sk = seg(t, s0, s0 + .25);
    g.save(); g.globalAlpha *= sk; font(g, 66, 900); try { g.fontStretch = 'expanded'; } catch (e) {} g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('IF UNCORRECTED', 540, 1215);
    g.fillStyle = HOT; g.fillRect(250, 1258, 580, 7); g.restore();
    g.save(); g.globalAlpha *= sk; txt(g, '38.6 µs × c ≈ 11.6 km ≈ 7.2 mi', 540, 1320, 38, CREAM, MONO, 'center', 600); g.restore();
    label(g, 'IN EACH SATELLITE DISTANCE', 540, 1395, sk, DIM, 36);
    void day;
  }

  /* =====================================================================================================
     SCENE 12 · doubt: back in 1977, not everyone believed it would matter (a quote card, Ashby 2003)
     ===================================================================================================== */
  var QUOTE = '“…there were some who doubted that relativistic effects were truths that would need to be incorporated.”';
  function doubtScene(g, t) {
    var s0 = S('doubt').t0, y77 = at('doubt', '1977'), not = at('doubt', 'not'), believed = at('doubt', 'believed'), matter = at('doubt', 'matter');
    var dk = pop(t, y77 - .1, 2.8);
    g.save(); g.globalAlpha *= clamp(dk * 2, 0, 1); font(g, 190, 900); try { g.fontStretch = 'expanded'; } catch (e) {} g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
    g.fillText('1977', 540, 680 + (1 - Math.min(1, dk)) * 30); g.restore();
    var qk = pop(t, not - .25, 2.4);
    sheet(g, 540, 1070 + (1 - Math.min(1, qk)) * 60, 720, 440, -.018 + .004 * Math.sin(t * .7), clamp(qk * 2, 0, 1), function (g, w, h) {
      serif(g, 58); var lines = wrap(g, QUOTE, w - 110), hl = seg(t, believed - .1, believed + .5);
      lines.forEach(function (s, i) {
        var y = -h / 2 + 80 + i * 72;
        if (s.indexOf('doubted') > -1 && hl > 0) {
          serif(g, 58); var pre = s.slice(0, s.indexOf('doubted')), x0 = -w / 2 + 55 + g.measureText(pre).width, ww = g.measureText('doubted').width;
          g.fillStyle = 'rgba(255,200,61,.75)'; g.fillRect(x0 - 6, y - 30, (ww + 12) * hl, 60);
        }
        txt(g, s, -w / 2 + 55, y, 58, INK, 'serif');
      });
      txt(g, 'NEIL ASHBY, PHYSICIST · 2003', -w / 2 + 55, h / 2 - 50, 34, INKD, MONO);
    });
    label(g, 'ON THE FIRST GPS TEST CLOCK', 540, 800, win(t, matter - .2, S('doubt').t1 - .4, .2), CREAM, 36);
  }

  /* =====================================================================================================
     SCENE 13 · switch: a test satellite flew its atomic clock with the fix off (NTS-2, a toggle switch)
     ===================================================================================================== */
  function toggle(g, x, y, onK, a, t) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -280 + 10, -140 + 16, 560, 280, 26); g.fill();
    rr(g, -280, -140, 560, 280, 26); g.fillStyle = '#c9ccd4'; g.fill(); g.strokeStyle = '#8e919c'; g.lineWidth = 4; g.stroke();
    [[-250, -110], [250, -110], [-250, 110], [250, 110]].forEach(function (p) { g.fillStyle = '#8e919c'; g.beginPath(); g.arc(p[0], p[1], 9, 0, 6.283); g.fill(); });
    txt(g, 'RELATIVITY FIX', 0, -98, 34, INK, MONO, 'center', 700);
    txt(g, 'ON', -170, 40, 48, onK > .5 ? MINT : 'rgba(33,29,38,.45)', DISP, 'center', 900);
    txt(g, 'OFF', 170, 40, 48, onK < .5 ? REDINK : 'rgba(33,29,38,.45)', DISP, 'center', 900);
    g.fillStyle = '#2b2830'; g.beginPath(); g.arc(0, 40, 44, 0, 6.283); g.fill();
    var an = lerp(.75, -.75, onK);
    g.save(); g.translate(0, 40); g.rotate(-an); g.fillStyle = '#e4e6ec'; rr(g, -14, -112, 28, 112, 14); g.fill(); g.fillStyle = '#b9bcc6'; g.beginPath(); g.arc(0, -112, 22, 0, 6.283); g.fill(); g.restore();
    g.restore();
  }
  function switchScene(g, t) {
    var s0 = S('switch').t0, test = at('switch', 'test'), atomic = at('switch', 'atomic'), fix = at('switch', 'fix'), off = at('switch', 'off');
    var sk = pop(t, s0 + .02, 2.6), bob = Math.sin(t * 1.1) * 7;
    satellite(g, 540, 690 + bob + (1 - Math.min(1, sk)) * 60, 1.3, clamp(sk * 2, 0, 1), .03, { body: '#c9ccd4', bodyD: '#9da1ac', seed: 21 });
    chip(g, 'NTS-2', 540, 880, { px: 80, wt: 900, bg: CREAM, fg: BG, a: clamp(sk * 2, 0, 1) });
    label(g, 'LAUNCHED JUNE 23, 1977', 540, 970, clamp(sk * 2, 0, 1), CREAM, 32);
    var ak = pop(t, atomic - .05, 3);
    chip(g, 'CESIUM ATOMIC CLOCK', 540, 1010, { px: 34, wt: 700, fam: MONO, line: HOT, fg: HOT, a: clamp(ak * 2, 0, 1) * 0 });
    label(g, 'CESIUM ATOMIC CLOCK ON BOARD', 540, 1030, clamp(ak * 2, 0, 1), HOT, 36);
    var offE = wend('switch', 'off'), tk = pop(t, test - .1, 2.6), onK = 1 - eio(seg(t, offE - .02, offE + .1));
    toggle(g, 540, 1250 + (1 - Math.min(1, tk)) * 20, onK, clamp(tk * 2, 0, 1), t);
  }

  /* =====================================================================================================
     SCENE 14 · result: for twenty days it ran fast, almost exactly as Einstein predicted (calendar, the report)
     ===================================================================================================== */
  function calendar(g, x, y, n, flip, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-150 + 10, -150 + 16, 300, 300);
    g.fillStyle = PAPER; g.fillRect(-150, -150, 300, 300);
    g.fillStyle = REDINK; g.fillRect(-150, -150, 300, 70);
    g.fillStyle = '#3a3644'; for (var i = 0; i < 6; i++) g.fillRect(-120 + i * 46, -164, 10, 30);
    txt(g, 'NTS-2 · 1977', 0, -115, 30, PAPER, MONO, 'center', 700);
    txt(g, 'DAY', 0, -40, 32, INKD, MONO, 'center');
    font(g, 130, 900); g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 0, 60);
    if (flip > 0 && flip < 1) {
      /* the page being torn off, lifting away */
      g.save(); g.translate(0, -80); g.rotate(-flip * 1.2); g.globalAlpha *= 1 - flip;
      g.fillStyle = '#e8dfcb'; g.fillRect(-150, 0, 300, 230); g.restore();
    }
    g.restore();
  }
  function resultScene(g, t) {
    var s0 = S('result').t0, tw = at('result', 'twenty'), days = at('result', 'days'), fast = at('result', 'fast'), almost = at('result', 'almost'), ein = at('result', 'einstein'), pred = at('result', 'predicted');
    var ck = pop(t, s0 + .05, 2.6);
    var fr = 19 * Math.pow(seg(t, s0 + .15, days + .5), .8), n = 1 + Math.floor(fr), flip = fr - Math.floor(fr);
    calendar(g, 300, 760 + (1 - Math.min(1, ck)) * 50, Math.min(20, n), n < 20 ? flip : 0, clamp(ck * 2, 0, 1));
    var fk = pop(t, fast - .05, 3);
    chip(g, 'RAN FAST', 745, 700, { px: 54, wt: 900, bg: HOT, fg: BG, a: clamp(fk * 2, 0, 1), s: lerp(.9, 1, clamp(fk, 0, 1)) });
    arrow(g, 745, 870, 745, 770, eio(seg(t, fast, fast + .3)), HOT, 8);
    label(g, '20 DAYS, FIX OFF', 700, 900, seg(t, days - .1, days + .2), CREAM, 36);
    /* the report (re-created) with the two numbers */
    var rk = pop(t, almost - .3, 2.6);
    sheet(g, 540, 1195 + (1 - Math.min(1, rk)) * 20, 720, 400, .012 + .003 * Math.sin(t * .8), clamp(rk * 2, 0, 1), function (g, w, h) {
      txt(g, 'NAVAL RESEARCH LABORATORY · 1978', -w / 2 + 40, -h / 2 + 40, 30, INKD, MONO);
      txt(g, 'Initial Results of the NAVSTAR GPS NTS-2 Satellite', -w / 2 + 40, -h / 2 + 88, 33, INK, 'serif');
      g.fillStyle = 'rgba(33,29,38,.3)'; g.fillRect(-w / 2 + 40, -h / 2 + 118, w - 80, 3);
      var m = seg(t, almost - .05, almost + .25), p = seg(t, ein - .05, pred + .1);
      g.save(); g.globalAlpha *= m; txt(g, 'MEASURED', -w / 2 + 40, -30, 34, INKD, MONO); txt(g, '+442.5', w / 2 - 50, -30, 78, INK, DISP, 'right', 900); g.restore();
      g.save(); g.globalAlpha *= p; txt(g, 'EINSTEIN PREDICTED', -w / 2 + 40, 60, 34, INKD, MONO); txt(g, '+446.5', w / 2 - 50, 60, 78, INK, DISP, 'right', 900); g.restore();
      txt(g, 'PARTS PER TRILLION · FIGURES VIA ASHBY 2003', -w / 2 + 40, h / 2 - 40, 30, INKD, MONO);
      slam(g, ['WITHIN 1%'], REDINK, 54, 60, -232, t, pred + .35, -.08);
    });
    label(g, 'RE-CREATED', 150, 975, clamp(rk * 2, 0, 1), CREAM, 36, 'left');
  }

  /* =====================================================================================================
     SCENE 15 · fixed: since then, every GPS clock gets corrected for it (✓ on every satellite)
     ===================================================================================================== */
  function fixedScene(g, t) {
    var s0 = S('fixed').t0, every = at('fixed', 'every'), corr = at('fixed', 'corrected'), gk = pop(t, s0 + .05, 2.4);
    var t0c = every - .05, t1c = corr + .3;
    constellation(g, CX, 790, 250, 60, t, clamp(gk * 2, 0, 1), {
      check: function (g, q) {
        var tc = lerp(t0c, t1c, hash(q.i + 5)), k = pop(t, tc, 3.2);
        if (t > tc) { g.save(); g.globalAlpha *= clamp(k * 2, 0, 1); g.fillStyle = HOT; g.beginPath(); g.arc(q.x + 16, q.y - 16, 15 * clamp(k, 0, 1.04), 0, 6.283); g.fill(); tick(g, q.x + 16, q.y - 16, .42, BG, 1); g.restore(); }
      }
    });
    /* the hero: the clocks are tuned slow on purpose */
    var pk = pop(t, s0 + .15, 2.6);
    sheet(g, 540, 1210 + (1 - Math.min(1, pk)) * 50, 720, 330, -.012 + .003 * Math.sin(t * .8), clamp(pk * 2, 0, 1), function (g, w, h) {
      txt(g, 'OLDER GPS CLOCKS, TUNED TO', -w / 2 + 40, -h / 2 + 40, 30, INKD, MONO);
      txt(g, '10.23 MHz', -w / 2 + 40, -h / 2 + 105, 60, INK, MONO, 'left', 700);
      var st = eio(seg(t, every - .1, every + .3));
      if (st > 0) { g.fillStyle = REDINK; g.fillRect(-w / 2 + 34, -h / 2 + 103, 340 * st, 7); }
      var nk = seg(t, every + .1, corr + .1), str = '10.22999999543 MHz', n = Math.floor(str.length * nk);
      txt(g, '→', -w / 2 + 40, 40, 60, REDINK, DISP, 'left', 800);
      txt(g, str.slice(0, n), -w / 2 + 100, 40, 56, REDINK, MONO, 'left', 700);
      txt(g, 'FACTORY OFFSET · ASHBY 2003, 2006', -w / 2 + 40, h / 2 - 34, 30, INKD, MONO);
      slam(g, ['SET SLOW', 'ON PURPOSE'], BLUEINK, 52, 120, -20, t, at('fixed', 'gps') - .02, .06);
    });
    label(g, 'NEWER: CORRECTED IN THE SIGNAL', 540, 1420, seg(t, at('fixed', 'gps') - .02, at('fixed', 'gps') + .25), CREAM, 36);
  }

  /* =====================================================================================================
     SCENE 16 · feet: that's how your phone finds you, to within about 16 feet (the compass round the blue dot)
     ===================================================================================================== */
  var FP = { x: 540, y: 975, w: 430, h: 780, z: 2.2 };
  /* the payoff: four satellites' distance rings sweep in from the map edges, cross inside the 16 ft circle,
     and on "map" collapse into the blue dot's halo */
  var RINGS = [[-2.35, 22], [-.8, -26], [.75, 34], [2.4, -14]], RD = 640;
  function rings(g, dx, dy, sc, kIn, cIn, a) {
    if (a <= 0 || kIn <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.strokeStyle = GRAPH; g.lineWidth = 4 * Math.max(.7, sc);
    RINGS.forEach(function (r, i) {
      var k = eio(clamp(kIn * 1.25 - i * .08, 0, 1)); if (k <= 0) return;
      var c = eio(clamp(cIn * 1.15 - i * .05, 0, 1)), D = RD * sc;
      var cx = dx + Math.cos(r[0]) * D * (1 - c), cy = dy + Math.sin(r[0]) * D * (1 - c);
      var rad = lerp(D - 420 * sc, D + r[1] * sc, k) * (1 - c) + 26 * sc * c;
      g.beginPath(); g.arc(cx, cy, Math.max(1, rad), 0, 6.283); g.stroke();
    });
    g.restore();
  }
  function feetScene(g, t) {
    var s0 = S('feet').t0, within = at('feet', 'within'), n16 = at('feet', '16'), feet = at('feet', 'feet');
    var pk = pop(t, s0 + .05, 2.4), z = lerp(1.2, FP.z, eio(seg(t, s0, within)));
    var r16 = 120;
    phone(g, FP.x, FP.y + (1 - Math.min(1, pk)) * 60, FP.w, FP.h, t, {
      a: clamp(pk * 2, 0, 1), zoom: z, rot: .01,
      inner: function (g, dx, dy) {
        var ck = seg(t, within - .05, n16 + .25);
        circleArc(g, dx, dy, r16, ck, 6, HOT, 1);
        if (ck > 0 && ck < 1) compass(g, dx, dy, r16, -Math.PI / 2 + 6.283 * ck, 1, 0);
        rings(g, dx, dy, 1, seg(t, n16 - .3, feet + .5), 0, 1);
      }
    });
    var fk = pop(t, n16 - .05, 3);
    chip(g, '16 FT', FP.x + 150, FP.y - 170, { px: 56, wt: 900, bg: HOT, fg: BG, a: clamp(fk * 2, 0, 1), s: lerp(.9, 1, clamp(fk, 0, 1)), rot: -.04 });
    label(g, 'TYPICAL, OPEN SKY · GPS.GOV', 540, 1420, seg(t, feet, feet + .3), CREAM, 36);
  }

  /* =====================================================================================================
     SCENE 17 · end: Einstein, built into the blue dot on your map → frame 0
     ===================================================================================================== */
  function endScene(g, t) {
    var s0 = S('end').t0, ein = at('end', 'einstein'), built = at('end', 'built'), blue = at('end', 'blue'), map = at('end', 'map');
    var k = eio(seg(t, s0, built + .2));
    /* the phone travels from the feet framing back to frame 0's */
    var x = lerp(FP.x, HK.phX, k), y = lerp(FP.y, HK.phY, k), w = lerp(FP.w, HK.phW, k), h = lerp(FP.h, HK.phH, k), z = lerp(FP.z, 1, k);
    var ak = eio(seg(t, built - .1, map));
    /* frame 0's other objects assemble round it */
    g.save(); g.globalAlpha *= ak;
    var bob = Math.sin(t * 1.1) * 8;
    dashLine(g, HK.satX + 120, HK.satY + 40 + bob, HK.phX - 50, HK.phY - HK.phH / 2 + 70, t, 'rgba(255,91,61,.55)', 4, 1);
    satellite(g, HK.satX - (1 - ak) * 300, HK.satY + bob, 1.3, 1, -.08 + .02 * Math.sin(t * .7), {});
    hookClocks(g, t, -(1 - ak) * 500, 0, 0);
    g.restore();
    var cr = 120 * w / FP.w * (1 - k);
    phone(g, x, y, w, h, t, { zoom: z / (w / 330) * (w / 330), rot: lerp(.01, .035, k) + .004 * Math.sin(t * .8) * k,
      inner: function (g, dx, dy) { circleArc(g, dx, dy, 120 * (w / FP.w) * (z / FP.z), 1, 6, HOT, 1 - seg(t, blue, map)); rings(g, dx, dy, w / FP.w, 1, seg(t, blue - .3, map + .2), 1 - seg(t, map + .2, HOME)); } });
    void cr;
    /* the tag: Einstein, clipped to the blue dot */
    var tagA = 1 - seg(t, map, HOME);
    g.save(); g.globalAlpha *= tagA; hangTag(g, x - 60, y - 30, 'EINSTEIN', t, ein - .1, HOT, BG); g.restore();
    headline(g, t, eio(seg(t, blue - .2, HOME)), 0, 0);
  }

  /* ---------- captions: the narrator's words; only stressed words get the coral pill ---------- */
  var CAPS = (function () {
    var MERGE = ['Your phone finds', 'So how does', 'About 30', 'they gain 38', 'So a test'], out = [];
    VO.captions.forEach(function (c) {
      var prev = out[out.length - 1], ptxt = prev && prev.words.map(function (w) { return w.w; }).join(' ');
      if (prev && MERGE.indexOf(ptxt) > -1) out[out.length - 1] = { t0: prev.t0, t1: c.t1, words: prev.words.concat(c.words) };
      else out.push(c);
    });
    return out;
  })();
  var STRESS = [['hook', 'clocks'], ['hook', 'space'], ['why', 'gps'], ['why', 'einstein'], ['sky', '30'], ['sky', '12000'], ['say', 'time'], ['say', 'where'],
    ['listen', 'never'], ['listen', 'listens'], ['trip', 'tenth'], ['math', 'distance'], ['three', 'one'], ['three', 'spot'], ['catch', 'foot'], ['catch', 'billionth'],
    ['fourth', 'fourth'], ['weird', 'faster'], ['speed', '8700'], ['speed', 'slows'], ['net', '38'], ['net', 'millionths'], ['net', 'fast'], ['miles', 'seven'], ['miles', 'error'],
    ['doubt', '1977'], ['switch', 'off'], ['result', 'twenty'], ['result', 'einstein'], ['fixed', 'corrected'], ['feet', '16'], ['feet', 'feet'], ['end', 'einstein'], ['end', 'blue'], ['end', 'dot']]
    .map(function (p) { return at(p[0], p[1]); });
  function stressed(w) { for (var i = 0; i < STRESS.length; i++) if (Math.abs(STRESS[i] - w.t0) < .02) return true; return false; }
  function captions(g, t, alpha) {
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
  var NOISE, SCENES = { hook: hookScene, sky: skyScene, say: sayScene, listen: listenScene, math: mathScene, three: threeScene, 'catch': catchScene, fourth: fourthScene,
    weird: weirdScene, net: netScene, miles: milesScene, doubt: doubtScene, 'switch': switchScene, result: resultScene, fixed: fixedScene, feet: feetScene, end: endScene };
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(48,52,72,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  var PRE = .35;
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    drift(g, t, 1);
    var si = sceneAt(t), Sc = SC[si];
    /* scene changes are the signal: a coral line sweeps across and takes the old scene with it */
    var sel = si + 1 < SC.length ? seg(t, Sc.t1 - .3, Sc.t1 - .02) : 0;
    var inK = si > 0 ? eo(seg(t, Sc.t0, Sc.t0 + .35)) : 1;
    g.save();
    var push = 1 + .015 * seg(t, Sc.t0, Sc.t1), cy = 1000;
    g.translate(540, cy); g.scale(push * lerp(.96, 1, inK), push * lerp(.96, 1, inK)); g.translate(-540, -cy);
    /* pre-roll: a new scene arrives already built (held at t0 + PRE) so a cut never shows a bare stage */
    SCENES[Sc.id](g, si > 0 && t < Sc.t0 + PRE ? Sc.t0 + PRE : t);
    g.restore();
    if (sel > 0) {
      var x1 = lerp(-40, 1120, eio(sel)), Nx = SC[si + 1];
      g.save(); g.beginPath(); g.rect(0, 450, x1, 1470); g.clip(); stage(g); drift(g, t, 1);
      g.translate(540, 1000); g.scale(.96, .96); g.translate(-540, -1000); SCENES[Nx.id](g, Nx.t0 + PRE); g.restore();
      g.save(); g.strokeStyle = HOT; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath();
      for (var yy = 470; yy <= 1440; yy += 10) { var xx = x1 + Math.sin(yy * .045 - t * 30) * 9; if (yy === 470) g.moveTo(xx, yy); else g.lineTo(xx, yy); }
      if (x1 < 920) g.stroke(); g.restore();
    }
    /* the loop: the end dissolves back into frame 0 */
    var back = eio(seg(t, HOME, HOME + .35));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g); drift(g, t - DUR, 1); hookScene(g, 0, t - DUR); g.restore(); }
    STAMPS.forEach(function (s) { stamp(g, s[0], s[6], s[7], t, s[1], s[2], s[3], s[4], s[5]); });
    usTag(g, t);
    if (POSTERMODE) posterTitle(g);
    else if (LIVE.text) { if (back > 0) { captions(g, t, 1 - back); captions(g, 0, back); } else captions(g, t); }
    if (!POSTERMODE) {
      g.fillStyle = 'rgba(244,237,224,.12)'; g.fillRect(60, 140, W - 120, 6);
      g.fillStyle = HOT; g.fillRect(60, 140, (W - 120) * (back > 0 ? 1 - back : t / DUR), 6);
    }
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

  /* the "so what" of a foot per nanosecond: 1 µs × c ≈ 983 ft. Lives from "billionth" until the fourth satellite */
  function usT() { return [at('catch', 'billionth') + .45, at('fourth', 'fourth') - .2]; }
  function usTag(g, t) {
    var r = usT(); if (t < r[0] || t > r[1] + .3) return;
    var k = sp(t, r[0], 3.2, .8), a = clamp(k * 3, 0, 1) * (1 - seg(t, r[1], r[1] + .3)), s = lerp(1.08, 1, clamp(k, 0, 1));
    g.save(); g.globalAlpha *= a; g.translate(540, 1335); g.rotate(-.025); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, -360 + 10, -78 + 14, 720, 156, 18); g.fill();
    rr(g, -360, -78, 720, 156, 18); g.fillStyle = CREAM; g.fill();
    font(g, 34, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = BG; g.fillText('1 MILLIONTH OF A SECOND OFF', 0, -36);
    font(g, 64, 900); try { g.fontStretch = 'expanded'; } catch (e) {} g.fillStyle = HOT; g.fillText('≈ 1,000 FT OFF', 0, 26);
    g.restore();
  }
  var POSTERMODE = false;
  function posterTitle(g) {
    g.save(); font(g, 70, 800); try { g.fontStretch = 'expanded'; } catch (e) {} g.textBaseline = 'alphabetic';
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText('Your phone finds you', 540, 320);
    var a = 'with clocks in ', b = 'space', wa = g.measureText(a).width, wb = g.measureText(b).width, x = 540 - (wa + wb) / 2;
    g.textAlign = 'left'; g.fillText(a, x, 420); g.fillStyle = HOT; g.beginPath(); g.roundRect(x + wa - 12, 420 - 60, wb + 24, 82, 16); g.fill();
    g.fillStyle = BG; g.fillText(b, x + wa, 420); g.restore();
  }
  function TEXTS(t) {
    var out = [];
    STAMPS.forEach(function (s, i) { if (t >= s[1] + .2 && t < s[2]) out.push({ id: 'stamp' + i, text: s[0], x0: 0, y0: 0, x1: 0, y1: 0 }); });
    if (t >= usT()[0] + .2 && t < usT()[1]) out.push({ id: 'us', text: '≈ 1,000 FT OFF', x0: 0, y0: 0, x1: 0, y1: 0 });
    /* the frames people screenshot: the DM fact and the small print under the seven-mile line */
    if (t >= at('net', '38') + .1 && t < S('net').t1 - .3) out.push({ id: 'dm', text: '+38 MILLIONTHS OF A SECOND', x0: 0, y0: 0, x1: 0, y1: 0 });
    if (t >= S('miles').t0 + .25 && t < S('miles').t1 - .3) out.push({ id: 'print', text: 'IF UNCORRECTED', x0: 0, y0: 0, x1: 0, y1: 0 });
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [];
  function initTimes() {
    var i;
    STAMPS.push(['RECEIVE ONLY', at('listen', 'listens') + .15, S('listen').t1 - .45, 50, REDINK, -.08, 610, 1300]);
    /* hook + why */
    EV.push({ t: at('hook', 'clocks'), type: 'tock', g: .5 }, { t: at('hook', 'space') + .05, type: 'swish' });
    for (i = 0; i < Math.floor(start('why') / .5); i++) EV.push({ t: .25 + i * .5, type: 'tick', g: .06 });
    EV.push({ t: at('why', 'gps'), type: 'pop', g: .8 }, { t: at('why', 'einstein') - .12, type: 'swing' });
    /* sky */
    for (i = 0; i < 30; i++) EV.push({ t: lerp(at('sky', 'about') - .1, at('sky', '30') + .15, Math.sqrt(i / 29)), type: 'blip', f: 900 + (i % 6) * 90, g: .025 });
    EV.push({ t: at('sky', '30') - .02, type: 'thump', g: .35 }, { t: at('sky', '12000') - .15, type: 'rise', t1: at('sky', 'miles') + .2 }, { t: at('sky', 'miles') + .2, type: 'tick', g: .3 });
    /* say: the ticket prints */
    EV.push({ t: S('say').t0 + .05, type: 'pop', g: .5 });
    EV.push({ t: at('say', 'two') - .05, type: 'thump', g: .3 });
    EV.push({ t: at('say', 'time') - .2, type: 'print', t1: at('say', 'time') + .45 }, { t: at('say', 'where') - .2, type: 'print', t1: at('say', 'where') + .4 });
    /* listen + trip */
    EV.push({ t: at('listen', 'talks') - .1, type: 'swish' }, { t: at('listen', 'never') - .02, type: 'buzz' });
    [0, .2, .4].forEach(function (d, j) { EV.push({ t: at('listen', 'listens') - .35 + (d + .2) * 1.3 * .9 + .25, type: 'recv', g: .8 }); });
    EV.push({ t: at('listen', 'listens') + .15, type: 'stamp' });
    EV.push({ t: at('trip', 'reaches') - .1, type: 'click' });
    for (i = 0; i < 12; i++) EV.push({ t: lerp(at('trip', 'reaches') - .1, at('trip', 'tenth') + .2, i / 11), type: 'tick', g: .12 });
    EV.push({ t: at('trip', 'tenth') + .2, type: 'ding1', f: 1 });
    /* math */
    EV.push({ t: at('math', 'trip') - .1 + .25, type: 'drop', g: .7 }, { t: at('math', 'times'), type: 'tick', g: .3 }, { t: at('math', 'speed') - .05 + .25, type: 'drop', g: .7 });
    EV.push({ t: at('math', 'light') - .1, type: 'swish' }, { t: at('math', 'equals'), type: 'tick', g: .3 }, { t: at('math', 'distance') - .05 + .25, type: 'drop', g: 1 }, { t: at('math', 'distance') + .3, type: 'ding1' });
    /* three: the compass */
    EV.push({ t: S('three').t0 + .05, type: 'paper' });
    [[at('three', 'three') - .1, at('three', 'three') + .55], [at('three', 'three', 1) - .1, at('three', 'three', 1) + .55], [at('three', 'distances') - .05, at('three', 'distances') + .6]]
      .forEach(function (d) { EV.push({ t: d[0], type: 'scrape', t1: d[1] }); });
    EV.push({ t: at('three', 'distances') + .6, type: 'tick', g: .3 }, { t: at('three', 'pinned') - .05 + .2, type: 'drop', g: 1 }, { t: at('three', 'spot') + .1, type: 'ding1' });
    /* catch */
    EV.push({ t: at('catch', 'but') - .05, type: 'thump', g: .5 }, { t: at('catch', 'light') - .05, type: 'zip', t1: at('catch', 'foot') + .35 }, { t: at('catch', 'foot'), type: 'tick', g: .35 }, { t: at('catch', 'billionth') - .05, type: 'pop', g: .8 });
    /* fourth */
    EV.push({ t: S('fourth').t0 + .05, type: 'paper' }, { t: at('fourth', 'isnt') - .1, type: 'wobble', t1: at('fourth', 'fixes') });
    EV.push({ t: at('fourth', 'fourth') - .05, type: 'scrape', t1: at('fourth', 'fourth') + .6 }, { t: at('fourth', 'fixes') + .05, type: 'snap' }, { t: at('fourth', 'fixes') + .25, type: 'drop', g: .9 });
    /* weird + speed */
    EV.push({ t: at('weird', 'weird') - .05, type: 'thump', g: .45 });
    var tw0 = S('weird').t0, tw1 = S('weird').t1;
    for (var tt = tw0 + .5; tt < tw1 - .2; tt += 1) EV.push({ t: tt, type: 'tock', g: .22 });
    for (tt = at('weird', 'faster'); tt < tw1 - .2; tt += .47) EV.push({ t: tt + .23, type: 'tick', g: .18 });
    EV.push({ t: at('weird', 'faster') - .05, type: 'pop', g: .7 });
    EV.push({ t: at('speed', 'speed') - .3, type: 'swish' }, { t: at('speed', '8700') - .25, type: 'rev', t1: at('speed', 'hour') }, { t: at('speed', 'slows') - .05, type: 'pop', g: .5 });
    /* net: the adding machine */
    EV.push({ t: S('net').t0 + .1, type: 'print', t1: S('net').t0 + .4 }, { t: at('net', 'net') - .1, type: 'print', t1: at('net', 'net') + .2 }, { t: at('net', 'result') - .1, type: 'print', t1: at('net', 'result') + .25 }, { t: at('net', 'result') + .25, type: 'ding1' });
    EV.push({ t: at('net', '38') - .08, type: 'stamp', big: true });
    /* miles */
    EV.push({ t: at('miles', 'seven') - .1, type: 'tape', t1: at('miles', 'miles') + .25 }, { t: at('miles', 'seven') - .08, type: 'thump', g: .4 }, { t: at('miles', 'error') - .15, type: 'tick', g: .3 });
    /* doubt */
    EV.push({ t: at('doubt', '1977') - .1, type: 'thump', g: .4 }, { t: at('doubt', 'not') - .25, type: 'paper', g: 1.4 }, { t: at('doubt', 'believed') - .1, type: 'mark' });
    /* switch */
    EV.push({ t: S('switch').t0 + .02, type: 'pop', g: .6 }, { t: at('switch', 'test') - .1, type: 'paper' }, { t: wend('switch', 'off') - .02, type: 'clack' });
    /* result */
    var r0 = S('result').t0 + .15, r1 = at('result', 'days') + .5;
    for (i = 1; i < 20; i++) EV.push({ t: r0 + (r1 - r0) * Math.pow(i / 19, 1 / .8), type: 'flip', g: .5 });
    EV.push({ t: at('result', 'fast') - .05, type: 'pop', g: .6 }, { t: at('result', 'almost') - .3, type: 'paper' }, { t: at('result', 'predicted') + .35, type: 'stamp' });
    /* fixed */
    for (i = 0; i < 30; i++) EV.push({ t: lerp(at('fixed', 'every') - .05, at('fixed', 'corrected') + .3, hash(i + 5)), type: 'blip', f: 1100 + (i % 5) * 120, g: .03 });
    EV.push({ t: at('fixed', 'corrected') + .35, type: 'ding' });
    /* feet */
    EV.push({ t: at('feet', 'within') - .05, type: 'scrape', t1: at('feet', '16') + .25 }, { t: at('feet', '16') - .05, type: 'pop', g: .8 });
    /* end */
    for (var ri = 0; ri < 4; ri++) EV.push({ t: at('feet', '16') - .3 + ri * .12, type: 'blip', f: 700 + ri * 110, g: .05 });
    EV.push({ t: at('end', 'blue') - .3, type: 'rise', t1: at('end', 'map') + .2 }, { t: at('end', 'map') + .2, type: 'ding1', f: 1 });
    EV.push({ t: at('end', 'einstein') - .1, type: 'swing' }, { t: at('end', 'built'), type: 'swish' }, { t: end('end') + .05, type: 'tick', g: .2 });
    SC.forEach(function (s, j) { if (j) EV.push({ t: s.t0 - .3, type: 'select' }); });
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

    function tickS(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .22], [t + .025, 0]]); }
    function tock(t, g) { var o = bus(1, .08), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 5; var n = noise(t, .04); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .3], [t + .035, 0]]); osc('sine', 820, t, t + .06, 1, [[t, 0], [t + .002, (g || .3) * .25], [t + .05, 0]]); }
    function blip(t, f, g) { var o = osc('sine', f, t, t + .12, 1, [[t, 0], [t + .004, g || .09], [t + .1, 0]], .3, clamp((f - 1100) / 1400, -1, 1)); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + .07); }
    function ding(t) { [76, 83, 88].forEach(function (m, j) { osc('sine', mtof(m), t + j * .04, t + 1.2, 1, [[t + j * .04, 0], [t + j * .04 + .005, .08], [t + 1.1, 0]], .5, (j - 1) * .4); }); }
    function ding1(t, hi) { osc('sine', mtof(hi ? 81 : 76), t, t + .7, 1, [[t, 0], [t + .005, .07], [t + .6, 0]], .4); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, 1, [[t, 0], [t + .004, g || .4], [t + .26, 0]], .1); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t - .12, t + .14, 900, 5200, .12, .02, 1.6); }
    function stampS(t, big, small) { thump(t, big ? .65 : small ? .32 : .45); var n = noise(t, .16), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1500; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .45 : small ? .2 : .32], [t + .12, 0]]); tickS(t + .005, .18); }
    function buzz(t) { osc('square', 110, t, t + .3, 1, [[t, 0], [t + .01, .04], [t + .26, .04], [t + .3, 0]], .05); osc('square', 116, t, t + .3, 1, [[t, 0], [t + .01, .035], [t + .26, .035], [t + .3, 0]], .05); }
    function paper(t, g) { g = g || 1; band(t - .03, t + .12, 1800, 3800, .07 * g, .02, 1.2, (rnd() - .5) * .8); tickS(t + .1, .08 * g); }
    function flip(t, g) { g = g || 1; band(t, t + .12, 2000, 5000, .08 * g, .02, 2, -.3); tickS(t + .1, .15 * g); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function recv(t, g) { var o = osc('sine', 990, t, t + .25, 1, [[t, 0], [t + .005, .06 * (g || 1)], [t + .2, 0]], .25); o.frequency.exponentialRampToValueAtTime(700, t + .18); }
    function mark(t) { band(t, t + .25, 2000, 3500, .05, .03, 2); }
    function drop(t, g) { g = g || 1; thump(t, .35 * g); tickS(t, .3 * g); }
    function click(t) { tickS(t, .5); thump(t, .3); tickS(t + .08, .25); }
    function clack(t) { tickS(t, .6); thump(t, .45); osc('sine', 1400, t, t + .05, 1, [[t, 0], [t + .002, .08], [t + .04, 0]]); }
    function swing(t) { band(t, t + .45, 700, 1600, .05, .02, 2); tickS(t + .45, .2); }
    function rise(t, t1) { band(t, t1, 400, 1800, .03, .06, 3); }
    /* a dot-matrix print: a fast run of ticks with a motor under it */
    function print(t, t1) { var n = Math.max(4, Math.floor((t1 - t) / .028)); for (var j = 0; j < n; j++) tickS(t + j * (t1 - t) / n, .07 + .04 * rnd()); band(t, t1, 500, 520, .02, .02, 4); }
    /* pencil on paper as the compass swings */
    function scrape(t, t1) { var n = Math.max(3, Math.floor((t1 - t) / .06)); for (var j = 0; j < n; j++) band(t + j * (t1 - t) / n, t + j * (t1 - t) / n + .07, 2600 + rnd() * 900, 3400, .035, .025, 3, .2); }
    function zip(t, t1) { band(t, t1, 1500, 7000, .02, .07, 3); }
    function wobble(t, t1) { var o = osc('sine', 300, t, t1, 1, [[t, 0], [t + .1, .03], [t1 - .1, .03], [t1, 0]], .1); var l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 7; lg.gain.value = 18; l.connect(lg); lg.connect(o.frequency); l.start(Math.max(0, t)); l.stop(t1); }
    function snap(t) { tickS(t, .5); osc('sine', 1800, t, t + .08, 1, [[t, 0], [t + .002, .07], [t + .07, 0]], .2); }
    function rev(t, t1) { var o = osc('sawtooth', 60, t, t1 + .2, 1, [[t, 0], [t + .1, .025], [t1, .03], [t1 + .2, 0]], .05); o.frequency.exponentialRampToValueAtTime(190, t1); var lp = null; void lp; }
    function tape(t, t1) { var n = Math.max(3, Math.floor((t1 - t) / .05)); for (var j = 0; j < n; j++) tickS(t + j * (t1 - t) / n, .1); band(t, t1, 1200, 2400, .03, .02, 2); }
    EV.forEach(function (e) {
      if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'tock') tock(e.t, e.g);
      else if (e.type === 'blip') blip(e.t, e.f, e.g);
      else if (e.type === 'ding') ding(e.t);
      else if (e.type === 'ding1') ding1(e.t, e.f);
      else if (e.type === 'thump') thump(e.t, e.g);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'stamp') stampS(e.t, e.big, e.small);
      else if (e.type === 'buzz') buzz(e.t);
      else if (e.type === 'paper') paper(e.t, e.g);
      else if (e.type === 'flip') flip(e.t, e.g);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'recv') recv(e.t, e.g);
      else if (e.type === 'mark') mark(e.t);
      else if (e.type === 'drop') drop(e.t, e.g);
      else if (e.type === 'click') click(e.t);
      else if (e.type === 'clack') clack(e.t);
      else if (e.type === 'swing') swing(e.t);
      else if (e.type === 'rise') rise(e.t, e.t1);
      else if (e.type === 'print') print(e.t, e.t1);
      else if (e.type === 'scrape') scrape(e.t, e.t1);
      else if (e.type === 'zip') zip(e.t, e.t1);
      else if (e.type === 'wobble') wobble(e.t, e.t1);
      else if (e.type === 'snap') snap(e.t);
      else if (e.type === 'rev') rev(e.t, e.t1);
      else if (e.type === 'tape') tape(e.t, e.t1);
      else if (e.type === 'select') band(e.t, e.t + .28, 1200, 3000, .05, .07, 2);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty */ }
    tickS(DUR - .35, .2);
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −50 dB, under the whole film so the silent tail (and the loop seam) is never digital zero */
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
    var fonts = ['800 84px Archivo', '700 46px Archivo', '900 46px Archivo', '600 46px Archivo', '500 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"', '800 30px "Geist Mono"', 'italic 400 96px "Instrument Serif"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈≠µ“”·→…'); })).then(function () { return document.fonts.ready; }).then(function () { STEX = {}; window.READY = true; });
  }
  initTimes();
  window.FILM = { bare: function (t) { ctx.setTransform(1, 0, 0, 1, 0, 0); stage(ctx); drift(ctx, t, 1); }, W: W, H: H, DUR: DUR, POSTER: at('hook', 'space') + .6, SLUG: 'gps', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
