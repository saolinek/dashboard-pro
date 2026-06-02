'use client';

import React, { useState, useEffect } from 'react';
import styles from './clock.module.css';

export const ClockComponent: React.FC = () => {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return <div className={styles.container}>--:--</div>;
  }

  const timeString = time.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const dateString = time.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className={styles.container}>
      <div className={styles.time}>{timeString}</div>
      <div className={styles.date}>{dateString}</div>
    </div>
  );
};
