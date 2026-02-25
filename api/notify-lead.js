/**
 * Owner Notification Endpoint - Vercel Serverless Function
 * Called after main lead form submission as secondary notification
 *
 * Previously returned 404 (file didn't exist)
 * Now: accepts data, logs it, optionally sends SMS to owner
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, email, phone, service, message } = req.body || {};

  // Log the notification
  const notifId = `notif_${Date.now()}`;
  console.log('[OWNER_NOTIFICATION]', {
    notifId,
    name,
    email,
    phone,
    service,
    timestamp: new Date().toISOString()
  });

  // Optional: Send SMS to owner via Twilio
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.OWNER_PHONE) {
    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const smsBody = `🔧 NEW LEAD!\nName: ${name}\nPhone: ${phone}\nService: ${service || 'General'}\nReply: ${phone}`;

      const twilioRes = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_PHONE || '+1XXXXXXXXXX',
          To: process.env.OWNER_PHONE,
          Body: smsBody
        }).toString()
      });

      if (twilioRes.ok) {
        const data = await twilioRes.json();
        console.log('[OWNER_SMS_SENT]', data.sid);
        return res.status(200).json({ success: true, mode: 'sms', notifId });
      }
    } catch (err) {
      console.error('[OWNER_SMS_ERROR]', err.message);
    }
  }

  // Default: just acknowledge (no SMS without Twilio config)
  return res.status(200).json({
    success: true,
    mode: 'log_only',
    notifId,
    note: 'Lead logged. Add TWILIO_* and OWNER_PHONE to env vars for SMS owner alerts.'
  });
}
