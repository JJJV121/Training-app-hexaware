# docs/generate_pdf.py
import sys
import subprocess
import os

# Step 1: Ensure ReportLab is installed
try:
    import reportlab
except ImportError:
    print("ReportLab library not found. Installing ReportLab...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab"])
        print("ReportLab installed successfully.")
    except Exception as e:
        print(f"Error installing ReportLab: {e}")
        sys.exit(1)

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

# ---------------------------------------------------------
# NumberedCanvas for professional running header and footer
# ---------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
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
        
        # Cover Page has no header/footer
        if self._pageNumber == 1:
            # Draw decorative sidebar background on cover page
            self.setFillColor(colors.HexColor("#0F172A"))
            self.rect(0, 0, 18, 792, fill=1, stroke=0)
            self.setFillColor(colors.HexColor("#2563EB"))
            self.rect(18, 0, 6, 792, fill=1, stroke=0)
            self.restoreState()
            return
            
        # Draw Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0F172A"))
        self.drawString(54, 752, "HEXAWARE LMS PORTAL")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(558, 752, "Trainer Dashboard — Backend Specification")
        
        # Header divider line
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.75)
        self.line(54, 745, 558, 745)
        
        # Draw Footer
        self.line(54, 52, 558, 52)
        self.drawString(54, 40, "CONFIDENTIAL — INTERNAL DEVELOPMENT SPECIFICATION")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 40, page_text)
        
        self.restoreState()


def build_pdf(filename="trainer_dashboard_backend_spec.pdf"):
    # Target page width = 612, height = 792
    # Margin = 54 pt (0.75 in), printable width = 504 pt (7 in)
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=64, # extra padding for running header
        bottomMargin=64 # extra padding for running footer
    )

    styles = getSampleStyleSheet()

    # Define custom Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=28,
        leading=34,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=12
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor('#475569'),
        spaceAfter=50
    )

    meta_label_style = ParagraphStyle(
        'CoverMetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1E293B')
    )
    
    meta_value_style = ParagraphStyle(
        'CoverMetaValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#475569'),
        spaceAfter=6
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=22,
        spaceAfter=10,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'SectionH3',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#334155'),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )

    code_block_style = ParagraphStyle(
        'DocCodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0F172A'),
        backColor=colors.HexColor('#F8FAFC'),
        borderColor=colors.HexColor('#E2E8F0'),
        borderWidth=0.5,
        borderPadding=8,
        spaceAfter=10
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#334155')
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1E293B')
    )

    table_cell_code = ParagraphStyle(
        'TableCellCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor('#0F172A')
    )

    # ---------------------------------------------------------
    # Helper functions
    # ---------------------------------------------------------
    def p(text, style=body_style):
        return Paragraph(text, style)

    def b(text):
        return Paragraph(f"• {text}", bullet_style)

    def cell(text, is_code=False, is_bold=False):
        if is_code:
            return Paragraph(text, table_cell_code)
        elif is_bold:
            return Paragraph(text, table_cell_bold)
        return Paragraph(text, table_cell_style)

    def cell_header(text):
        return Paragraph(text, table_header_style)

    def make_callout(text, title="IMPORTANT NOTICE", type="important"):
        if type == "important":
            border_color = colors.HexColor("#2563EB")
            bg_color = colors.HexColor("#EFF6FF")
        elif type == "warning":
            border_color = colors.HexColor("#D97706")
            bg_color = colors.HexColor("#FEF3C7")
        else: # note
            border_color = colors.HexColor("#64748B")
            bg_color = colors.HexColor("#F8FAFC")
            
        p_text = Paragraph(f"<b>{title}:</b> {text}", body_style)
        t = Table([[p_text]], colWidths=[504])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_color),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LINELEFT', (0,0), (0,-1), 3.5, border_color),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ]))
        return t

    story = []

    # =========================================================
    # COVER PAGE
    # =========================================================
    story.append(Spacer(1, 100))
    story.append(p("HEXAWARE LMS PLATFORM", ParagraphStyle('CoverEyebrow', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=12, textColor=colors.HexColor('#2563EB'), spaceAfter=8)))
    story.append(Paragraph("Trainer Dashboard", title_style))
    story.append(Paragraph("Backend Architectural Specification & API Design", title_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("A comprehensive implementation guide for database schema, model definitions, REST APIs, and UI-to-Backend integration workflows.", subtitle_style))
    
    story.append(Spacer(1, 120))
    
    # Metadata block
    meta_data = [
        [Paragraph("Document Version:", meta_label_style), Paragraph("1.0.0 (Release-Ready)", meta_value_style)],
        [Paragraph("Target Audience:", meta_label_style), Paragraph("Backend & Database Engineering Teams", meta_value_style)],
        [Paragraph("Tech Stack Focus:", meta_label_style), Paragraph("FastAPI, SQLAlchemy ORM, PostgreSQL", meta_value_style)],
        [Paragraph("Author:", meta_label_style), Paragraph("Senior Technical Enablement Architect", meta_value_style)],
        [Paragraph("Date:", meta_label_style), Paragraph("July 2026", meta_value_style)],
    ]
    t_meta = Table(meta_data, colWidths=[110, 394])
    t_meta.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_meta)
    
    story.append(PageBreak())

    # =========================================================
    # TABLE OF CONTENTS / PREFACE
    # =========================================================
    story.append(Paragraph("Table of Contents", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0F172A"), spaceBefore=2, spaceAfter=15))
    
    toc_data = [
        [p("1. Executive Summary & Purpose"), p(". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ."), p("3", ParagraphStyle('R', parent=body_style, alignment=TA_RIGHT))],
        [p("2. System Architecture & Tech Stack"), p(". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ."), p("3", ParagraphStyle('R', parent=body_style, alignment=TA_RIGHT))],
        [p("3. Role-Based Access Control (RBAC)"), p(". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ."), p("4", ParagraphStyle('R', parent=body_style, alignment=TA_RIGHT))],
        [p("4. Database Schema Design (Proposed)"), p(". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ."), p("4", ParagraphStyle('R', parent=body_style, alignment=TA_RIGHT))],
        [p("5. REST API Specifications"), p(". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ."), p("7", ParagraphStyle('R', parent=body_style, alignment=TA_RIGHT))],
        [p("6. Frontend-Backend Integration Workflows"), p(". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ."), p("10", ParagraphStyle('R', parent=body_style, alignment=TA_RIGHT))],
        [p("7. Implementation Checklist & Phases"), p(". . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ."), p("11", ParagraphStyle('R', parent=body_style, alignment=TA_RIGHT))],
    ]
    t_toc = Table(toc_data, colWidths=[180, 294, 30])
    t_toc.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_toc)
    
    story.append(Spacer(1, 30))
    story.append(Paragraph("Document Scope & Intent", h2_style))
    story.append(p("This document serves as the direct technical blueprint for the backend team to build APIs and schema updates matching the newly-implemented frontend Trainer Dashboard. All APIs, field names, response formats, and workflows correspond 1-to-1 with the React components and data grids in the frontend application."))
    
    story.append(PageBreak())

    # =========================================================
    # SECTION 1 & 2
    # =========================================================
    story.append(Paragraph("1. Executive Summary & Purpose", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0F172A"), spaceBefore=2, spaceAfter=10))
    story.append(p("The Hexaware LMS Platform empowers senior trainers to monitor class progress, manage batches, evaluate coding assessments, schedule training sessions, and analyze course performance statistics. While the frontend prototype has been designed with interactive mockups, the backend server requires specific schema expansions and API endpoints to make these features active."))
    story.append(p("By implementing this technical specification, the backend team will enable full data persistence and business logic for the trainer workflow, allowing real-time grading, automated alerts for struggling students, and session tracking."))
    
    story.append(Spacer(1, 15))
    story.append(Paragraph("2. System Architecture & Tech Stack", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0F172A"), spaceBefore=2, spaceAfter=10))
    story.append(p("The project adheres to a standard 3-tier architecture. This backend specification utilizes the existing technologies in the repository:"))
    story.append(b("<b>FastAPI</b>: Modern, high-performance web framework for building Python API services."))
    story.append(b("<b>SQLAlchemy ORM</b>: Object Relational Mapper for PostgreSQL databases using async connection sessions."))
    story.append(b("<b>Alembic</b>: Handles migrations for progressive schema evolution."))
    story.append(b("<b>Pydantic v2</b>: Used for strict request body parsing, payload verification, and response serialization."))
    story.append(b("<b>Uvicorn</b>: Asynchronous Server Gateway Interface (ASGI) running the FastAPI application server."))

    story.append(Spacer(1, 10))
    story.append(make_callout(
        "Ensure all new routes are registered in the main router file (app/main.py) and obey the prefix guidelines (/api/trainer) to maintain consistency with existing client services.",
        title="ARCHITECTURAL COMPLIANCE",
        type="note"
    ))
    
    story.append(PageBreak())

    # =========================================================
    # SECTION 3: RBAC
    # =========================================================
    story.append(Paragraph("3. Role-Based Access Control (RBAC)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0F172A"), spaceBefore=2, spaceAfter=10))
    story.append(p("Currently, the system schema (specifically the <b>users</b> table) does not feature user role segmentation. To secure trainer-only resources, we must define roles and implement authorization middleware."))
    
    story.append(Paragraph("Role Definitions (Enum)", h2_style))
    story.append(p("A Python <b>Enum</b> should be declared to establish user privilege levels in <code>app/models/user.py</code> (or a core types file):"))
    
    code_enum = """import enum

class UserRole(str, enum.Enum):
    TRAINEE = "trainee"
    TRAINER = "trainer"
    ADMIN = "admin"
"""
    story.append(Paragraph(code_enum.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_block_style))
    
    story.append(Paragraph("Authorization Middleware Guidelines", h2_style))
    story.append(p("A dependency function <code>require_role(allowed_roles: List[UserRole])</code> must be added to <code>app/core/security.py</code>. This function will read the JWT payload, query the current authenticated user, and verify if the user's role matches the allowed permissions before resolving the endpoint. Unauthorized attempts must throw an HTTP 403 Forbidden exception."))
    
    story.append(Spacer(1, 15))

    # =========================================================
    # SECTION 4: DATABASE SCHEMA DESIGN
    # =========================================================
    story.append(Paragraph("4. Database Schema Design (Proposed)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0F172A"), spaceBefore=2, spaceAfter=10))
    story.append(p("To support the Trainer Dashboard, several new tables must be added, and the <code>users</code> table updated. Below are the detailed specifications for SQLAlchemy models and database columns."))
    
    story.append(Paragraph("A. Update Model: User (Table: users)", h2_style))
    story.append(p("Add the <code>role</code> column to the <code>users</code> table to map privileges."))
    
    # User Table Schema
    user_fields = [
        [cell_header("Column Name"), cell_header("Type"), cell_header("Constraints"), cell_header("Description")],
        [cell("role", is_bold=True), cell("VARCHAR(50)"), cell("NOT NULL, DEFAULT 'trainee'"), cell("Maps authorization access. Can be 'trainee', 'trainer', or 'admin'.")],
    ]
    t_user = Table(user_fields, colWidths=[110, 90, 130, 174])
    t_user.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
    ]))
    story.append(t_user)

    story.append(Spacer(1, 12))
    story.append(Paragraph("B. New Model: Batch (Table: batches)", h2_style))
    story.append(p("Batches group trainees under a specific trainer and curriculum. Each batch corresponds to a single course."))
    
    batch_fields = [
        [cell_header("Column Name"), cell_header("Type"), cell_header("Constraints"), cell_header("Description")],
        [cell("id", is_bold=True), cell("INTEGER"), cell("PRIMARY KEY, AUTOINCREMENT"), cell("Primary Key identifier")],
        [cell("name", is_bold=True), cell("VARCHAR(255)"), cell("NOT NULL, UNIQUE"), cell("Cohort label e.g., 'Batch 2026 — Java Full-Stack'")],
        [cell("course_id", is_bold=True), cell("INTEGER"), cell("FOREIGN KEY (courses.id), NOT NULL"), cell("Associated course curriculum")],
        [cell("trainer_id", is_bold=True), cell("INTEGER"), cell("FOREIGN KEY (users.id), NOT NULL"), cell("Trainer user in charge of cohort")],
        [cell("start_date", is_bold=True), cell("DATE"), cell("NULLABLE"), cell("Official commencement date")],
        [cell("end_date", is_bold=True), cell("DATE"), cell("NULLABLE"), cell("Official conclusion date")],
        [cell("is_active", is_bold=True), cell("BOOLEAN"), cell("NOT NULL, DEFAULT TRUE"), cell("Indicates if the batch is current")],
        [cell("created_at", is_bold=True), cell("TIMESTAMP"), cell("NOT NULL, DEFAULT NOW()"), cell("Record creation timestamp")],
    ]
    t_batch = Table(batch_fields, colWidths=[110, 90, 130, 174])
    t_batch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    story.append(t_batch)

    story.append(PageBreak())

    # Cont. Schema Models
    story.append(Paragraph("C. New Association Model: BatchTrainee (Table: batch_trainees)", h2_style))
    story.append(p("Associative link mapping users (trainees) to specific training cohorts."))
    
    assoc_fields = [
        [cell_header("Column Name"), cell_header("Type"), cell_header("Constraints"), cell_header("Description")],
        [cell("batch_id", is_bold=True), cell("INTEGER"), cell("PRIMARY KEY, FK(batches.id)"), cell("Target Batch ID")],
        [cell("trainee_id", is_bold=True), cell("INTEGER"), cell("PRIMARY KEY, FK(users.id)"), cell("Target Trainee User ID")],
        [cell("joined_at", is_bold=True), cell("TIMESTAMP"), cell("NOT NULL, DEFAULT NOW()"), cell("Trainee insertion timestamp")],
    ]
    t_assoc = Table(assoc_fields, colWidths=[110, 90, 130, 174])
    t_assoc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    story.append(t_assoc)

    story.append(Spacer(1, 10))
    story.append(Paragraph("D. New Model: Assignment (Table: assignments)", h2_style))
    story.append(p("Specifies curriculum grading items (tasks, coding labs, quizzes) posted in a course."))
    
    assign_fields = [
        [cell_header("Column Name"), cell_header("Type"), cell_header("Constraints"), cell_header("Description")],
        [cell("id", is_bold=True), cell("INTEGER"), cell("PRIMARY KEY, AUTOINCREMENT"), cell("Primary Key")],
        [cell("title", is_bold=True), cell("VARCHAR(255)"), cell("NOT NULL"), cell("Name e.g., 'Assignment 3 — Exception Handling'")],
        [cell("description", is_bold=True), cell("TEXT"), cell("NULLABLE"), cell("Detailed specifications and instructions")],
        [cell("module_name", is_bold=True), cell("VARCHAR(255)"), cell("NOT NULL"), cell("Associated course section e.g. 'Core Java'")],
        [cell("course_id", is_bold=True), cell("INTEGER"), cell("FOREIGN KEY (courses.id)"), cell("Curriculum assignment belongs to")],
        [cell("max_score", is_bold=True), cell("INTEGER"), cell("NOT NULL, DEFAULT 100"), cell("Maximum achievable evaluation score")],
        [cell("created_at", is_bold=True), cell("TIMESTAMP"), cell("NOT NULL, DEFAULT NOW()"), cell("Creation date")],
    ]
    t_assign = Table(assign_fields, colWidths=[110, 90, 130, 174])
    t_assign.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    story.append(t_assign)

    story.append(Spacer(1, 10))
    story.append(Paragraph("E. New Model: Submission (Table: submissions)", h2_style))
    story.append(p("Stores raw trainee code/text responses, submission states, scores, and grading notes."))
    
    sub_fields = [
        [cell_header("Column Name"), cell_header("Type"), cell_header("Constraints"), cell_header("Description")],
        [cell("id", is_bold=True), cell("INTEGER"), cell("PRIMARY KEY, AUTOINCREMENT"), cell("Primary Key")],
        [cell("trainee_id", is_bold=True), cell("INTEGER"), cell("FOREIGN KEY (users.id)"), cell("Submitting trainee ID")],
        [cell("assignment_id", is_bold=True), cell("INTEGER"), cell("FOREIGN KEY (assignments.id)"), cell("Associated assignment ID")],
        [cell("submitted_code", is_bold=True), cell("TEXT"), cell("NOT NULL"), cell("Coding response or text answers")],
        [cell("submitted_at", is_bold=True), cell("TIMESTAMP"), cell("NOT NULL, DEFAULT NOW()"), cell("Submission timestamp")],
        [cell("status", is_bold=True), cell("VARCHAR(50)"), cell("NOT NULL, DEFAULT 'PENDING'"), cell("Submission status: 'PENDING' or 'GRADED'")],
        [cell("score", is_bold=True), cell("INTEGER"), cell("NULLABLE"), cell("Assessed grade (0 to 100)")],
        [cell("feedback", is_bold=True), cell("TEXT"), cell("NULLABLE"), cell("Trainer code-level review feedback")],
        [cell("graded_by", is_bold=True), cell("INTEGER"), cell("FOREIGN KEY (users.id), NULLABLE"), cell("Evaluating Trainer User ID")],
        [cell("graded_at", is_bold=True), cell("TIMESTAMP"), cell("NULLABLE"), cell("Evaluation completion time")],
    ]
    t_sub = Table(sub_fields, colWidths=[110, 90, 130, 174])
    t_sub.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    story.append(t_sub)

    story.append(PageBreak())

    # Cont. Schema Models
    story.append(Paragraph("F. New Model: LiveSession (Table: live_sessions)", h2_style))
    story.append(p("Manages trainer-led training, lab interactive classes, and webinars."))
    
    session_fields = [
        [cell_header("Column Name"), cell_header("Type"), cell_header("Constraints"), cell_header("Description")],
        [cell("id", is_bold=True), cell("INTEGER"), cell("PRIMARY KEY, AUTOINCREMENT"), cell("Primary Key")],
        [cell("title", is_bold=True), cell("VARCHAR(255)"), cell("NOT NULL"), cell("Lecture/Workshop topic label")],
        [cell("description", is_bold=True), cell("TEXT"), cell("NULLABLE"), cell("Syllabus details or prep instructions")],
        [cell("session_type", is_bold=True), cell("VARCHAR(50)"), cell("NOT NULL"), cell("Can be 'LIVE_SESSION', 'WORKSHOP', or 'REVISION'")],
        [cell("batch_id", is_bold=True), cell("INTEGER"), cell("FOREIGN KEY (batches.id)"), cell("Target trainee cohort")],
        [cell("trainer_id", is_bold=True), cell("INTEGER"), cell("FOREIGN KEY (users.id)"), cell("Host trainer user ID")],
        [cell("start_time", is_bold=True), cell("TIMESTAMP"), cell("NOT NULL"), cell("Target execution start time")],
        [cell("end_time", is_bold=True), cell("TIMESTAMP"), cell("NOT NULL"), cell("Target execution end time")],
        [cell("meeting_link", is_bold=True), cell("VARCHAR(1000)"), cell("NULLABLE"), cell("Virtual classroom URL e.g. Teams, WebEx")],
        [cell("created_at", is_bold=True), cell("TIMESTAMP"), cell("NOT NULL, DEFAULT NOW()"), cell("Session insertion timestamp")],
    ]
    t_sess = Table(session_fields, colWidths=[110, 90, 130, 174])
    t_sess.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    story.append(t_sess)

    story.append(Spacer(1, 10))
    story.append(Paragraph("G. New Model: AttendanceRecord (Table: attendance_records)", h2_style))
    story.append(p("Tracks individual attendance indicators for scheduled live classes."))
    
    att_fields = [
        [cell_header("Column Name"), cell_header("Type"), cell_header("Constraints"), cell_header("Description")],
        [cell("id", is_bold=True), cell("INTEGER"), cell("PRIMARY KEY, AUTOINCREMENT"), cell("Primary Key")],
        [cell("trainee_id", is_bold=True), cell("INTEGER"), cell("FOREIGN KEY (users.id)"), cell("Target student user ID")],
        [cell("session_id", is_bold=True), cell("INTEGER"), cell("FOREIGN KEY (live_sessions.id)"), cell("Scheduled session reference")],
        [cell("status", is_bold=True), cell("VARCHAR(50)"), cell("NOT NULL"), cell("Attendance: 'PRESENT', 'ABSENT', or 'LATE'")],
        [cell("marked_at", is_bold=True), cell("TIMESTAMP"), cell("NOT NULL, DEFAULT NOW()"), cell("Trainee mark registration timestamp")],
    ]
    t_att = Table(att_fields, colWidths=[110, 90, 130, 174])
    t_att.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
    ]))
    story.append(t_att)

    story.append(Spacer(1, 12))
    story.append(make_callout(
        "Alembic migrations must be generated sequentially. Make sure to back up test data prior to running the upgrade script in the staging environment.",
        title="DATABASE MIGRATION WARNING",
        type="warning"
    ))

    story.append(PageBreak())

    # =========================================================
    # SECTION 5: REST API SPECIFICATIONS
    # =========================================================
    story.append(Paragraph("5. REST API Specifications", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0F172A"), spaceBefore=2, spaceAfter=10))
    story.append(p("The backend must implement the following REST endpoints to serve data to the dashboard and handle updates. All routes are protected by the RBAC middleware and require a valid Bearer token."))

    # Endpoint spec helper function
    def add_endpoint_table(method_path, desc, req_body, resp_schema):
        data = [
            [cell_header("Attribute"), cell_header("Details")],
            [cell("Method / Path", is_bold=True), cell(method_path, is_code=True)],
            [cell("Description", is_bold=True), cell(desc)],
            [cell("Request Payload", is_bold=True), cell(req_body, is_code=True)],
            [cell("Response Schema", is_bold=True), cell(resp_schema, is_code=True)],
        ]
        t = Table(data, colWidths=[120, 384])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
        ]))
        return t

    story.append(Paragraph("A. Module 1: Dashboard Overview Metrics", h2_style))
    story.append(p("Aggregates key statistics, live session countdown, and scheduled calendars for the current trainer."))
    
    t_api1 = add_endpoint_table(
        "GET /api/trainer/overview",
        "Gathers aggregate summary statistics for the dashboard homepage including trainee count, active cohorts, assignments pending grading, the closest upcoming session, and lists the 4 nearest upcoming classes.",
        "None (JWT authenticated)",
        """{
  "totalTrainees": 48,
  "activeBatches": 3,
  "pendingGrades": 7,
  "nextSessionISO": "2026-07-13T10:00:00Z",
  "upcomingSessions": [
    {
      "id": "s1",
      "title": "Core Java — OOP Fundamentals",
      "type": "Live Session",
      "batch": "Batch 2026 - Java Full-Stack",
      "date": "Mon, 07 Jul 2026",
      "time": "10:00 AM – 11:30 AM",
      "colorClass": "session-blue",
      "icon": "video"
    }
  ]
}"""
    )
    story.append(t_api1)
    
    story.append(Spacer(1, 15))
    story.append(Paragraph("B. Module 2: Batch & Trainee Management", h2_style))
    story.append(p("Allows a trainer to view details of their assigned student cohorts and trainee performance indicators."))

    t_api2 = add_endpoint_table(
        "GET /api/trainer/batches",
        "Retrieves a lists of all batches / courses assigned to the logged-in trainer.",
        "None (JWT authenticated)",
        """[
  {
    "id": "batch-java",
    "label": "Batch 2026 — Java Full-Stack",
    "course": "Core Java Full-Stack",
    "traineeCount": 6
  }
]"""
    )
    story.append(t_api2)
    
    story.append(Spacer(1, 12))
    story.append(PageBreak())

    # Cont API Specs
    story.append(p("Fetch specific batch student progress reports."))
    t_api3 = add_endpoint_table(
        "GET /api/trainer/batches/{batch_id}/trainees",
        "Fetches a list of all trainees registered inside a specific batch, complete with academic progress percentage, attendance percentages, and curriculum status tags.",
        "Query params: none. Path parameter: batch_id",
        """[
  {
    "id": "t1",
    "name": "Ananya Sharma",
    "email": "ananya.sharma@hexaware.com",
    "employeeId": "HEX-E-1021",
    "initials": "AS",
    "color": "#3563e9",
    "progressLabel": "Core Java",
    "progressPct": 78,
    "attendancePct": 94,
    "status": "On Track"
  }
]"""
    )
    story.append(t_api3)

    story.append(Spacer(1, 15))
    story.append(Paragraph("C. Module 3: Grading Queue & Assessment Hub", h2_style))
    story.append(p("Handles code evaluation queue and grading responses submission."))

    t_api4 = add_endpoint_table(
        "GET /api/trainer/grading-queue",
        "Fetches assignments that have been submitted by trainees in the trainer's batches and are pending assessment. Includes the raw submitted code or text answers.",
        "None (JWT authenticated)",
        """[
  {
    "id": "g1",
    "traineeName": "Rohan Mehta",
    "employeeId": "HEX-E-1034",
    "initials": "RM",
    "color": "#10B981",
    "module": "Core Java",
    "taskTitle": "Assignment 3 — Exception Handling",
    "submittedDate": "04 Jul 2026",
    "submittedCode": "public class BankAccount { ... }"
  }
]"""
    )
    story.append(t_api4)
    
    story.append(Spacer(1, 12))
    story.append(PageBreak())

    # Cont API Specs
    story.append(p("Submit grading evaluation payload."))
    t_api5 = add_endpoint_table(
        "POST /api/trainer/submissions/{submission_id}/grade",
        "Submits assessment metrics (numeric score out of 100, written qualitative feedback) to evaluate and close a pending task queue item.",
        """{
  "score": 85,
  "feedback": "Outstanding implementation of custom bank exception cases."
}""",
        """{
  "status": "success",
  "message": "Grade logged successfully.",
  "gradedAt": "2026-07-06T15:55:00Z"
}"""
    )
    story.append(t_api5)

    story.append(Spacer(1, 15))
    story.append(Paragraph("D. Module 4: Session Scheduler", h2_style))
    story.append(p("Enables scheduling and deletion of live lectures and virtual classes."))

    t_api6 = add_endpoint_table(
        "POST /api/trainer/sessions",
        "Creates a new lecture, workshop, or revision session for a specific trainee batch.",
        """{
  "title": "Docker Containers Basics",
  "sessionType": "LIVE_SESSION",
  "batchId": "batch-cloud",
  "startTime": "2026-07-10T15:00:00Z",
  "endTime": "2026-07-10T17:00:00Z",
  "meetingLink": "https://teams.microsoft.com/..."
}""",
        """{
  "id": "s5",
  "title": "Docker Containers Basics",
  "sessionType": "LIVE_SESSION",
  "batchId": "batch-cloud",
  "startTime": "2026-07-10T15:00:00Z",
  "endTime": "2026-07-10T17:00:00Z",
  "meetingLink": "https://teams.microsoft.com/..."
}"""
    )
    story.append(t_api6)

    story.append(Spacer(1, 15))
    story.append(PageBreak())

    # Cont API Specs
    story.append(Paragraph("E. Module 5: Performance Analytics", h2_style))
    story.append(p("Provides average class progress grades and triggers alerts for lagging concept areas."))

    t_api7 = add_endpoint_table(
        "GET /api/trainer/analytics/modules?batch_id={batch_id}",
        "Returns the average score of all trainees in the specified batch, broken down by course module, to draw bar charts.",
        "Query parameter: batch_id (string)",
        """[
  { "id": "pm1", "name": "Java Basics & Syntax", "avgScore": 82 },
  { "id": "pm2", "name": "OOP Fundamentals", "avgScore": 74 },
  { "id": "pm3", "name": "Exception Handling", "avgScore": 68 },
  { "id": "pm4", "name": "Collections Framework", "avgScore": 61 }
]"""
    )
    story.append(t_api7)

    story.append(Spacer(1, 15))
    story.append(p("Fetch diagnosis analytics alerts."))
    t_api8 = add_endpoint_table(
        "GET /api/trainer/analytics/alerts?batch_id={batch_id}",
        "Identifies weak course areas by scanning for modules with average scores under the 65% benchmark.",
        "Query parameter: batch_id (string)",
        """[
  {
    "id": "pm4",
    "name": "Collections Framework",
    "avgScore": 61,
    "alertType": "WEAKNESS_IDENTIFIED",
    "recommendation": "Review sessions recommended"
  }
]"""
    )
    story.append(t_api8)

    story.append(PageBreak())

    # =========================================================
    # SECTION 6: FRONTEND-BACKEND WORKFLOWS
    # =========================================================
    story.append(Paragraph("6. Frontend-Backend Integration Workflows", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0F172A"), spaceBefore=2, spaceAfter=10))
    story.append(p("To ensure a smooth transition from static screens to backend-driven workflows, developers should implement integration steps for key features as outlined below."))
    
    story.append(Paragraph("A. Real-Time Countdown for Next Session", h2_style))
    story.append(p("The dashboard features a live countdown ticker showing the hours, minutes, and seconds until the next session starts. The logic is handled as follows:"))
    story.append(b("The backend exposes `nextSessionISO` (e.g. `2026-07-13T10:00:00.000Z`) inside the `GET /api/trainer/overview` response payload."))
    story.append(b("The React frontend (in `TrainerOverview.jsx`) sets up a 1-second interval counter."))
    story.append(b("On each tick, the current client datetime is subtracted from the backend-provided ISO string."))
    story.append(b("If the difference is greater than zero, the components displays formatted `HH:MM:SS` hours, minutes, and seconds remaining."))
    story.append(b("If the counter falls below zero, the UI updates its state to display 'Session in progress / ended' and the ticking loop stops."))

    story.append(Spacer(1, 10))
    story.append(Paragraph("B. Grading Submission Pipeline", h2_style))
    story.append(p("When evaluating trainee code assignments, the following synchronization process occurs between client and server:"))
    story.append(b("Trainer navigates to the 'Grading Queue' tab. The UI calls `GET /api/trainer/grading-queue` and populates the left panel list."))
    story.append(b("Trainer clicks a student's card. The React state caches the selection and opens the assessment review panel on the right, rendering the code syntax."))
    story.append(b("Trainer enters a score (0-100) and writes detailed code feedback in the form controls, then clicks 'Submit Assessment'."))
    story.append(b("The frontend sends a `POST` request to `/api/trainer/submissions/{submission_id}/grade` carrying the score and feedback payload."))
    story.append(b("On a successful HTTP 200 OK server response, the React client removes the graded item from its state list, clears selection fields, and decrement the aggregate global counter by 1. No full page reload is triggered."))

    story.append(Spacer(1, 10))
    story.append(Paragraph("C. Diagnostic Analytics Refresh", h2_style))
    story.append(p("The Performance Analytics visualizer updates dynamically when switching courses:"))
    story.append(b("When the dashboard loads, the frontend calls the modules API with the default batch ID ('java')."))
    story.append(b("The server executes an aggregate SQL query: it finds all graded submissions in that batch, filters by assignment module, and averages the scores. It returns the list to the client."))
    story.append(b("Simultaneously, the frontend calls the alerts API to fetch struggling concepts (averages < 65%)."))
    story.append(b("When the trainer changes the dropdown to 'Cloud Architecture', a React `onChange` handler updates the `selectedBatch` state. This triggers dual API calls with the new batch ID, refreshing the graphical bar chart and diagnostic sidebar instantly."))

    story.append(PageBreak())

    # =========================================================
    # SECTION 7: CHECKLIST
    # =========================================================
    story.append(Paragraph("7. Implementation Checklist & Phases", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0F172A"), spaceBefore=2, spaceAfter=10))
    story.append(p("To ensure structured development, backend implementation is divided into three consecutive phases. Progress can be validated against the criteria listed below."))

    story.append(Paragraph("Phase 1: Database Migration & Schema Setup", h2_style))
    story.append(b("Define `UserRole` enum and add `role` column to `User` model (`app/models/user.py`)."))
    story.append(b("Create new SQLAlchemy models for `Batch`, `BatchTrainee`, `Assignment`, `Submission`, `LiveSession`, and `AttendanceRecord`."))
    story.append(b("Generate Alembic migration script using: <code>alembic revision --autogenerate -m \"add_trainer_models\"</code>."))
    story.append(b("Run migrations against Postgres testing server and inspect created tables to confirm foreign keys and cascade rules."))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Phase 2: Authorization & Router Integration", h2_style))
    story.append(b("Create JWT role extraction logic in security helpers."))
    story.append(b("Set up router prefixes and route definitions inside `app/routers/trainer.py`."))
    story.append(b("Apply authorization dependency: <code>Depends(require_role([UserRole.TRAINER, UserRole.ADMIN]))</code> globally on the trainer router."))
    story.append(b("Register the new trainer router in `app/main.py` under the `/api/trainer` prefix path."))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Phase 3: Core API Endpoints & Business Logic", h2_style))
    story.append(b("Write repository queries for trainer overview stats (aggregated user, batch, and pending sub counts)."))
    story.append(b("Implement the grading submission endpoint, adding transaction handling to update submission rows and log status."))
    story.append(b("Build the session creation route and connect validation checks to ensure sessions do not double-book a trainer's calendar."))
    story.append(b("Develop analytics endpoints using SQLAlchemy grouping/averaging clauses to pull average module performance."))

    story.append(Spacer(1, 15))
    story.append(make_callout(
        "For manual integration verification, developers can run the server locally, authenticate with a trainer user profile, and query endpoints using the interactive Swagger UI at <code>http://localhost:8000/docs</code>.",
        title="VERIFICATION TIP",
        type="note"
    ))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Documentation PDF compiled successfully: {filename}")


if __name__ == "__main__":
    out_path = os.path.join("docs", "trainer_dashboard_backend_spec.pdf") if os.path.isdir("docs") else "trainer_dashboard_backend_spec.pdf"
    build_pdf(out_path)
