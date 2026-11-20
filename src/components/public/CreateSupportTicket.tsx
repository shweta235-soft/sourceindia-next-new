"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { displayText } from "@/lib/userDashboard";
import SupportPortal from "./SupportPortal";

export default function CreateSupportTicket() {
  const { user } = useAuth();
  const [enteredEmail, setEnteredEmail] = useState<string>();
  const [step, setStep] = useState<"email" | "otp" | "ticket">("email");
  const email = enteredEmail ?? displayText(user?.email);

  return <SupportPortal><div className="card shadow-sm border-0"><div className="card-body p-4">
    {step !== "ticket" ? <>
      <h2 className="h5 mb-3">Enter your Email</h2>
      <form onSubmit={(event) => event.preventDefault()}>
        <div className="row py-2"><div className="col-md-4 mb-3">
          <label className="form-label" htmlFor="support-email">Email <sup className="text-danger">*</sup></label>
          <input id="support-email" type="email" className="form-control" placeholder="Enter Email"
            value={email} onChange={(event) => setEnteredEmail(event.target.value)} required />
        </div></div>
        {step === "otp" && <div className="row py-2"><div className="col-md-4 mb-3">
          <label className="form-label" htmlFor="support-otp">Enter OTP <sup className="text-danger">*</sup></label>
          <input id="support-otp" className="form-control" placeholder="Enter OTP" inputMode="numeric" maxLength={4} required />
        </div></div>}
        <div className="mt-3 d-flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary px-4" disabled>{step === "email" ? "Send OTP" : "Verify OTP"}</button>
          <Link href="/get-support" className="btn btn-secondary">Back</Link>
          <button type="button" className="btn btn-link" onClick={() => setStep(step === "email" ? "otp" : "ticket")}>
            {step === "email" ? "Preview OTP step" : "Preview ticket form"}
          </button>
        </div>
      </form>
    </> : <>
      <h2 className="h5 mb-3">Create Ticket</h2>
      <form onSubmit={(event) => event.preventDefault()}>
        <div className="row">
          <div className="col-md-4 mb-3"><label className="form-label" htmlFor="ticket-first">First Name*</label>
            <input id="ticket-first" name="first_name" className="form-control" autoComplete="given-name" defaultValue={displayText(user?.fname)} required /></div>
          <div className="col-md-4 mb-3"><label className="form-label" htmlFor="ticket-last">Last Name*</label>
            <input id="ticket-last" name="last_name" className="form-control" autoComplete="family-name" defaultValue={displayText(user?.lname)} required /></div>
          <div className="col-md-4 mb-3"><label className="form-label" htmlFor="ticket-phone">Phone Number*</label>
            <input id="ticket-phone" name="phone" type="tel" className="form-control" autoComplete="tel" defaultValue={displayText(user?.mobile)} required /></div>
          <div className="col-md-6 mb-3"><label className="form-label" htmlFor="ticket-title">Title*</label>
            <input id="ticket-title" name="title" className="form-control" required /></div>
          <div className="col-md-6 mb-3"><label className="form-label" htmlFor="ticket-email">Email*</label>
            <input id="ticket-email" className="form-control" type="email" value={email} readOnly /></div>
          <div className="col-12 mb-3"><label className="form-label" htmlFor="ticket-message">Message*</label>
            <textarea id="ticket-message" name="message" className="form-control" rows={6} required /></div>
          <div className="col-12 mb-3"><label className="form-label" htmlFor="ticket-attachment">Attachment</label>
            <input id="ticket-attachment" name="attachment" type="file" className="form-control" /></div>
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled>Submit Ticket</button>
          <button type="button" className="btn btn-secondary" onClick={() => setStep("otp")}>Back</button>
        </div>
      </form>
    </>}
  </div></div></SupportPortal>;
}
