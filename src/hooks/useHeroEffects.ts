import { useEffect, useState, type RefObject } from 'react';

const INTERACTIVE = 'a, button, input, select, textarea, label';

/** true mientras la pestaña está visible y el hero está en pantalla. */
export function useHeroActive(heroRef: RefObject<HTMLElement | null>): boolean {
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const el = heroRef.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [heroRef]);

  useEffect(() => {
    const onChange = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return inView && tabVisible;
}

/**
 * Ventana circular que sigue al cursor. Actualiza variables CSS (--mx, --my) en
 * un bucle requestAnimationFrame que solo corre mientras hay movimiento por resolver.
 */
export function usePointerReveal(
  heroRef: RefObject<HTMLElement | null>,
  revealRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  active: boolean,
) {
  useEffect(() => {
    const hero = heroRef.current;
    const reveal = revealRef.current;
    if (!hero || !reveal || !enabled || !active) {
      reveal?.removeAttribute('data-on');
      return;
    }

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let frame = 0;
    let hasPosition = false;

    const render = () => {
      frame = 0;
      current.x += (target.x - current.x) * 0.2;
      current.y += (target.y - current.y) * 0.2;
      reveal.style.setProperty('--mx', `${current.x.toFixed(1)}px`);
      reveal.style.setProperty('--my', `${current.y.toFixed(1)}px`);
      if (Math.abs(target.x - current.x) > 0.4 || Math.abs(target.y - current.y) > 0.4) {
        frame = requestAnimationFrame(render);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const overControl = e.target instanceof Element && e.target.closest(INTERACTIVE) !== null;
      if (overControl) {
        reveal.removeAttribute('data-on');
        return;
      }
      const rect = hero.getBoundingClientRect();
      target.x = e.clientX - rect.left;
      target.y = e.clientY - rect.top;
      if (!hasPosition) {
        current.x = target.x;
        current.y = target.y;
        hasPosition = true;
      }
      reveal.setAttribute('data-on', '');
      schedule();
    };
    const onLeave = () => reveal.removeAttribute('data-on');

    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
    return () => {
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
      reveal.removeAttribute('data-on');
    };
  }, [heroRef, revealRef, enabled, active]);
}

/** true en dispositivos con cursor preciso y capacidad de hover. */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const onChange = () => setFine(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return fine;
}
