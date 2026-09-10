import math
from typing import List, Dict, Any, Optional
from app.schemas.ai_schemas import (
    ClassificationRequest,
    ClassificationResponse,
    PriceAnalysisRequest,
    PriceAnalysisResponse,
    CollectorRecommendationRequest,
    CollectorRecommendationResponse,
    CollectorScoreItem,
    RecyclerRecommendationRequest,
    RecyclerRecommendationResponse,
    RecyclerScoreItem,
    AnomalyDetectionRequest,
    AnomalyDetectionResponse,
)

class MockAIService:
    @staticmethod
    def classify_image(req: ClassificationRequest) -> ClassificationResponse:
        hint = (req.user_hints or "").lower()
        img = (req.image_url or req.image_base64 or "").lower()

        # Dynamic detection based on hints/image context
        if "laptop" in hint or "computer" in hint or "macbook" in hint:
            return ClassificationResponse(
                material_category="CONSUMER_ELECTRONICS",
                subcategory="Laptop Computer",
                condition="NOT_WORKING",
                confidence=0.912,
                possible_materials=["Lithium-Polymer Cell", "Al-Mg Alloy Frame", "Motherboard FR4", "Copper Heatpipe"],
                estimated_weight_range={"min_kg": 1.8, "max_kg": 2.6},
                estimated_value_range={"min_inr": 1200.0, "max_inr": 1600.0},
                toxic_elements_detected=["Lead solder traces", "Lithium"],
                manual_override_recommended=False,
                is_development_mock=True,
            )
        elif "phone" in hint or "mobile" in hint or "smartphone" in hint:
            return ClassificationResponse(
                material_category="CONSUMER_ELECTRONICS",
                subcategory="Mobile Phone / Smartphone",
                condition="PARTIALLY_WORKING",
                confidence=0.865,
                possible_materials=["OLED Display Panel", "Gold Plated Contacts", "Cobalt Li-Ion Battery", "Rare Earth Neodymium"],
                estimated_weight_range={"min_kg": 0.15, "max_kg": 0.25},
                estimated_value_range={"min_inr": 350.0, "max_inr": 550.0},
                toxic_elements_detected=["Lithium", "Arsenic in microchips"],
                manual_override_recommended=False,
                is_development_mock=True,
            )
        elif "fridge" in hint or "refrigerator" in hint or "appliance" in hint:
            return ClassificationResponse(
                material_category="LARGE_APPLIANCES",
                subcategory="Single/Double Door Refrigerator",
                condition="DAMAGED",
                confidence=0.785,
                possible_materials=["Hermetic Compressor Steel", "Copper Tubing", "Cyclopentane Insulation", "Condenser Coils"],
                estimated_weight_range={"min_kg": 35.0, "max_kg": 45.0},
                estimated_value_range={"min_inr": 1500.0, "max_inr": 2100.0},
                toxic_elements_detected=["R134a/R600a Refrigerant Gas"],
                manual_override_recommended=False,
                is_development_mock=True,
            )
        elif "battery" in hint or "inverter" in hint or "lead" in hint:
            return ClassificationResponse(
                material_category="ELECTRONIC_COMPONENTS",
                subcategory="Lead-Acid UPS Inverter Battery",
                condition="DAMAGED",
                confidence=0.895,
                possible_materials=["Pure Lead Sponge", "Sulfuric Acid Electrolyte", "Polypropylene Case"],
                estimated_weight_range={"min_kg": 12.0, "max_kg": 18.0},
                estimated_value_range={"min_inr": 900.0, "max_inr": 1400.0},
                toxic_elements_detected=["Lead (Pb)", "Sulfuric Acid (H2SO4)"],
                manual_override_recommended=False,
                is_development_mock=True,
            )
        elif "broken" in hint or "scrap" in hint or "unclear" in hint:
            # Low confidence demonstration (< 0.50)
            return ClassificationResponse(
                material_category="CONSUMER_ELECTRONICS",
                subcategory="Unknown / Mixed Device",
                condition="SCRAP_BROKEN",
                confidence=0.420,
                possible_materials=["Mixed Circuit Boards", "Plastic Housing"],
                estimated_weight_range={"min_kg": 1.0, "max_kg": 3.0},
                estimated_value_range={"min_inr": 150.0, "max_inr": 350.0},
                toxic_elements_detected=["Unidentified electronic components"],
                manual_override_recommended=True,
                is_development_mock=True,
            )
        else:
            # Default standard Laptop classification with 91.2% confidence
            return ClassificationResponse(
                material_category="CONSUMER_ELECTRONICS",
                subcategory="Laptop Computer",
                condition="NOT_WORKING",
                confidence=0.912,
                possible_materials=["Al-Mg Alloy Frame", "Motherboard FR4", "Lithium Battery", "Copper"],
                estimated_weight_range={"min_kg": 2.0, "max_kg": 2.8},
                estimated_value_range={"min_inr": 1200.0, "max_inr": 1600.0},
                toxic_elements_detected=["Lead traces", "Lithium"],
                manual_override_recommended=False,
                is_development_mock=True,
            )

    @staticmethod
    def analyze_price(req: PriceAnalysisRequest) -> PriceAnalysisResponse:
        weight = req.weight_kg or 1.0
        cat = (req.material_category or "").upper()
        sub = (req.subcategory or "").lower()
        condition = (req.condition or "INTACT").upper()

        # Base rate per unit or per kg
        base_rate = 180.0
        if "laptop" in sub:
            base_unit_price = 1400.0
            min_val = round(base_unit_price * 0.85, 2)
            max_val = round(base_unit_price * 1.15, 2)
            est_val = round(base_unit_price, 2)
            avg_per_kg = round(base_unit_price / max(weight, 1.0), 2)
        elif "phone" in sub or "mobile" in sub:
            base_unit_price = 450.0
            min_val = round(base_unit_price * 0.80, 2)
            max_val = round(base_unit_price * 1.20, 2)
            est_val = round(base_unit_price, 2)
            avg_per_kg = round(base_unit_price / max(weight, 0.2), 2)
        elif "refrigerator" in sub or "fridge" in sub:
            base_unit_price = 1800.0
            min_val = round(base_unit_price * 0.85, 2)
            max_val = round(base_unit_price * 1.20, 2)
            est_val = round(base_unit_price, 2)
            avg_per_kg = round(base_unit_price / max(weight, 30.0), 2)
        elif "battery" in sub or cat == "LI_BATTERY":
            rate_kg = 90.0
            min_val = round(rate_kg * 0.85 * weight, 2)
            max_val = round(rate_kg * 1.15 * weight, 2)
            est_val = round(rate_kg * weight, 2)
            avg_per_kg = rate_kg
        else:
            rate_kg = 220.0
            min_val = round(rate_kg * 0.85 * weight, 2)
            max_val = round(rate_kg * 1.20 * weight, 2)
            est_val = round(rate_kg * weight, 2)
            avg_per_kg = rate_kg

        # Condition multiplier
        multiplier = 1.0
        if condition in ("WORKING", "INTACT"):
            multiplier = 1.15
        elif condition in ("DAMAGED", "DAMAGED_CRUSHED"):
            multiplier = 0.80
        elif condition in ("SCRAP", "SCRAP_BROKEN", "SCRAP_BURNT"):
            multiplier = 0.65

        min_val = round(min_val * multiplier, 2)
        max_val = round(max_val * multiplier, 2)
        est_val = round(est_val * multiplier, 2)

        return PriceAnalysisResponse(
            material=req.subcategory or req.material_category,
            current_average_price_per_kg=avg_per_kg,
            suggested_price_range={"min": round(avg_per_kg * 0.88, 2), "max": round(avg_per_kg * 1.15, 2)},
            min_value=min_val,
            max_value=max_val,
            estimated_value=est_val,
            currency="INR",
            market_trend="STABLE_TO_RISING",
            seven_day_moving_avg=round(avg_per_kg * 0.98, 2),
            thirty_day_moving_avg=round(avg_per_kg * 0.95, 2),
            breakdown_by_scrap_metal={
                "copper_scrap_mcx": 780.50,
                "aluminum_commercial": 210.00,
                "gold_recovery_index": 72.00,
                "mixed_plastics_hips": 28.00,
            },
            is_development_mock=True,
        )


    @staticmethod
    def recommend_collectors(req: CollectorRecommendationRequest) -> CollectorRecommendationResponse:
        weight = req.estimated_weight or req.estimated_weight_kg or 5.0
        
        # Base candidate roster (fallback or seed pool if none passed from database)
        candidates = req.candidate_collectors or [
            {
                "collector_id": "usr-collector-active-01",
                "collector_name": "Vikram Shinde (Runner #01)",
                "vehicle_type": "MINI_TRUCK",
                "distance_km": 2.4,
                "availability": "AVAILABLE",
                "active_jobs": 0,
                "reliability": 96.5,
                "completion_rate": 98.0,
            },
            {
                "collector_id": "usr-collector-active-02",
                "collector_name": "Ramesh Babu (Runner #04)",
                "vehicle_type": "AUTO_RICKSHAW",
                "distance_km": 3.8,
                "availability": "AVAILABLE",
                "active_jobs": 1,
                "reliability": 94.0,
                "completion_rate": 95.0,
            },
            {
                "collector_id": "usr-collector-active-03",
                "collector_name": "Sunil Jadhav (Fast Cycle)",
                "vehicle_type": "BICYCLE",
                "distance_km": 1.1,
                "availability": "AVAILABLE",
                "active_jobs": 0,
                "reliability": 91.0,
                "completion_rate": 94.0,
            },
            {
                "collector_id": "usr-collector-active-04",
                "collector_name": "Arjun Rathod (Cargo Van)",
                "vehicle_type": "MINI_TRUCK",
                "distance_km": 6.5,
                "availability": "BUSY",
                "active_jobs": 2,
                "reliability": 95.0,
                "completion_rate": 96.5,
            },
        ]

        scored_items = []
        for c in candidates:
            dist = float(c.get("distance_km", 3.0))
            avail = str(c.get("availability", "AVAILABLE")).upper()
            workload = int(c.get("active_jobs", 0))
            rel = float(c.get("reliability", 90.0))
            v_type = str(c.get("vehicle_type", "AUTO_RICKSHAW")).upper()

            # 1. Distance score (linear decay)
            dist_score = max(10.0, min(100.0, 100.0 - (dist * 4.5)))

            # 2. Availability score
            if avail == "AVAILABLE":
                avail_score = 100.0
            elif avail == "BUSY":
                avail_score = 35.0
            else:
                avail_score = 5.0

            # 3. Workload score
            workload_score = max(15.0, min(100.0, 100.0 - (workload * 25.0)))

            # 4. Reliability score
            rel_score = min(100.0, max(40.0, rel))

            # 5. Material capability vs vehicle payload
            if weight > 30.0:
                cap_scores = {"MINI_TRUCK": 98.0, "AUTO_RICKSHAW": 82.0, "MOTORCYCLE": 35.0, "BICYCLE": 15.0, "ON_FOOT": 5.0}
            elif weight > 10.0:
                cap_scores = {"AUTO_RICKSHAW": 98.0, "MINI_TRUCK": 92.0, "MOTORCYCLE": 78.0, "BICYCLE": 35.0, "ON_FOOT": 15.0}
            else:
                cap_scores = {"BICYCLE": 98.0, "MOTORCYCLE": 98.0, "AUTO_RICKSHAW": 92.0, "MINI_TRUCK": 82.0, "ON_FOOT": 70.0}
            mat_score = cap_scores.get(v_type, 85.0)

            # Composite match score (0 - 100)
            final_match = (
                0.25 * dist_score
                + 0.20 * avail_score
                + 0.20 * rel_score
                + 0.15 * workload_score
                + 0.20 * mat_score
            )
            final_match = round(min(100.0, max(1.0, final_match)), 1)

            # Explainable AI reason
            reasons = []
            if dist <= 3.0:
                reasons.append(f"Nearby ({dist} km)")
            else:
                reasons.append(f"{dist} km away")
            if avail == "AVAILABLE":
                reasons.append("currently available")
            if mat_score >= 90:
                reasons.append(f"ideal {v_type.replace('_', ' ').lower()} payload for {weight} kg")
            if rel >= 95:
                reasons.append(f"high reliability ({rel}%)")

            scored_items.append(
                CollectorScoreItem(
                    collector_id=str(c.get("collector_id")),
                    collector_name=str(c.get("collector_name", "Field Collector")),
                    vehicle_type=v_type,
                    distance_km=round(dist, 1),
                    match_score=final_match,
                    distance_score=round(dist_score, 1),
                    availability_score=round(avail_score, 1),
                    reliability_score=round(rel_score, 1),
                    workload_score=round(workload_score, 1),
                    material_capability_score=round(mat_score, 1),
                    reason=", ".join(reasons).capitalize(),
                    composite_score=round(final_match / 100.0, 2),
                    estimated_arrival_minutes=max(10, int(dist * 6)),
                    completion_rate_pct=float(c.get("completion_rate", 95.0)),
                )
            )

        # Sort highest match score first
        scored_items.sort(key=lambda x: x.match_score, reverse=True)

        return CollectorRecommendationResponse(
            lot_id=req.lot_id,
            recommended_collectors=scored_items,
            is_development_mock=False,
        )

    @staticmethod
    def recommend_recyclers(req: RecyclerRecommendationRequest) -> RecyclerRecommendationResponse:
        weight = float(req.weight or req.total_weight_kg or 50.0)
        agg_lat = float(req.aggregator_latitude or req.pickup_latitude or 19.1197)
        agg_lng = float(req.aggregator_longitude or req.pickup_longitude or 72.8464)
        cat_id = req.material_category_id
        
        # Candidate pool: use candidates passed by NestJS if provided, else standard pool
        raw_candidates = req.candidate_recyclers
        if not raw_candidates or len(raw_candidates) == 0:
            raw_candidates = [
                {
                    "recycler_id": "ba342f1f-c157-4708-b572-46beecccd868",
                    "facility_name": "EcoClean E-Waste Recyclers Pvt Ltd",
                    "cpcb_authorization_number": "CPCB/EW-REG/MH-2023/401",
                    "is_authorized": True,
                    "authorization_valid": True,
                    "latitude": 19.1176,
                    "longitude": 73.0169,
                    "rate_per_kg": 32.50,
                    "available_capacity": 2500.0,
                    "min_weight": 5.0,
                    "max_weight": 5000.0,
                    "reliability_score": 96.0,
                    "accepts_material": True,
                },
                {
                    "recycler_id": "rec-002-greenterra",
                    "facility_name": "GreenTerra Metal Refining & Dismantling Ltd",
                    "cpcb_authorization_number": "CPCB/EW-REG/MH-2022/198",
                    "is_authorized": True,
                    "authorization_valid": True,
                    "latitude": 19.2183,
                    "longitude": 72.9781,
                    "rate_per_kg": 28.00,
                    "available_capacity": 1200.0,
                    "min_weight": 10.0,
                    "max_weight": 3000.0,
                    "reliability_score": 91.0,
                    "accepts_material": True,
                },
                {
                    "recycler_id": "rec-003-apexmetal",
                    "facility_name": "Apex Electronic Waste Processors",
                    "cpcb_authorization_number": "CPCB/EW-REG/MH-2021/045",
                    "is_authorized": True,
                    "authorization_valid": False,  # Expired license demo
                    "latitude": 19.0330,
                    "longitude": 73.0297,
                    "rate_per_kg": 34.00,
                    "available_capacity": 500.0,
                    "min_weight": 10.0,
                    "max_weight": 2000.0,
                    "reliability_score": 85.0,
                    "accepts_material": True,
                },
            ]

        scored_items: List[RecyclerScoreItem] = []

        for c in raw_candidates:
            rec_id = str(c.get("recycler_id"))
            facility_name = str(c.get("facility_name", "Authorized Recycler"))
            auth_num = str(c.get("cpcb_authorization_number", "CPCB/EW-REG/MH-2023/401"))
            is_valid_auth = bool(c.get("is_authorized", True) and c.get("authorization_valid", True))
            accepts_mat = bool(c.get("accepts_material", True))
            
            # Recycler coordinates & distance
            r_lat = float(c.get("latitude", 19.1176))
            r_lng = float(c.get("longitude", 73.0169))
            
            # Simple Haversine approx (km)
            dlat = math.radians(r_lat - agg_lat)
            dlng = math.radians(r_lng - agg_lng)
            a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(agg_lat)) * math.cos(math.radians(r_lat)) * math.sin(dlng / 2) ** 2
            c_dist = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            dist_km = round(max(0.5, 6371.0 * c_dist), 1)

            # Available capacity & rate
            avail_cap = float(c.get("available_capacity", 1500.0))
            rate = float(c.get("rate_per_kg", 25.0))
            rel = float(c.get("reliability_score", 90.0))

            # 1. Authorization score
            auth_score = 100.0 if is_valid_auth else 0.0

            # 2. Material capability score
            mat_score = 100.0 if accepts_mat else 0.0

            # 3. Capacity score (batch weight vs available capacity)
            if avail_cap <= 0:
                cap_score = 0.0
            elif avail_cap < weight:
                cap_score = round((avail_cap / weight) * 50.0, 1)
            else:
                cap_score = round(min(100.0, 80.0 + min(20.0, (avail_cap - weight) / 50.0)), 1)

            # 4. Distance score
            dist_score = round(max(10.0, min(100.0, 100.0 - (dist_km * 2.0))), 1)

            # 5. Reliability score
            rel_score = round(min(100.0, max(20.0, rel)), 1)

            # 6. Pricing & Net Value Economics
            # Base material value = weight * rate
            base_val = round(weight * rate, 2)
            # Estimated transport cost = ₹150 base + ₹14/km + ₹1.5/kg
            transport_cost = round(150.0 + (dist_km * 14.0) + (weight * 1.5), 2)
            net_val = round(max(0.0, base_val - transport_cost), 2)
            
            # Pricing score compared to standard benchmark (e.g. ₹28/kg)
            benchmark_rate = 28.0
            price_score = round(min(100.0, max(20.0, 50.0 + ((rate - benchmark_rate) * 5.0))), 1)

            # Composite Match Score (0 - 100)
            if not is_valid_auth or not accepts_mat:
                # Disqualified if expired or unaccepted material
                match_score = 0.0
            else:
                match_score = (
                    0.20 * auth_score
                    + 0.20 * mat_score
                    + 0.15 * cap_score
                    + 0.15 * dist_score
                    + 0.15 * rel_score
                    + 0.15 * price_score
                )
                match_score = round(min(100.0, max(0.0, match_score)), 1)

            # Explainable AI reason
            reasons = []
            if not is_valid_auth:
                reasons.append("Authorization expired or unverified")
            elif not accepts_mat:
                reasons.append("Does not accept this material category")
            else:
                reasons.append(f"Verified CPCB recycler")
                if dist_km <= 15.0:
                    reasons.append(f"nearby ({dist_km} km)")
                else:
                    reasons.append(f"{dist_km} km distance")
                if cap_score >= 80:
                    reasons.append(f"ample processing capacity ({int(avail_cap)} kg)")
                if rel >= 95:
                    reasons.append(f"high reliability ({rel}%)")
                reasons.append(f"rate ₹{rate}/kg with est. net value ₹{int(net_val)}")

            reason_str = ", ".join(reasons).capitalize()

            scored_items.append(
                RecyclerScoreItem(
                    recycler_id=rec_id,
                    facility_name=facility_name,
                    cpcb_authorization_number=auth_num,
                    is_cpcb_valid=is_valid_auth,
                    distance_km=dist_km,
                    offered_rate_per_kg=rate,
                    match_score=match_score,
                    authorization_score=auth_score,
                    material_capability_score=mat_score,
                    capacity_score=cap_score,
                    distance_score=dist_score,
                    reliability_score=rel_score,
                    pricing_score=price_score,
                    estimated_transport_cost=transport_cost,
                    estimated_net_value=net_val,
                    reason=reason_str,
                    composite_rank=1,
                )
            )

        # Sort descending by match score
        scored_items.sort(key=lambda x: x.match_score, reverse=True)
        for i, item in enumerate(scored_items):
            item.composite_rank = i + 1

        return RecyclerRecommendationResponse(
            batch_id=req.batch_id or req.lot_id,
            lot_id=req.lot_id,
            recommended_recyclers=scored_items,
            is_development_mock=False,
        )

    @staticmethod
    def detect_anomaly(req: AnomalyDetectionRequest) -> AnomalyDetectionResponse:
        expected_min = 320.0
        expected_max = 450.0

        is_anomaly = False
        risk_level = "LOW"
        deviation = 0.0
        reason = "Transaction price and weight are within typical historical bounds for this district."

        if req.quoted_price_inr > expected_max * 1.5:
            is_anomaly = True
            risk_level = "HIGH"
            deviation = round(((req.quoted_price_inr - expected_max) / expected_max) * 100, 2)
            reason = f"Quoted price (₹{req.quoted_price_inr}) is {deviation}% above normal regional benchmarks. Possible subsidy manipulation."
        elif req.quoted_price_inr < expected_min * 0.4:
            is_anomaly = True
            risk_level = "MEDIUM"
            deviation = round(((expected_min - req.quoted_price_inr) / expected_min) * 100, 2)
            reason = f"Quoted price is {deviation}% below minimum scrap value. Potential exploitation of informal waste-picker."

        return AnomalyDetectionResponse(
            lot_id=req.lot_id,
            is_anomaly=is_anomaly,
            risk_level=risk_level,
            anomaly_score=0.91 if is_anomaly else 0.08,
            detector_type="STATISTICAL_IQR_ZSCORE",
            expected_price_range={"min": expected_min, "max": expected_max},
            deviation_percentage=deviation,
            reason=reason,
            is_development_mock=True,
        )
