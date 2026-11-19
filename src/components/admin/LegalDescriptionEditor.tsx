"use client";

import { useEffect, useId, useRef, useState } from "react";
import type ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import EmailSourceDialog from "./EmailSourceDialog";
import styles from "./admin-legal-page.module.css";

export default function LegalDescriptionEditor({ description, label = "Description", showSource = false }: {
  description: string; label?: string; showSource?: boolean;
}) {
  const labelId = useId();
  const [html, setHTML] = useState<string>();
  const activeEditor = useRef<ClassicEditor | null>(null);
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
      const editor = await ClassicEditor.create(source, { initialData: description, label });
      dispose = () => { void editor.destroy().catch(() => {}).finally(() => container.remove()); };
      if (cancelled) {
        dispose();
        return;
      }
      activeEditor.current = editor;
      if (showSource && editor.ui.view.toolbar.element) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "ck-button ck-source-btn btn btn-sm btn-light ms-1";
        button.textContent = "Source";
        button.onclick = () => setHTML(editor.getData());
        editor.ui.view.toolbar.element.appendChild(button);
      }
      setStatus("ready");
    }).catch(() => {
      container.remove();
      if (!cancelled) setStatus("failed");
    });

    return () => {
      cancelled = true;
      activeEditor.current = null;
      if (dispose) dispose();
      else container.remove();
    };
  }, [attempt, description, label, showSource]);

  return <>
    <div className="form-label" id={labelId}>{label}</div>
    <div className={styles.editor} role="group" aria-labelledby={labelId} aria-busy={status === "loading"}>
      <div ref={host} />
      {status === "loading" && <p role="status" className="small mt-2 mb-0">Loading editor...</p>}
      {status === "failed" && <p role="alert" className="mb-0">
        {label} editor could not be loaded. <button type="button" className="btn btn-sm btn-link" onClick={() => {
          setStatus("loading");
          setAttempt((previous) => previous + 1);
        }}>Retry</button>
      </p>}
    </div>
    {html !== undefined && <EmailSourceDialog html={html} apply={(value) => activeEditor.current?.setData(value)}
      close={() => setHTML(undefined)} />}
  </>;
}
