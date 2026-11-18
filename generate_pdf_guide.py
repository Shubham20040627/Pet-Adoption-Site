"""
PawConnect Backend Architecture & Viva Master Guide PDF Generator.
Uses ReportLab 5.1.0 to produce an elegant, comprehensive PDF guide.
"""
import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print total page numbers."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Skip headers & footers on the cover page
        if self._pageNumber > 1:
            # Header
            self.drawString(40, 755, "PawConnect — Backend Architecture & Complete Viva Defense Guide")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(40, 747, 572, 747)

            # Footer
            self.line(40, 45, 572, 45)
            self.drawString(40, 32, "Confidential & Academic Evaluation Copy • Animal Welfare & Rescue Management System")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(572, 32, page_text)

        self.restoreState()


def create_pdf(output_paths):
    # Primary output path
    primary_path = output_paths[0]
    doc = SimpleDocTemplate(
        primary_path,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#0f172a")    # Slate 900
    teal_color = colors.HexColor("#0f766e")       # Teal 700
    brand_blue = colors.HexColor("#2563eb")       # Blue 600
    amber_color = colors.HexColor("#b45309")      # Amber 700
    body_color = colors.HexColor("#334155")       # Slate 700
    dark_gray = colors.HexColor("#1e293b")

    cover_title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color,
        alignment=0,
        spaceAfter=8
    )

    cover_subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=teal_color,
        alignment=0,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'CustomH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=teal_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=brand_blue,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=body_color,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=body_color,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    code_box_style = ParagraphStyle(
        'CustomCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f1f5f9"),
        borderColor=colors.HexColor("#cbd5e1"),
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=6
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0f766e"),
    )

    qa_q_style = ParagraphStyle(
        'QAQuestion',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#1e3a8a"),
        spaceBefore=8,
        spaceAfter=2,
        keepWithNext=True
    )

    qa_a_style = ParagraphStyle(
        'QAAnswer',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=body_color,
        leftIndent=10,
        spaceAfter=6
    )

    story = []

    # ─────────────────────────────────────────────────────────────────────────
    # COVER / HEADER BANNER
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 10))
    story.append(Paragraph("PAWCONNECT BACKEND ARCHITECTURE & VIVA MASTER GUIDE", cover_title_style))
    story.append(Paragraph("Complete Technical Handbook: Beginner-Friendly Code Walkthrough, System Architecture & Faculty Defense Bank", cover_subtitle_style))
    
    meta_table_data = [
        [
            Paragraph("<b>Project:</b> PawConnect (Animal Adoption & Rescue System)", body_style),
            Paragraph("<b>Backend Stack:</b> Python 3 • Django REST Framework • PyMongo", body_style),
        ],
        [
            Paragraph("<b>Target Audience:</b> Academic Viva, Faculty Evaluation & Project Presentation", body_style),
            Paragraph("<b>Database:</b> MongoDB NoSQL (<code>pawconnect_db</code>)", body_style),
        ]
    ]
    t_meta = Table(meta_table_data, colWidths=[270, 262])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 1: BACKEND CONCEPTS FROM ZERO
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("CHAPTER 1: The Core Concepts (Backend & Django From Scratch)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=teal_color, spaceAfter=8, spaceBefore=2))
    
    story.append(Paragraph("<b>The Restaurant Analogy (How PawConnect Works):</b>", h2_style))
    story.append(Paragraph("• <b>The Dining Room (React Frontend - Port 5173):</b> What the user sees and interacts with — buttons, cards, images, adoption forms.", bullet_style))
    story.append(Paragraph("• <b>The Waiter (HTTP API & Router):</b> When an adopter clicks 'Adopt Bruno', the waiter takes the order via an HTTP POST request and carries it to the kitchen.", bullet_style))
    story.append(Paragraph("• <b>The Kitchen (Django REST Framework - Port 8000):</b> The backend. It checks permissions, validates form inputs, runs business rules, and prepares the response.", bullet_style))
    story.append(Paragraph("• <b>The Pantry (MongoDB Database):</b> The storage room where pets, user accounts, adoption applications, and medical records are safely stored as JSON-like documents.", bullet_style))
    story.append(Paragraph("• <b>The Prepared Dish (JSON Response):</b> Django formats the result into standard JSON text and sends it back to the React UI to display.", bullet_style))

    story.append(Paragraph("<b>What is JWT (JSON Web Token)?</b>", h2_style))
    story.append(Paragraph("JWT functions like a digital wristband at a waterpark. When a user logs in with their credentials, Django issues an encrypted, tamper-proof token containing their User ID and Role (Adopter, Shelter, or Admin). For every subsequent request, the user includes this token in the header (<code>Authorization: Bearer &lt;token&gt;</code>). The server verifies the token signature without querying the password again.", body_style))

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 2: HIGH-LEVEL ARCHITECTURE FLOW
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 6))
    story.append(Paragraph("CHAPTER 2: High-Level Architecture & Request Flow", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=teal_color, spaceAfter=8, spaceBefore=2))

    arch_steps = [
        [
            Paragraph("<b>Stage</b>", h2_style),
            Paragraph("<b>Component & Responsibility</b>", h2_style),
            Paragraph("<b>Key Code Involved</b>", h2_style)
        ],
        [
            Paragraph("1. Client Request", body_style),
            Paragraph("React initiates an Axios / fetch call with a Bearer JWT Token.", body_style),
            Paragraph("<code>frontend/src/api/*.js</code>", body_style)
        ],
        [
            Paragraph("2. Middleware & CORS", body_style),
            Paragraph("Django checks origins; <code>CorsMiddleware</code> prevents cross-origin browser blocking.", body_style),
            Paragraph("<code>backend/config/settings.py</code>", body_style)
        ],
        [
            Paragraph("3. Authentication", body_style),
            Paragraph("Decodes token, extracts user ID, and wraps it in a <code>MongoUser</code> object.", body_style),
            Paragraph("<code>backend/config/auth.py</code>", body_style)
        ],
        [
            Paragraph("4. URL Routing", body_style),
            Paragraph("Matches URL path and forwards to the target app view.", body_style),
            Paragraph("<code>backend/config/urls.py</code>", body_style)
        ],
        [
            Paragraph("5. Role Authorization", body_style),
            Paragraph("Checks RBAC permissions (e.g., <code>@permission_classes([IsShelter])</code>).", body_style),
            Paragraph("<code>backend/config/auth.py</code>", body_style)
        ],
        [
            Paragraph("6. Business Logic", body_style),
            Paragraph("Executes application rules (validates pet availability, checks duplicates).", body_style),
            Paragraph("<code>backend/apps/*/views.py</code>", body_style)
        ],
        [
            Paragraph("7. Database Layer", body_style),
            Paragraph("Queries MongoDB collections via PyMongo and cleans documents via <code>serialize_doc()</code>.", body_style),
            Paragraph("<code>backend/config/mongodb.py</code>", body_style)
        ]
    ]
    t_arch = Table(arch_steps, colWidths=[90, 270, 172])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e2e8f0")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#94a3b8")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_arch)

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 3: CONFIGURATION FILES DEEP DIVE
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 8))
    story.append(Paragraph("CHAPTER 3: Master Configuration Files Deep-Dive (`backend/config/`)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=teal_color, spaceAfter=8, spaceBefore=2))

    story.append(Paragraph("1. `settings.py` — The Master Constitution", h2_style))
    story.append(Paragraph("• <b>INSTALLED_APPS:</b> Registers Django REST Framework (<code>rest_framework</code>), CORS headers (<code>corsheaders</code>), and our 6 custom micro-apps (<code>apps.accounts</code>, <code>apps.pets</code>, <code>apps.shelters</code>, <code>apps.adoptions</code>, <code>apps.admin_portal</code>, <code>apps.common</code>).", bullet_style))
    story.append(Paragraph("• <b>MIDDLEWARE:</b> Registers <code>CorsMiddleware</code> at line 31 to allow frontend port 5173 to communicate with port 8000.", bullet_style))
    story.append(Paragraph("• <b>REST_FRAMEWORK Config:</b> Configures <code>MongoJWTAuthentication</code> as the default authentication handler.", bullet_style))
    story.append(Paragraph("• <b>MEDIA_ROOT & MEDIA_URL:</b> Sets physical file path for uploaded pet photos (<code>/media/pets/</code>).", bullet_style))

    story.append(Paragraph("2. `urls.py` — The Master Traffic Controller", h2_style))
    story.append(Paragraph("Directs incoming traffic to app sub-routers: <code>/api/auth/</code> (accounts), <code>/api/pets/</code> (pets), <code>/api/adoptions/</code> (adoptions), <code>/api/shelter/</code> (shelters), <code>/api/admin/</code> (admin), and <code>/api/</code> (common). Also serves uploaded media images during development.", body_style))

    story.append(Paragraph("3. `mongodb.py` — PyMongo Database Connector", h2_style))
    story.append(Paragraph("• <code>get_client()</code> & <code>get_db()</code>: Implements the <b>Singleton Pattern</b>. Reuses one database client connection pool rather than opening a connection on every single request, maximizing speed.", bullet_style))
    story.append(Paragraph("• <code>serialize_doc(doc)</code>: Crucial function! MongoDB stores IDs as binary <code>ObjectId</code> and dates as Python <code>datetime</code>. Standard JSON cannot transmit these. This function converts <code>_id</code> into a string <code>id</code> and dates into ISO strings.", bullet_style))
    story.append(Paragraph("• <code>init_db_indexes()</code>: Automatically creates MongoDB indexes at startup: unique index on <code>users.email</code>, unique compound index on <code>favorites (user_id, pet_id)</code>, and search indexes on <code>species</code> and <code>status</code>.", bullet_style))

    story.append(Paragraph("4. `auth.py` — JWT Authentication & Role-Based Access Control", h2_style))
    story.append(Paragraph("• <code>MongoUser</code>: Wraps MongoDB user records into a standard Django user object with boolean role flags (<code>is_adopter</code>, <code>is_shelter</code>, <code>is_admin</code>).", bullet_style))
    story.append(Paragraph("• <code>generate_jwt_token()</code>: Encrypts user payload into an HS256 JWT string with a 72-hour expiration.", bullet_style))
    story.append(Paragraph("• <code>MongoJWTAuthentication</code>: Validates incoming Bearer tokens and attaches the authenticated user to <code>request.user</code>.", bullet_style))
    story.append(Paragraph("• <b>Permission Classes:</b> <code>IsAuthenticatedMongoUser</code>, <code>IsAdopter</code>, <code>IsShelter</code>, and <code>IsAdmin</code> enforce role restrictions.", bullet_style))

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 4: THE 6 MODULAR APPS
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("CHAPTER 4: The 6 Micro-Feature Apps (`backend/apps/`)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=teal_color, spaceAfter=8, spaceBefore=2))

    story.append(Paragraph("1. `apps/accounts/` — User Management & Google OAuth", h2_style))
    story.append(Paragraph("• <code>register_view()</code>: Validates credentials, hashes passwords using Django's <code>make_password()</code> (PBKDF2/SHA-256), creates shelter profiles if role is shelter (with AWBI licensing), and returns a JWT token.", bullet_style))
    story.append(Paragraph("• <code>login_view()</code>: Verifies email & hashed password with <code>check_password()</code> and returns an active JWT token.", bullet_style))
    story.append(Paragraph("• <code>me_view()</code>: Returns profile details for the authenticated user.", bullet_style))
    story.append(Paragraph("• <code>google_auth_view()</code>: Validates Google OAuth ID tokens server-to-server with Google's API. Strictly restricted to Adopter accounts. Automatically provisions accounts and generates JWTs.", bullet_style))

    story.append(Paragraph("2. `apps/shelters/` — Shelter Operations & KYC", h2_style))
    story.append(Paragraph("• <code>shelter_dashboard()</code>: Queries MongoDB in real-time to compute counts for total pets, available pets, pending applications, approved adoptions, and upcoming Meet & Greet visits.", bullet_style))
    story.append(Paragraph("• <code>shelter_my_pets()</code>: Returns only the pets owned by the logged-in shelter (<code>shelter_id == request.user.id</code>).", bullet_style))
    story.append(Paragraph("• <code>shelter_profile()</code>: Manages shelter bio, rescue capacity, address, and legal AWBI accreditation number.", bullet_style))

    story.append(Paragraph("3. `apps/pets/` — Listings, Photos & PawMatch Algorithm", h2_style))
    story.append(Paragraph("• <code>list_pets()</code>: Multi-criteria filtering (species, breed, age, size, gender, status) and case-insensitive regex search.", bullet_style))
    story.append(Paragraph("• <code>create_pet()</code> & <code>update_pet()</code>: Saves pet data and uploaded photos to disk in <code>backend/media/pets/</code> using <code>MultiPartParser</code>.", bullet_style))
    story.append(Paragraph("• <code>matching.py (PawMatch)</code>: Deterministic 100-point compatibility scoring comparing adopter lifestyle with pet traits (species: 30 pts, living space: 20 pts, activity: 20 pts, age: 15 pts, family safety: 15 pts).", bullet_style))

    story.append(Paragraph("4. `apps/adoptions/` — Complete Adoption Pipeline & Legal Framework", h2_style))
    story.append(Paragraph("• <code>submit_application()</code>: Validates pet availability and <b>blocks duplicate active applications</b> by the same adopter.", bullet_style))
    story.append(Paragraph("• <code>update_application_status()</code>: Moves status: <code>submitted</code> → <code>under_review</code> → <code>approved</code> / <code>rejected</code> and triggers notifications.", bullet_style))
    story.append(Paragraph("• <code>book_visit()</code>: Meet & Greet scheduler for in-person shelter visits or virtual video calls.", bullet_style))
    story.append(Paragraph("• <code>get_adoption_contract()</code> & <code>sign_adoption_contract()</code>: Renders the official legal adoption contract; binds the adopter's digital e-signature, IP address, and timestamp.", bullet_style))
    story.append(Paragraph("• <code>get_adoption_certificate()</code> & <code>verify_adoption_certificate()</code>: Generates an official Certificate of Adoption with a unique verification code (<code>CERT-XXXX</code>) verifiable via public API.", bullet_style))
    story.append(Paragraph("• <code>list_conversations()</code>, <code>get_thread_messages()</code>, <code>send_thread_message()</code>: In-app real-time messaging between shelter and adopter.", bullet_style))

    story.append(Paragraph("5. `apps/admin_portal/` — Super-Admin & Platform KYC", h2_style))
    story.append(Paragraph("• <code>admin_overview()</code>: System-wide metrics (total adopters, shelters, pets adopted, pending verifications).", bullet_style))
    story.append(Paragraph("• <code>admin_update_shelter_status()</code>: Approves or rejects shelter KYC applications based on their government NGO registration.", bullet_style))

    story.append(Paragraph("6. `apps/common/` — Notifications, Favorites & Readiness", h2_style))
    story.append(Paragraph("• <code>list_notifications()</code>: Powers the real-time notification bell.", bullet_style))
    story.append(Paragraph("• <code>toggle_favorite()</code>: Bookmarking system to favorite / unfavorite pets.", bullet_style))
    story.append(Paragraph("• <code>assess_readiness()</code>: Evaluates lifestyle and budget readiness for first-time adopters.", bullet_style))

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 5: SPECIAL TECHNICAL DEEP DIVES
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 8))
    story.append(Paragraph("CHAPTER 5: Special Technical Deep-Dives", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=teal_color, spaceAfter=8, spaceBefore=2))

    story.append(Paragraph("How Google OAuth 2.0 is Implemented:", h2_style))
    story.append(Paragraph("1. <b>Frontend:</b> <code>GoogleAuthButton.jsx</code> renders the Google Sign-In button and receives a signed credential token from Google Identity Services.", bullet_style))
    story.append(Paragraph("2. <b>Backend:</b> <code>apps/accounts/views.py (google_auth_view)</code> calls Google's verification URL: <code>https://oauth2.googleapis.com/tokeninfo?id_token=&lt;credential&gt;</code> to verify authenticity.", bullet_style))
    story.append(Paragraph("3. <b>Role Restriction:</b> Strictly restricted to <b>Adopters</b>. Shelters attempting Google sign-in are rejected with HTTP 403 Forbidden because they require verified legal NGO credentials.", bullet_style))
    story.append(Paragraph("4. <b>Provisioning:</b> Matches existing user or creates a new Adopter document with a 32-character random hashed password, sends a welcome notification, and returns a PawConnect JWT.", bullet_style))

    story.append(Paragraph("How Pet Costs & Budgets are Calculated (`PetCostCalculatorPage.jsx`):", h2_style))
    story.append(Paragraph("Calculates total financial investment to prevent adoption abandonment through unexpected expenses:", body_style))
    story.append(Paragraph("• <b>Monthly Cost:</b> <code>Food (tier scaled) + Grooming (DIY vs Salon) + Preventative Medicine + Monthly Supplies + Emergency Buffer</code>.", bullet_style))
    story.append(Paragraph("• <b>One-Time Setup:</b> <code>Adoption Fee (₹1,000) + Microchip (₹800) + Starter Kit (₹1,800-₹2,600) + Vet Checkup (₹1,200) + Carrier (₹1,200-₹2,200)</code>.", bullet_style))
    story.append(Paragraph("• <b>First-Year Grand Total:</b> <code>One-Time Setup Total + (Monthly Cost × 12)</code>.", bullet_style))

    # ─────────────────────────────────────────────────────────────────────────
    # CHAPTER 6: TOP 15 VIVA QUESTIONS & ANSWERS
    # ─────────────────────────────────────────────────────────────────────────
    story.append(PageBreak())
    story.append(Paragraph("CHAPTER 6: Top 15 Faculty Viva Defense Questions & Spoken Answers", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=teal_color, spaceAfter=8, spaceBefore=2))

    viva_qa = [
        (
            "Q1: What architecture does your backend follow?",
            "Our backend follows a Decoupled RESTful API Architecture using Django REST Framework and MongoDB. The backend serves purely as an API layer delivering JSON data, while the frontend is an independent React 18 Single-Page Application."
        ),
        (
            "Q2: Why did you choose MongoDB with Django instead of SQLite or PostgreSQL?",
            "Animal rescue records are inherently flexible. Pets have varying medical histories, behavioral tags, vaccination cycles, and multiple photo assets. MongoDB's document model avoids rigid migrations and handles dynamic adoption contracts and audit logs with superior read performance."
        ),
        (
            "Q3: How does user authentication work in your application?",
            "We use stateless JWT (JSON Web Tokens). When a user registers or logs in, Django hashes the password with PBKDF2/SHA-256 and issues an HS256-signed JWT token containing the user ID and role. Clients pass this token in the Authorization: Bearer header. Our custom MongoJWTAuthentication class verifies this token on every protected API call."
        ),
        (
            "Q4: How do you enforce Role-Based Access Control (RBAC)?",
            "In config/auth.py, we created custom permission classes: IsAdopter, IsShelter, and IsAdmin. In views.py, endpoints are protected with @permission_classes([IsShelter]). Queries also enforce shelter_id == request.user.id so shelters can never view or modify another shelter's pets or applications."
        ),
        (
            "Q5: How is Google OAuth 2.0 implemented?",
            "The React frontend uses Google Identity Services to obtain an ID token and sends it to /api/auth/google/. Django validates the token server-to-server with Google's tokeninfo API. If authentic, it provisions an Adopter account and issues a PawConnect JWT. We intentionally restrict Google login to Adopters only; Shelters must use verified business accounts with official AWBI documentation."
        ),
        (
            "Q6: How do you solve MongoDB ObjectId serialization in Django REST Framework?",
            "In config/mongodb.py, we wrote a recursive serialize_doc() utility that converts BSON ObjectId into a clean string id, formats Python datetime objects into ISO-8601 strings, and handles nested dictionaries and lists before returning the response."
        ),
        (
            "Q7: What database indexes did you create and why?",
            "In init_db_indexes(), we created: a unique index on users.email to prevent duplicate registrations, a compound unique index on favorites (user_id, pet_id) to eliminate duplicate bookmarks, and indexes on pets.species, status, and shelter_id for high-speed catalog filtering."
        ),
        (
            "Q8: How do you prevent duplicate adoption applications for the same pet?",
            "In submit_application (adoptions/views.py), before inserting a new record, we query MongoDB for an existing application with the same adopter_id and pet_id with status 'submitted' or 'under_review'. If found, Django halts execution and returns HTTP 400 Bad Request."
        ),
        (
            "Q9: How does the PawMatch recommendation algorithm work?",
            "In apps/pets/matching.py, the match_pet() function evaluates compatibility on a 100-point scale: Species preference (30 pts), Living space vs Pet size (20 pts), Activity level (20 pts), Age group (15 pts), and Family safety with kids/other pets (15 pts). It returns a percentage score and matching explanations."
        ),
        (
            "Q10: How are pet image uploads handled?",
            "We use DRF's MultiPartParser. Uploaded image files are safely written to the backend/media/pets/ directory with unique timestamped filenames using Django's default_storage. The resulting relative URL path is saved in the pet's MongoDB document."
        ),
        (
            "Q11: How do digital adoption contracts work legally in your system?",
            "When an application is approved, Django generates a legal adoption agreement. Upon signing, the backend records the user's digital signature, IP address, and UTC timestamp in db.contracts. It then generates an official Certificate of Adoption with a unique verification code verifiable via /api/adoptions/verify-certificate/<cert_number>/."
        ),
        (
            "Q12: What is the purpose of the Singleton pattern in `mongodb.py`?",
            "Creating a new MongoClient on every HTTP request creates socket overhead and exhausts server connections. Our get_db() function implements the Singleton pattern, maintaining a single persistent connection pool shared across all API calls."
        ),
        (
            "Q13: How does the backend communicate with the React frontend?",
            "Over RESTful HTTP endpoints returning JSON. We configure django-cors-headers in settings.py and middleware so the browser allows React (port 5173) to communicate with Django (port 8000) with credentials and Authorization headers."
        ),
        (
            "Q14: How are real-time notifications handled?",
            "Whenever key events occur (application status changes, visit bookings, KYC verification), Django inserts an unread notification document into db.notifications for that user. The frontend polls or fetches /api/notifications/ to update the bell badge in real-time."
        ),
        (
            "Q15: What would you change before deploying to production?",
            "1. Set DEBUG = False and specify exact ALLOWED_HOSTS. 2. Serve Django with a WSGI server like Gunicorn behind an Nginx reverse proxy. 3. Connect MongoDB to a managed replica cluster on MongoDB Atlas. 4. Store uploaded pet photos in AWS S3 or Cloudinary rather than local disk."
        )
    ]

    for q, a in viva_qa:
        story.append(Paragraph(q, qa_q_style))
        story.append(Paragraph(a, qa_a_style))

    # Build primary document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Primary PDF created at: {primary_path}")

    # Copy to additional destinations
    import shutil
    for dest in output_paths[1:]:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        shutil.copy2(primary_path, dest)
        print(f"Copied PDF to: {dest}")

if __name__ == "__main__":
    targets = [
        r"c:\Users\Shubham\DjangoProject\PawConnect_Backend_Architecture_and_Viva_Guide.pdf",
        r"c:\Users\Shubham\DjangoProject\backend\media\PawConnect_Backend_Architecture_and_Viva_Guide.pdf",
        r"c:\Users\Shubham\DjangoProject\frontend\public\PawConnect_Backend_Architecture_and_Viva_Guide.pdf",
    ]
    create_pdf(targets)
