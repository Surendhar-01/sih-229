from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional
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
    FinancialAnomalyDetectionRequest,
    FinancialAnomalyDetectionResponse,
    HealthResponse,
    VoiceIntentRequest,
    VoiceIntentResponse,
)
from app.schemas.voice_schemas import (
    VoiceCommandRequest,
    VoiceCommandResponse,
    AudioTranscriptionResponse,
)
from app.services.mock_ai_service import MockAIService
from app.services.voice_nlp_service import VoiceNLPService
from app.services.whisper_service import WhisperService

router = APIRouter()

@router.post("/voice-command-nlp", response_model=VoiceCommandResponse)
def parse_voice_command(req: VoiceCommandRequest):
    """
    Multilingual semantic intent and entity extraction for native Hindi, Marathi,
    Hinglish, and English voice commands across the entire platform.
    """
    return VoiceNLPService.parse_command(req)

@router.post("/transcribe-audio", response_model=AudioTranscriptionResponse)
async def transcribe_audio_file(
    file: UploadFile = File(...),
    language: Optional[str] = Form(default=None),
):
    """
    Transcribe raw audio file via Whisper STT supporting Hindi, Marathi, and English.
    """
    contents = await file.read()
    result = WhisperService.transcribe_audio(
        audio_bytes=contents,
        filename=file.filename or "audio.wav",
        language_hint=language,
    )
    return AudioTranscriptionResponse(
        transcript=result.get("transcript", ""),
        language=result.get("language", language or "en"),
        confidence=result.get("confidence", 0.90),
    )

@router.post("/voice-intent", response_model=VoiceIntentResponse)
def voice_intent(req: VoiceIntentRequest):
    """Map a browser-transcribed voice request to a safe, confirmation-required role."""
    # Use the advanced multilingual NLP service
    parsed = VoiceNLPService.parse_command(VoiceCommandRequest(transcript=req.transcript))
    role = None
    if parsed.entities.get("target_role"):
        role = parsed.entities["target_role"]
    elif parsed.intent == "ROLE_SELECTION":
        role = parsed.action
    else:
        text = req.transcript.strip().lower()
        role_keywords = {
            "INFORMAL_AGGREGATOR": ("collector", "kabadi", "scrap collector", "कलेक्टर", "कबाड़ी", "कबाडी", "संकलक"),
            "AUTHORIZED_RECYCLER": ("recycler", "recycling centre", "recycling center", "रीसायकलर", "रिसायकलर"),
            "GOVERNMENT_ADMIN": ("government", "admin", "cpcb", "सरकार", "प्रशासन", "सरकारी"),
            "USER": ("recycle my", "old mobile", "e-waste", "ewaste", "पुराना मोबाइल", "ई-वेस्ट", "ईवेस्ट"),
        }
        for r, words in role_keywords.items():
            if any(word in text for word in words):
                role = r
                break

    if role:
        return VoiceIntentResponse(transcript=req.transcript, intent="ROLE_SELECTION", role=role, confidence=0.92)
    return VoiceIntentResponse(transcript=req.transcript, intent="UNKNOWN", role=None, confidence=0.2)

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

@router.post("/financial-anomaly-detection", response_model=FinancialAnomalyDetectionResponse)
def detect_financial_anomaly(req: FinancialAnomalyDetectionRequest):
    rules = []
    expected = round(req.accepted_weight_kg * req.rate_per_kg, 2)
    baseline = req.expected_amount or expected
    deviation = abs(req.actual_amount - baseline) / max(baseline, 1)
    if req.duplicate_reference_count > 0:
        rules.append("DUPLICATE_PAYMENT_REFERENCE")
    if deviation > 0.10:
        rules.append("UNEXPECTED_AMOUNT")
    if abs(req.adjustment_amount) > max(baseline * 0.10, 500):
        rules.append("LARGE_MANUAL_ADJUSTMENT")
    if req.failed_payment_count >= 3:
        rules.append("REPEATED_FAILED_PAYMENTS")
    score = min(1.0, deviation + 0.35 * bool(req.duplicate_reference_count) + 0.2 * (req.failed_payment_count >= 3) + 0.2 * bool(req.adjustment_amount))
    level = "CRITICAL" if score >= .8 else "HIGH" if score >= .5 else "MEDIUM" if score >= .2 else "LOW"
    return FinancialAnomalyDetectionResponse(is_anomaly=bool(rules), risk_level=level, anomaly_score=round(score, 2), rules_triggered=rules, expected_amount=baseline, actual_amount=req.actual_amount)
