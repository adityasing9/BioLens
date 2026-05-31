import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib import colors
from reportlab.lib.units import inch

def create_sample_report():
    pdf_path = "jane_doe_lab_report.pdf"
    
    # Setup document
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        name='DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#0A3F59'),
        alignment=0, # Left
        spaceAfter=15
    )
    
    section_style = ParagraphStyle(
        name='SecTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#18778C'),
        spaceBefore=15,
        spaceAfter=10
    )
    
    label_style = ParagraphStyle(
        name='LabelText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor('#4C7687')
    )
    
    value_style = ParagraphStyle(
        name='ValueText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#175B70')
    )
    
    cell_style = ParagraphStyle(
        name='GridText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#4C7687')
    )
    
    cell_bold_style = ParagraphStyle(
        name='GridBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor('#0A3F59')
    )

    cell_high_style = ParagraphStyle(
        name='GridHigh',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor('#E26D6D')
    )

    cell_low_style = ParagraphStyle(
        name='GridLow',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor('#E5B64E')
    )

    elements = []
    
    # Document Header
    elements.append(Paragraph("METROPOLIS DIAGNOSTIC LABS", title_style))
    elements.append(Paragraph("Clinical Laboratory Report Ingestion System Test", value_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#ABCFD6'), spaceAfter=15))
    
    # Patient Demographics block
    demo_data = [
        [Paragraph("Patient Name:", label_style), Paragraph("Jane Doe", value_style), Paragraph("Report Date:", label_style), Paragraph(datetime.now().strftime("%Y-%m-%d"), value_style)],
        [Paragraph("Age / Gender:", label_style), Paragraph("36 Years / Female", value_style), Paragraph("Patient ID:", label_style), Paragraph("PT-99482-12", value_style)],
        [Paragraph("Referred By:", label_style), Paragraph("Dr. Alex Merced", value_style), Paragraph("Specimen:", label_style), Paragraph("Whole Blood / Serum", value_style)]
    ]
    
    demo_table = Table(demo_data, colWidths=[100, 160, 100, 160])
    demo_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F2FAFB')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#DDEEEF')),
        ('INNERGRID', (0,0), (-1,-1), 0.25, colors.HexColor('#DDEEEF')),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    
    elements.append(demo_table)
    elements.append(Spacer(1, 15))
    
    # Blood Test Parameters table
    elements.append(Paragraph("HAEMATOLOGY & METABOLIC TEST PANEL", section_style))
    
    # Headers
    table_data = [[
        Paragraph("Test Name", label_style),
        Paragraph("Observed Value", label_style),
        Paragraph("Unit", label_style),
        Paragraph("Reference Interval", label_style),
        Paragraph("Flag / Status", label_style)
    ]]
    
    # Values
    parameters = [
        ("Hemoglobin", "10.4", "g/dL", "12.0 - 16.0", "LOW"),
        ("RBC count", "3.8", "M/uL", "4.0 - 5.2", "LOW"),
        ("WBC count", "10.8", "k/uL", "4.5 - 11.0", "NORMAL"),
        ("Platelets", "245", "k/uL", "150 - 450", "NORMAL"),
        ("HbA1c", "6.7", "%", "4.0 - 5.6", "HIGH"),
        ("Fasting Blood Sugar", "138", "mg/dL", "70 - 100", "HIGH"),
        ("TSH (Thyroid)", "5.4", "uIU/mL", "0.4 - 4.0", "HIGH"),
        ("T3 (Thyroid)", "0.72", "ng/mL", "0.8 - 2.0", "LOW"),
        ("T4 (Thyroid)", "0.82", "ng/dL", "0.9 - 1.7", "LOW"),
        ("LDL Cholesterol", "162", "mg/dL", "0 - 130", "HIGH"),
        ("HDL Cholesterol", "39", "mg/dL", "40 - 60", "LOW"),
        ("Triglycerides", "175", "mg/dL", "0 - 150", "HIGH")
    ]
    
    for name, val, unit, range_str, status in parameters:
        if status == "LOW":
            status_p = Paragraph(status, cell_low_style)
        elif status == "HIGH":
            status_p = Paragraph(status, cell_high_style)
        else:
            status_p = Paragraph(status, cell_style)
            
        table_data.append([
            Paragraph(name, cell_bold_style),
            Paragraph(val, cell_bold_style),
            Paragraph(unit, cell_style),
            Paragraph(range_str, cell_style),
            status_p
        ])
        
    param_table = Table(table_data, colWidths=[160, 100, 70, 110, 80])
    param_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#DDEEEF')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#DDEEEF')),
        ('INNERGRID', (0,0), (-1,-1), 0.25, colors.HexColor('#DDEEEF')),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    
    elements.append(param_table)
    elements.append(Spacer(1, 20))
    
    # Footer disclaimer
    disclaimer_text = (
        "<b>Note:</b> This is a simulated clinical report generated strictly for test and "
        "verification purposes on the BioLens AI platform. It contains sample deviations (mild anemia "
        "indicated by Hemoglobin 10.4, pre-diabetes by HbA1c 6.7, and hypothyroidism by TSH 5.4) to "
        "evaluate OCR table recognition and RAG summarization correctness."
    )
    elements.append(Paragraph(disclaimer_text, value_style))
    
    doc.build(elements)
    print(f"Sample report PDF created successfully at: {os.path.abspath(pdf_path)}")

if __name__ == "__main__":
    create_sample_report()
