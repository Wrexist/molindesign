'use client';
import {useEffect, useRef} from 'react';

/**
 * Progressive enhancement: content stays visible without JS or motion support.
 * [data-reveal] blocks blur-rise in; [data-lines] headlines rise line by line from a mask, and every
 * revealed element gets .is-in so CSS can settle what is inside it (card photos).
 */
export function useMotion() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = root.current;
    if (!container || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;
    function start() {
      observer?.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
      if (!container) return;
      if (preference.matches) {
        container.classList.remove('motion-ready');
        return;
      }
      // Hide what has not been revealed yet, and flush that style so the first reveal transitions.
      container.classList.add('motion-ready');
      void container.offsetHeight;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer?.unobserve(entry.target);
          const element = entry.target as HTMLElement;
          element.classList.add('is-in');
          if (!element.hasAttribute('data-reveal')) return;
          const animation = element.animate([
            {opacity: 0, transform: 'translateY(14px)', filter: 'blur(4px)'},
            {opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)'}
          ], {duration: 900, delay: Number(element.dataset.motionDelay || 0), easing: 'cubic-bezier(.23,1,.32,1)', fill: 'backwards'});
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        });
      }, {threshold: 0.12, rootMargin: '0px 0px -6% 0px'});
      container.querySelectorAll('[data-reveal],[data-lines]').forEach(element => {
        if (!element.classList.contains('is-in')) observer?.observe(element);
      });
    }
    // While the boot loader still covers the page, hold the entrance until it lifts.
    if (document.documentElement.classList.contains('is-booting')) window.addEventListener('maya:reveal', start, {once: true});
    else start();
    preference.addEventListener('change', start);
    return () => {
      observer?.disconnect();
      animations.forEach(animation => animation.cancel());
      preference.removeEventListener('change', start);
      window.removeEventListener('maya:reveal', start);
    };
  }, []);
  return root;
}
