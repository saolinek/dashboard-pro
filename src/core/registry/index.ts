import React from 'react';

export interface ModuleConfig {
  id: string; // unique ID for the instance
  type: string; // references the module type in registry
  // Basic grid placement (can be used by custom grid or simplified DND)
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  hidden?: boolean;
  props?: Record<string, unknown>;
}

export interface ModuleDefinition {
  type: string;
  name: string;
  description?: string;
  component: React.ComponentType<Record<string, unknown>>;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

class Registry {
  private modules: Map<string, ModuleDefinition> = new Map();

  register(moduleDef: ModuleDefinition) {
    if (this.modules.has(moduleDef.type)) {
      console.warn(`Module ${moduleDef.type} is already registered. Overwriting.`);
    }
    this.modules.set(moduleDef.type, moduleDef);
  }

  get(type: string): ModuleDefinition | undefined {
    return this.modules.get(type);
  }

  getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }
}

export const moduleRegistry = new Registry();
