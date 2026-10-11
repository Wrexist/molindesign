/* sliding-indicator-tabs — measured underline + hover pill, clip-path segmented control, height-animated panels with directional content */
(function () {
  var ID = 'sliding-indicator-tabs';
  var EASE = 'cubic-bezier(.4,0,.1,1)', DUR = 450;          // Motion's default layout transition (layoutId indicator)
  var TABS = [
    ['Overview', '<p class="st-p">Meridian is a desk lamp with one dial. Turn it for warmth, press it for focus. Nothing else to learn.</p>'],
    ['Specs', '<dl class="st-dl"><div><dt class="label">Output</dt><dd>900 lm</dd></div><div><dt class="label">Colour</dt><dd>2200–5000 K</dd></div>' +
      '<div><dt class="label">Power</dt><dd>USB-C, 12 W</dd></div><div><dt class="label">Weight</dt><dd>1.4 kg</dd></div></dl>'],
    ['Reviews', '<p class="st-stars" aria-label="5 out of 5">★★★★★</p><blockquote class="st-q">“The only lamp on my desk I never think about. It just looks right at every hour.”</blockquote><p class="label st-by">Ana, studio owner</p>'],
    ['Changelog', '<ul class="st-log"><li><span class="label st-v">2.1</span>Dial now remembers the last warmth</li><li><span class="label st-v">2.0</span>Focus mode, 30 % brighter centre</li>' +
      '<li><span class="label st-v">1.4</span>Quieter driver below 10 %</li></ul>']
  ];
  var RANGES = [['Day', '$1,284', [3, 5, 4, 6, 8, 7, 9, 6, 5, 7, 8, 10]], ['Week', '$8,920', [6, 7, 5, 8, 6, 9, 7, 8, 10, 9, 7, 8]],
    ['Month', '$36,410', [4, 6, 7, 6, 8, 9, 8, 10, 9, 11, 10, 12]], ['Year', '$412,800', [2, 3, 4, 4, 5, 6, 7, 7, 8, 9, 11, 12]]];

  Lib.register(ID, {
    hint: 'Click or use ← → Home End on the tabs and the range control. Hover the tabs with a mouse.',
    notes: [
      'One indicator, measured with <code>offsetLeft/offsetWidth</code> and moved with <code>translateX + scaleX</code> over <code>0.45 s</code> <code>[0.4, 0, 0.1, 1]</code> (Motion’s <code>layoutId</code> default)',
      'Range pill = a duplicated, <code>aria-hidden</code> copy of the list clipped with <code>inset(… round 999px)</code>, so the text turns black exactly at the pill edge (Emil Kowalski, after Paco Coursey)',
      'Panel box locks its old height, swaps content, then animates to the new height and releases back to <code>auto</code>. Content enters from the side of the tab you picked',
      'WAI-ARIA: tablist with roving <code>tabindex</code>, automatic activation, ← → Home End. A segmented value is a <code>radiogroup</code>, not tabs',
      'Re-measured on resize and <code>document.fonts.ready</code>; first placement has no transition. Reduced motion jumps the indicator and fades panels'
    ],
    simplified: 'No anchor-positioning variant, and no scrolling tab list.',
    css: [
      '.d-sliding-indicator-tabs { container-type: inline-size; display: grid; place-items: center; background: radial-gradient(70% 60% at 30% 20%, #0f0e0d, #000 70%); }',
      '.d-sliding-indicator-tabs .st-wrap { width: min(100% - 40px, 820px); display: grid; grid-template-columns: 1.35fr 1fr; gap: 16px; align-items: start; }',
      '.d-sliding-indicator-tabs .st-card { border-radius: 18px; background: rgb(255 255 255 / .035); border: 1px solid rgb(255 255 255 / .08); padding: 18px 20px 20px; }',
      '.d-sliding-indicator-tabs .st-cap { color: rgb(255 255 255 / .58); margin: 0 0 12px; }',
      '.d-sliding-indicator-tabs .st-list { position: relative; display: flex; gap: 2px; border-bottom: 1px solid rgb(255 255 255 / .1); margin: 0 -6px; }',
      '.d-sliding-indicator-tabs .st-tab { position: relative; z-index: 1; padding: 10px 10px 12px; font-size: 13.5px; color: rgb(255 255 255 / .58); transition: color .25s; }',
      '.d-sliding-indicator-tabs .st-tab[aria-selected=true] { color: #fff; } .d-sliding-indicator-tabs .st-tab:hover { color: rgb(255 255 255 / .9); }',
      '.d-sliding-indicator-tabs .st-tab:focus-visible { outline-offset: -4px; border-radius: 8px; }',
      '.d-sliding-indicator-tabs .st-ind { position: absolute; left: 0; bottom: -1px; width: 100px; height: 2px; border-radius: 2px; background: #f97316; transform-origin: 0 0; }',
      '.d-sliding-indicator-tabs .st-hov { position: absolute; left: 0; top: 4px; height: calc(100% - 10px); width: 0; border-radius: 8px; background: rgb(255 255 255 / .07); opacity: 0; transition: opacity .15s; }',
      '.d-sliding-indicator-tabs .ready .st-ind { transition: transform ' + DUR + 'ms ' + EASE + '; }',
      '.d-sliding-indicator-tabs .ready .st-hov.on { transition: opacity .15s, transform .3s cubic-bezier(.23,1,.32,1), width .3s cubic-bezier(.23,1,.32,1); }',
      '.d-sliding-indicator-tabs .st-panels { position: relative; overflow: hidden; margin: 0 -6px; padding: 0 6px; }',
      '.d-sliding-indicator-tabs [role=tabpanel] { padding: 16px 0 2px; }',
      '.d-sliding-indicator-tabs [role=tabpanel]:focus-visible { outline-offset: -2px; border-radius: 6px; }',
      '.d-sliding-indicator-tabs .st-p { margin: 0; font-size: 14px; line-height: 1.6; color: rgb(255 255 255 / .78); }',
      '.d-sliding-indicator-tabs .st-dl { margin: 0; } .d-sliding-indicator-tabs .st-dl div { display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid rgb(255 255 255 / .08); }',
      '.d-sliding-indicator-tabs .st-dl div:first-child { border-top: 0; padding-top: 0; }',
      '.d-sliding-indicator-tabs .st-dl dt { color: rgb(255 255 255 / .58); } .d-sliding-indicator-tabs .st-dl dd { margin: 0; font-size: 13.5px; color: #fff; }',
      '.d-sliding-indicator-tabs .st-stars { margin: 0 0 6px; color: #f97316; letter-spacing: .2em; font-size: 13px; }',
      '.d-sliding-indicator-tabs .st-q { margin: 0; font-family: Archivo, sans-serif; font-stretch: 112%; font-size: 17px; line-height: 1.4; color: #fff; }',
      '.d-sliding-indicator-tabs .st-by { margin: 10px 0 0; color: rgb(255 255 255 / .58); }',
      '.d-sliding-indicator-tabs .st-log { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; font-size: 13.5px; color: rgb(255 255 255 / .8); }',
      '.d-sliding-indicator-tabs .st-log li { display: flex; align-items: baseline; gap: 10px; }',
      '.d-sliding-indicator-tabs .st-v { display: inline-block; flex: none; min-width: 38px; padding: 3px 0; text-align: center; border-radius: 999px; border: 1px solid rgb(255 255 255 / .16); color: #fff; }',
      '.d-sliding-indicator-tabs .st-seg { position: relative; display: inline-block; border-radius: 999px; background: rgb(255 255 255 / .06); border: 1px solid rgb(255 255 255 / .08); }',
      '.d-sliding-indicator-tabs .st-seg-list, .d-sliding-indicator-tabs .st-seg-over { display: flex; padding: 3px; }',
      '.d-sliding-indicator-tabs .st-seg-item, .d-sliding-indicator-tabs .st-seg-over span { padding: 8px 13px; border-radius: 999px; font-size: 13px; font-weight: 500; line-height: 16px; color: rgb(255 255 255 / .62); }',
      '.d-sliding-indicator-tabs .st-seg-item:hover { color: #fff; }',
      '.d-sliding-indicator-tabs .st-seg-over { position: absolute; inset: 0; pointer-events: none; }',
      '.d-sliding-indicator-tabs .st-seg-over::before { content: ""; position: absolute; inset: 0; background: #fff; border-radius: 999px; }',
      '.d-sliding-indicator-tabs .st-seg-over span { position: relative; color: #000; }',
      '.d-sliding-indicator-tabs .ready .st-seg-over { transition: clip-path ' + DUR + 'ms ' + EASE + '; }',
      '.d-sliding-indicator-tabs .st-num { position: relative; height: 44px; overflow: hidden; margin: 18px 0 2px; }',
      '.d-sliding-indicator-tabs .st-num span { position: absolute; left: 0; top: 0; font-family: Archivo, sans-serif; font-stretch: 125%; font-size: 34px; line-height: 44px; color: #fff; font-variant-numeric: tabular-nums; }',
      '.d-sliding-indicator-tabs .st-sub { color: rgb(255 255 255 / .58); margin: 0 0 14px; }',
      '.d-sliding-indicator-tabs .st-bars { display: flex; align-items: flex-end; gap: 5px; height: 76px; }',
      '.d-sliding-indicator-tabs .st-bars i { flex: 1; height: 100%; border-radius: 3px; background: rgb(255 255 255 / .16); transform-origin: bottom; transition: transform .6s cubic-bezier(.23,1,.32,1), background-color .3s; }',
      '.d-sliding-indicator-tabs .st-bars i:last-child { background: #f97316; }',
      '@container (max-width: 600px) {',
      '  .d-sliding-indicator-tabs .st-wrap { grid-template-columns: 1fr; gap: 10px; width: calc(100% - 28px); }',
      '  .d-sliding-indicator-tabs .st-card { padding: 14px 14px 14px; } .d-sliding-indicator-tabs .st-tab { padding: 9px 7px 11px; font-size: 12.5px; }',
      '  .d-sliding-indicator-tabs .st-cap { margin-bottom: 8px; } .d-sliding-indicator-tabs .st-q { font-size: 15px; }',
      '  .d-sliding-indicator-tabs .st-p, .d-sliding-indicator-tabs .st-log { font-size: 13px; } .d-sliding-indicator-tabs [role=tabpanel] { padding-top: 12px; }',
      '  .d-sliding-indicator-tabs .st-dl div { padding: 5px 0; } .d-sliding-indicator-tabs .st-log { gap: 6px; }',
      '  .d-sliding-indicator-tabs .st-cap { display: none; }',
      '  .d-sliding-indicator-tabs .st-num { margin: 10px 0 0; height: 34px; } .d-sliding-indicator-tabs .st-num span { font-size: 26px; line-height: 34px; }',
      '  .d-sliding-indicator-tabs .st-sub { margin-bottom: 8px; } .d-sliding-indicator-tabs .st-bars { height: 40px; }',
      '  .d-sliding-indicator-tabs .st-seg-item, .d-sliding-indicator-tabs .st-seg-over span { padding: 7px 10px; font-size: 12px; }',
      '}',
      '@media (prefers-reduced-motion: reduce) { .d-sliding-indicator-tabs .ready .st-ind, .d-sliding-indicator-tabs .ready .st-seg-over, .d-sliding-indicator-tabs .ready .st-hov.on { transition: none; } .d-sliding-indicator-tabs .st-bars i { transition: none; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      var uid = 'st' + Math.random().toString(36).slice(2, 7);
      stage.innerHTML =
        '<div class="st-wrap"><section class="st-card st-a" aria-label="Underline tabs">' +
        '<p class="label st-cap">Tabs · underline</p>' +
        '<div class="st-list" role="tablist" aria-label="Product">' +
        TABS.map(function (t, i) {
          return '<button type="button" role="tab" class="st-tab" id="' + uid + 't' + i + '" aria-controls="' + uid + 'p' + i + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '">' + t[0] + '</button>';
        }).join('') + '<span class="st-hov" aria-hidden="true"></span><span class="st-ind" aria-hidden="true"></span></div>' +
        '<div class="st-panels">' + TABS.map(function (t, i) {
          return '<div role="tabpanel" id="' + uid + 'p' + i + '" aria-labelledby="' + uid + 't' + i + '" tabindex="0"' + (i ? ' hidden' : '') + '>' + t[1] + '</div>';
        }).join('') + '</div></section>' +
        '<section class="st-card st-b" aria-label="Segmented control">' +
        '<div class="st-row2"><p class="label st-cap">Segmented · clip-path</p>' +
        '<div class="st-seg"><div class="st-seg-list" role="radiogroup" aria-label="Range">' +
        RANGES.map(function (r, i) { return '<button type="button" role="radio" class="st-seg-item" aria-checked="' + (i === 1) + '" tabindex="' + (i === 1 ? 0 : -1) + '">' + r[0] + '</button>'; }).join('') +
        '</div><div class="st-seg-over" aria-hidden="true">' + RANGES.map(function (r) { return '<span>' + r[0] + '</span>'; }).join('') + '</div></div></div>' +
        '<div class="st-num" aria-live="polite"><span>' + RANGES[1][1] + '</span></div><p class="label st-sub">Revenue · this week</p>' +
        '<div class="st-bars" aria-hidden="true">' + RANGES[1][2].map(function () { return '<i></i>'; }).join('') + '</div></section></div>';

      var wrap = stage.querySelector('.st-wrap'), list = stage.querySelector('.st-list'), ind = stage.querySelector('.st-ind'), hov = stage.querySelector('.st-hov');
      var tabs = Array.prototype.slice.call(stage.querySelectorAll('.st-tab'));
      var panels = Array.prototype.slice.call(stage.querySelectorAll('[role=tabpanel]')), box = stage.querySelector('.st-panels');
      var segList = stage.querySelector('.st-seg-list'), over = stage.querySelector('.st-seg-over');
      var segs = Array.prototype.slice.call(stage.querySelectorAll('.st-seg-item'));
      var num = stage.querySelector('.st-num'), sub = stage.querySelector('.st-sub'), bars = Array.prototype.slice.call(stage.querySelectorAll('.st-bars i'));
      var cur = 0, seg = 1, hoverOn = false, anims = [], hT = 0, ro = null, raf = 0;

      function placeInd() {                       // underline hugs the label, not the hit area
        var t = tabs[cur], padX = parseFloat(getComputedStyle(t).paddingLeft) || 0;
        ind.style.transform = 'translateX(' + (t.offsetLeft + padX) + 'px) scaleX(' + (t.offsetWidth - 2 * padX) / 100 + ')';
      }
      function placeSeg() {
        var b = segs[seg], W = segList.offsetWidth, l = b.offsetLeft, r = W - (l + b.offsetWidth);
        over.style.clipPath = 'inset(3px ' + r + 'px 3px ' + l + 'px round 999px)';
      }
      function placeHov(t) { hov.style.transform = 'translateX(' + t.offsetLeft + 'px)'; hov.style.width = t.offsetWidth + 'px'; }
      function placeAll() { wrap.classList.remove('ready'); placeInd(); placeSeg(); wrap.offsetWidth; wrap.classList.add('ready'); }
      function setBars(i) {
        var v = RANGES[i][2], max = Math.max.apply(null, v);
        bars.forEach(function (b, k) { b.style.transform = 'scaleY(' + (0.08 + 0.92 * v[k] / max).toFixed(3) + ')'; b.style.transitionDelay = ctx.reduced ? '0s' : (k * 0.02) + 's'; });
      }

      function select(i, focus) {
        if (i === cur) { if (focus) tabs[i].focus(); return; }
        var dir = i > cur ? 1 : -1, oldP = panels[cur], newP = panels[i];
        tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
        if (focus) tabs[i].focus();
        cur = i; placeInd();
        anims.forEach(function (a) { a.finish(); }); anims = [];
        panels.forEach(function (p) { if (p !== oldP) { p.hidden = true; p.removeAttribute('style'); } });
        var h0 = box.offsetHeight;
        // old panel leaves out of flow (Motion popLayout idea), new one takes the space
        oldP.style.cssText = 'position:absolute;left:6px;right:6px;top:0;';
        newP.hidden = false;
        var h1 = box.offsetHeight;
        if (ctx.reduced) {
          oldP.hidden = true; oldP.removeAttribute('style');
          anims.push(newP.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 }));
          return;
        }
        box.style.transition = 'none'; box.style.height = h0 + 'px'; box.offsetHeight;
        box.style.transition = 'height ' + DUR + 'ms ' + EASE; box.style.height = h1 + 'px';
        clearTimeout(hT); hT = setTimeout(function () { box.style.transition = ''; box.style.height = ''; }, DUR + 30);
        var out = oldP.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-dir * 16) + 'px)', filter: 'blur(2px)' }],
          { duration: 150, easing: 'ease-in', fill: 'forwards' });
        out.onfinish = function () { if (panels[cur] !== oldP) oldP.hidden = true; oldP.removeAttribute('style'); out.cancel(); };
        anims.push(out, newP.animate([{ opacity: 0, transform: 'translateX(' + dir * 24 + 'px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
          { duration: 380, delay: 60, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' }));
      }
      function pick(i, focus) {
        if (i === seg) { if (focus) segs[i].focus(); return; }
        var dir = i > seg ? 1 : -1, old = num.firstChild, nu = document.createElement('span');
        segs.forEach(function (b, k) { b.setAttribute('aria-checked', k === i); b.tabIndex = k === i ? 0 : -1; });
        if (focus) segs[i].focus();
        seg = i; placeSeg(); setBars(i);
        sub.textContent = 'Revenue · this ' + RANGES[i][0].toLowerCase();
        nu.textContent = RANGES[i][1]; num.appendChild(nu);
        Array.prototype.slice.call(num.children, 0, -2).forEach(function (n) { n.remove(); });
        if (ctx.reduced) { old.remove(); return; }
        old.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(' + (-dir * 60) + '%)', opacity: 0, filter: 'blur(3px)' }], { duration: 260, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' })
          .onfinish = function () { old.remove(); };
        nu.animate([{ transform: 'translateY(' + dir * 60 + '%)', opacity: 0, filter: 'blur(3px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }], { duration: 420, delay: 40, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards' });
      }
      function keys(items, idx, go) {
        return function (e) {
          var n = items.length, i = idx(), k = e.key;
          var to = k === 'ArrowRight' || k === 'ArrowDown' ? (i + 1) % n : k === 'ArrowLeft' || k === 'ArrowUp' ? (i + n - 1) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
          if (to < 0) return; e.preventDefault(); go(to, true);
        };
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { select(i); });
        t.addEventListener('pointerenter', function (e) {
          if (e.pointerType !== 'mouse') return;
          if (!hoverOn) { hov.classList.remove('on'); placeHov(t); hov.offsetWidth; hov.classList.add('on'); hov.style.opacity = 1; hoverOn = true; }
          else placeHov(t);
        });
      });
      list.addEventListener('pointerleave', function () { hoverOn = false; hov.style.opacity = 0; });
      list.addEventListener('keydown', keys(tabs, function () { return cur; }, select));
      segs.forEach(function (b, i) { b.addEventListener('click', function () { pick(i); }); });
      segList.addEventListener('keydown', keys(segs, function () { return seg; }, pick));

      setBars(1);
      placeAll();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (stage.isConnected) placeAll(); });

      return {
        start: function () {
          raf = requestAnimationFrame(placeAll);
          if (window.ResizeObserver && !ro) { ro = new ResizeObserver(function () { placeAll(); }); ro.observe(stage); }
        },
        stop: function () {
          cancelAnimationFrame(raf); clearTimeout(hT);
          anims.forEach(function (a) { a.finish(); }); anims = [];
          box.style.transition = ''; box.style.height = '';
          if (ro) { ro.disconnect(); ro = null; }
        }
      };
    }
  });
})();
