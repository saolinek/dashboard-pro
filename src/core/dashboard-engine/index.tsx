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
import '@/modules/odstavky';
import '@/modules/odstavka-timer';
import '@/modules/odstavka-deadline';
import '@/modules/vyplata';

export const DashboardEngine = () => {
  const [layout, setLayout] = useState<ModuleConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const registeredTypes = [
    'clock',
    'svatek',
    'bookmarks',
    'work',
    'prepocet-i',
    'odstavky',
    'odstavka-timer',
    'odstavka-deadline',
    'vyplata'
  ];

  const defaultConfigs: Record<string, { w: number; h: number }> = {
    clock: { w: 1, h: 1 },
    svatek: { w: 1, h: 1 },
    bookmarks: { w: 2, h: 2 },
    work: { w: 2, h: 1 },
    'prepocet-i': { w: 2, h: 1 },
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
        const updated = [
          ...filteredLayout,
          ...missingTypes.map((type, idx) => ({
            id: `${type}-${Date.now()}-${idx}`,
            type,
            w: defaultConfigs[type]?.w || 1,
            h: defaultConfigs[type]?.h || 1
          }))
        ];
        setLayout(updated);
        storage.saveLayout(updated);
      } else {
        setLayout(filteredLayout);
      }
    } else {
      const defaultLayout: ModuleConfig[] = registeredTypes.map((type, idx) => ({
        id: `${type}-${idx}`,
        type,
        w: defaultConfigs[type]?.w || 1,
        h: defaultConfigs[type]?.h || 1
      }));
      setLayout(defaultLayout);
      storage.saveLayout(defaultLayout);
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
    setLayout(defaultLayout);
    storage.saveLayout(defaultLayout);
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
