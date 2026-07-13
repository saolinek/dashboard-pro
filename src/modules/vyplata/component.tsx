'use client';

import React, { useEffect, useMemo, useState } from 'react';
import styles from './vyplata.module.css';

type PayrollItem = {
  publishedAt: string;
};

const PAYROLL_DATES: PayrollItem[] = [
  { publishedAt: '2025-12-08' },
  { publishedAt: '2026-01-09' },
  { publishedAt: '2026-02-09' },
  { publishedAt: '2026-03-09' },
  { publishedAt: '2026-04-10' },
  { publishedAt: '2026-05-12' },
  { publishedAt: '2026-06-08' },
  { publishedAt: '2026-07-09' },
  { publishedAt: '2026-08-10' },
  { publishedAt: '2026-09-08' },
  { publishedAt: '2026-10-08' },
  { publishedAt: '2026-11-09' },
  { publishedAt: '2026-12-08' },
  { publishedAt: '2027-01-11' },
];

const PREMIUM_PAYMENT_MONTHS = new Set([1, 4, 7, 10]);

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

function calendarDaysUntil(today: Date, target: Date) {
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const targetUtc = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((targetUtc - todayUtc) / 86_400_000);
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

  const upcomingPayments = useMemo(() => {
    if (!today) {
      return [];
    }

    return PAYROLL_DATES.filter((item) => toLocalDate(item.publishedAt) >= today);
  }, [today]);

  const nextPayment = upcomingPayments[0] ?? null;
  const premiumPaymentIndex = upcomingPayments.findIndex((item) =>
    PREMIUM_PAYMENT_MONTHS.has(toLocalDate(item.publishedAt).getMonth())
  );

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

  const paymentDate = toLocalDate(nextPayment.publishedAt);
  const daysUntilPayment = calendarDaysUntil(today, paymentDate);

  return (
    <div className={styles.container}>
      <div className={styles.label}>
        {daysUntilPayment === 0 ? 'Výplata dnes' : `Výplata za ${daysUntilPayment} dní`}
      </div>
      <div className={styles.amount}>{formatDate(paymentDate)}</div>
      {premiumPaymentIndex >= 0 && (
        <div className={styles.premiumIndicator}>
          {premiumPaymentIndex === 0
            ? 'Příští výplata je prémiová'
            : `Prémiová bude ${premiumPaymentIndex + 1}. příští výplata`}
        </div>
      )}
    </div>
  );
};
