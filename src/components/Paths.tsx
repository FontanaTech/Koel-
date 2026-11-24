import type { MouseEvent } from 'react';
import { openChat } from '../lib/chat';
import { paths } from '../siteContent';

/** Con el chat conectado los CTAs lo abren; si no, siguen al enlace de Contacto. */
const toChat = (e: MouseEvent<HTMLAnchorElement>) => {
  if (openChat()) e.preventDefault();
};

export function Paths() {
  const { company, person } = paths;
  return (
    <section className="paths" aria-label="Elige tu recorrido de contacto">
      <div className="paths__panel paths__panel--dark" data-reveal>
        <p className="eyebrow eyebrow--light">{company.label}</p>
        <p className="paths__text">{company.text}</p>
        <a className="btn btn--primary" href="#contacto" onClick={toChat}>
          {company.cta}
        </a>
      </div>
      <div className="paths__panel paths__panel--light" data-reveal data-delay={120}>
        <p className="eyebrow">{person.label}</p>
        <p className="paths__text">{person.text}</p>
        <a className="btn btn--dark" href="#contacto" onClick={toChat}>
          {person.cta}
        </a>
      </div>
    </section>
  );
}
