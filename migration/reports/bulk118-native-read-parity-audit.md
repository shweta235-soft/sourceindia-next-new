# BULK118 — Native Next.js read API migration, evidence and limits

**Source:** original uploaded React/Express backend packaged in `legacy/sourceindia-express`; original source directory on the user's Windows machine was not modified.

## What changed

BULK118 adds **16 distinct original GET method/path registrations** as true Next.js Route Handlers (not Express bridge forwards):

| Original legacy paths (GET) | Count | Behavior preserved on standard valid inputs |
|---|---:|---|
| `/v2/api/activities/`, `/count`, `/coreactivity/:coreactivity`, `/:id`, `/server-side` | 5 | Active/deleted/status filters; `{activities,coreActivities}` count; joined CoreActivity; company counts; paginated grid |
| `/v2/api/core_activities/`, `/count`, `/colors`, `/:id`, `/server-side` | 5 | Optional deleted filter; `{total}` count; color array; linked image; company counts; paginated grid |
| `/v2/api/faq_categories/`, `/:id`, `/server-side` | 3 | Active-only list by default; `all=1`; record by ID, grid |
| `/v2/api/faqcategories/`, `/:id`, `/server-side` | 3 | Same original FAQ routes at second Express mount alias |

`server-side` handlers are explicit static routes to avoid collisions with dynamic `[id]` routes. No PUT/PATCH/POST/DELETE handler is added, so all new handlers are read-only. No database schema/data changes occur.

## Route coverage, NOT parity confirmation

- Original Express method/path registrations: **516** across 48 route modules and 50 mounts.
- Existing plus BULK118 native Next.js method/path overrides: **30**.
- Registrations still dependent on original-controller in-process compatibility fallback: **486**.
- **Exact fully verified functional parity for the 516 original routes: NOT ESTABLISHED**.

These numbers are method/path registrations, not a claim that all 30 native routes return exact original responses on every input. Some native handlers validate arguments more strictly than the old Express code, impose pagination bounds, and may differ in timezone and database serialization. Auth/write/email/upload parity remains pending.

## Verification included

- `npm run test:api:bulk118` — 5 source/inventory safety tests.
- `npm run test:api:bulk114`, `:bulk115`, `:bulk116`, `:bulk117` — retained 49 pre-existing source safety tests.
- TypeScript syntax transpilation of 17 new `.ts` source files — passed in the authoring environment; NOT a production build or full strict typecheck.
- `npm run test:api:bulk118:db` — `INFORMATION_SCHEMA`-only validation of 6 tables (run on Windows, not here).
- `scripts/test-local-bulk118.ps1` — sequential source, DB preflight and **24** read-only HTTP smoke probes against localhost:3000 (run locally).
- `npm run test:api:bulk118:parity` — **18 GET-only** original Express vs native Next.js **actual JSON/status comparison probes** on the same local DB. Only reports match/difference counts; never logs customer data. Run locally with `npm run dev` in another terminal.

## Safety notes

The compatibility bridge from BULK117 remains present. Its production and write functions remain opt-in. The old Express source is not treated as automatically audited or production safe. Mutation endpoints should be tested only against isolated disposable QA data. The original Express source (under `legacy/`) is packaged without `.env`, `server.js` startup, or upload files; never copy secrets or modify the original React checkout.

## Windows run order

1. Extract the **full project ZIP** into `E:\nextjs\sourceindia-next-new`, preserving `.git`, `.env.local`, and `node_modules`.
2. `npm run setup:legacy:compat` if legacy dependencies have not been installed.
3. `npm run test:api:bulk118`, then `npm run build`.
4. Run `npm run dev` in terminal A and leave it running.
5. Run `powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk118.ps1` in terminal B.
6. Optionally run `npm run test:api:bulk118:parity` in terminal B for the **actual original-vs-new response diff**. Any DIFF is unfinished parity work, not a false PASS.

Do not treat the source tests or the bridge smoke tests as proof that all 516 original business workflows are migrated.
