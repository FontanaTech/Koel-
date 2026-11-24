import type { ContactConfig } from '../types';

/**
 * Canales de contacto de KOEL Abogados.
 * - phone: solo llamadas telefónicas (indicativo +57 Colombia).
 * - whatsapp: línea exclusiva de WhatsApp, solo dígitos con indicativo (57 + número).
 * Pendientes: address, schedule, social, privacyUrl. Los canales en null / [] se ocultan.
 * Los datos de Consultorías Jurídicas BPO pertenecen a otra empresa y no deben usarse aquí.
 */
export const contactConfig: ContactConfig = {
  phone: '+57 333 602 9371',
  whatsapp: '573116747801',
  emails: [{ label: 'Correo', address: 'coordinador@koelabogados.com' }],
  address: null,
  schedule: null,
  social: [],
  privacyUrl: null,
};

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;
export const whatsappHref = (digits: string, text?: string) =>
  `https://wa.me/${digits.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
