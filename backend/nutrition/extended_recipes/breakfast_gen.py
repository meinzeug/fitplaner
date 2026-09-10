"""
Generator for 325 extended breakfast recipes (uni-bf-36 to uni-bf-360).
"""

from typing import List, Dict, Any, Set
from backend.nutrition.extended_recipes.common import make_ing, create_recipe


def generate_extended_breakfasts(existing_titles: Set[str], start_idx: int = 36, target_count: int = 325) -> List[Dict[str, Any]]:
    recipes: List[Dict[str, Any]] = []
    seen_titles = set(existing_titles)
    cur_id = start_idx

    def get_unique_title(base_title: str) -> str:
        if base_title not in seen_titles:
            seen_titles.add(base_title)
            return base_title
        prefixes = ["Feiner ", "Cremiger ", "Köstlicher ", "Frischer ", "Herzhafter ", "Bunter ", "Klassischer ", "Schneller ", "Vitaler ", "Knuspriger "]
        for p in prefixes:
            candidate = p + base_title
            if candidate not in seen_titles:
                seen_titles.add(candidate)
                return candidate
        i = 2
        while f"{base_title} (Variante {i})" in seen_titles:
            i += 1
        t = f"{base_title} (Variante {i})"
        seen_titles.add(t)
        return t

    # -------------------------------------------------------------------------
    # ARCHETYPE 1: Porridge & Warme Getreidebreie (60 Rezepte)
    # -------------------------------------------------------------------------
    grains = [
        ("Zarte Haferflocken", "gluten", "Trockensortiment"),
        ("Dinkelflocken", "gluten", "Trockensortiment"),
        ("Hirseflocken", None, "Trockensortiment"),
        ("Buchweizenflocken", None, "Trockensortiment"),
    ]
    fruits = [
        ("Äpfel", "Obst & Gemüse", "würfeln", "Apfelstücken"),
        ("Birnen", "Obst & Gemüse", "fein schneiden", "Birnenspalten"),
        ("Heidelbeeren", "Obst & Gemüse", "behutsam waschen", "Heidelbeeren"),
        ("Himbeeren", "Obst & Gemüse", "verlesen", "Himbeeren"),
        ("Erdbeeren", "Obst & Gemüse", "vierteln", "Erdbeeren"),
        ("Bananen", "Obst & Gemüse", "in Scheiben schneiden", "Bananenscheiben"),
        ("Pflaumen", "Obst & Gemüse", "entsteinen und vierteln", "Pflaumenspalten"),
    ]
    nuts = [
        ("Walnüsse", "nuesse", "Nüsse & Kerne", "gehackten Walnüssen"),
        ("Mandeln", "nuesse", "Nüsse & Kerne", "gerösteten Mandelsplittern"),
        ("Haselnüsse", "nuesse", "Nüsse & Kerne", "aromatischen Haselnüssen"),
        ("Cashewkerne", "nuesse", "Nüsse & Kerne", "Cashewkernen"),
        ("Kürbiskerne", None, "Nüsse & Kerne", "knusprigen Kürbiskernen"),
        ("Sonnenblumenkerne", None, "Nüsse & Kerne", "goldenen Sonnenblumenkernen"),
        ("Chiasamen", None, "Trockensortiment", "gequollenen Chiasamen"),
        ("Leinsamen", None, "Trockensortiment", "feinen Leinsamen"),
    ]
    liquids = [
        ("Hafermilch", ["gluten"], "Getränke"),
        ("Mandelmilch", ["nuesse"], "Getränke"),
        ("Milch", ["laktose"], "Kühlregal"),
        ("Sojamilch", ["soja"], "Getränke"),
    ]

    p_count = 0
    for g_name, g_alg, g_cat in grains:
        for f_name, f_cat, f_prep, f_desc in fruits:
            for n_name, n_alg, n_cat, n_desc in nuts:
                if p_count >= 60:
                    break
                liq_name, liq_algs, liq_cat = liquids[p_count % len(liquids)]
                p_count += 1
                
                title = get_unique_title(f"Warmer {g_name.replace('Zarte ', '')}-Porridge mit {f_name} & {n_name}")
                algs = []
                if g_alg: algs.append(g_alg)
                if n_alg: algs.append(n_alg)
                algs.extend(liq_algs)
                algs = list(set(algs))
                
                diets = ["vegetarian", "clean_eating"]
                if "laktose" not in algs:
                    diets.append("vegan")

                ings = [
                    make_ing(g_name, 65, "g", g_cat, p_count),
                    make_ing(liq_name, 180, "ml", liq_cat, p_count + 1),
                    make_ing(f_name, 70, "g", f_cat, p_count + 2),
                    make_ing(n_name, 20, "g", n_cat, p_count + 3),
                    make_ing("Zimt", 2, "g", "Gewürze", p_count + 4),
                ]

                prep_steps = [
                    f"{f_name} gründlich waschen, putzen und {f_prep}.",
                    f"{n_name} mit einem großen Kochmesser auf dem Holzbrett grob zerteilen.",
                    f"{g_name} und {liq_name} grammgenau abmessen und bereitstellen.",
                ]
                cooking_steps = [
                    f"{liq_name} mit {g_name} und 1 Prise Zimt in einen kleinen Topf geben und bei mittlerer Hitze unter Rühren zum Kochen bringen.",
                    "Die Hitze auf minimale Stufe reduzieren und den Brei ca. 4–5 Minuten sanft köcheln lassen, bis er sämig und cremig eingedickt ist.",
                    f"Parallel {n_name} in einer Pfanne ohne Fett bei mittlerer Hitze 2–3 Minuten anrösten, bis sie herrlich duften.",
                    f"Den warmen Porridge in eine Schale füllen, mit den vorbereiteten {f_desc} belegen und mit {n_desc} bestreuen.",
                ]
                lunchbox_tips = [
                    "Vor dem Verschließen der Dose ausdampfen lassen, damit der Porridge nicht schwitzt.",
                    f"{n_name} trocken separat mitnehmen für maximalen Crunch.",
                    "Im Kühlschrank bei 4–7°C 2 Tage haltbar; mikrowellengeeignet bei 600 W für 90 Sekunden.",
                ]
                instructions = [
                    f"{f_name} vorbereiten und {n_name} grob hacken.",
                    f"{g_name} mit {liq_name} und Zimt im Topf aufkochen.",
                    "Bei geringer Hitze 4–5 Minuten cremig einköcheln lassen.",
                    f"{n_name} in der Pfanne kurz anrösten.",
                    "Porridge anrichten, garnieren und warm oder kalt servieren.",
                ]

                recipes.append(create_recipe(
                    r_id=f"uni-bf-{cur_id}",
                    title=title,
                    meal_type="breakfast_lunchbox",
                    prep_min=5,
                    cook_min=5,
                    difficulty="Einfach",
                    lunchbox_ready=True,
                    cals=440 + (p_count % 5) * 15,
                    prot=16 + (p_count % 4) * 2,
                    carbs=58 + (p_count % 5) * 2,
                    fat=13 + (p_count % 3) * 2,
                    allergens=algs,
                    diet_types=diets,
                    ingredients=ings,
                    instructions=instructions,
                    prep_steps=prep_steps,
                    cooking_steps=cooking_steps,
                    lunchbox_tips=lunchbox_tips,
                    tags=["Frühstück", "Porridge", "Ballaststoffreich", "Warm"],
                    image_key="oats"
                ))
                cur_id += 1

    # -------------------------------------------------------------------------
    # ARCHETYPE 2: Overnight Oats & Chia Jars (60 Rezepte)
    # -------------------------------------------------------------------------
    oo_fruits = [
        ("Heidelbeeren", "Obst & Gemüse", "verlesen und trocken tupfen", "Heidelbeeren"),
        ("Himbeeren", "Obst & Gemüse", "kurz kalt abbrausen", "Himbeeren"),
        ("Erdbeeren", "Obst & Gemüse", "entkelchen und vierteln", "Erdbeervierteln"),
        ("Äpfel", "Obst & Gemüse", "waschen, entkernen und klein würfeln", "Apfelstücken"),
        ("Bananen", "Obst & Gemüse", "in Scheiben schneiden", "Bananenscheiben"),
        ("Birnen", "Obst & Gemüse", "würfeln und mit Zitronensaft beträufeln", "Birnenstücken"),
    ]
    oo_dairy = [
        ("Magerquark", 120, "g", ["laktose"], "Kühlregal"),
        ("Skyr Natur", 130, "g", ["laktose"], "Kühlregal"),
        ("Naturjoghurt", 120, "g", ["laktose"], "Kühlregal"),
        ("Mandelmilch", 140, "ml", ["nuesse"], "Getränke"),
    ]

    oo_count = 0
    while oo_count < 60:
        f_name, f_cat, f_prep, f_desc = oo_fruits[oo_count % len(oo_fruits)]
        d_name, d_amt, d_unit, d_algs, d_cat = oo_dairy[oo_count % len(oo_dairy)]
        n_name, n_alg, n_cat, n_desc = nuts[oo_count % len(nuts)]
        oo_count += 1

        title = get_unique_title(f"Overnight Oats mit {f_name}, {d_name} & {n_name}")
        algs = ["gluten"] + d_algs
        if n_alg: algs.append(n_alg)
        algs = list(set(algs))
        diets = ["vegetarian", "clean_eating"]
        if "laktose" not in algs:
            diets.append("vegan")

        ings = [
            make_ing("Zarte Haferflocken", 60, "g", "Trockensortiment", oo_count),
            make_ing("Chiasamen", 15, "g", "Trockensortiment", oo_count + 1),
            make_ing(d_name, d_amt, d_unit, d_cat, oo_count + 2),
            make_ing(f_name, 70, "g", f_cat, oo_count + 3),
            make_ing(n_name, 15, "g", n_cat, oo_count + 4),
        ]

        prep_steps = [
            f"Haferflocken und Chiasamen exakt abwiegen.",
            f"{f_name} gründlich {f_prep}.",
            f"{n_name} mit den Fingern oder einem Messer grob zerkleinern.",
        ]
        cooking_steps = [
            f"Haferflocken, Chiasamen und {d_name} in einem Weckglas oder Schraubglas gründlich verrühren.",
            "Nach 5 Minuten Stehzeit nochmals aufrühren, damit sich die Chiasamen nicht am Boden festsetzen.",
            f"Die vorbereiteten {f_desc} und {n_desc} dekorativ auf die Hafermasse schichten.",
            "Das Glas luftdicht verschließen und für mindestens 6 Stunden oder über Nacht bei 4–6°C im Kühlschrank quellen lassen.",
        ]
        lunchbox_tips = [
            "Im dichten Schraubglas absolut auslaufsicher und sofort transportbereit.",
            "Gekühlt bis zu 3 Tage frisch und cremig haltbar.",
            f"Wer Knusprigkeit liebt, nimmt {n_name} in einem Extradöschen mit.",
        ]
        instructions = [
            "Flocken, Chiasamen und Milchprodukt abmessen.",
            "Zutaten im Glas cremig verrühren.",
            f"Mit {f_name} und {n_name} belegen.",
            "Verschließen und über Nacht im Kühlschrank quellen lassen.",
            "Morgens löffelfertig genießen oder mitnehmen.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-bf-{cur_id}",
            title=title,
            meal_type="breakfast_lunchbox",
            prep_min=5,
            cook_min=0,
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=450 + (oo_count % 5) * 12,
            prot=22 + (oo_count % 4) * 3,
            carbs=54 + (oo_count % 5) * 2,
            fat=14 + (oo_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Meal-Prep", "Overnight Oats", "Ballaststoffreich", "Kalt"],
            image_key="oats"
        ))
        cur_id += 1

    # -------------------------------------------------------------------------
    # ARCHETYPE 3: Skyr & Quark Protein Bowls (55 Rezepte)
    # -------------------------------------------------------------------------
    skyr_bases = [
        ("Skyr Natur", 250, "g", "Kühlregal"),
        ("Magerquark", 220, "g", "Kühlregal"),
        ("Griechischer Joghurt", 200, "g", "Kühlregal"),
    ]
    sk_count = 0
    while sk_count < 55:
        b_name, b_amt, b_unit, b_cat = skyr_bases[sk_count % len(skyr_bases)]
        f_name, f_cat, f_prep, f_desc = oo_fruits[sk_count % len(oo_fruits)]
        n_name, n_alg, n_cat, n_desc = nuts[sk_count % len(nuts)]
        sk_count += 1

        title = get_unique_title(f"High-Protein {b_name.split()[0]}-Bowl mit {f_name} & {n_name}")
        algs = ["laktose"]
        if n_alg: algs.append(n_alg)
        diets = ["vegetarian", "clean_eating", "high_protein"]

        ings = [
            make_ing(b_name, b_amt, b_unit, b_cat, sk_count),
            make_ing(f_name, 80, "g", f_cat, sk_count + 1),
            make_ing(n_name, 20, "g", n_cat, sk_count + 2),
            make_ing("Zimt", 2, "g", "Gewürze", sk_count + 3),
            make_ing("Honig", 10, "g", "Trockensortiment", sk_count + 4),
        ]

        prep_steps = [
            f"{f_name} waschen, putzen und {f_prep}.",
            f"{n_name} mit dem Küchenmesser grob zerteilen.",
            f"{b_name} bereitstellen und Honig abmessen.",
        ]
        cooking_steps = [
            f"{b_name} in eine Schale oder Meal-Prep-Box geben und mit 1–2 EL Mineralwasser und 1 Prise Zimt 1 Minute cremig rühren.",
            f"Die vorbereiteten {f_desc} fächerartig auf der Quarkoberfläche anrichten.",
            f"{n_name} in einer kleinen Pfanne ohne Fett 2 Minuten anrösten, bis sie duften, und auf die Bowl streuen.",
            "Mit Honig in feinen Streifen beträufeln und servieren.",
        ]
        lunchbox_tips = [
            f"Nüsse separat transportieren für besten Biss.",
            "Im Kühlschrank bei 4–7°C 2 Tage frisch haltbar.",
            "Vor dem Essen nach Belieben nochmals kurz durchrühren.",
        ]
        instructions = [
            f"{f_name} vorbereiten und {n_name} hacken.",
            f"{b_name} mit Wasser und Zimt samtig aufschlagen.",
            f"In die Box füllen und mit {f_name} belegen.",
            f"Mit gerösteten {n_name} und Honig vollenden.",
            "Gekühlt genießen oder mitnehmen.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-bf-{cur_id}",
            title=title,
            meal_type="breakfast_lunchbox",
            prep_min=5,
            cook_min=0,
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=410 + (sk_count % 5) * 15,
            prot=34 + (sk_count % 4) * 2,
            carbs=36 + (sk_count % 5) * 2,
            fat=12 + (sk_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["High-Protein", "Skyr", "Vegetarisch", "Fitness"],
            image_key="skyr"
        ))
        cur_id += 1

    # -------------------------------------------------------------------------
    # ARCHETYPE 4: Vollkorn-Stullen, Toasties & Knusperbrot (55 Rezepte)
    # -------------------------------------------------------------------------
    breads = [
        ("Vollkornbrot", 80, "g", "Brot & Backwaren"),
        ("Dinkelbrot", 80, "g", "Brot & Backwaren"),
        ("Knäckebrot", 50, "g", "Brot & Backwaren"),
    ]
    spreads = [
        ("Frischkäse", 30, "g", ["laktose"], "Kühlregal"),
        ("Körniger Frischkäse", 70, "g", ["laktose"], "Kühlregal"),
        ("Avocado", 50, "g", [], "Obst & Gemüse"),
        ("Magerquark", 60, "g", ["laktose"], "Kühlregal"),
        ("Butter", 15, "g", ["laktose"], "Kühlregal"),
    ]
    toppings = [
        ("Eier Bio", 1, "Stück", ["eier"], "Eier & Hefe", "gekochtem Bio-Ei", 7),
        ("Räucherlachs", 50, "g", ["fisch"], "Kühlregal", "Räucherlachs", 0),
        ("Putenbrust Aufschnitt", 50, "g", [], "Kühlregal", "zarter Putenbrust", 0),
        ("Gouda", 40, "g", ["laktose"], "Kühlregal", "mildem Gouda", 0),
        ("Tomaten", 60, "g", [], "Obst & Gemüse", "frischen Tomatenscheiben", 0),
        ("Gurke", 60, "g", [], "Obst & Gemüse", "knackigen Gurkenscheiben", 0),
    ]

    st_count = 0
    while st_count < 55:
        b_name, b_amt, b_unit, b_cat = breads[st_count % len(breads)]
        sp_name, sp_amt, sp_unit, sp_algs, sp_cat = spreads[st_count % len(spreads)]
        top_name, top_amt, top_unit, top_algs, top_cat, top_desc, cook_time = toppings[st_count % len(toppings)]
        st_count += 1

        title = get_unique_title(f"{b_name} mit {sp_name} & {top_name}")
        algs = ["gluten"] + sp_algs + top_algs
        algs = list(set(algs))
        diets = ["clean_eating"]
        if "fisch" in algs:
            diets.append("pescetarian")
        elif "eier" in algs or "laktose" in algs:
            diets.append("vegetarian")

        ings = [
            make_ing(b_name, b_amt, b_unit, b_cat, st_count),
            make_ing(sp_name, sp_amt, sp_unit, sp_cat, st_count + 1),
            make_ing(top_name, top_amt, top_unit, top_cat, st_count + 2),
            make_ing("Schnittlauch", 10, "g", "Obst & Gemüse", st_count + 3),
        ]

        prep_steps = [
            f"{b_name} bereitstellen und Schnittlauch in feine Röllchen schneiden.",
            f"{top_name} abwiegen bzw. vorbereiten.",
            f"{sp_name} kühl bereitstellen.",
        ]
        if cook_time > 0:
            cooking_steps = [
                f"{top_name} in kochendem Wasser exakt {cook_time} Minuten garen, abschrecken und pellen.",
                f"{b_name} nach Wunsch im Toaster 2 Minuten goldbraun rösten.",
                f"Das Brot gleichmäßig mit {sp_name} bestreichen.",
                f"Mit dem {top_desc} belegen, mit Meersalz und Pfeffer würzen und mit Schnittlauch bestreuen.",
            ]
        else:
            cooking_steps = [
                f"{b_name} nach Wunsch kurz antoasten, bis die Kruste knusprig duftet.",
                f"Die Scheiben großzügig mit {sp_name} bestreichen.",
                f"Mit {top_desc} gleichmäßig belegen.",
                "Mit Schnittlauchröllchen und frisch gemahlenem Pfeffer vollenden.",
            ]

        lunchbox_tips = [
            "In Butterbrotpapier oder Bienenwachstuch einschlagen, damit das Brot knusprig bleibt.",
            "Als Klappstulle mit zweiter Brotscheibe bedecken für sauberen Transport.",
            "Im Kühlschrank 24 Stunden haltbar.",
        ]
        instructions = [
            "Brot bereitstellen und Kräuter hacken.",
            f"{top_name} falls nötig garen oder schneiden.",
            f"Brot mit {sp_name} bestreichen.",
            f"Mit {top_name} belegen und würzen.",
            "Zusammenklappen und verpacken oder servieren.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-bf-{cur_id}",
            title=title,
            meal_type="breakfast_lunchbox",
            prep_min=6,
            cook_min=cook_time,
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=390 + (st_count % 5) * 15,
            prot=18 + (st_count % 4) * 3,
            carbs=42 + (st_count % 5) * 2,
            fat=14 + (st_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Brotzeit", "Stulle", "Familienküche", "Herzhaft"],
            image_key="bread"
        ))
        cur_id += 1

    # -------------------------------------------------------------------------
    # ARCHETYPE 5: Eierspeisen, Omelettes & Rühreier (55 Rezepte)
    # -------------------------------------------------------------------------
    egg_veggies = [
        ("Babyspinat", 50, "g", "waschen und trocken schleudern"),
        ("Champignons", 70, "g", "putzen und in Scheiben schneiden"),
        ("Kirschtomaten", 60, "g", "waschen und halbieren"),
        ("Paprika rot", 60, "g", "entkernen und klein würfeln"),
        ("Lauch", 40, "g", "waschen und in Ringe schneiden"),
        ("Zucchini", 60, "g", "waschen und in Halbmonde schneiden"),
    ]
    egg_adds = [
        ("Feta", 40, "g", ["laktose"], "Kühlregal", "würzigen Feta-Bröseln"),
        ("Gouda", 30, "g", ["laktose"], "Kühlregal", "geriebenem Gouda"),
        ("Schnittlauch", 10, "g", [], "Obst & Gemüse", "frischem Schnittlauch"),
        ("Petersilie frisch", 10, "g", [], "Obst & Gemüse", "gehackter Petersilie"),
    ]

    egg_count = 0
    while egg_count < 55:
        v_name, v_amt, v_cat, v_prep = egg_veggies[egg_count % len(egg_veggies)]
        a_name, a_amt, a_unit, a_algs, a_cat, a_desc = egg_adds[egg_count % len(egg_adds)]
        egg_count += 1

        title = get_unique_title(f"Frisches Rührei mit {v_name} & {a_name}")
        algs = ["eier"] + a_algs
        diets = ["vegetarian", "clean_eating", "high_protein"]

        ings = [
            make_ing("Eier Bio", 2, "Stück", "Eier & Hefe", egg_count),
            make_ing(v_name, v_amt, "g", "Obst & Gemüse", egg_count + 1),
            make_ing(a_name, a_amt, a_unit, a_cat, egg_count + 2),
            make_ing("Butter", 8, "g", "Kühlregal", egg_count + 3),
            make_ing("Vollkornbrot", 60, "g", "Brot & Backwaren", egg_count + 4),
        ]

        prep_steps = [
            f"{v_name} gründlich {v_prep}.",
            "Bio-Eier in einer kleinen Schale mit einer Prise Meersalz und Pfeffer verquirlen.",
            f"{a_name} vorbereiten und Butter abmessen.",
        ]
        cooking_steps = [
            f"Butter in einer beschichteten Pfanne bei mittlerer Hitze (Stufe 5 von 9) schmelzen und {v_name} darin 2–3 Minuten anbraten.",
            "Die verquirlten Eier gleichmäßig über das Gemüse gießen.",
            "Mit einem Spatel das Ei sanft und langsam von außen nach innen zu zarten Schollen schieben.",
            f"Nach ca. 2–3 Minuten, wenn das Ei cremig gestockt ist, {a_desc} unterheben.",
            "Die Pfanne sofort vom Herd nehmen und das Rührei mit geröstetem Vollkornbrot servieren.",
        ]
        lunchbox_tips = [
            "Vor dem Einpacken vollständig abkühlen lassen, um Feuchtigkeit zu vermeiden.",
            "Schmeckt auch kalt hervorragend als Belag auf dem Vollkornbrot.",
            "Im Kühlschrank in einer dichten Box 1–2 Tage haltbar.",
        ]
        instructions = [
            f"{v_name} schneiden und Eier mit Gewürzen verquirlen.",
            f"Gemüse in Butter 2–3 Minuten anschwitzen.",
            "Eimasse zugeben und sanft stocken lassen.",
            f"Mit {a_name} verfeinern und Pfanne vom Herd ziehen.",
            "Mit Vollkornbrot anrichten und genießen.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-bf-{cur_id}",
            title=title,
            meal_type="breakfast_lunchbox",
            prep_min=6,
            cook_min=6,
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=410 + (egg_count % 5) * 15,
            prot=24 + (egg_count % 4) * 2,
            carbs=28 + (egg_count % 5) * 2,
            fat=18 + (egg_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Eierspeise", "Rührei", "Warm", "High-Protein"],
            image_key="eggs"
        ))
        cur_id += 1

    # -------------------------------------------------------------------------
    # ARCHETYPE 6: Pancakes, Waffeln & Pfannkuchen (40 Rezepte)
    # -------------------------------------------------------------------------
    pc_flours = [
        ("Vollkornmehl", ["gluten"]),
        ("Dinkelmehl", ["gluten"]),
        ("Zarte Haferflocken", ["gluten"]),
    ]
    pc_fruits = [
        ("Bananen", "Bananenscheiben"),
        ("Heidelbeeren", "Heidelbeeren"),
        ("Erdbeeren", "Erdbeeren"),
        ("Äpfel", "Apfelstücken"),
    ]
    pc_count = 0
    while pc_count < 40:
        fl_name, fl_algs = pc_flours[pc_count % len(pc_flours)]
        fr_name, fr_desc = pc_fruits[pc_count % len(pc_fruits)]
        pc_count += 1

        title = get_unique_title(f"Fluffige {fl_name.replace('Zarte ', '')}-Pancakes mit {fr_name}")
        algs = fl_algs + ["eier", "laktose"]
        diets = ["vegetarian", "clean_eating"]

        ings = [
            make_ing(fl_name, 70, "g", "Trockensortiment", pc_count),
            make_ing("Eier Bio", 1, "Stück", "Eier & Hefe", pc_count + 1),
            make_ing("Milch", 80, "ml", "Kühlregal", pc_count + 2),
            make_ing(fr_name, 60, "g", "Obst & Gemüse", pc_count + 3),
            make_ing("Ahornsirup", 15, "g", "Trockensortiment", pc_count + 4),
        ]

        prep_steps = [
            f"{fr_name} waschen und zerkleinern.",
            f"{fl_name} mit Bio-Ei und Milch in einer Rührschüssel zu einem zähflüssigen Teig verrühren.",
            "Eine beschichtete Pfanne bereitstellen und leicht fetten.",
        ]
        cooking_steps = [
            "Pfanne bei mittlerer Hitze (Stufe 5–6) vorheizen.",
            "Jeweils 2 Esslöffel Teig hineingeben und kleine Pancakes formen.",
            "Bei mittlerer Hitze 2–3 Minuten backen, bis sich an der Oberseite kleine Bläschen bilden.",
            "Vorsichtig wenden und die andere Seite in 1,5–2 Minuten goldgelb ausbacken.",
            f"Auf einem Teller stapeln, mit frischen {fr_desc} belegen und mit Ahornsirup beträufeln.",
        ]
        lunchbox_tips = [
            "Pancakes auf einem Kuchengitter vollständig abkühlen lassen, damit sie nicht matschig werden.",
            "Ahornsirup in einem kleinen Extradöschen mitführen.",
            "Im Toaster in 2 Minuten wieder kross aufbackbar; im Kühlschrank 2 Tage haltbar.",
        ]
        instructions = [
            f"{fr_name} vorbereiten und Teig anrühren.",
            "Pfanne auf mittlerer Hitze erwärmen.",
            "Pancakes portionsweise 2–3 Minuten backen.",
            "Wenden und goldgelb fertig bräunen.",
            f"Mit {fr_name} und Ahornsirup servieren oder einpacken.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-bf-{cur_id}",
            title=title,
            meal_type="breakfast_lunchbox",
            prep_min=8,
            cook_min=8,
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=430 + (pc_count % 5) * 15,
            prot=16 + (pc_count % 4) * 2,
            carbs=62 + (pc_count % 5) * 2,
            fat=11 + (pc_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Pancakes", "Süßes Frühstück", "Familie", "Vegetarisch"],
            image_key="pancakes"
        ))
        cur_id += 1

    print(f"Generated {len(recipes)} extended breakfast recipes (from uni-bf-{start_idx} to uni-bf-{cur_id-1}).")
    return recipes
