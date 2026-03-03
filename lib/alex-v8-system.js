/**
 * Legacy helper module kept for runtime compatibility.
 * Prompt source of truth is lib/alex-one-truth.js.
 */

function hasContactCapture(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  const fullText = messages.map((m) => String(m.content || '')).join(' ');
  const phoneRegex = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;
  const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  return phoneRegex.test(fullText) || emailRegex.test(fullText);
}

function extractContact(messages) {
  const fullText = Array.isArray(messages) ? messages.map((m) => String(m.content || '')).join(' ') : '';
  const phoneRegex = /((?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/;
  const emailRegex = /([^\s@]+@[^\s@]+\.[^\s@]+)/;
  const phoneMatch = fullText.match(phoneRegex);
  const emailMatch = fullText.match(emailRegex);
  return {
    phone: phoneMatch ? phoneMatch[1] : null,
    email: emailMatch ? emailMatch[1] : null,
  };
}

function detectLanguage(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return 'en';
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const text = String(lastUser?.content || '');
  if (!text) return 'en';

  // Ukrainian-specific letters first.
  if (/[іїєґІЇЄҐ]/.test(text)) return 'uk';
  // Cyrillic fallback.
  if (/[а-яёА-ЯЁ]/.test(text)) return 'ru';
  // Spanish punctuation and frequent words.
  if (/[¿¡ñáéíóú]/i.test(text) || /\b(cu[aá]nto|precio|cotizaci[oó]n|servicio|necesito)\b/i.test(text)) return 'es';

  return 'en';
}

module.exports = {
  hasContactCapture,
  extractContact,
  detectLanguage,
};
