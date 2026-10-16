import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zqnzakkmnwcygmeuwkgs.supabase.co';

// Use service role key if available in server environment, otherwise fallback to publishable key
const serverKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_NLSuRmc53NSj8i0byzBL2w_KuYQvfQO';

/**
 * Server-only Supabase client for Next.js Route Handlers and Server Actions.
 * Never imported or executed in client components.
 */
export function createServerSupabaseClient() {
  return createClient<any>(supabaseUrl, serverKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const serverSupabase = createServerSupabaseClient();
