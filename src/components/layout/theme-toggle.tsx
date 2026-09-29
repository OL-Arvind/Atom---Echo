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

  const applyTheme = (nextTheme: "light" | "dark") => {
    if (nextTheme === theme) return;
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("ae_theme", nextTheme);
    window.dispatchEvent(new Event("ae_theme_change"));
  };

  const toggleTheme = () => {
    applyTheme(theme === "light" ? "dark" : "light");
  };

  if (showLabel) {
    return (
      <div
        role="group"
        aria-label="Appearance theme"
        className={`grid grid-cols-2 gap-1 p-0.5 rounded-[7px] border border-[var(--color-line)] bg-[var(--color-base-subtle)] select-none ${className}`}
      >
        <button
          type="button"
          onClick={() => applyTheme("light")}
          aria-pressed={theme === "light"}
          title="Warm Paper Light mode"
          className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-[5px] text-[11.5px] font-sans transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-out active:scale-[0.97] cursor-pointer ${
            theme === "light"
              ? "bg-[var(--color-base-overlay)] text-[var(--color-ink)] font-medium border border-[var(--color-line)] shadow-2xs"
              : "bg-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] border border-transparent"
          }`}
        >
          <Sun
            size={12}
            strokeWidth={theme === "light" ? 2 : 1.75}
            className={theme === "light" ? "text-[var(--color-accent)]" : "text-current"}
          />
          <span>Paper</span>
        </button>

        <button
          type="button"
          onClick={() => applyTheme("dark")}
          aria-pressed={theme === "dark"}
          title="Obsidian Dark mode"
          className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-[5px] text-[11.5px] font-sans transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-out active:scale-[0.97] cursor-pointer ${
            theme === "dark"
              ? "bg-[var(--color-base-overlay)] text-[var(--color-ink)] font-medium border border-[var(--color-line)] shadow-2xs"
              : "bg-transparent text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] border border-transparent"
          }`}
        >
          <Moon
            size={12}
            strokeWidth={theme === "dark" ? 2 : 1.75}
            className={theme === "dark" ? "text-[var(--color-accent)]" : "text-current"}
          />
          <span>Obsidian</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] hover:border-[var(--color-line-strong)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-[transform,background-color,color,border-color] duration-150 ease-out active:scale-[0.97] cursor-pointer ${className}`}
      title={`Switch to ${theme === "light" ? "Obsidian Dark" : "Paper Light"} mode`}
      aria-label={`Switch to ${theme === "light" ? "Obsidian Dark" : "Paper Light"} mode`}
    >
      {theme === "light" ? (
        <Moon
          size={14}
          strokeWidth={1.8}
          className="transition-transform duration-150 ease-out group-hover:-rotate-12 text-[var(--color-ink-secondary)] group-hover:text-[var(--color-ink)]"
        />
      ) : (
        <Sun
          size={14}
          strokeWidth={1.8}
          className="transition-transform duration-150 ease-out group-hover:rotate-45 text-[var(--color-accent)]"
        />
      )}
    </button>
  );
}
