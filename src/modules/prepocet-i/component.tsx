'use client';

import React, { useState, useEffect } from 'react';
import styles from './prepocet-i.module.css';

export const PowerCalculator: React.FC = () => {
  const [voltage, setVoltage] = useState(23); // kV
  const [cosPhi, setCosPhi] = useState(0.95);
  const [current, setCurrent] = useState<number | ''>('');
  const [power, setPower] = useState('0,000');

  useEffect(() => {
    const u = voltage || 0;
    const cos = cosPhi || 0;
    const i = current || 0;

    // Phase voltage (U / sqrt(3))
    const uPhase = (u * 1000) / Math.sqrt(3);

    // Estimation for 2 phases / loop
    const pWatts = uPhase * i * cos * 2;
    const pMw = pWatts / 1000000;

    setPower(pMw.toLocaleString('cs-CZ', { minimumFractionDigits: 3, maximumFractionDigits: 3 }));
  }, [voltage, cosPhi, current]);

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.col}>
          <label className={styles.label}>Napětí U [kV]</label>
          <input
            type="number"
            value={voltage}
            onChange={(e) => setVoltage(parseFloat(e.target.value) || 0)}
            className={styles.input}
          />
        </div>
        <div className={styles.col}>
          <label className={styles.label}>Účiník cos φ</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={cosPhi}
            onChange={(e) => setCosPhi(parseFloat(e.target.value) || 0)}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.inputBlock}>
        <label className={styles.label}>Proud I [A]</label>
        <input
          type="number"
          placeholder="Zadejte proud..."
          value={current}
          onChange={(e) => setCurrent(e.target.value === '' ? '' : parseFloat(e.target.value))}
          className={styles.input}
        />
      </div>

      <div className={styles.resultBox}>
        <span className={styles.resLabel}>Činný výkon (P)</span>
        <span className={styles.resVal}>{power}</span>
        <span className={styles.resUnit}>MW</span>
      </div>

      <div className={styles.footerNote}>
        P = (U / √3) × I × cos φ × 2
      </div>
    </div>
  );
};
