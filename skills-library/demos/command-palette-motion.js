/* command-palette-motion — cmdk-style ⌘K palette inside the stage: command-score ranking, aria-activedescendant selection, animated list height, nested pages */
(function () {
  var ID = 'command-palette-motion', P = '.d-' + ID + ' ';
  function svg(p) { return '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  var IC = {
    search: svg('<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3"/>'), plus: svg('<path d="M8 3.5v9M3.5 8h9"/>'),
    inbox: svg('<path d="M2.5 9.5l1.6-5.2a1 1 0 011-.8h5.8a1 1 0 011 .8l1.6 5.2v3h-11zM2.5 9.5h3l1 1.5h3l1-1.5h3"/>'),
    user: svg('<circle cx="8" cy="5.5" r="2.5"/><path d="M3 13.5c.6-2.6 2.6-4 5-4s4.4 1.4 5 4"/>'),
    folder: svg('<path d="M2.5 4.5a1 1 0 011-1h3l1.5 1.5h4.5a1 1 0 011 1v6a1 1 0 01-1 1h-9a1 1 0 01-1-1z"/>'),
    gear: svg('<circle cx="8" cy="8" r="2"/><path d="M8 2.5v1.6M8 11.9v1.6M2.5 8h1.6M11.9 8h1.6M4.1 4.1l1.1 1.1M10.8 10.8l1.1 1.1M4.1 11.9l1.1-1.1M10.8 5.2l1.1-1.1"/>'),
    theme: svg('<circle cx="8" cy="8" r="5.5"/><path d="M8 2.5a5.5 5.5 0 000 11z" fill="currentColor" stroke="none"/>'),
    side: svg('<rect x="2.5" y="3" width="11" height="10" rx="1.5"/><path d="M6.5 3v10"/>'),
    link: svg('<path d="M6.6 9.4l2.8-2.8M7.2 4.6l1-1a2.6 2.6 0 013.7 3.7l-1 1M8.8 11.4l-1 1a2.6 2.6 0 01-3.7-3.7l1-1"/>'),
    keys: svg('<rect x="2" y="4" width="12" height="8" rx="1.5"/><path d="M4.5 6.5h1M7.5 6.5h1M10.5 6.5h1M5 9.5h6"/>'),
    chat: svg('<path d="M3 4a1 1 0 011-1h8a1 1 0 011 1v6a1 1 0 01-1 1H7l-3 2.5V11H4a1 1 0 01-1-1z"/>'),
    dot: svg('<circle cx="8" cy="8" r="2.5" fill="currentColor" stroke="none"/>'), arrow: svg('<path d="M6 4l4 4-4 4"/>')
  };
  /* --- command-score, reimplemented from cmdk's constants (see SKILL.md) --- */
  var GAP = /[\\\/_+.#"@\[\(\{&]/, GAPS = /[\\\/_+.#"@\[\(\{&]/g, SP = /[\s-]/, SPS = /[\s-]/g;
  function inner(s, a, ls, la, si, ai, memo) {
    if (ai === a.length) return si === s.length ? 1 : 0.99;
    var key = si + ',' + ai; if (memo[key] !== undefined) return memo[key];
    var ch = la.charAt(ai), idx = ls.indexOf(ch, si), high = 0, sc, tr, br;
    while (idx >= 0) {
      sc = inner(s, a, ls, la, idx + 1, ai + 1, memo);
      if (sc > high) {
        if (idx === si) sc *= 1;
        else if (GAP.test(s.charAt(idx - 1))) { sc *= 0.8; br = s.slice(si, idx - 1).match(GAPS); if (br && si > 0) sc *= Math.pow(0.999, br.length); }
        else if (SP.test(s.charAt(idx - 1))) { sc *= 0.9; br = s.slice(si, idx - 1).match(SPS); if (br && si > 0) sc *= Math.pow(0.999, br.length); }
        else { sc *= 0.17; if (si > 0) sc *= Math.pow(0.999, idx - si); }
        if (s.charAt(idx) !== a.charAt(ai)) sc *= 0.9999;
      }
      if ((sc < 0.1 && ls.charAt(idx - 1) === la.charAt(ai + 1)) || (la.charAt(ai + 1) === la.charAt(ai) && ls.charAt(idx - 1) !== la.charAt(ai))) {
        tr = inner(s, a, ls, la, idx + 1, ai + 2, memo);
        if (tr * 0.1 > sc) sc = tr * 0.1;
      }
      if (sc > high) high = sc;
      idx = ls.indexOf(ch, idx + 1);
    }
    memo[key] = high; return high;
  }
  function score(value, q, kw) {
    var s = kw && kw.length ? value + ' ' + kw.join(' ') : value, f = function (x) { return x.toLowerCase().replace(SPS, ' '); };
    return inner(s, q, f(s), f(q), 0, 0, {});
  }

  var css = [
    '& { container-type: inline-size; font-size: 13px; color: rgb(255 255 255 / .9); }',
    '.cp-app { position: absolute; inset: 0; display: flex; background: var(--bg, #070707); transition: background .4s; outline: none; }',
    '.cp-app:focus-visible { box-shadow: inset 0 0 0 1px #f97316; }',
    '.cp-side { width: 190px; flex: none; padding: 16px 10px; border-right: 1px solid rgb(255 255 255 / .07); overflow: hidden; transition: width .35s cubic-bezier(.23,1,.32,1), padding .35s cubic-bezier(.23,1,.32,1), opacity .25s; white-space: nowrap; }',
    '.cp-app.collapsed .cp-side { width: 0; padding-left: 0; padding-right: 0; opacity: 0; }',
    '.cp-ws { display: flex; align-items: center; gap: 8px; padding: 6px 8px 14px; color: #fff; font-weight: 500; }',
    '.cp-ws i { width: 18px; height: 18px; border-radius: 5px; background: linear-gradient(135deg, #f97316, #7c2d12); }',
    '.cp-nav { display: flex; align-items: center; gap: 9px; height: 30px; padding: 0 8px; border-radius: 6px; color: rgb(255 255 255 / .55); }',
    '.cp-nav.on { background: rgb(255 255 255 / .07); color: #fff; }',
    '.cp-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }',
    '.cp-head { display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 20px; border-bottom: 1px solid rgb(255 255 255 / .07); }',
    '.cp-title { font-weight: 500; color: #fff; }',
    '.cp-hero { flex: 1; display: grid; place-content: center; justify-items: center; gap: 16px; padding: 24px; text-align: center; }',
    '.cp-big { margin: 0; font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; letter-spacing: -.02em; font-size: clamp(22px, 4.2cqw, 38px); line-height: 1.05; color: #fff; }',
    '.cp-sub { margin: 0; color: rgb(255 255 255 / .5); max-width: 40ch; line-height: 1.5; }',
    '.cp-open { display: inline-flex; align-items: center; gap: 10px; height: 40px; padding: 0 8px 0 14px; min-width: min(320px, 100%); border-radius: 10px; border: 1px solid rgb(255 255 255 / .14); background: rgb(255 255 255 / .04); color: rgb(255 255 255 / .55); transition: border-color .2s, background .2s; }',
    '.cp-open:hover { border-color: rgb(255 255 255 / .3); background: rgb(255 255 255 / .07); } .cp-open span { margin-right: auto; }',
    'kbd { display: inline-grid; place-items: center; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 5px; background: rgb(255 255 255 / .08); color: rgb(255 255 255 / .6); font: 500 11px/1 Archivo, sans-serif; }',
    '.cp-back { position: absolute; inset: 0; z-index: 5; background: rgb(0 0 0 / .5); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); animation: dcp-fade 140ms ease both; }',
    '.cp-back[data-state=closed] { animation: dcp-fade-out 120ms ease both; }',
    '.cp-back[hidden] { display: none; }',
    '.cp-dlg { position: absolute; left: 0; right: 0; margin: 0 auto; top: clamp(12px, 9%, 64px); width: min(560px, calc(100% - 24px)); display: flex; flex-direction: column; border-radius: 14px; background: rgb(22 22 22 / .92); -webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px); border: 1px solid rgb(255 255 255 / .1); box-shadow: 0 30px 80px -10px rgb(0 0 0 / .8), 0 0 0 .5px rgb(0 0 0 / .8); transform-origin: 50% 0; animation: dcp-in 160ms cubic-bezier(.23,1,.32,1) both; transition: transform 100ms ease; overflow: hidden; }',
    '.cp-back[data-state=closed] .cp-dlg { animation: dcp-out 120ms ease both; }',
    '.cp-dlg.bounce { transform: scale(.96); }',
    '.cp-crumbs { display: flex; gap: 6px; padding: 12px 14px 0; } .cp-crumbs[hidden] { display: none; }',
    '.cp-crumb { height: 22px; padding: 0 8px; border-radius: 5px; background: rgb(255 255 255 / .08); color: rgb(255 255 255 / .7); display: inline-flex; align-items: center; font-size: 12px; }',
    '.cp-inrow { display: flex; align-items: center; gap: 10px; padding: 0 14px; height: 54px; border-bottom: 1px solid rgb(255 255 255 / .08); color: rgb(255 255 255 / .45); }',
    '.cp-in { flex: 1; min-width: 0; height: 100%; background: none; border: 0; outline: none; color: #fff; font: inherit; font-size: 16px; caret-color: #f97316; }',
    '.cp-in::placeholder { color: rgb(255 255 255 / .35); }',
    '.cp-list { height: var(--list-h, auto); max-height: var(--list-max, 320px); overflow: auto; overscroll-behavior: contain; transition: height 140ms cubic-bezier(.23,1,.32,1); scroll-padding-block: 8px; outline: none; }',
    '.cp-sizer { padding: 6px; }',
    '.cp-gh { padding: 10px 10px 6px; color: rgb(255 255 255 / .4); }',
    '.cp-it { position: relative; display: flex; align-items: center; gap: 11px; height: 40px; padding: 0 10px; border-radius: 8px; color: rgb(255 255 255 / .75); cursor: default; user-select: none; }',
    '.cp-it svg { color: rgb(255 255 255 / .45); flex: none; }',
    '.cp-it[aria-selected=true] { background: rgb(255 255 255 / .07); color: #fff; box-shadow: inset 2px 0 0 #f97316; } .cp-it[aria-selected=true] svg { color: #fff; }',
    '.cp-it .cp-k { margin-left: auto; display: flex; gap: 4px; }',
    '.cp-it .cp-go { margin-left: auto; color: rgb(255 255 255 / .35); } .cp-it .cp-k + .cp-go { margin-left: 0; }',
    '.cp-it.cur::after { content: "Current"; margin-left: auto; color: rgb(255 255 255 / .35); font-size: 12px; }',
    '.cp-empty { height: 64px; display: grid; place-items: center; color: rgb(255 255 255 / .45); }',
    '.cp-foot { display: flex; align-items: center; gap: 14px; height: 38px; padding: 0 14px; border-top: 1px solid rgb(255 255 255 / .08); color: rgb(255 255 255 / .4); white-space: nowrap; overflow: hidden; }',
    '.cp-foot span { display: inline-flex; align-items: center; gap: 6px; } .cp-foot .cp-n { margin-left: auto; }',
    '.cp-toast { position: absolute; left: 50%; bottom: 18px; z-index: 4; transform: translate(-50%, 6px); padding: 8px 14px; border-radius: 999px; background: rgb(255 255 255 / .1); border: 1px solid rgb(255 255 255 / .12); color: #fff; white-space: nowrap; opacity: 0; transition: opacity .2s, transform .3s cubic-bezier(.23,1,.32,1); pointer-events: none; }',
    '.cp-toast.on { opacity: 1; transform: translate(-50%, 0); }'
  ].join('\n').replace(/([^{}]+)\{([^{}]*)\}/g, function (m, sel, body) {
    return sel.split(',').map(function (x) { x = x.trim(); return x === '&' ? '.d-' + ID : P + x; }).join(', ') + ' {' + body + '}';
  }) +
    '\n@container (max-width: 600px) { ' + P + '.cp-side { display: none; } ' + P + '.cp-foot .cp-hb { display: none; } }' +
    '\n@media (prefers-reduced-motion: reduce) { ' + P + '.cp-dlg { animation-name: dcp-fade; transition: none; } ' + P + '.cp-back[data-state=closed] .cp-dlg { animation-name: dcp-fade-out; } ' + P + '.cp-dlg.bounce { transform: none; } ' + P + '.cp-list { transition: none; } }' +
    '\n@keyframes dcp-in { from { opacity: 0; transform: scale(.96); } } @keyframes dcp-out { to { opacity: 0; transform: scale(.98); } }' +
    '\n@keyframes dcp-fade { from { opacity: 0; } } @keyframes dcp-fade-out { to { opacity: 0; } }';

  var PEOPLE = ['Isac (you)', 'Mira Lind', 'Jonas Ek', 'Sana Berg', 'Theo Falk', 'Alva Nord', 'Omar Sund'];
  var THEMES = [['Dark', '#070707'], ['Dim', '#15161a'], ['Ember', '#140b06']];

  Lib.register(ID, {
    hint: 'Click the demo (or Tab into it) and press ⌘K / Ctrl K, or use the button. Type “gs”, “thm”, “asgn”; ↑↓ Home End, ↵, ⌫ to go back, Esc.',
    notes: [
      'cmdk <code>commandScore</code>: continue 1, word jump .9, gap jump .8, mid-word .17, transposition .1; groups sorted by their best item',
      'Selection is a value: input keeps focus and points at it with <code>aria-activedescendant</code>; first result auto-selected after every keystroke',
      'List height = sizer height via <code>ResizeObserver</code> → <code>--list-h</code>, <code>transition: height</code> (cmdk README 100 ms ease; here 140 ms ease-out)',
      'Dialog scales in from <code>.96</code> with origin at the top so the input never moves; Enter and page-back “bounce” to <code>scale(.96)</code> for 100 ms',
      'Items select on <code>pointermove</code>, not hover-enter, so a resting mouse never fights the arrow keys'
    ],
    simplified: 'No Radix Dialog: focus is trapped in the input by hand. No vim keys or ⌥ group-jump. ⌘/Ctrl+K works only while focus is inside the demo, so it never takes over the page.',
    css: css,
    mount: function (stage, ctx) {
      stage.innerHTML = '<div class="cp-app" tabindex="0" aria-label="Demo app. Press Control K or Command K for the command menu">' +
        '<aside class="cp-side"><div class="cp-ws"><i aria-hidden="true"></i>Molin</div>' +
        '<div class="cp-nav on" data-nav="inbox">' + IC.inbox + 'Inbox</div><div class="cp-nav" data-nav="mine">' + IC.user + 'My issues</div>' +
        '<div class="cp-nav" data-nav="projects">' + IC.folder + 'Projects</div><div class="cp-nav" data-nav="settings">' + IC.gear + 'Settings</div></aside>' +
        '<div class="cp-main"><div class="cp-head"><span class="cp-title">Inbox</span></div>' +
        '<div class="cp-hero"><p class="label" style="color:#f97316;margin:0">Command menu</p><h4 class="cp-big">Everything is one keystroke away</h4>' +
        '<p class="cp-sub">Fuzzy ranking, arrow-key selection and a list that glides to fit its results.</p>' +
        '<button type="button" class="cp-open" aria-haspopup="dialog">' + IC.search + '<span>Search or run a command…</span><kbd class="cp-mod">⌘</kbd><kbd>K</kbd></button></div></div>' +
        '<div class="cp-toast" role="status" aria-live="polite"></div></div>' +
        '<div class="cp-back" hidden><div class="cp-dlg" role="dialog" aria-modal="true" aria-label="Command menu">' +
        '<div class="cp-crumbs" hidden></div>' +
        '<div class="cp-inrow">' + IC.search + '<input class="cp-in" type="text" role="combobox" aria-expanded="true" aria-controls="cp-list" aria-autocomplete="list" aria-label="Command" autocomplete="off" spellcheck="false" placeholder="Type a command or search…"><kbd>esc</kbd></div>' +
        '<div class="cp-list" id="cp-list" role="listbox" aria-label="Suggestions" tabindex="-1"><div class="cp-sizer"></div></div>' +
        '<div class="cp-foot label"><span><kbd>↑</kbd><kbd>↓</kbd>navigate</span><span><kbd>↵</kbd>run</span><span class="cp-hb"><kbd>⌫</kbd>back</span><span class="cp-n"></span></div>' +
        '</div></div>';
      var $ = function (s) { return stage.querySelector(s); };
      var app = $('.cp-app'), back = $('.cp-back'), dlg = $('.cp-dlg'), input = $('.cp-in'), list = $('.cp-list'), sizer = $('.cp-sizer');
      var crumbs = $('.cp-crumbs'), countEl = $('.cp-n'), toast = $('.cp-toast'), openBtn = $('.cp-open');
      if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) $('.cp-mod').textContent = 'Ctrl';
      var isOpen = false, pages = [], current = null, lastFocus = null, theme = 0, nav = 'inbox', toastT = 0, bounceT = 0, raf = 0, uid = 0, assignee = 0;

      function say(t) { toast.textContent = t; toast.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('on'); }, 1800); }
      function go(n, label) { nav = n; stage.querySelectorAll('.cp-nav').forEach(function (x) { x.classList.toggle('on', x.dataset.nav === n); }); $('.cp-title').textContent = label; }
      function kb() { return Array.prototype.map.call(arguments, function (k) { return '<kbd>' + k + '</kbd>'; }).join(''); }
      var PAGES = {
        root: [
          { g: 'Suggestions', l: 'Create new issue', i: IC.plus, k: kb('C'), kw: ['new', 'add'], run: function () { say('Created MOL-143'); } },
          { g: 'Suggestions', l: 'Assign to…', i: IC.user, k: kb('A'), kw: ['owner', 'person'], page: 'assign' },
          { g: 'Suggestions', l: 'Copy issue URL', i: IC.link, k: kb('⌘', '⇧', 'C'), run: function () { say('Copied molin.app/issue/MOL-142'); } },
          { g: 'Navigation', l: 'Go to Inbox', i: IC.inbox, k: kb('G', 'I'), run: function () { go('inbox', 'Inbox'); } },
          { g: 'Navigation', l: 'Go to My issues', i: IC.user, k: kb('G', 'M'), run: function () { go('mine', 'My issues'); } },
          { g: 'Navigation', l: 'Go to Projects', i: IC.folder, k: kb('G', 'P'), run: function () { go('projects', 'Projects'); } },
          { g: 'Navigation', l: 'Go to Settings', i: IC.gear, k: kb('G', 'S'), kw: ['preferences'], run: function () { go('settings', 'Settings'); } },
          { g: 'Preferences', l: 'Change theme…', i: IC.theme, kw: ['appearance', 'dark'], page: 'theme' },
          { g: 'Preferences', l: 'Toggle sidebar', i: IC.side, k: kb('⌘', '\\'), run: function () { app.classList.toggle('collapsed'); say(app.classList.contains('collapsed') ? 'Sidebar hidden' : 'Sidebar shown'); } },
          { g: 'Help', l: 'Keyboard shortcuts', i: IC.keys, k: kb('?'), run: function () { say('↑↓ move · ↵ run · ⌫ back · esc close'); } },
          { g: 'Help', l: 'Contact support', i: IC.chat, kw: ['help', 'feedback'], run: function () { say('Support chat opened'); } }
        ],
        theme: THEMES.map(function (t, i) { return { g: 'Theme', l: t[0], i: IC.dot, cur: function () { return theme === i; }, run: function () { theme = i; app.style.setProperty('--bg', t[1]); say('Theme → ' + t[0]); } }; }),
        assign: PEOPLE.map(function (p, i) { return { g: 'People', l: p, i: IC.user, cur: function () { return assignee === i; }, run: function () { assignee = i; say('Assigned to ' + p.replace(' (you)', '')); } }; })
      };
      var TITLES = { theme: 'Theme', assign: 'Assign to' };
      var items = [];   // rendered items for the current page: {d, el, s}

      function build() {
        var page = pages[pages.length - 1] || 'root';
        crumbs.hidden = !pages.length;
        crumbs.innerHTML = pages.length ? '<span class="cp-crumb">Home</span>' + pages.map(function (p) { return '<span class="cp-crumb">' + TITLES[p] + '</span>'; }).join('') : '';
        input.placeholder = pages.length ? TITLES[page] + '…' : 'Type a command or search…';
        items = PAGES[page].map(function (d) {
          var el = ctx.el('div', 'cp-it' + (d.cur && d.cur() ? ' cur' : ''));
          el.id = 'cp-o-' + (++uid); el.setAttribute('role', 'option'); el.setAttribute('aria-selected', 'false');
          el.innerHTML = d.i + '<span>' + d.l + '</span>' + (d.k ? '<span class="cp-k" aria-hidden="true">' + d.k + '</span>' : '') + (d.page ? '<span class="cp-go">' + IC.arrow + '</span>' : '');
          return { d: d, el: el, s: 1 };
        });
        render();
        if (isOpen) fitMax();
      }
      function render() {
        var q = input.value.trim(), groups = {}, order = [];
        items.forEach(function (it) { it.s = q ? score(it.d.l, q, it.d.kw) : 1; });
        var shown = items.filter(function (it) { return it.s > 0; });
        if (q) shown.sort(function (a, b) { return b.s - a.s; });
        shown.forEach(function (it) { if (!groups[it.d.g]) { groups[it.d.g] = []; order.push(it.d.g); } groups[it.d.g].push(it); });
        var frag = document.createDocumentFragment();
        order.forEach(function (g, gi) {
          var head = ctx.el('div', 'cp-gh label', g); head.id = 'cp-g-' + (++uid); head.setAttribute('aria-hidden', 'true');
          var box = ctx.el('div'); box.setAttribute('role', 'group'); box.setAttribute('aria-labelledby', head.id);
          groups[g].forEach(function (it) { box.appendChild(it.el); });
          frag.appendChild(head); frag.appendChild(box);
        });
        if (!shown.length) frag.appendChild(ctx.el('div', 'cp-empty', 'No results for “' + q.replace(/[<&]/g, '') + '”'));
        sizer.replaceChildren(frag);
        countEl.textContent = shown.length + (shown.length === 1 ? ' result' : ' results');
        select(shown[0] || null);
        list.scrollTop = 0;
      }
      function visible() { return items.filter(function (it) { return it.el.isConnected; }).sort(function (a, b) { return a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1; }); }
      function select(it, noScroll) {
        if (current) current.el.setAttribute('aria-selected', 'false');
        current = it;
        if (!it) { input.removeAttribute('aria-activedescendant'); return; }
        it.el.setAttribute('aria-selected', 'true'); input.setAttribute('aria-activedescendant', it.el.id);
        if (noScroll) return;
        var box = it.el.parentNode, first = box.firstChild === it.el, top = (first ? box.previousSibling : it.el).offsetTop - 6, bot = it.el.offsetTop + it.el.offsetHeight + 6;
        if (top < list.scrollTop) list.scrollTop = top; else if (bot > list.scrollTop + list.clientHeight) list.scrollTop = bot - list.clientHeight;
      }
      function bounce() { if (ctx.reduced) return; dlg.classList.add('bounce'); clearTimeout(bounceT); bounceT = setTimeout(function () { dlg.classList.remove('bounce'); }, 100); }
      function swap() { if (!ctx.reduced) sizer.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'cubic-bezier(.23,1,.32,1)' }); }
      function run(it) {
        if (!it) return;
        if (it.d.page) { bounce(); pages.push(it.d.page); input.value = ''; build(); swap(); return; }
        close(true); it.d.run();
      }
      function popPage() { bounce(); pages.pop(); input.value = ''; build(); swap(); }

      // list height: ResizeObserver on the sizer → --list-h (cmdk pattern)
      var ro = new ResizeObserver(function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { list.style.setProperty('--list-h', sizer.offsetHeight.toFixed(1) + 'px'); }); });
      function fitMax() { var h = stage.clientHeight - dlg.offsetTop - (dlg.offsetHeight - list.offsetHeight) - 16; list.style.setProperty('--list-max', Math.max(120, Math.min(320, h)) + 'px'); }

      function open() {
        if (isOpen) return;
        isOpen = true; lastFocus = document.activeElement;
        pages = []; input.value = ''; back.hidden = false; back.dataset.state = 'open';
        app.inert = true; build();
        list.style.setProperty('--list-h', sizer.offsetHeight.toFixed(1) + 'px');
        ro.observe(sizer);
        input.focus({ preventScroll: true });
      }
      function close(restore) {
        if (!isOpen) return;
        isOpen = false; ro.disconnect(); app.inert = false;
        back.dataset.state = 'closed';
        var done = function (e) { if (e && e.target !== back) return; back.removeEventListener('animationend', done); clearTimeout(back._t); if (back.dataset.state === 'closed') back.hidden = true; };
        if (getComputedStyle(back).animationName === 'none') done(); else { back.addEventListener('animationend', done); back._t = setTimeout(done, 300); }
        if (restore) (lastFocus && stage.contains(lastFocus) ? lastFocus : app).focus({ preventScroll: true });
      }

      input.addEventListener('input', render);
      input.addEventListener('keydown', function (e) {
        if (e.isComposing || e.keyCode === 229) return;
        var vis = visible(), i = vis.indexOf(current);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          var down = e.key === 'ArrowDown';
          select(e.metaKey ? vis[down ? vis.length - 1 : 0] : vis[ctx.clamp(i + (down ? 1 : -1), 0, vis.length - 1)] || null);
        } else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); select(vis[e.key === 'Home' ? 0 : vis.length - 1] || null); }
        else if (e.key === 'Enter') { e.preventDefault(); if (current) { bounce(); run(current); } }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (pages.length) popPage(); else close(true); }
        else if (e.key === 'Backspace' && !input.value && pages.length) { e.preventDefault(); popPage(); }
        else if (e.key === 'Tab') e.preventDefault();
      });
      list.addEventListener('pointermove', function (e) {
        var el = e.target.closest('.cp-it'); if (!el || (current && current.el === el)) return;
        for (var j = 0; j < items.length; j++) if (items[j].el === el) { select(items[j], true); break; }
      });
      list.addEventListener('click', function (e) { var el = e.target.closest('.cp-it'); if (!el) return; for (var j = 0; j < items.length; j++) if (items[j].el === el) { select(items[j], true); run(items[j]); } input.focus({ preventScroll: true }); });
      list.addEventListener('mousedown', function (e) { e.preventDefault(); });   // keep focus in the input
      back.addEventListener('pointerdown', function (e) { if (e.target === back) close(true); });
      openBtn.addEventListener('click', open);
      app.addEventListener('pointerdown', function (e) { if (!e.target.closest('button')) app.focus({ preventScroll: true }); });
      stage.addEventListener('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (isOpen) close(true); else open(); }
      });
      var sro = new ResizeObserver(function () { if (isOpen) fitMax(); });

      return {
        start: function () { sro.observe(stage); },
        stop: function () { sro.disconnect(); close(false); clearTimeout(toastT); clearTimeout(bounceT); cancelAnimationFrame(raf); clearTimeout(back._t); back.hidden = true; dlg.classList.remove('bounce'); }
      };
    }
  });
})();
