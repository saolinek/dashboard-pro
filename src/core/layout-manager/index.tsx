'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ModuleConfig, moduleRegistry } from '@/core/registry';
import { Card } from '@/shared/ui/Card';
import { SortableModule } from './SortableModule';
import styles from './LayoutManager.module.css';

interface LayoutManagerProps {
  layout: ModuleConfig[];
  onChange: (newLayout: ModuleConfig[]) => void;
}

const LOGICAL_COLUMNS = 4;
const COLUMN_WIDTH = 2;
const GRID_COLUMNS = LOGICAL_COLUMNS * COLUMN_WIDTH;
const MIN_GRID_ROWS = 8;
const CELL_SIZE = 160;
const GRID_GAP = 20;
const CELL_ID_PREFIX = 'cell:';

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

function isValidColumnTarget(item: ModuleConfig, column: number, y: number) {
  const x = column * COLUMN_WIDTH;
  const width = item.w ?? 1;

  return (
    column >= 0 &&
    column < LOGICAL_COLUMNS &&
    y >= 0 &&
    x + width <= GRID_COLUMNS
  );
}

function getItemColumn(item: ModuleConfig) {
  const x = item.x ?? 0;
  return Math.max(0, Math.min(LOGICAL_COLUMNS - 1, Math.round(x / COLUMN_WIDTH)));
}

function packColumns(columns: ModuleConfig[][]) {
  return columns.flatMap((items, column) => {
    let y = 0;

    return items.map((item) => {
      const packed = {
        ...item,
        x: column * COLUMN_WIDTH,
        y,
      };

      y += item.h ?? 1;
      return packed;
    });
  });
}

function moveItemToColumn(layout: ModuleConfig[], activeId: UniqueIdentifier, column: number, y: number) {
  const activeItem = layout.find((item) => item.id === activeId);

  if (!activeItem) {
    return layout;
  }

  const columns = Array.from({ length: LOGICAL_COLUMNS }, () => [] as ModuleConfig[]);

  for (const item of layout) {
    if (item.id === activeId) {
      continue;
    }

    columns[getItemColumn(item)].push(item);
  }

  for (const items of columns) {
    items.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
  }

  const targetItems = columns[column];
  const insertIndex = targetItems.findIndex((item) => y <= (item.y ?? 0));

  targetItems.splice(insertIndex === -1 ? targetItems.length : insertIndex, 0, {
    ...activeItem,
    x: column * COLUMN_WIDTH,
  });

  return packColumns(columns);
}

function getGridRows(layout: ModuleConfig[]) {
  const bottom = layout.reduce((max, item) => {
    return Math.max(max, (item.y ?? 0) + (item.h ?? 1));
  }, 0);

  return Math.max(MIN_GRID_ROWS, bottom + 4);
}

const DropCell: React.FC<{ column: number; y: number }> = ({ column, y }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: getCellId(column, y),
  });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.dropCell} ${isOver ? styles.dropCellOver : ''}`}
      style={{
        gridColumn: `${column * COLUMN_WIDTH + 1} / span ${COLUMN_WIDTH}`,
        gridRow: `${y + 1} / span 1`,
      }}
    />
  );
};

export const LayoutManager: React.FC<LayoutManagerProps> = ({ layout, onChange }) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

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
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const target = over ? parseCellId(over.id) : null;
    const activeItem = layout.find((item) => item.id === active.id);

    if (activeItem && target) {
      if (isValidColumnTarget(activeItem, target.column, target.y)) {
        onChange(moveItemToColumn(layout, active.id, target.column, target.y));
      }
    }
    
    setActiveId(null);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  const activeConfig = activeId ? layout.find(item => item.id === activeId) : null;
  const activeModuleDef = activeConfig ? moduleRegistry.get(activeConfig.type) : null;
  const ActiveComponent = activeModuleDef?.component;
  const gridRows = getGridRows(layout);
  const cells = Array.from({ length: LOGICAL_COLUMNS * gridRows }, (_, index) => ({
    column: index % LOGICAL_COLUMNS,
    y: Math.floor(index / LOGICAL_COLUMNS),
  }));

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={styles.grid}>
        {cells.map((cell) => (
          <DropCell key={getCellId(cell.column, cell.y)} column={cell.column} y={cell.y} />
        ))}
        {layout.map((moduleConfig) => (
          <SortableModule key={moduleConfig.id} config={moduleConfig} />
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
