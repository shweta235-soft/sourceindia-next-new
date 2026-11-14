# QA status — full-folder consolidated delivery

## Scope
This is a **complete replacement source folder**, combining prior foundation/layout/homepage work and the Step 6 TrendingShowcase plus Step 7 centralized asset URL fix. It is NOT a complete React parity release.

## Confirmed by static inspection
- Next.js app directory and project manifests present.
- Homepage imports and renders TrendingShowcase.
- Homepage image URLs now call the centralized assetUrl helper.
- User-facing API base remains configurable with NEXT_PUBLIC_API_BASE_URL.

## NOT VERIFIED
- `npm install` and `npm run build` have not been run in this packaging environment.
- Exact pixel-level matching, live API response contracts, all image loads, links and dashboard/admin features are not validated.
- Backend conversion is not included.

## Installation
1. Commit current working tree to Git.
2. Keep your existing `.env.local` separately and do not share it.
3. Extract ZIP into a **new folder** rather than overwriting your working folder blindly.
4. Copy your `.env.local` into the new folder.
5. Run `npm install`, `npm run build`, `npm run dev` there.
6. Compare with React in browser before replacing the working folder.

## Known gaps
- Original homepage sections BuyerProduct/SellerCompany, exact CSS and responsive design parity are not fully converted.
- Public pages, user dashboard and admin panel remain incomplete.
- Fallback images may still appear if upstream URLs are invalid or remote assets unavailable.
