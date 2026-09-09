import { create } from 'zustand';
import { UserProfile, UserRole, AccountStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import axios from 'axios';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: string;
  setAuth: (user: UserProfile, token: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
  setLanguage: (lang: string) => void;
  switchRole: (role: UserRole) => void;
  refreshProfile: () => Promise<void>;
  initSession: () => Promise<void>;
}

const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem('ewaste_auth_session');
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
};

const initialSession = getStoredAuth();

const defaultMockUser: UserProfile = {
  id: 'usr-user-001',
  email: 'citizen@ewaste.gov.in',
  phone: '+919876543210',
  full_name: 'Anita Sharma',
  role: 'USER',
  account_status: 'ACTIVE',
  preferred_language: 'en',
  general_location: 'Andheri West, Mumbai',
  is_verified: true,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialSession?.user || defaultMockUser,
  token: initialSession?.token || 'dev-mock-user',
  isAuthenticated: !!(initialSession?.token || true),
  isLoading: false,
  language: localStorage.getItem('ewaste_lang') || 'en',

  setAuth: (user, token) => {
    localStorage.setItem('ewaste_auth_session', JSON.stringify({ user, token }));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  updateProfile: (updates) => {
    set((state) => {
      if (!state.user) return state;
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem('ewaste_auth_session', JSON.stringify({ user: updatedUser, token: state.token }));
      return { user: updatedUser };
    });
  },

  logout: async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    }
    localStorage.removeItem('ewaste_auth_session');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  setLanguage: (language) => {
    localStorage.setItem('ewaste_lang', language);
    set({ language });
  },

  switchRole: (role: UserRole) => {
    set((state) => {
      if (!state.user) return state;
      const isCollectorOrRecycler = ['COLLECTION_COLLECTOR', 'AUTHORIZED_RECYCLER', 'INFORMAL_AGGREGATOR'].includes(role);
      const updatedUser: UserProfile = {
        ...state.user,
        role,
        full_name: `Dev ${role.replace('_', ' ')}`,
        account_status: 'ACTIVE', // for quick testing of dashboards
      };
      const updatedToken = `dev-mock-${role.toLowerCase()}`;
      localStorage.setItem('ewaste_auth_session', JSON.stringify({ user: updatedUser, token: updatedToken }));
      return { user: updatedUser, token: updatedToken };
    });
  },

  refreshProfile: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
      const res = await axios.get(`${apiBase}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success && res.data?.data) {
        const freshProfile = res.data.data;
        get().setAuth(freshProfile, token);
      }
    } catch (err) {
      console.warn('Could not refresh profile from backend:', err);
    }
  },

  initSession: async () => {
    set({ isLoading: true });
    try {
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const token = session.access_token;
          const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
          try {
            const res = await axios.get(`${apiBase}/profile`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data?.data) {
              get().setAuth(res.data.data, token);
              set({ isLoading: false });
              return;
            }
          } catch {}
        }
      }
      // If local session exists, verify or keep
      const stored = getStoredAuth();
      if (stored?.user && stored?.token) {
        set({ user: stored.user, token: stored.token, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch (err) {
      console.error('Session init failed:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));

