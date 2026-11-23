"use client";

import { useEffect, useRef, useState } from "react";
import type ClassicEditor from "@ckeditor/ckeditor5-build-classic";

/** UI-only ticket reply composer; never sends a network request. */
export default function TicketReplyDraft() {
  const host = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  type EditorWithModel = ClassicEditor & {
    model: { document: { on: (event: "change:data", callback: () => void) => void } };
  };
  const editor = useRef<EditorWithModel | null>(null);
  const [html, setHtml] = useState("");
  const [plain, setPlain] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    if (!host.current) return;
    const root = document.createElement("div");
    host.current.appendChild(root);
    let cancelled = false;
    let instance: EditorWithModel | null = null;

    // The installed CKEditor declaration requires `label` and does not list
    // `toolbar`. Passing a named object permits the runtime toolbar setting
    // without an unsafe type assertion or excess-property check.
    const editorConfig = {
      initialData: "",
      label: "Message",
      toolbar: ["heading", "|", "bold", "italic", "link", "bulletedList", "numberedList", "|", "undo", "redo"],
    };

    void import("@ckeditor/ckeditor5-build-classic")
      .then(({ default: Editor }) => Editor.create(root, editorConfig))
      .then((created) => {
        if (cancelled) { void created.destroy(); return; }
        const typedEditor = created as EditorWithModel;
        instance = typedEditor;
        editor.current = typedEditor;
        typedEditor.model.document.on("change:data", () => {
          const value = created.getData();
          setHtml(value);
          const node = document.createElement("div");
          node.innerHTML = value;
          setPlain(node.textContent?.trim() ?? "");
        });
        setStatus("ready");
      })
      .catch(() => { if (!cancelled) setStatus("fallback"); });

    return () => {
      cancelled = true;
      editor.current = null;
      if (instance) void instance.destroy().catch(() => {});
      else root.remove();
    };
  }, []);

  const clear = () => {
    editor.current?.setData("");
    setHtml("");
    setPlain("");
    setFile(null);
    if (input.current) input.current.value = "";
  };

  return <div className="card mb-4"><div className="card-body">
    <h2 className="h5 headinginfo mb-3">Add Reply</h2>
    <form onSubmit={(event) => event.preventDefault()}>
      <div className="mb-3">
        <label className="form-label" htmlFor="ticket-reply-editor">Message</label>
        <div id="ticket-reply-editor" ref={host} role="group" aria-label="Rich text reply editor" aria-busy={status === "loading"} />
        {status === "loading" && <p className="small text-secondary mt-2" role="status">Loading editor...</p>}
        {status === "fallback" && <textarea className="form-control" rows={6} aria-label="Reply message" value={plain}
          onChange={(event) => { setPlain(event.target.value); setHtml(event.target.value); }} />}
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="ticket-reply-attachment">Attachment</label>
        <input ref={input} id="ticket-reply-attachment" type="file" className="form-control"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        {file && <p className="text-secondary small mt-2 mb-0">Selected: {file.name} ({Math.ceil(file.size / 1024)} KB)</p>}
      </div>
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <button type="submit" className="btn btn-primary" disabled title="Reply submission is not enabled yet">Post</button>
        <button type="button" className="btn btn-outline-secondary" disabled={!html && !file} onClick={clear}>Clear draft</button>
      </div>
      <p className="text-secondary small mt-3 mb-0" role="status">UI preview only — your reply and attachment have not been submitted.</p>
    </form>
  </div></div>;
}
