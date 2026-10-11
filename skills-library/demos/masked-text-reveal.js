/* masked-text-reveal — overflow-mask line reveals, blur-rise labels, fast exit, slot-roll counter */
(function () {
  var ID = 'masked-text-reveal';
  var TITLES = [
    { eye: 'Chapter one · Arrival', lines: ['No road', 'will ever', '<em>hold it.</em>'], copy: 'Lines rise out of their own masks, one after another, then hold still.' },
    { eye: 'Chapter two · Detail', lines: ['Nothing on it', '<em>is there for show.</em>'], copy: 'Two lines, same rhythm: .2 s in, then .09 s between each.' },
    { eye: 'Chapter three · Edition', lines: ['MERIDIAN'], giant: true, copy: 'Giant one-word titles go light (300) with positive tracking.' },
    { eye: 'Chapter four · Making of', lines: ['Built in', 'one take,', '<em>start to finish.</em>'], copy: 'Leaving is quick and un-staggered, so titles never overlap.' }
  ];

  Lib.register(ID, {
    hint: 'Titles cycle on their own. Use Exit / Enter and Next to see the fast un-staggered exit and the swap.',
    notes: [
      'Each line sits in an <code>overflow:hidden</code> mask and moves <code>translateY(110%) → 0</code>; padding-bottom .12em / margin-bottom −.12em leaves room for descenders',
      'Enter 1.1 s <code>cubic-bezier(.23,1,.32,1)</code>, delay <code>.2 + .09·i</code>; exit .35 s, same ease, no stagger',
      'Blur-rise for labels and panels: opacity 0, y 12, blur(6px) → clear in 1 s, staggered .1 / .35 / .6; exit .3 s',
      'Swap titles exit → then enter so two never overlap; the counter slot-rolls (.5 s, new value in from 100 %, old out to −100 %)',
      'Reduced motion swaps every slide for a .8 s opacity fade; no bounce, nothing longer than ~1.2 s'
    ],
    simplified: 'CSS transitions toggled by classes stand in for Motion’s AnimatePresence.',
    css: [
      '.d-masked-text-reveal .mt { position: absolute; inset: 0; container-type: inline-size; padding: clamp(22px, 6cqw, 56px); display: flex; flex-direction: column; background: radial-gradient(70% 90% at 100% 0%, rgb(249 115 22 / .10), transparent 60%), radial-gradient(60% 60% at 0% 100%, rgb(255 255 255 / .04), transparent 70%); }',
      '.d-masked-text-reveal .mt-top { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; }',
      '.d-masked-text-reveal .mt-eye { margin: 0; color: rgb(255 255 255 / .7); display: flex; align-items: center; gap: 12px; }',
      '.d-masked-text-reveal .mt-eye::before { content: ""; width: 32px; height: 1px; background: #f97316; }',
      '.d-masked-text-reveal .mt-count { margin: 0; color: rgb(255 255 255 / .45); display: inline-flex; align-items: flex-start; gap: .5em; line-height: 1.4em; }',
      '.d-masked-text-reveal .mt-slot { position: relative; display: inline-block; overflow: hidden; height: 1.4em; min-width: 1.6em; color: #f97316; }',
      '.d-masked-text-reveal .mt-slot span { position: absolute; left: 0; top: 0; transition: transform .5s var(--ease-out); }',
      '.d-masked-text-reveal .mt-body { margin-top: auto; margin-bottom: auto; padding: 18px 0; }',
      '.d-masked-text-reveal .mt-title { margin: 0 0 clamp(14px, 3cqw, 28px); font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; font-size: clamp(24px, 7cqw, 82px); line-height: .98; letter-spacing: -.03em; color: #fff; }',
      '.d-masked-text-reveal .mt-title.giant { font-weight: 300; letter-spacing: .04em; font-size: clamp(34px, 10cqw, 140px); line-height: .95; }',
      '.d-masked-text-reveal .mt-title em { font-style: italic; color: rgb(255 255 255 / .8); }',
      '.d-masked-text-reveal .mask { display: block; overflow: hidden; padding-bottom: .12em; margin-bottom: -.12em; }',
      '.d-masked-text-reveal .ln { display: block; transform: translateY(110%); transition-property: transform, opacity; transition-timing-function: cubic-bezier(.23,1,.32,1); }',
      '.d-masked-text-reveal .on .ln { transform: none; } .d-masked-text-reveal .out .ln { transform: translateY(-110%); }',
      '.d-masked-text-reveal .br { opacity: 0; transform: translateY(12px); filter: blur(6px); transition-property: opacity, transform, filter; transition-timing-function: cubic-bezier(.23,1,.32,1); }',
      '.d-masked-text-reveal .is-on .br { opacity: 1; transform: none; filter: blur(0); }',
      '.d-masked-text-reveal .is-out .br { opacity: 0; transform: translateY(8px); filter: blur(4px); }',
      '.d-masked-text-reveal .mt-copy { margin: 0 0 clamp(14px, 3cqw, 26px); max-width: 440px; color: rgb(255 255 255 / .75); font-size: clamp(13px, 1.9cqw, 16px); line-height: 1.6; }',
      '.d-masked-text-reveal .mt-spec { display: flex; flex-wrap: wrap; gap: 0 clamp(16px, 4cqw, 40px); margin: 0; border-top: 1px solid rgb(255 255 255 / .1); max-width: 560px; }',
      '.d-masked-text-reveal .mt-spec div { padding-top: 10px; } .d-masked-text-reveal .mt-spec dt { color: rgb(255 255 255 / .45); } .d-masked-text-reveal .mt-spec dd { margin: 4px 0 0; color: rgb(255 255 255 / .9); font-size: 13px; font-variant-numeric: tabular-nums; }',
      '.d-masked-text-reveal .mt-bar { display: flex; align-items: center; gap: 8px 18px; flex-wrap: wrap; }',
      '.d-masked-text-reveal .mt-btn { padding: 11px 16px; border: 1px solid rgb(255 255 255 / .22); border-radius: 999px; color: rgb(255 255 255 / .85); transition: border-color .3s, color .3s, transform .2s var(--ease-out); }',
      '.d-masked-text-reveal .mt-btn:hover { border-color: #fff; color: #fff; } .d-masked-text-reveal .mt-btn:active { transform: scale(.97); }',
      '.d-masked-text-reveal .mt-btn .ar { display: inline-block; color: #f97316; transition: transform .3s var(--ease-out); } .d-masked-text-reveal .mt-btn:hover .ar { transform: translateX(4px); }',
      '.d-masked-text-reveal .mt-phase { margin-left: auto; color: rgb(255 255 255 / .45); display: inline-flex; align-items: center; gap: 8px; }',
      '.d-masked-text-reveal .mt-phase::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: rgb(255 255 255 / .3); transition: background .3s; }',
      '.d-masked-text-reveal .mt-phase[data-p="enter"]::before { background: #f97316; box-shadow: 0 0 10px rgb(249 115 22 / .8); }',
      '.d-masked-text-reveal .mt-phase[data-p="exit"]::before { background: #fff; }',
      '.d-masked-text-reveal .rm .br { transform: none !important; filter: none !important; }',
      '@container (max-width: 480px) { .d-masked-text-reveal .mt-phase { display: none; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      var R = ctx.reduced;
      stage.innerHTML =
        '<div class="mt"><div class="mt-top"><p class="label mt-eye br"></p>' +
        '<p class="label mt-count" aria-label="Title number"><span class="mt-slot"><span>01</span></span><span>/ 0' + TITLES.length + '</span></p></div>' +
        '<div class="mt-body"><h4 class="mt-title" aria-live="polite"></h4><p class="mt-copy br"></p>' +
        '<dl class="mt-spec br label"><div><dt>Enter</dt><dd>1.1 s</dd></div><div><dt>Stagger</dt><dd>.2 + .09·i</dd></div><div><dt>Exit</dt><dd>.35 s flat</dd></div><div><dt>Ease</dt><dd>out-quint</dd></div></dl></div>' +
        '<div class="mt-bar"><button type="button" class="mt-btn label mt-toggle" aria-pressed="true">Exit</button>' +
        '<button type="button" class="mt-btn label mt-next">Next title <span class="ar" aria-hidden="true">→</span></button>' +
        '<span class="label mt-phase" data-p="idle" aria-hidden="true">Waiting</span></div></div>';

      var root = stage.querySelector('.mt'), title = root.querySelector('.mt-title'), eye = root.querySelector('.mt-eye');
      var copy = root.querySelector('.mt-copy'), slot = root.querySelector('.mt-slot'), phaseEl = root.querySelector('.mt-phase');
      var toggle = root.querySelector('.mt-toggle'), nextBtn = root.querySelector('.mt-next');
      var brs = root.querySelectorAll('.br');
      var idx = 0, shown = false, timers = [], auto = 0, live = false;

      function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
      function clearTimers() { timers.forEach(clearTimeout); timers = []; clearTimeout(auto); }
      function phase(p, txt) { phaseEl.dataset.p = p; phaseEl.textContent = txt; }

      function fill(i) {
        var T = TITLES[i];
        title.className = 'mt-title' + (T.giant ? ' giant' : '');
        title.innerHTML = T.lines.map(function (l) { return '<span class="mask"><span class="ln">' + l + '</span></span>'; }).join('');
        eye.textContent = T.eye; copy.textContent = T.copy;
      }
      function setTimes(lines, entering) {
        lines.forEach(function (ln, i) {
          ln.style.transitionDuration = R ? '.8s' : entering ? '1.1s' : '.35s';
          ln.style.transitionDelay = entering ? (.2 + .09 * i).toFixed(2) + 's' : '0s';
        });
        var d = [.1, .35, .6];
        brs.forEach(function (b, i) {
          b.style.transitionDuration = R ? '.8s' : entering ? '1s' : '.3s';
          b.style.transitionDelay = entering ? d[Math.min(i, 2)] + 's' : '0s';
        });
      }
      function lines() { return Array.prototype.slice.call(title.querySelectorAll('.ln')); }
      function enter() {
        var L = lines();
        // park lines below their masks without a transition, then release them
        title.classList.remove('on', 'out');
        L.forEach(function (ln) { ln.style.transition = 'none'; if (R) { ln.style.opacity = '0'; ln.style.transform = 'none'; } });
        void title.offsetWidth;
        L.forEach(function (ln) { ln.style.transition = ''; });
        setTimes(L, true);
        title.classList.add('on'); root.classList.add('is-on'); root.classList.remove('is-out');
        if (R) L.forEach(function (ln) { ln.style.opacity = '1'; });
        shown = true; toggle.textContent = 'Exit'; toggle.setAttribute('aria-pressed', 'true');
        phase('enter', 'Entering · 1.1 s');
        later(function () { phase('hold', 'Holding'); }, 1500);
      }
      function exit() {
        var L = lines();
        setTimes(L, false);
        title.classList.remove('on'); title.classList.add('out'); root.classList.remove('is-on'); root.classList.add('is-out');
        if (R) L.forEach(function (ln) { ln.style.opacity = '0'; });
        shown = false; toggle.textContent = 'Enter'; toggle.setAttribute('aria-pressed', 'false');
        phase('exit', 'Exiting · .35 s');
      }
      function roll(n) {
        var old = slot.firstElementChild, nu = ctx.el('span', '', String(n + 1).padStart(2, '0'));
        if (R) { slot.innerHTML = ''; slot.appendChild(nu); return; }
        nu.style.transform = 'translateY(100%)';
        slot.appendChild(nu); void nu.offsetWidth;
        nu.style.transform = 'translateY(0)'; old.style.transform = 'translateY(-100%)';
        later(function () { if (old.parentNode) old.remove(); }, 550);
      }
      function next() {
        clearTimers();
        var wait = shown ? (R ? 820 : 400) : 0;
        if (shown) exit();
        later(function () {
          idx = (idx + 1) % TITLES.length;
          roll(idx); fill(idx); enter(); schedule();
        }, wait);
      }
      function schedule() { clearTimeout(auto); if (live) auto = setTimeout(next, 5200); }

      toggle.addEventListener('click', function () {
        clearTimers();
        if (shown) { exit(); later(function () { phase('idle', 'Out · press Enter'); }, 400); }
        else { enter(); schedule(); }
      });
      nextBtn.addEventListener('click', next);

      if (R) root.classList.add('rm');
      fill(0);
      return {
        start: function () {
          live = true;
          if (!shown) { later(enter, 150); later(schedule, 160); } else schedule();
        },
        stop: function () { live = false; clearTimers(); },
        replay: function () {
          clearTimers(); exit();
          later(function () { idx = 0; slot.innerHTML = '<span>01</span>'; fill(0); enter(); schedule(); }, R ? 820 : 450);
        }
      };
    }
  });
})();
