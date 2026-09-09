from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

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
    pickup_latitude: float
    pickup_longitude: float
    material_category: str
    estimated_weight_kg: float
    scoring_weights: Optional[Dict[str, float]] = None

class CollectorScoreItem(BaseModel):
    collector_id: str
    collector_name: str
    vehicle_type: str
    distance_km: float
    composite_score: float
    estimated_arrival_minutes: int
    completion_rate_pct: float

class CollectorRecommendationResponse(BaseModel):
    lot_id: str
    recommended_collectors: List[CollectorScoreItem]
    is_development_mock: bool = True

class RecyclerRecommendationRequest(BaseModel):
    lot_id: str
    material_category: str
    total_weight_kg: float
    pickup_latitude: float
    pickup_longitude: float

class RecyclerScoreItem(BaseModel):
    recycler_id: str
    facility_name: str
    cpcb_authorization_number: str
    is_cpcb_valid: bool
    distance_km: float
    offered_rate_per_kg: float
    composite_rank: int

class RecyclerRecommendationResponse(BaseModel):
    lot_id: str
    recommended_recyclers: List[RecyclerScoreItem]
    is_development_mock: bool = True

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
