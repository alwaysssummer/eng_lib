import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * GET /api/admin/textbooks
 * 교재 목록 조회 (관리자용)
 * 
 * Query Parameters:
 * - sort: 'name' | 'clicks' | 'files' | 'created_at' (기본값: 'name')
 * - order: 'asc' | 'desc' (기본값: 'asc')
 * - search: 검색어 (교재명)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort') || 'name';
    const order = searchParams.get('order') || 'asc';
    const search = searchParams.get('search') || '';

    // TODO: 관리자 권한 체크 (Phase 6에서 구현)
    
    const supabase = createApiClient();

    // 1. 모든 교재 조회
    let query = supabase
      .from('textbooks')
      .select('id, name, dropbox_path, created_at');

    // 검색 필터
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: textbooks, error: textbooksError } = await query;

    if (textbooksError) {
      throw textbooksError;
    }

    if (!textbooks || textbooks.length === 0) {
      return NextResponse.json({
        success: true,
        textbooks: [],
        count: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. 각 교재의 통계 계산
    const textbooksWithStats = await Promise.all(
      textbooks.map(async (textbook) => {
        // 해당 교재의 챕터 조회
        const { data: chapters } = await supabase
          .from('chapters')
          .select('id')
          .eq('textbook_id', textbook.id);

        if (!chapters || chapters.length === 0) {
          return {
            id: textbook.id,
            name: textbook.name,
            dropbox_path: textbook.dropbox_path,
            created_at: textbook.created_at,
            totalClicks: 0,
            fileCount: 0,
            chapterCount: 0,
          };
        }

        const chapterIds = chapters.map(ch => ch.id);
        
        // 해당 챕터의 파일들 조회
        const { data: files } = await supabase
          .from('files')
          .select('id, click_count, is_active')
          .in('chapter_id', chapterIds);

        const activeFiles = files?.filter(f => f.is_active) || [];
        const totalClicks = activeFiles.reduce((sum, f) => sum + f.click_count, 0);

        return {
          id: textbook.id,
          name: textbook.name,
          dropbox_path: textbook.dropbox_path,
          created_at: textbook.created_at,
          totalClicks,
          fileCount: activeFiles.length,
          chapterCount: chapters.length,
        };
      })
    );

    // 3. 정렬
    textbooksWithStats.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'clicks':
          compareValue = a.totalClicks - b.totalClicks;
          break;
        case 'files':
          compareValue = a.fileCount - b.fileCount;
          break;
        case 'created_at':
          compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'name':
        default:
          compareValue = a.name.localeCompare(b.name, 'ko');
          break;
      }

      return order === 'desc' ? -compareValue : compareValue;
    });

    return NextResponse.json({
      success: true,
      textbooks: textbooksWithStats,
      count: textbooksWithStats.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('교재 목록 조회 에러:', error);
    return NextResponse.json(
      { 
        error: '교재 목록 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

