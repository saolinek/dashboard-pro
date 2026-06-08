'use client';

import React, { useEffect, useState } from 'react';
import styles from './odstavka-deadline.module.css';

const DEADLINE_DAYS = 20;

function addCalendarDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getNextWorkingDate(targetDate: Date) {
  const result = new Date(targetDate);
  const day = result.getDay();

  if (day === 6) {
    result.setDate(result.getDate() + 2);
  } else if (day === 0) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'long',
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

export const OutageDeadline: React.FC = () => {
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const updateToday = () => setToday(new Date());
    updateToday();
    const interval = setInterval(updateToday, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!today) {
    return <div className={styles.container}>--</div>;
  }

  const calendarTarget = addCalendarDays(today, DEADLINE_DAYS);
  const maxWorkingDate = getNextWorkingDate(calendarTarget);
  const weekendAdjusted = !isSameDay(calendarTarget, maxWorkingDate);

  return (
    <div className={styles.container}>
      <div className={styles.label}>Maximální datum</div>
      <div className={styles.date}>{formatDate(maxWorkingDate)}</div>
      <div className={styles.subline}>
        {DEADLINE_DAYS} kalendářních dnů od dneška
      </div>
      <div className={styles.note}>
        {weekendAdjusted
          ? 'Konec vychází na víkend, proto se posouvá na pondělí.'
          : 'Konec nevychází na víkend, datum je už konečné.'}
      </div>
    </div>
  );
};
