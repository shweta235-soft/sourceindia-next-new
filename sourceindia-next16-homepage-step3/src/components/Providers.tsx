"use client";
import {AuthProvider} from "@/context/AuthContext";import {SiteSettingsProvider} from "@/context/SiteSettingsContext";import type {ReactNode} from "react";
export default function Providers({children}:{children:ReactNode}){return <AuthProvider><SiteSettingsProvider>{children}</SiteSettingsProvider></AuthProvider>}
