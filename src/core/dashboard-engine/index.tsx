'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { LayoutManager } from '@/core/layout-manager';
import { storage } from '@/lib/storage';
import { ModuleConfig, moduleRegistry } from '@/core/registry';
import { normalizeLayout, showItemInFreePosition } from '@/core/layout-utils';
import styles from './DashboardEngine.module.css';

import { SignatureEditor } from '@/shared/ui/SignatureEditor';
import { loadSignature, deleteSignature, saveSignature, getSignatureHtml } from '@/lib/storage/signature';

// Import all modules to trigger their registration
import '@/modules/clock'; 
import '@/modules/svatek'; 
import '@/modules/bookmarks';
import '@/modules/work';
import '@/modules/prepocet-i';
import '@/modules/inflace';
import '@/modules/odstavky';
import '@/modules/odstavka-timer';
import '@/modules/vyplata';
import '@/modules/svatek-tyden';
import '@/modules/spojeni-uzlu';
import '@/modules/generator-storno-h1';
import '@/modules/odstavka-deadline';

type Tab = 'tools' | 'emails';

const TAB_LABELS: Record<Tab, string> = {
  tools: 'Nástroje',
  emails: 'Emaily',
};

const moduleCategory: Record<string, Tab> = {
  clock: 'tools',
  svatek: 'tools',
  'svatek-tyden': 'tools',
  bookmarks: 'tools',
  work: 'tools',
  'prepocet-i': 'tools',
  inflace: 'tools',
  odstavky: 'tools',
  'odstavka-timer': 'tools',
  vyplata: 'tools',
  'odstavka-deadline': 'tools',
  'spojeni-uzlu': 'emails',
  'generator-storno-h1': 'emails',
};

const registeredTypes = Object.keys(moduleCategory);

const defaultConfigs: Record<string, { w: number; h: number }> = {
  clock: { w: 2, h: 1 },
  svatek: { w: 2, h: 2 },
  'svatek-tyden': { w: 2, h: 2 },
  bookmarks: { w: 2, h: 2 },
  work: { w: 2, h: 1 },
  'prepocet-i': { w: 2, h: 1 },
  inflace: { w: 2, h: 2 },
  odstavky: { w: 2, h: 1 },
  'odstavka-timer': { w: 2, h: 2 },
  vyplata: { w: 2, h: 1 },
  'spojeni-uzlu': { w: 4, h: 3 },
  'generator-storno-h1': { w: 4, h: 5 },
  'odstavka-deadline': { w: 2, h: 1 }
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
      })
      .map(item => {
        const defaults = defaultConfigs[item.type];
        let itemChanged = false;
        const updatedItem = { ...item };
        if (updatedItem.w === undefined && defaults) {
          updatedItem.w = defaults.w;
          itemChanged = true;
        }
        if (updatedItem.h === undefined && defaults) {
          updatedItem.h = defaults.h;
          itemChanged = true;
        }
        if (itemChanged) {
          needsSave = true;
        }
        return updatedItem;
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
      const { layout: updated } = normalizeByCategory(withMissing);
      return { layout: updated, shouldSave: true };
    }

    const { layout: positionedLayout, changed } = normalizeByCategory(filteredLayout);
    return { layout: positionedLayout, shouldSave: changed };
  }

  const { layout: positionedLayout } = normalizeByCategory(createDefaultLayout());
  return { layout: positionedLayout, shouldSave: true };
}

function normalizeByCategory(layout: ModuleConfig[]) {
  const tabs: Tab[] = ['tools', 'emails'];
  let result: ModuleConfig[] = [];
  let anyChanged = false;

  for (const tab of tabs) {
    const group = layout.filter(item => moduleCategory[item.type] === tab);

    if (group.length > 0) {
      const { layout: normalized, changed } = normalizeLayout(group);
      result = result.concat(normalized);

      if (changed) {
        anyChanged = true;
      }
    }
  }

  const unknown = layout.filter(item => !moduleCategory[item.type]);

  if (unknown.length > 0) {
    const { layout: normalized, changed } = normalizeLayout(unknown);
    result = result.concat(normalized);

    if (changed) {
      anyChanged = true;
    }
  }

  return { layout: result, changed: anyChanged };
}

export const DashboardEngine = () => {
  const [layout, setLayout] = useState<ModuleConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('tools');
  const [signature, setSignature] = useState<string | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      const { layout: initialLayout, shouldSave } = getInitialLayout();

      if (!isActive) {
        return;
      }

      setLayout(initialLayout);
      setIsLoaded(true);

      const loadedSig = loadSignature();
      setSignature(loadedSig);

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
      const { layout: normalizedLayout } = normalizeByCategory(mergedLayout);
      storage.saveLayout(normalizedLayout);
      return normalizedLayout;
    });
  };

  const updateLayout = (updater: (currentLayout: ModuleConfig[]) => ModuleConfig[]) => {
    setLayout((currentLayout) => {
      const { layout: normalizedLayout } = normalizeByCategory(updater(currentLayout));
      storage.saveLayout(normalizedLayout);
      return normalizedLayout;
    });
  };

  const handleVisibilityChange = (id: string, isVisible: boolean) => {
    updateLayout((currentLayout) => {
      if (isVisible) {
        return showItemInFreePosition(currentLayout, id);
      }

      return currentLayout.map((item) =>
        item.id === id ? { ...item, hidden: true } : item
      );
    });
  };

  const handleResize = (id: string, width: number, height: number) => {
    updateLayout((currentLayout) =>
      currentLayout.map((item) =>
        item.id === id ? { ...item, w: width, h: height } : item
      )
    );
  };

  const handleReset = () => {
    const { layout: positionedLayout } = normalizeByCategory(createDefaultLayout());
    setLayout(positionedLayout);
    storage.saveLayout(positionedLayout);
  };

const visibleLayout = useMemo(() =>
    layout.filter(
      (item) => !item.hidden && moduleCategory[item.type] === activeTab
    ),
  [layout, activeTab]);

  if (!isLoaded) {
    return <div style={{ padding: 20 }}>Načítám dashboard...</div>;
  }


  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          {(Object.entries(TAB_LABELS) as [Tab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.settingsButton}
          aria-expanded={isSettingsOpen}
          onClick={() => setIsSettingsOpen((isOpen) => !isOpen)}
        >
          {isSettingsOpen ? 'Zavřít nastavení' : 'Nastavení'}
        </button>
      </div>

      <div className={[
        styles.workspace,
        isSettingsOpen ? styles.workspaceWithSettings : '',
      ].filter(Boolean).join(' ')}>
        <div className={styles.dashboardContent}>
          {visibleLayout.length > 0 ? (
            <LayoutManager
              layout={visibleLayout}
              isResizeMode={isSettingsOpen}
              onChange={handleLayoutChange}
              onResize={handleResize}
            />
          ) : (
            <div className={styles.emptyState}>
              Všechny widgety jsou skryté. Otevři nastavení a zapni aspoň jeden widget.
            </div>
          )}
        </div>

        {isSettingsOpen && (
          <aside className={styles.settingsPanel} aria-label="Nastavení widgetů">
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
                </article>
              ))}
            </div>

            {/* Elektronický podpis sekce */}
            <section className={styles.signatureSection}>
              <h3 className={styles.signatureTitle}>Elektronický podpis</h3>
              <div className={styles.signatureCard}>
                {signature ? (
                  <>
                    <div
                      className={styles.signaturePreviewText}
                      dangerouslySetInnerHTML={{ __html: getSignatureHtml() }}
                    />
                    <div className={styles.signatureActions}>
                      <button
                        type="button"
                        className={styles.signatureBtn}
                        onClick={() => setIsSignatureModalOpen(true)}
                      >
                        Upravit
                      </button>
                      <button
                        type="button"
                        className={styles.signatureBtnDanger}
                        onClick={() => {
                          deleteSignature();
                          setSignature(null);
                        }}
                      >
                        Smazat
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '13px', color: '#5f6368', fontStyle: 'italic', marginBottom: '8px' }}>
                      Podpis zatím není nastaven. Při prvním odeslání e-mailu budete vyzváni k jeho vytvoření.
                    </div>
                    <button
                      type="button"
                      className={styles.signatureBtn}
                      onClick={() => setIsSignatureModalOpen(true)}
                    >
                      + Nastavit podpis
                    </button>
                  </>
                )}
              </div>
            </section>
          </aside>
        )}
      </div>

      {isSignatureModalOpen && (
        <SignatureEditor
          onClose={() => setIsSignatureModalOpen(false)}
          onSave={(html) => {
            saveSignature(html);
            setSignature(html);
            setIsSignatureModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
