import type { Metadata, Viewport } from "next";
import { THEME_BOOT_SCRIPT } from "../theme-preference";
import "../brand-font.css";
import "lenis/dist/lenis.css";
import "./chrome.css";
import "./home.css";
import "../type-spacing.css";
import "./experience.css";

// Brand typography is self-hosted and shared with the interior pages.

export const metadata: Metadata = {
  metadataBase: new URL("https://technoai.ae"),
  alternates: { canonical: "https://technoai.ae/" },
  title: "TechnoAi Technology, AI and Procurement Company in UAE - TechnoAi",
  description:
    "Advanced technology solutions for mission critical operations: drones, robotics, satellite connectivity, AI hardware and security systems.",
  icons: {
    icon: [
      { url: "/wp-content/uploads/2026/02/icon-logo-512px-100x100.png", sizes: "32x32" },
      { url: "/wp-content/uploads/2026/02/icon-logo-512px-300x300.png", sizes: "192x192" },
    ],
  },
};

// Runs before first paint: marks JS as on, and keeps the page-transition curtain up when we arrive
// from another page of the site (motion.tsx then lifts it). Same snippet in app/theme-document.ts.
const ARRIVE_SCRIPT =
  "var d=document.documentElement;d.classList.add('js');try{if(sessionStorage.getItem('tai-px')==='1')d.classList.add('arriving')}catch(e){}";

export const viewport: Viewport = { themeColor: "#030505", colorScheme: "dark" };

export default function RedesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: ARRIVE_SCRIPT }} />
      </head>
      <body className="inner-site">{children}</body>
    </html>
  );
}
