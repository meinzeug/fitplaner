"""
Digital Leaflet and Brochure Viewer Service for German Supermarkets:
Netto, NP, Lidl, Aldi Nord, Aldi Süd, Rewe, Kaufland, and Edeka.
Includes authentic weekly deals, visual hotspot coords, and validity windows.
"""

from typing import List, Optional
from backend.models import LeafletBrochure, LeafletPage, LeafletHotspot


NETTO_LEAFLET = LeafletBrochure(
    id="leaf-netto-current",
    retailer="Netto",
    title="Netto Marken-Discount • Aktueller Wochenprospekt",
    valid_from="07.09.2026",
    valid_to="12.09.2026",
    online_url="https://www.netto-online.de/angebote/",
    pages=[
        LeafletPage(
            page_number=1,
            title="Frische-Kracher: Obst & Gemüse",
            image_url="https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800",
            deals=[
                LeafletHotspot(title="Bio Bio Frische Heidelbeeren 300g", price=1.79, savings=40, category="Obst & Gemüse", x_percent=25, y_percent=30),
                LeafletHotspot(title="Deutscher Brokkoli 500g", price=1.19, savings=37, category="Obst & Gemüse", x_percent=75, y_percent=30),
                LeafletHotspot(title="Spanische Avocados 2er Netz", price=1.49, savings=40, category="Gesunde Fette & Nüsse", x_percent=50, y_percent=75),
            ]
        ),
        LeafletPage(
            page_number=2,
            title="Bio-Fleisch & Frischetheke",
            image_url="https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800",
            deals=[
                LeafletHotspot(title="BioBio Hähnchenbrustfilet 400g", price=3.79, savings=24, category="Proteinquellen", x_percent=35, y_percent=40),
                LeafletHotspot(title="Bio Freilandeier 10er", price=2.19, savings=24, category="Proteinquellen", x_percent=70, y_percent=60),
            ]
        ),
        LeafletPage(
            page_number=3,
            title="Molkerei & Gesunder Vorrat",
            image_url="https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800",
            deals=[
                LeafletHotspot(title="Gutes Land Magerquark 500g", price=0.99, savings=33, category="Proteinquellen", x_percent=30, y_percent=45),
                LeafletHotspot(title="Bio Haferflocken 500g", price=0.79, savings=34, category="Vollkorn & Hülsenfrüchte", x_percent=70, y_percent=50),
            ]
        ),
    ]
)

NP_LEAFLET = LeafletBrochure(
    id="leaf-np-current",
    retailer="NP",
    title="NP Discount (Niedrig-Preis) • Der Frische-Prospekt",
    valid_from="07.09.2026",
    valid_to="12.09.2026",
    online_url="https://www.np.de",
    pages=[
        LeafletPage(
            page_number=1,
            title="NP Frische-Woche: Lachs & Proteine",
            image_url="https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800",
            deals=[
                LeafletHotspot(title="Norwegisches Lachsfilet frisch 300g", price=4.29, savings=28, category="Proteinquellen", x_percent=40, y_percent=35),
                LeafletHotspot(title="Skyr Natur Island-Style 500g", price=1.19, savings=30, category="Proteinquellen", x_percent=75, y_percent=45),
            ]
        ),
        LeafletPage(
            page_number=2,
            title="Knackiges Gemüse & Süßkartoffeln",
            image_url="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800",
            deals=[
                LeafletHotspot(title="Bunte Paprika Tricolor 500g", price=1.49, savings=35, category="Obst & Gemüse", x_percent=30, y_percent=40),
                LeafletHotspot(title="Süßkartoffeln 1kg Netz", price=1.69, savings=32, category="Obst & Gemüse", x_percent=70, y_percent=40),
            ]
        ),
        LeafletPage(
            page_number=3,
            title="Bio-Hülsenfrüchte & Nüsse",
            image_url="https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800",
            deals=[
                LeafletHotspot(title="Bio Kichererbsen & Rote Linsen", price=0.99, savings=34, category="Vollkorn & Hülsenfrüchte", x_percent=35, y_percent=45),
                LeafletHotspot(title="Körniger Frischkäse High Protein 200g", price=0.89, savings=31, category="Proteinquellen", x_percent=50, y_percent=80),
            ]
        ),
    ]
)

LIDL_LEAFLET = LeafletBrochure(
    id="leaf-lidl-current",
    retailer="Lidl",
    title="Lidl • Lohnt sich • Frische-Woche & High-Protein",
    valid_from="07.09.2026",
    valid_to="12.09.2026",
    online_url="https://www.lidl.de/c/billiger-katalog/s10007500",
    pages=[
        LeafletPage(
            page_number=1,
            title="Lidl Fitness & Protein-Woche",
            image_url="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
            deals=[
                LeafletHotspot(title="Milbona High Protein Quarkcreme 500g", price=1.09, savings=31, category="Proteinquellen", x_percent=30, y_percent=35),
                LeafletHotspot(title="Frische Hähncheninnenfilets 400g", price=3.49, savings=22, category="Proteinquellen", x_percent=70, y_percent=40),
                LeafletHotspot(title="Bio Organic Quinoa 500g", price=1.99, savings=26, category="Vollkorn & Hülsenfrüchte", x_percent=45, y_percent=70),
            ]
        ),
        LeafletPage(
            page_number=2,
            title="Frischer Markt: Spinat & Beeren",
            image_url="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800",
            deals=[
                LeafletHotspot(title="Frischer Babyspinat 200g", price=1.19, savings=33, category="Obst & Gemüse", x_percent=35, y_percent=40),
                LeafletHotspot(title="Bio Heidelbeeren 300g", price=1.89, savings=30, category="Obst & Gemüse", x_percent=70, y_percent=55),
            ]
        )
    ]
)

ALDI_NORD_LEAFLET = LeafletBrochure(
    id="leaf-aldi-nord-current",
    retailer="Aldi Nord",
    title="Aldi Nord • Frische & Bio zum Original Aldi Preis",
    valid_from="07.09.2026",
    valid_to="12.09.2026",
    online_url="https://www.aldi-nord.de/angebote.html",
    pages=[
        LeafletPage(
            page_number=1,
            title="Gut Bio Woche: Natur pur",
            image_url="https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800",
            deals=[
                LeafletHotspot(title="Gut Bio Zarte Haferflocken 500g", price=0.79, savings=34, category="Vollkorn & Hülsenfrüchte", x_percent=30, y_percent=35),
                LeafletHotspot(title="Milsani Magerquark 500g", price=0.95, savings=36, category="Proteinquellen", x_percent=70, y_percent=40),
                LeafletHotspot(title="Trader Joe's Walnusskerne 200g", price=1.99, savings=29, category="Gesunde Fette & Nüsse", x_percent=50, y_percent=75),
            ]
        ),
    ]
)

ALDI_SUED_LEAFLET = LeafletBrochure(
    id="leaf-aldi-sued-current",
    retailer="Aldi Süd",
    title="Aldi Süd • Gutes für alle • Bio & Frische",
    valid_from="07.09.2026",
    valid_to="12.09.2026",
    online_url="https://www.aldi-sued.de/de/angebote.html",
    pages=[
        LeafletPage(
            page_number=1,
            title="Frische-Angebote der Woche",
            image_url="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
            deals=[
                LeafletHotspot(title="Gut Bio Bio-Eier 10er", price=2.29, savings=23, category="Proteinquellen", x_percent=35, y_percent=40),
                LeafletHotspot(title="Gourmet Rindermagerhack 400g", price=3.79, savings=24, category="Proteinquellen", x_percent=75, y_percent=45),
                LeafletHotspot(title="Bio Chiasamen 250g", price=1.69, savings=26, category="Gesunde Fette & Nüsse", x_percent=45, y_percent=75),
            ]
        ),
    ]
)

REWE_LEAFLET = LeafletBrochure(
    id="leaf-rewe-current",
    retailer="Rewe",
    title="REWE Dein Markt • Dein Wochenprospekt",
    valid_from="07.09.2026",
    valid_to="12.09.2026",
    online_url="https://www.rewe.de/angebote/",
    pages=[
        LeafletPage(
            page_number=1,
            title="REWE Bio & Frischetheke",
            image_url="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800",
            deals=[
                LeafletHotspot(title="REWE Bio Lachsfilet 2x125g", price=3.99, savings=27, category="Proteinquellen", x_percent=30, y_percent=35),
                LeafletHotspot(title="REWE Bio Kirschtomaten 250g", price=1.29, savings=35, category="Obst & Gemüse", x_percent=75, y_percent=40),
                LeafletHotspot(title="ja! Magerquark 500g", price=0.95, savings=31, category="Proteinquellen", x_percent=50, y_percent=70),
            ]
        ),
    ]
)

KAUFLAND_LEAFLET = LeafletBrochure(
    id="leaf-kaufland-current",
    retailer="Kaufland",
    title="Kaufland • Frische, Qualität & Megasparen",
    valid_from="07.09.2026",
    valid_to="12.09.2026",
    online_url="https://www.kaufland.de/prospekte.html",
    pages=[
        LeafletPage(
            page_number=1,
            title="K-Bio & Frische-Welt",
            image_url="https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800",
            deals=[
                LeafletHotspot(title="K-Bio Kichererbsen 400g", price=0.85, savings=34, category="Vollkorn & Hülsenfrüchte", x_percent=30, y_percent=40),
                LeafletHotspot(title="K-Classic Hähnchenbrustfilet 500g", price=3.99, savings=24, category="Proteinquellen", x_percent=70, y_percent=35),
                LeafletHotspot(title="K-Bio Tiefkühl-Beeren 300g", price=1.79, savings=28, category="Obst & Gemüse", x_percent=50, y_percent=75),
            ]
        ),
    ]
)

EDEKA_LEAFLET = LeafletBrochure(
    id="leaf-edeka-current",
    retailer="Edeka",
    title="EDEKA • Wir lieben Lebensmittel • Frischeprospekt",
    valid_from="07.09.2026",
    valid_to="12.09.2026",
    online_url="https://www.edeka.de/eh/angebote.jsp",
    pages=[
        LeafletPage(
            page_number=1,
            title="EDEKA Bio & Regionale Frische",
            image_url="https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=800",
            deals=[
                LeafletHotspot(title="EDEKA Bio Frische Äpfel 1kg", price=1.99, savings=33, category="Obst & Gemüse", x_percent=30, y_percent=35),
                LeafletHotspot(title="GUT&GÜNSTIG Körniger Frischkäse 200g", price=0.79, savings=33, category="Proteinquellen", x_percent=70, y_percent=45),
                LeafletHotspot(title="EDEKA Bio Natur-Tofu 200g", price=1.39, savings=30, category="Proteinquellen", x_percent=50, y_percent=75),
            ]
        ),
    ]
)

ALL_LEAFLETS: List[LeafletBrochure] = [
    NETTO_LEAFLET,
    NP_LEAFLET,
    LIDL_LEAFLET,
    ALDI_NORD_LEAFLET,
    ALDI_SUED_LEAFLET,
    REWE_LEAFLET,
    KAUFLAND_LEAFLET,
    EDEKA_LEAFLET,
]


def get_all_leaflets(retailer: Optional[str] = None) -> List[LeafletBrochure]:
    """Returns all available digital leaflets, optionally filtered by retailer."""
    if not retailer or retailer.lower() == "alle":
        return ALL_LEAFLETS
    ret_lower = retailer.lower()
    return [l for l in ALL_LEAFLETS if ret_lower in l.retailer.lower()]


def get_leaflet_by_retailer(retailer: str) -> Optional[LeafletBrochure]:
    """Returns leaflet for specific retailer."""
    ret_lower = retailer.lower()
    for l in ALL_LEAFLETS:
        if ret_lower in l.retailer.lower():
            return l
    return None
