'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useFile } from '@/contexts/FileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Folder,
  Search,
  RefreshCw,
  Flame,
  Book
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  dropbox_path: string;
  click_count: number;
  file_size: number;
  last_modified: string;
}

interface TextbookItem {
  id: string;
  name: string;
  dropbox_path: string;
  totalClicks: number;
  fileCount: number;
  children: any;
}

export default function LeftSidebar() {
  const { selectFile } = useFile();
  const [textbooks, setTextbooks] = useState<TextbookItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'clicks'>('name');
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');

  // 데이터 로드
  const loadData = async () => {
    try {
      const res = await fetch(`/api/files/tree?sort=${sortBy}`);
      const json = await res.json();
      
      if (json.success) {
        setTextbooks(json.data);
        setLastSync(new Date().toLocaleTimeString('ko-KR'));
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sortBy]);

  // Supabase Realtime 구독
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel('files-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'files' },
        () => {
          console.log('[Realtime] 파일 변경 감지 - 새로고침');
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'textbooks' },
        () => {
          console.log('[Realtime] 교재 변경 감지 - 새로고침');
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sortBy]);

  // 폴더 토글
  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  // 검색 필터
  const filteredTextbooks = textbooks.filter(tb => 
    tb.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 폴더 트리 렌더링
  const renderFolder = (name: string, children: any, path: string, level: number = 0) => {
    const isExpanded = expandedFolders.has(path);
    const files = children._files || [];
    const subFolders = Object.keys(children).filter(key => key !== '_files');
    
    return (
      <div key={path} className="select-none">
        <div
          className="flex items-center gap-0.5 px-2 py-0.5 hover:bg-accent rounded cursor-pointer"
          style={{ paddingLeft: `${level * 10 + 8}px` }}
          onClick={() => toggleFolder(path)}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
          )}
          {/* level 1 (단원명)만 폴더 아이콘 표시 */}
          {level === 1 && <Folder className="w-3 h-3 flex-shrink-0 text-blue-500" />}
          <span className="text-xs truncate">{name}</span>
        </div>

        {isExpanded && (
          <div>
            {/* 하위 폴더 */}
            {subFolders.map(folderName => 
              renderFolder(folderName, children[folderName], `${path}/${folderName}`, level + 1)
            )}

            {/* 파일 목록 */}
            {files.map((file: FileItem) => (
              <div
                key={file.id}
                className="flex items-center gap-0.5 px-2 py-0.5 hover:bg-accent rounded cursor-pointer"
                style={{ paddingLeft: `${(level + 1) * 10 + 8}px` }}
                onClick={() => selectFile(file)}
              >
                <FileText className="w-3 h-3 flex-shrink-0 text-red-500" />
                <span className="text-xs truncate flex-1">{file.name}</span>
                {file.click_count > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {file.click_count}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 상단: 검색 및 정렬 */}
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="교재 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('name')}
            className="flex-1"
          >
            이름순
          </Button>
          <Button
            variant={sortBy === 'clicks' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('clicks')}
            className="flex-1"
          >
            클릭순
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 중앙: 교재 목록 */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredTextbooks.map((textbook) => (
          <div key={textbook.id} className="mb-1">
            <div
              className="flex items-center gap-1.5 px-2 py-1 hover:bg-accent rounded cursor-pointer"
              onClick={() => toggleFolder(textbook.id)}
            >
              {expandedFolders.has(textbook.id) ? (
                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              )}
              <Book className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600" />
              <span className="flex-1 truncate text-sm font-medium">{textbook.name}</span>
              
              {textbook.totalClicks > 0 && (
                <>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {textbook.totalClicks}
                  </Badge>
                  {sortBy === 'clicks' && textbook.totalClicks > 100 && (
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                  )}
                </>
              )}
            </div>

            {expandedFolders.has(textbook.id) && (
              <div className="mt-0.5">
                {(() => {
                  const folderNames = Object.keys(textbook.children).filter(key => key !== '_files');
                  // 중복 제거
                  const uniqueFolderNames = Array.from(new Set(folderNames));
                  
                  return uniqueFolderNames.map(folderName => 
                    renderFolder(
                      folderName,
                      textbook.children[folderName],
                      `${textbook.id}/${folderName}`,
                      1
                    )
                  );
                })()}
                
                {/* 루트 레벨 파일 */}
                {textbook.children._files?.map((file: FileItem) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-0.5 px-2 py-0.5 hover:bg-accent rounded cursor-pointer ml-5"
                    onClick={() => selectFile(file)}
                  >
                    <FileText className="w-3 h-3 flex-shrink-0 text-red-500" />
                    <span className="text-xs truncate flex-1">{file.name}</span>
                    {file.click_count > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">
                        {file.click_count}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 하단: 동기화 상태 */}
      <div className="p-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>마지막 동기화:</span>
          <span>{lastSync || '-'}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span>교재 {filteredTextbooks.length}개</span>
          <span className="text-green-600">✓ 동기화됨</span>
        </div>
      </div>
    </div>
  );
}

