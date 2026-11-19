"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./admin-legal-page.module.css";

export default function LegalDescriptionEditor({ description }: { description: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!host.current) return;
    const container = document.createElement("div");
    const source = document.createElement("div");
    container.appendChild(source);
    host.current.appendChild(container);
    let cancelled = false;
    let dispose: (() => void) | undefined;

    void import("@ckeditor/ckeditor5-build-classic").then(async ({ default: ClassicEditor }) => {
      if (cancelled) return;
      const editor = await ClassicEditor.create(source, { initialData: description, label: "Description" });
      dispose = () => { void editor.destroy().catch(() => {}).finally(() => container.remove()); };
      if (cancelled) dispose();
      else setStatus("ready");
    }).catch(() => {
      container.remove();
      if (!cancelled) setStatus("failed");
    });

    return () => {
      cancelled = true;
      if (dispose) dispose();
      else container.remove();
    };
  }, [attempt, description]);

  return <>
    <div className="form-label" id="legal-description-label">Description</div>
    <div className={styles.editor} role="group" aria-labelledby="legal-description-label" aria-busy={status === "loading"}>
      <div ref={host} />
      {status === "loading" && <p role="status" className="small mt-2 mb-0">Loading editor...</p>}
      {status === "failed" && <p role="alert" className="mb-0">
        Description editor could not be loaded. <button type="button" className="btn btn-sm btn-link" onClick={() => {
          setStatus("loading");
          setAttempt((previous) => previous + 1);
        }}>Retry</button>
      </p>}
    </div>
  </>;
}
