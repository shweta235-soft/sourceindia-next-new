"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { enquiryGroups, getAdminEnquiryData, leadDate, leadText, type BuyerEnquiryOption, type EnquiryGroup, type LeadListResult, type LeadRecord } from "@/lib/adminEnquiries";
import { ProductSelect } from "./ProductFields";
import { downloadAdminWorkbook } from "./exportCategoryMaster";
import styles from "./catalog-master.module.css";
import enquiryStyles from "./enquiry-preview.module.css";

type ContactData = { name: string; company: string; email: string; phone: string; slug?: string; badge?: string };
const emptyContact: ContactData = { name: "", company: "", email: "", phone: "" };
type TableRow = {
  id: string;
  title: string;
  message: string;
  created: string;
  updated: string;
  showHome: boolean;
  sender: ContactData;
  receiver: ContactData;
  product: { title: string; category: string; subCategory: string; quantity: string | number };
  enquiryNumber?: string;
  productSlug?: string;
};
type Column = { label: string; sortKey?: string; value: (row: TableRow) => string; render?: (row: TableRow) => ReactNode; sortable?: boolean };
const leadCounts = [["No. of Leads", "getApprove"], ["Open Leads", "status1"], ["Closed Leads", "status2"], ["Pending Leads", "status0"]] as const;

function liveRow(row: LeadRecord, group: EnquiryGroup): TableRow {
  const base: TableRow = {
    id: leadText(row.id), title: leadText(row.title), message: "", created: leadText(row.created_at), updated: leadText(row.updated_at),
    showHome: Number(row.is_home) === 1, sender: emptyContact, receiver: emptyContact,
    product: { title: "", category: "", subCategory: "", quantity: "" },
  };
  if (group === "open" || group === "open-deleted") {
    const type = leadText(row.user_type);
    return { ...base, message: leadText(row.description), sender: {
      ...emptyContact, name: leadText(row.name), email: leadText(row.email), phone: leadText(row.phone),
      badge: type === "1" ? "Seller" : type === "0" ? "Buyer" : "Public Enquiry",
    } };
  }
  if (group === "buyer") {
    const party = (value: unknown): ContactData => {
      const person = value as LeadRecord | undefined;
      const company = person?.company_info as LeadRecord | undefined;
      const name = [leadText(person?.fname), leadText(person?.lname)]
        .filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
      return { ...emptyContact, name, company: leadText(company?.organization_name), slug: leadText(company?.organization_slug) };
    };
    return { ...base, message: leadText(row.message), sender: party(row.sender), receiver: party(row.receiver) };
  }
  const contact = (side: "from" | "to"): ContactData => {
    const type = leadText(row[`${side}_user_type`]);
    return {
      name: leadText(row[`${side}_full_name`]), company: leadText(row[`${side}_organization_name`]),
      email: leadText(row[`${side}_email`]), phone: leadText(row[`${side}_mobile`]),
      slug: leadText(row[`${side}_organization_slug`]), badge: type === "1" ? "Seller" : type === "0" ? "Buyer" : "",
    };
  };
  return {
    ...base, id: base.id || leadText(row.enquiry_number), enquiryNumber: leadText(row.enquiry_number),
    sender: contact("from"), receiver: contact("to"),
    product: {
      title: leadText(row.product_name), category: leadText(row.category_name),
      subCategory: leadText(row.sub_category_name), quantity: leadText(row.quantity),
    },
    productSlug: leadText(row.product_slug),
  };
}

function Contact({ contact, badge = contact.badge }: { contact: ContactData; badge?: string }) {
  if (!contact.company && !contact.name && !contact.email && !contact.phone && !badge) return "—";
  return <>
    {contact.company && <div>{contact.slug ? <Link href={`/companies/${encodeURIComponent(contact.slug)}`} target="_blank" rel="noopener noreferrer">{contact.company}</Link> : contact.company}</div>}
    <div>{contact.name}</div>
    <div>{contact.email}</div>
    {contact.phone && <div>{contact.phone}</div>}
    {badge && <span className="badge bg-primary">{badge}</span>}
  </>;
}

const created: Column = { label: "Created At", sortKey: "created_at", value: ({ created }) => leadDate(created) };
const updated: Column = { label: "Updated At", sortKey: "updated_at", value: ({ updated }) => leadDate(updated) };
const leadColumns = (group: EnquiryGroup): Column[] => [
  { label: "Lead Number", sortKey: "enquiry_number", value: ({ enquiryNumber }) => enquiryNumber ?? "",
    render: ({ enquiryNumber }) => enquiryNumber ? <Link href={`/admin/admin-view-enquiry/${encodeURIComponent(enquiryNumber)}?from=${group}`}>{enquiryNumber}</Link> : "—" },
  { label: "Sender", sortKey: "from_organization_name", value: ({ sender }) => sender.company || sender.name, render: ({ sender }) => <Contact contact={sender} /> },
  { label: "Receiver", sortKey: "to_organization_name", value: ({ receiver }) => receiver.company || receiver.name, render: ({ receiver }) => <Contact contact={receiver} /> },
  { label: "Product", sortKey: "enquiry_product", value: ({ product }) => product.title,
    render: ({ product, productSlug }) => productSlug ? <Link href={`/products/${encodeURIComponent(productSlug)}`} target="_blank" rel="noopener noreferrer">{product.title}</Link> : product.title },
  { label: "Quantity", sortKey: "quantity", value: ({ product }) => String(product.quantity) },
  created, updated,
];
const openColumns: Column[] = [
  { label: "From", sortKey: "name", value: ({ sender }) => [sender.name, sender.email, sender.phone].filter(Boolean).join("\n"),
    render: ({ sender }) => <Contact contact={sender} /> },
  { label: "Title", sortKey: "title", value: ({ title }) => title },
  { label: "Description", sortKey: "description", value: ({ message }) => message },
  created, updated,
];
function BuyerContact({ contact }: { contact: ContactData }) {
  return <><i className="bx bx-user me-1" />{contact.name || "—"}
    <div><i className="bx bx-building me-1" />{contact.slug ?
      <Link href={`/companies/${encodeURIComponent(contact.slug)}`}>{contact.company}</Link> : contact.company || "—"}</div>
  </>;
}
const buyerColumns: Column[] = [
  { label: "From", sortable: false, value: ({ sender }) => sender.name, render: ({ sender }) => <BuyerContact contact={sender} /> },
  { label: "To", sortable: false, value: ({ receiver }) => receiver.name, render: ({ receiver }) => <BuyerContact contact={receiver} /> },
  { label: "Title", sortKey: "title", value: ({ title }) => title },
  { label: "Message", sortKey: "message", value: ({ message }) => message },
  { ...created, label: "Date" },
];
const serial: Column = { label: "S.No.", sortKey: "id", value: ({ id }) => id };

function BuyerFilter({ label, action, value, onChange }: {
  label: string; action: "buyer-users" | "buyer-companies"; value: string; onChange: (value: string) => void;
}) {
  const [options, setOptions] = useState<BuyerEnquiryOption[]>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    getAdminEnquiryData<BuyerEnquiryOption[]>(new URLSearchParams({ action }), controller.signal)
      .then((result) => { if (!controller.signal.aborted) setOptions(result); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [action]);
  return <>
    <select className="form-select" aria-label={label} value={value} disabled={!options} onChange={(event) => onChange(event.target.value)}>
      <option value="">{label}</option>
      {options?.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
    </select>
    {failed && <small role="status">Filter options could not be loaded.</small>}
  </>;
}

function RowActions({ row, open, deleted }: { row: TableRow; open: boolean; deleted: boolean }) {
  return <div className="dropdown">
    <button className="btn btn-sm btn-light" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label={`Actions for ${row.id}`}>
      <i className="bx bx-dots-vertical-rounded" aria-hidden="true" />
    </button>
    <ul className="dropdown-menu">
      {deleted && <li><button className="dropdown-item" type="button" disabled><i className="bx bx-windows me-2" />Restore</button></li>}
      <li><button className="dropdown-item text-danger" type="button" disabled><i className="bx bx-trash me-2" />Delete</button></li>
      {open && !deleted && <>
        <li><button className="dropdown-item" type="button" disabled><i className="bx bx-envelope me-2" />Mail</button></li>
        <li><Link className="dropdown-item" href={`/admin/open-enquiries/${encodeURIComponent(row.id)}`}><i className="bx bx-history me-2" />View</Link></li>
      </>}
    </ul>
  </div>;
}

export default function AdminEnquiryList({ group }: { group: EnquiryGroup }) {
  const { heading, title, section } = enquiryGroups[group];
  const open = group === "open" || group === "open-deleted";
  const buyer = group === "buyer";
  const deleted = group === "deleted" || group === "open-deleted";
  const lead = !open && !buyer;
  const hasSelection = lead && !deleted;
  const hasHome = open && !deleted;
  const hasApproval = group === "pending";
  const defaultFilters = { number: "", category: "", subCategory: "", start: "", end: "" };
  const [draft, setDraft] = useState(defaultFilters);
  const [filters, setFilters] = useState(defaultFilters);
  const [dateOpen, setDateOpen] = useState(false);
  const [user, setUser] = useState("");
  const [company, setCompany] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState({ column: serial, direction: -1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(buyer ? 10 : 25);
  const [search, setSearch] = useState("");
  const columns = open ? openColumns : buyer ? buyerColumns : leadColumns(group);
  const [live, setLive] = useState<{ key: string; result?: LeadListResult; error?: string }>();
  const [counts, setCounts] = useState<LeadRecord>();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const params = new URLSearchParams({
    view: group, page: String(page), limit: String(limit), search,
    sortBy: sort.column.sortKey ?? "id", sort: sort.direction === 1 ? "ASC" : "DESC",
    enquiry_no: filters.number, category: filters.category, sub_category: filters.subCategory,
    startDate: filters.start, endDate: filters.end,
  });
  if (buyer && user) params.set("user_id", user);
  if (buyer && company) params.set("company_id", company);
  const key = params.toString();

  useEffect(() => {
    const controller = new AbortController();
    getAdminEnquiryData<LeadListResult>(new URLSearchParams(key), controller.signal)
      .then((result) => { if (!controller.signal.aborted) setLive({ key, result }); })
      .catch((error: Error) => { if (!controller.signal.aborted) setLive({ key, error: error.message }); });
    return () => controller.abort();
  }, [key]);

  useEffect(() => {
    if (!lead || group === "public") return;
    const controller = new AbortController();
    getAdminEnquiryData<LeadRecord>(new URLSearchParams({ action: "counts" }), controller.signal)
      .then((result) => { if (!controller.signal.aborted) setCounts(result); })
      .catch(() => {});
    return () => controller.abort();
  }, [lead, group]);
  const liveState = live?.key === key ? live : undefined;
  const filtered = liveState?.result?.filteredRecords ?? 0;
  const total = liveState?.result?.totalRecords ?? 0;
  const pageCount = Math.ceil(filtered / limit);
  const start = (page - 1) * limit;
  const visible = liveState?.result?.data.map((row) => liveRow(row, group)) ?? [];
  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  const allSelected = visible.length > 0 && visible.every(({ id }) => selected.has(id));
  const changeDraft = (field: keyof typeof draft, value: string) => setDraft((previous) => ({ ...previous, [field]: value }));

  function select(ids: string[], checked: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => checked ? next.add(id) : next.delete(id));
      return next;
    });
  }

  async function exportRows() {
    setExportError("");
    setExporting(true);
    try {
      const records: TableRow[] = [];
      const exportParams = new URLSearchParams(key);
      exportParams.set("limit", "100");
      for (let batch = 1; ; batch++) {
        exportParams.set("page", String(batch));
        const { data, filteredRecords } = await getAdminEnquiryData<LeadListResult>(exportParams);
        records.push(...data.map((row) => liveRow(row, group)));
        if (!data.length || batch * 100 >= filteredRecords) break;
      }
      const fields: [string, string][] = columns.map((column) => [column.label, column.label]);
      const data = records.map((row) => Object.fromEntries(columns.map((column) => [column.label, column.value(row)])));
      downloadAdminWorkbook(data, fields, `${title} Export.xlsx`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Unable to export enquiries.");
    } finally {
      setExporting(false);
    }
  }

  function columnHeading(column: Column) {
    const active = sort.column.label === column.label;
    return <th key={column.label} scope="col" aria-sort={active ? sort.direction === 1 ? "ascending" : "descending" : undefined}>
      {column.sortable === false ? column.label : <button type="button" className={styles.sort} onClick={() => {
        setSort({ column, direction: active ? -sort.direction : 1 });
        setPage(1);
      }}>{column.label}<span aria-hidden="true">{active ? sort.direction === 1 ? "↑" : "↓" : "↕"}</span></button>}
    </th>;
  }

  function searchField() {
    return <label className="d-flex gap-2 align-items-center">Search:
      <input className={`form-control form-control-sm ${styles.search}`} placeholder="Search..." value={search}
        onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
    </label>;
  }

  return <div className={styles.master}>
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
      <div>
        <h4 className={`mb-1 ${styles.heading}`}>{heading}{!buyer && <span className={`badge ms-2 ${styles.count}`}>{total}</span>}</h4>
        {!buyer && <nav className="page-breadcrumb mb-3 d-none d-sm-block" aria-label="breadcrumb"><ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link href="/admin">Home</Link></li>
          <li className="breadcrumb-item">{section}</li>
          <li className="breadcrumb-item active" aria-current="page">{title}</li>
        </ol></nav>}
      </div>
      {!buyer && <div className="d-flex flex-wrap gap-2 mb-2">
        <button className="btn btn-sm btn-primary" type="button" disabled={exporting} onClick={() => void exportRows()}><i className="bx bx-download me-1" />{exporting ? "Exporting…" : "Excel"}</button>
        {hasSelection && <button className="btn btn-sm btn-danger" type="button" disabled><i className="bx bx-trash me-1" />Delete Selected</button>}
        <Link className="btn btn-sm btn-primary" href={open ? deleted ? "/admin/open_enquiries" : "/admin/open-enquiry-remove-list" : deleted ? "/admin/enquiries-list" : "/admin/enquiry-remove-list"}>
          {deleted ? "Back" : open ? "Recently Deleted Open Enquiries" : "Recently Deleted Enquiry"}
        </Link>
      </div>}
    </div>
    {exportError && <p className="alert alert-danger" role="alert">{exportError}</p>}
    {lead && group !== "public" && <div className="row py-3 mb-3">
      {leadCounts.map(([label, field]) => <div className="col-sm-3" key={label}>
        <div className="card mb-3"><div className="card-body bg-light rounded d-flex align-items-center">
          <div><p className="mb-0 text-secondary">{label}</p><h4 className="my-1">{leadText(counts?.[field]) || "—"}</h4></div>
          <span className={enquiryStyles.statIcon}><i className="bx bx-cart" aria-hidden="true" /></span>
        </div></div>
      </div>)}
    </div>}
    {(lead || group === "open-deleted") && <form className="card mb-3" onSubmit={(event) => {
      event.preventDefault(); setFilters(draft); setPage(1); setSelected(new Set());
    }}>
      <div className="card-body"><div className="row align-items-end">
        {lead && !deleted && <div className="col-md-4 mb-3"><label className="form-label w-100">
          Enquiry No<input className="form-control mt-2" placeholder="Enter Enquiry No" value={draft.number} onChange={(event) => changeDraft("number", event.target.value)} />
        </label></div>}
        {lead && !deleted && group !== "public" && <>
          <div className="col-md-4 mb-3"><ProductSelect label="Category" endpoint="categories" value={draft.category}
            onChange={(value) => setDraft({ ...draft, category: value, subCategory: "" })} /></div>
          <div className="col-md-4 mb-3"><ProductSelect label="Sub Category" value={draft.subCategory}
            endpoint={draft.category ? `sub_categories/category/${encodeURIComponent(draft.category)}` : ""}
            onChange={(value) => changeDraft("subCategory", value)} /></div>
        </>}
        <div className={deleted ? "col-md-8" : "col-md-6 mb-3"}>
          <span className="form-label d-block">Date Filter:</span>
          <button className="form-control text-start" type="button" aria-expanded={dateOpen} onClick={() => setDateOpen(!dateOpen)}>
            <i className="bx bx-calendar me-2" />{draft.start && draft.end ? `${draft.start} - ${draft.end}` : "Select Date Range"}
          </button>
          {dateOpen && <div className="d-flex gap-2 flex-wrap mt-2">
            <label>Start date<input className="form-control" type="date" value={draft.start} max={draft.end || undefined} required={Boolean(draft.end)}
              onChange={(event) => changeDraft("start", event.target.value)} /></label>
            <label>End date<input className="form-control" type="date" value={draft.end} min={draft.start || undefined} required={Boolean(draft.start)}
              onChange={(event) => changeDraft("end", event.target.value)} /></label>
          </div>}
        </div>
        <div className={`${deleted ? "col-md-4" : "col-12"} d-flex justify-content-end gap-2`}>
          <button className="btn btn-primary" type="submit">Apply</button>
          <button className="btn btn-secondary" type="button" onClick={() => {
            setDraft(defaultFilters); setFilters(defaultFilters); setPage(1); setSelected(new Set()); setDateOpen(false);
          }}>Clear</button>
        </div>
      </div></div>
    </form>}
    <div className="card"><div className="card-body">
      {buyer && <div className="row g-2 mb-3">
        <div className="col-md-3">{searchField()}</div>
        <div className="col-md-3"><BuyerFilter label="All Users" action="buyer-users" value={user}
          onChange={(value) => { setUser(value); setPage(1); }} /></div>
        <div className="col-md-3"><BuyerFilter label="All Companies" action="buyer-companies" value={company}
          onChange={(value) => { setCompany(value); setPage(1); }} /></div>
      </div>}
      <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap border-bottom pb-4 mt-2">
        <label className="d-flex gap-2 align-items-center"><select className="form-select form-select-sm w-auto" value={limit} aria-label="Entries per page"
          onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
          {(buyer ? [10, 25, 50, 100] : [25, 50, 100]).map((value) => <option key={value}>{value}</option>)}
        </select>entries per page</label>
        {!buyer && searchField()}
      </div>
      <div className="table-responsive border rounded-2 mt-4">
        <table className="table table-striped table-hover align-middle dataTable mb-0">
          <thead><tr>
            {hasSelection && <th scope="col"><input type="checkbox" aria-label="Select all records on page" checked={allSelected}
              disabled={!visible.length} onChange={(event) => select(visible.map(({ id }) => id), event.target.checked)} /></th>}
            {columnHeading(serial)}
            {columns.map(columnHeading)}
            {hasHome && <th scope="col">Show Home</th>}
            {hasApproval && <th scope="col">Approval</th>}
            {!buyer && <th scope="col">Action</th>}
          </tr></thead>
          <tbody>
            {!visible.length && <tr><td colSpan={columns.length + 1 + Number(hasSelection) + Number(hasHome) + Number(hasApproval) + Number(!buyer)}
              className="text-center">{!liveState ? "Loading..." : liveState?.error || "No matching records found"}</td></tr>}
            {visible.map((row, index) => <tr key={row.id}>
              {hasSelection && <td><input type="checkbox" aria-label={`Select ${row.id}`} checked={selected.has(row.id)}
                onChange={(event) => select([row.id], event.target.checked)} /></td>}
              <td>{start + index + 1}</td>
              {columns.map((column) => <td key={column.label}>{column.render?.(row) ?? column.value(row)}</td>)}
              {hasHome && <td><div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" checked={row.showHome} disabled aria-label={`Show ${row.id} on home`} />
              </div></td>}
              {hasApproval && <td><button className="btn btn-sm btn-success" type="button" disabled>Approve</button></td>}
              {!buyer && <td><RowActions row={row} open={open} deleted={deleted} /></td>}
            </tr>)}
          </tbody>
        </table>
      </div>
      <div className="d-flex justify-content-between flex-wrap gap-3 align-items-center mt-4">
        <span>Showing {visible.length ? start + 1 : 0} to {visible.length ? start + visible.length : 0} of {filtered} entries{filtered < total ? ` (filtered from ${total} total entries)` : ""}</span>
        <nav className="btn-group btn-group-sm" aria-label="Table pages">
          <button className="btn btn-outline-secondary" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          {Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstPage + index).map((number) =>
            <button className={`btn ${number === page ? "btn-primary" : "btn-outline-secondary"}`} type="button" key={number}
              aria-current={number === page ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>)}
          <button className="btn btn-outline-secondary" type="button" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      </div>
    </div></div>
  </div>;
}
