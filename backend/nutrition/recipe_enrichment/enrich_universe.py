"""
Enrichment script for backend/nutrition/recipes_universe.json.
Loads all 105 recipes, enriches them with detailed culinary steps and lunchbox tips,
validates structure and counts, and saves back to JSON.
"""

import json
import os
from backend.nutrition.recipe_enrichment.breakfast import BREAKFAST_ENRICHMENT
from backend.nutrition.recipe_enrichment.lunch import LUNCH_ENRICHMENT
from backend.nutrition.recipe_enrichment.dinner import DINNER_ENRICHMENT


def enrich_recipes_universe():
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "recipes_universe.json")
    with open(json_path, "r", encoding="utf-8") as f:
        recipes = json.load(f)

    print(f"Read {len(recipes)} recipes from {json_path}")
    
    all_enrichments = {}
    all_enrichments.update(BREAKFAST_ENRICHMENT)
    all_enrichments.update(LUNCH_ENRICHMENT)
    all_enrichments.update(DINNER_ENRICHMENT)

    assert len(all_enrichments) == 105, f"Expected 105 enrichments, got {len(all_enrichments)}"

    enriched_count = 0
    for r in recipes:
        r_id = r["id"]
        if r_id not in all_enrichments:
            raise ValueError(f"Missing enrichment data for recipe {r_id} ({r.get('title')})")

        enr = all_enrichments[r_id]
        
        # Validation of constraints
        prep_steps = enr["prep_steps"]
        cooking_steps = enr["cooking_steps"]
        lunchbox_tips = enr["lunchbox_tips"]
        instructions = enr["instructions"]

        assert 3 <= len(prep_steps) <= 5, f"{r_id}: prep_steps count {len(prep_steps)} not in [3, 5]"
        assert 3 <= len(cooking_steps) <= 6, f"{r_id}: cooking_steps count {len(cooking_steps)} not in [3, 6]"
        assert 2 <= len(lunchbox_tips) <= 4, f"{r_id}: lunchbox_tips count {len(lunchbox_tips)} not in [2, 4]"
        assert 4 <= len(instructions) <= 6, f"{r_id}: instructions count {len(instructions)} not in [4, 6]"

        # Update recipe fields
        r["detailed_instructions"] = {
            "prep_steps": prep_steps,
            "cooking_steps": cooking_steps,
            "lunchbox_tips": lunchbox_tips,
        }
        r["instructions"] = instructions
        enriched_count += 1

    assert enriched_count == 105, f"Expected 105 enriched recipes, got {enriched_count}"

    # Save to recipes_universe.json
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)

    print(f"✅ Successfully enriched all {enriched_count} recipes and saved to {json_path}")


if __name__ == "__main__":
    enrich_recipes_universe()
