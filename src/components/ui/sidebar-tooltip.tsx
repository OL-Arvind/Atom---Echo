"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
  cloneElement,
  isValidElement,
} from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

// Global warmup state across all sidebar tooltips (Emil Kowalski group pattern)
let globalWarmupTimer: NodeJS.Timeout | null = null;
let isGroupWarm = false;

function setGroupWarm(warm: boolean) {
  isGroupWarm = warm;
  if (globalWarmupTimer) {
    clearTimeout(globalWarmupTimer);
    globalWarmupTimer = null;
  }
}

function scheduleGroupCooldown(delayMs = 300) {
  if (globalWarmupTimer) clearTimeout(globalWarmupTimer);
  globalWarmupTimer = setTimeout(() => {
    isGroupWarm = false;
    globalWarmupTimer = null;
  }, delayMs);
}

interface SidebarTooltipProps {
  content: string;
  hint?: string;
  enabled?: boolean;
  side?: "right" | "left" | "top" | "bottom";
  children: ReactNode;
}

export function SidebarTooltip({
  content,
  hint,
  enabled = true,
  side = "right",
  children,
}: SidebarTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const openTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();

  const closeTooltip = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    setIsOpen(false);
  }, []);

  // Ensure tooltips dismiss instantly on navigation
  useEffect(() => {
    closeTooltip();
    setGroupWarm(false);
  }, [pathname, closeTooltip]);

  // If enabled status turns false (e.g. sidebar expands), close immediately
  useEffect(() => {
    if (!enabled) {
      closeTooltip();
      setGroupWarm(false);
    }
  }, [enabled, closeTooltip]);

  // Mount check for SSR hydration safety
  useEffect(() => {
    setMounted(true);
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
    };
  }, []);

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;
    updateCoords();

    if (isGroupWarm) {
      setIsOpen(true);
      setGroupWarm(true);
    } else {
      openTimerRef.current = setTimeout(() => {
        updateCoords();
        setIsOpen(true);
        setGroupWarm(true);
      }, 120);
    }
  }, [enabled, updateCoords]);

  const handleMouseLeave = useCallback(() => {
    closeTooltip();
    scheduleGroupCooldown(300);
  }, [closeTooltip]);

  // Dismiss on any window click, pointerdown, scroll, or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleDismiss = () => {
      closeTooltip();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeTooltip();
      }
    };

    const handleScrollOrResize = () => {
      updateCoords();
    };

    window.addEventListener("pointerdown", handleDismiss);
    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("pointerdown", handleDismiss);
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, closeTooltip, updateCoords]);

  // If not enabled or invalid element, render untouched
  if (!enabled || !isValidElement(children)) {
    return <>{children}</>;
  }

  const child = children as React.ReactElement<{
    onClick?: (e: React.MouseEvent) => void;
    onPointerDown?: (e: React.PointerEvent) => void;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
    ref?: React.Ref<HTMLElement>;
  }>;

  const clonedChild = cloneElement(child, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const originalRef = (child as unknown as { ref?: React.Ref<HTMLElement> }).ref;
      if (typeof originalRef === "function") {
        originalRef(node);
      } else if (originalRef && typeof originalRef === "object" && "current" in originalRef) {
        (originalRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    // Dismiss instantly on click or pointerdown
    onClick: (e: React.MouseEvent) => {
      child.props.onClick?.(e);
      closeTooltip();
      setGroupWarm(false);
    },
    onPointerDown: (e: React.PointerEvent) => {
      child.props.onPointerDown?.(e);
      closeTooltip();
      setGroupWarm(false);
    },
    onMouseEnter: (e: React.MouseEvent) => {
      child.props.onMouseEnter?.(e);
      handleMouseEnter();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      child.props.onMouseLeave?.(e);
      handleMouseLeave();
    },
    onFocus: (e: React.FocusEvent) => {
      child.props.onFocus?.(e);
      // Only open on keyboard focus (:focus-visible), never mouse click
      if (e.currentTarget.matches(":focus-visible")) {
        handleMouseEnter();
      }
    },
    onBlur: (e: React.FocusEvent) => {
      child.props.onBlur?.(e);
      handleMouseLeave();
    },
  });

  return (
    <>
      {clonedChild}
      {mounted &&
        isOpen &&
        coords &&
        createPortal(
          <div
            role="tooltip"
            aria-hidden="true"
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: "translateY(-50%)",
              zIndex: 9999,
              pointerEvents: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 9px",
              background: "#09090b",
              color: "#fafafa",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow:
                "0 4px 14px rgba(0, 0, 0, 0.18), 0 1px 3px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
              fontFamily: "var(--font-sans)",
              fontSize: "12px",
              fontWeight: 500,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              letterSpacing: "-0.01em",
              animation: "sidebarTooltipIn 140ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {/* Subtle caret arrow pointing back to the icon */}
            <div
              style={{
                position: "absolute",
                left: "-4px",
                top: "50%",
                transform: "translateY(-50%) rotate(45deg)",
                width: "8px",
                height: "8px",
                background: "#09090b",
                borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                pointerEvents: "none",
              }}
            />

            <span style={{ position: "relative", zIndex: 1 }}>{content}</span>

            {hint && (
              <span
                style={{
                  position: "relative",
                  zIndex: 1,
                  fontFamily: "var(--font-sans tabular-nums)",
                  fontSize: "9.5px",
                  fontWeight: 500,
                  color: "rgba(255, 255, 255, 0.45)",
                  background: "rgba(255, 255, 255, 0.08)",
                  padding: "1px 4.5px",
                  borderRadius: "3px",
                  letterSpacing: "0.02em",
                }}
              >
                {hint}
              </span>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
