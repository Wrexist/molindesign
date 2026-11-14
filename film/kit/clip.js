/* Delta clip layer: draws short, muted, credited Rockstar trailer excerpts inside a code-rendered film.
   Frames come from delta/clips/clipkit.py cut (film/<slug>/clips/<name>/0001.jpg, gitignored); clips.json lists them.
   The film registers every on-screen use with CLIP.use() once its word times are known; render.mjs `clips`
   exports those uses so `clipkit.py lint` can hold the film to SAFE-EDIT rules 3 and 7 (each use under 5 s,
   annotated, at most half the runtime, no unbroken stretch, no clip reused across films).

   CLIP.load('clips.json')                 -> Promise, resolves when every frame is decoded (call before READY)
   CLIP.reset()                            clear uses (call at the top of the film's initTimes)
   CLIP.use(name, t0, t1, {               register one on-screen use
     from: 0,        seconds into the cut where the use starts
     speed: 1,       playback speed (0.5 = slow motion)
     freeze: null,   seconds after t0 at which the picture holds still (a freeze-frame to annotate)
     zoom: [1, 1.12] scale at t0 and t1 (slow push), focus: [.5, .5] point kept in view (0..1 of the frame)
     note: 'ROOF',   the annotation the film draws on top: required, lint fails without it
   })
   CLIP.active(t)                          the use on screen at t, or null
   CLIP.draw(g, t, x, y, w, h)             cover-fits the active use's frame into the rect; returns the use or null
   CLIP.toScreen(use, t, nx, ny, x, y, w, h)  a point (0..1 of the source frame) -> canvas px, for circles and arrows
   CLIP.frameAt(use, t)                    { img, k } the source image and the use's 0..1 progress
   CLIP.credit(g, use, x, y, font)         small "CLIP · ROCKSTAR GAMES" chip, left-aligned at x, baseline y
   CLIP.uses()                             plain list for render.mjs clips */
(function () {
  'use strict';
  var MAN = null, FR = {}, USES = [];
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function load(url) {
    return fetch(url || 'clips.json').then(function (r) {
      if (!r.ok) throw new Error('clips.json missing');
      return r.json();
    }).then(function (m) {
      MAN = m; var all = [];
      Object.keys(m.clips).forEach(function (name) {
        var c = m.clips[name]; FR[name] = [];
        for (var i = 1; i <= c.frames; i++) {
          var img = new Image(); img.src = 'clips/' + name + '/' + String(i).padStart(4, '0') + '.jpg';
          FR[name].push(img);
          all.push(img.decode().catch(function () {
            throw new Error('clip frames missing: run python3 delta/clips/clipkit.py restore ' + m.film);
          }));
        }
      });
      return Promise.all(all);
    });
  }

  function use(name, t0, t1, o) {
    if (!MAN || !MAN.clips[name]) throw new Error('no clip ' + name + ' in clips.json');
    o = o || {};
    var u = { clip: name, t0: t0, t1: t1, from: o.from || 0, speed: o.speed == null ? 1 : o.speed, freeze: o.freeze == null ? null : o.freeze,
      zoom: o.zoom || [1, 1.08], focus: o.focus || [.5, .5], note: o.note || '' };
    var live = (u.freeze == null ? t1 - t0 : Math.min(u.freeze, t1 - t0));
    u.srcTo = u.from + live * u.speed;
    USES.push(u); USES.sort(function (a, b) { return a.t0 - b.t0; });
    return u;
  }
  function active(t) { for (var i = 0; i < USES.length; i++) if (t >= USES[i].t0 && t < USES[i].t1) return USES[i]; return null; }

  function frameAt(u, t) {
    var c = MAN.clips[u.clip], fr = FR[u.clip], local = t - u.t0;
    if (u.freeze != null) local = Math.min(local, u.freeze);
    var s = u.from + local * u.speed, i = clamp(Math.floor(s * c.fps), 0, fr.length - 1);
    return { img: fr[i], k: clamp((t - u.t0) / (u.t1 - u.t0), 0, 1) };
  }

  /* where the use's frame lands in the rect at time t: cover-fit, zoomed, focus point centred as far as the edges allow */
  function geom(u, t, x, y, w, h) {
    var f = frameAt(u, t), img = f.img, iw = img.naturalWidth, ih = img.naturalHeight;
    var z = u.zoom[0] + (u.zoom[1] - u.zoom[0]) * f.k;
    var s = Math.max(w / iw, h / ih) * z, dw = iw * s, dh = ih * s;
    var dx = clamp(x + w / 2 - u.focus[0] * dw, x + w - dw, x), dy = clamp(y + h / 2 - u.focus[1] * dh, y + h - dh, y);
    return { img: img, k: f.k, x: dx, y: dy, w: dw, h: dh };
  }
  function draw(g, t, x, y, w, h, u) {
    u = u || active(t); if (!u) return null;
    var q = geom(u, t, x, y, w, h);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.drawImage(q.img, q.x, q.y, q.w, q.h);
    g.restore();
    return u;
  }
  /* a point given as 0..1 of the source frame -> canvas px, for circles and arrows that sit on the picture */
  function toScreen(u, t, nx, ny, x, y, w, h) { var q = geom(u, t, x, y, w, h); return [q.x + nx * q.w, q.y + ny * q.h]; }

  function credit(g, u, x, y, font) {
    if (!u) return;
    var src = MAN.sources[MAN.clips[u.clip].src], txt = 'CLIP · ' + String(src.credit || 'Rockstar Games').toUpperCase();
    g.save(); g.font = font || '700 30px "Geist Mono", monospace'; g.textBaseline = 'alphabetic';
    var tw = g.measureText(txt).width;
    g.fillStyle = 'rgba(11,8,32,.78)'; g.fillRect(x - 12, y - 33, tw + 24, 46);
    g.fillStyle = '#fbf0ea'; g.fillText(txt, x, y);
    g.restore();
  }

  window.CLIP = {
    load: load, use: use, active: active, draw: draw, toScreen: toScreen, frameAt: frameAt, credit: credit,
    reset: function () { USES.length = 0; },
    uses: function () { return USES.map(function (u) { return { clip: u.clip, t0: u.t0, t1: u.t1, from: u.from, srcTo: u.srcTo, note: u.note }; }); },
    manifest: function () { return MAN; }
  };
})();
