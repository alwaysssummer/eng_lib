import { NextRequest, NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * POST /api/requests
 * 교재 요청을 생성합니다.
 * 중복 요청 시 request_count를 증가시킵니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { textbookName } = body;

    if (!textbookName || textbookName.trim().length < 2) {
      return NextResponse.json(
        { error: '교재명은 최소 2자 이상 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = createApiClient();

    // 사용자 IP 수집 (익명화)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';
    const anonymizedIp = ip.split('.').slice(0, 3).join('.') + '.xxx';

    // 1. 중복 요청 체크 (동일 IP에서 24시간 이내 동일 교재 요청)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const { data: recentRequests, error: recentError } = await supabase
      .from('textbook_requests')
      .select('id, updated_at')
      .eq('textbook_name', textbookName.trim())
      .eq('user_ip', anonymizedIp)
      .gte('updated_at', oneDayAgo.toISOString());

    if (recentError) {
      console.error('최근 요청 조회 실패:', recentError);
      // 에러가 나도 계속 진행 (중복 방지는 선택사항)
    }

    if (recentRequests && recentRequests.length > 0) {
      return NextResponse.json(
        { 
          error: '이미 요청하신 교재입니다. 24시간 이후 다시 요청해주세요.',
          duplicate: true
        },
        { status: 429 } // Too Many Requests
      );
    }

    // 2. 동일 교재명이 이미 존재하는지 확인
    const { data: existingRequest, error: findError } = await supabase
      .from('textbook_requests')
      .select('id, request_count, textbook_name')
      .eq('textbook_name', textbookName.trim())
      .single();

    if (findError && findError.code !== 'PGRST116') {
      // PGRST116 = 결과 없음 (정상)
      console.error('요청 조회 실패:', findError);
      return NextResponse.json(
        { error: '요청 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 3. 기존 요청이 있으면 카운트 증가, 없으면 새로 생성
    if (existingRequest) {
      // 카운트 증가 (마지막 요청자 IP도 업데이트)
      const { error: updateError } = await supabase
        .from('textbook_requests')
        .update({ 
          request_count: existingRequest.request_count + 1,
          user_ip: anonymizedIp, // 마지막 요청자 IP
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRequest.id);

      if (updateError) {
        console.error('요청 카운트 증가 실패:', updateError);
        return NextResponse.json(
          { error: '요청 처리 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '교재 요청이 접수되었습니다.',
        request: {
          id: existingRequest.id,
          textbook_name: existingRequest.textbook_name,
          request_count: existingRequest.request_count + 1,
          isNew: false,
        },
      });
    } else {
      // 새 요청 생성
      const { data: newRequest, error: insertError } = await supabase
        .from('textbook_requests')
        .insert({
          textbook_name: textbookName.trim(),
          request_count: 1,
          user_ip: anonymizedIp,
        })
        .select()
        .single();

      if (insertError) {
        console.error('요청 생성 실패:', insertError);
        return NextResponse.json(
          { error: '요청 생성 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '교재 요청이 접수되었습니다.',
        request: {
          id: newRequest.id,
          textbook_name: newRequest.textbook_name,
          request_count: 1,
          isNew: true,
        },
      });
    }

  } catch (error) {
    console.error('교재 요청 에러:', error);
    return NextResponse.json(
      { 
        error: '요청 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/requests
 * 요청 목록을 조회합니다 (인기순).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = createApiClient();

    const { data: requests, error } = await supabase
      .from('textbook_requests')
      .select('id, textbook_name, request_count, created_at, updated_at')
      .order('request_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      requests: requests || [],
      count: requests?.length || 0,
    });

  } catch (error) {
    console.error('요청 목록 조회 에러:', error);
    return NextResponse.json(
      { error: '요청 목록 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

