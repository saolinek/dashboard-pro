'use client';

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { ModuleConfig } from '@/core/registry';
import { SortableModule } from './SortableModule';
import styles from './LayoutManager.module.css';

interface LayoutManagerProps {
  layout: ModuleConfig[];
  onChange: (newLayout: ModuleConfig[]) => void;
}

export const LayoutManager: React.FC<LayoutManagerProps> = ({ layout, onChange }) => {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // 5px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay for touch devices
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = layout.findIndex((item) => item.id === active.id);
      const newIndex = layout.findIndex((item) => item.id === over.id);

      onChange(arrayMove(layout, oldIndex, newIndex));
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={layout.map(i => i.id)}
        strategy={rectSortingStrategy}
      >
        <div className={styles.grid}>
          {layout.map((moduleConfig) => (
            <SortableModule key={moduleConfig.id} config={moduleConfig} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
