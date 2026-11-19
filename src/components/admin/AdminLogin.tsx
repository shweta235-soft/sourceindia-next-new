"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./admin-login.module.css";

const rememberedEmailKey = "si_admin_remembered_email";
const rememberDuration = 7 * 24 * 60 * 60 * 1000;

export default function AdminLogin({ returnTo }: { returnTo: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(rememberedEmailKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved?.email === "string" && saved.expires > Date.now()) {
        setEmail(saved.email);
        setRemember(true);
      } else {
        localStorage.removeItem(rememberedEmailKey);
      }
    } catch {}
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setMessage("");
    const loginEmail = email.trim();
    const nextErrors = {
      email: !loginEmail ? "Email is required" : !/^\S+@\S+\.\S+$/.test(loginEmail) ? "Invalid email format" : undefined,
      password: !password.trim() ? "Password is required" : undefined,
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password, returnTo }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message || "Login failed. Please try again.");
        setSubmitting(false);
        return;
      }

      try {
        if (remember) localStorage.setItem(rememberedEmailKey, JSON.stringify({ email: loginEmail, expires: Date.now() + rememberDuration }));
        else localStorage.removeItem(rememberedEmailKey);
      } catch {}
      window.location.replace(data.destination);
    } catch {
      setMessage("Server error. Please try again later.");
      setSubmitting(false);
    }
  }

  return (
    <div className={`${styles.background} d-flex align-items-center justify-content-center`}>
      <div className="container-fluid">
        <div className="row row-cols-1 row-cols-lg-2 row-cols-xl-3">
          <div className="col mx-auto">
            <div className={`card ${styles.card} mt-5 mt-lg-0`}>
              <div className="card-body">
                <div className="border p-4 rounded">
                  <div className="text-center"><h3>Log In</h3></div>
                  <form className="row g-3" onSubmit={signIn} noValidate>
                    <div className="col-12">
                      <label className={`form-label ${styles.required}`} htmlFor="inputEmailAddress">Email Address</label>
                      <input type="email" id="inputEmailAddress" autoComplete="username" placeholder="Email Address"
                        value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required
                        className={`form-control ${errors.email ? "border-danger" : ""}`}
                        aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "admin-email-error" : undefined} />
                      {errors.email && <div id="admin-email-error" className="text-danger small">{errors.email}</div>}
                    </div>
                    <div className="col-12">
                      <label className={`form-label ${styles.required}`} htmlFor="inputChoosePassword">Enter Password</label>
                      <div className="input-group">
                        <input type={showPassword ? "text" : "password"} id="inputChoosePassword"
                          autoComplete="current-password" placeholder="Enter Password"
                          value={password} onChange={(event) => setPassword(event.target.value)} maxLength={1024} required
                          className={`form-control border-end-0 ${errors.password ? "border-danger" : ""}`}
                          aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "admin-password-error" : undefined} />
                        <button type="button" className={`input-group-text bg-transparent ${errors.password ? "border-danger" : ""}`}
                          aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
                          <i className={`bx ${showPassword ? "bx-show" : "bx-hide"}`} aria-hidden="true" />
                        </button>
                      </div>
                      {errors.password && <div id="admin-password-error" className="text-danger small">{errors.password}</div>}
                    </div>
                    <div className="col-md-6">
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" id="admin-remember"
                          checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                        <label className="form-check-label" htmlFor="admin-remember">Remember Me</label>
                      </div>
                    </div>
                    {message && <div className="col-12 text-danger small" role="alert">{message}</div>}
                    <div className="col-12 d-grid">
                      <button type="submit" className={`btn btn-primary btn-sm ${styles.signIn}`} disabled={submitting}>
                        <i className="bx bxs-lock-open" aria-hidden="true" /> {submitting ? "Signing in…" : "Sign in"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
