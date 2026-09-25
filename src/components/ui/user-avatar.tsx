"use client";

import Avatar from "boring-avatars";

// Calibrated luxury editorial palette tailored for Atom & Echo dark obsidian surfaces
const BASE_PALETTE = ["#F59E0B", "#10B981", "#6366F1", "#EC4899", "#F97316"];

interface UserAvatarProps {
  /** Deterministic string seed (e.g. name, email, or founder handle) */
  seed: string;
  /** Optional real profile image URL (e.g. from Google OAuth or manual upload) */
  src?: string | null;
  size?: number;
  /** Boring Avatars variants: beam (expressive face), marble, sunset, bauhaus, pixel, ring */
  variant?: "beam" | "marble" | "pixel" | "sunset" | "bauhaus" | "ring";
  className?: string;
  alt?: string;
  colors?: string[];
  square?: boolean;
}

export function UserAvatar({
  seed,
  src,
  size = 28,
  variant = "beam",
  className = "rounded-[6px]",
  alt,
  colors = BASE_PALETTE,
  square = true,
}: UserAvatarProps) {
  const normalizedSeed = (seed || "AtomEcho").trim();

  // If a custom image source is explicitly provided and valid, show the photo
  if (src) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative overflow-hidden bg-[var(--color-base-overlay)] border border-[var(--color-line-strong)] flex items-center justify-center shrink-0 select-none ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt || normalizedSeed || "Avatar"}
          width={size}
          height={size}
          className="w-full h-full object-contain p-[2px]"
        />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative overflow-hidden border border-[var(--color-line)] flex items-center justify-center shrink-0 select-none ${className}`}
    >
      <Avatar
        size={size}
        name={normalizedSeed}
        variant={variant}
        colors={colors}
        square={square}
      />
    </div>
  );
}
