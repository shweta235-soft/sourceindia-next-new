/** Match React frontend/src/config.js ROOT_URL: remove only the final /api. */
export function assetUrl(file?: string | null, fallback = "/default.png"): string {
  if (!file || file === "null" || file.endsWith("/null")) return fallback;
  if (/^(https?:)?\/\//i.test(file) || /^data:/i.test(file)) return file;
  if (file.startsWith("/default") || file.startsWith("/morecompany") || file.startsWith("/logo")) return file;
  const configured = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.trim();
  const api = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const root = (configured || (api ? api.replace(/\/api\/?$/i, "") : "")).replace(/\/$/, "");
  return root ? `${root}/${file.replace(/^\/+/, "")}` : fallback;
}
