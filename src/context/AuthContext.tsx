"use client";

import { createContext, useContext, useEffect, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { apiFetch } from "@/lib/api";

export type User = {
  fname?: string;
  lname?: string;
  file?: { file?: string };
  company_info?: { organization_name?: string; [key: string]: unknown };
  [key: string]: unknown;
};
type AuthState = {
  isLoggedIn: boolean;
  user: User | null;
  loadingUser: boolean;
  login: (token: string) => void;
  logout: () => void;
  setUser: Dispatch<SetStateAction<User | null>>;
};
const Context = createContext<AuthState>({
  isLoggedIn: false, user: null, loadingUser: true, login: () => {}, logout: () => {}, setUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>();
  const [user, setUser] = useState<User | null>(null);
  const [checkedToken, setCheckedToken] = useState<string | null>();

  useEffect(() => {
    const stored = localStorage.getItem("user_token");
    setToken(stored);
  }, []);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    apiFetch<{ user: User }>("/signup/profile", {
      headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
    }).then((data) => {
      if (!controller.signal.aborted) setUser(data.user ?? null);
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      if (error instanceof Error && /^API (401|403):/.test(error.message)) {
        localStorage.removeItem("user_token");
        setToken(null);
        setUser(null);
      }
    }).finally(() => {
      if (!controller.signal.aborted) setCheckedToken(token);
    });
    return () => controller.abort();
  }, [token]);

  function login(value: string) {
    localStorage.setItem("user_token", value);
    if (value !== token) setUser(null);
    setToken(value);
  }

  function logout() {
    localStorage.removeItem("user_token");
    setToken(null);
    setCheckedToken(null);
    setUser(null);
  }

  const loadingUser = token === undefined || Boolean(token && checkedToken !== token);
  return <Context.Provider value={{ isLoggedIn: Boolean(token), user, loadingUser, login, logout, setUser }}>{children}</Context.Provider>;
}

export function useAuth() {
  return useContext(Context);
}
