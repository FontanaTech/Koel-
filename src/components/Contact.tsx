import { contact } from '../siteContent';
import { ContactChannels } from './ContactChannels';

export function Contact() {
  return (
    <section id="contacto" className="section contact" aria-labelledby="contact-title">
      <div className="container contact__grid">
        <div className="contact__intro">
          <p className="eyebrow" data-reveal>
            {contact.eyebrow}
          </p>
          <h2 id="contact-title" className="display" data-reveal>
            {contact.title}
          </h2>
          <p className="lead" data-reveal data-delay={100}>
            {contact.intro}
          </p>
        </div>
        <div className="contact__channels" data-reveal data-delay={160}>
          <ContactChannels />
        </div>
      </div>
    </section>
  );
}
