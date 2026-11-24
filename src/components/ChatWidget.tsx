import { useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { chatText as t } from '../config/chatText';
import { useChatController } from '../hooks/useChatController';
import type { ChatClientLike, ChatControllerOptions, Sender } from '../hooks/useChatController';
import { CHAT_OPEN_EVENT, isSafeLink } from '../lib/chat';

interface Props extends ChatControllerOptions {
  client: ChatClientLike;
}

const Icon = ({ d, size = 20 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICON = {
  chat: 'M21 12a8.5 8.5 0 0 1-12.4 7.6L3 21l1.4-5.6A8.5 8.5 0 1 1 21 12Z',
  close: 'M18 6 6 18M6 6l12 12',
  send: 'M5 12h14M13 6l6 6-6 6',
  out: 'M7 17 17 7M8 7h9v9',
  retry: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
};

const senderLabel: Record<Sender, string> = {
  USER: t.youLabel,
  BOT: t.botLabel,
  ADVISOR: t.advisorLabel,
  SYSTEM: t.systemLabel,
};

export function ChatWidget({ client, ...options }: Props) {
  const chat = useChatController(client, options);
  const { open, messages, sending, error, status } = chat;

  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Los CTAs del sitio abren el chat.
  const openFromSite = chat.openChat;
  useEffect(() => {
    window.addEventListener(CHAT_OPEN_EVENT, openFromSite);
    return () => window.removeEventListener(CHAT_OPEN_EVENT, openFromSite);
  }, [openFromSite]);

  useEffect(() => {
    if (open && chat.openedBy === 'manual') inputRef.current?.focus();
  }, [open, chat.openedBy]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending, error, open]);

  if (!chat.connected) return null;

  const close = () => {
    const hadFocus = panelRef.current?.contains(document.activeElement);
    chat.closeChat();
    if (hadFocus) launcherRef.current?.focus();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    chat.send();
  };

  const statusText = status ? t.statuses[status] : null;
  const advisorDisabled = chat.connectingAdvisor || sending || chat.isFinished || chat.live;

  return (
    <div className="chat">
      {open && (
        <div
          ref={panelRef}
          id="chat-panel"
          className="chat__panel"
          role="dialog"
          aria-label={t.panelLabel}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close();
          }}
        >
          <header className="chat__head">
            <div>
              <p className="chat__title">{t.title}</p>
              <p className="chat__subtitle">
                <span className="chat__online" aria-hidden="true" />
                {t.subtitle}
              </p>
            </div>
            <button type="button" className="chat__icon-btn" onClick={close} aria-label={t.close}>
              <Icon d={ICON.close} />
            </button>
          </header>

          {chat.status === 'TOMADO_POR_ASESOR' && (
            <p className="chat__banner" role="status">
              {chat.advisorName ? `${t.liveBy}: ${chat.advisorName}` : t.realPerson}
            </p>
          )}
          {!chat.advisorsAvailable && (
            <p className="chat__banner chat__banner--muted" role="status">
              {t.noAdvisors}
            </p>
          )}

          <div ref={logRef} className="chat__log" role="log" aria-live="polite" aria-relevant="additions">
            {statusText && (
              <p className="chat__status" role="status">
                {statusText}
              </p>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`chat__row chat__row--${m.sender === 'USER' ? 'out' : 'in'}`}>
                <div
                  className={`chat__bubble chat__bubble--${m.sender.toLowerCase()}${m.notice ? ' chat__bubble--notice' : ''}`}
                >
                  <span className="visually-hidden">{senderLabel[m.sender]}: </span>
                  {m.sender === 'ADVISOR' && m.advisorName && <strong className="chat__advisor">{m.advisorName}</strong>}
                  {m.text}
                  {m.link && isSafeLink(m.link.url) && (
                    <a className="chat__more" href={m.link.url}>
                      {t.seeMore}: {m.link.title}
                    </a>
                  )}
                  {m.whatsapp && (
                    <a
                      className="btn btn--whatsapp chat__wa"
                      href={m.whatsapp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => chat.whatsappClicked(m.whatsapp?.handoffId ?? null)}
                    >
                      {t.whatsapp}
                      <Icon d={ICON.out} size={16} />
                      <span className="visually-hidden">{t.newTab}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}

            {(sending || chat.connectingAdvisor) && (
              <div className="chat__row chat__row--in" role="status">
                <div className="chat__bubble chat__bubble--bot chat__typing">
                  <span className="visually-hidden">{chat.connectingAdvisor ? t.connectingAdvisor : t.typing}</span>
                  <i aria-hidden="true" />
                  <i aria-hidden="true" />
                  <i aria-hidden="true" />
                </div>
              </div>
            )}

            {error && !sending && (
              <div className="chat__error" role="alert">
                <p>{error.message}</p>
                {error.retry && (
                  <button type="button" className="chat__chip" onClick={error.retry}>
                    <Icon d={ICON.retry} size={16} />
                    {t.retry}
                  </button>
                )}
              </div>
            )}

            {chat.isFinished && (
              <button type="button" className="chat__chip" onClick={chat.newConversation}>
                <Icon d={ICON.retry} size={16} />
                {t.newConversation}
              </button>
            )}
          </div>

          {chat.advisorsAvailable && (
            <div className="chat__actions">
              <button type="button" className="chat__advisor-btn" onClick={() => void chat.requestAdvisor()} disabled={advisorDisabled}>
                {t.advisorButton}
              </button>
            </div>
          )}

          <form className="chat__form" onSubmit={onSubmit}>
            <label htmlFor="chat-input" className="visually-hidden">
              {t.inputLabel}
            </label>
            <input
              id="chat-input"
              ref={inputRef}
              className="chat__input"
              value={chat.input}
              onChange={(e) => chat.setInput(e.target.value)}
              disabled={chat.isFinished}
              maxLength={1000}
              autoComplete="off"
              placeholder={t.inputPlaceholder}
            />
            <button type="submit" className="chat__send" aria-label={t.send} disabled={sending || chat.isFinished || !chat.input.trim()}>
              <Icon d={ICON.send} />
            </button>
          </form>
          <p className="chat__privacy">{t.privacy}</p>
        </div>
      )}

      <button
        ref={launcherRef}
        type="button"
        className="chat__launcher"
        onClick={() => (open ? close() : chat.openChat())}
        aria-label={open ? t.close : t.launcher}
        aria-expanded={open}
        aria-controls={open ? 'chat-panel' : undefined}
      >
        <Icon d={open ? ICON.close : ICON.chat} size={24} />
      </button>
    </div>
  );
}
