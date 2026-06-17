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

const GRID_COLUMNS = 8;
const MIN_GRID_ROWS = 8;
const CELL_SIZE = 160;
const GRID_GAP = 20;
const CELL_ID_PREFIX = 'cell:';

function getCellId(x: number, y: number) {
  return `${CELL_ID_PREFIX}${x}:${y}`;
}

function parseCellId(id: UniqueIdentifier) {
  const textId = String(id);
  if (!textId.startsWith(CELL_ID_PREFIX)) {
    return null;
  }

  const [xText, yText] = textId.slice(CELL_ID_PREFIX.length).split(':');
  const x = Number(xText);
  const y = Number(yText);

  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return null;
  }

  return { x, y };
}

function collides(a: ModuleConfig, b: ModuleConfig) {
  const ax = a.x ?? 0;
  const ay = a.y ?? 0;
  const bx = b.x ?? 0;
  const by = b.y ?? 0;
  const aw = a.w ?? 1;
  const ah = a.h ?? 1;
  const bw = b.w ?? 1;
  const bh = b.h ?? 1;

  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function canPlace(item: ModuleConfig, layout: ModuleConfig[], x: number, y: number) {
  const candidate = { ...item, x, y };
  const width = candidate.w ?? 1;

  if (x < 0 || y < 0 || x + width > GRID_COLUMNS) {
    return false;
  }

  return !layout.some((other) => other.id !== item.id && collides(candidate, other));
}

function getGridRows(layout: ModuleConfig[]) {
  const bottom = layout.reduce((max, item) => {
    return Math.max(max, (item.y ?? 0) + (item.h ?? 1));
  }, 0);

  return Math.max(MIN_GRID_ROWS, bottom + 4);
}

const DropCell: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: getCellId(x, y),
  });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.dropCell} ${isOver ? styles.dropCellOver : ''}`}
      style={{
        gridColumn: `${x + 1} / span 1`,
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

    if (activeItem && target && canPlace(activeItem, layout, target.x, target.y)) {
      onChange(
        layout.map((item) =>
          item.id === active.id ? { ...item, x: target.x, y: target.y } : item,
        ),
      );
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
  const cells = Array.from({ length: GRID_COLUMNS * gridRows }, (_, index) => ({
    x: index % GRID_COLUMNS,
    y: Math.floor(index / GRID_COLUMNS),
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
          <DropCell key={getCellId(cell.x, cell.y)} x={cell.x} y={cell.y} />
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
