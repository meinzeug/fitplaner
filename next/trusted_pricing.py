"""Auditable basket kernel; standalone, no HTTP, storage or recipe dependencies.
Callers must validate offers, units, dates, money and source provenance first.
Optimality is restricted to a FIXED basket and the supplied finite package set.
Different branches must not be combined as a single store. Missing prices stay unknown.
"""
from __future__ import annotations
import itertools
from datetime import date
from typing import Protocol

MAX_STATES = 25000

class OfferLike(Protocol):
    id: str
    food_id: str
    store: str
    branch: str
    postal_code: str
    title: str
    pack_quantity: float
    unit: str
    price_cents: int
    deposit_cents: int
    valid_from: date
    valid_to: date
    source_url: str
    evidence: str
    confirmed: bool
    members_only: bool
    max_packs: int | None
    @property
    def quantity_milli(self) -> int: ...

class SettingsLike(Protocol):
    postal_code: str
    shopping_date: date
    stores: list[str]
    branches: dict[str, str]
    member_stores: list[str]
    max_stores: int
    travel_cents: dict[str, int]

def offer_status(offer: OfferLike, settings: SettingsLike) -> str:
    if not offer.confirmed or offer.evidence != "manual_check":
        return "unconfirmed" if not offer.confirmed else "estimate"
    if offer.postal_code != settings.postal_code:
        return "other_postal_code"
    if offer.branch.strip().casefold() != settings.branches.get(offer.store, "").strip().casefold():
        return "other_branch"
    if settings.shopping_date < offer.valid_from:
        return "future"
    if settings.shopping_date > offer.valid_to:
        return "expired"
    if offer.members_only and offer.store not in settings.member_stores:
        return "membership_required"
    if offer.store not in settings.stores:
        return "store_disabled"
    return "active"

def pack_quote(need: int, offers: list[OfferLike], *, _budget: list[int] | None = None) -> dict | None:
    """Exact bounded covering for one food and the provided package variants.

    Sparse dynamic programming; quantities in 1/1000 of base unit and money in cents.
    Search limits raise an error instead of silently presenting a heuristic as optimal.
    """
    if need <= 0:
        return {"cost_cents": 0, "delivered_milli": 0, "packs": []}
    if len(offers) > 12:
        raise ValueError("Mehr als 12 Packungsvarianten pro Lebensmittel: bitte Auswahl eingrenzen.")
    budget = _budget if _budget is not None else [200000]
    # capped amount -> (cost, delivered, [(offer_id, count)])
    states: dict[int, tuple[int, int, list[tuple[str, int]]]] = {0: (0, 0, [])}
    for offer in sorted(offers, key=lambda o: o.id):
        q = offer.quantity_milli
        required_max = (need + q - 1) // q
        count_max = min(required_max, offer.max_packs) if offer.max_packs is not None else required_max
        if count_max > 2000:
            raise ValueError("Mehr als 2000 Packungen nötig: Menge oder Packungsgröße prüfen.")
        next_states = dict(states)
        for reached, (cost, delivered, selected) in states.items():
            if reached == need:
                continue
            useful_max = min(count_max, (need - reached + q - 1) // q)
            for count in range(1, useful_max + 1):
                budget[0] -= 1
                if budget[0] < 0:
                    raise ValueError("Suchbudget überschritten. Angebote eingrenzen; kein Optimum behauptet.")
                new_delivered = delivered + count * q
                key = min(need, new_delivered)
                candidate = (cost + count * (offer.price_cents + offer.deposit_cents), new_delivered, selected + [(offer.id, count)])
                old = next_states.get(key)
                if old is None or candidate[:2] < old[:2]:
                    next_states[key] = candidate
                if len(next_states) > MAX_STATES:
                    raise ValueError("Zu viele Packungskombinationen. Auswahl eingrenzen; kein angebliches Optimum berechnet.")
        states = next_states
    best = states.get(need)
    if best is None:
        return None
    return {"cost_cents": best[0], "delivered_milli": best[1], "packs": [{"offer_id": oid, "count": n} for oid, n in best[2]]}

def optimise(needs: dict[str, int], offers: list[OfferLike], settings: SettingsLike) -> dict:
    if not needs:
        return {"complete": True, "rows": [], "missing": [], "known_cost_cents": 0, "total_cents": 0, "travel_cents": 0, "deposit_cents": 0, "stores": [], "single_store_cents": 0, "savings_cents": 0}
    active = [o for o in offers if offer_status(o, settings) == "active"]
    by_id = {o.id: o for o in active}
    candidates = []
    budget = [500000]
    cache: dict[tuple, dict | None] = {}
    for size in range(1, min(settings.max_stores, len(settings.stores)) + 1):
        for subset in itertools.combinations(settings.stores, size):
            rows, missing, used_stores = [], [], set()
            goods, deposit = 0, 0
            for food_id, need in sorted(needs.items()):
                variants = [o for o in active if o.food_id == food_id and o.store in subset]
                cache_key = (food_id, need, tuple(sorted(o.id for o in variants)))
                if cache_key not in cache:
                    cache[cache_key] = pack_quote(need, variants, _budget=budget)
                quote = cache[cache_key]
                if quote is None:
                    missing.append(food_id)
                    continue
                row = {"food_id": food_id, "need": need / 1000, "leftover": (quote["delivered_milli"] - need) / 1000,
                       "cost_cents": quote["cost_cents"], "packs": []}
                for pack in quote["packs"]:
                    offer = by_id[pack["offer_id"]]
                    used_stores.add(offer.store)
                    deposit += pack["count"] * offer.deposit_cents
                    row["packs"].append({**pack, "store": offer.store, "title": offer.title, "source_url": offer.source_url,
                                         "pack_quantity": offer.pack_quantity, "unit": offer.unit, "price_cents": offer.price_cents,
                                         "deposit_cents": offer.deposit_cents, "branch": offer.branch, "valid_to": offer.valid_to.isoformat()})
                rows.append(row)
                goods += quote["cost_cents"]
            travel = sum(settings.travel_cents.get(s, 0) for s in used_stores)
            candidates.append({"complete": not missing, "rows": rows, "missing": missing,
                "known_cost_cents": goods, "total_cents": goods + travel if not missing else None,
                "travel_cents": travel, "deposit_cents": deposit, "stores": sorted(used_stores)})
    # Never prefer an incomplete, deceptively cheap basket over a complete one.
    best = min(candidates, key=lambda x: (len(x["missing"]), x["known_cost_cents"] + x["travel_cents"], len(x["stores"])))
    single = [c["total_cents"] for c in candidates if c["complete"] and len(c["stores"]) <= 1]
    baseline = min(single) if single else None
    return {**best, "single_store_cents": baseline,
        "savings_cents": baseline - best["total_cents"] if baseline is not None and best["complete"] else None}

