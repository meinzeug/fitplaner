"""
Curated healthy recipe database with detailed cooking steps, allergens, diet types, and public food images.
"""

from typing import List
from backend.models import Recipe, RecipeIngredient, DetailedInstruction


RECIPES_DATABASE: List[Recipe] = [
    # ==========================================
    # FRÜHSTÜCK (BROTDOSE TO-GO)
    # ==========================================
    Recipe(
        id="bf-1",
        title="Overnight Oats mit Heidelbeeren & Chiasamen",
        meal_type="breakfast_lunchbox",
        prep_time_minutes=5,
        cook_time_minutes=0,
        difficulty="Einfach",
        lunchbox_ready=True,
        base_calories=480,
        base_protein_g=24,
        base_carbs_g=62,
        base_fat_g=14,
        allergens=["laktose", "gluten"],
        diet_types=["vegetarian", "pescetarian", "omnivore"],
        ingredients=[
            RecipeIngredient(name="Haferflocken", base_amount=70, unit="g", category="Vollkorn & Hülsenfrüchte", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Heidelbeeren frisch", base_amount=80, unit="g", category="Obst & Gemüse", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Chiasamen", base_amount=15, unit="g", category="Gesunde Fette & Nüsse"),
            RecipeIngredient(name="Magerquark", base_amount=150, unit="g", category="Proteinquellen", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Mandelmilch ungesüßt", base_amount=100, unit="ml", category="Basics"),
        ],
        instructions=[
            "Haferflocken, Chiasamen und Magerquark mit Mandelmilch in einem Glas oder dichten Brotdosen-Behälter verrühren.",
            "Frische Heidelbeeren vorsichtig unterheben oder als Topping obenauf legen.",
            "Über Nacht im Kühlschrank quellen lassen und morgens direkt mitnehmen."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Ein sauberes Schraubglas oder deine Brotdose bereitstellen.",
                "Haferflocken und Chiasamen mit der Küchenwaage abwiegen.",
                "Frische Heidelbeeren kurz kalt abbrausen und trocken tupfen."
            ],
            cooking_steps=[
                "Haferflocken, Chiasamen, Magerquark und Mandelmilch im Behälter mit einem Löffel cremig verrühren.",
                "Die Heidelbeeren als fruchtige Schicht auf dem Haferbrei verteilen.",
                "Behälter fest verschließen und für mindestens 6 Stunden (oder über Nacht) in den Kühlschrank stellen."
            ],
            lunchbox_tips=[
                "Optimal für die Tasche: Ein dichtes Weck- oder Mason-Jar verhindert jegliches Auslaufen.",
                "Morgens einfach aus dem Kühlschrank greifen – kein Zeitaufwand vor der Arbeit!",
                "Bleibt in der Kühltasche problemlos den ganzen Tag frisch."
            ]
        ),
        tags=["Meal-Prep", "Ballaststoffreich", "Netto-Angebot", "Vegetarisch"],
        image_url="https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=500"
    ),
    Recipe(
        id="bf-2",
        title="High-Protein Skyr-Bowl mit Walnüssen & Apfel",
        meal_type="breakfast_lunchbox",
        prep_time_minutes=5,
        cook_time_minutes=0,
        difficulty="Einfach",
        lunchbox_ready=True,
        base_calories=450,
        base_protein_g=38,
        base_carbs_g=42,
        base_fat_g=14,
        allergens=["laktose", "nuesse"],
        diet_types=["vegetarian", "pescetarian", "omnivore"],
        ingredients=[
            RecipeIngredient(name="Skyr Natur", base_amount=300, unit="g", category="Proteinquellen", matched_offer_retailer="NP"),
            RecipeIngredient(name="Walnusskerne", base_amount=20, unit="g", category="Gesunde Fette & Nüsse", matched_offer_retailer="NP"),
            RecipeIngredient(name="Apfel", base_amount=120, unit="g", category="Obst & Gemüse"),
            RecipeIngredient(name="Zimt & Leinsamen", base_amount=10, unit="g", category="Gesunde Fette & Nüsse"),
        ],
        instructions=[
            "Skyr in die auslaufsichere Frühstücks-Brotdose füllen.",
            "Apfel in mundgerechte Würfel schneiden und mit einer Prise Zimt bestreuen.",
            "Walnusskerne grob hacken und zusammen mit Leinsamen über den Skyr geben."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Apfel waschen, vierteln, Kerngehäuse entfernen und in kleine Würfel schneiden.",
                "Walnusskerne mit den Händen grob zerbrechen oder kurz anrösten."
            ],
            cooking_steps=[
                "Skyr Natur in das Hauptfach der Brotdose füllen.",
                "Apfelstücke mit einer Prise Ceylon-Zimt bestäuben.",
                "Walnüsse und geschrotete Leinsamen als knuspriges Topping daraufgeben."
            ],
            lunchbox_tips=[
                "Wenn der Apfel erst am Mittag gegessen wird: Mit 2 Tropfen Zitronensaft beträufeln, damit er nicht braun wird.",
                "Löffel nicht vergessen!"
            ]
        ),
        tags=["High-Protein", "Super schnell", "NP-Angebot", "Zuckerfrei"],
        image_url="https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500"
    ),
    Recipe(
        id="bf-3",
        title="Vollkorn-Knäckebrot mit Bio-Ei & Avocado-Creme",
        meal_type="breakfast_lunchbox",
        prep_time_minutes=8,
        cook_time_minutes=7,
        difficulty="Einfach",
        lunchbox_ready=True,
        base_calories=460,
        base_protein_g=22,
        base_carbs_g=36,
        base_fat_g=24,
        allergens=["gluten", "eier"],
        diet_types=["vegetarian", "pescetarian", "omnivore"],
        ingredients=[
            RecipeIngredient(name="Bio Vollkorn-Knäckebrot", base_amount=40, unit="g", category="Vollkorn & Hülsenfrüchte", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Bio Freilandeier", base_amount=2, unit="Stück", category="Proteinquellen", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Avocado essreif", base_amount=60, unit="g", category="Gesunde Fette & Nüsse", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Snack-Gurke", base_amount=80, unit="g", category="Obst & Gemüse", matched_offer_retailer="NP"),
        ],
        instructions=[
            "Eier wachsweich kochen (ca. 6,5 Min), abschrecken und pellen.",
            "Avocado mit einer Gabel zerdrücken, mit Zitrone, Salz und Pfeffer abschmecken.",
            "Knäckebrot und Avocado separat oder vorbereitet in die Brotdose packen, Gurkenscheiben beilegen."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Eier in kochendem Wasser 6,5 bis 7 Minuten kochen, eiskalt abschrecken und schälen.",
                "Avocado halbieren, Fruchtfleisch herauslösen und mit einer Gabel cremig zerdrücken.",
                "Snack-Gurke in feine Stifte schneiden."
            ],
            cooking_steps=[
                "Avocado-Creme mit Zitronensaft, Meersalz und Pfeffer abschmecken.",
                "Eier halbieren und leicht salzen.",
                "Knäckebrot in ein trockenes Fach der Dose legen (damit es kross bleibt)."
            ],
            lunchbox_tips=[
                "Knäckebrot erst kurz vor dem Verzehr bestreichen, damit es maximal knackig bleibt.",
                "Die Eier bleiben in der Schale bis zu 3 Tage frisch gekühlt."
            ]
        ),
        tags=["Herzhaft", "Netto-Angebot", "Gesunde Fette", "Vegetarisch"],
        image_url="https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500"
    ),
    Recipe(
        id="bf-4",
        title="Hüttenkäse-Gemüse-Box mit Vollkorn-Stulle",
        meal_type="breakfast_lunchbox",
        prep_time_minutes=5,
        cook_time_minutes=0,
        difficulty="Einfach",
        lunchbox_ready=True,
        base_calories=440,
        base_protein_g=32,
        base_carbs_g=45,
        base_fat_g=12,
        allergens=["laktose", "gluten"],
        diet_types=["vegetarian", "pescetarian", "omnivore"],
        ingredients=[
            RecipeIngredient(name="Körniger Frischkäse", base_amount=200, unit="g", category="Proteinquellen", matched_offer_retailer="NP"),
            RecipeIngredient(name="Vollkornbrot", base_amount=75, unit="g", category="Vollkorn & Hülsenfrüchte"),
            RecipeIngredient(name="Bunte Paprika", base_amount=100, unit="g", category="Obst & Gemüse", matched_offer_retailer="NP"),
            RecipeIngredient(name="Kräutersalz & Schnittlauch", base_amount=5, unit="g", category="Basics"),
        ],
        instructions=[
            "Körnigen Frischkäse mit frischem Schnittlauch und Kräutersalz anrühren.",
            "Paprika in handliche Streifen zum Dippen schneiden.",
            "Zusammen mit der Scheibe Vollkornbrot in die Fächer-Brotdose schichten."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Paprika waschen, weiße Trennwände entfernen und in lange Sticks schneiden.",
                "Schnittlauch in Röllchen schneiden."
            ],
            cooking_steps=[
                "Körnigen Frischkäse mit Kräutersalz, Schnittlauch und einer Prise Pfeffer verrühren.",
                "In das Dip-Fach der Brotdose füllen.",
                "Vollkornbrot halbieren und beilegen."
            ],
            lunchbox_tips=[
                "Gemüsesticks direkt in den Hüttenkäse dippen – sauber, erfrischend und lecker im Büro!"
            ]
        ),
        tags=["High-Protein", "Frisch & Knackig", "NP-Angebot", "Vegetarisch"],
        image_url="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500"
    ),
    Recipe(
        id="bf-5",
        title="Vegane Beeren-Chia-Bowl mit Hafer & Mandelmilch",
        meal_type="breakfast_lunchbox",
        prep_time_minutes=5,
        cook_time_minutes=0,
        difficulty="Einfach",
        lunchbox_ready=True,
        base_calories=430,
        base_protein_g=16,
        base_carbs_g=56,
        base_fat_g=16,
        allergens=[],
        diet_types=["vegan", "vegetarian", "pescetarian", "omnivore"],
        ingredients=[
            RecipeIngredient(name="Haferflocken", base_amount=70, unit="g", category="Vollkorn & Hülsenfrüchte", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Chiasamen", base_amount=20, unit="g", category="Gesunde Fette & Nüsse"),
            RecipeIngredient(name="Heidelbeeren frisch", base_amount=100, unit="g", category="Obst & Gemüse", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Mandelmilch ungesüßt", base_amount=180, unit="ml", category="Basics"),
        ],
        instructions=[
            "Haferflocken und Chiasamen mit ungesüßter Mandelmilch aufgießen und verrühren.",
            "Frische Heidelbeeren daraufgeben.",
            "Über Nacht im Glas quellen lassen. 100% rein pflanzlich & laktosefrei."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Glas bereitstellen, Haferflocken und Chiasamen einfüllen.",
                "Frische Heidelbeeren waschen."
            ],
            cooking_steps=[
                "Mandelmilch und eine Messerspitze Vanille einrühren.",
                "Heidelbeeren darauf verteilen und über Nacht kühlen."
            ],
            lunchbox_tips=[
                "100% laktosefrei und vegan, verträglich für alle Allergiker!"
            ]
        ),
        tags=["Vegan", "Laktosefrei", "Netto-Angebot", "Superfood"],
        image_url="https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=500"
    ),

    # ==========================================
    # MITTAGESSEN (BROTDOSE TO-GO)
    # ==========================================
    Recipe(
        id="lu-1",
        title="Bunter Quinoa-Hähnchenbrust Salat",
        meal_type="lunch_lunchbox",
        prep_time_minutes=15,
        cook_time_minutes=15,
        difficulty="Einfach",
        lunchbox_ready=True,
        base_calories=620,
        base_protein_g=48,
        base_carbs_g=58,
        base_fat_g=18,
        allergens=[],
        diet_types=["omnivore"],
        ingredients=[
            RecipeIngredient(name="BioBio Hähnchenbrustfilet", base_amount=160, unit="g", category="Proteinquellen", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Quinoa", base_amount=60, unit="g", category="Vollkorn & Hülsenfrüchte"),
            RecipeIngredient(name="Bunte Paprika Tricolor", base_amount=100, unit="g", category="Obst & Gemüse", matched_offer_retailer="NP"),
            RecipeIngredient(name="Snack-Gurke", base_amount=80, unit="g", category="Obst & Gemüse", matched_offer_retailer="NP"),
            RecipeIngredient(name="Olivenöl & Zitronensaft", base_amount=12, unit="ml", category="Gesunde Fette & Nüsse"),
        ],
        instructions=[
            "Quinoa nach Packungsanleitung in leichtem Salzwasser garen und abkühlen lassen.",
            "Hähnchenbrust anbraten, in feine Tranchen schneiden.",
            "Paprika und Gurke würfeln, alles mit Quinoa, Olivenöl und Zitronensaft vermengen.",
            "In die Lunchbox füllen – schmeckt kalt fantastisch und hält bis zu 3 Tage frisch."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Quinoa in einem feinen Sieb heiß abspülen (entfernt Bitterstoffe).",
                "Paprika entkernen und in kleine 1cm-Würfel schneiden.",
                "Snack-Gurke längs vierteln und in knackige Stücke schneiden."
            ],
            cooking_steps=[
                "Quinoa in der doppelten Menge Wasser mit einer Prise Salz aufkochen und 12 Minuten bei kleiner Hitze quellen lassen.",
                "Hähnchenbrust trocken tupfen, mit Salz, Pfeffer und Paprika edelsüß würzen.",
                "1 TL Olivenöl in einer Pfanne erhitzen und die Hähnchenbrust von jeder Seite 4-5 Minuten goldbraun braten. Anschließend in Tranchen schneiden.",
                "Quinoa, Gemüse und Hähnchen mit Zitronensaft und Olivenöl marinieren."
            ],
            lunchbox_tips=[
                "Bento-Box Tipp: Quinoa und Hähnchen unten einfüllen, Gurke und Kräuter obenauf.",
                "Schmeckt kalt aus dem Kühlschrank noch aromatischer als warm.",
                "Kann problemlos 2 Tage im Voraus als Meal-Prep vorbereitet werden."
            ]
        ),
        tags=["Perfekt to-go", "Glutenfrei", "Laktosefrei", "Netto & NP kombiniert"],
        image_url="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"
    ),
    Recipe(
        id="lu-2",
        title="Mediterrane Linsen-Feta Meal-Prep Bowl",
        meal_type="lunch_lunchbox",
        prep_time_minutes=12,
        cook_time_minutes=10,
        difficulty="Einfach",
        lunchbox_ready=True,
        base_calories=590,
        base_protein_g=34,
        base_carbs_g=62,
        base_fat_g=20,
        allergens=["laktose", "nuesse"],
        diet_types=["vegetarian", "pescetarian", "omnivore"],
        ingredients=[
            RecipeIngredient(name="Bio Rote Linsen", base_amount=90, unit="g", category="Vollkorn & Hülsenfrüchte", matched_offer_retailer="NP"),
            RecipeIngredient(name="Feta", base_amount=60, unit="g", category="Proteinquellen"),
            RecipeIngredient(name="Bunte Paprika", base_amount=80, unit="g", category="Obst & Gemüse", matched_offer_retailer="NP"),
            RecipeIngredient(name="Walnusskerne", base_amount=15, unit="g", category="Gesunde Fette & Nüsse", matched_offer_retailer="NP"),
            RecipeIngredient(name="Olivenöl & Kräuter", base_amount=10, unit="ml", category="Gesunde Fette & Nüsse"),
        ],
        instructions=[
            "Linsen bissfest kochen (ca. 10 Min), abgießen und abkühlen lassen.",
            "Paprika fein würfeln, Walnüsse grob zerdrücken, Feta zerkrümeln.",
            "Alles mit Olivenöl, Balsamico und Kräutern der Provence marinieren und einpacken."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Linsen kurz kalt abspülen.",
                "Paprika in kleine Stücke schneiden, Walnüsse hacken."
            ],
            cooking_steps=[
                "Linsen in leicht gesalzenem Wasser ca. 8-10 Minuten kochen, bis sie bissfest sind.",
                "Abgießen, mit Olivenöl und Kräutern vermengen.",
                "Feta darüber bröseln und mit Walnüssen garnieren."
            ],
            lunchbox_tips=[
                "Hält sich 3 Tage im Kühlschrank – ideal, um gleich 2 Portionen vorzukochen!"
            ]
        ),
        tags=["Vegetarisch", "NP-Angebot", "Ballaststoff-Power", "Sättigt lange"],
        image_url="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500"
    ),
    Recipe(
        id="lu-3",
        title="Kichererbsen-Thunfisch Salat mit Bio-Ei",
        meal_type="lunch_lunchbox",
        prep_time_minutes=10,
        cook_time_minutes=8,
        difficulty="Einfach",
        lunchbox_ready=True,
        base_calories=610,
        base_protein_g=52,
        base_carbs_g=44,
        base_fat_g=22,
        allergens=["fisch", "eier"],
        diet_types=["pescetarian", "omnivore"],
        ingredients=[
            RecipeIngredient(name="Bio Kichererbsen", base_amount=160, unit="g", category="Vollkorn & Hülsenfrüchte", matched_offer_retailer="NP"),
            RecipeIngredient(name="Thunfisch im eigenen Saft", base_amount=120, unit="g", category="Proteinquellen"),
            RecipeIngredient(name="Bio Freilandeier", base_amount=2, unit="Stück", category="Proteinquellen", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Snack-Gurke & Petersilie", base_amount=80, unit="g", category="Obst & Gemüse", matched_offer_retailer="NP"),
            RecipeIngredient(name="Olivenöl nativ", base_amount=10, unit="ml", category="Gesunde Fette & Nüsse"),
        ],
        instructions=[
            "Eier hart kochen (9 Min), abschrecken und vierteln.",
            "Kichererbsen abspülen, mit Thunfisch und gewürfelter Gurke vermischen.",
            "Mit Olivenöl, Essig, Salz und Pfeffer abschmecken und die Eier obenauf legen."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Eier in kochendem Wasser 8-9 Minuten hart kochen, abschrecken und vierteln.",
                "Kichererbsen aus der Dose abgießen und kurz abbrausen."
            ],
            cooking_steps=[
                "Thunfisch abtropfen lassen und mit den Kichererbsen vermengen.",
                "Gurke würfeln und mit Olivenöl, Zitronensaft, Salz und Pfeffer anmachen.",
                "Eiviertel auf den Salat legen."
            ],
            lunchbox_tips=[
                "Ultra-schnell zubereitet – in unter 10 Minuten fertig gepackt."
            ]
        ),
        tags=["Pescetarisch", "High-Protein", "NP & Netto Spar-Kombi", "Glutenfrei"],
        image_url="https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500"
    ),
    Recipe(
        id="lu-4",
        title="Vollkorn-Wrap mit Putenbrust, Avocado & Rucola",
        meal_type="lunch_lunchbox",
        prep_time_minutes=8,
        cook_time_minutes=0,
        difficulty="Einfach",
        lunchbox_ready=True,
        base_calories=570,
        base_protein_g=42,
        base_carbs_g=48,
        base_fat_g=21,
        allergens=["gluten", "laktose"],
        diet_types=["omnivore"],
        ingredients=[
            RecipeIngredient(name="Vollkorn-Tortillas", base_amount=2, unit="Stück", category="Vollkorn & Hülsenfrüchte"),
            RecipeIngredient(name="BioBio Hähnchenbrust / Putenbrust", base_amount=130, unit="g", category="Proteinquellen", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Avocado essreif", base_amount=50, unit="g", category="Gesunde Fette & Nüsse", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Körniger Frischkäse", base_amount=60, unit="g", category="Proteinquellen", matched_offer_retailer="NP"),
            RecipeIngredient(name="Rucola oder Babyspinat", base_amount=30, unit="g", category="Obst & Gemüse"),
        ],
        instructions=[
            "Wraps mit körnigem Frischkäse bestreichen.",
            "Gebratene oder fertig gegarte Putenbruststreifen, Avocadospalten und Rucola darauf verteilen.",
            "Fest zusammenrollen, schräg halbieren und stramm in die Brotdose oder Pergamentpapier wickeln."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Avocado in Scheiben schneiden, Rucola waschen.",
                "Putenbrust in Streifen schneiden."
            ],
            cooking_steps=[
                "Tortilla-Fladen flach auslegen und mit körnigem Frischkäse bestreichen.",
                "Pute, Avocado und Rucola mittig anordnen.",
                "Seiten einklappen, fest aufrollen und diagonal halbieren."
            ],
            lunchbox_tips=[
                "Mit etwas Backpapier oder Alufolie umwickeln – dann krümelt nichts in der Tasche!"
            ]
        ),
        tags=["Brotdosen-Klassiker", "Handlich", "Netto & NP Sparpreis"],
        image_url="https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500"
    ),

    # ==========================================
    # ABENDESSEN (FRISCH ZU HAUSE KOCHEN)
    # ==========================================
    Recipe(
        id="di-1",
        title="Norwegisches Lachsfilet auf buntem Ofengemüse & Süßkartoffeln",
        meal_type="dinner_home",
        prep_time_minutes=15,
        cook_time_minutes=25,
        difficulty="Einfach",
        lunchbox_ready=False,
        base_calories=680,
        base_protein_g=46,
        base_carbs_g=54,
        base_fat_g=28,
        allergens=["fisch"],
        diet_types=["pescetarian", "omnivore"],
        ingredients=[
            RecipeIngredient(name="Norwegisches Lachsfilet frisch", base_amount=180, unit="g", category="Proteinquellen", matched_offer_retailer="NP"),
            RecipeIngredient(name="Süßkartoffeln", base_amount=200, unit="g", category="Obst & Gemüse", matched_offer_retailer="NP"),
            RecipeIngredient(name="Deutscher Brokkoli", base_amount=150, unit="g", category="Obst & Gemüse", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Bunte Paprika", base_amount=100, unit="g", category="Obst & Gemüse", matched_offer_retailer="NP"),
            RecipeIngredient(name="Olivenöl nativ extra", base_amount=15, unit="ml", category="Gesunde Fette & Nüsse"),
        ],
        instructions=[
            "Ofen auf 200°C Ober-/Unterhitze vorheizen. Süßkartoffeln in Spalten, Brokkoli in Röschen, Paprika in Stücke schneiden.",
            "Gemüse auf dem Backblech mit Olivenöl, Rosmarin, Meersalz und Pfeffer vermengen und 15 Minuten vorbacken.",
            "Lachsfilet mit Zitronensaft beträufeln, leicht salzen, zum Gemüse aufs Blech legen und 12 Minuten fertig garen.",
            "Gemeinsam frisch aus dem Ofen servieren."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Backofen auf 200°C Ober-/Unterhitze (180°C Umluft) vorheizen und ein Backblech mit Backpapier auslegen.",
                "Süßkartoffeln schälen und in ca. 1,5 cm dicke Spalten schneiden.",
                "Brokkoli in mundgerechte Röschen teilen, Strunk schälen und würfeln.",
                "Paprika waschen, entkernen und in grobe Stücke schneiden."
            ],
            cooking_steps=[
                "Das gesamte Gemüse auf dem Blech verteilen, mit 1-2 EL Olivenöl, Salz, Pfeffer und getrocknetem Rosmarin gründlich vermengen.",
                "Das Blech für 15 Minuten in den vorgeheizten Ofen (mittlere Schiene) schieben.",
                "In der Zwischenzeit das Lachsfilet kalt abbrausen, trocken tupfen und mit etwas Zitronensaft und Salz würzen.",
                "Nach 15 Minuten den Lachs zwischen das Gemüse aufs Blech legen und weitere 10-12 Minuten backen, bis der Lachs innen saftig und zartrosa ist.",
                "Direkt aus dem Ofen servieren und den Bratensaft über das Gemüse träufeln."
            ],
            lunchbox_tips=[
                "Eventuelle Reste eignen sich hervorragend für den nächsten Tag kalt auf Salat!",
                "Süßkartoffeln behalten auch am nächsten Tag ihren herrlich süßlichen Geschmack."
            ]
        ),
        tags=["Pescetarisch", "Omega-3 Power", "NP & Netto Spar-Hit", "Glutenfrei"],
        image_url="https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=500"
    ),
    Recipe(
        id="di-2",
        title="Bio-Hähnchenbrust mit gedämpftem Brokkoli & Vollkornreis",
        meal_type="dinner_home",
        prep_time_minutes=15,
        cook_time_minutes=20,
        difficulty="Einfach",
        lunchbox_ready=False,
        base_calories=640,
        base_protein_g=54,
        base_carbs_g=66,
        base_fat_g=14,
        allergens=[],
        diet_types=["omnivore"],
        ingredients=[
            RecipeIngredient(name="BioBio Hähnchenbrustfilet", base_amount=180, unit="g", category="Proteinquellen", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Deutscher Brokkoli", base_amount=250, unit="g", category="Obst & Gemüse", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Naturreis / Vollkornreis", base_amount=80, unit="g", category="Vollkorn & Hülsenfrüchte"),
            RecipeIngredient(name="Olivenöl & Kräuter", base_amount=10, unit="ml", category="Gesunde Fette & Nüsse"),
        ],
        instructions=[
            "Naturreis aufsetzen und gar kochen.",
            "Brokkoli schonend über Wasserdampf dämpfen (ca. 7 Min), damit alle Vitamine erhalten bleiben.",
            "Hähnchenbrust mit Paprikapulver und Kräutern würzen, in einer Pfanne mit etwas Olivenöl goldbraun braten.",
            "Frisch auf Tellern anrichten."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Naturreis gründlich waschen.",
                "Brokkoli in mundgerechte Röschen teilen.",
                "Hähnchenbrustfilets mit Küchenpapier abtupfen und nach Belieben halbieren."
            ],
            cooking_steps=[
                "Reis in leichtem Salzwasser aufkochen und nach Packungsangabe sanft köcheln lassen.",
                "Brokkoli im Dämpfeinsatz oder Topf mit wenig Wasser 7 Minuten dämpfen (bleibt knackig grün).",
                "Hähnchenbrust in einer Pfanne mit Olivenöl von beiden Seiten je 4-5 Minuten anbraten.",
                "Zusammen auf Tellern anrichten und mit frischen Kräutern garnieren."
            ],
            lunchbox_tips=[
                "Perfekt, um eine doppelte Portion zu machen – schmeckt am nächsten Tag im Büro super."
            ]
        ),
        tags=["Clean Eating", "Netto Bio-Hit", "Fettarm", "Glutenfrei", "Laktosefrei"],
        image_url="https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=500"
    ),
    Recipe(
        id="di-3",
        title="Cremiges Rote-Linsen-Curry mit Babyspinat & Tomaten",
        meal_type="dinner_home",
        prep_time_minutes=10,
        cook_time_minutes=20,
        difficulty="Einfach",
        lunchbox_ready=False,
        base_calories=620,
        base_protein_g=32,
        base_carbs_g=78,
        base_fat_g=16,
        allergens=[],
        diet_types=["vegan", "vegetarian", "pescetarian", "omnivore"],
        ingredients=[
            RecipeIngredient(name="Bio Rote Linsen", base_amount=100, unit="g", category="Vollkorn & Hülsenfrüchte", matched_offer_retailer="NP"),
            RecipeIngredient(name="Babyspinat", base_amount=120, unit="g", category="Obst & Gemüse"),
            RecipeIngredient(name="Gehackte Tomaten Dose", base_amount=200, unit="g", category="Obst & Gemüse"),
            RecipeIngredient(name="Kokosmilch fettreduziert", base_amount=100, unit="ml", category="Basics"),
            RecipeIngredient(name="Ingwer, Kurkuma & Kreuzkümmel", base_amount=10, unit="g", category="Basics"),
        ],
        instructions=[
            "Ingwer und Knoblauch fein hacken, in einem Topf kurz andünsten. Curry-Gewürze zugeben.",
            "Rote Linsen, Tomaten und Kokosmilch einrühren. Bei mittlerer Hitze ca. 15 Minuten köcheln lassen.",
            "Zuletzt den frischen Spinat unterrühren, bis er sanft zusammenfällt. Heiß servieren."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Ingwer und Knoblauch schälen und fein reiben.",
                "Rote Linsen kurz kalt abspülen.",
                "Spinat verlesen und waschen."
            ],
            cooking_steps=[
                "1 TL Olivenöl im Topf erhitzen, Ingwer und Gewürze 1 Minute anrösten.",
                "Linsen, gehackte Tomaten und Kokosmilch dazugeben und 15 Minuten sanft köcheln lassen.",
                "Topf von der Hitze nehmen, Spinat einrühren und mit Salz und Limettensaft abschmecken."
            ],
            lunchbox_tips=[
                "Schmeckt durchgezogen am Folgetag noch aromatischer!"
            ]
        ),
        tags=["Vegan", "Vegetarisch", "Laktosefrei", "Glutenfrei", "NP-Angebot"],
        image_url="https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500"
    ),
    Recipe(
        id="di-4",
        title="Bunte Gemüse-Frittata aus dem Ofen mit Kräuterquark",
        meal_type="dinner_home",
        prep_time_minutes=10,
        cook_time_minutes=15,
        difficulty="Einfach",
        lunchbox_ready=False,
        base_calories=580,
        base_protein_g=44,
        base_carbs_g=32,
        base_fat_g=28,
        allergens=["eier", "laktose"],
        diet_types=["vegetarian", "pescetarian", "omnivore"],
        ingredients=[
            RecipeIngredient(name="Bio Freilandeier", base_amount=4, unit="Stück", category="Proteinquellen", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Bunte Paprika Tricolor", base_amount=120, unit="g", category="Obst & Gemüse", matched_offer_retailer="NP"),
            RecipeIngredient(name="Gutes Land Magerquark", base_amount=150, unit="g", category="Proteinquellen", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Snack-Gurke & Kräuter", base_amount=100, unit="g", category="Obst & Gemüse", matched_offer_retailer="NP"),
            RecipeIngredient(name="Olivenöl", base_amount=10, unit="ml", category="Gesunde Fette & Nüsse"),
        ],
        instructions=[
            "Eier mit einem Schuss Wasser, Salz, Pfeffer und Kräutern verquirlen.",
            "Paprika würfeln, kurz in einer ofenfesten Pfanne anbraten, Eimasse darübergießen.",
            "Bei 180°C im Ofen ca. 15 Minuten stocken lassen.",
            "Magerquark mit Kräutern, Salz und geraspelter Gurke als frischen Dip dazu anrichten."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Eier in einer Schüssel mit Salz, Pfeffer und frischen Kräutern verquirlen.",
                "Paprika in mundgerechte Stücke schneiden."
            ],
            cooking_steps=[
                "Paprika kurz in der Pfanne anbraten, Eimasse darübergießen.",
                "Bei 180°C im Ofen 12-15 Minuten stocken lassen, bis die Frittata goldgelb aufgeht.",
                "Mit frischem Kräuterquark servieren."
            ],
            lunchbox_tips=[
                "Frittata-Stücke lassen sich kalt wie Kuchen aus der Hand essen!"
            ]
        ),
        tags=["Vegetarisch", "Low-Carb", "Netto & NP Spar-Duo", "Glutenfrei"],
        image_url="https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500"
    ),
    Recipe(
        id="di-5",
        title="Gebackene Süßkartoffel mit Hüttenkäse & Avocado-Tatar",
        meal_type="dinner_home",
        prep_time_minutes=10,
        cook_time_minutes=25,
        difficulty="Einfach",
        lunchbox_ready=False,
        base_calories=610,
        base_protein_g=34,
        base_carbs_g=72,
        base_fat_g=18,
        allergens=["laktose"],
        diet_types=["vegetarian", "pescetarian", "omnivore"],
        ingredients=[
            RecipeIngredient(name="Süßkartoffeln", base_amount=300, unit="g", category="Obst & Gemüse", matched_offer_retailer="NP"),
            RecipeIngredient(name="Körniger Frischkäse High Protein", base_amount=200, unit="g", category="Proteinquellen", matched_offer_retailer="NP"),
            RecipeIngredient(name="Avocado essreif", base_amount=60, unit="g", category="Gesunde Fette & Nüsse", matched_offer_retailer="Netto"),
            RecipeIngredient(name="Frische Kräuter & Zitrone", base_amount=10, unit="g", category="Basics"),
        ],
        instructions=[
            "Süßkartoffel waschen, mehrfach mit einer Gabel einstechen und bei 200°C ca. 25-30 Minuten backen, bis sie weich ist.",
            "Avocado fein würfeln, mit Limettensaft, Salz und Pfeffer vermengen.",
            "Die heiße Süßkartoffel längs aufschneiden, mit cremigem Hüttenkäse und Avocado-Tatar füllen."
        ],
        detailed_instructions=DetailedInstruction(
            prep_steps=[
                "Süßkartoffel waschen und mit einer Gabel ringsum einstechen.",
                "Avocado entkernen und in feine Würfel schneiden."
            ],
            cooking_steps=[
                "Süßkartoffel bei 200°C backen, bis sie innen weich ist.",
                "Längs einschneiden und leicht aufklappen.",
                "Mit körnigem Frischkäse und frischem Avocado-Tatar füllen."
            ],
            lunchbox_tips=[
                "Super gesundes Wohlfühlessen ohne Fleisch!"
            ]
        ),
        tags=["Vegetarisch", "NP-Angebot", "Netto-Avocado", "Glutenfrei"],
        image_url="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500"
    ),
]
