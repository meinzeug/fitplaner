"""
Curated Recipe Universe Generator for FitPlaner.
Compiles 105 authentic, nutritionally balanced, family-friendly German recipes
with clean individual supermarket ingredients, detailed step-by-step instructions,
and zero artificial string concatenations.
"""

import json
import os
from typing import List, Dict, Any

RETAILERS = ["Netto", "NP", "Lidl", "Aldi Nord", "Aldi Süd", "Rewe", "Kaufland", "Edeka"]

UNSPLASH_IMAGES = {
    "oats": "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600",
    "skyr": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600",
    "bread": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600",
    "eggs": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600",
    "pancakes": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600",
    "bowl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
    "salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
    "wrap": "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600",
    "pasta": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
    "salmon": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600",
    "chicken": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600",
    "curry": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600",
    "soup": "https://images.unsplash.com/photo-1547496502-affa22d38842?w=600",
    "steak": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600",
    "sweetpotato": "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600",
    "veggie": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600",
    "fish": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600",
    "generic": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600"
}


def make_ing(name: str, amount: float, unit: str, category: str, retailer: str = "Netto") -> Dict[str, Any]:
    return {
        "name": name,
        "base_amount": amount,
        "unit": unit,
        "category": category,
        "matched_offer_retailer": retailer
    }


def create_recipe(
    r_id: str,
    title: str,
    meal_type: str,
    prep_min: int,
    cook_min: int,
    difficulty: str,
    lunchbox_ready: bool,
    cals: int,
    prot: int,
    carbs: int,
    fat: int,
    allergens: List[str],
    diet_types: List[str],
    ingredients: List[Dict[str, Any]],
    instructions: List[str],
    prep_steps: List[str],
    cooking_steps: List[str],
    lunchbox_tips: List[str],
    tags: List[str],
    image_key: str = "generic"
) -> Dict[str, Any]:
    # Determine base diet flags
    diets = list(diet_types)
    if "omnivore" not in diets:
        diets.append("omnivore")
    if "schwein" not in [i["name"].lower() for i in ingredients]:
        if "no_pork" not in diets:
            diets.append("no_pork")
    if "gluten" not in allergens and "gluten_free" not in diets:
        diets.append("gluten_free")
    if "laktose" not in allergens and "lactose_free" not in diets:
        diets.append("lactose_free")
    if prot >= 30 and "high_protein" not in diets:
        diets.append("high_protein")
    if carbs <= 30 and "low_carb" not in diets:
        diets.append("low_carb")
    if "clean_eating" not in diets:
        diets.append("clean_eating")

    return {
        "id": r_id,
        "title": title,
        "meal_type": meal_type,
        "prep_time_minutes": prep_min,
        "cook_time_minutes": cook_min,
        "difficulty": difficulty,
        "lunchbox_ready": lunchbox_ready,
        "base_calories": cals,
        "base_protein_g": prot,
        "base_carbs_g": carbs,
        "base_fat_g": fat,
        "allergens": allergens,
        "diet_types": diets,
        "ingredients": ingredients,
        "instructions": instructions,
        "detailed_instructions": {
            "prep_steps": prep_steps,
            "cooking_steps": cooking_steps,
            "lunchbox_tips": lunchbox_tips,
        },
        "tags": tags,
        "image_url": UNSPLASH_IMAGES.get(image_key, UNSPLASH_IMAGES["generic"])
    }


def generate_all_recipes() -> List[Dict[str, Any]]:
    recipes: List[Dict[str, Any]] = []

    # =========================================================================
    # 35 FRÜHSTÜCKS-REZEPTE (BREAKFAST & BROTDOSE)
    # =========================================================================
    bf_data = [
        (
            "Overnight Oats mit Heidelbeeren & Chiasamen", 5, 0, 480, 24, 62, 14,
            ["gluten", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Zarte Haferflocken", 70, "g", "Trockensortiment", "Netto"),
                make_ing("Heidelbeeren", 80, "g", "Obst & Gemüse", "Netto"),
                make_ing("Chiasamen", 15, "g", "Trockensortiment", "Netto"),
                make_ing("Magerquark", 150, "g", "Kühlregal", "Netto"),
                make_ing("Mandelmilch", 100, "ml", "Getränke", "Netto"),
            ],
            ["Haferflocken, Chiasamen und Magerquark mit Mandelmilch in einem Glas verrühren.", "Frische Heidelbeeren als Topping darauflegen.", "Über Nacht im Kühlschrank quellen lassen."],
            ["Haferflocken und Chiasamen abwiegen.", "Heidelbeeren kurz abbrausen."],
            ["Alle Basiszutaten im Weckglas cremig verrühren.", "Heidelbeeren obenauf schichten.", "Verschlossen für mindestens 6 Stunden kühlen."],
            ["Im dichten Schraubglas absolut auslaufsicher.", "Morgens einfach greifen und los!"],
            ["Meal-Prep", "Ballaststoffreich", "Vegetarisch"], "oats"
        ),
        (
            "High-Protein Skyr-Bowl mit Walnüssen & Apfel", 5, 0, 450, 38, 42, 14,
            ["laktose", "nuesse"], ["vegetarian", "pescetarian", "high_protein"],
            [
                make_ing("Skyr Natur", 300, "g", "Kühlregal", "NP"),
                make_ing("Walnüsse", 20, "g", "Nüsse & Kerne", "NP"),
                make_ing("Äpfel", 120, "g", "Obst & Gemüse", "NP"),
                make_ing("Zimt", 2, "g", "Gewürze & Basics", "NP"),
                make_ing("Leinsamen", 10, "g", "Trockensortiment", "NP"),
            ],
            ["Skyr in eine Schale oder Brotdose füllen.", "Apfel in kleine Würfel schneiden und mit Zimt bestreuen.", "Walnüsse grob hacken und mit Leinsamen als Topping verteilen."],
            ["Apfel waschen, entkernen und würfeln.", "Walnüsse mit den Fingern grob zerbröseln."],
            ["Skyr glattrühren.", "Zimt und Apfelstücke unterheben oder obenauf dekorieren."],
            ["Apfelstücke mit etwas Zitronensaft beträufeln, damit sie nicht braun werden."],
            ["High-Protein", "Super-Schnell", "Vegetarisch"], "skyr"
        ),
        (
            "Vollkorn-Knäckebrot mit Bio-Ei & Avocado-Creme", 8, 7, 460, 22, 36, 24,
            ["gluten", "eier"], ["vegetarian", "pescetarian"],
            [
                make_ing("Knäckebrot", 60, "g", "Brot & Backwaren", "Lidl"),
                make_ing("Eier Bio", 2, "Stück", "Kühlregal", "Lidl"),
                make_ing("Avocado", 60, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Gurke", 80, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Salz", 1, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Eier 6,5 Minuten wachsweich kochen, abschrecken und pellen.", "Avocado mit der Gabel zerdrücken und mit Salz abschmecken.", "Knäckebrot mit Avocado bestreichen, Eier und Gurkenscheiben dazulegen."],
            ["Wasser im Topf zum Kochen bringen.", "Avocado halbieren und Fruchtfleisch entnehmen.", "Gurke in feine Scheiben schneiden."],
            ["Eier ins sprudelnde Wasser geben und 6,5 Minuten kochen.", "Kalt abschrecken, schälen und halbieren."],
            ["Knäckebrot in ein separates trockenes Fach der Brotdose legen, damit es kross bleibt."],
            ["Herzhaft", "Gesunde Fette", "Vegetarisch"], "bread"
        ),
        (
            "Hüttenkäse-Gemüse-Box mit Vollkorn-Stulle", 5, 0, 420, 32, 44, 11,
            ["gluten", "laktose"], ["vegetarian", "pescetarian", "high_protein"],
            [
                make_ing("Körniger Frischkäse", 200, "g", "Kühlregal", "Aldi Nord"),
                make_ing("Vollkornbrot", 90, "g", "Brot & Backwaren", "Aldi Nord"),
                make_ing("Paprika rot", 80, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Kirschtomaten", 60, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Schnittlauch", 10, "g", "Kräuter", "Aldi Nord"),
            ],
            ["Schnittlauch hacken und unter den körnigen Frischkäse rühren.", "Paprika in Sticks schneiden, Tomaten halbieren.", "Vollkornbrot mit Hüttenkäse und Gemüsesticks in die Box packen."],
            ["Gemüse gründlich waschen.", "Schnittlauch fein wiegen."],
            ["Hüttenkäse mit Schnittlauch und einer Prise Salz abschmecken."],
            ["Hüttenkäse in eine kleine Extraschale füllen, Gemüsesticks zum Dippen bereitlegen."],
            ["High-Protein", "Kompakt", "Vegetarisch"], "bread"
        ),
        (
            "Vegane Beeren-Chia-Bowl mit Hafer & Mandelmilch", 5, 0, 440, 16, 68, 12,
            ["gluten"], ["vegan", "vegetarian", "pescetarian"],
            [
                make_ing("Zarte Haferflocken", 60, "g", "Trockensortiment", "Rewe"),
                make_ing("Chiasamen", 20, "g", "Trockensortiment", "Rewe"),
                make_ing("Mandelmilch", 180, "ml", "Getränke", "Rewe"),
                make_ing("Himbeeren", 80, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Ahornsirup", 15, "ml", "Gewürze & Basics", "Rewe"),
            ],
            ["Haferflocken und Chiasamen mit Mandelmilch und Ahornsirup verrühren.", "Himbeeren unterheben.", "Mindestens 4 Stunden oder über Nacht im Kühlschrank quellen lassen."],
            ["Trockene Zutaten im Becher mischen.", "Himbeeren verlesen."],
            ["Mit Mandelmilch aufgießen und kräftig verrühren, damit die Chiasamen nicht verklumpen."],
            ["Perfekt to-go in einem Weckglas mit Bügelverschluss."],
            ["Vegan", "Antioxidantien", "Meal-Prep"], "bowl"
        ),
        (
            "Warmer Apfel-Zimt-Porridge mit Mandeln", 5, 5, 470, 18, 65, 14,
            ["gluten", "nuesse"], ["vegan", "vegetarian", "pescetarian"],
            [
                make_ing("Zarte Haferflocken", 70, "g", "Trockensortiment", "Kaufland"),
                make_ing("Hafermilch", 200, "ml", "Getränke", "Kaufland"),
                make_ing("Äpfel", 100, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Mandeln", 20, "g", "Nüsse & Kerne", "Kaufland"),
                make_ing("Zimt", 2, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Haferflocken mit Hafermilch und Zimt im Topf 3 Minuten cremig einkochen.", "Apfel würfeln und die Hälfte kurz mitdünsten.", "Mit restlichen Apfelstücken und gehackten Mandeln servieren."],
            ["Apfel waschen und in kleine Würfel schneiden.", "Mandeln grob hacken."],
            ["Haferflocken und Hafermilch aufkochen, Hitze reduzieren und rühren.", "Zimt und Apfelstücke einrühren."],
            ["Lässt sich warm in einer Thermos-Brotdose mitnehmen."],
            ["Wärmend", "Herbst & Winter", "Vegan"], "oats"
        ),
        (
            "Rührei mit Babyspinat, Kirschtomaten & Feta", 5, 6, 430, 28, 8, 32,
            ["eier", "laktose"], ["vegetarian", "pescetarian", "low_carb", "high_protein"],
            [
                make_ing("Eier Bio", 3, "Stück", "Kühlregal", "Edeka"),
                make_ing("Babyspinat", 60, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Kirschtomaten", 60, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Feta", 40, "g", "Kühlregal", "Edeka"),
                make_ing("Olivenöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Eier mit Salz und Pfeffer verquirlen.", "Tomaten halbieren, Spinat im Olivenöl kurz zusammenfallen lassen.", "Eier dazugeben, stocken lassen und Feta darüberkrümeln."],
            ["Spinat waschen und trockenschütteln.", "Tomaten halbieren, Eier in einer Schale verquirlen."],
            ["Pfanne auf mittlere Hitze bringen, Spinat und Tomaten 1 Minute andünsten.", "Eiermasse zugeben, vorsichtig zusammenschieben."],
            ["Schmeckt warm fantastisch, lässt sich aber auch kalt in der Brotdose genießen."],
            ["Low-Carb", "Keto-Friendly", "Schnell"], "eggs"
        ),
        (
            "Vollkorn-Pancakes mit Banane & Ahornsirup", 10, 8, 490, 20, 78, 9,
            ["gluten", "eier", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Vollkornmehl", 60, "g", "Trockensortiment", "Netto"),
                make_ing("Eier Bio", 1, "Stück", "Kühlregal", "Netto"),
                make_ing("Milch", 80, "ml", "Kühlregal", "Netto"),
                make_ing("Bananen", 90, "g", "Obst & Gemüse", "Netto"),
                make_ing("Ahornsirup", 15, "ml", "Gewürze & Basics", "Netto"),
                make_ing("Backpulver", 3, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Halbe Banane mit der Gabel zerdrücken, mit Ei, Mehl, Milch und Backpulver zum Teig rühren.", "Kleine Pancakes in beschichteter Pfanne goldbraun ausbacken.", "Mit restlichen Bananenscheiben und Ahornsirup anrichten."],
            ["Banane teilen: eine Hälfte zerdrücken, die andere in Scheiben schneiden.", "Teigzutaten glattrühren."],
            ["Pfanne leicht fetten, pro Pancake 2 EL Teig hineingeben.", "Wenden sobald Bläschen aufsteigen, ca. 2 Min pro Seite."],
            ["Lassen sich prima am Vorabend backen und kalt als Snack mitnehmen."],
            ["Familien-Liebling", "Kinderfreundlich", "Wochenende"], "pancakes"
        ),
        (
            "Quark-Bowl mit frischen Erdbeeren & Sonnenblumenkernen", 5, 0, 410, 36, 38, 12,
            ["laktose"], ["vegetarian", "pescetarian", "high_protein"],
            [
                make_ing("Magerquark", 250, "g", "Kühlregal", "NP"),
                make_ing("Erdbeeren", 120, "g", "Obst & Gemüse", "NP"),
                make_ing("Sonnenblumenkerne", 20, "g", "Nüsse & Kerne", "NP"),
                make_ing("Honig", 10, "g", "Gewürze & Basics", "NP"),
                make_ing("Milch", 30, "ml", "Kühlregal", "NP"),
            ],
            ["Magerquark mit einem Schuss Milch und Honig cremig rühren.", "Erdbeeren waschen, vierteln und auf dem Quark anrichten.", "Mit gerösteten Sonnenblumenkernen toppen."],
            ["Erdbeeren waschen, Grün entfernen und vierteln.", "Sonnenblumenkerne kurz in der Pfanne ohne Fett anrösten."],
            ["Quark mit Milch und Honig glattrühren."],
            ["Erdbeeren erst morgens auflegen, damit der Quark nicht wässert."],
            ["High-Protein", "Saisonal", "Vegetarisch"], "skyr"
        ),
        (
            "Vollkornbrot mit Räucherlachs & Frischkäse", 5, 0, 440, 26, 38, 19,
            ["gluten", "fisch", "laktose"], ["pescetarian"],
            [
                make_ing("Vollkornbrot", 90, "g", "Brot & Backwaren", "Lidl"),
                make_ing("Räucherlachs", 70, "g", "Fisch", "Lidl"),
                make_ing("Frischkäse", 40, "g", "Kühlregal", "Lidl"),
                make_ing("Gurke", 60, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Schnittlauch", 5, "g", "Kräuter", "Lidl"),
            ],
            ["Vollkornbrot dick mit Frischkäse bestreichen.", "Mit Räucherlachs und feinen Gurkenscheiben belegen.", "Mit frisch geschnittenem Schnittlauch und Pfeffer garnieren."],
            ["Gurke in sehr dünne Scheiben schneiden.", "Schnittlauch hacken."],
            ["Brot gleichmäßig bestreichen und schichten."],
            ["Als Klapp-Stulle zusammenlegen und in Wachspapier wickeln."],
            ["Omega-3", "Gourmet", "To-Go"], "bread"
        ),
        (
            "Schoko-Bananen-Overnight-Oats mit Erdnussmus", 5, 0, 510, 22, 68, 17,
            ["gluten", "nuesse"], ["vegan", "vegetarian", "pescetarian"],
            [
                make_ing("Zarte Haferflocken", 70, "g", "Trockensortiment", "Aldi Süd"),
                make_ing("Hafermilch", 150, "ml", "Getränke", "Aldi Süd"),
                make_ing("Bananen", 90, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Erdnussmus", 20, "g", "Nüsse & Kerne", "Aldi Süd"),
                make_ing("Chiasamen", 10, "g", "Trockensortiment", "Aldi Süd"),
            ],
            ["Haferflocken, Chiasamen und Hafermilch verrühren.", "Bananenscheiben und Erdnussmus unterrühren oder daraufschichten.", "Über Nacht im Kühlschrank ziehen lassen."],
            ["Banane schälen und in Scheiben schneiden.", "Haferflocken abwiegen."],
            ["Alle Zutaten im Glas vermengen und kühlstellen."],
            ["Erdnussmus liefert langanhaltende Energie für Sportler und Schüler."],
            ["Kraftpaket", "Kinderliebling", "Vegan"], "oats"
        ),
        (
            "Buntes Gemüserührei mit Paprika & Lauch", 6, 6, 390, 26, 12, 26,
            ["eier"], ["vegetarian", "pescetarian", "low_carb", "high_protein"],
            [
                make_ing("Eier Bio", 3, "Stück", "Kühlregal", "Rewe"),
                make_ing("Paprika bunt", 80, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Lauch", 40, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Rapsöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Salz", 1, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Paprika würfeln, Lauch in feine Ringe schneiden.", "Gemüse in Rapsöl 3 Minuten anbraten.", "Verquirlte Eier darübergießen und unter leichtem Rühren stocken lassen."],
            ["Gemüse waschen und fein zerkleinern.", "Eier mit Salz und Pfeffer verquirlen."],
            ["Gemüse anbraten, Hitze reduzieren, Eier einrühren und cremig fertigstellen."],
            ["Perfekt mit einer Scheibe Vollkornbrot für unterwegs."],
            ["Gemüsereich", "Herzhaft", "Glutenfrei"], "eggs"
        ),
        (
            "Griechischer Joghurt mit Himbeeren & Kürbiskernen", 4, 0, 430, 22, 28, 26,
            ["laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Griechischer Joghurt", 250, "g", "Kühlregal", "Kaufland"),
                make_ing("Himbeeren", 100, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Kürbiskerne", 25, "g", "Nüsse & Kerne", "Kaufland"),
                make_ing("Honig", 10, "g", "Gewürze & Basics", "Kaufland"),
            ],
            ["Joghurt in eine Schale füllen.", "Himbeeren verlesen und auf dem Joghurt anrichten.", "Kürbiskerne und einen Löffel Honig darübergeben."],
            ["Kürbiskerne kurz trocken anrösten.", "Himbeeren vorsichtig waschen."],
            ["Zutaten anrichten."],
            ["Kürbiskerne in eine kleine Extra-Dose packen, damit sie knackig bleiben."],
            ["Zinkreich", "Cremig", "Glutenfrei"], "skyr"
        ),
        (
            "Vollkorn-Waffeln mit Magerquark & Blaubeeren", 10, 10, 470, 28, 64, 11,
            ["gluten", "eier", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Vollkornmehl", 60, "g", "Trockensortiment", "Edeka"),
                make_ing("Eier Bio", 1, "Stück", "Kühlregal", "Edeka"),
                make_ing("Magerquark", 120, "g", "Kühlregal", "Edeka"),
                make_ing("Milch", 60, "ml", "Kühlregal", "Edeka"),
                make_ing("Heidelbeeren", 80, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Backpulver", 3, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Mehl, Ei, die Hälfte des Quarks, Milch und Backpulver zu einem zähflüssigen Teig rühren.", "Im Waffeleisen goldbraun backen.", "Mit dem restlichen Quark und Blaubeeren servieren."],
            ["Waffeleisen vorheizen.", "Teigzutaten mit dem Schneebesen verrühren."],
            ["Pro Waffel 2 EL Teig einfüllen und ca. 3-4 Minuten backen."],
            ["Waffeln abkühlen lassen – ideale gesunde Pausensnacks für Kinder!"],
            ["Kinderfavorit", "Proteinreich", "Backen"], "pancakes"
        ),
        (
            "Vollkorn-Wrap mit Hüttenkäse, Putenbrust & Gurke", 6, 0, 410, 32, 42, 10,
            ["gluten", "laktose"], ["high_protein"],
            [
                make_ing("Vollkorn-Wraps", 1, "Stück", "Brot & Backwaren", "Netto"),
                make_ing("Körniger Frischkäse", 120, "g", "Kühlregal", "Netto"),
                make_ing("Putenbrust Aufschnitt", 60, "g", "Fleisch", "Netto"),
                make_ing("Gurke", 60, "g", "Obst & Gemüse", "Netto"),
                make_ing("Senf", 10, "ml", "Gewürze & Basics", "Netto"),
            ],
            ["Wrap mit Hüttenkäse und einem Hauch Senf bestreichen.", "Mit Putenbrust und Gurkenscheiben belegen.", "Fest aufrollen und schräg halbieren."],
            ["Gurke längs in dünne Scheiben schneiden.", "Wrap bereitlegen."],
            ["Zutaten im mittleren Drittel verteilen, Ränder einklappen und stramm rollen."],
            ["In Alufolie oder Bienenwachstuch stramm einwickeln – perfekter to-go Snack."],
            ["To-Go", "Brotdose", "High-Protein"], "wrap"
        ),
        (
            "Dinkel-Porridge mit Beerenmischung & Leinsamen", 5, 5, 450, 16, 68, 12,
            ["gluten"], ["vegan", "vegetarian", "pescetarian"],
            [
                make_ing("Dinkelflocken", 70, "g", "Trockensortiment", "NP"),
                make_ing("Mandelmilch", 200, "ml", "Getränke", "NP"),
                make_ing("TK Beerenmischung", 100, "g", "Tiefkühl", "NP"),
                make_ing("Leinsamen", 15, "g", "Trockensortiment", "NP"),
                make_ing("Zimt", 2, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Dinkelflocken mit Mandelmilch aufkochen und 3 Minuten sanft köcheln lassen.", "TK-Beeren einrühren, bis sie heiß sind.", "Mit Leinsamen und Zimt bestreuen."],
            ["Dinkelflocken und Leinsamen abmessen."],
            ["Im kleinen Topf erwärmen und rühren bis ein sämiger Brei entsteht."],
            ["Hält warm im Thermobehälter bis zur Mittagspause."],
            ["Ballaststoffe", "Immunsystem", "Vegan"], "oats"
        ),
        (
            "Vollkorn-Stulle mit Avocado, Tomate & Kresse", 5, 0, 390, 10, 44, 20,
            ["gluten"], ["vegan", "vegetarian", "pescetarian"],
            [
                make_ing("Vollkornbrot", 90, "g", "Brot & Backwaren", "Lidl"),
                make_ing("Avocado", 70, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Tomaten", 80, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Zitrone", 10, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Salz", 1, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Avocado mit der Gabel zerdrücken, mit Zitrone und Salz abschmecken.", "Vollkornbrot bestreichen und mit Tomatenscheiben belegen.", "Mit Pfeffer und Kresse garnieren."],
            ["Tomaten in Scheiben schneiden.", "Avocado zerdrücken."],
            ["Stulle belegen."],
            ["Klassische Stulle, schmeckt jedem und sättigt langanhaltend."],
            ["Vegan", "Klassiker", "Vitamine"], "bread"
        ),
        (
            "High-Protein Magerquark mit Apfelmus & Walnüssen", 4, 0, 420, 34, 40, 13,
            ["laktose", "nuesse"], ["vegetarian", "pescetarian", "high_protein"],
            [
                make_ing("Magerquark", 250, "g", "Kühlregal", "Aldi Nord"),
                make_ing("Äpfel", 120, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Walnüsse", 20, "g", "Nüsse & Kerne", "Aldi Nord"),
                make_ing("Zimt", 2, "g", "Gewürze & Basics", "Vorratskammer"),
                make_ing("Milch", 30, "ml", "Kühlregal", "Aldi Nord"),
            ],
            ["Quark mit Milch cremig rühren.", "Apfel fein raspeln oder würfeln und mit Zimt untermischen.", "Mit gehackten Walnüssen toppen."],
            ["Apfel waschen und reiben.", "Walnüsse hacken."],
            ["Quark glattrühren und alle Komponenten schichten."],
            ["Erfrischend und sättigend für 4-5 Stunden."],
            ["Schnell", "Günstig", "Vegetarisch"], "skyr"
        ),
        (
            "Shakshuka mit zwei pochierten Eiern & Vollkornbrot", 8, 12, 450, 24, 42, 21,
            ["gluten", "eier"], ["vegetarian", "pescetarian"],
            [
                make_ing("Eier Bio", 2, "Stück", "Kühlregal", "Rewe"),
                make_ing("Dosentomaten", 200, "g", "Konserven", "Rewe"),
                make_ing("Paprika rot", 80, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Zwiebeln", 40, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Vollkornbrot", 50, "g", "Brot & Backwaren", "Rewe"),
                make_ing("Olivenöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Zwiebel und Paprika würfeln, in Olivenöl anschwitzen.", "Tomaten zugeben, 5 Minuten einkochen lassen.", "Zwei Mulden formen, Eier hineinschlagen, Deckel auflegen und 5 Minuten stocken lassen. Mit Brot servieren."],
            ["Zwiebel und Paprika fein schneiden."],
            ["In der Pfanne dünsten, Tomatensauce würzen, Eier hineingleiten lassen."],
            ["Ein orientalischer Traum – am Wochenende frisch aus der Pfanne löffeln!"],
            ["Warm", "Wochenende", "Vegetarisch"], "eggs"
        ),
        (
            "Erdbeer-Bananen-Smoothie-Bowl mit Kürbiskernen", 5, 0, 420, 18, 64, 11,
            ["laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Magerquark", 150, "g", "Kühlregal", "Kaufland"),
                make_ing("Erdbeeren", 100, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Bananen", 90, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Kürbiskerne", 20, "g", "Nüsse & Kerne", "Kaufland"),
                make_ing("Haferflocken", 30, "g", "Trockensortiment", "Kaufland"),
            ],
            ["Quark mit Banane und der Hälfte der Erdbeeren pürieren.", "In eine Schale füllen.", "Mit restlichen Erdbeerscheiben, Haferflocken und Kürbiskernen garnieren."],
            ["Obst schneiden.", "Mixer oder Pürierstab bereithalten."],
            ["Cremig pürieren und dekorieren."],
            ["Bunt, lecker und vollgepackt mit Vitamin C."],
            ["Sommer", "Kinderfavorit", "Bunt"], "bowl"
        ),
        (
            "Vollkorn-Knäckebrot mit Kräuterquark & Radieschen", 5, 0, 340, 20, 38, 11,
            ["gluten", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Knäckebrot", 60, "g", "Brot & Backwaren", "Edeka"),
                make_ing("Magerquark", 150, "g", "Kühlregal", "Edeka"),
                make_ing("Gurke", 80, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Schnittlauch", 10, "g", "Kräuter", "Edeka"),
                make_ing("Leinöl", 5, "ml", "Öle & Essig", "Edeka"),
            ],
            ["Quark mit Leinöl, Schnittlauch, Salz und Pfeffer glattrühren.", "Knäckebrot dick bestreichen.", "Mit Gurkenscheiben belegen."],
            ["Schnittlauch hacken, Gurke hobeln."],
            ["Kräuterquark anrühren und abschmecken."],
            ["Traditioneller Genuss aus Nord- und Ostdeutschland – super gesund!"],
            ["Leinöl-Kraft", "Leicht", "Vegetarisch"], "bread"
        ),
        (
            "Omelette mit Champignons, Petersilie & Kirschtomaten", 6, 7, 380, 24, 8, 28,
            ["eier"], ["vegetarian", "pescetarian", "low_carb", "high_protein"],
            [
                make_ing("Eier Bio", 3, "Stück", "Kühlregal", "Netto"),
                make_ing("Champignons", 80, "g", "Obst & Gemüse", "Netto"),
                make_ing("Kirschtomaten", 60, "g", "Obst & Gemüse", "Netto"),
                make_ing("Petersilie frisch", 10, "g", "Kräuter", "Netto"),
                make_ing("Butter", 8, "g", "Kühlregal", "Netto"),
            ],
            ["Champignons in Scheiben schneiden und in Butter anbraten.", "Tomaten halbieren und kurz mitschwenken.", "Verquirlte Eier darübergießen und bei kleiner Hitze zum Omelette backen, mit Petersilie bestreuen."],
            ["Pilze putzen und schneiden.", "Eier verquirlen."],
            ["Pilze und Tomaten braten, Ei zugeben, stocken lassen und einmal zusammenklappen."],
            ["Schmeckt kalt in Streifen geschnitten auch herrlich im Lunch-Salat."],
            ["Pilz-Liebhaber", "Herzhaft", "Low-Carb"], "eggs"
        ),
        (
            "Bircher Müsli mit geriebenem Apfel & Haselnüssen", 6, 0, 460, 18, 64, 15,
            ["gluten", "laktose", "nuesse"], ["vegetarian", "pescetarian"],
            [
                make_ing("Zarte Haferflocken", 60, "g", "Trockensortiment", "NP"),
                make_ing("Äpfel", 120, "g", "Obst & Gemüse", "NP"),
                make_ing("Naturjoghurt", 150, "g", "Kühlregal", "NP"),
                make_ing("Mandeln", 20, "g", "Nüsse & Kerne", "NP"),
                make_ing("Honig", 10, "g", "Gewürze & Basics", "NP"),
            ],
            ["Haferflocken mit Joghurt und einem Schuss Wasser verrühren.", "Apfel mit Schale grob hineinreiben.", "Mit Honig süßen und gehackten Mandeln toppen."],
            ["Apfel waschen und mit der Küchenreibe grob raspeln.", "Mandeln hacken."],
            ["Alle Zutaten vermengen."],
            ["Der Schweizer Frühstücks-Klassiker – über Nacht zieht er perfekt durch."],
            ["Schweizer Original", "Traditionell", "Vegetarisch"], "oats"
        ),
        (
            "Protein-Skyr mit Mango & Cashewkernen", 5, 0, 440, 36, 46, 12,
            ["laktose", "nuesse"], ["vegetarian", "pescetarian", "high_protein"],
            [
                make_ing("Skyr Natur", 250, "g", "Kühlregal", "Lidl"),
                make_ing("Bananen", 80, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Heidelbeeren", 60, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Cashewkerne", 20, "g", "Nüsse & Kerne", "Lidl"),
                make_ing("Chiasamen", 10, "g", "Trockensortiment", "Lidl"),
            ],
            ["Skyr in eine Schale füllen.", "Obst mundgerecht schneiden und anrichten.", "Cashews und Chiasamen darüberstreuen."],
            ["Obst schneiden.", "Cashews kurz anrösten."],
            ["Anrichten und genießen."],
            ["Liefert Magnesium und langanhaltendes Protein."],
            ["Exotisch", "High-Protein", "Superfrucht"], "skyr"
        ),
        (
            "Rührei natur auf geröstetem Vollkornbrot", 5, 5, 420, 24, 38, 20,
            ["gluten", "eier"], ["vegetarian", "pescetarian"],
            [
                make_ing("Eier Bio", 3, "Stück", "Kühlregal", "Aldi Süd"),
                make_ing("Vollkornbrot", 80, "g", "Brot & Backwaren", "Aldi Süd"),
                make_ing("Butter", 8, "g", "Kühlregal", "Aldi Süd"),
                make_ing("Schnittlauch", 5, "g", "Kräuter", "Aldi Süd"),
                make_ing("Salz", 1, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Brot im Toaster oder der Pfanne rösten.", "Eier in Butter sanft bei mittlerer Hitze cremig rühren.", "Auf das Brot häufen und mit Schnittlauch bestreuen."],
            ["Eier in Schale schlagen, leicht salzen.", "Schnittlauch hacken."],
            ["In der Pfanne unter sanftem Schieben stocken lassen – nicht zu trocken werden lassen!"],
            ["Das 5-Minuten-Power-Frühstück."],
            ["Blitzschnell", "Klassiker", "Familie"], "eggs"
        ),
        (
            "Warmes Dinkelbrot mit Erdnussmus & Bananenscheiben", 4, 0, 440, 16, 54, 18,
            ["gluten", "nuesse"], ["vegan", "vegetarian", "pescetarian"],
            [
                make_ing("Vollkornbrot", 90, "g", "Brot & Backwaren", "Rewe"),
                make_ing("Erdnussmus", 25, "g", "Nüsse & Kerne", "Rewe"),
                make_ing("Bananen", 90, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Zimt", 1, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Vollkornbrot knusprig toasten.", "Mit Erdnussmus bestreichen.", "Bananenscheiben darauflegen und mit etwas Zimt bestreuen."],
            ["Brot toasten, Banane in Scheiben schneiden."],
            ["Bestreichen und anrichten."],
            ["Kinder lieben diese gesunde Variante des Klassikers."],
            ["Kinderfavorit", "Schnell", "Vegan"], "bread"
        ),
        (
            "Beeren-Chia-Pudding mit Hafermilch & Mandeln", 5, 0, 410, 14, 46, 19,
            ["nuesse"], ["vegan", "vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Chiasamen", 25, "g", "Trockensortiment", "Kaufland"),
                make_ing("Hafermilch", 180, "ml", "Getränke", "Kaufland"),
                make_ing("Himbeeren", 80, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Mandeln", 20, "g", "Nüsse & Kerne", "Kaufland"),
                make_ing("Ahornsirup", 10, "ml", "Gewürze & Basics", "Kaufland"),
            ],
            ["Chiasamen mit Hafermilch und Sirup gut verquirlen.", "10 Minuten stehen lassen, nochmals umrühren.", "Über Nacht kühlen und mit Beeren und Mandeln toppen."],
            ["Zutaten abmessen."],
            ["Im Glas verrühren und quellen lassen."],
            ["Super für die Lunchbox – läuft garantiert nicht aus."],
            ["Glutenfrei", "Omega-3", "Vegan"], "bowl"
        ),
        (
            "Fitness-Brotdose: Gekochte Eier, Gemüsesticks & Kräuterquark", 8, 7, 390, 28, 22, 21,
            ["eier", "laktose"], ["vegetarian", "pescetarian", "low_carb", "high_protein"],
            [
                make_ing("Eier Bio", 2, "Stück", "Kühlregal", "Edeka"),
                make_ing("Magerquark", 150, "g", "Kühlregal", "Edeka"),
                make_ing("Karotten", 80, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Gurke", 80, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Paprika bunt", 60, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Petersilie frisch", 10, "g", "Kräuter", "Edeka"),
            ],
            ["Eier hartkochen (9 Min), abschrecken und pellen.", "Quark mit Kräutern und Salz glattrühren.", "Gemüse in Sticks schneiden und alles in der Bento-Box anrichten."],
            ["Gemüse waschen und in handliche Stifte schneiden."],
            ["Eier kochen, Quark mit Kräutern abschmecken."],
            ["Bunt, knackig und maximal frisch bis zum Nachmittag."],
            ["Bento-Box", "Meal-Prep", "Low-Carb"], "eggs"
        ),
        (
            "Knusper-Müsli mit Naturjoghurt & frischen Beeren", 4, 0, 430, 20, 58, 14,
            ["gluten", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Zarte Haferflocken", 50, "g", "Trockensortiment", "Netto"),
                make_ing("Naturjoghurt", 200, "g", "Kühlregal", "Netto"),
                make_ing("Heidelbeeren", 80, "g", "Obst & Gemüse", "Netto"),
                make_ing("Sonnenblumenkerne", 15, "g", "Nüsse & Kerne", "Netto"),
                make_ing("Honig", 10, "g", "Gewürze & Basics", "Netto"),
            ],
            ["Joghurt in die Schale geben und mit Honig beträufeln.", "Haferflocken und Sonnenblumenkerne darübergeben.", "Mit Blaubeeren garnieren."],
            ["Blaubeeren abbrausen."],
            ["In Schichten anrichten."],
            ["Schneller kann gesunder Start in den Tag nicht sein."],
            ["Blitz-Frühstück", "Knusprig", "Familie"], "oats"
        ),
        (
            "Kräuter-Rührei mit gebratenen Champignons & Vollkornbrot", 6, 6, 420, 26, 36, 20,
            ["gluten", "eier"], ["vegetarian", "pescetarian"],
            [
                make_ing("Eier Bio", 2, "Stück", "Kühlregal", "NP"),
                make_ing("Champignons", 80, "g", "Obst & Gemüse", "NP"),
                make_ing("Vollkornbrot", 80, "g", "Brot & Backwaren", "NP"),
                make_ing("Schnittlauch", 10, "g", "Kräuter", "NP"),
                make_ing("Butter", 8, "g", "Kühlregal", "NP"),
            ],
            ["Champignons blättrig schneiden und in Butter kross braten.", "Verquirlte Eier dazugeben und vorsichtig stocken lassen.", "Auf getoastetem Brot servieren und Schnittlauch darübergeben."],
            ["Champignons schneiden, Eier verquirlen."],
            ["Erst Pilze braten, dann Eier einrühren."],
            ["Pilze liefern wertvolle B-Vitamine."],
            ["Herzhaft", "Herbst", "Vegetarisch"], "eggs"
        ),
        (
            "Heidelbeer-Skyr-Shake mit Chiasamen to-go", 4, 0, 380, 32, 42, 8,
            ["laktose"], ["vegetarian", "pescetarian", "gluten_free", "high_protein"],
            [
                make_ing("Skyr Natur", 250, "g", "Kühlregal", "Lidl"),
                make_ing("Heidelbeeren", 100, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Mandelmilch", 150, "ml", "Getränke", "Lidl"),
                make_ing("Chiasamen", 10, "g", "Trockensortiment", "Lidl"),
                make_ing("Honig", 10, "g", "Gewürze & Basics", "Lidl"),
            ],
            ["Alle Zutaten in den Mixer geben.", "30 Sekunden cremig pürieren.", "In die Trinkflasche füllen und unterwegs genießen."],
            ["Zutaten im Mixbecher sammeln."],
            ["Glatt pürieren."],
            ["Der perfekte Shake für den Schulweg oder die Bahnfahrt."],
            ["Trinkbar", "Unterwegs", "High-Protein"], "skyr"
        ),
        (
            "Vollkorn-Stulle mit Bio-Ei & Schnittlauch", 6, 7, 390, 20, 38, 18,
            ["gluten", "eier", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Vollkornbrot", 90, "g", "Brot & Backwaren", "Aldi Süd"),
                make_ing("Eier Bio", 2, "Stück", "Kühlregal", "Aldi Süd"),
                make_ing("Butter", 10, "g", "Kühlregal", "Aldi Süd"),
                make_ing("Schnittlauch", 10, "g", "Kräuter", "Aldi Süd"),
                make_ing("Salz", 1, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Eier 7 Minuten kochen, abschrecken und pellen.", "Brot dünn mit Butter bestreichen.", "Eischeiben auflegen, leicht salzen und reichlich Schnittlauch darübergeben."],
            ["Eier kochen und in Scheiben schneiden.", "Schnittlauch hacken."],
            ["Brot belegen."],
            ["Der absolute deutsche Pausenbrot-Klassiker."],
            ["Traditionell", "Klassiker", "Pausenbrot"], "bread"
        ),
        (
            "Warmer Dinkel-Grießbrei mit Apfel-Zimt-Kompott", 6, 6, 440, 16, 72, 10,
            ["gluten", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Dinkelflocken", 60, "g", "Trockensortiment", "Rewe"),
                make_ing("Milch", 200, "ml", "Kühlregal", "Rewe"),
                make_ing("Äpfel", 120, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Zimt", 2, "g", "Gewürze & Basics", "Vorratskammer"),
                make_ing("Butter", 5, "g", "Kühlregal", "Rewe"),
            ],
            ["Milch erhitzen, Flocken einrühren und unter Rühren 3 Minuten quellen lassen.", "Apfel würfeln und in etwas Butter mit Zimt andünsten.", "Brei in die Schale füllen und mit warmem Kompott toppen."],
            ["Apfel schälen und klein schneiden."],
            ["Brei kochen, Kompott dünsten."],
            ["Tröstend und warm an kalten Wintermorgen."],
            ["Seelenfutter", "Winter", "Vegetarisch"], "oats"
        ),
        (
            "Vollkorn-Toastie mit pochiertem Ei & Avocadostreifen", 6, 5, 420, 18, 36, 24,
            ["gluten", "eier"], ["vegetarian", "pescetarian"],
            [
                make_ing("Vollkornbrot", 80, "g", "Brot & Backwaren", "Kaufland"),
                make_ing("Eier Bio", 2, "Stück", "Kühlregal", "Kaufland"),
                make_ing("Avocado", 60, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Kirschtomaten", 60, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Salz", 1, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Brot rösten.", "Eier in siedendem Wasser mit einem Schuss Essig 4 Minuten pochieren.", "Avocadostreifen auf das Brot legen, pochierte Eier daraufsetzen und Tomaten beilegen."],
            ["Brot toasten, Avocado in Spalten schneiden."],
            ["Eier pochieren oder wachsweich kochen."],
            ["Wochenend-Brunch Feeling an jedem Wochentag."],
            ["Brunch", "Sonntagsgefühl", "Vegetarisch"], "bread"
        ),
        (
            "Quark-Bowl mit Banane, Kakao & Mandelsplittern", 4, 0, 430, 34, 48, 11,
            ["laktose", "nuesse"], ["vegetarian", "pescetarian", "high_protein"],
            [
                make_ing("Magerquark", 250, "g", "Kühlregal", "Edeka"),
                make_ing("Bananen", 90, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Mandeln", 15, "g", "Nüsse & Kerne", "Edeka"),
                make_ing("Honig", 10, "g", "Gewürze & Basics", "Edeka"),
                make_ing("Milch", 30, "ml", "Kühlregal", "Edeka"),
            ],
            ["Quark mit Milch und Honig cremig schlagen.", "Banane in Scheiben schneiden.", "Mit Mandelsplittern garnieren."],
            ["Banane schneiden, Mandeln hacken."],
            ["Quark anrühren und anrichten."],
            ["Schmeckt wie Schoko-Bananen-Dessert, ist aber High-Protein."],
            ["Süßhunger", "High-Protein", "Schnell"], "skyr"
        ),
    ]

    for idx, (title, prep, cook, cal, p, c, f, alg, diets, ings, instrs, p_steps, c_steps, l_tips, tags, img) in enumerate(bf_data, 1):
        recipes.append(create_recipe(
            f"uni-bf-{idx}", title, "breakfast_lunchbox", prep, cook, "Einfach", True,
            cal, p, c, f, alg, diets, ings, instrs, p_steps, c_steps, l_tips, tags, img
        ))

    # =========================================================================
    # 35 MITTAGS-REZEPTE (LUNCH & TO-GO MEAL-PREP)
    # =========================================================================
    lu_data = [
        (
            "Bunte Quinoa-Hähnchenbrust-Bowl mit Brokkoli", 10, 15, 540, 42, 52, 16,
            [], ["high_protein"],
            [
                make_ing("Hähnchenbrust", 150, "g", "Fleisch", "Netto"),
                make_ing("Quinoa", 60, "g", "Trockensortiment", "Netto"),
                make_ing("Brokkoli", 120, "g", "Obst & Gemüse", "Netto"),
                make_ing("Kirschtomaten", 80, "g", "Obst & Gemüse", "Netto"),
                make_ing("Olivenöl", 10, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Zitrone", 15, "g", "Obst & Gemüse", "Netto"),
            ],
            ["Quinoa in der doppelten Menge Wasser 15 Min köcheln.", "Hähnchenbrust in Streifen schneiden und im Olivenöl goldbraun braten.", "Brokkoli dämpfen, mit Quinoa, Fleisch und Tomaten in der Schale anrichten."],
            ["Hähnchen schneiden, Brokkoli in Röschen teilen.", "Quinoa heiß abbrausen."],
            ["Quinoa garen, Hähnchen scharf anbraten, Brokkoli 5 Min dämpfen.", "Mit Zitronensaft und Olivenöl abschmecken."],
            ["Kalt als Salat oder warm aus der Mikrowelle genial."],
            ["Power-Bowl", "Meal-Prep", "Glutenfrei"], "bowl"
        ),
        (
            "Mediterrane Linsen-Feta-Bowl mit Kirschtomaten", 10, 15, 510, 28, 54, 19,
            ["laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Rote Linsen", 70, "g", "Trockensortiment", "NP"),
                make_ing("Feta", 60, "g", "Kühlregal", "NP"),
                make_ing("Gurke", 80, "g", "Obst & Gemüse", "NP"),
                make_ing("Kirschtomaten", 80, "g", "Obst & Gemüse", "NP"),
                make_ing("Olivenöl", 10, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Petersilie frisch", 10, "g", "Kräuter", "NP"),
            ],
            ["Rote Linsen 10-12 Minuten bissfest garen und abkühlen lassen.", "Gurke und Tomaten würfeln, Petersilie hacken.", "Linsen mit Gemüse vermengen, Feta darüberkrümeln und mit Olivenöl beträufeln."],
            ["Gemüse waschen und schneiden.", "Feta würfeln."],
            ["Linsen kochen, abgießen und mit Olivenöl, Salz und Zitronensaft marinieren."],
            ["Zieht über Nacht durch und schmeckt am nächsten Tag noch besser!"],
            ["Meal-Prep", "Vegetarisch", "Mediterran"], "salad"
        ),
        (
            "Kichererbsen-Thunfisch-Salat mit Bio-Ei", 10, 8, 490, 44, 34, 18,
            ["fisch", "eier"], ["pescetarian", "high_protein", "gluten_free"],
            [
                make_ing("Thunfisch Dose", 120, "g", "Konserven", "Lidl"),
                make_ing("Kichererbsen Dose", 150, "g", "Konserven", "Lidl"),
                make_ing("Eier Bio", 1, "Stück", "Kühlregal", "Lidl"),
                make_ing("Paprika rot", 80, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Frühlingszwiebeln", 30, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Olivenöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Kichererbsen abspülen, Thunfisch abtropfen lassen.", "Ei hart kochen und vierteln.", "Paprika und Frühlingszwiebeln fein schneiden, alles mit Olivenöl und Zitronensaft vermengen."],
            ["Dosen öffnen, Gemüse schnippeln."],
            ["Ei 8 Minuten kochen, abschrecken und pellen.", "Alle Zutaten in der Schüssel vorsichtig mischen."],
            ["Extrem sättigend durch Ballaststoffe und 44g Eiweiß."],
            ["Protein-Bombe", "Glutenfrei", "Schnell"], "salad"
        ),
        (
            "Vollkorn-Wrap mit Putenbrust, Avocado & Rucola", 8, 0, 470, 32, 44, 18,
            ["gluten"], ["high_protein"],
            [
                make_ing("Vollkorn-Wraps", 1, "Stück", "Brot & Backwaren", "Aldi Nord"),
                make_ing("Putenbrust Aufschnitt", 80, "g", "Fleisch", "Aldi Nord"),
                make_ing("Avocado", 50, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Rucola", 30, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Tomaten", 60, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Frischkäse", 30, "g", "Kühlregal", "Aldi Nord"),
            ],
            ["Wrap dünn mit Frischkäse bestreichen.", "Mit zerdrückter Avocado, Putenbrust, Tomatenscheiben und Rucola belegen.", "Fest einrollen und schräg durchschneiden."],
            ["Gemüse waschen, Avocado entkernen."],
            ["Schichten und stramm aufrollen."],
            ["Perfekt für die Schultasche oder Aktentasche."],
            ["To-Go-Klassiker", "Handlich", "Frisch"], "wrap"
        ),
        (
            "Bunter Vollkorn-Nudelsalat mit Mozzarella & Paprika", 10, 10, 520, 24, 62, 19,
            ["gluten", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Vollkornnudeln", 70, "g", "Trockensortiment", "Aldi Süd"),
                make_ing("Mozzarella", 80, "g", "Kühlregal", "Aldi Süd"),
                make_ing("Paprika bunt", 80, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Kirschtomaten", 80, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Basilikum frisch", 10, "g", "Kräuter", "Aldi Süd"),
                make_ing("Olivenöl", 10, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Nudeln nach Packungsanweisung bissfest kochen und kalt abbrausen.", "Paprika und Mozzarella würfeln, Tomaten halbieren.", "Alles mit Olivenöl, Balsamico und Basilikum vermischen."],
            ["Nudelwasser aufsetzen, Gemüse schneiden."],
            ["Nudeln kochen, abgießen und mit den frischen Zutaten vermengen."],
            ["Klassischer Meal-Prep Salat für 2 Tage haltbar."],
            ["Familien-Hit", "Vegetarisch", "Meal-Prep"], "pasta"
        ),
        (
            "Teriyaki-Lachs-Bowl mit Naturreis & Edamame", 12, 15, 560, 36, 56, 20,
            ["fisch", "soja"], ["pescetarian", "high_protein"],
            [
                make_ing("Lachsfilet", 130, "g", "Fisch", "Rewe"),
                make_ing("Naturreis", 60, "g", "Trockensortiment", "Rewe"),
                make_ing("Edamame", 80, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Gurke", 60, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Sojasoße", 15, "ml", "Gewürze & Basics", "Rewe"),
                make_ing("Sesam", 5, "g", "Nüsse & Kerne", "Rewe"),
            ],
            ["Naturreis gar kochen.", "Lachsfilet in Würfel schneiden und in der Pfanne 4 Minuten anbraten, mit Sojasoße ablöschen.", "Reis in die Schale füllen, Lachs, Edamame und Gurke darauf arrangieren."],
            ["Lachs würfeln, Gurke hobeln."],
            ["Reis kochen, Lachs kross braten und glasieren."],
            ["Restaurant-Qualität aus der eigenen Brotdose."],
            ["Omega-3", "Asiatisch", "High-Protein"], "salmon"
        ),
        (
            "Süßkartoffel-Bowl mit schwarzen Bohnen & Mais", 10, 20, 480, 18, 76, 11,
            [], ["vegan", "vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Süßkartoffeln", 150, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Kidneybohnen Dose", 120, "g", "Konserven", "Kaufland"),
                make_ing("Paprika rot", 80, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Avocado", 40, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Olivenöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Süßkartoffeln würfeln und im Ofen bei 200°C 20 Minuten rösten.", "Bohnen abspülen.", "Mit Paprika und Avocadospalten in einer Bowl anrichten."],
            ["Ofen vorheizen, Süßkartoffel schälen und würfeln."],
            ["Im Ofen rösten, bis die Kanten knusprig sind."],
            ["Reich an pflanzlichen Ballaststoffen und komplexen Kohlenhydraten."],
            ["Vegan", "Mexikanisch", "Glutenfrei"], "sweetpotato"
        ),
        (
            "Griechischer Bauernsalat mit Feta & Vollkornbrot", 8, 0, 460, 20, 36, 26,
            ["gluten", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Feta", 80, "g", "Kühlregal", "Edeka"),
                make_ing("Gurke", 100, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Tomaten", 100, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Paprika rot", 60, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Vollkornbrot", 60, "g", "Brot & Backwaren", "Edeka"),
                make_ing("Olivenöl", 12, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Oregano getrocknet", 2, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Gurke, Tomaten und Paprika in grobe Stücke schneiden.", "Feta darüberbröckeln, mit reichlich Oregano, Olivenöl und Salz würzen.", "Mit einer Scheibe frischem Vollkornbrot genießen."],
            ["Gemüse waschen und grob zerkleinern."],
            ["In der Salatschüssel marinieren."],
            ["Frisch und knackig – Dressing erst kurz vor dem Essen zugeben."],
            ["Sommer", "Mediterran", "Vegetarisch"], "salad"
        ),
        (
            "Hähnchen-Avocado-Wrap mit Babyspinat", 8, 8, 490, 36, 42, 19,
            ["gluten"], ["high_protein"],
            [
                make_ing("Vollkorn-Wraps", 1, "Stück", "Brot & Backwaren", "Netto"),
                make_ing("Hähnchenbrust", 120, "g", "Fleisch", "Netto"),
                make_ing("Avocado", 50, "g", "Obst & Gemüse", "Netto"),
                make_ing("Babyspinat", 30, "g", "Obst & Gemüse", "Netto"),
                make_ing("Kirschtomaten", 50, "g", "Obst & Gemüse", "Netto"),
                make_ing("Olivenöl", 5, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Hähnchenbrust in Streifen schneiden und kurz anbraten.", "Wrap mit zerdrückter Avocado bestreichen, mit Spinat, Tomaten und warmem Hähnchen belegen.", "Einrollen und einpacken."],
            ["Fleisch in feine Streifen schneiden."],
            ["Scharf in der Pfanne braten (ca. 5-6 Minuten)."],
            ["Sehr stabil beim Transport, schmeckt warm und kalt hervorragend."],
            ["Sportler-Lunch", "High-Protein", "Frisch"], "wrap"
        ),
        (
            "Räuchertofu-Quinoa-Bowl mit Zucchini & Tahini", 10, 15, 480, 24, 52, 19,
            ["soja", "sesam"], ["vegan", "vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Räuchertofu", 120, "g", "Kühlregal", "NP"),
                make_ing("Quinoa", 60, "g", "Trockensortiment", "NP"),
                make_ing("Zucchini", 100, "g", "Obst & Gemüse", "NP"),
                make_ing("Karotten", 60, "g", "Obst & Gemüse", "NP"),
                make_ing("Tahini", 15, "g", "Nüsse & Kerne", "NP"),
                make_ing("Sojasoße", 10, "ml", "Gewürze & Basics", "NP"),
            ],
            ["Quinoa 15 Minuten gar kochen.", "Räuchertofu würfeln und in der Pfanne kross braten.", "Zucchini und Karotten kurz anbraten, alles mit Tahini-Dressing servieren."],
            ["Tofu würfeln, Gemüse stifteln."],
            ["Tofu kross braten, Gemüse bissfest garen."],
            ["Pflanzliche Proteine vom Feinsten mit feiner Rauchnote."],
            ["Vegan", "Pflanzenpower", "Glutenfrei"], "bowl"
        ),
        (
            "Vollkorn-Penne mit Tomaten-Basilikum-Sugo & Rucola", 8, 12, 460, 18, 74, 9,
            ["gluten"], ["vegan", "vegetarian", "pescetarian"],
            [
                make_ing("Vollkornnudeln", 80, "g", "Trockensortiment", "Lidl"),
                make_ing("Dosentomaten", 200, "g", "Konserven", "Lidl"),
                make_ing("Rucola", 40, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Knoblauch", 5, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Olivenöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Basilikum getrocknet", 2, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Nudeln kochen.", "Knoblauch in Olivenöl anschwitzen, Tomaten zugeben und 10 Min einköcheln.", "Nudeln mit Sauce mischen und mit frischem Rucola garnieren."],
            ["Knoblauch fein hacken."],
            ["Sugo sanft köcheln lassen, Nudeln unterheben."],
            ["Der unkomplizierte italienische Seelenwärmer."],
            ["Italienisch", "Schnell", "Vegan"], "pasta"
        ),
        (
            "Couscous-Salat mit Kichererbsen, Gurke & Minze", 8, 5, 440, 16, 68, 11,
            ["gluten"], ["vegan", "vegetarian", "pescetarian"],
            [
                make_ing("Couscous", 60, "g", "Trockensortiment", "Aldi Nord"),
                make_ing("Kichererbsen Dose", 120, "g", "Konserven", "Aldi Nord"),
                make_ing("Gurke", 80, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Kirschtomaten", 80, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Zitrone", 15, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Olivenöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Couscous mit heißem Wasser übergießen und 5 Min quellen lassen.", "Kichererbsen, Gurken- und Tomatenwürfel unterheben.", "Mit Zitronensaft, Minze und Olivenöl abschmecken."],
            ["Wasser im Wasserkocher erhitzen, Gemüse würfeln."],
            ["Couscous auflockern und marinieren."],
            ["In 10 Minuten fertig und hält 3 Tage im Kühlschrank frisch."],
            ["Blitz-Mealprep", "Sommer", "Vegan"], "salad"
        ),
        (
            "Putenstreifen auf buntem Blattsalat mit Walnüssen", 8, 8, 430, 36, 12, 26,
            ["nuesse"], ["high_protein", "gluten_free", "low_carb"],
            [
                make_ing("Putenbrustfilet", 150, "g", "Fleisch", "Aldi Süd"),
                make_ing("Feldsalat", 80, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Kirschtomaten", 80, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Walnüsse", 20, "g", "Nüsse & Kerne", "Aldi Süd"),
                make_ing("Olivenöl", 10, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Essig Balsamico", 10, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Putenbrust in Streifen schneiden, salzen und in etwas Öl 6 Minuten kross anbraten.", "Salat waschen, mit Tomaten auf dem Teller anrichten.", "Warme Putenstreifen und Walnüsse daraufgeben, mit Vinaigrette beträufeln."],
            ["Fleisch schneiden, Salat putzen."],
            ["Fleisch braten, Dressing anrühren."],
            ["Dressing separat in ein kleines Döschen füllen, erst vor Ort über den Salat geben!"],
            ["Low-Carb", "Knackig", "High-Protein"], "salad"
        ),
        (
            "Kartoffel-Gemüse-Salat mit gekochtem Ei", 10, 15, 450, 18, 54, 18,
            ["eier"], ["vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Kartoffeln", 200, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Eier Bio", 2, "Stück", "Kühlregal", "Rewe"),
                make_ing("Gurke", 80, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Frühlingszwiebeln", 30, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Rapsöl", 10, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Senf", 10, "ml", "Gewürze & Basics", "Rewe"),
            ],
            ["Kartoffeln gar kochen, pellen und in Scheiben schneiden.", "Eier hart kochen und vierteln.", "Mit Gurkenscheiben, Frühlingszwiebeln, Senf-Vinaigrette und Salz vermengen."],
            ["Kartoffeln waschen."],
            ["Kartoffeln kochen (ca. 18 Min), Eier kochen (8 Min)."],
            ["Ein traditioneller deutscher Klassiker ohne Mayonnaise – leicht und bekömmlich."],
            ["Traditionell", "Familienliebling", "Glutenfrei"], "salad"
        ),
        (
            "Cremige Süßkartoffel-Ingwer-Suppe mit Kürbiskernen", 10, 18, 410, 10, 62, 14,
            [], ["vegan", "vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Süßkartoffeln", 250, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Karotten", 100, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Ingwer", 10, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Kokosmilch", 80, "ml", "Konserven", "Kaufland"),
                make_ing("Kürbiskerne", 15, "g", "Nüsse & Kerne", "Kaufland"),
            ],
            ["Süßkartoffeln, Karotten und Ingwer schälen, grob würfeln und in Wasser 15 Min weichkochen.", "Kokosmilch zugeben und fein pürieren.", "Mit gerösteten Kürbiskernen garniert servieren."],
            ["Gemüse schälen und schneiden."],
            ["Weichkochen und mit Pürierstab cremig mixen."],
            ["Lässt sich in einer Thermoskanne perfekt heiß mitnehmen."],
            ["Wärmend", "Immunsystem", "Vegan"], "soup"
        ),
        (
            "Vollkorn-Sandwich mit Räucherlachs & Ei", 6, 7, 460, 30, 36, 22,
            ["gluten", "fisch", "eier", "laktose"], ["pescetarian", "high_protein"],
            [
                make_ing("Vollkornbrot", 90, "g", "Brot & Backwaren", "Edeka"),
                make_ing("Räucherlachs", 60, "g", "Fisch", "Edeka"),
                make_ing("Eier Bio", 1, "Stück", "Kühlregal", "Edeka"),
                make_ing("Gurke", 40, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Frischkäse", 30, "g", "Kühlregal", "Edeka"),
            ],
            ["Ei kochen und in Scheiben schneiden.", "Brot mit Frischkäse bestreichen.", "Mit Räucherlachs, Gurke und Eischeiben als Doppelstock-Sandwich zusammenklappen."],
            ["Ei 7 Min kochen."],
            ["Sandwich belegen."],
            ["Sattes Sandwich für lange Arbeitstage."],
            ["Gourmet", "Omega-3", "Sandwich"], "bread"
        ),
        (
            "Asiatische Reispfanne mit Hähnchen, Paprika & Erbsen", 10, 12, 530, 38, 62, 13,
            ["soja"], ["high_protein", "gluten_free"],
            [
                make_ing("Hähnchenbrust", 140, "g", "Fleisch", "Netto"),
                make_ing("Naturreis", 60, "g", "Trockensortiment", "Netto"),
                make_ing("Paprika rot", 80, "g", "Obst & Gemüse", "Netto"),
                make_ing("TK Erbsen", 60, "g", "Tiefkühl", "Netto"),
                make_ing("Sojasoße", 15, "ml", "Gewürze & Basics", "Netto"),
                make_ing("Rapsöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Reis vorkochen.", "Hähnchen würfeln und in Rapsöl 5 Minuten braten.", "Paprika und Erbsen zugeben, mit Reis und Sojasoße durchschwenken."],
            ["Fleisch und Paprika schneiden."],
            ["Alles im Wok oder einer großen Pfanne heiß anbraten."],
            ["Super zum Vorkochen für 2-3 Tage geeignet."],
            ["Wok-Klassiker", "Meal-Prep", "Kinderliebling"], "chicken"
        ),
        (
            "Mexikanische Burrito-Bowl mit Rinderhack & Naturreis", 10, 15, 550, 36, 58, 18,
            [], ["high_protein", "gluten_free"],
            [
                make_ing("Rinderhack", 120, "g", "Fleisch", "NP"),
                make_ing("Naturreis", 60, "g", "Trockensortiment", "NP"),
                make_ing("Kidneybohnen Dose", 80, "g", "Konserven", "NP"),
                make_ing("Kirschtomaten", 60, "g", "Obst & Gemüse", "NP"),
                make_ing("Avocado", 40, "g", "Obst & Gemüse", "NP"),
            ],
            ["Reis kochen.", "Rinderhack krümelig anbraten und mit Paprikapulver und Kreuzkümmel würzen.", "Bohnen erhitzen, mit Tomaten und Avocado auf dem Reis anrichten."],
            ["Gemüse schneiden, Hack bereitstellen."],
            ["Hack scharf anbraten, würzen."],
            ["Voller Geschmack, proteinreich und hält lange satt."],
            ["Mexikanisch", "Kraftpaket", "Glutenfrei"], "bowl"
        ),
        (
            "Rote-Linsen-Suppe mit Kokosmilch & Koriander", 10, 15, 460, 20, 56, 16,
            [], ["vegan", "vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Rote Linsen", 70, "g", "Trockensortiment", "Lidl"),
                make_ing("Karotten", 80, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Kokosmilch", 80, "ml", "Konserven", "Lidl"),
                make_ing("Zwiebeln", 40, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Currypulver", 3, "g", "Gewürze & Basics", "Vorratskammer"),
                make_ing("Koriander frisch", 10, "g", "Kräuter", "Lidl"),
            ],
            ["Zwiebel und Karotten anschwitzen, Currypulver kurz mitrösten.", "Linsen und 300ml Wasser zugeben, 12 Minuten köcheln.", "Kokosmilch einrühren, anpürieren und mit Koriander servieren."],
            ["Gemüse fein würfeln."],
            ["Suppe kochen und abschmecken."],
            ["Ein echter Wärmespender für regnerische Tage."],
            ["Wärmend", "Vegan", "Schnell"], "soup"
        ),
        (
            "Vollkorn-Wrap mit Hummus, Grillgemüse & Feta", 8, 8, 450, 18, 48, 20,
            ["gluten", "laktose", "sesam"], ["vegetarian", "pescetarian"],
            [
                make_ing("Vollkorn-Wraps", 1, "Stück", "Brot & Backwaren", "Aldi Nord"),
                make_ing("Zucchini", 80, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Paprika rot", 60, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Feta", 50, "g", "Kühlregal", "Aldi Nord"),
                make_ing("Tahini", 15, "g", "Nüsse & Kerne", "Aldi Nord"),
                make_ing("Olivenöl", 5, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Zucchini und Paprika in Streifen schneiden und in der Pfanne kurz grillen.", "Wrap mit Tahini bestreichen.", "Grillgemüse und Feta auflegen, einrollen."],
            ["Gemüse schneiden."],
            ["Gemüse mit Olivenöl anbraten."],
            ["Schmeckt wie vom orientalischen Feinkostladen."],
            ["Vegetarisch", "Grillgemüse", "To-Go"], "wrap"
        ),
        (
            "Brokkoli-Kichererbsen-Pfanne mit Sesam & Sojasoße", 8, 10, 420, 18, 48, 16,
            ["soja", "sesam"], ["vegan", "vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Brokkoli", 150, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Kichererbsen Dose", 140, "g", "Konserven", "Aldi Süd"),
                make_ing("Karotten", 60, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Sojasoße", 15, "ml", "Gewürze & Basics", "Aldi Süd"),
                make_ing("Sesam", 10, "g", "Nüsse & Kerne", "Aldi Süd"),
                make_ing("Rapsöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Brokkoli in kleine Röschen teilen, Karotten stifteln.", "In Rapsöl 5 Minuten bissfest anbraten.", "Kichererbsen und Sojasoße zugeben, 3 Min schwenken, mit Sesam toppen."],
            ["Gemüse schneiden, Kichererbsen abspülen."],
            ["Im Wok braten und würzen."],
            ["Perfekt als ballaststoffreicher Leicht-Lunch."],
            ["Low-Calorie", "Ballaststoffe", "Vegan"], "veggie"
        ),
        (
            "Quinoa-Taboulé mit Petersilie, Gurke & Zitrone", 10, 15, 430, 14, 56, 17,
            [], ["vegan", "vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Quinoa", 60, "g", "Trockensortiment", "Rewe"),
                make_ing("Petersilie frisch", 30, "g", "Kräuter", "Rewe"),
                make_ing("Gurke", 80, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Tomaten", 80, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Frühlingszwiebeln", 20, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Olivenöl", 12, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Zitrone", 20, "g", "Obst & Gemüse", "Rewe"),
            ],
            ["Quinoa kochen und abkühlen lassen.", "Petersilie sehr fein hacken, Gemüse fein würfeln.", "Alles mit viel Zitronensaft, Olivenöl und Salz anmachen."],
            ["Petersilie waschen und trockenschütteln.", "Gemüse fein hacken."],
            ["Alles in einer großen Schale ziehen lassen."],
            ["Extrem erfrischend an heißen Sommertagen."],
            ["Erfrischend", "Kräuter-Power", "Vegan"], "salad"
        ),
        (
            "Fitness-Lunchbox: Hähnchenstreifen, Gurke, Tomate & Quarkdip", 10, 8, 440, 46, 16, 18,
            ["laktose"], ["high_protein", "low_carb", "gluten_free"],
            [
                make_ing("Hähnchenbrust", 160, "g", "Fleisch", "Kaufland"),
                make_ing("Magerquark", 150, "g", "Kühlregal", "Kaufland"),
                make_ing("Gurke", 100, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Kirschtomaten", 80, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Schnittlauch", 10, "g", "Kräuter", "Kaufland"),
                make_ing("Rapsöl", 5, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Hähnchenbrust mit Paprikapulver würzen und in Rapsöl 6 Minuten braten, abkühlen lassen.", "Quark mit Schnittlauch, Salz und Pfeffer zum Dip rühren.", "Fleisch in Streifen schneiden und mit Gurke, Tomaten und Dip einpacken."],
            ["Fleisch vorbereiten, Gemüse waschen."],
            ["Hähnchen braten, Dip anrühren."],
            ["46g Eiweiß – optimal nach dem Workout."],
            ["High-Protein", "Fitness", "Low-Carb"], "chicken"
        ),
        (
            "Vollkorn-Nudeln mit cremiger Avocado-Pesto", 10, 10, 510, 16, 64, 22,
            ["gluten"], ["vegan", "vegetarian", "pescetarian"],
            [
                make_ing("Vollkornnudeln", 80, "g", "Trockensortiment", "Edeka"),
                make_ing("Avocado", 60, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Basilikum frisch", 15, "g", "Kräuter", "Edeka"),
                make_ing("Knoblauch", 3, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Zitrone", 10, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Walnüsse", 15, "g", "Nüsse & Kerne", "Edeka"),
            ],
            ["Nudeln kochen.", "Avocado, Basilikum, Knoblauch, Walnüsse und Zitronensaft mit 2 EL Nudelwasser cremig pürieren.", "Pesto unter die heißen Nudeln ziehen."],
            ["Pesto-Zutaten abmessen."],
            ["Nudeln garen, Pesto pürieren und mischen."],
            ["Herrlich grün, cremig ohne Sahne."],
            ["Cremig", "Pflanzenfette", "Vegan"], "pasta"
        ),
        (
            "Minestrone mit buntem Gemüse & Vollkorn-Penne", 10, 15, 420, 16, 68, 8,
            ["gluten"], ["vegan", "vegetarian", "pescetarian"],
            [
                make_ing("Vollkornnudeln", 50, "g", "Trockensortiment", "Netto"),
                make_ing("Zucchini", 80, "g", "Obst & Gemüse", "Netto"),
                make_ing("Karotten", 60, "g", "Obst & Gemüse", "Netto"),
                make_ing("Dosentomaten", 150, "g", "Konserven", "Netto"),
                make_ing("Kichererbsen Dose", 80, "g", "Konserven", "Netto"),
                make_ing("Oregano getrocknet", 2, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Gemüse würfeln und in 1 TL Öl kurz andünsten.", "Tomaten und 300ml Wasser zugeben, Nudeln und Kichererbsen einrühren.", "12 Minuten köcheln lassen und herzhaft abschmecken."],
            ["Gemüse schneiden."],
            ["Im Topf alles sanft garen."],
            ["Italienischer Eintopf-Klassiker."],
            ["Eintopf", "Italienisch", "Gemüse"], "soup"
        ),
        (
            "Bulgur-Pfanne mit Zucchini, Paprika & Rinderhack", 10, 12, 520, 34, 52, 19,
            ["gluten"], ["high_protein"],
            [
                make_ing("Bulgur", 60, "g", "Trockensortiment", "NP"),
                make_ing("Rinderhack", 120, "g", "Fleisch", "NP"),
                make_ing("Zucchini", 80, "g", "Obst & Gemüse", "NP"),
                make_ing("Paprika rot", 80, "g", "Obst & Gemüse", "NP"),
                make_ing("Tomatenmark", 20, "g", "Konserven", "NP"),
                make_ing("Rapsöl", 5, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Bulgur mit heißem Wasser übergießen und quellen lassen.", "Hack mit Zwiebeln anbraten, Tomatenmark und Gemüse zugeben.", "Bulgur unterrühren und mit Kreuzkümmel abschmecken."],
            ["Gemüse würfeln."],
            ["Hack scharf braten, Gemüse und Tomatenmark mitgaren."],
            ["Würzig, sättigend und schnell gemacht."],
            ["Würzig", "One-Pan", "Herzhaft"], "veggie"
        ),
        (
            "Bunte Lachs-Bowl mit Gurke, Karotte & Sesam", 10, 12, 530, 34, 52, 20,
            ["fisch", "sesam", "soja"], ["pescetarian", "high_protein", "gluten_free"],
            [
                make_ing("Lachsfilet", 120, "g", "Fisch", "Lidl"),
                make_ing("Naturreis", 60, "g", "Trockensortiment", "Lidl"),
                make_ing("Gurke", 80, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Karotten", 60, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Sojasoße", 15, "ml", "Gewürze & Basics", "Lidl"),
                make_ing("Sesam", 5, "g", "Nüsse & Kerne", "Lidl"),
            ],
            ["Reis kochen.", "Lachs sanft in der Pfanne 5 Minuten auf der Hautseite garen.", "Reis in Schale füllen, mit geriebenen Karotten, Gurkenscheiben und Lachs anrichten, mit Sojasoße beträufeln."],
            ["Gemüse hobeln, Lachs vorbereiten."],
            ["Lachs saftig braten."],
            ["Farbenfroh und reich an Omega-3-Fettsäuren."],
            ["Bowl-Trend", "Omega-3", "Glutenfrei"], "salmon"
        ),
        (
            "Kichererbsen-Curry-Wrap mit Minz-Joghurt", 8, 8, 460, 18, 56, 17,
            ["gluten", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Vollkorn-Wraps", 1, "Stück", "Brot & Backwaren", "Aldi Nord"),
                make_ing("Kichererbsen Dose", 120, "g", "Konserven", "Aldi Nord"),
                make_ing("Naturjoghurt", 80, "g", "Kühlregal", "Aldi Nord"),
                make_ing("Babyspinat", 40, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Currypulver", 3, "g", "Gewürze & Basics", "Vorratskammer"),
                make_ing("Olivenöl", 5, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Kichererbsen in Öl mit Currypulver 4 Minuten anbraten.", "Joghurt mit Salz und getrockneter Minze verrühren.", "Wrap mit Joghurt bestreichen, mit Spinat und Curry-Kichererbsen füllen."],
            ["Kichererbsen abspülen."],
            ["In der Pfanne rösten bis sie duften."],
            ["Köstlicher indischer Street-Food Charakter to-go."],
            ["Orientalisch", "Vegetarisch", "Schnell"], "wrap"
        ),
        (
            "Kartoffel-Lauch-Eintopf mit Petersilie", 10, 18, 410, 12, 64, 12,
            [], ["vegan", "vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Kartoffeln", 250, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Lauch", 100, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Karotten", 80, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Petersilie frisch", 15, "g", "Kräuter", "Aldi Süd"),
                make_ing("Rapsöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Lauch in Ringe, Kartoffeln und Karotten in Würfel schneiden.", "In Rapsöl andünsten, mit 350ml Gemüsebrühe aufgießen.", "15 Minuten köcheln, ein Viertel zerdrücken für Bindung, mit Petersilie bestreuen."],
            ["Gemüse waschen und zerkleinern."],
            ["Eintopf garen und sämig abschmecken."],
            ["Wärmt von innen und tut der ganzen Familie gut."],
            ["Klassiker", "Wärmend", "Günstig"], "soup"
        ),
        (
            "Tofu-Gemüse-Wok mit Naturreis", 10, 15, 490, 24, 60, 17,
            ["soja", "sesam"], ["vegan", "vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Naturtofu", 140, "g", "Kühlregal", "Rewe"),
                make_ing("Naturreis", 60, "g", "Trockensortiment", "Rewe"),
                make_ing("Brokkoli", 100, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Paprika rot", 80, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Sojasoße", 15, "ml", "Gewürze & Basics", "Rewe"),
                make_ing("Sesam", 5, "g", "Nüsse & Kerne", "Rewe"),
            ],
            ["Reis kochen.", "Tofu trocken tupfen, würfeln und kross braten.", "Brokkoli und Paprika zugeben, mit Sojasoße ablöschen und über dem Reis servieren."],
            ["Tofu auspressen und würfeln."],
            ["Heiß im Wok durchschwenken."],
            ["Knackiges Gemüse und proteinreicher Tofu."],
            ["Asiatisch", "Pflanzenpower", "Vegan"], "veggie"
        ),
        (
            "Linsen-Dal mit Babyspinat & Vollkornbrot", 8, 15, 480, 24, 66, 12,
            ["gluten"], ["vegan", "vegetarian", "pescetarian"],
            [
                make_ing("Rote Linsen", 70, "g", "Trockensortiment", "Kaufland"),
                make_ing("Babyspinat", 80, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Dosentomaten", 150, "g", "Konserven", "Kaufland"),
                make_ing("Vollkornbrot", 60, "g", "Brot & Backwaren", "Kaufland"),
                make_ing("Currypulver", 3, "g", "Gewürze & Basics", "Vorratskammer"),
                make_ing("Ingwer", 5, "g", "Obst & Gemüse", "Kaufland"),
            ],
            ["Linsen mit Tomaten, geriebenem Ingwer, Curry und 200ml Wasser 12 Min köcheln.", "Spinat unterrühren, bis er zusammenfällt.", "Mit Vollkornbrot zum Dippen servieren."],
            ["Ingwer reiben, Spinat waschen."],
            ["Dal kochen und cremig rühren."],
            ["Eines der beliebtesten ayurvedischen Wohlfühlgerichte."],
            ["Ayurveda", "Linsen", "Vegan"], "curry"
        ),
        (
            "Salat mit gebratenen Puten-Medaillons & Sonnenblumenkernen", 8, 8, 440, 38, 14, 25,
            [], ["high_protein", "gluten_free", "low_carb"],
            [
                make_ing("Putenbrustfilet", 150, "g", "Fleisch", "Edeka"),
                make_ing("Gurke", 80, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Kirschtomaten", 80, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Sonnenblumenkerne", 20, "g", "Nüsse & Kerne", "Edeka"),
                make_ing("Rapsöl", 10, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Essig Balsamico", 10, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Putenmedaillons in etwas Öl von beiden Seiten je 3 Min braten, würzen.", "Salat mit Gurke und Tomaten anrichten.", "Warme Pute und Sonnenblumenkerne daraufgeben."],
            ["Fleisch parieren und würzen."],
            ["Braten, Dressing mischen."],
            ["Sehr leicht und trotzdem mega eiweißreich."],
            ["Low-Carb", "Geflügel", "Frisch"], "salad"
        ),
        (
            "Bunter Couscous-Salat mit Feta & getrockneten Kräutern", 8, 5, 450, 18, 58, 16,
            ["gluten", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Couscous", 60, "g", "Trockensortiment", "Netto"),
                make_ing("Feta", 60, "g", "Kühlregal", "Netto"),
                make_ing("Paprika bunt", 80, "g", "Obst & Gemüse", "Netto"),
                make_ing("Gurke", 60, "g", "Obst & Gemüse", "Netto"),
                make_ing("Olivenöl", 10, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Oregano getrocknet", 2, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Couscous quellen lassen.", "Gemüse fein würfeln, Feta zerbröseln.", "Mit Olivenöl, Oregano, Salz und Pfeffer vermischen."],
            ["Gemüse fein würfeln."],
            ["Zutaten locker unterheben."],
            ["Super schnell vorbereitet und schmeckt der ganzen Familie."],
            ["Sommer", "Schnell", "Vegetarisch"], "salad"
        ),
        (
            "Thunfisch-Wrap mit frischem Spinat & Ei", 6, 8, 480, 42, 38, 18,
            ["gluten", "fisch", "eier"], ["pescetarian", "high_protein"],
            [
                make_ing("Vollkorn-Wraps", 1, "Stück", "Brot & Backwaren", "NP"),
                make_ing("Thunfisch Dose", 100, "g", "Konserven", "NP"),
                make_ing("Eier Bio", 1, "Stück", "Kühlregal", "NP"),
                make_ing("Babyspinat", 30, "g", "Obst & Gemüse", "NP"),
                make_ing("Frischkäse", 30, "g", "Kühlregal", "NP"),
            ],
            ["Ei kochen und in Scheiben schneiden.", "Wrap mit Frischkäse bestreichen.", "Mit abgetropftem Thunfisch, Spinat und Ei belegen, stramm aufrollen."],
            ["Ei kochen (7 Min), Thunfisch abtropfen lassen."],
            ["Wrap belegen und rollen."],
            ["Kompakter Eiweißsnack mit 42g Protein."],
            ["Power-Wrap", "High-Protein", "To-Go"], "wrap"
        ),
        (
            "Mediterraner Kichererbsen-Salat mit Petersilie & Zitrone", 8, 0, 420, 16, 52, 16,
            [], ["vegan", "vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Kichererbsen Dose", 160, "g", "Konserven", "Lidl"),
                make_ing("Kirschtomaten", 100, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Gurke", 80, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Petersilie frisch", 20, "g", "Kräuter", "Lidl"),
                make_ing("Olivenöl", 10, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Zitrone", 15, "g", "Obst & Gemüse", "Lidl"),
            ],
            ["Kichererbsen abspülen.", "Tomaten und Gurken würfeln, Petersilie grob schneiden.", "Mit Zitronensaft, Olivenöl, Meersalz und Pfeffer kräftig anmachen."],
            ["Kichererbsen abtropfen lassen."],
            ["Alles in einer Salatschüssel vermengen."],
            ["Hält problemlos 3 Tage knackig frisch."],
            ["Meal-Prep", "Vegan", "Mediterran"], "salad"
        ),
    ]

    for idx, (title, prep, cook, cal, p, c, f, alg, diets, ings, instrs, p_steps, c_steps, l_tips, tags, img) in enumerate(lu_data, 1):
        recipes.append(create_recipe(
            f"uni-lu-{idx}", title, "lunch_lunchbox", prep, cook, "Einfach", True,
            cal, p, c, f, alg, diets, ings, instrs, p_steps, c_steps, l_tips, tags, img
        ))

    # =========================================================================
    # 35 ABENDESSEN-REZEPTE (WARM, FAMILIE, TELLERTRICK)
    # =========================================================================
    di_data = [
        (
            "Norwegisches Lachsfilet auf buntem Ofengemüse & Süßkartoffeln", 12, 22, 580, 38, 48, 24,
            ["fisch"], ["pescetarian", "gluten_free", "high_protein"],
            [
                make_ing("Lachsfilet", 160, "g", "Fisch", "Netto"),
                make_ing("Süßkartoffeln", 180, "g", "Obst & Gemüse", "Netto"),
                make_ing("Zucchini", 100, "g", "Obst & Gemüse", "Netto"),
                make_ing("Paprika rot", 80, "g", "Obst & Gemüse", "Netto"),
                make_ing("Olivenöl", 12, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Salz", 1, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Süßkartoffel, Zucchini und Paprika in Stücke schneiden, mit Olivenöl und Meersalz auf ein Backblech geben.", "Bei 200°C 15 Min vorbacken.", "Lachsfilet darauflegen und weitere 8-10 Min garen, bis der Lachs saftig ist."],
            ["Ofen auf 200°C Ober-/Unterhitze vorheizen.", "Gemüse waschen und in mundgerechte Würfel schneiden.", "Lachsfilet trocken tupfen."],
            ["Gemüse mit Olivenöl auf dem Blech verteilen und 15 Minuten backen.", "Lachsfilet auf das Gemüsebett setzen und 8 Minuten zu Ende garen."],
            ["Tellertrick beachten: Halber Teller Gemüse, Viertel Süßkartoffeln, Viertel Lachs."],
            ["Tellertrick", "Familie", "Omega-3"], "salmon"
        ),
        (
            "Bio-Hähnchenbrust mit gedämpftem Brokkoli & Vollkornreis", 10, 18, 540, 44, 58, 12,
            [], ["high_protein", "gluten_free"],
            [
                make_ing("Hähnchenbrust", 170, "g", "Fleisch", "NP"),
                make_ing("Brokkoli", 180, "g", "Obst & Gemüse", "NP"),
                make_ing("Naturreis", 70, "g", "Trockensortiment", "NP"),
                make_ing("Rapsöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Paprikapulver", 2, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Naturreis nach Anleitung kochen.", "Brokkoli in Röschen teilen und 6-7 Minuten bissfest dämpfen.", "Hähnchenbrust mit Paprikapulver würzen und in Rapsöl von beiden Seiten je 6 Min braten."],
            ["Hähnchen trocken tupfen und würzen.", "Brokkoli zerkleinern."],
            ["Reis kochen, Brokkoli dämpfen, Fleisch braten."],
            ["Der absolute Goldstandard für gesunde Familien-Ernährung."],
            ["Goldstandard", "Sportler", "Tellertrick"], "chicken"
        ),
        (
            "Cremiges Rote-Linsen-Curry mit Babyspinat & Tomaten", 10, 18, 510, 24, 66, 15,
            [], ["vegan", "vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Rote Linsen", 80, "g", "Trockensortiment", "Lidl"),
                make_ing("Dosentomaten", 200, "g", "Konserven", "Lidl"),
                make_ing("Kokosmilch", 80, "ml", "Konserven", "Lidl"),
                make_ing("Babyspinat", 80, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Zwiebeln", 40, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Currypulver", 4, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Zwiebel würfeln und anschwitzen, Currypulver kurz mitrösten.", "Linsen, stückige Tomaten und 150ml Wasser zugeben, 12 Min köcheln.", "Kokosmilch und Spinat einrühren, mit Salz und Pfeffer abschmecken."],
            ["Zwiebel fein schneiden, Spinat waschen."],
            ["Alles im Schmortopf sanft einköcheln."],
            ["Schmeckt der ganzen Familie und wärmt wunderbar von innen."],
            ["Curry", "One-Pot", "Vegan"], "curry"
        ),
        (
            "Bunte Gemüse-Frittata aus dem Ofen mit Kräuterquark", 10, 20, 480, 32, 18, 30,
            ["eier", "laktose"], ["vegetarian", "pescetarian", "low_carb", "high_protein"],
            [
                make_ing("Eier Bio", 3, "Stück", "Kühlregal", "Aldi Nord"),
                make_ing("Magerquark", 120, "g", "Kühlregal", "Aldi Nord"),
                make_ing("Zucchini", 100, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Paprika rot", 80, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Feta", 40, "g", "Kühlregal", "Aldi Nord"),
                make_ing("Petersilie frisch", 10, "g", "Kräuter", "Aldi Nord"),
            ],
            ["Gemüse würfeln und kurz anbraten.", "Eier mit Salz, Pfeffer und Petersilie verquirlen, über das Gemüse gießen.", "Feta darüberkrümeln und bei 180°C 18 Min im Ofen stocken lassen. Mit Quark servieren."],
            ["Ofen auf 180°C vorheizen, Gemüse würfeln."],
            ["In ofenfester Pfanne oder Auflaufform backen."],
            ["Hervorragend auch für Reste aus der Gemüseschublade!"],
            ["Resteverwertung", "Low-Carb", "Ofengericht"], "eggs"
        ),
        (
            "Gebackene Süßkartoffel mit Hüttenkäse & Avocado-Tatar", 8, 25, 520, 26, 68, 16,
            ["laktose"], ["vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Süßkartoffeln", 250, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Körniger Frischkäse", 180, "g", "Kühlregal", "Aldi Süd"),
                make_ing("Avocado", 60, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Kirschtomaten", 60, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Schnittlauch", 10, "g", "Kräuter", "Aldi Süd"),
            ],
            ["Süßkartoffel mehrfach mit der Gabel einstechen und bei 200°C ca. 25-30 Min backen.", "Avocado und Tomaten fein würfeln, mit Limette und Schnittlauch vermengen.", "Heiße Knolle aufschneiden, mit Hüttenkäse und Avocado-Tatar füllen."],
            ["Süßkartoffel gründlich waschen."],
            ["Im Ofen weichbacken, Füllung anrühren."],
            ["Ein echtes Seelenessen, gesund und ohne viel Aufwasch."],
            ["Ofen-Liebling", "Vegetarisch", "Glutenfrei"], "sweetpotato"
        ),
        (
            "Zartes Kabeljaufilet mit Zitronenkruste & Petersilienkartoffeln", 10, 18, 490, 36, 52, 14,
            ["fisch"], ["pescetarian", "gluten_free", "high_protein"],
            [
                make_ing("Kabeljaufilet", 170, "g", "Fisch", "Rewe"),
                make_ing("Kartoffeln", 220, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Brokkoli", 140, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Zitrone", 20, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Petersilie frisch", 15, "g", "Kräuter", "Rewe"),
                make_ing("Butter", 8, "g", "Kühlregal", "Rewe"),
            ],
            ["Kartoffeln schälen und in Salzwasser 18 Min garen.", "Kabeljau mit Zitronensaft beträufeln, salzen und in etwas Butter sanft braten (3-4 Min je Seite).", "Brokkoli dämpfen, Kartoffeln in gehackter Petersilie schwenken."],
            ["Kartoffeln schälen und vierteln, Brokkoli teilen."],
            ["Fisch bei kleiner bis mittlerer Hitze glasig braten."],
            ["Feiner, magerer Edelfisch mit hohem Jodgehalt."],
            ["Klassisch", "Jodreich", "Tellertrick"], "fish"
        ),
        (
            "Mageres Rinderhack-Chili mit Kidneybohnen & Naturreis", 10, 20, 560, 42, 62, 16,
            [], ["high_protein", "gluten_free"],
            [
                make_ing("Rinderhack", 140, "g", "Fleisch", "Kaufland"),
                make_ing("Naturreis", 60, "g", "Trockensortiment", "Kaufland"),
                make_ing("Kidneybohnen Dose", 100, "g", "Konserven", "Kaufland"),
                make_ing("Dosentomaten", 200, "g", "Konserven", "Kaufland"),
                make_ing("Paprika bunt", 80, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Paprikapulver", 3, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Reis aufsetzen.", "Hackfleisch scharf anbraten, Paprika zugeben.", "Dosentomaten und Bohnen einrühren, 15 Min köcheln lassen und kräftig mit Kreuzkümmel und Chili würzen."],
            ["Paprika würfeln, Dosen öffnen."],
            ["Hackfleisch braten, Sauce einkochen."],
            ["Der Klassiker für hungrige Familienmitglieder."],
            ["Chili", "Kraftvoll", "One-Pot"], "veggie"
        ),
        (
            "Puten-Medaillons in Champignon-Kräutersoße mit Vollkorn-Penne", 10, 15, 530, 44, 58, 14,
            ["gluten", "laktose"], ["high_protein"],
            [
                make_ing("Putenbrustfilet", 160, "g", "Fleisch", "Edeka"),
                make_ing("Vollkornnudeln", 70, "g", "Trockensortiment", "Edeka"),
                make_ing("Champignons", 120, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Sahne", 40, "ml", "Kühlregal", "Edeka"),
                make_ing("Petersilie frisch", 10, "g", "Kräuter", "Edeka"),
                make_ing("Rapsöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Penne bissfest kochen.", "Putenmedaillons in Rapsöl je 3 Min braten, herausnehmen.", "Champignons anbraten, mit etwas Nudelwasser und Sahne ablöschen, Fleisch zurückgeben und Petersilie unterrühren."],
            ["Pilze blättrig schneiden, Fleisch teilen."],
            ["Sauce einkochen und abschmecken."],
            ["Rahmgeschnetzeltes ohne schwere Kalorienbombe."],
            ["Klassiker", "Geflügel", "Cremig"], "pasta"
        ),
        (
            "Forellenfilet mit Petersilienkartoffeln & Gurkensalat", 10, 15, 480, 36, 46, 16,
            ["fisch", "laktose"], ["pescetarian", "gluten_free"],
            [
                make_ing("Forellenfilet", 160, "g", "Fisch", "Netto"),
                make_ing("Kartoffeln", 200, "g", "Obst & Gemüse", "Netto"),
                make_ing("Gurke", 120, "g", "Obst & Gemüse", "Netto"),
                make_ing("Butter", 8, "g", "Kühlregal", "Netto"),
                make_ing("Petersilie frisch", 10, "g", "Kräuter", "Netto"),
                make_ing("Essig Balsamico", 10, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Kartoffeln kochen und in Petersilienbutter schwenken.", "Gurke hobeln und als frischen Salat mit Essig und Öl anmachen.", "Forellenfilet auf der Hautseite 4 Min kross braten, wenden und kurz ziehen lassen."],
            ["Kartoffeln vorbereiten, Gurke hobeln."],
            ["Fisch schonend auf der Haut braten."],
            ["Regionaler Süßwasserfisch aus heimischer Zucht."],
            ["Regional", "Heimisch", "Tradition"], "fish"
        ),
        (
            "Vollkorn-Spaghetti Bolognese mit Möhren & magerem Rinderhack", 10, 20, 560, 38, 68, 14,
            ["gluten"], ["high_protein"],
            [
                make_ing("Spaghetti", 75, "g", "Trockensortiment", "NP"),
                make_ing("Rinderhack", 120, "g", "Fleisch", "NP"),
                make_ing("Dosentomaten", 200, "g", "Konserven", "NP"),
                make_ing("Karotten", 80, "g", "Obst & Gemüse", "NP"),
                make_ing("Zwiebeln", 40, "g", "Obst & Gemüse", "NP"),
                make_ing("Oregano getrocknet", 2, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Karotten und Zwiebeln sehr fein raspeln.", "Hack anbraten, Gemüse zugeben, Tomaten einrühren und 15 Min köcheln lassen.", "Spaghetti al dente kochen und mit der Bolognese vermischen."],
            ["Karotten reiben (Kinder bemerken das Gemüse in der Sauce kaum!)."],
            ["Sauce langsam köcheln lassen für vollen Geschmack."],
            ["Der unbestrittene Nummer-1 Favorit aller Kinder!"],
            ["Kinderliebling", "Familienklassiker", "Pasta"], "pasta"
        ),
        (
            "Bunte Gemüse-Reispfanne mit Bio-Tofu & Erdnusssoße", 10, 15, 520, 24, 64, 18,
            ["soja", "nuesse"], ["vegan", "vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Naturreis", 60, "g", "Trockensortiment", "Lidl"),
                make_ing("Naturtofu", 130, "g", "Kühlregal", "Lidl"),
                make_ing("Brokkoli", 100, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Karotten", 60, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Erdnussmus", 20, "g", "Nüsse & Kerne", "Lidl"),
                make_ing("Sojasoße", 15, "ml", "Gewürze & Basics", "Lidl"),
            ],
            ["Reis kochen.", "Tofu würfeln und kross braten. Brokkoli und Karotten zugeben.", "Erdnussmus mit etwas warmem Wasser und Sojasoße zur Sauce verrühren und untermischen."],
            ["Tofu schneiden, Sauce anrühren."],
            ["Im Wok heiß anbraten und glasieren."],
            ["Pflanzlich, cremig-nussig und extrem lecker."],
            ["Erdnuss-Liebe", "Vegan", "Wok"], "veggie"
        ),
        (
            "Hähnchenbrust im Ofen mit mediterranem Zucchini-Paprika-Gemüse", 10, 20, 510, 42, 28, 22,
            [], ["high_protein", "gluten_free", "low_carb"],
            [
                make_ing("Hähnchenbrust", 170, "g", "Fleisch", "Aldi Nord"),
                make_ing("Zucchini", 120, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Paprika bunt", 100, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Kirschtomaten", 80, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Olivenöl", 12, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Oregano getrocknet", 2, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Gemüse grob würfeln, mit Olivenöl und Oregano vermengen und aufs Blech geben.", "Hähnchenbrust salzen, pfeffern und auf das Gemüse legen.", "Bei 190°C ca. 20 Minuten im Ofen saftig backen."],
            ["Ofen vorheizen, Gemüse schneiden."],
            ["Alles aufs Blech – der Ofen macht die ganze Arbeit!"],
            ["Kaum Spülarbeit nach dem Essen."],
            ["Blechgericht", "Low-Carb", "Familie"], "chicken"
        ),
        (
            "Rumpsteak vom Weiderind mit grünem Spargel & Rosmarinkartoffeln", 10, 20, 580, 42, 44, 24,
            [], ["high_protein", "gluten_free"],
            [
                make_ing("Rindersteak", 160, "g", "Fleisch", "Aldi Süd"),
                make_ing("Kartoffeln", 180, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Grüner Spargel", 120, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Olivenöl", 10, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Butter", 8, "g", "Kühlregal", "Aldi Süd"),
            ],
            ["Kartoffeln vierteln, mit Öl und Rosmarin bei 200°C 20 Min backen.", "Holzige Enden vom Spargel abbrechen, in Butter 6 Min braten.", "Steak in heißer Pfanne je Seite 2,5 Min medium braten und kurz ruhen lassen."],
            ["Kartoffeln in den Ofen schieben, Fleisch 20 Min vorab aus dem Kühlschrank nehmen."],
            ["Steak scharf anbraten, in Alufolie 3 Min ruhen lassen."],
            ["Das Sonntags-Festmahl für Feinschmecker."],
            ["Festessen", "Rindfleisch", "Feinschmecker"], "steak"
        ),
        (
            "Ofen-Lachs mit Honig-Senf-Glasur & Brokkoli", 8, 15, 540, 38, 32, 26,
            ["fisch"], ["pescetarian", "gluten_free", "high_protein"],
            [
                make_ing("Lachsfilet", 160, "g", "Fisch", "Rewe"),
                make_ing("Brokkoli", 180, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Kartoffeln", 150, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Honig", 10, "g", "Gewürze & Basics", "Rewe"),
                make_ing("Senf", 10, "ml", "Gewürze & Basics", "Rewe"),
            ],
            ["Kartoffeln kochen.", "Honig und Senf verrühren, Lachs damit bestreichen.", "Lachs und Brokkoli bei 180°C 15 Min im Ofen backen."],
            ["Glasur anrühren."],
            ["Lachs und Gemüse schonend garen."],
            ["Fruchtig-würzige Kruste, die auch Kindern Fisch schmackhaft macht."],
            ["Kinderfreundlich", "Omega-3", "Ofen"], "salmon"
        ),
        (
            "Kichererbsen-Spinat-Eintopf mit Feta & Vollkornbrot", 8, 15, 490, 22, 54, 19,
            ["gluten", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Kichererbsen Dose", 160, "g", "Konserven", "Kaufland"),
                make_ing("Babyspinat", 100, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Dosentomaten", 200, "g", "Konserven", "Kaufland"),
                make_ing("Feta", 50, "g", "Kühlregal", "Kaufland"),
                make_ing("Vollkornbrot", 60, "g", "Brot & Backwaren", "Kaufland"),
                make_ing("Olivenöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Tomaten im Topf erhitzen, Kichererbsen und Gewürze einrühren, 10 Min köcheln.", "Spinat zugeben bis er zusammenfällt.", "In tiefe Teller schöpfen, Feta darüberbröckeln und mit Brot servieren."],
            ["Dosen öffnen, Spinat waschen."],
            ["Eintopf sämig einkochen."],
            ["Herzhaft vegetarisch und in 15 Minuten auf dem Tisch."],
            ["Schnellküche", "Vegetarisch", "Tellertrick"], "curry"
        ),
        (
            "Puten-Wok mit buntem Paprikagemüse & Naturreis", 10, 15, 520, 42, 60, 12,
            ["soja"], ["high_protein", "gluten_free"],
            [
                make_ing("Putenbrustfilet", 170, "g", "Fleisch", "Edeka"),
                make_ing("Naturreis", 65, "g", "Trockensortiment", "Edeka"),
                make_ing("Paprika bunt", 100, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Zuckerschoten", 60, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Sojasoße", 15, "ml", "Gewürze & Basics", "Edeka"),
                make_ing("Rapsöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Reis kochen.", "Putenstreifen scharf im Wok anbraten, herausnehmen.", "Gemüse 4 Min knackig braten, Fleisch zurückgeben und mit Sojasoße und Ingwer abschmecken."],
            ["Fleisch und Gemüse schneiden."],
            ["Kurz und knackig im heißen Wok braten."],
            ["Erfüllt die Tellertrick-Vorgabe perfekt: Viel buntes Gemüse, mageres Protein."],
            ["Knackig", "Wok", "Tellertrick"], "chicken"
        ),
        (
            "Vollkorn-Penne All'Arrabbiata mit Mozzarella & frischem Basilikum", 8, 12, 510, 24, 68, 15,
            ["gluten", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Penne", 80, "g", "Trockensortiment", "Netto"),
                make_ing("Dosentomaten", 200, "g", "Konserven", "Netto"),
                make_ing("Mozzarella", 80, "g", "Kühlregal", "Netto"),
                make_ing("Knoblauch", 5, "g", "Obst & Gemüse", "Netto"),
                make_ing("Basilikum frisch", 10, "g", "Kräuter", "Netto"),
                make_ing("Olivenöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Penne al dente kochen.", "Knoblauch in Olivenöl dünsten, Tomaten zugeben, 10 Min einkochen.", "Nudeln mit Sauce mischen, Mozzarella-Würfel und Basilikum unterheben bis der Käse leicht schmilzt."],
            ["Knoblauch hacken, Mozzarella würfeln."],
            ["Nudeln mit heißer Sauce und Käse vermengen."],
            ["Cremig schmelzender Mozzarella in fruchtiger Tomatensauce."],
            ["Italienisch", "Familie", "Vegetarisch"], "pasta"
        ),
        (
            "Ratatouille aus dem Bräter mit gegrilltem Hähnchenfilet", 12, 20, 490, 42, 26, 22,
            [], ["high_protein", "gluten_free", "low_carb"],
            [
                make_ing("Hähnchenbrust", 170, "g", "Fleisch", "NP"),
                make_ing("Zucchini", 100, "g", "Obst & Gemüse", "NP"),
                make_ing("Aubergine", 80, "g", "Obst & Gemüse", "NP"),
                make_ing("Paprika rot", 80, "g", "Obst & Gemüse", "NP"),
                make_ing("Dosentomaten", 150, "g", "Konserven", "NP"),
                make_ing("Olivenöl", 10, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Gemüse würfeln, in Olivenöl anbraten, stückige Tomaten zugeben und 15 Min schmoren.", "Hähnchenfilet in der Grillpfanne beidseitig je 5 Min braten.", "Auf dem aromatischen Ratatouille servieren."],
            ["Gemüse in gleichmäßige Stücke schneiden."],
            ["Ratatouille sanft einkochen, Hähnchen saftig grillen."],
            ["Sommerliches französisches Aroma."],
            ["Klassiker", "Low-Carb", "Gemüsereich"], "chicken"
        ),
        (
            "Zucchini-Schiffchen gefüllt mit Rinderhack & Gouda überbacken", 10, 20, 520, 38, 14, 34,
            ["laktose"], ["high_protein", "gluten_free", "low_carb"],
            [
                make_ing("Zucchini", 250, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Rinderhack", 130, "g", "Fleisch", "Lidl"),
                make_ing("Gouda", 40, "g", "Kühlregal", "Lidl"),
                make_ing("Tomatenmark", 20, "g", "Konserven", "Lidl"),
                make_ing("Zwiebeln", 30, "g", "Obst & Gemüse", "Lidl"),
            ],
            ["Zucchini längs halbieren und mit dem Löffel aushöhlen.", "Hack mit Zwiebel und Fruchtfleisch anbraten, Tomatenmark zugeben, würzen.", "In die Zucchini füllen, mit Gouda bestreuen und bei 190°C 20 Min backen."],
            ["Zucchini aushöhlen."],
            ["Füllung vorbereiten und im Ofen überbacken."],
            ["Schmeckt auch Kindern fantastisch und ist vollkommen Low-Carb."],
            ["Überbacken", "Low-Carb", "Kinderfavorit"], "veggie"
        ),
        (
            "Garnelen-Pfanne mit Kirschtomaten, Knoblauch & Vollkornbrot", 8, 8, 440, 32, 38, 16,
            ["krebstiere", "gluten"], ["pescetarian", "high_protein"],
            [
                make_ing("Garnelen", 150, "g", "Fisch", "Aldi Nord"),
                make_ing("Kirschtomaten", 120, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Vollkornbrot", 70, "g", "Brot & Backwaren", "Aldi Nord"),
                make_ing("Knoblauch", 6, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Petersilie frisch", 10, "g", "Kräuter", "Aldi Nord"),
                make_ing("Olivenöl", 12, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Knoblauch hacken, Tomaten halbieren.", "Garnelen in Olivenöl 3 Min scharf anbraten, Knoblauch und Tomaten zugeben, 2 Min mitschwenken.", "Mit Meersalz und Petersilie würzen, mit geröstetem Brot servieren."],
            ["Garnelen trocken tupfen, Knoblauch fein hacken."],
            ["Kurz und heiß braten, damit die Garnelen knackig bleiben."],
            ["Mediterranes Urlaubsgefühl an einem Mittwochabend."],
            ["Urlaubsfeeling", "Meeresfrüchte", "Schnell"], "fish"
        ),
        (
            "Bio-Naturtofu kross gebraten mit Brokkoli, Sesam & Naturreis", 10, 15, 510, 24, 62, 17,
            ["soja", "sesam"], ["vegan", "vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Naturtofu", 150, "g", "Kühlregal", "Aldi Süd"),
                make_ing("Brokkoli", 150, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Naturreis", 60, "g", "Trockensortiment", "Aldi Süd"),
                make_ing("Sojasoße", 15, "ml", "Gewürze & Basics", "Aldi Süd"),
                make_ing("Sesam", 10, "g", "Nüsse & Kerne", "Aldi Süd"),
                make_ing("Rapsöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Reis kochen.", "Tofu in Würfel schneiden, trocken tupfen und in heißem Öl goldbraun anbraten.", "Brokkoli dämpfen, mit Tofu, Sojasoße und Sesam vermengen und zum Reis servieren."],
            ["Tofu auspressen für maximale Krossheit."],
            ["In der Pfanne von allen Seiten bräunen."],
            ["Pflanzlicher Hochgenuss."],
            ["Vegan", "Kross", "Tellertrick"], "veggie"
        ),
        (
            "Deftiger Bauerntopf mit Kartoffeln, Rinderhack & Paprika", 10, 20, 540, 36, 54, 18,
            [], ["high_protein", "gluten_free"],
            [
                make_ing("Rinderhack", 130, "g", "Fleisch", "Rewe"),
                make_ing("Kartoffeln", 200, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Paprika bunt", 80, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Dosentomaten", 150, "g", "Konserven", "Rewe"),
                make_ing("Zwiebeln", 40, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Paprikapulver", 3, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Hack mit Zwiebeln im Topf anbraten.", "Kartoffel- und Paprikawürfel zugeben.", "Mit Tomaten und 200ml Brühe aufgießen, 15 Min köcheln bis die Kartoffeln weich sind."],
            ["Kartoffeln und Paprika in mundgerechte Stücke schneiden."],
            ["Im Schmortopf garen."],
            ["Klassische deutsche Hausmannskost in gesunder, fettarmer Variante."],
            ["Hausmannskost", "Eintopf", "Familienhit"], "soup"
        ),
        (
            "Kabeljaufilet im Gemüsebett mit Dill-Senfsoße", 10, 15, 470, 36, 44, 14,
            ["fisch", "laktose"], ["pescetarian", "gluten_free"],
            [
                make_ing("Kabeljaufilet", 170, "g", "Fisch", "Kaufland"),
                make_ing("Kartoffeln", 180, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Zucchini", 100, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Karotten", 80, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Frischkäse", 30, "g", "Kühlregal", "Kaufland"),
                make_ing("Senf", 10, "ml", "Gewürze & Basics", "Kaufland"),
            ],
            ["Kartoffeln kochen.", "Gemüsestreifen in der Pfanne andünsten, Fischfilet darauflegen.", "Mit Deckel 8 Min sanft dünsten, Fond mit Frischkäse und Senf binden."],
            ["Gemüse in feine Streifen schneiden."],
            ["Schonend im Dampf garen."],
            ["Besonders bekömmlich und magenfreundlich."],
            ["Schonkost", "Bekömmlich", "Fisch"], "fish"
        ),
        (
            "Hähnchen-Curry mit Kokosmilch, Zuckerschoten & Naturreis", 10, 18, 550, 42, 60, 15,
            [], ["high_protein", "gluten_free"],
            [
                make_ing("Hähnchenbrust", 160, "g", "Fleisch", "Edeka"),
                make_ing("Naturreis", 65, "g", "Trockensortiment", "Edeka"),
                make_ing("Zuckerschoten", 80, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Paprika rot", 80, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Kokosmilch", 80, "ml", "Konserven", "Edeka"),
                make_ing("Currypulver", 4, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Reis kochen.", "Hähnchenstreifen scharf anbraten, Currypulver kurz mitrösten.", "Gemüse und Kokosmilch zugeben, 8 Min köcheln und über dem Reis anrichten."],
            ["Fleisch und Gemüse schneiden."],
            ["Curry sämig einkochen."],
            ["Farbenfrohes Lieblingsessen der Familie."],
            ["Curry", "Geflügel", "Bunt"], "curry"
        ),
        (
            "Gebackener Feta mit Kirschtomaten & Vollkornbrot", 6, 18, 510, 22, 38, 30,
            ["gluten", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Feta", 100, "g", "Kühlregal", "Netto"),
                make_ing("Kirschtomaten", 150, "g", "Obst & Gemüse", "Netto"),
                make_ing("Paprika rot", 80, "g", "Obst & Gemüse", "Netto"),
                make_ing("Vollkornbrot", 70, "g", "Brot & Backwaren", "Netto"),
                make_ing("Olivenöl", 10, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Oregano getrocknet", 2, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Feta in eine kleine Auflaufform legen, Tomaten und Paprikastreifen drumherum verteilen.", "Mit Olivenöl und Oregano beträufeln.", "Bei 200°C 18 Min backen bis der Feta weich ist, mit knusprigem Brot dippen."],
            ["Ofen auf 200°C vorheizen."],
            ["In der Form backen."],
            ["Schmeckt wie in der griechischen Taverne am Meer."],
            ["Griechisch", "Ofen", "Vegetarisch"], "veggie"
        ),
        (
            "Rinderhackbällchen in Tomatensoße mit Vollkornnudeln", 10, 18, 560, 40, 64, 15,
            ["gluten", "eier"], ["high_protein"],
            [
                make_ing("Rinderhack", 130, "g", "Fleisch", "NP"),
                make_ing("Vollkornnudeln", 75, "g", "Trockensortiment", "NP"),
                make_ing("Dosentomaten", 200, "g", "Konserven", "NP"),
                make_ing("Eier Bio", 1, "Stück", "Kühlregal", "NP"),
                make_ing("Basilikum getrocknet", 2, "g", "Gewürze & Basics", "Vorratskammer"),
                make_ing("Zwiebeln", 30, "g", "Obst & Gemüse", "NP"),
            ],
            ["Hack mit Ei, Salz und Pfeffer verkneten, kleine Bällchen formen.", "Bällchen in der Pfanne 5 Min anbraten, Tomaten zugeben und 10 Min durchgaren.", "Mit al dente gekochten Nudeln servieren."],
            ["Hackbällchen rollen."],
            ["In fruchtiger Tomatensauce garziehen lassen."],
            ["Susi und Strolch Feeling am Familientisch."],
            ["Kinderhit", "Hackbällchen", "Pasta"], "pasta"
        ),
        (
            "Gefüllte Paprika mit Quinoa, Gemüse & Feta überbacken", 12, 25, 480, 20, 56, 18,
            ["laktose"], ["vegetarian", "pescetarian", "gluten_free"],
            [
                make_ing("Paprika rot", 150, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Quinoa", 60, "g", "Trockensortiment", "Lidl"),
                make_ing("Feta", 50, "g", "Kühlregal", "Lidl"),
                make_ing("Zucchini", 80, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Dosentomaten", 100, "g", "Konserven", "Lidl"),
            ],
            ["Quinoa kochen.", "Paprikadeckel abschneiden und entkernen.", "Quinoa mit Zucchiniwürfeln und Feta mischen, in die Paprika füllen und in Tomatensauce bei 190°C 25 Min backen."],
            ["Paprika aushöhlen, Quinoa vorkochen."],
            ["Füllen und im Ofen schmoren."],
            ["Wunderschön anzusehen und vollgepackt mit Nährstoffen."],
            ["Gefülltes Gemüse", "Bunt", "Vegetarisch"], "veggie"
        ),
        (
            "Gebratenes Kabeljaufilet mit Zucchini-Nudeln & Kirschtomaten", 10, 12, 430, 36, 18, 22,
            ["fisch"], ["pescetarian", "gluten_free", "low_carb", "high_protein"],
            [
                make_ing("Kabeljaufilet", 170, "g", "Fisch", "Aldi Nord"),
                make_ing("Zucchini", 220, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Kirschtomaten", 100, "g", "Obst & Gemüse", "Aldi Nord"),
                make_ing("Olivenöl", 12, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Knoblauch", 4, "g", "Obst & Gemüse", "Aldi Nord"),
            ],
            ["Zucchini mit dem Spiralschneider zu Zoodles verarbeiten.", "Kabeljau mit Salz und Pfeffer in Olivenöl von beiden Seiten je 3 Min braten, herausnehmen.", "Zoodles und Tomaten 2 Min in derselben Pfanne durchschwenken."],
            ["Zucchini spiralisieren."],
            ["Fisch saftig braten, Zoodles nur kurz schwenken."],
            ["Leichtes Low-Carb Abendessen für warme Abende."],
            ["Zoodles", "Low-Carb", "Fisch"], "fish"
        ),
        (
            "Putenbrust-Geschnetzeltes mit Brokkoli & Naturreis", 10, 15, 520, 44, 56, 12,
            [], ["high_protein", "gluten_free"],
            [
                make_ing("Putenbrustfilet", 170, "g", "Fleisch", "Aldi Süd"),
                make_ing("Naturreis", 65, "g", "Trockensortiment", "Aldi Süd"),
                make_ing("Brokkoli", 150, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Karotten", 60, "g", "Obst & Gemüse", "Aldi Süd"),
                make_ing("Rapsöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Reis kochen.", "Pute in Streifen schneiden und scharf anbraten.", "Brokkoli und Karottenstifte zugeben, mit 100ml Brühe ablöschen und 5 Min bissfest garen."],
            ["Fleisch und Gemüse vorbereiten."],
            ["In der Pfanne garen."],
            ["Schlicht, gesund, effektiv."],
            ["Alltagsküche", "Gesund", "Geflügel"], "chicken"
        ),
        (
            "Shakshuka aus der Pfanne mit Feta & Vollkornbrot", 8, 15, 480, 26, 42, 22,
            ["gluten", "eier", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Eier Bio", 2, "Stück", "Kühlregal", "Rewe"),
                make_ing("Dosentomaten", 200, "g", "Konserven", "Rewe"),
                make_ing("Paprika rot", 80, "g", "Obst & Gemüse", "Rewe"),
                make_ing("Feta", 50, "g", "Kühlregal", "Rewe"),
                make_ing("Vollkornbrot", 60, "g", "Brot & Backwaren", "Rewe"),
                make_ing("Olivenöl", 8, "ml", "Öle & Essig", "Vorratskammer"),
            ],
            ["Paprika in Olivenöl anschwitzen, stückige Tomaten zugeben und 8 Min einkochen.", "Mulden bilden, Eier hineinschlagen, Feta darüberbröckeln.", "Zugedeckt 5 Min stocken lassen, direkt aus der Pfanne mit Brot genießen."],
            ["Gemüse würfeln."],
            ["In der Pfanne garen bis das Eiweiß fest und das Eigelb flüssig ist."],
            ["Herrlich unkompliziert und gesellig."],
            ["Pfannengericht", "Gesellig", "Vegetarisch"], "eggs"
        ),
        (
            "Rindergulasch mager geschmort mit Karotten & Salzkartoffeln", 15, 35, 540, 42, 54, 15,
            [], ["high_protein", "gluten_free"],
            [
                make_ing("Rindersteak", 160, "g", "Fleisch", "Kaufland"),
                make_ing("Kartoffeln", 200, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Karotten", 100, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Zwiebeln", 60, "g", "Obst & Gemüse", "Kaufland"),
                make_ing("Tomatenmark", 20, "g", "Konserven", "Kaufland"),
                make_ing("Paprikapulver", 4, "g", "Gewürze & Basics", "Vorratskammer"),
            ],
            ["Rindfleisch würfeln und mit Zwiebeln scharf anbraten.", "Tomatenmark und Paprikapulver kurz rösten, mit 300ml Wasser aufgießen, Karotten zugeben und sanft 30 Min schmoren.", "Mit Salzkartoffeln servieren."],
            ["Fleisch und Zwiebeln schneiden."],
            ["Im geschlossenen Topf schmoren."],
            ["Zartes Fleisch mit kräftiger, natürlicher Soße."],
            ["Schmorgericht", "Sonntag", "Deftig"], "steak"
        ),
        (
            "Lachs-Spinat-Auflauf mit Vollkorn-Penne & Gouda", 10, 20, 560, 40, 52, 21,
            ["gluten", "fisch", "laktose"], ["pescetarian", "high_protein"],
            [
                make_ing("Lachsfilet", 140, "g", "Fisch", "Edeka"),
                make_ing("Vollkornnudeln", 65, "g", "Trockensortiment", "Edeka"),
                make_ing("Babyspinat", 100, "g", "Obst & Gemüse", "Edeka"),
                make_ing("Gouda", 40, "g", "Kühlregal", "Edeka"),
                make_ing("Milch", 60, "ml", "Kühlregal", "Edeka"),
            ],
            ["Penne 8 Min vorkochen.", "Lachs würfeln. Spinat kurz blanchieren.", "Nudeln, Spinat und Lachs in Auflaufform schichten, mit Milch und Gewürzen begießen, mit Gouda bei 190°C 18 Min überbacken."],
            ["Auflaufform fetten, Nudeln kochen."],
            ["Im Ofen überbacken bis der Käse goldbraun ist."],
            ["Ein Lieblingsgericht aller Fisch-Liebhaber."],
            ["Auflauf", "Käsekruste", "Omega-3"], "salmon"
        ),
        (
            "Bunte Gemüse-Quiche mit Dinkelvollkorn-Boden & Kräutern", 15, 25, 490, 24, 46, 22,
            ["gluten", "eier", "laktose"], ["vegetarian", "pescetarian"],
            [
                make_ing("Vollkornmehl", 50, "g", "Trockensortiment", "Netto"),
                make_ing("Eier Bio", 2, "Stück", "Kühlregal", "Netto"),
                make_ing("Magerquark", 100, "g", "Kühlregal", "Netto"),
                make_ing("Zucchini", 80, "g", "Obst & Gemüse", "Netto"),
                make_ing("Paprika bunt", 80, "g", "Obst & Gemüse", "Netto"),
                make_ing("Feta", 40, "g", "Kühlregal", "Netto"),
            ],
            ["Mehl mit Quark und etwas Wasser zum Teig kneten, in die Form drücken.", "Gemüse würfeln und auf dem Teig verteilen.", "Eier mit Salz und Kräutern verquirlen, darübergießen, Feta auflegen und bei 180°C 25 Min backen."],
            ["Mürbeteigboden vorbereiten."],
            ["Im Ofen backen bis die Eimasse gestockt ist."],
            ["Schmeckt warm und kalt einfach herrlich."],
            ["Quiche", "Vegetarisch", "Backen"], "veggie"
        ),
        (
            "Asiatische Hähnchen-Pfanne mit Edamame, Karotten & Reis", 10, 15, 540, 44, 60, 13,
            ["soja", "sesam"], ["high_protein", "gluten_free"],
            [
                make_ing("Hähnchenbrust", 170, "g", "Fleisch", "NP"),
                make_ing("Naturreis", 65, "g", "Trockensortiment", "NP"),
                make_ing("Edamame", 80, "g", "Obst & Gemüse", "NP"),
                make_ing("Karotten", 80, "g", "Obst & Gemüse", "NP"),
                make_ing("Sojasoße", 15, "ml", "Gewürze & Basics", "NP"),
                make_ing("Sesam", 5, "g", "Nüsse & Kerne", "NP"),
            ],
            ["Reis kochen.", "Hähnchenstreifen scharf anbraten.", "Karottenstifte und Edamame zugeben, mit Sojasoße und einem Löffel Wasser 4 Min bissfest garen, mit Sesam bestreuen."],
            ["Fleisch und Gemüse schneiden."],
            ["Im Wok braten."],
            ["Frisch, knackig und reich an Proteinen."],
            ["Edamame-Power", "High-Protein", "Tellertrick"], "chicken"
        ),
        (
            "Gegrillte Forelle mit Rosmarinkartoffeln & gedämpftem Brokkoli", 10, 18, 500, 36, 48, 16,
            ["fisch"], ["pescetarian", "gluten_free"],
            [
                make_ing("Forellenfilet", 160, "g", "Fisch", "Lidl"),
                make_ing("Kartoffeln", 200, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Brokkoli", 160, "g", "Obst & Gemüse", "Lidl"),
                make_ing("Olivenöl", 10, "ml", "Öle & Essig", "Vorratskammer"),
                make_ing("Zitrone", 15, "g", "Obst & Gemüse", "Lidl"),
            ],
            ["Kartoffeln würfeln und in der Pfanne oder im Ofen mit Rosmarin rösten.", "Brokkoli dämpfen.", "Forellenfilet in heißem Olivenöl 4 Min braten, mit frischem Zitronensaft beträufeln."],
            ["Kartoffeln vorbereiten, Brokkoli teilen."],
            ["Fisch saftig braten."],
            ["Leichter, feiner Fischgenuss."],
            ["Leicht", "Forelle", "Tellertrick"], "fish"
        ),
    ]

    for idx, (title, prep, cook, cal, p, c, f, alg, diets, ings, instrs, p_steps, c_steps, l_tips, tags, img) in enumerate(di_data, 1):
        recipes.append(create_recipe(
            f"uni-di-{idx}", title, "dinner_home", prep, cook, "Einfach", True,
            cal, p, c, f, alg, diets, ings, instrs, p_steps, c_steps, l_tips, tags, img
        ))

    return recipes


def build_universe():
    recipes = generate_all_recipes()
    out_path = os.path.join(os.path.dirname(__file__), "recipes_universe.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)

    print(f"✅ Generated {len(recipes)} recipes successfully:")
    print(f"   - Breakfasts: {sum(1 for r in recipes if r['meal_type'] == 'breakfast_lunchbox')}")
    print(f"   - Lunches:    {sum(1 for r in recipes if r['meal_type'] == 'lunch_lunchbox')}")
    print(f"   - Dinners:    {sum(1 for r in recipes if r['meal_type'] == 'dinner_home')}")
    print(f"   - Saved to:   {out_path}")


if __name__ == "__main__":
    build_universe()
