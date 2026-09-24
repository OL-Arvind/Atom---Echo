"use client";

import { useState } from "react";
import Image from "next/image";

export const BRANDFETCH_CLIENT_ID = "1idu7B93bjQkWT9NL3V";

const KNOWN_PLATFORMS: Record<string, string> = {
  heyreach: "heyreach.io",
  clay: "clay.com",
  apollo: "apollo.io",
  instantly: "instantly.ai",
  smartlead: "smartlead.ai",
  linkedin: "linkedin.com",
  google: "google.com",
  gmail: "google.com",
  twitter: "x.com",
  x: "x.com",
  baseworks: "baseworks.in",
  openai: "openai.com",
  chatgpt: "openai.com",
  claude: "anthropic.com",
  anthropic: "anthropic.com",
  slack: "slack.com",
  whatsapp: "whatsapp.com",
  stripe: "stripe.com",
  github: "github.com",
  notion: "notion.so",
  hubspot: "hubspot.com",
  figma: "figma.com",
  substack: "substack.com",
  medium: "medium.com",
  wordpress: "wordpress.org",
  webflow: "webflow.com",
  make: "make.com",
  zapier: "zapier.com",
  airtable: "airtable.com",
  postmark: "postmarkapp.com",
  sendgrid: "sendgrid.com",
  resend: "resend.com",
  lemwarm: "lemlist.com",
  lemlist: "lemlist.com",
  phantombuster: "phantombuster.com",
  brevo: "brevo.com",
  loom: "loom.com",
  canva: "canva.com",
  clickup: "clickup.com",
  linear: "linear.app",
  supabase: "supabase.com",
  vercel: "vercel.com",
};

const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
]);

export function resolveBrandDomain(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check if input matches or contains any known platform as a distinct word or token
  // e.g. "Heyreach — testing", "Clay (Prospecting)", "Smartlead warmup"
  for (const [key, domain] of Object.entries(KNOWN_PLATFORMS)) {
    const wordPattern = new RegExp(`(^|[^a-z0-9])${key}([^a-z0-9]|$)`, "i");
    if (wordPattern.test(lower)) {
      return domain;
    }
  }

  // 2. If it's an email (e.g. founder@baseworks.in)
  if (lower.includes("@")) {
    const parts = lower.split("@");
    const domainPart = parts[1]?.trim();
    if (domainPart && !GENERIC_EMAIL_DOMAINS.has(domainPart)) {
      return domainPart;
    }
    return null;
  }

  // 3. If it's a full URL
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      return url.hostname.replace(/^www\./, "");
    } catch {
      // Fall through
    }
  }

  // 4. Remove common punctuation or noisy characters
  const sanitized = lower.replace(/[^\w.-]/g, "");

  // 5. If already has a valid domain extension or dot
  if (sanitized.includes(".") && !sanitized.endsWith(".")) {
    return sanitized;
  }

  // 6. Direct lookup on sanitized
  if (KNOWN_PLATFORMS[sanitized]) {
    return KNOWN_PLATFORMS[sanitized];
  }

  // 7. Fallback to appending .com if alphanumeric
  if (sanitized && /^[a-z0-9-]+$/.test(sanitized)) {
    return `${sanitized}.com`;
  }

  return null;
}

interface BrandLogoProps {
  /** Brand, tool, company name, or domain (e.g. "Heyreach", "clay.com", "aravind@baseworks.in") */
  nameOrDomain: string;
  size?: number;
  className?: string;
  alt?: string;
  fallback?: React.ReactNode;
}

export function BrandLogo({
  nameOrDomain,
  size = 20,
  className = "rounded-[4px]",
  alt,
  fallback,
}: BrandLogoProps) {
  const [hasError, setHasError] = useState(false);
  const domain = resolveBrandDomain(nameOrDomain);

  if (!domain || hasError) {
    if (fallback) return <>{fallback}</>;

    const initial = (nameOrDomain || "?").trim().charAt(0).toUpperCase();
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-[var(--radius-xs)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[10.5px] font-mono font-medium text-[var(--color-ink-secondary)] shrink-0 select-none ${className}`}
      >
        {initial}
      </div>
    );
  }

  const retina = size * 2;
  const logoUrl = `https://cdn.brandfetch.io/domain/${domain}/w/${retina}/h/${retina}/type/icon/fallback/lettermark?c=${BRANDFETCH_CLIENT_ID}`;

  return (
    <Image
      src={logoUrl}
      alt={alt || `${nameOrDomain} logo`}
      width={size}
      height={size}
      onError={() => setHasError(true)}
      className={`object-contain shrink-0 bg-white ${className}`}
      unoptimized
    />
  );
}
