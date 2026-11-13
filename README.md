# SourceIndia Next.js 16 — Layout Increment 2

Contains the previous foundation plus converted authentication/site-settings providers and working preliminary public header, footer and user header components. Uses live endpoints `/settings/front-site`, `/signup/profile`, `/front_menu/main-search` (POST). Original React archive was read only.

## Run
1. Extract this package into a **new folder** (do not overwrite your existing work without backup).
2. Copy `.env.example` to `.env.local` and verify the API base URL and asset root. Keep secrets out of `NEXT_PUBLIC_` variables.
3. `npm install` then `npm run dev`.
4. Open `http://localhost:3000`.

## Scope / limitations
- This is NOT a complete UI migration. Home sections, user dashboard body, admin panel, route coverage and many footer details are not converted.
- Header/footer are functional initial adaptations, not pixel-perfect verified against React. Site settings and search depend on accessible live API and CORS.
- Sourcing Interest modal trigger exists but modal content is not yet migrated.
- Live API availability and build/runtime checks have not been verified in this environment.
- No database or original React files were modified.
