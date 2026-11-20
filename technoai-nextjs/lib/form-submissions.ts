import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import nodemailer from "nodemailer";
import formsJson from "../content/forms.json";

// Replaces WordPress's admin-ajax.php handling of Elementor forms:
//  - action=elementor_pro_forms_send_form         (classic Elementor Pro form: quote, newsletter)
//  - action=elementor_pro_atomic_forms_send_form  (Elementor 4 atomic form on the home page)
// Submissions are emailed via SMTP (env vars, see .env.example) and, where the disk is writable,
// also appended to submissions/submissions.jsonl as a backup.

type FormDef = { name: string; page: string; fields: Record<string, { label: string; required: boolean }> };
const FORMS = formsJson as Record<string, FormDef>;

export type Field = { label: string; value: string };
export type Submission = { formName: string; page: string; pageUrl: string; fields: Field[]; replyTo?: string };

// Elementor's own default messages, so the front end shows the same text as before.
export const MESSAGES = {
  success: "Your submission was successful.",
  error: "Your submission failed because of an error.",
  required: "This field is required.",
  invalid: "There's something wrong. The form is invalid.",
  email: "The email address is invalid.",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_VALUE = 5000;
const clean = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim().slice(0, MAX_VALUE) : "");

export function parseProForm(fd: FormData):
  | { ok: true; submission: Submission }
  | { ok: false; errors: Record<string, string> } {
  const def = FORMS[`${clean(fd.get("post_id"))}:${clean(fd.get("form_id"))}`];
  const values: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    const m = k.match(/^form_fields\[([^\]]+)\](\[\])?$/);
    if (!m) continue;
    const val = clean(v);
    values[m[1]] = values[m[1]] ? `${values[m[1]]}, ${val}` : val;
  }
  if (!def && !Object.keys(values).length) return { ok: false, errors: {} };

  const errors: Record<string, string> = {};
  const keys = def ? Object.keys(def.fields) : Object.keys(values);
  for (const key of keys) {
    const val = values[key] ?? "";
    if (def?.fields[key]?.required && !val) errors[key] = MESSAGES.required;
    else if (key === "email" && val && !EMAIL_RE.test(val)) errors[key] = MESSAGES.email;
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  const fields = keys.map((k) => ({ label: def?.fields[k]?.label || k, value: values[k] ?? "" }));
  const replyTo = Object.entries(values).find(([k, v]) => /email/i.test(k) && EMAIL_RE.test(v))?.[1];
  const currentPage = clean(fd.get("page_url"));
  return {
    ok: true,
    submission: {
      formName: def?.name || "Form",
      page: clean(fd.get("referer_title")),
      pageUrl: /^\/(?!\/)[^\s?#]*$/.test(currentPage) ? currentPage : def?.page || "",
      fields,
      replyTo,
    },
  };
}

export function parseAtomicForm(fd: FormData): { ok: true; submission: Submission } | { ok: false } {
  const byIndex = new Map<number, { label: string; type: string; values: string[] }>();
  for (const [k, v] of fd.entries()) {
    const m = k.match(/^form_fields\[(\d+)\]\[(label|type|value)\](?:\[\d+\])?$/);
    if (!m) continue;
    const i = +m[1];
    const f = byIndex.get(i) ?? { label: "", type: "", values: [] };
    if (m[2] === "value") f.values.push(typeof v === "string" ? clean(v) : `[file: ${(v as File).name}]`);
    else f[m[2] as "label" | "type"] = clean(v);
    byIndex.set(i, f);
  }
  if (!byIndex.size) return { ok: false };
  const fields = [...byIndex.entries()]
    .sort(([a], [b]) => a - b)
    .filter(([, f]) => f.type !== "submit" && f.type !== "button")
    .map(([, f]) => ({ label: f.label || "Field", value: f.values.filter(Boolean).join(", ") }));
  const replyTo = [...byIndex.values()].find((f) => f.type === "email" && EMAIL_RE.test(f.values[0] ?? ""))?.values[0];
  return {
    ok: true,
    submission: {
      formName: clean(fd.get("form_name")) || "Form",
      page: clean(fd.get("referer_title")),
      pageUrl: clean(fd.get("referrer")),
      fields,
      replyTo,
    },
  };
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.MAIL_TO);
}

async function sendEmail(s: Submission) {
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  const rows = s.fields
    .map((f) => `<tr><td style="padding:6px 12px;font-weight:bold;vertical-align:top">${esc(f.label)}</td><td style="padding:6px 12px;white-space:pre-wrap">${esc(f.value || "—")}</td></tr>`)
    .join("");
  const meta = `Page: ${s.page}${s.pageUrl ? ` (${s.pageUrl})` : ""}`;
  await transport.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: process.env.MAIL_TO,
    replyTo: s.replyTo,
    subject: `New message from "TechnoAi" — ${s.formName}`,
    text: `${s.fields.map((f) => `${f.label}: ${f.value}`).join("\n")}\n\n---\n${meta}`,
    html: `<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows}</table><p style="font-family:Arial,sans-serif;font-size:12px;color:#777">${esc(meta)}</p>`,
  });
}

async function saveToFile(s: Submission) {
  const dir = path.join(process.cwd(), "submissions");
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, "submissions.jsonl"), JSON.stringify({ at: new Date().toISOString(), ...s }) + "\n");
}

/** Emails the submission (if SMTP is configured) and keeps a local backup copy. */
export async function deliver(s: Submission): Promise<boolean> {
  let saved = false;
  try {
    await saveToFile(s);
    saved = true;
  } catch {
    // Read-only filesystem (e.g. serverless) — email is the only channel there.
  }
  if (smtpConfigured()) {
    try {
      await sendEmail(s);
      return true;
    } catch (e) {
      console.error("[forms] email failed:", e);
      return false;
    }
  }
  console.warn(`[forms] SMTP not configured — "${s.formName}" submission ${saved ? "saved to submissions/submissions.jsonl only" : "was NOT stored"}.`);
  return saved;
}

// Simple in-memory rate limit: 5 submissions per IP per 10 minutes.
const hits = new Map<string, number[]>();
export function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}
