'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './svatek.module.css';

interface NamedayDay {
  date: string;
  dayNumber: string;
  dayInWeek: string;
  monthNumber: string;
  month: { nominative: string; genitive: string };
  year: string;
  name: string;
  isHoliday: boolean;
  holidayName: string | null;
}

interface NamedayResponse {
  name: string;
  isHoliday: boolean;
  holidayName: string | null;
}

interface IntervalResponse {
  days: NamedayDay[];
}

function isNamedayResponse(value: unknown): value is NamedayResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'isHoliday' in value &&
    'holidayName' in value &&
    typeof value.name === 'string' &&
    typeof value.isHoliday === 'boolean' &&
    (value.holidayName === null || typeof value.holidayName === 'string')
  );
}

function isIntervalResponse(value: unknown): value is IntervalResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'days' in value &&
    Array.isArray((value as IntervalResponse).days)
  );
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysUntilSunday(): number {
  return (7 - new Date().getDay()) % 7;
}

function formatDay(day: NamedayDay): string {
  return `${day.dayNumber}. ${day.month.genitive}`;
}

export const NamedaysComponent: React.FC = () => {
  const [todayData, setTodayData] = useState<NamedayResponse | null>(null);
  const [weekDays, setWeekDays] = useState<NamedayDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    let active = true;
    const todayController = new AbortController();
    const weekController = new AbortController();
    const timeout = window.setTimeout(() => {
      todayController.abort();
      weekController.abort();
    }, 6_000);

    const today = todayStr();
    const count = daysUntilSunday() + 1;

    Promise.all([
      fetch('https://svatkyapi.cz/api/day', { signal: todayController.signal }).then((r) => r.json()),
      fetch(`https://svatkyapi.cz/api/day/${today}/interval/${count}`, { signal: weekController.signal }).then((r) => r.json()),
    ])
      .then(([todayJson, weekJson]) => {
        if (!active) return;
        if (!isNamedayResponse(todayJson) || !isIntervalResponse(weekJson)) {
          throw new Error('Neplatná odpověď API');
        }
        setTodayData(todayJson);
        setWeekDays(weekJson.days);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof DOMException && err.name === 'AbortError') {
          setError('Svátky jsou nedostupné');
        } else {
          setError('Chyba načítání');
        }
        setLoading(false);
      })
      .finally(() => {
        window.clearTimeout(timeout);
      });

    return () => {
      active = false;
      todayController.abort();
      weekController.abort();
      window.clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const cleanup = fetchData();
    return cleanup;
  }, [fetchData]);

  if (loading) {
    return <div className={styles.container}>Načítám...</div>;
  }

  if (error || !todayData) {
    return <div className={styles.container}>{error || 'Chyba'}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.todaySection}>
        <div className={styles.title}>Dnes má svátek</div>
        <div className={styles.name}>{todayData.name}</div>
        {todayData.isHoliday && todayData.holidayName && (
          <div className={styles.holiday}>{todayData.holidayName}</div>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.weekSection}>
        <div className={styles.weekTitle}>Do konce týdne</div>
        <div className={styles.daysList}>
          {weekDays.map((day) => (
            <div key={day.date} className={styles.dayRow}>
              <span className={styles.dayOfWeek}>{day.dayInWeek}</span>
              <span className={styles.dateText}>{formatDay(day)}</span>
              <span className={styles.nameSmall}>{day.name}</span>
              {day.isHoliday && day.holidayName && (
                <span className={styles.holidayBadge}>{day.holidayName}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
