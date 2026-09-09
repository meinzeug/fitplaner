"""
Digital Leaflet and Brochure Viewer Service for Netto & NP.
"""

from typing import List
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
                LeafletHotspot(title="Bio Vollkorn-Knäckebrot 250g", price=1.19, savings=30, category="Vollkorn & Hülsenfrüchte", x_percent=50, y_percent=80),
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
                LeafletHotspot(title="Knackige Snack-Gurken 400g", price=1.19, savings=33, category="Obst & Gemüse", x_percent=50, y_percent=75),
            ]
        ),
        LeafletPage(
            page_number=3,
            title="Bio-Hülsenfrüchte & Nüsse",
            image_url="https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=800",
            deals=[
                LeafletHotspot(title="Bio Kichererbsen & Rote Linsen", price=0.99, savings=34, category="Vollkorn & Hülsenfrüchte", x_percent=35, y_percent=45),
                LeafletHotspot(title="Walnusskerne naturbelassen 200g", price=2.19, savings=27, category="Gesunde Fette & Nüsse", x_percent=70, y_percent=55),
                LeafletHotspot(title="Körniger Frischkäse High Protein 200g", price=0.89, savings=31, category="Proteinquellen", x_percent=50, y_percent=80),
            ]
        ),
    ]
)


def get_all_leaflets() -> List[LeafletBrochure]:
    return [NETTO_LEAFLET, NP_LEAFLET]
