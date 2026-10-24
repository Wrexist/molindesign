
  /* scenes: each starts just before its first line; wipe = how it arrives; part = a chapter card slams in the pause before it */
  var SC = [
    { id: 'beach', name: 'The Sun sneezes', t0: 0, draw: sBeach },
    { id: 'storm', name: 'A planet that runs on electricity', t0: start('open3') - .3, draw: sStorm, wipe: 'none' },
    { id: 'ask', name: 'Three questions', t0: start('open4') - .3, draw: sAsk, wipe: 'slide' },
    { id: 'title', name: 'Title', t0: start('title') - .45, draw: sTitle, wipe: 'iris' },
    { id: 'trip', name: '93 million miles', t0: start('warn1') - .3, draw: sTrip, wipe: 'slide', part: 'HOW MUCH WARNING?' },
    { id: 'doorbell', name: 'A doorbell camera in space', t0: start('warn3') - .3, draw: sDoorbell, wipe: 'iris' },
    { id: 'pizza', name: 'Faster than pizza', t0: start('warn5') - .3, draw: sPizza, wipe: 'slide' },
    { id: 'carr', name: 'Carrington, 1859', t0: start('hist1') - .3, draw: sCarr, wipe: 'slide', part: 'IT HAPPENED BEFORE' },
    { id: 'aurora', name: 'Northern lights in the Caribbean', t0: start('hist3') - .3, draw: sAurora, wipe: 'iris' },
    { id: 'tele', name: 'The telegraph goes haywire', t0: start('hist4') - .3, draw: sTele, wipe: 'slide' },
    { id: 'thennow', name: 'Then and now', t0: start('hist8') - .3, draw: sThenNow, wipe: 'slide' },
    { id: 'starlink', name: '38 satellites, a minor storm', t0: start('sat1') - .3, draw: sStarlink, wipe: 'slide', part: 'WHAT BREAKS FIRST?' },
    { id: 'tractor', name: 'Tractors off by ten feet', t0: start('sat4') - .3, draw: sTractor, wipe: 'slide' },
    { id: 'lake', name: 'Turn left into a lake', t0: start('sat6') - .3, draw: sLake, wipe: 'iris' },
    { id: 'lines', name: 'The power lines', t0: start('grid1') - .3, draw: sLines, wipe: 'slide', part: 'THE LIGHTS GO OUT' },
    { id: 'quebec', name: 'Quebec, 1989', t0: start('grid3') - .3, draw: sQuebec, wipe: 'slide' },
    { id: 'big', name: 'The big one', t0: start('grid6') - .3, draw: sBig, wipe: 'iris' },
    { id: 'trans', name: 'House-size transformers', t0: start('long1') - .3, draw: sTrans, wipe: 'slide', part: 'HOW LONG DOES IT LAST?' },
    { id: 'lloyds', name: "Lloyd's ran the numbers", t0: start('long3') - .3, draw: sLloyds, wipe: 'slide' },
    { id: 'fridge', name: 'Your fridge, then your nose', t0: start('long6') - .3, draw: sFridge, wipe: 'iris' },
    { id: 'odds', name: 'The odds', t0: start('odds1') - .3, draw: sOdds, wipe: 'slide', part: 'SHOULD YOU WORRY?' },
    { id: 'miss', name: 'The 2012 near miss', t0: start('odds3') - .3, draw: sMiss, wipe: 'slide' },
    { id: 'prep', name: 'An hour is enough', t0: start('odds5') - .3, draw: sPrep, wipe: 'slide' },
    { id: 'miami', name: 'Northern lights in Miami', t0: start('end1') - .3, draw: sMiami, wipe: 'iris' },
    { id: 'card', name: 'Watch next', t0: start('end5') - .3, draw: sCard, wipe: 'slide' }
  ];
  SC.forEach(function (s, i) { s.t1 = i + 1 < SC.length ? SC[i + 1].t0 : DUR; });
  function S(id) { for (var i = 0; i < SC.length; i++) if (SC[i].id === id) return SC[i]; }
  var SHOTS = SC.map(function (s) { return { id: s.id, name: s.name, t0: s.t0, t1: s.t1 }; });
  /* the part cards land in the pause before each part's first line */
  var PARTS = [];
  SC.forEach(function (s, i) { if (s.part) { var prev = VO.lines[VO.lines.indexOf(LINE[firstLine(s)]) - 1]; PARTS.push({ t: prev.t1 + .12, n: PARTS.length + 1, text: s.part, scene: s }); } });
  function firstLine(s) { for (var i = 0; i < VO.lines.length; i++) if (VO.lines[i].t0 >= s.t0) return VO.lines[i].id; }
  /* YouTube chapters (each ≥ 10 s, first at 0:00) */
  var CHAPTERS = [['The Sun sneezes', 0]].concat(PARTS.map(function (p) { return [p.text.charAt(0) + p.text.slice(1).toLowerCase(), Math.max(0, p.t - .1)]; })).concat([['The weird upside', S('miami').t0]]);

  /* ---------- part cards: slam in big, then park top-left as a label for the part ---------- */
  function partCards(g, t) {
    for (var i = 0; i < PARTS.length; i++) {
      var c = PARTS[i], nx = i + 1 < PARTS.length ? PARTS[i + 1].t : S('miami').t0;
      if (t < c.t || t > nx) continue;
      var u = t - c.t, k = eio(seg(u, 1.25, 1.7));
      font(g, 120, 900, DISP, true); var tw = g.measureText(c.text).width, cw = Math.max(tw + 140, 900), ch = 330;
      var s = lerp(1, .3, k), px = lerp(W / 2, 30 + cw * s / 2, k), py = lerp(H / 2, 40 + ch * s / 2, k);
      if (k < 1) { g.fillStyle = 'rgba(14,10,28,' + (.6 * (1 - k) * clamp(u * 6, 0, 1)) + ')'; g.fillRect(0, 0, W, H); }
      var sl = pop(t, c.t, 2.8, .5), sc = s * lerp(1.6, 1, clamp(sl, 0, 1));
      g.save(); g.translate(px, py); g.scale(sc, sc); g.rotate(lerp(-.04, -.015, k) + knock(t, c.t + .1, 30, 9) * .05);
      g.globalAlpha = clamp(sl * 3, 0, 1) * (t > nx - .3 ? 1 - seg(t, nx - .3, nx) : 1) * (k >= 1 ? .92 : 1);
      rr(g, -cw / 2 + 16, -ch / 2 + 20, cw, ch, 26); g.fillStyle = 'rgba(8,6,18,.5)'; g.fill();
      rr(g, -cw / 2, -ch / 2, cw, ch, 26); fillStroke(g, YEL, 10);
      g.fillStyle = INK; g.fillRect(-cw / 2, -ch / 2 + 20, 16, ch - 40);
      txt(g, 'PART ' + c.n + ' OF 6', 0, -78, 52, INK, { fam: MONO, wt: 700, ls: 6 });
      txt(g, c.text, 0, 46, 120, INK, { wt: 900, wide: true });
      g.restore();
    }
  }

  /* ---------- captions: one card per phrase, stressed words in yellow ---------- */
  var EMPH = /\d|^(sneezes|biggest|warning|pizza|doorbell|record|flash|caribbean|haywire|zapped|sparks|everything|minor|lake|gps|danger|flood|collapsed|transformers|house|years|trillion|fridge|nose|worried|odds|percent|decade|miss|week|safe|flashlight|water|map|school|miami|selfie|post|million|hours|seconds|seventeen|ten|twenty|forty|six|nine|twelve)\b/i;
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

  /* YouTube thumbnail (1920×1080, saved at 1280×720): the Sun mid-sneeze, Earth in the way, three words */
  function thumb(g) {
    var t = 2.2; g.setTransform(1, 0, 0, 1, 0, 0);
    space(g, t, 0, 0, { a: '#120d2c', b: '#2a1640' });
    sun(g, 1420, 470, 330, t, 'sneeze', { spots: true });
    for (var i = 0; i < 16; i++) { var a = Math.PI * (.6 + hash(i) * .6), d = 420 + hash(i + 3) * 300; circ(g, 1420 + Math.cos(a) * d, 470 + Math.sin(a) * d * .8, 10 + hash(i + 5) * 10); g.fillStyle = '#ffe9a0'; g.fill(); }
    plasma(g, 900, 640, 210, t, 1, true);
    earth(g, 300, 840, 220, t, { lon: -75, lat: 25, light: 1, field: .8, squash: .6 });
    g.save(); g.translate(560, 220); g.rotate(-.05); txt(g, 'THE SUN', 0, 0, 170, CREAM, { wt: 900, wide: true, outline: 26 }); g.restore();
    g.save(); g.translate(560, 430); g.rotate(-.06); font(g, 150, 900, DISP, true); var sw = g.measureText('SNEEZED').width + 90; rr(g, -sw / 2, -105, sw, 210, 28); fillStroke(g, RED, 14); txt(g, 'SNEEZED', 0, 8, 150, '#fff', { wt: 900, wide: true }); g.restore();
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
    PARTS.forEach(function (c, i) { var nx = i + 1 < PARTS.length ? PARTS[i + 1].t : S('miami').t0; if (t >= c.t && t < nx) out.push({ id: 'part' + i, text: 'PART ' + c.n + ' ' + c.text }); });
    return out;
  }

  /* ---------- events: the sound design reads the same word times ---------- */
  var EV = [];
  function E(t, type, o) { EV.push(Object.assign({ t: t, type: type }, o || {})); }
  function words(id, list, type, o, off) { list.forEach(function (w) { E(at(id, w) + (off || -.08), type, o); }); }
  function initTimes() {
    var i;
    /* beach */
    E(0, 'waves', { t1: start('open3') - .2 });
    E(at('open1', 'sun') - .25, 'aah', { t1: at('open1', 'sneezes') - .02 }); E(at('open1', 'sneezes'), 'choo'); E(at('open1', 'sneezes') + .1, 'boom');
    E(start('open2') - .1, 'rush', { t1: end('open2') + .35 }); E(at('open2', 'us') - .1, 'stamp');
    /* storm */
    E(start('open3') - .25, 'whoosh'); E(at('open3', 'biggest') - .1, 'stamp', { big: true }); E(at('open3', 'electricity') - .05, 'zap', { t1: at('open3', 'electricity') + .8 });
    /* ask */
    words('open4', ['breaks', 'long', 'worried'], 'paper', { g: 1.4 }, -.25); words('open4', ['breaks', 'long', 'worried'], 'pop', { g: .8 }, -.15);
    E(at('open5', 'scary') - .1, 'whoosh'); E(at('open5', 'warning') - .3, 'pop', { g: 1 }); for (i = 0; i < 8; i++) E(at('open5', 'warning') + i * .25, 'tick', { g: .2 });
    /* title */
    ['what', 'if', 'the', 'biggest', 'solar', 'storm', 'in', 'history', 'hit', 'earth'].forEach(function (w) { E(at('title', w) - .06, 'tick', { g: .25 }); });
    E(at('title', 'tomorrow') - .06, 'stamp', { big: true });
    /* part cards: the hard hit */
    PARTS.forEach(function (c) { E(c.t - .02, 'slam'); E(c.t + 1.25, 'swish'); });
    /* trip */
    E(at('warn1', 'cross') - .1, 'rise', { t1: end('warn1') }); for (i = 0; i < 20; i++) E(at('warn1', 'ninetythree') + i * .06, 'tick', { g: .1 }); E(at('warn1', 'miles') + .1, 'ding1');
    E(at('warn2', '1859') - .1, 'pop', { g: .7 }); E(at('warn2', 'trip') - .05, 'whoosh'); E(at('warn2', 'hours') - .05, 'ding');
    /* doorbell */
    E(at('warn3', 'million') - .1, 'zip', { t1: at('warn3', 'million') + .5 }); E(at('warn3', 'doorbell') - .05, 'blip', { f: 1400, g: .1 });
    E(start('warn4') - .2, 'rush', { t1: at('warn4', 'hits') }); E(at('warn4', 'hits'), 'thump', { g: .6 }); E(at('warn4', 'hits') + .05, 'dingdong'); E(at('warn4', 'fifteen') - .1, 'stamp');
    /* pizza */
    E(at('warn5', 'pizza') - .3, 'pop', { g: .7 }); E(at('warn5', 'less') - .2, 'pop', { g: .7 }); E(start('warn6') - .3, 'whoosh'); E(at('warn6', 'fry') - .1, 'zap', { t1: at('warn6', 'fry') + 1.0 });
    /* carrington */
    E(start('hist1') - .2, 'projector', { t1: start('hist3') - .3 }); E(at('hist1', 'before') - .1, 'stamp', { small: true }); E(at('hist2', 'september') - .1, 'paper', { g: 1.5 }); E(at('hist2', 'flash') - .05, 'shimmer', { t1: at('hist2', 'flash') + 1.4 }); E(at('hist2', 'flash') - .05, 'ding1', { f: 1 });
    /* aurora */
    E(at('hist3', 'explodes') - .3, 'shimmer', { t1: end('hist3') + .4 }); E(at('hist3', 'caribbean') - .1, 'pop', { g: .6 });
    /* telegraph */
    E(at('hist4', 'haywire') - .2, 'morse', { t1: at('hist5', 'zapped') - .1 }); E(at('hist5', 'sparks') - .05, 'zap', { t1: at('hist5', 'sparks') + .7 }); E(at('hist5', 'zapped') - .05, 'zap', { t1: at('hist5', 'zapped') + .4 }); E(at('hist5', 'zapped'), 'boing');
    E(at('hist6', 'unplug') + .1, 'clunk'); E(at('hist6', 'anyway') - .3, 'morse', { t1: end('hist6') + .3 }); E(at('hist6', 'storm') - .1, 'pop', { g: .6 });
    /* then / now */
    E(start('hist8') - .2, 'whoosh'); E(at('hist8', '1859') - .1, 'pop', { g: .6 }); for (i = 0; i < 12; i++) E((i < 2 ? at('hist8', 'advanced') + i * .2 : start('hist9') - .3 + (i - 2) * ((at('hist9', 'everything') - start('hist9') + .3) / 10)) + .02, 'blip', { f: 700 + i * 70, g: .07 });
    /* starlink */
    E(at('sat2', 'minor') - .2, 'pop', { g: .7 }); E(at('sat2', 'knocked'), 'fall', { t1: at('sat2', 'knocked') + 1.6 }); E(at('sat2', 'knocked') + .5, 'fall', { t1: at('sat2', 'knocked') + 2.2 });
    for (i = 0; i < 16; i++) E(at('sat2', 'thirtyeight') - .1 + i * .04, 'tick', { g: .12 }); E(at('sat2', 'starlink') + .2, 'ding1'); E(at('sat3', 'minor') - .08, 'stamp', { small: true });
    /* tractor */
    E(start('sat4') - .2, 'engine', { t1: at('sat5', 'stopped') - .2 }); E(at('sat4', 'threw') - .05, 'glitch', { t1: at('sat4', 'threw') + .5 }); E(at('sat4', 'ten') - .1, 'pop', { g: .7 }); E(at('sat5', 'stopped') + .2, 'stamp', { small: true });
    /* lake */
    E(start('sat6') - .2, 'engine', { t1: at('sat6', 'lake') }); E(at('sat6', 'left') - .1, 'blip', { f: 1200, g: .12 }); E(at('sat6', 'lake') + .2, 'splash');
    E(at('sat7', 'planes') - .2, 'whoosh'); E(at('sat7', 'radio') - .2, 'static', { t1: at('sat7', 'radio') + 1.1 }); E(at('sat7', 'phone') - .1, 'ding1', { f: 1 }); E(at('sat7', 'now') - .1, 'buzzbad');
    /* lines */
    E(at('grid1', 'down') - .3, 'whoosh'); E(at('grid2', 'shakes') - .1, 'hum', { t1: end('grid2') + .2 }); E(at('grid2', 'shoves') - .05, 'zap', { t1: at('grid2', 'shoves') + .8 }); E(at('grid2', 'flood') - .2, 'rushw', { t1: end('grid2') + .2 });
    /* quebec */
    E(at('grid3', 'march') - .1, 'paper'); for (i = 0; i < 18; i++) E(at('grid4', 'collapsed') + i * (wend('grid4', 'seconds') - at('grid4', 'collapsed')) / 18, 'tick', { g: .14 }); E(at('grid4', 'collapsed'), 'powerdown'); E(wend('grid4', 'seconds'), 'thump', { g: .5 });
    E(at('grid5', 'six') - .1, 'pop', { g: .7 }); E(at('grid5', 'nine') - .1, 'stamp');
    /* big */
    E(at('grid6', 'big') - .4, 'rise', { t1: at('grid6', 'big') + .2 }); E(at('grid6', 'big') + .2, 'boom');
    /* transformers */
    E(at('long1', 'night') - .1, 'clocktick', { t1: at('long1', 'transformers') - .2 }); E(at('long1', 'transformers') - .25, 'whoosh'); E(at('long1', 'transformers'), 'hum', { t1: start('long3') - .3 });
    E(at('long2', 'house') - .2, 'pop', { g: .8 }); E(at('long2', 'order') - .1, 'stamp'); for (i = 0; i < 10; i++) E(at('long2', 'years') - .1 + i * .18, 'flip', { g: .5 });
    /* lloyd's */
    E(at('long3', 'lloyds') - .1, 'paper'); for (i = 0; i < 14; i++) E(at('long4', 'twenty') - .3 + hash(i) * 1.2, 'powerdown'); E(at('long4', 'year') - .1, 'stamp');
    E(start('long5') - .2, 'receipt', { t1: at('long5', 'trillion') + .3 }); E(at('long5', '2.6') - .1, 'stamp', { big: true }); E(at('long5', 'trillion') + .2, 'register');
    /* fridge */
    E(at('long6', 'fridge') - .3, 'fridgedoor'); E(at('long7', 'nose') - .2, 'flies', { t1: S('odds').t0 - .2 });
    /* odds */
    E(at('odds1', 'worried') - .1, 'gulp'); E(at('odds2', 'odds') - .1, 'pop', { g: .6 }); E(at('odds2', 'twelve') - .2, 'rise', { t1: at('odds2', 'twelve') + .3 }); E(at('odds2', 'decade') - .1, 'stamp', { small: true });
    /* near miss */
    E(at('odds3', 'near') - .1, 'stamp', { small: true }); E(at('odds4', 'fired'), 'whoosh'); E(at('odds4', 'week') - .2, 'pop', { g: .6 }); E(at('odds4', 'hit') - .1, 'thump', { g: .5 }); E(at('odds4', 'hit') + .4, 'ding1', { f: 1 });
    /* prep */
    E(at('odds5', 'hour') - .1, 'ding1'); E(at('odds5', 'lower') + .1, 'clunk'); E(at('odds5', 'safe') - .7, 'whoosh'); E(at('odds5', 'safe') - .1, 'powerdown');
    words('odds6', ['flashlight', 'water', 'map'], 'tickbox', null, 0); E(at('odds6', 'flashlight') + .1, 'click');
    /* miami */
    E(start('end1') - .2, 'waves', { t1: start('end5') - .3 }); E(at('end1', 'weird') - .1, 'pop', { g: .6 }); E(at('end2', 'northern') - .2, 'shimmer', { t1: end('end3') }); E(at('end2', 'miami') - .1, 'pop', { g: .7 });
    E(at('end3', 'selfie'), 'shutter'); E(at('end4', 'post') + .05, 'buzzbad');
    /* card */
    E(at('end5', 'cables') - .3, 'pop', { g: .8 }); E(at('end5', 'here') - .1, 'ding');
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
  window.FILM = { W: W, H: H, DUR: DUR, POSTER: end('title') + .3, SLUG: 'solar', SHOTS: SHOTS, CHAPTERS: CHAPTERS, thumb: function () { thumb(ctx); }, init: init, render: render, frame: frame, LIVE: LIVE };
  window.DUR = DUR; window.EV = EV; window.TEXTS = TEXTS; window.SCORE = SCORE; window.READY = false;
  window.render = function (t, s, sh, fps) { render(t, s, sh, fps); };
})();
