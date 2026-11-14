# Step 12 — React Banner markup alignment

Source: original `frontend/src/sections/Banner.jsx` (read-only). Target: `src/components/home/Homepage.tsx`.

- Restored original banner wrapper hierarchy: `mainBanner > bgCarouselImg > banner-slide > rowleftBox`.
- Restored left carousel CSS hooks (`carousel-inner`, `carousel-item`, `hero-card-header`, `hero-cta`, `slider-dot`) and right search CSS hooks (`hero-search-header`, `hero-subtitle`, `hero-search-form`, `popular-search-list`).
- Kept existing API paths, banner state, suggestions, search behavior and categories navigation.
- No database, environment, dependency, or original React source changes.
- TSX parser verification passed (zero syntax diagnostics). Full Next.js build and browser visual parity NOT verified: dependency installation was unavailable in the execution environment.

Install: overlay ZIP files onto your existing `E:\nextjs\sourceindia-next-test` folder without deleting `node_modules`, `.env.local`, or `.git`. Run `npm run build`, then `npm run dev`. Do not run `npm install` unless package dependencies changed (they did not).
