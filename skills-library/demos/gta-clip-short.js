/* gta-clip-short — the clip budget a Delta Short must pass (clipkit.py lint), as a live timeline.
   Add trailer clips to a 28 s Short, stretch them, change the source; the lint answers as you go. */
Lib.register('gta-clip-short', {
  hint: 'Add or stretch trailer clips, switch the source, and watch the lint',
  notes: [
    'Source judged by account id, never display name: a fan account can be called “GTA 6”',
    'Each excerpt under 5 s, muted, with a note (freeze, circle, label, quote)',
    'Footage at most 50 % of the runtime; no 5 s stretch without own graphics between clips',
    'The same source range never in two films (a <code>-rN</code> filler remix may reuse its own)',
    'Frames are cut outside git and rebuilt with <code>clipkit.py restore</code>'
  ],
  simplified: 'Lint rules only. The real kit downloads with yt-dlp, crops letterboxing, and draws the frames in a code-rendered film (film/gta-leaks/).',
  css: [
    '.d-gta-clip-short { color: #fbf0ea; font: 500 12px/1.4 "Geist Mono", ui-monospace, monospace; }',
    '.d-gta-clip-short .d-gcs-wrap { position: absolute; inset: 0; padding: 22px; display: flex; flex-direction: column; gap: 16px; justify-content: center; background: #0b0820; }',
    '.d-gta-clip-short .d-gcs-track { position: relative; height: 64px; border-radius: 12px; background: #19d3c5; overflow: hidden; }',
    '.d-gta-clip-short .d-gcs-own { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #0b0820; font-weight: 700; letter-spacing: .12em; }',
    '.d-gta-clip-short .d-gcs-clip { position: absolute; top: 0; bottom: 0; background: #ff4fa3; border-left: 2px solid #0b0820; border-right: 2px solid #0b0820; transition: left .25s cubic-bezier(.23,1,.32,1), width .25s cubic-bezier(.23,1,.32,1), background-color .2s ease; }',
    '.d-gta-clip-short .d-gcs-clip.bad { background: #ff8a3d; }',
    '.d-gta-clip-short .d-gcs-bar { display: flex; gap: 8px; flex-wrap: wrap; }',
    '.d-gta-clip-short button { appearance: none; min-height: 44px; border: 1px solid rgb(255 255 255 / .3); background: rgb(0 0 0 / .4); color: #fff; font: inherit; letter-spacing: .1em; text-transform: uppercase; padding: 0 14px; border-radius: 999px; cursor: pointer; transition: transform .16s cubic-bezier(.23,1,.32,1), border-color .2s ease; }',
    '.d-gta-clip-short button:active { transform: scale(.97); }',
    '.d-gta-clip-short button:focus-visible { outline: 2px solid #ffd23f; outline-offset: 2px; }',
    '.d-gta-clip-short button[aria-pressed="true"] { background: #fbf0ea; color: #0b0820; }',
    '.d-gta-clip-short .d-gcs-out { min-height: 6.6em; }',
    '.d-gta-clip-short .d-gcs-ok { color: #19d3c5; } .d-gta-clip-short .d-gcs-fail { color: #ff8a3d; }'
  ].join('\n'),
  mount: function (stage, ctx) {
    var DUR = 28, START = [{ t0: 0, d: 4.3 }, { t0: 7.2, d: 2.7 }];
    var wrap = ctx.el('div', 'd-gcs-wrap'); stage.appendChild(wrap);
    wrap.innerHTML = '<div>FIXING SOME LEAKS · 28 s · <span class="d-gcs-src"></span></div>' +
      '<div class="d-gcs-track" aria-hidden="true"><span class="d-gcs-own">OWN GRAPHICS</span></div>' +
      '<div class="d-gcs-bar"><button type="button" data-a="add">Add clip</button><button type="button" data-a="long">Stretch last</button>' +
      '<button type="button" data-a="fan" aria-pressed="false">Fan post source</button><button type="button" data-a="reset">Reset</button></div>' +
      '<div class="d-gcs-out" aria-live="polite"></div>';
    var track = wrap.querySelector('.d-gcs-track'), out = wrap.querySelector('.d-gcs-out'), srcEl = wrap.querySelector('.d-gcs-src'), fanBtn = wrap.querySelector('[data-a="fan"]');
    var clips, fan;
    function reset() { clips = START.map(function (c) { return { t0: c.t0, d: c.d }; }); fan = false; draw(); }
    function merged() {
      var s = clips.map(function (c) { return [c.t0, c.t0 + c.d]; }).sort(function (a, b) { return a[0] - b[0]; }), o = [];
      s.forEach(function (x) { if (o.length && x[0] - o[o.length - 1][1] <= .3) o[o.length - 1][1] = Math.max(o[o.length - 1][1], x[1]); else o.push(x.slice()); });
      return o;
    }
    function lint() {
      var fails = [];
      if (fan) fails.push('source is THIRD_PARTY: topic only, no footage');
      clips.forEach(function (c) { if (c.d > 4.9) fails.push('clip at ' + c.t0.toFixed(1) + ' s is ' + c.d.toFixed(1) + ' s (max 4.9)'); });
      var m = merged(), share = m.reduce(function (a, x) { return a + Math.min(DUR, x[1]) - x[0]; }, 0) / DUR;
      m.forEach(function (x) { if (x[1] - x[0] > 5) fails.push('footage runs unbroken ' + x[0].toFixed(1) + '–' + x[1].toFixed(1) + ' s'); });
      if (share > .5) fails.push('footage is ' + Math.round(share * 100) + ' % of the runtime (max 50 %)');
      return { fails: fails, share: share };
    }
    function draw() {
      track.querySelectorAll('.d-gcs-clip').forEach(function (n) { n.remove(); });
      clips.forEach(function (c) {
        var n = ctx.el('div', 'd-gcs-clip' + (c.d > 4.9 || fan ? ' bad' : ''));
        n.style.left = (c.t0 / DUR * 100) + '%'; n.style.width = (Math.min(c.d, DUR - c.t0) / DUR * 100) + '%'; track.appendChild(n);
      });
      var r = lint();
      srcEl.textContent = fan ? 'SOURCE: FAN POST (THIRD_PARTY)' : 'SOURCE: ROCKSTAR GAMES (OFFICIAL)';
      fanBtn.setAttribute('aria-pressed', String(fan));
      out.innerHTML = 'clips: ' + clips.length + ' uses, footage ' + Math.round(r.share * 100) + ' % of ' + DUR + ' s<br>' +
        (r.fails.length ? r.fails.map(function (f) { return '<span class="d-gcs-fail">FAIL</span> ' + f; }).join('<br>') : '<span class="d-gcs-ok">clip lint ok</span>');
    }
    wrap.querySelector('.d-gcs-bar').addEventListener('click', function (e) {
      var a = e.target.closest('button'); if (!a) return; a = a.dataset.a;
      if (a === 'add') { var last = clips.reduce(function (m, c) { return Math.max(m, c.t0 + c.d); }, 0); if (last + .2 < DUR - 1) clips.push({ t0: last + .2, d: 2.5 }); }
      else if (a === 'long' && clips.length) clips[clips.length - 1].d = Math.min(clips[clips.length - 1].d + 1, 8);
      else if (a === 'fan') fan = !fan;
      else if (a === 'reset') { reset(); return; }
      draw();
    });
    reset();
    return { start: function () {}, stop: function () {}, replay: reset };
  }
});
