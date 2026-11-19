export const reportSources = {
  sellers: { path: "sellers", fields: ["id", "fname", "lname", "email", "mobile", "zipcode"] },
  buyers: { path: "buyers", fields: ["fname", "lname", "email", "mobile", "zipcode"] },
  companies: { path: "products/companies", listKey: "companies", fields: [
    "id", "organization_name", "company_location", "contact_person", "brief_company",
    "company_phone", "company_website", "company_email",
  ] },
  products: { path: "products", listKey: "products", fields: ["title", "code", "article_number", "product_service"] },
  enquiries: { path: "enquiries", fields: ["enquiry_number", "category_name", "sub_category_name"] },
  states: { path: "location/states/101", fields: ["id", "name"] },
  cities: { path: "location/cities", parent: true, fields: ["id", "name"] },
  categories: { path: "categories", fields: ["id", "name"] },
  subcategories: { path: "sub_categories/category", parent: true, fields: ["id", "name"] },
  coreActivities: { path: "core_activities", fields: ["id", "name"] },
} satisfies Record<string, { path: string; listKey?: string; parent?: boolean; fields: string[] }>;

export type ReportSource = keyof typeof reportSources;
export type ReportOption = { value: string; label: string };
type ReportFilter = {
  key: string;
  label: string;
  source?: ReportSource;
  valueKey?: string;
  labelKeys?: string[];
  parent?: string;
  options?: ReportOption[];
};
type Report = {
  title: string;
  path: string;
  filters: ReportFilter[];
  columns: [string, string][];
  flags?: [string, string][];
};

function choices(values: [string, string][]): ReportOption[] {
  return values.map(([value, label]) => ({ value, label }));
}

const company: ReportFilter = { key: "company_id", label: "Company Name", source: "companies", valueKey: "id", labelKeys: ["organization_name"] };
const memberColumns: Report["columns"] = [
  ["Id", "id"], ["First Name", "fname"], ["Last Name", "lname"], ["Email", "email"], ["Phone", "mobile"],
  ["Address", "address"], ["Company Name", "organization_name"], ["State Name", "state_name"],
  ["City Name", "city_name"], ["Zipcode", "zipcode"], ["Status", "status"], ["Approve", "is_approve"],
  ["Created", "created_at"],
];

function memberFilters(source: "sellers" | "buyers"): ReportFilter[] {
  return [
    { key: "fname", label: "First Name", source },
    { key: "lname", label: "Last Name", source },
    { key: "email", label: "Email", source },
    { key: "mobile", label: "Mobile", source },
    company,
    { key: "member_role", label: "Member Role", options: choices([["1", "Admin"]]) },
    { key: "state", label: "State", source: "states", valueKey: "id", labelKeys: ["name"] },
    { key: "city", label: "City", source: "cities", parent: "state", valueKey: "id", labelKeys: ["name"] },
    { key: "zipcode", label: "Zipcode", source },
    { key: "status", label: "Status", options: choices([["1", "Active"], ["0", "Inactive"]]) },
    { key: "is_approve", label: "Approve", options: choices([["1", "Approve"], ["0", "Pending"]]) },
  ];
}

export const reports: Record<"seller" | "buyer" | "company" | "product" | "enquiry", Report> = {
  seller: { title: "Seller", path: "sellers/filtered", filters: memberFilters("sellers"), columns: memberColumns },
  buyer: { title: "Buyer", path: "buyers/filtered", filters: memberFilters("buyers"), columns: memberColumns },
  company: {
    title: "Company",
    path: "products/companies_filtered",
    filters: [
      { key: "organization_name", label: "Company Name", source: "companies" },
      { key: "company_location", label: "Company Location", source: "companies" },
      { key: "contact_person", label: "Contact Person", source: "companies" },
      { key: "brief_company", label: "Brief Company", source: "companies" },
      { key: "company_phone", label: "Company Phone", source: "companies" },
      { key: "company_website", label: "Company Website", source: "companies" },
      { key: "company_email", label: "Company Email", source: "companies" },
      { key: "core_activity", label: "Core Activity", source: "coreActivities", valueKey: "id", labelKeys: ["name"] },
      { key: "activity", label: "Activity", source: "subcategories", parent: "core_activity", valueKey: "id", labelKeys: ["name"] },
    ],
    columns: [["Company Name", "organization_name"], ["Company Location", "company_location"], ["Contact Person", "contact_person"],
      ["Brief Company", "brief_company"], ["Company Phone", "company_phone"], ["Company Website", "company_website"],
      ["Company Email", "company_email"], ["Core Activity", "coreactivity_name"], ["Created", "created_at"]],
  },
  product: {
    title: "Product",
    path: "products/filtered",
    filters: [
      { key: "title", label: "Product Name", source: "products" },
      { key: "user_id", label: "Seller Name", source: "sellers", valueKey: "id", labelKeys: ["fname", "lname"] },
      { key: "category_name", label: "Category", source: "categories", valueKey: "id", labelKeys: ["name"] },
      { key: "sub_category_name", label: "Sub Category", source: "subcategories", parent: "category_name", valueKey: "id", labelKeys: ["name"] },
      company,
      { key: "code", label: "Code", source: "products" },
      { key: "article_number", label: "Article Number", source: "products" },
      { key: "product_service", label: "Product Service", source: "products" },
    ],
    flags: [["Gold", "is_gold"], ["Featured", "is_featured"], ["Recommended", "is_recommended"], ["Best Product", "best_product"]],
    columns: [["Product Name", "title"], ["User Name", "user_name"], ["Category", "category_name"], ["Sub Category", "subcategory_name"],
      ["Company Name", "company_name"], ["Code", "code"], ["Article Number", "article_number"], ["Product Service", "product_service_name"],
      ["Gold", "is_gold"], ["Featured", "is_featured"], ["Recommended", "is_recommended"], ["Best Product", "best_product"],
      ["Created", "created_at"]],
  },
  enquiry: {
    title: "Enquiry",
    path: "enquiries/filtered",
    filters: [
      { key: "enquiry_number", label: "Enquiry Number", source: "enquiries" },
      { key: "category_name", label: "Category", source: "enquiries" },
      { key: "sub_category_name", label: "Sub Category", source: "enquiries" },
      company,
    ],
    columns: [["Enquiry Number", "enquiry_number"], ["Category", "category_name"], ["Sub Category", "sub_category_name"],
      ["Company Name", "company_name"], ["Created", "created_at"]],
  },
};

export type ReportKind = keyof typeof reports;
