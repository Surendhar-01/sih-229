import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Globe2, Leaf, LogOut, UserRound } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import i18n from '../i18n/i18n';

interface AppHeaderProps { showAccount?: boolean }

export const AppHeader: React.FC<AppHeaderProps> = ({ showAccount = false }) => {
  const navigate = useNavigate();
  const { user, language, setLanguage, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const selected = language === 'hi' || language === 'mr' ? language : 'en';
  const labels: Record<string, string> = { en: 'English', hi: 'हिंदी', mr: 'मराठी' };
  const titles: Record<string, string> = { en: 'E-Waste Collection', hi: 'ई-वेस्ट संग्रह सेवा', mr: 'ई-वेस्ट संकलन सेवा' };
  const changeLanguage = (lang: string) => { setLanguage(lang); i18n.changeLanguage(lang); setOpen(false); };

  return <header className="platform-header">
    <div className="platform-header-inner">
      <Link to="/" className="platform-brand" aria-label="E-Waste Collection home">
        <span className="platform-brand-icon"><Leaf size={21} /></span>
        <span>{titles[selected]}</span>
      </Link>
      <div className="platform-header-actions">
        <div className="platform-language">
          <button className="platform-language-trigger" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Select language">
            <Globe2 size={18} /><span>{labels[selected]}</span><ChevronDown size={16} />
          </button>
          {open && <div className="platform-language-menu">
            {(['en', 'hi', 'mr'] as const).map(lang => <button key={lang} onClick={() => changeLanguage(lang)}>{labels[lang]}</button>)}
          </div>}
        </div>
        {showAccount && user && <>
          <Link className="platform-profile" to="/profile"><UserRound size={17} /><span>{user.full_name.split(' ')[0]}</span></Link>
          <button className="platform-signout" onClick={async () => { await logout(); navigate('/'); }} aria-label="Sign out"><LogOut size={18} /></button>
        </>}
      </div>
    </div>
  </header>;
};
