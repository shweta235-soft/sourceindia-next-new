export const leadViews = ["leads", "approved", "pending", "public", "deleted"] as const;
export const openViews = ["open", "open-deleted"] as const;
export type EnquiryGroup = (typeof leadViews)[number] | (typeof openViews)[number] | "buyer";
export const enquiryGroups = {
  leads: { heading: "Enquiry", title: "Leads", section: "Leads Master" },
  approved: { heading: "Enquiry", title: "Approve Leads", section: "Leads Master" },
  pending: { heading: "Enquiry", title: "Pending Leads", section: "Leads Master" },
  public: { heading: "Enquiry", title: "Public Enquiries", section: "Leads Master" },
  deleted: { heading: "Enquiry", title: "Recently Deleted Enquiry", section: "Leads Master" },
  open: { heading: "Open Enquiries", title: "Open Enquiries List", section: "Open Enquiries" },
  "open-deleted": { heading: "Open Enquiries", title: "Recently Deleted Open Enquiries", section: "Open Enquiries" },
  buyer: { heading: "Buyer Enquiries", title: "Buyer Enquiries", section: "Buyers" },
} satisfies Record<EnquiryGroup, { heading: string; title: string; section: string }>;
export type LeadRecord = Record<string, unknown>;
export type LeadListResult = { data: LeadRecord[]; totalRecords: number; filteredRecords: number };
export type LeadDetailResult = {
  record: LeadRecord;
  messages: LeadRecord[] | null;
  previous: string;
  next: string;
};

export type OpenEnquiryDetailResult = { record: LeadRecord; messages: LeadRecord[] | null };
export type BuyerEnquiryOption = { id: string; name: string };

export const openSortFields = ["id", "name", "title", "description", "created_at", "updated_at"] as const;
export const buyerSortFields = ["id", "title", "message", "created_at"] as const;

export const leadSortFields = [
  "id", "enquiry_number", "from_organization_name", "to_organization_name",
  "enquiry_product", "quantity", "created_at", "updated_at",
] as const;

export function leadText(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export function leadDate(value: unknown) {
  const raw = leadText(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (!Number.isFinite(date.getTime())) return raw;
  return `${date.toLocaleDateString("sv-SE")} ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

export async function getAdminEnquiryData<T>(params: URLSearchParams, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/admin/enquiry-data?${params}`, { cache: "no-store", signal });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || "Enquiry data could not be loaded.");
  }
  return response.json() as Promise<T>;
}
