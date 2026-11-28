# BULK128 — Front Menu API audit

## Source
Original: `legacy/sourceindia-express/routes/frontMenuRoutes.js` and `controllers/frontMenuController.js`. Original React source was not changed.

## Implemented
- Native GET `/v2/api/front_menu/`, `/count`, `/server-side`, `/:id`: hierarchy, root header/footer counts, pagination, detail.
- QA-token guarded native POST `/`, PUT `/:id`, PATCH `/:id/is_show`, PATCH `/:id/status`, DELETE `/:id`. Production writes forbidden. Input validation and transactions are included. Writes were not exercised against live DB.
- POST `/v2/api/front_menu/main-search` is **NOT functionally migrated**. The native route currently responds 501 for queries of length >=2 and valid type. Original Express weighted product suggestions and seller/buyer taxonomy results need dedicated parity work. For invalid type or <2 characters it returns the original `[]` response.

## Differences and caveats
- DELETE refuses a parent with child menus (409) instead of leaving orphaned children as original Express. This is an intentional safety deviation, not exact write parity.
- Create and update reject non-existent parents; original Express does not check parent existence.
- `created_at`/`updated_at` type behavior and original Sequelize DB timezone still require same-database differential testing.
- Original Express `front_menu` model maps `id` to `front_menu_id`; native SQL uses this physical column.
- No end-to-end MySQL, Next.js production build, authenticated write, weighted search, or SMTP integration verified in this execution environment.

## Windows checks
```powershell
npm run test:api:bulk128
npm run build
npm run dev
# In second terminal:
powershell -ExecutionPolicy Bypass -File .\scripts\test-local-bulk128.ps1
npm run test:api:bulk128:parity
```

Do not enable QA write variables on production or on any database containing valuable data.
