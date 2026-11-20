import { getApiBaseUrl } from "@/lib/api";
import { accountRecord } from "@/lib/userDashboard";

export type EditKind = "profile" | "company";
export type FieldErrors = Record<string, string>;
export const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const pptTypes = ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
const megabyte = 1024 * 1024;

const uploadRules: Record<string, { types: string[]; size: number }> = {
  file: { types: imageTypes, size: 2 },
  company_logo: { types: imageTypes, size: 2 },
  company_sample_ppt_file: { types: pptTypes, size: 12 },
  sample_file_id: { types: ["application/pdf"], size: 10 },
};

const profileKeys = ["fname", "lname", "mobile", "alternate_number", "email", "designation", "state", "city", "zipcode", "address"];
const companyKeys = ["organization_name", "company_email", "company_location", "company_website", "core_activity", "activity", "brief_company", "company_video_second"];
const profileRequired = {
  fname: "First Name", lname: "Last Name", mobile: "Mobile", email: "Email",
  state: "State", city: "City", zipcode: "Pincode", address: "Address",
};
const companyRequired = {
  organization_name: "Organization Name", company_email: "Company Email", company_location: "Company Location",
  company_website: "Company Website", core_activity: "Core Activity", activity: "Activity", brief_company: "Company Introduction",
};

export function prepareAccountEdit(kind: EditKind, buyer: boolean, values: FormData) {
  const profile = kind === "profile";
  const keys = profile ? [...profileKeys, ...(buyer ? ["website", "user_category", "products"] : [])] : companyKeys;
  const fields = Object.fromEntries(keys.map((key) => [key, String(values.get(key) ?? "").trim()]));
  const required = profile ? { ...profileRequired, ...(buyer ? { website: "Website" } : {}) } : companyRequired;
  const errors: FieldErrors = {};
  for (const [key, label] of Object.entries(required)) {
    if (!fields[key]) errors[key] = `${label} is required.`;
  }
  const email = profile ? "email" : "company_email";
  if (fields[email] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields[email])) errors[email] = "Enter a valid email.";
  if (profile) {
    if (fields.mobile && !/^[6-9]\d{9}$/.test(fields.mobile)) errors.mobile = "Enter a valid 10-digit mobile number.";
    if (fields.zipcode && !/^\d{5,6}$/.test(fields.zipcode)) errors.zipcode = "Enter a valid pincode.";
    if (buyer) fields.company_website = fields.website;
  } else {
    if (fields.company_website && !/^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i.test(fields.company_website)) {
      errors.company_website = "Enter a valid website URL.";
    }
    if (fields.company_video_second && !/^https?:\/\/\S+$/i.test(fields.company_video_second)) {
      errors.company_video_second = "Enter a URL starting with http:// or https://.";
    }
    if (fields.brief_company.length > 1500) errors.brief_company = "Company introduction must not exceed 1500 characters.";
  }

  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  for (const key of profile ? ["file"] : ["company_logo", "company_sample_ppt_file", "sample_file_id"]) {
    const upload = values.get(key);
    if (!(upload instanceof File) || !upload.name) continue;
    const rule = uploadRules[key];
    if (!rule.types.includes(upload.type)) errors[key] = "This file format is unsupported.";
    else if (upload.size > rule.size * megabyte) errors[key] = `Maximum file size is ${rule.size} MB.`;
    else body.set(key, upload);
  }
  return { body, errors };
}

export async function saveAccountEdit(body: FormData, token: string, signal: AbortSignal) {
  const base = getApiBaseUrl();
  if (!base) throw new Error("Account API is unavailable.");
  const result = await fetch(`${base}/signup/update-profile`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, body, signal,
  });
  const data = accountRecord(await result.json().catch(() => null));
  if (result.ok && data.success !== false && !data.error) return;
  if (result.status === 401 || result.status === 403) throw new Error("Please sign in again.");
  const message = data.error || data.message;
  throw new Error(typeof message === "string" ? message : "Your changes could not be saved.");
}
