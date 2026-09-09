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
        return ClassificationResponse(
            material_category="CRT_DISPLAY",
            subcategory="CRT_TV_21INCH",
            condition="INTACT",
            confidence=0.942,
            possible_materials=[
                "Leaded Glass (Barium/Strontium funnel)",
                "Copper Deflection Yoke",
                "Printed Circuit Board Assembly",
                "ABS High-Impact Casing",
            ],
            estimated_weight_range={"min_kg": 16.5, "max_kg": 20.0},
            estimated_value_range={"min_inr": 350.0, "max_inr": 480.0},
            toxic_elements_detected=["Lead (Pb)", "Cadmium (Cd)", "Phosphor dust"],
            manual_override_recommended=False,
            is_development_mock=True,
        )

    @staticmethod
    def analyze_price(req: PriceAnalysisRequest) -> PriceAnalysisResponse:
        base_rate = 380.0
        if req.material_category == "PCB_ASSEMBLY":
            base_rate = 420.0
        elif req.material_category == "CABLES_WIRES":
            base_rate = 580.0
        elif req.material_category == "LI_BATTERY":
            base_rate = 45.0

        return PriceAnalysisResponse(
            material=req.subcategory or req.material_category,
            current_average_price_per_kg=base_rate,
            suggested_price_range={"min": round(base_rate * 0.88, 2), "max": round(base_rate * 1.15, 2)},
            market_trend="STABLE_TO_RISING",
            seven_day_moving_avg=round(base_rate * 0.98, 2),
            thirty_day_moving_avg=round(base_rate * 0.95, 2),
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
