import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://fxxapeuvofqdhjedzulc.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_8zcT_JtJ9tR-d9gypHHPBg_AVmm_LL_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
