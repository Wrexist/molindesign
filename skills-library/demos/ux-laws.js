/* ux-laws — one booking widget, laws applied or broken; pick a law to see where it lives */
(function () {
  var ID = 'ux-laws';
  var LAWS = [
    ['Hick', 'One primary action per view; nav ≤ 7 items'],
    ['Fitts', 'Primary CTA is the biggest target; ≥ 44 px on touch'],
    ['Jakob', 'Logo top-left, familiar nav, native behaviour kept'],
    ['Miller', 'Chunk it: 070 123 45 67, not 0701234567'],
    ['Aesthetic-usability', 'One type scale, one spacing scale, one accent'],
    ['Pareto', 'The booking form gets the space and the polish'],
    ['Occam', 'Cut what nobody would miss (the promo banner)'],
    ['Parkinson', 'Ask only what the next step needs; say how long'],
    ['Postel', 'Accept +46 70-123 45 67; normalise, never reject'],
    ['Peak-end', 'End on a designed success screen, not “Submitted.”'],
    ['Von Restorff', 'The accent marks the one thing that matters'],
    ['Zeigarnik', 'Show where you are: step 2 of 3'],
    ['Tesler', 'The site absorbs complexity: today preselected'],
    ['Doherty', 'Feedback < 100 ms, a result or progress < 400 ms'],
    ['Goal-gradient', 'The last step says it is the last'],
    ['Proximity', 'Label → field 6 px; group → group 18 px'],
    ['Similarity', 'Same function, same look: every chip identical'],
    ['Closure', 'A half-visible slot says the row scrolls'],
    ['Common region', 'The form lives in one card'],
    ['Uniform connectedness', 'A line ties the steps together']
  ];

  Lib.register(ID, {
    hint: 'Pick a law to see where it lives in the widget, flip to “Broken” to see it fail, then press Confirm.',
    notes: [
      'Required on every site: a plan-time pass, the 20 rules while building, a pre-ship audit and a ✓/⚠/✗ report table',
      'Fitts: targets ≥ 44 px, 8 px apart · Hick: one primary CTA per viewport, nav ≤ 7',
      'Doherty: feedback ≤ 100 ms, result or progress ≤ 400 ms; LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1',
      'Postel: accept spaces, dashes, +46, any case; normalise on blur, keep what was typed',
      'Proximity: space inside a group &lt; space between groups (8 / 24 / 64–120 px)'
    ],
    simplified: 'One booking widget shows all 20 laws at once; the SKILL.md also covers page-level budgets (LCP, page weight), forms at full size and the written audit.',
    css: [
      '.d-ux-laws { container-type: inline-size; }',
      '.d-ux-laws .ux { position: absolute; inset: 0; display: grid; grid-template-columns: 1fr minmax(200px, 34%); }',
      '.d-ux-laws .ux-l { position: relative; display: grid; place-items: center; padding: 44px 18px 64px; min-width: 0; }',
      '.d-ux-laws .ux-top { position: absolute; top: 12px; left: 16px; right: 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }',
      '.d-ux-laws .ux-mode { display: inline-flex; border: 1px solid rgb(255 255 255 / .15); border-radius: 999px; padding: 2px; }',
      '.d-ux-laws .ux-mode button { padding: 6px 12px; border-radius: 999px; color: rgb(255 255 255 / .6); transition: background .2s, color .2s; }',
      '.d-ux-laws .ux-mode button[aria-pressed="true"] { background: #fff; color: #000; }',
      '.d-ux-laws .ux-cap { position: absolute; left: 16px; right: 16px; bottom: 12px; margin: 0; display: grid; gap: 3px; min-height: 40px; }',
      '.d-ux-laws .ux-cap b { color: #f97316; font-weight: 500; } .d-ux-laws .ux-cap span { color: rgb(255 255 255 / .85); font-size: 13px; letter-spacing: 0; text-transform: none; }',
      '.d-ux-laws .ux-list { margin: 0; padding: 12px 10px; list-style: none; overflow-y: auto; border-left: 1px solid rgb(255 255 255 / .1); display: grid; gap: 1px; align-content: start; }',
      '.d-ux-laws .ux-list button { width: 100%; display: flex; gap: 8px; text-align: left; padding: 7px 8px; border-radius: 6px; color: rgb(255 255 255 / .6); font-size: 12.5px; transition: background .15s, color .15s; }',
      '.d-ux-laws .ux-list button:hover { color: #fff; background: rgb(255 255 255 / .06); }',
      '.d-ux-laws .ux-list button[aria-pressed="true"] { color: #fff; background: rgb(249 115 22 / .16); }',
      '.d-ux-laws .ux-list .n { color: rgb(255 255 255 / .45); font-variant-numeric: tabular-nums; width: 1.6em; flex: none; }',
      /* the mock widget, laws applied */
      '.d-ux-laws .ux-m { position: relative; width: min(100%, 360px); background: #121212; border: 1px solid rgb(255 255 255 / .12); border-radius: 14px; padding: 12px 14px 14px; font: 13px/1.35 system-ui, sans-serif; color: rgb(255 255 255 / .9); display: flex; flex-direction: column; gap: 10px; }',
      '.d-ux-laws .ux-hd { display: flex; align-items: center; justify-content: space-between; gap: 8px; }',
      '.d-ux-laws .ux-logo { font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 700; letter-spacing: -.02em; }',
      '.d-ux-laws .ux-nav { display: flex; gap: 10px; color: rgb(255 255 255 / .6); font-size: 11.5px; } .d-ux-laws .ux-x { display: none; }',
      '.d-ux-laws .ux-promo { display: none; }',
      '.d-ux-laws .ux-steps { display: flex; margin: 0; padding: 0; list-style: none; font-size: 11px; color: rgb(255 255 255 / .45); }',
      '.d-ux-laws .ux-steps li { flex: 1; position: relative; padding-top: 12px; }',
      '.d-ux-laws .ux-steps li::before { content: ""; position: absolute; top: 0; left: 0; width: 8px; height: 8px; border-radius: 50%; background: rgb(255 255 255 / .25); }',
      '.d-ux-laws .ux-steps li:not(:last-child)::after { content: ""; position: absolute; top: 3.5px; left: 12px; right: 4px; height: 1px; background: rgb(255 255 255 / .25); }',
      '.d-ux-laws .ux-steps .done::before, .d-ux-laws .ux-steps .on::before { background: #fff; } .d-ux-laws .ux-steps .done::after { background: #fff !important; } .d-ux-laws .ux-steps .on { color: #fff; }',
      '.d-ux-laws .ux-card { background: rgb(255 255 255 / .05); border-radius: 10px; padding: 10px; display: grid; gap: 18px; }',
      '.d-ux-laws .ux-g { display: grid; gap: 6px; min-width: 0; } .d-ux-laws .ux-lab { font-size: 11px; color: rgb(255 255 255 / .6); }',
      '.d-ux-laws .ux-chips { display: flex; gap: 6px; } .d-ux-laws .ux-chip { padding: 6px 10px; border-radius: 8px; border: 1px solid rgb(255 255 255 / .18); color: rgb(255 255 255 / .85); font-size: 12px; }',
      '.d-ux-laws .ux-chip[aria-pressed="true"] { background: #fff; color: #000; border-color: #fff; }',
      '.d-ux-laws .ux-slots { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; margin-right: -10px; padding-right: 10px; }',
      '.d-ux-laws .ux-slots .ux-chip { flex: none; }',
      '.d-ux-laws .ux-in { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; border: 1px solid rgb(255 255 255 / .18); background: #0a0a0a; color: #fff; font: inherit; }',
      '.d-ux-laws .ux-ok { font-size: 11px; color: rgb(255 255 255 / .6); } .d-ux-laws .ux-err, .d-ux-laws .bad-t { display: none; }',
      '.d-ux-laws .ux-meta { margin: 0; font-size: 11px; color: rgb(255 255 255 / .45); }',
      '.d-ux-laws .ux-ctas { display: flex; gap: 8px; } .d-ux-laws .ux-cancel { display: none; }',
      '.d-ux-laws .ux-cta { flex: 1; min-height: 44px; border-radius: 10px; background: #f97316; color: #000; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: transform .16s cubic-bezier(.23,1,.32,1), filter .16s; }',
      '.d-ux-laws .ux-cta:active { transform: scale(.97); } .d-ux-laws .ux-cta:hover { filter: brightness(1.08); }',
      '.d-ux-laws .ux-spin { display: none; width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgb(0 0 0 / .25); border-top-color: #000; animation: ux-spin .7s linear infinite; }',
      '.d-ux-laws .ux-cta.busy .ux-spin { display: inline-block; } @keyframes ux-spin { to { transform: rotate(1turn); } }',
      '.d-ux-laws .ux-done { position: absolute; inset: 0; border-radius: 14px; background: #121212; display: grid; place-content: center; text-align: center; gap: 8px; padding: 20px; opacity: 0; visibility: hidden; transition: opacity .4s cubic-bezier(.23,1,.32,1), visibility 0s .4s; }',
      '.d-ux-laws .ux-done.on { opacity: 1; visibility: visible; transition-delay: 0s; }',
      '.d-ux-laws .ux-done h4 { margin: 0; font-family: Archivo, sans-serif; font-stretch: 125%; font-size: 22px; letter-spacing: -.02em; } .d-ux-laws .ux-done p { margin: 0; color: rgb(255 255 255 / .6); }',
      '.d-ux-laws .ux-done button { justify-self: center; margin-top: 4px; padding: 10px 14px; color: rgb(255 255 255 / .85); }',
      '.d-ux-laws .ux-done .bad-t { font-size: 13px; color: rgb(255 255 255 / .7); }',
      /* highlight of the selected law */
      '.d-ux-laws [data-law] { outline: 1.5px dashed transparent; outline-offset: 3px; border-radius: 8px; transition: outline-color .2s; }',
      '.d-ux-laws [data-law].hl { outline-color: #f97316; }',
      /* laws broken */
      '.d-ux-laws .bad .ux-m { font-family: Georgia, serif; gap: 10px; border-radius: 3px; }',
      '.d-ux-laws .bad .ux-hd { flex-direction: row-reverse; } .d-ux-laws .bad .ux-x { display: inline; } .d-ux-laws .bad .ux-nav { gap: 6px; font-size: 9.5px; flex-wrap: wrap; }',
      '.d-ux-laws .bad .ux-promo { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 11px; } .d-ux-laws .bad .ux-promo button { padding: 5px 9px; background: #f97316; color: #000; border-radius: 6px; font-weight: 600; }',
      '.d-ux-laws .bad .ux-steps { visibility: hidden; height: 0; padding: 0; margin: -10px 0 0; overflow: hidden; }',
      '.d-ux-laws .bad .ux-card { background: none; padding: 0; gap: 10px; } .d-ux-laws .bad .ux-g { gap: 10px; }',
      '.d-ux-laws .bad .ux-chip[aria-pressed="true"] { background: none; color: rgb(255 255 255 / .85); border-color: rgb(255 255 255 / .18); }',
      '.d-ux-laws .bad .ux-chip:nth-child(2n) { border-radius: 999px; background: #f97316; color: #000; border-color: #f97316; } .d-ux-laws .bad .ux-chip:nth-child(3n) { border-style: dashed; }',
      '.d-ux-laws .bad .ux-slots { flex-wrap: wrap; max-height: 30px; overflow: hidden; margin-right: 0; padding-right: 0; }',
      '.d-ux-laws .bad .ux-ok, .d-ux-laws .bad .good-t { display: none; } .d-ux-laws .bad .ux-err, .d-ux-laws .bad .bad-t { display: inline; }',
      '.d-ux-laws .bad .ux-err { font-size: 11px; color: #f87171; } .d-ux-laws .bad .ux-in { border-color: #f87171; }',
      '.d-ux-laws .bad .ux-ctas { justify-content: flex-end; } .d-ux-laws .bad .ux-cancel { display: inline; }',
      '.d-ux-laws .bad .ux-cta, .d-ux-laws .bad .ux-cancel { flex: none; min-height: 0; padding: 3px 6px; font-size: 11px; font-weight: 400; background: rgb(255 255 255 / .12); color: rgb(255 255 255 / .8); border-radius: 3px; }',
      '.d-ux-laws .bad .ux-cta .ux-spin { display: none; } .d-ux-laws .bad .ux-done { transition: none; } .d-ux-laws .bad .ux-done h4, .d-ux-laws .bad .ux-done p, .d-ux-laws .bad .ux-done button { display: none; } .d-ux-laws .bad .ux-done .bad-t { display: block; }',
      '@container (max-width: 600px) {',
      '  .d-ux-laws .ux { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }',
      '  .d-ux-laws .ux-l { padding: 40px 8px 50px; overflow: hidden; min-height: 0; } .d-ux-laws .ux-m { zoom: .7; } .d-ux-laws .ux-top > .label { display: none; } .d-ux-laws .ux-top { justify-content: flex-end; top: 8px; }',
      '  .d-ux-laws .ux-cap { bottom: 6px; min-height: 0; } .d-ux-laws .ux-cap span { font-size: 12px; }',
      '  .d-ux-laws .ux-list { display: flex; overflow-x: auto; overflow-y: hidden; border-left: 0; border-top: 1px solid rgb(255 255 255 / .1); padding: 8px; gap: 4px; }',
      '  .d-ux-laws .ux-list li { flex: none; } .d-ux-laws .ux-list button { white-space: nowrap; min-height: 36px; }',
      '}',
      '@media (prefers-reduced-motion: reduce) { .d-ux-laws .ux-spin { animation: none; border-color: #000; } .d-ux-laws .ux-done { transition: none; } .d-ux-laws .ux-cta:active { transform: none; } }'
    ].join('\n'),

    mount: function (stage, ctx) {
      var chip = function (t, on) { return '<button type="button" class="ux-chip"' + (on ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' + t + '</button>'; };
      stage.innerHTML =
        '<div class="ux">' +
          '<div class="ux-l">' +
            '<div class="ux-top"><span class="label">Booking widget</span>' +
              '<div class="ux-mode" role="group" aria-label="Laws"><button type="button" class="label" data-mode="good" aria-pressed="true">Applied</button><button type="button" class="label" data-mode="bad" aria-pressed="false">Broken</button></div></div>' +
            '<div class="ux-m" data-law="5">' +
              '<header class="ux-hd" data-law="3 1"><span class="ux-logo">Krog</span><nav class="ux-nav" aria-label="Demo nav"><span>Menu</span><span>Hours</span><span>Find us</span><span class="ux-x">Story</span><span class="ux-x">Press</span><span class="ux-x">Gift cards</span><span class="ux-x">Jobs</span><span class="ux-x">Blog</span><span class="ux-x">Events</span></nav></header>' +
              '<div class="ux-promo" data-law="7 11"><span>Get 10% off with our newsletter!</span><button type="button" tabindex="-1">Sign up</button></div>' +
              '<ol class="ux-steps" data-law="12 15 20" aria-label="Step 2 of 3"><li class="done">Time</li><li class="on">Details</li><li>Confirm</li></ol>' +
              '<div class="ux-card" data-law="19 6">' +
                '<div class="ux-g" data-law="16"><span class="ux-lab">Day</span><div class="ux-chips ux-day" data-law="13 17">' + chip('Today', true) + chip('Fri') + chip('Sat') + chip('Sun') + '</div></div>' +
                '<div class="ux-g"><span class="ux-lab">Time</span><div class="ux-slots" data-law="18">' + ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'].map(function (t, i) { return chip(t, i === 3); }).join('') + '</div></div>' +
                '<label class="ux-g" data-law="9 4 16"><span class="ux-lab">Phone</span><input class="ux-in" type="tel" inputmode="tel" autocomplete="tel" value="+46 70-123 45 67" tabindex="-1" readonly>' +
                  '<span class="ux-ok">✓ Saved as 070 123 45 67</span><span class="ux-err">Invalid phone number format.</span></label>' +
              '</div>' +
              '<p class="ux-meta" data-law="8"><span class="good-t">2 fields · about 30 seconds</span><span class="bad-t">Also required: name, email, address, birthday, how did you hear about us?</span></p>' +
              '<div class="ux-ctas" data-law="2 11 14 15 1"><button type="button" class="ux-cancel" tabindex="-1">Cancel</button><button type="button" class="ux-cta"><span class="ux-spin" aria-hidden="true"></span><span class="good-t">Confirm booking</span><span class="bad-t">Next</span></button></div>' +
              '<div class="ux-done" data-law="10" role="status"><h4>See you today at 18:30</h4><p>A text is on its way to 070 123 45 67.<br>Table for two, window if we can.</p><button type="button" class="ux-back label">Book another</button><span class="bad-t">Submitted.</span></div>' +
            '</div>' +
            '<p class="label ux-cap" aria-live="polite"></p>' +
          '</div>' +
          '<ol class="ux-list" aria-label="The 20 laws">' + LAWS.map(function (l, i) {
            return '<li><button type="button" class="label" data-i="' + (i + 1) + '" aria-pressed="false"><span class="n">' + String(i + 1).padStart(2, '0') + '</span>' + l[0] + '</button></li>';
          }).join('') + '</ol>' +
        '</div>';

      var root = stage.querySelector('.ux'), cap = stage.querySelector('.ux-cap');
      var lawBtns = stage.querySelectorAll('.ux-list button'), modeBtns = stage.querySelectorAll('.ux-mode button');
      var cta = stage.querySelector('.ux-cta'), done = stage.querySelector('.ux-done');
      var cur = 1, timers = [];

      function pick(i) {
        cur = i;
        lawBtns.forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.i === i ? 'true' : 'false'); });
        stage.querySelectorAll('[data-law]').forEach(function (n) { n.classList.toggle('hl', n.dataset.law.split(' ').indexOf(String(i)) >= 0); });
        var bad = root.classList.contains('bad');
        cap.innerHTML = '<b>' + String(i).padStart(2, '0') + ' · ' + LAWS[i - 1][0] + (bad ? ' · broken' : '') + '</b><span>' + LAWS[i - 1][1] + '</span>';
      }
      function reset() { timers.forEach(clearTimeout); timers = []; cta.classList.remove('busy'); done.classList.remove('on'); }
      function setMode(m) {
        reset();
        root.classList.toggle('bad', m === 'bad');
        modeBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === m ? 'true' : 'false'); });
        pick(cur);
      }

      lawBtns.forEach(function (b) { b.addEventListener('click', function () { pick(+b.dataset.i); }); });
      modeBtns.forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
      // chips behave like a single-choice group inside each row
      stage.querySelectorAll('.ux-chips, .ux-slots').forEach(function (row) {
        row.addEventListener('click', function (e) {
          var c = e.target.closest('.ux-chip'); if (!c) return;
          row.querySelectorAll('.ux-chip').forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); });
        });
      });
      // Doherty: applied = busy state at once, result at ~900 ms; broken = nothing for 1.6 s, then a bare "Submitted."
      cta.addEventListener('click', function () {
        reset();
        var bad = root.classList.contains('bad');
        if (!bad) cta.classList.add('busy');
        timers.push(setTimeout(function () {
          cta.classList.remove('busy'); done.classList.add('on');
          var day = stage.querySelector('.ux-day [aria-pressed="true"]'), slot = stage.querySelector('.ux-slots [aria-pressed="true"]');
          done.querySelector('h4').textContent = 'See you ' + (day ? day.textContent.toLowerCase().replace(/^(fri|sat|sun)$/, function (d) { return { fri: 'Friday', sat: 'Saturday', sun: 'Sunday' }[d]; }) : 'today') + ' at ' + (slot ? slot.textContent : '18:30');
          pick(bad ? 14 : 10);
        }, bad ? 1600 : 900));
      });
      stage.querySelector('.ux-back').addEventListener('click', reset);
      pick(1);

      return {
        start: function () {},
        stop: function () { reset(); },
        replay: function () { setMode('good'); pick(1); }
      };
    }
  });
})();
