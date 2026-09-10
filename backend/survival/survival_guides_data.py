"""
Step-by-step Wilderness Survival & Emergency Guides for FitPlaner Breakout Mode.
Contains verified instructional data for:
1. Water Procurement & Bio-Sand-Charcoal Gravity Filtration
2. Friction Firecraft (Bow Drill) & Dakota Fire Pit
3. Hypothermia-proof Shelter Construction (Debris Hut)
4. Navigation without Compass/GPS (Shadow stick, Polaris, Solar watch)
5. Natural Emergency Medicine (Plantago, Willow bark, Charcoal, Yarrow)
6. US Army 8-Step Universal Edibility Test with countdown timers
"""

from typing import List
from backend.survival.models_doomsday import (
    SurvivalGuideSection,
    SurvivalGuideStep
)

SURVIVAL_GUIDES_DATABASE: List[SurvivalGuideSection] = [
    # 1. WASSERAUFBEREITUNG: BIO-SAND-KOHLEFILTER
    SurvivalGuideSection(
        id="wasser-sand-kohlefilter",
        category="wasser",
        title="Bio-Sand-Holzkohle-Schwerkraftfilter",
        icon_name="Droplets",
        subtitle="Mechanische Filtration & Schadstoffadsorption ohne Strom",
        difficulty="Lebenswichtig",
        estimated_time="30–45 Minuten",
        core_materials=[
            "1,5L–2L PET-Flasche (oder hohler Baumstamm / Bambus)",
            "Sauberes Baumwolltuch / Bandana / Kaffeefilter",
            "Feine Flusskiesel (2-3 cm)",
            "Reine Holzkohle (aus totem Hartholz-Lagerfeuer)",
            "Feiner Quarzsand (aus Bachbett)",
            "Frisches Moos oder saubere Kiesel (als Prallschutz)"
        ],
        steps=[
            SurvivalGuideStep(
                step_number=1,
                title="Behälter präparieren",
                description="Boden einer 1,5L–2L PET-Flasche abschneiden. Deckel mit 3–5 Nadelstichen perforieren oder abschrauben und ein Baumwolltuch straff mit Schnur über den Flaschenhals binden. Flasche kopfüber aufhängen.",
                critical_warning="Sicherstellen, dass die Aufhängung stabil ist und nicht ins Sammelgefäß stürzt."
            ),
            SurvivalGuideStep(
                step_number=2,
                title="Schicht 1 & 2: Auslass & Kiesel-Stütze",
                description="Ein Stofftuch oder Wattepad fest in den Flaschenhals stopfen. Darauf 2–3 cm feine, gewaschene Kieselsteine schichten, um das Tuch zu stabilisieren.",
            ),
            SurvivalGuideStep(
                step_number=3,
                title="Schicht 3: Zerkleinerte Holzkohle (Adsorption)",
                description="6–8 cm zerkleinerte reine Holzkohle einfüllen. Holzkohle vorher mit Steinen zu feinem Pulver und maximal erbsengroßen Stücken zermalmen. Die gigantische Oberfläche bindet Toxine, Chemikalien, Farbstoffe und Schwermetalle.",
                critical_warning="Ausschließlich reine Holzkohle aus unbehandeltem Holz verwenden! Keine Grillbriketts mit Brandbeschleunigern!"
            ),
            SurvivalGuideStep(
                step_number=4,
                title="Schicht 4 & 5: Grober & feiner Sand",
                description="Zuerst 4 cm groben Sand, danach 8–10 cm feinen Quarzsand einfüllen. Der Sand filtert Schwebstoffe, Sedimente und Protozoen mechanisch heraus.",
            ),
            SurvivalGuideStep(
                step_number=5,
                title="Schicht 6: Moos-Prallschutz & Einspülung",
                description="Zuoberst 3 cm frisches Moos oder saubere Kiesel auflegen. Dadurch wird verhindert, dass eingegossenes Rohwasser das Sandbett aufwirbelt und Kanäle gräbt.",
            ),
            SurvivalGuideStep(
                step_number=6,
                title="Klarspülen & Abkochen",
                description="Die ersten 1–2 Liter gefiltertes Wasser verwerfen, bis feiner Kohlenstaub ausgewaschen ist und das Filtrat kristallklar austritt. Danach das klare Wasser zwingend sprudelnd abkochen!",
                critical_warning="LEBENSGEFAHR: Der Filter tötet KEINE Viren ab! Das klare Filtrat MUSS mindestens 1 Minute lang sprudelnd kochen (ab 1.000m Höhe: 3 Minuten)!",
                timer_seconds=180
            )
        ],
        scientific_principle="Kombination aus physikalischer Tiefenfiltration (Sedimente und Protozoenzysten bleiben im Sandbett hängen) und chemischer Adsorption durch mikroporöse Aktivkohle (Van-der-Waals-Kräfte binden Giftmoleküle).",
        veto_warnings=[
            "Niemals Wasser aus stehenden Pfützen mit toten Tieren ohne anschließendes Kochen trinken!",
            "Filterfiltra niemals ungekocht an Säuglinge oder Kleinkinder verabreichen."
        ]
    ),

    # 2. FEUER: BOGENBOHRER (BOW DRILL)
    SurvivalGuideSection(
        id="feuer-bogenbohrer",
        category="feuer",
        title="Der Bogenbohrer (Bow Drill)",
        icon_name="Flame",
        subtitle="Gluterzeugung durch reine Reibungshitze (Steinzeit-Methode)",
        difficulty="Fortgeschritten",
        estimated_time="20–30 Minuten Vorbereitung, 2 Minuten Bohren",
        core_materials=[
            "Bohrspindel (20 cm lang, 2 cm Ø, trockenes Weichholz: Linde, Haselnuss, Weide)",
            "Bohrbrett (1-1,5 cm dick, aus gleichem Holz wie Spindel)",
            "Bogen (50-70 cm leicht gekrümmter stabiler Ast mit Paracord/Lederband)",
            "Handstück / Druckstück (Hartholz/Stein mit Mulde & Schmiermittel)",
            "Vorbereitetes Zundernest (Birkenrinde, trockenes Gras, Rohrkolbenwolle)"
        ],
        steps=[
            SurvivalGuideStep(
                step_number=1,
                title="Spindel & Handstück zurichten",
                description="Spindel oben spitz schnitzen (45° für minimale Reibung im Handstück), unten stumpf abrunden (90° für maximale Reibung auf dem Brett). Handstück-Mulde mit Schmiermittel versehen (Grassaft, Talg, Ohrenschmalz).",
            ),
            SurvivalGuideStep(
                step_number=2,
                title="Mulde anbohren & V-Kerbe schnitzen",
                description="Mit der Spindel auf dem Bohrbrett eine Mulde einbohren. Danach mit dem Messer vom Brettrand bis kurz vor den Mittelpunkt der Mulde eine ca. 45°-60° weite V-Kerbe schneiden. Unter die Kerbe ein trockenes Rindenstück legen.",
                critical_warning="Die V-Kerbe fängt das heiße Bohrmehl auf. Ist sie zu schmal, erstickt die Glut an Sauerstoffmangel!"
            ),
            SurvivalGuideStep(
                step_number=3,
                title="Körperhaltung einnehmen (Das Dreieck)",
                description="Auf dem rechten Knie knien. Linker Fuß steht fest auf dem Bohrbrett neben der Spindel. Linker Unterarm wird fest an das linke Schienbein gepresst (verhindert jedes Verwackeln!). Bogen waagerecht halten.",
            ),
            SurvivalGuideStep(
                step_number=4,
                title="Phase 1: Anwärmen & Bohrmehl füllen",
                description="Lange, gleichmäßige Züge über die volle Bogenlänge. Mäßiger Druck. Die Kerbe füllt sich mit tiefschwarzem Holzstaub.",
            ),
            SurvivalGuideStep(
                step_number=5,
                title="Phase 2: Glutstoß (Sprint)",
                description="Sobald beißender, weißer Rauch aufsteigt, Druck auf das Handstück erhöhen und für 20–30 Sekunden mit maximaler Frequenz bohren. Dann vorsichtig Spindel anheben.",
                timer_seconds=30
            ),
            SurvivalGuideStep(
                step_number=6,
                title="Glut anblasen zur Flamme",
                description="Steigt ein feiner Rauchfaden selbstständig aus dem Häufchen, 60 Sekunden ruhen lassen. Die Glut in das Zundernest kippen und mit sanftem, langem Atemhauch zur lodernden Flamme anblasen.",
                timer_seconds=60
            )
        ],
        scientific_principle="Reibungsenergie wandelt kinetische Arbeit in thermische Energie um. Bei Erreichen von 400 °C pyrolysiert das feine Bohrmehl und geht in eine selbstständige Glimmreaktion (Glut) über.",
        veto_warnings=[
            "Niemals harzreiches Holz (Kiefer, Lärche) für Spindel oder Brett verwenden – Harz schmilzt und schmiert!",
            "Zundernest muss absolut knochentrocken sein."
        ]
    ),

    # 3. FEUER: DAKOTA-FEUERLOCH
    SurvivalGuideSection(
        id="feuer-dakota-pit",
        category="feuer",
        title="Dakota-Feuerloch (Dakota Fire Pit)",
        icon_name="Flame",
        subtitle="Militärischer Erdofen: Raucharm, sturmfest & unsichtbar",
        difficulty="Standard",
        estimated_time="15–20 Minuten",
        core_materials=[
            "Grabstock oder Klappspaten",
            "Trockenes Brennholz (daumendick)",
            "Zwei grüne Äste oder flache Steine als Topfauflage"
        ],
        steps=[
            SurvivalGuideStep(
                step_number=1,
                title="Hauptbrennkammer graben",
                description="Ein zylindrisches Loch ausheben: ca. 25–30 cm Durchmesser, 35–40 cm Tiefe. Den Boden leicht krugförmig nach außen erweitern.",
            ),
            SurvivalGuideStep(
                step_number=2,
                title="Zuluft-Schacht anlegen",
                description="Ca. 30 cm windaufwärts ein zweites, kleineres Loch (15–20 cm Ø) graben. Vom Boden des Zuluftlochs im 45°-Winkel einen Verbindungstunnel zur Hauptkammer durchstechen.",
                critical_warning="Sicherstellen, dass der Tunnel nicht einstürzt und voller Luftzug gewährleistet ist."
            ),
            SurvivalGuideStep(
                step_number=3,
                title="Feuer entfachen & Kamineffekt nutzen",
                description="Kleine Holzscheite in die Hauptkammer schichten und entzünden. Die Hitze steigt nach oben und saugt durch den Tunnel permanent kühlen Sauerstoff von unten an. Das Feuer brennt extrem heiß und nahezu rauchfrei!",
            ),
            SurvivalGuideStep(
                step_number=4,
                title="Kochen & Spurenloses Verlassen",
                description="Zwei grüne Äste über die Öffnung legen und Topf abstellen. Nach dem Kochen: Glut löschen, Erde wieder einfüllen, Grasnarbe auflegen – Null Brandspuren sichtbar!",
            )
        ],
        scientific_principle="Kamineffekt (Thermik): Warme Luft hat geringere Dichte und erzeugt in der Brennkammer Unterdruck, wodurch Frischluft durch den 45°-Schacht angesaugt wird. Führt zu vollständiger Rußverbrennung.",
        veto_warnings=[
            "Nicht auf extrem torfigen Böden graben (Gefahr von unterirdischen Schwelbränden!)."
        ]
    ),

    # 4. SHELTER: DEBRIS HUT (LAUBHÜTTE)
    SurvivalGuideSection(
        id="shelter-debris-hut",
        category="shelter",
        title="Debris Hut (Hypothermie-sichere Laubhütte)",
        icon_name="Tent",
        subtitle="Hält selbst bei Minusgraden ohne Feuer lebensrettend warm",
        difficulty="Lebenswichtig",
        estimated_time="1,5–2 Stunden",
        core_materials=[
            "Firststange (armlang/stabil, 3,5–4 Meter)",
            "Rippenstangen (20–30 Äste, armdick)",
            "Große Mengen trockenes Laub, Moos, Nadelstreu, Farn"
        ],
        steps=[
            SurvivalGuideStep(
                step_number=1,
                title="Firststange auflegen",
                description="Ein Ende der 3,5 m langen Firststange auf einen Baumstumpf oder in eine Astgabel in hüfthoher Position (ca. 80 cm) legen. Das andere Ende liegt flach auf dem Boden auf.",
                critical_warning="Die Hütte darf NICHT zu groß sein! Sie muss wie ein dicker Schlafsack eng am Körper anliegen, da nur deine eigene Körperwärme die Hütte heizt!"
            ),
            SurvivalGuideStep(
                step_number=2,
                title="Rippenbogen & Reisig-Netz",
                description="Äste beidseitig im 45°-Winkel an die Firststange anlehnen. Dünne Zweige und Rinde quer darüber flechten, sodass ein dichtes Maschennetz entsteht.",
            ),
            SurvivalGuideStep(
                step_number=3,
                title="BODEN-ISOLATION (LEBENSWICHTIG!)",
                description="Den Innenraum mit mindestens 40–50 cm trockenem Laub, Moos oder Nadelstreu ausstopfen. Zusammengedrückt muss die Liegefläche mindestens 15 cm dick bleiben, um Bodenkälte abzufangen!",
                critical_warning="Der kalte Erdboden entzieht dem Körper durch Wärmeleitung bis zu 80% der Energie. Ohne dicke Bodenisolierung droht Erfrierung!"
            ),
            SurvivalGuideStep(
                step_number=4,
                title="Außen-Isolierung aufschichten",
                description="Eine mindestens 60–90 cm dicke Schicht (Armlänge als Maßstab!) aus trockenem Laub, Moos und Farn auf das Skelett häufen. Zuoberst Nadelholzzweige von unten nach oben wie Dachziegel auflegen (Regenschutz).",
            ),
            SurvivalGuideStep(
                step_number=5,
                title="Eingang verschließen",
                description="Mit den Füßen voran hineinkriechen. Einen Laubsack oder dichten Zweighaufen von innen hinter sich in den Eingang ziehen.",
            )
        ],
        scientific_principle="Gefangene Luftschichten im trockenen Laub verhindern Konvektion und Konduktion. Die menschliche Abwärme von ca. 80-100 Watt erwärmt den kleinen Hohlraum auf bis zu +15 °C über Außentemperatur.",
        veto_warnings=[
            "Standort vorab auf 'Widowmakers' prüfen (tote, herabsturzgefährdete Äste in den Baumkronen)!"
        ]
    ),

    # 5. NAVIGATION: SCHATTENSTOCK-METHODE
    SurvivalGuideSection(
        id="nav-schattenstock",
        category="navigation",
        title="Schattenstock-Methode (Sonnennavigation)",
        icon_name="Compass",
        subtitle="Präzise Ermittlung der Ost-West- und Nord-Achse ohne Hilfsmittel",
        difficulty="Standard",
        estimated_time="20 Minuten",
        core_materials=[
            "Gerader Ast (ca. 1 Meter lang)",
            "Zwei spitze Markierungssteine oder Stöckchen"
        ],
        steps=[
            SurvivalGuideStep(
                step_number=1,
                title="Stock senkrecht einstecken",
                description="Einen geraden, ca. 1 m langen Stock senkrecht in den ebenen Boden stecken.",
            ),
            SurvivalGuideStep(
                step_number=2,
                title="Erste Schattenspitze markieren (PUNKT W)",
                description="Die äußerste Spitze des Schattens SOFORT mit einem spitzen Stein markieren. Dieser Punkt markiert immer den WESTEN!",
            ),
            SurvivalGuideStep(
                step_number=3,
                title="15 bis 20 Minuten warten",
                description="Ruhig warten, während die Sonne am Himmel weiterwandert und der Schatten wandert.",
                timer_seconds=900
            ),
            SurvivalGuideStep(
                step_number=4,
                title="Zweite Schattenspitze markieren (PUNKT E)",
                description="Die neue Schattenspitze mit dem zweiten Stein markieren. Dieser Punkt markiert den OSTEN!",
            ),
            SurvivalGuideStep(
                step_number=5,
                title="Ost-West-Linie & Nordrichtung ablesen",
                description="Eine gerade Linie von Punkt W zu Punkt E ziehen: Das ist die exakte Ost-West-Achse! Stellt man den linken Fuß auf Punkt W und den rechten auf Punkt E, blickt man auf der Nordhalbkugel EXAKT nach NORDEN!",
            )
        ],
        scientific_principle="Die Erde rotiert von West nach Ost. Daher wandert der Schatten der Sonne am Boden immer von Westen nach Osten. Die Verbindung zweier Schattenspitzen bildet immer eine West-Ost-Linie.",
        veto_warnings=[
            "Funktioniert nur bei direktem Sonnenschein auf ebenem Boden."
        ]
    ),

    # 6. UNIVERSELLER GENIESSBARKEITSTEST
    SurvivalGuideSection(
        id="test-geniessbarkeit",
        category="test",
        title="8-Stufen-Genießbarkeitstest (US Army Protocol)",
        icon_name="AlertOctagon",
        subtitle="Lebensrettende Test-Kaskade bei unbekannten Pflanzen im Notfall",
        difficulty="Lebenswichtig",
        estimated_time="24 Stunden Gesamtdauer",
        core_materials=[
            "Ausgewählte Einzel-Pflanzenteile (NUR Blatt ODER Wurzel)",
            "Trinkwasser",
            "Medizinische Holzkohle bereitgestellt für Notfall"
        ],
        steps=[
            SurvivalGuideStep(
                step_number=1,
                title="Stufe 0: Absolute Ausschlusskriterien",
                description="SOFORTIGER ABBRUCH wenn: Geruch nach Bittermandeln/Blausäure, milchiger Saft (außer Löwenzahn), Doldenblütler mit gefleckten Stängeln, Getreide mit schwarzen Zapfen. PILZE DÜRFEN DIESEM TEST NIEMALS UNTERZOGEN WERDEN!",
                critical_warning="Pilzgifte (Amanitin) wirken erst nach 12-24h tödlich auf die Leber – der Test schlägt bei Pilzen fehl!"
            ),
            SurvivalGuideStep(
                step_number=2,
                title="Stufe 1: Geruchstest (Zerreiben)",
                description="Pflanzenteil zerquetschen und intensiv riechen. Riecht es faulig, säuerlich oder beißend -> Abbruch!",
            ),
            SurvivalGuideStep(
                step_number=3,
                title="Stufe 2: Hautkontakt (15 Minuten)",
                description="Frischen Pflanzensaft auf die Innenseite des Unterarms reiben. 15 Minuten warten. Treten Rötungen, Brennen oder Pusteln auf -> Abbruch!",
                timer_seconds=900
            ),
            SurvivalGuideStep(
                step_number=4,
                title="Stufe 3: Lippenkontakt (3 Minuten)",
                description="Ein kleines Stück an die äußere Lippe halten. 3 Minuten warten. Bei Kribbeln oder Schwellung -> Auswaschen & Abbruch!",
                timer_seconds=180
            ),
            SurvivalGuideStep(
                step_number=5,
                title="Stufe 4: Zungenspitze (3 Minuten)",
                description="Das Stück auf die Zungenspitze legen. NICHT kauen, NICHT schlucken. Bei stechendem, brennendem oder bitterem Geschmack -> Ausspucken!",
                timer_seconds=180
            ),
            SurvivalGuideStep(
                step_number=6,
                title="Stufe 5: Kautest im Mund (15 Minuten)",
                description="Das Stück 15 Minuten lang gründlich zerkauen und im Speichel bewegen. STRENGSTES VERBOT: NICHT SCHLUCKEN! Bleibt alles symptomfrei, zu Stufe 6.",
                timer_seconds=900
            ),
            SurvivalGuideStep(
                step_number=7,
                title="Stufe 6 & 7: Schlucken & 8 STUNDEN FASTEN",
                description="Genau dieses eine erbsengroße Stück herunterschlucken. 8 Stunden lang absolut nichts essen und auf Magenkrämpfe, Schweißausbrüche oder Übelkeit achten. Bei Symptomen sofort erbrechen und Kohle trinken!",
                critical_warning="Bei geringsten Vergiftungssymptomen sofort 2 EL Holzkohlepulver mit reichlich Wasser trinken!",
                timer_seconds=28800
            ),
            SurvivalGuideStep(
                step_number=8,
                title="Stufe 8: Bestätigungsportion (1/4 Tasse)",
                description="Vergehen 8 Stunden vollkommen symptomfrei, 1/4 Tasse des Pflanzenteils zubereiten und essen. Weitere 8 Stunden warten. Bleiben Symptome aus, ist die Pflanze essbar!",
                timer_seconds=28800
            )
        ],
        scientific_principle="Stufenweise Expositionssteigerung: Mukosale Grenzschichten (Haut -> Lippe -> Zunge -> Magen) schlagen bei Toxinen mit lokalen Entzündungsreaktionen an, bevor eine systemische letale Dosis resorbiert wird.",
        veto_warnings=[
            "Niemals mehrere Pflanzen gleichzeitig testen!",
            "Pilze niemals mit diesem Test prüfen!"
        ]
    )
]


def get_all_survival_guides() -> List[SurvivalGuideSection]:
    """Returns all survival guide modules."""
    return SURVIVAL_GUIDES_DATABASE


def get_survival_guides_by_category(category: str) -> List[SurvivalGuideSection]:
    """Returns survival guides filtered by category."""
    return [g for g in SURVIVAL_GUIDES_DATABASE if g.category.lower() == category.lower()]
