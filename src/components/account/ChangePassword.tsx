"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { changeAccountPassword, validatePasswordChange } from "@/lib/accountPassword";
import modalStyles from "../admin/product-keywords.module.css";

const fields = [
  ["oldPassword", "Old Password", "current-password"],
  ["newPassword", "New Password", "new-password"],
  ["confirmPassword", "Confirm Password", "new-password"],
] as const;

export default function ChangePassword() {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => () => activeRequest.current?.abort(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (activeRequest.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      oldPassword: String(data.get("oldPassword") ?? ""),
      newPassword: String(data.get("newPassword") ?? ""),
      confirmPassword: String(data.get("confirmPassword") ?? ""),
    };
    const problem = validatePasswordChange(values);
    setError(problem);
    if (problem) return;

    const token = localStorage.getItem("user_token");
    if (!token) {
      setError("Please sign in again.");
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;
    setBusy(true);

    try {
      await changeAccountPassword(values, token, AbortSignal.any([controller.signal, AbortSignal.timeout(40000)]));
      if (controller.signal.aborted) return;
      form.reset();
      if (localStorage.getItem("user_token") === token) setSuccess(true);
      dialog.current?.close();
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure instanceof Error && failure.name === "Error" && !(failure instanceof TypeError)
          ? failure.message : "Password change could not be confirmed. Try signing in with your new password before retrying.");
      }
    } finally {
      activeRequest.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return <>
    <button type="button" className="btn btn-link text-danger p-0" aria-haspopup="dialog" onClick={() => {
      setSuccess(false);
      dialog.current?.showModal();
    }}>Change Password <i className="bx bx-key" aria-hidden="true" /></button>
    {success && <p className="text-success mt-2 mb-0" role="status">Password changed successfully.</p>}
    <dialog ref={dialog} className={`modal show ${modalStyles.dialog}`} aria-labelledby={`${id}-title`}
      onClose={() => { formRef.current?.reset(); setError(""); }}
      onCancel={(event) => { if (activeRequest.current) event.preventDefault(); }}>
      <div className="modal-dialog modal-dialog-centered"><div className="modal-content text-start">
        <div className="modal-header">
          <h5 className="modal-title" id={`${id}-title`}>Change Password</h5>
          <button type="button" className="btn-close" aria-label="Close" disabled={busy} onClick={() => dialog.current?.close()} />
        </div>
        <div className="modal-body">
          <form ref={formRef} onSubmit={submit} aria-busy={busy} noValidate>
            {fields.map(([name, label, autoComplete]) => <div className="mb-3" key={name}>
              <label className="form-label" htmlFor={`${id}-${name}`}>{label}</label>
              <input type="password" className="form-control" name={name} id={`${id}-${name}`}
                autoComplete={autoComplete} disabled={busy} required />
            </div>)}
            {error && <p role="alert" className="text-danger">{error}</p>}
            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => dialog.current?.close()}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Changing…" : "Change Password"}</button>
            </div>
          </form>
        </div>
      </div></div>
    </dialog>
  </>;
}
