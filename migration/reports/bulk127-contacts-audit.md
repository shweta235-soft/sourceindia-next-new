# BULK127 Contacts audit

Original Express `contactsRoutes.js` provides exactly 7 method/path registrations. All 7 map to explicit native Next.js exports. GET response shape is based on Contacts Sequelize model (`contact_id` mapped to `id`), but live Express-vs-Next parity has not yet been tested. CRUD is isolated QA only. POST needs both original email templates 61 (admin) and 59 (user) plus SMTP sandbox and allowlist. No production write access. GET listing contains personal contact data as in original Express; do not expose this endpoint publicly without an authorization design review. Original Express has no auth middleware on its contact listing: parity vs hardening is an explicit tradeoff.

No customer data or filesystem attachments were changed. This is not 516-route native parity.
