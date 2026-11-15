import type { Metadata } from "next";
import "../brand-font.css";
import "../redesign/redesign.css";

// Brand typography is self-hosted and shared with the interior pages.

export const metadata: Metadata = {
  title: "TechnoAi Technology, AI and Procurement Company in UAE - TechnoAi",
  description:
    "Advanced technology solutions for mission critical operations: drones, robotics, satellite connectivity, AI hardware and security systems.",
};

export default function RedesignV1Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
