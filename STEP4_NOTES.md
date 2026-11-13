# Phase 1 / Step 4 — Homepage correction
- Hero now uses a constrained background image, not an oversized inline image.
- The category section uses the original React CategoryMain hierarchy: category promo, subcategories, item-category links, and category-specific product calls.
- Existing live API client and all prior files are retained.
- This is an incremental correction, NOT pixel-perfect parity. Original React's BuyerProduct and SellerCompany, banner right-hand search panel, product slider, and exact CSS still require conversion.
- Runtime/build and live API behavior are not verified in this environment.
- Back up via Git commit before extracting. Keep .env.local and .git unchanged.
