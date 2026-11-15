// Small building blocks shared by the home page (page.tsx) and every other page (app/p).

export function Arrow() {
  return (
    <svg className="arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <span aria-hidden="true">//:</span>
      {children}
    </p>
  );
}

/** Heading whose words rise out of a mask one after another when it scrolls into view ("\n" = new line). */
export function Words({ text, as: Tag = "h2", className }: { text: string; as?: "h1" | "h2" | "h3" | "p"; className?: string }) {
  const lines = text.split("\n");
  let i = 0;
  return (
    <Tag className={`words ${className ?? ""}`} data-reveal aria-label={text.replace(/\n/g, " ")}>
      {lines.map((line, li) => (
        <span className="wl" key={li} aria-hidden="true">
          {line.split(" ").filter(Boolean).map((w, wi) => (
            <span key={wi}>
              <span className="w"><span style={{ "--d": i++ } as React.CSSProperties}>{w}</span></span>{" "}
            </span>
          ))}
        </span>
      ))}
    </Tag>
  );
}
