"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  CheckCircle2,
  LayoutGrid,
  List,
} from "lucide-react";
import { updateContentStatusAction, sendForClientReviewAction } from "@/lib/actions/content";
import { MarkPublishedModal } from "@/components/content/mark-published-modal";
import { PageHeader } from "@/components/layout/page-header";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import { StudioMasthead } from "@/components/content/studio/studio-masthead";
import { StudioKanbanView } from "@/components/content/studio/studio-kanban-view";
import { StudioListView } from "@/components/content/studio/studio-list-view";

interface ContentStudioClientProps {
  initialPosts: any[];
  engagements: any[];
  tokenMap: Record<string, string>;
}

type ViewMode = "kanban" | "list";

export function ContentStudioClient({
  initialPosts,
  engagements,
  tokenMap: initialTokenMap,
}: ContentStudioClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [filter, setFilter] = useState<string>("all");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [tokenMap, setTokenMap] = useState<Record<string, string>>(initialTokenMap);
  const [publishingPost, setPublishingPost] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const newPerspectiveHref =
    selectedClientId !== "all"
      ? `/content/new?clientId=${selectedClientId}&from=content`
      : "/content/new?from=content";

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStatusTransition = (post: any, newStatus: string) => {
    startTransition(async () => {
      const res = await updateContentStatusAction(post.id, newStatus);
      if (res.success) {
        const clientId = post.engagements?.clients?.id;
        if (newStatus === "client_review") {
          const tok = res.reviewToken || (clientId ? tokenMap[clientId] : null);
          if (tok) {
            if (clientId) {
              setTokenMap((prev) => ({ ...prev, [clientId]: tok }));
            }
            const shareUrl = `${window.location.origin}/review/${tok}`;
            try {
              await navigator.clipboard.writeText(shareUrl);
              setCopiedId(post.id);
              setTimeout(() => setCopiedId(null), 2500);
              showToast("Dispatched to Founder Desk · Review link copied");
            } catch {
              showToast("Dispatched to Founder Desk");
            }
          } else {
            showToast("Dispatched to Founder Desk");
          }
        } else if (newStatus === "internal_review") {
          showToast("Moved to Voice & QA");
        } else if (newStatus === "approved" || newStatus === "scheduled") {
          showToast("Locked on publishing schedule");
        } else {
          showToast(`Moved to ${newStatus.replace("_", " ")}`);
        }
        router.refresh();
      } else {
        showToast(`Error: ${res.error}`);
      }
    });
  };

  const copyReviewLink = async (post: any) => {
    const clientId = post.engagements?.clients?.id;
    const origin = window.location.origin;
    let token = clientId ? tokenMap[clientId] : null;

    if (!token) {
      const res = await sendForClientReviewAction(post.id, origin);
      if (res.success && res.token) {
        token = res.token;
        if (clientId) {
          setTokenMap((prev) => ({ ...prev, [clientId]: res.token }));
        }
      } else {
        showToast("Could not generate review link: " + (res.error || "Unknown error"));
        return;
      }
    }

    const shareUrl = `${origin}/review/${token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(post.id);
      showToast(
        `Copied 7-day Founder Desk link for ${post.engagements?.clients?.founder_name || "Founder"}`
      );
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast("Review link ready");
    }
  };

  const openWhatsAppPing = async (post: any) => {
    const client = post.engagements?.clients;
    const clientId = client?.id;
    const origin = window.location.origin;
    let token = clientId ? tokenMap[clientId] : null;

    if (!token) {
      const res = await sendForClientReviewAction(post.id, origin);
      if (res.success && res.token) {
        token = res.token;
        if (clientId) {
          setTokenMap((prev) => ({ ...prev, [clientId]: res.token }));
        }
        if (res.whatsappUrl) {
          window.open(res.whatsappUrl, "_blank");
          showToast(`Opened WhatsApp for ${client?.founder_name || "Founder"}`);
          return;
        }
      }
    }

    const shareUrl = `${origin}/review/${token}`;
    const phone = client?.founder_phone ? client.founder_phone.replace(/[^0-9]/g, "") : "";
    const message = encodeURIComponent(
      `Hi ${client?.founder_name || "there"}, "${post.title}" is ready for your 1-tap review on your Founder Desk:\n${shareUrl}`
    );
    const whatsappUrl = phone
      ? `https://wa.me/${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank");
    showToast(`Opened WhatsApp for ${client?.founder_name || "Founder"}`);
  };

  // Client list for filtering
  const clientOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string }[] = [];
    engagements.forEach((e) => {
      const cId = e.clients?.id || e.clientId;
      const cName = e.clients?.name || e.clientName;
      if (cId && !seen.has(cId)) {
        seen.add(cId);
        list.push({ id: cId, name: cName || "Client" });
      }
    });
    initialPosts.forEach((p) => {
      const c = p.engagements?.clients;
      if (c && c.id && !seen.has(c.id)) {
        seen.add(c.id);
        list.push({ id: c.id, name: c.name || "Client" });
      }
    });
    return list;
  }, [engagements, initialPosts]);

  // Filter posts by client and status
  const filteredPosts = initialPosts.filter((post) => {
    if (selectedClientId !== "all") {
      const cId = post.engagements?.clients?.id;
      if (cId !== selectedClientId) return false;
    }

    if (filter === "all") return true;
    if (filter === "draft") return post.status === "draft" || post.status === "internal_review";
    if (filter === "review") return post.status === "client_review";
    if (filter === "scheduled") return post.status === "scheduled" || post.status === "approved";
    if (filter === "paused") return post.status === "paused";
    if (filter === "published") return post.status === "published";
    return true;
  });

  // Kanban column buckets
  const kanbanColumns = useMemo(() => {
    const clientScoped =
      selectedClientId === "all"
        ? initialPosts
        : initialPosts.filter((p) => p.engagements?.clients?.id === selectedClientId);

    return [
      {
        id: "draft",
        title: "01 Capture & Draft",
        subtitle: "Shaping raw thinking",
        posts: clientScoped.filter((p) => p.status === "draft"),
      },
      {
        id: "internal_review",
        title: "02 Voice & QA",
        subtitle: "Editorial polish & edges",
        posts: clientScoped.filter((p) => p.status === "internal_review"),
      },
      {
        id: "client_review",
        title: "03 Founder Desk",
        subtitle: "Awaiting 1-tap sign-off",
        posts: clientScoped.filter((p) => p.status === "client_review"),
      },
      {
        id: "scheduled",
        title: "04 Scheduled",
        subtitle: "Locked on timeline",
        posts: clientScoped.filter(
          (p) => p.status === "approved" || p.status === "scheduled"
        ),
      },
      {
        id: "published",
        title: "05 Published",
        subtitle: "Live thought leadership",
        posts: clientScoped.filter((p) => p.status === "published"),
      },
    ];
  }, [initialPosts, selectedClientId]);

  const draftCount = initialPosts.filter(
    (p) => p.status === "draft" || p.status === "internal_review"
  ).length;
  const reviewCount = initialPosts.filter((p) => p.status === "client_review").length;
  const scheduledCount = initialPosts.filter(
    (p) => p.status === "scheduled" || p.status === "approved"
  ).length;

  return (
    <div className="w-full min-h-full flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Portal Actions to TopNav */}
      <PageHeader title="Content Studio">
        <div className="flex items-center gap-2">
          <SegmentedFilter
            options={[
              {
                id: "kanban",
                label: "Kanban",
                icon: <LayoutGrid className="h-3.5 w-3.5" />,
              },
              {
                id: "list",
                label: "List",
                icon: <List className="h-3.5 w-3.5" />,
              },
            ]}
            value={viewMode}
            onChange={(val) => setViewMode(val as "kanban" | "list")}
          />

          <Link
            href={newPerspectiveHref}
            className="btn btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Perspective</span>
          </Link>
        </div>
      </PageHeader>

      {/* ─── FLUSH ARCHITECTURAL CONTENT STUDIO MASTHEAD ─── */}
      <StudioMasthead
        draftCount={draftCount}
        reviewCount={reviewCount}
        scheduledCount={scheduledCount}
        totalCount={initialPosts.length}
        clientOptions={clientOptions}
        selectedClientId={selectedClientId}
        onSelectClient={setSelectedClientId}
        viewMode={viewMode}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* ─── WORKSPACE CANVAS ─── */}
      <div className="flex-1 px-5 py-6 lg:px-7 lg:py-6">
        {/* VIEW 1: KANBAN BOARD VIEW */}
        {viewMode === "kanban" && (
          <StudioKanbanView
            kanbanColumns={kanbanColumns}
            isPending={isPending}
            copiedId={copiedId}
            onStatusTransition={handleStatusTransition}
            onCopyReviewLink={copyReviewLink}
            onOpenWhatsApp={openWhatsAppPing}
            onSetPublishingPost={setPublishingPost}
          />
        )}

        {/* VIEW 2: LIST VIEW */}
        {viewMode === "list" && (
          <StudioListView
            filteredPosts={filteredPosts}
            isPending={isPending}
            copiedId={copiedId}
            newPerspectiveHref={newPerspectiveHref}
            onStatusTransition={handleStatusTransition}
            onCopyReviewLink={copyReviewLink}
            onOpenWhatsApp={openWhatsAppPing}
            onSetPublishingPost={setPublishingPost}
          />
        )}
      </div>

      {/* MARK PUBLISHED MODAL */}
      <MarkPublishedModal
        post={publishingPost}
        isOpen={!!publishingPost}
        onClose={() => setPublishingPost(null)}
        onSuccess={() => {
          showToast("Post marked as published on LinkedIn!");
          router.refresh();
        }}
      />
    </div>
  );
}
