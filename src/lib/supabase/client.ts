import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zqnzakkmnwcygmeuwkgs.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_NLSuRmc53NSj8i0byzBL2w_KuYQvfQO';

/**
 * Browser-side Supabase client using the public publishable key.
 * Used for Realtime channel subscriptions, presence, and public queries.
 */
export const supabase = createClient<any>(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
