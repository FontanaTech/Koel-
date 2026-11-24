import { solutions } from '../siteContent';

export function Solutions() {
  return (
    <section id="soluciones" className="section solutions" aria-labelledby="solutions-title">
      <div className="container">
        <p className="eyebrow eyebrow--light" data-reveal>
          {solutions.eyebrow}
        </p>
        <h2 id="solutions-title" className="display display--light" data-reveal>
          {solutions.title}
        </h2>

        <ol className="service-list">
          {solutions.items.map((s, i) => (
            <li key={s.id} className="service" data-reveal data-delay={i * 80}>
              <span className="service__n">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="service__title">{s.title}</h3>
              <p className="service__text">{s.description}</p>
              <a className="service__link" href="#contacto">
                {solutions.link}
                <span className="service__arrow" aria-hidden="true">
                  →
                </span>
                <span className="visually-hidden">: {s.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
