import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * GET /api/admin/textbooks/[id]
 * 교재 상세 정보 및 통계 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // TODO: 관리자 권한 체크 (Phase 6에서 구현)
    
    const supabase = createApiClient();

    // 1. 교재 기본 정보
    const { data: textbook, error: textbookError } = await supabase
      .from('textbooks')
      .select('id, name, dropbox_path, created_at')
      .eq('id', id)
      .single();

    if (textbookError || !textbook) {
      return NextResponse.json(
        { error: '교재를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2. 챕터 및 파일 정보
    const { data: chapters } = await supabase
      .from('chapters')
      .select(`
        id,
        name,
        order_index,
        files (
          id,
          name,
          file_type,
          click_count,
          is_active,
          created_at
        )
      `)
      .eq('textbook_id', id)
      .order('order_index', { ascending: true });

    // 3. 전체 통계 계산
    const allFiles = chapters?.flatMap(ch => ch.files || []) || [];
    const activeFiles = allFiles.filter(f => f.is_active);
    const totalClicks = activeFiles.reduce((sum, f) => sum + f.click_count, 0);

    // 4. 최근 30일 일별 클릭 추이
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fileIds = activeFiles.map(f => f.id);
    
    let dailyClicks: { date: string; count: number }[] = [];
    
    if (fileIds.length > 0) {
      const { data: clicksData } = await supabase
        .from('file_clicks')
        .select('clicked_at')
        .in('file_id', fileIds)
        .gte('clicked_at', thirtyDaysAgo.toISOString())
        .order('clicked_at', { ascending: true });

      // 일별로 그룹화
      const dailyMap = new Map<string, number>();
      
      clicksData?.forEach(click => {
        const date = new Date(click.clicked_at).toISOString().split('T')[0];
        dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
      });

      // 배열로 변환
      dailyClicks = Array.from(dailyMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    // 5. 인기 파일 TOP 10
    const topFiles = activeFiles
      .sort((a, b) => b.click_count - a.click_count)
      .slice(0, 10)
      .map(file => {
        // 해당 파일의 챕터 찾기
        const chapter = chapters?.find(ch => 
          ch.files?.some(f => f.id === file.id)
        );
        
        return {
          id: file.id,
          name: file.name,
          chapterName: chapter?.name || '알 수 없음',
          clickCount: file.click_count,
          createdAt: file.created_at,
        };
      });

    return NextResponse.json({
      success: true,
      textbook: {
        id: textbook.id,
        name: textbook.name,
        dropbox_path: textbook.dropbox_path,
        created_at: textbook.created_at,
      },
      stats: {
        totalClicks,
        fileCount: activeFiles.length,
        chapterCount: chapters?.length || 0,
      },
      chapters: chapters?.map(ch => ({
        id: ch.id,
        name: ch.name,
        order_index: ch.order_index,
        fileCount: ch.files?.filter(f => f.is_active).length || 0,
        totalClicks: ch.files?.filter(f => f.is_active).reduce((sum, f) => sum + f.click_count, 0) || 0,
      })) || [],
      topFiles,
      dailyClicks,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('교재 상세 조회 에러:', error);
    return NextResponse.json(
      { 
        error: '교재 상세 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

