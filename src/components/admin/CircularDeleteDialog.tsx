"use client";

import { useEffect, useId, useRef } from "react";
import modalStyles from "./product-keywords.module.css";

export default function CircularDeleteDialog({ item, bulk = false, close }: { item: string; bulk?: boolean; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleID = useId();
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return <dialog ref={dialog} className={`modal show ${modalStyles.dialog}`} aria-labelledby={titleID} onClose={close}
    onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <div className="modal-dialog"><div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title" id={titleID}>Confirm {bulk ? "Bulk Deletion" : "Deletion"}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={() => dialog.current?.close()} />
      </div>
      <div className="modal-body">Are you sure you want to delete {item}?</div>
      <div className="modal-footer justify-content-between">
        <button className="btn btn-secondary btn-sm" type="button" onClick={() => dialog.current?.close()}>Cancel</button>
        <button className="btn btn-danger" type="button" disabled>{bulk ? "Delete Selected" : "Delete"}</button>
      </div>
    </div></div>
  </dialog>;
}
