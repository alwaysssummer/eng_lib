import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * GET /api/admin/top-textbooks
 * 인기 교재 TOP N 조회
 * 
 * Query Parameters:
 * - limit: 반환할 교재 수 (기본값: 10)
 * - period: 'week' | 'month' | 'all' (기본값: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || 'all';

    // TODO: 관리자 권한 체크 (Phase 6에서 구현)
    
    const supabase = createApiClient();

    // 기간 설정
    let startDate: Date | null = null;
    if (period !== 'all') {
      const now = new Date();
      startDate = new Date(now);
      
      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      }
    }

    // 교재별 클릭수 집계
    // 1. 모든 교재 조회 (is_active 컬럼이 없으므로 제거)
    const { data: textbooks, error: textbooksError } = await supabase
      .from('textbooks')
      .select(`
        id,
        name,
        dropbox_path,
        created_at,
        chapters (
          id,
          files (
            id,
            click_count,
            is_active
          )
        )
      `);

    if (textbooksError) {
      console.error('교재 조회 실패:', textbooksError);
      // 관계 설정이 안되어 있을 수 있으므로 기본 조회로 폴백
      const { data: basicTextbooks, error: basicError } = await supabase
        .from('textbooks')
        .select('id, name, dropbox_path, created_at');

      if (basicError) {
        throw new Error(`교재 조회 실패: ${basicError.message}`);
      }

      // 기본 조회 성공 시 파일 클릭수는 별도 조회
      const textbookStats = await Promise.all(
        (basicTextbooks || []).map(async (textbook) => {
          // 해당 교재의 파일들 조회
          const { data: chapters } = await supabase
            .from('chapters')
            .select('id')
            .eq('textbook_id', textbook.id);

          if (!chapters || chapters.length === 0) {
            return {
              id: textbook.id,
              name: textbook.name,
              dropbox_path: textbook.dropbox_path,
              totalClicks: 0,
              fileCount: 0,
              created_at: textbook.created_at,
            };
          }

          const chapterIds = chapters.map(ch => ch.id);
          
          const { data: files } = await supabase
            .from('files')
            .select('click_count')
            .in('chapter_id', chapterIds)
            .eq('is_active', true);

          const totalClicks = files?.reduce((sum, f) => sum + f.click_count, 0) || 0;

          return {
            id: textbook.id,
            name: textbook.name,
            dropbox_path: textbook.dropbox_path,
            totalClicks,
            fileCount: files?.length || 0,
            created_at: textbook.created_at,
          };
        })
      );

      const topTextbooks = textbookStats
        .sort((a, b) => b.totalClicks - a.totalClicks)
        .slice(0, limit);

      return NextResponse.json({
        success: true,
        textbooks: topTextbooks,
        count: topTextbooks.length,
        period,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. 기간별 클릭 데이터 조회 (필요시)
    let periodClicks: { file_id: string; count: number }[] = [];
    
    if (period !== 'all' && startDate) {
      const { data: clickData, error: clickError } = await supabase
        .from('file_clicks')
        .select('file_id')
        .gte('clicked_at', startDate.toISOString());

      if (clickError) {
        console.error('기간별 클릭 조회 실패:', clickError);
      } else if (clickData) {
        // 파일별 클릭 수 집계
        const clickMap = new Map<string, number>();
        clickData.forEach(click => {
          clickMap.set(click.file_id, (clickMap.get(click.file_id) || 0) + 1);
        });
        periodClicks = Array.from(clickMap.entries()).map(([file_id, count]) => ({
          file_id,
          count,
        }));
      }
    }

    // 3. 교재별 통계 계산
    const textbookStats = textbooks?.map(textbook => {
      const allFiles = textbook.chapters?.flatMap(ch => ch.files || []) || [];
      const activeFiles = allFiles.filter(f => f.is_active);

      let totalClicks = 0;
      
      if (period === 'all') {
        // 전체 기간: click_count 합산
        totalClicks = activeFiles.reduce((sum, file) => sum + file.click_count, 0);
      } else {
        // 특정 기간: 기간별 클릭 데이터 사용
        totalClicks = activeFiles.reduce((sum, file) => {
          const periodClick = periodClicks.find(pc => pc.file_id === file.id);
          return sum + (periodClick?.count || 0);
        }, 0);
      }

      return {
        id: textbook.id,
        name: textbook.name,
        dropbox_path: textbook.dropbox_path,
        totalClicks,
        fileCount: activeFiles.length,
        created_at: textbook.created_at,
      };
    }) || [];

    // 4. 클릭수 기준 정렬 및 제한
    const topTextbooks = textbookStats
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      textbooks: topTextbooks,
      count: topTextbooks.length,
      period,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('==========================================');
    console.error('인기 교재 조회 에러 상세:');
    console.error('에러 타입:', error instanceof Error ? 'Error' : typeof error);
    console.error('에러 메시지:', error instanceof Error ? error.message : String(error));
    console.error('에러 스택:', error instanceof Error ? error.stack : 'N/A');
    console.error('==========================================');
    
    return NextResponse.json(
      { 
        error: '인기 교재 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

