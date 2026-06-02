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

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? undefined,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.35 : 1,
    // Grid spanning for mixed-size cards
    gridColumn: `span ${config.w || 1}`,
    gridRow: `span ${config.h || 1}`,
    height: '100%',
    width: '100%',
    // Smooth transition for non-dragged items repositioning
    willChange: isDragging ? 'transform' : undefined,
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
