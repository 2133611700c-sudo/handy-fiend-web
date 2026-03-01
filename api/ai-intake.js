/**
 * AI Intake Endpoint
 * Receives query + photos from the search bar.
 * - Calls DeepSeek AI for response (private, not public)
 * - Sends to Telegram for follow-up
 * POST /api/ai-intake
 * Body: { query: string, photos: [{dataUrl, name}], lang: string }
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { query = '', photos = [], lang = 'en' } = req.body || {};
  const safePhotos = Array.isArray(photos) ? photos.slice(0, 6) : [];

  if (!query && !safePhotos.length) {
    return res.status(400).json({ success: false, error: 'query or photos required' });
  }

  let aiResponse = null;

  try {
    // 1. Call DeepSeek AI (only if API key configured)
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        aiResponse = await callDeepSeekAI(query, lang);
        console.log('[AI_INTAKE] DeepSeek response received');
      } catch (aiErr) {
        console.warn('[AI_INTAKE] DeepSeek failed:', aiErr.message);
        // Continue to Telegram anyway
      }
    }

    // 2. Send to Telegram (async, don't wait)
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const text = buildMessage({ query, lang, photoCount: safePhotos.length, aiResponse });
      sendText(text).catch(err => console.error('[AI_INTAKE] Telegram msg failed:', err.message));

      // Send photos asynchronously
      for (const photo of safePhotos) {
        sendPhoto(photo, query).catch(err =>
          console.error('[AI_INTAKE] Photo send failed:', err.message)
        );
      }
    }

    // 3. Return AI response to client immediately (don't wait for Telegram)
    return res.status(200).json({
      success: true,
      aiResponse,
      sentTelegram: !!process.env.TELEGRAM_BOT_TOKEN
    });
  } catch (err) {
    console.error('[AI_INTAKE_ERROR]', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/* ── DeepSeek AI Call ── */
async function callDeepSeekAI(query, lang = 'en') {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  const systemMsg = lang === 'ru'
    ? 'Ты опытный мастер на все руки. Дай краткий, практичный совет по цене, срокам и следующим шагам. Если нужны фото, скажи какие. Будь дружелюбен и профессионален. Ответ до 200 слов.'
    : lang === 'uk'
    ? 'Ти досвідчений майстер на всі руки. Дай короткий, практичний поради щодо ціни, термінів та наступних кроків. Якщо потрібні фото, скажи які. Будь дружелюбним і професійним. Відповідь до 200 слів.'
    : 'You are an experienced handyman. Give brief, practical advice about pricing, timeline, and next steps. If photos are needed, say which ones. Be friendly and professional. Keep response under 200 words.';

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: query }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errData = await response.text().catch(() => '');
    throw new Error(`DeepSeek API error: ${response.status} ${errData}`);
  }

  const data = await response.json();
  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error('Invalid DeepSeek response format');
  }

  return data.choices[0].message.content;
}

/* ── Message builder ── */
function buildMessage({ query, lang, photoCount, aiResponse }) {
  const now = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const photoLine = photoCount > 0
    ? `📸 <b>Photos attached:</b> ${photoCount}`
    : '📷 No photos';

  const aiLine = aiResponse
    ? `\n\n🤖 <b>AI Response:</b>\n${escapeHtml(aiResponse)}`
    : '';

  return `🤖 <b>New AI Search Request</b>

💬 <b>Query:</b> ${escapeHtml(query || '—')}
🌐 <b>Language:</b> ${escapeHtml(lang.toUpperCase())}
${photoLine}
⏰ <b>Time (LA):</b> ${now}${aiLine}`;
}

/* ── Telegram helpers ── */
async function sendText(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
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
    return true;
  } catch (err) {
    console.error('[TELEGRAM_ERROR]', err.message);
    return false;
  }
}

async function sendPhoto(photo, caption) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  if (!photo || typeof photo.dataUrl !== 'string' || !photo.dataUrl.includes('base64')) {
    return false;
  }

  try {
    const parts = photo.dataUrl.split(',');
    if (parts.length !== 2) return false;

    const [meta, b64] = parts;
    const mimeMatch = /^data:(image\/[a-zA-Z0-9.+-]+);base64$/.exec(meta);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const buffer = Buffer.from(b64, 'base64');
    if (!buffer.length) return false;

    const form = new FormData();
    form.append('chat_id', chatId);
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
      `https://api.telegram.org/bot${token}/sendPhoto`,
      { method: 'POST', body: form }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) {
      console.error('[TELEGRAM_PHOTO_ERROR]', data?.description || response.statusText);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[TELEGRAM_PHOTO_ERROR]', err.message);
    return false;
  }
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
