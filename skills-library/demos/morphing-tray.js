/* morphing-tray — Family-style tray: one container morphs pill → sheet → sheet → pill, shared-letter text morph, ✕ → ← icon morph */
(function () {
  var ID = 'morphing-tray';
  var EASE_OUT = 'cubic-bezier(.23,1,.32,1)';
  // damped spring sampled into CSS linear(): stiffness 300, damping 26, mass 1 → ζ≈0.75, ~2.8 % overshoot, ~460 ms
  function springLinear(k, c, steps) {
    var w0 = Math.sqrt(k), z = c / (2 * w0), wd = w0 * Math.sqrt(1 - z * z), T = 6 / (z * w0), pts = [];
    for (var i = 0; i < steps; i++) { var t = i / steps * T; pts.push((1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + z * w0 / wd * Math.sin(wd * t))).toFixed(4)); }
    pts.push('1');
    return { easing: 'linear(' + pts.join(',') + ')', ms: Math.round(T * 1000) };
  }
  var SP = springLinear(300, 26, 48);
  var EASE = (window.CSS && CSS.supports && CSS.supports('transition-timing-function', SP.easing)) ? SP.easing : 'cubic-bezier(.32,.72,0,1)';
  var DUR = EASE === SP.easing ? SP.ms : 500;
  var S = {
    idle: { tray: false, label: 'Send $240', btn: 'light', say: '' },
    review: { tray: true, title: 'Review send', icon: 'x', view: 'review', label: 'Continue', btn: 'light', say: 'Review send' },
    confirm: { tray: true, title: 'Confirm send', icon: 'back', view: 'confirm', label: 'Confirm', btn: 'accent', say: 'Confirm send' },
    sending: { tray: false, label: 'Sending…', btn: 'dark', ico: 'spin', say: 'Sending' },
    sent: { tray: false, label: 'Sent', btn: 'dark', ico: 'check', say: 'Sent, $240 to Maya Lind' }
  };

  /* shared-letter text morph: glyphs keyed by char + occurrence; positions relative to the frame's centre or left edge */
  function TextMorph(el, frame, anchor) {
    this.el = el; this.frame = frame; this.anchor = anchor; this.text = ''; this.anims = [];
  }
  TextMorph.prototype.rel = function (n) {
    var r = n.getBoundingClientRect(), f = this.frame.getBoundingClientRect();
    return r.left - (this.anchor === 'center' ? f.left + f.width / 2 : f.left);
  };
  TextMorph.prototype.capture = function () {
    var self = this;
    this.anims.forEach(function (a) { a.finish(); }); this.anims = [];
    this.el.querySelectorAll('.mt-ghost').forEach(function (g) { g.remove(); });
    this.old = Array.prototype.map.call(this.el.children, function (s) { return { s: s, x: self.rel(s) }; });
  };
  TextMorph.prototype.set = function (text, animate) {
    var seen = {}, pool = {}, self = this;
    (this.old || []).forEach(function (o) { pool[o.s.dataset.k] = o; });
    if (this.el.getAttribute('aria-hidden')) this.el.parentNode.setAttribute('aria-label', text);
    this.reused = []; this.fresh = [];
    var spans = text.split('').map(function (ch) {
      var k = ch + (seen[ch] = (seen[ch] || 0) + 1), o = pool[k];
      if (o && animate) { delete pool[k]; self.reused.push(o); return o.s; }
      var s = document.createElement('span'); s.dataset.k = k; s.textContent = ch === ' ' ? ' ' : ch;
      self.fresh.push(s); return s;
    });
    this.gone = animate ? Object.keys(pool).map(function (k) { return pool[k]; }) : [];
    this.el.textContent = ''; spans.forEach(function (s) { self.el.appendChild(s); });
    this.text = text; this.old = null;
  };
  TextMorph.prototype.play = function (reduced) {
    var self = this, base = this.rel(this.el), push = function (a) { self.anims.push(a); return a; };
    if (reduced) { push(this.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 })); return; }
    this.reused.forEach(function (o) {
      var dx = o.x - self.rel(o.s);
      if (Math.abs(dx) > .5) push(o.s.animate([{ transform: 'translateX(' + dx + 'px)' }, { transform: 'none' }], { duration: DUR, easing: EASE }));
    });
    this.fresh.forEach(function (s, i) {
      push(s.animate([{ opacity: 0, filter: 'blur(4px)', transform: 'translateY(.3em)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }],
        { duration: 380, delay: 60 + i * 16, easing: EASE_OUT, fill: 'backwards' }));
    });
    this.gone.forEach(function (o) {
      var g = o.s; g.className = 'mt-ghost'; g.style.left = (o.x - base) + 'px'; self.el.appendChild(g);
      var a = push(g.animate([{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(4px)', transform: 'translateY(-.25em)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' }));
      a.onfinish = function () { g.remove(); };
    });
  };

  Lib.register(ID, {
    hint: 'Press Send, then Continue, Confirm. Try ← back, Fee details and Esc. Watch “Continue” keep its “Con”.',
    notes: [
      'The tray animates its real <code>width/height</code> (measure → lock → animate → release to <code>auto</code>) on a damped spring sampled into CSS <code>linear()</code>: 300/26 → ~460 ms, ~3 % overshoot',
      'Family’s rule: every step has a different height, so the change is unmistakable. The primary button never moves, so its label can morph in place',
      'Text morph keys glyphs by <code>char + occurrence</code>: shared letters slide (FLIP), new ones blur in with a 16 ms stagger, leaving ones blur out over 200 ms',
      'Leaving content is lifted out of flow (Motion’s <code>popLayout</code> idea) and fades in 150 ms while the size keeps moving. Fee details uses the <code>grid-template-rows 0fr → 1fr</code> trick',
      'Focus stays on the persistent button (<code>aria-disabled</code>, not <code>disabled</code>, while sending). Esc steps back, status goes to a live region, and reduced motion snaps sizes'
    ],
    simplified: 'Family publishes no code or timings, so the curves are mine. The tray is contained in the stage instead of sitting over a real app, and nothing grows into a full screen.',
    css: [
      '.d-morphing-tray { container-type: inline-size; background: radial-gradient(80% 60% at 50% 0%, #121110, #000 70%); }',
      '.d-morphing-tray .mt-app { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; padding: clamp(28px, 7cqw, 52px) 20px 0; transition: opacity .4s, filter .4s, transform .5s ' + EASE_OUT + '; }',
      '.d-morphing-tray .mt-app.dim { opacity: .3; filter: blur(2px); transform: scale(.985); }',
      '.d-morphing-tray .mt-cap { color: rgb(255 255 255 / .58); margin: 0; }',
      '.d-morphing-tray .mt-bal { font-family: Archivo, sans-serif; font-stretch: 125%; font-size: clamp(34px, 6.4cqw, 54px); line-height: 1.1; margin: 8px 0 22px; color: #fff; font-variant-numeric: tabular-nums; }',
      '.d-morphing-tray .mt-acts { width: min(380px, 100%); list-style: none; margin: 0; padding: 0; }',
      '.d-morphing-tray .mt-acts li { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid rgb(255 255 255 / .07); font-size: 14px; color: rgb(255 255 255 / .85); }',
      '.d-morphing-tray .mt-av { width: 32px; height: 32px; flex: none; border-radius: 50%; display: grid; place-items: center; font-size: 11px; color: #fff; background: #2a2725; }',
      '.d-morphing-tray .mt-acts .amt { margin-left: auto; color: rgb(255 255 255 / .62); font-variant-numeric: tabular-nums; }',
      '.d-morphing-tray .mt-scrim { position: absolute; inset: 0; z-index: 2; display: none; }',
      '.d-morphing-tray .mt-scrim.on { display: block; }',
      '.d-morphing-tray .mt-tray { position: absolute; z-index: 3; left: 50%; bottom: 18px; transform: translateX(-50%); display: flex; flex-direction: column; overflow: hidden; border-radius: 26px; padding: 0; background: rgb(18 18 18 / 0); border: 1px solid rgb(255 255 255 / 0); box-shadow: 0 0 0 rgb(0 0 0 / 0); }',
      '.d-morphing-tray .mt-tray.is-tray { width: min(380px, calc(100% - 32px)); padding: 6px 8px 8px; border-radius: 34px; background: rgb(18 18 18 / .96); border-color: rgb(255 255 255 / .09); box-shadow: 0 30px 80px rgb(0 0 0 / .7); }',
      '.d-morphing-tray .mt-tray.anim { transition: width var(--d) var(--e), height var(--d) var(--e), padding var(--d) var(--e), border-radius var(--d) var(--e), background-color .35s, border-color .35s, box-shadow .5s; }',
      '.d-morphing-tray .mt-head[hidden], .d-morphing-tray .mt-view[hidden] { display: none; }',
      '.d-morphing-tray .mt-head { display: flex; align-items: center; gap: 10px; padding: 6px 4px 2px; }',
      '.d-morphing-tray .mt-title { position: relative; font-family: Archivo, sans-serif; font-stretch: 112%; font-size: 17px; color: #fff; white-space: nowrap; margin: 0; }',
      '.d-morphing-tray .mt-icon { position: relative; width: 38px; height: 38px; flex: none; border-radius: 50%; background: rgb(255 255 255 / .07); transition: background-color .2s; }',
      '.d-morphing-tray .mt-icon:hover { background: rgb(255 255 255 / .13); }',
      '.d-morphing-tray .mt-icon i { position: absolute; left: 11px; top: 18px; width: 16px; height: 2px; border-radius: 2px; background: #fff; transition: transform .32s ' + EASE_OUT + '; }',
      '.d-morphing-tray .is-x .b1 { transform: translate(0, 0) rotate(45deg) scaleX(1); } .d-morphing-tray .is-x .b2 { transform: translate(0, 0) rotate(-45deg) scaleX(1); } .d-morphing-tray .is-x .b3 { transform: scaleX(0); }',
      '.d-morphing-tray .is-back .b1 { transform: translate(-4.2px, -2.8px) rotate(-45deg) scaleX(.5); } .d-morphing-tray .is-back .b2 { transform: translate(-4.2px, 2.8px) rotate(45deg) scaleX(.5); } .d-morphing-tray .is-back .b3 { transform: scaleX(.875); }',
      '.d-morphing-tray .mt-view { padding: 10px 6px 14px; }',
      '.d-morphing-tray .mt-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; font-size: 14px; color: #fff; border-top: 1px solid rgb(255 255 255 / .07); }',
      '.d-morphing-tray .mt-row:first-child { border-top: 0; } .d-morphing-tray .mt-row .label { color: rgb(255 255 255 / .58); }',
      '.d-morphing-tray .mt-to { display: inline-flex; align-items: center; gap: 8px; } .d-morphing-tray .mt-to .mt-av { width: 24px; height: 24px; font-size: 9px; background: #f97316; color: #000; }',
      '.d-morphing-tray .mt-more-b { display: inline-flex; align-items: center; gap: 6px; padding: 6px 0; color: rgb(255 255 255 / .62); }',
      '.d-morphing-tray .mt-more-b:hover { color: #fff; } .d-morphing-tray .mt-more-b svg { width: 10px; transition: transform .35s ' + EASE_OUT + '; }',
      '.d-morphing-tray .mt-more-b[aria-expanded=true] svg { transform: rotate(180deg); }',
      '.d-morphing-tray .mt-more { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .35s ' + EASE_OUT + ', opacity .35s; opacity: 0; }',
      '.d-morphing-tray .mt-more.open { grid-template-rows: 1fr; opacity: 1; } .d-morphing-tray .mt-more > div { min-height: 0; overflow: hidden; }',
      '.d-morphing-tray .mt-more p { margin: 0; padding: 2px 0 4px; font-size: 13px; color: rgb(255 255 255 / .62); }',
      '.d-morphing-tray .mt-big { font-family: Archivo, sans-serif; font-stretch: 125%; font-size: 40px; line-height: 1; color: #fff; margin: 4px 0 6px; }',
      '.d-morphing-tray .mt-sub { margin: 0; font-size: 14px; color: rgb(255 255 255 / .7); }',
      '.d-morphing-tray .mt-warn { display: flex; align-items: center; gap: 8px; margin: 12px 0 0; color: rgb(255 255 255 / .62); }',
      '.d-morphing-tray .mt-warn::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #f97316; box-shadow: 0 0 8px #f97316; }',
      '.d-morphing-tray .mt-leaving { position: absolute; left: 8px; right: 8px; pointer-events: none; }',
      '.d-morphing-tray .mt-primary { position: relative; height: 52px; flex: none; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 26px; border-radius: 26px; background: #fff; color: #000; font-size: 15px; font-weight: 600; white-space: nowrap; transition: background-color .35s, color .35s, transform .15s ' + EASE_OUT + '; }',
      '.d-morphing-tray .mt-primary:active { transform: scale(.97); } .d-morphing-tray .mt-primary[aria-disabled=true] { cursor: default; transform: none; }',
      '.d-morphing-tray .mt-primary.accent { background: #f97316; color: #000; } .d-morphing-tray .mt-primary.dark { background: #1b1b1b; color: #fff; box-shadow: inset 0 0 0 1px rgb(255 255 255 / .1); }',
      '.d-morphing-tray .mt-primary:focus-visible { outline-offset: 4px; }',
      '.d-morphing-tray .mt-lbl { position: relative; display: inline-flex; }',
      '.d-morphing-tray .mt-lbl span { display: inline-block; white-space: pre; } .d-morphing-tray .mt-lbl .mt-ghost { position: absolute; top: 0; }',
      '.d-morphing-tray .mt-ico { display: none; width: 16px; height: 16px; }',
      '.d-morphing-tray .ico-spin .mt-spin, .d-morphing-tray .ico-check .mt-check { display: block; }',
      '.d-morphing-tray .mt-spin { border-radius: 50%; border: 2px solid rgb(255 255 255 / .2); border-top-color: #f97316; animation: mt-spin .8s linear infinite; }',
      '@keyframes mt-spin { to { transform: rotate(360deg); } }',
      '.d-morphing-tray .mt-check path { stroke-dasharray: 20; stroke-dashoffset: 20; } .d-morphing-tray .ico-check .mt-check path { animation: mt-draw .45s .1s ' + EASE_OUT + ' forwards; }',
      '@keyframes mt-draw { to { stroke-dashoffset: 0; } }',
      '.d-morphing-tray .mt-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }',
      '@container (max-width: 520px) { .d-morphing-tray .mt-acts li:nth-child(3) { display: none; } .d-morphing-tray .mt-big { font-size: 34px; } }',
      '@media (prefers-reduced-motion: reduce) { .d-morphing-tray .mt-spin { animation-duration: 2.4s; } .d-morphing-tray .ico-check .mt-check path { animation: none; stroke-dashoffset: 0; } .d-morphing-tray .mt-app { transition: opacity .2s; } .d-morphing-tray .mt-app.dim { filter: none; transform: none; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      stage.innerHTML =
        '<div class="mt-app"><p class="label mt-cap">Balance</p><p class="mt-bal">$4,812.40</p><ul class="mt-acts">' +
        '<li><span class="mt-av">ML</span>Maya Lind<span class="amt">−$64.00</span></li><li><span class="mt-av">OS</span>Oskar Sund<span class="amt">+$1,200.00</span></li>' +
        '<li><span class="mt-av">AK</span>Ana Kim<span class="amt">−$18.50</span></li></ul></div>' +
        '<div class="mt-scrim"></div>' +
        '<section class="mt-tray" aria-labelledby="mt-title-' + ctx.id + '">' +
        '<div class="mt-head" hidden><button type="button" class="mt-icon is-x" aria-label="Close"><i class="b1"></i><i class="b2"></i><i class="b3"></i></button>' +
        '<h4 class="mt-title" id="mt-title-' + ctx.id + '"><span class="mt-tt"></span></h4></div>' +
        '<div class="mt-view" data-v="review" hidden>' +
        '<div class="mt-row"><span class="label">To</span><span class="mt-to"><span class="mt-av">ML</span>Maya Lind</span></div>' +
        '<div class="mt-row"><span class="label">Amount</span><span>$240.00</span></div>' +
        '<div class="mt-row"><span class="label">Fee</span><button type="button" class="mt-more-b label" aria-expanded="false">$0.12 details<svg viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg></button></div>' +
        '<div class="mt-more"><div><p>Base fee $0.10 · Priority $0.02 · Arrives in ~15 s</p></div></div></div>' +
        '<div class="mt-view" data-v="confirm" hidden><p class="mt-big">$240.00</p><p class="mt-sub">to Maya Lind, from Everyday</p><p class="label mt-warn">Payments can’t be reversed</p></div>' +
        '<button type="button" class="mt-primary"><span class="mt-ico mt-spin" aria-hidden="true"></span>' +
        '<svg class="mt-ico mt-check" viewBox="0 0 16 16" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>' +
        '<span class="mt-lbl" aria-hidden="true"></span></button></section><p class="mt-live" aria-live="polite"></p>';

      var app = stage.querySelector('.mt-app'), scrim = stage.querySelector('.mt-scrim'), tray = stage.querySelector('.mt-tray');
      var head = stage.querySelector('.mt-head'), icon = stage.querySelector('.mt-icon'), btn = stage.querySelector('.mt-primary');
      var views = { review: stage.querySelector('[data-v=review]'), confirm: stage.querySelector('[data-v=confirm]') };
      var moreB = stage.querySelector('.mt-more-b'), more = stage.querySelector('.mt-more'), live = stage.querySelector('.mt-live');
      var label = new TextMorph(stage.querySelector('.mt-lbl'), btn, 'center');
      var title = new TextMorph(stage.querySelector('.mt-tt'), stage.querySelector('.mt-tt'), 'left');
      var state = 'idle', timers = [], anims = [], lifted = [], releaseT = 0, onKeyBound = false;
      tray.style.setProperty('--d', DUR + 'ms'); tray.style.setProperty('--e', EASE);
      label.set(S.idle.label, false);

      function lift(n) {                                     // take a leaving block out of flow, anchored to the tray bottom
        var bottom = tray.clientHeight - (n.offsetTop + n.offsetHeight);
        n.classList.add('mt-leaving'); n.style.bottom = bottom + 'px';
        var a = n.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'scale(.97)', filter: 'blur(2px)' }],
          { duration: ctx.reduced ? 120 : 150, easing: 'ease-in', fill: 'forwards' });
        n._lift = a; lifted.push(n);
        a.onfinish = function () { if (n._lift === a) drop(n); };
        anims.push(a);
      }
      function drop(n) { var a = n._lift; n._lift = null; n.hidden = true; n.classList.remove('mt-leaving'); n.style.bottom = ''; if (a) a.cancel(); }
      function enter(n) {
        n._lift = null; n.hidden = false;
        anims.push(n.animate([{ opacity: 0, transform: ctx.reduced ? 'none' : 'translateY(8px)', filter: ctx.reduced ? 'none' : 'blur(2px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
          { duration: ctx.reduced ? 150 : 300, delay: ctx.reduced ? 0 : 90, easing: EASE_OUT, fill: 'backwards' }));
      }

      function go(next) {
        var from = S[state], to = S[next];
        if (next === state) return;
        lifted.forEach(function (n) { if (n._lift) drop(n); }); lifted = [];
        anims.forEach(function (a) { a.finish(); }); anims = [];
        label.capture(); if (from.tray && to.tray) title.capture();
        var a = tray.getBoundingClientRect();
        // content: header + views leave or enter (lifted out of flow before measuring the new size)
        if (from.tray && !to.tray) { lift(head); lift(views[from.view]); }
        else if (from.tray && to.tray && from.view !== to.view) lift(views[from.view]);
        state = next;
        tray.classList.remove('anim');
        tray.style.width = tray.style.height = '';
        tray.classList.toggle('is-tray', to.tray);
        btn.className = 'mt-primary' + (to.btn !== 'light' ? ' ' + to.btn : '') + (to.ico ? ' ico-' + to.ico : '');
        btn.setAttribute('aria-disabled', next === 'sending' || next === 'sent' ? 'true' : 'false');
        label.set(to.label, !ctx.reduced);
        if (to.tray) {
          icon.className = 'mt-icon is-' + to.icon; icon.setAttribute('aria-label', to.icon === 'x' ? 'Close' : 'Back');
          title.set(to.title, from.tray && !ctx.reduced);
          if (!from.tray) enter(head);
          if (from.view !== to.view) enter(views[to.view]);
        }
        if (next !== 'review') { more.classList.remove('open'); moreB.setAttribute('aria-expanded', 'false'); }
        var b = tray.getBoundingClientRect();
        app.classList.toggle('dim', to.tray); scrim.classList.toggle('on', to.tray);
        app.inert = to.tray;
        live.textContent = to.say;
        clearTimeout(releaseT);
        if (!ctx.reduced) {
          tray.style.width = a.width + 'px'; tray.style.height = a.height + 'px';
          tray.offsetWidth;
          tray.classList.add('anim');
          tray.style.width = b.width + 'px'; tray.style.height = b.height + 'px';
          releaseT = setTimeout(function () { tray.classList.remove('anim'); tray.style.width = tray.style.height = ''; }, DUR + 30);
        }
        label.play(ctx.reduced); if (from.tray && to.tray) title.play(ctx.reduced);
        if (next === 'sending') timers.push(setTimeout(function () { go('sent'); }, 1400));
        if (next === 'sent') timers.push(setTimeout(function () { go('idle'); }, 2000));
      }

      function primary() {
        if (state === 'idle') go('review');
        else if (state === 'review') go('confirm');
        else if (state === 'confirm') go('sending');
      }
      function back() { if (state === 'confirm') go('review'); else if (state === 'review') go('idle'); }
      function onKey(e) { if (e.key === 'Escape' && (state === 'review' || state === 'confirm')) { e.preventDefault(); var wasIcon = document.activeElement === icon; back(); if (state === 'idle' && wasIcon) btn.focus({ preventScroll: true }); } }
      btn.addEventListener('click', primary);
      icon.addEventListener('click', function () { var s = state; back(); if (s === 'review') btn.focus({ preventScroll: true }); });
      scrim.addEventListener('click', function () { if (state === 'review' || state === 'confirm') { go('idle'); btn.focus({ preventScroll: true }); } });
      moreB.addEventListener('click', function () {
        var open = !more.classList.contains('open');
        more.classList.toggle('open', open); moreB.setAttribute('aria-expanded', open);
      });

      return {
        start: function () { if (!onKeyBound) { stage.addEventListener('keydown', onKey); onKeyBound = true; } },
        stop: function () {
          timers.forEach(clearTimeout); timers = []; clearTimeout(releaseT);
          anims.forEach(function (a) { a.finish(); }); anims = [];
          tray.classList.remove('anim'); tray.style.width = tray.style.height = '';
          if (state === 'sending' || state === 'sent') { var r = ctx.reduced; ctx.reduced = true; go('idle'); ctx.reduced = r; anims.forEach(function (a) { a.finish(); }); }
          if (onKeyBound) { stage.removeEventListener('keydown', onKey); onKeyBound = false; }
        }
      };
    }
  });
})();
