# Step 69 — React / Next.js font and color review

Source: original `frontend/src/assets/css/style.css`, `frontend/src/assets/css/app.css`, `frontend/src/index.css` and current Next.js `src/app/layout.tsx`, `src/app/globals.css`.

## Confirmed
- Public React FrontLayout imports `style.css`, with page background `#f8f9fb` and tokens primary `#00449C`, orange `#ff6600`, orange hover `#ff8534`, dark `#1F2020`, secondary `#707070`, border `#E8E8E8`, white `#fff`. Next.js imports the same public style.css.
- React admin `app.css` imports Google font Golos Text, sets admin body to 14px, `#4c5258`, background `#F7F8F9`. Do not apply globally to public Next.js pages.
- React `index.css` defines system-ui/Avenir/Helvetica/Arial, but whether it is imported into the React application needs checking at App import level. Public font cannot safely be asserted to be Golos Text.
- Next.js imports Bootstrap before `globals.css`, so public pages inherit Bootstrap system-ui unless component-specific CSS overrides it.

## Changes
- Added namespaced `--si-*` aliases to Next.js globals.css matching original public React palette, without changing existing colors or component layouts.
- No global font override was applied, because that would change already-working public typography without browser-level computed-style evidence.

## Still to verify
- Browser computed font-family for matching React/Next header, cards, footer; actual font files/network loads; screenshot at same viewport/zoom and content; spacing, line heights, icon fonts and admin/user dashboard scopes.
