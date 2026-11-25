# Step 70: Homepage trending loading-layout parity

Source inspected: React `frontend/src/sections/HomeCategoryShowcase.jsx` and Next `src/components/home/TrendingShowcase.tsx`.

React uses a `container-xxl` loading shell but an unconstrained loaded shell, which can produce a visible width jump. Next now uses a full-width loading shell matching its loaded shell, scoped to the homepage. This is a deliberate loading-state stability improvement, not a claim of exact screenshot parity.

The original public colors and inherited Bootstrap/system font are preserved. Admin Golos Text remains separate. No API or database changes.

Build and browser screenshots must be checked in the user's local environment.
