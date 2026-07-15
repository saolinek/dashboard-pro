'use client';

import React, { useState, useEffect } from 'react';
import styles from './generator-storno-h1.module.css';

// Výchozí seznam příjemců
const DEFAULT_KOMU = `12_A86100 - oddělení Péče o veřejný sektor <12_A86100@cezdistribuce.cz>;
12_A00000 - ČEZ Distribuce KC koordinátoři <koordinatori_KC_CEZd@cezdistribuce.cz>;
Holštein Petr <petr.holstein@cezdistribuce.cz>;
Šlajchrt Roman <roman.slajchrt@cezdistribuce.cz>;
Rajevski Michal <michal.rajevski@cezdistribuce.cz>;
Švub Ondřej <ondrej.svub@cezdistribuce.cz>;
Vavřiníková Ivana <Ivana.Vavrinikova@cezdistribuce.cz>;
Hušek Martin <martin.husek@cezdistribuce.cz>`;

const DEFAULT_KOPIE = `Rada Miroslav <miroslav.rada@cezdistribuce.cz>;
Čepelák Stanislav <stanislav.cepelak@cezdistribuce.cz>`;

const STORAGE_KEY = 'dashboard_storno_h1_state';

// Rozhraní pro stav formuláře
interface FormState {
  reportNumber: string;
  shutdownDate: string;
  municipality: string;
  region: string;
  cancelReason: string;
  justification: string;
  customersB: number;
  customersC: number;
  customersD: number;
  recipientsTo: string;
  recipientsCc: string;
}

export const StornoH1Generator: React.FC = () => {
  // Inicializace stavu
  const [reportNumber, setReportNumber] = useState('');
  const [shutdownDate, setShutdownDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [municipality, setMunicipality] = useState('Karviná');
  const [region, setRegion] = useState('OMO oblast KA');
  const [cancelReason, setCancelReason] = useState('Storno žadatelem');
  const [justification, setJustification] = useState('Storno zadavatelem');
  const [customersB, setCustomersB] = useState<number>(0);
  const [customersC, setCustomersC] = useState<number>(0);
  const [customersD, setCustomersD] = useState<number>(0);
  const [recipientsTo, setRecipientsTo] = useState(DEFAULT_KOMU);
  const [recipientsCc, setRecipientsCc] = useState(DEFAULT_KOPIE);

  // UX & Validace
  const [isMounted, setIsMounted] = useState(false);
  const [validatedOnce, setValidatedOnce] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loadingButton, setLoadingButton] = useState<'outlook' | 'subject' | 'body' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Pomocný formát data na DD.MM.RRRR
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'DD.MM.RRRR';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateStr;
  };

  // Načtení uloženého stavu (loadState)
  const loadState = (): void => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data: FormState = JSON.parse(saved);
        if (data.reportNumber !== undefined) setReportNumber(data.reportNumber);
        if (data.shutdownDate !== undefined) setShutdownDate(data.shutdownDate);
        if (data.municipality !== undefined) setMunicipality(data.municipality);
        if (data.region !== undefined) setRegion(data.region);
        if (data.cancelReason !== undefined) setCancelReason(data.cancelReason);
        if (data.justification !== undefined) setJustification(data.justification);
        if (data.customersB !== undefined) setCustomersB(data.customersB);
        if (data.customersC !== undefined) setCustomersC(data.customersC);
        if (data.customersD !== undefined) setCustomersD(data.customersD);
        if (data.recipientsTo !== undefined) setRecipientsTo(data.recipientsTo);
        if (data.recipientsCc !== undefined) setRecipientsCc(data.recipientsCc);
      }
    } catch (e) {
      console.error('Chyba při načítání stavu z localStorage:', e);
    }
  };

  // Uložení stavu (saveState)
  const saveState = (updatedFields: Partial<FormState>): void => {
    if (!isMounted) return;
    try {
      const currentState: FormState = {
        reportNumber,
        shutdownDate,
        municipality,
        region,
        cancelReason,
        justification,
        customersB,
        customersC,
        customersD,
        recipientsTo,
        recipientsCc,
        ...updatedFields,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (e) {
      console.error('Chyba při ukládání stavu do localStorage:', e);
    }
  };

  // Načtení stavu po připojení komponenty s asynchronní inicializací kvůli ESLint pravidlům
  useEffect(() => {
    let isCurrent = true;
    const init = async () => {
      await Promise.resolve();
      if (isCurrent) {
        loadState();
        setIsMounted(true);
      }
    };
    init();
    return () => {
      isCurrent = false;
    };
  }, []);

  // Automatické ukládání stavu při změnách
  useEffect(() => {
    if (isMounted) {
      saveState({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    reportNumber,
    shutdownDate,
    municipality,
    region,
    cancelReason,
    justification,
    customersB,
    customersC,
    customersD,
    recipientsTo,
    recipientsCc,
  ]);

  // Automatické mizení notifikací
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Generování předmětu (generateSubject)
  const generateSubject = (): string => {
    const cleanNum = reportNumber.trim();
    const formattedDate = formatDate(shutdownDate);
    const cleanMunicipality = municipality.trim() || 'Karviná';
    return `STORNO H1-${cleanNum || 'xxxxxxxxxxxx'} na ${formattedDate} ${cleanMunicipality}`;
  };

  // Generování těla (generateBody)
  const generateBody = (): string => {
    const cleanNum = reportNumber.trim();
    const formattedDate = formatDate(shutdownDate);
    const cleanRegion = region.trim() || 'OMO oblast KA';
    const cleanMunicipality = municipality.trim() || 'Karviná';
    const cleanJustification = justification.trim() || '...';

    return `Dobrý den, hlášení H1-${cleanNum || 'xxxxxxxxxxxx'} bylo stornováno v době kratší než 7 dní před plánovanou odstávkou.

Storno: H1-${cleanNum || 'xxxxxxxxxxxx'}
Oblast: ${cleanRegion}
Obec: ${cleanMunicipality}
Datum: ${formattedDate}
Důvod: ${cancelReason}, zdůvodnění: „${cleanJustification}“
Zákazníci: B-${customersB}, C-${customersC}, D-${customersD}`;
  };

  // Validace povinných polí (validate)
  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;

    if (!reportNumber.trim()) {
      newErrors.reportNumber = true;
      isValid = false;
    }
    if (!shutdownDate) {
      newErrors.shutdownDate = true;
      isValid = false;
    }
    if (cancelReason === 'Jiné') {
      const cleanJust = justification.trim();
      if (!cleanJust || cleanJust === 'Storno zadavatelem') {
        newErrors.justification = true;
        isValid = false;
      }
    }

    setErrors(newErrors);
    setValidatedOnce(true);

    if (!isValid) {
      let msg = 'Vyplňte prosím všechna povinná pole (číslo hlášení, datum).';
      if (newErrors.justification) {
        msg = 'Při volbě důvodu „Jiné“ je nutné vyplnit konkrétní zdůvodnění (jiné než výchozí „Storno zadavatelem“).';
      }
      setNotification({
        type: 'error',
        message: msg,
      });
    }

    return isValid;
  };

  // Zvláštní validace při psaní pro okamžitou opravu červeného rámečku
  const handleInputChange = (field: string, value: string, setter: (val: string) => void) => {
    setter(value);
    if (validatedOnce) {
      setErrors((prev) => {
        let hasErr = !value.trim();
        if (field === 'justification' && cancelReason === 'Jiné') {
          hasErr = !value.trim() || value.trim() === 'Storno zadavatelem';
        }
        return {
          ...prev,
          [field]: hasErr,
        };
      });
    }
  };

  // Automatická aktualizace chyb pro zdůvodnění při změně důvodu storna
  useEffect(() => {
    let isCurrent = true;
    const updateErrors = async () => {
      await Promise.resolve();
      if (isCurrent && validatedOnce) {
        setErrors((prev) => {
          const hasErr = cancelReason === 'Jiné' && (!justification.trim() || justification.trim() === 'Storno zadavatelem');
          return {
            ...prev,
            justification: hasErr,
          };
        });
      }
    };
    updateErrors();
    return () => {
      isCurrent = false;
    };
  }, [cancelReason, justification, validatedOnce]);

  // Otevření Outlooku pomocí mailto linku (openOutlook) a zkopírování formátovaného textu do schránky pro zachování tučného písma
  const openOutlook = async (): Promise<void> => {
    if (!validate()) return;

    setLoadingButton('outlook');
    try {
      const subject = generateSubject();
      const body = generateBody();

      // Pokusíme se také zkopírovat formátovaný text do schránky (pro případ ručního vložení v Outlooku/Gmailu)
      try {
        const lines = body.split('\n');
        const firstLine = lines[0];
        const restLines = lines.slice(1).join('\n');
        const restHtml = restLines
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br />');
        const htmlString = `<b>${firstLine}</b><br />${restHtml}`;

        if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
          const textBlob = new Blob([body], { type: 'text/plain' });
          const htmlBlob = new Blob([htmlString], { type: 'text/html' });
          await navigator.clipboard.write([
            new ClipboardItem({
              'text/plain': textBlob,
              'text/html': htmlBlob,
            }),
          ]);
        } else {
          await navigator.clipboard.writeText(body);
        }
      } catch (clipErr) {
        console.warn('Nepodařilo se zkopírovat tělo do schránky:', clipErr);
      }

      // Vyčištění řádků příjemců pro formát mailto (sloučení na jeden řádek, odstranění konců řádků)
      const cleanTo = recipientsTo.replace(/\r?\n|\r/g, ' ').trim();
      const cleanCc = recipientsCc.replace(/\r?\n|\r/g, ' ').trim();

      const mailtoUrl = `mailto:${encodeURIComponent(cleanTo)}?cc=${encodeURIComponent(cleanCc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Krátké zpoždění pro loading stav, pak otevření mailto
      await new Promise((resolve) => setTimeout(resolve, 600));
      window.location.href = mailtoUrl;

      setNotification({
        type: 'success',
        message: 'Spouštím e-mail s předvyplněným obsahem. Formátovaný text byl také zkopírován do schránky.',
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Nepodařilo se otevřít e-mailový klient.',
      });
    } finally {
      setLoadingButton(null);
    }
  };

  // Vyčištění formuláře
  const clearForm = (): void => {
    setReportNumber('');
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setShutdownDate(`${yyyy}-${mm}-${dd}`);
    setMunicipality('Karviná');
    setRegion('OMO oblast KA');
    setCancelReason('Storno žadatelem');
    setJustification('Storno zadavatelem');
    setCustomersB(0);
    setCustomersC(0);
    setCustomersD(0);
    setRecipientsTo(DEFAULT_KOMU);
    setRecipientsCc(DEFAULT_KOPIE);
    setErrors({});
    setValidatedOnce(false);
    setNotification({
      type: 'info',
      message: 'Formulář byl úspěšně vyčištěn do výchozích hodnot.',
    });
  };

  // Prevence odeslání při stisku klávesy Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      // Povolíme Enter v textarea, jinde ne
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    }
  };

  // Prozatím nenačteno na klientovi
  if (!isMounted) {
    return <div className={styles.loadingContainer}>Načítám generátor...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Informační / Notifikační panel */}
      {notification && (
        <div className={`${styles.notification} ${styles[notification.type]}`} role="alert">
          <span className={styles.notificationIcon}>
            {notification.type === 'success' && '✓'}
            {notification.type === 'error' && '⚠'}
            {notification.type === 'info' && 'ℹ'}
          </span>
          <span className={styles.notificationText}>{notification.message}</span>
          <button type="button" className={styles.notificationClose} onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      <form className={styles.form} onKeyDown={handleKeyDown}>
        {/* Sekce Údaje */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>ÚDAJE</legend>

          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label htmlFor="storno-h1-report-num" className={styles.label}>
                Číslo hlášení <span className={styles.required}>*</span>
              </label>
              <input
                id="storno-h1-report-num"
                type="text"
                placeholder="Např. 12345678"
                value={reportNumber}
                onChange={(e) => handleInputChange('reportNumber', e.target.value, setReportNumber)}
                className={`${styles.input} ${errors.reportNumber ? styles.inputError : ''}`}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="storno-h1-date" className={styles.label}>
                Datum odstávky <span className={styles.required}>*</span>
              </label>
              <input
                id="storno-h1-date"
                type="date"
                value={shutdownDate}
                onChange={(e) => handleInputChange('shutdownDate', e.target.value, setShutdownDate)}
                className={`${styles.input} ${errors.shutdownDate ? styles.inputError : ''}`}
              />
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label htmlFor="storno-h1-municipality" className={styles.label}>
                Obec
              </label>
              <input
                id="storno-h1-municipality"
                type="text"
                placeholder="Např. Děčín"
                value={municipality}
                onChange={(e) => handleInputChange('municipality', e.target.value, setMunicipality)}
                className={styles.input}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="storno-h1-region" className={styles.label}>
                Oblast
              </label>
              <input
                id="storno-h1-region"
                type="text"
                placeholder="Např. Děčínsko"
                value={region}
                onChange={(e) => handleInputChange('region', e.target.value, setRegion)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.grid2}>
            <div className={styles.fieldGroup}>
              <label htmlFor="storno-h1-reason" className={styles.label}>Důvod storna</label>
              <select
                id="storno-h1-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className={styles.select}
              >
                <option value="Storno žadatelem">Storno žadatelem</option>
                <option value="Technické důvody">Technické důvody</option>
                <option value="Organizační důvody">Organizační důvody</option>
                <option value="Jiné">Jiné</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="storno-h1-justification" className={styles.label}>
                Zdůvodnění {cancelReason === 'Jiné' && <span className={styles.required}>*</span>}
              </label>
              <input
                id="storno-h1-justification"
                type="text"
                placeholder="Např. nevhodné počasí"
                value={justification}
                onChange={(e) => handleInputChange('justification', e.target.value, setJustification)}
                className={`${styles.input} ${errors.justification ? styles.inputError : ''}`}
              />
            </div>
          </div>

          {/* Počet zákazníků B, C, D */}
          <div className={styles.customersSection}>
            <span className={styles.customersTitle}>Počet zákazníků:</span>
            <div className={styles.customersGrid}>
              <div className={styles.customerField}>
                <label htmlFor="customer-b">B</label>
                <input
                  id="customer-b"
                  type="number"
                  min="0"
                  value={customersB}
                  onChange={(e) => setCustomersB(Math.max(0, parseInt(e.target.value) || 0))}
                  className={styles.customerInput}
                />
              </div>
              <div className={styles.customerField}>
                <label htmlFor="customer-c">C</label>
                <input
                  id="customer-c"
                  type="number"
                  min="0"
                  value={customersC}
                  onChange={(e) => setCustomersC(Math.max(0, parseInt(e.target.value) || 0))}
                  className={styles.customerInput}
                />
              </div>
              <div className={styles.customerField}>
                <label htmlFor="customer-d">D</label>
                <input
                  id="customer-d"
                  type="number"
                  min="0"
                  value={customersD}
                  onChange={(e) => setCustomersD(Math.max(0, parseInt(e.target.value) || 0))}
                  className={styles.customerInput}
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* Sekce Příjemci */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>PŘÍJEMCI</legend>
          <div className={styles.fieldGroup}>
            <label htmlFor="recipients-to" className={styles.label}>Komu</label>
            <textarea
              id="recipients-to"
              rows={2}
              value={recipientsTo}
              onChange={(e) => setRecipientsTo(e.target.value)}
              className={styles.textarea}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="recipients-cc" className={styles.label}>Kopie</label>
            <textarea
              id="recipients-cc"
              rows={2}
              value={recipientsCc}
              onChange={(e) => setRecipientsCc(e.target.value)}
              className={styles.textarea}
            />
          </div>
        </fieldset>
      </form>

      {/* Živý náhled */}
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>ŽIVÝ NÁHLED</div>
        <div className={styles.previewBox}>
          <div className={styles.previewSubject}>
            <strong>Předmět: </strong>
            <span className="selectable">{generateSubject()}</span>
          </div>
          <div className={styles.previewDivider} />
          <div className={`${styles.previewBody} selectable`}>
            {(() => {
              const bodyText = generateBody();
              const lines = bodyText.split('\n');
              const firstLine = lines[0];
              const restLines = lines.slice(1).join('\n');
              return (
                <>
                  <strong style={{ fontWeight: 'bold', display: 'block' }}>{firstLine}</strong>
                  <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{restLines}</pre>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Tlačítka */}
      <div className={styles.actionsGrid}>
        <button
          type="button"
          onClick={openOutlook}
          disabled={loadingButton !== null}
          className={`${styles.btn} ${styles.btnPrimary}`}
        >
          {loadingButton === 'outlook' ? (
            <>
              <span className={styles.spinner} />
              Otevírám...
            </>
          ) : (
            'Vytvořit e-mail'
          )}
        </button>

        <button
          type="button"
          onClick={clearForm}
          disabled={loadingButton !== null}
          className={`${styles.btn} ${styles.btnDanger}`}
        >
          Vyčistit formulář
        </button>
      </div>
    </div>
  );
};
