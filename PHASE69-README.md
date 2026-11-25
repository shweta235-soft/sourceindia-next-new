# Phase 69 – Isolated local basic user profile PATCH API

New `PATCH /api/local/users/me` accepts the existing local JWT (Authorization: Bearer) and a JSON object containing only these editable fields: `fname`, `lname`, `mobile`, `alternate_number`, `address`, `zipcode`, `website`.

The endpoint validates field values, rechecks active user identity, uses parameterized, account-scoped SQL, and returns a safe profile allowlist. It does not accept `email`, passwords, role changes, company fields, uploads, notification actions, or arbitrary SQL fields.

**This is not a full replacement for the original Express `POST /users/update-profile` endpoint**: that endpoint also updates company details, handles file uploads and sends notifications. The existing frontend remains connected to the original live API until complete parity and database QA are performed.

No database schema changes. No database changes occur until this optional PATCH endpoint is actually called with valid local credentials.

Test: `node --test src/lib/localProfileUpdate.test.mjs`. Verify `npm ci` then `npm run build` locally. The model environment cannot connect to your private MySQL instance.
