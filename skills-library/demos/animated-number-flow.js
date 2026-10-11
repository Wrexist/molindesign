/* animated-number-flow — NumberFlow-style digit wheels on a pricing panel, with Intl formats and a live SR label */
(function () {
  var ID = 'animated-number-flow';
  var P = '.d-' + ID + ' ';
  // number-flow 0.6.2 transformTiming easing (900 ms), sampled evenly like CSS linear()
  var EASE = [0,.005,.019,.039,.066,.096,.129,.165,.202,.24,.278,.316,.354,.39,.426,.461,.494,.526,.557,.586,.614,.64,.665,.689,.711,.731,.751,.769,.786,.802,.817,.831,.844,.856,.867,.877,.887,.896,.904,.912,.919,.925,.931,.937,.942,.947,.951,.955,.959,.962,.965,.968,.971,.973,.976,.978,.98,.981,.983,.984,.986,.987,.988,.989,.99,.991,.992,.992,.993,.994,.994,.995,.995,.996,.996,.9963,.9967,.9969,.9972,.9975,.9977,.9979,.9981,.9982,.9984,.9985,.9987,.9988,.9989,1];
  var DUR = 900, FADE = 450;
  function ease(t) { var x = Math.min(t, 1) * (EASE.length - 1), i = Math.floor(x); return i >= EASE.length - 1 ? 1 : EASE[i] + (EASE[i + 1] - EASE[i]) * (x - i); }
  // additive track: like WAAPI composite 'accumulate' — every change adds from→0, the sum is the offset
  function Track() { this.list = []; }
  Track.prototype.add = function (from, now) { if (Math.abs(from) > 1e-4) this.list.push({ f: from, t0: now }); };
  Track.prototype.value = function (now) {
    var s = 0;
    this.list = this.list.filter(function (a) { var k = (now - a.t0) / DUR; if (k >= 1) return false; s += a.f * (1 - ease(k)); return true; });
    return s;
  };
  Track.prototype.clear = function () { this.list = []; };

  // Intl parts → keyed chars (integer pos counted from the ones digit, sections prefixed so pre/post never collide)
  function toParts(value, fmt, suffix) {
    var raw = fmt.formatToParts(value), out = [], seen = {}, sawNum = false;
    if (suffix) raw.push({ type: 'suffix', value: suffix });
    var pos = raw.filter(function (p) { return p.type === 'integer'; }).map(function (p) { return p.value; }).join('').length, frac = 0;
    raw.forEach(function (p) {
      var t = p.type;
      if (t === 'integer') { sawNum = true; p.value.split('').forEach(function (ch) { pos--; out.push({ key: 'i' + pos, digit: true, pos: pos, value: +ch, type: t }); }); }
      else if (t === 'fraction') p.value.split('').forEach(function (ch) { frac--; out.push({ key: 'f' + frac, digit: true, pos: frac, value: +ch, type: t }); });
      else if (t === 'group') out.push({ key: 'g' + pos, value: p.value, type: t });
      else if (t === 'decimal') { sawNum = true; out.push({ key: 'dec', value: p.value, type: t }); }
      else {
        var tt = t === 'minusSign' || t === 'plusSign' ? 'sign' : t, sec = sawNum ? 'post:' : 'pre:';
        seen[sec + tt] = (seen[sec + tt] || 0) + 1;
        out.push({ key: sec + tt + seen[sec + tt], value: p.value, type: tt, pre: !sawNum });
      }
    });
    return out;
  }

  function Flow(host, opts) {
    var self = this;
    this.opts = opts; this.chars = {}; this.order = []; this.raf = 0; this.trend = opts.trend; this.continuous = false;
    host.setAttribute('role', 'img');
    this.host = host;
    this.box = document.createElement('span'); this.box.className = 'anf-box'; this.box.setAttribute('aria-hidden', 'true');
    host.appendChild(this.box);
    this.tick = function () { self.paint(); };
  }
  Flow.prototype.make = function (p) {
    var el = document.createElement('span'), c = { key: p.key, type: p.type, digit: !!p.digit, pos: p.pos, el: el, x: new Track(), spin: new Track(), value: p.digit ? 0 : p.value };
    if (p.digit) {
      el.className = 'anf-d';
      el.innerHTML = '<b>0</b>';
      c.nums = [];
      for (var n = 0; n < 10; n++) { var s = document.createElement('i'); s.textContent = n; el.appendChild(s); c.nums.push(s); }
    } else {
      el.className = 'anf-s t-' + p.type + (p.pre ? ' is-pre' : '');
      var v = document.createElement('i'); v.textContent = p.value; el.appendChild(v); c.cur = v;
    }
    return c;
  };
  Flow.prototype.delta = function (c, value, prev, top) {
    var L = 10, diff = value - prev, dir = this.trend === 0 ? Math.sign(diff) : (this.dirNow || Math.sign(diff));
    if (!diff && this.continuous && this.trend !== 0 && top != null && top >= c.pos && this.dirNow) return L * this.dirNow;
    if (dir < 0 && value > prev) return value - L - prev;
    if (dir > 0 && value < prev) return L - prev + value;
    return diff;
  };
  Flow.prototype.set = function (value, fmt, suffix, animate) {
    var parts = toParts(value, fmt, suffix), now = performance.now(), self = this, keys = {};
    var label = fmt.format(value) + (suffix || '');
    this.host.setAttribute('aria-label', label);
    this.dirNow = this.prevValue == null ? 0 : (typeof this.trend === 'number' ? this.trend : Math.sign(value - this.prevValue));
    this.prevValue = value;
    if (!this.order.length) animate = false; // never animate the first render
    // continuous plugin: highest digit position whose value changed
    var top = null;
    parts.forEach(function (p) { var c = self.chars[p.key]; if (p.digit && (!c || c.value !== p.value) && (top == null || p.pos > top)) top = p.pos; });
    // 1. measure (visual, includes running offsets)
    var before = {};
    this.order.forEach(function (c) { before[c.key] = c.el.getBoundingClientRect().left; });
    // 2. reconcile
    var next = [];
    parts.forEach(function (p) {
      keys[p.key] = true;
      var c = self.chars[p.key], fresh = !c;
      if (fresh) { c = self.make(p); self.chars[p.key] = c; }
      c.revive = !fresh && c.el.classList.contains('is-leaving');
      c.el.classList.remove('is-leaving'); c.el.style.left = ''; c.fresh = fresh;
      if (c.digit) {
        if (animate) c.spin.add(-self.delta(c, p.value, c.value, top), now); else c.spin.clear();
        c.value = p.value;
      } else if (c.value !== p.value) self.swap(c, p.value, animate);
      next.push(c);
    });
    var leaving = this.order.filter(function (c) { return !keys[c.key]; });
    next.forEach(function (c) { self.box.appendChild(c.el); });
    leaving.forEach(function (c) { self.box.appendChild(c.el); });
    this.order = next;
    if (!animate) {
      leaving.forEach(function (c) { c.el.remove(); delete self.chars[c.key]; });
      next.forEach(function (c) { c.x.clear(); c.spin.clear(); });
      this.paint(); return;
    }
    // 3. leavers: pin at their last visual spot, roll to 0, fade, then remove
    var boxLeft = this.box.getBoundingClientRect().left;
    leaving.forEach(function (c) {
      var x0 = c.x.value(now);
      c.el.classList.add('is-leaving');
      c.el.style.left = (before[c.key] - boxLeft - x0) + 'px';
      if (c.digit) { c.spin.add(-self.delta(c, 0, c.value, null), now); c.value = 0; }
      if (c.fade) c.fade.cancel();
      c.fade = c.el.animate([{ opacity: getComputedStyle(c.el).opacity }, { opacity: 0 }], { duration: FADE, easing: 'ease-out', fill: 'forwards' });
      c.fade.onfinish = function () { if (c.el.classList.contains('is-leaving')) { c.el.remove(); if (self.chars[c.key] === c) delete self.chars[c.key]; } };
    });
    // 4. FLIP the rest; new chars fade in where they land (digits roll up from 0)
    next.forEach(function (c) {
      if (c.fresh) {
        c.fade = c.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE, easing: 'ease-out' });
        if (c.digit) { c.spin.clear(); c.spin.add(-self.delta(c, c.value, 0, null), now); }
      } else if (c.revive) {
        if (c.fade) c.fade.cancel();
        c.fade = c.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE, easing: 'ease-out' });
      } else {
        if (c.fade) { c.fade.cancel(); c.fade = null; }
        if (before[c.key] != null) c.x.add(before[c.key] - c.el.getBoundingClientRect().left, now);
      }
    });
    this.run();
  };
  Flow.prototype.swap = function (c, value, animate) {
    var old = c.cur, nv = document.createElement('i');
    nv.textContent = value; c.el.appendChild(nv); c.cur = nv; c.value = value;
    if (!animate) { old.remove(); return; }
    old.className = 'old';
    nv.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FADE, easing: 'ease-out' });
    old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE, easing: 'ease-out', fill: 'forwards' }).onfinish = function () { old.remove(); };
  };
  Flow.prototype.run = function () { if (!this.raf) this.raf = requestAnimationFrame(this.tick); };
  Flow.prototype.paint = function () {
    this.raf = 0;
    var now = performance.now(), busy = false, self = this;
    Object.keys(this.chars).forEach(function (k) {
      var c = self.chars[k], x = c.x.value(now);
      c.el.style.transform = Math.abs(x) > .01 ? 'translateX(' + x.toFixed(2) + 'px)' : '';
      if (c.x.list.length) busy = true;
      if (c.digit) {
        var pos = c.value + c.spin.value(now);
        if (c.spin.list.length) busy = true;
        for (var n = 0; n < 10; n++) {
          var o = ((n - pos) % 10 + 10) % 10; if (o >= 5) o -= 10;
          var s = c.nums[n];
          if (Math.abs(o) < .98) { s.style.visibility = ''; s.style.transform = 'translateY(' + (o * 100).toFixed(2) + '%)'; } else s.style.visibility = 'hidden';
        }
      }
    });
    if (busy && !this.halted) this.run();
  };
  Flow.prototype.halt = function () { this.halted = true; cancelAnimationFrame(this.raf); this.raf = 0; var s = this; Object.keys(s.chars).forEach(function (k) { s.chars[k].x.clear(); s.chars[k].spin.clear(); }); this.paint(); };
  Flow.prototype.resume = function () { this.halted = false; };

  var CUR = { USD: ['en-US', 1], EUR: ['de-DE', .92], SEK: ['sv-SE', 10.45], JPY: ['ja-JP', 151] };
  var BASE = { mo: 24, yr: 228 };

  Lib.register(ID, {
    hint: 'Change plan, currency and seats, or hit Shuffle. Watch digits roll, separators fade in, decimals leave for JPY.',
    notes: [
      'Each digit is a 0–9 wheel keyed by place value from the ones digit, so <code>999 → 1,000</code> adds a wheel on the left',
      'Spin + layout: <b>900 ms</b> spring-like <code>linear()</code> (half-way by ~170 ms); enter/exit fades <b>450 ms ease-out</b>',
      'Default trend <code>Math.sign(new − old)</code>; with <i>Continuous</i>, unchanged lower digits do a full turn',
      'Updates add up (composite accumulate), so rapid clicks never jump; new digits roll in from 0, leaving ones roll to 0',
      'The number is <code>role="img"</code> with the formatted string as its label; a polite live region announces the total'
    ],
    simplified: 'Reimplemented without NumberFlow: no shadow DOM or CSS mod(); offsets are summed in one rAF, and the width change is a per-character FLIP instead of a scaleX on the whole number.',
    css: [
      '.d-animated-number-flow { container-type: inline-size; }',
      P + '.anf { position: absolute; inset: 0; display: flex; flex-direction: column; padding: 22px clamp(16px, 4cqw, 36px) 18px; background: radial-gradient(90% 70% at 50% 42%, rgb(249 115 22 / .07), transparent 70%); }',
      P + '.anf-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; color: rgb(255 255 255 / .55); }',
      P + '.anf-top b { color: #fff; font-weight: 500; }',
      P + '.anf-mid { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 0; }',
      P + '.anf-price { font-family: Archivo, sans-serif; font-stretch: 100%; font-weight: 500; font-size: clamp(30px, 9.6cqw, 100px); letter-spacing: -.035em; color: #fff; font-variant-numeric: tabular-nums; line-height: 1; }',
      P + '.anf-box { position: relative; display: inline-flex; align-items: baseline; white-space: nowrap; padding: .25em .1em; overflow-x: visible; overflow-y: clip; -webkit-mask-image: linear-gradient(to bottom, transparent, #000 .25em, #000 calc(100% - .25em), transparent); mask-image: linear-gradient(to bottom, transparent, #000 .25em, #000 calc(100% - .25em), transparent); }',
      P + '.anf-d, ' + P + '.anf-s { position: relative; display: inline-block; }',
      P + '.anf-d b { visibility: hidden; font-weight: inherit; }',
      P + '.anf-d i { position: absolute; left: 0; right: 0; top: 0; text-align: center; font-style: normal; }',
      P + '.anf-s i { display: inline-block; font-style: normal; white-space: pre; }',
      P + '.anf-s i.old { position: absolute; top: 0; left: 0; } ' + P + '.anf-s.is-pre i.old { left: auto; right: 0; }',
      P + '.is-leaving { position: absolute !important; top: .25em; pointer-events: none; }',
      P + '.anf-price .t-currency { font-size: .5em; margin-left: .08em; color: rgb(255 255 255 / .75); letter-spacing: 0; } ' + P + '.anf-price .t-currency.is-pre { align-self: flex-start; margin: .32em .08em 0; }',
      P + '.anf-price .t-suffix { font-size: .3em; margin-left: .3em; color: rgb(255 255 255 / .45); letter-spacing: 0; font-weight: 400; }',
      P + '.anf-price .t-literal { font-size: .5em; }',
      P + '.anf-sub { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; color: rgb(255 255 255 / .5); }',
      P + '.anf-chg { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px 4px 8px; border-radius: 999px; background: rgb(255 255 255 / .06); color: rgb(255 255 255 / .8); font-family: Archivo, sans-serif; font-size: 13px; font-variant-numeric: tabular-nums; transition: background-color .25s, color .25s; }',
      P + '.anf-chg.up { color: #f97316; background: rgb(249 115 22 / .12); } ' + P + '.anf-chg .ar { display: inline-block; font-size: 10px; transition: transform .3s cubic-bezier(.23,1,.32,1); } ' + P + '.anf-chg.down .ar { transform: rotate(180deg); }',
      P + '.anf-chg .anf-box { padding: .25em 0; }',
      P + '.anf-ctl { display: flex; flex-wrap: wrap; gap: 8px 10px; justify-content: center; align-items: center; }',
      P + '.anf-seg { display: inline-flex; padding: 3px; border-radius: 999px; background: rgb(255 255 255 / .06); border: 1px solid rgb(255 255 255 / .08); }',
      P + '.anf-seg button, ' + P + '.anf-btn { min-height: 34px; padding: 0 12px; border-radius: 999px; color: rgb(255 255 255 / .6); transition: color .16s, background-color .16s, transform .16s cubic-bezier(.25,.46,.45,.94); touch-action: manipulation; }',
      P + '.anf-seg button[aria-pressed="true"] { background: #fff; color: #000; }',
      P + '.anf-btn { border: 1px solid rgb(255 255 255 / .14); color: rgb(255 255 255 / .85); }',
      P + '.anf-btn[aria-pressed="true"] { border-color: #f97316; color: #f97316; }',
      P + '.anf-seg button:active, ' + P + '.anf-btn:active { transform: scale(.97); }',
      '@media (hover: hover) { ' + P + '.anf-seg button:not([aria-pressed="true"]):hover, ' + P + '.anf-btn:hover { color: #fff; } }',
      P + '.anf-seats { display: inline-flex; align-items: center; gap: 2px; padding: 3px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .14); }',
      P + '.anf-seats button { width: 32px; height: 32px; border-radius: 50%; font-size: 16px; color: rgb(255 255 255 / .85); transition: background-color .16s, transform .16s; }',
      P + '.anf-seats button:active { transform: scale(.94); } @media (hover: hover) { ' + P + '.anf-seats button:hover { background: rgb(255 255 255 / .08); } }',
      P + '.anf-seats .anf-n { min-width: 4.6em; text-align: center; color: #fff; font-family: Archivo, sans-serif; font-size: 13px; font-variant-numeric: tabular-nums; }',
      P + '.anf-seats .anf-n .anf-box { padding: .25em 0; }',
      P + '.anf-sr { display: flex; justify-content: center; gap: 8px; margin-top: 12px; color: rgb(255 255 255 / .35); min-width: 0; }',
      P + '.anf-sr code { color: rgb(255 255 255 / .75); background: none; padding: 0; text-transform: none; letter-spacing: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
      P + '.anf-vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }',
      '@container (max-width: 520px) { ' + P + '.anf-top .opt { display: none; } ' + P + '.anf-seg button, ' + P + '.anf-btn { padding: 0 10px; min-height: 32px; } ' + P + '.anf-ctl { gap: 8px; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      stage.innerHTML =
        '<div class="anf">' +
          '<div class="anf-top label"><span><b>Team plan</b> <span class="opt">· billed per seat</span></span><span class="opt">Intl.NumberFormat</span></div>' +
          '<div class="anf-mid">' +
            '<div class="anf-price"></div>' +
            '<div class="anf-sub label"><span class="anf-chg"><span class="ar" aria-hidden="true">▲</span><span class="anf-pct"></span></span><span>per month vs. previous</span></div>' +
          '</div>' +
          '<div class="anf-ctl label">' +
            '<span class="anf-seg" role="group" aria-label="Billing period"><button type="button" class="label" data-plan="mo" aria-pressed="true">Monthly</button><button type="button" class="label" data-plan="yr" aria-pressed="false">Yearly</button></span>' +
            '<span class="anf-seg" role="group" aria-label="Currency">' + Object.keys(CUR).map(function (k, i) { return '<button type="button" class="label" data-cur="' + k + '" aria-pressed="' + (i ? 'false' : 'true') + '">' + k + '</button>'; }).join('') + '</span>' +
            '<span class="anf-seats" role="group" aria-label="Seats"><button type="button" data-step="-1" aria-label="Remove a seat">−</button><span class="anf-n"></span><button type="button" data-step="1" aria-label="Add a seat">+</button></span>' +
            '<button type="button" class="anf-btn label" data-shuffle>Shuffle</button>' +
            '<button type="button" class="anf-btn label" data-cont aria-pressed="false">Continuous</button>' +
          '</div>' +
          '<p class="anf-sr label" aria-hidden="true"><span>aria-label</span><code class="mono"></code></p>' +
          '<p class="anf-vh" aria-live="polite"></p>' +
        '</div>';
      var $ = function (s) { return stage.querySelector(s); };
      var price = new Flow($('.anf-price'), {}), pct = new Flow($('.anf-pct'), {}), seatsF = new Flow($('.anf-n'), {});
      var chg = $('.anf-chg'), srOut = $('.anf-sr code'), live = $('.anf-vh');
      var st = { plan: 'mo', cur: 'USD', seats: 3 }, lastUsd = null, liveT = 0, timer = 0, auto = !ctx.reduced, live_ = false, step = 0;
      var pctFmt = new Intl.NumberFormat('en-US', { style: 'percent', signDisplay: 'exceptZero', minimumFractionDigits: 1, maximumFractionDigits: 1 });
      var seatFmt = new Intl.NumberFormat('en-US');

      function render(animate) {
        var c = CUR[st.cur], usd = st.seats * BASE[st.plan], val = usd * c[1], perMo = usd / (st.plan === 'mo' ? 1 : 12);
        var fmt = new Intl.NumberFormat(c[0], { style: 'currency', currency: st.cur });
        var suffix = st.plan === 'mo' ? '/mo' : '/yr';
        var anim = animate && !ctx.reduced && live_;
        price.set(val, fmt, suffix, anim);
        if (lastUsd !== null && perMo !== lastUsd) {
          var d = (perMo - lastUsd) / lastUsd; // compare the monthly equivalent, so Yearly reads as a saving
          pct.set(d, pctFmt, '', anim);
          chg.classList.toggle('up', d > 0); chg.classList.toggle('down', d < 0);
        } else if (lastUsd === null) pct.set(0, pctFmt, '', false);
        lastUsd = perMo;
        seatsF.set(st.seats, seatFmt, st.seats === 1 ? ' seat' : ' seats', anim);
        var label = price.host.getAttribute('aria-label');
        srOut.textContent = '“' + label + '”';
        stage.querySelectorAll('[data-plan]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.plan === st.plan ? 'true' : 'false'); });
        stage.querySelectorAll('[data-cur]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.cur === st.cur ? 'true' : 'false'); });
        clearTimeout(liveT);
        liveT = setTimeout(function () { live.textContent = 'Total ' + label.replace('/mo', ' per month').replace('/yr', ' per year') + ' for ' + st.seats + (st.seats === 1 ? ' seat' : ' seats'); }, 350);
      }
      // a scripted tour until the viewer touches anything
      var script = [
        function () { st.seats = 4; }, function () { st.plan = 'yr'; }, function () { st.seats = 12; }, function () { st.cur = 'EUR'; },
        function () { st.seats = 9; }, function () { st.cur = 'JPY'; }, function () { st.plan = 'mo'; }, function () { st.cur = 'USD'; st.seats = 3; }
      ];
      function tour() { clearTimeout(timer); if (!auto || !live_) return; timer = setTimeout(function () { script[step++ % script.length](); render(true); tour(); }, 2400); }
      function user() { if (auto) { auto = false; clearTimeout(timer); } }
      stage.addEventListener('pointerdown', user);
      stage.addEventListener('keydown', user);
      stage.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        user();
        if (b.dataset.plan) st.plan = b.dataset.plan;
        else if (b.dataset.cur) st.cur = b.dataset.cur;
        else if (b.dataset.step) st.seats = ctx.clamp(st.seats + +b.dataset.step, 1, 99);
        else if (b.hasAttribute('data-shuffle')) { var n; do { n = 1 + Math.floor(Math.random() * 99); } while (n === st.seats); st.seats = n; }
        else if (b.hasAttribute('data-cont')) {
          var on = b.getAttribute('aria-pressed') !== 'true';
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          price.continuous = pct.continuous = seatsF.continuous = on;
          return;
        }
        render(true);
      });
      render(false);

      return {
        start: function () { live_ = true; [price, pct, seatsF].forEach(function (f) { f.resume(); }); tour(); },
        stop: function () { live_ = false; clearTimeout(timer); clearTimeout(liveT); [price, pct, seatsF].forEach(function (f) { f.halt(); }); },
        replay: function () { auto = !ctx.reduced; step = 0; st = { plan: 'mo', cur: 'USD', seats: 3 }; render(true); tour(); }
      };
    }
  });
})();
