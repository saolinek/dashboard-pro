'use client';

import React, { useMemo, useState } from 'react';
import styles from './inflace.module.css';
import { CPI_INDEX, FIRST_CPI_YEAR, LAST_CPI_YEAR } from './cpi-data';

function formatMoney(value: number) {
  return value.toLocaleString('cs-CZ', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

function parseNumber(value: string) {
  const normalized = value.replace(/\s+/g, '').replace(',', '.').trim();
  if (normalized === '') {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function getCpiEntry(year: number) {
  return CPI_INDEX.find((entry) => entry.year === year) ?? null;
}

export const InflationCalculator: React.FC = () => {
  const [amountText, setAmountText] = useState('');
  const [yearText, setYearText] = useState('');

  const result = useMemo(() => {
    const amount = parseNumber(amountText);
    const year = parseNumber(yearText);

    if (amount === null || year === null) {
      return null;
    }

    const roundedYear = Math.trunc(year);
    if (roundedYear < FIRST_CPI_YEAR || roundedYear > LAST_CPI_YEAR) {
      return { error: `Zadej rok mezi ${FIRST_CPI_YEAR} a ${LAST_CPI_YEAR}.` };
    }

    const fromEntry = getCpiEntry(roundedYear);
    const toEntry = getCpiEntry(LAST_CPI_YEAR);
    if (!fromEntry || !toEntry) {
      return { error: 'Pro tento rok chybí CPI index.' };
    }

    const factor = toEntry.index / fromEntry.index;
    const todayValue = amount * factor;

    return {
      amount,
      year: roundedYear,
      factor,
      source: fromEntry.source,
      todayValue,
      increase: todayValue - amount,
    };
  }, [amountText, yearText]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.infoPill}>CPI 1900-2025</div>
        <div className={styles.infoPill}>Lund + ČSÚ</div>
      </div>

      <div className={styles.inputsSection}>
        <div className={styles.inputBlock}>
          <label className={styles.label}>Částka</label>
          <div className={styles.inputWrap}>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
              className={styles.input}
            />
            <span className={styles.unit}>Kč</span>
          </div>
        </div>

        <div className={styles.inputBlock}>
          <label className={styles.label}>Rok</label>
          <div className={styles.inputWrap}>
            <input
              type="number"
              min={FIRST_CPI_YEAR}
              max={LAST_CPI_YEAR}
              placeholder="1900"
              value={yearText}
              onChange={(event) => setYearText(event.target.value)}
              className={styles.input}
            />
          </div>
        </div>
      </div>

      <div className={styles.resultCard}>
        {result && 'error' in result ? (
          <>
            <div className={styles.resultLabel}>Chyba</div>
            <div className={styles.resultValue}>{result.error}</div>
          </>
        ) : result ? (
          <>
            <div className={styles.resultLabel}>Dnešní hodnota</div>
            <div className={styles.resultValue}>{formatMoney(result.todayValue)} Kč</div>
            <div className={styles.resultMeta}>
              {formatMoney(result.amount)} Kč v roce {result.year} má dnes hodnotu zhruba{' '}
              {formatMoney(result.todayValue)} Kč.
            </div>
            {result.source === 'proxy' ? (
              <div className={styles.warning}>
                Roky 1900-1922 jsou historický odhad přes rakouský CPI proxy.
              </div>
            ) : null}
            <div className={styles.resultStats}>
              <span>Zdražení: +{formatMoney(result.increase)} Kč</span>
              <span>Koeficient: {result.factor.toFixed(3)}x</span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.resultLabel}>Dnešní hodnota</div>
            <div className={styles.resultValueMuted}>Zadej částku a rok</div>
          </>
        )}
      </div>
    </div>
  );
};
