'use client';

import { useState, useRef, useCallback } from 'react';
import { loadSignature, saveSignature, hasValidSignature } from '@/lib/storage/signature';

export function useSignatureGate() {
  const [signatureHtml, setSignatureHtml] = useState<string | null>(() => loadSignature());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorRequired, setEditorRequired] = useState(false);
  const pendingRef = useRef<(() => void) | null>(null);

  const refreshSignature = useCallback(() => {
    setSignatureHtml(loadSignature());
  }, []);

  const withSignature = useCallback((action: () => void) => {
    if (hasValidSignature()) {
      action();
      return;
    }
    pendingRef.current = action;
    setEditorRequired(true);
    setIsEditorOpen(true);
  }, []);

  const openEditor = useCallback((required = false) => {
    setEditorRequired(required);
    setIsEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    if (editorRequired) return;
    setIsEditorOpen(false);
    pendingRef.current = null;
  }, [editorRequired]);

  const handleSave = useCallback((html: string) => {
    saveSignature(html);
    setSignatureHtml(html);
    setIsEditorOpen(false);
    setEditorRequired(false);
    const pending = pendingRef.current;
    pendingRef.current = null;
    pending?.();
  }, []);

  return {
    signatureHtml,
    isEditorOpen,
    editorRequired,
    withSignature,
    openEditor,
    closeEditor,
    handleSave,
    refreshSignature,
  };
}
