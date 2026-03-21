import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  console.warn('[supabase] EXPO_PUBLIC_SUPABASE_URL is not set — auth will not work');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
