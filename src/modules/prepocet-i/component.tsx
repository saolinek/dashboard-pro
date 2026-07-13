'use client';

import React, { useMemo, useState } from 'react';
import styles from './prepocet-i.module.css';

const COS_PHI = 0.95;

const voltageLevels = {
  nn: { label: 'NN', voltageKV: 0.4 },
  vn: { label: 'VN', voltageKV: 23 },
  vvn: { label: 'VVN', voltageKV: 110 },
} as const;

type VoltageLevel = keyof typeof voltageLevels;

function formatVoltage(voltageKV: number) {
  return `${String(voltageKV).replace('.', ',')} kV`;
}

function formatNumber(value: number, digits = 3) {
  return value.toLocaleString('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function powerFromCurrent(currentA: number, voltageKV: number) {
  const uPhase = (voltageKV * 1000) / Math.sqrt(3);
  const pWatts = uPhase * currentA * COS_PHI * 2;
  return pWatts / 1_000_000;
}

function currentFromPower(powerMW: number, voltageKV: number) {
  const uPhase = (voltageKV * 1000) / Math.sqrt(3);
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
  const [voltageLevel, setVoltageLevel] = useState<VoltageLevel>('vn');
  const selectedVoltage = voltageLevels[voltageLevel];

  const derivedCurrent = useMemo(() => {
    if (activeField !== 'power') {
      return currentText;
    }

    const power = parseDecimal(powerText);
    if (power === null) {
      return '';
    }

    return formatNumber(currentFromPower(power, selectedVoltage.voltageKV), 1);
  }, [activeField, currentText, powerText, selectedVoltage.voltageKV]);

  const derivedPower = useMemo(() => {
    if (activeField !== 'current') {
      return powerText;
    }

    const current = parseDecimal(currentText);
    if (current === null) {
      return '';
    }

    return formatNumber(powerFromCurrent(current, selectedVoltage.voltageKV));
  }, [activeField, currentText, powerText, selectedVoltage.voltageKV]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.voltageControl} aria-label="Napěťová hladina">
          {(Object.entries(voltageLevels) as [VoltageLevel, typeof voltageLevels[VoltageLevel]][]).map(([level, option]) => (
            <button
              type="button"
              key={level}
              className={[styles.voltageButton, voltageLevel === level ? styles.voltageButtonActive : ''].filter(Boolean).join(' ')}
              onClick={() => setVoltageLevel(level)}
              aria-pressed={voltageLevel === level}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className={styles.infoPill}>{formatVoltage(selectedVoltage.voltageKV)}</div>
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
