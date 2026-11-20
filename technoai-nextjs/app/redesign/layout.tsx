import type { Metadata } from "next";
import { THEME_BOOT_SCRIPT } from "../theme-preference";
import { Noto_Sans } from "next/font/google";
import "./redesign.css";
import "./mission-white.css";
import "./three-colour.css"; // 3-colour white theme, no gradients
import "./effects.css"; // site-wide scroll reveals + hover lift/shadow (loaded last)
import "./footer.css";

// Brand typeface (TechnoAi Brand Identity): Noto Sans — Light / Regular / Medium / Bold.
const noto = Noto_Sans({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TechnoAi Technology, AI and Procurement Company in UAE - TechnoAi",
  description:
    "AI, robotics, and computing hardware for real-world operations. Explore integrated systems, edge AI, automation, and deployment support.",
};

export default function RedesignLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: "try{if(sessionStorage.getItem('tai-px')==='1')document.documentElement.classList.add('arriving')}catch(e){}" }} />
      </head>
      {/* browser extensions (e.g. Grammarly) add attributes to <body> before React loads: not a real mismatch */}
      <body className={noto.className} suppressHydrationWarning>{children}</body>
    </html>
  );
}

