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
        collectors = [
            CollectorScoreItem(
                collector_id="col-001",
                collector_name="Ramesh Babu (Verified Kabadiwala)",
                vehicle_type="AUTO_RICKSHAW",
                distance_km=2.4,
                composite_score=0.94,
                estimated_arrival_minutes=18,
                completion_rate_pct=98.5,
            ),
            CollectorScoreItem(
                collector_id="col-002",
                collector_name="Suresh Scrap Runner",
                vehicle_type="MINI_TRUCK",
                distance_km=4.8,
                composite_score=0.86,
                estimated_arrival_minutes=35,
                completion_rate_pct=92.0,
            ),
            CollectorScoreItem(
                collector_id="col-003",
                collector_name="Mohan Cycle Collection",
                vehicle_type="BICYCLE",
                distance_km=1.2,
                composite_score=0.81,
                estimated_arrival_minutes=12,
                completion_rate_pct=96.0,
            ),
        ]
        return CollectorRecommendationResponse(
            lot_id=req.lot_id,
            recommended_collectors=collectors,
            is_development_mock=True,
        )

    @staticmethod
    def recommend_recyclers(req: RecyclerRecommendationRequest) -> RecyclerRecommendationResponse:
        recyclers = [
            RecyclerScoreItem(
                recycler_id="rec-001",
                facility_name="EcoClean E-Waste Recyclers Pvt Ltd",
                cpcb_authorization_number="CPCB/EW-REG/MH-2023/401",
                is_cpcb_valid=True,
                distance_km=14.2,
                offered_rate_per_kg=24.50,
                composite_rank=1,
            ),
            RecyclerScoreItem(
                recycler_id="rec-002",
                facility_name="GreenTerra Metal Refining Ltd",
                cpcb_authorization_number="CPCB/EW-REG/MH-2022/198",
                is_cpcb_valid=True,
                distance_km=28.0,
                offered_rate_per_kg=26.00,
                composite_rank=2,
            ),
        ]
        return RecyclerRecommendationResponse(
            lot_id=req.lot_id,
            recommended_recyclers=recyclers,
            is_development_mock=True,
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
