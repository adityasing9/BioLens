"""
BioLens AI - PDF Report Generator
====================================
Generates professional, branded health summary PDFs using ReportLab.
"""

import io
import logging
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    PageBreak,
)
from reportlab.lib import colors
from reportlab.lib.units import inch, mm

logger = logging.getLogger('biolens_pdf')

# ---------------------------------------------------------------------------
# Brand colours
# ---------------------------------------------------------------------------
_BRAND_PRIMARY = colors.HexColor("#1a73e8")       # BioLens blue
_BRAND_DARK = colors.HexColor("#0d47a1")           # Dark blue
_BRAND_LIGHT = colors.HexColor("#e8f0fe")          # Light blue bg
_STATUS_NORMAL = colors.HexColor("#0f9d58")        # Green
_STATUS_ABNORMAL = colors.HexColor("#f4a62a")      # Orange
_STATUS_CRITICAL = colors.HexColor("#d93025")      # Red
_TEXT_DARK = colors.HexColor("#202124")
_TEXT_MUTED = colors.HexColor("#5f6368")


# ---------------------------------------------------------------------------
# Custom styles
# ---------------------------------------------------------------------------
def _build_styles():
    """Create a comprehensive style sheet for the PDF."""
    base = getSampleStyleSheet()

    base.add(ParagraphStyle(
        name="BrandTitle",
        parent=base["Title"],
        fontSize=22,
        textColor=_BRAND_PRIMARY,
        spaceAfter=4,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
    ))
    base.add(ParagraphStyle(
        name="BrandSubtitle",
        parent=base["Normal"],
        fontSize=10,
        textColor=_TEXT_MUTED,
        alignment=TA_CENTER,
        spaceAfter=16,
    ))
    base.add(ParagraphStyle(
        name="SectionHeading",
        parent=base["Heading2"],
        fontSize=14,
        textColor=_BRAND_DARK,
        spaceBefore=16,
        spaceAfter=8,
        fontName="Helvetica-Bold",
        borderWidth=0,
        borderColor=_BRAND_PRIMARY,
        borderPadding=4,
    ))
    base.add(ParagraphStyle(
        name="BodyText2",
        parent=base["Normal"],
        fontSize=10,
        textColor=_TEXT_DARK,
        leading=14,
        alignment=TA_JUSTIFY,
        spaceAfter=6,
    ))
    base.add(ParagraphStyle(
        name="Disclaimer",
        parent=base["Normal"],
        fontSize=8,
        textColor=_TEXT_MUTED,
        leading=10,
        alignment=TA_JUSTIFY,
        spaceBefore=12,
    ))
    base.add(ParagraphStyle(
        name="ScoreDisplay",
        parent=base["Normal"],
        fontSize=36,
        textColor=_BRAND_PRIMARY,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        spaceAfter=4,
    ))
    base.add(ParagraphStyle(
        name="GradeDisplay",
        parent=base["Normal"],
        fontSize=16,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        spaceAfter=12,
    ))
    base.add(ParagraphStyle(
        name="FooterText",
        parent=base["Normal"],
        fontSize=7,
        textColor=_TEXT_MUTED,
        alignment=TA_CENTER,
    ))

    return base


# ---------------------------------------------------------------------------
# Status colour helper
# ---------------------------------------------------------------------------
def _status_color(status: str) -> colors.HexColor:
    """Map a parameter status string to a display colour."""
    status_upper = status.upper() if status else ""
    if status_upper == "NORMAL":
        return _STATUS_NORMAL
    elif status_upper == "CRITICAL":
        return _STATUS_CRITICAL
    else:
        return _STATUS_ABNORMAL


def _grade_color(grade: str) -> colors.HexColor:
    """Map a health grade to a display colour."""
    grade_upper = grade.upper() if grade else ""
    if grade_upper == "EXCELLENT":
        return _STATUS_NORMAL
    elif grade_upper == "GOOD":
        return colors.HexColor("#34a853")
    elif grade_upper == "MODERATE":
        return _STATUS_ABNORMAL
    else:
        return _STATUS_CRITICAL


# ---------------------------------------------------------------------------
# PDF generation
# ---------------------------------------------------------------------------
def generate_report_pdf(report_data: dict) -> bytes:
    """
    Generate a professional health summary PDF.

    Args:
        report_data: Dictionary containing:
            - patient_name (str)
            - report_date (str)
            - parameters (list[dict]): Each with parameter_name, parameter_value,
              unit, reference_range_min, reference_range_max, status.
            - health_score (int)
            - grade (str)
            - risk_predictions (list[dict]): Each with disease_name,
              risk_level, confidence_percentage, details.
            - ai_summary (str)

    Returns:
        The generated PDF as raw bytes.
    """
    buffer = io.BytesIO()
    styles = _build_styles()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=25 * mm,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        title="BioLens AI - Health Report Summary",
        author="BioLens AI Platform",
    )

    elements: list = []

    # ── Header ──────────────────────────────────────────────────────────
    elements.append(Paragraph("BioLens AI", styles["BrandTitle"]))
    elements.append(Paragraph("Health Report Summary", styles["BrandSubtitle"]))
    elements.append(HRFlowable(
        width="100%", thickness=2, color=_BRAND_PRIMARY,
        spaceBefore=2, spaceAfter=12,
    ))

    # ── Patient Info ────────────────────────────────────────────────────
    patient_name = report_data.get("patient_name", "N/A")
    report_date = report_data.get("report_date", "N/A")

    info_data = [
        [
            Paragraph(f"<b>Patient:</b> {patient_name}", styles["BodyText2"]),
            Paragraph(f"<b>Report Date:</b> {report_date}", styles["BodyText2"]),
        ],
    ]
    info_table = Table(info_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
    info_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 8))

    # ── Health Score ────────────────────────────────────────────────────
    elements.append(Paragraph("Health Score", styles["SectionHeading"]))

    score = report_data.get("health_score", 0)
    grade = report_data.get("grade", "N/A")
    grade_col = _grade_color(grade)

    elements.append(Paragraph(f"{score} / 100", styles["ScoreDisplay"]))

    grade_style = ParagraphStyle(
        name="DynamicGrade",
        parent=styles["GradeDisplay"],
        textColor=grade_col,
    )
    elements.append(Paragraph(grade, grade_style))
    elements.append(Spacer(1, 8))

    # ── Parameters Table ────────────────────────────────────────────────
    parameters = report_data.get("parameters", [])
    if parameters:
        elements.append(Paragraph("Lab Parameters", styles["SectionHeading"]))

        # Table header
        header_style = ParagraphStyle(
            name="TableHeader",
            parent=styles["BodyText2"],
            textColor=colors.white,
            fontName="Helvetica-Bold",
            fontSize=9,
        )
        cell_style = ParagraphStyle(
            name="TableCell",
            parent=styles["BodyText2"],
            fontSize=9,
            spaceAfter=0,
        )

        table_data = [[
            Paragraph("Parameter", header_style),
            Paragraph("Value", header_style),
            Paragraph("Unit", header_style),
            Paragraph("Reference Range", header_style),
            Paragraph("Status", header_style),
        ]]

        for p in parameters:
            name = p.get("parameter_name", "")
            value = p.get("parameter_value", "")
            unit = p.get("unit", "")
            rmin = p.get("reference_range_min", "")
            rmax = p.get("reference_range_max", "")
            status = p.get("status", "")
            status_col = _status_color(status)

            status_style = ParagraphStyle(
                name=f"Status_{name}",
                parent=cell_style,
                textColor=status_col,
                fontName="Helvetica-Bold",
            )

            table_data.append([
                Paragraph(str(name), cell_style),
                Paragraph(str(value), cell_style),
                Paragraph(str(unit), cell_style),
                Paragraph(f"{rmin} – {rmax}", cell_style),
                Paragraph(str(status), status_style),
            ])

        col_widths = [
            doc.width * 0.22,
            doc.width * 0.14,
            doc.width * 0.14,
            doc.width * 0.28,
            doc.width * 0.22,
        ]
        param_table = Table(table_data, colWidths=col_widths, repeatRows=1)
        param_table.setStyle(TableStyle([
            # Header row
            ("BACKGROUND", (0, 0), (-1, 0), _BRAND_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            # Alternating row colours
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, _BRAND_LIGHT]),
            # Grid
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dadce0")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(param_table)
        elements.append(Spacer(1, 12))

    # ── Risk Predictions ────────────────────────────────────────────────
    risk_predictions = report_data.get("risk_predictions", [])
    if risk_predictions:
        elements.append(Paragraph("Risk Assessment", styles["SectionHeading"]))

        risk_header_style = ParagraphStyle(
            name="RiskHeader",
            parent=styles["BodyText2"],
            textColor=colors.white,
            fontName="Helvetica-Bold",
            fontSize=9,
        )
        risk_cell_style = ParagraphStyle(
            name="RiskCell",
            parent=styles["BodyText2"],
            fontSize=9,
            spaceAfter=0,
        )

        risk_data = [[
            Paragraph("Disease", risk_header_style),
            Paragraph("Risk Level", risk_header_style),
            Paragraph("Confidence", risk_header_style),
            Paragraph("Details", risk_header_style),
        ]]

        for r in risk_predictions:
            disease = r.get("disease_name", "")
            level = r.get("risk_level", "")
            conf = r.get("confidence_percentage", 0)
            details = r.get("details", "")

            level_col = (
                _STATUS_CRITICAL if level == "HIGH"
                else _STATUS_ABNORMAL if level == "MEDIUM"
                else _STATUS_NORMAL
            )
            level_style = ParagraphStyle(
                name=f"Risk_{disease}",
                parent=risk_cell_style,
                textColor=level_col,
                fontName="Helvetica-Bold",
            )

            risk_data.append([
                Paragraph(str(disease).replace("_", " ").title(), risk_cell_style),
                Paragraph(str(level), level_style),
                Paragraph(f"{conf}%", risk_cell_style),
                Paragraph(str(details)[:120], risk_cell_style),  # Truncate long details
            ])

        risk_col_widths = [
            doc.width * 0.18,
            doc.width * 0.12,
            doc.width * 0.12,
            doc.width * 0.58,
        ]
        risk_table = Table(risk_data, colWidths=risk_col_widths, repeatRows=1)
        risk_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), _BRAND_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, _BRAND_LIGHT]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dadce0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(risk_table)
        elements.append(Spacer(1, 12))

    # ── AI Summary ──────────────────────────────────────────────────────
    ai_summary = report_data.get("ai_summary", "")
    if ai_summary:
        elements.append(Paragraph("AI Health Summary", styles["SectionHeading"]))

        # Convert markdown-style formatting to simple paragraphs
        summary_lines = ai_summary.split("\n")
        for line in summary_lines:
            line = line.strip()
            if not line:
                elements.append(Spacer(1, 4))
            elif line.startswith("##"):
                elements.append(Paragraph(
                    line.lstrip("#").strip(),
                    styles["SectionHeading"],
                ))
            elif line.startswith("- ") or line.startswith("• "):
                elements.append(Paragraph(
                    f"• {line.lstrip('-•').strip()}",
                    styles["BodyText2"],
                ))
            else:
                elements.append(Paragraph(line, styles["BodyText2"]))

        elements.append(Spacer(1, 8))

    # ── Footer / Disclaimer ─────────────────────────────────────────────
    elements.append(HRFlowable(
        width="100%", thickness=1, color=_TEXT_MUTED,
        spaceBefore=16, spaceAfter=8,
    ))

    disclaimer_text = (
        "<b>⚕️ Medical Disclaimer:</b> This report is generated by the BioLens AI "
        "platform and is intended for informational purposes only. It does NOT "
        "constitute medical advice, diagnosis, or treatment. Always consult a "
        "qualified healthcare professional before making any medical decisions. "
        "AI-generated interpretations may contain inaccuracies."
    )
    elements.append(Paragraph(disclaimer_text, styles["Disclaimer"]))

    generation_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    elements.append(Paragraph(
        f"Generated by BioLens AI on {generation_time}",
        styles["FooterText"],
    ))

    # ── Build PDF ───────────────────────────────────────────────────────
    try:
        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        logger.info("PDF report generated successfully (%d bytes).", len(pdf_bytes))
        return pdf_bytes
    except Exception as exc:
        logger.error("PDF generation failed: %s", exc, exc_info=True)
        raise
    finally:
        buffer.close()
