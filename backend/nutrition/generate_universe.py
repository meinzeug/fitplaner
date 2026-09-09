"""
Generator script to compile a rich, diverse catalog of 1,000+ authentic, nutritionally calculated recipes
covering all 11 dietary lifestyles and German supermarket staples.
"""

import json
import os
import random

RETAILERS = ["Netto", "NP", "Lidl", "Aldi Nord", "Aldi Süd", "Rewe", "Kaufland", "Edeka"]

UNSPLASH_FOOD_IMAGES = [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
    "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600",
    "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600",
    "https://images.unsplash.com/photo-1547496502-affa22d38842?w=600",
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600",
    "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=600",
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600"
]

def build_universe():
    recipes = []
    
    # -------------------------------------------------------------
    # 1. FRÜHSTÜCK (350+ REZEPTE)
    # -------------------------------------------------------------
    bf_bases = [
        ("Zarte Haferflocken", 70, "g", "Vollkorn & Hülsenfrüchte", 250, 9, 41, 5, ["gluten"]),
        ("Dinkelflocken", 70, "g", "Vollkorn & Hülsenfrüchte", 240, 9, 43, 3, ["gluten"]),
        ("Buchweizenflocken (GF)", 70, "g", "Vollkorn & Hülsenfrüchte", 240, 8, 48, 2, []),
        ("Chiasamen-Basis", 30, "g", "Gesunde Fette & Nüsse", 140, 5, 2, 9, []),
        ("Bio-Eier (2 Stück)", 110, "g", "Proteinquellen", 155, 14, 1, 11, ["eier"]),
        ("Vollkornbrot (2 Scheiben)", 90, "g", "Vollkorn & Hülsenfrüchte", 195, 7, 36, 2, ["gluten"]),
        ("Vollkorn-Knäckebrot (3 Scheiben)", 60, "g", "Vollkorn & Hülsenfrüchte", 210, 6, 40, 2, ["gluten"]),
        ("Sojajoghurt Natur", 200, "g", "Proteinquellen", 100, 9, 4, 5, ["soja"]),
        ("Magerquark", 200, "g", "Proteinquellen", 136, 24, 8, 1, ["laktose"]),
        ("Skyr Natur", 200, "g", "Proteinquellen", 130, 22, 8, 0, ["laktose"]),
        ("Körniger Frischkäse", 200, "g", "Proteinquellen", 160, 26, 4, 5, ["laktose"])
    ]

    bf_partners = [
        ("frische Heidelbeeren", 80, "g", "Obst & Gemüse", 45, 1, 10, 0, []),
        ("Himbeeren", 80, "g", "Obst & Gemüse", 35, 1, 7, 0, []),
        ("Erdbeeren", 100, "g", "Obst & Gemüse", 32, 1, 6, 0, []),
        ("Apfelstücke & Zimt", 100, "g", "Obst & Gemüse", 52, 0, 12, 0, []),
        ("Banane", 90, "g", "Obst & Gemüse", 80, 1, 18, 0, []),
        ("frischer Babyspinat", 60, "g", "Obst & Gemüse", 14, 2, 1, 0, []),
        ("Avocado", 60, "g", "Gesunde Fette & Nüsse", 96, 1, 1, 9, []),
        ("Kirschtomaten", 80, "g", "Obst & Gemüse", 15, 1, 3, 0, []),
        ("Gurkenscheiben & Kresse", 80, "g", "Obst & Gemüse", 12, 1, 2, 0, []),
        ("gedünstete Champignons", 70, "g", "Obst & Gemüse", 16, 2, 1, 0, []),
        ("Paprikastreifen", 70, "g", "Obst & Gemüse", 18, 1, 4, 0, [])
    ]

    bf_boosts = [
        ("Walnüsse", 20, "g", "Gesunde Fette & Nüsse", 130, 3, 2, 13, ["nuesse"]),
        ("Mandeln", 20, "g", "Gesunde Fette & Nüsse", 115, 4, 2, 10, ["nuesse"]),
        ("Kürbiskerne", 20, "g", "Gesunde Fette & Nüsse", 110, 6, 3, 9, []),
        ("Leinsamen geschrotet", 15, "g", "Gesunde Fette & Nüsse", 75, 3, 1, 6, []),
        ("Erdnussmus natur", 20, "g", "Gesunde Fette & Nüsse", 120, 5, 3, 10, ["nuesse"]),
        ("Tahini (Sesammus)", 15, "g", "Gesunde Fette & Nüsse", 90, 3, 2, 8, ["sesam"]),
        ("Räucherlachs", 50, "g", "Proteinquellen", 85, 10, 0, 5, ["fisch"]),
        ("Putenbrustaufschnitt", 50, "g", "Proteinquellen", 55, 11, 1, 1, []),
        ("Feta Bio", 40, "g", "Proteinquellen", 105, 6, 1, 9, ["laktose"]),
        ("Gartenkresse & Schnittlauch", 10, "g", "Basics", 5, 0, 1, 0, [])
    ]

    count = 1
    for b_name, b_amt, b_unit, b_cat, b_cal, b_p, b_c, b_f, b_alg in bf_bases:
        for p_name, p_amt, p_unit, p_cat, p_cal, p_p, p_c, p_f, p_alg in bf_partners:
            for bo_name, bo_amt, bo_unit, bo_cat, bo_cal, bo_p, bo_c, bo_f, bo_alg in bf_boosts:
                if count > 360:
                    break
                
                # Check culinary compatibility
                is_sweet_base = any(k in b_name.lower() for k in ["flocken", "chia", "quark", "skyr", "sojajoghurt"])
                is_sweet_fruit = any(k in p_name.lower() for k in ["beeren", "erdbeeren", "apfel", "banane"])
                is_savory_booster = any(k in bo_name.lower() for k in ["lachs", "putenbrust", "feta"])
                
                if is_sweet_base and is_sweet_fruit and is_savory_booster:
                    continue # Don't mix oats + berries + salmon
                if not is_sweet_base and is_sweet_fruit:
                    continue # Don't mix eggs + berries

                total_cals = b_cal + p_cal + bo_cal
                total_p = b_p + p_p + bo_p
                total_c = b_c + p_c + bo_c
                total_f = b_f + p_f + bo_f
                
                allergens = list(set(b_alg + p_alg + bo_alg))
                
                # Diet types
                diets = ["omnivore"]
                if not any(k in (b_name + bo_name).lower() for k in ["lachs", "putenbrust", "eier"]):
                    diets.append("vegetarian")
                if "vegetarian" in diets and not any(k in (b_name + bo_name).lower() for k in ["quark", "skyr", "frischkäse", "feta"]):
                    diets.append("vegan")
                if "fisch" in allergens or not any(k in (b_name + bo_name).lower() for k in ["putenbrust"]):
                    diets.append("pescetarian")
                if not any("schwein" in k.lower() for k in [b_name, bo_name]):
                    diets.append("no_pork")
                if "gluten" not in allergens:
                    diets.append("gluten_free")
                if "laktose" not in allergens:
                    diets.append("lactose_free")
                if total_p >= 25:
                    diets.append("high_protein")
                if total_c <= 25:
                    diets.append("low_carb")
                diets.append("clean_eating")

                retailer = RETAILERS[count % len(RETAILERS)]
                
                if "flocken" in b_name.lower() or "chia" in b_name.lower():
                    title = f"Overnight {b_name.split()[0]} mit {p_name.capitalize()} & {bo_name}"
                elif "eier" in b_name.lower():
                    title = f"Frisches Rührei mit {p_name.capitalize()} & {bo_name}"
                elif "brot" in b_name.lower() or "knäcke" in b_name.lower():
                    title = f"{b_name.split()[0]}-Stulle mit {p_name.capitalize()} & {bo_name}"
                else:
                    title = f"Frische {b_name.split()[0]}-Bowl mit {p_name.capitalize()} & {bo_name}"

                recipe_dict = {
                    "id": f"uni-bf-{count}",
                    "title": title,
                    "meal_type": "breakfast_lunchbox",
                    "prep_time_minutes": 5 if "flocken" in b_name.lower() else 8,
                    "cook_time_minutes": 5 if "eier" in b_name.lower() else 0,
                    "difficulty": "Einfach",
                    "lunchbox_ready": True,
                    "base_calories": total_cals,
                    "base_protein_g": total_p,
                    "base_carbs_g": total_c,
                    "base_fat_g": total_f,
                    "allergens": allergens,
                    "diet_types": diets,
                    "ingredients": [
                        {"name": b_name, "base_amount": b_amt, "unit": b_unit, "category": b_cat, "matched_offer_retailer": retailer},
                        {"name": p_name, "base_amount": p_amt, "unit": p_unit, "category": p_cat, "matched_offer_retailer": retailer},
                        {"name": bo_name, "base_amount": bo_amt, "unit": bo_unit, "category": bo_cat, "matched_offer_retailer": retailer},
                        {"name": "Prise Meersalz & Kräuter", "base_amount": 2, "unit": "g", "category": "Basics"}
                    ],
                    "instructions": [
                        f"{b_name} bereitstellen bzw. mit {p_name} und {bo_name} anrichten.",
                        "Für die Brotdose dicht verschließen oder direkt frisch genießen.",
                        "Über Nacht im Kühlschrank ziehen lassen oder morgens in 3 Minuten zubereiten."
                    ],
                    "detailed_instructions": {
                        "prep_steps": [f"{b_name} abmessen.", f"{p_name} waschen und portionieren.", f"{bo_name} dazugeben."],
                        "cooking_steps": ["Zutaten in Schale oder Brotdose anrichten.", "Mit Gewürzen oder Samen toppen."],
                        "lunchbox_tips": ["Auslaufsicher verschließen.", "Hält bis zur Pause absolut frisch."]
                    },
                    "tags": [retailer, "Frühstück", "Brotdose", "Schnell"],
                    "image_url": UNSPLASH_FOOD_IMAGES[count % len(UNSPLASH_FOOD_IMAGES)]
                }
                recipes.append(recipe_dict)
                count += 1

    # -------------------------------------------------------------
    # 2. MITTAGESSEN / MEALPREP TO-GO (380+ REZEPTE)
    # -------------------------------------------------------------
    lu_proteins = [
        ("Bio-Hähnchenbruststreifen", 150, "g", "Proteinquellen", 165, 34, 0, 3, []),
        ("Putenbrustfilet gegrillt", 150, "g", "Proteinquellen", 160, 35, 0, 2, []),
        ("Räucherlachs in Stücken", 120, "g", "Proteinquellen", 200, 24, 0, 12, ["fisch"]),
        ("Thunfisch im eigenen Saft", 130, "g", "Proteinquellen", 145, 33, 0, 1, ["fisch"]),
        ("Räuchertofu gewürfelt", 150, "g", "Proteinquellen", 210, 22, 2, 13, ["soja"]),
        ("Naturtofu mariniert", 150, "g", "Proteinquellen", 195, 20, 2, 12, ["soja"]),
        ("Kichererbsen Bio", 160, "g", "Vollkorn & Hülsenfrüchte", 190, 11, 28, 4, []),
        ("Rote Linsen gekocht", 150, "g", "Vollkorn & Hülsenfrüchte", 170, 13, 26, 1, []),
        ("Bio-Eier hartgekocht (2 Stück)", 110, "g", "Proteinquellen", 155, 14, 1, 11, ["eier"]),
        ("Feta Bio gewürfelt", 80, "g", "Proteinquellen", 210, 12, 1, 18, ["laktose"]),
        ("Körniger Frischkäse High Protein", 180, "g", "Proteinquellen", 145, 23, 4, 4, ["laktose"])
    ]

    lu_carbs = [
        ("Bio-Quinoa bunt", 60, "g", "Vollkorn & Hülsenfrüchte", 220, 8, 38, 4, []),
        ("Naturreis Langkorn", 60, "g", "Vollkorn & Hülsenfrüchte", 215, 5, 45, 2, []),
        ("Vollkorn-Penne", 65, "g", "Vollkorn & Hülsenfrüchte", 225, 9, 44, 2, ["gluten"]),
        ("Süßkartoffelwürfel gegart", 160, "g", "Obst & Gemüse", 140, 3, 32, 0, []),
        ("Dinkel-Couscous", 60, "g", "Vollkorn & Hülsenfrüchte", 210, 8, 42, 1, ["gluten"]),
        ("Bulgur Vollkorn", 60, "g", "Vollkorn & Hülsenfrüchte", 210, 7, 43, 1, ["gluten"]),
        ("Vollkorn-Wrap (1 Stück)", 65, "g", "Vollkorn & Hülsenfrüchte", 190, 6, 32, 4, ["gluten"]),
        ("Kartoffeln gedämpft", 180, "g", "Obst & Gemüse", 130, 4, 28, 0, [])
    ]

    lu_veggies = [
        ("Brokkoli & Zucchini", 150, "g", "Obst & Gemüse", 45, 4, 6, 1, []),
        ("Babyspinat & Cherrytomaten", 130, "g", "Obst & Gemüse", 32, 3, 5, 0, []),
        ("Bunte Paprika & Gurke", 140, "g", "Obst & Gemüse", 35, 2, 7, 0, []),
        ("Zuckerschoten & Karotten", 140, "g", "Obst & Gemüse", 48, 3, 9, 0, []),
        ("Champignons & Lauch", 130, "g", "Obst & Gemüse", 38, 4, 4, 1, []),
        ("Avocado & Rucola", 80, "g", "Obst & Gemüse", 110, 2, 2, 10, []),
        ("Edamame & Frühlingszwiebel", 80, "g", "Obst & Gemüse", 95, 9, 5, 4, ["soja"])
    ]

    count_lu = 1
    for prot_name, prot_amt, prot_unit, prot_cat, prot_cal, prot_p, prot_c, prot_f, prot_alg in lu_proteins:
        for carb_name, carb_amt, carb_unit, carb_cat, carb_cal, carb_p, carb_c, carb_f, carb_alg in lu_carbs:
            for veg_name, veg_amt, veg_unit, veg_cat, veg_cal, veg_p, veg_c, veg_f, veg_alg in lu_veggies:
                if count_lu > 400:
                    break

                total_cals = prot_cal + carb_cal + veg_cal + 50 # +50 kcal for olive oil / dressing
                total_p = prot_p + carb_p + veg_p
                total_c = prot_c + carb_c + veg_c
                total_f = prot_f + carb_f + veg_f + 5
                
                allergens = list(set(prot_alg + carb_alg + veg_alg))
                
                diets = ["omnivore"]
                if not any(k in prot_name.lower() for k in ["hähnchen", "puten", "lachs", "thunfisch"]):
                    diets.append("vegetarian")
                if "vegetarian" in diets and not any(k in prot_name.lower() for k in ["eier", "feta", "frischkäse"]):
                    diets.append("vegan")
                if "fisch" in allergens or not any(k in prot_name.lower() for k in ["hähnchen", "puten"]):
                    diets.append("pescetarian")
                diets.append("no_pork")
                if "gluten" not in allergens:
                    diets.append("gluten_free")
                if "laktose" not in allergens:
                    diets.append("lactose_free")
                if total_p >= 30:
                    diets.append("high_protein")
                if total_c <= 35:
                    diets.append("low_carb")
                diets.append("clean_eating")

                retailer = RETAILERS[(count_lu + 2) % len(RETAILERS)]
                
                if "wrap" in carb_name.lower():
                    title = f"Vollkorn-Wrap mit {prot_name.split()[0]} & {veg_name.split('&')[0].strip()}"
                else:
                    title = f"{carb_name.split()[0]}-Bowl mit {prot_name.split()[0]} & {veg_name}"

                recipe_dict = {
                    "id": f"uni-lu-{count_lu}",
                    "title": title,
                    "meal_type": "lunch_lunchbox",
                    "prep_time_minutes": 10,
                    "cook_time_minutes": 10 if "reis" in carb_name.lower() or "quinoa" in carb_name.lower() else 0,
                    "difficulty": "Einfach",
                    "lunchbox_ready": True,
                    "base_calories": total_cals,
                    "base_protein_g": total_p,
                    "base_carbs_g": total_c,
                    "base_fat_g": total_f,
                    "allergens": allergens,
                    "diet_types": diets,
                    "ingredients": [
                        {"name": prot_name, "base_amount": prot_amt, "unit": prot_unit, "category": prot_cat, "matched_offer_retailer": retailer},
                        {"name": carb_name, "base_amount": carb_amt, "unit": carb_unit, "category": carb_cat, "matched_offer_retailer": retailer},
                        {"name": veg_name, "base_amount": veg_amt, "unit": veg_unit, "category": veg_cat, "matched_offer_retailer": retailer},
                        {"name": "Natives Olivenöl extra & Kräuter", "base_amount": 10, "unit": "ml", "category": "Basics"}
                    ],
                    "instructions": [
                        f"{carb_name} und {veg_name} als Basis in die Brotdose oder Schale geben.",
                        f"{prot_name} hinzufügen und mit Olivenöl, Zitronensaft und Gewürzen verfeinern.",
                        "Kalt als frischer Lunch genießbar oder kurz im Büro erwärmen."
                    ],
                    "detailed_instructions": {
                        "prep_steps": [f"{carb_name} vorkochen oder bereitstellen.", f"{veg_name} klein schneiden."],
                        "cooking_steps": [f"{prot_name} kurz anbraten oder direkt untermischen.", "Mit Kräutern und Olivenöl abschmecken."],
                        "lunchbox_tips": ["Auslaufsichere Dichtung verwenden.", "Dressing separat oder direkt unterrühren."]
                    },
                    "tags": [retailer, "Mittagessen", "To-Go", "Meal-Prep"],
                    "image_url": UNSPLASH_FOOD_IMAGES[(count_lu + 4) % len(UNSPLASH_FOOD_IMAGES)]
                }
                recipes.append(recipe_dict)
                count_lu += 1

    # -------------------------------------------------------------
    # 3. ABENDESSEN / WARM FAMILIE (450+ REZEPTE)
    # -------------------------------------------------------------
    di_mains = [
        ("Norwegisches Lachsfilet frisch", 160, "g", "Proteinquellen", 310, 32, 0, 20, ["fisch"]),
        ("Frisches Kabeljaufilet", 170, "g", "Proteinquellen", 140, 30, 0, 1, ["fisch"]),
        ("Forellenfilet aus Aquakultur", 160, "g", "Proteinquellen", 190, 32, 0, 7, ["fisch"]),
        ("Hähnchenbrustfilet zart", 180, "g", "Proteinquellen", 200, 42, 0, 4, []),
        ("Puten-Medaillons", 180, "g", "Proteinquellen", 195, 43, 0, 3, []),
        ("Mageres Rinderhack Bio", 160, "g", "Proteinquellen", 270, 34, 0, 15, []),
        ("Rumpsteak vom Weiderind", 160, "g", "Proteinquellen", 250, 35, 0, 12, []),
        ("Räuchertofu in Würfeln", 170, "g", "Proteinquellen", 240, 25, 3, 15, ["soja"]),
        ("Bio-Naturtofu kross gebraten", 170, "g", "Proteinquellen", 220, 24, 3, 14, ["soja"]),
        ("Rote Linsen & Kichererbsen Mix", 180, "g", "Vollkorn & Hülsenfrüchte", 220, 16, 34, 2, []),
        ("Bio-Feta mit mediterranen Kräutern", 100, "g", "Proteinquellen", 260, 15, 1, 22, ["laktose"])
    ]

    di_sides = [
        ("Süßkartoffeln aus dem Ofen", 180, "g", "Obst & Gemüse", 160, 3, 36, 0, []),
        ("Naturreis Langkorn", 70, "g", "Vollkorn & Hülsenfrüchte", 250, 6, 52, 2, []),
        ("Bio-Quinoa", 70, "g", "Vollkorn & Hülsenfrüchte", 255, 10, 44, 4, []),
        ("Kartoffeln gedämpft", 200, "g", "Obst & Gemüse", 145, 4, 32, 0, []),
        ("Dinkel-Vollkorn Penne", 75, "g", "Vollkorn & Hülsenfrüchte", 260, 10, 50, 2, ["gluten"]),
        ("Blumenkohl-Reis (Low-Carb)", 200, "g", "Obst & Gemüse", 50, 4, 6, 1, []),
        ("Zucchini-Nudeln Zoodles (Keto)", 200, "g", "Obst & Gemüse", 40, 3, 5, 1, []),
        ("Couscous mit Minze", 70, "g", "Vollkorn & Hülsenfrüchte", 245, 9, 49, 1, ["gluten"])
    ]

    di_veggie_sauces = [
        ("Brokkoliröschen & Knoblauch-Olivenöl", 160, "g", "Obst & Gemüse", 65, 5, 8, 2, []),
        ("Babyspinat & Kokosmilch cremig", 140, "g", "Obst & Gemüse", 110, 3, 5, 9, []),
        ("Ratatouille-Gemüse (Zucchini, Aubergine, Paprika)", 180, "g", "Obst & Gemüse", 70, 3, 10, 2, []),
        ("Mediterrane Kirschtomaten & Basilikum", 160, "g", "Obst & Gemüse", 45, 2, 7, 1, []),
        ("Champignons in Kräuter-Leichtsoße", 150, "g", "Obst & Gemüse", 60, 5, 5, 3, []),
        ("Buntes Wokgemüse mit Ingwer & Soja", 170, "g", "Obst & Gemüse", 60, 4, 9, 1, ["soja"]),
        ("Gegrillter grüner Spargel mit Zitrone", 140, "g", "Obst & Gemüse", 40, 4, 5, 1, [])
    ]

    count_di = 1
    for m_name, m_amt, m_unit, m_cat, m_cal, m_p, m_c, m_f, m_alg in di_mains:
        for s_name, s_amt, s_unit, s_cat, s_cal, s_p, s_c, s_f, s_alg in di_sides:
            for v_name, v_amt, v_unit, v_cat, v_cal, v_p, v_c, v_f, v_alg in di_veggie_sauces:
                if count_di > 460:
                    break

                total_cals = m_cal + s_cal + v_cal + 60
                total_p = m_p + s_p + v_p
                total_c = m_c + s_c + v_c
                total_f = m_f + s_f + v_f + 6
                
                allergens = list(set(m_alg + s_alg + v_alg))
                
                diets = ["omnivore"]
                if not any(k in m_name.lower() for k in ["lachs", "kabeljau", "forelle", "hähnchen", "puten", "rinder", "rumpsteak"]):
                    diets.append("vegetarian")
                if "vegetarian" in diets and not any(k in m_name.lower() for k in ["feta", "käse"]):
                    diets.append("vegan")
                if "fisch" in allergens or not any(k in m_name.lower() for k in ["hähnchen", "puten", "rinder", "rumpsteak"]):
                    diets.append("pescetarian")
                if not any("schwein" in m_name.lower() for _ in [0]):
                    diets.append("no_pork")
                if "gluten" not in allergens:
                    diets.append("gluten_free")
                if "laktose" not in allergens:
                    diets.append("lactose_free")
                if total_p >= 35:
                    diets.append("high_protein")
                if total_c <= 25:
                    diets.append("low_carb")
                diets.append("clean_eating")

                retailer = RETAILERS[(count_di + 5) % len(RETAILERS)]
                
                if "lachs" in m_name.lower() or "forelle" in m_name.lower() or "kabeljau" in m_name.lower():
                    title = f"Gebratenes {m_name.split()[0]} auf {v_name.split('&')[0].strip()} mit {s_name.split()[0]}"
                elif "curry" in v_name.lower() or "kokos" in v_name.lower():
                    title = f"Cremiges {m_name.split()[0]}-Pfannengericht mit {v_name.split('&')[0].strip()} & {s_name.split()[0]}"
                else:
                    title = f"{m_name.split()[0]}-Pfanne mit {v_name.split('&')[0].strip()} & {s_name.split()[0]}"

                recipe_dict = {
                    "id": f"uni-di-{count_di}",
                    "title": title,
                    "meal_type": "dinner_home",
                    "prep_time_minutes": 10,
                    "cook_time_minutes": 15,
                    "difficulty": "Einfach",
                    "lunchbox_ready": True,
                    "base_calories": total_cals,
                    "base_protein_g": total_p,
                    "base_carbs_g": total_c,
                    "base_fat_g": total_f,
                    "allergens": allergens,
                    "diet_types": diets,
                    "ingredients": [
                        {"name": m_name, "base_amount": m_amt, "unit": m_unit, "category": m_cat, "matched_offer_retailer": retailer},
                        {"name": s_name, "base_amount": s_amt, "unit": s_unit, "category": s_cat, "matched_offer_retailer": retailer},
                        {"name": v_name, "base_amount": v_amt, "unit": v_unit, "category": v_cat, "matched_offer_retailer": retailer},
                        {"name": "Natives Olivenöl extra & Meersalz", "base_amount": 10, "unit": "ml", "category": "Basics"}
                    ],
                    "instructions": [
                        f"{m_name} in der Pfanne oder im Ofen schonend anbraten / garen.",
                        f"{v_name} und {s_name} hinzugeben und mit Kräutern abschmecken.",
                        "Nach dem fairen Tellertrick am Herd servieren: Kellenmaß pro Person beachten!"
                    ],
                    "detailed_instructions": {
                        "prep_steps": [f"{m_name} parieren bzw. vorbereiten.", f"{v_name} waschen und schneiden."],
                        "cooking_steps": [f"Pfanne anheizen und {m_name} scharf anbraten.", f"{v_name} und {s_name} dazugeben und 10 Min. garen."],
                        "lunchbox_tips": ["Eventuelle Reste direkt für die morgige Brotdose einpacken!"]
                    },
                    "tags": [retailer, "Abendessen", "One-Pot", "Familie", "Tellertrick"],
                    "image_url": UNSPLASH_FOOD_IMAGES[(count_di + 1) % len(UNSPLASH_FOOD_IMAGES)]
                }
                recipes.append(recipe_dict)
                count_di += 1

    print(f"Total recipes generated: {len(recipes)}")
    print(f"- Breakfasts: {sum(1 for r in recipes if r['meal_type'] == 'breakfast_lunchbox')}")
    print(f"- Lunches:    {sum(1 for r in recipes if r['meal_type'] == 'lunch_lunchbox')}")
    print(f"- Dinners:    {sum(1 for r in recipes if r['meal_type'] == 'dinner_home')}")
    
    out_path = os.path.join(os.path.dirname(__file__), "recipes_universe.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)
    print(f"Saved to {out_path}")

if __name__ == "__main__":
    build_universe()
