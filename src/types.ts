export interface NavItem {
  id: string;
  label: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface EmailChannel {
  label: string;
  address: string;
}

/**
 * Datos de contacto reales de KOEL Abogados.
 * Cualquier campo en `null` o lista vacía se considera pendiente y NO se muestra.
 */
export interface ContactConfig {
  phone: string | null;
  /** Solo dígitos con indicativo de país, p. ej. "573001234567". */
  whatsapp: string | null;
  emails: EmailChannel[];
  address: string | null;
  schedule: string | null;
  social: SocialLink[];
  privacyUrl: string | null;
}
