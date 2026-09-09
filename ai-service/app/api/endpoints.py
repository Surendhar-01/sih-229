from fastapi import APIRouter
from app.schemas.ai_schemas import (
    ClassificationRequest,
    ClassificationResponse,
    PriceAnalysisRequest,
    PriceAnalysisResponse,
    CollectorRecommendationRequest,
    CollectorRecommendationResponse,
    RecyclerRecommendationRequest,
    RecyclerRecommendationResponse,
    AnomalyDetectionRequest,
    AnomalyDetectionResponse,
    HealthResponse,
)
from app.services.mock_ai_service import MockAIService

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse()

@router.post("/material-classification", response_model=ClassificationResponse)
def classify_material(req: ClassificationRequest):
    return MockAIService.classify_image(req)

@router.post("/price-analysis", response_model=PriceAnalysisResponse)
def analyze_price(req: PriceAnalysisRequest):
    return MockAIService.analyze_price(req)

@router.post("/collector-recommendation", response_model=CollectorRecommendationResponse)
def recommend_collector(req: CollectorRecommendationRequest):
    return MockAIService.recommend_collectors(req)

@router.post("/recycler-recommendation", response_model=RecyclerRecommendationResponse)
def recommend_recycler(req: RecyclerRecommendationRequest):
    return MockAIService.recommend_recyclers(req)

@router.post("/anomaly-detection", response_model=AnomalyDetectionResponse)
def detect_anomaly(req: AnomalyDetectionRequest):
    return MockAIService.detect_anomaly(req)
