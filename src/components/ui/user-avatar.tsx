"use client";

import { useMemo } from "react";
import multiavatar from "@multiavatar/multiavatar/esm";

const SVG_DATA_URI_CACHE = new Map<string, string>();

export function getMultiavatarDataUri(seed: string, sansEnv = true): string {
  const normalizedSeed = (seed || "AtomEchoUser").trim();
  const cacheKey = `${normalizedSeed}::${sansEnv ? "1" : "0"}`;
  const cached = SVG_DATA_URI_CACHE.get(cacheKey);
  if (cached) return cached;

  const svg = multiavatar(normalizedSeed, sansEnv);
  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  SVG_DATA_URI_CACHE.set(cacheKey, uri);
  return uri;
}

interface UserAvatarProps {
  /** Deterministic string seed (e.g. name, email, or founder handle) */
  seed: string;
  /** Optional real profile image URL (e.g. from Google OAuth) */
  src?: string | null;
  size?: number;
  /** Strip the Multiavatar colored circle background so it sits on our dark obsidian surface */
  sansEnv?: boolean;
  className?: string;
  alt?: string;
}

export function UserAvatar({
  seed,
  src,
  size = 28,
  sansEnv = true,
  className = "rounded-[6px]",
  alt,
}: UserAvatarProps) {
  const dataUri = useMemo(() => getMultiavatarDataUri(seed, sansEnv), [seed, sansEnv]);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative overflow-hidden bg-[var(--color-base-overlay)] border border-[var(--color-line-strong)] flex items-center justify-center shrink-0 select-none ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || dataUri}
        alt={alt || seed || "Avatar"}
        width={size}
        height={size}
        className="w-full h-full object-contain p-[2px]"
      />
    </div>
  );
}
