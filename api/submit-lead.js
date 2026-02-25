/**
 * Lead Submission Endpoint - Vercel Serverless Function
 * Replaces Formspree (which was using placeholder ID "xyzqwert")
 *
 * Sends email notification to owner via Resend API (free tier: 3000/month)
 * Falls back to console log in demo mode if RESEND_API_KEY not set
 *
 * SETUP: Add RESEND_API_KEY to Vercel → Settings → Environment Variables
 * Get free key at: https://resend.com/signup
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    name,
    email,
    phone,
    service,
    message,
    timestamp,
    _subject
  } = req.body || {};

  // Basic validation
  if (!name || !email || !phone) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, email, phone'
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid email format'
    });
  }

  // Log lead
  const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const leadData = {
    leadId,
    name,
    email,
    phone,
    service: service || 'Not specified',
    message: message || 'No message',
    timestamp: timestamp || new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    source: req.headers['referer'] || 'https://handyandfriend.com'
  };

  console.log('[LEAD_CAPTURED]', JSON.stringify(leadData));

  // Build email HTML
  const subjectLine = _subject || `New Quote Request: ${service || 'General'} from ${name}`;
  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f7f4">
  <div style="background:#3a3a3a;padding:20px;border-radius:12px 12px 0 0">
    <h1 style="color:#b88924;margin:0;font-size:22px">🔧 Handy & Friend</h1>
    <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:14px">New Quote Request</p>
  </div>

  <div style="background:#fff;padding:24px;border:1px solid #e5dfd5">
    <h2 style="color:#3a3a3a;font-size:18px;margin:0 0 20px">
      ${subjectLine}
    </h2>

    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe3;color:#666;font-size:13px;width:120px">Name</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe3;color:#3a3a3a;font-weight:600">${name}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe3;color:#666;font-size:13px">Email</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe3;color:#3a3a3a;font-weight:600">
          <a href="mailto:${email}" style="color:#b88924">${email}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe3;color:#666;font-size:13px">Phone</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe3;color:#3a3a3a;font-weight:600">
          <a href="tel:${phone}" style="color:#b88924">${phone}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe3;color:#666;font-size:13px">Service</td>
        <td style="padding:10px 0;border-bottom:1px solid #f0ebe3;color:#3a3a3a;font-weight:600">${service || 'Not specified'}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#666;font-size:13px;vertical-align:top">Message</td>
        <td style="padding:10px 0;color:#3a3a3a">${message || '—'}</td>
      </tr>
    </table>
  </div>

  <div style="background:#f9f7f4;padding:16px;border:1px solid #e5dfd5;border-top:0;border-radius:0 0 12px 12px">
    <div style="display:flex;gap:10px;margin-bottom:12px">
      <a href="tel:${phone}" style="background:#b88924;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">📞 Call Now</a>
      <a href="mailto:${email}" style="background:#3a3a3a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">📧 Reply Email</a>
      <a href="https://wa.me/${phone.replace(/\D/g, '')}" style="background:#25d366;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">💬 WhatsApp</a>
    </div>
    <p style="margin:0;font-size:11px;color:#999">
      Lead ID: ${leadId} · Received: ${new Date().toLocaleString('en-US', {timeZone: 'America/Los_Angeles'})} PT
      · IP: ${leadData.ip}
    </p>
  </div>
</body>
</html>
  `.trim();

  // === SEND EMAIL ===

  // OPTION 1: Resend API (recommended, free 3000/month)
  if (process.env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Handy & Friend Leads <leads@handyandfriend.com>',
          to: [process.env.OWNER_EMAIL || '2133611700c@gmail.com'],
          reply_to: email,
          subject: subjectLine,
          html: emailHtml
        })
      });

      if (!resendRes.ok) {
        const err = await resendRes.json().catch(() => ({}));
        console.error('[RESEND_ERROR]', resendRes.status, err);
        // Fall through to demo mode
      } else {
        const data = await resendRes.json();
        console.log('[RESEND_SENT]', data.id, 'to', process.env.OWNER_EMAIL || '2133611700c@gmail.com');

        return res.status(200).json({
          success: true,
          mode: 'resend',
          leadId
        });
      }
    } catch (err) {
      console.error('[RESEND_FETCH_ERROR]', err.message);
      // Fall through to demo mode
    }
  }

  // OPTION 2: Sendgrid fallback
  if (process.env.SENDGRID_API_KEY) {
    try {
      const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: process.env.OWNER_EMAIL || '2133611700c@gmail.com' }] }],
          from: { email: 'leads@handyandfriend.com', name: 'Handy & Friend Leads' },
          reply_to: { email },
          subject: subjectLine,
          content: [{ type: 'text/html', value: emailHtml }]
        })
      });

      if (sgRes.ok || sgRes.status === 202) {
        console.log('[SENDGRID_SENT] to', process.env.OWNER_EMAIL || '2133611700c@gmail.com');
        return res.status(200).json({ success: true, mode: 'sendgrid', leadId });
      }
    } catch (err) {
      console.error('[SENDGRID_ERROR]', err.message);
    }
  }

  // OPTION 3: Demo mode (no email sent — lead logged to console only)
  console.log('[DEMO_MODE] No email API configured. Lead logged only.');
  console.log('[DEMO_LEAD]', JSON.stringify(leadData, null, 2));

  return res.status(200).json({
    success: true,
    mode: 'demo',
    leadId,
    note: 'Lead captured. Add RESEND_API_KEY to Vercel env vars to receive email notifications.'
  });
}
