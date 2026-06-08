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

export const PowerCalculator: React.FC = () => {
  const [currentText, setCurrentText] = useState('');
  const [powerText, setPowerText] = useState('');
  const [activeField, setActiveField] = useState<'current' | 'power'>('current');

  const derived = useMemo(() => {
    if (activeField === 'current') {
      const current = currentText === '' ? null : Number(currentText);
      if (current === null || Number.isNaN(current)) {
        return { currentOut: '', powerOut: '' };
      }

      return {
        currentOut: currentText,
        powerOut: formatNumber(powerFromCurrent(current)),
      };
    }

    const power = powerText === '' ? null : Number(powerText);
    if (power === null || Number.isNaN(power)) {
      return { currentOut: '', powerOut: '' };
    }

    return {
      currentOut: formatNumber(currentFromPower(power), 1),
      powerOut: powerText,
    };
  }, [activeField, currentText, powerText]);

  const handleCurrentChange = (value: string) => {
    setActiveField('current');
    setCurrentText(value);
    if (value === '') {
      setPowerText('');
      return;
    }

    const current = Number(value);
    setPowerText(Number.isNaN(current) ? '' : formatNumber(powerFromCurrent(current)));
  };

  const handlePowerChange = (value: string) => {
    setActiveField('power');
    setPowerText(value);
    if (value === '') {
      setCurrentText('');
      return;
    }

    const power = Number(value);
    setCurrentText(Number.isNaN(power) ? '' : formatNumber(currentFromPower(power), 1));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.infoPill}>23 kV</div>
        <div className={styles.infoPill}>0.95 cos</div>
      </div>

      <div className={styles.inputsSection}>
        <div className={styles.inputBlock}>
          <label className={styles.label}>Proud I [A]</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Zadej proud"
            value={derived.currentOut}
            onChange={(e) => handleCurrentChange(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.inputBlock}>
          <label className={styles.label}>Výkon P [MW]</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Zadej výkon"
            value={derived.powerOut}
            onChange={(e) => handlePowerChange(e.target.value)}
            className={styles.input}
          />
        </div>
      </div>
    </div>
  );
};
