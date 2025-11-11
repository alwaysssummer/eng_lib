import { NextResponse } from 'next/server';
import { createApiClient } from '@/lib/supabase/api';

/**
 * 관리자: 교재명을 실제 Dropbox 폴더명으로 수정
 * POST /api/admin/fix-textbook-names
 */
export async function POST() {
  try {
    const supabase = createApiClient();
    
    console.log('[Fix Textbook Names] 수정 시작...');
    
    // 모든 교재 조회
    const { data: textbooks } = await supabase
      .from('textbooks')
      .select('id, name');
    
    if (!textbooks) {
      return NextResponse.json({ error: '교재를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    const updates = [];
    
    for (const textbook of textbooks) {
      // 해당 교재의 첫 번째 파일 경로에서 실제 폴더명 추출
      const { data: firstFile } = await supabase
        .from('files')
        .select('dropbox_path')
        .eq('textbook_id', textbook.id)
        .eq('is_active', true)
        .limit(1)
        .single();
      
      if (firstFile) {
        const rootPath = process.env.DROPBOX_ROOT_PATH || '';
        let relativePath = firstFile.dropbox_path;
        if (rootPath && firstFile.dropbox_path.toLowerCase().startsWith(rootPath.toLowerCase())) {
          relativePath = firstFile.dropbox_path.substring(rootPath.length);
        }
        
        const parts = relativePath.split('/').filter(Boolean);
        const actualFolderName = parts[0]; // 실제 Dropbox 폴더명
        
        // 대소문자가 다르면 수정
        if (actualFolderName !== textbook.name) {
          console.log(`[Fix] ${textbook.name} → ${actualFolderName}`);
          
          const { error } = await supabase
            .from('textbooks')
            .update({ name: actualFolderName })
            .eq('id', textbook.id);
          
          if (error) {
            console.error(`[Fix] 수정 실패: ${textbook.name}`, error);
          } else {
            updates.push({
              old: textbook.name,
              new: actualFolderName,
            });
          }
        }
      }
    }
    
    console.log(`[Fix Textbook Names] 완료: ${updates.length}개 수정됨`);
    
    return NextResponse.json({
      success: true,
      message: `${updates.length}개 교재명이 수정되었습니다.`,
      updates,
    });
  } catch (error) {
    console.error('[Fix Textbook Names] 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

