"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Copy,
  Check,
} from "lucide-react";
import type {
  ClientMeeting,
  KnowledgeItem,
  MeetingChannel,
} from "@/types/domain";
import { formatDisplayDateTimeIST } from "@/lib/date-utils";
import { deleteClientMeetingAction } from "@/lib/actions/meetings";
import { LogMeetingModal } from "./log-meeting-modal";
import {
  SegmentedFilter,
  FilterSearchInput,
} from "@/components/ui/segmented-filter";

interface ClientMeetingsTabProps {
  clientId: string;
  clientName: string;
  founderName: string;
  meetings: ClientMeeting[];
  knowledgeItems?: KnowledgeItem[];
  onRefresh?: () => void;
}

/**
 * Formats raw transcript lines so speaker labels and timestamps
 * are scannable instead of a flat wall of plain text.
 */
function FormattedTranscriptView({ text }: { text: string }) {
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

export function ClientMeetingsTab({
  clientId,
  clientName,
  founderName,
  meetings,
  onRefresh,
}: ClientMeetingsTabProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<
    MeetingChannel | "all"
  >("all");
  const [expandedTranscripts, setExpandedTranscripts] = useState<
    Record<string, boolean>
  >({});
  const [copiedTranscriptId, setCopiedTranscriptId] = useState<string | null>(
    null
  );

  const [showLogModal, setShowLogModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ClientMeeting | null>(
    null
  );

  const [meetingToDelete, setMeetingToDelete] = useState<ClientMeeting | null>(
    null
  );
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleRefresh = () => {
    onRefresh?.();
    router.refresh();
  };

  const toggleTranscript = (id: string) => {
    setExpandedTranscripts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyTranscript = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTranscriptId(id);
      setTimeout(() => setCopiedTranscriptId(null), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const confirmDeleteMeeting = () => {
    if (!meetingToDelete) return;
    startDeleteTransition(async () => {
      const res = await deleteClientMeetingAction(
        meetingToDelete.id,
        clientId
      );
      if (res.success) {
        setMeetingToDelete(null);
        handleRefresh();
      }
    });
  };

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (selectedChannel !== "all" && m.channel !== selectedChannel) {
        if (
          selectedChannel === "fathom_video" &&
          (m.channel === "google_meet" || m.channel === "zoom")
        ) {
          // include video calls
        } else {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = m.title.toLowerCase().includes(q);
        const inSummary = m.summary.toLowerCase().includes(q);
        const inTranscript = (m.raw_transcript || "").toLowerCase().includes(q);
        const inDecisions = (m.key_decisions || []).some((d) =>
          d.toLowerCase().includes(q)
        );
        const inActions = (m.action_items || []).some((a) =>
          a.toLowerCase().includes(q)
        );
        return (
          inTitle || inSummary || inTranscript || inDecisions || inActions
        );
      }
      return true;
    });
  }, [meetings, selectedChannel, searchQuery]);

  const channelCounts = useMemo(() => {
    const counts = {
      all: meetings.length,
      fathom_video: 0,
      phone_call: 0,
      whatsapp: 0,
      in_person: 0,
    };
    for (const m of meetings) {
      if (
        m.channel === "fathom_video" ||
        m.channel === "google_meet" ||
        m.channel === "zoom"
      ) {
        counts.fathom_video++;
      } else if (m.channel === "phone_call") {
        counts.phone_call++;
      } else if (m.channel === "whatsapp") {
        counts.whatsapp++;
      } else if (m.channel === "in_person") {
        counts.in_person++;
      }
    }
    return counts;
  }, [meetings]);

  const getChannelMeta = (channel: MeetingChannel) => {
    switch (channel) {
      case "fathom_video":
      case "google_meet":
      case "zoom":
        return {
          label: "Video · Fathom",
          dotColor: "bg-blue-400",
        };
      case "phone_call":
        return {
          label: "Phone Call",
          dotColor: "bg-emerald-400",
        };
      case "whatsapp":
        return {
          label: "WhatsApp",
          dotColor: "bg-[#25D366]",
        };
      case "in_person":
        return {
          label: "Quick Note",
          dotColor: "bg-amber-400",
        };
      default:
        return {
          label: "Sync",
          dotColor: "bg-gray-400",
        };
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── 1. HEADER & ACTION ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">
              Conversations
            </h2>
            <span className="font-sans tabular-nums text-xs text-[var(--color-ink-tertiary)]">
              ({meetings.length})
            </span>
          </div>
          <p className="text-xs text-[var(--color-ink-secondary)] mt-0.5">
            Notes, call logs, and transcripts with {founderName}.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingMeeting(null);
            setShowLogModal(true);
          }}
          className="btn btn-primary text-xs self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Log Conversation</span>
        </button>
      </div>

      {/* ─── 2. COHESIVE FILTER TRACK & SEARCH ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <SegmentedFilter
          options={[
            { id: "all", label: "All", count: channelCounts.all },
            {
              id: "fathom_video",
              label: "Video",
              count: channelCounts.fathom_video,
            },
            {
              id: "phone_call",
              label: "Calls",
              count: channelCounts.phone_call,
            },
            {
              id: "whatsapp",
              label: "WhatsApp",
              count: channelCounts.whatsapp,
            },
            {
              id: "in_person",
              label: "Notes",
              count: channelCounts.in_person,
            },
          ]}
          value={selectedChannel}
          onChange={(val) => setSelectedChannel(val as "all" | MeetingChannel)}
        />

        <FilterSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search notes, takeaways, or transcripts..."
        />
      </div>

      {/* ─── 3. TIMELINE STREAM ─── */}
      {filteredMeetings.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[var(--color-ink-secondary)]">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="space-y-1 max-w-xs mx-auto">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
              {searchQuery
                ? "No matching conversations"
                : "No conversations logged yet"}
            </h3>
            <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
              {searchQuery
                ? `Nothing matched "${searchQuery}".`
                : `Paste meeting notes, call takeaways, or a Fathom transcript to keep context in one place.`}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={() => {
                setEditingMeeting(null);
                setShowLogModal(true);
              }}
              className="btn btn-secondary text-xs mt-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log First Conversation</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMeetings.map((meeting) => {
            const meta = getChannelMeta(meeting.channel);
            const isTranscriptOpen = !!expandedTranscripts[meeting.id];
            const isCopied = copiedTranscriptId === meeting.id;

            const decisions = meeting.key_decisions || [];
            const actions = meeting.action_items || [];
            const hasBullets = decisions.length > 0 || actions.length > 0;

            const transcriptLines = meeting.raw_transcript
              ? meeting.raw_transcript.split("\n").length
              : 0;

            return (
              <div
                key={meeting.id}
                className="group card p-5 space-y-3 transition-colors hover:border-[var(--color-line-strong)]"
              >
                {/* Top Meta Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-tertiary)] font-sans tabular-nums">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-ink)]">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${meta.dotColor}`}
                      />
                      <span>{meta.label}</span>
                    </span>
                    <span>·</span>
                    <span>
                      {formatDisplayDateTimeIST(meeting.meeting_date, true)}
                    </span>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/content/new?clientId=${clientId}&meetingId=${meeting.id}`)
                      }
                      className="btn btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1 cursor-pointer"
                      title="Open Content Studio with this conversation pre-loaded"
                    >
                      <span>Draft Perspective</span>
                      <ArrowUpRight className="h-3 w-3 opacity-60" />
                    </button>

                    {meeting.fathom_recording_url && (
                      <a
                        href={meeting.fathom_recording_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary text-[11px] py-1 px-2.5 inline-flex items-center gap-1"
                      >
                        <span>Watch Recording</span>
                        <ArrowUpRight className="h-3 w-3 opacity-60" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingMeeting(meeting)}
                      className="rounded-[var(--radius-xs)] p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Edit conversation"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setMeetingToDelete(meeting)}
                      className="rounded-[var(--radius-xs)] p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-danger-text)] hover:bg-[var(--color-base-subtle)] opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)] leading-snug">
                  {meeting.title}
                </h3>

                {/* Summary / Notes */}
                <p className="text-[13px] text-[var(--color-ink-secondary)] leading-relaxed whitespace-pre-wrap max-w-[78ch]">
                  {meeting.summary}
                </p>

                {/* Takeaways & Action Items */}
                {hasBullets && (
                  <div className="pt-2 border-t border-[var(--color-line-subtle)] grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {decisions.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)] block">
                          Key Takeaways
                        </span>
                        <ul className="space-y-1">
                          {decisions.map((dec, idx) => (
                            <li
                              key={`dec-${idx}`}
                              className="flex items-start gap-2 text-xs text-[var(--color-ink-secondary)]"
                            >
                              <span className="text-[var(--color-ink-muted)] select-none mt-0.5">
                                •
                              </span>
                              <span className="leading-relaxed">{dec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {actions.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)] block">
                          Next Steps
                        </span>
                        <ul className="space-y-1">
                          {actions.map((act, idx) => (
                            <li
                              key={`act-${idx}`}
                              className="flex items-start gap-2 text-xs text-[var(--color-ink)]"
                            >
                              <span className="text-[var(--color-ink-tertiary)] select-none mt-0.5">
                                ✓
                              </span>
                              <span className="leading-relaxed">{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Footer: Transcript Toggle */}
                {meeting.raw_transcript && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--color-line-subtle)]">
                    <button
                      type="button"
                      onClick={() => toggleTranscript(meeting.id)}
                      className="flex items-center gap-1.5 text-xs text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors cursor-pointer font-sans tabular-nums"
                    >
                      {isTranscriptOpen ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {isTranscriptOpen
                          ? "Hide transcript"
                          : `Read transcript (${transcriptLines} lines)`}
                      </span>
                    </button>
                  </div>
                )}

                {/* Expanded Formatted Transcript Reader */}
                {isTranscriptOpen && meeting.raw_transcript && (
                  <div className="pt-2 space-y-2 animate-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-sans uppercase tracking-wider text-[var(--color-ink-muted)]">
                        Verbatim Transcript
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyTranscript(
                            meeting.id,
                            meeting.raw_transcript!
                          )
                        }
                        className="btn btn-ghost text-[11px] py-1 px-2 inline-flex items-center gap-1"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-[var(--color-ok-text)]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto rounded-[8px] bg-[var(--color-base-subtle)]/40 border border-[var(--color-line)] p-4">
                      <FormattedTranscriptView text={meeting.raw_transcript} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODALS (Create & Edit share the same seamless composer) ─── */}
      <LogMeetingModal
        clientId={clientId}
        clientName={clientName}
        founderName={founderName}
        isOpen={showLogModal || !!editingMeeting}
        initialMeeting={editingMeeting}
        onClose={() => {
          setShowLogModal(false);
          setEditingMeeting(null);
        }}
        onSuccess={handleRefresh}
      />

      {/* Delete Confirmation Modal */}
      {meetingToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMeetingToDelete(null);
          }}
        >
          <div className="w-full max-w-sm rounded-[14px] border border-[var(--color-line-strong)] bg-[var(--color-surface)] p-5 shadow-dialog space-y-4 animate-in">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                Delete Conversation?
              </h3>
              <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed">
                Remove{" "}
                <strong className="text-[var(--color-ink)]">
                  {meetingToDelete.title}
                </strong>
                ? This cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMeetingToDelete(null)}
                disabled={isDeleting}
                className="btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteMeeting}
                disabled={isDeleting}
                className="btn btn-primary text-xs"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
