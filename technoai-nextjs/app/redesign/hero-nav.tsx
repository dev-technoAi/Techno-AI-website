"use client";

import { useEffect, useRef, useState } from "react";
import { NAV, MENU_NAV, SOLUTION_LINKS, OFFICES, SOCIAL } from "../chrome";
import { MENU_ICONS } from "./menu-data";
import "./theme.css";
import "./landing-menu.css";
import "../shared-header.css";

/** Imported site's navigation, isolated from the landing page's hero styles. */
export default function HeroNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 12);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    const lenis = (window as Window & { lenis?: { stop: () => void; start: () => void } }).lenis;
    root.style.overflow = "hidden";
    lenis?.stop();
    const raf = requestAnimationFrame(() => dialog.current?.querySelector<HTMLAnchorElement>("nav a")?.focus());
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
      if (event.key !== "Tab") return;
      const targets = Array.from(dialog.current?.querySelectorAll<HTMLElement>('a[href],button') ?? []).filter(el => el.getClientRects().length);
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      cancelAnimationFrame(raf);
      root.style.overflow = previousOverflow;
      lenis?.start();
      document.removeEventListener("keydown", keydown);
      previousFocus?.focus({ preventScroll: true });
    };
  }, [open]);

  return <>
    <header className={`tai-header${scrolled ? " is-scrolled" : ""}`} inert={open}>
      <div className="tai-header-bar">
        <a className="tai-brand" href="/" aria-label="Techno AI home">
          <span className="tai-logo" aria-hidden="true" />
        </a>
        <nav className="tai-links tai-direct-links" aria-label="Main">
          {NAV.map(([label, href]) => <a className="tai-link" key={href} href={href}><span className="tai-link-label"><span data-t={label}>{label}</span></span></a>)}
        </nav>
        <button ref={trigger} className="tai-burger" type="button" aria-label="Open menu" aria-expanded={open} aria-controls="landing-site-menu" onClick={() => setOpen(true)}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="m9 15c0-.5523.44772-1 1-1h6c.5523 0 1 .4477 1 1s-.4477 1-1 1h-6c-.55228 0-1-.4477-1-1zm-6-10c0-.55229.44771-1 1-1h12c.5523 0 1 .44771 1 1 0 .55228-.4477 1-1 1h-12c-.55229 0-1-.44772-1-1zm0 5c0-.55228.44771-1 1-1h12c.5523 0 1 .44772 1 1 0 .5523-.4477 1-1 1h-12c-.55229 0-1-.4477-1-1z" /></svg>
        </button>
      </div>
    </header>
    {open && <div ref={dialog} className="im-overlay" id="landing-site-menu" role="dialog" aria-modal="true" aria-label="Site menu">
      <div className="im-overlay-head"><a className="im-logo" href="/" aria-label="TechnoAI home"><img src="/wp-content/uploads/2026/07/Logo.svg" width="92" height="44" alt="TechnoAI" /></a>
        <button className="im-toggle im-close" aria-label="Close menu" onClick={() => setOpen(false)}><span>Close</span><span className="im-toggle-icon" aria-hidden="true"><i /><i /></span></button>
      </div>
      <div className="im-menu-in">
        <nav className="im-menu-nav" aria-label="Menu"><p className="im-kicker">Explore TechnoAI</p>{MENU_NAV.map(([label, href], i) => <a key={href} href={href} onClick={() => setOpen(false)} style={{ ["--d" as string]: i }}>
          <span className="im-number">{String(i + 1).padStart(2, "0")}</span><span className="im-menu-text">{label}</span>
        </a>)}</nav>
        <div className="im-side">
          <div className="im-solutions"><h2>Solutions</h2>{SOLUTION_LINKS.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>
            <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: MENU_ICONS.find(icon => icon.href === href)?.svg ?? "" }} /><span>{label}</span>
          </a>)}</div>
          <div className="im-offices"><h2>Offices</h2>{OFFICES.map(([name, place]) => <p key={name}><strong>{name}</strong>{place}</p>)}<span className="im-stacked"><img src="/brand/techno-ai-stacked.png" alt="TechnoAI" width="794" height="890" /></span></div>
          <nav className="im-social" aria-label="Social media">{SOCIAL.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label}</a>)}</nav>
        </div>
      </div>
    </div>}
  </>;
}
