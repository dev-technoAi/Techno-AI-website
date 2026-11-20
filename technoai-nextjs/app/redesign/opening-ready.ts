"use client";
import { useEffect, useState } from "react";

/** Start GPU initialization only after the opening transition has painted. */
export function useOpeningReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setReady(document.documentElement.dataset.openingReady === "true");
    sync();
    window.addEventListener("technoai:opening-ready", sync);
    return () => window.removeEventListener("technoai:opening-ready", sync);
  }, []);
  return ready;
}
