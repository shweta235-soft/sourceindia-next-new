"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { accountFlag, accountRead, accountRecord, displayText } from "@/lib/userDashboard";
import { assetUrl } from "@/lib/asset";
import ChangePassword from "./ChangePassword";
import styles from "./account.module.css";

function Fields({ fields }: { fields: [string, unknown][] }) {
  return fields.map(([label, value]) => <div className={label === "Address" || label === "Company Introduction" ? "col-12" : "col-sm-6"} key={label}>
    <div className="pt-3 border-bottom"><h6>{label}</h6><p>{displayText(value) || "—"}</p></div>
  </div>);
}

function ProfileImage({ file, fallback, className }: { file: string; fallback: string; className: string }) {
  return <img src={assetUrl(file, fallback)} alt="" className={className} onError={(event) => {
    if (!event.currentTarget.src.endsWith(fallback)) event.currentTarget.src = fallback;
  }} />;
}

export default function UserProfile() {
  const { user } = useAuth();
  const id = displayText(user?.id);
  const [categoryData, setCategoryData] = useState<{ id: string; categories: string; subcategories: string }>();
  useEffect(() => {
    if (!/^\d+$/.test(id)) return;
    const controller = new AbortController();
    void accountRead<{ categories?: string; subcategories?: string }>(`signup/product-category/${id}`, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setCategoryData({
          id, categories: displayText(result.categories), subcategories: displayText(result.subcategories),
        });
      }).catch(() => {});
    return () => controller.abort();
  }, [id]);

  if (!user) return null;
  const company = accountRecord(user.company_info);
  const seller = accountFlag(user.is_seller);
  const fullName = [user.fname, user.lname].filter(Boolean).join(" ");
  const category = categoryData?.id === id ? categoryData : undefined;
  const optional: [string, unknown][] = [
    ["Designation", company.designation],
    ...(!seller ? [
      ["Category", displayText(company.user_category).toUpperCase()], ["Company Website", company.company_website],
      ["Products", user.products], ["Product Categories", category?.categories], ["Product Subcategories", category?.subcategories],
    ] as [string, unknown][] : []),
    ["State", accountRecord(user.state_data).name], ["City", accountRecord(user.city_data).name], ["Address", user.address],
  ];

  return <div className="row g-3">
    <div className="col-lg-4"><div className="card"><div className="card-body text-center">
      <ProfileImage file={user.file?.file ?? ""} fallback="/user.png" className={`rounded-circle ${styles.profileImage}`} />
      <h4 className="mt-3">{fullName}</h4>
      <p className="text-primary mb-1">{displayText(user.email)}</p>
      <p className="text-muted mb-2">{displayText(user.mobile)}</p>
      <ChangePassword key={id} />
    </div></div></div>
    <div className="col-lg-8"><div className="card"><div className="card-body">
      <div className="d-flex align-items-center justify-content-between gap-2 border-bottom pb-2">
        <h5 className="mb-0 text-primary">Profile</h5>
        <Link className="btn btn-sm btn-primary" href="/profile-edit"><i className="bx bx-pencil me-1" aria-hidden="true" />User Profile</Link>
      </div>
      <div className="row">
        <Fields fields={[
          ["Name", fullName], ["Email", user.email], ["Mobile", user.mobile], ["Alternate Number", user.alternate_number],
          ...optional.filter(([, value]) => displayText(value)),
        ]} />
      </div>
    </div></div></div>
    {seller && user.company_info && <div className="col-12"><div className="card"><div className="card-body">
      <div className="d-flex align-items-center justify-content-between gap-2 border-bottom pb-2">
        <h5 className="mb-0 text-primary">Company Information</h5>
        <Link className="btn btn-sm btn-primary" href="/company-edit"><i className="bx bx-pencil me-1" aria-hidden="true" />Company Profile</Link>
      </div>
      <div className="row">
        <Fields fields={[
          ["Organization Name", company.organization_name], ["Core Activities", accountRecord(company.CoreActivity).name],
          ["Activity", accountRecord(company.Activity).name], ["Category", category?.categories],
          ["Sub Category", category?.subcategories], ["Company Website", company.company_website], ["Company Location", company.company_location],
        ]} />
        {([["Brochure", "companySampleFile"], ["PPT", "companySamplePptFile"]] as const).map(([label, key]) => {
          const file = displayText(accountRecord(company[key]).file);
          const url = file ? assetUrl(file, "") : "";
          return <div className="col-sm-6" key={key}><div className="pt-3 border-bottom pb-3">
            <h6>Company {label}</h6>
            {url && /^https?:\/\/|^\/[^/]/i.test(url) ? <a href={url} target="_blank" rel="noopener noreferrer">Download {label}</a> : <span>No {label.toLowerCase()} uploaded</span>}
          </div></div>;
        })}
        <div className="col-sm-6"><div className="pt-3 border-bottom pb-3">
          <h6>Company Logo</h6>
          <ProfileImage file={displayText(accountRecord(company.companyLogo).file)} fallback="/default.png" className={styles.companyLogo} />
        </div></div>
        <Fields fields={[["Company Introduction", company.brief_company]]} />
      </div>
    </div></div></div>}
  </div>;
}
