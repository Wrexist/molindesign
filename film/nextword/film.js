/* "Next word" — what AI is, and how ChatGPT and Claude work. A vertical explainer written in code, narrated first and
   cut to the voice. Every visual beat is keyed to a word time from vo/vo.js (window.VO, written by tools/voiceover.py),
   so picture, captions and voice can't drift. Pure function of t like ../film.js. Contract: window.FILM, DUR,
   render(t), READY, EV, TEXTS(t), SCORE(ctx). The native move is the caret: the machine's mouth, on screen throughout. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur;
  var BG = '#15131b', PANEL = '#221f2b', PANEL2 = '#2c2838', CREAM = '#f4ede0', DIM = 'rgba(244,237,224,.42)', FAINT = 'rgba(244,237,224,.14)';
  var HOT = '#ff5b3d', YEL = '#ffc83d', MINT = '#3fd6a2', LIL = '#a48cff', SKY = '#53b6ff', BAD = '#ff4a5e';
  var CHIPS = [YEL, MINT, LIL, SKY, HOT];
  var DISP = 'Archivo', MONO = '"Geist Mono"';

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
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .72); }       // a pop-in that overshoots a little
  /* in for [a, b), springing in at a and easing out over `o` s at b */
  function win(t, a, b, o) { return t < a || t > b + (o || .3) ? 0 : clamp(sp(t, a), 0, 1.15) * (1 - eio(seg(t, b, b + (o || .3)))); }
  function fmtInt(n) { return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function at(id, word, nth) {                         // when a word starts; `word` is its text or its index
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }

  var SC = [
    { id: 'hook', name: 'A guess', t0: 0 },
    { id: 'tokens', name: 'Tokens', t0: start('tokens') - .25 },
    { id: 'game', name: 'Next word', t0: start('game') - .2 },
    { id: 'train', name: 'Training', t0: start('where') - .2 },
    { id: 'meaning', name: 'Meaning', t0: start('weird') - .25 },
    { id: 'attn', name: 'Attention', t0: start('looks') - .2 },
    { id: 'rate', name: 'Manners', t0: start('ramble') - .2 },
    { id: 'wrong', name: 'Still guessing', t0: start('still') - .95 },
    { id: 'end', name: 'Next word', t0: start('end') - .6 }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = end('end') + .35;
  var HELP1 = Math.min(at('rate', 'helpful') + 2.3, at('names', 'chatgpt') - .4);   // the ratings clear for the names
  /* stamps sit in the low band (y 1480) and outlive their scene, so each stays up long enough to read */
  var STAMPS = [
    ["THAT'S THE WHOLE TRICK", at('again', 'trick'), at('again', 'trick') + 3.05, 62, HOT, -.06],
    ['IT = TROPHY', at('trophy', 'trophy') + .15, at('trophy', 'trophy') + 2.55, 64, YEL, -.07],
    ['HELPFUL', at('rate', 'helpful'), HELP1 - .05, 0],
    ['MADE UP', at('still', 'wrong'), at('still', 'wrong') + 2.2, 96, BAD, -.1]
  ];                           // the end card starts dissolving back into frame 0

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  /* a token chip, centred on x,y. o: px, bg, fg, a, s (scale), rot, fam, wt, pad, line (outline colour) */
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    font(g, px, o.wt, o.fam);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad, w = tw + pad * 2, h = px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s, s);
    if (o.bg) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
    g.fillStyle = o.fg || (o.bg ? BG : CREAM); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, px * .04); g.restore();
    return w;
  }
  function textW(g, text, px, wt, fam) { font(g, px, wt, fam); return g.measureText(text).width; }
  function label(g, text, x, y, a, col, px) {
    px = Math.max(30, px || 32);
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, px, 500, MONO); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = col || DIM; try { g.letterSpacing = '4px'; } catch (e) {}
    g.fillText(text, x, y + (1 - Math.min(1, a)) * 14); g.restore();
  }
  /* the caret: solid while typing, blinking when it waits */
  function caret(g, x, y, h, t, busy, col, a) {
    var on = busy ? 1 : (Math.cos(t * Math.PI * 2 * 1.05) > -.2 ? 1 : .15);
    g.save(); g.globalAlpha *= (a == null ? 1 : a) * on; g.fillStyle = col || HOT; rr(g, x - h * .045, y - h / 2, h * .09, h, h * .045); g.fill(); g.restore();
  }
  function stamp(g, text, x, y, t, t0, t1, px, col, rot) {
    if (t < t0 || t > t1 + .3) return;
    var k = sp(t, t0, 3, .55), out = 1 - seg(t, t1, t1 + .3), s = lerp(1.8, 1, clamp(k, 0, 1.2));
    g.save(); g.globalAlpha = clamp(k * 3, 0, 1) * out; g.translate(x, y); g.rotate(rot == null ? -.12 : rot); g.scale(s, s);
    font(g, px, 900); var w = g.measureText(text).width + px * .7, h = px * 1.25;
    rr(g, -w / 2, -h / 2, w, h, px * .18); g.strokeStyle = col; g.lineWidth = px * .09; g.stroke();
    g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, px * .05); g.restore();
  }
  function bubble(g, x, y, w, h, col, a, tail) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); rr(g, x, y, w, h, 34); g.fillStyle = col; g.fill();
    if (tail) { g.beginPath(); var tx = tail < 0 ? x + 40 : x + w - 40; g.moveTo(tx - 18, y + h - 4); g.lineTo(tx + tail * 22, y + h + 26); g.lineTo(tx + 18, y + h - 4); g.fill(); }
    g.restore();
  }
  function dial(g, x, y, r, ang, a, hot) {
    g.save(); g.globalAlpha *= a; g.translate(x, y);
    g.beginPath(); g.arc(0, 0, r, 0, 6.283); g.fillStyle = PANEL2; g.fill(); g.strokeStyle = hot ? HOT : FAINT; g.lineWidth = 3; g.stroke();
    g.rotate(ang); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r * .78); g.strokeStyle = hot ? HOT : CREAM; g.lineWidth = 5; g.lineCap = 'round'; g.stroke();
    g.beginPath(); g.arc(0, 0, r * .16, 0, 6.283); g.fillStyle = CREAM; g.fill(); g.restore();
  }
  function arrow(g, x0, y0, x1, y1, k, col, lw) {
    if (k <= 0) return;
    var x = lerp(x0, x1, k), y = lerp(y0, y1, k), a = Math.atan2(y1 - y0, x1 - x0);
    g.save(); g.strokeStyle = g.fillStyle = col; g.lineWidth = lw || 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x - Math.cos(a) * 18, y - Math.sin(a) * 18); g.stroke();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a - .45) * 38, y - Math.sin(a - .45) * 38); g.lineTo(x - Math.cos(a + .45) * 38, y - Math.sin(a + .45) * 38); g.closePath(); g.fill();
    g.restore();
  }
  /* next-word odds: rows of [word, percent], growing from k; `pick` (0..1) lights the top row */
  function odds(g, rows, x, y, wBar, k, pick, a, rowH, px) {
    if (a <= 0) return;
    rowH = rowH || 78; px = px || 46;
    g.save(); g.globalAlpha *= clamp(a, 0, 1);
    var lw = 0; rows.forEach(function (r) { lw = Math.max(lw, textW(g, r[0], px, 800)); });
    rows.forEach(function (r, i) {
      var ki = clamp(spring(k * 1.6 - i * .12, 1.4, .8), 0, 1.05), yy = y + i * rowH, top = i === 0 && pick > 0;
      g.globalAlpha = clamp(a, 0, 1) * clamp(ki * 2, 0, 1);
      font(g, px, 800); g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = top ? HOT : CREAM;
      g.fillText(r[0], x + lw, yy);
      var bx = x + lw + 26, bw = Math.max(6, (wBar - lw - 160) * r[1] / 100 * ki);
      rr(g, bx, yy - rowH * .3, wBar - lw - 160, rowH * .6, 10); g.fillStyle = 'rgba(244,237,224,.06)'; g.fill();
      rr(g, bx, yy - rowH * .3, bw, rowH * .6, 10); g.fillStyle = top ? HOT : i === 0 ? CREAM : 'rgba(244,237,224,.55)'; g.fill();
      font(g, Math.max(30, px * .7), 500, MONO); g.textAlign = 'left'; g.fillStyle = top ? HOT : DIM;
      g.fillText((r[1] < 1 ? r[1].toFixed(2) : Math.round(r[1] * ki)) + '%', bx + bw + 16, yy + 2);
    });
    g.restore();
  }
  /* lay words out in lines from x0, wrapping at maxW; returns [{w, x, y, wd}] (x = left edge, y = baseline centre) */
  function layout(g, words, x0, y0, maxW, px, lh, wt) {
    font(g, px, wt || 700); var sp = px * .3, x = x0, y = y0, out = [];
    words.forEach(function (w) {
      var wd = g.measureText(w).width;
      if (x + wd > x0 + maxW && x > x0) { x = x0; y += lh; }
      out.push({ w: w, x: x, y: y, wd: wd }); x += wd + sp;
    });
    return out;
  }

  /* ---------- background: a slow drift of faint tokens, so the frame is never still ---------- */
  var DRIFT = (function () {
    var r = mulberry(5), words = ['the', 'ing', ' of', 'Un', ' cat', '!', ' and', 'GPT', ' to', 'able', ' a', '42', ' is', 'ly', '?', ' you', 'tion', ' it'], out = [];
    for (var i = 0; i < 26; i++) out.push({ w: words[i % words.length], x: r() * W, y: r() * H, v: 14 + r() * 26, px: 30 + r() * 36, c: CHIPS[i % 5] });
    return out;
  })();
  function drift(g, t, a) {
    if (a <= 0) return;
    g.save();
    DRIFT.forEach(function (d) {
      var y = ((d.y - t * d.v) % (H + 200) + H + 200) % (H + 200) - 100;
      g.globalAlpha = .05 * a; chip(g, d.w, d.x, y, { px: d.px, line: d.c, fg: d.c, wt: 700, lw: 2 });
    });
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · the hook: a chat reply that is really a string of guesses
     ===================================================================================================== */
  var REPLY = [
    ['Sure!', 'Okay!', 'Yes!'], ['Fun', "Here's", 'A'], ['fact:', 'idea:', 'one:'], ['octopuses', 'cats', 'bees'],
    ['have', 'own', 'grow'], ['three', 'two', 'nine'], ['hearts,', 'brains,', 'legs,'], ['blue', 'green', 'cold'],
    ['blood,', 'eyes,', 'skin,'], ['and', 'plus', 'but'], ['they', 'some', 'many'], ['can', 'may', 'often'],
    ['taste', 'smell', 'see'], ['with', 'using', 'through'], ['their', 'all', 'eight'], ['arms.', 'feet.', 'suckers.']
  ];
  var RP = REPLY.map(function (r, i) { var p = 46 + Math.round(hash(i + 3) * 46); return [p, Math.round((100 - p) * (.45 + hash(i) * .3)), 0]; });
  RP.forEach(function (p) { p[2] = Math.max(1, Math.round((100 - p[0] - p[1]) * .5)); });
  var HOOK = { x: 140, y: 760, w: 800, px: 66, lh: 106 };
  function typeTime(i) { var a = .25, b = Math.min(end('smart') - .2, start('tokens') - .6); return a + (b - a) * Math.pow(i / (REPLY.length - 1), .92); }
  function hookScene(g, t, homeMode) {
    var guess = homeMode ? 99 : at('hook', 'guess'), smart = homeMode ? 99 : at('smart', 'smart');
    /* the user's question */
    var ua = 1;
    bubble(g, 430, 520, 520, 104, PANEL2, ua, 1);
    chip(g, 'Tell me something cool', 690, 572, { px: 40, wt: 600, fg: CREAM, pad: 0 });
    label(g, '● ASSISTANT', 248, 694, 1, MINT, 30);
    var words = REPLY.map(function (r) { return r[0]; }), L = layout(g, words, HOOK.x, HOOK.y + 40, HOOK.w, HOOK.px, HOOK.lh), shown = 0;
    for (var i = 0; i < words.length; i++) if (t >= typeTime(i)) shown = i + 1;
    if (homeMode) shown = 0;
    var lastY = shown ? L[shown - 1].y : L[0].y, bh = lastY - HOOK.y + 120 + (t >= guess ? 30 : 0);
    bubble(g, HOOK.x - 40, HOOK.y - 30, HOOK.w + 80, Math.max(150, bh), PANEL, 1);
    /* the words typed so far, each with the odds it was picked at once the hook says "guess" */
    for (i = 0; i < shown; i++) {
      var p = L[i], k = clamp(sp(t, typeTime(i), 4, .6), 0, 1.1), tag = sp(t, guess + i * .025, 3, .7);
      font(g, HOOK.px, 700); g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillStyle = i === shown - 1 && t - typeTime(i) < .25 ? HOT : CREAM;
      g.save(); g.translate(p.x, p.y + (1 - Math.min(1, k)) * 18); g.globalAlpha = clamp(k * 2, 0, 1); g.fillText(p.w, 0, 0); g.restore();
      if (t >= guess) { var tw0 = textW(g, RP[i][0] + '%', 30, 500, MONO); chip(g, RP[i][0] + '%', p.x + tw0 / 2 + 10, p.y + 52, { px: 30, fam: MONO, wt: 500, bg: i % 3 === 1 ? YEL : MINT, fg: BG, pad: 10, a: clamp(tag, 0, 1), s: lerp(1.6, 1, clamp(tag, 0, 1)) }); }
    }
    /* on "guess": every word it typed branches into the words it didn't pick, then the branches fold away */
    var tree = homeMode ? 0 : seg(t, guess, guess + .5) * (1 - eio(seg(t, start('smart') - .35, start('smart') + .15)));
    if (tree > 0) for (i = 0; i < shown; i++) for (var b = 1; b < 3; b++) {
      var q = L[i], k2 = clamp(sp(t, guess + i * .04 + b * .05, 2.4, .7), 0, 1.1) * tree / Math.max(.001, seg(t, guess, guess + .5) || 1);
      k2 = Math.min(k2, tree * 1.1);
      var ox = q.x + q.wd / 2, oy = q.y + 30, slot = i * 2 + b - 1, tx2 = 150 + (slot % 6) * 156 + (Math.floor(slot / 6) % 2) * 50, ty2 = 1210 + Math.floor(slot / 6) * 82;
      if (slot >= 18) continue;
      g.save(); g.globalAlpha = .4 * clamp(k2, 0, 1); g.strokeStyle = b === 1 ? LIL : SKY; g.lineWidth = 3;
      g.beginPath(); g.moveTo(ox, oy); g.bezierCurveTo(ox, lerp(oy, ty2, .6), tx2, lerp(oy, ty2, .4), lerp(ox, tx2, k2), lerp(oy, ty2, k2)); g.stroke(); g.restore();
      chip(g, REPLY[i][b].replace(/[.,:!]$/, ''), lerp(ox, tx2, k2), lerp(oy, ty2, k2), { px: 38, wt: 700, line: b === 1 ? LIL : SKY, fg: b === 1 ? LIL : SKY, a: clamp(k2, 0, 1) * .9, pad: 12 });
    }
    label(g, 'EVERY WORD BEAT THE OTHERS', 540, 1446, tree, DIM, 30);
    /* the caret and, under it, the odds for the next word */
    var nx = shown < words.length ? L[shown].x : L[shown - 1].x + L[shown - 1].wd + 14, ny = shown < words.length ? L[shown].y : L[shown - 1].y;
    if (shown > 0 && shown < words.length && L[shown].x === HOOK.x) { nx = HOOK.x; }
    var busy = shown > 0 && shown < words.length;
    caret(g, nx - 4, ny, 66, t, busy);
    if (shown < words.length && tree <= 0) {
      var t0 = shown ? typeTime(shown - 1) + .05 : -1, t1 = typeTime(shown), kk = clamp((t - t0) / Math.max(.12, t1 - t0), 0, 1);
      if (homeMode) kk = .85;
      var opts = REPLY[shown], pr = RP[shown], px0 = clamp(nx - 20, 140, 560), py0 = ny + 96, big0 = shown === 0 ? 1.55 : 1;
      g.save(); g.translate(px0 - 20, py0 - 40); g.scale(big0, big0); g.translate(-(px0 - 20), -(py0 - 40));
      g.save(); rr(g, px0 - 20, py0 - 40, 450, 3 * 62 + 28, 22); g.fillStyle = 'rgba(14,12,18,.92)'; g.fill(); g.strokeStyle = FAINT; g.lineWidth = 2; g.stroke(); g.restore();
      for (var j = 0; j < 3; j++) {
        var yy = py0 + j * 62, bw = 110 * pr[j] / 100 * ss(clamp(kk * 1.4 - j * .1, 0, 1)), hot = j === 0 && kk > .8;
        font(g, 40, 700); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = hot ? HOT : j ? DIM : CREAM; g.fillText(opts[j].replace(/[.,:!]$/, ''), px0, yy);
        rr(g, px0 + 250, yy - 12, Math.max(3, bw), 24, 8); g.fillStyle = hot ? HOT : j ? 'rgba(244,237,224,.35)' : CREAM; g.fill();
        font(g, 30, 500, MONO); g.fillStyle = hot ? HOT : DIM; g.fillText(Math.round(pr[j] * ss(clamp(kk * 1.4 - j * .1, 0, 1))) + '%', px0 + 262 + Math.max(3, bw), yy + 2);
      }
      g.restore();
    }
    /* "…sound this smart?" — the question mark drops in */
    if (t >= smart - .05) {
      var q = sp(t, smart - .05, 2.2, .5), qy = lerp(-200, 1420, clamp(q, 0, 1.2));
      g.save(); g.translate(800, qy); g.rotate(.18 - .18 * clamp(q, 0, 1)); chip(g, '?', 0, 0, { px: 210, bg: HOT, fg: BG, wt: 900, pad: 70, r: 60 }); g.restore();
    }
  }

  /* =====================================================================================================
     SCENE 2 · tokens: words are cut into chunks, and chunks become numbers
     ===================================================================================================== */
  var TOK = [
    { w: 'Unbelievable!', t: ['Un', 'believ', 'able', '!'], id: ['1844', '6553', '481', '0'], y: 900 },
    { w: 'I love pizza', t: ['I', ' love', ' pizza'], id: ['40', '3021', '23317'], y: 1120 },
    { w: 'ChatGPT', t: ['Chat', 'G', 'PT'], id: ['16047', '38', '2898'], y: 1340 }
  ];
  function tokenScene(g, t) {
    var s0 = SC[1].t0, cut = at('tokens', 'tokens'), num = at('numbers', 'number'), chunk = start('numbers');
    TOK.forEach(function (row, ri) {
      var ap = clamp(sp(t, s0 + .1 + ri * .12, 2.2, .75), 0, 1.1), px = ri === 0 ? 86 : 104;
      font(g, px, 800);
      var ws = row.t.map(function (s) { return g.measureText(s.replace(/^ /, '')).width; }), gap0 = 0;
      var split = ss(seg(t, cut + ri * .1, cut + ri * .1 + .35)), gap = 34 * split + 10 * (row.t.length > 1 ? split : 0);
      var pad = px * .3 * split, total = ws.reduce(function (a, b) { return a + b; }, 0) + (row.t.length - 1) * gap + row.t.length * pad * 2;
      if (row.w.indexOf(' ') > -1) total += (1 - split) * textW(g, ' ', px) * 2;
      var x = 540 - total / 2, y = row.y + (1 - Math.min(1, ap)) * 60 + Math.sin(t * 2.2 + ri) * 6 * seg(t, chunk, chunk + .4);
      row.t.forEach(function (s, i) {
        var wd = ws[i] + pad * 2, cx = x + wd / 2, flip = seg(t, num + i * .07 + ri * .05, num + i * .07 + ri * .05 + .28), fs = Math.abs(Math.cos(flip * Math.PI));
        var showId = flip > .5, col = CHIPS[(ri * 2 + i) % 5];
        g.save(); g.translate(cx, y); g.scale(1, Math.max(.02, fs)); g.globalAlpha = clamp(ap * 2, 0, 1);
        if (split > 0) { rr(g, -wd / 2, -px * .64, wd, px * 1.28, 26); g.fillStyle = col; g.globalAlpha *= split; g.fill(); g.globalAlpha = clamp(ap * 2, 0, 1); }
        font(g, showId ? px * .72 : px, showId ? 500 : 800, showId ? MONO : DISP); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = split > .5 ? BG : CREAM; g.fillText(showId ? row.id[i] : s.replace(/^ /, ''), 0, px * .05);
        g.restore();
        /* the knife: a hot line that sweeps down each boundary */
        if (i > 0) {
          var kt = cut + ri * .1 + (i - 1) * .06, kk = seg(t, kt - .12, kt), ko = 1 - seg(t, kt + .05, kt + .3);
          if (kk > 0 && ko > 0) { g.save(); g.globalAlpha = ko; g.strokeStyle = HOT; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - gap / 2, y - 90); g.lineTo(x - gap / 2, y - 90 + 180 * kk); g.stroke(); g.restore(); }
        }
        x += wd + gap + (row.w.charAt(row.w.indexOf(s.replace(/^ /, '')) + s.replace(/^ /, '').length) === ' ' ? (1 - split) * textW(g, ' ', px) : 0);
      });
    });
    label(g, 'TOKENS', 540, 700, win(t, cut + .1, num - .15, .2), HOT, 34);
    label(g, 'EVERY TOKEN = A NUMBER', 540, 700, win(t, num, SC[1].t1 - .25, .2), YEL, 30);
    label(g, '1 TOKEN ≈ ¾ OF A WORD', 540, 1460, win(t, chunk + .2, SC[1].t1 - .25, .2));
  }

  /* =====================================================================================================
     SCENE 3 · the game: guess the next word, stick it on, guess again
     ===================================================================================================== */
  var BASE = ['The', 'cat', 'sat', 'on', 'the'];
  var PICKS = [
    [['mat', 41], ['floor', 17], ['couch', 12], ['bed', 9], ['roof', 6], ['moon', .01]],
    [['and', 34], ['while', 14], ['all', 9], ['for', 7]],
    [['purred', 28], ['slept', 22], ['stared', 11], ['waited', 8]],
    [['like', 31], ['loudly', 26], ['softly', 14], ['all', 7]],
    [['a', 72], ['an', 9], ['some', 5], ['the', 4]],
    [['tiny', 33], ['little', 21], ['small', 17], ['warm', 8]],
    [['engine.', 46], ['motor.', 28], ['tractor.', 9], ['dragon.', 2]]
  ];
  function pickTimes() {
    var a = at('again', 'pick'), b = at('again', 'trick') - .15, out = [{ show: start('cat') + .1, pick: at('cat', 'mat'), fly: a }];
    for (var i = 1; i < PICKS.length; i++) {
      var u0 = Math.pow((i - 1) / (PICKS.length - 1), .75), u1 = Math.pow(i / (PICKS.length - 1), .75);
      var s = lerp(a + .35, b, u0), f = lerp(a + .35, b, u1);
      out.push({ show: s, pick: lerp(s, f, .6), fly: f });
    }
    return out;
  }
  var PT;
  function gameScene(g, t) {
    var s0 = SC[2].t0;
    var n = 0; for (var i = 0; i < PT.length; i++) if (t >= PT[i].fly) n = i + 1;
    var words = BASE.slice(); for (i = 0; i < n; i++) words.push(PICKS[i][0][0]);
    var L = layout(g, words, 150, 760, 780, 70, 96, 800), last = L[L.length - 1];
    var ap = clamp(sp(t, s0 + .05, 2.2, .8), 0, 1.1);
    bubble(g, 110, 680, 860, Math.max(170, last.y - 680 + 90), PANEL, ap);
    L.forEach(function (p, i) {
      var k = i < BASE.length ? clamp(sp(t, s0 + .1 + i * .06, 3, .7), 0, 1.1) : clamp(sp(t, PT[i - BASE.length].fly, 3.2, .6), 0, 1.15);
      var fresh = i >= BASE.length && t - PT[i - BASE.length].fly < .4;
      font(g, 70, 800); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = fresh ? HOT : CREAM;
      g.save(); g.globalAlpha = clamp(k * 2, 0, 1); g.translate(p.x, p.y + (1 - Math.min(1, k)) * 40); g.fillText(p.w, 0, 0); g.restore();
    });
    var cx = last.x + last.wd + 18, cy = last.y, nextBig = win(t, at('game', 'next'), at('game', 'next') + .5, .3);
    caret(g, cx, cy, 78 * (1 + .5 * nextBig), t, false);
    /* the odds for the next word, under the sentence */
    var cur = Math.min(n, PICKS.length - 1), pt = PT[cur];
    if (n < PICKS.length && t >= pt.show) {
      var rows = PICKS[cur], k = seg(t, pt.show, pt.show + Math.min(.9, (pt.fly - pt.show) * .8)), pk = t >= pt.pick ? 1 : 0;
      var y0 = Math.max(1000, last.y + 200);
      odds(g, rows, 150, y0, 800, k, pk, 1 - seg(t, pt.fly - .06, pt.fly), cur === 0 ? 74 : 70, cur === 0 ? 50 : 46);
      if (cur === 0) {
        var moon = win(t, at('cat', 'moon'), pt.fly - .1, .2);
        if (moon > 0) { g.save(); g.globalAlpha = clamp(moon, 0, 1); g.strokeStyle = YEL; g.lineWidth = 5; g.beginPath(); g.ellipse(560, y0 + 5 * 74, 120, 44, 0, 0, 6.283); g.stroke(); g.restore(); label(g, 'ALMOST NEVER', 760, y0 + 5 * 74 - 70, moon, YEL, 30); }
      }
      /* the top word lifts off the chart and flies onto the end of the sentence */
      if (t >= pt.fly - .25 && t < pt.fly) {
        var fk = eio(seg(t, pt.fly - .25, pt.fly)), w = rows[0][0];
        chip(g, w, lerp(330, cx + textW(g, w, 70, 800) / 2, fk), lerp(y0, cy, fk), { px: lerp(50, 70, fk), bg: HOT, fg: BG });
      }
    }
    label(g, 'PICK · ADD · REPEAT', 540, 600, win(t, at('again', 'pick'), SC[2].t1 - .25, .2), HOT);
  }

  /* =====================================================================================================
     SCENE 4 · training: read everything, hide the next word, guess, check, nudge the dials
     ===================================================================================================== */
  var PAGES = (function () {
    var r = mulberry(19), tags = ['BOOKS', 'WEB', 'CODE', 'WIKI', 'FORUMS', 'NEWS', 'RECIPES', 'PAPERS'], out = [];
    for (var i = 0; i < 70; i++) out.push({ u: Math.pow(i / 70, 1.6), x: 150 + r() * 780, rot: (r() - .5) * .7, tag: i % 4 === 0 ? tags[(i / 4) % tags.length] : '', c: CHIPS[i % 5], lines: 4 + (r() * 4 | 0), seed: i });
    return out;
  })();
  var DIALS = (function () { var out = [], r = mulberry(29); for (var y = 0; y < 5; y++) for (var x = 0; x < 9; x++) out.push({ x: x, y: y, a0: (r() - .5) * 4, d: (r() - .5) * 1.4, ph: r() * 6.28 }); return out; })();
  function page(g, p, x, y, s, a) {
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(p.rot); g.scale(s, s);
    rr(g, -70, -90, 140, 180, 14); g.fillStyle = CREAM; g.fill();
    rr(g, -70, -90, 140, 26, [14, 14, 0, 0]); g.fillStyle = p.c; g.fill();
    for (var i = 0; i < p.lines; i++) { rr(g, -52, -44 + i * 20, 104 * (.55 + .45 * hash(p.seed * 7 + i)), 9, 4); g.fillStyle = 'rgba(21,19,27,.28)'; g.fill(); }
    if (p.tag) { font(g, 18, 500, MONO); g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.tag, 0, -76); }
    g.restore();
  }
  function trainScene(g, t) {
    var s0 = SC[3].t0, read = at('where', 'reading'), tril = at('hide', 'trillions'), hide = at('hide', 'hide'), guess = at('hide', 'guess'),
      check = at('hide', 'check'), wrong = at('dials', 'wrong'), nudge = at('dials', 'nudge'), dials = at('dials', 'dials'), again = at('dials', 'again');
    /* the model: a box with a caret in it, that grows into a wall of dials */
    var grow = eio(seg(t, nudge - .2, nudge + .35)), my = lerp(lerp(1150, 1240, eio(seg(t, hide - .3, hide + .2))), 1165, grow);
    var mw = lerp(380, 900, grow), mh = lerp(250, 440, grow), ap = clamp(sp(t, s0 + .05, 2, .8), 0, 1.1);
    /* pages pour in from the top */
    var pour0 = read - .5, pour1 = hide + .2;
    PAGES.forEach(function (p, i) {
      var tp = lerp(pour0, pour1 - .6, p.u), k = seg(t, tp, tp + .7);
      if (k <= 0 || k >= 1) return;
      var y = lerp(-120, my - 40, k * k), x = lerp(p.x, 540 + (p.x - 540) * .15, k * k);
      page(g, p, x, y, lerp(1, .3, k * k), 1);
    });
    g.save(); g.globalAlpha = clamp(ap, 0, 1);
    rr(g, 540 - mw / 2, my - mh / 2, mw, mh, 36); g.fillStyle = PANEL; g.fill(); g.strokeStyle = 'rgba(244,237,224,.25)'; g.lineWidth = 3; g.stroke();
    var gulp = 0; PAGES.forEach(function (p) { var tp = lerp(pour0, pour1 - .6, p.u) + .7; if (t > tp && t < tp + .15) gulp = Math.max(gulp, 1 - (t - tp) / .15); });
    if (gulp > 0) { rr(g, 540 - mw / 2, my - mh / 2, mw, mh, 36); g.strokeStyle = 'rgba(255,91,61,' + (.6 * gulp) + ')'; g.lineWidth = 6; g.stroke(); }
    g.restore();
    if (grow < .5) { label(g, 'MODEL', 540, my - mh / 2 + 44, (1 - grow * 2) * ap, DIM, 30); caret(g, 540, my + 18, 80, t, t > pour0 && t < pour1, HOT, 1 - grow * 2); }
    if (grow > 0) {
      var wrongK = seg(t, wrong, wrong + .3) * (1 - seg(t, again, again + .3));
      DIALS.forEach(function (d) {
        var dx = 540 + (d.x - 4) * 92, dy = my + (d.y - 2) * 76 + 6, appear = clamp(sp(t, nudge - .1 + (d.x + d.y) * .025, 3, .7), 0, 1.1);
        var tw = seg(t, nudge, nudge + .5) * d.d + Math.sin((t - nudge) * 9 + d.ph) * .12 * win(t, nudge, again, .4) + seg(t, again, again + .4) * d.d * .5;
        dial(g, dx, dy, 32 * Math.min(1, appear), d.a0 + tw, clamp(grow * 2 - 1, 0, 1), Math.abs(tw) > .55 && wrongK > 0);
      });
      label(g, 'BILLIONS OF DIALS (PARAMETERS)', 540, my + mh / 2 + 36, win(t, dials, SC[3].t1 - .3, .2), YEL, 30);
    }
    /* the counter: words read */
    var ca = win(t, read - .1, SC[3].t1 - .3, .2);
    if (ca > 0) {
      var cnt = t < tril ? 2e9 * ss(seg(t, read, tril)) : lerp(2e9, 1e13, eo(seg(t, tril, tril + 1.1)));
      chip(g, fmtInt(cnt), 540, 640, { px: 76, fam: MONO, wt: 500, fg: t >= tril ? YEL : CREAM, pad: 0, a: ca });
      label(g, '~10 TRILLION WORDS READ', 540, 716, ca, DIM, 30);
    }
    /* the quiz: the sky is ___ */
    var qa = win(t, hide - .05, SC[3].t1 - .3, .2);
    if (qa > 0) {
      var qy = 880;
      chip(g, 'The sky is', 420, qy, { px: 66, a: qa });
      var flip = seg(t, check, check + .3), fs = Math.abs(Math.cos(flip * Math.PI)), reveal = flip > .5;
      g.save(); g.globalAlpha = clamp(qa, 0, 1); g.translate(750, qy); g.scale(1, Math.max(.02, fs));
      rr(g, -110, -48, 220, 96, 20); g.fillStyle = reveal ? MINT : HOT; g.fill();
      font(g, 62, 900); g.fillStyle = BG; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(reveal ? 'blue' : '?', 0, 4); g.restore();
      /* the guess rises out of the model to sit above the hidden word */
      var gk = eio(seg(t, guess - .1, guess + .35)), second = t >= again;
      if (gk > 0) {
        var gw = second ? 'blue' : 'green', gk2 = second ? eio(seg(t, again, again + .4)) : gk, bad = !second && t >= at('hide', 'answer');
        var gy = lerp(my - 40, qy - 120, gk2);
        chip(g, gw, 750 + (bad ? Math.sin(t * 60) * 6 * (1 - seg(t, wrong, wrong + .5)) * seg(t, wrong - .05, wrong) : 0), gy, { px: 54, bg: bad ? BAD : second && t > again + .35 ? MINT : PANEL2, fg: bad || (second && t > again + .35) ? BG : CREAM, a: qa });
        if (bad) label(g, '✗ WRONG', 750, qy - 196, qa, BAD, 30);
        if (second && t > again + .35) label(g, '✓ RIGHT', 750, qy - 196, qa, MINT, 30);
      }
      label(g, 'GUESS', 300, qy - 120, win(t, guess, check, .2), DIM, 30);
    }
  }

  /* =====================================================================================================
     SCENE 5 · meaning: a map where close words mean close things; king − man + woman ≈ queen
     ===================================================================================================== */
  var MAP = [
    ['horse', 190, 700], ['dog', 380, 720], ['cat', 230, 840], ['cow', 410, 870],
    ['apple', 650, 700], ['taco', 860, 720], ['pizza', 700, 850], ['bread', 890, 880],
    ['train', 870, 1120], ['bus', 930, 1240], ['car', 810, 1290],
    ['man', 240, 1340], ['woman', 640, 1340], ['king', 240, 1070], ['queen', 640, 1070], ['prince', 170, 1190]
  ];
  var MAPI = {}; MAP.forEach(function (m, i) { MAPI[m[0]] = i; m.rx = 150 + hash(i * 5 + 1) * 780; m.ry = 640 + hash(i * 9 + 2) * 760; });
  function meaningScene(g, t) {
    var s0 = SC[4].t0, mean = at('weird', 'mean'), king = at('queen', 'king'), man = at('queen', 'man'), woman = at('queen', 'woman'),
      lands = at('queen', 'lands'), queen = at('queen', 'queen');
    var hi = { king: win(t, king, SC[4].t1, .2), man: win(t, man, SC[4].t1, .2), woman: win(t, woman, SC[4].t1, .2), queen: win(t, queen, SC[4].t1, .2) };
    MAP.forEach(function (m, i) {
      var k = clamp(sp(t, mean - .1 + i * .03, 1.1, .78), 0, 1.06), ap = clamp(sp(t, s0 + i * .03, 3, .7), 0, 1);
      var x = lerp(m.rx, m[1], k) + Math.sin(t * 1.3 + i) * 8 * (1 - k * .7), y = lerp(m.ry, m[2], k) + Math.cos(t * 1.1 + i * 2) * 8 * (1 - k * .7);
      m.x = x; m.y = y;
      var h = hi[m[0]] || 0, dim = t > king ? (h > 0 ? 1 : .35) : 1;
      g.save(); g.globalAlpha = ap * dim;
      g.beginPath(); g.arc(x, y, 15 + 7 * h, 0, 6.283); g.fillStyle = h > 0 ? (m[0] === 'queen' ? HOT : YEL) : CHIPS[(i / 4 | 0) % 5]; g.fill();
      font(g, 44 + 8 * Math.min(1, h), 700); g.fillStyle = CREAM; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(m[0], x, y - 46);
      g.restore();
    });
    /* the clusters get names once they form */
    var ck = win(t, mean + .7, king - .1, .3);
    label(g, 'ANIMALS', 300, 930, ck, YEL, 30); label(g, 'FOOD', 770, 940, ck, MINT, 30); label(g, 'ROYALTY', 440, 1140, ck, LIL, 30); label(g, 'VEHICLES', 880, 1350, ck, SKY, 30);
    /* the sum: man → woman is a direction; start that direction at king and it lands on queen */
    var M = MAP[MAPI.man], Wn = MAP[MAPI.woman], K = MAP[MAPI.king], Q = MAP[MAPI.queen];
    var dk = eio(seg(t, woman, woman + .4)), mv = eio(seg(t, lands - .1, queen - .05));
    if (dk > 0) arrow(g, M.x + 24, M.y, M.x + 24 + (Wn.x - M.x - 50) * dk, Wn.y, 1, CREAM, 9);
    if (mv > 0) arrow(g, K.x + 26, K.y, K.x + 26 + (Wn.x - M.x - 54) * mv, K.y, 1, HOT, 11);
    var ring = seg(t, queen, queen + .6);
    if (ring > 0 && ring < 1) { g.save(); g.globalAlpha = 1 - ring; g.strokeStyle = HOT; g.lineWidth = 6; g.beginPath(); g.arc(Q.x, Q.y, 20 + 70 * eo(ring), 0, 6.283); g.stroke(); g.restore(); }
    /* the equation builds word by word along the top */
    var eq = [['king', king, YEL], ['−', man - .08, CREAM], ['man', man, YEL], ['+', woman - .08, CREAM], ['woman', woman, YEL], ['≈', queen - .1, CREAM], ['queen', queen, HOT]];
    font(g, 58, 800); var tot = 0, gap = 20; eq.forEach(function (e) { tot += g.measureText(e[0]).width + gap; });
    var x = 540 - (tot - gap) / 2;
    eq.forEach(function (e) {
      var w = textW(g, e[0], 58, 800), k = clamp(sp(t, e[1], 3, .65), 0, 1.1);
      if (t >= e[1]) chip(g, e[0], x + w / 2, 560 + (1 - Math.min(1, k)) * 30, { px: 58, fg: e[2], pad: 0, a: k * 2 * (1 - seg(t, SC[4].t1 - .3, SC[4].t1)) });
      x += w + gap;
    });
    label(g, 'A MAP OF MEANING', 540, 560, win(t, mean - .2, king - .2, .2), DIM, 30);
  }

  /* =====================================================================================================
     SCENE 6 · attention: what does "it" mean? it looks back at every word before
     ===================================================================================================== */
  var ATT = ['The', 'trophy', "didn't", 'fit', 'in', 'the', 'suitcase', 'because', 'it', 'was', 'too', 'big.'];
  var AW = [.03, .62, .02, .06, .01, .02, .18, .06];
  function attnScene(g, t) {
    var s0 = SC[5].t0, back = at('looks', 'back'), before = at('looks', 'before'), fig = at('trophy', 'figures'), tro = at('trophy', 'trophy');
    var L = layout(g, ATT, 140, 1060, 800, 74, 120, 800), IT = L[8];
    var sweep = seg(t, back - .1, before + .3), m = eio(seg(t, start('trophy') - .15, fig + .15)), fade = 1 - seg(t, SC[5].t1 - .3, SC[5].t1);
    /* the paragraph re-sorts into a list of the words before "it", so every link can be drawn cleanly */
    function pos(i) {
      var p = L[i];
      if (i < 8) return { x: lerp(p.x, 470 - p.wd, m), y: lerp(p.y, 740 + i * 92, m) };
      if (i === 8) return { x: lerp(p.x, 760, m), y: lerp(p.y, 1062, m) };
      return { x: p.x, y: p.y };
    }
    /* the links: from "it" back to every earlier word, as thick as the attention it pays */
    var ak = seg(t, fig - .05, fig + .55), P8 = pos(8);
    if (ak > 0) for (var i = 0; i < 8; i++) {
      var q = pos(i), k = eio(clamp(ak * 1.4 - (7 - i) * .05, 0, 1)), wgt = AW[i], hot = i === 1 && t > tro;
      var x0 = P8.x - 20, y0 = P8.y, x1 = 490, y1 = q.y;
      g.save(); g.globalAlpha = (.22 + .78 * wgt) * fade; g.strokeStyle = hot ? YEL : CREAM; g.lineWidth = 3 + 34 * wgt * (hot ? 1.15 : 1); g.lineCap = 'round';
      g.beginPath();
      for (var s = 0; s <= 30 * k; s++) { var u = s / 30, v = 1 - u, bx = v * v * v * x0 + 3 * v * v * u * (x0 - 140) + 3 * v * u * u * (x1 + 140) + u * u * u * x1, by = v * v * v * y0 + 3 * v * v * u * y0 + 3 * v * u * u * y1 + u * u * u * y1; s ? g.lineTo(bx, by) : g.moveTo(bx, by); }
      g.stroke(); g.restore();
      if (k > .95) { g.save(); g.globalAlpha = fade * clamp(win(t, fig + .4, SC[5].t1, .2), 0, 1); font(g, 28, 500, MONO); g.fillStyle = hot ? YEL : DIM; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText(Math.round(wgt * 100) + '%', 470 - L[i].wd - 22, y1 + 2); g.restore(); }
    }
    L.forEach(function (p, i) {
      var k = clamp(sp(t, s0 + .1 + i * .07, 3, .7), 0, 1.1), it = i === 8, after = i > 8, q = pos(i);
      var lit = i < 8 && sweep > 0 && sweep < 1 && m === 0 && Math.abs((1 - sweep) * 8 - i) < 1;
      var a = clamp(k * 2, 0, 1) * fade * (after ? 1 - m : 1);
      if (a <= 0) return;
      g.save(); g.globalAlpha = a;
      if (it) { rr(g, q.x - 14, q.y - 52, p.wd + 28, 104, 22); g.fillStyle = HOT; g.fill(); }
      if (i === 1 && t > tro) { var tk = clamp(sp(t, tro, 3, .6), 0, 1.1); g.save(); g.globalAlpha = a * clamp(tk, 0, 1); rr(g, q.x - 14, q.y - 46, p.wd + 28, 92, 20); g.fillStyle = YEL; g.fill(); g.restore(); }
      font(g, 74, 800); g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillStyle = it || (i === 1 && t > tro) ? BG : lit ? HOT : CREAM;
      g.translate(q.x, q.y + (1 - Math.min(1, k)) * 30); g.fillText(p.w, 0, 0); g.restore();
      if (lit) { g.fillStyle = HOT; g.fillRect(p.x, p.y + 44, p.wd, 6); }
    });
    label(g, 'ATTENTION', 540, 600, win(t, back, SC[5].t1 - .3, .2), HOT, 32);
    label(g, 'WHAT DOES "IT" MEAN?', 540, 650, win(t, s0 + .5, start('trophy') - .2, .2), DIM, 30);
  }

  /* =====================================================================================================
     SCENE 7 · manners: people rate its answers; then the names you know
     ===================================================================================================== */
  var RAMBLE = 'Well, capitals are a big topic, and historically speaking there were many rivers, kings, spoons, maps and also it depends on who you ask and when, and furthermore the weather in';
  function rateScene(g, t) {
    var s0 = SC[6].t0, rate = at('rate', 'rate'), help = at('rate', 'helpful'), huge = at('names', 'huge'), gpt = at('names', 'chatgpt'), cl = at('names', 'claude');
    var cards = eio(seg(t, rate - .3, rate + .2)), clear = eio(seg(t, HELP1, HELP1 + .35));
    /* the question */
    var qa = 1 - clear;
    bubble(g, 330, 540, 620, 100, PANEL2, qa, 1);
    chip(g, "What's the capital of France?", 640, 590, { px: 38, wt: 600, fg: CREAM, pad: 0, a: qa });
    /* answer A: the ramble, streaming without end */
    var ax = lerp(110, 110, cards), aw = lerp(860, 410, cards), ay = 690, ah = lerp(560, 520, cards);
    if (qa > 0) {
      g.save(); g.globalAlpha = qa * (t > rate + .4 ? lerp(1, .4, seg(t, rate + .4, rate + .7)) : 1);
      rr(g, ax, ay, aw, ah, 30); g.fillStyle = PANEL; g.fill(); g.clip();
      var n = Math.floor(clamp((t - s0 - .1) * 34, 0, RAMBLE.length)), txt = RAMBLE.slice(0, n), px = lerp(46, 36, cards);
      var L = layout(g, txt.split(' '), ax + 30, ay + 60, aw - 60, px, px * 1.35, 600), lastY = L.length ? L[L.length - 1].y : 0, scroll = Math.max(0, lastY - (ay + ah - 70));
      L.forEach(function (p) { font(g, px, 600); g.fillStyle = CREAM; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(p.w, p.x, p.y - scroll); });
      if (L.length) { var lp = L[L.length - 1]; caret(g, lp.x + lp.wd + 10, lp.y - scroll, px * 1.1, t, true); }
      g.restore();
      if (cards > 0) label(g, 'A', ax + aw / 2, ay + ah + 50, cards * qa, DIM, 44);
    }
    /* answer B: helpful */
    if (cards > 0 && qa > 0) {
      var bx = lerp(960, 560, cards);
      g.save(); g.globalAlpha = cards * qa; rr(g, bx, ay, 410, 520, 30); g.fillStyle = PANEL; g.fill();
      if (t > rate + .4) { g.strokeStyle = MINT; g.lineWidth = 8 * seg(t, rate + .4, rate + .55); g.stroke(); }
      font(g, 64, 800); g.fillStyle = CREAM; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('Paris.', bx + 40, ay + 90);
      g.restore();
      label(g, 'B', bx + 205, ay + 570, cards * qa, t > rate + .4 ? MINT : DIM, 44);
      /* a rater's tap on B */
      var tap = eio(seg(t, rate - .1, rate + .35)), press = win(t, rate + .35, rate + .5, .2);
      if (tap > 0 && tap <= 1) {
        var px2 = lerp(700, bx + 260, tap), py2 = lerp(1500, ay + 360, tap);
        g.save(); g.globalAlpha = qa * (1 - seg(t, help + .3, help + .6)); g.translate(px2, py2); g.scale(1 - .12 * press, 1 - .12 * press);
        g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 74); g.lineTo(20, 56); g.lineTo(34, 88); g.lineTo(48, 81); g.lineTo(34, 50); g.lineTo(60, 50); g.closePath();
        g.fillStyle = CREAM; g.fill(); g.strokeStyle = BG; g.lineWidth = 4; g.stroke(); g.restore();
      }
      var plus = seg(t, rate + .4, rate + 1.3);
      if (plus > 0 && plus < 1) chip(g, '+1', bx + 300, ay + 200 - 120 * eo(plus), { px: 56, bg: MINT, fg: BG, a: 1 - plus * plus });
      stamp(g, 'HELPFUL', bx + 205, ay + 300, t, help, HELP1 - .05, 58, MINT, -.1);
      /* and the dials move a little toward answers like B */
      for (var d = 0; d < 8; d++) dial(g, 190 + d * 100, 1340, 30, DIALS[d].a0 + seg(t, help, help + .5) * DIALS[d].d, qa * win(t, help - .1, HELP1 - .1, .2), seg(t, help, help + .5) > 0 && seg(t, help, help + .5) < 1);
    }
    /* the names you know: two chat windows */
    if (clear > 0) {
      [[gpt, 'ChatGPT', 780, -1], [cl, 'Claude', 1120, 1]].forEach(function (nw, i) {
        var k = clamp(sp(t, nw[0] - .15, 1.8, .78), 0, 1.06), x = lerp(nw[3] * 1100, 0, Math.min(1, k)) + 540;
        if (t < nw[0] - .15) return;
        g.save(); g.translate(x, nw[2]); rr(g, -400, -130, 800, 260, 34); g.fillStyle = PANEL; g.fill(); g.strokeStyle = FAINT; g.lineWidth = 3; g.stroke();
        for (var j = 0; j < 3; j++) { g.beginPath(); g.arc(-350 + j * 34, -92, 10, 0, 6.283); g.fillStyle = FAINT; g.fill(); }
        font(g, 104, 800); g.fillStyle = CREAM; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(nw[1], -340, 24);
        var cw = g.measureText(nw[1]).width; caret(g, -340 + cw + 26, 24, 100, t, false);
        g.restore();
      });
      label(g, 'CLAUDE ALSO LEARNS FROM A WRITTEN CONSTITUTION', 540, 1320, win(t, at('names', 'claude') + .3, SC[6].t1 - .25, .2), LIL, 30);
      label(g, 'MILLIONS OF RATINGS', 540, 620, win(t, HELP1 + .2, SC[6].t1 - .25, .2), MINT, 30);
    }
  }

  /* =====================================================================================================
     SCENE 8 · still guessing: confident, and wrong
     ===================================================================================================== */
  var FAKE = 'The first cat on the Moon was Sir Whiskers, in 1971.'.split(' ');
  function wrongScene(g, t) {
    var s0 = SC[7].t0, know = at('still', 'know'), sure = at('still', 'sure'), wr = at('still', 'wrong');
    bubble(g, 300, 540, 650, 104, PANEL2, clamp(sp(t, s0 + .05, 2.4, .8), 0, 1), 1);
    chip(g, 'Who was the first cat on the Moon?', 625, 592, { px: 34, wt: 600, fg: CREAM, pad: 0, a: clamp(sp(t, s0 + .05, 2.4, .8), 0, 1) });
    var t0 = at('still', 'guessing') - .1, t1 = sure - .3;
    var L = layout(g, FAKE, 150, 790, 780, 64, 90, 700), shown = 0;
    FAKE.forEach(function (w, i) { if (t >= lerp(t0, t1, i / (FAKE.length - 1))) shown = i + 1; });
    var lastY = L[Math.max(0, shown - 1)].y;
    bubble(g, 110, 720, 860, Math.max(150, lastY - 720 + 110), PANEL, clamp(sp(t, s0 + .1, 2.4, .8), 0, 1));
    for (var i = 0; i < shown; i++) { font(g, 64, 700); g.fillStyle = i >= 6 && i <= 10 ? YEL : CREAM; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(L[i].w, L[i].x, L[i].y); }
    var last = L[Math.max(0, shown - 1)];
    caret(g, shown ? last.x + last.wd + 14 : 150, last.y, 70, t, shown > 0 && shown < FAKE.length);
    if (t > wr + .1) { g.save(); g.strokeStyle = BAD; g.lineWidth = 7; for (i = 0; i < shown; i++) { var k = seg(t, wr + .1 + i * .02, wr + .3 + i * .02); if (k > 0) { g.beginPath(); g.moveTo(L[i].x, L[i].y + 4); g.lineTo(L[i].x + L[i].wd * k, L[i].y + 4); g.stroke(); } } g.restore(); }
    /* the confidence meter */
    var ma = win(t, know, SC[7].t1 - .25, .2), mk2 = ss(seg(t, know, sure + .2)), conf = 94 * mk2;
    if (ma > 0) {
      g.save(); g.globalAlpha = clamp(ma, 0, 1);
      label(g, 'HOW SURE IT SOUNDS', 540, 1170, 1, DIM, 30);
      rr(g, 150, 1210, 780, 44, 22); g.fillStyle = 'rgba(244,237,224,.08)'; g.fill();
      rr(g, 150, 1210, 780 * conf / 100, 44, 22); g.fillStyle = t > wr ? BAD : MINT; g.fill();
      chip(g, Math.round(conf) + '%', 540, 1320, { px: 70, fam: MONO, wt: 500, pad: 0, fg: t > wr ? BAD : CREAM });
      g.restore();
    }
  }

  /* =====================================================================================================
     SCENE 9 · the end: everything collapses back into the caret, and the caret becomes frame 0
     ===================================================================================================== */
  var DEBRIS = [['Un', YEL], ['mat', HOT], ['queen', HOT], ['trophy', YEL], ['ChatGPT', CREAM], ['Claude', CREAM], ['15,000,000,000,000', YEL], ['41%', MINT], ['Paris.', MINT], ['able', LIL], ['the', SKY], ['blue', MINT], ['it', HOT], ['king', YEL]];
  function endScene(g, t) {
    var s0 = SC[8].t0, magic = at('end', 'magic'), best = at('end', 'best'), built = at('end', 'built');
    var suck = eio(seg(t, s0 + .2, best - .1));
    DEBRIS.forEach(function (d, i) {
      var a = i / DEBRIS.length * 6.283 + hash(i * 3) * .3, r0 = 330 + hash(i * 7) * 90, x0 = 540 + Math.cos(a) * r0, y0 = 960 + Math.sin(a) * r0 * 1.2;
      var k = clamp((suck - hash(i) * .3) / .7, 0, 1), sw = (1 - k) * (1 - k);
      var x = lerp(540, x0, sw) + Math.cos(a + t) * 30 * sw, y = lerp(920, y0, sw);
      chip(g, d[0], x, y, { px: 46, bg: d[1], fg: BG, s: lerp(.15, 1, sw), a: clamp(sp(t, s0 + i * .02, 3, .7), 0, 1) * (k < 1 ? 1 : 0), rot: (hash(i * 11) - .5) * .5 * sw });
    });
    var big = 1 + .5 * win(t, magic, best - .1, .2);
    caret(g, 540, 920, 200 * big, t, false);
    /* the line, written as the machine would: one guess at a time */
    var ws = ['the', 'best', 'next-word', 'guesser'], wa = 1 - seg(t, HOME - .3, HOME);
    var px = 72, tot = 0; ws.forEach(function (w) { tot += textW(g, w, px, 800) + 22; });
    if (t >= best - .1) {
      var x = 540 - tot / 2, shownW = 0;
      ws.forEach(function (w, i) {
        var tw = i === 0 ? best - .15 : at('end', w);
        var k = clamp(sp(t, tw, 3, .7), 0, 1.1), wd = textW(g, w, px, 800);
        if (t >= tw) { chip(g, w, x + wd / 2, 1150 + (1 - Math.min(1, k)) * 30, { px: px, pad: 0, fg: i === 3 ? HOT : CREAM, a: k * 2 * wa }); shownW = i; }
        x += wd + 22;
      });
      odds(g, [['ever', 58], ['in', 14], ['on', 9]], 300, 1270, 560, seg(t, at('end', 'guesser') + .1, built), t > at('end', 'built') - .1 ? 1 : 0, wa * win(t, at('end', 'guesser') + .1, HOME - .35, .2), 62, 40);
    }
  }

  /* ---------- captions: the narrator's words, highlighted as spoken ---------- */
  function captions(g, t) {
    var card = null;
    VO.captions.forEach(function (c) { if (t >= c.t0 - .04 && t < c.t1 + .15) card = c; });
    if (!card) return;
    var k = clamp(spring(t - card.t0 + .04, 3.2, .7), 0, 1.1), out = 1 - seg(t, card.t1, card.t1 + .15);
    g.save(); g.font = '800 80px Archivo'; try { g.fontStretch = 'expanded'; } catch (e) {}
    g.textBaseline = 'alphabetic';
    var words = card.words, ws = words.map(function (w) { return g.measureText(w.w).width; }), gap = 24;
    var lines = [[]], lw = [0], maxw = 900;
    words.forEach(function (w, i) { var L = lines.length - 1; if (lw[L] + ws[i] > maxw && lines[L].length) { lines.push([]); lw.push(0); L++; } lines[L].push(i); lw[L] += ws[i] + gap; });
    var y0 = 360 - (lines.length - 1) * 48;
    g.globalAlpha = out;
    lines.forEach(function (ln, li) {
      var x = W / 2 - (lw[li] - gap) / 2, y = y0 + li * 96 + (1 - Math.min(1, k)) * 40;
      ln.forEach(function (i) {
        var w = words[i], cur = t >= w.t0 - .03 && t < w.t1 + .05, said = t >= w.t0 - .03;
        if (cur) { g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 12, y - 70, ws[i] + 24, 92, 18); g.fill(); }
        g.fillStyle = cur ? BG : said ? CREAM : 'rgba(244,237,224,.3)';
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SCENES = [hookScene, tokenScene, gameScene, trainScene, meaningScene, attnScene, rateScene, wrongScene, endScene];
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(60,48,80,.32)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    drift(g, t, 1);
    var si = sceneAt(t), S = SC[si];
    /* transitions are made of text editing: the old scene is selected (a highlight sweeps over it) and deleted */
    var sel = si + 1 < SC.length ? seg(t, S.t1 - .3, S.t1 - .02) : 0;
    var inK = si > 0 ? eo(seg(t, S.t0, S.t0 + .35)) : 1;
    g.save();
    /* a gentle camera: each scene drifts in a little, so nothing sits dead still */
    var push = 1 + .03 * seg(t, S.t0, S.t1), cy = 1000;
    g.translate(540, cy); g.scale(push * lerp(.94, 1, inK), push * lerp(.94, 1, inK)); g.translate(-540, -cy);
    if (si === 0 && t < .001) hookScene(g, 0, false); else SCENES[si](g, t);
    g.restore();
    if (sel > 0) {
      var x1 = lerp(0, 1080, eio(sel));
      g.save(); g.beginPath(); g.rect(0, 470, x1, 1060); g.clip(); stage(g); drift(g, t, 1); g.restore();
      g.fillStyle = HOT; g.fillRect(x1 - 5, 470, 10, 1060);
    }
    /* the loop: the end card dissolves back into frame 0 */
    var back = eio(seg(t, HOME, HOME + .45));
    if (back > 0) { g.save(); g.globalAlpha = back; stage(g); drift(g, 0, 1); hookScene(g, 0, false); g.restore(); }
    STAMPS.forEach(function (s) { if (s[3]) stamp(g, s[0], 540, 1480, t, s[1], s[2], s[3], s[4], s[5]); });
    if (LIVE.text) captions(g, t);

    /* a thin progress line along the top (the loop restarts it) */
    g.fillStyle = 'rgba(244,237,224,.12)'; g.fillRect(60, 140, W - 120, 6);
    g.fillStyle = HOT; g.fillRect(60, 140, (W - 120) * t / DUR, 6);
    if (LIVE.grain && NOISE) { g.globalAlpha = .05; g.globalCompositeOperation = 'overlay'; var o = Math.floor(t * 24) * 37 % 256; g.fillStyle = g.createPattern(NOISE, 'repeat'); g.translate(-o, -o); g.fillRect(o, o, W, H); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
  }

  /* ---------- text dwell: on-screen stamps only (captions follow the voice, by design) ---------- */
  function TEXTS(t) {
    var out = [];
    STAMPS.forEach(function (s, i) { if (t >= s[1] + .2 && t < s[2]) out.push({ id: 'stamp' + i, text: s[0], x0: 0, y0: 0, x1: 0, y1: 0 }); });
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [];
  function initTimes() {
    PT = pickTimes();
    REPLY.forEach(function (r, i) { EV.push({ t: typeTime(i), type: 'key', f: hash(i) }); });
    EV.push({ t: at('hook', 'guess'), type: 'blips', n: 8 }, { t: at('smart', 'smart') + .12, type: 'thump' });
    TOK.forEach(function (row, ri) { row.t.forEach(function (s, i) { if (i) EV.push({ t: at('tokens', 'tokens') + ri * .1 + (i - 1) * .06, type: 'slice' }); }); });
    TOK.forEach(function (row, ri) { row.t.forEach(function (s, i) { EV.push({ t: at('numbers', 'number') + i * .07 + ri * .05 + .14, type: 'blip', f: 700 + (ri * 3 + i) * 90 }); }); });
    EV.push({ t: at('game', 'next'), type: 'thump' });
    PT.forEach(function (p, i) { EV.push({ t: p.show, type: 'blips', n: 4, f: 900 + i * 60 }, { t: p.fly - .22, type: 'swish' }, { t: p.fly, type: 'key', f: .5 }); });
    EV.push({ t: at('cat', 'moon'), type: 'boop' }, { t: at('again', 'trick'), type: 'stamp' });
    PAGES.forEach(function (p, i) { if (i % 2 === 0) EV.push({ t: lerp(at('where', 'reading') - .5, at('hide', 'hide') - .4, p.u) + .7, type: 'paper' }); });
    EV.push({ t: at('hide', 'trillions'), type: 'whirr', t1: at('hide', 'trillions') + 1.1 }, { t: at('hide', 'guess'), type: 'swish' }, { t: at('hide', 'check'), type: 'flip' });
    EV.push({ t: at('dials', 'wrong'), type: 'buzz' });
    DIALS.forEach(function (d, i) { if (i % 3 === 0) EV.push({ t: at('dials', 'nudge') + (d.x + d.y) * .025, type: 'tick' }); });
    EV.push({ t: at('dials', 'again'), type: 'swish' }, { t: at('dials', 'again') + .35, type: 'ding' });
    MAP.forEach(function (m, i) { if (i % 2 === 0) EV.push({ t: at('weird', 'mean') - .1 + i * .03 + .15, type: 'blip', f: 500 + i * 40 }); });
    EV.push({ t: at('queen', 'king'), type: 'boop' }, { t: at('queen', 'man'), type: 'boop' }, { t: at('queen', 'woman'), type: 'swish' }, { t: at('queen', 'queen'), type: 'ding' });
    ATT.forEach(function (w, i) { EV.push({ t: SC[5].t0 + .1 + i * .07, type: 'key', f: hash(i + 40), g: .5 }); });
    for (var i = 0; i < 8; i++) EV.push({ t: at('trophy', 'figures') - .1 + (7 - i) * .05, type: 'blip', f: 600 + i * 70 });
    EV.push({ t: at('trophy', 'trophy') + .15, type: 'stamp' });
    EV.push({ t: at('rate', 'rate') + .38, type: 'click' }, { t: at('rate', 'helpful'), type: 'stamp' }, { t: at('names', 'chatgpt') - .15, type: 'swish' }, { t: at('names', 'claude') - .15, type: 'swish' });
    FAKE.forEach(function (w, i) { EV.push({ t: lerp(at('still', 'guessing') - .1, at('still', 'sure') - .3, i / (FAKE.length - 1)), type: 'key', f: hash(i + 70), g: .6 }); });
    EV.push({ t: at('still', 'wrong'), type: 'stamp', big: true });
    EV.push({ t: SC[8].t0 + .2, type: 'suck', t1: at('end', 'best') - .1 }, { t: at('end', 'best') - .15, type: 'key', f: .3 });
    ['best', 'next-word', 'guesser'].forEach(function (w) { EV.push({ t: at('end', w), type: 'key', f: .6 }); });
    EV.push({ t: at('end', 'built') - .1, type: 'ding' });
    SC.forEach(function (s, i) { if (i) EV.push({ t: s.t0 - .3, type: 'select' }); });
    EV.sort(function (a, b) { return a.t - b.t; });
  }

  function render(t, samples, shutter, fps) {
    t = clamp(t, 0, DUR); samples = samples || 1;
    if (samples === 1) { frame(ctx, t); return; }
    var span = (shutter || .5) / (fps || 30);
    for (var k = 0; k < samples; k++) {
      frame(tctx, clamp(t - span / 2 + span * (k + .5) / samples, 0, DUR));
      actx.globalAlpha = k === 0 ? 1 : 1 / (k + 1); actx.drawImage(tmp, 0, 0);
    }
    ctx.globalAlpha = 1; ctx.drawImage(acc, 0, 0);
  }

  /* ---------- score: a bouncy little synth groove that steps aside for the voice and the two silences ---------- */
  function SCORE(ac) {
    var sr = ac.sampleRate, rnd = mulberry(7);
    var master = ac.createGain(); master.gain.value = .9;
    var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 38;
    var comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .15;
    master.connect(hp); hp.connect(comp); comp.connect(ac.destination);
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.3), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .18; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], pts[0][0]); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], pts[k][0]); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(t0); o.stop(t1); return o; }

    /* foley */
    function key(t, f, g) { var o = bus(1, .05, (f - .5) * .6), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400 + f * 1800; bp.Q.value = 3; var n = noise(t, .04); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, (g || 1) * .3], [t + .03, 0]]); osc('sine', 180 + f * 60, t, t + .05, 1, [[t, 0], [t + .002, (g || 1) * .12], [t + .04, 0]]); }
    function tick(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .22], [t + .025, 0]]); }
    function blip(t, f, g) { var o = osc('sine', f, t, t + .12, 1, [[t, 0], [t + .004, g || .09], [t + .1, 0]], .3, (f - 1100) / 1400); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + .07); }
    function boop(t) { var o = osc('triangle', 520, t, t + .25, 1, [[t, 0], [t + .01, .14], [t + .22, 0]], .3); o.frequency.exponentialRampToValueAtTime(260, t + .2); }
    function ding(t) { [76, 83, 88].forEach(function (m, j) { osc('sine', mtof(m), t + j * .04, t + 1.2, 1, [[t + j * .04, 0], [t + j * .04 + .005, .09], [t + 1.1, 0]], .5, (j - 1) * .4); }); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, 1, [[t, 0], [t + .004, g || .4], [t + .26, 0]], .1); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t - .12, t + .14, 900, 5200, .14, .02, 1.6); }
    function slice(t) { band(t - .1, t + .02, 3000, 9000, .1, .2, 2.5); tick(t + .02, .3); }
    function stampS(t, big) { thump(t, big ? .7 : .5); var n = noise(t, .2), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1800; var o = bus(1, .25); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .5 : .35], [t + .15, 0]]); }
    function buzz(t) { osc('square', 110, t, t + .35, 1, [[t, 0], [t + .01, .05], [t + .3, .05], [t + .34, 0]], .05); osc('square', 116, t, t + .35, 1, [[t, 0], [t + .01, .04], [t + .3, .04], [t + .34, 0]], .05); }
    function paper(t) { band(t - .03, t + .07, 1800, 3800, .05, .02, 1.2, (rnd() - .5) * .8); }
    function flip(t) { band(t, t + .16, 2000, 5000, .1, .02, 2); tick(t + .15, .25); }
    function click(t) { tick(t, .5); thump(t, .15); }
    EV.forEach(function (e) {
      if (e.type === 'key') key(e.t, e.f || .5, e.g);
      else if (e.type === 'tick') tick(e.t, e.g);
      else if (e.type === 'blip') blip(e.t, e.f);
      else if (e.type === 'blips') for (var j = 0; j < e.n; j++) blip(e.t + j * .045, (e.f || 800) + j * 120, .06);
      else if (e.type === 'boop') boop(e.t);
      else if (e.type === 'ding') ding(e.t);
      else if (e.type === 'thump') thump(e.t);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'slice') slice(e.t);
      else if (e.type === 'stamp') stampS(e.t, e.big);
      else if (e.type === 'buzz') buzz(e.t);
      else if (e.type === 'paper') paper(e.t);
      else if (e.type === 'flip') flip(e.t);
      else if (e.type === 'click') click(e.t);
      else if (e.type === 'whirr') band(e.t, e.t1, 400, 2600, .08, .12, 4);
      else if (e.type === 'suck') band(e.t, e.t1, 5000, 300, .1, .14, 1.4);
      else if (e.type === 'select') band(e.t, e.t + .28, 1200, 3000, .05, .07, 2);
    });

    /* music: 112 BPM in G, plucky FM keys, a round bass, a light hat. Two real silences: before "the weird part"
       and before "still guessing" — the first sound after each is the voice */
    var BEAT = 60 / 112, M0 = .05;
    var gaps = [[start('weird') - .55, start('weird') + .5], [start('still') - .55, start('still') + .45]];
    function inGap(t) { for (var k = 0; k < gaps.length; k++) if (t > gaps[k][0] && t < gaps[k][1]) return true; return false; }
    function keyz(t, m, g, pan) {
      var c = ac.createOscillator(), mo = ac.createOscillator(), mg = ac.createGain(), og = ac.createGain();
      c.type = 'sine'; c.frequency.value = mtof(m); mo.frequency.value = mtof(m) * 2; mg.gain.value = 0; mo.connect(mg); mg.connect(c.frequency);
      env(mg.gain, [[t, mtof(m) * 1.4], [t + .12, mtof(m) * .1]]);
      c.connect(og); og.connect(bus(1, .25, pan)); env(og.gain, [[t, 0], [t + .004, g], [t + .32, 0]]); c.start(t); mo.start(t); c.stop(t + .36); mo.stop(t + .36);
    }
    function bass(t, m, dur, g) { var o = ac.createOscillator(), f = ac.createBiquadFilter(), og = ac.createGain(); o.type = 'triangle'; o.frequency.value = mtof(m); f.type = 'lowpass'; f.frequency.value = 520; o.connect(f); f.connect(og); og.connect(bus(1, 0)); env(og.gain, [[t, 0], [t + .01, g], [t + dur * .7, g * .5], [t + dur, 0]]); o.start(t); o.stop(t + dur + .02); }
    function hat(t, g) { var o = bus(1, 0, .25), hp2 = ac.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 8000; var n = noise(t, .05); n.connect(hp2); hp2.connect(o); env(o.gain, [[t, 0], [t + .005, g], [t + .04, 0]]); }
    function kick(t, g) { var o = osc('sine', 120, t, t + .25, 1, [[t, 0], [t + .004, g], [t + .2, 0]], 0); o.frequency.exponentialRampToValueAtTime(45, t + .12); }
    var CH = [[67, 71, 74, 78], [64, 67, 71, 74], [60, 64, 67, 71], [62, 66, 69, 72]];   // Gmaj7, Em7, Cmaj7, D7
    var RT = [43, 40, 36, 38];
    var lift = function (t) { return t > start('end') ? 1.15 : t > start('weird') ? 1.08 : 1; };
    for (var bt = M0, n = 0; bt < HOME + .2; bt += BEAT / 2, n++) {
      if (inGap(bt)) continue;
      var bar = Math.floor(n / 8), chd = CH[bar % 4], L = lift(bt);
      if (n % 2 === 0) keyz(bt, chd[(n / 2 + bar) % 4] + 12, .05 * L, (n % 4 ? .35 : -.35));
      else if (n % 8 === 3 || n % 8 === 7) keyz(bt, chd[(n + 1) % 4] + 12, .035 * L, -.2);
      if (n % 8 === 0) bass(bt, RT[bar % 4], BEAT * 1.6, .14 * L);
      if (n % 8 === 3) bass(bt, RT[bar % 4] + 12, BEAT * .4, .08 * L);
      if (n % 8 === 4) bass(bt, RT[bar % 4] + 7, BEAT * 1.2, .1 * L);
      if (n % 4 === 0 && bt > start('smart')) kick(bt, .16 * L);
      hat(bt, (n % 2 ? .05 : .03) * (bt > start('tokens') ? 1 : .5));
    }
    /* the button: a chord on the last word, then one key that becomes the loop */
    [67, 71, 74, 79].forEach(function (m, j) { keyz(end('end') + .05 + j * .03, m + 12, .07, j % 2 ? .3 : -.3); });
    key(DUR - .35, .5, .8);
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['800 84px Archivo', '700 46px Archivo', '900 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈✓✗¾'); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  initTimes();
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: at('queen', 'queen') + .7, SLUG: 'next-word', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
