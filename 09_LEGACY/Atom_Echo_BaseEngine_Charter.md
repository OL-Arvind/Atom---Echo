# BaseEngine Deployment Charter
### Custom Operating System for Atom & Echo

**Prepared for:** Sudeesh D S, Founder — Atom & Echo  
**Engineered by:** BaseWorks ([baseworks.in/base-engine](https://baseworks.in/base-engine))  
**Date:** September 17, 2026  
**Document Type:** BaseEngine Scope Blueprint & Monthly Subscription Agreement  

---

## 1. System Mission & Philosophy

Atom & Echo is transitioning into a high-leverage, founder-led growth agency focused strictly on ambitious founders and high-tier personal branding. Today, that vision is constrained by manual operational drag:

* **Fragmented Notion Databases**: Client content calendars, post statuses, and strategies live in separate, disconnected pages. There is no single bird’s-eye view across the agency’s weekly publishing pipeline.
* **Client Review Friction**: Clients hate logging into Notion, especially on mobile. Reviews take 1–2 weeks of painful manual follow-ups on WhatsApp just to get a single post approved.
* **Leaking Tool Expenses**: High-value client software costs (such as HeyReach or Clay, running ₹18,000–₹20,000/month for clients like Debtworks) are tracked manually in spreadsheets or forgotten entirely during billing cycles.
* **RBI Subscription Failures**: Recurring SaaS subscriptions on Indian debit/credit cards fail unexpectedly under RBI e-mandate regulations, suddenly pausing live client outreach campaigns.
* **Knowledge in Heads, Not in the System**: Strategic discussion topics from weekly client calls must be manually transcribed and copied, leading to lost ideas.

### The BaseEngine Approach
BaseEngine turns Atom & Echo’s real-world workflows into a custom-engineered operating system managed under a predictable monthly subscription. 

**This is not generic agency software or another dashboard you have to adapt to.** It is built around exactly how Atom & Echo operates:
* **The system holds the knowledge, not people.**
* **Clients review and approve content in seconds from WhatsApp without logins.**
* **Client tool expenses are automatically recovered on monthly invoices.**
* **The founder gets time and bandwidth back to focus purely on creative direction, distribution, and closing high-margin clients.**

---

## 2. Commercial Model: The BaseEngine Subscription

BaseEngine delivers custom-built enterprise software with the financial simplicity of a SaaS subscription—pricing just like traditional software, but custom-made for 2026.

| Parameter | BaseEngine Terms |
|---|---|
| **Monthly Subscription** | **Rs. 20,000 / month flat.** Predictable monthly operational cost. No hidden hourly fees. |
| **Upfront CapEx / Build Fee** | **Rs. 0 (Zero).** No lump-sum development charges. BaseWorks absorbs the initial engineering investment. |
| **Subscription Start Clock** | Billing starts strictly on the date of **Official Phase 1 Sign-Off (Go-Live)**. The build phase is completely free. |
| **Dedicated Monthly Engineering** | Includes **1 requested custom system evolution / feature per month** (5–7 business days capacity) to keep the OS evolving as the agency scales. |
| **Feature Rollover** | Unused monthly engineering capacity **rolls over continuously** month-to-month. |
| **Setup & Onboarding** | **Included.** BaseWorks handles full historical data migration from Atom & Echo's Notion workspace. |
| **Cloud Hosting & Infrastructure** | **Included.** Enterprise-grade high-availability cloud hosting, automated database backups, security patches, and maintenance managed by BaseWorks. |
| **Taxes & Invoicing** | Billed as net. Currently non-GST applicable (standard commercial invoice issued). |
| **Contract Flexibility** | Month-on-month agreement. Cancel anytime with a 30-day prior written notice. |
| **Third-Party API & Webhooks** | Free tiers utilized wherever possible. If high-volume dedicated third-party AI models (e.g., custom OpenAI/Claude keys) are plugged in, usage is billed directly to the client's API keys. |

---

## 3. The 3 Core BaseEngine Risk Guarantees

To ensure Atom & Echo has complete operational security and zero vendor lock-in:

```
┌──────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│     100% DATA CONTROL        │     BUYOUT OPTION ANYTIME    │    FAIL-SAFE CODE HANDOFF    │
├──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Atom & Echo owns all client  │ While on subscription, we    │ If BaseWorks is ever unable  │
│ records, posts, performance  │ maintain and evolve the OS.  │ to support the system, full  │
│ metrics, and financial data. │ You can buy full, permanent  │ source repositories and cloud│
│ Full raw JSON/CSV exports    │ code ownership anytime at    │ credentials transfer to you  │
│ are accessible on demand.    │ a pre-agreed valuation.      │ immediately with zero lock-in│
└──────────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

---

## 4. Phase 1 Deployment Architecture (What Gets Deployed)

Every module is built around Atom & Echo’s exact workflow, eliminating manual handoffs.

### 4.1 Master Multi-Client Content Engine
* **What it does:** Replaces scattered Notion databases with one unified pipeline showing every scheduled, drafted, and published post across all agency clients (Debtworks, Florian, Bilal, Zainab, etc.).
* **Included:**
  * Multi-client monthly and weekly master calendar view.
  * Live status tracking: *Idea → In Development → Under Review → Ready to Publish → Published*.
  * Content format taxonomy (*Text Post, Carousel, Video Script, Image Post*).
  * Strategic content pillar tagging (*Market Analysis, Client Testimonial, Industry Insight, Founder Story*).
  * Direct markdown post editor with character counts and preview.
* **Onboarding:** BaseWorks already has full Notion admin access; all existing client tags, content pillars, and drafts will be migrated directly by BaseWorks.
* **Deliberately Excluded from V1:** Automated direct publishing via LinkedIn/X API (the agency maintains final publishing control).

### 4.2 Zero-Friction Client Review Portal (Mobile PWA + WhatsApp Gateway)
* **What it does:** Eliminates Notion client review friction. Busy executives receive a formatted WhatsApp link, open a lightweight mobile web app without logging in, and approve content in 5 seconds.
* **Included:**
  * Client-facing, mobile-first Progressive Web App (PWA).
  * Direct secure tokenized URL access (zero usernames, passwords, or Notion accounts required).
  * High-fidelity post preview (supporting carousels, images, and text formatting).
  * One-click **"Approve"** button that automatically flips post status to *Ready to Publish*.
  * Inline revision box for quick client comments and edits.
  * Automated WhatsApp notification trigger with the pre-generated review link.
* **Onboarding:** Client contact numbers and review message copy extracted directly from Notion.
* **Deliberately Excluded from V1:** In-app real-time messaging room (conversations remain on WhatsApp).

### 4.3 Client Relationship & Retainer Intelligence
* **What it does:** Single source of truth for each agency client holding their active service tier, monthly post quota, target ICP, and milestone metrics.
* **Included:**
  * Dedicated client profile views.
  * Service tier tagging (*LinkedIn Personal Branding, Outbound, Growth Strategy*).
  * Monthly quota tracking (e.g., 10 vs. 20 posts/month target vs. delivered).
  * Client strategy hub (profile headline, about section guidelines, target audience notes).
  * Key milestone logger (follower growth milestones, viral post records).
* **Onboarding:** Current client roster and profile notes extracted from Notion.
* **Deliberately Excluded from V1:** Automated live web scraping of LinkedIn profile followers (metrics entered via standard monthly review or stats exports).

### 4.4 Automated Invoicing & Pass-Through Tool Billing
* **What it does:** Stops revenue leakage by automating monthly retainer invoices and dynamically adding client-specific software expenses.
* **Included:**
  * Automated recurring invoice generation on client billing dates.
  * Automatic pass-through calculation of client-specific software costs (e.g., auto-billing Chetan for ₹18,000–₹20,000 of HeyReach/Clay tools without manual math).
  * Support for standard and GST invoice formats.
  * Payment status tracking (*Draft, Sent, Paid, Overdue*).
  * One-click PDF generation and client email dispatch.
* **Onboarding:** Billing details, invoice numbering prefix, and tool expense rules extracted from Notion.
* **Deliberately Excluded from V1:** Payment gateway merchant checkout (clients pay via direct bank transfer/NEFT/UPI).

### 4.5 RBI Compliance Auto-Renewal Sentinel
* **What it does:** Protects client campaigns from stopping unexpectedly due to Indian card auto-debit rejections under RBI e-mandate guidelines.
* **Included:**
  * SaaS subscription tracking dashboard mapped to specific clients and tools (HeyReach, Clay, Fathom, etc.).
  * Automated alert notification **48 hours prior to renewal date** to ensure manual balance or card validation.
* **Onboarding:** List of recurring tools, renewal dates, and billing cycles extracted from Notion Password Manager.
* **Deliberately Excluded from V1:** Automated direct bank account balance funding.

### 4.6 Retainer Maturity & Renewal Radar
* **What it does:** Proactively surfaces upcoming contract expirations so retainers are renewed on time.
* **Included:**
  * Client contract maturity countdown.
  * Automated reminder alert **30 days prior to retainer expiration**.
  * One-click contract extension and renewal logging.
* **Onboarding:** Client start dates and contract lengths extracted from Notion.
* **Deliberately Excluded from V1:** Cryptographic government e-signatures.

### 4.7 Meeting Note Topic-to-Post Pipeline
* **What it does:** Captures weekly strategy call topics and turns them directly into content calendar items.
* **Included:**
  * Dedicated meeting notes log per client.
  * Structured agenda and call summary logger.
  * One-click action to convert discussed topics directly into draft post cards on the calendar.
* **Onboarding:** Existing meeting note templates extracted from Notion.
* **Deliberately Excluded from V1:** Automated AI bot dial-in for unscheduled phone calls.

### 4.8 Agency OKR & Growth Command Center
* **What it does:** Real-time visibility into agency revenue benchmarks without maintaining manual spreadsheets.
* **Included:**
  * Live MRR compilation from active client retainers.
  * Visual progress tracker against agency benchmarks (e.g., target of 10 personal branding clients at ₹50,000–₹60,000/month = ₹5L–₹6L MRR target).
  * Agency client capacity utilization indicator.
* **Onboarding:** Target OKR figures extracted from Notion.
* **Deliberately Excluded from V1:** Multi-entity corporate tax accounting.

### 4.9 Internal Team Roles & Access Control
* **What it does:** Clean operational separation between leadership and execution.
* **Included:**
  * **Admin Role (Sudeesh):** Full access to billing, revenue metrics, tool costs, and client settings.
  * **Team Member Role (Nikhil):** Access to content calendar, post drafting, client review queues, and meeting notes.
* **Onboarding:** Team email addresses configured during setup.
* **Deliberately Excluded from V1:** Complex multi-layered enterprise permissions.

### 4.10 Atom & Echo Kinetic Brand Identity & SVG Loader
* **What it does:** Elevates the platform into an inspiring, high-end daily workspace.
* **Included:**
  * Custom Atom & Echo brand color palette and dark/light interface themes.
  * Dynamic animated SVG logo integration (*"Atom bursting into an Echo"*) on initial login and system transitions.
* **Onboarding:** Sudeesh provides the animated SVG asset file.
* **Deliberately Excluded from V1:** External public agency website redesign.

---

## 5. Continuous Monthly Evolution (How Monthly Sprints Work)

In traditional software, after delivery you are left with static code. With BaseEngine, your operating system is **alive and continuously evolving**.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    DEDICATED MONTHLY ENGINEERING CAPACITY                    │
│                                                                              │
│  Each month, BaseWorks reserves dedicated engineering capacity               │
│  (5–7 business days) to build requested additions for Atom & Echo.          │
│                                                                              │
│  1. Submit Request   ──► 2. Impact & Scope   ──► 3. Deploy in Month Box      │
│     Sudeesh submits      BaseWorks scopes        Fits within 5-7 days?       │
│     new feature idea     timeline in days        Built as included feature   │
│                                                                              │
│  • Unused capacity rolls over continuously month-to-month.                   │
│  • Features larger than the monthly box are scoped and quoted separately      │
│    in advance—never unexpected charges after the fact.                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Future Roadmap Candidates (Phase 2+):
* **AI Meeting Audio-to-Draft Engine**: Direct Fathom audio transcription parsing into first-draft LinkedIn carousels.
* **Automated Case Study & Pitch Generator**: One-click generation of custom pitches using historical client stats (e.g., 1.5M impressions for Debtworks) to close incoming leads like Nishant.
* **Passive Thought-Capture Agent**: Capturing social browsing ideas to train a custom voice agent.

---

## 6. Onboarding & Zero-Friction Setup

Because BaseWorks already has full administrative access to Atom & Echo’s Notion workspace, **Sudeesh does not need to fill out spreadsheets or gather manual exports.** BaseWorks will directly extract and migrate:
* Client databases, active contracts, and pricing tiers.
* Master content pillars, post templates, and historical high-performing posts.
* Tool billing details and password manager recurring subscription dates.
* Meeting note formats and OKR target benchmarks.

### What Sudeesh Needs to Provide:
1. **Animated SVG Logo File** — Due: **September 20, 2026**
2. **WhatsApp Webhook / Messaging Preference** — Due: **September 21, 2026**
3. **V1 Draft Review & Feedback** — Scheduled: **September 23, 2026**

---

## 7. Timeline, Milestones & Activation

* **Build Sprint (Free Phase):** BaseWorks commits full engineering resources to develop Phase 1 with ₹0 upfront payment.
* **Milestone 1 — V1 Working Draft:** **September 23, 2026.** Functional master calendar, mobile client approval portal, and invoicing interface hosted on a secure staging URL.
* **Milestone 2 — Final Phase 1 Deployment:** **Within 18 calendar days (~October 3–4, 2026).** Live onboarding and team transition off Notion.
* **Subscription Start Clock:** Month 1 billing (Rs. 20,000) officially activates **only on the date of Official Sign-Off (Go-Live)**.
* **Grace Period:** Monthly subscription invoices are issued on the 1st of each month with a 10 business-day grace period.

---

## Charter Acceptance & Service Agreement

By signing below, the parties confirm the scope, deployment architecture, commercial terms, and operating principles outlined in this BaseEngine Deployment Charter.

<br/>

| Service Provider | Client Partner |
|---|---|
| **BaseWorks** | **Atom & Echo** |
| Name: Aravind Bhati | Name: Sudeesh D S |
| Title: Founder & Product Architect, BaseWorks | Title: Founder, Atom & Echo; Partner, BaseWorks |
| Signature: _______________________ | Signature: _______________________ |
| Date: September 17, 2026 | Date: ___________________________ |
| Contact: +91 9113909950 | Contact: _________________________ |
