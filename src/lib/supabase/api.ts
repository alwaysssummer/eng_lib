import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * API 라우트용 Supabase 클라이언트
 * Service Role Key를 사용하여 모든 권한으로 접근
 */
export function createApiClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL과 Service Role Key가 설정되지 않았습니다.');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

