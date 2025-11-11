import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * GET /api/admin/hourly-stats
 * 시간대별 접속 통계 (그래프용 데이터)
 * 
 * Query Parameters:
 * - date: YYYY-MM-DD (기본값: 오늘)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // TODO: 관리자 권한 체크 (Phase 6에서 구현)
    
    const supabase = createApiClient();

    // 날짜 설정
    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
    } else {
      targetDate = new Date();
      targetDate.setHours(0, 0, 0, 0);
    }

    // 시작/종료 시간
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    // 해당 날짜의 모든 클릭 조회
    const { data: clicks, error: clicksError } = await supabase
      .from('file_clicks')
      .select('clicked_at')
      .gte('clicked_at', startDate.toISOString())
      .lte('clicked_at', endDate.toISOString())
      .order('clicked_at', { ascending: true });

    if (clicksError) {
      throw clicksError;
    }

    // 시간대별로 그룹화 (0시~23시)
    const hourlyData: { hour: number; count: number }[] = [];
    const hourCounts = new Array(24).fill(0);

    clicks?.forEach(click => {
      const hour = new Date(click.clicked_at).getHours();
      hourCounts[hour]++;
    });

    // 결과 포맷
    for (let hour = 0; hour < 24; hour++) {
      hourlyData.push({
        hour,
        count: hourCounts[hour],
      });
    }

    // 총 클릭 수
    const totalClicks = clicks?.length || 0;

    // 피크 시간대 찾기
    const maxCount = Math.max(...hourCounts);
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count === maxCount)
      .map(h => h.hour);

    return NextResponse.json({
      success: true,
      date: targetDate.toISOString().split('T')[0],
      hourlyData,
      summary: {
        totalClicks,
        peakHours,
        peakCount: maxCount,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('시간대별 통계 조회 에러:', error);
    return NextResponse.json(
      { 
        error: '시간대별 통계 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

