import { create } from 'zustand';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import axios from 'axios';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: string;
  setAuth: (user: UserProfile, token: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
  setLanguage: (lang: string) => void;
  refreshProfile: () => Promise<void>;
  initSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  language: localStorage.getItem('ewaste_lang') || 'en',

  setAuth: (user, token) => {
    localStorage.setItem('ewaste_auth_session', JSON.stringify({ user, token }));
    set({ user, token, accessToken: token, isAuthenticated: true, isLoading: false });
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
    set({ user: null, token: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  setLanguage: (language) => {
    localStorage.setItem('ewaste_lang', language);
    set({ language });
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
      localStorage.removeItem('ewaste_auth_session');
      set({ user: null, token: null, accessToken: null, isAuthenticated: false });
    } catch (err) {
      console.error('Session init failed:', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));
