import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service · Atom & Echo OS",
  description: "Terms of Service and acceptable use policy for Atom & Echo Operating System.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--color-base)] text-[var(--color-ink)] selection:bg-[var(--color-accent-bg)] selection:text-[var(--color-accent-text)]">
      {/* Header */}
      <header className="border-b border-[var(--color-line-subtle)] bg-[var(--color-base-raised)]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/login" className="flex items-center group">
            <Image
              src="/brand-wordmark-white.svg"
              alt="Atom & Echo"
              width={76}
              height={28}
              unoptimized
              className="object-contain h-[28px] w-auto select-none"
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
            <span>Workspace Governance</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-[var(--color-ink)]">
            Terms of Service
          </h1>
          <p className="text-xs font-sans tabular-nums text-[var(--color-ink-tertiary)]">
            Effective Date: September 25, 2026 &middot; Operated by Atom &amp; Echo (BaseWorks)
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--color-ink-secondary)]">
          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or signing into Atom &amp; Echo OS (<span className="text-[var(--color-ink)]">ane.baseworks.in</span>),
              you agree to be bound by these Terms of Service and our{" "}
              <Link href="/privacy" className="text-[var(--color-accent)] hover:underline">
                Privacy Policy
              </Link>
              . Atom &amp; Echo OS is a proprietary operational platform restricted to authorized
              Atom &amp; Echo personnel, contractors, and invited founder clients.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              2. Authorized Access &amp; Account Security
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="text-[var(--color-ink)] font-medium">Operator Accounts:</strong>{" "}
                Internal workspace access requires authentication via Google OAuth or authorized
                work credentials. You are responsible for maintaining the security of your Google
                Workspace or email account.
              </li>
              <li>
                <strong className="text-[var(--color-ink)] font-medium">Client Review Links:</strong>{" "}
                External founder review portals are protected by time-bound cryptographic tokens.
                Clients must not share active review links publicly.
              </li>
              <li>
                <strong className="text-[var(--color-ink)] font-medium">Audit Logging:</strong>{" "}
                All sensitive actions—including credential unmasking, emergency publishing holds,
                and invoice approvals—are logged with operator attribution and timestamps.
              </li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              3. Confidentiality &amp; Intellectual Property
            </h2>
            <p>
              All founder positioning frameworks, draft posts, voice guidelines, campaign metrics,
              and client credentials stored inside Atom &amp; Echo OS are strictly confidential.
              Content created for clients remains subject to the intellectual property provisions of
              each client&apos;s respective Master Services Agreement (MSA) with Atom &amp; Echo.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              4. Acceptable Use
            </h2>
            <p>
              Users agree not to attempt unauthorized access, bypass authentication controls, share
              decrypted client credentials outside approved execution workflows, or use automated
              scraping tools against the Platform.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              5. Service Availability &amp; Limitation of Liability
            </h2>
            <p>
              The Platform is provided on an &ldquo;as-is&rdquo; operational basis to support Atom
              &amp; Echo agency workflows. While we maintain high-availability infrastructure and
              automated backups, Atom &amp; Echo and BaseWorks shall not be liable for indirect or
              consequential damages arising from temporary scheduled maintenance or third-party API
              interruptions.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-normal text-[var(--color-ink)]">
              6. Contact
            </h2>
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
            <Link href="/privacy" className="hover:text-[var(--color-ink)] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[var(--color-ink)] font-medium">
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
