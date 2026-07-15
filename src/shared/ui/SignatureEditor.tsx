'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './SignatureModal.module.css';
import { loadSignature, htmlToPlainText } from '@/lib/storage/signature';

interface SignatureEditorProps {
  onClose: () => void;
  onSave: (html: string) => void;
  required?: boolean;
}

export const SignatureEditor: React.FC<SignatureEditorProps> = ({ onClose, onSave, required = false }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const existing = loadSignature();
      if (editorRef.current) {
        editorRef.current.innerHTML = existing || '';
      }
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const execFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === 'string') {
        execFormat('insertImage', event.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    const html = editorRef.current?.innerHTML || '';
    const plain = htmlToPlainText(html);
    if (!plain.trim()) {
      setError('Podpis nesmí být prázdný. Zadejte alespoň jméno nebo kontaktní údaje.');
      return;
    }
    setError('');
    onSave(html);
  };

  const handleBackdropClick = () => {
    if (!required) onClose();
  };

  if (!isMounted) return null;

  return createPortal(
    <div className={styles.modalBg} onClick={handleBackdropClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Elektronický podpis</h3>
          {!required && (
            <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Zavřít">
              &times;
            </button>
          )}
        </div>

        <div className={styles.modalContent}>
          {required && (
            <p style={{ margin: 0, fontSize: '13px', color: '#5f6368' }}>
              Před prvním odesláním e-mailu je nutné vytvořit podpis. Stejně jako v Outlooku zde můžete napsat text, formátovat ho nebo vložit obrázek.
            </p>
          )}

          <div className={styles.toolbar}>
            <button type="button" className={styles.toolbarBtn} onClick={() => execFormat('bold')} title="Tučné">
              <strong>B</strong>
            </button>
            <button type="button" className={styles.toolbarBtn} onClick={() => execFormat('italic')} title="Kurzíva">
              <em>I</em>
            </button>
            <button type="button" className={styles.toolbarBtn} onClick={() => execFormat('underline')} title="Podtržené">
              <span style={{ textDecoration: 'underline' }}>U</span>
            </button>
            <span className={styles.toolbarDivider} />
            <button
              type="button"
              className={styles.toolbarBtn}
              onClick={() => fileInputRef.current?.click()}
              title="Vložit obrázek"
            >
              🖼 Obrázek
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleImageUpload}
            />
          </div>

          <div
            ref={editorRef}
            className={styles.richEditor}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label="Editor podpisu"
            data-placeholder="Napište podpis — jméno, pozice, telefon, e-mail, logo…"
          />

          {error && <div className={styles.errorMsg}>{error}</div>}
        </div>

        <div className={styles.modalActions}>
          {!required && (
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Zrušit
            </button>
          )}
          <button type="button" className={styles.saveBtn} onClick={handleSave}>
            Uložit podpis
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
