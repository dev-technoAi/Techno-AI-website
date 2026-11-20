"use client";

import type Lenis from "lenis";
import { useEffect } from "react";
import PageCurtain from "../page-curtain";

/**
 * All motion of the home page in one place, driven by one requestAnimationFrame loop:
 *  - Lenis smooth scrolling (desktop wheel; touch stays native)
 *  - [data-reveal]  -> gets .in when it enters the viewport (word / fade reveals in home.css)
 *  - [data-progress] -> CSS var --p (0..1) = how far the visitor has scrolled through it
 *      .chapters: also sets data-active (which solution is shown) on the element
 *      .hscroll:  also moves its .hscroll-track sideways (--x)
 *  - custom cursor + magnetic buttons (fine pointers only)
 *  - header hides on scroll down, menu overlay
 * Content is fully visible without JS and with "reduce motion".
 */
export function Motion() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("ready");
    const reduce = root.dataset.motion !== "full" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!reduce) root.classList.add("fx");

    let disposed = false;
    let lenis: Lenis | null = null;
    if (!reduce && fine) void import("lenis").then(({ default: SmoothScroll }) => {
      if (!disposed) {
        lenis = new SmoothScroll({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true });
        (window as Window & { lenis?: Lenis }).lenis = lenis;
        if (root.style.overflow === "hidden") lenis.stop();
      }
    }).catch(() => { /* Native scroll still drives the effects if smooth scrolling fails. */ });
    const pageTransition = pageTransitions(root);

    // ---- reveals
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    // ---- scroll-progress sections
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-progress]"));
    const progress = (el: HTMLElement, r: DOMRect) => {
      const vh = window.innerHeight;
      // pinned sections: 0 when the top reaches the top of the screen, 1 when the bottom leaves.
      // others (data-progress="view"): 0 when the top is 15% above the bottom edge, 1 roughly when the block is centred.
      if (el.dataset.progress === "view") return clamp((vh * 0.85 - r.top) / (vh * 0.45 + r.height * 0.5));
      const pin = el.querySelector<HTMLElement>(".hero-pin, .ch-pin, .hs-pin, .pg-hero-pin");
      const pinnedHeight = pin?.clientHeight || vh;
      // A short screen first scrolls through oversized content, then starts the pinned effect.
      const overflow = Math.max(pinnedHeight - vh, 0);
      return clamp((-r.top - overflow) / Math.max(r.height - pinnedHeight, 1));
    };

    // Reserve enough room for the complete copy and media, including larger text and landscape phones.
    // Observe content rather than the pinned frame to avoid resize feedback loops.
    const sizeScenes = () => {
      if (disposed) return;
      const narrow = innerWidth <= 900;
      const rootStyle = getComputedStyle(root);
      const head = parseFloat(rootStyle.getPropertyValue("--head")) || 68;
      for (const section of sections) {
        if (!narrow) { section.style.removeProperty("--scene-min-height"); continue; }
        const pin = section.querySelector<HTMLElement>(".hero-pin, .ch-pin, .hs-pin, .pg-hero-pin");
        if (!pin) continue;
        const style = getComputedStyle(pin);
        const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
        const gap = parseFloat(style.rowGap) || 0;
        const height = (selector: string) => Math.max(0, ...Array.from(section.querySelectorAll<HTMLElement>(selector), el => el.scrollHeight));
        let needed = 0;
        if (section.classList.contains("chapters")) {
          needed = padding + height(".ch-head") + gap + height(".ch-copy") + Math.max(height(".ch-visual"), Math.min(180, innerWidth * 9 / 16));
        } else if (section.classList.contains("hscroll")) {
          needed = padding + height(".hs-head") + gap + height(".dom-b") + height(".dom-n") + 140;
        } else if (section.classList.contains("pg-hero")) {
          needed = padding + height(".pg-hero-body") + 24;
        } else if (section.classList.contains("hero-scroll")) {
          needed = Math.max(height(".hero-body"), height(".hero-cap")) + head + 80;
        }
        const value = `${Math.ceil(needed)}px`;
        if (section.style.getPropertyValue("--scene-min-height") !== value) section.style.setProperty("--scene-min-height", value);
      }
    };
    sizeScenes();
    const sceneResize = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
      sizeScenes();
      window.dispatchEvent(new Event("scroll"));
    }) : null;
    sections.forEach(section => section.querySelectorAll(".hero-body, .hero-cap, .ch-head, .ch-copy, .hs-head, .dom-b, .pg-hero-body").forEach(el => sceneResize?.observe(el)));
    window.addEventListener("resize", sizeScenes, { passive: true });
    document.fonts?.ready.then(() => { if (!disposed) { sizeScenes(); window.dispatchEvent(new Event("scroll")); } });

    // ---- header + menu
    const header = document.querySelector<HTMLElement>(".hx");
    const menuBtn = document.querySelector<HTMLButtonElement>(".hx-menu");
    const menu = document.getElementById("menu");
    const setMenu = (open: boolean) => {
      root.classList.toggle("menu-open", open);
      menuBtn?.setAttribute("aria-expanded", String(open));
      menu?.toggleAttribute("inert", !open);
      if (open) { lenis?.stop(); menu?.querySelector<HTMLElement>("a, button")?.focus(); }
      else { lenis?.start(); if (menu?.contains(document.activeElement)) menuBtn?.focus(); }
    };
    const onMenu = () => setMenu(!root.classList.contains("menu-open"));
    const onKey = (e: KeyboardEvent) => {
      if (!root.classList.contains("menu-open")) return;
      if (e.key === "Escape") { e.preventDefault(); setMenu(false); }
      if (e.key === "Tab") {
        const items = [menuBtn, ...Array.from(menu?.querySelectorAll<HTMLElement>("a[href], button") ?? [])].filter((el): el is HTMLElement => !!el && el.getClientRects().length > 0);
        const first = items[0], last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    const onMenuLink = (e: Event) => (e.target as HTMLElement).closest("a") && setMenu(false);
    menuBtn?.addEventListener("click", onMenu);
    menu?.addEventListener("click", onMenuLink);
    window.addEventListener("keydown", onKey);

    // ---- cursor + magnetic
    const cursor = document.querySelector<HTMLElement>(".cursor");
    const label = cursor?.querySelector<HTMLElement>(".cursor-label");
    const mouse = { x: innerWidth / 2, y: innerHeight / 2, cx: innerWidth / 2, cy: innerHeight / 2 };
    const magnets = Array.from(document.querySelectorAll<HTMLElement>("[data-magnetic]"));
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      root.classList.add("cursor-on");
      const t = (e.target as HTMLElement).closest<HTMLElement>("a, button, [data-cursor]");
      cursor?.classList.toggle("hover", !!t);
      const text = t?.dataset.cursor ?? "";
      cursor?.classList.toggle("has-label", !!text);
      if (label && label.textContent !== text) label.textContent = text;
    };
    const onLeaveDoc = () => root.classList.remove("cursor-on");
    const magMove = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
    };
    const magLeave = (e: PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "");
    if (fine && !reduce) {
      root.classList.add("has-cursor");
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeaveDoc);
      magnets.forEach((m) => {
        m.addEventListener("pointermove", magMove);
        m.addEventListener("pointerleave", magLeave);
      });
    }

    // ---- glow that follows the pointer inside [data-glow] elements
    const glowMove = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const glows = Array.from(document.querySelectorAll<HTMLElement>("[data-glow]"));
    glows.forEach((g) => g.addEventListener("pointermove", glowMove));

    // ---- [data-tilt] cards lean towards the pointer (fine pointers only); CSS reads --tx/--ty
    const tiltMove = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--tx", (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      el.style.setProperty("--ty", (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    };
    const tiltLeave = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.style.removeProperty("--tx");
      el.style.removeProperty("--ty");
    };
    const tilts = fine && !reduce ? Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]")) : [];
    tilts.forEach((el) => { el.addEventListener("pointermove", tiltMove); el.addEventListener("pointerleave", tiltLeave); });

    // ---- hero depth: film and copy drift apart a little with the pointer (CSS reads --hx/--hy)
    const depthScenes = Array.from(document.querySelectorAll<HTMLElement>(".hero-pin"));
    let depthX = 0, depthY = 0;

    // Play only the active pinned chapter; reduced-motion layouts keep flowing cards.
    const chapters = document.querySelector<HTMLElement>(".chapters");
    const films = Array.from(document.querySelectorAll<HTMLVideoElement>(".ch-panel video"));
    const panels = Array.from(document.querySelectorAll<HTMLElement>(".ch-panel"));
    const syncPanelAccess = () => {
      for (const panel of panels) {
        // Flowing reduced-motion cards all remain accessible. Pinned panels expose only
        // the visible solution, so Tab cannot land on transparent links behind it.
        const inactive = !reduce && panel.dataset.i !== chapters?.dataset.active;
        if (panel.contains(document.activeElement) && inactive) {
          chapters?.querySelector<HTMLElement>(`.ch-panel[data-i="${chapters.dataset.active}"] a`)?.focus({ preventScroll: true });
        }
        panel.toggleAttribute("inert", inactive);
        panel.setAttribute("aria-hidden", String(inactive));
      }
    };
    let videoDirty = true;
    const syncChapterFilms = () => {
      if (!chapters) return;
      if (reduce || document.hidden || (root.dataset.motion !== "full" && (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData)) { films.forEach((v) => v.pause()); return; }
      const vh = innerHeight;
      const cr = chapters.getBoundingClientRect();
      const sectionOn = cr.bottom > 0 && cr.top < vh;
      for (const v of films) {
        const panel = v.closest<HTMLElement>(".ch-panel");
        const on = sectionOn && panel?.dataset.i === chapters.dataset.active;
        if (on && v.paused) {
          if (!v.getAttribute("src") && v.dataset.src) v.src = v.dataset.src;
          v.preload = "auto";
          v.play().catch(() => {});
        } else if (!on && !v.paused) v.pause();
      }
    };

    // ---- the loop
    let raf = 0;
    let lastY = window.scrollY;
    let previousY = -1;
    let previousWidth = 0;
    let previousHeight = 0;
    const tick = (t: number) => {
      raf = 0; // Touch scroll events must be able to schedule the next frame.
      lenis?.raf(t);

      const y = window.scrollY;
      if (header) {
        header.classList.toggle("solid", y > 40);
        if (Math.abs(y - lastY) > 4) {
          header.classList.toggle("away", y > lastY && y > 400 && !root.classList.contains("menu-open"));
          lastY = y;
        }
      }

      const changed = y !== previousY || innerWidth !== previousWidth || innerHeight !== previousHeight;
      previousY = y; previousWidth = innerWidth; previousHeight = innerHeight;
      const measurements = changed && !reduce ? sections.map(el => ({ el, r: el.getBoundingClientRect() })) : [];
      for (const { el, r } of measurements) {
        if (r.bottom < -50 || r.top > innerHeight + 50) continue;
        const p = progress(el, r);
        el.style.setProperty("--p", p.toFixed(4));
        if (el.classList.contains("chapters")) {
          const n = Number(el.dataset.count) || 1;
          const a = String(Math.min(n - 1, Math.floor(p * n * 0.999)));
          if (el.dataset.active !== a) el.dataset.active = a;
          el.style.setProperty("--pp", ((p * n) % 1).toFixed(4)); // progress inside the active chapter
        }
        if (el.classList.contains("hero-scroll")) el.classList.toggle("late", p > 0.5);
        if (el.classList.contains("hscroll")) {
          const track = el.querySelector<HTMLElement>(".hscroll-track");
          if (track) {
            const dist = Math.max(track.scrollWidth - innerWidth, 0);
            track.style.setProperty("--x", `${(-p * dist).toFixed(1)}px`);
          }
        }
      }

      if (changed || videoDirty) {
        videoDirty = false;
        syncPanelAccess();
        syncChapterFilms();
      }
      if (cursor && fine && !reduce && (Math.abs(mouse.x - mouse.cx) > 0.05 || Math.abs(mouse.y - mouse.cy) > 0.05)) {
        mouse.cx += (mouse.x - mouse.cx) * 0.2;
        mouse.cy += (mouse.y - mouse.cy) * 0.2;
        cursor.style.transform = `translate3d(${mouse.cx}px, ${mouse.cy}px, 0)`;
      }
      if (fine && !reduce && depthScenes.length) {
        const gx = (mouse.x / innerWidth) * 2 - 1, gy = (mouse.y / innerHeight) * 2 - 1;
        if (Math.abs(gx - depthX) > 0.001 || Math.abs(gy - depthY) > 0.001) {
          depthX += (gx - depthX) * 0.06;
          depthY += (gy - depthY) * 0.06;
          for (const scene of depthScenes) {
            const r = scene.parentElement!.getBoundingClientRect();
            if (r.bottom < 0 || r.top > innerHeight) continue;
            scene.style.setProperty("--hx", depthX.toFixed(4));
            scene.style.setProperty("--hy", depthY.toFixed(4));
          }
        }
      }
      raf = !reduce && fine ? requestAnimationFrame(tick) : 0;
    };
    const requestTick = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(tick); };
    const retryFilms = () => { videoDirty = true; previousY = -1; requestTick(); };
    document.addEventListener("pointerdown", retryFilms, { passive: true });
    window.addEventListener("pageshow", retryFilms);
    films.forEach(film => film.addEventListener("canplay", retryFilms));
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick, { passive: true });
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      videoDirty = true;
      if (document.hidden) films.forEach((v) => v.pause());
      else { previousY = -1; raf = requestAnimationFrame(tick); }
    };
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      sceneResize?.disconnect();
      window.removeEventListener("resize", sizeScenes);
      document.removeEventListener("pointerdown", retryFilms);
      window.removeEventListener("pageshow", retryFilms);
      films.forEach(film => film.removeEventListener("canplay", retryFilms));
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", requestTick);
      films.forEach(v => v.pause());
      panels.forEach(panel => { panel.removeAttribute("inert"); panel.removeAttribute("aria-hidden"); });
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(raf);
      pageTransition();
      if ((window as Window & { lenis?: Lenis }).lenis === lenis) delete (window as Window & { lenis?: Lenis }).lenis;
      lenis?.destroy();
      io.disconnect();
      menuBtn?.removeEventListener("click", onMenu);
      menu?.removeEventListener("click", onMenuLink);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeaveDoc);
      magnets.forEach((m) => {
        m.removeEventListener("pointermove", magMove);
        m.removeEventListener("pointerleave", magLeave);
      });
      glows.forEach((g) => g.removeEventListener("pointermove", glowMove));
      tilts.forEach((el) => { el.removeEventListener("pointermove", tiltMove); el.removeEventListener("pointerleave", tiltLeave); });
      root.classList.remove("fx", "has-cursor", "cursor-on", "menu-open");
    };
  }, []);

  return (
    <><PageCurtain /><div className="cursor" aria-hidden="true">
      <i />
      <span className="cursor-label" />
    </div></>
  );
}

/**
 * Curtain between pages (same as public/site.js): an internal link click raises .px, then navigates;
 * the next page starts covered (html.arriving, set before first paint by an inline head script) and
 * the curtain leaves upward. Returns a cleanup function.
 */
export function pageTransitions(root: HTMLElement) {
  let arrivalFrame = 0;
  let arrivalTimer = 0;
  let navigationTimer = 0;
  if (root.classList.contains("arriving")) {
    arrivalFrame = requestAnimationFrame(() => { arrivalFrame = requestAnimationFrame(() => root.classList.add("arrived")); });
    arrivalTimer = window.setTimeout(() => root.classList.remove("arriving", "arrived"), 420);
  }
  try {
    sessionStorage.removeItem("tai-px");
  } catch {}
  const reduce = root.dataset.motion !== "full" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest?.("a");
    if (!a || reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    if (url.pathname === location.pathname && url.search === location.search) return; // same page / #anchor
    if (/\.(pdf|zip|jpe?g|png|webp|mp4)$/i.test(url.pathname)) return;
    e.preventDefault();
    root.classList.remove("menu-open");
    root.classList.add("leaving");
    try {
      sessionStorage.setItem("tai-px", "1");
    } catch {}
    if (navigationTimer) return;
    navigationTimer = window.setTimeout(() => location.assign(url.href), 280);
  };
  // back/forward cache restores the page with the curtain still up
  const onShow = (e: PageTransitionEvent) => e.persisted && root.classList.remove("leaving", "arriving", "arrived");
  document.addEventListener("click", onClick);
  window.addEventListener("pageshow", onShow);
  return () => {
    cancelAnimationFrame(arrivalFrame);
    clearTimeout(arrivalTimer);
    clearTimeout(navigationTimer);
    document.removeEventListener("click", onClick);
    window.removeEventListener("pageshow", onShow);
  };
}

function clamp(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
