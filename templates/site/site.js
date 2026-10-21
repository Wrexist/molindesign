/* {{NAME}}: small boot. No build, no dependencies. Add sections below; keep each one honest about which skill it implements. */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer: fine) and (hover: hover)').matches;
  doc.classList.toggle('is-reduced', reduced);
  doc.classList.toggle('is-fine', fine);

  /* Entrances (masked-text-reveal): stagger index per group, play once when 15% visible. */
  document.querySelectorAll('.hero, .sec').forEach(function (group) {
    group.querySelectorAll('.mask .line, .rise').forEach(function (n, i) { n.style.setProperty('--i', i); });
  });
  var targets = document.querySelectorAll('.mask, .rise');
  if (!('IntersectionObserver' in window)) { targets.forEach(function (n) { n.classList.add('is-in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
  targets.forEach(function (n) { io.observe(n); });
})();
