"""
Generator for 325 extended dinner recipes (uni-di-36 to uni-di-360).
"""

from typing import List, Dict, Any, Set
from backend.nutrition.extended_recipes.common import make_ing, create_recipe


def generate_extended_dinners(existing_titles: Set[str], start_idx: int = 36, target_count: int = 325) -> List[Dict[str, Any]]:
    recipes: List[Dict[str, Any]] = []
    seen_titles = set(existing_titles)
    cur_id = start_idx

    def get_unique_title(base_title: str) -> str:
        if base_title not in seen_titles:
            seen_titles.add(base_title)
            return base_title
        prefixes = ["Feines ", "Ofenfrisches ", "Zartes ", "Deftiges ", "Mediterranes ", "Aromatisches ", "Klassisches ", "Herzhaftes ", "Knuspriges ", "Buntes "]
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
    # ARCHETYPE 1: Fisch & Meeresfrüchte (70 Rezepte)
    # -------------------------------------------------------------------------
    fishes = [
        ("Lachsfilet", 150, "g", "Fisch & Meeresfrüchte", ["fisch"], "Lachsfilet trocken tupfen und leicht salzen", "Lachsfilet ca. 12–14 Minuten saftig im Ofen garen bzw. sanft braten", 12),
        ("Kabeljaufilet", 160, "g", "Fisch & Meeresfrüchte", ["fisch"], "Kabeljaufilet trocken tupfen", "Kabeljaufilet ca. 6–7 Minuten sanft pochieren bzw. braten, bis es glasig ist", 7),
        ("Forellenfilet", 150, "g", "Fisch & Meeresfrüchte", ["fisch"], "Forellenfilet trocken tupfen", "Forellenfilet auf der Hautseite 3–4 Minuten kross anbraten und kurz garziehen", 5),
        ("Garnelen", 140, "g", "Fisch & Meeresfrüchte", ["krebstiere"], "Garnelen abspülen und trocken tupfen", "Garnelen in der heißen Pfanne 3 Minuten rosa anbraten", 4),
    ]
    fish_sides = [
        ("Kartoffeln", 200, "g", "Obst & Gemüse", "Kartoffeln schälen und vierteln", "in Salzwasser 18 Minuten gar kochen", 18),
        ("Süßkartoffeln", 180, "g", "Obst & Gemüse", "Süßkartoffeln in 1,5 cm Würfel schneiden", "im Ofen bei 200°C 18 Minuten rösten", 18),
        ("Naturreis", 60, "g", "Trockensortiment", "Naturreis abbrausen", "in Salzwasser 25 Minuten ausquellen lassen", 25),
        ("Vollkorn-Penne", 70, "g", "Trockensortiment", "Penne bereitstellen", "in kochendem Salzwasser 9 Minuten al dente kochen", 9),
    ]
    fish_veggies = [
        ("Brokkoli", 120, "g", "Obst & Gemüse", "Brokkoli in Röschen teilen", "4 Minuten dämpfen"),
        ("Zucchini", 100, "g", "Obst & Gemüse", "Zucchini in Scheiben schneiden", "3 Minuten anbraten"),
        ("Babyspinat", 80, "g", "Obst & Gemüse", "Spinat waschen und schleudern", "1 Minute zusammenfallen lassen"),
        ("Kirschtomaten", 90, "g", "Obst & Gemüse", "Kirschtomaten waschen und halbieren", "2 Minuten mitschwenken"),
        ("Grüner Spargel", 100, "g", "Obst & Gemüse", "Spargel im unteren Drittel schälen", "4 Minuten blanchieren"),
    ]

    f_count = 0
    while f_count < 70:
        fi_name, fi_amt, fi_unit, fi_cat, fi_algs, fi_prep, fi_cook, fi_time = fishes[f_count % len(fishes)]
        fs_name, fs_amt, fs_unit, fs_cat, fs_prep, fs_cook, fs_time = fish_sides[f_count % len(fish_sides)]
        fv_name, fv_amt, fv_unit, fv_cat, fv_prep, fv_cook = fish_veggies[f_count % len(fish_veggies)]
        f_count += 1

        title = get_unique_title(f"{fi_name} mit {fv_name} & {fs_name}")
        algs = list(set(fi_algs + (["gluten"] if "penne" in fs_name.lower() else [])))
        diets = ["pescetarian", "clean_eating", "high_protein"]

        ings = [
            make_ing(fi_name, fi_amt, fi_unit, fi_cat, f_count),
            make_ing(fs_name, fs_amt, fs_unit, fs_cat, f_count + 1),
            make_ing(fv_name, fv_amt, fv_unit, fv_cat, f_count + 2),
            make_ing("Olivenöl", 10, "ml", "Öle & Fette", f_count + 3),
            make_ing("Zitrone", 20, "g", "Obst & Gemüse", f_count + 4),
        ]

        prep_steps = [
            f"{fi_prep}.",
            f"{fs_prep}.",
            f"{fv_prep}.",
            "Zitrone heiß waschen und 1 EL Saft auspressen; Gewürze bereitlegen.",
        ]
        cooking_steps = [
            f"{fs_name} {fs_cook}.",
            f"1 TL Olivenöl in der Pfanne erhitzen und {fi_cook}.",
            f"{fv_name} {fv_cook}.",
            "Den Fisch mit frischem Zitronensaft, Meersalz und Pfeffer aus der Mühle verfeinern.",
            f"{fi_name} zusammen mit {fv_name} und den heißen {fs_name} servieren.",
        ]
        lunchbox_tips = [
            "Fisch sanft garen, damit er saftig bleibt und nicht austrocknet.",
            "Reste vor dem Verpacken vollständig abkühlen lassen; im Kühlschrank 2 Tage haltbar.",
            "Schonend bei geringer Mikrowellenleistung (300 W) für 2 Minuten erwärmen.",
        ]
        instructions = [
            f"{fs_name} vorbereiten und garen.",
            f"{fv_name} schneiden und dünsten.",
            f"{fi_name} auf den Punkt garen.",
            "Mit Zitrone, Meersalz und Pfeffer abschmecken.",
            "Alle Komponenten harmonisch anrichten und servieren.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-di-{cur_id}",
            title=title,
            meal_type="dinner_home",
            prep_min=10,
            cook_min=max(fi_time, fs_time),
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=510 + (f_count % 5) * 15,
            prot=34 + (f_count % 4) * 3,
            carbs=45 + (f_count % 5) * 2,
            fat=16 + (f_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Fisch", "Abendessen", "High-Protein", "Mediterran"],
            image_key="fish" if "lachs" not in fi_name.lower() else "salmon"
        ))
        cur_id += 1

    # -------------------------------------------------------------------------
    # ARCHETYPE 2: Geflügel (Hähnchen & Pute) (70 Rezepte)
    # -------------------------------------------------------------------------
    poultry = [
        ("Bio-Hähnchenbrust", 160, "g", "Geflügel", "Hähnchenbrustfilet kalt abspülen und trocken tupfen", "Hähnchenbrust in 1 TL Öl von beiden Seiten je 4–5 Minuten goldbraun braten", 10),
        ("Putenbrustfilet", 160, "g", "Geflügel", "Putenbrustfilet trocken tupfen und in Medaillons teilen", "Puten-Medaillons 5–6 Minuten rundherum scharf anbraten", 6),
    ]
    poultry_sides = [
        ("Naturreis", 65, "g", "Trockensortiment", [], 25),
        ("Vollkorn-Penne", 70, "g", "Trockensortiment", ["gluten"], 9),
        ("Kartoffeln", 200, "g", "Obst & Gemüse", [], 18),
        ("Süßkartoffeln", 180, "g", "Obst & Gemüse", [], 18),
        ("Quinoa", 60, "g", "Trockensortiment", [], 15),
    ]
    poultry_veggies = [
        ("Brokkoli", 120, "g", "Obst & Gemüse", "Brokkoli in mundgerechte Röschen schneiden", "4 Minuten dämpfen"),
        ("Champignons", 100, "g", "Obst & Gemüse", "Champignons putzen und in Scheiben schneiden", "3 Minuten braun anbraten"),
        ("Paprika bunt", 100, "g", "Obst & Gemüse", "Paprika in Streifen schneiden", "3 Minuten anschwitzen"),
        ("Zucchini", 100, "g", "Obst & Gemüse", "Zucchini in Scheiben schneiden", "3 Minuten mitbraten"),
        ("Karotten", 80, "g", "Obst & Gemüse", "Karotten schälen und in Scheiben schneiden", "5 Minuten dünsten"),
    ]

    po_count = 0
    while po_count < 70:
        p_name, p_amt, p_unit, p_cat, p_prep, p_cook, p_time = poultry[po_count % len(poultry)]
        ps_name, ps_amt, ps_unit, ps_cat, ps_algs, ps_time = poultry_sides[po_count % len(poultry_sides)]
        pv_name, pv_amt, pv_unit, pv_cat, pv_prep, pv_cook = poultry_veggies[po_count % len(poultry_veggies)]
        po_count += 1

        title = get_unique_title(f"{p_name} mit {pv_name} & {ps_name}")
        algs = list(set(ps_algs))
        diets = ["omnivore", "clean_eating", "high_protein"]

        ings = [
            make_ing(p_name, p_amt, p_unit, p_cat, po_count),
            make_ing(ps_name, ps_amt, ps_unit, ps_cat, po_count + 1),
            make_ing(pv_name, pv_amt, pv_unit, pv_cat, po_count + 2),
            make_ing("Rapsöl", 8, "ml", "Öle & Fette", po_count + 3),
            make_ing("Paprikapulver", 2, "g", "Gewürze", po_count + 4),
        ]

        prep_steps = [
            f"{p_prep}.",
            f"{ps_name} bereitstellen und vorbereiten.",
            f"{pv_prep}.",
            "Paprikapulver mit Meersalz und Pfeffer bereitstellen.",
        ]
        cooking_steps = [
            f"{ps_name} in leichtem Salzwasser ca. {ps_time} Minuten gar köcheln.",
            f"1 TL Rapsöl in der Pfanne erhitzen und {p_cook}.",
            f"{pv_name} {pv_cook}.",
            "Das Fleisch mit Paprikapulver, Meersalz und Pfeffer würzen und 2 Minuten ruhen lassen.",
            f"Das Fleisch in schräge Scheiben schneiden und mit {pv_name} und {ps_name} anrichten.",
        ]
        lunchbox_tips = [
            "Hähnchen- und Putengerichte lassen sich ideal am Folgetag mitnehmen.",
            "Fleisch erst nach dem Abkühlen anschneiden, damit kein Saft verloren geht.",
            "Im Kühlschrank verschlossen 3 Tage haltbar.",
        ]
        instructions = [
            f"{ps_name} gar kochen.",
            f"{p_name} und {pv_name} vorbereiten.",
            f"{p_name} in der Pfanne goldbraun anbraten.",
            f"{pv_name} garen und mit Gewürzen abschmecken.",
            "Zusammen servieren oder für Meal-Prep einpacken.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-di-{cur_id}",
            title=title,
            meal_type="dinner_home",
            prep_min=10,
            cook_min=max(p_time, ps_time),
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=520 + (po_count % 5) * 15,
            prot=38 + (po_count % 4) * 3,
            carbs=48 + (po_count % 5) * 2,
            fat=14 + (po_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Geflügel", "Abendessen", "High-Protein", "Fitness"],
            image_key="chicken"
        ))
        cur_id += 1

    # -------------------------------------------------------------------------
    # ARCHETYPE 3: Rindfleisch & Mageres Hackfleisch (55 Rezepte)
    # -------------------------------------------------------------------------
    beef_meats = [
        ("Rinderhack", 130, "g", "Fleisch", "Rinderhack bereitlegen", "Rinderhack ohne Fett 5 Minuten krümelig anbraten"),
        ("Rindersteak", 160, "g", "Fleisch", "Steak trocken tupfen und temperieren", "Steak von beiden Seiten je 2,5 Minuten scharf anbraten und 3 Minuten ruhen lassen"),
    ]
    beef_dishes = [
        ("Chili con Carne", "Kidneybohnen Dose", 100, "g", "Konserven", "Dosentomaten", 150, "g", "Konserven", "Naturreis", 60, "g", "Trockensortiment", 15),
        ("Bauerntopf", "Kartoffeln", 200, "g", "Obst & Gemüse", "Paprika bunt", 80, "g", "Obst & Gemüse", "Dosentomaten", 120, "g", "Konserven", 18),
        ("Bolognese-Topf", "Vollkornnudeln", 75, "g", "Trockensortiment", "Dosentomaten", 180, "g", "Konserven", "Karotten", 60, "g", "Obst & Gemüse", 15),
        ("Hackbällchen-Pfanne", "Dosentomaten", 180, "g", "Konserven", "Zucchini", 80, "g", "Obst & Gemüse", "Vollkornbrot", 60, "g", "Brot & Backwaren", 12),
        ("Rindfleisch-Steak-Teller", "Kartoffeln", 180, "g", "Obst & Gemüse", "Brokkoli", 100, "g", "Obst & Gemüse", "Butter", 8, "g", "Kühlregal", 15),
    ]

    bf_count = 0
    while bf_count < 55:
        bm_name, bm_amt, bm_unit, bm_cat, bm_prep, bm_cook = beef_meats[bf_count % len(beef_meats)]
        d_name, i1_n, i1_a, i1_u, i1_c, i2_n, i2_a, i2_u, i2_c, i3_n, i3_a, i3_u, i3_c, d_cook_time = beef_dishes[bf_count % len(beef_dishes)]
        bf_count += 1

        title = get_unique_title(f"{d_name} mit {bm_name} & {i2_n}")
        algs = []
        if "nudeln" in i1_n.lower() or "brot" in i3_n.lower():
            algs.append("gluten")
        if "butter" in i3_n.lower():
            algs.append("laktose")
        diets = ["omnivore", "clean_eating", "high_protein"]

        ings = [
            make_ing(bm_name, bm_amt, bm_unit, bm_cat, bf_count),
            make_ing(i1_n, i1_a, i1_u, i1_c, bf_count + 1),
            make_ing(i2_n, i2_a, i2_u, i2_c, bf_count + 2),
            make_ing(i3_n, i3_a, i3_u, i3_c, bf_count + 3),
            make_ing("Paprikapulver", 2, "g", "Gewürze", bf_count + 4),
        ]

        prep_steps = [
            f"{bm_prep}.",
            f"{i1_n} und {i2_n} vorbereiten.",
            f"{i3_n} bereitstellen.",
            "Gewürze mit Meersalz und Pfeffer abmessen.",
        ]
        cooking_steps = [
            f"Eine Pfanne oder Schmortopf erhitzen und {bm_cook}.",
            f"{i2_n} dazugeben und 3 Minuten mitdünsten.",
            f"{i1_n} und {i3_n} zugeben und ca. {d_cook_time} Minuten sanft schmoren lassen.",
            "Mit Paprikapulver, Meersalz und Pfeffer kräftig abschmecken.",
            "Heiß auf Tellern servieren.",
        ]
        lunchbox_tips = [
            "Rindfleischgerichte schmecken aufgewärmt am Folgetag besonders herzhaft.",
            "In der Mikrowelle bei 600 W für 2,5 Minuten erhitzen.",
            "Im Kühlschrank 3–4 Tage haltbar.",
        ]
        instructions = [
            f"{bm_name} und Zutaten vorbereiten.",
            f"{bm_name} anbraten.",
            "Gemüse und Sauce zugeben.",
            f"Ca. {d_cook_time} Minuten sämig einkochen lassen.",
            "Abschmecken und servieren.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-di-{cur_id}",
            title=title,
            meal_type="dinner_home",
            prep_min=10,
            cook_min=d_cook_time + 5,
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=540 + (bf_count % 5) * 15,
            prot=36 + (bf_count % 4) * 3,
            carbs=42 + (bf_count % 5) * 2,
            fat=18 + (bf_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Rindfleisch", "Herzhaft", "Familienessen", "High-Protein"],
            image_key="steak" if "steak" in bm_name.lower() else "generic"
        ))
        cur_id += 1

    # -------------------------------------------------------------------------
    # ARCHETYPE 4: Vegetarische Ofengerichte, Aufläufe & Frittatas (65 Rezepte)
    # -------------------------------------------------------------------------
    veg_dishes = [
        ("Bunte Gemüse-Frittata", "Eier Bio", 3, "Stück", "Eier & Hefe", ["eier"], "Magerquark", 80, "g", "Kühlregal", ["laktose"], "Zucchini", 100, "g", "Obst & Gemüse", 18),
        ("Dinkel-Gemüse-Quiche", "Vollkornmehl", 60, "g", "Trockensortiment", ["gluten"], "Eier Bio", 2, "Stück", "Eier & Hefe", ["eier"], "Paprika bunt", 100, "g", "Obst & Gemüse", 22),
        ("Gebackener Feta-Auflauf", "Feta", 100, "g", "Kühlregal", ["laktose"], "Kirschtomaten", 140, "g", "Obst & Gemüse", [], "Paprika rot", 80, "g", "Obst & Gemüse", 18),
        ("Nudel-Spinat-Gratin", "Vollkornnudeln", 70, "g", "Trockensortiment", ["gluten"], "Babyspinat", 100, "g", "Obst & Gemüse", [], "Gouda", 40, "g", "Kühlregal", 18),
        ("Gefüllte Zucchini-Schiffchen", "Zucchini", 220, "g", "Obst & Gemüse", [], "Quinoa", 60, "g", "Trockensortiment", [], "Feta", 50, "g", "Kühlregal", 20),
    ]

    vo_count = 0
    while vo_count < 65:
        vd_title, i1_n, i1_a, i1_u, i1_c, i1_algs, i2_n, i2_a, i2_u, i2_c, i2_algs, i3_n, i3_a, i3_u, i3_c, vd_time = veg_dishes[vo_count % len(veg_dishes)]
        vo_count += 1

        title = get_unique_title(f"{vd_title} mit {i3_n} & {i2_n}")
        algs = list(set(i1_algs + i2_algs))
        diets = ["vegetarian", "clean_eating"]

        ings = [
            make_ing(i1_n, i1_a, i1_u, i1_c, vo_count),
            make_ing(i2_n, i2_a, i2_u, i2_c, vo_count + 1),
            make_ing(i3_n, i3_a, i3_u, i3_c, vo_count + 2),
            make_ing("Olivenöl", 8, "ml", "Öle & Fette", vo_count + 3),
            make_ing("Oregano getrocknet", 2, "g", "Gewürze", vo_count + 4),
        ]

        prep_steps = [
            f"{i1_n} bereitstellen und vorbereiten.",
            f"{i2_n} abmessen bzw. schneiden.",
            f"{i3_n} waschen und zerkleinern.",
            "Backofen auf 190°C Ober-/Unterhitze vorheizen.",
        ]
        cooking_steps = [
            "Eine Auflaufform oder ofenfeste Pfanne mit 1 TL Öl einstreichen.",
            f"{i3_n} und {i1_n} in die Form füllen bzw. anordnen.",
            f"Mit {i2_n} bestreuen bzw. den Guss darübergießen.",
            f"Im vorgeheizten Ofen bei 190°C ca. {vd_time} Minuten goldgelb überbacken.",
            "Mit Oregano, Meersalz und Pfeffer abschmecken und warm servieren.",
        ]
        lunchbox_tips = [
            "Aufläufe und Frittatas lassen sich in handliche Stücke schneiden und auslaufsicher mitnehmen.",
            "Vor dem Verschließen der Dose ausdampfen lassen.",
            "Im Kühlschrank 3 Tage haltbar.",
        ]
        instructions = [
            "Ofen vorheizen und Form fetten.",
            "Zutaten zerkleinern und vermengen.",
            "In die Form füllen und mit Käse/Guss toppen.",
            f"Im Ofen ca. {vd_time} Minuten backen.",
            "In Portionen teilen und servieren.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-di-{cur_id}",
            title=title,
            meal_type="dinner_home",
            prep_min=12,
            cook_min=vd_time,
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=480 + (vo_count % 5) * 15,
            prot=26 + (vo_count % 4) * 3,
            carbs=40 + (vo_count % 5) * 2,
            fat=18 + (vo_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Auflauf", "Ofengericht", "Vegetarisch", "Familie"],
            image_key="veggie"
        ))
        cur_id += 1

    # -------------------------------------------------------------------------
    # ARCHETYPE 5: Pflanzliche Dals, Currys & Tofu-Pfannen (65 Rezepte)
    # -------------------------------------------------------------------------
    plant_bases = [
        ("Bio-Naturtofu", 140, "g", "Kühlregal", ["soja"], "Tofu trocken pressen und in 1,5 cm Würfel schneiden", "Tofu in der Pfanne 5 Minuten knusprig anbraten"),
        ("Räuchertofu", 130, "g", "Kühlregal", ["soja"], "Räuchertofu würfeln", "Tofuwürfel 4 Minuten anbraten"),
        ("Rote Linsen", 80, "g", "Trockensortiment", [], "Linsen im Sieb kalt waschen", "Linsen 12 Minuten cremig köcheln"),
        ("Kichererbsen Dose", 160, "g", "Konserven", [], "Kichererbsen spülen und abtropfen", "Kichererbsen in Sauce erwärmen"),
    ]
    plant_veggies = [
        ("Brokkoli", 100, "g", "Brokkoli in Röschen teilen"),
        ("Babyspinat", 80, "g", "Spinat waschen und trocknen"),
        ("Karotten", 70, "g", "Karotten schälen und schneiden"),
        ("Zuckerschoten", 70, "g", "Zuckerschoten waschen"),
    ]
    plant_liquids = [
        ("Kokosmilch", 80, "ml", "Konserven"),
        ("Dosentomaten", 150, "g", "Konserven"),
    ]

    pl_count = 0
    while pl_count < 65:
        pb_name, pb_amt, pb_unit, pb_cat, pb_algs, pb_prep, pb_cook = plant_bases[pl_count % len(plant_bases)]
        pv_name, pv_amt, pv_unit, pv_prep = plant_veggies[pl_count % len(plant_veggies)]
        pl_name, pl_amt, pl_unit, pl_cat = plant_liquids[pl_count % len(plant_liquids)]
        pl_count += 1

        title = get_unique_title(f"Pflanzliches Curry mit {pb_name}, {pv_name} & {pl_name}")
        algs = list(set(pb_algs))
        diets = ["vegetarian", "vegan", "clean_eating"]

        ings = [
            make_ing(pb_name, pb_amt, pb_unit, pb_cat, pl_count),
            make_ing(pv_name, pv_amt, pv_unit, "Obst & Gemüse", pl_count + 1),
            make_ing(pl_name, pl_amt, pl_unit, pl_cat, pl_count + 2),
            make_ing("Naturreis", 60, "g", "Trockensortiment", pl_count + 3),
            make_ing("Currypulver", 4, "g", "Gewürze", pl_count + 4),
        ]

        prep_steps = [
            f"{pb_prep}.",
            f"{pv_prep}.",
            f"{pl_name} bereitstellen.",
            "Naturreis abspülen und Currypulver abmessen.",
        ]
        cooking_steps = [
            "Naturreis in gesalzenem Wasser ca. 25 Minuten gar köcheln.",
            f"1 TL Öl in der Pfanne erhitzen und {pb_cook}.",
            f"{pv_name} zugeben und 3 Minuten mitdünsten.",
            f"{pl_name} und Currypulver zufügen, aufkochen und 8 Minuten sanft köcheln lassen, bis die Sauce cremig eingedickt ist.",
            "Mit Meersalz und Pfeffer abschmecken und mit Naturreis anrichten.",
        ]
        lunchbox_tips = [
            "Pflanzliche Currys lassen sich fantastisch vorkochen und ziehen aromatisch durch.",
            "In der Mikrowelle bei 600 W in 2,5 Minuten dampfend heiß.",
            "Im Kühlschrank 3–4 Tage haltbar.",
        ]
        instructions = [
            "Reis gar kochen.",
            f"{pb_name} und {pv_name} vorbereiten.",
            f"{pb_name} und Gemüse anbraten.",
            f"Mit {pl_name} und Curry ablöschen und cremig köcheln.",
            "Abschmecken und mit Reis servieren.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-di-{cur_id}",
            title=title,
            meal_type="dinner_home",
            prep_min=10,
            cook_min=18,
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=490 + (pl_count % 5) * 15,
            prot=22 + (pl_count % 4) * 3,
            carbs=56 + (pl_count % 5) * 2,
            fat=14 + (pl_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Curry", "Vegan", "Pflanzlich", "Warm"],
            image_key="curry"
        ))
        cur_id += 1

    print(f"Generated {len(recipes)} extended dinner recipes (from uni-di-{start_idx} to uni-di-{cur_id-1}).")
    return recipes
