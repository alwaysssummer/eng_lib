import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/server';

/**
 * 동기화 상태 조회
 * GET /api/sync/status
 */
export async function GET() {
  try {
    const supabase = createApiClient();
    
    // 1. 마지막 동기화 로그 조회
    const { data: lastSync, error: syncError } = await supabase
      .from('dropbox_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (syncError && syncError.code !== 'PGRST116') {
      throw syncError;
    }

    // 2. 커서 정보 조회
    const { data: cursor, error: cursorError } = await supabase
      .from('dropbox_cursor')
      .select('*')
      .eq('id', 1)
      .single();

    if (cursorError && cursorError.code !== 'PGRST116') {
      throw cursorError;
    }

    // 3. 전체 파일 통계
    const { data: fileStats, error: statsError } = await supabase
      .from('files')
      .select('is_active')
      .eq('is_active', true);

    if (statsError) throw statsError;

    // 4. 교재별 통계
    const { data: textbookStats, error: textbookError } = await supabase
      .from('textbooks')
      .select('id, name, total_clicks');

    if (textbookError) throw textbookError;

    return NextResponse.json({
      success: true,
      data: {
        lastSync: lastSync ? {
          type: lastSync.sync_type,
          status: lastSync.status,
          timestamp: lastSync.created_at,
          metadata: lastSync.metadata,
        } : null,
        cursor: cursor ? {
          lastUpdated: cursor.updated_at,
          hasCursor: !!cursor.cursor_value,
        } : null,
        statistics: {
          totalFiles: fileStats?.length || 0,
          totalTextbooks: textbookStats?.length || 0,
          textbooks: textbookStats || [],
        },
      },
    });
  } catch (error) {
    console.error('[Sync Status] 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        message: '동기화 상태 조회 중 오류가 발생했습니다.',
        error: String(error),
      },
      { status: 500 }
    );
  }
}

