/* 07 Buy — configurator with rolling price, button morphs, share menu + tooltips, morphing checkout tray, spec sheet (drawer ≥ 768 px, drag sheet below) */
(function () {
  var EO = 'cubic-bezier(.23,1,.32,1)', EDR = 'cubic-bezier(.32,.72,0,1)';
  var KITS = [
    { id: 'body', name: 'Body', note: 'LF‑1 with the fixed 35 mm f/1.4', price: 18900 },
    { id: 'grip', name: 'With grip', note: 'Adds the walnut grip and a second battery', price: 20400 },
    { id: 'field', name: 'Field kit', note: 'Grip, three filters, strap and a waxed canvas bag', price: 23900 }
  ];
  var FIN = { black: 'Black', stone: 'Stone' };
  var MONEY = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', currencyDisplay: 'code', maximumFractionDigits: 0 });
  var INT = new Intl.NumberFormat('sv-SE');
  var SPECS = [['Sensor', '24 MP full frame, mono + colour'], ['Lens', '35 mm f/1.4, fixed'], ['ISO', '50 – 102 400'], ['Shutter', '1/8000 s'], ['Weight', '412 g'], ['Sealing', 'Weather sealed'], ['Battery', '40 hours'], ['Made in', 'Lysekil, Sweden']];
  var BOX = [['Every kit', 'LF‑1 body and lens, HF‑40 battery, USB‑C cable, lens cap and hood'], ['With grip', 'Walnut grip with a second HF‑40 battery'], ['Field kit', 'Grip, ND8 / ND64 / polariser filters, waxed cotton strap, canvas bag']];
  var ICO = {
    info: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 7.2v4M8 4.8v.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    check: '<svg class="ck" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" pathLength="20"/></svg>',
    spin: '<svg class="spin" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/><path d="M14 8a6 6 0 0 0-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    share: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v8M5 4.6L8 1.8l3 2.8M3.5 7.5v5.5h9V7.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    link: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.6 9.4l2.8-2.8M7 4.6l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7L10.7 8.3M9 11.4l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7L5.3 7.7" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    mail: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2.5 4.5L8 9l5.5-4.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>'
  };

  /* animated-number-flow — keyed digit wheels, additive spins (number-flow 0.6.2: 900 ms linear() spring, 450 ms fades) */
  var EASE = [0,.005,.019,.039,.066,.096,.129,.165,.202,.24,.278,.316,.354,.39,.426,.461,.494,.526,.557,.586,.614,.64,.665,.689,.711,.731,.751,.769,.786,.802,.817,.831,.844,.856,.867,.877,.887,.896,.904,.912,.919,.925,.931,.937,.942,.947,.951,.955,.959,.962,.965,.968,.971,.973,.976,.978,.98,.981,.983,.984,.986,.987,.988,.989,.99,.991,.992,.992,.993,.994,.994,.995,.995,.996,.996,.9963,.9967,.9969,.9972,.9975,.9977,.9979,.9981,.9982,.9984,.9985,.9987,.9988,.9989,1];
  function ease(t) { var x = Math.min(t, 1) * (EASE.length - 1), i = Math.floor(x); return i >= EASE.length - 1 ? 1 : EASE[i] + (EASE[i + 1] - EASE[i]) * (x - i); }
  function Track() { this.l = []; }
  Track.prototype.add = function (f, now) { if (Math.abs(f) > 1e-4) this.l.push({ f: f, t: now }); };
  Track.prototype.val = function (now) { var s = 0; this.l = this.l.filter(function (a) { var k = (now - a.t) / 900; if (k >= 1) return false; s += a.f * (1 - ease(k)); return true; }); return s; };
  function toParts(v, fmt) {
    var raw = fmt.formatToParts(v), out = [], seen = {}, saw = false;
    var pos = raw.filter(function (p) { return p.type === 'integer'; }).map(function (p) { return p.value; }).join('').length;
    raw.forEach(function (p) {
      if (p.type === 'integer') { saw = true; p.value.split('').forEach(function (ch) { pos--; out.push({ key: 'i' + pos, digit: true, pos: pos, value: +ch }); }); }
      else if (p.type === 'group') out.push({ key: 'g' + pos, value: p.value, type: 'group' });
      else { var sec = (saw ? 'post:' : 'pre:') + p.type; seen[sec] = (seen[sec] || 0) + 1; out.push({ key: sec + seen[sec], value: p.value, type: p.type }); }
    });
    return out;
  }
  function Flow(host, fmt) { this.host = host; this.fmt = fmt; this.ch = {}; this.order = []; this.raf = 0; host.setAttribute('role', 'img'); this.box = document.createElement('span'); this.box.className = 'nf'; this.box.setAttribute('aria-hidden', 'true'); host.appendChild(this.box); var s = this; this.tick = function () { s.paint(); }; }
  Flow.prototype.make = function (p) {
    var el = document.createElement('span'), c = { key: p.key, digit: !!p.digit, el: el, x: new Track(), spin: new Track(), value: p.digit ? 0 : p.value };
    if (p.digit) { el.className = 'nf-d'; el.innerHTML = '<b>0</b>'; c.nums = []; for (var n = 0; n < 10; n++) { var i = document.createElement('i'); i.textContent = n; el.appendChild(i); c.nums.push(i); } }
    else { el.className = 'nf-s t-' + p.type; el.textContent = p.value; }
    return c;
  };
  Flow.prototype.delta = function (v, prev) { var d = v - prev, dir = this.dir || Math.sign(d); if (dir < 0 && v > prev) return v - 10 - prev; if (dir > 0 && v < prev) return 10 - prev + v; return d; };
  Flow.prototype.set = function (value, animate, label) {
    var parts = toParts(value, this.fmt), now = performance.now(), self = this, keys = {}, before = {};
    this.host.setAttribute('aria-label', label || this.fmt.format(value));
    this.dir = this.prev == null ? 0 : Math.sign(value - this.prev); this.prev = value;
    if (!this.order.length) animate = false;                                  // never animate the first render
    this.order.forEach(function (c) { before[c.key] = c.el.getBoundingClientRect().left; });
    var next = parts.map(function (p) {
      keys[p.key] = true;
      var c = self.ch[p.key], fresh = !c;
      if (fresh) c = self.ch[p.key] = self.make(p);
      c.fresh = fresh; c.el.classList.remove('lv'); c.el.style.left = '';
      if (c.digit) { if (animate) c.spin.add(-self.delta(p.value, c.value), now); else c.spin.l = []; c.value = p.value; }
      else if (c.value !== p.value) { c.value = p.value; c.el.textContent = p.value; }
      return c;
    });
    var leaving = this.order.filter(function (c) { return !keys[c.key]; });
    next.concat(leaving).forEach(function (c) { self.box.appendChild(c.el); });
    this.order = next;
    if (!animate) { leaving.forEach(function (c) { c.el.remove(); delete self.ch[c.key]; }); next.forEach(function (c) { c.x.l = []; c.spin.l = []; }); return this.paint(); }
    var bl = this.box.getBoundingClientRect().left;
    leaving.forEach(function (c) {                                             // pinned, roll to 0, fade, then removed
      c.el.classList.add('lv'); c.el.style.left = (before[c.key] - bl - c.x.val(now)) + 'px';
      if (c.digit) { c.spin.add(-self.delta(0, c.value), now); c.value = 0; }
      c.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: 'ease-out', fill: 'forwards' }).onfinish = function () { if (c.el.classList.contains('lv')) { c.el.remove(); if (self.ch[c.key] === c) delete self.ch[c.key]; } };
    });
    next.forEach(function (c) {                                                // FLIP the rest, new digits roll up from 0
      if (c.fresh) { c.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' }); if (c.digit) { c.spin.l = []; c.spin.add(-c.value, now); } }
      else if (before[c.key] != null) c.x.add(before[c.key] - c.el.getBoundingClientRect().left, now);
    });
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  };
  Flow.prototype.paint = function () {
    this.raf = 0; var now = performance.now(), busy = false, self = this;
    Object.keys(this.ch).forEach(function (k) {
      var c = self.ch[k], x = c.x.val(now); if (c.x.l.length) busy = true;
      c.el.style.transform = Math.abs(x) > .01 ? 'translateX(' + x.toFixed(2) + 'px)' : '';
      if (!c.digit) return;
      var pos = c.value + c.spin.val(now); if (c.spin.l.length) busy = true;
      for (var n = 0; n < 10; n++) { var o = ((n - pos) % 10 + 10) % 10; if (o >= 5) o -= 10; var s = c.nums[n]; if (Math.abs(o) < .98) { s.style.visibility = ''; s.style.transform = 'translateY(' + (o * 100).toFixed(2) + '%)'; } else s.style.visibility = 'hidden'; }
    });
    if (busy) this.raf = requestAnimationFrame(this.tick);
  };

  /* morphing-tray — shared-letter text morph (glyphs keyed char + occurrence) */
  function TextMorph(el, frame, anchor) { this.el = el; this.frame = frame; this.anchor = anchor; this.anims = []; }
  TextMorph.prototype.rel = function (n) { var r = n.getBoundingClientRect(), f = this.frame.getBoundingClientRect(); return r.left - (this.anchor === 'center' ? f.left + f.width / 2 : f.left); };
  TextMorph.prototype.capture = function () { var s = this; this.anims.forEach(function (a) { if (a.playState !== 'idle') a.finish(); }); this.anims = []; this.el.querySelectorAll('.gh').forEach(function (g) { g.remove(); }); this.old = [].map.call(this.el.children, function (n) { return { s: n, x: s.rel(n) }; }); };
  TextMorph.prototype.set = function (text, animate) {
    var seen = {}, pool = {}, s = this; (this.old || []).forEach(function (o) { pool[o.s.dataset.k] = o; }); this.reused = []; this.fresh = [];
    var spans = text.split('').map(function (ch) { var k = ch + (seen[ch] = (seen[ch] || 0) + 1), o = pool[k]; if (o && animate) { delete pool[k]; s.reused.push(o); return o.s; } var n = document.createElement('span'); n.dataset.k = k; n.textContent = ch === ' ' ? ' ' : ch; s.fresh.push(n); return n; });
    this.gone = animate ? Object.keys(pool).map(function (k) { return pool[k]; }) : [];
    this.el.textContent = ''; spans.forEach(function (n) { s.el.appendChild(n); }); this.old = null;
  };
  TextMorph.prototype.play = function (reduced, dur, easing) {
    var s = this, base = this.rel(this.el), push = function (a) { s.anims.push(a); return a; };
    if (reduced) { push(this.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 })); return; }
    this.reused.forEach(function (o) { var dx = o.x - s.rel(o.s); if (Math.abs(dx) > .5) push(o.s.animate([{ transform: 'translateX(' + dx + 'px)' }, { transform: 'none' }], { duration: dur, easing: easing })); });
    this.fresh.forEach(function (n, i) { push(n.animate([{ opacity: 0, filter: 'blur(4px)', transform: 'translateY(.3em)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], { duration: 380, delay: 60 + i * 16, easing: EO, fill: 'backwards' })); });
    this.gone.forEach(function (o) { var g = o.s; g.className = 'gh'; g.style.left = (o.x - base) + 'px'; s.el.appendChild(g); push(g.animate([{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(4px)', transform: 'translateY(-.25em)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' })).onfinish = function () { g.remove(); }; });
  };
  function springLinear(k, c, steps) {                                         // damped spring sampled into CSS linear(): 300/26 → ~460 ms
    var w0 = Math.sqrt(k), z = c / (2 * w0), wd = w0 * Math.sqrt(1 - z * z), T = 6 / (z * w0), pts = [];
    for (var i = 0; i < steps; i++) { var t = i / steps * T; pts.push((1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + z * w0 / wd * Math.sin(wd * t))).toFixed(4)); }
    pts.push('1'); return { easing: 'linear(' + pts.join(',') + ')', ms: Math.round(T * 1000) };
  }
  var SP = springLinear(300, 26, 48), SPOK = window.CSS && CSS.supports && CSS.supports('transition-timing-function', SP.easing);
  var TEASE = SPOK ? SP.easing : EDR, TDUR = SPOK ? SP.ms : 500;

  var B = '#buy ', L = '#buy-layer ';
  var STYLE = [
    '#buy { position: relative; padding: 18rem 0 16rem; }',
    B + '.buy-head { max-width: 80rem; margin-bottom: 7rem; }',
    B + '.buy-title { font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; font-size: 8.8rem; line-height: .95; letter-spacing: -.02em; margin: 2.4rem 0 0; }',
    B + '.buy-lede { font-size: 1.8rem; line-height: 1.55; color: var(--p70); max-width: 46rem; margin: 2.8rem 0 0; }',
    B + '.buy-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 7rem; align-items: start; }',
    B + '.buy-fig { position: sticky; top: 12rem; margin: 0; aspect-ratio: 5 / 4; display: grid; place-items: center; }',
    B + '.buy-fig .c { position: absolute; width: 2.4rem; height: 2.4rem; border: 0 solid var(--p45); } ' + B + '.buy-fig .c1 { top: 0; left: 0; border-width: 1px 0 0 1px; } ' + B + '.buy-fig .c2 { top: 0; right: 0; border-width: 1px 1px 0 0; } ' + B + '.buy-fig .c3 { bottom: 0; left: 0; border-width: 0 0 1px 1px; } ' + B + '.buy-fig .c4 { bottom: 0; right: 0; border-width: 0 1px 1px 0; }',
    B + '.buy-cam { position: relative; width: 84%; } ' + B + '.buy-cam svg { display: block; width: 100%; height: auto; color: var(--p70); transition: opacity .6s ' + EO + '; }',
    B + '.buy-cam .stone { position: absolute; inset: 0; opacity: 0; filter: invert(.88) hue-rotate(180deg) sepia(.22) saturate(.8); } ' + B + '[data-finish="stone"] .buy-cam .stone { opacity: 1; } ' + B + '[data-finish="stone"] .buy-cam .blk { opacity: 0; }',
    B + '.buy-fig figcaption { position: absolute; left: 2.4rem; right: 2.4rem; bottom: 2rem; display: flex; justify-content: space-between; gap: 2rem; color: var(--p45); } ' + B + '.buy-fig figcaption b { color: var(--signal); font-weight: 500; }',
    B + '.card { position: relative; padding: 3.6rem; border: 1px solid var(--p15); border-radius: 2.4rem; background: rgb(13 13 12 / .78); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px); }',
    B + '.cfg { transition: opacity .35s, filter .35s; } ' + B + '.cfg.dim { opacity: .28; filter: blur(2px); }',
    B + '.row-h { display: flex; align-items: center; gap: .8rem; margin: 0 0 1.4rem; color: var(--p45); }',
    B + '.price-w { padding-bottom: 3rem; border-bottom: 1px solid var(--p15); margin-bottom: 3rem; }',
    B + '.price { font-family: Archivo, sans-serif; font-stretch: 125%; font-size: 6.8rem; letter-spacing: -.02em; line-height: 1; font-variant-numeric: tabular-nums; color: var(--paper); }',
    B + '.price-sub { margin: 1.2rem 0 0; color: var(--p45); }',
    '.nf { position: relative; display: inline-flex; align-items: baseline; white-space: nowrap; padding: .25em 0; margin: -.25em 0; overflow-y: clip; -webkit-mask-image: linear-gradient(to bottom, transparent, #000 .25em, #000 calc(100% - .25em), transparent); mask-image: linear-gradient(to bottom, transparent, #000 .25em, #000 calc(100% - .25em), transparent); }',
    '.nf-d, .nf-s { position: relative; display: inline-block; white-space: pre; } .nf-d b { visibility: hidden; font-weight: inherit; } .nf-d i { position: absolute; inset: 0 0 auto; text-align: center; font-style: normal; } .nf .lv { position: absolute !important; top: .25em; }',
    B + '.price .t-currency { font-size: .36em; letter-spacing: .08em; color: var(--p70); margin-left: .2em; } ' + B + '.price .t-literal { font-size: .4em; }',
    B + 'fieldset { border: 0; padding: 0; margin: 0 0 3rem; min-width: 0; } ' + B + 'legend { padding: 0; }',
    B + '.kits { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }',
    B + '.opt { position: relative; display: flex; flex-direction: column; gap: .6rem; padding: 1.6rem; border: 1px solid var(--p15); border-radius: 1.4rem; cursor: pointer; transition: border-color .2s, background-color .2s; }',
    B + '.opt input, ' + B + '.sw input { position: absolute; opacity: 0; width: 1px; height: 1px; }',
    B + '.opt b { font-weight: 500; font-size: 1.6rem; } ' + B + '.opt small { font-size: 1.3rem; line-height: 1.4; color: var(--p45); } ' + B + '.opt .mono { margin-top: auto; padding-top: .8rem; font-size: 1.3rem; color: var(--p70); }',
    B + '.opt:has(input:checked) { border-color: var(--signal); background: rgb(255 77 31 / .06); } ' + B + '.opt:has(input:focus-visible), ' + B + '.sw:has(input:focus-visible) { outline: 2px solid var(--signal); outline-offset: 2px; }',
    '@media (hover: hover) { ' + B + '.opt:hover { border-color: var(--p45); } }',
    B + '.fin-q { display: flex; flex-wrap: wrap; gap: 3rem 4rem; } ' + B + '.fin-q fieldset { margin-bottom: 0; }',
    B + '.sws { display: flex; gap: .8rem; } ' + B + '.sw { position: relative; display: inline-flex; align-items: center; gap: 1rem; min-height: max(4.4rem, 44px); padding: 0 1.8rem 0 1.2rem; border: 1px solid var(--p15); border-radius: 99px; cursor: pointer; font-size: 1.5rem; transition: border-color .2s; }',
    B + '.sw i { width: 1.8rem; height: 1.8rem; border-radius: 50%; background: #1b1b19; box-shadow: inset 0 0 0 1px var(--p45); } ' + B + '.sw i.st { background: #cfc8ba; } ' + B + '.sw:has(input:checked) { border-color: var(--paper); }',
    B + '.step { display: inline-flex; align-items: center; gap: .4rem; padding: .3rem; border: 1px solid var(--p15); border-radius: 99px; }',
    B + '.step button { width: max(3.8rem, 38px); height: max(3.8rem, 38px); border-radius: 50%; font-size: 1.8rem; color: var(--p90); transition: background-color .16s, transform .16s cubic-bezier(.25,.46,.45,.94); } ' + B + '.step button:active { transform: scale(.94); } ' + B + '.step button:disabled { opacity: .35; }',
    B + '.step .qty { min-width: 4rem; text-align: center; font-family: "Geist Mono", monospace; font-size: 1.6rem; }',
    B + '.acts { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; margin-top: 3.6rem; }',
    /* button-state-morphs: press .97, width-stable label stack, hold fill */
    B + '.b, ' + L + '.b { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: .8rem; min-height: max(5.2rem, 44px); padding: 0 2.4rem; border-radius: 99px; font: 500 1.5rem/1 Archivo, sans-serif; white-space: nowrap; overflow: hidden; touch-action: manipulation; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; transition: transform .16s cubic-bezier(.25,.46,.45,.94), background-color .16s, color .16s, border-color .16s, opacity .16s; }',
    B + '.b:not(:disabled):not([aria-disabled="true"]):is(:active, [data-pressed]), ' + L + '.b:not([aria-disabled="true"]):is(:active, [data-pressed]) { transform: scale(.97); }',
    B + '.b[aria-disabled="true"]:not(.tb) { opacity: .45; cursor: not-allowed; }',
    B + '.b svg, ' + L + '.b svg { width: 1.6rem; height: 1.6rem; min-width: 14px; min-height: 14px; flex: none; }',
    B + '.pri { background: var(--paper); color: var(--ink); } ' + B + '.b-sec { border: 1px solid var(--p15); color: var(--p90); } ' + B + '.sig { background: var(--signal); color: var(--ink); } ' + B + '.drk { background: #1c1c1a; color: var(--paper); box-shadow: inset 0 0 0 1px var(--p15); }',
    '@media (hover: hover) { ' + B + '.b-sec:not([aria-disabled="true"]):hover { border-color: var(--p45); } ' + B + '.pri:hover { background: #fff; } }',
    B + '.stack { display: grid; } ' + B + '.stack > * { grid-area: 1 / 1; display: inline-flex; align-items: center; justify-content: center; gap: .8rem; opacity: 0; transform: translateY(7px) scale(.96); filter: blur(2px); transition: opacity .2s ' + EO + ', transform .2s ' + EO + ', filter .2s ' + EO + '; } ' + B + '.stack > .out { transform: translateY(-7px) scale(.96); }',
    B + '.stack > .on { opacity: 1; transform: none; filter: none; }',
    B + '.ck path { stroke-dasharray: 20; stroke-dashoffset: 20; transition: stroke-dashoffset .25s ease-out .08s; } ' + B + '.on > .ck path, ' + L + '.is-copied .ck path { stroke-dashoffset: 0; }',
    B + '.spin, ' + L + '.spin { animation: buy-rot .7s linear infinite; } @keyframes buy-rot { to { transform: rotate(360deg); } }',
    B + '.bag { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem 2rem; margin-top: 2.8rem; padding-top: 2.4rem; border-top: 1px solid var(--p15); color: var(--p45); }',
    B + '.bag-n { color: var(--paper); font-family: "Geist Mono", monospace; } ' + B + '.bag .spacer { flex: 1; }',
    B + '.hold { -webkit-touch-callout: none; min-height: max(4.4rem, 44px); padding: 0 1.8rem; } ' + B + '.hold .fill { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: var(--signal); color: var(--ink); clip-path: inset(0 100% 0 0); transition: clip-path .2s ease-out; pointer-events: none; }',
    B + '.hold.holding .fill { clip-path: inset(0 0 0 0); transition: clip-path 1.5s linear; }',
    B + '.ulink2 { display: inline-flex; align-items: center; gap: .6rem; min-height: 44px; color: var(--p90); } ' + B + '.ulink2 span { color: var(--signal); transition: transform .3s ' + EO + '; } @media (hover: hover) { ' + B + '.ulink2:hover span { transform: translateX(3px); } }',
    B + '.info { display: inline-grid; place-items: center; width: 28px; height: 28px; margin: -6px 0; border-radius: 50%; color: var(--p45); transition: color .16s; } ' + B + '.info svg { width: 16px; height: 16px; } ' + B + '.info:hover, ' + B + '.info:focus-visible { color: var(--paper); }',
    /* morphing-tray: checkout */
    B + '.co { position: relative; height: max(5.2rem, 44px); margin-top: 1rem; }',
    B + '.scrim { position: absolute; inset: 0; z-index: 2; display: none; border-radius: inherit; } ' + B + '.scrim.on { display: block; }',
    B + '.tray { position: absolute; z-index: 3; left: 0; bottom: 0; display: flex; flex-direction: column; overflow: hidden; border-radius: 2.8rem; border: 1px solid transparent; }',
    B + '.tray.is-tray { width: min(46rem, 100%); padding: .8rem; border-radius: 3.2rem; background: #151514; border-color: var(--p15); box-shadow: 0 3rem 8rem rgb(0 0 0 / .6); }',
    B + '.tray.anim { transition: width var(--d) var(--e), height var(--d) var(--e), padding var(--d) var(--e), border-radius var(--d) var(--e), background-color .35s, border-color .35s, box-shadow .5s; }',
    B + '.t-head { display: flex; align-items: center; gap: 1.2rem; padding: .6rem .4rem .2rem; } ' + B + '.t-head[hidden], ' + B + '.t-view[hidden] { display: none; }',
    B + '.t-title { position: relative; margin: 0; font: 400 1.9rem/1.2 Archivo, sans-serif; font-stretch: 112%; white-space: nowrap; } ' + B + '.t-title span, ' + B + '.t-lbl span { display: inline-block; white-space: pre; } ' + B + '.t-title .gh, ' + B + '.t-lbl .gh { position: absolute; top: 0; }',
    B + '.t-ico { position: relative; width: 40px; height: 40px; flex: none; border-radius: 50%; background: var(--p08); } ' + B + '.t-ico i { position: absolute; left: 12px; top: 19px; width: 16px; height: 2px; border-radius: 2px; background: var(--paper); transition: transform .32s ' + EO + '; }',
    B + '.is-x .b1 { transform: rotate(45deg); } ' + B + '.is-x .b2 { transform: rotate(-45deg); } ' + B + '.is-x .b3 { transform: scaleX(0); } ' + B + '.is-back .b1 { transform: translate(-4.2px, -2.8px) rotate(-45deg) scaleX(.5); } ' + B + '.is-back .b2 { transform: translate(-4.2px, 2.8px) rotate(45deg) scaleX(.5); } ' + B + '.is-back .b3 { transform: scaleX(.875); }',
    B + '.t-view { padding: 1.2rem .8rem 1.6rem; } ' + B + '.t-leave { position: absolute; left: .8rem; right: .8rem; pointer-events: none; }',
    B + '.t-row { display: flex; justify-content: space-between; gap: 2rem; padding: 1.1rem 0; border-top: 1px solid var(--p08); font-size: 1.5rem; } ' + B + '.t-row:first-child { border-top: 0; } ' + B + '.t-row .label { color: var(--p45); } ' + B + '.t-row .mono { text-align: right; }',
    B + '.t-big { margin: .4rem 0 .6rem; font-family: Archivo, sans-serif; font-stretch: 125%; font-size: 4.4rem; line-height: 1; font-variant-numeric: tabular-nums; } ' + B + '.t-sub { margin: 0; font-size: 1.5rem; color: var(--p70); }',
    B + '.t-warn { display: flex; align-items: center; gap: .8rem; margin: 1.4rem 0 0; color: var(--p70); } ' + B + '.t-warn::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--signal); }',
    B + '.t-pri { flex: none; } ' + B + '.t-pri .ico { display: none; } ' + B + '.t-pri.ico-spin .spin, ' + B + '.t-pri.ico-check .ck { display: block; } ' + B + '.t-pri.ico-check .ck path { stroke-dashoffset: 0; } ' + B + '.t-lbl { position: relative; display: inline-flex; }',
    B + '.sr, ' + L + '.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }',
    /* origin-aware-popovers: tooltip + share menu (fixed, in the layer) */
    L + '.pop { position: fixed; z-index: 95; left: 0; top: 0; transform-origin: var(--origin, center); animation: buy-pop-in 160ms ' + EO + ' both; }',
    L + '.pop[hidden] { display: none; } ' + L + '.pop[data-state="closed"] { animation: buy-pop-out 120ms ease both; } ' + L + '.pop[data-state="instant-open"] { animation: none; }',
    L + '.pop[data-side="bottom"] { --sx: 0; --sy: -8px; } ' + L + '.pop[data-side="top"] { --sx: 0; --sy: 8px; } ' + L + '.tip[data-side="bottom"] { --sy: -4px; } ' + L + '.tip[data-side="top"] { --sy: 4px; }',
    '@keyframes buy-pop-in { from { opacity: 0; transform: translate(var(--sx, 0), var(--sy, 0)) scale(.95); } } @keyframes buy-pop-out { to { opacity: 0; transform: scale(.95); } }',
    L + '.tip { max-width: 26rem; padding: .8rem 1.2rem; border-radius: .8rem; background: var(--paper); color: var(--ink); font-size: 1.3rem; line-height: 1.4; pointer-events: none; }',
    L + '.bmenu { min-width: 20rem; padding: .6rem; border-radius: 1.4rem; background: #1a1a18; border: 1px solid var(--p15); box-shadow: 0 2rem 6rem rgb(0 0 0 / .55); }',
    L + '.bmenu [role="menuitem"] { display: flex; align-items: center; gap: 1.2rem; width: 100%; min-height: max(4rem, 40px); padding: 0 1.2rem; border-radius: .8rem; color: var(--p90); font-size: 1.5rem; text-decoration: none; outline: none; } ' + L + '.bmenu [role="menuitem"]:focus { background: var(--p08); color: var(--paper); }',
    L + '.bmenu svg { width: 16px; height: 16px; flex: none; } ' + L + '.bmenu .mi-ico { display: grid; } ' + L + '.bmenu .mi-ico > * { grid-area: 1 / 1; transition: opacity .2s, transform .2s ' + EO + '; } ' + L + '.bmenu .mi-ico .ck { opacity: 0; transform: scale(.8); } ' + L + '.is-copied .mi-ico .ck { opacity: 1; transform: none; color: var(--signal); } ' + L + '.is-copied .mi-ico .ln { opacity: 0; transform: scale(.8); }',
    /* slide-over-drawer (≥ 768 px) */
    L + '.sd { position: fixed; inset: 0; z-index: 90; } ' + L + '.sd[hidden] { display: none; }',
    L + '.sd-back { position: absolute; inset: 0; background: rgb(0 0 0 / .45); opacity: 0; transition: opacity .3s ' + EO + '; }',
    L + '.sd-panel { position: absolute; top: 0; right: 0; bottom: 0; width: min(52rem, 100%); display: flex; flex-direction: column; overflow-y: auto; overscroll-behavior: contain; padding: 3.2rem 4rem; background: rgb(13 13 12 / .82); -webkit-backdrop-filter: blur(40px); backdrop-filter: blur(40px); border-left: 1px solid var(--p15); transform: translateX(100%); transition: transform .5s ' + EDR + '; }',
    L + '.sd.open .sd-back { opacity: 1; } ' + L + '.sd.open .sd-panel { transform: none; }',
    L + '.x-btn { min-height: 44px; padding: 0 1.4rem; margin-right: -1.4rem; color: var(--p70); } ' + L + '.x-btn:hover { color: var(--paper); }',
    L + '.sheet-c [role="tablist"] { display: flex; gap: 2.4rem; border-bottom: 1px solid var(--p15); }',
    L + '.sheet-c [role="tab"] { position: relative; min-height: 44px; color: var(--p45); } ' + L + '.sheet-c [role="tab"][aria-selected="true"] { color: var(--paper); }',
    L + '.sheet-c [role="tab"]::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px; background: var(--signal); transform: scaleX(0); transform-origin: left; transition: transform .3s ' + EO + '; } ' + L + '.sheet-c [role="tab"][aria-selected="true"]::after { transform: scaleX(1); }',
    L + '.sheet-c [role="tabpanel"][hidden] { display: none; } ' + L + '.sheet-c [role="tabpanel"]:focus-visible { outline: none; }',
    L + '.sh-big { margin: 3.2rem 0 2rem; font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 300; font-size: 4.4rem; line-height: 1; letter-spacing: .02em; } ' + L + '.sh-big em { font-family: "Instrument Serif", serif; font-weight: 400; letter-spacing: 0; color: var(--p70); }',
    L + '.sheet-c dl { margin: 0; } ' + L + '.sh-row { display: flex; justify-content: space-between; align-items: baseline; gap: 2.4rem; padding: 1.4rem 0; border-top: 1px solid var(--p15); opacity: 0; transform: translateY(8px); }',
    L + '.sh-row:last-child { border-bottom: 1px solid var(--p15); } ' + L + '.in .sh-row { opacity: 1; transform: none; transition: opacity .5s ' + EO + ', transform .5s ' + EO + '; }',
    L + '.sh-row dt { color: var(--p45); flex: none; } ' + L + '.sh-row dd { margin: 0; font-size: 1.5rem; color: var(--p90); text-align: right; font-variant-numeric: tabular-nums; }',
    L + '.sh-p { font-size: 1.6rem; line-height: 1.6; color: var(--p70); margin: 0 0 1.6rem; } ' + L + '.sh-foot { margin-top: 3.2rem; display: flex; justify-content: space-between; gap: 2rem; align-items: center; color: var(--p45); }',
    L + '.sh-foot a { color: var(--paper); text-decoration: none; min-height: 44px; display: inline-flex; align-items: center; gap: .6rem; } ' + L + '.sh-foot a span { color: var(--signal); }',
    /* drag-sheet-drawer (< 768 px) */
    L + '.bs-ov { position: fixed; inset: 0; z-index: 89; background: rgb(0 0 0 / .55); opacity: 0; pointer-events: none; } ' + L + '.bs-ov.on { pointer-events: auto; }',
    L + '.bs { position: fixed; left: 0; right: 0; bottom: 0; z-index: 90; display: flex; flex-direction: column; background: #151514; border-radius: 14px 14px 0 0; border-top: 1px solid var(--p15); box-shadow: 0 -2rem 6rem rgb(0 0 0 / .6); touch-action: none; transform: translate3d(0, 110%, 0); will-change: transform; visibility: hidden; }',
    L + '.bs.vis { visibility: visible; } ' + L + '.bs::after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 200%; background: inherit; }',
    L + '.bs-handle { position: relative; display: block; width: 100%; height: 28px; flex: none; } ' + L + '.bs-handle i { position: absolute; left: 50%; top: 11px; width: 32px; height: 5px; margin-left: -16px; border-radius: 1rem; background: var(--p45); opacity: .7; } ' + L + '.bs-handle:focus-visible { outline: none; } ' + L + '.bs-handle:focus-visible i { background: var(--signal); opacity: 1; }',
    L + '.bs-head { display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; } ' + L + '.bs-scroll { flex: 1; min-height: 0; overflow: hidden; overscroll-behavior: contain; padding: 0 2rem 4rem; touch-action: pan-y; } ' + L + '.bs.top .bs-scroll { overflow-y: auto; }',
    L + '.bs .sh-big { font-size: 3.4rem; margin-top: 2.4rem; }',
    '@media (max-width: 1100px) { ' + B + '.kits { grid-template-columns: 1fr; } ' + B + '.opt { flex-direction: row; flex-wrap: wrap; align-items: baseline; column-gap: 1.2rem; } ' + B + '.opt small { order: 3; flex-basis: 100%; } ' + B + '.opt .mono { margin: 0 0 0 auto; padding: 0; } }',
    '@media (max-width: 767px) { #buy { padding: 12rem 0 10rem; } ' + B + '.buy-title { font-size: 5rem; } ' + B + '.buy-lede { font-size: 1.6rem; } ' + B + '.buy-head { margin-bottom: 4rem; } ' + B + '.buy-grid { grid-template-columns: 1fr; gap: 2.4rem; } ' + B + '.buy-fig { position: relative; top: 0; aspect-ratio: 4 / 3; } ' + B + '.buy-fig figcaption { left: 1.4rem; right: 1.4rem; bottom: 1rem; } ' + B + '.card { padding: 2.2rem 1.8rem; border-radius: 1.8rem; } ' + B + '.price { font-size: 4.8rem; } ' + B + '.acts .b { flex: 1 1 auto; } }',
    '@media (prefers-reduced-motion: reduce) { ' + B + '.stack > *, ' + B + '.stack > .out { transform: none !important; filter: none !important; } ' + B + '.b:is(:active, [data-pressed]), ' + L + '.b:is(:active, [data-pressed]) { transform: none !important; filter: brightness(.9); } ' + B + '.spin, ' + L + '.spin { animation-duration: 2.4s; } ' + B + '.cfg.dim { filter: none; }',
    '  ' + L + '.pop, ' + L + '.pop[data-state="closed"] { animation-name: buy-fade; animation-duration: 100ms; } ' + L + '.sd-panel { transform: none; opacity: 0; transition: opacity .2s; } ' + L + '.sd.open .sd-panel { opacity: 1; } ' + L + '.sh-row { transform: none; } }',
    '@keyframes buy-fade { from { opacity: 0; } }'
  ].join('\n');

  Site.section('buy', {
    css: STYLE,
    mount: function (root, ctx) {
      var R = ctx.reduced, $ = function (s, r) { return (r || root).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || root).querySelectorAll(s)); };
      var timers = [], later = function (fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; };
      var st = { kit: 2, fin: 'black', qty: 1 }, bag = [], live = false;
      var item = function (e) { return 'LF‑1 · ' + KITS[e.kit].name + ' · ' + FIN[e.fin]; };
      var stackBtn = function (cls, states, extra) { return '<button type="button" class="b ' + cls + '" data-state="' + states[0][0] + '"' + (extra || '') + '><span class="stack">' + states.map(function (s, i) { return '<span data-for="' + s[0] + '"' + (i ? ' aria-hidden="true"' : ' class="on"') + '>' + s[1] + '</span>'; }).join('') + '</span></button>'; };
      var info = function (tip, name) { return '<button type="button" class="info" aria-label="' + name + '" data-tip="' + tip + '">' + ICO.info + '</button>'; };
      var cam = '<svg viewBox="0 0 400 240" aria-hidden="true"><use href="#lf1"/></svg>';

      root.innerHTML =
        '<div class="wrap">' +
        '<header class="buy-head"><p class="kicker rise"><span>07</span>Buy</p>' +
        '<h2 class="buy-title"><span class="mask"><span class="line">Take it</span></span><span class="mask"><span class="line"><span class="serif">outside.</span></span></span></h2>' +
        '<p class="buy-lede rise">Built to order in Lysekil and shipped in two to four days. Two-year warranty, and free sensor cleaning for as long as you own it.</p></header>' +
        '<div class="buy-grid" data-finish="black">' +
        '<figure class="buy-fig rise"><i class="c c1"></i><i class="c c2"></i><i class="c c3"></i><i class="c c4"></i>' +
        '<div class="buy-cam" role="img" aria-label="Halden LF‑1, front view, black finish"><span class="blk">' + cam + '</span><span class="stone">' + cam + '</span></div>' +
        '<figcaption class="label"><span>[ <b>LF‑1</b> · <span class="fin-name">Black</span> ]</span><span>412 g · 24 MP</span></figcaption></figure>' +
        '<form class="card rise" novalidate><div class="cfg">' +
        '<div class="price-w"><p class="row-h label">Your LF‑1 ' + info('Price includes 25 % Swedish VAT and free tracked shipping inside the EU.', 'About the price') + '</p>' +
        '<div class="price"></div><p class="price-sub label">Incl. VAT · ships from Lysekil</p><p class="sr" aria-live="polite"></p></div>' +
        '<fieldset><legend class="row-h label">Kit ' + info('Every kit ships with the 35 mm f/1.4, one HF‑40 battery and a USB‑C cable.', 'What every kit includes') + '</legend><div class="kits">' +
        KITS.map(function (k, i) { return '<label class="opt"><input type="radio" name="buy-kit" value="' + i + '"' + (i === st.kit ? ' checked' : '') + '><b>' + k.name + '</b><small>' + k.note + '</small><span class="mono">' + MONEY.format(k.price) + '</span></label>'; }).join('') + '</div></fieldset>' +
        '<div class="fin-q"><fieldset><legend class="row-h label">Finish ' + info('Stone is bead-blasted aluminium under a matte ceramic coat. It wears in, not off.', 'About the finishes') + '</legend><div class="sws">' +
        '<label class="sw"><input type="radio" name="buy-fin" value="black" checked><i aria-hidden="true"></i>Black</label><label class="sw"><input type="radio" name="buy-fin" value="stone"><i class="st" aria-hidden="true"></i>Stone</label></div></fieldset>' +
        '<fieldset><legend class="row-h label">Quantity</legend><div class="step"><button type="button" data-q="-1" aria-label="One fewer">−</button><span class="qty"></span><button type="button" data-q="1" aria-label="One more">+</button></div></fieldset></div>' +
        '<div class="acts">' + stackBtn('pri add', [['idle', 'Add to bag'], ['loading', ICO.spin + 'Adding…'], ['success', ICO.check + 'Added']]) +
        '<button type="button" class="b b-sec share" aria-haspopup="menu" aria-expanded="false" aria-controls="buy-menu" id="buy-share"><span class="stack"><span data-for="idle" class="on">' + ICO.share + 'Share</span><span data-for="copied" aria-hidden="true">' + ICO.check + 'Link copied</span></span></button>' +
        '<button type="button" class="b b-sec spec" aria-haspopup="dialog">Full spec sheet</button></div>' +
        '<div class="bag label"><span>In your bag <span class="bag-n"></span></span><span class="spacer"></span>' +
        '<button type="button" class="b b-sec hold" aria-describedby="buy-hold-d"><span class="stack"><span data-for="idle" class="on">Hold to clear bag</span><span data-for="done" aria-hidden="true">' + ICO.check + 'Bag cleared</span></span><span class="fill" aria-hidden="true">Hold to clear bag</span></button>' +
        '<span class="sr" id="buy-hold-d">Press and hold for 1.5 seconds to empty the bag.</span></div></div>' +
        '<div class="co"><div class="tray" aria-labelledby="buy-t-title">' +
        '<div class="t-head" hidden><button type="button" class="t-ico is-x" aria-label="Close"><i class="b1"></i><i class="b2"></i><i class="b3"></i></button><h3 class="t-title" id="buy-t-title"><span class="t-tt"></span></h3></div>' +
        '<div class="t-view" data-v="review" hidden></div>' +
        '<div class="t-view" data-v="confirm" hidden><p class="t-big"></p><p class="t-sub">Paid with the demo card ending 4242</p><p class="label t-warn">Nothing is charged</p></div>' +
        '<div class="t-view" data-v="done" hidden><p class="t-sub">This is a demo, no order is placed. In a real shop your LF‑1 would leave Lysekil within four days.</p></div>' +
        '<button type="button" class="b pri t-pri">' + ICO.spin.replace('class="spin"', 'class="spin ico"') + ICO.check.replace('class="ck"', 'class="ck ico"') + '<span class="t-lbl" aria-hidden="true"></span></button></div>' +
        '<p class="sr t-live" aria-live="polite"></p></div><div class="scrim"></div></form></div></div>';

      var grid = $('.buy-grid'), card = $('.card'), cfg = $('.cfg'), priceLive = $('.price-w .sr');
      var price = new Flow($('.price'), MONEY), qtyF = new Flow($('.qty'), INT), bagF = new Flow($('.bag-n'), INT);
      card.addEventListener('submit', function (e) { e.preventDefault(); });

      /* configurator + animated-number-flow price */
      var liveT = 0;
      function total(e) { return KITS[e.kit].price * e.qty; }
      function render(anim) {
        var a = anim && live && !R, t = total(st);
        price.set(t, a, MONEY.format(t) + (st.qty > 1 ? ' for ' + st.qty + ' cameras' : ''));
        qtyF.set(st.qty, a);
        $('[data-q="-1"]').disabled = st.qty <= 1; $('[data-q="1"]').disabled = st.qty >= 9;
        grid.dataset.finish = st.fin; $('.fin-name').textContent = FIN[st.fin];
        $('.buy-cam').setAttribute('aria-label', 'Halden LF‑1, front view, ' + FIN[st.fin].toLowerCase() + ' finish');
        clearTimeout(liveT); if (anim) liveT = later(function () { priceLive.textContent = 'Total ' + MONEY.format(t) + ', ' + item(st) + ', quantity ' + st.qty; }, 350);
      }
      function renderBag(anim) { var n = bag.reduce(function (s, e) { return s + e.qty; }, 0); bagF.set(n, anim && live && !R, n + (n === 1 ? ' camera' : ' cameras') + ' in your bag'); hold.setAttribute('aria-disabled', n ? 'false' : 'true'); }
      root.addEventListener('change', function (e) {
        if (e.target.name === 'buy-kit') st.kit = +e.target.value; else if (e.target.name === 'buy-fin') st.fin = e.target.value; else return;
        ctx.audio.click(.3); render(true);
      });
      $$('[data-q]').forEach(function (b) { b.addEventListener('click', function () { st.qty = ctx.clamp(st.qty + +b.dataset.q, 1, 9); ctx.audio.click(.25); render(true); }); });

      /* button-state-morphs: press mirror for touch + Space, label stack swaps */
      var unpress = function () { $$('[data-pressed]', document).forEach(function (b) { b.removeAttribute('data-pressed'); }); };
      root.addEventListener('pointerdown', function (e) { var b = e.target.closest('.b'); if (b) b.setAttribute('data-pressed', ''); });
      ['pointerup', 'pointercancel'].forEach(function (t) { document.addEventListener(t, unpress); });
      root.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && e.target.classList.contains('b') && !e.repeat) e.target.setAttribute('data-pressed', ''); });
      root.addEventListener('keyup', unpress);
      function swap(btn, to) {
        var from = btn.dataset.state; if (from === to) return;
        $$('.stack > *', btn).forEach(function (s) { var on = s.dataset.for === to; s.classList.toggle('on', on); s.classList.toggle('out', s.dataset.for === from && !on); s.setAttribute('aria-hidden', on ? 'false' : 'true'); });
        btn.dataset.state = to;
      }

      /* Add to bag: idle → (200 ms show-delay) Adding… (≥ 500 ms) → Added ✓ (2 s) → idle, then a toast with Undo */
      var add = $('.add');
      function addToBag() {
        var s = add.dataset.state; if (s === 'loading' || add.getAttribute('aria-busy') === 'true') return;
        var entry = { kit: st.kit, fin: st.fin, qty: st.qty }, shown = 0, done = false;
        add.setAttribute('aria-busy', 'true'); add.setAttribute('aria-disabled', 'true');
        later(function () { if (!done) { swap(add, 'loading'); shown = performance.now(); } }, 200);
        later(function () {
          done = true;
          later(function () {
            bag.push(entry); renderBag(true); swap(add, 'success'); add.removeAttribute('aria-busy'); add.setAttribute('aria-disabled', 'false'); ctx.audio.click(.5);
            ctx.toast('Added to bag', { type: 'success', description: item(entry) + ' × ' + entry.qty, action: { label: 'Undo', onClick: function () { var i = bag.indexOf(entry); if (i > -1) { bag.splice(i, 1); renderBag(true); ctx.toast('Removed from bag', { description: item(entry) }); } } } });
            later(function () { swap(add, 'idle'); }, 2000);
          }, shown ? Math.max(0, 500 - (performance.now() - shown)) : 0);
        }, 650 + Math.random() * 400);
      }
      add.addEventListener('click', addToBag);

      /* Hold to clear bag: clip-path fill, 1.5 s linear while held, 200 ms back; commits on transitionend, then Undo */
      var hold = $('.hold'), fill = $('.fill', hold), holding = false;
      function startHold() { if (hold.getAttribute('aria-disabled') === 'true' || hold.dataset.state === 'done') return; holding = true; hold.classList.add('holding'); }
      function endHold() { if (!holding) return; holding = false; hold.classList.remove('holding'); }
      fill.addEventListener('transitionend', function (e) {
        if (e.propertyName !== 'clip-path' || !holding) return;
        endHold(); var kept = bag.slice(); bag = []; renderBag(true); swap(hold, 'done'); ctx.audio.click(.6);
        ctx.toast('Bag cleared', { description: kept.length + (kept.length === 1 ? ' line' : ' lines') + ' removed', action: { label: 'Undo', onClick: function () { bag = kept.concat(bag); renderBag(true); } } });
        later(function () { swap(hold, 'idle'); renderBag(false); }, 1800);
      });
      hold.addEventListener('pointerdown', function (e) { if (e.button) return; try { hold.setPointerCapture(e.pointerId); } catch (x) {} startHold(); });
      ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach(function (t) { hold.addEventListener(t, endHold); });
      hold.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      hold.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) startHold(); } });
      hold.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); endHold(); } });

      /* layer for fixed UI (tooltips, menu, spec drawer/sheet) — outside <main> so the sheet can scale the page behind it */
      var layer = document.getElementById('buy-layer') || document.body.appendChild(ctx.el('div'));
      layer.id = 'buy-layer';
      var rows = function (list) { return '<dl>' + list.map(function (r) { return '<div class="sh-row"><dt class="label">' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>'; };
      layer.innerHTML =
        '<div class="pop tip" role="tooltip" id="buy-tip" hidden></div>' +
        '<div class="pop bmenu" role="menu" id="buy-menu" aria-labelledby="buy-share" hidden>' +
        '<button type="button" role="menuitem" tabindex="-1" data-act="copy"><span class="mi-ico"><span class="ln">' + ICO.link + '</span>' + ICO.check.replace('class="ck"', 'class="ck"') + '</span><span class="mi-l">Copy link</span></button>' +
        '<a role="menuitem" tabindex="-1" data-act="mail" href="#">' + ICO.mail + '<span>Email</span></a></div>' +
        '<div class="sheet-c"><div role="tablist" aria-label="Spec sheet" class="label">' +
        ['Specs', 'In the box', 'Care'].map(function (t, i) { return '<button type="button" role="tab" class="label" id="buy-tab' + i + '" aria-controls="buy-tp' + i + '" aria-selected="' + !i + '" tabindex="' + (i ? -1 : 0) + '">' + t + '</button>'; }).join('') + '</div>' +
        '<div role="tabpanel" id="buy-tp0" aria-labelledby="buy-tab0" tabindex="0"><p class="sh-big">LF‑1</p>' + rows(SPECS) + '</div>' +
        '<div role="tabpanel" id="buy-tp1" aria-labelledby="buy-tab1" tabindex="0" hidden><p class="sh-big">In the <em>box</em></p>' + rows(BOX) + '</div>' +
        '<div role="tabpanel" id="buy-tp2" aria-labelledby="buy-tab2" tabindex="0" hidden><p class="sh-big">Care</p><p class="sh-p">Wipe the body with a dry cloth after salt air or rain; the seals do the rest. Keep the lens cap on in sand and spray.</p><p class="sh-p">Store batteries at about half charge if the camera rests for a month or more.</p><p class="sh-p">Send it home to Lysekil once a year: sensor cleaning and a seal check are free for life.</p></div>' +
        '<p class="sh-foot label"><span>A fictional camera</span><a href="specs.html" data-go>Full specification <span aria-hidden="true">→</span></a></p></div>' +
        '<div class="sd" hidden><div class="sd-back"></div><aside class="sd-panel" role="dialog" aria-modal="true" aria-label="LF‑1 spec sheet"><div style="display:flex;justify-content:flex-end"><button type="button" class="x-btn label" data-close>Close ✕</button></div><div class="slot"></div></aside></div>' +
        '<div class="bs-ov" aria-hidden="true"></div>' +
        '<div class="bs" role="dialog" aria-modal="true" aria-label="LF‑1 spec sheet" aria-hidden="true" inert><button type="button" class="bs-handle" aria-label="Resize sheet. Arrow keys resize" data-cursor="Drag"><i aria-hidden="true"></i></button>' +
        '<div class="bs-head"><span class="label" style="color:var(--p45)">Halden LF‑1</span><button type="button" class="x-btn label" data-close>Close ✕</button></div><div class="bs-scroll"></div></div>';
      var tip = $('.tip', layer), menu = $('.bmenu', layer), share = $('.share'), content = $('.sheet-c', layer);

      /* origin-aware-popovers: side + flip + shift inside the viewport, origin = trigger centre on the near edge */
      function place(trigger, el, side, align, offset) {
        var t = trigger.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, pad = 8, W = innerWidth, H = innerHeight;
        var room = { top: t.top, bottom: H - t.bottom };
        if (room[side] < h + offset + pad && room[side === 'top' ? 'bottom' : 'top'] > room[side]) side = side === 'top' ? 'bottom' : 'top';
        var y = side === 'bottom' ? t.bottom + offset : t.top - offset - h, x = align === 'end' ? t.right - w : t.left + t.width / 2 - w / 2;
        x = Math.min(Math.max(x, pad), W - pad - w); y = Math.min(Math.max(y, pad), H - pad - h);
        el.style.left = x + 'px'; el.style.top = y + 'px'; el.dataset.side = side;
        el.style.setProperty('--origin', Math.min(Math.max(t.left + t.width / 2 - x, 0), w) + 'px ' + (side === 'bottom' ? 0 : h) + 'px');
      }
      function present(node, open) {
        clearTimeout(node._t);
        if (open) { node.hidden = false; return; }
        node.dataset.state = 'closed';
        var name = getComputedStyle(node).animationName;
        var done = function (e) { if (e && e.target !== node) return; node.removeEventListener('animationend', done); if (node.dataset.state === 'closed') node.hidden = true; };
        if (!name || name === 'none') return done();
        node.addEventListener('animationend', done); node._t = setTimeout(done, 300);
      }
      // tooltip delay group: 700 ms first, instant within 300 ms of the last one closing; touch taps toggle it (toggletip)
      var grp = { delayed: true, skipT: 0, cur: null }, tipT = 0, lastType = '';
      function tipOpen(tr, instant) {
        if (grp.cur && grp.cur !== tr) tipClose();
        grp.cur = tr; clearTimeout(grp.skipT); grp.delayed = false;
        tip.textContent = tr.dataset.tip; tip.hidden = false; place(tr, tip, 'top', 'center', 8);
        tip.dataset.state = instant ? 'instant-open' : 'delayed-open'; tr.setAttribute('aria-describedby', 'buy-tip');
      }
      function tipClose() {
        clearTimeout(tipT); tipT = 0; if (!grp.cur) return;
        grp.cur.removeAttribute('aria-describedby'); grp.cur = null; present(tip, false);
        clearTimeout(grp.skipT); grp.skipT = setTimeout(function () { grp.delayed = true; }, 300);
      }
      $$('.info').forEach(function (tr) {
        tr.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch' || tipT || grp.cur === tr) return; if (grp.delayed) tipT = setTimeout(function () { tipT = 0; tipOpen(tr, false); }, 700); else tipOpen(tr, true); });
        tr.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') tipClose(); });
        tr.addEventListener('pointerdown', function (e) { lastType = e.pointerType; if (e.pointerType !== 'touch') tipClose(); });
        tr.addEventListener('click', function () { if (lastType === 'touch') { if (grp.cur === tr) tipClose(); else { tipOpen(tr, false); clearTimeout(tr._t); tr._t = later(function () { if (grp.cur === tr) tipClose(); }, 3200); } } lastType = ''; });
        tr.addEventListener('focus', function () { if (tr.matches(':focus-visible')) tipOpen(tr, true); });
        tr.addEventListener('blur', tipClose);
      });

      // Share menu: opens on pointerdown (mouse) / click (touch) / Enter, Space, ↓; roving focus, typeahead, Esc + focus return
      var items = $$('[role="menuitem"]', menu), mOpen = false, ta = '', taT = 0;
      $('[data-act="mail"]', menu).href = 'mailto:?subject=' + encodeURIComponent('Halden LF-1') + '&body=' + encodeURIComponent(location.href.split('#')[0] + '#buy');
      function openMenu(focusFirst) {
        if (mOpen) return; mOpen = true; tipClose();
        menu.dataset.state = 'open'; menu.hidden = false; place(share, menu, 'bottom', 'end', 6);
        share.setAttribute('aria-expanded', 'true');
        if (focusFirst) items[0].focus({ preventScroll: true }); else menu.focus ? (menu.tabIndex = -1, menu.focus({ preventScroll: true })) : 0;
        document.addEventListener('pointerdown', outside, true); addEventListener('resize', replace); addEventListener('scroll', replace, true);
      }
      function closeMenu(ret) {
        if (!mOpen) return; mOpen = false; share.setAttribute('aria-expanded', 'false'); present(menu, false);
        document.removeEventListener('pointerdown', outside, true); removeEventListener('resize', replace); removeEventListener('scroll', replace, true);
        if (ret) share.focus({ preventScroll: true });
      }
      function replace() { if (mOpen) place(share, menu, 'bottom', 'end', 6); }
      function outside(e) { if (!menu.contains(e.target) && !share.contains(e.target)) closeMenu(false); }
      share.addEventListener('pointerdown', function (e) { if (e.button || e.pointerType === 'touch') return; e.preventDefault(); mOpen ? closeMenu(false) : openMenu(false); });
      share.addEventListener('click', function (e) { if (e.detail && lastShareType !== 'touch') return; mOpen ? closeMenu(true) : openMenu(!e.detail); });
      var lastShareType = ''; share.addEventListener('pointerdown', function (e) { lastShareType = e.pointerType; }, true);
      share.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); openMenu(true); } });
      menu.addEventListener('pointermove', function (e) { var it = e.target.closest('[role="menuitem"]'); if (it && document.activeElement !== it) it.focus({ preventScroll: true }); });
      menu.addEventListener('keydown', function (e) {
        var i = items.indexOf(document.activeElement), k = e.key;
        if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); items[i < 0 ? 0 : (i + (k === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus(); }
        else if (k === 'Home' || k === 'End') { e.preventDefault(); items[k === 'Home' ? 0 : items.length - 1].focus(); }
        else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMenu(true); }
        else if (k === 'Tab') { e.preventDefault(); closeMenu(true); }
        else if (k.length === 1 && /\S/.test(k)) {                               // typeahead, buffer resets after 1 s
          ta += k.toLowerCase(); clearTimeout(taT); taT = setTimeout(function () { ta = ''; }, 1000);
          var hit = items.filter(function (it) { return it.textContent.trim().toLowerCase().indexOf(ta) === 0; })[0];
          if (hit) hit.focus();
        }
      });
      var copyT = 0;
      function copied(ok) {
        if (!ok) { ctx.toast('Couldn’t copy', { type: 'error', description: location.href }); return closeMenu(true); }
        var ci = $('[data-act="copy"]', menu); ci.classList.add('is-copied'); $('.mi-l', ci).textContent = 'Copied';
        later(function () { closeMenu(true); swap(share, 'copied'); }, 650);
        clearTimeout(copyT); copyT = later(function () { swap(share, 'idle'); ci.classList.remove('is-copied'); $('.mi-l', ci).textContent = 'Copy link'; }, 2000);
      }
      $('[data-act="copy"]', menu).addEventListener('click', function () {
        var url = location.href.split('#')[0] + '#buy';
        var fb = function () { var t = document.createElement('textarea'); t.value = url; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (x) {} t.remove(); return ok; };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(function () { copied(true); }, function () { copied(fb()); }); else copied(fb());
      });
      $('[data-act="mail"]', menu).addEventListener('click', function () { later(function () { closeMenu(false); }, 0); });

      /* morphing-tray checkout: button → review → confirm → Sending… pill → done */
      var S = {
        idle: { label: 'Check out' },
        review: { tray: 1, title: 'Review order', icon: 'x', view: 'review', label: 'Continue', say: 'Review order' },
        confirm: { tray: 1, title: 'Confirm order', icon: 'back', view: 'confirm', label: 'Confirm', btn: 'sig', say: 'Confirm order' },
        sending: { label: 'Sending…', btn: 'drk', ico: 'spin', say: 'Sending' },
        done: { tray: 1, title: 'Thank you', icon: 'x', view: 'done', label: 'Done', say: 'Done. This is a demo, no order is placed.' }
      };
      var tray = $('.tray'), head = $('.t-head'), icon = $('.t-ico'), pri = $('.t-pri'), tlive = $('.t-live'), scrim = $('.scrim');
      var views = { review: $('[data-v="review"]'), confirm: $('[data-v="confirm"]'), done: $('[data-v="done"]') };
      var lbl = new TextMorph($('.t-lbl'), pri, 'center'), ttl = new TextMorph($('.t-tt'), $('.t-tt'), 'left');
      var state = 'idle', anims = [], lifted = [], relT = 0;
      tray.style.setProperty('--d', TDUR + 'ms'); tray.style.setProperty('--e', TEASE);
      lbl.set('Check out', false); pri.setAttribute('aria-label', 'Check out');
      function fillReview() {
        var lines = bag.length ? bag : [{ kit: st.kit, fin: st.fin, qty: st.qty }], sum = lines.reduce(function (s, e) { return s + total(e); }, 0);
        views.review.innerHTML = lines.slice(0, 3).map(function (e) { return '<div class="t-row"><span>' + item(e) + ' × ' + e.qty + '</span><span class="mono">' + MONEY.format(total(e)) + '</span></div>'; }).join('') + (lines.length > 3 ? '<div class="t-row"><span>+ ' + (lines.length - 3) + ' more</span></div>' : '') +
          '<div class="t-row"><span class="label">Shipping</span><span>Free · 2–4 days</span></div><div class="t-row"><span class="label">Total</span><span class="mono">' + MONEY.format(sum) + '</span></div>';
        $('.t-big', views.confirm).textContent = MONEY.format(sum);
      }
      function lift(n) {
        n.classList.add('t-leave'); n.style.bottom = (tray.clientHeight - (n.offsetTop + n.offsetHeight)) + 'px';
        var a = n.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'scale(.97)', filter: 'blur(2px)' }], { duration: R ? 120 : 150, easing: 'ease-in', fill: 'forwards' });
        n._lift = a; lifted.push(n); anims.push(a); a.onfinish = function () { if (n._lift === a) drop(n); };
      }
      function drop(n) { var a = n._lift; n._lift = null; n.hidden = true; n.classList.remove('t-leave'); n.style.bottom = ''; if (a) { a.cancel(); anims = anims.filter(function (x) { return x !== a; }); } }
      function enter(n) { n._lift = null; n.hidden = false; anims.push(n.animate([{ opacity: 0, transform: R ? 'none' : 'translateY(8px)', filter: R ? 'none' : 'blur(2px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: R ? 150 : 300, delay: R ? 0 : 90, easing: EO, fill: 'backwards' })); }
      function go(next, instant) {
        var from = S[state], to = S[next], r = R || instant; if (next === state) return;
        anims.forEach(function (a) { if (a.playState !== 'idle') a.finish(); }); anims = [];
        lifted.forEach(function (n) { if (n._lift) drop(n); }); lifted = [];
        lbl.capture(); if (from.tray && to.tray) ttl.capture();
        var a = tray.getBoundingClientRect();
        if (from.tray && !to.tray) { lift(head); lift(views[from.view]); } else if (from.tray && to.tray && from.view !== to.view) lift(views[from.view]);
        state = next;
        tray.classList.remove('anim'); tray.style.width = tray.style.height = '';
        tray.classList.toggle('is-tray', !!to.tray);
        if (to.tray) { tray.setAttribute('role', 'dialog'); } else tray.removeAttribute('role');
        pri.className = 'b t-pri ' + (to.btn || 'pri') + (to.ico ? ' ico-' + to.ico : '');
        pri.setAttribute('aria-disabled', next === 'sending' ? 'true' : 'false'); tray.setAttribute('aria-busy', next === 'sending' ? 'true' : 'false');
        lbl.set(to.label, !r); pri.setAttribute('aria-label', to.label);
        if (to.tray) {
          icon.className = 't-ico is-' + to.icon; icon.setAttribute('aria-label', to.icon === 'x' ? 'Close' : 'Back');
          ttl.set(to.title, !!from.tray && !r);
          if (!from.tray) enter(head);
          if (from.view !== to.view) enter(views[to.view]);
        }
        var b = tray.getBoundingClientRect();
        cfg.classList.toggle('dim', !!to.tray || next === 'sending'); cfg.inert = !!to.tray || next === 'sending'; scrim.classList.toggle('on', !!to.tray);
        tlive.textContent = to.say || '';
        clearTimeout(relT);
        if (!r) {
          tray.style.width = a.width + 'px'; tray.style.height = a.height + 'px'; tray.offsetWidth;
          tray.classList.add('anim'); tray.style.width = b.width + 'px'; tray.style.height = b.height + 'px';
          relT = setTimeout(function () { tray.classList.remove('anim'); tray.style.width = tray.style.height = ''; }, TDUR + 30);
        }
        if (!instant) { lbl.play(R, TDUR, TEASE); if (from.tray && to.tray) ttl.play(R, TDUR, TEASE); }
        if (next === 'sending') { ctx.audio.shutter(); later(function () { if (state === 'sending') go('done'); }, 1400); }
      }
      pri.addEventListener('click', function () {
        if (state === 'idle') { fillReview(); go('review'); } else if (state === 'review') go('confirm'); else if (state === 'confirm') go('sending');
        else if (state === 'done') { go('idle'); }
      });
      function back() { if (state === 'confirm') go('review'); else if (state === 'review' || state === 'done') { go('idle'); pri.focus({ preventScroll: true }); } }
      icon.addEventListener('click', back);
      scrim.addEventListener('click', function () { if (state === 'review' || state === 'confirm' || state === 'done') { go('idle'); pri.focus({ preventScroll: true }); } });
      card.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S[state].tray) { e.preventDefault(); back(); } });

      /* spec sheet: slide-over-drawer ≥ 768 px, drag-sheet-drawer below; same tabbed content moves between them */
      var tabs = $$('[role="tab"]', content), sd = $('.sd', layer), panel = $('.sd-panel', layer), bs = $('.bs', layer), ov = $('.bs-ov', layer), handle = $('.bs-handle', layer);
      var page = ['main', 'nav', 'coverage'].map(function (id) { return document.getElementById(id); }).filter(Boolean), main = document.getElementById('main');
      var mode = null, lastFocus = null, hideT = 0;
      function stagger(tp) { tp.classList.remove('in'); $$('.sh-row', tp).forEach(function (r, i) { r.style.transitionDelay = R ? '0s' : (.15 + .04 * i).toFixed(2) + 's'; }); void tp.offsetWidth; tp.classList.add('in'); }
      function select(t) { tabs.forEach(function (x) { var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; $('#' + x.getAttribute('aria-controls'), layer).hidden = !on; }); stagger($('#' + t.getAttribute('aria-controls'), layer)); }
      tabs.forEach(function (t) {
        t.addEventListener('click', function () { select(t); });
        t.addEventListener('keydown', function (e) { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); var n = tabs[(tabs.indexOf(t) + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; select(n); n.focus(); });
      });
      function trap(e) {
        if (e.key === 'Escape') { e.preventDefault(); return closeSheet(true); }
        if (e.key !== 'Tab') return;
        var box = mode === 'drawer' ? panel : bs, f = $$('button, a[href], [tabindex="0"]', box).filter(function (n) { return n.tabIndex >= 0 && n.offsetParent && !n.closest('[hidden]'); });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
      function openSheet() {
        if (mode) return; clearTimeout(hideT); closeMenu(false); tipClose();
        lastFocus = document.activeElement; ctx.lockScroll(true); page.forEach(function (n) { n.inert = true; });
        document.addEventListener('keydown', trap);
        stagger($('[role="tabpanel"]:not([hidden])', content));
        if (matchMedia('(min-width: 768px)').matches) {
          mode = 'drawer'; $('.slot', panel).appendChild(content); sd.hidden = false;
          requestAnimationFrame(function () { requestAnimationFrame(function () { sd.classList.add('open'); }); });
          $('[data-close]', panel).focus({ preventScroll: true });
        } else { mode = 'sheet'; $('.bs-scroll', bs).appendChild(content); sheetOpen(); }
      }
      function closeSheet(restore) {
        if (!mode) return; var m = mode; mode = null;
        document.removeEventListener('keydown', trap); page.forEach(function (n) { n.inert = false; });
        if (m === 'drawer') { sd.classList.remove('open'); hideT = setTimeout(function () { sd.hidden = true; }, R ? 200 : 500); } else sheetClose();
        ctx.lockScroll(false);
        if (restore && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      }
      $('.spec').addEventListener('click', openSheet);
      $$('[data-close]', layer).forEach(function (b) { b.addEventListener('click', function () { closeSheet(true); }); });
      $('.sd-back', layer).addEventListener('click', function () { closeSheet(true); });
      $('[data-go]', content).addEventListener('click', function () { closeSheet(false); });

      // drag-sheet-drawer: snaps .5 / 1, 0.4 px/ms step, v > 2 skip, 25 % close, damped overdrag, page scales into a card
      var Hs = 0, offs = [0, 0], idx = 0, sOpen = false, y = 0, drag = null, oy = 0, lastEnd = 0, dampen = function (v) { return 8 * (Math.log(v + 1) - 2); };
      function measure() { Hs = innerHeight - 24; bs.style.height = Hs + 'px'; offs = [Math.round(Hs - innerHeight * .5), 0]; }
      function apply(yy, anim) {
        y = yy; var t = anim && !R ? '.5s ' + EDR : null, s = (innerWidth - 26) / innerWidth;
        var p0 = sOpen ? ctx.clamp((Hs - yy) / Math.max(1, Hs - offs[0]), 0, 1) : 0, p = sOpen ? ctx.clamp((offs[0] - yy) / Math.max(1, offs[0]), 0, 1) : 0;
        bs.style.transition = t ? 'transform ' + t : R ? 'opacity .2s ease' : 'none';
        bs.style.transform = 'translate3d(0,' + yy.toFixed(1) + 'px,0)';
        ov.style.transition = anim ? 'opacity ' + (R ? '.2s ease' : t) : 'none'; ov.style.opacity = (p0 * .55 + p * .45).toFixed(3);
        if (main && !R) { main.style.transition = t ? 'transform ' + t + ', border-radius ' + t : 'none'; main.style.transformOrigin = '50% ' + oy + 'px'; main.style.transform = p ? 'scale(' + (1 - p * (1 - s)).toFixed(4) + ') translate3d(0,' + (14 * p).toFixed(2) + 'px,0)' : ''; main.style.borderRadius = p ? (8 * p).toFixed(1) + 'px' : ''; }
      }
      function snap(i) { idx = i; bs.classList.toggle('top', i === 1); apply(offs[i], true); handle.setAttribute('aria-label', 'Resize sheet, ' + (i ? 'full' : 'half') + ' height. Arrow keys resize'); }
      function sheetOpen() {
        measure(); sOpen = true; oy = main ? -main.getBoundingClientRect().top : 0;
        bs.inert = false; bs.removeAttribute('aria-hidden'); bs.classList.add('vis'); ov.classList.add('on');
        if (R) { bs.style.opacity = '0'; apply(offs[0], false); requestAnimationFrame(function () { bs.style.opacity = '1'; snap(0); }); } else { apply(Hs, false); void bs.offsetHeight; snap(0); }
        handle.focus({ preventScroll: true });
        addEventListener('resize', onResize);
      }
      function sheetClose() {
        sOpen = false; idx = 0; bs.classList.remove('top'); ov.classList.remove('on');
        if (R) bs.style.opacity = '0';
        apply(R ? y : Hs, true); bs.inert = true; bs.setAttribute('aria-hidden', 'true'); removeEventListener('resize', onResize);
        later(function () { if (!sOpen) { bs.classList.remove('vis'); bs.style.opacity = ''; if (main) main.style.cssText = main.style.cssText.replace(/(transition|transform-origin|transform|border-radius)[^;]*;/g, ''); } }, R ? 220 : 520);
      }
      function onResize() { if (sOpen) { measure(); apply(offs[idx], false); } }
      function release(dist, v) {
        var up = dist > 0, cur = offs[idx] - dist;
        if (v > 2) return up ? snap(1) : closeSheet(true);
        if (v > .4 && Math.abs(dist) < innerHeight * .4) { if (!up && idx === 0) return closeSheet(true); return snap(up ? 1 : 0); }
        if (cur - offs[0] > (Hs - offs[0]) * .25) return closeSheet(true);
        snap(Math.abs(cur - offs[0]) < Math.abs(cur - offs[1]) ? 0 : 1);
      }
      var scroller = $('.bs-scroll', bs);
      bs.addEventListener('pointerdown', function (e) { if (!sOpen || drag || e.button) return; drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: Date.now(), on: false, th: e.pointerType === 'touch' ? 10 : 2, dist: 0 }; });
      bs.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
        if (!drag.on) {
          if (Math.abs(dx) <= drag.th && Math.abs(dy) <= drag.th) return;
          var inList = scroller.contains(e.target);                            // a scrolled list wins over the drag
          if (Math.abs(dx) > Math.abs(dy) || (inList && idx === 1 && (dy < 0 || scroller.scrollTop > 0))) { drag = null; return; }
          drag.on = true; try { bs.setPointerCapture(e.pointerId); } catch (x) {}
        }
        drag.dist = drag.y0 - e.clientY;
        var ny = offs[idx] - drag.dist; if (ny < 0) ny = Math.min(-dampen(-ny), 0);
        apply(ny, false);
      });
      var up = function (e) { if (!drag || e.pointerId !== drag.id) return; var d = drag; drag = null; if (!d.on) return; lastEnd = Date.now(); release(d.dist, Math.abs(d.dist) / Math.max(1, Date.now() - d.t0)); };
      bs.addEventListener('pointerup', up); bs.addEventListener('pointercancel', up);
      handle.addEventListener('click', function () { if (Date.now() - lastEnd < 60) return; later(function () { if (idx === 1) closeSheet(true); else snap(1); }, 120); });
      handle.addEventListener('keydown', function (e) { if (e.key === 'ArrowUp') { e.preventDefault(); snap(1); } else if (e.key === 'ArrowDown') { e.preventDefault(); if (idx === 0) closeSheet(true); else snap(0); } });
      ov.addEventListener('click', function () { closeSheet(true); });

      /* ⌘K commands */
      var toBuy = function (fn) { root.scrollIntoView({ behavior: R ? 'auto' : 'smooth', block: 'start' }); later(fn, R ? 50 : 700); };
      ctx.palette.add({ id: 'buy-add', title: 'Add LF‑1 to bag', group: 'Actions', keywords: 'buy cart bag purchase order', run: function () { toBuy(addToBag); } });
      ctx.palette.add({ id: 'buy-spec', title: 'Open spec sheet', group: 'Actions', keywords: 'specs specification drawer details', run: function () { openSheet(); } });

      render(false); renderBag(false);
      if (R) $$('.rise, .buy-title', root).forEach(function (n) { n.classList.add('is-in'); });

      return {
        start: function () { live = true; },
        stop: function () {
          live = false; endHold(); unpress(); tipClose(); closeMenu(false);
          if (state === 'sending') go('done', true);
        },
        enter: function () {
          $('.buy-title').classList.add('is-in');
          $$('.rise', root).forEach(function (n, i) { n.style.transitionDelay = R ? '0s' : (.15 + .12 * i).toFixed(2) + 's'; n.classList.add('is-in'); });
        }
      };
    }
  });
})();
