'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ReactNode } from 'react';

import styles from './MarkdownRenderer.module.css';

interface Props {
  children: string;
  className?: string;
}

interface TableProps {
  children?: ReactNode;
}

interface TableRowProps {
  children?: ReactNode;
}

interface TableCellProps {
  children?: ReactNode;
  isHeader?: boolean;
}

interface CodeProps {
  children?: ReactNode;
  className?: string;
  inline?: boolean;
}

const Table = ({ children }: TableProps) => (
  <div className={styles.tableWrapper}>
    <table className={styles.table}>{children}</table>
  </div>
);

const TableRow = ({ children }: TableRowProps) => (
  <tr className={styles.tableRow}>{children}</tr>
);

const TableCell = ({ children, isHeader }: TableCellProps) => {
  const Component = isHeader ? 'th' : 'td';
  return <Component className={isHeader ? styles.tableHeader : styles.tableCell}>{children}</Component>;
};

const Code = ({ children, className, inline }: CodeProps) => {
  if (inline) {
    return <code className={styles.inlineCode}>{children}</code>;
  }
  return <code className={className}>{children}</code>;
};

const Blockquote = ({ children }: { children?: ReactNode }) => (
  <blockquote className={styles.blockquote}>{children}</blockquote>
);

const List = ({ children, ordered }: { children?: ReactNode; ordered?: boolean }) => {
  const Component = ordered ? 'ol' : 'ul';
  return <Component className={styles.list}>{children}</Component>;
};

const ListItem = ({ children }: { children?: ReactNode }) => (
  <li className={styles.listItem}>{children}</li>
);

const Heading = ({ children, level }: { children?: ReactNode; level: 1 | 2 | 3 | 4 | 5 | 6 }) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  return <Component className={styles[`heading${level}`]}>{children}</Component>;
};

const Link = ({ children, href }: { children?: ReactNode; href?: string }) => (
  <a href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

// Component to handle text with citations
const TextWithCitations = ({ children }: { children?: string }) => {
  if (!children || typeof children !== 'string') {
    return <>{children}</>;
  }

  const parts = children.split(/(\[SOP:\s*[^\]]+\])/g);

  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\[SOP:\s*([^\]]+)\]$/);
        if (match) {
          const sopTitle = match[1];
          return (
            <span
              key={index}
              className={styles.sopCitation}
              title={`Source: ${sopTitle}`}
            >
              [{sopTitle}]
            </span>
          );
        }
        return part;
      })}
    </>
  );
};

export function MarkdownRenderer({ children, className }: Props) {
  return (
    <div className={`${styles.markdownContent} ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          table: Table,
          tr: TableRow,
          th: ({ children }) => <TableCell isHeader>{children}</TableCell>,
          td: ({ children }) => <TableCell>{children}</TableCell>,
          code: Code,
          blockquote: Blockquote,
          ul: ({ children }) => <List>{children}</List>,
          ol: ({ children }) => <List ordered>{children}</List>,
          li: ListItem,
          h1: ({ children }) => <Heading level={1}>{children}</Heading>,
          h2: ({ children }) => <Heading level={2}>{children}</Heading>,
          h3: ({ children }) => <Heading level={3}>{children}</Heading>,
          h4: ({ children }) => <Heading level={4}>{children}</Heading>,
          h5: ({ children }) => <Heading level={5}>{children}</Heading>,
          h6: ({ children }) => <Heading level={6}>{children}</Heading>,
          a: Link,
          // Handle text nodes to process citations
          text: ({ children }) => <TextWithCitations>{children}</TextWithCitations>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}