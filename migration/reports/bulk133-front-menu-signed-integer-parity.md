# BULK133 — Contacts & Front Menu write follow-up

## Scope and evidence

Read-only original reference: `legacy/sourceindia-express/models/FrontMenu.js` and `controllers/frontMenuController.js`. The model declares `parent_id`, `type` and `position` as `DataTypes.INTEGER`, without nonnegative-only validation. MySQL `INT` is signed unless explicitly unsigned. BULK132's Next.js `smallInteger` rejected negative values in those three fields. BULK133 adds a separate signed 32-bit parser for those model fields while retaining exact 0/1 validation for `is_show` and `status`. `front_menu_id` route IDs still require positive integers. JSON and URL-encoded supported formats are preserved.

## Implementation and regression

Changed `src/lib/localBulk128FrontMenu.ts` and added `scripts/bulk133-menu-signed-int.test.mjs`; registered `npm run test:api:bulk133`. Source/mock regression `test:api:bulk133` completed with 39+4+5+6 = 54 tests PASS, 0 FAIL (four nested Node test invocations). Six new BULK133 cases cover source model, signed creation, partial update, out-of-range rejection, binary flags, and production deny gate.

## Safety and limitations

No real database writes, email deliveries, or filesystem modifications performed. Writes remain off by default and rejected in production by the existing QA guard. Real Express vs native *write* parity remains unverified, especially Sequelize error serialization and contact SMTP side effects. No additional legacy routes were added. Full Next.js build must be run on Windows with dependencies. Source files in `legacy/` are read-only references and unchanged from BULK132.
