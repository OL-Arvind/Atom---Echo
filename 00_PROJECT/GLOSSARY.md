# BaseEngine & Atom & Echo OS — Domain Glossary

This glossary defines the canonical terminology used across specifications, code, and documentation.

---

### Core Architectural Concepts

* **Operating System (OS)**: Custom-engineered software built around a company's specific, real-world workflows that coordinates actions, data, and communication in one place. Unlike generic SaaS or Notion, an OS actively navigates the user toward the highest-priority work.
* **BaseEngine**: BaseWorks' flagship productized service delivering custom business operating systems under a predictable monthly subscription.
* **System of Record vs. System of Action**: Notion is a system of record (passively stores what happened). An OS is a system of action (actively initiates downstream events, tasks, and state transitions based on occurrences).
* **Manual by Exception**: The fundamental design law of BaseEngine. Users take a meaningful action once; the system derives state and handles all surrounding bookkeeping automatically. Manual input is only required when an edge case or exception occurs.
* **Temporal Projection**: A dynamic view derived entirely from underlying operational dates (e.g., content publishing dates, meeting times, renewal deadlines) rather than maintaining a separate calendar database.

---

### Business Entities & Domain Vocabulary

* **Client**: The commercial company or entity with whom Atom & Echo has an ongoing business relationship (e.g., Debtworks, Florian, Bilal, Zainab).
* **Engagement**: A specific service contract delivered to a client (e.g., *LinkedIn Personal Branding*, *Outreach*). A client can have multiple engagements over time.
* **Profile**: The individual person or creator identity within an engagement for whom content is crafted (e.g., Chetan Ahuja as the personal branding profile under the Debtworks engagement).
* **Content Item**: A single piece of creative deliverable (post, carousel, script) passing through a strict lifecycle state machine from idea to published.
* **Review**: An external evaluation instance created for a client to approve, reject, or request revisions on a content item.
* **Tokenized Review Link**: A cryptographically signed, secure URL sent to a client (via WhatsApp) that authorizes mobile access strictly to their pending review items with zero logins required.
* **Tool / Subscription**: An external SaaS software license purchased specifically to service a client (e.g., HeyReach, Clay, Fathom).
* **Pass-Through Tool Expense**: The exact, un-marked-up monthly cost of a client's dedicated software subscription automatically attached to their recurring monthly retainer invoice.
* **RBI Compliance Sentinel**: An automated watchdog that alerts operators 48 hours prior to recurring international SaaS renewals to prevent credit/debit card failures under RBI e-mandate regulations.
* **Credential Vault**: An encrypted, role-governed subsystem inside the OS that securely stores client account credentials (LinkedIn, tools) attached directly to their profile.
