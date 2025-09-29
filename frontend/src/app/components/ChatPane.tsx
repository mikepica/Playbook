'use client';

import { FormEvent, useState, useEffect } from 'react';

import { ChatMessage, ChatThread } from '@/types';
import { MarkdownRenderer } from './MarkdownRenderer';
import styles from './ChatPane.module.css';

interface Props {
  threads: ChatThread[];
  selectedThreadId?: string | null;
  onSelectThread: (id: string) => void;
  onCreateThread: (chatType?: 'playbook' | 'project') => Promise<string | undefined> | void;
  messages: ChatMessage[];
  onSendMessage: (content: string, chatType?: 'playbook' | 'project') => Promise<void>;
  isSending: boolean;
  defaultChatType?: 'playbook' | 'project';
}

export function ChatPane({
  threads,
  selectedThreadId,
  onSelectThread,
  onCreateThread,
  messages,
  onSendMessage,
  isSending,
  defaultChatType = 'playbook'
}: Props) {
  const [draft, setDraft] = useState('');
  const [currentChatType, setCurrentChatType] = useState<'playbook' | 'project'>(defaultChatType);
  const [isVisible, setIsVisible] = useState(true);

  const isSubmitDisabled = isSending || !draft.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }
    await onSendMessage(draft.trim(), currentChatType);
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

  function handleCreateNewThread() {
    onCreateThread(currentChatType);
  }

  function handleChatTypeToggle(newType: 'playbook' | 'project') {
    setCurrentChatType(newType);

    // Filter threads for the new type
    const newFilteredThreads = threads.filter(thread =>
      (thread.chat_type || 'playbook') === newType
    );

    // Check if current thread is valid for the new type
    const currentThreadValid = selectedThreadId &&
      newFilteredThreads.some(t => t.id === selectedThreadId);

    if (!currentThreadValid) {
      // Current thread doesn't belong to new type, select first available or clear
      if (newFilteredThreads.length > 0) {
        onSelectThread(newFilteredThreads[0].id);
      } else {
        onSelectThread(''); // Clear selection - will show empty state
      }
    }
  }

  // Filter threads by current chat type
  const filteredThreads = threads.filter(thread =>
    (thread.chat_type || 'playbook') === currentChatType
  );

  // Handle changes in filtered threads to ensure selected thread is valid
  useEffect(() => {
    // Only run this effect if we have a selected thread and filtered threads have been calculated
    if (selectedThreadId && filteredThreads.length >= 0) {
      const currentThreadValid = filteredThreads.some(t => t.id === selectedThreadId);

      if (!currentThreadValid) {
        // Current thread is not in the filtered list
        if (filteredThreads.length > 0) {
          // Auto-select the first available thread of the current type
          onSelectThread(filteredThreads[0].id);
        } else {
          // No threads available for current type, clear selection
          onSelectThread('');
        }
      }
    }
  }, [filteredThreads, selectedThreadId, onSelectThread]);

  const placeholderText = currentChatType === 'project'
    ? "Ask a question about project documents..."
    : "Ask a question about the SOP...";

  if (!isVisible) {
    return (
      <div className={styles.hiddenContainer}>
        <button
          type="button"
          className={styles.showButton}
          onClick={() => setIsVisible(true)}
          title="Show Chat"
        >
          💬
        </button>
      </div>
    );
  }

  return (
    <aside className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>{currentChatType === 'project' ? 'Project Chat' : 'Playbook Chat'}</h2>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.chatTypeToggle}>
            <button
              type="button"
              className={`${styles.toggleButton} ${currentChatType === 'project' ? styles.active : ''}`}
              onClick={() => handleChatTypeToggle('project')}
            >
              Project Chat
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${currentChatType === 'playbook' ? styles.active : ''}`}
              onClick={() => handleChatTypeToggle('playbook')}
            >
              Playbook Chat
            </button>
          </div>
          <button
            type="button"
            className={styles.hideButton}
            onClick={() => setIsVisible(false)}
            title="Hide Chat"
          >
            ✕
          </button>
        </div>
      </header>

      <div className={styles.threadControls}>
        <button type="button" className={styles.primaryButton} onClick={handleCreateNewThread}>
          New Thread
        </button>
      </div>

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
          {filteredThreads.map((thread) => (
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
          placeholder={placeholderText}
          rows={3}
        />
        <button type="submit" className={styles.primaryButton} disabled={isSubmitDisabled}>
          {isSending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </aside>
  );
}
