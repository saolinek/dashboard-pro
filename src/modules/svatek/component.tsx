'use client';

import React, { useState, useEffect } from 'react';
import styles from './svatek.module.css';

interface NamedayData {
  name: string;
  isHoliday: boolean;
  holidayName: string | null;
}

export const NamedaysComponent: React.FC = () => {
  const [data, setData] = useState<NamedayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('https://svatkyapi.cz/api/day')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Chyba při stahování dat');
        }
        return res.json();
      })
      .then((json: NamedayData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Chyba načítání');
        setLoading(false);
      });
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
