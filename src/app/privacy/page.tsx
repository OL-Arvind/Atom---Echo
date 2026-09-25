import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy · Atom & Echo OS",
  description: "Privacy Policy and data handling practices for Atom & Echo Operating System.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--color-base)] text-[var(--color-ink)] selection:bg-[var(--color-accent-bg)] selection:text-[var(--color-accent-text)]">
      {/* Header */}
      <header className="border-b border-[var(--color-line-subtle)] bg-[var(--color-base-raised)]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/login" className="flex items-center group">
            <Image
              src="/brand-wordmark-dark.svg"
              alt="Atom & Echo"
              width={76}
              height={28}
              unoptimized
              className="theme-logo-light object-contain h-[28px] w-auto select-none"
            />
            <Image
              src="/brand-wordmark-white.svg"
              alt="Atom & Echo"
              width={76}
              height={28}
              unoptimized
              className="theme-logo-dark object-contain h-[28px] w-auto select-none"
            />
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-10">
        <div className="space-y-3 border-b border-[var(--color-line)] pb-8">
          <div className="flex items-center gap-2 text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            <span>Legal &amp; Data Protection</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-[var(--color-ink)]">
            Privacy Policy
          </h1>
          <p className="text-xs font-sans tabular-nums text-[var(--color-ink-tertiary)]">
            Effective Date: September 25, 2026 &middot; Operated by Atom &amp; Echo (BaseWorks)
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--color-ink-secondary)]">
          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              1. Overview &amp; Scope
            </h2>
            <p>
              Atom &amp; Echo OS (&ldquo;the Platform&rdquo;, accessible at{" "}
              <span className="text-[var(--color-ink)]">ane.baseworks.in</span>) is a private
              internal operating system and client review portal built for Atom &amp; Echo to manage
              executive personal branding, content pipelines, outbound growth campaigns, and agency
              billing operations. This Privacy Policy describes how we collect, use, store, and
              protect personal data when operators and authorized founder clients interact with the
              Platform.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              2. Information We Collect via Google OAuth &amp; Authentication
            </h2>
            <p>
              When you sign in using Google OAuth (&ldquo;Continue with Google&rdquo;) or work email
              credentials through Supabase Authentication, we receive and store only the minimum
              profile information required to verify your identity and provision workspace access:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[var(--color-ink-secondary)]">
              <li>
                <strong className="text-[var(--color-ink)] font-medium">Basic Identity Data:</strong>{" "}
                Your full name, verified work email address, and profile avatar URL provided by
                Google OAuth.
              </li>
              <li>
                <strong className="text-[var(--color-ink)] font-medium">
                  Session &amp; Security Audit Metadata:
                </strong>{" "}
                Authentication timestamps, IP address, and browser user-agent strings recorded
                strictly for security auditing (such as Credential Vault unmasking or password copy
                events).
              </li>
            </ul>
            <p>
              We do <strong className="text-[var(--color-ink)] font-medium">not</strong> request
              read or write access to your personal Google Drive, Gmail messages, Google Contacts, or
              Google Calendar via the sign-in flow.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              3. How We Use Your Information
            </h2>
            <p>We use collected information solely for internal operational purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Authenticating authorized Atom &amp; Echo team members and administrators.</li>
              <li>
                Attributing operational actions, editorial approvals, and Credential Vault audit
                trails to specific authenticated operators.
              </li>
              <li>
                Providing tokenized 1-tap content review portals for active founder clients.
              </li>
              <li>
                Managing retainer billing schedules, pass-through software expenses, and client
                communications.
              </li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              4. Credential Vault &amp; Encryption Standards
            </h2>
            <p>
              Client platform credentials stored within the Atom &amp; Echo Credential Vault are
              encrypted at rest using authenticated{" "}
              <strong className="text-[var(--color-ink)] font-medium">AES-256-GCM</strong>{" "}
              encryption prior to database persistence. Every credential reveal or clipboard copy
              action generates an immutable audit entry logging the operator identity, timestamp,
              and network origin.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              5. Data Sharing &amp; Third-Party Infrastructure
            </h2>
            <p>
              We never sell, rent, or trade personal or client data. Data is processed exclusively
              through our core infrastructure providers bound by strict confidentiality and data
              protection agreements:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-[var(--color-ink)] font-medium">Supabase:</strong> Managed
                PostgreSQL database and OAuth authentication infrastructure.
              </li>
              <li>
                <strong className="text-[var(--color-ink)] font-medium">Google Cloud Platform:</strong>{" "}
                Identity verification via Google OAuth 2.0.
              </li>
              <li>
                <strong className="text-[var(--color-ink)] font-medium">Vercel / BaseWorks Cloud:</strong>{" "}
                Edge application hosting and TLS termination.
              </li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              6. Data Retention &amp; Deletion Requests
            </h2>
            <p>
              Operational records and client context data are retained for the duration of an active
              client engagement. Operators or clients may request access to, correction of, or
              permanent deletion of their account data and stored credentials at any time by
              contacting the system administrator.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              7. Contact Information
            </h2>
            <p>
              For privacy inquiries, OAuth verification questions, or data removal requests, please
              contact:
            </p>
            <div className="border-l-2 border-[var(--color-line-strong)] pl-3.5 py-1.5 text-xs text-[var(--color-ink)] space-y-1">
              <div className="font-medium">Atom &amp; Echo · BaseWorks Engineering</div>
              <div className="text-[var(--color-ink-secondary)]">
                Email: sudeesh@atomandecho.com &middot; Domain: https://ane.baseworks.in
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="pt-8 border-t border-[var(--color-line-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--color-ink-tertiary)]">
          <span>&copy; {new Date().getFullYear()} Atom &amp; Echo. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-[var(--color-ink)] font-medium">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[var(--color-ink)] transition-colors">
              Terms of Service
            </Link>
            <Link href="/login" className="hover:text-[var(--color-ink)] transition-colors">
              Operator Sign In
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
