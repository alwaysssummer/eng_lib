import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 디버그: 데이터베이스 상태 확인
 * GET /api/debug/textbooks
 */
export async function GET() {
  try {
    const supabase = createApiClient();
    
    // 1. 모든 교재 조회
    const { data: allTextbooks, error: textbooksError } = await supabase
      .from('textbooks')
      .select('id, name, dropbox_path')
      .order('name');
    
    if (textbooksError) throw textbooksError;
    
    // 2. 각 교재별 파일 수 조회
    const textbooksWithFileCounts = await Promise.all(
      (allTextbooks || []).map(async (textbook) => {
        // 활성 파일 수
        const { count: activeCount } = await supabase
          .from('files')
          .select('*', { count: 'exact', head: true })
          .eq('textbook_id', textbook.id)
          .eq('is_active', true);
        
        // 전체 파일 수
        const { count: totalCount } = await supabase
          .from('files')
          .select('*', { count: 'exact', head: true })
          .eq('textbook_id', textbook.id);
        
        return {
          ...textbook,
          activeFiles: activeCount || 0,
          totalFiles: totalCount || 0,
          inactiveFiles: (totalCount || 0) - (activeCount || 0),
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      totalTextbooks: textbooksWithFileCounts.length,
      textbooks: textbooksWithFileCounts,
    });
  } catch (error) {
    console.error('[Debug Textbooks] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

