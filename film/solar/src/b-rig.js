
  /* ---------- the rig: one character, many costumes; lit from one side, standing on a contact shadow ---------- */
  var BASE = { lh: [-60, -150], rh: [60, -150], lf: [-26, 0], rf: [26, 0], hip: 0, lean: 0, tilt: 0, look: [0, 0], eyes: 'dot', brow: 0, mouth: 'smile', jump: 0, front: 0 };
  function poseAt(t, keys) {
    var cur = Object.assign({}, BASE), tgt = cur;
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i]; if (t < k[0]) break;
      var nt = Object.assign({}, tgt, k[1]), e = eio(seg(t, k[0], k[0] + (k[2] || .32)));
      var out = {}; for (var key in nt) out[key] = cur[key] === undefined ? nt[key] : mix(cur[key], nt[key], e);
      cur = out; tgt = nt;
    }
    return cur;
  }
  function ik(r, tg, l1, l2, side, down) {
    var dx = tg[0] - r[0], dy = tg[1] - r[1], d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - .5), a = Math.atan2(dy, dx);
    var c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), b = Math.acos(c);
    var e1 = [r[0] + l1 * Math.cos(a + b), r[1] + l1 * Math.sin(a + b)], e2 = [r[0] + l1 * Math.cos(a - b), r[1] + l1 * Math.sin(a - b)];
    var el = down ? (e1[1] > e2[1] ? e1 : e2) : ((e1[0] - r[0]) * side > (e2[0] - r[0]) * side ? e1 : e2);
    var k = Math.min(1, (l1 + l2) / Math.hypot(dx, dy));
    return [el, k < 1 ? [r[0] + dx * k, r[1] + dy * k] : tg];
  }
  function limb(g, pts, w, col, hi) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.lineCap = g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = w + 9; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke();
    if (hi) { g.save(); g.translate(-w * .18, -w * .12); g.strokeStyle = hi; g.lineWidth = w * .28; g.stroke(); g.restore(); }
  }
  function lighten(hex, k) { var n = parseInt(hex.slice(1), 16), r = n >> 16, gg = n >> 8 & 255, b = n & 255; r = Math.round(r + (255 - r) * k); gg = Math.round(gg + (255 - gg) * k); b = Math.round(b + (255 - b) * k); return 'rgb(' + r + ',' + gg + ',' + b + ')'; }
  function guy(g, x, y, s, P, o, t) {
    o = o || {}; var col = o.col || HOOD, sh = o.shade || HOODS, seed = o.seed || 1, bt = Math.floor(t * 8), hi = o.rim === false ? null : lighten(col, .38);
    function j(i) { return (hash(bt * 13.1 + i * 3.7 + seed * 17.3) - .5) * 2.4; }
    var br = Math.sin(t * 2.2 + seed) * 2.2, sway = Math.sin(t * 1.3 + seed * 2) * 3;
    /* contact shadow, squashes as he jumps */
    if (!o.noShadow) { var jh = clamp((P.jump || 0) / 200, 0, 1); g.save(); g.translate(x, y + 8); g.scale(s, s); g.beginPath(); g.ellipse(0, 0, 92 * (1 - jh * .4), 16 * (1 - jh * .4), 0, 0, 6.283); g.fillStyle = 'rgba(8,6,20,' + (.32 * (1 - jh * .5)) + ')'; g.fill(); g.restore(); }
    g.save(); g.translate(x, y - (P.jump || 0)); g.scale(s * (o.flip ? -1 : 1), s);
    var hip = [0, -150 + (P.hip || 0)], lean = P.lean || 0;
    function R(px, py) { return [hip[0] + px * Math.cos(lean) - py * Math.sin(lean), hip[1] + px * Math.sin(lean) + py * Math.cos(lean)]; }
    var shL = R(-40, -106 - br * .3), shR = R(40, -106 - br * .3), neck = R(0, -122 - br * .5);
    var legC = o.legs || HEAD;
    [[-1, P.lf], [1, P.rf]].forEach(function (L, i) {
      var root = [hip[0] + L[0] * 20, hip[1]], tg = [L[1][0] + j(i), L[1][1]], r = ik(root, tg, 80, 78, L[0], false);
      limb(g, [root, [r[0][0] + j(i + 4), r[0][1] + j(i + 6)], r[1]], 13, legC);
      g.save(); g.translate(r[1][0] + L[0] * 7, r[1][1] + 2); g.beginPath(); g.ellipse(0, 0, 19, 10, 0, 0, 6.283); fillStroke(g, o.shoe || INK, 0); g.restore();
    });
    /* torso */
    g.save(); g.translate(hip[0], hip[1]); g.rotate(lean);
    g.beginPath(); g.moveTo(-47 + j(1) * .5, 6); g.quadraticCurveTo(-55, -58, -43 + j(2) * .5, -112 - br * .3); g.quadraticCurveTo(0, -130 - br * .4, 43, -112 - br * .3); g.quadraticCurveTo(55, -58, 47, 6); g.quadraticCurveTo(0, 13, -47, 6); g.closePath();
    fillStroke(g, col, 0); g.save(); g.clip(); g.fillStyle = sh; g.fillRect(16, -140, 60, 160);
    if (hi) { g.fillStyle = hi; g.globalAlpha = .55; g.fillRect(-60, -140, 16, 160); g.globalAlpha = 1; }
    if (o.vest) { g.fillStyle = YEL; g.fillRect(-60, -70, 140, 16); g.fillRect(-60, -30, 140, 16); }
    if (o.coat) { g.fillStyle = o.coat; g.fillRect(-70, -140, 50, 160); g.fillRect(20, -140, 50, 160); g.fillStyle = '#f4ede0'; g.beginPath(); g.moveTo(-20, -118); g.lineTo(0, -60); g.lineTo(20, -118); g.closePath(); g.fill(); }
    g.restore();
    fillStroke(g, null, 5);
    if (!o.coat) { g.beginPath(); g.moveTo(-28, -50); g.lineTo(28, -50); g.lineTo(22, -18); g.lineTo(-22, -18); g.closePath(); fillStroke(g, sh, 4); }
    if (o.tie) { g.beginPath(); g.moveTo(0, -116); g.lineTo(-9, -96); g.lineTo(0, -50); g.lineTo(9, -96); g.closePath(); fillStroke(g, o.tie, 3.5); }
    else if (!o.coat) { g.strokeStyle = INK; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-9, -110); g.lineTo(-11, -84); g.moveTo(9, -110); g.lineTo(11, -84); g.stroke(); }
    if (!o.coat) { g.beginPath(); g.ellipse(0, -117 - br * .4, 32, 12, 0, 0, 6.283); fillStroke(g, sh, 4.5); }
    if (o.badge) { g.save(); g.translate(-22, -80); g.rotate(-.1); rr(g, -18, -11, 36, 22, 4); fillStroke(g, CREAM, 3); g.restore(); }
    g.restore();
    function arms() {
      [[-1, P.lh, shL], [1, P.rh, shR]].forEach(function (A, i) {
        var tg = [A[1][0] + sway * (i ? -.3 : .3) + j(i + 9), A[1][1] + j(i + 11)], r = ik(A[2], tg, 70, 66, A[0], !!P.elDown);
        limb(g, [A[2], [r[0][0] + j(i + 13), r[0][1]], r[1]], 15, o.coat || col, i ? null : hi);
        circ(g, r[1][0], r[1][1], 12.5); fillStroke(g, HEAD, 4.5);
        if (o.hold && o.hold[i]) { g.save(); g.translate(r[1][0], r[1][1]); o.hold[i](g); g.restore(); }
      });
    }
    if (!P.front) arms();
    var tilt = lean + (P.tilt || 0), hc = [neck[0] + Math.sin(tilt) * 56, neck[1] - Math.cos(tilt) * 56];
    g.save(); g.translate(hc[0] + j(20) * .5, hc[1]); g.rotate(tilt);
    if (o.hair === 'bun') { circ(g, 0, -62, 22); fillStroke(g, '#c9c3cf', 4.5); }
    if (o.hair === 'zap') { for (var zi = 0; zi < 9; zi++) { var za = Math.PI * (1.08 + zi * .105), zl = 86 + hash(zi + bt) * 22; g.beginPath(); g.moveTo(Math.cos(za) * 40, Math.sin(za) * 40); g.lineTo(Math.cos(za + .06) * zl, Math.sin(za + .06) * zl); g.lineTo(Math.cos(za + .12) * 40, Math.sin(za + .12) * 40); fillStroke(g, '#3a3047', 4); } }
    circ(g, 0, 0, 56); fillStroke(g, o.skin2 || HEADS, 0);
    g.save(); circ(g, 0, 0, 56); g.clip(); circ(g, -9, -8, 54); g.fillStyle = o.skin || HEAD; g.fill();
    if (o.soot) { g.fillStyle = 'rgba(40,30,40,.55)'; for (var si = 0; si < 7; si++) { circ(g, -30 + hash(si) * 60, -30 + hash(si + 9) * 60, 10 + hash(si + 3) * 12); g.fill(); } }
    /* rim light on the lit side */
    g.globalAlpha = .7; g.beginPath(); g.arc(0, 0, 50, Math.PI * 1.05, Math.PI * 1.45); g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.lineCap = 'round'; g.stroke(); g.globalAlpha = 1;
    g.restore();
    circ(g, 0, 0, 56); fillStroke(g, null, 5);
    if (o.hair === 'bun') { g.beginPath(); g.arc(0, 0, 56, Math.PI * 1.05, Math.PI * 1.95); g.lineTo(30, -30); g.quadraticCurveTo(0, -44, -30, -30); g.closePath(); fillStroke(g, '#c9c3cf', 4.5); }
    if (o.sideburns) { [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(sd * 52, -18); g.quadraticCurveTo(sd * 60, 22, sd * 36, 38); g.lineTo(sd * 30, 18); g.quadraticCurveTo(sd * 40, 0, sd * 40, -18); g.closePath(); fillStroke(g, '#6b4a3a', 4); }); }
    face(g, P, t, seed, o);
    hat(g, o);
    if (o.glasses) { g.strokeStyle = INK; g.lineWidth = 4; circ(g, -20, -4, 15); g.stroke(); circ(g, 20, -4, 15); g.stroke(); g.beginPath(); g.moveTo(-5, -5); g.lineTo(5, -5); g.stroke(); }
    if (o.sunglasses) { g.beginPath(); g.roundRect(-40, -18, 34, 24, 8); g.roundRect(6, -18, 34, 24, 8); fillStroke(g, INK, 3); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-34, -14, 8, 6); g.fillRect(12, -14, 8, 6); }
    if (P.sweat) { var sk = (t * 1.4) % 1; g.save(); g.globalAlpha = 1 - sk; g.translate(48, -22 + sk * 30); g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(10, 4, 0, 8); g.quadraticCurveTo(-10, 4, 0, -12); fillStroke(g, '#9fe0ff', 3); g.restore(); }
    g.restore();
    if (P.front) arms();
    g.restore();
  }
  function face(g, P, t, seed, o) {
    var lx = (P.look ? P.look[0] : 0) * 7, ly = (P.look ? P.look[1] : 0) * 6;
    var blink = ((t + seed * 1.37) % 3.7) < .11, e = blink && P.eyes !== 'x' && P.eyes !== 'spiral' ? 'shut' : P.eyes;
    g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = 'round';
    [-1, 1].forEach(function (sd) {
      var ex = sd * 19 + lx, ey = -4 + ly;
      if (e === 'dot') { g.beginPath(); g.ellipse(ex, ey, 7.5, 10, 0, 0, 6.283); g.fill(); circ(g, ex - 2.5, ey - 4, 2.4); g.fillStyle = '#fff'; g.fill(); g.fillStyle = INK; }
      else if (e === 'wide') { g.beginPath(); g.ellipse(ex, ey, 10.5, 14, 0, 0, 6.283); g.fill(); circ(g, ex - 3.5, ey - 5, 3.4); g.fillStyle = '#fff'; g.fill(); g.fillStyle = INK; }
      else if (e === 'tiny') { circ(g, ex, ey, 4.5); g.fill(); }
      else if (e === 'happy') { g.lineWidth = 5.5; g.beginPath(); g.arc(ex, ey + 5, 9, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      else if (e === 'x') { g.lineWidth = 5; g.beginPath(); g.moveTo(ex - 7, ey - 7); g.lineTo(ex + 7, ey + 7); g.moveTo(ex + 7, ey - 7); g.lineTo(ex - 7, ey + 7); g.stroke(); }
      else if (e === 'spiral') { g.lineWidth = 3.5; g.beginPath(); for (var k = 0; k < 24; k++) { var a = k * .55 + t * 8 * sd, r = k * .45; if (k) g.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r); else g.moveTo(ex, ey); } g.stroke(); }
      else if (e === 'squint') { g.lineWidth = 5; g.beginPath(); g.moveTo(ex + 8 * sd, ey - 7); g.lineTo(ex - 6 * sd, ey); g.lineTo(ex + 8 * sd, ey + 7); g.stroke(); }
      else if (e === 'side') { g.beginPath(); g.ellipse(ex + 4, ey, 7.5, 10, 0, 0, 6.283); g.fill(); g.lineWidth = 4.5; g.beginPath(); g.moveTo(ex - 11, ey - 7); g.lineTo(ex + 11, ey - 7); g.stroke(); }
      else { g.lineWidth = 5; g.beginPath(); g.moveTo(ex - 8, ey + 1); g.lineTo(ex + 8, ey + 1); g.stroke(); }
      var b = P.brow || 0, by = -27 + ly * .5 - (b === 1 ? 7 : 0), inner = b === -1 ? 6 : b === 2 ? -6 : 0;
      g.lineWidth = 5; g.beginPath(); g.moveTo(sd * 8 + lx, by + inner); g.lineTo(sd * 30 + lx, by); g.stroke();
    });
    var m = P.mouth, my = 24 + ly * .5, mx = lx * .6;
    g.lineWidth = 5;
    if (m === 'smile') { g.beginPath(); g.arc(mx, my - 8, 13, Math.PI * .2, Math.PI * .8); g.stroke(); }
    else if (m === 'grin') { g.beginPath(); g.moveTo(mx - 17, my - 4); g.quadraticCurveTo(mx, my - 8, mx + 17, my - 4); g.quadraticCurveTo(mx, my + 22, mx - 17, my - 4); g.fill(); g.save(); g.clip(); circ(g, mx, my + 14, 9); g.fillStyle = '#ff7a8a'; g.fill(); g.restore(); }
    else if (m === 'o') { g.beginPath(); g.ellipse(mx, my, 6, 8, 0, 0, 6.283); g.fill(); }
    else if (m === 'O') { g.beginPath(); g.ellipse(mx, my + 2, 11, 15, 0, 0, 6.283); g.fill(); }
    else if (m === 'frown') { g.beginPath(); g.arc(mx, my + 10, 12, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
    else if (m === 'wavy') { g.beginPath(); g.moveTo(mx - 15, my); for (var i = 1; i <= 6; i++) g.lineTo(mx - 15 + i * 5, my + (i % 2 ? -4 : 4)); g.stroke(); }
    else if (m === 'talk') { var op = .5 + .5 * Math.abs(Math.sin(t * 15)); g.beginPath(); g.ellipse(mx, my, 9, 3 + op * 8, 0, 0, 6.283); g.fill(); }
    else if (m === 'smirk') { g.beginPath(); g.moveTo(mx - 12, my - 2); g.quadraticCurveTo(mx + 2, my + 4, mx + 14, my - 7); g.stroke(); }
    else if (m === 'teeth') { rr(g, mx - 18, my - 8, 36, 18, 6); fillStroke(g, '#fff', 4); g.beginPath(); g.moveTo(mx - 18, my + 1); g.lineTo(mx + 18, my + 1); g.moveTo(mx - 6, my - 8); g.lineTo(mx - 6, my + 10); g.moveTo(mx + 6, my - 8); g.lineTo(mx + 6, my + 10); g.lineWidth = 2.5; g.stroke(); }
    else { g.beginPath(); g.moveTo(mx - 10, my); g.lineTo(mx + 10, my); g.stroke(); }
  }
  function hat(g, o) {
    if (o.hat === 'hard') { g.beginPath(); g.arc(0, -22, 52, Math.PI, 0); g.closePath(); fillStroke(g, YEL, 5); g.beginPath(); g.ellipse(0, -22, 66, 9, 0, 0, 6.283); fillStroke(g, YEL, 5); g.beginPath(); g.moveTo(0, -74); g.lineTo(0, -30); g.lineWidth = 4; g.stroke(); }
    else if (o.hat === 'cap') { g.beginPath(); g.arc(0, -16, 55, Math.PI * 1.02, -.02); g.closePath(); fillStroke(g, o.capCol || GREEN, 5); g.beginPath(); g.moveTo(30, -18); g.quadraticCurveTo(80, -22, 92, -8); g.lineTo(34, -6); g.closePath(); fillStroke(g, o.capCol || GREEN, 5); }
    else if (o.hat === 'sun') { g.beginPath(); g.ellipse(0, -36, 92, 16, 0, 0, 6.283); fillStroke(g, '#e8c57a', 5); g.beginPath(); g.arc(0, -36, 46, Math.PI, 0); g.closePath(); fillStroke(g, '#e8c57a', 5); g.fillStyle = HOOD; g.fillRect(-44, -48, 88, 10); }
    else if (o.hat === 'top') { rr(g, -40, -150, 80, 110, 6); fillStroke(g, '#2b2433', 5); g.fillStyle = '#8a3b3b'; g.fillRect(-38, -62, 76, 14); g.beginPath(); g.ellipse(0, -42, 70, 12, 0, 0, 6.283); fillStroke(g, '#2b2433', 5); }
    else if (o.hat === 'straw') { g.beginPath(); g.ellipse(0, -40, 96, 18, 0, 0, 6.283); fillStroke(g, '#e8c57a', 5); g.beginPath(); g.arc(0, -40, 44, Math.PI, 0); g.closePath(); fillStroke(g, '#e8c57a', 5); g.fillStyle = '#5b8f4a'; g.fillRect(-42, -52, 84, 10); }
    else if (o.hat === 'beanie') { g.beginPath(); g.arc(0, -14, 56, Math.PI, 0); g.closePath(); fillStroke(g, o.capCol || BLUE, 5); rr(g, -60, -24, 120, 20, 8); fillStroke(g, o.capCol || BLUE, 5); circ(g, 0, -74, 12); fillStroke(g, CREAM, 4); }
  }
  /* the cast */
  var YOU = { col: HOOD, shade: HOODS, seed: 1 };
  var CARR = { col: '#3b3448', shade: '#2b2533', coat: '#3b3448', hat: 'top', sideburns: true, seed: 6, legs: '#2b2533' };
  var OPER = { col: '#6b5a8a', shade: '#55476f', tie: RED, seed: 9 };
  var FARM = { col: '#3d7bff', shade: '#2f5fc4', hat: 'straw', seed: 5 };
  var ENG = { col: '#ffc83d', shade: '#e0a92a', hat: 'hard', glasses: true, seed: 3, badge: true };
  var PIZZA = { col: RED, shade: '#c9322a', hat: 'cap', capCol: CREAM, seed: 8 };
