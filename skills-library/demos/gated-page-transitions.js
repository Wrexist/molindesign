/* gated-page-transitions — mini router: cover → push → reveal → play, shared-image iris, entrances gated on the cover lift. */
(function () {
  'use strict';
  var ID = 'gated-page-transitions';
  var P3O = 'cubic-bezier(.215,.61,.355,1)', P3IO = 'cubic-bezier(.645,.045,.355,1)';
  var css = `
& { container-type: inline-size; background: #070707; }
& .nav { position: absolute; left: 0; right: 0; top: 0; height: 52px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; border-bottom: 1px solid rgb(255 255 255 / .08); z-index: 3; }
& .wm { letter-spacing: .32em; color: #fff; }
& .nl { display: flex; gap: 18px; }
& .nl button { padding: 8px 0; color: rgb(255 255 255 / .5); transition: color .2s; }
& .nl button:hover, & .nl button[aria-current="page"] { color: #fff; }
& .nl button[aria-current="page"]::before { content: ""; display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #f97316; margin-right: 8px; transform: translateY(-2px); }
& .view { position: absolute; left: 0; right: 0; top: 52px; bottom: 0; padding: 30px 28px 64px; overflow: hidden; outline: none; }
& .ln { display: block; overflow: hidden; padding-bottom: .08em; margin-bottom: -.08em; }
& .w { display: inline-block; white-space: pre; }
& .pre .w { transform: translateY(100%); } & .pre .fd { opacity: 0; } & .pre .hl { transform: scaleX(0); } & .pre .im { transform: scale(1.2); }
& h4 { margin: 0; font-stretch: 125%; font-weight: 400; font-size: clamp(26px, 5.2cqi, 54px); line-height: 1.02; letter-spacing: -.03em; color: #fff; }
& h4 .ln:nth-child(2) .w { font-style: italic; color: rgb(255 255 255 / .75); }
& .eb { margin: 0 0 16px; color: rgb(255 255 255 / .45); }
& .hl { height: 1px; background: rgb(255 255 255 / .3); transform-origin: left; margin: 22px 0; }
& .fig { overflow: hidden; border-radius: 6px; position: relative; }
& .im { position: absolute; inset: 0; }
& .a0 { background: radial-gradient(55% 45% at 68% 62%, #f97316 0, rgb(249 115 22 / .4) 30%, transparent 62%), linear-gradient(180deg, #161616 0 58%, #050505 58% 100%); }
& .a1 { background: repeating-linear-gradient(115deg, rgb(255 255 255 / .09) 0 2px, transparent 2px 14px), radial-gradient(80% 70% at 30% 20%, #3a3a3a, #0a0a0a); }
& .a2 { background: conic-gradient(from 210deg at 50% 60%, #0b0b0b, #f97316 12%, #0b0b0b 26%, #fff 34%, #0b0b0b 48%, #0b0b0b); }
& .home { display: grid; grid-template-columns: 1.25fr 1fr; gap: 28px; height: 100%; align-items: end; }
& .home .fig { height: 100%; }
& .p { margin: 0; max-width: 30em; font-size: 14px; line-height: 1.55; color: rgb(255 255 255 / .62); }
& .thumbs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 22px; }
& .th { display: block; text-align: left; color: #fff; }
& .th .fig { aspect-ratio: 4 / 3; }
& .th span { display: flex; justify-content: space-between; margin-top: 10px; color: rgb(255 255 255 / .6); }
& .th:hover .im { transform: scale(1.06); transition: transform 1.2s ${P3O}; }
& .row { display: flex; justify-content: space-between; padding: 12px 0; color: rgb(255 255 255 / .55); position: relative; }
& .row .hl { position: absolute; left: 0; right: 0; top: 0; margin: 0; }
& .row b { font-weight: 400; color: #fff; }
& .case .fig { height: 58%; margin: 0 -28px 22px; border-radius: 0; }
& .back { color: rgb(255 255 255 / .6); padding: 8px 0; } & .back:hover { color: #fff; }
& .cover { position: absolute; inset: 0; z-index: 5; background: #0d0d0d; display: grid; place-items: center; opacity: 0; pointer-events: none; }
& .logo { display: flex; gap: .06em; font-stretch: 125%; font-size: clamp(40px, 9cqi, 88px); color: #fff; letter-spacing: -.02em; }
& .logo span { display: block; overflow: hidden; padding: 0 .06em; } & .logo b { display: block; font-weight: 400; }
& .logo span:nth-child(3) b { color: #f97316; }
& .iris { position: absolute; left: 0; right: 0; top: 52px; bottom: 0; z-index: 4; pointer-events: none; display: none; }
& .hud { position: absolute; left: 24px; bottom: 18px; z-index: 6; display: flex; gap: 6px; align-items: center; color: rgb(255 255 255 / .35); pointer-events: none; }
& .hud i { font-style: normal; padding: 4px 8px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .12); transition: color .2s, border-color .2s; }
& .hud i.on { color: #000; background: #f97316; border-color: #f97316; }
& .tour { position: absolute; right: 24px; bottom: 14px; z-index: 6; padding: 8px 0; color: rgb(255 255 255 / .55); }
& .tour:hover { color: #fff; }
@container (max-width: 600px) {
  & .home { grid-template-columns: 1fr; grid-template-rows: auto 1fr; align-items: stretch; }
  & .home .fig { min-height: 120px; }
  & .nl { gap: 12px; } & .wm { display: none; } & .nav { justify-content: flex-end; }
  & .view { padding: 22px 20px 64px; } & .case .fig { margin: 0 -20px 18px; }
  & .hud i:not(.on) { display: none; }
  & .p { font-size: 13px; }
}
`.replace(/&/g, '.d-' + ID);

  function lines(arr) { return arr.map(function (l) { return '<span class="ln">' + l.split(' ').map(function (w, i, a) { return '<span class="w">' + w + (i < a.length - 1 ? ' ' : '') + '</span>'; }).join('') + '</span>'; }).join(''); }
  var WORK = [['Halden', 'a0'], ['Northbound', 'a1'], ['Solace', 'a2']];
  var PAGES = {
    index: function () {
      return '<div class="home"><div><p class="eb label fd">(01) Index</p><h4 tabindex="-1">' + lines(['Transitions', 'that never ask', 'for attention.']) + '</h4><div class="hl"></div>' +
        '<p class="p fd">Every entrance waits for the cover to lift. One play flag gates them all.</p></div><div class="fig"><div class="im a0"></div></div></div>';
    },
    work: function () {
      return '<p class="eb label fd">(02) Work</p><h4 tabindex="-1">' + lines(['Selected work']) + '</h4><div class="thumbs">' +
        WORK.map(function (w, i) { return '<button type="button" class="th" data-i="' + i + '"><div class="fig"><div class="im ' + w[1] + '"></div></div><span class="label fd"><b>' + w[0] + '</b>0' + (i + 1) + '</span></button>'; }).join('') + '</div>';
    },
    studio: function () {
      return '<p class="eb label fd">(03) Studio</p><h4 tabindex="-1">' + lines(['Small team,', 'long eases.']) + '</h4><div style="margin-top:24px">' +
        [['Cover', '.6 s power3.out'], ['Glyphs', '.6 s power3.inOut'], ['Words', '1.2 s power3.out'], ['Rules', '1.2 s power3.inOut']].map(function (r) {
          return '<div class="row label"><div class="hl"></div><span class="fd">' + r[0] + '</span><b class="fd">' + r[1] + '</b></div>';
        }).join('') + '</div>';
    },
    case: function (i) {
      var w = WORK[i || 0];
      return '<div class="case" style="height:100%"><div class="fig"><div class="im ' + w[1] + '"></div></div><p class="eb label fd">Case 0' + ((i || 0) + 1) + '</p><h4 tabindex="-1">' + lines([w[0]]) + '</h4>' +
        '<button type="button" class="back label fd" data-go="work">← All work</button></div>';
    }
  };

  Lib.register(ID, {
    hint: 'Navigate the mini site, or let the auto tour run; open a work tile for the iris',
    notes: [
      'Cover in: opacity 0→1 .6 s power3.out while 3 glyph groups slide from <code>y −120%</code>, <code>y +120%</code>, <code>x +120%</code>',
      'Cover out: glyphs reverse .6 s, cover fades .6 s with <code>delay .5</code>; <code>play()</code> fires at .5 s + 100 ms',
      'Entrances: words <code>y 100% → 0</code> 1.2 s power3.out, line delay <code>i / 10</code>; image <code>scale 1.2 → 1</code> .6 s; rules width 0→100% 1.2 s power3.inOut',
      'Iris: overlay expands from the tile, the route pushes, then it collapses to <code>inset(50% 50% 50% 50%)</code> over 1 s, delay .4',
      'Reduced motion: a 150 ms opacity cover, no glyphs or iris, entrances at their final state'
    ],
    simplified: 'A fake in-stage router with WAAPI replaces Next.js, GSAP and Lenis; gradients stand in for images, and every element is above the fold, so the below-fold delay rule never fires.',
    css: css,
    mount: function (stage, ctx) {
      var reduced = ctx.reduced;
      stage.innerHTML = '<nav class="nav"><span class="wm label">MOLIN</span><div class="nl label">' +
        ['index', 'work', 'studio'].map(function (k) { return '<button type="button" data-go="' + k + '">' + k + '</button>'; }).join('') + '</div></nav>' +
        '<div class="view" tabindex="-1"></div><div class="iris"><div class="im"></div></div>' +
        '<div class="cover" aria-hidden="true"><div class="logo"><span><b>M</b></span><span><b>/</b></span><span><b>D</b></span></div></div>' +
        '<p class="hud label" aria-hidden="true"><i data-s="cover">cover</i><i data-s="push">push</i><i data-s="reveal">reveal</i><i data-s="play">play</i></p>' +
        '<button type="button" class="tour label" aria-pressed="true">Auto tour · on</button>' +
        '<p class="sr" aria-live="polite" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"></p>';
      var q = function (s) { return stage.querySelector(s); };
      var view = q('.view'), cover = q('.cover'), glyphs = cover.querySelectorAll('.logo b'), iris = q('.iris'), irisIm = iris.firstChild;
      var hudEls = stage.querySelectorAll('.hud i'), tourBtn = q('.tour'), sr = q('.sr');
      var route = 'index', caseI = 0, busy = false, timers = [], anims = [], tourOn = !reduced, tourT = 0, tourStep = 0, live = false, userNav = false;
      function prune() { anims = anims.filter(function (a) { return a.playState !== 'finished'; }); }
      var at = function (ms, fn) { timers.push(setTimeout(fn, ms)); };
      var anim = function (el, kf, o) { var a = el.animate(kf, o); anims.push(a); return a; };
      function state(s) { hudEls.forEach(function (h) { h.classList.toggle('on', h.dataset.s === s || (s === 'iris' && h.dataset.s === 'cover')); }); hudEls[0].textContent = s === 'iris' ? 'iris' : 'cover'; }
      function render(r, i) {
        route = r; caseI = i || 0;
        view.innerHTML = PAGES[r](i);
        view.classList.add('pre');
        stage.querySelectorAll('.nl button').forEach(function (b) { if (b.dataset.go === r || (r === 'case' && b.dataset.go === 'work')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
      }
      // the play gate: every entrance waits for this call
      function play() {
        state('play');
        view.classList.remove('pre');
        if (reduced) return;
        view.querySelectorAll('.ln').forEach(function (ln, li) {
          ln.querySelectorAll('.w').forEach(function (w) { anim(w, [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 1200, delay: li * 100, easing: P3O, fill: 'backwards' }); });
        });
        view.querySelectorAll('.im').forEach(function (m) { anim(m, [{ transform: 'scale(1.2)' }, { transform: 'none' }], { duration: 600, easing: P3O, fill: 'backwards' }); });
        view.querySelectorAll('.hl').forEach(function (h, i) { anim(h, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: 1200, delay: 100 + i * 80, easing: P3IO, fill: 'backwards' }); });
        view.querySelectorAll('.fd').forEach(function (f, i) { anim(f, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 150 + i * 60, easing: P3O, fill: 'backwards' }); });
      }
      function arrive(r) {
        busy = false;
        var label = r === 'case' ? WORK[caseI][0] : r;
        sr.textContent = 'Page: ' + label;
        if (userNav) { var h = view.querySelector('h4'); if (h) h.focus({ preventScroll: true }); }
        at(1400, function () { if (!busy) state(''); });
      }
      function go(r, i) {
        if (busy || (r === route && r !== 'case')) return;
        busy = true; timers.forEach(clearTimeout); timers = []; prune();
        if (reduced) {
          state('cover'); anim(cover, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'linear' });
          at(150, function () { render(r, i); play(); arrive(r); });
          return;
        }
        state('cover');
        anim(cover, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: P3O, fill: 'forwards' });
        var from = ['translateY(-120%)', 'translateY(120%)', 'translateX(120%)'], exit = ['translateY(120%)', 'translateY(-120%)', 'translateX(-120%)'];
        glyphs.forEach(function (gl, k) { anim(gl, [{ transform: from[k] }, { transform: 'none' }], { duration: 600, easing: P3IO, fill: 'forwards' }); });
        at(620, function () {
          state('push'); render(r, i);
          at(120, function () {
            state('reveal');
            glyphs.forEach(function (gl, k) { anim(gl, [{ transform: 'none' }, { transform: exit[k] }], { duration: 600, easing: P3IO, fill: 'forwards' }); });
            anim(cover, [{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 500, easing: P3IO, fill: 'forwards' });
            at(600, function () { play(); arrive(r); });
          });
        });
      }
      function openCase(btn) {
        if (busy) return;
        var i = +btn.dataset.i;
        if (reduced) { go('case', i); return; }
        busy = true; timers.forEach(clearTimeout); timers = [];
        state('iris');
        var vr = iris.getBoundingClientRect(), tr = btn.querySelector('.fig').getBoundingClientRect();
        var ins = [(tr.top - vr.top), (vr.right - tr.right), (vr.bottom - tr.bottom), (tr.left - vr.left)].map(function (v) { return Math.max(0, v).toFixed(1) + 'px'; }).join(' ');
        irisIm.className = 'im ' + WORK[i][1]; iris.style.display = 'block';
        anim(iris, [{ clipPath: 'inset(' + ins + ')' }, { clipPath: 'inset(0px 0px 0px 0px)' }], { duration: 800, easing: P3O, fill: 'forwards' });
        view.querySelectorAll('.th, .eb, h4').forEach(function (el, k) { anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 800, delay: k * 150, easing: P3O, fill: 'forwards' }); });
        at(900, function () {
          state('push'); render('case', i);
          at(60, function () {
            state('reveal');
            anim(iris, [{ clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(50% 50% 50% 50%)' }], { duration: 1000, delay: 400, easing: P3IO, fill: 'forwards' });
            at(1000, function () { play(); });
            at(1400, function () { iris.style.display = 'none'; arrive('case'); });
          });
        });
      }
      stage.addEventListener('click', function (e) {
        var t = e.target.closest('[data-go], .th');
        if (!t || !stage.contains(t)) return;
        stopTour(); userNav = true;
        if (t.classList.contains('th')) openCase(t); else go(t.dataset.go);
      });
      function stopTour() { tourOn = false; tourBtn.setAttribute('aria-pressed', 'false'); tourBtn.textContent = 'Auto tour · off'; }
      tourBtn.addEventListener('click', function () {
        if (tourOn) stopTour(); else { tourOn = true; tourT = 0; tourBtn.setAttribute('aria-pressed', 'true'); tourBtn.textContent = 'Auto tour · on'; }
      });
      var lp = ctx.loop(function (dt) {
        if (!tourOn || busy) return;
        tourT += dt;
        if (tourT < 3.6) return;
        tourT = 0; userNav = false;
        var seq = ['work', 'case', 'studio', 'index'];
        var nxt = seq[tourStep % 4]; tourStep++;
        if (nxt === 'case') { var th = view.querySelector('.th'); if (th) openCase(th); else go('work'); }
        else go(nxt);
      });
      function settle() {
        timers.forEach(clearTimeout); timers = [];
        anims.forEach(function (a) { try { a.cancel(); } catch (e) {} }); anims = [];
        iris.style.display = 'none'; cover.style.opacity = ''; busy = false;
        view.classList.remove('pre'); state('');
      }
      if (!tourOn) { tourBtn.setAttribute('aria-pressed', 'false'); tourBtn.textContent = 'Auto tour · off'; }
      render('index'); play();
      return {
        start: function () { live = true; tourT = 0; lp.start(); },
        stop: function () { live = false; lp.stop(); settle(); },
        replay: function () { settle(); render('index'); play(); tourStep = 0; tourT = 0; }
      };
    }
  });
})();
