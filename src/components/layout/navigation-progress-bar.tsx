"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Emil Kowalski Craft Standard: Instant Navigation Progress Bar
 * 
 * Provides 0ms tactile feedback when any link is clicked, eliminating
 * the perceived "freeze" during Next.js route transitions and JIT compilation.
 */
export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  // Reset/Complete progress bar on route change
  useEffect(() => {
    if (isVisible) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    let trickleInterval: NodeJS.Timeout | null = null;

    const startProgress = () => {
      setIsVisible(true);
      setProgress(15);

      if (trickleInterval) clearInterval(trickleInterval);

      trickleInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            if (trickleInterval) clearInterval(trickleInterval);
            return prev;
          }
          // Ease forward smoothly
          const diff = 85 - prev;
          const step = Math.max(1, Math.floor(diff * 0.15));
          return Math.min(85, prev + step);
        });
      }, 150);
    };

    const handleLinkClick = (event: MouseEvent) => {
      // Find closest anchor tag
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      const targetAttr = anchor.getAttribute("target");

      // Ignore external links, mailto, tel, downloads, or open in new tab
      if (
        !href ||
        targetAttr === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.defaultPrevented ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#")
      ) {
        return;
      }

      // If clicking the current path, no navigation occurs
      const currentUrl = window.location.pathname + window.location.search;
      if (href === currentUrl) return;

      // Start the progress bar instantly (0ms)
      startTransition(() => {
        startProgress();
      });
    };

    // Attach to document in capture phase to intercept clicks immediately
    document.addEventListener("click", handleLinkClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
      if (trickleInterval) clearInterval(trickleInterval);
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        zIndex: 99999,
        pointerEvents: "none",
        background: "transparent",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "var(--color-accent, #d3ff5a)",
          boxShadow: "0 0 10px rgba(211, 255, 90, 0.45)",
          transition: progress === 100 
            ? "width 120ms ease-out, opacity 180ms ease-in" 
            : "width 220ms cubic-bezier(0.16, 1, 0.3, 1)",
          opacity: isVisible ? 1 : 0,
          transformOrigin: "left center",
        }}
      />
    </div>
  );
}
