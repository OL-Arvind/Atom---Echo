"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus } from "lucide-react";
import type {
  ClientMeeting,
  KnowledgeItem,
  MeetingChannel,
} from "@/types/domain";
import { deleteClientMeetingAction } from "@/lib/actions/meetings";
import { LogMeetingModal } from "./log-meeting-modal";
import {
  SegmentedFilter,
  FilterSearchInput,
} from "@/components/ui/segmented-filter";
import { MeetingCard } from "./meetings/meeting-card";
import { DeleteMeetingDialog } from "./meetings/delete-meeting-dialog";

interface ClientMeetingsTabProps {
  clientId: string;
  clientName: string;
  founderName: string;
  meetings: ClientMeeting[];
  knowledgeItems?: KnowledgeItem[];
  onRefresh?: () => void;
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
          {filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              isTranscriptOpen={!!expandedTranscripts[meeting.id]}
              isCopied={copiedTranscriptId === meeting.id}
              onToggleTranscript={() => toggleTranscript(meeting.id)}
              onCopyTranscript={() =>
                handleCopyTranscript(meeting.id, meeting.raw_transcript!)
              }
              onDraftPerspective={() =>
                router.push(
                  `/content/new?clientId=${clientId}&meetingId=${meeting.id}&from=client-meetings`
                )
              }
              onEdit={() => setEditingMeeting(meeting)}
              onDelete={() => setMeetingToDelete(meeting)}
            />
          ))}
        </div>
      )}

      {/* ─── MODALS ─── */}
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
      <DeleteMeetingDialog
        meeting={meetingToDelete}
        isDeleting={isDeleting}
        onClose={() => setMeetingToDelete(null)}
        onConfirm={confirmDeleteMeeting}
      />
    </div>
  );
}
