# BULK129 — Isolated QA setup, not production parity sign-off

This package adds an interactive Windows setup wizard and a loopback-bound QA server launcher. No script here creates, clones, updates or deletes an existing database. Contact / Front Menu writes remain disabled in the ordinary `.env.local` workflow. No passwords or QA tokens are bundled.

## Prerequisites

- A **separate**, disposable MariaDB QA database, provisioned by your DBA with least-privilege credentials. It **must not** have the same name as the existing `.env.local` DB_NAME and must include `qa`, `test` or `sandbox` in its name.
- The QA schema must include `contacts`, `front_menu`, and `emails`, including email templates 61 and 59. The preflight only checks selected columns, not content or full original DB schema.
- A captive SMTP sandbox with two explicitly safe recipient addresses (admin and contact), never real users.
- Working `node_modules` from the normal SourceIndia installation; the scripts never install dependencies or modify the original React backend.

## Windows workflow

Run from `E:\nextjs\sourceindia-next-new`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\prepare-bulk129-qa.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\start-bulk129-qa.ps1 -PreflightOnly
```

The wizard prompts for values and locally creates `.env.bulk129.qa.local`, **never** `.env.local`; this file is gitignored. The script refuses to overwrite an existing QA config. Tokens are randomly generated and not printed. The preflight makes **read-only** INFORMATION_SCHEMA queries and never attempts SMTP.

For a later, explicitly authorized test session only:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-bulk129-qa.ps1
```

Confirm `RUN-ISOLATED-QA` to launch Next.js on `127.0.0.1:3101`. The launcher loads only the dedicated QA config and runs the preflight first. **Do not send mutation requests** unless the disposable QA dataset and mailtrap are independently verified. Bearer tokens are private; never paste them into chat or commit them.

## Known limitations

- **No real write parity verified**. No real MySQL mutation, SMTP send, or Express-vs-Next write response comparison was executed while building this package.
- Preflight confirms only presence of columns; it does not confirm database isolation by server identity or SQL grants.
- Do not expose the QA server to a LAN or production environment.
- Preserve `.git` / `.env.local` / `node_modules` when extracting the full ZIP.
