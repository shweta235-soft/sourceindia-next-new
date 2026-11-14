# Step 11: React header and hero markup alignment

Compared with the uploaded original React `common/FrontHeader.jsx` and `sections/Banner.jsx`.

- Header now uses the original `top-bar`, `welcomeBox`, `middleBox`, `lastbox`, `navbar-brand`, `centerMenu`, and `sourcesatya` class hierarchy.
- Homepage header no longer shows a redundant search bar; search remains in the hero. Non-homepage search remains in the header.
- Added the ELCINA and MeitY links from the original header.
- Hero adopts original class names for main banner, left card, slider indicators, right search card, and popular searches.
- Existing API base, data fetches and database remain unchanged.

## Verification and limitations
- TypeScript TSX syntax parsed successfully for changed components with the TypeScript compiler parser.
- `npm install --offline` was blocked by uncached dependencies; `npm run build` was **not** executed here.
- No visual browser comparison was possible here. Exact pixel parity is **not verified**.
- The banner's JSX still differs from the original in some nested elements and conditional logic; this is an incremental conversion, not a finished React-identical design.
- The ZIP contains the complete source folder, but excludes `.env.local`, `.git`, `.next` and `node_modules`.

## Safe testing
Extract into a fresh test directory; copy your existing `.env.local`; run `npm install` then `npm run build`. Do not replace your working Step 10 project until it passes.
