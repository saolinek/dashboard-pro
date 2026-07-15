'use client';

import React, { useEffect, useState } from 'react';
import { LayoutManager } from '@/core/layout-manager';
import { storage } from '@/lib/storage';
import { ModuleConfig, moduleRegistry } from '@/core/registry';
import { normalizeLayout, showItemInFreePosition } from '@/core/layout-utils';
import styles from './DashboardEngine.module.css';

import { SignatureModal } from '@/shared/ui/SignatureModal';
import { EmailSignature, loadSignature, deleteSignature, renderSignatureHtml } from '@/lib/storage/signature';

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

const registeredTypes = [
  'clock',
  'svatek',
  'svatek-tyden',
  'bookmarks',
  'work',
  'prepocet-i',
  'inflace',
  'odstavky',
  'odstavka-timer',
  'vyplata',
  'spojeni-uzlu',
  'generator-storno-h1'
];

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
  'spojeni-uzlu': { w: 2, h: 2 },
  'generator-storno-h1': { w: 2, h: 4 }
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
      const { layout: updated } = normalizeLayout(withMissing);
      return { layout: updated, shouldSave: true };
    }

    const { layout: positionedLayout, changed } = normalizeLayout(filteredLayout);
    return { layout: positionedLayout, shouldSave: changed };
  }

  const { layout: positionedLayout } = normalizeLayout(createDefaultLayout());
  return { layout: positionedLayout, shouldSave: true };
}

export const DashboardEngine = () => {
  const [layout, setLayout] = useState<ModuleConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [signature, setSignature] = useState<EmailSignature | null>(null);
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
                      dangerouslySetInnerHTML={{ __html: renderSignatureHtml(signature) }}
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
                      Podpis není nastaven. Bude se používat jen čistý text e-mailu.
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
        <SignatureModal
          onClose={() => setIsSignatureModalOpen(false)}
          onSave={(saved) => setSignature(saved)}
        />
      )}
    </div>
  );
};
