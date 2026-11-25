# Step 66 — React vs Next.js design audit (source-derived)

## Scope
Compared original React frontend CSS from `sourceindia-main-new (1)(2).zip` with Step 65 Next.js `src/` CSS. This is a **static source audit**, not pixel-level browser verification. No original React or DB files were changed.

## React public design tokens
`frontend/src/assets/css/style.css` defines:

| Token | Value |
|---|---|
| `--primary-color` | `#00449C` |
| `--secondary-color` | `#707070` |
| `--dark-color` | `#1F2020` |
| `--color-orange` | `#ff6600` |
| `--orange-hover` | `#ff8534` |
| `--border-color` | `#E8E8E8` |
| `--color-white` | `#fff` |
| body background | `#f8f9fb` |

## Font and layout scope
- React `FrontLayout.jsx` imports `../assets/css/style.css`.
- React `AdminLayout.jsx` imports `../assets/css/app.css`.
- React `app.css` imports Google Font `Golos Text` weights 400–900 and assigns it to body. This is **admin-scoped in React**, not proof that the public site uses the same font.
- React `index.css` includes Vite starter system font declarations; verify import cascade before assuming it determines production typography.
- Next.js `src/legacy-assets/css/app.css` contains the admin font, but Next.js root layout imports Bootstrap and `globals.css`, not `app.css`.

## Static CSS inventory
- React frontend `src`: 13 CSS files (including icon/font styles).
- Step 65 Next.js `src`: 10 CSS files.
- Both source trees contain substantial matching blue/orange and neutral palette values. Matching color counts do **not** prove correct cascade, placement or exact visual parity.

## Implementation rules
1. Keep public and admin font/cascade separate; never globally force `Golos Text` without verifying the React public font.
2. Compare React page JSX, stylesheet imports, DOM classes, breakpoints, assets and actual browser screenshots before calling a page exact.
3. Check computed font-family, font size/weight, colors, spacing, header height, card dimensions and responsive behavior at the same viewport.
4. Preserve live API contracts and functionality; do not change DB or React source.

## Unverified
- Exact computed fonts and pixel parity in live browsers.
- Full page-by-page parity across public website, user dashboard and admin.
- Build of Step 66 (source-only documentation change).
