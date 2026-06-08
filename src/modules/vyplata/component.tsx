'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './vyplata.module.css';

type PayrollItem = {
  monthLabel: string;
  publishedAt: string;
};

const PAYROLL_DATES: PayrollItem[] = [
  { monthLabel: 'listopad 25', publishedAt: '2025-12-08' },
  { monthLabel: 'prosinec 25', publishedAt: '2026-01-09' },
  { monthLabel: 'leden 26', publishedAt: '2026-02-09' },
  { monthLabel: 'únor 26', publishedAt: '2026-03-09' },
  { monthLabel: 'březen 26', publishedAt: '2026-04-10' },
  { monthLabel: 'duben 26', publishedAt: '2026-05-12' },
  { monthLabel: 'květen 26', publishedAt: '2026-06-08' },
  { monthLabel: 'červen 26', publishedAt: '2026-07-09' },
  { monthLabel: 'červenec 26', publishedAt: '2026-08-10' },
  { monthLabel: 'srpen 26', publishedAt: '2026-09-08' },
  { monthLabel: 'září 26', publishedAt: '2026-10-08' },
  { monthLabel: 'říjen 26', publishedAt: '2026-11-09' },
  { monthLabel: 'listopad 26', publishedAt: '2026-12-08' },
  { monthLabel: 'prosinec 26', publishedAt: '2027-01-11' },
];

function toLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const PayrollWidget: React.FC = () => {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      setToday(now);
    };

    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []);

  const nextPayment = useMemo(() => {
    if (!today) {
      return null;
    }

    return PAYROLL_DATES.find((item) => {
      const publishedAt = toLocalDate(item.publishedAt);
      return publishedAt.getTime() >= today.getTime();
    }) ?? null;
  }, [today]);

  if (!today) {
    return <div className={styles.container}>--</div>;
  }

  if (!nextPayment) {
    return (
      <div className={styles.container}>
        <div className={styles.label}>Výplata</div>
        <div className={styles.empty}>Žádný další termín v tabulce</div>
      </div>
    );
  }

  const publishedAt = toLocalDate(nextPayment.publishedAt);
  const isToday = isSameDay(today, publishedAt);

  return (
    <div className={styles.container}>
      <div className={styles.label}>Další termín výplaty</div>
      <div className={styles.amount}>{formatDate(publishedAt)}</div>
      <div className={styles.month}>{nextPayment.monthLabel}</div>
      <div className={`${styles.badge} ${isToday ? styles.today : styles.upcoming}`}>
        {isToday ? 'Dnes' : 'Nejbližší termín'}
      </div>
    </div>
  );
};
