/* drag-sheet-drawer — Vaul-pattern bottom sheet: direct drag, damped overdrag, velocity snap logic, page scales into a card */
(function () {
  var ID = 'drag-sheet-drawer';
  var EASE = 'cubic-bezier(0.32, 0.72, 0, 1)', DUR = 500, VEL = 0.4, TOP_GAP = 34;
  var ROWS = [['Today', 'Open · 08:00–19:00'], ['Walk', '6 min · 450 m'], ['Practice', 'Spatial & identity'], ['Team', '9 people'], ['Founded', '2014'],
    ['Next talk', 'Thu 19:00 · Light as material'], ['Studio size', '240 m²'], ['Phone', '+351 21 000 0000'], ['Visits', 'By appointment']];
  var dampen = function (v) { return 8 * (Math.log(v + 1) - 2); };

  Lib.register(ID, {
    hint: 'Drag the sheet by its handle or header, flick it, or tap the handle to cycle snap points. Focus the handle and use ↑ ↓; Esc closes.',
    notes: [
      'Every settle is <code>transform .5s cubic-bezier(.32,.72,0,1)</code> (Ionic’s iOS curve); while the finger is down it is <code>transition:none</code> and the transform is written directly on the sheet',
      'Release: <code>v = |Δ| / drag time</code> (average px/ms); <code>v &gt; 2</code> jumps to the end, <code>v &gt; 0.4</code> steps one snap, otherwise nearest snap',
      'Past the top: <code>8·(ln(d + 1) − 2)</code>, so it holds for ~6 px, then creeps ~21 px for 100 px of finger travel',
      'Page behind becomes a card: <code>scale((W − 26)/W)</code>, 8 px radius, 14 px down, interpolated with the overlay between the middle and top snap',
      'Drag claims after 10 px (touch) / 2 px (mouse) of mostly vertical travel; a scrolled list wins over the drag, with a 100 ms lock after it hits the top'
    ],
    simplified: 'Sized to the stage instead of the window, snap heights are measured from the sheet, “closed” is an extra release candidate (Vaul never closes on a slow drag with snap points), and on touch the list only scrolls (drag from the header).',
    css: [
      '.d-drag-sheet-drawer { container-type: inline-size; background: #000; }',
      '.d-drag-sheet-drawer .ds-app { position: absolute; inset: 0; overflow: hidden; background: #0c0c0c; transform-origin: top center; will-change: transform; }',
      '.d-drag-sheet-drawer .ds-edge { position: absolute; inset: 0; z-index: 5; border-radius: inherit; border: 1px solid rgb(255 255 255 / .16); opacity: 0; pointer-events: none; }',
      '.d-drag-sheet-drawer .ds-map { position: absolute; inset: 0; width: 100%; height: 100%; }',
      '.d-drag-sheet-drawer .ds-top { position: absolute; left: 0; right: 0; top: 0; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 16px; padding: clamp(18px, 3.4cqw, 30px) clamp(20px, 4cqw, 40px) 0; }',
      '.d-drag-sheet-drawer .ds-brand { color: #fff; letter-spacing: .32em; } .d-drag-sheet-drawer .ds-hud { color: rgb(255 255 255 / .45); } .d-drag-sheet-drawer .ds-hud b { color: rgb(255 255 255 / .9); font-weight: 500; } .d-drag-sheet-drawer .ds-hud em { font-style: normal; color: #f97316; }',
      '.d-drag-sheet-drawer .ds-title { position: absolute; left: clamp(20px, 4cqw, 40px); top: clamp(64px, 11cqw, 104px); }',
      '.d-drag-sheet-drawer .ds-title .label { color: #f97316; margin: 0 0 10px; }',
      '.d-drag-sheet-drawer .ds-title h4 { margin: 0 0 18px; font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; font-size: clamp(26px, 4.6cqw, 50px); line-height: 1; letter-spacing: -.02em; color: #fff; }',
      '.d-drag-sheet-drawer .ds-open { padding: 11px 18px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .22); background: rgb(0 0 0 / .4); color: rgb(255 255 255 / .9); font-size: 13px; transition: border-color .2s, transform .16s cubic-bezier(.23,1,.32,1); }',
      '.d-drag-sheet-drawer .ds-open:hover { border-color: #fff; } .d-drag-sheet-drawer .ds-open:active { transform: scale(.97); }',
      '.d-drag-sheet-drawer .ds-overlay { position: absolute; inset: 0; background: rgb(0 0 0 / .4); opacity: 0; pointer-events: none; z-index: 2; }',
      '.d-drag-sheet-drawer .ds-overlay.on { pointer-events: auto; }',
      '.d-drag-sheet-drawer .ds-sheet { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; display: flex; flex-direction: column; background: #121212; border-radius: 14px 14px 0 0; border-top: 1px solid rgb(255 255 255 / .1); box-shadow: 0 -20px 60px rgb(0 0 0 / .6); touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab; transform: translate3d(0, 110%, 0); will-change: transform; }',
      '.d-drag-sheet-drawer .ds-sheet::after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 200%; background: inherit; }',
      '.d-drag-sheet-drawer .ds-sheet.drag { cursor: grabbing; }',
      '.d-drag-sheet-drawer .ds-handle { position: relative; display: block; width: 100%; height: 26px; flex: none; }',
      '.d-drag-sheet-drawer .ds-handle i { position: absolute; left: 50%; top: 11px; width: 32px; height: 5px; margin-left: -16px; border-radius: 1rem; background: rgb(255 255 255 / .32); opacity: .7; transition: opacity .2s; }',
      '.d-drag-sheet-drawer .ds-handle:hover i, .d-drag-sheet-drawer .ds-handle:active i, .d-drag-sheet-drawer .ds-handle:focus-visible i { opacity: 1; }',
      '.d-drag-sheet-drawer .ds-handle:focus-visible { outline: none; } .d-drag-sheet-drawer .ds-handle:focus-visible i { background: #f97316; }',
      '.d-drag-sheet-drawer .ds-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 4px clamp(18px, 3.4cqw, 28px) 14px; }',
      '.d-drag-sheet-drawer .ds-head .label { color: #f97316; margin: 0 0 6px; } .d-drag-sheet-drawer .ds-head h5 { margin: 0 0 4px; font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; font-size: 22px; line-height: 1.1; letter-spacing: -.01em; color: #fff; }',
      '.d-drag-sheet-drawer .ds-meta { margin: 0; font-size: 13px; color: rgb(255 255 255 / .55); }',
      '.d-drag-sheet-drawer .ds-x { width: 32px; height: 32px; flex: none; border-radius: 50%; background: rgb(255 255 255 / .08); color: rgb(255 255 255 / .8); display: grid; place-items: center; transition: background .2s; } .d-drag-sheet-drawer .ds-x:hover { background: rgb(255 255 255 / .16); }',
      '.d-drag-sheet-drawer .ds-chips { display: flex; gap: 8px; padding: 0 clamp(18px, 3.4cqw, 28px) 18px; }',
      '.d-drag-sheet-drawer .ds-chips button { flex: 1; height: 40px; border-radius: 10px; background: rgb(255 255 255 / .07); color: rgb(255 255 255 / .9); font-size: 13px; transition: background .2s, transform .16s cubic-bezier(.23,1,.32,1); } .d-drag-sheet-drawer .ds-chips button:first-child { background: #fff; color: #000; font-weight: 500; }',
      '.d-drag-sheet-drawer .ds-chips button:active { transform: scale(.97); }',
      '.d-drag-sheet-drawer .ds-scroll { flex: 1; min-height: 0; overflow: hidden; overscroll-behavior: contain; padding: 0 clamp(18px, 3.4cqw, 28px) 24px; touch-action: pan-y; }',
      '.d-drag-sheet-drawer .ds-sheet.top .ds-scroll { overflow-y: auto; }',
      '.d-drag-sheet-drawer .ds-row { display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-top: 1px solid rgb(255 255 255 / .08); }',
      '.d-drag-sheet-drawer .ds-row dt { color: rgb(255 255 255 / .45); } .d-drag-sheet-drawer .ds-row dd { margin: 0; font-size: 13px; color: rgb(255 255 255 / .88); text-align: right; }',
      '.d-drag-sheet-drawer .ds-scroll p { margin: 16px 0 0; font-size: 13px; line-height: 1.6; color: rgb(255 255 255 / .55); }',
      '.d-drag-sheet-drawer dl { margin: 0; }'
    ].join('\n'),

    mount: function (stage, ctx) {
      var R = ctx.reduced;
      stage.innerHTML =
        '<div class="ds-app">' +
          '<svg class="ds-map" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
            '<path d="M-20 430 C 160 380 300 470 470 420 S 720 360 820 390 L 820 520 L -20 520 Z" fill="rgb(255 255 255 / .035)"/>' +
            '<g fill="none" stroke="rgb(255 255 255 / .07)" stroke-linecap="round">' +
              '<path d="M-10 120 L 820 60" stroke-width="5"/><path d="M80 -10 L 180 520" stroke-width="3"/><path d="M300 -10 C 320 140 260 260 330 520" stroke-width="6"/>' +
              '<path d="M-10 260 C 200 240 420 300 820 230" stroke-width="3"/><path d="M520 -10 L 600 520" stroke-width="2"/><path d="M660 -10 C 640 160 720 300 700 520" stroke-width="4"/>' +
              '<path d="M-10 350 L 820 310" stroke-width="2"/><path d="M420 -10 L 380 520" stroke-width="1.5"/><path d="M200 60 L 640 420" stroke-width="1.5"/></g>' +
            '<path d="M150 330 C 230 300 280 250 330 236 S 470 210 560 160 S 650 120 690 96" fill="none" stroke="#f97316" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/>' +
            '<g fill="#f97316"><circle cx="150" cy="330" r="5"/><circle cx="560" cy="160" r="5" opacity=".5"/><circle cx="690" cy="96" r="7"/></g>' +
            '<circle cx="690" cy="96" r="16" fill="none" stroke="#f97316" stroke-opacity=".45"/></svg>' +
          '<div class="ds-edge" aria-hidden="true"></div><div class="ds-top"><span class="label ds-brand">MOLIN · FIELD NOTES</span><span class="label ds-hud" aria-hidden="true"></span></div>' +
          '<div class="ds-title"><p class="label">[ Lisbon, 07:42 ]</p><h4>Three studios,<br>one morning walk</h4>' +
          '<button type="button" class="ds-open" aria-haspopup="dialog" aria-expanded="false">View studio</button></div>' +
        '</div>' +
        '<div class="ds-overlay" aria-hidden="true"></div>' +
        '<div class="ds-sheet" role="dialog" aria-label="Atelier Alfama" aria-hidden="true" inert>' +
          '<button type="button" class="ds-handle" aria-label="Sheet size. Arrow keys resize, Enter cycles" data-cursor="Drag"><i aria-hidden="true"></i></button>' +
          '<div class="ds-head"><div><p class="label">Nº 02 · Studio</p><h5>Atelier Alfama</h5><p class="ds-meta">Rua de São Miguel 14 · 6 min walk</p></div>' +
          '<button type="button" class="ds-x" aria-label="Close"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8m0-8l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button></div>' +
          '<div class="ds-chips"><button type="button">Directions</button><button type="button">Save</button><button type="button">Share</button></div>' +
          '<div class="ds-scroll"><dl>' + ROWS.map(function (r) { return '<div class="ds-row"><dt class="label">' + r[0] + '</dt><dd>' + r[1] + '</dd></div>'; }).join('') + '</dl>' +
          '<p>A ground-floor studio in an old tile workshop. Drag the sheet down from here once the list is back at the top; scroll it while it is not.</p></div>' +
        '</div>';
      var app = stage.querySelector('.ds-app'), overlay = stage.querySelector('.ds-overlay'), sheet = stage.querySelector('.ds-sheet');
      var handle = stage.querySelector('.ds-handle'), scroll = stage.querySelector('.ds-scroll'), hud = stage.querySelector('.ds-hud'), edge = stage.querySelector('.ds-edge'), openBtn = stage.querySelector('.ds-open');
      var W = 0, H = 0, Hs = 0, offs = [0, 0, 0], idx = 1, isOpen = false, y = 0, timers = [], ro = null, drag = null;
      var lastPrevented = 0, topAt = 0, lastDragEnd = 0, pressT = 0, longPress = false, played = false, last = '';

      function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
      function measure() {
        var r = stage.getBoundingClientRect(); W = r.width; H = r.height; Hs = H - TOP_GAP;
        sheet.style.height = Hs + 'px';
        var v = [Math.min(156, Hs * .4), Math.round(Hs * .5), Hs];                  // snap points: 156px, .5, 1
        offs = v.map(function (h) { return Math.round(Hs - h); });
      }
      function prog(yy) { return ctx.clamp((offs[1] - yy) / Math.max(1, offs[1] - offs[2]), 0, 1); }
      function apply(yy, anim) {
        y = yy;
        var t = anim && !R ? DUR / 1000 + 's ' + EASE : null;
        sheet.style.transition = t ? 'transform ' + t : R ? 'opacity .2s ease' : 'none';
        sheet.style.transform = 'translate3d(0,' + yy.toFixed(1) + 'px,0)';
        var p = isOpen ? prog(yy) : 0, s = (W - 26) / W;                                // Vaul: (innerWidth − 26) / innerWidth
        overlay.style.transition = anim ? 'opacity ' + (R ? '.2s ease' : t) : 'none';
        overlay.style.opacity = p.toFixed(3);
        overlay.classList.toggle('on', isOpen && idx === 2 && !drag);
        app.style.transition = t ? 'transform ' + t + ', border-radius ' + t : 'none';
        app.style.transform = 'scale(' + (1 - p * (1 - s)).toFixed(4) + ') translate3d(0,' + (14 * p).toFixed(2) + 'px,0)';
        app.style.borderRadius = (8 * p).toFixed(2) + 'px';
        edge.style.transition = overlay.style.transition; edge.style.opacity = p.toFixed(3);
      }
      function status() {
        hud.innerHTML = isOpen ? 'Snap <b>' + (idx + 1) + '</b> / 3' + (last ? ' · ' + last : '') : 'Closed' + (last ? ' · ' + last : '');
        handle.setAttribute('aria-label', 'Sheet size ' + (idx + 1) + ' of 3. Arrow keys resize, Enter cycles');
      }
      function snapTo(i, why) {
        idx = i; isOpen = true;
        sheet.classList.toggle('top', i === 2);
        if (i === 2) topAt = Date.now();
        app.inert = i === 2;                                                     // modal only at the top snap
        last = why || ''; apply(offs[i], true); status();
      }
      function open(i) {
        if (isOpen) return snapTo(i);
        isOpen = true; sheet.inert = false; sheet.removeAttribute('aria-hidden'); openBtn.setAttribute('aria-expanded', 'true');
        if (R) { sheet.style.opacity = '0'; apply(offs[i], false); requestAnimationFrame(function () { sheet.style.opacity = '1'; snapTo(i); }); }
        else { apply(Hs, false); void sheet.offsetHeight; snapTo(i); }
        handle.focus({ preventScroll: true });
      }
      function close(why) {
        if (!isOpen) return;
        isOpen = false; idx = 1; app.inert = false; sheet.classList.remove('top');
        last = why || '';
        if (R) sheet.style.opacity = '0';
        apply(R ? y : Hs, true); status();
        sheet.inert = true; sheet.setAttribute('aria-hidden', 'true'); openBtn.setAttribute('aria-expanded', 'false');
        if (stage.contains(document.activeElement) || document.activeElement === document.body) openBtn.focus({ preventScroll: true });
        if (R) later(function () { if (!isOpen) { apply(Hs, false); sheet.style.opacity = ''; } }, 220);
      }

      // Vaul's shouldDrag: let a scrolled list scroll, lock 100 ms after it reaches the top
      function shouldDrag(target, towardOpen) {
        var now = Date.now(), inList = scroll.contains(target);
        if (inList && now - topAt < DUR) return false;
        if (y > 0.5) return true;                                               // not fully open: always drag
        var sel = window.getSelection && String(window.getSelection());
        if (sel) return false;
        if (now - lastPrevented < 100 && inList) { lastPrevented = now; return false; }
        if (towardOpen && inList) { lastPrevented = now; return false; }
        if (inList && scroll.scrollTop > 0) { lastPrevented = now; return false; }
        return true;
      }
      function release(dist, v) {
        var up = dist > 0, cur = offs[idx] - dist, vtxt = 'v ' + v.toFixed(2) + ' px/ms → ';
        if (v > 2 && !up) return close(vtxt + '<em>flick, close</em>');
        if (v > 2 && up) return snapTo(2, vtxt + '<em>flick, top</em>');
        if (v > VEL && Math.abs(dist) < H * 0.4) {
          if (up && idx === 2) return snapTo(2, vtxt + 'stay');
          if (!up && idx === 0) return close(vtxt + '<em>step, close</em>');
          return snapTo(idx + (up ? 1 : -1), vtxt + '<em>step ' + (up ? 'up' : 'down') + '</em>');
        }
        var best = 0;
        offs.forEach(function (o, i) { if (Math.abs(o - cur) < Math.abs(offs[best] - cur)) best = i; });
        if (cur - offs[0] > (Hs - offs[0]) * 0.5) return close(vtxt + 'past half, close');   // our addition
        snapTo(best, vtxt + 'nearest');
      }

      function onDown(e) {
        if (!isOpen || drag || (e.button && e.button > 0)) return;              // ignore extra touches while dragging
        drag = { id: e.pointerId, x0: e.pageX, y0: e.pageY, t0: Date.now(), base: y, on: false, th: e.pointerType === 'touch' ? 10 : 2, dist: 0 };
        if (e.target.closest('.ds-handle')) { pressT = Date.now(); longPress = false; later(function () { if (pressT) longPress = true; }, 250); }
      }
      function onMove(e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.pageX - drag.x0, dy = e.pageY - drag.y0;
        if (!drag.on) {
          if (Math.abs(dx) <= drag.th && Math.abs(dy) <= drag.th) return;
          if (Math.abs(dx) > Math.abs(dy) || !shouldDrag(e.target, dy < 0)) { drag = null; return; }
          drag.on = true; drag.base = y;
          try { sheet.setPointerCapture(e.pointerId); } catch (err) {}
          sheet.classList.add('drag');
        }
        drag.dist = drag.y0 - e.pageY;                                             // + = toward open
        var ny = (idx >= 0 ? offs[idx] : drag.base) - drag.dist;
        if (ny < 0) ny = Math.min(-dampen(-ny), 0);                             // damped overdrag past the top
        apply(ny, false);
      }
      function onUp(e) {
        pressT = 0;
        if (!drag || e.pointerId !== drag.id) return;
        var d = drag; drag = null;
        if (!d.on) return;
        sheet.classList.remove('drag'); lastDragEnd = Date.now();
        release(d.dist, Math.abs(d.dist) / Math.max(1, Date.now() - d.t0));
      }
      sheet.addEventListener('pointerdown', onDown);
      sheet.addEventListener('pointermove', onMove);
      sheet.addEventListener('pointerup', onUp);
      sheet.addEventListener('pointercancel', onUp);
      scroll.addEventListener('scroll', function () { if (scroll.scrollTop <= 0) lastPrevented = Date.now(); }, { passive: true });

      handle.addEventListener('click', function () {
        if (Date.now() - lastDragEnd < 60 || longPress) { longPress = false; return; }
        later(function () { if (idx === 2) close('handle tap, close'); else snapTo(idx + 1, 'handle tap'); }, 120);   // 120 ms double-tap guard
      });
      handle.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp') { e.preventDefault(); snapTo(Math.min(2, idx + 1), 'key ↑'); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); if (idx === 0) close('key ↓, close'); else snapTo(idx - 1, 'key ↓'); }
      });
      sheet.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); close('Esc'); } });
      stage.querySelector('.ds-x').addEventListener('click', function () { close('close button'); });
      overlay.addEventListener('click', function () { close('overlay'); });
      openBtn.addEventListener('click', function () { last = ''; open(1); });

      measure(); apply(Hs, false); status();

      return {
        start: function () {
          ro = new ResizeObserver(function () { measure(); apply(isOpen ? offs[idx] : Hs, false); });
          ro.observe(stage);
          if (!played) { played = true; later(function () { if (!isOpen) { isOpen = true; sheet.inert = false; sheet.removeAttribute('aria-hidden'); openBtn.setAttribute('aria-expanded', 'true'); apply(Hs, false); void sheet.offsetHeight; snapTo(1); } }, 500); }
        },
        stop: function () {
          if (ro) { ro.disconnect(); ro = null; }
          timers.forEach(clearTimeout); timers = [];
          if (drag) { drag = null; sheet.classList.remove('drag'); if (isOpen) apply(offs[idx], false); }
        },
        replay: function () {
          close('replay');
          later(function () { last = ''; open(1); }, R ? 300 : DUR + 150);
        }
      };
    }
  });
})();
