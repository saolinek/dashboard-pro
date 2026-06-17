'use client';

import React, { useEffect, useState } from 'react';
import { LayoutManager } from '@/core/layout-manager';
import { storage } from '@/lib/storage';
import { ModuleConfig } from '@/core/registry';

// Import all modules to trigger their registration
import '@/modules/clock'; 
import '@/modules/svatek'; 
import '@/modules/bookmarks';
import '@/modules/work';
import '@/modules/prepocet-i';
import '@/modules/inflace';
import '@/modules/odstavky';
import '@/modules/odstavka-timer';
import '@/modules/odstavka-deadline';
import '@/modules/vyplata';

const LOGICAL_COLUMNS = 4;
const COLUMN_WIDTH = 2;
const GRID_COLUMNS = LOGICAL_COLUMNS * COLUMN_WIDTH;

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

function findFreePosition(item: ModuleConfig, placed: ModuleConfig[]) {
  const width = item.w ?? 1;
  const height = item.h ?? 1;

  for (let y = 0; y < 100; y += 1) {
    for (let column = 0; column < LOGICAL_COLUMNS; column += 1) {
      const x = column * COLUMN_WIDTH;

      if (x + width > GRID_COLUMNS) {
        continue;
      }

      const candidate = { ...item, x, y, w: width, h: height };
      if (!placed.some((placedItem) => collides(candidate, placedItem))) {
        return { x, y };
      }
    }
  }

  return { x: 0, y: placed.length * height };
}

function ensureGridPositions(layout: ModuleConfig[]) {
  const placed: ModuleConfig[] = [];
  let changed = false;

  for (const item of layout) {
    const width = item.w ?? 1;
    const needsPosition =
      item.x === undefined ||
      item.y === undefined ||
      item.x < 0 ||
      item.y < 0 ||
      item.x % COLUMN_WIDTH !== 0 ||
      item.x + width > GRID_COLUMNS ||
      placed.some((placedItem) => collides(item, placedItem));

    if (needsPosition) {
      const position = findFreePosition({ ...item, w: width, h: item.h ?? 1 }, placed);
      const positionedItem = { ...item, ...position, w: width, h: item.h ?? 1 };
      placed.push(positionedItem);
      changed = true;
    } else {
      placed.push({ ...item, w: width, h: item.h ?? 1 });
    }
  }

  return { layout: placed, changed };
}

export const DashboardEngine = () => {
  const [layout, setLayout] = useState<ModuleConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const registeredTypes = [
    'clock',
    'svatek',
    'bookmarks',
    'work',
    'prepocet-i',
    'inflace',
    'odstavky',
    'odstavka-timer',
    'odstavka-deadline',
    'vyplata'
  ];

  const defaultConfigs: Record<string, { w: number; h: number }> = {
    clock: { w: 2, h: 1 },
    svatek: { w: 2, h: 1 },
    bookmarks: { w: 2, h: 2 },
    work: { w: 2, h: 1 },
    'prepocet-i': { w: 2, h: 1 },
    inflace: { w: 2, h: 2 },
    odstavky: { w: 2, h: 1 },
    'odstavka-timer': { w: 2, h: 2 },
    'odstavka-deadline': { w: 2, h: 1 },
    vyplata: { w: 2, h: 1 }
  };

  useEffect(() => {
    const savedLayout = storage.loadLayout();
    
    if (savedLayout && savedLayout.length > 0) {
      // Filter out any modules that are no longer registered, and update outdated dimensions
      let needsSave = false;
      const filteredLayout = savedLayout
        .filter(item => {
          const isRegistered = registeredTypes.includes(item.type);
          if (!isRegistered) needsSave = true;
          return isRegistered;
        })
        .map(item => {
          const defaultW = defaultConfigs[item.type]?.w || 1;
          const defaultH = defaultConfigs[item.type]?.h || 1;
          if (item.w !== defaultW || item.h !== defaultH) {
            needsSave = true;
            return { ...item, w: defaultW, h: defaultH };
          }
          return item;
        });
      
      const existingTypes = new Set(filteredLayout.map(item => item.type));
      const missingTypes = registeredTypes.filter(t => !existingTypes.has(t));
      
      if (missingTypes.length > 0 || needsSave) {
        const withMissing = [
          ...filteredLayout,
          ...missingTypes.map((type, idx) => ({
            id: `${type}-${Date.now()}-${idx}`,
            type,
            w: defaultConfigs[type]?.w || 1,
            h: defaultConfigs[type]?.h || 1
          }))
        ];
        const { layout: updated } = ensureGridPositions(withMissing);
        setLayout(updated);
        storage.saveLayout(updated);
      } else {
        const { layout: positionedLayout, changed } = ensureGridPositions(filteredLayout);
        setLayout(positionedLayout);
        if (changed) {
          storage.saveLayout(positionedLayout);
        }
      }
    } else {
      const defaultLayout: ModuleConfig[] = registeredTypes.map((type, idx) => ({
        id: `${type}-${idx}`,
        type,
        w: defaultConfigs[type]?.w || 1,
        h: defaultConfigs[type]?.h || 1
      }));
      const { layout: positionedLayout } = ensureGridPositions(defaultLayout);
      setLayout(positionedLayout);
      storage.saveLayout(positionedLayout);
    }
    
    setIsLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLayoutChange = (newLayout: ModuleConfig[]) => {
    setLayout(newLayout);
    storage.saveLayout(newLayout);
  };

  const handleReset = () => {
    const defaultLayout: ModuleConfig[] = registeredTypes.map((type, idx) => ({
      id: `${type}-${idx}`,
      type,
      w: defaultConfigs[type]?.w || 1,
      h: defaultConfigs[type]?.h || 1
    }));
    const { layout: positionedLayout } = ensureGridPositions(defaultLayout);
    setLayout(positionedLayout);
    storage.saveLayout(positionedLayout);
  };

  if (!isLoaded) {
    return <div style={{ padding: 20 }}>Načítám dashboard...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <LayoutManager layout={layout} onChange={handleLayoutChange} />
    </div>
  );
};
