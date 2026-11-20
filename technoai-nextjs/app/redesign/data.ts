// Content of the new home page. All text and links are taken from the current technoai.ae home page.

export const UP = "/wp-content/uploads";

export const NAV = [
  ["Solutions", "#solutions"],
  ["Hardware", "/all-products/"],
  ["Industries", "#industries"],
  ["Services", "/services/"],
] as const;

/** slug = name of the 3D model slot (public/redesign/models/<slug>.glb replaces the placeholder). */
export const SOLUTIONS = [
  { slug: "drone", title: "Aerial & Drone", text: "From deployment to data capture for inspection, monitoring, and security.", href: "/aerial-drone-solutions/" },
  { slug: "robot", title: "AI & Robotics", text: "Automation that actually fits into day to day operations.", href: "/ai-robotics/" },
  { slug: "industry", title: "Industrial & Infrastructure", text: "Systems built for continuous operation in demanding environments.", href: "/industrial-smart-infrastructure/" },
  { slug: "satellite", title: "Connectivity & Satellite", text: "Reliable communication where traditional networks do not work.", href: "/connectivity-satellite-systems/" },
  { slug: "security", title: "Security Systems", text: "Detection, monitoring, and response for critical sites and assets.", href: "/security-mission-critical-systems/" },
  { slug: "financial", title: "Financial & Transaction", text: "Structure deals, manage procurement, and keep projects financially controlled.", href: "/financial-transaction-solutions/" },
];

export const DOMAINS = [
  ["AI & Robotics", "Autonomous robots, AI-powered systems, automation tools, and smart operational support."],
  ["AI Hardware", "Advanced computing hardware, edge AI systems, NVIDIA platforms, and embedded intelligence."],
  ["Satellite Communication", "Connectivity solutions for remote sites, field operations, maritime, and critical communication."],
  ["Security & Monitoring", "Detection, surveillance, monitoring, and protection systems for critical assets and locations."],
  ["Drones & UAV Systems", "Aerial platforms for inspection, mapping, surveillance, monitoring, and mission support."],
] as const;

export const INDUSTRIES = [
  ["Government & Public Sector", "Systems aligned with national scale operations", "/government-public-sector/"],
  ["Defense & Security", "Built for high-risk and mission-critical environments", "/defense-security/"],
  ["Agriculture", "Monitoring, automation, and field intelligence", "/agriculture/"],
  ["Energy & Infrastructure", "Inspection, control, and long-term system reliability.", "/energy-infrastructure/"],
  ["Logistics & Mobility", "Tracking, coordination, and operational visibility", "/logistics-mobility/"],
  ["Research & Development", "Flexible platforms for testing and innovation", "/research-and-development/"],
] as const;

export const PARTNERS = [
  ["DJI Enterprise", "2025/10/DJI-Enterprise.png"],
  ["Seeed Studio", "2025/10/Seeed-Studio.png"],
  ["Holybro", "2026/03/Holybro.png"],
  ["Amtech", "2026/03/amtech-logo-bg.png"],
  ["Keenon Robotics", "2025/10/Keenon.png"],
  ["Thuraya", "2025/10/thuraya-.png"],
  ["Ingram Micro", "2026/03/Ingram-Partner-logo.png"],
  ["Etihad", "2026/07/Etihad@72x.png"],
  ["Emirates", "2026/07/Emirates@72x.png"],
  ["dnata", "2026/07/Dnata@72x.png"],
  ["AD Ports", "2026/07/AD-Port@72x.png"],
] as const;

/** lat / lon used by the globe. */
export const OFFICES = [
  { name: "Headquarters", city: "Abu Dhabi", country: "United Arab Emirates", place: "Abu Dhabi, United Arab Emirates", lat: 24.45, lon: 54.38 },
  { name: "Europe Innovation Hub", city: "Prague", country: "Czech Republic", place: "Prague - Czech Republic", lat: 50.08, lon: 14.44 },
  { name: "Asia Innovation Hub", city: "Lahore", country: "Pakistan", place: "Lahore - Pakistan", lat: 31.55, lon: 74.34 },
];

export const FOOTER = [
  ["Solutions", [
    ["Financial", "/financial-transaction-solutions/"],
    ["Aerial & Drones", "/aerial-drone-solutions/"],
    ["AI & Robotics", "/ai-robotics/"],
    ["Connectivity", "/connectivity-satellite-systems/"],
    ["Smart Infrastructure", "/industrial-smart-infrastructure/"],
    ["Security", "/security-mission-critical-systems/"],
  ]],
  ["Industries", [
    ["Gov & Public", "/government-public-sector/"],
    ["Agriculture", "/agriculture/"],
    ["Energy", "/energy-infrastructure/"],
    ["Logistics", "/logistics-mobility/"],
    ["R&D", "/research-and-development/"],
  ]],
  ["Services", [
    ["Procurement", "/procurement/"],
    ["Integration", "/integration/"],
    ["Project Management", "/project-management/"],
    ["Technical Support", "/technical-support/"],
  ]],
  ["Company", [
    ["Products", "/all-products/"],
    ["Partners", "/partners/"],
    ["Insights", "/insights/"],
  ]],
] as const;

export const SOCIAL = [
  ["Instagram", "https://www.instagram.com/technoai.ae/"],
  ["Facebook", "https://www.facebook.com/share/1GxWMW32L1/?mibextid=wwXIfr"],
  ["LinkedIn", "https://www.linkedin.com/company/technoai/"],
  ["TikTok", "https://www.tiktok.com/@technoai.ae"],
] as const;

/** Drone film (scroll-driven frames) used in the "closer look" section. */
export const DRONE_FILM = {
  frames: 97,
  dir: "/redesign/hero",
  poster: "/redesign/hero-drone.jpg",
  video: "/redesign/hero-loop.mp4",
};
