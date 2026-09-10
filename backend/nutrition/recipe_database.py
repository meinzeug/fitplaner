"""
Curated healthy recipe database for FitPlaner.
Loaded directly from the curated recipe universe (105 authentic, nutritionally balanced recipes).
"""

from typing import List
from backend.models import Recipe
from backend.nutrition.recipe_universe import get_all_universe_recipes

RECIPES_DATABASE: List[Recipe] = get_all_universe_recipes()
