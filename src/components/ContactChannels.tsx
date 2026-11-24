import { contactConfig, telHref, whatsappHref } from '../config/contact';
import { contact } from '../siteContent';
import type { ContactConfig } from '../types';

interface Channel {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}

interface ChannelOptions {
  /** Omite WhatsApp cuando ya se muestra como botón destacado. */
  skipWhatsapp?: boolean;
}

/** Solo devuelve los canales con información confirmada en la configuración. */
export function getChannels(cfg: ContactConfig = contactConfig, { skipWhatsapp = false }: ChannelOptions = {}): Channel[] {
  const channels: Channel[] = [];
  if (cfg.phone) channels.push({ label: 'Línea de atención', value: cfg.phone, href: telHref(cfg.phone) });
  if (cfg.whatsapp && !skipWhatsapp) {
    channels.push({
      label: 'WhatsApp',
      value: contact.whatsappCta,
      href: whatsappHref(cfg.whatsapp, contact.whatsappMessage),
      external: true,
    });
  }
  for (const e of cfg.emails) {
    if (e.address) channels.push({ label: e.label, value: e.address, href: `mailto:${e.address}` });
  }
  if (cfg.address) channels.push({ label: 'Dirección', value: cfg.address });
  if (cfg.schedule) channels.push({ label: 'Horarios', value: cfg.schedule });
  for (const s of cfg.social) {
    if (s.url) channels.push({ label: s.label, value: s.label, href: s.url, external: true });
  }
  return channels;
}

export function ChannelList({ className, skipWhatsapp }: { className?: string } & ChannelOptions) {
  const channels = getChannels(contactConfig, { skipWhatsapp });
  if (channels.length === 0) return null;
  return (
    <dl className={className}>
      {channels.map((c) => (
        <div key={`${c.label}-${c.value}`} className="channel">
          <dt>{c.label}</dt>
          <dd>
            {c.href ? (
              <a href={c.href} {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {c.value}
              </a>
            ) : (
              c.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const WhatsappIcon = () => (
  <svg className="btn__icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.1-1.34A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.03.8.81-2.95-.2-.3a8.2 8.2 0 1 1 6.9 3.78Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.55.12-.16.25-.63.8-.78.96-.14.17-.29.19-.53.07a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.43l-.75-1.8c-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.7 2.7 0 0 0-.85 2.02c0 1.19.87 2.34.99 2.5.12.17 1.7 2.6 4.13 3.65 1.53.66 2.13.72 2.9.6.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.17-.47-.29Z" />
  </svg>
);

/** Tarjeta de canales de atención. Si aún no hay datos confirmados, muestra un aviso. */
export function ContactChannels() {
  const { whatsapp } = contactConfig;
  const hasOthers = getChannels(contactConfig, { skipWhatsapp: true }).length > 0;

  return (
    <div className="contact-card">
      <p className="contact-card__title">{contact.channelsTitle}</p>

      {whatsapp && (
        <a
          className="btn btn--whatsapp contact-card__whatsapp"
          href={whatsappHref(whatsapp, contact.whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <WhatsappIcon />
          {contact.whatsappCta}
        </a>
      )}

      {hasOthers && <ChannelList className="channels contact-card__channels" skipWhatsapp />}

      {!whatsapp && !hasOthers && (
        <div className="contact-card__pending">
          <span className="contact-card__dot" aria-hidden="true" />
          <p>{contact.noChannels}</p>
        </div>
      )}

      <p className="contact-card__note">{contact.privacyNote}</p>
    </div>
  );
}
