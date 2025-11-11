import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 파일 트리 구조 조회 (교재별 클릭수 포함)
 * GET /api/files/tree
 * 
 * 개선 사항:
 * - 활성화된 파일만 조회 (is_active = true)
 * - 파일이 없는 교재는 자동 제외
 * - 직관적이고 안정적인 데이터 처리
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort') || 'name'; // 'name' | 'clicks'
    
    const supabase = createApiClient();
    
    console.log('[Files Tree] 교재 목록 조회 시작');
    
    // 1. 활성화된 파일만 조회 (Dropbox에 존재하는 파일)
    const { data: activeFiles, error: filesError } = await supabase
      .from('files')
      .select(`
        id,
        name,
        dropbox_path,
        file_size,
        click_count,
        last_modified,
        textbook_id,
        textbooks (
          id,
          name,
          dropbox_path
        )
      `)
      .eq('is_active', true)
      .order('name');
    
    if (filesError) {
      console.error('[Files Tree] 파일 조회 실패:', filesError);
      throw filesError;
    }
    
    console.log(`[Files Tree] 활성 파일 ${activeFiles?.length || 0}개 조회됨`);
    
    // 2. 교재별로 파일 그룹화 및 통계 계산
    const textbookMap = new Map<string, {
      id: string;
      name: string;
      dropbox_path: string;
      files: any[];
      totalClicks: number;
      fileCount: number;
    }>();
    
    (activeFiles || []).forEach(file => {
      const textbook = file.textbooks;
      if (!textbook) {
        console.warn(`[Files Tree] 파일 ${file.name}의 교재 정보 없음`);
        return;
      }
      
      const textbookId = textbook.id;
      
      if (!textbookMap.has(textbookId)) {
        textbookMap.set(textbookId, {
          id: textbook.id,
          name: textbook.name,
          dropbox_path: textbook.dropbox_path,
          files: [],
          totalClicks: 0,
          fileCount: 0,
        });
      }
      
      const textbookData = textbookMap.get(textbookId)!;
      textbookData.files.push({
        id: file.id,
        name: file.name,
        dropbox_path: file.dropbox_path,
        file_size: file.file_size,
        click_count: file.click_count,
        last_modified: file.last_modified,
      });
      textbookData.totalClicks += file.click_count || 0;
      textbookData.fileCount++;
    });
    
    console.log(`[Files Tree] ${textbookMap.size}개 교재 그룹화 완료`);
    
    // 3. Map을 배열로 변환
    let textbooksWithStats = Array.from(textbookMap.values());
    
    // 4. 정렬
    if (sortBy === 'clicks') {
      textbooksWithStats.sort((a, b) => b.totalClicks - a.totalClicks);
    } else {
      textbooksWithStats.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    console.log(`[Files Tree] 정렬 완료 (기준: ${sortBy})`);
    
    // 5. 파일 트리 구조 생성
    const tree = textbooksWithStats.map(textbook => {
      const files = textbook.files;
      
      // 파일을 경로별로 그룹화
      const filesByPath = files.reduce((acc, file) => {
        const path = file.dropbox_path || '';
        const parts = path.split('/').filter(Boolean);
        
        // 경로 구조 생성 (교재 다음 폴더들)
        let current = acc;
        for (let i = 1; i < parts.length - 1; i++) {
          const folderName = parts[i];
          
          // 교재명과 동일한 폴더명이면 스킵 (중복 방지)
          if (folderName === textbook.name) {
            continue;
          }
          
          if (!current[folderName]) {
            current[folderName] = {};
          }
          current = current[folderName];
        }
        
        // 마지막 레벨에 파일 추가
        if (!current._files) current._files = [];
        current._files.push(file);
        
        return acc;
      }, {} as any);
      
      return {
        id: textbook.id,
        name: textbook.name,
        dropbox_path: textbook.dropbox_path,
        totalClicks: textbook.totalClicks,
        fileCount: textbook.fileCount,
        children: filesByPath,
      };
    });
    
    console.log(`[Files Tree] 트리 구조 생성 완료, 최종 교재 수: ${tree.length}`);
    
    return NextResponse.json({
      success: true,
      data: tree,
      sortBy,
      stats: {
        totalTextbooks: tree.length,
        totalFiles: activeFiles?.length || 0,
      },
    });
  } catch (error) {
    console.error('[Files Tree] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

