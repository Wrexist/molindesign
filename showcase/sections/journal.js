/* #journal: Field journal. comic-panel-spot-color (hatched B&W panels, one spot red + brass, clip-cut frames)
   + physics-on-flat-art (contact-sheet prints on a tiny 2D rigid-body solver, album-track framing). */
(function () {
  var INK = '#0d0d0c';
  // comic-panel-spot-color: hatch families built as SVG patterns (density = shade), one red halftone
  var DEFS = '<svg class="jr-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
    '<pattern id="jr-hd" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M.5 0V5" stroke="' + INK + '" stroke-width="1.1"/></pattern>' +
    '<pattern id="jr-hx" width="4.4" height="4.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M.5 0V4.4M0 .5H4.4" stroke="' + INK + '" stroke-width="1.15"/></pattern>' +
    '<pattern id="jr-hxx" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M.6 0V3.2M0 .6H3.2" stroke="' + INK + '" stroke-width="1.35"/></pattern>' +
    '<pattern id="jr-hh" width="7" height="4" patternUnits="userSpaceOnUse"><path d="M0 .6H5" stroke="' + INK + '" stroke-width="1"/></pattern>' +
    '<pattern id="jr-dots" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><circle cx="2.5" cy="2.5" r="1.55" fill="#ff4d1f"/></pattern>' +
    '</defs></svg>';
  var FIG = function (x, y, s) { // photographer silhouette with tripod over the shoulder
    return '<g class="i" transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><circle cx="0" cy="-30" r="4.2"/>' +
      '<path d="M-4-25h8l2 14-2 1-1 13 3 12h-4l-3-11-3 11h-4l3-12-1-13-2-1z"/>' +
      '<path d="M3-22l17-14M3-22l19-9M3-22l14-16" stroke="' + INK + '" stroke-width="1.6" fill="none"/></g>';
  };
  var STARS = function (n, y0, y1, seed) {
    var s = '', r = seed;
    for (var i = 0; i < n; i++) { r = (r * 9301 + 49297) % 233280; var x = r / 233280 * 400; r = (r * 9301 + 49297) % 233280; s += '<circle class="p" cx="' + x.toFixed(1) + '" cy="' + (y0 + r / 233280 * (y1 - y0)).toFixed(1) + '" r="' + (i % 4 ? 1 : 1.7) + '"/>'; }
    return s;
  };
  var SCENES = [
    { t: '18:40', top: 'Lysekil, 18:40', cap: 'The last ferry leaves. She stays on the rocks.', alt: 'A photographer walks over the granite shore at Lysekil with a tripod on her shoulder while the last ferry leaves.',
      svg: '<rect class="p" width="400" height="260"/><rect width="400" height="150" fill="url(#jr-hd)"/>' +
        '<circle cx="306" cy="132" r="24" class="g" stroke="' + INK + '" stroke-width="2"/><rect class="p" x="270" y="146" width="80" height="6"/>' +
        '<path class="i" d="M0 150V116q30-9 58-2l8-8 3-36 3 36 8 8q50 4 82 36z"/>' +
        '<g class="p"><rect x="20" y="124" width="3" height="3"/><rect x="34" y="120" width="3" height="3"/><rect x="92" y="128" width="3" height="3"/><rect x="108" y="134" width="3" height="3"/></g>' +
        '<rect y="150" width="400" height="60" fill="url(#jr-hh)"/>' +
        '<path class="i" d="M118 148h46l-6 7h-36z"/><rect class="i" x="134" y="140" width="14" height="8"/><path d="M166 152h40M170 156h28" stroke="' + INK + '" stroke-width="1"/>' +
        '<path class="i" d="M0 260v-55q40-19 90-9 50-20 110-2 60-14 100 4 50-8 100 8v54z"/>' +
        '<path d="M28 202q30-9 58-3M150 186q30-6 50 4M300 196q30-4 60 2" stroke="#ece8df" stroke-width="1.6" fill="none"/>' + FIG(236, 190, 1.1) },
    { t: '19:55', top: '19:55', cap: 'The lighthouse counts the dark in flashes.', alt: 'A striped lighthouse on a skerry throws a red beam across a dark, hatched sky.',
      svg: '<rect class="p" width="400" height="260"/><rect width="400" height="166" fill="url(#jr-hx)"/>' + STARS(16, 8, 60, 7) +
        '<path class="beam" d="M300 80L0 18V132L300 88z" fill="url(#jr-dots)"/><path d="M300 80L0 18M300 88L0 132" stroke="var(--signal)" stroke-width="1.2"/>' +
        '<rect y="166" width="400" height="94" fill="url(#jr-hh)"/><path d="M110 184h70M150 196h90M200 210h60" stroke="var(--signal)" stroke-width="2" stroke-dasharray="6 5"/>' +
        '<path class="i" d="M222 178q30-30 76-22 44-6 80 22z"/>' +
        '<path class="p" d="M290 160l4-66h12l4 66z" stroke="' + INK + '" stroke-width="2"/><path class="i" d="M292 120h16l-.6 12h-14.8zM293 104h14l-.4 8h-13.2z"/>' +
        '<rect class="i" x="291" y="78" width="18" height="16"/><rect x="295" y="81" width="10" height="9" fill="var(--signal)"/><path class="i" d="M288 78l12-12 12 12z"/>' },
    { t: '20:31', top: '20:31', cap: 'Tripod down. Wide open at f/1.4.', bubble: 'Not yet.', alt: 'Close-up of the Halden LF-1 on a tripod under a gold moon. A speech balloon says: not yet.',
      svg: '<rect class="p" width="400" height="260"/><rect width="400" height="260" fill="url(#jr-hxx)"/>' +
        '<circle cx="326" cy="58" r="28" class="g" stroke="' + INK + '" stroke-width="2"/><path d="M314 50q6-4 10 2M330 66q5 3 9-2" stroke="' + INK + '" fill="none"/>' +
        '<path class="i" d="M0 260v-56q130-26 400-6v62z"/><path d="M40 214q60-12 120-10M250 208q60-2 110 6" stroke="#ece8df" stroke-width="1.4" fill="none"/>' +
        '<path d="M200 160l-48 92M200 160l50 92M200 160l4 96" stroke="#ece8df" stroke-width="3.2"/><rect class="p" x="190" y="148" width="20" height="14" stroke="' + INK + '"/>' +
        '<svg x="110" y="58" width="180" height="108" viewBox="0 0 400 240" style="color:#ece8df"><use href="#lf1"/></svg>' },
    { t: '21:12', top: '21:12', cap: 'The blue hour. Eleven minutes, if the wind holds.', alt: 'A photographer sits on the rocks beside her camera, waiting for the blue hour over a darkening sea. Town lights glow on the far shore.',
      svg: '<rect class="p" width="400" height="260"/><rect width="400" height="62" fill="url(#jr-hxx)"/><rect y="62" width="400" height="50" fill="url(#jr-hx)"/><rect y="112" width="400" height="40" fill="url(#jr-hd)"/>' + STARS(14, 6, 54, 31) +
        '<path class="i" d="M0 152v-8q50-6 110 2 60-8 120 6z"/><g class="g"><circle cx="20" cy="146" r="1.6"/><circle cx="36" cy="147" r="1.6"/><circle cx="58" cy="145" r="1.6"/><circle cx="84" cy="147" r="1.6"/><circle cx="130" cy="148" r="1.6"/></g>' +
        '<rect class="i" x="352" y="122" width="5" height="26"/><circle cx="354.5" cy="120" r="2.6" fill="var(--signal)"/>' +
        '<rect y="152" width="400" height="50" fill="url(#jr-hh)"/>' +
        '<path class="i" d="M0 260v-48q70-24 160-14 90-26 240 4v58z"/>' +
        '<g class="i" transform="translate(230 196)"><circle cx="0" cy="-34" r="4.6"/><path d="M-6-28h10l6 18 12 2v5l-17-1-5-6-2 10h-8z"/></g>' +
        '<path d="M262 196l-8-30M262 196l8-30M262 196l1-32" stroke="' + INK + '" stroke-width="1.6"/><rect class="i" x="252" y="152" width="20" height="13" rx="2"/>' },
    { t: '21:14', top: '21:14', cap: 'One frame. She packs up before the blue is gone.', sfx: 'Klak!', alt: 'The finished photograph through the viewfinder: the lighthouse beam frozen in red over the sea. Sound effect: klak.',
      svg: '<rect class="p" width="400" height="260"/><rect width="400" height="168" fill="url(#jr-hx)"/>' + STARS(22, 10, 110, 77) +
        '<path d="M232 106L0 74V140L232 112z" fill="var(--signal)"/><rect y="168" width="400" height="92" fill="url(#jr-hh)"/>' +
        '<path class="i" d="M170 176q34-24 70-16 30-2 52 16z"/><path class="p" d="M226 164l3-50h8l3 50z" stroke="' + INK + '" stroke-width="1.6"/><rect class="i" x="225" y="100" width="16" height="14"/><path class="i" d="M222 100l11-9 11 9z"/>' +
        '<path d="M30 54V36h18M370 54V36h-18M30 206v18h18M370 206v18h-18" stroke="#ece8df" stroke-width="2.4" fill="none"/>' +
        '<text x="44" y="222" font-family="Geist Mono, monospace" font-size="9" fill="#ece8df" letter-spacing="1">2 S · F/1.4 · ISO 3200</text>' }
  ];
  // contact sheet frames (B&W only; the keeper gets the red grease-pencil mark)
  var MINI = [
    ['Granite shore, 18:32', '<rect class="p" width="120" height="80"/><rect width="120" height="44" fill="url(#jr-hd)"/><rect y="44" width="120" height="14" fill="url(#jr-hh)"/><path class="i" d="M0 80V60q30-8 60 0 30-8 60 2v18z"/>'],
    ['The ferry, 18:40', '<rect class="p" width="120" height="80"/><rect width="120" height="46" fill="url(#jr-hd)"/><rect y="46" width="120" height="34" fill="url(#jr-hh)"/><path class="i" d="M40 46h34l-5 6H45z"/><rect class="i" x="50" y="38" width="12" height="8"/>'],
    ['Church spire, 19:10', '<rect class="p" width="120" height="80"/><rect width="120" height="80" fill="url(#jr-hx)"/><path class="i" d="M0 80V50q30-8 52-2l4-30 4 30q30-4 60 4v28z"/>'],
    ['Moonrise, 19:40', '<rect class="p" width="120" height="80"/><rect width="120" height="80" fill="url(#jr-hxx)"/><circle class="p" cx="70" cy="34" r="14" stroke="' + INK + '"/><path class="i" d="M0 80V64q60-10 120 0v16z"/>'],
    ['Lighthouse, 19:55', '<rect class="p" width="120" height="80"/><rect width="120" height="54" fill="url(#jr-hx)"/><path d="M80 26L0 10V46z" fill="url(#jr-hd)"/><rect y="54" width="120" height="26" fill="url(#jr-hh)"/><path class="p" d="M78 54l2-28h4l2 28z" stroke="' + INK + '"/>'],
    ['The keeper, 21:14', '<rect class="p" width="120" height="80"/><rect width="120" height="52" fill="url(#jr-hx)"/><path d="M70 30L0 20V44L70 34z" class="i"/><rect y="52" width="120" height="28" fill="url(#jr-hh)"/><path class="p" d="M68 52l2-24h4l2 24z" stroke="' + INK + '"/>', true],
    ['Self-portrait, 21:20', '<rect class="p" width="120" height="80"/><rect width="120" height="80" fill="url(#jr-hxx)"/><circle class="p" cx="60" cy="30" r="5"/><path class="p" d="M53 37h14l3 43H50z"/>'],
    ['Star trails, 22:05', '<rect class="i" width="120" height="80"/><g fill="none" stroke="#ece8df" stroke-width=".8"><circle cx="90" cy="10" r="20"/><circle cx="90" cy="10" r="34"/><circle cx="90" cy="10" r="50"/><circle cx="90" cy="10" r="68"/></g>']
  ];

  Site.section('journal', {
    css: `
#journal { --spot: var(--signal); background: #161615; overflow: hidden; }
#journal .jr-defs { position: absolute; }
#journal .jr-head { display: grid; gap: 2.4rem; margin-bottom: 6rem; }
#journal h2 { font-size: 4.8rem; text-transform: uppercase; font-weight: 800; letter-spacing: -.01em; line-height: .92; }
#journal h2 .serif { text-transform: none; font-weight: 400; color: var(--brass); }
#journal .jr-lede { max-width: 46rem; color: var(--p70); font-size: 1.6rem; }
#journal .i { fill: var(--ink); } #journal .p { fill: var(--paper); } #journal .g { fill: var(--brass); }
#journal .jr-spread { display: grid; grid-template-columns: 1fr; gap: 6rem; }
#journal .jr-panel { --h: 30rem; position: relative; margin: 0; height: var(--h); }
#journal .jr-cut { position: absolute; inset: 0; background: var(--paper); clip-path: polygon(var(--x1) 50%, var(--x2) 50%, var(--x2) 50%, var(--x1) 50%); transition: clip-path .8s cubic-bezier(.7,0,.2,1); }
#journal .jr-panel.is-in .jr-cut { clip-path: polygon(var(--x1) var(--y1), var(--x2) var(--y2), var(--x3) var(--y3), var(--x4) var(--y4)); }
#journal .jr-art { position: absolute; inset: 0; width: 100%; height: 100%; display: block; transform: scale(1.12); transition: transform 1.4s var(--ease-out); }
#journal .jr-panel.is-in .jr-art { transform: none; }
#journal .jr-frame { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
#journal .jr-frame polygon { fill: none; stroke: var(--paper); stroke-width: 3; vector-effect: non-scaling-stroke; opacity: 0; transition: opacity .3s .5s, stroke .1s; }
#journal .jr-panel.is-in .jr-frame polygon { opacity: 1; }
#journal .jr-box { position: absolute; z-index: 1; max-width: min(30rem, 76%); padding: .7rem 1rem; background: var(--paper); color: var(--ink); border: 2px solid var(--ink); font-family: var(--f-display); font-stretch: 112.5%; font-weight: 800; font-size: 1.15rem; letter-spacing: .04em; line-height: 1.25; text-transform: uppercase; transition: border-color .1s, opacity .5s .55s, transform .5s .55s var(--ease-out); opacity: 0; transform: translateY(.6rem); }
#journal .jr-panel.is-in .jr-box { opacity: 1; transform: none; }
#journal .jr-box.top { left: 1.6rem; top: 1.4rem; background: var(--brass); }
#journal .jr-box.cap { right: 1.6rem; bottom: 1.4rem; }
#journal .jr-bubble { position: absolute; z-index: 1; left: 8%; top: 12%; padding: 1rem 1.6rem; border-radius: 50%; background: var(--paper); color: var(--ink); border: 2px solid var(--ink); font-weight: 800; font-stretch: 125%; font-size: 1.8rem; text-transform: uppercase; }
#journal .jr-bubble::after { content: ""; position: absolute; right: -1.2rem; bottom: -.6rem; border: .9rem solid transparent; border-left: 1.8rem solid var(--ink); transform: rotate(28deg); }
#journal .jr-sfx { position: absolute; z-index: 1; right: 8%; top: 10%; font-weight: 900; font-stretch: 125%; font-size: 5.6rem; line-height: 1; text-transform: uppercase; color: var(--paper); -webkit-text-stroke: 2px var(--ink); paint-order: stroke; transform: rotate(-8deg) scale(.6); opacity: 0; transition: transform .5s .9s cubic-bezier(.34,1.56,.64,1), opacity .2s .9s; }
#journal .jr-panel.is-in .jr-sfx { transform: rotate(-8deg); opacity: 1; }
#journal .jr-track { position: absolute; left: 0; right: 0; top: calc(100% + .6rem); display: flex; justify-content: space-between; align-items: center; gap: 1rem; color: var(--p45); }
#journal .jr-track b { color: var(--paper); font-weight: 500; }
#journal .jr-next { padding: .8rem 0 .8rem 1rem; min-height: 3.2rem; color: var(--p70); transition: color .1s; }
#journal .jr-next:hover, #journal .jr-next:focus-visible { color: var(--spot); }
#journal .jr-panel:focus-visible { outline-offset: 6px; }
@media (hover: hover) and (pointer: fine) {
  #journal .jr-panel:hover .jr-frame polygon { stroke: var(--spot); }
  #journal .jr-panel:hover .jr-box.cap { border-color: var(--spot); }
}
#journal .jr-sheet { margin-top: 10rem; }
#journal .jr-sheet-head { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 1.6rem 3rem; margin-bottom: 2rem; }
#journal .jr-sheet-head h3 { font-size: 2.8rem; font-stretch: 125%; letter-spacing: -.02em; line-height: 1; }
#journal .jr-sheet-head p { color: var(--p70); max-width: 44rem; margin-top: 1rem; }
#journal .jr-tray { position: relative; height: 44rem; border: 1px solid var(--p15); background: radial-gradient(120% 90% at 50% 120%, #242422, #121211 70%); overflow: hidden; user-select: none; -webkit-user-select: none; }
#journal .jr-tray::before { content: "ROLL 07 · HÅLLÖ · ILFORD HP5 · PUSH +2"; position: absolute; left: 1.6rem; top: 1.2rem; font: 500 1rem/1 var(--f-mono); letter-spacing: .14em; color: var(--p45); }
#journal .jr-print { position: absolute; left: 0; top: 0; background: var(--paper); color: var(--ink); box-shadow: 0 1.2rem 2.4rem rgb(0 0 0 / .45); touch-action: none; cursor: grab; will-change: transform; }
#journal .jr-print svg { position: absolute; left: 6%; right: 6%; top: 6%; bottom: 2.4rem; width: 88%; height: calc(94% - 2.4rem); display: block; }
#journal .jr-print .jr-pn { position: absolute; left: 6%; right: 6%; bottom: 0; font-size: 1rem; line-height: 2.4rem; display: flex; justify-content: space-between; }
#journal .jr-print.keep::after { content: ""; position: absolute; inset: -6% -5%; border: 3px solid var(--spot); border-radius: 46% 54% 50% 48% / 52% 46% 54% 48%; transform: rotate(-3deg); pointer-events: none; }
#journal .jr-print:focus-visible { outline: 2px solid var(--spot); outline-offset: 4px; }
#journal .jr-tray.dragging .jr-print { cursor: grabbing; }
#journal .jr-hint { color: var(--p45); margin-top: 1.2rem; }
#journal .jr-tray.static { height: auto; display: flex; flex-wrap: wrap; justify-content: center; gap: 2.4rem 1.6rem; padding: 5rem 1.6rem 3rem; }
#journal .jr-tray.static .jr-print { position: relative; cursor: default; will-change: auto; }
@media (min-width: 768px) {
  #journal h2 { font-size: 10.4rem; }
  #journal .jr-head { grid-template-columns: 1fr 40rem; align-items: end; }
  #journal .jr-spread { grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 5.6rem 2.4rem; }
  #journal .jr-panel:nth-child(1) { grid-column: 1 / span 7; --h: 40rem; }
  #journal .jr-panel:nth-child(2) { grid-column: 8 / span 5; --h: 40rem; }
  #journal .jr-panel:nth-child(3) { grid-column: 1 / span 5; --h: 38rem; }
  #journal .jr-panel:nth-child(4) { grid-column: 6 / span 7; --h: 38rem; }
  #journal .jr-panel:nth-child(5) { grid-column: 2 / span 10; --h: 44rem; }
  #journal .jr-box { font-size: 1.3rem; }
  #journal .jr-sfx { font-size: 9rem; }
  #journal .jr-tray { height: 52rem; }
}
@media (prefers-reduced-motion: reduce) {
  #journal .jr-cut, #journal .jr-art, #journal .jr-box, #journal .jr-sfx, #journal .jr-frame polygon { transition: opacity .4s ease; }
}`,
    mount: function (root, ctx) {
      var R = ctx.reduced, pad = function (n) { return String(n).padStart(2, '0'); };
      // hand-cut corners (≤ 4° feel): [x1 y1 x2 y2 x3 y3 x4 y4] in %
      var CUTS = [[0, 2, 99, 0, 100, 97, 1, 100], [2, 0, 100, 3, 98, 100, 0, 98], [0, 0, 98, 2, 100, 99, 2, 100], [1, 3, 100, 0, 99, 100, 0, 97], [0, 1, 100, 0, 99, 98, 1, 100]];
      var panels = SCENES.map(function (s, i) {
        var c = CUTS[i], vars = '--x1:' + c[0] + '%;--y1:' + c[1] + '%;--x2:' + c[2] + '%;--y2:' + c[3] + '%;--x3:' + c[4] + '%;--y3:' + c[5] + '%;--x4:' + c[6] + '%;--y4:' + c[7] + '%';
        var last = i === SCENES.length - 1;
        return '<figure class="jr-panel" style="' + vars + '" tabindex="-1" aria-labelledby="jr-c' + i + '">' +
          '<div class="jr-cut"><svg class="jr-art" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + s.alt + '">' + s.svg + '</svg>' +
          '<svg class="jr-frame" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="' + c[0] + ',' + c[1] + ' ' + c[2] + ',' + c[3] + ' ' + c[4] + ',' + c[5] + ' ' + c[6] + ',' + c[7] + '"/></svg></div>' +
          '<p class="jr-box top" aria-hidden="true">' + s.top + '</p>' +
          (s.bubble ? '<p class="jr-bubble">' + s.bubble + '</p>' : '') + (s.sfx ? '<p class="jr-sfx" aria-hidden="true">' + s.sfx + '</p>' : '') +
          '<figcaption class="jr-box cap" id="jr-c' + i + '"><span class="sr-only">' + s.t + '. </span>' + s.cap + '</figcaption>' +
          '<div class="jr-track label"><span><b class="mono">' + pad(i + 1) + ':' + pad(last ? 1 : i + 2) + '</b> · Track ' + pad(i + 1) + '</span>' +
          '<button type="button" class="jr-next label" data-to="' + (last ? 'sheet' : i + 1) + '">' + (last ? 'To the prints ↓' : 'Next →') + '</button></div></figure>';
      }).join('');
      root.insertAdjacentHTML('beforeend', DEFS + '<div class="wrap">' +
        '<div class="jr-head"><div><p class="kicker"><span>05</span>Field journal</p>' +
        '<h2 class="display"><span class="mask"><span class="line">Waiting</span></span><span class="mask"><span class="line">for <span class="serif">blue</span>.</span></span></h2></div>' +
        '<p class="jr-lede rise">One evening on the Bohuslän coast with a pre-production LF‑1: from the last ferry out of Lysekil to the eleven minutes of blue hour, told the way the roll came back. Vol. I, five tracks.</p></div>' +
        '<div class="jr-spread">' + panels + '</div>' +
        '<div class="jr-sheet" id="jr-sheet" tabindex="-1"><div class="jr-sheet-head"><div><h3>Contact sheet</h3>' +
        '<p>Eight frames from roll seven. 24 MP monochrome files, printed small and thrown on the table. One keeper, circled.</p></div>' +
        '<button type="button" class="btn ghost small jr-shake">Shake the table</button></div>' +
        '<div class="jr-tray" role="group" aria-label="Contact sheet prints"></div>' +
        '<p class="jr-hint label">' + (R ? 'Prints laid out flat' : 'Drag and throw a print · arrow keys nudge the focused one') + '</p></div></div>');

      var head = root.querySelector('.jr-head'), tray = root.querySelector('.jr-tray'), shakeB = root.querySelector('.jr-shake');
      var panelEls = [].slice.call(root.querySelectorAll('.jr-panel'));
      root.querySelectorAll('.jr-next').forEach(function (b) {
        b.addEventListener('click', function () {
          var t = b.dataset.to === 'sheet' ? root.querySelector('#jr-sheet') : panelEls[+b.dataset.to];
          t.scrollIntoView({ behavior: R ? 'auto' : 'smooth', block: 'center' });
          t.focus({ preventScroll: true });
          ctx.audio.click(.4);
        });
      });

      /* ---------- comic panels open on enter (clip reveal, staggered per row) ---------- */
      var entered = false, io = null;
      function openPanel(p, d) { setTimeout(function () { p.classList.add('is-in'); }, d); }
      function watchPanels() {
        if (io || !entered) return;
        if (R || !('IntersectionObserver' in window)) { panelEls.forEach(function (p) { p.classList.add('is-in'); }); return; }
        var batch = 0;
        io = new IntersectionObserver(function (es) {
          es.forEach(function (e) { if (e.isIntersecting) { openPanel(e.target, (batch++ % 2) * 140); io.unobserve(e.target); } });
          batch = 0;
        }, { threshold: .2 });
        panelEls.forEach(function (p) { if (!p.classList.contains('is-in')) io.observe(p); });
      }

      /* ---------- contact sheet: prints as bodies (physics-on-flat-art) ---------- */
      var W = 0, H = 0, bodies = [], walls = [], held = null, contacts = [], g = { x: 0, y: 1.4 }, gWake = 1.4;
      function staticBox(x, y, hw, hh) { return { x: x, y: y, a: 0, vx: 0, vy: 0, w: 0, hw: hw, hh: hh, im: 0, iI: 0, stat: true, rest: .3, fr: .5 }; }
      function fitWalls() {
        var r = tray.getBoundingClientRect(); W = r.width; H = r.height;
        // rebuilt, not scaled: ground, two side walls and a lid so a scroll fling can't throw prints out of the tray
        walls = [staticBox(W / 2, H + 50, W + 400, 50), staticBox(-50, H / 2, 50, H * 2), staticBox(W + 50, H / 2, 50, H * 2), staticBox(W / 2, -50, W + 400, 50)];
        bodies.forEach(function (b) { b.x = ctx.clamp(b.x, b.hw, W - b.hw); b.y = ctx.clamp(b.y, b.hh, H - b.hh); b.sleep = false; b.still = 0; });
      }
      function build() {
        bodies.forEach(function (b) { b.el.remove(); });
        bodies = [];
        tray.classList.toggle('static', R);
        fitWalls();
        var n = W < 560 ? 6 : 8, pw = ctx.clamp(W * (W < 560 ? .34 : .14), 110, 190), ph = pw * .8;
        for (var i = 0; i < n; i++) {
          var k = MINI[i], d = document.createElement('div');
          d.className = 'jr-print' + (k[2] ? ' keep' : '');
          d.tabIndex = 0; d.setAttribute('role', 'img');
          d.setAttribute('aria-label', 'Frame ' + pad(i + 1) + ': ' + k[0] + (k[2] ? ', circled as the keeper' : ''));
          if (!R) d.dataset.cursor = 'Drag';
          d.innerHTML = '<svg viewBox="0 0 120 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + k[1] + '</svg><span class="jr-pn mono" aria-hidden="true"><span>' + pad(i + 1) + ' ▸</span><span>' + pad(i + 1) + 'A</span></span>';
          d.style.width = pw + 'px'; d.style.height = ph + 'px';
          if (R) { d.style.transform = 'rotate(' + ((i % 3) - 1) * 3 + 'deg)'; tray.appendChild(d); continue; } // static fanned grid
          var hw = pw / 2, hh = ph / 2, m = 4 * hw * hh;
          var b = { el: d, hw: hw, hh: hh, m: m, im: 1 / m, I: m * (hw * hw + hh * hh) / 3, rest: .4, fr: .5, sleep: false, still: 0,
            x: hw + 10 + ((i * .618) % 1) * (W - pw - 20), y: hh + 30 + (i % 3) * 20, a: (Math.random() - .5) * .5, vx: 0, vy: 0, w: 0 };
          b.iI = 1 / b.I; tray.appendChild(d); bodies.push(b);
        }
        render();
      }
      function verts(b) {
        var c = Math.cos(b.a), s = Math.sin(b.a), out = [];
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (k) { var lx = k[0] * b.hw, ly = k[1] * b.hh; out.push([b.x + lx * c - ly * s, b.y + lx * s + ly * c]); });
        return out;
      }
      function inside(p, vs) {
        for (var i = 0; i < 4; i++) { var a = vs[i], b = vs[(i + 1) % 4]; if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) < -.5) return false; }
        return true;
      }
      function collide(A, B) { // box vs box SAT, contacts with normal A -> B
        var out = [], va = verts(A), vb = verts(B), best = 1e9, bn = null, axes = [];
        [A, B].forEach(function (k) { var c = Math.cos(k.a), s = Math.sin(k.a); axes.push([c, s], [-s, c]); });
        for (var i = 0; i < 4; i++) {
          var ax = axes[i], a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
          for (var j = 0; j < 4; j++) {
            var pa = va[j][0] * ax[0] + va[j][1] * ax[1], pb = vb[j][0] * ax[0] + vb[j][1] * ax[1];
            a0 = Math.min(a0, pa); a1 = Math.max(a1, pa); b0 = Math.min(b0, pb); b1 = Math.max(b1, pb);
          }
          var o = Math.min(a1, b1) - Math.max(a0, b0);
          if (o <= 0) return out;
          if (o < best) { best = o; bn = ax; }
        }
        var nx = bn[0], ny = bn[1];
        if ((B.x - A.x) * nx + (B.y - A.y) * ny < 0) { nx = -nx; ny = -ny; }
        vb.forEach(function (p) { if (inside(p, va)) out.push({ nx: nx, ny: ny, d: best, px: p[0], py: p[1] }); });
        va.forEach(function (p) { if (inside(p, vb)) out.push({ nx: nx, ny: ny, d: best, px: p[0], py: p[1] }); });
        if (!out.length) out.push({ nx: nx, ny: ny, d: best, px: (A.x + B.x) / 2, py: (A.y + B.y) / 2 });
        return out.slice(0, 2);
      }
      var im = function (b) { return b.stat || b.sleep ? 0 : b.im; }, iI = function (b) { return b.stat || b.sleep ? 0 : b.iI; };
      function wake(b) { if (b.sleep) { b.sleep = false; b.still = 0; } }
      function relV(k) {
        var A = k.A, B = k.B, rx = (B.vx - B.w * k.by) - (A.vx - A.w * k.ay), ry = (B.vy + B.w * k.bx) - (A.vy + A.w * k.ax);
        return [rx * k.nx + ry * k.ny, rx * -k.ny + ry * k.nx];
      }
      function apply(k, jx, jy) {
        var A = k.A, B = k.B;
        A.vx -= jx * im(A); A.vy -= jy * im(A); A.w -= (k.ax * jy - k.ay * jx) * iI(A);
        B.vx += jx * im(B); B.vy += jy * im(B); B.w += (k.bx * jy - k.by * jx) * iI(B);
      }
      function step(dt) {
        var GA = 1000 * (ctx.fine ? 1 : .9); // Matter gravity.scale .001 px/ms² ≈ 1000 px/s²; ×.9 on mobile
        bodies.forEach(function (b) { if (b.sleep) return; b.vx += g.x * GA * dt; b.vy += g.y * GA * dt; b.vx *= .995; b.vy *= .995; b.w *= .99; });
        if (held) { // soft mouse constraint { stiffness .1, damping .01, length 20 } as a mouse joint
          var b = held.b, c = Math.cos(b.a), s = Math.sin(b.a), rx = held.lx * c - held.ly * s, ry = held.lx * s + held.ly * c;
          var ex = held.tx - (b.x + rx), ey = held.ty - (b.y + ry);
          var dvx = ex * .27 / dt - (b.vx - b.w * ry), dvy = ey * .27 / dt - (b.vy + b.w * rx);
          var k11 = b.im + b.iI * ry * ry, k12 = -b.iI * rx * ry, k22 = b.im + b.iI * rx * rx, det = k11 * k22 - k12 * k12;
          var jx = (k22 * dvx - k12 * dvy) / det * .5, jy = (k11 * dvy - k12 * dvx) / det * .5;
          b.vx += jx * b.im; b.vy += jy * b.im; b.w += (rx * jy - ry * jx) * b.iI; b.w *= .9;
        }
        contacts = [];
        var all = bodies.concat(walls);
        for (var i = 0; i < bodies.length; i++) for (var j = i + 1; j < all.length; j++) {
          var A = bodies[i], B = all[j];
          if (A.sleep && (B.sleep || B.stat)) continue;
          if (!B.stat && Math.hypot(A.x - B.x, A.y - B.y) > Math.hypot(A.hw, A.hh) + Math.hypot(B.hw, B.hh)) continue;
          var cs = collide(A, B);
          if (!cs.length) continue;
          if (A.sleep && Math.hypot(B.vx, B.vy) > 60) wake(A);
          if (B.sleep && Math.hypot(A.vx, A.vy) > 60) wake(B);
          cs.forEach(function (k) {
            k.A = A; k.B = B; k.jn = 0; k.jt = 0;
            k.ax = k.px - A.x; k.ay = k.py - A.y; k.bx = k.px - B.x; k.by = k.py - B.y;
            var ra = k.ax * k.ny - k.ay * k.nx, rb = k.bx * k.ny - k.by * k.nx, ta = k.ax * k.nx + k.ay * k.ny, tb = k.bx * k.nx + k.by * k.ny;
            k.mn = 1 / Math.max(1e-9, im(A) + im(B) + ra * ra * iI(A) + rb * rb * iI(B));
            k.mt = 1 / Math.max(1e-9, im(A) + im(B) + ta * ta * iI(A) + tb * tb * iI(B));
            var vn = relV(k)[0];
            k.bounce = vn < -40 ? -Math.max(A.rest, B.rest) * vn : 0; k.mu = Math.min(A.fr, B.fr);
            contacts.push(k);
          });
        }
        for (var it = 0; it < 10; it++) contacts.forEach(function (k) {
          var v = relV(k), jn = (k.bounce - v[0]) * k.mn, old = k.jn; k.jn = Math.max(0, old + jn); jn = k.jn - old;
          apply(k, k.nx * jn, k.ny * jn);
          v = relV(k); var jt = -v[1] * k.mt, oldt = k.jt, lim = k.mu * k.jn; k.jt = ctx.clamp(oldt + jt, -lim, lim); jt = k.jt - oldt;
          apply(k, -k.ny * jt, k.nx * jt);
        });
        bodies.forEach(function (b) {
          if (b.sleep) return;
          b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.w * dt;
          var e = b.vx * b.vx + b.vy * b.vy + b.w * b.w * 900;
          b.still = (held && held.b === b) || e >= 400 ? 0 : b.still + dt;
          if (b.still > .6) { b.sleep = true; b.vx = b.vy = b.w = 0; } // sleeping: resting prints cost nothing
        });
        contacts.forEach(function (k) {
          var A = k.A, B = k.B, sum = im(A) + im(B); if (!sum) return;
          var corr = Math.max(k.d - .5, 0) * .4 / sum;
          A.x -= k.nx * corr * im(A); A.y -= k.ny * corr * im(A); B.x += k.nx * corr * im(B); B.y += k.ny * corr * im(B);
        });
      }
      function render() {
        bodies.forEach(function (b) {
          b.el.style.transform = 'translate3d(' + (b.x - b.hw).toFixed(1) + 'px,' + (b.y - b.hh).toFixed(1) + 'px,0) rotate(' + b.a.toFixed(4) + 'rad)';
        });
      }

      /* input: grab + throw (pointer), keyboard nudges, shake */
      var pv = { x: 0, last: 0, t: 0 }, scrollV = 0, outP = 0;
      function local(e) { var r = tray.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
      function bodyOf(t) { for (var i = 0; i < bodies.length; i++) if (bodies[i].el === t || bodies[i].el.contains(t)) return bodies[i]; return null; }
      tray.addEventListener('pointerdown', function (e) {
        if (R || (e.pointerType === 'mouse' && e.button !== 0)) return;
        var b = bodyOf(e.target); if (!b) return;
        e.preventDefault(); b.el.focus({ preventScroll: true });
        var p = local(e), c = Math.cos(-b.a), s = Math.sin(-b.a), dx = p[0] - b.x, dy = p[1] - b.y;
        held = { b: b, lx: dx * c - dy * s, ly: dx * s + dy * c, tx: p[0], ty: p[1], id: e.pointerId };
        wake(b); tray.classList.add('dragging'); ctx.audio.click(.25);
        tray.appendChild(b.el); // lift to the top of the pile
        try { b.el.setPointerCapture(e.pointerId); } catch (err) {}
      });
      tray.addEventListener('pointermove', function (e) {
        var p = local(e), now = performance.now();
        if (pv.t) pv.x = ctx.lerp(pv.x, (p[0] - pv.last) / Math.max(1, now - pv.t) * 16.7, .3);
        pv.last = p[0]; pv.t = now;
        if (held && e.pointerId === held.id) { held.tx = p[0]; held.ty = p[1]; }
      });
      function release(e) { if (held && (!e || e.pointerId === held.id)) { held = null; tray.classList.remove('dragging'); } }
      tray.addEventListener('pointerup', release); tray.addEventListener('pointercancel', release); tray.addEventListener('lostpointercapture', release);
      tray.addEventListener('keydown', function (e) {
        if (R) return;
        var b = bodyOf(e.target), d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (!b || !d) return;
        e.preventDefault(); wake(b);
        b.vx += d[0] * 420; b.vy += d[1] ? d[1] * 300 - 200 : -260; b.w += d[0] * 3;
      });
      function shake() {
        if (R || !bodies.length) return;
        bodies.forEach(function (b) { wake(b); b.vy -= 500 + Math.random() * 500; b.vx += (Math.random() - .5) * 600; b.w += (Math.random() - .5) * 8; });
        ctx.audio.whoosh(.5);
      }
      if (R) shakeB.style.display = 'none'; else shakeB.addEventListener('click', shake);
      ctx.palette.add({ id: 'journal-shake', title: 'Shake the contact sheet', group: 'Actions', keywords: 'journal prints physics throw', run: function () {
        root.querySelector('#jr-sheet').scrollIntoView({ behavior: R ? 'auto' : 'smooth', block: 'center' }); setTimeout(shake, R ? 0 : 700);
      } });

      var acc = 0, ro = null;
      var lp = ctx.loop(function (dt) {
        // gravity: base eases from 1.4 to .5 as the tray scrolls out, plus scroll velocity × .1; x from pointer velocity × .001
        g.y = ctx.lerp(1.4, .5, ctx.clamp(outP / .6, 0, 1)) + scrollV * 50 * .1;
        g.x = ctx.clamp(pv.x * .001, -.5, .5); pv.x *= .9;
        if (Math.abs(g.y - gWake) > .25 || Math.abs(g.x) > .05) { gWake = g.y; bodies.forEach(wake); }
        if (!held && bodies.every(function (b) { return b.sleep; })) return; // all asleep: skip the solver
        acc = Math.min(acc + dt, 1 / 30);   // never more than 33 ms of simulation per frame
        var h = 1 / 120;
        while (acc >= h) { step(h); acc -= h; }
        render();
      });
      build();
      var lastW = W;

      return {
        enter: function () { entered = true; head.classList.add('is-in'); head.querySelectorAll('.rise').forEach(function (n) { n.classList.add('is-in'); }); watchPanels(); },
        start: function () {
          watchPanels();
          if (!ro && 'ResizeObserver' in window) {
            ro = new ResizeObserver(function () { fitWalls(); if (Math.abs(W - lastW) > 80) { lastW = W; build(); } });
            ro.observe(tray);
          }
          if (!R) { acc = 0; bodies.forEach(wake); lp.start(); }
        },
        stop: function () { lp.stop(); release(); if (ro) { ro.disconnect(); ro = null; } },
        scroll: function (m) {
          scrollV = m.vel;
          var r = tray.getBoundingClientRect(); outP = ctx.clamp(-r.top / Math.max(1, r.height), 0, 1);
        }
      };
    }
  });
})();
