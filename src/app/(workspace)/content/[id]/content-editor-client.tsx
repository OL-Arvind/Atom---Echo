"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  Send,
  Share2,
  Sparkles,
  BookOpen,
  Smartphone,
  Copy,
  ExternalLink,
  MessageCircle,
  Clock,
  Check,
  Plus,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import {
  updateContentPostAction,
  updateContentStatusAction,
  sendForClientReviewAction,
} from "@/lib/actions/content";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { CustomSelect } from "@/components/ui/custom-select";

interface ContentEditorClientProps {
  post: any;
  context: any;
  knowledgeItems: any[];
  feedbackItems: any[];
  reviewToken: string | null;
}

const DEFAULT_PILLARS = [
  "Thought Leadership",
  "Founder Journey & Origin",
  "Engineering & Tech Contrarian",
  "Customer Case Study",
  "Hiring & Culture",
];

export function ContentEditorClient({
  post,
  context,
  knowledgeItems,
  feedbackItems,
  reviewToken,
}: ContentEditorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [title, setTitle] = useState(post.title || "");
  const [bodyMarkdown, setBodyMarkdown] = useState(post.body_markdown || "");
  const [targetPillar, setTargetPillar] = useState(post.target_pillar || "Thought Leadership");
  const [status, setStatus] = useState(post.status || "draft");
  const [scheduledDate, setScheduledDate] = useState(
    post.scheduled_publish_date
      ? new Date(post.scheduled_publish_date).toISOString().slice(0, 16)
      : ""
  );

  const [activeRightTab, setActiveRightTab] = useState<"preview" | "context">("preview");
  const [seeMoreExpanded, setSeeMoreExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const client = post.engagements?.clients;
  const tabooWords: string[] = context?.taboo_words || [];

  const pillars: string[] = context?.core_pillars && context.core_pillars.length > 0
    ? context.core_pillars
    : DEFAULT_PILLARS;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time metrics
  const charCount = bodyMarkdown.length;
  const wordCount = bodyMarkdown.trim() ? bodyMarkdown.trim().split(/\s+/).length : 0;
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  // Real-time Taboo Word Linter
  const flaggedWords = useMemo(() => {
    const text = (title + " " + bodyMarkdown).toLowerCase();
    return tabooWords.filter((w) => {
      const reg = new RegExp(`\\b${w.toLowerCase()}\\b`, "i");
      return reg.test(text);
    });
  }, [title, bodyMarkdown, tabooWords]);

  // Remove a detected taboo word
  const handleRemoveTabooWord = (word: string) => {
    const reg = new RegExp(`\\b${word}\\b`, "gi");
    setBodyMarkdown((prev: string) => prev.replace(reg, "").replace(/\s\s+/g, " "));
    showToast(`Removed forbidden word: "${word}"`);
  };

  // Insert context or proof point into body at end
  const handleInsertSnippet = (snippet: string) => {
    setBodyMarkdown((prev: string) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n\n${snippet}` : snippet;
    });
    showToast("Inserted verified fact into post draft!");
  };

  // Save changes
  const handleSave = (newStatus?: string) => {
    startTransition(async () => {
      const statusToSave = newStatus || status;
      const formData = new FormData();
      formData.set("title", title);
      formData.set("body_markdown", bodyMarkdown);
      formData.set("target_pillar", targetPillar);
      formData.set("status", statusToSave);
      if (scheduledDate) {
        formData.set("scheduled_publish_date", scheduledDate);
      }

      const res = await updateContentPostAction(post.id, formData);
      if (res.success) {
        if (newStatus) setStatus(newStatus);
        showToast("Post saved successfully!");
        router.refresh();
      } else {
        showToast(`Save error: ${res.error}`);
      }
    });
  };

  // Transition status
  const handleStatusTransition = (newStatus: string) => {
    if (newStatus === "client_review" && flaggedWords.length > 0) {
      const confirmSend = window.confirm(
        `Warning: This draft still contains ${flaggedWords.length} taboo word(s): ${flaggedWords.join(
          ", "
        )}. Are you sure you want to send to the client?`
      );
      if (!confirmSend) return;
    }
    handleSave(newStatus);
  };

  // WhatsApp Review link
  const reviewUrl = reviewToken ? `${typeof window !== "undefined" ? window.location.origin : ""}/review/${reviewToken}` : null;

  const openWhatsAppPing = async () => {
    let currentReviewUrl = reviewUrl;
    if (!currentReviewUrl) {
      const res = await sendForClientReviewAction(post.id);
      if (res.success && res.whatsappUrl) {
        window.open(res.whatsappUrl, "_blank");
        showToast("Generated 7-day review link and opened WhatsApp!");
        return;
      }
    }

    const phone = client?.founder_phone ? client.founder_phone.replace(/[^0-9]/g, "") : "";
    if (!phone) {
      showToast("No phone number configured for this founder.");
      return;
    }
    const message = encodeURIComponent(
      `Hi ${client.founder_name || "there"}, here is your latest LinkedIn draft ready for review: ${currentReviewUrl}`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  // LinkedIn mobile fold logic: LinkedIn cuts after ~210 chars or ~3 lines
  const foldCutoff = 210;
  const isOverFold = bodyMarkdown.length > foldCutoff;
  const hookText = isOverFold && !seeMoreExpanded
    ? bodyMarkdown.slice(0, foldCutoff).trim() + "..."
    : bodyMarkdown;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Context Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-line-subtle)] pb-4">
        <div>
          <Link
            href="/content"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Content Pipeline</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              Post Editor
            </h1>
            <span className="text-[var(--color-ink-tertiary)]">·</span>
            <span className="text-sm font-medium text-[var(--color-ink)]">
              {client?.name || "Client"}
            </span>
            <span className="text-xs text-[var(--color-ink-tertiary)]">
              ({client?.founder_name || "Founder"})
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] text-xs font-mono">
            <span className="text-[var(--color-ink-tertiary)] uppercase text-[10px]">Status:</span>
            <span
              className={`font-semibold uppercase ${
                status === "approved" || status === "scheduled"
                  ? "text-[var(--color-ok-text)]"
                  : status === "client_review"
                  ? "text-[var(--color-warn-text)]"
                  : "text-[var(--color-ink)]"
              }`}
            >
              {status}
            </span>
          </div>

          {/* Quick Transitions */}
          {status === "draft" && (
            <button
              onClick={() => handleStatusTransition("internal_review")}
              disabled={isPending}
              className="btn btn-secondary text-xs cursor-pointer"
            >
              Submit for Internal QA
            </button>
          )}

          {status === "internal_review" && (
            <button
              onClick={() => handleStatusTransition("client_review")}
              disabled={isPending}
              className="btn text-xs bg-[var(--color-warn-bg)] text-[var(--color-warn-text)] border border-[var(--color-warn-line)] hover:bg-[var(--color-warn-bg)]/80 cursor-pointer"
            >
              Send to Client Review
            </button>
          )}

          {status === "client_review" && (
            <>
              <button
                onClick={openWhatsAppPing}
                className="btn btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <WhatsAppIcon size={14} className="text-[#25D366]" />
                <span>Nudge on WhatsApp</span>
              </button>
              <button
                onClick={() => handleStatusTransition("approved")}
                disabled={isPending}
                className="btn btn-secondary text-xs cursor-pointer"
              >
                Force Approve &amp; Lock
              </button>
            </>
          )}

          {status === "approved" && (
            <button
              onClick={() => handleStatusTransition("scheduled")}
              disabled={isPending}
              className="btn btn-primary text-xs cursor-pointer"
            >
              Confirm Scheduled Slot
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={() => handleSave()}
            disabled={isPending}
            className="btn btn-primary text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isPending ? "Saving..." : "Save Post"}</span>
          </button>
        </div>
      </div>

      {/* Real-time Taboo Words Linter Banner */}
      {flaggedWords.length > 0 ? (
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-danger-line)] bg-[var(--color-danger-bg)] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-4 w-4 text-[var(--color-danger-text)] shrink-0" />
            <div>
              <span className="font-semibold text-[var(--color-danger-text)]">
                Taboo Buzzwords Detected ({flaggedWords.length}):
              </span>{" "}
              <span className="text-[var(--color-ink-secondary)]">
                Per {client?.name}&apos;s voice rules, avoid hollow corporate jargon:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {flaggedWords.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-black/40 text-[var(--color-danger-text)] border border-[var(--color-danger-line)]"
                  >
                    <span>&ldquo;{word}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTabooWord(word)}
                      className="text-xs hover:text-white font-bold ml-1 cursor-pointer"
                      title="Remove from text"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <span className="text-[11px] font-mono text-[var(--color-danger-text)] shrink-0">
            AUT-12 Active
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] border border-[var(--color-line)] text-[var(--color-ink-secondary)]">
          <span className="flex items-center gap-1.5 text-[var(--color-ok-text)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Copy is clean: 0 taboo buzzwords detected</span>
          </span>
          <span className="font-mono text-[11px] text-[var(--color-ink-tertiary)]">
            {tabooWords.length} protected terms
          </span>
        </div>
      )}

      {/* Two-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Markdown Authoring Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card p-5 space-y-4">
            {/* Title & Pillar Row */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block mb-1">
                  Post Headline / Internal Working Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The 2 AM Database Migration Disaster"
                  className="input w-full font-medium text-sm text-[var(--color-ink)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block mb-1">
                    Content Pillar
                  </label>
                  <CustomSelect
                    options={pillars.map((p) => ({ value: p, label: p }))}
                    value={targetPillar}
                    onChange={setTargetPillar}
                    placeholder="Select Content Pillar"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)] block mb-1">
                    Scheduled Publish Date
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="input w-full text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Markdown Post Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-tertiary)]">
                  Post Body (Markdown)
                </label>
                <span className="text-[11px] font-mono text-[var(--color-ink-tertiary)]">
                  {readingTimeMin} min read
                </span>
              </div>
              <textarea
                value={bodyMarkdown}
                onChange={(e) => setBodyMarkdown(e.target.value)}
                placeholder="Hook goes here. Most CTOs think microservices scale best...&#10;&#10;They are wrong. In 2024, our database crashed..."
                rows={16}
                className="input w-full font-sans text-[13.5px] leading-relaxed p-3.5 resize-y min-h-[360px]"
              />
            </div>

            {/* Metrics Footer Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--color-line-subtle)] text-xs">
              <div className="flex items-center gap-4 font-mono text-[11.5px] text-[var(--color-ink-secondary)]">
                <span>
                  Words: <strong className="text-[var(--color-ink)]">{wordCount}</strong>
                </span>
                <span>
                  Characters: <strong className="text-[var(--color-ink)]">{charCount}</strong> / 3,000
                </span>
              </div>

              {/* LinkedIn Character Range Meter */}
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-[var(--color-ink-tertiary)]">Sweet spot: 1,200–1,800 chars</span>
                <div className="w-24 h-1.5 rounded-full bg-[var(--color-line)] overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      charCount > 3000
                        ? "bg-[var(--color-danger)]"
                        : charCount >= 1200 && charCount <= 1800
                        ? "bg-[var(--color-ok)]"
                        : "bg-[var(--color-accent)]"
                    }`}
                    style={{ width: `${Math.min(100, (charCount / 3000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Section if feedback items exist */}
          {feedbackItems && feedbackItems.length > 0 && (
            <div className="card p-5 space-y-3">
              <h3 className="font-display text-sm font-normal text-[var(--color-ink)] flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[var(--color-warn)]" />
                <span>Client Feedback &amp; Revision Requests</span>
              </h3>
              <div className="divide-y divide-[var(--color-line-subtle)]">
                {feedbackItems.map((fb) => (
                  <div key={fb.id} className="py-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-ink-tertiary)]">
                      <span>{fb.author_name} ({fb.author_type})</span>
                      <span>{new Date(fb.created_at).toLocaleString("en-IN")}</span>
                    </div>
                    <p className="text-[var(--color-ink)] bg-[var(--color-base-subtle)] p-2 rounded">
                      {fb.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LinkedIn Mobile Simulator & Story Vault (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sub-Nav Toggle */}
          <div className="flex items-center rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base-subtle)] p-0.5">
            <button
              onClick={() => setActiveRightTab("preview")}
              className={`flex-1 py-1.5 text-xs rounded-[3px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeRightTab === "preview"
                  ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium shadow-xs"
                  : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>LinkedIn Mobile Fold</span>
            </button>
            <button
              onClick={() => setActiveRightTab("context")}
              className={`flex-1 py-1.5 text-xs rounded-[3px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeRightTab === "context"
                  ? "bg-[var(--color-surface-active)] text-[var(--color-ink)] font-medium shadow-xs"
                  : "text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Story &amp; Metric Vault ({knowledgeItems.length})</span>
            </button>
          </div>

          {/* TAB A: LIVE LINKEDIN MOBILE SIMULATOR */}
          {activeRightTab === "preview" && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[var(--color-line-subtle)]">
                <span className="font-mono uppercase text-[10px] text-[var(--color-ink-tertiary)] font-medium">
                  Realistic LinkedIn Mobile Feed
                </span>
                <span className="font-mono text-[10.5px] text-[var(--color-ink-tertiary)]">
                  Fold: ~210 chars
                </span>
              </div>

              {/* Native LinkedIn Mobile Card Simulation */}
              <div className="rounded-xl border border-[var(--color-line-strong)] bg-[#1b1f23] p-4 text-[#f3f4f6] shadow-xl space-y-3 font-sans">
                {/* Author Info */}
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-full bg-[#374151] flex items-center justify-center text-sm font-bold text-white shrink-0 border border-white/10">
                    {client?.founder_name?.charAt(0) || "F"}
                  </div>
                  <div className="min-w-0 flex-1 leading-snug">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-white truncate">
                        {client?.founder_name || "Founder Name"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">· 1st</span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">
                      {client?.founder_title || "Founder & CEO"} at {client?.name || "Company"}
                    </p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                      <span>Just now</span>
                      <span>·</span>
                      <span>🌐</span>
                    </p>
                  </div>
                </div>

                {/* Hook & Body with Fold Indicator */}
                <div className="text-[13px] text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {bodyMarkdown ? (
                    <>
                      {hookText}
                      {isOverFold && (
                        <button
                          type="button"
                          onClick={() => setSeeMoreExpanded(!seeMoreExpanded)}
                          className="text-gray-400 hover:text-white font-medium ml-1 cursor-pointer underline text-xs"
                        >
                          {seeMoreExpanded ? "less" : "...see more"}
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-500 italic">
                      Start typing in the editor to preview how your hook appears on LinkedIn mobile before the &ldquo;...see more&rdquo; cut...
                    </span>
                  )}
                </div>

                {/* LinkedIn Action Bar */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-gray-400 text-[11px]">
                  <span className="hover:text-white cursor-pointer">👍 Like</span>
                  <span className="hover:text-white cursor-pointer">💬 Comment</span>
                  <span className="hover:text-white cursor-pointer">🔁 Repost</span>
                  <span className="hover:text-white cursor-pointer">📤 Send</span>
                </div>
              </div>

              {/* Hook Analysis Box */}
              <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-3 border border-[var(--color-line)] text-xs space-y-1">
                <span className="font-mono uppercase text-[9.5px] text-[var(--color-ink-tertiary)] block font-medium">
                  Hook Optimization Rule:
                </span>
                <p className="text-[var(--color-ink-secondary)] text-[11.5px] leading-relaxed">
                  LinkedIn displays the first 2–3 lines before requiring the user to tap &ldquo;...see more&rdquo;. Keep your contrarian assertion, problem, or surprising metric inside the first 210 characters to maximize click-through rate.
                </p>
              </div>
            </div>
          )}

          {/* TAB B: CLIENT CONTEXT & STORY VAULT */}
          {activeRightTab === "context" && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-2">
                <span className="font-mono uppercase text-[10px] text-[var(--color-ink-tertiary)] font-medium">
                  Verified Proof Points &amp; Stories
                </span>
                <span className="text-xs text-[var(--color-ink-tertiary)] font-mono">
                  1-Click Insert
                </span>
              </div>

              {/* Positioning & Tone Header */}
              {context && (
                <div className="rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)] p-3 border border-[var(--color-line)] space-y-1.5 text-xs">
                  <div>
                    <span className="text-[var(--color-ink-tertiary)] text-[10px] font-mono uppercase block">
                      Target ICP:
                    </span>
                    <p className="text-[var(--color-ink)] font-medium">
                      {context.target_audience_icp || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--color-ink-tertiary)] text-[10px] font-mono uppercase block">
                      Tone Archetype:
                    </span>
                    <p className="text-[var(--color-ink)] font-medium">
                      {context.tone_archetype || "Not specified"}
                    </p>
                  </div>
                </div>
              )}

              {/* Knowledge Items List */}
              {knowledgeItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--color-ink-tertiary)] space-y-2">
                  <p>No verified stories or proof points logged yet.</p>
                  <p className="text-[11px] text-[var(--color-ink-muted)]">
                    Stories extracted from Fathom client interviews will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {knowledgeItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-base)] p-3 space-y-2 hover:border-[var(--color-accent-dim)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-[var(--color-base-subtle)] text-[var(--color-ink-tertiary)] border border-[var(--color-line)] inline-block mb-1">
                            {item.category}
                          </span>
                          <h4 className="font-medium text-xs text-[var(--color-ink)]">
                            {item.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInsertSnippet(item.content)}
                          className="btn btn-secondary text-[11px] py-1 px-2 shrink-0 cursor-pointer inline-flex items-center gap-1"
                          title="Insert this fact directly into your draft"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Insert</span>
                        </button>
                      </div>

                      <p className="text-xs text-[var(--color-ink-secondary)] leading-relaxed line-clamp-3">
                        {item.content}
                      </p>

                      {item.verified_metrics && Object.keys(item.verified_metrics).length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-[var(--color-line-subtle)] text-[10.5px] font-mono text-[var(--color-accent-text)]">
                          {Object.entries(item.verified_metrics).map(([k, v]) => (
                            <span key={k}>
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
