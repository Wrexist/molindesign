/* physics-on-flat-art — flat cut-outs driven by a small 2D rigid-body solver (stands in for Matter.js). */
Lib.register('physics-on-flat-art', {
  hint: 'Grab a cut-out and throw it. Scroll fast up or down to tilt gravity',
  notes: [
    'Cut-outs <code>restitution .4, friction .5</code>; static walls <code>restitution .3</code>, rebuilt (not scaled) when the stage resizes',
    'Gravity per frame <code>g.y = map(outProgress, 0→.6, 1.4→.5) + scrollVelocity × .1</code> (×.9 on mobile) and <code>g.x = pointerVx × .001</code>',
    'Grab with a soft constraint <code>{ stiffness .1, damping .01, length 20 }</code>; only the pieces take the drag so touch scroll still works',
    'Clamp <code>dt ≤ 33 ms</code>, let bodies sleep and pause off-screen: that is what keeps 10–20 bodies cheap',
    'Restitution .2–.4 reads as cardboard, above .7 as rubber. Chapters framed as tracks: <code>NN:MM</code> timecode plus one “Next track” button'
  ],
  simplified: 'A ~130-line impulse solver (circles and boxes, SAT, sleeping) replaces Matter.js. Walls sit flush with the stage instead of 100 px outside it, and scroll velocity is the page’s smoothed v (−1..1) mapped to ≈ ±50 px/frame instead of Lenis’ own value.',
  css: `
.d-physics-on-flat-art { background: radial-gradient(120% 80% at 50% 110%, #1a1a1a, #000 60%); user-select: none; -webkit-user-select: none; }
.d-physics-on-flat-art.dragging { touch-action: none; }
.d-physics-on-flat-art .pf-head { position: absolute; left: 24px; top: 22px; right: 24px; display: flex; justify-content: space-between; gap: 16px; z-index: 1; pointer-events: none; }
.d-physics-on-flat-art .pf-head .label { color: rgb(255 255 255 / .45); margin: 0 0 8px; white-space: nowrap; }
.d-physics-on-flat-art.narrow .pf-side { display: none; }
.d-physics-on-flat-art.narrow .pf-ctl { top: 96px; }
.d-physics-on-flat-art.narrow .pf-read { top: 144px; }
.d-physics-on-flat-art .pf-title { font-family: Archivo, sans-serif; font-stretch: 125%; font-size: clamp(24px, 4.2vw, 46px); line-height: 1; letter-spacing: -.02em; margin: 0; color: rgb(255 255 255 / .9); perspective: 400px; }
.d-physics-on-flat-art .pf-title span { display: inline-block; transform-origin: 50% 100%; }
.d-physics-on-flat-art .pf-title span.in { animation: pf-in 1s cubic-bezier(.34, 1.56, .64, 1) both; }
@keyframes pf-in { 0% { transform: translateY(80px) scale(0) rotateX(-50deg); opacity: 0; } 60% { opacity: 1; } 100% { transform: none; opacity: 1; } }
.d-physics-on-flat-art .pf-tc { text-align: right; }
.d-physics-on-flat-art .pf-tc b { display: block; font-family: Archivo, sans-serif; font-stretch: 125%; font-weight: 400; font-size: clamp(22px, 3vw, 34px); line-height: 1; color: #fff; font-variant-numeric: tabular-nums; }
.d-physics-on-flat-art .pf-tc b i { font-style: normal; color: #f97316; }
.d-physics-on-flat-art .pf-ctl { position: absolute; z-index: 6; left: 20px; top: 104px; display: flex; gap: 6px; flex-wrap: wrap; }
.d-physics-on-flat-art .pf-ctl button { padding: 7px 11px; min-height: 34px; border-radius: 999px; border: 1px solid rgb(255 255 255 / .18); color: rgb(255 255 255 / .75); background: rgb(0 0 0 / .4); backdrop-filter: blur(6px); transition: color .2s, border-color .2s, background .2s; }
.d-physics-on-flat-art .pf-ctl button:hover { color: #fff; border-color: rgb(255 255 255 / .5); }
.d-physics-on-flat-art .pf-ctl button[aria-pressed="true"] { background: #fff; color: #000; border-color: #fff; }
.d-physics-on-flat-art .pf-ctl .next { color: #000; background: #f97316; border-color: #f97316; }
.d-physics-on-flat-art .pf-ctl .next:hover { color: #000; background: #fb923c; }
.d-physics-on-flat-art .pf-read { position: absolute; left: 24px; top: 152px; z-index: 1; color: rgb(255 255 255 / .45); pointer-events: none; margin: 0; }
.d-physics-on-flat-art .pf-read b { color: rgb(255 255 255 / .85); font-weight: 500; }
.d-physics-on-flat-art .pf-piece { position: absolute; left: 0; top: 0; z-index: 3; touch-action: none; cursor: grab; will-change: transform; box-shadow: 6px 8px 0 rgb(0 0 0 / .55); }
.d-physics-on-flat-art.dragging .pf-piece { cursor: grabbing; }
.d-physics-on-flat-art.reduced .pf-piece { cursor: default; }
.d-physics-on-flat-art .pf-c { border-radius: 50%; }
.d-physics-on-flat-art .k-pon { background: radial-gradient(circle at 36% 42%, #000 0 6%, transparent 6.5%), radial-gradient(circle at 64% 42%, #000 0 6%, transparent 6.5%), radial-gradient(circle at 50% 64%, #000 0 4%, transparent 4.5%), #f97316; }
.d-physics-on-flat-art .k-rec { background: radial-gradient(circle, #ededed 0 5%, #f97316 5.5% 26%, #111 26.5% 30%, #1d1d1d 30.5% 40%, #111 40.5% 44%, #1d1d1d 44.5% 58%, #111 58.5% 62%, #1d1d1d 62.5% 100%); box-shadow: 6px 8px 0 rgb(0 0 0 / .55), inset 0 0 0 1px rgb(255 255 255 / .12); }
.d-physics-on-flat-art .k-dot { background: radial-gradient(circle, #f97316 0 30%, #ededed 31%); }
.d-physics-on-flat-art .k-cover { background: #ededed; color: #000; padding: .9em 1em; display: flex; flex-direction: column; justify-content: space-between; font: 500 10px/1.2 Archivo, sans-serif; letter-spacing: .2em; text-transform: uppercase; }
.d-physics-on-flat-art .k-cover b { font-stretch: 125%; font-size: 2.3em; letter-spacing: -.02em; line-height: .9; font-weight: 700; }
.d-physics-on-flat-art .k-stripe { background: repeating-linear-gradient(-45deg, #ededed 0 6px, #000 6px 14px); border: 2px solid #ededed; }
.d-physics-on-flat-art .k-dots { background: radial-gradient(#000 28%, transparent 30%) 0 0 / 14px 14px, #f97316; }
.d-physics-on-flat-art .k-ticket { background: #2a2a2a; color: rgb(255 255 255 / .85); display: grid; place-items: center; font: 500 10px Archivo, sans-serif; letter-spacing: .2em; border: 1px dashed rgb(255 255 255 / .35); outline: 4px solid #2a2a2a; }
.d-physics-on-flat-art .k-bar { background: rgb(255 255 255 / .8); }
.d-physics-on-flat-art canvas.pf-dbg { position: absolute; inset: 0; z-index: 4; pointer-events: none; opacity: .3; }
`,
  mount(stage, ctx) {
    var el = ctx.el, R = ctx.reduced;
    var mobile = !ctx.fine;
    var TRACKS = [
      { name: 'Cardboard', rest: .4, fr: .5 },
      { name: 'Rubber', rest: .8, fr: .3 },
      { name: 'Felt', rest: .12, fr: .9 }
    ];
    var track = 0;
    var head = el('div', 'pf-head');
    head.innerHTML = '<div><p class="label">Flat Art · Vol. I<span class="pf-side"> · <span class="accent">Side A</span></span></p><h4 class="pf-title"><span></span></h4></div>' +
      '<div class="pf-tc"><p class="label">Track : Next</p><b aria-live="polite"></b></div>';
    var title = head.querySelector('.pf-title span'), tc = head.querySelector('.pf-tc b');
    var ctl = el('div', 'pf-ctl');
    var tossB = el('button', 'label', 'Toss'), dbgB = el('button', 'label', 'Bodies'), nextB = el('button', 'label next', 'Next track ▸');
    [tossB, dbgB, nextB].forEach(function (b) { b.type = 'button'; ctl.appendChild(b); });
    dbgB.setAttribute('aria-pressed', 'false');
    var read = el('p', 'pf-read label');
    var dbg = el('canvas', 'pf-dbg'); dbg.hidden = true; dbg.setAttribute('aria-hidden', 'true');
    stage.append(head, dbg, ctl, read);
    if (R) { stage.classList.add('reduced'); tossB.hidden = true; }

    /* ---------- pieces ---------- */
    var KINDS = [
      ['c', 'k-rec', 62], ['b', 'k-cover', 118, 118, '<span>Vol. I</span><b>Flat<br>Art</b>'], ['c', 'k-pon', 46],
      ['b', 'k-stripe', 150, 54], ['b', 'k-dots', 92, 92], ['c', 'k-dot', 30], ['b', 'k-ticket', 120, 46, 'SIDE A'],
      ['c', 'k-pon', 34], ['b', 'k-bar', 190, 16], ['c', 'k-rec', 44], ['b', 'k-dots', 64, 120], ['c', 'k-dot', 24]
    ];
    var W = 0, H = 0, S = 1, bodies = [], walls = [];
    function makeBody(k, x, y) {
      var circle = k[0] === 'c', s = S;
      var b = { x: x, y: y, a: (Math.random() - .5) * .8, vx: 0, vy: 0, w: 0, circle: circle, sleep: false, still: 0, stat: false };
      if (circle) { b.r = k[2] * s; b.m = Math.PI * b.r * b.r; b.I = b.m * b.r * b.r / 2; }
      else { b.hw = k[2] * s / 2; b.hh = k[3] * s / 2; b.m = 4 * b.hw * b.hh; b.I = b.m * (b.hw * b.hw + b.hh * b.hh) / 3; }
      b.im = 1 / b.m; b.iI = 1 / b.I; b.rest = TRACKS[track].rest; b.fr = TRACKS[track].fr;
      var d = el('div', 'pf-piece ' + (circle ? 'pf-c ' : '') + k[1], k[4] || '');
      d.style.width = (circle ? b.r * 2 : b.hw * 2) + 'px'; d.style.height = (circle ? b.r * 2 : b.hh * 2) + 'px';
      if (k[1] === 'k-cover') d.style.fontSize = Math.max(7, 10 * s) + 'px';
      d.setAttribute('aria-hidden', 'true'); d.dataset.cursor = 'Grab';
      b.el = d; stage.appendChild(d);
      return b;
    }
    function staticBox(x, y, hw, hh) { return { x: x, y: y, a: 0, vx: 0, vy: 0, w: 0, hw: hw, hh: hh, im: 0, iI: 0, stat: true, rest: .3, fr: .5 }; }
    function fitWalls() {
      var r = stage.getBoundingClientRect(); W = r.width; H = r.height;
      stage.classList.toggle('narrow', W < 480);
      dbg.width = W; dbg.height = H;
      // rebuild instead of scaling static bodies (skill rule); ground top = H, sides flush with the stage
      walls = [staticBox(W / 2, H + 50, W + 400, 50), staticBox(-50, -2 * H, 50, 5 * H), staticBox(W + 50, -2 * H, 50, 5 * H)];
      bodies.forEach(function (b) { b.x = ctx.clamp(b.x, 10, W - 10); if (b.y > H) b.y = H - 20; b.sleep = false; });
    }
    function build() {
      bodies.forEach(function (b) { b.el.remove(); });
      bodies = []; fitWalls();
      S = ctx.clamp(Math.min(W / 900, H / 560), .55, 1.1);
      var n = W < 560 ? 7 : W < 900 ? 9 : 12;
      for (var i = 0; i < n; i++) {
        var b = makeBody(KINDS[i], W * (.15 + .7 * ((i * .618) % 1)), -80 - i * 70);
        bodies.push(b);
      }
      if (R) restLayout();
      render();
    }
    function restLayout() { // reduced motion: final resting layout on a skyline, no engine
      var sky = new Float32Array(Math.ceil(W) + 1), x = 16;
      bodies.forEach(function (b) {
        var w = b.circle ? b.r * 2 : b.hw * 2, h = b.circle ? b.r * 2 : b.hh * 2;
        if (x + w > W - 16) x = 16 + (x % 37);
        var top = 0;
        for (var i = Math.floor(x); i < Math.min(W, x + w); i++) top = Math.max(top, sky[i]);
        for (i = Math.floor(x); i < Math.min(W, x + w); i++) sky[i] = top + h + 4;
        b.x = x + w / 2; b.y = H - top - h / 2; b.a = 0; x += w + 8;
      });
    }

    /* ---------- solver ---------- */
    var g = { x: 0, y: 1.4 }, gWake = 1.4, held = null, contacts = [];
    function verts(b) {
      var c = Math.cos(b.a), s = Math.sin(b.a), out = [];
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (k) {
        var lx = k[0] * b.hw, ly = k[1] * b.hh; out.push([b.x + lx * c - ly * s, b.y + lx * s + ly * c]);
      });
      return out;
    }
    function inside(p, vs) {
      for (var i = 0; i < 4; i++) {
        var a = vs[i], b = vs[(i + 1) % 4];
        if ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) < -0.5) return false;
      }
      return true;
    }
    function collide(A, B) { // returns contacts with normal pointing A -> B
      var out = [];
      if (A.circle && B.circle) {
        var dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy), rr = A.r + B.r;
        if (d < rr && d > 1e-6) out.push({ nx: dx / d, ny: dy / d, d: rr - d, px: A.x + dx / d * A.r, py: A.y + dy / d * A.r });
        return out;
      }
      if (A.circle) { var r = collide(B, A); r.forEach(function (k) { k.nx = -k.nx; k.ny = -k.ny; }); return r; }
      var c = Math.cos(A.a), s = Math.sin(A.a);
      if (B.circle) {
        var lx = (B.x - A.x) * c + (B.y - A.y) * s, ly = -(B.x - A.x) * s + (B.y - A.y) * c;
        var qx = ctx.clamp(lx, -A.hw, A.hw), qy = ctx.clamp(ly, -A.hh, A.hh), nx, ny, depth;
        if (qx === lx && qy === ly) { // centre inside the box: push out through the nearest face
          var ex = A.hw - Math.abs(lx), ey = A.hh - Math.abs(ly);
          if (ex < ey) { nx = Math.sign(lx) || 1; ny = 0; depth = B.r + ex; qx = nx * A.hw; } else { nx = 0; ny = Math.sign(ly) || 1; depth = B.r + ey; qy = ny * A.hh; }
        } else {
          var ddx = lx - qx, ddy = ly - qy, dl = Math.hypot(ddx, ddy);
          if (dl >= B.r) return out; nx = ddx / dl; ny = ddy / dl; depth = B.r - dl;
        }
        out.push({ nx: nx * c - ny * s, ny: nx * s + ny * c, d: depth, px: A.x + qx * c - qy * s, py: A.y + qx * s + qy * c });
        return out;
      }
      var va = verts(A), vb = verts(B), best = 1e9, bn = null, axes = [];
      [A, B].forEach(function (k) { var cc = Math.cos(k.a), ss = Math.sin(k.a); axes.push([cc, ss], [-ss, cc]); });
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
      var nx2 = bn[0], ny2 = bn[1];
      if ((B.x - A.x) * nx2 + (B.y - A.y) * ny2 < 0) { nx2 = -nx2; ny2 = -ny2; }
      vb.forEach(function (p) { if (inside(p, va)) out.push({ nx: nx2, ny: ny2, d: best, px: p[0], py: p[1] }); });
      va.forEach(function (p) { if (inside(p, vb)) out.push({ nx: nx2, ny: ny2, d: best, px: p[0], py: p[1] }); });
      if (!out.length) out.push({ nx: nx2, ny: ny2, d: best, px: (A.x + B.x) / 2, py: (A.y + B.y) / 2 });
      return out.slice(0, 2);
    }
    function im(b) { return b.stat || b.sleep ? 0 : b.im; }
    function iI(b) { return b.stat || b.sleep ? 0 : b.iI; }
    function wake(b) { if (b.sleep) { b.sleep = false; b.still = 0; } }
    function step(dt) {
      var GA = 1000 * (mobile ? .9 : 1); // Matter gravity.scale .001 px/ms² = 1000 px/s²
      bodies.forEach(function (b) {
        if (b.sleep) return;
        b.vx += g.x * GA * dt; b.vy += g.y * GA * dt;
        b.vx *= .995; b.vy *= .995; b.w *= .995; // frictionAir
      });
      if (held) { // soft mouse constraint (mouse-joint style, stiffness .1 per iteration × 3)
        var b = held.b, c = Math.cos(b.a), s = Math.sin(b.a);
        var rx = held.lx * c - held.ly * s, ry = held.lx * s + held.ly * c;
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
        var bra = A.circle ? A.r : Math.hypot(A.hw, A.hh), brb = B.stat ? 1e9 : B.circle ? B.r : Math.hypot(B.hw, B.hh);
        if (!B.stat && Math.hypot(A.x - B.x, A.y - B.y) > bra + brb) continue;
        var cs = collide(A, B);
        if (!cs.length) continue;
        // waking: a moving body knocks a sleeping one awake
        if (A.sleep && Math.hypot(B.vx, B.vy) > 60) wake(A);
        if (B.sleep && Math.hypot(A.vx, A.vy) > 60) wake(B);
        cs.forEach(function (k) {
          k.A = A; k.B = B; k.jn = 0; k.jt = 0;
          k.ax = k.px - A.x; k.ay = k.py - A.y; k.bx = k.px - B.x; k.by = k.py - B.y;
          var ra = k.ax * k.ny - k.ay * k.nx, rb = k.bx * k.ny - k.by * k.nx;
          k.mn = 1 / Math.max(1e-9, im(A) + im(B) + ra * ra * iI(A) + rb * rb * iI(B));
          var ta = k.ax * k.nx + k.ay * k.ny, tb = k.bx * k.nx + k.by * k.ny; // r × t with t = (-ny, nx)
          k.mt = 1 / Math.max(1e-9, im(A) + im(B) + ta * ta * iI(A) + tb * tb * iI(B));
          var vn = relV(k)[0];
          k.bounce = vn < -40 ? -Math.max(A.rest, B.rest) * vn : 0; // Matter takes the max restitution
          k.mu = Math.min(A.fr, B.fr);
          contacts.push(k);
        });
      }
      for (var it = 0; it < 10; it++) contacts.forEach(function (k) {
        var v = relV(k), A = k.A, B = k.B;
        var jn = (k.bounce - v[0]) * k.mn, old = k.jn; k.jn = Math.max(0, old + jn); jn = k.jn - old;
        apply(k, k.nx * jn, k.ny * jn);
        v = relV(k);
        var jt = -v[1] * k.mt, oldt = k.jt, lim = k.mu * k.jn; k.jt = ctx.clamp(oldt + jt, -lim, lim); jt = k.jt - oldt;
        apply(k, -k.ny * jt, k.nx * jt);
      });
      bodies.forEach(function (b) {
        if (b.sleep) return;
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.w * dt;
        var e = b.vx * b.vx + b.vy * b.vy + b.w * b.w * 900;
        b.still = e < 400 && held && held.b === b ? 0 : e < 400 ? b.still + dt : 0;
        if (b.still > .6) { b.sleep = true; b.vx = b.vy = b.w = 0; }
      });
      contacts.forEach(function (k) { // positional correction (split from velocities)
        var A = k.A, B = k.B, sum = im(A) + im(B); if (!sum) return;
        var corr = Math.max(k.d - .5, 0) * .4 / sum;
        A.x -= k.nx * corr * im(A); A.y -= k.ny * corr * im(A); B.x += k.nx * corr * im(B); B.y += k.ny * corr * im(B);
      });
    }
    function relV(k) {
      var A = k.A, B = k.B;
      var vax = A.vx - A.w * k.ay, vay = A.vy + A.w * k.ax, vbx = B.vx - B.w * k.by, vby = B.vy + B.w * k.bx;
      var rx = vbx - vax, ry = vby - vay;
      return [rx * k.nx + ry * k.ny, rx * -k.ny + ry * k.nx];
    }
    function apply(k, jx, jy) {
      var A = k.A, B = k.B, ia = im(A), ib = im(B), Ia = iI(A), Ib = iI(B);
      A.vx -= jx * ia; A.vy -= jy * ia; A.w -= (k.ax * jy - k.ay * jx) * Ia;
      B.vx += jx * ib; B.vy += jy * ib; B.w += (k.bx * jy - k.by * jx) * Ib;
    }

    /* ---------- render / HUD ---------- */
    var pad = function (n) { return String(n).padStart(2, '0'); };
    function setTrack(i, animate) {
      track = i;
      title.textContent = pad(i + 1) + '.' + TRACKS[i].name;
      title.classList.remove('in'); if (animate && !R) { void title.offsetWidth; title.classList.add('in'); }
      tc.innerHTML = pad(i + 1) + '<i>:</i>' + pad((i + 1) % TRACKS.length + 1);
      bodies.forEach(function (b) { b.rest = TRACKS[i].rest; b.fr = TRACKS[i].fr; wake(b); });
    }
    function render() {
      bodies.forEach(function (b) {
        var hw = b.circle ? b.r : b.hw, hh = b.circle ? b.r : b.hh;
        b.el.style.transform = 'translate3d(' + (b.x - hw).toFixed(1) + 'px,' + (b.y - hh).toFixed(1) + 'px,0) rotate(' + b.a.toFixed(4) + 'rad)';
      });
      var asleep = bodies.filter(function (b) { return b.sleep; }).length;
      read.innerHTML = R ? 'Reduced motion · <b>pieces at rest</b>, drag off' :
        'g.y <b>' + g.y.toFixed(2) + '</b> · g.x <b>' + g.x.toFixed(3) + '</b> · ' + bodies.length + ' bodies · <b>' + asleep + '</b> asleep';
      if (!dbg.hidden) {
        var c = dbg.getContext('2d'); c.clearRect(0, 0, W, H); c.lineWidth = 2;
        bodies.forEach(function (b) {
          c.strokeStyle = b.sleep ? '#888' : '#fff'; c.setLineDash(b.sleep ? [4, 4] : []); c.beginPath();
          if (b.circle) { c.arc(b.x, b.y, b.r, 0, 7); c.moveTo(b.x, b.y); c.lineTo(b.x + Math.cos(b.a) * b.r, b.y + Math.sin(b.a) * b.r); }
          else { var v = verts(b); c.moveTo(v[0][0], v[0][1]); for (var i = 1; i < 4; i++) c.lineTo(v[i][0], v[i][1]); c.closePath(); }
          c.stroke();
        });
        c.setLineDash([]); c.fillStyle = '#f97316';
        contacts.forEach(function (k) { c.fillRect(k.px - 3, k.py - 3, 6, 6); });
      }
    }

    /* ---------- input ---------- */
    var pv = { x: 0, last: 0, t: 0 }, scrollV = 0, outP = 0;
    function local(e) { var r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    stage.addEventListener('pointerdown', function (e) {
      if (R) return;
      var b = bodies.filter(function (k) { return k.el === e.target || k.el.contains(e.target); })[0];
      if (!b) return;
      e.preventDefault();
      var p = local(e), c = Math.cos(-b.a), s = Math.sin(-b.a), dx = p[0] - b.x, dy = p[1] - b.y;
      held = { b: b, lx: dx * c - dy * s, ly: dx * s + dy * c, tx: p[0], ty: p[1], id: e.pointerId };
      wake(b); stage.classList.add('dragging');
      try { b.el.setPointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener('pointermove', function (e) {
      var p = local(e), now = performance.now();
      if (pv.t) pv.x = ctx.lerp(pv.x, (p[0] - pv.last) / Math.max(1, now - pv.t) * 16.7, .3); // px per frame
      pv.last = p[0]; pv.t = now;
      if (held && e.pointerId === held.id) { held.tx = p[0]; held.ty = p[1]; }
    });
    function release(e) { if (held && (!e || e.pointerId === held.id)) { held = null; stage.classList.remove('dragging'); } }
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    tossB.addEventListener('click', function () {
      if (R) return;
      bodies.forEach(function (b) { wake(b); b.vy -= 500 + Math.random() * 500; b.vx += (Math.random() - .5) * 500; b.w += (Math.random() - .5) * 8; });
    });
    dbgB.addEventListener('click', function () { dbg.hidden = !dbg.hidden; dbgB.setAttribute('aria-pressed', String(!dbg.hidden)); render(); });
    nextB.addEventListener('click', function () { setTrack((track + 1) % TRACKS.length, true); if (!R) tossB.click(); });

    var ro = null, acc = 0;
    var lp = ctx.loop(function (dt) {
      // gravity: base from how far the section has scrolled out + scroll velocity; x from pointer velocity
      var base = ctx.lerp(1.4, .5, ctx.clamp(outP / .6, 0, 1));
      g.y = base + scrollV * 50 * .1;            // v (−1..1) ≈ ±50 px/frame, × .1 as in the source
      g.x = ctx.clamp(pv.x * .001, -.5, .5); pv.x *= .9;
      if (Math.abs(g.y - gWake) > .25) { gWake = g.y; bodies.forEach(wake); }
      acc += dt;
      var h = 1 / 120; // fixed sub-steps keep dt far under the 33 ms limit
      while (acc >= h) { step(h); acc -= h; }
      render();
    });
    setTrack(0, false);
    build();
    return {
      start: function () {
        if (!ro) { ro = new ResizeObserver(function () { var w = W; fitWalls(); if (Math.abs(w - W) > 80) build(); else if (R) { restLayout(); render(); } }); ro.observe(stage); }
        if (!R) { acc = 0; lp.start(); }
        if (!R) setTrack(track, true);
      },
      stop: function () { lp.stop(); release(); if (ro) { ro.disconnect(); ro = null; } },
      scroll: function (p, v) { scrollV = v; outP = ctx.clamp((p - .5) * 2, 0, 1); },
      replay: function () { build(); }
    };
  }
});
