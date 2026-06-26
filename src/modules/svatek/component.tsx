'use client';

import React, { useState, useEffect } from 'react';
import styles from './svatek.module.css';

interface NamedayData {
  name: string;
  isHoliday: boolean;
  holidayName: string | null;
}

function isNamedayData(value: unknown): value is NamedayData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'isHoliday' in value &&
    'holidayName' in value &&
    typeof value.name === 'string' &&
    typeof value.isHoliday === 'boolean' &&
    (value.holidayName === null || typeof value.holidayName === 'string')
  );
}

export const NamedaysComponent: React.FC = () => {
  const [data, setData] = useState<NamedayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6_000);

    fetch('https://svatkyapi.cz/api/day', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Chyba při stahování dat');
        }
        return res.json();
      })
      .then((json: unknown) => {
        if (!isNamedayData(json)) {
          throw new Error('Neplatná odpověď API');
        }
        if (!isActive) {
          return;
        }
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (!isActive) {
          return;
        }

        if (err instanceof DOMException && err.name === 'AbortError') {
          setError('Svátek je nedostupný');
          setLoading(false);
          return;
        }

        console.error(err);
        setError('Chyba načítání');
        setLoading(false);
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });

    return () => {
      isActive = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return <div className={styles.container}>Načítám...</div>;
  }

  if (error || !data) {
    return <div className={styles.container}>{error || 'Chyba'}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>Dnes má svátek</div>
      <div className={styles.name}>{data.name}</div>
      {data.isHoliday && data.holidayName && (
        <div className={styles.holiday}>{data.holidayName}</div>
      )}
    </div>
  );
};
