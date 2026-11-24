import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { navItems } from '../siteContent';
import { useActiveSection } from '../hooks/useActiveSection';
import { Logo } from './Logo';

const FOCUSABLE = 'a[href], button:not([disabled])';

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const active = useActiveSection(navItems.map((n) => n.id));

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Bloqueo de scroll mientras el menú móvil está abierto y foco inicial en el primer enlace.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    headerRef.current?.querySelector<HTMLElement>('.nav a')?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Si se pasa a escritorio con el menú abierto, se cierra.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 961px)');
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
      return;
    }
    if (e.key !== 'Tab') return;
    const items = Array.from(headerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <header
      ref={headerRef}
      className={`site-header${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}
      onKeyDown={onKeyDown}
    >
      <div className="site-header__inner">
        <a className="brand" href="#inicio" aria-label="KOEL Abogados, ir al inicio" onClick={() => close()} data-intro>
          <Logo className="brand__logo" />
        </a>

        <nav id="primary-nav" className="nav" aria-label="Principal" data-open={open}>
          <ul className="nav__list" data-intro>
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  className="nav__link"
                  href={`#${item.id}`}
                  aria-current={active === item.id ? 'true' : undefined}
                  onClick={() => close()}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="btn btn--primary nav__cta" href="#contacto" onClick={() => close()} data-intro>
            Hablemos de tu caso
          </a>
        </nav>

        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="menu-toggle__label">{open ? 'Cerrar' : 'Menú'}</span>
          <span className="menu-toggle__bars" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </div>
    </header>
  );
}
