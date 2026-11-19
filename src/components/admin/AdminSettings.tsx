"use client";

import { useEffect, useRef, useState } from "react";
import type { SettingField, SettingsSection } from "@/lib/adminSettings";
import { assetUrl } from "@/lib/asset";
import LegalDescriptionEditor from "./LegalDescriptionEditor";
import ReportsBreadcrumb from "./ReportsBreadcrumb";
import styles from "./home-settings.module.css";

type HomeValues = Record<string, string>;
const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

function ImageSetting({ name, label, value }: { name: string; label: string; value: string }) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const popup = name === "popup_banner_file";
  const source = preview || assetUrl(value, "");

  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview);
  }, [preview]);

  return <>
    <label className="form-label" htmlFor={name}>{label}</label>
    <input type="file" id={name} className={`form-control${error ? " is-invalid" : ""}`} accept={imageTypes.join(",")}
      aria-describedby={error ? `${name}-error` : undefined} onChange={(event) => {
        const file = event.target.files?.[0];
        if (!file) {
          setPreview("");
          setError("");
          return;
        }
        const validation = !imageTypes.includes(file.type) ? "Invalid image format" :
          file.size > 2 * 1024 * 1024 ? "Image must be under 2MB" : "";
        if (validation) event.target.value = "";
        setError(validation);
        setPreview(validation ? "" : URL.createObjectURL(file));
      }} />
    {error && <div id={`${name}-error`} role="alert" className="invalid-feedback">{error}</div>}
    {source && <img key={source} src={source} className={`mt-2${popup ? " rounded" : ""}`} alt={label}
      width={popup ? 120 : 80} onError={(event) => { event.currentTarget.hidden = true; }} />}
  </>;
}

function SettingControl({ field, value }: { field: SettingField; value: string }) {
  const [name, label, type = "text", , options] = field;
  if (type === "image") return <ImageSetting name={name} label={label} value={value} />;
  if (type === "editor") return <LegalDescriptionEditor label={label} description={value} />;
  if (type === "switch") return <div className="form-check form-switch">
    <input type="checkbox" role="switch" className="form-check-input" id={name} defaultChecked={value === "1"} />
    <label className="form-check-label" htmlFor={name}>{label}</label>
  </div>;

  const popup = name === "popup_banner_url";
  const required = !popup && !options?.optional;
  const placeholder = options?.placeholder ?? (popup ? "https://example.com" : label);
  const initialValue = type === "password" ? "" : value || options?.defaultValue || "";
  return <>
    <label className={`form-label${required ? " required" : ""}`} htmlFor={name}>{label}</label>
    {type === "select" ? <select id={name} className="form-select" defaultValue={initialValue} required={required}>
      {options?.options?.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
    </select> : type === "multiline" ?
      <textarea id={name} className="form-control" placeholder={placeholder} rows={3} defaultValue={initialValue} required={required} /> :
      <input id={name} type={type} className="form-control" placeholder={placeholder} defaultValue={initialValue}
        autoComplete={options?.autoComplete} min={options?.min} max={options?.max} required={required} />}
    {options?.help && <small className="text-muted">{options.help}</small>}
  </>;
}

export default function AdminSettings({ heading, title, sidebar, endpoint, sections, site = false }: {
  heading: string; title: string; sidebar: string; endpoint: string; sections: SettingsSection[]; site?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [visited, setVisited] = useState(() => new Set([0]));
  const [data, setData] = useState<{ settings?: HomeValues; error?: string }>();
  const [attempt, setAttempt] = useState(0);
  const tabButtons = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body?.message || `${heading} could not be loaded.`);
        if (!controller.signal.aborted) setData({ settings: body as HomeValues });
      } catch (error: unknown) {
        if (!controller.signal.aborted) setData({ error: error instanceof Error ? error.message : `${heading} could not be loaded.` });
      }
    })();
    return () => controller.abort();
  }, [attempt, endpoint, heading]);

  function select(index: number, focus = false) {
    setActive(index);
    setVisited((previous) => previous.has(index) ? previous : new Set([...previous, index]));
    if (focus) tabButtons.current[index]?.focus();
  }

  return <>
    <ReportsBreadcrumb page="Settings" title={title} />
    <h5 className="mb-3">{heading}</h5>
    <div className="row">
      <div className={site ? "col-xl-3 mx-auto" : "col-md-3"}>
        <div className={`card card-border mb-4 ${styles.menu}`}><div className="card-body">
          <h6 className="mb-3 fw-bold">{sidebar}</h6>
          <ul className={`nav nav-pills pb-0 customnavbar d-block ${styles.tabs}${site ? " pt-1" : ""}`} role="tablist" aria-label={`${heading} sections`} aria-orientation="vertical">
            {sections.map(({ id, title, icon }, index) => (
              <li className="nav-item mb-1" role="presentation" key={id}>
                <button ref={(button) => { tabButtons.current[index] = button; }} type="button"
                  id={`tab-${id}`} className={`nav-link text-start w-100${active === index ? " active" : ""}`}
                  role="tab" aria-controls={`primary-pills-${id}`} aria-selected={active === index} tabIndex={active === index ? 0 : -1}
                  onClick={() => select(index)} onKeyDown={(event) => {
                    const last = sections.length - 1;
                    const next = event.key === "ArrowDown" ? (index === last ? 0 : index + 1) :
                      event.key === "ArrowUp" ? (index === 0 ? last : index - 1) :
                        event.key === "Home" ? 0 : event.key === "End" ? last : undefined;
                    if (next !== undefined) {
                      event.preventDefault();
                      select(next, true);
                    }
                  }}>
                  <span className={`d-flex align-items-center${site ? " gap-1" : ""}`}>
                    <span className="tab-icon"><i className={`bx ${icon} me-1 ${styles.icon}`} aria-hidden="true" /></span>
                    <span className="tab-title">{title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div></div>
      </div>
      <div className="col-md-9">
        <div className={`card${site ? ` card-border ${styles.menu}` : ""}`}><div className="card-body">
          {!data && <p role="status">Loading {heading.toLowerCase()}…</p>}
          {data?.error && <p className="text-danger" role="alert">{data.error} <button type="button" className="btn btn-link btn-sm" onClick={() => {
            setData(undefined);
            setAttempt((value) => value + 1);
          }}>Retry</button></p>}
          <div className="tab-content">
            {sections.map(({ id, title, uppercase, fields }, index) => (
              <div id={`primary-pills-${id}`} className={`tab-pane${active === index ? " show active" : ""}`}
                role="tabpanel" aria-labelledby={`tab-${id}`} hidden={active !== index} key={id}>
                {visited.has(index) && data && <>
                  <h6 className={`mb-0 ${uppercase ? "text-uppercase" : "fw-bold"}`}>{title}</h6>
                  <hr />
                  <form className="row g-3" onSubmit={(event) => event.preventDefault()}>
                    {fields.map((field) => <div key={field[0]} className={`col-md-${field[3] ?? 6}`}>
                      <SettingControl field={field} value={data.settings?.[field[0]] ?? ""} />
                    </div>)}
                    <div className="col-12 text-end mt-4">
                      <button type="submit" className="btn btn-primary btn-sm px-4" disabled>Update</button>
                    </div>
                  </form>
                </>}
              </div>
            ))}
          </div>
        </div></div>
      </div>
    </div>
  </>;
}
