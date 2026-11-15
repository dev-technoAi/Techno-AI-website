import chrome from "./site-chrome.json";

// One source for the homepage and the archived content routes.
export const siteHeader = chrome.header;
export const siteFooter = chrome.footer;

export function SiteHeader() {
  return <div className="site-chrome" dangerouslySetInnerHTML={{ __html: siteHeader }} />;
}

export function SiteFooter() {
  return <div className="site-chrome" dangerouslySetInnerHTML={{ __html: siteFooter }} />;
}
