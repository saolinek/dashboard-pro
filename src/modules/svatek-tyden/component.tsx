'use client';

import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './svatek-tyden.module.css';

const dayNames: Record<number, string> = {
  0: 'neděle',
  1: 'pondělí',
  2: 'úterý',
  3: 'středa',
  4: 'čtvrtek',
  5: 'pátek',
  6: 'sobota',
};

const monthNames: Record<number, string> = {
  0: 'ledna',
  1: 'února',
  2: 'března',
  3: 'dubna',
  4: 'května',
  5: 'června',
  6: 'července',
  7: 'srpna',
  8: 'září',
  9: 'října',
  10: 'listopadu',
  11: 'prosince',
};

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDaysInRange(start: string): { dateStr: string; dayName: string; dayNum: string; month: string }[] {
  const startDate = new Date(start + 'T00:00:00');
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + index);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');

    return {
      dateStr: `${y}-${m}-${d}`,
      dayName: dayNames[current.getDay()],
      dayNum: String(current.getDate()),
      month: monthNames[current.getMonth()],
    };
  });
}

function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

function shiftDate(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatSelectedDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return `${date.getDate()}. ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function getCalendarDays(month: Date): Date[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const firstVisibleDay = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDay);
    date.setDate(firstVisibleDay.getDate() + index);
    return date;
  });
}

function dateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const TydenComponent: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(() => todayStr());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => {
    const date = new Date(`${todayStr()}T00:00:00`);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const days = useMemo(() => getDaysInRange(selectedDate), [selectedDate]);
  const calendarDays = useMemo(() => getCalendarDays(pickerMonth), [pickerMonth]);

  const selectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsPickerOpen(false);
  };

  const openPicker = () => {
    const date = new Date(`${selectedDate}T00:00:00`);
    setPickerMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setIsPickerOpen(true);
  };

  const changePickerMonth = (offset: number) => {
    setPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button type="button" className={styles.dayStep} onClick={() => setSelectedDate(shiftDate(selectedDate, -1))} aria-label="Předchozí den">
          ‹
        </button>
        <button type="button" className={styles.dateButton} onClick={openPicker} aria-haspopup="dialog" aria-expanded={isPickerOpen}>
          {formatSelectedDate(selectedDate)}
        </button>
        <button type="button" className={styles.dayStep} onClick={() => setSelectedDate(shiftDate(selectedDate, 1))} aria-label="Další den">
          ›
        </button>
        <span className={styles.headerLabel}>7 dní</span>
      </div>

      <div className={styles.daysList}>
        {days.map((day) => (
          <button
            type="button"
            key={day.dateStr}
            className={[styles.dayRow, day.dateStr === selectedDate ? styles.dayRowSelected : '', isToday(day.dateStr) ? styles.dayRowToday : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => selectDate(day.dateStr)}
          >
            <span className={styles.dayOfWeek}>{day.dayName}</span>
            <span className={styles.dateText}>{day.dayNum}. {day.month}</span>
          </button>
        ))}
      </div>

      {isPickerOpen && createPortal(
        <div className={styles.pickerOverlay} role="presentation" onMouseDown={() => setIsPickerOpen(false)}>
          <section className={styles.picker} role="dialog" aria-modal="true" aria-label="Vyberte den" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.pickerHeader}>
              <button type="button" className={styles.monthButton} onClick={() => changePickerMonth(-1)} aria-label="Předchozí měsíc">‹</button>
              <strong>{monthNames[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}</strong>
              <button type="button" className={styles.monthButton} onClick={() => changePickerMonth(1)} aria-label="Další měsíc">›</button>
            </div>
            <div className={styles.weekdayNames} aria-hidden="true">
              {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className={styles.calendarDays}>
              {calendarDays.map((date) => {
                const dateStr = dateToString(date);
                const isCurrentMonth = date.getMonth() === pickerMonth.getMonth();
                return (
                  <button
                    type="button"
                    key={dateStr}
                    className={[styles.calendarDay, !isCurrentMonth ? styles.calendarDayOutside : '', dateStr === selectedDate ? styles.calendarDaySelected : '', isToday(dateStr) ? styles.calendarDayToday : ''].filter(Boolean).join(' ')}
                    onClick={() => selectDate(dateStr)}
                    aria-label={formatSelectedDate(dateStr)}
                    aria-pressed={dateStr === selectedDate}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <button type="button" className={styles.todayButton} onClick={() => selectDate(todayStr())}>Dnes</button>
          </section>
        </div>
      , document.body)}
    </div>
  );
};
