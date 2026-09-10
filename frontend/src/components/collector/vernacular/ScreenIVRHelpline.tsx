import React, { useState } from 'react';
import { VernacularLanguage } from './VernacularTypes';
import { VERNACULAR_TRANSLATIONS } from './vernacularTranslations';
import { playDtmfTone, speakVernacularText, playAudioBeep } from './speechAndAudio';
import { Phone, PhoneCall, Volume2, ShieldAlert, FileText, IndianRupee } from 'lucide-react';

interface ScreenIVRHelplineProps {
  language: VernacularLanguage;
}

export const ScreenIVRHelpline: React.FC<ScreenIVRHelplineProps> = ({
  language,
}) => {
  const t = VERNACULAR_TRANSLATIONS[language];
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [dialedSequence, setDialedSequence] = useState<string>('');
  const [callActive, setCallActive] = useState<boolean>(false);
  const [ivrMessage, setIvrMessage] = useState<string | null>(null);

  const handleKeyPress = (digit: string) => {
    playDtmfTone(digit, 160);
    setPressedKey(digit);
    setDialedSequence((prev) => (prev.length < 12 ? prev + digit : digit));

    setTimeout(() => {
      setPressedKey(null);
    }, 200);

    // Interactive response for specific keys
    if (digit === '1') {
      triggerIvrRate();
    } else if (digit === '2') {
      triggerIvrRecycler();
    } else if (digit === '3') {
      triggerIvrSafety();
    }
  };

  const triggerIvrRate = () => {
    setCallActive(true);
    const msg =
      language === 'hi'
        ? 'आज के भाव: पीसीबी 100 रुपये, केबल 180 रुपये, बैटरी 50 रुपये प्रति किलो।'
        : language === 'mr'
        ? 'आजचे भाव: पीसीबी 100 रुपये, केबल 180 रुपये, बॅटरी 50 रुपये प्रति किग्रॅ.'
        : 'Today rates: PCB 100 rupees, Cable 180 rupees, Battery 50 rupees per kg.';
    setIvrMessage(msg);
    speakVernacularText(msg, language);
  };

  const triggerIvrRecycler = () => {
    setCallActive(true);
    const msg =
      language === 'hi'
        ? 'आपके निकटतम अधिकृत रीसाइक्लर ग्रीन रीसायकल 1.2 किलोमीटर पर उपलब्ध है।'
        : language === 'mr'
        ? 'तुमचे जवळचे अधिकृत रीसायकलर ग्रीन रीसायकल 1.2 किलोमीटर अंतरावर आहे.'
        : 'Your nearest authorized recycler Green Recycle is 1.2 kilometers away.';
    setIvrMessage(msg);
    speakVernacularText(msg, language);
  };

  const triggerIvrSafety = () => {
    setCallActive(true);
    const msg =
      language === 'hi'
        ? 'सुरक्षा निर्देश: बैटरी को कभी भी न जलाएं और सीआरटी मॉनिटर को न तोड़ें।'
        : language === 'mr'
        ? 'सुरक्षा सूचना: बॅटरी कधीही जाळू नका आणि सीआरटी टीव्ही फोडू नका.'
        : 'Safety notice: Never burn batteries and do not smash CRT tubes.';
    setIvrMessage(msg);
    speakVernacularText(msg, language);
  };

  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  return (
    <div className="flex flex-col h-full bg-[#fbfbf9] text-gray-800 select-none">
      {/* Header */}
      <div className="pt-3 pb-2.5 px-4 flex items-center justify-between border-b border-gray-100 bg-white shadow-xs">
        <h2 className="text-base font-bold text-gray-800">{t.helplineTitle}</h2>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          24x7 Toll Free
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center px-4 py-3 gap-3 overflow-y-auto">
        {/* Realistic Feature Phone Handset Graphic */}
        <div className="w-48 bg-[#374151] rounded-3xl p-3 shadow-xl border-4 border-[#1f2937] flex flex-col items-center gap-2 relative">
          {/* Earpiece slit */}
          <div className="w-10 h-1 bg-gray-600 rounded-full" />

          {/* Green LCD Display */}
          <div className="w-full h-14 bg-[#84cc16]/30 border-2 border-[#4d7c0f] rounded-lg p-1.5 flex flex-col justify-between shadow-inner font-mono">
            <div className="flex items-center justify-between text-[10px] text-emerald-950 font-bold">
              <span className="flex items-center gap-1">
                <PhoneCall className="w-3 h-3 text-emerald-900 animate-pulse" />
                {dialedSequence || '1800-XXX-XXXX'}
              </span>
              <span className="text-[9px]">VOL ▌▌▌</span>
            </div>
            <div className="text-[9px] text-emerald-950 truncate font-semibold">
              {ivrMessage ? ivrMessage : t.dialpadPrompt}
            </div>
          </div>

          {/* Action Call & Hangup Bar */}
          <div className="w-full flex justify-between px-1">
            <button
              type="button"
              onClick={triggerIvrRate}
              className="w-10 h-4 bg-emerald-600 rounded-sm flex items-center justify-center text-[8px] text-white font-bold active:scale-95"
            >
              CALL
            </button>
            <button
              type="button"
              onClick={() => {
                playAudioBeep(350, 'square', 100);
                setDialedSequence('');
                setIvrMessage(null);
                setCallActive(false);
              }}
              className="w-10 h-4 bg-rose-600 rounded-sm flex items-center justify-center text-[8px] text-white font-bold active:scale-95"
            >
              END
            </button>
          </div>

          {/* 3x4 Physical Keypad Grid */}
          <div className="w-full grid grid-cols-3 gap-1.5 pt-0.5">
            {keypadRows.flat().map((key) => {
              const isPressed = pressedKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeyPress(key)}
                  className={`h-7 rounded-md text-xs font-extrabold flex items-center justify-center transition-all ${
                    isPressed
                      ? 'bg-emerald-500 text-white scale-95 shadow-inner'
                      : 'bg-[#4b5563] text-gray-100 hover:bg-[#6b7280] shadow-xs'
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toll-Free Banner Guidance */}
        <div className="text-center mt-1">
          <p className="text-xs text-gray-600 font-medium">
            {t.helplinePhoneInstruction}
          </p>
          <a
            href="tel:18002298800"
            className="text-base font-extrabold text-emerald-800 tracking-wide font-mono hover:underline"
          >
            {t.helplineNumber}
          </a>
        </div>

        {/* 3 Quick Audio Buttons */}
        <div className="w-full grid grid-cols-3 gap-2 pt-1">
          {/* Rate Button */}
          <button
            type="button"
            onClick={() => handleKeyPress('1')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-gray-200 hover:border-emerald-300 shadow-xs active:scale-95 transition-all text-center"
          >
            <span className="text-lg mb-0.5">💰</span>
            <span className="text-xs font-bold text-gray-700">{t.ivrBtnRate}</span>
            <span className="text-[9px] text-gray-400 mt-0.5 font-mono">(1)</span>
          </button>

          {/* Recycler Button */}
          <button
            type="button"
            onClick={() => handleKeyPress('2')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-gray-200 hover:border-emerald-300 shadow-xs active:scale-95 transition-all text-center"
          >
            <span className="text-lg mb-0.5">📋</span>
            <span className="text-xs font-bold text-gray-700">{t.ivrBtnRecycler}</span>
            <span className="text-[9px] text-gray-400 mt-0.5 font-mono">(2)</span>
          </button>

          {/* Safety Button */}
          <button
            type="button"
            onClick={() => handleKeyPress('3')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-gray-200 hover:border-emerald-300 shadow-xs active:scale-95 transition-all text-center"
          >
            <span className="text-lg mb-0.5">⚠️</span>
            <span className="text-xs font-bold text-gray-700">{t.ivrBtnSafety}</span>
            <span className="text-[9px] text-gray-400 mt-0.5 font-mono">(3)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
