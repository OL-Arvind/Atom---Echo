import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether
)

def create_atom_echo_blueprint_pdf():
    pdf_filename = "D:/BaseWorks/Atom & Echo/Atom_Echo_Phase_1_Blueprint.pdf"
    logo_path = "D:/BaseWorks/baseworks/BaseWorks_Website/public/BaseWorks.light.png"

    # Setup Document — Configured for authoritative 5-page executive flow
    margin_lr = 40
    margin_tb = 36
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=margin_lr,
        rightMargin=margin_lr,
        topMargin=margin_tb,
        bottomMargin=margin_tb,
        title="Atom & Echo OS — Phase 1 Blueprint & Agreement",
        author="BaseWorks"
    )

    story = []
    styles = getSampleStyleSheet()

    # Core Palette
    primary_color = colors.HexColor("#d13202")    # BaseWorks deep orange
    dark_text = colors.HexColor("#171717")        # Off-black
    muted_text = colors.HexColor("#525252")       # Dark grey
    light_bg = colors.HexColor("#F8F8F8")         # Clean light grey
    card_bg = colors.HexColor("#FFFFFF")          # Pure white
    border_color = colors.HexColor("#222222")     # Neo-brutalist dark border
    callout_bg = colors.HexColor("#FFF6F3")       # Soft warm orange tint

    # Typography
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=17,
        leading=21,
        textColor=dark_text,
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.0,
        leading=12,
        textColor=primary_color,
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'Heading1Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=dark_text,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=primary_color,
        spaceBefore=4,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.8,
        textColor=dark_text,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=12.0,
        textColor=dark_text
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=10.0,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=dark_text
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell_style,
        fontName='Helvetica-Bold'
    )

    # ================= PAGE 1 =================
    left_elements = []
    if os.path.exists(logo_path):
        logo = Image(logo_path, width=1.4*inch, height=0.35*inch)
        logo.hAlign = 'LEFT'
        left_elements.append(logo)
        left_elements.append(Spacer(1, 4))
    
    address_text = (
        "<b>BaseWorks</b> | Product Studio<br/>"
        "Electronic City Phase I, Bengaluru, Karnataka 560100<br/>"
        "hello@baseworks.in | www.baseworks.in/base-engine"
    )
    left_elements.append(Paragraph(address_text, ParagraphStyle('Address', parent=body_style, fontSize=6.8, leading=9.0, textColor=muted_text)))

    right_elements = [
        Paragraph("PHASE 1 BLUEPRINT", ParagraphStyle('HRight', fontName='Helvetica-Bold', fontSize=13, leading=15, textColor=primary_color, alignment=2)),
        Spacer(1, 2),
        Paragraph("<b>STATUS:</b> CLIENT REVIEW & AUTHORIZATION", ParagraphStyle('SRight', fontName='Helvetica-Bold', fontSize=7.2, leading=9.0, textColor=dark_text, alignment=2)),
        Spacer(1, 2),
        Paragraph("<b>DATE:</b> September 18, 2026", ParagraphStyle('DRight', fontName='Helvetica', fontSize=7.2, leading=9.0, textColor=muted_text, alignment=2)),
        Spacer(1, 2),
        Paragraph("<b>CLIENT:</b> Sudeesh D S, Atom & Echo", ParagraphStyle('PRight', fontName='Helvetica-Bold', fontSize=7.2, leading=9.0, textColor=dark_text, alignment=2))
    ]

    header_table = Table([[left_elements, right_elements]], colWidths=[4.4*inch, 3.0*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))

    divider = Table([[""]], colWidths=[7.4*inch])
    divider.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 2.2, border_color),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(divider)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Atom & Echo OS — Phase 1 Blueprint & Agreement", title_style))
    story.append(Paragraph("Custom Operating System Architecture & Flat Monthly Subscription Terms", subtitle_style))

    callout_data = [[
        Paragraph(
            "<b>THE CORE SHIFT: 'MANUAL BY EXCEPTION'</b><br/>"
            "We are not building another Notion workspace or a static dashboard that demands continuous manual upkeep. In the Atom & Echo OS, "
            "the system maintains itself through the work your team is already doing. When a client receives a review link on WhatsApp &rarr; "
            "opens it &rarr; clicks <i>'Approve'</i> &rarr; post status flips to <i>Approved</i>, the master calendar confirms the schedule, a publishing task "
            "is generated, and the team is notified. <b>One client action; zero internal manual bookkeeping.</b>",
            callout_style
        )
    ]]
    callout_table = Table(callout_data, colWidths=[7.4*inch])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), callout_bg),
        ('BOX', (0,0), (-1,-1), 1.0, primary_color),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("1. Commercial Model & Flat Subscription Terms", h1_style))
    story.append(Paragraph("BaseEngine delivers custom agency software under a predictable monthly model — enterprise quality with zero CapEx risk.", body_style))

    comm_data = [
        [Paragraph("<b>Parameter</b>", table_header_style), Paragraph("<b>BaseEngine Terms</b>", table_header_style)],
        [Paragraph("<b>Monthly Subscription</b>", table_cell_bold), Paragraph("<b>Rs. 20,000 / month flat.</b> Predictable operational cost. Month-on-month agreement. No hourly billing.", table_cell_style)],
        [Paragraph("<b>Upfront Build Fee (CapEx)</b>", table_cell_bold), Paragraph("<b>Rs. 0 (Zero).</b> No upfront development charge. BaseWorks absorbs the initial engineering investment.", table_cell_style)],
        [Paragraph("<b>Initial Payment</b>", table_cell_bold), Paragraph("<b>Rs. 20,000 received at signing</b> and credited as the first month of the BaseEngine subscription. (Standard 3-month upfront commitment waived as a partner courtesy).", table_cell_style)],
        [Paragraph("<b>Subscription Service Period</b>", table_cell_bold), Paragraph("The monthly subscription service period officially begins at Phase 1 Go-Live (or automatically within 18 calendar days of kickoff if launch is delayed purely due to client-side review or dependency turnaround). BaseWorks cannot pause the agreed billing start schedule for client-side delays.", table_cell_style)],
        [Paragraph("<b>Payment Terms & Grace Window</b>", table_cell_bold), Paragraph("Monthly subscription invoices are issued on the 1st of each month. <b>Strict 4-calendar-day settlement window.</b> If payment is overdue beyond 4 days, platform and API access is temporarily paused until cleared.", table_cell_style)],
        [Paragraph("<b>Monthly System Evolution</b>", table_cell_bold), Paragraph("Includes <b>1 requested custom feature / system evolution per month</b> (5–7 business days capacity) starting in Month 2 post-go-live. Unused capacity rolls over continuously. (Features exceeding 5–7 days are scoped/quoted separately in advance).", table_cell_style)],
        [Paragraph("<b>Third-Party APIs & Infra</b>", table_cell_bold), Paragraph("BaseWorks cloud hosting, daily backups, and database maintenance are fully included. Standard free tier limits used where possible. Dedicated high-volume third-party services (e.g., custom WhatsApp API / Twilio credits, dedicated LLM keys) are billed directly to client environment keys.", table_cell_style)],
        [Paragraph("<b>Data Migration & Setup</b>", table_cell_bold), Paragraph("<b>Included.</b> BaseWorks performs full historical data migration from Atom & Echo's Notion workspace.", table_cell_style)],
        [Paragraph("<b>Contract Flexibility</b>", table_cell_bold), Paragraph("Month-on-month agreement. Cancel anytime with a 30-day prior written notice.", table_cell_style)]
    ]

    comm_table = Table(comm_data, colWidths=[2.2*inch, 5.2*inch])
    comm_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.6, border_color),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('BACKGROUND', (0,1), (-1,-1), light_bg),
    ]))
    story.append(comm_table)
    story.append(Spacer(1, 6))

    guarantee_data = [
        [
            Paragraph("<b>100% DATA CONTROL</b>", table_header_style),
            Paragraph("<b>BUYOUT OPTION ANYTIME</b>", table_header_style),
            Paragraph("<b>FAIL-SAFE CODE HANDOFF</b>", table_header_style)
        ],
        [
            Paragraph("Atom & Echo owns all client records, posts, metrics, and billing data. Full raw JSON/CSV exports accessible on demand anytime.", table_cell_style),
            Paragraph("While on subscription, BaseWorks maintains and scales the OS. You hold the permanent option to buy 100% code ownership anytime.", table_cell_style),
            Paragraph("If BaseWorks is ever unable to support the system, full source code and cloud infrastructure credentials transfer to you immediately.", table_cell_style)
        ]
    ]
    gtree_table = Table(guarantee_data, colWidths=[2.46*inch, 2.47*inch, 2.47*inch])
    gtree_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), dark_text),
        ('GRID', (0,0), (-1,-1), 0.6, border_color),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('BACKGROUND', (0,1), (-1,-1), light_bg),
    ]))
    story.append(gtree_table)

    # ================= PAGE 2 =================
    story.append(PageBreak())
    story.append(Paragraph("2. What V1 Means for You: The 5 Core Outcomes", h1_style))
    story.append(Paragraph("At the end of Phase 1, your day-to-day agency operations transform around 5 concrete actions:", body_style))

    outcomes_data = [
        [Paragraph("<b>Action</b>", table_header_style), Paragraph("<b>Your Experience in the Atom & Echo OS</b>", table_header_style)],
        [Paragraph("<b>SEE</b>", table_cell_bold), Paragraph("Everything requiring your attention today in one morning command screen (overdue reviews, requests, upcoming renewals, unbilled expenses).", table_cell_style)],
        [Paragraph("<b>PLAN</b>", table_cell_bold), Paragraph("See every client's publishing output and agency deadlines on one master calendar instead of jumping between Notion tables.", table_cell_style)],
        [Paragraph("<b>SEND</b>", table_cell_bold), Paragraph("Send clients a single clean WhatsApp link for reviews instead of dragging them into Notion logins and desktop dashboards.", table_cell_style)],
        [Paragraph("<b>BILL</b>", table_cell_bold), Paragraph("Generate professional monthly invoices with client tool expenses (HeyReach, Clay, etc.) automatically itemized and recovered.", table_cell_style)],
        [Paragraph("<b>REMEMBER</b>", table_cell_bold), Paragraph("Keep client strategy context, meeting notes, credentials, requests, and milestones permanently attached to the client record.", table_cell_style)],
    ]
    outcomes_table = Table(outcomes_data, colWidths=[1.5*inch, 5.9*inch])
    outcomes_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.6, border_color),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('BACKGROUND', (0,1), (-1,-1), light_bg),
    ]))
    story.append(outcomes_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("3. Phase 1 Core Systems Architecture (The 8 Systems)", h1_style))
    story.append(Paragraph("Phase 1 delivers the operational core: eliminating the daily friction of client management, content delivery, reviews, billing, and team execution.", body_style))
    story.append(Spacer(1, 2))

    def add_feature_card(num, title, problem, solution, included):
        card_content = [
            [Paragraph(f"<b>{num} {title}</b>", ParagraphStyle('CardH', parent=h2_style, textColor=primary_color, fontSize=8.8, spaceBefore=0, spaceAfter=1))],
            [Paragraph(f"<b>Pain Solved:</b> {problem}", body_style)],
            [Paragraph(f"<b>The OS Solution:</b> {solution}", body_style)],
            [Paragraph(f"<b>Included in Phase 1:</b> {included}", ParagraphStyle('IncStyle', parent=body_style, fontSize=7.4, textColor=muted_text, spaceAfter=0))]
        ]
        t = Table(card_content, colWidths=[7.4*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), card_bg),
            ('BOX', (0,0), (-1,-1), 0.8, border_color),
            ('LINEBELOW', (0,0), (0,0), 0.6, primary_color),
            ('TOPPADDING', (0,0), (-1,-1), 2.2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2.2),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 4))

    add_feature_card(
        "3.1", "Master Command Center ('What Needs My Attention Today?')",
        "Scattered databases force you to manually track who needs what, when invoices are due, and which client is waiting.",
        "A single morning operational dashboard that surfaces only actionable items: client approvals waiting >48h, overdue client requests, today's scheduled posts, upcoming renewals, and unbilled tool expenses.",
        "Overdue & blocked item alerts; today's publishing agenda; upcoming renewals; quick-action post and expense loggers. Zero vanity metrics."
    )

    add_feature_card(
        "3.2", "Client Workspace & Work Management",
        "Client context, active deliverables, ad-hoc change requests, contract dates, and team tasks are scattered across Notion pages, WhatsApp chats, and external spreadsheets.",
        "One connected operating hub per client holding their active engagement, deliverables, client requests, internal team tasks, meeting history, strategy context, billing, tools, and credentials.",
        "Client profile & engagement scope; client request queue (Received -> Assigned -> In Progress -> Waiting for Client -> Completed); internal team tasks with assignees and due dates; activity history stream. Key dates & renewals: Contract/engagement start, expiry, and renewal dates are tracked centrally and surfaced before they become overdue. Performance data: Phase 1 preserves the structure for client/content performance records; automated platform syncing is deferred."
    )

    add_feature_card(
        "3.3", "Unified Agency Calendar",
        "Managing separate calendars for each client creates blindness across weekly agency workload, while manual status updates create calendar maintenance overhead.",
        "One operational calendar across all clients and deliverables. Content publishing is the primary Phase 1 view, with key meeting dates, deadlines, and tool renewal dates visible alongside it. The calendar is an automatic temporal projection — no manual calendar maintenance.",
        "Master calendar with filters by client, format, pillar, and status; lifecycle state machine (Idea -> Development -> Internal Review -> Client Review -> Approved -> Scheduled -> Published); post format & pillar taxonomy; markdown post preview."
    )

    # ================= PAGE 3 =================
    story.append(PageBreak())
    add_feature_card(
        "3.4", "Zero-Friction Client Review Portal (Mobile PWA + WhatsApp)",
        "Busy executive clients hate logging into Notion, especially on mobile. Approvals take 1-2 weeks of manual WhatsApp chasing.",
        "Clients receive a direct, formatted WhatsApp link. Tapping it opens a lightweight, mobile-optimized review screen without passwords or Notion logins. One tap on 'Approve' instantly updates the system.",
        "Branded mobile-first PWA; secure magic token access; high-fidelity preview (text, carousels, assets); 1-click Approve; inline revision/comment box; automated WhatsApp notification trigger."
    )

    add_feature_card(
        "3.5", "Automated Invoicing & Pass-Through Tool Billing",
        "High-value client SaaS expenses (e.g., Rs. 18,000-Rs. 20,000/mo for HeyReach/Clay on clients like Debtworks) are manually tracked or forgotten, causing revenue leakage.",
        "Client software subscriptions are directly mapped to each client. The system automatically rolls them into monthly retainer invoices as itemized line items with zero manual math.",
        "Recurring invoice generation; automatic pass-through tool expense calculation; standard & GST invoice formats; payment tracking (Draft -> Sent -> Paid -> Overdue); 1-click PDF download & email dispatch."
    )

    add_feature_card(
        "3.6", "Subscription Renewal Sentinel",
        "International SaaS cards fail unexpectedly under bank e-mandates, abruptly halting live outreach campaigns and software access.",
        "A central recurring software tracker mapped to clients and cards with proactive renewal alerts.",
        "SaaS renewal calendar; automated alert notification 48 hours prior to renewal date to ensure account balance or alternate card validation."
    )

    add_feature_card(
        "3.7", "Central Credential Vault",
        "Client passwords and accounts (LinkedIn, HeyReach, Clay) are scattered across Notion pages or WhatsApp messages, posing severe security and accessibility risks.",
        "A dedicated, secure credentials subsystem inside the OS attached directly to client records.",
        "Encrypted secret storage; masked values by default; role-based access control (Admin vs Team); audit logging for credential reveals and copies."
    )

    add_feature_card(
        "3.8", "Fathom Meeting-to-Context Pipeline",
        "Strategic ideas and commitments from weekly client strategy calls stay trapped in call recordings or manual notes, requiring tedious manual translation.",
        "Fathom call notes flow directly into the client's persistent context hub. The system parses dates, commitments, and content topics into proposed calendar cards for 1-click confirmation.",
        "Fathom call summary logger attached to client profiles; proposed action engine (dates, tasks, content ideas) requiring 1-click confirmation before updating the system."
    )

    # ================= PAGE 4 =================
    story.append(PageBreak())
    story.append(Paragraph("4. What We Are Deliberately Leaving for Phase 2", h1_style))
    story.append(Paragraph("To ensure Phase 1 launches fast and remains rock-solid, we consciously defer advanced and experimental features to subsequent monthly evolutions:", body_style))

    deferred_data = [
        [Paragraph("<b>Deferred Feature (Phase 2+)</b>", table_header_style), Paragraph("<b>Reason for Deferral</b>", table_header_style)],
        [Paragraph("<b>Autonomous AI Personal-Branding Engine</b>", table_cell_bold), Paragraph("Requires reliable historical content context and client approval data first. Built once Phase 1 data is rich.", table_cell_style)],
        [Paragraph("<b>Passive Thought-Capture & Social Feed Scraping</b>", table_cell_bold), Paragraph("Advanced experimental capability; deferred until core content and review workflows are 100% operational.", table_cell_style)],
        [Paragraph("<b>Full Outreach CRM / Clay Replacement</b>", table_cell_bold), Paragraph("Cold outbound stays in specialized external tools (Clay/Smartlead). Sudeesh is prioritizing founder personal branding. Phase 1 tracks campaign status only.", table_cell_style)],
        [Paragraph("<b>Automated Direct LinkedIn/X Publishing</b>", table_cell_bold), Paragraph("Agency retains final 1-click manual publishing control to guarantee editorial safety and platform compliance.", table_cell_style)],
        [Paragraph("<b>Automated Case Study & Pitch Generator</b>", table_cell_bold), Paragraph("Leverages accumulated Phase 1 client performance proof (e.g. Debtworks' 1.5M impressions) to pitch future leads.", table_cell_style)]
    ]
    def_table = Table(deferred_data, colWidths=[2.8*inch, 4.6*inch])
    def_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), dark_text),
        ('GRID', (0,0), (-1,-1), 0.6, border_color),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('BACKGROUND', (0,1), (-1,-1), light_bg),
    ]))
    story.append(def_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("5. Phase 1 Objective Success Criteria", h1_style))
    story.append(Paragraph("At the conclusion of Phase 1, delivery acceptance is evaluated against 6 concrete operational outcomes:", body_style))

    ac_data = [
        [Paragraph("<b>Outcome ID</b>", table_header_style), Paragraph("<b>Objective Acceptance Statement</b>", table_header_style)],
        [Paragraph("<b>[ ] AC-1</b>", table_cell_bold), Paragraph("I can see all active client content and operational deadlines in one unified master agency calendar.", table_cell_style)],
        [Paragraph("<b>[ ] AC-2</b>", table_cell_bold), Paragraph("A client can review, comment, and approve a post via a secure mobile link without logging into Notion.", table_cell_style)],
        [Paragraph("<b>[ ] AC-3</b>", table_cell_bold), Paragraph("Client approval automatically updates post status, confirms the calendar schedule, and generates publishing tasks with zero manual bookkeeping.", table_cell_style)],
        [Paragraph("<b>[ ] AC-4</b>", table_cell_bold), Paragraph("Client SaaS tool expenses flow into monthly retainer invoices automatically without manual math or re-entry.", table_cell_style)],
        [Paragraph("<b>[ ] AC-5</b>", table_cell_bold), Paragraph("Client credentials can be securely stored, masked, and retrieved directly from the client workspace.", table_cell_style)],
        [Paragraph("<b>[ ] AC-6</b>", table_cell_bold), Paragraph("Meeting outcomes from Fathom become proposed tasks and calendar actions with 1-click confirmation.", table_cell_style)],
    ]
    ac_table = Table(ac_data, colWidths=[1.2*inch, 6.2*inch])
    ac_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.6, border_color),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('BACKGROUND', (0,1), (-1,-1), light_bg),
    ]))
    story.append(ac_table)

    # ================= PAGE 5 =================
    story.append(PageBreak())
    story.append(Paragraph("6. Zero-Friction Onboarding & Delivery Milestones", h1_style))
    story.append(Paragraph("Because BaseWorks already holds administrative access to Atom & Echo's Notion workspace, Sudeesh does not need to fill out spreadsheets or perform manual exports. BaseWorks directly migrates all client rosters, pricing tiers, content pillars, drafts, and tool expenses.", body_style))

    dep_data = [
        [Paragraph("<b>What Sudeesh Needs to Provide</b>", table_header_style), Paragraph("<b>Purpose</b>", table_header_style), Paragraph("<b>Due Date</b>", table_header_style)],
        [Paragraph("Animated SVG logo asset file", table_cell_bold), Paragraph("Kinetic Brand Loader on system startup", table_cell_style), Paragraph("September 20, 2026", table_cell_style)],
        [Paragraph("WhatsApp messaging copy preference", table_cell_bold), Paragraph("Default message copy sent to clients with review links", table_cell_style), Paragraph("September 21, 2026", table_cell_style)],
        [Paragraph("V1 Staging Review & Feedback", table_cell_bold), Paragraph("Live workflow testing on staging sandbox", table_cell_style), Paragraph("September 23, 2026", table_cell_style)],
    ]
    dep_table = Table(dep_data, colWidths=[2.6*inch, 3.4*inch, 1.4*inch])
    dep_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 0.6, border_color),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('BACKGROUND', (0,1), (-1,-1), light_bg),
    ]))
    story.append(dep_table)
    story.append(Spacer(1, 6))

    t_milestones = [
        "<b>Build Phase (Free):</b> Full engineering committed to development with Rs. 0 upfront CapEx. Billing remains paused throughout the build sprint.",
        "<b>Milestone 1 — V1 Working Draft:</b> <b>September 23, 2026.</b> Sudeesh test-drives the functional master calendar, mobile review portal, and invoicing interface on a secure staging URL. (Staging is a testing sandbox with mock data limits; live production secrets cutover occurs at Go-Live).",
        "<b>Milestone 2 — Final Phase 1 Go-Live:</b> <b>Within 18 calendar days (~October 3-4, 2026).</b> Live onboarding and complete team transition off Notion.",
        "<b>Subscription Start Clock & Client Dependencies:</b> Delivery milestones depend on timely turnaround of the client dependencies above. If review or assets are delayed by the client, delivery dates shift day-for-day, while the agreed 18-day subscription billing start clock proceeds without pause.",
        "<b>Payment Default Protection:</b> Invoices issued on the 1st of each month must be settled within the 4-calendar-day window to ensure uninterrupted live platform and API operations."
    ]
    for m in t_milestones:
        story.append(Paragraph(f"&bull; {m}", bullet_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("7. Blueprint Acceptance & Service Authorization", h1_style))
    story.append(Paragraph("By signing below, the parties confirm the scope, deployment architecture, commercial terms, and operating principles outlined in this Phase 1 Blueprint.", body_style))
    story.append(Spacer(1, 4))

    sig_provider = (
        "<b>Service Provider</b><br/>"
        "BaseWorks<br/><br/>"
        "Name: Aravind Bhati<br/><br/>"
        "Title: Founder & Product Architect, BaseWorks<br/><br/>"
        "Signature: _______________________<br/><br/>"
        "Date: September 18, 2026<br/><br/>"
        "Contact: +91 9113909950"
    )
    sig_client = (
        "<b>Client Partner</b><br/>"
        "Atom & Echo<br/><br/>"
        "Name: Sudeesh D S<br/><br/>"
        "Title: Founder, Atom & Echo; Partner, BaseWorks<br/><br/>"
        "Signature: _______________________<br/><br/>"
        "Date: ___________________________<br/><br/>"
        "Contact: _________________________"
    )

    sigs_table = Table(
        [[Paragraph(sig_provider, body_style), Paragraph(sig_client, body_style)]],
        colWidths=[3.7*inch, 3.7*inch]
    )
    sigs_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 1.0, border_color),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(KeepTogether([sigs_table]))

    doc.build(story)
    print(f"Atom & Echo Phase 1 Blueprint PDF successfully generated at: {pdf_filename}")

if __name__ == "__main__":
    create_atom_echo_blueprint_pdf()
