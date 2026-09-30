"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Archive, ExternalLink } from "lucide-react";
import { formatDisplayDateIST } from "@/lib/date-utils";

export interface StudioMatrixArchiveProps {
  clientId: string;
  clientName: string;
  posts: any[];
}

export function StudioMatrixArchive({
  clientId,
  clientName,
  posts,
}: StudioMatrixArchiveProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (posts.length === 0) return null;

  return (
    <div className="pt-2 border-t border-[var(--color-line-subtle)]/60">
      <div className="p-2.5 rounded-[var(--radius-xs)] border border-[var(--color-line-subtle)] bg-[var(--color-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[var(--color-ink-secondary)]">
          <Archive className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)] shrink-0" />
          <span className="font-medium tabular-nums">
            {posts.length} Historical Published Perspectives
          </span>
          <span className="text-[var(--color-ink-tertiary)] text-[11px]">
            (Completed lifetime archive)
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="text-[var(--color-ink)] hover:underline text-xs cursor-pointer font-medium"
          >
            {isOpen ? "Collapse Archive" : `View ${posts.length} Archived Posts`}
          </button>
          <span className="text-[var(--color-line-strong)]">·</span>
          <Link
            href={`/clients/${clientId}`}
            className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] text-xs inline-flex items-center gap-1 font-medium"
          >
            <span>Client Dossier</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Expandable Compact Archive Table */}
      {isOpen && (
        <div className="mt-2 max-h-56 overflow-y-auto divide-y divide-[var(--color-line-subtle)] rounded border border-[var(--color-line-subtle)] bg-[var(--color-surface)]">
          {posts.map((post) => (
            <div
              key={post.id}
              className="px-3 py-2 flex items-center justify-between gap-3 text-xs hover:bg-[var(--color-base-subtle)]/20 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-[10.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)] shrink-0">
                  {formatDisplayDateIST(post.published_at || post.created_at)}
                </span>
                <Link
                  href={`/content/${post.id}?from=content`}
                  className="text-[var(--color-ink)] hover:underline truncate"
                >
                  {post.title}
                </Link>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {post.linkedin_post_url && (
                  <a
                    href={post.linkedin_post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1"
                    title="View live post on LinkedIn"
                  >
                    <span>Live</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
                <Link
                  href={`/content/${post.id}?from=content`}
                  className="text-[11px] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
                >
                  Edit &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
