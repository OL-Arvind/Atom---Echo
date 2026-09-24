"use client";

import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  brandName?: string;
  statusDotColor?: string;
}

export interface CustomSelectProps {
  options: (SelectOption | string)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  size?: "sm" | "md";
  required?: boolean;
  align?: "left" | "right";
  id?: string;
}

export function CustomSelect({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  name,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  dropdownClassName = "",
  size = "md",
  required = false,
  align = "left",
  id: customId,
}: CustomSelectProps) {
  const generatedId = useId();
  const id = customId || generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Normalize options to SelectOption format
  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue || normalizedOptions[0]?.value || ""
  );

  const currentValue = isControlled ? controlledValue : internalValue;
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [openUpwards, setOpenUpwards] = useState(false);

  // Auto-detect direction (open upwards if near bottom)
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 220 && spaceAbove > 200) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  const selectedOption = normalizedOptions.find(
    (opt) => opt.value === currentValue
  );

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Sync internal state with defaultValue
  useEffect(() => {
    if (defaultValue !== undefined && !isControlled) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, isControlled]);

  const handleSelect = (val: string) => {
    if (!isControlled) {
      setInternalValue(val);
    }
    onChange?.(val);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setFocusedIndex(
          selectedOption
            ? normalizedOptions.findIndex((o) => o.value === selectedOption.value)
            : 0
        );
        return;
      }

      const delta = e.key === "ArrowDown" ? 1 : -1;
      setFocusedIndex((prev) => {
        const next = prev + delta;
        if (next < 0) return normalizedOptions.length - 1;
        if (next >= normalizedOptions.length) return 0;
        return next;
      });
    } else if (e.key === "Enter" || e.key === " ") {
      if (isOpen && focusedIndex >= 0 && focusedIndex < normalizedOptions.length) {
        e.preventDefault();
        handleSelect(normalizedOptions[focusedIndex].value);
      } else if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      setIsOpen(false);
    }
  };

  const isSmall = size === "sm";

  return (
    <div
      ref={containerRef}
      className="relative inline-block w-full text-left"
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for form submissions */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue}
          required={required}
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] transition-all duration-150 ease-out hover:border-[var(--color-line-strong)] focus:border-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50 ${
          isSmall ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-xs"
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate text-left">
          {selectedOption?.brandName && (
            <BrandLogo
              nameOrDomain={selectedOption.brandName}
              size={isSmall ? 14 : 16}
              className="rounded-[2px] shrink-0"
            />
          )}

          {selectedOption?.statusDotColor && (
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${selectedOption.statusDotColor}`}
            />
          )}

          {selectedOption?.icon && (
            <span className="shrink-0 text-[var(--color-ink-tertiary)]">
              {selectedOption.icon}
            </span>
          )}

          <span className="truncate font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--color-ink-tertiary)] transition-transform duration-150 ease-out shrink-0 group-hover:text-[var(--color-ink)] ${
            isOpen ? "rotate-180 text-[var(--color-ink)]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } ${
            openUpwards ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } z-50 min-w-full max-h-60 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-1 shadow-lifted animate-in fade-in-0 zoom-in-95 duration-100 ${dropdownClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="py-2 px-3 text-xs text-[var(--color-ink-tertiary)] italic">
              No options available
            </div>
          ) : (
            normalizedOptions.map((opt, index) => {
              const isSelected = opt.value === currentValue;
              const isFocused = index === focusedIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`flex cursor-pointer items-center justify-between gap-2.5 rounded-[var(--radius-xs)] px-2.5 py-1.5 text-xs transition-colors ${
                    isSelected
                      ? "bg-[var(--color-base-subtle)] font-medium text-[var(--color-ink)]"
                      : isFocused
                      ? "bg-[var(--color-surface-hover)] text-[var(--color-ink)]"
                      : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    {opt.brandName && (
                      <BrandLogo
                        nameOrDomain={opt.brandName}
                        size={15}
                        className="rounded-[2px] shrink-0"
                      />
                    )}

                    {opt.statusDotColor && (
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${opt.statusDotColor}`}
                      />
                    )}

                    {opt.icon && (
                      <span className="shrink-0 text-[var(--color-ink-tertiary)]">
                        {opt.icon}
                      </span>
                    )}

                    <div className="truncate">
                      <span className="block truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="block text-[10.5px] text-[var(--color-ink-tertiary)] font-normal truncate">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-[var(--color-ink)] shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
