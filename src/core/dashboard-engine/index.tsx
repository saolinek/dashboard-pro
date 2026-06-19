'use client';

import React, { useEffect, useState } from 'react';
import { LayoutManager } from '@/core/layout-manager';
import { storage } from '@/lib/storage';
import { ModuleConfig, moduleRegistry } from '@/core/registry';
import {
  LOGICAL_COLUMNS,
  MAX_WIDGET_HEIGHT,
  MIN_WIDGET_HEIGHT,
  logicalColumnsFromWidth,
  normalizeLayout,
  widthFromLogicalColumns,
} from '@/core/layout-utils';
import styles from './DashboardEngine.module.css';

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

function createDefaultLayout() {
  return registeredTypes.map((type, idx) => ({
    id: `${type}-${idx}`,
    type,
    w: defaultConfigs[type]?.w || 2,
    h: defaultConfigs[type]?.h || 1,
  }));
}

function getModuleName(type: string) {
  return moduleRegistry.get(type)?.name ?? type;
}

function getInitialLayout() {
  const savedLayout = storage.loadLayout();

  if (savedLayout && savedLayout.length > 0) {
    let needsSave = false;
    const filteredLayout = savedLayout
      .filter(item => {
        const isRegistered = registeredTypes.includes(item.type);
        if (!isRegistered) needsSave = true;
        return isRegistered;
      });

    const existingTypes = new Set(filteredLayout.map(item => item.type));
    const missingTypes = registeredTypes.filter(t => !existingTypes.has(t));

    if (missingTypes.length > 0 || needsSave) {
      const withMissing = [
        ...filteredLayout,
        ...missingTypes.map((type) => ({
          id: `${type}-${registeredTypes.indexOf(type)}`,
          type,
          w: defaultConfigs[type]?.w || 2,
          h: defaultConfigs[type]?.h || 1
        }))
      ];
      const { layout: updated } = normalizeLayout(withMissing);
      return { layout: updated, shouldSave: true };
    }

    const { layout: positionedLayout, changed } = normalizeLayout(filteredLayout);
    return { layout: positionedLayout, shouldSave: changed };
  }

  const { layout: positionedLayout } = normalizeLayout(createDefaultLayout());
  return { layout: positionedLayout, shouldSave: true };
}

const logicalWidthOptions = Array.from({ length: LOGICAL_COLUMNS }, (_, index) => index + 1);
const heightOptions = Array.from(
  { length: MAX_WIDGET_HEIGHT - MIN_WIDGET_HEIGHT + 1 },
  (_, index) => MIN_WIDGET_HEIGHT + index
);

export const DashboardEngine = () => {
  const [layout, setLayout] = useState<ModuleConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      const { layout: initialLayout, shouldSave } = getInitialLayout();

      if (!isActive) {
        return;
      }

      setLayout(initialLayout);
      setIsLoaded(true);

      if (shouldSave) {
        storage.saveLayout(initialLayout);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const handleLayoutChange = (newLayout: ModuleConfig[]) => {
    const visibleById = new Map(newLayout.map((item) => [item.id, item]));

    setLayout((currentLayout) => {
      const mergedLayout = currentLayout.map((item) => visibleById.get(item.id) ?? item);
      const { layout: normalizedLayout } = normalizeLayout(mergedLayout);
      storage.saveLayout(normalizedLayout);
      return normalizedLayout;
    });
  };

  const updateLayout = (updater: (currentLayout: ModuleConfig[]) => ModuleConfig[]) => {
    setLayout((currentLayout) => {
      const { layout: normalizedLayout } = normalizeLayout(updater(currentLayout));
      storage.saveLayout(normalizedLayout);
      return normalizedLayout;
    });
  };

  const handleVisibilityChange = (id: string, isVisible: boolean) => {
    updateLayout((currentLayout) =>
      currentLayout.map((item) =>
        item.id === id ? { ...item, hidden: !isVisible } : item
      )
    );
  };

  const handleWidthChange = (id: string, logicalWidth: number) => {
    updateLayout((currentLayout) =>
      currentLayout.map((item) =>
        item.id === id ? { ...item, w: widthFromLogicalColumns(logicalWidth) } : item
      )
    );
  };

  const handleHeightChange = (id: string, height: number) => {
    updateLayout((currentLayout) =>
      currentLayout.map((item) =>
        item.id === id ? { ...item, h: height } : item
      )
    );
  };

  const handleReset = () => {
    const { layout: positionedLayout } = normalizeLayout(createDefaultLayout());
    setLayout(positionedLayout);
    storage.saveLayout(positionedLayout);
  };

  if (!isLoaded) {
    return <div style={{ padding: 20 }}>Načítám dashboard...</div>;
  }

  const visibleLayout = layout.filter((item) => !item.hidden);

  return (
    <div className={styles.dashboard}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.settingsButton}
          aria-expanded={isSettingsOpen}
          onClick={() => setIsSettingsOpen((isOpen) => !isOpen)}
        >
          {isSettingsOpen ? 'Zavřít nastavení' : 'Nastavení'}
        </button>
      </div>

      {isSettingsOpen && (
        <section className={styles.settingsPanel} aria-label="Nastavení widgetů">
          <div className={styles.settingsHeader}>
            <h2 className={styles.settingsTitle}>Nastavení widgetů</h2>
            <button type="button" className={styles.resetButton} onClick={handleReset}>
              Obnovit výchozí
            </button>
          </div>

          <div className={styles.settingsGrid}>
            {layout.map((item) => (
              <article
                key={item.id}
                data-settings-module-id={item.id}
                data-settings-module-type={item.type}
                className={[
                  styles.widgetSetting,
                  item.hidden ? styles.widgetSettingHidden : '',
                ].filter(Boolean).join(' ')}
              >
                <div className={styles.widgetSettingHeader}>
                  <div className={styles.widgetName}>{getModuleName(item.type)}</div>
                  <label className={styles.visibilityLabel}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={!item.hidden}
                      onChange={(event) => handleVisibilityChange(item.id, event.target.checked)}
                    />
                    Zobrazit
                  </label>
                </div>

                <div className={styles.sizeControls}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Šířka</span>
                    <select
                      className={styles.select}
                      aria-label={`${getModuleName(item.type)} šířka`}
                      value={logicalColumnsFromWidth(item.w)}
                      onChange={(event) => handleWidthChange(item.id, Number(event.target.value))}
                    >
                      {logicalWidthOptions.map((width) => (
                        <option key={width} value={width}>
                          {width} {width === 1 ? 'sloupec' : 'sloupce'}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Výška</span>
                    <select
                      className={styles.select}
                      aria-label={`${getModuleName(item.type)} výška`}
                      value={item.h ?? MIN_WIDGET_HEIGHT}
                      onChange={(event) => handleHeightChange(item.id, Number(event.target.value))}
                    >
                      {heightOptions.map((height) => (
                        <option key={height} value={height}>
                          {height} {height === 1 ? 'řádek' : 'řádky'}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {visibleLayout.length > 0 ? (
        <LayoutManager layout={visibleLayout} onChange={handleLayoutChange} />
      ) : (
        <div className={styles.emptyState}>
          Všechny widgety jsou skryté. Otevři nastavení a zapni aspoň jeden widget.
        </div>
      )}
    </div>
  );
};
