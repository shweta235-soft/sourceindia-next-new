# Step 67 — Homepage source-parity correction (first batch)

## Verified against original React source
- `frontend/src/sections/Company.jsx`: featured company image uses `ImageFront` with width=180, height=180, `img-fluid`, fallback enabled.
- `frontend/src/admin/common/ImageFront.jsx`: image loading lazy, fallback `/default.png`.
- `frontend/src/assets/css/style.css`: primary #00449C, orange #ff6600, background #f8f9fb.
- `frontend/src/pages/Home.jsx`: featured companies section is rendered from `sections/Company.jsx`.

## Changed
- `src/components/home/Homepage.tsx`: company logo now receives original 180x180 sizing and responsive `img-fluid`, with contain fitting; existing image fallback remains.

## Still pending
- Exact desktop/mobile screenshot parity, image URL availability, header, hero, cards, footer, dashboard.
- Build was not executed in this environment.
