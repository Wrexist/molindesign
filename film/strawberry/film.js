/* "Strawberry" — why AI couldn't count the r's. Part 2 of the AI-explained series after ../nextword/. A vertical
   explainer written in code, narrated first and cut to the voice: every visual beat is keyed to a word time from
   vo/vo.js (window.VO, written by tools/voiceover.py) with at(id, word). Pure function of t. Contract: window.FILM,
   DUR, render(t), READY, EV, TEXTS(t), SCORE(ctx). The native move is the sealed chip: the word as one token
   (101830) that nothing can open, until "spell it out" cracks it into ten letter chips. All IDs: o200k_base. */
(function () {
  'use strict';
  var W = 1080, H = 1920, VO = window.VO, DUR = VO.dur;
  var BG = '#15131b', PANEL = '#221f2b', PANEL2 = '#2c2838', CREAM = '#f4ede0', DIM = 'rgba(244,237,224,.42)', FAINT = 'rgba(244,237,224,.14)';
  var HOT = '#ff5b3d', YEL = '#ffc83d', MINT = '#3fd6a2', LIL = '#a48cff', SKY = '#53b6ff', BAD = '#ff4a5e';
  var CHIPS = [YEL, MINT, LIL, SKY, HOT];
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
  function sp(t, a, f, z) { return spring(t - a, f || 2.4, z || .78); }
  function pop(t, a, f, z) { return clamp(sp(t, a, f || 3, z || .72), 0, 1.1); }
  function win(t, a, b, o) { return t < a || t > b + (o || .3) ? 0 : clamp(sp(t, a), 0, 1.1) * (1 - eio(seg(t, b, b + (o || .3)))); }
  /* a decaying wobble that starts at a (rattles, bounces): pure function of t */
  function knock(t, a, f, d) { if (t < a) return 0; var u = t - a; return Math.exp(-u * (d || 7)) * Math.sin(u * (f || 22)); }

  /* ---------- the voice is the timeline ---------- */
  var LINE = {}; VO.lines.forEach(function (l) { LINE[l.id] = l; });
  function norm(w) { return w.toLowerCase().replace(/[^a-z0-9%]/g, ''); }
  function at(id, word, nth) {
    var l = LINE[id], n = nth || 0; if (typeof word === 'number') return l.words[word].t0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t0;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function wend(id, word, nth) {
    var l = LINE[id], n = nth || 0;
    for (var i = 0; i < l.words.length; i++) if (norm(l.words[i].w) === norm(word) && n-- === 0) return l.words[i].t1;
    throw new Error('no word "' + word + '" in line ' + id);
  }
  function end(id) { return LINE[id].t1; }
  function start(id) { return LINE[id].t0; }

  var SC = [
    { id: 'hook', name: 'Two r\'s', t0: 0 },
    { id: 'tokens', name: 'One token', t0: start('tokens') - .3 },
    { id: 'sealed', name: 'Sealed', t0: start('nothing') - .35, join: true },
    { id: 'head', name: 'In its head', t0: start('head') - .3 },
    { id: 'berry', name: 'Straw + berry', t0: start('berry') - .3 },
    { id: 'fix', name: 'The fix', t0: start('watch') - .35 },
    { id: 'think', name: 'Spell, then count', t0: start('think') - .3 },
    { id: 'name', name: 'Strawberry', t0: start('codename') - .3 },
    { id: 'blue', name: 'Blueberry', t0: start('blue') - .3 },
    { id: 'end', name: 'Sealed again', t0: start('end') - .35 }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  var HOME = end('end') + .25;

  /* the facts on screen (BRIEF.md): o200k_base IDs, tiktoken 0.14.0 */
  var WORD = 'strawberry', LET = WORD.split(''), LID = ['82', '260', '428', '261', '286', '287', '319', '428', '428', '342'];
  var Q = [['How', '5299'], ['many', '1991'], ['r', '428'], ["'s", '885'], ['are', '553'], ['in', '306'], ['strawberry', '101830'], ['?', '30']];

  /* stamps sit mid-low (y ~1280-1350, x/y per stamp) and outlive their scene */
  var STAMPS = [];

  /* ---------- canvas ---------- */
  var cv, ctx, tmp, tctx, acc, actx, LIVE = { grain: true, text: true };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  /* ---------- primitives ---------- */
  function font(g, px, wt, fam) { g.font = (wt || 800) + ' ' + px + 'px ' + (fam || DISP); }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function chip(g, text, x, y, o) {
    o = o || {}; var px = o.px || 64, a = o.a == null ? 1 : o.a, s = o.s == null ? 1 : o.s;
    if (a <= 0 || s <= 0) return 0;
    font(g, px, o.wt, o.fam);
    var tw = g.measureText(text).width, pad = o.pad == null ? px * .32 : o.pad, w = o.w || tw + pad * 2, h = o.h || px * 1.28;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s * (o.sx == null ? 1 : o.sx), s);
    if (o.bg) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.fillStyle = o.bg; g.fill(); }
    if (o.line) { rr(g, -w / 2, -h / 2, w, h, o.r == null ? h * .26 : o.r); g.strokeStyle = o.line; g.lineWidth = o.lw || 3; g.stroke(); }
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
  function stamp(g, text, x, y, t, t0, t1, px, col, rot) {
    if (t < t0 || t > t1 + .3) return;
    var k = sp(t, t0, 3, .55), out = 1 - seg(t, t1, t1 + .3), s = lerp(1.8, 1, clamp(k, 0, 1.2));
    g.save(); g.globalAlpha = clamp(k * 3, 0, 1) * out; g.translate(x, y); g.rotate(rot == null ? -.12 : rot); g.scale(s, s);
    font(g, px, 900); var w = g.measureText(text).width + px * .7, h = px * 1.25;
    rr(g, -w / 2, -h / 2, w, h, px * .18); g.fillStyle = 'rgba(21,19,27,.86)'; g.fill(); g.strokeStyle = col; g.lineWidth = px * .09; g.stroke();
    g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, px * .05); g.restore();
  }
  function bubble(g, x, y, w, h, col, a, tail) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); rr(g, x, y, w, h, 34); g.fillStyle = col; g.fill();
    if (tail) { g.beginPath(); var tx = tail < 0 ? x + 40 : x + w - 40; g.moveTo(tx - 18, y + h - 4); g.lineTo(tx + tail * 22, y + h + 26); g.lineTo(tx + 18, y + h - 4); g.fill(); }
    g.restore();
  }
  function caret(g, x, y, h, t, busy, col, a) {
    var on = busy ? 1 : (Math.cos(t * Math.PI * 2 * 1.05) > -.2 ? 1 : .15);
    g.save(); g.globalAlpha *= (a == null ? 1 : a) * on; g.fillStyle = col || HOT; rr(g, x - h * .045, y - h / 2, h * .09, h, h * .045); g.fill(); g.restore();
  }
  function dots(g, x, y, t, a) {
    for (var i = 0; i < 3; i++) { var b = .5 + .5 * Math.sin(t * 7 - i * .9); g.save(); g.globalAlpha *= a * (.35 + .65 * b); g.beginPath(); g.arc(x + i * 30, y - 6 * b, 10, 0, 6.283); g.fillStyle = CREAM; g.fill(); g.restore(); }
  }
  function tick(g, x, y, s, col, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.strokeStyle = col || MINT; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-20, 0); g.lineTo(-6, 15); g.lineTo(22, -16); g.stroke(); g.restore();
  }
  function cross(g, x, y, s, col, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); g.scale(s, s); g.strokeStyle = col || BAD; g.lineWidth = 9; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-16, -16); g.lineTo(16, 16); g.moveTo(16, -16); g.lineTo(-16, 16); g.stroke(); g.restore();
  }
  /* per-letter layout of a word: [{c, x (centre, relative to the word centre), w}] */
  function letters(g, word, px, trackPx, wt, fam) {
    font(g, px, wt || 800, fam); var out = [], x = 0, tr = trackPx || 0;
    for (var i = 0; i < word.length; i++) { var w = g.measureText(word[i]).width; out.push({ c: word[i], x: x + w / 2, w: w }); x += w + tr; }
    var tot = x - tr; out.forEach(function (o) { o.x -= tot / 2; }); out.total = tot;
    return out;
  }

  /* ---------- the native move: the sealed chip ----------
     the word inside one token chip; `ghost` 0 = clear letters, 1 = letters blurred behind frosted glass with the ID on top */
  var CHIPPX = 118;
  function chipSize(g, word, px) { var L = letters(g, word, px || CHIPPX, 2); return { w: L.total + (px || CHIPPX) * 1.05, h: (px || CHIPPX) * 1.86, L: L }; }
  function sealed(g, t, x, y, s, o) {
    o = o || {}; if (s <= 0) return;
    var word = o.word || WORD, px = o.px || CHIPPX, id = o.id || '101830', gh = o.ghost == null ? 1 : o.ghost, ida = o.ida == null ? gh : o.ida;
    var Z = chipSize(g, word, px), w = Z.w, h = Z.h, L = Z.L, r = h * .3, a = o.a == null ? 1 : o.a, clearA = o.clearA == null ? 1 - gh : o.clearA;
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s * (o.sx == null ? 1 : o.sx), s);
    if (o.clip) o.clip(g, w, h);
    rr(g, -w / 2 + 8, -h / 2 + 20, w, h, r); g.fillStyle = 'rgba(0,0,0,.32)'; g.fill();
    var body = g.createLinearGradient(0, -h / 2, 0, h / 2); body.addColorStop(0, o.top || '#37324b'); body.addColorStop(1, o.bot || '#242030');
    rr(g, -w / 2, -h / 2, w, h, r); g.fillStyle = body; g.fill();
    g.save(); rr(g, -w / 2, -h / 2, w, h, r); g.clip();
    if (!o.noWord) {
      font(g, px, 800); g.textAlign = 'center'; g.textBaseline = 'middle';
      L.forEach(function (c, i) {
        var hot = o.hotR && c.c === (o.hotC || 'r');
        if (clearA > 0) { g.save(); g.globalAlpha *= clearA; g.fillStyle = CREAM; g.fillText(c.c, c.x, px * .04); g.restore(); }
        if (gh > 0) { g.save(); g.filter = 'blur(' + (3 + 10 * gh).toFixed(1) + 'px)'; g.globalAlpha *= (hot ? .15 : .12) * gh; g.fillStyle = hot ? HOT : CREAM; g.fillText(c.c, c.x + Math.sin(t * 1.3 + i) * 3 * gh, px * .04); g.restore(); }
      });
    }
    if (gh > 0) {
      /* frosted glass: a fine vertical reeding and a slow sheen */
      g.save(); g.globalAlpha *= .5 * gh;
      for (var k = -w / 2; k < w / 2; k += 14) { g.fillStyle = 'rgba(255,255,255,.035)'; g.fillRect(k, -h / 2, 6, h); }
      var sx = ((t * 260 + (o.seed || 0) * 300) % (w + 700)) - w / 2 - 350, gr = g.createLinearGradient(sx - 160, 0, sx + 160, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h); g.restore();
    }
    g.restore();
    rr(g, -w / 2, -h / 2, w, h, r); g.lineWidth = 5; g.strokeStyle = o.line || 'rgba(244,237,224,.6)'; g.stroke();
    if (ida > 0) {
      g.save(); g.globalAlpha *= clamp(ida, 0, 1); font(g, o.idPx || 104, 500, MONO); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = o.idCol || CREAM;
      try { g.letterSpacing = '6px'; } catch (e) {}
      g.fillText(id, 0, 6); g.restore();
    }
    if (o.tag) { label(g, o.tag, -w / 2 + 26, -h / 2 - 34, o.tagA == null ? 1 : o.tagA, o.tagCol || DIM, 30, 'left'); }
    g.restore();
  }

  /* ---------- background: faint drifting tokens and IDs ---------- */
  var DRIFT = (function () {
    var r = mulberry(5), words = ['101830', 's', '428', 'r', '5299', 'aw', 'y', '?', '30', 'e', '885', 'b', 'str', 'berry', '1991', 'w', 't', '306'], out = [];
    for (var i = 0; i < 26; i++) out.push({ w: words[i % words.length], x: r() * W, y: r() * H, v: 14 + r() * 26, px: 30 + r() * 36, c: CHIPS[i % 5] });
    return out;
  })();
  function drift(g, t, a) {
    if (a <= 0) return;
    g.save();
    DRIFT.forEach(function (d) {
      var y = ((d.y - t * d.v) % (H + 200) + H + 200) % (H + 200) - 100;
      var band = y > 190 && y < 510 ? 1 - seg(t, 1.6, 2.4) : 0;   // keep the hook headline band clean (t < 0 is the loop layer)
      if (band >= 1) return;
      g.globalAlpha = .05 * a * (1 - band); chip(g, d.w, d.x, y, { px: d.px, line: d.c, fg: d.c, wt: 700, lw: 2, fam: /\d/.test(d.w) ? MONO : DISP });
    });
    g.restore();
  }

  /* =====================================================================================================
     SCENE 1 · hook: you can see three r's; ChatGPT says two, and twice
     ===================================================================================================== */
  var BIG = 138, BIGY = 800;
  function hookScene(g, t, idle) {
    var ti = idle == null ? t : idle, home = idle != null;
    var many = home ? 99 : at('hook', 'many'), straw = home ? 99 : at('hook', 'strawberry'), used = home ? 99 : at('hook', 'used'), two = home ? 99 : at('hook', 'two');
    var asked = home ? 99 : at('sure', 'asked'), sure = home ? 99 : at('sure', 'sure'), two2 = home ? 99 : at('sure', 'two');
    var why = home ? 99 : start('why'), smart = home ? 99 : at('why', 'smart'), miss = home ? 99 : at('why', 'miss'), letter = home ? 99 : at('why', 'letter');
    /* the chat leaves and the camera pushes into the word on "why" */
    var leave = eio(seg(t, why - .15, why + .45)), push = eio(seg(t, why, smart + .2)), pushIn = eio(seg(t, smart, letter + .3));
    var wy = lerp(BIGY, 980, push), wsz = lerp(1, 1.08, push) * lerp(1, 1.04, pushIn);
    /* the word, with the viewer's count: r 1, 2, 3 (rings are there from frame 0) */
    var L = letters(g, WORD, BIG, 10), cx = 520;
    g.save(); g.translate(cx, wy); g.scale(wsz, wsz);
    L.forEach(function (c, i) {
      var isR = c.c === 'r', ri = i === 2 ? 0 : i === 7 ? 1 : 2, pt = straw + .05 + ri * .2;
      var bob = isR ? knock(t, pt, 20, 6) * 22 : 0, out = i === 7 ? eio(seg(t, letter - .05, letter + .35)) : 0;
      var lx = c.x + out * 0, ly = -out * 170 + bob;
      var dimL = 1 - .55 * seg(t, miss - .1, miss + .3) * (i === 7 ? 0 : 1);
      font(g, BIG, 800); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.save(); g.globalAlpha *= dimL; g.fillStyle = isR ? HOT : CREAM; g.translate(lx, ly); g.rotate(out * .25); g.fillText(c.c, 0, BIG * .04); g.restore();
      if (isR) {
        var ringA = (1 - seg(t, miss - .1, miss + .25)) * (1 - out), br = 1 + .06 * Math.sin(ti * 3.2 + ri * 1.7) + .25 * Math.max(0, knock(t, pt, 18, 7));
        if (ringA > 0) {
          g.save(); g.globalAlpha *= ringA; g.fillStyle = HOT; rr(g, lx - c.w * .5 * br, ly + 66, c.w * br, 11, 5); g.fill(); g.restore();
          chip(g, String(ri + 1), lx, ly - 122, { px: 46, bg: HOT, fg: BG, wt: 900, pad: 16, a: ringA, s: 1 + .45 * Math.max(0, knock(t, pt, 16, 6)) });
        }
      }
      if (i === 7 && out > 0) chip(g, '?', lx + 92, ly - 40, { px: 70, bg: HOT, fg: BG, wt: 900, pad: 22, a: out, s: out, rot: .15 });
    });
    g.restore();
    /* the viewer's own count, once, before the reply lands */
    var q3 = home ? 99 : 1.5;
    if (t >= q3) { var qk = pop(t, q3, 3, .6); chip(g, '3?', 520, BIGY - 122, { px: 46, bg: MINT, fg: BG, wt: 900, pad: 16, s: lerp(1.5, 1, clamp(qk, 0, 1)), a: clamp(qk * 2, 0, 1) * (1 - seg(t, miss - .1, miss + .25)), rot: -.06 }); }
    /* the chat */
    var ca = 1 - leave, sy = leave * 260;
    if (ca > 0) {
      g.save(); g.globalAlpha *= ca; g.translate(0, sy);
      label(g, '● ChatGPT', 120, 996, 1, MINT, 42, 'left');
      label(g, 'RE-CREATED', 900, 996, 1, DIM, 32, 'right');
      label(g, 'GPT-4o · AUG 2024', 120, 1215, pop(t, two2 - .1), DIM, 32, 'left');
      var by = 1040, k2 = Math.max(0, knock(t, two, 15, 5)), flash = home ? 0 : win(t, two, two + .5, .35);
      bubble(g, 110, by, 680, 120, PANEL, 1, -1);
      /* "There are 2 r's in strawberry." is up from frame 0 (the conflict); on "two" the 2 stamps */
      font(g, 46, 700); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
      var pre = 'There are ', x2 = 150 + g.measureText(pre).width; g.fillText(pre, 150, by + 62);
      if (flash > 0) { g.save(); g.globalAlpha *= clamp(flash, 0, 1); rr(g, x2 - 4, by + 18, 60, 88, 16); g.strokeStyle = HOT; g.lineWidth = 5; g.stroke(); g.restore(); }
      chip(g, '2', x2 + 26, by + 60, { px: 70, fg: HOT, wt: 900, pad: 0, s: (t >= two ? lerp(1.6, 1, eo(seg(t, two, two + .12))) : 1) + .06 * k2 });
      font(g, 46, 700); g.textAlign = 'left'; g.fillStyle = CREAM; g.fillText(" r's in strawberry.", x2 + 56, by + 62);
      /* "Are you sure?" and the second 2 */
      var uk = pop(t, asked - .1, 2.6, .8);
      if (t >= asked - .1) {
        bubble(g, 560, 1180 + (1 - Math.min(1, uk)) * 60, 360, 100, PANEL2, clamp(uk * 2, 0, 1), 1);
        chip(g, 'Are you sure?', 740, 1230 + (1 - Math.min(1, uk)) * 60, { px: 42, wt: 700, pad: 0, a: clamp(uk * 2, 0, 1) });
      }
      if (t >= sure + .1) {
        var rk = pop(t, sure + .1, 2.6, .8);
        bubble(g, 110, 1310 + (1 - Math.min(1, rk)) * 40, 330, 104, PANEL, clamp(rk * 2, 0, 1), -1);
        if (t < two2) dots(g, 160, 1362, t, clamp(rk * 2, 0, 1));
        else {
          var k3 = pop(t, two2, 3.4, .55);
          font(g, 46, 700); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('Yes.', 150, 1364);
          chip(g, '2', 290, 1362, { px: 62, fg: HOT, wt: 900, pad: 0, s: lerp(2.4, 1, clamp(k3, 0, 1)) });
          font(g, 46, 700); g.fillStyle = CREAM; g.textAlign = 'left'; g.fillText("r's.", 320, 1364);
        }
      }
      g.restore();
    }
  }

  /* =====================================================================================================
     SCENE 2 · tokens: the question is cut into chips; strawberry is ONE chip; every chip is a number
     ===================================================================================================== */
  var TOKPX = 76;
  var IDPX = Math.round(TOKPX * .56);
  function qLayout(g, k, kid) {
    /* two lines: How many r 's are in / strawberry ? — k 0 = plain text, 1 = chips with gaps; kid[i] widens chip i to its ID */
    var gap = lerp(0, 18, k), pad = lerp(0, TOKPX * .26, k), out = [];
    var lines = [[0, 1, 2, 3, 4, 5], [6, 7]], ys = [820, 1010];
    lines.forEach(function (ln, li) {
      var ws = ln.map(function (i) { var tw = textW(g, Q[i][0], TOKPX, 800) + pad * 2, iw = textW(g, Q[i][1], i === 6 ? TOKPX * .8 : IDPX, 500, MONO) + 36; return lerp(tw, Math.max(tw, iw), kid ? kid[i] : 0); });
      font(g, TOKPX, 800);
      var sp0 = ln.map(function (i, j) { return j === 0 ? 0 : Q[i][0] === "'s" ? gap : Q[i][0] === '?' ? gap * 2.2 : gap + (1 - k) * TOKPX * .28; });
      var tot = ws.reduce(function (a, b) { return a + b; }, 0) + sp0.reduce(function (a, b) { return a + b; }, 0), f = Math.min(1, 820 / tot), x = 510 - tot * f / 2;
      ln.forEach(function (i, j) { x += sp0[j] * f; out[i] = { x: x + ws[j] * f / 2, y: ys[li], w: ws[j] * f, f: f }; x += ws[j] * f; });
    });
    return out;
  }
  function tokenScene(g, t) {
    var s0 = SC[1].t0, lettersT = at('tokens', 'letters'), tok = at('tokens', 'tokens'), never = at('tokens', 'never');
    var quest = at('single', 'question'), strT = at('single', 'strawberry'), single = at('single', 'single'), tokenW = at('single', 'token');
    var model = at('number', 'model'), whole = at('number', 'whole'), num = at('number', 'number');
    var FT = Q.map(function (q, i) { return i === 6 ? num : model + i * .07; });
    var split = ss(seg(t, tok - .05, tok + .35)), P = qLayout(g, split, FT.map(function (f) { return eio(seg(t, f - .05, f + .25)); }));
    /* letters view: every letter of the question gets a cell on "letters", then the cells vanish on "tokens" */
    var cellA = win(t, lettersT - .05, tok - .05, .2);
    Q.forEach(function (q, i) {
      var p = P[i], ap = pop(t, s0 + .05 + i * .04, 3, .78), focus = i === 6;
      var dimO = focus ? 1 : (1 - .62 * seg(t, strT - .1, strT + .2)) * lerp(1, .2, seg(t, num - .05, num + .3)) * (1 - seg(t, SC[1].t1 - .6, SC[1].t1 - .15));
      if (focus && t >= num + .1) return;      // from here the lifted chip below carries it
      var flip = seg(t, FT[i] - .05, FT[i] + .25), fs = Math.abs(Math.cos(flip * Math.PI)), showId = flip > .5;
      var bobY = knock(t, quest + i * .05, 16, 6) * 14 * (1 - split * 0) + (focus ? -8 * seg(t, strT, strT + .3) : 0);
      var grow = focus ? 1 + .06 * eio(seg(t, strT - .1, strT + .3)) + .06 * Math.max(0, knock(t, single, 14, 5)) + .06 * eio(seg(t, whole, num)) : 1;
      var col = focus ? HOT : CHIPS[i % 4];
      g.save(); g.translate(p.x, p.y + (1 - Math.min(1, ap)) * 40 + bobY); g.scale(grow * p.f, grow * p.f * Math.max(.03, fs)); g.globalAlpha *= clamp(ap * 2, 0, 1) * dimO;
      var cw = p.w / p.f, ch = TOKPX * 1.3;
      if (split > 0) { rr(g, -cw / 2, -ch / 2, cw, ch, 22); g.fillStyle = col; g.globalAlpha *= split; g.fill(); g.globalAlpha /= split; }
      font(g, showId ? (focus ? TOKPX * .8 : IDPX) : TOKPX, showId ? 500 : 800, showId ? MONO : DISP); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = split > .5 ? BG : CREAM; g.fillText(showId ? Q[i][1] : Q[i][0], 0, TOKPX * .05);
      g.restore();
      /* letter cells */
      if (cellA > 0 && !showId) {
        var L = letters(g, Q[i][0], TOKPX, 0);
        L.forEach(function (c, j) {
          var ck = pop(t, lettersT + (i * 4 + j) * .012, 4, .7);
          g.save(); g.globalAlpha *= cellA * clamp(ck, 0, 1) * .9; g.strokeStyle = c.c === 'r' ? HOT : 'rgba(244,237,224,.55)'; g.lineWidth = 3;
          rr(g, p.x + (c.x - c.w / 2 - 3) * p.f, p.y - 50 * p.f, (c.w + 6) * p.f, 100 * p.f, 8); g.stroke(); g.restore();
        });
      }
      /* the knife: a coral cut down each token boundary */
      if (i > 0 && Q[i][0] !== '?' && i !== 6) {
        var kt = tok + i * .05, kk = seg(t, kt - .12, kt), ko = 1 - seg(t, kt + .05, kt + .3);
        if (kk > 0 && ko > 0) { var bx = p.x - p.w / 2 - 9 * p.f; g.save(); g.globalAlpha = ko; g.strokeStyle = HOT; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(bx, p.y - 80); g.lineTo(bx, p.y - 80 + 160 * kk); g.stroke(); g.restore(); }
      }
    });
    /* the split everyone shows: str · aw · berry flashes inside the chip, then snaps shut on "single" */
    var p6 = P[6], fl = win(t, strT + .1, single - .12, .15);
    if (fl > 0) {
      var parts = ['str', 'aw', 'berry'], gx = 18 * fl * (1 - seg(t, single - .2, single)), wsum = 0; font(g, TOKPX, 800);
      var pw = parts.map(function (s) { return g.measureText(s).width; }); wsum = pw[0] + pw[1] + pw[2];
      var x = -(wsum + gx * 2) / 2;
      g.save(); g.translate(p6.x, p6.y); g.scale(p6.f, p6.f);
      parts.forEach(function (s, j) {
        if (j) { g.save(); g.globalAlpha = fl; g.setLineDash([10, 9]); g.strokeStyle = BG; g.lineWidth = 6; g.beginPath(); g.moveTo(x - gx / 2, -52); g.lineTo(x - gx / 2, 52); g.stroke(); g.restore(); }
        x += pw[j] + gx;
      });
      g.restore();
      label(g, 'NOT  str · aw · berry', 520, 1150, fl, DIM, 34);
    }
    label(g, 'LETTERS', 520, 650, win(t, lettersT - .05, tok - .1, .15), DIM, 34);
    label(g, 'TOKENS', 520, 650, win(t, tok, strT - .2, .2), HOT, 34);
    label(g, 'ONE WORD = ONE TOKEN', 520, 1150, win(t, single, model - .15, .2), HOT, 34);
    label(g, 'EVERY TOKEN = A NUMBER', 520, 650, win(t, model, num + .2, .2), YEL, 30);
    /* the DM moment: strawberry's chip lifts out of the row as one big number, then carries straight into the next scene */
    if (t >= num + .1) {
      var lk = eio(seg(t, num + .1, num + .6)), xf = seg(t, num + .3, num + .7), Z = chipSize(g, WORD), big = LIFTS;
      var k0 = p6.w / (Z.w * big);
      var lx = lerp(p6.x, 540, lk), ly = lerp(p6.y, CY, lk) - Math.sin(lk * Math.PI) * 60, sc = lerp(k0, 1, lk) * big;
      if (xf < 1) chip(g, '101830', lx, ly, { px: LIFTID * sc, fam: MONO, wt: 500, bg: HOT, fg: BG, w: Z.w * sc, h: Z.h * sc, r: Z.h * sc * .3, a: 1 - xf });
      if (xf > 0) sealed(g, t, lx, ly, sc, { ghost: 0, clearA: 0, ida: 1, idPx: LIFTID, a: xf, line: 'rgba(255,91,61,.6)' });
    }
    numCard(g, seg(t, num + .45, num + .7));
  }

  /* =====================================================================================================
     SCENE 3 · sealed: no s, no t, no r's; but it knows the spelling
     ===================================================================================================== */
  var PROBES = [['s', 'nothing', 's', -1, 1240], ['t', 'nothing', 't', 1, 1270], ['r', 'nothing', 'rs', -1, 1300]];
  var CY = 900, LIFTS = 1.12, LIFTID = 160;
  /* the still that explains itself: strawberry = [101830], with its source */
  function numCard(g, a) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= clamp(a, 0, 1); font(g, 90, 800); g.textAlign = 'center'; g.textBaseline = 'middle';
    var w1 = g.measureText('strawberry ').width, w2 = g.measureText('=').width, x0 = 540 - (w1 + w2) / 2;
    g.textAlign = 'left'; g.fillStyle = CREAM; g.fillText('strawberry ', x0, CY - 215 + (1 - a) * 20); g.fillStyle = HOT; g.fillText('=', x0 + w1, CY - 215 + (1 - a) * 20);
    g.restore();
    label(g, 'ONE NUMBER · OPENAI · o200k_base', 520, 1170, a, 'rgba(244,237,224,.7)', 34);
  }
  function sealedRattle(t, times) { var r = 0; times.forEach(function (a, i) { r += knock(t, a, 26, 6) * (i % 2 ? -1 : 1) * .05; }); return r; }
  function sealedScene(g, t) {
    var s0 = SC[2].t0, noth = at('nothing', 'nothing'), cnt = at('nothing', 'count'), twist = at('knows', 'twist'), knows = at('knows', 'knows'), spelled = at('knows', 'spelled');
    var hits = PROBES.map(function (p) { return at(p[1], p[2]) + .22; });
    var enter = eio(seg(t, s0 + .1, s0 + .8)), ghostK = eio(seg(t, s0 + .1, s0 + .8));
    var tw = eio(seg(t, twist - .05, twist + .55)), sx = Math.cos(tw * Math.PI * 2);
    var lift = eio(seg(t, knows - .2, knows + .4)), y = lerp(CY, 780, lift);
    numCard(g, 1 - seg(t, s0 + .12, s0 + .36));
    sealed(g, t, 540, y, lerp(LIFTS, 1, enter), { ghost: ghostK, clearA: 0, ida: 1, idPx: lerp(LIFTID, 112, enter), line: 'rgba(' + Math.round(lerp(255, 244, enter)) + ',' + Math.round(lerp(91, 237, enter)) + ',' + Math.round(lerp(61, 224, enter)) + ',.6)', rot: sealedRattle(t, hits), sx: sx, hotR: true, tag: 'ONE TOKEN · 101830', tagA: enter * (1 - lift) });
    /* letter probes fly at the chip and bounce off */
    PROBES.forEach(function (p, i) {
      var hit = hits[i], go = at(p[1], p[2]) - .12;
      if (t < go || t > hit + 1.6) return;
      var k = eio(seg(t, go, hit)), back = eo(seg(t, hit, hit + .9)), side = p[3];
      var x0 = 540 + side * 560, y0 = p[4], xh = 540 + side * 300, yh = CY + 70;
      var x = t < hit ? lerp(x0, xh, k) : lerp(xh, 540 + side * 420, back), yy = t < hit ? lerp(y0, yh, k) : lerp(yh, p[4] + 40, back) - Math.sin(back * Math.PI) * 120;
      var fade = 1 - seg(t, hit + 1.1, hit + 1.6);
      chip(g, p[0], x, yy, { px: 84, bg: p[0] === 'r' ? HOT : CREAM, fg: BG, wt: 900, pad: 26, a: fade, rot: (t - go) * side * 2.2 });
      if (t >= hit) cross(g, xh, yh - 110, clamp(pop(t, hit, 3, .6), 0, 1), BAD, fade);
    });
    /* nothing inside to count */
    var na = win(t, noth - .05, knows - .25, .25);
    if (na > 0) {
      g.save(); g.globalAlpha *= clamp(na, 0, 1);
      font(g, 74, 500, MONO); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
      g.fillText('r count:', 470, 1180);
      var qk = pop(t, cnt, 3, .55); chip(g, '?', 700, 1180, { px: 84, bg: HOT, fg: BG, wt: 900, pad: 22, s: lerp(1.6, 1, clamp(qk, 0, 1)) * (1 + .06 * Math.sin(t * 6)) });
      g.restore();
    }
    /* the twist: it knows the spelling, from memory */
    var ca = clamp(pop(t, knows - .1, 2.4, .8), 0, 1) * (1 - seg(t, SC[2].t1 - .3, SC[2].t1));
    if (ca > 0) {
      g.save(); g.globalAlpha *= ca;
      for (var b = 0; b < 3; b++) { g.beginPath(); g.arc(300 + b * 34, 935 + b * 46, 10 + b * 6, 0, 6.283); g.fillStyle = PANEL2; g.fill(); }
      rr(g, 120, 1080, 820, 230, 60); g.fillStyle = PANEL2; g.fill();
      g.restore();
      var L = letters(g, WORD, 104, 24, 400, 'italic ' + SERIF), t0w = knows + .1, t1w = spelled + .45, msc = Math.min(1, 700 / L.total);
      L.forEach(function (c) { c.x *= msc; c.w *= msc; });
      L.forEach(function (c, i) {
        var tt = lerp(t0w, t1w, i / 9); if (t < tt) return;
        var k = pop(t, tt, 4, .7), hot = c.c === 'r';
        g.save(); g.globalAlpha *= ca * clamp(k * 2, 0, 1); font(g, 104 * msc, 400, 'italic ' + SERIF); g.fillStyle = hot ? HOT : CREAM; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.translate(530 + c.x, 1190 + (1 - Math.min(1, k)) * 20); g.rotate((hash(i + 4) - .5) * .14); g.fillText(c.c, 0, 0); g.restore();
        if (i < 9) { var nk = seg(t, tt + .05, tt + .2); g.save(); g.globalAlpha *= ca * .5; g.strokeStyle = CREAM; g.lineWidth = 4; g.beginPath(); var xa = 530 + c.x + c.w / 2 + 2; g.moveTo(xa, 1196); g.lineTo(xa + 26 * nk, 1196); g.stroke(); g.restore(); }
      });
      label(g, 'FROM MEMORY', 530, 1350, ca * seg(t, spelled - .2, spelled + .2), DIM, 30);
    }
  }

  /* =====================================================================================================
     SCENE 4 · in its head: one pass, and the double r slips
     ===================================================================================================== */
  var REELX = 520, REELY = 860, REELSP = 108, SL = REELX + 74;
  /* the reel position, one pass: "st" in view from the start, the r·r pair arrives on "repeated", the pair merges on "slip" */
  function reelOff(t) {
    var a = start('head') + .25, rep = at('slip', 'repeated'), slip = at('slip', 'slip'), offP = 650 - REELX - 7 * REELSP;
    var off = lerp(180, offP, ss(seg(t, a, rep)));
    off -= 14 * seg(t, rep, slip - .1);
    off -= 170 * eio(seg(t, slip - .1, slip + .35));
    return off;
  }
  function reelMerge(t) { var slip = at('slip', 'slip'); return eio(seg(t, slip - .1, slip + .35)); }
  function reelX(i, t) { var x = REELX + reelOff(t) + i * REELSP; if (i === 8) x -= reelMerge(t) * REELSP * .82; return x; }
  /* when letter i crosses the scan line (pure: bisection over a monotonic path) */
  function reelCross(i) {
    var a = SC[3].t0, b = at('slip', 'slip') + .6;
    if (reelX(i, b) >= SL) return 1e9; if (reelX(i, a) < SL) return a;
    for (var k = 0; k < 40; k++) { var m = (a + b) / 2; if (reelX(i, m) < SL) b = m; else a = m; }
    return b;
  }
  function headScene(g, t) {
    var s0 = SC[3].t0, rep = at('slip', 'repeated'), exactly = at('slip', 'exactly'), slip = at('slip', 'slip');
    var merge = reelMerge(t), wa = pop(t, s0 + .05, 2.6, .85);
    /* the head: a thought window fed by small bubbles from a tiny sealed chip */
    g.save(); g.globalAlpha *= clamp(wa, 0, 1);
    g.save(); g.globalAlpha *= 1 - seg(t, rep - .25, rep + .1);
    sealed(g, t, 240, 1290, .32, { ghost: 1, ida: 1, idPx: 120 });
    for (var b = 0; b < 3; b++) { g.beginPath(); g.arc(270 + b * 30, 1160 - b * 60, 12 + b * 7, 0, 6.283); g.fillStyle = PANEL2; g.fill(); }
    g.restore();
    rr(g, 110, REELY - 150, 820, 300, 70); g.fillStyle = PANEL2; g.fill();
    g.restore();
    label(g, 'IN ITS HEAD · ONE PASS', 520, REELY - 210, wa * (1 - seg(t, rep - .2, rep)), DIM, 32);
    label(g, 'THE DOUBLE r', 520, REELY - 210, win(t, rep, SC[3].t1 - .3, .2), HOT, 32);
    g.save(); rr(g, 110, REELY - 150, 820, 300, 70); g.clip();
    var count = 0, hits = [];
    LET.forEach(function (c, i) {
      var x = reelX(i, t), crossed = x < SL;
      if (c === 'r' && i !== 8) { var ct = reelCross(i); if (t >= ct) { count++; hits.push(ct); } }
      var near = 1 - clamp(Math.abs(x - SL) / 240, 0, 1);
      var hot = c === 'r' && (crossed || (t >= rep && i >= 7));
      g.save(); g.globalAlpha = clamp(wa, 0, 1) * lerp(.4, 1, near) * (i === 8 ? lerp(1, .5, merge) : 1);
      if (i === 8 && merge > 0) g.filter = 'blur(' + (6 * merge).toFixed(1) + 'px)';
      font(g, 150, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = hot ? HOT : CREAM;
      g.fillText(c, x, REELY + 10 + (i === 8 ? -merge * 8 : 0));
      g.restore();
    });
    g.restore();
    /* the scan line */
    g.save(); g.globalAlpha *= clamp(wa, 0, 1); g.fillStyle = HOT; rr(g, SL - 4, REELY - 120, 8, 240, 4); g.fill(); g.restore();
    /* the tally: one tick for the merged pair, so it stops at 2 */
    var ck = hits.length ? pop(t, hits[hits.length - 1], 3.4, .6) : 1, bad = count >= 2;
    font(g, 92, 500, MONO); g.save(); g.globalAlpha *= clamp(wa, 0, 1); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('r:', 380, 1150);
    chip(g, String(count), 560, 1150, { px: 110, fam: MONO, wt: 500, pad: 0, fg: bad ? BAD : CREAM, s: lerp(1.5, 1, clamp(ck, 0, 1)) });
    g.restore();
    if (bad) { var gk = pop(t, hits[1] + .12, 3, .7); chip(g, '3', 680, 1150, { px: 80, fam: MONO, wt: 500, pad: 0, fg: DIM, a: clamp(gk, 0, 1) * .8 }); g.save(); g.globalAlpha = clamp(gk, 0, 1); g.strokeStyle = BAD; g.lineWidth = 7; g.beginPath(); g.moveTo(650, 1180); g.lineTo(712, 1118); g.stroke(); g.restore(); }
    label(g, 'MISCOUNTS PILE UP ON REPEATED LETTERS', 520, 1300, win(t, exactly, SC[3].t1 - .3, .2), YEL, 30);
  }

  /* =====================================================================================================
     SCENE 5 · straw has one, berry has two, total: two
     ===================================================================================================== */
  function berryScene(g, t) {
    var s0 = SC[4].t0, straw = at('berry', 'straw'), one = at('berry', 'one'), berry = at('berry', 'berry'), two1 = at('berry', 'two'), total = at('berry', 'total'), two2 = at('berry', 'two', 1);
    label(g, 'SAME TEST · GPT-4o · AUG 2024', 520, 600, pop(t, s0 + .1), DIM, 34);
    [['straw', straw, one, '1', 290], ['berry', berry, two1, '2', 730]].forEach(function (p, j) {
      var k = pop(t, s0 + .1 + j * .12, 2.6, .8), lit = .3 + .7 * seg(t, p[1] - .12, p[1] + .08), kk = pop(t, p[1] - .1, 3, .7);
      var L = letters(g, p[0], 96, 2), x = p[4], y = 790 + (1 - Math.min(1, k)) * 50 - 14 * Math.max(0, knock(t, p[1] - .1, 14, 6));
      g.save(); g.globalAlpha *= clamp(k * 2, 0, 1) * lit; g.translate(x, y); g.scale(lerp(.92, 1, clamp(kk, 0, 1)), lerp(.92, 1, clamp(kk, 0, 1))); g.translate(-x, -y);
      rr(g, x - L.total / 2 - 36, y - 74, L.total + 72, 148, 40); g.fillStyle = PANEL2; g.fill(); g.strokeStyle = 'rgba(244,237,224,.35)'; g.lineWidth = 4; g.stroke();
      L.forEach(function (c) { font(g, 96, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = c.c === 'r' ? HOT : CREAM; g.fillText(c.c, x + c.x, y + 4); });
      g.restore();
      if (t >= p[2]) { var nk = pop(t, p[2], 3.2, .6); chip(g, p[3], x, 960, { px: 92, bg: MINT, fg: BG, wt: 900, pad: 30, s: lerp(1.6, 1, clamp(nk, 0, 1)), a: clamp(nk * 3, 0, 1) }); tick(g, x + 90, 960, 1, MINT, clamp(nk, 0, 1)); }
    });
    /* the sum */
    if (t >= total - .1) {
      var k = pop(t, total - .1, 3, .75);
      g.save(); g.globalAlpha *= clamp(k * 2, 0, 1);
      font(g, 120, 900); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = CREAM;
      g.fillText('1 + 2 =', 440, 1130 + (1 - Math.min(1, k)) * 30);
      g.restore();
      if (t < two2) chip(g, '?', 760, 1130, { px: 110, fg: DIM, wt: 900, pad: 0, a: .7 + .3 * Math.sin(t * 9) });
      else { var k2 = pop(t, two2, 3.6, .5); chip(g, '2', 760, 1130, { px: 150, bg: BAD, fg: BG, wt: 900, pad: 34, s: lerp(2.2, 1, clamp(k2, 0, 1)), rot: -.06 * clamp(k2, 0, 1) }); }
    }
  }

  /* =====================================================================================================
     SCENE 6 · the fix: spell it out; the seal cracks into ten letter chips; three are 428
     ===================================================================================================== */
  var CELLW = 140, CELLH = 164, CELLPX = 112;
  function cellX(i) { return 520 + (i % 5 - 2) * 166; }
  function cellY(i) { return i < 5 ? 830 : 1090; }
  var CRACK = (function () { var r = mulberry(41), pts = []; for (var i = 0; i <= 10; i++) pts.push([i / 10, (r() - .5) * .5]); pts[0][1] = .05; pts[10][1] = -.05; return pts; })();
  function crackPath(g, w, h, k, up) {
    /* the crack line across the chip; with `up` set, closes a half-shell polygon above (1) or below (-1) it */
    g.beginPath();
    var n = Math.max(1, Math.ceil(k * 10));
    for (var i = 0; i <= n && i <= 10; i++) { var p = CRACK[i], x = -w / 2 + p[0] * w, y = p[1] * h * .55; if (i === n && k < 1) { var q = CRACK[i - 1], u = k * 10 - (i - 1); x = lerp(-w / 2 + q[0] * w, x, u); y = lerp(q[1] * h * .55, y, u); } i ? g.lineTo(x, y) : g.moveTo(x - 4, y); }
    if (up) { g.lineTo(w / 2 + 10, up * -h); g.lineTo(-w / 2 - 10, up * -h); g.closePath(); }
  }
  function fixScene(g, t) {
    var s0 = SC[5].t0, watch = at('watch', 'watch'), fix = at('watch', 'fix'), spell = at('watch', 'spell'), spaces = at('watch', 'spaces');
    var every = at('plain', 'every'), letter = at('plain', 'letter'), token = at('plain', 'token'), three = at('plain', 'three'), plain = at('plain', 'plain');
    var Z = chipSize(g, WORD), w = Z.w, h = Z.h;
    var lift = eio(seg(t, watch - .1, watch + .4)), cy = lerp(940, 880, lift), crackK = eio(seg(t, fix - .05, fix + .35)), open = eio(seg(t, spell, spell + .55));
    var spread = eio(seg(t, spell + .15, wend('watch', 'spaces') + .1)), rat = knock(t, fix + .05, 30, 5) * .03;
    if (open < 1) {
      [1, -1].forEach(function (up) {
        g.save(); g.translate(540, cy - up * open * 380); g.rotate(rat - up * open * .3); g.globalAlpha *= 1 - open; g.scale(1.1, 1.1);
        sealed(g, t, 0, 0, 1, { ghost: 1 - open * .9, ida: 1 - seg(t, spell - .2, spell + .05), noWord: open > 0, hotR: true, clip: open > 0 ? function (gg, ww, hh) { crackPath(gg, ww, hh, 1, up); gg.clip(); } : null, tag: up === 1 ? 'THE SEALED CHIP · 101830' : null, tagA: (1 - open) * (1 - lift * .3) });
        g.restore();
      });
      if (crackK > 0 && open < 1) { g.save(); g.translate(540, cy); g.rotate(rat); g.scale(1.1, 1.1); g.globalAlpha *= 1 - open; g.strokeStyle = HOT; g.lineWidth = 8; g.lineJoin = 'round'; g.lineCap = 'round'; crackPath(g, w, h, crackK, 0); g.stroke(); g.restore(); }
    }
    /* the letters: sharp, from their places in the chip to a row of ten chips with spaces */
    if (t >= spell) {
      var L = Z.L, three0 = three;
      LET.forEach(function (c, i) {
        var ysp = eio(seg(t, spell + .1, spell + .45)), x = lerp(540 + L[i].x * 1.1, cellX(i), spread), y = lerp(cy, cellY(i), ysp) + knock(t, letter + i * .06, 16, 6) * 14;
        var isR = c === 'r', lit = isR ? eio(seg(t, three0 + (i === 2 ? 0 : i === 7 ? .12 : .24), three0 + .3 + (i === 2 ? 0 : i === 7 ? .12 : .24))) : 0;
        y -= lit * 22;
        var px = lerp(CHIPPX * 1.1, CELLPX, spread), bgA = spread, cs = lerp(.5, 1, spread);
        g.save(); g.translate(x, y); g.globalAlpha *= seg(t, spell, spell + .2);
        if (bgA > 0) { rr(g, -CELLW / 2 * cs, -CELLH / 2 * cs, CELLW * cs, CELLH * cs, 30 * cs); var ga = g.globalAlpha; g.globalAlpha = ga * bgA; g.fillStyle = lit > .5 ? HOT : PANEL2; g.fill(); g.strokeStyle = lit > .5 ? HOT : 'rgba(244,237,224,.45)'; g.lineWidth = 3; g.stroke(); g.globalAlpha = ga; }
        font(g, px, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = lit > .5 ? BG : CREAM; g.fillText(c, 0, px * .04);
        g.restore();
        /* each letter's own token ID, under it */
        var it = token - .15 + i * .07;
        if (t >= it) { var ik = pop(t, it, 3.4, .7); g.save(); g.globalAlpha *= clamp(ik * 2, 0, 1); font(g, 36, 500, MONO); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = lit > .5 ? HOT : DIM; g.fillText(LID[i], x, cellY(i) + 112 + (1 - Math.min(1, ik)) * 16); g.restore(); }
      });
      label(g, 'SPELLED WITH SPACES', 520, 660, win(t, spaces - .05, every - .2, .2), DIM, 30);
      label(g, '10 LETTERS = 10 TOKENS', 520, 660, win(t, every, three - .2, .2), MINT, 30);
      label(g, "' r' = TOKEN 428, THREE TIMES", 520, 660, win(t, three + .3, SC[5].t1 - .3, .2), HOT, 30);
      /* the tally that finally works is the global stamp "3 R's ✓" (STAMPS) */
    }
  }

  /* =====================================================================================================
     SCENE 7 · thinking models spell first, then count; or run code
     ===================================================================================================== */
  function thinkScene(g, t) {
    var s0 = SC[6].t0, thinking = at('think', 'thinking'), spell = at('think', 'spell'), fe = wend('think', 'first');
    var run = at('think', 'run'), ce = wend('think', 'code') + .05;
    /* panel A: the thinking trace, in our chip + caret language (no generic spinner) */
    var pa = pop(t, s0 + .05, 2.6, .85), py = 520 + (1 - Math.min(1, pa)) * 60, ph = 490;
    g.save(); g.globalAlpha *= clamp(pa, 0, 1);
    rr(g, 110, py, 820, ph, 40); g.fillStyle = PANEL; g.fill(); g.strokeStyle = FAINT; g.lineWidth = 3; g.stroke();
    var hk = knock(t, thinking, 18, 6), done = t >= fe + .45;
    var tw = chip(g, 'thinking', 150 + textW(g, 'thinking', 40, 500, MONO) / 2 + 22, py + 66, { px: 40, fam: MONO, wt: 500, line: LIL, fg: LIL, lw: 3, pad: 22, s: 1 + .12 * hk });
    caret(g, 150 + tw + 26, py + 66, 48, t, !done, LIL);
    var LS = 80, lx0 = 520 - 4.5 * LS, ly = py + 200;
    LET.forEach(function (c, i) {
      var tt = lerp(spell - .05, fe, i / 9); if (t < tt) return;
      var k = pop(t, tt, 4, .75), isR = c === 'r', ri = i === 2 ? 0 : i === 7 ? 1 : 2, ct = lerp(fe + .02, fe + .36, ri / 2), lit = isR && t >= ct;
      g.save(); g.globalAlpha *= clamp(k * 2, 0, 1); font(g, 82, 500, MONO); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = lit ? HOT : CREAM;
      g.fillText(c, lx0 + i * LS, ly + (1 - Math.min(1, k)) * 14); g.restore();
      if (lit) { var ck = pop(t, ct, 3.4, .6); chip(g, String(ri + 1), lx0 + i * LS, ly + 112, { px: 50, bg: HOT, fg: BG, wt: 900, pad: 14, s: lerp(1.6, 1, clamp(ck, 0, 1)), a: clamp(ck * 2, 0, 1) }); }
    });
    if (t >= spell - .05 && t < fe + .05) { var ti = Math.min(9, Math.floor(clamp((t - spell + .05) / (fe - spell + .05), 0, 1) * 9.999)); caret(g, lx0 + ti * LS + 46, ly, 74, t, true, LIL); }
    if (done) { var ek = pop(t, fe + .45, 3, .7); chip(g, '= 3', 790, py + ph - 70, { px: 80, fam: MONO, wt: 500, pad: 0, fg: MINT, a: clamp(ek * 2, 0, 1), s: lerp(1.5, 1, clamp(ek, 0, 1)) }); }
    label(g, 'SPELL FIRST', 330, py + ph - 70, clamp(sp(t, spell), 0, 1), DIM, 30);
    g.restore();
    /* panel B: the terminal, up from the start so both sit together and fill the lower half */
    var b0 = Math.max(s0 + .25, at('plain', 'three') + 2.75), pb = pop(t, b0, 2.6, .85), cy = 1050 + (1 - Math.min(1, pb)) * 70;
    g.save(); g.globalAlpha *= clamp(pb, 0, 1);
    rr(g, 110, cy, 820, 360, 40); g.fillStyle = '#0d0c12'; g.fill(); g.strokeStyle = FAINT; g.lineWidth = 3; g.stroke();
    var rk = knock(t, run, 18, 6);
    chip(g, 'python', 150 + textW(g, 'python', 40, 500, MONO) / 2 + 22, cy + 62, { px: 40, fam: MONO, wt: 500, line: MINT, fg: MINT, lw: 3, pad: 22, s: 1 + .12 * rk });
    var src = '"strawberry".count("r")', n = Math.floor(clamp((t - run) / Math.max(.3, ce - run), 0, 1) * src.length);
    font(g, 46, 500, MONO); g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillStyle = DIM; g.fillText('>>>', 150, cy + 160);
    var s1 = src.slice(0, n), xs = 260, head = s1.replace(/\.count\(.*$/, ''); g.fillStyle = MINT; g.fillText(head, xs, cy + 160);
    var qw = g.measureText(head).width; g.fillStyle = CREAM; g.fillText(s1.slice(head.length), xs + qw, cy + 160);
    if (t < ce + .1) caret(g, xs + g.measureText(s1).width + 8, cy + 160, 56, t, t >= run && n < src.length, HOT);
    if (t >= ce + .1) {
      var ok = pop(t, ce + .1, 3.2, .6);
      g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(130, cy + 214, 780 * seg(t, ce, ce + .25), 4);
      chip(g, '3', 205, cy + 285, { px: 120, fam: MONO, wt: 500, pad: 0, fg: HOT, s: lerp(1.8, 1, clamp(ok, 0, 1)), a: clamp(ok * 3, 0, 1) });
      tick(g, 310, cy + 285, 1.6, MINT, clamp(pop(t, ce + .25, 3, .6), 0, 1));
      caret(g, 390, cy + 285, 64, t, false, HOT, seg(t, ce + .4, ce + .6));
      label(g, 'BOTH SEE EVERY LETTER', 895, cy + 62, win(t, ce + .4, SC[6].t1 - .3, .2), YEL, 34, 'right');
    }
    g.restore();
  }

  /* =====================================================================================================
     SCENE 8 · the codename; today most get it right, but not all
     ===================================================================================================== */
  function nameScene(g, t) {
    var s0 = SC[7].t0, openai = at('codename', 'openais'), first = at('codename', 'first'), model = at('codename', 'model'), coden = at('codename', 'codenamed'), straw = at('codename', 'strawberry');
    var by = at('today', 'by'), y25 = at('today', '2025'), right = at('today', 'right'), gone = at('today', 'gone');
    var out = eio(seg(t, by - .2, by + .3));
    /* the dossier: three real lines (BRIEF fact 11), typed under the narration */
    if (out < 1) {
      var fk = pop(t, s0 + .05, 2.4, .85), fy = 640 + (1 - Math.min(1, fk)) * 80 - out * 500;
      g.save(); g.globalAlpha *= clamp(fk * 2, 0, 1) * (1 - out); g.translate(520, fy); g.rotate(-.03);
      rr(g, -380, -40, 260, 80, 22); g.fillStyle = '#3b3427'; g.fill();
      rr(g, -430, 0, 860, 520, 30); g.fillStyle = '#463e2e'; g.fill();
      font(g, 32, 500, MONO); g.fillStyle = 'rgba(244,237,224,.75)'; g.textAlign = 'left'; g.textBaseline = 'middle'; try { g.letterSpacing = '4px'; } catch (e) {} g.fillText('OPENAI · o1', -360, -4);
      try { g.letterSpacing = '0px'; } catch (e) {}
      var DL = [['PROJECT STRAWBERRY · Reuters, Jul 2024', s0 + .3, openai + .5], ['→ o1-preview · Sep 12, 2024', first - .05, model + .2], ['trained to think before answering', model + .25, coden - .05]];
      font(g, 34, 500, MONO); var lastX = -395, lastY = 80, busy = false;
      DL.forEach(function (d, i) {
        if (t < d[1]) return;
        var n = Math.floor(seg(t, d[1], d[2]) * d[0].length), s = d[0].slice(0, n), y = 80 + i * 64;
        g.fillStyle = i === 0 ? CREAM : 'rgba(244,237,224,.82)'; g.fillText(s, -395, y);
        lastX = -395 + g.measureText(s).width + 8; lastY = y; busy = n < d[0].length;
      });
      caret(g, lastX, lastY, 40, t, busy, HOT, t >= s0 + .3 ? 1 : 0);
      g.restore();
      if (t >= coden) {
        var sk = sp(t, coden, 3, .55), s = lerp(1.9, 1, clamp(sk, 0, 1.2));
        g.save(); g.globalAlpha = clamp(sk * 3, 0, 1) * (1 - out); g.translate(520, fy + 380); g.rotate(-.1); g.scale(s, s);
        font(g, 60, 900); var tw = g.measureText('STRAWBERRY').width + 70;
        rr(g, -tw / 2, -100, tw, 200, 20); g.strokeStyle = HOT; g.lineWidth = 7; g.stroke(); g.fillStyle = 'rgba(21,19,27,.6)'; g.fill();
        font(g, 34, 700, MONO); g.fillStyle = HOT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CODENAME', 0, -50);
        g.globalAlpha *= clamp(sp(t, straw, 3, .6) * 3, 0, 1); font(g, 60, 900); g.fillText('STRAWBERRY', 0, 30);
        g.restore();
      }
    }
    /* today: one big tally instead of five identical rows (BRIEF fact 12), and the one that still slips */
    if (t >= by - .2) {
      var ia = clamp(sp(t, by + .3, 2.4, .85), 0, 1.1);   // only once the dossier has gone
      label(g, 'AUG 2025 TEST · 100 TRIES PER MODEL', 520, 620, ia, DIM, 30);
      var ck = pop(t, y25 - .05, 2.8, .6), br = 1 + .02 * Math.sin(t * 2.2);
      if (t >= y25 - .05) {
        g.save(); g.globalAlpha *= clamp(ck * 2, 0, 1); g.translate(520, 860); g.scale(clamp(ck, 0, 1.1) * br, clamp(ck, 0, 1.1) * br);
        g.beginPath(); g.arc(0, 0, 150, 0, 6.283); g.fillStyle = 'rgba(63,214,162,.14)'; g.fill(); g.strokeStyle = MINT; g.lineWidth = 8; g.stroke();
        g.restore();
        tick(g, 520, 868, 4.2 * clamp(ck, 0, 1.1) * br, MINT, clamp(ck * 2, 0, 1));
      }
      if (t >= wend('today', 'right')) {
        var ak = pop(t, wend('today', 'right'), 3, .65);
        chip(g, 'ALL BUT ONE', 520, 1100, { px: 84, wt: 900, pad: 0, fg: CREAM, s: lerp(1.4, 1, clamp(ak, 0, 1)), a: clamp(ak * 2, 0, 1) });
      }
      if (t >= gone) {
        var gk = pop(t, gone, 3, .6), wob = knock(t, gone, 13, 3) * .09;
        chip(g, 'NOT GONE', 520, 1240, { px: 52, wt: 900, bg: HOT, fg: BG, pad: 30, rot: wob, s: lerp(1.5, 1, clamp(gk, 0, 1)), a: clamp(gk * 2, 0, 1) });
      }
    }
  }

  /* =====================================================================================================
     SCENE 9 · blueberry: GPT-5 says three b's; same blindness, one token too
     ===================================================================================================== */
  var BLUE = 'blueberry';
  function blueScene(g, t) {
    var s0 = SC[8].t0, y2025 = at('blue', '2025'), gpt = at('blue', 'gpt5'), told = at('blue', 'told'), blueW = at('blue', 'blueberry'), three = at('blue', 'three'), bs = at('blue', 'bs');
    var same = at('same', 'same'), blind = at('same', 'blindness'), blue2 = at('same', 'blueberry'), tok = at('same', 'token');
    var leave = eio(seg(t, same - .2, same + .35));
    /* the chat */
    if (leave < 1) {
      g.save(); g.globalAlpha *= 1 - leave; g.translate(0, -leave * 200);
      label(g, '● GPT-5', 120, 600, pop(t, gpt - .1), SKY, 32, 'left');
      label(g, 'RE-CREATED', 330, 600, pop(t, s0 + .1), DIM, 32, 'left');
      label(g, 'AUG 2025', 900, 600, pop(t, y2025), DIM, 30, 'right');
      var uk = pop(t, s0 + .1, 2.6, .85);
      bubble(g, 150, 650 + (1 - Math.min(1, uk)) * 40, 780, 104, PANEL2, clamp(uk * 2, 0, 1), 1);
      chip(g, "how many b's are there in blueberry?", 540, 702 + (1 - Math.min(1, uk)) * 40, { px: 38, wt: 700, pad: 0, a: clamp(uk * 2, 0, 1) });
      var rk = pop(t, told - .2, 2.6, .85);
      if (t >= told - .2) {
        bubble(g, 110, 790, 560, 120, PANEL, clamp(rk * 2, 0, 1), -1);
        if (t < three) dots(g, 160, 850, t, clamp(rk * 2, 0, 1));
        else { var k3 = pop(t, three, 3.4, .55); font(g, 46, 700); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = CREAM; g.fillText('There are', 150, 852); chip(g, '3', 385, 850, { px: 64, fg: BAD, wt: 900, pad: 0, s: lerp(2.4, 1, clamp(k3, 0, 1)) }); font(g, 46, 700); g.fillStyle = CREAM; g.textAlign = 'left'; g.fillText("b's.", 420, 852); }
      }
      g.restore();
    }
    /* the word, then its seal */
    var wk = pop(t, blueW - .1, 2.6, .8), seal = eio(seg(t, blind - .05, blind + .45)), up = eio(seg(t, same - .1, same + .4));
    var wy = lerp(1100, 1080, up);
    if (t >= blueW - .1) {
      if (seal < 1) {
        var L = letters(g, BLUE, 124, 4);
        L.forEach(function (c, i) {
          var isB = c.c === 'b', bob = isB ? knock(t, bs + (i ? .18 : 0), 18, 6) * 20 : 0;
          g.save(); g.globalAlpha *= clamp(wk * 2, 0, 1) * (1 - seal); font(g, 124, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = isB ? SKY : CREAM;
          g.fillText(c.c, 520 + c.x, wy + bob + (1 - Math.min(1, wk)) * 40); g.restore();
          if (isB && t >= bs) { var nk = pop(t, bs + (i ? .18 : 0), 3, .7); chip(g, i ? '2' : '1', 520 + c.x, wy - 128, { px: 44, bg: SKY, fg: BG, wt: 900, pad: 14, a: clamp(nk * 2, 0, 1) * (1 - seal) }); }
        });
      }
      if (seal > 0) sealed(g, t, 540, wy, lerp(.9, 1, seal), { word: BLUE, id: '177717', ghost: seal, ida: seg(t, tok - .1, tok + .2), a: seal, line: SKY, hotR: true, hotC: 'b', seed: 2, tag: 'BLUEBERRY · ONE TOKEN', tagA: seg(t, tok, tok + .3), tagCol: SKY });
    }
    /* strawberry's chip slides in above it */
    if (t >= same - .15) {
      var sk = eio(seg(t, same - .15, same + .35));
      sealed(g, t, lerp(-500, 540, sk), 760, 1, { ghost: 1, ida: 1, hotR: true, tag: 'STRAWBERRY · ONE TOKEN', tagA: seg(t, same + .55, same + .85) });
    }
  }

  /* =====================================================================================================
     SCENE 10 · the end: it can count what it can see; the chip closes, and the film loops to frame 0
     ===================================================================================================== */
  function endScene(g, t) {
    var s0 = SC[9].t0, cnt = at('end', 'count'), see = at('end', 'see'), counting = at('end', 'counting');
    var Z = chipSize(g, WORD), L = Z.L;
    var appear = eio(seg(t, s0, s0 + .4)), fold = eio(seg(t, see - .15, see + .45)), seal = eio(seg(t, see + .45, counting + .35));
    var cy = 900;
    /* the shell closes over them: drawn under the folding letters, and empty (no ghosts) until the fold lands */
    if (fold > .6) sealed(g, t, 540, cy, 1, { ghost: seal, ida: seal, noWord: fold < 1, a: clamp((fold - .6) / .3, 0, 1), hotR: true, tag: 'SEALED · 101830', tagA: seal });
    /* the ten letter chips, three r's lit: it can count these */
    if (fold < 1) LET.forEach(function (c, i) {
      var x = lerp(cellX(i), 540 + L[i].x, fold), y = lerp(cellY(i), cy, fold) + (1 - appear) * 60 * (i % 2 ? 1 : -1);
      var isR = c === 'r', ci = i === 2 ? 0 : i === 7 ? 1 : 2, ct = cnt + ci * .12, lit = isR && t >= ct;
      var px = lerp(CELLPX, CHIPPX, fold), cs = 1 - fold * .5;
      g.save(); g.translate(x, y - (lit ? 22 * (1 - fold) : 0)); g.globalAlpha *= appear;
      rr(g, -CELLW / 2 * cs, -CELLH / 2 * cs, CELLW * cs, CELLH * cs, 30 * cs); g.globalAlpha *= 1 - fold; g.fillStyle = lit ? HOT : PANEL2; g.fill(); g.globalAlpha /= Math.max(.001, 1 - fold);
      font(g, px, 800); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = lit && fold < .5 ? BG : CREAM; g.fillText(c, 0, px * .04);
      g.restore();
    });
    if (t >= cnt && fold < 1) { var tk = pop(t, cnt + .3, 3, .65); chip(g, '3', 500, 1340, { px: 110, fam: MONO, wt: 500, pad: 0, fg: HOT, a: clamp(tk * 2, 0, 1) * (1 - fold), s: lerp(1.6, 1, clamp(tk, 0, 1)) }); tick(g, 600, 1340, 1.4, MINT, clamp(tk, 0, 1) * (1 - fold)); }
    label(g, 'IT CAN COUNT', 520, 660, win(t, cnt, see - .25, .2), MINT, 30);
    label(g, "IT CAN'T SEE INSIDE", 520, 1150, win(t, counting, HOME - .2, .2), HOT, 30);
  }

  /* ---------- captions: the narrator's words, highlighted as spoken; the first card is up from frame 0 ---------- */
  /* the first two cards are one question ("How many r's in strawberry?"), so frame 0 carries the whole hook */
  var CAPS = VO.captions.slice(1); CAPS[0] = { t0: VO.captions[0].t0, t1: VO.captions[1].t1, words: VO.captions[0].words.concat(VO.captions[1].words) };
  function captions(g, t, alpha) {
    /* one caption layer at a time: each card fades out fully, then 0.12 s of nothing, then the next fades in (0.1 s) */
    var card = null, ci = -1;
    CAPS.forEach(function (c, i) { if (t >= (i ? c.t0 - .04 : -1e9)) { card = c; ci = i; } });
    if (!card) return;
    var nx = CAPS[ci + 1], ns = nx ? nx.t0 - .04 : 1e9, o1 = Math.min(card.t1 + .12, ns - .12), o0 = Math.min(card.t1, o1 - .12);
    var fin = ci === 0 ? 1 : seg(t, card.t0 - .04, card.t0 + .06), out = 1 - seg(t, o0, o1);
    if (fin * out <= 0) return;
    var first = ci === 0;
    var k = first && t < card.t0 ? 1 : clamp(spring(t - card.t0 + .04, 3.2, .7), 0, 1.1); if (first) k = 1;
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
        var w = words[i], cur = t >= w.t0 - .03 && t < w.t1 + .05, said = t >= w.t0 - .03;
        if (cur) { g.fillStyle = HOT; g.beginPath(); g.roundRect(x - 12, y - 70, ws[i] + 24, 92, 18); g.fill(); }
        g.fillStyle = cur ? BG : said || first ? CREAM : 'rgba(244,237,224,.3)';
        g.fillText(w.w, x, y); x += ws[i] + gap;
      });
    });
    g.restore();
  }

  /* ---------- the picture ---------- */
  var NOISE, SCENES = [hookScene, tokenScene, sealedScene, headScene, berryScene, fixScene, thinkScene, nameScene, blueScene, endScene];
  function stage(g) {
    g.fillStyle = BG; g.fillRect(0, 0, W, H);
    var vg = g.createRadialGradient(540, 1000, 200, 540, 1000, 1300); vg.addColorStop(0, 'rgba(70,40,60,.30)'); vg.addColorStop(1, 'rgba(0,0,0,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    stage(g);
    drift(g, t, 1);
    var si = sceneAt(t), S = SC[si];
    /* scene changes are the token knife: a coral cut sweeps across and the old scene falls away behind it */
    var sel = si + 1 < SC.length && !SC[si + 1].join ? seg(t, S.t1 - .3, S.t1 - .02) : 0;
    var inK = si > 0 && !S.join ? eo(seg(t, S.t0, S.t0 + .35)) : 1;
    g.save();
    var push = 1 + .03 * seg(t, S.t0, S.t1), cy = 1000;
    if (S.join) push = lerp(1.03, push, eio(seg(t, S.t0, S.t0 + .8)));
    g.translate(540, cy); g.scale(push * lerp(.94, 1, inK), push * lerp(.94, 1, inK)); g.translate(-540, -cy);
    SCENES[si](g, t);
    g.restore();
    if (sel > 0) {
      var x1 = lerp(-60, 1140, eio(sel)), sk = 120;
      g.save(); g.beginPath(); g.moveTo(0, 470); g.lineTo(x1 + sk, 470); g.lineTo(x1 - sk, 1530); g.lineTo(0, 1530); g.closePath(); g.clip(); stage(g); drift(g, t, 1); g.restore();
      g.save(); g.strokeStyle = HOT; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1 + sk, 470); g.lineTo(x1 - sk, 1530); g.stroke(); g.restore();
    }
    /* the loop: the end dissolves back into frame 0 */
    var back = eio(seg(t, HOME, HOME + .5));
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
    g.save(); font(g, 74, 800); try { g.fontStretch = 'expanded'; } catch (e) {} g.textBaseline = 'alphabetic';
    g.textAlign = 'center'; g.fillStyle = CREAM; g.fillText("Why AI can't count", 540, 330);
    var a = "the r's in ", b = 'strawberry', wa = g.measureText(a).width, wb = g.measureText(b).width, x = 540 - (wa + wb) / 2;
    g.textAlign = 'left'; g.fillText(a, x, 424); g.fillStyle = HOT; g.beginPath(); g.roundRect(x + wa - 12, 424 - 64, wb + 24, 86, 18); g.fill();
    g.fillStyle = BG; g.fillText(b, x + wa, 424); g.restore();
  }
  function TEXTS(t) {
    var out = [];
    STAMPS.forEach(function (s, i) { if (t >= s[1] + .2 && t < s[2]) out.push({ id: 'stamp' + i, text: s[0], x0: 0, y0: 0, x1: 0, y1: 0 }); });
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [];
  function initTimes() {
    STAMPS.push(
      ['STILL 2', at('sure', 'two') + .05, at('sure', 'two') + 2.6, 76, BAD, -.08, 705, 1350],
      ['1 + 2 = 2', at('berry', 'two', 1) + .1, at('berry', 'two', 1) + 2.9, 72, BAD, -.07, 520, 1280],
      ["3 R's ✓", at('plain', 'three') + .3, at('plain', 'three') + 2.55, 76, MINT, -.07, 520, 1300],
      ["IT'S 2", at('blue', 'bs') + .1, at('blue', 'bs') + 2.4, 76, SKY, -.08, 520, 1290]
    );
    /* hook */
    [0, 1, 2].forEach(function (ri) { EV.push({ t: at('hook', 'strawberry') + .05 + ri * .2, type: 'blip', f: 700 + ri * 220 }); });
    var used = at('hook', 'used'), two = at('hook', 'two');
    var i;
    EV.push({ t: two + .14, type: 'stamp', big: true }, { t: 1.5, type: 'pop', g: .5 });
    EV.push({ t: at('sure', 'asked') - .1, type: 'pop' }, { t: at('sure', 'two') + .2, type: 'stamp', big: true });
    EV.push({ t: end('sure') + .1, type: 'tick', g: .14 }, { t: end('sure') + .3, type: 'tick', g: .1 });   // the stamp settles; keeps its decay off silence
    EV.push({ t: start('why'), type: 'swish' }, { t: at('why', 'letter'), type: 'boop' });
    /* tokens */
    for (i = 0; i < 14; i++) EV.push({ t: at('tokens', 'letters') + i * .03, type: 'tick', g: .12 });
    Q.forEach(function (q, i) { if (i > 0 && q[0] !== '?' && i !== 6) EV.push({ t: at('tokens', 'tokens') + i * .05, type: 'slice' }); });
    EV.push({ t: at('single', 'strawberry') + .1, type: 'swish' }, { t: at('single', 'single') + .12, type: 'snap' });
    Q.forEach(function (q, i) { var tt = i === 6 ? at('number', 'number') : at('number', 'model') + i * .07; EV.push({ t: tt + .1, type: i === 6 ? 'flipbig' : 'flip', g: i === 6 ? 1 : .5 }); });
    EV.push({ t: wend('number', 'number') + .02, type: 'liftS' }, { t: at('number', 'number') + .62, type: 'thump', g: .6 }, { t: at('number', 'number') + .62, type: 'ding1' });
    /* sealed */
    PROBES.forEach(function (p) { EV.push({ t: at(p[1], p[2]) - .12, type: 'whoosh' }, { t: at(p[1], p[2]) + .22, type: 'bonk' }); });
    EV.push({ t: at('nothing', 'nothing'), type: 'boop' }, { t: at('knows', 'twist') - .05, type: 'twist' });
    for (i = 0; i < 10; i++) EV.push({ t: lerp(at('knows', 'knows') + .1, at('knows', 'spelled') + .45, i / 9), type: 'scratch' });
    /* head */
    for (i = 0; i < 10; i++) if (i !== 8) { var ct = reelCross(i); if (ct < 1e8) EV.push({ t: ct, type: 'tick', g: i === 7 ? .2 : .03 }); }
    EV.push({ t: at('slip', 'repeated') + .02, type: 'snap', g: .5 }, { t: at('slip', 'slip'), type: 'buzz' });
    /* berry */
    EV.push({ t: at('berry', 'straw') - .1, type: 'pop' }, { t: at('berry', 'one'), type: 'ding1' }, { t: at('berry', 'berry') - .1, type: 'pop' }, { t: at('berry', 'two'), type: 'ding1', f: 1 });
    EV.push({ t: at('berry', 'total') - .1, type: 'boop' }, { t: at('berry', 'two', 1) + .08, type: 'thump', g: .35 }, { t: wend('berry', 'two', 1) + .02, type: 'stamp', big: true });
    /* the fix */
    EV.push({ t: at('watch', 'watch') - .1, type: 'rise', t1: at('watch', 'fix') - .15 });
    EV.push({ t: wend('watch', 'fix') - .02, type: 'crack' }, { t: at('watch', 'spell') + .12, type: 'shatter' });
    for (i = 0; i < 10; i++) EV.push({ t: lerp(at('watch', 'spell') + .2, wend('watch', 'spaces'), i / 9), type: 'blip', f: 600 + i * 70 });
    for (i = 0; i < 10; i++) EV.push({ t: at('plain', 'token') - .15 + i * .07, type: 'tick', g: .25 });
    [0, .12, .24].forEach(function (d, j) { EV.push({ t: at('plain', 'three') + d, type: 'blip', f: 1000 + j * 260 }); });
    EV.push({ t: at('plain', 'three') + .32, type: 'stamp', big: true }, { t: wend('plain', 'sight') + .05, type: 'ding' });
    /* think (spell first, or run code) */
    var fe = wend('think', 'first');
    for (i = 0; i < 10; i++) EV.push({ t: lerp(at('think', 'spell') - .05, fe, i / 9), type: 'key', f: hash(i + 50), g: .45 });
    [0, 1, 2].forEach(function (ri) { EV.push({ t: lerp(fe + .02, fe + .36, ri / 2), type: 'blip', f: 900 + ri * 200, g: .06 }); });
    EV.push({ t: fe + .45, type: 'ding1', f: 1 }, { t: at('think', 'thinking'), type: 'tick', g: .3 });
    var run = at('think', 'run'), ce = wend('think', 'code') + .05;
    for (i = 0; i < 10; i++) EV.push({ t: run + (ce - run) * i / 10, type: 'key', f: hash(i + 80), g: .4 });
    EV.push({ t: wend('think', 'code') + .12, type: 'ding' });
    /* codename + today */
    EV.push({ t: SC[7].t0 + .05, type: 'paper' }, { t: at('codename', 'codenamed') + .15, type: 'stamp' }, { t: at('codename', 'strawberry'), type: 'tick', g: .4 });
    for (i = 0; i < 3; i++) EV.push({ t: SC[7].t0 + .15 + i * .2, type: 'key', f: hash(i + 90), g: .35 });
    EV.push({ t: at('today', '2025') - .05, type: 'pop' }, { t: wend('today', 'right') + .02, type: 'ding' }, { t: wend('today', 'gone') + .02, type: 'buzz' });
    /* blue */
    EV.push({ t: SC[8].t0 + .1, type: 'pop' }, { t: at('blue', 'gpt5') - .1, type: 'tick', g: .3 });   // no thump on "three": it masked the B of "b's"
    EV.push({ t: wend('blue', 'bs') + .02, type: 'blip', f: 800 }, { t: wend('blue', 'bs') + .2, type: 'blip', f: 1000 }, { t: wend('blue', 'bs') + .3, type: 'stamp' });
    EV.push({ t: at('same', 'same') - .15, type: 'whoosh' }, { t: at('same', 'blindness') - .05, type: 'seal', t1: at('same', 'blindness') + .45 });
    /* end */
    [0, 1, 2].forEach(function (ci) { EV.push({ t: at('end', 'count') + ci * .12, type: 'blip', f: 1000 + ci * 200 }); });
    EV.push({ t: at('end', 'see') - .15, type: 'seal', t1: at('end', 'see') + .45 }, { t: wend('end', 'counting') + .05, type: 'thump' });
    ['slip', 'same'].forEach(function (id) { EV.push({ t: end(id) + .1, type: 'tick', g: .14 }, { t: end(id) + .3, type: 'tick', g: .1 }); });   // settle ticks: keep these gaps off digital silence
    SC.forEach(function (s, i) { if (i && !s.join) EV.push({ t: s.t0 - .3, type: 'select' }); });
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
    var verb = ac.createConvolver(), irl = Math.floor(sr * 1.3), ir = ac.createBuffer(2, irl, sr);
    for (var ch = 0; ch < 2; ch++) { var d = ir.getChannelData(ch); for (var i = 0; i < irl; i++) d[i] = (rnd() * 2 - 1) * Math.pow(1 - i / irl, 4); }
    verb.buffer = ir; var vret = ac.createGain(); vret.gain.value = .18; verb.connect(vret); vret.connect(master);
    var nb = ac.createBuffer(1, sr * 3, sr), nd = nb.getChannelData(0); for (i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
    function bus(g, send, pan) { var o = ac.createGain(); o.gain.value = g; var p = ac.createStereoPanner(); p.pan.value = pan || 0; o.connect(p); p.connect(master); if (send) { var s = ac.createGain(); s.gain.value = send; p.connect(s); s.connect(verb); } return o; }
    function env(pm, pts) { pm.setValueAtTime(pts[0][1], Math.max(0, pts[0][0])); for (var k = 1; k < pts.length; k++) pm.linearRampToValueAtTime(pts[k][1], Math.max(0, pts[k][0])); }
    function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function noise(t0, dur) { var s = ac.createBufferSource(); s.buffer = nb; s.loop = true; s.start(Math.max(0, t0), rnd() * 2, dur); return s; }
    function osc(type, f, t0, t1, g, pts, send, pan) { var o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, Math.max(0, t0)); o.connect(og); og.connect(bus(1, send || 0, pan)); env(og.gain, pts); o.start(Math.max(0, t0)); o.stop(Math.max(0, t1)); return o; }

    function key(t, f, g) { var o = bus(1, .05, (f - .5) * .6), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400 + f * 1800; bp.Q.value = 3; var n = noise(t, .04); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, (g || 1) * .3], [t + .03, 0]]); osc('sine', 180 + f * 60, t, t + .05, 1, [[t, 0], [t + .002, (g || 1) * .12], [t + .04, 0]]); }
    function tickS(t, g) { var o = bus(1, .05), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 6; var n = noise(t, .03); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .001, g || .22], [t + .025, 0]]); }
    function blip(t, f, g) { var o = osc('sine', f, t, t + .12, 1, [[t, 0], [t + .004, g || .09], [t + .1, 0]], .3, clamp((f - 1100) / 1400, -1, 1)); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + .07); }
    function boop(t) { var o = osc('triangle', 520, t, t + .25, 1, [[t, 0], [t + .01, .14], [t + .22, 0]], .3); o.frequency.exponentialRampToValueAtTime(260, t + .2); }
    function ding(t) { [76, 83, 88].forEach(function (m, j) { osc('sine', mtof(m), t + j * .04, t + 1.2, 1, [[t + j * .04, 0], [t + j * .04 + .005, .09], [t + 1.1, 0]], .5, (j - 1) * .4); }); }
    function ding1(t, hi) { osc('sine', mtof(hi ? 81 : 76), t, t + .7, 1, [[t, 0], [t + .005, .08], [t + .6, 0]], .4); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, 1, [[t, 0], [t + .004, g || .4], [t + .26, 0]], .1); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t - .12, t + .14, 900, 5200, .14, .02, 1.6); }
    function whoosh(t) { band(t - .05, t + .3, 600, 2600, .12, .03, 1.2); }
    function slice(t) { band(t - .1, t + .02, 3000, 9000, .1, .2, 2.5); tickS(t + .02, .3); }
    function stampS(t, big) { thump(t, big ? .7 : .5); var n = noise(t, .2), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1800; var o = bus(1, .25); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .5 : .35], [t + .15, 0]]); }
    function buzz(t) { osc('square', 110, t, t + .35, 1, [[t, 0], [t + .01, .05], [t + .3, .05], [t + .34, 0]], .05); osc('square', 116, t, t + .35, 1, [[t, 0], [t + .01, .04], [t + .3, .04], [t + .34, 0]], .05); }
    function paper(t) { band(t - .03, t + .12, 1800, 3800, .07, .02, 1.2, (rnd() - .5) * .8); }
    function flip(t, big, g) { g = g || 1; band(t, t + .16, 2000, 5000, (big ? .14 : .08) * g, .02, 2); tickS(t + .15, (big ? .35 : .2) * g); if (big) thump(t + .15, .35); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .16 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    /* a probe letter knocking on the sealed chip: a hollow glassy knock */
    function bonk(t) { var o = osc('sine', 240, t, t + .35, 1, [[t, 0], [t + .003, .32], [t + .3, 0]], .25); o.frequency.exponentialRampToValueAtTime(120, t + .2); osc('sine', 1650, t, t + .25, 1, [[t, 0], [t + .002, .05], [t + .22, 0]], .4); tickS(t, .35); }
    function twist(t) { band(t, t + .55, 500, 3000, .1, .04, 2.2); }
    function scratch(t) { band(t, t + .09, 2500, 4200, .05, .03, 3, (rnd() - .5) * .6); }
    function snap(t) { thump(t, .45); tickS(t, .45); tickS(t + .03, .25); }
    function crack(t) { for (var j = 0; j < 7; j++) { var tj = t + j * .035 + rnd() * .02; tickS(tj, .5 - j * .05); } band(t, t + .3, 5000, 2500, .12, .05, 1.5); thump(t, .3); }
    function shatter(t) { for (var j = 0; j < 12; j++) { var tj = t + rnd() * .35; blip(tj, 2400 + rnd() * 2600, .035); tickS(tj, .2); } band(t, t + .5, 7000, 1500, .14, .02, .8); thump(t, .5); }
    function seal(t, t1) { band(t, t1, 4000, 400, .1, .12, 1.4); thump(t1, .5); tickS(t1, .35); }
    function rise(t, t1) { band(t, t1, 300, 1400, .02, .04, 3); }
    function rewind(t, t1) { band(t, t1, 3800, 900, .06, .08, 5); for (var j = 0; j < 6; j++) tickS(lerp(t, t1, j / 6), .15); }
    EV.forEach(function (e) {
      if (e.type === 'key') key(e.t, e.f == null ? .5 : e.f, e.g);
      else if (e.type === 'tick') tickS(e.t, e.g);
      else if (e.type === 'blip') blip(e.t, e.f, e.g);
      else if (e.type === 'boop') boop(e.t);
      else if (e.type === 'ding') ding(e.t);
      else if (e.type === 'ding1') ding1(e.t, e.f);
      else if (e.type === 'thump') thump(e.t, e.g);
      else if (e.type === 'swish') swish(e.t);
      else if (e.type === 'whoosh') whoosh(e.t);
      else if (e.type === 'slice') slice(e.t);
      else if (e.type === 'stamp') stampS(e.t, e.big);
      else if (e.type === 'buzz') buzz(e.t);
      else if (e.type === 'paper') paper(e.t);
      else if (e.type === 'flip') flip(e.t, false, e.g);
      else if (e.type === 'flipbig') flip(e.t, true);
      else if (e.type === 'pop') popS(e.t, e.g);
      else if (e.type === 'bonk') bonk(e.t);
      else if (e.type === 'twist') twist(e.t);
      else if (e.type === 'scratch') scratch(e.t);
      else if (e.type === 'snap') snap(e.t);
      else if (e.type === 'crack') crack(e.t);
      else if (e.type === 'shatter') shatter(e.t);
      else if (e.type === 'seal') seal(e.t, e.t1);
      else if (e.type === 'rise') rise(e.t, e.t1);
      else if (e.type === 'rewind') rewind(e.t, e.t1);
      else if (e.type === 'liftS') { band(e.t, e.t + .45, 400, 3200, .12, .04, 1.4); }
      else if (e.type === 'select') band(e.t, e.t + .28, 1200, 3000, .05, .07, 2);
    });
    /* no music: Isac adds a trending TikTok sound on the platform; the film ships voice + sound effects */
    var MUSIC = false;
    if (MUSIC) { /* intentionally empty: this film has no groove */ }
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
    var fonts = ['800 84px Archivo', '700 46px Archivo', '900 46px Archivo', '600 46px Archivo', '500 30px "Geist Mono"', 'italic 400 96px "Instrument Serif"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×−≈✓✗¾'); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  initTimes();
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: at('plain', 'three') + .9, SLUG: 'strawberry', SHOTS: SHOTS, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
