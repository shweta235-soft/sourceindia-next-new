# Step 73 — Homepage banner image loading parity

Reference: original React `frontend/src/sections/Banner.jsx`.

- The React Banner preloads the first banner background before showing it.
- Next.js now preloads the same first banner image and displays it after load or error.
- Preserves the original fixed background image across left carousel slides and the static right search card.
- No changes to API contracts, colors, fonts, or original React files.

Validation: ZIP integrity verified. `next build` and browser visual parity not independently verified.
