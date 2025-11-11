import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 교재 정보 조회
    const { data: textbook, error: textbookError } = await supabase
      .from('textbooks')
      .select('*')
      .eq('id', id)
      .single();

    if (textbookError) {
      throw textbookError;
    }

    if (!textbook) {
      return NextResponse.json(
        { error: 'Textbook not found' },
        { status: 404 }
      );
    }

    // 파일 목록 조회 (클릭수 포함)
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('textbook_id', id)
      .order('click_count', { ascending: false });

    if (filesError) {
      throw filesError;
    }

    // 최근 30일 클릭 추이 데이터
    const { data: clickData, error: clickError } = await supabase
      .rpc('get_textbook_daily_clicks', { textbook_id_param: id });

    if (clickError) {
      console.error('Error fetching click trend:', clickError);
      // 에러가 있어도 계속 진행 (함수가 없을 수 있음)
    }

    // 클릭 추이 데이터가 없으면 최근 30일 데이터 직접 계산
    let dailyClicks = clickData || [];
    
    if (!clickData || clickData.length === 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentClicks, error: recentError } = await supabase
        .from('file_clicks')
        .select('clicked_at, file_id')
        .in('file_id', (files || []).map(f => f.id))
        .gte('clicked_at', thirtyDaysAgo.toISOString());

      if (!recentError && recentClicks) {
        // 날짜별로 그룹화
        const clicksByDate: { [key: string]: number } = {};
        recentClicks.forEach(click => {
          const date = new Date(click.clicked_at).toISOString().split('T')[0];
          clicksByDate[date] = (clicksByDate[date] || 0) + 1;
        });

        dailyClicks = Object.entries(clicksByDate).map(([date, count]) => ({
          date,
          clicks: count,
        }));
      }
    }

    return NextResponse.json({
      success: true,
      textbook,
      files: files || [],
      dailyClicks: dailyClicks || [],
      statistics: {
        totalFiles: files?.length || 0,
        totalClicks: textbook.total_clicks || 0,
        activeFiles: files?.filter(f => f.is_active).length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching textbook details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch textbook details' },
      { status: 500 }
    );
  }
}
