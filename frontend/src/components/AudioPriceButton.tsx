import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface AudioPriceButtonProps {
  categoryName: string;
  minPrice: number;
  maxPrice: number;
}

export const AudioPriceButton: React.FC<AudioPriceButtonProps> = ({ categoryName, minPrice, maxPrice }) => {
  const { language } = useAuthStore();
  const [isPlaying, setIsPlaying] = useState(false);

  const speak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    let text = '';
    let langCode = 'en-IN';

    if (language === 'hi') {
      text = `इस सामग्री की अनुमानित बाजार कीमत ${minPrice} से ${maxPrice} रुपये है।`;
      langCode = 'hi-IN';
    } else if (language === 'mr') {
      text = `या साहित्याची अंदाजे बाजार किंमत ${minPrice} ते ${maxPrice} रुपये आहे.`;
      langCode = 'mr-IN';
    } else {
      text = `Estimated market value for ${categoryName} is between ${minPrice} and ${maxPrice} Rupees.`;
      langCode = 'en-IN';
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.95;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={speak}
      title="Listen to price valuation in selected language"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: isPlaying ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
        border: '1px solid var(--border-color)',
        color: isPlaying ? '#047857' : '#334155',
        padding: '6px 12px',
        borderRadius: 20,
        fontSize: '0.8rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {isPlaying ? <VolumeX size={15} /> : <Volume2 size={15} className="text-emerald-400" />}
      <span>{isPlaying ? 'Speaking...' : 'Listen Price'}</span>
    </button>
  );
};
