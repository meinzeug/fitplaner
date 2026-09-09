"""
PDF Export Generator for FitPlaner Shopping List.
Creates a professional, multi-page printable A4 PDF document with checkboxes,
real scannable vector barcodes (EAN-13), exact branded article names,
store separations, walkway aisles, pantry coverage, and budget summaries.
"""

import io
from datetime import datetime
from typing import List, Optional, Any
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode import createBarcodeDrawing
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
        self.line(1.2 * cm, 1.2 * cm, A4[0] - 1.2 * cm, 1.2 * cm)

        # Footer text
        footer_text = f"FitPlaner • Deine intelligente Einkaufsliste mit Barcodes & Filial-Laufweg • Seite {self._pageNumber} von {page_count}"
        self.drawString(1.2 * cm, 0.8 * cm, footer_text)

        now_str = datetime.now().strftime("%d.%m.%Y %H:%M")
        self.drawRightString(A4[0] - 1.2 * cm, 0.8 * cm, f"Gedruckt: {now_str}")
        self.restoreState()


def create_safe_barcode_drawing(barcode: Optional[str]) -> Any:
    """Generates a clean vector EAN-13 barcode drawing for the shopping list PDF."""
    if not barcode:
        return Paragraph(
            "<font color='#94a3b8' size='7'>Kein Barcode</font>",
            ParagraphStyle('NoBc', fontName='Helvetica', fontSize=7, textColor=colors.HexColor('#94a3b8'), alignment=1)
        )
    try:
        clean_bc = str(barcode).strip()
        if len(clean_bc) == 13 and clean_bc.isdigit():
            base12 = clean_bc[:12]
            total = sum(int(ch) * (1 if i % 2 == 0 else 3) for i, ch in enumerate(base12))
            check = (10 - (total % 10)) % 10
            valid_ean = f"{base12}{check}"
            return createBarcodeDrawing('EAN13', value=valid_ean, barWidth=0.85, barHeight=22, humanReadable=True, fontSize=6)
        elif clean_bc.isdigit():
            return createBarcodeDrawing('Code128', value=clean_bc, barWidth=0.8, barHeight=20, humanReadable=True, fontSize=6)
        else:
            return createBarcodeDrawing('Code128', value=clean_bc, barWidth=0.8, barHeight=20, humanReadable=True, fontSize=6)
    except Exception:
        return Paragraph(
            f"<font color='#64748b' size='7'>EAN: {barcode}</font>",
            ParagraphStyle('BcFallback', fontName='Helvetica', fontSize=7, textColor=colors.HexColor('#64748b'), alignment=1)
        )


def generate_shopping_list_pdf(shopping_list: ShoppingList) -> bytes:
    """
    Renders the complete shopping list into a downloadable PDF binary.
    Includes real vector EAN-13 barcodes, exact branded article names,
    aisle walkway ordering, and multi-supermarket separation.
    """
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.2 * cm,
        rightMargin=1.2 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.8 * cm
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=1,
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#64748b"),
    )

    h2_style = ParagraphStyle(
        'StoreH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.white,
    )

    item_name_style = ParagraphStyle(
        'ItemName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=10.5,
        textColor=colors.HexColor("#0f172a"),
    )

    item_sub_style = ParagraphStyle(
        'ItemSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=8.5,
        textColor=colors.HexColor("#64748b"),
    )

    item_done_style = ParagraphStyle(
        'ItemDone',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=9.5,
        textColor=colors.HexColor("#059669"),
        alignment=1,
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9,
        textColor=colors.HexColor("#334155"),
    )

    price_style = ParagraphStyle(
        'PriceStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=10.5,
        alignment=2,
        textColor=colors.HexColor("#0f172a"),
    )

    story = []

    # 1. HEADER BANNER
    header_data = [
        [
            Paragraph("🛒 FitPlaner • Einkaufsliste", title_style),
            Paragraph(f"<b>Woche:</b> {shopping_list.week_label or 'Aktuelle Woche'}", ParagraphStyle(
                'WeekBadge', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, alignment=2, textColor=colors.HexColor("#0f172a")
            ))
        ],
        [
            Paragraph("Gedruckte Markt-Einkaufsliste mit EAN-13 Barcodes, Marken & Gang-Laufweg", subtitle_style),
            Paragraph(f"Budget-Status: <b>{shopping_list.budget_status.upper()}</b>", ParagraphStyle(
                'StatusBadge', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, alignment=2,
                textColor=colors.HexColor("#059669") if shopping_list.budget_status == "ok" else colors.HexColor("#dc2626")
            ))
        ]
    ]

    header_table = Table(header_data, colWidths=[12.0 * cm, 6.6 * cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceBefore=4, spaceAfter=6))

    # 2. KPI SUMMARY BAR
    kpi_data = [
        [
            Paragraph("<b>Geschätzter Einkauf:</b>", item_sub_style),
            Paragraph("<b>Geplantes Budget:</b>", item_sub_style),
            Paragraph("<b>Aktions-Ersparnis:</b>", item_sub_style),
            Paragraph("<b>Im Vorrat gespart:</b>", item_sub_style),
        ],
        [
            Paragraph(f"<b>{shopping_list.total_price:.2f} €</b>", ParagraphStyle('Kpi1', fontName='Helvetica-Bold', fontSize=12, textColor=colors.HexColor("#0f172a"))),
            Paragraph(f"<b>{shopping_list.budget:.2f} €</b>", ParagraphStyle('Kpi2', fontName='Helvetica-Bold', fontSize=12, textColor=colors.HexColor("#334155"))),
            Paragraph(f"<b>~{shopping_list.total_savings:.2f} €</b>", ParagraphStyle('Kpi3', fontName='Helvetica-Bold', fontSize=12, textColor=colors.HexColor("#059669"))),
            Paragraph(f"<b>~{shopping_list.covered_by_stock_savings:.2f} €</b>", ParagraphStyle('Kpi4', fontName='Helvetica-Bold', fontSize=12, textColor=colors.HexColor("#0284c7"))),
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[4.65 * cm, 4.65 * cm, 4.65 * cm, 4.65 * cm])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 8))

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

        # Store Section Header Banner
        head_data = [[
            Paragraph(f"<b>[ ] {store_name.upper()} ({len(items)} Artikel)</b>", h2_style)
        ]]
        head_table = Table(head_data, colWidths=[18.6 * cm])
        head_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(header_hex)),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(head_table)

        # Table rows for items (5 Columns: Check, Artikel & Marke, Bedarf & Packung, Barcode, Preis)
        rows = [
            [
                Paragraph("<b>Check</b>", table_header_style),
                Paragraph("<b>Artikelname & Marke</b>", table_header_style),
                Paragraph("<b>Bedarf / Packung</b>", table_header_style),
                Paragraph("<b>Barcode (EAN-13 Scan)</b>", table_header_style),
                Paragraph("<b>Status / Preis</b>", ParagraphStyle('ThPrice', parent=table_header_style, alignment=2)),
            ]
        ]

        for item in items:
            check_box = Paragraph("[  ]", ParagraphStyle('Cb', fontName='Helvetica-Bold', fontSize=11, textColor=colors.HexColor("#475569")))

            # Item details with authentic brand and exact product name
            display_title = item.exact_product_name or item.name
            brand_tag = f"<b>{item.brand}</b> • " if item.brand else ""
            aisle_text = item.aisle or "Standard-Sortiment"
            name_p = Paragraph(
                f"<b>{display_title}</b><br/>"
                f"<font color='#64748b' size='6.5'>{brand_tag}{item.category} • {aisle_text}</font>",
                item_name_style
            )

            # Amount / Packs
            if item.is_covered_by_stock:
                qty_p = Paragraph(
                    f"<b>{item.total_quantity} {item.unit}</b><br/>"
                    f"<font color='#059669' size='6.5'>Vorratskammer</font>",
                    item_sub_style
                )
                barcode_cell = Paragraph(
                    "<font color='#059669'><b>✅ Vorrat</b><br/><font size='6.5'>Im Haus vorhanden</font></font>",
                    item_done_style
                )
                status_p = Paragraph(
                    "<font color='#059669'><b>0,00 €</b></font><br/><font color='#059669' size='6.5'>Vorrat</font>",
                    price_style
                )
            else:
                packs_info = f"{item.packs_to_buy}x Packung" if item.pack_size else f"{item.net_need_quantity} {item.unit}"
                pack_sub = f" ({item.pack_size} {item.unit})" if item.pack_size else ""
                qty_p = Paragraph(
                    f"<b>{packs_info}{pack_sub}</b><br/>"
                    f"<font color='#64748b' size='6.5'>Bedarf: {item.net_need_quantity} {item.unit}</font>",
                    item_name_style
                )
                barcode_cell = create_safe_barcode_drawing(item.barcode)
                price_text = f"~{item.total_price:.2f} €" if item.total_price else "Standard"
                sale_tag = "<br/><font color='#dc2626' size='6.5'><b>[AKTION]</b></font>" if item.is_on_sale else ""
                status_p = Paragraph(f"<b>{price_text}</b>{sale_tag}", price_style)

            rows.append([check_box, name_p, qty_p, barcode_cell, status_p])

        items_table = Table(
            rows,
            colWidths=[1.2 * cm, 6.5 * cm, 3.8 * cm, 4.6 * cm, 2.5 * cm],
            repeatRows=1
        )
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ]))
        story.append(items_table)
        story.append(Spacer(1, 8))

    # 4. CUSTOM ITEMS SECTION (if any)
    if shopping_list.custom_items:
        c_head_data = [[
            Paragraph(f"<b>[ ] EIGENE ZUSATZARTIKEL ({len(shopping_list.custom_items)} Artikel)</b>", h2_style)
        ]]
        c_head_table = Table(c_head_data, colWidths=[18.6 * cm])
        c_head_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#1e293b")),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(c_head_table)

        c_rows = [
            [
                Paragraph("<b>Check</b>", table_header_style),
                Paragraph("<b>Artikelname & Notizen</b>", table_header_style),
                Paragraph("<b>Menge</b>", table_header_style),
                Paragraph("<b>Barcode (EAN-13)</b>", table_header_style),
                Paragraph("<b>Händler</b>", ParagraphStyle('ThCustomStore', parent=table_header_style, alignment=2)),
            ]
        ]

        for c in shopping_list.custom_items:
            cb = Paragraph("[  ]", ParagraphStyle('CbC', fontName='Helvetica-Bold', fontSize=11, textColor=colors.HexColor("#475569")))
            display_title = c.exact_product_name or c.name
            brand_tag = f"<b>{c.brand}</b> • " if c.brand else ""
            note_str = f"<br/><font color='#64748b' size='6.5'>{brand_tag}{c.notes or c.category}</font>"
            name_p = Paragraph(f"<b>{display_title}</b>{note_str}", item_name_style)
            qty_p = Paragraph(f"<b>{c.quantity} {c.unit}</b>", item_name_style)
            barcode_cell = create_safe_barcode_drawing(c.barcode)
            store_p = Paragraph(f"<b>{c.retailer}</b>", price_style)
            c_rows.append([cb, name_p, qty_p, barcode_cell, store_p])

        c_table = Table(
            c_rows,
            colWidths=[1.2 * cm, 6.5 * cm, 3.8 * cm, 4.6 * cm, 2.5 * cm],
            repeatRows=1
        )
        c_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ]))
        story.append(c_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()
