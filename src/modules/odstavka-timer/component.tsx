'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import styles from './odstavka-timer.module.css';

export const OutageTimer: React.FC = () => {
  const [startHour, setStartHour] = useState(8);
  const [startMinute, setStartMinute] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 10, 20, 30, 40, 50];

  const calcEnd = (h: number, m: number, duration: number) => {
    const total = h * 60 + m + duration * 60;
    const end = total % 1440;
    return (
      String(Math.floor(end / 60)).padStart(2, '0') +
      ':' +
      String(end % 60).padStart(2, '0')
    );
  };

  useEffect(() => {
    setIsMounted(true);
    // Initialize rounded to nearest 10 min
    const now = new Date();
    let h = now.getHours();
    let m = Math.round(now.getMinutes() / 10) * 10;
    if (m === 60) {
      m = 0;
      h = (h + 1) % 24;
    }
    setStartHour(h);
    setStartMinute(m);
  }, []);

  const winterEnd = isMounted ? calcEnd(startHour, startMinute, 8) : '--:--';
  const summerEnd = isMounted ? calcEnd(startHour, startMinute, 12) : '--:--';

  if (!isMounted) return null;

  return (
    <div className={styles.container}>
      <div className={styles.pickerWrapper}>
        <div className={styles.col}>
          <label className={styles.label}>Začátek (h)</label>
          <select
            value={startHour}
            onChange={(e) => setStartHour(parseInt(e.target.value))}
            className={styles.select}
          >
            {hours.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.sep}>:</div>
        <div className={styles.col}>
          <label className={styles.label}>Začátek (m)</label>
          <select
            value={startMinute}
            onChange={(e) => setStartMinute(parseInt(e.target.value))}
            className={styles.select}
          >
            {minutes.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.results}>
        <div className={`${styles.resultRow} ${styles.winter}`}>
          <div className={styles.resultLeft}>
            <div className={styles.resultSeason}>❄️ Zima · max 8 h</div>
            <div className={styles.resultMonths}>listopad – březen</div>
          </div>
          <div className={styles.resultTime}>{winterEnd}</div>
        </div>

        <div className={`${styles.resultRow} ${styles.summer}`}>
          <div className={styles.resultLeft}>
            <div className={styles.resultSeason}>☀️ Léto · max 12 h</div>
            <div className={styles.resultMonths}>duben – říjen</div>
          </div>
          <div className={styles.resultTime}>{summerEnd}</div>
        </div>
      </div>
    </div>
  );
};
