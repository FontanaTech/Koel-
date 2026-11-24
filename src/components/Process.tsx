import { process } from '../siteContent';

export function Process() {
  return (
    <section id="proceso" className="section process" aria-labelledby="process-title">
      <div className="container">
        <p className="eyebrow" data-reveal>
          {process.eyebrow}
        </p>
        <h2 id="process-title" className="display" data-reveal>
          {process.title}
        </h2>

        <ol className="steps">
          {process.steps.map((s, i) => (
            <li key={s.title} className="step" data-reveal data-delay={i * 140}>
              <span className="step__marker" aria-hidden="true" />
              <span className="step__n">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="step__title">{s.title}</h3>
              <p className="step__text">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
