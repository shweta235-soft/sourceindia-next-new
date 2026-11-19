"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { assetUrl } from "@/lib/asset";
import { leadDate, leadText } from "@/lib/adminEnquiries";
import { getAdminMemberData, type Member, type MemberKind } from "@/lib/adminMembers";
import styles from "./catalog-master.module.css";
import memberStyles from "./member-list.module.css";

type Field = [label: string, key: string, type?: string, required?: boolean];
type Category = { category_name?: string; subcategory_name?: string; category_id?: number; subcategory_id?: number };
const names: Field[] = [["First Name", "fname", "text", true], ["Last Name", "lname", "text", true]];
const email: Field = ["Email", "email", "email", true];
const mobile: Field = ["Mobile Number", "mobile", "tel", true];
const alternate: Field = ["Alternate Number", "alternate_number", "tel"];
const places: Field[] = [["Country", "country_name", "select", true], ["State", "state_name", "select", true], ["City", "city_name", "select", true], ["Post Code", "zipcode", "text", true]];
const photo: Field = ["Image", "file", "file", true];
const password: Field = ["Password", "password", "password", true];
const address: Field = ["Address", "address", "textarea", true];
const buyerCompany: Field[] = [
  ["Company Name", "organization_name", "text", true], ["Website", "website", "url"], ["Trader", "is_trading", "yesno"],
  ["ELCINA Member", "elcina_member", "elcina", true], ["Company Image", "company_file", "file", true], address, ["Products", "products", "textarea"],
];
const sellerCompany: Field[] = [
  ["Organization Name", "organization_name", "text", true], ["Core Activity", "coreactivity_name", "select", true],
  ["Activity", "activity_name", "select", true], ["Category & Sub Category", "categories", "category", true],
  ["Company Website", "company_website", "url"], ["Company Location", "company_location", "text", true],
  ["Star Supplier", "is_star_seller", "yesno", true], ["Trusted Seal Verified", "is_verified", "yesno", true],
  ["Featured Company", "featured_company", "yesno"], ["Trader", "is_trading", "yesno"],
  ["Company Display Title", "company_meta_title"], ["Company Image", "company_file", "file", true], ["Ppt File", "company_sample_ppt_file", "file"],
  ["Company Brochure", "company_sample_file", "file"], ["ELCINA Member", "elcina_member", "elcina", true],
  ["Upload Video", "company_video", "file"], ["Upload Video Url", "company_video_second", "url"],
  ["Brief Company Profile", "brief_company", "textarea", true], ["Products Description", "products", "textarea"],
];
const choices: Record<string, Array<[string, string]>> = {
  user_category: [["brand", "Brand"], ["ems", "EMS"], ["oem", "OEM"], ["component manufacturer", "Component Manufacturer"]],
  yesno: [["1", "Yes"], ["0", "No"]],
  elcina: [["1", "Yes"], ["2", "No"], ["3", "Not Sure"]],
};

function CategoryList({ row }: { row: Member }) {
  const categories = Array.isArray(row.categories) ? row.categories as Category[] : [];
  if (!categories.length) return <span className="text-muted">No categories selected</span>;
  return <ul className="mb-0">{categories.map(({ category_name, subcategory_name, category_id, subcategory_id }, index) =>
    <li key={`${category_id}-${subcategory_id}-${index}`}>{[category_name, subcategory_name].filter(Boolean).join(" / ")}</li>
  )}</ul>;
}

function FormField({ field: [label, key, type = "text", required], row }: { field: Field; row: Member }) {
  const value = type === "password" ? "" : leadText(row[key]);
  const options = choices[key] ?? choices[type];
  return <div className={type === "textarea" ? "col-12" : "col-md-4"}>
    <label htmlFor={type === "category" ? undefined : key} className={`form-label ${required ? "required" : ""}`}>{label}</label>
    {type === "category" ? <CategoryList row={row} /> : type === "textarea" ? <textarea readOnly id={key} className="form-control" rows={3} value={value} placeholder={label} /> :
      (options || type === "select") ? <select disabled id={key} value={value} className="form-select">
        <option value="">Select {label}</option>
        {(options ?? (value ? [[value, value]] : [])).map(([option, text]) => <option value={option} key={option}>{text}</option>)}
      </select> : type === "file" ? <>
        <input type="file" disabled id={key} className="form-control" />
        {leadText(row[`${key}_name`]) && <small>{leadText(row[`${key}_name`])}</small>}
      </> : <input id={key} type={type} readOnly className="form-control" value={value} placeholder={label} />}
  </div>;
}

function FormPreview({ row, buyers, edit }: { row: Member; buyers: boolean; edit: boolean }) {
  const passwordField = edit ? [] : [password];
  const userCategory: Field = ["User Category", "user_category", "select"];
  const designation: Field = ["Designation", "designation", "select"];
  const personal = buyers ? [...names, email, ...passwordField, mobile, ...places, alternate, photo, userCategory] :
    [...names, mobile, alternate, email, ...passwordField, ...places, designation, photo, address];
  return <>
    <div className="alert alert-secondary py-2">Form preview. Saving is unavailable.</div>
    {[{ title: "User Details", fields: personal, button: edit ? "Update User" : "" },
      { title: "Company Details", fields: buyers ? buyerCompany : sellerCompany, button: edit ? "Update Company" : "Submit" },
    ].map(({ title, fields, button }) => <section key={title} className="card mb-3">
      <div className="card-header bg-white"><h6 className="mb-0 fw-bold">{title}</h6></div>
      <div className="card-body"><div className="row g-3">
        {fields.map((field) => <FormField key={field[1]} field={field} row={row} />)}
        {button && <div className="col-12 text-end"><button disabled type="button" className="btn btn-primary">{button}</button></div>}
      </div></div>
    </section>)}
  </>;
}

function Profile({ row, buyers, id }: { row: Member; buyers: boolean; id: string }) {
  const [tab, setTab] = useState("Personal Info");
  const labels = buyers ? ["Personal Info", "Company Info", "Enquiry"] :
    ["Personal Info", "Company Info", "Sell Category", "Products", "Enquiry", "Open Leads", "My Leads"];
  const personal = [
    ["First Name", leadText(row.fname)], ["Last Name", leadText(row.lname)], ["Email", leadText(row.email)],
    ["Mobile", leadText(row.mobile)], ["Address", leadText(row.address)], ["Postcode", leadText(row.zipcode)],
    ["Country", leadText(row.country_name)], ["State", leadText(row.state_name)], ["City", leadText(row.city_name)],
    ["Member Since", leadDate(row.created_at)], ["User Status", Number(row.status) === 1 ? "Active" : "Inactive"],
    ["Account Status", Number(row.is_approve) === 1 ? "Active" : "Inactive"],
  ];
  const company = [
    ["Company", leadText(row.organization_name)], ["Location", leadText(row.company_location)], ["Website", leadText(row.company_website || row.website)],
    ["Core Activity", leadText(row.coreactivity_name)], ["Activity", leadText(row.activity_name)], ["Membership Plan", leadText(row.plan_name)],
  ];
  const params = new URLSearchParams({ id, cid: leadText(row.company_id) });
  return <>
    <div className="card mb-4"><div className={`card-body d-flex align-items-center ${memberStyles.profileBanner}`}>
      <div className={`me-3 rounded-circle bg-white text-dark d-flex align-items-center justify-content-center ${memberStyles.avatar}`}><i className="bx bx-user fs-3" aria-hidden="true" /></div>
      <h5 className="mb-0">{[leadText(row.fname), leadText(row.lname)].filter(Boolean).join(" ") || leadText(row.full_name)}</h5>
    </div></div>
    <div className="card mb-4"><div className="card-body py-0 px-1">
      <div className={`nav nav-pills ${memberStyles.profileTabs}`} aria-label="Profile sections">
        {labels.map((label) => <button key={label} className={`nav-link ${tab === label ? "active" : ""}`} type="button" aria-pressed={tab === label} onClick={() => setTab(label)}>{label}</button>)}
      </div>
    </div></div>
    <div className="card"><div className="card-body">
      {tab === "Personal Info" || tab === "Company Info" ? <>
        <div className="row g-3">
          {(tab === "Personal Info" ? personal : company).map(([label, value]) => <div key={label} className="col-md-4"><strong>{label}:</strong> {value}</div>)}
        </div>
        {tab === "Company Info" && <div className="mt-3">
          <p><strong>Upload Video Url:</strong><br />{leadText(row.company_video_second)}</p>
          <p><strong>Company Description:</strong><br />{leadText(row.organizations_product_description)}</p>
          <strong>Company Logo:</strong><br />{/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={assetUrl(leadText(row.company_file_name))} width={80} height={80} className="object-fit-contain" alt="Company logo" />
        </div>}
      </> : tab === "Sell Category" ? <CategoryList row={row} />
        : tab === "Products" ? <Link className="btn btn-sm btn-primary" href={`/admin/product-list?${params}`}>View Products</Link>
        : <p className="mb-0">This profile section is unavailable.</p>}
    </div></div>
  </>;
}

export default function MemberDetails({ kind, mode, id = "" }: { kind: MemberKind; mode: "add" | "edit" | "profile"; id?: string }) {
  const [result, setResult] = useState<{ id: string; row?: Member; error?: string }>();
  const buyers = kind === "buyers";
  const singular = buyers ? "Buyer" : "Seller";
  const title = mode === "profile" ? "User Profile" : `${mode === "edit" ? "Edit" : "Add"} ${singular}`;
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    getAdminMemberData<Member>(new URLSearchParams({ kind, action: "detail", id }), controller.signal)
      .then((row) => setResult({ id, row }))
      .catch((error: Error) => { if (!controller.signal.aborted) setResult({ id, error: error.message }); });
    return () => controller.abort();
  }, [kind, id]);
  const record = result?.id === id ? result : undefined;
  return <div className={styles.master}>
    <div className="d-flex align-items-center justify-content-between mb-3">
      <nav aria-label="Breadcrumb"><ol className="breadcrumb mb-0">
        <li className="breadcrumb-item"><Link href="/admin">Home</Link></li>
        <li className="breadcrumb-item"><Link href={`/admin/${kind}`}>{singular}s</Link></li>
        <li className="breadcrumb-item active" aria-current="page">{title}</li>
      </ol></nav>
      <Link className="btn btn-primary" href={`/admin/${kind}`}>Back</Link>
    </div>
    {mode === "add" ? <FormPreview row={{}} buyers={buyers} edit={false} /> : !record ? <p role="status">Loading...</p> :
      record.error || !record.row ? <p className="text-danger" role="alert">{record.error || "Member not found."}</p> :
      mode === "profile" ? <Profile row={record.row} id={id} buyers={buyers} /> : <FormPreview row={record.row} buyers={buyers} edit />}
  </div>;
}
