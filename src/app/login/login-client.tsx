"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, KeyRound, X } from "lucide-react";
import { setStoredUser, getInitials } from "@/lib/auth/dummy-auth";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetSending, setIsResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      if (error) {
        setAuthError(error.message);
        setIsGoogleLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to connect to Google OAuth.";
      setAuthError(message);
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsEmailLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        setAuthError(error?.message || "Invalid email or password.");
        setIsEmailLoading(false);
        return;
      }

      const fullName =
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        (data.user.email || email).split("@")[0];
      const userEmail = data.user.email || email.trim();

      setStoredUser({
        id: data.user.id,
        name: fullName,
        email: userEmail,
        role: userEmail.toLowerCase().includes("nikhil") ? "Operations Lead" : "Founder · Admin",
        initials: getInitials(fullName),
        provider: "email",
      });
      setIsEmailLoading(false);
      router.push("/command-center");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      setAuthError(message);
      setIsEmailLoading(false);
    }
  };

  const handleSendPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setIsResetSending(true);
    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
    } catch {
      // Proceed to confirmation screen
    } finally {
      setIsResetSending(false);
      setResetSent(true);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col lg:flex-row bg-[var(--color-base)] text-[var(--color-ink)] select-none overflow-hidden">
      {/* LEFT HALF: Primary Authentication Interface */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-6 sm:p-8 lg:px-12 lg:py-6 xl:px-16 xl:py-7 z-10 overflow-y-auto lg:overflow-hidden">
        {/* Top: Brand Header with Theme Switcher */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center">
            <Image
              src="/brand-wordmark-dark.svg"
              alt="Atom & Echo"
              width={88}
              height={32}
              priority
              unoptimized
              className="theme-logo-light object-contain h-[30px] w-auto select-none"
            />
            <Image
              src="/brand-wordmark-white.svg"
              alt="Atom & Echo"
              width={88}
              height={32}
              priority
              unoptimized
              className="theme-logo-dark object-contain h-[30px] w-auto select-none"
            />
          </div>
          <ThemeToggle />
        </div>

        {/* Center: Main Sign-In Form */}
        <div className="w-full max-w-[350px] mx-auto my-auto py-2 space-y-5">
          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-[26px] font-normal tracking-tight text-[var(--color-ink)] leading-tight">
              Welcome back
            </h1>
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
              Sign in to access the Command Center, Founder Roster, and Content Studio.
            </p>
          </div>

          {authError && (
            <div className="border-l-2 border-[var(--color-danger)] pl-3 py-1 text-[11px] text-[var(--color-danger-text)]">
              {authError}
            </div>
          )}

          {/* Google Sign In Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isEmailLoading}
              className="flex w-full items-center justify-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] px-3.5 py-2.5 text-xs font-medium text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-ink-muted)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-ink-secondary)]" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-[var(--color-line-subtle)]" />
            <span className="absolute bg-[var(--color-base)] px-2 text-[9.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-muted)]">
              or with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10.5px] font-sans tabular-nums text-[var(--color-ink-secondary)] block">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@atomandecho.com"
                className="input text-xs w-full py-2"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] font-sans tabular-nums text-[var(--color-ink-secondary)] block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetSent(false);
                    setIsForgotPasswordOpen(true);
                  }}
                  className="text-[10.5px] text-[var(--color-accent)] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input text-xs w-full py-2 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isEmailLoading || isGoogleLoading}
              className="btn btn-accent w-full py-2.5 text-xs mt-1 shadow-sm font-semibold disabled:opacity-50"
            >
              {isEmailLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom: Status Notice & Legal Links */}
        <div className="flex items-center justify-between text-[10px] text-[var(--color-ink-tertiary)] font-sans tabular-nums pt-3 border-t border-[var(--color-line-subtle)] shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            <span>Private Operator Workspace</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-[var(--color-ink)] transition-colors">
              Privacy Policy
            </Link>
            <span>&middot;</span>
            <Link href="/terms" className="hover:text-[var(--color-ink)] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT HALF: Full-Bleed Editorial Visual Art */}
      <div className="hidden lg:flex lg:w-1/2 h-full max-h-screen relative overflow-hidden bg-black select-none border-l border-[var(--color-line)]">
        <Image
          src="/login-hero.jpg"
          alt="Atom & Echo Editorial Art"
          fill
          priority
          sizes="50vw"
          className="object-cover object-center scale-[1.01]"
        />

        {/* Subtle dark ambient gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

        {/* Right side floating editorial statement */}
        <div className="absolute bottom-8 left-8 right-8 z-10 space-y-2 text-white/90">
          <div className="font-sans tabular-nums text-[9.5px] tracking-wider uppercase text-[#a8aaa3]">
            Atom &amp; Echo &middot; Personal Branding for the Unapologetically Ambitious
          </div>
          <p className="font-display text-lg sm:text-2xl font-normal leading-snug tracking-tight text-[#f4f5f0] max-w-md">
            Ambition deserves a <em>voice.</em> Keep the edges.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs select-none animate-in">
          <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] p-6 shadow-dialog space-y-4 text-[var(--color-ink)]">
            <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2.5">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-[var(--color-accent)]" />
                <span className="font-display text-sm font-normal text-[var(--color-ink)]">
                  Reset Password
                </span>
              </div>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="rounded-[var(--radius-xs)] p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {resetSent ? (
              <div className="space-y-4 text-center py-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-ok-bg)] text-[var(--color-ok-text)] border border-[var(--color-ok-line)]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-[var(--color-ink)]">
                    Password Reset Link Sent
                  </div>
                  <p className="text-[11px] text-[var(--color-ink-secondary)] leading-relaxed">
                    We sent a password recovery link to <span className="font-medium text-[var(--color-ink)]">{resetEmail}</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="btn btn-primary w-full text-xs py-2"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendPasswordReset} className="space-y-3.5">
                <p className="text-[11.5px] text-[var(--color-ink-secondary)] leading-relaxed">
                  Enter your work email address and we&apos;ll send you instructions to reset your password.
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-sans tabular-nums text-[var(--color-ink-secondary)] block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@atomandecho.com"
                    className="input text-xs w-full py-2"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="btn btn-secondary flex-1 text-xs py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetSending || !resetEmail.trim()}
                    className="btn btn-primary flex-1 text-xs py-2 disabled:opacity-50"
                  >
                    {isResetSending ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send Link</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
