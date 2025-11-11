import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/track/textbook-stats
 * 교재별 총 클릭수를 집계합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort') || 'name'; // 'name' | 'clicks'
    const order = searchParams.get('order') || 'asc'; // 'asc' | 'desc'

    const supabase = createClient();

    // 1. 교재별 클릭수 집계
    const { data: textbooks, error } = await supabase
      .from('textbooks')
      .select(`
        id,
        name,
        dropbox_path,
        created_at,
        click_count
      `)
      .order(sortBy === 'clicks' ? 'click_count' : 'name', {
        ascending: order === 'asc',
      });

    if (error) {
      throw error;
    }

    // 2. 각 교재의 파일 수 및 총 클릭수 계산
    const textbookStats = await Promise.all(
      (textbooks || []).map(async (textbook) => {
        // 교재에 속한 파일들의 클릭수 합계
        const { data: files, error: filesError } = await supabase
          .from('files')
          .select('id, click_count')
          .eq('textbook_id', textbook.id)
          .eq('is_active', true);

        if (filesError) {
          console.error(`교재 ${textbook.id} 파일 조회 실패:`, filesError);
          return {
            ...textbook,
            total_clicks: 0,
            file_count: 0,
          };
        }

        const totalClicks = files?.reduce((sum, file) => sum + (file.click_count || 0), 0) || 0;
        const fileCount = files?.length || 0;

        return {
          ...textbook,
          total_clicks: totalClicks,
          file_count: fileCount,
        };
      })
    );

    // 3. 정렬 (클릭수순으로 재정렬이 필요한 경우)
    let sortedStats = textbookStats;
    if (sortBy === 'clicks') {
      sortedStats = textbookStats.sort((a, b) => {
        const diff = b.total_clicks - a.total_clicks;
        return order === 'desc' ? diff : -diff;
      });
    }

    return NextResponse.json({
      success: true,
      textbooks: sortedStats,
      count: sortedStats.length,
      sort: {
        by: sortBy,
        order: order,
      },
    });

  } catch (error) {
    console.error('교재별 클릭수 집계 에러:', error);
    return NextResponse.json(
      { 
        error: '교재별 통계 조회에 실패했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

