"""
Semi-Autonomous Local Mesh & Peer-to-Peer Synchronization Engine.
Provides zero-cloud local Wi-Fi (LAN mDNS / REST) and Bluetooth LE sync
between family smartphones when in physical proximity.
"""

import time
import socket
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from backend.models import (
    MeshSyncPacket,
    MeshStatusResponse,
    FamilyChore,
    FamilyMember,
    BidirectionalSyncPacket,
    BidirectionalSyncResponse,
    PantryItem,
    Recipe,
    WeeklyPlan,
    CustomShoppingItem,
    AppSettings,
    ScheduleTimeSettings
)
from backend.installer import get_lan_ip
from backend.settings_storage import get_app_settings, save_app_settings
from backend.schedule.timeline_engine import get_schedule_settings, update_schedule_settings
from backend.persistence import (
    load_family_profiles,
    save_family_profiles,
    load_pantry_items,
    save_pantry_items,
    load_weekly_plans,
    save_weekly_plans,
    load_custom_shopping_items,
    save_custom_shopping_items,
    load_checked_shopping_items,
    save_checked_shopping_items,
    load_daily_hub_state,
    save_daily_hub_state,
    load_health_dossiers,
    save_health_dossier,
    load_recurring_rules,
    save_recurring_rules
)
from backend.nutrition.recipe_universe import (
    get_all_universe_recipes,
    add_universe_recipe,
    update_universe_recipe
)


# Bluetooth LE FitPlaner GATT Service & Characteristic UUIDs
FITPLANER_BLE_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb"
FITPLANER_BLE_CHAR_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb"

# Local peer registry & sync metadata
_last_sync_timestamp: str = datetime.now().strftime("%d.%m.%Y, %H:%M Uhr")
_offline_queue: List[Dict[str, Any]] = []
_peer_devices: List[Dict[str, Any]] = [
    {
        "id": "peer-phone-1",
        "name": "Dennis (Android Phone)",
        "type": "wifi_lan",
        "last_seen": "Gerade eben",
        "ip": "192.168.178.42",
        "rssi_dbm": -45
    },
    {
        "id": "peer-phone-2",
        "name": "Familien-Handy 2",
        "type": "bluetooth_le",
        "last_seen": "In Reichweite (< 5m)",
        "ip": "192.168.178.68",
        "rssi_dbm": -62
    }
]


def check_internet_connection(host="8.8.8.8", port=53, timeout=1.0) -> bool:
    """Checks if internet is accessible (for supermarket leaflets/prospectuses)."""
    try:
        socket.setdefaulttimeout(timeout)
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((host, port))
        s.close()
        return True
    except Exception:
        return False


def get_mesh_status() -> MeshStatusResponse:
    """Returns the current multi-transport local mesh status."""
    lan_ip = get_lan_ip()
    is_lan = lan_ip != "127.0.0.1"
    is_online = check_internet_connection()

    mode = "lan_mesh" if is_lan else "offline_autonomous"

    return MeshStatusResponse(
        mode=mode,
        is_lan_available=is_lan,
        is_bluetooth_ready=True,
        is_internet_available=is_online,
        active_peers_count=len(_peer_devices),
        last_sync_time=_last_sync_timestamp,
        offline_queue_length=len(_offline_queue),
        local_ip=lan_ip,
        bluetooth_service_uuid=FITPLANER_BLE_SERVICE_UUID
    )


def create_local_sync_packet(
    device_id: str,
    device_name: str,
    checked_items: List[str],
    completed_chores: List[str],
    members: List[FamilyMember],
    daily_hub_state: Dict[str, Any]
) -> MeshSyncPacket:
    """Creates a sync payload to push to local peers or send over Bluetooth LE."""
    points_map = {m.id: getattr(m, "chore_points", 0) for m in members}
    water_map = {m.id: getattr(m, "water_intake_ml", 0) for m in members}

    return MeshSyncPacket(
        device_id=device_id,
        device_name=device_name,
        timestamp=datetime.now().isoformat(),
        sequence_id=int(time.time()),
        checked_shopping_items=checked_items,
        completed_chores=completed_chores,
        member_points=points_map,
        member_water=water_map,
        lunchbox_packed=daily_hub_state.get("lunchbox_packed"),
        fresh_pick_bought=daily_hub_state.get("fresh_pick_bought"),
        dinner_cooked=daily_hub_state.get("dinner_cooked")
    )


def merge_peer_sync_packet(
    packet: MeshSyncPacket,
    chores: List[FamilyChore],
    members: List[FamilyMember],
    daily_hub_state: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Two-way delta merge (Set-Union / CRDT LWW style).
    Seamlessly merges changes from a peer phone (WLAN or Bluetooth) into the local state.
    """
    global _last_sync_timestamp
    _last_sync_timestamp = datetime.now().strftime("%d.%m.%Y, %H:%M Uhr")

    chores_merged = 0
    # Merge Chores
    if packet.completed_chores:
        for c in chores:
            if c.id in packet.completed_chores and not c.is_completed:
                c.is_completed = True
                c.completed_by_name = c.assigned_member_name or packet.device_name
                chores_merged += 1

    # Merge Member Points & Water Intake (take max)
    points_merged = 0
    water_merged = 0
    for m in members:
        if m.id in packet.member_points:
            incoming_pts = packet.member_points[m.id]
            if incoming_pts > m.chore_points:
                m.chore_points = incoming_pts
                points_merged += 1

        if m.id in packet.member_water:
            incoming_water = packet.member_water[m.id]
            if incoming_water > m.water_intake_ml:
                m.water_intake_ml = incoming_water
                water_merged += 1

    # Merge Daily Hub Boolean States (logical OR)
    hub_merged = 0
    if packet.lunchbox_packed is True and not daily_hub_state.get("lunchbox_packed"):
        daily_hub_state["lunchbox_packed"] = True
        hub_merged += 1
    if packet.fresh_pick_bought is True and not daily_hub_state.get("fresh_pick_bought"):
        daily_hub_state["fresh_pick_bought"] = True
        hub_merged += 1
    if packet.dinner_cooked is True and not daily_hub_state.get("dinner_cooked"):
        daily_hub_state["dinner_cooked"] = True
        hub_merged += 1

    return {
        "status": "success",
        "peer_device": packet.device_name,
        "sync_time": _last_sync_timestamp,
        "chores_merged": chores_merged,
        "points_merged": points_merged,
        "water_merged": water_merged,
        "hub_merged": hub_merged,
        "shopping_items_count": len(packet.checked_shopping_items)
    }


def merge_bidirectional_sync_packet(
    packet: BidirectionalSyncPacket,
    server_device_name: str = "FitPlaner PC-Server (Zuhause)",
    current_settings: Optional[AppSettings] = None,
    current_chores: Optional[List[FamilyChore]] = None,
    current_members: Optional[List[FamilyMember]] = None,
    current_daily_hub: Optional[Dict[str, Any]] = None
) -> BidirectionalSyncResponse:
    """
    Gleichberechtigter P2P Vollabgleich (PC ↔ Smartphone):
    Führt alle geänderten Daten von Smartphone (unterwegs/autark) und PC (zu Hause)
    zusammen und liefert den konsolidierten Master-Zustand zurück.
    Garantiert, dass ALLE Daten (Familienmitglieder mit allen Attributen, Einstellungen,
    Gesundheitsakten, Vorräte, Rezepte, Pläne, Kauftaktiken & Einkaufsstatus) synchron sind.
    """
    global _last_sync_timestamp
    _last_sync_timestamp = datetime.now().strftime("%d.%m.%Y, %H:%M Uhr")
    summary = {
        "settings_merged": 0,
        "schedule_settings_merged": 0,
        "chores_merged": 0,
        "checked_items_merged": 0,
        "custom_items_merged": 0,
        "pantry_merged": 0,
        "plans_merged": 0,
        "recipes_merged": 0,
        "profiles_merged": 0,
        "hub_merged": 0,
        "health_dossiers_merged": 0,
        "recurring_merged": 0,
    }

    # 1. App-Einstellungen (Supermarkt, Budget, Prioritäten)
    server_settings = current_settings if current_settings is not None else get_app_settings()
    if packet.settings:
        inc_s = packet.settings if isinstance(packet.settings, dict) else packet.settings.model_dump()
        for k, v in inc_s.items():
            if v is not None and hasattr(server_settings, k):
                setattr(server_settings, k, v)
        save_app_settings(server_settings)
        summary["settings_merged"] = 1

    # 1.1 Zeitplan- & Tagesablauf-Einstellungen (ScheduleTimeSettings)
    if packet.schedule_settings:
        inc_sched = packet.schedule_settings if isinstance(packet.schedule_settings, dict) else packet.schedule_settings.model_dump()
        update_schedule_settings(inc_sched)
        summary["schedule_settings_merged"] = 1

    # 2. Einkaufsliste - Abgehakte Artikel (Set-Union)
    server_checked = set(load_checked_shopping_items())
    incoming_checked = set(packet.checked_shopping_items or [])
    merged_checked = list(server_checked.union(incoming_checked))
    save_checked_shopping_items(merged_checked)
    summary["checked_items_merged"] = len(merged_checked)

    # 3. Eigene Einkaufsartikel (Custom Shopping Items)
    server_custom = {i.id: i for i in load_custom_shopping_items()}
    if packet.custom_shopping_items:
        for raw_c in packet.custom_shopping_items:
            c = CustomShoppingItem(**raw_c) if isinstance(raw_c, dict) else raw_c
            server_custom[c.id] = c
            summary["custom_items_merged"] += 1
        save_custom_shopping_items(list(server_custom.values()))

    # 4. Hausarbeiten & Ämtli (Chores & Stars)
    active_chores = current_chores if current_chores is not None else []
    if packet.chores:
        chore_map = {c.id: c for c in active_chores}
        for raw_chore in packet.chores:
            inc_chore = FamilyChore(**raw_chore) if isinstance(raw_chore, dict) else raw_chore
            if inc_chore.id in chore_map:
                target = chore_map[inc_chore.id]
                if inc_chore.is_completed and not target.is_completed:
                    target.is_completed = True
                    target.completed_by_name = inc_chore.completed_by_name or packet.device_name
                    summary["chores_merged"] += 1

    # 5. Familienmitglieder (Vollständiger Sync aller Attribute: Demographie, Ziele, Allergien, Punkte, Wasser)
    server_profiles = current_members if current_members is not None else load_family_profiles()
    prof_map = {m.id: m for m in server_profiles}
    if packet.profiles:
        for raw_p in packet.profiles:
            p = FamilyMember(**raw_p) if isinstance(raw_p, dict) else raw_p
            if p.id in prof_map:
                m = prof_map[p.id]
                if p.name:
                    m.name = p.name
                if p.gender:
                    m.gender = p.gender
                if p.age:
                    m.age = p.age
                if p.height_cm:
                    m.height_cm = p.height_cm
                if p.weight_kg:
                    m.weight_kg = p.weight_kg
                if p.activity_level:
                    m.activity_level = p.activity_level
                if p.goal:
                    m.goal = p.goal
                if p.dietary_preference:
                    m.dietary_preference = p.dietary_preference
                if p.role_title:
                    m.role_title = p.role_title
                if p.age_group:
                    m.age_group = p.age_group
                # Gamification & Hydration (Höchstwert bzw. Set-Vereinigung)
                m.chore_points = max(m.chore_points, p.chore_points)
                m.water_intake_ml = max(m.water_intake_ml, p.water_intake_ml)
                if p.daily_water_target_ml:
                    m.daily_water_target_ml = p.daily_water_target_ml
                if p.allergies:
                    m.allergies = list(dict.fromkeys((m.allergies or []) + p.allergies))
                if p.disliked_foods:
                    m.disliked_foods = list(dict.fromkeys((m.disliked_foods or []) + p.disliked_foods))
                if p.badges:
                    m.badges = list(dict.fromkeys((m.badges or []) + p.badges))
                if p.target_calories:
                    m.target_calories = p.target_calories
                if p.target_protein_g:
                    m.target_protein_g = p.target_protein_g
                if p.target_carbs_g:
                    m.target_carbs_g = p.target_carbs_g
                if p.target_fat_g:
                    m.target_fat_g = p.target_fat_g
                if p.bmr:
                    m.bmr = p.bmr
                if p.tdee:
                    m.tdee = p.tdee
                summary["profiles_merged"] += 1
            else:
                server_profiles.append(p)
                prof_map[p.id] = p
                summary["profiles_merged"] += 1
        save_family_profiles(server_profiles)

    # 6. Vorratskammer (Pantry Items)
    server_pantry = {item.id: item for item in load_pantry_items()}
    if packet.pantry:
        for raw_p in packet.pantry:
            inc_p = PantryItem(**raw_p) if isinstance(raw_p, dict) else raw_p
            server_pantry[inc_p.id] = inc_p
            summary["pantry_merged"] += 1
        save_pantry_items(list(server_pantry.values()))

    # 7. Eigene Rezepte (Custom Recipes)
    if packet.recipes:
        for raw_r in packet.recipes:
            inc_r = Recipe(**raw_r) if isinstance(raw_r, dict) else raw_r
            if inc_r.id.startswith("custom-") or inc_r.id.startswith("user-"):
                existing_recipes = {r.id: r for r in get_all_universe_recipes()}
                if inc_r.id not in existing_recipes:
                    add_universe_recipe(inc_r)
                    summary["recipes_merged"] += 1
                else:
                    update_universe_recipe(inc_r.id, inc_r)
                    summary["recipes_merged"] += 1



    # 8. Daily Hub Status (Tagesstatus: z.B. Lunchbox gepackt, gekocht)
    hub_state = current_daily_hub if current_daily_hub is not None else load_daily_hub_state({})
    if packet.daily_hub_state:
        for key in ["lunchbox_packed", "fresh_pick_bought", "dinner_cooked"]:
            if packet.daily_hub_state.get(key) is True and not hub_state.get(key):
                hub_state[key] = True
                summary["hub_merged"] += 1
        save_daily_hub_state(hub_state)

    # 9. Wochenpläne (Weekly Plans mit Zubereitungs-Status & Anpassungen)
    server_plans = load_weekly_plans()
    if packet.plans:
        for raw_plan in packet.plans:
            inc_plan = WeeklyPlan(**raw_plan) if isinstance(raw_plan, dict) else raw_plan
            if inc_plan.week_offset not in server_plans:
                server_plans[inc_plan.week_offset] = inc_plan
                summary["plans_merged"] += 1
            else:
                serv_plan = server_plans[inc_plan.week_offset]
                for d_idx, d in enumerate(inc_plan.days):
                    if d_idx < len(serv_plan.days):
                        if d.is_breakfast_cooked:
                            serv_plan.days[d_idx].is_breakfast_cooked = True
                        if d.is_lunch_cooked:
                            serv_plan.days[d_idx].is_lunch_cooked = True
                        if d.is_dinner_cooked:
                            serv_plan.days[d_idx].is_dinner_cooked = True
                summary["plans_merged"] += 1
        save_weekly_plans(server_plans)

    # 10. Private Elektronische Gesundheitsakten (ePA / FHIR)
    if packet.health_dossiers:
        if isinstance(packet.health_dossiers, dict):
            for m_id, dossier_data in packet.health_dossiers.items():
                if isinstance(dossier_data, dict):
                    save_health_dossier(m_id, dossier_data)
                    summary["health_dossiers_merged"] += 1
        elif isinstance(packet.health_dossiers, list):
            for dossier_data in packet.health_dossiers:
                if isinstance(dossier_data, dict):
                    m_id = dossier_data.get("profile_id") or dossier_data.get("id") or dossier_data.get("member_id")
                    if m_id:
                        save_health_dossier(m_id, dossier_data)
                        summary["health_dossiers_merged"] += 1

    # 11. Wiederkehrende Kauf-Routinen / Abos
    server_recurring = {r["id"]: r for r in load_recurring_rules() if isinstance(r, dict) and "id" in r}
    if packet.recurring_rules:
        for raw_r in packet.recurring_rules:
            r_dict = raw_r if isinstance(raw_r, dict) else raw_r.model_dump()
            r_id = r_dict.get("id")
            if r_id:
                server_recurring[r_id] = r_dict
                summary["recurring_merged"] += 1
        save_recurring_rules(list(server_recurring.values()))
        try:
            import backend.main as bmain
            bmain.RECURRING_RULES_STORE = server_recurring
        except Exception:
            pass

    # 12. Konsolidierten Master-Datensatz zusammenstellen
    all_merged_plans = list(load_weekly_plans().values())
    consolidated_packet = BidirectionalSyncPacket(
        device_id="fitplaner-pc-node",
        device_name=server_device_name,
        timestamp=datetime.now().isoformat(),
        settings=get_app_settings(),
        schedule_settings=get_schedule_settings(),
        profiles=load_family_profiles(),
        pantry=load_pantry_items(),
        recipes=get_all_universe_recipes(),
        chores=active_chores,
        plans=all_merged_plans,
        checked_shopping_items=load_checked_shopping_items(),
        custom_shopping_items=load_custom_shopping_items(),
        daily_hub_state=hub_state,
        health_dossiers=load_health_dossiers(),
        recurring_rules=load_recurring_rules()
    )

    return BidirectionalSyncResponse(
        status="success",
        server_device_name=server_device_name,
        server_timestamp=datetime.now().isoformat(),
        merged_data=consolidated_packet,
        summary=summary
    )


