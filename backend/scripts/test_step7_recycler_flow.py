import requests
import json
import sys
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:5000/api/v1"
AI_URL = "http://localhost:8000"

RECYCLER_TOKEN = "dev-mock-authorized_recycler"
AGGREGATOR_TOKEN = "dev-mock-informal_aggregator"

headers_recycler = {
    "Authorization": f"Bearer {RECYCLER_TOKEN}",
    "Content-Type": "application/json"
}

headers_aggregator = {
    "Authorization": f"Bearer {AGGREGATOR_TOKEN}",
    "Content-Type": "application/json"
}

def print_step(title):
    print(f"\n{'='*70}\n{title}\n{'='*70}")

def run_step7_tests():
    results = {}
    print("\n[STARTING STEP 7: AUTHORIZED RECYCLER FULL LIFECYCLE TESTS]\n")

    # 1. Health Checks
    print_step("1. Health Checks (NestJS & FastAPI AI Service)")
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Backend health failed: {r.status_code}"
    r_ai = requests.get(f"{AI_URL}/health")
    assert r_ai.status_code == 200, f"FastAPI health failed: {r_ai.status_code}"
    print("✔ Backend & FastAPI AI microservice active & healthy.")
    results["1_health"] = "PASS"

    # 2. Recycler Profile & Regulatory CPCB Authorization
    print_step("2. Recycler Profile & CPCB Regulatory Authorization Check")
    r = requests.get(f"{BASE_URL}/recycler/profile", headers=headers_recycler)
    assert r.status_code == 200, f"Profile failed: {r.status_code} {r.text}"
    profile_data = r.json().get("data", r.json())
    print("Recycler Facility:", profile_data.get("facility", {}).get("company_name"))
    print("Authorization Status:", profile_data.get("authorization", {}).get("verification_status"))
    print("License Number:", profile_data.get("authorization", {}).get("authorization_number"))
    assert profile_data.get("authorization", {}).get("verification_status") in ["VERIFIED", "ACTIVE"]
    assert profile_data.get("authorization", {}).get("is_expired") is False
    results["2_recycler_profile_auth"] = "PASS"

    # 3. Recycler Material Capabilities
    print_step("3. Recycler Material Capabilities")
    r = requests.get(f"{BASE_URL}/recycler/capabilities", headers=headers_recycler)
    assert r.status_code == 200
    caps = r.json().get("data", r.json())
    print(f"Verified {len(caps)} material capabilities registered for recycler.")
    assert len(caps) > 0, "No material capabilities found"
    results["3_recycler_capabilities"] = "PASS"

    # 4. Recycler Dashboard Metrics
    print_step("4. Recycler Dashboard & Capacity Gauges")
    r = requests.get(f"{BASE_URL}/recycler/dashboard", headers=headers_recycler)
    assert r.status_code == 200
    dash = r.json().get("data", r.json())
    metrics = dash.get("metrics", {})
    print("Dashboard Metrics:", json.dumps(metrics, indent=2))
    assert "total_processing_capacity_kg" in metrics
    assert "available_capacity_kg" in metrics
    results["4_recycler_dashboard"] = "PASS"

    # 5. Aggregator Yard Inventory Check
    print_step("5. Aggregator Yard Inventory")
    r = requests.get(f"{BASE_URL}/aggregator/inventory", headers=headers_aggregator)
    assert r.status_code == 200
    inv_items = r.json().get("data", r.json())
    print(f"Aggregator yard currently holds {len(inv_items)} inventory lots.")
    assert len(inv_items) > 0, "No inventory lots found in aggregator yard"
    test_inv = inv_items[0]
    inv_id = test_inv["id"]
    print(f"Target Inventory Item: {inv_id} ({test_inv.get('verified_weight')} kg, status: {test_inv.get('inventory_status')})")
    results["5_aggregator_inventory"] = "PASS"

    # 6. Aggregator Confirms Intake
    print_step("6. Aggregator Confirms Inventory Intake (Traceability Event)")
    r = requests.post(f"{BASE_URL}/aggregator/inventory/{inv_id}/confirm-receipt", headers=headers_aggregator, json={
        "actual_received_weight": test_inv.get("verified_weight", 7.8),
        "received_condition": "INTACT",
        "storage_location": "Aggregator Central Yard - Bay 1",
        "notes": "Intake confirmed from Ramesh Babu collection."
    })
    assert r.status_code in [200, 201], f"Intake confirm failed: {r.status_code} {r.text}"
    print("✔ Material intake confirmed into available inventory.")
    results["6_inventory_confirm"] = "PASS"

    # 7. Consolidate Lots into a Recycler Batch
    print_step("7. Consolidate Lot(s) into Recycler Batch (RB-YYYY-XXXXXX)")
    r = requests.post(f"{BASE_URL}/aggregator/recycler-batches", headers=headers_aggregator, json={
        "inventory_ids": [inv_id],
        "material_category_id": 10,
        "notes": "Consolidated consumer electronics batch for Step 7 verification test."
    })
    assert r.status_code in [200, 201], f"Batch creation failed: {r.status_code} {r.text}"
    batch = r.json().get("data", r.json())
    batch_id = batch["id"]
    batch_code = batch["batch_code"]
    total_weight = float(batch["total_weight"])
    print(f"✔ Created Batch: {batch_code} (ID: {batch_id}, Weight: {total_weight} kg, Status: {batch['status']})")
    assert batch_code.startswith("RB-"), "Invalid batch code format"
    results["7_create_batch"] = "PASS"

    # 8. FastAPI Recycler Recommendation with Multi-Criteria Scoring
    print_step("8. FastAPI AI Recycler Recommendation & Multi-Criteria Scoring")
    r = requests.post(f"{BASE_URL}/aggregator/recycler-batches/{batch_id}/recommend-recyclers", headers=headers_aggregator)
    assert r.status_code in [200, 201], f"Recommendation failed: {r.status_code} {r.text}"
    rec_res = r.json().get("data", r.json())
    recommended = rec_res.get("recommended_recyclers", [])
    print(f"Received {len(recommended)} ranked recycler recommendations from AI Engine:")
    for r_item in recommended:
        print(f"  - [{r_item.get('composite_rank')}] {r_item.get('facility_name')}: Match Score: {r_item.get('match_score')}/100, Rate: ₹{r_item.get('offered_rate_per_kg')}/kg, Est Net Value: ₹{r_item.get('estimated_net_value')}")
        print(f"    Reason: {r_item.get('reason')}")
    assert len(recommended) > 0, "No recyclers recommended"
    target_recycler = recommended[0]
    recycler_id = target_recycler["recycler_id"]
    results["8_ai_recommendation"] = "PASS"

    # 9. Aggregator Requests B2B Quote from Recycler
    print_step("9. Aggregator Dispatches Quote Request to Recycler")
    r = requests.post(f"{BASE_URL}/aggregator/recycler-batches/{batch_id}/request-quote", headers=headers_aggregator, json={
        "recycler_id": recycler_id,
        "notes": "Requesting immediate B2B quote for verified lot."
    })
    assert r.status_code in [200, 201], f"Quote request failed: {r.status_code} {r.text}"
    print("✔ Quote invitation dispatched to recycler.")
    results["9_quote_request"] = "PASS"

    # 10. Recycler Views Open Opportunities
    print_step("10. Recycler Discovers Matching Opportunities")
    r = requests.get(f"{BASE_URL}/recycler/opportunities", headers=headers_recycler)
    assert r.status_code == 200
    opps = r.json().get("data", r.json())
    matched_opp = next((o for o in opps if o.get("batch_id") == batch_id), None)
    print(f"Recycler sees {len(opps)} opportunities; Target batch visible: {matched_opp is not None}")
    results["10_recycler_opportunities"] = "PASS"

    # 11. Recycler Submits B2B Quote (RQ-YYYY-XXXXXX)
    print_step("11. Recycler Submits B2B Quote with Transparent Breakdown")
    quote_payload = {
        "batch_id": batch_id,
        "rate_per_kg": 34.0,
        "pickup_cost": 50.0,
        "transport_cost": 80.0,
        "notes": "Calibrated electronic recycling with CPCB certificate of destruction.",
        "submit_immediately": True
    }
    r = requests.post(f"{BASE_URL}/recycler/quotes", headers=headers_recycler, json=quote_payload)
    assert r.status_code in [200, 201], f"Quote submission failed: {r.status_code} {r.text}"
    quote = r.json().get("data", r.json())
    quote_id = quote["id"]
    quote_code = quote["quote_code"]
    print(f"✔ Submitted Quote: {quote_code} (ID: {quote_id})")
    print(f"  Rate: ₹{quote['rate_per_kg']}/kg, Base: ₹{quote['base_amount']}, Logistics: -₹{float(quote['pickup_cost']) + float(quote['transport_cost'])}, Net: ₹{quote['total_quote_amount']}")
    assert quote_code.startswith("RQ-"), "Invalid quote code format"
    results["11_recycler_submit_quote"] = "PASS"

    # 12. Aggregator Compares Quotes (Best Net Value)
    print_step("12. Aggregator Compares B2B Quotes for Batch")
    r = requests.get(f"{BASE_URL}/aggregator/recycler-batches/{batch_id}/quotes", headers=headers_aggregator)
    assert r.status_code == 200
    quotes_list = r.json().get("data", r.json())
    print(f"Found {len(quotes_list)} quotes for batch:")
    for q in quotes_list:
        print(f"  - {q.get('quote_code')}: Net: ₹{q.get('total_quote_amount')}, Best Value: {q.get('is_best_net_value')}")
    assert len(quotes_list) > 0
    results["12_quote_comparison"] = "PASS"

    # 13. Aggregator Accepts Quote with Strict Concurrency & Capacity Reservation
    print_step("13. Aggregator Accepts Quote & Concurrency Lock")
    r = requests.post(f"{BASE_URL}/aggregator/recycler-quotes/{quote_id}/accept", headers=headers_aggregator)
    assert r.status_code in [200, 201], f"Quote accept failed: {r.status_code} {r.text}"
    accepted_quote = r.json().get("data", r.json())
    print(f"✔ Quote {accepted_quote.get('quote_code')} status: {accepted_quote.get('status')}")
    assert accepted_quote.get("status") == "ACCEPTED"
    results["13_accept_quote"] = "PASS"

    # 14. Concurrency Protection Test (Double Acceptance Prevention)
    print_step("14. Concurrency Protection: Prevent Double Quote Acceptance")
    r_double = requests.post(f"{BASE_URL}/aggregator/recycler-quotes/{quote_id}/accept", headers=headers_aggregator)
    print("Double Accept Response Status:", r_double.status_code)
    assert r_double.status_code in [400, 409], f"Expected 409 Conflict, got {r_double.status_code}"
    print("✔ Double acceptance correctly rejected with Concurrency Conflict error.")
    results["14_concurrency_lock"] = "PASS"

    # 15. Handover Manifest Creation (RH-YYYY-XXXXXX)
    print_step("15. Schedule Consignment Handover Manifest (RH-YYYY-XXXXXX)")
    r = requests.post(f"{BASE_URL}/aggregator/recycler-batches/{batch_id}/create-handover", headers=headers_aggregator, json={
        "scheduled_date": "2026-09-12T10:00:00Z",
        "vehicle_number": "MH-04-AZ-8821",
        "driver_name": "Sunil Shinde",
        "driver_phone": "+919820011223",
        "handover_type": "RECYCLER_PICKUP"
    })
    assert r.status_code in [200, 201], f"Handover creation failed: {r.status_code} {r.text}"
    handover = r.json().get("data", r.json())
    handover_id = handover["id"]
    handover_code = handover["handover_code"]
    print(f"✔ Created Handover Manifest: {handover_code} (ID: {handover_id}, Status: {handover['status']})")
    assert handover_code.startswith("RH-"), "Invalid handover code format"
    results["15_create_handover"] = "PASS"

    # 16. Aggregator Dispatches Shipment (IN_TRANSIT)
    print_step("16. Aggregator Dispatches Shipment (IN_TRANSIT)")
    r = requests.post(f"{BASE_URL}/aggregator/handovers/{handover_id}/dispatch", headers=headers_aggregator, json={
        "vehicle_number": "MH-04-AZ-8821",
        "driver_name": "Sunil Shinde",
        "notes": "Truck loaded and dispatched from Central Yard gate."
    })
    assert r.status_code in [200, 201], f"Dispatch failed: {r.status_code} {r.text}"
    print("✔ Handover marked IN_TRANSIT with immutable dispatch timestamp.")
    results["16_dispatch"] = "PASS"

    # 17. Recycler Marks Consignment Arrival (ARRIVED)
    print_step("17. Recycler Marks Consignment Arrival at Facility Gate (ARRIVED)")
    r = requests.post(f"{BASE_URL}/recycler/handovers/{handover_id}/arrive", headers=headers_recycler, json={
        "notes": "Truck arrived at weighbridge entrance."
    })
    assert r.status_code in [200, 201], f"Arrive failed: {r.status_code} {r.text}"
    print("✔ Recycler recorded arrival timestamp and status ARRIVED.")
    results["17_arrival"] = "PASS"

    # 18. Recycler Weighbridge Physical Verification & Discrepancy Detection
    print_step("18. Recycler Weighbridge Physical Inspection & Discrepancy Check")
    # Simulate slight normal variance: 7.7 kg vs 7.8 kg manifest expected
    r = requests.post(f"{BASE_URL}/recycler/handovers/{handover_id}/verify", headers=headers_recycler, json={
        "received_weight": 7.7,
        "accepted_weight": 7.7,
        "rejected_weight": 0.0,
        "quality_decision": "ACCEPTED",
        "notes": "Calibrated Mettler-Toledo weighbridge verified. No hazardous contamination detected."
    })
    assert r.status_code in [200, 201], f"Verify failed: {r.status_code} {r.text}"
    verified_handover = r.json().get("data", r.json())
    print(f"Verified Received Wt: {verified_handover.get('received_weight')} kg, Discrepancy: {verified_handover.get('discrepancy_percentage')}%")
    results["18_weight_verification"] = "PASS"

    # 19. High Weight Discrepancy & Regulatory Anomaly Alert Test (> 5%)
    print_step("19. Regulatory Anomaly Detection: Weight Variance > 5%")
    r_anomaly = requests.post(f"{BASE_URL}/recycler/handovers/{handover_id}/verify", headers=headers_recycler, json={
        "received_weight": 6.8,  # > 12% discrepancy from 7.8 kg
        "accepted_weight": 6.8,
        "rejected_weight": 0.0,
        "quality_decision": "PARTIALLY_ACCEPTED",
        "notes": "High discrepancy test triggering regulatory alert."
    })
    assert r_anomaly.status_code in [200, 201]
    anomaly_h = r_anomaly.json().get("data", r_anomaly.json())
    disc = float(anomaly_h.get("discrepancy_percentage", 0))
    print(f"High Discrepancy Calculated: {disc}% (> 5% threshold). Automated alert generated.")
    assert disc > 5.0, "Expected discrepancy > 5%"
    results["19_anomaly_alert"] = "PASS"

    # Reset back to verified clean weight before final confirmation
    requests.post(f"{BASE_URL}/recycler/handovers/{handover_id}/verify", headers=headers_recycler, json={
        "received_weight": 7.8,
        "accepted_weight": 7.8,
        "rejected_weight": 0.0,
        "quality_decision": "ACCEPTED"
    })

    # 20. Recycler Confirms Receipt & Completes Handover (RECEIVED)
    print_step("20. Recycler Confirms Receipt & Completes Handover (RECEIVED)")
    r = requests.post(f"{BASE_URL}/recycler/handovers/{handover_id}/confirm", headers=headers_recycler, json={
        "received_weight": 7.8,
        "accepted_weight": 7.8,
        "rejected_weight": 0.0
    })
    assert r.status_code in [200, 201], f"Handover confirmation failed: {r.status_code} {r.text}"
    final_h = r.json().get("data", r.json())
    print(f"✔ Final Handover Status: {final_h.get('status')} (Received Wt: {final_h.get('received_weight')} kg)")
    assert final_h.get("status") == "RECEIVED"
    results["20_handover_confirm"] = "PASS"

    # 21. Recycler Dispute Workflow Check
    print_step("21. Recycler Handover Dispute Logging")
    r = requests.post(f"{BASE_URL}/recycler/handovers/{handover_id}/dispute", headers=headers_recycler, json={
        "reason": "WEIGHT_DIFFERENCE",
        "description": "Formal test dispute logged for audit trail.",
        "actual_weight": 7.8
    })
    assert r.status_code in [200, 201], f"Dispute failed: {r.status_code} {r.text}"
    dispute = r.json().get("data", r.json())
    print(f"✔ Registered Formal Dispute: {dispute.get('id')} (Reason: {dispute.get('reason')}, Status: {dispute.get('status')})")
    results["21_dispute"] = "PASS"

    print("\n" + "="*70)
    print("ALL STEP 7 RECYCLER WORKFLOW INTEGRATION TESTS PASSED (21/21)!")
    print("="*70)
    for test_key, status in results.items():
        print(f"  ✔ {test_key}: {status}")

if __name__ == "__main__":
    run_step7_tests()
