/** Public allowlist for the locally authenticated user's own profile. */
export type LocalUserProfileRow = {
  id: number;
  fname: string;
  lname: string;
  email: string;
  is_seller: number;
  company_id: number | null;
  mobile: string | null;
  alternate_number: string | null;
  country_code: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  zipcode: string | null;
  website: string | null;
  user_company: string | null;
};

export function publicLocalUserProfile(row: LocalUserProfileRow) {
  return {
    id: row.id,
    fname: row.fname,
    lname: row.lname,
    email: row.email,
    is_seller: row.is_seller,
    company_id: row.company_id,
    mobile: row.mobile,
    alternate_number: row.alternate_number,
    country_code: row.country_code,
    country: row.country,
    state: row.state,
    city: row.city,
    address: row.address,
    zipcode: row.zipcode,
    website: row.website,
    user_company: row.user_company,
  };
}

export function profileMatchesSession(
  row: Pick<LocalUserProfileRow, "id" | "email" | "is_seller"> | null,
  claims: { id: number; email: string; is_seller: number },
): boolean {
  return !!row && row.id === claims.id && row.email === claims.email && row.is_seller === claims.is_seller;
}
