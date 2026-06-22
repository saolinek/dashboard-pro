'use client';

import React, { useState } from 'react';
import {
  DEADLINE_DAYS,
  countWorkingDaysBetween,
  getNextWorkingDate,
  toLocalDate,
} from '@/modules/odstavka-deadline/date-utils';
import styles from './odstavky.module.css';

export const OutagePlanner: React.FC = () => {
  const [day, setDay] = useState(new Date().getDate());
  const [month, setMonth] = useState(new Date().getMonth());

  const months = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ];

  const daysInMonth = (m: number) => {
    const year = new Date().getFullYear();
    return new Date(year, m + 1, 0).getDate();
  };

  const today = toLocalDate(new Date());

  const outage = new Date(today.getFullYear(), month, day);
  if (outage < today) {
    outage.setFullYear(today.getFullYear() + 1);
  }

  const normalizedOutage = getNextWorkingDate(outage);
  const diffDays = countWorkingDaysBetween(today, normalizedOutage);

  const result = {
    diff: diffDays,
    ok: diffDays >= DEADLINE_DAYS,
  };

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
      </div>

      <div className={styles.rightCol}>
        <div className={`${styles.resultBox} ${result.ok ? styles.okBorder : styles.badBorder}`}>
          <div className={`${styles.resLabel} ${result.ok ? styles.okText : styles.badText}`}>
            {result.ok ? 'Lhůta v pořádku' : 'Nedostatečná lhůta'}
          </div>
          <div className={styles.resDays}>{result.diff} pracovních dní</div>
          <div className={styles.resSub}>
            {result.ok ? 'předem' : 'zbývá (min. 20 pracovních dní)'}
          </div>
        </div>

        <div className={styles.legalNote}>
          Vnitřní pravidlo: min. 20 pracovních dní
        </div>
      </div>
    </div>
  );
};
