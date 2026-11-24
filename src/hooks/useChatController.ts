import { useCallback, useEffect, useRef, useState } from 'react';
import { createAutoOpen } from '../fontanachat-client';
import type {
  ConversationSnapshot,
  ConversationStatus,
  FontanaChatClient,
  PublicConfig,
} from '../fontanachat-client';
import { chatText as t } from '../config/chatText';
import { describeApiError, isWaUrl, setChatReady } from '../lib/chat';

/** Métodos del cliente oficial que usa el widget (permite pasar un cliente con fetch simulado en pruebas). */
export type ChatClientLike = Pick<
  FontanaChatClient,
  | 'ensureSession'
  | 'getConfig'
  | 'track'
  | 'chat'
  | 'ping'
  | 'getConversation'
  | 'watchConversation'
  | 'createHandoff'
  | 'whatsappClicked'
  | 'resetSession'
>;

export type Sender = 'USER' | 'BOT' | 'ADVISOR' | 'SYSTEM';

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  advisorName?: string | null;
  link?: { title: string; url: string };
  /** Enlace de WhatsApp tal como lo entrega el servidor (nunca se construye en el sitio). */
  whatsapp?: { url: string; handoffId: string | null };
  /** Aviso local (sin asesores, respaldo): no se envía como historial. */
  notice?: boolean;
  /** Saludo o recordatorio local: no se envía como historial. */
  greeting?: boolean;
}

export interface ChatError {
  message: string;
  retry: (() => void) | null;
}

export interface ChatControllerOptions {
  /** `false` desactiva la apertura automática (por defecto: al cargar y tras 2 min de inactividad). */
  autoOpen?: false | { idleMs?: number; openDelayMs?: number };
  /** Espera entre reintentos de conexión mientras la API no responde (en frío puede tardar). */
  reconnectMs?: number;
}

const LIVE: readonly ConversationStatus[] = ['EN_ESPERA_ASESOR', 'TOMADO_POR_ASESOR'];
/** ABANDONADO no termina el chat: la API lo reabre si la persona vuelve a escribir. */
const FINISHED: readonly ConversationStatus[] = ['CERRADO', 'REMITIDO_WHATSAPP'];
const PING_EVERY_MS = 30_000;
const ACTIVITY = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'] as const;

const currentPath = () => (typeof location !== 'undefined' ? location.pathname : '/');

const fromSnapshot = (snapshot: ConversationSnapshot): ChatMessage[] =>
  snapshot.messages.map((m) => ({
    id: `server-${m.id}`,
    sender: m.sender_type,
    text: m.content,
    advisorName: m.advisor_name ?? null,
    ...(isWaUrl(m.metadata?.waUrl) ? { whatsapp: { url: m.metadata.waUrl, handoffId: null } } : {}),
  }));

export function useChatController(client: ChatClientLike, { autoOpen = {}, reconnectMs = 15_000 }: ChatControllerOptions = {}) {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [openedBy, setOpenedBy] = useState<'manual' | 'auto'>('manual');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [connectingAdvisor, setConnectingAdvisor] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [status, setStatus] = useState<ConversationStatus | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);

  const connected = config !== null;
  const isFinished = status !== null && FINISHED.includes(status);

  const nextId = useRef(1);
  const poolTurn = useRef(new Map<readonly string[], number>());
  const messagesRef = useRef<ChatMessage[]>([]);
  const statusRef = useRef<ConversationStatus | null>(null);
  const openRef = useRef(false);
  const stopWatchRef = useRef<(() => void) | null>(null);
  const syncRef = useRef<(s: ConversationSnapshot) => void>(() => undefined);
  const openChatRef = useRef<(by: 'manual' | 'auto') => void>(() => undefined);
  const autoRef = useRef<ReturnType<typeof createAutoOpen> | null>(null);
  const autoOpenedOnce = useRef(false);
  const lastPing = useRef(0);

  messagesRef.current = messages;
  statusRef.current = status;

  const push = useCallback((m: Omit<ChatMessage, 'id'>) => {
    const id = `local-${nextId.current++}`;
    setMessages((cur) => [...cur, { ...m, id }]);
  }, []);

  const pushFrom = useCallback(
    (pool: readonly string[]) => {
      const n = poolTurn.current.get(pool) ?? 0;
      poolTurn.current.set(pool, n + 1);
      push({ sender: 'BOT', text: pool[n % pool.length], greeting: true });
    },
    [push],
  );

  /* ---------- Chat en vivo ---------- */
  const stopWatching = useCallback(() => {
    stopWatchRef.current?.();
    stopWatchRef.current = null;
  }, []);

  const startWatching = useCallback(() => {
    if (stopWatchRef.current || !openRef.current) return;
    stopWatchRef.current = client.watchConversation((s) => syncRef.current(s));
  }, [client]);

  /** Pinta el historial del servidor y conserva los mensajes locales que aún no están guardados. */
  const sync = useCallback(
    (snapshot: ConversationSnapshot) => {
      const state = snapshot.conversation?.status ?? null;
      setStatus(state);
      setAgentName(state === 'TOMADO_POR_ASESOR' ? (snapshot.conversation?.agent_name ?? null) : null);
      const server = fromSnapshot(snapshot);
      setMessages((cur) => {
        const seen = new Set(server.map((m) => `${m.sender}|${m.text}`));
        const pending = cur.filter((m) => m.id.startsWith('local-') && !m.greeting && !seen.has(`${m.sender}|${m.text}`));
        const greetings = server.length === 0 ? cur.filter((m) => m.greeting) : [];
        return [...greetings, ...server, ...pending];
      });
      if (state && FINISHED.includes(state)) stopWatching();
      else if (state) startWatching();
    },
    [startWatching, stopWatching],
  );
  syncRef.current = sync;

  const restore = useCallback(() => {
    client
      .getConversation()
      .then((s) => {
        if (s.conversation) syncRef.current(s);
      })
      .catch(() => undefined);
  }, [client]);

  /* ---------- Conexión: sesión, configuración, page_view e historial ---------- */
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const connect = async () => {
      try {
        await client.ensureSession();
        const cfg = await client.getConfig();
        if (cancelled) return;
        setConfig(cfg);
        void client.track('page_view', { path: currentPath() });
        restore(); // al recargar, recupera la conversación de esta pestaña
      } catch {
        if (!cancelled) timer = setTimeout(connect, reconnectMs);
      }
    };
    void connect();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopWatchRef.current?.();
      stopWatchRef.current = null;
    };
  }, [client, reconnectMs, restore]);

  useEffect(() => {
    setChatReady(connected);
    return () => setChatReady(false);
  }, [connected]);

  /* ---------- Errores ---------- */
  const restartConversation = useCallback(() => {
    stopWatching();
    client.resetSession();
    setMessages([]);
    setStatus(null);
    setAgentName(null);
    setError(null);
  }, [client, stopWatching]);

  const handleError = useCallback(
    (cause: unknown, retry: () => void) => {
      const info = describeApiError(cause);
      if (info.noAdvisor) {
        push({ sender: 'SYSTEM', text: info.message, notice: true });
        setConfig((c) => (c ? { ...c, available: false } : c));
        return;
      }
      if (info.restart) {
        restartConversation();
        push({ sender: 'SYSTEM', text: info.message, notice: true });
        return;
      }
      setError({ message: info.message, retry: info.retryable ? retry : null });
    },
    [push, restartConversation],
  );

  /* ---------- Mensajes ---------- */
  const ask = useCallback(
    (text: string) => {
      const history = messagesRef.current
        .filter((m) => !m.notice && !m.greeting && m.sender !== 'SYSTEM')
        .map((m) => ({ role: m.sender === 'USER' ? ('user' as const) : ('assistant' as const), content: m.text }));
      setSending(true);
      setError(null);
      client
        .chat(text, history)
        .then((reply) => {
          push({
            sender: reply.type === 'live' ? 'SYSTEM' : 'BOT',
            text: reply.message,
            ...(reply.type === 'answer' && reply.link ? { link: reply.link } : {}),
            ...(isWaUrl(reply.waUrl) ? { whatsapp: { url: reply.waUrl, handoffId: reply.handoffId ?? null } } : {}),
            ...(reply.type === 'fallback' ? { notice: true } : {}),
          });
          if (reply.conversation) {
            setStatus(reply.conversation.status);
            if (!FINISHED.includes(reply.conversation.status)) startWatching();
          }
        })
        .catch((cause: unknown) => handleError(cause, () => ask(text)))
        .finally(() => setSending(false));
    },
    [client, handleError, push, startWatching],
  );

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || sending || isFinished) return;
    setInput('');
    push({ sender: 'USER', text });
    ask(text);
  }, [ask, input, isFinished, push, sending]);

  /* ---------- Hablar con un asesor (derivación a WhatsApp) ---------- */
  const requestAdvisor = useCallback(async () => {
    if (connectingAdvisor) return;
    setConnectingAdvisor(true);
    setError(null);
    try {
      const cfg = await client.getConfig();
      setConfig(cfg);
      if (!cfg.available) {
        push({ sender: 'SYSTEM', text: t.noAdvisors, notice: true });
        return;
      }
      const button = cfg.buttons.find((b) => b.available);
      if (button) void client.track('button_click', { buttonKey: button.key });
      const handoff = await client.createHandoff(button ? { buttonKey: button.key } : {});
      if (!isWaUrl(handoff.waUrl)) {
        setError({ message: t.errors.generic, retry: null });
        return;
      }
      push({
        sender: 'BOT',
        text: t.handoffReady(handoff.advisorName),
        whatsapp: { url: handoff.waUrl, handoffId: handoff.handoffId },
        notice: true,
      });
      // Se abre WhatsApp; si el navegador bloquea la ventana, queda el botón «Continuar en WhatsApp» en el chat.
      void client.whatsappClicked(handoff.handoffId);
      window.open(handoff.waUrl, '_blank', 'noopener,noreferrer');
    } catch (cause) {
      handleError(cause, () => void requestAdvisor());
    } finally {
      setConnectingAdvisor(false);
    }
  }, [client, connectingAdvisor, handleError, push]);

  const whatsappClicked = useCallback(
    (handoffId: string | null) => {
      if (handoffId) void client.whatsappClicked(handoffId); // sin bloquear la navegación
    },
    [client],
  );

  /* ---------- Abrir y cerrar ---------- */
  const openChat = useCallback(
    (by: 'manual' | 'auto' = 'manual') => {
      if (openRef.current) return;
      openRef.current = true;
      setOpen(true);
      setOpenedBy(by);
      autoRef.current?.notifyOpened();
      void client.track('chat_open');
      // Refresca disponibilidad de asesores al abrir.
      client
        .getConfig()
        .then(setConfig)
        .catch(() => undefined);
      if (messagesRef.current.length === 0) pushFrom(t.greetings);
      else if (by === 'auto' && autoOpenedOnce.current) pushFrom(t.reminders);
      if (by === 'auto') autoOpenedOnce.current = true;
      const state = statusRef.current;
      if (state && !FINISHED.includes(state)) startWatching();
    },
    [client, pushFrom, startWatching],
  );
  openChatRef.current = openChat;

  const closeChat = useCallback(() => {
    openRef.current = false;
    setOpen(false);
    stopWatching();
    autoRef.current?.notifyClosed();
  }, [stopWatching]);

  const newConversation = useCallback(() => {
    restartConversation();
    pushFrom(t.greetings);
  }, [pushFrom, restartConversation]);

  /* ---------- Apertura automática ---------- */
  const autoDisabled = autoOpen === false;
  const idleMs = autoOpen === false ? undefined : autoOpen.idleMs;
  const openDelayMs = autoOpen === false ? undefined : autoOpen.openDelayMs;
  useEffect(() => {
    if (autoDisabled || !connected) return;
    const auto = createAutoOpen({
      open: () => openChatRef.current('auto'),
      isOpen: () => openRef.current,
      ...(idleMs !== undefined ? { idleMs } : {}),
      ...(openDelayMs !== undefined ? { openDelayMs } : {}),
    });
    autoRef.current = auto;
    auto.start();
    return () => {
      auto.destroy();
      autoRef.current = null;
    };
  }, [autoDisabled, connected, idleMs, openDelayMs]);

  /* ---------- Presencia: ping como mucho cada 30 s mientras haya actividad ---------- */
  useEffect(() => {
    const onActivity = () => {
      const state = statusRef.current;
      if (!state || FINISHED.includes(state)) return;
      const now = Date.now();
      if (now - lastPing.current < PING_EVERY_MS) return;
      lastPing.current = now;
      void client.ping();
    };
    ACTIVITY.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => ACTIVITY.forEach((e) => window.removeEventListener(e, onActivity));
  }, [client]);

  const advisorName =
    agentName ?? [...messages].reverse().find((m) => m.sender === 'ADVISOR' && m.advisorName)?.advisorName ?? null;

  return {
    connected,
    open,
    openedBy,
    messages,
    input,
    sending,
    connectingAdvisor,
    error,
    status,
    isFinished,
    live: status !== null && LIVE.includes(status),
    advisorName,
    advisorsAvailable: config?.available ?? true,
    setInput,
    send,
    openChat: () => openChat('manual'),
    closeChat,
    newConversation,
    requestAdvisor,
    whatsappClicked,
  };
}

export type ChatController = ReturnType<typeof useChatController>;
