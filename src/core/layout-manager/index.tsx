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
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arraySwap,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSwappingStrategy,
} from '@dnd-kit/sortable';
import { ModuleConfig, moduleRegistry } from '@/core/registry';
import { Card } from '@/shared/ui/Card';
import { SortableModule } from './SortableModule';
import styles from './LayoutManager.module.css';

interface LayoutManagerProps {
  layout: ModuleConfig[];
  onChange: (newLayout: ModuleConfig[]) => void;
}

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

    if (over && active.id !== over.id) {
      const oldIndex = layout.findIndex((item) => item.id === active.id);
      const newIndex = layout.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arraySwap(layout, oldIndex, newIndex));
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

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext 
        items={layout.map(i => i.id)}
        strategy={rectSwappingStrategy}
      >
        <div className={styles.grid}>
          {layout.map((moduleConfig) => (
            <SortableModule key={moduleConfig.id} config={moduleConfig} />
          ))}
        </div>
      </SortableContext>
      <DragOverlay
        adjustScale={false}
        dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {activeConfig && activeModuleDef && ActiveComponent ? (
          <div className={styles.dragOverlay}>
            <Card title={activeModuleDef.name}>
              <ActiveComponent {...(activeConfig.props || {})} />
            </Card>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
