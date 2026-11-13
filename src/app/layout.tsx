import type {Metadata} from "next";import "bootstrap/dist/css/bootstrap.min.css";import "./globals.css";import Providers from "@/components/Providers";import BootstrapClient from "@/components/layout/BootstrapClient";
export const metadata:Metadata={title:"SourceIndia",description:"B2B electronics marketplace"};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><head><link rel="icon" href="/favicon.png"/></head><body><Providers>{children}</Providers><BootstrapClient/></body></html>}
