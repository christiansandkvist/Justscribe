import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

// Log key format on startup (first 20 chars only, for debugging)
console.log('[supabase] URL:', supabaseUrl);
console.log('[supabase] Service key prefix:', supabaseServiceKey.slice(0, 20) + '...');

// Service role client — bypasses RLS, used only server-side
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
