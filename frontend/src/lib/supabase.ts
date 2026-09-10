import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || ''
).trim();

export const isSupabaseConfigured = () => {
  return (
    /^https:\/\/[^\s]+\.supabase\.co$/.test(supabaseUrl) &&
    supabaseAnonKey.length > 20 &&
    !supabaseAnonKey.includes('your-')
  );
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder_anon_key',
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  },
);
