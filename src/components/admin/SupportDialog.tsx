"use client";

import { useEffect, useId, useRef } from "react";
import styles from "./product-keywords.module.css";

export type SupportAction = "Delete" | "Delete Selected" | "Change Status" | "Resolve" | "Cancel";

export default function SupportDialog({ action, close }: { action: SupportAction; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const deleting = action === "Delete" || action === "Delete Selected";
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return <dialog ref={dialog} className={`modal show ${styles.dialog}`} aria-labelledby={title} onClose={close}
    onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 id={title} className="modal-title">{deleting ? "Confirm Deletion" : "Confirm Status Change"}</h5>
          <button type="button" className="btn-close" aria-label="Close" onClick={() => dialog.current?.close()} />
        </div>
        <div className="modal-body">
          Are you sure you want to {action.toLowerCase()}{action === "Delete Selected" ? " categories" : ""}?
          <p className="text-muted small mb-0 mt-2">This action is available as a preview.</p>
        </div>
        <div className="modal-footer justify-content-between">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => dialog.current?.close()}>Cancel</button>
          <button type="button" className={`btn btn-sm ${deleting ? "btn-danger" : "btn-warning"}`} disabled>
            {deleting ? "Delete" : "Yes"}
          </button>
        </div>
      </div>
    </div>
  </dialog>;
}
