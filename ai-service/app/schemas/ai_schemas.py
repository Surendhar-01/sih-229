from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "E-Waste AI/ML Microservice"
    version: str = "1.0.0"
    mode: str = "development_mock"

class ClassificationRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    user_hints: Optional[str] = None

class ClassificationResponse(BaseModel):
    material_category: str
    subcategory: str
    condition: str
    confidence: float
    possible_materials: List[str]
    estimated_weight_range: Dict[str, float]
    estimated_value_range: Dict[str, float]
    toxic_elements_detected: List[str]
    manual_override_recommended: bool = False
    is_development_mock: bool = True

class PriceAnalysisRequest(BaseModel):
    material_category: str
    subcategory: Optional[str] = None
    condition: Optional[str] = "INTACT"
    weight_kg: Optional[float] = 1.0
    location_district: Optional[str] = "Mumbai"

class PriceAnalysisResponse(BaseModel):
    material: str
    current_average_price_per_kg: float
    suggested_price_range: Dict[str, float]
    min_value: float = 0.0
    max_value: float = 0.0
    estimated_value: float = 0.0
    currency: str = "INR"
    market_trend: str = "STABLE"
    seven_day_moving_avg: float = 0.0
    thirty_day_moving_avg: float = 0.0
    breakdown_by_scrap_metal: Dict[str, float] = {}
    is_development_mock: bool = True

class CollectorRecommendationRequest(BaseModel):
    lot_id: str
    pickup_latitude: float = 0.0
    pickup_longitude: float = 0.0
    material_category_id: Optional[str] = None
    material_category: Optional[str] = None
    estimated_weight: Optional[float] = 0.0
    estimated_weight_kg: Optional[float] = 0.0
    priority: Optional[str] = "NORMAL"
    required_time_window: Optional[str] = None
    scoring_weights: Optional[Dict[str, float]] = None
    candidate_collectors: Optional[List[Dict[str, Any]]] = None

class CollectorScoreItem(BaseModel):
    collector_id: str
    collector_name: str
    vehicle_type: str
    distance_km: float
    match_score: float
    distance_score: float
    availability_score: float
    reliability_score: float
    workload_score: float
    material_capability_score: float
    reason: str
    composite_score: Optional[float] = None
    estimated_arrival_minutes: Optional[int] = 25
    completion_rate_pct: Optional[float] = 98.0

class CollectorRecommendationResponse(BaseModel):
    lot_id: Optional[str] = None
    recommended_collectors: List[CollectorScoreItem]
    is_development_mock: bool = False

class RecyclerRecommendationRequest(BaseModel):
    batch_id: Optional[str] = None
    lot_id: Optional[str] = None
    material_category_id: Optional[Union[int, str]] = None
    material_id: Optional[Union[int, str]] = None
    material_category: Optional[str] = None
    weight: Optional[float] = None
    total_weight_kg: Optional[float] = None
    condition: Optional[str] = "INTACT"
    aggregator_latitude: Optional[float] = 19.1197
    aggregator_longitude: Optional[float] = 72.8464
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    pickup_required: Optional[bool] = True
    candidate_recyclers: Optional[List[Dict[str, Any]]] = None

class RecyclerScoreItem(BaseModel):
    recycler_id: str
    facility_name: str
    cpcb_authorization_number: Optional[str] = "CPCB/EW-REG/MH-2023/401"
    is_cpcb_valid: bool = True
    distance_km: float
    offered_rate_per_kg: float
    match_score: float
    authorization_score: float
    material_capability_score: float
    capacity_score: float
    distance_score: float
    reliability_score: float
    pricing_score: float
    estimated_transport_cost: float
    estimated_net_value: float
    reason: str
    composite_rank: int = 1

class RecyclerRecommendationResponse(BaseModel):
    batch_id: Optional[str] = None
    lot_id: Optional[str] = None
    recommended_recyclers: List[RecyclerScoreItem]
    is_development_mock: bool = False

class AnomalyDetectionRequest(BaseModel):
    lot_id: str
    material_category: str
    weight_kg: float
    quoted_price_inr: float
    location_district: str
    collector_id: Optional[str] = None
    aggregator_id: Optional[str] = None

class AnomalyDetectionResponse(BaseModel):
    lot_id: str
    is_anomaly: bool
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    anomaly_score: float
    detector_type: str
    expected_price_range: Dict[str, float]
    deviation_percentage: float
    reason: str
    is_development_mock: bool = True

class FinancialAnomalyDetectionRequest(BaseModel):
    transaction_id: Optional[str] = None
    expected_amount: float
    actual_amount: float
    accepted_weight_kg: float
    rate_per_kg: float
    adjustment_amount: float = 0
    failed_payment_count: int = 0
    duplicate_reference_count: int = 0

class FinancialAnomalyDetectionResponse(BaseModel):
    is_anomaly: bool
    risk_level: str
    anomaly_score: float
    rules_triggered: List[str]
    expected_amount: float
    actual_amount: float
