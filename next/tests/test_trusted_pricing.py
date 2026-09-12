"""Standalone kernel tests; example prices are synthetic test fixtures, not offers."""
import itertools
import random
from datetime import date
from types import SimpleNamespace

import pytest
from trusted_pricing import offer_status, pack_quote, optimise

DAY=date(2026,9,10)

def settings(**changes):
    values=dict(postal_code='06636',shopping_date=DAY,stores=['a','b'],branches={'a':'Branch A','b':'Branch B'},member_stores=[],max_stores=2,travel_cents={})
    values.update(changes)
    return SimpleNamespace(**values)

def offer(id='a1',food='oats',store='a',quantity=500,price=99,**changes):
    values=dict(id=id,food_id=food,store=store,branch='Branch '+store.upper(),postal_code='06636',title='SYNTHETIC TEST PRICE',pack_quantity=quantity,quantity_milli=quantity*1000,unit='g',price_cents=price,deposit_cents=0,valid_from=DAY,valid_to=DAY,source_url='https://example.invalid/not-a-real-offer',evidence='manual_check',confirmed=True,members_only=False,max_packs=None)
    values.update(changes)
    return SimpleNamespace(**values)

@pytest.mark.parametrize('seed',range(35))
def test_exact_pack_result_matches_brute_force(seed):
    rng=random.Random(seed)
    offers=[offer(str(i),quantity=rng.randint(1,8),price=rng.randint(1,35),deposit_cents=rng.randint(0,3),max_packs=rng.randint(1,5)) for i in range(3)]
    need=rng.randint(1,20)*1000
    candidates=[]
    for counts in itertools.product(*(range(o.max_packs+1) for o in offers)):
        delivered=sum(o.quantity_milli*n for o,n in zip(offers,counts))
        if delivered>=need:
            candidates.append((sum((o.price_cents+o.deposit_cents)*n for o,n in zip(offers,counts)),delivered))
    result=pack_quote(need,offers)
    assert (result is None)==(not candidates)
    if candidates: assert (result['cost_cents'],result['delivered_milli'])==min(candidates)

def test_round_to_whole_packs():
    q=pack_quote(600000,[offer()])
    assert q['cost_cents']==198 and q['delivered_milli']==1000000

def test_cheaper_unit_price_is_not_cheaper_checkout():
    q=pack_quote(100000,[offer('large',quantity=1000,price=100),offer('small',quantity=200,price=40)])
    assert q['cost_cents']==40

def test_mixed_sizes_can_win():
    q=pack_quote(700000,[offer('large',quantity=500,price=100),offer('small',quantity=200,price=60)])
    assert q['cost_cents']==160 and q['delivered_milli']==700000

def test_partial_total_never_reported_as_zero():
    q=optimise({'oats':500000,'milk':500000},[offer()],settings())
    assert not q['complete'] and q['total_cents'] is None and q['savings_cents'] is None

def test_travel_costs_change_best_store_combination():
    offers=[offer('a1','oats','a',500,100),offer('a2','skyr','a',500,300),offer('b1','oats','b',500,300),offer('b2','skyr','b',500,100)]
    needs={'oats':500000,'skyr':500000}
    q=optimise(needs,offers,settings())
    assert q['total_cents']==200 and q['savings_cents']==200
    q=optimise(needs,offers,settings(travel_cents={'b':250}))
    assert q['total_cents']==400 and q['stores']==['a'] and q['savings_cents']==0

@pytest.mark.parametrize('changes,status',[
    ({'confirmed':False},'unconfirmed'),({'evidence':'estimate'},'estimate'),
    ({'postal_code':'30159'},'other_postal_code'),({'branch':'Another branch'},'other_branch'),
    ({'valid_from':date(2026,9,11)},'future'),({'valid_to':date(2026,9,9)},'expired'),
    ({'members_only':True},'membership_required'),
])
def test_ineligible_offers_excluded(changes,status):
    o=offer(**changes)
    assert offer_status(o,settings())==status
    assert not optimise({'oats':500000},[o],settings())['complete']

def test_limits_no_silent_heuristic():
    assert pack_quote(1100000,[offer(max_packs=2)]) is None
    with pytest.raises(ValueError): pack_quote(100,[offer(str(i)) for i in range(13)])
    with pytest.raises(ValueError): pack_quote(5000000,[offer(quantity=1)])

def test_deposit_counted():
    assert pack_quote(600000,[offer(deposit_cents=25)])['cost_cents']==248

def test_empty_need_no_trip():
    q=optimise({},[],settings(travel_cents={'a':500}))
    assert q['total_cents']==0 and q['travel_cents']==0

def test_card_opt_in_and_date_boundaries():
    assert offer_status(offer(members_only=True),settings(member_stores=['a']))=='active'

def test_missing_single_store_baseline_no_savings_claim():
    q=optimise({'oats':500000,'milk':500000},[offer('a1'),offer('b1','milk','b')],settings())
    assert q['complete'] and q['single_store_cents'] is None and q['savings_cents'] is None


def test_shared_search_budget_stops_explicitly():
    with pytest.raises(ValueError,match='Suchbudget'):
        pack_quote(500000,[offer()],_budget=[0])
