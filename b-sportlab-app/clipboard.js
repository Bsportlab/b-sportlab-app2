/**
 * Utility universale per la copia negli appunti.
 * Supporta Web moderno (navigator.clipboard), fallback legacy (execCommand)
 * e ambiente nativo senza sollevare warning di deprecazione su web.
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  // 1. Web moderno (Safari, Chrome, Firefox, Edge)
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(String(text));
      return true;
    } catch (e) {
      console.warn('Clipboard writeText fallito:', e);
    }
  }

  // 2. Web fallback (textarea temporanea con execCommand)
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = String(text);
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (success) return true;
    } catch (e) {
      console.warn('Fallback execCommand fallito:', e);
    }
  }

  // 3. Fallback nativo (iOS / Android)
  try {
    const RN = require('react-native');
    if (RN.Clipboard && typeof RN.Clipboard.setString === 'function') {
      RN.Clipboard.setString(String(text));
      return true;
    }
  } catch (e) {
    console.warn('Fallback nativo clipboard non disponibile:', e);
  }

  return false;
}
