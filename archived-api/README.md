# Archived API routes

These routes were moved out of `/api` on 2026-03-01 to stay under the Vercel Hobby limit of 12 serverless functions.

Active production flow now uses:
- `/api/submit-lead`
- `/api/upload-lead-photos`
- `/api/ai-chat`
- `/api/send-telegram`
- `/api/append-conversation`
- `/api/lead-photo-url`

If any archived endpoint is needed again, reintroduce it only after function-count planning or plan upgrade.
