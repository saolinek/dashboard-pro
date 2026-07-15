const STORAGE_KEY = 'dashboard_email_signature';

interface LegacyEmailSignature {
  name?: string;
  position?: string;
  company?: string;
  phone?: string;
  email?: string;
  customText?: string;
  textColor?: string;
  borderColor?: string;
  fontSize?: string;
  image?: string;
  imageWidth?: string;
}

function legacyToHtml(sig: LegacyEmailSignature): string {
  const parts: string[] = [];
  if (sig.name) parts.push(`<div><strong>${sig.name}</strong></div>`);
  if (sig.position) parts.push(`<div><em>${sig.position}</em></div>`);
  if (sig.company) parts.push(`<div>${sig.company}</div>`);
  if (sig.phone) parts.push(`<div>Tel: ${sig.phone}</div>`);
  if (sig.email) parts.push(`<div>E-mail: ${sig.email}</div>`);
  if (sig.customText) parts.push(`<div>${sig.customText}</div>`);
  if (sig.image) {
    const w = sig.imageWidth || '120px';
    parts.push(`<div><img src="${sig.image}" alt="Logo" style="max-width:${w};height:auto;margin-top:8px;" /></div>`);
  }
  return parts.join('');
}

function parseStoredSignature(raw: string): string | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'string') {
      return parsed.trim() || null;
    }
    if (parsed && typeof parsed === 'object' && 'html' in parsed && typeof (parsed as { html: string }).html === 'string') {
      return (parsed as { html: string }).html.trim() || null;
    }
    if (parsed && typeof parsed === 'object' && 'name' in parsed) {
      return legacyToHtml(parsed as LegacyEmailSignature) || null;
    }
  } catch {
    return raw.trim() || null;
  }
  return null;
}

export function loadSignature(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return parseStoredSignature(data);
  } catch (e) {
    console.error('Failed to load signature', e);
    return null;
  }
}

export function saveSignature(html: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ html }));
  } catch (e) {
    console.error('Failed to save signature', e);
  }
}

export function deleteSignature(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to delete signature', e);
  }
}

export function hasValidSignature(): boolean {
  const html = loadSignature();
  if (!html) return false;
  const text = htmlToPlainText(html);
  return text.trim().length > 0;
}

export function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.innerText || div.textContent || '';
}

export function getSignatureHtml(): string {
  const html = loadSignature();
  if (!html?.trim()) return '';
  return `<div style="font-family: Arial, sans-serif; font-size: 13px; color: #1c1b1f; margin-top: 16px; border-top: 1px solid #e0e0e0; padding-top: 12px;">${html}</div>`;
}

export function getSignaturePlainText(): string {
  const html = loadSignature();
  if (!html?.trim()) return '';
  const text = htmlToPlainText(html);
  if (!text.trim()) return '';
  return `\n\n--\n${text}`;
}
