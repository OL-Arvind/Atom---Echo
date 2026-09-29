"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  X,
  Video,
  Phone,
  MessageSquare,
  Link as LinkIcon,
  Check,
  ClipboardPaste,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import {
  createClientMeetingAction,
  updateClientMeetingAction,
} from "@/lib/actions/meetings";
import { toDatetimeLocalIST } from "@/lib/date-utils";
import type { ClientMeeting, MeetingChannel } from "@/types/domain";

interface LogMeetingModalProps {
  clientId: string;
  clientName: string;
  founderName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMeeting?: ClientMeeting | null;
}

const CHANNELS: Array<{
  id: MeetingChannel;
  label: string;
  icon: typeof Video;
  placeholder: string;
  titlePlaceholder: string;
}> = [
  {
    id: "fathom_video",
    label: "Video / Fathom",
    icon: Video,
    titlePlaceholder: "Meeting title (e.g. Weekly Strategy Sync)...",
    placeholder:
      "Paste your Fathom link, call summary, or full transcript here...",
  },
  {
    id: "phone_call",
    label: "Phone Call",
    icon: Phone,
    titlePlaceholder: "Call topic (e.g. Quick catchup on Q4 hiring)...",
    placeholder:
      "What did you discuss on the call? Jot down key takeaways or next steps...",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: WhatsAppIcon as any,
    titlePlaceholder: "Topic (e.g. Voice note on product launch)...",
    placeholder:
      "Paste WhatsApp messages, voice note summary, or client feedback...",
  },
  {
    id: "in_person",
    label: "Quick Note",
    icon: MessageSquare,
    titlePlaceholder: "Note title (optional)...",
    placeholder:
      "Write down context, founder opinions, or story angles for the team...",
  },
];

function getDefaultMeetingDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function buildInitialNotes(meeting: ClientMeeting): string {
  const parts: string[] = [];
  if (meeting.summary?.trim()) {
    parts.push(meeting.summary.trim());
  }
  if (meeting.key_decisions && meeting.key_decisions.length > 0) {
    const decLines = meeting.key_decisions.map((d) => `Decision: ${d}`);
    parts.push(decLines.join("\n"));
  }
  if (meeting.action_items && meeting.action_items.length > 0) {
    const actLines = meeting.action_items.map((a) => `TODO: ${a}`);
    parts.push(actLines.join("\n"));
  }
  return parts.join("\n\n");
}

export function LogMeetingModal({
  clientId,
  clientName,
  founderName,
  isOpen,
  onClose,
  onSuccess,
  initialMeeting = null,
}: LogMeetingModalProps) {
  const isEditing = !!initialMeeting;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [channel, setChannel] = useState<MeetingChannel>("fathom_video");
  const [title, setTitle] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [meetingDate, setMeetingDate] = useState(getDefaultMeetingDate);
  const [fathomUrl, setFathomUrl] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when modal opens for create vs edit
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setShowLinkInput(false);

    if (initialMeeting) {
      const normalizedChannel: MeetingChannel =
        initialMeeting.channel === "google_meet" ||
        initialMeeting.channel === "zoom"
          ? "fathom_video"
          : initialMeeting.channel;
      setChannel(normalizedChannel);
      setTitle(initialMeeting.title || "");
      setRawNotes(buildInitialNotes(initialMeeting));
      setMeetingDate(
        initialMeeting.meeting_date
          ? toDatetimeLocalIST(initialMeeting.meeting_date)
          : getDefaultMeetingDate()
      );
      setFathomUrl(initialMeeting.fathom_recording_url || "");
    } else {
      setChannel("fathom_video");
      setTitle("");
      setRawNotes("");
      setMeetingDate(getDefaultMeetingDate());
      setFathomUrl("");
    }
  }, [isOpen, initialMeeting]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeChannelMeta =
    CHANNELS.find((c) => c.id === channel) || CHANNELS[0];

  // Live smart detection signals
  const detectedUrlMatch = rawNotes.match(
    /(https?:\/\/(?:www\.)?fathom\.video\/(?:share\/)?[a-zA-Z0-9_\-]+)/i
  );
  const effectiveFathomUrl =
    fathomUrl.trim() || (detectedUrlMatch ? detectedUrlMatch[1] : "");

  const isTranscriptDetected =
    rawNotes.length > 800 &&
    (/\[\d{1,2}:\d{2}/.test(rawNotes) ||
      (rawNotes.match(/^[A-Z][a-zA-Z\s]{1,25}:/gm) || []).length >= 3);

  const detectedActionsCount = (
    rawNotes.match(
      /^(?:[-*•]\s*\[[\sXx]?\]|TODO:?|Action(?:\s*Item)?:?|Next\s*steps?:?)/gim
    ) || []
  ).length;

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawNotes((prev) => (prev ? `${prev}\n${text}` : text));
        textareaRef.current?.focus();
      }
    } catch {
      textareaRef.current?.focus();
    }
  };

  const submitForm = () => {
    if (!rawNotes.trim()) {
      setError("Write a quick note or paste a transcript before saving.");
      textareaRef.current?.focus();
      return;
    }

    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      formData.set("client_id", clientId);
      formData.set("founder_name", founderName);
      formData.set("channel", channel);
      formData.set("raw_notes", rawNotes.trim());
      if (title.trim()) formData.set("title", title.trim());
      if (meetingDate) formData.set("meeting_date", meetingDate);
      if (fathomUrl.trim()) {
        formData.set("fathom_recording_url", fathomUrl.trim());
      }

      if (isEditing && initialMeeting) {
        formData.set("meeting_id", initialMeeting.id);
        if (initialMeeting.raw_transcript && !isTranscriptDetected) {
          formData.set("raw_transcript", initialMeeting.raw_transcript);
        }
        const res = await updateClientMeetingAction(formData);
        if (res.success) {
          onSuccess?.();
          onClose();
        } else {
          setError(res.error || "Could not update conversation.");
        }
      } else {
        const res = await createClientMeetingAction(formData);
        if (res.success) {
          setRawNotes("");
          setTitle("");
          setFathomUrl("");
          setShowLinkInput(false);
          onSuccess?.();
          onClose();
        } else {
          setError(res.error || "Could not save conversation.");
        }
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submitForm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl rounded-[14px] border border-[var(--color-line-strong)] bg-[var(--color-surface)] shadow-dialog overflow-hidden animate-in"
      >
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* ─── 1. TOP COMPOSER BAR (Context + Segmented Channel Track) ─── */}
          <div className="flex flex-col gap-3 border-b border-[var(--color-line-subtle)] bg-[var(--color-base-subtle)]/40 px-5 pt-4 pb-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-[var(--color-ink-secondary)]">
                  {clientName}
                </span>
                <span className="text-[var(--color-ink-muted)]">/</span>
                <span className="font-semibold text-[var(--color-ink)]">
                  {isEditing ? "Edit Conversation" : "Log Conversation"}
                </span>
                <span className="text-[var(--color-ink-tertiary)] hidden sm:inline">
                  · with {founderName}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-[var(--radius-xs)] p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-base-subtle)] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Cohesive Segmented Control */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-[8px] bg-[var(--color-base-subtle)] p-1 border border-[var(--color-line)]">
              {CHANNELS.map((c) => {
                const Icon = c.icon;
                const active = channel === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-[6px] text-xs font-sans transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? "bg-[var(--color-surface)] text-[var(--color-ink)] font-medium shadow-2xs border border-[var(--color-line-strong)]"
                        : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] border border-transparent"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── 2. SEAMLESS WRITING CANVAS (Zero Inner Input Boxes) ─── */}
          <div className="px-5 pt-4 pb-3 space-y-3">
            {error && (
              <div className="border-l-2 border-[var(--color-danger-line)] pl-3 py-1 text-xs text-[var(--color-danger-text)]">
                {error}
              </div>
            )}

            {/* Borderless Title Input */}
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-line-subtle)] pb-2.5">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={activeChannelMeta.titlePlaceholder}
                className="w-full bg-transparent border-0 p-0 text-[15px] font-semibold tracking-tight text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] placeholder:font-normal focus:outline-none focus:ring-0"
              />
              {!title && (
                <span className="text-[10.5px] font-sans text-[var(--color-ink-muted)] whitespace-nowrap select-none">
                  Auto-titled if blank
                </span>
              )}
            </div>

            {/* Borderless Notes / Transcript Canvas */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                autoFocus
                rows={7}
                value={rawNotes}
                onChange={(e) => {
                  setRawNotes(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={activeChannelMeta.placeholder}
                className="w-full bg-transparent border-0 p-0 text-[13.5px] font-sans leading-relaxed text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none focus:ring-0 resize-none"
              />

              {/* Quick Clipboard Paste Helper when empty */}
              {!rawNotes && (
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] border border-[var(--color-line)] rounded-[var(--radius-xs)] px-2.5 py-1 transition-colors cursor-pointer"
                  >
                    <ClipboardPaste className="h-3 w-3" />
                    <span>Paste from clipboard</span>
                  </button>
                  <span className="text-[11px] text-[var(--color-ink-muted)]">
                    Supports notes, Fathom links, or `TODO:` items
                  </span>
                </div>
              )}
            </div>

            {/* ─── 3. INLINE METADATA CHIPS (Linear-style Property Pills) ─── */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Custom Calendar & Time Pill */}
                <CustomDatePicker
                  value={meetingDate}
                  onChange={setMeetingDate}
                  showTime
                  variant="pill"
                  presetMode="past"
                  placeholder="Today"
                />

                {/* Recording Link Pill */}
                {!showLinkInput ? (
                  <button
                    type="button"
                    onClick={() => setShowLinkInput(true)}
                    className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-xs)] border text-[11.5px] font-sans transition-colors cursor-pointer ${
                      effectiveFathomUrl
                        ? "bg-[var(--color-base-subtle)] border-[var(--color-line-strong)] text-[var(--color-ink)]"
                        : "bg-[var(--color-base-subtle)] hover:bg-[var(--color-base-muted)] border-[var(--color-line)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]"
                    }`}
                  >
                    <LinkIcon className="h-3 w-3" />
                    <span>
                      {effectiveFathomUrl
                        ? "Recording link attached"
                        : "Add recording link"}
                    </span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[var(--radius-xs)] bg-[var(--color-base-subtle)] border border-[var(--color-line-strong)] w-64 max-w-full">
                    <LinkIcon className="h-3 w-3 text-[var(--color-ink-tertiary)] shrink-0" />
                    <input
                      type="url"
                      autoFocus
                      value={fathomUrl}
                      onChange={(e) => setFathomUrl(e.target.value)}
                      placeholder="https://fathom.video/share/..."
                      className="w-full bg-transparent border-0 p-0 text-[11.5px] font-sans text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLinkInput(false)}
                      className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer shrink-0"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Live Auto-Detection Status Signals */}
              {(isTranscriptDetected || detectedActionsCount > 0) && (
                <div className="flex items-center gap-2.5 text-[11px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
                  {isTranscriptDetected && (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      <span>Transcript detected</span>
                    </span>
                  )}
                  {detectedActionsCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>
                        {detectedActionsCount} action
                        {detectedActionsCount > 1 ? "s" : ""}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ─── 4. GROUNDED FOOTER BAR ─── */}
          <div className="flex items-center justify-between border-t border-[var(--color-line)] bg-[var(--color-base-subtle)]/50 px-5 py-3">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[var(--color-ink-tertiary)]">
              <kbd className="inline-flex h-5 items-center justify-center rounded-[4px] border border-[var(--color-line)] bg-[var(--color-surface)] px-1.5 text-[10px] font-sans text-[var(--color-ink-secondary)] shadow-2xs">
                ⌘
              </kbd>
              <span>+</span>
              <kbd className="inline-flex h-5 items-center justify-center rounded-[4px] border border-[var(--color-line)] bg-[var(--color-surface)] px-1.5 text-[10px] font-sans text-[var(--color-ink-secondary)] shadow-2xs">
                ↵
              </kbd>
              <span className="ml-0.5 text-[var(--color-ink-muted)]">
                to save
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="btn btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="btn btn-primary text-xs px-4"
              >
                {isPending
                  ? "Saving..."
                  : isEditing
                  ? "Save Changes"
                  : "Save Conversation"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
