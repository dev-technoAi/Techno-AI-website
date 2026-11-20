import type { Metadata } from "next";
import Scene from "./scene";

// Only the C40 3D model, transparent, for the AI & Robotics page hero (shown there in an iframe by
// app/[[...slug]]/route.ts). Not a page for visitors on its own.
export const metadata: Metadata = { title: "KLEENBOT C40", robots: { index: false, follow: false } };

export default function C40Hero() {
  return (
    <>
      <style>{`html,body{background:transparent!important;margin:0;overflow:hidden}`}</style>
      <Scene />
    </>
  );
}
