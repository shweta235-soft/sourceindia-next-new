import type { NextConfig } from "next";

// Express compatibility: legacy public API clients may request /v2/api/products/
// with a trailing slash. The Next.js default 308 would change the HTTP status
// before the GET handler can return its JSON response. Accept either spelling.
const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
