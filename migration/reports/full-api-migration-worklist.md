# SourceIndia — Complete API Migration Verification Worklist

- Original Express registrations: **516**
- Static method/path candidates: **235**
- Registrations without static matching route: **281**
- Fully verified Express parity by this worklist: **0** (none asserted)

This worklist contains every original method/path registration. A static match does not prove equivalent auth, response, business workflow or DB effects.

## Conservative risk classification

| Risk group | Count |
|---|---:|
| READ_ONLY_CANDIDATE | 256 |
| DB_OR_WORKFLOW_WRITE | 122 |
| DESTRUCTIVE_OR_SOFT_DELETE | 80 |
| AUTH_CREDENTIALS_OTP | 43 |
| FILE_UPLOAD_STORAGE | 6 |
| OUTBOUND_EMAIL_OR_MESSAGE | 6 |
| BULK_IMPORT_EXPORT | 2 |
| SIDE_EFFECTFUL_GET_TRACKING | 1 |

## Acceptance gates

- **Read APIs:** run authenticated access, real MySQL schema and response parity tests with representative data, including error/pagination cases
- **Write APIs:** run only on isolated disposable database with external email, uploads and destructive operations disabled or mocked; verify transaction and rollback
- **External effects:** do not mark email delivery, upload, OTP, tracking, payment or physical-delete APIs complete based on mock HTTP tests
- **All 516:** only mark parity after original controller behavior and Next.js implementation are demonstrably equivalent

Full per-route data is in the CSV and JSON files.
