/* site-verification-loop — plant a bug, run the check, read the table; the loop rail shows where you are */
(function () {
  var ID = 'site-verification-loop';
  var STEPS = ['plan', 'test', 'build', 'review', 'verify', 'remember', 'improve'];
  // bugs the viewer can plant: [label, rows they turn into FAIL/WARN]
  var BUGS = {
    path: ['a /img/hero.jpg path', [['FAIL', 'Paths', 'index.html:41 root-absolute /img/hero.jpg (404 under /molindesign/)'], ['FAIL', 'desktop', '1 local request failed: 404 /img/hero.jpg']]],
    reveal: ['reveal never fires', [['FAIL', 'reduced', '3 text blocks still invisible after scrolling to them: p.rise']]],
    wide: ['marquee 428 px wide', [['FAIL', 'phone', 'page scrolls sideways by 38px; widest: div.marquee → 428px']]],
    tap: ['14 px close button', [['WARN', 'phone', '1 tap target under 24px: button.x 14×14 (aim for 44px)']]]
  };
  var CLEAN = [['PASS', 'Paths', 'every local URL is relative'], ['PASS', 'Motion', 'animates; prefers-reduced-motion handled'], ['PASS', 'desktop', 'loads, scrolls end to end, no errors'], ['PASS', 'phone', 'no sideways scroll'], ['PASS', 'reduced', 'every reveal visible'], ['INFO', 'Meta', 'robots: noindex, nofollow']];

  Lib.register(ID, {
    hint: 'Plant a bug or two, then Run check. Fix them and run again.',
    notes: [
      'Served under <code>/molindesign/</code> like GitHub Pages, so a path starting with <code>/</code> 404s in the check exactly as it would live',
      'Three runs: desktop 1440×900, phone 390×844 touch, desktop with reduced motion; each waits for the loader, scrolls end to end, then audits',
      'FAIL: JS errors, local 404s, sideways scroll, reveals still hidden under reduced motion, missing lang/viewport/title, secrets. WARN: names, tap targets, og:image',
      'Then a reviewer agent that never saw the code being written, with a pre-report gate: exact line, concrete failure, context read, defensible severity',
      'Paste the final table in the PR; lessons that generalise go back into the skill they belong to'
    ],
    simplified: 'The table is scripted from the real tool’s output format; run <code>node tools/check-site.mjs &lt;site&gt;</code> for the real thing.',
    css: [
      '.d-site-verification-loop .sv { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 14px; padding: 18px 20px; }',
      '.d-site-verification-loop .sv-rail { display: flex; gap: 4px; }',
      '.d-site-verification-loop .sv-rail span { flex: 1; padding: 7px 0 0; border-top: 2px solid rgb(255 255 255 / .15); color: rgb(255 255 255 / .4); transition: border-color .3s, color .3s; }',
      '.d-site-verification-loop .sv-rail span.on { border-color: #f97316; color: #fff; } .d-site-verification-loop .sv-rail span.done { border-color: rgb(255 255 255 / .6); color: rgb(255 255 255 / .7); }',
      '.d-site-verification-loop .sv-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }',
      '.d-site-verification-loop .sv-row > .label { margin: 0 6px 0 0; color: rgb(255 255 255 / .45); }',
      '.d-site-verification-loop .sv-bug { padding: 6px 10px; border-radius: 999px; border: 1px dashed rgb(255 255 255 / .3); color: rgb(255 255 255 / .65); font: 12px ui-monospace, Menlo, monospace; transition: border-color .2s, color .2s; }',
      '.d-site-verification-loop .sv-bug:hover { color: #fff; } .d-site-verification-loop .sv-bug[aria-pressed="true"] { border-style: solid; border-color: #f97316; color: #f97316; }',
      '.d-site-verification-loop .sv-run, .d-site-verification-loop .sv-run.label { margin-left: auto; padding: 8px 16px; border-radius: 999px; background: #fff; color: #000; transition: transform .16s cubic-bezier(.23,1,.32,1); }',
      '.d-site-verification-loop .sv-run:active { transform: scale(.97); } .d-site-verification-loop .sv-run:disabled { opacity: .4; }',
      '.d-site-verification-loop .sv-term { flex: 1; min-height: 0; overflow: auto; margin: 0; padding: 14px 16px; border-radius: 10px; background: rgb(255 255 255 / .04); border: 1px solid rgb(255 255 255 / .1); font: 12px/1.65 ui-monospace, Menlo, monospace; color: rgb(255 255 255 / .75); white-space: pre-wrap; }',
      '.d-site-verification-loop .sv-term b { font-weight: 600; } .d-site-verification-loop .st-FAIL { color: #f97316; } .d-site-verification-loop .st-WARN { color: #fde68a; } .d-site-verification-loop .st-PASS { color: rgb(255 255 255 / .9); } .d-site-verification-loop .st-INFO { color: rgb(255 255 255 / .4); }',
      '.d-site-verification-loop .sv-term .ln { display: block; animation: sv-in .35s cubic-bezier(.23,1,.32,1) both; }',
      '@keyframes sv-in { from { opacity: 0; transform: translateY(4px); } }',
      '.d-site-verification-loop .sv-verdict { display: block; margin-top: 8px; color: #fff; }',
      '@media (prefers-reduced-motion: reduce) { .d-site-verification-loop .sv-term .ln { animation: none; } }',
      '@container (max-width: 560px) { .d-site-verification-loop .sv { padding: 12px; gap: 10px; } .d-site-verification-loop .sv-rail span { font-size: 8px; letter-spacing: .1em; } .d-site-verification-loop .sv-run { margin-left: 0; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      stage.style.containerType = 'inline-size';
      var el = ctx.el, root = el('div', 'sv');
      var rail = el('div', 'sv-rail', STEPS.map(function (s) { return '<span class="label">' + s + '</span>'; }).join(''));
      rail.setAttribute('aria-hidden', 'true');
      var row = el('div', 'sv-row', '<p class="label">Plant a bug</p>');
      var on = {}, timers = [];
      var bugBtns = Object.keys(BUGS).map(function (k) {
        var b = el('button', 'sv-bug', BUGS[k][0]); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () { on[k] = !on[k]; b.setAttribute('aria-pressed', String(!!on[k])); setStep(2); });
        row.appendChild(b); return b;
      });
      var run = el('button', 'sv-run label', 'Run check'); run.type = 'button'; row.appendChild(run);
      var term = el('pre', 'sv-term'); term.setAttribute('aria-live', 'polite');
      term.textContent = '$ node tools/check-site.mjs bakery';
      root.append(rail, row, term); stage.appendChild(root);
      var spans = rail.children;
      function setStep(i) { [].forEach.call(spans, function (s, j) { s.className = 'label' + (j === i ? ' on' : j < i ? ' done' : ''); }); }
      function clear() { timers.forEach(clearTimeout); timers = []; }
      function rows() {
        var out = [], hit = {};
        Object.keys(BUGS).forEach(function (k) { if (on[k]) BUGS[k][1].forEach(function (r) { out.push(r); hit[r[1]] = 1; }); });
        CLEAN.forEach(function (r) { if (!hit[r[1]] || r[0] === 'INFO') out.push(r); });
        var order = { FAIL: 0, WARN: 1, PASS: 2, INFO: 3 };
        return out.sort(function (a, b) { return order[a[0]] - order[b[0]]; });
      }
      run.addEventListener('click', function () {
        clear(); run.disabled = true; setStep(4);
        var rs = rows(), gap = ctx.reduced ? 0 : 110;
        term.innerHTML = '$ node tools/check-site.mjs bakery\n\nSITE CHECK  bakery/index.html   (served at /molindesign/bakery/)\n\n';
        rs.forEach(function (r, i) {
          timers.push(setTimeout(function () {
            term.insertAdjacentHTML('beforeend', '<span class="ln"><b class="st-' + r[0] + '">' + (r[0] + '  ').slice(0, 4) + '</b>  ' + (r[1] + '        ').slice(0, 8) + ' ' + r[2] + '</span>');
          }, 300 + i * gap));
        });
        timers.push(setTimeout(function () {
          var f = rs.filter(function (r) { return r[0] === 'FAIL'; }).length, w = rs.filter(function (r) { return r[0] === 'WARN'; }).length;
          term.insertAdjacentHTML('beforeend', '<span class="ln sv-verdict">Overall: ' + (f ? 'NOT READY' : 'READY') + '  (' + f + ' fail, ' + w + ' warn)' + (f ? '' : '\n→ site-reviewer agent, then remember what generalises') + '</span>');
          setStep(f ? 2 : 6); run.disabled = false;
        }, 300 + rs.length * gap + 200));
      });
      setStep(2);
      return {
        start: function () {},
        stop: function () { clear(); run.disabled = false; },
        replay: function () { clear(); on = {}; bugBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); term.textContent = '$ node tools/check-site.mjs bakery'; run.disabled = false; setStep(2); }
      };
    }
  });
})();
