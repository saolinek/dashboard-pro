import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { moduleRegistry, ModuleConfig } from '@/core/registry';
import { Card } from '@/shared/ui/Card';

interface Props {
  config: ModuleConfig;
}

export const SortableModule: React.FC<Props> = ({ config }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 100 : 0,
    opacity: isDragging ? 0.5 : 1,
    // Minimal grid spanning (w, h)
    gridColumn: `span ${config.w || 1}`,
    gridRow: `span ${config.h || 1}`,
    height: '100%',
    width: '100%',
  };

  const moduleDef = moduleRegistry.get(config.type);

  if (!moduleDef) {
    return (
      <div ref={setNodeRef} style={style}>
        <Card title="Error">Unknown module: {config.type}</Card>
      </div>
    );
  }

  const Component = moduleDef.component;

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        title={moduleDef.name}
        dragHandleProps={{ ...attributes, ...listeners }}
      >
        <Component {...(config.props || {})} />
      </Card>
    </div>
  );
};
