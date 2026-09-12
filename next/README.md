# FitPlaner Next — auditable pricing kernel

Development branch: `improve/trusted-nutrition-budget`. Main, existing application data and the Android APK are not changed by this module.

## What is committed here

`trusted_pricing.py` is the standalone, tested pack/store-selection core extracted from a larger separately runnable FitPlaner Next preview. `tests/test_trusted_pricing.py` exercises it without the old backend or any live API. The complete preview application, mobile HTML interface, pantry ledger, integration helper and additional tests are supplied separately as a source ZIP in the accompanying ChatGPT delivery; they are NOT all included in this repository commit. Do not mistake this kernel commit for deployment of the complete preview or an APK upgrade.

```sh
cd next
python -m pip install 'pytest>=8,<10'
python -m pytest -q tests/test_trusted_pricing.py
```

## Contract

The caller validates inputs before calling this core: integer nonnegative quantities and money, positive package size, unique offer IDs, valid dates, units, retailer/branch identifiers, official source provenance and positive maximum store count. Protocols document the required object shape; they are not input validators. The separately delivered preview performs this validation with Pydantic.

- A fixed basket is covered with whole packs, including mixed sizes and quantity limits.
- Prices are integer cents; quantity arithmetic uses thousandths of one base unit.
- Postal code AND selected branch must match; future/expired, unconfirmed, estimate and unavailable loyalty prices are excluded.
- Deposit and entered fixed costs per visited retailer are counted. These are NOT computed road routes.
- Incomplete baskets keep `total_cents` and unsupported savings as `None`.
- Savings compare the SAME fully priced basket against a feasible single-store alternative.
- Search and state budgets terminate explicitly; no unverified heuristic is labelled an optimum.

The minimum applies only to the supplied finite offers, fixed food requirements and additive store costs. It is not a guarantee of the cheapest available food, actual stock, nutritional adequacy or the optimal weekly menu. Price fixtures in tests are synthetic, not supermarket offers.

## Audit of the old application (base f23d1db)

`backend/health/vitality_engine.py` has fixed nutrient scores and fabricated baseline plant diversity when there is no plan. `backend/scrapers/leaflets.py` presents hardcoded prices with stock photos as authentic leaflets. `backend/scrapers/marktguru_client.py` adds static curated prices, defaults to postal code 30159 and contains literal API credential strings. These findings need migration-level fixes with matching UI/schema changes; this additive core does NOT silently fix all old screens. Credential validity was not tested; do not copy them into new code.

## Test/deployment boundaries

The core is locally executable and unit-tested. The initial GitHub workflow run 34482604964 failed before any job steps ran (no runner assigned); this is not a passing CI result. Physical Android testing was blocked because ADB and a reachable authorised smartphone were absent in the development environment. The full preview was separately tested through FastAPI and Chromium DOM tests using a Python API transport bridge; that does not establish Android WebView or existing-APK compatibility.

Automatic retailer prospectus ingestion, the old/new household migration and an APK rollout remain outside this core commit.
