import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;
let SplitTextPlugin: any = null;

/** Registrasi plugin GSAP sekali saja (client-only, aman dipanggil berulang). */
export function ensureGsap() {
  if (typeof window !== "undefined" && !registered) {
    try {
      gsap.registerPlugin(ScrollTrigger);
    } catch {}

    try {
      // SplitText adalah plugin komersial/bonus — load secara dinamis dan aman
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const splitMod = require("gsap/SplitText");
      SplitTextPlugin = splitMod.SplitText || splitMod.default || splitMod;
      if (SplitTextPlugin) {
        gsap.registerPlugin(SplitTextPlugin);
      }
    } catch {
      SplitTextPlugin = null;
    }

    registered = true;
  }
  return { gsap, ScrollTrigger, SplitText: SplitTextPlugin };
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
