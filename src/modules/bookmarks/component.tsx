'use client';

import React, { useState, useEffect } from 'react';
import styles from './bookmarks.module.css';

interface Bookmark {
  url: string;
  name: string;
  created: number;
}

const STORAGE_KEY = 'bookmarks';
const MAX_BOOKMARK_NAME_LENGTH = 32;
const MAX_IMPORTED_BOOKMARKS = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeBookmarkUrl(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function normalizeBookmarkName(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed ? trimmed.slice(0, MAX_BOOKMARK_NAME_LENGTH) : null;
}

function normalizeCreated(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : Date.now();
}

function normalizeBookmark(value: unknown): Bookmark | null {
  if (!isRecord(value)) {
    return null;
  }

  const url = normalizeBookmarkUrl(value.url);
  const name = normalizeBookmarkName(value.name);

  if (!url || !name) {
    return null;
  }

  return {
    url,
    name,
    created: normalizeCreated(value.created),
  };
}

function normalizeBookmarks(value: unknown) {
  return Array.isArray(value)
    ? value.map(normalizeBookmark).filter((bookmark): bookmark is Bookmark => bookmark !== null)
    : [];
}

function openBookmark(url: string) {
  const safeUrl = normalizeBookmarkUrl(url);
  if (safeUrl) {
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
  }
}

export const BookmarksComponent: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setBookmarks(normalizeBookmarks(JSON.parse(saved)));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const save = (newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));
    } catch (e) {
      console.error(e);
    }
  };

  const getFaviconUrl = (bookmarkUrl: string) => {
    try {
      const u = new URL(bookmarkUrl);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`; // Increased size to 64 for crisp icons
    } catch {
      return '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedUrl = normalizeBookmarkUrl(url);
    const formattedName = normalizeBookmarkName(name);
    if (!formattedUrl || !formattedName) {
      return;
    }

    const updated = [{ url: formattedUrl, name: formattedName, created: Date.now() }, ...bookmarks];
    save(updated);
    setUrl('');
    setName('');
    setShowAddForm(false);
  };

  const remove = (index: number) => {
    const updated = [...bookmarks];
    updated.splice(index, 1);
    save(updated);
  };

  const openAll = () => {
    bookmarks.forEach((b) => openBookmark(b.url));
  };

  const exportBookmarks = () => {
    const data = JSON.stringify(bookmarks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bookmarks.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = normalizeBookmarks(JSON.parse(String(event.target?.result ?? '')));
        if (imported.length === 0) throw new Error();

        const merged = [...imported.slice(0, MAX_IMPORTED_BOOKMARKS), ...bookmarks];
        save(merged);
      } catch {
        alert('Neplatný JSON soubor.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  if (!isMounted) return null;

  if (showAddForm) {
    return (
      <div className={styles.formContainer}>
        <div className={styles.formHeader}>Nová záložka</div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder="Název záložky"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={styles.input}
              maxLength={MAX_BOOKMARK_NAME_LENGTH}
            />
          </div>
          <div className={styles.formButtons}>
            <button type="button" onClick={() => setShowAddForm(false)} className={styles.cancelButton}>
              Zrušit
            </button>
            <button type="submit" className={styles.addButton}>
              Přidat
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Display up to 11 bookmarks to make room for the "+" button (total 12 items in a 4x3 grid)
  const displayedBookmarks = bookmarks.slice(0, 11);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {displayedBookmarks.map((b, idx) => (
          <div key={b.created + '-' + idx} className={styles.appWrapper}>
            <button
              type="button"
              className={styles.appIconContainer}
              onClick={() => openBookmark(b.url)}
              aria-label={`Otevřít záložku ${b.name}`}
            >
              <img
                src={getFaviconUrl(b.url)}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                alt=""
                className={styles.favicon}
              />
            </button>
            <button
              type="button"
              className={styles.deleteBadge}
              onClick={() => remove(idx)}
              aria-label={`Smazat záložku ${b.name}`}
            >
              ✕
            </button>
            <div className={styles.appName}>{b.name}</div>
          </div>
        ))}

        {/* Plus Button inside the grid */}
        <div className={styles.appWrapper}>
          <button
            type="button"
            className={`${styles.appIconContainer} ${styles.addBtnContainer}`}
            onClick={() => setShowAddForm(true)}
            aria-label="Přidat záložku"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
          <div className={styles.appName}>Přidat</div>
        </div>
      </div>

      <div className={styles.footer}>
        <button onClick={openAll} disabled={bookmarks.length === 0} className={styles.footerBtn}>
          Otevřít vše
        </button>
        <button onClick={exportBookmarks} disabled={bookmarks.length === 0} className={styles.footerBtn}>
          Export
        </button>
        <label className={styles.footerBtn}>
          Import
          <input type="file" accept=".json" onChange={handleImport} className={styles.fileInput} />
        </label>
      </div>
    </div>
  );
};
