"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  CheckCircle2,
} from "lucide-react";
import { updateContentStatusAction, sendForClientReviewAction } from "@/lib/actions/content";
import { MarkPublishedModal } from "@/components/content/mark-published-modal";
import { PageHeader } from "@/components/layout/page-header";
import { StudioMasthead } from "@/components/content/studio/studio-masthead";
import { StudioMatrixView } from "@/components/content/studio/studio-matrix-view";
import { StudioKanbanView } from "@/components/content/studio/studio-kanban-view";
import { StudioListView } from "@/components/content/studio/studio-list-view";

interface ContentStudioClientProps {
  initialPosts: any[];
  engagements: any[];
  tokenMap: Record<string, string>;
}

type ViewMode = "matrix" | "kanban" | "list";

export function ContentStudioClient({
  initialPosts,
  engagements,
  tokenMap: initialTokenMap,
}: ContentStudioClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ae_studio_view_mode") as ViewMode | null;
      if (saved && (saved === "matrix" || saved === "kanban" || saved === "list")) {
        setViewMode(saved);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("ae_studio_view_mode", mode);
    } catch {
      // ignore
    }
  };
  const [posts, setPosts] = useState<any[]>(initialPosts);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

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
    // Optimistic UI update: move card immediately without waiting for server roundtrip
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              status: newStatus,
              published_at:
                newStatus === "published"
                  ? p.published_at || new Date().toISOString()
                  : p.published_at,
            }
          : p
      )
    );

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
        } else if (newStatus === "published") {
          showToast("Perspective marked live on LinkedIn");
        } else {
          showToast(`Moved to ${newStatus.replace("_", " ")}`);
        }
        router.refresh();
      } else {
        setPosts(initialPosts);
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
    const list: { id: string; name: string; brandName?: string }[] = [];
    engagements.forEach((e) => {
      const cId = e.clients?.id || e.clientId;
      const cName = e.clients?.name || e.clientName;
      const brand =
        e.websiteUrl ||
        e.website_url ||
        e.clients?.website_url ||
        e.founderEmail ||
        e.founder_email ||
        e.clients?.founder_email ||
        cName;
      if (cId && !seen.has(cId)) {
        seen.add(cId);
        list.push({ id: cId, name: cName || "Client", brandName: brand });
      }
    });
    posts.forEach((p) => {
      const c = p.engagements?.clients;
      if (c && c.id && !seen.has(c.id)) {
        seen.add(c.id);
        const brand = c.website_url || c.founder_email || c.name;
        list.push({ id: c.id, name: c.name || "Client", brandName: brand });
      }
    });
    return list;
  }, [engagements, posts]);

  // Filter posts by client and status
  const filteredPosts = posts.filter((post) => {
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
        ? posts
        : posts.filter((p) => p.engagements?.clients?.id === selectedClientId);

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
  }, [posts, selectedClientId]);

  const draftCount = posts.filter(
    (p) => p.status === "draft" || p.status === "internal_review"
  ).length;
  const reviewCount = posts.filter((p) => p.status === "client_review").length;
  const scheduledCount = posts.filter(
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
        <Link
          href={newPerspectiveHref}
          className="btn btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5 active:scale-[0.98] transition-transform"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Perspective</span>
        </Link>
      </PageHeader>

      {/* ─── FLUSH ARCHITECTURAL CONTENT STUDIO MASTHEAD ─── */}
      <StudioMasthead
        draftCount={draftCount}
        reviewCount={reviewCount}
        scheduledCount={scheduledCount}
        totalCount={posts.length}
        clientOptions={clientOptions}
        selectedClientId={selectedClientId}
        onSelectClient={setSelectedClientId}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* ─── WORKSPACE CANVAS ─── */}
      <div className="flex-1 w-full">
        {/* VIEW 0: CLIENT CADENCE MATRIX VIEW */}
        {viewMode === "matrix" && (
          <StudioMatrixView
            engagements={engagements}
            posts={posts}
            selectedClientId={selectedClientId}
            isPending={isPending}
            copiedId={copiedId}
            onStatusTransition={handleStatusTransition}
            onCopyReviewLink={copyReviewLink}
            onOpenWhatsApp={openWhatsAppPing}
            onSetPublishingPost={setPublishingPost}
          />
        )}

        {/* VIEW 1: KANBAN BOARD VIEW */}
        {viewMode === "kanban" && (
          <div className="p-4 lg:p-6">
            <StudioKanbanView
              kanbanColumns={kanbanColumns}
              isPending={isPending}
              copiedId={copiedId}
              onStatusTransition={handleStatusTransition}
              onCopyReviewLink={copyReviewLink}
              onOpenWhatsApp={openWhatsAppPing}
              onSetPublishingPost={setPublishingPost}
            />
          </div>
        )}

        {/* VIEW 2: LIST VIEW */}
        {viewMode === "list" && (
          <div className="p-4 lg:p-6">
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
          </div>
        )}
      </div>

      {/* MARK PUBLISHED MODAL */}
      <MarkPublishedModal
        post={publishingPost}
        isOpen={!!publishingPost}
        onClose={() => setPublishingPost(null)}
        onSuccess={(data) => {
          if (publishingPost) {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === publishingPost.id
                  ? {
                      ...p,
                      status: "published",
                      published_at: data?.published_at || new Date().toISOString(),
                      linkedin_post_url: data?.linkedin_post_url || p.linkedin_post_url,
                    }
                  : p
              )
            );
          }
          showToast("Post marked as published on LinkedIn!");
          router.refresh();
        }}
      />
    </div>
  );
}
