export interface EmailSignature {
  name: string;
  position: string;
  company: string;
  phone: string;
  email: string;
  customText?: string;
  textColor: string;
  borderColor: string;
  fontSize: string;
  image: string; // base64 or URL
  imageWidth: string;
  imageHeight: string;
}

const STORAGE_KEY = 'dashboard_email_signature';

export const DEFAULT_SIGNATURE: EmailSignature = {
  name: 'Jan Novák',
  position: 'Specialista distribuce',
  company: 'ČEZ Distribuce, a. s.',
  phone: '+420 123 456 789',
  email: 'jan.novak@cezdistribuce.cz',
  customText: 'Bezpečnost na prvním místě.',
  textColor: '#1c1b1f', // material color style
  borderColor: '#e0e0e0',
  fontSize: '13px',
  image: '', // initially empty or standard template
  imageWidth: '120px',
  imageHeight: 'auto',
};

export function loadSignature(): EmailSignature | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as EmailSignature;
  } catch (e) {
    console.error('Failed to load signature', e);
    return null;
  }
}

export function saveSignature(sig: EmailSignature): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sig));
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

export function renderSignatureHtml(sig: EmailSignature): string {
  if (!sig) return '';
  const textColor = sig.textColor || '#1c1b1f';
  const borderColor = sig.borderColor || '#e0e0e0';
  const fontSize = sig.fontSize || '13px';
  const nameColor = '#005cbb'; // professional ČEZ-like blue accent for name

  const styles = {
    container: `font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: ${fontSize}; color: ${textColor}; line-height: 1.4; margin-top: 20px; border-top: 1px solid ${borderColor}; padding-top: 12px;`,
    name: `font-weight: bold; font-size: 15px; color: ${nameColor}; margin-bottom: 2px;`,
    position: `font-style: italic; color: #5f6368; margin-bottom: 4px;`,
    company: `font-weight: 600; color: #1c1b1f; margin-bottom: 4px;`,
    contact: `color: #5f6368; margin-bottom: 2px;`,
    customText: `margin-top: 6px; font-weight: bold; color: #1e8e3e;`, // eco/safety green accent
    image: `margin-top: 10px; display: block; max-width: ${sig.imageWidth || '120px'}; height: ${sig.imageHeight || 'auto'}; border: 0;`
  };

  return `
<div style="${styles.container}">
  <div style="${styles.name}">${sig.name}</div>
  ${sig.position ? `<div style="${styles.position}">${sig.position}</div>` : ''}
  ${sig.company ? `<div style="${styles.company}">${sig.company}</div>` : ''}
  ${sig.phone ? `<div style="${styles.contact}">Tel: ${sig.phone}</div>` : ''}
  ${sig.email ? `<div style="${styles.contact}">E-mail: ${sig.email}</div>` : ''}
  ${sig.customText ? `<div style="${styles.customText}">${sig.customText}</div>` : ''}
  ${sig.image ? `<img src="${sig.image}" alt="Logo" style="${styles.image}" />` : ''}
</div>
  `;
}

export function renderSignatureText(sig: EmailSignature): string {
  if (!sig) return '';
  const lines = [
    '--',
    sig.name,
    sig.position,
    sig.company,
    sig.phone ? `Tel: ${sig.phone}` : '',
    sig.email ? `E-mail: ${sig.email}` : '',
    sig.customText,
  ].filter(Boolean);
  return '\n\n' + lines.join('\n');
}
