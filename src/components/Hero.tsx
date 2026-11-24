import { useRef } from 'react';
import { hero } from '../siteContent';
import { useFinePointer, useHeroActive, usePointerReveal } from '../hooks/useHeroEffects';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { asset } from '../lib/asset';

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const active = useHeroActive(heroRef);

  usePointerReveal(heroRef, revealRef, finePointer && !reducedMotion, active);

  // Ambas capas usan la misma foto: el revelado carmesí es un tratamiento de color, así que el encuadre coincide siempre.
  const landscapeSrc = asset('img/paisaje-ciudad.webp');

  return (
    <section
      id="inicio"
      ref={heroRef}
      className="hero"
      data-running={active && !reducedMotion}
      aria-labelledby="hero-title"
    >
      <div className="landscape" aria-hidden="true">
        <img
          className="landscape__img landscape__img--base"
          src={landscapeSrc}
          width={2200}
          height={1467}
          alt=""
          fetchPriority="high"
          decoding="async"
        />
        <div className="landscape__tone landscape__tone--base" />

        {/* Revelado circular en carmesí al mover el cursor */}
        <div ref={revealRef} className="landscape__reveal">
          <img
            className="landscape__img landscape__img--alt"
            src={landscapeSrc}
            width={2200}
            height={1467}
            alt=""
            decoding="async"
          />
          <div className="landscape__tone landscape__tone--alt" />
        </div>

        <div className="landscape__scrim" />
      </div>

      <aside className="hero__strip" aria-hidden="true">
        <span className="hero__strip-title">{hero.stripTitle}</span>
        <span className="hero__strip-line" />
        <span className="hero__strip-legend">{hero.stripLegend}</span>
      </aside>

      <div className="hero__content">
        <p className="eyebrow eyebrow--light" data-intro>
          {hero.eyebrow}
        </p>
        <h1 id="hero-title" className="hero__title">
          <span className="hero__title-line" data-intro>
            {hero.titleLines[0]}
          </span>
          <span className="hero__title-line" data-intro>
            {hero.titleLines[1]}
            <span className="hero__dot">.</span>
          </span>
        </h1>
        <p className="hero__text" data-intro>
          {hero.description}
        </p>
        <div className="hero__actions" data-intro>
          <a className="btn btn--primary" href="#soluciones">
            {hero.primaryCta}
          </a>
          <a className="btn btn--ghost" href="#contacto">
            {hero.secondaryCta}
          </a>
        </div>
      </div>

      <div className="hero__bar" data-intro>
        <a className="scroll-cue" href="#nosotros">
          <span>{hero.scrollCue}</span>
          <span className="scroll-cue__line" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
