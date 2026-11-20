"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { FiCheckCircle, FiClipboard, FiFileText, FiGlobe, FiLink, FiMail, FiMapPin, FiUploadCloud, FiUser } from "react-icons/fi";
import { useAuth, type User } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { assetUrl } from "@/lib/asset";
import { accountFlag, accountRead, accountRecord, displayText } from "@/lib/userDashboard";
import { imageTypes, pptTypes, prepareAccountEdit, saveAccountEdit, type EditKind, type FieldErrors } from "@/lib/accountEdit";
import "./account-edit.css";

type Option = { value: string; label: string };
type Lookup = { items: Option[]; error?: string };
const categories = [
  { value: "brand", label: "Brand" }, { value: "ems", label: "EMS" }, { value: "oem", label: "OEM" },
  { value: "component_manufacturer", label: "Component Manufacturer" },
];

function useOptions(path: string) {
  const [result, setResult] = useState<Lookup & { path: string }>();
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    const { signal } = controller;
    void apiFetch<unknown[]>(path, { signal }).then((data) => {
      if (!Array.isArray(data)) throw new Error("Invalid options.");
      const items = data.map(accountRecord).map((row) => ({
        value: displayText(row.id) || displayText(row.name), label: displayText(row.name),
      })).filter((row) => row.value && row.label);
      if (!signal.aborted) setResult({ path, items });
    }).catch(() => {
      if (!signal.aborted) setResult({ path, items: [], error: "Options could not be loaded. Refresh to try again." });
    });
    return () => controller.abort();
  }, [path]);
  return result?.path === path ? result : undefined;
}

function Field({ name, label, children, error, required, wide }: {
  name: string; label: string; children: ReactNode; error?: string; required?: boolean; wide?: boolean;
}) {
  return <div className={wide ? "col-12" : "col-md-6"}>
    <label className="form-label" htmlFor={name}>{label}{required && <sup> *</sup>}</label>
    {children}
    {error && <div className="invalid-feedback" id={`${name}-error`}>{error}</div>}
  </div>;
}

function Choice({ name, label, value, currentLabel, lookup, change, disabled, error, required }: {
  name: string; label: string; value: string; currentLabel?: string; lookup?: Lookup;
  change?: (value: string) => void; disabled?: boolean; error?: string; required?: boolean;
}) {
  const entries = lookup?.items ?? [];
  const options = value && !entries.some((item) => item.value === value)
    ? [{ value, label: currentLabel || value }, ...entries] : entries;
  return <Field name={name} label={label} required={required} error={error}>
    <select id={name} name={name} className={`form-select ${error ? "is-invalid" : ""}`} value={value}
      aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined}
      onChange={(event) => change?.(event.target.value)} disabled={disabled} required={required}>
      <option value="">{!lookup && !disabled ? "Loading…" : `Select ${label}`}</option>
      {options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
    {lookup?.error && <small className="text-danger" role="status">{lookup.error}</small>}
  </Field>;
}

function Upload({ name, label, title, hint, accept, existing, variant = "blue", image, error, wide }: {
  name: string; label: string; title: string; hint: string; accept: string; existing?: string;
  variant?: string; image?: boolean; wide?: boolean; error?: string;
}) {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!image || !file || file.size > 2 * 1024 * 1024 || !imageTypes.includes(file.type)) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, image]);

  const stored = existing ? assetUrl(existing, "") : "";
  const safeStored = /^(https?:\/\/|\/[^/])/i.test(stored) ? stored : "";
  const picture = file ? (file.size <= 2 * 1024 * 1024 && imageTypes.includes(file.type) ? preview : "") : safeStored;
  return <Field name={name} label={label} error={error} wide={wide}>
    <div className={`upload-zone upload-zone-${variant}`}>
      <span className="upload-icon" aria-hidden="true">{image ? <FiUploadCloud /> : <FiFileText />}</span>
      <div><strong>{title}</strong><small>{hint}</small>
        <input id={name} name={name} type="file" className="visually-hidden" accept={accept}
          aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined}
          onChange={(event) => { setPreview(""); setFile(event.target.files?.[0]); }} />
        <label htmlFor={name} className="choose-file">Choose File</label><span className="selected-file">{file?.name}</span>
      </div>
    </div>
    {image && picture && <img className="img-preview mt-3" src={picture} width={150} height={150} alt={file ? "Selected image" : label} />}
    {!image && safeStored && <a className="d-inline-block mt-2" href={safeStored} target="_blank" rel="noopener noreferrer">View uploaded {label}</a>}
  </Field>;
}

function EditForm({ kind, user }: { kind: EditKind; user: User }) {
  const { setUser } = useAuth();
  const router = useRouter();
  const profile = kind === "profile";
  const buyer = !accountFlag(user.is_seller);
  const company = accountRecord(user.company_info);
  const [parent, setParent] = useState(displayText(profile ? user.state : company.core_activity));
  const [child, setChild] = useState(displayText(profile ? user.city : company.activity));
  const [category, setCategory] = useState(displayText(company.user_category));
  const [introduction, setIntroduction] = useState(displayText(company.brief_company));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const activeRequest = useRef<AbortController | null>(null);
  const designationsId = useId();
  const parents = useOptions(profile ? "location/states" : "core_activities?is_delete=0");
  const children = useOptions(parent ? `${profile ? "location/cities" : "activities/coreactivity"}/${encodeURIComponent(parent)}` : "");
  const designations = useOptions(profile ? "sellers/designations?status=1" : "");
  useEffect(() => () => activeRequest.current?.abort(), []);

  function textField(name: string, label: string, value: unknown, config: {
    type?: string; required?: boolean; icon?: ReactNode; list?: string;
  } = {}) {
    const input = <input id={name} name={name} type={config.type || "text"} defaultValue={displayText(value)}
      className={`form-control ${errors[name] ? "is-invalid" : ""}`} placeholder={`Enter ${label}`}
      list={config.list} required={config.required} aria-invalid={Boolean(errors[name])}
      aria-describedby={errors[name] ? `${name}-error` : undefined} />;
    return <Field name={name} label={label} required={config.required} error={errors[name]}>
      {config.icon ? <div className="company-input-wrap">{config.icon}{input}</div> : input}
    </Field>;
  }
  function textarea(name: string, label: string, value: unknown, required?: boolean) {
    return <Field name={name} label={label} wide required={required} error={errors[name]}>
      <textarea id={name} name={name} className="form-control" defaultValue={displayText(value)} rows={3}
        placeholder={`Enter ${label}`} required={required} aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined} />
    </Field>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeRequest.current) return;
    const { body, errors: issues } = prepareAccountEdit(kind, buyer, new FormData(event.currentTarget));
    setErrors(issues);
    setMessage("");
    if (Object.keys(issues).length) {
      event.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(issues)[0]}"]`)?.focus();
      return;
    }
    const token = localStorage.getItem("user_token");
    if (!token) {
      router.replace(`/login?returnTo=%2F${kind}-edit`);
      return;
    }
    const controller = new AbortController();
    activeRequest.current = controller;
    const { signal } = controller;
    setBusy(true);
    try {
      await saveAccountEdit(body, token, signal);
      const refreshed = await accountRead<{ user: User }>("/signup/profile", signal).catch(() => null);
      if (signal.aborted || localStorage.getItem("user_token") !== token) return;
      if (refreshed?.user) {
        setUser(refreshed.user);
        router.replace("/profile");
      } else {
        window.location.replace("/profile");
      }
    } catch (error) {
      if (!signal.aborted) setMessage(error instanceof Error ? error.message : "Your changes could not be saved.");
    } finally {
      activeRequest.current = null;
      if (!signal.aborted) setBusy(false);
    }
  }

  const parentKey = profile ? "state" : "core_activity";
  const childKey = profile ? "city" : "activity";
  const parentLabel = profile ? "State" : "Core Activity";
  const childLabel = profile ? "City" : "Activity";
  const parentName = accountRecord(profile ? user.state_data : company.CoreActivity).name;
  const childName = accountRecord(profile ? user.city_data : company.Activity).name;
  const imageKey = profile ? "file" : "company_logo";
  const imageLabel = profile ? "User Image" : "Company Logo";

  return <div className="account-edit-reference">
    <div className={`company-edit-page ${profile ? "profile-edit-page" : ""}`}>
      <form noValidate className="company-edit-card" onSubmit={submit} aria-busy={busy}>
        <div className="company-edit-header">
          {profile && <span className="company-header-icon" aria-hidden="true"><FiUser /></span>}
          <div><h1>{profile ? "Profile Information" : "Company Information"}</h1>
            <p>{profile ? "Keep your personal and contact details up to date." : "Provide your company details to help us showcase your business better."}</p></div>
          {!profile && <div className="company-header-art" aria-hidden="true"><FiFileText /><span /><span /></div>}
        </div>
        <fieldset className="company-edit-body" disabled={busy}>
          <div className={`row ${profile ? "g-3" : "g-4"}`}>
            {profile ? <>
              {textField("fname", "First Name", user.fname, { required: true })}
              {textField("lname", "Last Name", user.lname, { required: true })}
              {textField("mobile", "Mobile", user.mobile, { type: "tel", required: true })}
              {textField("alternate_number", "Alternate Number", user.alternate_number, { type: "tel" })}
              {textField("email", "Email", user.email, { type: "email", required: true })}
              {textField("designation", "Designation", company.designation, { list: designationsId })}
              <datalist id={designationsId}>{designations?.items.map((option) => <option key={option.value} value={option.label} />)}</datalist>
            </> : <>
              {textField("organization_name", "Organization Name", company.organization_name, { required: true, icon: <FiClipboard /> })}
              {textField("company_email", "Company Email", company.company_email, { type: "email", required: true, icon: <FiMail /> })}
              {textField("company_location", "Company Location", company.company_location, { required: true, icon: <FiMapPin /> })}
              {textField("company_website", "Company Website", company.company_website, { required: true, icon: <FiGlobe /> })}
            </>}
            <Choice name={parentKey} label={parentLabel} value={parent} currentLabel={displayText(parentName)} lookup={parents}
              change={(value) => { setParent(value); setChild(""); }} error={errors[parentKey]} required />
            <Choice name={childKey} label={childLabel} value={child} currentLabel={displayText(childName)} lookup={children}
              change={setChild} disabled={!parent} error={errors[childKey]} required />
            {profile && <>
              {textField("zipcode", "Pincode", user.zipcode, { required: true })}
              {buyer && <>
                {textField("website", "Website", user.website || company.company_website, { required: true })}
                <Choice name="user_category" label="User Category" value={category} change={setCategory} lookup={{ items: categories }} />
                {textarea("products", "Products", user.products)}
              </>}
              {textarea("address", "Address", user.address, true)}
            </>}
            <Upload name={imageKey} label={imageLabel} image wide title={profile ? "Upload your profile image" : "Upload your company logo"}
              accept={imageTypes.join(",")} hint="JPG, PNG, GIF or WEBP. Max size 2 MB."
              existing={displayText(profile ? user.file?.file : accountRecord(company.companyLogo).file)} error={errors[imageKey]} />
            {!profile && <>
              <Field name="brief_company" label="Company Introduction" wide required error={errors.brief_company}>
                <div className="textarea-wrap">
                  <textarea name="brief_company" id="brief_company" className="form-control p-3" rows={5}
                    value={introduction} onChange={(event) => setIntroduction(event.target.value)} required
                    aria-invalid={Boolean(errors.brief_company)}
                    aria-describedby={errors.brief_company ? "brief_company-error" : undefined} />
                </div>
                <div className="word-count"><span>Character limit: 1500</span><span>{introduction.length} / 1500</span></div>
              </Field>
              <Upload name="company_sample_ppt_file" label="PPT file" title="Upload your presentation (PPT)" hint="PPT or PPTX. Max size 12 MB."
                variant="green" accept={[".ppt", ".pptx", ...pptTypes].join(",")}
                existing={displayText(accountRecord(company.companySamplePptFile).file)} error={errors.company_sample_ppt_file} />
              <Upload name="sample_file_id" label="Company Brochure" title="Upload your company brochure" hint="PDF. Max size 10 MB."
                variant="orange" accept="application/pdf" existing={displayText(accountRecord(company.companySampleFile).file)} error={errors.sample_file_id} />
              <div className="col-12"><div className="row">
                {textField("company_video_second", "Upload Video URL", company.company_video_second, { type: "url", icon: <FiLink /> })}
              </div><small className="video-help">Enter your YouTube channel or video URL</small></div>
            </>}
          </div>
        </fieldset>
        {message && <p className="px-4 text-danger" role="alert">{message}</p>}
        <div className="company-edit-footer">
          <Link className="btn company-reset" href="/profile">Back to Profile</Link>
          <button type="submit" className="company-save" disabled={busy}><FiCheckCircle aria-hidden="true" />
            {busy ? "Saving…" : profile ? "Save Profile" : "Save Information"}
          </button>
        </div>
      </form>
    </div>
  </div>;
}

export default function AccountEdit({ kind }: { kind: EditKind }) {
  const { user } = useAuth();
  if (!user) return null;
  if (kind === "company" && !accountFlag(user.is_seller)) {
    return <div className="alert alert-info">
      Company Profile editing is available for seller accounts. <Link href="/profile">Back to Profile</Link>
    </div>;
  }
  return <EditForm key={`${kind}:${displayText(user.id)}`} kind={kind} user={user} />;
}
