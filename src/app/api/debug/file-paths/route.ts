import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 디버그: 특정 교재의 파일 경로 확인
 * GET /api/debug/file-paths?textbook=--2025_EBS
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const textbookName = searchParams.get('textbook') || '--2025_EBS';
    
    const supabase = createApiClient();
    
    // 교재 ID 조회
    const { data: textbook } = await supabase
      .from('textbooks')
      .select('id, name')
      .ilike('name', textbookName)
      .single();
    
    if (!textbook) {
      return NextResponse.json({ error: '교재를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 해당 교재의 모든 활성 파일 경로 조회
    const { data: files } = await supabase
      .from('files')
      .select('id, name, dropbox_path, is_active')
      .eq('textbook_id', textbook.id)
      .eq('is_active', true)
      .order('dropbox_path')
      .limit(20);
    
    return NextResponse.json({
      success: true,
      textbook,
      files: files?.map(f => ({
        name: f.name,
        path: f.dropbox_path,
        parts: f.dropbox_path.split('/').filter(Boolean),
      })),
    });
  } catch (error) {
    console.error('[Debug File Paths] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

