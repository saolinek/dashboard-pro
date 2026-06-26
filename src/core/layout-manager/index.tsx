'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ModuleConfig, moduleRegistry } from '@/core/registry';
import {
  CELL_SIZE,
  COLUMN_WIDTH,
  GRID_GAP,
  LOGICAL_COLUMNS,
  MIN_GRID_ROWS,
  isValidColumnTarget,
  moveItemToGridTarget,
} from '@/core/layout-utils';
import { Card } from '@/shared/ui/Card';
import { SortableModule } from './SortableModule';
import styles from './LayoutManager.module.css';

interface LayoutManagerProps {
  layout: ModuleConfig[];
  isResizeMode?: boolean;
  onChange: (newLayout: ModuleConfig[]) => void;
  onResize?: (id: string, width: number, height: number) => void;
}

const CELL_ID_PREFIX = 'cell:';
const COMPACT_LAYOUT_QUERY = '(max-width: 900px)';

type GridTarget = {
  column: number;
  y: number;
};

const columnCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : rectIntersection(args);
};

function getCellId(column: number, y: number) {
  return `${CELL_ID_PREFIX}${column}:${y}`;
}

function parseCellId(id: UniqueIdentifier) {
  const textId = String(id);
  if (!textId.startsWith(CELL_ID_PREFIX)) {
    return null;
  }

  const [columnText, yText] = textId.slice(CELL_ID_PREFIX.length).split(':');
  const column = Number(columnText);
  const y = Number(yText);

  if (!Number.isInteger(column) || !Number.isInteger(y)) {
    return null;
  }

  return { column, y };
}

function getGridRows(layout: ModuleConfig[]) {
  const bottom = layout.reduce((max, item) => {
    return Math.max(max, (item.y ?? 0) + (item.h ?? 1));
  }, 0);

  return Math.max(MIN_GRID_ROWS, bottom + 4);
}

function useCompactLayout() {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(COMPACT_LAYOUT_QUERY);
    const updateCompactState = () => setIsCompact(query.matches);

    updateCompactState();
    query.addEventListener('change', updateCompactState);

    return () => query.removeEventListener('change', updateCompactState);
  }, []);

  return isCompact;
}

function getCompactLayout(layout: ModuleConfig[]) {
  let nextY = 0;

  return [...layout]
    .sort((a, b) => {
      const yDiff = (a.y ?? 0) - (b.y ?? 0);
      return yDiff !== 0 ? yDiff : (a.x ?? 0) - (b.x ?? 0);
    })
    .map((item) => {
      const compactItem = {
        ...item,
        x: 0,
        y: nextY,
        w: COLUMN_WIDTH,
        h: item.h ?? 1,
      };

      nextY += compactItem.h;
      return compactItem;
    });
}

const DropCell: React.FC<{
  column: number;
  y: number;
  isDragging: boolean;
  activeTarget: GridTarget | null;
}> = ({ column, y, isDragging, activeTarget }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: getCellId(column, y),
  });
  const isActiveColumn = activeTarget?.column === column;
  const isInsertTarget = isActiveColumn && activeTarget?.y === y;

  return (
    <div
      ref={setNodeRef}
      className={[
        styles.dropCell,
        isDragging ? styles.dropCellDragging : '',
        isActiveColumn ? styles.dropCellActiveColumn : '',
        isInsertTarget ? styles.dropCellInsertTarget : '',
        isOver ? styles.dropCellOver : '',
      ].filter(Boolean).join(' ')}
      style={{
        gridColumn: `${column * COLUMN_WIDTH + 1} / span ${COLUMN_WIDTH}`,
        gridRow: `${y + 1} / span 1`,
      }}
    />
  );
};

export const LayoutManager: React.FC<LayoutManagerProps> = ({
  layout,
  isResizeMode = false,
  onChange,
  onResize,
}) => {
  const isCompactLayout = useCompactLayout();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overTarget, setOverTarget] = useState<GridTarget | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
    const activeItem = layout.find((item) => item.id === event.active.id);

    if (activeItem) {
      setOverTarget({
        column: Math.max(0, Math.min(LOGICAL_COLUMNS - 1, Math.round((activeItem.x ?? 0) / COLUMN_WIDTH))),
        y: activeItem.y ?? 0,
      });
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const activeItem = layout.find((item) => item.id === event.active.id);
    const target = event.over ? parseCellId(event.over.id) : null;

    if (activeItem && target && isValidColumnTarget(activeItem, target.column, target.y)) {
      setOverTarget(target);
      return;
    }

    setOverTarget(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const target = over ? parseCellId(over.id) : overTarget;
    const activeItem = layout.find((item) => item.id === active.id);

    if (activeItem && target) {
      if (isValidColumnTarget(activeItem, target.column, target.y)) {
        onChange(moveItemToGridTarget(layout, String(active.id), target.column, target.y));
      }
    }
    
    setActiveId(null);
    setOverTarget(null);
  }

  function handleDragCancel() {
    setActiveId(null);
    setOverTarget(null);
  }

  const activeConfig = activeId ? layout.find(item => item.id === activeId) : null;
  const activeModuleDef = activeConfig ? moduleRegistry.get(activeConfig.type) : null;
  const ActiveComponent = activeModuleDef?.component;
  const previewTarget = !isCompactLayout && activeConfig && overTarget && isValidColumnTarget(activeConfig, overTarget.column, overTarget.y)
    ? overTarget
    : null;
  const displayedLayout = useMemo(() => {
    if (isCompactLayout) {
      return getCompactLayout(layout);
    }

    return activeId && previewTarget
      ? moveItemToGridTarget(layout, String(activeId), previewTarget.column, previewTarget.y)
      : layout;
  }, [activeId, isCompactLayout, layout, previewTarget]);
  const gridRows = getGridRows(displayedLayout);
  const cells = isCompactLayout ? [] : Array.from({ length: LOGICAL_COLUMNS * gridRows }, (_, index) => ({
    column: index % LOGICAL_COLUMNS,
    y: Math.floor(index / LOGICAL_COLUMNS),
  }));

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={columnCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={[styles.grid, isCompactLayout ? styles.gridCompact : ''].filter(Boolean).join(' ')}>
        {cells.map((cell) => (
          <DropCell
            key={getCellId(cell.column, cell.y)}
            column={cell.column}
            y={cell.y}
            isDragging={Boolean(activeId)}
            activeTarget={previewTarget}
          />
        ))}
        {displayedLayout.map((moduleConfig) => (
          <SortableModule
            key={moduleConfig.id}
            config={moduleConfig}
            isDragActive={moduleConfig.id === activeId}
            isDragEnabled={!isCompactLayout}
            isResizeMode={isResizeMode}
            onResize={onResize}
          />
        ))}
      </div>
      <DragOverlay
        adjustScale={false}
        dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {activeConfig && activeModuleDef && ActiveComponent ? (
          <div
            className={styles.dragOverlay}
            style={{
              width: (activeConfig.w ?? 1) * CELL_SIZE + ((activeConfig.w ?? 1) - 1) * GRID_GAP,
              height: (activeConfig.h ?? 1) * CELL_SIZE + ((activeConfig.h ?? 1) - 1) * GRID_GAP,
            }}
          >
            <Card title={activeModuleDef.name}>
              <ActiveComponent {...(activeConfig.props || {})} />
            </Card>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
