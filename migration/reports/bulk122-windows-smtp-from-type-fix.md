# BULK122 — Windows TypeScript SMTP sender typing fix (27 Nov 2026)

- User-reported production build compiler error: `src/lib/localBulk122TicketNative.ts(102,34) TS2322: Type string is not assignable to type {name:string;address:string}`.
- Root cause: the prior ticket QA SMTP implementation passed a string in `sendMail({from: ...})`, while the shared Nodemailer declaration (`src/types/nodemailer-local.d.ts`) requires the address-object form also used by `localBuyerMessageSendHandler.ts`.
- Fix: `sendQaMail` now passes `from: {name:'SourceIndia QA Support', address:cfg.from}`. Updated the BULK122 `nodemailer.d.ts` signature to agree with the existing declaration, and strengthened the QA email mock test to check the sender address and display name.
- Type verification: global TypeScript 5.8.3 with strict options, both project Nodemailer declaration files, and stubs for external dependencies — PASS. This is a targeted type check, not a full production build.
- Regression: BULK114–122 tests 122/122 PASS (10+12+16+11+5+19+6+22+21). No live DB writes, email delivery or external API calls were made.
- No production email delivery, ticket attachment behavior or complete Express parity is claimed. Retest `npm run build` on Windows with dependencies installed. Preserves project structure and previous API handlers.
