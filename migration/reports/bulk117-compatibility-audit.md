# BULK117 — SourceIndia 516-route original Express compatibility layer

- **Original registrations:** 516 across 48 modules and 50 mounts.
- **Next-specific v2 method/path overrides:** 14. These take priority over the bridge.
- **Original Express bridge fallbacks:** 502. Original controller/middleware code reused unchanged in-process.
- **Fully verified 1:1 Next-native parity:** **0 confirmed in this audit**. This is a compatibility interim solution, NOT a final native migration.

## Scope and safety

The original user-uploaded Express JavaScript router/controller/model source was copied into the **Next.js project archive**, while the original React/Express project was not modified. No `.env`, static upload data, or original `server.js` was included. The original server startup is dangerous because it synchronizes tables and backfills keywords; the bridge does **not** execute it.

- Development: GET is available through bridge except known side-effectful GETs.
- Production: bridge disabled until SOURCEINDIA_LEGACY_COMPAT_PRODUCTION=1.
- Writes: disabled until SOURCEINDIA_LEGACY_COMPAT_WRITES=1; do not enable on a shared/production DB.
- Side-effectful GETs: disabled until SOURCEINDIA_LEGACY_COMPAT_SIDE_EFFECTFUL_GET=1.
- The old Express controller auth logic is preserved, **not audited**; original unprotected admin queries may expose sensitive data.
- Existing Next v2 product/location GET routes still take priority; these are not automatically original-response-identical.
- All original source references in this report are from the supplied zip, not Windows drive contents.

## Install and test on Windows

Extract the complete project ZIP while preserving your current `.env.local`, `.git` and `node_modules`. Do not copy from the old React directory into it.

```powershell
npm run setup:legacy:compat
npm run test:api:bulk117
npm run build
```

Start `npm run dev` in terminal 1; run in terminal 2:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk117.ps1
```

API status after these smoke tests **cannot** be called production-ready. Complete 516-controller contract-by-contract tests against an isolated DB and frontend migration remain outstanding.
