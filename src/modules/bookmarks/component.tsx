'use client';

import React, { useState, useEffect } from 'react';
import styles from './bookmarks.module.css';

interface Bookmark {
  url: string;
  name: string;
  created: number;
}

const STORAGE_KEY = 'bookmarks';

export const BookmarksComponent: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const save = (newBookmarks: Bookmark[]) => {
    setBookmarks(newBookmarks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBookmarks));
  };

  const getFaviconUrl = (bookmarkUrl: string) => {
    try {
      const u = new URL(bookmarkUrl);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
    } catch {
      return '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !name.trim()) return;

    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const updated = [{ url: formattedUrl, name: name.trim(), created: Date.now() }, ...bookmarks];
    save(updated);
    setUrl('');
    setName('');
  };

  const remove = (index: number) => {
    const updated = [...bookmarks];
    updated.splice(index, 1);
    save(updated);
  };

  const openAll = () => {
    bookmarks.forEach((b) => window.open(b.url, '_blank'));
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
        const imported = JSON.parse(event.target?.result as string);
        if (!Array.isArray(imported)) throw new Error();
        
        const merged = [...bookmarks];
        imported.forEach((b: any) => {
          if (b.url && b.name) {
            merged.unshift({
              url: b.url,
              name: b.name,
              created: b.created || Date.now(),
            });
          }
        });
        save(merged);
      } catch {
        alert('Neplatný JSON soubor.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  if (!isMounted) return null;

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className={styles.input}
        />
        <div className={styles.formRow}>
          <input
            type="text"
            placeholder="Název odkazu"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={styles.input}
          />
          <button type="submit" className={styles.addButton}>
            Přidat
          </button>
        </div>
      </form>

      <div className={styles.actions}>
        <button onClick={openAll} disabled={bookmarks.length === 0} className={styles.actionBtn}>
          Otevřít vše
        </button>
        <button onClick={exportBookmarks} disabled={bookmarks.length === 0} className={styles.actionBtn}>
          Export
        </button>
        <label className={styles.actionBtnLabel}>
          Import
          <input type="file" accept=".json" onChange={handleImport} className={styles.fileInput} />
        </label>
      </div>

      <div className={styles.list}>
        {bookmarks.length === 0 ? (
          <div className={styles.empty}>Zatím žádné záložky</div>
        ) : (
          bookmarks.map((b, idx) => (
            <div key={b.created + '-' + idx} className={styles.item} onClick={() => window.open(b.url, '_blank')}>
              <div className={styles.faviconContainer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getFaviconUrl(b.url)}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  alt=""
                  className={styles.favicon}
                />
              </div>
              <div className={styles.info}>
                <div className={styles.nameText}>{b.name}</div>
                <div className={styles.urlText}>{b.url}</div>
              </div>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  remove(idx);
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
