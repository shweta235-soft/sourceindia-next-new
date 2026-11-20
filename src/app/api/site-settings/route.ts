import { accountRecord as record } from "@/lib/userDashboard";

const publicKeys = [
  "logo_file", "favicon_file", "mobile", "trending_b2b_enabled",
  "trending_b2b_item_subcategory_ids", "trending_b2b_limit", "trending_b2b_random_monthly",
];
const homeKeys = [
  "footer_logo", "footer_heading", "footershort_description", "footer_img_1", "footer_img_2",
  "contactphone_1", "contactphone_2", "contactemail", "contact_map_url", "contactaddress",
  "facebook_url", "twitter_url", "linkedin_url", "youtube_url", "instagram_url",
  "popup_banner_file", "popup_banner_url", "popup_banner_status", "popup_banner_session_id",
];
const menuKeys = ["id", "name", "link", "type", "position", "parent_id", "is_show", "status"];

function select(row: Record<string, unknown>, keys: string[]) {
  return Object.fromEntries(keys
    .filter((key) => typeof row[key] === "string" || typeof row[key] === "number" || typeof row[key] === "boolean")
    .map((key) => [key, row[key]]));
}

function publicMenu(value: unknown, depth = 0): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const item = record(entry);
    return { ...select(item, menuKeys), sub_menu: depth < 1 ? publicMenu(item.sub_menu, depth + 1) : [] };
  });
}

function reply(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) return reply({ message: "Site settings API URL is missing." }, 503);

  const timeout = AbortSignal.timeout(12000);
  try {
    const response = await fetch(`${base}/settings/front-site`, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([request.signal, timeout]),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      console.warn("Site settings upstream returned status", response.status);
      return reply({ message: "Live site settings are unavailable." }, 502);
    }

    const raw: unknown = await response.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Unexpected response shape.");
    const settings = record(raw);
    return reply({
      ...select(settings, publicKeys),
      front_menu: publicMenu(settings.front_menu),
      home_settings: select(record(settings.home_settings), homeKeys),
    });
  } catch {
    if (!request.signal.aborted) console.warn(timeout.aborted ? "Site settings upstream timed out." : "Site settings upstream request failed.");
    return reply({ message: "Could not load live site settings." }, timeout.aborted ? 504 : 502);
  }
}
