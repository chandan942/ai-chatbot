"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    let saved: string | null = null;
    if (typeof window !== "undefined") {
      try {
        saved = localStorage.getItem("theme");
      } catch (err) {
        // Access to localStorage may be blocked (e.g., in some privacy modes); fall back gracefully
        console.warn("Unable to access localStorage for theme preference", err);
        saved = null;
      }
    }

    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const apply = (theme: Theme) => {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    const resolved: Theme = (saved === "dark" || saved === "light") ? (saved as Theme) : (prefersDark ? "dark" : "light");

    apply(resolved);

    // Listen for OS preference changes if no saved preference
    let media: MediaQueryList | null = null;
    if (!saved && typeof window !== "undefined" && window.matchMedia) {
      media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? "dark" : "light");
      if (media.addEventListener) media.addEventListener("change", handler);
      else if (media.addListener) media.addListener(handler as any);

      return () => {
        if (media) {
          if (media.removeEventListener) media.removeEventListener("change", handler);
          else if (media.removeListener) media.removeListener(handler as any);
        }
      };
    }

    // no cleanup needed if saved
    return;
  }, []);

  // Avoid rendering children until client has applied theme to prevent flash
  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
