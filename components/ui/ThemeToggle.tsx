"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/store/themeStore";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
      className={`relative h-9 w-9 rounded-xl flex items-center justify-center bg-black/[0.04] hover:bg-black/[0.07] transition-colors active:scale-90 ${className}`}
    >
      <Sun
        size={17}
        className={`absolute transition-all duration-300 ${
          theme === "dark" ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
        }`}
      />
      <Moon
        size={16}
        className={`absolute transition-all duration-300 ${
          theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
        }`}
      />
    </button>
  );
}
