"use client";

import { useEffect, useId, useRef } from "react";
import styles from "./product-keywords.module.css";

export default function EmailSourceDialog({ html, apply, close }: {
  html: string; apply: (html: string) => void; close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLTextAreaElement>(null);
  const titleID = useId();

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return <dialog ref={dialog} className={`modal show ${styles.dialog}`} aria-labelledby={titleID} onClose={close}
    onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content">
      <div className="modal-header">
        <h5 id={titleID} className="modal-title">Message Source</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={() => dialog.current?.close()} />
      </div>
      <div className="modal-body">
        <textarea className="form-control font-monospace" style={{ height: "60vh" }}
          ref={content} defaultValue={html} aria-label="Message HTML" autoFocus />
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => dialog.current?.close()}>Cancel</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => {
          if (content.current) apply(content.current.value);
          dialog.current?.close();
        }}>Save</button>
      </div>
    </div></div>
  </dialog>;
}
