import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FontanaChatClient } from '../fontanachat-client';
import type { PublicConfig } from '../fontanachat-client';
import { ChatWidget } from './ChatWidget';

const API = 'https://api.test';
const SLUG = 'koel-abogados';
const WA = 'https://wa.me/573000000000?text=Hola';

const baseConfig: PublicConfig = {
  company: { slug: SLUG, name: 'KOEL Abogados' },
  available: true,
  buttons: [
    { key: 'juridico', label: 'Jurídico', color: '#111111', textColor: '#ffffff', available: false },
    { key: 'cartera', label: 'Cartera', color: '#b0062b', textColor: '#ffffff', available: true },
  ],
};

type Handler = (body: any) => { status?: number; body?: unknown } | Promise<never>;
interface Call {
  method: string;
  path: string;
  body: any;
}

/** fetch simulado de la API pública: responde por ruta y registra cada llamada. */
function fakeApi(overrides: Record<string, Handler> = {}) {
  const calls: Call[] = [];
  const routes: Record<string, Handler> = {
    'POST /sessions': () => ({ body: { token: 'tok', expiresAt: new Date(Date.now() + 3_600_000).toISOString() } }),
    'GET /config': () => ({ body: baseConfig }),
    'POST /events': () => ({ body: { ok: true } }),
    'GET /conversation': () => ({ body: { conversation: null, messages: [] } }),
    'POST /conversation/ping': () => ({ body: { ok: true } }),
    'POST /chat': () => ({ body: { type: 'answer', message: 'Respuesta' } }),
    'POST /handoffs': () => ({ body: { handoffId: 'h1', replayed: false, advisorName: 'Laura', waUrl: WA, summary: {} } }),
    'POST /handoffs/h1/whatsapp-click': () => ({ body: { ok: true } }),
    ...overrides,
  };
  const fetch = vi.fn(async (url: string, init: RequestInit) => {
    const path = url.replace(`${API}/api/v1/public/${SLUG}`, '');
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method: init.method ?? 'GET', path, body });
    const handler = routes[`${init.method} ${path}`];
    if (!handler) return { ok: false, status: 404, json: async () => ({ error: { code: 'not_found', message: 'No encontrado' } }) };
    const r = await handler(body);
    const status = r.status ?? 200;
    return { ok: status < 400, status, json: async () => r.body };
  });
  const client = new FontanaChatClient({ baseUrl: API, slug: SLUG, fetch: fetch as unknown as typeof globalThis.fetch, storage: null });
  const called = (method: string, path: string) => calls.filter((c) => c.method === method && c.path === path);
  return { client, calls, called };
}

const renderChat = (client: FontanaChatClient) => render(<ChatWidget client={client} autoOpen={false} reconnectMs={50} />);

async function openAndAsk(text: string) {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: /abrir chat/i }));
  await user.type(screen.getByRole('textbox', { name: /escribe tu mensaje/i }), text);
  await user.click(screen.getByRole('button', { name: /enviar mensaje/i }));
  return user;
}

/** Ningún enlace wa.me en la página que no haya entregado el servidor. */
const waLinks = () =>
  Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href') ?? '').filter((h) => h.includes('wa.me'));

beforeEach(() => {
  vi.stubGlobal('WebSocket', undefined); // el chat en vivo usa sondeo en las pruebas
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ChatWidget (Fontanachat)', () => {
  it('al cargar crea la sesión, lee la configuración y registra page_view con la ruta', async () => {
    const api = fakeApi();
    renderChat(api.client);
    expect(await screen.findByRole('button', { name: /abrir chat/i })).toBeInTheDocument();
    expect(api.called('POST', '/sessions')).toHaveLength(1);
    await waitFor(() => expect(api.called('POST', '/events').map((c) => c.body)).toContainEqual({ type: 'page_view', path: '/' }));
  });

  it('no se muestra si la API no responde (el sitio sigue igual)', async () => {
    const api = fakeApi({ 'POST /sessions': () => Promise.reject(new TypeError('Failed to fetch')) });
    renderChat(api.client);
    await waitFor(() => expect(api.called('POST', '/sessions').length).toBeGreaterThan(1));
    expect(screen.queryByRole('button', { name: /abrir chat/i })).toBeNull();
  });

  it('respuesta answer: muestra el mensaje como texto y el enlace a la sección', async () => {
    const api = fakeApi({
      'POST /chat': () => ({
        body: { type: 'answer', message: 'Ofrecemos <b>acompañamiento</b>', link: { title: 'Soluciones', url: '/#soluciones' } },
      }),
    });
    renderChat(api.client);
    await openAndAsk('¿Qué hacen?');

    expect(await screen.findByText('Ofrecemos <b>acompañamiento</b>')).toBeInTheDocument();
    expect(document.querySelector('.chat b')).toBeNull();
    expect(screen.getByRole('link', { name: /Ver más: Soluciones/ })).toHaveAttribute('href', '/#soluciones');
    const [chat] = api.called('POST', '/chat');
    expect(chat.body).toMatchObject({ message: '¿Qué hacen?', live: true, history: [] });
    expect(api.called('POST', '/events').map((c) => c.body.type)).toContain('chat_open');
    expect(waLinks()).toEqual([]);
  });

  it('handoff_offer con waUrl: botón «Continuar en WhatsApp» que avisa el clic', async () => {
    const api = fakeApi({
      'POST /chat': () => ({ body: { type: 'handoff_offer', message: 'Te paso con un asesor', waUrl: WA, handoffId: 'h1' } }),
    });
    renderChat(api.client);
    const user = await openAndAsk('Quiero un asesor');

    const link = await screen.findByRole('link', { name: /Continuar en WhatsApp/ });
    expect(link).toHaveAttribute('href', WA);
    expect(link).toHaveAttribute('target', '_blank');
    link.addEventListener('click', (e) => e.preventDefault());
    await user.click(link);
    await waitFor(() => expect(api.called('POST', '/handoffs/h1/whatsapp-click')).toHaveLength(1));
    expect(waLinks()).toEqual([WA]);
  });

  it('ignora cualquier enlace de WhatsApp que no empiece por https://wa.me/', async () => {
    const api = fakeApi({
      'POST /chat': () => ({
        body: { type: 'fallback', message: 'No pude responder', waUrl: 'javascript:alert(1)//wa.me/57300', handoffId: 'x' },
      }),
      'GET /conversation': () => ({
        body: {
          conversation: { id: 'c1', status: 'BOT_ACTIVO', portfolio_id: null, current_advisor_id: null },
          messages: [
            { id: 'm1', sender_type: 'SYSTEM', content: 'Aviso', metadata: { waUrl: 'http://wa.me/57300' }, created_at: '' },
          ],
        },
      }),
    });
    renderChat(api.client);
    await openAndAsk('Hola');
    expect(await screen.findByText('No pude responder')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).toBeNull();
    expect(waLinks()).toEqual([]);
  });

  it('«Hablar con un asesor»: usa el primer botón disponible, crea la derivación y abre el waUrl del servidor', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const api = fakeApi();
    renderChat(api.client);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /abrir chat/i }));
    await user.click(screen.getByRole('button', { name: 'Hablar con un asesor' }));

    await waitFor(() => expect(open).toHaveBeenCalledWith(WA, '_blank', 'noopener,noreferrer'));
    expect(api.called('POST', '/events').map((c) => c.body)).toContainEqual({ type: 'button_click', buttonKey: 'cartera' });
    expect(api.called('POST', '/handoffs')[0].body).toEqual({ buttonKey: 'cartera' });
    expect(api.called('POST', '/handoffs/h1/whatsapp-click')).toHaveLength(1);
    expect(await screen.findByRole('link', { name: /Continuar en WhatsApp/ })).toHaveAttribute('href', WA);
    // No pide datos personales para ir a WhatsApp.
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('sin asesores (config.available = false): lo avisa y no ofrece WhatsApp', async () => {
    const api = fakeApi({ 'GET /config': () => ({ body: { ...baseConfig, available: false } }) });
    renderChat(api.client);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /abrir chat/i }));
    expect(await screen.findByText(/no hay asesores disponibles/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hablar con un asesor' })).toBeNull();
    expect(waLinks()).toEqual([]);
  });

  it('409 no_advisor_available: mensaje de sin asesores y sin «Reintentar»', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    const api = fakeApi({
      'POST /handoffs': () => ({ status: 409, body: { error: { code: 'no_advisor_available', message: 'Sin asesores' } } }),
    });
    renderChat(api.client);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /abrir chat/i }));
    await user.click(screen.getByRole('button', { name: 'Hablar con un asesor' }));

    expect((await screen.findAllByText(/no hay asesores disponibles/i)).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Reintentar/ })).toBeNull();
    expect(window.open).not.toHaveBeenCalled();
    expect(waLinks()).toEqual([]);
  });

  it('error de red: muestra «Reintentar» y al pulsarlo vuelve a enviar', async () => {
    let fail = true;
    const api = fakeApi({
      'POST /chat': () => {
        if (fail) return Promise.reject(new TypeError('Failed to fetch'));
        return { body: { type: 'answer', message: 'Ahora sí' } };
      },
    });
    renderChat(api.client);
    const user = await openAndAsk('Hola');

    expect(await screen.findByRole('alert')).toHaveTextContent(/No pudimos conectar/);
    fail = false;
    await user.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByText('Ahora sí')).toBeInTheDocument();
    expect(api.called('POST', '/chat')).toHaveLength(2);
    expect(waLinks()).toEqual([]);
  });

  it('401 persistente: reinicia la conversación con una sesión nueva', async () => {
    const api = fakeApi({ 'POST /chat': () => ({ status: 401, body: { error: { code: 'unauthorized', message: 'Token' } } }) });
    renderChat(api.client);
    await openAndAsk('Hola');

    expect(await screen.findByText(/Tu sesión expiró/)).toBeInTheDocument();
    expect(screen.queryByText('Hola')).toBeNull();
    expect(screen.queryByRole('button', { name: /Reintentar/ })).toBeNull();
  });

  it('al recargar recupera el historial de la conversación', async () => {
    const api = fakeApi({
      'GET /conversation': () => ({
        body: {
          conversation: { id: 'c1', status: 'TOMADO_POR_ASESOR', portfolio_id: null, current_advisor_id: 'a1', agent_name: 'Laura' },
          messages: [
            { id: '1', sender_type: 'USER', content: 'Necesito ayuda', created_at: '' },
            { id: '2', sender_type: 'ADVISOR', advisor_name: 'Laura', content: 'Hola, soy Laura', created_at: '' },
          ],
        },
      }),
    });
    renderChat(api.client);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /abrir chat/i }));

    expect(await screen.findByText('Hola, soy Laura')).toBeInTheDocument();
    expect(screen.getByText('Necesito ayuda')).toBeInTheDocument();
    expect(screen.getByText(/Te atiende en vivo: Laura/)).toBeInTheDocument();
  });
});
