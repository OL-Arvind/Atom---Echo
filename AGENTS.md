# Atom & Echo OS — Agent Instructions & Operating Rules

**Target System**: Custom Operating System for Atom & Echo  
**Product Architecture**: BaseEngine Productized Operating System (by BaseWorks)  
**Primary Users**: Sudeesh D S (Founder/Admin), Nikhil (Execution Team), High-tier Founder Clients (Reviewers)  

---

## 1. Prime Directives for All AI Coding Agents

Before touching, modifying, or creating any code in this repository, you MUST follow this sequence:

1. **Read [`00_PROJECT/SOURCE_OF_TRUTH.md`](file:///d:/BaseWorks/Atom%20&%20Echo/00_PROJECT/SOURCE_OF_TRUTH.md)** to understand which documents govern decisions.
2. **Read [`06_BUILD/CURRENT_STATE.md`](file:///d:/BaseWorks/Atom%20&%20Echo/06_BUILD/CURRENT_STATE.md)** to know the active build slice, what is done, what is next, and what is currently blocked.
3. **Read the relevant domain spec** in [`02_BLUEPRINT/`](file:///d:/BaseWorks/Atom%20&%20Echo/02_BLUEPRINT/) (`DOMAIN_MODEL.md`, `STATE_MACHINES.md`, `EVENT_MODEL.md`, `AUTOMATION_RULES.md`).
4. **Check [`00_PROJECT/DECISIONS.md`](file:///d:/BaseWorks/Atom%20&%20Echo/00_PROJECT/DECISIONS.md)** for settled Architecture Decision Records (ADRs). **Never reopen settled decisions.**
5. **Read [`06_BUILD/ACCEPTANCE_CRITERIA.md`](file:///d:/BaseWorks/Atom%20&%20Echo/06_BUILD/ACCEPTANCE_CRITERIA.md)** to ensure your changes satisfy the objective acceptance gates.

---

## 2. Core Architectural Laws: What We Refuse to Do

### LAW 1: "Manual by Exception"
> **The user should not be maintaining the operating system. The operating system must maintain itself from the work the user is already doing.**

* **FORBIDDEN**: Creating forms where an operator has to update 5 separate status fields, copy dates across tables, and manually create reminder tasks.
* **FORBIDDEN ("Fake Dismiss" Anti-Pattern)**: Never add a local-state-only "Dismiss (`X`)" or "Mark as Resolved" button to an operational queue that hides items in React `useState` without mutating the database. An item in the Command Center is a live projection of unresolved domain state—it may only leave the queue when a real server action transitions its underlying database state (`content_items.status`, `content_feedback.is_resolved`, `invoices.status`, `tool_expenses.status`, `client_requests.status`, `tool_subscriptions.next_renewal_date`).
* **MANDATORY**: Prefer `EVENT → STATE MACHINE TRANSITION → DOWNSTREAM AUTOMATION`. When an event occurs (e.g. client approves a post in the mobile portal), the system automatically updates the content state, confirms calendar scheduling, generates publishing tasks, logs an audit trail, and notifies the team.
* **MANDATORY (Zero-Friction Content & Revision Loop)**:
  - Advancing a post forward (`internal_review`, `client_review`, `approved`, `scheduled`, `published`) must automatically mark open `content_feedback` notes on that post as `is_resolved = true` (`autoResolvePostFeedback`).
  - Dispatching a post to `client_review` must automatically ensure an active 1-tap `review_token` exists and copy the full `${origin}/review/${token}` URL to the operator's clipboard.
  - Active revision notes must be pinned at the top of the writing canvas in `/content/[id]`, and prior founder revision notes (`last_client_feedback`) must be displayed as an editorial hairline inset in `/review/[token]` to prevent founder amnesia on re-review.

### LAW 2: Never Recreate a Notion Clone
* Do **NOT** create a sidebar with 15 database tables (Clients, Posts, Invoices, Tasks, Passwords) where users navigate raw rows and columns.
* Build an **attention surface**. The Command Center answers: *"What requires attention right now, why, who is waiting, and what happens next?"*
* **No Modal Close (`X`) Buttons on Persistent Split-View Inspectors**: In a Master-Detail Split View (e.g. Command Center Left Queue + Right Inspector), the right pane is a permanent inspector for the selected queue item, NOT a popup modal. Never place a top-right `X` dismiss button on a persistent inspector header.
* **Direct-to-Studio Creation (No Modal Roadblocks for Deep Authoring)**: Creating a LinkedIn perspective must route directly to the full split-screen Studio (`/content/new?clientId=...&meetingId=...`) with the founder's Story Vault, Voice Guardrails, and Meeting Takeaways immediately accessible—never behind a pop-up modal roadblock or redundant "Working Title" input field (auto-derive the title from the opening hook line).
* The Calendar is a **temporal projection** of operational data (content dates, campaign dates, meetings, renewals), NOT an input database where users type entries.

### LAW 3: Single Source of Truth
* A client is not a page; an engagement is not a tag; content is an operational work object passing through a state machine.
* Do not introduce duplicate stores or split state across multiple components.

### LAW 4: "Strict 500-Line Limit & Modular Lifecycle Hooks"
* **FORBIDDEN**: Permitting any file in `src/**/*.ts` or `src/**/*.tsx` to grow beyond 500 lines. Monolithic 1,000+ line views create maintainability hazards, cognitive overload, and merge conflicts.
* **MANDATORY**: Decompose large views into focused presentation subcomponents and domain hooks:
  - **Presentation**: Extract mastheads, canvas cards, inspector panes, and tab contents into dedicated subdirectories (e.g., `src/components/content/editor/`, `src/components/clients/workspace/`, `src/components/clients/documents/`).
  - **Lifecycle & State Hooks**: Extract debounced autosaves, keyboard shortcuts, version diffs, and query param synchronization into dedicated custom hooks (`useEditorSave`, `useEditorRevisions`, `useStudioOrigin`, `useEditorReviewActions`).


---

## 3. Seven Questions Mandatory Before Writing Code

Before generating any component, API route, or database migration, explicitly verify:
1. **What real-world problem does this solve?** (Matches an identified friction point in [`01_DISCOVERY/FRICTION_MAP.md`](file:///d:/BaseWorks/Atom%20&%20Echo/01_DISCOVERY/FRICTION_MAP.md))
2. **What domain entity does it belong to?** (Mapped in [`02_BLUEPRINT/DOMAIN_MODEL.md`](file:///d:/BaseWorks/Atom%20&%20Echo/02_BLUEPRINT/DOMAIN_MODEL.md))
3. **What state machine controls it?** (Follows [`02_BLUEPRINT/STATE_MACHINES.md`](file:///d:/BaseWorks/Atom%20&%20Echo/02_BLUEPRINT/STATE_MACHINES.md))
4. **What event triggers it?** (Defined in [`02_BLUEPRINT/EVENT_MODEL.md`](file:///d:/BaseWorks/Atom%20&%20Echo/02_BLUEPRINT/EVENT_MODEL.md))
5. **What happens automatically?** (Defined in [`02_BLUEPRINT/AUTOMATION_RULES.md`](file:///d:/BaseWorks/Atom%20&%20Echo/02_BLUEPRINT/AUTOMATION_RULES.md))
6. **What should remain manual?** (Never automate without human confirmation on destructive or sensitive actions like billing changes, external messaging, or credential disclosure)
7. **What other parts of the system are affected?** (Calendar projection, Command Center attention items, client activity stream)

---

## 4. Design & Performance Standards (The "Calm Attention Surface" & Emil Kowalski Craft Doctrine)

All web application code built for Atom & Echo must follow BaseWorks premium design principles, calibrated for **ADHD-friendly, low-cognitive-load execution** (inspired by Linear, Emil Kowalski design engineering, Amie, and Things 3):

* **Single Dominant Anchor**: Every view must present exactly one clear focal point. Eliminate competing banners, multi-tiered eyebrows, and noisy visual sirens.
* **Flush Edge-to-Edge Mastheads & Strict Ban on "Box-in-a-Box" Nesting**:
  - **Flush Architectural Mastheads**: Primary workspace, dossier, and studio routes (`/clients/[id]`, `/content`, `/content/[id]`) must register in `isFlushMasthead` inside `src/components/layout/workspace-shell.tsx` so their top masthead (`border-b border-[var(--color-line)] bg-[var(--color-surface)]`) sits flush from the left sidebar to the right viewport edge without 4-corner outer padding. Apply `px-5 py-6 lg:px-7 lg:py-6` only to the scrollable body canvas below the masthead.
  - **Integrated Hairline Ledgers & Filter/Tab Bars**: Never float standalone `MetricRibbon` boxes or segmented pill tab bars above bordered cards. Integrate vitals (`grid divide-x divide-[var(--color-line-subtle)]`) and filter/tab bars (`border-t` or `border-b border-[var(--color-line-subtle)]`) directly into the masthead or card header.
  - **De-Boxed Authoring & Dossier Sheets**: Never place a bordered `<textarea>` or nested bordered sub-cards inside an already-bordered container. Use a single outer container (`rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)]`) divided internally by full-bleed hairlines (`divide-y divide-[var(--color-line-subtle)]`), with borderless inputs (`bg-transparent border-0 focus:ring-0`).
* **Strict Separation of Company Brand Logos (`BrandLogo`) vs. Human Avatars (`UserAvatar`)**:
  - **NEVER** restrict `resolveBrandDomain` in `src/components/ui/brand-logo.tsx` to a hardcoded SaaS allowlist, and **NEVER** replace company brand logos with `UserAvatar` human face illustrations.
  - Always pass the client's full domain context (`client?.website_url || client?.founder_email || client?.name`) to `<BrandLogo />` so Brandfetch resolves real company logos (`ril.com`, `debtworks.co.in`, `baseworks.in`, etc.). Reserve `<UserAvatar />` strictly for human people/founders.
* **Strict Ban on Pill / Badge Confetti**: 
  - **NEVER** wrap passive status or metadata into rounded colored pills (e.g., `rounded-full bg-amber-50 border-amber-200 px-2 py-0.5`). 
  - Instead, use quiet, crisp secondary text or an understated 6px inline dot indicator with uppercase sans tracking (`flex items-center gap-2 text-[10.5px] font-sans tabular-nums tracking-wider text-[var(--color-ink-secondary)]`).
  - Reserve colored badges *strictly* for true, mission-critical operational emergencies/exceptions (e.g. `Emergency Freeze`).
* **Strict Ban on Tinted Callout Boxes / Alert Banners**:
  - **NEVER** create Notion-style pastel-tinted callout boxes with icons (e.g., `bg-amber-50/60 border-amber-200` with `<MessageCircle />` or cartoonish alert clipart).
  - For user/client feedback, quotes, or notes, use an **editorial hairline inset**: a subtle left border (`border-l-2 border-[var(--color-line-strong)] pl-3.5 py-1.5`) on the quiet surface.
* **Strict Ban on Tinted / Colored-Fill Buttons**:
  - **NEVER** style buttons with translucent colored backgrounds and matching colored borders (e.g. `bg-[var(--color-danger-bg)] border-[var(--color-danger-line)] text-[var(--color-danger-text)]`, `bg-[var(--color-warn-bg)]`, `bg-[var(--color-ok-bg)]`, or `.btn-danger`).
  - Only **4 button surfaces** are permitted across the entire OS: **Solid Paper White** (`.btn-primary`), **Quiet Obsidian Neutral** (`.btn-secondary`), **Transparent Ghost** (`.btn-ghost`), and **Solid Acid Lime** (`.btn-accent`). Even for sign-out, status transitions, or confirmations, use crisp `.btn-primary` or `.btn-secondary` without decorative icon clutter.
* **No Multi-Tiered Eyebrow / Label Stacking**:
  - Never stack redundant micro-headers (e.g., `"Client Feedback Note"` directly above `"1-Tap Portal Comment"` directly above `"Aravind commented:"`). State the context once, cleanly.
* **No Decorative Icon Clutter**:
  - Icons are currency, not wallpaper. Never stick chat bubbles, sparkles, checkmarks, or generic emojis next to everyday text or standard modal buttons (`Cancel`, `Log Out`, `Confirm`). Use vector icons strictly for standalone icon buttons or core navigation.
* **Zero AI-Prompt-Speak Copywriting**: UI copy must be written in crisp, confident human language. Never print internal prompts, Jira-speak, or multi-sentence robotic apologies into titles, subtitles, or empty states.
* **No Marketing Slop in Operational Shells**: No promo boxes or redundant explanatory paragraphs inside the sidebar or dashboard.
* **Quiet Defaults, Loud Exceptions & No Technical Monospace**: Serene obsidian base (`#10110f`), crisp human typography matching `atomnecho.com` (**DM Sans** for UI/body/metadata with `tabular-nums` for numbers/dates, **Manrope** for display headings, **Georgia** for italic accents — **never** use technical/code monospace fonts like `JetBrains Mono`), subtle hairlines, generous breathing room. Color is reserved for true state signals.
* **Responsive Interactive Feedback (Emil Kowalski Standard)**:
  - Tappable buttons must feel responsive: `transition: transform 160ms ease-out` and subtle `active:scale-[0.98]`.
  - Fast, purposeful micro-transitions (< 200ms ease-out). Never animate from `scale(0)` (use `scale(0.95)` with opacity).
* **Speed & Performance**: Zero layout shifts (CLS < 0.05), instant optimistic UI updates on actions, lightweight bundle sizes.
* **Separation of Concerns**:
  * **Internal Operator UI**: Rich, clean, keyboard-accessible, desktop-first command surface.
  * **External Client UI**: Ultra-lightweight, zero-login, tokenized Mobile PWA (loads in <1s on mobile 4G, 1-click Approve or Comment).

---

## 5. Conflict Resolution Protocol

If you discover a conflict between requirements:
* **DO NOT** guess or silently invent requirements.
* Follow the rank in [`00_PROJECT/SOURCE_OF_TRUTH.md`](file:///d:/BaseWorks/Atom%20&%20Echo/00_PROJECT/SOURCE_OF_TRUTH.md).
* If the conflict involves scope or architecture, check [`00_PROJECT/DECISIONS.md`](file:///d:/BaseWorks/Atom%20&%20Echo/00_PROJECT/DECISIONS.md) or alert the user.

---

## 6. Workspace Tooling & Verification Invariants

* **TypeScript Check on Windows (`&` in Workspace Path)**: Because `d:\BaseWorks\Atom & Echo` contains an ampersand (`&`), `npx tsc` fails in Windows shells due to unescaped path splitting inside `npx.cmd`. Always run TypeScript verification via:
  `node "./node_modules/typescript/bin/tsc" --noEmit`
* **Windows Shell & Dynamic Route Pathing (`-LiteralPath`)**: Next.js App Router dynamic routes use brackets (e.g. `[id]`, `[token]`), which PowerShell evaluates as regex/wildcard character classes. Always specify `-LiteralPath` for PowerShell file commands targeting these directories:
  `(Get-Content -LiteralPath "src/app/(workspace)/content/[id]/content-editor-client.tsx").Length`
* **Concurrent Feature Coexistence Protocol**: When another agent or branch is actively building features (e.g. Post Version History, Billing automations), never delete, rename, or stub out active server actions, domain types, or migration files. Preserve full backwards-compatibility and wrap or compose rather than replace shared entities.
* **Supabase Live DB Verification Hygiene**: Before drafting or running any new schema migration or introducing new tables, always verify the live Supabase schema and current table states using Node inspection scripts (e.g. `node scripts/check-db.mjs` with `@supabase/supabase-js`) rather than guessing table columns or constraints. Maintain clean rollback paths and verify table counts after each migration.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
