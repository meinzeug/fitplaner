"""
Generator for 325 extended lunch recipes (uni-lu-36 to uni-lu-360).
"""

from typing import List, Dict, Any, Set
from backend.nutrition.extended_recipes.common import make_ing, create_recipe


def generate_extended_lunches(existing_titles: Set[str], start_idx: int = 36, target_count: int = 325) -> List[Dict[str, Any]]:
    recipes: List[Dict[str, Any]] = []
    seen_titles = set(existing_titles)
    cur_id = start_idx

    def get_unique_title(base_title: str) -> str:
        if base_title not in seen_titles:
            seen_titles.add(base_title)
            return base_title
        prefixes = ["Bunte ", "Mediterrane ", "Frische ", "Knackige ", "Herzhafte ", "Asiatische ", "Köstliche ", "Schnelle ", "Würzige ", "Vitalisierende "]
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
    # ARCHETYPE 1: Grain-Bowls (Quinoa, Naturreis, Bulgur, Couscous) (70 Rezepte)
    # -------------------------------------------------------------------------
    grains = [
        ("Quinoa", 60, "g", "Trockensortiment", [], "Quinoa gründlich heiß abspülen, um Bitterstoffe zu entfernen", 14),
        ("Naturreis", 60, "g", "Trockensortiment", [], "Naturreis kalt abbrausen", 22),
        ("Bulgur", 60, "g", "Trockensortiment", ["gluten"], "Bulgur in eine Schale geben", 10),
        ("Couscous", 60, "g", "Trockensortiment", ["gluten"], "Couscous abmessen", 5),
    ]
    proteins = [
        ("Hähnchenbrust", 130, "g", "Geflügel", [], "Hähnchenbrustfilet trocken tupfen und in mundgerechte Streifen schneiden", "Hähnchenstreifen in heißem Öl ca. 5–6 Minuten rundherum goldbraun anbraten", 6, ["omnivore", "high_protein"]),
        ("Putenbrustfilet", 130, "g", "Geflügel", [], "Putenbrust trocken tupfen und würfeln", "Putenwürfel in der Pfanne 5 Minuten saftig anbraten", 5, ["omnivore", "high_protein"]),
        ("Bio-Naturtofu", 140, "g", "Kühlregal", ["soja"], "Tofu trocken pressen und in 1,5 cm Würfel schneiden", "Tofuwürfel in 1 TL Öl 5 Minuten kross anbraten", 5, ["vegetarian", "vegan", "high_protein"]),
        ("Räuchertofu", 130, "g", "Kühlregal", ["soja"], "Räuchertofu würfeln", "Räuchertofuwürfel 4 Minuten knusprig anbraten", 4, ["vegetarian", "vegan", "high_protein"]),
        ("Kichererbsen Dose", 140, "g", "Konserven", [], "Kichererbsen im Sieb kalt abspülen und abtropfen lassen", "Kichererbsen kurz in der Pfanne mitschwenken und erwärmen", 3, ["vegetarian", "vegan"]),
        ("Lachsfilet", 120, "g", "Fisch & Meeresfrüchte", ["fisch"], "Lachsfilet trocken tupfen und in ca. 2 cm Würfel schneiden", "Lachswürfel 3–4 Minuten von allen Seiten sanft braten", 4, ["pescetarian", "high_protein"]),
        ("Feta", 60, "g", "Kühlregal", ["laktose"], "Feta in mundgerechte Würfel schneiden", "Feta kalt über die Bowl bröseln", 0, ["vegetarian"]),
    ]
    veggies = [
        ("Brokkoli", 80, "g", "Obst & Gemüse", "Brokkoli in kleine Röschen teilen", "Brokkoli 3–4 Minuten bissfest blanchieren"),
        ("Zucchini", 80, "g", "Obst & Gemüse", "Zucchini in Scheiben schneiden", "Zucchini 3 Minuten in der Pfanne anbraten"),
        ("Paprika rot", 70, "g", "Obst & Gemüse", "Paprika entkernen und in Streifen schneiden", "Paprika 3 Minuten knackig anschwitzen"),
        ("Karotten", 60, "g", "Obst & Gemüse", "Karotte schälen und raspeln", "Karottenraspeln frisch belassen"),
        ("Kirschtomaten", 70, "g", "Obst & Gemüse", "Kirschtomaten waschen und halbieren", "Tomatenhälften frisch zugeben"),
        ("Babyspinat", 40, "g", "Obst & Gemüse", "Babyspinat waschen und trocken schleudern", "Spinat als frisches Bett auslegen"),
    ]

    b_count = 0
    while b_count < 70:
        g_name, g_amt, g_unit, g_cat, g_algs, g_prep, g_cook = grains[b_count % len(grains)]
        p_name, p_amt, p_unit, p_cat, p_algs, p_prep, p_cook, p_time, p_diets = proteins[b_count % len(proteins)]
        v_name, v_amt, v_unit, v_cat, v_prep, v_c_step = veggies[b_count % len(veggies)]
        b_count += 1

        title = get_unique_title(f"{g_name}-Bowl mit {p_name} & {v_name}")
        algs = list(set(g_algs + p_algs))
        diets = list(set(["clean_eating"] + p_diets))

        ings = [
            make_ing(g_name, g_amt, g_unit, g_cat, b_count),
            make_ing(p_name, p_amt, p_unit, p_cat, b_count + 1),
            make_ing(v_name, v_amt, v_unit, v_cat, b_count + 2),
            make_ing("Olivenöl", 10, "ml", "Öle & Fette", b_count + 3),
            make_ing("Zitrone", 15, "g", "Obst & Gemüse", b_count + 4),
        ]

        prep_steps = [
            f"{g_prep}.",
            f"{p_prep}.",
            f"{v_prep}.",
            "Zitrone heiß abwaschen und 1 EL Saft für das Dressing auspressen.",
        ]
        cooking_steps = [
            f"{g_name} in kochendem Salzwasser ca. {g_cook} Minuten zubereiten, bis das Korn gar ist, dann ausdampfen lassen.",
            f"{p_cook}.",
            f"{v_c_step}.",
            "Olivenöl mit frischem Zitronensaft, Meersalz und Pfeffer zu einem schnellen Dressing verrühren.",
            f"Den {g_name} mit {p_name} und {v_name} dekorativ in der Meal-Prep-Schale anrichten und mit dem Dressing beträufeln.",
        ]
        lunchbox_tips = [
            "Warme Komponenten vollständig abkühlen lassen, bevor die Dose verschlossen wird.",
            "Dressing in einem separaten Schraubdöschen transportieren und erst vor Ort untermischen.",
            "Im Kühlschrank bei 4–7°C verschlossen 2–3 Tage haltbar.",
        ]
        instructions = [
            f"{g_name} nach Packungsanweisung gar kochen.",
            f"{p_name} und {v_name} vorbereiten.",
            f"{p_name} in der Pfanne braten bzw. vorbereiten.",
            "Dressing aus Olivenöl, Zitronensaft, Salz und Pfeffer anrühren.",
            "Alle Zutaten als Bowl anrichten und mit Dressing servieren.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-lu-{cur_id}",
            title=title,
            meal_type="lunch_lunchbox",
            prep_min=10,
            cook_min=max(g_cook, p_time),
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=480 + (b_count % 5) * 15,
            prot=28 + (b_count % 4) * 3,
            carbs=52 + (b_count % 5) * 2,
            fat=15 + (b_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Lunch-Bowl", "Meal-Prep", "Gesund", "Frisch"],
            image_key="bowl"
        ))
        cur_id += 1

    # -------------------------------------------------------------------------
    # ARCHETYPE 2: Vollkorn-Wraps & Rollen (60 Rezepte)
    # -------------------------------------------------------------------------
    wrap_proteins = [
        ("Hähnchenbrust", 120, "g", "Geflügel", [], "Hähnchenbrust in feine Streifen schneiden", "Hähnchenstreifen in 1 TL Öl 5 Minuten goldbraun braten", 5, ["omnivore", "high_protein"]),
        ("Putenbrust Aufschnitt", 70, "g", "Kühlregal", [], "Putenbrust bereitlegen", "Putenbrust flach auflegen", 0, ["omnivore"]),
        ("Thunfisch Dose", 90, "g", "Konserven", ["fisch"], "Thunfisch abgießen und mit der Gabel zerpflücken", "Thunfisch gleichmäßig verteilen", 0, ["pescetarian", "high_protein"]),
        ("Kichererbsen Dose", 120, "g", "Konserven", [], "Kichererbsen abspülen und mit der Gabel leicht anquetschen", "Kichererbsen kurz anbraten", 3, ["vegetarian", "vegan"]),
        ("Räuchertofu", 100, "g", "Kühlregal", ["soja"], "Räuchertofu in dünne Streifen schneiden", "Tofustreifen 4 Minuten anbraten", 4, ["vegetarian", "vegan", "high_protein"]),
        ("Feta", 60, "g", "Kühlregal", ["laktose"], "Feta in Streifen schneiden", "Feta auflegen", 0, ["vegetarian"]),
        ("Eier Bio", 1, "Stück", "Eier & Hefe", ["eier"], "Ei bereitstellen", "Ei in 7,5 Minuten wachsweich kochen, pellen und in Scheiben teilen", 8, ["vegetarian"]),
    ]
    wrap_spreads = [
        ("Frischkäse", 30, "g", ["laktose"], "Kühlregal"),
        ("Avocado", 50, "g", [], "Obst & Gemüse"),
        ("Körniger Frischkäse", 60, "g", ["laktose"], "Kühlregal"),
        ("Tahini", 20, "g", ["sesam"], "Trockensortiment"),
    ]
    wrap_greens = [
        ("Babyspinat", 30, "g", "Obst & Gemüse"),
        ("Rucola", 30, "g", "Obst & Gemüse"),
        ("Gurke", 50, "g", "Obst & Gemüse"),
        ("Tomaten", 50, "g", "Obst & Gemüse"),
    ]

    w_count = 0
    while w_count < 60:
        wp_name, wp_amt, wp_unit, wp_cat, wp_algs, wp_prep, wp_cook, wp_time, wp_diets = wrap_proteins[w_count % len(wrap_proteins)]
        ws_name, ws_amt, ws_unit, ws_algs, ws_cat = wrap_spreads[w_count % len(wrap_spreads)]
        wg_name, wg_amt, wg_unit, wg_cat = wrap_greens[w_count % len(wrap_greens)]
        w_count += 1

        title = get_unique_title(f"Vollkorn-Wrap mit {wp_name}, {ws_name} & {wg_name}")
        algs = list(set(["gluten"] + wp_algs + ws_algs))
        diets = list(set(["clean_eating"] + wp_diets))

        ings = [
            make_ing("Vollkorn-Wraps", 1, "Stück", "Brot & Backwaren", w_count),
            make_ing(wp_name, wp_amt, wp_unit, wp_cat, w_count + 1),
            make_ing(ws_name, ws_amt, ws_unit, ws_cat, w_count + 2),
            make_ing(wg_name, wg_amt, wg_unit, wg_cat, w_count + 3),
        ]

        prep_steps = [
            f"{wp_prep}.",
            f"{wg_name} gründlich waschen und trocken tupfen bzw. schneiden.",
            f"{ws_name} bereitstellen und Vollkorn-Wrap auf ein großes Brett legen.",
        ]
        cooking_steps = [
            f"{wp_cook}.",
            "Den Vollkorn-Wrap in einer heißen Pfanne ohne Fett ca. 15 Sekunden erwärmen, bis er geschmeidig wird.",
            f"Die Oberfläche gleichmäßig mit {ws_name} bestreichen, dabei an den Rändern 2 cm frei lassen.",
            f"Mit {wp_name} und {wg_name} belegen und mit Meersalz und Pfeffer würzen.",
            "Die Seitenränder fest einklappen und von unten nach oben straff zu einer stabilen Rolle wickeln.",
        ]
        lunchbox_tips = [
            "In Butterbrotpapier wickeln und diagonal halbieren – das fixiert die Form.",
            "Gemüse vor dem Einrollen gut abtropfen lassen, damit der Wrap nicht durchweicht.",
            "Im Kühlschrank bis zu 24 Stunden haltbar.",
        ]
        instructions = [
            f"{wp_name} vorbereiten und garen.",
            f"{wg_name} waschen und schneiden.",
            "Wrap kurz erwärmen und mit Aufstrich versehen.",
            "Mit Protein und Gemüse belegen.",
            "Fest zusammenrollen, halbieren und einpacken.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-lu-{cur_id}",
            title=title,
            meal_type="lunch_lunchbox",
            prep_min=8,
            cook_min=wp_time,
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=420 + (w_count % 5) * 15,
            prot=24 + (w_count % 4) * 3,
            carbs=46 + (w_count % 5) * 2,
            fat=14 + (w_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Wrap", "Handlich", "To-Go", "Lunch"],
            image_key="wrap"
        ))
        cur_id += 1

    # -------------------------------------------------------------------------
    # ARCHETYPE 3: Nudelsalate & Frische Protein-Salate (65 Rezepte)
    # -------------------------------------------------------------------------
    salad_bases = [
        ("Vollkornnudeln", 70, "g", "Trockensortiment", ["gluten"], "in kochendem Salzwasser 8–9 Minuten al dente kochen", 9),
        ("Kichererbsen Dose", 150, "g", "Konserven", [], "im Sieb gründlich kalt abspülen", 0),
        ("Rote Linsen", 70, "g", "Trockensortiment", [], "in leichtem Salzwasser 9–10 Minuten bissfest köcheln", 10),
        ("Kartoffeln", 220, "g", "Obst & Gemüse", [], "in 2 cm Würfel schneiden und in Salzwasser 14 Minuten garen", 14),
        ("Feldsalat", 80, "g", "Obst & Gemüse", [], "gründlich waschen und sehr gut trocken schleudern", 0),
    ]
    salad_proteins = [
        ("Mozzarella", 70, "g", ["laktose"], "Kühlregal", "in mundgerechte Würfel schneiden", ["vegetarian"]),
        ("Feta", 60, "g", ["laktose"], "Kühlregal", "mit den Händen zerbröseln", ["vegetarian"]),
        ("Eier Bio", 1, "Stück", ["eier"], "Eier & Hefe", "7,5 Minuten kochen und vierteln", ["vegetarian"]),
        ("Thunfisch Dose", 80, "g", ["fisch"], "Konserven", "abgießen und zerpflücken", ["pescetarian", "high_protein"]),
        ("Putenbrustfilet", 120, "g", [], "Geflügel", "in Streifen 5 Minuten anbraten", ["omnivore", "high_protein"]),
    ]

    s_count = 0
    while s_count < 65:
        sb_name, sb_amt, sb_unit, sb_cat, sb_algs, sb_cook_desc, sb_time = salad_bases[s_count % len(salad_bases)]
        sp_name, sp_amt, sp_unit, sp_algs, sp_cat, sp_prep_desc, sp_diets = salad_proteins[s_count % len(salad_proteins)]
        v_name, v_amt, v_unit, v_cat, v_prep, _ = veggies[s_count % len(veggies)]
        s_count += 1

        title = get_unique_title(f"{sb_name}-Salat mit {sp_name} & {v_name}")
        algs = list(set(sb_algs + sp_algs))
        diets = list(set(["clean_eating"] + sp_diets))

        ings = [
            make_ing(sb_name, sb_amt, sb_unit, sb_cat, s_count),
            make_ing(sp_name, sp_amt, sp_unit, sp_cat, s_count + 1),
            make_ing(v_name, v_amt, v_unit, v_cat, s_count + 2),
            make_ing("Olivenöl", 10, "ml", "Öle & Fette", s_count + 3),
            make_ing("Essig Balsamico", 10, "ml", "Essig & Öl", s_count + 4),
        ]

        prep_steps = [
            f"{sb_name} bereitstellen bzw. vorbereiten.",
            f"{sp_name} {sp_prep_desc}.",
            f"{v_prep}.",
            "Olivenöl mit Balsamico-Essig, Meersalz und Pfeffer zu einem homogenen Dressing verquirlen.",
        ]
        cooking_steps = [
            f"{sb_name} {sb_cook_desc} und anschließend ausdampfen lassen." if sb_time > 0 else f"{sb_name} in eine große Salatschüssel geben.",
            f"{sp_name} vorbereiten und zugeben.",
            f"{v_name} untermischen.",
            "Das Dressing darübergießen und den Salat behutsam vermengen.",
            "Mit frischen Kräutern vollenden und in die Box füllen.",
        ]
        lunchbox_tips = [
            "Salat schmeckt nach einigen Stunden Durchziehen im Kühlschrank besonders aromatisch.",
            "Dressing bei Bedarf separat mitnehmen, damit der Salat knackig bleibt.",
            "Im Kühlschrank 2–3 Tage haltbar.",
        ]
        instructions = [
            f"{sb_name} falls nötig kochen und abkühlen lassen.",
            f"{sp_name} und {v_name} vorbereiten.",
            "Dressing aus Olivenöl und Balsamico anrühren.",
            "Alle Komponenten vermengen und abschmecken.",
            "In die Lunchbox füllen und servieren.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-lu-{cur_id}",
            title=title,
            meal_type="lunch_lunchbox",
            prep_min=10,
            cook_min=sb_time,
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=450 + (s_count % 5) * 15,
            prot=22 + (s_count % 4) * 3,
            carbs=48 + (s_count % 5) * 2,
            fat=16 + (s_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Salat", "Meal-Prep", "Frisch", "Knackig"],
            image_key="salad"
        ))
        cur_id += 1

    # -------------------------------------------------------------------------
    # ARCHETYPE 4: Wärmende Suppen & Eintöpfe (65 Rezepte)
    # -------------------------------------------------------------------------
    soup_bases = [
        ("Rote Linsen", 80, "g", "Trockensortiment", "Rote Linsen im Sieb kalt abbrausen"),
        ("Kichererbsen Dose", 160, "g", "Konserven", "Kichererbsen abspülen und abtropfen lassen"),
        ("Süßkartoffeln", 200, "g", "Obst & Gemüse", "Süßkartoffeln schälen und in 1 cm Würfel schneiden"),
        ("Kartoffeln", 220, "g", "Obst & Gemüse", "Kartoffeln schälen und würfeln"),
    ]
    soup_veggies = [
        ("Karotten", 80, "g", "Obst & Gemüse", "Karotten schälen und in Scheiben schneiden"),
        ("Lauch", 80, "g", "Obst & Gemüse", "Lauch waschen und in Ringe schneiden"),
        ("Babyspinat", 60, "g", "Obst & Gemüse", "Babyspinat waschen und schleudern"),
        ("Zucchini", 80, "g", "Obst & Gemüse", "Zucchini in Würfel schneiden"),
    ]
    soup_liquids = [
        ("Kokosmilch", 80, "ml", "Konserven", "Kokosmilch abmessen"),
        ("Dosentomaten", 150, "g", "Konserven", "Dosentomaten öffnen"),
    ]

    so_count = 0
    while so_count < 65:
        sb_name, sb_amt, sb_unit, sb_cat, sb_prep = soup_bases[so_count % len(soup_bases)]
        sv_name, sv_amt, sv_unit, sv_cat, sv_prep = soup_veggies[so_count % len(soup_veggies)]
        sl_name, sl_amt, sl_unit, sl_cat, sl_prep = soup_liquids[so_count % len(soup_liquids)]
        so_count += 1

        title = get_unique_title(f"Wärmender {sb_name}-Eintopf mit {sv_name} & {sl_name}")
        algs = []
        diets = ["vegetarian", "vegan", "clean_eating"]

        ings = [
            make_ing(sb_name, sb_amt, sb_unit, sb_cat, so_count),
            make_ing(sv_name, sv_amt, sv_unit, sv_cat, so_count + 1),
            make_ing(sl_name, sl_amt, sl_unit, sl_cat, so_count + 2),
            make_ing("Zwiebeln", 40, "g", "Obst & Gemüse", so_count + 3),
            make_ing("Currypulver", 3, "g", "Gewürze", so_count + 4),
        ]

        prep_steps = [
            f"{sb_prep}.",
            f"{sv_prep}.",
            "Zwiebeln abziehen und fein würfeln; Gewürze bereitstellen.",
        ]
        cooking_steps = [
            "1 TL Öl in einem Topf bei mittlerer Hitze erwärmen und die Zwiebeln 3 Minuten glasig anschwitzen.",
            "Currypulver einrühren und 30 Sekunden anrösten, bis es aromatisch duftet.",
            f"{sb_name}, {sv_name} und ca. 250 ml Wasser oder Brühe zufügen und aufkochen.",
            "Bei geringer Hitze 15 Minuten sanft köcheln lassen, bis alles weich ist.",
            f"{sl_name} einrühren, mit Meersalz und Pfeffer abschmecken und kurz sämig ziehen lassen.",
        ]
        lunchbox_tips = [
            "In einem Thermo-Speisegefäß transportiert bleibt der Eintopf bis mittags dampfend heiß.",
            "Eintöpfe schmecken aufgewärmt am zweiten Tag oft noch runder.",
            "Im Kühlschrank verschlossen 3–4 Tage haltbar.",
        ]
        instructions = [
            "Gemüse und Basis zerkleinern bzw. vorbereiten.",
            "Zwiebeln anschwitzen und Gewürze anrösten.",
            "Mit Wasser aufgießen und 15 Minuten weich köcheln.",
            f"{sl_name} zugeben und sämig binden.",
            "Abschmecken und in den Thermobehälter füllen.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-lu-{cur_id}",
            title=title,
            meal_type="lunch_lunchbox",
            prep_min=10,
            cook_min=18,
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=420 + (so_count % 5) * 15,
            prot=18 + (so_count % 4) * 2,
            carbs=54 + (so_count % 5) * 2,
            fat=12 + (so_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Suppe", "Eintopf", "Warm", "Vegan"],
            image_key="soup"
        ))
        cur_id += 1

    # -------------------------------------------------------------------------
    # ARCHETYPE 5: Schnelle Pfannen- & Wokgerichte (65 Rezepte)
    # -------------------------------------------------------------------------
    wok_bases = [
        ("Naturreis", 60, "g", "Trockensortiment", [], 22),
        ("Vollkornnudeln", 70, "g", "Trockensortiment", ["gluten"], 9),
        ("Bulgur", 60, "g", "Trockensortiment", ["gluten"], 10),
    ]
    wok_proteins = [
        ("Hähnchenbrust", 130, "g", "Geflügel", [], ["omnivore", "high_protein"]),
        ("Putenbrustfilet", 130, "g", "Geflügel", [], ["omnivore", "high_protein"]),
        ("Bio-Naturtofu", 140, "g", "Kühlregal", ["soja"], ["vegetarian", "vegan", "high_protein"]),
        ("Rinderhack", 110, "g", "Fleisch", [], ["omnivore", "high_protein"]),
        ("Garnelen", 120, "g", "Fisch & Meeresfrüchte", ["krebstiere"], ["pescetarian", "high_protein"]),
    ]
    wok_veggies = [
        ("Brokkoli", 80, "g", "Brokkoli in mundgerechte Röschen schneiden"),
        ("Paprika rot", 80, "g", "Paprika entkernen und in feine Streifen schneiden"),
        ("Zuckerschoten", 70, "g", "Zuckerschoten waschen und schräg halbieren"),
        ("TK Erbsen", 60, "g", "Erbsen kurz mit warmem Wasser antauen"),
    ]

    wk_count = 0
    while wk_count < 65:
        wb_name, wb_amt, wb_unit, wb_cat, wb_algs, wb_time = wok_bases[wk_count % len(wok_bases)]
        wp_name, wp_amt, wp_unit, wp_cat, wp_algs, wp_diets = wok_proteins[wk_count % len(wok_proteins)]
        wv_name, wv_amt, wv_unit, wv_prep = wok_veggies[wk_count % len(wok_veggies)]
        wk_count += 1

        title = get_unique_title(f"Wok-Pfanne mit {wp_name}, {wv_name} & {wb_name}")
        algs = list(set(wb_algs + wp_algs + ["soja"]))
        diets = list(set(["clean_eating"] + wp_diets))

        ings = [
            make_ing(wb_name, wb_amt, wb_unit, wb_cat, wk_count),
            make_ing(wp_name, wp_amt, wp_unit, wp_cat, wk_count + 1),
            make_ing(wv_name, wv_amt, wv_unit, "Obst & Gemüse", wk_count + 2),
            make_ing("Sojasoße", 15, "ml", "Würzsaucen", wk_count + 3),
            make_ing("Rapsöl", 8, "ml", "Öle & Fette", wk_count + 4),
        ]

        prep_steps = [
            f"{wb_name} vorbereiten und garen.",
            f"{wp_name} trocken tupfen und in mundgerechte Stücke schneiden.",
            f"{wv_prep}.",
            "Sojasoße und Rapsöl bereitstellen.",
        ]
        cooking_steps = [
            f"{wb_name} in leichtem Salzwasser ca. {wb_time} Minuten gar kochen.",
            f"1 TL Rapsöl im Wok oder einer großen Pfanne bei starker Hitze erhitzen und {wp_name} 4–5 Minuten scharf anbraten.",
            f"{wv_name} dazugeben und 3 Minuten unter Rühren knackig pfannenrühren.",
            f"Den gegarten {wb_name} hineingeben und mit Sojasoße ablöschen.",
            "Alles 1 Minute durchschwenken, mit Pfeffer abschmecken und in die Box füllen.",
        ]
        lunchbox_tips = [
            "Vor dem Verschließen der Dose auskühlen lassen, um Feuchtigkeitsstau zu vermeiden.",
            "Schmeckt aufgewärmt in der Mikrowelle bei 600 W in 2,5 Minuten wie frisch aus dem Wok.",
            "Im Kühlschrank 3 Tage haltbar.",
        ]
        instructions = [
            f"{wb_name} vorkochen.",
            f"{wp_name} und {wv_name} schneiden.",
            f"{wp_name} in heißem Öl anbraten.",
            f"{wv_name} knackig mitbraten und {wb_name} unterheben.",
            "Mit Sojasoße ablöschen und servieren.",
        ]

        recipes.append(create_recipe(
            r_id=f"uni-lu-{cur_id}",
            title=title,
            meal_type="lunch_lunchbox",
            prep_min=10,
            cook_min=15,
            difficulty="Einfach",
            lunchbox_ready=True,
            cals=490 + (wk_count % 5) * 15,
            prot=28 + (wk_count % 4) * 3,
            carbs=50 + (wk_count % 5) * 2,
            fat=14 + (wk_count % 3) * 2,
            allergens=algs,
            diet_types=diets,
            ingredients=ings,
            instructions=instructions,
            prep_steps=prep_steps,
            cooking_steps=cooking_steps,
            lunchbox_tips=lunchbox_tips,
            tags=["Wok", "Pfannengericht", "Schnell", "Proteinreich"],
            image_key="bowl"
        ))
        cur_id += 1

    print(f"Generated {len(recipes)} extended lunch recipes (from uni-lu-{start_idx} to uni-lu-{cur_id-1}).")
    return recipes
