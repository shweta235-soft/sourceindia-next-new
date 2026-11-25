import { createRequire } from "node:module";

// Verify external packages required by Phase 67 local API routes before building.
// Do not install dependencies or access network from the precheck.
const require = createRequire(import.meta.url);
const requiredPackages = ["mysql2/promise", "bcryptjs"];
const missing = requiredPackages.filter((name) => {
  try { require.resolve(name); return false; }
  catch (error) {
    if (error?.code === "MODULE_NOT_FOUND" || error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED") return true;
    throw error;
  }
});
if (missing.length) {
  console.error("\n[SourceIndia Phase 67] Local API dependencies are missing: " + missing.join(", "));
  console.error("Run these commands in the Next.js project folder:");
  console.error("  npm ci");
  console.error("  npm run build\n");
  console.error("The full project ZIP intentionally does not include node_modules.\n");
  process.exitCode = 1;
} else {
  console.log("[SourceIndia Phase 67] Local API dependencies found: mysql2/promise and bcryptjs.");
}
