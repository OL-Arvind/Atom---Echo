"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, KeyRound, Sparkles, X } from "lucide-react";
import { setStoredUser, DUMMY_USERS } from "@/lib/auth/dummy-auth";

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("sudeesh@atomandecho.com");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetSending, setIsResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [selectedUserKey, setSelectedUserKey] = useState<"sudeesh" | "nikhil">("sudeesh");

  const handleGoogleSignIn = () => {
    setIsGoogleLoading(true);
    setTimeout(() => {
      const userToLogin = DUMMY_USERS[selectedUserKey] || DUMMY_USERS.sudeesh;
      setStoredUser(userToLogin);
      setIsGoogleLoading(false);
      router.push("/command-center");
    }, 800);
  };

  const handleEmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setTimeout(() => {
      const userToLogin =
        email.toLowerCase().includes("nikhil")
          ? DUMMY_USERS.nikhil
          : DUMMY_USERS.sudeesh;
      setStoredUser(userToLogin);
      setIsEmailLoading(false);
      router.push("/command-center");
    }, 700);
  };

  const handleSendPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setIsResetSending(true);
    setTimeout(() => {
      setIsResetSending(false);
      setResetSent(true);
    }, 800);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col lg:flex-row bg-[var(--color-base)] text-[var(--color-ink)] select-none overflow-hidden">
      {/* LEFT HALF: Primary Authentication Interface */}
      <div className="w-full lg:w-1/2 h-full flex flex-col justify-between p-6 sm:p-8 lg:px-12 lg:py-6 xl:px-16 xl:py-7 z-10 overflow-y-auto lg:overflow-hidden">
        {/* Top: Brand Header */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-black border border-[var(--color-line)] shadow-xs overflow-hidden shrink-0">
            <Image
              src="/logo.png"
              alt="Atom & Echo"
              width={28}
              height={28}
              priority
              className="object-cover w-full h-full"
            />
          </div>
          <span className="font-sans font-semibold text-sm tracking-tight text-[var(--color-ink)]">
            Atom &amp; Echo
          </span>
        </div>

        {/* Center: Main Sign-In Form */}
        <div className="w-full max-w-[350px] mx-auto my-auto py-2 space-y-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl sm:text-[26px] font-normal tracking-tight text-[var(--color-ink)] leading-tight">
              Welcome back
            </h1>
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
              Sign in to access your command center and client accounts.
            </p>
          </div>

          {/* Google Sign In Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isEmailLoading}
              className="flex w-full items-center justify-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] bg-[var(--color-base-overlay)] px-3.5 py-2 text-xs font-medium text-[var(--color-ink)] shadow-2xs hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-ink-muted)] transition-all cursor-pointer disabled:opacity-50"
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
            <span className="absolute bg-[var(--color-base)] px-2 text-[9.5px] font-mono uppercase tracking-wider text-[var(--color-ink-muted)]">
              or with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-2.5">
            <div className="space-y-1">
              <label className="text-[10.5px] font-mono text-[var(--color-ink-secondary)] block">
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
                <label className="text-[10.5px] font-mono text-[var(--color-ink-secondary)] block">
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
              className="btn btn-primary w-full py-2 text-xs mt-1 disabled:opacity-50"
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

          {/* Quick Demo Switcher */}
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/40 p-2 space-y-1">
            <div className="flex items-center justify-between text-[9.5px]">
              <span className="font-mono text-[var(--color-ink-secondary)] font-medium">
                Demo Accounts
              </span>
              <span className="font-mono text-[8.5px] text-[var(--color-ink-muted)]">
                [Preview]
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedUserKey("sudeesh");
                  setEmail(DUMMY_USERS.sudeesh.email);
                }}
                className={`rounded-[var(--radius-xs)] border px-2 py-1 text-left text-[10.5px] transition-colors cursor-pointer ${
                  selectedUserKey === "sudeesh"
                    ? "border-[var(--color-accent-line)] bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] font-medium"
                    : "border-[var(--color-line)] bg-[var(--color-base)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <div className="font-medium truncate leading-tight">Sudeesh D S</div>
                <div className="text-[8.5px] opacity-75 truncate leading-tight">Founder · Admin</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedUserKey("nikhil");
                  setEmail(DUMMY_USERS.nikhil.email);
                }}
                className={`rounded-[var(--radius-xs)] border px-2 py-1 text-left text-[10.5px] transition-colors cursor-pointer ${
                  selectedUserKey === "nikhil"
                    ? "border-[var(--color-accent-line)] bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] font-medium"
                    : "border-[var(--color-line)] bg-[var(--color-base)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-hover)]"
                }`}
              >
                <div className="font-medium truncate leading-tight">Nikhil</div>
                <div className="text-[8.5px] opacity-75 truncate leading-tight">Operations Lead</div>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom: Subtle Status Notice */}
        <div className="flex items-center justify-between text-[10px] text-[var(--color-ink-tertiary)] font-mono pt-3 border-t border-[var(--color-line-subtle)] shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[var(--color-accent)]" />
            <span>Google SSO &amp; Auth Coming Soon</span>
          </div>
          <span>Atom &amp; Echo OS</span>
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
          <div className="font-mono text-[9.5px] tracking-wider uppercase text-white/60">
            Atom &amp; Echo &middot; Execution Atelier
          </div>
          <p className="font-display text-lg sm:text-xl font-normal leading-snug tracking-tight text-white/95 max-w-md">
            The operating system for founder thought leadership and outbound momentum.
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
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-ok-bg)] text-[var(--color-ok-text)] border border-[var(--color-ok-line)]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-[var(--color-ink)]">
                    Password Reset Link Sent
                  </div>
                  <p className="text-[11px] text-[var(--color-ink-secondary)] leading-relaxed">
                    We sent a password recovery link to <span className="font-medium text-[var(--color-ink)]">{resetEmail}</span> (preview simulated).
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
                  <label className="text-[10px] font-mono text-[var(--color-ink-secondary)] block">
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
