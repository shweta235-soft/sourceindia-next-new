"use client";

import { useEffect, useId, useState } from "react";
import Select from "react-select";
import { getUserHistoryData, userHistorySteps, userHistoryTextFilters } from "@/lib/adminUserHistory";

type Lookup = "countries" | "states" | "cities";
type Option = { id: string; name: string };
type Draft = Partial<Record<(typeof userHistoryTextFilters)[number][0] | "country" | "state" | "city" | "mail_type", string>>;
const stepOptions = userHistorySteps.map(([id, name]) => ({ id, name }));

function LocationFilter({ action, parent, label, value, change }: {
  action: Lookup; parent?: string; label: string; value: string; change: (value: string) => void;
}) {
  const [lookup, setLookup] = useState<{ parent?: string; options?: Option[]; failed?: boolean }>();
  const enabled = action === "countries" || Boolean(parent);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const params = parent ? new URLSearchParams({ parent }) : undefined;
    void getUserHistoryData<Option[]>(action, params, controller.signal).then((options) => {
      if (!controller.signal.aborted) setLookup({ parent, options });
    }).catch(() => {
      if (!controller.signal.aborted) setLookup({ parent, failed: true });
    });
    return () => controller.abort();
  }, [action, parent, enabled]);

  const loaded = lookup?.parent === parent ? lookup : undefined;
  return <HistorySelect label={label} value={value} change={change} options={enabled ? loaded?.options ?? [] : []}
    loading={enabled && !loaded} disabled={!enabled} failed={loaded?.failed} />;
}

function HistorySelect({ label, value, change, options, loading, disabled, failed, placeholder = "All" }: {
  label: string; value: string; change: (value: string) => void; options: Option[];
  loading?: boolean; disabled?: boolean; failed?: boolean; placeholder?: string;
}) {
  const id = useId();
  return <div className="col-md-3 mb-3">
    <label className="form-label" htmlFor={id}>{label}</label>
    <Select<Option> inputId={id} instanceId={id} options={options} isClearable isSearchable
      value={options.find((option) => option.id === value) ?? null}
      onChange={(option) => change(option?.id ?? "")}
      getOptionLabel={(option) => option.name} getOptionValue={(option) => option.id}
      placeholder={placeholder} isDisabled={disabled} isLoading={loading}
      styles={{ menu: (base) => ({ ...base, zIndex: 3 }) }} />
    {failed && <p role="alert" className="text-danger small mb-0">{label} options could not be loaded.</p>}
  </div>;
}

export default function UserHistoryFilters({ apply }: { apply: (filters: string) => void }) {
  const [draft, setDraft] = useState<Draft>({});
  return <form className="card mb-3" onSubmit={(event) => {
    event.preventDefault();
    apply(new URLSearchParams(Object.entries(draft).filter(([, value]) => value.trim())
      .map(([key, value]) => [key, value.trim()])).toString());
  }}>
    <div className="card-body"><div className="row">
      {userHistoryTextFilters.map(([field, label]) => <label className="col-md-3 mb-3" key={field}>
        <span className="form-label d-block">{label}</span>
        <input type="text" className="form-control" placeholder={`Enter ${label}`} value={draft[field] ?? ""}
          onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} />
      </label>)}
      <LocationFilter action="countries" label="Country" value={draft.country ?? ""}
        change={(country) => setDraft({ ...draft, country, state: "", city: "" })} />
      <LocationFilter key={`states-${draft.country ?? ""}`} action="states" parent={draft.country} label="State" value={draft.state ?? ""}
        change={(state) => setDraft({ ...draft, state, city: "" })} />
      <LocationFilter key={`cities-${draft.state ?? ""}`} action="cities" parent={draft.state} label="City" value={draft.city ?? ""}
        change={(city) => setDraft({ ...draft, city })} />
      <HistorySelect label="Steps" value={draft.mail_type ?? ""} change={(mail_type) => setDraft({ ...draft, mail_type })}
        options={stepOptions} placeholder="-- Select --" />
      <div className="col-12 d-flex justify-content-end gap-2">
        <button type="submit" className="btn btn-primary">Apply</button>
        <button type="button" className="btn btn-secondary" onClick={() => { setDraft({}); apply(""); }}>Clear</button>
      </div>
    </div></div>
  </form>;
}
