/**
 * AI Sales Chat — BLOCK 2
 * POST /api/ai-chat
 * Body: { sessionId, messages, lang }
 * Returns: { reply, leadCaptured, leadId }
 *
 * Requires: DEEPSEEK_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const { restInsert } = require('./_lib/supabase-admin.js');

const SYSTEM_PROMPTS = {
  en: `You are Alex, a friendly and professional sales assistant for Handy & Friend — a top-rated handyman company serving Los Angeles (Beverly Hills, Santa Monica, West Hollywood, Culver City, Century City, and surrounding areas).

SERVICES & PRICING (2026):
- Kitchen Cabinet Painting: $35-65/door (flat/slab), $65-145/door (shaker/raised panel). 15-door kitchen avg $700-900. Includes degreasing, primer, 2 coats topcoat.
- Furniture Painting: Chair $95, Dresser (small) $165, Dresser (large) $250, Nightstand $145, Wardrobe/Armoire $350-450, Coffee table $145
- Interior Wall Painting: $1.50-2.50/sqft (1 coat), $2.50-3.50/sqft (2 coats). Ceilings add 30%
- Flooring Installation: LVP/Luxury Vinyl $4.50/sqft, Hardwood $6.50/sqft, Tile $7.50/sqft (includes materials)
- TV Mounting: $165 (standard on drywall), $250 (in-wall cable concealment)
- Art/Mirror Hanging: $95 (1-3 pieces), $195 (gallery wall up to 8 pieces)
- Furniture Assembly: $65-95/item, flat $240 for up to 3 items same visit
- Plumbing: Faucet replacement $225, Toilet installation $250, Under-sink work $175, Garbage disposal $275
- Electrical: Outlet/switch $125, Light fixture $145, Ceiling fan $185, Dimmer $135, GFCI $145
- Also do: furniture repair, door/lock installation, smart home device setup, caulking, patching, and more

RESPONSE RULES:
1. Be warm, concise — max 2-3 short sentences per reply
2. Ask ONE qualifying question at a time
3. After understanding the job → give a rough price range
4. Then naturally ask: "What's the best name and phone number to reach you so we can schedule a free on-site estimate?"
5. Never be pushy. Never make up prices outside the list above.
6. If asked something you don't know → say "Our team will clarify that during your free estimate"

LEAD CAPTURE: When you have collected the client's NAME and PHONE (or email), output your friendly closing message, then on a completely new line output ONLY this JSON (nothing else on that line):
LEAD_CAPTURED:{"name":"<name>","phone":"<phone>","email":"<email_or_empty>","service":"<service>","description":"<brief_description>"}`,

  ru: `Ты Алекс — дружелюбный и профессиональный ассистент по продажам компании Handy & Friend. Это лучшая мастеровая компания в Лос-Анджелесе (Беверли Хиллз, Санта-Моника, Западный Голливуд, Калвер-Сити и окрестности).

УСЛУГИ И ЦЕНЫ (2026):
- Покраска кухонных шкафов: $35-65/дверь (плоские), $65-145/дверь (шейкер/рельеф). Кухня 15 дверей ~$700-900
- Покраска мебели: Стул $95, Комод малый $165, Комод большой $250, Тумба $145, Шкаф $350-450
- Покраска стен: $1.50-2.50/кв.фут (1 слой), $2.50-3.50/кв.фут (2 слоя). Потолок +30%
- Укладка полов: LVP $4.50/кв.фут, Паркет $6.50/кв.фут, Плитка $7.50/кв.фут
- Крепление ТВ: $165 (стандарт), $250 (скрытые кабели)
- Картины/зеркала: $95 (1-3 шт), $195 (галерея до 8 шт)
- Сборка мебели: $65-95/шт, фикс $240 за до 3 предметов
- Сантехника: Смеситель $225, Унитаз $250, Под раковину $175, Утилизатор $275
- Электрика: Розетка/выключатель $125, Светильник $145, Вентилятор $185, Диммер $135

ПРАВИЛА ОТВЕТА:
1. Тепло и кратко — максимум 2-3 коротких предложения
2. Задавай ОДИН уточняющий вопрос за раз
3. После понимания задачи → назови примерную цену
4. Затем спроси: "Как вас зовут и как с вами связаться, чтобы назначить бесплатный выезд мастера?"
5. Не навязывайся. Не придумывай цены.

СБОР КОНТАКТА: Когда получено ИМЯ и ТЕЛЕФОН (или email), напиши дружелюбное завершение, затем на ОТДЕЛЬНОЙ новой строке выведи ТОЛЬКО этот JSON:
LEAD_CAPTURED:{"name":"<имя>","phone":"<телефон>","email":"<email_или_пусто>","service":"<услуга>","description":"<краткое_описание>"}`,

  uk: `Ти Алекс — дружній та професійний асистент з продажів компанії Handy & Friend. Це провідна майстрова компанія в Лос-Анджелесі.

ПОСЛУГИ ТА ЦІНИ (2026):
- Фарбування кухонних шаф: $35-65/двері (плоскі), $65-145/двері (рельєф). Кухня 15 дверей ~$700-900
- Фарбування меблів: Стілець $95, Комод малий $165, Комод великий $250, Тумба $145, Шафа $350-450
- Фарбування стін: $1.50-2.50/кв.фут (1 шар), $2.50-3.50/кв.фут (2 шари). Стеля +30%
- Укладання підлоги: LVP $4.50/кв.фут, Паркет $6.50/кв.фут, Плитка $7.50/кв.фут
- Кріплення ТВ: $165 (стандарт), $250 (приховані кабелі)
- Сантехніка: Змішувач $225, Унітаз $250, Електрика: Розетка $125, Світильник $145

ПРАВИЛА ВІДПОВІДІ:
1. Тепло і коротко — максимум 2-3 речення
2. Задавай ОДНЕ уточнююче питання за раз
3. Після розуміння завдання → назви орієнтовну ціну
4. Потім запитай ім'я та телефон для безплатного виїзду майстра

ЗБІР КОНТАКТУ: Коли є ІМ'Я і ТЕЛЕФОН, напиши завершення та на НОВОМУ рядку виведи ТІЛЬКИ JSON:
LEAD_CAPTURED:{"name":"<ім'я>","phone":"<телефон>","email":"<email_або_порожньо>","service":"<послуга>","description":"<опис>"}`,

  es: `Eres Alex, asistente de ventas amigable de Handy & Friend — empresa de mantenimiento líder en Los Ángeles (Beverly Hills, Santa Mónica, West Hollywood y áreas cercanas).

SERVICIOS Y PRECIOS (2026):
- Pintura de gabinetes de cocina: $35-65/puerta (lisa), $65-145/puerta (shaker). Cocina 15 puertas ~$700-900
- Pintura de muebles: Silla $95, Cómoda pequeña $165, Cómoda grande $250, Mesa de noche $145
- Pintura de paredes: $1.50-2.50/pie² (1 mano), $2.50-3.50/pie² (2 manos)
- Instalación de pisos: LVP $4.50/pie², Madera $6.50/pie², Baldosa $7.50/pie²
- Montaje de TV: $165 (estándar), $250 (cables ocultos)
- Plomería: Grifo $225, Inodoro $250. Electricidad: Tomacorriente $125, Accesorio $145

REGLAS:
1. Responde con 2-3 oraciones máximo, cálido y profesional
2. Haz UNA pregunta a la vez
3. Da un rango de precio aproximado
4. Pide nombre y teléfono para agendar visita gratuita

CAPTURA: Cuando tengas NOMBRE y TELÉFONO, escribe tu cierre y en UNA NUEVA LÍNEA solo este JSON:
LEAD_CAPTURED:{"name":"<nombre>","phone":"<teléfono>","email":"<email_o_vacío>","service":"<servicio>","description":"<descripción>"}`
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { sessionId, messages, lang = 'en' } = req.body || {};

  if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 128) {
    return res.status(400).json({ error: 'sessionId required (string, max 128 chars)' });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const safeLang = ['en', 'ru', 'uk', 'es'].includes(lang) ? lang : 'en';
  const systemPrompt = SYSTEM_PROMPTS[safeLang];

  // Sanitize and limit messages
  const safeMessages = messages
    .slice(-20) // max 20 turns history
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000)
    }))
    .filter(m => m.content.trim());

  if (!safeMessages.length) {
    return res.status(400).json({ error: 'No valid messages' });
  }

  // Check API key
  if (!process.env.DEEPSEEK_API_KEY) {
    // Graceful fallback when key not configured
    return res.status(200).json({
      reply: 'Hi! I\'m Alex from Handy & Friend. We\'d love to help with your project! Please call us at (213) 361-1700 or use the quote form below — we respond within 1 hour.',
      leadCaptured: false,
      leadId: null,
      fallback: true
    });
  }

  let rawReply;
  try {
    rawReply = await callDeepSeek(systemPrompt, safeMessages);
  } catch (err) {
    console.error('[AI_CHAT] DeepSeek error:', err.message);
    return res.status(502).json({ error: 'AI service temporarily unavailable. Please try again.' });
  }

  // Extract LEAD_CAPTURED signal
  const leadMatch = rawReply.match(/\nLEAD_CAPTURED:(\{.+\})\s*$/);
  let reply = rawReply;
  let leadCaptured = false;
  let leadId = null;

  if (leadMatch) {
    // Strip the JSON marker from visible reply
    reply = rawReply.slice(0, leadMatch.index).trim();
    try {
      const leadData = JSON.parse(leadMatch[1]);
      const result = await createLead(leadData, sessionId, safeLang, safeMessages);
      if (result.ok) {
        leadCaptured = true;
        leadId = result.leadId;
      }
    } catch (parseErr) {
      console.error('[AI_CHAT] Lead JSON parse error:', parseErr.message, leadMatch[1]);
    }
  }

  // Save conversation turn (fire-and-forget)
  const lastUser = safeMessages[safeMessages.length - 1];
  saveTurns(sessionId, leadId, lastUser?.content, reply).catch(err =>
    console.error('[AI_CHAT] saveTurns error:', err.message)
  );

  return res.status(200).json({ reply, leadCaptured, leadId });
}

async function callDeepSeek(systemPrompt, messages) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 600
    })
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`DeepSeek ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid DeepSeek response structure');
  }

  return data.choices[0].message.content;
}

async function createLead(leadData, sessionId, lang, messages) {
  const { name, phone, email, service, description } = leadData;

  if (!name || (!phone && !email)) {
    return { ok: false, error: 'missing_name_or_contact' };
  }

  const leadId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const record = {
    id: leadId,
    source: 'ai_chat',
    status: 'new',
    full_name: String(name).slice(0, 160),
    phone: String(phone || '').slice(0, 40),
    email: String(email || '').slice(0, 160),
    service_type: String(service || '').slice(0, 120),
    problem_description: String(description || '').slice(0, 2000),
    ai_summary: buildSummary(messages, lang).slice(0, 2000),
    source_details: { session_id: sessionId, lang, channel: 'chat_widget' }
  };

  const result = await restInsert('leads', record, { returning: false });
  if (!result.ok && !result.skipped) {
    console.error('[AI_CHAT] Lead insert failed:', result.error, result.details || '');
    return { ok: false, error: result.error };
  }

  console.log('[AI_CHAT] Lead created:', leadId, service, phone || email);
  return { ok: true, leadId };
}

async function saveTurns(sessionId, leadId, userMsg, assistantMsg) {
  const turns = [];
  if (userMsg) {
    turns.push({
      session_id: sessionId,
      lead_id: leadId || null,
      message_role: 'user',
      message_text: String(userMsg).slice(0, 4000)
    });
  }
  if (assistantMsg) {
    turns.push({
      session_id: sessionId,
      lead_id: leadId || null,
      message_role: 'assistant',
      message_text: String(assistantMsg).slice(0, 4000)
    });
  }
  if (!turns.length) return;
  await restInsert('ai_conversations', turns, { returning: false });
}

function buildSummary(messages, lang) {
  const turns = messages.slice(-6).map(m =>
    `${m.role === 'user' ? 'Client' : 'Alex'}: ${m.content}`
  );
  return `[AI Chat | ${lang.toUpperCase()}]\n` + turns.join('\n');
}
