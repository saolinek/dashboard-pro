'use client';

import React, { useState, useEffect } from 'react';
import styles from './work.module.css';

const W_KEY = 'work_time_state';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const WorkComponent: React.FC = () => {
  const [arrival, setArrival] = useState(420); // 7:00
  const [saldo, setSaldo] = useState(0); // 0 hours
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    queueMicrotask(() => {
      if (!isCurrent) return;
      setIsMounted(true);
      try {
        const data = localStorage.getItem(W_KEY);
        if (data) {
          const parsed: unknown = JSON.parse(data);
          if (isRecord(parsed)) {
            const parsedArrival = Number(parsed.time);
            const parsedSaldo = Number(parsed.saldo);

            if (Number.isFinite(parsedArrival)) {
              setArrival(clamp(Math.round(parsedArrival), 360, 480));
            }

            if (Number.isFinite(parsedSaldo)) {
              setSaldo(clamp(parsedSaldo, -1, 1));
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, []);

  const saveState = (newArrival: number, newSaldo: number) => {
    try {
      localStorage.setItem(
        W_KEY,
        JSON.stringify({
          time: newArrival,
          saldo: newSaldo,
        })
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleArrivalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = clamp(parseInt(e.target.value, 10), 360, 480);
    setArrival(val);
    saveState(val, saldo);
  };

  const handleSaldoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = clamp(parseFloat(e.target.value), -1, 1);
    setSaldo(val);
    saveState(arrival, val);
  };

  const minToTime = (m: number) => {
    const abs = Math.abs(m);
    const h = Math.floor(abs / 60);
    const min = abs % 60;
    return `${m < 0 ? '-' : ''}${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  if (!isMounted) return null;

  // Calculate departure
  const dep = arrival + 450 + 30 - saldo * 60;
  const departureString = minToTime(Math.round(dep % 1440));

  return (
    <div className={styles.container}>
      <div className={styles.sliders}>
        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Příchod:</span>
            <span className={styles.valueDisplay}>{minToTime(arrival)}</span>
          </div>
          <input
            type="range"
            min="360"
            max="480"
            value={arrival}
            onChange={handleArrivalChange}
            className={styles.slider}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.labelCol}>
            <span className={styles.label}>Saldo:</span>
            <span className={styles.valueDisplay}>
              {saldo >= 0 ? '+' : ''}
              {saldo.toFixed(2)} h
            </span>
          </div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={saldo}
            onChange={handleSaldoChange}
            className={styles.slider}
          />
        </div>
      </div>

      <div className={styles.resultBox}>
        <div className={styles.resultLabel}>Doporučený odchod:</div>
        <div className={styles.resultValue}>{departureString}</div>
      </div>
    </div>
  );
};
