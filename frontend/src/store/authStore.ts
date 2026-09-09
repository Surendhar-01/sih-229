import { create } from 'zustand';
import { UserProfile, UserRole } from '../types';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  language: string;
  setAuth: (user: UserProfile, token: string) => void;
  logout: () => void;
  setLanguage: (lang: string) => void;
  switchRole: (role: UserRole) => void;
}

const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem('ewaste_auth_session');
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
};

const initialSession = getStoredAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialSession?.user || {
    id: 'dev-user-001',
    email: 'citizen@ewaste.gov.in',
    phone: '+919876543210',
    full_name: 'Dev Citizen',
    role: 'USER',
    preferred_language: 'en',
    is_verified: true,
  },
  token: initialSession?.token || 'dev-mock-user',
  isAuthenticated: true,
  language: localStorage.getItem('ewaste_lang') || 'en',

  setAuth: (user, token) => {
    localStorage.setItem('ewaste_auth_session', JSON.stringify({ user, token }));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('ewaste_auth_session');
    set({ user: null, token: null, isAuthenticated: false });
  },

  setLanguage: (language) => {
    localStorage.setItem('ewaste_lang', language);
    set({ language });
  },

  switchRole: (role: UserRole) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser: UserProfile = {
        ...state.user,
        role,
        full_name: `Dev ${role.replace('_', ' ')}`,
      };
      const updatedToken = `dev-mock-${role.toLowerCase()}`;
      localStorage.setItem('ewaste_auth_session', JSON.stringify({ user: updatedUser, token: updatedToken }));
      return { user: updatedUser, token: updatedToken };
    });
  },
}));
