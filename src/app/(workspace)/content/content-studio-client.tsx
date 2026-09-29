"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Feather,
  Plus,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { updateContentStatusAction, sendForClientReviewAction } from "@/lib/actions/content";
import { MarkPublishedModal } from "@/components/content/mark-published-modal";
import { PageHeader } from "@/components/layout/page-header";
import { BrandLogo } from "@/components/ui/brand-logo";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { CustomSelect } from "@/components/ui/custom-select";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import { MetricRibbon } from "@/components/ui/metric-ribbon";
import { EmptyState } from "@/components/ui/empty-state";
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
      ? `/content/new?clientId=${selectedClientId}`
      : "/content/new";

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
        description="Shape founder conviction and unfiltered opinions into distinctive, high-impact LinkedIn perspectives."
      >
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

      {/* Editorial Cadence Ribbon */}
      <MetricRibbon
        items={[
          {
            label: "Capture & Voice QA",
            value: draftCount,
            subtext: "perspectives in drafting",
          },
          {
            label: "Awaiting Founder Review",
            value: reviewCount,
            subtext: reviewCount > 0 ? "pending 1-tap sign-off" : "desk is clear",
            tone: reviewCount > 0 ? "warn" : "default",
          },
          {
            label: "Locked & Scheduled",
            value: scheduledCount,
            subtext: "ready on publishing timeline",
            tone: scheduledCount > 0 ? "ok" : "default",
          },
          {
            label: "Pipeline Volume",
            value: initialPosts.length,
            subtext: "total perspectives",
          },
        ]}
      />

      {/* Filter & Client Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-line-subtle)] pb-3">
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

        {viewMode === "list" ? (
          <SegmentedFilter
            options={[
              { id: "all", label: "All", count: initialPosts.length },
              { id: "draft", label: "Drafts", count: draftCount },
              { id: "review", label: "Founder Review", count: reviewCount },
              { id: "scheduled", label: "Scheduled", count: scheduledCount },
            ]}
            value={filter}
            onChange={setFilter}
          />
        ) : (
          <div className="text-xs font-sans tabular-nums text-[var(--color-ink-tertiary)] flex items-center gap-2">
            <span>Editorial Flow · Idea to Publishing</span>
            <span>·</span>
            <Link
              href="/calendar"
              className="hover:text-[var(--color-ink)] underline flex items-center gap-1"
            >
              <span>Publishing Schedule</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* VIEW 1: KANBAN BOARD VIEW */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
          {kanbanColumns.map((col) => (
            <div
              key={col.id}
              className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-base-subtle)]/40 p-3 space-y-3 min-w-[240px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2">
                <div>
                  <h3 className="font-semibold text-xs text-[var(--color-ink)] flex items-center gap-1.5">
                    <span>{col.title}</span>
                    <span className="font-sans text-[11px] text-[var(--color-ink-tertiary)] font-normal tabular-nums">
                      ({col.posts.length})
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
                    const flagged = tabooWords.filter((w) => {
                      const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                      return new RegExp(`\\b${escaped}\\b`, "i").test(bodyLower);
                    });

                    const unresolvedNotes = (post.content_feedback || [])
                      .filter((fb: any) => !fb.is_resolved && fb.comment)
                      .sort(
                        (a: any, b: any) =>
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                      );
                    const latestUnresolved = unresolvedNotes[0];
                    const hasFounderRevision = unresolvedNotes.some(
                      (fb: any) => fb.author_type === "client"
                    );

                    return (
                      <div
                        key={post.id}
                        className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-raised)] p-3 space-y-2.5 shadow-xs hover:border-[var(--color-line-strong)] transition-colors"
                      >
                        {/* Card Client & Pillar */}
                        <div className="flex items-center justify-between text-[10.5px]">
                          <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                            <BrandLogo
                              nameOrDomain={client?.name || "Client"}
                              size={14}
                              className="rounded-[2px]"
                            />
                            <span className="font-medium text-[var(--color-ink-secondary)] truncate">
                              {client?.name || "Client"}
                            </span>
                          </div>
                          {post.target_pillar && (
                            <span className="font-sans tabular-nums text-[10px] uppercase tracking-wider text-[var(--color-ink-tertiary)]">
                              {post.target_pillar.split(" ")[0]}
                            </span>
                          )}
                        </div>

                        {/* Unresolved Revision Note Indicator (if returned to Draft) */}
                        {latestUnresolved && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-warn-text)]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warn)] shrink-0" />
                              <span>
                                {latestUnresolved.author_type === "operator"
                                  ? "QA Revision Note"
                                  : "Founder Revision"}
                              </span>
                            </div>
                            <p className="border-l-2 border-[var(--color-line-strong)] pl-2 py-0.5 text-[11px] text-[var(--color-ink-secondary)] line-clamp-2 leading-snug">
                              {latestUnresolved.comment}
                            </p>
                          </div>
                        )}

                        {/* Post Title (Links to Editor) */}
                        <Link
                          href={`/content/${post.id}`}
                          className="font-medium text-xs text-[var(--color-ink)] hover:text-[var(--color-accent-text)] transition-colors line-clamp-2 block"
                        >
                          {post.title}
                        </Link>

                        {/* Taboo Warning if detected */}
                        {flagged.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10.5px] font-sans tabular-nums text-[var(--color-danger-text)] border-l-2 border-[var(--color-danger-line)] pl-2 py-0.5">
                            <ShieldAlert className="h-3 w-3 shrink-0" />
                            <span className="truncate">Taboo: {flagged.join(", ")}</span>
                          </div>
                        )}

                        {/* Published or Scheduled Date */}
                        {post.status === "published" && post.published_at ? (
                          <div className="flex items-center gap-1 text-[10.5px] font-sans tabular-nums text-[var(--color-ok-text)]">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            <span>Published {formatDisplayDateIST(post.published_at)}</span>
                          </div>
                        ) : post.scheduled_publish_date ? (
                          <div className="flex items-center gap-1 text-[10.5px] font-sans tabular-nums text-[var(--color-ink-tertiary)]">
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
                            <span>Studio</span>
                            <ChevronRight className="h-3 w-3" />
                          </Link>

                          <div className="flex items-center gap-1">
                            {post.status === "draft" && (
                              hasFounderRevision ? (
                                <button
                                  onClick={() => handleStatusTransition(post, "client_review")}
                                  disabled={isPending}
                                  className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer"
                                  title="Re-send revised post directly to Founder Desk"
                                >
                                  <span>Re-send &rarr;</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStatusTransition(post, "internal_review")}
                                  disabled={isPending}
                                  className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer"
                                  title="Move to Internal Voice QA"
                                >
                                  <span>Ready for QA &rarr;</span>
                                </button>
                              )
                            )}

                            {post.status === "internal_review" && (
                              <button
                                onClick={() => handleStatusTransition(post, "client_review")}
                                disabled={isPending}
                                className="btn btn-primary text-[10.5px] py-0.5 px-2 cursor-pointer"
                                title="Send to Founder Desk & copy review link"
                              >
                                <span>Send to Founder &rarr;</span>
                              </button>
                            )}

                            {post.status === "client_review" && (
                              <>
                                <button
                                  onClick={() => copyReviewLink(post)}
                                  className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer inline-flex items-center gap-1"
                                  title="Copy private Founder Desk link"
                                >
                                  {copiedId === post.id ? (
                                    <>
                                      <Check className="h-2.5 w-2.5 text-[var(--color-ok)]" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-2.5 w-2.5 text-[var(--color-ink-tertiary)]" />
                                      <span>Link</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => openWhatsAppPing(post)}
                                  className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer inline-flex items-center gap-1"
                                  title="Ping founder on WhatsApp"
                                >
                                  <WhatsAppIcon size={11} className="text-[#25D366]" />
                                  <span>Ping</span>
                                </button>
                              </>
                            )}

                            {post.status === "approved" && (
                              <button
                                onClick={() => handleStatusTransition(post, "scheduled")}
                                disabled={isPending}
                                className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer"
                                title="Confirm Scheduled Slot on Timeline"
                              >
                                <span>Lock Schedule &rarr;</span>
                              </button>
                            )}

                            {post.status === "scheduled" && (
                              <button
                                onClick={() => setPublishingPost(post)}
                                className="btn btn-primary text-[10.5px] py-0.5 px-2 cursor-pointer inline-flex items-center gap-1"
                                title="Mark as Published on LinkedIn"
                              >
                                <span>Publish &rarr;</span>
                              </button>
                            )}

                            {post.status === "published" &&
                              (post.linkedin_post_url ? (
                                <a
                                  href={post.linkedin_post_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-secondary text-[10.5px] py-0.5 px-2 inline-flex items-center gap-1"
                                  title="View live LinkedIn post"
                                >
                                  <span>Live</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              ) : (
                                <button
                                  onClick={() => setPublishingPost(post)}
                                  className="btn btn-secondary text-[10.5px] py-0.5 px-2 cursor-pointer"
                                  title="Add live LinkedIn link"
                                >
                                  <span>+ URL</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: LIST VIEW */}
      {viewMode === "list" && (
        <div className="space-y-3.5">
          {filteredPosts.length === 0 ? (
            <EmptyState
              icon={Feather}
              title="No perspectives found"
              description="Draft a perspective to capture founder conviction and shape it for LinkedIn."
              action={
                <Link
                  href={newPerspectiveHref}
                  className="btn btn-primary text-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Draft Perspective</span>
                </Link>
              }
            />
          ) : (
            filteredPosts.map((post) => {
              const client = post.engagements?.clients;
              const isDraft = post.status === "draft";
              const isQA = post.status === "internal_review";
              const isReview = post.status === "client_review";
              const isApproved = post.status === "approved";
              const isScheduled = post.status === "scheduled";
              const isPaused = post.status === "paused";

              const unresolvedNotes = (post.content_feedback || [])
                .filter((fb: any) => !fb.is_resolved && fb.comment)
                .sort(
                  (a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
              const latestUnresolved = unresolvedNotes[0];

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
                        <span className="inline-flex items-center gap-1.5 text-[10.5px] font-sans tabular-nums uppercase tracking-wider text-[var(--color-ink-secondary)]">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isReview || latestUnresolved
                                ? "bg-[var(--color-warn)]"
                                : isApproved || isScheduled
                                ? "bg-[var(--color-ok)]"
                                : isPaused
                                ? "bg-[var(--color-danger)]"
                                : "bg-[var(--color-ink-muted)]"
                            }`}
                          />
                          {latestUnresolved
                            ? latestUnresolved.author_type === "operator"
                              ? "QA Revision"
                              : "Founder Revision"
                            : post.status?.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-ink-secondary)]">
                        <div className="flex items-center gap-1.5">
                          <BrandLogo
                            nameOrDomain={client?.name || "Client"}
                            size={14}
                            className="rounded-[2px]"
                          />
                          <span>
                            <strong className="text-[var(--color-ink)] font-medium">
                              {client?.name || "Client"}
                            </strong>{" "}
                            ({client?.founder_name || "Founder"})
                          </span>
                        </div>
                        {post.target_pillar && (
                          <>
                            <span className="text-[var(--color-ink-tertiary)]">·</span>
                            <span>{post.target_pillar}</span>
                          </>
                        )}
                        {post.scheduled_publish_date && (
                          <>
                            <span className="text-[var(--color-ink-tertiary)]">·</span>
                            <span className="font-sans tabular-nums text-[11px] text-[var(--color-accent-text)]">
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
                        <span>Open Studio</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>

                      {isDraft && (
                        <button
                          onClick={() =>
                            handleStatusTransition(
                              post,
                              latestUnresolved?.author_type === "client"
                                ? "client_review"
                                : "internal_review"
                            )
                          }
                          disabled={isPending}
                          className="btn btn-primary text-xs cursor-pointer"
                        >
                          <span>
                            {latestUnresolved?.author_type === "client"
                              ? "Re-send to Founder ↗"
                              : "Ready for QA →"}
                          </span>
                        </button>
                      )}

                      {isQA && (
                        <button
                          onClick={() => handleStatusTransition(post, "client_review")}
                          disabled={isPending}
                          className="btn btn-primary text-xs cursor-pointer"
                        >
                          <span>Send to Founder ↗</span>
                        </button>
                      )}

                      {isReview && (
                        <>
                          <button
                            onClick={() => copyReviewLink(post)}
                            className="btn btn-secondary text-xs cursor-pointer"
                            title="Copy Review Link"
                          >
                            <Copy className="h-3 w-3" />
                            <span>{copiedId === post.id ? "Copied" : "Copy Link"}</span>
                          </button>
                          <button
                            onClick={() => openWhatsAppPing(post)}
                            className="btn btn-primary text-xs cursor-pointer"
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
                          className="btn btn-primary text-xs cursor-pointer"
                        >
                          <span>Publish</span>
                        </button>
                      )}

                      {post.status === "published" &&
                        (post.linkedin_post_url ? (
                          <a
                            href={post.linkedin_post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary text-xs inline-flex items-center gap-1"
                          >
                            <span>Live on LinkedIn</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <button
                            onClick={() => setPublishingPost(post)}
                            className="btn btn-secondary text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>+ Add URL</span>
                          </button>
                        ))}
                    </div>
                  </div>

                  {latestUnresolved && (
                    <p className="border-l-2 border-[var(--color-line-strong)] pl-3 py-1 text-xs text-[var(--color-ink)] leading-relaxed">
                      <span className="font-medium text-[var(--color-warn-text)] mr-1.5">
                        {latestUnresolved.author_name}:
                      </span>
                      {latestUnresolved.comment}
                    </p>
                  )}

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
