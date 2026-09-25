"use client";

import { createClient } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  avatarUrl?: string;
  provider: "google" | "email" | "mock";
}

export const DUMMY_USERS: Record<string, AuthUser> = {
  sudeesh: {
    id: "usr_sudeesh",
    name: "Sudeesh D S",
    email: "sudeesh@atomandecho.com",
    role: "Founder · Admin",
    initials: "SD",
    provider: "google",
  },
  nikhil: {
    id: "usr_nikhil",
    name: "Nikhil",
    email: "nikhil@atomandecho.com",
    role: "Operations Lead",
    initials: "NK",
    provider: "google",
  },
};

export const DEFAULT_USER = DUMMY_USERS.sudeesh;

const SESSION_KEY = "ae_session_user";
const COOKIE_NAME = "ae_session";
const EMAIL_COOKIE_NAME = "ae_operator_email";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "AE";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw === "logged_out") {
      // Check if an OAuth callback just set the ae_session=active cookie
      if (document.cookie.includes(`${COOKIE_NAME}=active`)) {
        localStorage.removeItem(SESSION_KEY);
        return DEFAULT_USER;
      }
      return null;
    }
    if (!raw) return DEFAULT_USER;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USER;
  }
}

export function setStoredUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      const maxAge = 60 * 60 * 24 * 30;
      document.cookie = `${COOKIE_NAME}=active; path=/; max-age=${maxAge}; SameSite=Lax`;
      document.cookie = `${EMAIL_COOKIE_NAME}=${encodeURIComponent(user.email)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } else {
      localStorage.setItem(SESSION_KEY, "logged_out");
      document.cookie = `${COOKIE_NAME}=logged_out; path=/; max-age=0; SameSite=Lax`;
      document.cookie = `${EMAIL_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    }
    window.dispatchEvent(new Event("ae_auth_change"));
  } catch (e) {
    console.error("Auth storage error", e);
  }
}

export async function syncSupabaseSessionUser(): Promise<AuthUser | null> {
  if (typeof window === "undefined") return null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && user.email) {
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (user.email.toLowerCase().includes("nikhil") ? "Nikhil" : "Sudeesh D S");
      const role = user.email.toLowerCase().includes("nikhil")
        ? "Operations Lead"
        : "Founder · Admin";
      const syncedUser: AuthUser = {
        id: user.id,
        name: fullName,
        email: user.email,
        role,
        initials: getInitials(fullName),
        avatarUrl: user.user_metadata?.avatar_url,
        provider: user.app_metadata?.provider === "google" ? "google" : "email",
      };
      setStoredUser(syncedUser);
      return syncedUser;
    }
  } catch {
    // Ignore client fetch error if offline
  }
  return getStoredUser();
}

export function clearStoredUser() {
  setStoredUser(null);
}

export function isUserLoggedIn(): boolean {
  return getStoredUser() !== null;
}
