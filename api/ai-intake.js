/**
 * AI Intake Endpoint
 * Receives query + photos from the search bar, forwards to Telegram.
 * POST /api/ai-intake
 * Body: { query: string, photos: [{dataUrl, name}], lang: string }
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn('[AI_INTAKE] Telegram not configured — skipping delivery');
    return res.status(200).json({ success: true, mode: 'skipped', note: 'Telegram not configured' });
  }

  const { query = '', photos = [], lang = 'en' } = req.body || {};
  const safePhotos = Array.isArray(photos) ? photos.slice(0, 6) : [];

  if (!query && !safePhotos.length) {
    return res.status(400).json({ success: false, error: 'query or photos required' });
  }

  try {
    // 1. Send text message
    const text = buildMessage({ query, lang, photoCount: safePhotos.length });
    await sendText(text);

    // 2. Send each photo
    let sentPhotos = 0;
    for (const photo of safePhotos) {
      const ok = await sendPhoto(photo, query);
      if (ok) sentPhotos++;
    }

    return res.status(200).json({ success: true, sentPhotos });
  } catch (err) {
    console.error('[AI_INTAKE_ERROR]', err.message);
    return res.status(500).json({ success: false, error: 'Telegram delivery failed' });
  }
}

/* ── Message builder ── */
function buildMessage({ query, lang, photoCount }) {
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const photoLine = photoCount > 0
    ? `📸 <b>Photos attached:</b> ${photoCount}`
    : '📷 No photos';

  return `🤖 <b>New AI Search Request</b>

💬 <b>Query:</b> ${escapeHtml(query || '—')}
🌐 <b>Language:</b> ${escapeHtml(lang.toUpperCase())}
${photoLine}
⏰ <b>Time (LA):</b> ${now}`;
}

/* ── Telegram helpers ── */
async function sendText(text) {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    throw new Error(data?.description || 'sendMessage failed');
  }
}

async function sendPhoto(photo, caption) {
  if (!photo || typeof photo.dataUrl !== 'string' || !photo.dataUrl.includes('base64')) {
    return false;
  }

  const parts = photo.dataUrl.split(',');
  if (parts.length !== 2) return false;

  const [meta, b64] = parts;
  const mimeMatch = /^data:(image\/[a-zA-Z0-9.+-]+);base64$/.exec(meta);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  const buffer = Buffer.from(b64, 'base64');
  if (!buffer.length) return false;

  const form = new FormData();
  form.append('chat_id', process.env.TELEGRAM_CHAT_ID);
  form.append(
    'caption',
    `📸 ${escapeHtml(caption || 'AI search photo').slice(0, 200)}`
  );
  form.append(
    'photo',
    new Blob([buffer], { type: mimeType }),
    sanitizeName(photo.name)
  );

  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`,
    { method: 'POST', body: form }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    console.error('[AI_INTAKE_PHOTO]', data?.description || response.statusText);
    return false;
  }
  return true;
}

function sanitizeName(name) {
  return String(name || 'photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '_') || 'photo.jpg';
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
