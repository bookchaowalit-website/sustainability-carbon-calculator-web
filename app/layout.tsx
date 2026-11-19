import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// The font variable sits on <html>: the App shell tokens live on :root and read it from there.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Carbon Tally | Activity ledger | Bookchaowalit",
  description: "A small activity ledger for a demonstrative carbon estimate: add a line, see which everyday inputs make up the total. Not audited.",
  authors: [{ name: "Bookchaowalit", url: "https://bookchaowalit.com" }],
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", siteName: "Bookchaowalit", title: "Carbon Tally | Activity ledger", description: "A demonstrative carbon estimate you build line by line. Not audited." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={geistSans.variable}><body>{children}</body></html>;
}
