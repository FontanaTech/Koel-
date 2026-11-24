import { contactConfig } from './config/contact';
import type { SectionSource } from './fontanachat-client/content';
import type { NavItem, Service } from './types';

/**
 * Fuente única de los textos del sitio.
 * Los componentes la importan para renderizar y el build genera con ella /chatbot-content.json,
 * de modo que el chatbot de Fontanachat solo responde con lo que la página muestra.
 */

/** Slug de KOEL Abogados en la API de Fontanachat (panel → Empresas). PENDIENTE de confirmar. */
export const companySlug = 'koel-abogados';
export const siteName = 'KOEL Abogados';

export const navItems: NavItem[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'nosotros', label: 'Nosotros' },
  { id: 'soluciones', label: 'Soluciones' },
  { id: 'proceso', label: 'Cómo trabajamos' },
  { id: 'contacto', label: 'Contacto' },
];

export const hero = {
  eyebrow: 'KOEL ABOGADOS',
  titleLines: ['ESTRATEGIA JURÍDICA.', 'SOLUCIONES QUE AVANZAN'] as const,
  description:
    'Acompañamos a empresas y personas en la gestión de cartera y la búsqueda de acuerdos, con una atención clara, cercana y orientada a cada situación.',
  primaryCta: 'Conocer nuestras soluciones',
  secondaryCta: 'Quiero recibir orientación',
  stripTitle: 'KOEL ABOGADOS',
  stripLegend: 'ESTRATEGIA · GESTIÓN · ACUERDOS',
  scrollCue: 'Continuar',
};

export const about = {
  eyebrow: 'Nosotros',
  title: 'Criterio para actuar. Cercanía para acompañar.',
  text: 'En KOEL Abogados entendemos que cada caso requiere escuchar, analizar y definir un camino. Nuestra propuesta combina acompañamiento jurídico y gestión de cartera con una comunicación comprensible y un trato respetuoso.',
  principles: [
    { n: '01', title: 'Claridad', text: 'Información comprensible para conocer las opciones y los siguientes pasos.' },
    { n: '02', title: 'Compromiso', text: 'Atención organizada y seguimiento de las gestiones.' },
    { n: '03', title: 'Respeto', text: 'Comunicación cuidadosa con las personas involucradas.' },
  ],
};

export const solutions = {
  eyebrow: 'Soluciones',
  title: 'Soluciones para gestionar y llegar a acuerdos.',
  link: 'Consultar esta solución',
  items: [
    {
      id: 'cartera',
      title: 'Gestión y recuperación de cartera',
      description:
        'Acompañamiento para organizar la gestión de obligaciones pendientes y explorar alternativas de recuperación.',
    },
    {
      id: 'juridico',
      title: 'Acompañamiento jurídico',
      description: 'Orientación para analizar cada situación y definir las actuaciones que correspondan.',
    },
    {
      id: 'negociacion',
      title: 'Negociación y conciliación',
      description: 'Espacios de diálogo para evaluar opciones y facilitar acuerdos entre las partes.',
    },
    {
      id: 'tecnologia',
      title: 'Tecnología aplicada a la gestión',
      description:
        'Herramientas de apoyo para organizar información, dar seguimiento y facilitar la comunicación.',
    },
  ] satisfies Service[],
};

export const process = {
  eyebrow: 'Cómo trabajamos',
  title: 'Un proceso claro desde el primer contacto.',
  steps: [
    { title: 'Escuchamos', text: 'Conocemos la necesidad y la información disponible.' },
    { title: 'Analizamos', text: 'Revisamos el contexto y las alternativas.' },
    { title: 'Definimos', text: 'Acordamos el alcance y el siguiente paso.' },
    { title: 'Acompañamos', text: 'Mantenemos comunicación durante la gestión.' },
  ],
};

export const paths = {
  company: {
    label: 'Para empresas',
    text: 'Conversemos sobre las necesidades de gestión de tu cartera.',
    cta: 'Solicitar contacto empresarial',
  },
  person: {
    label: 'Para personas',
    text: 'Recibe orientación sobre tu consulta o las alternativas para llegar a un acuerdo.',
    cta: 'Solicitar orientación',
  },
};

export const contact = {
  eyebrow: 'Contacto',
  title: 'Hablemos del siguiente paso.',
  intro:
    'Cuéntanos tu situación por el canal que prefieras. Te orientamos sobre las alternativas disponibles y el siguiente paso a seguir.',
  channelsTitle: 'Canales de atención',
  whatsappCta: 'Escribir por WhatsApp',
  whatsappMessage: 'Hola, KOEL Abogados. Quisiera recibir orientación sobre mi caso.',
  noChannels:
    'Muy pronto publicaremos aquí nuestros canales de atención directa, incluido WhatsApp.',
  privacyNote:
    'Por tu seguridad, no compartas documentos de identidad, información bancaria ni detalles sensibles del caso en el primer contacto.',
};

/** Datos de contacto visibles en el sitio (Contacto y pie de página). El bot los responde tal cual. */
const visibleContact = (): string[] => {
  const c = contactConfig;
  return [
    c.phone && `Línea de atención (llamadas): ${c.phone}`,
    c.whatsapp && `WhatsApp: botón «${contact.whatsappCta}» en la sección Contacto.`,
    ...c.emails.filter((e) => e.address).map((e) => `${e.label}: ${e.address}`),
    c.address && `Dirección: ${c.address}`,
    c.schedule && `Horarios: ${c.schedule}`,
  ].filter((t): t is string => Boolean(t));
};

/** Secciones públicas para /chatbot-content.json (mismos textos que se renderizan). */
export const sections: SectionSource[] = [
  {
    slug: 'inicio',
    title: siteName,
    route: '/#inicio',
    texts: [hero.titleLines.join(' '), hero.description],
  },
  {
    slug: 'nosotros',
    title: about.title,
    route: '/#nosotros',
    texts: [about.text, ...about.principles.map((p) => `${p.title}: ${p.text}`)],
  },
  {
    slug: 'soluciones',
    title: solutions.title,
    route: '/#soluciones',
    texts: solutions.items.map((s) => `${s.title}: ${s.description}`),
  },
  {
    slug: 'como-trabajamos',
    title: process.title,
    route: '/#proceso',
    texts: process.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.text}`),
  },
  {
    slug: 'empresas-y-personas',
    title: 'Para empresas y para personas',
    route: '/#contacto',
    texts: [`${paths.company.label}: ${paths.company.text}`, `${paths.person.label}: ${paths.person.text}`],
  },
  {
    slug: 'contacto',
    title: contact.title,
    route: '/#contacto',
    texts: [contact.intro, ...visibleContact(), contact.privacyNote],
  },
];
