# Bulk82 – Owned open-enquiry chats (read-only)

Three additional local JWT-only GET endpoints:

- `/api/local/enquiries/open/{id}/chats` – messages attached to an open enquiry owned by signed-in user, paginated
- `/api/local/enquiries/open/{id}/chats/count` – chat count for that owned enquiry
- `/api/local/enquiries/open/{id}/chats/{chatId}` – chat detail for that owned enquiry

Ownership is validated via `open_enquriys.user_id` and `is_delete=0` **before** any chat records are fetched. Valid JWT plus fresh eligible account required. Unknown/other user's enquiry receives 404. No write operations, no UI wiring, no DB migrations, no new npm dependencies.

This owner-scoped coverage does **not** yet implement seller/public participation in open enquiry chats, because broader participation visibility/authorization has not been confirmed. Original `/send-message` controller takes a client-provided user object and does not by itself establish a safe server-side authorization contract; deliberately not migrated here.

Run `node --test src/lib/localOpenChatRead.test.mjs`, `npm run build`, then test with a local JWT and an owned open-enquiry ID. If the account has no open enquiries, chat tests must be skipped; do not create database records merely for testing.
