"use client";

import { useEffect, useRef, useState } from "react";
import { assetUrl } from "@/lib/asset";
import { getCircularData, userTypeLabel, type Circular, type CircularUserType } from "@/lib/adminCircular";
import { leadText } from "@/lib/adminEnquiries";
import CircularDeleteDialog from "./CircularDeleteDialog";
import LegalDescriptionEditor from "./LegalDescriptionEditor";
import styles from "./email-circular.module.css";

function Attachment({ source, label, remove }: { source: string; label: string; remove: () => void }) {
  return <div className="position-relative m-2">
    <img src={source} alt={label} className="object-fit-cover m-3" width={80} height={80} loading="lazy" decoding="async" />
    <button type="button" className={`btn btn-danger btn-remove-image ${styles.remove}`} aria-label={`Remove ${label}`} onClick={remove}>
      <i className="bx bx-x me-0" aria-hidden="true" />
    </button>
  </div>;
}

export default function EmailCircularForm({ circularID }: { circularID?: string }) {
  const [result, setResult] = useState<{ row?: Circular; error?: string }>();
  const [userTypes, setUserTypes] = useState<CircularUserType[]>();
  const [userTypeError, setUserTypeError] = useState("");
  const [selectedAudience, setSelectedAudience] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [fileError, setFileError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const objectURLs = useRef(new Set<string>());

  useEffect(() => {
    const controller = new AbortController();
    void getCircularData<CircularUserType[]>("user-types", undefined, controller.signal).then((rows) => {
      if (!controller.signal.aborted) setUserTypes(rows);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setUserTypeError(error instanceof Error ? error.message : "User types could not be loaded.");
    });
    if (circularID) {
      void getCircularData<Circular>("detail", new URLSearchParams({ id: circularID }), controller.signal).then((row) => {
        if (!controller.signal.aborted) setResult({ row });
      }).catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ error: error instanceof Error ? error.message : "Email circular could not be loaded." });
      });
    }
    return () => controller.abort();
  }, [circularID, attempt]);

  useEffect(() => {
    const urls = objectURLs.current;
    return () => { for (const url of urls) URL.revokeObjectURL(url); urls.clear(); };
  }, []);

  const row = result?.row;
  const audience = selectedAudience ?? leadText(row?.user_type);
  return <div className="row"><div className="col-xl-12 mx-auto">
    <div className="card"><div className="card-body">
      {circularID && !result && <p role="status">Loading email circular…</p>}
      {result?.error && <p role="alert">{result.error} <button type="button" className="btn btn-link btn-sm" onClick={() => {
        setResult(undefined);
        setUserTypeError("");
        setAttempt((previous) => previous + 1);
      }}>Retry</button></p>}
      {(!circularID || row) && <form onSubmit={(event) => event.preventDefault()}>
        <div className="row"><div className="col-md-6 mb-3">
          <label htmlFor="user_type" className="form-label required">User</label>
          <select id="user_type" className="form-control" value={audience} onChange={(event) => setSelectedAudience(event.target.value)} required>
            <option value="">Select user type</option>
            {audience && !userTypes?.some(({ id }) => id === audience) && <option value={audience}>{audience}</option>}
            {userTypes?.map(({ id, name }) => <option key={id} value={id}>{userTypeLabel(name)}</option>)}
          </select>
          {userTypeError && <span className="text-danger" role="alert">{userTypeError}</span>}
        </div></div>
        <div className={styles.editor}><LegalDescriptionEditor description={leadText(row?.description)} label="Description" showSource /></div>
        <div className="col-md-12 mt-3">
          <label htmlFor="circular-files" className="form-label required">Email Circular Images</label><br />
          <input ref={input} id="circular-files" type="file" className="d-none" multiple accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={(event) => {
              const additions = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (additions.some((file) => !/^image\/(png|jpe?g|gif|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024)) {
                setFileError("Choose JPG, PNG, GIF or WebP images up to 2 MB each.");
                return;
              }
              setFileError("");
              const previews = additions.map((file) => {
                const url = URL.createObjectURL(file);
                objectURLs.current.add(url);
                return { name: file.name, url };
              });
              setFiles((previous) => [...previous, ...previews]);
            }} />
          <button type="button" className="btn btn-primary btn-sm" onClick={() => input.current?.click()}>
            <i className="bx bxs-plus-square me-1" aria-hidden="true" />Add Attachment
          </button>
          {fileError && <p role="alert" className="text-danger mt-2 mb-0">{fileError}</p>}
          <div className="mt-3 d-flex flex-wrap">
            {row?.images.map((image, index) => <Attachment key={image.id || index}
              source={assetUrl(image.file)} label={`Image ${index + 1}`} remove={() => setConfirm(true)} />)}
            {files.map(({ name, url }) => <Attachment key={url} source={url} label={name} remove={() => {
              URL.revokeObjectURL(url);
              objectURLs.current.delete(url);
              setFiles((previous) => previous.filter((file) => file.url !== url));
            }} />)}
          </div>
        </div>
        <div className="text-end"><button type="submit" className="btn btn-sm btn-primary px-4 mt-3" disabled>
          {circularID ? "Update" : "Save"}
        </button></div>
      </form>}
      {confirm && <CircularDeleteDialog item="this image" close={() => setConfirm(false)} />}
    </div></div>
  </div></div>;
}
