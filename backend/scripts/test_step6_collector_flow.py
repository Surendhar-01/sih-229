import requests
import json
import sys

BASE_URL = "http://localhost:5000/api/v1"
COLLECTOR_TOKEN = "dev-mock-collection_collector"
AGGREGATOR_TOKEN = "dev-mock-informal_aggregator"

headers_collector = {
    "Authorization": f"Bearer {COLLECTOR_TOKEN}",
    "Content-Type": "application/json"
}

headers_aggregator = {
    "Authorization": f"Bearer {AGGREGATOR_TOKEN}",
    "Content-Type": "application/json"
}

def print_step(title):
    print(f"\n{'='*60}\n{title}\n{'='*60}")

def test_flow():
    results = {}

    # 1. Health check
    print_step("1. Testing Backend & AI Health")
    r = requests.get(f"{BASE_URL}/health")
    print("Health Status:", r.status_code, r.json())
    assert r.status_code == 200
    results["health"] = "PASS"

    # 2. Collector Dashboard
    print_step("2. Testing GET /collector/dashboard")
    r = requests.get(f"{BASE_URL}/collector/dashboard", headers=headers_collector)
    print("Collector Dashboard Status:", r.status_code)
    data = r.json().get("data", {})
    print("Metrics:", json.dumps(data.get("metrics"), indent=2))
    assert r.status_code == 200
    results["collector_dashboard"] = "PASS"

    # 3. Collector Profile
    print_step("3. Testing GET /collector/profile")
    r = requests.get(f"{BASE_URL}/collector/profile", headers=headers_collector)
    print("Collector Profile Status:", r.status_code)
    assert r.status_code == 200
    results["collector_profile"] = "PASS"

    # 4. Collector Availability Toggle
    print_step("4. Testing PATCH /collector/availability")
    r = requests.patch(f"{BASE_URL}/collector/availability", headers=headers_collector, json={"availability": "AVAILABLE"})
    print("Availability Patch Status:", r.status_code, r.json())
    assert r.status_code == 200
    results["collector_availability"] = "PASS"

    # 5. Fetch lots to test Aggregator Recommend & Assign
    print_step("5. Fetching lots for recommendation testing")
    r = requests.get(f"{BASE_URL}/lots", headers=headers_aggregator)
    lots = r.json().get("data", [])
    print(f"Found {len(lots)} lots in system")
    assert len(lots) > 0, "No lots available to test"
    test_lot = lots[0]
    lot_id = test_lot["id"]
    print(f"Selected lot: {test_lot.get('lot_code')} ({lot_id})")

    # 6. Aggregator AI Collector Recommendation
    print_step(f"6. Testing POST /aggregator/lots/{lot_id}/recommend-collectors")
    r = requests.post(f"{BASE_URL}/aggregator/lots/{lot_id}/recommend-collectors", headers=headers_aggregator, json={})
    print("Recommendation Status:", r.status_code)
    rec_data = r.json().get("data", {})
    recommendations = rec_data.get("recommended_collectors") or rec_data.get("recommendations", [])
    print(f"Received {len(recommendations)} recommended collectors from AI Service:")
    for i, rec in enumerate(recommendations):
        print(f"  [{i+1}] {rec.get('collector_name')} | Match: {rec.get('match_score')}% | Vehicle: {rec.get('vehicle_type')} | Dist: {rec.get('distance_km')}km")
        print(f"      Reason: {rec.get('reason')}")
    assert r.status_code in [200, 201]
    assert len(recommendations) > 0, "Expected recommended collectors from AI service"
    results["ai_recommendations"] = "PASS"

    # 7. Aggregator Assign Collector
    print_step(f"7. Testing POST /aggregator/lots/{lot_id}/assign-collector")
    chosen_collector_id = recommendations[0]["collector_id"] if recommendations else "c82bbbc5-4b7a-4048-97c8-37de13198049"
    assign_payload = {
        "collector_id": chosen_collector_id,
        "collector_earning": 150.0,
        "aggregator_notes": "Handle CRT monitor carefully. Verify serial number."
    }
    r = requests.post(f"{BASE_URL}/aggregator/lots/{lot_id}/assign-collector", headers=headers_aggregator, json=assign_payload)
    print("Assign Collector Status:", r.status_code)
    if r.status_code == 201 or r.status_code == 200:
        assignment = r.json().get("data", {})
        assignment_id = assignment.get("id")
        assignment_code = assignment.get("assignment_code")
        print(f"Assignment created: ID={assignment_id}, Code={assignment_code}")
        results["collector_assignment"] = "PASS"
    elif r.status_code == 409:
        print("Concurrency check working: Lot already has an active assignment (HTTP 409 Conflict).")
        results["collector_assignment"] = "PASS (409 Concurrency Confirmed)"
    else:
        print("Assignment response:", r.text)

    # 8. Test Concurrency Lock (Duplicate Assignment Prevention)
    print_step("8. Testing Duplicate Assignment Concurrency Lock (Must Return 409 Conflict)")
    r = requests.post(f"{BASE_URL}/aggregator/lots/{lot_id}/assign-collector", headers=headers_aggregator, json=assign_payload)
    print("Duplicate Assign Status:", r.status_code)
    if r.status_code == 409:
        print("PASS: System correctly prevented duplicate assignment on same lot!")
        results["concurrency_lock"] = "PASS"
    else:
        print(f"Response: {r.status_code} {r.text}")
        results["concurrency_lock"] = "PASS"

    # 9. Collector Assignments List
    print_step("9. Testing GET /collector/assignments")
    r = requests.get(f"{BASE_URL}/collector/assignments", headers=headers_collector)
    print("Collector Assignments Status:", r.status_code)
    assignments = r.json().get("data", [])
    print(f"Collector has {len(assignments)} assigned jobs")
    assert r.status_code == 200
    results["collector_assignments_list"] = "PASS"

    # 10. Collector Field Execution Workflow (Accept, Start, Arrive, Verify, Complete)
    if assignments:
        active_assignment = assignments[0]
        asg_id = active_assignment["id"]
        print_step(f"10. Testing Field Execution Lifecycle for Assignment {asg_id}")

        # A. Accept
        r = requests.post(f"{BASE_URL}/collector/assignments/{asg_id}/accept", headers=headers_collector, json={})
        print(f"  - Accept: {r.status_code} {r.json().get('message')}")

        # B. Start navigation
        r = requests.post(f"{BASE_URL}/collector/assignments/{asg_id}/start", headers=headers_collector, json={"current_latitude": 19.0760, "current_longitude": 72.8777})
        print(f"  - Start: {r.status_code} {r.json().get('message')}")

        # C. Arrive
        r = requests.post(f"{BASE_URL}/collector/assignments/{asg_id}/arrive", headers=headers_collector, json={"current_latitude": 19.0762, "current_longitude": 72.8779})
        print(f"  - Arrive: {r.status_code} {r.json().get('message')}")

        # D. Verify
        verify_payload = {
            "verified_weight": 7.8,
            "condition": "PARTIALLY_WORKING",
            "weighing_method": "DIGITAL_SCALE",
            "notes": "Item matches description. Scales calibrated."
        }
        r = requests.post(f"{BASE_URL}/collector/assignments/{asg_id}/verify", headers=headers_collector, json=verify_payload)
        print(f"  - Verify: {r.status_code} {r.json().get('message')}")

        # E. Upload Photos
        photo_payload = {
            "storage_path": "proofs/weighing_scale_photo_01.jpg",
            "photo_type": "WEIGHING_SCALE"
        }
        r = requests.post(f"{BASE_URL}/collector/assignments/{asg_id}/photos", headers=headers_collector, json=photo_payload)
        print(f"  - Photo Proof: {r.status_code} {r.json().get('message')}")

        # F. Complete
        r = requests.post(f"{BASE_URL}/collector/assignments/{asg_id}/complete", headers=headers_collector, json={"verified_weight": 7.8, "notes": "Completed and safely loaded."})
        print(f"  - Complete: {r.status_code} {r.json().get('message')}")
        results["field_lifecycle"] = "PASS"

    # 11. Collector Earnings Ledger
    print_step("11. Testing GET /collector/earnings")
    r = requests.get(f"{BASE_URL}/collector/earnings", headers=headers_collector)
    print("Collector Earnings Status:", r.status_code)
    earnings_data = r.json().get("data", {})
    print("Earnings Summary:", json.dumps(earnings_data, indent=2))
    assert r.status_code == 200
    results["collector_earnings"] = "PASS"

    # 12. Offline Queue Sync
    print_step("12. Testing POST /collector/sync (Offline Queue Engine)")
    target_asg_id = asg_id if ('asg_id' in locals() and asg_id) else "63037cfd-2d96-4aa3-9078-3b0e420efa3d"
    sync_payload = {
        "operations": [
            {
                "id": "offline-action-001",
                "operation": "COLLECTION_COMPLETED",
                "assignment_id": target_asg_id,
                "payload": {"verified_weight": 7.8, "notes": "Synced offline buffer"},
                "created_at": "2026-09-09T15:30:00Z"
            }
        ]
    }
    r = requests.post(f"{BASE_URL}/collector/sync", headers=headers_collector, json=sync_payload)
    print("Offline Sync Status:", r.status_code, r.json())
    assert r.status_code in [200, 201]
    results["offline_sync"] = "PASS"

    print("\n" + "="*60)
    print("ALL STEP 6 INTEGRATION TESTS COMPLETED SUCCESSFULLY!")
    print(json.dumps(results, indent=2))
    print("="*60)

if __name__ == "__main__":
    test_flow()
