"use client";

import { useId, useState } from "react";
import type { FormBlock } from "./model";

/**
 * An Elementor Pro form (newsletter etc.) rebuilt without Elementor's scripts. It posts exactly what
 * Elementor posted — action, the hidden ids and form_fields[...] — to our admin-ajax stand-in
 * (app/wp-admin/admin-ajax.php/route.ts), which validates, emails and logs it.
 */
export function SiteForm({ form }: { form: FormBlock }) {
  const feedbackId = useId();
  const [state, setState] = useState<{ status: "idle" | "sending" | "ok" | "error"; message?: string }>({ status: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.status === "sending") return;
    const element = e.currentTarget;
    const fd = new FormData(element);
    fd.set("action", "elementor_pro_forms_send_form");
    fd.set("referer_title", document.title);
    fd.set("page_url", window.location.pathname);
    setState({ status: "sending" });
    try {
      const res = await fetch("/wp-admin/admin-ajax.php", { method: "POST", body: fd });
      const json = await res.json().catch(() => null);
      if (json?.success) {
        setState({ status: "ok", message: json.data?.message || "Your submission was successful." });
        element.reset();
      } else setState({ status: "error", message: json?.data?.message || "Something went wrong. Please try again." });
    } catch {
      setState({ status: "error", message: "Something went wrong. Please try again." });
    }
  }

  return (
    <form className="pg-form" onSubmit={onSubmit} aria-label={form.name} aria-busy={state.status === "sending"} aria-describedby={feedbackId}>
      {Object.entries(form.hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="pg-form-fields">
        {form.fields.map((f) => (
          <label key={f.name} className={`pg-field${f.type === "textarea" ? " wide" : ""}`}>
            <span>
              {f.label}
              {f.required && <i aria-hidden="true"> *</i>}
            </span>
            {f.type === "textarea" ? (
              <textarea name={f.name} required={f.required} placeholder={f.placeholder} rows={4} />
            ) : f.type === "select" ? (
              <select name={f.name} required={f.required} defaultValue={f.options?.[0]?.value}>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input name={f.name} type={f.type} required={f.required} placeholder={f.placeholder} />
            )}
          </label>
        ))}
        <button className="btn btn-fill" type="submit" disabled={state.status === "sending"}>
          {state.status === "sending" ? "Sending…" : form.submit}
        </button>
      </div>
      <p id={feedbackId} className={`pg-form-msg ${state.status}`} role="status" aria-live="polite" aria-atomic="true">
        {state.status === "sending" ? "Sending your submission…" : state.message}
      </p>
    </form>
  );
}
