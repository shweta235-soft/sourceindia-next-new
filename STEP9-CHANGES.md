# Step 9 - Original React markup conversion (partial)
- Compared original `frontend/src/sections/HomeCategoryShowcase.jsx` with Next.js `TrendingShowcase.tsx`.
- Replaced invented `si-trending-*` structure with React CSS class structure: `homeCategoryShowcase`, `browseCategories`, `sidebar`, `mc-list`, `mcl-iteam`, `trendingCategories`, `tren_list`, `tren_iteam`, `promotional-banners`.
- Kept existing API fetch, Next Link, original assets, and existing folder contents.
- Fixed trending items to inherit category_id from their parent.
- This is one focused original-structure conversion, NOT an exact homepage or complete site.
- No local production build or browser comparison has been performed. Do not replace your working project without a backup.
- Keep `.env.local` and `.git` unchanged. Extract into a separate test directory.
