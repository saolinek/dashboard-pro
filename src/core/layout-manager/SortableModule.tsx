import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { moduleRegistry, ModuleConfig } from '@/core/registry';
import { Card } from '@/shared/ui/Card';
import styles from './LayoutManager.module.css';

interface Props {
  config: ModuleConfig;
  isDragActive?: boolean;
}

export const SortableModule: React.FC<Props> = ({ config, isDragActive = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: config.id });

  const style: React.CSSProperties = {
    transform: isDragActive ? undefined : CSS.Translate.toString(transform),
    zIndex: isDragging ? 10 : 2,
    gridColumn: `${(config.x ?? 0) + 1} / span ${config.w || 1}`,
    gridRow: `${(config.y ?? 0) + 1} / span ${config.h || 1}`,
    height: '100%',
    width: '100%',
    willChange: isDragging && !isDragActive ? 'transform' : undefined,
    pointerEvents: isDragActive ? 'none' : undefined,
  };

  const moduleDef = moduleRegistry.get(config.type);

  if (!moduleDef) {
    return (
      <div ref={setNodeRef} className={styles.sortableItem} style={style}>
        <Card title="Error">Unknown module: {config.type}</Card>
      </div>
    );
  }

  const Component = moduleDef.component;

  return (
    <div
      ref={setNodeRef}
      className={`${styles.sortableItem} ${isDragActive ? styles.dragPlaceholder : ''}`}
      data-module-id={config.id}
      data-module-type={config.type}
      style={style}
    >
      <Card
        title={moduleDef.name}
        className={isDragActive ? styles.placeholderCard : undefined}
        dragHandleProps={{ ...attributes, ...listeners }}
      >
        {isDragActive ? null : <Component {...(config.props || {})} />}
      </Card>
    </div>
  );
};
