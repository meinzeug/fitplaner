"""
Comprehensive Central European Wild Edibles Database for FitPlaner Breakout Mode.
Maps standard supermarket staples to wild plants, roots, seeds, nuts, and mushrooms.
Includes precise nutritional profiles, toxicological lookalike analysis, and child safety.
"""

from typing import List
from backend.survival.models_doomsday import (
    WildSubstitute,
    SupermarketCategory,
    HabitatType,
    PlantPart,
    PreparationMethod,
    NutritionalProfile,
    LookalikeRisk,
    ChildSafetyWarning
)

WILD_SUBSTITUTES_DATABASE: List[WildSubstitute] = [
    # 1. SPINAT & KOCHGEMÜSE: GIERSCH
    WildSubstitute(
        id="giersch",
        name_de="Giersch (Geißfuß)",
        name_botanical="Aegopodium podagraria",
        replaced_supermarket_item="Blattspinat, Petersilie, Suppengrün",
        category=SupermarketCategory.SPINAT_KOCHGEMUESE,
        habitats=[HabitatType.WALD, HabitatType.GARTEN, HabitatType.GEWAESSER],
        plant_parts_used=[PlantPart.LEAVES],
        harvest_months=[3, 4, 5, 6, 7, 8, 9, 10],
        identification_features=[
            "Typischer dreikantiger Blattstiel (eine Seite gerillt, Querschnitt bildet ein Dreieck)",
            "Blattspreite dreigeteilt, jedes Teilblatt wiederum dreigeteilt ('Drei, drei, drei – bist beim Giersch dabei')",
            "Intensiver Geruch beim Zerreiben nach Petersilie und junger Möhre",
            "Doldenblüte im Sommer mit kleinen weißen Blüten"
        ],
        preparation_methods=[PreparationMethod.RAW_SAFE, PreparationMethod.COOKING_REQUIRED],
        preparation_instructions="Junge, hellgrün glänzende Blätter schmecken mild im Rohkostsalat. Ausgewachsene Blätter 2-3 Minuten wie Spinat blanchieren oder in Suppen kochen.",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=35.0,
            protein_g=3.2,
            fat_g=0.6,
            carbs_g=4.5,
            fiber_g=3.1,
            key_micronutrients={
                "Vitamin C": "201 mg (4x Zitrone!)",
                "Eisen": "15.0 mg (4x Kulturspinat!)",
                "Kalium": "450 mg",
                "Calcium": "130 mg"
            },
            supermarket_comparison="Übertrifft Kultur-Supermarkt-Spinat um das Vierfache an Eisen und Vitamin C!"
        ),
        lookalike_risks=[
            LookalikeRisk(
                deadly_lookalike_name_de="Gefleckter Schierling",
                deadly_lookalike_botanical="Conium maculatum",
                toxin="Coniin (Tödliche Atemlähmung ab 0,15 g Reingift)",
                lethal_danger="TÖDLICH! Lähmung der Atemmuskulatur bei vollem Bewusstsein.",
                distinction_rules=[
                    "Schierling hat einen runden, vollkommen kahlen Stängel mit rotbraunen Flecken",
                    "Schierling riecht unangenehm stechend nach Mäuse-Urin",
                    "Giersch hat den unverwechselbaren dreikantigen Blattstiel mit Rinne"
                ],
                absolute_veto_criterion="Hat der Stängel KEINE dreikantige Einkerbung oder rote Flecken -> VETO! Nicht berühren!"
            )
        ],
        child_safety=ChildSafetyWarning(
            suitable_for_children=True,
            minimum_age_years=1,
            toxicological_notes="Sehr gut verträglich nach Waschen/Kochen. Reines Mineralstoffwunder.",
            max_dosage="Unbegrenzt als Kochgemüse"
        ),
        survival_storage_days=3,
        survival_notes="Wächst in Massenbeständen. Kann für den Winter getrocknet und zu nährstoffreichem Gemüsepulver vermahlen werden."
    ),

    # 2. SPINAT & KOCHGEMÜSE: BRENNNESSEL
    WildSubstitute(
        id="brennnessel-blatt",
        name_de="Große Brennnessel (Blätter)",
        name_botanical="Urtica dioica",
        replaced_supermarket_item="Spinat, Mangold, Grünkohl",
        category=SupermarketCategory.SPINAT_KOCHGEMUESE,
        habitats=[HabitatType.RUDERAL, HabitatType.WALD, HabitatType.GEWAESSER, HabitatType.GARTEN],
        plant_parts_used=[PlantPart.LEAVES],
        harvest_months=[3, 4, 5, 6, 7, 8, 9, 10, 11],
        identification_features=[
            "Gegenständige, eiförmig-lanzettliche Blätter mit gesägtem Rand",
            "Vierkantiger Stängel mit brennenden Kieselsäure-Haaren",
            "Wächst fast immer in dichten Kolonien auf stickstoffreichen Böden"
        ],
        preparation_methods=[PreparationMethod.COOKING_REQUIRED, PreparationMethod.DRYING_FERMENTING],
        preparation_instructions="Brennhaare durch 60 Sekunden Kochen, Dünsten oder mechanisches Walken mit Nudelholz/Mörser deaktivieren. Danach butterweich wie Edelsalat.",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=42.0,
            protein_g=7.4,
            fat_g=0.8,
            carbs_g=1.3,
            fiber_g=4.0,
            key_micronutrients={
                "Vitamin C": "330 mg (6x Zitrone!)",
                "Calcium": "710 mg (6x Vollmilch!)",
                "Eisen": "4.1 mg",
                "Magnesium": "80 mg"
            },
            supermarket_comparison="Enthält fast doppelt so viel Eiweiß und sechsmal mehr Kalzium als Supermarkt-Blattspinat!"
        ),
        lookalike_risks=[
            LookalikeRisk(
                deadly_lookalike_name_de="Weiße / Gefleckte Taubnessel (Harmlos)",
                deadly_lookalike_botanical="Lamium album",
                toxin="Keines (ungiftig)",
                lethal_danger="Keine Gefahr, ebenfalls voll essbar, brennt nur nicht.",
                distinction_rules=["Taubnesseln haben Lippenblüten und brennen nicht."],
                absolute_veto_criterion="Keine tödlichen Doppelgänger in Mitteleuropa."
            )
        ],
        child_safety=ChildSafetyWarning(
            suitable_for_children=True,
            minimum_age_years=1,
            toxicological_notes="Roh wegen Brennhaaren im Mund schmerzhaft. Gekocht exzellent gegen Eisenmangel.",
            max_dosage="Täglich als Gemüsebeilage geeignet."
        ),
        survival_storage_days=4,
        survival_notes="Getrocknete Brennnesselblätter liefern über den gesamten Winter bis zu 35% pflanzliches Protein."
    ),

    # 3. SALAT: VOGELMIERE
    WildSubstitute(
        id="vogelmiere",
        name_de="Gewöhnliche Vogelmiere",
        name_botanical="Stellaria media",
        replaced_supermarket_item="Kopfsalat, Feldsalat, Chicorée",
        category=SupermarketCategory.SALAT_BLATTGEMUESE,
        habitats=[HabitatType.GARTEN, HabitatType.WIESE, HabitatType.RUDERAL],
        plant_parts_used=[PlantPart.LEAVES, PlantPart.FLOWERS],
        harvest_months=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        identification_features=[
            "Teppichartiger, saftig grüner Wuchs, selbst im tiefsten Winter unter Schnee",
            "UNVERWECHSELBAR: Eine einzige Haarlinie am runden Stängel (wechselt an jedem Blattknoten um 90°)",
            "Kleine weiße Blütensterne mit 5 tief zweigeteilten Kronblättern"
        ],
        preparation_methods=[PreparationMethod.RAW_SAFE],
        preparation_instructions="Gründlich in kaltem Wasser waschen. Roh als knackiger Salat verzehren – schmeckt saftig und erfrischend nach jungem Zuckermais.",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=25.0,
            protein_g=2.0,
            fat_g=0.5,
            carbs_g=2.8,
            fiber_g=1.8,
            key_micronutrients={
                "Vitamin C": "115 mg",
                "Zink": "3x Kultursalat",
                "Rutin": "Gefäßschützendes Flavonoid",
                "Kupfer": "Wichtig für Blutbildung"
            },
            supermarket_comparison="Liefert das gesamte Jahr über frisches Vitamin C und Zink – auch wenn im Supermarkt die Regale leer sind."
        ),
        lookalike_risks=[
            LookalikeRisk(
                deadly_lookalike_name_de="Ackergauchheil",
                deadly_lookalike_botanical="Anagallis arvensis",
                toxin="Saponine (leicht giftig)",
                lethal_danger="Magenkrämpfe und Durchfall, bei großen Mengen toxisch.",
                distinction_rules=[
                    "Ackergauchheil hat einen 4-kantigen, völlig KAHLLEN Stängel (KEINE Haarlinie!)",
                    "Ackergauchheil blüht scharlachrot oder leuchtend blau (Vogelmiere immer weiß)"
                ],
                absolute_veto_criterion="Fehlt die einseitige Haarlinie am Stängel -> Nicht essen!"
            )
        ],
        child_safety=ChildSafetyWarning(
            suitable_for_children=True,
            minimum_age_years=1,
            toxicological_notes="Sehr mild, wird von Kindern wegen des maisähnlichen Geschmacks geliebt.",
            max_dosage="Unbedenklich in Salat-Portionen."
        ),
        survival_storage_days=2,
        survival_notes="Die wichtigste 365-Tage-Vitaminquelle in mitteleuropäischen Notzeiten."
    ),

    # 4. MEHL & GETREIDE: EICHELMEHL
    WildSubstitute(
        id="eichelmehl",
        name_de="Eichel (Eichelmehl)",
        name_botanical="Quercus robur / petraea",
        replaced_supermarket_item="Weizenmehl, Roggenmehl, Haferflocken, Brotgetreide",
        category=SupermarketCategory.MEHL_GETREIDE,
        habitats=[HabitatType.WALD],
        plant_parts_used=[PlantPart.SEEDS],
        harvest_months=[9, 10, 11],
        identification_features=[
            "Eichenblätter mit runden Ausbuchtungen (Stieleiche/Traubeneiche)",
            "Nussfrucht (Eichel) im becherförmigen Fruchtstand",
            "Massenhaft im Herbst unter alten Eichenbäumen zu finden"
        ],
        preparation_methods=[PreparationMethod.LEACHING_TANNINS, PreparationMethod.ROASTING_REQUIRED],
        preparation_instructions="LEBENSWICHTIGES ENTBITTERN: Eicheln schälen, grob schroten. In Tuch/Sack 3-4 Tage in fließenden Bach hängen oder im Topf 2x täglich mit kaltem Wasser spülen, bis das Wasser vollkommen klar bleibt und kein bitterer Geschmack mehr wahrnehmbar ist. Danach trocknen und mahlen. Vollwertiges glutenfreies Backmehl!",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=387.0,
            protein_g=6.2,
            fat_g=23.8,
            carbs_g=54.0,
            fiber_g=10.5,
            key_micronutrients={
                "Kalium": "539 mg",
                "Magnesium": "62 mg",
                "Calcium": "41 mg",
                "B-Vitamine": "B1, B2, B6"
            },
            supermarket_comparison="Enthält viermal mehr gesundes Pflanzenfett als Weizenmehl und sichert das Überleben im Winter!"
        ),
        lookalike_risks=[
            LookalikeRisk(
                deadly_lookalike_name_de="Rosskastanie (Saponinhaltig)",
                deadly_lookalike_botanical="Aesculus hippocastanum",
                toxin="Aescin (Saponin)",
                lethal_danger="Stark bitter, Magenkrämpfe, Erbrechen (nicht tödlich, aber ungenießbar).",
                distinction_rules=[
                    "Rosskastanie hat gefingerte 5er/7er-Blätter und stachelige Fruchtkapseln",
                    "Eicheln sind länglich und sitzen in Bechern"
                ],
                absolute_veto_criterion="Niemals runde Kastanien aus Stachelkugeln als Eichelmehl verwenden!"
            )
        ],
        child_safety=ChildSafetyWarning(
            suitable_for_children=True,
            minimum_age_years=1,
            toxicological_notes="NIEMALS ROH ESSEN! Nach vollständiger Entbitterung ist Eichelmehl absolut bekömmlich und nahrhaft.",
            max_dosage="Täglich als Mehl/Brot einsetzbar."
        ),
        survival_storage_days=365,
        survival_notes="Getrocknetes Eichelmehl hält im Notlager bei trockener Aufbewahrung über 2 Jahre ohne Qualitätsverlust."
    ),

    # 5. MEHL & STÄRKE: ROHRKOLBEN-RHIZOMSTÄRKE
    WildSubstitute(
        id="rohrkolben-staerke",
        name_de="Breitblättriger Rohrkolben (Stärke & Pollen)",
        name_botanical="Typha latifolia",
        replaced_supermarket_item="Maisstärke, Kartoffelstärke, Soßenbinder",
        category=SupermarketCategory.MEHL_GETREIDE,
        habitats=[HabitatType.GEWAESSER],
        plant_parts_used=[PlantPart.ROOT, PlantPart.FLOWERS],
        harvest_months=[10, 11, 12, 1, 2, 3, 4, 6, 7],
        identification_features=[
            "Markante braune zylindrische Kolben ('Zigarre') an stehenden Gewässern",
            "Bis zu 2,5 m lange, linealische Blätter mit schwammartigem Luftgewebe",
            "Unterirdisch meterlange, daumendicke stärkereiche Rhizome"
        ],
        preparation_methods=[PreparationMethod.COOKING_REQUIRED],
        preparation_instructions="Rhizome im Winter ausgraben, waschen, schälen. Den zähen Kern in Wasser zerstampfen. Die weiße Stärke sinkt auf den Boden; Wasser abgießen, Stärke trocknen. Im Juni/Juli gelben Blütenpollen abschütteln – pures 18% Eiweißmehl!",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=360.0,
            protein_g=5.5,
            fat_g=0.8,
            carbs_g=80.0,
            fiber_g=4.0,
            key_micronutrients={
                "Eisen": "Hoch",
                "Kalium": "Mittel",
                "Protein (Pollen)": "18.0 g"
            },
            supermarket_comparison="Reine Naturstärke wie Mondamin/Speisestärke – bindet Suppen und eignet sich für Pfannkuchen."
        ),
        lookalike_risks=[
            LookalikeRisk(
                deadly_lookalike_name_de="Gelbe Schwertlilie",
                deadly_lookalike_botanical="Iris pseudacorus",
                toxin="Irisin (schwere Vergiftung)",
                lethal_danger="Starke blutige Magen-Darm-Entzündungen, Krämpfe.",
                distinction_rules=[
                    "Schwertlilie hat fächerförmig wachsende Blätter mit scharfem Mittelgrat",
                    "Schwertlilien-Rhizom ist gelb-bräunlich und brennt intensiv scharf auf der Zunge",
                    "Rohrkolben hat die unverwechselbare alte 'Zigarre' am Halm"
                ],
                absolute_veto_criterion="Brennt der Wurzelstock auf der Zunge oder hat das Blatt einen Mittelgrat -> VETO!"
            )
        ],
        child_safety=ChildSafetyWarning(
            suitable_for_children=True,
            minimum_age_years=1,
            toxicological_notes="Gekochte Stärke ist für Kleinkinder als Brei hervorragend verträglich.",
            max_dosage="Unbegrenzt als Stärkequelle."
        ),
        survival_storage_days=180,
        survival_notes="Der Rohrkolben ist der 'Supermarkt der Feuchtgebiete' – Stärke, Mehl, essbare Triebe und Zunder in einer Pflanze."
    ),

    # 6. KARTOFFELN & WURZELN: TOPINAMBUR
    WildSubstitute(
        id="topinambur",
        name_de="Topinambur (Wilde Knollen)",
        name_botanical="Helianthus tuberosus",
        replaced_supermarket_item="Kartoffeln, Pastinaken, Kohlrabi",
        category=SupermarketCategory.KARTOFFELN_WURZELN,
        habitats=[HabitatType.GEWAESSER, HabitatType.RUDERAL, HabitatType.WALD],
        plant_parts_used=[PlantPart.ROOT],
        harvest_months=[10, 11, 12, 1, 2, 3, 4],
        identification_features=[
            "Bis zu 3 m hohe Sonnenblumen-Verwandte mit rauen Stängeln und gelben Blütenköpfen",
            "Unterirdisch zahlreiche knotige, ingwerähnliche Knollen mit dünner Schale",
            "Massiv eingebürgert an großen Flüssen (Rhein, Elbe, Donau)"
        ],
        preparation_methods=[PreparationMethod.RAW_SAFE, PreparationMethod.COOKING_REQUIRED],
        preparation_instructions="Knollen abbürsten (Schälen nicht nötig). 15 Minuten in Wasser kochen, im Feuer rösten oder roh wie Radieschen knabbern.",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=73.0,
            protein_g=2.0,
            fat_g=0.4,
            carbs_g=17.4,
            fiber_g=1.6,
            key_micronutrients={
                "Inulin": "16 g (wertvoller Ballaststoff für Darmflora)",
                "Kalium": "429 mg",
                "Eisen": "3.4 mg"
            },
            supermarket_comparison="Beste Kartoffel-Alternative: Absolut winterhart (bis -30°C) und verbleibt frisch im frostigen Boden!"
        ),
        lookalike_risks=[
            LookalikeRisk(
                deadly_lookalike_name_de="Sonnenblume (Harmlos)",
                deadly_lookalike_botanical="Helianthus annuus",
                toxin="Keines",
                lethal_danger="Keine Knollenbildung, keine Gefahr.",
                distinction_rules=["Einjährige Sonnenblumen haben keine Knollen."],
                absolute_veto_criterion="Keine giftigen Doppelgänger unter den Knollen bildenden Pflanzen."
            )
        ],
        child_safety=ChildSafetyWarning(
            suitable_for_children=True,
            minimum_age_years=1,
            toxicological_notes="Der hohe Inulingehalt kann bei ungewohnten Mengen Blähungen verursachen. Langsam steigern.",
            max_dosage="1-2 Knollen pro Mahlzeit für Kinder."
        ),
        survival_storage_days=14,
        survival_notes="Muss nicht gelagert werden: Man lässt die Knollen einfach im Boden und gräbt sie im Winter bei Bedarf mit Schaufel oder Grabstock aus."
    ),

    # 7. FLEISCH & PROTEIN: BRENNNESSELSAMEN
    WildSubstitute(
        id="brennnesselsamen",
        name_de="Brennnesselsamen (Protein-Granulat)",
        name_botanical="Urtica dioica semen",
        replaced_supermarket_item="Fleisch, Proteinpulver, Hanfsamen, Chia",
        category=SupermarketCategory.FLEISCH_PROTEIN,
        habitats=[HabitatType.RUDERAL, HabitatType.WALD, HabitatType.GARTEN],
        plant_parts_used=[PlantPart.SEEDS],
        harvest_months=[8, 9, 10],
        identification_features=[
            "Schwere, herabhängende grüne bis braune Samenstränge an weiblichen Brennnesselpflanzen",
            "Samen körnig, reif nussig duftend"
        ],
        preparation_methods=[PreparationMethod.RAW_SAFE, PreparationMethod.DRYING_FERMENTING],
        preparation_instructions="Rispen ernten, auf Tüchern trocknen, Samen über feinem Sieb abrebeln. Roh ins Essen streuen, anrösten oder als Eiweißkonzentrat ins Notfallbrot mischen.",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=340.0,
            protein_g=30.0,
            fat_g=16.0,
            carbs_g=18.0,
            fiber_g=22.0,
            key_micronutrients={
                "Vitamin E": "Hoch (Zellschutz)",
                "Linolsäure": "Über 80% ungesättigte Fettsäuren",
                "Eisen": "5.0 mg",
                "Phytohormone": "Vitalisierend gegen Schwäche"
            },
            supermarket_comparison="Mit 30% Protein schlägt Brennnesselsamen Rindfleisch (22%) und Quark (12%) um Längen!"
        ),
        lookalike_risks=[],
        child_safety=ChildSafetyWarning(
            suitable_for_children=True,
            minimum_age_years=2,
            toxicological_notes="Wirkt leicht anregend und vitalisierend. Für Kinder 1 Teelöffel täglich optimal.",
            max_dosage="1-2 TL täglich."
        ),
        survival_storage_days=365,
        survival_notes="Kompaktestes Überlebens-Protein der Natur. 2 Handvoll decken den gesamten Tagesbedarf an Aminosäuren."
    ),

    # 8. FLEISCH & PROTEIN: SCHWEFELPORLING (CHICKEN OF THE WOODS)
    WildSubstitute(
        id="schwefelporling",
        name_de="Gemeiner Schwefelporling",
        name_botanical="Laetiporus sulphureus",
        replaced_supermarket_item="Hähnchenbrust, Kalbsschnitzel, Tofu",
        category=SupermarketCategory.FLEISCH_PROTEIN,
        habitats=[HabitatType.WALD],
        plant_parts_used=[PlantPart.MUSHROOM_BODY],
        harvest_months=[5, 6, 7, 8, 9],
        identification_features=[
            "Leuchtend schwefelgelbe bis lachs-orange dachziegelartige Konsolen an alten Laubbäumen (Eichen, Weiden, Obstbäume)",
            "Fleisch junger Exemplare ist saftig, weich und faserig wie echtes Hühnerfleisch",
            "Porenunterseite grell zitronengelb"
        ],
        preparation_methods=[PreparationMethod.COOKING_REQUIRED],
        preparation_instructions="NIEMALS ROH ESSEN! Mindestens 15-20 Minuten durchkochen oder in Scheiben wie Schnitzel scharf anbraten. Nur die weichen Außenränder ernten.",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=40.0,
            protein_g=6.5,
            fat_g=0.8,
            carbs_g=2.5,
            fiber_g=3.2,
            key_micronutrients={
                "Kalium": "300 mg",
                "Vitamin D2": "Ergosterin",
                "Phosphor": "Wichtig für Knochen"
            },
            supermarket_comparison="Schmeckt, riecht und fasert exakt wie Hähnchenbrustfilet – das perfekte Wildfleisch ohne Jagdwaffe!"
        ),
        lookalike_risks=[
            LookalikeRisk(
                deadly_lookalike_name_de="Schwefelporling an Eibe oder Robinie",
                deadly_lookalike_botanical="Taxus baccata / Robinia",
                toxin="Taxin / Robin (Herzstillstand bzw. Lektine)",
                lethal_danger="TÖDLICH! Der Pilz saugt die Giftstoffe des Wirtsbaums auf!",
                distinction_rules=[
                    "NIEMALS Schwefelporlinge von Nadelbäumen (besonders Eiben!) ernten",
                    "NIEMALS von Robinien (Scheinakazien) ernten",
                    "Ausschließlich von Eichen, Weiden, Pappeln oder alten Obstbäumen ernten"
                ],
                absolute_veto_criterion="Wächst der Pilz an einer Eibe oder Robinie -> SOFORTIGES VETO! LEBENSGEFAHR!"
            )
        ],
        child_safety=ChildSafetyWarning(
            suitable_for_children=True,
            minimum_age_years=3,
            toxicological_notes="Gut durchgegart ein Festessen. Vorab winzige Probemenge testen, da Einzelfälle von Pilzunverträglichkeit vorkommen.",
            max_dosage="Kleine Portion gut durchgegart."
        ),
        survival_storage_days=3,
        survival_notes="Kann in Streifen geschnitten getrocknet oder geräuchert werden – wird zu haltbarem 'Wald-Jerky'."
    ),

    # 9. SPEISEÖL & FETTE: HASELNUSS
    WildSubstitute(
        id="haselnuss",
        name_de="Gemeine Haselnuss",
        name_botanical="Corylus avellana",
        replaced_supermarket_item="Butter, Speiseöl, Pflanzenfett, Schmalz",
        category=SupermarketCategory.SPEISEOEL_FETTE,
        habitats=[HabitatType.WALD, HabitatType.WIESE, HabitatType.GARTEN],
        plant_parts_used=[PlantPart.SEEDS],
        harvest_months=[9, 10],
        identification_features=[
            "Mehrstämmiger Strauch mit samtig behaarten, rundlich-herzförmigen Blättern",
            "Nüsse in grüner glockiger Hülle, ab September braun herabfallend"
        ],
        preparation_methods=[PreparationMethod.RAW_SAFE, PreparationMethod.DRYING_FERMENTING],
        preparation_instructions="Nüsse knacken. Kerne roh essen oder im Mörser zerreiben. Durch Auskochen der zerstoßenen Nüsse schwimmt reines, goldgelbes Haselnussöl oben auf!",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=650.0,
            protein_g=15.0,
            fat_g=61.6,
            carbs_g=10.5,
            fiber_g=8.2,
            key_micronutrients={
                "Vitamin E": "26 mg (stärkstes Antioxidans)",
                "Magnesium": "160 mg",
                "Ölsäure": "Herzschützende Fettsäuren"
            },
            supermarket_comparison="Mit 650 kcal pro 100g die energiereichste Fett- und Kalorienbombe der heimischen Natur."
        ),
        lookalike_risks=[],
        child_safety=ChildSafetyWarning(
            suitable_for_children=True,
            minimum_age_years=1,
            toxicological_notes="Für Kleinkinder wegen Erstickungsgefahr immer fein reiben/mörsern. Extrem energiereich.",
            max_dosage="Unbedenklich."
        ),
        survival_storage_days=365,
        survival_notes="In der Schale kühl und trocken gelagert über 12 Monate haltbar – das ultimative Winter-Depot."
    ),

    # 10. SPEISEÖL & FETTE: BUCHECKERN
    WildSubstitute(
        id="bucheckern",
        name_de="Rotbuche (Bucheckern)",
        name_botanical="Fagus sylvatica",
        replaced_supermarket_item="Olivenöl, Rapsöl, Nüsse",
        category=SupermarketCategory.SPEISEOEL_FETTE,
        habitats=[HabitatType.WALD],
        plant_parts_used=[PlantPart.SEEDS],
        harvest_months=[9, 10, 11],
        identification_features=[
            "Silbergraue glatte Rinde des Buchenstammes",
            "Dreikantige, braun glänzende Früchte in vierklappigem, borstigem Fruchtbecher"
        ],
        preparation_methods=[PreparationMethod.ROASTING_REQUIRED, PreparationMethod.COOKING_REQUIRED],
        preparation_instructions="LEBENSWICHTIGE HITZEBEHANDLUNG: Bucheckern schälen und in der Pfanne oder am Feuer trocken rösten ODER mit kochendem Wasser überbrühen. Hitze zerstört das giftige Alkaloid Fagin vollständig. Danach zu Öl pressen oder als Nussmehl essen.",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=576.0,
            protein_g=18.0,
            fat_g=45.0,
            carbs_g=14.0,
            fiber_g=15.0,
            key_micronutrients={
                "Linolsäure": "Wertvolle Omega-6-Fette",
                "Eisen": "Hoch",
                "Zink": "Mittel"
            },
            supermarket_comparison="Aus gerösteten Bucheckern gepresstes Öl ist geschmacklich und qualitativ Olivenöl ebenbürtig."
        ),
        lookalike_risks=[],
        child_safety=ChildSafetyWarning(
            suitable_for_children=False,
            minimum_age_years=3,
            toxicological_notes="ACHTUNG: Rohe Bucheckern führen bei Kleinkindern schon ab 5 Stück zu schweren Vergiftungen (Fagin)! NUR VOLLSTÄNDIG DURCHGERÖSTET GEBEN!",
            max_dosage="Nur geröstet, max. 1 kleine Handvoll."
        ),
        survival_storage_days=180,
        survival_notes="In Buchen-Mastjahren fallen Hunderte Kilogramm nahrhafter Früchte pro Hektar zu Boden."
    ),

    # 11. ZITRONE & VITAMIN C: HAGEBUTTE
    WildSubstitute(
        id="hagebutte",
        name_de="Hundsrose (Hagebutten)",
        name_botanical="Rosa canina",
        replaced_supermarket_item="Zitrone, Vitamin-C-Pulver, Tomatenmark",
        category=SupermarketCategory.ZITRONE_VITAMINC,
        habitats=[HabitatType.WIESE, HabitatType.WALD, HabitatType.RUDERAL],
        plant_parts_used=[PlantPart.FRUIT],
        harvest_months=[9, 10, 11, 12],
        identification_features=[
            "Dorniger Strauch mit roten ovalen Scheinfrüchten",
            "An der Spitze der Frucht Reste der vertrockneten Kelchblätter"
        ],
        preparation_methods=[PreparationMethod.RAW_SAFE, PreparationMethod.DRYING_FERMENTING],
        preparation_instructions="Hagebutte halbieren, Nüsschen und Härchen ('Juckpulver') entfernen. Rote Schale roh kauen oder bei max. 40°C trocknen und pulverisieren. Nicht lange kochen, um Vitamin C zu erhalten!",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=110.0,
            protein_g=1.6,
            fat_g=0.5,
            carbs_g=21.0,
            fiber_g=6.0,
            key_micronutrients={
                "Vitamin C": "1.250–1.500 mg (25x mehr als Zitrone!)",
                "Lycopin": "Zellschutz",
                "Galaktolipide": "Entzündungshemmend"
            },
            supermarket_comparison="Eine einzige Hagebutte liefert mehr reines Vitamin C als eine halbe Zitrone aus dem Supermarkt!"
        ),
        lookalike_risks=[
            LookalikeRisk(
                deadly_lookalike_name_de="Schwarze Tollkirsche",
                deadly_lookalike_botanical="Atropa belladonna",
                toxin="Atropin, Scopolamin (TÖDLICH)",
                lethal_danger="Tödliche Atemlähmung und Koma ab 3 Beeren bei Kindern!",
                distinction_rules=[
                    "Tollkirschen sind SCHWARZ glänzend und wachsen auf einem grünen 5er-Kelchstern",
                    "Hagebutten sind leuchtend ROT und wachsen an dornigen Sträuchern"
                ],
                absolute_veto_criterion="Schwarze Beeren mit grünem Sternchen niemals berühren!"
            )
        ],
        child_safety=ChildSafetyWarning(
            suitable_for_children=True,
            minimum_age_years=1,
            toxicological_notes="Samenhärchen entfernen, da sie die Speiseröhre reizen. Fruchtfleisch ist die perfekte Skorbut-Prävention für Kinder.",
            max_dosage="2-3 Früchte täglich genügen für vollen Vitaminschutz."
        ),
        survival_storage_days=180,
        survival_notes="Getrocknetes Hagebuttenpulver schützt im Katastrophenwinter zuverlässig vor Skorbut und Zahnfleischbluten."
    ),

    # 12. ZUCKER & SÜSSE: BIRKENSAFT
    WildSubstitute(
        id="birkensaft",
        name_de="Gemeine Hänge-Birke (Baumsaft)",
        name_botanical="Betula pendula",
        replaced_supermarket_item="Zucker, Ahornsirup, Glukose",
        category=SupermarketCategory.ZUCKER_SUESSE,
        habitats=[HabitatType.WALD, HabitatType.WIESE],
        plant_parts_used=[PlantPart.SAP],
        harvest_months=[3, 4],
        identification_features=[
            "Charakteristische weiße, papierartig abblätternde Rinde",
            "Dreieckig bis rautenförmige Blätter mit gezähntem Rand"
        ],
        preparation_methods=[PreparationMethod.RAW_SAFE, PreparationMethod.COOKING_REQUIRED],
        preparation_instructions="Im zeitigen Frühjahr (März) Stamm in 1 m Höhe 3 cm tief anbohren. Röhrchen einstecken und Saft auffangen (bis zu 5 L/Tag). Frisch trinken oder durch langes Einkochen zu dickem, süßem Sirup reduzieren. Bohrloch danach mit Holzdübel verschließen!",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=8.0,
            protein_g=0.1,
            fat_g=0.0,
            carbs_g=2.0,
            fiber_g=0.0,
            key_micronutrients={
                "Xylit-Vorstufen": "Zahnfreundliche Süße",
                "Kalium": "Mineralstoffreich",
                "Vitamin C": "Frisch enthalten"
            },
            supermarket_comparison="Eingekocht ergibt Birkensaft feinsten süßen Sirup – völlig unabhängig von Industrie-Raffinadezucker!"
        ),
        lookalike_risks=[],
        child_safety=ChildSafetyWarning(
            suitable_for_children=True,
            minimum_age_years=1,
            toxicological_notes="Herrlich erfrischender und völlig ungiftiger Durstlöscher für die ganze Familie.",
            max_dosage="Täglich 1-2 Gläser frisch trinken."
        ),
        survival_storage_days=4,
        survival_notes="Eingekochter Sirup ist jahrelang haltbar und spendet schnelle Not-Energie bei Unterkühlung oder Erschöpfung."
    ),

    # 13. KAFFEE & TEE: LÖWENZAHNWURZEL-KAFFEE
    WildSubstitute(
        id="loewenzahn-kaffee",
        name_de="Gewöhnlicher Löwenzahn (Wurzelkaffee)",
        name_botanical="Taraxacum officinale",
        replaced_supermarket_item="Bohnenkaffee, Getreidekaffee, Muckefuck",
        category=SupermarketCategory.KAFFEE_TEE,
        habitats=[HabitatType.WIESE, HabitatType.GARTEN],
        plant_parts_used=[PlantPart.ROOT],
        harvest_months=[10, 11, 12, 1, 2, 3],
        identification_features=[
            "Lange, kräftige Pfahlwurzel (bis zu 30 cm tief im Boden)",
            "Grundständige Blattrosette mit gelben Blütenköpfen und weißem Milchsaft"
        ],
        preparation_methods=[PreparationMethod.ROASTING_REQUIRED, PreparationMethod.DRYING_FERMENTING],
        preparation_instructions="Wurzeln graben, gründlich mit Wurzelbürste waschen. In 4 mm Würfel schneiden, vortrocknen. In trockener Pfanne oder auf heißem Stein dunkelbraun rösten (Inulin karamellisiert zu Kaffeearomen!). Fein mahlen und mit kochendem Wasser aufbrühen.",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=180.0,
            protein_g=5.0,
            fat_g=1.2,
            carbs_g=35.0,
            fiber_g=28.0,
            key_micronutrients={
                "Inulin": "Bis zu 40% (stärkt Darmflora)",
                "Taraxacin": "Leber- und Gallenstimulans",
                "Cholin": "Fettstoffwechsel"
            },
            supermarket_comparison="Schmeckt aromatisch wie kräftiger Röstkaffee, ist koffeinfrei und reinigt die Leber von Giftstoffen."
        ),
        lookalike_risks=[],
        child_safety=ChildSafetyWarning(
            suitable_for_children=True,
            minimum_age_years=3,
            toxicological_notes="Koffeinfrei und verdauungsfördernd. Für Kinder in kleinen Tassen geeignet.",
            max_dosage="1-2 Tassen täglich."
        ),
        survival_storage_days=365,
        survival_notes="Geröstetes Löwenzahn-Wurzelpulver hält unbegrenzt und erhält die Moral in Krisensituationen."
    ),

    # 14. GEWÜRZE & WÜRZE: BÄRLAUCH
    WildSubstitute(
        id="baerlauch",
        name_de="Bärlauch (Waldknoblauch)",
        name_botanical="Allium ursinum",
        replaced_supermarket_item="Knoblauch, Zwiebeln, Schnittlauch",
        category=SupermarketCategory.GEWUERZE_SALZ,
        habitats=[HabitatType.WALD],
        plant_parts_used=[PlantPart.LEAVES, PlantPart.ROOT],
        harvest_months=[3, 4, 5],
        identification_features=[
            "Jedes Blatt entspringt mit einem EINZELNEN, dreikantigen Stiel aus dem Boden",
            "Blattoberseite glänzend, Blattunterseite SEIDENMATT",
            "Knickt beim Umbiegen mit feinem Geräusch ab",
            "Intensiver, durchdringender Knoblauchgeruch"
        ],
        preparation_methods=[PreparationMethod.RAW_SAFE],
        preparation_instructions="Frisch waschen und roh hacken für Suppen, Wildkräuterbutter und Eintöpfe. Kochen zerstört das schwefelhaltige Allicin-Aroma.",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=19.0,
            protein_g=1.4,
            fat_g=0.2,
            carbs_g=2.9,
            fiber_g=2.2,
            key_micronutrients={
                "Allicin": "Hochwirksames natürliches Antibiotikum",
                "Vitamin C": "150 mg",
                "Schwefel": "Entgiftet Schwermetalle"
            },
            supermarket_comparison="Ersetzt frischen Supermarkt-Knoblauch vollkommen und wirkt als natürliches Breitspektrum-Antibiotikum!"
        ),
        lookalike_risks=[
            LookalikeRisk(
                deadly_lookalike_name_de="Herbstzeitlose",
                deadly_lookalike_botanical="Colchicum autumnale",
                toxin="Colchicin (TÖDLICH, 2-5g Blätter töten einen Erwachsenen!)",
                lethal_danger="QUALVOLLER TOD durch Multiorganversagen nach 2-3 Tagen. KEIN GEGENGIFT BEKANNT!",
                distinction_rules=[
                    "Herbstzeitlose wächst OHNE Blattstiel tulpenartig aus einem Scheinstängel",
                    "Blätter sind steif, ledrig und BEIDSEITIG glänzend",
                    "Herbstzeitlose riecht NICHT nach Knoblauch!"
                ],
                absolute_veto_criterion="Wachsen Blätter tulpenartig ohne eigenen Stiel aus einer gemeinsamen Hülle -> SOFORT VETO!"
            ),
            LookalikeRisk(
                deadly_lookalike_name_de="Maiglöckchen",
                deadly_lookalike_botanical="Convallaria majalis",
                toxin="Convallatoxin (Herzglykosid, TÖDLICH)",
                lethal_danger="Schwere Herzrhythmusstörungen und Herzstillstand.",
                distinction_rules=[
                    "Maiglöckchen wachsen IMMER zu zweit an einem gemeinsamen Stiel",
                    "Blattunterseite ist STARK GLÄNZEND (Bärlauch ist matt!)"
                ],
                absolute_veto_criterion="Glänzt die Blattunterseite oder sitzen 2 Blätter an einem Stiel -> VETO!"
            )
        ],
        child_safety=ChildSafetyWarning(
            suitable_for_children=False,
            minimum_age_years=10,
            toxicological_notes="KINDER DÜRFEN BÄRLAUCH WEGEN DER TÖDLICHEN HERBSTZEITLOSEN-GEFAHR NIEMALS ALLEINE SAMMELN! Verzehr nur nach botanischer Expertenkontrolle.",
            max_dosage="Als Würzbeigabe."
        ),
        survival_storage_days=5,
        survival_notes="In Olivenöl oder Haselnussöl eingelegt hält Bärlauch monatelang als Notfall-Antibiotikum."
    ),

    # 15. GEWÜRZE & MINERALIEN: ASCHE-MINERALSALZ
    WildSubstitute(
        id="pflanzen-salz",
        name_de="Huflattich / Rohrkolben-Pflanzensalz",
        name_botanical="Tussilago farfara / Typha",
        replaced_supermarket_item="Speisesalz (NaCl), Elektrolyte, Mineralpulver",
        category=SupermarketCategory.GEWUERZE_SALZ,
        habitats=[HabitatType.RUDERAL, HabitatType.GEWAESSER],
        plant_parts_used=[PlantPart.ASH],
        harvest_months=[4, 5, 6, 7, 8, 9, 10],
        identification_features=[
            "Große filzige, hufeisenförmige Blätter des Huflattichs an Schotterwegen oder Rohrkolbenblätter",
            "Vollständig getrocknetes Blattwerk"
        ],
        preparation_methods=[PreparationMethod.ASH_EXTRACTION],
        preparation_instructions="Blätter trocknen und zu feiner weißer Asche verbrennen. Asche in heißem Wasser aufkochen und durch Tuch oder Kohlefilter abseihen. Das klare, salzige Filtrat in einer flachen Schale eindampfen lassen – zurück bleibt reines Mineralsalz!",
        nutrition_per_100g=NutritionalProfile(
            calories_kcal=0.0,
            protein_g=0.0,
            fat_g=0.0,
            carbs_g=0.0,
            fiber_g=0.0,
            key_micronutrients={
                "Kaliumchlorid": "Essentieller Elektrolyt",
                "Natrium": "Verhindert Hyponatriämie",
                "Spurenmineralien": "Magnesium, Calcium, Eisen"
            },
            supermarket_comparison="Die einzige mitteleuropäische Notfallmethode, um im Binnenland lebensrettende Salze zu gewinnen!"
        ),
        lookalike_risks=[],
        child_safety=ChildSafetyWarning(
            suitable_for_children=True,
            minimum_age_years=1,
            toxicological_notes="Das Verbrennen zu Asche zerstört organische Giftstoffe. Als Würzsalz unbedenklich.",
            max_dosage="Wie normales Speisesalz dosieren."
        ),
        survival_storage_days=1000,
        survival_notes="Verhindert den gefürchteten Salzmangel-Kreislaufkollaps bei mehrmonatigen Notlagen."
    )
]


def get_all_substitutes() -> List[WildSubstitute]:
    """Returns all available wild substitutes."""
    return WILD_SUBSTITUTES_DATABASE


def find_substitutes_for_item(query: str) -> List[WildSubstitute]:
    """Finds wild substitutes for a given supermarket item or plant name."""
    query_lower = query.lower().strip()
    results = []
    for item in WILD_SUBSTITUTES_DATABASE:
        if (
            query_lower in item.replaced_supermarket_item.lower()
            or query_lower in item.name_de.lower()
            or query_lower in item.name_botanical.lower()
            or query_lower in item.category.value.lower()
        ):
            results.append(item)
    return results
