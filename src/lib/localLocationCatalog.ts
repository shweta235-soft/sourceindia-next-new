/** Read-only SourceIndia location lookups. Database field mapping verified against the original Sequelize models. */
export const COUNTRY_LIST_SQL = `SELECT country_id AS id, uuid, sortname, name, phonecode
 FROM countries ORDER BY country_id ASC`;
export const STATE_LIST_SQL = `SELECT state_id AS id, uuid, name, country_id
 FROM states ORDER BY state_id ASC`;
export const CITY_LIST_SQL = `SELECT city_id AS id, uuid, name, state_id
 FROM cities ORDER BY city_id ASC`;
export const STATES_BY_COUNTRY_SQL = `SELECT state_id AS id, uuid, name, country_id
 FROM states WHERE country_id = ? ORDER BY state_id ASC`;
export const CITIES_BY_STATE_SQL = `SELECT city_id AS id, uuid, name, state_id
 FROM cities WHERE state_id = ? ORDER BY city_id ASC`;

/** Allow one valid positive integer filter and optional harmless UTM metadata only. */
export function locationParentId(url: string, key: "countryId" | "stateId"): number | null {
  let params: URLSearchParams;
  try { params = new URL(url).searchParams; } catch { return null; }
  const keys = [...params.keys()];
  if (keys.some(k => k !== key && !/^utm_(source|medium|campaign|term|content|id)$/i.test(k))) return null;
  if (params.getAll(key).length !== 1) return null;
  const value = params.get(key) ?? "";
  if (!/^[1-9][0-9]{0,8}$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

export function locationPathId(value: string): number | null {
  if (!/^[1-9][0-9]{0,8}$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}
