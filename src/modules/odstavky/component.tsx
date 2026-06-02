'use client';

import React, { useState, useEffect } from 'react';
import styles from './odstavky.module.css';

export const OutagePlanner: React.FC = () => {
  const [day, setDay] = useState(new Date().getDate());
  const [month, setMonth] = useState(new Date().getMonth());
  const [result, setResult] = useState<{ diff: number; ok: boolean } | null>(null);

  const months = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ];

  const daysInMonth = (m: number) => {
    const year = new Date().getFullYear();
    return new Date(year, m + 1, 0).getDate();
  };

  const handleCheck = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let outage = new Date(today.getFullYear(), month, day);
    if (outage < today) {
      outage.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = outage.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    setResult({
      diff: diffDays,
      ok: diffDays >= 20,
    });
  };

  useEffect(() => {
    handleCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, month]);

  const maxDays = daysInMonth(month);
  const dayOptions = Array.from({ length: maxDays }, (_, i) => i + 1);

  return (
    <div className={styles.container}>
      <div className={styles.leftCol}>
        <div className={styles.inputGroup}>
          <select
            value={day}
            onChange={(e) => setDay(parseInt(e.target.value))}
            className={styles.select}
          >
            {dayOptions.map((d) => (
              <option key={d} value={d}>
                {d}.
              </option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className={styles.select}
          >
            {months.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <button onClick={handleCheck} className={styles.checkButton}>
          Přepočítat
        </button>
      </div>

      <div className={styles.rightCol}>
        {result && (
          <div className={`${styles.resultBox} ${result.ok ? styles.okBorder : styles.badBorder}`}>
            <div className={`${styles.resLabel} ${result.ok ? styles.okText : styles.badText}`}>
              {result.ok ? 'Lhůta v pořádku' : 'Nedostatečná lhůta'}
            </div>
            <div className={styles.resDays}>{result.diff} dní</div>
            <div className={styles.resSub}>{result.ok ? 'předem' : 'zbývá (min. 20)'}</div>
          </div>
        )}

        <div className={styles.legalNote}>
          Vnitřní pravidlo: min. 20 dní
        </div>
      </div>
    </div>
  );
};
