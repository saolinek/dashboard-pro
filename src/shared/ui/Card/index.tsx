import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  headerAction?: React.ReactNode;
  dragHandleProps?: Record<string, any>; // Used to pass dnd-kit listeners if we have a drag handle
}

export const Card: React.FC<CardProps> = ({ children, className, title, headerAction, dragHandleProps }) => {
  return (
    <div className={`${styles.card} ${className || ''}`}>
      {(title || headerAction || dragHandleProps) && (
        <div className={styles.header}>
          <div className={styles.dragHandle} {...dragHandleProps}>
             {/* Drag Handle Icon - six dots */}
             <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ pointerEvents: 'none' }}>
               <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
             </svg>
          </div>
          {title && <h3 className={styles.title}>{title}</h3>}
          {headerAction && <div className={styles.action}>{headerAction}</div>}
        </div>
      )}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};
