// Every archived page rebuilt in the home page's design (see [...slug]/page.tsx). Same root layout,
// fonts, chrome and motion as the home page, plus the page-template styles.
import RedesignLayout from "../interior-kit/shell";
import "./pages.css";
import "../type-spacing.css";
import "../interior-kit/experience.css";
import "../interior-responsive.css";
import "../interior-theme.css";

export { metadata, viewport } from "../interior-kit/shell";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return <RedesignLayout>{children}</RedesignLayout>;
}
