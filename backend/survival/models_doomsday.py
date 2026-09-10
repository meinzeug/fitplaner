"""
Pydantic models for the FitPlaner Doomsday & Breakout Survival Mode.
Provides structured models for wild edible substitutes, toxic lookalikes,
survival guides, and emergency triage.
"""

from enum import Enum
from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class SupermarketCategory(str, Enum):
    SPINAT_KOCHGEMUESE = "Spinat & Kochgemüse"
    SALAT_BLATTGEMUESE = "Salat & Blattgemüse"
    MEHL_GETREIDE = "Mehl, Getreide & Stärke"
    KARTOFFELN_WURZELN = "Kartoffeln & Wurzelgemüse"
    FLEISCH_PROTEIN = "Fleisch & Eiweiß"
    SPEISEOEL_FETTE = "Speiseöl & Fette"
    ZITRONE_VITAMINC = "Zitrone & Vitamin C"
    ZUCKER_SUESSE = "Zucker & Süße"
    KAFFEE_TEE = "Kaffee & Tee"
    GEWUERZE_SALZ = "Gewürze & Salz"


class HabitatType(str, Enum):
    WALD = "Wald & Waldrand"
    WIESE = "Wiese & Weide"
    GEWAESSER = "Gewässerrand & Feuchtgebiet"
    RUDERAL = "Ruderalflur, Wegrand & Schutt"
    GARTEN = "Garten & Ackerunkraut"


class PlantPart(str, Enum):
    LEAVES = "Blätter / junge Triebe"
    ROOT = "Wurzel / Rhizom / Knolle"
    SEEDS = "Samen / Nüsse"
    FLOWERS = "Blüten / Pollen"
    FRUIT = "Früchte / Beeren"
    MUSHROOM_BODY = "Fruchtkörper (Pilz)"
    SAP = "Baumsaft"
    ASH = "Pflanzenasche"


class PreparationMethod(str, Enum):
    RAW_SAFE = "Roh verzehrbar (gründlich waschen)"
    COOKING_REQUIRED = "Muss gekocht werden (mind. 10-15 Min, zerstört Toxine)"
    LEACHING_TANNINS = "Kalt-/Warmwasser-Entbitterung (Tannine auswaschen)"
    ROASTING_REQUIRED = "Rösten erforderlich (deaktiviert hitzelabile Toxine)"
    DRYING_FERMENTING = "Trocknen / Fermentieren"
    ASH_EXTRACTION = "Verbrennung & wässrige Asche-Auslaugung (Mineralsalz)"


class NutritionalProfile(BaseModel):
    calories_kcal: float
    protein_g: float
    fat_g: float
    carbs_g: float
    fiber_g: float
    key_micronutrients: Dict[str, str]
    supermarket_comparison: str


class LookalikeRisk(BaseModel):
    deadly_lookalike_name_de: str
    deadly_lookalike_botanical: str
    toxin: str
    lethal_danger: str
    distinction_rules: List[str]
    absolute_veto_criterion: str


class ChildSafetyWarning(BaseModel):
    suitable_for_children: bool
    minimum_age_years: int
    toxicological_notes: str
    max_dosage: str


class WildSubstitute(BaseModel):
    id: str
    name_de: str
    name_botanical: str
    replaced_supermarket_item: str
    category: SupermarketCategory
    habitats: List[HabitatType]
    plant_parts_used: List[PlantPart]
    harvest_months: List[int] = Field(description="Monate 1-12")
    identification_features: List[str]
    preparation_methods: List[PreparationMethod]
    preparation_instructions: str
    nutrition_per_100g: NutritionalProfile
    lookalike_risks: List[LookalikeRisk]
    child_safety: ChildSafetyWarning
    survival_storage_days: int
    survival_notes: str


class SurvivalGuideStep(BaseModel):
    step_number: int
    title: str
    description: str
    critical_warning: Optional[str] = None
    timer_seconds: Optional[int] = None


class SurvivalGuideSection(BaseModel):
    id: str
    category: str  # "wasser", "feuer", "shelter", "navigation", "erste_hilfe", "test"
    title: str
    icon_name: str
    subtitle: str
    difficulty: str  # "Lebenswichtig", "Fortgeschritten", "Standard"
    estimated_time: str
    core_materials: List[str]
    steps: List[SurvivalGuideStep]
    scientific_principle: str
    veto_warnings: List[str]
