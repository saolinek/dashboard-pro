'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './spojeni-uzlu.module.css';

const DEFAULT_AREAS = ['ORLU', 'ALB_'];

export const SpojeniUzluComponent: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [areas, setAreas] = useState<string[]>(DEFAULT_AREAS);
  const [areaA, setAreaA] = useState('ORLU');
  const [areaB, setAreaB] = useState('ALB_');

  // Set default date to today (YYYY-MM-DD)
  const [date, setDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAreaText, setNewAreaText] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  // Hydration & Initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);

      // Load areas from localStorage
      const savedAreas = localStorage.getItem('node_areas_list');
      let loadedAreas = DEFAULT_AREAS;
      if (savedAreas) {
        try {
          loadedAreas = JSON.parse(savedAreas);
          setAreas(loadedAreas);
        } catch (e) {
          console.error('Failed to parse saved areas', e);
        }
      }

      // Load session values
      const a = localStorage.getItem('last_session_a');
      const b = localStorage.getItem('last_session_b');
      const d = localStorage.getItem('last_session_date');
      const s = localStorage.getItem('last_session_start');
      const e = localStorage.getItem('last_session_end');

      if (a && loadedAreas.includes(a)) setAreaA(a);
      else if (loadedAreas.length > 0) setAreaA(loadedAreas[0]);

      if (b && loadedAreas.includes(b)) setAreaB(b);
      else if (loadedAreas.length > 1) setAreaB(loadedAreas[1]);

      if (d) setDate(d);
      if (s) setTimeStart(s);
      if (e) setTimeEnd(e);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Automatické mizení notifikací
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  // Sync to local storage helper
  const saveSession = (
    updatedA: string,
    updatedB: string,
    updatedDate: string,
    updatedStart: string,
    updatedEnd: string
  ) => {
    localStorage.setItem('last_session_a', updatedA);
    localStorage.setItem('last_session_b', updatedB);
    localStorage.setItem('last_session_date', updatedDate);
    localStorage.setItem('last_session_start', updatedStart);
    localStorage.setItem('last_session_end', updatedEnd);
  };

  const handleAreaAChange = (val: string) => {
    setAreaA(val);
    saveSession(val, areaB, date, timeStart, timeEnd);
  };

  const handleAreaBChange = (val: string) => {
    setAreaB(val);
    saveSession(areaA, val, date, timeStart, timeEnd);
  };

  const handleDateChange = (val: string) => {
    setDate(val);
    saveSession(areaA, areaB, val, timeStart, timeEnd);
  };

  const handleTimeStartChange = (val: string) => {
    setTimeStart(val);
    saveSession(areaA, areaB, date, val, timeEnd);
  };

  const handleTimeEndChange = (val: string) => {
    setTimeEnd(val);
    saveSession(areaA, areaB, date, timeStart, val);
  };

  // Add new node area
  const handleAddNewArea = () => {
    const val = newAreaText.trim().toUpperCase();

    if (!val) {
      setError('Název oblasti nesmí být prázdný.');
      return;
    }

    if (areas.includes(val)) {
      setError('Tato uzlová oblast již existuje.');
      return;
    }

    const updatedAreas = [...areas, val];
    setAreas(updatedAreas);
    localStorage.setItem('node_areas_list', JSON.stringify(updatedAreas));

    // Automatically select the newly added area
    setAreaA(val);
    saveSession(val, areaB, date, timeStart, timeEnd);

    setIsModalOpen(false);
    setNewAreaText('');
    setError('');
  };

  // Convert YYYY-MM-DD to Czech DD.MM.YYYY
  const formatDateCzech = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    return `${parseInt(d, 10)}.${parseInt(m, 10)}.${y}`;
  };

  const generateSubject = (): string => {
    return `Prosím o předání informace o spojení dvou uzlových oblastí ${areaA || '---'}><${areaB || '---'}`;
  };

  const generateBody = (): string => {
    const czechDate = formatDateCzech(date);
    const areas = `${areaA || '---'}><${areaB || '---'}`;
    const startTime = timeStart || '--:--';
    const endTime = timeEnd || '--:--';

    return [
      'Ahoj,',
      '',
      `Prosím o předání informace o spojení dvou uzlových oblastí       ${areas}`,
      '',
      `Počáteční manipulace:                                                                                   ${czechDate}       ${startTime}`,
      '',
      `Poslední manipulace:                                                                                      ${czechDate}       ${endTime}`,
      '',
      'Děkuji',
    ].join('\n');
  };



  // Create & trigger email via mailto
  const handleCreateEmail = () => {
    setError('');

    if (areaA === areaB) {
      setError('Oblast A a Oblast B nesmí být stejné.');
      return;
    }
    if (!date) {
      setError('Vyberte platné datum.');
      return;
    }
    if (!timeStart || !timeEnd) {
      setError('Oba časy jsou povinné.');
      return;
    }

    const subject = generateSubject();
    const body = generateBody();

    window.location.href = `mailto:kamil.pupik@cezdistribuce.cz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (!isMounted) {
    return <div className={styles.container}>Načítám...</div>;
  }

  return (
    <div className={styles.container} style={{ overflowY: 'auto' }}>
      <div className={styles.title}>Spojení uzlových oblastí</div>

      {/* Notification toast */}
      {notification && (
        <div className={`${styles.notification} ${notification.type === 'success' ? styles.notificationSuccess : styles.notificationError}`} role="alert">
          <span>{notification.message}</span>
          <button type="button" className={styles.notificationClose} onClick={() => setNotification(null)}>&times;</button>
        </div>
      )}
      {/* Error display */}
      {error && <div className={styles.errorMsg}>{error}</div>}

      {/* Main form */}
      <div className={styles.form}>
        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Oblast A</label>
            <select
              value={areaA}
              onChange={(e) => handleAreaAChange(e.target.value)}
              className={styles.select}
            >
              {areas.map((item) => (
                <option key={`a-${item}`} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Oblast B</label>
            <select
              value={areaB}
              onChange={(e) => handleAreaBChange(e.target.value)}
              className={styles.select}
            >
              {areas.map((item) => (
                <option key={`b-${item}`} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          className={styles.addAreaBtn}
          onClick={() => {
            setError('');
            setIsModalOpen(true);
          }}
          title="Přidat oblast"
        >
          + Přidat oblast
        </button>

        <div className={styles.formGroup}>
          <label className={styles.label}>Datum manipulace</label>
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className={styles.input}
            required
          />
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Počáteční čas</label>
            <input
              type="time"
              value={timeStart}
              onChange={(e) => handleTimeStartChange(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Koncový čas</label>
            <input
              type="time"
              value={timeEnd}
              onChange={(e) => handleTimeEndChange(e.target.value)}
              className={styles.input}
              required
            />
          </div>
        </div>
        <button
          type="button"
          className={styles.submitBtn}
          onClick={handleCreateEmail}
        >
          Vytvořit e-mail
        </button>
      </div>

      {/* Živý náhled */}
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>Živý náhled</div>
        <div className={styles.previewBox}>
          <div className={styles.previewBody} style={{ fontWeight: 'bold', color: 'var(--md-sys-color-primary)' }}>
            Předmět: {generateSubject()}
          </div>
          <div className={styles.previewDivider} />
          <pre className={styles.previewBody}>{generateBody()}</pre>
        </div>
      </div>



      {/* Modal Dialog for adding a new area via React Portal */}
      {isModalOpen && createPortal(
        <div
          className={styles.modalBg}
          onClick={() => {
            setIsModalOpen(false);
            setNewAreaText('');
            setError('');
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>Nová uzlová oblast</h3>
            <div className={styles.formGroup}>
              <label className={styles.label}>Název oblasti (např. ABC_)</label>
              <input
                type="text"
                value={newAreaText}
                onChange={(e) => setNewAreaText(e.target.value)}
                placeholder="Napište název..."
                className={styles.input}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewArea();
                  } else if (e.key === 'Escape') {
                    setIsModalOpen(false);
                    setNewAreaText('');
                    setError('');
                  }
                }}
                autoFocus
              />
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setIsModalOpen(false);
                  setNewAreaText('');
                  setError('');
                }}
              >
                Zrušit
              </button>
              <button
                type="button"
                className={styles.saveBtn}
                onClick={handleAddNewArea}
              >
                Přidat
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
