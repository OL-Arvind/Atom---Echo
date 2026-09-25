"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({
  showLabel = false,
  className = "",
}: {
  showLabel?: boolean;
  className?: string;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current =
      (document.documentElement.getAttribute("data-theme") as "light" | "dark") ||
      (localStorage.getItem("ae_theme") as "light" | "dark") ||
      "light";
    setTheme(current);

    const handleThemeChange = () => {
      const updated =
        (document.documentElement.getAttribute("data-theme") as "light" | "dark") || "light";
      setTheme(updated);
    };

    window.addEventListener("ae_theme_change", handleThemeChange);
    return () => window.removeEventListener("ae_theme_change", handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("ae_theme", nextTheme);
    window.dispatchEvent(new Event("ae_theme_change"));
  };

  if (showLabel) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`group flex items-center justify-between w-full px-2.5 py-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] hover:border-[var(--color-line-strong)] text-xs text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-all duration-150 active:scale-[0.98] cursor-pointer ${className}`}
        title={`Switch to ${theme === "light" ? "Obsidian Dark" : "Paper Light"} mode`}
        aria-label="Toggle visual theme"
      >
        <div className="flex items-center gap-2">
          {theme === "light" ? (
            <Moon
              size={13}
              strokeWidth={1.8}
              className="text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)] transition-colors"
            />
          ) : (
            <Sun
              size={13}
              strokeWidth={1.8}
              className="text-[var(--color-accent)] transition-colors"
            />
          )}
          <span className="font-sans text-[12px]">{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
        </div>
        <span className="text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-muted)]">
          {theme === "light" ? "Obsidian" : "Paper"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] hover:border-[var(--color-line-strong)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-all duration-150 active:scale-[0.94] cursor-pointer ${className}`}
      title={`Switch to ${theme === "light" ? "Obsidian Dark" : "Paper Light"} mode`}
      aria-label="Toggle visual theme"
    >
      {theme === "light" ? (
        <Moon
          size={14}
          strokeWidth={1.8}
          className="transition-transform duration-200 group-hover:-rotate-12 text-[var(--color-ink-secondary)] group-hover:text-[var(--color-ink)]"
        />
      ) : (
        <Sun
          size={14}
          strokeWidth={1.8}
          className="transition-transform duration-200 group-hover:rotate-45 text-[var(--color-accent)]"
        />
      )}
    </button>
  );
}
