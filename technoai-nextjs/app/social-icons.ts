/** Inline social marks: no icon font, external request or client JavaScript. */
const marks: Record<string, string> = {
  Instagram: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.1"/>',
  Facebook: '<path d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.3V10H8v3h2.7v8z"/>',
  LinkedIn: '<rect x="3" y="8.5" width="3.5" height="12.5" rx=".3"/><circle cx="4.75" cy="4.75" r="2"/><path d="M9 8.5h3.4v1.7c.6-1.1 1.8-2 3.7-2 3.6 0 4.9 2.3 4.9 5.7V21h-3.5v-6.3c0-1.7-.3-3.1-2.2-3.1-2 0-2.8 1.4-2.8 3.1V21H9z"/>',
  TikTok: '<path d="M14 3h3c.2 2.3 1.5 3.8 4 4v3a9 9 0 0 1-4-1.2v6.6a6 6 0 1 1-6.8-5.9v3.1a3 3 0 1 0 3.8 2.8z"/>',
};
export function socialIconHtml(name: string) {
  return `<svg class="social-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" focusable="false">${marks[name] ?? ""}</svg>`;
}
