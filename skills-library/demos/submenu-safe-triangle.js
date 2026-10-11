/* submenu-safe-triangle — Radix-style pointer grace area for submenus, drawn live, with an on/off comparison */
(function () {
  var ID = 'submenu-safe-triangle', P = '.d-' + ID + ' ';
  function svg(p) { return '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  var IC = {
    open: svg('<path d="M9.5 3.5h3v3M12.5 3.5L7.5 8.5M11 9.5v3h-7.5v-7.5h3"/>'), move: svg('<path d="M2.5 4.5a1 1 0 011-1h3l1.5 1.5h4.5a1 1 0 011 1v6a1 1 0 01-1 1h-9a1 1 0 01-1-1z"/>'),
    user: svg('<circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.6-2.6 2.6-4 5-4s4.4 1.4 5 4"/>'), tag: svg('<path d="M2.5 8.2V3.5a1 1 0 011-1h4.7l5.3 5.3-6 6z"/><circle cx="5.5" cy="5.5" r=".8"/>'),
    link: svg('<path d="M6.6 9.4l2.8-2.8M7.2 4.6l1-1a2.6 2.6 0 013.7 3.7l-1 1M8.8 11.4l-1 1a2.6 2.6 0 01-3.7-3.7l1-1"/>'), trash: svg('<path d="M3.5 4.5h9M6.5 4.5V3h3v1.5M4.5 4.5l.7 8.5h5.6l.7-8.5"/>'),
    chev: svg('<path d="M6 4l4 4-4 4"/>'), check: svg('<path d="M3.5 8.5l3 3 6-7"/>'), dot: svg('<circle cx="8" cy="8" r="3" fill="currentColor" stroke="none"/>')
  };
  var ROOT = [['open', 'Open issue', IC.open, '↵'], ['move', 'Move to', IC.move, null, 'move'], ['assign', 'Assign to', IC.user, null, 'assign'], ['labels', 'Labels', IC.tag, null, 'labels'], '-', ['copy', 'Copy link', IC.link, '⌘L'], ['del', 'Delete', IC.trash, '⌫']];
  var SUBS = {
    move: { label: 'Move to', items: ['Website', 'Mobile app', 'Design system', 'Brand refresh', 'Motion library', 'Backlog'], icon: IC.move },
    assign: { label: 'Assign to', items: ['Isac (you)', 'Mira Lind', 'Jonas Ek', 'Sana Berg', 'Theo Falk'], icon: IC.user },
    labels: { label: 'Labels', items: ['Bug', 'Feature', 'Motion', 'Polish', 'Accessibility'], icon: IC.dot, check: true }
  };
  var css = [
    '& { container-type: inline-size; font-size: 13px; color: rgb(255 255 255 / .9); }',
    '.ss-app { position: absolute; inset: 0; background: radial-gradient(70% 60% at 85% 20%, rgb(249 115 22 / .08), transparent 60%), #070707; }',
    '.ss-copy { position: absolute; right: 28px; top: 26px; max-width: 34ch; text-align: right; }',
    '.ss-copy h4 { margin: 0 0 10px; font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; letter-spacing: -.02em; font-size: clamp(22px, 3.6cqw, 36px); line-height: 1.05; color: #fff; }',
    '.ss-copy p { margin: 0; color: rgb(255 255 255 / .5); line-height: 1.5; }',
    '.ss-menu { position: absolute; min-width: 196px; padding: 4px; border-radius: 10px; background: rgb(20 20 20 / .94); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); border: 1px solid rgb(255 255 255 / .1); box-shadow: 0 16px 40px -8px rgb(0 0 0 / .7), 0 2px 6px rgb(0 0 0 / .4); outline: none; z-index: 3; }',
    '.ss-root { left: clamp(14px, 6cqw, 64px); top: clamp(70px, 22%, 130px); }',
    '.ss-sub { left: 0; top: 0; min-width: 176px; z-index: 4; transform-origin: var(--origin, 0 0); animation: dss-in 160ms cubic-bezier(.23,1,.32,1) both; }',
    '.ss-sub[hidden] { display: none; }',
    '.ss-sub[data-side=right] { --sx: -8px; } .ss-sub[data-side=left] { --sx: 8px; }',
    '.ss-it { display: flex; align-items: center; gap: 9px; height: 32px; padding: 0 8px; border-radius: 6px; color: rgb(255 255 255 / .8); cursor: default; outline: none; user-select: none; }',
    '.ss-it svg { color: rgb(255 255 255 / .5); flex: none; }',
    '.ss-it[data-highlighted], .ss-it[data-state=open] { background: rgb(255 255 255 / .08); color: #fff; } .ss-it[data-highlighted] svg { color: #fff; }',
    '.ss-it.blocked { box-shadow: inset 0 0 0 1px rgb(249 115 22 / .55); }',
    '.ss-it .ss-k, .ss-it .ss-ch { margin-left: auto; padding-left: 14px; color: rgb(255 255 255 / .35); font-size: 12px; }',
    '.ss-it .ss-ch svg { color: rgb(255 255 255 / .45); }',
    '.ss-it .ss-ck { margin-left: auto; visibility: hidden; } .ss-it[aria-checked=true] .ss-ck { visibility: visible; } .ss-it .ss-ck svg { color: #fff; }',
    '.ss-sep { height: 1px; margin: 4px -4px; background: rgb(255 255 255 / .08); }',
    '.ss-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; overflow: visible; }',
    '.ss-poly { fill: rgb(249 115 22 / .1); stroke: #f97316; stroke-width: 1; stroke-dasharray: 3 3; }',
    '.ss-ex { fill: #f97316; }',
    '.ss-bar { position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: center; gap: 18px; padding: 14px 18px; border-top: 1px solid rgb(255 255 255 / .07); color: rgb(255 255 255 / .45); z-index: 2; white-space: nowrap; }',
    '.ss-bar b { color: #fff; font-weight: 500; }',
    '.ss-tg { display: inline-flex; align-items: center; gap: 8px; height: 32px; color: rgb(255 255 255 / .75); }',
    '.ss-sw { width: 26px; height: 15px; border-radius: 9px; background: rgb(255 255 255 / .15); position: relative; transition: background .2s; }',
    '.ss-sw::after { content: ""; position: absolute; left: 2px; top: 2px; width: 11px; height: 11px; border-radius: 50%; background: #fff; transition: transform .2s cubic-bezier(.23,1,.32,1); }',
    '[aria-pressed=true] .ss-sw { background: #f97316; } [aria-pressed=true] .ss-sw::after { transform: translateX(11px); }',
    '.ss-saved { margin-left: auto; }',
    '.ss-mob { display: none; position: absolute; left: 18px; right: 18px; bottom: 76px; margin: 0; color: rgb(255 255 255 / .45); line-height: 1.5; }',
    '.ss-toast { position: absolute; left: 50%; bottom: 72px; transform: translate(-50%, 6px); padding: 8px 14px; border-radius: 999px; background: rgb(255 255 255 / .1); border: 1px solid rgb(255 255 255 / .12); color: #fff; opacity: 0; transition: opacity .2s, transform .3s cubic-bezier(.23,1,.32,1); pointer-events: none; z-index: 6; white-space: nowrap; }',
    '.ss-toast.on { opacity: 1; transform: translate(-50%, 0); }'
  ].join('\n').replace(/([^{}]+)\{([^{}]*)\}/g, function (m, sel, body) {
    return sel.split(',').map(function (x) { x = x.trim(); return x === '&' ? '.d-' + ID : P + x; }).join(', ') + ' {' + body + '}';
  }) +
    '\n@container (max-width: 640px) { ' + P + '.ss-copy { display: none; } ' + P + '.ss-root { top: 24px; left: 14px; } ' + P + '.ss-menu { min-width: 168px; } ' + P + '.ss-dirw, ' + P + '.ss-saved { display: none; } ' + P + '.ss-bar { gap: 14px; } ' + P + '.ss-mob { display: block; } }' +
    '\n@media (prefers-reduced-motion: reduce) { ' + P + '.ss-sub { animation-name: dss-fade; animation-duration: 100ms; } }' +
    '\n@keyframes dss-in { from { opacity: 0; transform: translateX(var(--sx, 0)) scale(.95); } } @keyframes dss-fade { from { opacity: 0; } }';

  Lib.register(ID, {
    hint: 'Hover “Move to”, then cut diagonally to its last item across “Assign to”. Turn the safe triangle off and try again. Keys: ↓ ↑, → opens, ← closes.',
    notes: [
      'Grace polygon on sub-trigger leave: <code>[exit point ± 5 px bleed, near-top, far-top, far-bottom, near-bottom]</code> of the submenu',
      'Valid only while the pointer keeps moving toward the submenu side, and only for <b>300 ms</b> after leaving the trigger',
      'While inside it, sibling items can’t take the highlight (Radix <code>onItemEnter → preventDefault</code>)',
      'Sub-triggers open after a <b>100 ms</b> hover; <code>→ / Enter / Space</code> open and focus the first item, <code>←</code> closes back to the trigger',
      'Amazon’s menu-aim variant: slopes from the last 3 mouse positions, 75 px tolerance, 300 ms delay'
    ],
    simplified: 'The root menu stays pinned open for the demo instead of hanging off a trigger, and the polygon is drawn for teaching. Submenu exits are instant.',
    css: css,
    mount: function (stage, ctx) {
      stage.innerHTML = '<div class="ss-app"><div class="ss-copy"><p class="label" style="color:#f97316;margin:0 0 12px">Pointer grace area</p><h4>Cut the corner. The submenu waits.</h4>' +
        '<p>The orange polygon is the area Radix trusts as “on the way to the submenu”.</p></div>' +
        '<div class="ss-menu ss-root" role="menu" aria-label="Issue actions" tabindex="-1"></div>' +
        '<svg class="ss-svg" aria-hidden="true"><polygon class="ss-poly" points=""></polygon><circle class="ss-ex" r="3" cx="-9" cy="-9"></circle></svg>' +
        '<div class="ss-bar label"><button type="button" class="ss-tg label" aria-pressed="true"><span class="ss-sw" aria-hidden="true"></span>Safe triangle</button>' +
        '<span class="ss-dirw" aria-hidden="true">Dir <b class="ss-dir">—</b></span><span aria-hidden="true">Grace <b class="ss-int">none</b></span><span class="ss-saved" aria-hidden="true">Saved <b class="ss-n">0</b></span></div>' +
        '<p class="ss-mob">On touch, tap a ▸ row to open its submenu. The grace area only applies to a mouse cutting diagonally.</p>' +
        '<div class="ss-toast" role="status" aria-live="polite"></div></div>';
      var $ = function (s) { return stage.querySelector(s); };
      var root = $('.ss-root'), app = $('.ss-app'), poly = $('.ss-poly'), ex = $('.ss-ex'), toast = $('.ss-toast');
      var dirEl = $('.ss-dir'), intEl = $('.ss-int'), nEl = $('.ss-n'), tg = $('.ss-tg');
      var safe = true, intent = null, graceT = 0, openT = 0, dir = 'right', lastX = 0, saved = 0, toastT = 0, openSub = null, blockedEl = null;
      var subs = {};

      root.innerHTML = ROOT.map(function (r) {
        if (r === '-') return '<div class="ss-sep" role="separator"></div>';
        return '<div class="ss-it" role="menuitem" tabindex="-1" data-v="' + r[0] + '" id="ss-r-' + r[0] + '"' + (r[4] ? ' data-sub="' + r[4] + '" aria-haspopup="menu" aria-expanded="false" data-state="closed"' : '') + '>' +
          r[2] + '<span>' + r[1] + '</span>' + (r[3] ? '<span class="ss-k">' + r[3] + '</span>' : '') + (r[4] ? '<span class="ss-ch">' + IC.chev + '</span>' : '') + '</div>';
      }).join('');
      Object.keys(SUBS).forEach(function (key) {
        var d = SUBS[key], n = ctx.el('div', 'ss-menu ss-sub');
        n.id = 'ss-sub-' + key; n.hidden = true; n.tabIndex = -1; n.setAttribute('role', 'menu'); n.setAttribute('aria-labelledby', 'ss-r-' + key);
        n.innerHTML = d.items.map(function (t, i) {
          return '<div class="ss-it" role="' + (d.check ? 'menuitemcheckbox' : 'menuitem') + '" tabindex="-1" data-v="' + t + '"' + (d.check ? ' aria-checked="' + (i === 2) + '"' : '') + '>' +
            d.icon + '<span>' + t + '</span>' + (d.check ? '<span class="ss-ck">' + IC.check + '</span>' : '') + '</div>';
        }).join('');
        app.appendChild(n); subs[key] = n;
      });
      var rootItems = Array.prototype.slice.call(root.querySelectorAll('.ss-it'));

      function say(t) { toast.textContent = t; toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('on'); }, 1500); }
      function hl(menu, n, noFocus) {
        menu.querySelectorAll('.ss-it').forEach(function (x) { if (x !== n) x.removeAttribute('data-highlighted'); });
        if (n) { n.setAttribute('data-highlighted', ''); if (!noFocus) n.focus({ preventScroll: true }); } else if (!noFocus) menu.focus({ preventScroll: true });
      }
      function place(trigger, node) {
        var b = app.getBoundingClientRect(), t = trigger.getBoundingClientRect(), w = node.offsetWidth, h = node.offsetHeight, pad = 8, side = 'right';
        var pr = trigger.parentNode.getBoundingClientRect();
        if (b.right - pr.right < w + pad && pr.left - b.left > b.right - pr.right) side = 'left';
        var x = side === 'right' ? pr.right - 2 : pr.left + 2 - w, y = t.top - 5;
        x = Math.min(Math.max(x, b.left + pad), b.right - pad - w); y = Math.min(Math.max(y, b.top + pad), b.bottom - 60 - h);
        node.style.left = (x - b.left) + 'px'; node.style.top = (y - b.top) + 'px'; node.dataset.side = side;
        node.style.setProperty('--origin', (side === 'right' ? 0 : w) + 'px ' + ctx.clamp(t.top + t.height / 2 - y, 0, h) + 'px');
      }
      function closeSub(focusTrigger) {
        clearTimeout(openT); openT = 0;
        if (!openSub) return;
        var tr = openSub.trigger; subs[openSub.key].hidden = true;
        tr.setAttribute('aria-expanded', 'false'); tr.setAttribute('data-state', 'closed'); tr.removeAttribute('aria-controls');
        openSub = null; if (focusTrigger) hl(root, tr);
      }
      function open(tr, focusFirst) {
        clearTimeout(openT); openT = 0;
        if (openSub && openSub.trigger === tr) { if (focusFirst) hl(subs[tr.dataset.sub], subs[tr.dataset.sub].querySelector('.ss-it')); return; }
        closeSub(false);
        var node = subs[tr.dataset.sub];
        node.hidden = false; place(tr, node);
        node.style.animation = 'none'; void node.offsetWidth; node.style.animation = '';
        tr.setAttribute('aria-expanded', 'true'); tr.setAttribute('data-state', 'open'); tr.setAttribute('aria-controls', node.id);
        openSub = { trigger: tr, key: tr.dataset.sub };
        hl(node, null, true);
        if (focusFirst) hl(node, node.querySelector('.ss-it'));
      }
      /* ---------- grace area ---------- */
      function inPoly(p, poly) {
        var ins = false;
        for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          var a = poly[i], c = poly[j];
          if ((a.y > p.y) !== (c.y > p.y) && p.x < (c.x - a.x) * (p.y - a.y) / (c.y - a.y) + a.x) ins = !ins;
        }
        return ins;
      }
      function movingToSub(e) { return safe && intent && dir === intent.side && inPoly({ x: e.clientX, y: e.clientY }, intent.area); }
      function clearIntent() {
        intent = null; clearTimeout(graceT); intEl.textContent = 'none';
        if (blockedEl) { blockedEl.classList.remove('blocked'); blockedEl = null; }
      }
      function drawIntent(e) {
        var b = app.getBoundingClientRect();
        poly.setAttribute('points', intent.area.map(function (p) { return (p.x - b.left).toFixed(1) + ',' + (p.y - b.top).toFixed(1); }).join(' '));
        ex.setAttribute('cx', e.clientX - b.left); ex.setAttribute('cy', e.clientY - b.top);
        var g = stage.querySelector('.ss-svg');
        g.getAnimations().forEach(function (a) { a.cancel(); });
        g.animate([{ opacity: 1 }, { opacity: 1, offset: .7 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
      }
      root.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        if (e.clientX !== lastX) { dir = e.clientX > lastX ? 'right' : 'left'; lastX = e.clientX; dirEl.textContent = dir === 'right' ? '→' : '←'; }
      });
      rootItems.forEach(function (it) {
        it.addEventListener('pointermove', function (e) {
          if (e.pointerType !== 'mouse') return;
          if (movingToSub(e)) {
            if (openSub && openSub.trigger !== it && blockedEl !== it) { if (blockedEl) blockedEl.classList.remove('blocked'); blockedEl = it; it.classList.add('blocked'); saved++; nEl.textContent = saved; }
            return;
          }
          if (blockedEl) { blockedEl.classList.remove('blocked'); blockedEl = null; }
          if (!it.hasAttribute('data-highlighted')) hl(root, it);
          if (it.dataset.sub) {
            if ((!openSub || openSub.trigger !== it) && !openT) { clearIntent(); openT = setTimeout(function () { openT = 0; open(it, false); }, 100); }
          } else closeSub(false);
        });
        it.addEventListener('pointerleave', function (e) {
          if (e.pointerType !== 'mouse') return;
          clearTimeout(openT); openT = 0;
          if (it.dataset.sub && openSub && openSub.trigger === it && safe) {
            var r = subs[it.dataset.sub].getBoundingClientRect(), side = subs[it.dataset.sub].dataset.side, right = side === 'right';
            var near = right ? r.left : r.right, far = right ? r.right : r.left;
            intent = { side: side, area: [{ x: e.clientX + (right ? -5 : 5), y: e.clientY }, { x: near, y: r.top }, { x: far, y: r.top }, { x: far, y: r.bottom }, { x: near, y: r.bottom }] };
            intEl.textContent = 'active'; drawIntent(e);
            clearTimeout(graceT); graceT = setTimeout(clearIntent, 300);
          }
          if (movingToSub(e)) return;
          if (!e.relatedTarget || !root.contains(e.relatedTarget)) { hl(root, null); closeSub(false); }
        });
        it.addEventListener('click', function (e) {
          if (it.dataset.sub) { if (openSub && openSub.trigger === it && e.pointerType !== 'mouse') closeSub(true); else { hl(root, it); open(it, e.detail === 0); } return; }
          closeSub(false); say(it.querySelector('span').textContent + ' — done');
        });
      });
      Object.keys(subs).forEach(function (key) {
        var n = subs[key];
        n.addEventListener('pointerenter', function () { clearIntent(); });
        n.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; var it = e.target.closest('.ss-it'); if (it && !it.hasAttribute('data-highlighted')) hl(n, it); });
        n.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hl(n, null, true); });
        n.addEventListener('click', function (e) {
          var it = e.target.closest('.ss-it'); if (!it) return;
          if (SUBS[key].check) { var on = it.getAttribute('aria-checked') !== 'true'; it.setAttribute('aria-checked', on); say((on ? 'Added ' : 'Removed ') + it.dataset.v); return; }
          say(SUBS[key].label + ' ' + it.dataset.v); var tr = openSub.trigger; closeSub(false); hl(root, tr, e.detail !== 0 && e.pointerType === 'mouse');
        });
      });
      /* ---------- keyboard ---------- */
      function nav(menu, e) {
        var L = Array.prototype.slice.call(menu.querySelectorAll('.ss-it')), cur = L.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); hl(menu, L[cur < 0 ? (e.key === 'ArrowDown' ? 0 : L.length - 1) : ctx.clamp(cur + (e.key === 'ArrowDown' ? 1 : -1), 0, L.length - 1)]); return true; }
        if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); hl(menu, L[e.key === 'Home' ? 0 : L.length - 1]); return true; }
        return false;
      }
      root.addEventListener('keydown', function (e) {
        if (nav(root, e)) { closeSub(false); return; }
        var it = document.activeElement.closest && document.activeElement.closest('.ss-it');
        if (!it || !root.contains(it)) return;
        if (it.dataset.sub && (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(it, true); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); it.click(); }
        else if (e.key === 'Escape') { e.preventDefault(); closeSub(false); hl(root, null, true); it.blur(); }
      });
      Object.keys(subs).forEach(function (key) {
        subs[key].addEventListener('keydown', function (e) {
          e.stopPropagation();
          if (nav(subs[key], e)) return;
          if (e.key === 'ArrowLeft' || e.key === 'Escape') { e.preventDefault(); closeSub(true); }
          else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (document.activeElement.closest('.ss-it')) document.activeElement.click(); }
          else if (e.key === 'Tab') { e.preventDefault(); closeSub(true); }
        });
      });
      root.addEventListener('focusin', function (e) { if (e.target === root && root.matches(':focus-visible') && !root.querySelector('[data-highlighted]')) hl(root, rootItems[0]); });
      root.tabIndex = 0;
      tg.addEventListener('click', function () { safe = !safe; tg.setAttribute('aria-pressed', safe ? 'true' : 'false'); clearIntent(); say(safe ? 'Safe triangle on' : 'Safe triangle off: try the diagonal now'); });
      function onOutside(e) { if (!stage.contains(e.target) || (!root.contains(e.target) && !e.target.closest('.ss-sub') && !e.target.closest('.ss-bar'))) { closeSub(false); hl(root, null, true); } }
      var ro = new ResizeObserver(function () { closeSub(false); clearIntent(); });

      return {
        start: function () { document.addEventListener('pointerdown', onOutside, true); ro.observe(stage); },
        stop: function () { document.removeEventListener('pointerdown', onOutside, true); ro.disconnect(); closeSub(false); clearIntent(); clearTimeout(toastT); hl(root, null, true); }
      };
    }
  });
})();
