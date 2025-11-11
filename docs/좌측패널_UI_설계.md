# 좌측 패널 UI 설계 - 교재 트리 + 클릭수 표시

## 📐 레이아웃 구조

### 전체 화면 비율 (1920px 기준)
```
┌─────────┬──────────────────────┬─────────┐
│  좌측    │       중앙 (PDF)      │  우측    │
│  280px  │    1360px (flex-1)   │  280px  │
│  14.6%  │       70.8%          │  14.6%  │
└─────────┴──────────────────────┴─────────┘
```

### 좌측 패널 상세 (280px)
```
┌───────────────────────────────┐
│ 🔍 검색창                      │
│ [이름순▼] [클릭수순] [🔄]     │  ← 상단 (60px)
├───────────────────────────────┤
│                               │
│ 📚 중학영어 (1,245) 🔥         │  ← 교재
│   ├─ 📁 1학년                  │
│   │  ├─ 📁 문법                │
│   │  │  ├─ 📄 현재시제 (35)    │  ← 파일
│   │  │  └─ 📄 과거시제 (42)    │
│   │  └─ 📁 독해                │
│   │     └─ 📄 지문1 (18)       │
│   └─ 📁 2학년                  │
│      └─ 📄 종합 (28)           │
│                               │
│ 📚 고등영어 (856)              │  ← 스크롤 영역
│   └─ 📁 수능대비               │
│      └─ 📄 모의고사 (156)      │
│                               │
│ 📚 초등영어 (423)              │
│   └─ ...                      │
│                               │
├───────────────────────────────┤
│ 마지막 동기화: 2분 전 ✅       │  ← 하단 (80px)
│ [+ 교재 요청하기]              │
└───────────────────────────────┘

높이: 100vh
너비: 280px (고정)
스크롤: 중간 영역만
```

---

## 🎨 컴포넌트 구조

### 1. `LeftPanel.tsx` (전체 컨테이너)
```tsx
<div className="left-panel">
  <LeftPanelHeader />      {/* 검색 + 정렬 + 동기화 */}
  <FileTreeContainer />     {/* 트리 뷰 영역 */}
  <LeftPanelFooter />       {/* 동기화 상태 + 요청 */}
</div>
```

### 2. `LeftPanelHeader.tsx` (상단 컨트롤)
```tsx
<div className="left-panel-header">
  <SearchBar 
    placeholder="교재 또는 파일 검색..."
    onSearch={handleSearch}
  />
  
  <div className="controls">
    <SortToggle 
      mode={sortMode}           // 'name' | 'clicks'
      onChange={handleSortChange}
    />
    
    <SyncButton 
      onSync={handleManualSync}
      isSyncing={isSyncing}
    />
  </div>
</div>
```

**SortToggle UI:**
```tsx
// 이름순 선택 시
┌─────────┬─────────┐
│ 이름순 ▼ │ 클릭수순 │
└─────────┴─────────┘

// 클릭수순 선택 시
┌─────────┬─────────┐
│  이름순  │클릭수순▼ │
└─────────┴─────────┘
```

### 3. `FileTreeContainer.tsx` (트리 영역)
```tsx
<ScrollArea className="file-tree-container">
  {textbooks.map(textbook => (
    <TextbookItem 
      key={textbook.id}
      textbook={textbook}
      totalClicks={textbook.totalClicks}
      isExpanded={expandedIds.includes(textbook.id)}
      onToggle={handleToggle}
    />
  ))}
</ScrollArea>
```

### 4. `TextbookItem.tsx` (교재 헤더)
```tsx
<div className="textbook-item">
  <div className="textbook-header" onClick={handleToggle}>
    <ChevronRight className={isExpanded ? 'rotate-90' : ''} />
    <BookIcon />
    <span className="textbook-name">{textbook.name}</span>
    
    {/* 클릭수 뱃지 */}
    <Badge variant={getBadgeVariant(totalClicks)}>
      {formatNumber(totalClicks)}
    </Badge>
    
    {/* Top 3 표시 */}
    {rank <= 3 && <FireIcon className="popular-icon" />}
  </div>
  
  {isExpanded && (
    <div className="textbook-children">
      {chapters.map(chapter => (
        <ChapterItem key={chapter.id} chapter={chapter} />
      ))}
    </div>
  )}
</div>
```

**뱃지 스타일 (클릭수에 따라):**
- 1000+ : 빨간색 + 불꽃 아이콘 🔥
- 500-999 : 주황색
- 100-499 : 파란색
- 0-99 : 회색

### 5. `ChapterItem.tsx` (단원)
```tsx
<div className="chapter-item">
  <div className="chapter-header" onClick={handleToggle}>
    <ChevronRight className={isExpanded ? 'rotate-90' : ''} />
    <FolderIcon />
    <span className="chapter-name">{chapter.name}</span>
  </div>
  
  {isExpanded && (
    <div className="chapter-children">
      {files.map(file => (
        <FileItem key={file.id} file={file} />
      ))}
    </div>
  )}
</div>
```

### 6. `FileItem.tsx` (PDF 파일)
```tsx
<div 
  className="file-item"
  onClick={() => handleFileClick(file)}
>
  <FileTextIcon />
  <span className="file-name">{file.name}</span>
  
  {/* 클릭수 (작게) */}
  <span className="click-count">
    ({file.click_count})
  </span>
</div>
```

### 7. `LeftPanelFooter.tsx` (하단)
```tsx
<div className="left-panel-footer">
  <SyncStatus 
    lastSyncTime={lastSyncTime}
    syncStatus={syncStatus}
  />
  
  <Button 
    variant="ghost" 
    onClick={handleRequestTextbook}
  >
    <PlusIcon />
    교재 요청하기
  </Button>
</div>
```

---

## 🎯 주요 기능

### 1. 교재별 클릭수 집계 로직

```typescript
// hooks/useTextbookStats.ts
export function useTextbookStats() {
  const [textbooks, setTextbooks] = useState<TextbookWithStats[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchTextbooksWithClicks() {
      // 1. 모든 교재와 하위 파일 가져오기
      const { data } = await supabase
        .from('textbooks')
        .select(`
          *,
          chapters (
            id,
            name,
            files (
              id,
              name,
              click_count
            )
          )
        `)
        .eq('chapters.files.is_active', true)
        .eq('chapters.files.file_type', 'pdf');

      // 2. 교재별 총 클릭수 계산
      const withStats = data?.map(textbook => ({
        ...textbook,
        totalClicks: textbook.chapters
          .flatMap(ch => ch.files)
          .reduce((sum, file) => sum + (file.click_count || 0), 0)
      })) || [];

      setTextbooks(withStats);
    }

    fetchTextbooksWithClicks();

    // 3. Realtime 구독 (클릭수 업데이트 감지)
    const channel = supabase
      .channel('file_clicks_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'files',
          filter: 'is_active=eq.true'
        },
        () => {
          // 클릭수 변경 시 리프레시
          fetchTextbooksWithClicks();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return { textbooks };
}
```

### 2. 정렬 기능

```typescript
// hooks/useTextbookSort.ts
type SortMode = 'name' | 'clicks';

export function useTextbookSort(textbooks: TextbookWithStats[]) {
  const [sortMode, setSortMode] = useState<SortMode>('name');

  const sortedTextbooks = useMemo(() => {
    const sorted = [...textbooks];

    if (sortMode === 'name') {
      // 이름순 (가나다순)
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    } else {
      // 클릭수 많은 순
      sorted.sort((a, b) => b.totalClicks - a.totalClicks);
    }

    return sorted;
  }, [textbooks, sortMode]);

  // 로컬 스토리지에 정렬 모드 저장
  useEffect(() => {
    localStorage.setItem('textbook-sort-mode', sortMode);
  }, [sortMode]);

  // 초기 로드 시 저장된 정렬 모드 복원
  useEffect(() => {
    const saved = localStorage.getItem('textbook-sort-mode');
    if (saved === 'name' || saved === 'clicks') {
      setSortMode(saved);
    }
  }, []);

  return { sortedTextbooks, sortMode, setSortMode };
}
```

### 3. 검색 필터링

```typescript
// hooks/useTextbookSearch.ts
export function useTextbookSearch(textbooks: TextbookWithStats[]) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTextbooks = useMemo(() => {
    if (!searchTerm.trim()) return textbooks;

    const term = searchTerm.toLowerCase();

    return textbooks
      .map(textbook => {
        // 교재명 매칭
        const textbookMatches = textbook.name.toLowerCase().includes(term);

        // 하위 챕터/파일 매칭
        const filteredChapters = textbook.chapters
          .map(chapter => {
            const chapterMatches = chapter.name.toLowerCase().includes(term);
            
            const filteredFiles = chapter.files.filter(file =>
              file.name.toLowerCase().includes(term)
            );

            if (chapterMatches || filteredFiles.length > 0) {
              return {
                ...chapter,
                files: filteredFiles.length > 0 ? filteredFiles : chapter.files
              };
            }
            return null;
          })
          .filter(Boolean);

        if (textbookMatches || filteredChapters.length > 0) {
          return {
            ...textbook,
            chapters: filteredChapters.length > 0 ? filteredChapters : textbook.chapters
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [textbooks, searchTerm]);

  return { filteredTextbooks, searchTerm, setSearchTerm };
}
```

---

## 🎨 스타일 가이드

### 클릭수 뱃지 스타일

```tsx
// components/sidebar/ClickBadge.tsx
function ClickBadge({ count, rank }: { count: number; rank?: number }) {
  const variant = useMemo(() => {
    if (count >= 1000) return 'destructive';  // 빨간색
    if (count >= 500) return 'warning';       // 주황색
    if (count >= 100) return 'default';       // 파란색
    return 'secondary';                       // 회색
  }, [count]);

  return (
    <Badge variant={variant} className="click-badge">
      {formatNumber(count)}
      {rank && rank <= 3 && <FireIcon className="ml-1" />}
    </Badge>
  );
}

function formatNumber(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}
```

### CSS 클래스

```css
.textbook-item {
  /* 클릭수 많은 교재 강조 */
  &.top-rank {
    background: linear-gradient(90deg, #fef3c7 0%, transparent 100%);
    border-left: 3px solid #f59e0b;
  }

  &.top-1 { border-left-color: #ef4444; }  /* 빨강 */
  &.top-2 { border-left-color: #f59e0b; }  /* 주황 */
  &.top-3 { border-left-color: #eab308; }  /* 노랑 */
}

.click-badge {
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: auto;
  
  &.high-clicks {
    animation: pulse 2s infinite;
  }
}

.file-item .click-count {
  font-size: 0.7rem;
  color: var(--muted-foreground);
  margin-left: auto;
}
```

---

## 📊 실시간 업데이트 플로우

```
사용자 A가 PDF 클릭
    ↓
클릭 추적 API (/api/track)
    ↓
files 테이블 click_count + 1 (UPDATE)
    ↓
Supabase Realtime 브로드캐스트
    ↓
사용자 B의 브라우저 (구독 중)
    ↓
useTextbookStats 훅이 감지
    ↓
교재별 총 클릭수 재계산
    ↓
UI 자동 업데이트 (뱃지 숫자 변경)
```

---

## 🎯 사용자 시나리오

### 시나리오 1: 인기 교재 찾기
```
1. 사용자가 좌측 패널 접속
2. [클릭수순] 토글 클릭
3. 교재가 클릭수 많은 순으로 재정렬
4. Top 3 교재에 🔥 아이콘 표시
5. 첫 번째 교재 (가장 인기) 클릭
6. 하위 파일들도 클릭수가 표시됨
```

### 시나리오 2: 특정 교재 검색
```
1. 검색창에 "중학" 입력
2. "중학영어" 교재만 필터링되어 표시
3. 클릭수 (1,245) 확인
4. 교재 펼쳐서 파일 탐색
```

### 시나리오 3: 실시간 클릭수 업데이트
```
1. 사용자 A가 "현재시제.pdf" 클릭
2. 클릭수 35 → 36으로 증가
3. 중학영어 교재 총 클릭수 1,245 → 1,246
4. 사용자 B의 화면에 즉시 반영 (Realtime)
```

---

## 🔧 개발 우선순위

### Phase 1: 기본 구조 (Task 5, 6)
- ✅ 트리 뷰 기본 구조
- ✅ 교재/챕터/파일 렌더링
- ✅ 펼치기/접기 기능

### Phase 2: 클릭수 표시 (Task 5)
- ✅ 교재별 총 클릭수 계산
- ✅ 개별 파일 클릭수 표시
- ✅ 뱃지 UI 컴포넌트
- ✅ Top 3 강조 표시

### Phase 3: 정렬 및 검색 (Task 7)
- ✅ 이름순 정렬
- ✅ 클릭수순 정렬
- ✅ 정렬 토글 UI
- ✅ 검색 필터링

### Phase 4: 실시간 업데이트 (Task 5, 13)
- ✅ Realtime 구독
- ✅ 클릭수 자동 갱신
- ✅ 애니메이션 효과

---

**작성일**: 2025-11-10
**버전**: 1.0

