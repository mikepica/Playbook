'use client';

import { FormEvent, useState } from 'react';

import { ChatMessage, ChatThread } from '@/types';
import { MarkdownRenderer } from './MarkdownRenderer';
import styles from './ChatPane.module.css';

interface Props {
  threads: ChatThread[];
  selectedThreadId?: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: () => Promise<string | undefined> | void;
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
  isSending: boolean;
}

export function ChatPane({
  threads,
  selectedThreadId,
  onSelectThread,
  onCreateThread,
  messages,
  onSendMessage,
  isSending
}: Props) {
  const [draft, setDraft] = useState('');

  const isSubmitDisabled = isSending || !draft.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }
    await onSendMessage(draft.trim());
    setDraft('');
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isSubmitDisabled) {
        handleSubmit(event as any);
      }
    }
  }

  return (
    <aside className={styles.container}>
      <header className={styles.header}>
        <h2>Ask the AI</h2>
        <button type="button" className={styles.primaryButton} onClick={onCreateThread}>
          New Thread
        </button>
      </header>

      <div className={styles.threadSelector}>
        <label htmlFor="thread-select">Conversation</label>
        <select
          id="thread-select"
          value={selectedThreadId ?? ''}
          onChange={(event) => onSelectThread(event.target.value)}
        >
          <option value="" disabled>
            Choose a thread
          </option>
          {threads.map((thread) => (
            <option key={thread.id} value={thread.id}>
              {thread.title}
            </option>
          ))}
        </select>
      </div>

      <section className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.empty}>Start a conversation to see AI responses.</div>
        ) : (
          messages.map((message) => (
            <article key={message.id} className={`${styles.message} ${styles[message.role]}`}>
              <span className={styles.role}>{message.role === 'user' ? 'You' : 'Assistant'}</span>
              <div className={styles.messageContent}>
                <MarkdownRenderer>{message.content}</MarkdownRenderer>
              </div>
            </article>
          ))
        )}
      </section>

      <form className={styles.composer} onSubmit={handleSubmit}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the SOP..."
          rows={3}
        />
        <button type="submit" className={styles.primaryButton} disabled={isSubmitDisabled}>
          {isSending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </aside>
  );
}
