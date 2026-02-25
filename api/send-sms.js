/**
 * SMS Capture Endpoint - Vercel Serverless Function
 * Handles SMS requests from the Handy & Friend landing page calculator
 *
 * Accepts POST requests with:
 * {
 *   phone: string (E.164 format: +12135551700),
 *   estimate: string (e.g., "$150"),
 *   timestamp: ISO string,
 *   consent: boolean
 * }
 *
 * Returns:
 * {
 *   success: boolean,
 *   message_sid?: string (if Twilio enabled),
 *   message?: string
 * }
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { phone, estimate, timestamp, consent } = req.body;

  // Validate required fields
  if (!phone || !estimate || !consent) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: phone, estimate, consent'
    });
  }

  // Validate phone format (basic check)
  if (!/^\+?[\d\s\-()]+$/.test(phone)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid phone format'
    });
  }

  // Log consent to Firebase Firestore (TCPA compliance - non-blocking)
  if (process.env.FIREBASE_CONFIG) {
    try {
      // Parse Firebase config from env
      const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

      // Dynamic import of firebase-admin
      const admin = await import('firebase-admin');

      // Initialize Firebase if not already done
      if (!admin.default.apps || admin.default.apps.length === 0) {
        admin.default.initializeApp({
          credential: admin.default.credential.cert(firebaseConfig)
        });
      }

      // Log consent to Firestore
      const db = admin.default.firestore();
      const logId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      await db.collection('sms_consent_logs').doc(logId).set({
        phone: phone,
        estimate: estimate,
        consent: consent,
        timestamp: new Date().toISOString(),
        ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        consentText: 'I agree to receive SMS about my estimate & special offers',
        optedOut: false,
        createdAt: admin.default.firestore.FieldValue.serverTimestamp()
      });

      console.log('[FIREBASE_SMS_CONSENT_LOGGED]', {
        logId,
        phone,
        timestamp
      });

    } catch (fbErr) {
      // Non-blocking - log error but don't fail the SMS flow
      console.error('[FIREBASE_CONSENT_LOG_ERROR]', {
        error: fbErr.message,
        phone: phone
      });
    }
  }

  try {
    // OPTION 1: Twilio Integration (if env vars are set)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      return await sendViaTwilio(phone, estimate, timestamp, res);
    }

    // OPTION 2: Email fallback (if sendgrid/email is configured)
    if (process.env.SENDGRID_API_KEY) {
      return await sendViaEmail(phone, estimate, timestamp, res);
    }

    // OPTION 3: Mock/Demo mode (logs to console, returns success)
    console.log('[SMS_LEAD_CAPTURED]', {
      phone,
      estimate,
      timestamp,
      consent,
      leadId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    return res.status(200).json({
      success: true,
      message: 'SMS lead captured (demo mode - no SMS sent)',
      mode: 'demo'
    });

  } catch (error) {
    console.error('[SMS_ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
}

/**
 * Send SMS via Twilio
 */
async function sendViaTwilio(phone, estimate, timestamp, res) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE || '+1234567890';

    // Normalize phone number to E.164 format
    const normalizedPhone = normalizePhoneNumber(phone);

    // Construct SMS message
    const message = `Hi! Here's your Handy & Friend estimate: ${estimate}\n\nTo book: Reply BOOK or call 213-361-1700`;

    // Call Twilio API
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: normalizedPhone,
        From: fromPhone,
        Body: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[TWILIO_ERROR]', data);
      throw new Error(data.message || 'Twilio API error');
    }

    console.log('[SMS_SENT_TWILIO]', {
      phone: normalizedPhone,
      messageSid: data.sid,
      estimate,
      timestamp
    });

    return res.status(200).json({
      success: true,
      message_sid: data.sid,
      message: 'SMS sent successfully'
    });

  } catch (error) {
    console.error('[TWILIO_ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send SMS via Twilio'
    });
  }
}

/**
 * Send SMS via email provider (fallback)
 */
async function sendViaEmail(phone, estimate, timestamp, res) {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    const senderEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@handyandfriend.com';
    const recipientEmail = process.env.SMS_CAPTURE_EMAIL || 'leads@handyandfriend.com';

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: recipientEmail }]
        }],
        from: { email: senderEmail },
        subject: `SMS Lead: ${phone}`,
        content: [{
          type: 'text/html',
          value: `
            <h2>New SMS Lead Capture</h2>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Estimate:</strong> ${estimate}</p>
            <p><strong>Timestamp:</strong> ${timestamp}</p>
            <p><strong>Action:</strong> Forward to SMS service or call/text directly</p>
          `
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status}`);
    }

    console.log('[SMS_LEAD_EMAIL_SENT]', {
      phone,
      estimate,
      timestamp
    });

    return res.status(200).json({
      success: true,
      message: 'SMS lead sent via email'
    });

  } catch (error) {
    console.error('[SENDGRID_ERROR]', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send SMS lead via email'
    });
  }
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phone) {
  // Remove all non-numeric characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '');

  // If no +, assume US number and add +1
  if (!normalized.startsWith('+')) {
    normalized = '+1' + normalized.slice(-10);
  }

  return normalized;
}
