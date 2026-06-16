'use client';

import React, { useMemo, useState } from 'react';
import styles from './inflace.module.css';

const INFLATION_RATES = [
  { year: 1993, rate: 20.8 },
  { year: 1994, rate: 10.0 },
  { year: 1995, rate: 9.1 },
  { year: 1996, rate: 8.8 },
  { year: 1997, rate: 8.5 },
  { year: 1998, rate: 10.7 },
  { year: 1999, rate: 2.1 },
  { year: 2000, rate: 3.9 },
  { year: 2001, rate: 4.7 },
  { year: 2002, rate: 1.8 },
  { year: 2003, rate: 0.1 },
  { year: 2004, rate: 2.8 },
  { year: 2005, rate: 1.9 },
  { year: 2006, rate: 2.5 },
  { year: 2007, rate: 2.8 },
  { year: 2008, rate: 6.3 },
  { year: 2009, rate: 1.0 },
  { year: 2010, rate: 1.5 },
  { year: 2011, rate: 1.9 },
  { year: 2012, rate: 3.3 },
  { year: 2013, rate: 1.4 },
  { year: 2014, rate: 0.4 },
  { year: 2015, rate: 0.3 },
  { year: 2016, rate: 0.7 },
  { year: 2017, rate: 2.5 },
  { year: 2018, rate: 2.1 },
  { year: 2019, rate: 2.8 },
  { year: 2020, rate: 3.2 },
  { year: 2021, rate: 3.8 },
  { year: 2022, rate: 15.1 },
  { year: 2023, rate: 10.7 },
  { year: 2024, rate: 2.4 },
  { year: 2025, rate: 2.5 },
] as const;

const FIRST_YEAR = INFLATION_RATES[0].year;
const LAST_YEAR = INFLATION_RATES[INFLATION_RATES.length - 1].year;

function formatMoney(value: number) {
  return value.toLocaleString('cs-CZ', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

function formatPercent(value: number) {
  return value.toLocaleString('cs-CZ', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
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

function calculateInflationFactor(fromYear: number, toYear: number) {
  if (fromYear >= toYear) {
    return 1;
  }

  return INFLATION_RATES.filter((entry) => entry.year > fromYear && entry.year <= toYear).reduce(
    (factor, entry) => factor * (1 + entry.rate / 100),
    1,
  );
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
    if (roundedYear < FIRST_YEAR || roundedYear > LAST_YEAR) {
      return { error: `Zadej rok mezi ${FIRST_YEAR} a ${LAST_YEAR}.` };
    }

    const factor = calculateInflationFactor(roundedYear, LAST_YEAR);
    const todayValue = amount * factor;

    return {
      amount,
      year: roundedYear,
      factor,
      todayValue,
      increase: todayValue - amount,
    };
  }, [amountText, yearText]);

  const latestRate = INFLATION_RATES[INFLATION_RATES.length - 1];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.infoPill}>ČSÚ 1993-2025</div>
        <div className={styles.infoPill}>poslední celý rok 2025</div>
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
              min={FIRST_YEAR}
              max={LAST_YEAR}
              placeholder="2015"
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
              {formatMoney(result.amount)} Kč v roce {result.year} odpovídá po započtení průměrné
              roční inflace zhruba {formatMoney(result.todayValue)} Kč v roce {LAST_YEAR}.
            </div>
            <div className={styles.resultStats}>
              <span>Zdražení: +{formatMoney(result.increase)} Kč</span>
              <span>Koeficient: {result.factor.toFixed(3)}x</span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.resultLabel}>Dnešní hodnota</div>
            <div className={styles.resultValueMuted}>Zadej částku a rok</div>
            <div className={styles.resultMeta}>
              Přepočet používá průměrnou roční inflaci ČSÚ. Poslední dostupný celý rok je{' '}
              {latestRate.year} s inflací {formatPercent(latestRate.rate)} %.
            </div>
          </>
        )}
      </div>
    </div>
  );
};
