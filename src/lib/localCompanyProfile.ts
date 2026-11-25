/** Explicit, non-sensitive company profile fields taken from the original CompanyInfo model. */
export interface LocalCompanyProfileRow {
  id: number;
  organization_name: string | null;
  organization_slug: string | null;
  postcode: string | null;
  brief_company: string | null;
  core_activity: string | null;
  activity: string | null;
  nature_business: string | null;
  designation: string | null;
  company_location: string | null;
  contact_person: string | null;
  company_phone: string | null;
  company_website: string | null;
  company_email: string | null;
  company_logo: number | null;
  organization_quality_certification: string | null;
  company_meta_title: string | null;
  organizations_product_description: string | null;
  is_verified: number;
}

export const ownCompanySql = `SELECT c.company_id AS id, c.organization_name, c.organization_slug,
    c.postcode, c.brief_company, c.core_activity, c.activity, c.nature_business,
    c.designation, c.company_location, c.contact_person, c.company_phone,
    c.company_website, c.company_email, c.company_logo,
    c.organization_quality_certification, c.company_meta_title,
    c.organizations_product_description, c.is_verified
  FROM users AS u
  INNER JOIN company_info AS c ON c.company_id = u.company_id
  WHERE u.user_id = ? AND u.is_delete = 0 AND u.status = 1
    AND c.is_delete = 0 LIMIT 1`;

export function publicLocalCompanyProfile(row: LocalCompanyProfileRow) {
  return {
    id: row.id, organization_name: row.organization_name,
    organization_slug: row.organization_slug, postcode: row.postcode,
    brief_company: row.brief_company, core_activity: row.core_activity,
    activity: row.activity, nature_business: row.nature_business,
    designation: row.designation, company_location: row.company_location,
    contact_person: row.contact_person, company_phone: row.company_phone,
    company_website: row.company_website, company_email: row.company_email,
    company_logo: row.company_logo,
    organization_quality_certification: row.organization_quality_certification,
    company_meta_title: row.company_meta_title,
    organizations_product_description: row.organizations_product_description,
    is_verified: row.is_verified,
  };
}
