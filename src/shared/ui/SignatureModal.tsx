'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './SignatureModal.module.css';
import {
  EmailSignature,
  DEFAULT_SIGNATURE,
  loadSignature,
  saveSignature,
  renderSignatureHtml,
} from '@/lib/storage/signature';

interface SignatureModalProps {
  onClose: () => void;
  onSave?: (savedSig: EmailSignature) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customText, setCustomText] = useState('');
  const [textColor, setTextColor] = useState('#1c1b1f');
  const [borderColor, setBorderColor] = useState('#e0e0e0');
  const [fontSize, setFontSize] = useState('13px');
  const [image, setImage] = useState('');
  const [imageWidth, setImageWidth] = useState('120px');
  const [imageHeight, setImageHeight] = useState('auto');
  const [isMounted, setIsMounted] = useState(false);

  // Initialize asynchronously to meet linter rules
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      await Promise.resolve();
      if (!active) return;

      const sig = loadSignature() || DEFAULT_SIGNATURE;
      setName(sig.name || '');
      setPosition(sig.position || '');
      setCompany(sig.company || '');
      setPhone(sig.phone || '');
      setEmail(sig.email || '');
      setCustomText(sig.customText || '');
      setTextColor(sig.textColor || '#1c1b1f');
      setBorderColor(sig.borderColor || '#e0e0e0');
      setFontSize(sig.fontSize || '13px');
      setImage(sig.image || '');
      setImageWidth(sig.imageWidth || '120px');
      setImageHeight(sig.imageHeight || 'auto');
      setIsMounted(true);
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        setImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyTemplate = (type: string) => {
    if (type === 'cez') {
      setName('Jan Novák');
      setPosition('Specialista distribuce');
      setCompany('ČEZ Distribuce, a. s.');
      setPhone('+420 123 456 789');
      setEmail('jan.novak@cezdistribuce.cz');
      setCustomText('Bezpečnost na prvním místě.');
      setTextColor('#1c1b1f');
      setBorderColor('#ff6600'); // ČEZ Orange-ish
      setFontSize('13px');
      setImageWidth('130px');
    } else if (type === 'eco') {
      setName('Ing. Marie Zelená');
      setPosition('Eko Manažerka');
      setCompany('ČEZ Distribuce - Životní prostředí');
      setPhone('+420 987 654 321');
      setEmail('marie.zelena@cezdistribuce.cz');
      setCustomText('Myslete na přírodu před tiskem tohoto e-mailu.');
      setTextColor('#202124');
      setBorderColor('#1e8e3e'); // Eco Green
      setFontSize('12px');
    } else {
      // Classic
      setName('Karel Svoboda');
      setPosition('Vedoucí týmu');
      setCompany('ČEZ Distribuce, a. s.');
      setPhone('+420 601 234 567');
      setEmail('karel.svoboda@cezdistribuce.cz');
      setCustomText('');
      setTextColor('#333333');
      setBorderColor('#005cbb'); // Professional Blue
      setFontSize('14px');
    }
  };

  const handleSave = () => {
    const sig: EmailSignature = {
      name,
      position,
      company,
      phone,
      email,
      customText,
      textColor,
      borderColor,
      fontSize,
      image,
      imageWidth,
      imageHeight,
    };
    saveSignature(sig);
    if (onSave) {
      onSave(sig);
    }
    onClose();
  };

  if (!isMounted) return null;

  const currentSig: EmailSignature = {
    name,
    position,
    company,
    phone,
    email,
    customText,
    textColor,
    borderColor,
    fontSize,
    image,
    imageWidth,
    imageHeight,
  };

  return createPortal(
    <div className={styles.modalBg} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Nastavení elektronického podpisu</h3>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Zavřít">
            &times;
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Templates Quick Selection */}
          <div className={styles.templatesSection}>
            <span className={styles.label}>Rychlé šablony:</span>
            <div className={styles.templatesGrid}>
              <button
                type="button"
                className={styles.templateBtn}
                onClick={() => handleApplyTemplate('cez')}
              >
                🍊 ČEZ Distribuce Standard
              </button>
              <button
                type="button"
                className={styles.templateBtn}
                onClick={() => handleApplyTemplate('eco')}
              >
                🌱 Zelený ekologický
              </button>
              <button
                type="button"
                className={styles.templateBtn}
                onClick={() => handleApplyTemplate('classic')}
              >
                🔵 Klasický elegantní
              </button>
            </div>
          </div>

          <div className={styles.editorGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Jméno a příjmení</label>
              <input
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Např. Jan Novák"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Pracovní pozice</label>
              <input
                type="text"
                className={styles.input}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Např. Specialista distribuce"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Společnost / Oddělení</label>
              <input
                type="text"
                className={styles.input}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Např. ČEZ Distribuce, a. s."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Telefonní číslo</label>
              <input
                type="text"
                className={styles.input}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Např. +420 123 456 789"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>E-mail</label>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Např. jan.novak@cezdistribuce.cz"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Obrázek podpisu / Logo</label>
              <div className={styles.fileInputContainer}>
                <label className={styles.fileInputLabel}>
                  📁 Nahrát soubor...
                  <input
                    type="file"
                    className={styles.hiddenInput}
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
                {image && (
                  <button
                    type="button"
                    className={styles.deleteImgBtn}
                    onClick={() => setImage('')}
                  >
                    Smazat obrázek
                  </button>
                )}
              </div>
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Vlastní text (motto, doplňující text, zelená doložka)</label>
              <textarea
                className={styles.textarea}
                rows={2}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Např. Bezpečnost na prvním místě."
              />
            </div>

            {/* Style controls */}
            <div className={styles.styleControls}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Barva textu</label>
                <input
                  type="color"
                  className={styles.input}
                  style={{ height: '40px', padding: '2px', cursor: 'pointer' }}
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Barva oddělovače</label>
                <input
                  type="color"
                  className={styles.input}
                  style={{ height: '40px', padding: '2px', cursor: 'pointer' }}
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Velikost písma</label>
                <select
                  className={styles.select}
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                >
                  <option value="11px">11px (Malé)</option>
                  <option value="12px">12px (Středně malé)</option>
                  <option value="13px">13px (Výchozí)</option>
                  <option value="14px">14px (Střední)</option>
                  <option value="15px">15px (Větší)</option>
                </select>
              </div>

              {image && (
                <div className={styles.formGroup} style={{ gridColumn: 'span 3' }}>
                  <label className={styles.label}>Šířka obrázku (např. 120px, 150px, auto)</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={imageWidth}
                    onChange={(e) => setImageWidth(e.target.value)}
                    placeholder="120px"
                  />
                </div>
              )}
            </div>

            {/* Live Preview */}
            <div className={styles.previewSection}>
              <span className={styles.previewHeader}>Živý náhled podpisu</span>
              <div className={styles.previewBox}>
                <div dangerouslySetInnerHTML={{ __html: renderSignatureHtml(currentSig) }} />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Zrušit
          </button>
          <button type="button" className={styles.saveBtn} onClick={handleSave}>
            Uložit podpis
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
