'use client';

import React, { useMemo, useState } from 'react';
import styles from './prepocet-i.module.css';

const VOLTAGE_KV = 23;
const COS_PHI = 0.95;

function formatNumber(value: number, digits = 3) {
  return value.toLocaleString('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function powerFromCurrent(currentA: number) {
  const uPhase = (VOLTAGE_KV * 1000) / Math.sqrt(3);
  const pWatts = uPhase * currentA * COS_PHI * 2;
  return pWatts / 1_000_000;
}

function currentFromPower(powerMW: number) {
  const uPhase = (VOLTAGE_KV * 1000) / Math.sqrt(3);
  const pWatts = powerMW * 1_000_000;
  return pWatts / (uPhase * COS_PHI * 2);
}

function parseDecimal(value: string) {
  const normalized = value.replace(',', '.').trim();
  if (normalized === '') {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export const PowerCalculator: React.FC = () => {
  const [currentText, setCurrentText] = useState('');
  const [powerText, setPowerText] = useState('');
  const [activeField, setActiveField] = useState<'current' | 'power'>('current');

  const derivedCurrent = useMemo(() => {
    if (activeField !== 'power') {
      return currentText;
    }

    const power = parseDecimal(powerText);
    if (power === null) {
      return '';
    }

    return formatNumber(currentFromPower(power), 1);
  }, [activeField, currentText, powerText]);

  const derivedPower = useMemo(() => {
    if (activeField !== 'current') {
      return powerText;
    }

    const current = parseDecimal(currentText);
    if (current === null) {
      return '';
    }

    return formatNumber(powerFromCurrent(current));
  }, [activeField, currentText, powerText]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.infoPill}>23 kV</div>
        <div className={styles.infoPill}>cos 0.95</div>
      </div>

      <div className={styles.inputsSection}>
        <div className={styles.inputBlock}>
          <label className={styles.label}>Proud</label>
          <div className={styles.inputWrap}>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={derivedCurrent}
              onChange={(e) => {
                setActiveField('current');
                setCurrentText(e.target.value);
              }}
              className={styles.input}
            />
            <span className={styles.unit}>A</span>
          </div>
        </div>

        <div className={styles.inputBlock}>
          <label className={styles.label}>Vykon</label>
          <div className={styles.inputWrap}>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={derivedPower}
              onChange={(e) => {
                setActiveField('power');
                setPowerText(e.target.value);
              }}
              className={styles.input}
            />
            <span className={styles.unit}>MW</span>
          </div>
        </div>
      </div>
    </div>
  );
};
