import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether

def create_atom_echo_charter_pdf():
    pdf_filename = "D:/BaseWorks/Atom & Echo/Atom_Echo_BaseEngine_Charter.pdf"
    logo_path = "D:/BaseWorks/baseworks/BaseWorks_Website/public/BaseWorks.light.png"

    # Setup Document
    margin = 54
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin,
        title="BaseEngine Deployment Charter — Atom & Echo Ops System",
        author="BaseWorks"
    )

    story = []
    styles = getSampleStyleSheet()

    # Define Colors
    primary_color = colors.HexColor("#d13202")  # BaseWorks deep orange
    dark_text = colors.HexColor("#171717")      # Off-black
    muted_text = colors.HexColor("#525252")     # Dark grey
    light_bg = colors.HexColor("#FAFAFA")       # Warm light grey
    border_color = colors.HexColor("#000000")   # Neo-brutalist black

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=dark_text,
        spaceAfter=15
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=primary_color,
        textTransform='uppercase',
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=dark_text,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2Style',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=dark_text,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=dark_text,
        spaceAfter=8
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    bullet_style = ParagraphStyle(
        'BulletStyle',
        parent=body_style,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.0,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.0,
        leading=11.0,
        textColor=dark_text
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell_style,
        fontName='Helvetica-Bold'
    )

    # 1. HEADER SECTION (Logo & Address)
    left_elements = []
    if os.path.exists(logo_path):
        logo = Image(logo_path, width=1.5*inch, height=0.375*inch)
        logo.hAlign = 'LEFT'
        left_elements.append(logo)
        left_elements.append(Spacer(1, 8))
    
    address_text = (
        "<b>BaseWorks</b><br/>"
        "314, ANR PG, Doddathogur Rd,<br/>"
        "Electronic City Phase I, Bengaluru, Karnataka 560100<br/>"
        "hello@baseworks.in | www.baseworks.in/base-engine"
    )
    address_p = Paragraph(address_text, ParagraphStyle('Address', parent=body_style, fontSize=7.5, leading=10, textColor=muted_text))
    left_elements.append(address_p)
    
    right_elements = [
        Paragraph("DEPLOYMENT CHARTER", ParagraphStyle('HRight', fontName='Helvetica-Bold', fontSize=15, leading=18, textColor=primary_color, alignment=2)),
        Spacer(1, 4),
        Paragraph("<b>STATUS:</b> CLIENT REVIEW", ParagraphStyle('SRight', fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=dark_text, alignment=2)),
        Spacer(1, 2),
        Paragraph("<b>DATE:</b> September 17, 2026", ParagraphStyle('DRight', fontName='Helvetica', fontSize=7.5, leading=9, textColor=muted_text, alignment=2)),
        Spacer(1, 2),
        Paragraph("<b>PRODUCT:</b> BaseEngine Custom OS", ParagraphStyle('PRight', fontName='Helvetica-Bold', fontSize=7.5, leading=9, textColor=dark_text, alignment=2))
    ]

    header_table = Table([[left_elements, right_elements]], colWidths=[4.0*inch, 3.0*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 15))

    # Neo-brutalist divider line
    divider = Table([[""]], colWidths=[7.0*inch])
    divider.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 3, border_color),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(divider)
    story.append(Spacer(1, 15))

    # 2. TITLE SECTION
    story.append(Paragraph("BaseEngine Deployment Charter — Atom & Echo Ops System", title_style))
    story.append(Paragraph("Custom Operating System Architecture & Monthly Subscription Agreement", subtitle_style))
    story.append(Paragraph("Prepared by BaseWorks for Sudeesh D S, Founder of Atom & Echo. This Charter establishes the Phase 1 deployment architecture, commercial terms, risk guarantees, and operating framework for Atom & Echo's custom business operating system.", body_style))
    story.append(Spacer(1, 8))

    # 3. SECTION 1: SYSTEM MISSION & PHILOSOPHY
    story.append(Paragraph("1. System Mission & Philosophy", h1_style))
    story.append(Paragraph("Atom & Echo is transitioning into a high-leverage, founder-led growth agency focused strictly on ambitious founders and high-tier personal branding. Today, that vision is constrained by manual operational drag: fragmented Notion databases where multi-client content calendars live in disconnected pages; severe client approval friction where busy executives refuse to log into Notion on mobile (delaying approvals by 1–2 weeks); client-specific SaaS tool costs (such as HeyReach or Clay, running Rs. 18,000–20,000/month for clients like Debtworks) tracked manually or forgotten in billing; and international SaaS cards failing under RBI e-mandate guidelines, abruptly halting client campaigns.", body_style))
    story.append(Paragraph("<b>The BaseEngine Approach:</b> BaseEngine turns Atom & Echo's real-world workflows into a custom-engineered operating system managed under a predictable monthly subscription. This is not generic agency software you have to adapt to. The system holds the knowledge instead of people, clients approve content in seconds from WhatsApp without logins, client tool expenses are automatically recovered on monthly invoices, and the founder gets time back to focus purely on distribution and high-value clients.", body_style))
    story.append(Spacer(1, 8))

    # 4. SECTION 2: COMMERCIAL MODEL
    story.append(Paragraph("2. Commercial Model: The BaseEngine Subscription", h1_style))
    story.append(Paragraph("BaseEngine delivers custom-built enterprise software with the financial simplicity of a SaaS subscription — pricing just like traditional software, but custom-made for 2026.", body_style))
    
    comm_data = [
        [
            Paragraph("<b>Parameter</b>", table_header_style), 
            Paragraph("<b>BaseEngine Terms</b>", table_header_style)
        ],
        [
            Paragraph("<b>Monthly Subscription</b>", table_cell_bold),
            Paragraph("<b>Rs. 20,000 / month flat.</b> Predictable monthly operational cost. No hidden hourly fees.", table_cell_style)
        ],
        [
            Paragraph("<b>Upfront CapEx / Build Fee</b>", table_cell_bold),
            Paragraph("<b>Rs. 0 (Zero).</b> No lump-sum development charges. BaseWorks absorbs the initial engineering investment.", table_cell_style)
        ],
        [
            Paragraph("<b>Subscription Start Clock</b>", table_cell_bold),
            Paragraph("Billing starts strictly on the date of <b>Official Phase 1 Sign-Off (Go-Live)</b>. The build phase is completely free.", table_cell_style)
        ],
        [
            Paragraph("<b>Dedicated Monthly Engineering</b>", table_cell_bold),
            Paragraph("Includes <b>1 requested custom system evolution / feature per month</b> (5–7 business days capacity) to keep the OS evolving as the agency scales.", table_cell_style)
        ],
        [
            Paragraph("<b>Feature Rollover</b>", table_cell_bold),
            Paragraph("Unused monthly engineering capacity <b>rolls over continuously</b> month-to-month.", table_cell_style)
        ],
        [
            Paragraph("<b>Setup & Onboarding</b>", table_cell_bold),
            Paragraph("<b>Included.</b> BaseWorks handles full historical data migration from Atom & Echo's Notion workspace.", table_cell_style)
        ],
        [
            Paragraph("<b>Cloud Hosting & Infrastructure</b>", table_cell_bold),
            Paragraph("<b>Included.</b> Enterprise-grade high-availability cloud hosting, automated database backups, security patches, and maintenance managed by BaseWorks.", table_cell_style)
        ],
        [
            Paragraph("<b>Taxes & Invoicing</b>", table_cell_bold),
            Paragraph("Billed as net. Currently non-GST applicable (standard commercial invoice issued).", table_cell_style)
        ],
        [
            Paragraph("<b>Contract Flexibility</b>", table_cell_bold),
            Paragraph("Month-on-month agreement. Cancel anytime with a 30-day prior written notice.", table_cell_style)
        ],
        [
            Paragraph("<b>Third-Party API & Webhooks</b>", table_cell_bold),
            Paragraph(
                "&bull; <b>WhatsApp & Email Webhooks:</b> Free tier limits utilized where possible.<br/>"
                "&bull; <b>AI / LLM APIs:</b> Usage powered by BaseWorks framework; heavy custom third-party model overages (if client-specific models are utilized) connected via client environment keys.",
                table_cell_style
            )
        ]
    ]

    comm_table = Table(comm_data, colWidths=[2.2*inch, 4.8*inch])
    comm_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 1, border_color),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,1), (-1,-1), light_bg),
    ]))
    story.append(comm_table)
    story.append(Spacer(1, 12))

    # 5. SECTION 3: THE 3 CORE RISK GUARANTEES
    story.append(Paragraph("3. The 3 Core BaseEngine Risk Guarantees", h1_style))
    story.append(Paragraph("To ensure Atom & Echo operates with total security and zero platform lock-in:", body_style))

    guarantee_data = [
        [
            Paragraph("<b>100% DATA CONTROL</b>", table_header_style),
            Paragraph("<b>BUYOUT OPTION ANYTIME</b>", table_header_style),
            Paragraph("<b>FAIL-SAFE CODE HANDOFF</b>", table_header_style)
        ],
        [
            Paragraph("Atom & Echo owns all client records, post drafts, performance metrics, and financial records. Full raw JSON/CSV database exports are accessible on demand at any time.", table_cell_style),
            Paragraph("While on subscription, BaseWorks maintains and continuously improves the OS. Atom & Echo holds the permanent option to buy full, permanent code ownership anytime.", table_cell_style),
            Paragraph("If BaseWorks is ever unable to support the system, full source code repositories and deployment infrastructure credentials transfer directly to you with zero lock-in.", table_cell_style)
        ]
    ]
    gtree_table = Table(guarantee_data, colWidths=[2.33*inch, 2.33*inch, 2.34*inch])
    gtree_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), dark_text),
        ('GRID', (0,0), (-1,-1), 1, border_color),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('BACKGROUND', (0,1), (-1,-1), light_bg),
    ]))
    story.append(gtree_table)
    story.append(Spacer(1, 15))

    # 6. SECTION 4: PHASE 1 DEPLOYMENT ARCHITECTURE
    story.append(Paragraph("4. Phase 1 Deployment Architecture (What Gets Deployed)", h1_style))
    story.append(Paragraph("Every module below is engineered around Atom & Echo's actual workflow, eliminating manual handoffs and fragmentation.", body_style))
    story.append(Spacer(1, 5))

    def add_module(num, title, does, included, onboarding, excluded):
        story.append(Paragraph(f"<b>{num} {title}</b>", h2_style))
        txt = (
            f"<b>What it does:</b> {does}<br/>"
            f"<b>Included:</b> {included}<br/>"
            f"<b>Onboarding:</b> {onboarding}<br/>"
            f"<b>Deliberately Excluded from V1:</b> {excluded}"
        )
        story.append(Paragraph(txt, body_style))
        story.append(Spacer(1, 4))

    add_module(
        "4.1", "Master Multi-Client Content Engine",
        "Replaces scattered Notion databases with one unified pipeline showing every scheduled, drafted, and published post across all agency clients (Debtworks, Florian, Bilal, Zainab, etc.).",
        "Multi-client monthly and weekly master calendar view; live status tracking (Idea -> In Development -> Under Review -> Ready to Publish -> Published); content format taxonomy (Text, Carousel, Video Script, Image); strategic content pillar tagging (Market Analysis, Client Testimonial, Industry Insight, Founder Story); direct markdown post editor with character counts and preview.",
        "BaseWorks already has full Notion admin access; all existing client tags, content pillars, and drafts will be migrated directly by BaseWorks.",
        "Automated direct publishing via LinkedIn/X API (the agency maintains final publishing control)."
    )

    add_module(
        "4.2", "Zero-Friction Client Review Portal (Mobile PWA + WhatsApp Gateway)",
        "Eliminates Notion client review friction. Busy executives receive a formatted WhatsApp link, open a lightweight mobile web app without logging in, and approve content in 5 seconds.",
        "Client-facing, mobile-first Progressive Web App (PWA); direct secure tokenized URL access (zero usernames, passwords, or Notion accounts required); high-fidelity post preview (supporting carousels, images, and text formatting); one-click 'Approve' button that automatically flips post status to Ready to Publish; inline revision box for quick client comments and edits; automated WhatsApp notification trigger with the pre-generated review link.",
        "Client contact numbers and review message copy extracted directly from Notion.",
        "In-app real-time messaging room (conversations remain on WhatsApp)."
    )

    add_module(
        "4.3", "Client Relationship & Retainer Intelligence",
        "Single source of truth for each agency client holding their active service tier, monthly post quota, target ICP, and milestone metrics.",
        "Dedicated client profile views; service tier tagging (LinkedIn Personal Branding, Outbound, Growth Strategy); monthly quota tracking (e.g., 10 vs. 20 posts/month target vs. delivered); client strategy hub (profile headline, about section guidelines, target audience notes); key milestone logger (follower growth milestones, viral post records).",
        "Current client roster and profile notes extracted from Notion.",
        "Automated live web scraping of LinkedIn profile followers (metrics entered via standard monthly review or stats exports)."
    )

    add_module(
        "4.4", "Automated Invoicing & Pass-Through Tool Billing",
        "Stops revenue leakage by automating monthly retainer invoices and dynamically adding client-specific software expenses.",
        "Automated recurring invoice generation on client billing dates; automatic pass-through calculation of client-specific software costs (e.g., auto-billing Chetan for Rs. 18,000–20,000 of HeyReach/Clay tools without manual math); support for standard and GST invoice formats; payment status tracking (Draft, Sent, Paid, Overdue); one-click PDF generation and client email dispatch.",
        "Billing details, invoice numbering prefix, and tool expense rules extracted from Notion.",
        "Payment gateway merchant checkout (clients pay via direct bank transfer/NEFT/UPI)."
    )

    add_module(
        "4.5", "RBI Compliance Auto-Renewal Sentinel",
        "Protects client campaigns from stopping unexpectedly due to Indian card auto-debit rejections under RBI e-mandate guidelines.",
        "SaaS subscription tracking dashboard mapped to specific clients and tools (HeyReach, Clay, Fathom, etc.); automated alert notification 48 hours prior to renewal date to ensure manual balance or card validation.",
        "List of recurring tools, renewal dates, and billing cycles extracted from Notion Password Manager.",
        "Automated direct bank account balance funding."
    )

    add_module(
        "4.6", "Retainer Maturity & Renewal Radar",
        "Proactively surfaces upcoming contract expirations so retainers are renewed on time.",
        "Client contract maturity countdown; automated reminder alert 30 days prior to retainer expiration; one-click contract extension and renewal logging.",
        "Client start dates and contract lengths extracted from Notion.",
        "Cryptographic government e-signatures."
    )

    add_module(
        "4.7", "Meeting Note Topic-to-Post Pipeline",
        "Captures weekly strategy call topics and turns them directly into content calendar items.",
        "Dedicated meeting notes log per client; structured agenda and call summary logger; one-click action to convert discussed topics directly into draft post cards on the calendar.",
        "Existing meeting note templates extracted from Notion.",
        "Automated AI bot dial-in for unscheduled phone calls."
    )

    add_module(
        "4.8", "Agency OKR & Growth Command Center",
        "Real-time visibility into agency revenue benchmarks without maintaining manual spreadsheets.",
        "Live MRR compilation from active client retainers; visual progress tracker against agency benchmarks (e.g., target of 10 personal branding clients at Rs. 50,000–60,000/month = Rs. 5L–6L MRR target); agency client capacity utilization indicator.",
        "Target OKR figures extracted from Notion.",
        "Multi-entity corporate tax accounting."
    )

    add_module(
        "4.9", "Internal Team Roles & Access Control",
        "Clean operational separation between leadership and execution.",
        "Admin Role (Sudeesh): Full access to billing, revenue metrics, tool costs, and client settings. Team Member Role (Nikhil): Access to content calendar, post drafting, client review queues, and meeting notes.",
        "Team email addresses configured during setup.",
        "Complex multi-layered enterprise permissions."
    )

    add_module(
        "4.10", "Atom & Echo Kinetic Brand Identity & SVG Loader",
        "Elevates the platform into an inspiring, high-end daily workspace.",
        "Custom Atom & Echo brand color palette and dark/light interface themes; dynamic animated SVG logo integration ('Atom bursting into an Echo') on initial login and system transitions.",
        "Sudeesh provides the animated SVG asset file.",
        "External public agency website redesign."
    )

    story.append(Spacer(1, 10))

    # 7. SECTION 5: CONTINUOUS MONTHLY EVOLUTION
    story.append(Paragraph("5. Continuous Monthly Evolution (How Monthly Sprints Work)", h1_style))
    story.append(Paragraph("In traditional software, delivery marks the end of development and leaves you with static code. Under BaseEngine, your operating system is alive and continuously evolving.", body_style))
    
    evo_bullets = [
        "<b>Dedicated Monthly Engineering Capacity:</b> Each month, BaseWorks reserves 5–7 business days of engineering capacity to build requested additions for Atom & Echo.",
        "<b>Simple Scoping:</b> Sudeesh submits a request -> BaseWorks outlines the build time in business days -> If it fits within the monthly box, it is built as that month's included feature.",
        "<b>Continuous Rollover:</b> Unused monthly engineering capacity rolls over month-to-month without expiring.",
        "<b>Scope Protection:</b> Features larger than the monthly box are scoped and quoted separately in advance — never surprise charges after the fact."
    ]
    for bullet in evo_bullets:
        story.append(Paragraph(f"&bull; {bullet}", bullet_style))

    story.append(Paragraph("<b>Future Roadmap Candidates (Phase 2+):</b> AI Meeting Audio-to-Draft Engine (Fathom audio parsing into first-draft LinkedIn carousels); Automated Case Study & Custom Pitch Generator (one-click custom proposals using client proof of work like Debtworks' 1.5M impressions to close leads like Nishant); and Passive Thought-Capture Agents for voice cloning.", body_style))
    story.append(Spacer(1, 10))

    # 8. SECTION 6: ONBOARDING & ZERO-FRICTION SETUP
    story.append(Paragraph("6. Onboarding & Zero-Friction Setup", h1_style))
    story.append(Paragraph("Because BaseWorks already has administrative access to Atom & Echo's Notion workspace, Sudeesh does not need to fill out spreadsheets or gather manual exports. BaseWorks directly extracts and migrates client databases, active contracts, master content pillars, post templates, tool billing details, password manager schedules, and OKR benchmarks.", body_style))
    
    dep_data = [
        [
            Paragraph("<b>Item Required from Sudeesh</b>", table_header_style), 
            Paragraph("<b>Purpose / Module</b>", table_header_style), 
            Paragraph("<b>Target Date</b>", table_header_style)
        ],
        [Paragraph("Animated SVG logo asset file", table_cell_bold), Paragraph("Kinetic Brand Loader (4.10)", table_cell_style), Paragraph("September 20, 2026", table_cell_style)],
        [Paragraph("WhatsApp Webhook / Gateway preference", table_cell_bold), Paragraph("Client Approval Portal (4.2)", table_cell_style), Paragraph("September 21, 2026", table_cell_style)],
        [Paragraph("V1 Draft Review & Feedback", table_cell_bold), Paragraph("V1 Staging Testing & Iteration", table_cell_style), Paragraph("September 23, 2026", table_cell_style)],
    ]

    dep_table = Table(dep_data, colWidths=[2.8*inch, 2.8*inch, 1.4*inch])
    dep_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('GRID', (0,0), (-1,-1), 1, border_color),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('BACKGROUND', (0,1), (-1,-1), light_bg),
    ]))
    story.append(dep_table)
    story.append(Spacer(1, 10))

    # 9. SECTION 7: TIMELINE, MILESTONES & ACTIVATION
    story.append(Paragraph("7. Timeline, Milestones & Activation", h1_style))
    
    timeline_bullets = [
        "<b>Build Sprint (Free Phase):</b> BaseWorks commits engineering resources to develop Phase 1 with Rs. 0 upfront fee. Subscription billing remains paused throughout the build phase.",
        "<b>Milestone 1 — V1 Working Draft:</b> <b>September 23, 2026.</b> Sudeesh tests the functional master calendar, mobile client approval portal, and invoicing interface on a secure staging environment.",
        "<b>Milestone 2 — Final Phase 1 Deployment:</b> <b>Within 18 calendar days (~October 3–4, 2026).</b> Complete deployment, live onboarding, and team transition off Notion.",
        "<b>Subscription Start Clock:</b> Month 1 billing (Rs. 20,000/month) officially activates strictly on the date of <b>Official Sign-Off (Go-Live)</b>.",
        "<b>Staging Isolation:</b> During development, the platform is hosted on a secure staging URL. Live domain connection occurs upon Go-Live.",
        "<b>Payment Terms:</b> Monthly subscription invoices are issued on the 1st of each month with a 10 business-day grace period."
    ]
    for bullet in timeline_bullets:
        story.append(Paragraph(f"&bull; {bullet}", bullet_style))
    story.append(Spacer(1, 15))

    # 10. CHARTER ACCEPTANCE TABLE
    story.append(Paragraph("Charter Acceptance & Service Agreement", h1_style))
    story.append(Paragraph("By signing below, the parties confirm the scope, deployment architecture, commercial terms, and operating principles outlined in this BaseEngine Deployment Charter.", body_style))
    story.append(Spacer(1, 5))

    sig_provider = (
        "<b>Service Provider</b><br/>"
        "BaseWorks<br/><br/>"
        "Name: Aravind Bhati<br/><br/>"
        "Title: Founder & Product Architect, BaseWorks<br/><br/>"
        "Signature: _______________________<br/><br/>"
        "Date: September 17, 2026<br/><br/>"
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
        colWidths=[3.5*inch, 3.5*inch]
    )
    sigs_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 1.5, border_color),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    
    story.append(KeepTogether([sigs_table]))

    # Build document
    doc.build(story)
    print(f"Atom & Echo Charter PDF successfully created at: {pdf_filename}")

if __name__ == "__main__":
    create_atom_echo_charter_pdf()
