import type { Metadata } from "next";
import Frame from "./frame";

// The owner's Spline robot on its own, transparent, shown on the home page inside an iframe by spline-robot.tsx.
// Kept in an iframe because the Spline runtime ships its own three.js, which broke the site's own 3D scenes when
// both ran in the same page.
export const metadata: Metadata = { title: "Robot", robots: { index: false, follow: false } };

export default function SplineFrame() {
  return (
    <>
      <style>{`html,body{color-scheme:normal!important;background:#0b1213!important;margin:0;overflow:hidden;height:100%}canvas{background:transparent!important}`}</style>
      <Frame />
    </>
  );
}
