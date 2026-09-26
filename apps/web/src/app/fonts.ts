/**
 * Typography hierarchy per spec:
 *  - Collegiate FLF (700/900): hero titles, section headers, score banners.
 *    Self-hosted @font-face (fonts.css) with graceful fallback chain
 *    Collegiate → Anton → system sans — the build never fails on a missing asset.
 *  - Orbitron (500/700): UI labels, nav, buttons, stat chips.
 *  - Poppins (400/500/600): body copy.
 *  - JetBrains Mono (400/500): code, LaTeX, tutor snippets.
 */
import { Anton, Orbitron, Poppins, JetBrains_Mono } from "next/font/google";

/** Anton stands in for the Collegiate slot when the woff2 is absent. */
export const displayFont = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

export const techFont = Orbitron({
  weight: ["500", "700"],
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

export const bodyFont = Poppins({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const codeFont = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

/**
 * Collegiate FLF ships as a pure CSS @font-face (see fonts.css) so a missing
 * woff2 asset degrades to Anton → system sans without failing the build —
 * next/font/local must be statically analyzable and cannot be optional.
 */
export const fontVariables = [
  displayFont.variable,
  techFont.variable,
  bodyFont.variable,
  codeFont.variable,
].join(" ");
