"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseResizableSplitOptions {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
}

export function useResizableSplit({
  defaultWidth = 480,
  minWidth = 360,
  maxWidth = 720,
  storageKey = "atom-echo-command-center-left-width",
}: UseResizableSplitOptions = {}) {
  const [leftWidth, setLeftWidth] = useState<number>(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore saved splitter width from localStorage
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem(storageKey);
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          setLeftWidth(parsed);
        }
      }
    } catch {}
  }, [storageKey, minWidth, maxWidth]);

  // Resizing mouse events
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const resetWidth = useCallback(() => {
    setLeftWidth(defaultWidth);
    try {
      localStorage.setItem(storageKey, String(defaultWidth));
    } catch {}
  }, [defaultWidth, storageKey]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      setLeftWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      try {
        localStorage.setItem(storageKey, String(leftWidth));
      } catch {}
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, leftWidth, minWidth, maxWidth, storageKey]);

  return {
    leftWidth,
    isResizing,
    containerRef,
    startResizing,
    resetWidth,
  };
}
