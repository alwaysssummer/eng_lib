import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Next.js App Router용 서버 컴포넌트 클라이언트
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Server Component에서는 쿠키 설정 불가능
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Server Component에서는 쿠키 삭제 불가능
          }
        },
      },
    }
  );
}

// API Route용 클라이언트 (쿠키 불필요)
// 동기화 작업 등 서버 전용 작업을 위해 Service Role Key 사용
export function createApiClient() {
  // SUPABASE_SERVICE_ROLE_KEY가 있으면 사용 (RLS 우회)
  // 없으면 ANON_KEY 사용 (RLS 적용)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key
  );
}

