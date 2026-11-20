"use client";

import "./ink-sample.css";
import { useEffect } from "react";

/**
 * SAMPLE ONLY: "a little more black" variant for review.
 * Open the page with ?ink=1 to see it; without the parameter nothing changes.
 * Remove this file (and its import in page.tsx) once the owner has decided.
 */
export default function InkSample() {
  useEffect(() => {
    const on = new URLSearchParams(window.location.search).has("ink");
    document.documentElement.classList.toggle("ink", on);
    return () => document.documentElement.classList.remove("ink");
  }, []);
  return null;
}
