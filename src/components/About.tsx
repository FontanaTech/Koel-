import { about } from '../siteContent';

export function About() {
  return (
    <section id="nosotros" className="section about" aria-labelledby="about-title">
      <div className="container">
        <div className="about__head">
          <p className="eyebrow" data-reveal>
            {about.eyebrow}
          </p>
          <h2 id="about-title" className="display" data-reveal>
            {about.title}
          </h2>
          <p className="lead" data-reveal data-delay={120}>
            {about.text}
          </p>
        </div>

        <ol className="principles">
          {about.principles.map((p, i) => (
            <li key={p.n} className="principle" data-reveal data-delay={i * 120}>
              <span className="principle__n">{p.n}</span>
              <h3 className="principle__title">{p.title}</h3>
              <p className="principle__text">{p.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
