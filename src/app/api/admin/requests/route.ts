import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

/**
 * GET /api/admin/requests
 * 교재 요청 목록 조회 (관리자용)
 * 
 * Query Parameters:
 * - status: 'all' | 'pending' | 'in_progress' | 'completed' | 'rejected' (기본값: 'all')
 * - sort: 'request_count' | 'created_at' | 'updated_at' (기본값: 'request_count')
 * - order: 'asc' | 'desc' (기본값: 'desc')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sort') || 'request_count';
    const order = searchParams.get('order') || 'desc';

    // TODO: 관리자 권한 체크 (Phase 6에서 구현)
    
    const supabase = createApiClient();

    let query = supabase
      .from('textbook_requests')
      .select('*');

    // 상태 필터
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // 정렬
    const ascending = order === 'asc';
    query = query.order(sortBy, { ascending });

    const { data: requests, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      requests: requests || [],
      count: requests?.length || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('요청 목록 조회 에러:', error);
    return NextResponse.json(
      { 
        error: '요청 목록 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/requests/[id]
 * 교재 요청 상태 변경
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, adminMemo } = body;

    if (!id) {
      return NextResponse.json(
        { error: '요청 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (status && !['pending', 'in_progress', 'completed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태값입니다.' },
        { status: 400 }
      );
    }

    // TODO: 관리자 권한 체크 (Phase 6에서 구현)
    
    const supabase = createApiClient();

    // 업데이트할 필드 구성
    const updateData: any = {};
    if (status) updateData.status = status;
    if (adminMemo !== undefined) updateData.admin_memo = adminMemo;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('textbook_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      request: data,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('요청 상태 변경 에러:', error);
    return NextResponse.json(
      { 
        error: '요청 상태 변경 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

