import { useEffect } from 'react';
import { animate, stagger } from 'animejs';
import { prefersReducedMotion } from './useReducedMotion';

const ANIM_CLASS = 'js-anim';

/** Muestra todo sin animación (movimiento reducido o fallo de la biblioteca). */
function disableAnimations() {
  document.documentElement.classList.remove(ANIM_CLASS);
}

/**
 * Entrada escalonada de cabecera, título, descripción y botones.
 * Los elementos llevan `data-intro` y están ocultos por CSS solo cuando JS está activo.
 */
export function useIntroAnimation() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      disableAnimations();
      return;
    }
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-intro]'));
    if (targets.length === 0) return;
    try {
      const anim = animate(targets, {
        opacity: [0, 1],
        translateY: [22, 0],
        duration: 800,
        delay: stagger(90, { start: 120 }),
        ease: 'outCubic',
      });
      return () => {
        anim.pause();
      };
    } catch {
      disableAnimations();
    }
  }, []);
}

/**
 * Revela elementos `data-reveal` al entrar en pantalla (una sola vez).
 * `data-delay` (ms) permite escalonar elementos hermanos.
 */
export function useScrollReveal() {
  useEffect(() => {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      disableAnimations();
      return;
    }
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          io.unobserve(el);
          try {
            animate(el, {
              opacity: [0, 1],
              translateY: [28, 0],
              duration: 700,
              delay: Number(el.dataset.delay ?? 0),
              ease: 'outCubic',
            });
          } catch {
            el.style.opacity = '1';
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
