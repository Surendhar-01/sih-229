import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Globe2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/api';

type Language = 'en' | 'hi' | 'mr';
type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

const speechLocaleMap: Record<Language, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
};

export const GlobalVoiceAssistant: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, language, setLanguage, isAuthenticated } = useAuthStore();
  const activeLang: Language = language === 'hi' || language === 'mr' ? language : 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Spoken TTS output
  const speakText = (text: string, langHint?: Language) => {
    if (isMuted || !('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLocaleMap[langHint || activeLang] || 'en-IN';
      utterance.rate = 0.92;
      utterance.onstart = () => setAssistantState('speaking');
      utterance.onend = () => setAssistantState('idle');
      utterance.onerror = () => setAssistantState('idle');
      window.speechSynthesis.speak(utterance);
    } catch {
      setAssistantState('idle');
    }
  };

  // Fetch contextual prompts when route or language changes
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await apiClient.get(`/voice/prompts?route=${encodeURIComponent(location.pathname)}&lang=${activeLang}`);
        if (res.data?.data?.prompts) {
          setPrompts(res.data.data.prompts);
        } else if (res.data?.prompts) {
          setPrompts(res.data.prompts);
        }
      } catch {
        // Fallback default suggestions
        setPrompts(
          activeLang === 'hi'
            ? ['"डैशबोर्ड खोलो"', '"कचरे का भाव बताओ"', '"नया लॉट"', '"मदद करो"']
            : activeLang === 'mr'
              ? ['"डॅशबोर्ड उघडा"', '"कचऱ्याचे दर सांगा"', '"नवीन लॉट"', '"मदत करा"']
              : ['"Open dashboard"', '"Check scrap rates"', '"Create lot"', '"Help me"']
        );
      }
    };
    void fetchPrompts();
  }, [location.pathname, activeLang]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort?.();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Keyboard shortcut: Alt + V to toggle listening
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        if (assistantState === 'listening') {
          stopListening();
        } else {
          startListening();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assistantState]);

  const startListening = () => {
    setErrorMessage(null);
    setTranscript('');
    setIsOpen(true);

    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      setAssistantState('error');
      return;
    }

    try {
      const instance = new Recognition();
      recognitionRef.current = instance;
      instance.lang = speechLocaleMap[activeLang];
      instance.interimResults = true;
      instance.maxAlternatives = 1;

      instance.onstart = () => {
        setAssistantState('listening');
      };

      instance.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      instance.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          setErrorMessage(`Mic error: ${event.error}`);
          setAssistantState('error');
        } else {
          setAssistantState('idle');
        }
      };

      instance.onend = () => {
        setAssistantState((prev) => {
          if (prev === 'listening') {
            if (transcript.trim()) {
              void processTranscript(transcript);
              return 'processing';
            }
            return 'idle';
          }
          return prev;
        });
      };

      instance.start();
    } catch (err: any) {
      setErrorMessage('Failed to access microphone.');
      setAssistantState('error');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop?.();
    }
    if (transcript.trim()) {
      void processTranscript(transcript);
    } else {
      setAssistantState('idle');
    }
  };

  const processTranscript = async (text: string) => {
    if (!text.trim()) {
      setAssistantState('idle');
      return;
    }

    setAssistantState('processing');
    setErrorMessage(null);

    try {
      const res = await apiClient.post('/voice/route', {
        transcript: text,
        language: activeLang,
        current_route: location.pathname,
        context_data: {
          user_role: user?.role,
          account_status: user?.account_status,
        },
      });

      const data = res.data?.data || res.data;
      const spoken = data.spoken_response?.[activeLang] || data.spoken_response?.en || 'Command processed.';
      setLastResponse(spoken);

      // Handle Role Security Guard
      if (data.allowed === false) {
        setErrorMessage(data.security_reason || 'Access denied for your role.');
        speakText(spoken, activeLang);
        setAssistantState('error');
        return;
      }

      // Execute Spoken Feedback
      speakText(spoken, activeLang);

      // Execute Target Navigation
      if (data.target_route && data.target_route !== location.pathname) {
        setTimeout(() => {
          navigate(data.target_route);
        }, 300);
      }

      // Handle specialized actions
      if (data.action === 'SWITCH_AUTH_PHONE') {
        window.dispatchEvent(new CustomEvent('ewaste:auth_switch_method', { detail: 'phone' }));
      } else if (data.action === 'TRIGGER_GOOGLE_AUTH') {
        window.dispatchEvent(new CustomEvent('ewaste:trigger_google_auth'));
      } else if (data.action === 'RESEND_OTP') {
        window.dispatchEvent(new CustomEvent('ewaste:resend_otp'));
      } else if (data.action === 'LOGOUT_USER') {
        void useAuthStore.getState().logout();
        navigate('/login');
      }

      setAssistantState('idle');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not understand command. Please try again.';
      setErrorMessage(msg);
      setAssistantState('error');
      speakText('Sorry, I did not catch that. Please speak again.', activeLang);
    }
  };

  const handlePromptClick = (promptText: string) => {
    const clean = promptText.replace(/["']/g, '');
    setTranscript(clean);
    void processTranscript(clean);
  };

  return (
    <aside
      aria-label="Universal Voice Assistant"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      }}
    >
      {/* Expanded Assistant Card */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 70,
            right: 0,
            width: 'min(380px, calc(100vw - 32px))',
            background: '#ffffff',
            borderRadius: 20,
            boxShadow: '0 20px 40px -15px rgba(23, 59, 42, 0.25), 0 0 0 1px rgba(23, 107, 68, 0.15)',
            padding: 18,
            overflow: 'hidden',
            animation: 'slideUpFade 0.22s ease-out',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #eef2eb', paddingBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: '#176b44',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#173b2a' }}>
                  {activeLang === 'hi' ? 'स्मार्ट वॉइस सहायक' : activeLang === 'mr' ? 'स्मार्ट आवाज सहाय्यक' : 'Smart Voice Assistant'}
                </h4>
                <span style={{ fontSize: '0.72rem', color: '#577262', fontWeight: 600 }}>
                  {assistantState === 'listening' ? '● Listening...' : assistantState === 'processing' ? '● Processing NLP...' : 'Always Ready (Alt+V)'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? 'Unmute voice feedback' : 'Mute voice feedback'}
                style={{
                  background: isMuted ? '#fee2e2' : '#f1f5ed',
                  color: isMuted ? '#ef4444' : '#176b44',
                  border: 'none',
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize assistant"
                style={{
                  background: '#f1f5ed',
                  color: '#577262',
                  border: 'none',
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Live Transcript / Speech Wave */}
          <div
            style={{
              minHeight: 65,
              background: assistantState === 'listening' ? '#ecfdf5' : '#f8faf6',
              border: `1px solid ${assistantState === 'listening' ? '#a7f3d0' : '#e2e8e0'}`,
              borderRadius: 14,
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            {transcript ? (
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#173b2a', fontWeight: 600 }}>
                "{transcript}"
              </p>
            ) : lastResponse ? (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#176b44', fontWeight: 500, lineHeight: 1.4 }}>
                {lastResponse}
              </p>
            ) : (
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {activeLang === 'hi'
                  ? 'माइक दबाकर बोलें या नीचे दिए गए सुझाव चुनें…'
                  : activeLang === 'mr'
                    ? 'मायक्रोफोन दाबून बोला किंवा खालील पर्याय निवडा…'
                    : 'Tap the microphone or say a command…'}
              </span>
            )}

            {assistantState === 'listening' && (
              <div style={{ display: 'flex', gap: 4, marginTop: 8, alignItems: 'center' }}>
                <span style={{ width: 6, height: 16, background: '#10b981', borderRadius: 4, animation: 'soundWave 0.8s infinite ease-in-out' }} />
                <span style={{ width: 6, height: 24, background: '#10b981', borderRadius: 4, animation: 'soundWave 0.6s infinite ease-in-out 0.1s' }} />
                <span style={{ width: 6, height: 12, background: '#10b981', borderRadius: 4, animation: 'soundWave 0.9s infinite ease-in-out 0.2s' }} />
                <span style={{ width: 6, height: 20, background: '#10b981', borderRadius: 4, animation: 'soundWave 0.7s infinite ease-in-out 0.3s' }} />
                <span style={{ fontSize: '0.72rem', color: '#047857', fontWeight: 700, marginLeft: 6 }}>Listening…</span>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 10,
                background: '#fee2e2',
                color: '#b91c1c',
                fontSize: '0.78rem',
                fontWeight: 600,
                marginBottom: 10,
              }}
            >
              <AlertTriangle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Contextual Suggestions */}
          <div>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {activeLang === 'hi' ? 'सुझाए गए आदेश' : activeLang === 'mr' ? 'सुचवलेले आदेश' : 'Suggested Commands'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {prompts.slice(0, 4).map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePromptClick(p)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    background: '#f1f5ed',
                    border: '1px solid #dce9de',
                    color: '#1f5137',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e2f0e5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f5ed';
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Floating Orb Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={assistantState === 'listening' ? stopListening : startListening}
          aria-label={assistantState === 'listening' ? 'Stop listening' : 'Start voice command'}
          title="Toggle Voice Assistant (Alt+V)"
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: assistantState === 'listening' ? '#dc2626' : '#176b44',
            color: '#ffffff',
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            boxShadow: assistantState === 'listening'
              ? '0 0 0 8px rgba(220, 38, 38, 0.25), 0 10px 25px rgba(220, 38, 38, 0.4)'
              : '0 0 0 6px rgba(23, 107, 68, 0.18), 0 10px 25px rgba(23, 107, 68, 0.35)',
            transition: 'all 0.2s ease',
          }}
        >
          {assistantState === 'listening' ? (
            <Radio size={26} style={{ animation: 'spin 2s linear infinite' }} />
          ) : assistantState === 'processing' ? (
            <Sparkles size={24} />
          ) : (
            <Mic size={26} />
          )}
        </button>
      </div>

      <style>{`
        @keyframes soundWave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.2); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </aside>
  );
};
