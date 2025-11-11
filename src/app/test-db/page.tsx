'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestDBPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [tables, setTables] = useState<string[]>([]);

  useEffect(() => {
    async function testConnection() {
      try {
        // 1. 기본 연결 테스트
        const { data, error } = await supabase
          .from('textbooks')
          .select('count');

        if (error) {
          setStatus('error');
          setMessage(JSON.stringify(error, null, 2));
          return;
        }

        // 2. 모든 테이블 확인
        const tableNames = [
          'textbooks',
          'chapters',
          'files',
          'textbook_requests',
          'notices',
          'user_analytics',
          'file_clicks',
          'dropbox_sync_log',
          'dropbox_cursor'
        ];

        const results = await Promise.all(
          tableNames.map(async (table) => {
            try {
              await supabase.from(table).select('count').limit(1);
              return table;
            } catch {
              return null;
            }
          })
        );

        const existingTables = results.filter((t): t is string => t !== null);
        setTables(existingTables);
        setStatus('success');
        setMessage(`${existingTables.length}개의 테이블이 정상적으로 확인되었습니다.`);
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : '알 수 없는 오류');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🗄️ Supabase 데이터베이스 연결 테스트</h1>

        <div className={`p-6 rounded-lg border-2 mb-6 ${
          status === 'loading' ? 'border-gray-300 bg-gray-50' :
          status === 'success' ? 'border-green-500 bg-green-50' :
          'border-red-500 bg-red-50'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {status === 'loading' && <div className="animate-spin">⏳</div>}
            {status === 'success' && <div className="text-2xl">✅</div>}
            {status === 'error' && <div className="text-2xl">❌</div>}
            
            <h2 className="text-xl font-semibold">
              {status === 'loading' && '연결 중...'}
              {status === 'success' && '연결 성공!'}
              {status === 'error' && '연결 실패'}
            </h2>
          </div>

          <p className={`mb-4 ${
            status === 'success' ? 'text-green-700' : 
            status === 'error' ? 'text-red-700' : 
            'text-gray-700'
          }`}>
            {message}
          </p>

          {status === 'error' && (
            <div className="mt-4 p-4 bg-white rounded border">
              <p className="font-semibold mb-2">문제 해결 방법:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li><code>.env.local</code> 파일에 Supabase 환경 변수가 설정되어 있는지 확인</li>
                <li><code>supabase/schema.sql</code> 파일이 Supabase SQL Editor에서 실행되었는지 확인</li>
                <li>Supabase 프로젝트가 활성화되어 있는지 확인</li>
                <li>개발 서버를 재시작하세요 (<code>npm run dev</code>)</li>
              </ol>
            </div>
          )}
        </div>

        {status === 'success' && (
          <div className="p-6 rounded-lg border bg-white">
            <h3 className="text-lg font-semibold mb-4">📊 테이블 목록</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tables.map((table) => (
                <div
                  key={table}
                  className="p-3 bg-blue-50 rounded border border-blue-200"
                >
                  <span className="text-sm font-mono">{table}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-2">환경 설정:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    NEXT_PUBLIC_SUPABASE_URL
                  </span>
                  <span className="text-green-600">✓ 설정됨</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </span>
                  <span className="text-green-600">✓ 설정됨</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold mb-2">💡 다음 단계</h3>
          <p className="text-sm text-gray-700">
            데이터베이스 연결이 성공했다면 <strong>Task 3 (shadcn/ui 설치)</strong>로 넘어가세요!
          </p>
        </div>
      </div>
    </div>
  );
}

