"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { readBuyerInterests, type BuyerInterestGroup } from "@/lib/sourcingInterest";

function InterestForm() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ attempt: number; groups?: BuyerInterestGroup[]; error?: string }>();

  useEffect(() => {
    const controller = new AbortController();
    void readBuyerInterests(controller.signal)
      .then(({ groups }) => {
        if (!controller.signal.aborted) setResult({ attempt, groups });
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setResult({ attempt, error: error.message });
      });
    return () => controller.abort();
  }, [attempt]);

  const current = result?.attempt === attempt ? result : undefined;

  return <div className="container"><div className="card mb-4"><div className="card-body">
    <h1 className="h4">Buyer Sourcing Interest</h1>
    {!current && <p role="status">Loading sourcing interests…</p>}
    {current?.error && <p className="text-danger" role="alert">
      {current.error} <button className="btn btn-link btn-sm" type="button" onClick={() => setAttempt((n) => n + 1)}>Retry</button>
    </p>}
    {current?.groups && <form onSubmit={(event) => event.preventDefault()}>
      <div className="row mt-3 gy-3">
        {current.groups.map((group) => <fieldset className="col-md-4" key={group.id}>
          <legend className="h6 text-uppercase">{group.name}</legend>
          {group.options.length ? group.options.map((item) => <div className="d-flex align-items-center gap-1" key={item.id}>
            <input type="checkbox" id={`interest-${group.id}-${item.id}`} defaultChecked={item.checked} />
            <label htmlFor={`interest-${group.id}-${item.id}`}>{item.name}</label>
          </div>) : <p>No subcategories available</p>}
        </fieldset>)}
      </div>
      {current.groups.length === 0 ? <p>No sourcing interests available.</p>
        : <button className="btn btn-primary mt-3" type="submit" disabled>Submit</button>}
      <Link href="/dashboard" className="btn btn-link mt-3">Back to Dashboard</Link>
    </form>}
  </div></div></div>;
}

export default function BuyerSourcingInterest() {
  const { user } = useAuth();
  return <InterestForm key={String(user?.id ?? "")} />;
}
