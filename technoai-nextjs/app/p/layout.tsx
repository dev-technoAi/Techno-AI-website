// Every archived page rebuilt in the home page's design (see [...slug]/page.tsx). Same root layout,
// fonts, chrome and motion as the home page, plus the page-template styles.
import RedesignLayout from "../redesign/layout";
import "./pages.css";

export { metadata, viewport } from "../redesign/layout";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return <RedesignLayout>{children}</RedesignLayout>;
}
