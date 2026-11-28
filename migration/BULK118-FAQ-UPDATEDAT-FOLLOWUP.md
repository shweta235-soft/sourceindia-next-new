# BULK118 FAQ `updated_at` parity follow-up — 27 November 2026

## Confirmed observation
The user's 18-case read-only Express vs Next differential run reported `MATCH=13 DIFF=5 ERROR=0`. Every remaining difference was confined to `updated_at` in FAQ categories (`faq_categories` and alias `faqcategories`), across list and server-side grid endpoints. `created_at` and the rest of the response fields matched in these tests.

## Scoped change
- Preserve previously matched date values and all other fields.
- For FAQ date projections, map NULL or incomplete/zero MySQL dates to JSON NULL rather than constructing a syntactically invalid ISO string. This is a candidate legacy date-parser compatibility fix; actual DB values and semantics are not known in this environment.
- Upgrade read-only differential output with `updated_at_diagnostic=[...]` showing *only* type categories or relative numeric date differences, without logging database records or timestamp values.
- No database schema/data updates, no writes, no original React/Express edits.

## Verification done in artifact build environment
- BULK114–BULK118 source, bridge and TypeScript-transpilation regression suite: 59/59 PASS (original Express dependency tree supplied during tests; not packaged as node_modules).
- Standalone comparer JS syntax: PASS.
- ZIP integrity check: PASS.
- Full Next.js production build and real MySQL parity: NOT RUN in this environment.

## Windows follow-up
Preserve `.git`, `.env.local`, and `node_modules` when replacing your project with the complete ZIP. From `E:\nextjs\sourceindia-next-new` run:

```powershell
npm run test:api:bulk118:correction
npm run build
npm run dev
```

In another terminal:

```powershell
npm run test:api:bulk118:parity
```

Target: `MATCH=18 DIFF=0 ERROR=0`; **not yet proven**. If discrepancies remain, share the `fields=` and `updated_at_diagnostic=` portions. A `delta-minutes` diagnostic would indicate a possible timezone mismatch requiring a source-backed fix; `legacy:null/native:valid-ISO` would suggest a zero/invalid-date mismatch.

The differential tester compares only 18 selected GET cases and does not establish parity for the original 516 registered Express endpoints, mutation routes or auth workflows.
