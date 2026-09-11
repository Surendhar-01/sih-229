import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Building2, Check, ChevronDown, Factory, Globe2, HelpCircle,
  Landmark, Leaf, Mic, Phone, Radio, ShieldCheck, Speaker,
  Volume2, WifiOff, X,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import { apiClient } from '../services/api';
import i18n from '../i18n/i18n';

type Language = 'en' | 'hi' | 'mr';
type VoiceState = 'idle' | 'listening' | 'processing' | 'success' | 'error' | 'offline';

const copy = {
  en: {
    service: 'E-Waste Collection', speak: 'Tell us by speaking', question: 'What would you like to do?',
    tap: 'Tap to speak', listening: 'Listening…', understanding: 'Understanding…', gotIt: 'Got it',
    retry: 'Please try again', offline: 'You are offline', welcome: 'Sell your e-waste and recycle it safely.',
    citizen: 'Continue as User', citizenNote: 'I want to recycle my e-waste', collector: 'Informal Collector',
    collectorNote: 'Scrap collector / kabadiwala', recycler: 'Formal Recycler', recyclerNote: 'Authorized recycling centre',
    admin: 'Government Admin', adminNote: 'Government monitoring', voiceHelp: 'Voice Help', helpline: 'Helpline',
    safety: 'Safety', help: 'Help', confirm: 'Continue as', yes: 'Yes', no: 'No', detected: 'We heard',
    safetyTitle: 'Keep e-waste safe', safetyText: 'Do not break batteries, screens or devices. Keep damaged batteries away from heat and water.',
    helpTitle: 'How can we help?', helpText: 'Choose a language, tap the microphone, say what you need, then confirm your role.',
    helplineTitle: 'Need support?', helplineText: 'Use Voice Help for spoken guidance or contact your local authorised e-waste collection centre.',
    welcomeVoice: 'Welcome to the E-Waste Management Platform. Choose your language. If reading is difficult, tap the microphone and speak. You can recycle e-waste, work as a collector, join as a recycler, or access government administration.',
  },
  hi: {
    service: 'ई-वेस्ट संग्रह सेवा', speak: 'बोलकर बताएं', question: 'आप क्या करना चाहते हैं?', tap: 'बोलने के लिए दबाएं',
    listening: 'सुन रहे हैं…', understanding: 'समझ रहे हैं…', gotIt: 'समझ गया', retry: 'कृपया फिर कोशिश करें',
    offline: 'आप ऑफ़लाइन हैं', welcome: 'ई-वेस्ट बेचें, सुरक्षित तरीके से रीसायकल करें।', citizen: 'उपयोगकर्ता के रूप में जारी रखें',
    citizenNote: 'मैं अपना ई-वेस्ट रीसायकल करना चाहता हूँ', collector: 'अनौपचारिक कलेक्टर', collectorNote: 'स्क्रैप कलेक्टर / कबाड़ी',
    recycler: 'अधिकृत रीसायकलर', recyclerNote: 'अधिकृत रीसायकल केंद्र', admin: 'सरकारी प्रशासन', adminNote: 'सरकारी निगरानी',
    voiceHelp: 'आवाज़ सहायता', helpline: 'हेल्पलाइन', safety: 'सुरक्षा', help: 'मदद', confirm: 'आगे बढ़ें:', yes: 'हाँ', no: 'नहीं',
    detected: 'हमने सुना', safetyTitle: 'ई-वेस्ट को सुरक्षित रखें', safetyText: 'बैटरी, स्क्रीन या उपकरण न तोड़ें। खराब बैटरियों को गर्मी और पानी से दूर रखें।',
    helpTitle: 'हम कैसे मदद करें?', helpText: 'भाषा चुनें, माइक्रोफोन दबाएं, अपनी ज़रूरत बोलें और भूमिका की पुष्टि करें।',
    helplineTitle: 'सहायता चाहिए?', helplineText: 'बोली हुई मदद के लिए आवाज़ सहायता दबाएं या अपने नज़दीकी अधिकृत ई-वेस्ट संग्रह केंद्र से संपर्क करें।',
    welcomeVoice: 'नमस्ते। ई-वेस्ट मैनेजमेंट प्लेटफॉर्म में आपका स्वागत है। अपनी भाषा चुनें। अगर पढ़ने में परेशानी है, तो माइक्रोफोन दबाकर बोलें। आप ई-वेस्ट जमा कर सकते हैं, कलेक्टर के रूप में काम कर सकते हैं, रीसायकलर बन सकते हैं या सरकारी प्रशासन में लॉगिन कर सकते हैं।',
  },
  mr: {
    service: 'ई-वेस्ट संकलन सेवा', speak: 'बोलून सांगा', question: 'तुम्हाला काय करायचे आहे?', tap: 'बोलण्यासाठी दाबा',
    listening: 'ऐकत आहोत…', understanding: 'समजून घेत आहोत…', gotIt: 'समजले', retry: 'कृपया पुन्हा प्रयत्न करा',
    offline: 'तुम्ही ऑफलाइन आहात', welcome: 'तुमचा ई-वेस्ट सुरक्षितपणे रीसायकल करा.', citizen: 'वापरकर्ता म्हणून पुढे जा',
    citizenNote: 'मला माझा ई-वेस्ट रीसायकल करायचा आहे', collector: 'अनौपचारिक संकलक', collectorNote: 'स्क्रॅप संकलक / कबाडीवाला',
    recycler: 'अधिकृत रीसायकलर', recyclerNote: 'अधिकृत रीसायकल केंद्र', admin: 'सरकारी प्रशासन', adminNote: 'सरकारी देखरेख',
    voiceHelp: 'आवाज मदत', helpline: 'हेल्पलाइन', safety: 'सुरक्षा', help: 'मदत', confirm: 'पुढे जा:', yes: 'होय', no: 'नाही',
    detected: 'आम्ही ऐकले', safetyTitle: 'ई-वेस्ट सुरक्षित ठेवा', safetyText: 'बॅटरी, स्क्रीन किंवा उपकरणे तोडू नका. खराब बॅटरी उष्णता आणि पाण्यापासून दूर ठेवा।',
    helpTitle: 'आम्ही कशी मदत करू?', helpText: 'भाषा निवडा, मायक्रोफोन दाबा, तुमची गरज सांगा आणि भूमिका निश्चित करा.',
    helplineTitle: 'मदत हवी आहे?', helplineText: 'बोलून मार्गदर्शनासाठी आवाज मदत दाबा किंवा जवळच्या अधिकृत ई-वेस्ट संकलन केंद्राशी संपर्क करा.',
    welcomeVoice: 'ई-वेस्ट मॅनेजमेंट प्लॅटफॉर्ममध्ये आपले स्वागत आहे. आपली भाषा निवडा. वाचण्यात अडचण असल्यास मायक्रोफोन दाबून बोला.',
  },
} as const;

const speechLocale: Record<Language, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
const roleLabels: Record<UserRole, keyof typeof copy.en> = { USER: 'citizen', INFORMAL_AGGREGATOR: 'collector', COLLECTION_COLLECTOR: 'collector', AUTHORIZED_RECYCLER: 'recycler', GOVERNMENT_ADMIN: 'admin' };

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useAuthStore();
  const lang: Language = language === 'hi' || language === 'mr' ? language : 'en';
  const t = copy[lang];
  const recognition = useRef<any>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [choice, setChoice] = useState<UserRole | null>(null);
  const [dialog, setDialog] = useState<'safety' | 'help' | 'helpline' | null>(null);
  const [languageOpen, setLanguageOpen] = useState(false);

  useEffect(() => () => recognition.current?.abort?.(), []);
  const speak = (message: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = speechLocale[lang];
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };
  const setAppLanguage = (next: Language) => { setLanguage(next); i18n.changeLanguage(next); setLanguageOpen(false); };
  const selectRole = (role: UserRole) => { setChoice(role); speak(`${t.confirm} ${t[roleLabels[role]]}?`); };
  const continueRole = () => navigate('/login', { state: { selectedRole: choice } });

  const beginListening = () => {
    if (!navigator.onLine) { setVoiceState('offline'); return; }
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) { setVoiceState('error'); return; }
    const instance = new Recognition();
    recognition.current = instance;
    instance.lang = speechLocale[lang]; instance.interimResults = false; instance.maxAlternatives = 1;
    instance.onstart = () => setVoiceState('listening');
    instance.onerror = () => setVoiceState('error');
    instance.onend = () => setVoiceState((current: VoiceState) => current === 'listening' ? 'idle' : current);
    instance.onresult = async (event: any) => {
      const text = event.results[0][0].transcript as string;
      setTranscript(text); setVoiceState('processing');
      try {
        const response: any = await apiClient.post('/voice/route', { transcript: text, language: lang, current_route: '/' });
        const res = response?.data?.data || response?.data || response;
        const role = (res?.entities?.target_role || res?.action?.includes('COLLECTOR') ? 'COLLECTION_COLLECTOR' : res?.action?.includes('RECYCLER') ? 'AUTHORIZED_RECYCLER' : res?.action?.includes('ADMIN') ? 'GOVERNMENT_ADMIN' : null) as UserRole | null;
        setVoiceState('success');
        if (role) {
          selectRole(role);
        } else if (res?.spoken_response?.[lang]) {
          speak(res.spoken_response[lang]);
        } else {
          speak(t.helpText);
        }
      } catch { setVoiceState('error'); }
    };
    instance.start();
  };

  const statusText = useMemo(() => ({ idle: t.tap, listening: t.listening, processing: t.understanding, success: t.gotIt, error: t.retry, offline: t.offline })[voiceState], [voiceState, t]);
  const cardData = [
    { role: 'COLLECTION_COLLECTOR' as UserRole, icon: <Leaf />, title: t.collector, note: t.collectorNote, tone: '#176b44', featured: true },
    { role: 'AUTHORIZED_RECYCLER' as UserRole, icon: <Factory />, title: t.recycler, note: t.recyclerNote, tone: '#e8f5f1' },
    { role: 'GOVERNMENT_ADMIN' as UserRole, icon: <Landmark />, title: t.admin, note: t.adminNote, tone: '#f1f5ed' },
  ];

  return <main className="intro-page">
    <style>{`
      .intro-page{min-height:100vh;background:#fcfdf9;color:#173b2a;font-family:var(--font-sans);padding:14px 14px 30px}.intro-shell{max-width:480px;margin:auto}.intro-header{display:flex;align-items:center;justify-content:space-between;gap:10px}.brand{display:flex;align-items:center;gap:9px;font-weight:800;font-size:15px}.brand-mark{width:42px;height:42px;border-radius:14px;background:#176b44;color:white;display:grid;place-items:center;box-shadow:0 7px 16px #176b4430}.lang-select{position:relative}.lang-trigger,.help-item,.role-card,.citizen-card{font:inherit;cursor:pointer}.lang-trigger{min-height:42px;border:1px solid #d6e5d9;border-radius:12px;background:white;color:#1f5137;padding:0 9px;display:flex;align-items:center;gap:5px;font-weight:700}.lang-menu{position:absolute;right:0;top:48px;z-index:3;width:145px;background:#fff;border:1px solid #dbe7dd;border-radius:13px;padding:5px;box-shadow:0 12px 25px #173b2a22}.lang-menu button{display:block;width:100%;text-align:left;border:0;border-radius:9px;background:transparent;padding:10px;color:#173b2a;font:inherit;cursor:pointer}.voice-section{text-align:center;padding:25px 6px 19px}.intro-title{font-size:25px;margin:15px 0 3px;letter-spacing:-.6px}.voice-orb{width:128px;height:128px;border-radius:50%;border:0;background:#197044;color:white;display:grid;place-items:center;margin:22px auto 15px;cursor:pointer;box-shadow:0 0 0 10px #dff1e3,0 0 0 20px #eff9f0;position:relative}.voice-orb:focus-visible,.role-card:focus-visible,.citizen-card:focus-visible,.help-item:focus-visible,.lang-trigger:focus-visible{outline:3px solid #f4ad38;outline-offset:3px}.voice-orb.listening{animation:pulse 1.4s infinite}.voice-orb.processing svg{animation:spin 1.3s linear infinite}.voice-status{margin:0;font-weight:800;font-size:18px}.voice-sub{margin:5px auto 13px;color:#577262;font-size:15px;min-height:21px}.welcome{display:flex;gap:8px;align-items:center;justify-content:center;margin:auto;color:#3f604e;font-size:15px;line-height:1.4}.welcome button{border:0;background:#e8f6eb;color:#176b44;border-radius:50%;width:34px;height:34px;display:grid;place-items:center;cursor:pointer;flex:none}.cards{display:grid;gap:12px}.role-card,.citizen-card{width:100%;min-height:90px;border:1px solid #d8e7d9;border-radius:21px;padding:15px;display:flex;align-items:center;gap:13px;text-align:left;box-shadow:0 5px 15px #173b2a0a;transition:transform .18s,box-shadow .18s}.role-card:hover,.citizen-card:hover{transform:translateY(-2px);box-shadow:0 9px 20px #173b2a16}.citizen-card{background:#176b44;color:#fff;border-color:#176b44}.role-icon{width:50px;height:50px;border-radius:16px;background:#fff;color:#176b44;display:grid;place-items:center;flex:none}.role-copy{flex:1}.role-title{font-weight:800;font-size:17px;display:block}.role-note{font-size:13px;opacity:.78;display:block;margin-top:4px;line-height:1.25}.role-voice{padding:9px;color:#176b44;border:0;background:transparent;cursor:pointer}.citizen-card .role-voice{color:white}.quick-help{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:20px}.help-item{min-height:68px;border:1px solid #dce9de;background:#fff;border-radius:15px;color:#276146;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5px;font-size:11px;font-weight:800}.dialog-backdrop{position:fixed;inset:0;background:#102d1d70;z-index:5;display:grid;place-items:end center;padding:16px}.dialog{width:min(100%,480px);background:#fff;border-radius:23px;padding:22px;box-shadow:0 15px 35px #0003}.dialog-head{display:flex;justify-content:space-between;align-items:center;gap:8px}.dialog h2{margin:0;font-size:21px}.dialog p{color:#456150;line-height:1.55}.close{border:0;background:#edf6ef;border-radius:50%;width:36px;height:36px;display:grid;place-items:center;cursor:pointer}.confirm{position:fixed;z-index:4;bottom:16px;left:50%;transform:translateX(-50%);width:min(calc(100% - 28px),452px);background:#fff;border:1px solid #d7e8da;box-shadow:0 12px 30px #173b2a25;border-radius:19px;padding:14px;display:flex;gap:9px;align-items:center}.confirm-text{flex:1;font-weight:800}.confirm button{min-height:43px;border:0;border-radius:11px;padding:0 14px;font:inherit;font-weight:800;cursor:pointer}.confirm-no{background:#edf4ee;color:#24553a}.confirm-yes{background:#176b44;color:white}@keyframes pulse{0%,100%{box-shadow:0 0 0 10px #dff1e3,0 0 0 20px #eff9f0}50%{box-shadow:0 0 0 17px #dff1e3aa,0 0 0 31px #eff9f077}}@keyframes spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.voice-orb.listening,.voice-orb.processing svg{animation:none}.role-card,.citizen-card{transition:none}}@media (min-width:700px){.intro-page{padding-top:28px}.intro-shell{padding:10px 0}.cards{grid-template-columns:1fr 1fr}.citizen-card{grid-column:span 2}}
    `}</style>
    <div className="intro-shell">
      <header className="intro-header"><div className="brand"><span className="brand-mark"><RecycleIcon /></span><span>{t.service}</span></div><div className="lang-select"><button className="lang-trigger" onClick={() => setLanguageOpen(!languageOpen)} aria-expanded={languageOpen}><Globe2 size={17} />{{en:'English',hi:'हिंदी',mr:'मराठी'}[lang]}<ChevronDown size={15}/></button>{languageOpen && <div className="lang-menu">{(['en','hi','mr'] as Language[]).map(item => <button key={item} onClick={() => setAppLanguage(item)}>{item === 'en' ? '🇮🇳 English' : item === 'hi' ? '🇮🇳 हिंदी' : '🇮🇳 मराठी'}</button>)}</div>}</div></header>
      <section className="voice-section"><h1 className="intro-title">{t.service}</h1><button className={`voice-orb ${voiceState}`} onClick={beginListening} aria-label={t.tap}>{voiceState === 'success' ? <Check size={52}/> : voiceState === 'offline' ? <WifiOff size={48}/> : voiceState === 'error' ? <HelpCircle size={48}/> : voiceState === 'processing' ? <Radio size={48}/> : <Mic size={53}/>}</button><h2 className="voice-status">{t.speak}</h2><p className="voice-sub">{voiceState === 'idle' ? t.question : statusText}</p>{transcript && <p className="voice-sub"><strong>{t.detected}:</strong> “{transcript}”</p>}<div className="welcome"><button onClick={() => speak(t.welcomeVoice)} aria-label={t.voiceHelp}><Volume2 size={18}/></button><span>{t.welcome}</span></div></section>
      <section className="cards" aria-label="Choose how you want to continue">{cardData.map(card => <button className={card.featured ? 'citizen-card' : 'role-card'} style={card.featured ? undefined : { background: card.tone }} key={card.role} onClick={() => selectRole(card.role)}><span className="role-icon">{card.icon}</span><span className="role-copy"><span className="role-title">{card.title}</span><span className="role-note">{card.note}</span></span><span className="role-voice" role="button" aria-label={`${t.voiceHelp}: ${card.title}`} onClick={(event) => { event.stopPropagation(); speak(`${card.title}. ${card.note}`); }}><Speaker size={20}/></span><ArrowRight size={21}/></button>)}</section>
      <section className="quick-help" aria-label="Quick help"><button className="help-item" onClick={() => speak(t.helpText)}><Volume2 size={20}/>{t.voiceHelp}</button><button className="help-item" onClick={() => setDialog('helpline')}><Phone size={20}/>{t.helpline}</button><button className="help-item" onClick={() => setDialog('safety')}><ShieldCheck size={20}/>{t.safety}</button><button className="help-item" onClick={() => setDialog('help')}><HelpCircle size={20}/>{t.help}</button></section>
    </div>
    {choice && <div className="confirm" role="dialog" aria-modal="true"><span className="confirm-text">{t.confirm} {t[roleLabels[choice]]}?</span><button className="confirm-no" onClick={() => setChoice(null)}>{t.no}</button><button className="confirm-yes" onClick={continueRole}>{t.yes}</button></div>}
    {dialog && <div className="dialog-backdrop" role="presentation" onClick={() => setDialog(null)}><section className="dialog" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}><div className="dialog-head"><h2>{dialog === 'safety' ? t.safetyTitle : dialog === 'help' ? t.helpTitle : t.helplineTitle}</h2><button className="close" onClick={() => setDialog(null)} aria-label="Close"><X size={18}/></button></div><p>{dialog === 'safety' ? t.safetyText : dialog === 'help' ? t.helpText : t.helplineText}</p><button className="confirm-yes" style={{ minHeight: 44, border: 0, borderRadius: 11, padding: '0 15px', fontWeight: 800 }} onClick={() => speak(dialog === 'safety' ? t.safetyText : dialog === 'help' ? t.helpText : t.helplineText)}>{t.voiceHelp}</button></section></div>}
  </main>;
};

const RecycleIcon = () => <Leaf size={23} aria-hidden="true" />;
