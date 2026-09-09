"""
PDF Export Generator for FitPlaner Shopping List.
Creates a professional, multi-page printable A4 PDF document with checkboxes,
store separations, walkway aisles, pantry coverage, and budget summaries.
"""

import io
from datetime import datetime
from typing import List
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from backend.models import ShoppingList, ShoppingItem


class NumberedCanvas(canvas.Canvas):
    """Custom canvas that adds page numbers and footer to all pages."""
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

    def draw_page_decorations(self, page_count: int):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Footer line
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(1.5 * cm, 1.3 * cm, A4[0] - 1.5 * cm, 1.3 * cm)

        # Footer text
        footer_text = f"FitPlaner • Deine intelligente & sparsame Einkaufsliste • Seite {self._pageNumber} von {page_count}"
        self.drawString(1.5 * cm, 0.9 * cm, footer_text)

        now_str = datetime.now().strftime("%d.%m.%Y %H:%M")
        self.drawRightString(A4[0] - 1.5 * cm, 0.9 * cm, f"Erstellt: {now_str}")
        self.restoreState()


def generate_shopping_list_pdf(shopping_list: ShoppingList) -> bytes:
    """
    Renders the complete shopping list into a downloadable PDF binary.
    """
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=2.0 * cm
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=2,
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=12,
    )

    h2_style = ParagraphStyle(
        'StoreH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.white,
    )

    item_name_style = ParagraphStyle(
        'ItemName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor("#1e293b"),
    )

    item_sub_style = ParagraphStyle(
        'ItemSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor("#64748b"),
    )

    item_done_style = ParagraphStyle(
        'ItemDone',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#059669"),
    )

    story = []

    # 1. HEADER BANNER
    header_data = [
        [
            Paragraph("🛒 FitPlaner", title_style),
            Paragraph(f"<b>Woche:</b> {shopping_list.week_label or 'Aktuelle Woche'}", ParagraphStyle(
                'WeekBadge', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, alignment=2, textColor=colors.HexColor("#0f172a")
            ))
        ],
        [
            Paragraph("Gedruckte Einkaufsliste mit Filialtrennung & Vorratsabgleich", subtitle_style),
            Paragraph(f"Status: {shopping_list.budget_status.upper()}", ParagraphStyle(
                'StatusBadge', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, alignment=2,
                textColor=colors.HexColor("#059669") if shopping_list.budget_status == "ok" else colors.HexColor("#dc2626")
            ))
        ]
    ]

    header_table = Table(header_data, colWidths=[11.5 * cm, 6.5 * cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=4, spaceAfter=8))

    # 2. KPI SUMMARY BAR
    kpi_data = [
        [
            Paragraph("<b>Geschätzter Einkauf:</b>", item_sub_style),
            Paragraph("<b>Geplantes Budget:</b>", item_sub_style),
            Paragraph("<b>Aktions-Ersparnis:</b>", item_sub_style),
            Paragraph("<b>Im Vorrat gespart:</b>", item_sub_style),
        ],
        [
            Paragraph(f"<b>{shopping_list.total_price:.2f} €</b>", ParagraphStyle('Kpi1', fontName='Helvetica-Bold', fontSize=13, textColor=colors.HexColor("#0f172a"))),
            Paragraph(f"<b>{shopping_list.budget:.2f} €</b>", ParagraphStyle('Kpi2', fontName='Helvetica-Bold', fontSize=13, textColor=colors.HexColor("#334155"))),
            Paragraph(f"<b>~{shopping_list.total_savings:.2f} €</b>", ParagraphStyle('Kpi3', fontName='Helvetica-Bold', fontSize=13, textColor=colors.HexColor("#059669"))),
            Paragraph(f"<b>~{shopping_list.covered_by_stock_savings:.2f} €</b>", ParagraphStyle('Kpi4', fontName='Helvetica-Bold', fontSize=13, textColor=colors.HexColor("#0284c7"))),
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[4.5 * cm, 4.5 * cm, 4.5 * cm, 4.5 * cm])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 12))

    # 3. HELPER TO RENDER STORE TABLE
    store_configs = [
        ("Netto Marken-Discount", shopping_list.items_netto, "#d97706"),  # Amber
        ("NP Discount", shopping_list.items_np, "#dc2626"),               # Red
        ("Lidl", shopping_list.items_lidl or [], "#2563eb"),              # Blue
        ("Aldi (Nord & Süd)", shopping_list.items_aldi or [], "#0284c7"), # Cyan
        ("Rewe Dein Markt", shopping_list.items_rewe or [], "#b91c1c"),   # Dark Red
        ("Kaufland", shopping_list.items_kaufland or [], "#991b1b"),      # Deep Red
        ("Edeka", shopping_list.items_edeka or [], "#eab308"),            # Yellow
        ("Vorratskammer & Basics", shopping_list.items_pantry, "#475569"), # Slate
    ]

    for store_name, items, header_hex in store_configs:
        if not items:
            continue

        store_elements = []

        # Store Section Header
        head_data = [[
            Paragraph(f"<b>[ ] {store_name.upper()} ({len(items)} Artikel)</b>", h2_style)
        ]]
        head_table = Table(head_data, colWidths=[18.0 * cm])
        head_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(header_hex)),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        store_elements.append(head_table)

        # Table rows for items
        rows = [
            [
                Paragraph("<b>Check</b>", item_sub_style),
                Paragraph("<b>Artikel & Laufweg-Zone</b>", item_sub_style),
                Paragraph("<b>Bedarf / Packungen</b>", item_sub_style),
                Paragraph("<b>Status / Preis</b>", item_sub_style),
            ]
        ]

        for item in items:
            check_box = Paragraph("[  ]", ParagraphStyle('Cb', fontName='Helvetica-Bold', fontSize=11, textColor=colors.HexColor("#475569")))

            # Item details
            aisle_text = item.aisle or "Standard-Sortiment"
            name_p = Paragraph(f"<b>{item.name}</b><br/><font color='#64748b' size='7'>{item.category} • {aisle_text}</font>", item_name_style)

            # Amount / Packs
            if item.is_covered_by_stock:
                qty_p = Paragraph(f"{item.total_quantity} {item.unit}<br/><font color='#059669' size='7'>Vorratskammer</font>", item_sub_style)
                status_p = Paragraph(f"<font color='#059669'><b>Vorhanden ({item.in_stock_quantity} {item.unit})</b></font>", item_done_style)
            else:
                packs_info = f"{item.packs_to_buy}x Packung" if item.pack_size else f"{item.net_need_quantity} {item.unit}"
                qty_p = Paragraph(f"<b>{packs_info}</b><br/><font color='#64748b' size='7'>({item.net_need_quantity} {item.unit} benötigt)</font>", item_name_style)
                price_text = f"~{item.total_price:.2f} €" if item.total_price else "Standard"
                sale_tag = " <font color='#dc2626' size='7'>[Rabatt]</font>" if item.is_on_sale else ""
                status_p = Paragraph(f"<b>{price_text}</b>{sale_tag}", item_name_style)

            rows.append([check_box, name_p, qty_p, status_p])

        items_table = Table(rows, colWidths=[1.5 * cm, 9.0 * cm, 4.0 * cm, 3.5 * cm])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ]))
        store_elements.append(items_table)
        store_elements.append(Spacer(1, 10))

        story.append(KeepTogether(store_elements))

    # 4. CUSTOM ITEMS SECTION (if any)
    if shopping_list.custom_items:
        custom_elements = []
        c_head_data = [[
            Paragraph(f"<b>[ ] EIGENE ZUSATZARTIKEL ({len(shopping_list.custom_items)} Artikel)</b>", h2_style)
        ]]
        c_head_table = Table(c_head_data, colWidths=[18.0 * cm])
        c_head_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#1e293b")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        custom_elements.append(c_head_table)

        c_rows = [
            [
                Paragraph("<b>Check</b>", item_sub_style),
                Paragraph("<b>Artikelname & Notizen</b>", item_sub_style),
                Paragraph("<b>Menge</b>", item_sub_style),
                Paragraph("<b>Händler</b>", item_sub_style),
            ]
        ]

        for c in shopping_list.custom_items:
            cb = Paragraph("[  ]", ParagraphStyle('CbC', fontName='Helvetica-Bold', fontSize=11, textColor=colors.HexColor("#475569")))
            note_str = f"<br/><font color='#64748b' size='7'>{c.notes}</font>" if c.notes else ""
            name_p = Paragraph(f"<b>{c.name}</b>{note_str}", item_name_style)
            qty_p = Paragraph(f"<b>{c.quantity} {c.unit}</b>", item_name_style)
            store_p = Paragraph(f"{c.retailer}", item_sub_style)
            c_rows.append([cb, name_p, qty_p, store_p])

        c_table = Table(c_rows, colWidths=[1.5 * cm, 9.0 * cm, 4.0 * cm, 3.5 * cm])
        c_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ]))
        custom_elements.append(c_table)
        story.append(KeepTogether(custom_elements))

    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()
