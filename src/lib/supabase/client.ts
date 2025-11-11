import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 환경 변수 체크
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL과 Anon Key가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
}

// 클라이언트 사이드 Supabase 클라이언트 생성 함수
export function createClient() {
  return createSupabaseClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// 싱글톤 인스턴스 (하위 호환성)
export const supabase = createClient();

// 서버 사이드 Supabase 클라이언트 (관리자 작업용)
export function createServerClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    throw new Error('Supabase Service Role Key가 설정되지 않았습니다.');
  }
  
  return createSupabaseClient(supabaseUrl!, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// 타입 안전성을 위한 헬퍼 함수들
export async function checkConnection() {
  try {
    const { data, error } = await supabase
      .from('textbooks')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase 연결 오류:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Supabase 연결 실패:', error);
    return false;
  }
}

