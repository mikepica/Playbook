'use client';

import { SOPSummary } from '@/types';
import styles from './AppHeader.module.css';

interface Props {
  items: SOPSummary[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  onAddSOP: () => void;
}

export function AppHeader({ items, selectedId, onSelect, onRefresh, onAddSOP }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>PMO Playbook</div>
      <nav className={styles.nav}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.sopButton} ${selectedId === item.id ? styles.active : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <span className={styles.title}>{item.title}</span>
            <span className={styles.meta}>v{item.version}</span>
          </button>
        ))}
      </nav>
      <div className={styles.actions}>
        <button className={styles.addButton} type="button" onClick={onAddSOP}>
          New SOP
        </button>
        <button className={styles.refreshButton} type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>
    </header>
  );
}
