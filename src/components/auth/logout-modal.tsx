"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, X, Loader2, Sparkles } from "lucide-react";
import { AuthUser, clearStoredUser } from "@/lib/auth/dummy-auth";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
}

export function LogoutModal({ isOpen, onClose, user }: LogoutModalProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isOpen) return null;

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      clearStoredUser();
      setIsLoggingOut(false);
      onClose();
      router.push("/login");
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs select-none animate-in">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-6 shadow-dialog space-y-5 text-[var(--color-ink)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-normal text-[var(--color-ink)]">
              Account &amp; Session
            </span>
          </div>
          <button
            onClick={onClose}
            disabled={isLoggingOut}
            className="rounded-[var(--radius-xs)] p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-base-overlay)] border border-[var(--color-line-strong)] font-mono text-xs font-semibold text-[var(--color-ink)] shrink-0">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-xs text-[var(--color-ink)] truncate">
              {user.name}
            </div>
            <div className="text-[11px] text-[var(--color-ink-secondary)] truncate">
              {user.email}
            </div>
            <div className="text-[10px] font-mono text-[var(--color-ink-tertiary)] mt-0.5">
              {user.role}
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base)] p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-ink)]">
            <Sparkles className="h-3 w-3 text-[var(--color-accent)]" />
            <span>Auth Setup · Coming Soon</span>
          </div>
          <p className="text-[11px] text-[var(--color-ink-secondary)] leading-relaxed">
            Real Google SSO and multi-tenant authentication will be connected in an upcoming release. You are currently in an operator preview session.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="btn btn-secondary flex-1 text-xs py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="btn btn-danger flex-1 text-xs py-2"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
