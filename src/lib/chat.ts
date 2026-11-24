import { ApiError, FontanaChatClient } from '../fontanachat-client';
import { chatText } from '../config/chatText';
import { companySlug } from '../siteContent';

const apiBase = import.meta.env.VITE_API_BASE_URL?.trim();

/**
 * Instancia única del cliente de Fontanachat (el sitio es público: no hay secretos aquí).
 * Sin VITE_API_BASE_URL el chat queda desactivado (null) y el sitio funciona igual.
 */
export const chatClient: FontanaChatClient | null = apiBase
  ? new FontanaChatClient({ baseUrl: apiBase, slug: companySlug })
  : null;

export const CHAT_OPEN_EVENT = 'koel:chat-open';

let chatReady = false;

/** El widget avisa si la API está conectada; sin conexión el chat no se muestra. */
export function setChatReady(ready: boolean) {
  chatReady = ready;
}

/**
 * Abre el widget desde un CTA del sitio. Devuelve true si se abrió:
 * el llamador cancela entonces su enlace de respaldo (#contacto).
 */
export function openChat(): boolean {
  if (!chatReady) return false;
  window.dispatchEvent(new CustomEvent(CHAT_OPEN_EVENT));
  return true;
}

/** Solo se aceptan enlaces de WhatsApp entregados por el servidor y que empiecen por https://wa.me/. */
export const isWaUrl = (url: unknown): url is string => typeof url === 'string' && url.startsWith('https://wa.me/');

/** Enlaces «Ver más»: solo internos (/ o #) o https. */
export const isSafeLink = (url: string) => /^(https:\/\/|\/|#)/i.test(url);

export interface ErrorInfo {
  message: string;
  /** Sesión inválida (401): hay que reiniciar la conversación. */
  restart: boolean;
  /** Mostrar «Reintentar». */
  retryable: boolean;
  /** No hay asesores: mensaje fijo, sin reintento. */
  noAdvisor: boolean;
}

export function describeApiError(error: unknown): ErrorInfo {
  const t = chatText.errors;
  const base = { restart: false, retryable: false, noAdvisor: false };
  if (error instanceof ApiError) {
    if (error.noAdvisor) return { ...base, message: chatText.noAdvisors, noAdvisor: true };
    if (error.status === 401) return { ...base, message: t.session, restart: true };
    if (error.kind === 'timeout') return { ...base, message: t.timeout, retryable: true };
    if (error.kind === 'network') return { ...base, message: t.network, retryable: true };
    if (error.retryable) return { ...base, message: t.server, retryable: true };
    return { ...base, message: t.generic };
  }
  return { ...base, message: t.generic, retryable: true };
}
