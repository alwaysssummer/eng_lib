'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

interface SyncStatus {
  lastSync: {
    type: string;
    status: string;
    timestamp: string;
    metadata: any;
  } | null;
  cursor: {
    lastUpdated: string;
    hasCursor: boolean;
  } | null;
  statistics: {
    totalFiles: number;
    totalTextbooks: number;
    textbooks: Array<{ id: string; name: string; total_clicks: number }>;
  };
}

export default function TestSyncPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [status, setStatus] = useState<SyncStatus | null>(null);

  const handleSync = async (type: 'full' | 'incremental') => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/sync/manual?type=${type}`);
      const data = await response.json();
      setResult(data);

      // 동기화 후 상태 갱신
      await fetchStatus();
    } catch (error) {
      setResult({
        success: false,
        message: '동기화 요청 중 오류가 발생했습니다.',
        error: String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/sync/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('상태 조회 실패:', error);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-muted/30">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold mb-2">🔄 Dropbox 동기화 테스트</h1>
          <p className="text-muted-foreground">
            Dropbox API 연동 및 실시간 동기화 시스템을 테스트합니다.
          </p>
        </div>

        {/* 동기화 버튼 */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">동기화 실행</h2>
          <div className="flex gap-4">
            <Button
              onClick={() => handleSync('full')}
              disabled={loading}
              size="lg"
              variant="default"
            >
              {loading ? '동기화 중...' : '전체 동기화 (Full Sync)'}
            </Button>
            <Button
              onClick={() => handleSync('incremental')}
              disabled={loading}
              size="lg"
              variant="secondary"
            >
              {loading ? '동기화 중...' : '증분 동기화 (Incremental)'}
            </Button>
            <Button
              onClick={fetchStatus}
              disabled={loading}
              size="lg"
              variant="outline"
            >
              상태 새로고침
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>전체 동기화:</strong> Dropbox의 모든 PDF 파일을 스캔하여 동기화 (최초 1회)<br/>
              <strong>증분 동기화:</strong> 마지막 동기화 이후 변경된 파일만 처리 (일반적인 사용)
            </p>
          </div>
        </Card>

        {/* 동기화 결과 */}
        {result && (
          <Card className={`p-6 ${result.success ? 'border-green-500' : 'border-red-500'}`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {result.success ? '✅' : '❌'}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {result.success ? '동기화 성공' : '동기화 실패'}
                </h3>
                <p className="text-sm mb-3">{result.message}</p>
                
                {result.data && (
                  <div className="p-4 bg-muted rounded text-sm">
                    <pre className="overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}

                {result.error && (
                  <div className="p-4 bg-destructive/10 rounded text-sm text-destructive">
                    <strong>오류:</strong> {result.error}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* 동기화 상태 */}
        {status ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 마지막 동기화 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">📊 마지막 동기화</h3>
              {status.lastSync ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">타입:</span>
                    <Badge variant={status.lastSync.type === 'full' ? 'default' : 'secondary'}>
                      {status.lastSync.type}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">상태:</span>
                    <Badge variant={status.lastSync.status === 'success' ? 'default' : 'destructive'}>
                      {status.lastSync.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">시간:</span>
                    <span className="text-sm">
                      {new Date(status.lastSync.timestamp).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  {status.lastSync.metadata && (
                    <div className="mt-4 p-3 bg-muted rounded text-xs">
                      <pre>{JSON.stringify(status.lastSync.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">아직 동기화 기록이 없습니다.</p>
              )}
            </Card>

            {/* 통계 */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">📈 통계</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted rounded">
                  <span className="text-sm font-medium">전체 PDF 파일</span>
                  <Badge variant="outline" className="text-lg">
                    {status.statistics.totalFiles}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted rounded">
                  <span className="text-sm font-medium">교재 개수</span>
                  <Badge variant="outline" className="text-lg">
                    {status.statistics.totalTextbooks}
                  </Badge>
                </div>
              </div>

              {status.cursor && (
                <div className="mt-4 p-3 bg-muted rounded text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">커서 상태:</span>
                    <Badge variant={status.cursor.hasCursor ? 'default' : 'secondary'}>
                      {status.cursor.hasCursor ? '있음' : '없음'}
                    </Badge>
                  </div>
                  {status.cursor.hasCursor && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      마지막 업데이트: {new Date(status.cursor.lastUpdated).toLocaleString('ko-KR')}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* 교재 목록 */}
            {status.statistics.textbooks.length > 0 && (
              <Card className="p-6 md:col-span-2">
                <h3 className="text-lg font-semibold mb-4">📚 교재 목록</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {status.statistics.textbooks.map((textbook) => (
                    <div
                      key={textbook.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="font-medium mb-1">{textbook.name}</div>
                      <div className="text-sm text-muted-foreground">
                        클릭수: {textbook.total_clicks || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card className="p-6">
            <Skeleton className="h-20 w-full" />
          </Card>
        )}

        {/* API 엔드포인트 정보 */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-950">
          <h3 className="text-lg font-semibold mb-4">🔗 API 엔드포인트</h3>
          <div className="space-y-2 text-sm font-mono">
            <div className="p-2 bg-white dark:bg-gray-900 rounded">
              <span className="text-green-600">GET</span> /api/sync/manual?type=full
            </div>
            <div className="p-2 bg-white dark:bg-gray-900 rounded">
              <span className="text-green-600">GET</span> /api/sync/manual?type=incremental
            </div>
            <div className="p-2 bg-white dark:bg-gray-900 rounded">
              <span className="text-green-600">GET</span> /api/sync/status
            </div>
            <div className="p-2 bg-white dark:bg-gray-900 rounded">
              <span className="text-blue-600">POST</span> /api/sync/webhook
            </div>
            <div className="p-2 bg-white dark:bg-gray-900 rounded">
              <span className="text-green-600">GET</span> /api/sync/cron
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

