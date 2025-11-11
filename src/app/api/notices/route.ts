import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * GET /api/notices
 * 활성 공지사항 목록을 조회합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const activeOnly = searchParams.get('active') !== 'false'; // 기본값: true

    const supabase = createApiClient();

    let query = supabase
      .from('notices')
      .select('id, title, content, is_active, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    // 활성 공지만 조회 (기본값)
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data: notices, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      notices: notices || [],
      count: notices?.length || 0,
    });

  } catch (error) {
    console.error('공지사항 목록 조회 에러:', error);
    return NextResponse.json(
      { error: '공지사항 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notices
 * 새 공지사항을 생성합니다. (관리자 전용)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, isActive = true } = body;

    // 유효성 검사
    if (!title || title.trim().length < 2) {
      return NextResponse.json(
        { error: '제목은 최소 2자 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length < 5) {
      return NextResponse.json(
        { error: '내용은 최소 5자 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    // TODO: 관리자 권한 체크 (Phase 6에서 구현)
    // const isAdmin = await checkAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    // }

    const supabase = createApiClient();

    const { data: notice, error } = await supabase
      .from('notices')
      .insert({
        title: title.trim(),
        content: content.trim(),
        is_active: isActive,
      })
      .select()
      .single();

    if (error) {
      console.error('공지사항 생성 실패:', error);
      return NextResponse.json(
        { error: '공지사항 생성 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '공지사항이 생성되었습니다.',
      notice,
    });

  } catch (error) {
    console.error('공지사항 생성 에러:', error);
    return NextResponse.json(
      { 
        error: '공지사항 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notices
 * 공지사항을 수정합니다. (관리자 전용)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: '공지사항 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // TODO: 관리자 권한 체크

    const supabase = createApiClient();

    // 업데이트할 필드만 포함
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: notice, error } = await supabase
      .from('notices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('공지사항 수정 실패:', error);
      return NextResponse.json(
        { error: '공지사항 수정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '공지사항이 수정되었습니다.',
      notice,
    });

  } catch (error) {
    console.error('공지사항 수정 에러:', error);
    return NextResponse.json(
      { error: '공지사항 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notices
 * 공지사항을 삭제합니다. (관리자 전용)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '공지사항 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // TODO: 관리자 권한 체크

    const supabase = createApiClient();

    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('공지사항 삭제 실패:', error);
      return NextResponse.json(
        { error: '공지사항 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '공지사항이 삭제되었습니다.',
    });

  } catch (error) {
    console.error('공지사항 삭제 에러:', error);
    return NextResponse.json(
      { error: '공지사항 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

