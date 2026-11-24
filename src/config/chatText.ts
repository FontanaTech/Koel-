/**
 * Textos de la interfaz del chat (no son contenido del sitio: no van a /chatbot-content.json).
 * Sin teléfonos, correos ni enlaces: el contacto por WhatsApp lo entrega siempre el servidor (waUrl).
 */
import { siteName } from '../siteContent';

export const chatText = {
  launcher: 'Abrir chat con el asistente virtual',
  title: siteName,
  subtitle: 'Asistente virtual',
  panelLabel: `Chat con ${siteName}`,
  close: 'Cerrar chat',
  inputLabel: 'Escribe tu mensaje',
  inputPlaceholder: 'Escribe tu mensaje…',
  send: 'Enviar mensaje',
  typing: 'Escribiendo…',
  youLabel: 'Tú',
  botLabel: 'Asistente virtual',
  advisorLabel: 'Asesor',
  systemLabel: 'Aviso',
  seeMore: 'Ver más',
  whatsapp: 'Continuar en WhatsApp',
  newTab: ' (se abre en una pestaña nueva)',
  advisorButton: 'Hablar con un asesor',
  connectingAdvisor: 'Conectando con un asesor…',
  handoffReady: (advisor: string) =>
    advisor ? `Listo. ${advisor} te atenderá por WhatsApp.` : 'Listo. Un asesor te atenderá por WhatsApp.',
  noAdvisors: 'En este momento no hay asesores disponibles. Puedes seguir consultando aquí con el asistente.',
  retry: 'Reintentar',
  newConversation: 'Nueva conversación',
  liveBy: 'Te atiende en vivo',
  realPerson: 'Un asesor te atiende en vivo',
  privacy:
    'No compartas documentos de identidad, información bancaria ni detalles sensibles en este chat.',
  errors: {
    network: 'No pudimos conectar con el asistente. Revisa tu conexión e inténtalo de nuevo.',
    timeout: 'El asistente tardó demasiado en responder. Inténtalo de nuevo.',
    session: 'Tu sesión expiró, así que iniciamos una conversación nueva.',
    server: 'El asistente no está disponible en este momento.',
    generic: 'No pudimos obtener una respuesta.',
  },
  statuses: {
    BOT_ACTIVO: null,
    EN_ESPERA_ASESOR: 'Un asesor se unirá en breve.',
    TOMADO_POR_ASESOR: 'Un asesor está atendiendo tu solicitud por este medio.',
    REMITIDO_WHATSAPP: 'La conversación continúa por WhatsApp.',
    CERRADO: 'Conversación finalizada.',
    ABANDONADO: 'Puedes seguir escribiendo; te seguimos atendiendo.',
  },
  /** Saludos al abrir el chat; rotan en cada apertura. */
  greetings: [
    `Hola, soy el asistente virtual de ${siteName}. ¿En qué te puedo ayudar? Si prefieres hablar con un asesor, pulsa «Hablar con un asesor».`,
    `¡Hola! Puedo contarte sobre nuestras soluciones o ayudarte a contactar a un asesor.`,
  ],
  /** Cuando el chat reaparece tras la inactividad. */
  reminders: [
    '¿Pudimos resolver tu duda? Si necesitas algo más, escríbenos.',
    '¿Sigues ahí? ¿Quieres que te cuente más o prefieres hablar con un asesor?',
  ],
} as const;
