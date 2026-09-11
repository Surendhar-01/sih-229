from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class VoiceCommandRequest(BaseModel):
    transcript: str = Field(..., description="Transcribed text from voice recognition")
    language: str = Field(default="en", description="Language code: en, hi, mr")
    current_route: Optional[str] = Field(default="/", description="Current page route in the frontend")
    user_role: Optional[str] = Field(default=None, description="Authenticated role if logged in")
    context_data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context from active view")

class SpokenResponse(BaseModel):
    en: str
    hi: str
    mr: str

class VoiceCommandResponse(BaseModel):
    transcript: str
    language_detected: str = "en"
    intent: str = Field(..., description="Identified semantic intent")
    action: Optional[str] = Field(default=None, description="Application action identifier")
    target_route: Optional[str] = Field(default=None, description="Target frontend route if navigation")
    entities: Dict[str, Any] = Field(default_factory=dict, description="Extracted entities like material, weight, numbers")
    confidence: float = Field(default=0.90, description="Classification confidence")
    spoken_response: SpokenResponse
    requires_confirmation: bool = Field(default=False, description="Whether action requires explicit user confirmation")
    status: str = "SUCCESS"

class AudioTranscriptionResponse(BaseModel):
    transcript: str
    language: str
    confidence: float = 0.95
    duration_seconds: Optional[float] = None
