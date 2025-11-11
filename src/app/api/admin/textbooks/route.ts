import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const sort = searchParams.get('sort') || 'clicks'; // 'clicks' | 'name'
    const order = searchParams.get('order') || 'desc'; // 'asc' | 'desc'
    const search = searchParams.get('search') || '';

    // 교재 목록 조회 (파일 수와 총 클릭수 포함)
    let query = supabase
      .from('textbooks')
      .select(`
        id,
        name,
        description,
        total_clicks,
        is_active,
        created_at,
        updated_at
      `);

    // 검색 필터
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // 정렬
    if (sort === 'name') {
      query = query.order('name', { ascending: order === 'asc' });
    } else {
      query = query.order('total_clicks', { ascending: order === 'asc' });
    }

    const { data: textbooks, error: textbooksError } = await query;

    if (textbooksError) {
      throw textbooksError;
    }

    // 각 교재의 파일 수 조회
    const textbooksWithFileCount = await Promise.all(
      (textbooks || []).map(async (textbook) => {
        const { count, error: countError } = await supabase
          .from('files')
          .select('*', { count: 'exact', head: true })
          .eq('textbook_id', textbook.id)
          .eq('is_active', true);

        if (countError) {
          console.error('Error counting files:', countError);
          return { ...textbook, file_count: 0 };
        }

        return {
          ...textbook,
          file_count: count || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      textbooks: textbooksWithFileCount,
      count: textbooksWithFileCount.length,
      sort: { by: sort, order },
    });
  } catch (error) {
    console.error('Error fetching textbooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch textbooks' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Textbook ID is required' },
        { status: 400 }
      );
    }

    // TODO: 관리자 권한 체크 (Phase 6에서 구현)

    // 교재 활성화/비활성화 업데이트
    const { data, error } = await supabase
      .from('textbooks')
      .update({ 
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 교재에 속한 파일도 함께 활성화/비활성화
    await supabase
      .from('files')
      .update({ is_active })
      .eq('textbook_id', id);

    return NextResponse.json({
      success: true,
      textbook: data,
    });
  } catch (error) {
    console.error('Error updating textbook:', error);
    return NextResponse.json(
      { error: 'Failed to update textbook' },
      { status: 500 }
    );
  }
}
