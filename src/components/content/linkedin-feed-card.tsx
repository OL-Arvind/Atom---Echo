"use client";

import { useState, useMemo } from "react";
import {
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Send,
  Globe,
  Monitor,
  Smartphone,
  ArrowUpRight,
  ChevronUp,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LinkedInIcon } from "@/components/ui/linkedin-icon";

export interface LinkedInFeedCardProps {
  authorName: string;
  authorTitle?: string;
  authorAvatarSeed?: string;
  linkedinUrl?: string;
  bodyMarkdown: string;
  statusLabel?: string;
  showModeToggle?: boolean;
  initialMode?: "desktop" | "mobile";
  showDiagnostics?: boolean;
  showActionButtons?: boolean;
  className?: string;
}

export interface FoldInfo {
  isOverFold: boolean;
  hookText: string;
  charCount: number;
  wordCount: number;
  charLimit: number;
  estimatedLines: number;
  fitsMobileFold: boolean;
  mobileCutoff: number;
}

/**
 * Calculates LinkedIn feed 3-line truncation.
 * On Desktop: ~550px width, ~76-80 chars/line, 3 lines = ~210 chars.
 * On Mobile: ~375px width, ~40-44 chars/line, 3 lines = ~130-140 chars.
 * Any newline (\n) counts as a full vertical line.
 */
export function computeLinkedInFold(text: string, isMobile: boolean): FoldInfo {
  const cleanText = (text || "").trim();
  const charCount = cleanText.length;
  const words = cleanText ? cleanText.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const charsPerLine = isMobile ? 42 : 78;
  const maxLines = 3;
  const maxChars = isMobile ? 140 : 210;

  // Split into raw lines to honor hard returns (\n)
  const rawLines = cleanText.split("\n");
  let totalVisualLines = 0;
  let foldCutIndex = cleanText.length;
  let reachedFold = false;

  let currentPos = 0;
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    // An empty line takes 1 full vertical line budget
    const visualLinesForThisBlock = line.length === 0 ? 1 : Math.max(1, Math.ceil(line.length / charsPerLine));

    if (totalVisualLines + visualLinesForThisBlock > maxLines) {
      const allowedLinesInThisBlock = Math.max(0, maxLines - totalVisualLines);
      const allowedChars = allowedLinesInThisBlock * charsPerLine;
      foldCutIndex = currentPos + allowedChars;
      reachedFold = true;
      break;
    }

    totalVisualLines += visualLinesForThisBlock;
    currentPos += line.length + 1; // +1 for \n

    if (currentPos >= maxChars && !reachedFold) {
      foldCutIndex = Math.min(foldCutIndex, maxChars);
      reachedFold = true;
      break;
    }
  }

  if (foldCutIndex > maxChars) {
    foldCutIndex = maxChars;
    reachedFold = true;
  }

  const isOverFold = cleanText.length > foldCutIndex;

  let hookText = cleanText;
  if (isOverFold) {
    let sliceEnd = foldCutIndex;
    const spaceBefore = cleanText.lastIndexOf(" ", sliceEnd);
    if (spaceBefore > sliceEnd - 18 && spaceBefore > 15) {
      sliceEnd = spaceBefore;
    }
    hookText = cleanText.slice(0, sliceEnd).trimEnd();
  }

  // Quick check if entire post fits mobile fold without truncation
  const fitsMobileFold = cleanText.length <= 140 && rawLines.length <= 3;

  return {
    isOverFold,
    hookText,
    charCount,
    wordCount,
    charLimit: maxChars,
    estimatedLines: Math.max(1, totalVisualLines),
    fitsMobileFold,
    mobileCutoff: 140,
  };
}

export function LinkedInFeedCard({
  authorName,
  authorTitle,
  authorAvatarSeed,
  linkedinUrl,
  bodyMarkdown,
  statusLabel,
  showModeToggle = true,
  initialMode = "desktop",
  showDiagnostics = true,
  showActionButtons = true,
  className = "",
}: LinkedInFeedCardProps) {
  const [mode, setMode] = useState<"desktop" | "mobile">(initialMode);
  const [isExpanded, setIsExpanded] = useState(false);

  const isMobile = mode === "mobile";
  const fold = useMemo(() => computeLinkedInFold(bodyMarkdown, isMobile), [bodyMarkdown, isMobile]);
  const readingTimeMin = Math.max(1, Math.ceil(fold.wordCount / 200));

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Top Controls: Device Toggle & Hook Diagnostics */}
      {showModeToggle && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs py-0.5">
          {/* Device Toggle Pills */}
          <div className="inline-flex items-center p-0.5 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] text-[var(--color-ink-muted)]">
            <button
              type="button"
              onClick={() => {
                setMode("desktop");
                setIsExpanded(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                mode === "desktop"
                  ? "bg-[var(--color-base-overlay)] text-[var(--color-ink)] shadow-2xs font-semibold"
                  : "hover:text-[var(--color-ink)]"
              }`}
              title="Preview on LinkedIn Desktop feed (~550px wide, ~210 chars fold)"
            >
              <Monitor size={12} strokeWidth={2} />
              <span>Desktop</span>
              <span className="text-[9.5px] tabular-nums text-[var(--color-ink-muted)] font-normal">
                (~210c)
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("mobile");
                setIsExpanded(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                mode === "mobile"
                  ? "bg-[var(--color-base-overlay)] text-[var(--color-ink)] shadow-2xs font-semibold"
                  : "hover:text-[var(--color-ink)]"
              }`}
              title="Preview on LinkedIn Mobile feed (~375px wide, ~140 chars fold)"
            >
              <Smartphone size={12} strokeWidth={2} />
              <span>Mobile App</span>
              <span className="text-[9.5px] tabular-nums text-[var(--color-ink-muted)] font-normal">
                (~140c)
              </span>
            </button>
          </div>

          {/* Hook Status Badge */}
          {showDiagnostics && (
            <div className="flex items-center gap-2 text-[11px] font-sans">
              {fold.fitsMobileFold ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Hook fits mobile fold</span>
                </span>
              ) : fold.isOverFold ? (
                <span className="text-amber-400 flex items-center gap-1 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>Clipped at 3 lines ({mode === "mobile" ? "~140 chars" : "~210 chars"})</span>
                </span>
              ) : (
                <span className="text-[var(--color-ink-muted)] flex items-center gap-1">
                  <span>Fits within 3 lines</span>
                </span>
              )}

              <span className="text-[var(--color-line-strong)]">|</span>
              <span className="tabular-nums text-[var(--color-ink-tertiary)]">
                {fold.wordCount} words &middot; {fold.charCount} chars &middot; {readingTimeMin} min read
              </span>
            </div>
          )}
        </div>
      )}

      {/* The Actual Simulated LinkedIn Feed Card */}
      <div
        className={`transition-all duration-200 card overflow-hidden ${
          isMobile ? "max-w-[390px] mx-auto" : "w-full"
        }`}
      >
        {/* Post Author Header */}
        <div className="px-4 py-3 flex items-start justify-between gap-3 border-b border-[var(--color-line-subtle)]">
          <div className="flex items-start gap-2.5 min-w-0">
            {linkedinUrl ? (
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2.5 hover:opacity-95 transition-opacity min-w-0"
                title={`Open ${authorName}'s LinkedIn Profile`}
              >
                <UserAvatar
                  seed={authorAvatarSeed || authorName}
                  size={isMobile ? 34 : 38}
                  className="rounded-full ring-1 ring-[var(--color-line-strong)] shrink-0"
                />
                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-[13.5px] text-[var(--color-ink)] group-hover:underline underline-offset-2 truncate">
                      {authorName}
                    </span>
                    <LinkedInIcon size={12} color="brand" className="shrink-0" />
                    <span className="text-[11px] font-sans text-[var(--color-ink-muted)] font-normal">
                      &middot; 1st
                    </span>
                    <ArrowUpRight className="h-3 w-3 text-[var(--color-ink-muted)] opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[11.5px] text-[var(--color-ink-secondary)] truncate max-w-md mt-0.5">
                    {authorTitle || "Founder & Executive Leader"}
                  </p>
                  <p className="text-[10.5px] text-[var(--color-ink-muted)] flex items-center gap-1 mt-1 font-sans">
                    <span>Just now</span>
                    <span>&middot;</span>
                    <Globe size={10} className="shrink-0 text-[var(--color-ink-muted)]" />
                  </p>
                </div>
              </a>
            ) : (
              <div className="flex items-start gap-2.5 min-w-0">
                <UserAvatar
                  seed={authorAvatarSeed || authorName}
                  size={isMobile ? 34 : 38}
                  className="rounded-full ring-1 ring-[var(--color-line-strong)] shrink-0"
                />
                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-[13.5px] text-[var(--color-ink)] truncate">
                      {authorName}
                    </span>
                    <LinkedInIcon size={12} color="brand" className="shrink-0" />
                    <span className="text-[11px] font-sans text-[var(--color-ink-muted)] font-normal">
                      &middot; 1st
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[var(--color-ink-secondary)] truncate max-w-md mt-0.5">
                    {authorTitle || "Founder & Executive Leader"}
                  </p>
                  <p className="text-[10.5px] text-[var(--color-ink-muted)] flex items-center gap-1 mt-1 font-sans">
                    <span>Just now</span>
                    <span>&middot;</span>
                    <Globe size={10} className="shrink-0 text-[var(--color-ink-muted)]" />
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Status Indicator */}
          {statusLabel && (
            <div className="flex items-center gap-2 shrink-0 pt-0.5">
              <span className="text-[10px] uppercase font-sans tracking-wider text-[var(--color-ink-muted)] font-medium">
                {statusLabel}
              </span>
            </div>
          )}
        </div>

        {/* Post Text Body with Precise 3-Line Cutoff */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 text-[14px] leading-relaxed text-[var(--color-ink)] font-sans">
          {bodyMarkdown ? (
            <div>
              {fold.isOverFold && !isExpanded ? (
                <div className="whitespace-pre-line select-text">
                  <span>{fold.hookText}</span>
                  <button
                    type="button"
                    onClick={() => setIsExpanded(true)}
                    className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:underline font-semibold ml-1 cursor-pointer transition-colors inline-flex items-center gap-0.5"
                    title="Click to view full post content"
                  >
                    <span>...more</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="whitespace-pre-line select-text leading-relaxed">
                    {bodyMarkdown}
                  </div>
                  {fold.isOverFold && (
                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      className="text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:underline cursor-pointer flex items-center gap-1 pt-1 transition-colors"
                    >
                      <ChevronUp size={13} />
                      <span>Show less</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-[var(--color-ink-muted)] italic">
              No draft content written yet.
            </p>
          )}
        </div>

        {/* Action Bar: Like, Comment, Repost, Send (Only when showActionButtons is true) */}
        {showActionButtons && (
          <div className="border-t border-[var(--color-line)] px-2 py-1 bg-[var(--color-base-subtle)]/40 flex items-center justify-between text-xs text-[var(--color-ink-secondary)] font-sans">
            <button
              type="button"
              className="flex-1 py-1.5 rounded-md hover:bg-[var(--color-base-subtle)] transition-colors flex items-center justify-center gap-1.5 font-medium cursor-pointer"
            >
              <ThumbsUp size={13} className="text-[var(--color-ink-tertiary)]" />
              <span className="hidden sm:inline">Like</span>
            </button>

            <button
              type="button"
              className="flex-1 py-1.5 rounded-md hover:bg-[var(--color-base-subtle)] transition-colors flex items-center justify-center gap-1.5 font-medium cursor-pointer"
            >
              <MessageSquare size={13} className="text-[var(--color-ink-tertiary)]" />
              <span className="hidden sm:inline">Comment</span>
            </button>

            <button
              type="button"
              className="flex-1 py-1.5 rounded-md hover:bg-[var(--color-base-subtle)] transition-colors flex items-center justify-center gap-1.5 font-medium cursor-pointer"
            >
              <Repeat2 size={13} className="text-[var(--color-ink-tertiary)]" />
              <span className="hidden sm:inline">Repost</span>
            </button>

            <button
              type="button"
              className="flex-1 py-1.5 rounded-md hover:bg-[var(--color-base-subtle)] transition-colors flex items-center justify-center gap-1.5 font-medium cursor-pointer"
            >
              <Send size={13} className="text-[var(--color-ink-tertiary)]" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
