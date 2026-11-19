export type EnquiryGroup = "leads" | "approved" | "pending" | "public" | "deleted" | "open" | "open-deleted" | "buyer";

const contacts = [
  { name: "Asha Shah", company: "Example Components", email: "asha@example.com", phone: "" },
  { name: "Kiran Patel", company: "Sample Systems", email: "kiran@example.com", phone: "" },
  { name: "Neha Rao", company: "Demo Electronics", email: "neha@example.com", phone: "" },
];

const products = [
  { title: "RF Module", category: "Electronic Components", subCategory: "RF Components", quantity: 100 },
  { title: "PCB Connector", category: "Electronic Components", subCategory: "Connectors", quantity: 250 },
  { title: "Industrial Sensor", category: "Industrial Electronics", subCategory: "Sensors", quantity: 50 },
];

function makeRows(kind: "open" | "buyer", length: number) {
  return Array.from({ length }, (_, index) => {
    const number = index + 1;
    const product = products[index % products.length];
    const prefix = kind === "open" ? "DEMO-OPEN" : "DEMO-BUYER";
    const day = String((index % 27) + 1).padStart(2, "0");
    return {
      id: `${prefix}-${String(number).padStart(3, "0")}`, number,
      deleted: kind === "open" && index % 4 === 3,
      sender: contacts[index % contacts.length],
      receiver: contacts[(index + 1) % contacts.length],
      product,
      title: `Requirement for ${product.title}`,
      message: `Please share availability and lead time for ${product.quantity} units.`,
      created: `2026-11-${day}T10:00:00Z`,
      updated: `2026-11-${day}T12:15:00Z`,
      showHome: index % 2 === 0,
    };
  });
}

export type EnquiryPreviewRow = ReturnType<typeof makeRows>[number];
export type EnquiryContact = EnquiryPreviewRow["sender"];
export const openRows = makeRows("open", 20);
const buyerRows = makeRows("buyer", 13);
export const enquiryGroups: Record<EnquiryGroup, { heading: string; title: string; section: string; rows: EnquiryPreviewRow[] }> = {
  leads: { heading: "Enquiry", title: "Leads", section: "Leads Master", rows: [] },
  approved: { heading: "Enquiry", title: "Approve Leads", section: "Leads Master", rows: [] },
  pending: { heading: "Enquiry", title: "Pending Leads", section: "Leads Master", rows: [] },
  public: { heading: "Enquiry", title: "Public Enquiries", section: "Leads Master", rows: [] },
  deleted: { heading: "Enquiry", title: "Recently Deleted Enquiry", section: "Leads Master", rows: [] },
  open: { heading: "Open Enquiries", title: "Open Enquiries List", section: "Open Enquiries", rows: openRows.filter(({ deleted }) => !deleted) },
  "open-deleted": { heading: "Open Enquiries", title: "Recently Deleted Open Enquiries", section: "Open Enquiries", rows: openRows.filter(({ deleted }) => deleted) },
  buyer: { heading: "Buyer Enquiries", title: "Buyer Enquiries", section: "Buyers", rows: buyerRows },
};
export function formatEnquiryDate(value: string) {
  const [date, time] = value.split("T");
  const hour = Number(time.slice(0, 2));
  return `${date} ${hour % 12 || 12}:${time.slice(3, 5)} ${hour >= 12 ? "PM" : "AM"}`;
}
