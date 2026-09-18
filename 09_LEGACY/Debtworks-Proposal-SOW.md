# Proposal & Scope of Work
### BaseWorks Ops System — for Debtworks

Prepared for: Chetan Ahuja, Debtworks
Prepared by: BaseWorks
Date: July 8, 2026

---

## 1. What this document is

This is a proposal and scope of work (SOW) — it defines *what* is being built, *what it costs*, and *what each side is responsible for*. It is not the legal agreement (IP ownership, data handling terms, and termination clauses will follow in a short separate contract once scope and pricing are confirmed here).

---

## 2. The problem this solves

Debtworks currently runs deal tracking, document collection, meeting notes, agreement drafting, CAM prep, and invoicing across a mix of manual processes — WhatsApp, spreadsheets, and individual memory. That works until it doesn't: context is lost when someone's on leave or leaves the company, nothing is searchable, and every new hire has to be walked through tribal knowledge by hand.

The BaseWorks Ops System replaces this with one place that holds deal context end-to-end — leads, documents, meetings, agreements, CAM, and invoicing — built specifically around how Debtworks actually works, not a generic CRM you have to bend your process to fit. By consolidating these workflows into a single system, the platform removes operational dependency on the founders and provides a structured, automated foundation to scale Debtworks' processes.

---

## 3. Commercial terms

| Item | Details |
|---|---|
| **Monthly subscription** | Rs. 15,000/month (Price locked at Rs. 15,000/month for the next 6 months with guaranteed no price increase). |
| **Upfront Commitment** | Rs. 45,000 paid in advance at signing, covering the **first 3 months of subscription** (i.e., Months 1–3 are fully prepaid). Monthly billing at Rs. 15,000/month resumes from Month 4 onwards. |
| **Subscription Start Clock** | The subscription period officially begins **on the day of V1 Sign-off (Go-Live)**. The client does not pay subscription fees during the initial build phase. |
| **Included ongoing** | Platform hosting, maintenance, bug support, and **one requested custom feature built per month** (see Section 6). |
| **Unused Feature Rollover** | If the included monthly custom feature is not requested in a given month, it **rolls over** to the next month continuously. |
| **Setup fee** | None |
| **Taxes** | Billed as net. Any government taxes or statutory levies, if applicable in the future, will be charged extra (currently no GST is applicable). |
| **Renewal & Cancellation** | Subscriptions auto-renew on a month-on-month basis after the initial 6-month price lock period. Monthly billing occurs on the 1st of each month. Cancellation requires a 30-day prior written notice. |
| **Infrastructure & API costs** | * Fathom & Cal.com: Free tiers integrated by BaseWorks.<br>* Email Service: Free tier limits utilized where possible.<br>* Cloudflare R2: Used for file storage (10 GB free tier, then $0.015/GB/month paid by Debtworks if exceeded).<br>* Gemini / Claude & Firecrawl APIs: Usage paid directly by Debtworks via their own API keys integrated into their secure environment variables (with additional usage charges billed if their respective free tiers are exceeded). |

---

## 4. What's being built (v1 scope)

Every feature below follows the same structure: what it does, exactly what's included, what Debtworks needs to provide and by when, and what's deliberately left out of v1.

---

### 4.1 Lead & Deal Import
**What it does:** Get existing and new leads into the system without manual re-entry.
**Included:** Bulk upload (spreadsheet/Excel import via a predefined column template), manual single-entry add, mapping to Debtworks' existing lead fields.
**Debtworks provides:** Sample export of how leads are currently stored (Excel/spreadsheet format) — needed by [date].
**Not included:** Automated lead sourcing/scraping from external sites.

### 4.2 Company Profiles & Deal Tracking
**What it does:** One record per company holding everything about the relationship — not just a single deal, but every deal that company has ever had with Debtworks, past and present.
**Included:** Company profile page, multiple concurrent deals per company, relationship timeline, custom credit/financial metrics, access to historical/closed company records. **Ownership Lock & Interaction Warnings:** Alert warning if another user attempts to upload or input an existing lead. Lead owner assignment dictates who can modify lead/deal parameters (with Admin override) to prevent duplicate outreach.
**Debtworks provides:** List of custom metrics to track per company, and historical company data for migration — needed by [date].
**Not included:** Automated data enrichment from external sources (e.g., auto-pulling company financials).

### 4.3 Meeting Intelligence
**What it does:** Every meeting with a client automatically becomes part of that company's permanent deal record — no manual note-taking, no lost context when an employee changes.
**Included:** Direct integration with Cal.com and Fathom, meetings auto-visible on an org-wide internal calendar (who's meeting whom, when), automatic meeting summaries attached to the relevant company's log.
**Service Note:** BaseWorks will manually perform the technical setup/configuration of Cal.com and Fathom for all 6-7 employees as a one-time onboarding service.
**Debtworks provides:** Cal.com and Fathom account/API access, and the list of employees + calendars to connect — needed by [date].
**Not included:** Live meeting transcription/translation for non-English calls.

### 4.4 Client Portal & Document Upload
**What it does:** Secure, invite-only login portal for Debtworks' clients (borrowers) to view status and upload documents, helping maintain a sustained relationship with Debtworks.
**Included:** Client-facing dashboard, invite-only email-based login, complete client-facing view where borrowers can see, track, and access their uploaded files, pending signatures, and all other info on the loan, secure upload link per company, direct-to-system upload.
**Debtworks provides:** Welcome email copy template — needed by [date].
**Not included:** Real-time messaging or communication center (all communication remains email/WhatsApp).

### 4.5 Document Room
**What it does:** One place per company to see every document received, what's still outstanding, and what's optional.
**Included:** Document view/download, tracking of received vs. outstanding. Settings page allowing the user to make document types visible/invisible and toggle them as "mandatory" vs. "optional" for the client.
**Debtworks provides:** Master checklist of document types required per deal type, and which are mandatory vs. optional — needed by [date].
**Not included:** Automated document expiry/renewal reminders.

### 4.6 Refinance Radar
**What it does:** Surfaces refinancing opportunities automatically based on a configurable timeframe.
**Included:** Automated alert when a past deal crosses the refinancing-eligible time window (timeframe is fully configurable by the admin via a settings dashboard, e.g., 10, 11, or 13 months), one-click draft of a refinancing proposal/email, direct send from the system.
**Debtworks provides:** The initial default trigger rule (e.g., 10 months) and the refinancing email/proposal template — needed by [date].
**Not included:** Automated eligibility checks against live lender rate changes.

### 4.7 Agreement Maker & Simple E-Signature
**What it does:** Generate branded, ready-to-sign agreements in seconds and collect signatures securely.
**Included:** Template-based generation using Debtworks' branding, fields auto-filled from company/deal data, direct send via email from within the system. **Simple E-Signature Integration:** Drawing canvas interface for the client to draw their signature on a mobile screen/web page, overlaying this signature image onto the agreement PDF, and attaching a secure audit trail (signer's IP address, timestamp, device metadata) on the final page of the document. Authorized by Admin.
**Debtworks provides:** Agreement templates, company branding logos, and authorization rules — needed by [date].
**Not included:** Government-backed cryptographic signatures (Aadhaar eSign / DSC).

### 4.8 CAM Generator
**What it does:** Turn uploaded financial documents into a pre-filled CAM draft the team reviews instead of building from scratch.
**Included:** Basic company info feeds into the CAM, AI pre-population of CAM sections from uploaded documents (excluding bank statements), fully editable before export, custom calculations as defined by Debtworks, PDF export.
**Debtworks provides:** CAM content structure/sections, which document types should be parsed, and custom calculation logic — needed by [date].
**Not included:** Bank statement parsing. Any field or calculation not defined in advance.

### 4.9 AI Skills Library
**What it does:** Give every employee access to high-quality, interactive AI skills for recurring tasks, pre-filled with the relevant company's data.
**Included:** System-integrated AI skills execution (running inside the dashboard, not just copy-paste prompts), auto-populated with company context.
**Debtworks provides:** List of requested AI skills they need during the build, and example "good" outputs for each skill area so tone/quality match expectations — needed by [date].
**Not included:** Development of skills beyond the final confirmed list.

### 4.10 Employee Onboarding & Attendance
**What it does:** Track daily attendance and walk every new hire through Debtworks' culture and SOPs.
**Included:** Employee record creation, slide-based onboarding content delivery (SOPs, culture slides), daily present/absent marking, attendance history view.
**Debtworks provides:** Onboarding slide content (culture, ethics, SOP) — needed by [date].
**Not included:** Payroll, leave approval workflows, biometric/geo attendance, shift scheduling.

### 4.11 Invoicing
**What it does:** Create and send invoices without leaving the system.
**Included:** Invoice creation, direct send to client from within the system, support for both Debtworks billing entities.
**Debtworks provides:** GST/billing details for both entities, invoice numbering format, and which entity bills which client type — needed by [date].
**Not included:** Payment collection/reconciliation.

### 4.12 User Roles & Access Control
**What it does:** Restricts system visibility based on employee responsibility.
**Included:** System supports three permission levels: Admin (Founders), Employee (Member), and Client (Borrower). Includes a custom home dashboard layout for each user role, to be collaboratively defined by Debtworks based on how they want it to be structured.
**Note on Implementation:** The specific permissions and restrictions for each role will be collaboratively defined and configured once the system is 80–90% built, allowing for a better practical understanding of the workflows.
**Debtworks provides:** Confirmation of roles and access rules once system is 80–90% complete — needed by [date].

### 4.13 Automated MIS Generator
**What it does:** Generate management information system (MIS) reports for deals and pipeline performance.
**Included:** Automated compilation of deal metrics, pipelines, and team performance, with a downloadable output in Excel format.
**Debtworks provides:** The exact MIS report template (layout/columns) and formulas/logic on how they are created today — needed by [date].
**Not included:** Interactive charting/graphing dashboards inside the web UI (Excel output only).

### 4.14 Lead Recycle
**What it does:** Keeps postponed or lost leads in a separate queue for future re-engagement.
**Included:** Moving leads to "Recycle" status, setting a future follow-up reminder date, and a dedicated dashboard view displaying recycled leads as they near their review date.
**Debtworks provides:** Standard notification triggers (e.g., 2 weeks prior to recycle date) — needed by [date].
**Not included:** Fully automated automated outreach sequences to recycled leads.

### 4.15 Configurable Notification System
**What it does:** Alert users in real-time about critical deal and document events.
**Included:** In-app notification center and email notifications for events (e.g., new file upload by client, upcoming refinance maturity, lead recycle reminders). Configurable toggle settings dashboard per user.
**Debtworks provides:** List of trigger actions and email notification copy templates — needed by [date].
**Not included:** Push notifications to mobile devices.

---

## 5. Data ownership & hosting (Assurance Protocol)

To give Debtworks absolute assurance regarding data privacy and security:

*   **Managed Client Cloud (Self-Hosting):** The platform databases and files live in Debtworks' own secure cloud environment (Supabase and Cloudflare R2), not BaseWorks'. Debtworks holds the root keys, passwords, and server ownership.
*   **Encrypted Fields (Optional):** Highly sensitive fields (such as client financial figures or bank account details) can be encrypted client-side using an encryption key stored strictly in Debtworks' private environment variables.
*   **Developer Access Control:** BaseWorks developers access the environment strictly for deployment and debugging using Git-triggered pipelines. Debtworks can revoke developer database credentials at any point, and query logs can be enabled on the database for independent auditing.
*   **Software Ownership:** BaseWorks retains the IP and code rights to the core framework components, granting Debtworks an exclusive license for use.

---

## 6. How monthly features work

One requested feature is built per month as part of the subscription, at no extra cost — this is designed to deepen the system's fit to Debtworks' workflow over time.

**How a request gets scoped, every time:**
1. Debtworks submits the request.
2. BaseWorks shares an estimated build time in business days, in writing, before starting anything.
3. If the estimate fits within the monthly box (5–7 business days), it's built as this month's feature.
4. If it's larger, BaseWorks says so upfront and provides a separate estimate and quote — agreed in writing before work begins, never decided or charged after the fact.
5. Every request — whether it's this month's feature or a separate build — gets written up with: what it does, exactly what's included, what Debtworks needs to provide (and by when), and what's explicitly not included. This becomes the shared reference so nothing is disputed later.

*Note: Unused monthly features roll over continuously.*

---

## 7. What we need from you, and by when

This timeline works both ways. BaseWorks commits to the build schedule in Section 8. Debtworks commits to providing the following, by the dates noted:

| Item | Needed for | Due date |
|---|---|---|
| Lead export (current Excel format) | Lead Import | [date] |
| Custom metrics list + historical data | Company Profiles | [date] |
| Cal.com / Fathom access + employee list | Meeting Intelligence | [date] |
| Document checklist per deal type | Document Room | [date] |
| Refinance trigger rule + email template | Refinance Radar | [date] |
| Agreement templates + branding assets | Agreement Maker | [date] |
| CAM structure + document types + calculation logic | CAM Generator | [date] |
| Example outputs for each AI Skill | AI Skills Library | [date] |
| Onboarding slide content | Onboarding & Attendance | [date] |
| Billing details for both entities | Invoicing | [date] |
| MIS report template + Excel formula logic | MIS Generator | [date] |
| Notification triggers + email templates | Notification System | [date] |

If any of these are delayed, the affected feature's delivery date moves accordingly — this isn't a penalty, it's just how dependencies work. A live, shared checklist will be kept visible to Chetan throughout the build.

---

## 8. Timeline & billing

*   **Build Lock Advance:** The upfront commitment payment (Rs. 45,000, covering the first 3 months of subscription) is collected at signing to lock in BaseWorks' engineering resources and secure the build phase. Monthly billing at Rs. 15,000/month begins from Month 4.
*   **Subscription Start Clock (Go-Live):** Month 1 of the subscription period officially begins upon **Official Sign-Off**: the date Chetan (or a designated person) explicitly confirms acceptance via email or in-app sign-off.
*   **Delivery commitment:** First working version delivered within **15 business days (2 weeks dev, 1 week testing)** of advance payment received, extended day-for-day for any delay on Debtworks-side dependencies listed in Section 7.
*   **Staging Isolation:** During the build and testing phase, the system will be hosted on a password-protected staging URL with mock data limits. Debtworks will be informed that the staging environment is for testing purposes only: no live customer data should be uploaded as it is a sandbox without guarantee of data persistency or data protection. Production deployment and live domain connection occur only upon Subscription Activation.
*   **Monthly feature eligibility:** The included monthly feature becomes available starting the month *after* the subscription start clock begins.
*   **Late Payments:** Invoices are generated on the 1st of each month. If a monthly subscription payment is overdue by more than 10 business days, BaseWorks reserves the right to temporarily suspend dashboard and API access until all outstanding dues are cleared.
*   If the build phase lapses before v1 is delivered purely due to a Debtworks-side delay, the delivery commitment extends automatically at no additional cost to either side.

---

## 9. Next steps

1. Review and confirm scope (Section 4) and dependency dates (Section 7).
2. Confirm commercial terms (Section 3).
3. On confirmation, BaseWorks sends the short follow-up agreement covering IP ownership, data access terms, and termination.
4. Advance payment processed, build begins.

---

*This document is the scope of work. A separate short agreement covering IP ownership, data access terms, and termination will follow before the first payment is processed.*
