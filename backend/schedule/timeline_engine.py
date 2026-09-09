"""
timeline_engine.py - Minutengenaue Tages-Regie & Ernährungs-Zeitplaner
100% KI-frei, deterministisch, voll anpassbar.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from backend.models import (
    ScheduleTimeSettings,
    TimelineTask,
    PrepTomorrowSummary,
    DailyTimelineResponse,
    DayPlan,
    FamilyMember,
)


# Global in-memory storage for schedule settings and task completion states
schedule_settings_store = ScheduleTimeSettings()
task_completion_store: Dict[str, bool] = {}


def get_schedule_settings() -> ScheduleTimeSettings:
    return schedule_settings_store


def update_schedule_settings(new_settings: Dict[str, Any]) -> ScheduleTimeSettings:
    global schedule_settings_store
    current_dict = schedule_settings_store.model_dump()
    for k, v in new_settings.items():
        if v is not None and k in current_dict:
            current_dict[k] = v
    schedule_settings_store = ScheduleTimeSettings(**current_dict)
    return schedule_settings_store


def toggle_timeline_task(task_id: str, is_completed: Optional[bool] = None) -> bool:
    global task_completion_store
    if is_completed is None:
        task_completion_store[task_id] = not task_completion_store.get(task_id, False)
    else:
        task_completion_store[task_id] = is_completed
    return task_completion_store[task_id]


def reset_timeline_tasks() -> None:
    global task_completion_store
    task_completion_store.clear()


def parse_time_str(time_str: str) -> tuple[int, int]:
    """Parse 'HH:MM' into (hours, minutes)"""
    parts = time_str.strip().split(":")
    return int(parts[0]), int(parts[1])


def format_time(hours: int, minutes: int) -> str:
    """Format hours and minutes into 'HH:MM' string clamped to 00:00 - 23:59"""
    total_minutes = (hours * 60 + minutes) % (24 * 60)
    h = total_minutes // 60
    m = total_minutes % 60
    return f"{h:02d}:{m:02d}"


def add_minutes_to_time(time_str: str, delta_minutes: int) -> str:
    h, m = parse_time_str(time_str)
    return format_time(h, m + delta_minutes)


def time_to_minutes(time_str: str) -> int:
    h, m = parse_time_str(time_str)
    return h * 60 + m


def generate_daily_timeline(
    today_plan: Optional[DayPlan],
    tomorrow_plan: Optional[DayPlan],
    family_members: List[FamilyMember],
    settings: Optional[ScheduleTimeSettings] = None,
    current_dt: Optional[datetime] = None,
) -> DailyTimelineResponse:
    if settings is None:
        settings = schedule_settings_store
    if current_dt is None:
        current_dt = datetime.now()

    current_time_str = current_dt.strftime("%H:%M")
    current_minutes = time_to_minutes(current_time_str)
    member_names = [m.name for m in family_members] if family_members else ["Dennis", "Sarah"]

    # Today recipes info
    bf_title = today_plan.breakfast.title if today_plan and today_plan.breakfast else "Vollkorn-Müsli & Früchte"
    bf_prep = today_plan.breakfast.prep_time_minutes if today_plan and today_plan.breakfast else 5
    lunch_title = today_plan.lunch.title if today_plan and today_plan.lunch else "Vollkorn-Wrap & Gemüsesticks"
    dinner_title = today_plan.dinner.title if today_plan and today_plan.dinner else "Frische Gemüse-Reispfanne"
    dinner_prep = today_plan.dinner.prep_time_minutes if today_plan and today_plan.dinner else 10
    dinner_cook = today_plan.dinner.cook_time_minutes if today_plan and today_plan.dinner else 15

    # Tomorrow recipes info
    tom_bf_title = tomorrow_plan.breakfast.title if tomorrow_plan and tomorrow_plan.breakfast else "Overnight Oats mit Beeren"
    tom_bf_prep = tomorrow_plan.breakfast.prep_time_minutes if tomorrow_plan and tomorrow_plan.breakfast else 5
    tom_lunch_title = tomorrow_plan.lunch.title if tomorrow_plan and tomorrow_plan.lunch else "Quinoa-Bowl mit Kichererbsen"
    tom_lunch_prep = tomorrow_plan.lunch.prep_time_minutes if tomorrow_plan and tomorrow_plan.lunch else 10

    # Build individual tasks
    tasks: List[TimelineTask] = []

    # 1. Morgen-Start & Wasser
    t_wake = settings.wake_up_time
    tasks.append(TimelineTask(
        id="task-morning-water",
        time_str=t_wake,
        title="☀️ Morgen-Start & Hydration",
        category="water",
        duration_minutes=5,
        description=f"Ein großes Glas lauwarmes Wasser (300-500ml) für {', '.join(member_names)}. Aktiviert den Stoffwechsel nach der Nachtruhe.",
        assigned_members=member_names,
        is_completed=task_completion_store.get("task-morning-water", False),
        tip="Optional mit einer Scheibe Zitrone oder einer Prise Salz für Elektrolyte."
    ))

    # 2. Brotdosen-Grab-and-Go
    t_grab = add_minutes_to_time(t_wake, 15)
    tasks.append(TimelineTask(
        id="task-lunchbox-grab",
        time_str=t_grab,
        title="🎒 Brotdosen einpacken (30 Sek.)",
        category="prep",
        duration_minutes=2,
        description="Die gestern Abend fertig vorbereiteten Brotdosen und Snackboxen aus dem Kühlschrank direkt in Rucksäcke & Taschen packen.",
        assigned_members=member_names,
        is_completed=task_completion_store.get("task-lunchbox-grab", False),
        action_type="toggle_lunchbox",
        tip="Gestern vorbereitet = 0 Minuten Stress am Morgen!"
    ))

    # 3. Frühstück
    t_bf = add_minutes_to_time(t_wake, 30)
    tasks.append(TimelineTask(
        id="task-breakfast-eat",
        time_str=t_bf,
        title=f"🥣 Frühstück: {bf_title}",
        category="meal",
        duration_minutes=max(15, bf_prep + 10),
        description=f"Zubereitung & Verzehr ({bf_prep} Min. Zubereitung). Liefert komplexe Kohlenhydrate und langanhaltende Energie.",
        assigned_members=member_names,
        is_completed=task_completion_store.get("task-breakfast-eat", False),
        action_type="open_recipe",
        recipe_preview={"title": bf_title, "prep_time": bf_prep}
    ))

    # 4. Vormittags-Snack
    t_snack1 = "10:30"
    tasks.append(TimelineTask(
        id="task-morning-snack",
        time_str=t_snack1,
        title="🍎 Vormittags-Snack & Fokus-Booster",
        category="snack",
        duration_minutes=10,
        description="Dennis: Handvoll Mandeln/Walnüsse (Muskel-Fette); Sarah: Knackiger Apfel oder Gurkensticks (Sättigung ohne Kalorienlast).",
        assigned_members=member_names,
        is_completed=task_completion_store.get("task-morning-snack", False),
        tip="Hält den Blutzuckerspiegel stabil und verhindert Heißhunger vor der Mittagspause."
    ))

    # 5. Mittagspause / Brotdose to-go
    t_lunch = settings.lunch_time
    tasks.append(TimelineTask(
        id="task-lunch-eat",
        time_str=t_lunch,
        title=f"🍱 Mittagspause: {lunch_title}",
        category="meal",
        duration_minutes=30,
        description=f"Selbstgemachtes Mittagessen aus der Brotdose. Vollwertig, proteinreich und 100% frei von teuren Kantinen-Zusatzstoffen.",
        assigned_members=member_names,
        is_completed=task_completion_store.get("task-lunch-eat", False),
        action_type="open_recipe",
        recipe_preview={"title": lunch_title}
    ))

    # 6. Nachmittags-Hydration & Power
    t_snack2 = "15:30"
    tasks.append(TimelineTask(
        id="task-afternoon-water",
        time_str=t_snack2,
        title="💧 Nachmittags-Wasser & Mini-Break",
        category="water",
        duration_minutes=5,
        description="500ml Wasser oder ungesüßter Grüntee. Dennis: 150g Magerquark oder Proteinshake; Sarah: Mandarine oder Möhren-Sticks.",
        assigned_members=member_names,
        is_completed=task_completion_store.get("task-afternoon-water", False),
        tip="Überwindet das klassische 15-Uhr-Leistungstief sofort."
    ))

    # 7. Feierabend-Vorausblick & Einkaufs-Alarm
    t_shop_alarm = add_minutes_to_time(settings.work_end_time, -15)
    tasks.append(TimelineTask(
        id="task-store-alert",
        time_str=t_shop_alarm,
        title="⏰ 15 Min. vor Feierabend: Netto/NP Alarm",
        category="fresh_pick",
        duration_minutes=5,
        description="Gleich Feierabend! Auf dem Heimweg 10 Minuten Halt bei Netto/NP für die frischen Zutaten des heutigen Abendessens.",
        assigned_members=member_names[:1],
        is_completed=task_completion_store.get("task-store-alert", False),
        action_type="toggle_fresh_pick",
        tip="Spart Lagerplatz im heimischen Kühlschrank und sorgt für pure Frische."
    ))

    # 8. Frische-Pick im Markt
    t_shop = add_minutes_to_time(settings.work_end_time, 15)
    tasks.append(TimelineTask(
        id="task-store-visit",
        time_str=t_shop,
        title="🛒 Netto / NP Frische-Pick (Just-in-Time)",
        category="fresh_pick",
        duration_minutes=15,
        description="Kurzer Stopp: Frischen Lachs, Fleisch oder knackigen Spinat für das Abendessen mitnehmen. Markt hat bis 20:00 Uhr geöffnet.",
        assigned_members=member_names[:1],
        is_completed=task_completion_store.get("task-store-visit", False),
        action_type="toggle_fresh_pick"
    ))

    # 9. Herd-Regie & Kochen
    t_cook = add_minutes_to_time(settings.dinner_time, -(dinner_cook + dinner_prep))
    tasks.append(TimelineTask(
        id="task-dinner-cook",
        time_str=t_cook,
        title=f"🍳 Herd-Regie: {dinner_title}",
        category="prep",
        duration_minutes=dinner_cook + dinner_prep,
        description=f"Pfanne / Ofen anheizen. Zubereitungszeit: ~{dinner_cook + dinner_prep} Min. Schnelle Zubereitung in nur 1 Pfanne/Topf.",
        assigned_members=member_names,
        is_completed=task_completion_store.get("task-dinner-cook", False),
        action_type="cook_dinner",
        recipe_preview={"title": dinner_title, "cook_time": dinner_cook}
    ))

    # 10. Abendessen & Der faire Tellertrick
    t_dinner = settings.dinner_time
    tasks.append(TimelineTask(
        id="task-dinner-eat",
        time_str=t_dinner,
        title="🍽️ Gemeinsames Abendessen (Tellertrick)",
        category="meal",
        duration_minutes=35,
        description="Servieren ohne Küchenwaage nach dem fairen Tellertrick: Kellenmaße pro Person direkt am Herd.",
        assigned_members=member_names,
        is_completed=task_completion_store.get("task-dinner-eat", False),
        tip="Dennis: 3 volle Kellen Hauptgericht; Sarah: 1,5 Kellen + reichlich Salat/Gemüse."
    ))

    # 11. Brotdose für MORGEN vorbereiten (Evening Meal-Prep)
    t_prep_tom = settings.evening_prep_time
    overnight_steps = [
        f"1. Frühstück für morgen anrühren: {tom_bf_title} ({tom_bf_prep} Min.)",
        f"2. Brotdose Mittagessen to-go füllen: {tom_lunch_title} ({tom_lunch_prep} Min.)",
        "3. Snackbox mit Nüssen & Obst bestücken",
        "4. Alles zusammen in das oberste Kühlschrankfach stellen"
    ]
    tasks.append(TimelineTask(
        id="task-prep-tomorrow",
        time_str=t_prep_tom,
        title="🥪 Brotdose für MORGEN vorbereiten",
        category="prep",
        duration_minutes=12,
        description=f"Der 12-Minuten-Vorabend-Trick: {tom_bf_title} & {tom_lunch_title} vorbereiten. Spart morgen früh 15 Min. Hektik!",
        assigned_members=member_names,
        is_completed=task_completion_store.get("task-prep-tomorrow", False),
        action_type="toggle_lunchbox",
        tip="Overnight-Oats quellen über Nacht cremig auf – morgens einfach nur die Box greifen."
    ))

    # 12. Tiefkühl-Auftau- & Vorrats-Check
    t_defrost = add_minutes_to_time(settings.evening_prep_time, 45)
    tasks.append(TimelineTask(
        id="task-defrost-check",
        time_str=t_defrost,
        title="❄️ TK-Auftau-Check für übermorgen",
        category="defrost",
        duration_minutes=5,
        description="Tiefkühlfisch oder Fleisch für die nächsten Tage schonend aus dem Eisfach in das Null-Grad-Fach / den Kühlschrank legen.",
        assigned_members=member_names[:1],
        is_completed=task_completion_store.get("task-defrost-check", False),
        action_type="open_pantry",
        tip="Schonendes Auftauen im Kühlschrank bewahrt Saftigkeit und Nährstoffe optimal."
    ))

    # 13. Abend-Hydration & Bettruhe
    t_night = add_minutes_to_time(settings.bed_time, -45)
    tasks.append(TimelineTask(
        id="task-evening-water",
        time_str=t_night,
        title="🌙 Abend-Hydration & Regeneration",
        category="water",
        duration_minutes=10,
        description="Kamillentee oder lauwarmes Wasser mit Magnesium für Dennis & Sarah. Fördert die muskuläre und zelluläre Regeneration.",
        assigned_members=member_names,
        is_completed=task_completion_store.get("task-evening-water", False),
        tip="Kein schweres Essen mehr vor dem Schlafen für tiefen, erholsamen REM-Schlaf."
    ))

    # Sort tasks by time of day
    tasks.sort(key=lambda t: time_to_minutes(t.time_str))

    # Calculate urgency and find current focus task
    current_focus: Optional[TimelineTask] = None
    next_task: Optional[TimelineTask] = None

    # Find the task that matches current time or the next uncompleted task
    for idx, task in enumerate(tasks):
        t_min = time_to_minutes(task.time_str)
        t_end = t_min + task.duration_minutes

        if task.is_completed:
            task.urgency = "done"
            task.is_current = False
        elif t_min <= current_minutes <= t_end + 15:
            # Active right now
            task.is_current = True
            task.urgency = "now"
            if current_focus is None:
                current_focus = task
                if idx + 1 < len(tasks):
                    next_task = tasks[idx + 1]
        elif current_minutes > t_end + 45:
            # Past due and not completed
            task.urgency = "missed"
            task.is_current = False
        else:
            # Upcoming
            task.urgency = "upcoming"
            task.is_current = False

    # If no task is "now", pick the first uncompleted upcoming task as current focus
    if current_focus is None:
        for idx, task in enumerate(tasks):
            if not task.is_completed:
                task.is_current = True
                task.urgency = "now"
                current_focus = task
                if idx + 1 < len(tasks):
                    next_task = tasks[idx + 1]
                break

    # If still none, all are completed or day is done
    completed_count = sum(1 for t in tasks if t.is_completed)
    progress_percent = int((completed_count / len(tasks)) * 100) if tasks else 0

    prep_summary = PrepTomorrowSummary(
        breakfast_title=tom_bf_title,
        breakfast_prep_min=tom_bf_prep,
        lunch_title=tom_lunch_title,
        lunch_prep_min=tom_lunch_prep,
        overnight_tasks=overnight_steps,
        estimated_total_prep_min=12,
        is_prep_finished=task_completion_store.get("task-prep-tomorrow", False)
    )

    day_name = today_plan.day_name if today_plan else current_dt.strftime("%A")
    date_str = today_plan.date if today_plan else current_dt.strftime("%d.%m.%Y")

    return DailyTimelineResponse(
        date=date_str,
        day_name=day_name,
        current_time=current_time_str,
        settings=settings,
        current_focus_task=current_focus,
        next_task=next_task,
        timeline=tasks,
        progress_percent=progress_percent,
        prep_tomorrow=prep_summary
    )
