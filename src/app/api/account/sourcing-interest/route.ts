import { sourcingId, type SourcingCategory, type SourcingOption } from "@/lib/sourcingInterest";

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function rows(value: unknown) {
  if (!Array.isArray(value)) throw new Error("Invalid sourcing data.");
  return value.map(record);
}
function label(value: unknown) {
  return typeof value === "string" ? value : "";
}
function option(row: Record<string, unknown>) {
  return { id: sourcingId(row.id), name: label(row.name) };
}
function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

class SourcingReadError extends Error {
  constructor(
    readonly source: "account verification" | "category list" | "category options",
    readonly reason: string,
    readonly upstreamStatus?: number,
  ) {
    super(`Sourcing ${source}: ${reason}`);
  }
}

function readFailure(error: SourcingReadError, detail: string) {
  if (error.upstreamStatus === 401 || error.upstreamStatus === 403) {
    return json({ message: `${error.message}. Please sign in again. ${detail}` }, 401);
  }
  const status = error.upstreamStatus === 429 ? 429 : 502;
  return json({ message: `${error.message}. ${detail}` }, status);
}

async function serve(request: Request, write: boolean) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !/^Bearer \S+$/i.test(authorization)) return json({ message: "Please sign in again." }, 401);
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!base) return json({ message: "The sourcing API is not configured." }, 503);

  const body = write ? record(await request.json().catch(() => null)) : {};
  const categoryParam = new URL(request.url).searchParams.get("categoryId");
  const categoryId = sourcingId(write ? body.categoryId : categoryParam);
  if ((write || categoryParam !== null) && !categoryId) return json({ message: "Select a valid category." }, 400);
  const ids = write && Array.isArray(body.ids) ? [...new Set(body.ids.map(sourcingId))] : [];
  const action = body.action;
  if (write && (!ids.length || ids.includes(0) || (action !== "add" && action !== "remove"))) {
    return json({ message: "Select valid sourcing options." }, 400);
  }

  const upstream = (path: string, data?: object) => fetch(`${base}/${path}`, {
    method: data ? "POST" : "GET",
    headers: { Authorization: authorization, ...(data ? { "Content-Type": "application/json" } : {}) },
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-store", redirect: "error",
    signal: AbortSignal.any([request.signal, AbortSignal.timeout(15000)]),
  });

  async function read<T>(source: SourcingReadError["source"], path: string, parse: (body: unknown) => T): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      let response: Response;
      try {
        response = await upstream(path);
      } catch (error) {
        if (attempt === 0 && !request.signal.aborted) continue;
        const reason = error instanceof Error && error.name === "TimeoutError"
          ? "the API timed out" : "the API could not be reached";
        throw new SourcingReadError(source, reason);
      }
      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        if (attempt === 0 && !request.signal.aborted && [502, 503, 504].includes(response.status)) continue;
        throw new SourcingReadError(source, `API returned HTTP ${response.status}`, response.status);
      }
      try {
        return parse(await response.json());
      } catch (error) {
        if (attempt === 0 && !request.signal.aborted && error instanceof TypeError) continue;
        throw new SourcingReadError(source, "the API returned an unreadable response");
      }
    }
  }

  try {
    const userId = await read("account verification", "signup/profile", (data) => {
      const id = sourcingId(record(record(data).user).id);
      if (!id) throw new Error("Account ID missing.");
      return id;
    });

    if (!categoryId) {
      const categoryRows = await read("category list", `dashboard/get-itemtype?userId=${userId}`, (data) => rows(record(data).categories));
      const categories: SourcingCategory[] = categoryRows.map((category) => ({
        ...option(category),
        groups: rows(category.groups).map((group) => ({
          ...option(group),
          categories: rows(group.categories).map((item) => ({ ...option(item), count: sourcingId(item.count) }))
            .filter((item) => item.id && item.name),
        })).filter((group) => group.id && group.name && group.categories.length),
      })).filter((category) => category.id && category.name && category.groups.length);
      return json({ categories });
    }

    function readOptions(): Promise<SourcingOption[]> {
      return read("category options", `dashboard/get-item-subcategory?categoryId=${categoryId}&userId=${userId}`, (data) =>
        rows(record(data).subcategories).map((row) => ({
          ...option(row), checked: row.checked === true || sourcingId(row.checked) === 1,
        })).filter((item) => item.id && item.name));
    }

    const options = await readOptions();
    if (!write) return json({ options });

    const byId = new Map(options.map((item) => [item.id, item]));
    if (ids.some((id) => !byId.has(id))) return json({ message: "Reload this category and try again." }, 400);
    const checked = action === "add";
    const changes = ids.filter((id) => byId.get(id)?.checked !== checked);
    if (!changes.length) return json({ options, saved: true });

    let writeStatus: number | undefined;
    try {
      const result = await upstream("dashboard/store-item-subcategory", {
        userId, activity: { category_id: categoryId, subcategory_ids: changes, action },
      });
      writeStatus = result.status;
      await result.body?.cancel();
    } catch {
      // The upstream may have applied the update before the connection failed.
    }

    let updated: SourcingOption[];
    try {
      updated = await readOptions();
    } catch (error) {
      if (error instanceof SourcingReadError) {
        return readFailure(error, "The save may have been applied. Reload this category to check before retrying.");
      }
      throw error;
    }
    const finalState = new Map(updated.map((item) => [item.id, item.checked]));
    const saved = ids.every((id) => finalState.get(id) === checked);
    if (saved) return json({ options: updated, saved: true });

    let message = "The requested selection was not saved. Your latest selections are shown below.";
    if (writeStatus === 401 || writeStatus === 403) message = "The sourcing API denied the save. Sign in again before retrying.";
    else if (writeStatus === 404 || writeStatus === 405 || writeStatus === 501) message = "The save endpoint is unavailable on the configured sourcing API.";
    else if (writeStatus === 429) message = "The sourcing API is receiving too many requests. Wait before retrying.";
    else if (writeStatus && writeStatus >= 400) message = `The sourcing API rejected the save (HTTP ${writeStatus}). Your latest selections are shown below.`;
    return json({ options: updated, saved: false, message });

  } catch (error) {
    if (error instanceof SourcingReadError) {
      return readFailure(error, write ? "The save request was not sent." : "Try loading the selections again.");
    }
    return json({ message: "Sourcing interests could not be loaded." }, 502);
  }
}

export function GET(request: Request) {
  return serve(request, false);
}

export function POST(request: Request) {
  return serve(request, true);
}
