import { NextResponse } from 'next/server';
import { getDropboxClient } from '@/lib/dropbox/client';
import { createApiClient } from '@/lib/supabase/server';

/**
 * PDF 파일 다운로드 (Dropbox Shared Link 방식)
 * GET /api/files/download?fileId=xxx
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: '파일 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createApiClient();

    // 1. 파일 정보 조회
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return NextResponse.json(
        { success: false, error: '파일을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 2. Dropbox 임시 링크 생성 (4시간 유효)
    const dbx = getDropboxClient();
    
    try {
      console.log(`[Download] 파일 요청: ${file.name}`);
      console.log(`[Download] 경로: ${file.dropbox_path}`);

      // filesGetTemporaryLink 사용 (로그인 불필요, 4시간 유효)
      const { result } = await dbx.filesGetTemporaryLink({
        path: file.dropbox_path,
      });

      console.log(`[Download] 임시 링크 생성 성공: ${file.name}`);
      console.log(`[Download] 링크: ${result.link.substring(0, 50)}...`);

      // 3. 클릭 수 증가 (비동기)
      supabase
        .from('files')
        .update({ click_count: (file.click_count || 0) + 1 })
        .eq('id', fileId)
        .then(() => console.log(`[Download] 클릭수 증가: ${file.name}`));

      return NextResponse.json({
        success: true,
        downloadUrl: result.link,
        file: {
          id: file.id,
          name: file.name,
          size: file.file_size,
          modified: file.last_modified,
        },
      });
    } catch (dropboxError: any) {
      console.error('[Download] Dropbox 오류:', dropboxError);
      console.error('[Download] Error details:', {
        message: dropboxError.message,
        error: dropboxError.error,
        status: dropboxError.status,
        path: file.dropbox_path,
      });
      
      // 상세한 에러 메시지
      let errorMessage = 'Dropbox에서 파일을 가져올 수 없습니다.';
      if (dropboxError.status === 401) {
        errorMessage = 'Dropbox 인증 실패. Access Token을 확인하세요.';
      } else if (dropboxError.status === 409) {
        errorMessage = '파일 경로가 잘못되었거나 파일이 존재하지 않습니다.';
      } else if (dropboxError.error?.error_summary) {
        errorMessage = `Dropbox 오류: ${dropboxError.error.error_summary}`;
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: dropboxError.message || String(dropboxError),
          path: file.dropbox_path,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Download] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

