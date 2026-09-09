"""
Family Chore & Age-Appropriate Work Delegation Engine (Küchen-Ämtli).
Distributes cooking, lunchbox, and kitchen tasks fairly among family members
based on their age and developmental stage, with gamified Vital-Stars reward system.
"""

from typing import List, Dict, Any, Optional, Tuple
from backend.models import FamilyMember, FamilyChore, DayPlan
from backend.health.vitality_engine import get_age_group, get_role_title

# In-memory store for active chores
_active_chores: List[FamilyChore] = []


CHORE_TEMPLATES_BY_AGE = {
    "mini": [
        {
            "title": "🍅 Kirschtomaten & Beeren waschen",
            "desc": "Kalt abbrausen im Sieb und vorsichtig in das Snack-Schälchen legen.",
            "min_age": 3,
            "difficulty": "easy",
            "points": 10,
            "meal_type": "lunch",
            "icon": "🍅"
        },
        {
            "title": "🧻 Bunte Servietten auf den Tisch legen",
            "desc": "Für jedes Familienmitglied eine Serviette an den Platz legen.",
            "min_age": 3,
            "difficulty": "easy",
            "points": 5,
            "meal_type": "dinner",
            "icon": "🧻"
        },
        {
            "title": "🥬 Frischen Salat mit den Händen zupfen",
            "desc": "Salatblätter vorsichtig in mundgerechte Stücke zerreißen.",
            "min_age": 4,
            "difficulty": "easy",
            "points": 10,
            "meal_type": "dinner",
            "icon": "🥬"
        }
    ],
    "kid": [
        {
            "title": "🍽️ Tisch für alle decken",
            "desc": "Teller, Gabeln und Gläser für die Familie an den Tisch stellen.",
            "min_age": 6,
            "difficulty": "easy",
            "points": 10,
            "meal_type": "dinner",
            "icon": "🍽️"
        },
        {
            "title": "💧 Frische Wassergläser einschenken",
            "desc": "Jedem Familienmitglied ein volles Glas Wasser zur Mahlzeit einschenken.",
            "min_age": 6,
            "difficulty": "easy",
            "points": 10,
            "meal_type": "general",
            "icon": "💧"
        },
        {
            "title": "🥣 Haferflocken & Chiasamen abmessen",
            "desc": "Mit dem Messbecher die Haferflocken für das Müsli/Overnight-Oats abfüllen.",
            "min_age": 7,
            "difficulty": "easy",
            "points": 10,
            "meal_type": "breakfast",
            "icon": "🥣"
        },
        {
            "title": "🥒 Gurke & Möhren schälen",
            "desc": "Mit dem kinderfreundlichen Sparschäler das Gemüse fürs Abendessen vorbereiten.",
            "min_age": 8,
            "difficulty": "medium",
            "points": 15,
            "meal_type": "dinner",
            "icon": "🥒"
        },
        {
            "title": "🥪 Eigene Brotdose to-go befüllen",
            "desc": "Vorbereitete Snackdosen und Brote in den Rucksack packen.",
            "min_age": 7,
            "difficulty": "easy",
            "points": 15,
            "meal_type": "lunch",
            "icon": "🥪"
        }
    ],
    "teen": [
        {
            "title": "🔪 Gemüse würfeln & auf dem Brett schneiden",
            "desc": "Paprika, Zucchini oder Champignons gleichmäßig zerkleinern.",
            "min_age": 10,
            "difficulty": "medium",
            "points": 15,
            "meal_type": "dinner",
            "icon": "🔪"
        },
        {
            "title": "🍳 Pfanne unter Aufsicht umrühren",
            "desc": "Mit dem Holzlöffel das Gemüse in der Pfanne schwenken und wenden.",
            "min_age": 11,
            "difficulty": "medium",
            "points": 15,
            "meal_type": "dinner",
            "icon": "🍳"
        },
        {
            "title": "🎒 Schul-Lunchbox eigenständig fertigstellen",
            "desc": "Vollkornbrot schmieren, Rohkost einpacken, Trinkflasche auffüllen.",
            "min_age": 10,
            "difficulty": "medium",
            "points": 20,
            "meal_type": "lunch",
            "icon": "🎒"
        },
        {
            "title": "🛒 Einkäufe in Kühlschrank & Vorrat sortieren",
            "desc": "Frischeartikel nach FIFO-Regel (First In, First Out) einräumen.",
            "min_age": 10,
            "difficulty": "medium",
            "points": 15,
            "meal_type": "general",
            "icon": "🛒"
        },
        {
            "title": "✨ Geschirrspüler nach dem Essen einräumen",
            "desc": "Teller abspülen und sauber in die Spülmaschine stellen.",
            "min_age": 10,
            "difficulty": "easy",
            "points": 10,
            "meal_type": "dinner",
            "icon": "✨"
        }
    ],
    "junior": [
        {
            "title": "👨‍🍳 Mahlzeit eigenständig zubereiten",
            "desc": "Ein One-Pan Gericht oder Ofengemüse nach FitPlaner Rezeptur kochen.",
            "min_age": 15,
            "difficulty": "chef",
            "points": 25,
            "meal_type": "dinner",
            "icon": "👨‍🍳"
        },
        {
            "title": "🚗 Frische-Pick auf dem Heimweg mitnehmen",
            "desc": "Nach Schule oder Sport den frischen Fisch/Salat im Markt einpacken.",
            "min_age": 15,
            "difficulty": "medium",
            "points": 20,
            "meal_type": "general",
            "icon": "🚗"
        },
        {
            "title": "🌙 Vorabend-Trick: Müsli & Dosen ansetzen",
            "desc": "Overnight-Oats für alle Familienmitglieder im Kühlschrank bereitstellen.",
            "min_age": 15,
            "difficulty": "medium",
            "points": 20,
            "meal_type": "prep",
            "icon": "🌙"
        }
    ],
    "adult": [
        {
            "title": "🔥 Chef-Mentor: Heiße Pfanne & Koordination",
            "desc": "Fleisch/Fisch braten, Garzeiten überwachen, Tellertrick-Kellen portionieren.",
            "min_age": 18,
            "difficulty": "chef",
            "points": 15,
            "meal_type": "dinner",
            "icon": "🔥"
        },
        {
            "title": "🛍️ Wocheneinkauf & Vorrats-Inventur",
            "desc": "Haupt-Einkauf anhand der sortierten FitPlaner Laufweg-Liste erledigen.",
            "min_age": 18,
            "difficulty": "medium",
            "points": 20,
            "meal_type": "general",
            "icon": "🛍️"
        }
    ]
}


def generate_daily_chores(
    members: List[FamilyMember],
    day_index: int,
    day_plan: Optional[DayPlan] = None
) -> List[FamilyChore]:
    """
    Generates a tailored, age-appropriate list of daily tasks for all family members.
    Distributes tasks fairly across kids, teens, and adults.
    """
    global _active_chores

    # If we already have active chores for today, preserve completion state
    completed_map = {c.id: (c.is_completed, c.completed_by_name) for c in _active_chores}

    new_chores: List[FamilyChore] = []
    chore_idx = 0

    if not members:
        # Fallback dummy adult
        dummy_adult = FamilyMember(
            id="mem-default",
            name="Familien-Chef",
            gender="male",
            age=35,
            height_cm=180,
            weight_kg=75,
            activity_level="moderate",
            goal="maintain"
        )
        members = [dummy_adult]

    # Assign 1 to 2 tasks per member according to their age group
    for member in members:
        ag = get_age_group(member.age)
        templates = CHORE_TEMPLATES_BY_AGE.get(ag, CHORE_TEMPLATES_BY_AGE["adult"])

        # Pick 1-2 distinct templates for this member based on day_index
        count = min(2, len(templates))
        for i in range(count):
            tpl = templates[(day_index + i) % len(templates)]
            chore_id = f"chore-d{day_index}-{member.id}-{i}"
            is_done, done_by = completed_map.get(chore_id, (False, None))

            chore = FamilyChore(
                id=chore_id,
                title=tpl["title"],
                description=tpl["desc"],
                assigned_member_id=member.id,
                assigned_member_name=member.name,
                age_group=ag,
                min_age=tpl["min_age"],
                difficulty=tpl["difficulty"],
                points=tpl["points"],
                meal_type=tpl["meal_type"],
                day_index=day_index,
                is_completed=is_done,
                completed_by_name=done_by or (member.name if is_done else None),
                icon=tpl["icon"]
            )
            new_chores.append(chore)
            chore_idx += 1

    _active_chores = new_chores
    return _active_chores


def get_current_chores() -> List[FamilyChore]:
    """Returns currently loaded chores."""
    return _active_chores


def toggle_chore(chore_id: str, is_completed: bool, members: List[FamilyMember]) -> Tuple[Optional[FamilyChore], int]:
    """
    Toggles completion state of a chore and updates the assigned member's star points.
    Returns (updated_chore, points_delta).
    """
    global _active_chores
    points_delta = 0
    found_chore = None

    for c in _active_chores:
        if c.id == chore_id:
            old_state = c.is_completed
            c.is_completed = is_completed
            found_chore = c

            if is_completed and not old_state:
                points_delta = c.points
                c.completed_by_name = c.assigned_member_name
            elif not is_completed and old_state:
                points_delta = -c.points
                c.completed_by_name = None

            # Update assigned member's points
            if c.assigned_member_id:
                for m in members:
                    if m.id == c.assigned_member_id:
                        m.chore_points = max(0, getattr(m, "chore_points", 0) + points_delta)
                        break
            break

    return found_chore, points_delta
