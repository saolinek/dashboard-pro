import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { moduleRegistry, ModuleConfig } from '@/core/registry';
import {
  CELL_SIZE,
  GRID_GAP,
  LOGICAL_COLUMNS,
  MAX_WIDGET_HEIGHT,
  MIN_WIDGET_HEIGHT,
  getItemColumn,
  logicalColumnsFromWidth,
  widthFromLogicalColumns,
} from '@/core/layout-utils';
import { Card } from '@/shared/ui/Card';
import styles from './LayoutManager.module.css';

interface Props {
  config: ModuleConfig;
  isDragActive?: boolean;
  isDragEnabled?: boolean;
  isResizeMode?: boolean;
  onResize?: (id: string, width: number, height: number) => void;
}

type ResizeAxis = 'width' | 'height';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export const SortableModule: React.FC<Props> = ({
  config,
  isDragActive = false,
  isDragEnabled = true,
  isResizeMode = false,
  onResize,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: config.id, disabled: !isDragEnabled });

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
  const canResize = isResizeMode && isDragEnabled && !isDragActive && Boolean(onResize);
  const dragHandleProps = {
    ...attributes,
    ...(listeners as unknown as React.ButtonHTMLAttributes<HTMLButtonElement> | undefined),
  };
  const activeDragHandleProps = isDragEnabled ? dragHandleProps : undefined;
  const resizeGridStep = CELL_SIZE + GRID_GAP;

  function startResize(event: React.PointerEvent<HTMLButtonElement>, axis: ResizeAxis) {
    if (!onResize) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startLogicalWidth = logicalColumnsFromWidth(config.w);
    const startHeight = config.h ?? MIN_WIDGET_HEIGHT;
    const maxLogicalWidth = LOGICAL_COLUMNS - getItemColumn(config);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaColumns = Math.round((moveEvent.clientX - startX) / resizeGridStep);
      const deltaRows = Math.round((moveEvent.clientY - startY) / resizeGridStep);
      const nextLogicalWidth = axis === 'height'
        ? startLogicalWidth
        : clamp(startLogicalWidth + deltaColumns, 1, maxLogicalWidth);
      const nextHeight = axis === 'width'
        ? startHeight
        : clamp(startHeight + deltaRows, MIN_WIDGET_HEIGHT, MAX_WIDGET_HEIGHT);

      onResize(config.id, widthFromLogicalColumns(nextLogicalWidth), nextHeight);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  }

  return (
    <div
      ref={setNodeRef}
      className={[
        styles.sortableItem,
        isDragActive ? styles.dragPlaceholder : '',
        canResize ? styles.resizableItem : '',
      ].filter(Boolean).join(' ')}
      data-module-id={config.id}
      data-module-type={config.type}
      style={style}
    >
      <Card
        title={moduleDef.name}
        className={isDragActive ? styles.placeholderCard : undefined}
        dragHandleProps={activeDragHandleProps}
      >
        {isDragActive ? null : <Component {...(config.props || {})} />}
      </Card>
      {canResize && (
        <div className={styles.resizeFrame} aria-hidden={isDragActive}>
          <button
            type="button"
            className={`${styles.resizeHandle} ${styles.resizeHandleRight}`}
            aria-label={`Změnit šířku widgetu ${moduleDef.name}`}
            onPointerDown={(event) => startResize(event, 'width')}
          />
          <button
            type="button"
            className={`${styles.resizeHandle} ${styles.resizeHandleBottom}`}
            aria-label={`Změnit výšku widgetu ${moduleDef.name}`}
            onPointerDown={(event) => startResize(event, 'height')}
          />
        </div>
      )}
    </div>
  );
};
