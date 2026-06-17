import React from 'react';
import { useDraggable } from '@dnd-kit/core';
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
    isDragging,
  } = useDraggable({ id: config.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.35 : 1,
    gridColumn: `${(config.x ?? 0) + 1} / span ${config.w || 1}`,
    gridRow: `${(config.y ?? 0) + 1} / span ${config.h || 1}`,
    height: '100%',
    width: '100%',
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
