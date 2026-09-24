"use client";

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

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return DEFAULT_USER;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw === "logged_out") return null;
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
      document.cookie = `${COOKIE_NAME}=active; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    } else {
      localStorage.setItem(SESSION_KEY, "logged_out");
      document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    }
    window.dispatchEvent(new Event("ae_auth_change"));
  } catch (e) {
    console.error("Auth storage error", e);
  }
}

export function clearStoredUser() {
  setStoredUser(null);
}

export function isUserLoggedIn(): boolean {
  return getStoredUser() !== null;
}
