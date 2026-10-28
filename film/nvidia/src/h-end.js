
  /* scenes: each starts just before its first line; wipe = how it arrives; part = a chapter card slams in the pause before it */
  var SC = [
    { id: 'prompt', name: 'One question tonight', t0: 0, draw: sPrompt },
    { id: 'hall', name: 'A hall of chips', t0: start('o2') - .3, draw: sHall, wipe: 'iris' },
    { id: 'one', name: 'Almost all from one company', t0: start('o3') - .3, draw: sOne, wipe: 'slide' },
    { id: 'thesis', name: 'A gaming company', t0: start('o5') - .3, draw: sThesis, wipe: 'slide' },
    { id: 'scale', name: 'Forty-two million to five trillion', t0: start('o7') - .3, draw: sScale, wipe: 'slide' },
    { id: 'toilets', name: 'The kid who cleaned toilets', t0: start('o11') - .3, draw: sToilets, wipe: 'iris' },
    { id: 'grave', name: 'Graphics graveyard', t0: start('o12') - .3, draw: sGrave, wipe: 'slide' },
    { id: 'ask', name: 'Three questions', t0: start('o16') - .3, draw: sAsk, wipe: 'slide' },
    { id: 'tease', name: 'The pinboard', t0: start('o19') - .3, draw: sTease, wipe: 'slide' },
    { id: 'title', name: 'Title', t0: start('title') - .45, draw: sTitle, wipe: 'iris' },
    { id: 'plane', name: 'Taiwan to America, 1973', t0: start('b1') - .3, draw: sPlane, wipe: 'slide', part: 'THE BOOTH', q: 'Who starts a chip company in a diner?' },
    { id: 'school', name: 'The wrong school', t0: start('b2') - .3, draw: sSchool, wipe: 'slide' },
    { id: 'roommate', name: 'The roommate', t0: start('b4') - .3, draw: sRoommate, wipe: 'slide' },
    { id: 'dennysjob', name: "A job at Denny's", t0: start('b6') - .3, draw: sDennysJob, wipe: 'iris' },
    { id: 'valley', name: 'Silicon Valley', t0: start('b8') - .3, draw: sValley, wipe: 'slide' },
    { id: 'booth', name: 'The booth', t0: start('b9') - .3, draw: sBooth, wipe: 'iris' },
    { id: 'found', name: 'April 5, 1993', t0: start('b11') - .3, draw: sFound, wipe: 'slide' },
    { id: 'name', name: 'Next version, envy', t0: start('b12') - .3, draw: sName, wipe: 'slide' },
    { id: 'pitch', name: 'The worst pitch', t0: start('b15') - .3, draw: sPitch, wipe: 'slide' },
    { id: 'valentine', name: 'If you lose my money', t0: start('b16') - .3, draw: sValentine, wipe: 'iris' },
    { id: 'curves', name: 'Curves versus triangles', t0: start('d1') - .3, draw: sCurves, wipe: 'slide', part: 'THIRTY DAYS FROM DEAD', q: 'How close did it come to dying?' },
    { id: 'sega', name: 'Pay us anyway', t0: start('d3') - .3, draw: sSega, wipe: 'slide' },
    { id: 'allin', name: 'All in on RIVA 128', t0: start('d6') - .3, draw: sAllIn, wipe: 'slide' },
    { id: 'payroll', name: 'One month of payroll', t0: start('d7') - .3, draw: sPayroll, wipe: 'slide' },
    { id: 'motto', name: 'The motto', t0: start('d9') - .3, draw: sMotto, wipe: 'iris' },
    { id: 'ipo', name: 'Twelve dollars a share', t0: start('g1') - .3, draw: sIPO, wipe: 'slide', part: 'THE GPU', q: 'What is a GPU, actually?' },
    { id: 'geforce', name: "The world's first GPU", t0: start('g2') - .3, draw: sGeForce, wipe: 'slide' },
    { id: 'pixels', name: 'Two million pixels', t0: start('g3') - .3, draw: sPixels, wipe: 'iris' },
    { id: 'profs', name: 'A few brilliant professors', t0: start('g5') - .3, draw: sProfs, wipe: 'slide' },
    { id: 'stadium', name: 'A stadium full of kids', t0: start('g6') - .3, draw: sStadium, wipe: 'slide' },
    { id: 'xbox', name: '3dfx and the Xbox', t0: start('g8') - .3, draw: sXbox, wipe: 'slide' },
    { id: 'tattoo', name: 'The tattoo', t0: start('g10') - .3, draw: sTattoo, wipe: 'iris' },
    { id: 'buck', name: 'Ian Buck', t0: start('c1') - .3, draw: sBuck, wipe: 'slide', part: 'THE BET NOBODY WANTED', q: 'Why did Wall Street hate it?' },
    { id: 'cuda', name: 'CUDA', t0: start('c3') - .3, draw: sCuda, wipe: 'iris' },
    { id: 'wallst', name: 'Wall Street sees the bill', t0: start('c5') - .3, draw: sWallSt, wipe: 'slide' },
    { id: 'keep', name: 'Keep paying anyway', t0: start('c8') - .3, draw: sKeep, wipe: 'slide' },
    { id: 'house', name: "A student's parents' house", t0: start('a1') - .3, draw: sHouse, wipe: 'slide', part: 'TWO CARDS', q: 'Where did modern AI come from?' },
    { id: 'train', name: 'Two GTX 580s', t0: start('a3') - .3, draw: sTrain, wipe: 'slide' },
    { id: 'same', name: 'The same simple sums', t0: start('a5') - .3, draw: sSame, wipe: 'iris' },
    { id: 'luck', name: 'Just lucky?', t0: start('a6b') - .3, draw: sLuck, wipe: 'slide' },
    { id: 'dgx', name: 'The first DGX-1', t0: start('a7') - .3, draw: sDGX, wipe: 'slide' },
    { id: 'crypto', name: 'The crypto crash', t0: start('a10') - .3, draw: sCrypto, wipe: 'slide' },
    { id: 'chatgpt', name: 'ChatGPT', t0: start('r1') - .3, draw: sChatGPT, wipe: 'iris', part: 'THE GOLD RUSH', q: 'What happened after ChatGPT?' },
    { id: 'rush', name: 'Sell shovels', t0: start('r3') - .3, draw: sRush, wipe: 'slide' },
    { id: 'h100', name: 'The H100', t0: start('r5') - .3, draw: sH100, wipe: 'slide' },
    { id: 'plaque', name: 'The plaque', t0: start('r6') - .3, draw: sPlaque, wipe: 'iris' },
    { id: 'podium', name: 'Number one', t0: start('r7') - .3, draw: sPodium, wipe: 'slide' },
    { id: 'deepseek', name: 'DeepSeek day', t0: start('r8') - .3, draw: sDeepSeek, wipe: 'slide' },
    { id: 'climb', name: 'Four, then five trillion', t0: start('r10') - .3, draw: sClimb, wipe: 'slide' },
    { id: 'now', name: 'October 2026', t0: start('n1') - .3, draw: sNow, wipe: 'iris', part: 'RIGHT NOW', q: 'Where is it this month?' },
    { id: 'rubin', name: 'Vera Rubin', t0: start('n4') - .3, draw: sRubin, wipe: 'slide' },
    { id: 'wobble', name: 'Not a straight line', t0: start('n5') - .3, draw: sWobble, wipe: 'slide' },
    { id: 'share', name: 'That twelve-dollar share', t0: start('n7') - .3, draw: sShare, wipe: 'slide' },
    { id: 'jensen', name: 'Still the CEO', t0: start('n8') - .3, draw: sJensen, wipe: 'iris' },
    { id: 'split', name: 'Why it matters', t0: start('e1') - .3, draw: sSplit, wipe: 'slide' },
    { id: 'rivals', name: 'Knock it off the top', t0: start('e4') - .3, draw: sRivals, wipe: 'slide' },
    { id: 'diner', name: 'Same diner, tonight', t0: start('e5') - .3, draw: sDiner, wipe: 'iris' },
    { id: 'card', name: 'Watch next', t0: start('e7') - .3, draw: sCard, wipe: 'slide' }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  /* the part cards land in the pause before each part's first line */
  var PARTS = [];
  SC.forEach(function (s, i) { if (s.part) { var prev = VO.lines[VO.lines.indexOf(LINE[firstLine(s)]) - 1]; PARTS.push({ t: prev.t1 + 1.3, n: PARTS.length + 1, text: s.part, q: s.q, scene: s }); } });
  function firstLine(s) { for (var i = 0; i < VO.lines.length; i++) if (VO.lines[i].t0 >= s.t0) return VO.lines[i].id; }
  /* YouTube chapters (each ≥ 10 s, first at 0:00) */
  var CHAPTERS = [['A gaming company runs AI', 0]].concat(PARTS.map(function (p) { return [(p.text.charAt(0) + p.text.slice(1).toLowerCase()).replace(/\bgpu\b/, 'GPU'), Math.max(0, p.t - .1)]; })).concat([['Why it matters', S('split').t0]]);

  /* ---------- part cards: slam in big, then park top-left as a label for the part ---------- */
  function partCards(g, t) {
    for (var i = 0; i < PARTS.length; i++) {
      var c = PARTS[i], nx = i + 1 < PARTS.length ? PARTS[i + 1].t : S('split').t0;
      if (t < c.t || t > nx) continue;
      /* the finished quote holds 1.3 s clear, then the card slams in, holds 2.4 s, and parks */
      var u = t - c.t, k = eio(seg(u, 2.4, 2.85));
      font(g, 120, 900, DISP, true); var tw0 = g.measureText(c.text).width, tpx = Math.min(120, 120 * 1300 / tw0), tw = tw0 * tpx / 120, cw = Math.max(tw + 160, 1000), ch = 380;
      var s = lerp(1, .26, k), px = lerp(W / 2, 24 + cw * s / 2, k), py = lerp(H / 2, 22 + ch * s / 2, k);
      if (k < 1) { g.fillStyle = 'rgba(14,10,28,' + (.9 * (1 - k) * clamp(u * 6, 0, 1)) + ')'; g.fillRect(0, 0, W, H); }
      var sl = pop(t, c.t, 2.8, .5), sc = s * lerp(1.6, 1, clamp(sl, 0, 1));
      g.save(); g.translate(px, py); g.scale(sc, sc); g.rotate(lerp(-.04, -.015, k) + knock(t, c.t + .1, 30, 9) * .05);
      g.globalAlpha = clamp(sl * 3, 0, 1) * (t > nx - .3 ? 1 - seg(t, nx - .3, nx) : 1) * (k >= 1 ? .92 : 1);
      rr(g, -cw / 2 + 16, -ch / 2 + 20, cw, ch, 26); g.fillStyle = 'rgba(8,6,18,.5)'; g.fill();
      rr(g, -cw / 2, -ch / 2, cw, ch, 26); fillStroke(g, YEL, 10);
      g.fillStyle = INK; g.fillRect(-cw / 2, -ch / 2 + 20, 16, ch - 40);
      txt(g, 'PART ' + c.n + ' OF 7', 0, -110, 52, INK, { fam: MONO, wt: 700, ls: 6 });
      txt(g, c.text, 0, 14, tpx, INK, { wt: 900, wide: true });
      if (c.q) txt(g, c.q, 0, 122, 46, INK, { wt: 800, a: (1 - k) * seg(u, .5, .8) });
      g.restore();
    }
  }

  /* ---------- captions: one card per phrase, stressed words in yellow ---------- */
  var EMPH = /\d|^(nvidia|gaming|games|ai|gpu|cpu|cuda|denny's|toilets|toilet|thirty|dead|stadium|kids|professors|triangles|curves|trillion|billion|million|shovels|lucky|crypto|chatgpt|openai|record|biggest|first|everything|anyway|kill|harder|twelve|remember)\b/i;
  function captions(g, t) {
    if (!LIVE.text) return;
    var caps = VO.captions || [], c = null;
    for (var i = 0; i < caps.length; i++) if (t >= caps[i].t0 && t < caps[i].t1) { c = caps[i]; break; }
    if (!c || S('title').t0 < t && t < S('title').t1) return;
    var a = clamp((t - c.t0) / .08, 0, 1) * clamp((c.t1 - t) / .08, 0, 1);
    font(g, 50, 800); var words = c.words.map(function (w) { return w.w; }), sp = g.measureText(' ').width;
    var ws = words.map(function (w) { return g.measureText(w).width; }), tw = ws.reduce(function (s, v) { return s + v; }, 0) + sp * (words.length - 1);
    var y = 996, x = W / 2 - tw / 2;
    g.save(); g.globalAlpha = a;
    rr(g, W / 2 - tw / 2 - 30, y - 42, tw + 60, 84, 22); g.fillStyle = 'rgba(16,12,30,.82)'; g.fill();
    g.textAlign = 'left'; g.textBaseline = 'middle';
    words.forEach(function (w, i) {
      var said = t >= c.words[i].t0 - .02, hot = EMPH.test(w.replace(/[^\w'%]/g, ''));
      g.fillStyle = hot ? YEL : said ? CREAM : 'rgba(244,237,224,.55)'; g.fillText(w, x, y + 3); x += ws[i] + sp;
    });
    g.restore();
  }

  /* ---------- transitions ---------- */
  function wipe(g, t, s, prev) {
    var k = eio(seg(t, s.t0 - .02, s.t0 + .42));
    if (k >= 1 || s.wipe === 'none' || !prev) { s.draw(g, t, s); return; }
    prev.draw(g, t, prev);
    g.save(); g.beginPath();
    if (s.wipe === 'iris') { circ(g, W / 2, H / 2, k * 1150); }
    else { var x = -200 + k * (W + 400); g.moveTo(-10, -10); g.lineTo(x + 120, -10); g.lineTo(x - 120, H + 10); g.lineTo(-10, H + 10); g.closePath(); }
    g.clip(); s.draw(g, t, s); g.restore();
    g.save();
    if (s.wipe === 'iris') { circ(g, W / 2, H / 2, k * 1150); g.lineWidth = 26; g.strokeStyle = INK; g.stroke(); g.lineWidth = 8; g.strokeStyle = YEL; g.stroke(); }
    else { x = -200 + k * (W + 400); g.beginPath(); g.moveTo(x + 120, -10); g.lineTo(x - 120, H + 10); g.lineWidth = 34; g.strokeStyle = INK; g.stroke(); g.lineWidth = 10; g.strokeStyle = YEL; g.stroke(); }
    g.restore();
  }

  /* YouTube thumbnail (1920×1080, saved at 1280×720): Jensen and a grinning chip, "$5 TRILLION / FROM A DENNY'S" */
  function thumb(g) {
    var t = 2.2; g.setTransform(1, 0, 0, 1, 0, 0);
    wall(g, '#132108', '#070c03'); grid(g, 120, 'rgba(182,240,90,.08)');
    glow(g, 1530, 520, 600, 'rgba(118,185,0,.6)', 1);
    chipD(g, 1530, 500, 1.7, t, { face: 'grin', glow: 1, label: 'GPU' });
    guy(g, 1140, 1200, 1.6, { lh: [-60, -150], rh: [170, -290], lf: [-26, 0], rf: [26, 0], hip: 0, lean: -.05, tilt: 0, look: [.6, -.2], eyes: 'dot', brow: 1, mouth: 'smirk', jump: 0, front: 0 }, JEN, t);
    function slab(s, x, y, px, bg, fg, rot) { g.save(); g.translate(x, y); g.rotate(rot); font(g, px, 900, DISP, true); var w = g.measureText(s).width + px * .6; rr(g, -w / 2, -px * .72, w, px * 1.44, 26); fillStroke(g, bg, 14); txt(g, s, 0, px * .06, px, fg, { wt: 900, wide: true, outline: fg === '#fff' ? px * .1 : 0 }); g.restore(); }
    slab('$5 TRILLION', 560, 260, 120, NV, '#fff', -.05);
    g.save(); g.translate(560, 480); g.rotate(-.03); txt(g, 'FROM A', 0, 0, 100, CREAM, { wt: 900, wide: true, outline: 20 }); g.restore();
    slab("DENNY'S", 560, 690, 130, YEL, RED, -.04);
    vignette(g, .35);
  }

  /* ---------- frame ---------- */
  function sceneAt(t) { for (var i = SC.length - 1; i >= 0; i--) if (t >= SC[i].t0) return i; return 0; }
  function frame(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = NIGHT; g.fillRect(0, 0, W, H);
    var i = sceneAt(t), s = SC[i];
    g.save(); wipe(g, t, s, i > 0 ? SC[i - 1] : null); g.restore();
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
    partCards(g, t);
    captions(g, t);
    if (t > DUR - .5) { g.fillStyle = 'rgba(0,0,0,' + seg(t, DUR - .5, DUR) + ')'; g.fillRect(0, 0, W, H); }
    if (LIVE.grain && NOISE) { g.save(); g.globalAlpha = .045; g.globalCompositeOperation = 'overlay'; var ox = Math.floor(hash(Math.floor(t * 24)) * 256), oy = Math.floor(hash(Math.floor(t * 24) + 1) * 256); g.translate(-ox, -oy); g.fillStyle = g.createPattern(NOISE, 'repeat'); g.fillRect(0, 0, W + 256, H + 256); g.restore(); }
  }
  function TEXTS(t) {
    var out = [];
    /* the card slams in for 1.7 s, then stays on screen as the parked top-left label until the next part */
    PARTS.forEach(function (c, i) { var nx = i + 1 < PARTS.length ? PARTS[i + 1].t : S('split').t0; if (t >= c.t && t < nx) out.push({ id: 'part' + i, text: 'PART ' + c.n + ' ' + c.text }); });
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [];
  function E(t, type, o) { EV.push(Object.assign({ t: t, type: type }, o || {})); }
  function words(id, list, type, o, off) { list.forEach(function (w) { E(at(id, w) + (off || -.08), type, o); }); }
  function initTimes() {
    var i;
    /* cold open */
    E(at('o1', 'type') + .1, 'receipt', { t1: at('o1', 'tonight') + .1 }); E(start('o2') - .1, 'zip', { t1: start('o2') + .8 });
    E(start('o2'), 'hum', { t1: start('o3') - .3 }); for (i = 0; i < 10; i++) E(start('o2') + .4 + i * .3, 'blip', { f: 900 + i * 80, g: .05 });
    E(start('o3') + .2, 'pop', { g: .7 }); E(at('o4', 'dennys') - .1, 'stamp', { small: true }); E(at('o4', 'games.') - .1, 'pop', { g: .8 });
    E(start('o5') - .1, 'paper'); E(start('o6') - .2, 'stamp'); words('o6', ['gaming', 'math', 'ai.'], 'paper', { g: 1.2 }, -.08);
    E(start('o7') - .1, 'boing'); E(start('o8') - .1, 'register'); E(start('o9') - .1, 'clocktick', { t1: end('o9') }); E(start('o10') - .1, 'stamp', { big: true });
    E(start('o11') - .2, 'whoosh'); E(start('o11') + .3, 'flies', { t1: end('o11') });
    E(start('o12') - .2, 'powerdown'); E(start('o13') - .1, 'thump', { g: .5 }); E(start('o14') - .1, 'register'); E(start('o15') - .1, 'stamp');
    words('o16', ['games'], 'paper', { g: 1.4 }, -.25); E(start('o17') - .2, 'paper'); E(start('o18') - .2, 'paper');
    E(start('o19') - .2, 'paper', { g: 1.3 }); E(start('o20') - .1, 'pop', { g: .7 }); E(start('o20') + .6, 'pop', { g: .7 }); E(start('o20') + 1.2, 'pop', { g: .7 });
    /* title */
    ['the', 'whole', 'history', 'of'].forEach(function (w) { E(at('title', w) - .06, 'tick', { g: .25 }); }); E(at('title', 'nvidia.') - .06, 'stamp', { big: true });
    PARTS.forEach(function (c) { E(c.t - .02, 'slam'); E(c.t + 2.4, 'swish'); });
    /* part 1 */
    E(start('b1'), 'engine', { t1: end('b1') }); E(start('b2') + .2, 'paper'); E(start('b3'), 'rushw', { t1: end('b3') - .3 });
    E(start('b4') + .2, 'pop', { g: .6 }); E(start('b5') + .3, 'thump', { g: .4 }); E(start('b6') + .2, 'clunk'); E(start('b7') - .1, 'paper');
    E(start('b8') - .2, 'whoosh'); E(start('b9'), 'clocktick', { t1: end('b10') }); E(at('b9', 'dennys') - .1, 'ding1');
    E(start('b11') - .1, 'flip'); E(start('b11') + 1.2, 'register'); E(start('b12') + .3, 'paper'); E(start('b13') + .5, 'buzzbad'); E(start('b14') + .2, 'ding');
    E(start('b15') - .1, 'gulp'); E(start('b16'), 'paper'); E(start('b17') - .1, 'stamp', { big: true });
    /* part 2 */
    E(start('d1') + .3, 'pop', { g: .7 }); E(at('d2', 'triangles.') - .1, 'pop', { g: .8 }); E(at('d2', 'dead.') - .1, 'buzzbad');
    E(start('d3') + .2, 'pop', { g: .6 }); E(at('d4', 'wild.') - .1, 'stamp', { small: true }); E(at('d5', 'yes.'), 'ding'); E(at('d5', '5') - .1, 'register'); E(at('d5', 'six') - .1, 'clocktick', { t1: end('d5') });
    E(at('d6', 'half') - .1, 'fall', { t1: at('d6', 'half') + 1.2 }); E(at('d6', 'everything') - .1, 'receipt', { t1: at('d6', 'everything') + .8 }); E(at('d6', 'riva'), 'ding1');
    E(start('d7'), 'engine', { t1: end('d8') }); E(at('d7', 'month') - .1, 'stamp', { small: true }); E(at('d8', 'million') - .1, 'rise', { t1: at('d8', 'four') + .4 }); E(at('d8', 'four') + .4, 'ding');
    E(start('d10') - .1, 'clocktick', { t1: end('d10') + .5 }); E(at('d10', 'thirty') - .1, 'thump', { g: .5 });
    /* part 3 */
    E(at('g1', '12') - .1, 'register'); E(at('g1', 'remember') - .1, 'paper'); E(at('g2', 'geforce') - .2, 'whoosh'); E(at('g2', 'first') - .1, 'stamp', { big: true });
    E(start('g3') - .1, 'pop', { g: .7 }); E(at('g4', 'two') - .2, 'zip', { t1: at('g4', 'two') + .8 }); E(at('g4', 'sixty') - .1, 'blip', { f: 1300, g: .1 });
    E(at('g5', 'professors.') - .1, 'paper'); E(at('g5', 'one') - .1, 'clocktick', { t1: end('g5') });
    E(at('g6', 'stadium') - .2, 'rushw', { t1: end('g6') }); E(at('g6', 'same') - .1, 'shimmer', { t1: end('g6') + .3 }); E(at('g6b', 'red') - .1, 'pop', { g: .6 }); E(at('g6b', 'darkens') - .1, 'pop', { g: .6 }); E(at('g6b', 'done.') - .1, 'ding');
    E(at('g7', 'wins.') - .1, 'stamp', { big: true });
    E(at('g8', 'remains') - .1, 'clunk'); E(at('g9', 'xbox,') - .1, 'whoosh'); E(at('g9', '200') - .1, 'register'); E(at('g10', '100') - .1, 'ding1'); E(at('g10', 'tattooed') - .1, 'zip', { t1: at('g10', 'tattooed') + 1.0 });
    /* part 4 */
    E(at('c1', 'wiring') - .1, 'clunk'); E(at('c2', 'language') - .1, 'receipt', { t1: at('c2', 'hires') - .3 }); E(at('c2', 'hires') + .1, 'stamp', { small: true });
    E(at('c3', 'cuda.') - .1, 'stamp', { big: true }); words('c3', ['weather,', 'medicine,', 'physics.'], 'pop', { g: .7 }, -.15);
    E(start('c4') - .1, 'whoosh'); E(at('c4b', 'find') - .1, 'ding1');
    E(at('c5', 'bill,') - .1, 'receipt', { t1: at('c5', 'bill,') + .6 }); E(at('c6', 'faulty') - .1, 'glitch', { t1: at('c6', 'faulty') + .6 }); E(at('c6', '31') - .1, 'fall', { t1: at('c6', '31') + 1.0 }); E(at('c6', '31') + .1, 'stamp');
    E(at('c7', 'three') - .1, 'powerdown'); E(at('c8', 'remember') - .1, 'paper'); E(at('c8', 'keeps') - .1, 'register'); words('c9', ['market', 'yet.'], 'paper', { g: 1.2 }, -.08);
    /* part 5 */
    E(start('a1'), 'clocktick', { t1: at('a1', 'house.') }); E(at('a2', 'pictures.') - .2, 'paper', { g: 1.3 });
    E(at('a3', 'two') - .2, 'hum', { t1: start('a4') - .2 }); E(at('a3', 'week.') - .1, 'flip'); E(at('a4', '15') - .2, 'rise', { t1: at('a4', '15') + .3 }); E(at('a4', '26') - .2, 'rise', { t1: at('a4', '26') + .3 }); E(at('a4', 'mile:'), 'stamp', { big: true });
    E(at('a5', 'millions') - .2, 'rushw', { t1: end('a5') + .2 }); words('a6', ['games.', 'ai.'], 'paper', { g: 1.2 }, -.08);
    E(at('a6b', 'partly') - .05, 'stamp', { small: true }); E(at('a6b', 'standing') - .7, 'engine', { t1: at('a6b', 'standing') + .5 }); E(at('a6b', 'standing') + .4, 'ding');
    E(at('a7', 'all') - .1, 'whoosh'); E(at('a7', 'openai.') - .1, 'dingdong'); E(at('a8', 'future') - .2, 'receipt', { t1: end('a8') }); E(at('a9', 'ilya') - .1, 'ding1'); E(at('a9', 'students') - .1, 'paper');
    E(at('a10', 'miners') - .1, 'clunk'); E(at('a10', 'crashes') - .1, 'fall', { t1: at('a10', 'crashes') + .8 }); E(at('a10', 'crashes') + .7, 'thump', { g: .6 }); E(at('a11', 'fine') - .05, 'stamp');
    /* part 6 */
    E(at('r1', 'chatgpt.') - .1, 'ding1', { f: 1 }); E(at('r2', 'supercomputer') - .3, 'hum', { t1: end('r2') + .2 });
    E(at('r3', 'giant') - .6, 'rush', { t1: at('r3', 'one') + .6 }); words('r4', ['gold', 'shovels.'], 'paper', { g: 1.3 }, -.08); E(at('r4', 'shovels.') + .3, 'clunk');
    E(at('r5', 'h100,') - .2, 'shimmer', { t1: at('r5', 'tens') }); E(at('r5', 'tens') - .1, 'register'); for (i = 0; i < 6; i++) E(at('r5', 'wait') + i * .25, 'flip', { g: .5 });
    E(at('r6', 'trillion') - .1, 'register'); E(at('r6', 'plaque') - .1, 'clunk'); E(at('r7', 'passes') - .1, 'rise', { t1: at('r7', 'passes') + .8 }); E(at('r7', 'most') - .1, 'ding');
    E(at('r8', 'deepseek') - .1, 'pop', { g: .7 }); E(at('r8', 'loses') - .1, 'fall', { t1: at('r8', 'loses') + 1.2 }); E(at('r8', 'loses') + 1.1, 'boom'); E(start('r9') + .1, 'stamp', { big: true });
    E(start('r10'), 'rise', { t1: at('r10', '5') + .3 }); E(at('r10', '4') - .1, 'ding1'); E(at('r10', '5') - .1, 'ding'); E(at('r10', 'first'), 'stamp');
    /* part 7 */
    E(start('n1') + .1, 'flip'); E(at('n2', '96.2') - .3, 'receipt', { t1: at('n2', '96.2') + .6 }); E(at('n2', '96.2') + .6, 'register'); E(at('n2', '89') - .2, 'receipt', { t1: at('n2', '89') + .5 }); E(at('n3', 'nine') - .1, 'pop', { g: .8 }); E(at('n3', 'gaming') - .05, 'buzzbad');
    E(at('n4', 'vera') - .3, 'engine', { t1: end('n4') }); E(at('n4', '108') - .1, 'register'); E(at('n4', 'china.') - .05, 'stamp', { small: true });
    E(at('n5', 'record,') - .1, 'ding1'); for (i = 0; i < 8; i++) E(at('n5', 'eight') - .2 + i * .17, 'thump', { g: .25 }); E(start('n6') - .1, 'whoosh'); E(at('n6', '5.2') - .1, 'stamp', { big: true });
    E(at('n7', 'remember') - .1, 'paper'); for (i = 0; i < 6; i++) E(at('n7', 'splits,') - .6 + i * (at('n7', '480') - at('n7', 'splits,') + .7) / 6, 'flip', { g: .7 }); E(at('n7', '104') - .1, 'register');
    E(at('n8', 'jacket.') - .1, 'zip', { t1: at('n8', 'jacket.') + .5 }); E(at('n8b', 'toilets') - .1, 'flies', { t1: at('n8b', '200') }); E(at('n8b', '200') - .1, 'register'); words('n9', ['million', 'harder'], 'paper', { g: 1.3 }, -.08);
    /* ending */
    E(start('e1') - .1, 'gulp'); E(at('e2', 'cousins') - .2, 'shimmer', { t1: end('e2') }); E(at('e3', 'paid') - .2, 'receipt', { t1: end('e3') }); words('e3b', ['stadium', 'kept', 'standing'], 'paper', { g: 1.2 }, -.2);
    words('e4', ['google,', 'amazon', 'amd'], 'pop', { g: .7 }, -.2); E(at('e4', 'knock') - .05, 'thump', { g: .5 }); E(at('e4b', 'not') - .05, 'stamp', { g: .6 }); E(at('e4b', 'for') - .1, 'pop', { g: .5 });
    E(start('e5') - .2, 'projector', { t1: start('e6') - .3 }); E(at('e6', 'type') + .1, 'receipt', { t1: at('e6', 'type') + .9 }); E(at('e6', 'type') + .4, 'zip', { t1: at('e6', 'chips.') - .2 }); E(at('e6', 'chips.') - .1, 'ding');
    E(at('e7', 'cable') - .1, 'whoosh'); E(at('e7', 'cut') - .05, 'zap', { t1: at('e7', 'cut') + .4 }); E(at('e7', 'here.') - .1, 'ding'); E(at('e8', 'subscribe') - .1, 'click'); E(at('e8', 'which') - .1, 'pop', { g: .7 });
    SC.forEach(function (s, j) { if (j && s.wipe !== 'none') E(s.t0 - .05, 'swish'); });
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

  /* ---------- sound: foley cut to the word times; no music (Isac adds his own) ---------- */
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
    function blip(t, f, g) { var o = osc('sine', f, t, t + .12, 1, [[t, 0], [t + .004, g || .09], [t + .1, 0]], .3, clamp((f - 1100) / 1400, -1, 1)); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + .07); }
    function ding(t) { [76, 83, 88].forEach(function (m, j) { osc('sine', mtof(m), t + j * .04, t + 1.2, 1, [[t + j * .04, 0], [t + j * .04 + .005, .08], [t + 1.1, 0]], .5, (j - 1) * .4); }); }
    function ding1(t, hi) { osc('sine', mtof(hi ? 81 : 76), t, t + .7, 1, [[t, 0], [t + .005, .07], [t + .6, 0]], .4); }
    function thump(t, g) { var o = osc('sine', 150, t, t + .3, 1, [[t, 0], [t + .004, g || .4], [t + .26, 0]], .1); o.frequency.exponentialRampToValueAtTime(50, t + .18); }
    function band(t0, t1, f0, f1, g0, g1, q, pan) { var o = bus(1, .1, pan), bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q || .7; var n = noise(t0, t1 - t0 + .1); n.connect(bp); bp.connect(o); env(bp.frequency, [[t0, f0], [t1, f1]]); env(o.gain, [[t0, 0], [t0 + (t1 - t0) * .4, g0], [t1 - .02, g1], [t1, 0]]); }
    function swish(t) { band(t - .12, t + .14, 900, 5200, .1, .02, 1.6); }
    function whoosh(t) { band(t - .15, t + .35, 500, 3800, .12, .02, 1.2); }
    function stampS(t, big, small) { thump(t, big ? .65 : small ? .32 : .45); var n = noise(t, .16), bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 1500; var o = bus(1, .2); n.connect(bp); bp.connect(o); env(o.gain, [[t, 0], [t + .004, big ? .45 : small ? .2 : .32], [t + .12, 0]]); tickS(t + .005, .18); }
    function paper(t, g) { g = g || 1; band(t - .03, t + .12, 1800, 3800, .07 * g, .02, 1.2, (rnd() - .5) * .8); tickS(t + .1, .08 * g); }
    function flip(t, g) { g = g || 1; band(t, t + .12, 2000, 5000, .08 * g, .02, 2, -.3); tickS(t + .1, .15 * g); }
    function popS(t, g) { var o = osc('sine', 300, t, t + .12, 1, [[t, 0], [t + .004, .14 * (g || 1)], [t + .1, 0]], .15); o.frequency.exponentialRampToValueAtTime(900, t + .08); }
    function click(t) { tickS(t, .5); thump(t, .3); tickS(t + .08, .25); }
    function rise(t, t1) { band(t, t1, 400, 1800, .03, .06, 3); }
    function zip(t, t1) { band(t, t1, 1500, 7000, .02, .07, 3); }
    function buzzbad(t) { osc('square', 110, t, t + .35, 1, [[t, 0], [t + .01, .05], [t + .3, .05], [t + .35, 0]], .05); osc('square', 117, t, t + .35, 1, [[t, 0], [t + .01, .045], [t + .3, .045], [t + .35, 0]], .05); }
    function splash(t) { band(t, t + .7, 2500, 600, .15, .02, .8); thump(t, .3); }
    function glitch(t, t1) { var n = Math.floor((t1 - t) / .05); for (var k = 0; k < n; k++) { var tt = t + k * .05; if (rnd() < .6) osc('square', 300 + rnd() * 1500, tt, tt + .04, 1, [[tt, 0], [tt + .002, .025], [tt + .035, 0]]); } }
    function powerdown(t) { var o = osc('sawtooth', 220, t, t + .7, 1, [[t, 0], [t + .01, .05], [t + .65, 0]], .1); o.frequency.exponentialRampToValueAtTime(40, t + .6); }
    function rush(t, t1) { band(t, t1, 300, 2400, .06, .12, .6); band(t, t1, 2500, 5000, .02, .05, 1); }
    function boom(t) { var o = osc('sine', 70, t, t + 2.2, 1, [[t, 0], [t + .02, .5], [t + 2, 0]], .3); o.frequency.exponentialRampToValueAtTime(30, t + 1.5); band(t, t + 1.8, 400, 120, .2, .02, .5); }
    function fall(t, t1) { var o = osc('sine', 900, t, t1 + .1, 1, [[t, 0], [t + .02, .05], [t1, .03], [t1 + .1, 0]], .2); o.frequency.exponentialRampToValueAtTime(260, t1); }
    /* new for this episode */
    /* the sneeze: a rising, nasal "aah" swell (filtered saw), then a noisy "choo" */
    function aah(t, t1) { var o = osc('sawtooth', 160, t, t1 + .05, 1, [[t, 0], [t + .2, .02], [t1 - .05, .05], [t1, 0]], .2); o.frequency.linearRampToValueAtTime(330, t1); band(t, t1, 700, 1400, .02, .05, 4); }
    function choo(t) { var o = bus(1, .3), hp2 = ac.createBiquadFilter(); hp2.type = 'bandpass'; hp2.frequency.value = 3800; hp2.Q.value = .8; var n = noise(t, .45); n.connect(hp2); hp2.connect(o); env(o.gain, [[t, 0], [t + .01, .55], [t + .08, .3], [t + .42, 0]]); thump(t, .5); }
    /* an electric crackle */
    function zap(t, t1) { var n = Math.max(4, Math.floor((t1 - t) / .03)); for (var k = 0; k < n; k++) { var tt = t + k * (t1 - t) / n + rnd() * .015; if (rnd() < .7) { var o = bus(1, .15, (rnd() - .5) * .6), hp3 = ac.createBiquadFilter(); hp3.type = 'highpass'; hp3.frequency.value = 2000 + rnd() * 3000; var ns = noise(tt, .03); ns.connect(hp3); hp3.connect(o); env(o.gain, [[tt, 0], [tt + .001, .18 + rnd() * .2], [tt + .02, 0]]); } } osc('sawtooth', 60, t, t1, 1, [[t, 0], [t + .02, .03], [t1 - .05, .03], [t1, 0]], .05); }
    function staticS(t, t1) { band(t, t1, 3000, 3200, .06, .05, .4); glitch(t, t1); }
    /* auroras and flashes: a soft shimmering chord */
    function shimmer(t, t1) { [79, 83, 86, 91].forEach(function (m, j) { var o = osc('sine', mtof(m), t, t1 + .5, 1, [[t, 0], [t + .4 + j * .1, .018], [t1, .015], [t1 + .5, 0]], .7, (j - 1.5) * .5); var lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 5 + j; lg.gain.value = 4; lfo.connect(lg); lg.connect(o.frequency); lfo.start(Math.max(0, t)); lfo.stop(t1 + .5); }); }
    function clunk(t) { thump(t, .55); band(t, t + .1, 600, 300, .12, .02, 3); tickS(t + .02, .3); }
    function boing(t) { var o = osc('sine', 300, t, t + .5, 1, [[t, 0], [t + .01, .08], [t + .45, 0]], .2); env(o.frequency, [[t, 300], [t + .1, 600], [t + .2, 260], [t + .3, 480], [t + .45, 300]]); }
    function dingdong(t) { [[79, 0], [75, .32]].forEach(function (n) { osc('triangle', mtof(n[0]), t + n[1], t + n[1] + 1, 1, [[t + n[1], 0], [t + n[1] + .01, .09], [t + n[1] + .9, 0]], .4); }); }
    function slam(t) { thump(t, .7); var n = noise(t, .25), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; var o = bus(1, .35); n.connect(lp); lp.connect(o); env(o.gain, [[t, 0], [t + .003, .6], [t + .2, 0]]); osc('sine', 55, t, t + .6, 1, [[t, 0], [t + .01, .35], [t + .55, 0]], .1); }
    function morse(t, t1) { var tt = t; while (tt < t1) { var d = rnd() < .5 ? .06 : .16; osc('square', 740, tt, tt + d, 1, [[tt, 0], [tt + .005, .025], [tt + d - .005, .025], [tt + d, 0]], .1, .3); tickS(tt, .12); tt += d + .06; } }
    function engine(t, t1) { var o = osc('sawtooth', 48, t, t1 + .2, 1, [[t, 0], [t + .3, .035], [t1, .035], [t1 + .2, 0]], .05); var lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 9; lg.gain.value = 6; lfo.connect(lg); lg.connect(o.frequency); lfo.start(Math.max(0, t)); lfo.stop(t1 + .2); }
    function hum(t, t1) { [60, 120, 180].forEach(function (f, j) { osc('sine', f, t, t1 + .3, 1, [[t, 0], [t + .3, .05 / (j + 1)], [t1, .05 / (j + 1)], [t1 + .3, 0]], .05); }); }
    function rushw(t, t1) { band(t, t1, 400, 700, .08, .06, .5); band(t, t1, 1800, 2600, .03, .03, 1); }
    function clocktick(t, t1) { for (var tt = t; tt < t1; tt += .5) tickS(tt, .3); }
    function receipt(t, t1) { var n = Math.max(3, Math.floor((t1 - t) / .03)); for (var k = 0; k < n; k++) tickS(t + k * (t1 - t) / n, .07); band(t, t1, 2600, 3200, .02, .02, 3); }
    function register(t) { tickS(t, .4); [88, 93].forEach(function (m, j) { osc('triangle', mtof(m), t + j * .08, t + .9, 1, [[t + j * .08, 0], [t + j * .08 + .005, .07], [t + .85, 0]], .4); }); }
    function fridgedoor(t) { band(t, t + .25, 400, 200, .1, .02, 1); osc('sine', 120, t + .3, t + 1.0, 1, [[t + .3, .03], [t + 1.0, 0]], .05); }
    function flies(t, t1) { [0, 1].forEach(function (j) { var o = osc('sawtooth', 210 + j * 23, t, t1, 1, [[t, 0], [t + .3, .012], [t1 - .2, .012], [t1, 0]], .1, j ? .4 : -.4); var lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 3 + j; lg.gain.value = 30; lfo.connect(lg); lg.connect(o.frequency); lfo.start(Math.max(0, t)); lfo.stop(t1); }); }
    function gulp(t) { var o = osc('sine', 500, t, t + .2, 1, [[t, 0], [t + .01, .1], [t + .18, 0]], .1); o.frequency.exponentialRampToValueAtTime(180, t + .15); }
    function tickbox(t) { popS(t, .7); tickS(t + .05, .3); }
    function shutter(t) { tickS(t, .5); band(t, t + .08, 2000, 1200, .15, .02, 2); tickS(t + .07, .35); }
    function waves(t, t1) { for (var tt = t; tt < t1; tt += 3.2) band(tt, Math.min(t1, tt + 2.6), 500, 1600, .03, .01, .5, (rnd() - .5) * .6); }
    function projector(t, t1) { for (var tt = t; tt < t1; tt += 1 / 12) tickS(tt, .05); }
    var MAP = { tick: function (e) { tickS(e.t, e.g); }, blip: function (e) { blip(e.t, e.f, e.g); }, ding: function (e) { ding(e.t); }, ding1: function (e) { ding1(e.t, e.f); }, thump: function (e) { thump(e.t, e.g); }, swish: function (e) { swish(e.t); }, whoosh: function (e) { whoosh(e.t); }, stamp: function (e) { stampS(e.t, e.big, e.small); }, paper: function (e) { paper(e.t, e.g); }, flip: function (e) { flip(e.t, e.g); }, pop: function (e) { popS(e.t, e.g); }, click: function (e) { click(e.t); }, rise: function (e) { rise(e.t, e.t1); }, zip: function (e) { zip(e.t, e.t1); }, buzzbad: function (e) { buzzbad(e.t); }, splash: function (e) { splash(e.t); }, glitch: function (e) { glitch(e.t, e.t1); }, powerdown: function (e) { powerdown(e.t); }, rush: function (e) { rush(e.t, e.t1); }, boom: function (e) { boom(e.t); }, fall: function (e) { fall(e.t, e.t1); },
      aah: function (e) { aah(e.t, e.t1); }, choo: function (e) { choo(e.t); }, zap: function (e) { zap(e.t, e.t1); }, 'static': function (e) { staticS(e.t, e.t1); }, shimmer: function (e) { shimmer(e.t, e.t1); }, clunk: function (e) { clunk(e.t); }, boing: function (e) { boing(e.t); }, dingdong: function (e) { dingdong(e.t); }, slam: function (e) { slam(e.t); }, morse: function (e) { morse(e.t, e.t1); }, engine: function (e) { engine(e.t, e.t1); }, hum: function (e) { hum(e.t, e.t1); }, rushw: function (e) { rushw(e.t, e.t1); }, clocktick: function (e) { clocktick(e.t, e.t1); }, receipt: function (e) { receipt(e.t, e.t1); }, register: function (e) { register(e.t); }, fridgedoor: function (e) { fridgedoor(e.t); }, flies: function (e) { flies(e.t, e.t1); }, gulp: function (e) { gulp(e.t); }, tickbox: function (e) { tickbox(e.t); }, shutter: function (e) { shutter(e.t); }, waves: function (e) { waves(e.t, e.t1); }, projector: function (e) { projector(e.t, e.t1); } };
    EV.forEach(function (e) { if (MAP[e.type]) MAP[e.type](e); });
    env(master.gain, [[0, .9], [DUR - .3, .9], [DUR, .6]]);
    /* room tone, about −50 dB, so the gaps are never digital zero */
    (function () { var o = bus(1, 0), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .5; var n = noise(0, DUR); n.connect(lp); lp.connect(o); o.gain.value = .021; })();
  }

  /* ---------- boot ---------- */
  function init(canvas, opts) {
    cv = canvas; ctx = cv.getContext('2d'); cv.width = W; cv.height = H;
    tmp = mk(W, H); tctx = tmp.getContext('2d'); acc = mk(W, H); actx = acc.getContext('2d');
    if (opts && opts.grain === false) LIVE.grain = false;
    NOISE = mk(256, 256); var ng = NOISE.getContext('2d'), id = ng.createImageData(256, 256), r = mulberry(3);
    for (var i = 0; i < id.data.length; i += 4) { var v = 120 + r() * 135; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    ng.putImageData(id, 0, 0);
    var fonts = ['900 84px Archivo', '800 46px Archivo', '700 46px Archivo', '500 30px "Geist Mono"', '600 30px "Geist Mono"', '700 30px "Geist Mono"', 'italic 400 96px "Instrument Serif"'];
    return Promise.all(fonts.map(function (f) { return document.fonts.load(f, 'Aa0%°×÷−≈≠µ“”·→…✓✕▶←'); })).then(function () { return document.fonts.ready; }).then(function () { window.READY = true; });
  }
  initTimes();
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: end('title') + .3, SLUG: 'nvidia', SHOTS: SHOTS, CHAPTERS: CHAPTERS, thumb: function () { thumb(ctx); }, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
