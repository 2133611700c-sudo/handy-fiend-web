# API Contracts (Supabase Lead Intake)

## POST `/api/submit-lead` (create lead)

Request JSON:
- `name` string (required)
- `phone` string (required if `email` missing)
- `email` string (required if `phone` missing)
- `zip` string
- `preferredContact` string
- `service` string
- `message` string
- `attachments` array `{name,type,size}`
- `attribution` object
- `lang` string
- `recaptchaToken` string (if enabled)

Response JSON:
- `success` boolean
- `leadId` string
- `mode` string (`resend|sendgrid|demo`)

Effects:
- insert `public.leads`
- insert `public.lead_events` (`lead_created`, `ai_summary_saved`, `telegram_*`)

## POST `/api/upload-lead-photos`

Request JSON:
- `leadId` string (required)
- `photos` array (max 6)
  - `name` string
  - `mimeType` string
  - `dataUrl` string (base64 image)

Response JSON:
- `success` boolean
- `uploadedCount` number
- `failedCount` number
- `uploaded` array `{filePath,fileName,mimeType,fileSize}`

Effects:
- upload to private storage bucket `lead-photos`
- insert `public.lead_photos`
- insert `public.lead_events` (`photo_uploaded|validation_failed`)

## POST `/api/append-conversation`

Request JSON:
- `leadId` string
- `messages` array
  - `role` (`system|assistant|user|tool`)
  - `text` string

Response JSON:
- `success` boolean
- `stored` number

Effects:
- insert `public.ai_conversations`
- insert `public.lead_events` (`ai_summary_saved`)

## POST `/api/lead-photo-url`

Request JSON:
- `leadId` string
- `filePath` string
- `expiresIn` number (optional, default 3600)

Response JSON:
- `success` boolean
- `signedUrl` string
- `expiresIn` number

Effects:
- generates signed URL for private object

## POST `/api/send-telegram`

Request JSON:
- `leadId`/`id`
- `fullName`/`name`
- `phone`
- `email`
- `city`
- `zip`
- `serviceType`/`service`
- `aiSummaryShort`/`message`
- `budgetRange`
- `photosCount`

Response JSON:
- `success` boolean
- `messageId` number (if sent)

Effects:
- sends compact Telegram lead notification
- logs `telegram_sent` or `telegram_failed` in `public.lead_events`
