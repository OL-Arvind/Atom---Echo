"use client";

import React, { useMemo } from "react";

interface FormattedTranscriptViewProps {
  text: string;
}

/**
 * Formats raw transcript lines so speaker labels and timestamps
 * are scannable instead of a flat wall of plain text.
 */
export function FormattedTranscriptView({ text }: FormattedTranscriptViewProps) {
  const lines = useMemo(() => text.split("\n"), [text]);

  return (
    <div className="space-y-1.5 font-sans text-xs leading-relaxed text-[var(--color-ink-secondary)]">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={i} className="h-1.5" />;
        }

        // Match optional [00:12] timestamp + Speaker Name: text
        const match = trimmed.match(
          /^(?:(\[\d{1,2}:\d{2}(?::\d{2})?\])\s*)?([A-Z][a-zA-Z0-9\s.&()-]{1,32}):\s*(.*)$/
        );

        if (match) {
          const [, timestamp, speaker, spokenText] = match;
          return (
            <div key={i} className="leading-relaxed">
              {timestamp && (
                <span className="font-sans tabular-nums text-[10.5px] text-[var(--color-ink-muted)] mr-2 select-none">
                  {timestamp}
                </span>
              )}
              <strong className="font-semibold text-[var(--color-ink)] mr-1.5">
                {speaker}:
              </strong>
              <span>{spokenText}</span>
            </div>
          );
        }

        return (
          <div key={i} className="leading-relaxed">
            {trimmed}
          </div>
        );
      })}
    </div>
  );
}
