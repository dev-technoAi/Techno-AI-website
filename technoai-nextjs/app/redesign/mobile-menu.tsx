"use client";
export default function MobileMenu({ links }: { links: string[][] }) {
  return <details className="mobile-menu"><summary>Menu ＋</summary><nav aria-label="Mobile navigation" onClick={event => { if ((event.target as HTMLElement).closest("a")) event.currentTarget.closest("details")?.removeAttribute("open"); }}>{links.map(([label, href]) => <a href={href} key={label}>{label}</a>)}<a href="/request-a-quote/">Request a quote ↗</a></nav></details>;
}
