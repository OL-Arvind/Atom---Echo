"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Feather,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  MessageCircle,
  Calendar,
  Share2,
  ChevronRight,
  Filter,
  Sparkles,
  LayoutGrid,
  List,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { updateContentStatusAction, sendForClientReviewAction } from "@/lib/actions/content";
import { NewContentModal } from "@/components/content/new-content-modal";
import { MarkPublishedModal } from "@/components/content/mark-published-modal";
import { PageHeader } from "@/components/layout/page-header";
import { BrandLogo } from "@/components/ui/brand-logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  formatDisplayDateIST,
  formatDisplayDateTimeIST,
} from "@/lib/date-utils";

interface ContentStudioClientProps {
  initialPosts: any[];
  engagements: any[];
  tokenMap: Record<string, string>;
}

type ViewMode = "kanban" | "list";

export function ContentStudioClient({
  initialPosts,
  engagements,
  tokenMap,
}: ContentStudioClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [filter, setFilter] = useState<string>("all");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [publishingPost, setPublishingPost] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStatusTransition = (postId: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateContentStatusAction(postId, newStatus);
      if (res.success) {
        showToast(`Post transitioned to '${newStatus}'`);
        router.refresh();
      } else {
        showToast(`Error: ${res.error}`);
      }
    });
  };

  const copyReviewLink = async (post: any) => {
    const clientId = post.engagements?.clients?.id;
    let token = clientId ? tokenMap[clientId] : null;

    if (!token) {
      const res = await sendForClientReviewAction(post.id);
      if (res.success && res.token) {
        token = res.token;
      } else {
        showToast("Could not generate review link: " + (res.error || "Unknown error"));
        return;
      }
    }

    const shareUrl = `${window.location.origin}/review/${token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(post.id);
    showToast(`Copied 7-day review link for ${post.engagements?.clients?.founder_name || "Founder"}`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const openWhatsAppPing = async (post: any) => {
    const client = post.engagements?.clients;
    const clientId = client?.id;
    let token = clientId ? tokenMap[clientId] : null;

    if (!token) {
      const res = await sendForClientReviewAction(post.id);
      if (res.success && res.whatsappUrl) {
        window.open(res.whatsappUrl, "_blank");
        showToast(`Opened WhatsApp chat for ${client?.founder_name || "Founder"}`);
        return;
      }
    }

    const shareUrl = `${window.location.origin}/review/${token}`;
    const phone = client?.founder_phone ? client.founder_phone.replace(/[^0-9]/g, "") : "";
    if (!phone) {
      showToast("No WhatsApp phone number configured for this founder.");
      return;
    }
    const message = encodeURIComponent(
      `Hi ${client?.founder_name || "there"}, here is your latest LinkedIn post ready for review: ${shareUrl}`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    showToast(`Opened WhatsApp chat for ${client?.founder_name || "Founder"}`);
  };

  // Client list for filtering
  const clientOptions = useMemo(() => {
    const seen = new Set();
    const list: { id: string; name: string }[] = [];
    engagements.forEach((e) => {
      if (e.clients && !seen.has(e.clients.id)) {
        seen.add(e.clients.id);
        list.push({ id: e.clients.id, name: e.clients.name });
      }
    });
    return list;
  }, [engagements]);

  // Filter posts by client and status
  const filteredPosts = initialPosts.filter((post) => {
    // Client filter
    if (selectedClientId !== "all") {
      const cId = post.engagements?.clients?.id;
      if (cId !== selectedClientId) return false;
    }

    // Status tab filter (for list view)
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
    const clientScoped = selectedClientId === "all"
      ? initialPosts
      : initialPosts.filter((p) => p.engagements?.clients?.id === selectedClientId);

    return [
      {
        id: "draft",
        title: "Drafting",
        subtitle: "Writers in progress",
        posts: clientScoped.filter((p) => p.status === "draft"),
      },
      {
        id: "internal_review",
        title: "Internal QA",
        subtitle: "Lead review & fact-check",
        posts: clientScoped.filter((p) => p.status === "internal_review"),
      },
      {
        id: "client_review",
        title: "Client Review",
        subtitle: "Waiting founder 1-tap",
        posts: clientScoped.filter((p) => p.status === "client_review"),
      },
      {
        id: "scheduled",
        title: "Approved & Scheduled",
        subtitle: "Locked on Calendar",
        posts: clientScoped.filter((p) => p.status === "approved" || p.status === "scheduled"),
      },
      {
        id: "published",
        title: "Published",
        subtitle: "Live on LinkedIn",
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
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Standardized Header */}
      <PageHeader
        title="Content Studio"
        description="Draft, inspect taboo buzzwords, simulate LinkedIn mobile folds, and manage personal branding posts."
      >
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-2.5 py-1 text-xs rounded-[3px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === "kanban"
                  ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium shadow-xs"
                  : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1 text-xs rounded-[3px] transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === "list"
                  ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium shadow-xs"
                  : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="btn btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Post</span>
          </button>
        </div>
      </PageHeader>

      {/* KPI Slabs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => {
            setViewMode("list");
            setFilter("draft");
          }}
          className={`card p-5 space-y-2 cursor-pointer transition-all ${
            filter === "draft" && viewMode === "list" ? "border-[var(--color-accent-dim)]" : ""
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] font-medium">
            Drafts &amp; Internal QA
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ink)]">
            {draftCount}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Authoring &amp; fact-checking</p>
        </div>

        <div
          onClick={() => {
            setViewMode("list");
            setFilter("review");
          }}
          className={`card p-5 space-y-2 cursor-pointer transition-all ${
            filter === "review" && viewMode === "list" ? "border-[var(--color-warn-line)]" : ""
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-warn-text)] font-medium">
            Waiting for Client Review
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-warn-text)]">
            {reviewCount}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Tokenized 1-tap WhatsApp link active</p>
        </div>

        <div
          onClick={() => {
            setViewMode("list");
            setFilter("scheduled");
          }}
          className={`card p-5 space-y-2 cursor-pointer transition-all ${
            filter === "scheduled" && viewMode === "list" ? "border-[var(--color-ok-line)]" : ""
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-ok-text)] font-medium">
            Approved &amp; Scheduled
          </span>
          <div className="font-display text-3xl font-normal tabular-nums text-[var(--color-ok-text)]">
            {scheduledCount}
          </div>
          <p className="text-[11.5px] text-[var(--color-ink-secondary)]">Locked on Master Calendar</p>
        </div>
      </div>

      {/* Filter & Client Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-line-subtle)] pb-3">
        {/* Client Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[var(--color-ink-tertiary)] shrink-0" />
          <div className="w-52">
            <CustomSelect
              size="sm"
              options={[
                { value: "all", label: `All Clients (${clientOptions.length})` },
                ...clientOptions.map((c) => ({
                  value: c.id,
                  label: c.name,
                  brandName: c.name,
                })),
              ]}
              value={selectedClientId}
              onChange={setSelectedClientId}
            />
          </div>
        </div>

        {/* View Mode Context or List Tabs */}
        {viewMode === "list" ? (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: `All (${initialPosts.length})` },
              { id: "draft", label: `Drafts (${draftCount})` },
              { id: "review", label: `Client Review (${reviewCount})` },
              { id: "scheduled", label: `Scheduled (${scheduledCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-[var(--radius-sm)] px-2.5 py-1 text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  filter === tab.id
                    ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] border border-[var(--color-line-strong)] font-medium"
                    : "bg-[var(--color-base-subtle)] text-[var(--color-ink-tertiary)] border border-[var(--color-line)] hover:text-[var(--color-ink)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs font-mono text-[var(--color-ink-tertiary)] flex items-center gap-2">
            <span>Finite State Machine Pipeline</span>
            <span>·</span>
            <Link href="/calendar" className="hover:text-[var(--color-ink)] underline flex items-center gap-1">
              <span>View Calendar Projection</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* VIEW 1: KANBAN BOARD VIEW */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const isReviewCol = col.id === "client_review";
            const isApprovedCol = col.id === "scheduled";

            return (
              <div
                key={col.id}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-base-subtle)]/40 p-3 space-y-3 min-w-[240px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2">
                  <div>
                    <h3 className="font-semibold text-xs text-[var(--color-ink)] flex items-center gap-1.5">
                      <span>{col.title}</span>
                      <span className="font-mono text-[10px] text-[var(--color-ink-tertiary)] px-1.5 py-0.2 rounded bg-[var(--color-base-subtle)] border border-[var(--color-line)]">
                        {col.posts.length}
                      </span>
                    </h3>
                    <p className="text-[10.5px] text-[var(--color-ink-tertiary)] mt-0.5">
                      {col.subtitle}
                    </p>
                  </div>
                </div>

                {/* Column Post Cards */}
                <div className="space-y-2.5">
                  {col.posts.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-[var(--color-ink-muted)] italic">
                      Empty stage
                    </div>
                  ) : (
                    col.posts.map((post) => {
                      const client = post.engagements?.clients;
                      const tabooWords: string[] = client?.client_contexts?.[0]?.taboo_words || [];
                      const bodyLower = (post.body_markdown || "").toLowerCase();
                      const flagged = tabooWords.filter((w) => bodyLower.includes(w.toLowerCase()));

                      return (
                        <div
                          key={post.id}
                          className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-raised)] p-3 space-y-2.5 shadow-xs hover:border-[var(--color-accent-dim)] transition-colors"
                        >
                          {/* Card Client & Pillar */}
                          <div className="flex items-center justify-between text-[10.5px]">
                            <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                              <BrandLogo nameOrDomain={client?.name || "Client"} size={14} className="rounded-[2px]" />
                              <span className="font-medium text-[var(--color-ink-secondary)] truncate">
                                {client?.name || "Client"}
                              </span>
                            </div>
                            {post.target_pillar && (
                              <span className="font-mono text-[9px] uppercase px-1 rounded bg-[var(--color-base-subtle)] text-[var(--color-ink-tertiary)] border border-[var(--color-line)]">
                                {post.target_pillar.split(" ")[0]}
                              </span>
                            )}
                          </div>

                          {/* Post Title (Links to Editor) */}
                          <Link
                            href={`/content/${post.id}`}
                            className="font-medium text-xs text-[var(--color-ink)] hover:text-[var(--color-accent-text)] transition-colors line-clamp-2 block"
                          >
                            {post.title}
                          </Link>

                          {/* Taboo Warning if detected */}
                          {flagged.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--color-danger-text)] bg-[var(--color-danger-bg)] px-1.5 py-0.5 rounded border border-[var(--color-danger-line)]">
                              <ShieldAlert className="h-3 w-3 shrink-0" />
                              <span className="truncate">Taboo: {flagged.join(", ")}</span>
                            </div>
                          )}

                          {/* Published or Scheduled Date */}
                          {post.status === "published" && post.published_at ? (
                            <div className="flex items-center gap-1 text-[10.5px] font-mono text-[var(--color-ok-text)]">
                              <CheckCircle2 className="h-3 w-3 shrink-0" />
                              <span>Published {formatDisplayDateIST(post.published_at)}</span>
                            </div>
                          ) : post.scheduled_publish_date ? (
                            <div className="flex items-center gap-1 text-[10.5px] font-mono text-[var(--color-ink-tertiary)]">
                              <Calendar className="h-3 w-3 text-[var(--color-accent)] shrink-0" />
                              <span>{formatDisplayDateIST(post.scheduled_publish_date)}</span>
                            </div>
                          ) : null}

                          {/* Card Actions Footer */}
                          <div className="pt-2 border-t border-[var(--color-line-subtle)] flex items-center justify-between gap-1.5">
                            <Link
                              href={`/content/${post.id}`}
                              className="text-[11px] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] inline-flex items-center gap-1 font-medium"
                            >
                              <span>Edit</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>

                            <div className="flex items-center gap-1">
                              {post.status === "draft" && (
                                <button
                                  onClick={() => handleStatusTransition(post.id, "internal_review")}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-base-subtle)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-line)] text-[var(--color-ink-secondary)] cursor-pointer"
                                  title="Move to Internal QA"
                                >
                                  Submit QA &rarr;
                                </button>
                              )}

                              {post.status === "internal_review" && (
                                <button
                                  onClick={() => handleStatusTransition(post.id, "client_review")}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-warn-bg)] hover:bg-[var(--color-warn-bg)]/80 border border-[var(--color-warn-line)] text-[var(--color-warn-text)] cursor-pointer"
                                  title="Send to Founder Client Review"
                                >
                                  To Client &rarr;
                                </button>
                              )}

                              {post.status === "client_review" && (
                                <button
                                  onClick={() => openWhatsAppPing(post)}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-base-subtle)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-line)] text-[var(--color-ink)] cursor-pointer flex items-center gap-1"
                                  title="Ping on WhatsApp"
                                >
                                  <WhatsAppIcon size={12} className="text-[#25D366]" />
                                  <span>Ping</span>
                                </button>
                              )}

                              {post.status === "approved" && (
                                <button
                                  onClick={() => handleStatusTransition(post.id, "scheduled")}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-ok-bg)] hover:bg-[var(--color-ok-bg)]/80 border border-[var(--color-ok-line)] text-[var(--color-ok-text)] cursor-pointer"
                                  title="Confirm Scheduled Slot"
                                >
                                  Schedule &rarr;
                                </button>
                              )}

                              {post.status === "scheduled" && (
                                <button
                                  onClick={() => setPublishingPost(post)}
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-ok-bg)] hover:bg-[var(--color-ok-bg)]/80 border border-[var(--color-ok-line)] text-[var(--color-ok-text)] cursor-pointer inline-flex items-center gap-1 font-medium"
                                  title="Mark as Published on LinkedIn"
                                >
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                  <span>Publish &rarr;</span>
                                </button>
                              )}

                              {post.status === "published" && (
                                post.linkedin_post_url ? (
                                  <a
                                    href={post.linkedin_post_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-ok-bg)] hover:bg-[var(--color-ok-bg)]/80 border border-[var(--color-ok-line)] text-[var(--color-ok-text)] inline-flex items-center gap-1"
                                    title="View live LinkedIn post"
                                  >
                                    <span>Live</span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => setPublishingPost(post)}
                                    className="text-[10px] font-mono px-1 py-0.5 rounded bg-[var(--color-base-subtle)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-line)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] cursor-pointer"
                                    title="Add live LinkedIn link"
                                  >
                                    + URL
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: LIST VIEW */}
      {viewMode === "list" && (
        <div className="space-y-3.5">
          {filteredPosts.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-base-subtle)] text-[var(--color-ink-tertiary)] border border-[var(--color-line)]">
                <Feather className="h-5 w-5" />
              </div>
              <p className="font-display text-base font-normal text-[var(--color-ink)]">
                No posts found
              </p>
              <p className="text-xs text-[var(--color-ink-tertiary)]">
                Create a post to start drafting and scheduling.
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="btn btn-primary text-xs inline-flex mt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Post</span>
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const client = post.engagements?.clients;
              const tabooWords: string[] = client?.client_contexts?.[0]?.taboo_words || [];
              const bodyLower = (post.body_markdown || "").toLowerCase();
              const flaggedWords = tabooWords.filter((w) => bodyLower.includes(w.toLowerCase()));

              const isDraft = post.status === "draft";
              const isQA = post.status === "internal_review";
              const isReview = post.status === "client_review";
              const isApproved = post.status === "approved";
              const isScheduled = post.status === "scheduled";
              const isPaused = post.status === "paused";

              return (
                <div
                  key={post.id}
                  className="card p-5 space-y-3 hover:border-[var(--color-line-strong)] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/content/${post.id}`}
                          className="font-medium text-sm text-[var(--color-ink)] hover:text-[var(--color-accent-text)] transition-colors"
                        >
                          {post.title}
                        </Link>
                        <span
                          className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded border ${
                            isReview
                              ? "bg-[var(--color-warn-bg)] text-[var(--color-warn-text)] border-[var(--color-warn-line)]"
                              : isApproved || isScheduled
                              ? "bg-[var(--color-ok-bg)] text-[var(--color-ok-text)] border-[var(--color-ok-line)]"
                              : isPaused
                              ? "bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border-[var(--color-danger-line)]"
                              : "bg-[var(--color-base-subtle)] text-[var(--color-ink-tertiary)] border border-[var(--color-line)]"
                          }`}
                        >
                          {post.status?.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-ink-secondary)]">
                        <div className="flex items-center gap-1.5">
                          <BrandLogo nameOrDomain={client?.name || "Client"} size={14} className="rounded-[2px]" />
                          <span>
                            Client:{" "}
                            <strong className="text-[var(--color-ink)] font-medium">
                              {client?.name || "Client"}
                            </strong>{" "}
                            ({client?.founder_name || "Founder"})
                          </span>
                        </div>
                        {post.target_pillar && (
                          <>
                            <span className="text-[var(--color-ink-tertiary)]">·</span>
                            <span>Pillar: {post.target_pillar}</span>
                          </>
                        )}
                        {post.scheduled_publish_date && (
                          <>
                            <span className="text-[var(--color-ink-tertiary)]">·</span>
                            <span className="font-mono text-[11px] text-[var(--color-accent-text)]">
                              Scheduled: {formatDisplayDateTimeIST(post.scheduled_publish_date, true)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Link
                        href={`/content/${post.id}`}
                        className="btn btn-secondary text-xs inline-flex items-center gap-1"
                      >
                        <span>Open Editor</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>

                      {isReview && (
                        <>
                          <button
                            onClick={() => copyReviewLink(post)}
                            className="btn btn-secondary text-xs"
                            title="Copy Review Link"
                          >
                            <Copy className="h-3 w-3" />
                            <span>{copiedId === post.id ? "Copied" : "Copy Link"}</span>
                          </button>
                          <button
                            onClick={() => openWhatsAppPing(post)}
                            className="btn btn-primary text-xs"
                            title="Nudge founder on WhatsApp"
                          >
                            <WhatsAppIcon size={13} className="text-[#25D366]" />
                            <span>WhatsApp</span>
                          </button>
                        </>
                      )}

                      {isScheduled && (
                        <button
                          onClick={() => setPublishingPost(post)}
                          className="btn btn-secondary text-xs inline-flex items-center gap-1 text-[var(--color-ok-text)] border-[var(--color-ok-line)] bg-[var(--color-ok-bg)] hover:bg-[var(--color-ok-bg)]/80 cursor-pointer"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Publish</span>
                        </button>
                      )}

                      {post.status === "published" && (
                        post.linkedin_post_url ? (
                          <a
                            href={post.linkedin_post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary text-xs inline-flex items-center gap-1 text-[var(--color-ok-text)]"
                          >
                            <span>Live on LinkedIn</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <button
                            onClick={() => setPublishingPost(post)}
                            className="btn btn-secondary text-xs inline-flex items-center gap-1"
                          >
                            <span>+ Add URL</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Body Snippet */}
                  <p className="text-xs text-[var(--color-ink-secondary)] line-clamp-2 leading-relaxed font-sans">
                    {post.body_markdown || "No body draft."}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* NEW CONTENT MODAL */}
      <NewContentModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        engagements={engagements}
      />

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
