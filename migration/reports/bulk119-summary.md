# BULK119 — 17 Native GET API Overrides

**Original Express route registration total:** 516.

**Next.js native v2 override registrations:** 47.

**In-process original Express compatibility fallbacks:** 469.

**Last live result supplied by user:** BULK118 18/18 listed Express-vs-Next GET comparison requests MATCH. This does **not** verify the rest.

## This batch

17 native Next.js GET method/path registrations for FAQ, SEO Pages, Testimonials, Roles and Pages. Each compares with original `legacy/sourceindia-express/controllers/` source, uses parameterized read-only MySQL queries, has bounded grid pagination and explicit projections, and does not call original Express fallback. Previous UI and routes are preserved.

## Verification in artifact environment

- 72/72 combined BULK114–119 contract, mocking, Express bridge safety, and regression tests PASS (after using the pre-existing local original backend node_modules only for bridge runtime).
- Strict targeted TypeScript type check of the new core handler PASS with stubbed mysql2/DB interfaces; not a whole-app build.
- New `npm run test:api:bulk119` has 12 contract/behavior tests PASS.
- New local MySQL preflight, 20 GET HTTP smoke cases, and real Express differential comparisons were **not** run here. User must run on their Windows installation.
- 516/516 API registrations are represented through native overrides plus compatibility fallback, **not** verified native parity. Write endpoints remain non-native and protected by compatibility opt-ins.

## Windows installation and verification

Extract FULL project ZIP into `E:\nextjs\sourceindia-next-new`; **preserve `.env.local`, `.git`, and `node_modules`**, and do not modify the original `D:\sourceindia` React project.

```powershell
cd E:\nextjs\sourceindia-next-new
npm run test:api:bulk119
npm run build
npm run dev
```

In a second terminal, with the development server running:

```powershell
cd E:\nextjs\sourceindia-next-new
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk119.ps1
npm run test:api:bulk119:parity
```

If original Express dependencies were not installed during BULK117, run `npm run setup:legacy:compat` once before parity tests.

**Expected checks:** 8 read-only INFORMATION_SCHEMA table checks and 20 native HTTP smoke cases; differential test has 17 fixed request cases plus up to 5 existing-data detail/slug cases. Never present an expected target as a confirmed live result. The differential test prints only field paths/statuses, never underlying data.

## API parity limitations

Real data can reveal differences in timestamp timezone, alias associations, ordering ties, null serialization, and search behavior. Any `DIFF` needs a targeted fix based on the printed field names. Authentication, POST/PUT/PATCH/DELETE, uploads, OTP/email and full frontend integration are still pending as native migrations.
