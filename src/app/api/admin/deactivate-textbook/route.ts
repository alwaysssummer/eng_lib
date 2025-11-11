import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 특정 교재의 모든 파일을 비활성화
 * POST /api/admin/deactivate-textbook
 * Body: { textbookName: string }
 */
export async function POST(request: Request) {
  try {
    const { textbookName } = await request.json();
    
    if (!textbookName) {
      return NextResponse.json({ error: 'textbookName is required' }, { status: 400 });
    }
    
    const supabase = createApiClient();
    
    console.log(`[Deactivate Textbook] 교재 "${textbookName}"의 모든 파일 비활성화 시작`);
    
    // 1. 해당 교재 찾기
    const { data: textbook, error: textbookError } = await supabase
      .from('textbooks')
      .select('id, name')
      .eq('name', textbookName)
      .single();
    
    if (textbookError || !textbook) {
      console.error(`[Deactivate Textbook] 교재를 찾을 수 없음: ${textbookName}`, textbookError);
      return NextResponse.json({ 
        error: '교재를 찾을 수 없습니다',
        details: textbookError?.message 
      }, { status: 404 });
    }
    
    console.log(`[Deactivate Textbook] 교재 ID: ${textbook.id}`);
    
    // 2. 해당 교재의 모든 활성 파일 비활성화
    const { data: deactivatedFiles, error: deactivateError } = await supabase
      .from('files')
      .update({ is_active: false })
      .eq('textbook_id', textbook.id)
      .eq('is_active', true)
      .select('id, name, dropbox_path');
    
    if (deactivateError) {
      console.error(`[Deactivate Textbook] 파일 비활성화 실패:`, deactivateError);
      return NextResponse.json({ 
        error: '파일 비활성화 실패',
        details: deactivateError.message 
      }, { status: 500 });
    }
    
    console.log(`[Deactivate Textbook] ${deactivatedFiles?.length || 0}개 파일 비활성화 완료`);
    
    return NextResponse.json({
      success: true,
      message: `교재 "${textbookName}"의 ${deactivatedFiles?.length || 0}개 파일이 비활성화되었습니다.`,
      textbook: {
        id: textbook.id,
        name: textbook.name,
      },
      filesDeactivated: deactivatedFiles?.length || 0,
      files: deactivatedFiles?.slice(0, 5).map(f => f.name) || [], // 처음 5개 파일명만 반환
    });
  } catch (error) {
    console.error('[Deactivate Textbook] 오류:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

