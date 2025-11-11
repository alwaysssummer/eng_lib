import { NextResponse } from 'next/server';
import { getDropboxClient } from '@/lib/dropbox/client';

/**
 * Dropbox 연결 및 경로 테스트
 * GET /api/test-dropbox
 */
export async function GET() {
  try {
    const dbx = getDropboxClient();
    const rootPath = process.env.DROPBOX_ROOT_PATH || '';
    
    console.log(`[Test Dropbox] 경로 확인: ${rootPath || '/'}`);
    
    // 1. 계정 정보 확인
    const accountInfo = await dbx.usersGetCurrentAccount();
    console.log(`[Test Dropbox] 계정: ${accountInfo.result.name.display_name}`);
    
    // 2. 지정된 경로의 파일 목록 가져오기 (재귀, PDF만)
    console.log(`[Test Dropbox] 재귀적 스캔 시작...`);
    const startTime = Date.now();
    
    let response = await dbx.filesListFolder({
      path: rootPath,
      recursive: true,
      include_deleted: false,
    });
    
    let allEntries = response.result.entries;
    let iterations = 1;
    
    // 페이지네이션 처리
    while (response.result.has_more) {
      console.log(`[Test Dropbox] 추가 항목 가져오는 중... (iteration ${++iterations})`);
      response = await dbx.filesListFolderContinue({
        cursor: response.result.cursor,
      });
      allEntries = allEntries.concat(response.result.entries);
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // PDF 파일만 필터링
    const pdfFiles = allEntries.filter(
      (entry) => entry['.tag'] === 'file' && entry.name.toLowerCase().endsWith('.pdf')
    );
    
    console.log(`[Test Dropbox] 완료: ${allEntries.length}개 항목, ${pdfFiles.length}개 PDF, ${duration}초 소요`);
    
    return NextResponse.json({
      success: true,
      account: accountInfo.result.name.display_name,
      rootPath: rootPath || '/',
      totalEntries: allEntries.length,
      totalPdfFiles: pdfFiles.length,
      iterations: iterations,
      durationSeconds: parseFloat(duration),
      samplePdfFiles: pdfFiles.slice(0, 10).map(entry => ({
        name: entry.name,
        path: (entry as any).path_display,
      })),
    });
  } catch (error) {
    console.error('[Test Dropbox] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

