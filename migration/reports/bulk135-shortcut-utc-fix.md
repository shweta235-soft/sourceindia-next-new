# BULK135 UTC serialization correction

Before: GET parity 1 MATCH / 3 DIFF; all reported differences restricted to Shortcut.created_at and Shortcut.updated_at, native-minus-legacy +330 minutes.

Change: SQL `DATE_ADD(field, INTERVAL TIMESTAMPDIFF(SECOND, NOW(), UTC_TIMESTAMP()) SECOND)` before ISO `Z` formatting for both date fields. This uses the current MySQL connection session offset, without modifying stored dates or the original database.

Verified locally: 8 source/regression tests PASS. Not verified: HTTP response parity on Windows MySQL and full Next.js production build.

Safety: no schema changes, write handlers unchanged, legacy Express unchanged.
