'use client';

import React, { useEffect, useState } from 'react';
import { DEADLINE_DAYS, calculateOutageDeadline } from './date-utils';
import styles from './odstavka-deadline.module.css';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
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

  const { deadlineDate } = calculateOutageDeadline(today);

  return (
    <div className={styles.container}>
      <div className={styles.label}>Maximální datum</div>
      <div className={styles.date}>{formatDate(deadlineDate)}</div>
      <div className={styles.subline}>
        {DEADLINE_DAYS} pracovních dnů od dneška
      </div>
      <div className={styles.note}>Víkendy a svátky se do lhůty nepočítají.</div>
    </div>
  );
};
