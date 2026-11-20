"use client";

import { useEffect, useId, useRef, useState } from "react";
import { sourcingRequest, type SourcingCategory, type SourcingItem, type SourcingOption } from "@/lib/sourcingInterest";
import modalStyles from "../admin/product-keywords.module.css";
import styles from "./sourcing-interest.module.css";

function searchText(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function SourcingModal({ close }: { close: () => void }) {
  const title = useId();
  const choices = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const allCheckbox = useRef<HTMLInputElement>(null);
  const savingRequest = useRef<AbortController | null>(null);
  const [categories, setCategories] = useState<SourcingCategory[]>();
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [categorySearch, setCategorySearch] = useState("");
  const [optionSearch, setOptionSearch] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [selected, setSelected] = useState<SourcingItem>();
  const [data, setData] = useState<{ id: number; attempt: number; options?: SourcingOption[]; error?: string }>();
  const [attempt, setAttempt] = useState(0);
  const [treeAttempt, setTreeAttempt] = useState(0);
  const [treeError, setTreeError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const id = selected?.id;
  const current = data?.id === id && data?.attempt === attempt ? data : undefined;
  const items = current?.options ?? [];
  const checked = items.filter((item) => item.checked).length;

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
    return () => savingRequest.current?.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void sourcingRequest<{ categories: SourcingCategory[] }>(controller.signal).then(({ categories }) => {
      if (!controller.signal.aborted) setCategories(categories);
    }).catch((error: Error) => {
      if (!controller.signal.aborted) setTreeError(error.message);
    });
    return () => controller.abort();
  }, [treeAttempt]);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    void sourcingRequest<{ options: SourcingOption[] }>(controller.signal, id).then(({ options }) => {
      if (!controller.signal.aborted) {
        setData({ id, attempt, options });
        setCounts((old) => ({ ...old, [id]: options.filter((item) => item.checked).length }));
      }
    }).catch((error: Error) => {
      if (!controller.signal.aborted) setData({ id, attempt, error: error.message });
    });
    return () => controller.abort();
  }, [id, attempt]);

  useEffect(() => {
    if (allCheckbox.current) allCheckbox.current.indeterminate = checked > 0 && checked < items.length;
  }, [checked, items.length]);

  async function save(ids: number[], action: "add" | "remove") {
    if (!id || !ids.length || savingRequest.current || !current?.options) return;
    const controller = new AbortController();
    savingRequest.current = controller;
    setSaving(true);
    setSaveError("");
    setFeedback("");
    try {
      const { options, saved, message } = await sourcingRequest<{ options: SourcingOption[]; saved: boolean; message?: string }>(
        controller.signal, undefined, { categoryId: id, ids, action },
      );
      if (controller.signal.aborted) return;
      setData({ id, attempt, options });
      setCounts((old) => ({ ...old, [id]: options.filter((item) => item.checked).length }));
      if (saved) setFeedback("Sourcing interest saved.");
      else setSaveError(message || "The requested selection was not saved.");
    } catch (error) {
      if (!controller.signal.aborted) {
        setSaveError(error instanceof Error ? error.message : "Save could not be confirmed.");
        setAttempt((value) => value + 1);
      }
    } finally {
      savingRequest.current = null;
      if (!controller.signal.aborted) setSaving(false);
    }
  }

  const term = searchText(categorySearch);
  const matching = categories?.map((category) => ({
    ...category,
    groups: category.groups.map((group) => ({
      ...group,
      categories: group.categories.filter((item) =>
        (!selectedOnly || (counts[item.id] ?? item.count) > 0) &&
        [category.name, group.name, item.name].some((name) => searchText(name).includes(term))),
    })).filter((group) => group.categories.length),
  })).filter((category) => category.groups.length);
  const visibleOptions = items.filter((item) => searchText(item.name).includes(searchText(optionSearch)));

  return <dialog ref={dialog} className={`modal show ${modalStyles.dialog}`} aria-labelledby={title}
    onClose={close} onCancel={(event) => { if (savingRequest.current) event.preventDefault(); }}>
    <div className={`modal-dialog modal-lg ${styles.dialog}`}><div className="modal-content p-2">
      <div className="modal-header">
        <h4 className="modal-title" id={title}>Sourcing Interest</h4>
        <button type="button" className="btn-close" aria-label="Close" disabled={saving} onClick={() => dialog.current?.close()} />
      </div>
      <div className="modal-body">
        <div className="row">
          <div className={`col-12 col-lg-9 ${styles.categories}`}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h6 className="mb-0">Category</h6>
              <select className="form-select form-select-sm w-auto" aria-label="Filter sourcing categories" value={selectedOnly ? "selected" : "all"}
                onChange={(event) => setSelectedOnly(event.target.value === "selected")}>
                <option value="all">Show All</option><option value="selected">Show Categories With Count</option>
              </select>
            </div>
            <input type="search" className="form-control mb-3" aria-label="Search category"
              placeholder="Search category..." value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} />
            <div className={styles.scroll}>
              {treeError ? <div role="alert"><p>{treeError}</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setTreeError(""); setTreeAttempt((value) => value + 1); }}>Retry</button></div> :
                !matching ? <p role="status">Loading categories…</p> :
                matching.length === 0 ? <p className="text-muted">No categories match your filters.</p> :
                matching.map((category) => <div className="card shadow-sm border mb-3" key={category.id}>
                  <div className="card-header bg-primary text-white"><h5 className="mb-0">{category.name}</h5></div>
                  <div className="card-body">{category.groups.map((group) => <div className="card mb-3 border" key={group.id}>
                    <div className="card-header bg-light"><h6 className="mb-0">{group.name}</h6></div>
                    <div className="card-body"><div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                      {group.categories.map((item) => <div className="col" key={item.id}>
                        <label className="form-check">
                          <input type="radio" className="form-check-input" name={choices} checked={id === item.id} disabled={saving}
                            onChange={() => { setSelected(item); setOptionSearch(""); setFeedback(""); setSaveError(""); }} />
                          <span className="form-check-label">{item.name}</span>
                          {(counts[item.id] ?? item.count) > 0 && <span className="badge bg-success ms-2">{counts[item.id] ?? item.count}</span>}
                        </label>
                      </div>)}
                    </div></div>
                  </div>)}</div>
                </div>)}
            </div>
          </div>
          <div className={`col-12 col-lg-3 ${styles.options}`}>
            <div className={`p-2 ${styles.scroll}`} aria-busy={Boolean(id && (!current || saving))}>
              <h6 className="mb-3 mt-2">Please Select The Type</h6>
              {!selected && <p className="text-muted">Please select a type to see categories</p>}
              {selected && <p className="fw-semibold mb-2">{selected.name}</p>}
              {saveError && <p className="text-danger mb-2" role="alert">{saveError}</p>}
              {id && !current && <p role="status">Loading selections…</p>}
              {current?.error && <div role="alert"><p>{current.error}</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAttempt((value) => value + 1)}>Retry</button></div>}
              {current?.options && items.length === 0 && <p className="text-muted">No types available.</p>}
              {items.length > 0 && <>
                <input type="search" className="form-control mb-2" aria-label="Search sub-category" placeholder="Search sub-category..."
                  value={optionSearch} onChange={(event) => setOptionSearch(event.target.value)} />
                <label className="d-flex align-items-center mb-3 bg-primary p-2 rounded text-white">
                  <input ref={allCheckbox} type="checkbox" className="me-2" disabled={saving} checked={checked === items.length}
                    onChange={(event) => {
                      const select = event.target.checked;
                      void save(items.filter((item) => item.checked !== select).map((item) => item.id), select ? "add" : "remove");
                    }} />
                  Check All
                </label>
                {visibleOptions.length === 0 && <p className="text-muted">No types match your search.</p>}
                {visibleOptions.map((item) => <label className="d-flex align-items-start border p-2 rounded bg-white mb-3" key={item.id}>
                  <input type="checkbox" className="me-2 mt-1" checked={item.checked} disabled={saving}
                    onChange={() => { void save([item.id], item.checked ? "remove" : "add"); }} />
                  {item.name}
                </label>)}
              </>}
              <p className="small mb-0" role="status">{saving ? "Saving…" : feedback}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => dialog.current?.close()}>Close</button>
      </div>
    </div></div>
  </dialog>;
}

export default function SourcingInterest() {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="btn btn-outline-primary" aria-haspopup="dialog" onClick={() => setOpen(true)}>Sourcing Interest</button>
    {open && <SourcingModal close={() => setOpen(false)} />}
  </>;
}
