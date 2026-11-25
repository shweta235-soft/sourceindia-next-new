# Step 68 — Featured Company image markup parity

Reference: original React `frontend/src/sections/Company.jsx` renders `ImageFront` with `width={180}`, `height={180}`, `showFallback={true}`. Original `ImageFront.jsx` sets `className="img-fluid"`, `loading="lazy"`, and `decoding="async"` on an HTML image element.

Updated Next.js `Homepage.tsx` to use HTML width and height attributes rather than inline CSS width/height/objectFit for featured-company logos, and added `decoding="async"` to the shared homepage Photo component. Original React CSS remains in control of styling.

This does NOT resolve missing company logo URLs or prove visual parity; compare browser network requests and React vs Next.js screenshots.
