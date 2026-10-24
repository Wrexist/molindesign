/* site-kickoff — one sentence becomes a brief; every skill needs a job, the budget meter keeps count, nothing builds before Approve */
(function () {
  var ID = 'site-kickoff';
  // [sentence, hard idea, personality, slug, skills with their job here]
  var BRIEFS = [
    ['A bakery in Lysekil wants people to come in before nine.', 'The menu reads like the chalkboard by the till.', 'Calm · editorial', 'lysekil-bakery',
      [['ui-motion-principles', 'rules before any motion'], ['masked-text-reveal', 'headlines rise like chalk lines'], ['sliding-indicator-tabs', 'bread / pastry / coffee'], ['premium-micro-details', 'final pass']]],
    ['Launch a field camera to night photographers.', 'The camera assembles as you scroll.', 'Cinematic · film', 'halden-lf1',
      [['ui-motion-principles', 'rules before any motion'], ['cinematic-loader', 'silhouette fills while assets load'], ['scroll-driven-chapters', 'the assembly story'], ['hotspot-callout-pins', 'name the parts'], ['gpu-tier-adaptive-quality', 'static tier 0'], ['premium-micro-details', 'final pass']]],
    ['A portfolio for a photographer who hates websites.', 'One photograph at a time, full bleed.', 'Precise · instrument', 'portfolio',
      [['ui-motion-principles', 'rules before any motion'], ['shared-element-flip', 'grid → full bleed'], ['device-agnostic-input-actions', 'arrows, swipe, gamepad'], ['premium-micro-details', 'final pass']]]
  ];
  var TEMPT = ['physics-on-flat-art', 'reticle-cursor', 'web-audio-soundscape', 'kinetic-variable-type']; // shiny, but no job in these briefs
  var CAP = 6;

  Lib.register(ID, {
    hint: 'Pick a sentence, then try adding a skill with no job. Approve to scaffold.',
    notes: [
      'Plan before code: the brief is approved before anything past the starter page is built (ECC <code>/plan</code>: wait for confirm)',
      'One hard idea gets the budget; a motion personality (calm, precise, playful, cinematic) sets how much moves',
      'Every skill earns a line saying what it does on this page; can’t say it, don’t use it',
      'Small site 3–6 skills, launch page 6–10; more needs a reason in the brief',
      '<code>tools/new-site.sh &lt;slug&gt; "Name" "sentence"</code> copies <code>templates/site/</code> with BRIEF.md and a per-site CLAUDE.md'
    ],
    simplified: 'The brief here is pre-written for three sentences; the real one is written by Claude from yours and saved as BRIEF.md.',
    css: [
      '.d-site-kickoff .sk { position: absolute; inset: 0; display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); }',
      '.d-site-kickoff .sk-l { padding: 20px; display: flex; flex-direction: column; gap: 10px; border-right: 1px solid rgb(255 255 255 / .1); min-height: 0; }',
      '.d-site-kickoff .sk-l .label { margin: 0; color: rgb(255 255 255 / .45); }',
      '.d-site-kickoff .sk-s { text-align: left; padding: 12px 14px; border: 1px solid rgb(255 255 255 / .15); border-radius: 10px; color: rgb(255 255 255 / .7); font-size: 14px; line-height: 1.35; transition: border-color .2s, color .2s, background-color .2s; }',
      '.d-site-kickoff .sk-s:hover { color: #fff; } .d-site-kickoff .sk-s[aria-pressed="true"] { border-color: #f97316; color: #fff; background: rgb(249 115 22 / .08); }',
      '.d-site-kickoff .sk-tw { margin-top: auto; display: grid; gap: 10px; } .d-site-kickoff .sk-t { display: flex; flex-wrap: wrap; gap: 6px; }',
      '.d-site-kickoff .sk-add { padding: 6px 10px; border-radius: 999px; border: 1px dashed rgb(255 255 255 / .3); color: rgb(255 255 255 / .6); font-size: 12px; }',
      '.d-site-kickoff .sk-add:hover { color: #fff; border-color: #fff; } .d-site-kickoff .sk-add[aria-pressed="true"] { border-style: solid; border-color: #f97316; color: #f97316; }',
      '.d-site-kickoff .sk-r { padding: 20px 22px; display: flex; flex-direction: column; gap: 10px; min-height: 0; overflow: auto; }',
      '.d-site-kickoff .sk-r .label { margin: 0; color: rgb(255 255 255 / .45); }',
      '.d-site-kickoff .sk-idea { margin: 0; font-family: Archivo, sans-serif; font-stretch: 125%; font-size: clamp(18px, 2.3vw, 26px); line-height: 1.05; letter-spacing: -.02em; color: #fff; }',
      '.d-site-kickoff .sk-list { list-style: none; margin: 0; padding: 0; font-size: 13px; }',
      '.d-site-kickoff .sk-list li { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0; border-top: 1px solid rgb(255 255 255 / .08); color: rgb(255 255 255 / .85); opacity: 0; transform: translateY(6px); transition: opacity .4s cubic-bezier(.23,1,.32,1), transform .4s cubic-bezier(.23,1,.32,1); transition-delay: calc(var(--i) * 60ms); }',
      '.d-site-kickoff .sk-list.in li { opacity: 1; transform: none; }',
      '.d-site-kickoff .sk-list li span { color: rgb(255 255 255 / .5); text-align: right; } .d-site-kickoff .sk-list li.bad span { color: #f97316; }',
      '.d-site-kickoff .sk-meter { position: relative; height: 4px; border-radius: 4px; background: rgb(255 255 255 / .12); overflow: hidden; }',
      '.d-site-kickoff .sk-meter i { position: absolute; inset: 0 auto 0 0; width: 0; background: #fff; transition: width .45s cubic-bezier(.23,1,.32,1), background-color .2s; }',
      '.d-site-kickoff .sk-meter.over i { background: #f97316; }',
      '.d-site-kickoff .sk-foot { display: flex; align-items: center; gap: 12px; margin-top: auto; flex-wrap: wrap; }',
      '.d-site-kickoff .sk-go, .d-site-kickoff .sk-go.label { padding: 9px 16px; border-radius: 999px; background: #fff; color: #000; transition: transform .16s cubic-bezier(.23,1,.32,1), background-color .2s, opacity .2s; }',
      '.d-site-kickoff .sk-go:active { transform: scale(.97); } .d-site-kickoff .sk-go:disabled { opacity: .35; cursor: not-allowed; }',
      '.d-site-kickoff .sk-cmd { margin: 0; font: 12px/1.4 ui-monospace, Menlo, monospace; color: #f97316; min-height: 1.4em; }',
      '@container (max-width: 640px) { .d-site-kickoff .sk { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); } .d-site-kickoff .sk-l { border-right: 0; border-bottom: 1px solid rgb(255 255 255 / .1); padding: 14px; } .d-site-kickoff .sk-s:not([aria-pressed="true"]) { display: none; } .d-site-kickoff .sk-r { padding: 14px; } }',
      '@media (prefers-reduced-motion: reduce) { .d-site-kickoff .sk-list li { transform: none; transition: opacity .2s linear; transition-delay: 0s; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      stage.style.containerType = 'inline-size';
      stage.innerHTML = '<div class="sk"><div class="sk-l"><p class="label">1 · One sentence</p></div>' +
        '<div class="sk-r"><p class="label sk-meta"></p><p class="sk-idea"></p><p class="label">Skills, each with a job</p><ul class="sk-list"></ul>' +
        '<div class="sk-meter" role="meter" aria-label="Skills used against the budget" aria-valuemin="0" aria-valuemax="' + CAP + '"><i></i></div>' +
        '<div class="sk-foot"><button type="button" class="sk-go label">Approve plan</button><p class="sk-cmd" aria-live="polite"></p></div></div></div>';
      var L = stage.querySelector('.sk-l'), list = stage.querySelector('.sk-list'), meter = stage.querySelector('.sk-meter'), go = stage.querySelector('.sk-go'), cmd = stage.querySelector('.sk-cmd');
      var cur = 0, extra = {}, typer = 0;
      var sBtns = BRIEFS.map(function (b, i) {
        var x = ctx.el('button', 'sk-s', b[0]); x.type = 'button';
        x.addEventListener('click', function () { cur = i; extra = {}; render(); });
        L.appendChild(x); return x;
      });
      var tWrap = ctx.el('div', 'sk-tw', '<p class="label">2 · Tempted? Add one</p>'), tw = ctx.el('div', 'sk-t');
      tWrap.appendChild(tw); L.appendChild(tWrap);
      var tBtns = TEMPT.map(function (id) {
        var x = ctx.el('button', 'sk-add', '+ ' + id); x.type = 'button';
        x.addEventListener('click', function () { extra[id] = !extra[id]; render(true); });
        tw.appendChild(x); return x;
      });
      go.addEventListener('click', function () {
        clearInterval(typer);
        var s = 'tools/new-site.sh ' + BRIEFS[cur][3] + ' …  ✓ scaffolded';
        if (ctx.reduced) { cmd.textContent = s; return; }
        var n = 0; cmd.textContent = '';
        typer = setInterval(function () { cmd.textContent = s.slice(0, ++n); if (n >= s.length) clearInterval(typer); }, 22);
      });
      function render(keep) {
        var b = BRIEFS[cur];
        sBtns.forEach(function (x, i) { x.setAttribute('aria-pressed', String(i === cur)); });
        tBtns.forEach(function (x, i) { x.setAttribute('aria-pressed', String(!!extra[TEMPT[i]])); });
        stage.querySelector('.sk-meta').textContent = 'Hard idea · ' + b[2];
        stage.querySelector('.sk-idea').textContent = b[1];
        var rows = b[4].map(function (s) { return '<li><b>' + s[0] + '</b><span>' + s[1] + '</span></li>'; });
        var bad = TEMPT.filter(function (id) { return extra[id]; });
        bad.forEach(function (id) { rows.push('<li class="bad"><b>' + id + '</b><span>no job here: cut it</span></li>'); });
        list.classList.remove('in'); list.innerHTML = rows.join('');
        [].forEach.call(list.children, function (li, i) { li.style.setProperty('--i', keep ? 0 : i); });
        requestAnimationFrame(function () { requestAnimationFrame(function () { list.classList.add('in'); }); });
        var n = b[4].length + bad.length;
        meter.querySelector('i').style.width = Math.min(100, n / CAP * 100) + '%';
        meter.classList.toggle('over', !!bad.length || n > CAP);
        meter.setAttribute('aria-valuenow', n);
        go.disabled = !!bad.length;
        go.textContent = bad.length ? 'Cut what has no job' : 'Approve plan';
        clearInterval(typer); cmd.textContent = '';
      }
      render();
      return {
        start: function () {},
        stop: function () { clearInterval(typer); },
        replay: function () { cur = 0; extra = {}; render(); }
      };
    }
  });
})();
