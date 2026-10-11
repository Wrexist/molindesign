/* slide-over-drawer — stage-contained drawer: tabs with arrow keys, Esc, focus in/out, backdrop click, staggered rows */
(function () {
  var ID = 'slide-over-drawer';
  var SPEC = [['Output', '640 kW'], ['Mass', '1,180 kg'], ['Top speed', '350 km/h'], ['0–100 km/h', '2.9 s'], ['Drivetrain', 'Rear-wheel drive'], ['Edition', '24 built']];
  var CRED = [['Made with', 'HTML, CSS, Canvas 2D'], ['Sound', 'Web Audio, mixed live'], ['Type', 'Archivo, Geist Mono']];

  Lib.register(ID, {
    hint: 'Open Specification, switch tabs with ← →, close with Esc, ✕ or the backdrop. The page’s own About drawer (top right) is the same pattern.',
    notes: [
      'Panel slides <code>translateX(100%) → 0</code> in .5 s on <code>cubic-bezier(.32,.72,0,1)</code> (iOS-sheet feel); backdrop fades .3 s',
      'Tabs: <code>aria-selected</code>, roving <code>tabIndex</code>, ←/→ cycles and moves focus; 1 px orange underline scales in over 300 ms',
      'Focus Close on open, Esc listener bound only while open, backdrop click closes, focus returns to the trigger; the scene behind is <code>inert</code>',
      'Spec rows are hairlines (<code>border-t white/10</code>, last also bottom) that stagger in: .5 s, delay <code>.15 + .04·i</code>',
      '<code>overscroll-behavior: contain</code> on the panel; reduced motion turns the slide into a plain fade'
    ],
    simplified: 'Absolutely positioned inside the stage instead of fixed to the viewport, and there is no 3D engine to lock.',
    css: [
      '.d-slide-over-drawer { container-type: inline-size; }',
      '.d-slide-over-drawer .sd-scene { position: absolute; inset: 0; background: radial-gradient(40% 55% at 62% 58%, rgb(249 115 22 / .28), transparent 70%), radial-gradient(28% 36% at 62% 56%, #1b1714, #050505 80%); }',
      '.d-slide-over-drawer .sd-orb { position: absolute; left: 62%; top: 56%; width: 26cqw; height: 26cqw; transform: translate(-50%, -50%); border-radius: 50%; background: radial-gradient(circle at 34% 30%, #57514c, #141312 46%, #050505 72%); box-shadow: 18px 0 60px -10px rgb(249 115 22 / .45) inset, 0 40px 80px rgb(0 0 0 / .8); }',
      '.d-slide-over-drawer .sd-nav { position: absolute; left: 0; right: 0; top: 0; display: flex; justify-content: space-between; align-items: center; padding: 18px 26px; }',
      '.d-slide-over-drawer .sd-mark { color: #fff; letter-spacing: .32em; }',
      '.d-slide-over-drawer .sd-open { display: inline-flex; align-items: center; gap: 12px; padding: 8px 0; color: rgb(255 255 255 / .85); }',
      '.d-slide-over-drawer .sd-open:hover { color: #fff; }',
      '.d-slide-over-drawer .sd-burger { width: 44px; height: 44px; border-radius: 50%; border: 1px solid rgb(255 255 255 / .25); display: grid; place-content: center; gap: 5px; transition: border-color .3s; }',
      '.d-slide-over-drawer .sd-open:hover .sd-burger { border-color: #fff; } .d-slide-over-drawer .sd-burger i { display: block; width: 18px; height: 1px; background: #fff; }',
      '.d-slide-over-drawer .sd-title { position: absolute; left: 26px; bottom: 15%; margin: 0; }',
      '.d-slide-over-drawer .sd-title .label { color: #f97316; margin: 0 0 10px; }',
      '.d-slide-over-drawer .sd-title h4 { margin: 0; font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 300; letter-spacing: .04em; font-size: clamp(30px, 8cqw, 104px); line-height: .95; color: #fff; }',
      '.d-slide-over-drawer .sd-esc { position: absolute; right: 26px; bottom: 22px; margin: 0; color: rgb(255 255 255 / .45); }',
      '.d-slide-over-drawer kbd { font: inherit; border: 1px solid rgb(255 255 255 / .25); border-radius: 4px; padding: 1px 5px; color: rgb(255 255 255 / .8); }',
      '.d-slide-over-drawer .sd-root { position: absolute; inset: 0; z-index: 10; }',
      '.d-slide-over-drawer .sd-root[hidden] { display: none; }',
      '.d-slide-over-drawer .sd-back { position: absolute; inset: 0; background: rgb(0 0 0 / .4); opacity: 0; transition: opacity .3s var(--ease-out); }',
      '.d-slide-over-drawer .sd-panel { position: absolute; top: 0; right: 0; bottom: 0; width: min(440px, 100%); display: flex; flex-direction: column; overflow-y: auto; overscroll-behavior: contain; background: rgb(0 0 0 / .6); -webkit-backdrop-filter: blur(40px); backdrop-filter: blur(40px); border-left: 1px solid rgb(255 255 255 / .1); padding: clamp(20px, 4cqw, 32px) clamp(20px, 4.5cqw, 40px); transform: translateX(100%); transition: transform .5s cubic-bezier(.32,.72,0,1); }',
      '.d-slide-over-drawer .open .sd-back { opacity: 1; } .d-slide-over-drawer .open .sd-panel { transform: none; }',
      '.d-slide-over-drawer .sd-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }',
      '.d-slide-over-drawer [role=tablist] { display: flex; gap: 20px; }',
      '.d-slide-over-drawer [role=tab] { position: relative; padding: 8px 0; color: rgb(255 255 255 / .45); }',
      '.d-slide-over-drawer [role=tab][aria-selected=true] { color: #fff; }',
      '.d-slide-over-drawer [role=tab]::after { content: ""; position: absolute; left: 0; right: 0; bottom: 2px; height: 1px; background: #f97316; transform: scaleX(0); transform-origin: left; transition: transform .3s cubic-bezier(.23,1,.32,1); }',
      '.d-slide-over-drawer [role=tab][aria-selected=true]::after { transform: scaleX(1); }',
      '.d-slide-over-drawer .sd-close { padding: 10px 14px; margin-right: -14px; color: rgb(255 255 255 / .7); border-radius: 999px; } .d-slide-over-drawer .sd-close:hover { color: #fff; }',
      '.d-slide-over-drawer [role=tabpanel] { flex: 1; display: flex; flex-direction: column; }',
      '.d-slide-over-drawer [role=tabpanel][hidden] { display: none; }',
      '.d-slide-over-drawer .sd-big { font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 300; letter-spacing: .04em; font-size: clamp(30px, 6cqw, 44px); line-height: 1; margin: clamp(22px, 5cqw, 40px) 0 18px; color: #fff; }',
      '.d-slide-over-drawer .sd-big em { font-style: italic; color: rgb(255 255 255 / .8); letter-spacing: -.01em; }',
      '.d-slide-over-drawer dl { margin: 0; }',
      '.d-slide-over-drawer .sd-row { display: flex; align-items: baseline; justify-content: space-between; gap: 24px; padding: 13px 0; border-top: 1px solid rgb(255 255 255 / .1); opacity: 0; transform: translateY(8px); }',
      '.d-slide-over-drawer .sd-row:last-child { border-bottom: 1px solid rgb(255 255 255 / .1); }',
      '.d-slide-over-drawer .in .sd-row { opacity: 1; transform: none; transition: opacity .5s cubic-bezier(.23,1,.32,1), transform .5s cubic-bezier(.23,1,.32,1); }',
      '.d-slide-over-drawer dt { color: rgb(255 255 255 / .45); } .d-slide-over-drawer dd { margin: 0; font-size: 14px; color: rgb(255 255 255 / .9); text-align: right; }',
      '.d-slide-over-drawer .sd-foot { margin-top: auto; padding-top: 24px; font-size: 12px; color: rgb(255 255 255 / .4); }',
      '.d-slide-over-drawer .sd-p { font-size: 15px; line-height: 1.6; color: rgb(255 255 255 / .75); margin: 0 0 18px; }',
      '.d-slide-over-drawer .sd-figs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 0 0 18px; }',
      '.d-slide-over-drawer figure { margin: 0; } .d-slide-over-drawer figure div { aspect-ratio: 16 / 9; border-radius: 8px; border: 1px solid rgb(255 255 255 / .1); }',
      '.d-slide-over-drawer .f1 { background: radial-gradient(50% 70% at 60% 80%, rgb(249 115 22 / .6), transparent 70%), #0c0a09; } .d-slide-over-drawer .f2 { background: repeating-linear-gradient(90deg, rgb(255 255 255 / .06) 0 1px, transparent 1px 12px), linear-gradient(#161616, #060606); }',
      '.d-slide-over-drawer figcaption { margin-top: 8px; color: rgb(255 255 255 / .45); }',
      '.d-slide-over-drawer .sd-links { display: flex; flex-wrap: wrap; gap: 4px 20px; margin-top: 16px; }',
      '.d-slide-over-drawer .sd-links a { text-decoration: none; color: rgb(255 255 255 / .8); padding: 8px 0; } .d-slide-over-drawer .sd-links a:hover { color: #fff; }',
      '.d-slide-over-drawer .sd-links .ar { display: inline-block; color: #f97316; margin-right: 6px; transition: transform .3s cubic-bezier(.23,1,.32,1); } .d-slide-over-drawer .sd-links a:hover .ar { transform: translate(2px, -2px); }',
      '@container (max-width: 520px) { .d-slide-over-drawer .sd-open .t { display: none; } .d-slide-over-drawer .sd-esc { display: none; } }',
      '@media (prefers-reduced-motion: reduce) { .d-slide-over-drawer .sd-panel { transform: none; opacity: 0; transition: opacity .2s; } .d-slide-over-drawer .open .sd-panel { opacity: 1; } .d-slide-over-drawer .sd-row { transform: none; } .d-slide-over-drawer .sd-back { transition-duration: .2s; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      var rows = function (list) { return list.map(function (r) { return '<div class="sd-row"><dt class="label">' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join(''); };
      stage.innerHTML =
        '<div class="sd-scene"><div class="sd-orb" aria-hidden="true"></div>' +
        '<div class="sd-nav"><span class="label sd-mark">MERIDIAN</span><button type="button" class="sd-open label" aria-haspopup="dialog" aria-expanded="false" data-cursor="Open">' +
        '<span class="t">Specification and About</span><span class="sd-burger" aria-hidden="true"><i></i><i></i></span></button></div>' +
        '<div class="sd-title"><p class="label">[ Nº 07 / 24 ]</p><h4>MERIDIAN</h4></div>' +
        '<p class="label sd-esc"><kbd>Esc</kbd> closes the drawer</p></div>' +
        '<div class="sd-root" hidden><div class="sd-back"></div>' +
        '<aside class="sd-panel" role="dialog" aria-modal="true" aria-label="Specification and About">' +
        '<div class="sd-head"><div role="tablist" aria-label="Drawer sections" class="label">' +
        '<button type="button" role="tab" class="label" id="sd-t1" aria-controls="sd-p1" aria-selected="true" tabindex="0">Specification</button>' +
        '<button type="button" role="tab" class="label" id="sd-t2" aria-controls="sd-p2" aria-selected="false" tabindex="-1">About</button></div>' +
        '<button type="button" class="sd-close label">Close ✕</button></div>' +
        '<div role="tabpanel" id="sd-p1" aria-labelledby="sd-t1"><p class="sd-big">MERIDIAN</p><dl>' + rows(SPEC) + '</dl>' +
        '<p class="sd-foot">Figures as announced at the reveal. A fictional object for this demo.</p></div>' +
        '<div role="tabpanel" id="sd-p2" aria-labelledby="sd-t2" hidden><p class="sd-big">One object, <em>one take.</em></p>' +
        '<p class="sd-p">Secondary information lives in a drawer, so the scene never navigates away. Telling the stack is part of the showpiece.</p>' +
        '<div class="sd-figs"><figure><div class="f1" role="img" aria-label="Lighting test with an orange key light"></div><figcaption class="label">Light study</figcaption></figure>' +
        '<figure><div class="f2" role="img" aria-label="Wireframe pass of the object"></div><figcaption class="label">Wireframe</figcaption></figure></div>' +
        '<dl>' + rows(CRED) + '</dl>' +
        '<div class="sd-links label"><a href="https://github.com/Wrexist/molindesign/blob/main/.claude/skills/slide-over-drawer/SKILL.md" target="_blank" rel="noopener noreferrer"><span class="ar" aria-hidden="true">↗</span>SKILL.md</a>' +
        '<a href="https://amv.tarunvishwakarma.dev" target="_blank" rel="noopener noreferrer"><span class="ar" aria-hidden="true">↗</span>Source site</a></div></div>' +
        '</aside></div>';

      var scene = stage.querySelector('.sd-scene'), root = stage.querySelector('.sd-root'), panel = stage.querySelector('.sd-panel');
      var openBtn = stage.querySelector('.sd-open'), closeBtn = stage.querySelector('.sd-close'), back = stage.querySelector('.sd-back');
      var tabs = Array.prototype.slice.call(stage.querySelectorAll('[role=tab]'));
      var isOpen = false, lastFocus = null, hideT = 0, raf = 0;

      function stagger(tp) {
        var rs = tp.querySelectorAll('.sd-row');
        tp.classList.remove('in');
        rs.forEach(function (r, i) { r.style.transitionDelay = ctx.reduced ? '0s' : (.15 + .04 * i).toFixed(2) + 's'; });
        void tp.offsetWidth;
        tp.classList.add('in');
      }
      function select(t) {
        tabs.forEach(function (x) {
          var on = x === t;
          x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
          stage.querySelector('#' + x.getAttribute('aria-controls')).hidden = !on;
        });
        stagger(stage.querySelector('#' + t.getAttribute('aria-controls')));
      }
      tabs.forEach(function (t) {
        t.addEventListener('click', function () { select(t); });
        t.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          var n = tabs[(tabs.indexOf(t) + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          select(n); n.focus();
        });
      });
      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
        if (e.key !== 'Tab') return;   // keep focus inside the dialog
        var f = Array.prototype.filter.call(panel.querySelectorAll('button, a[href]'), function (n) { return n.tabIndex >= 0 && n.offsetParent; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
      function open() {
        if (isOpen) return;
        isOpen = true; clearTimeout(hideT);
        lastFocus = document.activeElement;
        root.hidden = false; scene.inert = true; openBtn.setAttribute('aria-expanded', 'true');
        raf = requestAnimationFrame(function () { raf = requestAnimationFrame(function () { root.classList.add('open'); }); });
        closeBtn.focus({ preventScroll: true });
        stagger(stage.querySelector('[role=tabpanel]:not([hidden])'));
        document.addEventListener('keydown', onKey);
      }
      function close(restore) {
        if (!isOpen) return;
        isOpen = false; cancelAnimationFrame(raf);
        root.classList.remove('open'); scene.inert = false; openBtn.setAttribute('aria-expanded', 'false');
        document.removeEventListener('keydown', onKey);
        hideT = setTimeout(function () { root.hidden = true; }, ctx.reduced ? 200 : 500);
        if (restore && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      }
      openBtn.addEventListener('click', open);
      closeBtn.addEventListener('click', function () { close(true); });
      back.addEventListener('click', function () { close(true); });

      return {
        start: function () {},
        stop: function () { if (isOpen) { close(false); } clearTimeout(hideT); root.hidden = !isOpen; }
      };
    }
  });
})();
