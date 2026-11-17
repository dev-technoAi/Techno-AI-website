import type { Metadata, Viewport } from "next";
import "./brand-font.css";
import "lenis/dist/lenis.css";
import "./chrome.css";
import "./home.css";
// Must stay last: re-skins the dark home (chrome.css + home.css) to white.
import "./theme-white.css";

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

// Runs before first paint: marks JS as on, and keeps the page-transition curtain up when arriving
// from another page of the site (motion.tsx then lifts it).
const ARRIVE_SCRIPT =
  "var d=document.documentElement;d.classList.add('js');try{if(sessionStorage.getItem('tai-px')==='1')d.classList.add('arriving')}catch(e){}";

export const viewport: Viewport = { themeColor: "#ffffff", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-motion="full" data-theme="white" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ARRIVE_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
