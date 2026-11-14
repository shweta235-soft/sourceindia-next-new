Step 13 — targeted CSS cleanup
- Removed unused old si-banner-* CSS overrides from src/app/globals.css.
- Removed unused old si-trending-* CSS overrides from src/app/globals.css.
- Removed forced Arial font-family override; kept body margin reset.
- Preserved CSS still used by current components (si-category-links, si-category-products, si-product-scroll, si-mini-product).
- Preserved original legacy style.css and home.css.
- No changes to API, database, dependencies or environment.
Verification: static TSX class-name usage checked. Production build and visual comparison not performed.
