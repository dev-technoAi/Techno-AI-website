/* Motion + chrome behaviour for the archived WordPress pages (injected by app/theme-document.ts).
   The home page does the same in React (app/redesign/motion.tsx) — keep the two in step.
   Needs /vendor/lenis.min.js (copied from node_modules/lenis/dist) loaded before this file. */
(() => {
  const root = document.documentElement;
  const reduce = root.dataset.motion !== "full" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  root.classList.add("js");
  if (!reduce) root.classList.add("fx");

  // ---- smooth scroll (not inside popups, dropdowns or anything marked data-lenis-prevent)
  const lenis = !reduce && fine && window.Lenis
    ? new window.Lenis({
        lerp: 0.085,
        wheelMultiplier: 0.9,
        anchors: true,
        prevent: (node) => !!node.closest?.(".elementor-popup-modal, .dialog-widget, .brand-select-popover, [data-lenis-prevent]"),
      })
    : null;

  // ---- header + menu
  const header = document.querySelector("[data-shared-header], .hx");
  const menuBtn = document.querySelector("[data-site-menu-toggle], .hx-menu");
  const menu = document.getElementById("menu");
  const setMenu = (open) => {
    root.classList.toggle("menu-open", open);
    menuBtn?.setAttribute("aria-expanded", String(open));
    if (menuBtn?.hasAttribute("data-site-menu-toggle")) menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu?.toggleAttribute("inert", !open);
    if (open) { lenis?.stop(); menu?.querySelector("a, button")?.focus(); }
    else { lenis?.start(); if (menu?.contains(document.activeElement)) menuBtn?.focus(); }
  };
  menuBtn?.addEventListener("click", () => setMenu(!root.classList.contains("menu-open")));
  menu?.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
  addEventListener("keydown", (e) => {
    if (!root.classList.contains("menu-open")) return;
    if (e.key === "Escape") { e.preventDefault(); setMenu(false); }
    if (e.key === "Tab") {
      const items = [menuBtn, ...menu.querySelectorAll("a[href], button")].filter(el => el && el.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  });
  const here = location.pathname;
  document.querySelectorAll(".hx-nav a, .menu-nav a").forEach((a) => {
    const p = new URL(a.href).pathname;
    if (p === here) a.setAttribute("aria-current", "page");
  });

  // ---- page hero: title words rise one by one, the rest fades up; parallax while scrolling away
  const hero = document.querySelector(".brand-content .brand-hero");
  const heroTitle = hero?.querySelector("h1, h2, .H1, .elementor-heading-title");
  if (hero && !reduce) {
    // split only plain-text titles (text + <br>), so links / spans inside headings are never broken
    if (heroTitle && Array.from(heroTitle.childNodes).every((n) => n.nodeType === 3 || n.nodeName === "BR")) {
      const label = heroTitle.textContent.replace(/\s+/g, " ").trim();
      let d = 0;
      const lines = heroTitle.innerHTML.split(/<br\s*\/?>/i).map((line) => {
        const tmp = document.createElement("div");
        tmp.innerHTML = line;
        const words = tmp.textContent.trim().split(/\s+/).filter(Boolean);
        return `<span class="wl" aria-hidden="true">${words
          .map((w) => `<span><span class="w"><span style="--d:${d++}">${w.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span></span> </span>`)
          .join("")}</span>`;
      });
      heroTitle.setAttribute("aria-label", label);
      heroTitle.innerHTML = lines.join("");
      heroTitle.classList.add("words", "hero-words");
    }
    hero.querySelectorAll("p, .elementor-widget-button, .e-button-base, .elementor-button-wrapper").forEach((el, i) => {
      if (el.closest(".words")) return;
      el.classList.add("hero-fade");
      el.style.setProperty("--rd", `${0.45 + Math.min(i, 4) * 0.1}s`);
    });
    // move the hero photo onto its own layer so it can drift slowly forever (Ken Burns) + parallax
    const bg = getComputedStyle(hero).backgroundImage;
    if (bg && bg !== "none") {
      const layer = document.createElement("div");
      layer.className = "hero-bg";
      layer.setAttribute("aria-hidden", "true");
      layer.style.backgroundImage = bg;
      hero.prepend(layer);
      hero.classList.add("has-bg-layer");
    }
    hero.classList.add("hero-on");
    setTimeout(() => hero.classList.add("in"), root.classList.contains("arriving") ? 350 : 60);
  }

  // ---- reveal: each block of every section rises in as it enters the screen
  const blocks = [];
  document.querySelectorAll(".brand-content .brand-section:not(.brand-hero)").forEach((sec) => {
    const inner = sec.querySelector(":scope > .e-con-inner") || sec;
    const kids = Array.from(inner.children).filter((el) => el.offsetHeight > 0);
    kids.forEach((el, i) => {
      el.classList.add("rv");
      el.style.setProperty("--rd", `${Math.min(i, 5) * 0.08}s`);
      blocks.push(el);
    });
  });
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
  );
  blocks.forEach((el) => io.observe(el));
  document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el)); // shared CTA
  // larger pictures open like a curtain (skips logos and icons)
  document.querySelectorAll(".brand-content img").forEach((img) => {
    if (img.closest(".brand-hero") || img.getBoundingClientRect().width < 260) return;
    img.classList.add("rv-img");
    io.observe(img);
  });
  requestAnimationFrame(() => root.classList.add("ready"));

  // ---- glow that follows the pointer ([data-glow], e.g. the closing CTA)
  document.querySelectorAll("[data-glow]").forEach((g) => {
    g.addEventListener("pointermove", (e) => {
      const r = g.getBoundingClientRect();
      g.style.setProperty("--mx", `${e.clientX - r.left}px`);
      g.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  // ---- page transition (same as pageTransitions() in app/redesign/motion.tsx)
  if (root.classList.contains("arriving")) {
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("arrived")));
    setTimeout(() => root.classList.remove("arriving", "arrived"), 700);
  }
  try { sessionStorage.removeItem("tai-px"); } catch {}
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.("a");
    if (!a || reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    if (a.closest(".elementor-popup-modal, .woocommerce, form")) return; // leave WP widgets alone
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    if (/\.(pdf|zip|jpe?g|png|webp|mp4)$/i.test(url.pathname) || /^#/.test(a.getAttribute("href") || "")) return;
    e.preventDefault();
    root.classList.remove("menu-open");
    root.classList.add("leaving");
    try { sessionStorage.setItem("tai-px", "1"); } catch {}
    setTimeout(() => location.assign(url.href), 480);
  });
  addEventListener("pageshow", (e) => e.persisted && root.classList.remove("leaving", "arriving", "arrived"));

  // ---- cursor + magnetic buttons (fine pointers only)
  let cursor = null;
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, cx: innerWidth / 2, cy: innerHeight / 2 };
  if (fine && !reduce) {
    cursor = document.createElement("div");
    cursor.className = "cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.innerHTML = '<i></i><span class="cursor-label"></span>';
    document.body.appendChild(cursor);
    root.classList.add("has-cursor");
    addEventListener("pointermove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      root.classList.add("cursor-on");
      const t = e.target.closest?.("a, button, [role=button], summary, label, [data-cursor]");
      cursor.classList.toggle("hover", !!t);
    }, { passive: true });
    document.addEventListener("pointerleave", () => root.classList.remove("cursor-on"));
    document.querySelectorAll("[data-magnetic]").forEach((m) => {
      m.addEventListener("pointermove", (e) => {
        const r = m.getBoundingClientRect();
        m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      m.addEventListener("pointerleave", () => (m.style.transform = ""));
    });
  }

  // ---- one loop
  let lastY = scrollY;
  let raf = 0;
  let measuredY = -1;
  const tick = (t) => {
    raf = 0;
    lenis?.raf(t);
    const y = scrollY;
    if (header) {
      header.classList.toggle("solid", y > 40);
      if (Math.abs(y - lastY) > 4) {
        header.classList.toggle("away", y > lastY && y > 400 && !root.classList.contains("menu-open"));
        lastY = y;
      }
    }
    if (hero && !reduce && measuredY !== y) {
      measuredY = y;
      const r = hero.getBoundingClientRect();
      if (r.bottom > 0) hero.style.setProperty("--hp", Math.min(Math.max(-r.top / r.height, 0), 1).toFixed(4));
    }
    if (cursor && (Math.abs(mouse.x - mouse.cx) > 0.05 || Math.abs(mouse.y - mouse.cy) > 0.05)) {
      mouse.cx += (mouse.x - mouse.cx) * 0.2;
      mouse.cy += (mouse.y - mouse.cy) * 0.2;
      cursor.style.transform = `translate3d(${mouse.cx}px, ${mouse.cy}px, 0)`;
    }
    raf = lenis || cursor ? requestAnimationFrame(tick) : 0;
  };
  const requestTick = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(tick); };
  addEventListener("scroll", requestTick, { passive: true });
  addEventListener("resize", requestTick, { passive: true });
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) { measuredY = -1; raf = requestAnimationFrame(tick); }
  });
  addEventListener("resize", () => { measuredY = -1; }, { passive: true });
  raf = requestAnimationFrame(tick);
})();
