'use client';
import {useEffect, useRef} from 'react';

/** Progressive enhancement: content stays visible without JS or motion support. */
export function useMotion() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = root.current;
    if (!container || !('IntersectionObserver' in window)) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Set<Animation>();
    let observer: IntersectionObserver | undefined;
    let plateObserver: IntersectionObserver | undefined;
    function start() {
      observer?.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
      // The weight plates land once the stack is well in view; without motion they simply stay put.
      plateObserver?.disconnect();
      const stacks = container?.querySelectorAll<HTMLElement>('[data-plates]') ?? [];
      stacks.forEach(stack => stack.classList.remove('is-armed', 'is-in'));
      if (preference.matches || !container) return;
      plateObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        plateObserver?.unobserve(entry.target);
        entry.target.classList.add('is-in');
      }), {threshold: 0.7});
      stacks.forEach(stack => { stack.classList.add('is-armed'); plateObserver?.observe(stack); });
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          observer?.unobserve(entry.target);
          const element = entry.target as HTMLElement;
          const animation = element.animate([
            {opacity: 0.6, transform: 'translateY(12px)', filter: 'blur(2px)'},
            {opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)'}
          ], {duration: 850, delay: Number(element.dataset.motionDelay || 0), easing: 'cubic-bezier(.2,.75,.25,1)'});
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        });
      }, {threshold: 0.08});
      container.querySelectorAll('[data-reveal]').forEach(element => observer?.observe(element));
    }
    // While the boot loader still covers the page, hold the entrance until it lifts.
    if (document.documentElement.classList.contains('is-booting')) window.addEventListener('maya:reveal', start, {once: true});
    else start();
    preference.addEventListener('change', start);
    return () => {
      observer?.disconnect();
      plateObserver?.disconnect();
      animations.forEach(animation => animation.cancel());
      preference.removeEventListener('change', start);
      window.removeEventListener('maya:reveal', start);
    };
  }, []);
  return root;
}
