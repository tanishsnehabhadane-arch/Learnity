import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./fonts.css";
import { bodyFont, displayFont, techFont, codeFont, fontVariables } from "./fonts";
import { AppShell } from "@/components/layout/AppShell";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "Learnity — Adaptive AI Learning",
    template: "%s · Learnity",
  },
  description:
    "AI-powered adaptive learning: concept-level gap detection, personalized learning paths, adaptive quizzes and an always-on AI tutor.",
  manifest: "/manifest.webmanifest",
  applicationName: "Learnity",
  appleWebApp: { capable: true, title: "Learnity" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f10" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${displayFont.variable} ${techFont.variable} ${bodyFont.variable} ${codeFont.variable}`}>
      <body className={`${fontVariables} min-h-dvh bg-base font-body text-ink`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:border-2 focus:border-black focus:bg-white focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <AppShell>
          <Navbar />
          {children}
          <Footer />
        </AppShell>
      </body>
    </html>
  );
}
