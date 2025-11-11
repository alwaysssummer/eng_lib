import { NextResponse } from 'next/server';
import { getDropboxClient } from '@/lib/dropbox/client';
import { createApiClient } from '@/lib/supabase/server';

/**
 * PDF 파일 프록시 (CORS 우회 및 올바른 헤더 제공)
 * GET /api/files/proxy?fileId=xxx&download=true
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const isDownload = searchParams.get('download') === 'true';

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

    // 2. Dropbox에서 파일 다운로드
    const dbx = getDropboxClient();
    
    try {
      console.log(`[Proxy] 파일 요청: ${file.name} (다운로드: ${isDownload})`);

      // filesGetTemporaryLink로 다운로드 URL 가져오기
      const { result } = await dbx.filesGetTemporaryLink({
        path: file.dropbox_path,
      });

      console.log(`[Proxy] 임시 링크 생성: ${file.name}`);

      // 서버에서 파일 다운로드
      const fileResponse = await fetch(result.link);
      
      if (!fileResponse.ok) {
        throw new Error(`파일 다운로드 실패: ${fileResponse.statusText}`);
      }

      // ArrayBuffer로 받기
      const fileData = await fileResponse.arrayBuffer();

      console.log(`[Proxy] 파일 다운로드 완료: ${file.name} (${fileData.byteLength} bytes)`);

      // 3. 클릭 수 증가 (비동기)
      if (!isDownload) {
        supabase
          .from('files')
          .update({ click_count: (file.click_count || 0) + 1 })
          .eq('id', fileId)
          .then(() => console.log(`[Proxy] 클릭수 증가: ${file.name}`));
      }

      // 4. 올바른 헤더와 함께 반환
      return new Response(fileData, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': isDownload 
            ? `attachment; filename="${encodeURIComponent(file.name)}"` 
            : `inline; filename="${encodeURIComponent(file.name)}"`,
          'Cache-Control': 'public, max-age=3600', // 1시간 캐시
        },
      });
    } catch (dropboxError: any) {
      console.error('[Proxy] Dropbox 오류:', dropboxError);
      
      let errorMessage = 'Dropbox에서 파일을 가져올 수 없습니다.';
      if (dropboxError.status === 401) {
        errorMessage = 'Dropbox 인증 실패. Access Token을 확인하세요.';
      } else if (dropboxError.status === 409) {
        errorMessage = '파일 경로가 잘못되었거나 파일이 존재하지 않습니다.';
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: dropboxError.message || String(dropboxError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Proxy] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

