# Bulk83 — Authenticated Open Enquiry Owner Chat Submission

## New endpoint

`POST /api/local/enquiries/open/{id}/chats` with `Authorization: Bearer <LOCAL_JWT>`, `Content-Type: application/json` and `{ "message": "..." }`.

- Only authenticated *owner* of an undeleted open enquiry can post; participant posting (non-owner) is not enabled yet.
- Message must be 1–2000 characters; request must be <=8192 bytes. Client-provided sender IDs are rejected.
- Uses original `open_enquriychats` table and `enquiry_user_id`/`reply_user_id` columns, with server-generated UUID and current timestamp.
- Returns HTTP 201 with new message ID and UUID; does not echo chat message.
- No OTP, emails, push notifications, moderation, or frontend API switch are introduced.
- Existing chat GET endpoints and the UI are unchanged. No migrations, seeded records or new dependencies.

## Tests

`node --test src/lib/localOpenChatWrite.test.mjs`
`npm run build`

Authenticated runtime write testing is **pending**. Creating a chat message will modify the DB, so do not run an authenticated POST test without a real enquiry and explicit intent to send a message. When no owned open enquiries exist, this POST cannot be data-tested without creating one.

Original Express `sendMessage` accepted `user.id` from the request body without verifying owner; this local migration intentionally tightens sender identity and authorizes only the enquiry owner until the participant permission model is reviewed.
