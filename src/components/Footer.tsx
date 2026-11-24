import { contactConfig } from '../config/contact';
import { navItems } from '../siteContent';
import { ChannelList, getChannels } from './ContactChannels';
import { Logo } from './Logo';

export function Footer() {
  const year = new Date().getFullYear();
  const hasChannels = getChannels().length > 0;
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__about">
          <a className="footer__brand" href="#inicio" aria-label="KOEL Abogados, volver al inicio">
            <Logo className="footer__logo" />
          </a>
          <p className="footer__tagline">Estrategia jurídica. Soluciones que avanzan.</p>
        </div>

        <nav className="footer__nav" aria-label="Pie de página">
          <p className="footer__heading">Navegación</p>
          <ul>
            {navItems.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer__contact">
          <p className="footer__heading">Contacto</p>
          {hasChannels ? (
            <ChannelList className="footer__channels channels" />
          ) : (
            <>
              <p className="footer__cta-text">¿Tienes una consulta? Cuéntanos tu situación y te orientamos.</p>
              <a className="btn btn--primary footer__cta" href="#contacto">
                Hablemos de tu caso
              </a>
            </>
          )}
        </div>
      </div>

      <div className="container footer__legal">
        <p>© {year} KOEL Abogados. Todos los derechos reservados.</p>
        <a className="footer__top" href="#inicio">
          Volver arriba
          <span aria-hidden="true">↑</span>
        </a>
        {contactConfig.privacyUrl && (
          <a href={contactConfig.privacyUrl} target="_blank" rel="noopener noreferrer">
            Política de privacidad
          </a>
        )}
      </div>
    </footer>
  );
}
