/**
 * Global UI state (spec slice 1). Dark mode: class strategy, persisted.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface UIState {
  navbarTheme: "dark" | "light";
  colorScheme: "light" | "dark" | "system";
  isMobileMenuOpen: boolean;
  aiChatOpen: boolean;
  /** Accessibility: softens shake/confetti feedback. */
  reduceFeedbackIntensity: boolean;
  setNavbarTheme: (theme: "dark" | "light") => void;
  toggleMobileMenu: () => void;
  toggleAIChat: () => void;
  setColorScheme: (scheme: "light" | "dark" | "system") => void;
  setReduceFeedbackIntensity: (value: boolean) => void;
}

function applySchemeClass(scheme: UIState["colorScheme"]): void {
  if (typeof window === "undefined") return;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = scheme === "dark" || (scheme === "system" && systemDark);
  document.documentElement.classList.toggle("dark", dark);
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      navbarTheme: "light",
      colorScheme: "system",
      isMobileMenuOpen: false,
      aiChatOpen: false,
      reduceFeedbackIntensity: false,
      setNavbarTheme: (navbarTheme) => set({ navbarTheme }),
      toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
      toggleAIChat: () => set((s) => ({ aiChatOpen: !s.aiChatOpen })),
      setColorScheme: (colorScheme) => {
        applySchemeClass(colorScheme);
        set({ colorScheme });
      },
      setReduceFeedbackIntensity: (reduceFeedbackIntensity) => set({ reduceFeedbackIntensity }),
    }),
    {
      name: "learnity-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        navbarTheme: s.navbarTheme,
        colorScheme: s.colorScheme,
        reduceFeedbackIntensity: s.reduceFeedbackIntensity,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setColorScheme(state.colorScheme);
      },
    },
  ),
);
