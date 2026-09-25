"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, X, Loader2 } from "lucide-react";
import { AuthUser, clearStoredUser } from "@/lib/auth/dummy-auth";
import { createClient } from "@/lib/supabase/client";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
}

export function LogoutModal({ isOpen, onClose, user }: LogoutModalProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!isOpen) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore client sign-out network error
    } finally {
      clearStoredUser();
      setIsLoggingOut(false);
      onClose();
      router.push("/login");
    }
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
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-base-overlay)] border border-[var(--color-line-strong)] font-sans tabular-nums text-xs font-semibold text-[var(--color-ink)] shrink-0">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-xs text-[var(--color-ink)] truncate">
              {user.name}
            </div>
            <div className="text-[11px] text-[var(--color-ink-secondary)] truncate">
              {user.email}
            </div>
            <div className="text-[10px] font-sans tabular-nums text-[var(--color-ink-tertiary)] mt-0.5">
              {user.role}
            </div>
          </div>
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
            className="btn btn-primary flex-1 text-xs py-2"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <span>Log Out</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
